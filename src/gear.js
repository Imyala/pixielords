// Gear, as in Nioh: foes drop weapons (only of kinds you already carry) and pieces of armour. Every piece has a
// rarity (Common, Fine, Rare, Fabled, Moonlit: the rarer, the more effects), an item level (higher in later
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

// Armour sets. two / four: the bonuses (read by player.js by set id); look: how the knight's armour, cloak
// and trim are coloured while its mail is worn.
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
};
// What each mission drops: its set (most of the time) and the item levels it rolls in.
export const MISSION_GEAR = {
  keep: { set: 'warden', lvl: [1, 6] },
  rotwood: { set: 'stalker', lvl: [8, 14] },
  deep: { set: 'delver', lvl: [16, 22] },
  moonspire: { set: 'pilgrim', lvl: [24, 30] },
  frostmere: { set: 'winter', lvl: [32, 38] },
};
const EPITHET = ['of the Waning Moon', 'of Thornfall', 'the Gnawbane', 'of the Silver Hour', 'of the Last Lantern', 'the Rimecaller', 'of Nine Wings', 'the Briarheart'];

// Multipliers: a weapon's damage, a piece's defence.
export const weaponMul = it => (it ? (1 + (it.lvl - 1) * .012) * RARITY[it.rar].mul : 1);
export const armorDef = it => (it ? Math.round(BASE_DEF[it.slot] * (1 + (it.lvl - 1) * .07) * RARITY[it.rar].mul) : 0);
// Defence to damage: a quarter off at about 130 defence, never more than half.
export const defReduce = def => Math.min(.5, def / (def + 400));
export const dismantleValue = it => Math.round((20 + it.lvl * 6) * (1 + it.rar * .8));

// A rarity, rolled: better foes (luck > 0) shift it upward.
export function rollRarity(luck = 0, rnd = Math.random) {
  const w = RARITY.map((r, i) => r.w * (1 + luck * i * .8));
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
  for (const [s, n] of Object.entries(out.sets)) { if (n >= 2) out.bonus.add(s + '2'); if (n >= 4) out.bonus.add(s + '4'); }
  const w = by.get(equip.weapons?.[weaponType]);
  if (w) { out.weapon = w; add(w); }
  return out;
}
