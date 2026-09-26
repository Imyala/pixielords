// Mission 7: the Emberforge, the goblins' war-forge in the belly of a fire mountain, where the chains of winter
// were made. North: the Ashen Gate (first Moonwell) → the Bellows Hall (the Slag Pits off to the west) → the
// Foundry Floor → the Great Anvil (Forgemaster Ghurk holds it) → the Cooling Halls (second Moonwell) → Briar
// Seal → the Iron Throne (the Iron Tyrant).
import * as THREE from 'three';
import { boxGeo } from '../world.js';
import { joinRooms, raiseRooms, roomAreas, floorRooms, scatter } from './rooms.js';

const ROOMS = [
  { id: 'gate', name: 'The Ashen Gate', x0: -10, z0: -12, x1: 10, z1: 12 },
  { id: 'bellows', name: 'The Bellows Hall', x0: -18, z0: 20, x1: 18, z1: 52, o: { h: 9 } },
  { id: 'slagpits', name: 'The Slag Pits', x0: -38, z0: 28, x1: -24, z1: 46 },
  { id: 'foundry', name: 'The Foundry Floor', x0: -8, z0: 58, x1: 20, z1: 92, o: { h: 9 } },
  { id: 'anvil', name: 'The Great Anvil', x0: -6, z0: 98, x1: 18, z1: 122, o: { h: 9 } },
  { id: 'coolings', name: 'The Cooling Halls', x0: -10, z0: 128, x1: 22, z1: 156 },
  { id: 'throne', name: 'The Iron Throne', x0: -12, z0: 168, x1: 24, z1: 204, o: { h: 11 } },
];
const PASSES = [
  { a: 'gate', b: 'bellows', at: 0, w: 7 },
  { a: 'slagpits', b: 'bellows', at: 37, w: 6 },
  { a: 'bellows', b: 'foundry', at: 6, w: 7 },
  { a: 'foundry', b: 'anvil', at: 6, w: 7 },
  { a: 'anvil', b: 'coolings', at: 6, w: 7 },
  { a: 'coolings', b: 'throne', at: 6, w: 7.6 },
];
const CORRS = joinRooms(ROOMS, PASSES);
// Pools of molten iron in the halls: fire underfoot.
const LAVA = [[-9, 28, 3], [13, 31, 2.8], [8, 75, 3.6], [-31, 37, 3.4], [-4, 142, 2.6], [16, 148, 2.6]];

export default {
  id: 'forge',
  name: 'The Emberforge',
  blurb: 'The goblins\' war-forge in the belly of a fire mountain. Its hammers made the chains of winter, and something in iron still sits on its throne.',
  level: 50,
  gatekeeper: { hp: 1, dmg: 1.8 },   // scaled to keep pace with the knight (balance pass)
  warlord: { hp: 1.25, dmg: 1.9 },
  map: { x: 100, z: 32 },
  seed: 7272,
  cave: true,
  tier: 3.2,
  fog: { color: 0x1a0c08, byArea: { gate: .02, bellows: .018, slagpits: .024, foundry: .018, anvil: .016, coolings: .022, throne: .012 }, base: .02 },
  light: { sky: 0xd08a5a, ground: 0x2a1408, hemi: 1.1, moonColor: 0xff9a60, moon: 1.1 },
  enemyGlow: .18,
  intro: 'The chains that bound the moon were forged here.\nBreak the forge, and whatever sits on its throne.',
  outro: 'The Iron Tyrant falls from the throne he was chained to. In the ash of the forge, a map of the Thornwood Court, with the Queen\'s rose drawn at its heart: the chains went there, and so must you.',
  exitToast: 'The Tyrant\'s iron cools. A Pixie Gate opens at the throne',
  motes: { base: 0xff8a40, coolings: 0xffc080, throne: 0xff6a2a },
  titleShrine: 'gate',
  areas: roomAreas(ROOMS),
  rooms: ROOMS, corrs: CORRS,   // for the shortcut (shortcuts.js), laid in before the level is built

  shrines: {
    gate: { id: 'gate', name: 'Moonwell of the Ashen Gate', x: -4, z: -4, spawn: [-1.8, -2.2], yaw: 0 },
    coolings: { id: 'coolings', name: 'Moonwell of the Cooling Halls', x: -5, z: 133, spawn: [-3, 135], yaw: .5 },
  },

  spawns: [
    { id: 'a1', type: 'goblin-forgeguard', x: 3, z: 8, yaw: Math.PI },
    // The Bellows Hall
    { id: 'b1', type: 'goblin-hammerer', x: -4, z: 34, yaw: Math.PI },
    { id: 'b2', type: 'goblin-forgeguard', x: 6, z: 44, yaw: Math.PI },
    { id: 'b3', type: 'goblin-smelter', x: 13, z: 48, yaw: -2.6 },
    { id: 'b4', type: 'goblin-smelter', x: -8, z: 49, yaw: 2.6 },
    { id: 'b5', type: 'ratman-slagbrute', x: 0, z: 38, yaw: Math.PI, idle: 'sleep' },
    { id: 'b6', type: 'goblin-archer', x: 15, z: 24, yaw: -2 },
    // The Slag Pits
    { id: 'p1', type: 'ratman-slagbrute', x: -30, z: 42, yaw: 1.6 },
    { id: 'p2', type: 'goblin-smelter', x: -35, z: 31, yaw: 1.2 },
    // The Foundry Floor
    { id: 'f1', type: 'iron-sentinel', x: 6, z: 84, yaw: Math.PI },
    { id: 'f2', type: 'goblin-hammerer', x: -3, z: 66, yaw: Math.PI },
    { id: 'f3', type: 'goblin-hammerer', x: 15, z: 68, yaw: -2.4, idle: 'sleep' },
    { id: 'f4', type: 'goblin-forgeguard', x: 0, z: 88, yaw: Math.PI, patrol: [[0, 88], [14, 88], [14, 62], [0, 62]] },
    { id: 'f5', type: 'goblin-smelter', x: 17, z: 89, yaw: -2.6 },
    { id: 'f6', type: 'goblin-archer', x: -5, z: 90, yaw: 2.6 },
    // The Great Anvil
    { id: 'ghurk', type: 'forgemaster', x: 6, z: 112, yaw: Math.PI, elite: 'warden' },
    { id: 'n1', type: 'goblin-forgeguard', x: -2, z: 104, yaw: 2.4 },
    // The Cooling Halls
    { id: 'c1', type: 'iron-sentinel', x: 6, z: 150, yaw: Math.PI },
    { id: 'c2', type: 'ratman-slagbrute', x: 16, z: 138, yaw: -2 },
    { id: 'c3', type: 'goblin-hammerer', x: -6, z: 152, yaw: 2.6 },
    { id: 'c4', type: 'goblin-smelter', x: 19, z: 153, yaw: -2.6 },
    { id: 'c5', type: 'goblin-forgeguard', x: 10, z: 132, yaw: Math.PI, idle: 'sleep' },
    { id: 'c6', type: 'goblin-archer', x: -8, z: 145, yaw: 1.8 },
    // The Iron Throne
    { id: 'boss', type: 'tyrant', x: 6, z: 190, yaw: Math.PI, elite: 'boss' },
  ],
  boss: 'boss',
  bossCharm: 'tyrantcrown',
  phase2Line: 'The Iron Tyrant glows white with the forge\'s heat',

  messages: [
    { x: 2, z: -6, text: 'Molten iron pools in the halls. Keep your feet out of it, and mind where a foe drives you.' },
    { x: -2, z: 22, text: 'Smelters lob pots of slag that leave the ground burning. Close on them, or keep moving.' },
    { x: 8, z: 56, text: 'Iron Sentinels are slow, and hit like the forge itself. Their furnace vents send fire along the floor.' },
    { x: 8, z: 96.5, text: 'Forgemaster Ghurk: his hammer leaves the ground burning wherever it lands.' },
    { x: 8, z: 158, text: 'The Tyrant sits in iron beyond the briars. He was a knight once.' },
  ],

  items: [
    { id: 'glimmer1', x: -16, z: 22.5, kind: 'glimmer', amount: 6600, label: 'Glimmer Shard', desc: '+6600 Glimmer' },
    { id: 'c-cinderring', x: -36, z: 44, kind: 'charm', charm: 'cinderring', label: 'Charm' },
    { id: 'grace1', x: 18, z: 60, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'glimmer2', x: -6, z: 60, kind: 'glimmer', amount: 7200, label: 'Glimmer Shard', desc: '+7200 Glimmer', inside: 'fcrate' },
    { id: 'glimmer3', x: 20, z: 131, kind: 'glimmer', amount: 7800, label: 'Glimmer Shard', desc: '+7800 Glimmer' },
    { id: 'glimmer4', x: 16, z: 100.5, kind: 'glimmer', amount: 6800, label: 'Glimmer Shard', desc: '+6800 Glimmer', inside: 'akeg' },
  ],
  letters: [
    { id: 'ledger', x: 16.5, z: 44.5, title: 'A Forge Ledger, Scorched', text: 'Chains, great: 40. Chains, small: 200. Manacles, fae-sized: 12.\n\nPaid in cold, as agreed. The cold keeps the furnaces from cracking. The Forgemaster does not ask where cold comes from, and neither do I.\n\nThe manacles went east, to the Court. Somebody there has a lot of fae to hold.' },
    { id: 'ghurk', x: -3.8, z: 116.6, title: "Ghurk's Complaint", text: 'The iron man on the throne does not eat, does not sleep, does not pay.\n\nHe came in chains we made, and the Queen said: forge him into something useful. So we did. Now he sits on our throne and tells us to work faster.\n\nI made the best chains in the world. Nobody tells me to work faster.' },
    { id: 'tyrant', x: 20.5, z: 150.5, title: 'Scratched Inside a Helm', text: 'My name was Aurel. I was a knight of the Lantern Court. I carried a lantern across the sea to find where the moonlight went.\n\nThey put me in the forge. It is warm in here. I have forgotten the colour of the moon.\n\nIf I sit on the throne long enough, perhaps I will forget my name too. That would be kinder.' },
    { id: 'maelis7', x: 3, z: -9.6, title: 'The Other Knight\'s Second Note', text: 'The abbey\'s Abbess had a letter from someone who signs herself W., and seals in silver wax. She promised the Abbess a moon that never sets.\n\nThe chains that carried Maelis east were made here. I have seen the brand on them: a rose, closed. I do not know whose rose it is, but I know where roses grow on these isles.\n\nI am going on. Watch the lava.' },
  ],
  pixies: [
    { id: 'p1', x: 7.5, z: -9.5 },
    { id: 'p2', x: -36.5, z: 29.5, inside: 'purn' },
    { id: 'p3', x: -6.5, z: 90.5 },
    { id: 'p4', x: -8.5, z: 130.5, y: 1.2 },
    { id: 'p5', x: -8.5, z: 154, inside: 'curn' },
  ],
  hazards: LAVA.map(([x, z, r]) => ({ x, z, r, kind: 'fire', poison: 36 })),

  gate: { x: 6, z: 124.5, width: 7, guardian: 'ghurk', style: 'portcullis', toast: 'The forge gate grinds open', banner: 'FORGEMASTER FELLED', charm: 'forgebrand' },
  seal: { x: 6, z: 162, yaw: 0, width: 7.6, height: 6.8, inside: [6, 172] },
  exit: { x: 6, z: 199 },

  build(w, R) {
    const g = w.group, M = w.mats;
    M.lava = new THREE.MeshBasicMaterial({ color: 0xff6a1a });
    M.iron2 = new THREE.MeshStandardMaterial({ color: 0x2e2a2c, metalness: .8, roughness: .45, emissive: 0x200804 });
    M.rock.color.setHex(0x5a4640); M.cavefloor.color.setHex(0x8a6a5a); M.cavefloor.emissive = new THREE.Color(0x140602);   // basalt and ash, not the Deep's cold stone
    const keep = [...this.spawns, ...this.items, ...Object.values(this.shrines), ...this.messages, ...this.letters, ...this.pixies].map(o => ({ x: o.x, z: o.z, r: 2.2 }));
    for (const [x, z, r] of LAVA) keep.push({ x, z, r: r + 1.5 });

    floorRooms(w, ROOMS, CORRS, 'cavefloor', { tile: 5 });
    raiseRooms(w, ROOMS, CORRS, { edge: 'cliff', h: 8.5 });
    // Molten iron: a glowing pool with a crust at its rim, and light rising off it.
    for (const [x, z, r] of LAVA) {
      w.disc(x, z, r, M.lava, 2, .03);
      const rim = new THREE.TorusGeometry(r, .22, 5, 32); rim.rotateX(Math.PI / 2); rim.translate(x, .05, z); w.batch('rock', rim);
      w.flames.push({ x, y: 1, z, color: new THREE.Color(0xff6a1a), base: 5 + r, phase: R() * 6, flick: 1 });
      w.anim.push(t => { if (Math.random() < .08) w.G?.fx?.motes({ x: x + (Math.random() - .5) * r, y: .3, z: z + (Math.random() - .5) * r }, 0xff8a3a, 1, .1, 1.2, .1, 1.2); });
    }

    // The Ashen Gate: two great doors thrown open, soot and slag.
    for (const x of [-4.4, 4.4]) { const d = boxGeo(4, 7, .5, 3); d.rotateY(x > 0 ? -.9 : .9); d.translate(x * 1.6, 3.5, 11); w.batch('iron', d); }
    for (const [x, z] of [[-8, 9], [8, 9], [8, -9]]) w.brazier(x, z, 0xff7a2a);

    // The Bellows Hall: vast leather bellows on iron frames, chains from the dark.
    for (const [x, z] of [[-14, 45], [13, 41]]) {
      const bel = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.6, 3.5, 12), new THREE.MeshStandardMaterial({ color: 0x4a2a1a, roughness: .9 }));
      bel.rotation.z = Math.PI / 2; bel.position.set(x, 2, z); g.add(bel);
      w.anim.push(t => { bel.scale.y = 1 + Math.sin(t * 1.4 + x) * .12; });
      w.prop(w.addBox(x, z, 2, 2.6, 0, 4));
    }
    for (let i = 0; i < 10; i++) { const x = -16 + R() * 32, z = 22 + R() * 28, L = 3 + R() * 5; const c = new THREE.CylinderGeometry(.06, .06, L, 4); c.translate(x, 9 - L / 2, z); w.batch('iron', c); }
    for (const p of scatter(R, ROOMS[1], 4, keep, { edge: 3 })) w.brazier(p.x, p.z, 0xff7a2a);
    w.pile(16, 22, [['crate', 0, 0], ['keg', 1, .2], ['keg', .2, 1]], .3);

    // The Slag Pits: heaped slag, a broken crucible.
    for (let i = 0; i < 6; i++) { const x = -36 + R() * 10, z = 30 + R() * 14; if (keep.some(k => Math.hypot(k.x - x, k.z - z) < 2.4)) continue; w.boulder(x, z, .8 + R() * .8, i + 40); }
    w.breakable('urn', -36.5, 29.5, { id: 'purn' }); w.breakable('barrel', -26, 44);

    // The Foundry Floor: crucibles on chains, moulds, anvils.
    for (const [x, z] of [[-4, 76], [16, 78]]) {
      const cr = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1, 1.6, 14), M.iron2); cr.position.set(x, 1.2, z); g.add(cr);
      const glow = new THREE.Mesh(new THREE.CircleGeometry(1.25, 20), M.lava); glow.rotation.x = -Math.PI / 2; glow.position.set(x, 2.01, z); g.add(glow);
      w.prop(w.addCyl(x, z, 1.4, 2)); w.flames.push({ x, y: 2.4, z, color: new THREE.Color(0xff7a2a), base: 6, phase: 1, flick: 1 });
    }
    for (const p of scatter(R, ROOMS[3], 5, keep, { edge: 3, gap: 4 })) { const a = boxGeo(1.6, 1, .8, 1); a.translate(p.x, .5, p.z); w.batch('iron', a); w.prop(w.addBox(p.x, p.z, .8, .4, 0, 1)); }
    w.breakable('crate', -6, 60, { id: 'fcrate' }); w.pile(18, 64, [['barrel', 0, 0], ['crate', 0, 1.1]], 0);

    // The Great Anvil: the anvil itself, big as a hut, and Ghurk's kegs.
    const anv = boxGeo(5, 2.2, 2.6, 2); anv.translate(11.5, 1.1, 104.5); w.batch('iron', anv); w.prop(w.addBox(11.5, 104.5, 2.5, 1.3, 0, 2.2));
    const horn = new THREE.ConeGeometry(.9, 2.6, 10); horn.rotateZ(Math.PI / 2); horn.translate(15.3, 1.8, 104.5); w.batch('iron', horn);
    w.breakable('keg', 16, 100.5, { id: 'akeg' }); w.pile(-4, 120, [['keg', 0, 0], ['keg', .8, .2]], 0);
    for (const [x, z] of [[-4, 100], [16, 120]]) w.brazier(x, z, 0xff7a2a);

    // The Cooling Halls: racks of blades and armour cooling, water troughs steaming.
    for (let z = 134; z <= 150; z += 8) for (const x of [0, 12]) {
      if (keep.some(k => Math.hypot(k.x - x, k.z - z) < 2.4)) continue;
      const rack = boxGeo(3, 2.4, .5, 2); rack.translate(x, 1.2, z); w.batch('wood', rack); w.prop(w.addBox(x, z, 1.5, .3, 0, 2.4));
      for (let k = 0; k < 4; k++) { const bl = boxGeo(.12, 2, .05, 1); bl.translate(x - 1.1 + k * .7, 1.4, z + .3); w.batch('iron', bl); }
    }
    w.breakable('urn', -8.5, 154, { id: 'curn' }); w.breakable('urn', 20.5, 140);

    // The Iron Throne: the throne, chained, and the forge's heart burning behind it.
    w.disc(6, 186, 13.5, 'arena', 4.1);
    const th = boxGeo(3.4, 5, 2.4, 2); th.translate(6, 2.5, 202); w.batch('iron', th);
    for (const x of [2, 10]) { const c = new THREE.CylinderGeometry(.08, .08, 9, 4); c.rotateZ(x < 6 ? .5 : -.5); c.translate(x, 5, 201); w.batch('iron', c); }
    const heart = new THREE.Sprite(new THREE.SpriteMaterial({ map: w.glowTex, color: 0xff6a1a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .6 }));
    heart.position.set(6, 6, 206); heart.scale.setScalar(18); g.add(heart);
    for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * Math.PI * 2; w.pillar(6 + Math.sin(a) * 13, 186 + Math.cos(a) * 12, .9, 11, i === 1 || i === 5, 'pillar'); }
    for (let i = 0; i < 6; i++) { const a = (i + .5) / 6 * Math.PI * 2; w.brazier(6 + Math.sin(a) * 16, 186 + Math.cos(a) * 15.5, 0xff7a2a); }
  },
};
