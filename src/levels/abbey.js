// Mission 6: the Drowned Abbey, a house of the Lantern Court sunk to its knees in the Moonlit Sea. North:
//   the Sea Stair (first Moonwell) → the Flooded Cloister (the Sunken Garth off its west walk) → the Nave of
//   Bells (the Scriptorium off to the east) → the Bell Tower Gate (Brother Tolland holds it) → the Undercroft
//   (second Moonwell) → Briar Seal → the Drowned Choir (Abbess Morwen, the Drowned Saint).
import * as THREE from 'three';
import { boxGeo } from '../world.js';
import { joinRooms, raiseRooms, roomAreas, floorRooms, scatter } from './rooms.js';

const ROOMS = [
  { id: 'stair', name: 'The Sea Stair', x0: -10, z0: -12, x1: 10, z1: 12, edge: 'balustrade' },
  { id: 'cloister', name: 'The Flooded Cloister', x0: -16, z0: 20, x1: 16, z1: 50 },
  { id: 'garth', name: 'The Sunken Garth', x0: -34, z0: 26, x1: -22, z1: 44, o: { h: 5 } },
  { id: 'nave', name: 'The Nave of Bells', x0: -12, z0: 56, x1: 12, z1: 96, o: { h: 10 } },
  { id: 'scriptorium', name: 'The Scriptorium', x0: 18, z0: 66, x1: 34, z1: 86 },
  { id: 'bellgate', name: 'The Bell Tower Gate', x0: -11, z0: 102, x1: 11, z1: 122, o: { h: 10 } },
  { id: 'undercroft', name: 'The Undercroft', x0: -14, z0: 128, x1: 14, z1: 154, o: { h: 6 } },
  { id: 'choir', name: 'The Drowned Choir', x0: -18, z0: 166, x1: 18, z1: 202, o: { h: 11 } },
];
const PASSES = [
  { a: 'stair', b: 'cloister', at: 0, w: 6, edge: 'balustrade' },
  { a: 'garth', b: 'cloister', at: 35, w: 5 },
  { a: 'cloister', b: 'nave', at: 0, w: 7 },
  { a: 'nave', b: 'scriptorium', at: 76, w: 5 },
  { a: 'nave', b: 'bellgate', at: 0, w: 7 },
  { a: 'bellgate', b: 'undercroft', at: 0, w: 7 },
  { a: 'undercroft', b: 'choir', at: 0, w: 7.6 },
];
const CORRS = joinRooms(ROOMS, PASSES);
const room = id => ROOMS.find(r => r.id === id);

export default {
  id: 'abbey',
  name: 'The Drowned Abbey',
  blurb: 'An abbey of the Lantern Court, sunk to its knees in the Moonlit Sea. Its bells still ring at high tide, and something in the choir still sings.',
  level: 42,
  gatekeeper: { hp: 1, dmg: 1.7 },   // scaled to keep pace with the knight (balance pass)
  warlord: { hp: 1.25, dmg: 2 },
  map: { x: 68, z: 30 },
  seed: 6161,
  forest: true,
  tier: 2.8,
  fog: { color: 0x0c1a20, byArea: { stair: .012, cloister: .016, garth: .02, nave: .018, scriptorium: .018, bellgate: .016, undercroft: .022, choir: .012 }, base: .016 },
  light: { sky: 0x7fa8b8, ground: 0x1a2a2a, hemi: 1.35, moonColor: 0xbfe8ff, moon: 1.8 },
  moon: { at: [60, 90, 380], glow: 160, size: 18 },
  enemyGlow: .14,
  intro: 'The Winter broke, and still the moon wanes.\nAcross the Moonlit Sea the Lantern Court\'s own abbey calls. Find out why its bells still ring.',
  outro: 'The Abbess sinks into the choir she drowned, and the bells fall silent at last. Among her psalters, a letter in the Queen\'s hand: the ore for the chains of winter came from a forge in the fire mountain, north across the isle.',
  exitToast: 'The Drowned Saint rests. A Pixie Gate opens in the choir',
  motes: { base: 0x9fffe8, nave: 0xd8f8e8, choir: 0x7fe8d0 },
  titleShrine: 'stair',
  areas: roomAreas(ROOMS),

  shrines: {
    stair: { id: 'stair', name: 'Moonwell of the Sea Stair', x: -4, z: -4, spawn: [-1.8, -2.2], yaw: 0 },
    undercroft: { id: 'undercroft', name: 'Moonwell of the Undercroft', x: -9, z: 133, spawn: [-7, 135], yaw: .5 },
  },

  spawns: [
    { id: 's1', type: 'ratman-drowned', x: 5, z: 7, yaw: Math.PI, idle: 'sleep' },
    // The Flooded Cloister
    { id: 'c1', type: 'hollow-squire', x: -6, z: 28, yaw: Math.PI },
    { id: 'c2', type: 'hollow-squire', x: 7, z: 43, yaw: Math.PI, patrol: [[7, 43], [11, 26], [-11, 26], [-11, 43]] },
    { id: 'c3', type: 'ratman-drowned', x: 11, z: 30, yaw: -2.4 },
    { id: 'c4', type: 'ratman-drowned', x: -12, z: 46, yaw: 2.6, idle: 'sleep' },
    { id: 'c5', type: 'goblin-tidecaller', x: 0, z: 46, yaw: Math.PI },
    { id: 'c6', type: 'goblin-archer', x: 12.5, z: 47, yaw: -2.6 },
    // The Sunken Garth
    { id: 'g1', type: 'ratman-brinebrute', x: -28, z: 38, yaw: 1.6 },
    { id: 'g2', type: 'ratman-drowned', x: -30, z: 30, yaw: 1.2, idle: 'sleep' },
    // The Nave of Bells
    { id: 'n1', type: 'hollow-lancer', x: -3, z: 64, yaw: Math.PI },
    { id: 'n2', type: 'hollow-lancer', x: 4, z: 82, yaw: Math.PI },
    { id: 'n3', type: 'hollow-squire', x: 0, z: 90, yaw: Math.PI },
    { id: 'n4', type: 'goblin-tidecaller', x: -8.5, z: 76, yaw: 1.6 },
    { id: 'n5', type: 'goblin-tidecaller', x: 8.5, z: 70, yaw: -1.6 },
    { id: 'n6', type: 'ratman-drowned', x: -6, z: 88, yaw: 2.8, idle: 'sleep' },
    { id: 'n7', type: 'ratman-drowned', x: 7, z: 60, yaw: -2.8 },
    // The Scriptorium
    { id: 'w1', type: 'goblin-tidecaller', x: 30, z: 80, yaw: -2 },
    { id: 'w2', type: 'hollow-squire', x: 24, z: 72, yaw: -1.6 },
    { id: 'w3', type: 'ratman-drowned', x: 31, z: 69, yaw: -.8, idle: 'sleep' },
    // The Bell Tower Gate
    { id: 'tolland', type: 'bellwarden', x: 0, z: 114, yaw: Math.PI, elite: 'warden' },
    { id: 'b1', type: 'hollow-lancer', x: -7, z: 106, yaw: 2.6 },
    // The Undercroft
    { id: 'u1', type: 'ratman-brinebrute', x: 6, z: 146, yaw: Math.PI },
    { id: 'u2', type: 'hollow-lancer', x: -4, z: 150, yaw: Math.PI },
    { id: 'u3', type: 'hollow-squire', x: 9, z: 136, yaw: -2 },
    { id: 'u4', type: 'goblin-archer', x: -11, z: 151, yaw: 2.6 },
    { id: 'u5', type: 'ratman-drowned', x: 11, z: 150, yaw: -2.6, idle: 'sleep' },
    { id: 'u6', type: 'ratman-drowned', x: 0, z: 141, yaw: Math.PI },
    // The Drowned Choir
    { id: 'boss', type: 'abbess', x: 0, z: 188, yaw: Math.PI, elite: 'boss' },
  ],
  adds: [
    { id: 'add1', type: 'ratman-drowned', x: -10, z: 190, yaw: Math.PI, add: true },
    { id: 'add2', type: 'ratman-drowned', x: 10, z: 190, yaw: Math.PI, add: true },
  ],
  boss: 'boss',
  bossCharm: 'saintveil',
  phase2Line: 'The Abbess calls up the tide',

  messages: [
    { x: 2, z: -6, text: 'Hollow Squires turn blows aside with their shields. Go round, break the guard with heavies, or catch them as they swing.' },
    { x: -2, z: 22, text: 'The cloister pool is sea-cold: stand in it and the chill gets into you.' },
    { x: 2, z: 57.5, text: 'Tidecallers mend their kin with the tide. Silence them first.' },
    { x: 2, z: 103.5, text: 'Brother Tolland rings his bell, and the sea answers in rings. Leap them, or be somewhere else.' },
    { x: 2, z: 156, text: 'Beyond the briars, the Drowned Saint sings to the tide.' },
  ],

  items: [
    { id: 'glimmer1', x: 13.5, z: 22.5, kind: 'glimmer', amount: 5200, label: 'Glimmer Shard', desc: '+5200 Glimmer' },
    { id: 'c-tidepearl', x: -31.5, z: 42, kind: 'charm', charm: 'tidepearl', label: 'Charm' },
    { id: 'grace1', x: -8.5, z: 94, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'glimmer2', x: 32, z: 84, kind: 'glimmer', amount: 5800, label: 'Glimmer Shard', desc: '+5800 Glimmer', inside: 'wurn' },
    { id: 'glimmer3', x: 12, z: 152, kind: 'glimmer', amount: 6400, label: 'Glimmer Shard', desc: '+6400 Glimmer' },
    { id: 'art-veil', x: -24, z: 28, kind: 'art', art: 'veil', label: 'Moon Veil', desc: 'a Fae Art: moonlight folded small, in a nun\'s reliquary', inside: 'gcrate',
      tip: 'Moon Veil wraps you in moonlight for twenty seconds: blows land 40% lighter.\nChange Fae Arts with Y (the d-pad\'s right on a gamepad); their uses return at every Moonwell.' },
  ],
  letters: [
    { id: 'psalter', x: 26, z: 83, title: 'A Psalter, Salt-Stained', text: 'Light a lantern at the prow, and the sea will not take you.\nLight a lantern at the door, and the dark will not come in.\nLight a lantern in your heart, and when the moon goes, you will still see.\n\n(Underneath, in a newer hand:) The Abbess has ordered every lantern put out.' },
    { id: 'tolland', x: -9.4, z: 105, title: "Brother Tolland's Tally", text: 'Rang the hour. Rang the hour. Rang the hour.\n\nThe Abbess says the tide will keep the Queen out. The sea is at the second step. Rang the hour.\n\nThe sea is at the nave. The Abbess sings. I will keep ringing until someone tells me to stop, and no one is left to tell me.' },
    { id: 'queen1', x: 4.5, z: 150, title: 'A Letter Sealed in Silver Wax', text: 'Sister,\n\nYou kept the lanterns for the Court a thousand years, and what did the Court give you? A cold house on a cold sea.\n\nPut out the lanterns and let the tide in. I will give you a moon that never sets, and a choir that never stops singing.\n\n— W.' },
    { id: 'maelis6', x: -2.4, z: 9.4, title: 'A Knight\'s Note, Left on the Stair', text: 'If you have come this far, you are the one the Lantern Court sent after Maelis. I am the one they sent after you. Or I was.\n\nMaelis did not freeze. Someone came across the ice and carried her away east, still in her armour. The tracks went into the sea.\n\nI am going to the abbey to ask. Do not wait for me.' },
  ],
  pixies: [
    { id: 'p1', x: 7.5, z: -9.5 },
    { id: 'p2', x: -32.5, z: 29, inside: 'gurn' },
    { id: 'p3', x: 10, z: 92.5 },
    { id: 'p4', x: 20, z: 84, inside: 'wurn2' },
    { id: 'p5', x: -12, z: 139 },
  ],
  hazards: [{ x: 0, z: 35, r: 4.4, kind: 'frost', poison: 16 }],

  gate: { x: 0, z: 124.5, width: 7, guardian: 'tolland', style: 'portcullis', toast: 'The bell tower\'s portcullis rises', banner: 'BELL-WARDEN SILENCED', charm: 'bellclapper' },
  seal: { x: 0, z: 160, yaw: 0, width: 7.6, height: 6.8, inside: [0, 170] },
  exit: { x: 0, z: 197 },

  build(w, R) {
    const g = w.group, M = w.mats;
    M.sea = new THREE.MeshStandardMaterial({ color: 0x0a2a2c, emissive: 0x041816, roughness: .08, metalness: .6, transparent: true, opacity: .9 });
    M.bronze = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, metalness: .8, roughness: .35, emissive: 0x1a1006 });
    M.glass = new THREE.MeshBasicMaterial({ color: 0x5ad8c8, transparent: true, opacity: .35, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const keep = [...this.spawns, ...this.items, ...Object.values(this.shrines), ...this.messages, ...this.letters, ...this.pixies].map(o => ({ x: o.x, z: o.z, r: 2.2 }));

    // The sea all round, and the abbey's floors above it.
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), M.sea); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -.5, 90); g.add(sea);
    w.anim.push(t => { M.sea.emissive.setHSL(.47, .7, .04 + Math.sin(t * .6) * .01); });
    floorRooms(w, ROOMS, CORRS, 'floor', { tile: 4, slab: 'stone' });
    raiseRooms(w, ROOMS, CORRS, { edge: 'wall', h: 7 });

    // The Sea Stair: steps down into the water, and the abbey's towers drowned to the belfry beyond.
    for (let i = 0; i < 6; i++) { const st = boxGeo(8, .3, 1.2, 2); st.translate(0, -.15 - i * .3, -12.6 - i * 1.2); w.batch('stone', st); }
    for (const [x, z, h, r] of [[-40, 60, 26, 5], [44, 110, 34, 6], [-36, 150, 30, 5], [38, 20, 18, 4], [0, 240, 44, 8]]) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r * .8, r, h, 12), M.wall); m.position.set(x, h / 2 - 4, z); g.add(m);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(r * 1.1, r * 2, 12), M.bronze); roof.position.set(x, h - 4 + r, z); g.add(roof);
    }
    for (const [x, z, b] of [[-7, 6, 1], [7, -2, 0], [-7.5, -8, 0]]) w.pillar(x, z, .6, 5, !!b);

    // The Flooded Cloister: a colonnade round a drowned garth-pool and its saint.

    for (let z = 24; z <= 46; z += 5.5) for (const x of [-11.5, 11.5]) w.pillar(x, z, .55, 6);
    for (let x = -6; x <= 6; x += 6) for (const z of [24.5, 45.5]) w.pillar(x, z, .55, 6);
    w.disc(0, 35, 5.2, M.sea, 4, .02);
    const saint = new THREE.Group();
    const part = (geo, y, x = 0, z = 0) => { const m = new THREE.Mesh(geo, M.stone); m.position.set(x, y, z); saint.add(m); return m; };
    part(boxGeo(1.4, .9, 1.4, 2), .45); part(new THREE.CapsuleGeometry(.36, 1.2, 4, 10), 2); part(new THREE.SphereGeometry(.3, 12, 10), 3);
    const lamp = part(new THREE.SphereGeometry(.18, 10, 8), 2.3, .5, .3); lamp.material = new THREE.MeshBasicMaterial({ color: 0x9fffe8 });
    saint.position.set(0, 0, 35); g.add(saint); w.addCyl(0, 35, .8, 3);
    w.flames.push({ x: 0, y: 2.4, z: 35, color: new THREE.Color(0x7fffe0), base: 5, phase: 0, flick: 1 });
    for (const [x, z] of [[-14, 22], [14, 22], [-14, 48], [14, 48]]) w.brazier(x, z, 0x7fffe0);
    w.pile(-13.5, 31, [['crate', 0, 0], ['barrel', 1, .3]], .2);
    for (const [x, z] of [[13.8, 38], [-13.8, 40]]) w.breakable('urn', x, z);

    // The Sunken Garth: graves going under, and dead trees.
    for (let i = 0; i < 10; i++) {
      const x = -32.5 + R() * 9, z = 28 + R() * 14, h = .6 + R() * .5, ry = R() * .6 - .3;
      if (keep.some(k => Math.hypot(k.x - x, k.z - z) < 1.6)) continue;
      w.add(boxGeo(.55, h, .16, 1), 'stone', x, h / 2 - .15, z, ry).rotation.z = R() * .4 - .2;
      w.prop(w.addBox(x, z, .3, .12, ry, h));
    }
    w.deadTree(-24.5, 42, 5, 11); w.deadTree(-32, 34, 4.5, 12);
    w.breakable('crate', -24, 28, { id: 'gcrate' }); w.breakable('urn', -32.5, 29, { id: 'gurn' });

    // The Nave of Bells: two rows of pillars, pews, the bells hung high, the altar at the north end.
    for (let z = 61; z <= 91; z += 6) for (const x of [-6.5, 6.5]) w.pillar(x, z, .75, 10);
    for (let z = 62; z <= 88; z += 3.2) for (const x of [-3.2, 3.2]) {
      if (keep.some(k => Math.hypot(k.x - x, k.z - z) < 1.8)) continue;
      const pew = boxGeo(2.6, .5, .6, 1); pew.translate(x, .45, z); w.batch('wood', pew);
      const back = boxGeo(2.6, .8, .12, 1); back.translate(x, .95, z + .3); w.batch('wood', back);
      w.prop(w.addBox(x, z, 1.3, .35, 0, .9));
    }
    const bells = [];
    for (const [x, z, s] of [[0, 70, 1.4], [0, 82, 1.1], [-3.4, 76, .9], [3.4, 76, .9]]) {
      const b = new THREE.Group(); b.position.set(x, 8.2, z);
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(.4 * s, 1 * s, 1.5 * s, 16, 1, true), M.bronze); bell.position.y = -.9 * s; b.add(bell);
      const top = new THREE.Mesh(new THREE.SphereGeometry(.42 * s, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.bronze); top.position.y = -.15 * s; b.add(top);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 2, 4), M.wood); rope.position.y = 1; b.add(rope);
      g.add(b); bells.push(b);
    }
    w.anim.push(t => bells.forEach((b, i) => { b.rotation.z = Math.sin(t * .8 + i * 1.3) * .08; }));
    const altar = boxGeo(4, 1.2, 1.6, 2); altar.translate(0, .6, 94); w.batch('stone', altar); w.prop(w.addBox(0, 94, 2, .8, 0, 1.2));
    for (const x of [-10, 10]) for (const z of [60, 92]) w.brazier(x, z, 0x7fffe0);
    for (let i = 0; i < 5; i++) { const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5), M.glass); pane.position.set(-11.3, 6, 62 + i * 7); pane.rotation.y = Math.PI / 2; g.add(pane); const p2 = pane.clone(); p2.position.x = 11.3; g.add(p2); }
    w.breakable('urn', 10.5, 92.5); w.breakable('urn', -10.5, 58);

    // The Scriptorium: shelves, writing desks, candles.

    for (const z of [68.5, 83.5]) for (let x = 20.5; x <= 31.5; x += 5.5) {
      const sh = boxGeo(4.4, 3, .6, 2); sh.translate(x, 1.5, z); w.batch('wood', sh); w.prop(w.addBox(x, z, 2.2, .35, 0, 3));
    }
    for (const [x, z] of [[23, 77], [29, 76]]) { const d = boxGeo(2, .9, 1.1, 1); d.translate(x, .45, z); w.batch('wood', d); w.prop(w.addBox(x, z, 1, .6, 0, 1)); w.brazier(x, z, 0xffe0a0, false, .4, .95); }
    w.breakable('urn', 32, 84, { id: 'wurn' }); w.breakable('urn', 20, 84, { id: 'wurn2' }); w.breakable('crate', 32.5, 70);

    // The Bell Tower Gate: the great bell, fallen, and the tower's chains.
    const fb = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.6, 3.2, 20, 1, true), M.bronze); fb.position.set(7.5, 1.2, 116); fb.rotation.z = 1.2; g.add(fb); w.prop(w.addCyl(7.5, 116, 2, 2.4));
    for (const x of [-9.5, 9.5]) w.pillar(x, 104, .8, 10);
    for (const [x, z] of [[-9.5, 120], [9.5, 120]]) w.brazier(x, z, 0x7fffe0);
    w.pile(-9, 110, [['barrel', 0, 0], ['crate', .2, 1.05]], .3);

    // The Undercroft: tombs, low pillars.
    for (let i = 0; i < 6; i++) {
      const x = (i % 2 ? 1 : -1) * 8, z = 132 + Math.floor(i / 2) * 7.5;
      if (keep.some(k => Math.hypot(k.x - x, k.z - z) < 2)) continue;
      const t = boxGeo(1.4, .9, 2.6, 1); t.translate(x, .45, z); w.batch('stone', t); w.prop(w.addBox(x, z, .7, 1.3, 0, 1));
    }
    for (let z = 134; z <= 150; z += 8) for (const x of [-3.5, 3.5]) w.pillar(x, z, .6, 6);
    for (const [x, z] of [[-12, 150], [12, 131], [4, 131]]) w.brazier(x, z, 0x7fffe0);
    w.breakable('urn', 12.4, 144); w.breakable('urn', -12.4, 142);

    // The Drowned Choir: stalls round the walls, the tide coming in at the edges, glass gone green.

    w.disc(0, 184, 13.5, 'arena', 4.1);
    for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * Math.PI * 2, x = Math.sin(a) * 12.5, z = 184 + Math.cos(a) * 12.5; w.pillar(x, z, .8, 10, i === 3 || i === 6); }
    for (const [x0, x1] of [[-16.5, -12], [12, 16.5]]) for (let z = 170; z < 200; z += 3) { const s = boxGeo(x1 - x0, .8, 2.4, 1); s.translate((x0 + x1) / 2, .4, z); w.batch('wood', s); }
    for (const [x, z] of [[-15, 170], [15, 170], [-15, 199], [15, 199]]) w.disc(x, z, 3, M.sea, 4, .03);
    for (let i = 0; i < 7; i++) { const pane = new THREE.Mesh(new THREE.PlaneGeometry(3, 7), M.glass); pane.position.set(-12 + i * 4, 7, 201.4); g.add(pane); }
    for (let i = 0; i < 6; i++) { const a = (i + .5) / 6 * Math.PI * 2; w.brazier(Math.sin(a) * 15.5, 184 + Math.cos(a) * 15.5, 0x7fffe0); }
  },
};
