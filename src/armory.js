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

// hold: which pose family and strikes the weapon fights with (sword, glaive, fangs, hammer, fists).
// speed / cost scale strike pace and stamina; dmg and reach scale every strike. mech names its mechanic.
export const ARMORY = {
  great: { name: 'Warblade', hold: 'hammer', speed: .88, cost: 1, dmg: .95, reach: 1.12, color: 0xd8e4ff, airReach: 1.1, airDmg: 1.05,
    mech: 'Momentum', mechDesc: 'each strike in a chain hits 6% harder than the last, up to +36%',
    desc: 'A two-handed blade as long as a goblin is tall: great sweeping cuts that grow heavier as a chain goes on.',
    source: { boss: 'keep' }, heavy: { high: 'hHeavyH', mid: 'hHeavyM', low: 'hHeavyL' }, run: 'hRun', dash: 'hDash', switch: 'swHammer',
    fin: ['s_fin1', 'hFin2', 'hFin3'], slide: 'hSlide', air: 'hAir1',
    forms: {
      high: { name: "Heaven's Edge", neutral: ['h_hcrush', 's_hcleave', 'h_hleap'], forward: ['s_hstep', 'h_hhook', 'h_hleap'], pause: 's_hsunder' },
      mid: { name: 'Iron Tide', neutral: ['h_side', 'h_back', 's_hwheel', 'h_over'], forward: ['hCharge', 's_hstep', 'h_upper', 'h_spin'], pause: 'h_quake' },
      low: { name: 'Ground Reaver', neutral: ['h_lsweep', 's_hrise', 'h_lwheel', 'h_lflip'], forward: ['h_lrush', 'h_lsweep', 's_hrise'], pause: 'h_ltop' },
    },
    names: { h_hcrush: 'Mountain Cleave', s_hcleave: 'Falling Edge', h_hleap: 'Leaping Cleave', s_hstep: 'Striding Edge', h_hhook: 'Hooking Cut', s_hsunder: 'Heaven Splitter',
      h_side: 'Great Sweep', h_back: 'Return Sweep', s_hwheel: 'Iron Wheel', h_over: 'Overhead Cleave', hCharge: 'Shoulder Charge', h_upper: 'Rising Cleave', h_spin: 'Great Turn', h_quake: 'Threefold Cleave',
      h_lsweep: 'Low Sweep', s_hrise: 'Reaving Rise', h_lwheel: 'Reaver Wheel', h_lflip: 'Scooping Cut', h_lrush: 'Dragging Edge', h_ltop: "Reaver's Whirl",
      hHeavyH: 'Mountain Cleaver', hHeavyM: "Giant's Sweep", hHeavyL: 'Rising Giant', s_fin1: 'Moonrise Cleave', hFin2: 'Thunder Wheel', hFin3: 'Worldsplitter', hSlide: 'Skidding Sweep', hRun: 'Running Cleave', hDash: 'Dash Sweep' } },

  aegis: { name: "Warden's Aegis", hold: 'aegis', speed: 1, cost: .95, dmg: .92, reach: 1, color: 0xe6c36a, airReach: 1, airDmg: 1,
    mech: 'Bulwark', mechDesc: 'your guard holds from every side and blocked blows cost 40% less stamina',
    desc: 'A sword and a round shield: steady cuts, shield bashes and a guard nothing gets round.',
    source: { gate: 'keep' }, heavy: { high: 'skyfall', mid: 'ae_charge', low: 'needle' }, run: 'ae_charge', dash: 'dashSlash', switch: 'swSword',
    fin: ['s_fin1', 's_fin2', 's_fin3'], slide: 'sSlide', air: 'air1',
    forms: {
      high: { name: 'Bastion', neutral: ['light3', 's_hrise', 'ae_bash'], forward: ['s_lunge', 'ae_bash', 'light4'], pause: 's_hsunder' },
      mid: { name: "Warden's Way", neutral: ['light1', 'light2', 'ae_bash', 'light4'], forward: ['s_lunge', 'light2', 's_rise', 'light4'], pause: 's_triple' },
      low: { name: 'Low Wall', neutral: ['s_ldraw', 's_lback', 'ae_bash', 's_lsweep'], forward: ['s_ldart', 'ae_bash', 's_lrise'], pause: 's_lflurry' },
    },
    names: { s_hsunder: 'Bastion Break', s_triple: "Warden's Triple", s_lflurry: 'Crouching Flurry', skyfall: 'Falling Bastion', needle: 'Shield Needle' } },

  daggers: { name: 'Thorn Daggers', hold: 'fangs', speed: 1.3, cost: .7, dmg: .72, reach: .85, color: 0xb8f0c8, airReach: .9, airDmg: 1.1,
    mech: 'Backstab', mechDesc: 'strikes from behind a foe hit 60% harder, and Ambushes a third harder',
    desc: 'A pair of short thorn blades: the quickest cuts of all, deadliest from behind.',
    source: { item: 'keep' }, heavy: { high: 'f_xfall', mid: 'f_whirl', low: 'f_viper' }, run: 'fRun', dash: 'fDash', switch: 'swFangs',
    fin: ['fFin1', 'fFin2', 'fFin3'], slide: 'fSlide', air: 'fAir1',
    forms: {
      high: { name: 'Magpie', neutral: ['f_hx', 'f_twist', 'f_hdrop'], forward: ['f_ldart', 'f_hflip', 'f_hx'], pause: 'f_hsky' },
      mid: { name: 'Needlework', neutral: ['f1', 'f_lstab', 'f2', 'f_lhook'], forward: ['f_twinstep', 'f_lstab', 'f_ldart'], pause: 'f_hundred' },
      low: { name: 'Shadow Step', neutral: ['f_lhook', 'f_lsweep', 'f_lstab', 'f_lcoil'], forward: ['f_ldart', 'f_lhook', 'f_lsweep'], pause: 'f_ltornado' },
    },
    names: { f_hsky: "Magpie's Descent", f_hundred: 'Thousand Needles', f_ltornado: 'Shadow Cyclone', f_lstab: 'Needle Stabs', f_whirl: 'Thorn Whirl', f_xfall: 'Magpie Dive', f_viper: 'Shadow Dash' } },

  hatchets: { name: 'Twin Hatchets', hold: 'fangs', speed: 1.05, cost: .9, dmg: 1.05, reach: .95, color: 0xffc890, airReach: .95, airDmg: 1.1,
    mech: 'Hurl', mechDesc: 'heavies hurl both hatchets, which wheel out and come back to hand; chops bite posture 15% harder',
    desc: 'A goblin woodsman\'s pair of hatchets: heavy chops up close, and thrown when the foe keeps its distance.',
    source: { gate: 'rotwood' }, heavy: { high: 'ht_hurl', mid: 'ht_hurl', low: 'ht_hurl' }, run: 'fRun', dash: 'fDash', switch: 'swFangs',
    fin: ['fFin1', 'fFin2', 'fFin3'], slide: 'fSlide', air: 'fAir1',
    forms: {
      high: { name: 'Woodsplitter', neutral: ['f_hx', 'f_hdrop', 'f_hflip'], forward: ['fHdive', 'f_hx', 'f_hdrop'], pause: 'f_hsky' },
      mid: { name: 'Chopping Dance', neutral: ['f2', 'f1', 'f3', 'f4'], forward: ['f_twinstep', 'f3', 'f_twist'], pause: 'f_hundred' },
      low: { name: 'Root Cutter', neutral: ['f_lhook', 'f_lsweep', 'f_lcoil'], forward: ['f_ldart', 'f_lsweep', 'f_lcoil'], pause: 'f_ltornado' },
    },
    names: { f_hsky: 'Splitting Storm', f_hundred: 'Kindling', f_ltornado: 'Timber Wheel', f1: 'Right Chop', f2: 'Left Chop', f3: 'Crossing Chop', f4: 'Twin Wheel', fFin3: 'Woodpile' } },

  chain: { name: 'Briar Chain', hold: 'glaive', speed: 1, cost: .95, dmg: .85, reach: 1.45, color: 0xb0e080, airReach: 1.3, airDmg: 1,
    mech: 'Snare', mechDesc: 'every lash drags foes a step toward you, and heavies haul them in',
    desc: 'A thorned chain with a sickle at its end: the longest reach of any weapon, and it pulls.',
    source: { item: 'rotwood' }, heavy: { high: 'g_moonfall', mid: 'g_crescent', low: 'g_pierce' }, run: 'gRun', dash: 'gDash', switch: 'swGlaive',
    fin: ['gFin1', 'gFin2', 'gFin3'], slide: 'gSlide', air: 'gAir1',
    forms: {
      high: { name: 'Hanging Thorn', neutral: ['g_hchop', 'g_hreap', 'g_hbutt'], forward: ['gHleap', 'g_hreap'], pause: 'g_hcyclone' },
      mid: { name: 'Briar Dance', neutral: ['g1', 'g2', 'g_helix', 'g3'], forward: ['g_dthrust', 'g2', 'g_helix', 'g4'], pause: 'g_twin' },
      low: { name: 'Creeping Vine', neutral: ['g_lsweep', 'g_lthrust', 'g_lspin', 'g_lflick'], forward: ['gLrun', 'g_lsweep', 'g_lflick'], pause: 'g_lundertow' },
    },
    names: { g1: 'Lash', g2: 'Sweeping Lash', g3: 'Chain Wheel', g4: 'Vaulting Lash', g_helix: 'Chain Helix', g_dthrust: 'Twin Lash', g_twin: 'Briar Whirl', g_hchop: 'Falling Sickle', g_hreap: 'Reeling Cut', g_hbutt: 'Weight and Sickle', gHleap: 'Leaping Lash', g_hcyclone: 'Thorn Cyclone',
      g_lsweep: 'Ankle Lash', g_lthrust: 'Snapping Lash', g_lspin: 'Chain Wheel', g_lflick: 'Rising Hook', gLrun: 'Running Lash', g_lundertow: 'Strangling Vine', g_moonfall: 'Hanging Sickle', g_crescent: 'Whirling Chain', g_pierce: 'Grappling Throw', gFin1: 'Hooked Rise', gFin2: 'Briar Wheel', gFin3: 'Thorn Spear' } },

  scythe: { name: 'Harvest Moon', hold: 'glaive', speed: .9, cost: 1.05, dmg: 1.05, reach: 1.12, color: 0xe0d0ff, airReach: 1.2, airDmg: 1.05,
    mech: 'Reap', mechDesc: 'strikes on foes below a third of their health hit 60% harder, and sweeps draw foes in',
    desc: 'A great crescent blade on a black haft: wide reaping sweeps that finish what they start.',
    source: { boss: 'rotwood' }, heavy: { high: 'g_moonfall', mid: 'g_crescent', low: 'g_pierce' }, run: 'gRun', dash: 'gDash', switch: 'swGlaive',
    fin: ['gFin1', 'hFin2', 'gFin3'], slide: 'gSlide', air: 'gAir1',
    forms: {
      high: { name: 'Grim Harvest', neutral: ['g_hreap', 'h_hhook', 'g_hchop'], forward: ['gHleap', 'g_hreap', 'h_hhook'], pause: 'g_hcyclone' },
      mid: { name: 'Sickle Moon', neutral: ['g2', 'h_back', 'g3', 'h_spin'], forward: ['g2', 'g_helix', 'h_spin'], pause: 'g_twin' },
      low: { name: 'Gleaner', neutral: ['g_lsweep', 'h_lsweep', 'g_lspin', 'g_lflick'], forward: ['gLrun', 'g_lsweep', 'g_lspin'], pause: 'g_lundertow' },
    },
    names: { g_hreap: 'Reaping Cut', h_hhook: 'Harvest Hook', g_hchop: 'Falling Crescent', gHleap: 'Leaping Reap', g_hcyclone: "Reaper's Wheel", g2: 'Scything Sweep', h_back: 'Return Reap', g3: 'Crescent Wheel', h_spin: 'Harvest Turn', g_helix: 'Moon Helix', g_twin: 'Harvest Dance',
      g_lsweep: 'Gleaning Sweep', h_lsweep: 'Stubble Cut', g_lspin: 'Gleaning Wheel', g_lflick: 'Rising Crescent', gLrun: 'Running Reap', g_lundertow: 'Threshing Wheel', g_moonfall: 'Moon Reaper', g_crescent: 'Great Crescent', g_pierce: 'Hooking Rush', hFin2: 'Harvest Wheel' } },

  claws: { name: 'Wolf Claws', hold: 'fists', speed: 1.2, cost: .85, dmg: .8, reach: 1.05, color: 0xff9a9a, airReach: .95, airDmg: 1.1,
    mech: 'Bleed', mechDesc: 'hits open wounds; the fifth bursts for a slice of the foe\'s health',
    desc: 'Three hooked blades over each gauntlet, taken from a ratman packleader: rake, rend, and let them bleed.',
    source: { item: 'deep' }, heavy: { high: 'xHeavyH', mid: 'xHeavyM', low: 'xHeavyL' }, run: 'xRun', dash: 'xDash', switch: 'swFists',
    fin: ['xFin1', 'xFin2', 'xFin3'], slide: 'xSlide', air: 'xAir1',
    forms: {
      high: { name: 'Pounce', neutral: ['x_uppercut', 'x_hook', 'x_axe'], forward: ['x_flykick', 'x_uppercut', 'x_hook'], pause: 'x_dragon' },
      mid: { name: 'Rending Moon', neutral: ['x_jab', 'x_hook', 'x_cross', 'x_round'], forward: ['x_dashpunch', 'x_hook', 'x_knee'], pause: 'x_rush' },
      low: { name: 'Belly Rake', neutral: ['x_body', 'x_hook', 'x_sweep', 'x_palm'], forward: ['xSlideF', 'x_body', 'x_uppercut'], pause: 'x_cyclone' },
    },
    names: { x_jab: 'Raking Jab', x_cross: 'Rending Cross', x_hook: 'Hooking Rake', x_uppercut: 'Rising Rake', x_body: 'Belly Rake', x_palm: 'Twin Rend', x_rush: 'Thousand Rends', x_dragon: 'Rending Rise', x_cyclone: 'Rake Cyclone', xHeavyM: 'Charging Rake', xHeavyL: 'Gutting Rend' } },

  saw: { name: "Grinder's Wheel", hold: 'hammer', speed: .9, cost: 1.05, dmg: .9, reach: .95, color: 0xffb060, airReach: 1, airDmg: 1,
    mech: 'Grind', mechDesc: 'the wheel keeps biting: every strike hits again and again while it touches, grinding posture down',
    desc: 'The Tunnel-Breaker\'s saw-wheel on a haft, spinning on its own. It grinds through anything it touches.',
    source: { gate: 'deep' }, heavy: { high: 'hHeavyH', mid: 'hHeavyM', low: 'hHeavyL' }, run: 'hRun', dash: 'hDash', switch: 'swHammer',
    fin: ['hFin1', 'hFin2', 'hFin3'], slide: 'hSlide', air: 'hAir1',
    forms: {
      high: { name: 'Rockcutter', neutral: ['h_hcrush', 'h_hhook', 'h_hleap'], forward: ['hHleapF', 'h_hcrush'], pause: 'h_hmeteor' },
      mid: { name: 'Grindstone', neutral: ['h_side', 'h_back', 'h_spin'], forward: ['hCharge', 'h_upper', 'h_spin'], pause: 'h_quake' },
      low: { name: 'Undercut', neutral: ['h_lsweep', 'h_lpoke', 'h_lwheel'], forward: ['h_lrush', 'h_lwheel'], pause: 'h_ltop' },
    },
    names: { h_hcrush: 'Rockcutter', h_hhook: 'Grinding Hook', h_hleap: 'Falling Wheel', hHleapF: 'Falling Wheel', h_hmeteor: 'Cave-in', h_side: 'Grinding Sweep', h_back: 'Return Grind', h_spin: 'Grindstone Turn', hCharge: 'Wheel Charge', h_upper: 'Rising Grind', h_quake: 'Rockfall',
      h_lsweep: 'Undercut', h_lpoke: 'Wheel Ram', h_lwheel: 'Low Grind', h_lrush: 'Dragging Wheel', h_ltop: 'Grinding Top', hFin3: 'Tunnel Breaker' } },

  hexblade: { name: "Seer's Hexblade", hold: 'sword', speed: 1, cost: 1, dmg: .9, reach: 1, color: 0x9dff7a, airReach: 1, airDmg: 1,
    mech: 'Hex Charge', mechDesc: 'hits charge the blade (up to three); a heavy looses the charges as seeking hex bolts',
    desc: 'Mother Skritch\'s blade, a hex-orb set in the guard: cut to charge it, then let the orbs fly.',
    source: { boss: 'deep' }, heavy: { high: 'skyfall', mid: 'heavy', low: 'needle' }, run: 'run', dash: 'dashSlash', switch: 'swSword',
    fin: ['s_fin1', 's_fin2', 's_fin3'], slide: 'sSlide', air: 'air1',
    forms: {
      high: { name: 'Hexfall', neutral: ['s_hcleave', 'light3', 's_hslam'], forward: ['s_hstep', 's_hwheel', 's_hslam'], pause: 's_hsunder' },
      mid: { name: "Seer's Path", neutral: ['light1', 'light2', 's_rise', 'light4'], forward: ['s_lunge', 'light2', 'light3', 'light4'], pause: 's_triple' },
      low: { name: 'Plague Cuts', neutral: ['s_ldraw', 's_lflurry', 's_lback', 's_lsweep'], forward: ['s_ldart', 's_lrise', 's_lflurry'], pause: 's_lpetal' },
    },
    names: { s_hsunder: 'Hex Sunder', s_triple: 'Triple Hex', s_lpetal: 'Hexstorm', skyfall: 'Hexfall', heavy: 'Hex Cleave', needle: 'Hex Needle', s_fin3: 'Seer\'s Lance' } },

  staff: { name: 'Moonstaff', hold: 'staff', speed: 1.05, cost: .85, dmg: .85, reach: 1.1, color: 0xc8e8ff, airReach: 1.2, airDmg: 1,
    mech: 'Sweep', mechDesc: 'every blow knocks foes back, and catching two or more in one swing wins back stamina',
    desc: 'A pilgrim-monk\'s staff shod in moon-silver at both ends: wide, whirling, and cheap on stamina.',
    source: { item: 'moonspire' }, heavy: { high: 'g_moonfall', mid: 'g_crescent', low: 'g_pierce' }, run: 'gRun', dash: 'gDash', switch: 'swGlaive',
    fin: ['gFin1', 'gFin2', 'gFin3'], slide: 'gSlide', air: 'gAir1',
    forms: {
      high: { name: 'Pillar', neutral: ['g_hchop', 'g_hbutt', 'g4'], forward: ['gHleap', 'g_hbutt', 'g_hchop'], pause: 'g_hcyclone' },
      mid: { name: 'Whirling Staff', neutral: ['g2', 'g3', 'g_helix', 'g4'], forward: ['g1', 'g2', 'g_helix'], pause: 'g_twin' },
      low: { name: 'Leg Breaker', neutral: ['g_lsweep', 'g_lspin', 'g_lflick'], forward: ['gLrun', 'g_lsweep', 'g_lspin'], pause: 'g_lundertow' },
    },
    names: { g1: 'Staff Jab', g2: 'Staff Sweep', g3: 'Staff Wheel', g4: 'Vaulting Blow', g_helix: 'Whirling Staff', g_twin: 'Twin Whirl', g_hchop: 'Falling Staff', g_hbutt: 'End over End', gHleap: 'Vaulting Crash', g_hcyclone: 'Pillar Dance',
      g_lsweep: 'Leg Breaker', g_lspin: 'Rolling Staff', g_lflick: 'Rising Staff', gLrun: 'Running Jab', g_lundertow: 'Rolling Thunder', g_moonfall: 'Pole Vault', g_crescent: 'Great Whirl', g_pierce: 'Driving Jab' } },

  fans: { name: 'Moth Fans', hold: 'fangs', speed: 1.1, cost: .85, dmg: .8, reach: 1, color: 0xffe0f0, airReach: 1, airDmg: 1.1,
    mech: 'Gale', mechDesc: 'every cut gusts foes back, and heavies throw both fans spinning out and home again',
    desc: 'Two war-fans of moth-wing silk on steel ribs: cutting gusts, and fans that fly.',
    source: { item: 'moonspire' }, heavy: { high: 'fan_hurl', mid: 'fan_hurl', low: 'fan_hurl' }, run: 'fRun', dash: 'fDash', switch: 'swFangs',
    fin: ['fFin1', 'fFin2', 'fFin3'], slide: 'fSlide', air: 'fAir1',
    forms: {
      high: { name: 'Moth Wing', neutral: ['f_hx', 'f_hflip', 'f_twist'], forward: ['fHdive', 'f_hflip'], pause: 'f_hsky' },
      mid: { name: 'Paper Moon', neutral: ['f1', 'f2', 'f_twist', 'f4'], forward: ['f_twinstep', 'f2', 'f4'], pause: 'f_hundred' },
      low: { name: 'Dust Devil', neutral: ['f_lsweep', 'f_lhook', 'f_lcoil'], forward: ['f_ldart', 'f_lsweep', 'f_lcoil'], pause: 'f_ltornado' },
    },
    names: { f1: 'Opening Fan', f2: 'Closing Fan', f_twist: 'Fluttering Turn', f4: 'Moth Spin', f_hx: 'Crossing Wings', f_hflip: 'Moth Somersault', fHdive: 'Diving Moth', f_hsky: 'Moth Storm', f_hundred: 'Fluttering Hundred', f_ltornado: 'Dust Devil', f_lsweep: 'Low Gust', f_lcoil: 'Rising Gust', fFin2: 'Gale Cyclone' } },

  tonfas: { name: 'Moon Tonfas', hold: 'fists', speed: 1.15, cost: .85, dmg: .92, reach: 1.1, color: 0x9fc8ff, airReach: .95, airDmg: 1.1,
    mech: 'Tonfa Guard', mechDesc: 'a wider Deflect window, cheaper blocks, and Deflects that return more stamina',
    desc: 'Side-handled batons of moon-steel, taken from the Moon-Pike: strike, turn the blow, strike again.',
    source: { gate: 'moonspire' }, heavy: { high: 'xHeavyH', mid: 'xHeavyM', low: 'xHeavyL' }, run: 'xRun', dash: 'xDash', switch: 'swFists',
    fin: ['xFin1', 'xFin2', 'xFin3'], slide: 'xSlide', air: 'xAir1',
    forms: {
      high: { name: 'Rising Guard', neutral: ['x_uppercut', 'x_front', 'x_spinhook'], forward: ['x_flykick', 'x_uppercut'], pause: 'x_cyclone' },
      mid: { name: 'Twin Batons', neutral: ['x_jab', 'x_cross', 'x_hook', 'x_palm'], forward: ['x_dashpunch', 'x_hook', 'x_round'], pause: 'x_rush' },
      low: { name: 'Low Batons', neutral: ['x_body', 'x_sweep', 'x_uppercut'], forward: ['xSlideF', 'x_body', 'x_palm'], pause: 'x_dragon' },
    },
    names: { x_jab: 'Baton Jab', x_cross: 'Baton Cross', x_hook: 'Turning Baton', x_palm: 'Twin Batons', x_uppercut: 'Rising Baton', x_body: 'Low Baton', x_rush: 'Baton Barrage', x_cyclone: 'Whirling Guard', x_dragon: 'Rising Batons', xHeavyM: 'Driving Baton', xHeavyL: 'Baton Burst' } },

  rapier: { name: "Silkclaw's Rapier", hold: 'sword', speed: 1.15, cost: .85, dmg: .82, reach: 1.12, color: 0xd8d8ff, airReach: 1, airDmg: 1,
    mech: 'Riposte', mechDesc: 'Flashcuts, Moonstep Ripostes and Executions strike half again as hard, and the Deflect window is wider',
    desc: 'The Moonless Blade\'s own rapier, long and needle-fine: thrusts, feints and deadly answers.',
    source: { boss: 'moonspire' }, heavy: { high: 'skyfall', mid: 'heavy', low: 'needle' }, run: 's_ldart', dash: 'dashSlash', switch: 'swSword',
    fin: ['s_fin1', 's_fin2', 's_fin3'], slide: 'sSlide', air: 'air1',
    forms: {
      high: { name: 'Silk Needle', neutral: ['s_lunge', 's_hrise', 's_ldart'], forward: ['s_ldart', 's_lunge', 's_rise'], pause: 's_triple' },
      mid: { name: "Duelist's Line", neutral: ['s_lunge', 'light2', 's_lunge', 'light1'], forward: ['s_ldart', 'light1', 's_lunge'], pause: 'rp_hundred' },
      low: { name: 'Crouching Fence', neutral: ['s_ldart', 's_lback', 's_ldraw', 's_lunge'], forward: ['s_ldart', 's_lrise', 's_lunge'], pause: 's_lpetal' },
    },
    names: { s_lunge: 'Lunge', s_ldart: 'Flèche', s_hrise: 'Rising Point', s_triple: 'Silk Triple', s_lpetal: 'Petal Fence', light1: 'Cutting Parry', light2: 'Return Cut', skyfall: 'Falling Point', heavy: 'Beat and Lunge', needle: 'Needle Point', s_fin3: 'Silk Piercer' } },

  katana: { name: 'Rimeblade', hold: 'sword', speed: 1.05, cost: .95, dmg: 1, reach: 1.05, color: 0xbfe6ff, airReach: 1, airDmg: 1,
    mech: 'Iai', mechDesc: 'held back a moment, the blade glints: the next strike is a draw-cut, 60% harder',
    desc: 'The Rime Knight\'s curved blade, cold to the touch: patience, then one cut.',
    source: { gate: 'frostmere' }, heavy: { high: 'skyfall', mid: 'heavy', low: 'needle' }, run: 'run', dash: 'dashSlash', switch: 'swSword',
    fin: ['s_fin1', 's_fin2', 's_fin3'], slide: 'sSlide', air: 'air1',
    forms: {
      high: { name: 'Winter Moon', neutral: ['s_hcleave', 's_hrise', 'light3'], forward: ['s_hstep', 'light3'], pause: 's_hsunder' },
      mid: { name: 'Still Water', neutral: ['s_ldraw', 'light2', 'light1', 'light4'], forward: ['s_lunge', 's_ldraw', 's_rise'], pause: 's_lpetal' },
      low: { name: 'Drawn Frost', neutral: ['s_ldraw', 's_lback', 's_ldraw', 's_lsweep'], forward: ['s_ldart', 's_ldraw', 's_lrise'], pause: 's_triple' },
    },
    names: { s_ldraw: 'Draw-cut', s_hsunder: 'Frostfall Draw', s_lpetal: 'Scattering Petals', s_triple: 'Three Frosts', s_fin3: 'Rime Piercer' } },

  ring: { name: 'Moonring', hold: 'sword', speed: 1.1, cost: .9, dmg: .85, reach: .95, color: 0xd8f8ff, airReach: 1, airDmg: 1,
    mech: 'Ring Throw', mechDesc: 'heavies throw the ring: it wheels out, cutting all it passes, and comes back to hand',
    desc: 'A bladed ring of the Winter Court: cut with it close, or throw it and let it come home.',
    source: { boss: 'frostmere' }, heavy: { high: 'rg_throw', mid: 'rg_throw', low: 'rg_throw' }, run: 'run', dash: 'dashSlash', switch: 'swSword',
    fin: ['s_fin1', 's_fin2', 's_fin3'], slide: 'sSlide', air: 'air1',
    forms: {
      high: { name: 'Moonlit Arc', neutral: ['s_rise', 'light2', 'light4'], forward: ['s_lunge', 's_rise'], pause: 's_hsunder' },
      mid: { name: 'Orbit', neutral: ['light1', 'light2', 'light4', 'light2'], forward: ['s_ldart', 'light1', 'light4'], pause: 's_triple' },
      low: { name: 'Rolling Ring', neutral: ['s_ldraw', 's_lflurry', 's_lsweep'], forward: ['s_ldart', 's_lsweep'], pause: 's_lpetal' },
    },
    names: { light1: 'Ring Cut', light2: 'Return Cut', light4: 'Orbiting Cut', s_rise: 'Rising Ring', s_hsunder: 'Moonlit Arc', s_triple: 'Triple Orbit', s_lpetal: 'Ring Storm', s_lflurry: 'Rolling Cuts' } },
};

// New strikes for the armory: a shield bash and rush, thrown weapons, and the rapier's flurry.
export const ARMORY_MOVES = {
  ae_bash: { name: 'Shield Bash', anim: 'ae_bash', dur: .56, hit: [.16, .28], dmg: 34, ki: 40, poise: 30, cost: 12, reach: 2.0, arc: 90, move: 1.2, chain: .32, kb: 8 },
  ae_charge: { name: 'Shield Rush', anim: 'ae_charge', dur: .7, hit: [.12, .42], dmg: 46, ki: 50, poise: 40, cost: 16, reach: 2.0, arc: 110, move: 3.8, fixedMove: true, chain: .5, kb: 9, heavy: true },
  ht_hurl: { name: 'Hurled Hatchets', anim: 'hurl2', dur: .62, hit: [9, 9], dmg: 44, ki: 34, poise: 22, cost: 14, reach: 0, arc: 0, move: .2, chain: .46, heavy: true, hurl: { kind: 'hatchet', n: 2, spread: .22, range: 11, speed: 20 } },
  fan_hurl: { name: 'Thrown Fans', anim: 'hurl2', dur: .62, hit: [9, 9], dmg: 30, ki: 22, poise: 18, cost: 12, reach: 0, arc: 0, move: .2, chain: .46, heavy: true, hurl: { kind: 'fan', n: 2, spread: .35, range: 12, speed: 18, kb: 6 } },
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
