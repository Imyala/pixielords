// Mission 12: the Hollows of Selene, inside the moon: caverns of moon-crystal grown over the halls the first fae
// cut. North, down: the Crystal Mouth (first Moonwell) → the Singing Galleries (the Great Geode off to the west)
// → the Underlake → the Warden's Cut (Tessaly, the Crystal Warden, holds it) → the Hall of the First Lamps
// (second Moonwell) → Briar Seal → the Moth-Nest (Nyx, Mother of Moths).
import * as THREE from 'three';
import { joinRooms, raiseRooms, roomAreas, floorRooms, scatter } from './rooms.js';

const ROOMS = [
  { id: 'mouth', name: 'The Crystal Mouth', x0: -10, z0: -12, x1: 10, z1: 12 },
  { id: 'galleries', name: 'The Singing Galleries', x0: -20, z0: 20, x1: 20, z1: 54 },
  { id: 'geode', name: 'The Great Geode', x0: -40, z0: 28, x1: -28, z1: 46 },
  { id: 'lake', name: 'The Underlake', x0: -18, z0: 62, x1: 18, z1: 96 },
  { id: 'cut', name: 'The Warden\'s Cut', x0: -12, z0: 104, x1: 12, z1: 124 },
  { id: 'lamps', name: 'The Hall of the First Lamps', x0: -12, z0: 130, x1: 14, z1: 154 },
  { id: 'nest', name: 'The Moth-Nest', x0: -20, z0: 166, x1: 20, z1: 206 },
];
const PASSES = [
  { a: 'mouth', b: 'galleries', at: 0, w: 7 },
  { a: 'geode', b: 'galleries', at: 37, w: 6 },
  { a: 'galleries', b: 'lake', at: 0, w: 7 },
  { a: 'lake', b: 'cut', at: 0, w: 7 },
  { a: 'cut', b: 'lamps', at: 0, w: 7 },
  { a: 'lamps', b: 'nest', at: 0, w: 7.6 },
];
const CORRS = joinRooms(ROOMS, PASSES);

export default {
  id: 'hollows',
  name: 'The Hollows of Selene',
  blurb: 'Inside the moon: caverns of singing crystal grown over the halls the first fae cut, and a lake of fallen light. Something has been eating it.',
  level: 90,
  gatekeeper: { hp: 1, dmg: 2.7 },   // scaled to keep pace with the knight (balance pass)
  warlord: { hp: 1.2, dmg: 3.2 },
  map: { x: 150, z: -18 },
  seed: 12112,
  cave: true, spire: true, moon: true, moonRock: 0x7a8aa8, moonRockGlow: 0x0c1620,
  tier: 5.2,
  fog: { color: 0x081018, byArea: { mouth: .014, galleries: .016, geode: .02, lake: .014, cut: .016, lamps: .018, nest: .012 }, base: .016 },
  light: { sky: 0x8ac8e8, ground: 0x10202a, hemi: 1.35, moonColor: 0xb8e8ff, moon: 1.4 },
  enemyGlow: .2,
  intro: 'The tide of light drained into the moon, and a stair of crystal went down after it.\nFollow it into the Hollows, where the first fae lived, and find what drinks the light.',
  outro: 'Nyx falls, and her moths scatter into the crystal like sparks going out. In the silence you can hear it: under the Hollows, stone doors, and something that is not a moth breathing behind them. The way down opens.',
  exitToast: 'The nest is empty. A Pixie Gate opens in the Moth-Nest',
  motes: { base: 0x8ff0ff, geode: 0xb8ffff, lake: 0x9fc8ff, nest: 0xf0d8ff },
  titleShrine: 'mouth',
  areas: roomAreas(ROOMS),

  shrines: {
    mouth: { id: 'mouth', name: 'Moonwell of the Crystal Mouth', x: -4, z: -4, spawn: [-1.8, -2.2], yaw: 0 },
    lamps: { id: 'lamps', name: 'Moonwell of the First Lamps', x: -8, z: 135, spawn: [-6, 137], yaw: .5 },
  },

  spawns: [
    { id: 'm1', type: 'ratman-crystalback', x: 5, z: 8, yaw: Math.PI, idle: 'sleep' },
    // The Singing Galleries
    { id: 'g1', type: 'crystal-knight', x: -6, z: 30, yaw: Math.PI },
    { id: 'g2', type: 'ratman-crystalback', x: 10, z: 28, yaw: -2.4 },
    { id: 'g3', type: 'goblin-geomancer', x: -14, z: 50, yaw: 2.4 },
    { id: 'g4', type: 'moth-shade', x: 12, z: 46, yaw: -2.4, patrol: [[12, 46], [-6, 48], [-12, 40]] },
    { id: 'g5', type: 'ratman-crystalback', x: 0, z: 50, yaw: Math.PI },
    // The Great Geode
    { id: 'e1', type: 'crystal-knight', x: -34, z: 40, yaw: 1.6 },
    { id: 'e2', type: 'goblin-geomancer', x: -36, z: 31, yaw: 1.2 },
    // The Underlake
    { id: 'u1', type: 'selene-sentry', x: 6, z: 70, yaw: Math.PI },
    { id: 'u2', type: 'moth-shade', x: -10, z: 76, yaw: 2.4 },
    { id: 'u3', type: 'crystal-knight', x: 0, z: 90, yaw: Math.PI, patrol: [[0, 90], [12, 84], [-12, 84]] },
    { id: 'u4', type: 'goblin-geomancer', x: 14, z: 94, yaw: -2.6 },
    { id: 'u5', type: 'ratman-crystalback', x: -14, z: 94, yaw: 2.6, idle: 'sleep' },
    // The Warden's Cut
    { id: 'tessaly', type: 'tessaly', x: 0, z: 116, yaw: Math.PI, elite: 'warden' },
    // The Hall of the First Lamps
    { id: 'h1', type: 'crystal-knight', x: 5, z: 148, yaw: Math.PI },
    { id: 'h2', type: 'moth-shade', x: -8, z: 150, yaw: 2.6 },
    { id: 'h3', type: 'goblin-geomancer', x: 10, z: 152, yaw: -2.6 },
    { id: 'h4', type: 'ratman-crystalback', x: 10, z: 136, yaw: -2.2, idle: 'sleep' },
    // The Moth-Nest
    { id: 'boss', type: 'nyx', x: 0, z: 190, yaw: Math.PI, elite: 'boss' },
  ],
  adds: [
    { id: 'add1', type: 'moth-shade', x: -11, z: 194, yaw: Math.PI, add: true },
    { id: 'add2', type: 'moth-shade', x: 11, z: 194, yaw: Math.PI, add: true },
  ],
  boss: 'boss',
  bossCharm: 'mothwing',
  phase2Line: 'The moths wake in their thousands',

  messages: [
    { x: 2, z: -6, text: 'The crystal sings when it is struck. So do the things that live in it: listen for them.' },
    { x: -2, z: 22, text: 'Crystal Knights hide behind their shields. Their guard breaks if you keep at it; or go round.' },
    { x: 2, z: 64, text: 'Moth-Shades step behind you. When one vanishes, turn.' },
    { x: 2, z: 105.5, text: 'Tessaly\'s wheel grinds the ground to ice. Keep your feet dry of it.' },
    { x: 2, z: 158, text: 'Beyond the briars, a mother, and her young.' },
  ],

  items: [
    { id: 'glimmer1', x: 17, z: 22, kind: 'glimmer', amount: 16000, label: 'Glimmer Shard', desc: '+16000 Glimmer' },
    { id: 'c-geodeheart', x: -38, z: 44, kind: 'charm', charm: 'geodeheart', label: 'Charm' },
    { id: 'grace1', x: -16, z: 64, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'glimmer2', x: 16, z: 64, kind: 'glimmer', amount: 16800, label: 'Glimmer Shard', desc: '+16800 Glimmer', inside: 'lcrys' },
    { id: 'glimmer3', x: 12, z: 132, kind: 'glimmer', amount: 17600, label: 'Glimmer Shard', desc: '+17600 Glimmer' },
    { id: 'glimmer4', x: -30, z: 30, kind: 'glimmer', amount: 16400, label: 'Glimmer Shard', desc: '+16400 Glimmer', inside: 'ecrys' },
  ],
  letters: [
    { id: 'first1', x: -17.5, z: 22.5, title: 'Carved Above a Door', text: 'Here the first of the fae cut halls in the moon, to live close to its light and keep it bright for those below.\n\nWe came up the white river when it was new. We will not go down it again.' },
    { id: 'tessaly', x: 10.5, z: 106, title: 'The Warden\'s Rota', text: 'Cut: the Galleries, the Geode, the Lake. Keep: all of them.\n\nThe moths came in the year the light began to thin. I kept them out of the halls for a long time. Then there was not enough light left to keep anything out, and they were hungry, and so was I.' },
    { id: 'nyx', x: -11, z: 151.5, title: 'A Moth-Wing, Written On', text: '(Tiny writing, in something like dust, across a moth\'s wing as long as your arm:)\n\nMother says the light is sweet at the bottom of the moon. Mother says there is a great dark there, eating it. Mother says we must eat it first.' },
    { id: 'knight12', x: 3, z: -9.6, title: 'A Second Lantern', text: '(Beside the Moonwell, another small lantern, lit. Scratched on its base:)\n\nThe Hollows go down further than the moon is deep. I think the first fae made room for something. — M.' },
  ],
  pixies: [
    { id: 'p1', x: 7.5, z: -9.5 },
    { id: 'p2', x: 18, z: 38, y: 1.2 },
    { id: 'p3', x: -38, z: 30, inside: 'ecrys2' },
    { id: 'p4', x: -16.5, z: 86 },
    { id: 'p5', x: 12, z: 152, inside: 'hcrys' },
  ],

  gate: { x: 0, z: 126.5, width: 7, guardian: 'tessaly', style: 'ice', toast: 'The crystal wall shatters', banner: 'TESSALY\'S WHEEL IS STILL', charm: 'tessalywheel' },
  seal: { x: 0, z: 162, yaw: 0, width: 7.6, height: 6.8, inside: [0, 172] },
  exit: { x: 0, z: 202 },

  build(w, R) {
    const g = w.group;
    const keep = [...this.spawns, ...this.items, ...Object.values(this.shrines), ...this.messages, ...this.letters, ...this.pixies].map(o => ({ x: o.x, z: o.z, r: 2.2 }));

    // Cave floor, crystal-veined walls of cold moonrock, and a roof of dark overhead.
    floorRooms(w, ROOMS, CORRS, 'cavefloor', { tile: 5 });
    w.disc(0, 188, 15, 'arena', 4.1);
    raiseRooms(w, ROOMS, CORRS, { edge: 'cliff', h: 9 });
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(300, 320), new THREE.MeshStandardMaterial({ color: 0x0a1018, roughness: 1, side: THREE.DoubleSide }));
    roof.rotation.x = Math.PI / 2; roof.position.set(0, 16, 100); g.add(roof);

    // Crystal everywhere: pale blue in the galleries, white in the halls, violet in the nest.
    const cols = { galleries: [0x8ff0ff, 0xb8ffff, 0x7ab8ff], geode: [0x8ff0ff, 0xd8ffff, 0x9fd8ff], lake: [0x9fc8ff, 0xd8e8ff, 0x8ff0ff], cut: [0x8ff0ff], lamps: [0xeef4ff, 0xd8e8ff], nest: [0xe8d0ff, 0xc8a8ff, 0xf0d8ff] };
    for (const rm of ROOMS) {
      const c = cols[rm.id]; if (!c || rm.id === 'nest') continue;
      const n = Math.round((rm.x1 - rm.x0) * (rm.z1 - rm.z0) / 110);
      for (const p of scatter(R, rm, n, keep, { edge: 3, gap: 3.2 })) w.crystal(p.x, p.z, 1.8 + R() * 2.8, c[Math.floor(R() * c.length)], Math.floor(R() * 999), R() < .45);
    }
    // Hanging crystal: stalactites of light over the galleries.
    for (let i = 0; i < 24; i++) { const x = -18 + R() * 36, z = 22 + R() * 72, h = 1.5 + R() * 3, s = new THREE.ConeGeometry(.25 + R() * .3, h, 5); s.rotateX(Math.PI); s.translate(x, 15.5 - h / 2, z); w.batch('selenite', s); }
    w.breakable('crystal', 16, 64, { id: 'lcrys' }); w.breakable('crystal', -30, 30, { id: 'ecrys' }); w.breakable('crystal', -38, 30, { id: 'ecrys2' }); w.breakable('crystal', 12, 152, { id: 'hcrys' });
    w.breakable('crystal', -18, 52); w.breakable('crystal', 18, 30); w.breakable('urn', -4, 94);

    // The Great Geode: a hollow walled in crystal all round.
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, x = -34 + Math.sin(a) * 5.4, z = 37 + Math.cos(a) * 7.6; if (Math.abs(a - Math.PI / 2) < .45) continue; w.crystal(x, z, 2.4 + R() * 2.4, cols.geode[i % 3], i + 7, i % 4 === 0, false); }

    // The Underlake: fallen light pooled in the dark, and the first fae's lamp-posts standing in it.
    for (const [x, z, r] of [[-6, 80, 3.2], [9, 74, 2], [-12, 68, 1.6]]) w.moonpool(x, z, r);
    for (const [x, z] of [[-16, 72], [16, 80], [-16, 88]]) w.brazier(x, z, 0xb8ecff);

    // The Warden's Cut: square-hewn walls, and the marks of the wheel in the stone.
    for (const x of [-10, 10]) w.pillar(x, 108, .8, 8, false, 'whitestone');
    const groove = new THREE.MeshBasicMaterial({ color: 0x8ff0ff, transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(1.6 + i * .9, 1.7 + i * .9, 40, 1, R() * 6, 1.2 + R()), groove); m.rotation.x = -Math.PI / 2; m.position.set(0, .03, 115); g.add(m); }

    // The Hall of the First Lamps: white columns and the first fae's lamps, still burning low.
    for (let z = 136; z <= 150; z += 7) for (const x of [-5, 5]) w.pillar(x, z, .65, 8, false, 'whitestone');
    for (const [x, z] of [[-11, 146], [12.5, 140], [12.5, 150]]) w.brazier(x, z, 0xeef4ff);
    w.breakable('urn', -10, 152);

    // The Moth-Nest: a dome of violet crystal webbed with silk.
    for (let i = 0; i < 10; i++) { const a = (i + .5) / 10 * Math.PI * 2; w.crystal(Math.sin(a) * 15, 188 + Math.cos(a) * 14, 3 + (i % 3) * 1.2, cols.nest[i % 3], i + 40, i % 2 === 0); }
    const silk = new THREE.MeshBasicMaterial({ color: 0xf0e0ff, transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 16), silk); m.position.set(Math.sin(a) * 9, 9, 188 + Math.cos(a) * 9); m.rotation.set(Math.cos(a) * .7, a, 0); g.add(m); }
    const glowMat = new THREE.SpriteMaterial({ map: w.glowTex, color: 0xf0d8ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .5 });
    const moths = [];
    for (let i = 0; i < 40; i++) { const m = new THREE.Sprite(glowMat); m.scale.setScalar(.35); g.add(m); moths.push({ m, a: R() * 6.28, r: 4 + R() * 12, y: 2 + R() * 10, s: .2 + R() * .5 }); }
    w.anim.push(t => { for (const q of moths) { const a = q.a + t * q.s; q.m.position.set(Math.sin(a) * q.r, q.y + Math.sin(t * 2 + q.a) * .5, 188 + Math.cos(a) * q.r); } });
  },
};
