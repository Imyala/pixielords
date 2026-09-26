// The second act's foes: the Drowned Abbey, the Emberforge, the Thornwood Court, the Starfall Crater and the
// Waning Court. Tinted kin of the goblins and ratmen with arts of their own, and fae knights gone over to the
// Waning Queen, who fight with the player's own weapons and strikes (kact: the knight's action to play).
// Added to enemies.js's TYPES by actTwo(); S, A and revenant are enemies.js's own helpers.
export function actTwo(TYPES, { S, A, revenant }) {
  // A tinted kinsman of an existing foe: its attacks, with something added to every blow.
  const kin = (base, tint, glowTint, o, add = {}) => {
    const B = TYPES[base];
    return { ...B, model: B.model || base, tint, glowTint, ...o,
      attacks: o.attacks || B.attacks.map(a => ({ ...a, steps: a.steps.map(st => st.proj || st.blink || !st.dmg ? st : { ...st, ...add, dmg: Math.round(st.dmg * (o.dmgK || 1)) }) })) };
  };
  const SEA = 0x7ab8a8, EMBER = 0xa87058, THORN = 0x8a5a78, STAR = 0x8a7ac8, PALE = 0xb8c0d8;
  const K = (steel, dark, cloth, trim, visor, blade, wing, glow, trail) => ({ steel, dark, cloth, trim, visor, blade, wing, glow, trail });
  const HOLLOW = K(0x6a8a84, 0x142024, 0x1e3a3a, 0x9ac8b8, 0x7fffe0, 0xcfeee6, 0x7fc8b8, 0x4ab8a0, 0x9fffe8);
  const IRON = K(0x4a4a52, 0x1a1414, 0x3a1a10, 0x8a5a3a, 0xff7a2a, 0xffb070, 0x6a4a3a, 0xff6a2a, 0xffa050);
  const THORNK = K(0x5a4a52, 0x1a1016, 0x3a1a2a, 0xc86a9a, 0xff6ab0, 0xf0c8d8, 0xc87aa8, 0xd04a8a, 0xff8ac0);
  const STARK = K(0x5a4a8a, 0x100c20, 0x2a1a4a, 0xb8a0ff, 0xe0d0ff, 0xd8c8ff, 0xa890ff, 0x9a7aff, 0xc8b0ff);
  const WANE = K(0xc8ccd8, 0x1a1c24, 0x3a3a5a, 0xe8e8ff, 0xe8f0ff, 0xf0f4ff, 0xd8e0ff, 0xc0c8ff, 0xf0f4ff);
  const fireWave = (n, o = {}) => ({ n, len: 12, speed: 12, chill: 0, color: 0xff7a3a, ...o });
  const tideWave = (n, o = {}) => ({ n, len: 12, speed: 11, chill: 16, color: 0x7fffe0, ...o });
  const starWave = (n, o = {}) => ({ n, len: 13, speed: 13, chill: 0, color: 0xc8a8ff, ...o });
  const moonWave = (n, o = {}) => ({ n, len: 14, speed: 14, chill: 8, color: 0xeef2ff, ...o });

  Object.assign(TYPES, {
    // ---- VI. The Drowned Abbey: brine-soaked ratmen, tide-callers, and the abbey's own drowned squires.
    'ratman-drowned': kin('ratman-skirmisher', SEA, 0x7fe8d0, { name: 'Drowned Ratman', glimmer: 520 }, { chill: 10 }),
    'ratman-brinebrute': kin('ratman-brute', SEA, 0x7fe8d0, { name: 'Brine Brute', glimmer: 900 }, { chill: 14 }),
    'goblin-tidecaller': {
      model: 'goblin-shaman', tint: SEA, glowTint: 0x7fe8d0, name: 'Goblin Tidecaller', scale: .92, radius: .4, hp: 170, ki: 90, poise: 12, walk: 1.5, run: 3.9, glimmer: 560, voice: 'growl', pitch: 1.3, style: 'ranged', prefer: [7, 12],
      attacks: [
        A('Tide Orbs', 15, [S('cast', .95, .15, .8, 34, { proj: { kind: 'orb', count: 3, speed: 7.5 } })], { minRange: 3 }),
        A('Undertow', 13, [S('cast', 1.1, .2, .9, 48, { reach: 0, wave: tideWave(1, { len: 13 }) })], { minRange: 4, cd: 7, w: .9 }),
        A('Mending Tide', 20, [S('cast', 1.2, .3, .6, 0, { heal: .2 })], { cd: 12, w: 2, cond: 'alliesHurt' }),
        A('Staff Swipe', 2.2, [S('swing', .5, .12, .6, 30, { reach: 2.2, lunge: .6, chill: 10 })], { w: .5 }),
      ],
    },
    'hollow-squire': {
      knight: HOLLOW, weapon: 'aegis', name: 'Hollow Squire', scale: 1, radius: .45, hp: 260, ki: 170, poise: 26, walk: 2, run: 5, glimmer: 700, voice: 'growl', pitch: 1.2, shield: true, track: 5, aggro: .8,
      attacks: [
        A('Squire\'s Cuts', 2.4, [S('swing', .42, .12, .08, 38, { reach: 2.4, lunge: .9, kact: 'light1' }), S('backswing', .26, .12, .6, 40, { reach: 2.4, lunge: .9, kact: 'light2' })]),
        A('Shield Bash', 2.2, [S('thrust', .45, .12, .7, 34, { reach: 2.1, arc: 80, lunge: 1.8, poise: 40, kact: 'ae_bash' })], { w: .8 }),
        A('Shield Charge', 7, [S('thrust', .55, .3, .9, 52, { reach: 2.2, arc: 90, lunge: 5.5, kact: 'ae_charge' })], { minRange: 3.5, cd: 6, w: .7 }),
      ],
    },
    'hollow-lancer': {
      knight: HOLLOW, weapon: 'glaive', name: 'Hollow Lancer', scale: 1, radius: .45, hp: 230, ki: 140, poise: 20, walk: 2, run: 5.2, glimmer: 680, voice: 'growl', pitch: 1.15, track: 5.5, aggro: .85, evasive: .3,
      attacks: [
        A('Lance Chain', 3.2, [S('thrust', .45, .14, .08, 40, { reach: 3.2, arc: 50, lunge: 1.2, kact: 'g_thrust' }), S('swing', .3, .14, .7, 44, { reach: 3.1, arc: 160, lunge: .8, kact: 'g_sweep' })]),
        A('Whirling Lance', 3.2, [S('spin', .5, .4, .8, 48, { reach: 3.2, arc: 360, kact: 'g_spin' })], { w: .7 }),
        A('Piercing Vault', 8, [S('leap', .55, .5, .9, 60, { reach: 0, aoe: 1.8, shake: .35, kact: 'g_vault' })], { minRange: 4, cd: 6, w: .7 }),
      ],
    },
    // The gatekeeper: Brother Tolland, who rang the abbey's bell until the sea came in, and rings it still.
    bellwarden: {
      knight: K(0x8a7a5a, 0x2a2018, 0x3a4a48, 0xd8b870, 0x7fffe0, 0xe8d8a0, 0x9ac8b8, 0x6ad8c0, 0xd8f8e8), weapon: 'hammer',
      name: 'Brother Tolland, the Bell-Warden', scale: 1.34, radius: .6, hp: 3800, ki: 400, poise: 70, walk: 2, run: 5.4, glimmer: 11000, voice: 'growl', pitch: .85,
      elite: true, track: 5, aggro: .9, evasive: .2, parry: .15, glow: .12, roarHazard: 'frost', phase2At: .5, phase2Line: 'The Bell-Warden rings the drowned hour',
      attacks: [
        A('Anvil Rhythm', 3.1, [S('swing', .5, .16, .08, 86, { reach: 3.1, arc: 190, lunge: .9, kact: 'h_side' }), S('swing', .36, .16, .08, 86, { reach: 3.1, arc: 190, lunge: .9, kact: 'h_back' }), S('overhead', .48, .16, 1, 112, { reach: 3, arc: 90, aoe: 2.2, kact: 'h_over' })]),
        A('Bell Toll', 14, [S('overhead', .8, .2, 1, 90, { reach: 2.8, arc: 90, aoe: 2.4, shake: .6, kact: 'h_over', wave: tideWave(10, { ring: true, len: 10 }) })], { cd: 7, w: .9 }),
        A('Great Turn', 3.3, [S('spin', .5, .5, .9, 94, { reach: 3.3, arc: 360, kact: 'h_spin' })], { w: .8 }),
        A('Haft Charge', 8, [S('thrust', .45, .35, .8, 80, { reach: 2.5, arc: 120, lunge: 6, kact: 'h_charge' })], { minRange: 4, cd: 5 }),
        A('Mountain Leap', 11, [S('leap', .7, .7, 1.1, 130, { reach: 0, aoe: 3.2, burst: true, hyper: true, shake: .9, kact: 'h_hleap', frost: 2.4 })], { minRange: 4.5, cd: 7, w: .8 }),
      ],
      phase2: [
        A('The Drowned Hour', 30, [S('roar', 1.1, .5, .5, 0, { hyper: true })], { once: true }),
        A('Triple Toll', 14, [
          S('overhead', .6, .16, .1, 80, { reach: 2.8, arc: 90, aoe: 2, kact: 'h_over', wave: tideWave(8, { ring: true, len: 9 }) }),
          S('overhead', .45, .16, .1, 80, { reach: 2.8, arc: 90, aoe: 2, kact: 'h_over', wave: tideWave(8, { ring: true, len: 11 }) }),
          S('overhead', .5, .16, 1.1, 96, { reach: 2.8, arc: 90, aoe: 2.4, burst: true, kact: 'h_hcrush', wave: tideWave(12, { ring: true, len: 13 }) }),
        ], { cd: 8, w: 1.1 }),
      ],
    },
    // The warlord: Abbess Morwen, who drowned her abbey to keep the Queen out, and let her in with the tide.
    abbess: {
      knight: K(0xc8d4d8, 0x1a2a30, 0x2a4a58, 0xe8f0f0, 0x7fffe0, 0x9fffe8, 0xa8e8ff, 0x6ae8d8, 0x9fffe8), weapon: 'staff',
      name: 'Abbess Morwen, the Drowned Saint', scale: 1.42, radius: .62, hp: 6200, ki: 460, poise: 75, walk: 2.2, run: 5.8, glimmer: 26000, voice: 'growl', pitch: 1.3,
      boss: true, track: 5.5, aggro: .9, evasive: .35, parry: .25, glow: .14, roarHazard: 'frost',
      attacks: [
        A('Rod of the Tide', 3.2, [S('thrust', .42, .14, .06, 70, { reach: 3.2, arc: 60, lunge: 1.2, kact: 'st_jab', chill: 10 }), S('swing', .3, .14, .06, 76, { reach: 3.1, arc: 170, lunge: 1, kact: 'st_butt', chill: 10 }), S('spin', .36, .4, .9, 90, { reach: 3.3, arc: 360, kact: 'st_sweep', chill: 14 })]),
        A('Tide Orbs', 18, [S('cast', .8, .15, .7, 52, { proj: { kind: 'orb', count: 5, speed: 7.5 } })], { minRange: 4, w: 1 }),
        A('Undertow', 16, [S('cast', 1, .2, .9, 84, { reach: 0, wave: tideWave(3, { len: 16, spread: .35 }) })], { minRange: 4, cd: 5, w: 1 }),
        A('Saint\'s Step', 12, [S('cast', .4, .08, .05, 0, { blink: true, behind: true, kact: 'dash' }), S('overhead', .3, .16, .9, 110, { reach: 3.2, arc: 90, aoe: 2, kact: 'st_hchop' })], { minRange: 3, cd: 7, w: .9 }),
        A('Drowning Bell', 20, [S('cast', 1.1, .3, .9, 70, { reach: 0, wave: tideWave(12, { ring: true, len: 14 }) })], { cd: 9, w: .8 }),
      ],
      phase2: [
        A('The Tide Rises', 30, [S('roar', 1.2, .6, .6, 0, { hyper: true })], { once: true }),
        A('Flood', 18, [S('cast', 1, .3, .8, 58, { proj: { kind: 'orb', count: 16, speed: 6, ring: true } })], { cd: 7, w: 1 }),
        A('Pillar of the Deep', 12, [S('leap', .6, .6, 1, 140, { reach: 0, aoe: 3.2, burst: true, hyper: true, shake: 1, kact: 'st_hpillar', frost: 3, wave: tideWave(6, { ring: true, len: 10 }) })], { minRange: 3, cd: 7, w: 1 }),
      ],
    },

    // ---- VII. The Emberforge: the goblins' war-forge in a fire mountain.
    'goblin-forgeguard': kin('goblin-skyguard', EMBER, 0xff9050, { name: 'Goblin Forgeguard', glimmer: 640, hp: 240, ki: 170 }),
    'goblin-hammerer': kin('goblin-berserker', EMBER, 0xff9050, { name: 'Goblin Hammerer', glimmer: 620 }),
    'ratman-slagbrute': kin('ratman-brute', EMBER, 0xff9050, { name: 'Slag Brute', glimmer: 980 }, { fire: 1.4 }),
    'goblin-smelter': {
      model: 'goblin-bomber', tint: EMBER, glowTint: 0xff9050, name: 'Goblin Smelter', scale: .86, radius: .38, hp: 140, ki: 70, poise: 10, walk: 1.6, run: 4, glimmer: 560, voice: 'growl', pitch: 1.4, style: 'ranged', prefer: [5, 12],
      attacks: [
        A('Slag Pot', 13, [S('throw', .9, .1, .8, 50, { proj: { kind: 'bomb', flight: 1.05, fire: 2 } })], { minRange: 3.5 }),
        A('Slag Volley', 15, [S('throw', 1.1, .15, .9, 44, { proj: { kind: 'bomb', flight: 1.1, count: 3, fire: 1.4 } })], { minRange: 5, cd: 7, w: .7 }),
        A('Headbutt', 1.9, [S('thrust', .5, .12, .6, 28, { reach: 1.8, arc: 70, lunge: 1 })]),
      ],
    },
    'iron-sentinel': {
      knight: IRON, weapon: 'great', name: 'Iron Sentinel', scale: 1.12, radius: .55, hp: 520, ki: 260, poise: 60, walk: 1.6, run: 3.8, glimmer: 1300, voice: 'growl', pitch: .7, elite: true, track: 3.5, aggro: .8,
      attacks: [
        A('Iron Tide', 3.3, [S('swing', .6, .16, .1, 70, { reach: 3.3, arc: 190, lunge: .8, kact: 'wb_sweep' }), S('swing', .45, .16, .9, 70, { reach: 3.3, arc: 190, lunge: .8, kact: 'wb_return' })]),
        A('Falling Edge', 3.2, [S('overhead', .75, .16, 1, 96, { reach: 3.2, arc: 80, lunge: 1, aoe: 1.6, kact: 'wb_hfall' })], { w: .8 }),
        A('Furnace Vent', 12, [S('overhead', .9, .2, 1.1, 70, { reach: 2.6, arc: 80, aoe: 1.6, kact: 'wb_fall', wave: fireWave(3, { spread: .4 }) })], { minRange: 3.5, cd: 7, w: .7 }),
      ],
    },
    // The gatekeeper: Forgemaster Ghurk, whose hammer made the chains of winter.
    forgemaster: {
      model: 'goblin-clubber', tint: 0xb07a60, glowTint: 0xff8a40, name: 'Forgemaster Ghurk', regalia: 'horns', scale: 1.62, radius: 1.05, hp: 4400, ki: 440, poise: 80, walk: 1.6, run: 4.4, glimmer: 13000, voice: 'growl', pitch: .6,
      elite: true, track: 3.6, aggro: .9, roarHazard: 'fire', phase2At: .5, phase2Line: 'Ghurk stokes the forge white-hot',
      attacks: [
        A('Molten Smash', 3.6, [S('overhead', .75, .18, 1, 118, { reach: 3.6, arc: 70, lunge: 1.2, aoe: 2, shake: .6, fire: 2 })]),
        A('Anvil Sweep', 3.8, [S('spin', .7, .45, 1, 104, { reach: 3.8, arc: 360 })], { w: .8 }),
        A('Bellows', 16, [S('throw', .9, .15, .9, 70, { proj: { kind: 'bomb', flight: 1.1, count: 3, fire: 1.8 } })], { minRange: 5, cd: 6, w: .9 }),
        A('Forge Leap', 13, [S('leap', .8, .8, 1.2, 140, { reach: 0, aoe: 3.6, burst: true, hyper: true, shake: 1, fire: 2.6 })], { minRange: 5, cd: 8, w: .8 }),
        A('Slag Line', 14, [S('overhead', .9, .2, 1, 90, { reach: 3, arc: 70, aoe: 1.8, wave: fireWave(3, { spread: .3, len: 14 }) })], { minRange: 4, cd: 7, w: .8 }),
      ],
      phase2: [
        A('Stoke the Fires', 30, [S('roar', 1.2, .6, .6, 0, { hyper: true })], { once: true }),
        A('Slag Rain', 18, [S('throw', 1, .2, .9, 60, { proj: { kind: 'bomb', flight: 1.2, count: 8, ring: true, fire: 1.6 } })], { cd: 8, w: 1.1 }),
        A('White-Hot Chain', 3.6, [S('swing', .5, .14, .08, 90, { reach: 3.6, arc: 150, lunge: 1 }), S('backswing', .36, .14, .08, 90, { reach: 3.6, arc: 150, lunge: 1 }), S('overhead', .6, .18, 1.2, 130, { reach: 3.5, arc: 70, aoe: 2.4, burst: true, shake: .8, fire: 2.4, wave: fireWave(6, { ring: true, len: 10 }) })], { w: 1 }),
      ],
    },
    // The warlord: the Iron Tyrant, a fae knight the forge swallowed and gave back as iron.
    tyrant: {
      knight: K(0x2e2a2c, 0x100c0c, 0x5a1a0a, 0xd07a2a, 0xff5a1a, 0xffc070, 0xff8a40, 0xff5a1a, 0xffa040), weapon: 'great',
      name: 'The Iron Tyrant', scale: 1.6, radius: .72, hp: 7400, ki: 520, poise: 90, walk: 2, run: 5.4, glimmer: 32000, voice: 'growl', pitch: .6,
      boss: true, track: 4.5, aggro: .92, evasive: .15, parry: .1, glow: .14, roarHazard: 'fire',
      attacks: [
        A('Tyrant\'s Tide', 3.6, [S('swing', .55, .16, .08, 96, { reach: 3.6, arc: 190, lunge: 1, kact: 'wb_sweep' }), S('swing', .4, .16, .08, 96, { reach: 3.6, arc: 190, lunge: 1, kact: 'wb_return' }), S('spin', .45, .4, .9, 110, { reach: 3.7, arc: 360, kact: 'wb_turn' })]),
        A('Sundering Fall', 3.5, [S('overhead', .7, .16, 1, 140, { reach: 3.5, arc: 80, lunge: 1.2, aoe: 2.2, fire: 2, kact: 'wb_hfall' })], { w: .8 }),
        A('Iron Rush', 9, [S('thrust', .6, .3, .9, 110, { reach: 3.4, arc: 50, lunge: 7, burst: true, kact: 'wb_rush' })], { minRange: 4, cd: 6, w: .8 }),
        A('Crown of Cinders', 16, [S('overhead', .9, .2, 1, 100, { reach: 3, arc: 80, aoe: 2.2, kact: 'wb_fall', wave: fireWave(10, { ring: true, len: 12 }) })], { cd: 8, w: .9 }),
        A('Split the Mountain', 12, [S('leap', .7, .7, 1.1, 160, { reach: 0, aoe: 3.6, burst: true, hyper: true, shake: 1.1, fire: 3, kact: 'wb_hleap' })], { minRange: 5, cd: 8, w: .8 }),
      ],
      phase2: [
        A('The Forge Wakes', 30, [S('roar', 1.2, .6, .6, 0, { hyper: true })], { once: true }),
        A('Molten Tide', 3.7, [
          S('swing', .45, .14, .06, 94, { reach: 3.7, arc: 190, lunge: 1.1, kact: 'wb_sweep' }),
          S('swing', .32, .14, .06, 94, { reach: 3.7, arc: 190, lunge: 1.1, kact: 'wb_return' }),
          S('overhead', .5, .18, 1.2, 150, { reach: 3.5, arc: 80, aoe: 2.6, burst: true, shake: 1, fire: 3, kact: 'wb_hsplit', wave: fireWave(5, { spread: .3, len: 16 }) }),
        ], { w: 1.1 }),
      ],
    },

    // ---- VIII. The Thornwood Court: the Lantern Court's own garden palace, overgrown.
    'goblin-thornling': kin('goblin-scout', THORN, 0xff6aa0, { name: 'Goblin Thornling', glimmer: 600, hp: 150 }),
    'ratman-briarstalker': kin('ratman-shadowblade', THORN, 0xff6aa0, { name: 'Briar Stalker', glimmer: 760 }),
    'goblin-briarhexer': kin('goblin-shaman', THORN, 0xff6aa0, { name: 'Briar Hexer', glimmer: 700 }),
    'goblin-thornbow': kin('goblin-archer', THORN, 0xff6aa0, { name: 'Thornbow', glimmer: 620 }),
    'thorn-knight': {
      knight: THORNK, weapon: 'rapier', name: 'Thorn Knight', scale: 1, radius: .45, hp: 280, ki: 160, poise: 22, walk: 2.2, run: 5.6, glimmer: 820, voice: 'growl', pitch: 1.25, track: 6, aggro: .85, evasive: .45, parry: .3,
      attacks: [
        A('Lunge', 3.2, [S('thrust', .4, .14, .6, 44, { reach: 3.2, arc: 40, lunge: 1.8, kact: 'rp_lunge' })]),
        A('Feint and Cut', 3, [S('thrust', .28, .1, .05, 30, { reach: 3, arc: 40, lunge: .6, kact: 'rp_feint' }), S('swing', .22, .12, .6, 46, { reach: 2.7, arc: 150, lunge: .8, kact: 'rp_cut' })]),
        A('Flèche', 8, [S('thrust', .5, .3, .9, 60, { reach: 3.2, arc: 50, lunge: 7, burst: true, kact: 'rp_fleche' })], { minRange: 4, cd: 5, w: .8 }),
      ],
    },
    'thorn-reaver': {
      knight: THORNK, weapon: 'scythe', name: 'Thorn Reaver', scale: 1.06, radius: .5, hp: 360, ki: 180, poise: 30, walk: 2, run: 5.2, glimmer: 980, voice: 'growl', pitch: 1.05, elite: true, track: 5, aggro: .85,
      attacks: [
        A('Reaping Pair', 3.4, [S('swing', .5, .16, .08, 58, { reach: 3.4, arc: 200, lunge: .9, kact: 'sc_reap' }), S('swing', .34, .16, .7, 58, { reach: 3.4, arc: 200, lunge: .9, kact: 'sc_return' })]),
        A('Hooking Scythe', 3.6, [S('swing', .55, .16, .8, 64, { reach: 3.6, arc: 120, lunge: 1.6, kact: 'sc_hook' })], { w: .8 }),
        A('Harvest Spin', 3.4, [S('spin', .6, .5, .9, 70, { reach: 3.5, arc: 360, kact: 'sc_spin' })], { w: .7 }),
        A('Briar Hook', 3.4, [S('swing', .7, .2, 1, 80, { reach: 3.4, arc: 90, lunge: 1.4, burst: true, grab: { hold: 1.1 }, kact: 'sc_hook' })], { cd: 10, w: .5 }),
      ],
    },
    // The gatekeeper: Sir Caddoc, the Briar Warden, whose chain-blade keeps the court's gate.
    briarwarden: {
      knight: K(0x4a5a3a, 0x141a10, 0x2a3a1a, 0xa8c060, 0xc0ff6a, 0xd8f0a8, 0x8ac86a, 0x8ad04a, 0xc8ff8a), weapon: 'chain',
      name: 'Sir Caddoc, the Briar Warden', scale: 1.3, radius: .58, hp: 5000, ki: 420, poise: 65, walk: 2.2, run: 6, glimmer: 16000, voice: 'growl', pitch: .95,
      elite: true, track: 6, aggro: .92, evasive: .35, parry: .3, glow: .12, roarHazard: 'poison', phase2At: .5, phase2Line: 'The briars answer the Warden',
      attacks: [
        A('Lash and Crack', 5, [S('swing', .42, .14, .06, 70, { reach: 5, arc: 120, lunge: .6, kact: 'ch_lash' }), S('swing', .3, .14, .06, 70, { reach: 5, arc: 120, lunge: .6, kact: 'ch_back' }), S('thrust', .36, .14, .9, 84, { reach: 5.4, arc: 40, lunge: .8, kact: 'ch_crack' })]),
        A('Briar Wheel', 4.6, [S('spin', .55, .6, .9, 88, { reach: 4.6, arc: 360, kact: 'ch_wheel' })], { w: .8 }),
        A('Snapping Vine', 7, [S('thrust', .5, .2, .8, 80, { reach: 6.5, arc: 30, lunge: .5, kact: 'ch_snap', poison: 18 })], { minRange: 3.5, cd: 4, w: .9 }),
        A('Thorned Leap', 11, [S('leap', .65, .6, 1, 120, { reach: 0, aoe: 3, burst: true, hyper: true, shake: .8, kact: 'ch_leap', pool: 2.4 })], { minRange: 5, cd: 7, w: .8 }),
      ],
      phase2: [
        A('Briar Oath', 30, [S('roar', 1.1, .5, .5, 0, { hyper: true })], { once: true }),
        A('Thorn Storm', 5, [
          S('spin', .45, .5, .06, 80, { reach: 4.8, arc: 360, kact: 'ch_hstorm' }),
          S('spin', .3, .5, .06, 80, { reach: 4.8, arc: 360, kact: 'ch_hstorm' }),
          S('thrust', .4, .16, 1, 100, { reach: 5.6, arc: 40, lunge: 1, burst: true, kact: 'ch_crack', poison: 24 }),
        ], { w: 1.1 }),
      ],
    },
    // The warlord: Prince Hawthorn, the Queen's own son, crowned in thorns.
    hawthorn: {
      knight: K(0x6a2a3a, 0x1a0a10, 0x4a0a1a, 0xf0a0c0, 0xff3a7a, 0xffd8e8, 0xff8ab8, 0xff4a8a, 0xff9ac8), weapon: 'scythe',
      name: 'Prince Hawthorn, the Thorned Heir', scale: 1.4, radius: .62, hp: 8600, ki: 520, poise: 80, walk: 2.4, run: 6.4, glimmer: 40000, voice: 'growl', pitch: 1.1,
      boss: true, track: 6.5, aggro: .95, evasive: .45, parry: .3, glow: .14, roarHazard: 'poison',
      attacks: [
        A('Crowning Reap', 3.6, [S('swing', .45, .16, .06, 100, { reach: 3.6, arc: 200, lunge: 1.1, kact: 'sc_reap' }), S('swing', .3, .16, .06, 100, { reach: 3.6, arc: 200, lunge: 1.1, kact: 'sc_return' }), S('spin', .38, .45, .9, 116, { reach: 3.7, arc: 360, kact: 'sc_spin' })]),
        A('Heir\'s Cross', 3.6, [S('swing', .55, .16, .9, 130, { reach: 3.6, arc: 120, lunge: 1.4, kact: 'sc_hcross' })], { w: .8 }),
        A('Thorn Moon', 16, [S('swing', .7, .2, .9, 90, { reach: 3.2, arc: 150, kact: 'sc_hmoon', wave: { n: 3, len: 15, speed: 14, spread: .3, chill: 0, color: 0xff6aa0 } })], { minRange: 4, cd: 6, w: .9 }),
        A('Blooming Step', 12, [S('cast', .35, .08, .05, 0, { blink: true, behind: true, kact: 'dash' }), S('swing', .25, .14, .9, 120, { reach: 3.4, arc: 170, lunge: .6, kact: 'sc_hrise' })], { minRange: 3, cd: 7, w: .9 }),
        A('Falling Thorn', 12, [S('leap', .6, .6, 1, 150, { reach: 0, aoe: 3.2, burst: true, hyper: true, shake: .9, kact: 'sc_hleap', pool: 3 })], { minRange: 5, cd: 8, w: .8 }),
      ],
      phase2: [
        A('Crown of Thorns', 30, [S('roar', 1.2, .6, .6, 0, { hyper: true })], { once: true }),
        A('Thornfield', 20, [S('cast', 1, .3, .9, 80, { reach: 0, wave: { n: 12, ring: true, len: 13, speed: 12, chill: 0, color: 0xff6aa0 } })], { cd: 8, w: 1 }),
        A('Harvest of the Heir', 3.7, [
          S('swing', .35, .14, .05, 96, { reach: 3.7, arc: 200, lunge: 1.2, kact: 'sc_reap' }),
          S('swing', .24, .14, .05, 96, { reach: 3.7, arc: 200, lunge: 1.2, kact: 'sc_return' }),
          S('swing', .3, .14, .05, 100, { reach: 3.7, arc: 200, lunge: 1.2, kact: 'sc_dance' }),
          S('spin', .4, .5, 1.1, 130, { reach: 3.9, arc: 360, burst: true, kact: 'sc_lthresh' }),
        ], { w: 1.1 }),
      ],
    },

    // ---- IX. The Starfall Crater: where a shard of the moon fell, and what feeds on its light.
    'ratman-starbitten': kin('ratman-skirmisher', STAR, 0xb8a0ff, { name: 'Starbitten Ratman', glimmer: 700, hp: 150 }),
    'ratman-shardseer': kin('ratman-glowseer', STAR, 0xb8a0ff, { name: 'Shardseer', glimmer: 820 }),
    'ratman-crystalbrute': {
      ...TYPES['ratman-brute'], model: TYPES['ratman-brute'].model || 'ratman-brute', tint: STAR, glowTint: 0xb8a0ff, name: 'Crystal Brute', glimmer: 1200, hp: 460,
      attacks: [
        A('Crystal Maul', 2.6, [S('swing', .6, .16, .1, 58, { reach: 2.6, arc: 140, lunge: 1 }), S('overhead', .55, .16, .9, 72, { reach: 2.5, arc: 70, lunge: 1, aoe: 1.4, shake: .4 })]),
        A('Shard Line', 12, [S('overhead', .85, .18, 1, 66, { reach: 2.4, arc: 70, aoe: 1.4, wave: starWave(3, { spread: .4, len: 11 }) })], { minRange: 3, cd: 6, w: .8 }),
        A('Crushing Grip', 2.6, [S('thrust', .8, .22, 1, 96, { reach: 2.3, arc: 70, lunge: 2.2, burst: true, grab: { hold: 1.2 } })], { cd: 9, w: .6 }),
      ],
    },
    'goblin-starcaller': {
      model: 'goblin-shaman', tint: STAR, glowTint: 0xb8a0ff, name: 'Goblin Starcaller', scale: .92, radius: .4, hp: 180, ki: 90, poise: 12, walk: 1.5, run: 3.9, glimmer: 720, voice: 'growl', pitch: 1.35, style: 'ranged', prefer: [7, 12],
      attacks: [
        A('Falling Stars', 16, [S('cast', 1, .15, .8, 40, { proj: { kind: 'orb', count: 4, speed: 8 } })], { minRange: 3 }),
        A('Star Ring', 12, [S('cast', 1.1, .2, .9, 36, { proj: { kind: 'orb', count: 10, speed: 6, ring: true } })], { cd: 7, w: .8 }),
        A('Staff Swipe', 2.2, [S('swing', .5, .12, .6, 32, { reach: 2.2, lunge: .6 })], { w: .5 }),
      ],
    },
    'star-shade': {
      knight: STARK, weapon: 'daggers', name: 'Star-Shade', scale: .98, radius: .42, hp: 260, ki: 130, poise: 18, walk: 2.4, run: 6.2, glimmer: 880, voice: 'squeal', pitch: 1.4, track: 7, aggro: .9, evasive: .6,
      attacks: [
        A('Starlit Flurry', 2.4, [S('swing', .3, .1, .04, 30, { reach: 2.3, lunge: .8, kact: 'dg_slash' }), S('swing', .18, .1, .04, 30, { reach: 2.3, lunge: .8, kact: 'dg_rev' }), S('thrust', .2, .12, .6, 38, { reach: 2.4, arc: 60, lunge: 1, kact: 'dg_stab' })]),
        A('Shade Step', 12, [S('cast', .35, .08, .05, 0, { blink: true, behind: true, kact: 'dash' }), S('swing', .25, .12, .7, 52, { reach: 2.5, arc: 140, lunge: .8, kact: 'dg_hcross' })], { minRange: 3, cd: 6, w: 1 }),
        A('Dart Fan', 14, [S('throw', .5, .1, .6, 26, { proj: { kind: 'knife', speed: 19, count: 3 }, kact: 'dg_dart' })], { minRange: 4, cd: 5, w: .7 }),
      ],
    },
    // The gatekeeper: the Shardling, a brute grown through with moon-glass.
    shardling: {
      model: 'ratman-brute', tint: 0x9a88e0, glowTint: 0xc8b0ff, name: 'The Shardling', regalia: 'icecrown', scale: 1.95, radius: 1.15, hp: 5600, ki: 480, poise: 90, walk: 1.6, run: 4.6, glimmer: 19000, voice: 'growl', pitch: .45,
      elite: true, track: 3.4, aggro: .9, roarHazard: 'none', phase2At: .5, phase2Line: 'The Shardling splits open with light',
      attacks: [
        A('Glass Maul', 3.6, [S('swing', .7, .16, .1, 110, { reach: 3.6, arc: 150, lunge: 1.2 }), S('overhead', .6, .18, 1, 130, { reach: 3.5, arc: 70, lunge: 1.2, aoe: 2.2, shake: .6 })]),
        A('Shard Lines', 16, [S('overhead', .9, .2, 1, 100, { reach: 3, arc: 70, aoe: 2, wave: starWave(5, { spread: .28, len: 16 }) })], { minRange: 3.5, cd: 6, w: 1 }),
        A('Moonglass Burst', 18, [S('cast', 1, .3, .9, 70, { proj: { kind: 'shard', count: 14, speed: 9, ring: true } })], { cd: 8, w: .8 }),
        A('Crater Leap', 14, [S('leap', .8, .8, 1.2, 160, { reach: 0, aoe: 4, burst: true, hyper: true, shake: 1.2, wave: starWave(8, { ring: true, len: 10 }) })], { minRange: 5, cd: 8, w: .8 }),
      ],
      phase2: [
        A('Splitting Light', 30, [S('roar', 1.2, .6, .6, 0, { hyper: true })], { once: true }),
        A('Glass Storm', 3.8, [S('spin', .6, .6, .1, 110, { reach: 3.8, arc: 360 }), S('overhead', .5, .18, 1.2, 150, { reach: 3.6, arc: 70, aoe: 2.6, burst: true, shake: .8, wave: starWave(12, { ring: true, len: 12 }) })], { w: 1.1 }),
      ],
    },
    // The warlord: Gorgathul, the Star-Eater, a rat grown vast on the fallen moon.
    stareater: {
      model: 'ratman-warblade', tint: 0x8a70d0, glowTint: 0xd0b8ff, name: 'Gorgathul, the Star-Eater', regalia: 'horns', scale: 2.15, radius: 1.2, hp: 10500, ki: 600, poise: 95, walk: 2, run: 5.4, glimmer: 50000, voice: 'squeal', pitch: .35,
      boss: true, track: 4, aggro: .92, roarHazard: 'none',
      attacks: [
        A('Devouring Chain', 4.2, [S('swing', .6, .16, .08, 120, { reach: 4.2, arc: 150, lunge: 1.4 }), S('backswing', .42, .16, .08, 120, { reach: 4.2, arc: 150, lunge: 1.4 }), S('overhead', .55, .2, 1.1, 160, { reach: 4, arc: 70, lunge: 1.5, aoe: 2.6, shake: .8 })]),
        A('Star Spit', 20, [S('cast', .8, .15, .8, 70, { proj: { kind: 'orb', count: 7, speed: 8.5 } })], { minRange: 5, w: 1 }),
        A('Moonfall', 16, [S('overhead', .95, .2, 1, 120, { reach: 3.4, arc: 70, aoe: 2.4, wave: starWave(7, { spread: .22, len: 18 }) })], { minRange: 4, cd: 6, w: 1 }),
        A('Crater Maker', 16, [S('leap', .85, .9, 1.3, 190, { reach: 0, aoe: 4.6, burst: true, hyper: true, shake: 1.3, wave: starWave(10, { ring: true, len: 12 }) })], { minRange: 5, cd: 9, w: .8 }),
        A('Gnash', 4, [S('thrust', .5, .2, .9, 130, { reach: 4, arc: 60, lunge: 5, burst: true })], { w: .7 }),
      ],
      phase2: [
        A('Swallow the Stars', 30, [S('roar', 1.3, .7, .7, 0, { hyper: true })], { once: true }),
        A('Starburst', 22, [S('cast', 1.1, .3, .9, 90, { reach: 0, wave: starWave(16, { ring: true, len: 16 }) })], { cd: 7, w: 1.1 }),
        A('Nova', 20, [S('cast', 1, .3, .9, 70, { proj: { kind: 'orb', count: 20, speed: 6.5, ring: true } })], { cd: 8, w: 1 }),
      ],
    },

    // ---- X. The Waning Court: the Queen's palace, hung where the moon once rose.
    'waning-knight': {
      knight: WANE, weapon: 'katana', name: 'Knight of the Waning', scale: 1.02, radius: .45, hp: 360, ki: 180, poise: 26, walk: 2.3, run: 6, glimmer: 1100, voice: 'growl', pitch: 1.2, track: 6.5, aggro: .9, evasive: .45, parry: .35,
      attacks: [
        A('Draw-cut', 2.9, [S('swing', .42, .12, .7, 58, { reach: 2.9, arc: 170, lunge: 1.2, kact: 'kt_rdraw' })]),
        A('Still Water', 2.8, [S('swing', .38, .14, .06, 48, { reach: 2.8, arc: 160, lunge: 1, kact: 'kt_cut' }), S('swing', .24, .14, .06, 48, { reach: 2.8, arc: 160, lunge: 1, kact: 'kt_back' }), S('thrust', .3, .18, .8, 58, { reach: 3, arc: 50, lunge: 2, kact: 'kt_thrust' })]),
        A('Waning Crescent', 14, [S('swing', .6, .14, .8, 52, { reach: 2.8, arc: 150, kact: 'kt_hfrost', wave: moonWave(1) })], { minRange: 3.5, cd: 6, w: .7 }),
      ],
    },
    'waning-lancer': {
      knight: WANE, weapon: 'glaive', name: 'Lancer of the Waning', scale: 1.04, radius: .46, hp: 380, ki: 190, poise: 28, walk: 2.2, run: 5.8, glimmer: 1150, voice: 'growl', pitch: 1.1, track: 6, aggro: .88, evasive: .35,
      attacks: [
        A('Moon Lance', 3.3, [S('thrust', .42, .14, .06, 52, { reach: 3.3, arc: 50, lunge: 1.2, kact: 'g_thrust' }), S('swing', .3, .14, .7, 56, { reach: 3.2, arc: 160, lunge: .8, kact: 'g_sweep' })]),
        A('Crescent Sweep', 3.3, [S('spin', .5, .45, .8, 60, { reach: 3.3, arc: 360, kact: 'g_crescent' })], { w: .7 }),
        A('Moonfall Vault', 9, [S('leap', .55, .5, .9, 74, { reach: 0, aoe: 2, shake: .4, kact: 'g_moonfall', wave: moonWave(4, { ring: true, len: 8 }) })], { minRange: 4, cd: 7, w: .7 }),
      ],
    },
    'goblin-moonbow': kin('goblin-archer', PALE, 0xe0e8ff, { name: 'Moonbow', glimmer: 760 }),
    'ratman-waneling': kin('ratman-assassin', PALE, 0xe0e8ff, { name: 'Waneling', glimmer: 800 }),
    // The gatekeeper: Maelis, the knight who went ahead of you. The Queen found her in the ice and woke her,
    // and she fights for the Queen now. She always drops her guard after the fourth cut of a chain.
    maelis: {
      knight: K(0xb4bccb, 0x1a1420, 0x3a2358, 0xd6ac52, 0xff9cf0, 0xeef4ff, 0xd8c8ff, 0xc8a0ff, 0xe0d0ff), weapon: 'sword',
      name: 'Maelis, the Lost Knight', scale: 1.08, radius: .5, hp: 6400, ki: 440, poise: 60, walk: 2.4, run: 6.6, glimmer: 26000, voice: 'growl', pitch: 1.4,
      elite: true, track: 7.5, aggro: .95, evasive: .55, parry: .45, glow: .12, roarHazard: 'none', phase2At: .5, phase2Line: 'Maelis remembers the Queen\'s voice, and not her own',
      attacks: [
        A('Four-Cut Chain', 2.9, [
          S('swing', .38, .12, .05, 70, { reach: 2.9, arc: 160, lunge: 1.1, kact: 'light1' }),
          S('backswing', .22, .12, .05, 70, { reach: 2.9, arc: 160, lunge: 1.1, kact: 'light2' }),
          S('overhead', .26, .14, .06, 76, { reach: 2.9, arc: 80, lunge: 1.2, kact: 'light3' }),
          S('spin', .28, .3, 1.5, 84, { reach: 3.1, arc: 360, kact: 'light4' }),   // and then her guard drops, as she said
        ], { w: 1.2 }),
        A('Needle Rush', 9, [S('thrust', .6, .25, .9, 110, { reach: 2.9, arc: 50, lunge: 7, burst: true, kact: 'needle' })], { minRange: 4, cd: 6, w: .9 }),
        A('Skyfall', 10, [S('leap', .55, .62, 1, 124, { reach: 0, aoe: 2.6, burst: true, hyper: true, shake: .8, kact: 'skyfall' })], { minRange: 4.5, cd: 7, w: .8 }),
        A('Lantern Flashcut', 12, [S('cast', .45, .08, .02, 0, { blink: true, behind: true, kact: 'dash' }), S('swing', .2, .12, .9, 100, { reach: 3, arc: 170, lunge: .6, kact: 'flashcut' })], { minRange: 3, cd: 8, w: .9 }),
        A('Moonlit Crescent', 16, [S('swing', .6, .14, .8, 76, { reach: 2.6, arc: 150, kact: 's_hcleave', wave: moonWave(1, { len: 15 }) })], { minRange: 3.5, cd: 6, w: .7 }),
      ],
      phase2: [
        A('The Queen\'s Voice', 30, [S('roar', 1.1, .5, .5, 0, { hyper: true })], { once: true }),
        A('Five-Cut Chain', 3, [
          S('swing', .3, .12, .04, 70, { reach: 3, arc: 160, lunge: 1.1, kact: 'light1' }),
          S('backswing', .2, .12, .04, 70, { reach: 3, arc: 160, lunge: 1.1, kact: 'light2' }),
          S('overhead', .22, .14, .05, 76, { reach: 3, arc: 80, lunge: 1.2, kact: 'light3' }),
          S('spin', .24, .3, .05, 84, { reach: 3.2, arc: 360, kact: 'light4' }),
          S('thrust', .4, .2, 1.4, 116, { reach: 3.2, arc: 50, lunge: 4, burst: true, kact: 'needle', wave: moonWave(3, { spread: .3, len: 12 }) }),
        ], { w: 1.2 }),
      ],
    },
    // The warlord: the Waning Queen, who would have the moon wane for ever, and the fae with it.
    queen: {
      knight: K(0xe8ecf8, 0x0c0c18, 0x1a1a3a, 0xf0f0ff, 0xffffff, 0xffffff, 0xe8f0ff, 0xd0d8ff, 0xffffff), weapon: 'ring',
      name: 'The Waning Queen', scale: 1.62, radius: .7, hp: 14000, ki: 700, poise: 95, walk: 2.4, run: 6.6, glimmer: 90000, voice: 'growl', pitch: 1.5,
      boss: true, track: 7, aggro: .95, evasive: .5, parry: .35, glow: .16, roarHazard: 'frost', phase2At: .5,
      attacks: [
        A('Crescent Dance', 3.4, [S('swing', .42, .14, .05, 110, { reach: 3.4, arc: 170, lunge: 1.1, kact: 'rg_arc' }), S('swing', .28, .14, .05, 110, { reach: 3.4, arc: 170, lunge: 1.1, kact: 'rg_back' }), S('spin', .34, .45, .9, 130, { reach: 3.6, arc: 360, kact: 'rg_orbit' })]),
        A('Moon Thrown', 18, [S('throw', .6, .15, .8, 90, { proj: { kind: 'orb', count: 5, speed: 9 }, kact: 'rg_dart' })], { minRange: 4, w: 1 }),
        A('Waning Tide', 18, [S('swing', .8, .2, 1, 110, { reach: 3.2, arc: 150, kact: 'rg_hmoon', wave: moonWave(5, { spread: .26, len: 18 }) })], { minRange: 4, cd: 6, w: 1 }),
        A('Queen\'s Step', 12, [S('cast', .35, .08, .05, 0, { blink: true, behind: true, kact: 'dash' }), S('overhead', .26, .16, .9, 150, { reach: 3.4, arc: 100, aoe: 2.2, kact: 'rg_hfall' })], { minRange: 3, cd: 6, w: 1 }),
        A('Moonset', 14, [S('leap', .7, .7, 1.1, 180, { reach: 0, aoe: 3.8, burst: true, hyper: true, shake: 1.1, kact: 'rg_hleap', wave: moonWave(10, { ring: true, len: 12 }) })], { minRange: 5, cd: 8, w: .9 }),
      ],
      phase2: [
        A('The Moon Goes Dark', 30, [S('roar', 1.3, .7, .7, 0, { hyper: true })], { once: true }),
        A('Dark of the Moon', 24, [S('cast', 1.1, .3, .9, 100, { reach: 0, wave: moonWave(18, { ring: true, len: 18 }) })], { cd: 7, w: 1.1 }),
        A('Falling Moons', 20, [S('cast', 1, .3, .9, 80, { proj: { kind: 'orb', count: 22, speed: 7, ring: true } })], { cd: 8, w: 1 }),
        A('Last Quarter', 3.6, [
          S('swing', .32, .14, .04, 110, { reach: 3.6, arc: 170, lunge: 1.2, kact: 'rg_arc' }),
          S('swing', .22, .14, .04, 110, { reach: 3.6, arc: 170, lunge: 1.2, kact: 'rg_back' }),
          S('swing', .26, .14, .04, 116, { reach: 3.6, arc: 170, lunge: 1.2, kact: 'rg_triple' }),
          S('spin', .4, .5, 1.2, 160, { reach: 3.8, arc: 360, burst: true, kact: 'rg_lstorm', wave: moonWave(8, { ring: true, len: 10 }) }),
        ], { w: 1.2 }),
      ],
    },

    // ---- Revenants of the second act (Duels): five more knights who fell on the far isles.
    'revenant-graves': revenant('Sir Wendel Graves, Revenant', 'daggers', { dark: 0x141018, visor: 0xb07aff, glow: 0x8a5ad8, trail: 0xc8a0ff, steel: 0x6a6a7a, cloth: 0x2a2a3a, trim: 0x9ac8b8, blade: 0xe8f4ff, wing: 0x9fd8c8 }, 6000, [
      A('Thousand Cuts', 2.4, [S('swing', .3, .1, .04, 60, { reach: 2.3, lunge: .8, kact: 'dg_slash' }), S('swing', .18, .1, .04, 60, { reach: 2.3, lunge: .8, kact: 'dg_rev' }), S('spin', .22, .35, .7, 70, { reach: 2.5, arc: 360, kact: 'dg_spin' })]),
      A('Grave Step', 12, [S('cast', .35, .08, .05, 0, { blink: true, behind: true, kact: 'dash' }), S('swing', .25, .12, .8, 96, { reach: 2.5, arc: 150, lunge: .8, kact: 'dg_hcross' })], { minRange: 3, cd: 6, w: 1 }),
      A('Dart Rain', 14, [S('throw', .5, .1, .6, 44, { proj: { kind: 'knife', speed: 20, count: 5 }, kact: 'dg_dart' })], { minRange: 4, cd: 5, w: .8 }),
    ], { evasive: .65, parry: .3 }),
    'revenant-ashkettle': revenant('Dame Ashkettle, Revenant', 'hatchets', { dark: 0x141018, visor: 0xff8a40, glow: 0xff6a2a, trail: 0xffa050, steel: 0x9a6a48, cloth: 0x5a2a1a, trim: 0xe08a40, blade: 0xffcf8a, wing: 0xffb070 }, 7200, [
      A('Twin Hatchets', 2.6, [S('swing', .34, .12, .05, 70, { reach: 2.5, arc: 150, lunge: .9, kact: 'ht_twin' }), S('swing', .22, .12, .05, 70, { reach: 2.5, arc: 150, lunge: .9, kact: 'ht_hook' }), S('spin', .28, .4, .8, 84, { reach: 2.7, arc: 360, kact: 'ht_wheel' })]),
      A('Kindling', 12, [S('throw', .55, .15, .7, 70, { proj: { kind: 'bomb', flight: 1, count: 2, fire: 1.8 }, kact: 'ht_kindling' })], { minRange: 4, cd: 6, w: .9 }),
      A('Timber!', 10, [S('leap', .6, .6, 1, 120, { reach: 0, aoe: 3, burst: true, hyper: true, shake: .8, fire: 2.2, kact: 'ht_hleap' })], { minRange: 4.5, cd: 7, w: .8 }),
    ], { roarHazard: 'fire', parry: .2 }),
    'revenant-rook': revenant('Brother Rook, Revenant', 'claws', { dark: 0x141018, visor: 0xff3a5a, glow: 0xc83a5a, trail: 0xff8aa0, steel: 0x3a3a44, cloth: 0x1a1a24, trim: 0x8a8aa0, blade: 0xffd0d8, wing: 0x9a7a8a }, 8200, [
      A('Rending Frenzy', 2.4, [S('swing', .3, .1, .04, 64, { reach: 2.3, lunge: .9, kact: 'cl_spin' }), S('swing', .2, .1, .04, 64, { reach: 2.3, lunge: .9, kact: 'cl_frenzy' }), S('swing', .22, .12, .7, 76, { reach: 2.4, lunge: 1, kact: 'cl_hrend' })]),
      A('Pounce', 8, [S('thrust', .5, .2, .8, 96, { reach: 2.4, arc: 90, lunge: 6, burst: true, kact: 'cl_pounce' })], { minRange: 3.5, cd: 5, w: .9 }),
      A('Whirling Talons', 3, [S('spin', .45, .5, .9, 90, { reach: 2.9, arc: 360, kact: 'cl_hspin' })], { w: .8 }),
    ], { evasive: .6 }),
    'revenant-cinderwing': revenant('Sister Cinderwing, Revenant', 'fans', { dark: 0x141018, visor: 0xffd36a, glow: 0xffb040, trail: 0xffe0a0, steel: 0xd8c8a8, cloth: 0x6a2a4a, trim: 0xf0d080, blade: 0xfff0d0, wing: 0xffc8e0 }, 9400, [
      A('Fan Dance', 2.8, [S('swing', .34, .12, .05, 70, { reach: 2.7, arc: 170, lunge: .9, kact: 'fn_twirl' }), S('swing', .22, .12, .05, 70, { reach: 2.7, arc: 170, lunge: .9, kact: 'fn_dance' }), S('spin', .3, .4, .8, 84, { reach: 2.9, arc: 360, kact: 'fn_flutter' })]),
      A('Fan Storm', 16, [S('throw', .55, .15, .7, 60, { proj: { kind: 'knife', speed: 18, count: 7 }, kact: 'fn_hstorm' })], { minRange: 4, cd: 5, w: 1 }),
      A('Wing Leap', 10, [S('leap', .55, .55, .9, 110, { reach: 0, aoe: 2.6, burst: true, hyper: true, shake: .7, kact: 'fn_leap' })], { minRange: 4.5, cd: 7, w: .8 }),
    ], { evasive: .65, parry: .35 }),
    'revenant-oathbound': revenant('The Oathbound, Revenant', 'hexblade', { dark: 0x0a0a10, visor: 0xc8a0ff, glow: 0x9a6aff, trail: 0xd0b8ff, steel: 0x2a2440, cloth: 0x14102a, trim: 0xb8a0ff, blade: 0xe0d0ff, wing: 0xb89aff }, 11000, [
      A('Oath Cuts', 2.8, [S('swing', .36, .12, .05, 80, { reach: 2.8, arc: 160, lunge: 1, kact: 'hx_cut1' }), S('swing', .24, .12, .05, 80, { reach: 2.8, arc: 160, lunge: 1, kact: 'hx_cut2' }), S('thrust', .3, .16, .8, 96, { reach: 3, arc: 50, lunge: 2, kact: 'hx_stab' })]),
      A('Hex Palm', 12, [S('cast', .7, .15, .8, 70, { proj: { kind: 'orb', count: 3, speed: 8 }, kact: 'hx_palm' })], { minRange: 4, cd: 5, w: .9 }),
      A('Oath Storm', 14, [S('swing', .7, .2, .9, 90, { reach: 3, arc: 150, kact: 'hx_lstorm', wave: starWave(5, { spread: .28 }) })], { minRange: 3.5, cd: 7, w: .8 }),
      A('Triple Oath', 3, [S('swing', .4, .14, .04, 84, { reach: 2.9, arc: 160, lunge: 1, kact: 'hx_triple' }), S('overhead', .35, .16, .9, 120, { reach: 3, arc: 90, aoe: 2, burst: true, kact: 'hx_hcut' })], { w: .9 }),
    ], { parry: .45, evasive: .5 }),
  });
}
