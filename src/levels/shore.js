// Mission 11: the Silver Shore, on the moon's near side, where the white river of moonlight set the knight down.
// A sea of light breaks on dunes of silver dust. North, along the shore: the Pixie Landing (first Moonwell) →
// the Silver Dunes (the Wreck of the Lantern Barge off to the east) → the Shallows of Light → the Lighthouse
// Steps (Oriel, the Lamp-Keeper, holds them) → the Keeper's Cottage (second Moonwell) → Briar Seal → the Sea of
// Tranquility (Gloam, the Shell-Colossus).
import * as THREE from 'three';
import { boxGeo } from '../world.js';
import { joinRooms, raiseRooms, roomAreas, floorRooms, scatter } from './rooms.js';

const ROOMS = [
  { id: 'landing', name: 'The Pixie Landing', x0: -10, z0: -12, x1: 10, z1: 12 },
  { id: 'dunes', name: 'The Silver Dunes', x0: -22, z0: 20, x1: 20, z1: 56 },
  { id: 'wreck', name: 'The Wreck of the Lantern Barge', x0: 28, z0: 30, x1: 46, z1: 48 },
  { id: 'shallows', name: 'The Shallows of Light', x0: -18, z0: 64, x1: 18, z1: 96 },
  { id: 'steps', name: 'The Lighthouse Steps', x0: -12, z0: 104, x1: 12, z1: 124 },
  { id: 'cottage', name: 'The Keeper\'s Cottage', x0: -12, z0: 130, x1: 14, z1: 154 },
  { id: 'sea', name: 'The Sea of Tranquility', x0: -20, z0: 166, x1: 20, z1: 206, edge: 'balustrade', floor: 'marble' },
];
const PASSES = [
  { a: 'landing', b: 'dunes', at: 0, w: 8 },
  { a: 'dunes', b: 'wreck', at: 39, w: 6 },
  { a: 'dunes', b: 'shallows', at: 0, w: 8 },
  { a: 'shallows', b: 'steps', at: 0, w: 7 },
  { a: 'steps', b: 'cottage', at: 0, w: 7, o: { mat: 'whitestone', h: 6, crenel: false }, edge: 'wall' },
  { a: 'cottage', b: 'sea', at: 0, w: 7.6 },
];
const CORRS = joinRooms(ROOMS, PASSES);

export default {
  id: 'shore',
  name: 'The Silver Shore',
  blurb: 'The moon\'s near shore, where a sea of light breaks on dunes of silver dust. The white river set you down here. Something on the moon has noticed.',
  level: 82,
  gatekeeper: { hp: 1, dmg: 2.9 },   // scaled to keep pace with the knight (balance pass)
  warlord: { hp: 1.2, dmg: 2.4 },
  map: { x: 136, z: 0 },
  seed: 11011,
  forest: true, spire: true, moon: true,
  tier: 4.8,
  leaves: true,
  leafColors: [0xeef2ff, 0xd8e0ff, 0xfff4d8],
  fog: { color: 0x0c1020, byArea: { landing: .008, dunes: .009, wreck: .011, shallows: .009, steps: .01, cottage: .012, sea: .006 }, base: .009 },
  light: { sky: 0xc8d0f0, ground: 0x2a2a38, hemi: 1.7, moonColor: 0xdce8ff, moon: 2.3 },
  moon: { at: [-80, 120, 340], glow: 160, size: 34, world: true, color: 0x6a9ad8, glowColor: 0x8ab8ff },
  enemyGlow: .15,
  intro: 'The white river set you down on the moon\'s own shore.\nThe moon is waxing again, and something on it has turned over in its sleep.',
  outro: 'Gloam sinks into the Sea of Tranquility, and the tide of light goes out with it, down, into the moon. Where it drained, a stair of crystal leads inside. The way down opens.',
  exitToast: 'The tide goes out. A Pixie Gate opens on the sea-bed',
  motes: { base: 0xeef2ff, shallows: 0xc8e0ff, sea: 0xfff4d8 },
  titleShrine: 'landing',
  areas: roomAreas(ROOMS),

  shrines: {
    landing: { id: 'landing', name: 'Moonwell of the Pixie Landing', x: -4, z: -4, spawn: [-1.8, -2.2], yaw: 0 },
    cottage: { id: 'cottage', name: 'Moonwell of the Keeper\'s Cottage', x: -8, z: 135, spawn: [-6, 137], yaw: .5 },
  },

  spawns: [
    { id: 'l1', type: 'goblin-dustrunner', x: 5, z: 8, yaw: Math.PI, idle: 'sleep' },
    // The Silver Dunes
    { id: 'd1', type: 'goblin-dustrunner', x: -10, z: 30, yaw: Math.PI },
    { id: 'd2', type: 'goblin-dustrunner', x: 10, z: 34, yaw: -2.6 },
    { id: 'd3', type: 'ratman-shellback', x: 0, z: 46, yaw: Math.PI, patrol: [[0, 46], [12, 50], [-12, 50]] },
    { id: 'd4', type: 'goblin-lampwright', x: -16, z: 52, yaw: 2.4 },
    { id: 'd5', type: 'goblin-moonbow', x: 16, z: 52, yaw: -2.4 },
    // The Wreck of the Lantern Barge
    { id: 'w1', type: 'selene-sentry', x: 38, z: 40, yaw: -1.6 },
    { id: 'w2', type: 'goblin-dustrunner', x: 42, z: 34, yaw: -1.2, idle: 'sleep' },
    // The Shallows of Light
    { id: 's1', type: 'selene-sentry', x: -6, z: 72, yaw: Math.PI },
    { id: 's2', type: 'ratman-shellback', x: 8, z: 84, yaw: Math.PI },
    { id: 's3', type: 'goblin-lampwright', x: -14, z: 90, yaw: 2.6 },
    { id: 's4', type: 'goblin-moonbow', x: 14, z: 92, yaw: -2.6 },
    { id: 's5', type: 'goblin-dustrunner', x: 0, z: 94, yaw: Math.PI, idle: 'sleep' },
    // The Lighthouse Steps
    { id: 'oriel', type: 'oriel', x: 0, z: 116, yaw: Math.PI, elite: 'warden' },
    // The Keeper's Cottage
    { id: 'c1', type: 'selene-sentry', x: 5, z: 148, yaw: Math.PI },
    { id: 'c2', type: 'goblin-lampwright', x: -9, z: 151, yaw: 2.6 },
    { id: 'c3', type: 'ratman-shellback', x: 9, z: 138, yaw: -2.2, idle: 'sleep' },
    { id: 'c4', type: 'goblin-dustrunner', x: 0, z: 152, yaw: Math.PI },
    // The Sea of Tranquility
    { id: 'boss', type: 'gloam', x: 0, z: 190, yaw: Math.PI, elite: 'boss' },
  ],
  adds: [
    { id: 'add1', type: 'goblin-dustrunner', x: -12, z: 194, yaw: Math.PI, add: true },
    { id: 'add2', type: 'goblin-dustrunner', x: 12, z: 194, yaw: Math.PI, add: true },
  ],
  boss: 'boss',
  bossCharm: 'shellheart',
  phase2Line: 'Gloam closes its shell',

  messages: [
    { x: 2, z: -6, text: 'You are on the moon. The dust is soft, and the light is loud. Dust-Runners hunt in pairs across the dunes.' },
    { x: -2, z: 22, text: 'A Shellback\'s back turns blows. Get round it, or break its stamina first.' },
    { x: 2, z: 66, text: 'Lampwrights relight their fallen. Put the lamps out first.' },
    { x: 2, z: 105.5, text: 'Oriel\'s chain reaches as far as her light. Close the distance, and stay close.' },
    { x: 2, z: 158, text: 'Beyond the briars, the tide, and the thing that lives in it.' },
  ],

  items: [
    { id: 'glimmer1', x: -19, z: 22, kind: 'glimmer', amount: 14000, label: 'Glimmer Shard', desc: '+14000 Glimmer' },
    { id: 'c-tideglass', x: 44, z: 46, kind: 'charm', charm: 'tideglass', label: 'Charm' },
    { id: 'grace1', x: 16, z: 66, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'glimmer2', x: -16, z: 66, kind: 'glimmer', amount: 14800, label: 'Glimmer Shard', desc: '+14800 Glimmer', inside: 'surn' },
    { id: 'glimmer3', x: 12, z: 133, kind: 'glimmer', amount: 15600, label: 'Glimmer Shard', desc: '+15600 Glimmer' },
    { id: 'art-pollen', x: 30, z: 32, kind: 'art', art: 'pollen', label: 'Healing Pollen', desc: 'a Fae Art: pollen from the moon\'s first garden', inside: 'wcrate',
      tip: 'Healing Pollen mends a third of your health over six seconds.\nChange Fae Arts with Y (the d-pad\'s right on a gamepad); their uses return at every Moonwell.' },
  ],
  letters: [
    { id: 'barge', x: 36, z: 46.5, title: 'The Barge-Master\'s Log', text: 'Day nine on the river of light. The Lantern Court sent twelve of us up to see why the moon was waning. The river set us down on silver sand, and the barge broke on it.\n\nThe others went inland to the lighthouse. I stayed with the lamps. I can hear something under the sand, breathing with the tide.' },
    { id: 'oriel1', x: -10.5, z: 106, title: 'Oriel\'s Tide-Table', text: 'High tide of light at the first bell. Low tide at the second.\n\nThe tide has not come in for a year. The Queen took it. Without it the Sea is only a hollow, and the thing under the Sea is hungry.\n\nI keep the lamp lit. If the light will not come to the shore, the shore must go on remembering what it looks like.' },
    { id: 'knight11', x: 3, z: -9.6, title: 'Scratched Into a Lantern Frame', text: '(The lantern Maelis left at the top of the Last Stair has come up the river with you. On its frame, a new line, in her hand:)\n\nIt did not stop at the Queen. It never was the Queen. Go up, and I will follow when I can. — M.' },
    { id: 'shell', x: 12.5, z: 151.5, title: 'A Child\'s Drawing, Pinned to a Door', text: '(A drawing in pale chalk of a very large crab with a crown on, and a very small knight with a lamp. Under it:)\n\nDo not go in the Sea when the tide is out. Gloam is sleeping there and it will eat your light.' },
  ],
  pixies: [
    { id: 'p1', x: 7.5, z: -9.5 },
    { id: 'p2', x: -20, z: 44, y: 1.2 },
    { id: 'p3', x: 44, z: 32, inside: 'wurn' },
    { id: 'p4', x: 16.5, z: 95 },
    { id: 'p5', x: 12, z: 152, inside: 'curn' },
  ],

  gate: { x: 0, z: 126.5, width: 7, guardian: 'oriel', style: 'portcullis', toast: 'The lighthouse gate swings open', banner: 'ORIEL\'S LAMP IS OUT', charm: 'oriellamp' },
  seal: { x: 0, z: 162, yaw: 0, width: 7.6, height: 6.8, inside: [0, 172] },
  exit: { x: 0, z: 202 },

  build(w, R) {
    const g = w.group, M = w.mats;
    const keep = [...this.spawns, ...this.items, ...Object.values(this.shrines), ...this.messages, ...this.letters, ...this.pixies].map(o => ({ x: o.x, z: o.z, r: 2.2 }));

    // Silver dust underfoot, pale moonrock cliffs round every room, and the sea of light beyond.
    w.floor(-80, -40, 90, 250, 'dust', 6, -.02);
    floorRooms(w, ROOMS, CORRS, 'dust', { tile: 5 });
    w.disc(0, 188, 15, 'arena', 4.1);
    raiseRooms(w, ROOMS, CORRS, { edge: 'cliff', h: 7 });

    // Dunes: soft mounds of dust and moonrock, with craters pocking the sand.
    const dune = p => { const d = w.rock(2 + R() * 1.6, Math.floor(R() * 999), .12); d.scale(1.4, .32, 1.1); d.rotateY(R() * 6); d.translate(p.x, -.2, p.z); w.batch('dust', d); };
    const crater = (x, z, r) => { const c = new THREE.TorusGeometry(r, r * .22, 6, 24); c.rotateX(Math.PI / 2); c.scale(1, 1, .35); c.translate(x, .05, z); w.batch('dust', c); };
    for (const rm of [ROOMS[1], ROOMS[3]]) {
      for (const p of scatter(R, rm, 7, keep, { edge: 3, gap: 5 })) dune(p);
      for (const p of scatter(R, rm, 5, keep, { gap: 5 })) { if (R() < .5) crater(p.x, p.z, 1.2 + R()); else w.boulder(p.x, p.z, .6 + R() * .7, Math.floor(R() * 999)); }
    }
    for (const [x, z] of [[-8, -9], [8, 9], [-8, 9]]) w.brazier(x, z, 0xfff0c8);

    // The Wreck of the Lantern Barge: a broken hull on the sand, its lamps still lit.
    const hull = new THREE.MeshStandardMaterial({ color: 0x5a4a38, roughness: .9 });
    for (let i = 0; i < 7; i++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(2.4, .14, 6, 12, Math.PI * .9), hull);
      rib.position.set(33 + i * 1.4, .4, 41); rib.rotation.set(0, Math.PI / 2, Math.PI * .55 + (i % 2) * .1); g.add(rib);
    }
    const keel = boxGeo(10, .4, .6, 1); keel.translate(37, .2, 41); w.batch('wood', keel); w.prop(w.addBox(37, 41, 5, .5, 0, 1));
    for (const [x, z] of [[31, 44], [43, 38]]) w.brazier(x, z, 0xffe0a0, false, .9);
    w.breakable('crate', 30, 32, { id: 'wcrate' }); w.breakable('urn', 44, 32, { id: 'wurn' }); w.breakable('crate', 32, 36);

    // The Shallows of Light: still pools of moonwater in the dust.
    for (const [x, z, r] of [[-8, 80, 2.4], [9, 70, 1.8], [11, 90, 1.6]]) w.moonpool(x, z, r);
    w.breakable('urn', -16, 66, { id: 'surn' }); w.breakable('urn', 16, 94);

    // The Lighthouse Steps: a white stair up to the lighthouse, its lamp dark.
    for (let i = 0; i < 5; i++) { const st = boxGeo(8, .25, 1, 2); st.translate(0, .12 + i * .01, 106 + i * 1.1); w.batch('whitestone', st); }
    const tower = new THREE.CylinderGeometry(2.2, 3, 22, 16); tower.translate(18, 11, 118); w.batch('whitestone', tower);
    const cap = new THREE.ConeGeometry(2.6, 3, 16); cap.translate(18, 23.5, 118); w.batch('whitestone', cap);
    const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: w.glowTex, color: 0xfff0c8, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .15 }));
    lamp.position.set(18, 21, 118); lamp.scale.setScalar(12); g.add(lamp);
    w.anim.push(t => { lamp.material.opacity = w.G?.gatekeeper && !w.G.gatekeeper.alive ? .05 : .15 + Math.sin(t * .6) * .05; });
    for (const x of [-10, 10]) w.pillar(x, 110, .6, 6, x > 0, 'whitestone');

    // The Keeper's Cottage: a low white house, a garden of pale shells.
    const house = boxGeo(7, 4, 6, 2); house.translate(8, 2, 144); w.batch('whitestone', house); w.addBox(8, 144, 3.5, 3, 0, 4);
    const roof = new THREE.ConeGeometry(5.2, 2.6, 4); roof.rotateY(Math.PI / 4); roof.translate(8, 5.3, 144); w.batch('whitestone', roof);
    for (const [x, z] of [[-11, 146], [12.5, 132]]) w.brazier(x, z, 0xfff0c8);
    w.breakable('urn', 12, 152, { id: 'curn' }); w.breakable('crate', -10, 152);

    // The Sea of Tranquility: an arena of pale marble on the dry sea-bed, the light's tide far off.
    for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * Math.PI * 2; w.pillar(Math.sin(a) * 14, 188 + Math.cos(a) * 13, .7, 5 + (i % 3), i % 3 === 0, 'whitestone'); }
    const seaMat = new THREE.MeshBasicMaterial({ color: 0xd8e4ff, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false });
    const tide = new THREE.Mesh(new THREE.PlaneGeometry(420, 160), seaMat); tide.rotation.x = -Math.PI / 2; tide.position.set(0, -1.5, 300); g.add(tide);
    const tide2 = new THREE.Mesh(new THREE.PlaneGeometry(160, 420), seaMat); tide2.rotation.x = -Math.PI / 2; tide2.position.set(-110, -1.5, 100); g.add(tide2);
    w.anim.push(t => { seaMat.opacity = .28 + Math.sin(t * .4) * .08; });

    // Far off: moon-mountains, pale and sharp, and the long dunes of the far shore.
    const peakMat = new THREE.MeshStandardMaterial({ color: 0x8a8e9c, roughness: 1, flatShading: true });
    for (let i = 0; i < 26; i++) { const a = R() * 6.28, r = 150 + R() * 120, h = 30 + R() * 70; const m = new THREE.Mesh(new THREE.ConeGeometry(16 + R() * 24, h, 6), peakMat); m.position.set(Math.sin(a) * r, h / 2 - 8, 100 + Math.cos(a) * r); g.add(m); }
  },
};
