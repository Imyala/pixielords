// Mission 14: the Umbral Sea, on the moon's dark side, which never sees the fae world: a sea of black glass
// under nothing but stars, where the Eclipse's shadow pools and its hound runs. North, into the dark: the
// Terminator (first Moonwell, on the line between light and dark) → the Black Glass Flats (the Well of Stars off
// to the west) → the Shadow Reefs → Vesper's Watch (Vesper, the Watcher in the Dark) → the Last Strand (second
// Moonwell) → Briar Seal → the Hound's Maw (Nightmaw, Hound of the Eclipse).
import * as THREE from 'three';
import { joinRooms, raiseRooms, roomAreas, floorRooms, scatter } from './rooms.js';

const ROOMS = [
  { id: 'terminator', name: 'The Terminator', x0: -10, z0: -12, x1: 10, z1: 12 },
  { id: 'flats', name: 'The Black Glass Flats', x0: -22, z0: 20, x1: 20, z1: 56 },
  { id: 'starwell', name: 'The Well of Stars', x0: -42, z0: 28, x1: -30, z1: 46 },
  { id: 'reefs', name: 'The Shadow Reefs', x0: -16, z0: 62, x1: 18, z1: 96 },
  { id: 'watch', name: 'Vesper\'s Watch', x0: -12, z0: 104, x1: 12, z1: 124 },
  { id: 'strand', name: 'The Last Strand', x0: -12, z0: 130, x1: 14, z1: 154 },
  { id: 'maw', name: 'The Hound\'s Maw', x0: -20, z0: 166, x1: 20, z1: 206 },
];
const PASSES = [
  { a: 'terminator', b: 'flats', at: 0, w: 8 },
  { a: 'starwell', b: 'flats', at: 37, w: 6 },
  { a: 'flats', b: 'reefs', at: 2, w: 8 },
  { a: 'reefs', b: 'watch', at: 0, w: 7 },
  { a: 'watch', b: 'strand', at: 0, w: 7 },
  { a: 'strand', b: 'maw', at: 0, w: 7.6 },
];
const CORRS = joinRooms(ROOMS, PASSES);

export default {
  id: 'umbra',
  name: 'The Umbral Sea',
  blurb: 'The moon\'s dark side, which never sees the fae world: a sea of black glass under nothing but stars. The Eclipse\'s shadow pools here, and its hound runs the glass.',
  level: 106,
  gatekeeper: { hp: 1, dmg: 3.6 },   // scaled to keep pace with the knight (balance pass)
  warlord: { hp: 1.25, dmg: 2.7 },
  map: { x: 180, z: 22 },
  seed: 14114,
  frost: true, spire: true, moon: true, moonRock: 0x3a3450, moonRockGlow: 0x06040c,
  tier: 6,
  fog: { color: 0x06050c, byArea: { terminator: .01, flats: .012, starwell: .016, reefs: .014, watch: .014, strand: .016, maw: .01 }, base: .013 },
  light: { sky: 0x9a8ad8, ground: 0x141020, hemi: 1.5, moonColor: 0xc8b0ff, moon: 1.8 },
  moon: { at: [0, 70, 380], glow: 240, size: 26, color: 0x020104, glowColor: 0xffb850 },
  aurora: { a: 0x6a4aff, b: 0xffb040 },
  enemyGlow: .22,
  intro: 'On the moon\'s dark side the fae world never rises. There is only the black glass, the stars,\nand low on the horizon, a dark sun ringed in fire: the Eclipse, waking.',
  outro: 'Nightmaw falls on the black glass, and the dark that ran in it runs out of it, down a shaft in the Maw that goes to the moon\'s heart. The Eclipse is there. The way down opens.',
  exitToast: 'The hound is still. A Pixie Gate opens in the Maw',
  motes: { base: 0xb08aff, starwell: 0xeef2ff, maw: 0xffc860 },
  titleShrine: 'terminator',
  areas: roomAreas(ROOMS),
  rooms: ROOMS, corrs: CORRS,   // for the shortcut (shortcuts.js), laid in before the level is built

  shrines: {
    terminator: { id: 'terminator', name: 'Moonwell of the Terminator', x: -4, z: -4, spawn: [-1.8, -2.2], yaw: 0 },
    strand: { id: 'strand', name: 'Moonwell of the Last Strand', x: -8, z: 135, spawn: [-6, 137], yaw: .5 },
  },

  spawns: [
    { id: 't1', type: 'ratman-voidfang', x: 5, z: 8, yaw: Math.PI, idle: 'sleep' },
    // The Black Glass Flats
    { id: 'f1', type: 'umbral-knight', x: -8, z: 30, yaw: Math.PI },
    { id: 'f2', type: 'ratman-voidfang', x: 10, z: 28, yaw: -2.4 },
    { id: 'f3', type: 'goblin-nightbrute', x: 2, z: 46, yaw: Math.PI, patrol: [[2, 46], [14, 50], [-14, 50]] },
    { id: 'f4', type: 'goblin-voidcaller', x: -16, z: 52, yaw: 2.4 },
    { id: 'f5', type: 'star-shade', x: 16, z: 52, yaw: -2.4 },
    // The Well of Stars
    { id: 'e1', type: 'umbral-knight', x: -36, z: 40, yaw: 1.6 },
    { id: 'e2', type: 'goblin-voidcaller', x: -38, z: 31, yaw: 1.2 },
    // The Shadow Reefs
    { id: 'r1', type: 'umbral-knight', x: 6, z: 70, yaw: Math.PI },
    { id: 'r2', type: 'goblin-nightbrute', x: -8, z: 80, yaw: 2.4 },
    { id: 'r3', type: 'ratman-voidfang', x: 10, z: 88, yaw: -2.6 },
    { id: 'r4', type: 'goblin-voidcaller', x: -12, z: 94, yaw: 2.6 },
    { id: 'r5', type: 'star-shade', x: 14, z: 94, yaw: -2.6, idle: 'sleep' },
    // Vesper's Watch
    { id: 'vesper', type: 'vesper', x: 0, z: 116, yaw: Math.PI, elite: 'warden' },
    // The Last Strand
    { id: 's1', type: 'umbral-knight', x: 5, z: 148, yaw: Math.PI },
    { id: 's2', type: 'goblin-nightbrute', x: -8, z: 151, yaw: 2.6 },
    { id: 's3', type: 'goblin-voidcaller', x: 11, z: 152, yaw: -2.6 },
    { id: 's4', type: 'ratman-voidfang', x: 10, z: 136, yaw: -2.2, idle: 'sleep' },
    // The Hound's Maw
    { id: 'boss', type: 'nightmaw', x: 0, z: 190, yaw: Math.PI, elite: 'boss' },
  ],
  adds: [
    { id: 'add1', type: 'ratman-voidfang', x: -11, z: 194, yaw: Math.PI, add: true },
    { id: 'add2', type: 'ratman-voidfang', x: 11, z: 194, yaw: Math.PI, add: true },
  ],
  boss: 'boss',
  bossCharm: 'houndfang',
  phase2Line: 'The Eclipse calls its hound',

  messages: [
    { x: 2, z: -6, text: 'No world rises on this side of the moon. Keep to the lit glass, and watch the dark.' },
    { x: -2, z: 22, text: 'Voidfangs strike from where the shadow is deepest. Night-Brutes do not bother to hide.' },
    { x: 2, z: 64, text: 'Voidcallers throw the dark in lines. Step across them, not along them.' },
    { x: 2, z: 105.5, text: 'Vesper\'s fists never stop. Deflect the barrage; the last blow is the heaviest.' },
    { x: 2, z: 158, text: 'Beyond the briars, the Eclipse\'s hound, that brings it whatever light it finds.' },
  ],

  items: [
    { id: 'glimmer1', x: 18, z: 22, kind: 'glimmer', amount: 20000, label: 'Glimmer Shard', desc: '+20000 Glimmer' },
    { id: 'c-starlessring', x: -40, z: 44, kind: 'charm', charm: 'starlessring', label: 'Charm' },
    { id: 'grace1', x: -14, z: 64, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'glimmer2', x: 16, z: 64, kind: 'glimmer', amount: 20800, label: 'Glimmer Shard', desc: '+20800 Glimmer', inside: 'rcrys' },
    { id: 'glimmer3', x: 12, z: 132, kind: 'glimmer', amount: 21600, label: 'Glimmer Shard', desc: '+21600 Glimmer' },
    { id: 'glimmer4', x: -32, z: 30, kind: 'glimmer', amount: 20400, label: 'Glimmer Shard', desc: '+20400 Glimmer', inside: 'scrys' },
  ],
  letters: [
    { id: 'terminator', x: -8.5, z: 11, title: 'A Surveyor\'s Stake', text: '(A white stake driven into the glass, with a brass plate:)\n\nHERE THE LIGHT ENDS. Beyond this line the fae world never rises and the moon keeps its other face.\n\n(Scratched under it:) Something is keeping it, all right.' },
    { id: 'vesper', x: 10.5, z: 106, title: 'Vesper\'s Watch-Book', text: 'Night 1: I will watch the dark side for Selene, and tell her if the chain slips.\nNight 300: The chain has not slipped. The dark is looking back at me.\nNight 1000: I have stopped telling Selene. I think I am telling it.' },
    { id: 'hound', x: -11, z: 151.5, title: 'Tracks in the Glass', text: '(A line of great paw-prints melted into the black glass, going down into the Maw. Beside them, a smaller line of a knight\'s boots, going the same way, and not coming back.)' },
    { id: 'knight14', x: 3, z: -9.6, title: 'A Fourth Lantern', text: '(A lantern at the Moonwell, lit. Its base:)\n\nI went down after the hound. If you find the Eclipse before me, do not let it put your light out. Do not let it make you keep it, either. — M.' },
  ],
  pixies: [
    { id: 'p1', x: 7.5, z: -9.5 },
    { id: 'p2', x: 18.5, z: 40, y: 1.2 },
    { id: 'p3', x: -40, z: 30, inside: 'scrys2' },
    { id: 'p4', x: -14.5, z: 86 },
    { id: 'p5', x: 12, z: 152, inside: 'tcrys' },
  ],

  gate: { x: 0, z: 126.5, width: 7, guardian: 'vesper', style: 'ice', toast: 'The wall of black glass shatters', banner: 'VESPER CLOSES HER EYES', charm: 'vespereye' },
  seal: { x: 0, z: 162, yaw: 0, width: 7.6, height: 6.8, inside: [0, 172] },
  exit: { x: 0, z: 202 },

  build(w, R) {
    const g = w.group, M = w.mats;
    // Here the ice runs violet-black, like the glass it grows from.
    M.ice.color.setHex(0x6a5aa8); M.ice.emissive.setHex(0x2a1a5a);
    const keep = [...this.spawns, ...this.items, ...Object.values(this.shrines), ...this.messages, ...this.letters, ...this.pixies].map(o => ({ x: o.x, z: o.z, r: 2.2 }));

    // Black glass underfoot, dark moonrock cliffs, and glowing seams where the glass has cracked.
    w.floor(-80, -40, 90, 250, 'blackglass', 6, -.02);
    floorRooms(w, ROOMS, CORRS, 'blackglass', { tile: 5 });
    w.floor(-10.6, -12.6, 10.6, 12.6, 'dust', 5, .01);   // the last of the light, on the Terminator
    w.disc(0, 188, 15, 'arena', 4.1);
    raiseRooms(w, ROOMS, CORRS, { edge: 'cliff', h: 8 });
    const seam = new THREE.MeshBasicMaterial({ color: 0x8a5aff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 80; i++) {
      const rm = ROOMS[1 + Math.floor(R() * (ROOMS.length - 1))], x = rm.x0 + R() * (rm.x1 - rm.x0), z = rm.z0 + R() * (rm.z1 - rm.z0);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(.1, 1.5 + R() * 3.5), seam); m.rotation.x = -Math.PI / 2; m.rotation.z = R() * 6; m.position.set(x, .02, z); g.add(m);
    }
    w.anim.push(t => { seam.opacity = .38 + Math.sin(t * .8) * .12; });
    for (const [x, z] of [[-8, -9], [8, 9]]) w.brazier(x, z, 0xfff0c8);

    // The Flats and the Reefs: glass shards standing up out of the sea, and reefs of violet ice.
    const cols = [0x8a5aff, 0xb08aff, 0x5a4aa8];
    for (const rm of [ROOMS[1], ROOMS[3]]) {
      for (const p of scatter(R, rm, Math.round((rm.x1 - rm.x0) * (rm.z1 - rm.z0) / 120), keep, { edge: 3, gap: 3.4 })) {
        if (R() < .5) w.crystal(p.x, p.z, 1.8 + R() * 2.6, cols[Math.floor(R() * 3)], Math.floor(R() * 999), R() < .35);
        else { const sh = new THREE.ConeGeometry(.6 + R() * .6, 3 + R() * 3, 4); sh.rotateZ((R() - .5) * .6); sh.translate(p.x, 1.4, p.z); w.batch('blackglass', sh); w.prop(w.addCyl(p.x, p.z, .7, 3)); }
      }
    }
    w.breakable('crystal', 16, 64, { id: 'rcrys' }); w.breakable('crystal', -32, 30, { id: 'scrys' }); w.breakable('crystal', -40, 30, { id: 'scrys2' }); w.breakable('crystal', 12, 152, { id: 'tcrys' });
    w.breakable('crystal', -20, 52); w.breakable('crystal', 18, 90);

    // The Well of Stars: a round pool that shows the sky on the other side of the moon.
    const well = new THREE.Mesh(new THREE.CircleGeometry(3.4, 40), new THREE.MeshBasicMaterial({ map: w.starTex, color: 0x9ab8ff, transparent: true, opacity: .9 }));
    well.rotation.x = -Math.PI / 2; well.position.set(-36, .05, 37); g.add(well); w.prop(w.addCyl(-36, 37, 3.5, .4));
    const rim = new THREE.TorusGeometry(3.5, .2, 6, 40); rim.rotateX(Math.PI / 2); rim.translate(-36, .1, 37); w.batch('whitestone', rim);

    // Vesper's Watch: a tall watch-post of white stone, dark at the top.
    const post = new THREE.CylinderGeometry(1.3, 1.8, 12, 10); post.translate(-8, 6, 120); w.batch('whitestone', post); w.addCyl(-8, 120, 1.8, 12);
    for (const x of [-10, 10]) w.pillar(x, 108, .6, 6, x < 0, 'whitestone');

    // The Last Strand: a thin beach of silver dust on the black, and the last lamps.
    for (const [x, z] of [[-11, 146], [12.5, 140]]) w.brazier(x, z, 0xfff0c8);
    const strip = new THREE.PlaneGeometry(5, 22); strip.rotateX(-Math.PI / 2); strip.translate(0, .015, 142); w.batch('dust', strip);
    w.breakable('urn', -10, 152);

    // The Hound's Maw: a ring of glass fangs, and the shaft down to the heart at its far end.
    for (let i = 0; i < 12; i++) { const a = (i + .5) / 12 * Math.PI * 2, x = Math.sin(a) * 15.5, z = 188 + Math.cos(a) * 14.5; const f = new THREE.ConeGeometry(.9, 5 + (i % 3) * 1.4, 4); f.rotateZ(-Math.sin(a) * .3); f.rotateX(Math.cos(a) * .3); f.translate(x, 2.4, z); w.batch('blackglass', f); w.prop(w.addCyl(x, z, .9, 5)); }
    const shaft = new THREE.Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshBasicMaterial({ color: 0x000000 })); shaft.rotation.x = -Math.PI / 2; shaft.position.set(0, .03, 203); g.add(shaft);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: w.glowTex, color: 0xffb850, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .35 })); glow.position.set(0, 1, 203); glow.scale.setScalar(8); g.add(glow);
    for (let i = 0; i < 5; i++) { const a = (i + .5) / 5 * Math.PI * 2; w.brazier(Math.sin(a) * 18, 188 + Math.cos(a) * 17, 0xb08aff); }

    // Far off: black peaks against the stars.
    const peakMat = new THREE.MeshStandardMaterial({ color: 0x14101e, roughness: .3, metalness: .5, flatShading: true });
    for (let i = 0; i < 28; i++) { const a = R() * 6.28, r = 140 + R() * 120, h = 30 + R() * 80; const m = new THREE.Mesh(new THREE.ConeGeometry(12 + R() * 20, h, 5), peakMat); m.position.set(Math.sin(a) * r, h / 2 - 8, 100 + Math.cos(a) * r); g.add(m); }
  },
};
