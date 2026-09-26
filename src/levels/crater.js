// Mission 9: the Starfall Crater, where a shard of the moon fell long ago: glass fields, crystal groves, and
// the things that feed on the light. North, down into the crater: the Crater Rim (first Moonwell) → the Glass
// Fields (the Geode off to the west) → the Long Descent → the Shard Gate (the Shardling holds it) → the Heart of
// the Crater (second Moonwell) → Briar Seal → the Moonshard (Gorgathul, the Star-Eater).
import * as THREE from 'three';
import { joinRooms, raiseRooms, roomAreas, floorRooms, scatter } from './rooms.js';

const ROOMS = [
  { id: 'rim', name: 'The Crater Rim', x0: -10, z0: -12, x1: 10, z1: 12 },
  { id: 'glass', name: 'The Glass Fields', x0: -22, z0: 20, x1: 18, z1: 54 },
  { id: 'geode', name: 'The Geode', x0: -40, z0: 28, x1: -28, z1: 44 },
  { id: 'descent', name: 'The Long Descent', x0: -6, z0: 60, x1: 16, z1: 94 },
  { id: 'shardgate', name: 'The Shard Gate', x0: -8, z0: 100, x1: 16, z1: 122 },
  { id: 'heart', name: 'The Heart of the Crater', x0: -10, z0: 128, x1: 18, z1: 156 },
  { id: 'moonshard', name: 'The Moonshard', x0: -14, z0: 168, x1: 22, z1: 204 },
];
const PASSES = [
  { a: 'rim', b: 'glass', at: 0, w: 8 },
  { a: 'geode', b: 'glass', at: 36, w: 6 },
  { a: 'glass', b: 'descent', at: 4, w: 8 },
  { a: 'descent', b: 'shardgate', at: 4, w: 8 },
  { a: 'shardgate', b: 'heart', at: 4, w: 7 },
  { a: 'heart', b: 'moonshard', at: 4, w: 7.6 },
];
const CORRS = joinRooms(ROOMS, PASSES);

export default {
  id: 'crater',
  name: 'The Starfall Crater',
  blurb: 'Where a shard of the moon fell long ago: a crater of glass and starlight, and the things that grew fat on it. The Queen came here to drink.',
  level: 66,
  gatekeeper: { hp: 1, dmg: 2 },   // scaled to keep pace with the knight (balance pass)
  warlord: { hp: 1.3, dmg: 2.1 },
  map: { x: 96, z: -12 },
  seed: 9696,
  forest: true,
  tier: 4,
  fog: { color: 0x0e0a1c, byArea: { rim: .01, glass: .012, geode: .018, descent: .014, shardgate: .014, heart: .016, moonshard: .01 }, base: .013 },
  light: { sky: 0xa898e8, ground: 0x1a1430, hemi: 1.45, moonColor: 0xd8c8ff, moon: 2.1 },
  moon: { at: [0, 110, 420], glow: 260, size: 30 },
  enemyGlow: .18,
  intro: 'The Queen came to the crater where the moon\'s shard fell, and drank.\nGo down into the glass, and end what grew fat on the leavings.',
  outro: 'Gorgathul bursts in a storm of stolen starlight, and the Moonshard dims to a coal. The Queen took what she came for long ago: its light burns now in her court above the clouds, where the moon once rose. The way up opens.',
  exitToast: 'The Star-Eater is gone. A Pixie Gate opens by the Moonshard',
  motes: { base: 0xc8b0ff, geode: 0x9fe8ff, moonshard: 0xe0d0ff },
  titleShrine: 'rim',
  areas: roomAreas(ROOMS),
  rooms: ROOMS, corrs: CORRS,   // for the shortcut (shortcuts.js), laid in before the level is built

  shrines: {
    rim: { id: 'rim', name: 'Moonwell of the Crater Rim', x: -4, z: -4, spawn: [-1.8, -2.2], yaw: 0 },
    heart: { id: 'heart', name: 'Moonwell of the Crater\'s Heart', x: -5, z: 133, spawn: [-3, 135], yaw: .5 },
  },

  spawns: [
    { id: 'r1', type: 'ratman-starbitten', x: 4, z: 7, yaw: Math.PI, idle: 'sleep' },
    // The Glass Fields
    { id: 'g1', type: 'star-shade', x: -8, z: 32, yaw: Math.PI },
    { id: 'g2', type: 'ratman-starbitten', x: 8, z: 28, yaw: -2.4 },
    { id: 'g3', type: 'ratman-starbitten', x: 12, z: 46, yaw: -2.4, patrol: [[12, 46], [-4, 48], [-14, 40]] },
    { id: 'g4', type: 'goblin-starcaller', x: -16, z: 50, yaw: 2.4 },
    { id: 'g5', type: 'ratman-crystalbrute', x: 0, z: 42, yaw: Math.PI },
    { id: 'g6', type: 'ratman-shardseer', x: 14, z: 51, yaw: -2.6 },
    // The Geode
    { id: 'e1', type: 'ratman-crystalbrute', x: -34, z: 40, yaw: 1.6 },
    { id: 'e2', type: 'goblin-starcaller', x: -38, z: 31, yaw: 1.2 },
    // The Long Descent
    { id: 'd1', type: 'star-shade', x: 0, z: 70, yaw: Math.PI },
    { id: 'd2', type: 'star-shade', x: 10, z: 86, yaw: Math.PI },
    { id: 'd3', type: 'ratman-shardseer', x: -3, z: 90, yaw: 2.6 },
    { id: 'd4', type: 'goblin-starcaller', x: 13, z: 72, yaw: -2 },
    { id: 'd5', type: 'ratman-starbitten', x: -3, z: 80, yaw: 2.4, idle: 'sleep' },
    { id: 'd6', type: 'ratman-crystalbrute', x: 6, z: 92, yaw: Math.PI },
    // The Shard Gate
    { id: 'shardling', type: 'shardling', x: 4, z: 112, yaw: Math.PI, elite: 'warden' },
    { id: 's1', type: 'ratman-starbitten', x: -4, z: 104, yaw: 2.4 },
    // The Heart of the Crater
    { id: 'h1', type: 'ratman-crystalbrute', x: 4, z: 150, yaw: Math.PI },
    { id: 'h2', type: 'star-shade', x: 14, z: 138, yaw: -2.2 },
    { id: 'h3', type: 'star-shade', x: -7, z: 152, yaw: 2.4 },
    { id: 'h4', type: 'goblin-starcaller', x: 15, z: 153, yaw: -2.6 },
    { id: 'h5', type: 'ratman-shardseer', x: -8, z: 144, yaw: 1.8 },
    { id: 'h6', type: 'ratman-starbitten', x: 10, z: 131, yaw: Math.PI, idle: 'sleep' },
    // The Moonshard
    { id: 'boss', type: 'stareater', x: 4, z: 188, yaw: Math.PI, elite: 'boss' },
  ],
  adds: [
    { id: 'add1', type: 'ratman-starbitten', x: -6, z: 192, yaw: Math.PI, add: true },
    { id: 'add2', type: 'ratman-starbitten', x: 14, z: 192, yaw: Math.PI, add: true },
  ],
  boss: 'boss',
  bossCharm: 'stareye',
  phase2Line: 'The Star-Eater swallows the stars',

  messages: [
    { x: 2, z: -6, text: 'Star-Shades flicker from one place to the next. When one vanishes, look behind you.' },
    { x: -2, z: 22, text: 'Starcallers ring themselves with falling stars. Close on them between volleys.' },
    { x: 6, z: 61.5, text: 'Crystal Brutes split the glass in lines. Step off the line, not back along it.' },
    { x: 6, z: 101.5, text: 'The Shardling: a brute grown through with moon-glass. Its lines of shards reach far.' },
    { x: 6, z: 158, text: 'Beyond the briars, something vast is still eating the light.' },
  ],

  items: [
    { id: 'glimmer1', x: -20, z: 22, kind: 'glimmer', amount: 9800, label: 'Glimmer Shard', desc: '+9800 Glimmer' },
    { id: 'c-starglass', x: -38, z: 42, kind: 'charm', charm: 'starglass', label: 'Charm' },
    { id: 'grace1', x: 14, z: 62, kind: 'grace', label: 'Moondew Phial', desc: 'One more draught of Moondew, every rest.' },
    { id: 'glimmer2', x: -4, z: 62, kind: 'glimmer', amount: 10400, label: 'Glimmer Shard', desc: '+10400 Glimmer', inside: 'dcrys' },
    { id: 'glimmer3', x: 16, z: 131, kind: 'glimmer', amount: 11000, label: 'Glimmer Shard', desc: '+11000 Glimmer' },
    { id: 'art-lance', x: 14, z: 120, kind: 'art', art: 'lance', label: 'Moonlance', desc: 'a Fae Art: a splinter of the fallen moon', inside: 'scrys',
      tip: 'Moonlance looses a lance of moonlight straight ahead, through every foe in its path.\nChange Fae Arts with Y (the d-pad\'s right on a gamepad); their uses return at every Moonwell.' },
  ],
  letters: [
    { id: 'astronomer', x: 15.5, z: 22.5, title: "An Astronomer's Chart", text: 'The shard fell in the year of two moons. For a hundred years it glowed like a second, smaller moon down here in the glass, and the rats that ate the glass grew clever, and then grew large.\n\nThis year it is dim. Someone has been drinking from it. The rats are hungry, and they have started eating each other.' },
    { id: 'gorgathul', x: -6.4, z: 155, title: 'Scratched on the Glass', text: 'BIG. BIGGER. MOON IN BELLY. MORE MOON.\n\nTHE LADY TOOK THE MOON. LADY IN SILVER. SHE LEFT A LITTLE. GORGATHUL ATE THE LITTLE.\n\nSTILL HUNGRY.' },
    { id: 'queen2', x: -38, z: 29.4, title: 'A Silver Page, Folded', text: 'Every light ends. I have watched them all end: the lanterns, the stars, the Court. Now the moon is ending, and they tell me to let it.\n\nI will not. I will take every thread of it into myself and hold it, and it will never end, because I will not.\n\nIf the fae must go dark for the moon to live, then they will go dark. I did not choose that. The moon did.\n\n— W.' },
    { id: 'maelis9', x: 3, z: -9.6, title: 'The Other Knight\'s Last Note', text: 'I saw Maelis. She walked past me on the rim with the Queen\'s rose on her breastplate, and her eyes were the colour of the moon. She did not know me.\n\nShe drops her guard after the fourth cut of a chain. She always did. She told me so herself, once, laughing, when we were squires.\n\nIf you meet her, do not be sorry.' },
  ],
  pixies: [
    { id: 'p1', x: 7.5, z: -9.5 },
    { id: 'p2', x: -34, z: 29, inside: 'eurn' },
    { id: 'p3', x: -18, z: 36, y: 1.2 },
    { id: 'p4', x: 14.5, z: 92.5 },
    { id: 'p5', x: 16, z: 154.5, inside: 'hcrys' },
  ],

  gate: { x: 4, z: 124.5, width: 7, guardian: 'shardling', style: 'ice', toast: 'The wall of moon-glass shatters', banner: 'SHARDLING SHATTERED', charm: 'shardheart' },
  seal: { x: 4, z: 162, yaw: 0, width: 7.6, height: 6.8, inside: [4, 172] },
  exit: { x: 4, z: 199 },

  build(w, R) {
    const g = w.group, M = w.mats;
    M.glass = new THREE.MeshStandardMaterial({ color: 0x3a3060, emissive: 0x100a28, roughness: .15, metalness: .5 });
    M.ice = w.cutout(new THREE.MeshStandardMaterial({ color: 0xc8b0ff, emissive: 0x5a3aa8, emissiveIntensity: .6, roughness: .08, metalness: .25, transparent: true, opacity: .86, flatShading: true }));
    M.rock.color.setHex(0x6a5a8a);
    const keep = [...this.spawns, ...this.items, ...Object.values(this.shrines), ...this.messages, ...this.letters, ...this.pixies].map(o => ({ x: o.x, z: o.z, r: 2.2 }));

    // The crater: glass underfoot, cliffs of dark stone, the sky full of the moon.
    w.floor(-70, -40, 80, 240, 'earth', 6, -.02);
    floorRooms(w, ROOMS, CORRS, M.glass, { tile: 5 });
    raiseRooms(w, ROOMS, CORRS, { edge: 'cliff', h: 8 });
    // Glass cracks glowing in the floor.
    const crack = new THREE.MeshBasicMaterial({ color: 0x9a7aff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 70; i++) {
      const rm = ROOMS[Math.floor(R() * ROOMS.length)], x = rm.x0 + R() * (rm.x1 - rm.x0), z = rm.z0 + R() * (rm.z1 - rm.z0);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(.12, 1.5 + R() * 3), crack); m.rotation.x = -Math.PI / 2; m.rotation.z = R() * 6; m.position.set(x, .02, z); g.add(m);
    }
    const cols = [0xb48cff, 0x8affe8, 0xd8c8ff];
    for (const rm of ROOMS) {
      const n = rm.id === 'moonshard' ? 0 : Math.round((rm.x1 - rm.x0) * (rm.z1 - rm.z0) / 90);
      for (const p of scatter(R, rm, n, keep, { edge: 3, gap: 3 })) {
        if (R() < .55) w.crystal(p.x, p.z, 1.6 + R() * 2.4, cols[Math.floor(R() * 3)], Math.floor(R() * 999), R() < .5);
        else w.boulder(p.x, p.z, .7 + R() * .8, Math.floor(R() * 999));
      }
    }
    w.breakable('crystal', -4, 62, { id: 'dcrys' }); w.breakable('crystal', 14, 120, { id: 'scrys' }); w.breakable('crystal', 16, 154.5, { id: 'hcrys' });
    w.breakable('urn', -34, 29, { id: 'eurn' }); w.breakable('crystal', 12, 24); w.breakable('crystal', -20, 48);

    // The Geode: walls of crystal all round.
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, x = -34 + Math.sin(a) * 5.4, z = 36 + Math.cos(a) * 7; if (Math.abs(a - Math.PI / 2) < .5) continue; w.crystal(x, z, 2 + R() * 2, cols[i % 3], i + 7, i % 4 === 0, false); }

    // The Moonshard: the fallen shard itself, huge and dim, at the crater's heart.
    w.disc(4, 186, 14, 'arena', 4.1);
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xe0d8ff, emissive: 0x8a7aff, emissiveIntensity: .8, roughness: .1, flatShading: true }));
    shard.scale.set(5, 14, 5); shard.rotation.set(.3, .5, .2); shard.position.set(4, 8, 214); g.add(shard);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: w.glowTex, color: 0xb8a0ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .5 }));
    halo.position.set(4, 10, 214); halo.scale.setScalar(40); g.add(halo);
    w.anim.push(t => { shard.rotation.y = .5 + t * .05; halo.material.opacity = .4 + Math.sin(t * .7) * .1; });
    for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * Math.PI * 2; w.crystal(4 + Math.sin(a) * 14, 186 + Math.cos(a) * 13, 3 + (i % 3), cols[i % 3], i + 70, i % 2 === 0); }
    for (const [x, z] of [[-8, -9], [8, -9], [-8, 9]]) w.brazier(x, z, 0xb8a0ff);
    // Far rim of the crater, and stars falling.
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x2a2440, roughness: 1, flatShading: true });
    for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2, r = 150 + R() * 30, h = 20 + R() * 30; const m = new THREE.Mesh(new THREE.ConeGeometry(14 + R() * 12, h, 5), rimMat); m.position.set(4 + Math.sin(a) * r, h / 2 - 6, 96 + Math.cos(a) * r * 1.2); g.add(m); }
  },
};
