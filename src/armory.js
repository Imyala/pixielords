// The armory: every melee archetype from Warframe, Nioh, Nioh 2 and NieR: Automata, folded into weapons of the
// fae court. The first five (sword, glaive, fangs, hammer, fists) live in player.js and movesets.js; the fifteen
// here are built the same way. Each has a hold (how it is carried: which pose family and animations it fights
// with), numbers (speed, stamina, damage, reach), a mechanic of its own, three stance forms and a source: found
// lying in a mission, or won from a gatekeeper or warlord.
//
//   ours                 Warframe                         Nioh / Nioh 2           NieR: Automata
//   Fae Sword            Swords                           Sword (katana)          Small Swords
//   Moonglaive           Polearms                         Spear                   Spears
//   Twin Fangs           Dual Swords, Dual Nikanas        Dual Swords
//   Thornhammer          Hammers                          Axe (and hammers)
//   Starfists            Fists, Sparring                  Fists                   Combat Bracers
//   Warblade             Heavy Blade, Two-Handed Nikana   Odachi                  Large Swords
//   Warden's Aegis       Sword and Shield
//   Thorn Daggers        Daggers, Dual Daggers
//   Twin Hatchets        Machetes                         Hatchets
//   Briar Chain          Whips, Blade and Whip            Kusarigama
//   Harvest Moon         Scythes, Heavy Scythe            Switchglaive (scythe)
//   Wolf Claws           Claws
//   Grinder's Wheel      Assault Saw
//   Seer's Hexblade      Gunblade
//   Moonstaff            Staves, Nunchaku                 Splitstaff
//   Moth Fans            Warfans
//   Moon Tonfas          Tonfas                           Tonfa
//   Silkclaw's Rapier    Rapiers
//   Rimeblade            Nikanas                          Sword (iaido)
//   Moonring             Glaives (thrown)

// hold: the pose family the weapon is carried in (sword, glaive, fangs, hammer, fists, and the Aegis's and
// staff's own). speed / cost scale strike pace and stamina; dmg and reach scale every strike. mech names its
// mechanic. Each weapon's strikes, forms, heavies and finishers are its own: see signatures.js.
export const ARMORY = {
  great: { name: 'Warblade', hold: 'hammer', speed: .88, cost: 1, dmg: .95, reach: 1.12, color: 0xd8e4ff, airReach: 1.1, airDmg: 1.05,
    mech: 'Momentum', mechDesc: 'each strike in a chain hits 6% harder than the last, up to +36%',
    desc: 'A two-handed blade as long as a goblin is tall: great sweeping cuts that grow heavier as a chain goes on.',
    source: { boss: 'keep' },
  },

  aegis: { name: "Warden's Aegis", hold: 'aegis', speed: 1, cost: .95, dmg: .92, reach: 1, color: 0xe6c36a, airReach: 1, airDmg: 1,
    mech: 'Bulwark', mechDesc: 'your guard holds from every side and blocked blows cost 40% less stamina',
    desc: 'A sword and a round shield: steady cuts, shield bashes and a guard nothing gets round.',
    source: { gate: 'keep' },
  },

  daggers: { name: 'Thorn Daggers', hold: 'fangs', speed: 1.3, cost: .7, dmg: .72, reach: .85, color: 0xb8f0c8, airReach: .9, airDmg: 1.1,
    mech: 'Backstab', mechDesc: 'strikes from behind a foe hit 60% harder, and Ambushes a third harder',
    desc: 'A pair of short thorn blades: the quickest cuts of all, deadliest from behind.',
    source: { item: 'keep' },
  },

  hatchets: { name: 'Twin Hatchets', hold: 'fangs', speed: 1.05, cost: .9, dmg: 1.05, reach: .95, color: 0xffc890, airReach: .95, airDmg: 1.1,
    mech: 'Hurl', mechDesc: 'heavies hurl both hatchets, which wheel out and come back to hand; chops bite posture 15% harder',
    desc: 'A goblin woodsman\'s pair of hatchets: heavy chops up close, and thrown when the foe keeps its distance.',
    source: { gate: 'rotwood' },
  },

  chain: { name: 'Briar Chain', hold: 'glaive', speed: 1, cost: .95, dmg: .85, reach: 1.45, color: 0xb0e080, airReach: 1.3, airDmg: 1,
    mech: 'Snare', mechDesc: 'every lash drags foes a step toward you, and heavies haul them in',
    desc: 'A thorned chain with a sickle at its end: the longest reach of any weapon, and it pulls.',
    source: { item: 'rotwood' },
  },

  scythe: { name: 'Harvest Moon', hold: 'glaive', speed: .9, cost: 1.05, dmg: 1.05, reach: 1.12, color: 0xe0d0ff, airReach: 1.2, airDmg: 1.05,
    mech: 'Reap', mechDesc: 'strikes on foes below a third of their health hit 60% harder, and sweeps draw foes in',
    desc: 'A great crescent blade on a black haft: wide reaping sweeps that finish what they start.',
    source: { boss: 'rotwood' },
  },

  claws: { name: 'Wolf Claws', hold: 'fists', speed: 1.2, cost: .85, dmg: .8, reach: 1.05, color: 0xff9a9a, airReach: .95, airDmg: 1.1,
    mech: 'Bleed', mechDesc: 'hits open wounds; the fifth bursts for a slice of the foe\'s health',
    desc: 'Three hooked blades over each gauntlet, taken from a ratman packleader: rake, rend, and let them bleed.',
    source: { item: 'deep' },
  },

  saw: { name: "Grinder's Wheel", hold: 'hammer', speed: .9, cost: 1.05, dmg: .9, reach: .95, color: 0xffb060, airReach: 1, airDmg: 1,
    mech: 'Grind', mechDesc: 'the wheel keeps biting: every strike hits again and again while it touches, grinding posture down',
    desc: 'The Tunnel-Breaker\'s saw-wheel on a haft, spinning on its own. It grinds through anything it touches.',
    source: { gate: 'deep' },
  },

  hexblade: { name: "Seer's Hexblade", hold: 'sword', speed: 1, cost: 1, dmg: .9, reach: 1, color: 0x9dff7a, airReach: 1, airDmg: 1,
    mech: 'Hex Charge', mechDesc: 'hits charge the blade (up to three); a heavy looses the charges as seeking hex bolts',
    desc: 'Mother Skritch\'s blade, a hex-orb set in the guard: cut to charge it, then let the orbs fly.',
    source: { boss: 'deep' },
  },

  staff: { name: 'Moonstaff', hold: 'staff', speed: 1.05, cost: .85, dmg: .85, reach: 1.1, color: 0xc8e8ff, airReach: 1.2, airDmg: 1,
    mech: 'Sweep', mechDesc: 'every blow knocks foes back, and catching two or more in one swing wins back stamina',
    desc: 'A pilgrim-monk\'s staff shod in moon-silver at both ends: wide, whirling, and cheap on stamina.',
    source: { item: 'moonspire' },
  },

  fans: { name: 'Moth Fans', hold: 'fangs', speed: 1.1, cost: .85, dmg: .8, reach: 1, color: 0xffe0f0, airReach: 1, airDmg: 1.1,
    mech: 'Gale', mechDesc: 'every cut gusts foes back, and heavies throw both fans spinning out and home again',
    desc: 'Two war-fans of moth-wing silk on steel ribs: cutting gusts, and fans that fly.',
    source: { item: 'moonspire' },
  },

  tonfas: { name: 'Moon Tonfas', hold: 'fists', speed: 1.15, cost: .85, dmg: .92, reach: 1.1, color: 0x9fc8ff, airReach: .95, airDmg: 1.1,
    mech: 'Tonfa Guard', mechDesc: 'a wider Deflect window, cheaper blocks, and Deflects that return more stamina',
    desc: 'Side-handled batons of moon-steel, taken from the Moon-Pike: strike, turn the blow, strike again.',
    source: { gate: 'moonspire' },
  },

  rapier: { name: "Silkclaw's Rapier", hold: 'sword', speed: 1.15, cost: .85, dmg: .82, reach: 1.12, color: 0xd8d8ff, airReach: 1, airDmg: 1,
    mech: 'Riposte', mechDesc: 'Flashcuts, Moonstep Ripostes and Executions strike half again as hard, and the Deflect window is wider',
    desc: 'The Moonless Blade\'s own rapier, long and needle-fine: thrusts, feints and deadly answers.',
    source: { boss: 'moonspire' },
  },

  katana: { name: 'Rimeblade', hold: 'sword', speed: 1.05, cost: .95, dmg: 1, reach: 1.05, color: 0xbfe6ff, airReach: 1, airDmg: 1,
    mech: 'Iai', mechDesc: 'held back a moment, the blade glints: the next strike is a draw-cut, 60% harder',
    desc: 'The Rime Knight\'s curved blade, cold to the touch: patience, then one cut.',
    source: { gate: 'frostmere' },
  },

  ring: { name: 'Moonring', hold: 'sword', speed: 1.1, cost: .9, dmg: .85, reach: .95, color: 0xd8f8ff, airReach: 1, airDmg: 1,
    mech: 'Ring Throw', mechDesc: 'heavies throw the ring: it wheels out, cutting all it passes, and comes back to hand',
    desc: 'A bladed ring of the Winter Court: cut with it close, or throw it and let it come home.',
    source: { boss: 'frostmere' },
  },
};

// New strikes for the armory: a shield bash and rush, thrown weapons, and the rapier's flurry.
export const ARMORY_MOVES = {
  ae_bash: { name: 'Shield Bash', anim: 'ae_bash', dur: .56, hit: [.16, .28], dmg: 34, ki: 40, poise: 30, cost: 12, reach: 2.0, arc: 90, move: 1.2, chain: .32, kb: 8 },
  ae_charge: { name: 'Shield Rush', anim: 'ae_charge', dur: .7, hit: [.12, .42], dmg: 46, ki: 50, poise: 40, cost: 16, reach: 2.0, arc: 110, move: 3.8, fixedMove: true, chain: .5, kb: 9, heavy: true },
  ht_hurl: { name: 'Hurled Hatchets', anim: 'hurl2', dur: .62, hit: [9, 9], dmg: 44, ki: 34, poise: 22, cost: 14, reach: 0, arc: 0, move: .2, chain: .46, heavy: true, hurl: { kind: 'hatchet', n: 2, spread: .22, range: 11, speed: 20 } },
  fan_hurl: { name: 'Thrown Fans', anim: 'hurl2', dur: .62, hit: [9, 9], dmg: 30, ki: 22, poise: 18, cost: 12, reach: 0, arc: 0, move: .2, chain: .46, heavy: true, hurl: { kind: 'fan', n: 2, spread: .2, range: 12, speed: 18, kb: 6 } },
  rg_throw: { name: 'Ring Throw', anim: 'hurl1', dur: .6, hit: [9, 9], dmg: 52, ki: 30, poise: 20, cost: 12, reach: 0, arc: 0, move: .2, chain: .44, heavy: true, hurl: { kind: 'ring', n: 1, spread: 0, range: 14, speed: 22 } },
  rp_hundred: { name: 'Hundred Stings', anim: 'rp_hundred', dur: 1.05, hit: [.1, .82], multi: .09, last: 3, dmg: 14, ki: 9, poise: 3, cost: 18, reach: 2.9, arc: 40, move: 1.2, chain: .84 },
};

// Where each archetype is won: gate = the mission's gatekeeper, boss = its warlord(s), item = found lying there.
export const ARMORY_ITEMS = {
  keep: { id: 'daggers', x: -33.6, z: 33.4, label: 'Thorn Daggers', desc: 'a pair of short thorn blades', tip: 'Thorn Daggers: the quickest cuts of all, and Backstab: strikes from behind hit 60% harder.' },
  rotwood: { id: 'chain', x: -36.8, z: 76.4, label: 'Briar Chain', desc: 'a thorned chain with a sickle at its end', tip: 'The Briar Chain reaches further than any weapon, and Snare: every lash drags foes a step toward you, heavies haul them in.' },
  deep: { id: 'claws', x: 14.2, z: 43.6, label: 'Wolf Claws', desc: 'three hooked blades over each gauntlet', tip: 'Wolf Claws rake and rend: Bleed. Hits open wounds, and every fifth bursts for a slice of the foe\'s health.' },
  moonspire: [
    { id: 'staff', x: -12.4, z: 44.4, label: 'Moonstaff', desc: 'a pilgrim-monk\'s staff shod in moon-silver', tip: 'The Moonstaff whirls wide and cheap: Sweep. Every blow knocks foes back, and catching two or more at once wins back stamina.' },
    { id: 'fans', x: -40.2, z: 63.2, label: 'Moth Fans', desc: 'two war-fans of moth-wing silk', tip: 'Moth Fans cut in gusts that push foes back, and Gale: heavies throw both fans, which fly out and come home.' },
  ],
};
