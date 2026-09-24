// The level: a ruined keep climbed from south to north.
//   Fallen Grove (start shrine) → Gatehouse Yard (Gatewarden) → portcullis → Gnawing Halls (second shrine)
//   → fog gate → Throne of the Warren (boss).
// Collision is 2D in XZ: oriented boxes and cylinders, with heights for camera and line-of-sight rays.
import * as THREE from 'three';
import { flagstone, brick, grass, arenaStone, runeCircle, glowTexture, skyTexture } from './textures.js';
import { rng, clamp, lerp } from './util.js';

export const AREAS = [
  { id: 'grove', name: 'The Fallen Grove', x0: -11, x1: 11, z0: -12, z1: 10 },
  { id: 'yard', name: 'Grubhold Gatehouse', x0: -18, x1: 28, z0: 10, z1: 64 },
  { id: 'halls', name: 'The Gnawing Halls', x0: -19, x1: 12, z0: 64, z1: 112 },
  { id: 'throne', name: 'Throne of the Warren', x0: -17, x1: 17, z0: 112.5, z1: 152 },
];

export const SHRINES = {
  grove: { id: 'grove', name: 'Shrine of the Fallen Grove', x: 0, z: -5.5, spawn: [0, -2.9], yaw: 0 },
  halls: { id: 'halls', name: 'Shrine of the Gnawing Halls', x: -16.2, z: 102, spawn: [-14.4, 102], yaw: Math.PI / 2 },
};

// Enemy placements. idle: 'stand' | 'sleep'. patrol: waypoints.
export const SPAWNS = [
  { id: 'g1', type: 'goblin-scout', x: 0, z: 7.6, yaw: 0, idle: 'sleep' },
  { id: 'g2', type: 'goblin-scout', x: 1.2, z: 23, yaw: Math.PI, idle: 'stand' },
  { id: 'g3', type: 'goblin-spearguard', x: -9, z: 37, yaw: Math.PI / 2 },
  { id: 'g4', type: 'goblin-spearguard', x: 7, z: 41, yaw: Math.PI, patrol: [[7, 41], [10, 51], [2, 49]] },
  { id: 'g5', type: 'goblin-archer', x: -14, z: 55, yaw: 2.4 },
  { id: 'g6', type: 'goblin-bomber', x: 13, z: 56, yaw: -2.6 },
  { id: 'g7', type: 'goblin-berserker', x: -7, z: 50, yaw: 2.8, idle: 'sleep' },
  { id: 'g8', type: 'goblin-poisoner', x: 24.5, z: 41, yaw: -Math.PI / 2 },
  { id: 'warden', type: 'goblin-clubber', x: 0, z: 59, yaw: Math.PI, elite: 'warden' },
  { id: 'r1', type: 'ratman-scout', x: -4, z: 81, yaw: Math.PI },
  { id: 'r2', type: 'ratman-skirmisher', x: 4.5, z: 83, yaw: Math.PI },
  { id: 'r3', type: 'ratman-poisoner', x: -8, z: 91, yaw: 2.6 },
  { id: 'r4', type: 'ratman-skirmisher', x: 8, z: 95, yaw: -2.6, patrol: [[8, 95], [8, 80], [3, 88]] },
  { id: 'r5', type: 'ratman-brute', x: 0, z: 97, yaw: Math.PI },
  { id: 'r6', type: 'ratman-slinger', x: -9, z: 107, yaw: 2.8 },
  { id: 'r7', type: 'ratman-assassin', x: 8.4, z: 87, yaw: -Math.PI / 2, idle: 'sleep' },
  { id: 'r8', type: 'ratman-shaman', x: 6, z: 108, yaw: Math.PI },
  { id: 'boss', type: 'ratman-warblade', x: 0, z: 143, yaw: Math.PI, elite: 'boss' },
];

export const MESSAGES = [
  { x: 0, z: -1.2, text: 'Move with WASD. Click the screen to take the mouse; turn the camera with it.\nA gamepad works too.' },
  { x: -4.5, z: 1.5, text: 'Space dodges. Mid-roll, nothing can touch you. Hold Space afterwards to sprint.\nStanding still, Space steps back.' },
  { x: 4.5, z: 1.5, text: 'Left click strikes, right click swings hard.\nHold Shift to guard: blocked blows cost Ki, not blood.' },
  { x: 2.6, z: 5, text: 'Ahead, a goblin dozes. Strike an unaware foe from behind to open its back.' },
  { x: -1.6, z: 12.5, text: 'Every blow and dodge spends Ki, the green bar.\nAs you finish a strike, blue light gathers around you: tap Shift in that moment to Ki Pulse and take the Ki back.' },
  { x: 1.6, z: 26, text: 'Beat on a foe until its Ki breaks. While it reels, strike it to Grapple for a killing blow. Q locks on.' },
  { x: 0, z: 49, text: 'Foes that flare RED unleash Burst attacks. No guard stops them.\nPress F as the blow lands to Burst Counter and shatter their Ki.' },
  { x: -2, z: 70, text: 'R drinks an elixir. Rest at a shrine to refill them, and to spend Amrita on strength.\nDie, and your Amrita stays where you fell.' },
  { x: 2, z: 110, text: 'Strike, counter and pulse to fill the violet Anima.\nWhen it is full, G awakens your Fae Shift.' },
  { x: -1.5, z: 116.5, text: 'Beyond the fog, the Warblade waits upon his throne.' },
];

export const ITEMS = [
  { id: 'grace1', x: 26.2, z: 41, kind: 'grace', label: 'Bottled Grace', desc: 'One more elixir, every rest.' },
  { id: 'amrita1', x: -16, z: 30.5, kind: 'amrita', amount: 350, label: 'Amrita Crystal', desc: '+350 Amrita' },
  { id: 'amrita2', x: 10.6, z: 110.4, kind: 'amrita', amount: 600, label: 'Amrita Crystal', desc: '+600 Amrita' },
  { id: 'grace2', x: -17.8, z: 99.3, kind: 'grace', label: 'Bottled Grace', desc: 'One more elixir, every rest.' },
];

// ---------------------------------------------------------------- geometry helpers
function scaleUV(geo, su, sv) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  return geo;
}

// Box with texel density `tile` metres per repeat on every face.
function boxGeo(w, h, d, tile = 3) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];   // px nx py ny pz nz
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    uv.setXY(i, uv.getX(i) * faces[f][0] / tile, uv.getY(i) * faces[f][1] / tile);
  }
  return g;
}

function merge(geos) {
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
  float a = smoothstep(.25, .85, m) * .85 + .12;
  float edge = smoothstep(0., .1, vUv.x) * smoothstep(1., .9, vUv.x) * smoothstep(0., .05, vUv.y) * smoothstep(1., .7, vUv.y);
  gl_FragColor = vec4(vec3(.82, .88, 1.) * (.55 + m * .7), a * edge * uOpacity);
}`;

// ---------------------------------------------------------------- the world
export class World {
  constructor(G) {
    this.G = G;
    this.scene = G.scene;
    this.boxes = [];       // {x, z, hw, hd, c, s, y0, h, on}
    this.cyls = [];        // {x, z, r, h, on}
    this.flames = [];      // flame sources: {x, y, z, color, base, phase}
    this.anim = [];        // per-frame callbacks
    this.interactables = [];
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.build();
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

  areaAt(x, z) { return AREAS.find(a => x >= a.x0 && x <= a.x1 && z >= a.z0 && z <= a.z1) || null; }

  // ---------------- building
  build() {
    const R = rng(1234);
    const T = {
      floor: flagstone(3), wall: brick(11), grass: grass(5), arena: arenaStone(21),
      pillar: brick(17, [.9, .92, 1]),
    };
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
    this.glowTex = glowTexture();
    this.starTex = glowTexture('star');

    this.buildSky();
    this.buildFloors();
    this.buildWalls(R);
    this.buildDressing(R);
    this.buildShrines();
    this.buildMessages();
    this.buildItems();
    this.buildGates();
    this.buildLights();
  }

  buildSky() {
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -10;
    this.scene.add(sky); this.sky = sky;
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xdfe6ff, fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
    moon.position.set(-120, 150, 260); moon.scale.set(60, 60, 1);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(7, 32), new THREE.MeshBasicMaterial({ color: 0xeef2ff, fog: false }));
    disc.position.copy(moon.position); disc.lookAt(0, 0, 0);
    sky.add(moon, disc);
    // Far towers of the keep, dim in the fog.
    const tower = this.mats.wall;
    for (const [x, z, h, r] of [[-40, 60, 40, 5], [38, 100, 52, 6], [-30, 150, 60, 7], [30, 20, 34, 4], [0, 175, 80, 9]]) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r * .8, r, h, 12), tower);
      m.position.set(x, h / 2, z); this.group.add(m);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(r * 1.1, r * 2.2, 12), this.mats.iron);
      roof.position.set(x, h + r * 1.1, z); this.group.add(roof);
    }
  }

  floor(x0, z0, x1, z1, mat, tile = 4) {
    const w = x1 - x0, d = z1 - z0;
    const g = scaleUV(new THREE.PlaneGeometry(w, d), w / tile, d / tile);
    const m = new THREE.Mesh(g, mat);
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
    m.receiveShadow = true;
    this.group.add(m);
    return m;
  }

  buildFloors() {
    const outer = this.floor(-60, -40, 60, 190, this.mats.floor, 5);
    outer.position.y = -.01;
    this.floor(-11, -12, 11, 10, this.mats.grass, 6).position.y = .005;
    const ar = new THREE.Mesh(scaleUV(new THREE.CircleGeometry(16.5, 64), 8, 8), this.mats.arena);
    ar.rotation.x = -Math.PI / 2; ar.position.set(0, .01, 135); ar.receiveShadow = true;
    this.group.add(ar);
  }

  buildWalls(R) {
    const H = 6.5, TH = 1.2, geos = [], pil = [];
    const seg = (x0, z0, x1, z1, h = H) => {
      const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), rot = Math.atan2(-dz, dx);
      const g = boxGeo(L + TH, h, TH, 3);
      g.applyMatrix4(new THREE.Matrix4().makeRotationY(rot).setPosition((x0 + x1) / 2, h / 2, (z0 + z1) / 2));
      geos.push(g);
      this.addBox((x0 + x1) / 2, (z0 + z1) / 2, L / 2 + TH / 2, TH / 2, rot, h);
      // Crenellations along the top.
      for (let s = .8; s < L - .4; s += 1.6) {
        const cx = x0 + dx * s / L, cz = z0 + dz * s / L;
        const m = boxGeo(.8, .7, TH + .1, 3);
        m.applyMatrix4(new THREE.Matrix4().makeRotationY(rot).setPosition(cx, h + .35, cz));
        geos.push(m);
      }
    };
    const path = pts => { for (let i = 0; i < pts.length - 1; i++) seg(...pts[i], ...pts[i + 1]); };

    // Fallen Grove
    path([[-3, 10], [-11, 10], [-11, -12], [11, -12], [11, 10], [3, 10]]);
    // Corridor to the yard
    seg(-3, 10, -3, 28); seg(3, 10, 3, 28);
    // Gatehouse Yard
    path([[-3, 28], [-18, 28], [-18, 64], [-3, 64]]);
    path([[3, 28], [18, 28], [18, 37], [28, 37], [28, 45], [18, 45], [18, 64], [3, 64]]);
    // Passage to the halls, with a gatehouse arch over the portcullis
    seg(-3, 64, -3, 74, 8); seg(3, 64, 3, 74, 8);
    const arch = boxGeo(7.2, 2, 2.4, 3); arch.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 7, 66)); geos.push(arch);
    // Gnawing Halls
    path([[-3, 74], [-12, 74], [-12, 98], [-19, 98], [-19, 106], [-12, 106], [-12, 112], [-3, 112]]);
    path([[3, 74], [12, 74], [12, 112], [3, 112]]);
    // Fog corridor
    seg(-3, 112, -3, 120.5, 8); seg(3, 112, 3, 120.5, 8);
    const arch2 = boxGeo(7.2, 2.4, 2, 3); arch2.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 7.2, 113)); geos.push(arch2);
    // Throne arena: a ring of 28 segments with a gap to the south.
    const N = 28, cz = 135, rad = 16.6;
    for (let i = 1; i < N - 1; i++) {
      const a0 = (i - .5) * Math.PI * 2 / N + Math.PI * 2 / N / 2, a1 = a0 + Math.PI * 2 / N;
      seg(Math.sin(a0) * rad, cz - Math.cos(a0) * rad, Math.sin(a1) * rad, cz - Math.cos(a1) * rad, 9);
    }

    const walls = new THREE.Mesh(merge(geos), this.mats.wall);
    walls.castShadow = true; walls.receiveShadow = true;
    this.group.add(walls);

    // Pillars: yard ruins, the hall's colonnade and the arena ring.
    const pillar = (x, z, r = .7, h = 7, broken = false) => {
      const hh = broken ? h * (.35 + R() * .3) : h;
      const g = scaleUV(new THREE.CylinderGeometry(r * .92, r, hh, 14), 2, hh / 3);
      g.translate(x, hh / 2, z); pil.push(g);
      const cap = boxGeo(r * 2.6, .5, r * 2.6, 2); cap.translate(x, .25, z); pil.push(cap);
      if (!broken) { const top = boxGeo(r * 2.6, .5, r * 2.6, 2); top.translate(x, hh - .25, z); pil.push(top); }
      this.addCyl(x, z, r + .05, hh);
    };
    for (const [x, z, b] of [[-11, 36, 0], [-11, 46, 1], [11, 34, 1], [12, 47, 0], [-6, 58, 0], [6, 58, 0]]) pillar(x, z, .75, 7, !!b);
    for (let z = 80; z <= 106; z += 6.5) { pillar(-6, z, .8, 9); pillar(6, z, .8, 9); }
    for (let i = 0; i < 8; i++) {
      const a = (i + .5) / 8 * Math.PI * 2;
      pillar(Math.sin(a) * 11.5, cz - Math.cos(a) * 11.5, .9, 10, i === 2 || i === 5);
    }
    const pm = new THREE.Mesh(merge(pil), this.mats.pillar);
    pm.castShadow = true; pm.receiveShadow = true;
    this.group.add(pm);
  }

  buildDressing(R) {
    const g = this.group, M = this.mats;
    const add = (geo, mat, x, y, z, ry = 0, shadow = true) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry;
      m.castShadow = shadow; m.receiveShadow = true; g.add(m); return m;
    };

    // Dead trees in the grove.
    const treeGeos = [];
    const tree = (x, z, h, seed) => {
      const r = rng(seed);
      const trunk = new THREE.CylinderGeometry(.12, .35, h, 7); trunk.translate(0, h / 2, 0);
      const parts = [trunk];
      for (let i = 0; i < 6; i++) {
        const bl = 1 + r() * 1.8, br = new THREE.CylinderGeometry(.03, .12, bl, 5);
        br.translate(0, bl / 2, 0);
        br.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(.5 + r() * .7, r() * 6.28, 0, 'YXZ')));
        br.translate(0, h * (.45 + r() * .5), 0);
        parts.push(br);
      }
      for (const p of parts) { p.translate(x, 0, z); treeGeos.push(p); }
      this.prop(this.addCyl(x, z, .4, h));
    };
    tree(-7.5, -8, 5.5, 1); tree(8, -3, 6, 2); tree(-8, 6, 4.5, 3); tree(7.5, 7, 5, 4);
    const trees = new THREE.Mesh(merge(treeGeos), M.bark); trees.castShadow = true; g.add(trees);

    // A weathered pixie statue behind the first shrine.
    const statue = new THREE.Group();
    const base = new THREE.Mesh(boxGeo(1.6, 1, 1.6, 2), M.stone); base.position.y = .5; statue.add(base);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.35, 1, 4, 10), M.stone); body.position.y = 1.9; statue.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 10), M.stone); head.position.y = 2.85; statue.add(head);
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.SphereGeometry(.8, 10, 8), M.stone);
      w.scale.set(.15, 1, .6); w.position.set(s * .45, 2.4, -.35); w.rotation.z = -s * .5; statue.add(w);
    }
    statue.position.set(0, 0, -9.5); statue.traverse(o => { o.castShadow = true; o.receiveShadow = true; });
    g.add(statue); this.addBox(0, -9.5, .8, .8, 0, 3);

    // Gravestones in the grove.
    for (let i = 0; i < 14; i++) {
      const x = (R() < .5 ? -1 : 1) * (4.5 + R() * 5.5), z = -10 + R() * 18;
      if (Math.abs(x) < 3.5) continue;
      const h = .7 + R() * .6;
      const ry = R() * .6 - .3;
      add(boxGeo(.6, h, .18, 1), M.stone, x, h / 2 - .1, z, ry).rotation.z = R() * .3 - .15;
      this.prop(this.addBox(x, z, .32, .12, ry, h));
    }

    // Grass blades and glowing mushrooms in the grove.
    const blade = new THREE.ConeGeometry(.03, .3, 3); blade.translate(0, .15, 0);
    const grassMesh = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: 0x4f6b35, roughness: 1 }), 1400);
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
    let gi = 0;
    for (let i = 0; i < 1400; i++) {
      const x = -10.5 + R() * 21, z = -11.5 + R() * 21;
      if (Math.abs(x) < 1.2 && z > -4) continue;
      e.set((R() - .5) * .5, R() * 6.28, (R() - .5) * .5); q.setFromEuler(e);
      const k = .6 + R() * .9; s.set(k, k * (.7 + R() * .8), k); p.set(x, 0, z);
      grassMesh.setMatrixAt(gi++, mtx.compose(p, q, s));
    }
    grassMesh.count = gi; g.add(grassMesh);
    const cap = new THREE.SphereGeometry(.09, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    for (const [col, n] of [[0x7fe8ff, 30], [0xff8fe0, 20]]) {
      const mush = new THREE.InstancedMesh(cap, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .7 }), n);
      for (let i = 0; i < n; i++) {
        const k = .4 + R() * .7;
        p.set(-10 + R() * 20, .04, -11 + R() * 20); if (Math.abs(p.x) < 2) p.x += 3 * Math.sign(p.x || 1);
        mush.setMatrixAt(i, mtx.compose(p, q.identity(), s.set(k, k * .8, k)));
      }
      g.add(mush);
    }

    // Rubble everywhere.
    const rock = new THREE.IcosahedronGeometry(.3, 0);
    const rubble = new THREE.InstancedMesh(rock, M.stone, 220);
    for (let i = 0; i < 220; i++) {
      const zone = R();
      let x, z;
      if (zone < .3) { x = -17 + R() * 34; z = 29 + R() * 34; }
      else if (zone < .55) { x = -11.5 + R() * 23; z = 75 + R() * 36; }
      else if (zone < .75) { const a = R() * 6.28, r = 8 + R() * 8; x = Math.sin(a) * r; z = 135 - Math.cos(a) * r; }
      else { x = (R() < .5 ? -1 : 1) * (2.4 + R() * .5); z = 11 + R() * 16; }
      const k = .3 + R() * 1.1;
      e.set(R() * 3, R() * 3, R() * 3); q.setFromEuler(e);
      rubble.setMatrixAt(i, mtx.compose(p.set(x, .05, z), q, s.set(k, k * .6, k)));
    }
    rubble.castShadow = true; rubble.receiveShadow = true; g.add(rubble);

    // Crates, a cart and goblin banners in the yard.
    const crate = boxGeo(1, 1, 1, 1);
    for (const [x, z, r] of [[-15.5, 33, .2], [-15.4, 34.2, .5], [-14.5, 33.3, .1], [15.5, 60.5, .3], [14.4, 61, -.2], [23, 43.5, .1]]) {
      add(crate, M.wood, x, .5, z, r); this.prop(this.addBox(x, z, .5, .5, r, 1));
    }
    const bigCrate = add(crate, M.wood, -15.1, 1.5, 33.6, .3); bigCrate.scale.setScalar(.9);
    const cart = new THREE.Group();
    const bed = new THREE.Mesh(boxGeo(2.4, .3, 1.4, 1), M.wood); bed.position.y = .8; cart.add(bed);
    for (const [wx, wz] of [[-.8, .75], [.8, .75], [-.8, -.75], [.8, -.75]]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .12, 14), M.wood); w.rotation.x = Math.PI / 2; w.position.set(wx, .45, wz); cart.add(w);
    }
    for (const o of [[0, 1.05, .7], [0, 1.05, -.7]]) { const rail = new THREE.Mesh(boxGeo(2.4, .3, .08, 1), M.wood); rail.position.set(...o); cart.add(rail); }
    cart.position.set(12, 0, 34); cart.rotation.y = .7; cart.traverse(o => { o.castShadow = true; });
    g.add(cart); this.prop(this.addBox(12, 34, 1.3, .8, .7, 1.2));

    const bannerMat = new THREE.MeshStandardMaterial({ color: 0x6b1414, roughness: .9, side: THREE.DoubleSide });
    const bannerGeo = new THREE.PlaneGeometry(1.4, 3.2, 1, 6);
    const hang = (x, z, ry, mat = bannerMat) => {
      const b = new THREE.Mesh(bannerGeo, mat); b.position.set(x, 4, z); b.rotation.y = ry; g.add(b);
      const ph = R() * 6;
      this.anim.push(t => { b.rotation.x = Math.sin(t * .9 + ph) * .04; });
    };
    hang(-17.3, 40, Math.PI / 2); hang(-17.3, 52, Math.PI / 2); hang(17.3, 52, -Math.PI / 2); hang(-4.2, 63.3, 0); hang(4.2, 63.3, 0);
    const ratBanner = new THREE.MeshStandardMaterial({ color: 0x2f3a1c, roughness: .9, side: THREE.DoubleSide });
    for (let z = 80; z <= 106; z += 13) { hang(-11.3, z, Math.PI / 2, ratBanner); hang(11.3, z, -Math.PI / 2, ratBanner); }

    // Bones and cages in the halls; bones and a throne in the arena.
    const bone = new THREE.CylinderGeometry(.04, .05, .5, 5);
    const bones = new THREE.InstancedMesh(bone, M.bone, 120);
    for (let i = 0; i < 120; i++) {
      const inArena = i < 70;
      const a = R() * 6.28, r = 3 + R() * 12;
      p.set(inArena ? Math.sin(a) * r : -11 + R() * 22, .05, inArena ? 135 - Math.cos(a) * r : 75 + R() * 36);
      e.set(Math.PI / 2, R() * 6.28, 0); q.setFromEuler(e);
      bones.setMatrixAt(i, mtx.compose(p, q, s.set(1, .6 + R(), 1)));
    }
    g.add(bones);
    const skull = new THREE.SphereGeometry(.13, 8, 6);
    for (let i = 0; i < 16; i++) { const a = R() * 6.28, r = 4 + R() * 10; add(skull, M.bone, Math.sin(a) * r, .1, 135 - Math.cos(a) * r, 0, false); }
    const cageGeo = [];
    for (const [cx, cz] of [[-10, 78], [10, 101]]) {
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2, bar = new THREE.CylinderGeometry(.03, .03, 2.2, 4);
        bar.translate(cx + Math.sin(a) * .7, 1.1, cz + Math.cos(a) * .7); cageGeo.push(bar);
      }
      for (const y of [0, 2.2]) { const ring = new THREE.CylinderGeometry(.75, .75, .08, 12, 1, true); ring.translate(cx, y, cz); cageGeo.push(ring); }
      this.prop(this.addCyl(cx, cz, .8, 2.2));
    }
    const cages = new THREE.Mesh(merge(cageGeo), M.iron); cages.castShadow = true; g.add(cages);

    const throne = new THREE.Group();
    const tb = (w, h, d, x, y, z) => { const m = new THREE.Mesh(boxGeo(w, h, d, 2), M.stone); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; throne.add(m); };
    tb(6, .6, 4, 0, .3, 0); tb(4.5, .6, 3, 0, .9, .3); tb(2.4, 1.2, 1.6, 0, 1.8, .6); tb(2.6, 4.5, .5, 0, 3.4, 1.4); tb(.4, 1.8, 1.6, -1.2, 2.5, .6); tb(.4, 1.8, 1.6, 1.2, 2.5, .6);
    throne.position.set(0, 0, 148.5); g.add(throne);
    this.prop(this.addBox(0, 148.5, 3, 2, 0, 1.2));
    this.addBox(0, 149.8, 1.4, .6, 0, 6);
  }

  // Flame source: brazier bowl + flickering light slot + ember sprites.
  brazier(x, z, color = 0xff8a3a, tall = true) {
    const g = this.group, M = this.mats;
    const h = tall ? 1.2 : .1;
    if (tall) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, h, 6), M.iron); leg.position.set(x, h / 2, z); leg.castShadow = true; g.add(leg);
      this.prop(this.addCyl(x, z, .35, h + .4));
    }
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.45, .22, .35, 10, 1, true), M.iron);
    bowl.position.set(x, h + .15, z); g.add(bowl);
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    flame.position.set(x, h + .5, z); flame.scale.set(1, 1.4, 1); flame.material.opacity = .85; g.add(flame);
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .8 }));
    core.position.set(x, h + .4, z); core.scale.set(.5, .7, 1); g.add(core);
    const src = { x, y: h + .8, z, color: new THREE.Color(color), base: 9, phase: Math.random() * 10, flame };
    this.flames.push(src);
    this.anim.push(t => {
      const f = .85 + Math.sin(t * 9 + src.phase) * .08 + Math.sin(t * 23 + src.phase * 2) * .06;
      flame.scale.set(.95 * f, 1.4 * f, 1); src.flick = f;
    });
    return src;
  }

  buildLights() {
    for (const [x, z] of [[-6, -9], [6, -9]]) this.brazier(x, z, 0x6fd8ff);
    for (const [x, z] of [[-2.2, 12.5], [2.2, 27]]) this.brazier(x, z);
    for (const [x, z] of [[-16, 30], [16, 30], [-16, 62], [16, 62], [-4, 63], [4, 63], [26.5, 44]]) this.brazier(x, z);
    for (const [x, z] of [[-11, 76], [11, 76], [-11, 110], [11, 110], [0, 88]]) this.brazier(x, z, 0x9cff5a);
    for (const [x, z] of [[-2.3, 112.8], [2.3, 112.8]]) this.brazier(x, z, 0xff5030);
    for (let i = 0; i < 6; i++) { const a = (i + 1) / 7 * Math.PI * 2; this.brazier(Math.sin(a) * 14.4, 135 - Math.cos(a) * 14.4, 0xff4020); }

    // A small pool of real point lights, moved each frame onto the nearest flames.
    this.lightPool = [];
    for (let i = 0; i < 6; i++) {
      const l = new THREE.PointLight(0xff8a3a, 0, 13, 1.6);
      this.scene.add(l); this.lightPool.push(l);
    }
  }

  buildShrines() {
    const ring = runeCircle('120,230,255');
    for (const s of Object.values(SHRINES)) {
      const grp = new THREE.Group(); grp.position.set(s.x, 0, s.z);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(.75, .95, .5, 10), this.mats.stone); base.position.y = .25; base.castShadow = true; base.receiveShadow = true;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(.22, .3, 1, 8), this.mats.stone); col.position.y = 1;
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.5, .25, .25, 10), this.mats.stone); bowl.position.y = 1.55;
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.2, 1), new THREE.MeshStandardMaterial({ color: 0x9ff3ff, emissive: 0x6fe8ff, emissiveIntensity: 2.5 }));
      core.position.y = 2.05;
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0x6fe8ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      halo.position.y = 2.05; halo.scale.setScalar(1.4); halo.material.opacity = .7;
      const rune = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: ring, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .45 }));
      rune.rotation.x = -Math.PI / 2; rune.position.y = .03;
      grp.add(base, col, bowl, core, halo, rune);
      this.group.add(grp);
      this.prop(this.addCyl(s.x, s.z, .95, 2));
      const src = { x: s.x, y: 2.1, z: s.z, color: new THREE.Color(0x6fe8ff), base: 7, phase: 0, flame: halo };
      this.flames.push(src);
      s.fx = { core, halo, rune, lit: 0 };
      this.anim.push(t => {
        core.position.y = 2.05 + Math.sin(t * 1.6) * .08; core.rotation.y = t * .8; core.rotation.x = t * .5;
        rune.rotation.z = t * .1;
        const lit = s.fx.lit;
        halo.scale.setScalar(1.1 + lit * .5 + Math.sin(t * 3) * .1);
        rune.material.opacity = .3 + lit * .4 + Math.sin(t * 2) * .05;
        src.flick = 1 + lit * .5;
      });
      this.interactables.push({ kind: 'shrine', id: s.id, x: s.x, z: s.z, r: 2.4, prompt: 'Rest at shrine', shrine: s });
    }
  }

  buildMessages() {
    const tex = runeCircle('255,190,110');
    for (const [i, m] of MESSAGES.entries()) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffb870 }));
      mesh.rotation.x = -Math.PI / 2; mesh.position.set(m.x, .04, m.z);
      this.group.add(mesh);
      this.anim.push(t => { mesh.material.opacity = .55 + Math.sin(t * 2 + i) * .25; mesh.rotation.z = t * .2; });
      this.interactables.push({ kind: 'message', x: m.x, z: m.z, r: 1.5, prompt: 'Read message', text: m.text });
    }
  }

  buildItems() {
    for (const it of ITEMS) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.starTex, color: it.kind === 'grace' ? 0xaef6ff : 0xffe7a0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      s.position.set(it.x, .5, it.z); s.scale.setScalar(.9);
      this.group.add(s);
      const ph = Math.random() * 6;
      this.anim.push(t => { s.position.y = .45 + Math.sin(t * 2 + ph) * .08; s.material.rotation = t * .5; s.scale.setScalar(.8 + Math.sin(t * 4 + ph) * .12); });
      const obj = { kind: 'item', id: it.id, x: it.x, z: it.z, r: 1.4, prompt: 'Pick up', item: it, sprite: s, taken: false };
      this.interactables.push(obj);
    }
  }

  setItemTaken(id, taken) {
    const it = this.interactables.find(i => i.kind === 'item' && i.id === id);
    if (it) { it.taken = taken; it.sprite.visible = !taken; }
  }

  buildGates() {
    // Portcullis between the yard and the halls; the Gatewarden's death raises it.
    const port = new THREE.Group();
    for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.12, 6, .12), this.mats.iron); b.position.set(-3 + .75 * i, 3, 0); b.castShadow = true; port.add(b); }
    for (let j = 0; j < 5; j++) { const b = new THREE.Mesh(new THREE.BoxGeometry(6.2, .12, .12), this.mats.iron); b.position.set(0, .6 + j * 1.3, 0); b.castShadow = true; port.add(b); }
    port.position.set(0, 0, 66);
    this.group.add(port);
    this.portcullis = { mesh: port, col: this.prop(this.addBox(0, 66, 3, .25, 0, 6)), open: 0, opening: false };

    // Fog gate in front of the arena.
    const fogMat = new THREE.ShaderMaterial({
      vertexShader: FOG_VERT, fragmentShader: FOG_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } },
    });
    const fog = new THREE.Mesh(new THREE.PlaneGeometry(6, 6.4), fogMat);
    fog.position.set(0, 3.2, 114.5);
    this.group.add(fog);
    this.fogGate = { mesh: fog, mat: fogMat, col: this.prop(this.addBox(0, 114.5, 3, .3, 0, 7)), gone: false, fade: 1 };
    this.anim.push(t => { fogMat.uniforms.uTime.value = t; fogMat.uniforms.uOpacity.value = this.fogGate.fade; fog.visible = this.fogGate.fade > .01; });
    this.interactables.push({ kind: 'fog', x: 0, z: 113.3, r: 1.8, prompt: 'Traverse the white fog' });

    // The way onward, lit once the Warblade falls.
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, .08, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffd6ff, transparent: true, blending: THREE.AdditiveBlending }));
    ring.position.set(0, 1.8, 145.6);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xff9cf0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    glow.position.copy(ring.position); glow.scale.setScalar(5);
    ring.visible = glow.visible = false;
    this.group.add(ring, glow);
    this.exitGate = { ring, glow, on: false };
    this.anim.push(t => { ring.rotation.z = t; ring.scale.setScalar(1 + Math.sin(t * 2) * .05); });
    this.interactables.push({ kind: 'exit', x: 0, z: 145, r: 2.4, prompt: 'Step through the Pixie Gate' });
  }

  openPortcullis(instant = false) {
    const p = this.portcullis;
    p.col.on = false;
    if (instant) { p.open = 1; p.mesh.position.y = 5.6; return; }
    p.opening = true;
  }
  closePortcullis() { const p = this.portcullis; p.col.on = true; p.open = 0; p.opening = false; p.mesh.position.y = 0; }

  setFogGate(on) { this.fogGate.gone = !on; this.fogGate.col.on = on; if (on) this.fogGate.fade = 1; }
  setExit(on) { this.exitGate.on = on; this.exitGate.ring.visible = this.exitGate.glow.visible = on; }

  update(dt, t, focus) {
    for (const f of this.anim) f(t);
    const p = this.portcullis;
    if (p.opening) { p.open = Math.min(1, p.open + dt / 3); p.mesh.position.y = p.open * 5.6; if (p.open >= 1) p.opening = false; }
    if (this.fogGate.gone) this.fogGate.fade = Math.max(0, this.fogGate.fade - dt * .6);

    // Assign the light pool to the closest flames.
    const sorted = this.flames
      .map(f => ({ f, d: (f.x - focus.x) ** 2 + (f.z - focus.z) ** 2 }))
      .sort((a, b) => a.d - b.d);
    this.lightPool.forEach((l, i) => {
      const s = sorted[i];
      if (!s || s.d > 30 * 30) { l.intensity = 0; return; }
      l.position.set(s.f.x, s.f.y, s.f.z);
      l.color.copy(s.f.color);
      l.intensity = s.f.base * (s.f.flick || 1);
    });
  }
}
