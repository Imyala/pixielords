// Gear, as in Nioh: foes drop weapons (only of kinds you already carry) and pieces of armour. Every piece has a
// rarity (Common, Fine, Rare, Fabled, Moonlit and, from the Way of the Thorn on, Divine: the rarer, the more effects), an item level (higher in later
// missions and every New Game+) and effects rolled from a pool. A weapon's level and rarity raise its damage;
// armour's raise its defence. Armour belongs to a set, and two or four pieces of one set wake its bonuses.
// Equip it in the Gear screen; dismantle what you won't wear for Glimmer. This file is data and arithmetic:
// the Player (player.js) applies what gearStats() sums, main.js drops and picks up, menu.js shows it.

export const RARITY = [
  { name: 'Common', color: 0xc8c8c8, fx: 0, mul: 1, w: 52 },
  { name: 'Fine', color: 0x9fe07a, fx: 1, mul: 1.03, w: 30 },
  { name: 'Rare', color: 0x6ab4ff, fx: 2, mul: 1.06, w: 13 },
  { name: 'Fabled', color: 0xc88aff, fx: 3, mul: 1.1, w: 4.4 },
  { name: 'Moonlit', color: 0xffd36a, fx: 4, mul: 1.15, w: .6 },
  { name: 'Divine', color: 0xff7ad8, fx: 5, mul: 1.22, w: 0 },   // its weight comes from the Way (ways.js)
];
export const SLOTS = ['head', 'body', 'hands', 'legs'];
export const SLOT_NAME = { head: 'Helm', body: 'Mail', hands: 'Gauntlets', legs: 'Greaves' };
const BASE_DEF = { head: 9, body: 16, hands: 7, legs: 10 };

// Effects. t: how it reads ({v} is the value); r: the range it rolls in; on: weapons (w) or armour (a).
export const FX = {
  // weapons: they work while that weapon is in hand
  dmg: { t: '+{v}% damage', r: [3, 10], on: 'w' },
  dmgFull: { t: '+{v}% damage at full health', r: [6, 16], on: 'w' },
  dmgLow: { t: '+{v}% damage below a third of your health', r: [10, 25], on: 'w' },
  ki: { t: '+{v}% posture damage', r: [5, 14], on: 'w' },
  heavy: { t: '+{v}% damage with heavies and finishers', r: [5, 15], on: 'w' },
  pause: { t: '+{v}% damage with pause combos', r: [8, 20], on: 'w' },
  back: { t: '+{v}% damage from behind', r: [8, 20], on: 'w' },
  leech: { t: 'Each hit mends {v} health', r: [1, 4], on: 'w' },
  burn: { t: '{v}% chance to set foes burning', r: [5, 15], on: 'w' },
  frost: { t: '{v}% chance to frost foes, slowing them', r: [5, 15], on: 'w' },
  bleed: { t: '{v}% chance to open a bleeding wound', r: [6, 18], on: 'w' },
  exec: { t: '+{v}% damage with Executions and Flashcuts', r: [10, 25], on: 'w' },
  animaHit: { t: '+{v}% Faelight from blows', r: [8, 20], on: 'w' },
  // armour: always
  hp: { t: '+{v} health', r: [8, 30], on: 'a' },
  kiMax: { t: '+{v} stamina', r: [5, 16], on: 'a' },
  kiRegen: { t: 'Stamina returns {v}% faster', r: [5, 14], on: 'a' },
  guard: { t: 'Blocked blows cost {v}% less stamina', r: [6, 16], on: 'a' },
  dash: { t: 'Dashes cost {v}% less stamina', r: [6, 16], on: 'a' },
  fireRes: { t: '{v}% less harm from fire', r: [10, 30], on: 'a' },
  poisonRes: { t: 'Blight builds {v}% slower', r: [15, 35], on: 'a' },
  chillRes: { t: 'Chill builds {v}% slower', r: [15, 35], on: 'a' },
  moondew: { t: 'Moondew heals {v}% more', r: [8, 20], on: 'a' },
  glimmer: { t: '+{v}% Glimmer from foes', r: [5, 15], on: 'a' },
  drops: { t: 'Foes drop {v}% more gear', r: [8, 20], on: 'a' },
  deflect: { t: 'Deflects give back {v} stamina', r: [4, 12], on: 'a' },
  ward: { t: 'Blows land for {v}% less', r: [2, 6], on: 'a' },
  anima: { t: '+{v}% Faelight', r: [5, 14], on: 'a' },
  comboKeep: { t: 'The combo counter lasts {v} s longer', r: [1, 3], on: 'a' },
};
const POOL = { w: Object.keys(FX).filter(k => FX[k].on === 'w'), a: Object.keys(FX).filter(k => FX[k].on === 'a') };
export const fxText = (id, v) => FX[id].t.replace('{v}', v);

// Armour sets. two / four: the bonuses (read by player.js by set id, or, for the second act's sets, given as
// gear effects in fx2 / fx4 and simply added in); look: how the knight's armour, cloak and trim are coloured
// while its mail is worn.
export const SETS = {
  errant: { name: 'Knight-Errant\'s', two: '+10 stamina', four: '+20 health', look: { steel: 0xb4bccb, cloth: 0x3a2358, trim: 0xd6ac52 },
    desc: 'The fae knight\'s own harness, plain and well kept.' },
  warden: { name: 'Gatewarden\'s', two: 'Blocked blows cost 15% less stamina', four: 'Deflects give back 20 more stamina', look: { steel: 0x7d8494, cloth: 0x5a3a24, trim: 0xb08850 },
    desc: 'Goblin plate hammered from the Grubhold\'s gate-iron.' },
  stalker: { name: 'Rotwood Stalker\'s', two: '+15% damage from behind', four: 'Strikes from behind open a bleeding wound', look: { steel: 0x6c7a58, cloth: 0x2e4a2a, trim: 0x9aa860 },
    desc: 'Moss-dark leather and bark scale, for walking the Rotwood unseen.' },
  delver: { name: 'Deepdelver\'s', two: '40% less harm from fire', four: 'Below half health: +12% damage, and stamina returns 25% faster', look: { steel: 0x9a6a48, cloth: 0x6a2a1a, trim: 0xe08a40 },
    desc: 'Tunnel-warrior\'s copper and soot, proof against the Deep\'s fires.' },
  pilgrim: { name: 'Moon Pilgrim\'s', two: '+15% Faelight', four: 'Fae Shift lasts 5 s longer, and strikes in it hit 15% harder', look: { steel: 0xdfe6f4, cloth: 0x9fb8e8, trim: 0xe8e8ff },
    desc: 'The silvered mail of the monks who climbed the Moonspire.' },
  winter: { name: 'Winter Court', two: 'Chill builds half as fast', four: 'One strike in five frosts foes, slowing them', look: { steel: 0xa8d4f0, cloth: 0xe8f4ff, trim: 0x9fe8ff },
    desc: 'Rime-bright plate of the Frostmere\'s court.' },
  tidemonk: { name: 'Tide-Monk\'s', two: 'Chill builds half as fast', four: 'Moondew heals 30% more, and stamina returns 10% faster', fx2: [['chillRes', 50]], fx4: [['moondew', 30], ['kiRegen', 10]],
    look: { steel: 0x7a9a94, cloth: 0x1e3a3a, trim: 0x9ac8b8 }, desc: 'The sea-green habit and mail of the Drowned Abbey\'s brothers.' },
  ironwright: { name: 'Ironwright\'s', two: '40% less harm from fire', four: '+12% damage with heavies and finishers, +15% posture damage', fx2: [['fireRes', 40]], fx4: [['heavy', 12], ['ki', 15]],
    look: { steel: 0x4a4a52, cloth: 0x3a1a10, trim: 0xd07a2a }, desc: 'Forge-black plate, riveted and scorched, from the Emberforge.' },
  courtier: { name: 'Thornwood Courtier\'s', two: '+15% damage from behind', four: 'One strike in six opens a bleeding wound', fx2: [['back', 15]], fx4: [['bleed', 16]],
    look: { steel: 0x6a4a5a, cloth: 0x3a1a2a, trim: 0xf0a0c0 }, desc: 'The rose-worked harness of the Lantern Court\'s own knights.' },
  starfallen: { name: 'Starfallen', two: '+20% Faelight', four: '+10% damage, and 10% more Glimmer', fx2: [['anima', 20]], fx4: [['dmg', 10], ['glimmer', 10]],
    look: { steel: 0x7a6aa8, cloth: 0x2a1a4a, trim: 0xd8c8ff }, desc: 'Plate of moon-glass and star-iron from the Starfall Crater.' },
  waning: { name: 'Waning Guard\'s', two: '+40 health', four: 'Blows land 6% lighter, and strikes at full health hit 10% harder', fx2: [['hp', 40]], fx4: [['ward', 6], ['dmgFull', 10]],
    look: { steel: 0xe8ecf8, cloth: 0x2a2a5a, trim: 0xf0f0ff }, desc: 'Silver plate of the Waning Queen\'s own guard.' },
  // The third act, on the moon.
  selenite: { name: 'Selenite', two: '+15% Faelight, and stamina returns 10% faster', four: 'Moondew heals 30% more, and +60 health', fx2: [['anima', 15], ['kiRegen', 10]], fx4: [['moondew', 30], ['hp', 60]],
    look: { steel: 0xd8dce8, cloth: 0x2a3a5a, trim: 0xa8c8ff }, desc: 'Moon-silver plate from the lighthouse on the Silver Shore.' },
  geode: { name: 'Geodeborn', two: 'Chill builds half as fast', four: '+15% posture damage, and blocked blows cost 20% less stamina', fx2: [['chillRes', 50]], fx4: [['ki', 15], ['guard', 20]],
    look: { steel: 0x7aa8b8, cloth: 0x1a3a48, trim: 0x8ff0ff }, desc: 'Crystal-grown mail from the Hollows of Selene.' },
  firstfae: { name: 'First Fae\'s', two: '+15% damage from behind', four: 'Deflects give back 20 more stamina, and Executions hit 20% harder', fx2: [['back', 15]], fx4: [['deflect', 20], ['exec', 20]],
    look: { steel: 0xa8a0b8, cloth: 0x2a2238, trim: 0xd8c8ff }, desc: 'The burial harness of the first fae, pale as the tombs.' },
  umbral: { name: 'Umbral', two: '+12% damage below a third of health', four: '+12% damage, and one strike in six opens a bleeding wound', fx2: [['dmgLow', 12]], fx4: [['dmg', 12], ['bleed', 16]],
    look: { steel: 0x2a2638, cloth: 0x16122a, trim: 0x7a5ab8 }, desc: 'Black plate from the moon\'s dark side, cold to the touch.' },
  eclipse: { name: 'Eclipse', two: '+20% Faelight, and 10% more Glimmer', four: '+15% damage, and blows land 8% lighter', fx2: [['anima', 20], ['glimmer', 10]], fx4: [['dmg', 15], ['ward', 8]],
    look: { steel: 0x1a1620, cloth: 0x0e0a14, trim: 0xffc860 }, desc: 'Plate of the Eclipse\'s knights: dark, ringed in fire.' },
};
// What each mission drops: its set (most of the time) and the item levels it rolls in.
export const MISSION_GEAR = {
  keep: { set: 'warden', lvl: [1, 6] },
  rotwood: { set: 'stalker', lvl: [8, 14] },
  deep: { set: 'delver', lvl: [16, 22] },
  moonspire: { set: 'pilgrim', lvl: [24, 30] },
  frostmere: { set: 'winter', lvl: [32, 38] },
  abbey: { set: 'tidemonk', lvl: [40, 46] },
  forge: { set: 'ironwright', lvl: [48, 54] },
  thornwood: { set: 'courtier', lvl: [56, 62] },
  crater: { set: 'starfallen', lvl: [64, 70] },
  court: { set: 'waning', lvl: [72, 78] },
  shore: { set: 'selenite', lvl: [80, 86] },
  hollows: { set: 'geode', lvl: [88, 94] },
  necropolis: { set: 'firstfae', lvl: [96, 102] },
  umbra: { set: 'umbral', lvl: [104, 110] },
  heart: { set: 'eclipse', lvl: [112, 118] },
};
const EPITHET = ['of the Waning Moon', 'of Thornfall', 'the Gnawbane', 'of the Silver Hour', 'of the Last Lantern', 'the Rimecaller', 'of Nine Wings', 'the Briarheart'];

// Multipliers: a weapon's damage, a piece's defence.
export const weaponMul = it => (it ? (1 + (it.lvl - 1) * .012) * RARITY[it.rar].mul : 1);
export const armorDef = it => (it ? Math.round(BASE_DEF[it.slot] * (1 + (it.lvl - 1) * .07) * RARITY[it.rar].mul) : 0);
// Defence to damage: a quarter off at about 130 defence, never more than half.
export const defReduce = def => Math.min(.5, def / (def + 400));
export const dismantleValue = it => Math.round((20 + it.lvl * 6) * (1 + it.rar * .8));

// A rarity, rolled: better foes (luck > 0) shift it upward; divine is Divine gear's weight (ways.js).
export function rollRarity(luck = 0, rnd = Math.random, divine = 0) {
  const w = RARITY.map((r, i) => (i === 5 ? divine : r.w) * (1 + Math.max(0, luck) * i * .8));
  let x = rnd() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { x -= w[i]; if (x <= 0) return i; }
  return 0;
}
// A new piece: kind 'weapon' (type: a weapon id) or 'armor' (slot, set). Effects never repeat on one piece.
export function makeItem({ kind, type, slot, set, lvl, rar }, uid, rnd = Math.random) {
  const pool = [...POOL[kind === 'weapon' ? 'w' : 'a']], fx = [];
  for (let i = 0; i < RARITY[rar].fx && pool.length; i++) {
    const id = pool.splice(Math.floor(rnd() * pool.length), 1)[0], [a, b] = FX[id].r;
    fx.push([id, Math.round(a + (b - a) * rnd() * (.75 + rar * .08))]);
  }
  const it = { uid, kind, lvl, rar, fx };
  if (kind === 'weapon') it.type = type; else { it.slot = slot; it.set = set; }
  if (rar >= 3) it.epithet = EPITHET[Math.floor(rnd() * EPITHET.length)];
  return it;
}
// The starting harness: four Common pieces of the Knight-Errant's set.
export const startingArmor = (uid0 = 1) => SLOTS.map((slot, i) => ({ uid: uid0 + i, kind: 'armor', slot, set: 'errant', lvl: 1, rar: 0, fx: [] }));

export function itemName(it, weaponName = id => id) {
  const base = it.kind === 'weapon' ? weaponName(it.type) : `${SETS[it.set].name} ${SLOT_NAME[it.slot]}`;
  return `${it.rar ? RARITY[it.rar].name + ' ' : ''}${base}${it.epithet ? ' ' + it.epithet : ''}`;
}

// Everything worn and the weapon in hand, summed: effects by id, total defence, pieces per set, and which
// set bonuses are awake ('warden2', 'warden4', ...).
export function gearStats(items, equip, weaponType) {
  const by = new Map(items.map(it => [it.uid, it]));
  const out = { fx: {}, def: 0, sets: {}, bonus: new Set(), weapon: null };
  const add = it => { for (const [id, v] of it.fx) out.fx[id] = (out.fx[id] || 0) + v; };
  for (const slot of SLOTS) {
    const it = by.get(equip.armor?.[slot]);
    if (!it) continue;
    out.def += armorDef(it); add(it);
    out.sets[it.set] = (out.sets[it.set] || 0) + 1;
  }
  for (const [s, n] of Object.entries(out.sets)) {
    if (n >= 2) { out.bonus.add(s + '2'); add({ fx: SETS[s].fx2 || [] }); }
    if (n >= 4) { out.bonus.add(s + '4'); add({ fx: SETS[s].fx4 || [] }); }
  }
  const w = by.get(equip.weapons?.[weaponType]);
  if (w) { out.weapon = w; add(w); }
  return out;
}

// The Moonwell's forge. Reforging rerolls one effect into another the piece doesn't carry (at a value for its
// rarity); soul-matching raises a piece's level to that of another of its kind, which is consumed.
export const reforgeCost = it => Math.round((300 + it.lvl * 45) * (1 + it.rar * .6));
export function rerollFx(it, i, rnd = Math.random) {
  const pool = POOL[it.kind === 'weapon' ? 'w' : 'a'].filter(id => !it.fx.some(([f], k) => f === id && k !== i));
  const id = pool[Math.floor(rnd() * pool.length)], [a, b] = FX[id].r;
  return [id, Math.round(a + (b - a) * rnd() * (.75 + it.rar * .08))];
}
export const soulMatchCost = (it, to) => Math.round(Math.max(1, to.lvl - it.lvl) * 110 * (1 + it.rar * .5));
