// Mission 2: the Rotwood Hollow, a goblin-held forest walked from south to north.
//   Hollow's Edge (first Moonwell) → the Thornback Trail → Grubnest village (Brakka holds the palisade gate)
//   → the Rotting Glade (second Moonwell) → Briar Seal → the Pyre of Grimtusk.
import * as THREE from 'three';
import { boxGeo } from '../world.js';

// The trail winds between cliffs: centreline and half-width at each bend.
const TRAIL = [[0, 11, 3.55], [1, 20, 3.8], [6, 30, 4.2], [11, 40, 5.5], [9, 50, 4.5], [3, 57, 4], [0, 63, 4]];
const VILLAGE = { x: 0, z: 84, r: 19 }, ARENA = { x: 0, z: 160, r: 17 }, EDGE_R = 11.5;
const EDGE_LAMPS = [[-5, -8.2], [2.5, -9]];
const ring = (c, r, a) => [c.x + Math.sin(a) * r, c.z - Math.cos(a) * r];   // a = 0 is due south

function trailSides() {
  const L = [], Rt = [];
  for (let i = 0; i < TRAIL.length; i++) {
    const [x, z, w] = TRAIL[i], a = TRAIL[Math.max(0, i - 1)], b = TRAIL[Math.min(TRAIL.length - 1, i + 1)];
    let nx = b[1] - a[1], nz = -(b[0] - a[0]);
    const n = Math.hypot(nx, nz); nx /= n; nz /= n;
    Rt.push([x + nx * w, z + nz * w]); L.push([x - nx * w, z - nz * w]);
  }
  return { L, R: Rt };
}

function distToTrail(x, z) {
  let best = Infinity;
  for (let i = 0; i < TRAIL.length - 1; i++) {
    const [ax, az] = TRAIL[i], [bx, bz] = TRAIL[i + 1], dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}

// Anywhere the knight can walk, plus a margin for the cliffs: kept clear of backdrop trees.
function playable(x, z, m = 0) {
  return Math.hypot(x, z) < EDGE_R + 2 + m || distToTrail(x, z) < 6.5 + m || Math.hypot(x - VILLAGE.x, z - VILLAGE.z) < VILLAGE.r + 2 + m
    || (Math.abs(x) < 21 + m && z > 98 && z < 138 + m) || Math.hypot(x - ARENA.x, z - ARENA.z) < ARENA.r + 2.5 + m || (Math.abs(x) < 6 && z > 134 && z < 146);
}

export default {
  id: 'rotwood',
  name: 'The Rotwood Hollow',
  blurb: 'A drowned forest where goblin fires never go out. Its warlord feeds a great pyre with the roots of the fae realm.',
  level: 12,
  seed: 4321,
  forest: true,
  leaves: true,
  fog: { color: 0x0b1512, byArea: { edge: .03, trail: .034, village: .026, glade: .04, pyre: .016 }, base: .032 },
  light: { sky: 0x7f9fb0, ground: 0x24301c, hemi: 1.5, moonColor: 0xb8d0ff, moon: 1.9 },
  intro: 'Smoke rises over the Rotwood.\nFollow it to the pyre. Put out the fire.',
  outro: 'Grimtusk falls into his own fire.',
  endingTitle: 'THE PYRE IS ASH',
  ending: 'Grimtusk falls into his own fire and the Rotwood breathes again. The goblin warbands scatter into the dark, the warren is broken, and the roots of the fae realm drink moonlight once more.\nThe paths are still, for now. Walk them again and every foe will remember you.',
  exitToast: 'The pyre gutters. A Pixie Gate glows in the ashes',
  motes: { base: 0xc8ff8a, village: 0xffb070, glade: 0x9cff5a, pyre: 0xff6a3a },
  titleShrine: 'edge',

  areas: [
    { id: 'edge', name: "The Hollow's Edge", x0: -14, x1: 14, z0: -14, z1: 11 },
    { id: 'trail', name: 'The Thornback Trail', x0: -8, x1: 20, z0: 11, z1: 64 },
    { id: 'village', name: 'Grubnest', x0: -22, x1: 22, z0: 64, z1: 102 },
    { id: 'glade', name: 'The Rotting Glade', x0: -21, x1: 21, z0: 102, z1: 142 },
    { id: 'pyre', name: 'The Pyre of Grimtusk', x0: -19, x1: 19, z0: 142, z1: 180 },
  ],

  shrines: {
    edge: { id: 'edge', name: "Moonwell of the Hollow's Edge", x: -3.5, z: -4.5, spawn: [-1.4, -2.6], yaw: .25 },
    glade: { id: 'glade', name: 'Moonwell of the Rotting Glade', x: -14, z: 108.5, spawn: [-11.8, 110], yaw: .9 },
  },

  spawns: [
    // The trail
    { id: 'w1', type: 'goblin-scout', x: 2, z: 22, yaw: Math.PI, patrol: [[2, 22], [6.5, 32], [1, 17]] },
    { id: 'w2', type: 'goblin-trapper', x: 9, z: 36, yaw: Math.PI + .4 },
    { id: 'w3', type: 'goblin-archer', x: 11.5, z: 43, yaw: -2.6 },
    { id: 'w4', type: 'goblin-scout', x: 8.5, z: 50.5, yaw: -2.2, idle: 'sleep' },
    { id: 'w5', type: 'goblin-bomber', x: 4, z: 57.5, yaw: 2.8 },
    // Grubnest
    { id: 'v1', type: 'goblin-spearguard', x: -6, z: 76, yaw: Math.PI },
    { id: 'v2', type: 'goblin-spearguard', x: 6, z: 80, yaw: Math.PI, patrol: [[6, 80], [8, 91], [-3, 89]] },
    { id: 'v3', type: 'goblin-shaman', x: 0, z: 92, yaw: Math.PI },
    { id: 'v4', type: 'goblin-poisoner', x: -12, z: 83.5, yaw: 2 },
    { id: 'v5', type: 'goblin-berserker', x: 9.5, z: 85.5, yaw: -2, idle: 'sleep' },
    { id: 'v6', type: 'goblin-archer', x: -8, z: 97.5, yaw: 2.6 },
    { id: 'v7', type: 'goblin-trapper', x: 10, z: 96.5, yaw: -2.6 },
    { id: 'brakka', type: 'brakka', x: 0, z: 99, yaw: Math.PI, elite: 'warden' },
    // The Rotting Glade
    { id: 'm1', type: 'ratman-skirmisher', x: 5, z: 113.5, yaw: Math.PI },
    { id: 'm2', type: 'ratman-skirmisher', x: -10, z: 126, yaw: Math.PI, patrol: [[-10, 126], [-14, 117.5], [-4, 123]] },
    { id: 'm3', type: 'ratman-poisoner', x: 12, z: 117, yaw: -2.4 },
    { id: 'm4', type: 'ratman-assassin', x: 14, z: 130, yaw: -Math.PI / 2, idle: 'sleep' },
    { id: 'm5', type: 'ratman-slinger', x: -15, z: 132.5, yaw: 2.6 },
    { id: 'm6', type: 'ratman-packleader', x: 1, z: 126, yaw: Math.PI },
    // The pyre
    { id: 'boss', type: 'grimtusk', x: 0, z: 166, yaw: Math.PI, elite: 'boss' },
  ],
  adds: [
    { id: 'add1', type: 'goblin-scout', x: -9, z: 167, yaw: Math.PI, add: true },
    { id: 'add2', type: 'goblin-spearguard', x: 9, z: 167, yaw: Math.PI, add: true },
  ],
  boss: 'boss',
  phase2Line: 'Grimtusk calls his warband',

  // Rot pools in the glade and the great pyre itself.
  hazards: [
    { x: -8, z: 118, r: 3 }, { x: 7, z: 124, r: 2.5 }, { x: -2.5, z: 132, r: 2.2 },
    { x: 0, z: 84, r: 2.3, kind: 'fire', poison: 30 },
    { x: 0, z: 172.5, r: 3.2, kind: 'fire', poison: 50 },
  ],

  messages: [
    { x: 1.5, z: -1, text: 'The Rotwood is goblin country. Their Trappers hurl bolas: snared, you cannot sprint.\nDash, and dash again, to shake the cords loose.' },
    { x: -2.6, z: 7.5, text: 'Every stance has its use. High breaks guards and poise; Low slips between blows.\nChange stance as a strike ends to Resonate at the same time.' },
    { x: 2.5, z: 64.5, text: 'Hexers chant to knit the wounds of their kin.\nSilence the chant first, or fight the same foes twice.' },
    { x: -9, z: 104.5, text: 'Rot pools blight the unwary. The Packleader\'s howl wakes the whole glade.' },
    { x: 1.8, z: 137.5, text: 'Grimtusk hurls fire in volleys of three. Never dash where the ground already burns.' },
  ],

  items: [
    { id: 'glimmer1', x: 14.5, z: 40.5, kind: 'glimmer', amount: 700, label: 'Glimmer Shard', desc: '+700 Glimmer' },
    { id: 'grace1', x: -15, z: 80, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'glimmer2', x: 12.5, z: 74.5, kind: 'glimmer', amount: 900, label: 'Glimmer Shard', desc: '+900 Glimmer' },
    { id: 'glimmer3', x: 17, z: 110, kind: 'glimmer', amount: 1200, label: 'Glimmer Shard', desc: '+1200 Glimmer' },
  ],

  gate: { x: 0, z: 102.75, width: 6.6, guardian: 'brakka', style: 'palisade', toast: 'The palisade gate sinks into the mud', banner: 'SKULLSPLITTER FELLED' },
  seal: { x: 0, z: 141, yaw: 0, width: 7.6, height: 6.8, inside: [0, 145] },
  exit: { x: 0, z: 166 },

  build(w, R) {
    const g = w.group, M = w.mats;
    const avoid = [...this.spawns, ...this.items, ...Object.values(this.shrines), ...this.messages, ...EDGE_LAMPS.map(([x, z]) => ({ x, z }))];
    const clear = (x, z, d = 2.2) => avoid.every(s => Math.hypot(s.x - x, s.z - z) > d);

    // Ground: leaf litter everywhere, trampled earth in the village, scorched stone at the pyre.
    w.floor(-80, -60, 80, 220, 'earth', 7, -.01);
    const scorch = M.arena.clone(); scorch.color.setHex(0x6a584c); scorch.emissive.setHex(0x1a0500);
    w.disc(ARENA.x, ARENA.z, ARENA.r - .2, scorch, 4.1);

    // Hollow's Edge: a ring of cliffs open to the north.
    const N = 20;
    for (let i = 0; i < N; i++) {
      if (i === 9 || i === 10) continue;
      const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2;
      w.cliff(...ring({ x: 0, z: 0 }, EDGE_R, a0), ...ring({ x: 0, z: 0 }, EDGE_R, a1), { h: 6.5 + R() * 2.5 });
    }

    // The Thornback Trail: cliffs on both sides.
    const T = trailSides();
    for (const side of [T.L, T.R]) for (let i = 0; i < side.length - 1; i++) w.cliff(...side[i], ...side[i + 1], { h: 7 + R() * 2.5 });
    // Tie the cliffs into the palisade at the village mouth.
    const s0 = ring(VILLAGE, VILLAGE.r, .1745), s1 = ring(VILLAGE, VILLAGE.r, -.1745);
    w.cliff(...T.R[T.R.length - 1], ...s0, { h: 6 });
    w.cliff(...T.L[T.L.length - 1], ...s1, { h: 6 });

    // Grubnest: a palisade ring, open to the south, gated to the north.
    const VN = 36;
    for (let i = 0; i < VN; i++) {
      if (i === 0 || i === 35 || i === 17 || i === 18) continue;
      w.palisade(...ring(VILLAGE, VILLAGE.r, i / VN * Math.PI * 2), ...ring(VILLAGE, VILLAGE.r, (i + 1) / VN * Math.PI * 2));
    }
    // The Rotting Glade: cliffs from the palisade to the seal.
    const gl = ring(VILLAGE, VILLAGE.r, 15 / VN * Math.PI * 2), gr = ring(VILLAGE, VILLAGE.r, 21 / VN * Math.PI * 2);
    for (const pts of [[gl, [19.5, 104], [19.5, 134.5], [3.8, 136], [3.8, 143.4]], [gr, [-19.5, 104], [-19.5, 134.5], [-3.8, 136], [-3.8, 143.4]]]) {
      for (let i = 0; i < pts.length - 1; i++) w.cliff(...pts[i], ...pts[i + 1], { h: 8 + R() * 2 });
    }
    // The Pyre: a ring of cliffs.
    const AN = 28;
    for (let i = 1; i < AN - 1; i++) w.cliff(...ring(ARENA, ARENA.r, i / AN * Math.PI * 2), ...ring(ARENA, ARENA.r, (i + 1) / AN * Math.PI * 2), { h: 9 + R() * 3, th: 2 });

    // Boulders break up the cliff lines.
    const lines = [...T.L.slice(1).map((p, i) => [T.L[i], p]), ...T.R.slice(1).map((p, i) => [T.R[i], p]),
      [gl, [19.5, 104]], [[19.5, 104], [19.5, 134.5]], [gr, [-19.5, 104]], [[-19.5, 104], [-19.5, 134.5]]];
    for (const [a, b] of lines) {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let s = 1.5; s < L - 1; s += 2.5 + R() * 3) {
        const x = a[0] + (b[0] - a[0]) * s / L, z = a[1] + (b[1] - a[1]) * s / L;
        if (clear(x, z, 3)) w.boulder(x, z, .8 + R() * .9, Math.floor(R() * 1000));
      }
    }
    for (let i = 0; i < 26; i++) {
      const a = R() * 6.28, [x, z] = ring({ x: 0, z: 0 }, EDGE_R - .6, a);
      if (Math.abs(a - Math.PI) > .5 && clear(x, z, 2.5)) w.boulder(x, z, .6 + R() * .9, i + 50);
    }
    for (let i = 0; i < 40; i++) {
      const a = .35 + R() * (Math.PI * 2 - .7), [x, z] = ring(ARENA, ARENA.r - .7, a);
      w.boulder(x, z, .8 + R() * 1.2, i + 90);
    }

    // The forest: tall firs and broad trees fill everything the knight can't reach, so the cliffs read as a valley.
    let placed = 0;
    for (let tries = 0; placed < 260 && tries < 4000; tries++) {
      const x = -75 + R() * 150, z = -45 + R() * 250;
      if (playable(x, z, .5)) continue;
      const far = playable(x, z, 14) ? 1 : 1.35;
      if (R() < .6) w.pine(x, z, (9 + R() * 8) * far, placed); else w.tree(x, z, (7 + R() * 5) * far, placed, false);
      placed++;
    }
    // A few old trees within reach, for cover and silhouette.
    for (const [x, z, h] of [[-7.5, 5.5, 8], [8, -5, 9], [6.5, 6.2, 7], [-12.5, 77.5, 9], [15.5, 97, 8], [16.5, 124, 9], [-16.5, 112, 8], [-5, 129, 7]]) w.tree(x, z, h, Math.round(x * z));
    for (const [x, z, h] of [[-17, 116, 5], [11, 106, 6], [-15, 126, 5.5], [15, 118, 6], [5.5, 131, 5]]) w.deadTree(x, z, h, Math.round(x + z));

    // Standing stones around the first Moonwell.
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * 6.28 + .3, x = -3.5 + Math.sin(a) * 4.6, z = -4.5 + Math.cos(a) * 4.6, h = 1.5 + R() * 1.1;
      if (!clear(x, z, 1.4)) continue;
      w.add(boxGeo(.6, h, .4, 1.5), 'rock', x, h / 2, z, a).rotation.z = R() * .16 - .08;
      w.prop(w.addBox(x, z, .3, .2, a, h));
    }

    // Grubnest huts, racks and totems.
    w.hut(-9, 72, 2.3, .7); w.hut(9.5, 72.5, 2.3, -.8); w.hut(-13, 91, 2.6, 2.2); w.hut(13, 90, 2.6, -2.2);
    const bonfire = w.campfire(0, 84, 2.1);
    bonfire.base *= 1.6;
    for (const [x, z] of [[-4.6, 101.2], [4.6, 101.2], [-3.2, 66.8], [3.2, 66.8], [-7.5, 133.6], [7.5, 133.6]]) w.totem(x, z);
    for (const [x, z, r] of [[-5, 90.5, .4], [15, 83, 1.5], [-15.5, 86, -1.4]]) {
      // Drying racks: two posts and a crossbar.
      const rack = new THREE.Group();
      for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, 2.2, 5), M.stake); post.position.set(s * .9, 1.1, 0); rack.add(post); }
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2, 5), M.stake); bar.rotation.z = Math.PI / 2; bar.position.y = 2; rack.add(bar);
      for (let i = 0; i < 4; i++) { const hide = new THREE.Mesh(new THREE.PlaneGeometry(.35, .8), new THREE.MeshStandardMaterial({ color: 0x5a3a28, side: THREE.DoubleSide, roughness: 1 })); hide.position.set(-.6 + i * .4, 1.55, 0); rack.add(hide); }
      rack.position.set(x, 0, z); rack.rotation.y = r; rack.traverse(o => { o.castShadow = true; });
      g.add(rack); w.prop(w.addBox(x, z, 1, .15, r, 2.2));
    }
    const crate = boxGeo(1, 1, 1, 1);
    for (const [x, z, r] of [[-16, 78, .2], [-15.2, 76.9, .6], [16.2, 88, .1], [-4, 69.5, .4], [7, 99.5, .3]]) { w.add(crate, 'wood', x, .5, z, r); w.prop(w.addBox(x, z, .5, .5, r, 1)); }
    w.banner(-5.2, 101.6, 0, 0x5a2a10, 3.4); w.banner(5.2, 101.6, 0, 0x5a2a10, 3.4);

    // Campfires light the trail and the glade; the pyre burns at the far end of the arena.
    for (const [x, z, s] of [[6.8, 27, .8], [13.2, 46, .8], [-.8, 59.5, .8], [-5, 114, .7], [9.5, 133, .7]]) w.campfire(x, z, s);
    for (const [x, z] of EDGE_LAMPS) w.brazier(x, z, 0x6fd8ff);
    w.brazier(-14, 104.5, 0x6fd8ff);
    for (const [x, z] of [[-5, 133.3], [5, 133.3]]) w.brazier(x, z, 0xff5030);
    for (let i = 0; i < 6; i++) { const a = (i + 1) / 7 * Math.PI * 2, [x, z] = ring(ARENA, ARENA.r - 2.6, a); w.brazier(x, z, 0xff4020); }

    // The Pyre: a stacked cone of logs and bones with a banner-pole of skulls.
    const pyre = new THREE.Group(), PZ = 172.5;
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * 6.28, lg = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, 4.2, 6), M.bark);
      lg.position.set(Math.sin(a) * 1.3, 1.6, Math.cos(a) * 1.3); lg.rotation.set(Math.cos(a) * -.5, 0, Math.sin(a) * .5); pyre.add(lg);
    }
    for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), M.bone); const a = R() * 6.28; s.position.set(Math.sin(a) * (2 + R()), .12, Math.cos(a) * (2 + R())); pyre.add(s); }
    pyre.position.set(0, 0, PZ); pyre.traverse(o => { o.castShadow = true; }); g.add(pyre);
    w.addCyl(0, PZ, 2.3, 4);
    const big = w.brazier(0, PZ, 0xff5a1a, false, 3.4, 1.9); big.base = 26;
    w.brazier(.5, PZ - .4, 0xffb040, false, 2.2, 1.3); w.flames.pop();   // a second tongue of flame, no extra light

    // Grass in the clearing and glade; glowing rot-mushrooms in the glade.
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const blade = new THREE.ConeGeometry(.035, .36, 3); blade.translate(0, .18, 0);
    const grass = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: 0x40592b, roughness: 1 }), 2600);
    let gi = 0;
    for (let i = 0; i < 2600; i++) {
      const inEdge = i < 1100, a = R() * 6.28;
      const x = inEdge ? Math.sin(a) * Math.sqrt(R()) * 10.5 : -19 + R() * 38, z = inEdge ? Math.cos(a) * Math.sqrt(R()) * 10.5 : 104 + R() * 31;
      if (!inEdge && this.hazards.some(h => Math.hypot(h.x - x, h.z - z) < h.r)) continue;
      e.set((R() - .5) * .5, R() * 6.28, (R() - .5) * .5); q.setFromEuler(e);
      const k = .6 + R() * 1.1; s.set(k, k * (.7 + R() * .9), k);
      grass.setMatrixAt(gi++, mtx.compose(p.set(x, 0, z), q, s));
    }
    grass.count = gi; grass.receiveShadow = true; g.add(grass);
    const cap = new THREE.SphereGeometry(.11, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    for (const [col, n] of [[0x9cff5a, 60], [0x7fe8ff, 24]]) {
      const mush = new THREE.InstancedMesh(cap, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .8 }), n);
      for (let i = 0; i < n; i++) {
        const h = this.hazards[i % 3], a = R() * 6.28, r = h.r + .3 + R() * 1.6, k = .5 + R() * .9;
        mush.setMatrixAt(i, mtx.compose(p.set(h.x + Math.sin(a) * r, .03, h.z + Math.cos(a) * r), q.identity(), s.set(k, k * .8, k)));
      }
      g.add(mush);
    }

    // Bones and scattered skulls around the pyre and in the village.
    const bones = new THREE.InstancedMesh(new THREE.CylinderGeometry(.04, .05, .5, 5), M.bone, 90);
    for (let i = 0; i < 90; i++) {
      const inArena = i < 60, a = R() * 6.28, r = 3 + R() * 12;
      p.set(inArena ? Math.sin(a) * r : -14 + R() * 28, .05, inArena ? ARENA.z - Math.cos(a) * r : 70 + R() * 28);
      e.set(Math.PI / 2, R() * 6.28, 0); q.setFromEuler(e);
      bones.setMatrixAt(i, mtx.compose(p, q, s.set(1, .6 + R(), 1)));
    }
    g.add(bones);
  },
};
