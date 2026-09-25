// Holds and new strikes for the armory (armory.js). Each new weapon fights with the poses of its family; the
// shield (Warden's Aegis) and the staff get holds of their own. One-handed weapons get variants of the sword's
// two-handed strikes with the off hand left free ('oh:' + name).
import { ACTIONS, LOCO, IDX, pose, fill, K, LUNGE, vary } from './knight.js';
import { flurry } from './moveanims.js';

const DEEP = { lift: -.22, thLx: -1.0, knL: .9, thRx: .8, knR: .45 };
const LUNGE_R = { thLx: .45, knL: .35, thRx: -.55, knR: .5, lift: -.08 };

// The Aegis: the sword as ever, the shield held forward on the left forearm.
const SHIELD = { lhX: .14, lhY: .06, lhZ: .36, twoHand: 0 };
const withShield = base => { const q = base.slice(); const s = pose(SHIELD); for (let i = 0; i < q.length; i++) if (!Number.isNaN(s[i])) q[i] = s[i]; return q; };
LOCO.aegis = { mid: withShield(LOCO.sword.mid), high: withShield(LOCO.sword.high), low: withShield(LOCO.sword.low),
  guard: fill(pose({ hiltA: -.8, hiltR: .3, hiltH: .05, bladeYaw: -.4, bladePitch: .6, bladeRoll: 0, lhX: .03, lhY: .16, lhZ: .42, twoHand: 0, chestRx: .12, headRx: .08 })),
  sprint: withShield(LOCO.sword.sprint) };
for (const id of ['great', 'saw']) LOCO[id] = LOCO.hammer;
for (const id of ['daggers', 'hatchets', 'fans']) LOCO[id] = LOCO.fangs;
for (const id of ['chain', 'scythe']) LOCO[id] = LOCO.glaive;
for (const id of ['claws', 'tonfas']) LOCO[id] = LOCO.fists;
for (const id of ['hexblade', 'rapier', 'katana', 'ring']) LOCO[id] = LOCO.sword;
// The staff is held nearer its middle: both hands a little apart, the far end low.
LOCO.staff = { ...LOCO.glaive,
  mid: fill(pose({ chestRy: -.5, hiltA: -.9, hiltR: .28, hiltH: -.15, bladeYaw: .6, bladePitch: .1, bladeRoll: 0, twoHand: 1, lift: -.04, thLx: -.3, knL: .35, thRx: .3, knR: .4 }, true)) };

// One-handed variants of every sword strike that takes the hilt in both hands.
for (const [k, A] of Object.entries({ ...ACTIONS })) {
  if (k.startsWith('oh:') || !A.keys.some(([, p]) => p[IDX.twoHand] > .01)) continue;
  ACTIONS['oh:' + k] = vary(A, { set: { twoHand: 0 } });
}

const AEGIS_END = { hiltA: -.5, hiltR: .38, hiltH: -.1, bladeYaw: .2, bladePitch: .3, bladeRoll: 0, ...SHIELD, chestRy: 0 };
Object.assign(ACTIONS, {
  // A punch with the shield's rim, off the back foot.
  ae_bash: { dur: .56, hit: [.16, .28], keys: [
    K(0, { ...AEGIS_END, lhX: .3, lhY: .05, lhZ: .15, chestRy: .4, ...LUNGE_R, lift: -.06 }),
    K(.12, { lhX: .32, lhY: .08, lhZ: .08, chestRy: .55 }),
    K(.2, { lhX: .02, lhY: .1, lhZ: .6, chestRy: -.35, chestRx: .25, ...DEEP }),
    K(.28, { lhZ: .58 }),
    K(.56, { ...AEGIS_END }),
  ] },
  // Behind the shield at a run, shoulder down.
  ae_charge: { dur: .7, hit: [.12, .42], keys: [
    K(0, { lhX: .05, lhY: .12, lhZ: .5, chestRx: .3, chestRy: -.3, hiltA: -1.1, hiltR: .3, hiltH: -.2, bladeYaw: -2.4, bladePitch: -.2, bladeRoll: 0, twoHand: 0, lift: -.14, thLx: -.8, knL: .9, thRx: .5, knR: .6, wings: 1.6 }),
    K(.14, { chestRx: .45, lhZ: .56, lift: -.2, thLx: -1.0, knL: .8, thRx: .8, knR: .4, wings: 2 }),
    K(.42, { lhZ: .55 }),
    K(.7, { ...AEGIS_END }),
  ] },
  // Throws: the weapon in hand drawn back over the shoulder and slung forward (one hand, or both).
  hurl1: { dur: .6, keys: [
    K(0, { hiltA: -.9, hiltR: .3, hiltH: .35, bladeYaw: -2.6, bladePitch: .4, bladeRoll: 0, twoHand: 0, chestRy: -.5, chestRx: -.1 }),
    K(.14, { hiltA: -1.0, hiltH: .4, chestRy: -.65 }),
    K(.24, { hiltA: -.1, hiltR: .6, hiltH: .1, bladeYaw: 0, bladePitch: .1, chestRy: .4, chestRx: .2, ...LUNGE, wings: 1.6 }),
    K(.6, {}),
  ] },
  hurl2: { dur: .62, keys: [
    K(0, { hiltA: -.9, hiltR: .3, hiltH: .35, bladeYaw: -2.6, bladePitch: .4, bladeRoll: 0, lhX: .45, lhY: .35, lhZ: -.15, lbYaw: 2.6, lbPitch: .4, twoHand: 0, chestRx: -.2 }),
    K(.14, { hiltH: .42, lhY: .4, chestRx: -.3, lift: .04 }),
    K(.24, { hiltA: -.2, hiltR: .6, hiltH: .1, bladeYaw: 0, bladePitch: .1, lhX: .15, lhY: .1, lhZ: .6, lbYaw: 0, lbPitch: .1, chestRx: .25, ...LUNGE, wings: 1.8 }),
    K(.62, {}),
  ] },
  // The rapier's pause combo: Hundred Stings, seven thrusts and a driving eighth.
  rp_hundred: flurry({ n: 7, t0: .12, step: .1, dur: 1.05, fangs: false }),
});
