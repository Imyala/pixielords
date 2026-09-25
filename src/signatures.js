// Signature strikes: every armory weapon (armory.js) fights with movements of its own. Each weapon's section
// builds its animations from the shapes in strikeshapes.js (a cut, a chop, a thrust, a whirl, a rising blow,
// strings of them) tuned to the weapon, plus hand-keyed moves where no shape will do; then gives each strike
// its numbers; then lays the strikes into the weapon's kit: three stance forms (standing chain, moving chain,
// pause combo), a heavy per stance, finishers after one, two and three strikes, and its run, dash, slide,
// air and Switch strikes. Numbers are like movesets.js's; the weapon's own damage, reach, speed and stamina
// (armory.js) scale them in play. A strike takes its animation's length and hit window unless it names them.
import { ACTIONS, K, airVariant, pose as pose0 } from './knight.js';
import { flurry } from './moveanims.js';
import './armoryanims.js';   // first: its one-handed variants are made only of the strikes before these
import { cut, chop, thrust, whirl, upcut, offcut, offchop, mirror, twirl, windmill, punch, rake, withKeys, retime, hold, shift, string,
  LUNGE, LUNGE_R, DEEP, REC, LOWREC, CROUCH, HOP, SLAM } from './strikeshapes.js';

export const SIG_MOVES = {};   // strike data, by key
export const SIG_KITS = {};    // per weapon: forms, heavy, fin, run, dash, slide, air, switch

const anims = o => Object.assign(ACTIONS, o);
// A strike: its name, animation and numbers. ki, poise and stamina follow damage unless given.
function S(key, name, anim, dmg, o = {}) {
  const A = ACTIONS[anim];
  if (!A) throw new Error('no animation ' + anim);
  const hit = o.hit || A.hit, dur = o.dur || A.dur;
  SIG_MOVES[key] = { name, anim, dur, hit, dmg, ki: Math.round(dmg * .62), poise: Math.round(dmg * .28), cost: Math.max(5, Math.round(dmg * .3)),
    reach: 2.5, arc: 150, move: .7, chain: +(hit[1] + .02).toFixed(3), ...o };
}
// A strike made from another: same animation, other numbers.
const D = (key, name, src, o = {}) => { SIG_MOVES[key] = { ...SIG_MOVES[src], name, ...o }; };
// Air strikes: an air version of three ground strikes, chained 1 → 2 → 3 → 1.
function airChain(p, keys, o = {}) {
  keys.forEach((k, i) => {
    const s = SIG_MOVES[k], an = p + 'Air' + (i + 1), dur = +(s.dur * .7).toFixed(2);
    ACTIONS[an] = airVariant(ACTIONS[s.anim], dur);
    const k2 = dur / s.dur;
    SIG_MOVES[an] = { ...s, name: 'Air ' + s.name.replace(/^(The )/, ''), anim: an, dur, hit: s.hit.map(v => +(v * k2).toFixed(3)), chain: +(s.hit[1] * k2 + .02).toFixed(3),
      move: .5, fixedMove: false, pop: 0, aoe: 0, wave: null, air: true, next: p + 'Air' + ((i + 1) % 3 + 1), multi: s.multi, cost: Math.round(s.cost * .7), dmg: Math.round(s.dmg * .9), ...o };
  });
  return p + 'Air1';
}
const kit = (id, k) => { SIG_KITS[id] = k; };
const act0 = (dur, keys) => ({ dur, keys });
// Flurries (moveanims.js) with their hit window: the first stab to the driving last one.
const flurryH = o => ({ ...flurry(o), hit: [+(o.t0 - .03).toFixed(3), +(o.t0 + o.n * o.step + .05).toFixed(3)] });

// Resting holds for each family, to end on.
const SWORD_END = { hiltA: -.5, hiltR: .38, hiltH: -.1, bladeYaw: .2, bladePitch: .3, bladeRoll: 0, chestRy: 0, chestRx: .06, twoHand: 0, bodyRz: 0 };
const GREAT_END = { chestRy: -.45, chestRx: .05, hiltA: -.85, hiltR: .26, hiltH: -.2, bladeYaw: .45, bladePitch: .55, bladeRoll: 0, twoHand: 1 };
const GREAT_HIGH = { chestRy: -.3, chestRx: 0, hiltA: -.6, hiltR: .18, hiltH: .22, bladeYaw: .6, bladePitch: 2.3, bladeRoll: 0, twoHand: 1 };
const GREAT_LOW = { chestRy: -.5, chestRx: .2, hiltA: -1.0, hiltR: .3, hiltH: -.32, bladeYaw: .3, bladePitch: -.55, bladeRoll: 0, twoHand: 1 };
const POLE_END = { chestRy: -.55, chestRx: .05, hiltA: -.95, hiltR: .27, hiltH: -.18, bladeYaw: .62, bladePitch: .2, bladeRoll: 0, twoHand: 1 };
const POLE_HIGH = { chestRy: -.45, chestRx: -.04, hiltA: -.7, hiltR: .22, hiltH: .3, bladeYaw: .5, bladePitch: -.2, bladeRoll: 0, twoHand: 1 };
const POLE_LOW = { chestRy: -.5, chestRx: .22, hiltA: -1.1, hiltR: .28, hiltH: -.34, bladeYaw: .6, bladePitch: -.12, bladeRoll: 0, twoHand: 1 };
const PAIR_END = { hiltA: -.6, hiltR: .34, hiltH: -.05, bladeYaw: .3, bladePitch: .35, bladeRoll: 0, lhX: .26, lhY: -.08, lhZ: .3, lbYaw: 2.7, lbPitch: -.35, lbRoll: 0, twoHand: 0, chestRy: -.15 };
const PAIR_HIGH = { hiltA: -.5, hiltR: .28, hiltH: .3, bladeYaw: .2, bladePitch: .9, bladeRoll: 0, lhX: .24, lhY: .22, lhZ: .22, lbYaw: .3, lbPitch: .8, lbRoll: 0, twoHand: 0, chestRy: -.1 };
const PAIR_LOW = { hiltA: -.8, hiltR: .34, hiltH: -.32, bladeYaw: .2, bladePitch: -.1, bladeRoll: 0, lhX: .3, lhY: -.3, lhZ: .26, lbYaw: 2.8, lbPitch: -.1, lbRoll: 0, twoHand: 0, chestRy: -.2, chestRx: .3 };
const FIST_END = { hiltA: -.35, hiltR: .26, hiltH: .12, lhX: .12, lhY: .12, lhZ: .34, chestRy: -.25, chestRx: .08, twoHand: 0 };
const FIST_HIGH = { hiltA: -.4, hiltR: .24, hiltH: .2, lhX: .14, lhY: .2, lhZ: .3, chestRy: -.4, twoHand: 0 };
const FIST_LOW = { hiltA: -.5, hiltR: .34, hiltH: -.1, lhX: .2, lhY: -.05, lhZ: .42, chestRy: -.2, chestRx: .25, twoHand: 0 };
const SOFT_L = { thLx: -.4, knL: .45, thRx: .35, knR: .35, lift: -.07 };
const TUCK_L = { thLx: -.9, knL: 1.4, thRx: .35, knR: 1.2, wings: 2 };
const STAND = { lift: -.05, thLx: -.35, knL: .35, thRx: .3, knR: .35, bodyRz: 0 };
const LOWSTAND = { lift: -.16, thLx: -.6, knL: .8, thRx: .45, knR: .7 };
const MOON = 0xcfe8ff;

// ==================================================================== Warblade (Heavy Blade, Odachi, Large Sword)
// Two hands, long cuts that carry the whole body: sweeps that turn into wheels, cleaves from high over the
// shoulder, and a blade dragged along the ground and ripped upward.
{
  const E = { ...GREAT_END, ...REC }, EH = { ...GREAT_HIGH, ...REC }, EL = { ...GREAT_LOW, ...LOWREC };
  anims({
    wb_sweep: cut({ dur: .8, s: 1, two: 1, h0: .1, h1: -.05, t: [.22, .34, .46], legs: LUNGE_R, fol: { ...DEEP }, end: { ...E, chestRy: .15 } }),
    wb_return: cut({ dur: .8, s: -1, two: 1, h0: -.05, h1: .1, t: [.2, .32, .44], legs: LUNGE, fol: { ...DEEP }, end: E }),
    wb_turn: whirl({ dur: 1.0, turns: 1, two: 1, h: .02, t: [.2, .7], r: .5, end: E }),
    wb_fall: chop({ dur: .95, two: 1, yaw: .2, t: [.3, .46, .56], end: E }),
    wb_rush: thrust({ dur: .72, two: 1, h: .08, reach: .56, t: [.16, .28, .4], lead: { wings: 1.6 }, out: { wings: 2 }, end: E }),
    wb_upper: upcut({ dur: .82, t: [.2, .32, .42], end: { ...E, hiltH: .1, bladePitch: 1.0 } }),
    // High form: cleaves from over the shoulder.
    wb_hfall: chop({ dur: .9, two: 1, yaw: .5, a: -.2, t: [.26, .42, .52], lead: { chestRy: -.4 }, end: EH }),
    wb_hcross: cut({ dur: .85, s: 1, two: 1, h0: .55, h1: -.3, p0: 1.0, p1: -.75, a0: .7, a1: .75, t: [.24, .36, .48], fol: { ...DEEP, lift: -.26 }, end: EH }),
    wb_hrise: cut({ dur: .85, s: -1, two: 1, h0: -.3, h1: .55, p0: -.6, p1: 1.15, a0: .75, a1: .7, t: [.22, .34, .46], legs: { ...CROUCH }, fol: { ...LUNGE, lift: .06, wings: 1.6 }, end: EH }),
    wb_hleap: chop({ dur: 1.1, two: 1, hop: .35, yaw: .3, t: [.34, .56, .66], end: EH }),
    // Heaven Splitter: the blade lifted high and held, glowing, then brought down through everything.
    wb_hsplit: { dur: 1.3, hit: [.66, .78], keys: [
      K(0, { ...GREAT_HIGH, lift: -.1, thLx: -.5, knL: .7, thRx: .3, knR: .6 }),
      K(.22, { hiltA: -.1, hiltR: .12, hiltH: .66, bladeYaw: 0, bladePitch: 1.62, chestRx: -.3, chestRy: 0, lift: .04, thLx: -.2, knL: .2, thRx: .3, knR: .3, wings: 2 }),
      K(.52, { hiltH: .7, bladePitch: 1.9, chestRx: -.4, wings: 2.4 }),
      K(.64, { hiltA: 0, hiltR: .52, hiltH: .15, bladePitch: .2, chestRx: .45, ...DEEP }),
      K(.76, { hiltH: -.32, bladePitch: -.9, chestRx: .75, ...SLAM, wings: 1 }),
      K(1.3, EH),
    ] },
    // Low form: the blade dragged and ripped up, sweeps at the ankles, a wheel along the ground.
    wb_ldrag: cut({ dur: .78, s: 1, two: 1, h0: -.34, h1: .25, p0: -.7, p1: .6, t: [.2, .32, .42], legs: { ...CROUCH }, fol: { ...LUNGE }, end: EL }),
    wb_lsweep: cut({ dur: .75, s: -1, two: 1, h0: -.3, h1: -.32, p0: -.45, p1: -.5, t: [.18, .3, .42], legs: { ...CROUCH, thLz: .2, thRz: -.2 }, end: { ...EL, thLz: .04, thRz: -.04 } }),
    wb_lwheel: whirl({ dur: .95, turns: 1, two: 1, h: -.3, p: -.3, low: .12, t: [.18, .66], end: EL }),
    wb_lscoop: upcut({ dur: .72, t: [.18, .28, .36], a: -.4, end: EL }),
    wb_lrush: cut({ dur: .8, s: 1, two: 1, h0: -.3, h1: 0, p0: -.4, p1: .2, t: [.3, .4, .5], lead: { wings: 1.8, lift: -.2, thLx: -1.0, knL: .8, thRx: .9, knR: .4 }, end: EL }),
    wb_lwhirl: whirl({ dur: 1.3, turns: 2, two: 1, h: -.28, p: -.3, low: .14, t: [.2, 1.02], end: EL }),
  });
  anims({
    // Iron Tide: a sweep, the return, and a wheel that ends in a falling cleave.
    wb_tide: string([ACTIONS.wb_sweep, ACTIONS.wb_return, whirl({ dur: 1.0, turns: 1, two: 1, h: .05, t: [.12, .62], r: .5 }), chop({ two: 1, yaw: .2, t: [.16, .3, .4] })], E, .4),
    wb_fin2: whirl({ dur: 1.2, turns: 2, two: 1, h: .02, rise: .25, t: [.18, .9], r: .5, end: E }),
  });
  S('wb_sweep', 'Great Sweep', 'wb_sweep', 72, { reach: 3.0, arc: 190, kb: 5, move: .8 });
  S('wb_return', 'Return Sweep', 'wb_return', 72, { reach: 3.0, arc: 190, kb: 5, move: .8 });
  S('wb_turn', 'Iron Wheel', 'wb_turn', 76, { reach: 3.1, arc: 360, kb: 6, move: .6 });
  S('wb_fall', 'Overhead Cleave', 'wb_fall', 96, { reach: 3.0, arc: 90, aoe: 2.0, aoeAt: 2.0, pop: 3.4, heavy: true, move: 1 });
  S('wb_rush', 'Striding Thrust', 'wb_rush', 62, { reach: 3.2, arc: 50, move: 3.4, fixedMove: true, kb: 6 });
  S('wb_upper', 'Rising Cleave', 'wb_upper', 74, { reach: 2.9, arc: 110, pop: 7.5 });
  S('wb_tide', 'Iron Tide', 'wb_tide', 58, { reach: 3.1, arc: 360, multi: .5, last: 1.8, kb: 5, move: 1.2, cost: 34, aoe: 2.2, aoeAt: 2.0, heavy: true });
  S('wb_hfall', 'Falling Edge', 'wb_hfall', 100, { reach: 3.1, arc: 90, move: 1, pop: 3.4 });
  S('wb_hcross', 'Crossing Edge', 'wb_hcross', 90, { reach: 3.1, arc: 140, move: .9 });
  S('wb_hrise', "Heaven's Rise", 'wb_hrise', 88, { reach: 3.0, arc: 140, pop: 6.5, move: .8 });
  S('wb_hleap', 'Leaping Cleave', 'wb_hleap', 110, { reach: 3.0, arc: 110, move: 3.4, fixedMove: true, aoe: 2.6, aoeAt: 2.0, pop: 3.6, heavy: true });
  S('wb_hsplit', 'Heaven Splitter', 'wb_hsplit', 150, { reach: 3.2, arc: 80, move: 1.2, heavy: true, aoe: 2.4, aoeAt: 2.2, wave: { len: 11, speed: 20, w: 1.2, dmg: .75, color: 0xd8e4ff }, cost: 32 });
  S('wb_ldrag', 'Dragging Edge', 'wb_ldrag', 66, { reach: 3.0, arc: 150, pop: 5, move: .8 });
  S('wb_lsweep', 'Low Sweep', 'wb_lsweep', 62, { reach: 3.1, arc: 200, pop: 3.4, move: .6 });
  S('wb_lwheel', 'Reaver Wheel', 'wb_lwheel', 64, { reach: 3.1, arc: 360, pop: 3.4, move: .5 });
  S('wb_lscoop', 'Scooping Cut', 'wb_lscoop', 66, { reach: 2.9, arc: 110, pop: 7, move: .7 });
  S('wb_lrush', 'Reaving Rush', 'wb_lrush', 70, { reach: 3.0, arc: 140, move: 3.6, fixedMove: true, pop: 5 });
  S('wb_lwhirl', "Reaver's Whirl", 'wb_lwhirl', 34, { reach: 3.1, arc: 360, multi: .16, last: 2, pop: 3.4, move: 2.8, fixedMove: true, cost: 32 });
  D('wb_heavyH', 'Mountain Cleaver', 'wb_hsplit', { dmg: 160, charge: .5, cost: 36 });
  D('wb_heavyM', "Giant's Sweep", 'wb_turn', { dmg: 130, ki: 84, poise: 56, charge: .2, cost: 34, heavy: true, kb: 9, speed: .85 });
  D('wb_heavyL', 'Rising Giant', 'wb_upper', { dmg: 120, ki: 80, poise: 54, pop: 9.5, charge: .2, cost: 30, heavy: true, speed: .85 });
  D('wb_fin1', 'Moonrise Cleave', 'wb_upper', { dmg: 110, pop: 9.5, fin: true, heavy: true, cost: 24 });
  S('wb_fin2', 'Thunder Wheel', 'wb_fin2', 60, { reach: 3.2, arc: 360, multi: .36, last: 1.6, kb: 9, fin: true, heavy: true, cost: 28, move: .8 });
  D('wb_fin3', 'Worldsplitter', 'wb_hleap', { dmg: 150, fin: true, cost: 30, wave: { len: 12, speed: 18, w: 1.2, dmg: .75, color: 0xd8e4ff } });
  D('wb_run', 'Running Thrust', 'wb_rush', { dmg: 68, move: 3.8 });
  D('wb_dash', 'Dash Sweep', 'wb_sweep', { dmg: 66, move: 1.6 });
  D('wb_slide', 'Skidding Wheel', 'wb_lwheel', { speed: 1.2, move: 2.6, fixedMove: true, cost: 16 });
  D('wb_sw', 'Switch Strike', 'wb_turn', { dmg: 80, cost: 10, kb: 7 });
  kit('great', {
    heavy: { high: 'wb_heavyH', mid: 'wb_heavyM', low: 'wb_heavyL' }, run: 'wb_run', dash: 'wb_dash', switch: 'wb_sw',
    fin: ['wb_fin1', 'wb_fin2', 'wb_fin3'], slide: 'wb_slide', air: airChain('wb', ['wb_sweep', 'wb_return', 'wb_turn']),
    forms: {
      high: { name: "Heaven's Edge", neutral: ['wb_hfall', 'wb_hcross', 'wb_hrise'], forward: ['wb_hleap', 'wb_hcross', 'wb_hrise'], pause: 'wb_hsplit' },
      mid: { name: 'Iron Tide', neutral: ['wb_sweep', 'wb_return', 'wb_turn', 'wb_fall'], forward: ['wb_rush', 'wb_return', 'wb_upper', 'wb_turn'], pause: 'wb_tide' },
      low: { name: 'Ground Reaver', neutral: ['wb_ldrag', 'wb_lsweep', 'wb_lwheel', 'wb_lscoop'], forward: ['wb_lrush', 'wb_lsweep', 'wb_lscoop'], pause: 'wb_lwhirl' },
    },
  });
}

// ==================================================================== Warden's Aegis (Sword and Shield)
// The sword works from behind a shield that never drops: short cuts and stabs over its rim, the shield itself
// punched, lifted and slammed, and a whirl with the shield leading.
{
  const SH = { lhX: .14, lhY: .06, lhZ: .36, twoHand: 0 }, E = { ...SWORD_END, ...SH, ...REC }, EL = { ...SWORD_END, hiltH: -.3, ...SH, lhY: -.05, ...LOWREC };
  const sh = A => hold(A, SH);
  anims({
    ae_cut: sh(cut({ dur: .56, s: 1, h0: .1, h1: -.02, t: [.12, .2, .3], end: E })),
    ae_back: sh(cut({ dur: .56, s: -1, h0: -.02, h1: .12, t: [.12, .2, .3], end: E })),
    ae_stab: sh(thrust({ dur: .52, h: .16, t: [.1, .18, .28], end: E })),
    ae_upbash: { dur: .62, hit: [.16, .3], keys: [
      K(0, { ...SWORD_END, lhX: .2, lhY: -.25, lhZ: .25, chestRy: .3, chestRx: .3, ...CROUCH }),
      K(.12, { lhY: -.3, lhZ: .2, chestRx: .35, lift: -.3 }),
      K(.22, { lhX: .06, lhY: .42, lhZ: .5, chestRy: -.3, chestRx: -.2, ...LUNGE, lift: .06, wings: 1.6 }),
      K(.3, { lhY: .46 }),
      K(.62, E),
    ] },
    ae_slam: { dur: .8, hit: [.38, .5], keys: [
      K(0, { ...SWORD_END, ...SH }),
      K(.24, { lhX: .1, lhY: .55, lhZ: .2, chestRx: -.3, hiltA: -.7, hiltH: .15, ...HOP, lift: .24 }),
      K(.4, { lhX: .05, lhY: -.15, lhZ: .56, chestRx: .6, ...SLAM }),
      K(.8, E),
    ] },
    ae_hchop: sh(chop({ dur: .76, two: 0, yaw: .1, t: [.22, .36, .46], top: { lhY: .3 }, end: E })),
    ae_hcross: sh(cut({ dur: .7, s: 1, h0: .5, h1: -.25, p0: .95, p1: -.7, t: [.2, .3, .4], fol: { ...DEEP }, end: E })),
    ae_leap: sh(chop({ dur: .95, two: 0, hop: .3, yaw: .1, t: [.3, .5, .6], end: E })),
    ae_lcut: sh(cut({ dur: .52, s: 1, h0: -.28, h1: -.3, p0: -.3, p1: -.35, t: [.1, .18, .28], legs: CROUCH, end: EL })),
    ae_lback: sh(cut({ dur: .52, s: -1, h0: -.3, h1: -.2, p0: -.35, p1: -.2, t: [.1, .18, .28], legs: CROUCH, end: EL })),
    ae_lspin: whirl({ dur: .85, h: -.3, p: -.2, low: .12, t: [.14, .6], lead: { ...SH, lhY: -.1, lhX: .4, lhZ: .1 }, end: EL }),
    ae_ldart: sh(thrust({ dur: .6, h: -.12, t: [.1, .22, .36], lead: { lift: -.2 }, end: EL })),
  });
  anims({
    ae_lbash: shift(ACTIONS.ae_bash, { lhY: -.22, lift: -.1, chestRx: .15 }),
    ae_rhythm: string([ACTIONS.ae_bash, ACTIONS.ae_cut, ACTIONS.ae_back, ACTIONS.ae_stab], E, .3),
    ae_hbreak: string([ACTIONS.ae_slam, sh(chop({ two: 0, yaw: .1, t: [.18, .3, .4] }))], E, .35),
    ae_lwall: whirl({ dur: 1.2, turns: 2, h: -.25, p: -.2, low: .1, t: [.16, .92], lead: { ...SH, lhX: .45, lhZ: 0, lhY: 0 }, end: EL }),
    ae_fin2: whirl({ dur: 1.05, turns: 2, h: .05, rise: .2, t: [.14, .8], lead: { ...SH, lhX: .5, lhZ: 0 }, end: E }),
  });
  S('ae_cut', "Warden's Cut", 'ae_cut', 40, { reach: 2.5, arc: 160 });
  S('ae_back', 'Backcut', 'ae_back', 40, { reach: 2.5, arc: 160 });
  S('ae_stab', 'Over-the-Rim', 'ae_stab', 44, { reach: 2.7, arc: 50, move: 1.2 });
  S('ae_upbash', 'Shield Uppercut', 'ae_upbash', 36, { reach: 2.0, arc: 90, ki: 44, pop: 6.5, move: .9 });
  S('ae_rhythm', "Warden's Rhythm", 'ae_rhythm', 34, { reach: 2.5, arc: 120, multi: .3, last: 1.8, kb: 5, cost: 22, move: 1.4 });
  S('ae_hchop', 'Falling Cut', 'ae_hchop', 58, { reach: 2.6, arc: 90, move: .9 });
  S('ae_hcross', 'Crossing Cut', 'ae_hcross', 56, { reach: 2.6, arc: 130, move: .9 });
  S('ae_leap', 'Leaping Cut', 'ae_leap', 64, { reach: 2.6, arc: 110, move: 3.0, fixedMove: true, aoe: 1.8, aoeAt: 1.6, pop: 3.2 });
  S('ae_hbreak', 'Bastion Break', 'ae_hbreak', 70, { reach: 2.6, arc: 120, multi: .42, last: 1.4, aoe: 2.4, aoeAt: 1.4, pop: 3.4, heavy: true, cost: 26, move: 1.2 });
  S('ae_lcut', 'Low Cut', 'ae_lcut', 34, { reach: 2.4, arc: 170, move: .7 });
  S('ae_lback', 'Low Backcut', 'ae_lback', 34, { reach: 2.4, arc: 170, move: .7 });
  S('ae_lbash', 'Low Bash', 'ae_lbash', 32, { reach: 2.0, arc: 90, ki: 40, pop: 3.2, kb: 5, move: 1.1 });
  S('ae_lspin', 'Shield Wheel', 'ae_lspin', 36, { reach: 2.5, arc: 360, pop: 3.2, move: .5 });
  S('ae_ldart', 'Shield Lance', 'ae_ldart', 40, { reach: 2.6, arc: 50, move: 3.4, fixedMove: true });
  S('ae_lwall', 'Turning Wall', 'ae_lwall', 22, { reach: 2.5, arc: 360, multi: .14, last: 2, kb: 4, move: 2.2, fixedMove: true, cost: 22 });
  D('ae_heavyH', 'Falling Bastion', 'ae_leap', { dmg: 110, ki: 70, poise: 46, heavy: true, charge: .2, cost: 28, aoe: 2.6 });
  D('ae_heavyL', 'Shield Needle', 'ae_ldart', { dmg: 70, ki: 44, poise: 26, heavy: true, charge: .08, cost: 18, move: 4.4 });
  D('ae_fin1', 'Bastion Rise', 'ae_upbash', { dmg: 58, ki: 60, pop: 9.5, fin: true, heavy: true, cost: 16 });
  S('ae_fin2', 'Spinning Bulwark', 'ae_fin2', 30, { reach: 2.6, arc: 360, multi: .12, kb: 6, fin: true, heavy: true, cost: 22, move: 1.0 });
  D('ae_fin3', "Warden's Judgement", 'ae_stab', { dmg: 110, ki: 64, poise: 40, move: 2.2, fixedMove: true, fin: true, heavy: true, cost: 24, wave: { len: 10, speed: 22, w: .8, dmg: .8, color: 0xffe0a0 } });
  D('ae_dash', 'Dash Cut', 'ae_cut', { dmg: 46, move: 1.8 });
  D('ae_slide', 'Sliding Wheel', 'ae_lspin', { speed: 1.25, move: 2.6, fixedMove: true, cost: 10 });
  D('ae_sw', 'Switch Strike', 'ae_fin2', { dmg: 26, fin: false, heavy: false, cost: 8 });
  kit('aegis', {
    heavy: { high: 'ae_heavyH', mid: 'ae_charge', low: 'ae_heavyL' }, run: 'ae_charge', dash: 'ae_dash', switch: 'ae_sw',
    fin: ['ae_fin1', 'ae_fin2', 'ae_fin3'], slide: 'ae_slide', air: airChain('ae', ['ae_cut', 'ae_back', 'ae_stab']),
    forms: {
      high: { name: 'Bastion', neutral: ['ae_hchop', 'ae_upbash', 'ae_hcross'], forward: ['ae_leap', 'ae_upbash', 'ae_hcross'], pause: 'ae_hbreak' },
      mid: { name: "Warden's Way", neutral: ['ae_cut', 'ae_bash', 'ae_back', 'ae_stab'], forward: ['ae_stab', 'ae_cut', 'ae_upbash', 'ae_back'], pause: 'ae_rhythm' },
      low: { name: 'Low Wall', neutral: ['ae_lcut', 'ae_lbash', 'ae_lback', 'ae_lspin'], forward: ['ae_ldart', 'ae_lbash', 'ae_lcut'], pause: 'ae_lwall' },
    },
  });
}

// ==================================================================== Thorn Daggers (Daggers, Dual Daggers)
// Reverse grips and short blades: cut and cut again with both hands, stab in pairs, turn on the spot and slip
// straight through a foe, all at a pace nothing else matches.
{
  const E = { ...PAIR_END, ...REC }, EH = { ...PAIR_HIGH, ...REC }, EL = { ...PAIR_LOW, ...LOWREC };
  const REV = { lhX: .26, lhY: -.08, lhZ: .3, lbYaw: 2.7, lbPitch: -.35, lbRoll: 0 };
  anims({
    dg_slash: withKeys(cut({ dur: .42, s: 1, t: [.05, .11, .18], legs: SOFT_L, lead: REV, end: E }), offcut({ s: -1, at: .17, len: .12 }), [.08, .3]),
    dg_rev: withKeys(cut({ dur: .44, s: -1, h0: .12, h1: -.1, p1: -.3, t: [.05, .11, .18], legs: SOFT_L, lead: REV, end: E }), offcut({ s: 1, at: .18, len: .12, h0: -.1, h1: .15 }), [.08, .31]),
    dg_stab: { dur: .46, hit: [.08, .26], keys: [
      K(0, { ...PAIR_END, hiltA: -.6, hiltR: .2, bladeYaw: 0, bladePitch: 0, bladeRoll: 1.57, lhX: .3, lhZ: .16, lbYaw: 0, lbPitch: 0, lbRoll: 1.57, ...LUNGE_R }),
      K(.1, { hiltA: -.12, hiltR: .6, hiltH: .05, chestRy: .15, chestRx: .2, ...LUNGE }),
      K(.18, { lhX: .1, lhY: .0, lhZ: .6, hiltR: .4, chestRy: -.2, ...DEEP }),
      K(.46, E),
    ] },
    dg_spin: whirl({ dur: .62, h: .02, t: [.08, .46], off: true, r: .5, end: E }),
    dg_dart: withKeys(cut({ dur: .52, s: 1, h0: 0, h1: -.05, t: [.1, .18, .28], lead: { lift: -.25, chestRx: .5, thLx: -1.1, knL: .8, thRx: 1.0, knR: .4, wings: 2 }, end: E }), offcut({ s: -1, at: .24, len: .12 }), [.1, .38]),
    dg_hcross: { dur: .56, hit: [.2, .32], keys: [
      K(0, { ...PAIR_HIGH, hiltA: -.4, hiltR: .2, hiltH: .45, bladeYaw: -.7, bladePitch: 1.25, bladeRoll: 1.57, lhX: .15, lhY: .45, lhZ: .15, lbYaw: .7, lbPitch: 1.25, lbRoll: -1.57, chestRx: -.25, ...LUNGE_R }),
      K(.14, { hiltH: .52, lhY: .52, chestRx: -.32 }),
      K(.23, { hiltA: .1, hiltR: .5, hiltH: 0, bladeYaw: .4, bladePitch: -.1, lhX: -.02, lhY: 0, lhZ: .5, lbYaw: -.4, lbPitch: -.1, chestRx: .3, ...LUNGE }),
      K(.31, { hiltA: .5, hiltR: .42, hiltH: -.28, bladeYaw: 1.0, bladePitch: -.7, lhX: -.24, lhY: -.22, lhZ: .4, lbYaw: -1.0, lbPitch: -.7, chestRx: .5, lift: -.18 }),
      K(.56, EH),
    ] },
    dg_hstab: { dur: .62, hit: [.26, .36], keys: [
      K(0, { ...PAIR_HIGH, hiltA: -.25, hiltR: .26, hiltH: .5, bladeYaw: 0, bladePitch: -1.2, bladeRoll: 0, lhX: .15, lhY: .5, lhZ: .26, lbYaw: 0, lbPitch: -1.2, lbRoll: 0, chestRx: -.3, lift: .05 }),
      K(.18, { hiltH: .58, lhY: .58, chestRx: -.38, ...HOP, lift: .2 }),
      K(.3, { hiltA: -.1, hiltR: .5, hiltH: -.28, lhX: .08, lhY: -.28, lhZ: .5, chestRx: .65, lift: -.28, thLx: -1, knL: 1.3, thRx: .7, knR: 1.1 }),
      K(.62, EH),
    ] },
    dg_hspin: whirl({ dur: .7, h: .15, p: .3, rise: .3, t: [.1, .5], off: true, r: .5, end: EH }),
    dg_vault: { dur: .72, hit: [.36, .46], keys: [
      K(0, { ...PAIR_END, lift: -.2, chestRx: .3, thLx: -.7, knL: 1, thRx: .3, knR: .9 }),
      K(.18, { lift: .5, chestRx: -.3, hiltA: -.3, hiltR: .2, hiltH: .5, bladeYaw: 0, bladePitch: -1.2, bladeRoll: 0, lhX: .15, lhY: .5, lhZ: .2, lbYaw: 0, lbPitch: -1.2, ...TUCK_L }),
      K(.3, { lift: .52 }),
      K(.4, { lift: -.28, chestRx: .7, hiltA: -.1, hiltR: .5, hiltH: -.3, lhX: .08, lhY: -.3, lhZ: .5, thLx: -1, knL: 1.3, thRx: .7, knR: 1.1, wings: 1 }),
      K(.72, EH),
    ] },
    dg_lslice: withKeys(cut({ dur: .46, s: 1, h0: -.28, h1: -.3, p0: -.2, p1: -.3, t: [.06, .13, .21], legs: CROUCH, lead: { ...REV, lhY: -.3 }, end: EL }), offcut({ s: -1, h0: -.3, h1: -.32, p0: -.2, p1: -.3, at: .19, len: .12 }), [.09, .33]),
    dg_lspin: whirl({ dur: .7, h: -.3, p: -.2, low: .14, t: [.1, .5], off: true, r: .5, end: EL }),
  });
  anims({
    dg_hundred: flurryH({ n: 14, t0: .12, step: .055, dur: 1.1 }),
    dg_hrain: flurryH({ n: 10, t0: .12, step: .065, dur: 1.0, low: -.3 }),
    dg_lstab: flurryH({ n: 6, t0: .08, step: .06, dur: .62, low: .28 }),
    dg_lshadow: whirl({ dur: 1.2, turns: 3, h: -.3, p: -.2, low: .14, t: [.14, 1.0], off: true, r: .5, end: EL }),
    dg_whirl: whirl({ dur: 1.0, turns: 3, h: 0, t: [.16, .82], off: true, r: .52, end: E }),
    dg_rise: withKeys(upcut({ dur: .6, two: 0, t: [.12, .22, .3], jump: .15, end: EH }), mirror(upcut({ dur: .6, two: 0, t: [.12, .22, .3], jump: .15 }), { delay: .03 }), [.14, .34]),
    dg_fin2: whirl({ dur: .95, turns: 3, h: .1, p: .2, rise: .35, t: [.12, .76], off: true, r: .5, end: EH }),
    dg_thousand: flurryH({ n: 16, t0: .12, step: .05, dur: 1.2 }),
  });
  S('dg_slash', 'Thorn Cut', 'dg_slash', 22, { reach: 2.3, arc: 160, multi: .11, move: .6 });
  S('dg_rev', 'Reverse Cut', 'dg_rev', 22, { reach: 2.3, arc: 160, multi: .11, move: .6 });
  S('dg_stab', 'Twin Stab', 'dg_stab', 22, { reach: 2.3, arc: 60, multi: .09, move: .9 });
  S('dg_spin', 'Thorn Spin', 'dg_spin', 20, { reach: 2.4, arc: 360, multi: .13, move: .5 });
  S('dg_dart', 'Slipping Cut', 'dg_dart', 22, { reach: 2.3, arc: 140, multi: .12, move: 4.2, fixedMove: true, pass: true });
  S('dg_hundred', 'Thousand Needles', 'dg_hundred', 8, { reach: 2.4, arc: 70, multi: .055, last: 3, move: 1.0, cost: 20 });
  S('dg_hcross', "Magpie's Cross", 'dg_hcross', 34, { reach: 2.3, arc: 120, move: .9 });
  S('dg_hstab', 'Falling Thorns', 'dg_hstab', 40, { reach: 2.2, arc: 100, move: 1.1, aoe: 1.5, aoeAt: 1.1 });
  S('dg_hspin', 'Rising Thorns', 'dg_hspin', 22, { reach: 2.4, arc: 360, multi: .14, pop: 5, move: .6 });
  S('dg_vault', 'Vaulting Stab', 'dg_vault', 44, { reach: 2.2, arc: 100, move: 3.2, fixedMove: true, aoe: 1.6, aoeAt: 1.2 });
  S('dg_hrain', 'Thorn Rain', 'dg_hrain', 10, { reach: 2.4, arc: 80, multi: .065, last: 3, move: .8, cost: 20 });
  S('dg_lslice', 'Hamstring', 'dg_lslice', 20, { reach: 2.3, arc: 170, multi: .12, pop: 3.2, move: .6 });
  S('dg_lstab', 'Needle Stabs', 'dg_lstab', 9, { reach: 2.3, arc: 70, multi: .06, move: .8 });
  S('dg_lspin', 'Low Thorn Spin', 'dg_lspin', 18, { reach: 2.4, arc: 360, multi: .13, pop: 3.2, move: .5 });
  S('dg_lshadow', 'Shadow Cyclone', 'dg_lshadow', 10, { reach: 2.6, arc: 360, multi: .08, move: 3, fixedMove: true, pop: 3.2, cost: 22 });
  D('dg_ldart', 'Shadow Step', 'dg_dart', { dmg: 20, move: 5 });
  S('dg_whirl', 'Thorn Whirl', 'dg_whirl', 16, { reach: 2.6, arc: 360, multi: .1, move: 1.8, heavy: true, cost: 20, kb: -2 });
  D('dg_heavyH', 'Magpie Dive', 'dg_vault', { dmg: 88, ki: 52, poise: 32, heavy: true, cost: 22, move: 3.6, aoe: 1.9 });
  D('dg_heavyL', 'Shadow Dash', 'dg_dart', { dmg: 26, move: 6, heavy: true, cost: 18, multi: .1 });
  S('dg_rise', 'Swallow Rise', 'dg_rise', 42, { reach: 2.4, arc: 140, pop: 9.5, fin: true, heavy: true, cost: 14, move: .8 });
  S('dg_fin2', 'Briar Cyclone', 'dg_fin2', 16, { reach: 2.7, arc: 360, multi: .1, kb: -2.5, pop: 4, fin: true, heavy: true, cost: 18, move: 1.2 });
  S('dg_thousand', 'Thousand Thorns', 'dg_thousand', 9, { reach: 2.4, arc: 90, multi: .05, last: 4, fin: true, heavy: true, cost: 22, move: 1.0, wave: { len: 8, speed: 20, w: 1.1, dmg: 1.5, color: 0xb8f0c8, at: .95 } });
  D('dg_run', 'Running Thorn', 'dg_slash', { dmg: 26, move: 3.2, fixedMove: true });
  D('dg_dash', 'Dash Cut', 'dg_rev', { dmg: 28, move: 1.8 });
  D('dg_slide', 'Sliding Thorns', 'dg_lspin', { speed: 1.25, move: 2.6, fixedMove: true, cost: 8 });
  D('dg_sw', 'Switch Strike', 'dg_spin', { dmg: 22, cost: 6 });
  kit('daggers', {
    heavy: { high: 'dg_heavyH', mid: 'dg_whirl', low: 'dg_heavyL' }, run: 'dg_run', dash: 'dg_dash', switch: 'dg_sw',
    fin: ['dg_rise', 'dg_fin2', 'dg_thousand'], slide: 'dg_slide', air: airChain('dg', ['dg_slash', 'dg_rev', 'dg_spin']),
    forms: {
      high: { name: 'Magpie', neutral: ['dg_hcross', 'dg_hstab', 'dg_hspin'], forward: ['dg_vault', 'dg_hcross', 'dg_hspin'], pause: 'dg_hrain' },
      mid: { name: 'Needlework', neutral: ['dg_slash', 'dg_rev', 'dg_stab', 'dg_spin'], forward: ['dg_dart', 'dg_rev', 'dg_stab'], pause: 'dg_hundred' },
      low: { name: 'Shadow Step', neutral: ['dg_lslice', 'dg_lstab', 'dg_lspin'], forward: ['dg_ldart', 'dg_lslice', 'dg_lstab'], pause: 'dg_lshadow' },
    },
  });
}

// ==================================================================== Twin Hatchets (Machetes, Hatchets)
// A woodsman's rhythm: right chop, left chop, both at once; the bearded heads hook foes in; a wheel with
// both arms out; and in each stance a heavy that throws them.
{
  const E = { ...PAIR_END, ...REC }, EH = { ...PAIR_HIGH, ...REC }, EL = { ...PAIR_LOW, ...LOWREC };
  const rChop = o => chop({ two: 0, yaw: .15, a: -.1, lead: { lhX: .35, lhY: -.1, lhZ: .1, lbYaw: 1.6, lbPitch: .3 }, ...o });
  const lChop = (o = {}) => withKeys(act0(o.dur || .6, [K(0, { ...PAIR_END, chestRy: .35, ...LUNGE }), K(o.t?.[1] ?? .3, { chestRy: -.25, chestRx: .4, ...DEEP }), K(o.dur || .6, o.end || E)]), offchop({ t: o.t || [.16, .3, .4] }), o.hit || [.26, .42]);
  anims({
    ht_chopR: rChop({ dur: .6, t: [.16, .3, .4], legs: DEEP, end: E }),
    ht_chopL: lChop({ dur: .6, t: [.16, .3, .4] }),
    ht_twin: withKeys(chop({ dur: .78, two: 0, yaw: .1, t: [.24, .38, .48], end: EH }), offchop({ t: [.24, .38, .48] }), [.33, .5]),
    ht_hook: withKeys(cut({ dur: .6, s: -1, h0: .1, h1: -.05, t: [.12, .22, .32], end: E }), offcut({ s: -1, at: .26, len: .12 }), [.14, .38]),
    ht_wheel: whirl({ dur: .8, h: 0, t: [.12, .6], off: true, r: .5, end: E }),
    ht_rush: withKeys(cut({ dur: .6, s: 1, t: [.16, .24, .32], lead: { lift: -.2, chestRx: .45, thLx: -1.0, knL: .8, thRx: .9, knR: .4, wings: 1.8 }, end: E }), offcut({ s: -1, at: .3, len: .12 }), [.18, .42]),
    ht_hleap: withKeys(chop({ dur: 1.0, two: 0, hop: .35, yaw: .1, t: [.3, .52, .62], end: EH }), offchop({ t: [.3, .52, .62] }), [.47, .64]),
    ht_lhack: withKeys(cut({ dur: .5, s: 1, h0: -.26, h1: -.3, p0: -.3, p1: -.4, t: [.08, .15, .24], legs: CROUCH, end: EL }), offcut({ s: -1, h0: -.3, h1: -.32, p0: -.3, p1: -.4, at: .22, len: .12 }), [.1, .36]),
    ht_lhook: withKeys(cut({ dur: .56, s: -1, h0: -.3, h1: -.1, p0: -.4, p1: 0, t: [.1, .18, .28], legs: CROUCH, end: EL }), offcut({ s: -1, h0: -.3, h1: -.2, at: .24, len: .12 }), [.12, .38]),
    ht_lwheel: whirl({ dur: .82, h: -.3, p: -.25, low: .14, t: [.12, .6], off: true, r: .5, end: EL }),
    ht_ldart: withKeys(cut({ dur: .56, s: 1, h0: -.25, h1: -.25, p0: -.3, p1: -.3, t: [.1, .18, .28], lead: { lift: -.28, chestRx: .5, thLx: -1.1, knL: .8, thRx: 1.0, knR: .4, wings: 2 }, end: EL }), offcut({ s: -1, h0: -.28, h1: -.3, at: .26, len: .12 }), [.1, .4]),
    ht_rise: withKeys(upcut({ dur: .66, two: 0, t: [.14, .24, .32], jump: .15, end: EH }), mirror(upcut({ dur: .66, two: 0, t: [.14, .24, .32], jump: .15 }), { delay: .04 }), [.16, .38]),
  });
  anims({
    ht_kindling: string([ACTIONS.ht_chopR, ACTIONS.ht_chopL, ACTIONS.ht_chopR, ACTIONS.ht_twin], E, .3),
    ht_hsplit: string([ACTIONS.ht_twin, ACTIONS.ht_hook, ACTIONS.ht_hleap], EH, .3),
    ht_timber: whirl({ dur: 1.2, turns: 2, h: -.28, p: -.25, low: .14, t: [.14, .96], off: true, r: .5, end: EL }),
    ht_fin2: whirl({ dur: 1.05, turns: 2, h: .05, rise: .3, t: [.14, .82], off: true, r: .5, end: EH }),
  });
  S('ht_chopR', 'Right Chop', 'ht_chopR', 36, { reach: 2.3, arc: 90, move: .8 });
  S('ht_chopL', 'Left Chop', 'ht_chopL', 36, { reach: 2.3, arc: 90, move: .8 });
  S('ht_twin', 'Twin Chop', 'ht_twin', 54, { reach: 2.3, arc: 100, move: .9, aoe: 1.4, aoeAt: 1.2 });
  S('ht_hook', 'Bearded Hook', 'ht_hook', 32, { reach: 2.4, arc: 160, multi: .14, kb: -3, move: .6 });
  S('ht_wheel', "Woodsman's Wheel", 'ht_wheel', 34, { reach: 2.5, arc: 360, kb: 4, move: .5 });
  S('ht_rush', 'Felling Rush', 'ht_rush', 30, { reach: 2.3, arc: 150, multi: .14, move: 3.4, fixedMove: true });
  S('ht_hleap', 'Splitting Leap', 'ht_hleap', 60, { reach: 2.3, arc: 110, move: 3.0, fixedMove: true, aoe: 2.0, aoeAt: 1.4, pop: 3.2 });
  S('ht_lhack', 'Root Hack', 'ht_lhack', 26, { reach: 2.3, arc: 170, multi: .13, pop: 3.2, move: .6 });
  S('ht_lhook', 'Ankle Hook', 'ht_lhook', 28, { reach: 2.4, arc: 160, multi: .13, kb: -3, move: .6 });
  S('ht_lwheel', 'Root Wheel', 'ht_lwheel', 30, { reach: 2.5, arc: 360, pop: 3.2, move: .5 });
  S('ht_ldart', 'Low Felling', 'ht_ldart', 26, { reach: 2.3, arc: 150, multi: .15, move: 4, fixedMove: true, pass: true });
  S('ht_kindling', 'Kindling', 'ht_kindling', 28, { reach: 2.4, arc: 110, multi: .3, last: 1.8, cost: 22, move: 1.4 });
  S('ht_hsplit', 'Splitting Storm', 'ht_hsplit', 40, { reach: 2.4, arc: 130, multi: .38, last: 1.5, cost: 24, move: 1.8, aoe: 1.8, aoeAt: 1.3 });
  S('ht_timber', 'Timber Wheel', 'ht_timber', 16, { reach: 2.6, arc: 360, multi: .12, move: 2.6, fixedMove: true, pop: 3.2, cost: 22 });
  S('ht_rise', 'Splitting Rise', 'ht_rise', 48, { reach: 2.4, arc: 140, pop: 9.5, fin: true, heavy: true, cost: 15 });
  S('ht_fin2', 'Hatchet Cyclone', 'ht_fin2', 20, { reach: 2.7, arc: 360, multi: .12, kb: -2.5, fin: true, heavy: true, cost: 18, move: 1.2 });
  D('ht_fin3', 'Woodpile', 'ht_twin', { dmg: 110, ki: 70, poise: 44, fin: true, heavy: true, cost: 22, aoe: 2.2, wave: { len: 9, speed: 18, w: 1.1, dmg: .8, color: 0xffc890 } });
  D('ht_run', 'Running Chop', 'ht_rush', { dmg: 34 });
  D('ht_dash', 'Dash Hook', 'ht_hook', { dmg: 36, move: 1.8 });
  D('ht_slide', 'Sliding Wheel', 'ht_lwheel', { speed: 1.25, move: 2.6, fixedMove: true, cost: 9 });
  D('ht_sw', 'Switch Strike', 'ht_wheel', { dmg: 36, cost: 6 });
  kit('hatchets', {
    heavy: { high: 'ht_hurl', mid: 'ht_hurl', low: 'ht_hurl' }, run: 'ht_run', dash: 'ht_dash', switch: 'ht_sw',
    fin: ['ht_rise', 'ht_fin2', 'ht_fin3'], slide: 'ht_slide', air: airChain('ht', ['ht_chopR', 'ht_chopL', 'ht_wheel']),
    forms: {
      high: { name: 'Woodsplitter', neutral: ['ht_twin', 'ht_hook', 'ht_rise'], forward: ['ht_hleap', 'ht_twin'], pause: 'ht_hsplit' },
      mid: { name: 'Chopping Dance', neutral: ['ht_chopR', 'ht_chopL', 'ht_hook', 'ht_wheel'], forward: ['ht_rush', 'ht_chopL', 'ht_wheel'], pause: 'ht_kindling' },
      low: { name: 'Root Cutter', neutral: ['ht_lhack', 'ht_lhook', 'ht_lwheel'], forward: ['ht_ldart', 'ht_lhack', 'ht_lhook'], pause: 'ht_timber' },
    },
  });
}

// ==================================================================== Briar Chain (Whips, Kusarigama)
// One hand swings the chain, the sickle at its end: long lashes both ways, a crack from overhead, the sickle
// snapped out straight and hauled back, the chain whirled overhead and wheeled at the side.
{
  const E = { ...POLE_END, ...REC }, EH = { ...POLE_HIGH, ...REC }, EL = { ...POLE_LOW, ...LOWREC };
  const OFF = { lhX: .3, lhY: -.1, lhZ: .22 };
  anims({
    ch_lash: cut({ dur: .62, s: 1, two: 0, h0: .15, h1: 0, p0: .3, p1: -.05, t: [.14, .24, .34], lead: OFF, end: E }),
    ch_back: cut({ dur: .62, s: -1, two: 0, h0: 0, h1: .15, p0: -.05, p1: .3, t: [.14, .24, .34], lead: OFF, end: E }),
    ch_crack: chop({ dur: .72, two: 0, yaw: 0, t: [.2, .32, .42], legs: DEEP, lead: OFF, low: { hiltH: -.12, bladePitch: -.3 }, end: E }),
    ch_snap: thrust({ dur: .66, h: .12, reach: .6, t: [.12, .2, .36], lead: OFF, out: { lhX: .38, lhY: -.1, lhZ: -.1 }, end: E }),
    ch_wheel: whirl({ dur: .86, h: .1, p: .15, t: [.14, .62], r: .5, lead: OFF, end: E }),
    ch_heli: twirl({ dur: 1.0, turns: 2, h: .52, pitch: .1, t: [.14, .78], lead: OFF, end: EH }),
    ch_mill: windmill({ dur: .9, turns: 2, a: -.9, h: .05, r: .45, yaw: 0, t: [.12, .72], lead: OFF, end: E }),
    ch_hcross: cut({ dur: .7, s: 1, two: 0, h0: .5, h1: -.25, p0: 1.0, p1: -.6, t: [.18, .28, .38], lead: OFF, fol: { ...DEEP }, end: EH }),
    ch_leap: chop({ dur: .95, two: 0, hop: .3, t: [.3, .5, .6], lead: OFF, low: { hiltH: -.12, bladePitch: -.3 }, end: EH }),
    ch_llash: cut({ dur: .6, s: 1, two: 0, h0: -.28, h1: -.3, p0: -.25, p1: -.3, t: [.12, .22, .32], legs: CROUCH, lead: OFF, end: EL }),
    ch_lsnap: thrust({ dur: .6, h: -.2, reach: .58, t: [.1, .18, .32], lead: { ...OFF, lift: -.2 }, legs: { ...DEEP, lift: -.3 }, end: EL }),
    ch_lwheel: whirl({ dur: .86, h: -.3, p: -.25, low: .14, t: [.14, .62], r: .5, lead: OFF, end: EL }),
    ch_rise: upcut({ dur: .7, two: 0, t: [.16, .26, .36], jump: .1, lead: OFF, end: EH }),
  });
  anims({
    ch_dance: string([ACTIONS.ch_lash, ACTIONS.ch_back, whirl({ dur: 1.0, turns: 2, h: .1, t: [.1, .76], r: .5 })], E, .3),
    ch_hstorm: string([ACTIONS.ch_heli, ACTIONS.ch_crack], EH, .3),
    ch_lvine: whirl({ dur: 1.25, turns: 3, h: -.3, p: -.25, low: .14, t: [.14, 1.02], r: .5, lead: OFF, end: EL }),
    ch_fin2: twirl({ dur: 1.15, turns: 3, h: .5, pitch: .05, t: [.12, .92], lead: OFF, end: EH }),
  });
  S('ch_lash', 'Lash', 'ch_lash', 40, { reach: 3.3, arc: 200, kb: -1.5, move: .5 });
  S('ch_back', 'Backlash', 'ch_back', 40, { reach: 3.3, arc: 200, kb: -1.5, move: .5 });
  S('ch_crack', 'Overhead Crack', 'ch_crack', 54, { reach: 3.4, arc: 50, move: .6 });
  S('ch_snap', 'Snapping Sickle', 'ch_snap', 44, { reach: 3.5, arc: 40, kb: -4, move: .4 });
  S('ch_wheel', 'Chain Wheel', 'ch_wheel', 42, { reach: 3.3, arc: 360, move: .4 });
  S('ch_mill', 'Chain Windmill', 'ch_mill', 22, { reach: 3.0, arc: 120, multi: .15, pop: 3.2, move: 1.4 });
  S('ch_dance', 'Briar Dance', 'ch_dance', 30, { reach: 3.3, arc: 360, multi: .26, last: 1.8, kb: -2, cost: 22, move: .8 });
  S('ch_hcross', 'Falling Sickle', 'ch_hcross', 56, { reach: 3.3, arc: 130, move: .7 });
  S('ch_heli', 'Overhead Whirl', 'ch_heli', 26, { reach: 3.4, arc: 360, multi: .16, kb: -2, move: .4 });
  S('ch_leap', 'Leaping Crack', 'ch_leap', 62, { reach: 3.3, arc: 60, move: 2.6, fixedMove: true, aoe: 1.8, aoeAt: 2.6 });
  S('ch_hstorm', 'Thorn Storm', 'ch_hstorm', 30, { reach: 3.4, arc: 360, multi: .2, last: 2.2, kb: -3, cost: 24, heavy: true, move: .6 });
  S('ch_llash', 'Ankle Lash', 'ch_llash', 36, { reach: 3.3, arc: 200, pop: 3.2, move: .5 });
  S('ch_lsnap', 'Low Snap', 'ch_lsnap', 40, { reach: 3.5, arc: 40, kb: -4, move: .5 });
  S('ch_lwheel', 'Creeping Wheel', 'ch_lwheel', 38, { reach: 3.3, arc: 360, pop: 3.2, move: .4 });
  S('ch_lvine', 'Strangling Vine', 'ch_lvine', 20, { reach: 3.3, arc: 360, multi: .12, kb: -3, move: 2.4, fixedMove: true, cost: 22 });
  D('ch_lrun', 'Running Snap', 'ch_lsnap', { dmg: 44, move: 3, fixedMove: true });
  D('ch_hgrab', 'Hanging Sickle', 'ch_leap', { dmg: 100, ki: 64, poise: 40, kb: -6, heavy: true, charge: .22, cost: 26 });
  D('ch_haul', 'Grappling Haul', 'ch_snap', { dmg: 64, ki: 50, poise: 30, kb: -9, heavy: true, charge: .1, cost: 20, reach: 3.8 });
  D('ch_lhaul', 'Ankle Haul', 'ch_lsnap', { dmg: 58, ki: 46, poise: 30, kb: -9, pop: 3.2, heavy: true, charge: .1, cost: 18, reach: 3.8 });
  S('ch_rise', 'Hooked Rise', 'ch_rise', 62, { reach: 3.2, arc: 110, pop: 9.5, fin: true, heavy: true, cost: 18 });
  S('ch_fin2', 'Briar Wheel', 'ch_fin2', 28, { reach: 3.5, arc: 360, multi: .14, kb: -4, fin: true, heavy: true, cost: 24, move: .4 });
  D('ch_fin3', 'Thorn Spear', 'ch_snap', { dmg: 110, ki: 66, poise: 40, fin: true, heavy: true, cost: 24, reach: 3.8, move: 1.4, wave: { len: 12, speed: 26, w: .8, dmg: .8, color: 0xb0e080, at: .2 } });
  D('ch_run', 'Running Lash', 'ch_lash', { dmg: 44, move: 3, fixedMove: true });
  D('ch_dash', 'Dash Lash', 'ch_back', { dmg: 44, move: 1.6 });
  D('ch_slide', 'Sliding Wheel', 'ch_lwheel', { speed: 1.25, move: 2.6, fixedMove: true, cost: 11 });
  D('ch_sw', 'Switch Strike', 'ch_wheel', { dmg: 48, cost: 8 });
  kit('chain', {
    heavy: { high: 'ch_hgrab', mid: 'ch_haul', low: 'ch_lhaul' }, run: 'ch_run', dash: 'ch_dash', switch: 'ch_sw',
    fin: ['ch_rise', 'ch_fin2', 'ch_fin3'], slide: 'ch_slide', air: airChain('ch', ['ch_lash', 'ch_back', 'ch_wheel']),
    forms: {
      high: { name: 'Hanging Thorn', neutral: ['ch_crack', 'ch_hcross', 'ch_heli'], forward: ['ch_leap', 'ch_crack', 'ch_heli'], pause: 'ch_hstorm' },
      mid: { name: 'Briar Dance', neutral: ['ch_lash', 'ch_back', 'ch_snap', 'ch_wheel'], forward: ['ch_snap', 'ch_lash', 'ch_mill'], pause: 'ch_dance' },
      low: { name: 'Creeping Vine', neutral: ['ch_llash', 'ch_lsnap', 'ch_lwheel'], forward: ['ch_lrun', 'ch_llash', 'ch_lwheel'], pause: 'ch_lvine' },
    },
  });
}

// ==================================================================== Harvest Moon (Scythes)
// Both hands on the long haft: every sweep reaps toward the knight, dragging foes in; hooking chops; wheels
// that turn the crescent all the way round.
{
  const E = { ...POLE_END, ...REC }, EH = { ...POLE_HIGH, ...REC }, EL = { ...POLE_LOW, ...LOWREC };
  anims({
    sc_reap: cut({ dur: .8, s: 1, two: 1, h0: .12, h1: -.1, p0: .15, p1: -.25, t: [.2, .32, .44], legs: LUNGE_R, fol: { ...DEEP }, end: E }),
    sc_return: cut({ dur: .78, s: -1, two: 1, h0: -.1, h1: .12, p0: -.25, p1: .15, t: [.2, .32, .44], end: E }),
    sc_hook: chop({ dur: .84, two: 1, yaw: .35, a: -.25, t: [.26, .4, .5], end: E }),
    sc_spin: whirl({ dur: .9, two: 1, h: .05, t: [.16, .66], r: .46, end: E }),
    sc_hcross: cut({ dur: .82, s: 1, two: 1, h0: .55, h1: -.3, p0: 1.0, p1: -.7, t: [.22, .34, .46], fol: { ...DEEP }, end: EH }),
    sc_hrise: cut({ dur: .82, s: -1, two: 1, h0: -.3, h1: .55, p0: -.6, p1: 1.1, t: [.22, .34, .46], legs: CROUCH, fol: { ...LUNGE, lift: .05 }, end: EH }),
    sc_hleap: chop({ dur: 1.05, two: 1, hop: .35, yaw: .3, t: [.32, .54, .64], end: EH }),
    sc_lreap: cut({ dur: .72, s: 1, two: 1, h0: -.3, h1: -.32, p0: -.4, p1: -.45, t: [.16, .28, .38], legs: CROUCH, end: EL }),
    sc_lspin: whirl({ dur: .9, two: 1, h: -.3, p: -.3, low: .14, t: [.16, .66], end: EL }),
    sc_lflick: upcut({ dur: .7, t: [.16, .28, .36], end: EL }),
    sc_rise: upcut({ dur: .78, t: [.18, .3, .4], jump: .2, end: EH }),
  });
  anims({
    sc_dance: string([ACTIONS.sc_reap, ACTIONS.sc_return, whirl({ dur: 1.0, turns: 1, two: 1, h: .05, t: [.12, .64] })], E, .35),
    sc_hmoon: string([whirl({ dur: .9, two: 1, h: .15, p: .3, rise: .3, t: [.12, .66] }), chop({ two: 1, yaw: .3, t: [.12, .26, .36] })], EH, .4),
    sc_lthresh: whirl({ dur: 1.3, turns: 3, two: 1, h: -.3, p: -.3, low: .14, t: [.16, 1.06], end: EL }),
    sc_fin2: whirl({ dur: 1.2, turns: 2, two: 1, h: .05, rise: .2, t: [.16, .9], end: E }),
  });
  S('sc_reap', 'Reaping Sweep', 'sc_reap', 50, { reach: 3.3, arc: 200, kb: -3, move: .6 });
  S('sc_return', 'Return Reap', 'sc_return', 50, { reach: 3.3, arc: 200, kb: -3, move: .6 });
  S('sc_hook', 'Harvest Hook', 'sc_hook', 64, { reach: 3.3, arc: 80, kb: -4, move: .9 });
  S('sc_spin', 'Crescent Wheel', 'sc_spin', 54, { reach: 3.3, arc: 360, kb: -2, move: .4 });
  S('sc_dance', 'Harvest Dance', 'sc_dance', 40, { reach: 3.4, arc: 360, multi: .5, last: 1.6, kb: -3, cost: 24, move: 1.2 });
  S('sc_hcross', 'Falling Crescent', 'sc_hcross', 64, { reach: 3.3, arc: 140, move: .8 });
  S('sc_hrise', 'Rising Crescent', 'sc_hrise', 60, { reach: 3.2, arc: 140, pop: 6.5, move: .8 });
  S('sc_hleap', 'Leaping Reap', 'sc_hleap', 72, { reach: 3.2, arc: 110, move: 3.0, fixedMove: true, aoe: 2.2, aoeAt: 2.2, kb: -3 });
  S('sc_hmoon', "Reaper's Moon", 'sc_hmoon', 48, { reach: 3.4, arc: 360, multi: .44, last: 1.8, kb: -3, pop: 4, cost: 26, heavy: true, move: 1.0, aoe: 2.4, aoeAt: 2.2 });
  S('sc_lreap', 'Gleaning Sweep', 'sc_lreap', 44, { reach: 3.3, arc: 200, pop: 3.2, kb: -2, move: .5 });
  S('sc_lspin', 'Gleaning Wheel', 'sc_lspin', 46, { reach: 3.3, arc: 360, pop: 3.2, move: .4 });
  S('sc_lflick', 'Stubble Flick', 'sc_lflick', 44, { reach: 3.2, arc: 90, pop: 6.5, move: .6 });
  S('sc_lthresh', 'Threshing Wheel', 'sc_lthresh', 26, { reach: 3.3, arc: 360, multi: .14, kb: -3, pop: 3.2, move: 2.6, fixedMove: true, cost: 22 });
  D('sc_lrun', 'Running Reap', 'sc_lreap', { dmg: 50, move: 3.2, fixedMove: true });
  D('sc_heavyH', 'Moon Reaper', 'sc_hleap', { dmg: 124, ki: 82, poise: 50, heavy: true, charge: .24, cost: 32, aoe: 3.0 });
  D('sc_heavyM', 'Great Crescent', 'sc_fin2', { dmg: 60, ki: 40, poise: 26, multi: .36, kb: -4, heavy: true, charge: .14, cost: 28 });
  D('sc_heavyL', 'Hooking Rush', 'sc_lreap', { dmg: 76, ki: 48, poise: 28, move: 5, fixedMove: true, kb: -5, heavy: true, charge: .1, cost: 20 });
  S('sc_rise', 'Harvest Rise', 'sc_rise', 66, { reach: 3.3, arc: 110, pop: 9.5, fin: true, heavy: true, cost: 18 });
  S('sc_fin2', 'Harvest Wheel', 'sc_fin2', 40, { reach: 3.5, arc: 360, multi: .36, kb: -4, fin: true, heavy: true, cost: 24, move: .6 });
  D('sc_fin3', 'Last Harvest', 'sc_hook', { dmg: 120, ki: 70, poise: 44, fin: true, heavy: true, cost: 26, wave: { len: 11, speed: 20, w: 1.1, dmg: .8, color: 0xe0d0ff } });
  D('sc_run', 'Running Reap', 'sc_reap', { dmg: 54, move: 3.2, fixedMove: true });
  D('sc_dash', 'Dash Reap', 'sc_return', { dmg: 52, move: 1.6 });
  D('sc_slide', 'Sliding Wheel', 'sc_lspin', { speed: 1.25, move: 2.6, fixedMove: true, cost: 11 });
  D('sc_sw', 'Switch Strike', 'sc_spin', { dmg: 58, cost: 8 });
  kit('scythe', {
    heavy: { high: 'sc_heavyH', mid: 'sc_heavyM', low: 'sc_heavyL' }, run: 'sc_run', dash: 'sc_dash', switch: 'sc_sw',
    fin: ['sc_rise', 'sc_fin2', 'sc_fin3'], slide: 'sc_slide', air: airChain('sc', ['sc_reap', 'sc_return', 'sc_spin']),
    forms: {
      high: { name: 'Grim Harvest', neutral: ['sc_hook', 'sc_hcross', 'sc_hrise'], forward: ['sc_hleap', 'sc_hcross', 'sc_hrise'], pause: 'sc_hmoon' },
      mid: { name: 'Sickle Moon', neutral: ['sc_reap', 'sc_return', 'sc_hook', 'sc_spin'], forward: ['sc_run', 'sc_return', 'sc_spin'], pause: 'sc_dance' },
      low: { name: 'Gleaner', neutral: ['sc_lreap', 'sc_lspin', 'sc_lflick'], forward: ['sc_lrun', 'sc_lreap', 'sc_lflick'], pause: 'sc_lthresh' },
    },
  });
}

// ==================================================================== Wolf Claws (Claws)
// Rakes, not punches: each hand tears across and down, then both at once; a pounce from range, a spinning
// rend, and gutting hooks up from a crouch.
{
  const E = { ...FIST_END, ...STAND }, EH = { ...FIST_HIGH, ...STAND }, EL = { ...FIST_LOW, ...LOWSTAND };
  const both = (o, l = {}) => { const R = rake({ hand: 'R', ...o }), L = rake({ hand: 'L', chest: false, ...o, ...l }); return withKeys(R, L.keys.slice(0, -1), [R.hit[0], Math.max(R.hit[1], L.hit[1])]); };
  anims({
    cl_rakeR: rake({ dur: .42, hand: 'R', h0: .32, h1: -.18, t: [.07, .14, .22], end: E }),
    cl_rakeL: rake({ dur: .42, hand: 'L', h0: .32, h1: -.18, t: [.07, .14, .22], legs: LUNGE_R, end: E }),
    cl_twin: both({ dur: .56, s: 1, h0: .5, h1: -.28, t: [.12, .2, .3], legs: DEEP, end: E }, { s: -1 }),
    cl_upper: rake({ dur: .5, hand: 'R', s: 1, h0: -.3, h1: .5, t: [.1, .18, .28], legs: CROUCH, end: EH }),
    cl_spin: whirl({ dur: .7, h: .08, t: [.1, .52], off: true, r: .5, end: E }),
    cl_pounce: { dur: .74, hit: [.36, .48], keys: [
      K(0, { ...FIST_END, lift: -.22, chestRx: .4, thLx: -.8, knL: 1.1, thRx: .4, knR: 1.0 }),
      K(.16, { lift: .45, chestRx: -.25, hiltA: -.5, hiltR: .3, hiltH: .5, lhX: .3, lhY: .5, lhZ: .2, thLx: -1.1, knL: 1.5, thRx: -.2, knR: 1.3, wings: 2.2 }),
      K(.3, { lift: .4 }),
      K(.42, { lift: -.26, chestRx: .6, hiltA: -.1, hiltR: .55, hiltH: -.2, lhX: .1, lhY: -.2, lhZ: .55, thLx: -1, knL: 1.3, thRx: .7, knR: 1.1, wings: 1 }),
      K(.74, EH),
    ] },
    cl_lrakeR: rake({ dur: .42, hand: 'R', h0: -.1, h1: -.32, t: [.07, .14, .22], legs: CROUCH, end: EL }),
    cl_lrakeL: rake({ dur: .42, hand: 'L', h0: -.1, h1: -.32, t: [.07, .14, .22], legs: CROUCH, end: EL }),
    cl_gut: both({ dur: .6, s: 1, h0: -.32, h1: .35, t: [.12, .2, .3], legs: CROUCH, end: EL }, { s: -1 }),
    cl_hspin: whirl({ dur: .8, h: .2, p: .3, rise: .35, t: [.1, .6], off: true, r: .5, end: EH }),
  });
  anims({
    cl_hrake: shift(ACTIONS.cl_twin, { hiltH: .08, lhY: .08 }),
    cl_frenzy: string([ACTIONS.cl_rakeR, ACTIONS.cl_rakeL, ACTIONS.cl_rakeR, ACTIONS.cl_rakeL, ACTIONS.cl_twin], E, .3),
    cl_hrend: string([ACTIONS.cl_upper, ACTIONS.cl_hspin, ACTIONS.cl_twin], EH, .3),
    cl_lstorm: whirl({ dur: 1.1, turns: 2, h: -.25, p: -.2, low: .14, t: [.12, .9], off: true, r: .5, end: EL }),
    cl_fin2: whirl({ dur: 1.0, turns: 2, h: .1, rise: .3, t: [.12, .8], off: true, r: .5, end: EH }),
  });
  S('cl_rakeR', 'Right Rake', 'cl_rakeR', 22, { reach: 2.0, arc: 130, move: .6 });
  S('cl_rakeL', 'Left Rake', 'cl_rakeL', 22, { reach: 2.0, arc: 130, move: .6 });
  S('cl_twin', 'Twin Rend', 'cl_twin', 36, { reach: 2.0, arc: 110, move: .8 });
  S('cl_upper', 'Rising Rake', 'cl_upper', 30, { reach: 2.0, arc: 100, pop: 7, move: .6 });
  S('cl_spin', 'Rake Spin', 'cl_spin', 24, { reach: 2.2, arc: 360, multi: .14, move: .5 });
  S('cl_pounce', 'Pounce', 'cl_pounce', 40, { reach: 2.1, arc: 100, move: 3.6, fixedMove: true, pop: 3.2 });
  S('cl_frenzy', 'Thousand Rends', 'cl_frenzy', 20, { reach: 2.1, arc: 120, multi: .2, last: 2, cost: 20, move: 1.2 });
  S('cl_hrake', 'Falling Rend', 'cl_hrake', 38, { reach: 2.0, arc: 110, move: .8 });
  S('cl_hspin', 'Rising Rend', 'cl_hspin', 22, { reach: 2.2, arc: 360, multi: .14, pop: 5, move: .5 });
  S('cl_hrend', 'Rending Moon', 'cl_hrend', 24, { reach: 2.2, arc: 360, multi: .2, last: 2, pop: 4, cost: 20, move: 1.0 });
  S('cl_lrakeR', 'Belly Rake', 'cl_lrakeR', 20, { reach: 2.0, arc: 130, move: .6 });
  S('cl_lrakeL', 'Low Rake', 'cl_lrakeL', 20, { reach: 2.0, arc: 130, move: .6 });
  S('cl_gut', 'Gutting Hooks', 'cl_gut', 32, { reach: 2.0, arc: 110, pop: 6, move: .7 });
  S('cl_lstorm', 'Rake Storm', 'cl_lstorm', 12, { reach: 2.3, arc: 360, multi: .09, move: 2.4, fixedMove: true, pop: 3.2, cost: 20 });
  S('cl_lslide', 'Sliding Rake', 'x_slide', 28, { reach: 2.1, arc: 90, move: 3.4, fixedMove: true, pop: 3.2, hit: [.1, .4], dur: .6 });
  D('cl_lunge', 'Lunging Rake', 'cl_rakeR', { dmg: 28, move: 2.4, fixedMove: true });
  D('cl_heavyH', 'Pouncing Rend', 'cl_pounce', { dmg: 76, ki: 56, poise: 28, heavy: true, charge: .1, cost: 18, aoe: 1.8, aoeAt: 1.2 });
  D('cl_heavyM', 'Charging Rend', 'cl_twin', { dmg: 70, ki: 60, poise: 28, heavy: true, charge: .08, cost: 16, move: 1.6, kb: 8 });
  D('cl_heavyL', 'Gutting Rend', 'cl_gut', { dmg: 64, ki: 64, poise: 30, heavy: true, charge: .08, cost: 16, pop: 8 });
  D('cl_fin1', 'Rending Rise', 'cl_upper', { dmg: 54, ki: 44, poise: 24, pop: 9.5, fin: true, heavy: true, cost: 12 });
  S('cl_fin2', 'Rake Cyclone', 'cl_fin2', 18, { reach: 2.4, arc: 360, multi: .1, kb: 6, fin: true, heavy: true, cost: 14, move: .8 });
  D('cl_fin3', "Wolf's Frenzy", 'cl_frenzy', { dmg: 26, fin: true, heavy: true, cost: 18, wave: { len: 7, speed: 20, w: 1.3, dmg: .9, color: 0xff9a9a, at: 1.6 } });
  D('cl_run', 'Running Rake', 'cl_rakeR', { dmg: 30, move: 3.2, fixedMove: true });
  D('cl_dash', 'Dash Rake', 'cl_rakeL', { dmg: 30, move: 1.8 });
  D('cl_slide', 'Sliding Rake', 'cl_lslide', { move: 2.6, cost: 8 });
  D('cl_sw', 'Switch Strike', 'cl_spin', { dmg: 28, cost: 5 });
  kit('claws', {
    heavy: { high: 'cl_heavyH', mid: 'cl_heavyM', low: 'cl_heavyL' }, run: 'cl_run', dash: 'cl_dash', switch: 'cl_sw',
    fin: ['cl_fin1', 'cl_fin2', 'cl_fin3'], slide: 'cl_slide', air: airChain('cl', ['cl_rakeR', 'cl_rakeL', 'cl_spin']),
    forms: {
      high: { name: 'Pounce', neutral: ['cl_hrake', 'cl_upper', 'cl_hspin'], forward: ['cl_pounce', 'cl_upper', 'cl_hrake'], pause: 'cl_hrend' },
      mid: { name: 'Rending Moon', neutral: ['cl_rakeR', 'cl_rakeL', 'cl_twin', 'cl_spin'], forward: ['cl_lunge', 'cl_rakeL', 'cl_twin'], pause: 'cl_frenzy' },
      low: { name: 'Belly Rake', neutral: ['cl_lrakeR', 'cl_lrakeL', 'cl_gut'], forward: ['cl_lslide', 'cl_lrakeR', 'cl_gut'], pause: 'cl_lstorm' },
    },
  });
}

// ==================================================================== Grinder's Wheel (Assault Saw)
// The spinning wheel does the work: it is driven in and held there. Rams that keep grinding, a press
// straight down into the ground, sweeps, and a top that grinds its way through a crowd.
{
  const E = { ...GREAT_END, ...REC }, EH = { ...GREAT_HIGH, ...REC }, EL = { ...GREAT_LOW, ...LOWREC };
  anims({
    gw_sweep: cut({ dur: .8, s: 1, two: 1, h0: .05, h1: 0, t: [.2, .32, .5], fol: { ...DEEP }, end: E }),
    gw_back: cut({ dur: .8, s: -1, two: 1, h0: 0, h1: .05, t: [.2, .32, .5], end: E }),
    gw_ram: thrust({ dur: .9, two: 1, h: .02, reach: .5, t: [.16, .26, .6], lead: { wings: 1.4 }, out: { wings: 1.8 }, end: E }),
    gw_top1: whirl({ dur: .95, two: 1, h: 0, t: [.18, .72], end: E }),
    gw_hpress: chop({ dur: 1.05, two: 1, yaw: .2, t: [.26, .4, .5], end: EH }),
    gw_hcross: cut({ dur: .85, s: 1, two: 1, h0: .5, h1: -.3, p0: .95, p1: -.7, t: [.22, .34, .5], fol: { ...DEEP }, end: EH }),
    gw_hleap: chop({ dur: 1.15, two: 1, hop: .35, yaw: .2, t: [.32, .56, .66], end: EH }),
    gw_lsweep: cut({ dur: .75, s: 1, two: 1, h0: -.3, h1: -.32, p0: -.45, p1: -.5, t: [.18, .3, .46], legs: CROUCH, end: EL }),
    gw_lram: thrust({ dur: .8, two: 1, h: -.2, reach: .5, t: [.14, .24, .52], lead: { lift: -.2 }, legs: { ...DEEP, lift: -.3 }, end: EL }),
    gw_lwheel: whirl({ dur: .95, two: 1, h: -.3, p: -.3, low: .12, t: [.18, .7], end: EL }),
    gw_rise: upcut({ dur: .85, t: [.2, .32, .46], end: { ...E, hiltH: .1, bladePitch: 1.0 } }),
  });
  anims({
    gw_mill: string([ACTIONS.gw_ram, whirl({ dur: 1.1, turns: 2, two: 1, h: 0, t: [.12, .84] })], E, .35),
    gw_cavein: string([ACTIONS.gw_hpress, ACTIONS.gw_hcross, ACTIONS.gw_hleap], EH, .4),
    gw_ltop: whirl({ dur: 1.4, turns: 3, two: 1, h: -.28, p: -.3, low: .14, t: [.2, 1.12], end: EL }),
    gw_fin2: whirl({ dur: 1.2, turns: 2, two: 1, h: 0, rise: .2, t: [.18, .9], end: E }),
  });
  S('gw_sweep', 'Grinding Sweep', 'gw_sweep', 64, { reach: 2.9, arc: 180, kb: 3, move: .7 });
  S('gw_back', 'Return Grind', 'gw_back', 64, { reach: 2.9, arc: 180, kb: 3, move: .7 });
  S('gw_ram', 'Wheel Ram', 'gw_ram', 70, { reach: 2.9, arc: 60, move: 1.2 });
  S('gw_top1', 'Grindstone', 'gw_top1', 70, { reach: 3.0, arc: 360, kb: 5, move: .6 });
  S('gw_mill', 'Millstone', 'gw_mill', 38, { reach: 3.0, arc: 360, multi: .12, last: 2, kb: 3, cost: 32, move: 1.2 });
  S('gw_hpress', 'Grinding Press', 'gw_hpress', 94, { reach: 2.9, arc: 90, move: 1.0, aoe: 2.0, aoeAt: 1.9, pop: 3.4, hit: [.35, .8] });
  S('gw_hcross', 'Rockcutter', 'gw_hcross', 84, { reach: 2.9, arc: 140, move: .9 });
  S('gw_hleap', 'Falling Wheel', 'gw_hleap', 104, { reach: 2.9, arc: 110, move: 3.4, fixedMove: true, aoe: 2.6, aoeAt: 1.9, pop: 3.6, heavy: true });
  S('gw_cavein', 'Cave-in', 'gw_cavein', 70, { reach: 3.0, arc: 120, multi: .5, last: 1.6, aoe: 2.6, aoeAt: 1.9, pop: 3.4, cost: 34, heavy: true, move: 1.6 });
  S('gw_lsweep', 'Undercut', 'gw_lsweep', 58, { reach: 2.9, arc: 200, pop: 3.4, move: .6 });
  S('gw_lram', 'Low Ram', 'gw_lram', 60, { reach: 2.9, arc: 60, kb: 5, move: 1.0 });
  S('gw_lwheel', 'Low Grind', 'gw_lwheel', 60, { reach: 3.0, arc: 360, pop: 3.4, move: .5 });
  S('gw_ltop', 'Grinding Top', 'gw_ltop', 32, { reach: 3.0, arc: 360, multi: .15, last: 2, pop: 3.4, move: 2.8, fixedMove: true, cost: 32 });
  D('gw_charge', 'Wheel Charge', 'gw_ram', { dmg: 62, move: 3.6, fixedMove: true, kb: 7 });
  D('gw_lrush', 'Dragging Wheel', 'gw_lsweep', { dmg: 66, move: 3.4, fixedMove: true, pop: 6 });
  D('gw_heavyH', 'Tunnel Breaker', 'gw_hleap', { dmg: 150, ki: 96, poise: 64, charge: .3, cost: 34 });
  D('gw_heavyM', 'Grinding Charge', 'gw_ram', { dmg: 120, ki: 80, poise: 54, move: 3.6, fixedMove: true, heavy: true, charge: .14, cost: 32, kb: 8 });
  D('gw_heavyL', 'Rising Grind', 'gw_rise', { dmg: 118, ki: 78, poise: 52, pop: 9.5, heavy: true, charge: .2, cost: 30 });
  S('gw_fin1', 'Wheel Rise', 'gw_rise', 108, { reach: 2.9, arc: 120, pop: 9.5, fin: true, heavy: true, cost: 24, move: .8 });
  S('gw_fin2', 'Grindstone Turn', 'gw_fin2', 56, { reach: 3.1, arc: 360, multi: .36, kb: 8, fin: true, heavy: true, cost: 28, move: .6 });
  D('gw_fin3', 'Rockfall', 'gw_hpress', { dmg: 150, ki: 96, poise: 64, fin: true, heavy: true, cost: 30, aoe: 2.8, wave: { len: 10, speed: 16, w: 1.2, dmg: .7, color: 0xffb060 } });
  D('gw_run', 'Running Ram', 'gw_ram', { dmg: 66, move: 3.6, fixedMove: true, kb: 7 });
  D('gw_dash', 'Dash Grind', 'gw_sweep', { dmg: 62, move: 1.6 });
  D('gw_slide', 'Skidding Wheel', 'gw_lwheel', { speed: 1.2, move: 2.6, fixedMove: true, cost: 16 });
  D('gw_sw', 'Switch Strike', 'gw_top1', { dmg: 76, cost: 10 });
  kit('saw', {
    heavy: { high: 'gw_heavyH', mid: 'gw_heavyM', low: 'gw_heavyL' }, run: 'gw_run', dash: 'gw_dash', switch: 'gw_sw',
    fin: ['gw_fin1', 'gw_fin2', 'gw_fin3'], slide: 'gw_slide', air: airChain('gw', ['gw_sweep', 'gw_back', 'gw_top1']),
    forms: {
      high: { name: 'Rockcutter', neutral: ['gw_hpress', 'gw_hcross', 'gw_hleap'], forward: ['gw_hleap', 'gw_hcross'], pause: 'gw_cavein' },
      mid: { name: 'Grindstone', neutral: ['gw_sweep', 'gw_back', 'gw_ram', 'gw_top1'], forward: ['gw_charge', 'gw_sweep', 'gw_ram'], pause: 'gw_mill' },
      low: { name: 'Undercut', neutral: ['gw_lsweep', 'gw_lram', 'gw_lwheel'], forward: ['gw_lrush', 'gw_lsweep', 'gw_lram'], pause: 'gw_ltop' },
    },
  });
}

// ==================================================================== Seer's Hexblade (Gunblade)
// A spellblade: cuts with the free hand drawing sigils, the blade wheeled upright to trace one, and a
// hex-palm thrust from the off hand. Heavies loose the charged hex (player.js).
{
  const E = { ...SWORD_END, ...REC }, EL = { ...SWORD_END, hiltH: -.3, chestRx: .2, ...LOWREC };
  const SIG = { lhX: .32, lhY: .12, lhZ: .3 };
  anims({
    hx_cut1: cut({ dur: .6, s: 1, h0: .12, h1: 0, t: [.14, .22, .32], lead: SIG, fol: { lhX: .4, lhY: .2, lhZ: .1 }, end: E }),
    hx_cut2: cut({ dur: .6, s: -1, h0: 0, h1: .12, t: [.14, .22, .32], lead: { lhX: .4, lhY: .2, lhZ: .1 }, end: E }),
    hx_sigil: windmill({ dur: .72, turns: 1, a: -.25, h: .08, r: .46, t: [.1, .5], lead: SIG, end: E }),
    hx_palm: { dur: .56, hit: [.16, .28], keys: [
      K(0, { ...SWORD_END, hiltA: -.9, hiltH: -.15, lhX: .35, lhY: .05, lhZ: .1, chestRy: .4, ...LUNGE_R }),
      K(.12, { lhX: .38, lhZ: .05, chestRy: .5 }),
      K(.2, { lhX: .06, lhY: .08, lhZ: .64, chestRy: -.45, chestRx: .15, ...DEEP, wings: 1.6 }),
      K(.28, { lhZ: .62 }),
      K(.56, E),
    ] },
    hx_stab: thrust({ dur: .56, h: .06, t: [.12, .2, .3], lead: SIG, end: E }),
    hx_hcut: cut({ dur: .7, s: 1, h0: .5, h1: -.25, p0: .95, p1: -.7, t: [.2, .3, .4], fol: { ...DEEP }, end: E }),
    hx_hrise: cut({ dur: .7, s: -1, h0: -.28, h1: .5, p0: -.55, p1: 1.1, t: [.18, .28, .38], legs: CROUCH, fol: { ...LUNGE, lift: .06, wings: 1.6 }, end: E }),
    hx_hchop: chop({ dur: .8, two: 0, yaw: .1, t: [.24, .38, .48], top: { lhX: .1, lhY: .5, lhZ: .2 }, end: E }),
    hx_hstep: chop({ dur: .95, two: 0, hop: .3, t: [.3, .5, .6], end: E }),
    hx_lcut: cut({ dur: .52, s: 1, h0: -.28, h1: -.3, p0: -.3, p1: -.35, t: [.1, .18, .28], legs: CROUCH, lead: SIG, end: EL }),
    hx_lsigil: windmill({ dur: .72, turns: 1, a: -.3, h: -.18, r: .46, t: [.1, .5], legs: CROUCH, lead: SIG, end: EL }),
    hx_lspin: whirl({ dur: .82, h: -.3, p: -.2, low: .12, t: [.14, .6], end: EL }),
    hx_ldart: thrust({ dur: .56, h: -.12, t: [.1, .2, .34], lead: { lift: -.2 }, end: EL }),
  });
  anims({
    hx_triple: string([ACTIONS.hx_cut1, ACTIONS.hx_cut2, ACTIONS.hx_sigil, ACTIONS.hx_palm], E, .3),
    hx_lstorm: string([whirl({ dur: 1.0, turns: 2, h: -.28, p: -.2, low: .12, t: [.12, .78] }), ACTIONS.hx_palm], EL, .3),
    hx_fin2: whirl({ dur: 1.0, turns: 2, h: .05, rise: .2, t: [.14, .78], end: E }),
  });
  S('hx_cut1', 'Hex Cut', 'hx_cut1', 40, { reach: 2.5, arc: 160 });
  S('hx_cut2', 'Return Hex', 'hx_cut2', 40, { reach: 2.5, arc: 160 });
  S('hx_sigil', 'Sigil Wheel', 'hx_sigil', 24, { reach: 2.4, arc: 90, multi: .2, pop: 3.2, move: .6 });
  S('hx_palm', 'Hex Palm', 'hx_palm', 36, { reach: 2.1, arc: 80, ki: 46, kb: 7, move: .8 });
  S('hx_stab', "Seer's Thrust", 'hx_stab', 42, { reach: 2.7, arc: 50, move: 1.4 });
  S('hx_triple', 'Triple Hex', 'hx_triple', 30, { reach: 2.6, arc: 130, multi: .3, last: 2, kb: 4, cost: 22, move: 1.2 });
  S('hx_hcut', 'Falling Hex', 'hx_hcut', 58, { reach: 2.6, arc: 130, move: .9 });
  S('hx_hrise', 'Rising Hex', 'hx_hrise', 58, { reach: 2.6, arc: 130, pop: 6, move: .8 });
  S('hx_hchop', 'Hex Cleave', 'hx_hchop', 64, { reach: 2.6, arc: 90, move: 1 });
  S('hx_hstep', 'Hexfall', 'hx_hstep', 76, { reach: 2.6, arc: 110, move: 2.8, fixedMove: true, aoe: 2.2, aoeAt: 1.6, pop: 3.2, heavy: true });
  S('hx_lcut', 'Plague Cut', 'hx_lcut', 34, { reach: 2.4, arc: 170, move: .7 });
  S('hx_lsigil', 'Low Sigil', 'hx_lsigil', 22, { reach: 2.4, arc: 90, multi: .2, pop: 3.2, move: .6 });
  S('hx_lspin', 'Plague Wheel', 'hx_lspin', 36, { reach: 2.5, arc: 360, pop: 3.2, move: .5 });
  S('hx_ldart', 'Plague Needle', 'hx_ldart', 38, { reach: 2.6, arc: 50, move: 3.4, fixedMove: true });
  S('hx_lstorm', 'Hexstorm', 'hx_lstorm', 20, { reach: 2.6, arc: 360, multi: .12, last: 2.2, cost: 22, move: 1.4 });
  D('hx_heavyH', 'Hexfall', 'hx_hstep', { dmg: 118, ki: 75, poise: 45, charge: .2, cost: 30, aoe: 2.4 });
  D('hx_heavyM', 'Hex Cleave', 'hx_hchop', { dmg: 90, ki: 58, poise: 32, heavy: true, charge: .24, cost: 26 });
  D('hx_heavyL', 'Hex Needle', 'hx_ldart', { dmg: 62, ki: 40, poise: 24, heavy: true, charge: .08, cost: 18, move: 4.4 });
  D('hx_fin1', 'Seer\'s Rise', 'hx_hrise', { dmg: 62, ki: 40, poise: 30, pop: 9.5, fin: true, heavy: true, cost: 18 });
  S('hx_fin2', 'Hex Wheel', 'hx_fin2', 26, { reach: 2.8, arc: 360, multi: .12, kb: 5, fin: true, heavy: true, cost: 22, move: 1.0 });
  D('hx_fin3', "Seer's Lance", 'hx_stab', { dmg: 120, ki: 70, poise: 45, move: 2.2, fixedMove: true, fin: true, heavy: true, cost: 26, wave: { len: 11, speed: 24, w: .7, dmg: .8, color: 0x9dff7a } });
  D('hx_run', 'Running Hex', 'hx_cut1', { dmg: 50, move: 3.2, fixedMove: true });
  D('hx_dash', 'Dash Hex', 'hx_cut2', { dmg: 46, move: 1.8 });
  D('hx_slide', 'Sliding Hex', 'hx_lspin', { speed: 1.25, move: 2.6, fixedMove: true, cost: 10 });
  D('hx_sw', 'Switch Strike', 'hx_fin2', { dmg: 26, fin: false, heavy: false, cost: 8 });
  kit('hexblade', {
    heavy: { high: 'hx_heavyH', mid: 'hx_heavyM', low: 'hx_heavyL' }, run: 'hx_run', dash: 'hx_dash', switch: 'hx_sw',
    fin: ['hx_fin1', 'hx_fin2', 'hx_fin3'], slide: 'hx_slide', air: airChain('hx', ['hx_cut1', 'hx_cut2', 'hx_sigil']),
    forms: {
      high: { name: 'Hexfall', neutral: ['hx_hcut', 'hx_hrise', 'hx_hchop'], forward: ['hx_hstep', 'hx_hrise', 'hx_hcut'], pause: 'hx_heavyH' },
      mid: { name: "Seer's Path", neutral: ['hx_cut1', 'hx_cut2', 'hx_sigil', 'hx_palm'], forward: ['hx_stab', 'hx_cut2', 'hx_palm'], pause: 'hx_triple' },
      low: { name: 'Plague Cuts', neutral: ['hx_lcut', 'hx_lsigil', 'hx_lspin'], forward: ['hx_ldart', 'hx_lcut', 'hx_lsigil'], pause: 'hx_lstorm' },
    },
  });
}

// ==================================================================== Moonstaff (Staves, Splitstaff)
// Both ends are weapons: jabs with the head, blows with the butt, sweeps, a windmill in front, a whirl
// overhead, and a vault on the planted staff that kicks with both feet.
{
  const STAFF = { chestRy: -.5, chestRx: .05, hiltA: -.9, hiltR: .28, hiltH: -.15, bladeYaw: .6, bladePitch: .1, bladeRoll: 0, twoHand: 1 };
  const E = { ...STAFF, ...REC }, EH = { ...POLE_HIGH, ...REC }, EL = { ...POLE_LOW, ...LOWREC };
  const FREE = { lhX: .35, lhY: .1, lhZ: .1 };
  anims({
    st_jab: thrust({ dur: .52, two: 1, h: .06, reach: .56, t: [.1, .18, .28], end: E }),
    st_butt: { dur: .6, hit: [.16, .3], keys: [
      K(0, { ...STAFF, chestRy: -.3, hiltA: -.5, hiltR: .2, hiltH: 0, bladeYaw: 2.9, bladePitch: .35, twoHand: 0, lhX: .3, lhY: 0, lhZ: .2, ...LUNGE_R }),
      K(.12, { hiltR: .14, chestRy: -.45 }),
      K(.22, { hiltA: -.1, hiltR: .55, hiltH: .05, bladeYaw: 3.05, bladePitch: .25, chestRy: .2, chestRx: .2, ...DEEP }),
      K(.3, { hiltR: .53 }),
      K(.6, E),
    ] },
    st_sweep: cut({ dur: .66, s: 1, two: 1, h0: .1, h1: 0, t: [.16, .26, .36], end: E }),
    st_back: cut({ dur: .66, s: -1, two: 1, h0: 0, h1: .1, t: [.16, .26, .36], end: E }),
    st_mill: windmill({ dur: .9, turns: 2, a: -.35, h: .1, r: .44, t: [.1, .72], lead: FREE, end: E }),
    st_heli: twirl({ dur: .95, turns: 2, h: .52, pitch: .05, t: [.12, .74], lead: FREE, end: EH }),
    st_vault: { dur: .95, hit: [.34, .56], keys: [
      K(0, { ...STAFF, lift: -.15 }),
      K(.14, { hiltA: -.2, hiltR: .45, hiltH: -.05, bladeYaw: 0, bladePitch: -1.1, bladeRoll: 0, twoHand: 1, chestRx: .3, chestRy: 0, lift: -.2, thLx: -.6, knL: .9, thRx: .3, knR: .8 }),
      K(.34, { lift: .7, bodyRx: -.45, chestRx: -.2, hiltH: -.35, hiltR: .3, thLx: -1.5, knL: .1, thRx: -1.5, knR: .1, wings: 2.4 }),
      K(.52, { lift: .6, bodyRx: -.3 }),
      K(.7, { lift: -.2, bodyRx: 0, chestRx: .3, thLx: -.8, knL: 1.1, thRx: .4, knR: 1.0 }),
      K(.95, EH),
    ] },
    st_hchop: chop({ dur: .8, two: 1, yaw: .3, t: [.24, .38, .48], end: EH }),
    st_lsweep: cut({ dur: .62, s: 1, two: 1, h0: -.3, h1: -.32, p0: -.4, p1: -.45, t: [.14, .24, .34], legs: CROUCH, end: EL }),
    st_lspin: whirl({ dur: .85, two: 1, h: -.3, p: -.3, low: .14, t: [.14, .62], end: EL }),
    st_ljab: thrust({ dur: .5, two: 1, h: -.2, reach: .56, t: [.1, .18, .28], lead: { lift: -.2 }, legs: { ...DEEP, lift: -.3 }, end: EL }),
    st_rise: upcut({ dur: .7, t: [.16, .26, .36], jump: .15, end: EH }),
  });
  anims({
    st_lbutt: shift(ACTIONS.st_butt, { hiltH: -.25, lift: -.12, chestRx: .15 }),
    st_whirl: string([ACTIONS.st_sweep, ACTIONS.st_back, ACTIONS.st_mill, ACTIONS.st_jab], E, .3),
    st_hpillar: string([ACTIONS.st_hchop, ACTIONS.st_heli, ACTIONS.st_hchop], EH, .3),
    st_lthunder: whirl({ dur: 1.3, turns: 3, two: 1, h: -.3, p: -.3, low: .14, t: [.14, 1.04], end: EL }),
    st_fin2: whirl({ dur: 1.1, turns: 2, two: 1, h: .05, rise: .3, t: [.14, .84], end: E }),
  });
  S('st_jab', 'Staff Jab', 'st_jab', 36, { reach: 3.1, arc: 50, move: .8 });
  S('st_butt', 'Butt Strike', 'st_butt', 36, { reach: 2.4, arc: 70, ki: 36, kb: 5, move: .8 });
  S('st_sweep', 'Staff Sweep', 'st_sweep', 40, { reach: 3.0, arc: 200, move: .5 });
  S('st_back', 'Return Sweep', 'st_back', 40, { reach: 3.0, arc: 200, move: .5 });
  S('st_mill', 'Windmill', 'st_mill', 18, { reach: 2.8, arc: 120, multi: .12, pop: 3.2, move: 1.2 });
  S('st_heli', 'Whirling Staff', 'st_heli', 22, { reach: 3.0, arc: 360, multi: .14, move: .4 });
  S('st_vault', 'Pole Vault Kick', 'st_vault', 48, { reach: 2.4, arc: 90, kb: 9, move: 3.4, fixedMove: true });
  S('st_whirl', 'Rolling Thunder', 'st_whirl', 26, { reach: 3.0, arc: 360, multi: .2, last: 2, cost: 22, move: 1.2 });
  S('st_hchop', 'Falling Staff', 'st_hchop', 58, { reach: 3.1, arc: 60, move: .9 });
  S('st_hpillar', 'Pillar Dance', 'st_hpillar', 34, { reach: 3.1, arc: 360, multi: .3, last: 1.8, cost: 24, heavy: true, move: 1.0, aoe: 2.0, aoeAt: 2.4 });
  S('st_lsweep', 'Leg Breaker', 'st_lsweep', 36, { reach: 3.0, arc: 200, pop: 3.2, move: .5 });
  S('st_lspin', 'Rolling Staff', 'st_lspin', 38, { reach: 3.0, arc: 360, pop: 3.2, move: .4 });
  S('st_lbutt', 'Low Butt Strike', 'st_lbutt', 34, { reach: 2.4, arc: 70, pop: 3.2, kb: 4, move: .7 });
  S('st_ljab', 'Shin Jab', 'st_ljab', 34, { reach: 3.1, arc: 50, move: .8 });
  S('st_lthunder', 'Rolling Thunder', 'st_lthunder', 20, { reach: 3.0, arc: 360, multi: .12, pop: 3.2, move: 2.6, fixedMove: true, cost: 22 });
  D('st_run', 'Running Jab', 'st_jab', { dmg: 44, move: 3.2, fixedMove: true });
  D('st_lrun', 'Sliding Jab', 'st_ljab', { dmg: 42, move: 3.2, fixedMove: true });
  D('st_heavyH', 'Pole Vault', 'st_vault', { dmg: 96, ki: 64, poise: 40, heavy: true, charge: .1, cost: 26, aoe: 2.2, aoeAt: 1.2 });
  D('st_heavyM', 'Great Whirl', 'st_heli', { dmg: 44, ki: 30, poise: 18, multi: .18, heavy: true, charge: .1, cost: 26, kb: 6 });
  D('st_heavyL', 'Driving Jab', 'st_ljab', { dmg: 70, ki: 46, poise: 28, move: 4.8, fixedMove: true, heavy: true, charge: .08, cost: 20, kb: 8 });
  S('st_fin1', 'Rising Staff', 'st_rise', 60, { reach: 3.0, arc: 110, pop: 9.5, fin: true, heavy: true, cost: 16 });
  S('st_fin2', 'Moon Whirl', 'st_fin2', 36, { reach: 3.2, arc: 360, multi: .34, kb: 7, fin: true, heavy: true, cost: 22, move: .6 });
  D('st_fin3', 'Moon Pillar', 'st_jab', { dmg: 104, ki: 66, poise: 40, move: 3, fixedMove: true, fin: true, heavy: true, cost: 22, kb: 10, wave: { len: 11, speed: 24, w: .8, dmg: .8, color: 0xc8e8ff } });
  D('st_dash', 'Dash Sweep', 'st_sweep', { dmg: 46, move: 1.6 });
  D('st_slide', 'Sliding Wheel', 'st_lspin', { speed: 1.25, move: 2.6, fixedMove: true, cost: 10 });
  D('st_sw', 'Switch Strike', 'st_fin2', { dmg: 36, fin: false, heavy: false, cost: 8 });
  kit('staff', {
    heavy: { high: 'st_heavyH', mid: 'st_heavyM', low: 'st_heavyL' }, run: 'st_run', dash: 'st_dash', switch: 'st_sw',
    fin: ['st_fin1', 'st_fin2', 'st_fin3'], slide: 'st_slide', air: airChain('st', ['st_sweep', 'st_back', 'st_heli']),
    forms: {
      high: { name: 'Pillar', neutral: ['st_hchop', 'st_butt', 'st_heli'], forward: ['st_vault', 'st_hchop', 'st_heli'], pause: 'st_hpillar' },
      mid: { name: 'Whirling Staff', neutral: ['st_jab', 'st_sweep', 'st_back', 'st_mill'], forward: ['st_run', 'st_butt', 'st_mill'], pause: 'st_whirl' },
      low: { name: 'Leg Breaker', neutral: ['st_lsweep', 'st_lbutt', 'st_lspin'], forward: ['st_lrun', 'st_lsweep', 'st_ljab'], pause: 'st_lthunder' },
    },
  });
}

// ==================================================================== Moth Fans (Warfans)
// A dance: both fans open outward from the chest and sweep closed again, the knight turning between them;
// fluttering cuts, a diving leap, gusts that shove. Heavies throw the fans.
{
  const E = { ...PAIR_END, ...REC }, EH = { ...PAIR_HIGH, ...REC }, EL = { ...PAIR_LOW, ...LOWREC };
  const wings = (A, o = {}) => withKeys(A, mirror(A, o), [A.hit[0], A.hit[1] + (o.delay || 0)]);
  anims({
    fn_open: wings(cut({ dur: .5, s: -1, a0: .15, a1: 1.3, y0: .3, y1: 2.3, h0: .1, h1: .12, t: [.08, .14, .24], legs: SOFT_L, end: E })),
    fn_close: wings(cut({ dur: .52, s: 1, a0: 1.3, a1: .1, y0: 2.3, y1: .2, h0: .12, h1: .05, t: [.1, .18, .26], legs: LUNGE, end: E })),
    fn_twirl: whirl({ dur: .7, h: .1, p: .1, rise: .15, t: [.1, .52], off: true, r: .52, end: E }),
    fn_leap: withKeys(chop({ dur: .85, two: 0, hop: .3, yaw: -.3, a: -.2, t: [.26, .46, .56], end: EH }), offchop({ t: [.26, .46, .56] }), [.41, .58]),
    fn_hwing: wings(cut({ dur: .6, s: 1, h0: .5, h1: -.2, p0: .9, p1: -.5, t: [.14, .24, .34], end: EH })),
    fn_lsweep: wings(cut({ dur: .52, s: -1, a0: .15, a1: 1.3, y0: .3, y1: 2.3, h0: -.28, h1: -.3, p0: -.3, p1: -.3, t: [.08, .16, .26], legs: CROUCH, end: EL })),
    fn_lturn: whirl({ dur: .75, h: -.28, p: -.2, low: .14, t: [.1, .56], off: true, r: .52, end: EL }),
    fn_lrise: wings(upcut({ dur: .62, two: 0, t: [.12, .22, .3], jump: .12, end: EH })),
    fn_glide: wings(cut({ dur: .56, s: 1, a0: 1.3, a1: .2, y0: 2.3, y1: .3, t: [.12, .2, .28], lead: { lift: -.2, chestRx: .45, thLx: -1.0, knL: .8, thRx: .9, knR: .4, wings: 2.2 }, end: E })),
  });
  anims({
    fn_flutter: flurryH({ n: 8, t0: .1, step: .06, dur: .78 }),
    fn_dance: string([ACTIONS.fn_open, ACTIONS.fn_close, whirl({ dur: .9, turns: 2, h: .1, t: [.08, .7], off: true, r: .52 })], E, .3),
    fn_hstorm: string([whirl({ dur: .9, turns: 2, h: .15, p: .3, rise: .3, t: [.08, .7], off: true, r: .52 }), ACTIONS.fn_hwing], EH, .3),
    fn_ldevil: whirl({ dur: 1.2, turns: 3, h: -.28, p: -.2, low: .14, t: [.12, 1.0], off: true, r: .52, end: EL }),
    fn_fin2: whirl({ dur: 1.0, turns: 3, h: .1, p: .2, rise: .35, t: [.1, .8], off: true, r: .52, end: EH }),
    fn_fin3: flurryH({ n: 12, t0: .12, step: .06, dur: 1.15 }),
  });
  S('fn_open', 'Opening Wings', 'fn_open', 26, { reach: 2.4, arc: 220, kb: 3, move: .5 });
  S('fn_close', 'Closing Wings', 'fn_close', 26, { reach: 2.4, arc: 200, kb: 3, move: .6 });
  S('fn_twirl', 'Moth Turn', 'fn_twirl', 22, { reach: 2.5, arc: 360, multi: .13, kb: 4, move: .5 });
  S('fn_flutter', 'Flutter', 'fn_flutter', 11, { reach: 2.3, arc: 80, multi: .06, last: 2.5, move: .9 });
  S('fn_leap', 'Moth Dive', 'fn_leap', 46, { reach: 2.3, arc: 110, move: 3.0, fixedMove: true, aoe: 1.8, aoeAt: 1.3, kb: 5 });
  S('fn_hwing', 'Falling Wings', 'fn_hwing', 34, { reach: 2.4, arc: 140, move: .8 });
  S('fn_lsweep', 'Low Gust', 'fn_lsweep', 24, { reach: 2.4, arc: 220, pop: 3.2, kb: 3, move: .5 });
  S('fn_lturn', 'Dust Turn', 'fn_lturn', 20, { reach: 2.5, arc: 360, multi: .13, pop: 3.2, move: .5 });
  S('fn_lrise', 'Rising Gust', 'fn_lrise', 30, { reach: 2.4, arc: 140, pop: 6.5, move: .6 });
  S('fn_glide', 'Gliding Wings', 'fn_glide', 26, { reach: 2.4, arc: 200, move: 3.4, fixedMove: true, pass: true, kb: 4 });
  S('fn_dance', 'Paper Moon', 'fn_dance', 20, { reach: 2.5, arc: 360, multi: .2, last: 2, kb: 3, cost: 20, move: .8 });
  S('fn_hstorm', 'Moth Storm', 'fn_hstorm', 20, { reach: 2.5, arc: 360, multi: .14, last: 2.2, pop: 4, cost: 22, move: .6 });
  S('fn_ldevil', 'Dust Devil', 'fn_ldevil', 11, { reach: 2.6, arc: 360, multi: .09, pop: 3.2, move: 2.6, fixedMove: true, cost: 22 });
  D('fn_ldart', 'Skimming Wings', 'fn_glide', { dmg: 24 });
  D('fn_fin1', 'Rising Wings', 'fn_lrise', { dmg: 44, ki: 30, poise: 20, pop: 9.5, fin: true, heavy: true, cost: 14 });
  S('fn_fin2', 'Gale Cyclone', 'fn_fin2', 16, { reach: 2.8, arc: 360, multi: .1, kb: 6, pop: 4, fin: true, heavy: true, cost: 18, move: 1.2 });
  S('fn_fin3', 'Moth Storm', 'fn_fin3', 12, { reach: 2.4, arc: 90, multi: .06, last: 4, fin: true, heavy: true, cost: 22, move: 1.0, wave: { len: 9, speed: 18, w: 1.4, dmg: 1.4, color: 0xffe0f0, at: .9 } });
  D('fn_run', 'Running Wings', 'fn_close', { dmg: 30, move: 3.2, fixedMove: true });
  D('fn_dash', 'Dash Wings', 'fn_open', { dmg: 30, move: 1.8 });
  D('fn_slide', 'Sliding Gust', 'fn_lturn', { speed: 1.25, move: 2.6, fixedMove: true, cost: 8 });
  D('fn_sw', 'Switch Strike', 'fn_twirl', { dmg: 24, cost: 6 });
  kit('fans', {
    heavy: { high: 'fan_hurl', mid: 'fan_hurl', low: 'fan_hurl' }, run: 'fn_run', dash: 'fn_dash', switch: 'fn_sw',
    fin: ['fn_fin1', 'fn_fin2', 'fn_fin3'], slide: 'fn_slide', air: airChain('fn', ['fn_open', 'fn_close', 'fn_twirl']),
    forms: {
      high: { name: 'Moth Wing', neutral: ['fn_hwing', 'fn_lrise', 'fn_twirl'], forward: ['fn_leap', 'fn_hwing'], pause: 'fn_hstorm' },
      mid: { name: 'Paper Moon', neutral: ['fn_open', 'fn_close', 'fn_twirl', 'fn_flutter'], forward: ['fn_glide', 'fn_close', 'fn_twirl'], pause: 'fn_dance' },
      low: { name: 'Dust Devil', neutral: ['fn_lsweep', 'fn_lturn', 'fn_lrise'], forward: ['fn_ldart', 'fn_lsweep', 'fn_lturn'], pause: 'fn_ldevil' },
    },
  });
}

// ==================================================================== Moon Tonfas (Tonfas)
// Batons along the forearms: jab and cross, a turning elbow that leads with the long end, hammering blows
// with both arms, spinning backfists, and double uppercuts out of a crouch.
{
  const E = { ...FIST_END, ...STAND }, EH = { ...FIST_HIGH, ...STAND }, EL = { ...FIST_LOW, ...LOWSTAND };
  const both = (o, l = {}) => { const R = rake({ hand: 'R', ...o }), L = rake({ hand: 'L', chest: false, ...o, ...l }); return withKeys(R, L.keys.slice(0, -1), [R.hit[0], Math.max(R.hit[1], L.hit[1])]); };
  anims({
    tf_jab: punch({ dur: .38, hand: 'R', h: .1, t: [.05, .11, .18], legs: LUNGE, end: E }),
    tf_cross: punch({ dur: .42, hand: 'L', h: .1, t: [.06, .13, .2], end: E }),
    tf_elbow: { dur: .5, hit: [.14, .26], keys: [
      K(0, { ...FIST_END, hiltA: -.9, hiltR: .3, hiltH: .15, chestRy: -.6, ...LUNGE_R }),
      K(.1, { chestRy: -.75 }),
      K(.2, { hiltA: .35, hiltR: .16, hiltH: .15, chestRy: .55, chestRx: .15, ...DEEP }),
      K(.26, { hiltA: .45 }),
      K(.5, E),
    ] },
    tf_hammer: { dur: .62, hit: [.24, .36], keys: [
      K(0, { ...FIST_HIGH, hiltA: -.3, hiltR: .2, hiltH: .5, lhX: .2, lhY: .5, lhZ: .2, chestRx: -.25, lift: .02 }),
      K(.18, { hiltH: .56, lhY: .56, chestRx: -.32 }),
      K(.28, { hiltA: -.15, hiltR: .5, hiltH: -.15, lhX: .1, lhY: -.15, lhZ: .5, chestRx: .5, ...DEEP }),
      K(.62, EH),
    ] },
    tf_spin: whirl({ dur: .72, h: .12, t: [.1, .52], off: true, r: .5, end: E }),
    tf_hupper: both({ dur: .56, s: .2, h0: -.3, h1: .52, t: [.12, .2, .28], legs: CROUCH, end: EH }, { s: -.2 }),
    tf_hspin: whirl({ dur: .8, h: .2, p: .3, rise: .35, t: [.1, .6], off: true, r: .5, end: EH }),
    tf_rush: punch({ dur: .5, hand: 'R', h: .1, t: [.1, .16, .26], lead: { lift: -.2, chestRx: .4, thLx: -1.0, knL: .8, thRx: .9, knR: .4, wings: 2 }, end: E }),
    tf_lbody: punch({ dur: .4, hand: 'R', h: -.14, t: [.05, .12, .19], legs: { ...DEEP, lift: -.28 }, end: EL }),
    tf_lbodyL: punch({ dur: .42, hand: 'L', h: -.14, t: [.06, .13, .2], legs: { ...DEEP, lift: -.28 }, end: EL }),
    tf_lupper: both({ dur: .56, s: .2, h0: -.32, h1: .45, t: [.12, .2, .28], legs: CROUCH, end: EL }, { s: -.2 }),
    tf_lspin: whirl({ dur: .75, h: -.25, p: -.2, low: .14, t: [.1, .56], off: true, r: .5, end: EL }),
  });
  anims({
    tf_hleap: string([{ ...ACTIONS.tf_hammer, keys: [K(0, { ...FIST_HIGH, ...HOP, lift: .2 }), ...ACTIONS.tf_hammer.keys.slice(1)] }], EH, .3),
    tf_barrage: flurryH({ n: 12, t0: .12, step: .06, dur: 1.1 }),
    tf_hstorm: string([ACTIONS.tf_hupper, ACTIONS.tf_hspin, ACTIONS.tf_hammer], EH, .3),
    tf_lrise: string([ACTIONS.tf_lbody, ACTIONS.tf_lbodyL, ACTIONS.tf_lupper], EL, .3),
    tf_fin2: whirl({ dur: 1.0, turns: 2, h: .12, rise: .25, t: [.12, .78], off: true, r: .5, end: EH }),
  });
  S('tf_jab', 'Baton Jab', 'tf_jab', 22, { reach: 2.0, arc: 70, ki: 18, move: .6 });
  S('tf_cross', 'Baton Cross', 'tf_cross', 26, { reach: 2.0, arc: 70, ki: 20, move: .7 });
  S('tf_elbow', 'Turning Baton', 'tf_elbow', 30, { reach: 2.0, arc: 140, ki: 26, move: .6 });
  S('tf_hammer', 'Hammer Batons', 'tf_hammer', 40, { reach: 2.0, arc: 90, ki: 36, move: .8, pop: 3.2 });
  S('tf_spin', 'Spinning Batons', 'tf_spin', 26, { reach: 2.2, arc: 360, multi: .14, move: .5 });
  S('tf_hupper', 'Rising Batons', 'tf_hupper', 34, { reach: 2.0, arc: 100, pop: 7, move: .6 });
  S('tf_hspin', 'Whirling Guard', 'tf_hspin', 22, { reach: 2.2, arc: 360, multi: .14, pop: 5, move: .5 });
  S('tf_hleap', 'Leaping Batons', 'tf_hleap', 44, { reach: 2.0, arc: 100, move: 2.8, fixedMove: true, aoe: 1.6, aoeAt: 1.1, pop: 3.2 });
  S('tf_rush', 'Driving Baton', 'tf_rush', 30, { reach: 2.0, arc: 70, move: 3.0, fixedMove: true, kb: 6 });
  S('tf_barrage', 'Baton Barrage', 'tf_barrage', 10, { reach: 2.0, arc: 70, multi: .06, last: 4, move: 1.2, cost: 18 });
  S('tf_hstorm', 'Moon Storm', 'tf_hstorm', 24, { reach: 2.2, arc: 360, multi: .22, last: 2, pop: 4, cost: 20, move: .8 });
  S('tf_lbody', 'Low Baton', 'tf_lbody', 22, { reach: 1.9, arc: 70, ki: 24, move: .7 });
  S('tf_lbodyL', 'Low Cross', 'tf_lbodyL', 22, { reach: 1.9, arc: 70, ki: 24, move: .7 });
  S('tf_lupper', 'Twin Uppercut', 'tf_lupper', 32, { reach: 2.0, arc: 100, pop: 6.5, move: .6 });
  S('tf_lspin', 'Low Batons', 'tf_lspin', 22, { reach: 2.2, arc: 360, multi: .14, pop: 3.2, move: .5 });
  S('tf_lrise', 'Rising Batons', 'tf_lrise', 22, { reach: 2.0, arc: 90, multi: .26, last: 2, pop: 3, cost: 18, move: 1.0 });
  S('tf_lslide', 'Sliding Baton', 'x_slide', 28, { reach: 2.1, arc: 90, move: 3.4, fixedMove: true, pop: 3.2, hit: [.1, .4], dur: .6, kick: 'L' });
  D('tf_heavyH', 'Moonfall Batons', 'tf_hammer', { dmg: 80, ki: 64, poise: 30, heavy: true, charge: .14, cost: 18, aoe: 2.0, aoeAt: 1.1 });
  D('tf_heavyM', 'Driving Batons', 'tf_rush', { dmg: 70, ki: 64, poise: 28, heavy: true, charge: .06, cost: 16, kb: 10 });
  D('tf_heavyL', 'Baton Burst', 'tf_lupper', { dmg: 64, ki: 76, poise: 30, heavy: true, charge: .08, cost: 16, pop: 8, kb: 6 });
  D('tf_fin1', 'Moonrise Batons', 'tf_hupper', { dmg: 54, ki: 44, poise: 24, pop: 9.5, fin: true, heavy: true, cost: 12 });
  S('tf_fin2', 'Whirling Moon', 'tf_fin2', 20, { reach: 2.4, arc: 360, multi: .12, kb: 7, fin: true, heavy: true, cost: 14, move: .8 });
  D('tf_fin3', 'Moonfall', 'tf_hammer', { dmg: 76, ki: 80, poise: 36, fin: true, heavy: true, cost: 16, kb: 10, wave: { len: 7, speed: 20, w: 1.3, dmg: .8, color: 0x9fc8ff, at: .3 } });
  D('tf_run', 'Running Baton', 'tf_rush', { dmg: 32, move: 3.2 });
  D('tf_dash', 'Dash Cross', 'tf_cross', { dmg: 30, move: 1.8 });
  D('tf_slide', 'Sliding Baton', 'tf_lslide', { move: 2.6, cost: 8 });
  D('tf_sw', 'Switch Strike', 'tf_spin', { dmg: 30, cost: 5 });
  kit('tonfas', {
    heavy: { high: 'tf_heavyH', mid: 'tf_heavyM', low: 'tf_heavyL' }, run: 'tf_run', dash: 'tf_dash', switch: 'tf_sw',
    fin: ['tf_fin1', 'tf_fin2', 'tf_fin3'], slide: 'tf_slide', air: airChain('tf', ['tf_jab', 'tf_cross', 'tf_spin']),
    forms: {
      high: { name: 'Rising Guard', neutral: ['tf_hammer', 'tf_hupper', 'tf_hspin'], forward: ['tf_hleap', 'tf_hupper', 'tf_hammer'], pause: 'tf_hstorm' },
      mid: { name: 'Twin Batons', neutral: ['tf_jab', 'tf_cross', 'tf_elbow', 'tf_spin'], forward: ['tf_rush', 'tf_cross', 'tf_elbow'], pause: 'tf_barrage' },
      low: { name: 'Low Batons', neutral: ['tf_lbody', 'tf_lbodyL', 'tf_lupper', 'tf_lspin'], forward: ['tf_lslide', 'tf_lbody', 'tf_lupper'], pause: 'tf_lrise' },
    },
  });
}

// ==================================================================== Silkclaw's Rapier (Rapiers)
// A fencer: side-on, the free arm raised behind. Lunges off the front foot, a beat-and-thrust feint, the
// balestra (a hop into a lunge), the running flèche straight through, and moulinets, the blade wheeled
// from the wrist.
{
  const UP = { lhX: .38, lhY: .38, lhZ: -.22 };
  const FENCE = { lift: -.26, thLx: .75, knL: .15, thRx: -1.2, knR: 1.1 };
  const E = { ...SWORD_END, ...UP, ...REC }, EL = { ...SWORD_END, hiltH: -.3, chestRx: .2, ...UP, ...LOWREC };
  const RUN = { lift: -.2, chestRx: .4, thLx: -1.1, knL: .8, thRx: 1.0, knR: .4, wings: 2 };
  anims({
    rp_lunge: thrust({ dur: .6, h: .06, reach: .66, t: [.12, .22, .34], legs: FENCE, lead: UP, out: UP, end: E }),
    rp_cut: cut({ dur: .46, s: 1, h0: .12, h1: .05, t: [.08, .14, .22], lead: UP, end: E }),
    rp_coupe: cut({ dur: .52, s: -1, h0: .42, h1: -.12, p0: .8, p1: -.3, t: [.1, .17, .26], lead: UP, end: E }),
    rp_moul: windmill({ dur: .62, turns: 1, a: -.2, h: .08, r: .5, t: [.08, .42], lead: UP, end: E }),
    rp_balestra: thrust({ dur: .72, h: .08, reach: .66, t: [.22, .32, .44], lead: { ...UP, ...HOP, lift: .26 }, legs: FENCE, out: UP, end: E }),
    rp_fleche: thrust({ dur: .62, h: .06, reach: .66, t: [.1, .2, .38], lead: UP, legs: RUN, out: UP, end: E }),
    rp_hthrust: thrust({ dur: .56, h: .32, reach: .6, t: [.1, .2, .32], legs: FENCE, lead: UP, out: UP, end: E }),
    rp_hmoul: twirl({ dur: .7, turns: 1, h: .45, pitch: .1, t: [.1, .5], lead: UP, end: E }),
    rp_lthrust: thrust({ dur: .56, h: -.22, reach: .66, t: [.1, .2, .32], legs: { ...FENCE, lift: -.34 }, lead: UP, out: UP, end: EL }),
    rp_lcut: cut({ dur: .48, s: 1, h0: -.28, h1: -.3, p0: -.3, p1: -.35, t: [.08, .15, .24], legs: CROUCH, lead: UP, end: EL }),
    rp_lmoul: windmill({ dur: .62, turns: 1, a: -.3, h: -.18, r: .5, t: [.08, .42], legs: CROUCH, lead: UP, end: EL }),
    rp_rise: cut({ dur: .66, s: -1, h0: -.28, h1: .5, p0: -.55, p1: 1.1, t: [.16, .24, .34], legs: CROUCH, lead: UP, fol: { ...LUNGE, lift: .08, wings: 1.6 }, end: E }),
  });
  const feint = thrust({ dur: .4, h: .06, reach: .48, t: [.06, .12, .18], legs: LUNGE_R, lead: UP });
  anims({
    rp_feint: string([feint, ACTIONS.rp_lunge], E, .3),
    rp_hstar: string([thrust({ dur: .42, h: .32, reach: .6, t: [.06, .12, .18], legs: FENCE, lead: UP }), thrust({ dur: .42, h: .05, reach: .6, t: [.06, .12, .18], legs: FENCE }), ACTIONS.rp_hthrust], E, .3),
    rp_beat: string([ACTIONS.rp_cut, ACTIONS.rp_lunge], E, .3),
    rp_lpetal: flurryH({ n: 8, t0: .1, step: .07, dur: .9, low: .25, fangs: false }),
    rp_fin2: whirl({ dur: .95, turns: 2, h: .05, rise: .2, t: [.12, .74], lead: UP, end: E }),
  });
  S('rp_lunge', 'Lunge', 'rp_lunge', 46, { reach: 2.9, arc: 40, move: 1.8 });
  S('rp_cut', 'Parry and Cut', 'rp_cut', 32, { reach: 2.5, arc: 150, move: .6 });
  S('rp_coupe', 'Coupé', 'rp_coupe', 36, { reach: 2.6, arc: 120, move: .7 });
  S('rp_feint', 'Feint and Lunge', 'rp_feint', 34, { reach: 2.9, arc: 40, multi: .28, last: 1.6, move: 1.8 });
  S('rp_moul', 'Moulinet', 'rp_moul', 18, { reach: 2.6, arc: 100, multi: .12, move: .6 });
  S('rp_balestra', 'Balestra', 'rp_balestra', 52, { reach: 2.9, arc: 40, move: 3.2, fixedMove: true });
  S('rp_fleche', 'Flèche', 'rp_fleche', 46, { reach: 2.9, arc: 50, move: 4.6, fixedMove: true, pass: true });
  S('rp_hthrust', 'Head Thrust', 'rp_hthrust', 50, { reach: 2.9, arc: 40, move: 1.6 });
  S('rp_hmoul', 'Crown Moulinet', 'rp_hmoul', 20, { reach: 2.6, arc: 360, multi: .12, move: .5 });
  S('rp_hstar', 'Starpoint', 'rp_hstar', 38, { reach: 2.9, arc: 40, multi: .24, last: 1.8, cost: 20, move: 1.6 });
  S('rp_lthrust', 'Low Line', 'rp_lthrust', 40, { reach: 2.9, arc: 40, move: 1.6 });
  S('rp_lcut', 'Ankle Cut', 'rp_lcut', 30, { reach: 2.5, arc: 160, pop: 3.2, move: .6 });
  S('rp_lmoul', 'Low Moulinet', 'rp_lmoul', 18, { reach: 2.6, arc: 100, multi: .12, move: .6 });
  S('rp_lpetal', 'Petal Fence', 'rp_lpetal', 14, { reach: 2.9, arc: 40, multi: .07, last: 3, move: 1.0, cost: 18 });
  D('rp_ldart', 'Low Flèche', 'rp_fleche', { dmg: 42 });
  D('rp_heavyH', 'Falling Point', 'rp_balestra', { dmg: 110, ki: 64, poise: 40, heavy: true, charge: .12, cost: 26 });
  S('rp_heavyM', 'Beat and Lunge', 'rp_beat', 60, { reach: 2.9, arc: 60, multi: .3, last: 1.5, heavy: true, cost: 24, move: 1.8, ki: 40, poise: 22 });
  D('rp_heavyL', 'Needle Point', 'rp_fleche', { dmg: 70, ki: 42, poise: 26, heavy: true, charge: .06, cost: 18, move: 5.2 });
  S('rp_fin1', 'Rising Point', 'rp_rise', 60, { reach: 2.7, arc: 120, pop: 9.5, fin: true, heavy: true, cost: 16 });
  S('rp_fin2', 'Silk Whirl', 'rp_fin2', 24, { reach: 2.8, arc: 360, multi: .12, kb: 5, fin: true, heavy: true, cost: 20, move: 1.0 });
  D('rp_fin3', 'Silk Piercer', 'rp_lunge', { dmg: 120, ki: 70, poise: 44, move: 2.6, fixedMove: true, fin: true, heavy: true, cost: 24, wave: { len: 12, speed: 26, w: .6, dmg: .9, color: 0xd8d8ff } });
  D('rp_run', 'Running Flèche', 'rp_fleche', { dmg: 48 });
  D('rp_dash', 'Dash Cut', 'rp_cut', { dmg: 40, move: 1.8 });
  D('rp_slide', 'Sliding Line', 'rp_lthrust', { move: 2.8, fixedMove: true, cost: 10 });
  D('rp_sw', 'Switch Strike', 'rp_fin2', { dmg: 24, fin: false, heavy: false, cost: 8 });
  kit('rapier', {
    heavy: { high: 'rp_heavyH', mid: 'rp_heavyM', low: 'rp_heavyL' }, run: 'rp_run', dash: 'rp_dash', switch: 'rp_sw',
    fin: ['rp_fin1', 'rp_fin2', 'rp_fin3'], slide: 'rp_slide', air: airChain('rp', ['rp_cut', 'rp_coupe', 'rp_moul']),
    forms: {
      high: { name: 'Silk Needle', neutral: ['rp_hthrust', 'rp_coupe', 'rp_hmoul'], forward: ['rp_balestra', 'rp_hthrust', 'rp_coupe'], pause: 'rp_hstar' },
      mid: { name: "Duelist's Line", neutral: ['rp_lunge', 'rp_cut', 'rp_feint', 'rp_moul'], forward: ['rp_fleche', 'rp_cut', 'rp_lunge'], pause: 'rp_hundred' },
      low: { name: 'Crouching Fence', neutral: ['rp_lthrust', 'rp_lcut', 'rp_lmoul'], forward: ['rp_ldart', 'rp_lthrust', 'rp_lcut'], pause: 'rp_lpetal' },
    },
  });
}

// ==================================================================== Rimeblade (Nikanas, iaido)
// The iai: the blade drawn from the left hip in one cut and flicked clean, then taken two-handed for the
// cuts that follow. Rising draws, a draw at a run straight through the foe, and three draws in a breath.
{
  const E = { ...SWORD_END, ...REC }, EL = { ...SWORD_END, hiltH: -.3, chestRx: .2, ...LOWREC };
  const SHEATHE = { hiltA: .62, hiltR: .3, hiltH: -.22, bladeYaw: 2.7, bladePitch: -.25, bladeRoll: 1.57, lhX: .28, lhY: -.25, lhZ: .16, twoHand: 0, chestRy: .5 };
  const flick = (A, at) => withKeys(A, [K(at, { hiltA: -.85, hiltR: .42, hiltH: -.12, bladeYaw: -1.2, bladePitch: -.7, bladeRoll: 0, chestRy: -.3 })]);
  const draw = o => flick(cut({ dur: .6, s: -1, a0: .6, y0: 2.8, h0: -.18, h1: .02, p0: -.2, p1: 0, t: [.12, .17, .25], lead: SHEATHE, fol: { lhX: .3, lhY: -.2, lhZ: .1 }, end: E, ...o }), (o?.t?.[2] ?? .25) + .14);
  const RUN = { lift: -.22, chestRx: .45, thLx: -1.1, knL: .8, thRx: 1.0, knR: .4, wings: 2 };
  anims({
    kt_draw: draw(),
    kt_rdraw: cut({ dur: .66, s: -1, a0: .6, y0: 2.8, h0: -.25, h1: .5, p0: -.4, p1: 1.05, t: [.12, .19, .28], lead: SHEATHE, legs: CROUCH, fol: { ...LUNGE, lift: .06, wings: 1.6 }, end: E }),
    kt_cut: cut({ dur: .66, s: 1, two: 1, h0: .12, h1: -.05, t: [.14, .24, .34], end: E }),
    kt_back: cut({ dur: .66, s: -1, two: 1, h0: -.05, h1: .12, t: [.14, .24, .34], end: E }),
    kt_thrust: thrust({ dur: .6, two: 1, h: .06, reach: .6, t: [.12, .2, .32], end: E }),
    kt_dash: draw({ legs: RUN, lead: { ...SHEATHE, ...RUN }, t: [.16, .22, .3], dur: .66 }),
    kt_hchop: chop({ dur: .78, two: 1, yaw: .1, t: [.24, .38, .48], end: E }),
    kt_hcross: cut({ dur: .74, s: 1, two: 1, h0: .52, h1: -.28, p0: 1.0, p1: -.7, t: [.2, .3, .42], fol: { ...DEEP }, end: E }),
    kt_hrise: cut({ dur: .74, s: -1, two: 1, h0: -.28, h1: .52, p0: -.6, p1: 1.1, t: [.2, .3, .42], legs: CROUCH, fol: { ...LUNGE, lift: .05 }, end: E }),
    kt_hstep: chop({ dur: .95, two: 1, hop: .32, yaw: .1, t: [.3, .5, .6], end: E }),
    kt_ldraw: draw({ h0: -.3, h1: -.28, p0: -.35, p1: -.3, legs: CROUCH, end: EL }),
    kt_lrdraw: cut({ dur: .6, s: -1, a0: .6, y0: 2.8, h0: -.32, h1: .2, p0: -.5, p1: .6, t: [.1, .17, .26], lead: { ...SHEATHE, hiltH: -.32 }, legs: CROUCH, end: EL }),
    kt_lsweep: whirl({ dur: .85, two: 1, h: -.3, p: -.25, low: .14, t: [.14, .62], end: EL }),
    kt_ldash: draw({ h0: -.28, h1: -.26, p0: -.3, p1: -.3, legs: RUN, lead: { ...SHEATHE, ...RUN, lift: -.3 }, t: [.16, .22, .3], dur: .66, end: EL }),
  });
  anims({
    kt_three: string([ACTIONS.kt_draw, ACTIONS.kt_rdraw, ACTIONS.kt_draw], E, .35),
    kt_hfrost: { ...string([{ ...ACTIONS.kt_rdraw }, chop({ two: 1, yaw: .1, t: [.18, .3, .4] })], E, .4) },
    kt_lpetal: string([whirl({ dur: .95, turns: 2, two: 1, h: -.28, p: -.25, low: .14, t: [.1, .74] }), ACTIONS.kt_ldraw], EL, .3),
    kt_fin2: whirl({ dur: 1.05, turns: 2, two: 1, h: .05, rise: .2, t: [.14, .8], end: E }),
  });
  S('kt_draw', 'Draw-cut', 'kt_draw', 44, { reach: 2.6, arc: 170, move: .9 });
  S('kt_rdraw', 'Rising Draw', 'kt_rdraw', 46, { reach: 2.6, arc: 140, pop: 5.5, move: .8 });
  S('kt_cut', 'Two-hand Cut', 'kt_cut', 44, { reach: 2.6, arc: 160, move: .7 });
  S('kt_back', 'Returning Cut', 'kt_back', 44, { reach: 2.6, arc: 160, move: .7 });
  S('kt_thrust', 'Piercing Thrust', 'kt_thrust', 48, { reach: 2.8, arc: 45, move: 1.4 });
  S('kt_dash', 'Passing Draw', 'kt_dash', 50, { reach: 2.6, arc: 170, move: 4.6, fixedMove: true, pass: true });
  S('kt_three', 'Three Frosts', 'kt_three', 40, { reach: 2.7, arc: 170, multi: .32, last: 2, cost: 22, move: 1.4 });
  S('kt_hchop', 'Downward Cut', 'kt_hchop', 62, { reach: 2.7, arc: 90, move: .9 });
  S('kt_hcross', 'Winter Cross', 'kt_hcross', 60, { reach: 2.7, arc: 130, move: .9 });
  S('kt_hrise', 'Winter Rise', 'kt_hrise', 60, { reach: 2.6, arc: 130, pop: 6, move: .8 });
  S('kt_hstep', 'Falling Frost', 'kt_hstep', 70, { reach: 2.7, arc: 110, move: 3.0, fixedMove: true, aoe: 1.8, aoeAt: 1.6 });
  S('kt_hfrost', 'Frostfall Draw', 'kt_hfrost', 70, { reach: 2.8, arc: 120, multi: .5, last: 1.6, heavy: true, cost: 26, move: 1.2, wave: { len: 10, speed: 20, w: .9, dmg: .7, color: 0xbfe6ff, at: 1.0 } });
  S('kt_ldraw', 'Low Draw', 'kt_ldraw', 38, { reach: 2.6, arc: 170, pop: 3.2, move: .8 });
  S('kt_lrdraw', 'Crescent Draw', 'kt_lrdraw', 40, { reach: 2.5, arc: 120, pop: 6, move: .6 });
  S('kt_lsweep', 'Frost Wheel', 'kt_lsweep', 38, { reach: 2.6, arc: 360, pop: 3.2, move: .5 });
  S('kt_ldash', 'Low Passing Draw', 'kt_ldash', 44, { reach: 2.6, arc: 170, move: 4.6, fixedMove: true, pass: true, pop: 3.2 });
  S('kt_lpetal', 'Scattering Petals', 'kt_lpetal', 24, { reach: 2.7, arc: 360, multi: .14, last: 2.4, cost: 22, move: 1.2 });
  D('kt_heavyH', 'Frostfall', 'kt_hstep', { dmg: 118, ki: 75, poise: 45, heavy: true, charge: .2, cost: 30, aoe: 2.4 });
  D('kt_heavyM', 'Moon-Splitting Draw', 'kt_draw', { dmg: 100, ki: 60, poise: 36, heavy: true, charge: .06, cost: 26, wave: { len: 10, speed: 22, w: .9, dmg: .7, color: 0xbfe6ff } });
  D('kt_heavyL', 'Rime Needle', 'kt_ldash', { dmg: 66, ki: 40, poise: 24, heavy: true, charge: .06, cost: 18, move: 5.2 });
  D('kt_fin1', 'Rising Frost', 'kt_rdraw', { dmg: 64, ki: 40, poise: 30, pop: 9.5, fin: true, heavy: true, cost: 18 });
  S('kt_fin2', 'Winter Wheel', 'kt_fin2', 28, { reach: 2.8, arc: 360, multi: .12, kb: 5, fin: true, heavy: true, cost: 22, move: 1.0 });
  D('kt_fin3', 'Rime Piercer', 'kt_thrust', { dmg: 120, ki: 70, poise: 45, move: 2.2, fixedMove: true, fin: true, heavy: true, cost: 26, wave: { len: 11, speed: 24, w: .7, dmg: .8, color: 0xbfe6ff } });
  D('kt_run', 'Running Draw', 'kt_dash', { dmg: 54 });
  D('kt_ddash', 'Dash Cut', 'kt_cut', { dmg: 48, move: 1.8 });
  D('kt_slide', 'Sliding Draw', 'kt_ldraw', { move: 2.6, fixedMove: true, speed: 1.2, cost: 10 });
  D('kt_sw', 'Switch Strike', 'kt_fin2', { dmg: 28, fin: false, heavy: false, cost: 8 });
  kit('katana', {
    heavy: { high: 'kt_heavyH', mid: 'kt_heavyM', low: 'kt_heavyL' }, run: 'kt_run', dash: 'kt_ddash', switch: 'kt_sw',
    fin: ['kt_fin1', 'kt_fin2', 'kt_fin3'], slide: 'kt_slide', air: airChain('kt', ['kt_draw', 'kt_back', 'kt_cut']),
    forms: {
      high: { name: 'Winter Moon', neutral: ['kt_hchop', 'kt_hcross', 'kt_hrise'], forward: ['kt_hstep', 'kt_hcross', 'kt_hrise'], pause: 'kt_hfrost' },
      mid: { name: 'Still Water', neutral: ['kt_draw', 'kt_cut', 'kt_back', 'kt_thrust'], forward: ['kt_dash', 'kt_cut', 'kt_rdraw'], pause: 'kt_three' },
      low: { name: 'Drawn Frost', neutral: ['kt_ldraw', 'kt_lrdraw', 'kt_lsweep'], forward: ['kt_ldash', 'kt_ldraw', 'kt_lrdraw'], pause: 'kt_lpetal' },
    },
  });
}

// ==================================================================== Moonring (thrown Glaives)
// A bladed ring: punched in close, carved round in arcs, rolled round the hand and wheeled overhead, and
// every heavy throws it (player.js brings it home).
{
  const E = { ...SWORD_END, ...REC }, EL = { ...SWORD_END, hiltH: -.3, chestRx: .2, ...LOWREC };
  anims({
    rg_arc: cut({ dur: .5, s: 1, h0: .1, h1: 0, t: [.1, .17, .25], end: E }),
    rg_back: cut({ dur: .5, s: -1, h0: 0, h1: .1, t: [.1, .17, .25], end: E }),
    rg_punch: thrust({ dur: .44, h: .1, reach: .6, t: [.06, .13, .2], legs: DEEP, end: E }),
    rg_orbit: whirl({ dur: .72, h: .05, t: [.1, .54], r: .56, end: E }),
    rg_loop: windmill({ dur: .66, turns: 2, a: -.25, h: .06, r: .5, t: [.08, .5], end: E }),
    rg_hfall: chop({ dur: .7, two: 0, yaw: .1, t: [.2, .32, .42], end: E }),
    rg_hrise: upcut({ dur: .62, two: 0, t: [.14, .22, .3], jump: .1, end: E }),
    rg_hloop: twirl({ dur: .8, turns: 2, h: .48, t: [.1, .6], end: E }),
    rg_hleap: chop({ dur: .9, two: 0, hop: .3, yaw: .1, t: [.28, .48, .58], end: E }),
    rg_dart: thrust({ dur: .52, h: .06, reach: .62, t: [.1, .18, .3], lead: { lift: -.2, chestRx: .4, thLx: -1.0, knL: .8, thRx: .9, knR: .4, wings: 2 }, end: E }),
    rg_larc: cut({ dur: .5, s: 1, h0: -.28, h1: -.3, p0: -.3, p1: -.35, t: [.1, .17, .26], legs: CROUCH, end: EL }),
    rg_lloop: windmill({ dur: .66, turns: 2, a: -.3, h: -.2, r: .5, t: [.08, .5], legs: CROUCH, end: EL }),
    rg_lorbit: whirl({ dur: .75, h: -.3, p: -.2, low: .14, t: [.1, .56], r: .56, end: EL }),
  });
  anims({
    rg_triple: whirl({ dur: 1.15, turns: 3, h: .05, t: [.12, .92], r: .56, end: E }),
    rg_hmoon: string([ACTIONS.rg_hrise, ACTIONS.rg_hloop, ACTIONS.rg_hfall], E, .3),
    rg_lstorm: string([whirl({ dur: .95, turns: 2, h: -.28, p: -.2, low: .14, t: [.1, .74], r: .56 }), ACTIONS.rg_hrise], E, .3),
    rg_fin2: whirl({ dur: 1.0, turns: 2, h: .12, p: .2, rise: .3, t: [.12, .78], r: .56, end: E }),
  });
  S('rg_arc', 'Ring Arc', 'rg_arc', 36, { reach: 2.3, arc: 170, move: .7 });
  S('rg_back', 'Return Arc', 'rg_back', 36, { reach: 2.3, arc: 170, move: .7 });
  S('rg_punch', 'Ring Punch', 'rg_punch', 34, { reach: 2.1, arc: 60, ki: 30, kb: 4, move: .9 });
  S('rg_orbit', 'Orbit', 'rg_orbit', 34, { reach: 2.5, arc: 360, move: .5 });
  S('rg_loop', 'Moon Loop', 'rg_loop', 16, { reach: 2.3, arc: 100, multi: .1, pop: 3, move: .6 });
  S('rg_hfall', 'Falling Ring', 'rg_hfall', 52, { reach: 2.3, arc: 90, move: .9 });
  S('rg_hrise', 'Rising Ring', 'rg_hrise', 46, { reach: 2.3, arc: 110, pop: 6.5, move: .6 });
  S('rg_hloop', 'Crown Loop', 'rg_hloop', 20, { reach: 2.5, arc: 360, multi: .12, move: .4 });
  S('rg_hleap', 'Moonfall Ring', 'rg_hleap', 62, { reach: 2.3, arc: 110, move: 3.0, fixedMove: true, aoe: 1.8, aoeAt: 1.3, pop: 3.2 });
  S('rg_dart', 'Rolling Ring', 'rg_dart', 38, { reach: 2.4, arc: 60, move: 3.6, fixedMove: true });
  S('rg_triple', 'Triple Orbit', 'rg_triple', 18, { reach: 2.6, arc: 360, multi: .12, last: 2, cost: 20, move: 1.0 });
  S('rg_hmoon', 'Moonlit Arc', 'rg_hmoon', 28, { reach: 2.5, arc: 360, multi: .26, last: 1.8, pop: 3.2, cost: 22, move: .8 });
  S('rg_larc', 'Low Arc', 'rg_larc', 32, { reach: 2.3, arc: 170, pop: 3.2, move: .6 });
  S('rg_lloop', 'Rolling Loop', 'rg_lloop', 15, { reach: 2.3, arc: 100, multi: .1, pop: 3, move: .6 });
  S('rg_lorbit', 'Low Orbit', 'rg_lorbit', 32, { reach: 2.5, arc: 360, pop: 3.2, move: .5 });
  S('rg_lstorm', 'Ring Storm', 'rg_lstorm', 20, { reach: 2.6, arc: 360, multi: .14, last: 2.2, cost: 22, move: 1.2 });
  D('rg_ldart', 'Low Rolling Ring', 'rg_dart', { dmg: 34, pop: 3.2 });
  D('rg_fin1', 'Moonrise', 'rg_hrise', { dmg: 58, ki: 40, poise: 28, pop: 9.5, fin: true, heavy: true, cost: 16 });
  S('rg_fin2', 'Wheeling Moon', 'rg_fin2', 22, { reach: 2.7, arc: 360, multi: .12, kb: 5, pop: 4, fin: true, heavy: true, cost: 20, move: 1.0 });
  D('rg_fin3', 'Full Moon', 'rg_punch', { dmg: 100, ki: 70, poise: 40, move: 1.6, fin: true, heavy: true, cost: 22, kb: 8, wave: { len: 9, speed: 20, w: 1.3, dmg: .9, color: 0xd8f8ff, at: .14 } });
  D('rg_run', 'Running Ring', 'rg_dart', { dmg: 42 });
  D('rg_dash', 'Dash Arc', 'rg_arc', { dmg: 42, move: 1.8 });
  D('rg_slide', 'Sliding Orbit', 'rg_lorbit', { speed: 1.25, move: 2.6, fixedMove: true, cost: 9 });
  D('rg_sw', 'Switch Strike', 'rg_orbit', { dmg: 38, cost: 7 });
  kit('ring', {
    heavy: { high: 'rg_throw', mid: 'rg_throw', low: 'rg_throw' }, run: 'rg_run', dash: 'rg_dash', switch: 'rg_sw',
    fin: ['rg_fin1', 'rg_fin2', 'rg_fin3'], slide: 'rg_slide', air: airChain('rg', ['rg_arc', 'rg_back', 'rg_orbit']),
    forms: {
      high: { name: 'Moonlit Arc', neutral: ['rg_hfall', 'rg_hrise', 'rg_hloop'], forward: ['rg_hleap', 'rg_hrise', 'rg_hfall'], pause: 'rg_hmoon' },
      mid: { name: 'Orbit', neutral: ['rg_arc', 'rg_back', 'rg_punch', 'rg_orbit'], forward: ['rg_dart', 'rg_back', 'rg_orbit'], pause: 'rg_triple' },
      low: { name: 'Rolling Ring', neutral: ['rg_larc', 'rg_lloop', 'rg_lorbit'], forward: ['rg_ldart', 'rg_larc', 'rg_lloop'], pause: 'rg_lstorm' },
    },
  });
}
