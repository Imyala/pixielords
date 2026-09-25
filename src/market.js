// The Hidden Market, as Nioh's Hidden Teahouse: a pixie pedlar keeps a stall at every Moonwell and takes
// Moonpetals only. Moonpetals come from Revenants laid to rest at their graves (graves.js), Duels and other side
// missions, Deeds, warlords felled the first time and the Underbriar's warlords. The wares change every night
// (noon to noon, the same for everyone that night, as the Moon Tonight's omens do) and follow how far you have
// come: gear of the sets of missions you have opened, Fabled or finer; provisions (Moon Cups among them); dyes for the Wardrobe
// (wardrobe.js). What you buy is gone until the next night. main.js sells; menu.js shows the stall.
import { rng } from './util.js';
import { makeItem, SLOTS, MISSION_GEAR } from './gear.js';
import { CORES, CORE_MAX } from './cores.js';
import { DYES, DYE_ORDER, FREE_DYES } from './wardrobe.js';
import { wayLvl, wayGlimmer } from './ways.js';
import { CUP_MAX } from './kindred.js';

// A night runs from noon to noon (as moontonight.js's omens).
export const nightOf = (t = Date.now()) => { const n = new Date(t - 12 * 36e5); return n.getFullYear() * 10000 + (n.getMonth() + 1) * 100 + n.getDate(); };
export const MARKET_TABS = [{ id: 'gear', name: 'Arms & Armour' }, { id: 'prov', name: 'Provisions' }, { id: 'dyes', name: 'Dyes' }];
export const VIAL_MAX = 10;   // Moondew flasks the Market's vials can raise you to
const GEAR_PRICE = [0, 0, 0, 26, 52, 96];   // by rarity, before the level's share

// The night's wares for a save: { gear: [...], prov: [...], dyes: [...] }, each ware { key, price, ... }.
// key names it in d.market.sold; gear wares carry the piece itself (it, without a uid until bought).
export function wares(d, t = Date.now()) {
  const night = nightOf(t), order = Object.keys(MISSION_GEAR), open = order.filter(id => d.unlocked.includes(id));
  const top = open.length ? open[open.length - 1] : 'keep', ng = d.ng || 0;
  const R = rng((night * 2654435761 + open.length * 97 + ng * 131) >>> 0 || 1), pick = a => a[Math.floor(R() * a.length)];
  const lvl = MISSION_GEAR[top].lvl[1] + wayLvl(ng);
  // Arms and armour: six pieces, most of the latest sets you have reached.
  const gear = [];
  for (let i = 0; i < 6; i++) {
    const recent = open.slice(-3), set = MISSION_GEAR[R() < .7 ? pick(recent) : pick(open)]?.set || 'errant';
    const rar = ng && R() < .18 ? 5 : R() < .34 ? 4 : 3;
    const weapon = R() < .35 && d.arms.length ? pick([...d.arms].sort()) : null;
    const it = makeItem(weapon ? { kind: 'weapon', type: weapon, lvl, rar } : { kind: 'armor', slot: pick(SLOTS), set, lvl, rar }, 0, R);
    gear.push({ key: `g${i}`, it, price: GEAR_PRICE[rar] + Math.round(lvl / 5) });
  }
  // Provisions.
  const vials = d.vials || 0;
  const prov = [
    { key: 'vial', kind: 'vial', name: 'Moondew Vial', desc: `One more draught of Moondew, for good (up to ${VIAL_MAX}).`, price: 40 + vials * 25, off: d.elixirMax >= VIAL_MAX },
    ...[0, 1, 2].map(k => ({ key: `purse${k}`, kind: 'purse', name: 'Purse of Glimmer', desc: 'Glimmer, as much as a good night\'s hunting where you have reached.', price: 8, glimmer: Math.round(700 * (1 + open.length * .9) * wayGlimmer(ng)) })),
  ];
  prov.push(...[0, 1, 2].map(k => ({ key: `cup${k}`, kind: 'cup', name: 'Moon Cup', desc: 'Pour it out at a Moonwell (Kinship) and a kindred fae knight answers, to fight beside you.', price: 5, off: (d.cups ?? 0) >= CUP_MAX })));
  const held = Object.keys(d.cores || {}).filter(id => CORES[id] && d.cores[id] < CORE_MAX).sort();
  if (held.length) { const id = pick(held); prov.push({ key: 'core', kind: 'core', core: id, name: CORES[id].name, desc: `A second ${CORES[id].name}, to fuse into the one you hold.`, price: CORES[id].boss ? 40 : 22 }); }
  prov.push({ key: 'lantern', kind: 'lantern', name: 'Grave Lantern', desc: 'Lit at a Moonwell, it wakes every grave in this mission at once, each with a new Revenant, without waiting for a rest.', price: 8, repeat: true });
  // Dyes: five of the night's (one already yours shows as owned).
  const pool = DYE_ORDER.filter(id => !FREE_DYES.includes(id)), dyes = [];
  for (let i = 0; i < 5; i++) { const id = pool.splice(Math.floor(R() * pool.length), 1)[0]; dyes.push({ key: `dye:${id}`, kind: 'dye', dye: id, name: `${DYES[id].name} Dye`, price: DYES[id].price, owned: (d.dyes || []).includes(id) }); }
  return { night, gear, prov, dyes };
}
