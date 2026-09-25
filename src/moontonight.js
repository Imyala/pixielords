// The Moon Tonight: the game's moon follows the real one. Its phase, worked out from the date and the length of
// a lunar month, is drawn in every sky and lends each mission a small blessing (on a new moon, a hazard as
// well); and each night three of the missions you have opened lie under an omen, the same three for everyone
// that night, as Nioh's rotating Twilight missions are. main.js works it out when a mission begins or the map
// opens (G.tonight); the player, loot, champions, enemies and menus read it. It can be turned off in Settings.
import { rng } from './util.js';

const SYNODIC = 29.530588853;              // days from one new moon to the next
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);   // a known new moon
export const moonAge = (t = Date.now()) => { const d = (t - NEW_MOON) / 864e5; return ((d % SYNODIC) + SYNODIC) % SYNODIC; };

// fx: gear effects lent to the knight (gear.js); foeDmg, champ, drops, luck, cores: the world's odds.
export const PHASES = [
  { id: 'new', name: 'New Moon', desc: 'In the dark, foes hit 10% harder, and Soul Cores fall twice as often.', foeDmg: 1.1, cores: 2 },
  { id: 'waxcres', name: 'Waxing Crescent', desc: 'Faelight fills 10% faster.', fx: [['anima', 10]] },
  { id: 'firstq', name: 'First Quarter', desc: 'Stamina returns 10% faster.', fx: [['kiRegen', 10]] },
  { id: 'waxgib', name: 'Waxing Gibbous', desc: '10% more Glimmer.', fx: [['glimmer', 10]] },
  { id: 'full', name: 'Full Moon', desc: 'Champions rise half again as often, gear drops more often, and 15% more Glimmer.', champ: 1.5, drops: 1.4, fx: [['glimmer', 15]] },
  { id: 'wangib', name: 'Waning Gibbous', desc: 'Moondew heals 15% more.', fx: [['moondew', 15]] },
  { id: 'lastq', name: 'Last Quarter', desc: 'Deflects give back 10 more stamina.', fx: [['deflect', 10]] },
  { id: 'wancres', name: 'Waning Crescent', desc: 'Gear drops a little rarer.', luck: .3 },
];
export function phaseOf(t = Date.now()) {
  const age = moonAge(t), frac = age / SYNODIC;
  return { age, frac, lit: (1 - Math.cos(frac * Math.PI * 2)) / 2, index: Math.floor(frac * 8 + .5) % 8, ...PHASES[Math.floor(frac * 8 + .5) % 8] };
}

export const OMENS = {
  harvest: { name: 'Harvest Moon', desc: 'Half again as much Glimmer.', glimmer: 1.5, css: '#ffc860' },
  blood: { name: 'Blood Moon', desc: 'Champions rise twice as often, and gear drops rarer.', champ: 2, luck: .6, css: '#ff6a6a' },
  hunter: { name: 'Hunter\'s Moon', desc: 'Soul Cores fall three times as often, and gear more often.', cores: 3, drops: 1.6, css: '#9fffe8' },
};
const OMEN_ORDER = ['harvest', 'blood', 'hunter'];
// The night's three omens, among the missions given: { missionId: omenId }. A night runs from noon to noon.
export function omensOf(t = Date.now(), missions = []) {
  const night = new Date(t - 12 * 36e5), key = night.getFullYear() * 10000 + (night.getMonth() + 1) * 100 + night.getDate();
  const R = rng((key * 2654435761) >>> 0), pool = [...missions].sort(), out = {};
  for (const om of OMEN_ORDER) { if (!pool.length) break; out[pool.splice(Math.floor(R() * pool.length), 1)[0]] = om; }
  return out;
}

// Tonight, for a save and a mission: the phase, the omens, and the mission's own omen; null when turned off.
export function tonight(settings, unlocked, missionId, t = Date.now()) {
  if (settings?.realMoon === false) return null;
  const phase = phaseOf(t), omens = omensOf(t, unlocked), omen = OMENS[omens[missionId]] || null;
  const k = key => (phase[key] || 1) * (omen?.[key] || 1);
  return { phase, omens, omen, omenId: omens[missionId] || null, foeDmg: phase.foeDmg || 1, champ: k('champ'), drops: k('drops'), cores: k('cores'), glimmer: omen?.glimmer || 1, luck: (phase.luck || 0) + (omen?.luck || 0) };
}
