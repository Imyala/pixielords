// Relics: forty named weapons, two for every kind, each the weapon of someone who came before (as Nioh's unique
// weapons are). A relic is a Moonlit piece of its kind with fixed effects, a colour its blade takes, and a
// signature art of its own: hold guard and strike hard while it is in hand (the weapon's own Weapon Skill need
// not be learned). skills.js builds the arts from each kind's own strikes; this file is only data, so gear.js and
// the menus can name relics without loading the moves.
//   art: which shape the art takes (skills.js): finale (the high form's pause blow run into the last finisher,
//   with a great crescent), tempest (a whirling rise into a finisher, bursting round the knight), cascade (the
//   first form's string at speed, a crescent on the end), rush (a charge through the foe and a finisher).
//   fx: the relic's effects, fixed. o: the art's extras (pull draws foes in, kb throws them, pop lifts them).
export const RELICS = {
  moonlight:    { w: 'sword', name: 'Moonlight', art: 'finale', artName: 'Moonlight Greatsword', color: 0xcfe8ff, fx: [['dmg', 10], ['animaHit', 18]], lore: 'The first knight\'s blade, forged of the moon\'s first light.' },
  thornkiss:    { w: 'sword', name: 'Thornkiss', art: 'cascade', artName: 'Hundred Thorns', color: 0xff6a8a, fx: [['bleed', 18], ['back', 16]], lore: 'A briar-knight\'s sword; it remembers every wound it made.' },
  tidecaller:   { w: 'glaive', name: 'Tidecaller', art: 'tempest', artName: 'High Tide', color: 0x7ad8ff, fx: [['ki', 14], ['heavy', 14]], o: { kb: -5 }, lore: 'It draws the enemy in as the moon draws the sea.' },
  stormspire:   { w: 'glaive', name: 'Stormspire', art: 'rush', artName: 'Spire of Storms', color: 0xd8c8ff, fx: [['dmg', 9], ['frost', 12]], lore: 'Carried up the Moonspire by a knight who meant to spear the sky.' },
  swallowtail:  { w: 'fangs', name: 'Swallowtail', art: 'cascade', artName: 'Swallow Storm', color: 0xa8ffcf, fx: [['dmgFull', 16], ['animaHit', 16]], lore: 'Two blades that never struck the same place twice.' },
  nightjar:     { w: 'fangs', name: 'Nightjar', art: 'rush', artName: 'Nightjar\'s Pass', color: 0x9a7aff, fx: [['back', 20], ['bleed', 14]], lore: 'Heard only once, and never twice.' },
  anvilheart:   { w: 'hammer', name: 'Anvilheart', art: 'finale', artName: 'Heart of the Anvil', color: 0xffb070, fx: [['ki', 16], ['heavy', 18]], o: { aoe: 3.4 }, lore: 'Its head was the anvil the first fae swords were beaten on.' },
  thunderroot:  { w: 'hammer', name: 'Thunderroot', art: 'tempest', artName: 'Rootquake', color: 0xffe07a, fx: [['dmg', 9], ['burn', 14]], o: { pop: 4.5 }, lore: 'Cut from a tree the lightning struck nine times.' },
  starknuckles: { w: 'fists', name: 'Starfall Knuckles', art: 'cascade', artName: 'Rain of Stars', color: 0x9fe8ff, fx: [['ki', 14], ['leech', 3]], lore: 'Worn by a knight who fought the warren bare-handed, and won.' },
  emberpalm:    { w: 'fists', name: 'Emberpalm', art: 'rush', artName: 'Ember Rush', color: 0xff8a3a, fx: [['burn', 18], ['dmgLow', 20]], lore: 'The palms still smoulder, a hundred years on.' },
  oathbreaker:  { w: 'great', name: 'Oathbreaker', art: 'finale', artName: 'Broken Oath', color: 0xe8ecff, fx: [['heavy', 18], ['dmg', 8]], lore: 'The blade of a knight who swore to the Queen, and broke it.' },
  gravewarden:  { w: 'great', name: 'Gravewarden', art: 'tempest', artName: 'Grave Whirl', color: 0x8affc8, fx: [['leech', 3], ['ki', 12]], o: { kb: 5 }, lore: 'It kept the necropolis a thousand years.' },
  dawnshield:   { w: 'aegis', name: 'Dawnshield', art: 'rush', artName: 'Dawnbreak Charge', color: 0xfff0c0, fx: [['ki', 14], ['dmg', 8]], o: { kb: 9 }, lore: 'Its face still holds the last sunrise the fae saw.' },
  bastion:      { w: 'aegis', name: 'The Last Bastion', art: 'finale', artName: 'Last Stand', color: 0xc8d8ff, fx: [['heavy', 14], ['exec', 18]], lore: 'The shield that held the Lantern Court\'s gate alone.' },
  magpie:       { w: 'daggers', name: 'Magpie\'s Beak', art: 'cascade', artName: 'Thieving Flurry', color: 0xe0e0ff, fx: [['back', 22], ['dmg', 8]], lore: 'It took whatever glittered, and whatever breathed.' },
  waspsting:    { w: 'daggers', name: 'Waspsting', art: 'rush', artName: 'Swarm', color: 0xffd84a, fx: [['bleed', 18], ['dmgFull', 14]], lore: 'A pair of stings, and the wasp between them.' },
  woodsman:     { w: 'hatchets', name: 'The Woodsman\'s Pair', art: 'tempest', artName: 'Felling Wheel', color: 0xc8a070, fx: [['heavy', 16], ['ki', 12]], lore: 'They cleared the Rotwood\'s first road.' },
  redbeak:      { w: 'hatchets', name: 'Redbeak', art: 'cascade', artName: 'Pecking Order', color: 0xff5a4a, fx: [['bleed', 16], ['burn', 12]], lore: 'Named for what it leaves on the snow.' },
  serpent:      { w: 'chain', name: 'Silver Serpent', art: 'tempest', artName: 'Serpent\'s Coil', color: 0xd0e0ff, fx: [['ki', 14], ['dmg', 8]], o: { kb: -6 }, lore: 'It coils about its bearer\'s arm when it sleeps.' },
  brambleweave: { w: 'chain', name: 'Brambleweave', art: 'rush', artName: 'Bramble Lash', color: 0x6ac86a, fx: [['bleed', 18], ['pause', 16]], lore: 'Every link a thorn, every thorn a vow.' },
  harvestmoon:  { w: 'scythe', name: 'Harvest Moon', art: 'tempest', artName: 'Reaping Moon', color: 0xffc890, fx: [['dmgLow', 22], ['leech', 2]], o: { kb: -4 }, lore: 'Its blade is the moon\'s own crescent, taken at harvest.' },
  widowsickle:  { w: 'scythe', name: 'Widow\'s Sickle', art: 'finale', artName: 'Widowing', color: 0xb07aff, fx: [['exec', 22], ['back', 14]], lore: 'Carried by the last of the Queen\'s reapers.' },
  wolfsbane:    { w: 'claws', name: 'Wolfsbane', art: 'cascade', artName: 'Pack Frenzy', color: 0xc0ff9a, fx: [['bleed', 20], ['dmg', 7]], lore: 'The claws of the wolf that hunted the hunters.' },
  nightmane:    { w: 'claws', name: 'Nightmane', art: 'rush', artName: 'Night Pounce', color: 0x8a6aff, fx: [['dmgFull', 16], ['animaHit', 14]], lore: 'Black as the moon\'s far side.' },
  bonegrinder:  { w: 'saw', name: 'Bonegrinder', art: 'finale', artName: 'Grinding Doom', color: 0xff7a5a, fx: [['ki', 16], ['heavy', 14]], lore: 'The forge\'s wheel, taken down and given teeth.' },
  millwheel:    { w: 'saw', name: 'The Mill-Wheel', art: 'tempest', artName: 'Mill Race', color: 0xd8c8a0, fx: [['dmg', 9], ['leech', 2]], lore: 'It ground flour, once, for the whole of the Court.' },
  witchmoon:    { w: 'hexblade', name: 'Witchmoon', art: 'cascade', artName: 'Hex Cascade', color: 0xc070ff, fx: [['animaHit', 20], ['dmg', 8]], lore: 'A hedge-witch\'s blade, hexed nine ways.' },
  curseglass:   { w: 'hexblade', name: 'Curseglass', art: 'finale', artName: 'Shattered Curse', color: 0x70d0ff, fx: [['frost', 14], ['exec', 16]], lore: 'Glass from the Mirror of the Mere, sharpened.' },
  ruyi:         { w: 'staff', name: 'Ruyi of the Monkey King', art: 'tempest', artName: 'Great Sage\'s Whirl', color: 0xffd060, fx: [['ki', 16], ['pause', 16]], o: { kb: 7 }, lore: 'It grows as long as it needs to, and no longer.' },
  willowwand:   { w: 'staff', name: 'Willowwand', art: 'rush', artName: 'Willow Sweep', color: 0x9ae07a, fx: [['leech', 3], ['dmgFull', 14]], lore: 'It bends, and bends, and does not break.' },
  mothwing:     { w: 'fans', name: 'Mothwing', art: 'cascade', artName: 'Moth Waltz', color: 0xe8d8ff, fx: [['animaHit', 18], ['back', 14]], lore: 'Moths gather to it on moonless nights.' },
  galebloom:    { w: 'fans', name: 'Galebloom', art: 'tempest', artName: 'Blooming Gale', color: 0x9fffe8, fx: [['dmg', 9], ['frost', 12]], o: { kb: 7 }, lore: 'Opened, it is a flower; swung, a storm.' },
  ironmoons:    { w: 'tonfas', name: 'Iron Moons', art: 'cascade', artName: 'Twin Moons', color: 0xc8d0e0, fx: [['ki', 16], ['heavy', 12]], lore: 'Two halves of one moon, beaten into batons.' },
  brawlersaint: { w: 'tonfas', name: 'The Brawler\'s Saint', art: 'rush', artName: 'Saint\'s Charge', color: 0xffe0a0, fx: [['leech', 3], ['dmgLow', 18]], lore: 'A monk\'s, who kept the peace by force.' },
  silkthread:   { w: 'rapier', name: 'Silk Thread', art: 'cascade', artName: 'Silk Storm', color: 0xe8e8ff, fx: [['exec', 20], ['dmgFull', 14]], lore: 'So fine it is seen only in moonlight.' },
  duelistvow:   { w: 'rapier', name: 'The Duelist\'s Vow', art: 'rush', artName: 'First Blood', color: 0xff9ab0, fx: [['back', 16], ['dmg', 9]], lore: 'It swore never to lose a duel. It never has.' },
  winterbloom:  { w: 'katana', name: 'Winterbloom', art: 'finale', artName: 'Winter\'s End', color: 0xbfe6ff, fx: [['frost', 16], ['dmg', 8]], lore: 'Drawn once each winter, on the longest night.' },
  crimsondusk:  { w: 'katana', name: 'Crimson Dusk', art: 'rush', artName: 'Dusk Draw', color: 0xff5a5a, fx: [['bleed', 16], ['heavy', 14]], lore: 'Its edge is the colour of the last light.' },
  selenehalo:   { w: 'ring', name: 'Selene\'s Halo', art: 'tempest', artName: 'Halo', color: 0xeef2ff, fx: [['animaHit', 16], ['dmg', 8]], lore: 'The moon\'s own halo, fallen, and caught.' },
  eclipsering:  { w: 'ring', name: 'The Eclipse Ring', art: 'cascade', artName: 'Corona', color: 0xffb040, fx: [['burn', 16], ['exec', 16]], lore: 'Forged in the dark that ate the moon, from what was left.' },
};
export const RELIC_IDS = Object.keys(RELICS);
export const relicsOf = w => RELIC_IDS.filter(id => RELICS[id].w === w);
export const RELIC_COLOR = '#ff9a3c';
