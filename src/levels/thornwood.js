// Mission 8: the Thornwood Court, the Lantern Court's own garden palace, overgrown with briar since its queen
// went into the dark. North: the Briar Wicket (first Moonwell) → the Overgrown Parterre (the Ruined Orangery
// off to the east) → the Gallery of Thorns → the Warden's Court (Sir Caddoc holds its gate) → the Queen's Rose
// Garden (second Moonwell) → Briar Seal → the Thorned Throne (Prince Hawthorn, the Thorned Heir).
import * as THREE from 'three';
import { boxGeo } from '../world.js';
import { joinRooms, raiseRooms, roomAreas, floorRooms, scatter, edge } from './rooms.js';

const ROOMS = [
  { id: 'wicket', name: 'The Briar Wicket', x0: -10, z0: -12, x1: 10, z1: 12 },
  { id: 'parterre', name: 'The Overgrown Parterre', x0: -20, z0: 20, x1: 20, z1: 56 },
  { id: 'orangery', name: 'The Ruined Orangery', x0: 26, z0: 30, x1: 42, z1: 50, edge: 'wall', o: { h: 6, mat: 'pillar', crenel: false } },
  { id: 'gallery', name: 'The Gallery of Thorns', x0: -18, z0: 62, x1: 6, z1: 96, edge: 'wall', o: { h: 9, mat: 'pillar', crenel: false } },
  { id: 'court', name: 'The Warden\'s Court', x0: -18, z0: 102, x1: 6, z1: 124, edge: 'wall', o: { h: 9, mat: 'pillar', crenel: false } },
  { id: 'roses', name: 'The Queen\'s Rose Garden', x0: -20, z0: 130, x1: 8, z1: 158 },
  { id: 'throne', name: 'The Thorned Throne', x0: -24, z0: 170, x1: 12, z1: 206 },
];
const PASSES = [
  { a: 'wicket', b: 'parterre', at: 0, w: 7 },
  { a: 'parterre', b: 'orangery', at: 40, w: 5.5 },
  { a: 'parterre', b: 'gallery', at: -6, w: 7, edge: 'wall', o: { h: 9, mat: 'pillar', crenel: false } },
  { a: 'gallery', b: 'court', at: -6, w: 7, edge: 'wall', o: { h: 9, mat: 'pillar', crenel: false } },
  { a: 'court', b: 'roses', at: -6, w: 7 },
  { a: 'roses', b: 'throne', at: -6, w: 7.6 },
];
const CORRS = joinRooms(ROOMS, PASSES);
// The parterre's hedges: a garden maze, cut back to walls of briar.
const HEDGES = [[-16, 28, -6, 28], [6, 28, 16, 28], [-12, 38, 12, 38], [-16, 48, -8, 48], [8, 48, 16, 48], [-12, 38, -12, 44], [12, 38, 12, 44]];

export default {
  id: 'thornwood',
  name: 'The Thornwood Court',
  blurb: 'The Lantern Court\'s own garden palace, overgrown with briar since its queen went into the dark. Her son keeps it still, crowned in thorns.',
  level: 84,
  map: { x: 112, z: 8 },
  seed: 8484,
  forest: true,
  leaves: true,
  leafColors: [0xff8ab8, 0xffc8e0, 0x6a2a3a],
  tier: 3.6,
  fog: { color: 0x160c16, byArea: { wicket: .016, parterre: .014, orangery: .016, gallery: .016, court: .014, roses: .016, throne: .011 }, base: .015 },
  light: { sky: 0xb88ab8, ground: 0x1a1016, hemi: 1.35, moonColor: 0xffc8e0, moon: 1.9 },
  moon: { at: [-80, 120, 360], glow: 120, size: 14 },
  enemyGlow: .14,
  intro: 'The rose on the chains of winter grows here, in the Lantern Court\'s old gardens.\nCut through the briar to the heir who keeps them.',
  outro: 'Prince Hawthorn falls among his mother\'s roses, and the briars loosen. He names her with his last breath: the Waning Queen, who went south to the crater where the moon\'s shard fell, to drink its light, and then up to her court in the sky.',
  exitToast: 'The Thorned Heir falls. A Pixie Gate opens among the roses',
  motes: { base: 0xff8ab8, roses: 0xffc8e0, throne: 0xff5a9a },
  titleShrine: 'wicket',
  areas: roomAreas(ROOMS),

  shrines: {
    wicket: { id: 'wicket', name: 'Moonwell of the Briar Wicket', x: -4, z: -4, spawn: [-1.8, -2.2], yaw: 0 },
    roses: { id: 'roses', name: 'Moonwell of the Rose Garden', x: -15, z: 135, spawn: [-13, 137], yaw: .5 },
  },

  spawns: [
    { id: 'w1', type: 'goblin-thornling', x: 4, z: 7, yaw: Math.PI, idle: 'sleep' },
    // The Overgrown Parterre
    { id: 'p1', type: 'thorn-knight', x: 0, z: 33, yaw: Math.PI },
    { id: 'p2', type: 'goblin-thornling', x: -14, z: 33, yaw: 2 },
    { id: 'p3', type: 'goblin-thornling', x: 14, z: 43, yaw: -2, patrol: [[14, 43], [16, 52], [2, 52]] },
    { id: 'p4', type: 'goblin-thornbow', x: -16, z: 52, yaw: 2.6 },
    { id: 'p5', type: 'goblin-briarhexer', x: 0, z: 44, yaw: Math.PI },
    { id: 'p6', type: 'ratman-briarstalker', x: 17, z: 24, yaw: -2.4 },
    // The Ruined Orangery
    { id: 'o1', type: 'thorn-reaver', x: 36, z: 40, yaw: -1.6 },
    { id: 'o2', type: 'goblin-thornbow', x: 40, z: 47, yaw: -2.4 },
    // The Gallery of Thorns
    { id: 'g1', type: 'thorn-knight', x: -10, z: 72, yaw: Math.PI },
    { id: 'g2', type: 'thorn-knight', x: 0, z: 86, yaw: Math.PI },
    { id: 'g3', type: 'ratman-briarstalker', x: -15, z: 90, yaw: 2.4 },
    { id: 'g4', type: 'goblin-briarhexer', x: -2, z: 70, yaw: -2.6 },
    { id: 'g5', type: 'goblin-thornbow', x: 3, z: 93, yaw: -2.6 },
    { id: 'g6', type: 'thorn-reaver', x: -8, z: 92, yaw: Math.PI, idle: 'sleep' },
    // The Warden's Court
    { id: 'caddoc', type: 'briarwarden', x: -6, z: 114, yaw: Math.PI, elite: 'warden' },
    { id: 'k1', type: 'goblin-thornling', x: 2, z: 106, yaw: -2.4 },
    // The Queen's Rose Garden
    { id: 'r1', type: 'thorn-reaver', x: -6, z: 152, yaw: Math.PI },
    { id: 'r2', type: 'thorn-knight', x: 3, z: 140, yaw: -2.4 },
    { id: 'r3', type: 'ratman-briarstalker', x: -17, z: 154, yaw: 2.4 },
    { id: 'r4', type: 'goblin-briarhexer', x: 4, z: 155, yaw: -2.6 },
    { id: 'r5', type: 'goblin-thornbow', x: -12, z: 146, yaw: 2 },
    { id: 'r6', type: 'goblin-thornling', x: 6, z: 133, yaw: Math.PI, idle: 'sleep' },
    // The Thorned Throne
    { id: 'boss', type: 'hawthorn', x: -6, z: 192, yaw: Math.PI, elite: 'boss' },
  ],
  adds: [
    { id: 'add1', type: 'goblin-thornling', x: -16, z: 194, yaw: Math.PI, add: true },
    { id: 'add2', type: 'goblin-thornling', x: 4, z: 194, yaw: Math.PI, add: true },
  ],
  boss: 'boss',
  bossCharm: 'heirsigil',
  phase2Line: 'The Heir calls the briars to his side',

  messages: [
    { x: 2, z: -6, text: 'Thorn Knights fence as the old Court taught: quick cuts are turned aside. Strike hard, or strike as they recover.' },
    { x: -2, z: 22, text: 'The hedges are briar through and through. Find the gaps.' },
    { x: -4, z: 63.5, text: 'Briar Stalkers step out of the thorns behind you. When one vanishes, turn.' },
    { x: -4, z: 103.5, text: 'Sir Caddoc\'s chain-blade reaches farther than any sword. Get inside it, or out of it.' },
    { x: -4, z: 160, text: 'The Thorned Heir waits on his mother\'s throne.' },
  ],

  items: [
    { id: 'glimmer1', x: 17.5, z: 53.5, kind: 'glimmer', amount: 8200, label: 'Glimmer Shard', desc: '+8200 Glimmer' },
    { id: 'c-rosethorn', x: 40, z: 32, kind: 'charm', charm: 'rosethorn', label: 'Charm' },
    { id: 'grace1', x: -16, z: 64, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'glimmer2', x: 4, z: 64, kind: 'glimmer', amount: 8800, label: 'Glimmer Shard', desc: '+8800 Glimmer', inside: 'gurn' },
    { id: 'glimmer3', x: 6, z: 156, kind: 'glimmer', amount: 9400, label: 'Glimmer Shard', desc: '+9400 Glimmer' },
    { id: 'glimmer4', x: 28, z: 48, kind: 'glimmer', amount: 8000, label: 'Glimmer Shard', desc: '+8000 Glimmer', inside: 'ourn' },
  ],
  letters: [
    { id: 'gardener', x: -17.5, z: 22.5, title: "The Gardener's Last Instruction", text: 'Cut back the roses every new moon. Every new moon. If you let them grow through a whole month they will not stop.\n\nThere has been no new moon for a year. The moon only wanes now, and never quite goes, and the roses have not stopped.' },
    { id: 'caddoc', x: 4.4, z: 121.5, title: "Sir Caddoc's Oath", text: 'I swore to keep the Court\'s gate against all comers, in the old Queen\'s name.\n\nThe old Queen is gone. The new one wears her face and does not remember my name. I keep the gate anyway. An oath is not a thing you put down because the one you swore it to has changed.\n\nIf you are reading this, I am sorry. I will still try to kill you.' },
    { id: 'hawthorn', x: -22, z: 180, title: 'A Child\'s Drawing, Kept', text: '(A drawing in coloured wax: a lady with a lantern, a small boy holding her hand, and a big round moon with a smiling face.)\n\n(On the back, in a grown hand:) She says the moon is dying, and she will not let it. She says she will hold it so tight it can never go. I asked what happens to the rest of us. She did not answer.' },
    { id: 'maelis8', x: 3, z: -9.6, title: 'The Other Knight\'s Third Note', text: 'The rose is the Queen\'s. Our Queen: the Lantern Queen, who sent us all out to find the stolen moonlight. She stole it. Or she is stealing it, still, a thread at a time, from the Frostmere and the Spire and everywhere else.\n\nShe calls herself the Waning Queen now. She has Maelis.\n\nI have run out of lanterns. You still have yours. Go on.' },
  ],
  pixies: [
    { id: 'p1', x: 7.5, z: -9.5 },
    { id: 'p2', x: 0, z: 41.5, y: 1.3 },
    { id: 'p3', x: 38, z: 32, inside: 'ourn2' },
    { id: 'p4', x: -16.5, z: 94.5 },
    { id: 'p5', x: -18, z: 132, inside: 'rurn' },
  ],

  gate: { x: -6, z: 126.5, width: 7, guardian: 'caddoc', style: 'palisade', toast: 'The briar gate sinks into the earth', banner: 'BRIAR WARDEN FELLED', charm: 'briarknot' },
  seal: { x: -6, z: 164, yaw: 0, width: 7.6, height: 6.8, inside: [-6, 174] },
  exit: { x: -6, z: 200 },

  build(w, R) {
    const g = w.group, M = w.mats;
    M.rose = new THREE.MeshStandardMaterial({ color: 0xc83a6a, emissive: 0x4a0a1a, roughness: .8, flatShading: true });
    M.palestone = w.cutout(new THREE.MeshStandardMaterial({ map: M.pillar.map, normalMap: M.pillar.normalMap, color: 0xd8c8d0, roughness: .9 }));
    const keep = [...this.spawns, ...this.items, ...Object.values(this.shrines), ...this.messages, ...this.letters, ...this.pixies].map(o => ({ x: o.x, z: o.z, r: 2.2 }));

    w.floor(-60, -40, 70, 230, 'earth', 6, -.01);
    floorRooms(w, ROOMS.filter(r => ['gallery', 'court', 'orangery'].includes(r.id)), CORRS.filter(c => c.a === 'parterre' && c.b === 'gallery' || c.a === 'gallery'), 'floor', { tile: 4 });
    w.disc(-6, 188, 14, 'arena', 4.1);
    raiseRooms(w, ROOMS, CORRS, { edge: 'thorn', h: 4.6 });
    for (const [x0, z0, x1, z1] of HEDGES) edge(w, 'thorn', x0, z0, x1, z1, { h: 3.4 });

    // Roses: blooms along every hedge, and bushes across the gardens.
    const bloom = (x, z, k = 1) => { const b = w.rock(.22 * k, Math.floor(R() * 999), .3); b.translate(x, .6 + R() * 2.4, z); w.batch('rose', b); };
    for (let i = 0; i < 260; i++) {
      const rm = ROOMS[Math.floor(R() * ROOMS.length)], side = Math.floor(R() * 4);
      const x = side < 2 ? rm.x0 + R() * (rm.x1 - rm.x0) : side === 2 ? rm.x0 + .4 : rm.x1 - .4;
      const z = side >= 2 ? rm.z0 + R() * (rm.z1 - rm.z0) : side === 0 ? rm.z0 + .4 : rm.z1 - .4;
      bloom(x, z, .8 + R() * .6);
    }
    for (const [x0, z0, x1, z1] of HEDGES) for (let k = 0; k < 8; k++) bloom(x0 + (x1 - x0) * R(), z0 + (z1 - z0) * R());

    // The Briar Wicket: a ruined gatehouse arch, the way in.
    w.pillar(-3.8, 11, .7, 6, false, 'palestone'); w.pillar(3.8, 11, .7, 6, false, 'palestone');
    const lintel = boxGeo(8.6, 1, 1.4, 2); lintel.translate(0, 6.3, 11); w.batch('palestone', lintel);
    w.tree(7, 5, 6, 3); w.deadTree(-8, 7, 5, 4);
    for (const [x, z] of [[-8, -9], [8, -9]]) w.brazier(x, z, 0xff8ab8);

    // The Overgrown Parterre: fountains gone to briar, statues of the old Court.
    for (const [x, z] of [[0, 24], [0, 52]]) {
      const bowl = new THREE.CylinderGeometry(1.6, 1.2, .8, 16); bowl.translate(x, .4, z); w.batch('palestone', bowl);
      const col = new THREE.CylinderGeometry(.2, .3, 1.8, 8); col.translate(x, 1.3, z); w.batch('palestone', col);
      w.prop(w.addCyl(x, z, 1.6, 1));
    }
    for (const p of scatter(R, ROOMS[1], 6, keep.concat(HEDGES.flatMap(([a, b, c, d]) => [{ x: (a + c) / 2, z: (b + d) / 2, r: Math.hypot(c - a, d - b) / 2 + 1.5 }])), { edge: 2.5, gap: 4 })) {
      if (R() < .5) w.tree(p.x, p.z, 5 + R() * 3, Math.floor(R() * 99)); else w.brazier(p.x, p.z, 0xff8ab8);
    }

    // The Ruined Orangery: broken glass walls, dead orange trees in tubs.
    for (const [x, z] of [[30, 34], [38, 34], [30, 45], [38, 45]]) {
      if (keep.some(k => Math.hypot(k.x - x, k.z - z) < 2)) continue;
      const tub = new THREE.CylinderGeometry(.8, .6, .9, 10); tub.translate(x, .45, z); w.batch('wood', tub); w.deadTree(x, z, 3.5, Math.round(x + z));
    }
    w.breakable('urn', 28, 48, { id: 'ourn' }); w.breakable('urn', 38, 32, { id: 'ourn2' }); w.breakable('crate', 40.5, 44);

    // The Gallery of Thorns: statues of the Court's knights, briar grown through them.
    for (let z = 67; z <= 91; z += 6) for (const x of [-15, 3]) {
      const st = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(.4, 1.4, 4, 10), M.palestone); body.position.y = 1.6; st.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(.32, 10, 8), M.palestone); head.position.y = 2.7; st.add(head);
      const base = new THREE.Mesh(boxGeo(1.2, .8, 1.2, 1), M.palestone); base.position.y = .4; st.add(base);
      st.position.set(x, 0, z); st.traverse(o => { o.castShadow = true; }); g.add(st); w.prop(w.addCyl(x, z, .7, 3));
      for (let k = 0; k < 3; k++) bloom(x + (R() - .5), z + (R() - .5), .7);
    }
    for (const [x, z] of [[-16, 96 - 3], [4, 64.5]]) w.brazier(x, z, 0xff8ab8);
    w.breakable('urn', 4, 64, { id: 'gurn' }); w.breakable('urn', -16.5, 67);

    // The Warden's Court: a paved yard before the inner gate.
    for (const x of [-15, 3]) w.pillar(x, 104, .8, 9, false, 'palestone');
    for (const [x, z] of [[-15, 121], [3, 121]]) w.brazier(x, z, 0xff8ab8);
    w.pile(-15.5, 112, [['crate', 0, 0], ['barrel', 1, .2]], .3);

    // The Queen's Rose Garden: roses grown into trees, an arbour.
    for (const p of scatter(R, ROOMS[5], 7, keep, { edge: 3, gap: 3.5 })) {
      w.deadTree(p.x, p.z, 4 + R() * 2, Math.floor(R() * 99), true, 'bark');
      for (let k = 0; k < 6; k++) bloom(p.x + (R() - .5) * 2.4, p.z + (R() - .5) * 2.4, 1.2);
    }
    w.breakable('urn', -18, 132, { id: 'rurn' }); w.breakable('urn', 6, 150);
    for (const [x, z] of [[6, 131], [-18, 156]]) w.brazier(x, z, 0xff8ab8);

    // The Thorned Throne: the old Queen's throne, grown over, and a ring of briar pillars.
    const th = boxGeo(3, 4.4, 2, 2); th.translate(-6, 2.2, 204); w.batch('palestone', th);
    for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * Math.PI * 2, x = -6 + Math.sin(a) * 13, z = 188 + Math.cos(a) * 12.5; w.pillar(x, z, .8, 8, i === 2 || i === 6, 'palestone'); for (let k = 0; k < 4; k++) bloom(x + (R() - .5) * 1.4, z + (R() - .5) * 1.4, 1); }
    for (let i = 0; i < 6; i++) { const a = (i + .5) / 6 * Math.PI * 2; w.brazier(-6 + Math.sin(a) * 16, 188 + Math.cos(a) * 15.5, 0xff5a9a); }
  },
};
