// Weapon skills, as in Nioh: every weapon grows with use. Blows landed with it earn mastery, mastery earns
// skill points, and points learn that weapon's skills. Four are moves the weapon doesn't have until learned:
//   Backstep Strike  strike out of a backstep (a dash with no direction held),
//   Guard Counter    strike just after guarding a blow: a counter that hits hard,
//   Air Finisher     after two air strikes, heavy: the weapon's own air finisher, which slams foes down,
//   Weapon Skill     hold guard and heavy: the weapon's signature technique.
// The rest are passives: Proficiency (damage, then stamina), Pause Mastery, Finisher Mastery, and mastery of
// the weapon's own mechanic. Ranged weapons (ranged.js) have a shorter tree of their own.
import { ACTIONS, K, airVariant } from './knight.js';
import { flurry } from './moveanims.js';
import { SIG_MOVES } from './signatures.js';
import { MOVES } from './movesets.js';
import { chop, whirl, twirl, retime, string, HOP } from './strikeshapes.js';

// The tree. req: learned first (any one of them). Tiers are the rows the Skills screen draws.
export const TREE = [
  { id: 'prof1', name: 'Proficiency', cost: 1, tier: 0, desc: '+6% damage with this weapon.' },
  { id: 'back', name: 'Backstep Strike', cost: 1, tier: 0, move: 'back', desc: 'Strike out of a backstep (dash with no direction held):' },
  { id: 'counter', name: 'Guard Counter', cost: 2, tier: 1, req: ['prof1'], move: 'counter', desc: 'Strike within a moment of guarding a blow:' },
  { id: 'pause', name: 'Pause Mastery', cost: 2, tier: 1, req: ['back'], desc: 'Pause combos hit 20% harder, and the glint comes sooner.' },
  { id: 'air', name: 'Air Finisher', cost: 2, tier: 1, req: ['prof1', 'back'], move: 'airFin', desc: 'In the air, after two strikes, heavy:' },
  { id: 'skill', name: 'Weapon Skill', cost: 3, tier: 2, req: ['counter'], move: 'skill', desc: 'Hold guard and strike hard:' },
  { id: 'mech', name: 'Mechanic Mastery', cost: 3, tier: 2, req: ['pause'], desc: '' },
  { id: 'fin', name: 'Finisher Mastery', cost: 3, tier: 2, req: ['air'], desc: 'Finishers draw a third more from the combo counter and cost a fifth less stamina.' },
  { id: 'prof2', name: 'Proficiency II', cost: 3, tier: 3, req: ['skill', 'mech', 'fin'], desc: '+8% more damage, and strikes cost 10% less stamina.' },
];
// Mastery: blows landed (heavier ones count double) and foes felled earn it; the nth skill point comes at
// 20n + 4n² mastery, so a weapon's whole tree (20 points) takes a few missions of steady use.
export const XP = { hit: 1, heavy: 2, kill: 6 };
export const xpFor = n => 20 * n + 4 * n * n;
export const pointsAt = xp => { let n = 0; while (xpFor(n + 1) <= xp) n++; return n; };
export const treeCost = learned => learned.reduce((s, id) => s + (TREE.find(t => t.id === id)?.cost || RTREE.find(t => t.id === id)?.cost || 0), 0);
// Ranged weapons (ranged.js) learn from their own, shorter tree.
export const RANGED_IDS = ['wisp', 'bow', 'rifle', 'cannon'];
export const treeFor = w => (RANGED_IDS.includes(w) ? RTREE : TREE);
export const canLearn = (tree, learned, id) => { const t = tree.find(x => x.id === id); return !!t && !learned.includes(id) && (!t.req || t.req.some(r => learned.includes(r))); };

// Ranged weapons' tree.
export const RTREE = [
  { id: 'r_power', name: 'Heavy Shot', cost: 1, tier: 0, desc: 'Shots hit 20% harder.' },
  { id: 'r_quiver', name: 'Deep Quiver', cost: 2, tier: 0, desc: 'Carry half again as much ammunition (the Wisp Pod: it cools twice as fast).' },
  { id: 'r_quick', name: 'Quick Hands', cost: 2, tier: 1, req: ['r_power', 'r_quiver'], desc: 'Draw and reload a third faster.' },
  { id: 'r_head', name: 'Marksman', cost: 3, tier: 1, req: ['r_power'], desc: 'Shots to the head hit twice as hard, not half again.' },
];

// What Mechanic Mastery does for each weapon (player.js reads sk('mech') where each mechanic lives).
export const MECH_MASTERY = {
  sword: 'Flashcuts and Moonstep Ripostes hit 30% harder.',
  glaive: 'Heavies charge twice as fast.',
  fangs: 'Frenzy stacks up to eight.',
  hammer: 'Stalwart: blows mid-swing land for 35% less.',
  fists: 'Flow wins back 5 stamina a hit.',
  great: 'Momentum builds 9% a strike, up to +54%.',
  aegis: 'Blocked blows cost 60% less stamina.',
  daggers: 'Backstabs hit twice as hard.',
  hatchets: 'Hurled hatchets hit half again as hard.',
  chain: 'Lashes and heavies haul foes in half again as far.',
  scythe: 'Reap from half health, not a third.',
  claws: 'Bleed bursts on the fourth wound.',
  saw: 'Every bite of the wheel grinds 25% harder.',
  hexblade: 'Hold up to five hex charges.',
  staff: 'Sweep wins back 12 stamina.',
  fans: 'Thrown fans hit half again as hard.',
  tonfas: 'Deflects give back 12 more stamina.',
  rapier: 'Ripostes, counters and executions hit twice as hard.',
  katana: 'The blade glints after 0.7 s, not 1.2 s.',
  ring: 'The thrown ring hits half again as hard.',
};

// ---------------------------------------------------------------- the skill moves
export const SKILL_MOVES = {};
export const SKILL_KITS = {};
const src = k => SIG_MOVES[k] || MOVES[k] || BASE[k];
// The first five weapons' own strikes that live in player.js, as far as these moves need them.
const BASE = {
  light1: { anim: 'light1', dur: .62, hit: [.19, .31], dmg: 40, ki: 24, poise: 10, cost: 13, reach: 2.4, arc: 160, move: .7, chain: .3 },
  light2: { anim: 'light2', dur: .6, hit: [.17, .29], dmg: 40, ki: 24, poise: 10, cost: 13, reach: 2.4, arc: 160, move: .7, chain: .28 },
  light3: { anim: 'light3', dur: .78, hit: [.3, .4], dmg: 52, ki: 32, poise: 18, cost: 15, reach: 2.4, arc: 80, move: .9, chain: .46 },
  g1: { anim: 'g_thrust', dur: .55, hit: [.16, .28], dmg: 44, ki: 28, poise: 12, cost: 14, reach: 3.4, arc: 50, move: .6, chain: .3 },
  g2: { anim: 'g_sweep', dur: .64, hit: [.2, .34], dmg: 46, ki: 30, poise: 14, cost: 15, reach: 3.2, arc: 200, move: .5, chain: .36 },
  f1: { anim: 'f_slash1', dur: .44, hit: [.1, .2], dmg: 26, ki: 14, poise: 5, cost: 9, reach: 2.2, arc: 150, move: .6, chain: .2 },
  f3: { anim: 'f_cross', dur: .56, hit: [.14, .28], dmg: 34, ki: 20, poise: 8, cost: 11, reach: 2.3, arc: 120, move: .8, chain: .3 },
};
const withHit = (key, hit) => ({ ...ACTIONS[key], hit });
const D = (key, name, from, o = {}) => { const s = src(from); SKILL_MOVES[key] = { ...s, name, fin: false, next: undefined, ...o }; };
// A move with its own animation: the animation's length and hit window, and these numbers.
function S(key, name, anim, dmg, o = {}) {
  ACTIONS[key] = anim;
  SKILL_MOVES[key] = { name, anim: key, dur: anim.dur, hit: anim.hit, dmg, ki: Math.round(dmg * .7), poise: Math.round(dmg * .35), cost: Math.round(dmg * .3),
    reach: 2.6, arc: 150, move: .8, chain: +(anim.hit[1] + .04).toFixed(3), heavy: true, skill: true, ...o };
}
// The air finisher: an air version of a heavy blow; foes caught in the air are slammed to the ground.
function airFin(key, name, from, hit, o = {}) {
  const s = src(from) || {}, A = ACTIONS[s.anim || from], dur = +((s.dur || A.dur) * .8).toFixed(2), k = dur / A.dur;
  ACTIONS[key] = airVariant(A, dur);
  const h = (hit || s.hit || A.hit).map(v => +(v * k).toFixed(3));
  SKILL_MOVES[key] = { name, anim: key, dur, hit: h, dmg: Math.round((s.dmg || 60) * 1.5), ki: Math.round((s.ki || 40) * 1.4), poise: Math.round((s.poise || 20) * 1.4), cost: Math.round((s.cost || 16) * .9),
    reach: (s.reach || 2.6) * 1.05, arc: Math.max(120, s.arc || 120), move: .4, chain: +(h[1] + .04).toFixed(3), air: true, slam: true, heavy: true, multi: s.multi, ...o };
}
const kit = (w, k) => { SKILL_KITS[w] = k; };
const wave = (color, o = {}) => ({ len: 11, speed: 22, w: 1.1, dmg: .8, color, ...o });

// Fae Sword: Moon Dragon, a turning leap and a falling cut.
D('sw_back', 'Retreating Thrust', 's_lunge', { dmg: 50, move: 1.4 });
D('sw_ctr', 'Moon Counter', 'light2', { dmg: 60, ki: 44, poise: 20, counter: true });
airFin('sw_airfin', 'Crescent Fall', 's_hslam', [.46, .56]);
S('sw_skill', 'Moon Dragon', string([whirl({ dur: .8, h: .1, p: .3, rise: .4, t: [.1, .6] }), chop({ two: 1, hop: .3, t: [.2, .36, .46] })], { hiltA: -.5, hiltR: .38, hiltH: -.1, bladeYaw: .2, bladePitch: .3, twoHand: 0 }, .4), 80,
  { reach: 2.8, arc: 360, multi: .45, last: 1.6, pop: 4, move: 1.4, wave: wave(0xcfe8ff, { at: 1.05 }) });
kit('sword', { back: 'sw_back', counter: 'sw_ctr', airFin: 'sw_airfin', skill: 'sw_skill' });

// Moonglaive: Tidal Lance, three thrusts and a charge through.
D('gl_back', 'Retreating Sweep', 'g2', { dmg: 52, move: 1.2 });
D('gl_ctr', 'Tide Counter', 'g1', { dmg: 64, ki: 48, poise: 22, counter: true, move: 1.4 });
airFin('gl_airfin', 'Moonfall Plunge', 'g_hchop');
S('gl_skill', 'Tidal Lance', string([withHit('g_thrust', [.16, .28]), withHit('g_thrust', [.16, .28]), withHit('g_pierce', [.22, .46])], { chestRy: -.55, hiltA: -.95, hiltR: .27, hiltH: -.18, bladeYaw: .62, bladePitch: .2, twoHand: 1 }, .35), 64,
  { reach: 3.8, arc: 45, multi: .34, last: 2, move: 5, fixedMove: true, wave: wave(0xc9b4ff, { at: 1.0, w: .8 }) });
kit('glaive', { back: 'gl_back', counter: 'gl_ctr', airFin: 'gl_airfin', skill: 'gl_skill' });

// Twin Fangs: Swallow's Return, a dash through and a whirl back.
D('fg_back', 'Retreating Fangs', 'f1', { dmg: 32, move: 1.2 });
D('fg_ctr', 'Fang Counter', 'f3', { dmg: 48, ki: 32, poise: 14, counter: true });
airFin('fg_airfin', 'Falling Fangs', 'f_hdrop');
S('fg_skill', "Swallow's Return", string([withHit('f_viper', [.12, .46]), withHit('f_whirl', [.2, .8])], { hiltA: -.6, hiltR: .34, hiltH: -.05, bladeYaw: .3, bladePitch: .35, lhX: .26, lhY: -.08, lhZ: .3, lbYaw: 2.7, lbPitch: -.35 }, .3), 26,
  { reach: 2.6, arc: 360, multi: .1, last: 3, move: 5, fixedMove: true, pass: true, kb: -2 });
kit('fangs', { back: 'fg_back', counter: 'fg_ctr', airFin: 'fg_airfin', skill: 'fg_skill' });

// Thornhammer: Earthbreaker, the Meteorfall with the ground torn open around it.
D('hm_back', 'Retreating Swing', 'h_side', { dmg: 76, move: 1.2 });
D('hm_ctr', 'Anvil Counter', 'h_upper', { dmg: 96, ki: 70, poise: 40, counter: true, pop: 7.5 });
airFin('hm_airfin', 'Anvil Fall', 'h_over');
S('hm_skill', 'Earthbreaker', withHit('h_hmeteor', [.9, 1.0]), 190, { reach: 3.2, arc: 360, move: 2.2, aoe: 4.6, aoeAt: 1.2, pop: 5, cost: 40, wave: wave(0xffcf8a, { w: 1.4, dmg: .7 }) });
kit('hammer', { back: 'hm_back', counter: 'hm_ctr', airFin: 'hm_airfin', skill: 'hm_skill' });

// Starfists: Starfall Palm, a hundred fists and a palm that blasts.
D('fs_back', 'Retreating Kick', 'x_front', { dmg: 36, move: 1.2 });
D('fs_ctr', 'Iron Counter', 'x_palm', { dmg: 56, ki: 60, poise: 22, counter: true });
airFin('fs_airfin', 'Meteor Heel', 'x_axe');
S('fs_skill', 'Starfall Palm', string([withHit('x_rush', [.08, .92]), withHit('x_palm', [.18, .3])], { hiltA: -.35, hiltR: .26, hiltH: .12, lhX: .12, lhY: .12, lhZ: .34 }, .3), 16,
  { reach: 2.1, arc: 80, multi: .06, last: 6, kb: 10, move: 1.4, cost: 22, wave: wave(0x9fe8ff, { at: 1.1, len: 8, w: 1.4, dmg: 3 }) });
kit('fists', { back: 'fs_back', counter: 'fs_ctr', airFin: 'fs_airfin', skill: 'fs_skill' });

// ---------------------------------------------------------------- the armory's fifteen
const K15 = [
  // weapon, prefix, back (from, name), counter (from, name), air finisher (from, name), skill name
  ['great', 'wb', 'wb_return', 'Retreating Sweep', 'wb_upper', 'Iron Counter', 'wb_hfall', 'Falling Edge'],
  ['aegis', 'ae', 'ae_cut', 'Shield Retreat', 'ae_upbash', 'Shield Counter', 'ae_hchop', 'Falling Bastion'],
  ['daggers', 'dg', 'dg_rev', 'Retreating Thorn', 'dg_stab', 'Thorn Riposte', 'dg_hstab', 'Magpie Plunge'],
  ['hatchets', 'ht', 'ht_hook', 'Retreating Hook', 'ht_twin', 'Hatchet Counter', 'ht_twin', 'Falling Twins'],
  ['chain', 'ch', 'ch_back', 'Retreating Lash', 'ch_snap', 'Snapping Counter', 'ch_crack', 'Falling Crack'],
  ['scythe', 'sc', 'sc_return', 'Retreating Reap', 'sc_hook', "Reaper's Counter", 'sc_hook', 'Falling Moon'],
  ['claws', 'cl', 'cl_rakeL', 'Retreating Rake', 'cl_twin', "Wolf's Counter", 'cl_hrake', 'Falling Rend'],
  ['saw', 'gw', 'gw_back', 'Retreating Grind', 'gw_ram', 'Grinding Counter', 'gw_hpress', 'Falling Wheel'],
  ['hexblade', 'hx', 'hx_cut2', 'Retreating Hex', 'hx_palm', 'Hex Counter', 'hx_hchop', 'Hexfall Plunge'],
  ['staff', 'st', 'st_jab', 'Retreating Jab', 'st_butt', 'Staff Counter', 'st_hchop', 'Falling Pillar'],
  ['fans', 'fn', 'fn_close', 'Retreating Wings', 'fn_open', 'Moth Counter', 'fn_leap', 'Moth Plunge'],
  ['tonfas', 'tf', 'tf_cross', 'Retreating Baton', 'tf_elbow', 'Iron Moon Counter', 'tf_hammer', 'Moonfall Batons'],
  ['rapier', 'rp', 'rp_lunge', 'Retreating Lunge', 'rp_cut', 'Riposte', 'rp_hthrust', 'Falling Point'],
  ['katana', 'kt', 'kt_draw', 'Retreating Draw', 'kt_draw', 'Counter Draw', 'kt_hchop', 'Falling Frost'],
  ['ring', 'rg', 'rg_back', 'Retreating Arc', 'rg_punch', 'Ring Counter', 'rg_hfall', 'Falling Ring'],
];
for (const [w, p, b, bn, c, cn, f, fn] of K15) {
  const B = src(b), C = src(c);
  D(p + '_back', bn, b, { dmg: Math.round(B.dmg * 1.2), move: Math.max(1.2, B.fixedMove ? 1.6 : B.move), fixedMove: false, pass: false });
  D(p + '_ctr', cn, c, { dmg: Math.round(C.dmg * 1.4), ki: Math.round(C.ki * 1.5), poise: Math.round(C.poise * 1.3), counter: true, fixedMove: false, pass: false, move: .9 });
  airFin(p + '_airfin', fn, f);
  SKILL_KITS[w] = { back: p + '_back', counter: p + '_ctr', airFin: p + '_airfin', skill: p + '_skill' };
}
const A = k => ACTIONS[k];
const GREAT_END = { chestRy: -.45, chestRx: .05, hiltA: -.85, hiltR: .26, hiltH: -.2, bladeYaw: .45, bladePitch: .55, bladeRoll: 0, twoHand: 1 };
const POLE_END = { chestRy: -.55, chestRx: .05, hiltA: -.95, hiltR: .27, hiltH: -.18, bladeYaw: .62, bladePitch: .2, bladeRoll: 0, twoHand: 1 };
const PAIR_END = { hiltA: -.6, hiltR: .34, hiltH: -.05, bladeYaw: .3, bladePitch: .35, lhX: .26, lhY: -.08, lhZ: .3, lbYaw: 2.7, lbPitch: -.35, twoHand: 0 };
const SWORD_END = { hiltA: -.5, hiltR: .38, hiltH: -.1, bladeYaw: .2, bladePitch: .3, bladeRoll: 0, twoHand: 0 };
const FIST_END = { hiltA: -.35, hiltR: .26, hiltH: .12, lhX: .12, lhY: .12, lhZ: .34, twoHand: 0 };
S('wb_skill', 'Tempest Cleave', string([whirl({ dur: 1.0, turns: 2, two: 1, h: .05, t: [.14, .8], r: .5 }), chop({ two: 1, hop: .35, yaw: .3, t: [.24, .44, .54] })], GREAT_END, .45), 90,
  { reach: 3.2, arc: 360, multi: .4, last: 1.8, move: 2, aoe: 2.8, aoeAt: 2.0, pop: 3.6, cost: 38, wave: wave(0xd8e4ff, { at: 1.5, w: 1.3 }) });
S('ae_skill', 'Bulwark Charge', retime(A('ae_charge'), 1.0, { hit: [.14, .72] }), 70, { reach: 2.2, arc: 120, move: 7, fixedMove: true, kb: 11, ki: 80, cost: 26 });
S('dg_skill', 'Shadow Dance', string([A('dg_dart'), A('dg_spin'), A('dg_dart')], PAIR_END, .3), 26, { reach: 2.5, arc: 360, multi: .1, last: 3, move: 6.5, fixedMove: true, pass: true, cost: 24 });
S('ht_skill', 'Timberfall', retime(A('ht_hleap'), 1.2, { hit: [.55, .78] }), 120, { reach: 2.5, arc: 360, move: 3.4, fixedMove: true, aoe: 3.8, aoeAt: 1.4, pop: 4, cost: 30, wave: wave(0xffc890, { w: 1.3 }) });
S('ch_skill', 'Briar Tempest', twirl({ dur: 1.5, turns: 4, h: .52, pitch: .05, t: [.14, 1.26], lead: { lhX: .3, lhY: -.1, lhZ: .22 }, end: POLE_END }), 30, { reach: 3.8, arc: 360, multi: .14, last: 2.5, kb: -6, move: .6, cost: 30 });
S('sc_skill', "Reaper's Eclipse", string([whirl({ dur: 1.0, turns: 2, two: 1, h: .15, p: .3, rise: .35, t: [.12, .78] }), chop({ two: 1, yaw: .3, t: [.14, .28, .38] })], POLE_END, .45), 76,
  { reach: 3.6, arc: 360, multi: .38, last: 2, kb: -4, move: 1.4, cost: 34, wave: wave(0xe0d0ff, { at: 1.2 }) });
S('cl_skill', 'Blood Moon', string([A('cl_pounce'), A('cl_frenzy')], FIST_END, .3), 28, { reach: 2.2, arc: 140, multi: .18, last: 2.5, move: 3.8, fixedMove: true, cost: 26 });
S('gw_skill', 'Grinding Ascent', string([A('gw_ram'), A('gw_rise')], GREAT_END, .4), 60, { reach: 3.0, arc: 90, multi: .12, last: 3, pop: 9.5, move: 1.6, cost: 34 });
S('hx_skill', 'Hex Nova', retime(A('hx_palm'), .8, { hit: [.26, .4] }), 90, { reach: 2.4, arc: 360, aoe: 3.6, aoeAt: .8, kb: 9, move: .6, cost: 26, hexNova: 3 });
S('st_skill', "Monkey King's Whirl", twirl({ dur: 1.5, turns: 4, h: .52, pitch: .05, t: [.14, 1.26], lead: { lhX: .35, lhY: .1, lhZ: .1 }, end: POLE_END }), 30, { reach: 3.2, arc: 360, multi: .12, last: 2.5, kb: 6, move: 4.5, fixedMove: true, cost: 30 });
S('fn_skill', 'Moon Moth Waltz', string([A('fn_open'), A('fn_close'), whirl({ dur: 1.0, turns: 3, h: .1, p: .2, rise: .35, t: [.08, .8], off: true, r: .52 })], PAIR_END, .3), 22,
  { reach: 2.8, arc: 360, multi: .1, last: 3, kb: 6, pop: 4, move: 1.4, cost: 26 });
S('tf_skill', 'Crescent Barrage', string([A('tf_barrage'), A('tf_hammer')], FIST_END, .3), 12, { reach: 2.1, arc: 80, multi: .06, last: 7, move: 1.4, cost: 24, pop: 3.4 });
S('rp_skill', 'Silk Thousand', { ...flurry({ n: 16, t0: .12, step: .05, dur: 1.2, fangs: false }), hit: [.1, 1.0] }, 12, { reach: 3.0, arc: 40, multi: .05, last: 6, move: 1.6, cost: 24, wave: wave(0xd8d8ff, { at: .96, w: .6 }) });
S('kt_skill', 'Winter Moon Iai', { ...retime(A('kt_draw'), 1.1), keys: [K(0, { hiltA: .62, hiltR: .3, hiltH: -.22, bladeYaw: 2.7, bladePitch: -.25, bladeRoll: 1.57, lhX: .28, lhY: -.25, lhZ: .16, twoHand: 0, chestRy: .5, lift: -.2, thLx: -.8, knL: 1.0, thRx: .5, knR: .8 }), ...retime(A('kt_draw'), 1.1).keys.map(([t, p]) => [t + .4, p])], hit: [.64, .86], dur: 1.5 }, 150,
  { reach: 3.0, arc: 200, move: 1.6, cost: 30, iai: true, wave: wave(0xbfe6ff, { at: .64, len: 14, speed: 26, w: 1.6, dmg: .9 }) });
S('rg_skill', 'Eclipse', whirl({ dur: 1.1, turns: 2, h: .1, p: .2, rise: .3, t: [.12, .84], r: .56, end: SWORD_END }), 30,
  { reach: 2.7, arc: 360, multi: .14, last: 2, move: .8, cost: 26, hurl: { kind: 'ring', n: 3, spread: .5, range: 13, speed: 22, at: .88 } });
