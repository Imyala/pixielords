// Deeds: long goals, as Nioh's titles and achievements are, tallied across every mission, Way and depth.
// Each has three tiers; reaching one pays Glimmer and grants a small bonus for good (a gear effect, gear.js,
// added to the knight's). main.js keeps the tallies (d.tally) and the tiers earned (d.deeds); menu.js lists them.
export const DEEDS = [
  { id: 'goblinbane', name: 'Goblinbane', desc: 'Goblins felled', tally: 'goblin', tiers: [100, 400, 1500], fx: ['ki', 3] },
  { id: 'ratcatcher', name: 'Ratcatcher', desc: 'Ratmen felled', tally: 'ratman', tiers: [100, 400, 1500], fx: ['back', 4] },
  { id: 'knightfall', name: 'Knightfall', desc: 'Fae knights gone over to the Queen, felled', tally: 'knight', tiers: [25, 150, 600], fx: ['dmgFull', 3] },
  { id: 'championslayer', name: 'Championslayer', desc: 'Champions felled', tally: 'champion', tiers: [10, 60, 250], fx: ['drops', 5] },
  { id: 'gatebreaker', name: 'Gatebreaker', desc: 'Gatekeepers felled', tally: 'gatekeeper', tiers: [5, 20, 60], fx: ['kiMax', 10] },
  { id: 'warlordsbane', name: 'Warlord\'s Bane', desc: 'Warlords felled', tally: 'warlord', tiers: [5, 20, 60], fx: ['hp', 20] },
  { id: 'echolayer', name: 'Echo-Layer', desc: 'Revenants laid to rest', tally: 'revenant', tiers: [3, 10, 30], fx: ['deflect', 3] },
  { id: 'deflector', name: 'The Unmoved', desc: 'Blows Deflected', tally: 'deflects', tiers: [50, 300, 1500], fx: ['guard', 4] },
  { id: 'flashcutter', name: 'Flashcutter', desc: 'Flashcuts landed', tally: 'flashcuts', tiers: [25, 150, 600], fx: ['exec', 5] },
  { id: 'executioner', name: 'Executioner', desc: 'Executions and Ambushes', tally: 'executions', tiers: [25, 150, 600], fx: ['heavy', 4] },
  { id: 'marksman', name: 'Marksman', desc: 'Arrows, shot and shells that found their mark', tally: 'ranged', tiers: [50, 300, 1200], fx: ['dmgLow', 5] },
  { id: 'artful', name: 'Artful', desc: 'Fae Arts used', tally: 'arts', tiers: [30, 200, 800], fx: ['dash', 4] },
  { id: 'wayfarer', name: 'Wayfarer', desc: 'Missions cleared', tally: 'missions', tiers: [5, 15, 40], fx: ['glimmer', 5] },
  { id: 'sidewalker', name: 'Side-Walker', desc: 'Side missions completed', tally: 'sides', tiers: [5, 20, 60], fx: ['moondew', 5] },
  { id: 'deepdiver', name: 'Deepdiver', desc: 'Deepest Underbriar depth cleared', tally: 'depth', max: true, tiers: [10, 30, 75], fx: ['anima', 5] },
  { id: 'pixiefriend', name: 'Pixie-Friend', desc: 'Lost Pixies freed', tally: 'pixies', max: true, tiers: [15, 30, 50], fx: ['kiRegen', 4] },
  { id: 'lorekeeper', name: 'Lorekeeper', desc: 'Letters read', tally: 'letters', max: true, tiers: [12, 25, 40], fx: ['animaHit', 5] },
  { id: 'salvager', name: 'Salvager', desc: 'Pieces of gear dismantled', tally: 'dismantled', tiers: [50, 250, 1000], fx: ['glimmer', 4] },
  { id: 'soulbinder', name: 'Soulbinder', desc: 'Soul Cores fused', tally: 'fused', tiers: [5, 25, 80], fx: ['anima', 4] },
  { id: 'reforged', name: 'Smith of the Moonwell', desc: 'Gear reforged or soul-matched', tally: 'smithed', tiers: [10, 50, 200], fx: ['ki', 3] },
  { id: 'wayward', name: 'Walker of Ways', desc: 'Ways walked (New Game+ cycles begun)', tally: 'ways', max: true, tiers: [1, 2, 3], fx: ['dmg', 3] },
  { id: 'moondrinker', name: 'Moondrinker', desc: 'Draughts of Moondew', tally: 'moondew', tiers: [25, 150, 600], fx: ['moondew', 5] },
  { id: 'hoarder', name: 'Glimmer-Hoarder', desc: 'Glimmer taken from fallen foes', tally: 'glimmer', tiers: [100000, 1000000, 10000000], fx: ['glimmer', 3] },
  { id: 'patronbound', name: 'Patron-Bound', desc: 'Patron Spirits freed', tally: 'patrons', max: true, tiers: [3, 8, 15], fx: ['anima', 4] },
  { id: 'undying', name: 'Undying', desc: 'Falls (and rises)', tally: 'deaths', tiers: [10, 50, 200], fx: ['hp', 10] },
  { id: 'gravewarden', name: 'Gravewarden', desc: 'Revenants laid to rest at their graves', tally: 'graves', tiers: [5, 25, 100], fx: ['exec', 4] },
  { id: 'lightbringer', name: 'Lightbringer', desc: 'Umbral Realms dispelled', tally: 'realms', tiers: [3, 15, 50], fx: ['anima', 4] },
  { id: 'kinsman', name: 'Kinsman', desc: 'Kindred Spirits called', tally: 'kindred', tiers: [3, 15, 50], fx: ['hp', 10] },
  { id: 'yardtrained', name: 'Yard-Trained', desc: 'Trials of the Thornyard passed', tally: 'trials', max: true, tiers: [5, 10, 15], fx: ['kiRegen', 3] },
  { id: 'pedlarsfriend', name: 'Pedlar\'s Friend', desc: 'Wares bought at the Hidden Market', tally: 'bought', tiers: [5, 30, 120], fx: ['drops', 4] },
];
export const TIER = ['I', 'II', 'III'];
export const DEED_GLIMMER = [2500, 12000, 50000];
export const deedTier = (D, n) => D.tiers.filter(t => n >= t).length;
// The bonuses of every tier earned, summed as gear effects.
export function deedFx(earned = {}) {
  const out = {};
  for (const D of DEEDS) { const n = earned[D.id] || 0; if (n) out[D.fx[0]] = (out[D.fx[0]] || 0) + D.fx[1] * n; }
  return out;
}
