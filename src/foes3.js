// The third act's foes, on the moon itself: the Silver Shore, the Hollows of Selene, the Necropolis of the
// First Fae, the Umbral Sea on the moon's dark side, and the Heart of the Moon where the Eclipse is chained.
// Tinted kin of the goblins and ratmen who followed the moonlight up, the hollowed fae who went to the moon to
// keep its light long ago, and the Eclipse's own knights, who fight with the player's weapons and strikes
// (kact: the knight's action to play). Added to enemies.js's TYPES by actThree(); S, A and revenant are
// enemies.js's own helpers.
export function actThree(TYPES, { S, A, revenant }) {
  // A tinted kinsman of an existing foe: its attacks, with something added to every blow.
  const kin = (base, tint, glowTint, o, add = {}) => {
    const B = TYPES[base];
    return { ...B, model: B.model || base, tint, glowTint, ...o,
      attacks: o.attacks || B.attacks.map(a => ({ ...a, steps: a.steps.map(st => st.proj || st.blink || !st.dmg ? st : { ...st, ...add, dmg: Math.round(st.dmg * (o.dmgK || 1)) }) })) };
  };
  const SILVER = 0xc8ccd8, CRYSTAL = 0x8ac8d8, ASH = 0x9a92a8, UMBRA = 0x3a3050, VOID = 0x2a2238;
  const K = (steel, dark, cloth, trim, visor, blade, wing, glow, trail) => ({ steel, dark, cloth, trim, visor, blade, wing, glow, trail });
  const SELENE = K(0xd8dce8, 0x1a1c28, 0x2a3a5a, 0xa8c8ff, 0x9fd8ff, 0xeef4ff, 0xc8e0ff, 0x8ac8ff, 0xd8ecff);
  const GEODE = K(0x7aa8b8, 0x10202a, 0x1a3a48, 0x8ff0ff, 0x8ff0ff, 0xd8ffff, 0x9fe8f8, 0x6ae0f0, 0xb8ffff);
  const HOLLOWED = K(0x9a92a8, 0x14101c, 0x2a2438, 0xd8c8ff, 0xd8c8ff, 0xe8e0ff, 0xb8a8d8, 0xa890e0, 0xd8c8ff);
  const UMBRAL = K(0x2a2638, 0x08060e, 0x16122a, 0x7a5ab8, 0xb07aff, 0xc8a8ff, 0x5a4a8a, 0x8a5ad8, 0xb08aff);
  const ECLIPSE = K(0x1a1620, 0x040308, 0x0e0a14, 0xffc860, 0xffd890, 0xfff0c8, 0x3a2a1a, 0xffb040, 0xffd890);
  const dustWave = (n, o = {}) => ({ n, len: 13, speed: 13, chill: 6, color: 0xeef2ff, ...o });
  const crystalWave = (n, o = {}) => ({ n, len: 12, speed: 12, chill: 18, color: 0x8ff0ff, ...o });
  const graveWave = (n, o = {}) => ({ n, len: 13, speed: 12, chill: 0, color: 0xc8a8ff, ...o });
  const voidWave = (n, o = {}) => ({ n, len: 14, speed: 14, chill: 10, color: 0x8a5aff, ...o });
  const coronaWave = (n, o = {}) => ({ n, len: 15, speed: 15, chill: 0, color: 0xffc860, ...o });

  Object.assign(TYPES, {
    // ---- XI. The Silver Shore: the moon's near side, a sea of light breaking on dunes of silver dust.
    'goblin-dustrunner': kin('goblin-scout', SILVER, 0xeef2ff, { name: 'Dust-Runner', glimmer: 1250, hp: 160, run: 5.2, dmgK: 1.15 }),
    'ratman-shellback': kin('ratman-brute', SILVER, 0xeef2ff, { name: 'Shellback', glimmer: 1900, hp: 520, ki: 280 }, { chill: 8 }),
    'goblin-lampwright': {
      model: 'goblin-shaman', tint: SILVER, glowTint: 0xfff0c8, name: 'Goblin Lampwright', scale: .92, radius: .4, hp: 200, ki: 100, poise: 12, walk: 1.5, run: 3.9, glimmer: 1400, voice: 'growl', pitch: 1.35, style: 'ranged', prefer: [7, 12],
      attacks: [
        A('Lamp Orbs', 15, [S('cast', .95, .15, .8, 42, { proj: { kind: 'orb', count: 3, speed: 8 } })], { minRange: 3 }),
        A('Tide of Light', 13, [S('cast', 1.1, .2, .9, 56, { reach: 0, wave: dustWave(1, { len: 14 }) })], { minRange: 4, cd: 7, w: .9 }),
        A('Relight', 20, [S('cast', 1.2, .3, .6, 0, { heal: .2 })], { cd: 12, w: 2, cond: 'alliesHurt' }),
        A('Staff Swipe', 2.2, [S('swing', .5, .12, .6, 36, { reach: 2.2, lunge: .6 })], { w: .5 }),
      ],
    },
    'selene-sentry': {
      knight: SELENE, weapon: 'glaive', name: 'Selene Sentry', scale: 1.02, radius: .45, hp: 400, ki: 200, poise: 28, walk: 2.2, run: 5.8, glimmer: 1500, voice: 'growl', pitch: 1.15, track: 6, aggro: .88, evasive: .35,
      attacks: [
        A('Sentry\'s Lance', 3.3, [S('thrust', .42, .14, .06, 56, { reach: 3.3, arc: 50, lunge: 1.2, kact: 'g_thrust' }), S('swing', .3, .14, .7, 60, { reach: 3.2, arc: 160, lunge: .8, kact: 'g_sweep' })]),
        A('Tidal Sweep', 3.3, [S('spin', .5, .45, .8, 64, { reach: 3.3, arc: 360, kact: 'g_crescent' })], { w: .7 }),
        A('Moonfall Vault', 9, [S('leap', .55, .5, .9, 80, { reach: 0, aoe: 2, shake: .4, kact: 'g_moonfall', wave: dustWave(4, { ring: true, len: 8 }) })], { minRange: 4, cd: 7, w: .7 }),
      ],
    },
    // The gatekeeper: Oriel, who kept the lighthouse on the Silver Shore until the light went out, and kept it
    // after. Her lamp swings on a chain as long as the tide.
    oriel: {
      knight: K(0xe8e0c8, 0x1a1810, 0x3a3020, 0xffe0a0, 0xfff0c8, 0xfff4d8, 0xffe8b8, 0xffc860, 0xfff0c8), weapon: 'chain',
      name: 'Oriel, the Lamp-Keeper', scale: 1.24, radius: .55, hp: 7200, ki: 460, poise: 64, walk: 2.2, run: 5.8, glimmer: 30000, voice: 'growl', pitch: 1.35,
      elite: true, track: 6, aggro: .9, evasive: .35, parry: .25, glow: .14, roarHazard: 'none', phase2At: .5, phase2Line: 'Oriel lights the lamp once more',
      attacks: [
        A('Lamp-Chain', 4.4, [S('swing', .45, .14, .06, 84, { reach: 4.4, arc: 150, lunge: .6, kact: 'ch_lash' }), S('swing', .32, .14, .06, 84, { reach: 4.4, arc: 150, lunge: .6, kact: 'ch_back' }), S('overhead', .4, .16, .9, 100, { reach: 4.4, arc: 60, lunge: .8, kact: 'ch_crack' })]),
        A('Wheel of the Lamp', 4.4, [S('spin', .55, .5, .9, 96, { reach: 4.4, arc: 360, kact: 'ch_wheel' })], { w: .8 }),
        A('Beacon', 18, [S('cast', .9, .15, .8, 70, { proj: { kind: 'orb', count: 5, speed: 8.5 }, kact: 'ch_snap' })], { minRange: 5, w: 1 }),
        A('Undertow Lash', 14, [S('swing', .7, .2, .9, 90, { reach: 4.2, arc: 150, kact: 'ch_hstorm', wave: dustWave(4, { spread: .3, len: 16 }) })], { minRange: 4, cd: 6, w: .9 }),
        A('Lighthouse Fall', 11, [S('leap', .65, .7, 1.1, 140, { reach: 0, aoe: 3.2, burst: true, hyper: true, shake: .9, kact: 'ch_leap' })], { minRange: 4.5, cd: 7, w: .8 }),
      ],
      phase2: [
        A('The Lamp Relit', 30, [S('roar', 1.1, .5, .5, 0, { hyper: true })], { once: true }),
        A('Sweep of the Beam', 20, [S('cast', 1, .3, .9, 90, { reach: 0, wave: dustWave(14, { ring: true, len: 15 }) })], { cd: 7, w: 1 }),
        A('Storm-Lantern', 4.4, [
          S('swing', .34, .14, .04, 84, { reach: 4.5, arc: 150, lunge: .6, kact: 'ch_lash' }),
          S('swing', .24, .14, .04, 84, { reach: 4.5, arc: 150, lunge: .6, kact: 'ch_back' }),
          S('spin', .3, .45, .05, 92, { reach: 4.5, arc: 360, kact: 'ch_mill' }),
          S('overhead', .4, .18, 1.2, 130, { reach: 4.4, arc: 60, aoe: 2.4, burst: true, kact: 'ch_hcross', wave: dustWave(6, { ring: true, len: 10 }) }),
        ], { w: 1.1 }),
      ],
    },
    // The warlord: Gloam, the Shell-Colossus, a ratman grown vast in the moon's shallows, its back a hill of shell.
    gloam: {
      model: 'ratman-brute', tint: 0xd8d4c8, glowTint: 0xeef2ff, name: 'Gloam, the Shell-Colossus', regalia: 'crown', scale: 2.3, radius: 1.3, hp: 16000, ki: 700, poise: 100, walk: 1.8, run: 5, glimmer: 110000, voice: 'growl', pitch: .35,
      boss: true, track: 3.4, aggro: .92, roarHazard: 'frost', phase2At: .5, armor: { phase2: true, reduce: .3 },
      attacks: [
        A('Shell Maul', 4.2, [S('swing', .7, .16, .1, 130, { reach: 4.2, arc: 150, lunge: 1.4 }), S('backswing', .5, .16, .1, 130, { reach: 4.2, arc: 150, lunge: 1.4 }), S('overhead', .6, .2, 1.1, 170, { reach: 4, arc: 70, lunge: 1.5, aoe: 2.8, shake: .8 })]),
        A('Rolling Shell', 10, [S('thrust', .7, .5, 1, 150, { reach: 3.4, arc: 120, lunge: 9, burst: true, shake: .6 })], { minRange: 5, cd: 6, w: .9 }),
        A('Spray of the Shallows', 18, [S('cast', .9, .15, .8, 80, { proj: { kind: 'orb', count: 7, speed: 8 } })], { minRange: 5, w: 1 }),
        A('Low Tide', 16, [S('overhead', .95, .2, 1, 130, { reach: 3.4, arc: 70, aoe: 2.6, wave: dustWave(7, { spread: .24, len: 18 }) })], { minRange: 4, cd: 6, w: 1 }),
        A('Dune Breaker', 16, [S('leap', .85, .9, 1.3, 200, { reach: 0, aoe: 4.8, burst: true, hyper: true, shake: 1.3, wave: dustWave(10, { ring: true, len: 12 }) })], { minRange: 5, cd: 9, w: .8 }),
      ],
      phase2: [
        A('The Shell Closes', 30, [S('roar', 1.3, .7, .7, 0, { hyper: true })], { once: true }),
        A('Spring Tide', 22, [S('cast', 1.1, .3, .9, 100, { reach: 0, wave: dustWave(16, { ring: true, len: 16 }) })], { cd: 7, w: 1.1 }),
        A('Undertow', 4.2, [S('spin', .6, .6, .1, 140, { reach: 4.2, arc: 360 }), S('overhead', .5, .2, 1.2, 180, { reach: 4, arc: 70, aoe: 3, burst: true, shake: .9, wave: dustWave(12, { ring: true, len: 12 }) })], { w: 1.1 }),
      ],
    },

    // ---- XII. The Hollows of Selene: the moon's inside, caverns of moon-crystal grown over the first fae's halls.
    'ratman-crystalback': kin('ratman-skirmisher', CRYSTAL, 0x8ff0ff, { name: 'Crystalback', glimmer: 1450, hp: 240, ki: 140 }, { chill: 12 }),
    'goblin-geomancer': {
      model: 'goblin-shaman', tint: CRYSTAL, glowTint: 0x8ff0ff, name: 'Goblin Geomancer', scale: .92, radius: .4, hp: 210, ki: 100, poise: 12, walk: 1.5, run: 3.9, glimmer: 1500, voice: 'growl', pitch: 1.3, style: 'ranged', prefer: [6, 12],
      attacks: [
        A('Crystal Shards', 15, [S('cast', .9, .15, .8, 40, { proj: { kind: 'shard', count: 5, speed: 10 } })], { minRange: 3 }),
        A('Crystal Ring', 12, [S('cast', 1.1, .2, .9, 38, { proj: { kind: 'shard', count: 12, speed: 8, ring: true } })], { cd: 7, w: .8 }),
        A('Stone Skin', 20, [S('cast', 1.2, .3, .6, 0, { heal: .2 })], { cd: 12, w: 2, cond: 'alliesHurt' }),
        A('Staff Swipe', 2.2, [S('swing', .5, .12, .6, 36, { reach: 2.2, lunge: .6, chill: 10 })], { w: .5 }),
      ],
    },
    'crystal-knight': {
      knight: GEODE, weapon: 'aegis', name: 'Crystal Knight', scale: 1.04, radius: .46, hp: 440, ki: 240, poise: 34, walk: 2, run: 5, glimmer: 1600, voice: 'growl', pitch: 1.1, shield: true, track: 5, aggro: .82,
      attacks: [
        A('Geode Cuts', 2.5, [S('swing', .42, .12, .08, 52, { reach: 2.5, lunge: .9, kact: 'ae_cut' }), S('backswing', .26, .12, .6, 54, { reach: 2.5, lunge: .9, kact: 'ae_back', chill: 10 })]),
        A('Shield Bash', 2.2, [S('thrust', .45, .12, .7, 46, { reach: 2.1, arc: 80, lunge: 1.8, poise: 40, kact: 'ae_bash' })], { w: .8 }),
        A('Crystal Charge', 7, [S('thrust', .55, .3, .9, 68, { reach: 2.2, arc: 90, lunge: 5.5, kact: 'ae_charge' })], { minRange: 3.5, cd: 6, w: .7 }),
        A('Shatter Slam', 9, [S('leap', .6, .55, 1, 80, { reach: 0, aoe: 2.2, shake: .5, kact: 'ae_leap', wave: crystalWave(5, { ring: true, len: 7 }) })], { minRange: 4, cd: 8, w: .6 }),
      ],
    },
    'moth-shade': {
      knight: K(0xb8a8c8, 0x140e1c, 0x3a2a4a, 0xf0d8ff, 0xf0d8ff, 0xfff0ff, 0xe8d0ff, 0xd8b8ff, 0xf0e0ff), weapon: 'fans', name: 'Moth-Shade', scale: .98, radius: .42, hp: 300, ki: 140, poise: 18, walk: 2.4, run: 6.4, glimmer: 1500, voice: 'squeal', pitch: 1.45, track: 7, aggro: .9, evasive: .65,
      attacks: [
        A('Wing Flurry', 2.6, [S('swing', .32, .1, .04, 36, { reach: 2.6, arc: 170, lunge: .8, kact: 'fn_open' }), S('swing', .2, .1, .04, 36, { reach: 2.6, arc: 170, lunge: .8, kact: 'fn_close' }), S('spin', .24, .3, .6, 44, { reach: 2.7, arc: 360, kact: 'fn_twirl' })]),
        A('Dust of Sleep', 14, [S('throw', .5, .12, .6, 30, { proj: { kind: 'knife', speed: 17, count: 5 }, kact: 'fn_hstorm' })], { minRange: 4, cd: 5, w: .8 }),
        A('Moth Step', 12, [S('cast', .35, .08, .05, 0, { blink: true, behind: true, kact: 'dash' }), S('swing', .25, .12, .7, 60, { reach: 2.6, arc: 150, lunge: .8, kact: 'fn_hwing' })], { minRange: 3, cd: 6, w: 1 }),
      ],
    },
    // The gatekeeper: Tessaly, the Crystal Warden, who cut the Hollows' halls out of the moon with a wheel of
    // crystal, and cuts anything that comes into them.
    tessaly: {
      knight: K(0x8ab8c8, 0x0c1820, 0x1a3a48, 0x8ff0ff, 0x8ff0ff, 0xe0ffff, 0x9fe8f8, 0x6ae0f0, 0xc0ffff), weapon: 'saw',
      name: 'Tessaly, the Crystal Warden', scale: 1.3, radius: .58, hp: 7800, ki: 500, poise: 72, walk: 2, run: 5.4, glimmer: 34000, voice: 'growl', pitch: 1.2,
      elite: true, track: 5, aggro: .9, evasive: .25, parry: .2, glow: .14, roarHazard: 'frost', phase2At: .5, phase2Line: 'Tessaly\'s wheel sings white-hot',
      attacks: [
        A('Grinding Chain', 3.2, [S('swing', .5, .16, .08, 90, { reach: 3.1, arc: 180, lunge: .9, kact: 'gw_sweep', chill: 12 }), S('swing', .36, .16, .08, 90, { reach: 3.1, arc: 180, lunge: .9, kact: 'gw_back', chill: 12 }), S('thrust', .4, .2, 1, 110, { reach: 3, arc: 70, lunge: 2.2, kact: 'gw_ram' })]),
        A('Wheel Press', 3.1, [S('overhead', .6, .3, 1, 130, { reach: 3, arc: 80, aoe: 2.2, shake: .6, kact: 'gw_hpress', frost: 2 })], { w: .8 }),
        A('Crystal Mill', 3.3, [S('spin', .5, .55, .9, 110, { reach: 3.3, arc: 360, kact: 'gw_mill', chill: 14 })], { w: .8 }),
        A('Shard Lines', 16, [S('overhead', .9, .2, 1, 100, { reach: 3, arc: 70, aoe: 2, kact: 'gw_hcross', wave: crystalWave(5, { spread: .28, len: 16 }) })], { minRange: 3.5, cd: 6, w: 1 }),
        A('Cave-In', 12, [S('leap', .7, .7, 1.1, 150, { reach: 0, aoe: 3.4, burst: true, hyper: true, shake: 1, kact: 'gw_cavein', frost: 3 })], { minRange: 4.5, cd: 8, w: .8 }),
      ],
      phase2: [
        A('White Wheel', 30, [S('roar', 1.1, .5, .5, 0, { hyper: true })], { once: true }),
        A('Geode Burst', 18, [S('cast', 1, .3, .9, 80, { proj: { kind: 'shard', count: 16, speed: 9, ring: true } })], { cd: 7, w: 1 }),
        A('Grinding Storm', 3.3, [S('spin', .45, .6, .05, 110, { reach: 3.4, arc: 360, kact: 'gw_lwheel', chill: 14 }), S('overhead', .45, .2, 1.2, 150, { reach: 3.2, arc: 80, aoe: 2.6, burst: true, shake: .8, kact: 'gw_hpress', wave: crystalWave(10, { ring: true, len: 11 }) })], { w: 1.1 }),
      ],
    },
    // The warlord: Nyx, Mother of Moths, who fed on the moon's inner light and filled the Hollows with her young.
    nyx: {
      model: 'ratman-shaman', tint: 0xb8a8c8, glowTint: 0xf0d8ff, name: 'Nyx, Mother of Moths', regalia: 'halo', scale: 2.05, radius: .95, hp: 17000, ki: 600, poise: 80, walk: 2, run: 5, glimmer: 125000, voice: 'squeal', pitch: .6,
      boss: true, track: 4.5, aggro: .9, style: 'ranged', prefer: [4, 9], roarHazard: 'none', phase2At: .5,
      attacks: [
        A('Wing Buffet', 3.4, [S('swing', .55, .16, .08, 110, { reach: 3.4, arc: 170, lunge: 1 }), S('backswing', .4, .16, .9, 120, { reach: 3.4, arc: 170, lunge: 1 })]),
        A('Moth Swarm', 20, [S('cast', .85, .15, .8, 70, { proj: { kind: 'orb', count: 7, speed: 8 } })], { minRange: 4, w: 1.2 }),
        A('Dust of Dreams', 16, [S('cast', 1, .2, .9, 90, { reach: 0, wave: crystalWave(5, { spread: .3, len: 16, color: 0xe8d0ff }) })], { minRange: 4, cd: 6, w: 1 }),
        A('Moth\'s Descent', 12, [S('cast', .45, .08, .05, 0, { blink: true, behind: true }), S('overhead', .35, .18, 1, 150, { reach: 3.4, arc: 100, aoe: 2.4 })], { minRange: 3, cd: 7, w: .9 }),
        A('Lure of Light', 18, [S('cast', 1.1, .3, .9, 70, { proj: { kind: 'orb', count: 14, speed: 6.5, ring: true } })], { cd: 8, w: .9 }),
      ],
      phase2: [
        A('The Moths Wake', 30, [S('roar', 1.3, .7, .7, 0, { hyper: true })], { once: true }),
        A('Moonlight Moth-Storm', 20, [S('cast', 1, .3, .9, 80, { proj: { kind: 'orb', count: 22, speed: 7, ring: true } })], { cd: 7, w: 1 }),
        A('Wings of Night', 18, [S('cast', 1.1, .3, .9, 110, { reach: 0, wave: crystalWave(16, { ring: true, len: 16, color: 0xe8d0ff }) })], { cd: 8, w: 1 }),
      ],
    },

    // ---- XIII. The Necropolis of the First Fae: the tombs of the fae who went to the moon to keep its light.
    'hollow-courtier': {
      knight: HOLLOWED, weapon: 'rapier', name: 'Hollowed Courtier', scale: 1, radius: .44, hp: 400, ki: 190, poise: 24, walk: 2.4, run: 6.2, glimmer: 1700, voice: 'growl', pitch: 1.3, track: 7, aggro: .9, evasive: .55, parry: .35,
      attacks: [
        A('Courtly Cuts', 2.9, [S('thrust', .38, .12, .05, 50, { reach: 2.9, arc: 50, lunge: 1.2, kact: 'rp_lunge' }), S('swing', .24, .12, .05, 50, { reach: 2.8, arc: 150, lunge: 1, kact: 'rp_cut' }), S('thrust', .3, .16, .7, 62, { reach: 3, arc: 50, lunge: 2, kact: 'rp_balestra' })]),
        A('Hundred Points', 3, [S('thrust', .5, .5, .9, 70, { reach: 3, arc: 50, lunge: 1.4, kact: 'rp_hundred' })], { w: .8 }),
        A('Fleche', 8, [S('thrust', .55, .25, .9, 80, { reach: 3, arc: 50, lunge: 7, burst: true, kact: 'rp_fleche' })], { minRange: 4, cd: 6, w: .8 }),
      ],
    },
    'hollow-guard': {
      knight: HOLLOWED, weapon: 'aegis', name: 'Hollowed Guard', scale: 1.08, radius: .48, hp: 520, ki: 280, poise: 40, walk: 1.9, run: 4.8, glimmer: 1900, voice: 'growl', pitch: .95, shield: true, track: 4.5, aggro: .8,
      attacks: [
        A('Tomb Cuts', 2.5, [S('swing', .45, .12, .08, 60, { reach: 2.5, lunge: .9, kact: 'ae_cut' }), S('overhead', .3, .14, .7, 70, { reach: 2.5, arc: 90, lunge: 1, kact: 'ae_hchop' })]),
        A('Shield Wall', 2.2, [S('thrust', .5, .14, .8, 54, { reach: 2.2, arc: 90, lunge: 2, poise: 50, kact: 'ae_upbash' })], { w: .8 }),
        A('Tomb Slam', 9, [S('leap', .6, .55, 1, 90, { reach: 0, aoe: 2.4, shake: .5, kact: 'ae_slam', wave: graveWave(5, { ring: true, len: 7 }) })], { minRange: 4, cd: 8, w: .6 }),
        A('Tomb Grasp', 2.4, [S('thrust', .7, .2, 1, 90, { reach: 2.3, arc: 70, lunge: 2, burst: true, grab: { hold: 1.2 }, kact: 'ae_upbash' })], { cd: 10, w: .6 }),
      ],
    },
    'ratman-gravewight': kin('ratman-packleader', ASH, 0xd8c8ff, { name: 'Gravewight', glimmer: 2000, hp: 460 }),
    'goblin-bonecaller': {
      model: 'goblin-shaman', tint: ASH, glowTint: 0xd8c8ff, name: 'Goblin Bonecaller', scale: .92, radius: .4, hp: 220, ki: 100, poise: 12, walk: 1.5, run: 3.9, glimmer: 1650, voice: 'growl', pitch: 1.25, style: 'ranged', prefer: [7, 12],
      attacks: [
        A('Grave Orbs', 15, [S('cast', .95, .15, .8, 44, { proj: { kind: 'orb', count: 4, speed: 8 } })], { minRange: 3 }),
        A('Lament', 13, [S('cast', 1.1, .2, .9, 56, { reach: 0, wave: graveWave(3, { spread: .3, len: 13 }) })], { minRange: 4, cd: 7, w: .9 }),
        A('Raise the Hollow', 20, [S('cast', 1.2, .3, .6, 0, { heal: .25 })], { cd: 12, w: 2, cond: 'alliesHurt' }),
        A('Bone Swipe', 2.2, [S('swing', .5, .12, .6, 36, { reach: 2.2, lunge: .6 })], { w: .5 }),
      ],
    },
    // The gatekeeper: Sir Corvin the Unsleeping, who swore to guard the tombs until the first fae woke. They have
    // not woken. He has not slept.
    corvin: {
      knight: K(0xa8a0b8, 0x100c18, 0x2a2238, 0xd8c8ff, 0xd8c8ff, 0xf0e8ff, 0xb8a8d8, 0xa890e0, 0xe0d0ff), weapon: 'great',
      name: 'Sir Corvin the Unsleeping', scale: 1.3, radius: .58, hp: 8400, ki: 520, poise: 72, walk: 2, run: 5.4, glimmer: 38000, voice: 'growl', pitch: .9,
      elite: true, track: 5, aggro: .9, evasive: .25, parry: .3, glow: .12, roarHazard: 'none', phase2At: .5, phase2Line: 'Sir Corvin will not sleep',
      attacks: [
        A('Tomb-Tide', 3.3, [S('swing', .5, .16, .08, 96, { reach: 3.3, arc: 190, lunge: 1, kact: 'wb_sweep' }), S('swing', .34, .16, .08, 96, { reach: 3.3, arc: 190, lunge: 1, kact: 'wb_return' }), S('spin', .36, .4, .9, 110, { reach: 3.4, arc: 360, kact: 'wb_turn' })]),
        A('Falling Vigil', 3.2, [S('overhead', .6, .16, 1, 130, { reach: 3.2, arc: 80, lunge: 1.2, aoe: 1.8, kact: 'wb_hfall' })], { w: .8 }),
        A('Vigil\'s Rush', 8, [S('thrust', .6, .3, .9, 110, { reach: 3.2, arc: 50, lunge: 6, burst: true, kact: 'wb_rush' })], { minRange: 4, cd: 6, w: .8 }),
        A('Lament of Blades', 15, [S('swing', .75, .2, .9, 100, { reach: 3.2, arc: 150, kact: 'wb_hcross', wave: graveWave(5, { spread: .26, len: 16 }) })], { minRange: 3.5, cd: 6, w: .9 }),
        A('Leaping Cleave', 11, [S('leap', .65, .65, 1.1, 150, { reach: 0, aoe: 3, burst: true, hyper: true, shake: .9, kact: 'wb_hleap' })], { minRange: 4.5, cd: 7, w: .8 }),
      ],
      phase2: [
        A('Unsleeping', 30, [S('roar', 1.1, .5, .5, 0, { hyper: true })], { once: true }),
        A('The Long Watch', 3.4, [
          S('swing', .38, .16, .05, 96, { reach: 3.4, arc: 190, lunge: 1, kact: 'wb_sweep' }),
          S('swing', .28, .16, .05, 96, { reach: 3.4, arc: 190, lunge: 1, kact: 'wb_return' }),
          S('overhead', .34, .16, .05, 110, { reach: 3.3, arc: 80, lunge: 1.2, kact: 'wb_hsplit' }),
          S('spin', .4, .5, 1.3, 130, { reach: 3.6, arc: 360, burst: true, kact: 'wb_lwhirl', wave: graveWave(10, { ring: true, len: 11 }) }),
        ], { w: 1.2 }),
      ],
    },
    // The warlords, a pair: the Hollow King and the Hollow Queen, the first fae, who came up to keep the moon's
    // light and have kept nothing, for an age, but each other.
    'hollow-king': {
      knight: K(0xd8c8a0, 0x14100a, 0x3a2a1a, 0xffe0a0, 0xffe0a0, 0xfff0c8, 0xe0c890, 0xffc860, 0xffe8b0), weapon: 'hammer',
      name: 'Aurel, the Hollow King', scale: 1.5, radius: .66, hp: 11000, ki: 560, poise: 85, walk: 2, run: 5.2, glimmer: 70000, voice: 'growl', pitch: .75,
      boss: true, duo: true, track: 4.5, aggro: .9, evasive: .2, parry: .2, glow: .14, roarHazard: 'none', phase2Line: 'The Hollow King grieves, and the tombs shake',
      attacks: [
        A('Royal Rhythm', 3.2, [S('swing', .5, .16, .08, 110, { reach: 3.2, arc: 190, lunge: .9, kact: 'h_side' }), S('swing', .36, .16, .08, 110, { reach: 3.2, arc: 190, lunge: .9, kact: 'h_back' }), S('overhead', .48, .16, 1, 140, { reach: 3.1, arc: 90, aoe: 2.4, kact: 'h_over' })]),
        A('Crown-Quake', 13, [S('overhead', .8, .2, 1, 120, { reach: 2.8, arc: 90, aoe: 2.6, shake: .7, kact: 'h_quake', wave: graveWave(10, { ring: true, len: 11 }) })], { cd: 7, w: .9 }),
        A('Great Turn', 3.4, [S('spin', .5, .5, .9, 120, { reach: 3.4, arc: 360, kact: 'h_spin' })], { w: .8 }),
        A('King\'s March', 8, [S('thrust', .5, .35, .8, 110, { reach: 2.6, arc: 120, lunge: 6, kact: 'h_charge' })], { minRange: 4, cd: 5 }),
        A('Meteor', 12, [S('leap', .75, .7, 1.1, 170, { reach: 0, aoe: 3.4, burst: true, hyper: true, shake: 1, kact: 'h_hmeteor' })], { minRange: 4.5, cd: 7, w: .8 }),
      ],
      phase2: [   // his queen fallen
        A('Grief of the King', 30, [S('roar', 1.2, .6, .6, 0, { hyper: true })], { once: true }),
        A('The Tombs Shake', 3.4, [S('spin', .5, .55, .1, 120, { reach: 3.4, arc: 360, kact: 'h_lwheel' }), S('overhead', .5, .2, 1.2, 170, { reach: 3.2, arc: 90, aoe: 3, burst: true, shake: .9, kact: 'h_hcrush', wave: graveWave(12, { ring: true, len: 12 }) })], { w: 1.2 }),
        A('Crown of Tombs', 16, [S('overhead', .8, .2, 1, 130, { reach: 2.8, arc: 90, aoe: 2.6, kact: 'h_quake', wave: graveWave(6, { spread: .26, len: 18 }) })], { minRange: 3.5, cd: 6, w: 1 }),
      ],
    },
    'hollow-queen': {
      knight: K(0xe8e0f0, 0x100c18, 0x2a1a3a, 0xf0d8ff, 0xf0d8ff, 0xfff0ff, 0xe8d0ff, 0xd8b8ff, 0xf0e0ff), weapon: 'fans',
      name: 'Ilune, the Hollow Queen', scale: 1.42, radius: .6, hp: 9000, ki: 480, poise: 70, walk: 2.4, run: 6.4, glimmer: 70000, voice: 'growl', pitch: 1.4,
      boss: true, duo: true, track: 6, aggro: .9, evasive: .55, parry: .35, glow: .14, style: 'ranged', prefer: [4, 9], roarHazard: 'none', phase2Line: 'The Hollow Queen dances alone',
      attacks: [
        A('Court Dance', 2.9, [S('swing', .36, .12, .05, 90, { reach: 2.9, arc: 170, lunge: .9, kact: 'fn_twirl' }), S('swing', .24, .12, .05, 90, { reach: 2.9, arc: 170, lunge: .9, kact: 'fn_dance' }), S('spin', .3, .4, .8, 104, { reach: 3.1, arc: 360, kact: 'fn_flutter' })]),
        A('Fan Storm', 16, [S('throw', .55, .15, .7, 70, { proj: { kind: 'knife', speed: 18, count: 7 }, kact: 'fn_hstorm' })], { minRange: 4, cd: 5, w: 1.1 }),
        A('Moonlit Veil', 16, [S('cast', 1, .2, .9, 80, { reach: 0, wave: graveWave(4, { spread: .3, len: 15 }) })], { minRange: 4, cd: 6, w: 1 }),
        A('Queen\'s Step', 12, [S('cast', .35, .08, .05, 0, { blink: true, behind: true, kact: 'dash' }), S('swing', .26, .14, .9, 130, { reach: 3, arc: 150, lunge: .8, kact: 'fn_hwing' })], { minRange: 3, cd: 6, w: 1 }),
      ],
      phase2: [   // her king fallen
        A('Grief of the Queen', 30, [S('roar', 1.1, .5, .5, 0, { hyper: true })], { once: true }),
        A('Last Dance', 3, [S('swing', .3, .12, .04, 90, { reach: 3, arc: 170, lunge: .9, kact: 'fn_twirl' }), S('swing', .2, .12, .04, 90, { reach: 3, arc: 170, lunge: .9, kact: 'fn_dance' }), S('spin', .26, .4, .05, 104, { reach: 3.1, arc: 360, kact: 'fn_flutter' }), S('leap', .4, .5, 1.2, 140, { reach: 0, aoe: 2.8, burst: true, hyper: true, kact: 'fn_leap', wave: graveWave(10, { ring: true, len: 11 }) })], { w: 1.2 }),
        A('Moths of Mourning', 18, [S('throw', .6, .15, .8, 76, { proj: { kind: 'knife', speed: 16, count: 12 }, kact: 'fn_ldevil' })], { minRange: 3, cd: 6, w: 1 }),
      ],
    },

    // ---- XIV. The Umbral Sea: the moon's dark side, a sea of black glass where the Eclipse's shadow pools.
    'umbral-knight': {
      knight: UMBRAL, weapon: 'katana', name: 'Umbral Knight', scale: 1.02, radius: .45, hp: 420, ki: 200, poise: 26, walk: 2.3, run: 6.2, glimmer: 1900, voice: 'growl', pitch: 1.1, track: 7, aggro: .92, evasive: .5, parry: .38,
      attacks: [
        A('Dark Draw', 2.9, [S('swing', .4, .12, .7, 66, { reach: 2.9, arc: 170, lunge: 1.2, kact: 'kt_rdraw', chill: 8 })]),
        A('Night Water', 2.8, [S('swing', .36, .14, .06, 54, { reach: 2.8, arc: 160, lunge: 1, kact: 'kt_cut' }), S('swing', .22, .14, .06, 54, { reach: 2.8, arc: 160, lunge: 1, kact: 'kt_back' }), S('thrust', .28, .18, .8, 64, { reach: 3, arc: 50, lunge: 2, kact: 'kt_thrust' })]),
        A('Umbral Crescent', 14, [S('swing', .6, .14, .8, 60, { reach: 2.8, arc: 150, kact: 'kt_three', wave: voidWave(1) })], { minRange: 3.5, cd: 6, w: .7 }),
      ],
    },
    'ratman-voidfang': kin('ratman-assassin', UMBRA, 0xb07aff, { name: 'Voidfang', glimmer: 2000, hp: 260, dmgK: 1.1 }, { chill: 8 }),
    'goblin-nightbrute': kin('goblin-berserker', UMBRA, 0xb07aff, { name: 'Night-Brute', glimmer: 2000, hp: 380, ki: 200 }),
    'goblin-voidcaller': {
      model: 'goblin-shaman', tint: UMBRA, glowTint: 0xb07aff, name: 'Goblin Voidcaller', scale: .92, radius: .4, hp: 230, ki: 100, poise: 12, walk: 1.5, run: 3.9, glimmer: 1800, voice: 'growl', pitch: 1.2, style: 'ranged', prefer: [7, 13],
      attacks: [
        A('Void Orbs', 15, [S('cast', .9, .15, .8, 46, { proj: { kind: 'orb', count: 4, speed: 8.5 } })], { minRange: 3 }),
        A('Undark', 13, [S('cast', 1.1, .2, .9, 60, { reach: 0, wave: voidWave(3, { spread: .3, len: 14 }) })], { minRange: 4, cd: 7, w: .9 }),
        A('Void Ring', 12, [S('cast', 1.1, .2, .9, 40, { proj: { kind: 'orb', count: 12, speed: 6.5, ring: true } })], { cd: 8, w: .7 }),
        A('Staff Swipe', 2.2, [S('swing', .5, .12, .6, 38, { reach: 2.2, lunge: .6 })], { w: .5 }),
      ],
    },
    // The gatekeeper: Vesper, the knight who stayed on the dark side to watch the Eclipse, and watched too long.
    vesper: {
      knight: K(0x3a3450, 0x06040c, 0x1a1430, 0xb08aff, 0xd0b0ff, 0xe0d0ff, 0x6a5a9a, 0x9a6aff, 0xc8a8ff), weapon: 'tonfas',
      name: 'Vesper, the Watcher in the Dark', scale: 1.2, radius: .54, hp: 9000, ki: 540, poise: 66, walk: 2.4, run: 6.6, glimmer: 44000, voice: 'growl', pitch: 1.25,
      elite: true, track: 7, aggro: .95, evasive: .5, parry: .4, glow: .14, roarHazard: 'none', phase2At: .5, phase2Line: 'Vesper looks into the dark, and it looks back',
      attacks: [
        A('Watcher\'s Barrage', 2.6, [S('thrust', .34, .1, .04, 76, { reach: 2.5, arc: 60, lunge: 1, kact: 'tf_jab' }), S('thrust', .2, .1, .04, 76, { reach: 2.5, arc: 60, lunge: 1, kact: 'tf_cross' }), S('swing', .22, .12, .04, 80, { reach: 2.6, arc: 120, lunge: 1, kact: 'tf_elbow' }), S('overhead', .3, .16, .8, 100, { reach: 2.6, arc: 80, lunge: 1.2, kact: 'tf_hammer' })], { w: 1.1 }),
        A('Spinning Guard', 2.8, [S('spin', .4, .45, .8, 96, { reach: 2.8, arc: 360, kact: 'tf_spin' })], { w: .8 }),
        A('Night Rush', 8, [S('thrust', .5, .25, .8, 110, { reach: 2.6, arc: 80, lunge: 7, burst: true, kact: 'tf_rush' })], { minRange: 4, cd: 5, w: .9 }),
        A('Eclipse Step', 12, [S('cast', .35, .08, .05, 0, { blink: true, behind: true, kact: 'dash' }), S('overhead', .26, .16, .9, 130, { reach: 2.8, arc: 100, aoe: 2, kact: 'tf_hupper' })], { minRange: 3, cd: 7, w: .9 }),
        A('Falling Dark', 12, [S('leap', .6, .6, 1, 150, { reach: 0, aoe: 3, burst: true, hyper: true, shake: .9, kact: 'tf_hleap', wave: voidWave(8, { ring: true, len: 10 }) })], { minRange: 4.5, cd: 8, w: .8 }),
      ],
      phase2: [
        A('It Looks Back', 30, [S('roar', 1.1, .5, .5, 0, { hyper: true })], { once: true }),
        A('Hundred Nights', 2.8, [
          S('thrust', .26, .1, .03, 70, { reach: 2.6, arc: 60, lunge: 1, kact: 'tf_jab' }),
          S('thrust', .16, .1, .03, 70, { reach: 2.6, arc: 60, lunge: 1, kact: 'tf_cross' }),
          S('thrust', .16, .1, .03, 70, { reach: 2.6, arc: 60, lunge: 1, kact: 'tf_barrage' }),
          S('spin', .22, .35, .04, 84, { reach: 2.8, arc: 360, kact: 'tf_hspin' }),
          S('overhead', .36, .18, 1.3, 140, { reach: 2.8, arc: 90, aoe: 2.4, burst: true, kact: 'tf_hstorm', wave: voidWave(6, { spread: .3, len: 14 }) }),
        ], { w: 1.2 }),
        A('Undark Tide', 20, [S('cast', 1, .3, .9, 90, { reach: 0, wave: voidWave(14, { ring: true, len: 15 }) })], { cd: 8, w: .9 }),
      ],
    },
    // The warlord: Nightmaw, Hound of the Eclipse, that runs the black glass and brings back whatever light it finds.
    nightmaw: {
      model: 'ratman-packleader', tint: 0x2a2238, glowTint: 0xb07aff, name: 'Nightmaw, Hound of the Eclipse', regalia: 'horns', scale: 2.2, radius: 1.15, hp: 19000, ki: 700, poise: 95, walk: 2.4, run: 6.8, glimmer: 150000, voice: 'growl', pitch: .4,
      boss: true, track: 5, aggro: .95, evasive: .25, roarHazard: 'frost', phase2At: .5,
      attacks: [
        A('Rending Chain', 4, [S('swing', .5, .14, .06, 130, { reach: 4, arc: 150, lunge: 1.6 }), S('backswing', .36, .14, .06, 130, { reach: 4, arc: 150, lunge: 1.6 }), S('thrust', .45, .2, 1, 160, { reach: 4, arc: 60, lunge: 3, burst: true })]),
        A('Maw Rush', 11, [S('thrust', .6, .45, 1, 170, { reach: 3.6, arc: 100, lunge: 10, burst: true, shake: .6 })], { minRange: 5, cd: 5, w: 1 }),
        A('Shadow Pounce', 14, [S('leap', .7, .7, 1.1, 200, { reach: 0, aoe: 4, burst: true, hyper: true, shake: 1.1, wave: voidWave(8, { ring: true, len: 10 }) })], { minRange: 5, cd: 8, w: .9 }),
        A('Howl of the Dark Side', 16, [S('cast', 1, .3, .9, 100, { reach: 0, wave: voidWave(7, { spread: .24, len: 18 }) })], { minRange: 4, cd: 6, w: 1 }),
        A('Snapping Turn', 4, [S('spin', .5, .5, .9, 150, { reach: 4, arc: 360 })], { w: .8 }),
      ],
      phase2: [
        A('The Eclipse Calls', 30, [S('roar', 1.3, .7, .7, 0, { hyper: true })], { once: true }),
        A('Starless Night', 20, [S('cast', 1, .3, .9, 90, { proj: { kind: 'orb', count: 20, speed: 7, ring: true } })], { cd: 7, w: 1 }),
        A('Hunt of the Hound', 4.4, [S('thrust', .4, .3, .1, 160, { reach: 4, arc: 80, lunge: 7, burst: true }), S('thrust', .35, .3, .1, 160, { reach: 4, arc: 80, lunge: 7, burst: true }), S('leap', .5, .6, 1.2, 210, { reach: 0, aoe: 4.2, burst: true, hyper: true, shake: 1.2, wave: voidWave(12, { ring: true, len: 12 }) })], { w: 1.2 }),
      ],
    },

    // ---- XV. The Heart of the Moon: the hollow at the moon's core, where the first fae chained the Eclipse.
    'eclipse-knight': {
      knight: ECLIPSE, weapon: 'hexblade', name: 'Knight of the Eclipse', scale: 1.04, radius: .46, hp: 460, ki: 220, poise: 30, walk: 2.3, run: 6, glimmer: 2300, voice: 'growl', pitch: 1, track: 7, aggro: .92, evasive: .45, parry: .4,
      attacks: [
        A('Corona Cuts', 2.9, [S('swing', .38, .12, .05, 64, { reach: 2.9, arc: 160, lunge: 1, kact: 'hx_cut1' }), S('swing', .24, .12, .05, 64, { reach: 2.9, arc: 160, lunge: 1, kact: 'hx_cut2' }), S('thrust', .3, .16, .8, 76, { reach: 3, arc: 50, lunge: 2, kact: 'hx_stab' })]),
        A('Black Sun', 12, [S('cast', .7, .15, .8, 56, { proj: { kind: 'orb', count: 3, speed: 8.5 }, kact: 'hx_palm' })], { minRange: 4, cd: 5, w: .8 }),
        A('Corona Storm', 14, [S('swing', .7, .2, .9, 70, { reach: 3, arc: 150, kact: 'hx_lstorm', wave: coronaWave(3, { spread: .28 }) })], { minRange: 3.5, cd: 7, w: .7 }),
      ],
    },
    'eclipse-lancer': {
      knight: ECLIPSE, weapon: 'glaive', name: 'Lancer of the Eclipse', scale: 1.06, radius: .46, hp: 470, ki: 230, poise: 32, walk: 2.2, run: 5.8, glimmer: 2300, voice: 'growl', pitch: .95, track: 6.5, aggro: .9, evasive: .35,
      attacks: [
        A('Umbra Lance', 3.4, [S('thrust', .42, .14, .06, 66, { reach: 3.4, arc: 50, lunge: 1.2, kact: 'g_pierce' }), S('swing', .3, .14, .7, 70, { reach: 3.3, arc: 160, lunge: .8, kact: 'g_sweep' })]),
        A('Helix', 3.4, [S('spin', .5, .5, .8, 76, { reach: 3.4, arc: 360, kact: 'g_helix' })], { w: .7 }),
        A('Corona Vault', 9, [S('leap', .55, .5, .9, 90, { reach: 0, aoe: 2.2, shake: .45, kact: 'g_moonfall', wave: coronaWave(5, { ring: true, len: 8 }) })], { minRange: 4, cd: 7, w: .7 }),
      ],
    },
    // The gatekeeper: Selene, the First Lantern, the first fae queen, who chained the Eclipse with her own light
    // and has held the chain ever since. She fights with the light in her hands.
    selene: {
      knight: K(0xf4f6ff, 0x101428, 0x2a3a6a, 0xffffff, 0xffffff, 0xffffff, 0xe8f0ff, 0xd8e8ff, 0xffffff), weapon: 'fists',
      name: 'Selene, the First Lantern', scale: 1.28, radius: .56, hp: 10000, ki: 560, poise: 70, walk: 2.4, run: 6.8, glimmer: 52000, voice: 'growl', pitch: 1.55,
      elite: true, track: 7.5, aggro: .95, evasive: .5, parry: .45, glow: .18, roarHazard: 'frost', phase2At: .5, phase2Line: 'Selene lets the chain go slack',
      attacks: [
        A('Lantern Hands', 2.5, [S('thrust', .32, .1, .04, 80, { reach: 2.4, arc: 60, lunge: 1, kact: 'x_jab' }), S('thrust', .2, .1, .04, 80, { reach: 2.4, arc: 60, lunge: 1, kact: 'x_cross' }), S('swing', .24, .12, .04, 86, { reach: 2.5, arc: 120, lunge: 1, kact: 'x_hook' }), S('overhead', .3, .16, .8, 110, { reach: 2.6, arc: 90, lunge: 1.2, kact: 'x_axe' })], { w: 1.1 }),
        A('Moonwheel Kick', 2.8, [S('spin', .4, .45, .8, 104, { reach: 2.8, arc: 360, kact: 'x_cyclone' })], { w: .8 }),
        A('Falling Light', 9, [S('thrust', .5, .25, .8, 120, { reach: 2.5, arc: 80, lunge: 7, burst: true, kact: 'x_flykick' })], { minRange: 4, cd: 5, w: .9 }),
        A('Lantern Palm', 16, [S('cast', .6, .15, .8, 80, { proj: { kind: 'orb', count: 5, speed: 9 }, kact: 'x_palm' })], { minRange: 4, cd: 5, w: 1 }),
        A('Rising Dragon', 11, [S('leap', .6, .6, 1, 160, { reach: 0, aoe: 3, burst: true, hyper: true, shake: .9, kact: 'x_dragon', wave: dustWave(10, { ring: true, len: 11 }) })], { minRange: 4.5, cd: 8, w: .8 }),
      ],
      phase2: [
        A('The Chain Slackens', 30, [S('roar', 1.1, .5, .5, 0, { hyper: true })], { once: true }),
        A('First Light', 20, [S('cast', 1, .3, .9, 90, { reach: 0, wave: dustWave(16, { ring: true, len: 16 }) })], { cd: 7, w: 1 }),
        A('A Thousand Lanterns', 2.6, [
          S('thrust', .24, .1, .03, 76, { reach: 2.5, arc: 60, lunge: 1, kact: 'x_jab' }),
          S('thrust', .16, .1, .03, 76, { reach: 2.5, arc: 60, lunge: 1, kact: 'x_cross' }),
          S('swing', .18, .12, .03, 82, { reach: 2.6, arc: 120, lunge: 1, kact: 'x_spinhook' }),
          S('swing', .2, .12, .03, 86, { reach: 2.6, arc: 120, lunge: 1, kact: 'x_round' }),
          S('overhead', .34, .2, 1.3, 150, { reach: 2.8, arc: 90, aoe: 2.6, burst: true, kact: 'x_uppercut', wave: dustWave(8, { ring: true, len: 10 }) }),
        ], { w: 1.2 }),
      ],
    },
    // The warlord: the Eclipse, That Eats the Moon, the dark the first fae chained at its heart. It wears a
    // knight's shape because a knight is what came for it.
    eclipse: {
      knight: K(0x0c0a10, 0x000000, 0x06040a, 0xffc860, 0xffe0a0, 0xfff0c8, 0x1a1208, 0xffb040, 0xffd890), weapon: 'scythe',
      name: 'The Eclipse, That Eats the Moon', scale: 1.9, radius: .8, hp: 24000, ki: 800, poise: 100, walk: 2.4, run: 6.8, glimmer: 220000, voice: 'growl', pitch: .45,
      boss: true, track: 6.5, aggro: .95, evasive: .45, parry: .35, glow: .2, roarHazard: 'fire', phase2At: .5,
      attacks: [
        A('Reaping Dark', 3.8, [S('swing', .44, .14, .05, 130, { reach: 3.8, arc: 190, lunge: 1.1, kact: 'sc_reap' }), S('swing', .3, .14, .05, 130, { reach: 3.8, arc: 190, lunge: 1.1, kact: 'sc_return' }), S('spin', .36, .45, .9, 160, { reach: 4, arc: 360, kact: 'sc_spin' })]),
        A('Corona Crescent', 18, [S('swing', .8, .2, 1, 130, { reach: 3.6, arc: 150, kact: 'sc_hmoon', wave: coronaWave(5, { spread: .26, len: 18 }) })], { minRange: 4, cd: 6, w: 1 }),
        A('Umbra Step', 12, [S('cast', .35, .08, .05, 0, { blink: true, behind: true, kact: 'dash' }), S('swing', .26, .16, .9, 170, { reach: 3.8, arc: 190, kact: 'sc_hcross' })], { minRange: 3, cd: 6, w: 1 }),
        A('Totality', 14, [S('leap', .7, .7, 1.1, 210, { reach: 0, aoe: 4.2, burst: true, hyper: true, shake: 1.2, kact: 'sc_hleap', wave: coronaWave(10, { ring: true, len: 12 }), fire: 2 })], { minRange: 5, cd: 8, w: .9 }),
        A('Black Moons', 18, [S('cast', .7, .15, .8, 100, { proj: { kind: 'orb', count: 7, speed: 9.5 }, kact: 'sc_hrise' })], { minRange: 4, w: 1 }),
      ],
      phase2: [
        A('The Moon Goes Out', 30, [S('roar', 1.3, .7, .7, 0, { hyper: true })], { once: true }),
        A('Corona', 24, [S('cast', 1.1, .3, .9, 120, { reach: 0, wave: coronaWave(18, { ring: true, len: 18 }) })], { cd: 7, w: 1.1 }),
        A('Every Light Put Out', 20, [S('cast', 1, .3, .9, 90, { proj: { kind: 'orb', count: 24, speed: 7.5, ring: true } })], { cd: 8, w: 1 }),
        A('Harvest of the Moon', 4, [
          S('swing', .32, .14, .04, 130, { reach: 4, arc: 190, lunge: 1.2, kact: 'sc_reap' }),
          S('swing', .22, .14, .04, 130, { reach: 4, arc: 190, lunge: 1.2, kact: 'sc_return' }),
          S('swing', .26, .14, .04, 136, { reach: 4, arc: 190, lunge: 1.2, kact: 'sc_dance' }),
          S('spin', .4, .5, 1.3, 190, { reach: 4.2, arc: 360, burst: true, kact: 'sc_lthresh', wave: coronaWave(10, { ring: true, len: 12 }) }),
        ], { w: 1.2 }),
      ],
    },

    // ---- Revenants of the third act (Duels): five knights who reached the moon before you, and stayed.
    'revenant-lark': revenant('Dame Lark of the Long Chain, Revenant', 'chain', { dark: 0x141018, visor: 0xb07aff, glow: 0x8a5ad8, trail: 0xc8a0ff, steel: 0xc8ccd8, cloth: 0x2a3a5a, trim: 0xa8c8ff, blade: 0xeef4ff, wing: 0xc8e0ff }, 12500, [
      A('Long Chain', 4.2, [S('swing', .4, .12, .05, 84, { reach: 4.2, arc: 150, lunge: .6, kact: 'ch_llash' }), S('swing', .26, .12, .05, 84, { reach: 4.2, arc: 150, lunge: .6, kact: 'ch_lsnap' }), S('spin', .32, .4, .8, 96, { reach: 4.3, arc: 360, kact: 'ch_lwheel' })]),
      A('Vine Lash', 12, [S('swing', .6, .2, .9, 100, { reach: 4, arc: 150, kact: 'ch_lvine', wave: dustWave(4, { spread: .28 }) })], { minRange: 4, cd: 6, w: .9 }),
      A('Chain Dance', 3.8, [S('spin', .45, .6, .9, 104, { reach: 4, arc: 360, kact: 'ch_dance' })], { w: .8 }),
    ], { evasive: .45, parry: .3 }),
    'revenant-halloway': revenant('Brother Halloway, Revenant', 'staff', { dark: 0x141018, visor: 0x8ff0ff, glow: 0x6ae0f0, trail: 0xb8ffff, steel: 0x7aa8b8, cloth: 0x1a3a48, trim: 0x8ff0ff, blade: 0xd8ffff, wing: 0x9fe8f8 }, 13500, [
      A('Staff of the Hollows', 3.2, [S('thrust', .4, .14, .05, 84, { reach: 3.2, arc: 60, lunge: 1.2, kact: 'st_jab', chill: 10 }), S('swing', .28, .14, .05, 88, { reach: 3.1, arc: 170, lunge: 1, kact: 'st_butt', chill: 10 }), S('spin', .34, .4, .9, 100, { reach: 3.3, arc: 360, kact: 'st_mill', chill: 14 })]),
      A('Thunder of the Deep', 12, [S('leap', .6, .6, 1, 130, { reach: 0, aoe: 3, burst: true, hyper: true, shake: .8, kact: 'st_lthunder', frost: 2.4 })], { minRange: 4.5, cd: 7, w: .8 }),
      A('Crystal Vault', 8, [S('leap', .5, .5, .9, 110, { reach: 0, aoe: 2.4, kact: 'st_vault', wave: crystalWave(5, { ring: true, len: 8 }) })], { minRange: 4, cd: 6, w: .8 }),
    ], { roarHazard: 'frost', parry: .35 }),
    'revenant-mourne': revenant('Sir Mourne the Faithful, Revenant', 'aegis', { dark: 0x141018, visor: 0xd8c8ff, glow: 0xa890e0, trail: 0xd8c8ff, steel: 0x9a92a8, cloth: 0x2a2438, trim: 0xd8c8ff, blade: 0xe8e0ff, wing: 0xb8a8d8 }, 14500, [
      A('Faithful Cuts', 2.6, [S('swing', .4, .12, .05, 84, { reach: 2.6, lunge: .9, kact: 'ae_cut' }), S('backswing', .26, .12, .05, 84, { reach: 2.6, lunge: .9, kact: 'ae_back' }), S('thrust', .3, .16, .8, 96, { reach: 2.8, arc: 50, lunge: 2, kact: 'ae_stab' })]),
      A('Oathwall', 2.4, [S('thrust', .45, .14, .8, 90, { reach: 2.3, arc: 90, lunge: 2, poise: 60, kact: 'ae_upbash' })], { w: .8 }),
      A('Faith\'s Fall', 11, [S('leap', .6, .6, 1, 140, { reach: 0, aoe: 2.8, burst: true, hyper: true, shake: .8, kact: 'ae_leap', wave: graveWave(8, { ring: true, len: 9 }) })], { minRange: 4.5, cd: 7, w: .8 }),
    ], { shield: true, parry: .45, evasive: .2 }),
    'revenant-tamsin': revenant('Tamsin Nightfist, Revenant', 'tonfas', { dark: 0x0a0a10, visor: 0xb07aff, glow: 0x8a5ad8, trail: 0xc8a0ff, steel: 0x3a3450, cloth: 0x1a1430, trim: 0xb08aff, blade: 0xe0d0ff, wing: 0x6a5a9a }, 16000, [
      A('Night Barrage', 2.5, [S('thrust', .3, .1, .04, 76, { reach: 2.4, arc: 60, lunge: 1, kact: 'tf_jab' }), S('thrust', .18, .1, .04, 76, { reach: 2.4, arc: 60, lunge: 1, kact: 'tf_cross' }), S('overhead', .26, .16, .8, 100, { reach: 2.6, arc: 80, lunge: 1.2, kact: 'tf_hammer' })]),
      A('Night Rush', 8, [S('thrust', .5, .25, .8, 110, { reach: 2.6, arc: 80, lunge: 7, burst: true, kact: 'tf_rush' })], { minRange: 4, cd: 5, w: .9 }),
      A('Storm of Fists', 3, [S('spin', .45, .5, .9, 104, { reach: 2.9, arc: 360, kact: 'tf_hstorm', wave: voidWave(6, { ring: true, len: 8 }) })], { w: .8 }),
    ], { evasive: .6 }),
    'revenant-last': revenant('The Last Knight, Revenant', 'sword', { dark: 0x0a0a10, visor: 0xffd890, glow: 0xffb040, trail: 0xffd890, steel: 0xb4bccb, cloth: 0x3a2358, trim: 0xd6ac52, blade: 0xfff0c8, wing: 0xd8c8ff }, 18000, [
      A('Four-Cut Chain', 2.9, [S('swing', .34, .12, .04, 84, { reach: 2.9, arc: 160, lunge: 1.1, kact: 'light1' }), S('backswing', .2, .12, .04, 84, { reach: 2.9, arc: 160, lunge: 1.1, kact: 'light2' }), S('overhead', .24, .14, .05, 90, { reach: 2.9, arc: 80, lunge: 1.2, kact: 'light3' }), S('spin', .26, .3, .9, 100, { reach: 3.1, arc: 360, kact: 'light4' })], { w: 1.2 }),
      A('Needle Rush', 9, [S('thrust', .55, .25, .9, 130, { reach: 2.9, arc: 50, lunge: 7, burst: true, kact: 'needle' })], { minRange: 4, cd: 6, w: .9 }),
      A('Skyfall', 10, [S('leap', .5, .6, 1, 150, { reach: 0, aoe: 2.8, burst: true, hyper: true, shake: .8, kact: 'skyfall' })], { minRange: 4.5, cd: 7, w: .8 }),
      A('Flashcut', 12, [S('cast', .4, .08, .02, 0, { blink: true, behind: true, kact: 'dash' }), S('swing', .2, .12, .9, 120, { reach: 3, arc: 170, lunge: .6, kact: 'flashcut' })], { minRange: 3, cd: 8, w: .9 }),
    ], { parry: .5, evasive: .55 }),
  });
}
