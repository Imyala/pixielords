// Side missions, as in Nioh's sub-missions: once a mission is cleared, its landmark on the Fae Crossroads
// offers three more, each replayable.
//   Twilight: the whole mission again under a blood moon. Every foe is hardier and hits harder, and drops
//     better and higher-level gear. Felling the warlord ends it.
//   Hunt: the gatekeeper has come back, stronger, with only the foes that guard its gate. It starts at the
//     mission's second Moonwell, the gate already open.
//   Duel: a Revenant, the echo of a fae knight who fell here before you, waits in the warlord's arena and
//     fights with the weapon it carried, stroke for stroke as you would. The way to it is quiet.
// A side run keeps its own Moonwells and fallen foes (save.js: d.side, d.sideRun) and leaves the mission's
// own state alone. main.js runs it; loot.js reads lvl and luck; menu.js lists them on the map.

export const SIDE_KINDS = {
  twilight: { name: 'Twilight', banner: 'TWILIGHT CLEARED', hard: 1.6, luck: .9, lvl: 8 },
  hunt: { name: 'Hunt', banner: 'HUNT COMPLETE', hard: 1.25, luck: .5, lvl: 4 },
  duel: { name: 'Duel', banner: 'REVENANT LAID TO REST', hard: 1, luck: .7, lvl: 6 },
};

const side = (mission, kind, o) => ({ mission, kind, ...SIDE_KINDS[kind], kindName: SIDE_KINDS[kind].name, ...o, id: `${mission}-${kind}` });

export const SIDES = Object.fromEntries([
  side('keep', 'twilight', { name: 'Twilight: The Grubhold at Moonset', desc: 'The moon sets red over the Grubhold, and the goblins are bolder for it.', glimmer: 2400, minRar: 3 }),
  side('keep', 'hunt', { name: 'Hunt: Grubskull Returns', desc: 'Gatewarden Grubskull has hammered a new helm and wants his gate back.', target: 'warden', hp: 2.2, dmg: 1.3, glimmer: 1400, minRar: 2 }),
  side('keep', 'duel', { name: 'Duel: Sir Aldric Thornwake', desc: 'A knight of the Thorn Court fell in the Grubhold\'s pit. His echo still guards it with the greatblade he carried.', foe: 'revenant-thornwake', glimmer: 2000, minRar: 3 }),

  side('rotwood', 'twilight', { name: 'Twilight: The Rotwood Burning', desc: 'Every fire in the Hollow is lit at once. The wood-goblins dance round them.', glimmer: 4200, minRar: 3 }),
  side('rotwood', 'hunt', { name: 'Hunt: Brakka\'s Second Skull', desc: 'Brakka the Skullsplitter crawled out of the mud with a grudge and a bigger axe.', target: 'brakka', hp: 2.1, dmg: 1.3, glimmer: 2600, minRar: 2 }),
  side('rotwood', 'duel', { name: 'Duel: Sister Hollowmoon', desc: 'The swordswoman who first went into the Rotwood never came out. Her echo waits, blade sheathed.', foe: 'revenant-hollowmoon', glimmer: 3600, minRar: 3 }),

  side('deep', 'twilight', { name: 'Twilight: The Deep Aflame', desc: 'The mine\'s seams are burning. Every rat in the Deep is awake and hungry.', glimmer: 6800, minRar: 3 }),
  side('deep', 'hunt', { name: 'Hunt: Grinder Digs Out', desc: 'They dug Grinder out of the rockfall. He is angrier than he was under it.', target: 'grinder', hp: 1.9, dmg: 1.3, glimmer: 4200, minRar: 2 }),
  side('deep', 'duel', { name: 'Duel: Brother Emberlight', desc: 'A smith-knight followed the carts into the Deep and burned with them. His hammer still rings.', foe: 'revenant-emberlight', glimmer: 5800, minRar: 3 }),

  side('moonspire', 'twilight', { name: 'Twilight: The Spire Unlit', desc: 'The Moonspire\'s lamps have gone out, and its garden is full of eyes.', glimmer: 9800, minRar: 3 }),
  side('moonspire', 'hunt', { name: 'Hunt: Varkh\'s Last Watch', desc: 'Varkh the Moon-Pike has taken up his post again, and swears he will not fall twice.', target: 'varkh', hp: 1.7, dmg: 1.3, glimmer: 6200, minRar: 2 }),
  side('moonspire', 'duel', { name: 'Duel: Dame Ysolde of the Wane', desc: 'The Spire\'s last duellist still keeps her garden. She has never lost a bout, living or dead.', foe: 'revenant-ysolde', glimmer: 8400, minRar: 3 }),

  side('frostmere', 'twilight', { name: 'Twilight: The Longest Night', desc: 'Winter\'s court holds its revel under a moon the colour of a wound.', glimmer: 14000, minRar: 3, moonlit: true }),
  side('frostmere', 'hunt', { name: 'Hunt: The Rime Knight Reforged', desc: 'The Rime Knight\'s armour has grown back thicker. So has its temper.', target: 'knight', hp: 1.5, dmg: 1.3, glimmer: 8800, minRar: 3 }),
  side('frostmere', 'duel', { name: 'Duel: The Lanternless Knight', desc: 'The knight who carried the moon\'s last lantern to the Frostmere, and lost it. Its echo will not let you pass.', foe: 'revenant-lanternless', glimmer: 12000, minRar: 3, moonlit: true }),
].map(s => [s.id, s]));

// The side missions a mission offers, in order.
export const sidesOf = mission => Object.values(SIDES).filter(s => s.mission === mission);
