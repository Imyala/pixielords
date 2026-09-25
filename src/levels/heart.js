// Mission 15: the Heart of the Moon, the hollow at the moon's core where the first fae chained the Eclipse with
// their own light. North, down and in: the Long Fall (first Moonwell) → the Veins of Light (the First Orrery
// off to the east) → the Hall of Chains → the Lantern's Threshold (Selene, the First Lantern, holds it) → the
// Heart's Antechamber (second Moonwell) → Briar Seal → the Heart of the Moon (the Eclipse, That Eats the Moon).
import * as THREE from 'three';
import { joinRooms, raiseRooms, roomAreas, floorRooms, scatter } from './rooms.js';

const WHITE = { h: 9, mat: 'whitestone', crenel: false };
const ROOMS = [
  { id: 'fall', name: 'The Long Fall', x0: -10, z0: -12, x1: 10, z1: 12 },
  { id: 'veins', name: 'The Veins of Light', x0: -20, z0: 20, x1: 20, z1: 54 },
  { id: 'orrery', name: 'The First Orrery', x0: 28, z0: 28, x1: 44, z1: 44, o: WHITE, edge: 'wall' },
  { id: 'chains', name: 'The Hall of Chains', x0: -18, z0: 62, x1: 18, z1: 98, o: WHITE, edge: 'wall' },
  { id: 'threshold', name: 'The Lantern\'s Threshold', x0: -12, z0: 106, x1: 12, z1: 126, o: WHITE, edge: 'wall' },
  { id: 'ante', name: 'The Heart\'s Antechamber', x0: -14, z0: 132, x1: 14, z1: 156, o: WHITE, edge: 'wall' },
  { id: 'heart', name: 'The Heart of the Moon', x0: -22, z0: 168, x1: 22, z1: 212 },
];
const PASSES = [
  { a: 'fall', b: 'veins', at: 0, w: 7 },
  { a: 'veins', b: 'orrery', at: 36, w: 6 },
  { a: 'veins', b: 'chains', at: 0, w: 7 },
  { a: 'chains', b: 'threshold', at: 0, w: 7, o: WHITE, edge: 'wall' },
  { a: 'threshold', b: 'ante', at: 0, w: 7, o: WHITE, edge: 'wall' },
  { a: 'ante', b: 'heart', at: 0, w: 7.6, o: WHITE, edge: 'wall' },
];
const CORRS = joinRooms(ROOMS, PASSES);

export default {
  id: 'heart',
  name: 'The Heart of the Moon',
  blurb: 'The hollow at the moon\'s core, where the first fae chained the dark with their own light. The chain is slipping, and the Eclipse is waking.',
  level: 114,
  gatekeeper: { hp: 1, dmg: 3.9 },   // scaled to keep pace with the knight (balance pass)
  warlord: { hp: 1.3, dmg: 3.2 },
  map: { x: 160, z: 24 },
  seed: 15115,
  cave: true, spire: true, moon: true, moonRock: 0x5a5470, moonRockGlow: 0x100c14,
  tier: 6.4,
  fog: { color: 0x0a0810, byArea: { fall: .014, veins: .016, orrery: .016, chains: .014, threshold: .014, ante: .016, heart: .01 }, base: .014 },
  light: { sky: 0xd8c8a8, ground: 0x140e10, hemi: 1.4, moonColor: 0xffd890, moon: 1.8 },
  enemyGlow: .22,
  intro: 'At the moon\'s heart, the first fae chained the dark that eats the moon, with their own light.\nThe chain is slipping. Go in, and put it back.',
  endingTitle: 'THE MOON IS WHOLE',
  ending: 'The Eclipse breaks on its own scythe, and falls back into the dark it came from, and the chain of first light closes over it again, bright as the day it was forged.\nSelene takes up the chain in her hands, and this time Maelis stands beside her, with her lantern lit. They will keep it together, they say, and take turns sleeping.\nAbove, the moon is full for the first time in a year, and the fae world is lit from end to end. Walk the paths again, and every foe will remember you.',
  outro: 'The Eclipse falls back into the dark, and the moon is whole.',
  exitToast: 'The moon is whole. A Pixie Gate opens in its heart',
  motes: { base: 0xffe0a0, veins: 0xfff0c8, chains: 0xeef2ff, heart: 0xffc860 },
  titleShrine: 'fall',
  areas: roomAreas(ROOMS),

  shrines: {
    fall: { id: 'fall', name: 'Moonwell of the Long Fall', x: -4, z: -4, spawn: [-1.8, -2.2], yaw: 0 },
    ante: { id: 'ante', name: 'Moonwell of the Heart', x: -9, z: 137, spawn: [-7, 139], yaw: .5 },
  },

  spawns: [
    { id: 'f1', type: 'eclipse-knight', x: 4, z: 7, yaw: Math.PI },
    // The Veins of Light
    { id: 'v1', type: 'eclipse-lancer', x: -6, z: 30, yaw: Math.PI },
    { id: 'v2', type: 'ratman-voidfang', x: 10, z: 28, yaw: -2.4, idle: 'sleep' },
    { id: 'v3', type: 'goblin-voidcaller', x: -14, z: 50, yaw: 2.4 },
    { id: 'v4', type: 'eclipse-knight', x: 12, z: 46, yaw: -2.4, patrol: [[12, 46], [-6, 48], [-12, 40]] },
    { id: 'v5', type: 'goblin-nightbrute', x: 0, z: 50, yaw: Math.PI },
    // The First Orrery
    { id: 'o1', type: 'hollow-guard', x: 36, z: 40, yaw: -1.6 },
    { id: 'o2', type: 'umbral-knight', x: 40, z: 31, yaw: -1.2 },
    // The Hall of Chains
    { id: 'c1', type: 'eclipse-knight', x: -6, z: 72, yaw: Math.PI },
    { id: 'c2', type: 'eclipse-lancer', x: 8, z: 84, yaw: Math.PI, patrol: [[8, 84], [12, 70], [-12, 70], [-8, 92]] },
    { id: 'c3', type: 'goblin-voidcaller', x: -14, z: 94, yaw: 2.6 },
    { id: 'c4', type: 'hollow-courtier', x: 14, z: 94, yaw: -2.6 },
    { id: 'c5', type: 'ratman-voidfang', x: 0, z: 96, yaw: Math.PI, idle: 'sleep' },
    // The Lantern's Threshold
    { id: 'selene', type: 'selene', x: 0, z: 118, yaw: Math.PI, elite: 'warden' },
    // The Heart's Antechamber
    { id: 'a1', type: 'eclipse-knight', x: 5, z: 150, yaw: Math.PI },
    { id: 'a2', type: 'eclipse-lancer', x: -5, z: 152, yaw: Math.PI },
    { id: 'a3', type: 'umbral-knight', x: 11, z: 137, yaw: -2.2 },
    { id: 'a4', type: 'goblin-voidcaller', x: -12, z: 154, yaw: 2.6 },
    // The Heart of the Moon
    { id: 'boss', type: 'eclipse', x: 0, z: 192, yaw: Math.PI, elite: 'boss' },
  ],
  adds: [
    { id: 'add1', type: 'eclipse-knight', x: -12, z: 196, yaw: Math.PI, add: true },
    { id: 'add2', type: 'eclipse-knight', x: 12, z: 196, yaw: Math.PI, add: true },
  ],
  boss: 'boss',
  bossCharm: 'firstlight',
  phase2Line: 'The Eclipse puts out the moon',

  messages: [
    { x: 2, z: -6, text: 'The Eclipse\'s knights wear the dark like armour. It breaks like armour, too.' },
    { x: -2, z: 22, text: 'The veins of light run to the heart. Follow them; they are what the Eclipse is eating.' },
    { x: 2, z: 64, text: 'Every chain here is made of someone\'s light. Some are nearly out.' },
    { x: 2, z: 107.5, text: 'Selene will not let you pass while she holds the chain. She fights with the light in her hands.' },
    { x: 2, z: 162, text: 'Beyond the briars, the Eclipse. It wears a knight\'s shape, because a knight is what came for it.' },
  ],

  items: [
    { id: 'glimmer1', x: 17, z: 22, kind: 'glimmer', amount: 22000, label: 'Glimmer Shard', desc: '+22000 Glimmer' },
    { id: 'c-orrerykey', x: 42, z: 42, kind: 'charm', charm: 'orrerykey', label: 'Charm' },
    { id: 'grace1', x: -16, z: 64, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'glimmer2', x: 16, z: 64, kind: 'glimmer', amount: 22800, label: 'Glimmer Shard', desc: '+22800 Glimmer', inside: 'curn' },
    { id: 'glimmer3', x: 12, z: 134, kind: 'glimmer', amount: 23600, label: 'Glimmer Shard', desc: '+23600 Glimmer' },
    { id: 'glimmer4', x: 30, z: 30, kind: 'glimmer', amount: 22400, label: 'Glimmer Shard', desc: '+22400 Glimmer', inside: 'ourn' },
  ],
  letters: [
    { id: 'veins', x: -17.5, z: 22.5, title: 'A Lamp-Bearer\'s Last Note', text: 'Every lamp the first fae ever lit feeds the chain. That is why the moon wanes: the chain drinks, and the Eclipse drinks from the chain.\n\nThe Queen understood that. She hoarded the light so the chain would starve, and the Eclipse with it. She was wrong only about how long it would take.' },
    { id: 'selene', x: 10.5, z: 108, title: 'Selene\'s Promise', text: 'I will hold the chain until someone comes to take it.\n\nI have held it so long that I have forgotten how to let go. If someone comes for it, I will fight them for it. Forgive me. Take it from me anyway.' },
    { id: 'eclipse', x: -12.4, z: 155.5, title: 'Written in Light, on Nothing', text: '(Letters of gold hang in the air of the antechamber, fading and returning:)\n\nI AM WHAT IS LEFT WHEN A LIGHT GOES OUT. I DO NOT HATE YOU. I AM ONLY HUNGRY, AND YOU ARE SO BRIGHT.' },
    { id: 'knight15', x: 3, z: -9.6, title: 'The Last Lantern', text: '(A small lantern by the Moonwell, burning steadily. On its base, in Maelis\'s hand:)\n\nI am here. I will be at the chain when you come through. Do not keep the light. Give it back, as you did before. — M.' },
  ],
  pixies: [
    { id: 'p1', x: 7.5, z: -9.5 },
    { id: 'p2', x: 18, z: 38, y: 1.2 },
    { id: 'p3', x: 42, z: 30, inside: 'ourn2' },
    { id: 'p4', x: -16.5, z: 86 },
    { id: 'p5', x: 12, z: 154, inside: 'aurn' },
  ],

  gate: { x: 0, z: 128.5, width: 7, guardian: 'selene', style: 'portcullis', toast: 'Selene lets the chain go', banner: 'THE FIRST LANTERN RESTS', charm: 'selenechain' },
  seal: { x: 0, z: 164, yaw: 0, width: 7.6, height: 6.8, inside: [0, 174] },
  exit: { x: 0, z: 208 },

  build(w, R) {
    const g = w.group, M = w.mats;
    const keep = [...this.spawns, ...this.items, ...Object.values(this.shrines), ...this.messages, ...this.letters, ...this.pixies].map(o => ({ x: o.x, z: o.z, r: 2.2 }));
    const gold = M.goldvein = new THREE.MeshStandardMaterial({ color: 0xffd890, emissive: 0xffb040, emissiveIntensity: .7, roughness: .3, metalness: .6 });

    // The moon's core: dark moonrock, white-built halls, veins of light in everything.
    floorRooms(w, ROOMS, CORRS, 'cavefloor', { tile: 5 });
    for (const rm of ROOMS.slice(2, 6)) w.floor(rm.x0, rm.z0, rm.x1, rm.z1, 'marble', 4, .008);
    w.disc(0, 190, 16, 'arena', 4.1);
    raiseRooms(w, ROOMS, CORRS, { edge: 'cliff', h: 10 });
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(300, 320), new THREE.MeshStandardMaterial({ color: 0x0c0a10, roughness: 1, side: THREE.DoubleSide }));
    roof.rotation.x = Math.PI / 2; roof.position.set(0, 18, 100); g.add(roof);
    for (let i = 0; i < 90; i++) {
      const rm = ROOMS[Math.floor(R() * ROOMS.length)], x = rm.x0 + R() * (rm.x1 - rm.x0), z = rm.z0 + R() * (rm.z1 - rm.z0);
      const v = new THREE.BoxGeometry(.12, .02, 2 + R() * 4); v.rotateY(R() * 6); v.translate(x, .03, z); w.batch('goldvein', v);
    }
    for (const [x, z] of [[-8, -9], [8, 9], [-8, 9]]) w.brazier(x, z, 0xffd890);

    // The Long Fall: the shaft from the Maw, and light falling down it.
    const fall = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 18, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: .08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    fall.position.set(0, 9, -6); g.add(fall);

    // The Veins of Light: selenite and gold crystals where the veins come to the surface.
    for (const p of scatter(R, ROOMS[1], 12, keep, { edge: 3, gap: 3.4 })) w.crystal(p.x, p.z, 1.8 + R() * 2.4, R() < .5 ? 0xffd890 : 0xeef4ff, Math.floor(R() * 999), R() < .4);
    w.breakable('crystal', 18, 52); w.breakable('crystal', -18, 30);

    // The First Orrery: the first fae's map of the heavens, turning still.
    const orrery = new THREE.Group(); orrery.position.set(36, 3.4, 36); g.add(orrery);
    const brass = new THREE.MeshStandardMaterial({ color: 0xd8b86a, metalness: .9, roughness: .3, emissive: 0x3a2a08 });
    const rings = [2.4, 1.8, 1.3, .9].map((r, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, .05, 6, 48), brass); m.rotation.x = i * .8; orrery.add(m); return m; });
    const world = new THREE.Mesh(new THREE.SphereGeometry(.4, 16, 10), new THREE.MeshBasicMaterial({ color: 0x6a9ad8 })); orrery.add(world);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(.18, 12, 8), new THREE.MeshBasicMaterial({ color: 0xeef2ff })); orrery.add(moon);
    w.anim.push(t => { rings.forEach((m, i) => { m.rotation.y = t * (.25 + i * .2); }); moon.position.set(Math.sin(t * .5) * 1.8, 0, Math.cos(t * .5) * 1.8); });
    const stand = new THREE.CylinderGeometry(.1, .45, 2.6, 8); stand.translate(36, 1.3, 36); w.batch('whitestone', stand); w.prop(w.addCyl(36, 36, .6, 2.6));
    w.breakable('urn', 30, 30, { id: 'ourn' }); w.breakable('urn', 42, 30, { id: 'ourn2' });

    // The Hall of Chains: great chains of light running from the walls toward the heart, some nearly out.
    const chainMat = new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffc860, emissiveIntensity: .9, roughness: .3, metalness: .4 });
    for (let k = 0; k < 6; k++) {
      const x0 = k % 2 ? 17 : -17, z = 68 + Math.floor(k / 2) * 12, grp = new THREE.Group(); g.add(grp);
      for (let i = 0; i < 12; i++) { const l = new THREE.Mesh(new THREE.TorusGeometry(.45, .1, 6, 12), chainMat); l.position.set(x0 + (k % 2 ? -1 : 1) * i * .75, 7 - i * .3, z + i * .9); l.rotation.set(i % 2 ? Math.PI / 2 : 0, .6, 0); grp.add(l); }
    }
    w.anim.push(t => { chainMat.emissiveIntensity = .7 + Math.sin(t * 1.3) * .25; });
    for (let z = 70; z <= 92; z += 11) for (const x of [-11, 11]) w.pillar(x, z, .8, 9, false, 'whitestone');
    w.breakable('urn', 16, 64, { id: 'curn' }); w.breakable('urn', -16, 96);

    // The Lantern's Threshold: Selene's post, where every chain meets.
    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.2, .22, 64, 8), chainMat); knot.position.set(0, 7, 124); g.add(knot);
    w.anim.push(t => { knot.rotation.y = t * .4; knot.rotation.x = Math.sin(t * .3) * .3; });
    for (const x of [-10, 10]) w.pillar(x, 108, .7, 9, false, 'whitestone');

    // The Heart's Antechamber: white columns, the last lamps, the golden writing on nothing.
    for (let z = 138; z <= 152; z += 7) for (const x of [-5, 5]) w.pillar(x, z, .7, 9, false, 'whitestone');
    for (const [x, z] of [[-12.5, 146], [12.5, 151]]) w.brazier(x, z, 0xffd890);
    w.breakable('urn', 12, 154, { id: 'aurn' }); w.breakable('urn', -12.5, 150);

    // The Heart of the Moon: an open hollow round a black sun ringed in fire, chained in light.
    const sun = new THREE.Mesh(new THREE.SphereGeometry(4.5, 32, 20), new THREE.MeshBasicMaterial({ color: 0x000000 })); sun.position.set(0, 11, 222); g.add(sun);
    const corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: w.glowTex, color: 0xffb850, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .8 }));
    corona.position.set(0, 11, 222.5); corona.scale.setScalar(26); g.add(corona);
    w.anim.push(t => { corona.material.opacity = .65 + Math.sin(t * .9) * .15; corona.scale.setScalar(24 + Math.sin(t * .6) * 2); });
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2, grp = new THREE.Group(); g.add(grp);
      for (let i = 0; i < 16; i++) { const t = i / 15, l = new THREE.Mesh(new THREE.TorusGeometry(.5, .11, 6, 12), chainMat); l.position.set(Math.sin(a) * (20 - t * 15), 2 + t * 9 + Math.sin(t * Math.PI) * 2, 222 + Math.cos(a) * (18 - t * 13) - t * 0); l.rotation.set(i % 2 ? Math.PI / 2 : 0, a, 0); grp.add(l); }
    }
    for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * Math.PI * 2; w.crystal(Math.sin(a) * 17, 190 + Math.cos(a) * 16, 3 + (i % 3), i % 2 ? 0xffd890 : 0xeef4ff, i + 70, i % 2 === 0); }
    const dais = new THREE.CylinderGeometry(3.4, 3.8, .5, 24); dais.translate(0, .25, 206); w.batch('whitestone', dais);
  },
};
