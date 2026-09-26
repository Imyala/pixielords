// Mission 13: the Necropolis of the First Fae, a city of white tombs under the moon's own sky, where the first
// fae who came up to keep the light were laid to rest, and did not rest. North: the Mourning Gate (first
// Moonwell) → the Avenue of Tombs (the Ossuary off to the east) → the Garden of Stone Lilies → the Unsleeping
// Vigil (Sir Corvin holds it) → the Chapel of the First Fae (second Moonwell) → Briar Seal → the Royal Crypt
// (Aurel and Ilune, the Hollow King and Queen, together).
import * as THREE from 'three';
import { boxGeo } from '../world.js';
import { joinRooms, raiseRooms, roomAreas, floorRooms, scatter } from './rooms.js';

const WHITE = { h: 7, mat: 'whitestone', crenel: false };
const ROOMS = [
  { id: 'mgate', name: 'The Mourning Gate', x0: -10, z0: -12, x1: 10, z1: 12, o: WHITE },
  { id: 'avenue', name: 'The Avenue of Tombs', x0: -14, z0: 20, x1: 14, z1: 60, o: WHITE },
  { id: 'ossuary', name: 'The Ossuary', x0: 22, z0: 30, x1: 38, z1: 46, o: { ...WHITE, h: 6 } },
  { id: 'lilies', name: 'The Garden of Stone Lilies', x0: -20, z0: 68, x1: 20, z1: 100, edge: 'balustrade' },
  { id: 'vigil', name: 'The Unsleeping Vigil', x0: -12, z0: 108, x1: 12, z1: 126, o: WHITE },
  { id: 'chapel', name: 'The Chapel of the First Fae', x0: -14, z0: 132, x1: 14, z1: 156, o: { ...WHITE, h: 9 } },
  { id: 'crypt', name: 'The Royal Crypt', x0: -20, z0: 168, x1: 20, z1: 208, o: { ...WHITE, h: 9 } },
];
const PASSES = [
  { a: 'mgate', b: 'avenue', at: 0, w: 7, o: WHITE },
  { a: 'avenue', b: 'ossuary', at: 38, w: 5, o: WHITE },
  { a: 'avenue', b: 'lilies', at: 0, w: 7, edge: 'balustrade' },
  { a: 'lilies', b: 'vigil', at: 0, w: 7, edge: 'balustrade' },
  { a: 'vigil', b: 'chapel', at: 0, w: 7, o: WHITE },
  { a: 'chapel', b: 'crypt', at: 0, w: 7.6, o: WHITE },
];
const CORRS = joinRooms(ROOMS, PASSES);

export default {
  id: 'necropolis',
  name: 'The Necropolis of the First Fae',
  blurb: 'A city of white tombs on the moon, where the first fae who came up to keep its light were laid to rest. They have not rested. Their king and queen least of all.',
  level: 98,
  gatekeeper: { hp: 1, dmg: 3 },   // scaled to keep pace with the knight (balance pass)
  warlord: { hp: 1.1, dmg: 2.3 },
  map: { x: 170, z: 2 },
  seed: 13113,
  forest: true, spire: true, moon: true,
  tier: 5.6,
  leaves: true,
  leafColors: [0xe8e0ff, 0xd8c8ff, 0xc8b8e8],
  fog: { color: 0x0e0c1a, byArea: { mgate: .01, avenue: .012, ossuary: .016, lilies: .01, vigil: .013, chapel: .014, crypt: .01 }, base: .011 },
  light: { sky: 0xc8c0f0, ground: 0x221e30, hemi: 1.55, moonColor: 0xe0d8ff, moon: 2.1 },
  moon: { at: [140, 90, 340], glow: 150, size: 30, world: true, color: 0x6a9ad8, glowColor: 0x8ab8ff },
  enemyGlow: .16,
  intro: 'Under the Hollows, the stone doors opened on a city of tombs, under the moon\'s own sky.\nThe first fae are buried here. Walk softly. They do not sleep.',
  outro: 'Aurel and Ilune fall together, as they reigned, and for a moment the whole Necropolis is quiet. Then, from the moon\'s dark side, a long, low howl. The way into the dark opens.',
  exitToast: 'The First are at rest. A Pixie Gate opens in the Royal Crypt',
  motes: { base: 0xd8c8ff, lilies: 0xeef2ff, crypt: 0xffe0a0 },
  titleShrine: 'mgate',
  areas: roomAreas(ROOMS),
  rooms: ROOMS, corrs: CORRS,   // for the shortcut (shortcuts.js), laid in before the level is built

  shrines: {
    mgate: { id: 'mgate', name: 'Moonwell of the Mourning Gate', x: -4, z: -4, spawn: [-1.8, -2.2], yaw: 0 },
    chapel: { id: 'chapel', name: 'Moonwell of the First Fae', x: -9, z: 137, spawn: [-7, 139], yaw: .5 },
  },

  spawns: [
    { id: 'm1', type: 'hollow-courtier', x: 4, z: 7, yaw: Math.PI },
    // The Avenue of Tombs
    { id: 'a1', type: 'hollow-guard', x: -5, z: 30, yaw: Math.PI },
    { id: 'a2', type: 'hollow-courtier', x: 6, z: 42, yaw: Math.PI },
    { id: 'a3', type: 'ratman-gravewight', x: -5, z: 49, yaw: 2.4, idle: 'sleep' },
    { id: 'a4', type: 'goblin-bonecaller', x: 10, z: 56, yaw: -2.6 },
    { id: 'a5', type: 'moth-shade', x: 0, z: 56, yaw: Math.PI },
    // The Ossuary
    { id: 'o1', type: 'ratman-gravewight', x: 30, z: 40, yaw: -1.6 },
    { id: 'o2', type: 'goblin-bonecaller', x: 34, z: 33, yaw: -1.2 },
    // The Garden of Stone Lilies
    { id: 'g1', type: 'hollow-courtier', x: -8, z: 78, yaw: Math.PI },
    { id: 'g2', type: 'hollow-guard', x: 8, z: 88, yaw: Math.PI, patrol: [[8, 88], [14, 72], [-14, 72], [-8, 94]] },
    { id: 'g3', type: 'ratman-gravewight', x: -16, z: 96, yaw: 2.4 },
    { id: 'g4', type: 'goblin-bonecaller', x: 16, z: 96, yaw: -2.6 },
    { id: 'g5', type: 'moth-shade', x: 0, z: 96, yaw: Math.PI, idle: 'sleep' },
    // The Unsleeping Vigil
    { id: 'corvin', type: 'corvin', x: 0, z: 118, yaw: Math.PI, elite: 'warden' },
    // The Chapel of the First Fae
    { id: 'c1', type: 'hollow-guard', x: 5, z: 150, yaw: Math.PI },
    { id: 'c2', type: 'hollow-courtier', x: -5, z: 152, yaw: Math.PI },
    { id: 'c3', type: 'goblin-bonecaller', x: 11, z: 137, yaw: -2.2 },
    { id: 'c4', type: 'ratman-gravewight', x: -12, z: 154, yaw: 2.6, idle: 'sleep' },
    // The Royal Crypt: the Hollow King and Queen
    { id: 'king', type: 'hollow-king', x: -4.5, z: 190, yaw: Math.PI, elite: 'boss' },
    { id: 'queen', type: 'hollow-queen', x: 4.5, z: 193, yaw: Math.PI, elite: 'boss' },
  ],
  adds: [],
  boss: ['king', 'queen'],
  bossCharm: 'hollowcrown',
  phase2Line: 'The First mourn each other',

  messages: [
    { x: 2, z: -6, text: 'The Hollowed fight as the first knights fought: courtiers quick with the point, guards behind their shields.' },
    { x: -2, z: 22, text: 'Bonecallers raise what you have felled. Silence them first.' },
    { x: 2, z: 70, text: 'The lilies are stone. What stands among them is not.' },
    { x: 2, z: 109.5, text: 'Sir Corvin will not sleep, and he will not stop. Watch for the long watch: four cuts, and a turn.' },
    { x: 2, z: 160, text: 'Beyond the briars, the King and Queen of the First, who kept each other when the light was gone. Fell one and the other grieves.' },
  ],

  items: [
    { id: 'glimmer1', x: 12.5, z: 22, kind: 'glimmer', amount: 18000, label: 'Glimmer Shard', desc: '+18000 Glimmer' },
    { id: 'c-lilyseal', x: 36, z: 44, kind: 'charm', charm: 'lilyseal', label: 'Charm' },
    { id: 'grace1', x: -17, z: 70, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'glimmer2', x: 17, z: 70, kind: 'glimmer', amount: 18800, label: 'Glimmer Shard', desc: '+18800 Glimmer', inside: 'lurn' },
    { id: 'glimmer3', x: 12, z: 134, kind: 'glimmer', amount: 19600, label: 'Glimmer Shard', desc: '+19600 Glimmer' },
    { id: 'glimmer4', x: 24, z: 44, kind: 'glimmer', amount: 18400, label: 'Glimmer Shard', desc: '+18400 Glimmer', inside: 'ourn' },
  ],
  letters: [
    { id: 'epitaph', x: -12.5, z: 26, title: 'An Epitaph', text: 'Here lies Wren, first lamp-bearer, who carried the moon\'s first light up the white river and would not carry it down again.\n\nShe asked to be buried facing the fae world, so she could watch it by her light. It has been dark there for a year. She is not facing it any more.' },
    { id: 'corvin', x: 10.5, z: 110, title: 'Sir Corvin\'s Oath', text: 'I, Corvin, will keep this door until the King and Queen of the First wake, or the moon goes out.\n\nThe moon is going out. I have been waiting for them to wake so that I could ask them what to do. I think they are awake. I think they are not themselves.' },
    { id: 'aurel', x: -12.4, z: 153.5, title: 'Words Carved on the Royal Tomb', text: 'AUREL AND ILUNE, KING AND QUEEN OF THE FIRST.\n\nThey chained the dark at the heart of the moon with their own light, and when their light was spent, lay down here together to keep watch over the chain.\n\n(Below, scratched much later:) The chain holds only while the moon is lit. Selene holds it now, alone.' },
    { id: 'knight13', x: 3, z: -9.6, title: 'A Third Lantern', text: '(Another small lantern at the Moonwell, burning low. On its base:)\n\nThe Queen was not starving the moon. She was starving what is chained in it. Too late I understood her. — M.' },
  ],
  pixies: [
    { id: 'p1', x: 7.5, z: -9.5 },
    { id: 'p2', x: -12.5, z: 46, y: 1.2 },
    { id: 'p3', x: 36, z: 32, inside: 'ourn2' },
    { id: 'p4', x: 17.5, z: 97 },
    { id: 'p5', x: -12, z: 144, inside: 'curn' },
  ],

  gate: { x: 0, z: 128.5, width: 7, guardian: 'corvin', style: 'portcullis', toast: 'The Vigil\'s gate rises', banner: 'SIR CORVIN SLEEPS', charm: 'corvinoath' },
  seal: { x: 0, z: 164, yaw: 0, width: 7.6, height: 6.8, inside: [0, 174] },
  exit: { x: 0, z: 204 },

  build(w, R) {
    const g = w.group;
    const keep = [...this.spawns, ...this.items, ...Object.values(this.shrines), ...this.messages, ...this.letters, ...this.pixies].map(o => ({ x: o.x, z: o.z, r: 2.2 }));

    // White flagstones among silver dust; white walls and balustrades.
    w.floor(-80, -40, 90, 250, 'dust', 6, -.02);
    floorRooms(w, ROOMS, CORRS, 'marble', { tile: 4 });
    w.disc(0, 190, 15, 'arena', 4.1);
    raiseRooms(w, ROOMS, CORRS, { edge: 'wall', ...WHITE });

    // Tombs: long white chests with a lid, and headstones leaning over the dust.
    const tomb = (x, z, ry = 0) => {
      const b = boxGeo(1.6, 1, 3, 1); b.rotateY(ry); b.translate(x, .5, z); w.batch('whitestone', b);
      const lid = boxGeo(1.8, .2, 3.2, 1); lid.rotateY(ry); lid.translate(x, 1.1, z); w.batch('marble', lid);
      w.prop(w.addBox(x, z, ry ? 1.6 : .9, ry ? .9 : 1.6, 0, 1.2));
    };
    const stone = (x, z) => { const s = boxGeo(.8, 1.3 + R() * .6, .25, 1); s.rotateY((R() - .5) * .5); s.rotateZ((R() - .5) * .25); s.translate(x, .6, z); w.batch('whitestone', s); };
    for (const z of [28, 36, 44, 52]) for (const x of [-10, 10]) tomb(x, z);
    for (const p of scatter(R, ROOMS[1], 10, keep, { edge: 1.5, gap: 2 })) stone(p.x, p.z);
    for (const [x, z] of [[-8, -9], [8, 9], [-8, 9]]) w.brazier(x, z, 0xd8c8ff);

    // The Ossuary: niches of bone.
    for (let i = 0; i < 6; i++) { const b = boxGeo(1.4, 2.6, .8, 1); b.translate(24 + i * 2.6, 1.3, 45.4); w.batch('bone', b); }
    w.breakable('urn', 24, 44, { id: 'ourn' }); w.breakable('urn', 36, 32, { id: 'ourn2' }); w.breakable('urn', 24, 32);

    // The Garden of Stone Lilies: pale trees, and lilies carved of whitestone standing waist-high.
    const lily = (x, z) => {
      const st = new THREE.CylinderGeometry(.06, .08, 1.2, 5); st.translate(x, .6, z); w.batch('whitestone', st);
      for (let k = 0; k < 5; k++) { const p = new THREE.ConeGeometry(.18, .6, 4); p.rotateZ(.9); p.rotateY(k / 5 * 6.28); p.translate(x, 1.25, z); w.batch('marble', p); }
    };
    for (const p of scatter(R, ROOMS[3], 26, keep, { gap: 1.8 })) lily(p.x, p.z);
    for (const p of scatter(R, ROOMS[3], 5, keep, { edge: 3, gap: 5 })) w.deadTree(p.x, p.z, 4.5 + R() * 2, Math.floor(R() * 99), true, 'palebark');
    for (const [x, z, r] of [[-10, 84, 2], [10, 76, 1.6]]) w.moonpool(x, z, r);
    w.breakable('urn', 17, 70, { id: 'lurn' }); w.breakable('urn', -18, 98);

    // The Unsleeping Vigil: a hall of candles that never burn down.
    for (const x of [-10, 10]) { w.pillar(x, 110, .7, 7, false, 'whitestone'); w.banner(x * 1.14, 120, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0x2a2438); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; w.brazier(Math.sin(a) * 9, 117 + Math.cos(a) * 7, 0xffe0a0, false, .45); }

    // The Chapel of the First Fae: tall columns, and the first lamp on its altar.
    for (let z = 138; z <= 152; z += 7) for (const x of [-5, 5]) w.pillar(x, z, .7, 9, false, 'whitestone');
    const altar = boxGeo(3, 1.2, 1.4, 2); altar.translate(0, .6, 154.5); w.batch('whitestone', altar);
    w.brazier(0, 154.5, 0xfff0c8, false, 1.2, 1.2);
    w.breakable('urn', -12, 144, { id: 'curn' }); w.breakable('urn', 12.5, 152);

    // The Royal Crypt: two thrones on a dais, and the great double tomb behind them.
    const dais = new THREE.CylinderGeometry(4, 4.4, .6, 24); dais.translate(0, .3, 204); w.batch('whitestone', dais);
    for (const x of [-2, 2]) { const th = boxGeo(1.8, 3.6, 1.4, 2); th.translate(x, 2.4, 205.5); w.batch('whitestone', th); }
    for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * Math.PI * 2; w.pillar(Math.sin(a) * 15, 190 + Math.cos(a) * 14, .75, 9, i % 3 === 0, 'whitestone'); }
    for (let i = 0; i < 6; i++) { const a = (i + .5) / 6 * Math.PI * 2; w.brazier(Math.sin(a) * 17, 190 + Math.cos(a) * 16, 0xffe0a0); }

    // Beyond the walls: more tombs than anyone could count, to the moon's horizon.
    const farMat = new THREE.MeshStandardMaterial({ color: 0x9a96a8, roughness: 1, flatShading: true });
    for (let i = 0; i < 70; i++) { const a = R() * 6.28, r = 70 + R() * 150, h = 3 + R() * 14; const m = new THREE.Mesh(new THREE.BoxGeometry(3 + R() * 6, h, 3 + R() * 6), farMat); m.position.set(Math.sin(a) * r, h / 2 - 1, 100 + Math.cos(a) * r); g.add(m); }
  },
};
