// Mission 10: the Waning Court, the Queen's palace hung in the sky where the moon once rose. North, up:
//   the Last Stair (first Moonwell) → the Hall of Crescents → the Night Gardens (the Observatory off to the
//   east) → the Queen's Vigil (Maelis, the Lost Knight, holds it) → the Antechamber of the Moon (second
//   Moonwell) → Briar Seal → the Throne of the Waning Moon (the Waning Queen).
import * as THREE from 'three';
import { boxGeo } from '../world.js';
import { joinRooms, raiseRooms, roomAreas, floorRooms, scatter } from './rooms.js';

const WHITE = { h: 7, mat: 'whitestone', crenel: false };
const ROOMS = [
  { id: 'stair', name: 'The Last Stair', x0: -10, z0: -12, x1: 10, z1: 12, edge: 'balustrade' },
  { id: 'hall', name: 'The Hall of Crescents', x0: -18, z0: 24, x1: 18, z1: 58, o: { ...WHITE, h: 10 } },
  { id: 'gardens', name: 'The Night Gardens', x0: -20, z0: 66, x1: 20, z1: 100, edge: 'balustrade' },
  { id: 'observatory', name: 'The Observatory', x0: 28, z0: 74, x1: 44, z1: 90, edge: 'balustrade' },
  { id: 'vigil', name: 'The Queen\'s Vigil', x0: -12, z0: 106, x1: 12, z1: 126, o: WHITE },
  { id: 'ante', name: 'The Antechamber of the Moon', x0: -14, z0: 132, x1: 14, z1: 158, o: WHITE },
  { id: 'throne', name: 'The Throne of the Waning Moon', x0: -20, z0: 170, x1: 20, z1: 210, edge: 'balustrade' },
];
const PASSES = [
  { a: 'stair', b: 'hall', at: 0, w: 6, edge: 'balustrade' },
  { a: 'hall', b: 'gardens', at: 0, w: 6, edge: 'balustrade' },
  { a: 'gardens', b: 'observatory', at: 82, w: 5, edge: 'balustrade' },
  { a: 'gardens', b: 'vigil', at: 0, w: 6, edge: 'balustrade' },
  { a: 'vigil', b: 'ante', at: 0, w: 7, o: WHITE },
  { a: 'ante', b: 'throne', at: 0, w: 7.6, o: WHITE },
];
const CORRS = joinRooms(ROOMS, PASSES);

export default {
  id: 'court',
  name: 'The Waning Court',
  blurb: 'The palace of the Waning Queen, hung in the sky where the moon once rose. Everything the moon has lost is here, and she will not give it back.',
  level: 108,
  map: { x: 74, z: -4 },
  seed: 10108,
  spire: true,
  tier: 4.4,
  leaves: true,
  leafColors: [0xeef2ff, 0xd8e0ff, 0xc8b8ff],
  fog: { color: 0x10142a, byArea: { stair: .01, hall: .012, gardens: .01, observatory: .01, vigil: .013, ante: .014, throne: .007 }, base: .011 },
  light: { sky: 0xb8c4ff, ground: 0x24243e, hemi: 1.65, moonColor: 0xeef2ff, moon: 2.4 },
  moon: { at: [0, 60, 380], glow: 380, size: 52 },
  enemyGlow: .16,
  intro: 'The Waning Queen\'s court hangs in the sky where the moon once rose.\nClimb to her throne, and give the moon back to everyone.',
  endingTitle: 'THE MOON RETURNS',
  ending: 'The Waning Queen falls, and every thread of moonlight she hoarded unspools from her at once. It pours up out of the court in a white river, and the moon, which has only waned for a year, begins at last to wax.\nMaelis wakes on the stair with her own eyes back, and asks for her lantern. The Lantern Court will have to learn to keep its lights without a queen.\nThe paths are still. Walk them again, and every foe will remember you.',
  outro: 'The Waning Queen falls, and the moon begins to wax.',
  exitToast: 'The moon waxes. A Pixie Gate opens at the throne',
  motes: { base: 0xeef2ff, gardens: 0xd8e0ff, throne: 0xffffff },
  titleShrine: 'stair',
  areas: roomAreas(ROOMS),

  shrines: {
    stair: { id: 'stair', name: 'Moonwell of the Last Stair', x: -4, z: -4, spawn: [-1.8, -2.2], yaw: 0 },
    ante: { id: 'ante', name: 'Moonwell of the Antechamber', x: -9, z: 137, spawn: [-7, 139], yaw: .5 },
  },

  spawns: [
    { id: 's1', type: 'waning-knight', x: 4, z: 7, yaw: Math.PI },
    // The Hall of Crescents
    { id: 'h1', type: 'waning-knight', x: -6, z: 36, yaw: Math.PI },
    { id: 'h2', type: 'waning-lancer', x: 7, z: 48, yaw: Math.PI },
    { id: 'h3', type: 'goblin-moonbow', x: -14, z: 54, yaw: 2.6 },
    { id: 'h4', type: 'goblin-moonbow', x: 14, z: 54, yaw: -2.6 },
    { id: 'h5', type: 'ratman-waneling', x: 12, z: 28, yaw: -2.2, idle: 'sleep' },
    { id: 'h6', type: 'star-shade', x: 0, z: 52, yaw: Math.PI },
    // The Night Gardens
    { id: 'n1', type: 'waning-lancer', x: -8, z: 76, yaw: Math.PI },
    { id: 'n2', type: 'waning-knight', x: 8, z: 88, yaw: Math.PI, patrol: [[8, 88], [14, 72], [-14, 72], [-8, 92]] },
    { id: 'n3', type: 'ratman-waneling', x: -16, z: 94, yaw: 2.4 },
    { id: 'n4', type: 'goblin-moonbow', x: 16, z: 96, yaw: -2.6 },
    { id: 'n5', type: 'thorn-reaver', x: 0, z: 94, yaw: Math.PI, idle: 'sleep' },
    // The Observatory
    { id: 'o1', type: 'waning-knight', x: 36, z: 84, yaw: -1.6 },
    { id: 'o2', type: 'goblin-starcaller', x: 40, z: 77, yaw: -1.2 },
    // The Queen's Vigil
    { id: 'maelis', type: 'maelis', x: 0, z: 118, yaw: Math.PI, elite: 'warden' },
    // The Antechamber of the Moon
    { id: 'a1', type: 'waning-knight', x: 5, z: 150, yaw: Math.PI },
    { id: 'a2', type: 'waning-lancer', x: -5, z: 152, yaw: Math.PI },
    { id: 'a3', type: 'star-shade', x: 10, z: 137, yaw: -2.2 },
    { id: 'a4', type: 'goblin-moonbow', x: -12, z: 154, yaw: 2.6 },
    { id: 'a5', type: 'ratman-waneling', x: 12, z: 155, yaw: -2.6, idle: 'sleep' },
    // The Throne of the Waning Moon
    { id: 'boss', type: 'queen', x: 0, z: 192, yaw: Math.PI, elite: 'boss' },
  ],
  adds: [
    { id: 'add1', type: 'star-shade', x: -10, z: 194, yaw: Math.PI, add: true },
    { id: 'add2', type: 'star-shade', x: 10, z: 194, yaw: Math.PI, add: true },
  ],
  boss: 'boss',
  bossCharm: 'waningcrown',
  phase2Line: 'The Waning Queen darkens the moon',

  messages: [
    { x: 2, z: -6, text: 'The Queen\'s knights fight as the Lantern Court taught them: as you do. Watch their chains, and strike when they end.' },
    { x: -2, z: 26, text: 'Moonbows loose from the galleries. Close on them, or keep a pillar between you.' },
    { x: 2, z: 68, text: 'The gardens hang over nothing. Mind the balustrades, and what waits behind the hedges.' },
    { x: 2, z: 107.5, text: 'Maelis holds the Vigil. She drops her guard after the fourth cut of a chain.' },
    { x: 2, z: 160, text: 'Beyond the briars, the Queen who would keep the moon.' },
  ],

  items: [
    { id: 'glimmer1', x: 15.5, z: 26, kind: 'glimmer', amount: 12000, label: 'Glimmer Shard', desc: '+12000 Glimmer' },
    { id: 'c-moonmote', x: 42, z: 88, kind: 'charm', charm: 'moonmote', label: 'Charm' },
    { id: 'grace1', x: -17, z: 68, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'glimmer2', x: 17, z: 68, kind: 'glimmer', amount: 12800, label: 'Glimmer Shard', desc: '+12800 Glimmer', inside: 'gurn' },
    { id: 'glimmer3', x: 12, z: 134, kind: 'glimmer', amount: 13600, label: 'Glimmer Shard', desc: '+13600 Glimmer' },
    { id: 'glimmer4', x: 30, z: 88, kind: 'glimmer', amount: 12400, label: 'Glimmer Shard', desc: '+12400 Glimmer', inside: 'ourn' },
  ],
  letters: [
    { id: 'herald', x: -15.5, z: 26.5, title: 'A Herald\'s Proclamation', text: 'Hear the Queen: the moon is ending, as all lights end. She will not let it.\n\nEvery thread of moonlight shall be gathered to the Court and kept, and the moon shall never set again, for it shall live in her.\n\nThat the fae go dark in the gathering is regretted.' },
    { id: 'observatory', x: 40, z: 76.5, title: 'The Court Astronomer\'s Note', text: 'I have checked it nine times. The moon is not dying. It is waning, as it always has, and it would wax again in a fortnight if she would only let the light go.\n\nShe will not listen. She has watched too many lights go out to believe any of them come back.' },
    { id: 'queen3', x: 12.4, z: 155.5, title: 'In the Queen\'s Own Hand', text: 'Maelis asked me, before I took her, why I sent the knights out if I meant to keep the moon myself.\n\nI told her the truth. I sent them to find it. I did not know, then, that I would be the one who had taken it.\n\nWhen the one I sent last reaches me, I will ask them to let me keep it. They will say no. They always did.\n\n— W., once the Lantern Queen' },
    { id: 'maelis10', x: 3, z: -9.6, title: 'A Lantern, Left Lit', text: '(A small lantern stands on the top step of the stair, still burning. Scratched into its base:)\n\nFor whoever comes after. Take the light up with you. — the other knight' },
  ],
  pixies: [
    { id: 'p1', x: 7.5, z: -9.5 },
    { id: 'p2', x: -15.5, z: 44, y: 1.2 },
    { id: 'p3', x: 36, z: 76, inside: 'ourn2' },
    { id: 'p4', x: 17.5, z: 97 },
    { id: 'p5', x: -12, z: 156, inside: 'aurn' },
  ],

  gate: { x: 0, z: 128.5, width: 7, guardian: 'maelis', style: 'portcullis', toast: 'The Vigil\'s gate rises', banner: 'MAELIS RELEASED', charm: 'maelislantern' },
  seal: { x: 0, z: 164, yaw: 0, width: 7.6, height: 6.8, inside: [0, 174] },
  exit: { x: 0, z: 204 },

  build(w, R) {
    const g = w.group, M = w.mats;
    const keep = [...this.spawns, ...this.items, ...Object.values(this.shrines), ...this.messages, ...this.letters, ...this.pixies].map(o => ({ x: o.x, z: o.z, r: 2.2 }));

    // Floors of pale marble on slabs of stone, hung over a sea of cloud.
    floorRooms(w, ROOMS, CORRS, 'marble', { tile: 4, slab: 'stone' });
    w.disc(0, 190, 15, 'arena', 4.1);
    raiseRooms(w, ROOMS, CORRS, { edge: 'wall', ...WHITE });

    // The Last Stair: steps rising from the clouds, and a lantern left lit.
    for (let i = 0; i < 8; i++) { const st = boxGeo(7, .3, 1.2, 2); st.translate(0, -.15 - i * .35, -12.6 - i * 1.2); w.batch('whitestone', st); }
    w.arch(0, 11.6, 0, 5.4, 4.8);
    const lan = new THREE.Sprite(new THREE.SpriteMaterial({ map: w.glowTex, color: 0xffe0a0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); lan.position.set(3, .5, -9.6); lan.scale.setScalar(1.2); g.add(lan);
    for (const [x, z] of [[-8, -9], [8, 9], [-8, 9]]) w.brazier(x, z, 0xc9d8ff);

    // The Hall of Crescents: pillars under hanging crescents of silver.
    for (let z = 30; z <= 52; z += 5.5) for (const x of [-11, 11]) w.pillar(x, z, .7, 10, false, 'whitestone');
    const silver = new THREE.MeshStandardMaterial({ color: 0xe8ecf8, metalness: .9, roughness: .2, emissive: 0x3a4468 });
    const crescents = [];
    for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(1.4, .12, 8, 32, Math.PI * 1.3), silver); c.position.set(0, 7.5, 30 + i * 5.5); c.rotation.z = Math.PI * .85; g.add(c); crescents.push(c); }
    w.anim.push(t => crescents.forEach((c, i) => { c.rotation.y = t * .3 + i; }));
    for (const [x, z] of [[-16, 26], [16, 56], [-16, 56]]) w.brazier(x, z, 0xc9d8ff);

    // The Night Gardens: moonpools, pale trees in silver bloom, arches.
    const paleTree = (x, z, h, seed) => {
      w.deadTree(x, z, h, seed, true, 'palebark');
      for (let i = 0; i < 4; i++) { const c = w.rock(h * (.18 + R() * .08), seed * 5 + i, .25); c.scale(1, .7, 1); c.translate(x + (R() - .5) * h * .5, h * (.8 + R() * .3), z + (R() - .5) * h * .5); w.batch('whitestone', c); }
    };
    for (const [x, z, r] of [[-10, 84, 2.2], [10, 76, 1.8]]) w.moonpool(x, z, r);
    for (const p of scatter(R, ROOMS[2], 6, keep.concat([{ x: -10, z: 84, r: 4 }, { x: 10, z: 76, r: 3.6 }]), { edge: 3, gap: 4 })) paleTree(p.x, p.z, 4.5 + R() * 2, Math.floor(R() * 99));
    w.arch(0, 99.4, 0, 5.4, 5);
    w.breakable('urn', 17, 68, { id: 'gurn' }); w.breakable('urn', -18, 98);

    // The Observatory: an orrery turning over the clouds.
    const orrery = new THREE.Group(); orrery.position.set(36, 3.2, 82); g.add(orrery);
    const brass = new THREE.MeshStandardMaterial({ color: 0xd8b86a, metalness: .9, roughness: .3, emissive: 0x3a2a08 });
    const rings = [2, 1.5, 1.1].map((r, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, .05, 6, 48), brass); m.rotation.x = i * .9; orrery.add(m); return m; });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(.35, 16, 10), new THREE.MeshBasicMaterial({ color: 0xeef2ff })); orrery.add(orb);
    w.anim.push(t => rings.forEach((m, i) => { m.rotation.y = t * (.3 + i * .25); m.rotation.z = t * (.2 - i * .1); }));
    const stand = new THREE.CylinderGeometry(.1, .4, 2.4, 8); stand.translate(36, 1.2, 82); w.batch('whitestone', stand); w.prop(w.addCyl(36, 82, .5, 2.4));
    w.breakable('urn', 30, 88, { id: 'ourn' }); w.breakable('urn', 36, 76, { id: 'ourn2' });

    // The Queen's Vigil and the Antechamber: white halls, banners of the Waning moon.
    for (const x of [-10, 10]) { w.pillar(x, 108, .7, 7, false, 'whitestone'); w.banner(x * 1.14, 118, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0x2a2a5a); }
    for (let z = 138; z <= 152; z += 7) for (const x of [-4, 4]) w.pillar(x, z, .6, 7, false, 'whitestone');
    for (const [x, z] of [[-12.5, 146], [12.5, 151]]) w.brazier(x, z, 0xc9d8ff);
    w.breakable('urn', -12, 156, { id: 'aurn' }); w.breakable('urn', 12.5, 146);

    // The Throne of the Waning Moon: an open dais under the moon itself.
    const dais = new THREE.CylinderGeometry(3, 3.4, .6, 24); dais.translate(0, .3, 207); w.batch('whitestone', dais);
    const th = boxGeo(2.6, 4.6, 1.8, 2); th.translate(0, 2.9, 208); w.batch('whitestone', th);
    for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * Math.PI * 2; w.pillar(Math.sin(a) * 14, 190 + Math.cos(a) * 13, .75, 8, i % 3 === 0, 'whitestone'); }
    for (let i = 0; i < 6; i++) { const a = (i + .5) / 6 * Math.PI * 2; w.brazier(Math.sin(a) * 17, 190 + Math.cos(a) * 17, 0xeef2ff); }

    // Below: cloud; far off, the peaks of the isles.
    const cloudMat = new THREE.SpriteMaterial({ map: w.glowTex, color: 0x8a98c8, transparent: true, opacity: .32, depthWrite: false, fog: false });
    for (let i = 0; i < 90; i++) { const c = new THREE.Sprite(cloudMat), a = R() * 6.28, r = 20 + R() * 160; c.position.set(Math.sin(a) * r, -10 - R() * 22, 100 + Math.cos(a) * r * 1.3); c.scale.set(40 + R() * 50, 14 + R() * 12, 1); g.add(c); }
    const peakMat = new THREE.MeshStandardMaterial({ color: 0x2a3050, roughness: 1, flatShading: true });
    for (let i = 0; i < 24; i++) { const a = R() * 6.28, r = 120 + R() * 140, h = 60 + R() * 90; const m = new THREE.Mesh(new THREE.ConeGeometry(18 + R() * 26, h, 6), peakMat); m.position.set(Math.sin(a) * r, -70 + h / 2 - R() * 30, 100 + Math.cos(a) * r); g.add(m); }
  },
};
