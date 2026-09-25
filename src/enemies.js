// Enemies: stats, attack sets, AI and procedural animation on top of the five-bone rigs from models3d.js.
// Every attack is a list of steps (windup → active → recover). A step marked burst is a Dread strike: it glows
// red and can't be guarded; the player dashes through it or answers with a Thorn Counter.
import * as THREE from 'three';
import { createModel, MODEL_SIZE } from './models3d.js';
import { buildKnight, KnightAnimator, ACTIONS } from './knight.js';
import { Trail } from './fx.js';
import { AFFIXES, rollChampion, championDress, championDispose } from './champions.js';
import { clamp, lerp, damp, angleDiff, turnTowards, yawTo, rand, smooth, TAU } from './util.js';

// ---------------------------------------------------------------- definitions
const S = (anim, windup, active, recover, dmg, o = {}) => ({ anim, windup, active, recover, dmg, reach: 2, arc: 100, lunge: 0, ...o });
const A = (name, range, steps, o = {}) => ({ name, range, steps, minRange: 0, w: 1, cd: 0, ...o });

export const TYPES = {
  'goblin-scout': {
    name: 'Goblin Scout', scale: .82, radius: .38, hp: 110, ki: 60, poise: 8, walk: 1.6, run: 4.6, glimmer: 55, voice: 'growl', pitch: 1.5,
    attacks: [
      A('Slash', 2.1, [S('swing', .42, .12, .55, 32, { reach: 2.1, arc: 110, lunge: 1 })]),
      A('Twin Slash', 2.1, [S('swing', .38, .1, .16, 26, { reach: 2.1, arc: 110, lunge: .8 }), S('backswing', .2, .1, .6, 26, { reach: 2.1, arc: 110, lunge: .8 })], { w: .8 }),
      A('Leaping Stab', 4.8, [S('thrust', .6, .15, .75, 40, { reach: 1.9, arc: 60, lunge: 3.2 })], { minRange: 2.8, w: .7 }),
    ],
  },
  'goblin-spearguard': {
    name: 'Goblin Spear Guard', scale: .85, radius: .42, hp: 170, ki: 110, poise: 18, walk: 1.4, run: 3.9, glimmer: 85, voice: 'growl', pitch: 1.3,
    attacks: [
      A('Thrust', 2.9, [S('thrust', .55, .12, .6, 42, { reach: 3, arc: 40, lunge: .7 })]),
      A('Double Thrust', 2.9, [S('thrust', .5, .1, .15, 34, { reach: 3, arc: 40, lunge: .5 }), S('thrust', .25, .12, .7, 38, { reach: 3, arc: 40, lunge: .7 })], { w: .7 }),
      A('Sweep', 2.6, [S('swing', .7, .15, .7, 48, { reach: 2.8, arc: 150, lunge: .4 })], { w: .6 }),
      A('Skewer', 5, [S('thrust', .85, .16, .9, 62, { reach: 3, arc: 40, lunge: 3.2, burst: true })], { minRange: 3, w: .5, cd: 6 }),
    ],
  },
  'goblin-archer': {
    name: 'Goblin Archer', scale: .82, radius: .38, hp: 90, ki: 50, poise: 8, walk: 1.6, run: 3.8, glimmer: 60, voice: 'growl', pitch: 1.6, style: 'ranged', prefer: [7, 14],
    attacks: [
      A('Arrow', 16, [S('shoot', .95, .1, .5, 34, { proj: { kind: 'arrow', speed: 24 } })], { minRange: 3.5 }),
      A('Stab', 2, [S('thrust', .45, .12, .6, 24, { reach: 1.9, arc: 70, lunge: .8 })]),
    ],
  },
  'goblin-bomber': {
    name: 'Goblin Bomber', scale: .82, radius: .38, hp: 100, ki: 60, poise: 10, walk: 1.6, run: 4, glimmer: 70, voice: 'growl', pitch: 1.4, style: 'ranged', prefer: [5, 12],
    attacks: [
      A('Firebomb', 13, [S('throw', 1.0, .1, .8, 58, { proj: { kind: 'bomb', flight: 1.05 } })], { minRange: 3.5 }),
      A('Headbutt', 1.9, [S('thrust', .5, .12, .6, 26, { reach: 1.8, arc: 70, lunge: 1 })]),
    ],
  },
  'goblin-berserker': {
    name: 'Goblin Berserker', scale: .85, radius: .42, hp: 210, ki: 120, poise: 24, walk: 1.8, run: 5, glimmer: 130, voice: 'growl', pitch: 1.2, aggro: .95,
    attacks: [
      A('Frenzy', 2.2, [S('swing', .34, .1, .08, 26, { reach: 2.2, lunge: .9 }), S('backswing', .16, .1, .08, 26, { reach: 2.2, lunge: .9 }), S('overhead', .3, .12, .8, 36, { reach: 2.2, arc: 60, lunge: 1 })]),
      A('Mad Leap', 6, [S('overhead', .8, .16, 1, 70, { reach: 2.2, arc: 70, lunge: 4.6, burst: true, hyper: true })], { minRange: 3, cd: 5, w: .8 }),
    ],
  },
  'goblin-poisoner': {
    name: 'Goblin Poisoner', scale: .82, radius: .38, hp: 120, ki: 70, poise: 10, walk: 1.6, run: 4.4, glimmer: 80, voice: 'growl', pitch: 1.5,
    attacks: [
      A('Venom Stab', 2, [S('thrust', .4, .12, .55, 26, { reach: 2, arc: 70, lunge: 1, poison: 40 })]),
      A('Toxic Vial', 10, [S('throw', .85, .1, .7, 0, { proj: { kind: 'vial', flight: .9 } })], { minRange: 4, cd: 5 }),
    ],
  },
  'goblin-clubber': {
    name: 'Gatewarden Grubskull', scale: 1.28, radius: .95, hp: 820, ki: 280, poise: 55, walk: 1.5, run: 4, glimmer: 1500, voice: 'growl', pitch: .7, elite: true, track: 3.5,
    attacks: [
      A('Club Smash', 3.2, [S('overhead', .85, .16, .9, 88, { reach: 3.3, arc: 60, lunge: 1.2, aoe: 1.4, shake: .5 })]),
      A('Sweep', 3.3, [S('swing', .7, .18, .8, 70, { reach: 3.5, arc: 160, lunge: .8 })]),
      A('Two-Step', 3.3, [S('swing', .65, .16, .2, 62, { reach: 3.5, arc: 150, lunge: .8 }), S('overhead', .45, .16, 1, 82, { reach: 3.3, arc: 60, lunge: 1, aoe: 1.4, shake: .5 })], { w: .7 }),
      A('Bull Charge', 9, [S('thrust', .95, .45, 1.1, 105, { reach: 2.6, arc: 90, lunge: 8, burst: true, hyper: true })], { minRange: 4, cd: 7, w: .8 }),
      A('Ground Pound', 3.5, [S('overhead', 1.05, .18, 1.2, 115, { reach: 0, aoe: 3.4, aoeAt: 1.2, burst: true, hyper: true, shake: .9 })], { cd: 8, w: .6 }),
    ],
  },
  'ratman-scout': {
    name: 'Ratman Scout', scale: .9, radius: .38, hp: 100, ki: 55, poise: 8, walk: 1.8, run: 5.6, glimmer: 70, voice: 'squeal', pitch: 1.2,
    attacks: [
      A('Claw', 1.9, [S('swing', .32, .1, .45, 26, { reach: 1.9, lunge: 1 })]),
      A('Pounce', 4.5, [S('thrust', .5, .14, .7, 34, { reach: 1.8, arc: 70, lunge: 3.4 })], { minRange: 2.6, w: .8 }),
    ],
  },
  'ratman-skirmisher': {
    name: 'Ratman Skirmisher', scale: .9, radius: .4, hp: 150, ki: 90, poise: 14, walk: 1.8, run: 5, glimmer: 110, voice: 'squeal', pitch: 1, evasive: .3,
    attacks: [
      A('Rend', 2.1, [S('swing', .38, .1, .14, 32, { reach: 2.1, lunge: .9 }), S('backswing', .24, .1, .6, 32, { reach: 2.1, lunge: .9 })]),
      A('Gutting Lunge', 5.5, [S('thrust', .75, .15, .85, 58, { reach: 2.1, arc: 50, lunge: 4.5, burst: true })], { minRange: 3, cd: 5, w: .6 }),
    ],
  },
  'ratman-poisoner': {
    name: 'Ratman Poisoner', scale: .9, radius: .4, hp: 130, ki: 80, poise: 12, walk: 1.7, run: 4.4, glimmer: 100, voice: 'squeal', pitch: 1.1,
    attacks: [
      A('Blight Stab', 2, [S('thrust', .42, .12, .55, 26, { reach: 2, arc: 70, lunge: 1, poison: 45 })]),
      A('Plague Flask', 11, [S('throw', .8, .1, .7, 0, { proj: { kind: 'vial', flight: .95 } })], { minRange: 3.5, cd: 4.5 }),
    ],
  },
  'ratman-brute': {
    name: 'Ratman Brute', scale: .92, radius: .6, hp: 430, ki: 240, poise: 42, walk: 1.4, run: 3.6, glimmer: 320, voice: 'growl', pitch: .8, track: 3.8,
    attacks: [
      A('Crush', 2.8, [S('overhead', .85, .16, .9, 84, { reach: 2.8, arc: 60, lunge: .8, aoe: 1.1, shake: .4 })]),
      A('Backhand', 2.9, [S('swing', .7, .16, .8, 68, { reach: 3, arc: 160, lunge: .5 })]),
      A('Trample', 7.5, [S('thrust', .9, .4, 1, 100, { reach: 2.2, arc: 90, lunge: 6.5, burst: true, hyper: true })], { minRange: 3.5, cd: 7, w: .8 }),
    ],
  },
  'ratman-slinger': {
    name: 'Ratman Slinger', scale: .9, radius: .38, hp: 90, ki: 50, poise: 8, walk: 1.8, run: 4.4, glimmer: 75, voice: 'squeal', pitch: 1.3, style: 'ranged', prefer: [6, 13],
    attacks: [
      A('Sling', 15, [S('throw', .8, .1, .45, 28, { proj: { kind: 'stone', speed: 17 } })], { minRange: 3 }),
      A('Bite', 1.8, [S('thrust', .4, .12, .5, 22, { reach: 1.8, arc: 70, lunge: .8 })]),
    ],
  },
  'ratman-assassin': {
    name: 'Ratman Assassin', scale: .9, radius: .38, hp: 140, ki: 80, poise: 12, walk: 2, run: 6.2, glimmer: 140, voice: 'squeal', pitch: .9, aggro: .9, evasive: .35,
    attacks: [
      A('Flurry', 2, [S('swing', .26, .08, .06, 22, { reach: 2, lunge: .7 }), S('backswing', .14, .08, .06, 22, { reach: 2, lunge: .7 }), S('thrust', .2, .1, .7, 28, { reach: 2.1, arc: 60, lunge: 1 })]),
      A('Shadow Leap', 6.5, [S('thrust', .6, .15, .9, 72, { reach: 2, arc: 60, lunge: 5.5, burst: true })], { minRange: 3, cd: 5, w: .8 }),
    ],
  },
  'ratman-shaman': {
    name: 'Ratman Shaman', scale: .9, radius: .4, hp: 110, ki: 60, poise: 10, walk: 1.5, run: 3.8, glimmer: 120, voice: 'squeal', pitch: 1, style: 'ranged', prefer: [8, 14],
    attacks: [
      A('Rot Orbs', 16, [S('cast', 1.1, .15, .9, 30, { proj: { kind: 'orb', count: 3, speed: 6.5 } })], { minRange: 3 }),
      A('Staff Swipe', 2.2, [S('swing', .5, .12, .6, 26, { reach: 2.2, lunge: .6 })]),
    ],
  },
  'ratman-warblade': {
    name: 'Gnawfang, Warblade of the Warren', regalia: 'bonecrown', scale: 1.55, radius: .9, hp: 2300, ki: 380, poise: 75, walk: 2, run: 5.2, glimmer: 6000, voice: 'growl', pitch: .55, boss: true, track: 3.2, aggro: .9,
    attacks: [
      A('Cleave', 3.9, [S('swing', .72, .16, .85, 95, { reach: 4.0, arc: 150, lunge: 1.8 })]),
      A('Rending Chain', 3.9, [
        S('swing', .6, .14, .12, 72, { reach: 3.9, arc: 140, lunge: 1.4 }),
        S('backswing', .38, .14, .12, 72, { reach: 3.9, arc: 140, lunge: 1.4 }),
        S('overhead', .55, .18, 1.1, 100, { reach: 3.8, arc: 60, lunge: 1.6, aoe: 1.8, shake: .6 }),
      ], { w: .9 }),
      A('Gnaw Lunge', 11, [S('thrust', .9, .3, 1.1, 130, { reach: 3.0, arc: 70, lunge: 8.5, burst: true, hyper: true })], { minRange: 5, cd: 6, w: .9 }),
      A('Warren Quake', 14, [S('leap', .75, .8, 1.2, 140, { reach: 0.0, aoe: 4, burst: true, hyper: true, shake: 1.1 })], { minRange: 6, cd: 8, w: .8 }),
      A('Tail Whirl', 3.7, [S('spin', .6, .35, .9, 82, { reach: 3.8, arc: 360, lunge: 0 })], { cond: 'behind', w: 2, cd: 4 }),
    ],
    phase2: [
      A('Plague Roar', 30, [S('roar', 1.4, .6, .6, 0, { hyper: true })], { once: true }),
      A('Frenzied Chain', 3.9, [
        S('swing', .45, .12, .08, 70, { reach: 3.9, arc: 140, lunge: 1.4 }),
        S('backswing', .3, .12, .08, 70, { reach: 3.9, arc: 140, lunge: 1.4 }),
        S('swing', .3, .12, .1, 70, { reach: 3.9, arc: 140, lunge: 1.4 }),
        S('overhead', .7, .18, 1.2, 120, { reach: 3.8, arc: 60, lunge: 2, aoe: 2, burst: true, hyper: true, shake: .8 }),
      ], { w: 1 }),
    ],
  },
};


// ---- The Rotwood Hollow
Object.assign(TYPES, {
  'goblin-shaman': {
    name: 'Goblin Hexer', scale: .82, radius: .38, hp: 110, ki: 60, poise: 8, walk: 1.5, run: 3.8, glimmer: 110, voice: 'growl', pitch: 1.7, style: 'ranged', prefer: [7, 13],
    attacks: [
      A('Hex Orbs', 15, [S('cast', 1.0, .15, .8, 28, { proj: { kind: 'orb', count: 2, speed: 7 } })], { minRange: 3 }),
      A('Mending Chant', 20, [S('cast', 1.3, .2, .8, 0, { heal: .3 })], { cd: 9, w: 1.5, cond: 'alliesHurt' }),
      A('Staff Swipe', 2, [S('swing', .5, .12, .6, 24, { reach: 2, lunge: .6 })]),
    ],
  },
  'goblin-trapper': {
    name: 'Goblin Trapper', scale: .82, radius: .4, hp: 120, ki: 70, poise: 10, walk: 1.6, run: 4.2, glimmer: 90, voice: 'growl', pitch: 1.4, style: 'ranged', prefer: [5, 11],
    attacks: [
      A('Bola', 13, [S('throw', .8, .1, .6, 16, { proj: { kind: 'snare', speed: 14 } })], { minRange: 3, cd: 6 }),
      A('Gutting Knife', 2, [S('thrust', .42, .12, .55, 30, { reach: 2, arc: 70, lunge: 1 })]),
    ],
  },
  'ratman-packleader': {
    name: 'Ratman Packleader', scale: .92, radius: .5, hp: 380, ki: 200, poise: 36, walk: 1.8, run: 5, glimmer: 300, voice: 'squeal', pitch: .8, track: 4.5, aggro: .85,
    attacks: [
      A('Pack Rend', 2.4, [S('swing', .45, .12, .12, 44, { reach: 2.5, lunge: 1 }), S('backswing', .28, .12, .7, 44, { reach: 2.5, lunge: 1 })]),
      A('Rallying Howl', 12, [S('roar', 1.1, .5, .5, 0, { hyper: true, howl: true })], { cd: 14, w: .6 }),
      A('Throat Lunge', 6.5, [S('thrust', .75, .2, .9, 72, { reach: 2.3, arc: 60, lunge: 5.5, burst: true, hyper: true })], { minRange: 3, cd: 6 }),
    ],
  },
  brakka: {
    model: 'goblin-berserker', name: 'Brakka the Skullsplitter', scale: 1.35, radius: .8, hp: 900, ki: 260, poise: 50, walk: 1.8, run: 4.8, glimmer: 1800, voice: 'growl', pitch: .75, elite: true, track: 4, aggro: .95,
    attacks: [
      A('Frenzy', 3, [S('swing', .45, .12, .08, 48, { reach: 3, lunge: 1 }), S('backswing', .22, .12, .08, 48, { reach: 3, lunge: 1 }), S('overhead', .38, .14, .9, 66, { reach: 3, arc: 60, lunge: 1, aoe: 1.4, shake: .4 })]),
      A('Skull Whirl', 3.2, [S('spin', .7, .45, .9, 62, { reach: 3.3, arc: 360 })], { cd: 5, w: .8 }),
      A('Mad Leap', 8, [S('leap', .7, .7, 1, 96, { reach: 0, aoe: 3, burst: true, hyper: true, shake: .9 })], { minRange: 4, cd: 7, w: .9 }),
      A('Headbutt', 2.6, [S('thrust', .5, .14, .7, 58, { reach: 2.7, arc: 70, lunge: 1.4 })], { w: .7 }),
    ],
  },
  grimtusk: {
    model: 'goblin-commander', name: 'Grimtusk, Warlord of the Pyre', scale: 1.8, radius: .85, hp: 3000, ki: 420, poise: 80, walk: 2, run: 5.4, glimmer: 9000, voice: 'growl', pitch: .5, boss: true, track: 3.4, aggro: .9,
    roarHazard: 'fire',
    attacks: [
      A('Warlord Cleave', 3.9, [S('swing', .7, .16, .85, 92, { reach: 4, arc: 150, lunge: 1.6 })]),
      A('Shield Rush', 5, [S('thrust', .6, .2, .8, 72, { reach: 2.8, arc: 80, lunge: 4.5 })], { minRange: 2.5, w: .8 }),
      A('Command Chain', 3.9, [
        S('swing', .55, .14, .1, 66, { reach: 3.9, arc: 140, lunge: 1.2 }),
        S('backswing', .34, .14, .1, 66, { reach: 3.9, arc: 140, lunge: 1.2 }),
        S('overhead', .5, .18, 1.1, 96, { reach: 3.7, arc: 60, lunge: 1.5, aoe: 1.8, shake: .6 }),
      ], { w: .9 }),
      A('Firebomb Volley', 16, [S('throw', .9, .15, .9, 52, { proj: { kind: 'bomb', flight: 1.1, count: 3, fire: 1.5 } })], { minRange: 6, cd: 7, w: .9 }),
      A('Pyre Charge', 12, [S('thrust', .9, .35, 1.1, 125, { reach: 3.2, arc: 80, lunge: 9, burst: true, hyper: true })], { minRange: 5, cd: 6, w: .8 }),
      A('Skull Splitter', 14, [S('leap', .75, .85, 1.2, 135, { reach: 0, aoe: 3.8, burst: true, hyper: true, shake: 1.1, fire: 2.4 })], { minRange: 6, cd: 9, w: .7 }),
    ],
    phase2: [
      A('Warcry', 30, [S('roar', 1.3, .6, .6, 0, { hyper: true })], { once: true }),
      A('Inferno Chain', 3.9, [
        S('swing', .42, .12, .08, 64, { reach: 3.9, arc: 140, lunge: 1.2 }),
        S('backswing', .3, .12, .08, 64, { reach: 3.9, arc: 140, lunge: 1.2 }),
        S('swing', .3, .12, .1, 64, { reach: 3.9, arc: 140, lunge: 1.2 }),
        S('overhead', .7, .18, 1.2, 115, { reach: 3.7, arc: 60, lunge: 2, aoe: 2, burst: true, hyper: true, shake: .8, fire: 2.2 }),
      ], { w: 1 }),
    ],
  },
});

// ---- The Gnawed Deep
Object.assign(TYPES, {
  'ratman-delver': {
    model: 'ratman-skirmisher', name: 'Ratman Delver', scale: .95, radius: .42, hp: 170, ki: 110, poise: 18, walk: 1.7, run: 4.6, glimmer: 150, voice: 'squeal', pitch: 1.05, aggro: .8,
    attacks: [
      A('Pick Swing', 2.4, [S('swing', .5, .12, .12, 34, { reach: 2.4, lunge: .9 }), S('overhead', .45, .14, .7, 44, { reach: 2.3, arc: 60, lunge: .8 })]),
      A('Burrow', 13, [S('burrow', .75, .9, .75, 58, { reach: 0, aoe: 1.9, burrow: true, shake: .45 })], { minRange: 4, cd: 6, w: 1.2 }),
    ],
  },
  'ratman-glowseer': {
    model: 'ratman-shaman', name: 'Ratman Glowseer', scale: .95, radius: .4, hp: 140, ki: 70, poise: 10, walk: 1.5, run: 3.9, glimmer: 160, voice: 'squeal', pitch: 1.2, style: 'ranged', prefer: [7, 13],
    attacks: [
      A('Crystal Orbs', 16, [S('cast', 1.0, .15, .8, 30, { proj: { kind: 'orb', count: 3, speed: 7.5 } })], { minRange: 3 }),
      A('Blink', 4, [S('cast', .45, .1, .45, 0, { blink: true })], { cond: 'close', cd: 5, w: 3 }),
      A('Staff Swipe', 2.2, [S('swing', .5, .12, .6, 28, { reach: 2.2, lunge: .6 })], { w: .5 }),
    ],
  },
  grinder: {
    model: 'ratman-brute', name: 'Grinder the Tunnel-Breaker', scale: 1.25, radius: 1.0, hp: 1400, ki: 320, poise: 70, walk: 1.6, run: 4.4, glimmer: 3200, voice: 'growl', pitch: .55, elite: true, track: 3.2, aggro: .9,
    attacks: [
      A('Maul Swing', 3.4, [S('swing', .7, .16, .15, 80, { reach: 3.4, arc: 150, lunge: 1.2 }), S('backswing', .5, .16, .9, 80, { reach: 3.4, arc: 150, lunge: 1.2 })]),
      A('Breaker Slam', 3.2, [S('overhead', .9, .2, 1.1, 110, { reach: 3.1, arc: 70, lunge: 1.4, aoe: 2.2, shake: .7 })], { w: .8 }),
      A('Rolling Charge', 11, [S('thrust', .8, .5, 1.1, 100, { reach: 2.6, arc: 90, lunge: 9, burst: true, hyper: true })], { minRange: 5, cd: 6, w: .9 }),
      A('Cave-in', 16, [S('roar', 1.0, .3, .8, 70, { proj: { kind: 'rock', flight: 1.2, count: 5, spread: 5 }, hyper: true })], { minRange: 3, cd: 9, w: .7 }),
    ],
  },
  skritch: {
    model: 'ratman-shaman', name: 'Mother Skritch, the Plague Seer', regalia: 'circlet', scale: 1.9, radius: .85, hp: 3200, ki: 380, poise: 70, walk: 1.8, run: 4.4, glimmer: 12000, voice: 'squeal', pitch: .55, boss: true, track: 4, aggro: .9, style: 'ranged', prefer: [4, 9],
    attacks: [
      A('Plague Orbs', 18, [S('cast', .9, .15, .7, 44, { proj: { kind: 'orb', count: 5, speed: 7.5 } })], { minRange: 3.5, w: 1.2 }),
      A('Staff Flurry', 3.6, [
        S('swing', .55, .14, .1, 60, { reach: 3.6, arc: 140, lunge: 1.2 }),
        S('backswing', .35, .14, .1, 60, { reach: 3.6, arc: 140, lunge: 1.2 }),
        S('thrust', .4, .16, .9, 70, { reach: 3.8, arc: 60, lunge: 2 }),
      ]),
      A('Blink', 5, [S('cast', .5, .1, .5, 0, { blink: true })], { cond: 'close', cd: 7, w: 1.4 }),
      A('Plague Nova', 5.5, [S('cast', 1.2, .3, 1.0, 95, { reach: 0, aoe: 5, burst: true, hyper: true, shake: .8, pool: 3.5 })], { cd: 8 }),
      A('Rot Rain', 18, [S('throw', .9, .15, .8, 30, { proj: { kind: 'vial', flight: 1.2, count: 4, spread: 4.5 } })], { minRange: 5, cd: 7, w: .9 }),
    ],
    phase2: [
      A('Swarm Call', 30, [S('roar', 1.3, .6, .6, 0, { hyper: true })], { once: true }),
      A('Orb Nova', 18, [S('cast', 1.0, .2, .9, 40, { proj: { kind: 'orb', count: 14, speed: 5.5, ring: true } })], { cd: 6, w: 1.2 }),
    ],
  },
});

// ---- The Moonspire
Object.assign(TYPES, {
  // Raises a war chant: allies nearby hit harder and can't be staggered for a while.
  'goblin-warchanter': {
    model: 'goblin-shaman', name: 'Goblin Warchanter', scale: .9, radius: .4, hp: 150, ki: 80, poise: 10, walk: 1.5, run: 3.9, glimmer: 220, voice: 'growl', pitch: 1.2, style: 'ranged', prefer: [7, 12],
    attacks: [
      A('War Chant', 22, [S('roar', 1.1, .4, .6, 0, { chant: 9 })], { cd: 10, w: 2.5, cond: 'alliesNear' }),
      A('Hex Orbs', 15, [S('cast', 1.0, .15, .8, 30, { proj: { kind: 'orb', count: 2, speed: 7.5 } })], { minRange: 3 }),
      A('Staff Swipe', 2.2, [S('swing', .5, .12, .6, 28, { reach: 2.2, lunge: .6 })], { w: .5 }),
    ],
  },
  // A shield wall: blows from the front glance off until the guard breaks. Go round, or hit hard.
  'goblin-skyguard': {
    model: 'goblin-spearguard', name: 'Goblin Skyguard', scale: .95, radius: .45, hp: 200, ki: 140, poise: 24, walk: 1.5, run: 4, glimmer: 200, voice: 'growl', pitch: 1.1, shield: true,
    attacks: [
      A('Pike Thrust', 3.2, [S('thrust', .55, .14, .6, 42, { reach: 3.1, arc: 50, lunge: 1.2 })]),
      A('Shield Bash', 2.2, [S('thrust', .45, .12, .7, 34, { reach: 2.1, arc: 80, lunge: 1.8, poise: 40 })], { w: .8 }),
      A('Sky Lunge', 8, [S('leap', .6, .55, .9, 66, { reach: 0, aoe: 1.8, shake: .4 })], { minRange: 4.5, cd: 7, w: .7 }),
    ],
  },
  // Steps out of the shadows behind the knight and cuts.
  'ratman-shadowblade': {
    model: 'ratman-assassin', name: 'Ratman Shadowblade', scale: 1, radius: .4, hp: 160, ki: 90, poise: 12, walk: 2, run: 5.4, glimmer: 210, voice: 'squeal', pitch: 1.25, evasive: .6, aggro: .85,
    attacks: [
      A('Shadow Step', 12, [S('cast', .35, .08, .05, 0, { blink: true, behind: true }), S('swing', .28, .12, .7, 52, { reach: 2.4, arc: 140, lunge: .8 })], { minRange: 3, cd: 6, w: 1.3 }),
      A('Twin Rake', 2.4, [S('swing', .35, .1, .08, 30, { reach: 2.3, lunge: .8 }), S('backswing', .22, .1, .6, 30, { reach: 2.3, lunge: .8 })]),
      A('Knife Fan', 14, [S('throw', .6, .1, .6, 24, { proj: { kind: 'knife', speed: 18, count: 3 } })], { minRange: 4, cd: 5, w: .7 }),
    ],
  },
  varkh: {
    model: 'goblin-spearguard', name: 'Varkh the Moon-Pike', scale: 1.45, radius: .9, hp: 2600, ki: 360, poise: 70, walk: 1.7, run: 4.8, glimmer: 5200, voice: 'growl', pitch: .7, elite: true, track: 3.6, aggro: .9,
    attacks: [
      A('Pike Chain', 4, [S('thrust', .6, .14, .1, 72, { reach: 4, arc: 45, lunge: 1.4 }), S('thrust', .35, .14, .1, 72, { reach: 4, arc: 45, lunge: 1.4 }), S('swing', .45, .16, .9, 88, { reach: 4, arc: 160, lunge: 1 })]),
      A('Moon Sweep', 4, [S('spin', .7, .4, .9, 90, { reach: 4.2, arc: 360 })], { cd: 5, w: .8 }),
      A('Impaling Leap', 10, [S('leap', .7, .65, 1.1, 120, { reach: 0, aoe: 2.4, burst: true, hyper: true, shake: .8 })], { minRange: 5, cd: 7, w: .9 }),
      A('Shield Rush', 7, [S('thrust', .7, .45, 1, 96, { reach: 2.8, arc: 90, lunge: 8, burst: true, hyper: true })], { minRange: 4, cd: 6, w: .8 }),
    ],
  },
  silkclaw: {
    model: 'ratman-assassin', name: 'Silkclaw, the Moonless Blade', regalia: 'halo', scale: 1.45, radius: .7, hp: 3600, ki: 380, poise: 60, walk: 2.4, run: 6.2, glimmer: 16000, voice: 'squeal', pitch: .6, boss: true, track: 6, aggro: .95, evasive: .45,
    attacks: [
      A('Rending Flurry', 3, [
        S('swing', .45, .1, .06, 52, { reach: 3, arc: 140, lunge: 1.2 }),
        S('backswing', .24, .1, .06, 52, { reach: 3, arc: 140, lunge: 1.2 }),
        S('swing', .24, .1, .06, 52, { reach: 3, arc: 140, lunge: 1.2 }),
        S('thrust', .38, .14, .9, 70, { reach: 3.2, arc: 60, lunge: 2 }),
      ]),
      A('Shadow Step', 14, [S('cast', .3, .08, .05, 0, { blink: true, behind: true }), S('backswing', .3, .12, .8, 80, { reach: 3, arc: 150, lunge: 1 })], { minRange: 3, cd: 5, w: 1.1 }),
      A('Crescent Lunge', 10, [S('thrust', .8, .3, 1, 120, { reach: 3, arc: 70, lunge: 9, burst: true, hyper: true })], { minRange: 4, cd: 6, w: .9 }),
      A('Moon Fangs', 16, [S('throw', .55, .1, .6, 36, { proj: { kind: 'knife', speed: 20, count: 5 } })], { minRange: 5, cd: 5, w: .8 }),
      A('Veil Step', 4, [S('cast', .4, .1, .4, 0, { blink: true })], { cond: 'close', cd: 9, w: .6 }),
    ],
    phase2: [
      A('Split Shadow', 30, [S('roar', 1.1, .5, .5, 0, { hyper: true })], { once: true }),
      A('Moonless Waltz', 3.2, [
        S('swing', .3, .1, .05, 50, { reach: 3.1, arc: 150, lunge: 1.4 }),
        S('backswing', .2, .1, .05, 50, { reach: 3.1, arc: 150, lunge: 1.4 }),
        S('spin', .25, .3, .05, 56, { reach: 3.3, arc: 360 }),
        S('swing', .2, .1, .05, 50, { reach: 3.1, arc: 150, lunge: 1.4 }),
        S('thrust', .45, .16, 1, 110, { reach: 3.3, arc: 60, lunge: 3, burst: true, hyper: true }),
      ], { w: 1.1 }),
    ],
  },
  // Silkclaw's shadows: quick, fragile, gone at a touch.
  'shadow-clone': {
    model: 'ratman-assassin', name: 'Moonless Shadow', scale: 1.1, radius: .45, hp: 90, ki: 40, poise: 99, walk: 2.4, run: 6, glimmer: 0, voice: 'squeal', pitch: .9, shade: true, aggro: 1,
    attacks: [
      A('Shadow Rake', 2.6, [S('swing', .4, .1, .06, 40, { reach: 2.6, lunge: 1 }), S('backswing', .24, .1, .7, 40, { reach: 2.6, lunge: 1 })]),
      A('Shadow Step', 12, [S('cast', .35, .08, .05, 0, { blink: true, behind: true }), S('swing', .3, .12, .8, 50, { reach: 2.6, arc: 140, lunge: .8 })], { minRange: 3, cd: 6 }),
    ],
  },
});

// ---- The Frostmere
// Rimed foes wear a pale frost tint and their blows carry chill.
const FROST = 0xc8dcff;
const rimed = (base, o) => {
  const B = TYPES[base];
  return { ...B, model: B.model || base, tint: FROST, glowTint: 0xbfe0ff, ...o,
    attacks: o.attacks || B.attacks.map(a => ({ ...a, steps: a.steps.map(st => st.proj || st.blink || !st.dmg ? st : { ...st, chill: st.chill ?? 14 }) })) };
};
Object.assign(TYPES, {
  // Frost shards in a fan, and a single line of ice spikes along the ground.
  'goblin-rimecaller': {
    model: 'goblin-shaman', tint: FROST, glowTint: 0xbfe0ff, name: 'Goblin Rimecaller', scale: .9, radius: .4, hp: 150, ki: 80, poise: 10, walk: 1.5, run: 3.9, glimmer: 280, voice: 'growl', pitch: 1.35, style: 'ranged', prefer: [7, 12],
    attacks: [
      A('Frost Shards', 15, [S('cast', .9, .12, .7, 30, { proj: { kind: 'shard', speed: 15, count: 3, chill: 22 } })], { minRange: 3 }),
      A('Rime Wave', 13, [S('cast', 1.1, .2, .9, 46, { reach: 0, wave: { n: 1, len: 13, speed: 11 } })], { minRange: 4, cd: 7, w: .9 }),
      A('Staff Swipe', 2.2, [S('swing', .5, .12, .6, 28, { reach: 2.2, lunge: .6, chill: 12 })], { w: .5 }),
    ],
  },
  // Pack hunters of the snowfields: quick bites that leave you cold.
  'ratman-frostfang': {
    model: 'ratman-scout', tint: FROST, glowTint: 0xbfe0ff, name: 'Ratman Frostfang', scale: 1, radius: .4, hp: 150, ki: 80, poise: 12, walk: 2, run: 6.2, glimmer: 250, voice: 'squeal', pitch: 1.15, aggro: .9, evasive: .35,
    attacks: [
      A('Frostbite', 2.1, [S('swing', .3, .1, .08, 28, { reach: 2.1, lunge: .9, chill: 14 }), S('thrust', .22, .12, .6, 32, { reach: 2.1, arc: 60, lunge: 1, chill: 14 })]),
      A('Pounce', 5.5, [S('thrust', .5, .14, .75, 44, { reach: 2, arc: 70, lunge: 4.2, chill: 20 })], { minRange: 2.8, w: .8 }),
    ],
  },
  // Hail pots burst in rime and leave the ground freezing.
  'goblin-hailslinger': {
    model: 'goblin-bomber', tint: FROST, glowTint: 0xbfe0ff, name: 'Goblin Hailslinger', scale: .84, radius: .38, hp: 120, ki: 60, poise: 10, walk: 1.6, run: 4, glimmer: 240, voice: 'growl', pitch: 1.45, style: 'ranged', prefer: [5, 12],
    attacks: [
      A('Hail Pot', 13, [S('throw', .95, .1, .8, 46, { proj: { kind: 'bomb', flight: 1.05, frost: 2.3 } })], { minRange: 3.5 }),
      A('Headbutt', 1.9, [S('thrust', .5, .12, .6, 26, { reach: 1.8, arc: 70, lunge: 1, chill: 10 })]),
    ],
  },
  // An ice-hammer brute: its slams send spikes racing out in a fan.
  'goblin-rimebreaker': {
    model: 'goblin-berserker', tint: FROST, glowTint: 0xbfe0ff, name: 'Goblin Rimebreaker', scale: .98, radius: .5, hp: 270, ki: 160, poise: 32, walk: 1.6, run: 4.4, glimmer: 380, voice: 'growl', pitch: 1, aggro: .85, track: 4.5,
    attacks: [
      A('Hammer Chain', 2.4, [S('swing', .45, .12, .1, 40, { reach: 2.4, lunge: 1, chill: 12 }), S('overhead', .4, .14, .8, 52, { reach: 2.3, arc: 60, lunge: 1, aoe: 1.2, shake: .35, chill: 16 })]),
      A('Glacier Slam', 9, [S('overhead', .85, .16, 1, 64, { reach: 2.3, arc: 60, lunge: .8, aoe: 1.3, shake: .45, wave: { n: 3, len: 9, speed: 11, spread: .45 } })], { cd: 6, w: .8 }),
    ],
  },
  'goblin-rimeguard': rimed('goblin-skyguard', { name: 'Goblin Rimeguard', glimmer: 300 }),
  'ratman-snowdelver': rimed('ratman-delver', { name: 'Ratman Snowdelver', glimmer: 280 }),
  'ratman-rimebrute': rimed('ratman-brute', { name: 'Ratman Rimebrute', glimmer: 520 }),

  // The gatekeeper: a knight of the fae who came to the mere before you and froze there. It fences like you do:
  // chains of four, a dashing thrust, a leaping slam, a Flashcut of its own, and it parries quick cuts.
  'rime-knight': {
    knight: { steel: 0xa8c8ec, dark: 0x1a2640, cloth: 0x2c4a7a, trim: 0xe4ecf8, visor: 0xff3a5a, blade: 0xdff4ff, wing: 0x9fd8ff, glow: 0x6fa8e8, trail: 0x9fe8ff },
    weapon: 'sword', name: 'The Rime Knight', scale: 1.22, radius: .55, hp: 2900, ki: 330, poise: 60, walk: 2.4, run: 6.4, glimmer: 7500, voice: 'growl', pitch: 1.1,
    elite: true, track: 7, aggro: .95, evasive: .5, parry: .45, glow: .12, roarHazard: 'frost', phase2At: .5, phase2Line: 'The Rime Knight\'s light turns to frost',
    attacks: [
      A('Mirror Chain', 2.8, [
        S('swing', .42, .12, .06, 58, { reach: 2.8, arc: 160, lunge: 1.1 }),
        S('backswing', .22, .12, .06, 58, { reach: 2.8, arc: 160, lunge: 1.1 }),
        S('overhead', .3, .14, .1, 66, { reach: 2.8, arc: 80, lunge: 1.2 }),
        S('spin', .3, .3, .8, 72, { reach: 3, arc: 360 }),
      ]),
      A('Quick Cut', 2.7, [S('swing', .34, .12, .55, 54, { reach: 2.7, arc: 150, lunge: 1.2 })], { w: .7 }),
      A('Needle Rush', 9, [S('thrust', .7, .25, .9, 96, { reach: 2.8, arc: 50, lunge: 7, burst: true })], { minRange: 4, cd: 6, w: .9 }),
      A('Skyfall', 10, [S('leap', .55, .62, 1, 110, { reach: 0, aoe: 2.6, burst: true, hyper: true, shake: .8 })], { minRange: 4.5, cd: 7, w: .8 }),
      A('Rime Flashcut', 12, [S('cast', .45, .08, .02, 0, { blink: true, behind: true, kact: 'dash' }), S('swing', .2, .12, .9, 84, { reach: 3, arc: 170, lunge: .6, kact: 'flashcut' })], { minRange: 3, cd: 8, w: .9 }),
      A('Frost Crescent', 16, [S('swing', .6, .14, .8, 62, { reach: 2.6, arc: 150, kact: 'light4', wave: { n: 1, len: 15, speed: 15 } })], { minRange: 3.5, cd: 6, w: .7 }),
    ],
    phase2: [
      A('Rime Shift', 30, [S('roar', 1.1, .5, .5, 0, { hyper: true })], { once: true }),
      A('Glacial Skyfall', 11, [S('leap', .6, .62, 1, 116, { reach: 0, aoe: 2.8, burst: true, hyper: true, shake: .9, wave: { n: 6, ring: true, len: 9, speed: 12 } })], { minRange: 3.5, cd: 7, w: 1 }),
      A('Winter Chain', 2.9, [
        S('swing', .32, .12, .05, 56, { reach: 2.9, arc: 160, lunge: 1.1, chill: 10 }),
        S('backswing', .2, .12, .05, 56, { reach: 2.9, arc: 160, lunge: 1.1, chill: 10 }),
        S('spin', .24, .3, .06, 64, { reach: 3.1, arc: 360, chill: 12 }),
        S('thrust', .4, .2, .9, 90, { reach: 2.9, arc: 50, lunge: 4, burst: true, kact: 'needle', wave: { n: 3, len: 11, speed: 14, spread: .3 } }),
      ], { w: 1.1 }),
    ],
  },

  // The Winter Court: two warlords at once. When one falls the other grieves: it heals, rages, and takes up
  // the fallen one's arts.
  'rat-king': {
    model: 'ratman-packleader', name: 'Morrowgnaw, the Rat King', regalia: 'crown', tint: 0xe8eeff, scale: 1.72, radius: .95, hp: 3300, ki: 420, poise: 80, walk: 2, run: 5.4, glimmer: 13000, voice: 'growl', pitch: .5,
    boss: true, duo: true, track: 3.6, aggro: .9, roarHazard: 'frost', armor: { phase2: true, reduce: .35 }, phase2Line: 'The Rat King rimes over with grief',
    attacks: [
      A('Crown Cleave', 3.9, [S('swing', .7, .16, .12, 90, { reach: 3.9, arc: 150, lunge: 1.4 }), S('backswing', .45, .16, .9, 90, { reach: 3.9, arc: 150, lunge: 1.4 })]),
      A('Gnashing Chain', 3.7, [
        S('swing', .5, .14, .08, 72, { reach: 3.7, arc: 140, lunge: 1.2 }),
        S('backswing', .32, .14, .08, 72, { reach: 3.7, arc: 140, lunge: 1.2 }),
        S('overhead', .5, .18, 1.1, 104, { reach: 3.6, arc: 60, lunge: 1.5, aoe: 1.9, shake: .6 }),
      ], { w: .8 }),
      A('Tail Whirl', 3.8, [S('spin', .6, .35, .9, 80, { reach: 3.8, arc: 360 })], { cond: 'behind', w: 2, cd: 4 }),
      A('Royal Charge', 11, [S('thrust', .85, .35, 1.1, 120, { reach: 3, arc: 80, lunge: 9, burst: true, hyper: true })], { minRange: 5, cd: 7, w: .8 }),
      A('Throne Breaker', 13, [S('leap', .75, .8, 1.2, 130, { reach: 0, aoe: 3.8, burst: true, hyper: true, shake: 1.1 })], { minRange: 6, cd: 9, w: .7 }),
    ],
    phase2: [
      A('Grief', 30, [S('roar', 1.3, .6, .6, 0, { hyper: true })], { once: true }),
      A('Glacier Slam', 14, [S('overhead', .9, .2, 1.1, 110, { reach: 3.6, arc: 70, lunge: 1.4, aoe: 2.2, shake: .7, chill: 20, wave: { n: 3, len: 16, speed: 13, spread: .4 } })], { cd: 5, w: 1.2 }),
      A('Icicle Roar', 18, [S('roar', 1, .3, .8, 64, { proj: { kind: 'icicle', flight: 1.2, count: 6, spread: 5 }, hyper: true })], { minRange: 3, cd: 9, w: .8 }),
    ],
  },
  'frost-hexer': {
    model: 'goblin-shaman', name: 'Hrimwen, the Frost-Hexer', regalia: 'icecrown', tint: 0xdce8ff, scale: 1.85, radius: .8, hp: 2700, ki: 340, poise: 60, walk: 1.8, run: 4.6, glimmer: 13000, voice: 'growl', pitch: .85,
    boss: true, duo: true, track: 4, aggro: .9, style: 'ranged', prefer: [6, 11], roarHazard: 'frost', phase2Line: 'The Frost-Hexer calls down the winter',
    attacks: [
      A('Frost Shards', 18, [S('cast', .8, .15, .6, 40, { proj: { kind: 'shard', speed: 17, count: 5, chill: 20 } })], { minRange: 3.5, w: 1.1 }),
      A('Rime Wave', 18, [S('cast', 1.0, .2, .8, 70, { reach: 0, wave: { n: 3, len: 18, speed: 13, spread: .35 } })], { minRange: 4, cd: 5 }),
      A('Icicle Rain', 18, [S('cast', .9, .15, .8, 60, { proj: { kind: 'icicle', flight: 1.1, count: 5, spread: 4.5 } })], { minRange: 3, cd: 7, w: .9 }),
      A('Blink', 5, [S('cast', .5, .1, .5, 0, { blink: true })], { cond: 'close', cd: 6, w: 1.5 }),
      A('Frost Nova', 5.5, [S('cast', 1.1, .3, 1.0, 95, { reach: 0, aoe: 5, burst: true, hyper: true, shake: .8, frost: 3.5, chill: 40 })], { cd: 8 }),
      A('Staff Flurry', 3.4, [
        S('swing', .55, .14, .1, 58, { reach: 3.4, arc: 140, lunge: 1.2, chill: 12 }),
        S('backswing', .35, .14, .9, 58, { reach: 3.4, arc: 140, lunge: 1.2, chill: 12 }),
      ], { w: .6 }),
    ],
    phase2: [
      A('Winter Wrath', 30, [S('roar', 1.3, .6, .6, 0, { hyper: true })], { once: true }),
      A('Starburst', 20, [S('cast', 1.2, .3, 1, 80, { reach: 0, wave: { n: 8, ring: true, len: 16, speed: 12 } })], { cd: 7, w: 1.2 }),
      A('Blizzard Ring', 18, [S('cast', 1.0, .2, .9, 40, { proj: { kind: 'shard', count: 14, speed: 9, ring: true, chill: 18 } })], { cd: 6, w: 1 }),
    ],
  },
});

// ---- Revenants (side-mission duels): fae knights who fell before you, their echoes still fighting with the
// weapons they carried, stroke for stroke as you would (their strikes are the player's own animations).
const revenant = (name, weapon, look, hp, moves, o = {}) => ({
  knight: look, weapon, name, scale: 1.12, radius: .5, hp, ki: 300, poise: 55, walk: 2.4, run: 6.2, glimmer: Math.round(hp * 2.4), voice: 'growl', pitch: 1.15,
  elite: true, track: 7, aggro: .95, evasive: .45, parry: .3, glow: .12, phase2At: .5, phase2Line: `${name.split(',')[0]} burns brighter`, roarHazard: 'none',
  attacks: moves, phase2: [A('Revenant\'s Wrath', 30, [S('roar', 1.1, .5, .5, 0, { hyper: true })], { once: true })], ...o,
});
const RV = { dark: 0x141018, visor: 0xb07aff, glow: 0x8a5ad8, trail: 0xc8a0ff };
Object.assign(TYPES, {
  'revenant-thornwake': revenant('Sir Aldric Thornwake, Revenant', 'great', { ...RV, steel: 0x6c7a58, cloth: 0x2e4a2a, trim: 0x9aa860, blade: 0xd8e4ff, wing: 0x9fd89a }, 1700, [
    A('Iron Tide', 3.2, [S('swing', .5, .16, .08, 62, { reach: 3.2, arc: 190, lunge: 1, kact: 'wb_sweep' }), S('swing', .34, .16, .08, 62, { reach: 3.2, arc: 190, lunge: 1, kact: 'wb_return' }), S('spin', .36, .4, .8, 70, { reach: 3.3, arc: 360, kact: 'wb_turn' })]),
    A('Falling Edge', 3.2, [S('overhead', .55, .16, .9, 88, { reach: 3.2, arc: 80, lunge: 1.2, kact: 'wb_hfall' })], { w: .8 }),
    A('Striding Thrust', 8, [S('thrust', .6, .3, .9, 80, { reach: 3.2, arc: 50, lunge: 6, burst: true, kact: 'wb_rush' })], { minRange: 4, cd: 6, w: .8 }),
    A('Leaping Cleave', 10, [S('leap', .6, .62, 1, 100, { reach: 0, aoe: 2.8, burst: true, hyper: true, shake: .8, kact: 'wb_hleap' })], { minRange: 4.5, cd: 7, w: .7 }),
  ]),
  'revenant-hollowmoon': revenant('Sister Hollowmoon, Revenant', 'katana', { ...RV, steel: 0x8a8a9a, cloth: 0x2a2a3a, trim: 0xbfe6ff, blade: 0xe8f4ff, wing: 0xbfd8ff }, 2400, [
    A('Draw-cut', 2.9, [S('swing', .42, .12, .7, 70, { reach: 2.9, arc: 170, lunge: 1.2, kact: 'kt_draw' })]),
    A('Still Water', 2.8, [S('swing', .4, .14, .06, 58, { reach: 2.8, arc: 160, lunge: 1, kact: 'kt_cut' }), S('swing', .26, .14, .06, 58, { reach: 2.8, arc: 160, lunge: 1, kact: 'kt_back' }), S('thrust', .3, .18, .8, 70, { reach: 3, arc: 50, lunge: 2, kact: 'kt_thrust' })]),
    A('Passing Draw', 9, [S('thrust', .5, .28, .9, 96, { reach: 2.9, arc: 60, lunge: 7, burst: true, kact: 'kt_dash' })], { minRange: 4, cd: 6, w: .9 }),
    A('Rising Frost', 3, [S('swing', .45, .16, .8, 74, { reach: 2.8, arc: 140, kact: 'kt_rdraw' })], { w: .7 }),
  ], { parry: .45 }),
  'revenant-emberlight': revenant('Brother Emberlight, Revenant', 'hammer', { ...RV, steel: 0x9a6a48, cloth: 0x6a2a1a, trim: 0xe08a40, blade: 0xffcf8a, wing: 0xffb070, glow: 0xff8a40, trail: 0xffb070 }, 3200, [
    A('Anvil Rhythm', 3, [S('swing', .55, .16, .08, 78, { reach: 3, arc: 190, lunge: .8, kact: 'h_side' }), S('swing', .4, .16, .08, 78, { reach: 3, arc: 190, lunge: .8, kact: 'h_back' }), S('overhead', .5, .16, 1, 104, { reach: 2.9, arc: 90, aoe: 2.2, kact: 'h_over' })]),
    A('Great Turn', 3.2, [S('spin', .5, .5, .9, 86, { reach: 3.2, arc: 360, kact: 'h_spin' })], { w: .8 }),
    A('Haft Charge', 8, [S('thrust', .45, .35, .8, 70, { reach: 2.4, arc: 120, lunge: 6, kact: 'h_charge' })], { minRange: 4, cd: 5 }),
    A('Mountain Leap', 11, [S('leap', .7, .7, 1.1, 120, { reach: 0, aoe: 3.2, burst: true, hyper: true, shake: .9, kact: 'h_hleap', fire: 1 })], { minRange: 4.5, cd: 7, w: .8 }),
  ], { parry: .15, poise: 80, roarHazard: 'fire' }),
  'revenant-ysolde': revenant('Dame Ysolde of the Wane, Revenant', 'rapier', { ...RV, steel: 0xdfe6f4, cloth: 0x6a4a9a, trim: 0xe8e8ff, blade: 0xe8e8ff, wing: 0xd8c8ff }, 3400, [
    A('Lunge', 3.2, [S('thrust', .4, .14, .6, 72, { reach: 3.2, arc: 40, lunge: 1.8, kact: 'rp_lunge' })]),
    A('Feint and Lunge', 3.2, [S('thrust', .3, .1, .05, 44, { reach: 3, arc: 40, lunge: .8, kact: 'rp_lunge' }), S('thrust', .22, .14, .7, 76, { reach: 3.2, arc: 40, lunge: 1.8, kact: 'rp_lunge' })]),
    A('Parry and Cut', 2.6, [S('swing', .34, .12, .6, 58, { reach: 2.7, arc: 150, lunge: .8, kact: 'rp_cut' })], { w: .8 }),
    A('Flèche', 9, [S('thrust', .5, .3, .9, 96, { reach: 3.2, arc: 50, lunge: 8, burst: true, kact: 'rp_fleche' })], { minRange: 4, cd: 5, w: .9 }),
  ], { parry: .55, evasive: .6 }),
  'revenant-lanternless': revenant('The Lanternless Knight, Revenant', 'fangs', { ...RV, steel: 0x2a2a30, cloth: 0x0e0e14, trim: 0xd6ac52, blade: 0xffe8c0, wing: 0xffd36a, visor: 0xffd36a, glow: 0xffb040, trail: 0xffd36a }, 4600, [
    A('Swallow\'s Dance', 2.6, [S('swing', .32, .1, .04, 44, { reach: 2.5, arc: 150, lunge: .8, kact: 'f_slash1' }), S('swing', .18, .1, .04, 44, { reach: 2.5, arc: 150, lunge: .8, kact: 'f_slash2' }), S('swing', .2, .12, .05, 50, { reach: 2.6, arc: 120, lunge: .8, kact: 'f_cross' }), S('spin', .22, .4, .8, 56, { reach: 2.7, arc: 360, kact: 'f_spin' })]),
    A('Whirlwind', 3.2, [S('spin', .45, .6, .9, 58, { reach: 2.9, arc: 360, lunge: 2, kact: 'f_whirl' })], { w: .8 }),
    A('Viper Dash', 10, [S('thrust', .5, .35, .9, 86, { reach: 2.6, arc: 140, lunge: 8, burst: true, kact: 'f_viper' })], { minRange: 4, cd: 5, w: .9 }),
    A('Crossfall', 10, [S('leap', .6, .55, 1, 104, { reach: 0, aoe: 2.4, burst: true, hyper: true, shake: .7, kact: 'f_xfall' })], { minRange: 4.5, cd: 7, w: .7 }),
  ], { parry: .4, evasive: .6 }),
});

export const MODEL_IDS = [...new Set(Object.keys(TYPES))];

// ---------------------------------------------------------------- knights, regalia and rime
// A knight-shaped foe is the fae knight's own model in another livery. Its many materials answer to the
// one-material interface the enemy code expects (flash, glow, fade) through this proxy.
class MatSet {
  constructor(body, fade) {
    this.body = body; this.all = fade;
    for (const m of fade) m.userData.baseOpacity ??= m.opacity;
    this.emissive = { setHex: h => body.forEach(m => m.emissive.setHex(h)), setRGB: (r, g, b) => body.forEach(m => m.emissive.setRGB(r, g, b)), copy: c => body.forEach(m => m.emissive.copy(c)) };
    this.color = { setHex: () => {} };
  }
  get opacity() { return this._o ?? 1; }
  set opacity(v) { this._o = v; for (const m of this.all) m.opacity = v * m.userData.baseOpacity; }
  get transparent() { return !!this._t; }
  set transparent(v) { this._t = v; for (const m of this.all) m.transparent = v || m.userData.baseOpacity < 1; }
  get emissiveIntensity() { return this.body[0].emissiveIntensity; }
  set emissiveIntensity(v) { for (const m of this.body) m.emissiveIntensity = v; }
  dispose() { for (const m of this.all) m.dispose(); }
}

function knightModel(T) {
  const k = buildKnight(), M = k.mats, L = T.knight;
  M.steel.color.setHex(L.steel); M.steel.metalness = .9; M.steel.roughness = .22;
  M.dark.color.setHex(L.dark); M.cloth.color.setHex(L.cloth); M.trim.color.setHex(L.trim); M.leather.color.setHex(L.dark);
  M.visor.emissive.setHex(L.visor); M.blade.color.setHex(L.blade); M.blade.emissive.setHex(L.blade); M.blade.emissiveIntensity = .5;
  M.wing.color.setHex(L.wing);
  k.setWeapon(T.weapon || 'sword', [T.weapon || 'sword']);
  k.glow.visible = false;
  k.root.traverse(o => { if (o.isSprite) o.visible = false; });
  k.root.scale.setScalar(T.scale);
  const grp = new THREE.Group(); grp.add(k.root);
  const body = [M.steel, M.dark, M.cloth, M.trim, M.leather];
  grp.userData = { mesh: { material: new MatSet(body, [...body, M.visor, M.blade, M.wing]) }, arms: [], legs: [], bones: {}, fore: [], shins: [], knight: k, model3d: 'knight' };
  return grp;
}

// Where a crown sits: the top of the head, found from the vertices the head bone carries (cached per model).
const HEAD_TOPS = new Map();
function headTop(model) {
  const id = model.userData.model3d;
  if (HEAD_TOPS.has(id)) return HEAD_TOPS.get(id);
  const geo = model.userData.mesh.geometry, P = geo.attributes.position, SI = geo.attributes.skinIndex, SW = geo.attributes.skinWeight;
  const head = [];
  for (let i = 0; i < P.count; i++) {
    for (let c = 0; c < 4; c++) if (SI.getComponent(i, c) === 6 && SW.getComponent(i, c) > .5) { head.push(i); break; }
  }
  let y0 = Infinity, y1 = -Infinity;
  for (const i of head) { y0 = Math.min(y0, P.getY(i)); y1 = Math.max(y1, P.getY(i)); }
  const band = head.filter(i => P.getY(i) > y1 - (y1 - y0) * .35);
  let cx = 0, cz = 0; for (const i of band) { cx += P.getX(i); cz += P.getZ(i); }
  cx /= band.length || 1; cz /= band.length || 1;
  let r = 0; for (const i of band) r = Math.max(r, Math.hypot(P.getX(i) - cx, P.getZ(i) - cz));
  const B = model.userData.bones, hx = B.chest.position.x + B.head.position.x, hy = B.chest.position.y + B.head.position.y, hz = B.chest.position.z + B.head.position.z;
  const top = { x: cx - hx, y: y1 - (y1 - y0) * .16 - hy, z: cz - hz, r: clamp(r * .62, .07, .2) };
  HEAD_TOPS.set(id, top);
  return top;
}

// Warlords wear something of their own: a crown, horns, a halo. Built in model units on the head bone.
function regalia(kind, top) {
  const g = new THREE.Group(), r = top.r, mats = [];
  const mat = o => { const m = new THREE.MeshStandardMaterial({ roughness: .35, ...o }); mats.push(m); return m; };
  const add = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  if (kind === 'crown' || kind === 'bonecrown') {
    const bone = kind === 'bonecrown';
    const band = bone ? mat({ color: 0xd8ccb0, roughness: .7, emissive: 0x2a2418, emissiveIntensity: .5 }) : mat({ color: 0xe4e8f2, metalness: .55, roughness: .3, emissive: 0x5a6a90, emissiveIntensity: .45 });
    add(new THREE.CylinderGeometry(r, r * 1.08, r * .45, 16, 1, true), band).material.side = THREE.DoubleSide;
    const gem = mat({ color: 0x9fd8ff, emissive: 0x4fa8ff, emissiveIntensity: 1.2, roughness: .1 });
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU, h = r * (bone ? .7 + (i % 2) * .35 : i % 2 ? .6 : 1);
      add(new THREE.ConeGeometry(r * (bone ? .12 : .16), h, bone ? 4 : 5), band, Math.sin(a) * r, r * .2 + h / 2, Math.cos(a) * r).rotation.set(Math.cos(a) * .18, 0, -Math.sin(a) * .18);
      if (!bone && i % 2 === 0) add(new THREE.OctahedronGeometry(r * .11), gem, Math.sin(a) * r * 1.07, 0, Math.cos(a) * r * 1.07);
    }
  } else if (kind === 'icecrown') {
    const ice = mat({ color: 0xcfeaff, emissive: 0x6fc8ff, emissiveIntensity: .9, roughness: .08, metalness: .2, transparent: true, opacity: .9, flatShading: true });
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU, h = r * (1.4 + Math.abs(Math.sin(a * 1.5 + 1)) * 1.8) * (Math.cos(a) > .5 ? 1.25 : .85);
      const o = add(new THREE.OctahedronGeometry(1, 0), ice, Math.sin(a) * r, r * .1 + h * .45, Math.cos(a) * r);
      o.scale.set(r * .16, h * .5, r * .16); o.rotation.set(Math.cos(a) * .3, 0, -Math.sin(a) * .3);
    }
    add(new THREE.TorusGeometry(r * 1.02, r * .07, 6, 20), ice, 0, 0, 0).rotation.x = Math.PI / 2;
  } else if (kind === 'horns') {
    const iron = mat({ color: 0x3a3430, metalness: .5, roughness: .5, emissive: 0x2a1008, emissiveIntensity: .6 }), ember = mat({ color: 0xff7030, emissive: 0xff5010, emissiveIntensity: 1.4 });
    add(new THREE.SphereGeometry(r * 1.05, 16, 8, 0, TAU, 0, Math.PI / 2), iron, 0, -r * .15, 0);
    for (const sx of [-1, 1]) {
      const horn = new THREE.TorusGeometry(r * .9, r * .16, 6, 12, Math.PI * .75);
      const o = add(horn, iron, sx * r * .95, r * .1, 0); o.rotation.set(0, sx > 0 ? 0 : Math.PI, Math.PI * .1);
      add(new THREE.ConeGeometry(r * .15, r * .5, 5), ember, sx * r * 1.75, r * .95, 0).rotation.z = -sx * .5;
    }
  } else if (kind === 'circlet') {
    // Seer-crystals that orbit above the brow.
    const gem = mat({ color: 0xc9b4ff, emissive: 0xa070ff, emissiveIntensity: 1.6, roughness: .1, flatShading: true });
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; add(new THREE.OctahedronGeometry(r * (i % 2 ? .16 : .24), 0), gem, Math.sin(a) * r * 1.35, r * (.5 + (i % 2) * .15), Math.cos(a) * r * 1.35).scale.y = 1.8; }
    g.userData.spin = .8;
  } else if (kind === 'halo') {
    const moon = mat({ color: 0xdfe4ff, emissive: 0xa8b4ff, emissiveIntensity: 1.5, roughness: .2 });
    const o = add(new THREE.TorusGeometry(r * 1.9, r * .16, 8, 32, Math.PI * 1.35), moon, 0, r * 1.4, -r * .6);
    o.rotation.set(-.35, 0, Math.PI * .83);
  }
  g.position.set(top.x, top.y, top.z);
  g.userData.mats = mats;
  return g;
}

// A shell of rime over the whole body: the same skinned mesh, pushed out along its normals.
function rimeShell(model) {
  const skin = model.userData.mesh;
  const m = new THREE.MeshStandardMaterial({ color: 0xcfeaff, emissive: 0x4a8ad0, emissiveIntensity: .7, roughness: .08, metalness: .3, transparent: true, opacity: .42, depthWrite: false, flatShading: true });
  m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normal * .045;'); };
  const shell = new THREE.SkinnedMesh(skin.geometry, m);
  shell.scale.copy(skin.scale); shell.frustumCulled = false;
  shell.bind(skin.skeleton, skin.bindMatrix);
  shell.visible = false;
  model.add(shell);
  return shell;
}

// Knight-shaped foes play the knight's own actions. Each enemy step names one, and the hit frame
// (the second number) is lined up with the end of the windup.
const KNIGHT_ACT = {
  swing: ['light1', .22], backswing: ['light2', .2], overhead: ['light3', .33], thrust: ['needle', .26], spin: ['light4', .3],
  leap: ['skyfall', .56], cast: ['counter', .12], roar: ['shift', .38], throw: ['light2', .2], shoot: ['light1', .2],
  heavy: ['heavy', .55], flashcut: ['flashcut', .12], dash: ['dash', .2], light4: ['light4', .3], skyfall: ['skyfall', .56],
};

// Pose channels, all driven by springs. Whole body: pitch/twist/roll/sq/hop/fwd/spin on the lean group.
// Bones: chest (cPi, cTw), head (hPi, hYaw: where it looks, relative to the body), shoulders (aL/aR forward,
// aLz/aRz out), elbows (eL/eR, negative bends), stance legs (sL/sR thigh, kL/kR knee bend).
const POSE0 = { pitch: 0, twist: 0, roll: 0, aL: 0, aR: 0, aLz: 0, aRz: 0, sq: 1, hop: 0, fwd: 0, spin: 0, cPi: 0, cTw: 0, hPi: 0, hYaw: 0, eL: 0, eR: 0, sL: 0, sR: 0, kL: 0, kR: 0 };

// ---------------------------------------------------------------- projectiles & hazards
const _v = new THREE.Vector3();

export class Projectiles {
  constructor(G) {
    this.G = G; this.list = []; this.hazards = []; this.waves = [];
    const M = THREE;
    this.geo = {
      arrow: new M.CylinderGeometry(.015, .015, .8, 4).rotateX(Math.PI / 2),
      stone: new M.IcosahedronGeometry(.1, 0),
      bomb: new M.SphereGeometry(.16, 10, 8),
      vial: new M.CapsuleGeometry(.06, .1, 4, 8),
      snare: new M.TorusGeometry(.2, .03, 5, 12),
      knife: new M.ConeGeometry(.04, .42, 4).rotateX(Math.PI / 2),
      rock: new M.DodecahedronGeometry(.32, 0),
      shard: new M.OctahedronGeometry(.1, 0).scale(.7, .7, 3.4),
      icicle: new M.ConeGeometry(.17, 1.1, 5).rotateX(Math.PI),
    };
    this.mat = {
      arrow: new M.MeshStandardMaterial({ color: 0x6b5238, roughness: .8 }),
      stone: new M.MeshStandardMaterial({ color: 0x77736c, roughness: 1 }),
      bomb: new M.MeshStandardMaterial({ color: 0x1c1c1c, roughness: .5, metalness: .3 }),
      vial: new M.MeshStandardMaterial({ color: 0x8fe040, emissive: 0x4a8a10, emissiveIntensity: 1.2, transparent: true, opacity: .9 }),
      snare: new M.MeshStandardMaterial({ color: 0x8a6a3c, roughness: .9 }),
      knife: new M.MeshStandardMaterial({ color: 0xc8d0e0, metalness: .9, roughness: .25, emissive: 0x3a3a60, emissiveIntensity: .6 }),
      rock: new M.MeshStandardMaterial({ color: 0x4f4a55, roughness: 1, flatShading: true }),
      shard: new M.MeshStandardMaterial({ color: 0xdff4ff, emissive: 0x6fc8ff, emissiveIntensity: 1.1, roughness: .1, flatShading: true }),
      icicle: new M.MeshStandardMaterial({ color: 0xcfeaff, emissive: 0x4a8ad0, emissiveIntensity: .6, roughness: .1, metalness: .2, flatShading: true }),
    };
    this.mat.frostbomb = new M.MeshStandardMaterial({ color: 0xbfe0ff, emissive: 0x3a80c0, emissiveIntensity: .8, roughness: .3 });
  }

  spawn(kind, from, e, step) {
    const G = this.G, p = G.player, fx = G.fx;
    const origin = new THREE.Vector3(from.x, from.y, from.z);
    const aim = new THREE.Vector3(p.pos.x, 1.1, p.pos.z);
    const make = (k, vel, extra = {}) => {
      let obj;
      if (k === 'orb') {
        obj = fx.flash(origin, 0xb060ff, 1.1, 99, false); obj.material.depthTest = true;
      } else {
        obj = new THREE.Mesh(this.geo[k], this.mat[k]); obj.castShadow = true;
        G.scene.add(obj);
      }
      obj.position.copy(origin);
      if (k === 'bomb' && step.proj.frost) obj.material = this.mat.frostbomb;
      const pr = { kind: k, obj, vel, t: 0, dmg: step.dmg * e.dmgMul, from: e, radius: k === 'orb' ? .35 : .18, chill: step.proj.chill || 0, ...extra };
      this.list.push(pr);
      return pr;
    };
    if (kind === 'arrow' || kind === 'stone' || kind === 'snare') {
      // Lead the target a little.
      const tflight = origin.distanceTo(aim) / step.proj.speed;
      aim.x += p.vel.x * tflight * .6; aim.z += p.vel.z * tflight * .6;
      const v = aim.clone().sub(origin).normalize().multiplyScalar(step.proj.speed);
      if (kind !== 'arrow') v.y += 9.8 * .5 * tflight * .5;
      make(kind, v, { gravity: kind === 'arrow' ? 0 : 4.9, snare: kind === 'snare' ? 2.2 : 0 });
      G.audio.sfx(kind === 'arrow' ? 'arrow' : 'throw', { x: from.x, z: from.z });
    } else if (kind === 'knife' || kind === 'shard') {
      // A spread of thrown blades (or frost shards), the middle one aimed where the knight is heading. A ring flies every way.
      const n = step.proj.count || 1, tflight = origin.distanceTo(aim) / step.proj.speed, ring = step.proj.ring;
      aim.x += p.vel.x * tflight * .5; aim.z += p.vel.z * tflight * .5;
      const base = Math.atan2(aim.x - origin.x, aim.z - origin.z);
      for (let i = 0; i < n; i++) {
        const ang = ring ? base + i / n * TAU : base + (i - (n - 1) / 2) * (kind === 'shard' ? .2 : .16);
        const v = new THREE.Vector3(Math.sin(ang), ring ? 0 : (aim.y - origin.y) / Math.max(1, origin.distanceTo(aim)), Math.cos(ang)).normalize().multiplyScalar(step.proj.speed);
        make(kind, v, { gravity: 0, life: ring ? 3 : 5 });
      }
      G.audio.sfx(kind === 'shard' ? 'chill' : 'arrow', { x: from.x, z: from.z });
    } else if (kind === 'bomb' || kind === 'vial' || kind === 'rock' || kind === 'icicle') {
      // A volley scatters extra shots around the first, cutting off the easy dodge. Rocks and icicles fall from above.
      const T = step.proj.flight, n = step.proj.count || 1, spread = step.proj.spread;
      const cx = p.pos.x + p.vel.x * T * .5, cz = p.pos.z + p.vel.z * T * .5;
      for (let i = 0; i < n; i++) {
        let a = e.yaw + Math.PI / 2 + (i - 1) * 2.1 + rand(-.3, .3), r = i ? rand(2.6, 3.6) : 0;
        if (spread) { a = rand(0, TAU); r = i ? rand(1.6, spread) : 0; }
        const tx = cx + Math.sin(a) * r, tz = cz + Math.cos(a) * r, Ti = T * (1 + i * .12);
        const falls = kind === 'rock' || kind === 'icicle';
        if (falls) origin.set(tx + (kind === 'rock' ? rand(-.5, .5) : 0), 11, tz + (kind === 'rock' ? rand(-.5, .5) : 0));
        const v = new THREE.Vector3((tx - origin.x) / Ti, 0, (tz - origin.z) / Ti);
        v.y = (0 - origin.y + .5 * 9.8 * Ti * Ti) / Ti;
        const frost = step.proj.frost || 0;
        const pr = make(kind, v, { gravity: 9.8, target: { x: tx, z: tz }, fire: step.proj.fire || 0, frost, chill: frost ? 35 : kind === 'icicle' ? 30 : 0 });
        const col = kind === 'bomb' ? (frost ? 0x8fd0ff : 0xff5020) : kind === 'rock' ? 0xc8b090 : kind === 'icicle' ? 0xbfe6ff : 0x8fe040;
        pr.warn = fx.telegraph({ x: tx, z: tz }, kind === 'bomb' ? 2.4 : kind === 'rock' ? 1.7 : kind === 'icicle' ? 1.5 : 2, Ti, col);
      }
      const falls = kind === 'rock' || kind === 'icicle';
      G.audio.sfx(falls ? (kind === 'rock' ? 'slam' : 'chill') : 'throw', { x: falls ? p.pos.x : from.x, z: falls ? p.pos.z : from.z, vol: falls ? .5 : 1 });
    } else if (kind === 'orb') {
      const n = step.proj.count || 1;
      const ring = step.proj.ring;
      for (let i = 0; i < n; i++) {
        const ang = ring ? e.yaw + i / n * TAU : e.yaw + (i - (n - 1) / 2) * .45;
        const v = new THREE.Vector3(Math.sin(ang), ring ? 0 : .1, Math.cos(ang)).multiplyScalar(step.proj.speed);
        make('orb', v, { homing: ring ? .25 : 1.6, life: ring ? 5.5 : 4.5 });
      }
      G.audio.sfx('magic', { x: from.x, z: from.z });
    }
  }

  // Lingering ground effects: poison clouds and pools, fire, or freezing rime (poison is then chill per second).
  // Static ones belong to the level.
  hazard(x, z, r, dur, poison = 55, kind = 'poison', stat = false) {
    this.hazards.push({ x, z, r, t: 0, dur, poison, kind, stat });
    if (!stat) this.G.audio.sfx(kind === 'fire' ? 'explode' : kind === 'frost' ? 'chill' : 'poison', { x, z, vol: kind === 'fire' ? .4 : 1 });
  }

  // Travelling ground waves: a line of ice spikes racing out from the attacker, each wave striking once.
  // Jump over them, dash through, step aside, or take them on the guard.
  wave(e, s) {
    const W = s.wave, G = this.G, p = G.player;
    const off = W.at ?? Math.min(2, (s.reach || 1) * .6);
    const x0 = e.pos.x + Math.sin(e.yaw) * off, z0 = e.pos.z + Math.cos(e.yaw) * off;
    const base = W.ring ? e.yaw : yawTo(x0, z0, p.pos.x, p.pos.z), n = W.n || 1;
    for (let i = 0; i < n; i++) {
      const a = W.ring ? base + (i + .5) / n * TAU : base + (i - (n - 1) / 2) * (W.spread ?? .32);
      this.waves.push({ x: x0, z: z0, dx: Math.sin(a), dz: Math.cos(a), d: 0, next: .9, len: W.len || 14, speed: W.speed || 14, r: W.r || 1.05,
        dmg: s.dmg * e.dmgMul, chill: W.chill ?? 24, from: e, hit: false, color: W.color || 0xbfe6ff, gap: W.gap || 1.25, n: 0 });
    }
    G.audio.sfx('ice', { x: x0, z: z0 });
  }

  update(dt) {
    const G = this.G, p = G.player, fx = G.fx;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const pr = this.list[i], o = pr.obj;
      pr.t += dt;
      let dead = false;
      if (pr.kill) dead = true;
      // Orbs home on the knight, or on their caster once deflected back.
      const tgt = pr.reflected ? pr.from : p;
      if (pr.homing && tgt.alive) {
        _v.set(tgt.pos.x - o.position.x, (pr.reflected ? tgt.height * .55 : 1.1) - o.position.y, tgt.pos.z - o.position.z).normalize().multiplyScalar(pr.vel.length());
        pr.vel.lerp(_v, 1 - Math.exp(-pr.homing * dt));
      }
      if (pr.gravity) pr.vel.y -= pr.gravity * dt;
      const step = pr.vel.length() * dt;
      _v.copy(pr.vel).normalize();
      const wall = pr.kind === 'rock' || pr.kind === 'icicle' ? step : G.world.raycast(o.position, _v, step);   // rocks fall past the cliff tops
      o.position.addScaledVector(pr.vel, Math.min(1, wall / Math.max(step, 1e-6)) * dt);
      if (pr.kind === 'arrow' || pr.kind === 'knife' || pr.kind === 'shard') o.lookAt(o.position.x + pr.vel.x, o.position.y + pr.vel.y, o.position.z + pr.vel.z);
      else if (pr.kind === 'snare') o.rotation.y += dt * 22;
      else if (pr.kind !== 'orb' && pr.kind !== 'icicle') { o.rotation.x += dt * 8; o.rotation.z += dt * 5; }
      if (pr.kind === 'shard' || pr.kind === 'icicle' || pr.frost) fx.add.emit({ x: o.position.x, y: o.position.y, z: o.position.z, life: .3, size: .1, color: fx.col(0xcfeaff), alpha: .7 });
      if (pr.kind === 'orb') fx.motes(o.position, pr.reflected ? 0xbff8ff : 0xb060ff, 1, .1, .2, .12, .5);
      if (pr.kind === 'arrow' || pr.kind === 'stone') fx.add.emit({ x: o.position.x, y: o.position.y, z: o.position.z, life: .22, size: pr.kind === 'arrow' ? .09 : .12, color: fx.col(0xffe6b0), alpha: .8 });
      if (pr.kind === 'bomb') fx.motes({ x: o.position.x, y: o.position.y + .18, z: o.position.z }, 0xffa040, 1, .02, .5, .08, .3);

      const hitWall = wall < step - 1e-4;
      if (hitWall) dead = true;
      if (pr.kind === 'bomb' || pr.kind === 'vial' || pr.kind === 'rock' || pr.kind === 'icicle') {
        if ((o.position.y <= .1 && pr.vel.y < 0) || (hitWall && pr.kind !== 'rock' && pr.kind !== 'icicle')) {
          dead = true;
          if (pr.kind === 'rock' || pr.kind === 'icicle') {
            const ice = pr.kind === 'icicle', R = ice ? 1.5 : 1.7;
            if (ice) { fx.shatter({ x: o.position.x, y: .3, z: o.position.z }, 22); fx.spikes(o.position, .9, 0xcfeaff, 3, .9); fx.ring(o.position, 0xbfe6ff, 1.7, .3); }
            else { fx.dust(o.position, 14); fx.ring(o.position, 0xc8b090, 1.9, .3); }
            G.audio.sfx(ice ? 'ice' : 'slam', { x: o.position.x, z: o.position.z, vol: .7 }); G.cam.shake(.25, o.position);
            if (Math.hypot(p.pos.x - o.position.x, p.pos.z - o.position.z) < R + p.radius) p.receiveHit({ dmg: pr.dmg, from: pr.from, dirYaw: yawTo(p.pos.x, p.pos.z, o.position.x, o.position.z), aoe: true, heavy: true, chill: pr.chill, ranged: true });
          } else if (pr.kind === 'bomb' && pr.frost) {
            // A hail pot: a burst of rime that leaves the ground freezing.
            fx.shatter({ x: o.position.x, y: .4, z: o.position.z }, 30); fx.ring(o.position, 0xbfe6ff, 2.4, .35); fx.spikes(o.position, .8, 0xcfeaff, 5, 1);
            G.audio.sfx('shatter', { x: o.position.x, z: o.position.z, vol: .6 }); G.cam.shake(.25, o.position);
            if (Math.hypot(p.pos.x - o.position.x, p.pos.z - o.position.z) < 2.4 + p.radius) p.receiveHit({ dmg: pr.dmg, from: pr.from, dirYaw: yawTo(p.pos.x, p.pos.z, o.position.x, o.position.z), aoe: true, heavy: true, chill: pr.chill, ranged: true });
            this.hazard(o.position.x, o.position.z, pr.frost, 5, 32, 'frost');
          } else if (pr.kind === 'bomb') {
            fx.explosion(o.position, 2.4); G.audio.sfx('explode', { x: o.position.x, z: o.position.z }); G.cam.shake(.35, o.position);
            G.world.smash(o.position.x, o.position.z, 2.2);
            const d = Math.hypot(p.pos.x - o.position.x, p.pos.z - o.position.z);
            if (d < 2.4 + p.radius) p.receiveHit({ dmg: pr.dmg, from: pr.from, dirYaw: yawTo(p.pos.x, p.pos.z, o.position.x, o.position.z), aoe: true, heavy: true });
            if (pr.fire) this.hazard(o.position.x, o.position.z, pr.fire, 3, 30, 'fire');
          } else {
            this.hazard(o.position.x, o.position.z, 2.1, 5);
            fx.ring(o.position, 0x8fe040, 2.1, .4);
          }
        }
      } else if (pr.reflected) {
        const e = pr.from;
        if (!e.alive) dead = true;
        else if (Math.hypot(e.pos.x - o.position.x, e.pos.z - o.position.z) < e.radius + .5 && o.position.y < e.height + .3) {
          e.takeHit({ dmg: pr.dmg * 2.2, ki: 45, poise: 12, dir: yawTo(o.position.x, o.position.z, e.pos.x, e.pos.z) });
          fx.spark(o.position, { x: pr.vel.x / 12, z: pr.vel.z / 12 }, 24, 0xbff8ff, 7);
          fx.ring(e.pos, 0xbff8ff, 1.8, .3, 1);
          G.audio.sfx('magic', { x: e.pos.x, z: e.pos.z });
          dead = true;
        }
      } else if (p.alive) {
        const dx = p.pos.x - o.position.x, dz = p.pos.z - o.position.z;
        if (Math.hypot(dx, dz) < p.radius + pr.radius && o.position.y > 0 && o.position.y < 2) {
          const res = p.receiveHit({ dmg: pr.dmg, from: pr.from, projectile: true, snare: pr.snare, chill: pr.chill, dirYaw: yawTo(p.pos.x, p.pos.z, o.position.x, o.position.z) });
          // A deflected hex orb flies back at whoever cast it.
          if (res === 'deflected' && pr.kind === 'orb' && pr.from?.alive) {
            pr.reflected = true; pr.t = 0; pr.life = 3; pr.homing = 5;
            _v.set(pr.from.pos.x - o.position.x, 0, pr.from.pos.z - o.position.z).normalize().multiplyScalar(13);
            pr.vel.copy(_v); o.material.color.setHex(0xbff8ff);
            G.hud.toast('Reflected', 'pulse');
          } else if (res !== 'miss') dead = true;
        }
      }
      if (o.position.y < -1 || pr.t > (pr.life || 5)) dead = true;
      if (dead) {
        if (pr.warn) pr.warn.dead = true;
        if (pr.kind === 'orb') { const it = G.fx.items.find(x => x.obj === o); if (it) it.dead = true; }
        else G.scene.remove(o);
        this.list.splice(i, 1);
      }
    }
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i]; h.t += dt;
      const near = Math.hypot(p.pos.x - h.x, p.pos.z - h.z);
      if (h.kind === 'fire') {
        if (Math.random() < dt * 30 * Math.min(1, h.r)) fx.fire(h, h.r);
        if (p.alive && near < h.r && !p.iframes) { p.burnT = (p.burnT || 0) + dt; if (p.burnT > .5) { p.burnT = 0; p.burn(h.poison * .5); } }
      } else if (h.kind === 'frost') {
        if ((!h.stat || near < 30) && Math.random() < dt * (h.stat ? 7 : 16) * Math.min(2, h.r / 2)) fx.frost(h, h.r);
        if (p.alive && near < h.r && p.pos.y < .5) p.addChill(h.poison * dt);
      } else {
        if ((!h.stat || near < 30) && Math.random() < dt * (h.stat ? 5 : 14) * Math.min(2, h.r / 2)) fx.poisonCloud(h, h.r);
        if (p.alive && near < h.r) p.addPoison(h.poison * dt);
      }
      if (h.t > h.dur) this.hazards.splice(i, 1);
    }
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.d += w.speed * dt;
      // Frost runs a pace ahead of the spikes, so the line reads before it lands.
      const lead = Math.min(w.len, w.d + 1.2);
      if (Math.random() < dt * 50) fx.add.emit({ x: w.x + w.dx * lead + rand(-.3, .3), y: .08, z: w.z + w.dz * lead + rand(-.3, .3), vy: rand(.2, .8), life: .5, size: .22, color: fx.col(w.color), alpha: .7, drag: 1 });
      while (!w.dead && w.next <= Math.min(w.d, w.len)) {
        const x = w.x + w.dx * w.next, z = w.z + w.dz * w.next;
        // Walls and cliffs stop a wave.
        if (G.world.raycast({ x: x - w.dx * w.gap, y: .6, z: z - w.dz * w.gap }, { x: w.dx, y: 0, z: w.dz }, w.gap) < w.gap - .05) { w.dead = true; break; }
        fx.spikes({ x, z }, 1.15 + Math.random() * .6, w.color, 4, 1.05);
        if (w.n++ % 3 === 0) G.audio.sfx('ice', { x, z, vol: .45 });
        if (!w.hit && p.alive && Math.hypot(p.pos.x - x, p.pos.z - z) < w.r + p.radius) {
          w.hit = true;
          p.receiveHit({ dmg: w.dmg, from: w.from, aoe: true, ranged: true, heavy: w.dmg >= 60, chill: w.chill, dirYaw: yawTo(p.pos.x, p.pos.z, w.x, w.z) });
        }
        w.next += w.gap;
      }
      if (w.dead || w.next > w.len) this.waves.splice(i, 1);
    }
  }

  // A strike cut the orb out of the air.
  cut(pr) {
    pr.kill = true;
    this.G.fx.spark(pr.obj.position, { x: 0, z: 0 }, 16, 0xd8b0ff, 5);
    this.G.audio.sfx('deflect', { vol: .45 });
  }

  clear() {
    for (const pr of this.list) {
      if (pr.warn) pr.warn.dead = true;
      if (pr.kind === 'orb') { const it = this.G.fx.items.find(x => x.obj === pr.obj); if (it) it.dead = true; }
      else this.G.scene.remove(pr.obj);
    }
    this.list.length = 0; this.hazards.length = 0; this.waves.length = 0;
  }
}

// ---------------------------------------------------------------- enemy
export class Enemy {
  // A type can reuse another model (variants and bosses); spawn.type names the TYPES entry.
  // Knight-shaped foes are built from the fae knight and load nothing.
  static modelFor(type) { return TYPES[type].knight ? null : TYPES[type].model || type; }

  static async create(G, spawn) {
    const T = TYPES[spawn.type];
    const model = T.knight ? knightModel(T) : await createModel(Enemy.modelFor(spawn.type), { scale: T.scale });
    return new Enemy(G, spawn, T, model);
  }

  dispose() {
    this.G.scene.remove(this.outer);
    this.mat.dispose();
    this.shell?.material.dispose();
    for (const m of this.crown?.userData.mats || []) m.dispose();
    championDispose(this);
    if (this.kn) { this.G.scene.remove(this.kn.trail.mesh); this.kn.trail.mesh.geometry.dispose(); this.kn.trail.mat.dispose(); }
  }

  constructor(G, spawn, T, model) {
    this.G = G; this.spawn = spawn; this.T = T; this.id = spawn.id;
    this.name = T.name; this.boss = !!T.boss; this.elite = !!T.elite;
    this.size = T.scale * (MODEL_SIZE[Enemy.modelFor(spawn.type)] ?? 1);
    this.height = 1.9 * this.size;
    this.radius = T.radius;
    this.model = model;
    this.mat = model.userData.mesh.material;
    this.arms = model.userData.arms; this.legs = model.userData.legs;
    const pivot = .45 * this.height;
    this.outer = new THREE.Group();
    this.lean = new THREE.Group(); this.lean.position.y = pivot;
    model.position.y = -pivot;
    this.lean.add(model); this.outer.add(this.lean);
    G.scene.add(this.outer);
    this.pos = this.outer.position;
    this.bones = model.userData.bones || {}; this.fore = model.userData.fore || []; this.shins = model.userData.shins || [];
    this.cur = { ...POSE0 };
    this.animVel = Object.fromEntries(Object.keys(this.cur).map(k => [k, 0]));
    this.tg = { ...this.cur };
    this.want = new THREE.Vector3(); this.impulse = new THREE.Vector3(); this.vel = new THREE.Vector3();
    this.cd = {};
    this.emi = new THREE.Color(T.tint ? T.glowTint ?? T.tint : 0xffffff);
    if (model.userData.knight) {
      const k = model.userData.knight;
      this.kn = { k, anim: new KnightAnimator(k), trail: new Trail(G.scene, T.knight.trail, 18, .16) };
      this.emi.setHex(T.knight.glow);
    }
    if (T.regalia && this.bones.head) { this.crown = regalia(T.regalia, headTop(model)); this.bones.head.add(this.crown); }
    if (T.armor) this.shell = rimeShell(model);
    this.reset();
  }

  get alive() { return this.state !== 'dead' && this.active; }
  get aware() { return !['idle', 'sleep', 'patrol', 'return'].includes(this.state); }

  reset() {
    const s = this.spawn, T = this.T, ng = this.G.ngMul || 1;
    this.active = true; this.outer.visible = true;
    this.pos.set(s.x, 0, s.z); this.yaw = s.yaw || 0;
    this.home = { x: s.x, z: s.z, yaw: s.yaw || 0 };
    // Later missions field hardier rank-and-file (their own elites and warlords are tuned as written).
    const tier = this.boss || this.elite ? 1 : (this.G.level?.tier || 1);
    this.tier = tier;
    this.maxHp = Math.round(T.hp * ng * tier); this.hp = this.maxHp;
    this.maxKi = Math.round(T.ki * (1 + (tier - 1) * .5)); this.ki = this.maxKi;
    this.dmgMul = (1 + (ng - 1) * .6) * (1 + (tier - 1) * .55);
    this.poiseDmg = 0; this.poiseT = 0; this.kiT = 0;
    this.state = s.idle === 'sleep' ? 'sleep' : s.patrol ? 'patrol' : 'idle';
    this.st = 0; this.atk = null; this.step = null;
    this.patrolI = 0; this.think = rand(0, .3); this.vel.set(0, 0, 0); this.impulse.set(0, 0, 0); this.want.set(0, 0, 0);
    this.yawVel = 0; this.gait = 0; this.speedNow = 0; this.turnRate = 6; this.faceYaw = null; this.planT = 0; this.detour = 0;
    for (const k in this.animVel) this.animVel[k] = 0;
    Object.assign(this.cur, POSE0);
    this.phase2 = false; this.usedOnce = {};
    this.dmgShown = 0; this.dmgShowT = 0; this.barT = 0;
    this.flash = 0; this.burstGlow = 0; this.lastHitBy = 0;
    this.hitList = null; this.alertT = 0; this.stuck = 0;
    this.cd = {};
    this.mat.transparent = false; this.mat.opacity = 1; this.mat.emissive.setHex(0xffffff); this.mat.emissiveIntensity = this.G.level?.enemyGlow ?? .08;
    this.outer.rotation.y = this.yaw;
    this.lean.rotation.set(0, 0, 0); this.lean.position.y = .45 * this.height;
    this.fadeT = 0; this.grappleK = 0; this.hop = null; this.plan = null; this.air = null; this.deadVy = 0; this.chantT = 0;
    if (T.shade) { this.mat.transparent = true; this.mat.opacity = .72; this.mat.color.setHex(0x5a4a90); }   // a shadow, not a rat
    if (T.tint) this.mat.color.setHex(T.tint);
    this.armored = !!T.armor?.start; if (this.shell) this.shell.visible = this.armored;
    this.parryCd = 0; this.waveDone = false; this.partner = null;
    this.notice = 0; this.susShown = false; this.lookAt = null; this.idleGoal = null; this.idleYaw = null; this.idleT = null;
    for (const m of this.crown?.userData.mats || []) { m.transparent = m.userData.t ??= m.transparent; m.opacity = m.userData.o ??= m.opacity; }
    if (this.kn) { this.kn.anim.stop(); this.kn.trail.samples.length = 0; this.kn.k.mats.blade.emissiveIntensity = .5; this.kn.k.mats.wing.color.setHex(T.knight.wing); }
    this.makeChampion(rollChampion(this.G, this));
  }

  // Champions (champions.js): hardier, named for their affixes, glowing in the first one's colour.
  makeChampion(affixes) {
    const T = this.T, has = id => affixes.includes(id);
    this.affixes = affixes; this.champion = affixes.length > 0;
    this.name = this.champion ? `${affixes.map(id => AFFIXES[id].name).join(' ')} ${T.name}` : T.name;
    this.poise = T.poise; this.ward = this.wardMax = 0; this.wrathOn = false; this.storms = [];
    if (this.champion) {
      const hp = 1.6 * (has('stone') ? 1.35 : 1);
      this.maxHp = Math.round(this.maxHp * hp); this.hp = this.maxHp;
      this.maxKi = Math.round(this.maxKi * (has('stone') ? 1.5 : 1.2)); this.ki = this.maxKi;
      this.poise = T.poise * (has('stone') ? 2.4 : 1.3);
      this.dmgMul *= 1.1;
      if (has('warded')) this.ward = this.wardMax = Math.round(this.maxHp * .3);
      this.stormT = 3 + Math.random() * 3; this.phaseT = 5 + Math.random() * 3; this.trailT = 1;
      this.mat.emissive.setHex(AFFIXES[affixes[0]].color); this.mat.emissiveIntensity = .3;
    }
    if (this.champion || this.champFx) championDress(this);
  }
  has(affix) { return this.champion && this.affixes.includes(affix); }

  // A champion's affixes at work each frame: the ward returning, wrath, lightning and phasing.
  championTick(dt, d) {
    const G = this.G, p = G.player;
    if (this.ward < this.wardMax && G.time - (this.lastHitT || 0) > 6) this.ward = Math.min(this.wardMax, this.ward + this.wardMax * .3 * dt);
    if (this.champFx) {
      this.champFx.ward.visible = this.ward > 0; this.champFx.ward.material.opacity = .06 + .14 * this.ward / (this.wardMax || 1);
      this.champFx.ring.material.opacity = .45 + Math.sin(G.time * 4 + this.pos.x) * .2;
    }
    if (Math.random() < dt * 5) G.fx.motes({ x: this.pos.x + rand(-.4, .4), y: rand(.2, this.height), z: this.pos.z + rand(-.4, .4) }, AFFIXES[this.affixes[Math.floor(Math.random() * this.affixes.length)]].color, 1, .2, .6, .08, .8);
    if (!this.aware || !p.alive) return;
    if (this.has('wrath') && !this.wrathOn && this.hp < this.maxHp / 3) {
      this.wrathOn = true; this.dmgMul *= 1.35;
      G.fx.ring(this.pos, 0xff5030, 3.5, .5); G.fx.burstAura({ x: this.pos.x, y: 0, z: this.pos.z }, 0xff4020, 6, this.height, this.radius + .3);
      G.audio.sfx('roar', { x: this.pos.x, z: this.pos.z, vol: .6, pitch: 1.3 });
      this.mat.emissive.setHex(0xff3010); this.mat.emissiveIntensity = .55;
    }
    if (this.has('ember') && this.state === 'engage' && (this.trailT -= dt) <= 0) { this.trailT = 2.6; G.projectiles.hazard(this.pos.x, this.pos.z, 1.1, 3.5, 24, 'fire', true); }
    if (this.has('storm') && d < 16 && (this.stormT -= dt) <= 0) {
      this.stormT = 6 + Math.random() * 3;
      const at = { x: p.pos.x, z: p.pos.z };
      G.fx.telegraph(at, 1.7, .95, 0xd8c8ff);
      this.storms.push({ ...at, t: G.time + .95 });
    }
    for (let i = this.storms.length - 1; i >= 0; i--) {
      const b = this.storms[i];
      if (G.time < b.t) continue;
      this.storms.splice(i, 1);
      G.fx.bolt({ x: b.x, y: 14, z: b.z }, { x: b.x, y: 0, z: b.z }, 0xe0d4ff, .3); G.fx.ring(b, 0xd8c8ff, 1.9, .3); G.fx.flash({ x: b.x, y: 1, z: b.z }, 0xd8c8ff, 3, .2);
      G.audio.sfx('storm', { x: b.x, z: b.z });
      if (Math.hypot(p.pos.x - b.x, p.pos.z - b.z) < 1.7 + p.radius) p.receiveHit({ dmg: 42 * this.dmgMul, from: this, aoe: true, dirYaw: yawTo(p.pos.x, p.pos.z, b.x, b.z) });
    }
    if (this.has('phasing') && this.state === 'engage' && d > 1.5 && d < 14 && (this.phaseT -= dt) <= 0) {
      this.phaseT = 7 + Math.random() * 3;
      this.blinkAway(true); this.think = Math.min(this.think, .12);
    }
  }

  // Rime armour: blows glance off until the foe is Shattered, which breaks the armour for good.
  armorUp() {
    if (!this.shell || this.armored) return;
    const G = this.G;
    this.armored = true; this.shell.visible = true;
    this.ki = this.maxKi;
    G.fx.shatter({ x: this.pos.x, y: this.height * .5, z: this.pos.z }, 40, 0xdff4ff, 4);
    G.fx.ring(this.pos, 0xbfe6ff, 5, .6);
    G.audio.sfx('chill', { x: this.pos.x, z: this.pos.z });
    G.hud?.toast('Rime armour: break its stamina to shatter it', 'frost');
  }
  shatterArmor() {
    const G = this.G;
    this.armored = false; this.shell.visible = false;
    G.fx.shatter({ x: this.pos.x, y: this.height * .5, z: this.pos.z }, 70, 0xdff4ff, 8);
    G.fx.ring(this.pos, 0xdff4ff, 4.5, .5);
    G.audio.sfx('shatter', { x: this.pos.x, z: this.pos.z });
    G.cam.shake(.5, this.pos);
    G.hud?.toast('Rime armour shattered', 'pulse');
  }

  // Play one of the knight's own actions (knight-shaped foes only).
  kplay(name, speed = 1, fade = .06) { if (this.kn && name) this.kn.anim.play(name, speed, fade); }

  kill() { this.active = false; this.state = 'dead'; this.outer.visible = false; }

  // ------------------------------------------------ perception
  distToPlayer() { const p = this.G.player.pos; return Math.hypot(p.x - this.pos.x, p.z - this.pos.z); }

  canSee(d) {
    const G = this.G, p = G.player;
    if (!p.alive || G.player.state === 'fog') return false;
    const ang = Math.abs(angleDiff(this.yaw, yawTo(this.pos.x, this.pos.z, p.pos.x, p.pos.z)));
    const sight = this.boss ? 0 : 14;
    const hear = p.sprinting ? 8 : p.moving ? 3.2 : 2.2;
    if (this.state === 'sleep') {
      if (d < (p.sprinting ? 5 : 1.3)) { this.sleepT = (this.sleepT || 0) + .2; return this.sleepT > (p.sprinting ? .2 : 2.2); }
      this.sleepT = 0; return false;
    }
    if (d < hear) return G.world.los(this.pos, p.pos);
    if (d < sight && ang < 1.15) return G.world.los(this.pos, p.pos);
    return false;
  }

  // How strongly the knight registers right now: sight in a wide cone, a sense of movement at the corner of the
  // eye, and noise (running, dashing and fighting carry further than walking). Walls muffle noise and hide sight.
  stimulus(d) {
    const G = this.G, p = G.player;
    if (!p.alive || p.state === 'fog' || p.state === 'rest' || this.boss) return 0;
    const ang = Math.abs(angleDiff(this.yaw, yawTo(this.pos.x, this.pos.z, p.pos.x, p.pos.z)));
    const loud = p.sprinting ? 11 : p.isAttacking || p.state === 'dash' || p.state === 'hop' ? 8 : p.moving ? 4.5 : 2.4;
    let s = 0, heard = false;
    if (d < loud) { s = 1.4 * (1 - d / loud) + .3; heard = true; }
    if (d < 20 && ang < 1.35) s = Math.max(s, 1.6 * (1 - d / 20) + .25);
    else if (d < 7) s = Math.max(s, .6 * (1 - d / 7));
    if (s > 0 && d > 2.5 && !G.world.los(this.pos, p.pos)) s = heard ? s * .35 : 0;
    return s;
  }

  // Awake foes build up notice over a moment before they act: first a glance ("?"), then the alarm ("!").
  sense(d, dt) {
    const st = this.stimulus(d), G = this.G;
    this.notice = clamp((this.notice || 0) + (st > 0 ? st * dt * 2.3 : -dt * .35), 0, 1.05);
    if (this.notice >= 1) { this.alert(); return; }
    if (this.notice > .3) {
      // Suspicious: turn toward what was sensed.
      this.lookAt = yawTo(this.pos.x, this.pos.z, G.player.pos.x, G.player.pos.z);
      if (!this.susShown) { this.susShown = true; G.hud?.mark(this, '?'); }
    } else if (this.notice < .1) { this.susShown = false; this.lookAt = null; }
  }

  // Idle foes don't stand like statues: they look about and shift around their post.
  idle(dt) {
    const h = this.home;
    this.idleT = (this.idleT ?? rand(.5, 3)) - dt;
    if (this.idleT <= 0) {
      this.idleT = rand(3, 7);
      const r = Math.random();
      if (r < .45) { this.idleYaw = h.yaw + rand(-1.3, 1.3); this.idleGoal = null; }
      else if (r < .8 && this.T.style !== 'ranged') { const a = rand(0, TAU), rr = rand(.8, 2.4); this.idleGoal = { x: h.x + Math.sin(a) * rr, z: h.z + Math.cos(a) * rr }; }
      else { this.idleYaw = h.yaw; this.idleGoal = Math.hypot(this.pos.x - h.x, this.pos.z - h.z) > .5 ? { x: h.x, z: h.z } : null; }
    }
    if (this.lookAt != null) { this.faceYaw = this.lookAt; this.turnRate = 3.2; return; }
    if (this.idleGoal) {
      const dx = this.idleGoal.x - this.pos.x, dz = this.idleGoal.z - this.pos.z, dd = Math.hypot(dx, dz);
      if (dd < .3 || this.stuck > .6) this.idleGoal = null;
      else this.steer(Math.atan2(dx, dz), this.T.walk * .5);
    } else { this.faceYaw = this.idleYaw ?? h.yaw; this.turnRate = 1.6; }
  }

  alert(delay = 0) {
    if (this.aware || !this.alive || this.boss) return;
    this.state = 'alert'; this.st = -delay; this.alertT = 0; this.notice = 1; this.lookAt = null; this.idleGoal = null;
    this.G.audio.sfx(this.T.voice, { x: this.pos.x, z: this.pos.z, pitch: this.T.pitch });
    this.G.hud?.mark(this, '!');
    // The alarm carries: friends in sight, or close enough to hear the shout, join in.
    for (const o of this.G.enemies) {
      if (o === this || o.aware || !o.alive || o.boss) continue;
      const d = Math.hypot(o.pos.x - this.pos.x, o.pos.z - this.pos.z);
      if (o.state === 'sleep' ? d < 5 : d < 7 || (d < 13 && this.G.world.los(o.pos, this.pos))) o.alert(rand(.3, .8));
    }
  }

  // ------------------------------------------------ taking damage
  // hit: {dmg, ki, poise, dir: yaw from attacker, heavy, crit, kb (knockback override; negative pulls toward the attacker)}
  takeHit(hit) {
    if (!this.alive || this.state === 'intro' || this.burrowed) return null;
    const G = this.G;
    // A fencer turns quick cuts aside and answers at once. Heavies, Flashcuts and blows as it recovers get through.
    if (this.T.parry && this.state === 'engage' && !hit.crit && !hit.flash && !hit.heavy && this.parryCd < G.time) {
      const from = yawTo(this.pos.x, this.pos.z, G.player.pos.x, G.player.pos.z);
      if (Math.abs(angleDiff(this.yaw, from)) < 1.2 && Math.random() < this.T.parry * (this.phase2 ? 1.25 : 1)) {
        this.parryCd = G.time + 1.1;
        this.kplay('deflect', 1.1, .02);
        const sp = new THREE.Vector3(this.pos.x + Math.sin(this.yaw) * .7, this.height * .6, this.pos.z + Math.cos(this.yaw) * .7);
        G.fx.spark(sp, { x: -Math.sin(from), z: -Math.cos(from) }, 30, 0xdff4ff, 8); G.fx.flash(sp, 0xffffff, 2, .2, true);
        G.audio.sfx('deflect', { x: this.pos.x, z: this.pos.z });
        G.player.recoil(this);
        G.hud.toast('Parried', 'warn');
        this.think = Math.min(this.think, .06); this.riposteNext = true;
        return null;
      }
    }
    // Shield wall: a guarded front turns blows aside (heavies wear the guard down faster).
    if (this.T.shield && ['engage', 'idle', 'patrol', 'alert'].includes(this.state) && !hit.crit && !hit.flash) {
      const from = yawTo(this.pos.x, this.pos.z, G.player.pos.x, G.player.pos.z);
      if (Math.abs(angleDiff(this.yaw, from)) < 1.05) {
        this.ki -= (hit.ki || 0) * (hit.heavy ? 1.6 : .9); this.kiT = 1.4; this.barT = 6;
        this.hp -= hit.dmg * .12; this.dmgShown += hit.dmg * .12; this.dmgShowT = 2.5;
        this.pulseAnim('deflected', .6);
        G.fx.spark(new THREE.Vector3(this.pos.x + Math.sin(this.yaw) * .5, this.height * .55, this.pos.z + Math.cos(this.yaw) * .5), { x: Math.sin(from), z: Math.cos(from) }, 14, 0xdfe6ff, 6);
        G.audio.sfx('block', { x: this.pos.x, z: this.pos.z });
        if (this.hp <= 0) { this.die(hit); return 'kill'; }
        if (this.ki <= 0) { this.breakKi(); return 'broken'; }
        if (Math.random() < .5 && this.think > .2) this.think = .2;   // a guarded foe answers quickly
        return 'blocked';
      }
    }
    let dmg = hit.dmg * (this.state === 'down' ? 1.2 : 1);   // a floored foe takes more
    this.lastHitT = G.time;
    if (this.ward > 0) {   // a Warded champion's ward takes the blow first
      const a = Math.min(this.ward, dmg); this.ward -= a; dmg -= a;
      G.fx.spark(new THREE.Vector3(this.pos.x, this.height * .6, this.pos.z), { x: Math.sin(hit.dir || 0), z: Math.cos(hit.dir || 0) }, 10, 0x9fd0ff, 5);
      if (this.ward <= 0) { G.fx.shatter({ x: this.pos.x, y: this.height * .6, z: this.pos.z }, 30, 0x9fd0ff, 5); G.audio.sfx('shatter', { x: this.pos.x, z: this.pos.z, vol: .6 }); G.hud.toast('Ward broken', 'item'); }
      hit = { ...hit, ki: (hit.ki || 0) * .4, poise: 0 };
    }
    if (this.armored) {
      dmg *= this.T.armor.reduce ?? .35; hit = { ...hit, ki: (hit.ki || 0) * 1.15, poise: 0 };
      G.fx.shatter({ x: this.pos.x, y: this.height * .6, z: this.pos.z }, 6, 0xdff4ff, 3);
    }
    this.hp -= dmg;
    this.dmgShown += dmg; this.dmgShowT = 2.5; this.barT = 6;
    this.flash = 1;
    this.kiT = 1.4;
    if (this.state !== 'broken' && this.state !== 'grappled') this.ki -= hit.ki || 0;
    this.poiseDmg += hit.poise || 0; this.poiseT = 1.2;
    if (!this.aware && !this.boss) { this.alert(); this.state = 'engage'; this.st = 0; this.think = .15; }
    // Knockback as an impulse, plus a jolt through the pose springs.
    if (this.state !== 'grappled') {
      const kb = (hit.kb ?? (hit.heavy ? 4.5 : 2)) * (this.boss ? .15 : this.elite ? .35 : 1);
      this.impulse.x += Math.sin(hit.dir) * kb; this.impulse.z += Math.cos(hit.dir) * kb;
      this.pulseAnim(hit.heavy ? 'heavy' : 'hit', this.boss ? .4 : this.elite ? .6 : 1);
    }
    if (this.hp <= 0) { this.die(hit); return 'kill'; }
    if (this.state === 'grappled') return 'hit';
    if (this.state === 'air') {
      // Juggled: each blow holds them up, drawn toward the height of whoever struck.
      const target = hit.airY !== undefined ? hit.airY + .15 : this.pos.y;
      this.air.vy = clamp((target - this.pos.y) * 5 + 1.2, -3, 3.2); this.air.hang = .45;
      return 'hit';
    }
    if (this.state === 'down') return 'hit';
    if (this.ki <= 0 && this.state !== 'broken') { this.breakKi(); return 'broken'; }
    const armored = this.armored || this.chantT > G.time || this.step && this.phase === 'active' && this.step.hyper || (this.step && this.step.hyper && this.phase === 'windup' && this.pt > this.step.windup * .4);
    if (this.poiseDmg >= (this.poise ?? this.T.poise) && !armored && this.state !== 'broken') {
      this.poiseDmg = 0;
      this.hurt(hit.heavy ? .55 : .36);
      return 'stagger';
    }
    return 'hit';
  }

  // Launchers throw ordinary foes into the air; gatekeepers, warlords and armoured swings stand firm.
  // quiet: a trip or a pop from a strike, which says nothing when a heavy foe shrugs it off.
  launch(v, quiet = false) {
    if (this.boss || this.elite || !this.alive || this.state === 'grappled' || this.state === 'dead') return false;
    if (this.state === 'attack' && this.step?.hyper && this.phase !== 'recover') return false;
    // Heavy foes stand firm until their stamina is spent.
    if (this.T.poise >= 30 && this.state !== 'broken' && this.ki > this.maxKi * .4) { if (!quiet) this.G.hud.toast('Too heavy — wear it down first'); return false; }
    this.endAttack();
    this.air = { vy: this.state === 'air' ? Math.max(this.air.vy, v) : v, hang: 0, slam: false };
    this.state = 'air'; this.st = 0;
    this.impulse.set(0, 0, 0);
    this.G.audio.sfx(this.T.voice, { x: this.pos.x, z: this.pos.z, pitch: this.T.pitch * 1.3, vol: .6 });
    return true;
  }
  // A Starfall drives an airborne foe into the ground.
  slam() {
    if (this.state !== 'air') return false;
    this.air.vy = -24; this.air.slam = true; this.air.hang = 0;
    return true;
  }

  hurt(dur) {
    this.endAttack();
    this.state = 'hurt'; this.st = 0; this.hurtDur = dur;
    this.kplay('hurt', 1.2, .03);
    this.G.audio.sfx(this.T.voice, { x: this.pos.x, z: this.pos.z, pitch: this.T.pitch * 1.2, vol: .6 });
  }

  breakKi() {
    this.endAttack();
    this.state = 'broken'; this.st = 0; this.ki = 0;
    this.kplay('stagger', .45, .04);
    if (this.armored) this.shatterArmor();
    this.G.audio.sfx('guardBreak', { x: this.pos.x, z: this.pos.z });
    this.G.fx.flash(new THREE.Vector3(this.pos.x, this.height * .8, this.pos.z), 0xffe070, 2.5, .5, true);
    this.G.hud?.enemyBroken(this);
  }

  // The player met the blow with a perfect guard: the attacker reels and loses posture.
  deflected(h) {
    const G = this.G;
    this.ki -= (18 + h.dmg * .5) * (this.boss ? .6 : 1);
    this.kiT = 1.4; this.barT = 6;
    this.pulseAnim('deflected', this.boss ? .5 : 1);
    const back = yawTo(G.player.pos.x, G.player.pos.z, this.pos.x, this.pos.z);
    this.impulse.x += Math.sin(back) * (this.boss ? 1 : 3); this.impulse.z += Math.cos(back) * (this.boss ? 1 : 3);
    this.kplay('hurt', 1.4, .02);
    if (this.ki <= 0) { this.breakKi(); return; }
    if (!this.boss && !this.elite) this.hurt(.55);
  }

  // The player Thorn Countered one of our attacks.
  countered(wasBurst) {
    const G = this.G;
    if (wasBurst) {
      this.ki -= this.boss ? 170 : this.elite ? 150 : 999;
      this.barT = 6;
      if (this.ki <= 0) this.breakKi();
      else this.hurt(.9);
    } else {
      this.ki -= 45; this.barT = 6;
      if (this.ki <= 0) this.breakKi(); else if (!this.boss) this.hurt(.5);
    }
    G.fx.flash(new THREE.Vector3(this.pos.x, this.height * .6, this.pos.z), 0x9ff3ff, 3, .35, true);
  }

  die(hit) {
    const G = this.G;
    this.endAttack();
    this.state = 'dead'; this.st = 0; this.hp = 0;
    this.kplay('death', 1, .05);
    if (this.armored) this.shatterArmor();
    G.audio.sfx('enemyDie', { x: this.pos.x, z: this.pos.z, pitch: this.T.pitch });
    G.onEnemyKilled(this, hit);
  }

  // Wolf Claws: wounds stack for four seconds; the fifth bursts for a slice of the foe's health.
  bleed(burst = 5) {
    if (!this.alive) return;
    const G = this.G;
    if (G.time - (this.bleedT ?? -9) > 4) this.bleedN = 0;
    this.bleedT = G.time; this.bleedN = (this.bleedN || 0) + 1;
    G.fx.motes({ x: this.pos.x, y: this.height * .6, z: this.pos.z }, 0xd02020, 2, .3, .2, .08, .6);
    if (this.bleedN < burst) return;
    this.bleedN = 0;
    const dmg = this.maxHp * (this.boss ? .03 : this.elite ? .07 : .15) + 20;
    this.hp -= dmg; this.dmgShown += dmg; this.dmgShowT = 2.5; this.barT = 6;
    G.fx.blood(new THREE.Vector3(this.pos.x, this.height * .6, this.pos.z), { x: 0, z: 0 }, 40, 0x6a0808);
    G.audio.sfx('hitHeavy', { x: this.pos.x, z: this.pos.z });
    G.hud?.floatText(this, 'BLEED', 'broken');
    if (this.hp <= 0) this.die({ dmg, dir: this.yaw + Math.PI });
  }
  // Brands laid on by the knight's strikes.
  burn(t) { if (this.alive) this.burnT = Math.max(this.burnT || 0, t); }
  rime(t) { if (this.alive) this.slowT = Math.max(this.slowT || 0, t); }
  tickBurn(dt) {
    this.burnT -= dt;
    const dps = this.maxHp * (this.boss ? .006 : this.elite ? .014 : .035) + 4;
    this.hp -= dps * dt; this.dmgShown += dps * dt; this.dmgShowT = 2.5; this.barT = 6;
    if (Math.random() < dt * 16) this.G.fx.motes({ x: this.pos.x + rand(-.3, .3), y: rand(.2, this.height * .9), z: this.pos.z + rand(-.3, .3) }, Math.random() < .5 ? 0xff8a30 : 0xffc060, 1, .25, 1.4, .1, .6);
    if (this.hp <= 0) this.die({ dmg: 0, dir: this.yaw + Math.PI });
  }

  endAttack() {
    if (this.atk) this.G.attackTokens = Math.max(0, (this.G.attackTokens || 0) - 1);
    if (this.step?.blink && this.state !== 'dead') { this.mat.opacity = this.T.shade ? .72 : 1; this.mat.transparent = !!this.T.shade; }
    this.burrowed = false;
    this.atk = null; this.step = null; this.phase = null; this.burstGlow = 0;
  }

  // ------------------------------------------------ attacks
  pickAttack(d) {
    const G = this.G, p = G.player;
    const behind = Math.abs(angleDiff(this.yaw, yawTo(this.pos.x, this.pos.z, p.pos.x, p.pos.z))) > 1.9;
    let list = this.T.attacks;
    if (this.phase2 && this.T.phase2) list = list.concat(this.T.phase2);
    const ok = list.filter(a => {
      if (a.once && this.usedOnce[a.name]) return false;
      if (a.once && this.phase2) return true;
      if ((this.cd[a.name] || 0) > G.time) return false;
      if (a.cond === 'behind' && !behind) return false;
      if (a.cond === 'close' && d > 3.8) return false;
      if (a.cond === 'alliesNear' && !G.enemies.some(o => o !== this && o.alive && o.aware && !(o.chantT > G.time) && Math.hypot(o.pos.x - this.pos.x, o.pos.z - this.pos.z) < 10)) return false;
      if (a.cond === 'alliesHurt' && !G.enemies.some(o => o !== this && o.alive && o.aware && o.hp < o.maxHp * .7 && Math.hypot(o.pos.x - this.pos.x, o.pos.z - this.pos.z) < 9)) return false;
      return d <= a.range && d >= a.minRange;
    });
    if (!ok.length) return null;
    const forced = ok.find(a => a.once);
    if (forced) return forced;
    if (this.riposteNext) {   // straight after a parry: the quickest cut to hand
      this.riposteNext = false;
      const quick = ok.filter(a => !a.steps[0].proj && !a.steps[0].blink && a.steps[0].anim !== 'roar').sort((a, b) => a.steps[0].windup - b.steps[0].windup)[0];
      if (quick) return quick;
    }
    let tot = ok.reduce((s, a) => s + a.w, 0), r = Math.random() * tot;
    for (const a of ok) { r -= a.w; if (r <= 0) return a; }
    return ok[0];
  }

  startAttack(a) {
    this.atk = a; this.stepI = 0; this.state = 'attack'; this.st = 0;
    this.cd[a.name] = this.G.time + a.cd;
    this.G.attackTokens = (this.G.attackTokens || 0) + 1;
    this.beginStep();
  }

  beginStep() {
    const s = this.atk.steps[this.stepI];
    const spd = this.phase2 ? .85 : 1;
    this.step = s; this.phase = 'windup'; this.pt = 0; this.hitDone = false; this.lungeTotal = 0; this.lungeDone = 0;
    this.stepDur = { windup: s.windup * spd, active: s.active, recover: s.recover * (this.phase2 ? .8 : 1) };
    this.waveDone = false;
    if (this.kn) {
      // A knight's own action (KNIGHT_ACT), or any of the player's strikes by name, timed to its hit.
      const [act, hitT] = KNIGHT_ACT[s.kact || s.anim] || (ACTIONS[s.kact] ? [s.kact, ACTIONS[s.kact].hit?.[0] ?? .25] : KNIGHT_ACT.swing);
      this.kplay(act, clamp(hitT / Math.max(.05, this.stepDur.windup), .3, 3), .05);
    }
    const G = this.G, head = new THREE.Vector3(this.pos.x, this.height * .75, this.pos.z);
    if (s.burst) {
      this.burstGlow = 1;
      G.audio.sfx('burstWarn', { x: this.pos.x, z: this.pos.z });
      G.fx.flash(head, 0xff2020, 2.8 * Math.max(1, this.size * .7), .6, true);
      G.hud?.burstWarn();
    } else if (this.stepI === 0 && !s.proj && !s.heal && !s.blink && s.anim !== 'roar') {
      G.fx.flash(head.add(new THREE.Vector3(Math.sin(this.yaw) * .4, 0, Math.cos(this.yaw) * .4)), 0xfff2c0, 1.2 * Math.max(1, this.size * .6), .35, true);
      G.audio.sfx('glint', { x: this.pos.x, z: this.pos.z, vol: .5 });
    }
    if (s.anim === 'leap' || s.burrow) {
      const p = G.player.pos;
      this.leap = { x0: this.pos.x, z0: this.pos.z, x1: p.x, z1: p.z };
    }
    if (s.anim === 'roar') { G.audio.sfx('roar', { x: this.pos.x, z: this.pos.z }); }
  }

  updateAttack(dt) {
    const G = this.G, p = G.player, s = this.step, D = this.stepDur;
    this.pt += dt;
    const toP = yawTo(this.pos.x, this.pos.z, p.pos.x, p.pos.z);
    const d = this.distToPlayer();
    if (this.phase === 'windup') {
      this.faceYaw = toP; this.turnRate = s.anim === 'leap' ? 6 : (this.T.track || 6);
      if (s.burst) G.fx.burstAura(this.pos, 0xff2020, 2, this.height, this.radius);
      if (s.anim === 'leap' || s.burrow) { this.leap.x1 = p.pos.x; this.leap.z1 = p.pos.z; }
      if (s.blink) { this.mat.transparent = true; this.mat.opacity = 1 - clamp(this.pt / D.windup, 0, 1) * .95; }
      if (s.burrow && Math.random() < dt * 30) G.fx.dust(this.pos, 1);
      if (this.pt >= D.windup) {
        this.phase = 'active'; this.pt = 0;
        if (s.blink) this.blinkAway(s.behind);
        if (s.burrow) {
          // Underground: untouchable, a furrow of dust racing to where the knight stood.
          this.burrowed = true; this.leap.x0 = this.pos.x; this.leap.z0 = this.pos.z;
          G.fx.telegraph({ x: this.leap.x1, z: this.leap.z1 }, s.aoe, D.active, 0xc8a060);
          G.audio.sfx('slam', { x: this.pos.x, z: this.pos.z, vol: .4 });
        }
        const want = s.lunge ? Math.min(s.lunge, Math.max(0, d - (s.reach * .55 + p.radius))) : 0;
        this.lungeTotal = s.anim === 'thrust' && s.lunge > 3 ? s.lunge : want;   // charges commit to their full length
        this.lungeDone = 0;
        if (s.proj) {
          const hand = new THREE.Vector3(this.pos.x + Math.sin(this.yaw) * .5, this.height * .7, this.pos.z + Math.cos(this.yaw) * .5);
          G.projectiles.spawn(s.proj.kind, hand, this, s);
        } else if (s.heal) {
          // Mending chant: allies nearby knit their wounds.
          for (const o of G.enemies) {
            if (!o.alive || Math.hypot(o.pos.x - this.pos.x, o.pos.z - this.pos.z) > 9) continue;
            o.hp = Math.min(o.maxHp, o.hp + o.maxHp * s.heal); o.barT = 4;
            G.fx.ring(o.pos, 0x7dff8a, 1.6, .5); G.fx.motes({ x: o.pos.x, y: .4, z: o.pos.z }, 0x7dff8a, 10, .4, 2, .1, .9);
          }
          G.audio.sfx('heal', { x: this.pos.x, z: this.pos.z });
        } else if (s.chant) {
          // War chant: allies nearby are emboldened, harder-hitting and unshakeable.
          G.fx.ring(this.pos, 0xff5030, 10, .7);
          for (const o of G.enemies) if (o.alive && Math.hypot(o.pos.x - this.pos.x, o.pos.z - this.pos.z) < 10) { o.chantT = G.time + s.chant; G.fx.ring(o.pos, 0xff5030, 1.4, .4); }
          G.audio.sfx('roar', { x: this.pos.x, z: this.pos.z, pitch: 1.4, vol: .7 });
        } else if (s.howl) {
          // A rallying howl wakes every ratman in earshot.
          G.fx.ring(this.pos, 0xffd070, 6, .6);
          for (const o of G.enemies) if (o !== this && o.alive && !o.aware && Math.hypot(o.pos.x - this.pos.x, o.pos.z - this.pos.z) < 20) o.alert(rand(.1, .5));
        } else if (s.anim !== 'roar' && s.anim !== 'leap' && !s.blink && !s.burrow) {
          G.audio.sfx('enemySwing', { x: this.pos.x, z: this.pos.z, vol: Math.min(1.5, this.size) });
        }
        if (s.anim === 'roar' && !s.howl && this.atk.once) this.doRoar();
      }
    } else if (this.phase === 'active') {
      const ad = D.active;
      if (s.anim === 'leap' || s.burrow) {
        const k = clamp(this.pt / ad, 0, 1), L = this.leap;
        this.pos.x = lerp(L.x0, L.x1, smooth(k)); this.pos.z = lerp(L.z0, L.z1, smooth(k));
        if (s.burrow && Math.random() < dt * 40) G.fx.dust(this.pos, 1);
      } else this.advanceLunge(ad, d, s, p);
      this.faceYaw = toP; this.turnRate = s.anim === 'thrust' && s.lunge > 3 ? 1.2 : .8;
      const hitAt = s.aoeAt ? ad * .5 : s.anim === 'leap' || s.burrow ? ad * .98 : 0;
      const hits = !s.proj && !s.heal && !s.blink && s.anim !== 'roar' && !(s.wave && !s.reach && !s.aoe);
      if (s.wave && !this.waveDone && this.pt >= hitAt) { this.waveDone = true; G.projectiles.wave(this, s); }
      if (s.burrow && this.burrowed && this.pt >= hitAt) { this.burrowed = false; G.fx.dust(this.pos, 20); }
      if (!this.hitDone && this.pt >= hitAt && hits) this.tryHit(s);
      if (this.pt >= ad) {
        this.phase = 'recover'; this.pt = 0; this.burstGlow = 0;
        if (!this.hitDone && hits) this.tryHit(s);
        this.burrowed = false;
      }
    } else if (this.phase === 'recover') {
      if (s.blink) this.mat.opacity = .05 + clamp(this.pt / D.recover, 0, 1) * .95;
      this.advanceLunge(D.active, d, s, p, D.active + this.pt);
      if (this.pt >= D.recover) {
        this.stepI++;
        if (this.stepI < this.atk.steps.length) this.beginStep();
        else {
          this.endAttack();
          if (s.blink) { this.mat.opacity = this.T.shade ? .72 : 1; this.mat.transparent = !!this.T.shade; }
          this.state = 'engage'; this.st = 0;
          this.think = rand(.35, 1.1) * (1.4 - (this.T.aggro || .7));
        }
      }
    }
  }

  // Lunges ease in and out over the active frames and spill a little into recovery.
  advanceLunge(ad, d, s, p, t = this.pt) {
    if (!this.lungeTotal || this.lungeDone >= this.lungeTotal) return;
    const k = smooth(clamp(t / (ad * 1.35), 0, 1));
    let step = this.lungeTotal * k - this.lungeDone;
    if (s.lunge > 3 && d < s.reach * .6 + p.radius) { step = 0; this.lungeTotal = this.lungeDone; }
    this.lungeDone += step;
    this.pos.x += Math.sin(this.yaw) * step; this.pos.z += Math.cos(this.yaw) * step;
  }

  tryHit(s) {
    const G = this.G, p = G.player;
    const fwd = { x: Math.sin(this.yaw), z: Math.cos(this.yaw) };
    // Area shock at the weapon's landing point (or around the body).
    if (s.aoe) {
      const off = s.reach ? s.reach * .8 : 0;
      const c = { x: this.pos.x + fwd.x * off, z: this.pos.z + fwd.z * off };
      G.fx.ring({ x: c.x, z: c.z }, s.burst ? 0xff5030 : 0xfff0d0, s.aoe * 1.2, .35);
      G.fx.dust({ x: c.x, z: c.z }, 16);
      G.audio.sfx('slam', { x: c.x, z: c.z, vol: Math.min(1.4, this.size * .7) });
      if (s.fire) G.projectiles.hazard(c.x, c.z, s.fire, 3.5, 30, 'fire');
      if (s.pool) { G.projectiles.hazard(c.x, c.z, s.pool, 5, 45); G.fx.ring({ x: c.x, z: c.z }, 0x8fe040, s.aoe, .5); }
      G.world.smash(c.x, c.z, s.aoe * .8);   // slams break whatever they land on
      if (s.frost) { G.projectiles.hazard(c.x, c.z, s.frost, 6, 40, 'frost'); G.fx.shatter({ x: c.x, y: .4, z: c.z }, 40); for (let i = 0; i < 10; i++) G.fx.spikes({ x: c.x + Math.sin(i / 10 * TAU) * s.aoe * .8, z: c.z + Math.cos(i / 10 * TAU) * s.aoe * .8 }, 1.4, 0xbfe6ff, 3, 1.2); }
      G.cam.shake(s.shake || .3, c);
      const d = Math.hypot(p.pos.x - c.x, p.pos.z - c.z);
      if (d <= s.aoe + p.radius) { this.hitDone = true; this.deliver(s, c); return; }
      if (!s.reach) { this.hitDone = true; return; }
    }
    const dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz);
    const ang = Math.abs(angleDiff(this.yaw, Math.atan2(dx, dz)));
    if (!s.aoe || s.reach) {
      const arcR = (s.arc || 100) * Math.PI / 360;
      const col = s.burst ? 0xff4030 : 0xfff4e0;
      if (s.anim === 'spin') G.fx.arc(this.pos, 0, s.reach, 359, col, this.height * .45);
      else if (s.anim !== 'thrust') G.fx.arc(this.pos, this.yaw, s.reach, s.arc || 100, col, this.height * (s.anim === 'overhead' ? .5 : .55), s.anim === 'overhead' ? 1.2 : 0);
      if (d <= s.reach + p.radius && (ang <= arcR || d < this.radius + p.radius + .15)) { this.hitDone = true; this.deliver(s, this.pos); }
    }
  }

  deliver(s, from) {
    const p = this.G.player;
    const dmg = s.dmg * this.dmgMul * (this.chantT > this.G.time ? 1.3 : 1);
    const res = p.receiveHit({
      dmg, from: this, burst: !!s.burst, poison: (s.poison || 0) + (this.has('blight') ? 30 : 0), chill: (s.chill || 0) + (this.has('rime') ? 22 : 0), heavy: s.dmg >= 60,
      dirYaw: yawTo(p.pos.x, p.pos.z, from.x, from.z), aoe: !!s.aoe,
    });
    this.hitDone = true;
    if (res === 'hit' && this.champion) {
      if (this.has('vampiric') && this.alive) { this.hp = Math.min(this.maxHp, this.hp + Math.max(dmg * .8, this.maxHp * .05)); this.G.fx.motes({ x: this.pos.x, y: this.height * .6, z: this.pos.z }, 0xff3a5a, 10, .5, 1, .1, .7); }
      if (this.has('ember')) this.G.projectiles.hazard(p.pos.x, p.pos.z, 1.3, 2.5, 30, 'fire');
    }
    return res;
  }

  // Vanish and reappear 7–11 m from the knight, somewhere open, in the same area and in sight.
  blinkAway(behind = false) {
    const G = this.G, p = G.player, W = G.world, here = W.areaAt(this.pos.x, this.pos.z);
    G.fx.motes({ x: this.pos.x, y: this.height * .5, z: this.pos.z }, 0xc9b4ff, 26, this.radius + .3, 2.5, .12, .7);
    G.fx.ring(this.pos, 0xc9b4ff, 2, .3);
    for (let i = 0; i < 20; i++) {
      // Behind: just past the knight's back (their facing, give or take). Otherwise well away.
      const a = behind ? p.yaw + Math.PI + rand(-.7, .7) : rand(0, TAU), r = behind ? 1.2 + this.radius + rand(0, .6) : rand(7, 11);
      const q = { x: p.pos.x + Math.sin(a) * r, z: p.pos.z + Math.cos(a) * r };
      if (!behind && W.areaAt(q.x, q.z) !== here) continue;
      const tx = q.x, tz = q.z;
      W.collide(q, this.radius + .4);
      if (Math.hypot(q.x - tx, q.z - tz) > .05 || !W.los(p.pos, q, 1.2)) continue;
      if (G.projectiles.hazards.some(h => Math.hypot(h.x - q.x, h.z - q.z) < h.r + 1)) continue;
      this.pos.x = q.x; this.pos.z = q.z; this.yaw = yawTo(q.x, q.z, p.pos.x, p.pos.z);
      this.vel.set(0, 0, 0); this.impulse.set(0, 0, 0);
      break;
    }
    G.fx.ring(this.pos, 0xc9b4ff, 2, .3);
    G.audio.sfx('magic', { x: this.pos.x, z: this.pos.z });
  }

  doRoar() {
    const G = this.G;
    this.usedOnce[this.atk.name] = true;
    G.cam.shake(.7, this.pos);
    if (this.T.roarHazard !== 'frost') G.fx.ring(this.pos, 0x8fe040, 7, .8);
    if (this.T.roarHazard === 'fire') { G.projectiles.hazard(this.pos.x, this.pos.z, 4.5, 4.5, 30, 'fire'); G.fx.ring(this.pos, 0xff6a2a, 7, .8); }
    else if (this.T.roarHazard === 'frost') {
      G.projectiles.hazard(this.pos.x, this.pos.z, 4.5, 5, 40, 'frost'); G.fx.ring(this.pos, 0xbfe6ff, 7, .8);
      for (let i = 0; i < 12; i++) G.fx.spikes({ x: this.pos.x + Math.sin(i / 12 * TAU) * 3.2, z: this.pos.z + Math.cos(i / 12 * TAU) * 3.2 }, 1.8, 0xbfe6ff, 3, 1.4);
      G.audio.sfx('shatter', { x: this.pos.x, z: this.pos.z });
    } else if (this.T.roarHazard !== 'none') G.projectiles.hazard(this.pos.x, this.pos.z, 5, 6, 40);
    if (this.T.armor?.phase2) this.armorUp();
    if (this.kn) { this.kn.k.mats.blade.emissiveIntensity = 1.4; this.kn.k.mats.wing.color.setHex(0xdff4ff); }
    G.onBossPhase2?.(this);
  }

  // ------------------------------------------------ main update
  update(dt) {
    if (!this.active) return;
    const G = this.G, p = G.player;
    // Fae Art brands: Emberbrand's fire eats health; Rimebrand's frost slows everything the foe does.
    if (this.burnT > 0 && this.alive) this.tickBurn(dt);
    if (this.champion && this.alive) { if (this.has('swift')) dt *= 1.25; if (this.wrathOn) dt *= 1.15; }
    if (this.slowT > 0) {
      this.slowT -= dt; dt *= this.boss ? .82 : .62;
      if (Math.random() < dt * 12) G.fx.motes({ x: this.pos.x + rand(-.3, .3), y: rand(.3, this.height), z: this.pos.z + rand(-.3, .3) }, 0xcfeaff, 1, .2, .2, .08, .8);
    }
    this.st += dt;
    this.flash = Math.max(0, this.flash - dt * 6);
    this.dmgShowT -= dt; if (this.dmgShowT <= 0) this.dmgShown = 0;
    this.barT -= dt;
    this.poiseT -= dt; if (this.poiseT <= 0) this.poiseDmg = 0;
    this.kiT -= dt;
    if (this.kiT <= 0 && this.state !== 'broken' && this.ki < this.maxKi) this.ki = Math.min(this.maxKi, this.ki + this.maxKi * (this.armored ? .16 : .35) * dt);
    this.want.set(0, 0, 0);
    this.faceYaw = null;

    if (this.state === 'dead') { this.updateDead(dt); this.integrate(dt); this.animate(dt); return; }

    const d = this.distToPlayer();
    const toP = yawTo(this.pos.x, this.pos.z, p.pos.x, p.pos.z);
    this.think -= dt;
    if (this.champion) this.championTick(dt, d);

    switch (this.state) {
      case 'sleep':
        if (this.think <= 0) { this.think = .2; if (this.canSee(d)) this.alert(); }
        this.faceYaw = this.home.yaw; this.turnRate = 2;
        break;
      case 'idle':
        if (this.think <= 0) { this.think = .2; this.sense(d, .2); }
        if (this.state === 'idle') this.idle(dt);
        break;
      case 'patrol': {
        const wp = this.spawn.patrol[this.patrolI];
        const dx = wp[0] - this.pos.x, dz = wp[1] - this.pos.z, dd = Math.hypot(dx, dz);
        if (dd < .6) this.patrolI = (this.patrolI + 1) % this.spawn.patrol.length;
        else if (this.lookAt == null) this.steer(Math.atan2(dx, dz), this.T.walk * Math.min(1, dd / 1.5 + .3));
        else { this.faceYaw = this.lookAt; this.turnRate = 3.2; }   // stops to peer at a noise
        if (this.think <= 0) { this.think = .2; this.sense(d, .2); }
        break;
      }
      case 'alert':
        if (this.st > 0) { this.faceYaw = toP; this.turnRate = 7; }
        if (this.st > .45) { this.state = 'engage'; this.st = 0; this.think = rand(0, .3); this.planT = 0; }
        break;
      case 'intro':
        this.faceYaw = toP; this.turnRate = 2;
        if (this.st > 2.2) { this.state = 'engage'; this.st = 0; this.think = .3; this.planT = 0; }
        break;
      case 'engage':
        this.updateEngage(dt, d, toP);
        break;
      case 'attack':
        this.updateAttack(dt);
        break;
      case 'hurt':
        if (this.st > this.hurtDur) { this.state = 'engage'; this.st = 0; this.think = rand(.1, .4); this.planT = 0; }
        break;
      case 'broken':
        if (this.st > (this.boss ? 3 : 2.6)) { this.state = 'engage'; this.st = 0; this.ki = this.maxKi * .6; this.think = .2; this.planT = 0; }
        break;
      case 'grappled':
        if (G.player.state !== 'grapple' || G.player.grapple?.e !== this) { this.state = 'hurt'; this.st = 0; this.hurtDur = .5; }
        break;
      case 'air': {
        // Tumbling: gravity, eased while blows keep landing.
        const A = this.air;
        A.hang -= dt;
        A.vy -= (A.hang > 0 ? 7 : A.slam ? 60 : 26) * dt;
        if (A.hang > 0) A.vy = Math.max(A.vy, -2);
        this.pos.y = Math.max(0, this.pos.y + A.vy * dt);
        this.faceYaw = toP; this.turnRate = 1;
        if (this.pos.y <= 0 && A.vy < 0) {
          this.pos.y = 0; this.state = 'down'; this.st = 0; this.downDur = A.slam ? 1.5 : 1;
          G.fx.dust(this.pos, A.slam ? 18 : 8);
          G.audio.sfx('slam', { x: this.pos.x, z: this.pos.z, vol: A.slam ? .8 : .4 });
          if (A.slam) { G.fx.ring(this.pos, 0xdff4ff, 2.2, .3); G.cam.shake(.3, this.pos); }
        }
        break;
      }
      case 'down':
        if (this.st > this.downDur) { this.state = 'engage'; this.st = 0; this.think = rand(.1, .35); this.planT = 0; }
        break;
      case 'return': {
        const dx = this.home.x - this.pos.x, dz = this.home.z - this.pos.z, dd = Math.hypot(dx, dz);
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * .2 * dt);
        if (dd < .6) { this.state = this.spawn.patrol ? 'patrol' : 'idle'; this.hp = this.maxHp; this.ki = this.maxKi; }
        else this.steer(Math.atan2(dx, dz), this.T.run * .75 * Math.min(1, dd / 2 + .3));
        if (this.think <= 0) { this.think = .3; if (d < 12 && this.stimulus(d) > .5) { this.state = 'engage'; this.st = 0; this.planT = 0; } }
        break;
      }
    }

    // Leash back home when the player is long gone.
    if (!this.boss && this.state === 'engage' && G.player.alive) {
      const hd = Math.hypot(this.pos.x - this.home.x, this.pos.z - this.home.z);
      if (hd > (this.elite ? 18 : 24) || d > 28) { this.state = 'return'; this.st = 0; }
    }
    if ((this.state === 'engage' || this.state === 'attack') && !p.alive) { this.endAttack(); this.state = 'return'; }

    this.integrate(dt);
    this.animate(dt);
  }

  // Choose an attack when one fits; otherwise follow a movement plan for a while before rethinking.
  updateEngage(dt, d, toP) {
    const G = this.G, T = this.T;
    const ranged = T.style === 'ranged';
    this.faceYaw = toP; this.turnRate = T.track ? T.track * 1.4 : 6;
    if (this.think <= 0) {
      this.think = rand(.16, .3);
      const a = this.pickAttack(d);
      const tokens = G.attackTokens || 0;
      const eager = Math.random() < (T.aggro || .7);
      // A pair of warlords mostly take turns: one presses while the other circles.
      const waiting = this.partner?.alive && this.partner.state === 'attack' && !a?.once && Math.random() < .65;
      if (a && !waiting && (this.boss || this.elite || tokens < 2 || ranged) && (eager || this.boss)) { this.startAttack(a); return; }
    }
    this.planT -= dt;
    if (this.planT <= 0) {
      this.planT = rand(.7, 1.6);
      if (ranged) {
        const [lo, hi] = T.prefer;
        this.plan = d < lo ? 'back' : d > hi ? 'close' : Math.random() < .7 ? 'strafe' : 'shuffle';
      } else {
        const want = Math.min(...T.attacks.map(x => x.range)) * .85;
        const crowded = (G.attackTokens || 0) >= 2 && !this.boss && !this.elite;
        if (d > want + 1) this.plan = 'close';
        else if (crowded) this.plan = d < 3.4 ? 'back' : 'strafe';
        else this.plan = Math.random() < .2 ? 'back' : Math.random() < .7 ? 'strafe' : 'shuffle';
        if (this.plan === 'close') this.planT = rand(.35, .7);
      }
      if (this.plan === 'strafe' && Math.random() < .45) this.strafeDir = -(this.strafeDir || 1);
      this.strafeDir ??= Math.random() < .5 ? -1 : 1;
    }
    const want = Math.min(...T.attacks.map(x => x.range)) * .85;
    if (this.plan === 'close') {
      // Run in, easing off as the gap closes.
      const sp = d > 6 ? T.run : lerp(T.walk * 1.3, T.run, clamp((d - want) / 5, 0, 1));
      this.steer(toP, d < want * .8 ? 0 : sp);
      if (d < want * .9) this.planT = Math.min(this.planT, .1);
    } else if (this.plan === 'back') {
      this.steer(toP + Math.PI, T.walk * 1.1);
    } else if (this.plan === 'strafe') {
      // Circle, while gently holding the preferred distance.
      const hold = ranged ? (T.prefer[0] + T.prefer[1]) / 2 : want;
      const radial = clamp((d - hold) * .35, -.5, .5);
      this.steer(toP + this.strafeDir * (Math.PI / 2 - radial), T.walk * 1.15);
    } else if (this.plan === 'shuffle') {
      // Never stock-still: feint in and ease back out, weight on the balls of the feet.
      const ph = Math.sin(this.st * 3.2 + this.pos.x);
      this.steer(ph > 0 ? toP : toP + Math.PI, T.walk * (.55 + .35 * Math.abs(ph)));
    }

    // Evasive types hop aside when the player swings at them.
    if (T.evasive && G.player.isAttacking && d < 3 && (this.hopCd || 0) < G.time && Math.random() < T.evasive * dt * 4) {
      this.hopCd = G.time + 2.5;
      const side = Math.random() < .5 ? -1 : 1, yaw = toP + side * Math.PI / 2;
      this.impulse.x += Math.sin(yaw) * 7; this.impulse.z += Math.cos(yaw) * 7;
      this.pulseAnim('hop');
      this.kplay('hop', 1, .03);
    }
  }

  // Ask to move this frame; integrate() blends the velocity in smoothly.
  steer(yaw, speed, face = true) {
    let y = yaw + (this.stuck > .4 ? this.detour : 0);
    this.want.set(Math.sin(y) * speed, 0, Math.cos(y) * speed);
    if (face && this.state !== 'engage') { this.faceYaw = y; this.turnRate = 7; }
  }

  integrate(dt) {
    const T = this.T, big = this.boss || this.elite;
    const accel = (big ? 9 : 16) * dt;
    const dvx = this.want.x - this.vel.x, dvz = this.want.z - this.vel.z, dv = Math.hypot(dvx, dvz);
    if (dv > 1e-4) { const k = Math.min(1, accel / dv); this.vel.x += dvx * k; this.vel.z += dvz * k; }
    const ox = this.pos.x, oz = this.pos.z;
    this.pos.x += (this.vel.x + this.impulse.x) * dt; this.pos.z += (this.vel.z + this.impulse.z) * dt;
    const id = Math.exp(-7 * dt); this.impulse.x *= id; this.impulse.z *= id;
    this.G.world.collide(this.pos, this.radius);
    // Detour around corners we keep bumping into.
    const moved = Math.hypot(this.pos.x - ox, this.pos.z - oz), wanted = Math.hypot(this.want.x, this.want.z) * dt;
    if (wanted > .001 && moved < wanted * .3) { this.stuck += dt; if (this.stuck > .4 && !this.detour) this.detour = (Math.random() < .5 ? -1 : 1) * 1.1; }
    else if (this.stuck > 0) { this.stuck = Math.max(0, this.stuck - dt * .5); if (this.stuck === 0) this.detour = 0; }
    this.speedNow = dt > 0 ? moved / dt : 0;
    // Turn with angular inertia rather than snapping.
    if (this.faceYaw !== null) {
      const diff = angleDiff(this.yaw, this.faceYaw);
      const wantVel = clamp(diff * 10, -this.turnRate, this.turnRate);
      this.yawVel = damp(this.yawVel, wantVel, 14, dt);
    } else this.yawVel = damp(this.yawVel, 0, 10, dt);
    this.yaw += this.yawVel * dt;
  }

  updateDead(dt) {
    this.fadeT += dt;
    if (this.pos.y > 0) { this.deadVy -= 24 * dt; this.pos.y = Math.max(0, this.pos.y + this.deadVy * dt); }
    if (this.fadeT > 1.1) {
      this.mat.transparent = true;
      this.mat.opacity = Math.max(0, 1 - (this.fadeT - 1.1) / 1);
      if (Math.random() < .5) this.G.fx.motes({ x: this.pos.x, y: this.height * .4, z: this.pos.z }, 0xffc070, 1, this.radius, 1.2, .1, 1);
      for (const m of this.crown?.userData.mats || []) { m.transparent = true; m.opacity = this.mat.opacity; }
    }
    if (this.fadeT > 2.2) { this.active = false; this.outer.visible = false; }
  }

  // A one-off jolt layered on top of the pose springs (hits, hops, deflects).
  pulseAnim(kind, k = 1) {
    const v = this.animVel;
    if (kind === 'hit') { v.pitch -= 7 * k; v.twist += (Math.random() - .5) * 8 * k; v.sq -= 2 * k; }
    if (kind === 'heavy') { v.pitch -= 12 * k; v.twist += (Math.random() - .5) * 12 * k; v.sq -= 3.5 * k; }
    if (kind === 'deflected') { v.pitch -= 10 * k; v.aL += 10 * k; v.aR += 10 * k; }
    if (kind === 'hop') { v.roll += (Math.random() < .5 ? -1 : 1) * 6; v.hop += 3; }
  }

  // ------------------------------------------------ procedural animation
  animate(dt) {
    const c = this.cur, v = this.animVel, t = this.G.time, s = this.step;
    const tg = this.tg;
    for (const key in tg) tg[key] = key === 'sq' ? 1 : 0;
    const spd = this.speedNow || 0;
    let omega = 9, walk = Math.min(1.25, spd / 2.4);
    const E = x => smooth(clamp(x, 0, 1));
    switch (this.state) {
      case 'sleep':
        tg.pitch = .3; tg.sq = .86; tg.aL = .25; tg.aR = .25; tg.roll = Math.sin(t * 1.3) * .03; omega = 4;
        tg.cPi = .35 + Math.sin(t * 1.1 + this.pos.x) * .05; tg.hPi = .5; tg.eL = tg.eR = -.5; tg.kL = tg.kR = .7;
        if (Math.random() < dt * .8) this.G.fx.motes({ x: this.pos.x, y: this.height * .9, z: this.pos.z }, 0x9fb8ff, 1, .1, .4, .06, 1.5);
        break;
      case 'idle':
      case 'return':
      case 'patrol':
        tg.pitch = .04 + Math.sin(t * 1.7 + this.pos.x) * .02; tg.twist = Math.sin(t * .6 + this.pos.z) * .06; tg.sq = 1 + Math.sin(t * 2.1 + this.pos.x) * .012;
        // Breathing, a slouch, and a slow look around.
        tg.cPi = .06 + Math.sin(t * 2.1 + this.pos.x) * .04; tg.hYaw = Math.sin(t * .45 + this.pos.z) * .7; tg.hPi = Math.sin(t * .3 + this.pos.x) * .12;
        tg.eL = tg.eR = -.3; tg.aL = -.1; tg.aR = -.1; tg.kL = tg.kR = .08; break;
      case 'engage':
        // Guard up: knees bent, weapon arm raised and cocked, one foot forward, shifting weight.
        tg.pitch = .08; tg.twist = Math.sin(t * .9 + this.pos.z) * .05 - .12; tg.aL = -.55; tg.aR = -.4; tg.sq = .97 + Math.sin(t * 3 + this.pos.x) * .012;
        tg.cPi = .14 + Math.sin(t * 3.2 + this.pos.x) * .03; tg.cTw = -.15 + Math.sin(t * 1.3 + this.pos.z) * .1;
        tg.eL = -1 + Math.sin(t * 2.3 + this.pos.x) * .15; tg.eR = -.85; tg.aLz = -.15; tg.aRz = .15;
        tg.sL = -.35; tg.sR = .25; tg.kL = .38 + Math.sin(t * 3.2 + this.pos.x) * .06; tg.kR = .45; tg.roll = Math.sin(t * 1.6 + this.pos.z) * .05; break;
      case 'alert': tg.pitch = -.2; tg.aL = tg.aR = -.6; tg.sq = 1.05; omega = 12; tg.cPi = -.2; tg.hPi = -.25; tg.eL = tg.eR = -.8; tg.kL = tg.kR = .3; break;
      case 'intro': tg.pitch = -.4 + Math.sin(t * 20) * .04 * (this.st > .6 ? 1 : 0); tg.aL = tg.aR = -1.6; tg.aLz = .7; tg.aRz = -.7; tg.cPi = -.35; tg.hPi = -.45; tg.eL = tg.eR = -.9; tg.kL = tg.kR = .35; tg.sL = -.3; tg.sR = .3; break;
      case 'hurt': tg.pitch = -.25; tg.twist = .15; omega = 12; walk = 0; tg.cPi = -.35; tg.cTw = .25; tg.hPi = -.35; tg.aL = .3; tg.aR = -.5; tg.eL = -.2; tg.eR = -.9; tg.kL = tg.kR = .45; tg.sL = .15; tg.sR = -.2; break;
      case 'broken': tg.pitch = .45 + Math.sin(t * 3) * .05; tg.sq = .88; tg.aL = tg.aR = .3; tg.roll = Math.sin(t * 2.3) * .1; walk = 0; omega = 7;
        tg.cPi = .5; tg.hPi = .45 + Math.sin(t * 2.3) * .15; tg.hYaw = Math.sin(t * 1.7) * .4; tg.eL = tg.eR = -.1; tg.kL = tg.kR = .8;
        if (Math.random() < dt * 8) this.G.fx.motes({ x: this.pos.x, y: this.height * .95, z: this.pos.z }, 0xffe070, 1, .3, .2, .1, .6);
        break;
      case 'grappled': tg.pitch = -.35 - this.grappleK * .4; tg.sq = .95; tg.aL = tg.aR = -.8; omega = 14; walk = 0; tg.cPi = -.4; tg.hPi = -.5; tg.eL = tg.eR = -1.2; tg.kL = tg.kR = .5; break;
      case 'air': tg.pitch = -.7 + Math.sin(t * 7) * .15; tg.roll = Math.sin(t * 5) * .25; tg.aL = -1.3; tg.aR = -.4; tg.aLz = .7; tg.aRz = -.7; tg.sq = .95; omega = 10; walk = 0;
        tg.cPi = -.4; tg.hPi = -.3; tg.eL = -.9; tg.eR = -.3; tg.kL = 1.1; tg.kR = .5; tg.sL = -.6; tg.sR = .2; break;
      case 'down': {
        const up = clamp((this.st - (this.downDur - .45)) / .45, 0, 1);
        tg.pitch = -1.4 * (1 - up); tg.sq = .9 + up * .1; tg.aL = tg.aR = -.4 * (1 - up); tg.hop = -this.height * .12 * (1 - up); omega = up > 0 ? 12 : 8; walk = 0;
        tg.cPi = -.25 * (1 - up) + .3 * up * (1 - up) * 4; tg.hPi = -.4 * (1 - up); tg.kL = .9 * (1 - up) + .6 * up * (1 - up) * 4; tg.kR = .4; tg.eL = tg.eR = -.6; break;
      }
      case 'dead': tg.pitch = -1.45; tg.sq = .9; tg.aL = tg.aR = -.4; omega = 5; walk = 0; tg.hop = -this.height * .12; tg.cPi = .2; tg.hPi = -.3; tg.kL = .7; tg.kR = .3; tg.eL = -.4; break;
      case 'attack': {
        walk *= .3;
        const w = this.phase === 'windup' ? E(this.pt / this.stepDur.windup) : 1;
        const a = this.phase === 'active' ? E(this.pt / this.stepDur.active) : this.phase === 'recover' ? 1 : 0;
        const r = this.phase === 'recover' ? E(this.pt / this.stepDur.recover) : 0;
        const mix = (wind, act) => lerp(lerp(0, wind, w), act, a) * (1 - r);
        const mixS = (wind, act) => 1 + mix(wind - 1, act - 1);   // squash is neutral at 1
        omega = this.phase === 'active' ? 26 : this.phase === 'windup' ? 11 : 8;
        switch (s.anim) {
          // Every swing coils the torso and cocks the elbows in the windup, then uncoils and extends through the blow.
          case 'swing':
            tg.twist = mix(-.6, .5); tg.pitch = mix(-.15, .3); tg.aL = mix(-1.7, -1.1); tg.aR = mix(-.8, -.5); tg.aLz = mix(-.6, .4); tg.sq = mixS(1.03, .96);
            tg.cTw = mix(-.8, .75); tg.cPi = mix(-.1, .25); tg.eL = mix(-1.5, -.1); tg.eR = mix(-1.1, -.5); tg.sL = mix(-.25, -.55); tg.sR = mix(.3, .35); tg.kL = mix(.35, .5); tg.kR = mix(.3, .4); break;
          case 'backswing':
            tg.twist = mix(.6, -.5); tg.pitch = mix(-.1, .28); tg.aL = mix(-1.5, -1.1); tg.aR = mix(-1.2, -.6); tg.aLz = mix(.5, -.4); tg.sq = mixS(1.03, .96);
            tg.cTw = mix(.8, -.75); tg.cPi = mix(-.05, .25); tg.eL = mix(-1.4, -.15); tg.eR = mix(-1.2, -.4); tg.sL = mix(-.4, -.5); tg.sR = mix(.35, .3); tg.kL = mix(.4, .5); tg.kR = .35; break;
          case 'overhead':
            tg.pitch = mix(-.4, .5); tg.aL = tg.aR = mix(-2.1, -.7); tg.sq = mixS(1.08, .86);
            tg.cPi = mix(-.45, .6); tg.hPi = mix(-.3, .2); tg.eL = tg.eR = mix(-1.7, -.05); tg.sL = mix(-.2, -.5); tg.sR = mix(.25, .35); tg.kL = mix(.25, .7); tg.kR = mix(.25, .6); break;
          case 'thrust':
            tg.pitch = mix(-.1, .3); tg.fwd = mix(-.25, .35) * this.size; tg.aL = mix(.2, -1.6); tg.aR = mix(.1, -1.2); tg.twist = mix(-.3, .1); tg.sq = mixS(.96, 1.03);
            tg.cTw = mix(-.55, .25); tg.cPi = mix(-.05, .3); tg.eL = mix(-1.6, 0); tg.eR = mix(-1.3, -.1); tg.sL = mix(-.15, -.8); tg.sR = mix(.2, .5); tg.kL = mix(.45, .35); tg.kR = mix(.3, .15); break;
          case 'spin':
            tg.twist = mix(.9, .9); tg.sq = mixS(.9, .95); tg.aL = tg.aR = mix(-1.2, -1.5); tg.aLz = mix(-.8, -1.2); tg.aRz = mix(.8, 1.2);
            tg.cTw = mix(.4, .2); tg.eL = tg.eR = mix(-.8, -.1); tg.kL = tg.kR = mix(.5, .4); tg.sL = -.2; tg.sR = .2;
            tg.spin = this.phase === 'active' ? -E(this.pt / this.stepDur.active) * TAU : 0; break;
          case 'leap':
            tg.sq = this.phase === 'windup' ? lerp(1, .82, w) : this.phase === 'active' ? 1.04 : lerp(.88, 1, r);
            tg.pitch = this.phase === 'windup' ? .3 * w : this.phase === 'active' ? -.2 + a * .8 : .5 * (1 - r);
            tg.aL = tg.aR = this.phase === 'active' ? lerp(-2, -.5, a) : mix(.4, -.4);
            tg.eL = tg.eR = this.phase === 'active' ? lerp(-1.5, -.1, a) : -.6; tg.cPi = this.phase === 'active' ? lerp(-.4, .5, a) : .3 * w;
            tg.kL = tg.kR = this.phase === 'windup' ? 1.1 * w : this.phase === 'active' ? lerp(1.2, .3, a) : .8 * (1 - r); break;
          case 'shoot':
            tg.twist = mix(.35, .3); tg.aL = mix(-1.5, -1.4); tg.aR = mix(-1.3, -.9); tg.pitch = mix(-.05, .05);
            tg.cTw = mix(.5, .45); tg.eL = mix(-.2, -.05); tg.eR = mix(-1.8, -1.9); tg.sL = -.35; tg.sR = .3; tg.kL = tg.kR = .3; break;
          case 'throw':
            tg.aL = mix(-2, -.5); tg.pitch = mix(-.3, .3); tg.twist = mix(-.5, .4);
            tg.cTw = mix(-.8, .6); tg.cPi = mix(-.3, .35); tg.eL = mix(-1.8, -.05); tg.sL = mix(-.1, -.6); tg.sR = mix(.3, .4); tg.kL = mix(.3, .5); tg.kR = .35; break;
          case 'cast':
            tg.aL = tg.aR = mix(-1.7, -1.2); tg.aLz = mix(-.5, -.2); tg.aRz = mix(.5, .2); tg.pitch = mix(-.3, .25); tg.sq = mixS(1.05, .95);
            tg.cPi = mix(-.35, .3); tg.hPi = mix(-.35, .1); tg.eL = tg.eR = mix(-1.2, -.2); tg.kL = tg.kR = mix(.2, .45); tg.sL = -.2; tg.sR = .2;
            if (this.phase === 'windup') this.G.fx.motes({ x: this.pos.x, y: this.height * .9, z: this.pos.z }, 0xb060ff, 1, .4, .6, .12, .6);
            break;
          case 'roar':
            tg.pitch = -.35 + Math.sin(t * 24) * .05; tg.aL = tg.aR = -1.6; tg.aLz = .8; tg.aRz = -.8; tg.sq = 1.08;
            tg.cPi = -.5; tg.hPi = -.55; tg.eL = tg.eR = -1.1; tg.kL = tg.kR = .45; tg.sL = -.3; tg.sR = .3; break;
          case 'burrow':
            tg.pitch = this.phase === 'recover' ? -.4 * (1 - r) : .6 * w; tg.aL = tg.aR = this.phase === 'recover' ? -1.4 * (1 - r) : -1.2 * w; tg.sq = this.phase === 'recover' ? 1 + .15 * (1 - r) : 1 - .2 * w;
            tg.kL = tg.kR = this.phase === 'recover' ? .6 * (1 - r) : 1.1 * w; tg.cPi = this.phase === 'recover' ? -.3 * (1 - r) : .5 * w; break;
        }
        break;
      }
    }
    // The head finds the knight whenever the foe is fighting.
    if (this.aware && this.state !== 'dead' && this.state !== 'down') {
      const p = this.G.player;
      tg.hYaw = clamp(angleDiff(this.yaw, yawTo(this.pos.x, this.pos.z, p.pos.x, p.pos.z)), -1.1, 1.1);
      tg.hPi += clamp((this.height * .8 - 1.2 - p.pos.y) / Math.max(1, this.distToPlayer()), -.5, .5);
    }
    // Locomotion: a gait driven by distance travelled, so feet don't skate; lean into speed and turns.
    this.gait += spd * dt / (.85 * this.size) * Math.PI;
    const g = this.gait;
    const wk = walk > .02 || Math.abs(this.yawVel) > .8 ? Math.max(walk, Math.min(.35, Math.abs(this.yawVel) * .15)) : 0;
    if (wk) {
      tg.pitch += .07 * wk;
      tg.hop += Math.abs(Math.sin(g)) * .07 * wk * this.size;
      tg.roll += Math.sin(g) * .05 * wk;
    }
    tg.roll += clamp(-this.yawVel * spd * .02, -.2, .2);

    // Critically-damped-ish springs per channel (a little overshoot for follow-through).
    const zeta = .72, o2 = omega * omega;
    for (const key in tg) {
      if (key === 'spin') { c.spin = tg.spin; continue; }
      // Implicit spring step: stable at any frame rate.
      const x = c[key], vel = v[key];
      const f = 1 + 2 * dt * zeta * omega, hoo = dt * o2, hhoo = dt * hoo, inv = 1 / (f + hhoo);
      c[key] = (f * x + dt * vel + hhoo * tg[key]) * inv;
      v[key] = (vel + hoo * (tg[key] - x)) * inv;
    }
    if (this.state === 'attack' && s?.anim === 'leap' && this.phase === 'active') c.hop = Math.sin(clamp(this.pt / this.stepDur.active, 0, 1) * Math.PI) * 4;
    if (this.state === 'attack' && s?.burrow) {
      // Sink through the floor, travel unseen, burst back up.
      const H = this.height * 1.25, D = this.stepDur;
      c.hop = this.phase === 'windup' ? -H * smooth(clamp(this.pt / D.windup, 0, 1)) : this.phase === 'active' ? -H
        : -H * Math.max(0, 1 - this.pt / (D.recover * .3)) + Math.sin(clamp(this.pt / (D.recover * .5), 0, 1) * Math.PI) * .4;
      v.hop = 0;
    }

    this.outer.rotation.y = this.yaw;
    // The hips take part of every twist and the chest the rest, so blows wind up through the body.
    // A knight-shaped foe's own actions carry the motion; the springs only add a little weight.
    const kk = this.kn ? .3 : 1;
    const bodyTw = c.twist * .45 * kk + (this.kn ? 0 : c.spin), chestTw = c.twist * .7 + c.cTw;
    // Walking: the chest counter-rotates against the stride and the arms swing opposite the legs.
    const run = clamp((spd - 2.6) / 2.4, 0, 1), sg = Math.sin(g), attacking = this.state === 'attack';
    // Local velocity: strafing steps sideways instead of marching.
    const fwdV = Math.cos(this.yaw) * this.vel.z + Math.sin(this.yaw) * this.vel.x, sideV = Math.cos(this.yaw) * this.vel.x - Math.sin(this.yaw) * this.vel.z;
    const vv = Math.max(.3, Math.hypot(fwdV, sideV)), fk = wk * (fwdV / vv >= -.2 ? 1 : -1) * Math.max(.35, Math.abs(fwdV) / vv), sk = wk * clamp(sideV / vv, -1, 1);
    const crouch = (Math.max(0, c.kL) + Math.max(0, c.kR)) * .5;
    this.lean.rotation.set((c.pitch + run * .12 * wk) * kk, bodyTw, c.roll * kk);
    this.lean.position.y = .45 * this.height + c.hop - crouch * this.height * .06;
    this.lean.position.z = c.fwd;
    const sq = clamp(c.sq, .6, 1.3);
    const sqk = 1 + (sq - 1) * kk;
    this.model.scale.set(1 / Math.sqrt(sqk), sqk, 1 / Math.sqrt(sqk));
    if (this.kn) this.animKnight(dt, spd, run);
    const B = this.bones;
    if (B.chest) B.chest.rotation.set(c.cPi + run * .1 * wk, chestTw + sg * .16 * wk * (1 - run * .3), -c.roll * .4 + sk * sg * .06);
    if (B.head) B.head.rotation.set(clamp(c.hPi - c.pitch * .5 - c.cPi * .6, -.8, .8), clamp(c.hYaw - bodyTw - chestTw - sg * .16 * wk, -1.2, 1.2), 0);
    const [aL, aR] = this.arms, [lL, lR] = this.legs, [fL, fR] = this.fore, [kL, kR] = this.shins;
    const armSw = attacking ? 0 : sg * (.45 + run * .35) * fk;
    if (aL) {
      aL.rotation.set(clamp(c.aL + armSw, -2.3, 1), 0, clamp(c.aLz - Math.abs(sk) * .1, -1.2, 1.2));
      aR.rotation.set(clamp(c.aR - armSw, -2.3, 1), 0, clamp(c.aRz + Math.abs(sk) * .1, -1.2, 1.2));
    }
    if (fL) {
      const bend = attacking ? 0 : -(.15 + run * .5) * wk;   // runners pump bent arms
      fL.rotation.x = clamp(c.eL + bend - Math.max(0, sg) * .25 * wk, -2.3, .05);
      fR.rotation.x = clamp(c.eR + bend - Math.max(0, -sg) * .25 * wk, -2.3, .05);
    }
    if (lL) {
      // Thighs swing with the stride (forward is negative); knees fold as each foot comes through.
      const A = (.5 + run * .3), K = .75 + run * .65;
      const kneeL = Math.max(0, c.kL) + Math.max(0, Math.sin(g + 1.3)) * K * wk + .06 * wk;
      const kneeR = Math.max(0, c.kR) + Math.max(0, Math.sin(g + 1.3 + Math.PI)) * K * wk + .06 * wk;
      lL.rotation.set(c.sL - sg * A * fk - kneeL * .45, 0, sk * sg * .3 - .03);
      lR.rotation.set(c.sR + sg * A * fk - kneeR * .45, 0, -sk * sg * .3 + .03);
      if (kL) { kL.rotation.x = kneeL; kR.rotation.x = kneeR; }
    }

    // Hit flash and dread glow.
    const burst = this.burstGlow > 0 ? .7 + Math.sin(t * 30) * .3 : 0;
    if (burst > 0) { this.mat.emissive.setRGB(1, .12, .08); this.mat.emissiveIntensity = .5 + burst * .6; }
    else if (this.state === 'broken') { this.mat.emissive.setRGB(1, .85, .4); this.mat.emissiveIntensity = .15 + Math.sin(t * 8) * .08; }
    else if (this.chantT > this.G.time) {   // war-chanted: an ember glow
      this.mat.emissive.setRGB(1, .3, .15); this.mat.emissiveIntensity = .22 + Math.sin(t * 6 + this.pos.x) * .08 + this.flash * 1.4;
      if (Math.random() < dt * 10) this.G.fx.motes({ x: this.pos.x, y: this.height * .6, z: this.pos.z }, 0xff5030, 1, this.radius, 1, .1, .6);
    } else if (this.T.shade) { this.mat.emissive.setRGB(.5, .38, 1); this.mat.emissiveIntensity = .45 + this.flash * 1.4; }
    else { this.mat.emissive.copy(this.emi); this.mat.emissiveIntensity = (this.T.glow ?? this.G.level?.enemyGlow ?? .08) + this.flash * 1.4; }
    if (this.armored) this.shell.material.emissiveIntensity = .6 + Math.sin(t * 3) * .15 + this.flash * .8;
    if (this.crown?.userData.spin) this.crown.rotation.y = t * this.crown.userData.spin;
  }

  // The knight's animator runs the legs, arms and blade; enemy logic only picks which action plays.
  animKnight(dt, spd, run) {
    const K = this.kn, A = K.anim, s = this.step;
    const fwdV = Math.cos(this.yaw) * this.vel.z + Math.sin(this.yaw) * this.vel.x, sideV = Math.cos(this.yaw) * this.vel.x - Math.sin(this.yaw) * this.vel.z;
    const sp = Math.hypot(fwdV, sideV);
    if (this.state === 'broken' && !A.action) A.play('stagger', .45, .1);
    if (this.state === 'dead' && A.name !== 'death') A.play('death', 1, .05);
    A.update(dt, { speed: ['engage', 'patrol', 'return', 'alert', 'idle'].includes(this.state) ? spd / this.T.scale : 0, forward: sp > .1 ? fwdV / sp : 1, side: sp > .1 ? sideV / sp : 0,
      sprint: run > .5 && this.state === 'engage', stance: 'mid', weapon: this.T.weapon || 'sword', shifted: this.phase2 });
    const swinging = this.state === 'attack' && s && !s.blink && (this.phase === 'active' || (this.phase === 'recover' && this.pt < .12) || (this.phase === 'windup' && this.pt > this.stepDur.windup * .7));
    if (swinging) { K.k.root.updateMatrixWorld(true); K.k.base.getWorldPosition(_v); const b = _v.clone(); K.k.tip.getWorldPosition(_v); K.trail.add(b, _v, this.G.time); }
    K.trail.update(this.G.time);
  }
}
