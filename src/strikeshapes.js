// Shapes of strike, for building many weapons' movesets quickly (signatures.js). Each returns an action
// ({ dur, keys }, as in knight.js) with a hit window on it (hit: [start, end], animation seconds), which the
// strike data takes as its own unless it gives one. Parameters bend each shape: which side a cut starts,
// the heights it runs between, one hand or two, the legs under it, a hop, a spin, and the hold it ends on.
// Channels are knight.js's: hiltA turns the hilt round the chest (+ to the knight's left), hiltR / hiltH
// its reach and height; bladeYaw / bladePitch aim the weapon (pitch past π/2 lays it back over the head),
// bladeRoll turns the edge; lh* place the off hand and lb* aim what it holds.
import { K, LUNGE, pose, IDX } from './knight.js';

export const LUNGE_R = { thLx: .45, knL: .35, thRx: -.55, knR: .5, lift: -.08 };
export const DEEP = { lift: -.22, thLx: -1.0, knL: .9, thRx: .8, knR: .45 };
export const REC = { lift: -.04, thLx: -.25, knL: .3, thRx: .2, knR: .3 };
export const LOWREC = { lift: -.1, thLx: -.35, knL: .5, thRx: .3, knR: .5 };
export const CROUCH = { lift: -.26, thLx: -.95, knL: 1.25, thRx: .55, knR: .95 };
export const HOP = { lift: .34, thLx: -.9, knL: 1.35, thRx: .35, knR: 1.1, wings: 2 };
export const SLAM = { lift: -.32, thLx: -1.1, knL: 1.3, thRx: .75, knR: 1.1 };
export const TUCKED = { thLx: -1.2, knL: 1.6, thRx: -.4, knR: 1.4, wings: 2.2 };
export { LUNGE };
const TAU = Math.PI * 2;
const act = (dur, keys, hit, o = {}) => ({ dur, keys: keys.sort((a, b) => a[0] - b[0]), hit: hit.map(v => +v.toFixed(3)), ...o });

// A cut: the hilt swings round the chest from side s (+1 starts on the knight's right, -1 on the left) to the
// other, height h0 to h1, the blade trailing out with its edge leading; pitch p0 → p1 tilts it (high and
// falling for a diagonal, low and rising for an upward cut). two: both hands on the grip. t: windup peak,
// the moment it crosses the front, the end of the follow-through.
export function cut({ dur = .6, s = 1, h0 = .05, h1 = .02, p0 = .12, p1 = -.05, r, a0, a1, y0, y1, c, t = [.14, .24, .34], two = 0,
  legs = LUNGE, lead = {}, mid = {}, fol = {}, end = {}, roll } = {}) {
  r ??= two ? .46 : .56; a0 ??= two ? .95 : 1.25; a1 ??= two ? .7 : 1.05; y0 ??= two ? 2.0 : 2.3; y1 ??= two ? 1.8 : 2.1; c ??= two ? .8 : .58;
  roll ??= -s * 1.57;
  return act(dur, [
    K(0, { hiltA: -s * a0, hiltR: r * .78, hiltH: h0, bladeYaw: -s * y0, bladePitch: p0, bladeRoll: roll, chestRy: -s * c, chestRx: .08, twoHand: two, ...legs, ...lead }),
    K(t[0], { hiltA: -s * (a0 + .15), hiltH: h0 + .03, bladeYaw: -s * (y0 + .2), chestRy: -s * (c + .15) }),
    K(t[1], { hiltA: 0, hiltR: r, hiltH: (h0 + h1) / 2, bladeYaw: 0, bladePitch: (p0 + p1) / 2, chestRy: 0, chestRx: .18, ...mid }),
    K(t[2], { hiltA: s * a1, hiltR: r * .82, hiltH: h1, bladeYaw: s * y1, bladePitch: p1, chestRy: s * c * .95, chestRx: .15, ...fol }),
    K(dur, end),
  ], [t[0] + (t[1] - t[0]) * .45, t[2] - .01]);
}

// A chop: raised over the head (the weapon laid back past upright), brought straight down at yaw.
// hop: leaps into it. a: the hilt a little to one side for a slanting chop.
export function chop({ dur = .8, a = 0, yaw = 0, t = [.26, .4, .5], two = 1, hop = 0, roll = 0, legs = SLAM, lead = {}, top = {}, low = {}, end = {} } = {}) {
  return act(dur, [
    K(0, { hiltA: a - .3, hiltR: .24, hiltH: .12, bladeYaw: yaw, bladePitch: 1.1, bladeRoll: roll, twoHand: two, chestRx: .05, chestRy: -.1, ...LUNGE_R, ...lead }),
    K(t[0], { hiltA: a - .15, hiltR: .1, hiltH: .58, bladePitch: 2.4, chestRx: -.35, ...(hop ? { ...HOP, lift: .3 + hop } : { lift: .02, thLx: -.1, knL: .15, thRx: .3, knR: .3 }), wings: 1.5, ...top }),
    K(t[1], { hiltA: a, hiltR: .5, hiltH: .1, bladePitch: .15, chestRx: .4, chestRy: 0, ...DEEP }),
    K(t[2], { hiltH: -.3, bladePitch: -.8, chestRx: .66, ...legs, wings: 1, ...low }),
    K(dur, end),
  ], [t[1] - .05, t[2] + .02]);
}

// A thrust: drawn back beside the chest, driven straight out at height h. two: the off hand behind on the grip.
export function thrust({ dur = .56, h = .04, a = -.08, reach = .62, t = [.12, .2, .3], two = 0, roll = 1.57, legs = DEEP, lead = {}, out = {}, end = {} } = {}) {
  return act(dur, [
    K(0, { hiltA: -.85, hiltR: .22, hiltH: h, bladeYaw: .05, bladePitch: h * .3, bladeRoll: roll, chestRy: -.55, chestRx: .1, twoHand: two, ...LUNGE_R, ...lead }),
    K(t[0], { hiltA: -1.0, hiltR: .14, chestRy: -.72, lift: -.1 }),
    K(t[1], { hiltA: a, hiltR: reach, hiltH: h, bladeYaw: 0, bladePitch: h * .3, chestRy: .15, chestRx: .28, ...legs, wings: 1.4, ...out }),
    K(t[2], { hiltR: reach - .03 }),
    K(dur, end),
  ], [t[0] + .03, t[2]]);
}

// A whirl: the whole body turns (dir +1 to the left, -1 to the right) with the weapon held out flat,
// turns times round, at height h; rise lifts it off the ground mid-turn, low sinks it to the knees.
export function whirl({ dur = .9, turns = 1, dir = 1, h = 0, p = .08, t = [.16, .72], two = 0, rise = 0, low = 0, r = .46, lead = {}, spin = {}, end = {}, off = false } = {}) {
  const T = dir * TAU * turns;
  const O = off ? { lhX: .55, lhY: h + .05, lhZ: 0, lbYaw: dir * 1.8, lbPitch: p, lbRoll: dir * 1.57 } : {};
  const legs = low ? { thLx: -.95, knL: 1.25, thRx: .55, knR: .95 } : { ...LUNGE };
  return act(dur, [
    K(0, { bodyRy: 0, chestRy: -dir * .4, hiltA: -dir * .6, hiltR: r, hiltH: h, bladeYaw: -dir * 1.55, bladePitch: p, bladeRoll: -dir * 1.57, twoHand: two, ...O, ...legs, lift: -.12 - low, ...lead }),
    K(t[0], { bodyRy: -dir * .5, chestRy: -dir * .6, lift: -.18 - low }),
    K(t[1] - .1, { bodyRy: T - dir * .35, chestRy: dir * .1, lift: -.12 - low + rise, wings: 2, ...(rise ? { thLx: -1.0, knL: 1.4, thRx: .2, knR: 1.1 } : {}), ...spin }),
    K(t[1], { bodyRy: T, hiltA: dir * .3, bladeYaw: dir * 1.0, chestRy: dir * .35, lift: -.1 - low }),
    K(dur, { bodyRy: T, ...end }),
  ], [t[0], t[1]], { spinY: true });
}

// A rising blow: from low by the feet, up past the face; jump carries the knight up after it.
export function upcut({ dur = .7, a = -.3, yaw = .3, t = [.16, .28, .38], two = 1, jump = 0, lead = {}, top = {}, end = {} } = {}) {
  return act(dur, [
    K(0, { hiltA: a - .3, hiltR: .3, hiltH: -.3, bladeYaw: yaw, bladePitch: -.85, bladeRoll: 0, twoHand: two, chestRx: .35, chestRy: -.2, lift: -.22, thLx: -.9, knL: 1.1, thRx: .5, knR: .9, ...lead }),
    K(t[0], { hiltH: -.36, bladePitch: -1.0, lift: -.28 }),
    K(t[1], { chestRx: 0, hiltA: a, hiltR: .5, hiltH: .1, bladePitch: .4, ...LUNGE, lift: 0 }),
    K(t[2], { chestRx: -.35, hiltA: a + .05, hiltR: .3, hiltH: .55, bladePitch: 1.5, lift: .12 + jump, wings: 1.8, ...(jump ? { thLx: -1.0, knL: 1.4, thRx: .3, knR: 1.2 } : {}), ...top }),
    K(dur, end),
  ], [t[0] + .04, t[2]]);
}

// The off hand's own cut (dual weapons): from side s, height h0 to h1, starting at time at.
export function offcut({ s = -1, h0 = .05, h1 = 0, p0 = .1, p1 = -.05, at = .1, len = .16, rest, roll } = {}) {
  roll ??= -s * 1.57;
  const keys = [
    [at - .08, pose({ lhX: -s * .5 + .05, lhY: h0, lhZ: .08, lbYaw: -s * 1.9, lbPitch: p0, lbRoll: roll })],
    [at + len * .5, pose({ lhX: .05, lhY: (h0 + h1) / 2, lhZ: .54, lbYaw: 0, lbPitch: (p0 + p1) / 2 })],
    [at + len, pose({ lhX: s * .35 + .05, lhY: h1, lhZ: .34, lbYaw: s * 1.8, lbPitch: p1 })],
  ];
  if (rest) keys.push(rest);
  return keys;
}

// Merge extra keys (say an off hand's) into an action; they may only set channels the action leaves alone.
export function withKeys(A, keys, hit) {
  const out = { ...A, keys: [...A.keys, ...keys.map(([t, p]) => [Math.max(0, t), p])].sort((a, b) => a[0] - b[0]) };
  if (hit) out.hit = hit;
  return out;
}

// Retime an action to a new length, hit window and all.
export function retime(A, dur, o = {}) {
  const k = dur / A.dur;
  return { ...A, ...o, dur, keys: A.keys.map(([t, p]) => [t * k, p]), hit: o.hit || (A.hit && A.hit.map(v => +(v * k).toFixed(3))) };
}

// Set channels on every key of an action (a one-handed weapon keeping its shield up, say).
export function hold(A, o) {
  const s = pose(o);
  return { ...A, keys: A.keys.map(([t, p]) => { const q = p.slice(); for (let i = 0; i < q.length; i++) if (!Number.isNaN(s[i])) q[i] = s[i]; return [t, q]; }) };
}

// Add offsets to channels wherever a key sets them (a cut made lower, a hold made deeper).
export function shift(A, o) {
  return { ...A, keys: A.keys.map(([t, p]) => { const q = p.slice(); for (const [k, v] of Object.entries(o)) if (!Number.isNaN(q[IDX[k]])) q[IDX[k]] += v; return [t, q]; }) };
}

// Strikes in a row inside one action: each part's keys and hit laid end to end; the hit spans them all.
// Turns carry on from one part to the next (a whole-body spin never unwinds).
export function string(parts, end = {}, tail = .2) {
  let t = 0, turn = 0; const keys = [], R = IDX.bodyRy;
  for (const P of parts) {
    const cutAt = P.hit[1] + (P.overlap ?? .06);
    let last = turn;
    for (const [kt, p] of P.keys) {
      if (kt > cutAt) continue;
      const q = p.slice();
      if (!Number.isNaN(q[R])) { q[R] += turn; last = q[R]; }
      keys.push([t + kt, q]);
    }
    turn = last; t += cutAt;
  }
  const e = pose(end); if (turn) e[R] = turn;
  keys.push([t + tail, e]);
  return { dur: +(t + tail).toFixed(3), keys, hit: [+(parts[0].hit[0]).toFixed(3), +(t - .04).toFixed(3)], spinY: parts.some(P => P.spinY) };
}

// A twirl: the hilt held still (overhead, by default) while the weapon wheels flat round it, turns times.
export function twirl({ dur = .9, turns = 2, dir = 1, h = .5, a = -.15, r = .22, pitch = .12, t = [.14, .7], two = 0, legs = {}, lead = {}, end = {} } = {}) {
  return act(dur, [
    K(0, { hiltA: a, hiltR: r, hiltH: h - .25, bladeYaw: 0, bladePitch: pitch, bladeRoll: 0, twoHand: two, chestRx: -.1, ...legs, ...lead }),
    K(t[0], { hiltH: h, bladeYaw: dir * .6, wings: 1.6 }),
    K(t[1], { bladeYaw: dir * (TAU * turns + .6), hiltH: h }),
    K(dur, end),
  ], [t[0], t[1]]);
}

// A windmill: the weapon wheels upright in front of the knight (or at its side, a > 0 to the left),
// its pitch turning through whole circles.
export function windmill({ dur = .9, turns = 2, a = -.2, h = .1, r = .42, yaw = 0, t = [.12, .72], two = 0, legs = {}, lead = {}, end = {} } = {}) {
  const T = TAU * turns;
  return act(dur, [
    K(0, { hiltA: a, hiltR: r * .8, hiltH: h, bladeYaw: yaw, bladePitch: -.4, bladeRoll: 0, twoHand: two, ...legs, ...lead }),
    K(t[0], { hiltR: r, bladePitch: .2 }),
    K(t[1], { bladePitch: T + .2, hiltR: r }),
    K(dur, { ...end, bladePitch: T + (end.bladePitch ?? .3) }),
  ], [t[0], t[1]], { wrapPitch: true });
}

// A punch (bare hands): the right fist (hand 'R', the hilt channels) or the left (lh), driven out at height h.
export function punch({ dur = .42, hand = 'R', h = .08, t = [.05, .12, .2], legs = DEEP, chest = true, lead = {}, end = {} } = {}) {
  const R = hand === 'R';
  const c = v => (chest ? { chestRy: v } : {});
  const keys = R ? [
    K(0, { hiltA: -.45, hiltR: .22, hiltH: h, ...c(-.4), twoHand: 0, ...lead }),
    K(t[0], { hiltA: -.5, hiltR: .16, ...c(-.5) }),
    K(t[1], { hiltA: -.12, hiltR: .64, hiltH: h, ...c(.35), ...(chest ? { chestRx: .15, ...legs } : {}) }),
    K(t[2], { hiltR: .62 }),
  ] : [
    K(0, { lhX: .32, lhY: h, lhZ: .14, ...c(.35), twoHand: 0, ...lead }),
    K(t[0], { lhX: .34, lhZ: .1, ...c(.45) }),
    K(t[1], { lhX: .1, lhY: h, lhZ: .62, ...c(-.45), ...(chest ? { chestRx: .12, ...legs } : {}) }),
    K(t[2], { lhZ: .6 }),
  ];
  keys.push(K(dur, end));
  return act(dur, keys, [t[0] + .02, t[2]]);
}

// A rake (bare hands, claws): the right hand (or the left) tears across from side s, height h0 to h1.
export function rake({ dur = .5, hand = 'R', s, h0 = .3, h1 = -.2, t = [.1, .18, .27], legs = LUNGE, chest = true, lead = {}, end = {} } = {}) {
  const R = hand === 'R'; s ??= R ? 1 : -1;
  const c = v => (chest ? { chestRy: v } : {});
  const keys = R ? [
    K(0, { hiltA: -s * .95, hiltR: .34, hiltH: h0, ...c(-s * .5), twoHand: 0, ...legs, ...lead }),
    K(t[0], { hiltA: -s * 1.1, hiltH: h0 + .05, ...c(-s * .65) }),
    K(t[1], { hiltA: -.1, hiltR: .6, hiltH: (h0 + h1) / 2, ...c(0) }),
    K(t[2], { hiltA: s * .65, hiltR: .42, hiltH: h1, ...c(s * .5), ...(chest ? { chestRx: .2 } : {}) }),
  ] : [
    K(0, { lhX: -s * .52, lhY: h0, lhZ: .1, ...c(-s * .5), twoHand: 0, ...legs, ...lead }),
    K(t[0], { lhX: -s * .6, lhY: h0 + .05, lhZ: .05, ...c(-s * .65) }),
    K(t[1], { lhX: .05, lhY: (h0 + h1) / 2, lhZ: .58, ...c(0) }),
    K(t[2], { lhX: s * .38, lhY: h1, lhZ: .38, ...c(s * .5), ...(chest ? { chestRx: .2 } : {}) }),
  ];
  keys.push(K(dur, end));
  return act(dur, keys, [t[0] + .03, t[2]]);
}

// The off hand's overhead chop (dual weapons): raised at t0, down through t1 to t2.
export function offchop({ t = [.2, .34, .44], rest } = {}) {
  const keys = [
    [t[0], pose({ lhX: .15, lhY: .5, lhZ: .12, lbYaw: -.1, lbPitch: 2.35, lbRoll: 0 })],
    [t[1], pose({ lhX: .06, lhY: .08, lhZ: .52, lbPitch: .1 })],
    [t[2], pose({ lhX: .02, lhY: -.25, lhZ: .45, lbPitch: -.8 })],
  ];
  if (rest) keys.push(rest);
  return keys;
}

// The off hand mirroring the main hand (dual weapons), delay seconds behind it: the same path on the other
// side, the blade turned the other way. Channels are sampled as the animator samples them.
const smooth = x => x * x * (3 - 2 * x);
function sampleCh(A, c, t) {
  let a = -1, b = -1;
  for (let i = 0; i < A.keys.length; i++) { if (Number.isNaN(A.keys[i][1][c])) continue; if (A.keys[i][0] <= t) a = i; else { b = i; break; } }
  if (a < 0 && b < 0) return NaN;
  if (a < 0) return A.keys[b][1][c]; if (b < 0) return A.keys[a][1][c];
  const [ta, pa] = A.keys[a], [tb, pb] = A.keys[b], u = smooth(Math.min(1, Math.max(0, (t - ta) / (tb - ta))));
  return pa[c] + (pb[c] - pa[c]) * u;
}
export function mirror(A, { delay = 0, until = A.hit[1] + .08, dx = .05 } = {}) {
  const keys = [];
  for (const [t] of A.keys) {
    if (t > until) continue;
    const g = ch => sampleCh(A, IDX[ch], t);
    const a = g('hiltA'), r = g('hiltR'), h = g('hiltH');
    keys.push([t + delay, pose({ lhX: -Math.sin(a) * r + dx, lhY: h, lhZ: Math.cos(a) * r, lbYaw: -g('bladeYaw'), lbPitch: g('bladePitch'), lbRoll: -g('bladeRoll') })]);
  }
  return keys;
}
