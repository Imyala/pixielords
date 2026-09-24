// The world engine: collision, raycasts and reusable builders. The level itself (layout, foes, Moonwells,
// lanterns, gates) is data in src/levels/*.js; World builds whatever level it is given.
// Collision is 2D in XZ: oriented boxes and cylinders, with heights for camera and line-of-sight rays.
import * as THREE from 'three';
import { flagstone, brick, grass, arenaStone, forestFloor, rockFace, thatch, caveFloor, snowField, lakeIce, runeCircle, glowTexture, skyTexture } from './textures.js';
import { rng, clamp, lerp } from './util.js';

// ---------------------------------------------------------------- geometry helpers
export function scaleUV(geo, su, sv) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  return geo;
}

// Box with texel density `tile` metres per repeat on every face.
export function boxGeo(w, h, d, tile = 3) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];   // px nx py ny pz nz
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    uv.setXY(i, uv.getX(i) * faces[f][0] / tile, uv.getY(i) * faces[f][1] / tile);
  }
  return g;
}

export function merge(geos) {
  let nv = 0, ni = 0;
  for (const g of geos) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni);
  let vo = 0, io = 0;
  for (const g of geos) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv, c = p.count;
    pos.set(p.array, vo * 3); nrm.set(n.array, vo * 3);
    if (u) uv.set(u.array, vo * 2);
    if (g.index) { for (let i = 0; i < g.index.count; i++) idx[io + i] = g.index.array[i] + vo; io += g.index.count; }
    else { for (let i = 0; i < c; i++) idx[io + i] = vo + i; io += c; }
    vo += c;
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  m.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  m.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  m.setIndex(new THREE.BufferAttribute(idx, 1));
  m.computeBoundingSphere();
  return m;
}

// Aurora curtains: ribbons of light that ripple across the northern sky.
const AURORA_VERT = `uniform float uTime; varying vec2 vUv;
void main(){ vUv = uv; vec3 p = position; p.z += sin(uv.x * 9. + uTime * .12) * 18. + sin(uv.x * 23. - uTime * .2) * 6.; p.y += sin(uv.x * 5. + uTime * .08) * 10.;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`;
const AURORA_FRAG = `uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform float uK; varying vec2 vUv;
void main(){
  float x = vUv.x, v = vUv.y;
  float w = sin(x * 17. + uTime * .35) * .5 + sin(x * 41. - uTime * .6) * .25;
  float rays = pow(abs(sin(x * 70. + w * 3. + uTime * .15)), 2.) * .45 + .55;
  float fold = .6 + .4 * sin(x * 9. - uTime * .25 + w * 2.);
  float fade = smoothstep(0., .05, v) * pow(1. - v, 1.8) * fold * smoothstep(0., .12, x) * smoothstep(1., .88, x);
  vec3 col = mix(uA, uB, smoothstep(.15, .95, v));
  gl_FragColor = vec4(col * rays * fade * uK, 1.);
}`;

const FOG_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`;
const FOG_FRAG = `
uniform float uTime; uniform float uOpacity; varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for(int i = 0; i < 5; i++){ s += a*noise(p); p *= 2.03; a *= .5; } return s; }
void main(){
  vec2 p = vUv * vec2(2.5, 3.);
  float n = fbm(p + vec2(uTime*.12, -uTime*.05));
  float m = fbm(p*1.6 - vec2(uTime*.08, uTime*.22) + n*1.5);
  float a = smoothstep(.3, .85, m) * .6 + .1;
  float threads = pow(abs(sin((vUv.x * 18. + n * 4.) + uTime * .6)), 24.) * .6 + pow(abs(sin(vUv.y * 22. - uTime * .4 + m * 5.)), 30.) * .4;
  float edge = smoothstep(0., .1, vUv.x) * smoothstep(1., .9, vUv.x) * smoothstep(0., .05, vUv.y) * smoothstep(1., .7, vUv.y);
  vec3 col = mix(vec3(.45, .18, .75), vec3(1., .55, .95), m) + threads * vec3(1., .85, 1.);
  gl_FragColor = vec4(col * (.5 + m * .6), (a + threads * .5) * edge * uOpacity);
}`;

// See-through cutout: walls and pillars between the camera and the knight dissolve in a dithered disc,
// so the player never loses sight of their character. uCut = (x px, y px, radius px), uCutDepth = view depth.
export const CUT = { uCut: { value: new THREE.Vector3() }, uCutDepth: { value: 0 } };
function cutout(mat) {
  mat.onBeforeCompile = shader => {
    shader.uniforms.uCut = CUT.uCut; shader.uniforms.uCutDepth = CUT.uCutDepth;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vCutDepth;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvCutDepth = -mvPosition.z;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uCut; uniform float uCutDepth; varying float vCutDepth;')
      .replace('void main() {', `void main() {
        if (uCut.z > 0. && vCutDepth < uCutDepth - .7) {
          float d = length(gl_FragCoord.xy - uCut.xy) / uCut.z;
          float n = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);
          if (d < 1. && n > smoothstep(.55, 1., d)) discard;
        }`);
  };
  return mat;
}

// Procedural textures are slow to paint, so every level shares one cache.
const TEX = {};
const tex = (k, f) => (TEX[k] ||= f());

// ---------------------------------------------------------------- the world
export class World {
  constructor(G, level) {
    this.G = G;
    this.level = level;
    this.scene = G.scene;
    this.boxes = [];       // {x, z, hw, hd, c, s, y0, h, on}
    this.cyls = [];        // {x, z, r, h, on}
    this.flames = [];      // flame sources: {x, y, z, color, base, phase}
    this.anim = [];        // per-frame callbacks
    this.interactables = [];
    this.batches = {};     // material key -> geometries merged at the end of the build
    this.breaks = [];      // ice that gives way mid-fight (hidden until then)
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.build();
  }

  dispose() {
    this.scene.remove(this.group, this.sky);
    for (const l of this.lightPool) this.scene.remove(l);
    const seen = new Set();
    const free = o => {
      if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of ms) if (!seen.has(m)) { seen.add(m); m.dispose(); }
    };
    this.group.traverse(free); this.sky.traverse(free);
  }

  // ---------------- colliders
  addBox(x, z, hw, hd, rot = 0, h = 6, y0 = 0) {
    const b = { x, z, hw, hd, c: Math.cos(rot), s: Math.sin(rot), rot, y0, h, on: true, rad: Math.hypot(hw, hd), cam: true };
    this.boxes.push(b);
    return b;
  }
  addCyl(x, z, r, h = 6, cam = true) { const c = { x, z, r, h, on: true, cam }; this.cyls.push(c); return c; }
  prop(c) { c.cam = false; return c; }   // blocks bodies but not the camera

  // Push a circle (pos.x, pos.z, radius) out of every collider. Returns true when it touched something.
  collide(pos, r) {
    let hit = false;
    for (let pass = 0; pass < 2; pass++) {
      for (const b of this.boxes) {
        if (!b.on) continue;
        const dx = pos.x - b.x, dz = pos.z - b.z;
        if (Math.abs(dx) > b.rad + r || Math.abs(dz) > b.rad + r) continue;
        const lx = b.c * dx - b.s * dz, lz = b.s * dx + b.c * dz;
        const qx = clamp(lx, -b.hw, b.hw), qz = clamp(lz, -b.hd, b.hd);
        let ex = lx - qx, ez = lz - qz, d = Math.hypot(ex, ez);
        if (d >= r) continue;
        let px, pz;
        if (d > 1e-5) { px = ex / d * (r - d); pz = ez / d * (r - d); }
        else {
          const ox = b.hw - Math.abs(lx), oz = b.hd - Math.abs(lz);
          if (ox < oz) { px = Math.sign(lx || 1) * (ox + r); pz = 0; } else { px = 0; pz = Math.sign(lz || 1) * (oz + r); }
        }
        pos.x += b.c * px + b.s * pz; pos.z += -b.s * px + b.c * pz;
        hit = true;
      }
      for (const c of this.cyls) {
        if (!c.on) continue;
        const dx = pos.x - c.x, dz = pos.z - c.z, d = Math.hypot(dx, dz), m = c.r + r;
        if (d >= m || d < 1e-6) continue;
        pos.x += dx / d * (m - d); pos.z += dz / d * (m - d);
        hit = true;
      }
    }
    return hit;
  }

  // First hit distance along a 3D ray, or maxD.
  raycast(o, d, maxD, cam = false) {
    let best = maxD;
    for (const b of this.boxes) {
      if (!b.on || (cam && !b.cam)) continue;
      const dx = o.x - b.x, dz = o.z - b.z;
      const ox = b.c * dx - b.s * dz, oz = b.s * dx + b.c * dz, oy = o.y - (b.y0 + b.h / 2);
      const vx = b.c * d.x - b.s * d.z, vz = b.s * d.x + b.c * d.z, vy = d.y;
      let t0 = 0, t1 = best;
      const slab = (o1, v, e) => {
        if (Math.abs(v) < 1e-8) return Math.abs(o1) <= e;
        let a = (-e - o1) / v, c = (e - o1) / v;
        if (a > c) [a, c] = [c, a];
        t0 = Math.max(t0, a); t1 = Math.min(t1, c);
        return t0 <= t1;
      };
      if (slab(ox, vx, b.hw) && slab(oy, vy, b.h / 2) && slab(oz, vz, b.hd)) best = Math.min(best, t0);
    }
    for (const c of this.cyls) {
      if (!c.on || (cam && !c.cam)) continue;
      const fx = o.x - c.x, fz = o.z - c.z, a = d.x * d.x + d.z * d.z;
      if (a < 1e-8) continue;
      const bq = 2 * (fx * d.x + fz * d.z), cq = fx * fx + fz * fz - c.r * c.r, disc = bq * bq - 4 * a * cq;
      if (disc < 0) continue;
      const t = (-bq - Math.sqrt(disc)) / (2 * a);
      if (t >= 0 && t < best && o.y + d.y * t <= c.h) best = t;
    }
    return best;
  }

  los(a, b, h = 1.3) {
    const o = new THREE.Vector3(a.x, h, a.z), d = new THREE.Vector3(b.x - a.x, 0, b.z - a.z), L = d.length();
    if (L < 1e-4) return true;
    d.divideScalar(L);
    return this.raycast(o, d, L) >= L - .05;
  }

  areaAt(x, z) { return this.level.areas.find(a => x >= a.x0 && x <= a.x1 && z >= a.z0 && z <= a.z1) || null; }

  // ---------------- building
  build() {
    this.R = rng(this.level.seed || 1234);
    const T = {
      floor: tex('floor', () => flagstone(3)), wall: tex('wall', () => brick(11)), grass: tex('grass', () => grass(5)),
      arena: tex('arena', () => arenaStone(21)), pillar: tex('pillar', () => brick(17, [.9, .92, 1])),
    };
    const lazy = (k, f) => () => tex(k, f);
    this.mats = {
      floor: new THREE.MeshStandardMaterial({ ...T.floor, roughness: .92, normalScale: new THREE.Vector2(1.2, 1.2) }),
      wall: new THREE.MeshStandardMaterial({ ...T.wall, roughness: .95, normalScale: new THREE.Vector2(1.4, 1.4) }),
      grass: new THREE.MeshStandardMaterial({ ...T.grass, roughness: 1 }),
      arena: new THREE.MeshStandardMaterial({ ...T.arena, roughness: .8, emissive: 0x220202 }),
      pillar: new THREE.MeshStandardMaterial({ ...T.pillar, roughness: .9 }),
      wood: new THREE.MeshStandardMaterial({ color: 0x3b2a1c, roughness: .9 }),
      iron: new THREE.MeshStandardMaterial({ color: 0x3a3d44, roughness: .45, metalness: .8 }),
      bark: new THREE.MeshStandardMaterial({ color: 0x2a2320, roughness: 1 }),
      bone: new THREE.MeshStandardMaterial({ color: 0xc9bfa6, roughness: .7 }),
      stone: new THREE.MeshStandardMaterial({ color: 0x5a5a5e, roughness: .95 }),
    };
    // Forest and cave materials are only painted for levels that ask for them.
    if (this.level.forest || this.level.cave || this.level.frost) {
      const earth = lazy('earth', () => forestFloor(8))(), rock = lazy('rock', () => rockFace(13))(), th = lazy('thatch', () => thatch(9))();
      Object.assign(this.mats, {
        earth: new THREE.MeshStandardMaterial({ ...earth, roughness: 1 }),
        rock: new THREE.MeshStandardMaterial({ ...rock, roughness: .95, normalScale: new THREE.Vector2(1.6, 1.6) }),
        thatch: new THREE.MeshStandardMaterial({ ...th, roughness: 1 }),
        leaves: new THREE.MeshStandardMaterial({ color: 0x1f3322, roughness: 1, flatShading: true }),
        stake: new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: .9 }),
      });
    }
    if (this.level.cave) {
      const cf = lazy('cavefloor', () => caveFloor(17))();
      this.mats.cavefloor = new THREE.MeshStandardMaterial({ ...cf, roughness: .95 });
      this.mats.rock.color.setHex(0x9a92b0);   // cave stone runs cold and violet
      this.crystalMats = {};
    }
    // The Moonspire: pale marble, white stone, moon-bleached trees and still moonwater.
    if (this.level.spire) {
      const M = this.mats;
      M.marble = M.floor.clone(); M.marble.color.setHex(0xd0d8ea); M.marble.emissive = new THREE.Color(0x121828);
      M.whitestone = M.pillar.clone(); M.whitestone.color.setHex(0xf0f2fa); M.whitestone.emissive = new THREE.Color(0x1c2438);
      M.palebark = new THREE.MeshStandardMaterial({ color: 0xd4d8e6, roughness: .8 });
      M.moonwater = new THREE.MeshStandardMaterial({ color: 0x4a7ad0, emissive: 0x3a66d0, emissiveIntensity: .55, roughness: .08, metalness: .5, transparent: true, opacity: .82 });
    }
    // The Frostmere: snowfields, lake ice, clear blue ice and cold grey stone under snow.
    if (this.level.frost) {
      const M = this.mats, sn = lazy('snow', () => snowField(23))(), li = lazy('lakeice', () => lakeIce(29))();
      M.snow = new THREE.MeshStandardMaterial({ ...sn, color: 0xc4d0e6, roughness: .82, emissive: 0x0e1626 });
      M.snowcap = new THREE.MeshStandardMaterial({ color: 0xeef4ff, roughness: .9, emissive: 0x18223a, flatShading: true });
      M.lake = new THREE.MeshStandardMaterial({ ...li, color: 0xb4c2d8, roughness: .14, metalness: .3, emissive: 0x08162a });
      M.ice = new THREE.MeshStandardMaterial({ color: 0xa8d4f4, emissive: 0x1a4a7a, emissiveIntensity: .55, roughness: .08, metalness: .25, transparent: true, opacity: .86, flatShading: true });
      M.water = new THREE.MeshStandardMaterial({ color: 0x050d18, roughness: .04, metalness: .7, emissive: 0x03101e });
      M.rock.color.setHex(0x9aa4b8);
      M.leaves.color.setHex(0x1a2e2c);
      M.bark.color.setHex(0x2a2524);
    }
    for (const k of ['wall', 'pillar', 'stone', 'bark', 'wood', 'rock', 'stake', 'thatch', 'leaves', 'whitestone', 'palebark', 'snowcap', 'ice']) if (this.mats[k]) cutout(this.mats[k]);
    this.cutout = cutout;
    this.glowTex = tex('glow', () => glowTexture());
    this.starTex = tex('star', () => glowTexture('star'));

    this.buildSky();
    this.level.build(this, this.R);
    this.flush();
    this.buildShrines();
    this.buildMessages();
    this.buildItems();
    this.buildGates();
    this.lightPool = [];
    for (let i = 0; i < 6; i++) {
      const l = new THREE.PointLight(0xff8a3a, 0, 13, 1.6);
      this.scene.add(l); this.lightPool.push(l);
    }
  }

  buildSky() {
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.MeshBasicMaterial({ map: tex('sky', () => skyTexture()), side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -10;
    this.scene.add(sky); this.sky = sky;
    if (this.level.cave) sky.visible = false;   // underground: nothing overhead but the dark
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xdfe6ff, fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
    const Mn = this.level.moon || {};   // a level may hang the moon somewhere grander
    moon.position.set(...(Mn.at || [-120, 150, 260])); moon.scale.setScalar(Mn.glow || 60);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(Mn.size || 7, 48), new THREE.MeshBasicMaterial({ color: 0xeef2ff, fog: false }));
    disc.position.copy(moon.position); disc.lookAt(0, 0, 0);
    sky.add(moon, disc);
    if (this.level.aurora) this.buildAurora(this.level.aurora);
  }

  // Curtains of green and violet light hung in the sky beyond the level.
  buildAurora(o) {
    for (const [i, [x, y, z, w, ry, k]] of (o.bands || [[0, 125, 360, 560, 0, 1], [-190, 140, 290, 380, .55, .75], [200, 115, 290, 360, -.6, .85]]).entries()) {
      const mat = new THREE.ShaderMaterial({ vertexShader: AURORA_VERT, fragmentShader: AURORA_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
        uniforms: { uTime: { value: i * 7 }, uA: { value: new THREE.Color(o.a ?? 0x3cff9a) }, uB: { value: new THREE.Color(o.b ?? 0x9a5aff) }, uK: { value: .55 * k } } });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 110, 96, 1), mat);
      m.position.set(x, y, z); m.rotation.y = Math.PI + ry; m.renderOrder = -9;
      this.sky.add(m);
      this.anim.push(t => { mat.uniforms.uTime.value = t + i * 7; });
    }
  }

  // Queue geometry to be merged into one mesh per material when the build finishes.
  batch(mat, geo) { (this.batches[mat] ||= []).push(geo); return geo; }
  flush() {
    for (const [k, geos] of Object.entries(this.batches)) {
      if (!geos.length) continue;
      const m = new THREE.Mesh(merge(geos), this.mats[k]);
      m.castShadow = true; m.receiveShadow = true;
      this.group.add(m);
    }
    this.batches = {};
  }

  add(geo, mat, x, y, z, ry = 0, shadow = true) {
    const m = new THREE.Mesh(geo, typeof mat === 'string' ? this.mats[mat] : mat);
    m.position.set(x, y, z); m.rotation.y = ry;
    m.castShadow = shadow; m.receiveShadow = true; this.group.add(m); return m;
  }

  floor(x0, z0, x1, z1, mat, tile = 4, y = 0) {
    const w = x1 - x0, d = z1 - z0;
    const g = scaleUV(new THREE.PlaneGeometry(w, d), w / tile, d / tile);
    const m = new THREE.Mesh(g, typeof mat === 'string' ? this.mats[mat] : mat);
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    m.receiveShadow = true;
    this.group.add(m);
    return m;
  }

  disc(x, z, r, mat, tile = 4, y = .01) {
    const m = new THREE.Mesh(scaleUV(new THREE.CircleGeometry(r, 64), r * 2 / tile, r * 2 / tile), typeof mat === 'string' ? this.mats[mat] : mat);
    m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true;
    this.group.add(m);
    return m;
  }

  // A straight wall segment with an optional crenellated top; o: { h, th, mat, crenel, cam }.
  wall(x0, z0, x1, z1, o = {}) {
    const h = o.h ?? 6.5, TH = o.th ?? 1.2, mat = o.mat || 'wall';
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), rot = Math.atan2(-dz, dx);
    const g = boxGeo(L + TH, h, TH, 3);
    g.applyMatrix4(new THREE.Matrix4().makeRotationY(rot).setPosition((x0 + x1) / 2, h / 2, (z0 + z1) / 2));
    this.batch(mat, g);
    const b = this.addBox((x0 + x1) / 2, (z0 + z1) / 2, L / 2 + TH / 2, TH / 2, rot, h);
    if (o.cam === false) this.prop(b);
    if (o.crenel !== false && mat === 'wall') {
      for (let s = .8; s < L - .4; s += 1.6) {
        const m = boxGeo(.8, .7, TH + .1, 3);
        m.applyMatrix4(new THREE.Matrix4().makeRotationY(rot).setPosition(x0 + dx * s / L, h + .35, z0 + dz * s / L));
        this.batch(mat, m);
      }
    }
    return b;
  }
  wallPath(pts, o) { for (let i = 0; i < pts.length - 1; i++) this.wall(...pts[i], ...pts[i + 1], o); }

  pillar(x, z, r = .7, h = 7, broken = false, mat = 'pillar') {
    const hh = broken ? h * (.35 + this.R() * .3) : h;
    const g = scaleUV(new THREE.CylinderGeometry(r * .92, r, hh, 14), 2, hh / 3);
    g.translate(x, hh / 2, z); this.batch(mat, g);
    const cap = boxGeo(r * 2.6, .5, r * 2.6, 2); cap.translate(x, .25, z); this.batch(mat, cap);
    if (!broken) { const top = boxGeo(r * 2.6, .5, r * 2.6, 2); top.translate(x, hh - .25, z); this.batch(mat, top); }
    this.prop(this.addCyl(x, z, r + .05, hh));   // the camera passes pillars rather than jamming into the knight
  }

  deadTree(x, z, h, seed, collide = true, mat = 'bark') {
    const r = rng(seed);
    const trunk = new THREE.CylinderGeometry(.12, .35, h, 7); trunk.translate(x, h / 2, z);
    this.batch(mat, trunk);
    for (let i = 0; i < 6; i++) {
      const bl = 1 + r() * 1.8, br = new THREE.CylinderGeometry(.03, .12, bl, 5);
      br.translate(0, bl / 2, 0);
      br.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(.5 + r() * .7, r() * 6.28, 0, 'YXZ')));
      br.translate(x, h * (.45 + r() * .5), z);
      this.batch(mat, br);
    }
    if (collide) this.prop(this.addCyl(x, z, .4, h));
  }

  // ---- forest builders (need level.forest for their materials)
  // A broad tree: crooked trunk and a crown of faceted leaf clumps.
  tree(x, z, h, seed, collide = true) {
    const r = rng(seed * 7 + 1), lean = (r() - .5) * .25, ry = r() * 6.28;
    const trunk = new THREE.CylinderGeometry(.18 + h * .02, .32 + h * .035, h, 7);
    trunk.translate(0, h / 2, 0); trunk.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(lean, ry, 0, 'YXZ')));
    trunk.translate(x, 0, z); this.batch('bark', trunk);
    const top = { x: x + Math.sin(ry) * Math.sin(lean) * h, z: z + Math.cos(ry) * Math.sin(lean) * h };
    const n = 3 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const cr = h * (.22 + r() * .14), a = r() * 6.28, d = i ? h * (.12 + r() * .16) : 0;
      const c = this.rock(cr, seed * 13 + i, .18);
      c.scale(1, .75, 1); c.translate(top.x + Math.sin(a) * d, h * (.85 + r() * .25) - (i ? cr * .3 : 0), top.z + Math.cos(a) * d);
      this.batch('leaves', c);
    }
    if (collide) this.prop(this.addCyl(x, z, .35 + h * .03, h));
  }

  // A dark fir: stacked cones.
  pine(x, z, h, seed, collide = false) {
    const r = rng(seed * 5 + 3);
    const trunk = new THREE.CylinderGeometry(.1, .22, h * .4, 6); trunk.translate(x, h * .2, z); this.batch('bark', trunk);
    for (let i = 0; i < 3; i++) {
      const k = 1 - i * .26, c = new THREE.ConeGeometry(h * .23 * k, h * .42, 7);
      c.rotateY(r() * 6); c.translate(x, h * (.36 + i * .2) + h * .21, z); this.batch('leaves', c);
    }
    if (collide) this.prop(this.addCyl(x, z, .4, h));
  }

  // Lumpy faceted rock geometry; displacement depends only on position so shared corners stay welded.
  rock(radius, seed, rough = .28) {
    const g = new THREE.IcosahedronGeometry(radius, 1), p = g.attributes.position, s = seed * 1.7;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 / radius;
      const f = 1 + rough * (Math.sin(x * k * 3.1 + s) * Math.sin(y * k * 2.7 + s * 2) * Math.sin(z * k * 3.3 + s * 3) + Math.sin((x + z) * k * 5.3 + s) * .35);
      p.setXYZ(i, x * f, y * f, z * f);
    }
    g.computeVertexNormals();
    return g;
  }
  boulder(x, z, r, seed, collide = true, mat = 'rock') {
    const g = this.rock(r, seed); g.scale(1, .72, 1); g.rotateY(seed); g.translate(x, r * .35, z);
    this.batch(mat, g);
    if (collide) this.prop(this.addCyl(x, z, r * .85, r * 1.1));
  }

  // A cliff face: a box collider dressed with tall rock slabs elongated along the line, so it reads as
  // broken stone rather than masonry. Slabs are thin across the line so they hug the collider.
  cliff(x0, z0, x1, z1, o = {}) {
    const h = o.h ?? 7, TH = o.th ?? 1.8;
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), rot = Math.atan2(-dz, dx);
    const r = rng(Math.abs(Math.round(x0 * 131 + z0 * 71 + x1 * 37 + z1 * 17)) + 7);
    const b = this.addBox((x0 + x1) / 2, (z0 + z1) / 2, L / 2 + TH / 2, TH / 2, rot, h);
    const n = Math.max(1, Math.round(L / 2.1));
    for (let i = 0; i <= n; i++) {
      const s = i / n * L + (r() - .5) * .6, px = x0 + dx * s / L, pz = z0 + dz * s / L;
      const rad = 1.5 + r() * .9, hh = h * (.8 + r() * .45);
      const g = this.rock(rad, Math.floor(r() * 1000), .22);
      g.scale(1.3, hh * .62 / rad, .55); g.rotateY(rot + (r() - .5) * .3);
      g.translate(px, hh * .42, pz);
      this.batch('rock', g);
      if (this.level.frost) {   // snow lies along the top
        const c = this.rock(rad * .95, Math.floor(r() * 1000), .15);
        c.scale(.85, .3, .45); c.rotateY(rot + (r() - .5) * .3); c.translate(px, hh * 1.01, pz);
        this.batch('snowcap', c);
      }
    }
    return b;
  }

  // A wall of sharpened stakes lashed together.
  palisade(x0, z0, x1, z1, h = 4.6) {
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), rot = Math.atan2(-dz, dx), r = rng(Math.round(x0 * 31 + z0 * 17));
    for (let s = .18; s < L; s += .36) {
      const hh = h * (.9 + r() * .18), px = x0 + dx * s / L, pz = z0 + dz * s / L;
      const st = new THREE.CylinderGeometry(.16, .19, hh, 6); st.translate(px, hh / 2, pz); this.batch('stake', st);
      const tip = new THREE.ConeGeometry(.16, .45, 6); tip.translate(px, hh + .22, pz); this.batch('stake', tip);
    }
    for (const y of [1.1, h * .7]) {
      const b = boxGeo(L, .16, .16, 2); b.applyMatrix4(new THREE.Matrix4().makeRotationY(rot).setPosition((x0 + x1) / 2, y, (z0 + z1) / 2)); this.batch('wood', b);
    }
    return this.addBox((x0 + x1) / 2, (z0 + z1) / 2, L / 2 + .2, .3, rot, h);
  }

  // A round goblin hut: stake walls, thatch cone (or one heaped with snow), a dark doorway facing `ry`.
  hut(x, z, r, ry = 0, roofMat = 'thatch') {
    const wh = 2.3;
    const wall = scaleUV(new THREE.CylinderGeometry(r, r * 1.04, wh, 14, 1, true), r * 2, 1); wall.translate(x, wh / 2, z); this.batch('stake', wall);
    const roof = scaleUV(new THREE.ConeGeometry(r * 1.38, r * 1.25, 14, 1, true), r * 2, 1.4); roof.translate(x, wh + r * .55, z); this.batch(roofMat, roof);
    const door = boxGeo(1.1, 1.7, .2, 2); door.translate(0, .85, r - .02); door.rotateY(ry); door.translate(x, 0, z);
    (this.mats.shadowMat ||= new THREE.MeshBasicMaterial({ color: 0x050403 }));
    this.batch('shadowMat', door);
    this.addCyl(x, z, r + .1, wh + r);
  }

  // Campfire: a stone ring and crossed logs under a ground flame.
  campfire(x, z, size = 1, color = 0xff7a2a) {
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * 6.28, g = this.rock(.22 * size, i + x, .2); g.scale(1, .7, 1); g.translate(x + Math.sin(a) * .75 * size, .08, z + Math.cos(a) * .75 * size);
      this.batch('stone', g);
    }
    for (let i = 0; i < 3; i++) {
      const lg = new THREE.CylinderGeometry(.08 * size, .09 * size, 1.3 * size, 6); lg.rotateZ(Math.PI / 2 - .25); lg.rotateY(i * 2.1); lg.translate(x, .2 * size, z);
      this.batch('bark', lg);
    }
    this.prop(this.addCyl(x, z, .85 * size, .6));
    return this.brazier(x, z, color, false, size);
  }

  // ---- cave builders (need level.cave)
  // A cluster of glowing crystals that also lights the cave around it.
  crystal(x, z, h, color = 0x7fe8ff, seed = 1, light = true, collide = true) {
    const r = rng(seed * 11 + 5);
    this.crystalMats ||= {};
    const mat = this.crystalMats[color] ||= this.cutout(new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .9, roughness: .2, metalness: .1, flatShading: true }));
    const key = 'crystal' + color; this.mats[key] = mat;
    const n = 3 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const hh = h * (i ? .35 + r() * .5 : 1), rr = hh * (.14 + r() * .06), g = new THREE.OctahedronGeometry(1, 0);
      g.scale(rr, hh * .5, rr);
      g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler((r() - .5) * .9 * (i ? 1 : .3), r() * 6.28, (r() - .5) * .9 * (i ? 1 : .3))));
      g.translate(x + (i ? (r() - .5) * h * .5 : 0), hh * .38, z + (i ? (r() - .5) * h * .5 : 0));
      this.batch(key, g);
    }
    if (collide) this.prop(this.addCyl(x, z, h * .22 + .2, h));
    if (!light) return;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .45 }));
    glow.position.set(x, h * .5, z); glow.scale.setScalar(h * 1.4); this.group.add(glow);
    const src = { x, y: h * .7, z, color: new THREE.Color(color), base: 4 + h * .8, phase: r() * 10 };
    this.flames.push(src);
    this.anim.push(t => { src.flick = .85 + Math.sin(t * 1.3 + src.phase) * .15; });
  }

  // Mine props: timber frames across a tunnel, rails, a cart, stalagmites and rat nests.
  timber(x0, z0, x1, z1, h = 4.4) {
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), rot = Math.atan2(-dz, dx);
    for (const [px, pz] of [[x0, z0], [x1, z1]]) {
      const post = boxGeo(.3, h, .3, 1.5); post.translate(px, h / 2, pz); this.batch('wood', post);
      this.prop(this.addCyl(px, pz, .22, h));
    }
    const beam = boxGeo(L + .5, .34, .34, 1.5); beam.applyMatrix4(new THREE.Matrix4().makeRotationY(rot).setPosition((x0 + x1) / 2, h, (z0 + z1) / 2)); this.batch('wood', beam);
  }
  rails(pts) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), rot = Math.atan2(-dz, dx);
      const nx = -dz / L, nz = dx / L;
      for (const s of [-.45, .45]) {
        const rail = boxGeo(L + .1, .06, .07, 1); rail.applyMatrix4(new THREE.Matrix4().makeRotationY(rot).setPosition((x0 + x1) / 2 + nx * s, .1, (z0 + z1) / 2 + nz * s)); this.batch('iron', rail);
      }
      for (let d = .3; d < L; d += .7) {
        const sl = boxGeo(.18, .06, 1.25, 1); sl.applyMatrix4(new THREE.Matrix4().makeRotationY(rot).setPosition(x0 + dx * d / L, .04, z0 + dz * d / L)); this.batch('wood', sl);
      }
    }
  }
  cart(x, z, ry = 0, tipped = false) {
    const c = new THREE.Group(), M = this.mats;
    const bin = new THREE.Mesh(boxGeo(1.5, .8, 1.0, 1), M.wood); bin.position.y = .75; c.add(bin);
    const ore = new THREE.Mesh(this.rock(.45, 3, .3), this.crystalMats[0x7fe8ff] || M.stone); ore.position.y = 1.15; ore.scale.set(1.3, .6, 1); c.add(ore);
    for (const [wx, wz] of [[-.5, .52], [.5, .52], [-.5, -.52], [.5, -.52]]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .08, 10), M.iron); wh.rotation.x = Math.PI / 2; wh.position.set(wx, .25, wz); c.add(wh); }
    c.position.set(x, 0, z); c.rotation.y = ry; if (tipped) { c.rotation.z = 1.2; c.position.y = .35; }
    c.traverse(o => { o.castShadow = true; }); this.group.add(c);
    this.prop(this.addBox(x, z, .8, .55, ry, 1.2));
  }
  stalagmite(x, z, h, seed, collide = false) {
    const g = this.rock(1, seed, .3); g.scale(h * .22, h * .55, h * .22); g.translate(x, h * .35, z); this.batch('rock', g);
    if (collide) this.prop(this.addCyl(x, z, h * .18, h));
  }
  nest(x, z, r = 1.2) {
    const g = new THREE.ConeGeometry(r, r * .45, 9, 1); g.translate(x, r * .2, z); this.batch('thatch', g);
    this.prop(this.addCyl(x, z, r * .7, .5));
  }

  // ---- Frostmere builders (need level.frost)
  // A fir under snow: dark tiers, each capped white.
  snowPine(x, z, h, seed, collide = false) {
    const r = rng(seed * 5 + 3);
    const trunk = new THREE.CylinderGeometry(.1, .22, h * .4, 6); trunk.translate(x, h * .2, z); this.batch('bark', trunk);
    for (let i = 0; i < 3; i++) {
      const k = 1 - i * .26, ry = r() * 6, y = h * (.36 + i * .2) + h * .21;
      const c = new THREE.ConeGeometry(h * .23 * k, h * .42, 7); c.rotateY(ry); c.translate(x, y, z); this.batch('leaves', c);
      const cap = new THREE.ConeGeometry(h * .19 * k, h * .28, 7); cap.rotateY(ry); cap.translate(x, y + h * .08, z); this.batch('snowcap', cap);
    }
    if (collide) this.prop(this.addCyl(x, z, .4, h));
  }
  // A low drift of snow (no collider: it is only knee-deep).
  drift(x, z, r, seed) { const g = this.rock(r, seed, .15); g.scale(1, .3, 1); g.rotateY(seed); g.translate(x, -r * .04, z); this.batch('snowcap', g); }
  // A boulder with snow on its back.
  snowBoulder(x, z, r, seed, collide = true) {
    this.boulder(x, z, r, seed, collide);
    const cap = this.rock(r * .92, seed + 1, .12); cap.scale(1, .36, 1); cap.rotateY(seed); cap.translate(x, r * .62, z); this.batch('snowcap', cap);
  }
  // A frozen waterfall: a curtain of ice columns down a cliff face.
  icefall(x0, z0, x1, z1, h = 8) {
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), rot = Math.atan2(-dz, dx), r = rng(Math.round(x0 * 13 + z1 * 7) + 3);
    for (let s = .3; s < L; s += .45) {
      const hh = h * (.6 + r() * .45), g = new THREE.OctahedronGeometry(1, 0);
      g.scale(.28 + r() * .22, hh / 2, .3 + r() * .2); g.rotateY(rot + (r() - .5) * .4); g.translate(x0 + dx * s / L + (r() - .5) * .2, hh / 2 + r() * .5, z0 + dz * s / L + (r() - .5) * .3);
      this.batch('ice', g);
    }
    return this.addBox((x0 + x1) / 2, (z0 + z1) / 2, L / 2, .7, rot, h);
  }
  // Ice that breaks open into black water when an arena gives way. Hidden until setBreaks(true).
  iceBreak(x, z, r) {
    const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.visible = false;
    const R = rng(Math.round(x * 17 + z * 5) + 11), n = 11, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = r * (.8 + R() * .35); pts.push(new THREE.Vector2(Math.sin(a) * rr, Math.cos(a) * rr)); }
    const water = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts)), this.mats.water);
    water.rotation.x = -Math.PI / 2; water.position.y = .03; grp.add(water);
    for (let i = 0; i < n; i++) {   // floes tipped up round the rim
      const a = (i + .5) / n * Math.PI * 2, f = new THREE.Mesh(boxGeo(.9 + R() * .9, .18, .6 + R() * .5, 1), this.mats.ice);
      f.position.set(Math.sin(a) * r * 1.02, .08, Math.cos(a) * r * 1.02); f.rotation.set((R() - .5) * .5, -a, (R() - .5) * .6); f.castShadow = true; grp.add(f);
    }
    this.group.add(grp); this.breaks.push(grp);
  }
  setBreaks(on) {
    if (on && !this.breaksOn) for (const b of this.breaks) { this.G.fx?.shatter({ x: b.position.x, y: .3, z: b.position.z }, 40, 0xdff4ff, 5); this.G.fx?.spikes(b.position, 1.4, 0xbfe6ff, 6, 1.2); }
    this.breaksOn = on; for (const b of this.breaks) b.visible = on;
  }

  // ---- Moonspire builders (need level.spire)
  // A knee-high balustrade: base, rail and posts. It stops the knight, not the camera.
  balustrade(x0, z0, x1, z1) {
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), rot = Math.atan2(-dz, dx);
    const at = (geo, y, s = .5) => { geo.applyMatrix4(new THREE.Matrix4().makeRotationY(rot).setPosition(x0 + dx * s, y, z0 + dz * s)); this.batch('whitestone', geo); };
    at(boxGeo(L + .3, .22, .5, 1.5), .11); at(boxGeo(L + .3, .14, .42, 1.5), 1.02);
    for (let d = .4; d < L - .2; d += .55) { const b = new THREE.CylinderGeometry(.07, .09, .8, 6); at(b, .6, d / L); }
    return this.prop(this.addBox((x0 + x1) / 2, (z0 + z1) / 2, L / 2 + .15, .3, rot, 1.1));
  }
  balustradePath(pts) { for (let i = 0; i < pts.length - 1; i++) this.balustrade(...pts[i], ...pts[i + 1]); }

  // A ruined arch hung with moon-chimes that sway in the wind.
  arch(x, z, rot = 0, width = 4, h = 5) {
    const c = Math.cos(rot), s = Math.sin(rot), hw = width / 2;
    for (const k of [-1, 1]) this.pillar(x + c * hw * k, z - s * hw * k, .35, h, false, 'whitestone');
    const top = new THREE.TorusGeometry(hw, .22, 8, 20, Math.PI); top.rotateY(rot); top.translate(x, h, z); this.batch('whitestone', top);
    const chimes = new THREE.Group(); chimes.position.set(x, h + hw * .6, z); chimes.rotation.y = rot; this.group.add(chimes);
    const mat = this.mats.chime ||= new THREE.MeshStandardMaterial({ color: 0xd0dcff, metalness: .9, roughness: .2, emissive: 0x3050a0, emissiveIntensity: .4 });
    for (let i = 0; i < 5; i++) {
      const len = .4 + ((i * 7) % 5) * .12, m = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, len, 6), mat);
      m.geometry.translate(0, -len / 2, 0); m.position.set((i - 2) * .22, 0, 0); chimes.add(m);
    }
    const ph = this.R() * 6;
    this.anim.push(t => { chimes.children.forEach((m, i) => { m.rotation.z = Math.sin(t * 1.3 + ph + i) * .12; m.rotation.x = Math.sin(t * 1.7 + ph + i * 2) * .08; }); });
  }

  // A still pool of moonwater in a white stone rim.
  moonpool(x, z, r) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(r, 40), this.mats.moonwater);
    d.rotation.x = -Math.PI / 2; d.position.set(x, .04, z); this.group.add(d);
    const rim = new THREE.TorusGeometry(r, .16, 6, 40); rim.rotateX(Math.PI / 2); rim.translate(x, .08, z); this.batch('whitestone', rim);
    this.prop(this.addCyl(x, z, r + .1, .4));
    this.flames.push({ x, y: .6, z, color: new THREE.Color(0x6a9aff), base: 3 + r, phase: 0, flick: 1 });
  }

  // A goblin warning totem: a stake crowned with skulls.
  totem(x, z, h = 3.2) {
    const st = new THREE.CylinderGeometry(.1, .14, h, 6); st.translate(x, h / 2, z); this.batch('stake', st);
    for (let i = 0; i < 3; i++) {
      const s = new THREE.SphereGeometry(.17 - i * .02, 8, 6); s.scale(1, 1.1, 1.15); s.translate(x + (i ? (i - 1.5) * .22 : 0), h - i * .45, z + .05);
      this.batch('bone', s);
    }
    this.prop(this.addCyl(x, z, .2, h));
  }

  banner(x, z, ry, color = 0x6b1414, y = 4) {
    this.bannerMats ||= {};
    const mat = this.bannerMats[color] ||= new THREE.MeshStandardMaterial({ color, roughness: .9, side: THREE.DoubleSide });
    const b = new THREE.Mesh(this.bannerGeo ||= new THREE.PlaneGeometry(1.4, 3.2, 1, 6), mat);
    b.position.set(x, y, z); b.rotation.y = ry; this.group.add(b);
    const ph = this.R() * 6;
    this.anim.push(t => { b.rotation.x = Math.sin(t * .9 + ph) * .04; });
  }

  // Flame source: brazier bowl (or a ground fire) + flickering light slot.
  brazier(x, z, color = 0xff8a3a, tall = true, size = 1, lift = 0) {
    const g = this.group, M = this.mats;
    const h = (tall ? 1.2 : .05) + lift;
    if (tall) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, h, 6), M.iron); leg.position.set(x, h / 2, z); leg.castShadow = true; g.add(leg);
      this.prop(this.addCyl(x, z, .35, h + .4));
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.45, .22, .35, 10, 1, true), M.iron);
      bowl.position.set(x, h + .15, z); g.add(bowl);
    }
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    flame.position.set(x, h + .5 * size, z); flame.scale.set(size, 1.4 * size, 1); flame.material.opacity = .85; g.add(flame);
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .8 }));
    core.position.set(x, h + .4 * size, z); core.scale.set(.5 * size, .7 * size, 1); g.add(core);
    const src = { x, y: h + .8 * size, z, color: new THREE.Color(color), base: 9 * Math.sqrt(size), phase: Math.random() * 10, flame };
    this.flames.push(src);
    this.anim.push(t => {
      const f = .85 + Math.sin(t * 9 + src.phase) * .08 + Math.sin(t * 23 + src.phase * 2) * .06;
      flame.scale.set(.95 * f * size, 1.4 * f * size, 1); src.flick = f;
    });
    return src;
  }

  buildShrines() {
    const ring = tex('runeShrine', () => runeCircle('120,230,255'));
    for (const s of Object.values(this.level.shrines)) {
      const grp = new THREE.Group(); grp.position.set(s.x, 0, s.z);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(.75, .95, .5, 10), this.mats.stone); base.position.y = .25; base.castShadow = true; base.receiveShadow = true;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(.22, .3, 1, 8), this.mats.stone); col.position.y = 1;
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.62, .28, .3, 16), this.mats.stone); bowl.position.y = 1.55;
      // Moon-bright water in the basin, and a crescent turning above it.
      const water = new THREE.Mesh(new THREE.CircleGeometry(.54, 24), new THREE.MeshBasicMaterial({ color: 0x9fe8ff }));
      water.rotation.x = -Math.PI / 2; water.position.y = 1.69;
      const core = new THREE.Group(); core.position.y = 2.15;
      const moonMat = new THREE.MeshStandardMaterial({ color: 0xe6f6ff, emissive: 0x9fe8ff, emissiveIntensity: 2.2 });
      const crescent = new THREE.Mesh(new THREE.TorusGeometry(.2, .055, 8, 28, Math.PI * 1.35), moonMat);
      crescent.rotation.z = Math.PI * .83;
      core.add(crescent, new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), moonMat));
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0x6fe8ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      halo.position.y = 2.05; halo.scale.setScalar(1.4); halo.material.opacity = .7;
      const rune = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: ring, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .45 }));
      rune.rotation.x = -Math.PI / 2; rune.position.y = .03;
      grp.add(base, col, bowl, water, core, halo, rune);
      this.group.add(grp);
      this.prop(this.addCyl(s.x, s.z, .95, 2));
      const src = { x: s.x, y: 2.1, z: s.z, color: new THREE.Color(0x6fe8ff), base: 7, phase: 0, flame: halo };
      this.flames.push(src);
      s.fx = { core, halo, rune, lit: 0 };
      this.anim.push(t => {
        core.position.y = 2.15 + Math.sin(t * 1.6) * .08; core.rotation.y = t * .6;
        water.material.color.setHSL(.53, .8, .72 + Math.sin(t * 2.3) * .06 + s.fx.lit * .08);
        rune.rotation.z = t * .1;
        const lit = s.fx.lit;
        halo.scale.setScalar(1.1 + lit * .5 + Math.sin(t * 3) * .1);
        rune.material.opacity = .3 + lit * .4 + Math.sin(t * 2) * .05;
        src.flick = 1 + lit * .5;
      });
      this.interactables.push({ kind: 'shrine', id: s.id, x: s.x, z: s.z, r: 2.4, prompt: 'Rest at the Moonwell', shrine: s });
    }
  }

  buildMessages() {
    // Wisp lanterns: little paper lights that float at head height and whisper advice.
    const paper = new THREE.MeshStandardMaterial({ color: 0x8a4a2a, emissive: 0xff8a3a, emissiveIntensity: .75, roughness: .8, side: THREE.DoubleSide });
    const frame = new THREE.MeshStandardMaterial({ color: 0x3b2a1c, roughness: .8 });
    const body = new THREE.CylinderGeometry(.13, .13, .26, 10, 1, true), cap = new THREE.CylinderGeometry(.09, .14, .04, 10);
    for (const [i, m] of (this.level.messages || []).entries()) {
      const lan = new THREE.Group();
      lan.add(new THREE.Mesh(body, paper));
      const top = new THREE.Mesh(cap, frame); top.position.y = .15; const bot = new THREE.Mesh(cap, frame); bot.position.y = -.15; bot.rotation.x = Math.PI;
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xffa860, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .7 }));
      glow.scale.setScalar(1.1);
      lan.add(top, bot, glow);
      lan.position.set(m.x, 1.45, m.z);
      this.group.add(lan);
      this.anim.push(t => { lan.position.y = 1.45 + Math.sin(t * 1.4 + i) * .1; lan.rotation.y = Math.sin(t * .7 + i) * .4; glow.material.opacity = .55 + Math.sin(t * 3 + i) * .15; });
      this.interactables.push({ kind: 'message', x: m.x, z: m.z, r: 1.5, prompt: 'Listen to the wisp', text: m.text });
    }
  }

  buildItems() {
    for (const it of this.level.items || []) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.starTex, color: it.kind === 'grace' ? 0xaef6ff : it.kind === 'charm' ? 0xff9cf0 : it.kind === 'weapon' ? 0xc9b4ff : 0xffe7a0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      s.position.set(it.x, .5, it.z); s.scale.setScalar(.9);
      this.group.add(s);
      const ph = Math.random() * 6;
      this.anim.push(t => { s.position.y = .45 + Math.sin(t * 2 + ph) * .08; s.material.rotation = t * .5; s.scale.setScalar(.8 + Math.sin(t * 4 + ph) * .12); });
      this.interactables.push({ kind: 'item', id: it.id, x: it.x, z: it.z, r: 1.4, prompt: 'Pick up', item: it, sprite: s, taken: false });
    }
  }

  setItemTaken(id, taken) {
    const it = this.interactables.find(i => i.kind === 'item' && i.id === id);
    if (it) { it.taken = taken; it.sprite.visible = !taken; }
  }

  // Seal direction helpers: +1 inside the arena, -1 outside.
  sealSide(x, z) {
    const S = this.level.seal;
    return (x - S.x) * Math.sin(S.yaw) + (z - S.z) * Math.cos(S.yaw);
  }

  buildGates() {
    const L = this.level;
    // A gate held shut until its guardian falls: an iron portcullis or a wooden palisade gate.
    if (L.gate) {
      const G = L.gate, w = G.width || 6, port = new THREE.Group();
      if (G.style === 'ice') {
        // A wall of ice grown across the way; it shatters when its keeper falls.
        const R = rng(99);
        for (let i = 0; i < 16; i++) {
          const x = -w / 2 + (i + .5) * w / 16, hh = 3.8 + R() * 3.2, m = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), this.mats.ice || this.mats.iron);
          m.scale.set(.32 + R() * .25, hh / 2, .35 + R() * .25); m.position.set(x + (R() - .5) * .3, hh / 2 - .3, (R() - .5) * .6); m.rotation.set((R() - .5) * .25, R() * 3, (R() - .5) * .25);
          m.castShadow = true; port.add(m);
        }
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0x6fc8ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .45 }));
        glow.position.y = 2.5; glow.scale.set(w * 1.3, 6, 1); port.add(glow);
      } else if (G.style === 'palisade') {
        for (let i = 0; i < 9; i++) {
          const x = -w / 2 + (i + .5) * w / 9, st = new THREE.Mesh(new THREE.CylinderGeometry(.16, .18, 5, 7), this.mats.stake || this.mats.wood);
          st.position.set(x, 2.5, 0); st.castShadow = true; port.add(st);
          const tip = new THREE.Mesh(new THREE.ConeGeometry(.18, .5, 7), this.mats.stake || this.mats.wood); tip.position.set(x, 5.25, 0); port.add(tip);
        }
        for (const y of [1.2, 3.6]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w + .2, .18, .18), this.mats.wood); b.position.set(0, y, .2); port.add(b); }
      } else {
        for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.12, 6, .12), this.mats.iron); b.position.set(-w / 2 + w / 8 * i, 3, 0); b.castShadow = true; port.add(b); }
        for (let j = 0; j < 5; j++) { const b = new THREE.Mesh(new THREE.BoxGeometry(w + .2, .12, .12), this.mats.iron); b.position.set(0, .6 + j * 1.3, 0); b.castShadow = true; port.add(b); }
      }
      port.position.set(G.x, 0, G.z); port.rotation.y = G.rot || 0;
      this.group.add(port);
      this.portcullis = { mesh: port, col: this.prop(this.addBox(G.x, G.z, w / 2, .3, G.rot || 0, 6)), open: 0, opening: false, lift: G.style === 'palisade' ? 0 : 5.6, style: G.style, w, x: G.x, z: G.z, rot: G.rot || 0 };
    }

    // The Briar Seal in front of the arena: a violet veil and thorned vines.
    const S = L.seal;
    const fogMat = new THREE.ShaderMaterial({
      vertexShader: FOG_VERT, fragmentShader: FOG_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } },
    });
    const sw = S.width || 7.2, sh = S.height || 6.8;
    const seal = new THREE.Group(); seal.position.set(S.x, 0, S.z); seal.rotation.y = S.yaw;
    const fog = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), fogMat);
    fog.position.y = sh / 2; seal.add(fog);
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x2a1830, emissive: 0x5a1a6a, emissiveIntensity: .5, roughness: .7, transparent: true });
    const vines = new THREE.Group(), R = rng(77);
    for (let v = 0; v < 7; v++) {
      const pts = [];
      const y0 = R() * (sh - .6), y1 = R() * (sh - .6);
      for (let k = 0; k <= 8; k++) {
        const u = k / 8;
        pts.push(new THREE.Vector3(-sw / 2 - .1 + u * (sw + .2), lerp(y0, y1, u) + Math.sin(u * 9 + v) * .5, (R() - .5) * .5));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      vines.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .06 + R() * .04, 5), vineMat));
      for (let k = 0; k < 14; k++) {
        const pt = curve.getPoint(R()), th = new THREE.Mesh(new THREE.ConeGeometry(.04, .22, 4), vineMat);
        th.position.copy(pt); th.rotation.set(R() * 6, R() * 6, R() * 6); vines.add(th);
      }
    }
    seal.add(vines);
    this.group.add(seal);
    this.fogGate = { mesh: fog, mat: fogMat, col: this.prop(this.addBox(S.x, S.z, sw / 2 + .1, .9, S.yaw, 7)), gone: false, fade: 1, viewFade: 1 };
    this.anim.push(t => { fogMat.uniforms.uTime.value = t; fogMat.uniforms.uOpacity.value = this.fogGate.fade * this.fogGate.viewFade; fog.visible = this.fogGate.fade > .01;
      vines.scale.y = this.fogGate.fade; vineMat.opacity = Math.min(1, this.fogGate.viewFade * 1.2 - .1); vines.visible = this.fogGate.fade > .01 && vineMat.opacity > .02; });
    const out = { x: S.x - Math.sin(S.yaw) * 1.8, z: S.z - Math.cos(S.yaw) * 1.8 };
    this.interactables.push({ kind: 'fog', x: out.x, z: out.z, r: 1.7, prompt: 'Part the briars' });

    // The way onward, lit once the warlord falls.
    const E = L.exit;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, .08, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffd6ff, transparent: true, blending: THREE.AdditiveBlending }));
    ring.position.set(E.x, 1.8, E.z); ring.rotation.y = E.yaw || 0;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xff9cf0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    glow.position.copy(ring.position); glow.scale.setScalar(5);
    ring.visible = glow.visible = false;
    this.group.add(ring, glow);
    this.exitGate = { ring, glow, on: false };
    this.anim.push(t => { ring.rotation.z = t; ring.scale.setScalar(1 + Math.sin(t * 2) * .05); });
    this.interactables.push({ kind: 'exit', x: E.x, z: E.z - .6, r: 2.4, prompt: 'Step through the Pixie Gate' });
  }

  openPortcullis(instant = false) {
    const p = this.portcullis;
    if (!p) return;
    p.col.on = false;
    if (instant) { p.open = 1; this.poseGate(); return; }
    if (p.style === 'ice') {   // no lifting: the ice bursts apart
      p.open = 1; this.poseGate();
      for (let i = 0; i < 7; i++) { const u = (i / 6 - .5) * p.w; this.G.fx.shatter({ x: p.x + Math.cos(p.rot) * u, y: 1 + Math.random() * 3, z: p.z - Math.sin(p.rot) * u }, 40, 0xdff4ff, 7); }
      this.G.audio.sfx('shatter', { x: p.x, z: p.z });
      return;
    }
    p.opening = true;
  }
  closePortcullis() { const p = this.portcullis; if (!p) return; p.col.on = true; p.open = 0; p.opening = false; this.poseGate(); }
  poseGate() {
    const p = this.portcullis;
    if (p.style === 'ice') p.mesh.visible = p.open < 1;
    else if (p.style === 'palisade') { p.mesh.position.y = -p.open * 5.4; }   // stakes sink into the earth
    else p.mesh.position.y = p.open * p.lift;
  }

  setFogGate(on) { this.fogGate.gone = !on; this.fogGate.col.on = on; if (on) this.fogGate.fade = 1; }
  setExit(on) { this.exitGate.on = on; this.exitGate.ring.visible = this.exitGate.glow.visible = on; }

  update(dt, t, focus) {
    for (const f of this.anim) f(t);
    const p = this.portcullis;
    if (p?.opening) { p.open = Math.min(1, p.open + dt / 3); this.poseGate(); if (p.open >= 1) p.opening = false; }
    if (this.fogGate.gone) this.fogGate.fade = Math.max(0, this.fogGate.fade - dt * .6);

    // Assign the light pool to the closest flames.
    const sorted = this.flames
      .map(f => ({ f, d: (f.x - focus.x) ** 2 + (f.z - focus.z) ** 2 }))
      .sort((a, b) => a.d - b.d);
    this.lightPool.forEach((l, i) => {
      const s = sorted[i];
      if (!s || s.d > 30 * 30 || !l.visible) { l.intensity = 0; return; }
      l.position.set(s.f.x, s.f.y, s.f.z);
      l.color.copy(s.f.color);
      l.intensity = s.f.base * (s.f.flick || 1);
    });
  }
}
