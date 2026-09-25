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

  // The second act, across the Moonlit Sea.
  side('abbey', 'twilight', { name: 'Twilight: The Abbey at Spring Tide', desc: 'The sea is at the altar, and every bell in the abbey is ringing at once.', glimmer: 18000, minRar: 3 }),
  side('abbey', 'hunt', { name: 'Hunt: Tolland Rings Again', desc: 'Brother Tolland has hung a new bell. He will ring it until someone makes him stop.', target: 'tolland', hp: 1.6, dmg: 1.3, glimmer: 11000, minRar: 3 }),
  side('abbey', 'duel', { name: 'Duel: Sir Wendel Graves', desc: 'A gravedigger-knight who buried the abbey\'s drowned, and was buried with them. His daggers are still sharp.', foe: 'revenant-graves', glimmer: 16000, minRar: 3 }),

  side('forge', 'twilight', { name: 'Twilight: The Forge Unbanked', desc: 'Every furnace in the mountain roars at once, and the iron runs in the halls.', glimmer: 22000, minRar: 3 }),
  side('forge', 'hunt', { name: 'Hunt: Ghurk\'s Masterwork', desc: 'Forgemaster Ghurk has made himself a new hammer, and wants to try it on someone.', target: 'ghurk', hp: 1.6, dmg: 1.3, glimmer: 13500, minRar: 3 }),
  side('forge', 'duel', { name: 'Duel: Dame Ashkettle', desc: 'A smith-knight of the Lantern Court who fought the forge from within. Her hatchets still burn.', foe: 'revenant-ashkettle', glimmer: 20000, minRar: 3 }),

  side('thornwood', 'twilight', { name: 'Twilight: The Rose Unpruned', desc: 'A whole month of the waning moon, and no one has cut the roses back.', glimmer: 26000, minRar: 3 }),
  side('thornwood', 'hunt', { name: 'Hunt: Sir Caddoc\'s Oath', desc: 'Sir Caddoc swore to keep the gate, and an oath does not end with a death.', target: 'caddoc', hp: 1.5, dmg: 1.3, glimmer: 16000, minRar: 3 }),
  side('thornwood', 'duel', { name: 'Duel: Brother Rook', desc: 'The Court\'s old huntsman, who went into the briar after the Queen\'s son and never came out.', foe: 'revenant-rook', glimmer: 24000, minRar: 3 }),

  side('crater', 'twilight', { name: 'Twilight: The Night of Falling Stars', desc: 'The sky is falling into the crater again, and everything in it is hungry.', glimmer: 30000, minRar: 3 }),
  side('crater', 'hunt', { name: 'Hunt: The Shardling Regrown', desc: 'The glass has grown back through the Shardling, thicker and sharper.', target: 'shardling', hp: 1.5, dmg: 1.3, glimmer: 19000, minRar: 3 }),
  side('crater', 'duel', { name: 'Duel: Sister Cinderwing', desc: 'A dancer of the Lantern Court who came to see the fallen star, and stayed to dance on it.', foe: 'revenant-cinderwing', glimmer: 28000, minRar: 3, moonlit: true }),

  side('court', 'twilight', { name: 'Twilight: The Moon\'s Last Quarter', desc: 'The moon hangs at its thinnest over the Court, and the Queen\'s knights are at their fiercest.', glimmer: 36000, minRar: 3, moonlit: true }),
  side('court', 'hunt', { name: 'Hunt: Maelis Again', desc: 'Maelis keeps coming back to the Vigil. She does not remember why. Neither do the Queen\'s knights beside her.', target: 'maelis', hp: 1.4, dmg: 1.3, glimmer: 23000, minRar: 3, moonlit: true }),
  side('court', 'duel', { name: 'Duel: The Oathbound', desc: 'The first knight the Lantern Queen ever sent out, sworn to her before she waned. It keeps the oath still.', foe: 'revenant-oathbound', glimmer: 34000, minRar: 3, moonlit: true }),
].map(s => [s.id, s]));

// The side missions a mission offers, in order.
export const sidesOf = mission => Object.values(SIDES).filter(s => s.mission === mission);
