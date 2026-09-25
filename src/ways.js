// The Ways: every New Game+ cycle is a Way, as Nioh's difficulties are (Way of the Strong, the Demon, the Wise).
// Each asks more of you and pays more: foes are hardier and hit harder (main.js, enemies.js), Champions rise
// more often and with more affixes (champions.js), gear drops at higher levels, and from the Way of the Thorn
// on, Divine gear, the rarest of all (gear.js, loot.js). A new Way keeps everything you carry.
export const WAYS = [
  { name: 'Way of the Knight', desc: 'The first walk through the realm.' },
  { name: 'Way of the Thorn', desc: 'Foes are hardier and hit harder. Champions rise more often, and Divine gear can be found.' },
  { name: 'Way of the Moon', desc: 'Foes are hardier still. Champions carry two affixes, and Divine gear is found more often.' },
  { name: 'Way of the Fae Lord', desc: 'The hardest road. Champions carry up to three affixes, and the best gear waits at its end.' },
];
export const wayName = ng => ng < WAYS.length ? WAYS[ng].name : `${WAYS[WAYS.length - 1].name} +${ng - WAYS.length + 1}`;
export const wayDesc = ng => WAYS[Math.min(ng, WAYS.length - 1)].desc + (ng >= WAYS.length ? ' And harder again, every time.' : '');
// Divine gear's weight in a rarity roll (0 on the first Way).
export const divineWeight = (ng, depth = 0) => (ng ? .35 * ng : 0) + (depth >= 25 ? (depth - 20) * .03 : 0);
