// Keyframes for the stance forms (see movesets.js): each weapon's High and Low forms, the forward chains,
// pause combos, finishers, slide attacks and the movement poses (slide, Wingleap, glide).
// Channels as in knight.js: hiltA turns the hilt round the chest (+ to the knight's left), hiltR / hiltH
// set its reach and height, bladeYaw / bladePitch aim the blade (a pitch past π/2 points it back over the
// head, which keeps overhead chops in one plane), bladeRoll turns the edge. lb* aim the off-hand fang.
import { ACTIONS, K, LUNGE, SOFT, vary, airVariant } from './knight.js';

const LUNGE_R = { thLx: .45, knL: .35, thRx: -.55, knR: .5, lift: -.08 };
const DEEP = { lift: -.22, thLx: -1.0, knL: .9, thRx: .8, knR: .45 };
const REC = { lift: -.04, thLx: -.25, knL: .3, thRx: .2, knR: .3 };
const LOWREC = { lift: -.1, thLx: -.35, knL: .5, thRx: .3, knR: .5 };
const CROUCH = { lift: -.26, thLx: -.95, knL: 1.25, thRx: .55, knR: .95 };
const HOP = { lift: .34, thLx: -.9, knL: 1.35, thRx: .35, knR: 1.1, wings: 2 };
// Resting holds, to end on: the sword at mid, the glaive at mid, the fangs at mid and high.
const SWORD_END = { hiltA: -.5, hiltR: .38, hiltH: -.1, bladeYaw: .2, bladePitch: .3, bladeRoll: 0, chestRy: 0, twoHand: 0 };
const GLAIVE_END = { chestRy: -.55, chestRx: .05, hiltA: -.95, hiltR: .27, hiltH: -.18, bladeYaw: .62, bladePitch: .2, bladeRoll: 0, twoHand: 1 };
const FANGS_END = { hiltA: -.6, hiltR: .34, hiltH: -.05, bladeYaw: .3, bladePitch: .35, bladeRoll: 0, lhX: .26, lhY: -.08, lhZ: .3, lbYaw: 2.7, lbPitch: -.35, lbRoll: 0, twoHand: 0 };
const FANGS_HIGH = { hiltA: -.5, hiltR: .28, hiltH: .3, bladeYaw: .2, bladePitch: .9, bladeRoll: 0, lhX: .24, lhY: .22, lhZ: .22, lbYaw: .3, lbPitch: .8, lbRoll: 0, twoHand: 0 };

// Rapid alternating thrusts, main hand then off hand (or the one blade, for the sword).
export function flurry({ n, t0, step, dur, low = 0, fangs = true, finale = null }) {
  const MO = { hiltA: -.18, hiltR: .6, hiltH: .05 - low, bladeYaw: 0, bladePitch: .02 - low * .6, bladeRoll: 1.57 };
  const MB = { hiltA: -.62, hiltR: .24, hiltH: 0 - low, bladeYaw: .2, bladePitch: .15 - low * .6 };
  const OO = { lhX: .08, lhY: .03 - low, lhZ: .6, lbYaw: 0, lbPitch: .02 - low * .6, lbRoll: 1.57 };
  const OB = { lhX: .32, lhY: -.02 - low, lhZ: .24, lbYaw: .5, lbPitch: .2 - low * .6, lbRoll: 1.57 };
  const legs = low ? { ...CROUCH, lift: -.2 } : LUNGE;
  const keys = [K(0, { ...MB, ...(fangs ? OB : {}), twoHand: 0, chestRy: 0, chestRx: .15 + low * .4, ...legs })];
  for (let i = 0; i < n; i++) {
    const t = t0 + i * step, main = !fangs || i % 2 === 0;
    keys.push(K(t - step * .45, main ? { ...MB, chestRy: -.15 } : { ...(fangs ? OB : MB), chestRy: .15 }));
    keys.push(K(t, main ? { ...MO, ...(fangs ? OB : {}), chestRy: .2, hiltH: MO.hiltH + (i % 3 - 1) * .1 } : { ...MB, ...OO, chestRy: -.2, lhY: OO.lhY + (i % 3 - 1) * .1 }));
  }
  const tEnd = t0 + n * step;
  if (finale) keys.push(...finale(tEnd));
  else keys.push(K(tEnd + .02, { ...MO, ...(fangs ? OO : {}), hiltR: .64, chestRy: 0, chestRx: .3, ...DEEP, wings: 2 }));
  keys.push(K(dur, { ...(fangs ? FANGS_END : SWORD_END), chestRx: .1, ...(low ? LOWREC : REC) }));
  return { dur, keys };
}

Object.assign(ACTIONS, {
  // ================================================================ Fae Sword
  // Mid, moving: a stepping thrust.
  s_lunge: { dur: .6, keys: [
    K(0, { hiltA: -.85, hiltR: .22, hiltH: -.02, bladeYaw: .05, bladePitch: .04, bladeRoll: 1.57, chestRy: -.55, chestRx: .1, lhX: .3, lhY: .02, lhZ: .34, twoHand: 0, ...LUNGE_R }),
    K(.12, { hiltA: -1.0, hiltR: .14, chestRy: -.72, lift: -.1 }),
    K(.2, { hiltA: -.08, hiltR: .62, hiltH: .04, bladeYaw: 0, bladePitch: .02, chestRy: .15, chestRx: .28, lhX: .42, lhY: -.12, lhZ: -.18, ...DEEP, wings: 1.4 }),
    K(.3, { hiltA: -.06, hiltR: .6 }),
    K(.6, { ...SWORD_END, chestRx: .12, lhX: .26, lhY: -.34, lhZ: .08, ...REC }),
  ] },
  // A rising cut, low left to high right, edge up.
  s_rise: { dur: .66, keys: [
    K(0, { hiltA: .75, hiltR: .38, hiltH: -.32, bladeYaw: 2.0, bladePitch: -.55, bladeRoll: 0, chestRy: .5, chestRx: .2, twoHand: 0, lhX: .3, lhY: -.15, lhZ: .25, lift: -.14, thLx: -.6, knL: .8, thRx: .35, knR: .6 }),
    K(.1, { hiltA: .9, hiltH: -.38, bladeYaw: 2.3, bladePitch: -.65, chestRy: .68, lift: -.2 }),
    K(.2, { hiltA: .05, hiltR: .56, hiltH: .02, bladeYaw: 0, bladePitch: .35, chestRy: 0, chestRx: 0, ...LUNGE }),
    K(.3, { hiltA: -.85, hiltR: .4, hiltH: .48, bladeYaw: -1.4, bladePitch: 1.15, chestRy: -.55, chestRx: -.25, lift: .08, wings: 1.6 }),
    K(.66, { hiltA: -.5, hiltR: .36, hiltH: .25, bladeYaw: -.6, bladePitch: .7, chestRy: -.2, chestRx: -.05, ...REC }),
  ] },
  // Mid pause combo: Triple Moon, three thrusts high, middle and low, and a driving fourth.
  s_triple: flurry({ n: 3, t0: .14, step: .16, dur: .95, fangs: false, finale: t => [
    K(t - .06, { hiltA: -.9, hiltR: .12, hiltH: .05, bladeYaw: .02, bladePitch: .02, bladeRoll: 1.57, chestRy: -.8, lift: -.1 }),
    K(t + .04, { hiltA: -.12, hiltR: .64, hiltH: .05, bladeYaw: 0, bladePitch: 0, chestRy: .25, chestRx: .3, ...DEEP, wings: 2 }),
  ] }),

  // High form, Falling Star: two-handed cleaves.
  s_hcleave: { dur: .72, keys: [
    K(0, { hiltA: -.55, hiltR: .2, hiltH: .52, bladeYaw: -2.5, bladePitch: .95, bladeRoll: .6, twoHand: 1, chestRy: -.5, chestRx: -.18, thLx: -.2, knL: .25, thRx: .3, knR: .35 }),
    K(.18, { hiltA: -.65, hiltR: .16, hiltH: .62, bladeYaw: -2.7, bladePitch: 1.05, chestRy: -.66, chestRx: -.25 }),
    K(.29, { hiltA: -.05, hiltR: .5, hiltH: .2, bladeYaw: -.1, bladePitch: .3, chestRy: -.05, chestRx: .15, ...LUNGE }),
    K(.4, { hiltA: .7, hiltR: .36, hiltH: -.28, bladeYaw: 1.5, bladePitch: -.7, chestRy: .5, chestRx: .42, lift: -.2, thLx: -.85, knL: .95, thRx: .55, knR: .7 }),
    K(.72, { hiltA: .35, hiltR: .34, hiltH: -.2, bladeYaw: .7, bladePitch: -.35, chestRy: .22, chestRx: .2, twoHand: .7, ...REC }),
  ] },
  s_hrise: { dur: .74, keys: [
    K(0, { hiltA: .65, hiltR: .34, hiltH: -.3, bladeYaw: 1.7, bladePitch: -.6, bladeRoll: 0, twoHand: 1, chestRy: .5, chestRx: .3, lift: -.16, thLx: -.7, knL: .85, thRx: .5, knR: .65 }),
    K(.16, { hiltA: .78, hiltH: -.36, bladeYaw: 2.05, bladePitch: -.7, chestRy: .66, lift: -.22 }),
    K(.28, { hiltA: 0, hiltR: .5, hiltH: .1, bladeYaw: 0, bladePitch: .4, chestRy: 0, chestRx: 0, ...LUNGE_R }),
    K(.38, { hiltA: -.6, hiltR: .28, hiltH: .58, bladeYaw: -1.1, bladePitch: 1.3, chestRy: -.45, chestRx: -.28, lift: .06, wings: 1.6 }),
    K(.74, { hiltA: -.4, hiltR: .24, hiltH: .45, bladeYaw: -.5, bladePitch: 1.05, chestRy: -.2, chestRx: -.1, ...REC }),
  ] },
  // A hop and a two-handed slam.
  s_hslam: { dur: .95, keys: [
    K(0, { hiltA: -.3, hiltR: .32, hiltH: .15, bladeYaw: 0, bladePitch: .8, bladeRoll: 0, twoHand: 1, chestRx: .1, lift: -.16, thLx: -.6, knL: .9, thRx: .3, knR: .9 }),
    K(.2, { hiltA: -.1, hiltR: .08, hiltH: .7, bladePitch: 2.5, chestRx: -.38, ...HOP }),
    K(.36, { hiltH: .72, bladePitch: 2.7, lift: .38 }),
    K(.47, { hiltA: 0, hiltR: .52, hiltH: -.28, bladePitch: -1.0, chestRx: .7, lift: -.3, thLx: -1.0, knL: 1.3, thRx: .7, knR: 1.1, wings: 1 }),
    K(.95, { hiltA: -.3, hiltR: .42, hiltH: -.2, bladeYaw: .1, bladePitch: -.35, chestRx: .2, twoHand: .3, ...REC }),
  ] },
  // High, moving: a stepping two-handed cut across the body.
  s_hstep: { dur: .7, keys: [
    K(0, { hiltA: -1.05, hiltR: .3, hiltH: .22, bladeYaw: -2.2, bladePitch: .2, bladeRoll: -1.57, twoHand: 1, chestRy: -.7, chestRx: 0, ...LUNGE_R }),
    K(.16, { hiltA: -1.15, hiltR: .26, bladeYaw: -2.5, chestRy: -.85 }),
    K(.27, { hiltA: -.05, hiltR: .55, hiltH: .15, bladeYaw: 0, bladePitch: .02, chestRy: 0, ...DEEP, wings: 1.4 }),
    K(.38, { hiltA: 1.05, hiltR: .4, hiltH: .1, bladeYaw: 2.1, bladePitch: -.05, chestRy: .7 }),
    K(.7, { hiltA: .6, hiltR: .34, hiltH: .05, bladeYaw: 1.1, bladePitch: .2, bladeRoll: -1.2, chestRy: .35, twoHand: .8, ...REC }),
  ] },
  // A two-handed wheel, blade level with the shoulders.
  s_hwheel: { dur: .9, spinY: true, keys: [
    K(0, { bodyRy: 0, hiltA: -.55, hiltR: .44, hiltH: .15, bladeYaw: -1.55, bladePitch: .02, bladeRoll: -1.57, twoHand: 1, chestRy: -.3, ...LUNGE }),
    K(.16, { bodyRy: -.6, chestRy: -.5, lift: -.16 }),
    K(.5, { bodyRy: 5.8, chestRy: .05, lift: -.12, wings: 1.9 }),
    K(.62, { bodyRy: 6.283, hiltA: .45, bladeYaw: 1.1, chestRy: .35 }),
    K(.9, { bodyRy: 6.283, hiltA: -.3, hiltR: .34, hiltH: .22, bladeYaw: -.1, bladePitch: .7, bladeRoll: 0, twoHand: .8, chestRy: 0, ...REC }),
  ] },
  // High pause combo: the Sundering Blow, a long draw overhead and a cleave that throws moonlight.
  s_hsunder: { dur: 1.1, keys: [
    K(0, { hiltA: -.2, hiltR: .3, hiltH: .18, bladeYaw: 0, bladePitch: .9, bladeRoll: 0, twoHand: 1, chestRx: -.05, lift: -.04 }),
    K(.3, { hiltA: -.1, hiltR: .05, hiltH: .78, bladePitch: 2.4, chestRx: -.45, lift: .04, thLx: .05, knL: .1, thRx: .25, knR: .25, wings: 2 }),
    K(.46, { bladePitch: 2.6, chestRx: -.5 }),
    K(.54, { hiltA: 0, hiltR: .55, hiltH: .1, bladePitch: -.2, chestRx: .5, ...DEEP }),
    K(.62, { hiltR: .5, hiltH: -.36, bladePitch: -1.05, chestRx: .78, lift: -.3 }),
    K(1.1, { hiltA: -.3, hiltR: .42, hiltH: -.25, bladeYaw: .1, bladePitch: -.35, chestRx: .2, twoHand: .3, ...REC }),
  ] },

  // Low form, Crescent Tide: draw-cuts at the hip, backhands and sweeps.
  s_ldraw: { dur: .48, keys: [
    K(0, { hiltA: .75, hiltR: .28, hiltH: -.26, bladeYaw: 2.8, bladePitch: -.25, bladeRoll: 1.57, chestRy: .55, chestRx: .25, lhX: .25, lhY: -.14, lhZ: .3, twoHand: 0, lift: -.16, thLx: -.65, knL: .75, thRx: .5, knR: .55 }),
    K(.07, { hiltA: .55, hiltR: .34, bladeYaw: 2.3, chestRy: .5 }),
    K(.14, { hiltA: -.1, hiltR: .58, hiltH: -.12, bladeYaw: 0, bladePitch: -.05, chestRy: 0, ...DEEP }),
    K(.22, { hiltA: -1.1, hiltR: .44, hiltH: -.08, bladeYaw: -2.1, bladePitch: 0, chestRy: -.6, wings: 1.3 }),
    K(.48, { hiltA: -.8, hiltR: .34, hiltH: -.3, bladeYaw: -.4, bladePitch: -.3, chestRy: -.25, ...LOWREC }),
  ] },
  s_lback: { dur: .5, keys: [
    K(0, { hiltA: -1.0, hiltR: .4, hiltH: -.3, bladeYaw: -2.2, bladePitch: -.2, bladeRoll: -1.57, chestRy: -.55, chestRx: .3, twoHand: 0, lhX: .3, lhY: -.2, lhZ: .2, lift: -.16, thLx: .3, knL: .5, thRx: -.5, knR: .6 }),
    K(.09, { hiltA: -1.15, bladeYaw: -2.5, chestRy: -.7 }),
    K(.17, { hiltA: 0, hiltR: .58, hiltH: -.22, bladeYaw: 0, bladePitch: -.2, chestRy: 0, lift: -.24, thLx: -.9, knL: .9, thRx: .6, knR: .7 }),
    K(.25, { hiltA: 1.0, hiltR: .45, hiltH: -.2, bladeYaw: 2.0, bladePitch: -.2, chestRy: .6 }),
    K(.5, { hiltA: .5, hiltR: .35, hiltH: -.3, bladeYaw: .8, bladePitch: -.3, chestRy: .25, ...LOWREC }),
  ] },
  // Six quick cuts, side to side at the knees.
  s_lflurry: (() => {
    const R = { hiltA: -.95, hiltR: .46, bladeYaw: -1.9, bladeRoll: -1.57, chestRy: -.4 }, L = { hiltA: .85, hiltR: .44, bladeYaw: 1.9, bladeRoll: 1.57, chestRy: .4 };
    return { dur: .78, keys: [
      K(0, { ...R, hiltH: -.15, bladePitch: -.1, chestRx: .3, twoHand: 0, lhX: .3, lhY: -.1, lhZ: .3, lift: -.14, thLx: -.6, knL: .8, thRx: .45, knR: .6 }),
      K(.1, { ...L, hiltH: -.2 }), K(.19, { ...R, hiltH: -.05 }), K(.28, { ...L, hiltH: -.25 }),
      K(.37, { ...R, hiltH: -.1, lift: -.18 }), K(.46, { ...L, hiltH: -.15 }),
      K(.56, { ...R, hiltH: -.1, hiltR: .5, chestRx: .4, ...DEEP, wings: 1.6 }),
      K(.78, { hiltA: -.6, hiltR: .34, hiltH: -.25, bladeYaw: -.3, bladePitch: -.2, bladeRoll: 0, chestRy: -.1, ...LOWREC }),
    ] };
  })(),
  // A crouching sweep round at the ankles.
  s_lsweep: { dur: .82, spinY: true, keys: [
    K(0, { bodyRy: 0, hiltA: -1.0, hiltR: .52, hiltH: -.42, bladeYaw: -1.6, bladePitch: -.28, bladeRoll: -1.57, chestRy: -.2, chestRx: .35, twoHand: 0, lhX: .45, lhY: -.1, lhZ: -.05, lift: -.24, thLx: -1.1, knL: 1.4, thRx: .5, knR: .6 }),
    K(.14, { bodyRy: -.5, lift: -.36 }),
    K(.5, { bodyRy: 5.8, lift: -.38, wings: 1.8 }),
    K(.6, { bodyRy: 6.283, hiltA: .45, bladeYaw: 1.2, chestRy: .3 }),
    K(.82, { bodyRy: 6.283, hiltA: -.7, hiltR: .34, hiltH: -.3, bladeYaw: -.3, bladePitch: -.3, bladeRoll: 0, chestRy: -.1, ...LOWREC }),
  ] },
  // A rising cut straight up out of a crouch: small foes leave the ground.
  s_lrise: { dur: .6, keys: [
    K(0, { hiltA: -.25, hiltR: .4, hiltH: -.42, bladeYaw: 0, bladePitch: -.9, bladeRoll: 0, twoHand: 0, lhX: .3, lhY: -.2, lhZ: .3, chestRx: .5, lift: -.3, thLx: -1.0, knL: 1.3, thRx: .4, knR: 1.1 }),
    K(.12, { hiltH: -.46, bladePitch: -1.0, lift: -.34 }),
    K(.22, { hiltA: -.1, hiltR: .55, hiltH: .05, bladePitch: .2, chestRx: .1, ...LUNGE, lift: -.05 }),
    K(.32, { hiltA: -.15, hiltR: .3, hiltH: .6, bladePitch: 1.45, chestRx: -.3, lift: .1, wings: 1.8 }),
    K(.6, { hiltA: -.4, hiltR: .3, hiltH: .35, bladeYaw: -.3, bladePitch: .9, chestRx: -.05, ...REC }),
  ] },
  // Low pause combo: Petal Storm, the blade held at the hip, then drawn round twice.
  s_lpetal: { dur: 1.05, spinY: true, keys: [
    K(0, { bodyRy: 0, hiltA: .8, hiltR: .26, hiltH: -.28, bladeYaw: 2.9, bladePitch: -.3, bladeRoll: 1.57, chestRy: .6, chestRx: .3, twoHand: 0, lhX: .22, lhY: -.16, lhZ: .28, lift: -.22, thLx: -.8, knL: 1.0, thRx: .6, knR: .7, wings: .6 }),
    K(.26, { bodyRy: 0, hiltA: .85, chestRy: .66, lift: -.27, wings: .2 }),
    K(.34, { bodyRy: -.3, hiltA: -1.2, hiltR: .56, hiltH: -.05, bladeYaw: -1.6, bladePitch: 0, bladeRoll: -1.57, chestRy: -.2, lift: -.16, wings: 2 }),
    K(.66, { bodyRy: 12.566, hiltA: -1.1, bladeYaw: -1.5, lift: -.12 }),
    K(.76, { bodyRy: 12.566, hiltA: .4, bladeYaw: 1.3, chestRy: .4 }),
    K(1.05, { bodyRy: 12.566, hiltA: -.6, hiltR: .36, hiltH: -.25, bladeYaw: -.2, bladePitch: -.2, bladeRoll: 0, chestRy: 0, ...LOWREC }),
  ] },

  // Sword finishers (strike, then heavy). Moonrise: a two-handed rising cut that throws small foes up.
  s_fin1: { dur: .8, keys: [
    K(0, { hiltA: .4, hiltR: .3, hiltH: -.35, bladeYaw: 2.6, bladePitch: -.75, bladeRoll: 0, twoHand: 1, chestRy: .45, chestRx: .45, lift: -.26, thLx: -.9, knL: 1.2, thRx: .5, knR: 1.0 }),
    K(.16, { hiltA: .5, hiltH: -.4, bladeYaw: 2.9, bladePitch: -.85, chestRy: .6, lift: -.32 }),
    K(.26, { hiltA: 0, hiltR: .5, hiltH: 0, bladeYaw: 0, bladePitch: .2, chestRy: 0, chestRx: .05, ...LUNGE, lift: -.04 }),
    K(.36, { hiltA: -.1, hiltR: .22, hiltH: .7, bladePitch: 1.45, chestRx: -.4, lift: .25, thLx: -.5, knL: .9, thRx: .2, knR: .7, wings: 2 }),
    K(.8, { hiltA: -.3, hiltR: .26, hiltH: .4, bladeYaw: -.2, bladePitch: 1.0, chestRx: -.1, twoHand: .6, ...REC }),
  ] },
  // Wheel of Thorns: two turns, the blade spiralling upward.
  s_fin2: { dur: 1.0, spinY: true, keys: [
    K(0, { bodyRy: 0, hiltA: -1.2, hiltR: .56, hiltH: -.1, bladeYaw: -1.7, bladePitch: -.1, bladeRoll: -1.57, chestRy: -.2, twoHand: 0, lhX: .5, lhY: .05, lhZ: 0, ...LUNGE, lift: -.12 }),
    K(.14, { bodyRy: -.5, lift: -.16 }),
    K(.72, { bodyRy: 12.566, hiltH: .25, bladePitch: .3, lift: .02, wings: 2 }),
    K(1.0, { bodyRy: 12.566, ...SWORD_END, chestRy: .1, ...REC }),
  ] },
  // Moonpiercer: a drawn-back, held thrust that sends a lance of moonlight on.
  s_fin3: { dur: 1.0, keys: [
    K(0, { hiltA: -.95, hiltR: .12, hiltH: .1, bladeYaw: .02, bladePitch: .05, bladeRoll: 1.57, twoHand: 0, lhX: .38, lhY: .12, lhZ: .42, chestRy: -.8, chestRx: .05, ...LUNGE_R, lift: -.12 }),
    K(.36, { hiltA: -1.05, hiltR: .08, chestRy: -.95, lift: -.2, wings: 1.2 }),
    K(.46, { hiltA: -.05, hiltR: .64, hiltH: .06, bladeYaw: 0, bladePitch: .02, chestRy: .25, chestRx: .3, lhX: .45, lhY: -.1, lhZ: -.2, ...DEEP, lift: -.26, wings: 2 }),
    K(.62, { hiltR: .62 }),
    K(1.0, { ...SWORD_END, chestRx: .1, lhX: .26, lhY: -.34, lhZ: .08, ...REC }),
  ] },

  // ================================================================ Moonglaive
  // Mid, moving: two thrusts.
  g_dthrust: (() => {
    const B = { chestRy: -.78, hiltA: -1.3, hiltR: .16, hiltH: -.1, bladeYaw: .82, bladePitch: .06, bladeRoll: 0, twoHand: 1 };
    const O = { chestRy: -.68, hiltA: -.3, hiltR: .42, hiltH: 0, bladeYaw: .68, bladePitch: .03 };
    return { dur: .7, keys: [
      K(0, { ...B, lift: -.06, thLx: -.35, knL: .45, thRx: .3, knR: .4 }),
      K(.16, { ...O, ...LUNGE, wings: 1.2 }),
      K(.25, { ...B, hiltH: -.05 }),
      K(.36, { ...O, hiltH: .05, bladePitch: .1, ...DEEP }),
      K(.7, { ...GLAIVE_END, ...REC }),
    ] };
  })(),
  // Overhead, one-handed: the glaive whirls flat above the head.
  g_helix: { dur: .95, keys: [
    K(0, { chestRy: -.2, chestRx: -.1, hiltA: -.3, hiltR: .14, hiltH: .52, bladeYaw: .3, bladePitch: -.04, bladeRoll: 1.57, twoHand: 0, lhX: .38, lhY: .22, lhZ: .12, lift: -.05, wings: 1.4 }),
    K(.12, { bladeYaw: 1.2, hiltH: .56 }),
    K(.66, { bladeYaw: 1.2 + 12.566, hiltH: .58, chestRy: .1, lift: .02, wings: 2 }),
    K(.95, { ...GLAIVE_END, bladeYaw: .62 + 12.566, ...REC }),
  ] },
  // Mid pause combo: Twin Tides, two sweeping turns that drag foes in.
  g_twin: { dur: 1.25, spinY: true, keys: [
    K(0, { bodyRy: 0, hiltA: -.8, hiltR: .42, hiltH: 0, bladeYaw: -1.4, bladePitch: -.02, bladeRoll: -1.57, chestRy: -.2, twoHand: 0, lhX: .45, lhY: .05, lhZ: 0, ...LUNGE }),
    K(.16, { bodyRy: -.6, chestRy: -.45, lift: -.14 }),
    K(.9, { bodyRy: 12.0, chestRy: .2, lift: -.1, wings: 2 }),
    K(1.0, { bodyRy: 12.566, hiltA: -.3, bladeYaw: .2, chestRy: .1 }),
    K(1.25, { bodyRy: 12.566, ...GLAIVE_END, ...REC }),
  ] },

  // High form, Moonreaper: chops from above, the butt, and reaping cuts that drag foes in.
  g_hchop: { dur: .8, keys: [
    K(0, { chestRy: -.25, chestRx: -.1, hiltA: -.4, hiltR: .2, hiltH: .4, bladeYaw: .3, bladePitch: 1.3, bladeRoll: 0, twoHand: 1, lift: -.02 }),
    K(.2, { chestRx: -.3, hiltH: .55, hiltR: .12, bladePitch: 2.15, wings: 1.4, thLx: -.1, knL: .2, thRx: .3, knR: .3 }),
    K(.3, { chestRx: .25, hiltA: -.2, hiltR: .45, hiltH: .1, bladePitch: .25, ...LUNGE }),
    K(.42, { chestRx: .55, hiltA: -.15, hiltR: .5, hiltH: -.25, bladePitch: -.45, lift: -.24, thLx: -.95, knL: 1.0, thRx: .6, knR: .8 }),
    K(.8, { ...GLAIVE_END, chestRx: .15, ...REC }),
  ] },
  // The glaive flips over: the butt jabs, then the blade comes over the top.
  g_hbutt: { dur: .9, keys: [
    K(0, { chestRy: -.5, hiltA: -.9, hiltR: .26, hiltH: -.1, bladeYaw: .5, bladePitch: .8, bladeRoll: 0, twoHand: 1, lift: -.06 }),
    K(.1, { chestRy: -.45, hiltR: .18, hiltH: .05, bladePitch: 2.9 }),
    K(.18, { chestRy: -.2, hiltA: -.25, hiltR: .56, hiltH: .05, bladePitch: 2.95, ...LUNGE }),
    K(.3, { chestRy: -.3, chestRx: -.2, hiltA: -.4, hiltR: .32, hiltH: .45, bladePitch: 2.2, wings: 1.5 }),
    K(.42, { chestRx: .25, hiltA: -.3, hiltR: .5, hiltH: .05, bladePitch: .3 }),
    K(.5, { chestRx: .5, hiltH: -.2, bladePitch: -.4, ...DEEP }),
    K(.9, { ...GLAIVE_END, chestRx: .1, ...REC }),
  ] },
  // A diagonal reap from high behind the right shoulder, down across to the left.
  g_hreap: { dur: .85, keys: [
    K(0, { chestRy: -.75, chestRx: -.1, hiltA: -1.1, hiltR: .24, hiltH: .42, bladeYaw: -2.1, bladePitch: .85, bladeRoll: .7, twoHand: 1, ...LUNGE_R }),
    K(.18, { chestRy: -.9, hiltA: -1.2, hiltH: .5, bladeYaw: -2.3, bladePitch: .95 }),
    K(.31, { chestRy: -.1, chestRx: .15, hiltA: -.3, hiltR: .44, hiltH: .15, bladeYaw: .2, bladePitch: .15, ...LUNGE, wings: 1.4 }),
    K(.44, { chestRy: .45, chestRx: .4, hiltA: .5, hiltR: .36, hiltH: -.22, bladeYaw: 1.7, bladePitch: -.45, lift: -.2 }),
    K(.85, { ...GLAIVE_END, chestRx: .1, ...REC }),
  ] },
  // High pause combo: the Reaping Cyclone, two high turns that pull everything in.
  g_hcyclone: { dur: 1.2, spinY: true, keys: [
    K(0, { bodyRy: 0, chestRy: -.3, hiltA: -.7, hiltR: .4, hiltH: .35, bladeYaw: -1.5, bladePitch: .15, bladeRoll: -1.57, twoHand: 1, ...LUNGE_R, lift: -.1 }),
    K(.28, { bodyRy: -.8, chestRy: -.5, lift: -.18, wings: 1.4 }),
    K(.88, { bodyRy: 12.566, chestRy: .1, hiltH: .45, lift: .05, wings: 2 }),
    K(.96, { bodyRy: 12.866, hiltA: .3, bladeYaw: 1.0 }),
    K(1.2, { bodyRy: 12.566, ...GLAIVE_END, ...REC }),
  ] },

  // Low form, Tidesweep: sweeps at the ankles, low thrusts and a flick that lifts.
  g_lsweep: { dur: .62, keys: [
    K(0, { chestRy: -.9, chestRx: .35, hiltA: -1.15, hiltR: .3, hiltH: -.35, bladeYaw: -.6, bladePitch: -.3, bladeRoll: -1.57, twoHand: 1, lift: -.2, thLx: -.8, knL: 1.0, thRx: .5, knR: .8 }),
    K(.14, { chestRy: -1.05, bladeYaw: -.8, lift: -.26 }),
    K(.26, { chestRy: -.2, hiltA: -.4, hiltR: .42, bladeYaw: .2, bladePitch: -.38, lift: -.3, thLz: .25, thRz: -.25 }),
    K(.36, { chestRy: .4, hiltA: .2, hiltR: .38, bladeYaw: 1.2, bladePitch: -.35 }),
    K(.62, { ...GLAIVE_END, chestRy: -.3, chestRx: .2, hiltH: -.3, bladePitch: -.1, thLz: .04, thRz: -.04, ...LOWREC }),
  ] },
  g_lspin: vary(ACTIONS.g_spin, { dur: .85, add: { hiltH: -.3, bladePitch: -.22, lift: -.16 }, set: { thLx: -.95, knL: 1.25, thRx: .55, knR: .95, chestRx: .3 } }),
  g_lthrust: vary(ACTIONS.g_thrust, { dur: .5, add: { hiltH: -.22, bladePitch: -.12, lift: -.12 }, set: { chestRx: .3 } }),
  g_lflick: { dur: .62, keys: [
    K(0, { chestRy: -.6, chestRx: .35, hiltA: -1.0, hiltR: .3, hiltH: -.38, bladeYaw: .6, bladePitch: -.42, bladeRoll: 0, twoHand: 1, lift: -.22, thLx: -.8, knL: 1.0, thRx: .5, knR: .85 }),
    K(.12, { hiltH: -.42, bladePitch: -.48, lift: -.28 }),
    K(.22, { chestRy: -.4, chestRx: 0, hiltA: -.5, hiltR: .45, hiltH: .1, bladePitch: .5, ...LUNGE, lift: -.02 }),
    K(.32, { chestRx: -.3, hiltA: -.5, hiltR: .3, hiltH: .5, bladePitch: 1.35, lift: .1, wings: 1.7 }),
    K(.62, { ...GLAIVE_END, hiltH: .15, bladePitch: .6, ...REC }),
  ] },
  // Low pause combo: the Undertow, three low turns travelling forward.
  g_lundertow: { dur: 1.2, spinY: true, keys: [
    K(0, { bodyRy: 0, hiltA: -.9, hiltR: .45, hiltH: -.38, bladeYaw: -1.45, bladePitch: -.24, bladeRoll: -1.57, chestRy: -.2, chestRx: .3, twoHand: 0, lhX: .45, lhY: -.05, lhZ: 0, ...CROUCH }),
    K(.14, { bodyRy: -.5, lift: -.3 }),
    K(.95, { bodyRy: 18.85, lift: -.28, wings: 2 }),
    K(1.2, { bodyRy: 18.85, ...GLAIVE_END, hiltH: -.3, bladePitch: -.1, ...LOWREC }),
  ] },

  // ================================================================ Twin Fangs
  // Mid, moving: both blades flung outward from a cross.
  f_twinstep: { dur: .5, keys: [
    K(0, { hiltA: .2, hiltR: .3, hiltH: .15, bladeYaw: .4, bladePitch: .6, bladeRoll: 1.57, lhX: -.05, lhY: .12, lhZ: .32, lbYaw: -.4, lbPitch: .6, lbRoll: -1.57, chestRx: -.1, twoHand: 0, ...LUNGE_R }),
    K(.1, { hiltA: -.1, hiltR: .5, hiltH: .05, bladeYaw: 0, bladePitch: .1, lhX: .1, lhY: .05, lhZ: .5, lbYaw: 0, lbPitch: .1, chestRx: .2, ...LUNGE }),
    K(.2, { hiltA: -1.0, hiltR: .45, hiltH: 0, bladeYaw: -1.9, bladePitch: -.1, lhX: .5, lhY: 0, lhZ: .15, lbYaw: 1.9, lbPitch: -.1, chestRx: .25, wings: 1.4 }),
    K(.5, { ...FANGS_END, chestRx: .12, ...REC }),
  ] },
  // A corkscrew: one rising turn, blades out at different heights.
  f_twist: { dur: .7, spinY: true, keys: [
    K(0, { bodyRy: 0, hiltA: -1.3, hiltR: .52, hiltH: -.15, bladeYaw: -1.8, bladePitch: -.2, bladeRoll: -1.57, lhX: .52, lhY: .2, lhZ: 0, lbYaw: 1.8, lbPitch: .3, lbRoll: 1.57, twoHand: 0, ...SOFT, lift: -.12 }),
    K(.1, { bodyRy: -.4 }),
    K(.5, { bodyRy: 6.283, lift: .12, hiltH: .15, lhY: .35, wings: 1.9, thLx: -.6, knL: .9, thRx: .1, knR: .7 }),
    K(.7, { bodyRy: 6.283, ...FANGS_END, ...REC }),
  ] },
  // Mid pause combo: a Hundred Cuts, both hands stabbing in turn.
  f_hundred: flurry({ n: 12, t0: .14, step: .06, dur: 1.15 }),

  // High form, Falcon Dive: crossing cuts from above, a flip, a plunging double stab.
  f_hx: { dur: .66, keys: [
    K(0, { hiltA: -.4, hiltR: .2, hiltH: .45, bladeYaw: -.6, bladePitch: 1.3, bladeRoll: 1.57, lhX: .15, lhY: .45, lhZ: .15, lbYaw: .6, lbPitch: 1.3, lbRoll: -1.57, chestRx: -.25, twoHand: 0, ...LUNGE_R }),
    K(.16, { hiltH: .52, lhY: .5, chestRx: -.32, bladePitch: 1.45, lbPitch: 1.45 }),
    K(.27, { hiltA: .1, hiltR: .5, hiltH: .05, bladeYaw: .3, bladePitch: 0, lhX: 0, lhY: 0, lhZ: .5, lbYaw: -.3, lbPitch: 0, chestRx: .3, ...LUNGE }),
    K(.36, { hiltA: .45, hiltR: .44, hiltH: -.25, bladeYaw: .9, bladePitch: -.7, lhX: -.2, lhY: -.2, lhZ: .42, lbYaw: -.9, lbPitch: -.7, chestRx: .5, lift: -.18 }),
    K(.66, { ...FANGS_HIGH, chestRx: 0, ...REC }),
  ] },
  // A forward somersault, blades out: what it catches leaves the ground.
  f_hflip: { dur: .8, spinX: true, keys: [
    K(0, { bodyRx: 0, lift: -.2, chestRx: .3, hiltA: -1.2, hiltR: .5, hiltH: 0, bladeYaw: -1.6, bladePitch: 0, bladeRoll: -1.57, lhX: .5, lhY: 0, lhZ: 0, lbYaw: 1.6, lbPitch: 0, lbRoll: 1.57, twoHand: 0, thLx: -.6, knL: .9, thRx: .3, knR: .8 }),
    K(.14, { bodyRx: .3, lift: .3, thLx: -1.3, knL: 1.8, thRx: -1.2, knR: 1.8, wings: 2 }),
    K(.48, { bodyRx: 6.0, lift: .45 }),
    K(.6, { bodyRx: 6.283, lift: -.18, thLx: -.8, knL: 1.0, thRx: .5, knR: .9 }),
    K(.8, { bodyRx: 6.283, ...FANGS_HIGH, chestRx: -.02, ...REC }),
  ] },
  // Both fangs reversed, a hop, and driven down together.
  f_hdrop: { dur: .8, keys: [
    K(0, { hiltA: -.3, hiltR: .3, hiltH: .15, bladeYaw: 0, bladePitch: -1.3, bladeRoll: 0, lhX: .2, lhY: .12, lhZ: .3, lbYaw: 0, lbPitch: -1.3, lbRoll: 0, twoHand: 0, lift: -.18, chestRx: .15, thLx: -.6, knL: .9, thRx: .3, knR: .9 }),
    K(.2, { hiltH: .55, hiltR: .22, lhY: .52, lhZ: .22, chestRx: -.3, ...HOP, lift: .3 }),
    K(.34, { lift: .34, hiltH: .58 }),
    K(.44, { hiltA: -.15, hiltR: .5, hiltH: -.3, lhX: .1, lhY: -.3, lhZ: .5, chestRx: .7, lift: -.3, thLx: -1.0, knL: 1.3, thRx: .7, knR: 1.1, wings: 1 }),
    K(.8, { ...FANGS_HIGH, chestRx: 0, ...REC }),
  ] },
  // High pause combo: Skyrend, a rising double turn and a crossing fall.
  f_hsky: { dur: 1.15, spinY: true, keys: [
    K(0, { bodyRy: 0, lift: -.2, hiltA: -1.3, hiltR: .55, hiltH: .1, bladeYaw: -1.8, bladePitch: .3, bladeRoll: -1.57, lhX: .55, lhY: .15, lhZ: 0, lbYaw: 1.8, lbPitch: .3, lbRoll: 1.57, twoHand: 0, thLx: -.6, knL: .9, thRx: .3, knR: .9 }),
    K(.12, { bodyRy: -.4, lift: -.26 }),
    K(.62, { bodyRy: 12.566, lift: .6, hiltH: .35, lhY: .4, thLx: -1.1, knL: 1.5, thRx: -.4, knR: 1.3, wings: 2 }),
    K(.74, { bodyRy: 12.566, lift: .5, hiltA: -.3, hiltR: .2, hiltH: .5, bladeYaw: -.5, bladePitch: 1.3, bladeRoll: 1.57, lhX: .12, lhY: .5, lhZ: .12, lbYaw: .5, lbPitch: 1.3, lbRoll: -1.57 }),
    K(.86, { bodyRy: 12.566, lift: -.28, hiltA: .3, hiltR: .48, hiltH: -.25, bladeYaw: .6, bladePitch: -.6, lhX: -.1, lhY: -.2, lhZ: .45, lbYaw: -.6, lbPitch: -.6, chestRx: .6, thLx: -1, knL: 1.3, thRx: .7, knR: 1.1 }),
    K(1.15, { bodyRy: 12.566, ...FANGS_HIGH, chestRx: 0, ...REC }),
  ] },

  // Low form, Serpent Coil: reverse-grip hooks, low turns and stabs.
  f_lhook: { dur: .62, keys: [
    K(0, { hiltA: -1.1, hiltR: .42, hiltH: -.25, bladeYaw: -2.4, bladePitch: -.2, bladeRoll: -1.57, lhX: .3, lhY: -.3, lhZ: .26, lbYaw: 2.8, lbPitch: -.1, lbRoll: 0, chestRy: -.5, chestRx: .3, twoHand: 0, lift: -.16, thLx: -.6, knL: .85, thRx: .45, knR: .7 }),
    K(.13, { hiltA: .6, hiltR: .46, hiltH: -.2, bladeYaw: 1.9, chestRy: .3 }),
    K(.22, { lhX: .55, lhY: -.2, lhZ: .1, lbYaw: 2.2, lbPitch: -.1, lbRoll: 1.57, chestRy: .5 }),
    K(.33, { lhX: -.35, lhY: -.2, lhZ: .4, lbYaw: -1.9, lbPitch: -.1, chestRy: -.4, lift: -.2 }),
    K(.62, { ...FANGS_END, hiltH: -.3, lhY: -.3, chestRy: -.2, ...LOWREC }),
  ] },
  f_lsweep: vary(ACTIONS.f_spin, { dur: .78, add: { hiltH: -.3, lhY: -.3, lift: -.18 }, set: { thLx: -1.0, knL: 1.3, thRx: .5, knR: 1.0, chestRx: .3 } }),
  f_lstab: flurry({ n: 6, t0: .1, step: .07, dur: .7, low: .25 }),
  f_ldart: vary(ACTIONS.f_viper, { dur: .56 }),
  // Low pause combo: the Venom Tornado, a travelling whirl down at the knees.
  f_ltornado: vary(ACTIONS.f_whirl, { dur: 1.25, add: { lift: -.2, hiltH: -.25, lhY: -.25 }, set: { thLx: -.95, knL: 1.25, thRx: .5, knR: 1.0 } }),

  // Fangs finishers. Swallow Rise: both blades up out of a crouch, and a leap after them.
  f_fin1: { dur: .8, keys: [
    K(0, { hiltA: -.5, hiltR: .36, hiltH: -.4, bladeYaw: -.4, bladePitch: -.9, bladeRoll: 0, lhX: .4, lhY: -.38, lhZ: .3, lbYaw: .4, lbPitch: -.9, lbRoll: 0, twoHand: 0, lift: -.28, chestRx: .45, thLx: -.9, knL: 1.3, thRx: .5, knR: 1.1 }),
    K(.14, { hiltH: -.45, lhY: -.42, lift: -.32 }),
    K(.26, { hiltA: -.2, hiltR: .5, hiltH: .1, bladeYaw: -.1, bladePitch: .5, lhX: .2, lhY: .1, lhZ: .5, lbYaw: .1, lbPitch: .5, chestRx: 0, ...LUNGE, lift: .1 }),
    K(.36, { hiltA: -.35, hiltR: .26, hiltH: .55, bladeYaw: -.3, bladePitch: 1.4, lhX: .3, lhY: .55, lhZ: .2, lbYaw: .3, lbPitch: 1.4, chestRx: -.35, lift: .4, thLx: -.9, knL: 1.4, thRx: -.2, knR: 1.1, wings: 2 }),
    K(.8, { ...FANGS_END, chestRx: .12, ...REC }),
  ] },
  // Fang Storm: a flurry, then both blades raised and crossed down.
  f_fin3: flurry({ n: 8, t0: .12, step: .06, dur: 1.2, finale: t => [
    K(t + .08, { hiltA: -.4, hiltR: .2, hiltH: .5, bladeYaw: -.6, bladePitch: 1.4, bladeRoll: 1.57, lhX: .15, lhY: .48, lhZ: .15, lbYaw: .6, lbPitch: 1.4, lbRoll: -1.57, chestRx: -.3, chestRy: 0, lift: .05, wings: 2 }),
    K(t + .2, { hiltA: .45, hiltR: .44, hiltH: -.25, bladeYaw: .9, bladePitch: -.7, lhX: -.2, lhY: -.2, lhZ: .42, lbYaw: -.9, lbPitch: -.7, chestRx: .55, ...DEEP }),
  ] }),

  // ================================================================ movement
  // Sliding on one hip: lead leg out, body leaning back, the weapon trailing.
  slide: { dur: .8, loop: true, keys: [
    K(0, { lift: -.5, bodyRx: -.3, chestRx: .3, headRx: .15, thLx: -.8, thLz: .1, knL: .15, thRx: .6, knR: 1.9, hiltA: -1.2, hiltR: .34, hiltH: -.25, bladeYaw: -2.7, bladePitch: -.1, bladeRoll: 0, lhX: .5, lhY: -.25, lhZ: .05, wings: 1.8 }),
    K(.8, { lift: -.5, bodyRx: -.3, chestRx: .3, headRx: .15, thLx: -.8, thLz: .1, knL: .15, thRx: .6, knR: 1.9, hiltA: -1.2, hiltR: .34, hiltH: -.25, bladeYaw: -2.7, bladePitch: -.1, bladeRoll: 0, lhX: .5, lhY: -.25, lhZ: .05, wings: 1.8 }),
  ] },
  // Wingleap: out of the slide, a dive forward and up.
  leap: { dur: .55, keys: [
    K(0, { lift: -.25, bodyRx: .2, chestRx: .3, thLx: -.9, knL: 1.1, thRx: .5, knR: .8, wings: 2, hiltA: -1.3, hiltR: .32, hiltH: -.3, bladeYaw: -2.8, bladePitch: -.1, lhX: .45, lhY: -.2, lhZ: -.1 }),
    K(.12, { lift: .05, bodyRx: .75, chestRx: -.1, headRx: -.35, thLx: .3, knL: .25, thRx: .45, knR: .5, wings: 2.4 }),
    K(.42, { bodyRx: .6, thLx: .2, knL: .4, thRx: .3, knR: .6 }),
    K(.55, { bodyRx: .3, chestRx: .05, headRx: 0, thLx: -.5, knL: .9, thRx: -.1, knR: .7, wings: 1.9 }),
  ] },
  // Gliding on spread wings.
  glide: { dur: 1, loop: true, keys: [
    K(0, { bodyRx: .85, chestRx: -.25, headRx: -.45, thLx: .25, knL: .3, thRx: .35, knR: .45, wings: 2.4, hiltA: -1.4, hiltR: .3, hiltH: -.2, bladeYaw: -2.8, bladePitch: -.1, lhX: .45, lhY: -.15, lhZ: -.1 }),
    K(.5, { bodyRx: .9, thLx: .3, knL: .4, thRx: .3, knR: .35 }),
    K(1, { bodyRx: .85, chestRx: -.25, headRx: -.45, thLx: .25, knL: .3, thRx: .35, knR: .45, wings: 2.4, hiltA: -1.4, hiltR: .3, hiltH: -.2, bladeYaw: -2.8, bladePitch: -.1, lhX: .45, lhY: -.15, lhZ: -.1 }),
  ] },
});

// Variants of moves defined above, and each weapon's own strikes in the air.
Object.assign(ACTIONS, {
  f_lcoil: vary(ACTIONS.f_twist, { dur: .72, add: { hiltH: -.12, lift: -.04 }, set: { chestRx: .25 } }),
  gAir1: airVariant(ACTIONS.g_sweep, .5),
  gAir2: airVariant(ACTIONS.g_thrust, .46),
  gAir3: airVariant(ACTIONS.g_spin, .62),
  fAir1: airVariant(ACTIONS.f_slash1, .36),
  fAir2: airVariant(ACTIONS.f_slash2, .36),
  fAir3: airVariant(ACTIONS.f_spin, .6),
});

// ================================================================ Thornhammer
// Two hands low on the haft. Overhead blows keep the haft's yaw and swing its pitch past π/2 and down.
const HAMMER_END = { chestRy: -.45, chestRx: .05, hiltA: -.85, hiltR: .26, hiltH: -.2, bladeYaw: .45, bladePitch: .55, bladeRoll: 0, twoHand: 1 };
const HAMMER_HIGH = { chestRy: -.3, chestRx: 0, hiltA: -.6, hiltR: .18, hiltH: .22, bladeYaw: .6, bladePitch: 2.3, bladeRoll: 0, twoHand: 1 };
const HAMMER_LOW = { chestRy: -.5, chestRx: .2, hiltA: -1.0, hiltR: .3, hiltH: -.32, bladeYaw: .3, bladePitch: -.55, bladeRoll: 0, twoHand: 1 };
const SLAM = { lift: -.32, thLx: -1.1, knL: 1.3, thRx: .75, knR: 1.1 };
Object.assign(ACTIONS, {
  // Mid form, Anvil Rhythm: a swing across and back, an overhead slam and a great turn.
  h_side: { dur: .8, keys: [
    K(0, { chestRy: -.8, hiltA: -.9, hiltR: .3, hiltH: .05, bladeYaw: -1.9, bladePitch: .25, bladeRoll: -1.57, twoHand: 1, ...LUNGE_R }),
    K(.2, { chestRy: -1.0, hiltA: -1.05, bladeYaw: -2.3, bladePitch: .3, lift: -.1 }),
    K(.32, { chestRy: -.1, hiltA: -.1, hiltR: .45, hiltH: .05, bladeYaw: -.2, bladePitch: .08, ...DEEP }),
    K(.44, { chestRy: .6, hiltA: .6, hiltR: .38, bladeYaw: 1.7, bladePitch: 0 }),
    K(.8, { ...HAMMER_END, chestRy: .1, ...REC }),
  ] },
  h_back: { dur: .8, keys: [
    K(0, { chestRy: .55, hiltA: .55, hiltR: .36, hiltH: .05, bladeYaw: 1.8, bladePitch: .15, bladeRoll: 1.57, twoHand: 1, ...LUNGE }),
    K(.2, { chestRy: .75, hiltA: .7, bladeYaw: 2.2, lift: -.1 }),
    K(.32, { chestRy: 0, hiltA: -.1, hiltR: .45, bladeYaw: .1, bladePitch: .05, ...LUNGE_R, lift: -.2 }),
    K(.44, { chestRy: -.75, hiltA: -.8, hiltR: .36, bladeYaw: -1.8, bladePitch: 0 }),
    K(.8, { ...HAMMER_END, chestRy: -.6, ...REC }),
  ] },
  h_over: { dur: 1.0, keys: [
    K(0, { chestRy: -.3, chestRx: 0, hiltA: -.4, hiltR: .22, hiltH: .15, bladeYaw: .2, bladePitch: 1.2, bladeRoll: 0, twoHand: 1 }),
    K(.26, { chestRx: -.35, hiltA: -.2, hiltR: .1, hiltH: .55, bladePitch: 2.3, lift: .02, thLx: -.1, knL: .15, thRx: .3, knR: .3, wings: 1.4 }),
    K(.38, { bladePitch: 2.45, chestRx: -.42 }),
    K(.47, { chestRx: .4, hiltA: -.1, hiltR: .5, hiltH: .05, bladePitch: .1, ...DEEP }),
    K(.56, { chestRx: .65, hiltH: -.3, bladePitch: -.75, ...SLAM }),
    K(1.0, { ...HAMMER_END, chestRx: .25, hiltH: -.28, bladePitch: -.3, ...REC }),
  ] },
  h_spin: { dur: 1.05, spinY: true, keys: [
    K(0, { bodyRy: 0, chestRy: -.4, hiltA: -.5, hiltR: .45, hiltH: 0, bladeYaw: -1.5, bladePitch: .08, bladeRoll: -1.57, twoHand: 1, ...LUNGE, lift: -.12 }),
    K(.2, { bodyRy: -.7, chestRy: -.6, lift: -.18 }),
    K(.66, { bodyRy: 6.0, chestRy: .1, lift: -.14, wings: 2 }),
    K(.78, { bodyRy: 6.283, hiltA: .3, bladeYaw: 1.0, chestRy: .35 }),
    K(1.05, { bodyRy: 6.283, ...HAMMER_END, ...REC }),
  ] },
  // Mid, moving: a charge behind the haft, and an underhand swing that lifts.
  h_charge: { dur: .7, keys: [
    K(0, { chestRy: -.3, chestRx: .3, hiltA: -.4, hiltR: .34, hiltH: 0, bladeYaw: 1.3, bladePitch: .2, bladeRoll: 1.57, twoHand: 1, lift: -.14, thLx: -.8, knL: .9, thRx: .5, knR: .6, wings: 1.6 }),
    K(.14, { chestRx: .45, hiltR: .5, lift: -.2, thLx: -1.0, knL: .8, thRx: .8, knR: .4, wings: 2 }),
    K(.4, { hiltR: .48, chestRx: .4 }),
    K(.7, { ...HAMMER_END, ...REC }),
  ] },
  h_upper: { dur: .82, keys: [
    K(0, { chestRy: -.5, chestRx: .35, hiltA: -.6, hiltR: .3, hiltH: -.3, bladeYaw: .3, bladePitch: -.85, bladeRoll: 0, twoHand: 1, lift: -.22, thLx: -.9, knL: 1.1, thRx: .5, knR: .9 }),
    K(.2, { hiltH: -.36, bladePitch: -1.0, lift: -.28 }),
    K(.32, { chestRx: 0, hiltA: -.3, hiltR: .5, hiltH: .1, bladePitch: .4, ...LUNGE, lift: 0 }),
    K(.42, { chestRx: -.35, hiltA: -.25, hiltR: .3, hiltH: .55, bladePitch: 1.5, lift: .12, wings: 1.8 }),
    K(.82, { ...HAMMER_END, hiltH: .1, bladePitch: 1.0, ...REC }),
  ] },
  // Mid pause combo: the Earthshaker, three slams, left, right and a great one ahead.
  h_quake: { dur: 1.4, keys: [
    K(0, { chestRy: -.2, hiltA: -.3, hiltR: .2, hiltH: .2, bladeYaw: .5, bladePitch: 1.3, bladeRoll: 0, twoHand: 1, lift: -.05 }),
    K(.2, { hiltH: .5, bladePitch: 2.1, chestRx: -.3, hiltR: .12 }),
    K(.34, { chestRy: .25, hiltA: .1, hiltR: .5, hiltH: -.25, bladeYaw: .45, bladePitch: -.75, chestRx: .5, ...DEEP }),
    K(.48, { chestRy: -.1, hiltA: -.3, hiltR: .15, hiltH: .5, bladeYaw: .3, bladePitch: 2.1, chestRx: -.3, lift: -.04 }),
    K(.62, { chestRy: -.6, hiltA: -.5, hiltR: .5, hiltH: -.25, bladeYaw: .2, bladePitch: -.75, chestRx: .5, ...DEEP }),
    K(.76, { chestRy: -.2, hiltA: -.2, hiltR: .1, hiltH: .62, bladeYaw: .3, bladePitch: 2.3, chestRx: -.45, lift: .2, thLx: -.8, knL: 1.2, thRx: .3, knR: 1.0, wings: 2 }),
    K(.9, { chestRy: -.25, hiltA: -.1, hiltR: .52, hiltH: -.32, bladeYaw: .25, bladePitch: -.9, chestRx: .72, ...SLAM, lift: -.36 }),
    K(1.4, { ...HAMMER_END, chestRx: .2, ...REC }),
  ] },

  // High form, Mountainfall: from over the shoulder, crushing blows, a hooking swing, a leaping slam.
  h_hcrush: { dur: .95, keys: [
    K(0, { ...HAMMER_HIGH, hiltA: -.55, hiltR: .16, hiltH: .28, bladeYaw: .5, bladePitch: 2.25, chestRx: -.1, lift: -.04 }),
    K(.3, { chestRx: -.38, hiltH: .52, hiltR: .1, hiltA: -.3, bladeYaw: .3, bladePitch: 2.45, lift: .04, wings: 1.6 }),
    K(.45, { chestRx: .45, chestRy: -.2, hiltA: -.1, hiltR: .5, hiltH: .02, bladeYaw: .25, bladePitch: .05, ...DEEP }),
    K(.54, { chestRx: .72, hiltH: -.32, bladePitch: -.85, ...SLAM }),
    K(.95, { ...HAMMER_HIGH, ...REC }),
  ] },
  h_hhook: { dur: .9, keys: [
    K(0, { chestRy: -.5, hiltA: -.7, hiltR: .18, hiltH: .3, bladeYaw: .5, bladePitch: 2.2, bladeRoll: .7, twoHand: 1, ...LUNGE_R }),
    K(.24, { chestRy: -.7, hiltH: .42, bladePitch: 2.4 }),
    K(.36, { chestRy: 0, hiltA: -.2, hiltR: .45, hiltH: .2, bladeYaw: .6, bladePitch: .5, chestRx: .2, ...LUNGE }),
    K(.46, { chestRy: .5, hiltA: .5, hiltR: .38, hiltH: -.25, bladeYaw: 1.7, bladePitch: -.5, chestRx: .45, lift: -.22 }),
    K(.9, { chestRy: .1, chestRx: .15, hiltA: -.3, hiltR: .3, hiltH: -.15, bladeYaw: .8, bladePitch: .2, twoHand: 1, ...REC }),
  ] },
  h_hleap: { dur: 1.15, keys: [
    K(0, { lift: -.2, chestRx: .3, hiltA: -.5, hiltR: .3, hiltH: -.2, bladeYaw: .3, bladePitch: .3, bladeRoll: 0, twoHand: 1, thLx: -.7, knL: 1.0, thRx: .35, knR: 1.0 }),
    K(.26, { lift: .6, chestRx: -.4, hiltA: -.15, hiltR: .1, hiltH: .6, bladePitch: 2.4, thLx: -1.0, knL: 1.5, thRx: .4, knR: 1.3, wings: 2.2 }),
    K(.5, { lift: .66, bladePitch: 2.6, hiltH: .62 }),
    K(.62, { chestRx: .75, hiltA: -.05, hiltR: .52, hiltH: -.3, bladePitch: -.85, ...SLAM, wings: 1 }),
    K(1.15, { lift: -.08, chestRx: .2, hiltA: -.5, hiltR: .3, hiltH: -.2, bladeYaw: .3, bladePitch: -.2, twoHand: 1 }),
  ] },
  // High pause combo: the Meteorfall, a turning leap high overhead and a crushing fall.
  h_hmeteor: { dur: 1.5, spinY: true, keys: [
    K(0, { bodyRy: 0, lift: -.24, chestRx: .3, hiltA: -.5, hiltR: .4, hiltH: 0, bladeYaw: -1.4, bladePitch: .1, bladeRoll: -1.57, twoHand: 1, thLx: -.8, knL: 1.1, thRx: .4, knR: 1.0 }),
    K(.2, { bodyRy: -.3, lift: -.3 }),
    K(.6, { bodyRy: 6.283, lift: .85, hiltA: -.2, hiltR: .12, hiltH: .6, bladeYaw: .2, bladePitch: 2.4, bladeRoll: 0, chestRx: -.4, thLx: -1.2, knL: 1.6, thRx: .2, knR: 1.4, wings: 2.4 }),
    K(.8, { bodyRy: 6.283, lift: .8, bladePitch: 2.6 }),
    K(.92, { bodyRy: 6.283, chestRx: .8, hiltA: -.05, hiltR: .52, hiltH: -.32, bladePitch: -.9, ...SLAM, lift: -.36, wings: 1 }),
    K(1.5, { bodyRy: 6.283, ...HAMMER_HIGH, ...REC }),
  ] },

  // Low form, Stonewheel: sweeps at the ankles, a ram with the head, a dragging rush.
  h_lsweep: { dur: .75, keys: [
    K(0, { chestRy: -.9, chestRx: .35, hiltA: -1.0, hiltR: .3, hiltH: -.32, bladeYaw: -1.2, bladePitch: -.4, bladeRoll: -1.57, twoHand: 1, lift: -.2, thLx: -.8, knL: 1.0, thRx: .5, knR: .8 }),
    K(.16, { chestRy: -1.05, bladeYaw: -1.5, lift: -.26 }),
    K(.3, { chestRy: -.1, hiltA: -.3, hiltR: .42, bladeYaw: -.1, bladePitch: -.5, lift: -.3, thLz: .25, thRz: -.25 }),
    K(.42, { chestRy: .5, hiltA: .3, hiltR: .38, bladeYaw: 1.3, bladePitch: -.45 }),
    K(.75, { ...HAMMER_LOW, thLz: .04, thRz: -.04, ...LOWREC }),
  ] },
  h_lpoke: { dur: .6, keys: [
    K(0, { chestRy: -.5, chestRx: .3, hiltA: -1.1, hiltR: .16, hiltH: -.15, bladeYaw: .5, bladePitch: -.05, bladeRoll: 0, twoHand: 1, ...LUNGE_R, lift: -.16 }),
    K(.14, { hiltA: -1.2, hiltR: .1 }),
    K(.22, { chestRy: -.35, hiltA: -.3, hiltR: .5, hiltH: -.1, bladeYaw: .35, bladePitch: -.1, ...DEEP }),
    K(.3, { hiltR: .48 }),
    K(.6, { ...HAMMER_LOW, ...LOWREC }),
  ] },
  h_lrush: { dur: .8, keys: [
    K(0, { chestRy: -.6, chestRx: .4, hiltA: -1.2, hiltR: .3, hiltH: -.3, bladeYaw: -2.6, bladePitch: -.35, bladeRoll: 0, twoHand: 0, lhX: .35, lhY: -.2, lhZ: .2, lift: -.18, thLx: -.9, knL: .9, thRx: .6, knR: .6, wings: 1.6 }),
    K(.3, { chestRy: -.8, hiltA: -1.3, lift: -.22, thLx: -1.1, knL: .8, thRx: .9, knR: .4 }),
    K(.4, { chestRy: -.1, chestRx: -.1, hiltA: -.3, hiltR: .4, hiltH: .3, bladeYaw: .2, bladePitch: 1.3, twoHand: 1, ...LUNGE, lift: .05 }),
    K(.8, { ...HAMMER_LOW, ...LOWREC }),
  ] },
});

// ================================================================ Starfists
// Fists follow the arm: the hilt channels place the right fist, lh* the left. Kicks are legs alone.
const FM = { hiltA: -.35, hiltR: .26, hiltH: .12, lhX: .12, lhY: .12, lhZ: .34, chestRy: -.25, twoHand: 0 };
const FH = { hiltA: -.4, hiltR: .24, hiltH: .2, lhX: .14, lhY: .2, lhZ: .3, chestRy: -.4, twoHand: 0 };
const FL = { hiltA: -.5, hiltR: .34, hiltH: -.1, lhX: .2, lhY: -.05, lhZ: .42, chestRy: -.2, chestRx: .25, twoHand: 0 };
const STANCE_L = { lift: -.05, thLx: -.35, knL: .35, thRx: .3, knR: .35, thRz: -.04, thLz: .04, bodyRy: 0, bodyRx: 0, bodyRz: 0 };
const LOW_L = { lift: -.16, thLx: -.6, knL: .8, thRx: .45, knR: .7, thRz: -.04, thLz: .04, bodyRy: 0, bodyRx: 0 };
const RO = { hiltA: -.12, hiltR: .64, hiltH: .06 }, LO = { lhX: .1, lhY: .08, lhZ: .62 };
// Alternating straight punches, right then left, and a last big right.
function punches({ n, t0, step, dur }) {
  const keys = [K(0, { ...FM, ...LUNGE })];
  for (let i = 0; i < n; i++) {
    const t = t0 + i * step, h = (i % 3 - 1) * .08;
    keys.push(K(t - step * .5, i % 2 ? { hiltA: -.3, hiltR: .62, lhX: .3, lhY: .1, lhZ: .2, chestRy: .15 } : { hiltA: -.45, hiltR: .22, lhX: .1, lhY: .08, lhZ: .6, chestRy: -.15 }));
    keys.push(K(t, i % 2 ? { hiltA: -.4, hiltR: .22, lhX: .08, lhY: .08 + h, lhZ: .62, chestRy: -.25 } : { ...RO, hiltH: .06 + h, lhX: .3, lhY: .1, lhZ: .2, chestRy: .25 }));
  }
  const tEnd = t0 + n * step;
  keys.push(K(tEnd + .06, { hiltA: -.55, hiltR: .12, hiltH: .05, chestRy: -.6, lift: -.12 }));
  keys.push(K(tEnd + .16, { ...RO, hiltR: .66, chestRy: .4, chestRx: .3, ...DEEP, wings: 2 }));
  keys.push(K(dur, { ...FM, ...STANCE_L }));
  return { dur, keys };
}
Object.assign(ACTIONS, {
  // Mid form, Moonfist: jab, cross, hook and a roundhouse.
  x_jab: { dur: .36, keys: [
    K(0, { ...FM, ...STANCE_L }),
    K(.1, { ...LO, chestRy: -.45, ...LUNGE }),
    K(.18, { lhZ: .6 }),
    K(.36, { ...FM }),
  ] },
  x_cross: { dur: .42, keys: [
    K(0, { ...FM, chestRy: -.4, ...STANCE_L }),
    K(.05, { hiltA: -.5, hiltR: .2, chestRy: -.5 }),
    K(.12, { ...RO, chestRy: .35, lhZ: .22, lhY: .15, ...DEEP }),
    K(.2, { hiltR: .62 }),
    K(.42, { ...FM }),
  ] },
  x_hook: { dur: .46, keys: [
    K(0, { ...FM, lhX: .45, lhY: .08, lhZ: .12, chestRy: .35, ...STANCE_L, lift: -.08 }),
    K(.12, { lhX: .12, lhY: .1, lhZ: .5, chestRy: -.2 }),
    K(.22, { lhX: -.12, lhY: .08, lhZ: .42, chestRy: -.5, ...LUNGE }),
    K(.46, { ...FM }),
  ] },
  x_round: { dur: .7, keys: [
    K(0, { ...FM, ...STANCE_L }),
    K(.14, { bodyRy: .4, thRx: -.5, thRz: -.6, knR: 1.6, lift: .02, thLx: .05, knL: .15 }),
    K(.26, { bodyRy: 1.1, thRx: -.35, thRz: -1.35, knR: .15, bodyRz: .25, hiltA: -.8, hiltH: .25, lhX: .35, lhY: .2, lhZ: .2, wings: 1.6 }),
    K(.4, { bodyRy: 1.6, thRz: -1.3, knR: .2 }),
    K(.56, { bodyRy: 1.4, thRx: -.2, thRz: -.3, knR: 1.0, bodyRz: .1 }),
    K(.7, { ...FM, ...STANCE_L }),
  ] },
  // Mid, moving: a lunging straight and a flying knee.
  x_dashpunch: { dur: .5, keys: [
    K(0, { ...FM, chestRy: -.5, hiltA: -.55, hiltR: .18, ...LUNGE_R }),
    K(.14, { ...RO, chestRy: .4, lhZ: .2, lhY: .12, chestRx: .3, ...DEEP, wings: 2 }),
    K(.26, { hiltR: .62 }),
    K(.5, { ...FM, ...STANCE_L }),
  ] },
  x_knee: { dur: .62, keys: [
    K(0, { ...FM, lift: -.15, thLx: -.5, knL: .8, thRx: .2, knR: .6 }),
    K(.12, { lift: .3, thRx: -1.6, knR: 2.1, thLx: .15, knL: .5, hiltA: -.2, hiltR: .35, hiltH: .05, lhX: .15, lhY: .05, lhZ: .36, chestRx: .15, wings: 2 }),
    K(.3, { lift: .36, thRx: -1.7 }),
    K(.45, { lift: -.1, thRx: -.3, knR: .6 }),
    K(.62, { ...FM, ...STANCE_L }),
  ] },
  // Mid pause combo: Hundred Fists.
  x_rush: punches({ n: 12, t0: .12, step: .055, dur: 1.15 }),

  // High form, Crescent Kick: a snap kick, an axe kick, a spinning hook kick.
  x_front: { dur: .56, keys: [
    K(0, { ...FH, ...STANCE_L, lift: 0 }),
    K(.12, { thRx: -1.2, knR: 1.8, bodyRx: -.1, thLx: .05, knL: .2 }),
    K(.22, { thRx: -1.45, knR: .1, bodyRx: -.2, wings: 1.4 }),
    K(.32, { thRx: -1.3, knR: .6 }),
    K(.56, { ...FH, ...STANCE_L, lift: 0 }),
  ] },
  x_axe: { dur: .8, keys: [
    K(0, { ...FH, ...STANCE_L, lift: 0 }),
    K(.3, { thRx: -2.4, knR: .1, bodyRx: -.3, lift: .05, thLx: .1, knL: .15, hiltH: .3, lhY: .3, wings: 1.6 }),
    K(.38, { thRx: -2.5 }),
    K(.48, { thRx: -.4, knR: .2, bodyRx: .2, lift: -.1 }),
    K(.8, { ...FH, ...STANCE_L, lift: 0 }),
  ] },
  x_spinhook: { dur: .8, spinY: true, keys: [
    K(0, { ...FH, ...STANCE_L, lift: 0 }),
    K(.14, { bodyRy: -.4, thRx: -.3, thRz: -.5, knR: 1.4 }),
    K(.26, { bodyRy: 1.8, thRx: -.35, thRz: -1.4, knR: .15, lift: .08, wings: 2 }),
    K(.56, { bodyRy: 5.8, thRz: -1.35, knR: .2 }),
    K(.66, { bodyRy: 6.283, thRx: .1, thRz: -.2, knR: .8, lift: 0 }),
    K(.8, { ...FH, ...STANCE_L, bodyRy: 6.283, lift: 0 }),
  ] },
  // High, moving: a flying side kick.
  x_flykick: { dur: .75, keys: [
    K(0, { ...FH, lift: -.18, thLx: -.6, knL: .9, thRx: .3, knR: .9 }),
    K(.16, { lift: .45, bodyRy: .9, thLx: -1.2, knL: 1.6, thRx: -.3, thRz: -.9, knR: 1.6, wings: 2.2 }),
    K(.26, { lift: .5, bodyRy: 1.4, thRz: -1.45, thRx: -.1, knR: .05, hiltA: -1.2, hiltR: .3, hiltH: .2, lhX: .4, lhY: .25, lhZ: .1 }),
    K(.44, { lift: .35 }),
    K(.58, { lift: -.15, bodyRy: .6, thRz: -.3, knR: .7, thLx: -.5, knL: .8 }),
    K(.75, { ...FH, ...STANCE_L, lift: 0 }),
  ] },
  // High pause combo: the Tornado Kick, two turns in the air, leg out.
  x_cyclone: { dur: 1.2, spinY: true, keys: [
    K(0, { ...FH, bodyRy: 0, lift: -.2, thLx: -.6, knL: .9, thRx: .3, knR: .9 }),
    K(.2, { bodyRy: .5, lift: .45, thLx: -1.3, knL: 1.7, thRx: -.3, thRz: -1.3, knR: .2, wings: 2.4 }),
    K(.85, { bodyRy: 12.566, lift: .55 }),
    K(1.0, { bodyRy: 12.566, lift: -.2, thRz: -.2, knR: .8, thLx: -.6, knL: .9 }),
    K(1.2, { ...FH, ...STANCE_L, bodyRy: 12.566, lift: 0 }),
  ] },

  // Low form, Tiger Palm: body blows, an uppercut, a leg sweep and a double palm.
  x_body: { dur: .42, keys: [
    K(0, { ...FL, ...LOW_L }),
    K(.1, { hiltA: -.1, hiltR: .6, hiltH: -.15, chestRy: .3, chestRx: .35, ...DEEP }),
    K(.2, { hiltR: .58 }),
    K(.42, { ...FL, ...LOW_L }),
  ] },
  x_uppercut: { dur: .55, keys: [
    K(0, { ...FL, hiltA: -.4, hiltR: .3, hiltH: -.25, ...LOW_L, lift: -.26 }),
    K(.08, { hiltH: -.3, lift: -.3, chestRx: .45 }),
    K(.18, { hiltA: -.1, hiltR: .4, hiltH: .45, chestRx: -.25, chestRy: .2, ...LUNGE, lift: .12, wings: 1.6 }),
    K(.28, { hiltH: .5 }),
    K(.55, { ...FL, ...LOW_L }),
  ] },
  x_sweep: { dur: .7, spinY: true, keys: [
    K(0, { ...FL, ...LOW_L, lift: -.3 }),
    K(.12, { bodyRy: -.3, lift: -.5, thLx: -1.4, knL: 2.0, thRx: .1, thRz: -1.35, knR: .1, hiltA: -.8, hiltR: .3, hiltH: -.35, lhX: .4, lhY: -.35, lhZ: .2, chestRx: .5 }),
    K(.5, { bodyRy: 6.0, lift: -.5 }),
    K(.7, { ...FL, ...LOW_L, bodyRy: 6.283 }),
  ] },
  x_palm: { dur: .6, keys: [
    K(0, { ...FL, hiltA: -.5, hiltR: .2, hiltH: 0, lhX: .3, lhY: 0, lhZ: .2, chestRx: .1, ...LOW_L, lift: -.14 }),
    K(.12, { hiltR: .14, lhZ: .14, chestRx: -.05 }),
    K(.2, { hiltA: -.12, hiltR: .62, hiltH: 0, lhX: .1, lhY: .02, lhZ: .62, chestRx: .3, ...DEEP, wings: 1.8 }),
    K(.3, { hiltR: .6, lhZ: .6 }),
    K(.6, { ...FL, ...LOW_L }),
  ] },
  // Low, moving: a sliding kick along the ground.
  x_slide: (() => {
    const S = { lift: -.5, bodyRx: -.3, chestRx: .3, headRx: .15, thLx: -.8, thLz: .1, knL: .15, thRx: .6, knR: 1.9, hiltA: -.6, hiltR: .3, hiltH: .05, lhX: .3, lhY: 0, lhZ: .2, wings: 1.8 };
    return { dur: .6, keys: [K(0, { ...S, knL: 1.3, thLx: -.5 }), K(.12, { ...S, knL: .02, thLx: -1.0 }), K(.4, S), K(.6, { ...FL, ...LOW_L, headRx: 0, thLz: .04 })] };
  })(),
  // Low pause combo: the Rising Dragon, a spiralling uppercut leap.
  x_dragon: { dur: 1.0, spinY: true, keys: [
    K(0, { ...FL, bodyRy: 0, lift: -.32, hiltA: -.4, hiltR: .3, hiltH: -.3, chestRx: .45, thLx: -.9, knL: 1.2, thRx: .5, knR: 1.0 }),
    K(.18, { bodyRy: .3, lift: -.1 }),
    K(.56, { bodyRy: 6.283, lift: .8, hiltA: -.15, hiltR: .3, hiltH: .62, chestRx: -.35, thLx: -.9, knL: 1.3, thRx: .1, knR: .6, wings: 2.4 }),
    K(.72, { bodyRy: 6.283, lift: .6 }),
    K(1.0, { ...FL, ...LOW_L, bodyRy: 6.283 }),
  ] },

  // Fae Arts: a thrown dart or bomb from the off hand, and a brand drawn along the weapon.
  throw: { dur: .5, keys: [
    K(0, { lhX: .35, lhY: .32, lhZ: -.15, chestRy: .4, chestRx: -.1, twoHand: 0 }),
    K(.16, { lhX: .05, lhY: .15, lhZ: .6, chestRy: -.3, chestRx: .15, twoHand: 0, ...LUNGE }),
    K(.5, {}),
  ] },
  brand: { dur: .8, keys: [
    K(0, { hiltA: -.2, hiltR: .3, hiltH: .15, bladeYaw: 0, bladePitch: 1.3, bladeRoll: 0, lhX: .05, lhY: .05, lhZ: .32, twoHand: 0, wings: 1.2 }),
    K(.5, { lhX: .02, lhY: .5, lhZ: .32, wings: 2 }),
    K(.8, {}),
  ] },
});
// Variants of the above.
Object.assign(ACTIONS, {
  h_lwheel: vary(ACTIONS.h_spin, { dur: .95, add: { hiltH: -.3, bladePitch: -.25, lift: -.18 }, set: { thLx: -.95, knL: 1.25, thRx: .55, knR: .95, chestRx: .3 } }),
  h_lflip: vary(ACTIONS.h_upper, { dur: .72, add: { lift: -.06 } }),
  h_ltop: vary(ACTIONS.g_lundertow, { dur: 1.3 }),
  hAir1: airVariant(ACTIONS.h_side, .6),
  hAir2: airVariant(ACTIONS.h_back, .6),
  hAir3: airVariant(ACTIONS.h_spin, .75),
  xAir1: airVariant(ACTIONS.x_jab, .3),
  xAir2: airVariant(ACTIONS.x_cross, .34),
});
