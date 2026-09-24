// The Fae Crossroads: the mission map as a small world of its own. The realm is laid out as a diorama, with a
// landmark for every mission, a road of glowing stones winding between them, and the knight walking it.
// Arrows, WASD, the d-pad or the stick travel from landmark to landmark; clicking one walks there.
// A mission newly opened is revealed the first time the map is seen: the road lights up to it and the mist lifts.
import * as THREE from 'three';
import { buildKnight, KnightAnimator } from './knight.js';
import { FX } from './fx.js';
import { glowTexture, skyTexture } from './textures.js';
import { rng, clamp, lerp, smooth, makeNoise, angleDiff, TAU } from './util.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
export const roman = n => ROMAN[n - 1] || String(n);

// Where a mission sits when its level file doesn't say (x east, z north).
const FALLBACK = [[-17, -19], [-25, -2], [-3, 5], [9, 17], [20, 30]];
// Hills and peaks as soft bumps: [x, z, radius, height].
const BUMPS = [
  [-17, -13, 7, 1.3],
  [-5, 17, 8, 6.5], [6, 11, 5, 4], [-15, 14, 6, 4.5], [0, 25, 6, 5.5], [-9, 26, 6, 5],
  [9, 21, 4.5, 3],
  [30, 44, 11, 9], [16, 46, 8, 7], [41, 31, 9, 7.5], [4, 38, 8, 6], [-4, 36, 7, 5],
  [22, 34, 12, 1.1],
];
const SPEED = 6.5;   // map units a second, walking the road
const STATE_COL = { cleared: 0xe6c36a, inprogress: 0x8ff0ff, new: 0x8ff0ff, sealed: 0x5a4a78 };

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .85, flatShading: true, ...o });

export class Overworld {
  constructor(G) { this.G = G; this.active = false; this.built = false; this.selected = null; this.labels = {}; }

  // ---------------------------------------------------------------- terrain
  baseHeight(x, z) {
    const N = this.N;
    let h = .8 + (N.fbm(x * .045 + 5, z * .045 + 9, 4) - .5) * 1.6;
    for (const [bx, bz, r, bh] of BUMPS) { const d = Math.hypot(x - bx, z - bz) / r; h += bh * Math.exp(-d * d * 1.6) * (.85 + N.n2(x * .3, z * .3) * .3); }
    // A ragged coast: an oval of land in a dark sea.
    const e = Math.hypot(x / 58, (z - 9) / 47) + (N.fbm(x * .03, z * .03, 3) - .5) * .25;
    return lerp(h, -3.5, smooth(clamp((e - .8) / .22, 0, 1)));
  }
  // Level ground where the knight stands and where each landmark is built.
  height(x, z) {
    let h = this.baseHeight(x, z);
    for (const n of this.nodes || []) {
      if (n.y === undefined) continue;
      for (const [px, pz, r] of [[n.x, n.z, 2.6], [n.lx, n.lz, n.lr]]) {
        const k = smooth(clamp(1 - (Math.hypot(x - px, z - pz) - r) / 3, 0, 1));
        h = lerp(h, n.y, k);
      }
    }
    return h;
  }

  build() {
    const G = this.G;
    this.built = true;
    this.N = makeNoise(31); this.R = rng(4242); this.anim = []; this.t = 0;
    const scene = this.scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1022); scene.fog = new THREE.FogExp2(0x0a1022, .0085);
    this.camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .1, 800);
    this.fx = new FX(scene);
    this.glow = glowTexture();
    // A beam of light that fades as it rises, for the chosen landmark.
    const bc = document.createElement('canvas'); bc.width = 4; bc.height = 128;
    const bg = bc.getContext('2d'), grd = bg.createLinearGradient(0, 0, 0, 128);
    grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(.7, 'rgba(255,255,255,.35)'); grd.addColorStop(1, 'rgba(255,255,255,1)');
    bg.fillStyle = grd; bg.fillRect(0, 0, 4, 128);
    this.beamTex = new THREE.CanvasTexture(bc);
    this.nodes = G.ORDER.map((id, i) => {
      const L = G.LEVELS[id], m = L.map || {}, [fx, fz] = FALLBACK[i] || [i * 12 - 20, i * 9 - 18];
      return { id, i, L, x: m.x ?? fx, z: m.z ?? fz };
    });
    this.buildRoute();
    // Landmarks sit beside the road, on the far side from the camera.
    for (const n of this.nodes) {
      const t = this.tangentAt(n.s), a = [t.z, -t.x], b = [-t.z, t.x], side = a[1] > b[1] ? a : b;
      const d = n.id === 'moonspire' ? 5 : 4.4;
      n.lx = n.x + side[0] * d; n.lz = n.z + side[1] * d; n.lr = n.id === 'rotwood' ? 4.5 : 3.4;
      n.y = Math.max(.5, this.baseHeight(n.x, n.z));
    }
    for (const q of this.line) q.y = this.height(q.x, q.z);
    this.buildLights(); this.buildSky(); this.buildTerrain(); this.buildStones(); this.buildLandmarks(); this.buildKnight();
  }

  buildLights() {
    const s = this.scene;
    s.add(new THREE.HemisphereLight(0x9fb4e8, 0x2a2436, 1.9));
    const sun = this.sun = new THREE.DirectionalLight(0xdfe8ff, 2.3);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 140 });
    sun.shadow.bias = -.0008; sun.shadow.normalBias = .04;
    s.add(sun, sun.target);
  }

  buildSky() {
    const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -10; this.scene.add(sky);
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: 0xdfe6ff, fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
    moon.position.set(-160, 170, 330); moon.scale.setScalar(90); sky.add(moon);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(11, 48), new THREE.MeshBasicMaterial({ color: 0xeef2ff, fog: false }));
    disc.position.copy(moon.position); disc.lookAt(0, 0, 0); sky.add(disc);
    // The sea, and cloud drifting over the edges of the world.
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), std(0x0b1a33, { roughness: .2, metalness: .55, emissive: 0x040a18, flatShading: false }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = .12; sea.receiveShadow = true; this.scene.add(sea);
    const cloud = new THREE.SpriteMaterial({ map: this.glow, color: 0x8a98c8, transparent: true, opacity: .22, depthWrite: false });
    for (let i = 0; i < 40; i++) {
      const R = this.R, c = new THREE.Sprite(cloud), a = R() * TAU, r = 55 + R() * 70;
      c.position.set(Math.sin(a) * r, 5 + R() * 10, 10 + Math.cos(a) * r * .9); c.scale.set(30 + R() * 30, 9 + R() * 8, 1);
      this.scene.add(c);
      const ph = R() * 6; this.anim.push(t => { c.position.x += Math.sin(t * .05 + ph) * .01; });
    }
  }

  buildTerrain() {
    const W = 150, D = 130, geo = new THREE.PlaneGeometry(W, D, 150, 130);
    geo.rotateX(-Math.PI / 2); geo.translate(0, 0, 9);
    const P = geo.attributes.position;
    for (let i = 0; i < P.count; i++) P.setY(i, this.height(P.getX(i), P.getZ(i)));
    const g = geo.toNonIndexed(); g.computeVertexNormals();
    const Q = g.attributes.position, NR = g.attributes.normal, col = new Float32Array(Q.count * 3), c = new THREE.Color(), N = this.N;
    const C = h => new THREE.Color(h);
    const grass = C(0x3b5530), grass2 = C(0x5a7038), forest = C(0x1c3020), rock = C(0x5e5c68), snow = C(0xdfe6f2), shore = C(0x6a6450), deep = C(0x1a2432), heath = C(0x6a5a44);
    for (let f = 0; f < Q.count; f += 3) {
      // One colour per face, from its centre, for a cut-paper diorama look.
      const x = (Q.getX(f) + Q.getX(f + 1) + Q.getX(f + 2)) / 3, y = (Q.getY(f) + Q.getY(f + 1) + Q.getY(f + 2)) / 3, z = (Q.getZ(f) + Q.getZ(f + 1) + Q.getZ(f + 2)) / 3;
      const ny = NR.getY(f), n = N.fbm(x * .12, z * .12, 3);
      c.copy(grass).lerp(grass2, n);
      const wood = Math.exp(-((x + 27) ** 2 + (z + 1) ** 2) / 90);
      c.lerp(forest, clamp(wood * 1.6, 0, 1));
      c.lerp(heath, clamp(Math.exp(-((x + 17) ** 2 + (z + 15) ** 2) / 60) * .6, 0, 1));
      c.lerp(rock, smooth(clamp((.86 - ny) / .2, 0, 1)) * .9 + smooth(clamp((y - 2.6) / 1.2, 0, 1)) * .5);
      const north = smooth(clamp((x - 10) / 8, 0, 1)) * smooth(clamp((z - 20) / 8, 0, 1));
      c.lerp(snow, Math.max(smooth(clamp((y - 5.4) / 1.2, 0, 1)), north * .95) * (ny > .55 ? 1 : .7));
      if (y < .5) c.lerp(shore, smooth(clamp((.5 - y) / .35, 0, 1)));
      if (y < .05) c.lerp(deep, smooth(clamp(-y / 1.5, 0, 1)));
      c.multiplyScalar(.92 + n * .16);
      for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (f + k) * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, std(0xffffff, { vertexColors: true, roughness: .95 }));
    m.receiveShadow = true; this.scene.add(m);

    // Trees across the lowlands, thick in the Rotwood and snow-laden in the north.
    const R = this.R, dark = std(0x1d3322), pale = std(0xe8eef8, { emissive: 0x141c2c }), trunk = std(0x3a2a20);
    const cone = new THREE.ConeGeometry(.55, 1.6, 6).translate(0, 1.1, 0), stem = new THREE.CylinderGeometry(.08, .12, .5, 5).translate(0, .25, 0), cap = new THREE.ConeGeometry(.36, .7, 6).translate(0, 1.6, 0);
    const spots = [];
    for (let tries = 0; spots.length < 700 && tries < 9000; tries++) {
      const x = -60 + R() * 120, z = -35 + R() * 95, h = this.height(x, z);
      if (h < .55 || h > 4.6) continue;
      const wood = Math.exp(-((x + 27) ** 2 + (z + 1) ** 2) / 90);
      if (R() > .1 + wood * 1.4) continue;
      if (this.nearRoad(x, z) < 1.6 || this.nodes.some(n => Math.hypot(x - n.lx, z - n.lz) < n.lr + .8 || Math.hypot(x - n.x, z - n.z) < 2.6)) continue;
      spots.push([x, h, z, .7 + R() * .8, R() * 6]);
    }
    const mk = (geo, mat) => { const im = new THREE.InstancedMesh(geo, mat, spots.length); im.castShadow = true; im.receiveShadow = true; this.scene.add(im); return im; };
    const iCone = mk(cone, dark), iStem = mk(stem, trunk), snowy = spots.filter(([x, , z]) => x > 8 && z > 18), iCap = new THREE.InstancedMesh(cap, pale, Math.max(1, snowy.length));
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    spots.forEach(([x, h, z, k, r], i) => {
      mtx.compose(p.set(x, h - .05, z), q.setFromAxisAngle(up, r), s.set(k, k * (1 + (i % 3) * .15), k));
      iCone.setMatrixAt(i, mtx); iStem.setMatrixAt(i, mtx);
    });
    snowy.forEach(([x, h, z, k, r], i) => { mtx.compose(p.set(x, h - .05, z), q.setFromAxisAngle(up, r), s.set(k, k, k)); iCap.setMatrixAt(i, mtx); });
    iCap.count = snowy.length; iCap.castShadow = true; this.scene.add(iCap);
  }

  // ---------------------------------------------------------------- the road
  buildRoute() {
    const pts = [];
    this.nodes.forEach((n, i) => {
      pts.push(new THREE.Vector3(n.x, 0, n.z));
      const m = this.nodes[i + 1];
      if (m) {   // bend between landmarks so the road winds instead of running straight
        const dx = m.x - n.x, dz = m.z - n.z, side = i % 2 ? 1 : -1;
        pts.push(new THREE.Vector3((n.x + m.x) / 2 - dz * .2 * side, 0, (n.z + m.z) / 2 + dx * .2 * side));
      }
    });
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), S = 900;
    this.line = []; let s = 0, prev = null;
    for (let k = 0; k <= S; k++) {
      const p = curve.getPoint(k / S);
      if (prev) s += Math.hypot(p.x - prev.x, p.z - prev.z);
      this.line.push({ x: p.x, z: p.z, y: 0, s }); prev = p;
    }
    this.length = s;
    for (const n of this.nodes) {
      let best = this.line[0];
      for (const q of this.line) if (Math.hypot(q.x - n.x, q.z - n.z) < Math.hypot(best.x - n.x, best.z - n.z)) best = q;
      n.s = best.s;
    }
  }
  pointAt(s) {
    const L = this.line; s = clamp(s, 0, this.length);
    let lo = 0, hi = L.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m].s < s) lo = m; else hi = m; }
    const a = L[lo], b = L[hi], k = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0;
    return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k) };
  }
  tangentAt(s) {
    const a = this.pointAt(s - .5), b = this.pointAt(s + .5), l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    return { x: (b.x - a.x) / l, z: (b.z - a.z) / l };
  }
  nearRoad(x, z) { let d = Infinity; for (let i = 0; i < this.line.length; i += 6) d = Math.min(d, Math.hypot(this.line[i].x - x, this.line[i].z - z)); return d; }

  // Glowing stepping stones every few paces; lit where the way is open.
  buildStones() {
    const R = this.R, list = [];
    for (let s = .6; s < this.length; s += .78) {
      if (this.nodes.some(n => Math.abs(n.s - s) < 1.7)) continue;
      const p = this.pointAt(s), t = this.tangentAt(s), j = (R() - .5) * .22;
      list.push({ s, x: p.x - t.z * j, z: p.z + t.x * j, y: p.y, r: R() * 6 });
    }
    const im = this.stones = new THREE.InstancedMesh(new THREE.CylinderGeometry(.19, .23, .09, 7), new THREE.MeshBasicMaterial({ color: 0xffffff }), list.length);
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    list.forEach((st, i) => { im.setMatrixAt(i, mtx.compose(p.set(st.x, st.y + .06, st.z), q.setFromAxisAngle(up, st.r), one)); im.setColorAt(i, new THREE.Color(0x2a2a38)); });
    im.userData.list = list; this.scene.add(im);
    // A soft glow sprite rides along the lit road so it reads from afar.
    this.roadGlow = [];
    const mat = new THREE.SpriteMaterial({ map: this.glow, color: 0xe6c36a, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let s = 1.2; s < this.length; s += 3.1) { const p = this.pointAt(s), g = new THREE.Sprite(mat.clone()); g.position.set(p.x, p.y + .35, p.z); g.scale.setScalar(1.6); g.userData.s = s; this.scene.add(g); this.roadGlow.push(g); }
  }
  lightRoad(upto) {
    const im = this.stones, gold = new THREE.Color(0xf0cf78), dim = new THREE.Color(0x2a2a38);
    im.userData.list.forEach((st, i) => im.setColorAt(i, st.s <= upto ? gold : dim));
    im.instanceColor.needsUpdate = true;
    for (const g of this.roadGlow) g.visible = g.userData.s <= upto;
  }

  // ---------------------------------------------------------------- landmarks
  buildLandmarks() {
    for (const n of this.nodes) {
      const g = new THREE.Group(); g.position.set(n.lx, n.y, n.lz);
      g.rotation.y = Math.atan2(n.lx - n.x, n.lz - n.z);   // the landmark's front (-z) faces the road
      n.top = (this['lm_' + n.id] || this.lm_generic).call(this, g, n);
      g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      this.scene.add(g); n.group = g;
      // A Pixie Gate ring where the knight stands, coloured by the mission's state.
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x8ff0ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, .06, 6, 48), ringMat); ring.rotation.x = Math.PI / 2; ring.position.set(n.x, n.y + .1, n.z);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.1, 40), new THREE.MeshBasicMaterial({ color: 0x8ff0ff, transparent: true, opacity: .14, blending: THREE.AdditiveBlending, depthWrite: false }));
      disc.rotation.x = -Math.PI / 2; disc.position.set(n.x, n.y + .08, n.z);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.1, 6, 24, 1, true), new THREE.MeshBasicMaterial({ map: this.beamTex, color: 0x8ff0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      beam.position.set(n.x, n.y + 3, n.z);
      this.scene.add(ring, disc, beam); n.ring = ring; n.disc = disc; n.beam = beam;
      // Fae mist over a sealed mission; it lifts when the way opens.
      const shroud = new THREE.Group(), smat = new THREE.SpriteMaterial({ map: this.glow, color: 0x2a2244, transparent: true, opacity: .8, depthWrite: false });
      for (let i = 0; i < 22; i++) {
        const R = this.R, sp = new THREE.Sprite(smat), a = R() * TAU, r = R() * (n.lr + 1.2);
        sp.position.set(n.lx + Math.sin(a) * r, n.y + .6 + R() * n.top * .8, n.lz + Math.cos(a) * r); sp.scale.setScalar(3 + R() * 3.5);
        shroud.add(sp);
      }
      const briar = new THREE.Mesh(new THREE.TorusGeometry(1.3, .12, 5, 20), std(0x2a1830, { emissive: 0x5a1a6a, emissiveIntensity: .6 }));
      briar.rotation.x = Math.PI / 2; briar.position.set(n.x, n.y + .15, n.z); shroud.add(briar);
      shroud.userData.mat = smat; this.scene.add(shroud); n.shroud = shroud;
    }
  }

  lm_keep(g) {
    const stone = std(0x8a8c98), dark = std(0x2a2c34), roof = std(0x7a2a2a), S = 2.2;
    const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
    for (const [x, z, w, d] of [[0, -S, 2 * S, .35], [0, S, 2 * S, .35], [-S, 0, .35, 2 * S], [S, 0, .35, 2 * S]]) {
      box(w, 1.3, d, stone, x, .65, z);
      const long = w > d, L = long ? w : d;
      for (let u = -L / 2 + .25; u < L / 2; u += .5) box(.24, .28, .38, stone, long ? x + u : x, 1.44, long ? z : z + u);
    }
    for (const [x, z] of [[-S, -S], [S, -S], [-S, S], [S, S]]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(.5, .55, 2.1, 10), stone); t.position.set(x, 1.05, z); g.add(t);
      const r = new THREE.Mesh(new THREE.ConeGeometry(.62, 1, 10), roof); r.position.set(x, 2.6, z); g.add(r);
    }
    box(1.7, 3.3, 1.7, stone, 0, 1.65, .4);
    for (const [x, z] of [[-.6, -.2], [0, -.2], [.6, -.2], [-.6, 1], [.6, 1], [-.6, .4]]) box(.3, .34, .3, stone, x, 3.46, z + .0);
    box(.9, 1, .4, dark, 0, .5, -S - .04);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(.55, 1.1), std(0x8a1a1a, { side: THREE.DoubleSide })); banner.position.set(0, 2.5, -.46); banner.rotation.y = Math.PI; g.add(banner);
    this.anim.push(t => { banner.rotation.x = Math.sin(t * 1.3) * .08; });
    for (const x of [-.7, .7]) this.flame(g, x, 1.2, -S - .25, 0xff8a3a, .6);
    return 4.2;
  }

  lm_rotwood(g) {
    const R = this.R, bark = std(0x3a2a20), leaf = [std(0x1c3020), std(0x264026), std(0x2e3a1c)], stake = std(0x5a4030);
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * TAU + R() * .2, r = 2.9 + R() * 1.6;
      if (Math.abs(angleDiff(a, Math.PI)) < .5) continue;   // the way in, toward the road
      const x = Math.sin(a) * r, z = Math.cos(a) * r, h = 1.8 + R() * 1.6;
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(.08, .14, h * .5, 5), bark); tr.position.set(x, h * .25, z); g.add(tr);
      for (let k = 0; k < 2; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(.6 - k * .15, h * .6, 6), leaf[(i + k) % 3]); c.position.set(x, h * (.55 + k * .25), z); c.rotation.y = R() * 6; g.add(c); }
    }
    for (let i = 0; i < 22; i++) {
      const a = i / 22 * TAU; if (Math.abs(angleDiff(a, Math.PI)) < .35) continue;
      const st = new THREE.Mesh(new THREE.ConeGeometry(.07, .9, 5), stake); st.position.set(Math.sin(a) * 1.8, .45, Math.cos(a) * 1.8); g.add(st);
    }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, l = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, 1.3, 5), bark); l.position.set(Math.sin(a) * .3, .5, Math.cos(a) * .3); l.rotation.set(Math.cos(a) * -.45, 0, Math.sin(a) * .45); g.add(l); }
    this.flame(g, 0, 1.1, 0, 0xff5a1a, 2.6, 9);
    const ember = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: 0xff7a2a, transparent: true, opacity: .4, blending: THREE.AdditiveBlending, depthWrite: false }));
    ember.position.y = 1.4; ember.scale.setScalar(8); g.add(ember);
    // Smoke from the pyre, rising and spreading.
    const smoke = new THREE.SpriteMaterial({ map: this.glow, color: 0x9a8a80, transparent: true, depthWrite: false });
    for (let i = 0; i < 7; i++) {
      const sp = new THREE.Sprite(smoke.clone()); g.add(sp);
      this.anim.push(t => { const k = (t * .12 + i / 7) % 1; sp.position.set(Math.sin(k * 5 + i) * .4 * k * 3, 1.4 + k * 7, -k * 1.5); sp.scale.setScalar(.8 + k * 3.5); sp.material.opacity = .45 * Math.sin(k * Math.PI); });
    }
    return 4.4;
  }

  lm_deep(g) {
    const R = this.R, rock = std(0x4e4a5a), wood = std(0x4a3424), iron = std(0x3a3d44, { metalness: .6 }), black = new THREE.MeshBasicMaterial({ color: 0x020204 });
    const mound = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), rock); mound.scale.set(3.4, 2.6, 2.6); mound.position.set(0, .6, 2); g.add(mound);
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.7), black); hole.position.set(0, .85, -.52); hole.rotation.y = Math.PI; g.add(hole);
    const frame = (w, h, d, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood); o.position.set(x, y, z); g.add(o); };
    frame(.18, 1.9, .18, -.8, .95, -.6); frame(.18, 1.9, .18, .8, .95, -.6); frame(2, .2, .2, 0, 1.9, -.6);
    for (const x of [-.3, .3]) { const r = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, 3), iron); r.position.set(x, .04, -2); g.add(r); }
    for (let z = -3.3; z < -.6; z += .4) { const s = new THREE.Mesh(new THREE.BoxGeometry(.85, .04, .12), wood); s.position.set(0, .02, z); g.add(s); }
    const cart = new THREE.Mesh(new THREE.BoxGeometry(.7, .4, .5), wood); cart.position.set(0, .3, -2.4); cart.rotation.y = .1; g.add(cart);
    for (let i = 0; i < 9; i++) {
      const col = i % 3 ? 0x7fe8ff : 0xb88cff, m = std(col, { emissive: col, emissiveIntensity: .9, roughness: .2 }), a = -1.4 + i / 8 * 2.8, r = 1.4 + R() * 1.2;
      for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(.18 + R() * .15, 0), m); c.scale.y = 2 + R() * 1.5; c.position.set(Math.sin(a) * r + (R() - .5) * .4, .3 + R() * .8 + (a > -.5 && a < .5 ? 1.4 : 0), .6 + Math.cos(a) * r * .8 - .4); c.rotation.set((R() - .5) * .8, R() * 3, (R() - .5) * .8); g.add(c); }
    }
    const l = new THREE.PointLight(0x7fe8ff, 6, 10, 1.6); l.position.set(0, 1.4, -1.2); g.add(l);
    return 4.2;
  }

  lm_moonspire(g) {
    const white = std(0xdfe4f2, { emissive: 0x1c2438 }), rock = std(0x4a5068);
    const crag = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), rock); crag.scale.set(2.4, 1.6, 2.4); crag.position.y = .3; g.add(crag);
    let y = 1.2;
    for (const [r0, r1, h] of [[1.1, .95, 2.6], [.85, .7, 2.6], [.62, .48, 2.4], [.42, .12, 2.6]]) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 12), white); c.position.y = y + h / 2; g.add(c); y += h;
    }
    for (const [ty, tr] of [[3.8, 1.9], [6.4, 1.5]]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(tr, tr * .8, .22, 20), white); t.position.y = ty; g.add(t);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, p = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .35, 5), white); p.position.set(Math.sin(a) * tr * .92, ty + .28, Math.cos(a) * tr * .92); g.add(p); }
    }
    const orb = new THREE.Mesh(new THREE.SphereGeometry(.4, 20, 12), new THREE.MeshBasicMaterial({ color: 0xeef2ff })); orb.position.y = y + .6; g.add(orb);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: 0xb8c8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); halo.position.y = y + .6; halo.scale.setScalar(4); g.add(halo);
    const l = new THREE.PointLight(0xb8c8ff, 8, 16, 1.4); l.position.y = y; g.add(l);
    // A ring of cloud turns round the spire's waist.
    const cloudMat = new THREE.SpriteMaterial({ map: this.glow, color: 0xc0cae8, transparent: true, opacity: .42, depthWrite: false });
    const ring = new THREE.Group(); ring.position.y = 3.2; g.add(ring);
    for (let i = 0; i < 12; i++) { const c = new THREE.Sprite(cloudMat), a = i / 12 * TAU; c.position.set(Math.sin(a) * 3.1, (i % 3) * .3, Math.cos(a) * 3.1); c.scale.set(3.4, 1.4, 1); ring.add(c); }
    this.anim.push(t => { ring.rotation.y = t * .08; orb.position.y = y + .6 + Math.sin(t * 1.2) * .12; halo.position.y = orb.position.y; });
    return y + 1.6;
  }

  lm_frostmere(g) {
    const R = this.R, ice = std(0xa8d4f4, { emissive: 0x2a5a8a, emissiveIntensity: .7, roughness: .1, transparent: true, opacity: .9 }), lake = std(0x9fc0e0, { emissive: 0x10243c, roughness: .08, metalness: .4, flatShading: false });
    const snow = std(0xeef4ff, { emissive: 0x18223a }), dark = std(0x1a2e2c);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), lake); disc.rotation.x = -Math.PI / 2; disc.position.y = .03; g.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(3.25, .16, 5, 40), snow); rim.rotation.x = Math.PI / 2; rim.scale.z = .5; g.add(rim);
    for (let i = 0; i < 9; i++) {
      const a = (i - 4) * .22, h = 1.6 + (4 - Math.abs(i - 4)) * .9 + R() * .6, c = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), ice);
      c.scale.set(.28 + R() * .15, h / 2, .28 + R() * .15); c.position.set(Math.sin(a) * 2.2, h / 2, 1.6 + Math.cos(a) * .6); c.rotation.y = R() * 3; g.add(c);
    }
    for (let i = 0; i < 14; i++) {
      const a = R() * TAU, r = 3.6 + R() * 1.6, x = Math.sin(a) * r, z = Math.cos(a) * r, h = 1 + R() * .8;
      if (z < -2.5 && Math.abs(x) < 1.8) continue;
      const c = new THREE.Mesh(new THREE.ConeGeometry(.4, h, 6), dark); c.position.set(x, h / 2, z); g.add(c);
      const s = new THREE.Mesh(new THREE.ConeGeometry(.28, h * .45, 6), snow); s.position.set(x, h * .78, z); g.add(s);
    }
    const l = new THREE.PointLight(0x8fd0ff, 6, 12, 1.6); l.position.set(0, 2, 1); g.add(l);
    // Aurora over the mere.
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'uniform float uTime; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; p.z += sin(uv.x * 7. + uTime * .3) * 1.4; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }',
      fragmentShader: 'uniform float uTime; varying vec2 vUv; void main(){ float x = vUv.x, v = vUv.y; float r = pow(abs(sin(x * 40. + sin(x * 9. + uTime * .5) * 2. + uTime * .2)), 2.) * .5 + .5; float f = smoothstep(0., .08, v) * pow(1. - v, 1.6) * smoothstep(0., .15, x) * smoothstep(1., .85, x); vec3 c = mix(vec3(.24, 1., .6), vec3(.6, .35, 1.), smoothstep(.1, .9, v)); gl_FragColor = vec4(c * r * f * .7, 1.); }',
    });
    const aur = new THREE.Mesh(new THREE.PlaneGeometry(16, 5, 48, 1), mat); aur.position.set(0, 8.5, 5); aur.rotation.y = Math.PI; g.add(aur);
    this.anim.push(t => { mat.uniforms.uTime.value = t; });
    return 6;
  }

  lm_generic(g) {
    const stone = std(0x7a7c88);
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, s = new THREE.Mesh(new THREE.BoxGeometry(.5, 1.6, .35), stone); s.position.set(Math.sin(a) * 2, .8, Math.cos(a) * 2); s.rotation.y = a; g.add(s); }
    this.flame(g, 0, .6, 0, 0xff9cf0, 1.2);
    return 3.2;
  }

  // A flickering flame sprite (and, if asked, a light).
  flame(g, x, y, z, color, size = 1, light = 0) {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    f.position.set(x, y, z); g.add(f);
    const ph = this.R() * 10;
    this.anim.push(t => { const k = .85 + Math.sin(t * 9 + ph) * .1 + Math.sin(t * 23 + ph) * .06; f.scale.set(size * k, size * 1.4 * k, 1); });
    if (light) { const l = new THREE.PointLight(color, light, 12, 1.6); l.position.set(x, y + .4, z); g.add(l); }
  }

  buildKnight() {
    const k = this.k = buildKnight();
    k.root.scale.setScalar(.62); k.glow.visible = false;
    k.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.scene.add(k.root);
    this.kanim = new KnightAnimator(k);
    this.wisp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: 0xd8ecff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.wisp.scale.setScalar(.7); this.scene.add(this.wisp);
    this.ks = 0; this.kyaw = 0;
  }

  // ---------------------------------------------------------------- state
  node(id) { return this.nodes.find(n => n.id === id); }
  unlocked(id) { return this.G.save.data.unlocked.includes(id); }
  status(id) {
    const d = this.G.save.data, st = d.missions[id];
    return !d.unlocked.includes(id) ? 'sealed' : st?.cleared ? 'cleared' : st?.shrine ? 'inprogress' : 'new';
  }

  // Open the map: place the knight at the mission last walked (or the one just cleared) and queue any reveals.
  prepare(focus) {
    if (!this.built) this.build();
    const d = this.G.save.data;
    d.seen ||= d.unlocked.slice(0, -1);
    if (!d.seen.includes(this.G.ORDER[0])) d.seen.push(this.G.ORDER[0]);
    const cur = this.node(focus) || this.node(d.mission) || this.nodes[0];
    this.ks = cur.s; this.target = null; this.selected = cur.id; this.entering = null; this.moving = false;
    this.k.setWeapon(d.wield || 'sword', d.arms || ['sword']);
    this.reveals = this.nodes.filter(n => d.unlocked.includes(n.id) && !d.seen.includes(n.id));
    this.revealing = null; this.revealWait = .9;
    this.refresh();
    const p = this.pointAt(this.ks);
    this.camT = new THREE.Vector3(p.x, p.y, p.z); this.camPos = null;
    this.kanim.stop();
  }

  // The furthest point of the road that is open and has been shown.
  litTo() {
    const d = this.G.save.data;
    let s = 0;
    for (const n of this.nodes) if (d.unlocked.includes(n.id) && d.seen.includes(n.id)) s = Math.max(s, n.s);
    return s;
  }

  refresh() {
    const d = this.G.save.data;
    this.lightRoad(this.litTo());
    for (const n of this.nodes) {
      const st = this.status(n.id), hidden = st === 'sealed' || !d.seen.includes(n.id);
      n.shroud.visible = hidden; n.shroud.userData.mat.opacity = .8;
      n.ring.material.color.setHex(STATE_COL[st]); n.disc.material.color.setHex(STATE_COL[st]);
      n.ring.visible = n.disc.visible = !hidden;
    }
  }

  setActive(on) {
    if (on === this.active) return;
    this.active = on;
    const G = this.G;
    if (on) { G.audio.music('explore'); G.hud.show(false); }
    else { this.entering = null; if (G.state === 'title') G.audio.music('none'); if (G.state === 'play') G.hud.show(true); }
  }

  bindLabels(root) {
    this.labels = {};
    for (const el of root.querySelectorAll('.owl')) this.labels[el.dataset.id] = el;
  }

  // Choose a landmark. Open ones the knight walks to; a sealed one can be looked at, not reached.
  select(id, walk = true) {
    const n = this.node(id);
    if (!n || this.entering || this.revealing) return;
    if (this.selected !== id) {
      this.selected = id; this.G.audio.sfx('ui');
      if (this.G.menu.top?.screen === 'map') this.G.menu.render();
    }
    if (walk && this.unlocked(id) && this.G.save.data.seen.includes(id)) this.target = n.s;
  }

  // Keyboard / pad travel: go to the neighbouring landmark lying most nearly the way pressed on screen.
  step(dir) {
    const i = this.G.ORDER.indexOf(this.selected), from = this.nodes[i];
    const want = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[dir] || dir;
    const a = this.screen(from.x, from.y, from.z);
    let best = null, bd = .3;
    for (const n of [this.nodes[i - 1], this.nodes[i + 1]]) {
      if (!n) continue;
      const b = this.screen(n.x, n.y, n.z); if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, dot = (dx * want[0] + dy * want[1]) / l;
      if (dot > bd) { bd = dot; best = n; }
    }
    if (!best) best = this.nodes[i + (want[0] + -want[1] > 0 ? 1 : -1)];
    if (best) this.select(best.id);
  }

  screen(x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    if (v.z > 1) return null;
    return { x: (v.x * .5 + .5) * innerWidth, y: (-v.y * .5 + .5) * innerHeight };
  }

  // A click on the map: the nearest landmark or standing ring under the pointer.
  pick(cx, cy) {
    let best = null, bd = 80;
    for (const n of this.nodes) {
      for (const [x, y, z] of [[n.x, n.y, n.z], [n.lx, n.y + n.top * .45, n.lz]]) {
        const p = this.screen(x, y, z); if (!p) continue;
        const d = Math.hypot(p.x - cx, p.y - cy);
        if (d < bd) { bd = d; best = n; }
      }
    }
    if (best) this.select(best.id);
  }

  // Set out: the knight steps into the gate ring, the light rises, and the mission begins.
  enter(id) {
    const n = this.node(id);
    if (!n || this.entering || this.revealing || !this.unlocked(id)) return;
    this.select(id, false);
    this.target = null; this.ks = n.s;
    this.entering = { id, t: 0, started: false };
    this.kanim.play('fog', 1, .1);
    this.G.audio.sfx('fog');
    this.fx.ring({ x: n.x, z: n.z }, 0x8ff0ff, 3, .6, n.y + .15);
    this.fx.motes({ x: n.x, y: n.y + .4, z: n.z }, 0x9ff3ff, 40, .9, 3, .12, 1.4);
    this.G.menu.el.classList.add('leaving');
  }

  // ---------------------------------------------------------------- frame
  update(dt, inp) {
    if (!this.active) return;
    const G = this.G;
    this.t += dt;
    const aspect = innerWidth / innerHeight;
    if (Math.abs(this.camera.aspect - aspect) > 1e-3) { this.camera.aspect = aspect; this.camera.updateProjectionMatrix(); }
    this.fx.setScale(innerHeight * G.renderer.getPixelRatio(), this.camera.fov);

    // The stick travels too, one landmark per flick.
    const mv = inp.padStick, mag = Math.hypot(mv.lx, mv.ly);
    this.stickT = (this.stickT || 0) - dt;
    if (mag > .6 && this.stickT <= 0) { this.stickT = .4; this.step([mv.lx / mag, mv.ly / mag]); }
    if (mag < .3) this.stickT = 0;

    // Reveals: the road lights stone by stone to a newly opened mission, then the mist lifts.
    if (!this.revealing && !this.entering && this.reveals.length && (this.revealWait -= dt) <= 0) {
      const n = this.reveals.shift();
      this.revealing = { n, from: this.litTo(), t: 0 };
      this.selected = n.id; if (G.menu.top?.screen === 'map') G.menu.render();
    }
    if (this.revealing) {
      const r = this.revealing, n = r.n, dur = Math.max(1.4, (n.s - r.from) / 14);
      r.t += dt;
      const k = clamp(r.t / dur, 0, 1);
      this.lightRoad(lerp(r.from, n.s, smooth(k)));
      if (k >= 1) {
        n.shroud.userData.mat.opacity = Math.max(0, .8 - (r.t - dur) * .8);
        if (!r.chimed) { r.chimed = true; G.audio.sfx('rest'); this.fx.ring({ x: n.x, z: n.z }, 0xe6c36a, 4, .8, n.y + .15); this.fx.motes({ x: n.lx, y: n.y + 1, z: n.lz }, 0xffe7a0, 50, 2.5, 3, .14, 2); }
        if (r.t > dur + 1) {
          G.save.data.seen.push(n.id); G.save.write();
          this.revealing = null; this.revealWait = .6;
          this.refresh();
          this.select(n.id);
          if (G.menu.top?.screen === 'map') G.menu.render();
        }
      }
    }

    // Walk the road.
    let moving = false;
    if (this.target !== null && !this.entering) {
      const ds = this.target - this.ks, st = Math.sign(ds) * Math.min(Math.abs(ds), SPEED * dt);
      this.ks += st; moving = Math.abs(ds) > .02;
      if (!moving) this.target = null;
      else { const t = this.tangentAt(this.ks); this.kyaw = Math.atan2(t.x * Math.sign(ds), t.z * Math.sign(ds)); }
    }
    const kp = this.pointAt(this.ks), sel = this.node(this.selected);
    if (!moving && !this.entering) {   // at rest, turn to look at the landmark
      const want = Math.atan2(sel.lx - kp.x, sel.lz - kp.z);
      if (Math.hypot(sel.x - kp.x, sel.z - kp.z) < 1.5) this.kyaw += angleDiff(this.kyaw, want) * Math.min(1, dt * 4);
    }
    const k = this.k;
    k.root.position.set(kp.x, kp.y, kp.z); k.root.rotation.y = this.kyaw;
    this.kanim.update(dt, { speed: moving ? SPEED / .62 * .55 : 0, forward: 1, side: 0, sprint: moving, stance: 'mid', weapon: G.save.data.wield || 'sword' });
    if (moving && Math.floor(this.kanim.gait / Math.PI) !== this.lastStep) { this.lastStep = Math.floor(this.kanim.gait / Math.PI); G.audio.sfx('step', { vol: .5 }); }
    this.wisp.position.set(kp.x - Math.cos(this.kyaw) * .4, kp.y + 1.55 + Math.sin(this.t * 2.3) * .08, kp.z + Math.sin(this.kyaw) * .4);
    if (Math.random() < dt * 6) this.fx.motes(this.wisp.position, 0xcff6ff, 1, .05, .1, .05, .6);

    // Setting out.
    if (this.entering) {
      const e = this.entering; e.t += dt;
      const n = this.node(e.id);
      n.beam.material.opacity = Math.min(.55, e.t * .8);
      if (Math.random() < dt * 40) this.fx.motes({ x: n.x, y: n.y + .2, z: n.z }, 0x9ff3ff, 1, .9, 4, .1, 1);
      if (e.t > .6) G.menu.el.querySelector('.owfade')?.classList.add('on');
      if (e.t > 1.3 && !e.started) { e.started = true; G.startMission(e.id); }
    }

    // Selection: a beam over the chosen landmark's ring; rings pulse.
    for (const n of this.nodes) {
      const on = n.id === this.selected;
      if (!this.entering || n.id !== this.entering.id) n.beam.material.opacity += ((on && n.ring.visible ? .16 + Math.sin(this.t * 2.5) * .04 : 0) - n.beam.material.opacity) * Math.min(1, dt * 6);
      n.ring.scale.setScalar(1 + (on ? Math.sin(this.t * 3) * .06 : 0));
      if (n.shroud.visible) n.shroud.children.forEach((c, i) => { if (c.isSprite) c.position.y += Math.sin(this.t * .6 + i) * .004; });
    }

    // Camera: over the knight's shoulder of the world, leaning toward the chosen landmark.
    const lm = new THREE.Vector3(sel.lx, sel.y + sel.top * .35, sel.lz), focus = new THREE.Vector3(kp.x, kp.y, kp.z).lerp(lm, .4);
    this.camT.lerp(focus, 1 - Math.exp(-dt * 3.5));
    const T = this.camT, want = new THREE.Vector3(T.x + 2 + Math.sin(this.t * .1) * .8, T.y + 22, T.z - 23);
    if (!this.camPos) this.camPos = want.clone();
    this.camPos.lerp(want, 1 - Math.exp(-dt * 3));
    this.camera.position.copy(this.camPos); this.camera.lookAt(T.x, T.y + .8, T.z + 2);
    this.sun.position.set(T.x - 26, T.y + 42, T.z - 24); this.sun.target.position.copy(T);

    for (const f of this.anim) f(this.t);
    this.fx.update(dt, this.t);

    // Labels float over their landmarks.
    for (const n of this.nodes) {
      const el = this.labels[n.id]; if (!el) continue;
      const p = this.screen(n.lx, n.y + n.top + .5, n.lz);
      if (!p) { el.style.display = 'none'; continue; }
      el.style.display = ''; el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
    }
  }

  render(renderer) { renderer.render(this.scene, this.camera); }
}
