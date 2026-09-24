// Mission 3: the Gnawed Deep, a ratman mine under the mountains, lit by moon-crystals. Walked south to north.
//   The Mine Mouth (first Moonwell) → the Upper Drift → the Crystal Gallery → the Lower Drift
//   → the Breaker's Pit (Grinder holds the mine gate) → the Brood Warren (second Moonwell)
//   → Briar Seal → the Seer's Hollow (Mother Skritch).
import * as THREE from 'three';
import { boxGeo } from '../world.js';
import { ring, pathSides, distToPath, ringCliffs } from './shape.js';

const MOUTH = { x: 0, z: 0, r: 10.5 }, GALLERY = { x: 0, z: 56, r: 17 }, PIT = { x: 0, z: 110, r: 11 }, HOLLOW = { x: 0, z: 176.4, r: 17 };
const DRIFT_A = [[0, 10, 3.3], [-3, 17, 3.6], [-2, 25, 3.8], [3, 32, 3.8], [0, 39.4, 3.8]];
const DRIFT_B = [[0, 72.6, 3.7], [5, 80, 3.6], [7, 88, 3.8], [2, 95, 3.6], [0, 99.1, 3.5]];
// The warren's walls, from the mine gate round to the seal corridor (the left side mirrors it).
const WARREN = [[3.4, 120.5], [10, 121.5], [17.5, 127], [17.5, 146], [11, 151], [3.8, 152], [3.8, 159.6]];
const CRYSTAL = 0x7fe8ff, AMETHYST = 0xb88cff;

function playable(x, z, m = 0) {
  const near = (c, r) => Math.hypot(x - c.x, z - c.z) < r + m;
  return near(MOUTH, MOUTH.r + 2) || distToPath(DRIFT_A, x, z) < 6 + m || near(GALLERY, GALLERY.r + 2.5) || distToPath(DRIFT_B, x, z) < 6 + m
    || near(PIT, PIT.r + 2.5) || (Math.abs(x) < 19.5 + m && z > 118 - m && z < 153 + m) || (Math.abs(x) < 6 && z > 150 && z < 161) || near(HOLLOW, HOLLOW.r + 3);
}

export default {
  id: 'deep',
  name: 'The Gnawed Deep',
  blurb: 'A ratman mine beneath the mountains, lit by moon-crystals. Its brood-mother reads the future in the plague she brews.',
  level: 24,
  seed: 2468,
  cave: true,
  tier: 1.6,
  fog: { color: 0x0c0a14, byArea: { mouth: .03, driftA: .036, gallery: .024, driftB: .036, pit: .028, warren: .032, hollow: .018 }, base: .03 },
  light: { sky: 0x8a7ac8, ground: 0x221a2c, hemi: 1.55, moonColor: 0xa89cff, moon: 1.5 },
  enemyGlow: .2,   // foes catch a little crystal light so they read against the dark
  intro: 'The warren was only ever a mouth.\nGo down into the Deep, and silence the Seer.',
  outro: 'Mother Skritch falls among her crystals.',
  endingTitle: 'THE DEEP IS STILL',
  ending: 'Mother Skritch falls among her crystals, and one by one they go dark. Without their seer the warren scatters into the tunnels, the goblin fires die, and the roots of the fae realm drink moonlight again.\nThe paths are still, for now. Walk them again and every foe will remember you.',
  exitToast: 'The crystals dim. A Pixie Gate rises from the dark',
  motes: { base: 0x9fe8ff, warren: 0x9cff5a, hollow: 0xc9b4ff },
  titleShrine: 'mouth',

  areas: [
    { id: 'mouth', name: 'The Mine Mouth', x0: -12, x1: 12, z0: -12, z1: 10.5 },
    { id: 'driftA', name: 'The Upper Drift', x0: -9, x1: 9, z0: 10.5, z1: 39.5 },
    { id: 'gallery', name: 'The Crystal Gallery', x0: -19, x1: 19, z0: 39.5, z1: 72.6 },
    { id: 'driftB', name: 'The Lower Drift', x0: -6, x1: 13, z0: 72.6, z1: 99.3 },
    { id: 'pit', name: "The Breaker's Pit", x0: -12, x1: 12, z0: 99.3, z1: 120.5 },
    { id: 'warren', name: 'The Brood Warren', x0: -19, x1: 19, z0: 120.5, z1: 157 },
    { id: 'hollow', name: "The Seer's Hollow", x0: -19, x1: 19, z0: 157, z1: 195 },
  ],

  shrines: {
    mouth: { id: 'mouth', name: 'Moonwell of the Mine Mouth', x: -3.5, z: -3, spawn: [-1.4, -1.4], yaw: .3 },
    warren: { id: 'warren', name: 'Moonwell of the Brood Warren', x: -13, z: 126, spawn: [-11, 127.5], yaw: .8 },
  },

  spawns: [
    // Mouth and the Upper Drift
    { id: 'd1', type: 'ratman-scout', x: 2.5, z: 6, yaw: Math.PI, idle: 'sleep' },
    { id: 'd2', type: 'ratman-delver', x: -2.7, z: 19, yaw: Math.PI },
    { id: 'd3', type: 'ratman-slinger', x: 2.3, z: 31, yaw: Math.PI },
    // The Crystal Gallery
    { id: 'g1', type: 'ratman-brute', x: 0, z: 60, yaw: Math.PI, patrol: [[0, 60], [-8, 54], [8, 52]] },
    { id: 'g2', type: 'ratman-glowseer', x: -9, z: 66, yaw: 2.6 },
    { id: 'g3', type: 'ratman-skirmisher', x: 7, z: 49, yaw: -2.6 },
    { id: 'g4', type: 'ratman-skirmisher', x: -7, z: 47, yaw: 2.4, idle: 'sleep' },
    { id: 'g5', type: 'ratman-poisoner', x: 11, z: 62, yaw: -2.2 },
    { id: 'g6', type: 'ratman-delver', x: -12, z: 54, yaw: 2 },
    { id: 'g7', type: 'goblin-bomber', x: 8, z: 68, yaw: -2.8 },
    // The Lower Drift
    { id: 'b1', type: 'ratman-delver', x: 5, z: 79.5, yaw: Math.PI },
    { id: 'b2', type: 'ratman-assassin', x: 7, z: 87.5, yaw: -2.6, idle: 'sleep' },
    { id: 'b3', type: 'ratman-assassin', x: 2.5, z: 94.5, yaw: Math.PI },
    // The Breaker's Pit
    { id: 'grinder', type: 'grinder', x: 0, z: 114, yaw: Math.PI, elite: 'warden' },
    // The Brood Warren
    { id: 'w1', type: 'ratman-packleader', x: 0, z: 138, yaw: Math.PI },
    { id: 'w2', type: 'ratman-skirmisher', x: -8, z: 141, yaw: Math.PI, patrol: [[-8, 141], [-12, 131], [-4, 128]] },
    { id: 'w3', type: 'ratman-skirmisher', x: 8, z: 128, yaw: Math.PI },
    { id: 'w4', type: 'ratman-glowseer', x: 12, z: 146, yaw: -2.6 },
    { id: 'w5', type: 'ratman-poisoner', x: -14, z: 146, yaw: 2.6 },
    { id: 'w6', type: 'ratman-brute', x: 6, z: 146, yaw: Math.PI },
    { id: 'w7', type: 'ratman-delver', x: -3, z: 130, yaw: Math.PI },
    // The Seer's Hollow
    { id: 'boss', type: 'skritch', x: 0, z: 184, yaw: Math.PI, elite: 'boss' },
  ],
  adds: [
    { id: 'add1', type: 'ratman-skirmisher', x: -9, z: 184, yaw: Math.PI, add: true },
    { id: 'add2', type: 'ratman-skirmisher', x: 9, z: 184, yaw: Math.PI, add: true },
  ],
  boss: 'boss',
  phase2Line: 'The Plague Seer calls her brood',

  hazards: [{ x: -9, z: 134, r: 2.6 }, { x: 10, z: 139, r: 2.3 }, { x: -4, z: 147, r: 1.8 }],

  messages: [
    { x: 1.5, z: -.5, text: 'Ratman Delvers burrow beneath you. When dust races toward you across the floor, dash aside before the ground breaks.' },
    { x: -2.5, z: 36.5, text: 'Glowseers blink away when you close in. Their orbs can be cut down, or deflected back at them.' },
    { x: 2.4, z: 100.8, text: 'Grinder the Tunnel-Breaker brings the roof down. Watch the floor for the shadows of falling stone.' },
    { x: -2.2, z: 123, text: 'The Plague Seer casts her orbs in rings. Cut through the ring, or put a crystal between you and her.' },
    { x: 1.8, z: 154.5, text: 'Beyond the briars, Mother Skritch waits among her crystals.' },
  ],

  items: [
    { id: 'glimmer1', x: -14, z: 60, kind: 'glimmer', amount: 1400, label: 'Glimmer Shard', desc: '+1400 Glimmer' },
    { id: 'grace1', x: 12, z: 47, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'glimmer2', x: 9.5, z: 91.5, kind: 'glimmer', amount: 1600, label: 'Glimmer Shard', desc: '+1600 Glimmer' },
    { id: 'glimmer3', x: 16, z: 132, kind: 'glimmer', amount: 2000, label: 'Glimmer Shard', desc: '+2000 Glimmer' },
    { id: 'c-echo', x: 6, z: 3.5, kind: 'charm', charm: 'echo', label: 'Charm' },
    { id: 'c-moonpetal', x: -3, z: 70, kind: 'charm', charm: 'moonpetal', label: 'Charm' },
    { id: 'c-rootbound', x: -16, z: 144, kind: 'charm', charm: 'rootbound', label: 'Charm' },
  ],

  gate: { x: 0, z: 120.5, width: 6.8, guardian: 'grinder', style: 'portcullis', toast: 'The mine gate grinds open', banner: 'TUNNEL-BREAKER FELLED', charm: 'knuckle' },
  bossCharm: 'seereye',
  seal: { x: 0, z: 155.5, yaw: 0, width: 7.6, height: 6.8, inside: [0, 160.5] },
  exit: { x: 0, z: 183 },

  build(w, R) {
    const g = w.group, M = w.mats;
    const avoid = [...this.spawns, ...this.items, ...Object.values(this.shrines), ...this.messages, ...this.hazards];
    const clear = (x, z, d = 2.2) => avoid.every(s => Math.hypot(s.x - x, s.z - z) > d + (s.r || 0));

    // Floors: grit everywhere, dressed stone in the Seer's Hollow.
    w.floor(-80, -60, 80, 240, 'cavefloor', 6, -.01);
    const hollowFloor = M.arena.clone(); hollowFloor.color.setHex(0x5a5270); hollowFloor.emissive.setHex(0x120a22);
    w.disc(HOLLOW.x, HOLLOW.z, HOLLOW.r - .2, hollowFloor, 4.1);
    const pitFloor = M.arena.clone(); pitFloor.color.setHex(0x4a4450); pitFloor.emissive.setHex(0x060408);
    w.disc(PIT.x, PIT.z, PIT.r - .2, pitFloor, 4.1);

    // Chambers and drifts.
    ringCliffs(w, MOUTH, MOUTH.r, 20, [9, 10], 10, 3, R, 2);
    ringCliffs(w, GALLERY, GALLERY.r, 28, [0, 27, 13, 14], 12, 4, R, 2);
    ringCliffs(w, PIT, PIT.r, 20, [0, 19, 9, 10], 11, 3, R, 2);
    ringCliffs(w, HOLLOW, HOLLOW.r, 28, [0, 27], 13, 4, R, 2);
    for (const P of [DRIFT_A, DRIFT_B]) {
      const S = pathSides(P);
      for (const side of [S.L, S.R]) for (let i = 0; i < side.length - 1; i++) w.cliff(...side[i], ...side[i + 1], { h: 10 + R() * 3, th: 2 });
    }
    for (const sx of [1, -1]) {
      const pts = WARREN.map(([x, z]) => [x * sx, z]);
      for (let i = 0; i < pts.length - 1; i++) w.cliff(...pts[i], ...pts[i + 1], { h: 11 + R() * 3, th: 2 });
    }
    w.batch('rock', boxGeo(8.4, 2.4, 2.4, 3).translate(0, 7.2, 120.5));   // lintel over the mine gate
    // A rockfall seals the way the knight came in.
    for (let i = 0; i < 9; i++) w.boulder(-4 + i + (R() - .5), -8.4 + R() * 1.2, 1 + R() * 1.1, 300 + i);

    // Timber frames shore up the drifts.
    for (const P of [DRIFT_A, DRIFT_B]) {
      for (let i = 1; i < P.length - 1; i++) {
        const [x, z, hw] = P[i], a = P[i - 1], b = P[i + 1];
        let nx = b[1] - a[1], nz = -(b[0] - a[0]); const n = Math.hypot(nx, nz); nx /= n; nz /= n;
        const inset = hw - 1.05;
        if (clear(x + nx * inset, z + nz * inset, 1) && clear(x - nx * inset, z - nz * inset, 1)) w.timber(x - nx * inset, z - nz * inset, x + nx * inset, z + nz * inset);
      }
    }
    w.timber(-2.4, 9.2, 2.4, 9.2); w.timber(-2.6, 99.8, 2.6, 99.8);

    // Rails run down the Upper Drift and across the gallery floor; carts lie where the miners left them.
    w.rails(DRIFT_A.map(([x, z]) => [x, z]).concat([[-3, 48], [-10, 58], [-13, 64]]));
    w.cart(-4.2, 44.5, .5, true); w.cart(14, 124.5, -.9); w.cart(-6.5, 21.5, .4);

    // Moon-crystals: cyan in the upper mine, violet deeper down, great pillars round the Hollow.
    const cr = (x, z, h, c, light = true) => { if (clear(x, z, 1.6)) w.crystal(x, z, h, c, Math.round(x * 7 + z * 3), light); };
    cr(-6, 4, 1.8, CRYSTAL); cr(6.5, -2.5, 2.4, CRYSTAL); cr(-7.5, -5, 1.4, CRYSTAL, false);
    for (let i = 0; i < 12; i++) {
      const a = (i + .5) / 12 * Math.PI * 2; if (Math.abs(Math.sin(a)) < .3) continue;
      const [x, z] = ring(GALLERY, GALLERY.r - 2.6, a); cr(x, z, 2 + R() * 2.2, i % 3 ? CRYSTAL : AMETHYST, i % 2 === 0);
    }
    cr(3, 57, 3.2, CRYSTAL); cr(-4, 63, 1.6, AMETHYST, false);
    cr(-5.2, 21, 1.4, CRYSTAL); cr(5.5, 29, 1.6, CRYSTAL); cr(8.5, 84, 1.5, AMETHYST); cr(-.8, 91, 1.4, AMETHYST);
    for (const [x, z] of [[-7.5, 104], [7.5, 104], [-8.5, 115], [8.5, 115]]) cr(x, z, 1.8, AMETHYST);
    for (const [x, z, h] of [[-15, 131, 2], [15.5, 141, 2.6], [-15.5, 142, 1.8], [9, 124, 1.5], [-6, 150, 1.4], [6, 150, 1.4]]) cr(x, z, h, AMETHYST);
    for (let i = 0; i < 6; i++) { const [x, z] = ring(HOLLOW, 11, (i + .5) / 6 * Math.PI * 2); w.crystal(x, z, 5.5, AMETHYST, 900 + i, true); }
    for (let i = 0; i < 16; i++) { const a = (i + .5) / 16 * Math.PI * 2, [x, z] = ring(HOLLOW, HOLLOW.r - 1.4, a); if (Math.abs(a) > .4 && Math.abs(a - Math.PI * 2) > .4) w.crystal(x, z, 1.4 + R() * 1.4, i % 2 ? AMETHYST : CRYSTAL, 950 + i, false); }

    // Stalagmites and boulders: at the walls' feet, and filling the rock beyond so the dark reads as stone.
    for (let i = 0; i < 70; i++) {
      const C = [MOUTH, GALLERY, PIT, HOLLOW][i % 4], a = R() * Math.PI * 2, [x, z] = ring(C, C.r - .8, a);
      if (Math.abs(Math.sin(a / 2)) < .15 || Math.abs(Math.cos(a / 2)) < .15 || !clear(x, z, 2.5)) continue;
      w.boulder(x, z, .7 + R() * 1.1, 400 + i);
    }
    let placed = 0;
    for (let tries = 0; placed < 170 && tries < 5000; tries++) {
      const x = -70 + R() * 140, z = -45 + R() * 260;
      if (playable(x, z, .5)) continue;
      w.stalagmite(x, z, 7 + R() * 12, placed); placed++;
    }
    for (const [x, z, h] of [[-9, 48, 3.5], [10.5, 57, 4], [-3, 76, 2.4], [-11, 139, 3], [12, 135, 3.5], [-2, 104, 2.2]]) if (clear(x, z, 2)) w.stalagmite(x, z, h, Math.round(x * z), true);

    // The Brood Warren: straw nests, bones and a few green rat-fires.
    for (const [x, z, r] of [[-15.5, 128, 1.4], [14.5, 128.5, 1.2], [-16, 136, 1.1], [16, 145, 1.3], [-12, 150, 1.2], [2.5, 131, 1]]) if (clear(x, z, 1.6)) w.nest(x, z, r);
    for (const [x, z] of [[-5, 149.8], [5, 149.8]]) w.brazier(x, z, 0xff5030);
    for (const [x, z] of [[-9.5, 124], [9.5, 136.5], [-15, 141]]) w.campfire(x, z, .7, 0x9cff5a);
    w.brazier(-13.6, 122.8, 0x6fd8ff);
    w.brazier(-6.2, -6.5, 0x6fd8ff);
    for (const [x, z] of [[-4.6, 118.6], [4.6, 118.6]]) w.brazier(x, z, 0xff8a3a);

    // Glowing rot-caps round the pools; bones scattered through the warren and the Hollow.
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const cap = new THREE.SphereGeometry(.11, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const mush = new THREE.InstancedMesh(cap, new THREE.MeshStandardMaterial({ color: 0x9cff5a, emissive: 0x9cff5a, emissiveIntensity: .8 }), 60);
    for (let i = 0; i < 60; i++) {
      const h = this.hazards[i % 3], a = R() * 6.28, r = h.r + .3 + R() * 1.5, k = .5 + R() * .9;
      mush.setMatrixAt(i, mtx.compose(p.set(h.x + Math.sin(a) * r, .03, h.z + Math.cos(a) * r), q.identity(), s.set(k, k * .8, k)));
    }
    g.add(mush);
    const bones = new THREE.InstancedMesh(new THREE.CylinderGeometry(.04, .05, .5, 5), M.bone, 110);
    for (let i = 0; i < 110; i++) {
      const inHollow = i < 50, a = R() * 6.28, r = 3 + R() * 12;
      p.set(inHollow ? Math.sin(a) * r : -16 + R() * 32, .05, inHollow ? HOLLOW.z - Math.cos(a) * r : 122 + R() * 28);
      e.set(Math.PI / 2, R() * 6.28, 0); q.setFromEuler(e);
      bones.setMatrixAt(i, mtx.compose(p, q, s.set(1, .6 + R(), 1)));
    }
    g.add(bones);
    const skull = new THREE.SphereGeometry(.13, 8, 6);
    for (let i = 0; i < 14; i++) { const a = R() * 6.28, r = 4 + R() * 10; w.add(skull, 'bone', Math.sin(a) * r, .1, HOLLOW.z - Math.cos(a) * r, 0, false); }
  },
};
