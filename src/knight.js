// The Pixie Lord: a fae knight built from primitives and animated by pose blending.
// The sword arm uses two-bone IK. Each pose says where the hilt is (cylindrical coords around the chest) and
// where the blade points; the arm solves itself to hold it there. Sword arcs come from interpolating angles.
import * as THREE from 'three';
import { wingTexture, glowTexture } from './textures.js';
import { lerp, smooth, clamp } from './util.js';
import { buildArmory } from './armorymodels.js';
import { buildRanged } from './rangedmodels.js';

// ---------------------------------------------------------------- pose channels
const CH = [
  'lift', 'bodyRx', 'bodyRy', 'bodyRz',
  'hipsRx', 'hipsRy', 'hipsRz',
  'chestRx', 'chestRy', 'chestRz',
  'headRx', 'headRy',
  'hiltA', 'hiltR', 'hiltH', 'bladeYaw', 'bladePitch', 'bladeRoll',
  'lhX', 'lhY', 'lhZ',
  'thLx', 'thLz', 'knL', 'thRx', 'thRz', 'knR',
  'twoHand', 'wings', 'vial',
  'lbYaw', 'lbPitch', 'lbRoll',   // the off-hand blade (Twin Fangs), chest space
];
export const IDX = Object.fromEntries(CH.map((c, i) => [c, i]));
const N = CH.length;
const LEGS = ['lift', 'thLx', 'thLz', 'knL', 'thRx', 'thRz', 'knR'].map(c => IDX[c]);

const BASE = {
  lift: 0, bodyRx: 0, bodyRy: 0, bodyRz: 0, hipsRx: 0, hipsRy: 0, hipsRz: 0,
  chestRx: .06, chestRy: 0, chestRz: 0, headRx: 0, headRy: 0,
  hiltA: -.55, hiltR: .36, hiltH: -.2, bladeYaw: .15, bladePitch: .55, bladeRoll: 0,
  lhX: .26, lhY: -.34, lhZ: .08,
  thLx: -.12, thLz: .04, knL: .22, thRx: .16, thRz: -.04, knR: .28,
  twoHand: 0, wings: .3, vial: 0,
  lbYaw: 2.7, lbPitch: -.45, lbRoll: 0,
};

export function pose(o = {}, full = false) {
  const a = new Float32Array(N).fill(NaN);
  for (const [k, v] of Object.entries(full ? { ...BASE, ...o } : o)) a[IDX[k]] = v;
  return a;
}

// Upper-body presets (legs left to locomotion unless given).
export const P = {
  ready: pose({}, true),
  // Stance guards: High holds the blade by the head, Low trails it by the knee.
  readyHigh: pose({ hiltA: -.45, hiltR: .22, hiltH: .32, bladeYaw: .35, bladePitch: 1.15, bladeRoll: .3, lhX: .12, lhY: .05, lhZ: .3, chestRx: -.02, chestRy: -.15, twoHand: .7 }, true),
  readyLow: pose({ hiltA: -.75, hiltR: .34, hiltH: -.42, bladeYaw: -.25, bladePitch: -.35, bladeRoll: 0, lhX: .3, lhY: -.2, lhZ: .22, chestRx: .22, lift: -.08, thLx: -.35, knL: .5, thRx: .35, knR: .5 }, true),
  guard: pose({ hiltA: -.25, hiltR: .4, hiltH: .12, bladeYaw: 1.35, bladePitch: .35, bladeRoll: 1.57, lhX: .12, lhY: .16, lhZ: .4, chestRx: .12, headRx: .08 }),
  sprint: pose({ chestRx: .32, hiltA: -1.1, hiltR: .3, hiltH: -.3, bladeYaw: -2.6, bladePitch: -.2, lhX: .3, lhY: -.2, lhZ: .2, wings: 1 }),
  // The Moonglaive is held two-handed, left hand forward on the shaft. The chest turns right and the
  // blade yaws back left in chest space, so the point stays on the foe.
  glaiveMid: pose({ chestRy: -.55, hiltA: -1.0, hiltR: .26, hiltH: -.2, bladeYaw: .65, bladePitch: .25, bladeRoll: 0, twoHand: 1, lift: -.03, thLx: -.3, knL: .32, thRx: .28, knR: .38 }, true),
  glaiveHigh: pose({ chestRy: -.45, hiltA: -.7, hiltR: .22, hiltH: .3, bladeYaw: .5, bladePitch: -.2, bladeRoll: 0, twoHand: 1, chestRx: -.04 }, true),
  glaiveLow: pose({ chestRy: -.5, hiltA: -1.1, hiltR: .28, hiltH: -.34, bladeYaw: .6, bladePitch: -.12, bladeRoll: 0, twoHand: 1, chestRx: .22, lift: -.1, thLx: -.45, knL: .6, thRx: .4, knR: .55 }, true),
  glaiveGuard: pose({ chestRy: -.2, hiltA: -.55, hiltR: .38, hiltH: .05, bladeYaw: 1.4, bladePitch: .3, bladeRoll: 1.57, twoHand: 1, chestRx: .1, headRx: .08 }),
  // The Twin Fangs: a blade in each hand, low and forward; the off-hand fang rests in a reverse grip.
  fangsMid: pose({ chestRy: -.15, hiltA: -.6, hiltR: .34, hiltH: -.05, bladeYaw: .3, bladePitch: .35, bladeRoll: 0, lhX: .26, lhY: -.08, lhZ: .3, lbYaw: 2.7, lbPitch: -.35, twoHand: 0, lift: -.06, chestRx: .12, thLx: -.3, knL: .4, thRx: .25, knR: .4 }, true),
  fangsHigh: pose({ chestRy: -.1, hiltA: -.5, hiltR: .28, hiltH: .3, bladeYaw: .2, bladePitch: .9, bladeRoll: 0, lhX: .24, lhY: .22, lhZ: .22, lbYaw: .3, lbPitch: .8, twoHand: 0, chestRx: -.02 }, true),
  fangsLow: pose({ chestRy: -.2, hiltA: -.8, hiltR: .34, hiltH: -.32, bladeYaw: .2, bladePitch: -.1, bladeRoll: 0, lhX: .3, lhY: -.3, lhZ: .26, lbYaw: 2.8, lbPitch: -.1, twoHand: 0, chestRx: .3, lift: -.14, thLx: -.55, knL: .75, thRx: .45, knR: .7 }, true),
  fangsGuard: pose({ hiltA: -.3, hiltR: .38, hiltH: .1, bladeYaw: 1.2, bladePitch: .45, bladeRoll: 1.57, lhX: .12, lhY: .1, lhZ: .38, lbYaw: -1.2, lbPitch: .45, twoHand: 0, chestRx: .12 }),
  fangsSprint: pose({ chestRx: .42, hiltA: -1.3, hiltR: .3, hiltH: -.3, bladeYaw: -2.8, bladePitch: .1, lhX: .36, lhY: -.25, lhZ: -.25, lbYaw: 3, lbPitch: .1, twoHand: 0, wings: 1.2 }),
  glaiveSprint: pose({ chestRx: .32, hiltA: -1.2, hiltR: .3, hiltH: -.3, bladeYaw: -2.7, bladePitch: .15, bladeRoll: 0, twoHand: 0, lhX: .3, lhY: -.2, lhZ: .2, wings: 1 }),
  // The Thornhammer, two hands low on the haft: head up across the body (Mid), over the right shoulder (High),
  // head down by the right foot (Low).
  hammerMid: pose({ chestRy: -.45, chestRx: .05, hiltA: -.85, hiltR: .26, hiltH: -.2, bladeYaw: .45, bladePitch: .55, bladeRoll: 0, twoHand: 1, lift: -.04, thLx: -.3, knL: .35, thRx: .3, knR: .4 }, true),
  hammerHigh: pose({ chestRy: -.3, hiltA: -.6, hiltR: .18, hiltH: .22, bladeYaw: .6, bladePitch: 2.3, bladeRoll: 0, twoHand: 1, chestRx: -.02 }, true),
  hammerLow: pose({ chestRy: -.5, chestRx: .2, hiltA: -1.0, hiltR: .3, hiltH: -.32, bladeYaw: .3, bladePitch: -.55, bladeRoll: 0, twoHand: 1, lift: -.1, thLx: -.45, knL: .6, thRx: .4, knR: .55 }, true),
  hammerGuard: pose({ hiltA: -.35, hiltR: .4, hiltH: .1, bladeYaw: 1.35, bladePitch: .3, bladeRoll: 1.57, twoHand: 1, chestRx: .1, chestRy: -.1 }),
  hammerSprint: pose({ chestRx: .35, hiltA: -1.15, hiltR: .3, hiltH: -.3, bladeYaw: -2.6, bladePitch: -.3, bladeRoll: 0, twoHand: 0, lhX: .3, lhY: -.2, lhZ: .2, wings: 1 }),
  // The Starfists: a boxer's guard (Mid), up and light for kicking (High), crouched with open hands (Low).
  fistsMid: pose({ chestRy: -.25, hiltA: -.35, hiltR: .26, hiltH: .12, lhX: .12, lhY: .12, lhZ: .34, twoHand: 0, lift: -.05, chestRx: .08, thLx: -.35, knL: .35, thRx: .3, knR: .35 }, true),
  fistsHigh: pose({ chestRy: -.4, hiltA: -.4, hiltR: .24, hiltH: .2, lhX: .14, lhY: .2, lhZ: .3, twoHand: 0, chestRx: -.02 }, true),
  fistsLow: pose({ chestRy: -.2, hiltA: -.5, hiltR: .34, hiltH: -.1, lhX: .2, lhY: -.05, lhZ: .42, twoHand: 0, chestRx: .25, lift: -.16, thLx: -.6, knL: .8, thRx: .45, knR: .7 }, true),
  fistsGuard: pose({ hiltA: -.12, hiltR: .22, hiltH: .3, lhX: .12, lhY: .3, lhZ: .22, twoHand: 0, chestRx: .12, headRx: .1 }),
  fistsSprint: pose({ chestRx: .35, hiltA: -.8, hiltR: .25, hiltH: -.15, lhX: .3, lhY: -.1, lhZ: .1, twoHand: 0, wings: 1 }),
};

// Actions: duration + keyframes [t, partialPose]. Channels not given fall back to the running pose.
export const K = (t, o) => [t, pose(o)];
export const LUNGE = { thLx: -.55, knL: .5, thRx: .45, knR: .35, lift: -.08 };
// A variant of an action: retimed to dur, with offsets added where a key sets a channel and values set on every key.
export function vary(src, { dur = src.dur, add = {}, set = {}, spinX = src.spinX, spinY = src.spinY } = {}) {
  return { dur, spinX, spinY, loop: src.loop, keys: src.keys.map(([t, p]) => {
    const q = p.slice();
    for (const [k, v] of Object.entries(add)) if (!Number.isNaN(q[IDX[k]])) q[IDX[k]] += v;
    for (const [k, v] of Object.entries(set)) q[IDX[k]] = v;
    return [t * dur / src.dur, q];
  }) };
}
export const ACTIONS = {
  light1: { dur: .62, keys: [
    K(0, { hiltA: -1.3, hiltR: .42, hiltH: .12, bladeYaw: -2.3, bladePitch: .15, bladeRoll: -1.57, chestRy: -.55, ...LUNGE }),
    K(.14, { hiltA: -1.45, hiltR: .44, hiltH: .15, bladeYaw: -2.5, bladePitch: .2, bladeRoll: -1.57, chestRy: -.7 }),
    K(.24, { hiltA: 0, hiltR: .56, hiltH: .05, bladeYaw: 0, bladePitch: .02, bladeRoll: -1.57, chestRy: 0, chestRx: .18 }),
    K(.34, { hiltA: 1.05, hiltR: .44, hiltH: -.05, bladeYaw: 2.1, bladePitch: -.1, bladeRoll: -1.57, chestRy: .6, chestRx: .15 }),
    K(.62, { hiltA: .6, hiltR: .4, hiltH: -.1, bladeYaw: 1.2, bladePitch: .1, bladeRoll: -1.3, chestRy: .3 }),
  ] },
  light2: { dur: .6, keys: [
    K(0, { hiltA: .9, hiltR: .42, hiltH: -.1, bladeYaw: 1.9, bladePitch: -.15, bladeRoll: 1.57, chestRy: .45, ...LUNGE }),
    K(.12, { hiltA: 1.15, hiltR: .4, hiltH: -.15, bladeYaw: 2.3, bladePitch: -.2, bladeRoll: 1.57, chestRy: .6 }),
    K(.22, { hiltA: 0, hiltR: .56, hiltH: .05, bladeYaw: 0, bladePitch: .1, bladeRoll: 1.57, chestRy: 0 }),
    K(.32, { hiltA: -1.2, hiltR: .44, hiltH: .22, bladeYaw: -2, bladePitch: .35, bladeRoll: 1.57, chestRy: -.6 }),
    K(.6, { hiltA: -.8, hiltR: .4, hiltH: 0, bladeYaw: -1, bladePitch: .4, bladeRoll: 1.2, chestRy: -.3 }),
  ] },
  light3: { dur: .78, keys: [
    K(0, { hiltA: -.4, hiltR: .2, hiltH: .5, bladeYaw: 3.1, bladePitch: 1.1, bladeRoll: 0, chestRx: -.1, twoHand: 1, lift: 0, thLx: -.2, knL: .2, thRx: .3, knR: .3 }),
    K(.2, { hiltA: -.2, hiltR: .12, hiltH: .62, bladeYaw: 3.1, bladePitch: .75, bladeRoll: 0, chestRx: -.2, twoHand: 1 }),
    K(.3, { hiltA: 0, hiltR: .5, hiltH: .15, bladeYaw: 0, bladePitch: .1, bladeRoll: 0, chestRx: .3, twoHand: 1, ...LUNGE }),
    K(.38, { hiltA: .05, hiltR: .5, hiltH: -.28, bladeYaw: 0, bladePitch: -.75, bladeRoll: 0, chestRx: .5, twoHand: 1, lift: -.18, thLx: -.75, knL: .9, thRx: .55, knR: .7 }),
    K(.78, { hiltA: -.3, hiltR: .42, hiltH: -.2, bladeYaw: .1, bladePitch: -.2, bladeRoll: 0, chestRx: .2, twoHand: .3 }),
  ] },
  heavy: { dur: 1.0, keys: [
    K(0, { hiltA: 0, hiltR: .3, hiltH: .1, bladeYaw: 0, bladePitch: .8, twoHand: 1, chestRx: 0 }),
    K(.3, { hiltA: -.2, hiltR: .06, hiltH: .72, bladeYaw: 3.1, bladePitch: .55, bladeRoll: 0, twoHand: 1, chestRx: -.3, chestRy: -.2, lift: .02, thLx: -.1, knL: .15, thRx: .35, knR: .35, wings: 1 }),
    K(.44, { hiltA: -.2, hiltR: .05, hiltH: .75, bladeYaw: 3.1, bladePitch: .35, bladeRoll: 0, twoHand: 1, chestRx: -.35, chestRy: -.2, wings: 1 }),
    K(.54, { hiltA: 0, hiltR: .52, hiltH: .2, bladeYaw: 0, bladePitch: .3, bladeRoll: 0, twoHand: 1, chestRx: .35, chestRy: 0, ...LUNGE }),
    K(.62, { hiltA: 0, hiltR: .5, hiltH: -.35, bladeYaw: 0, bladePitch: -1, bladeRoll: 0, twoHand: 1, chestRx: .65, lift: -.28, thLx: -.95, knL: 1.2, thRx: .7, knR: 1.0 }),
    K(1.0, { hiltA: -.3, hiltR: .42, hiltH: -.25, bladeYaw: .1, bladePitch: -.3, twoHand: .2, chestRx: .2, lift: -.05 }),
  ] },
  roll: { dur: .6, spinX: true, keys: [
    K(0, { lift: -.1, bodyRx: 0, chestRx: .5, hiltA: -.6, hiltR: .25, hiltH: -.15, bladeYaw: 0, bladePitch: -.4, lhX: .2, lhY: -.1, lhZ: .25, thLx: -.6, knL: .8, thRx: -.2, knR: .6 }),
    K(.1, { lift: -.45, bodyRx: 1.2, chestRx: .8, thLx: -1.5, knL: 2.1, thRx: -1.4, knR: 2.2 }),
    K(.3, { lift: -.5, bodyRx: 3.6, chestRx: .8, thLx: -1.6, knL: 2.2, thRx: -1.5, knR: 2.2 }),
    K(.45, { lift: -.3, bodyRx: 6.1, chestRx: .5, thLx: -.9, knL: 1.4, thRx: -.2, knR: 1.1 }),
    K(.6, { lift: -.05, bodyRx: 6.283, chestRx: .15, thLx: -.2, knL: .3, thRx: .15, knR: .3 }),
  ] },
  backstep: { dur: .42, keys: [
    K(0, { lift: -.05, chestRx: -.1, thLx: -.3, knL: .3, thRx: .1, knR: .2 }),
    K(.12, { lift: .05, chestRx: -.25, thLx: .35, knL: .5, thRx: -.2, knR: .2, bodyRx: -.15 }),
    K(.28, { lift: -.12, chestRx: .1, thLx: .2, knL: .6, thRx: -.3, knR: .6, bodyRx: 0 }),
    K(.42, {}),
  ] },
  hurt: { dur: .5, keys: [
    K(0, { chestRx: -.45, headRx: -.4, bodyRx: -.12, hiltA: -.9, hiltR: .3, hiltH: .1, bladePitch: .9, lhX: .35, lhY: .05, lhZ: .1, lift: -.05 }),
    K(.2, { chestRx: -.25, headRx: -.1, bodyRx: -.05 }),
    K(.5, {}),
  ] },
  stagger: { dur: 1.2, keys: [
    K(0, { chestRx: -.5, headRx: -.4, bodyRx: -.2, hiltA: -1.2, hiltR: .3, hiltH: .2, bladePitch: 1.2, lhX: .4, lhY: .1, lhZ: 0, lift: -.1 }),
    K(.4, { chestRx: .6, headRx: .3, bodyRx: .1, hiltA: -.8, hiltR: .25, hiltH: -.3, bladePitch: -1.2, lhX: .2, lhY: -.3, lhZ: .2, lift: -.3, thLx: -.6, knL: .9, thRx: .3, knR: 1 }),
    K(1.0, { chestRx: .5, headRx: .3, lift: -.28 }),
    K(1.2, {}),
  ] },
  drink: { dur: 1.15, keys: [
    K(0, { hiltA: -.9, hiltR: .22, hiltH: -.35, bladeYaw: -.2, bladePitch: -1.1, vial: 1, lhX: .2, lhY: -.1, lhZ: .25 }),
    K(.35, { lhX: .04, lhY: .36, lhZ: .2, headRx: -.4, chestRx: -.1, vial: 1 }),
    K(.8, { lhX: .04, lhY: .38, lhZ: .18, headRx: -.5, chestRx: -.12, vial: 1 }),
    K(1.15, { vial: 0 }),
  ] },
  burst: { dur: .55, keys: [
    K(0, { hiltA: .75, hiltR: .28, hiltH: -.25, bladeYaw: 2.8, bladePitch: -.25, bladeRoll: 1.57, chestRy: .55, chestRx: .25, lhX: .25, lhY: -.1, lhZ: .3, lift: -.15, thLx: -.6, knL: .7, thRx: .5, knR: .5, wings: 1 }),
    K(.4, { hiltA: .8, hiltR: .3, hiltH: -.25, bladeYaw: 2.8, bladePitch: -.25, chestRy: .55, wings: 1 }),
    K(.55, {}),
  ] },
  counter: { dur: .7, keys: [
    K(0, { hiltA: .75, hiltR: .28, hiltH: -.25, bladeYaw: 2.8, bladePitch: -.25, bladeRoll: 1.57, chestRy: .55, lift: -.15, thLx: -.6, knL: .7, thRx: .5, knR: .5, wings: 1 }),
    K(.1, { hiltA: -.4, hiltR: .56, hiltH: .1, bladeYaw: -.5, bladePitch: .25, bladeRoll: 1.57, chestRy: -.3, lift: -.2, thLx: -.9, knL: .8, thRx: .7, knR: .4, wings: 1 }),
    K(.18, { hiltA: -1.3, hiltR: .45, hiltH: .3, bladeYaw: -2.2, bladePitch: .6, bladeRoll: 1.57, chestRy: -.7, wings: 1 }),
    K(.7, {}),
  ] },
  grapple: { dur: 1.1, keys: [
    K(0, { hiltA: -.3, hiltR: .3, hiltH: .05, bladeYaw: 0, bladePitch: .1, bladeRoll: 1.57, twoHand: 1, chestRy: -.4, ...LUNGE }),
    K(.18, { hiltA: -.5, hiltR: .15, hiltH: .1, bladeYaw: 0, bladePitch: .05, twoHand: 1, chestRy: -.6, chestRx: -.1 }),
    K(.3, { hiltA: 0, hiltR: .58, hiltH: .05, bladeYaw: 0, bladePitch: 0, twoHand: 1, chestRy: .1, chestRx: .3, lift: -.15, thLx: -.9, knL: .8, thRx: .7, knR: .4 }),
    K(.65, { hiltA: 0, hiltR: .56, hiltH: .05, bladeYaw: 0, bladePitch: 0, twoHand: 1, chestRy: .1, chestRx: .3 }),
    K(.8, { hiltA: -1.1, hiltR: .45, hiltH: .35, bladeYaw: -1.8, bladePitch: .6, bladeRoll: 1.57, twoHand: 0, chestRy: -.5, chestRx: 0 }),
    K(1.1, {}),
  ] },
  rest: { dur: 1.2, loop: true, keys: [
    K(0, { lift: -.42, chestRx: .35, headRx: .45, hiltA: 0, hiltR: .4, hiltH: -.3, bladeYaw: 0, bladePitch: -1.5, bladeRoll: 0, twoHand: 1, thLx: -1.45, knL: 1.5, thRx: .05, knR: 1.9, wings: .1 }),
    K(1.2, { lift: -.42, chestRx: .35, headRx: .45, hiltA: 0, hiltR: .4, hiltH: -.3, bladeYaw: 0, bladePitch: -1.5, bladeRoll: 0, twoHand: 1, thLx: -1.45, knL: 1.5, thRx: .05, knR: 1.9, wings: .1 }),
  ] },
  death: { dur: 2.2, keys: [
    K(0, { chestRx: -.4, headRx: -.5, hiltA: -1, hiltR: .3, hiltH: .1, bladePitch: 1, lift: -.05 }),
    K(.5, { lift: -.45, chestRx: .5, headRx: .5, bodyRx: .1, thLx: -1.5, knL: 1.6, thRx: 0, knR: 1.9, hiltA: -.8, hiltR: .3, hiltH: -.4, bladePitch: -1.4, lhX: .25, lhY: -.35, lhZ: .2 }),
    K(1.1, { lift: -.6, chestRx: .6, headRx: .6, bodyRx: 1.45, thLx: -1.3, knL: 1.2, thRx: -.4, knR: 1.3, wings: 0 }),
    K(2.2, { lift: -.75, chestRx: .3, headRx: .2, bodyRx: 1.55, thLx: -.1, knL: .2, thRx: 0, knR: .2, hiltA: -1.3, hiltR: .5, hiltH: 0, bladePitch: 0, lhX: .5, lhY: 0, lhZ: .1, wings: 0 }),
  ] },
  rise: { dur: 1.4, keys: [
    K(0, { lift: -.42, chestRx: .35, headRx: .45, hiltA: 0, hiltR: .4, hiltH: -.3, bladeYaw: 0, bladePitch: -1.5, twoHand: 1, thLx: -1.45, knL: 1.5, thRx: .05, knR: 1.9, wings: .1 }),
    K(.8, { lift: -.2, chestRx: .2, headRx: 0, thLx: -.6, knL: .7, thRx: .1, knR: .8 }),
    K(1.4, {}),
  ] },
  fog: { dur: 2.6, keys: [
    K(0, { chestRx: .1, lhX: .15, lhY: .2, lhZ: .45 }),
    K(2.2, { chestRx: .1, lhX: .15, lhY: .2, lhZ: .45 }),
    K(2.6, {}),
  ] },
  shift: { dur: 1.0, keys: [
    K(0, { chestRx: .3, lift: -.1, wings: .3 }),
    K(.4, { chestRx: -.4, headRx: -.5, lift: .1, hiltA: -1.2, hiltR: .4, hiltH: .5, bladePitch: 1.4, lhX: .5, lhY: .35, lhZ: 0, wings: 2 }),
    K(.8, { chestRx: -.3, headRx: -.3, wings: 2 }),
    K(1.0, {}),
  ] },
  // A full turn of the body: the fourth strike of the chain.
  light4: { dur: .8, spinY: true, keys: [
    K(0, { hiltA: -.9, hiltR: .5, hiltH: .05, bladeYaw: -1.6, bladePitch: .05, bladeRoll: -1.57, bodyRy: 0, chestRy: -.2, ...LUNGE }),
    K(.12, { hiltA: -1.1, hiltR: .52, hiltH: .08, bladeYaw: -1.9, bladePitch: .05, bladeRoll: -1.57, bodyRy: -.7, chestRy: -.45, lift: -.14 }),
    K(.44, { hiltA: -.9, hiltR: .58, hiltH: .05, bladeYaw: -1.5, bladePitch: 0, bladeRoll: -1.57, bodyRy: 5.7, chestRy: .2, lift: -.1, wings: 1.6 }),
    K(.56, { hiltA: .4, hiltR: .5, hiltH: 0, bladeYaw: .9, bladePitch: -.05, bladeRoll: -1.57, bodyRy: 6.283, chestRy: .45 }),
    K(.8, { bodyRy: 6.283, hiltA: -.3, hiltR: .4, hiltH: -.1, bladeYaw: .5, bladePitch: .2 }),
  ] },
  // High-stance heavy: a leaping overhead slam.
  skyfall: { dur: 1.05, keys: [
    K(0, { lift: -.18, chestRx: .3, hiltA: -.4, hiltR: .3, hiltH: -.2, bladeYaw: 0, bladePitch: -.3, twoHand: 1, thLx: -.6, knL: .9, thRx: .3, knR: .9 }),
    K(.22, { lift: .55, chestRx: -.35, hiltA: -.1, hiltR: .08, hiltH: .58, bladeYaw: 3.1, bladePitch: .6, bladeRoll: 0, twoHand: 1, thLx: -.9, knL: 1.4, thRx: .4, knR: 1.2, wings: 2 }),
    K(.44, { lift: .62, chestRx: -.4, hiltA: -.1, hiltR: .06, hiltH: .6, bladeYaw: 3.1, bladePitch: .45, twoHand: 1, thLx: -.8, knL: 1.3, thRx: .5, knR: 1.3, wings: 2 }),
    K(.58, { lift: -.28, chestRx: .72, hiltA: 0, hiltR: .5, hiltH: -.35, bladeYaw: 0, bladePitch: -1.1, bladeRoll: 0, twoHand: 1, thLx: -1, knL: 1.3, thRx: .7, knR: 1.1, wings: 1 }),
    K(1.05, { lift: -.08, chestRx: .2, hiltA: -.3, hiltR: .42, hiltH: -.25, bladePitch: -.3, twoHand: .2 }),
  ] },
  // Low-stance heavy: a dashing thrust.
  needle: { dur: .72, keys: [
    K(0, { lift: -.2, chestRx: .35, chestRy: -.55, hiltA: -.8, hiltR: .2, hiltH: -.08, bladeYaw: 0, bladePitch: 0, bladeRoll: 1.57, lhX: .3, lhY: -.05, lhZ: .35, thLx: -.7, knL: .9, thRx: .6, knR: .6 }),
    K(.12, { lift: -.24, chestRx: .4, chestRy: -.75, hiltA: -.9, hiltR: .1, hiltH: -.05, bladeYaw: 0, bladePitch: 0 }),
    K(.24, { lift: -.3, chestRx: .5, chestRy: .15, hiltA: 0, hiltR: .62, hiltH: 0, bladeYaw: 0, bladePitch: .02, lhX: .35, lhY: .05, lhZ: -.1, thLx: -1.15, knL: .7, thRx: .95, knR: .3, wings: 1.6 }),
    K(.46, { lift: -.28, chestRx: .48, chestRy: .15, hiltA: 0, hiltR: .6, hiltH: 0, bladeYaw: 0, bladePitch: .02, thLx: -1.1, knL: .7, thRx: .9, knR: .3 }),
    K(.72, {}),
  ] },
  // Fae dash: low and quick, blade trailing; direction lean is added on top.
  dash: { dur: .36, keys: [
    K(0, { lift: -.14, chestRx: .32, hiltA: -1.0, hiltR: .3, hiltH: -.25, bladeYaw: -2.6, bladePitch: -.25, bladeRoll: 0, lhX: .32, lhY: -.2, lhZ: -.05, thLx: -.85, knL: 1.0, thRx: .55, knR: .9, wings: 1.9 }),
    K(.22, { lift: -.18, chestRx: .28, thLx: -.6, knL: .9, thRx: .45, knR: .8, wings: 1.9 }),
    K(.36, {}),
  ] },
  hop: { dur: .32, keys: [
    K(0, { lift: .02, chestRx: -.18, thLx: .3, knL: .5, thRx: -.2, knR: .3, wings: 1.5 }),
    K(.18, { lift: -.12, chestRx: .08, thLx: .2, knL: .7, thRx: -.3, knR: .7 }),
    K(.32, {}),
  ] },
  // Perfect guard: the blade flicks the blow aside.
  deflect: { dur: .34, keys: [
    K(0, { hiltA: -.1, hiltR: .42, hiltH: .2, bladeYaw: 1.2, bladePitch: .6, bladeRoll: 1.57, lhX: .15, lhY: .18, lhZ: .4, chestRx: -.1 }),
    K(.08, { hiltA: -.55, hiltR: .4, hiltH: .3, bladeYaw: -.5, bladePitch: .95, bladeRoll: 1.57, chestRx: -.22, chestRy: -.35, lhX: .3, lhY: 0, lhZ: .2 }),
    K(.34, {}),
  ] },
  // Flashcut: a single draw-cut that ends in a held follow-through.
  flashcut: { dur: .82, keys: [
    K(0, { lift: -.2, chestRy: .65, chestRx: .3, hiltA: .8, hiltR: .26, hiltH: -.28, bladeYaw: 2.8, bladePitch: -.2, bladeRoll: 1.57, lhX: .25, lhY: -.1, lhZ: .3, thLx: -.8, knL: .9, thRx: .6, knR: .6, wings: 1.2 }),
    K(.1, { lift: -.32, chestRy: -.95, chestRx: .45, hiltA: -1.55, hiltR: .56, hiltH: .15, bladeYaw: -2.4, bladePitch: .2, bladeRoll: 1.57, lhX: .45, lhY: .1, lhZ: -.1, thLx: -1.2, knL: .8, thRx: 1.0, knR: .3, wings: 2 }),
    K(.58, { lift: -.32, chestRy: -.95, chestRx: .45, hiltA: -1.55, hiltR: .56, hiltH: .15, bladeYaw: -2.4, bladePitch: .2, thLx: -1.2, knL: .8, thRx: 1.0, knR: .3, wings: 2 }),
    K(.82, {}),
  ] },
  pickup: { dur: .7, keys: [
    K(0, {}),
    K(.3, { lift: -.35, chestRx: .7, lhX: .15, lhY: -.55, lhZ: .45, thLx: -1, knL: 1.2, thRx: .1, knR: 1.1 }),
    K(.7, {}),
  ] },
  // Drawing the other weapon: a quick flourish overhead.
  swap: { dur: .42, keys: [
    K(0, {}),
    K(.16, { hiltA: -.4, hiltR: .26, hiltH: .34, bladeYaw: -1.4, bladePitch: 1.1, bladeRoll: 0, chestRx: -.12, twoHand: 0, lhX: .4, lhY: .1, lhZ: .1, wings: 1.6 }),
    K(.42, {}),
  ] },

  // ---- Moonglaive
  g_thrust: { dur: .55, keys: [
    K(0, { chestRy: -.75, hiltA: -1.2, hiltR: .2, hiltH: -.1, bladeYaw: .8, bladePitch: .1, bladeRoll: 0, twoHand: 1, lift: -.06, thLx: -.35, knL: .45, thRx: .3, knR: .4 }),
    K(.12, { chestRy: -.8, hiltA: -1.35, hiltR: .15, hiltH: -.08, bladeYaw: .85, bladePitch: .08 }),
    K(.2, { chestRy: -.7, hiltA: -.3, hiltR: .4, hiltH: 0, bladeYaw: .7, bladePitch: .03, twoHand: 1, ...LUNGE, wings: 1.2 }),
    K(.32, { chestRy: -.68, hiltA: -.28, hiltR: .42, hiltH: 0, bladeYaw: .68, bladePitch: .03 }),
    K(.55, { chestRy: -.55, hiltA: -.9, hiltR: .26, hiltH: -.16, bladeYaw: .6, bladePitch: .2 }),
  ] },
  g_sweep: { dur: .64, keys: [
    K(0, { bodyRy: -.5, chestRy: -.75, hiltA: -.1, hiltR: .32, hiltH: -.02, bladeYaw: .05, bladePitch: -.04, bladeRoll: 1.57, twoHand: 1, lift: -.08, thLx: -.45, knL: .5, thRx: .4, knR: .4 }),
    K(.14, { bodyRy: -.6, chestRy: -.85, hiltA: -.15, bladeYaw: 0 }),
    K(.26, { bodyRy: -.05, chestRy: -.15, hiltA: -.05, hiltR: .4, bladeYaw: .3, bladePitch: -.08, wings: 1.2 }),
    K(.36, { bodyRy: .45, chestRy: .45, hiltA: .15, hiltR: .38, bladeYaw: .6, bladePitch: -.1 }),
    K(.64, { bodyRy: .1, chestRy: -.2, hiltA: -.5, hiltR: .3, bladeYaw: .55, bladePitch: .12, bladeRoll: .6 }),
  ] },
  // One-handed wheel: the glaive held out at arm's length through a full turn.
  g_spin: { dur: .8, spinY: true, keys: [
    K(0, { hiltA: -.8, hiltR: .42, hiltH: 0, bladeYaw: -1.4, bladePitch: -.02, bladeRoll: -1.57, bodyRy: 0, chestRy: -.2, twoHand: 0, lhX: .45, lhY: .05, lhZ: 0, ...LUNGE }),
    K(.12, { hiltA: -1.0, bladeYaw: -1.6, bodyRy: -.7, chestRy: -.45, lift: -.14 }),
    K(.44, { hiltA: -.8, hiltR: .5, bladeYaw: -1.3, bodyRy: 5.7, chestRy: .2, lift: -.1, wings: 1.8 }),
    K(.56, { hiltA: -.3, hiltR: .4, bladeYaw: .2, bodyRy: 6.283, chestRy: .1 }),
    K(.8, { bodyRy: 6.283, chestRy: -.45, hiltA: -.9, hiltR: .26, hiltH: -.16, bladeYaw: .6, bladePitch: .2, bladeRoll: 0, twoHand: 1 }),
  ] },
  // Vault and slam: the chain's finisher.
  g_vault: { dur: .95, keys: [
    K(0, { lift: -.2, chestRx: .3, chestRy: -.4, hiltA: -.8, hiltR: .28, hiltH: -.2, bladeYaw: .4, bladePitch: -.4, bladeRoll: 0, twoHand: 1, thLx: -.6, knL: .9, thRx: .3, knR: .9 }),
    K(.24, { lift: .5, chestRx: -.35, chestRy: 0, hiltA: -.2, hiltR: .1, hiltH: .45, bladeYaw: 3.1, bladePitch: .75, twoHand: 1, thLx: -.9, knL: 1.4, thRx: .4, knR: 1.2, wings: 2 }),
    K(.4, { lift: .55, hiltH: .47, bladePitch: .55, wings: 2 }),
    K(.52, { lift: -.28, chestRx: .7, hiltA: 0, hiltR: .5, hiltH: -.16, bladeYaw: 0, bladePitch: .12, twoHand: 1, thLx: -1, knL: 1.3, thRx: .7, knR: 1.1, wings: 1 }),
    K(.95, { lift: -.08, chestRx: .2, chestRy: -.4, hiltA: -.8, hiltR: .28, hiltH: -.2, bladeYaw: .5, bladePitch: -.1 }),
  ] },
  // Mid heavy: a low crescent that wheels all the way round.
  g_crescent: { dur: 1.15, spinY: true, keys: [
    K(0, { lift: -.1, bodyRy: 0, chestRy: -.9, hiltA: -.4, hiltR: .3, hiltH: -.15, bladeYaw: -.4, bladePitch: -.15, bladeRoll: -1.57, twoHand: 1, thLx: -.5, knL: .6, thRx: .45, knR: .5 }),
    K(.3, { lift: -.18, bodyRy: -.5, chestRy: -1.05, bladeYaw: -.6, wings: 1.4 }),
    K(.5, { lift: -.24, bodyRy: 3.4, chestRy: -.2, hiltA: -.5, hiltR: .46, bladeYaw: -1.3, bladePitch: -.1, twoHand: 0, lhX: .45, lhY: .05, lhZ: -.1, wings: 2 }),
    K(.66, { bodyRy: 6.283, chestRy: .3, hiltA: -.1, bladeYaw: .3, twoHand: 0 }),
    K(1.15, { bodyRy: 6.283, chestRy: -.55, hiltA: -1.0, hiltR: .26, hiltH: -.2, bladeYaw: .65, bladePitch: .2, bladeRoll: 0, twoHand: 1, lift: -.04 }),
  ] },
  // High heavy: the Moonfall, a pole-vault leap that drives the blade into the ground.
  g_moonfall: { dur: 1.25, keys: [
    K(0, { lift: -.24, chestRx: .35, chestRy: -.4, hiltA: -.9, hiltR: .26, hiltH: -.25, bladeYaw: .45, bladePitch: -.55, bladeRoll: 0, twoHand: 1, thLx: -.7, knL: 1.1, thRx: .35, knR: 1.1 }),
    K(.24, { lift: -.3, chestRx: .4, bladePitch: -.6, wings: 1.2 }),
    K(.4, { lift: .75, chestRx: -.4, chestRy: 0, hiltA: -.15, hiltR: .1, hiltH: .45, bladeYaw: 3.1, bladePitch: .8, twoHand: 1, thLx: -1, knL: 1.5, thRx: .5, knR: 1.3, wings: 2 }),
    K(.56, { lift: .8, hiltH: .48, bladePitch: .6, wings: 2 }),
    K(.66, { lift: -.3, chestRx: .75, hiltA: 0, hiltR: .5, hiltH: -.16, bladeYaw: 0, bladePitch: .1, twoHand: 1, thLx: -1.05, knL: 1.35, thRx: .75, knR: 1.1, wings: 1 }),
    K(1.25, { lift: -.08, chestRx: .2, chestRy: -.4, hiltA: -.8, hiltR: .28, hiltH: -.2, bladeYaw: .5, bladePitch: -.1 }),
  ] },
  // Low heavy: a crouched coil and a rushing thrust.
  g_pierce: { dur: .85, keys: [
    K(0, { lift: -.26, chestRx: .35, chestRy: -.8, hiltA: -1.3, hiltR: .18, hiltH: -.15, bladeYaw: .8, bladePitch: .02, bladeRoll: 0, twoHand: 1, thLx: -.75, knL: 1, thRx: .6, knR: .7 }),
    K(.14, { chestRy: -.9, hiltA: -1.45, hiltR: .14, bladeYaw: .85 }),
    K(.26, { lift: -.32, chestRx: .45, chestRy: -.6, hiltA: -.15, hiltR: .46, hiltH: -.02, bladeYaw: .6, bladePitch: 0, twoHand: 1, thLx: -1.2, knL: .7, thRx: 1.0, knR: .3, wings: 1.8 }),
    K(.5, { lift: -.3, chestRx: .44, chestRy: -.6, hiltA: -.15, hiltR: .46, bladeYaw: .6, thLx: -1.15, knL: .7, thRx: .95, knR: .3 }),
    K(.85, {}),
  ] },
};

// ---- Air combat: the launcher, strikes with the legs tucked, the Starfall plunge and its landing.
export const TUCK = { thLx: -1.1, knL: 1.5, thRx: -.5, knR: 1.3, lift: 0, wings: 1.9 };
export const airVariant = (src, dur) => ({ dur, spinY: src.spinY, keys: src.keys.map(([t, p]) => {
  const q = p.slice();
  for (const [k, v] of Object.entries(TUCK)) q[IDX[k]] = v;
  return [t * dur / src.dur, q];
}) });
Object.assign(ACTIONS, {
  launch: { dur: .62, keys: [
    K(0, { lift: -.25, chestRx: .35, hiltA: -1.0, hiltR: .34, hiltH: -.4, bladeYaw: -.9, bladePitch: -.7, bladeRoll: 1.57, thLx: -.7, knL: 1.0, thRx: .4, knR: .9 }),
    K(.12, { lift: .05, chestRx: -.25, hiltA: -.2, hiltR: .45, hiltH: .45, bladeYaw: 0, bladePitch: 1.2, bladeRoll: 1.57, thLx: -.2, knL: .2, thRx: .1, knR: .2, wings: 2 }),
    K(.3, { chestRx: -.3, hiltA: -.2, hiltR: .4, hiltH: .55, bladeYaw: 0, bladePitch: 1.4, ...TUCK }),
    K(.62, { chestRx: 0, hiltA: -.6, hiltR: .4, hiltH: .1, bladeYaw: .2, bladePitch: .4, bladeRoll: 0, ...TUCK }),
  ] },
  air1: airVariant(ACTIONS.light1, .42),
  air2: airVariant(ACTIONS.light2, .42),
  air3: airVariant(ACTIONS.light4, .6),
  plunge: { dur: 1.2, keys: [
    K(0, { chestRx: -.3, hiltA: -.1, hiltR: .1, hiltH: .5, bladeYaw: 3.1, bladePitch: .8, bladeRoll: 0, twoHand: 1, ...TUCK }),
    K(.14, { chestRx: .5, hiltA: 0, hiltR: .32, hiltH: -.15, bladeYaw: 0, bladePitch: -1.2, bladeRoll: 0, twoHand: 1, thLx: -.3, knL: .6, thRx: .2, knR: .5, lift: 0, wings: 2 }),
    K(1.2, { chestRx: .5, hiltA: 0, hiltR: .32, hiltH: -.15, bladeYaw: 0, bladePitch: -1.2, twoHand: 1, thLx: -.3, knL: .6, thRx: .2, knR: .5, wings: 2 }),
  ] },
  plungeLand: { dur: .55, keys: [
    K(0, { lift: -.32, chestRx: .7, hiltA: 0, hiltR: .45, hiltH: -.3, bladeYaw: 0, bladePitch: -1.1, bladeRoll: 0, twoHand: 1, thLx: -1.1, knL: 1.4, thRx: .8, knR: 1.2, wings: 1.4 }),
    K(.25, { lift: -.28, chestRx: .6, thLx: -1, knL: 1.3, thRx: .75, knR: 1.1 }),
    K(.55, {}),
  ] },
  fall: { dur: .8, loop: true, keys: [
    K(0, { thLx: -.55, knL: .9, thRx: -.15, knR: .7, chestRx: .08, wings: 1.7 }),
    K(.8, { thLx: -.55, knL: .9, thRx: -.15, knR: .7, chestRx: .08, wings: 1.7 }),
  ] },
});

// ---- Twin Fangs: quick alternating cuts, a crossing slash, spinning flurries.
export const SOFT = { thLx: -.4, knL: .45, thRx: .35, knR: .35, lift: -.07 };
Object.assign(ACTIONS, {
  f_slash1: { dur: .44, keys: [
    K(0, { hiltA: -1.1, hiltR: .4, hiltH: .1, bladeYaw: -1.9, bladePitch: .1, bladeRoll: -1.57, chestRy: -.45, lhX: .25, lhY: -.05, lhZ: .3, lbYaw: 2.6, lbPitch: -.3, twoHand: 0, ...SOFT }),
    K(.1, { hiltA: .2, hiltR: .52, hiltH: .05, bladeYaw: .5, bladePitch: 0, chestRy: .1 }),
    K(.18, { hiltA: .9, hiltR: .42, hiltH: 0, bladeYaw: 1.9, bladePitch: -.05, chestRy: .45 }),
    K(.44, { hiltA: -.3, hiltR: .36, hiltH: 0, bladeYaw: .5, bladePitch: .3, chestRy: .1 }),
  ] },
  f_slash2: { dur: .44, keys: [
    K(0, { lhX: .5, lhY: .05, lhZ: .05, lbYaw: 1.9, lbPitch: .1, lbRoll: 1.57, chestRy: .45, hiltA: -.8, hiltR: .3, hiltH: -.1, bladeYaw: -.3, bladePitch: .2, bladeRoll: 0, twoHand: 0, ...SOFT }),
    K(.1, { lhX: .05, lhY: 0, lhZ: .52, lbYaw: -.3, lbPitch: 0, chestRy: -.1 }),
    K(.18, { lhX: -.3, lhY: -.02, lhZ: .35, lbYaw: -1.8, lbPitch: -.05, chestRy: -.45 }),
    K(.44, { lhX: .2, lhY: -.05, lhZ: .3, lbYaw: 1, lbPitch: .2, chestRy: -.1 }),
  ] },
  f_cross: { dur: .56, keys: [
    K(0, { hiltA: -1.3, hiltR: .36, hiltH: .25, bladeYaw: -1.6, bladePitch: .5, bladeRoll: 1.57, lhX: .5, lhY: .25, lhZ: .1, lbYaw: 1.6, lbPitch: .5, lbRoll: -1.57, chestRx: -.15, twoHand: 0, wings: 1.2 }),
    K(.14, { hiltA: .5, hiltR: .45, hiltH: -.1, bladeYaw: 1.2, bladePitch: -.4, lhX: -.2, lhY: -.1, lhZ: .45, lbYaw: -1.2, lbPitch: -.4, chestRx: .3, ...SOFT }),
    K(.3, { hiltA: .55, hiltR: .44, hiltH: -.12, bladeYaw: 1.3, bladePitch: -.45, lhX: -.22, lhY: -.12, lhZ: .44, lbYaw: -1.3, lbPitch: -.45 }),
    K(.56, { hiltA: -.4, hiltR: .34, hiltH: -.05, bladeYaw: .4, bladePitch: .3, lhX: .26, lhY: -.08, lhZ: .3, lbYaw: 2.5, lbPitch: -.3, chestRx: .1 }),
  ] },
  // Arms flung wide, two full turns.
  f_spin: { dur: .8, spinY: true, keys: [
    K(0, { bodyRy: 0, hiltA: -1.4, hiltR: .55, hiltH: .05, bladeYaw: -1.8, bladePitch: 0, bladeRoll: -1.57, lhX: .55, lhY: .05, lhZ: 0, lbYaw: 1.8, lbPitch: 0, lbRoll: 1.57, lift: -.1, twoHand: 0 }),
    K(.12, { bodyRy: -.5, lift: -.14 }),
    K(.64, { bodyRy: 12.566, lift: -.1, wings: 2 }),
    K(.8, { bodyRy: 12.566, hiltA: -.6, hiltR: .34, hiltH: -.05, bladeYaw: .3, bladePitch: .35, lhX: .26, lhY: -.08, lhZ: .3, lbYaw: 2.7, lbPitch: -.35 }),
  ] },
  // Mid heavy: a travelling whirlwind.
  f_whirl: { dur: 1.0, spinY: true, keys: [
    K(0, { bodyRy: 0, lift: -.2, chestRx: .3, hiltA: -1.4, hiltR: .5, hiltH: -.05, bladeYaw: -1.9, bladePitch: -.1, bladeRoll: -1.57, lhX: .5, lhY: -.05, lhZ: 0, lbYaw: 1.9, lbPitch: -.1, lbRoll: 1.57, twoHand: 0, thLx: -.6, knL: .8, thRx: .4, knR: .7 }),
    K(.18, { bodyRy: -.6, lift: -.24 }),
    K(.82, { bodyRy: 18.85, lift: .04, chestRx: .1, wings: 2, thLx: -.3, knL: .4, thRx: .2, knR: .4 }),
    K(1.0, { bodyRy: 18.85, lift: -.06, hiltA: -.6, hiltR: .34, hiltH: -.05, bladeYaw: .3, bladePitch: .35, lhX: .26, lhY: -.08, lhZ: .3, lbYaw: 2.7, lbPitch: -.35 }),
  ] },
  // High heavy: a leap and a crossing downward cut.
  f_xfall: { dur: .95, keys: [
    K(0, { lift: -.2, chestRx: .3, hiltA: -.8, hiltR: .3, hiltH: -.2, bladeYaw: .2, bladePitch: -.3, lhX: .3, lhY: -.25, lhZ: .2, lbYaw: -.2, lbPitch: -.3, twoHand: 0, thLx: -.7, knL: 1, thRx: .3, knR: .9 }),
    K(.25, { lift: .5, chestRx: -.35, hiltA: -.3, hiltR: .12, hiltH: .5, bladeYaw: -.5, bladePitch: 1.3, bladeRoll: 1.57, lhX: .12, lhY: .48, lhZ: .12, lbYaw: .5, lbPitch: 1.3, lbRoll: -1.57, thLx: -.9, knL: 1.4, thRx: .4, knR: 1.2, wings: 2 }),
    K(.4, { lift: .55, hiltH: .52, lhY: .5 }),
    K(.52, { lift: -.26, chestRx: .65, hiltA: .3, hiltR: .48, hiltH: -.25, bladeYaw: .6, bladePitch: -.6, lhX: -.1, lhY: -.2, lhZ: .45, lbYaw: -.6, lbPitch: -.6, thLx: -1, knL: 1.3, thRx: .7, knR: 1.1, wings: 1 }),
    K(.95, { lift: -.08, chestRx: .2, hiltA: -.5, hiltR: .34, hiltH: -.1, bladeYaw: .3, bladePitch: .2, lhX: .26, lhY: -.1, lhZ: .3, lbYaw: 2.6, lbPitch: -.3 }),
  ] },
  // Low heavy: the Viper Dash, straight through the foe with blades trailing.
  f_viper: { dur: .8, keys: [
    K(0, { lift: -.25, chestRx: .5, hiltA: -1.3, hiltR: .3, hiltH: -.3, bladeYaw: -2.8, bladePitch: .1, lhX: .36, lhY: -.25, lhZ: -.25, lbYaw: 3, lbPitch: .1, twoHand: 0, thLx: -.9, knL: 1.1, thRx: .6, knR: .8 }),
    K(.12, { lift: -.32, chestRx: .6, thLx: -1.1, knL: .8, thRx: 1, knR: .4, wings: 2 }),
    K(.44, { lift: -.3, chestRx: .55, hiltA: -1.2, bladeYaw: -2.6, lbYaw: 2.9, thLx: -1.05, knL: .8, thRx: .95, knR: .4, wings: 2 }),
    K(.8, { lift: -.08, chestRx: .15, hiltA: -.6, hiltR: .34, hiltH: -.05, bladeYaw: .3, bladePitch: .35, lhX: .26, lhY: -.08, lhZ: .3, lbYaw: 2.7, lbPitch: -.35 }),
  ] },
});

export const fill = p => p.map((v, i) => (Number.isNaN(v) ? P.ready[i] : v));
// Locomotion holds per weapon: the stance guards, the raised guard and the sprint. armoryanims.js adds the rest.
export const LOCO = {
  fangs: { mid: P.fangsMid, high: P.fangsHigh, low: P.fangsLow, guard: fill(P.fangsGuard), sprint: fill(P.fangsSprint) },
  sword: { mid: P.ready, high: fill(P.readyHigh), low: fill(P.readyLow), guard: fill(P.guard), sprint: fill(P.sprint) },
  glaive: { mid: P.glaiveMid, high: P.glaiveHigh, low: P.glaiveLow, guard: fill(P.glaiveGuard), sprint: fill(P.glaiveSprint) },
  hammer: { mid: P.hammerMid, high: P.hammerHigh, low: P.hammerLow, guard: fill(P.hammerGuard), sprint: fill(P.hammerSprint) },
  fists: { mid: P.fistsMid, high: P.fistsHigh, low: P.fistsLow, guard: fill(P.fistsGuard), sprint: fill(P.fistsSprint) },
};

function sampleAction(act, t, out) {
  const keys = act.keys;
  if (act.loop) t %= act.dur;
  out.fill(NaN);
  // Each channel interpolates between the nearest keys that define it.
  for (let c = 0; c < N; c++) {
    let a = -1, b = -1;
    for (let i = 0; i < keys.length; i++) {
      if (Number.isNaN(keys[i][1][c])) continue;
      if (keys[i][0] <= t) a = i; else { b = i; break; }
    }
    if (a < 0 && b < 0) continue;
    if (a < 0) { out[c] = keys[b][1][c]; continue; }
    if (b < 0) { out[c] = keys[a][1][c]; continue; }
    const [ta, pa] = keys[a], [tb, pb] = keys[b];
    const u = smooth(clamp((t - ta) / (tb - ta), 0, 1));
    out[c] = lerp(pa[c], pb[c], u);
  }
  return out;
}

// ---------------------------------------------------------------- model
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function buildKnight() {
  const mats = {
    steel: new THREE.MeshStandardMaterial({ color: 0xb4bccb, metalness: .85, roughness: .32 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2c313d, metalness: .7, roughness: .45 }),
    cloth: new THREE.MeshStandardMaterial({ color: 0x3a2358, roughness: .9, side: THREE.DoubleSide }),
    trim: new THREE.MeshStandardMaterial({ color: 0xd6ac52, metalness: 1, roughness: .28 }),
    leather: new THREE.MeshStandardMaterial({ color: 0x3b2a22, roughness: .8 }),
    visor: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x7ff0ff, emissiveIntensity: 2.2 }),
    blade: new THREE.MeshStandardMaterial({ color: 0xe6eef8, metalness: 1, roughness: .12, emissive: 0x4fd8ff, emissiveIntensity: .12 }),
    wing: new THREE.MeshBasicMaterial({ map: wingTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: .5 }),
    vial: new THREE.MeshStandardMaterial({ color: 0xff7ab8, emissive: 0xff4aa0, emissiveIntensity: 1.4, transparent: true, opacity: .85 }),
  };
  const mesh = (geo, mat, parent, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
  };
  const node = (parent, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };

  const root = new THREE.Group();
  const body = node(root, 0, .95, 0);
  const hips = node(body);
  // Pelvis, belt and tasset skirt.
  mesh(new THREE.CylinderGeometry(.17, .19, .2, 10), mats.dark, hips, 0, .02, 0).scale.set(1, 1, .75);
  mesh(new THREE.TorusGeometry(.18, .025, 6, 16), mats.leather, hips, 0, .1, 0).rotation.x = Math.PI / 2;
  mesh(new THREE.BoxGeometry(.06, .06, .03), mats.trim, hips, 0, .1, .15);
  const tabF = mesh(new THREE.PlaneGeometry(.22, .5), mats.cloth, hips, 0, -.2, .15); tabF.rotation.x = -.08;
  const tabB = mesh(new THREE.PlaneGeometry(.26, .52), mats.cloth, hips, 0, -.2, -.14); tabB.rotation.x = .08;
  for (const s of [-1, 1]) { const t = mesh(new THREE.BoxGeometry(.13, .22, .2), mats.steel, hips, s * .17, -.06, 0); t.rotation.z = s * .18; }

  const spine = node(hips, 0, .1, 0);
  const chest = node(spine, 0, .18, 0);
  // Cuirass: a squashed capsule with a gold rim and a gem.
  const torso = mesh(new THREE.CapsuleGeometry(.19, .2, 6, 14), mats.steel, chest, 0, .1, 0); torso.scale.set(1.12, 1, .78);
  mesh(new THREE.CylinderGeometry(.155, .19, .12, 12), mats.dark, chest, 0, -.1, 0).scale.set(1.05, 1, .8);
  mesh(new THREE.TorusGeometry(.14, .018, 6, 16), mats.trim, chest, 0, .26, .015).rotation.x = Math.PI / 2 - .2;
  mesh(new THREE.OctahedronGeometry(.035), mats.visor, chest, 0, .16, .16);
  // Pauldrons.
  const shoulderPos = { L: V(.215, .24, 0), R: V(-.215, .24, 0) };
  for (const s of [-1, 1]) {
    const pd = mesh(new THREE.SphereGeometry(.11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.7), mats.steel, chest, s * .24, .27, 0);
    pd.scale.set(1.15, .9, 1.1); pd.rotation.z = -s * .35;
    mesh(new THREE.TorusGeometry(.105, .012, 5, 14), mats.trim, pd, 0, .02, 0).rotation.x = Math.PI / 2;
  }

  const neck = node(chest, 0, .31, 0);
  const head = node(neck, 0, .02, 0);
  // Helm: rounded dome, faceplate with a glowing visor slit, and two antennae (the pixie part).
  const helm = mesh(new THREE.SphereGeometry(.125, 16, 12), mats.steel, head, 0, .14, 0); helm.scale.set(1, 1.12, 1.08);
  mesh(new THREE.BoxGeometry(.2, .1, .06), mats.steel, head, 0, .09, .1).rotation.x = .15;
  mesh(new THREE.BoxGeometry(.15, .018, .02), mats.visor, head, 0, .145, .128);
  mesh(new THREE.CylinderGeometry(.13, .14, .06, 14), mats.trim, head, 0, .08, 0);
  const antTip = [];
  for (const s of [-1, 1]) {
    const a = node(head, s * .05, .26, .02);
    a.rotation.set(-.35, 0, -s * .45);
    mesh(new THREE.CylinderGeometry(.008, .012, .22, 5), mats.dark, a, 0, .11, 0);
    const a2 = node(a, 0, .22, 0); a2.rotation.x = -.7;
    mesh(new THREE.CylinderGeometry(.006, .008, .12, 5), mats.dark, a2, 0, .06, 0);
    antTip.push(mesh(new THREE.SphereGeometry(.022, 8, 6), mats.visor, a2, 0, .13, 0));
  }

  // Cape.
  const capeNode = node(chest, 0, .3, -.14);
  // Two tattered tails rather than one sheet, so the knight reads from behind.
  const capeGeo = new THREE.PlaneGeometry(.17, .78, 2, 8); capeGeo.translate(0, -.39, 0);
  const pa = capeGeo.attributes.position;
  for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); pa.setX(i, pa.getX(i) * (1 - y * .35)); if (y < -.7) pa.setY(i, y + Math.sin(pa.getX(i) * 60) * .04); }
  capeGeo.computeVertexNormals();
  const cape = new THREE.Group(); capeNode.add(cape);
  for (const s of [-1, 1]) {
    const tail = mesh(capeGeo, mats.cloth, cape, s * .085, 0, 0); tail.rotation.y = s * .18;
    const trim = mesh(new THREE.BoxGeometry(.17, .02, .01), mats.trim, tail, 0, -.02, .005);
    trim.castShadow = false;
  }

  // Wings.
  const wingGeoA = new THREE.PlaneGeometry(.7, .42); wingGeoA.translate(.33, .06, 0);
  const wingGeoB = new THREE.PlaneGeometry(.5, .32); wingGeoB.translate(.23, -.04, 0);
  const wingRoot = node(chest, 0, .18, -.17);
  const wings = [];
  for (const s of [-1, 1]) {
    for (const [geo, tilt] of [[wingGeoA, .35], [wingGeoB, -.45]]) {
      const w = node(wingRoot); const m = new THREE.Mesh(geo, mats.wing); m.renderOrder = 5;
      if (s < 0) m.scale.x = -1;
      w.add(m); w.userData = { s, tilt };
      wings.push(w);
    }
  }

  // Arms: shoulder → elbow → hand. Rest direction is -Y.
  const UP = .29, LO = .27;
  const arm = side => {
    const s = side === 'L' ? 1 : -1;
    const sh = node(chest, shoulderPos[side].x, shoulderPos[side].y, shoulderPos[side].z);
    const upper = new THREE.CylinderGeometry(.052, .045, UP, 8); upper.translate(0, -UP / 2, 0);
    mesh(upper, mats.dark, sh);
    mesh(new THREE.CylinderGeometry(.058, .058, .12, 8), mats.steel, sh, 0, -.1, 0);
    const el = node(sh, 0, -UP, 0);
    mesh(new THREE.SphereGeometry(.05, 8, 6), mats.steel, el);
    const lower = new THREE.CylinderGeometry(.048, .042, LO, 8); lower.translate(0, -LO / 2, 0);
    mesh(lower, mats.steel, el);
    mesh(new THREE.CylinderGeometry(.058, .05, .1, 8), mats.trim, el, 0, -LO + .07, 0);
    const hand = node(el, 0, -LO, 0);
    mesh(new THREE.BoxGeometry(.075, .09, .085), mats.dark, hand, 0, -.035, 0);
    return { sh, el, hand, s };
  };
  const armL = arm('L'), armR = arm('R');

  // Sword in the right hand: the blade runs along the hand's +Z.
  const sword = node(armR.hand, 0, -.04, 0);
  mesh(new THREE.CylinderGeometry(.018, .018, .2, 6), mats.leather, sword, 0, 0, 0).rotation.x = Math.PI / 2;
  mesh(new THREE.SphereGeometry(.03, 8, 6), mats.trim, sword, 0, 0, -.11);
  mesh(new THREE.BoxGeometry(.03, .24, .04), mats.trim, sword, 0, 0, .1);
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-.036, 0); bladeShape.lineTo(-.031, .86); bladeShape.lineTo(0, .98); bladeShape.lineTo(.031, .86); bladeShape.lineTo(.036, 0); bladeShape.lineTo(-.036, 0);
  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: .008, bevelEnabled: true, bevelThickness: .003, bevelSize: .004, bevelSegments: 1 });
  bladeGeo.translate(0, 0, -.004);
  // Shape is in XY: rotate so length runs along +Z and the edge faces ±Y.
  bladeGeo.rotateZ(Math.PI / 2); bladeGeo.rotateY(-Math.PI / 2);
  const blade = mesh(bladeGeo, mats.blade, sword, 0, 0, .12);
  const fuller = new THREE.Mesh(new THREE.BoxGeometry(.012, .006, .7), mats.visor); fuller.position.set(0, 0, .45); sword.add(fuller);
  fuller.visible = false;
  const tip = node(sword, 0, 0, 1.08), base = node(sword, 0, 0, .2);

  // The Moonglaive: a lacquered shaft ending in a crescent blade. The grip sits a third of the way up.
  mats.shaft = new THREE.MeshStandardMaterial({ color: 0x2a1d33, roughness: .5, metalness: .35 });
  const glaive = node(armR.hand, 0, -.04, 0);
  const shaftGeo = new THREE.CylinderGeometry(.019, .022, 1.72, 8); shaftGeo.rotateX(Math.PI / 2); shaftGeo.translate(0, 0, .3);
  mesh(shaftGeo, mats.shaft, glaive);
  for (const z of [-.08, .1, 1.12]) { const band = new THREE.CylinderGeometry(.026, .026, .05, 8); band.rotateX(Math.PI / 2); mesh(band, mats.trim, glaive, 0, 0, z); }
  const butt = new THREE.ConeGeometry(.026, .12, 6); butt.rotateX(-Math.PI / 2); mesh(butt, mats.trim, glaive, 0, 0, -.62);
  mesh(new THREE.SphereGeometry(.036, 8, 6), mats.trim, glaive, 0, 0, 1.16);
  const gShape = new THREE.Shape();
  gShape.moveTo(-.03, 0); gShape.quadraticCurveTo(-.045, .3, -.01, .62); gShape.lineTo(.004, .64);
  gShape.quadraticCurveTo(.1, .34, .04, .02); gShape.lineTo(-.03, 0);
  const gBladeGeo = new THREE.ExtrudeGeometry(gShape, { depth: .008, bevelEnabled: true, bevelThickness: .003, bevelSize: .004, bevelSegments: 1 });
  gBladeGeo.translate(0, 0, -.004); gBladeGeo.rotateX(Math.PI / 2); gBladeGeo.rotateZ(Math.PI / 2); gBladeGeo.translate(0, 0, 1.16);
  mesh(gBladeGeo, mats.blade, glaive);
  const gTip = node(glaive, 0, 0, 1.78), gBase = node(glaive, 0, 0, 1.0);

  // The Twin Fangs: two short curved blades, one in each hand.
  const fangGeo = (() => {
    const sh = new THREE.Shape();
    sh.moveTo(-.03, 0); sh.quadraticCurveTo(-.05, .36, .02, .66); sh.lineTo(.03, .6); sh.quadraticCurveTo(.035, .3, .03, 0); sh.lineTo(-.03, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: .007, bevelEnabled: true, bevelThickness: .003, bevelSize: .003, bevelSegments: 1 });
    g.translate(0, 0, -.0035); g.rotateX(Math.PI / 2); g.rotateZ(Math.PI / 2); g.translate(0, 0, .1);
    return g;
  })();
  const fang = hand => {
    const f = node(hand, 0, -.04, 0);
    mesh(new THREE.CylinderGeometry(.016, .016, .14, 6), mats.leather, f, 0, 0, 0).rotation.x = Math.PI / 2;
    mesh(new THREE.BoxGeometry(.025, .12, .03), mats.trim, f, 0, 0, .075);
    mesh(new THREE.SphereGeometry(.022, 8, 6), mats.trim, f, 0, 0, -.08);
    mesh(fangGeo, mats.blade, f);
    f.visible = false;
    return { f, tip: node(f, 0, 0, .76), base: node(f, 0, 0, .18) };
  };
  const fangR = fang(armR.hand), fangL = fang(armL.hand);

  // The Thornhammer: a long haft and a head of moon-iron set with thorns, a moon-face on one end and a spike
  // on the other. The right hand grips near the butt, the left a little above it.
  mats.iron = new THREE.MeshStandardMaterial({ color: 0x5c6272, metalness: .8, roughness: .42 });
  const hammer = node(armR.hand, 0, -.04, 0);
  const haft = new THREE.CylinderGeometry(.024, .03, 1.34, 8); haft.rotateX(Math.PI / 2); haft.translate(0, 0, .37);
  mesh(haft, mats.shaft, hammer);
  for (const z of [-.22, .1, .86]) { const band = new THREE.CylinderGeometry(.033, .033, .05, 8); band.rotateX(Math.PI / 2); mesh(band, mats.trim, hammer, 0, 0, z); }
  mesh(new THREE.SphereGeometry(.04, 8, 6), mats.trim, hammer, 0, 0, -.32);
  const hHead = node(hammer, 0, 0, 1.04);
  mesh(new THREE.BoxGeometry(.19, .4, .22), mats.iron, hHead);
  mesh(new THREE.BoxGeometry(.21, .06, .24), mats.trim, hHead, 0, .12, 0);
  mesh(new THREE.BoxGeometry(.21, .06, .24), mats.trim, hHead, 0, -.12, 0);
  const face = mesh(new THREE.CylinderGeometry(.1, .1, .03, 14), mats.iron, hHead, 0, .215, 0);
  mesh(new THREE.TorusGeometry(.07, .012, 6, 16), mats.visor, face, 0, .02, 0).rotation.x = Math.PI / 2;
  const spike = new THREE.ConeGeometry(.06, .2, 6); spike.rotateX(Math.PI); mesh(spike, mats.trim, hHead, 0, -.3, 0);
  for (const [x, z] of [[.1, .08], [-.1, .08], [.1, -.08], [-.1, -.08]]) { const th = new THREE.ConeGeometry(.018, .08, 4); th.rotateZ(x > 0 ? -Math.PI / 2 : Math.PI / 2); mesh(th, mats.trim, hHead, x * 1.2, 0, z); }
  mesh(new THREE.ConeGeometry(.035, .12, 5), mats.trim, hHead, 0, 0, .15).rotation.x = Math.PI / 2;
  const hTip = node(hammer, 0, 0, 1.18), hBase = node(hammer, 0, 0, .88);
  hammer.visible = false;

  // The Starfists: plated gauntlets with a knuckle bar and a star gem. The fist lines up with the forearm, so
  // the knuckles lead where the arm reaches.
  const gauntlet = hand => {
    const g = node(hand, 0, 0, 0);
    mesh(new THREE.BoxGeometry(.105, .11, .12), mats.steel, g, 0, -.06, .01);
    mesh(new THREE.BoxGeometry(.115, .035, .07), mats.trim, g, 0, -.115, .03);
    mesh(new THREE.OctahedronGeometry(.024), mats.visor, g, 0, -.06, .075);
    mesh(new THREE.CylinderGeometry(.066, .058, .13, 8), mats.steel, g, 0, .05, 0);
    mesh(new THREE.TorusGeometry(.062, .01, 5, 12), mats.trim, g, 0, .115, 0).rotation.x = Math.PI / 2;
    g.visible = false;
    return { g, tip: node(g, 0, -.15, .02), base: node(g, 0, .02, 0) };
  };
  const gauntR = gauntlet(armR.hand), gauntL = gauntlet(armL.hand);

  // Carried weapons that aren't drawn ride across the back.
  const backMount = (src, pos, dir) => {
    const b = src.clone(true); b.position.copy(pos);
    const zAxis = dir.clone().normalize(), xAxis = V(0, 0, 1), yAxis = V().crossVectors(zAxis, xAxis).normalize();
    xAxis.crossVectors(yAxis, zAxis).normalize();
    b.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
    b.visible = false; chest.add(b);
    return b;
  };
  const weapons = {
    sword: { node: sword, tip, base, grip: -.11, back: backMount(sword, V(-.16, .42, -.21), V(.38, -.92, -.05)) },
    glaive: { node: glaive, tip: gTip, base: gBase, grip: .24, back: backMount(glaive, V(.05, .12, -.24), V(-.42, .9, -.08)) },
    hammer: { node: hammer, tip: hTip, base: hBase, grip: .22, back: backMount(hammer, V(.02, .1, -.24), V(-.4, .9, -.1)) },
    fists: { node: gauntR.g, off: gauntL.g, tip: gauntR.tip, base: gauntR.base, tip2: gauntL.tip, base2: gauntL.base, grip: 0, bare: true, back: (() => { const g = new THREE.Group(); chest.add(g); g.visible = false; return g; })() },
    fangs: { node: fangR.f, off: fangL.f, tip: fangR.tip, base: fangR.base, tip2: fangL.tip, base2: fangL.base, grip: -.11,
      back: (() => { const g = new THREE.Group(); g.add(backMount(fangR.f, V(-.14, -.12, -.2), V(.75, -.6, -.1)), backMount(fangR.f, V(.14, -.12, -.2), V(-.75, -.6, -.1))); chest.add(g); g.visible = false; for (const c of g.children) c.visible = true; return g; })() },
  };
  glaive.visible = false;
  // The armory's fifteen (armorymodels.js).
  Object.assign(weapons, buildArmory({ THREE, mats, mesh, node, armR, armL, chest, backMount, V, sword, fangGeo }));

  // The ranged weapons (ranged.js): the bow in the left hand, the guns in the right; shown while aimed.
  const ranged = buildRanged({ THREE, mats, mesh, node, armR, armL, chest, backMount, V });

  // Elixir vial in the left hand.
  const vial = mesh(new THREE.CapsuleGeometry(.035, .06, 4, 8), mats.vial, armL.hand, 0, -.08, .03);
  vial.visible = false;

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x7ff0ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  glow.scale.setScalar(2.4); glow.position.y = 1.1; root.add(glow);

  const k = { root, body, hips, spine, chest, neck, head, armL, armR, sword, blade, fuller, tip, base, capeNode, cape, wings, wingRoot, vial, mats, glow, antTip, UP, LO,
    weapons, ranged, grip: -.11, weapon: 'sword', ...legs(hips, mats, mesh, node) };
  // Draw a weapon; the others the knight owns hang on the back.
  k.setWeapon = (id, owned = [id]) => {
    for (const [w, W] of Object.entries(weapons)) { W.node.visible = w === id; if (W.off) W.off.visible = w === id; W.back.visible = w !== id && owned.includes(w); }
    const W = weapons[id];
    k.weapon = id; k.tip = W.tip; k.base = W.base; k.grip = W.grip; k.tip2 = W.tip2 || null; k.base2 = W.base2 || null; k.bare = !!W.bare;
    k.pair = !!W.off && !W.bare && !W.shield;   // a blade in the off hand, aimed by the lb* channels
    k.owned = owned; k.setRanged(k.aimed || null);
  };
  // Raise a ranged weapon (or put it away: null): the drawn weapon is hidden while it is held.
  k.setRanged = (id, carried = k.carried) => {
    k.aimed = id; k.carried = carried;
    const W = weapons[k.weapon], R = id && ranged[id];
    W.node.visible = !R; if (W.off) W.off.visible = !R;
    for (const [rid, r] of Object.entries(ranged)) { r.node.visible = rid === id; r.back.visible = rid === carried && rid !== id; }
    k.grip = R?.grip ?? W.grip; k.bowHand = !!R?.leftHand;
  };
  return k;
}

function legs(hips, mats, mesh, node) {
  const TH = .45, SH = .44;
  const leg = s => {
    const th = node(hips, s * .1, -.04, 0);
    const tg = new THREE.CylinderGeometry(.075, .06, TH, 8); tg.translate(0, -TH / 2, 0);
    mesh(tg, mats.dark, th);
    const kn = node(th, 0, -TH, 0);
    mesh(new THREE.SphereGeometry(.06, 8, 6), mats.steel, kn, 0, 0, .02);
    const sg = new THREE.CylinderGeometry(.062, .05, SH, 8); sg.translate(0, -SH / 2, 0);
    mesh(sg, mats.steel, kn);
    const ft = mesh(new THREE.BoxGeometry(.1, .07, .22), mats.dark, kn, 0, -SH - .01, .05);
    ft.userData.foot = true;
    return { th, kn, toe: node(kn, 0, -SH - .02, .17) };
  };
  const L = leg(1), R = leg(-1);
  return { thL: L.th, knL: L.kn, thR: R.th, knR: R.kn, toeL: L.toe, toeR: R.toe };
}

// ---------------------------------------------------------------- IK
const _t = new THREE.Vector3(), _d = new THREE.Vector3(), _p = new THREE.Vector3(), _u = new THREE.Vector3(), _e = new THREE.Vector3();
const _f = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();

// Two-bone IK in the shoulder's parent space (the chest). target, pole: Vector3 in chest space.
function solveArm(arm, target, pole, a, b) {
  _t.copy(target).sub(arm.sh.position);
  let d = _t.length();
  d = clamp(d, .08, a + b - .002);
  _d.copy(_t).normalize();
  const cosA = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), alpha = Math.acos(cosA);
  const cosB = clamp((a * a + b * b - d * d) / (2 * a * b), -1, 1), beta = Math.acos(cosB);
  _p.copy(pole).addScaledVector(_d, -pole.dot(_d));
  if (_p.lengthSq() < 1e-6) _p.set(0, -1, 0).addScaledVector(_d, _d.y); _p.normalize();
  _u.copy(_d).multiplyScalar(Math.cos(alpha)).addScaledVector(_p, Math.sin(alpha)).normalize();   // upper arm direction
  _e.copy(_u).multiplyScalar(a);                                                                     // elbow, shoulder-relative
  _f.copy(_d).multiplyScalar(d).sub(_e).normalize();                                                 // forearm direction
  // Frame: -Y along the upper arm, +Z toward where the forearm bends.
  _y.copy(_u).negate();
  _z.copy(_f).addScaledVector(_u, -_f.dot(_u));
  if (_z.lengthSq() < 1e-6) _z.set(0, 0, 1).addScaledVector(_y, -_y.z);
  _z.normalize();
  _x.crossVectors(_y, _z).normalize();
  _m.makeBasis(_x, _y, _z);
  arm.sh.quaternion.setFromRotationMatrix(_m);
  arm.el.rotation.set(-(Math.PI - beta), 0, 0);
}

// Orient the hand so its +Z runs along `dir` and +Y along `edge` (both chest space).
function orientHand(arm, dir, edge) {
  _z.copy(dir).normalize();
  _y.copy(edge).addScaledVector(_z, -edge.dot(_z)).normalize();
  _x.crossVectors(_y, _z).normalize();
  _m.makeBasis(_x, _y, _z);
  _q.setFromRotationMatrix(_m);                          // desired, chest space
  _q2.copy(arm.sh.quaternion).multiply(arm.el.quaternion).invert();
  arm.hand.quaternion.copy(_q2.multiply(_q));
}

// ---------------------------------------------------------------- animator
// Channels that are pure angles (a weapon twirled through whole turns): blends between poses take the short way.
const ANGLES = new Set([IDX.hiltA, IDX.bladeYaw, IDX.lbYaw]);
const wrapPi = v => ((v + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
const _hilt = new THREE.Vector3(), _blade = new THREE.Vector3(), _edge = new THREE.Vector3(), _lh = new THREE.Vector3(), _grip = new THREE.Vector3();
const POLE_R = new THREE.Vector3(-.6, -.4, -.7), POLE_L = new THREE.Vector3(.6, -.4, -.7);

export class KnightAnimator {
  constructor(k) {
    this.k = k;
    this.cur = pose({}, true);
    this.loco = pose({}, true);
    this.act = new Float32Array(N);
    this.out = new Float32Array(N);
    this.action = null; this.t = 0; this.speed = 1;
    this.fadeIn = .08; this.fadeOut = .12;
    this.gait = 0;
    this.time = 0;
    this.leanTarget = { x: 0, z: 0 };
  }

  play(name, speed = 1, fadeIn = .06) {
    this.action = ACTIONS[name]; this.name = name; this.t = 0; this.speed = speed; this.fadeIn = fadeIn;
  }
  stop() { this.action = null; this.name = null; }
  get progress() { return this.action ? this.t / this.action.dur : 1; }

  // m: { speed (m/s), forward, side (local velocity), guard, sprint, locked }
  update(dt, m) {
    this.time += dt;
    const L = this.loco;
    const W = LOCO[m.weapon] || LOCO.sword;
    L.set(m.guard ? W.guard : m.sprint ? W.sprint : W[m.stance || 'mid']);
    // Gait: legs swing with ground speed; strafing tilts the stride.
    const spd = m.speed, amt = clamp(spd / 5.5, 0, 1.3);
    this.gait += dt * (spd > .1 ? 5.5 + spd * 1.45 : 0);
    const g = this.gait, sw = Math.sin(g), sw2 = Math.sin(g + Math.PI);
    const fwd = m.forward ?? 1, side = m.side ?? 0;
    const dirSign = fwd < -.3 ? -1 : 1;
    const breathe = Math.sin(this.time * 2.2) * .015 * (1 - amt);
    L[IDX.thLx] = BASE.thLx * (1 - amt) + sw * .6 * amt * dirSign;
    L[IDX.thRx] = BASE.thRx * (1 - amt) + sw2 * .6 * amt * dirSign;
    L[IDX.knL] = BASE.knL * (1 - amt) + Math.max(0, Math.sin(g - 1.2)) * 1.1 * amt + .15 * amt;
    L[IDX.knR] = BASE.knR * (1 - amt) + Math.max(0, Math.sin(g - 1.2 + Math.PI)) * 1.1 * amt + .15 * amt;
    L[IDX.thLz] = BASE.thLz + side * .25 * amt; L[IDX.thRz] = BASE.thRz + side * .25 * amt;
    L[IDX.lift] = -Math.abs(Math.cos(g)) * .05 * amt + breathe - (m.guard ? .06 : 0);
    L[IDX.hipsRy] = sw * .12 * amt;
    L[IDX.chestRy] += -sw * .1 * amt;
    L[IDX.chestRx] += amt * .1;
    L[IDX.bodyRz] = -side * .06 * amt;
    L[IDX.bodyRx] = (m.sprint ? .12 : .04) * amt;
    if (!m.guard) {   // off hand swings with the stride
      L[IDX.lhZ] = BASE.lhZ + sw2 * .22 * amt; L[IDX.lhY] = BASE.lhY + Math.abs(sw2) * .05 * amt;
      L[IDX.hiltH] += Math.abs(sw) * .03 * amt;   // the weapon bobs with the step
    }
    L[IDX.wings] = m.shifted ? 2 : m.sprint ? 1.2 : BASE.wings + amt * .3;

    // Action layer.
    const out = this.out;
    out.set(L);
    if (this.action) {
      this.t += dt * this.speed;
      const A = this.action;
      if (!A.loop && this.t >= A.dur) { this.action = null; }
      else {
        sampleAction(A, this.t, this.act);
        const wIn = clamp(this.t / this.fadeIn, 0, 1), wOut = A.loop ? 1 : clamp((A.dur - this.t) / this.fadeOut, 0, 1);
        const w = Math.min(wIn, wOut);
        for (let c = 0; c < N; c++) {
          const v = this.act[c];
          if (Number.isNaN(v)) continue;
          // Whole-body spins take the key value outright so they never unwind backwards.
          if ((c === IDX.bodyRx && A.spinX) || (c === IDX.bodyRy && A.spinY)) out[c] = v;
          else if (ANGLES.has(c) || (c === IDX.bladePitch && A.wrapPitch)) out[c] = v - wrapPi(v - out[c]) * (1 - w);
          else out[c] = lerp(out[c], v, w);
        }
      }
    }

    // Aiming a ranged weapon: the upper body pitches with the aim, the bow's draw hand comes back to the jaw,
    // and a shot kicks the shoulders back.
    if (m.aim !== undefined) {
      out[IDX.chestRx] -= m.aim * .85 + (m.recoil || 0) * .3; out[IDX.headRx] -= m.aim * .25;
      if (m.draw) for (let c = 0; c < N; c++) if (!Number.isNaN(m.draw.pose[c])) out[c] = lerp(out[c], m.draw.pose[c], m.draw.w);
    }

    // Additive lean (dash direction, turning) on top of everything.
    const lk = 1 - Math.exp(-dt * 14);
    this.leanX = lerp(this.leanX || 0, this.leanTarget.x, lk); this.leanZ = lerp(this.leanZ || 0, this.leanTarget.z, lk);
    out[IDX.bodyRx] += this.leanX; out[IDX.bodyRz] += this.leanZ;

    // Smooth toward the target a little so action changes don't pop.
    const cur = this.cur, k = 1 - Math.exp(-dt * 34), A = this.action;
    // A windmill (wrapPitch) turns the blade's pitch through whole circles; once it ends, fold it back.
    if (!A?.wrapPitch && Math.abs(cur[IDX.bladePitch]) > 4) cur[IDX.bladePitch] = wrapPi(cur[IDX.bladePitch]);
    for (let c = 0; c < N; c++) {
      if ((c === IDX.bodyRx && A?.spinX) || (c === IDX.bodyRy && A?.spinY)) { cur[c] = out[c]; continue; }
      cur[c] = ANGLES.has(c) || (c === IDX.bladePitch && A?.wrapPitch) ? cur[c] + wrapPi(out[c] - cur[c]) * k : lerp(cur[c], out[c], k);
    }
    const wrap = v => ((v + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    if (!A?.spinX) cur[IDX.bodyRx] = wrap(cur[IDX.bodyRx]);
    if (!A?.spinY) cur[IDX.bodyRy] = wrap(cur[IDX.bodyRy]);
    this.apply(cur, dt);
  }

  apply(p, dt) {
    const k = this.k, I = IDX;
    k.body.position.y = .95 + p[I.lift];
    k.body.rotation.set(p[I.bodyRx], p[I.bodyRy], p[I.bodyRz]);
    k.hips.rotation.set(p[I.hipsRx], p[I.hipsRy], p[I.hipsRz]);
    k.chest.rotation.set(p[I.chestRx], p[I.chestRy], p[I.chestRz]);
    k.head.rotation.set(p[I.headRx], p[I.headRy], 0);
    k.thL.rotation.set(p[I.thLx], 0, p[I.thLz]); k.knL.rotation.x = p[I.knL];
    k.thR.rotation.set(p[I.thRx], 0, p[I.thRz]); k.knR.rotation.x = p[I.knR];

    // Sword: hilt in cylindrical coords around the chest; the angle turns toward the character's left (+X).
    const a = p[I.hiltA], r = p[I.hiltR], h = p[I.hiltH];
    _hilt.set(Math.sin(a) * r, .24 + h, Math.cos(a) * r);
    const by = p[I.bladeYaw], bp = p[I.bladePitch];
    _blade.set(Math.sin(by) * Math.cos(bp), Math.sin(bp), Math.cos(by) * Math.cos(bp));
    // Edge: 'up' made perpendicular to the blade, then rolled around it.
    _edge.set(0, 1, 0).addScaledVector(_blade, -_blade.y);
    if (_edge.lengthSq() < 1e-4) _edge.set(0, 0, 1).addScaledVector(_blade, -_blade.z);
    _edge.normalize().applyAxisAngle(_blade, p[I.bladeRoll]);
    // The hand holds the grip a little behind the hilt point.
    _grip.copy(_hilt).addScaledVector(_blade, -.02);
    solveArm(k.armR, _grip, POLE_R, k.UP, k.LO + .04);
    if (k.bare) k.armR.hand.rotation.set(0, 0, 0);   // fists: knuckles along the forearm
    else orientHand(k.armR, _blade, _edge);

    const two = p[I.vial] > .5 ? 0 : clamp(p[I.twoHand], 0, 1);
    _lh.set(p[I.lhX], .24 + p[I.lhY], p[I.lhZ]);
    _grip.copy(_hilt).addScaledVector(_blade, k.grip);
    _lh.lerp(_grip, two);
    solveArm(k.armL, _lh, POLE_L, k.UP, k.LO + .04);
    if ((k.pair || k.bowHand) && two < .5) {
      // The off-hand fang points where lbYaw / lbPitch say, rolled by lbRoll, like the main blade.
      const ly = p[I.lbYaw], lp = p[I.lbPitch];
      _blade.set(Math.sin(ly) * Math.cos(lp), Math.sin(lp), Math.cos(ly) * Math.cos(lp));
      _edge.set(0, 1, 0).addScaledVector(_blade, -_blade.y);
      if (_edge.lengthSq() < 1e-4) _edge.set(0, 0, 1).addScaledVector(_blade, -_blade.z);
      _edge.normalize().applyAxisAngle(_blade, p[I.lbRoll]);
      orientHand(k.armL, _blade, _edge);
    } else k.armL.hand.rotation.set(0, 0, 0);
    k.vial.visible = p[I.vial] > .5;

    // Cape trails with motion; wings flutter.
    const t = this.time, wsp = p[I.wings];
    k.capeNode.rotation.x = .12 + clamp(this.capeLag || 0, 0, 1.1) + Math.sin(t * 3) * .03;
    for (const w of k.wings) {
      const { s, tilt } = w.userData;
      const flap = Math.sin(t * (wsp > 1.5 ? 28 : 9) + (tilt > 0 ? 0 : .8)) * (.18 + wsp * .12);
      w.rotation.set(0, s * (-.55 + wsp * .35 + flap), tilt * s);
      w.scale.setScalar(wsp > 1.5 ? 1.6 : 1);
    }
  }
}
