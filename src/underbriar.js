// The Underbriar: an endless maze under the Fae Crossroads, where everything the moon ever lit goes to dream.
// Like Nioh's Abyss and Underworld, it is made new for every depth, from a seed: a chain of rooms and briar
// passages in one of the five missions' looks (the look turns every five depths), side rooms with a little
// treasure, and foes drawn from that mission (and, past the first round of looks, from all of them), hardier
// the deeper you go. Slay every foe on a depth to open the Pixie Gate down. Every fifth depth ends in a
// warlord's arena behind a Briar Seal (gatekeepers, warlords and Revenants in turn); past it, the next depth
// holds a lit Moonwell, a checkpoint to start from again. Fall, and you wake at the last one.
// This file makes a depth into ordinary level data (as src/levels/*.js are); main.js runs it.
import * as THREE from 'three';
import { rng } from './util.js';
import { LEVELS } from './levels/index.js';
import { raiseRooms } from './levels/rooms.js';

export const CHECK_EVERY = 5;
export const isBossDepth = depth => depth % CHECK_EVERY === 0;
export const isCheckpoint = depth => (depth - 1) % CHECK_EVERY === 0;
export const checkpointOf = depth => depth - (depth - 1) % CHECK_EVERY;

const THEMES = ['keep', 'rotwood', 'deep', 'moonspire', 'frostmere', 'abbey', 'forge', 'thornwood', 'crater', 'court'];
export const themeOf = depth => THEMES[Math.floor((depth - 1) / CHECK_EVERY) % THEMES.length];
const LOOK = {
  keep: { floor: 'floor', edge: 'wall', flags: {}, rooms: ['Hall', 'Gallery', 'Cellar', 'Crypt', 'Armoury', 'Chapel'], fire: 0xff8a3a },
  rotwood: { floor: 'earth', edge: 'cliff', flags: { forest: true }, rooms: ['Hollow', 'Glade', 'Thicket', 'Den', 'Clearing', 'Bramble'], fire: 0xff7a2a },
  deep: { floor: 'cavefloor', edge: 'cliff', flags: { cave: true }, rooms: ['Drift', 'Grotto', 'Seam', 'Pit', 'Vein', 'Burrow'], fire: 0x7fe8ff },
  moonspire: { floor: 'marble', edge: 'wall', wall: 'whitestone', flags: { spire: true }, rooms: ['Terrace', 'Cloister', 'Sanctum', 'Garden', 'Reliquary', 'Stair'], fire: 0xc9d8ff },
  frostmere: { floor: 'snow', edge: 'cliff', flags: { frost: true }, rooms: ['Mere', 'Vigil', 'Court', 'Drift', 'Barrow', 'Floe'], fire: 0x9fe8ff },
  abbey: { floor: 'floor', edge: 'wall', flags: { forest: true }, rooms: ['Cloister', 'Chapel', 'Nave', 'Crypt', 'Scriptorium', 'Refectory'], fire: 0x7fffe0 },
  forge: { floor: 'cavefloor', edge: 'cliff', flags: { cave: true }, rooms: ['Forge', 'Smeltery', 'Foundry', 'Slag Hall', 'Crucible', 'Kiln'], fire: 0xff7a2a },
  thornwood: { floor: 'earth', edge: 'thorn', flags: { forest: true }, rooms: ['Garden', 'Bower', 'Arbour', 'Hedge Maze', 'Grove', 'Parterre'], fire: 0xff8ab8 },
  crater: { floor: 'earth', edge: 'cliff', flags: { forest: true }, rooms: ['Glass Field', 'Geode', 'Hollow', 'Rift', 'Shardfall', 'Basin'], fire: 0xb8a0ff },
  court: { floor: 'marble', edge: 'wall', wall: 'whitestone', flags: { spire: true }, rooms: ['Hall', 'Terrace', 'Gallery', 'Sanctum', 'Night Garden', 'Vigil'], fire: 0xc9d8ff },
};
const ADJ = ['Weeping', 'Thorned', 'Hollow', 'Sunken', 'Dreaming', 'Forgotten', 'Moonless', 'Broken', 'Silent', 'Gnawed', 'Pale', 'Drowned', 'Crooked', 'Starless', 'Withered', 'Bleeding', 'Whispering', 'Lantern'];

// Foes of each look: the rank and file of that mission (never its gatekeeper or warlord).
const POOL = Object.fromEntries(THEMES.map(m => [m, [...new Set((LEVELS[m]?.spawns || []).filter(s => !s.elite && !s.add).map(s => s.type))]]));
// The warlords of the fifth depths, in turn; after the Revenants the round begins again, harder.
const BOSSES = [
  { types: ['goblin-clubber'], from: 'keep' }, { types: ['ratman-warblade'], from: 'keep', adds: true },
  { types: ['brakka'], from: 'rotwood' }, { types: ['grimtusk'], from: 'rotwood', adds: true },
  { types: ['grinder'], from: 'deep' }, { types: ['skritch'], from: 'deep', adds: true },
  { types: ['varkh'], from: 'moonspire' }, { types: ['silkclaw'], from: 'moonspire', adds: true },
  { types: ['rime-knight'], from: 'frostmere' }, { types: ['rat-king', 'frost-hexer'], from: 'frostmere' },
  { types: ['revenant-thornwake'] }, { types: ['revenant-hollowmoon'] }, { types: ['revenant-emberlight'] }, { types: ['revenant-ysolde'] }, { types: ['revenant-lanternless'] },
  { types: ['bellwarden'], from: 'abbey' }, { types: ['abbess'], from: 'abbey', adds: true },
  { types: ['forgemaster'], from: 'forge' }, { types: ['tyrant'], from: 'forge' },
  { types: ['briarwarden'], from: 'thornwood' }, { types: ['hawthorn'], from: 'thornwood', adds: true },
  { types: ['shardling'], from: 'crater' }, { types: ['stareater'], from: 'crater', adds: true },
  { types: ['maelis'], from: 'court' }, { types: ['queen'], from: 'court', adds: true },
  { types: ['revenant-graves'] }, { types: ['revenant-ashkettle'] }, { types: ['revenant-rook'] }, { types: ['revenant-cinderwing'] }, { types: ['revenant-oathbound'] },
];
export const bossOf = depth => BOSSES[(depth / CHECK_EVERY - 1) % BOSSES.length];

// How hard a depth is: the rank and file's hardiness (as a mission's tier), and a multiplier on everything
// (warlords included) once the first round of warlords is behind you.
export function depthScale(depth) {
  const tier = depth <= 21 ? 1 + (depth - 1) * .07 : 2.4 + (depth - 21) * .05;
  const mul = 1 + Math.max(0, depth - 75) * .045;
  // The level shown: as a mission of that hardiness would be (its tier sets it, 21 levels a step).
  return { tier, mul, level: Math.round((1 + (tier - 1) * 21) * mul) };
}

const TIPS = [
  'The Underbriar: slay every foe on a depth, and the Pixie Gate down opens. Every fifth depth ends in a warlord\'s arena; the depth after it holds a lit Moonwell.\nFall, and you wake at the last lit Moonwell you reached. The dim ones only mark the way.',
  'Side rooms off the passages hold Glimmer and Moondew draughts. A draught fills one flask of Moondew there and then.',
  'Past the twentieth depth the foes of every mission wander together, and Champions rise more often.',
  'The Underbriar remembers how deep you have been. Start again from any lit Moonwell you reached, on the Fae Crossroads.',
];
const LORE = [
  'Here the fallen dream of the moon. Some of them dream of you.',
  'Every briar down here grew from a promise the fae did not keep.',
  'The deeper the briar, the older the dream. The oldest dream of nothing but teeth.',
  'Somewhere below, they say, the first Moonwell still burns, and no one has drunk from it.',
  'A lantern once hung here. The dark ate it, and it was still hungry.',
  'Knights who went down and did not come up are not lost. They are only very, very deep.',
];

// One depth, as level data.
export function makeFloor(depth, seed = 1) {
  const R = rng((seed * 7919 + depth * 104729) >>> 0 || 1); R(); R();
  const theme = themeOf(depth), look = LOOK[theme], src = LEVELS[theme], boss = isBossDepth(depth), lit = isCheckpoint(depth);
  const sc = depthScale(depth), cw = look.edge === 'cliff' ? 7 : 6;
  const pick = a => a[Math.floor(R() * a.length)];
  const rooms = [], corrs = [];
  const room = (cx, z0, w, d, kind) => { const r = { x0: cx - w / 2, x1: cx + w / 2, z0, z1: z0 + d, cx, cz: z0 + d / 2, w, d, kind, doors: [], deco: [], name: `The ${pick(ADJ)} ${pick(look.rooms)}` }; rooms.push(r); return r; };
  const link = (a, b) => {   // a passage from a's north wall to b's south wall
    const lo = Math.max(a.x0, b.x0) + cw / 2 + 1.4, hi = Math.min(a.x1, b.x1) - cw / 2 - 1.4;
    const x = lo <= hi ? lo + (hi - lo) * R() : (Math.max(a.x0, b.x0) + Math.min(a.x1, b.x1)) / 2;
    a.doors.push({ side: 'n', at: x, w: cw }); b.doors.push({ side: 's', at: x, w: cw });
    const c = { x0: x - cw / 2, x1: x + cw / 2, z0: a.z1, z1: b.z0, ns: true, x };
    corrs.push(c); return c;
  };

  // The chain: a small start room, then four to six rooms northward, each a passage apart.
  let prev = room(0, -7, 15, 15, 'start');
  const n = 4 + Math.floor(R() * 2) + (depth > 12 ? 1 : 0);
  for (let i = 1; i < n; i++) {
    const w = 17 + R() * 11, d = 15 + R() * 9;
    const r = room(prev.cx + (R() - .5) * 12, prev.z1 + 6 + R() * 6, w, d, i === n - 1 ? 'last' : 'room');
    link(prev, r); prev = r;
  }
  let arena = null, seal = null;
  if (boss) {
    arena = room(prev.cx, prev.z1 + 12, 32, 30, 'arena'); arena.name = 'The Warlord\'s Hollow';
    const c = link(prev, arena);
    seal = { x: c.x, z: (c.z0 + c.z1) / 2, yaw: 0, width: cw + .4, height: 6.8, inside: [c.x, arena.z0 + 3] };
  }
  // Side rooms off the chain, east or west, where they fit.
  const overlaps = (a, m = 2) => [...rooms, ...corrs].some(b => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.z0 < b.z1 + m && a.z1 > b.z0 - m);
  const mids = rooms.filter(r => r.kind === 'room');
  for (let k = 0, want = 1 + (R() < .6 ? 1 : 0); k < 6 && want > 0; k++) {
    const r = pick(mids); if (!r) break;
    const east = R() < .5, sw = 12 + R() * 4, sd = 12 + R() * 4, cl = 5 + R() * 4, zc = r.cz + (R() - .5) * (r.d - cw - 5), scw = cw - .5;
    const x0 = east ? r.x1 + cl : r.x0 - cl - sw, s = { x0, x1: x0 + sw, z0: zc - sd / 2, z1: zc + sd / 2 };
    if (overlaps(s)) continue;
    const side = room(x0 + sw / 2, zc - sd / 2, sw, sd, 'side');
    r.doors.push({ side: east ? 'e' : 'w', at: zc, w: scw }); side.doors.push({ side: east ? 'w' : 'e', at: zc, w: scw });
    corrs.push({ x0: east ? r.x1 : side.x1, x1: east ? side.x0 : r.x0, z0: zc - scw / 2, z1: zc + scw / 2, ew: true });
    want--;
  }

  // Decor, placed now so foes and treasure keep clear of it; built in build().
  const blocked = [{ x: rooms[0].cx - 4, z: rooms[0].cz - 2.5, r: 2.2 }, { x: rooms[0].cx + 3.6, z: rooms[0].cz + 1.5, r: 1.2 }];   // the Moonwell and the wisp
  const free = (x, z, r) => blocked.every(b => Math.hypot(b.x - x, b.z - z) > b.r + r);
  const nearDoor = (rm, x, z) => rm.doors.some(dr => {
    const p = dr.side === 'n' ? [dr.at, rm.z1] : dr.side === 's' ? [dr.at, rm.z0] : dr.side === 'e' ? [rm.x1, dr.at] : [rm.x0, dr.at];
    return Math.hypot(p[0] - x, p[1] - z) < dr.w / 2 + 3;
  });
  const spot = (rm, margin, r, edge = false) => {
    for (let t = 0; t < 30; t++) {
      const x = rm.x0 + margin + R() * (rm.w - margin * 2), z = rm.z0 + margin + R() * (rm.d - margin * 2);
      if (edge && Math.min(x - rm.x0, rm.x1 - x, z - rm.z0, rm.z1 - z) > margin + 3.5) continue;
      if (nearDoor(rm, x, z) || !free(x, z, r)) continue;
      blocked.push({ x, z, r }); return { x, z };
    }
    return null;
  };
  const DECO = {
    keep: [['pillar', 3], ['brazier', 2], ['pile', 2], ['urn', 1.5], ['pillarB', 1]],
    rotwood: [['tree', 3], ['boulder', 2], ['campfire', 1], ['totem', 1], ['pile', 1.5], ['deadTree', 1]],
    deep: [['crystal', 2.5], ['stalagmite', 3], ['cart', 1], ['crystalB', 1.5], ['nest', 1], ['boulder', 1]],
    moonspire: [['pillarW', 3], ['moonpool', 1.2], ['urn', 2], ['brazier', 2], ['arch', .8]],
    frostmere: [['snowPine', 3], ['snowBoulder', 2.5], ['brazier', 1.5], ['pile', 1.5], ['drift', 1]],
    abbey: [['pillar', 3], ['brazier', 2], ['pile', 1.5], ['urn', 2], ['pillarB', 1]],
    forge: [['stalagmite', 2.5], ['boulder', 2], ['brazier', 2], ['pile', 1.5], ['cart', 1]],
    thornwood: [['tree', 3], ['deadTree', 1.5], ['brazier', 1.5], ['urn', 1.5], ['boulder', 1]],
    crater: [['crystal', 3], ['crystalB', 1.5], ['boulder', 2], ['stalagmite', 1.5]],
    court: [['pillarW', 3], ['moonpool', 1.2], ['urn', 2], ['brazier', 2], ['arch', .8]],
  }[theme];
  const wsum = DECO.reduce((a, [, w]) => a + w, 0);
  const pickDeco = () => { let x = R() * wsum; for (const [k, w] of DECO) { x -= w; if (x <= 0) return k; } return DECO[0][0]; };
  for (const rm of rooms) {
    // Two lights in every room, and the arena lit all round.
    const lights = rm.kind === 'arena' ? 6 : 2;
    for (let i = 0; i < lights; i++) {
      const a = rm.kind === 'arena' ? (i + .5) / lights * Math.PI * 2 : i * Math.PI + R() * .6;
      const x = rm.cx + Math.sin(a) * (rm.w / 2 - 3), z = rm.cz + Math.cos(a) * (rm.d / 2 - 3);
      if (!nearDoor(rm, x, z) && free(x, z, 1)) { blocked.push({ x, z, r: 1 }); rm.deco.push({ k: theme === 'deep' || theme === 'crater' ? 'crystal' : 'brazier', x, z, s: 1 }); }
    }
    if (rm.kind === 'arena') {
      for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * Math.PI * 2, x = rm.cx + Math.sin(a) * 10.5, z = rm.cz + Math.cos(a) * 9.5; if (!nearDoor(rm, x, z)) { blocked.push({ x, z, r: 1.2 }); rm.deco.push({ k: ['rotwood', 'frostmere', 'thornwood', 'crater'].includes(theme) ? 'boulder' : 'pillarB', x, z, s: 1, seed: i }); } }
      continue;
    }
    if (rm.kind === 'start') continue;
    const count = Math.round(rm.w * rm.d / 55);
    for (let i = 0; i < count; i++) {
      const k = pickDeco(), p = spot(rm, 1.8, k === 'tree' || k === 'snowPine' ? 1.3 : 1.1, true);
      if (p) rm.deco.push({ k, ...p, s: .8 + R() * .6, seed: Math.floor(R() * 1000) });
    }
  }

  // Foes: two to five a room (more deeper down), fewer in side rooms, none where you start.
  const mixed = depth > THEMES.length * CHECK_EVERY;
  const pool = mixed ? [...new Set([...POOL[theme], ...POOL[theme], ...Object.values(POOL).flat()])] : POOL[theme];
  const spawns = [];
  let sid = 0;
  for (const rm of rooms) {
    if (rm.kind === 'start' || rm.kind === 'arena') continue;
    const k = rm.kind === 'side' ? 1 + (R() < .5 ? 1 : 0) : Math.min(5, 2 + Math.floor(R() * 2) + Math.floor(depth / 15) + (rm.kind === 'last' ? 1 : 0));
    for (let i = 0; i < k; i++) {
      const p = spot(rm, 3, .9); if (!p) continue;
      const s = { id: 'u' + sid++, type: pick(pool), x: p.x, z: p.z, yaw: Math.PI + (R() - .5) * 1.2 };
      if (R() < .22) s.idle = 'sleep';
      spawns.push(s);
    }
  }
  // The warlord of a fifth depth, and whatever it calls to its side.
  let bossIds = [], adds = [], phase2Line, warlord = null;
  if (boss) {
    const B = bossOf(depth), home = B.from && LEVELS[B.from];
    // Scaled with the depth, as the missions' own warlords are with theirs (balance pass).
    warlord = { hp: 1 + (sc.tier - 1) * .3, dmg: 1 + (sc.tier - 1) * .55 };
    B.types.forEach((type, i) => {
      const id = i ? 'boss' + (i + 1) : 'boss';
      spawns.push({ id, type, x: arena.cx + (B.types.length > 1 ? (i ? 4.5 : -4.5) : 0), z: arena.cz + 4 + i * 2, yaw: Math.PI, elite: 'boss' });
      bossIds.push(id);
    });
    if (B.adds && home?.adds) {
      const hb = home.spawns.find(s => s.id === [].concat(home.boss)[0]);
      adds = home.adds.map((a, i) => ({ ...a, id: 'add' + (i + 1), x: arena.cx + Math.max(-12, Math.min(12, a.x - hb.x)), z: arena.cz + 4 + Math.max(-10, Math.min(10, a.z - hb.z)) }));
    }
    phase2Line = home?.phase2Line;
  }

  // Treasure in the side rooms, and now and then shut in a crate on the way.
  const items = [], messages = [];
  const glim = Math.round(120 * depth ** 1.15);
  for (const rm of rooms.filter(r => r.kind === 'side')) {
    const p = spot(rm, 2.5, .8); if (!p) continue;
    items.push(R() < .45 ? { id: 'dew' + items.length, x: p.x, z: p.z, kind: 'dew', label: 'Moondew Draught', desc: 'one flask of Moondew filled' }
      : { id: 'glim' + items.length, x: p.x, z: p.z, kind: 'glimmer', amount: glim * 2, label: 'Glimmer Shard', desc: `+${glim * 2} Glimmer` });
  }
  const start = rooms[0];
  const tip = depth === 1 ? TIPS[0] : depth <= 4 ? TIPS[depth - 1] : pick(LORE);
  messages.push({ x: start.cx + 3.6, z: start.cz + 1.5, text: tip });

  const last = boss ? arena : rooms.find(r => r.kind === 'last');
  const xs = rooms.flatMap(r => [r.x0, r.x1]), zs = rooms.flatMap(r => [r.z0, r.z1]);
  const bounds = [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)];
  const areas = rooms.map((r, i) => ({ id: 'r' + i, name: r.name, x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 }));

  return {
    id: 'underbriar', depth, theme, boss: bossIds, isBoss: boss, lit,
    name: `The Underbriar · Depth ${depth}`, level: sc.level, tier: sc.tier, depthMul: sc.mul, warlord, seed: (seed * 131 + depth * 977) >>> 0,
    ...look.flags, fog: { color: src.fog.color, base: src.fog.base * 1.15 }, light: src.light, moon: src.moon, aurora: src.aurora, enemyGlow: (src.enemyGlow ?? .08) + .04,
    motes: { base: src.motes?.base ?? 0xc9b4ff }, leaves: src.leaves, leafColors: src.leafColors, snow: src.snow,
    phase2Line, exitToast: 'The way down opens',
    areas,
    shrines: { well: { id: 'well', name: lit ? `Moonwell of the ${depth}${['th', 'st', 'nd', 'rd'][depth % 10 > 3 || [11, 12, 13].includes(depth % 100) ? 0 : depth % 10]} Depth` : 'A Dim Moonwell', x: start.cx - 4, z: start.cz - 2.5, spawn: [start.cx - 1.8, start.cz - 1], yaw: 0, dim: !lit } },
    spawns, adds, messages, items, letters: [], pixies: [],
    seal: seal || { x: 0, z: -600, yaw: 0, width: 4, height: 4, inside: [0, -604] },
    exit: { x: last.cx, z: last.z1 - 3.5 },
    build(w) { buildFloor(w, this, look, rooms, corrs, bounds, arena, theme); },
  };
}

// Walls with gaps where the passages meet them, passage walls, floors and every piece of decor.
function buildFloor(w, L, look, rooms, corrs, bounds, arena, theme) {
  const R = w.R;
  const [bx0, bz0, bx1, bz1] = bounds;
  w.floor(bx0 - 14, bz0 - 14, bx1 + 14, bz1 + 14, look.floor, 5, -.01);
  if (arena) w.disc(arena.cx, arena.cz, 13.5, 'arena', 4.1);
  raiseRooms(w, rooms, corrs, look.edge === 'wall' ? { edge: 'wall', h: 7, mat: look.wall || 'wall', crenel: theme === 'keep' } : { edge: look.edge, h: 7.5 });
  for (const c of corrs) {
    // Briars hang over every passage.
    const n = Math.max(1, Math.round((c.ns ? c.z1 - c.z0 : c.x1 - c.x0) / 3));
    for (let i = 0; i < n; i++) {
      const u = (i + .5) / n, x = c.ns ? c.x0 + .6 + R() * .4 : c.x0 + (c.x1 - c.x0) * u, z = c.ns ? c.z0 + (c.z1 - c.z0) * u : c.z0 + .6 + R() * .4;
      w.batch(theme === 'moonspire' ? 'whitestone' : 'wood', new THREE.ConeGeometry(.12, 1.4 + R(), 5).rotateZ(Math.PI).translate(x, 6.2, z));
    }
  }
  const fire = look.fire;
  for (const rm of rooms) for (const d of rm.deco) {
    const { x, z, s = 1, seed = 1 } = d;
    switch (d.k) {
      case 'brazier': w.brazier(x, z, fire, true, 1); break;
      case 'pillar': w.pillar(x, z, .7, 7.5, false); break;
      case 'pillarB': w.pillar(x, z, .8, 8, R() < .4, theme === 'moonspire' || theme === 'court' ? 'whitestone' : 'pillar'); break;
      case 'pillarW': w.pillar(x, z, .6, 7, R() < .3, 'whitestone'); break;
      case 'pile': w.pile(x, z, [['crate', 0, 0], ['barrel', 1, .2], ['crate', .2, 1.05]].slice(0, 1 + Math.floor(R() * 3)), R() * 3); break;
      case 'urn': w.breakable('urn', x, z); break;
      case 'tree': w.tree(x, z, 5 + s * 3, seed); break;
      case 'deadTree': w.deadTree(x, z, 4 + s * 2, seed); break;
      case 'boulder': w.boulder(x, z, .8 + s * .6, seed); break;
      case 'campfire': w.campfire(x, z, 1); break;
      case 'totem': w.totem(x, z, 2.8 + s); break;
      case 'crystal': w.crystal(x, z, 1.6 + s * 1.2, [0x7fe8ff, 0xb48cff, 0x8affc8][seed % 3], seed, true); break;
      case 'crystalB': w.breakable('crystal', x, z); break;
      case 'stalagmite': w.stalagmite(x, z, 2 + s * 2.5, seed, true); break;
      case 'cart': w.cart(x, z, R() * 3, R() < .4); break;
      case 'nest': w.nest(x, z, 1 + s * .3); break;
      case 'moonpool': w.moonpool(x, z, 1.4 + s * .5); break;
      case 'arch': w.arch(x, z, R() * 3, 3.2, 4.4); break;
      case 'snowPine': w.snowPine(x, z, 5 + s * 3, seed, true); break;
      case 'snowBoulder': w.snowBoulder(x, z, .8 + s * .6, seed); break;
      case 'drift': w.drift(x, z, 1.4 + s, seed); break;
    }
  }
}
