// Mission 1: the Grubhold, a ruined keep climbed from south to north.
//   Fallen Grove (first Moonwell) → Gatehouse Yard (Gatewarden) → portcullis → Gnawing Halls (second Moonwell)
//   → Briar Seal → Throne of the Warren (Gnawfang). Off the yard's west wall: the Goblin Larder.
import * as THREE from 'three';
import { boxGeo, scaleUV, merge } from '../world.js';
import { rng } from '../util.js';

export default {
  id: 'keep',
  name: 'The Grubhold',
  blurb: 'A ruined keep where goblins hold the gate and ratmen gnaw the halls below. Its warlord sits on a throne of bones.',
  level: 1,
  map: { x: -17, z: -19 },   // where it sits on the Fae Crossroads
  seed: 1234,
  fog: { color: 0x0d1122, byArea: { grove: .028, yard: .024, larder: .03, halls: .03, throne: .014 }, base: .026 },
  intro: 'The warren gnaws at the roots of the fae realm.\nClimb the keep. Fell its lord.',
  outro: 'Gnawfang is dust upon his throne. The Pixie Gate hums with a light older than the keep, and through it the smell of wet leaves and smoke: the Rotwood Hollow, where the goblins keep their fires.',
  exitToast: 'A Pixie Gate opens beyond the throne',
  motes: { base: 0xffb070, grove: 0xc8ff8a, throne: 0xff6a3a },
  titleShrine: 'grove',

  areas: [
    { id: 'grove', name: 'The Fallen Grove', x0: -11, x1: 11, z0: -12, z1: 10 },
    { id: 'yard', name: 'Grubhold Gatehouse', x0: -18, x1: 28, z0: 10, z1: 64 },
    { id: 'larder', name: 'The Goblin Larder', x0: -38.6, x1: -18.01, z0: 28, z1: 58.6 },
    { id: 'halls', name: 'The Gnawing Halls', x0: -19, x1: 12, z0: 64, z1: 120.2 },
    { id: 'throne', name: 'Throne of the Warren', x0: -17, x1: 17, z0: 120.2, z1: 152 },
  ],

  shrines: {
    grove: { id: 'grove', name: 'Moonwell of the Fallen Grove', x: 0, z: -5.5, spawn: [2.2, -4.2], yaw: 0 },
    halls: { id: 'halls', name: 'Moonwell of the Gnawing Halls', x: -16.2, z: 102, spawn: [-13.9, 100.1], yaw: Math.PI / 2 },
  },

  // Enemy placements. idle: 'stand' | 'sleep'. patrol: waypoints. elite: 'warden' | 'boss'.
  spawns: [
    { id: 'g1', type: 'goblin-scout', x: 0, z: 7.6, yaw: 0, idle: 'sleep' },
    { id: 'g2', type: 'goblin-scout', x: 1.2, z: 23, yaw: Math.PI, idle: 'stand' },
    { id: 'g3', type: 'goblin-spearguard', x: -9, z: 37, yaw: Math.PI / 2 },
    { id: 'g4', type: 'goblin-spearguard', x: 7, z: 41, yaw: Math.PI, patrol: [[7, 41], [10, 51], [2, 49]] },
    { id: 'g5', type: 'goblin-archer', x: -14, z: 55, yaw: 2.4 },
    { id: 'g6', type: 'goblin-bomber', x: 13, z: 56, yaw: -2.6 },
    { id: 'g7', type: 'goblin-berserker', x: -7, z: 50, yaw: 2.8, idle: 'sleep' },
    { id: 'g8', type: 'goblin-poisoner', x: 24.5, z: 41, yaw: -Math.PI / 2 },
    // The Goblin Larder
    { id: 'l1', type: 'goblin-bomber', x: -31, z: 51, yaw: Math.PI / 2 },
    { id: 'l2', type: 'goblin-scout', x: -24, z: 35, yaw: -Math.PI / 2, patrol: [[-24, 35], [-33, 38], [-26, 40]] },
    { id: 'l3', type: 'goblin-berserker', x: -34.5, z: 33.5, yaw: .6, idle: 'sleep' },
    { id: 'l4', type: 'goblin-spearguard', x: -22, z: 50, yaw: -Math.PI / 2 },
    { id: 'l5', type: 'goblin-poisoner', x: -33.5, z: 43, yaw: Math.PI / 2 },
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
  ],
  // Summoned by the boss in its second phase.
  adds: [
    { id: 'add1', type: 'ratman-scout', x: -9, z: 146, yaw: Math.PI, add: true },
    { id: 'add2', type: 'ratman-scout', x: 9, z: 146, yaw: Math.PI, add: true },
  ],
  boss: 'boss',
  phase2Line: 'Gnawfang calls the warren',

  messages: [
    { x: 0, z: -1.2, text: 'Move with WASD. Click the screen to take the mouse, and turn the camera with it.\nA gamepad works too.' },
    { x: -4.5, z: 1.5, text: 'Space dashes, and mid-dash nothing can touch you.\nDash just as a blow lands to Moonstep: the world slows around you. Hold Space to sprint.' },
    { x: 4.5, z: 1.5, text: 'Left click strikes, right click strikes hard. Four strikes make a chain.\nHold Shift to guard. Tap it just as a blow lands to Deflect.' },
    { x: 2.6, z: 5, text: 'A goblin dozes ahead. Strike an unaware foe from behind: an Ambush.' },
    { x: -1.6, z: 12.5, text: 'Stamina, the green bar, fuels every strike. As a strike ends, blue light gathers: tap Shift then for Resonance, and the stamina flows back.\n1, 2 and 3 change stance. High hits hardest, Low moves fastest.' },
    { x: 1.6, z: 26, text: 'Strike the moment after a Deflect to Flashcut: one cut that fells a foe outright.\nDrain a foe\'s stamina bar to shatter it, then strike to Execute. Q locks on.' },
    { x: 0, z: 49, text: 'Foes that flare RED unleash Dread strikes. No guard stops them.\nDash through them, or press F as they land to Thorn Counter.' },
    { x: -2, z: 70, text: 'R drinks Moondew. Rest at a Moonwell to refill it, and spend Glimmer there to grow stronger.\nFall, and your Glimmer lingers in your Echo until you reach it again.' },
    { x: 2, z: 104, text: 'Strikes, Deflects and Resonance fill the violet Faelight.\nWhen it is full, G awakens your Fae Shift.' },
    { x: -1.8, z: 114, text: 'Beyond the briars, the Warblade waits upon his throne.' },
  ],

  items: [
    { id: 'grace1', x: 26.2, z: 41, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'glimmer1', x: -16, z: 30.5, kind: 'glimmer', amount: 350, label: 'Glimmer Shard', desc: '+350 Glimmer' },
    { id: 'glimmer2', x: 10.6, z: 110.4, kind: 'glimmer', amount: 600, label: 'Glimmer Shard', desc: '+600 Glimmer' },
    { id: 'grace2', x: -17.8, z: 99.3, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'c-dewdrop', x: -9.3, z: -10.3, kind: 'charm', charm: 'dewdrop', label: 'Charm' },
    { id: 'c-wardstone', x: 15.8, z: 49, kind: 'charm', charm: 'wardstone', label: 'Charm' },
    { id: 'c-thornheart', x: 9.5, z: 103.8, kind: 'charm', charm: 'thornheart', label: 'Charm' },
    { id: 'glimmer-larder', x: -36.2, z: 40, kind: 'glimmer', amount: 500, label: 'Glimmer Shard', desc: '+500 Glimmer', inside: 'lcrate' },
    { id: 'grace-larder', x: -20.4, z: 56.2, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'glaive', x: -8.6, z: 76.4, kind: 'weapon', weapon: 'glaive', label: 'Moonglaive', desc: 'a polearm of moon-silver',
      tip: 'The Moonglaive reaches far and bites deep into posture. V (D-pad ← on a gamepad) switches weapons.\nSwitch as a strike ends for a Switch Strike. Hold a heavy strike to charge it.' },
  ],

  letters: [
    { id: 'maelis1', x: 6.6, z: -10.2, title: 'A Note Pinned to a Grave', text: 'To whoever the Lantern Court sends after me:\n\nThe grove is quiet, but the keep is not. Goblins hold the gate and something older gnaws in the halls beneath it. The Moonwells are dimmer every night I rest at them, as though someone were drawing the water off from the other end.\n\nI am going ahead to find where the moonlight is going. If you are reading this, then I was right to be afraid, and you should be too.\n\n— Maelis, of the Lantern Court' },
    { id: 'orders', x: 25.6, z: 38.4, title: 'Orders from the Gatewarden', text: 'GATE STAYS SHUT. NOBODY IN, NOBODY OUT.\n\nRATS GET THE HALLS. WE GET THE YARD. RATS GET PAID IN MEAT, NOT IN SHINY.\n\nALL SHINY GOES NORTH TO THE PYRE LIKE GRIMTUSK SAYS. ANY GOBLIN CAUGHT KEEPING SHINY GOES IN THE CAGE WITH THE LAST KNIGHT.\n\n— GRUBSKULL, GATEWARDEN (I CAN WRITE NOW)' },
    { id: 'tally', x: -36.2, z: 55.4, title: 'Larder Tally, Scratched on a Plank', text: 'Barrels of blackpowder: 14.\nBarrels of blackpowder after Snikt got bored: 11.\nSnikt: 0.\n\nDO NOT keep the kegs by the fire. DO NOT hit the kegs. If a knight comes, hit the knight, NOT the kegs. The kegs are for the Pyre.' },
    { id: 'oath', x: 9.6, z: 91.4, title: "Gnawfang's Oath, in Tooth-Marks", text: 'The Warblade swears to the Court of Winter, that sits upon the ice in the far north:\n\nThe keep is ours. The gate is ours. The knights who come are ours to eat.\nIn return, when the moon is gone from the sky, the warren will be warm, and the cold will pass us by.\n\nSigned in tooth,\nGnawfang' },
  ],
  pixies: [
    { id: 'p1', x: 1.9, z: -11.2 },
    { id: 'p2', x: 23, z: 43.5, inside: 'ycrate' },
    { id: 'p3', x: -27, z: 47.2, y: 1.55 },
    { id: 'p4', x: -37, z: 29.6, inside: 'lbarrel' },
    { id: 'p5', x: -10.4, z: 86, inside: 'hurn' },
  ],

  gate: { x: 0, z: 66, width: 6, guardian: 'warden', style: 'portcullis', toast: 'The portcullis rises', banner: 'GATEWARDEN VANQUISHED', charm: 'gateseal' },
  bossCharm: 'gnawtooth',
  seal: { x: 0, z: 119.2, yaw: 0, width: 7.2, height: 6.8, inside: [0, 122.6] },
  exit: { x: 0, z: 145.6 },

  build(w, R) {
    const g = w.group, M = w.mats;
    // Floors: flagstones everywhere, grass in the grove, cracked red stone in the arena.
    w.floor(-60, -40, 60, 190, 'floor', 5, -.01);
    w.floor(-11, -12, 11, 10, 'grass', 6, .005);
    w.disc(0, 135, 16.5, 'arena', 4.1);

    // Far towers of the keep, dim in the fog.
    for (const [x, z, h, r] of [[-40, 60, 40, 5], [38, 100, 52, 6], [-30, 150, 60, 7], [30, 20, 34, 4], [0, 175, 80, 9]]) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r * .8, r, h, 12), M.wall); m.position.set(x, h / 2, z); g.add(m);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(r * 1.1, r * 2.2, 12), M.iron); roof.position.set(x, h + r * 1.1, z); g.add(roof);
    }

    // Walls.
    w.wallPath([[-3, 10], [-11, 10], [-11, -12], [11, -12], [11, 10], [3, 10]]);
    w.wall(-3, 10, -3, 28); w.wall(3, 10, 3, 28);
    w.wallPath([[-3, 28], [-18, 28], [-18, 40]]); w.wallPath([[-18, 46], [-18, 64], [-3, 64]]);
    // The Goblin Larder, through a broken doorway in the yard's west wall.
    w.wallPath([[-18, 28], [-38, 28], [-38, 58], [-18, 58]], { h: 5.5 });
    w.batch('wall', boxGeo(1.4, 1.6, 6.2, 3).translate(-18, 5.7, 43));   // the doorway's lintel
    w.wallPath([[3, 28], [18, 28], [18, 37], [28, 37], [28, 45], [18, 45], [18, 64], [3, 64]]);
    w.wall(-3, 64, -3, 74, { h: 8 }); w.wall(3, 64, 3, 74, { h: 8 });
    w.batch('wall', boxGeo(7.2, 2, 2.4, 3).translate(0, 7, 66));
    w.wallPath([[-3, 74], [-12, 74], [-12, 98], [-19, 98], [-19, 106], [-12, 106], [-12, 112], [-3, 112]]);
    w.wallPath([[3, 74], [12, 74], [12, 112], [3, 112]]);
    w.wall(-3, 112, -3, 120.5, { h: 8 }); w.wall(3, 112, 3, 120.5, { h: 8 });
    w.batch('wall', boxGeo(7.2, 2.4, 2, 3).translate(0, 7.2, 113));
    // Throne arena: a ring of 28 segments with a gap to the south.
    const N = 28, cz = 135, rad = 16.6;
    for (let i = 1; i < N - 1; i++) {
      const a0 = i * Math.PI * 2 / N, a1 = a0 + Math.PI * 2 / N;
      w.wall(Math.sin(a0) * rad, cz - Math.cos(a0) * rad, Math.sin(a1) * rad, cz - Math.cos(a1) * rad, { h: 9 });
    }

    // Pillars: yard ruins, the hall's colonnade and the arena ring.
    for (const [x, z, b] of [[-11, 36, 0], [-11, 46, 1], [11, 34, 1], [12, 47, 0], [-6, 58, 0], [6, 58, 0]]) w.pillar(x, z, .75, 7, !!b);
    for (let z = 80; z <= 106; z += 6.5) { w.pillar(-6, z, .8, 9); w.pillar(6, z, .8, 9); }
    for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * Math.PI * 2; w.pillar(Math.sin(a) * 11.5, cz - Math.cos(a) * 11.5, .9, 10, i === 2 || i === 5); }

    // Dead trees and a weathered pixie statue in the grove.
    w.deadTree(-7.5, -8, 5.5, 1); w.deadTree(8, -3, 6, 2); w.deadTree(-8, 6, 4.5, 3); w.deadTree(7.5, 7, 5, 4);
    const statue = new THREE.Group();
    const part = (geo, y, x = 0, z = 0) => { const m = new THREE.Mesh(geo, M.stone); m.position.set(x, y, z); statue.add(m); return m; };
    part(boxGeo(1.6, 1, 1.6, 2), .5); part(new THREE.CapsuleGeometry(.35, 1, 4, 10), 1.9); part(new THREE.SphereGeometry(.3, 12, 10), 2.85);
    for (const s of [-1, 1]) { const wg = part(new THREE.SphereGeometry(.8, 10, 8), 2.4, s * .45, -.35); wg.scale.set(.15, 1, .6); wg.rotation.z = -s * .5; }
    statue.position.set(0, 0, -9.5); statue.traverse(o => { o.castShadow = true; o.receiveShadow = true; });
    g.add(statue); w.addBox(0, -9.5, .8, .8, 0, 3);

    // Gravestones.
    for (let i = 0; i < 14; i++) {
      const x = (R() < .5 ? -1 : 1) * (4.5 + R() * 5.5), z = -10 + R() * 18;
      if (Math.abs(x) < 3.5) continue;
      const h = .7 + R() * .6, ry = R() * .6 - .3;
      w.add(boxGeo(.6, h, .18, 1), 'stone', x, h / 2 - .1, z, ry).rotation.z = R() * .3 - .15;
      w.prop(w.addBox(x, z, .32, .12, ry, h));
    }

    // Grass blades and glowing mushrooms in the grove.
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const blade = new THREE.ConeGeometry(.03, .3, 3); blade.translate(0, .15, 0);
    const grassMesh = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: 0x4f6b35, roughness: 1 }), 1400);
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

    // Rubble.
    const rubble = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.3, 0), M.stone, 220);
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
    // Crates, barrels and urns to smash: in the yard, the grove's ruin and the halls.
    w.pile(-15, 33.6, [['crate', 0, 0], ['crate', 1.1, .3], ['barrel', -.2, 1.2], ['crate', .9, 1.4]], .2);
    w.pile(15, 60.6, [['crate', 0, 0], ['barrel', 1.1, -.2], ['barrel', -.9, .3]], .3);
    w.breakable('crate', 23, 43.5, { id: 'ycrate' }); w.breakable('barrel', 24.4, 44.2);
    w.pile(-13.5, 58.5, [['barrel', 0, 0], ['barrel', .95, .2], ['crate', .3, -1]], .1);
    for (const [x, z] of [[-8.5, -11], [8.6, -10.8], [-9.4, 8.4]]) w.breakable('urn', x, z);
    for (const [x, z, id] of [[-10.4, 86, 'hurn'], [-10.5, 94], [10.4, 83], [10.3, 108.6], [-10.4, 109.5]]) w.breakable('urn', x, z, { id });
    w.pile(9.8, 97.2, [['barrel', 0, 0], ['crate', 0, 1.1]], 0);
    const cart = new THREE.Group();
    const bed = new THREE.Mesh(boxGeo(2.4, .3, 1.4, 1), M.wood); bed.position.y = .8; cart.add(bed);
    for (const [wx, wz] of [[-.8, .75], [.8, .75], [-.8, -.75], [.8, -.75]]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .12, 14), M.wood); wh.rotation.x = Math.PI / 2; wh.position.set(wx, .45, wz); cart.add(wh);
    }
    for (const o of [[0, 1.05, .7], [0, 1.05, -.7]]) { const rail = new THREE.Mesh(boxGeo(2.4, .3, .08, 1), M.wood); rail.position.set(...o); cart.add(rail); }
    cart.position.set(12, 0, 34); cart.rotation.y = .7; cart.traverse(o => { o.castShadow = true; });
    g.add(cart); w.prop(w.addBox(12, 34, 1.3, .8, .7, 1.2));
    w.banner(-17.3, 40, Math.PI / 2); w.banner(-17.3, 52, Math.PI / 2); w.banner(17.3, 52, -Math.PI / 2); w.banner(-4.2, 63.3, 0); w.banner(4.2, 63.3, 0);
    for (let z = 80; z <= 106; z += 13) { w.banner(-11.3, z, Math.PI / 2, 0x2f3a1c); w.banner(11.3, z, -Math.PI / 2, 0x2f3a1c); }

    // Bones and cages in the halls; bones, skulls and a throne in the arena.
    const bones = new THREE.InstancedMesh(new THREE.CylinderGeometry(.04, .05, .5, 5), M.bone, 120);
    for (let i = 0; i < 120; i++) {
      const inArena = i < 70, a = R() * 6.28, r = 3 + R() * 12;
      p.set(inArena ? Math.sin(a) * r : -11 + R() * 22, .05, inArena ? 135 - Math.cos(a) * r : 75 + R() * 36);
      e.set(Math.PI / 2, R() * 6.28, 0); q.setFromEuler(e);
      bones.setMatrixAt(i, mtx.compose(p, q, s.set(1, .6 + R(), 1)));
    }
    g.add(bones);
    const skull = new THREE.SphereGeometry(.13, 8, 6);
    for (let i = 0; i < 16; i++) { const a = R() * 6.28, r = 4 + R() * 10; w.add(skull, 'bone', Math.sin(a) * r, .1, 135 - Math.cos(a) * r, 0, false); }
    const cageGeo = [];
    for (const [cx, cz] of [[-10, 78], [10, 101]]) {
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2, bar = new THREE.CylinderGeometry(.03, .03, 2.2, 4);
        bar.translate(cx + Math.sin(a) * .7, 1.1, cz + Math.cos(a) * .7); cageGeo.push(bar);
      }
      for (const y of [0, 2.2]) { const ring = new THREE.CylinderGeometry(.75, .75, .08, 12, 1, true); ring.translate(cx, y, cz); cageGeo.push(ring); }
      w.prop(w.addCyl(cx, cz, .8, 2.2));
    }
    const cages = new THREE.Mesh(merge(cageGeo), M.iron); cages.castShadow = true; g.add(cages);
    const throne = new THREE.Group();
    const tb = (a, b, c, x, y, z) => { const m = new THREE.Mesh(boxGeo(a, b, c, 2), M.stone); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; throne.add(m); };
    tb(6, .6, 4, 0, .3, 0); tb(4.5, .6, 3, 0, .9, .3); tb(2.4, 1.2, 1.6, 0, 1.8, .6); tb(2.6, 4.5, .5, 0, 3.4, 1.4); tb(.4, 1.8, 1.6, -1.2, 2.5, .6); tb(.4, 1.8, 1.6, 1.2, 2.5, .6);
    throne.position.set(0, 0, 148.5); g.add(throne);
    w.prop(w.addBox(0, 148.5, 3, 2, 0, 1.2));
    w.addBox(0, 149.8, 1.4, .6, 0, 6);

    // The Goblin Larder: stacked stores, sacks, a long table, and the blackpowder kept (unwisely) all together.
    for (const [x, z, n, r] of [[-36.6, 31, 3, .1], [-36.4, 36.2, 2, -.2], [-20.2, 31.2, 2, .3]]) {
      for (let i = 0; i < n; i++) w.add(crate, 'wood', x + (i % 2) * .1, .5 + i, z + (i % 2) * .15, r + i * .3);
      w.prop(w.addBox(x, z, .55, .55, r, n));
    }
    w.pile(-36.2, 40, [['crate', 0, 0, { id: 'lcrate' }], ['crate', 0, 1.2], ['barrel', .1, -1.1]], 0);
    w.pile(-36.4, 45.5, [['barrel', 0, 0], ['barrel', 0, 1], ['barrel', 0, 2], ['barrel', -.2, 3.1]], 0);
    w.pile(-37, 29.6, [['barrel', 0, 0, { id: 'lbarrel' }], ['barrel', 1, .1]], 0);
    w.pile(-20.5, 35, [['crate', 0, 0], ['barrel', 0, 1.1], ['crate', 0, 2.2]], 0);
    // Powder kegs, piled in the middle of the room.
    w.pile(-29, 54.4, [['keg', 0, 0], ['keg', .9, .1], ['keg', -.9, 0], ['keg', .4, .9], ['keg', -.5, .9], ['keg', 2.4, -.4]], 0);
    M.sack = new THREE.MeshStandardMaterial({ color: 0x8a7050, roughness: 1 });
    for (const [x, z, r] of [[-35.8, 34.2, .2], [-33.6, 31.2, 1.4], [-32.2, 33.8, 2.2], [-37, 35.2, .9], [-24, 55.6, .5], [-22.6, 56.2, 2.5]]) {
      const sk = w.rock(.55, 7, .15); sk.scale(1, .55, .8); sk.rotateY(r); sk.translate(x, .25, z); w.batch('sack', sk);
    }
    const table = new THREE.Group();
    const tb2 = (a, b, c, x, y, z) => { const m = new THREE.Mesh(boxGeo(a, b, c, 1), M.wood); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; table.add(m); };
    tb2(1.4, .12, 5, 0, .9, 0);
    for (const [lx, lz] of [[-.55, -2.2], [.55, -2.2], [-.55, 2.2], [.55, 2.2]]) tb2(.12, .9, .12, lx, .45, lz);
    const food = [0xa0502a, 0xd8c070, 0x7a3a2a, 0xc8a060];
    for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(i % 3 ? new THREE.SphereGeometry(.12 + R() * .08, 8, 6) : boxGeo(.3, .14, .22, 1), new THREE.MeshStandardMaterial({ color: food[i % 4], roughness: .8 })); m.position.set((R() - .5) * .9, 1.02, -2 + i * .5); m.castShadow = true; table.add(m); }
    table.position.set(-27, 0, 45.2); g.add(table); w.prop(w.addBox(-27, 45.2, .75, 2.55, 0, 1));
    for (const [x, z] of [[-21, 40.2], [-21, 45.8]]) w.totem(x, z, 2.6);
    w.banner(-37.3, 44, Math.PI / 2, 0x6b1414, 3.2); w.banner(-28, 57.3, Math.PI, 0x6b1414, 3.2);
    const hooks = new THREE.Group();   // meat hanging from a beam
    const beam = new THREE.Mesh(boxGeo(6, .2, .2, 1), M.wood); beam.position.set(0, 3.4, 0); hooks.add(beam);
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(.16, .5, 4, 8), new THREE.MeshStandardMaterial({ color: 0x7a2a22, roughness: .8 })); m.position.set(-2.4 + i * 1.2, 2.7, 0); hooks.add(m);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .5, 3), M.iron); c.position.set(-2.4 + i * 1.2, 3.15, 0); hooks.add(c);
    }
    hooks.position.set(-30, 0, 29.2); hooks.traverse(o => { o.castShadow = true; }); g.add(hooks);
    for (const [x, z] of [[-24, 29.4], [-37, 51], [-21.2, 52.6]]) w.brazier(x, z);

    // Braziers: moon-blue in the grove, fire in the yard, rot-green in the halls, blood-red at the throne.
    for (const [x, z] of [[-6, -9], [6, -9]]) w.brazier(x, z, 0x6fd8ff);
    for (const [x, z] of [[-2.2, 12.5], [2.2, 27]]) w.brazier(x, z);
    for (const [x, z] of [[-16, 30], [16, 30], [-16, 62], [16, 62], [-4, 63], [4, 63], [26.5, 44]]) w.brazier(x, z);
    for (const [x, z] of [[-11, 76], [11, 76], [-11, 110], [11, 110], [0, 88]]) w.brazier(x, z, 0x9cff5a);
    for (const [x, z] of [[-2.3, 116.6], [2.3, 116.6]]) w.brazier(x, z, 0xff5030);
    for (let i = 0; i < 6; i++) { const a = (i + 1) / 7 * Math.PI * 2; w.brazier(Math.sin(a) * 14.4, 135 - Math.cos(a) * 14.4, 0xff4020); }
  },
};
