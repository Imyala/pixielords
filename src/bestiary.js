// The Bestiary, as Nioh's Encyclopedia: every foe of the fifteen missions, where it is met, what it does, what it
// leaves, and how many you have felled (main.js counts them in d.beast). A foe is known once felled, or once its
// mission is cleared. menu.js shows it, act by act.
import { TYPES } from './enemies.js';
import { LEVELS, ORDER } from './levels/index.js';
import { CORES, CORE_OF } from './cores.js';
import { SIDES } from './sides.js';

export const ACTS = ['The Fae Wood', 'The Lantern Court', 'The Moon'];
const ROLE_ORDER = { Foe: 0, Elite: 1, Gatekeeper: 2, Warlord: 3, Revenant: 4 };
export const ROLE_COLOR = { Foe: '#e9e1cb', Elite: '#9fd0ff', Gatekeeper: '#ffc860', Warlord: '#ff8a70', Revenant: '#c8a0ff' };

let LIST = null;
// Every foe placed in a mission (or waiting in a Duel), with its missions, act and role.
export function bestiary() {
  if (LIST) return LIST;
  const by = new Map();
  const add = (type, mission, how) => {
    if (!TYPES[type] || type.startsWith('revenant-fallen')) return;
    const B = by.get(type) || by.set(type, { id: type, T: TYPES[type], missions: [], how: new Set() }).get(type);
    if (!B.missions.includes(mission)) B.missions.push(mission);
    if (how) B.how.add(how);
  };
  for (const id of ORDER) {
    const L = LEVELS[id];
    for (const s of [...L.spawns, ...(L.adds || [])]) add(s.type, id, s.id === L.gate?.guardian ? 'Gatekeeper' : [].concat(L.boss).includes(s.id) ? 'Warlord' : null);
  }
  for (const S of Object.values(SIDES)) if (S.foe) add(S.foe, S.mission, 'Revenant');
  LIST = [...by.values()].map(B => {
    const T = B.T, role = B.id.startsWith('revenant-') ? 'Revenant' : T.boss || B.how.has('Warlord') ? 'Warlord' : B.how.has('Gatekeeper') ? 'Gatekeeper' : T.elite ? 'Elite' : 'Foe';
    const first = Math.min(...B.missions.map(m => ORDER.indexOf(m)));
    return { id: B.id, T, role, missions: B.missions.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)), act: Math.min(2, Math.floor(first / 5)), first };
  }).sort((a, b) => a.act - b.act || ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.first - b.first || a.T.name.localeCompare(b.T.name));
  return LIST;
}

// Its ways, in words.
export function traits(T) {
  const out = [];
  if (T.style === 'ranged') out.push('Keeps its distance and shoots');
  if (T.parry) out.push('Turns quick cuts aside and answers at once');
  if (T.shield) out.push('Guards behind a shield: heavies and Flashcuts break through');
  if (T.evasive) out.push('Sidesteps what it sees coming');
  if (T.armor) out.push(T.armor.start ? 'Armoured from the first: break it with heavies' : 'Rimes over in its rage');
  if (T.duo) out.push('Fights beside a partner, and grieves when it falls');
  if (T.shade) out.push('A shadow: strikes pass through it now and then');
  if ((T.aggro || .7) >= .9) out.push('Presses hard, and rarely waits');
  if (T.roarHazard === 'fire') out.push('Its rage leaves the ground burning');
  if (T.roarHazard === 'frost') out.push('Its rage leaves the ground freezing');
  return out;
}
export const coreOf = id => CORES[CORE_OF[id]] || null;
export const artsOf = T => [...new Set([...(T.attacks || []), ...(T.phase2 || [])].map(a => a.name))];
// Known: felled at least once, or its mission cleared.
export const known = (d, B) => (d.beast?.[B.id] || 0) > 0 || B.missions.some(m => d.missions?.[m]?.cleared);
