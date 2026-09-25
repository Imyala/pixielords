// Stance forms: each weapon fights its own way in each stance, like a stance mod in Warframe.
// A form has three strings of strikes:
//   standing  the chain when the knight strikes standing still (or circling a locked foe),
//   moving    the chain when the knight strikes on the move,
//   pause     after two strikes, let the blade rest a beat (a glint and a chime mark the moment), then
//             strike: the form's pause combo comes out instead of the next strike.
// Strike then heavy is a finisher, chosen by how many strikes came first (NieR); finishers spend the
// combo counter for damage. Each weapon also has its own slide attack and air strikes.
// Strike fields (times in animation seconds; the stance speed scales them): anim, dur, hit [start, end],
// dmg / ki / poise, cost, reach, arc (degrees), move (lunge metres), chain (earliest next strike), plus
// multi (the hit re-arms every so often), last (the final beat of a flurry hits this many times harder),
// pop (lifts ordinary foes: small values trip them, big ones launch), kb (knockback; negative pulls in),
// wave (a crescent of moonlight thrown on: length, speed, half-width, damage share, at), speed (play rate),
// fin (a finisher), aoe / aoeAt (a ground blow), fixedMove, pass, heavy.

export const FORMS = {
  sword: {
    mid: { name: 'Moonlit Path', neutral: ['light1', 'light2', 'light3', 'light4'], forward: ['s_lunge', 'light2', 's_rise', 'light4'], pause: 's_triple' },
    high: { name: 'Falling Star', neutral: ['s_hcleave', 's_hrise', 's_hslam'], forward: ['s_hstep', 's_hwheel', 's_hslam'], pause: 's_hsunder' },
    low: { name: 'Crescent Tide', neutral: ['s_ldraw', 's_lback', 's_lflurry', 's_lsweep'], forward: ['s_ldart', 's_lback', 's_lrise', 's_lflurry'], pause: 's_lpetal' },
  },
  glaive: {
    mid: { name: 'Tide of the Moon', neutral: ['g1', 'g2', 'g3', 'g4'], forward: ['g_dthrust', 'g2', 'g_helix', 'g4'], pause: 'g_twin' },
    high: { name: 'Moonreaper', neutral: ['g_hchop', 'g_hbutt', 'g_hreap'], forward: ['gHleap', 'g_hreap', 'g_hchop'], pause: 'g_hcyclone' },
    low: { name: 'Tidesweep', neutral: ['g_lsweep', 'g_lthrust', 'g_lspin', 'g_lflick'], forward: ['gLrun', 'g_lsweep', 'g_lflick', 'g_lspin'], pause: 'g_lundertow' },
  },
  fangs: {
    mid: { name: "Swallow's Dance", neutral: ['f1', 'f2', 'f3', 'f4'], forward: ['f_twinstep', 'f2', 'f_twist', 'f4'], pause: 'f_hundred' },
    high: { name: 'Falcon Dive', neutral: ['f_hx', 'f_hflip', 'f_hdrop'], forward: ['fHdive', 'f_hx', 'f_hflip'], pause: 'f_hsky' },
    low: { name: 'Serpent Coil', neutral: ['f_lhook', 'f_lstab', 'f_lsweep', 'f_lcoil'], forward: ['f_ldart', 'f_lhook', 'f_lcoil', 'f_lsweep'], pause: 'f_ltornado' },
  },
};

// Per weapon: finishers after one, two and three or more strikes; the slide attack; the air chain.
export const KIT = {
  sword: { fin: ['s_fin1', 's_fin2', 's_fin3'], slide: 'sSlide', air: 'air1' },
  glaive: { fin: ['gFin1', 'gFin2', 'gFin3'], slide: 'gSlide', air: 'gAir1' },
  fangs: { fin: ['fFin1', 'fFin2', 'fFin3'], slide: 'fSlide', air: 'fAir1' },
};

const MOON = 0xcfe8ff;
export const MOVES = {
  // ---------------------------------------------------------------- Fae Sword
  s_lunge: { name: 'Stepping Thrust', anim: 's_lunge', dur: .6, hit: [.17, .3], dmg: 44, ki: 26, poise: 12, cost: 13, reach: 2.7, arc: 50, move: 1.6, chain: .3 },
  s_rise: { name: 'Rising Moon', anim: 's_rise', dur: .66, hit: [.18, .3], dmg: 46, ki: 28, poise: 16, cost: 14, reach: 2.4, arc: 120, move: .8, chain: .34, pop: 5.5 },
  s_triple: { name: 'Triple Moon', anim: 's_triple', dur: .95, hit: [.1, .74], multi: .16, last: 2.2, dmg: 30, ki: 18, poise: 8, cost: 20, reach: 2.8, arc: 50, move: 1.4, chain: .74, kb: 3 },
  s_hcleave: { name: 'Falling Cleave', anim: 's_hcleave', dur: .72, hit: [.28, .4], dmg: 60, ki: 36, poise: 22, cost: 17, reach: 2.7, arc: 130, move: .9, chain: .46 },
  s_hrise: { name: 'Rising Cleave', anim: 's_hrise', dur: .74, hit: [.26, .38], dmg: 60, ki: 36, poise: 22, cost: 17, reach: 2.6, arc: 130, move: .8, chain: .48, kb: 5 },
  s_hslam: { name: 'Star Breaker', anim: 's_hslam', dur: .95, hit: [.46, .56], dmg: 82, ki: 52, poise: 32, cost: 22, reach: 2.6, arc: 100, move: 1.6, chain: .7, aoe: 2.0, aoeAt: 1.6, heavy: true },
  s_hstep: { name: 'Striding Cut', anim: 's_hstep', dur: .7, hit: [.25, .38], dmg: 58, ki: 34, poise: 20, cost: 17, reach: 2.8, arc: 170, move: 2.2, chain: .46 },
  s_hwheel: { name: 'Wheel of Stars', anim: 's_hwheel', dur: .9, hit: [.22, .6], dmg: 56, ki: 34, poise: 22, cost: 19, reach: 2.9, arc: 360, move: .7, chain: .66, kb: 5 },
  s_hsunder: { name: 'Sundering Blow', anim: 's_hsunder', dur: 1.1, hit: [.52, .64], dmg: 110, ki: 70, poise: 45, cost: 26, reach: 2.8, arc: 90, move: 1.2, chain: .86, heavy: true, wave: { len: 9, speed: 18, w: .9, dmg: .7, color: MOON } },
  s_ldraw: { name: 'Hip Draw', anim: 's_ldraw', dur: .48, hit: [.12, .22], dmg: 34, ki: 20, poise: 8, cost: 10, reach: 2.4, arc: 170, move: .9, chain: .24 },
  s_lback: { name: 'Backhand', anim: 's_lback', dur: .5, hit: [.14, .25], dmg: 34, ki: 20, poise: 8, cost: 10, reach: 2.4, arc: 170, move: .7, chain: .26 },
  s_lflurry: { name: 'Petal Cuts', anim: 's_lflurry', dur: .78, hit: [.08, .58], multi: .09, dmg: 14, ki: 8, poise: 3, cost: 15, reach: 2.4, arc: 160, move: .8, chain: .6 },
  s_lsweep: { name: 'Ankle Sweep', anim: 's_lsweep', dur: .82, hit: [.2, .58], dmg: 36, ki: 22, poise: 10, cost: 14, reach: 2.6, arc: 360, move: .5, chain: .6, pop: 3.2 },
  s_ldart: { name: 'Darting Thrust', anim: 's_ldart', dur: .5, hit: [.1, .3], dmg: 38, ki: 22, poise: 10, cost: 12, reach: 2.6, arc: 50, move: 3.4, chain: .32, fixedMove: true },
  s_lrise: { name: 'Crescent Rise', anim: 's_lrise', dur: .6, hit: [.2, .32], dmg: 38, ki: 22, poise: 12, cost: 12, reach: 2.4, arc: 90, move: .6, chain: .36, pop: 6 },
  s_lpetal: { name: 'Petal Storm', anim: 's_lpetal', dur: 1.05, hit: [.34, .72], multi: .07, last: 2.5, dmg: 18, ki: 10, poise: 4, cost: 20, reach: 2.8, arc: 360, move: .4, chain: .8 },
  s_fin1: { name: 'Moonrise', anim: 's_fin1', dur: .8, hit: [.24, .36], dmg: 62, ki: 40, poise: 30, cost: 18, reach: 2.5, arc: 120, move: .8, chain: .6, pop: 9.5, fin: true, heavy: true },
  s_fin2: { name: 'Wheel of Thorns', anim: 's_fin2', dur: 1.0, hit: [.16, .74], multi: .12, dmg: 26, ki: 16, poise: 8, cost: 22, reach: 2.8, arc: 360, move: 1.0, chain: .8, kb: 5, fin: true, heavy: true },
  s_fin3: { name: 'Moonpiercer', anim: 's_fin3', dur: 1.0, hit: [.46, .6], dmg: 120, ki: 70, poise: 45, cost: 26, reach: 3.2, arc: 40, move: 2.2, chain: .8, fixedMove: true, fin: true, heavy: true, wave: { len: 11, speed: 24, w: .7, dmg: .8, color: MOON } },
  sSlide: { name: 'Slide Sweep', anim: 's_lsweep', speed: 1.3, dur: .82, hit: [.12, .58], dmg: 40, ki: 24, poise: 12, cost: 10, reach: 2.6, arc: 360, move: 2.6, fixedMove: true, chain: .6, pop: 3.2 },

  // ---------------------------------------------------------------- Moonglaive
  g_dthrust: { name: 'Twin Thrust', anim: 'g_dthrust', dur: .7, hit: [.12, .4], multi: .2, dmg: 32, ki: 20, poise: 8, cost: 15, reach: 3.6, arc: 45, move: 1.3, chain: .42 },
  g_helix: { name: 'Moon Helix', anim: 'g_helix', dur: .95, hit: [.16, .66], multi: .12, dmg: 22, ki: 14, poise: 6, cost: 18, reach: 3.2, arc: 360, move: .5, chain: .7 },
  g_twin: { name: 'Twin Tides', anim: 'g_twin', dur: 1.25, hit: [.18, .98], multi: .16, last: 2, dmg: 30, ki: 18, poise: 8, cost: 22, reach: 3.3, arc: 360, move: 2.2, chain: .98, kb: -3 },
  g_hchop: { name: 'Moon Chop', anim: 'g_hchop', dur: .8, hit: [.3, .42], dmg: 66, ki: 42, poise: 26, cost: 18, reach: 3.4, arc: 60, move: .9, chain: .5 },
  g_hbutt: { name: 'Butt and Blade', anim: 'g_hbutt', dur: .9, hit: [.16, .52], multi: .3, dmg: 44, ki: 34, poise: 18, cost: 18, reach: 3.0, arc: 80, move: 1.0, chain: .56, kb: 5 },
  g_hreap: { name: 'Reaping Cut', anim: 'g_hreap', dur: .85, hit: [.3, .44], dmg: 62, ki: 38, poise: 22, cost: 18, reach: 3.4, arc: 160, move: .8, chain: .52, kb: -4 },
  gHleap: { name: 'Leaping Chop', anim: 'g_vault', dur: .95, hit: [.48, .58], dmg: 72, ki: 46, poise: 30, cost: 20, reach: 3.0, arc: 110, move: 3.0, chain: .74, aoe: 2.0, aoeAt: 2.1 },
  g_hcyclone: { name: 'Reaping Cyclone', anim: 'g_hcyclone', dur: 1.2, hit: [.28, .92], multi: .16, last: 2, dmg: 36, ki: 24, poise: 12, cost: 26, reach: 3.6, arc: 360, move: .6, chain: .96, kb: -3.5, heavy: true },
  g_lsweep: { name: 'Tide Sweep', anim: 'g_lsweep', dur: .62, hit: [.2, .34], dmg: 40, ki: 24, poise: 10, cost: 13, reach: 3.3, arc: 200, move: .5, chain: .36, pop: 3.2 },
  g_lthrust: { name: 'Low Thrust', anim: 'g_lthrust', dur: .5, hit: [.14, .26], dmg: 40, ki: 24, poise: 10, cost: 12, reach: 3.5, arc: 45, move: .9, chain: .28 },
  g_lspin: { name: 'Ankle Wheel', anim: 'g_lspin', dur: .85, hit: [.2, .58], dmg: 44, ki: 26, poise: 12, cost: 15, reach: 3.2, arc: 360, move: .4, chain: .6, pop: 3.2 },
  g_lflick: { name: 'Moon Flick', anim: 'g_lflick', dur: .62, hit: [.2, .32], dmg: 42, ki: 26, poise: 14, cost: 13, reach: 3.2, arc: 90, move: .6, chain: .38, pop: 6.5 },
  gLrun: { name: 'Running Low Thrust', anim: 'g_lthrust', dur: .5, hit: [.14, .26], dmg: 46, ki: 26, poise: 12, cost: 13, reach: 3.5, arc: 45, move: 3, fixedMove: true, chain: .3 },
  g_lundertow: { name: 'Undertow', anim: 'g_lundertow', dur: 1.2, hit: [.18, .96], multi: .14, dmg: 26, ki: 16, poise: 6, cost: 22, reach: 3.2, arc: 360, move: 2.6, fixedMove: true, chain: .98, pop: 3.2 },
  gFin1: { name: 'Moonvault Rise', anim: 'g_lflick', speed: .9, dur: .62, hit: [.2, .32], dmg: 64, ki: 42, poise: 30, cost: 18, reach: 3.3, arc: 110, move: .8, chain: .46, pop: 9.5, fin: true, heavy: true },
  gFin2: { name: 'Tidal Wheel', anim: 'g_crescent', dur: 1.15, hit: [.34, .62], dmg: 76, ki: 50, poise: 34, cost: 24, reach: 3.7, arc: 360, move: .6, chain: .9, kb: -4, fin: true, heavy: true },
  gFin3: { name: 'Moonlance', anim: 'g_pierce', dur: .85, hit: [.22, .46], dmg: 110, ki: 66, poise: 40, cost: 24, reach: 3.7, arc: 40, move: 5.2, fixedMove: true, chain: .64, fin: true, heavy: true, wave: { len: 12, speed: 26, w: .8, dmg: .8, color: 0xd8c8ff, at: .3 } },
  gSlide: { name: 'Sliding Wheel', anim: 'g_lspin', speed: 1.25, dur: .85, hit: [.14, .58], dmg: 46, ki: 26, poise: 12, cost: 11, reach: 3.2, arc: 360, move: 2.6, fixedMove: true, chain: .6, pop: 3.2 },
  gAir1: { name: 'Air Sweep', anim: 'gAir1', dur: .5, hit: [.1, .24], dmg: 40, ki: 24, poise: 10, cost: 10, reach: 3.2, arc: 200, move: .5, chain: .24, next: 'gAir2', air: true },
  gAir2: { name: 'Air Thrust', anim: 'gAir2', dur: .46, hit: [.1, .24], dmg: 40, ki: 24, poise: 10, cost: 10, reach: 3.4, arc: 50, move: .5, chain: .24, next: 'gAir3', air: true },
  gAir3: { name: 'Air Wheel', anim: 'gAir3', dur: .62, hit: [.12, .4], dmg: 50, ki: 30, poise: 14, cost: 13, reach: 3.2, arc: 360, move: .4, chain: .42, next: 'gAir1', air: true },

  // ---------------------------------------------------------------- Twin Fangs
  f_twinstep: { name: 'Twin Step', anim: 'f_twinstep', dur: .5, hit: [.1, .24], dmg: 30, ki: 16, poise: 6, cost: 9, reach: 2.3, arc: 200, move: 1.6, chain: .24 },
  f_twist: { name: 'Corkscrew', anim: 'f_twist', dur: .7, hit: [.1, .5], multi: .12, dmg: 18, ki: 10, poise: 4, cost: 12, reach: 2.3, arc: 360, move: .8, chain: .5 },
  f_hundred: { name: 'Hundred Cuts', anim: 'f_hundred', dur: 1.15, hit: [.1, .9], multi: .06, last: 3, dmg: 9, ki: 6, poise: 2, cost: 22, reach: 2.4, arc: 70, move: 1.0, chain: .92 },
  f_hx: { name: 'Falcon Cross', anim: 'f_hx', dur: .66, hit: [.25, .36], dmg: 44, ki: 26, poise: 12, cost: 12, reach: 2.3, arc: 120, move: 1.0, chain: .4 },
  f_hflip: { name: 'Somersault', anim: 'f_hflip', dur: .8, hit: [.18, .5], multi: .16, dmg: 24, ki: 14, poise: 8, cost: 14, reach: 2.4, arc: 140, move: 1.8, chain: .58, pop: 5 },
  f_hdrop: { name: 'Plunging Fangs', anim: 'f_hdrop', dur: .8, hit: [.42, .5], dmg: 58, ki: 34, poise: 20, cost: 15, reach: 2.2, arc: 100, move: 1.4, chain: .6, aoe: 1.7, aoeAt: 1.2 },
  fHdive: { name: 'Falcon Dive', anim: 'f_hdrop', dur: .8, hit: [.42, .5], dmg: 58, ki: 34, poise: 20, cost: 15, reach: 2.2, arc: 100, move: 3.2, fixedMove: true, chain: .6, aoe: 1.7, aoeAt: 1.2 },
  f_hsky: { name: 'Skyrend', anim: 'f_hsky', dur: 1.15, hit: [.12, .88], multi: .1, last: 3, dmg: 16, ki: 10, poise: 4, cost: 22, reach: 2.5, arc: 360, move: .6, chain: .92, pop: 4 },
  f_lhook: { name: 'Serpent Hooks', anim: 'f_lhook', dur: .62, hit: [.1, .36], multi: .2, dmg: 22, ki: 12, poise: 5, cost: 10, reach: 2.2, arc: 170, move: .7, chain: .38 },
  f_lsweep: { name: 'Coiling Sweep', anim: 'f_lsweep', dur: .78, hit: [.12, .6], multi: .12, dmg: 16, ki: 10, poise: 4, cost: 12, reach: 2.4, arc: 360, move: .5, chain: .6, pop: 3.2 },
  f_lstab: { name: 'Fang Stabs', anim: 'f_lstab', dur: .7, hit: [.06, .56], multi: .07, dmg: 10, ki: 6, poise: 2, cost: 12, reach: 2.3, arc: 70, move: .8, chain: .58 },
  f_lcoil: { name: 'Rising Coil', anim: 'f_lcoil', dur: .72, hit: [.1, .5], multi: .12, dmg: 18, ki: 10, poise: 5, cost: 12, reach: 2.3, arc: 360, move: .6, chain: .52, pop: 6 },
  f_ldart: { name: 'Darting Fangs', anim: 'f_ldart', dur: .56, hit: [.08, .32], multi: .08, dmg: 18, ki: 10, poise: 5, cost: 12, reach: 2.2, arc: 140, move: 5, fixedMove: true, pass: true, chain: .4 },
  f_ltornado: { name: 'Venom Tornado', anim: 'f_ltornado', dur: 1.25, hit: [.2, 1.0], multi: .08, dmg: 11, ki: 7, poise: 2, cost: 24, reach: 2.6, arc: 360, move: 3, fixedMove: true, chain: 1.0, pop: 3.2 },
  fFin1: { name: 'Swallow Rise', anim: 'f_fin1', dur: .8, hit: [.22, .36], dmg: 44, ki: 30, poise: 20, cost: 14, reach: 2.4, arc: 140, move: .8, chain: .6, pop: 9.5, fin: true, heavy: true },
  fFin2: { name: 'Fang Cyclone', anim: 'f_whirl', dur: 1.0, hit: [.2, .8], multi: .1, dmg: 18, ki: 11, poise: 5, cost: 18, reach: 2.7, arc: 360, move: 1.8, chain: .84, kb: -2.5, fin: true, heavy: true },
  fFin3: { name: 'Fang Storm', anim: 'f_fin3', dur: 1.2, hit: [.1, .84], multi: .06, last: 4, dmg: 10, ki: 7, poise: 2, cost: 22, reach: 2.4, arc: 90, move: 1.0, chain: 1.0, fin: true, heavy: true, wave: { len: 8, speed: 20, w: 1.1, dmg: 1.5, color: 0xffc8dc, at: .8 } },
  fSlide: { name: 'Sliding Coil', anim: 'f_lsweep', speed: 1.25, dur: .78, hit: [.1, .6], multi: .12, dmg: 18, ki: 10, poise: 4, cost: 9, reach: 2.4, arc: 360, move: 2.6, fixedMove: true, chain: .6, pop: 3.2 },
  fAir1: { name: 'Air Fang', anim: 'fAir1', dur: .36, hit: [.06, .16], dmg: 26, ki: 14, poise: 5, cost: 7, reach: 2.2, arc: 150, move: .5, chain: .18, next: 'fAir2', air: true },
  fAir2: { name: 'Air Fang', anim: 'fAir2', dur: .36, hit: [.06, .16], dmg: 26, ki: 14, poise: 5, cost: 7, reach: 2.2, arc: 150, move: .5, chain: .18, next: 'fAir3', air: true },
  fAir3: { name: 'Air Spin', anim: 'fAir3', dur: .6, hit: [.1, .5], multi: .12, dmg: 16, ki: 10, poise: 4, cost: 10, reach: 2.4, arc: 360, move: .4, chain: .42, next: 'fAir1', air: true },
};

// Names for the strikes that were already there.
export const NAMES = {
  light1: 'Crescent Cut', light2: 'Returning Cut', light3: 'Moon Cleave', light4: 'Full Moon',
  g1: 'Thrust', g2: 'Sweep', g3: 'One-handed Wheel', g4: 'Vault and Slam',
  f1: 'Right Fang', f2: 'Left Fang', f3: 'Crossing Cut', f4: 'Twin Spin',
  heavy: 'Overhead Cleave', skyfall: 'Skyfall', needle: 'Needle', g_crescent: 'Crescent', g_moonfall: 'Moonfall', g_pierce: 'Piercing Rush',
  f_whirl: 'Whirlwind', f_xfall: 'Crossfall', f_viper: 'Viper Dash', air1: 'Air Cut', air2: 'Air Cut', air3: 'Air Spin',
  run: 'Running Cut', dashSlash: 'Dash Slash', gRun: 'Running Thrust', gDash: 'Dash Sweep', fRun: 'Running Fang', fDash: 'Dash Cross',
  swSword: 'Switch Strike', swGlaive: 'Switch Strike', swFangs: 'Switch Strike', launch: 'Launcher', plunge: 'Starfall',
};

// The knight's movement: the slide, the Wingleap out of it, and the glide.
export const SLIDE = { dur: .7, min: 9.5, boost: 1.2, drag: 2.2, turn: 2.2, cost: 6 };
export const LEAP = { vy: 10.5, speed: 11, cost: 10 };
export const GLIDE = { sink: 1.3, speed: 6.5, max: 3 };
// Combos: strikes within 4 s of each other build the counter; every 12 hits add 6% damage, up to four
// times. A finisher spends it: 2% more per hit counted, up to 1.8×.
export const COMBO = { keep: 4, tier: 12, per: .06, tiers: 4, fin: .02, finMax: .8 };
// A chain stays live a little after its last strike ends; the pause window opens a beat after a strike.
export const CHAIN = { keep: .6, pause: .3 };
