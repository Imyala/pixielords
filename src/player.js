// The Pixie Lord's controller.
// Three weapons, each fighting its own way in each of three stances (High / Mid / Low): a form per stance
// with a standing chain, a moving chain and a pause combo, finishers out of the chain, a slide attack and air
// strikes (movesets.js). Switching weapons as a strike ends turns into a Switch Strike. A combo counter builds
// damage and finishers spend it. A fae dash with afterimages (a perfect dash triggers Moonstep slow time, and a
// strike straight after it is a Moonstep Riposte); at a sprint, a slide, a Wingleap out of it and a wing glide.
// Guard and perfect-guard Deflect, the Flashcut draw-cut that follows a Deflect or a Thorn Counter, Resonance
// (tap guard as a strike ends to win back stamina), executions, ambushes, Moondew flasks and the Fae Shift.
import * as THREE from 'three';
import { buildKnight, KnightAnimator, ACTIONS } from './knight.js';
import './moveanims.js';
import './armoryanims.js';
import { ARMORY, ARMORY_MOVES } from './armory.js';
import { FORMS, KIT, MOVES, NAMES, SLIDE, LEAP, GLIDE, COMBO, CHAIN } from './movesets.js';
import { FORGE } from './save.js';
import { ARTS, ARTS_ORDER, DART, BOMB, BRAND } from './arts.js';
import { Trail } from './fx.js';
import { clamp, lerp, damp, angleDiff, turnTowards, yawTo, smooth, rand } from './util.js';

export const STANCES = {
  high: { key: 'high', name: 'High', speed: 1.12, dmg: 1.32, cost: 1.25, ki: 1.4, guard: .9, dash: { dist: .88, dur: 1.1, cost: 1.15 }, color: 0xffb060 },
  mid: { key: 'mid', name: 'Mid', speed: 1.38, dmg: 1, cost: 1, ki: 1, guard: .7, dash: { dist: 1, dur: 1, cost: 1 }, color: 0x8ff0ff },
  low: { key: 'low', name: 'Low', speed: 1.75, dmg: .74, cost: .7, ki: .75, guard: 1.15, dash: { dist: 1.12, dur: .92, cost: .75 }, color: 0x9dff9a },
};

// Weapons: a heavy per stance, running and dashing strikes, and the Switch Strike that
// comes out when the weapon is drawn as a strike ends. speed and cost scale the stance values.
export const WEAPONS = {
  sword: { id: 'sword', name: 'Fae Sword', desc: 'Quick and close; the surest blade for Deflects and Flashcuts.', speed: 1, cost: 1, heavy: { high: 'skyfall', mid: 'heavy', low: 'needle' }, run: 'run', dash: 'dashSlash', switch: 'swSword', color: 0x9ff3ff, airReach: 1, airDmg: 1 },
  glaive: { id: 'glaive', name: 'Moonglaive', desc: 'A polearm: long reach, wide sweeps, heavy posture damage; heavies charge.', speed: .92, cost: 1.08, heavy: { high: 'g_moonfall', mid: 'g_crescent', low: 'g_pierce' }, run: 'gRun', dash: 'gDash', switch: 'swGlaive', color: 0xc9b4ff, airReach: 1.3, airDmg: 1.1 },
  // Fastest of the three and lightest on stamina; every hit builds Frenzy (below).
  fangs: { id: 'fangs', name: 'Twin Fangs', desc: 'A blade in each hand: quickest of the blades, flurries that hit again and again, and Frenzy.', speed: 1.16, cost: .8, heavy: { high: 'f_xfall', mid: 'f_whirl', low: 'f_viper' }, run: 'fRun', dash: 'fDash', switch: 'swFangs', color: 0xffb4c8, airReach: .95, airDmg: 1.2 },
  // Slowest and hungriest for stamina, but hard to stop: Stalwart (below). Its slams shake foes off their feet.
  hammer: { id: 'hammer', name: 'Thornhammer', desc: 'Slow and hungry for stamina, but Stalwart: blows can\'t stagger a swing. Its slams trip foes.', speed: .8, cost: 1, heavy: { high: 'hHeavyH', mid: 'hHeavyM', low: 'hHeavyL' }, run: 'hRun', dash: 'hDash', switch: 'swHammer', color: 0xffcf8a, airReach: 1.1, airDmg: 1.1 },
  // Fists and feet: the quickest of all; every hit wins back a little stamina and bites posture (Flow).
  fists: { id: 'fists', name: 'Starfists', desc: 'Punches and kicks, quickest of all; every hit wins back stamina and breaks posture (Flow).', speed: 1.2, cost: .9, heavy: { high: 'xHeavyH', mid: 'xHeavyM', low: 'xHeavyL' }, run: 'xRun', dash: 'xDash', switch: 'swFists', color: 0x9fe8ff, airReach: .9, airDmg: 1.15 },
};
WEAPONS.glaive.mech = 'Charge'; WEAPONS.glaive.mechDesc = 'hold a heavy to charge it, up to 1.8× as hard';
WEAPONS.fangs.mech = 'Frenzy'; WEAPONS.fangs.mechDesc = 'every hit stacks speed and damage, up to six';
WEAPONS.hammer.mech = 'Stalwart'; WEAPONS.hammer.mechDesc = 'mid-swing, ordinary blows can\'t stagger you and land for a fifth less';
WEAPONS.fists.mech = 'Flow'; WEAPONS.fists.mechDesc = 'every hit wins back stamina and breaks posture 30% harder';
// The armory's fifteen (armory.js): same shape, fighting with the strikes of their hold. One-handed ones
// take the sword's two-handed strikes one-handed ('oh:' variants), the off hand free for shield or guard.
for (const [id, A] of Object.entries(ARMORY)) {
  WEAPONS[id] = { id, name: A.name, desc: A.desc, speed: A.speed, cost: A.cost, dmg: A.dmg, reach: A.reach, heavy: A.heavy, run: A.run, dash: A.dash, switch: A.switch,
    color: A.color, airReach: A.airReach, airDmg: A.airDmg, names: A.names, mech: A.mech, mechDesc: A.mechDesc, oneHand: ['aegis', 'rapier', 'ring', 'hexblade', 'katana'].includes(id) };
  FORMS[id] = A.forms; KIT[id] = { fin: A.fin, slide: A.slide, air: A.air };
}
// Mechanics of the armory: Iai's wait, Bleed's burst, Hex charge, the thrown weapons.
const IAI = { wait: 1.2, mul: 1.6 }, HEX = { per: 2, max: 3, dmg: 48, speed: 18 };
const GRIND = new Map();   // Grinder's Wheel versions of strikes, made once each
// Stalwart (Thornhammer): mid-swing, ordinary blows land for a fifth less and can't stagger the knight.
// Flow (Starfists): every hit returns 3 stamina and deals 30% more posture damage.
const STALWART = { dmg: .8 }, FLOW = { ki: 3, posture: 1.3 };
// Frenzy (Twin Fangs): each hit within 1.4 s of the last adds a stack, up to six; each stack is 5% faster
// strikes and 4% more damage.
const FRENZY = { max: 6, keep: 1.4, speed: .05, dmg: .04 };
const ORDER = ['low', 'mid', 'high'];

// Times are in animation seconds; the stance speed scales them. hit: active frames. chain: earliest next strike.
export const ATK = {
  light1: { anim: 'light1', dur: .62, hit: [.19, .31], dmg: 40, ki: 24, poise: 10, cost: 13, reach: 2.4, arc: 160, move: .7, chain: .3, next: 'light2' },
  light2: { anim: 'light2', dur: .6, hit: [.17, .29], dmg: 40, ki: 24, poise: 10, cost: 13, reach: 2.4, arc: 160, move: .7, chain: .28, next: 'light3' },
  light3: { anim: 'light3', dur: .78, hit: [.3, .4], dmg: 52, ki: 32, poise: 18, cost: 15, reach: 2.4, arc: 80, move: .9, chain: .46, next: 'light4' },
  light4: { anim: 'light4', dur: .8, hit: [.2, .5], dmg: 58, ki: 34, poise: 22, cost: 17, reach: 2.6, arc: 360, move: .6, chain: .64, next: 'light1' },
  heavy: { anim: 'heavy', dur: 1.0, hit: [.53, .63], dmg: 90, ki: 58, poise: 32, cost: 26, reach: 2.6, arc: 90, move: 1.2, chain: .74, next: 'heavy', heavy: true },
  skyfall: { anim: 'skyfall', dur: 1.05, hit: [.55, .64], dmg: 118, ki: 75, poise: 45, cost: 30, reach: 2.6, arc: 110, move: 2.2, chain: .84, next: 'heavy', heavy: true, aoe: 2.4 },
  needle: { anim: 'needle', dur: .72, hit: [.2, .4], dmg: 62, ki: 40, poise: 24, cost: 18, reach: 2.8, arc: 50, move: 4.4, chain: .5, next: 'heavy', heavy: true, fixedMove: true },
  run: { anim: 'light3', dur: .78, hit: [.3, .4], dmg: 56, ki: 30, poise: 20, cost: 16, reach: 2.4, arc: 80, move: 3.2, chain: .5, next: 'light2', fixedMove: true },
  dashSlash: { anim: 'light2', dur: .6, hit: [.15, .29], dmg: 48, ki: 26, poise: 14, cost: 12, reach: 2.5, arc: 170, move: 1.8, chain: .3, next: 'light3' },
  swSword: { anim: 'light4', dur: .8, hit: [.18, .48], dmg: 56, ki: 38, poise: 22, cost: 8, reach: 2.6, arc: 360, move: .8, chain: .6, next: 'light1' },
  // Moonglaive: longer reach and wider arcs, heavier on posture. Heavies can be held to charge.
  g1: { anim: 'g_thrust', dur: .55, hit: [.16, .28], dmg: 44, ki: 28, poise: 12, cost: 14, reach: 3.4, arc: 50, move: .6, chain: .3, next: 'g2' },
  g2: { anim: 'g_sweep', dur: .64, hit: [.2, .34], dmg: 46, ki: 30, poise: 14, cost: 15, reach: 3.2, arc: 200, move: .5, chain: .36, next: 'g3' },
  g3: { anim: 'g_spin', dur: .8, hit: [.2, .5], dmg: 52, ki: 32, poise: 18, cost: 17, reach: 3.1, arc: 360, move: .4, chain: .6, next: 'g4' },
  g4: { anim: 'g_vault', dur: .95, hit: [.48, .58], dmg: 70, ki: 46, poise: 30, cost: 20, reach: 3.0, arc: 110, move: 2.0, chain: .74, next: 'g1', aoe: 2.2, aoeAt: 2.1 },
  g_crescent: { anim: 'g_crescent', dur: 1.15, hit: [.34, .62], dmg: 96, ki: 64, poise: 40, cost: 28, reach: 3.5, arc: 360, move: .6, chain: .9, next: 'g_crescent', heavy: true, charge: .28 },
  g_moonfall: { anim: 'g_moonfall', dur: 1.25, hit: [.62, .72], dmg: 124, ki: 82, poise: 50, cost: 32, reach: 3.0, arc: 110, move: 3.4, chain: .98, next: 'g_moonfall', heavy: true, aoe: 3.0, aoeAt: 2.3, charge: .22 },
  g_pierce: { anim: 'g_pierce', dur: .85, hit: [.22, .46], dmg: 72, ki: 46, poise: 28, cost: 20, reach: 3.6, arc: 40, move: 5.2, chain: .6, next: 'g_pierce', heavy: true, fixedMove: true, charge: .12 },
  gRun: { anim: 'g_thrust', dur: .55, hit: [.16, .28], dmg: 50, ki: 30, poise: 16, cost: 15, reach: 3.4, arc: 50, move: 3.2, chain: .36, next: 'g2', fixedMove: true },
  gDash: { anim: 'g_sweep', dur: .64, hit: [.18, .34], dmg: 50, ki: 30, poise: 16, cost: 13, reach: 3.2, arc: 200, move: 1.6, chain: .36, next: 'g3' },
  swGlaive: { anim: 'g_spin', dur: .8, hit: [.18, .48], dmg: 58, ki: 40, poise: 22, cost: 8, reach: 3.2, arc: 360, move: .8, chain: .56, next: 'g1' },
  // Twin Fangs: light, quick and many. multi: the hit window re-arms every so often, so one strike hits again.
  f1: { anim: 'f_slash1', dur: .44, hit: [.1, .2], dmg: 26, ki: 14, poise: 5, cost: 9, reach: 2.2, arc: 150, move: .6, chain: .2, next: 'f2' },
  f2: { anim: 'f_slash2', dur: .44, hit: [.1, .2], dmg: 26, ki: 14, poise: 5, cost: 9, reach: 2.2, arc: 150, move: .6, chain: .2, next: 'f3' },
  f3: { anim: 'f_cross', dur: .56, hit: [.14, .28], dmg: 34, ki: 20, poise: 8, cost: 11, reach: 2.3, arc: 120, move: .8, chain: .3, next: 'f4' },
  f4: { anim: 'f_spin', dur: .8, hit: [.12, .6], dmg: 18, ki: 10, poise: 4, cost: 14, reach: 2.4, arc: 360, move: .6, chain: .62, next: 'f1', multi: .12 },
  f_whirl: { anim: 'f_whirl', dur: 1.0, hit: [.2, .8], dmg: 20, ki: 12, poise: 6, cost: 22, reach: 2.6, arc: 360, move: 1.8, chain: .84, next: 'f_whirl', heavy: true, multi: .1 },
  f_xfall: { anim: 'f_xfall', dur: .95, hit: [.5, .6], dmg: 96, ki: 56, poise: 34, cost: 24, reach: 2.4, arc: 110, move: 2.4, chain: .76, next: 'f_xfall', heavy: true, aoe: 1.8, aoeAt: 1.6 },
  f_viper: { anim: 'f_viper', dur: .8, hit: [.12, .46], dmg: 28, ki: 16, poise: 10, cost: 18, reach: 2.2, arc: 140, move: 6, chain: .6, next: 'f_viper', heavy: true, fixedMove: true, pass: true, multi: .1 },
  fRun: { anim: 'f_slash1', dur: .44, hit: [.1, .2], dmg: 30, ki: 16, poise: 6, cost: 10, reach: 2.2, arc: 150, move: 3.2, chain: .24, next: 'f2', fixedMove: true },
  fDash: { anim: 'f_cross', dur: .56, hit: [.12, .28], dmg: 36, ki: 20, poise: 8, cost: 10, reach: 2.3, arc: 130, move: 1.8, chain: .3, next: 'f4' },
  swFangs: { anim: 'f_spin', dur: .8, hit: [.1, .56], dmg: 22, ki: 14, poise: 5, cost: 6, reach: 2.4, arc: 360, move: .8, chain: .56, next: 'f1', multi: .12 },
};
// Air combat, shared by both weapons (the glaive reaches further): the launcher (guard + strike) throws the
// knight and ordinary foes skyward, up to four air strikes keep them hanging, and a heavy is the Starfall.
Object.assign(ATK, {
  launch: { anim: 'launch', dur: .62, hit: [.14, .28], dmg: 42, ki: 30, poise: 20, cost: 22, reach: 2.4, arc: 140, move: .6, chain: .3, next: 'air1', launch: 10.5 },
  air1: { anim: 'air1', dur: .42, hit: [.08, .2], dmg: 34, ki: 20, poise: 8, cost: 9, reach: 2.4, arc: 170, move: .5, chain: .2, next: 'air2', air: true },
  air2: { anim: 'air2', dur: .42, hit: [.08, .2], dmg: 34, ki: 20, poise: 8, cost: 9, reach: 2.4, arc: 170, move: .5, chain: .2, next: 'air3', air: true },
  air3: { anim: 'air3', dur: .6, hit: [.12, .38], dmg: 46, ki: 28, poise: 12, cost: 12, reach: 2.5, arc: 360, move: .4, chain: .42, next: 'air1', air: true },
  plunge: { anim: 'plunge', dur: 1.2, hit: [9, 9], dmg: 88, ki: 60, poise: 40, cost: 14, reach: 2.8, arc: 360, move: 0, chain: 9, next: 'air1', heavy: true, plunge: true, aoe: 2.8 },
});
// The stance forms' strikes, finishers, slide attacks and each weapon's air strikes.
Object.assign(ATK, MOVES, ARMORY_MOVES);
for (const [k, n] of Object.entries(NAMES)) if (ATK[k]) ATK[k].name ||= n;
const AIR = { rise: 10.5, g: 26, hang: 7, plungeG: 80, maxStrikes: 4, dash: { dur: .26, dist: 3.4, iframes: [0, .2] } };
const CHARGE = { max: .7 };  // seconds a heavy can be held; a full charge hits 1.8× as hard
const DASH = { dur: .36, dist: 4.4, iframes: [0, .24], cost: 13, perfect: .16, attackAt: .15, chainAt: .22 };
const HOP = { dur: .32, dist: 2.4, iframes: [0, .2], cost: 9 };
const THORN = { dur: .5, window: [.02, .32], cost: 10 };
const DEFLECT = .2;          // seconds after pressing guard in which a blow is deflected
const RIPOSTE_WINDOW = .9;   // seconds after a Moonstep in which a strike becomes a Moonstep Riposte
const FLASH_WINDOW = .5;     // seconds after a deflect in which a strike becomes a Flashcut

export function derive(stats) {
  return {
    maxHp: 300 + 32 * (stats.vit - 1),
    maxKi: 100 + 9 * (stats.end - 1),
    dmgMul: 1 + .075 * (stats.str - 1),
    animaGain: 1 + .12 * (stats.spi - 1),
    shiftDur: 12 + (stats.spi - 1) * 1,
  };
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _UP = new THREE.Vector3(0, 1, 0);

// Afterimages: translucent copies of the knight that hold a pose and fade.
class Ghosts {
  constructor(scene, k, n = 6) {
    this.src = []; k.root.traverse(o => this.src.push(o));
    this.pool = [];
    for (let i = 0; i < n; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const root = k.root.clone(true), dst = [];
      root.traverse(o => { dst.push(o); if (o.isMesh) { o.material = mat; o.castShadow = false; o.receiveShadow = false; } });
      root.visible = false;
      scene.add(root);
      this.pool.push({ root, dst, mat, t: 1, dur: .3 });
    }
    this.i = 0;
  }
  spawn(color, dur = .3, alpha = .45) {
    const g = this.pool[this.i]; this.i = (this.i + 1) % this.pool.length;
    const { src } = this;
    for (let j = 0; j < src.length; j++) {
      const s = src[j], d = g.dst[j];
      d.position.copy(s.position); d.quaternion.copy(s.quaternion); d.scale.copy(s.scale);
      d.visible = s.visible && !s.isSprite;
    }
    g.root.visible = true; g.t = 0; g.dur = dur; g.alpha = alpha; g.mat.color.setHex(color);
  }
  update(dt) {
    for (const g of this.pool) {
      if (!g.root.visible) continue;
      g.t += dt;
      g.mat.opacity = g.alpha * Math.max(0, 1 - g.t / g.dur);
      if (g.t >= g.dur) g.root.visible = false;
    }
  }
}

export class Player {
  constructor(G) {
    this.G = G;
    this.k = buildKnight();
    this.anim = new KnightAnimator(this.k);
    G.scene.add(this.k.root);
    this.k.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.ghosts = new Ghosts(G.scene, this.k);
    this.pos = this.k.root.position;
    this.vel = new THREE.Vector3();
    this.radius = .38;
    this.trail = new Trail(G.scene, 0x9ff3ff);
    this.trail2 = new Trail(G.scene, 0xffb4c8);   // the off-hand fang
    this.frenzy = { n: 0, t: -9 };
    // A pixie wisp rides at the knight's shoulder and lights the dark around them.
    this.wisp = new THREE.Group();
    this.wispLight = new THREE.PointLight(0xd8ecff, 5, 11, 1.4);
    const ws = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.k.glow.material.map, color: 0xcff6ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    ws.scale.setScalar(.35);
    const wc = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.wisp.add(this.wispLight, ws, wc);
    G.scene.add(this.wisp);
    this.wispPos = new THREE.Vector3();
    this.yaw = 0;
    this.stance = 'mid';
    this.arms = ['sword']; this.loadout = ['sword']; this.forge = {}; this.weapon = 'sword';
    this.arts = ['darts']; this.art = 'darts'; this.artUses = {}; this.shots = []; this.brand = null;
    this.stats = { vit: 1, end: 1, str: 1, spi: 1 };
    this.applyStats();
    this.spawnAt(0, 0, 0);
  }

  applyStats() {
    Object.assign(this, derive(this.stats));
    if (this.has('gateseal')) this.maxHp = Math.round(this.maxHp * 1.1);
    if (this.has('seereye')) this.animaGain *= 1.25;
    if (this.has('wintercrown')) this.shiftDur *= 1.33;
    // Every Lost Pixie freed lends its light: a hundredth more health and stamina each.
    const px = this.G.save?.data.pixies?.length || 0;
    this.maxHp = Math.round(this.maxHp * (1 + px * .01)); this.maxKi = Math.round(this.maxKi * (1 + px * .01));
  }
  // Worn charms (see charms.js).
  has(charm) { return !!this.charms?.has(charm); }
  setCharms(list) { this.charms = new Set(list); const hp = this.hp / (this.maxHp || 1); this.applyStats(); if (this.hp) this.hp = Math.min(this.maxHp, Math.round(this.maxHp * hp)); }

  spawnAt(x, z, yaw) {
    this.pos.set(x, 0, z); this.yaw = yaw; this.vel.set(0, 0, 0);
    this.hp = this.maxHp; this.ki = this.maxKi; this.anima = this.anima ?? 0;
    this.state = 'free'; this.st = 0; this.alive = true; this.heading = yaw;
    this.poison = 0; this.poisoned = 0; this.snared = 0; this.chill = 0; this.frozen = 0; this.vy = 0; this.airCount = 0; this.airDashed = false;
    this.buffer = null; this.pulse = null; this.lock = null; this.flash = null; this.riposte = null; this.chain = 0; this.chargeMul = 1;
    this.cmb = { list: null, kind: null, form: null, i: 0, step: 0, until: -9, pauseAt: 9e9, cued: false };   // the chain in progress
    this.combo = { n: 0, t: -9 };   // the combo counter
    this.carry = null; this.waves = []; this.glideT = 0; this.gliding = false; this.wasSprinting = false; this.pressT = 0;
    this.brand = null; this.refillArts();
    for (const s of this.shots) this.dropShot(s); this.shots = [];
    this.shifted = false; this.iframes = false; this.iframesT = 0; this.guarding = false;
    this.exhaustPending = false; this.kiSpentT = -9; this.guardPressT = -9;
    this.anim.stop();
    this.k.root.rotation.y = yaw;
    this.setShiftLook(false);
  }

  get isAttacking() { return this.state === 'attack'; }
  get moving() { return Math.hypot(this.vel.x, this.vel.z) > .5; }
  get S() { return STANCES[this.stance]; }
  get W() { return WEAPONS[this.weapon]; }

  // Draw a weapon (the rest ride on the back).
  setWeapon(id) {
    if (!WEAPONS[id] || !this.arms.includes(id)) id = this.loadout[0] || this.arms[0] || 'sword';
    this.weapon = id;
    this.k.setWeapon(id, this.loadout);
    this.refreshLook();
    this.G.hud?.weapon?.(id);
  }

  // Switch to the next weapon carried. As a strike ends (or out of a dash) it becomes a Switch Strike.
  swapWeapon(strike = false) {
    const G = this.G;
    const other = this.loadout.find(w => w !== this.weapon && this.arms.includes(w));
    if (!other) { if (!this.oneArmToast) { this.oneArmToast = true; G.hud.toast(this.arms.length > 1 ? 'Carry a second weapon: choose it in the Arsenal' : 'You carry only one weapon'); } return false; }
    const resonant = this.pulse && G.time <= this.pulse.close;
    this.resetChain();
    this.setWeapon(other);
    G.save.data.wield = this.weapon;
    G.fx.ring(this.pos, this.W.color, 1.9, .3, .1);
    G.audio.sfx('stance', { pitch: this.weapon === 'glaive' ? .7 : 1.1 });
    if (strike && (this.ki > 0 || this.shifted)) {
      if (resonant) this.doPulse(true);
      this.startAttack(this.W.switch);
      this.ghosts.spawn(this.W.color, .4, .55);
      G.hud.toast('Switch Strike', 'pulse');
    } else {
      this.setState('swap'); this.anim.play('swap', 1.3, .04);
    }
    return true;
  }

  setState(s) { this.state = s; this.st = 0; if (s !== 'free') this.wasSprinting = false; }

  // ------------------------------------------------ resources
  spendKi(cost, pulseable = true) {
    if (this.shifted) cost *= .25;
    this.ki -= cost;
    this.kiSpentT = this.G.time;
    if (this.ki <= 0 && !this.shifted) { this.ki = Math.max(this.ki, -15); this.exhaustPending = true; }
    this.pulseAmount = pulseable ? cost : 0;
  }

  openPulse() {
    if (!this.pulseAmount) return;
    const t = this.G.time;
    this.pulse = { open: t, perfect: t + .22, close: t + (this.has('echo') ? .7 : .55), amount: this.pulseAmount };
    this.pulseAmount = 0;
  }

  // Resonance: tapped in time after a strike, the spent stamina flows back.
  doPulse(stanceShift = false) {
    const G = this.G, perfect = G.time <= this.pulse.perfect;
    const gain = this.pulse.amount * (perfect ? 1.1 : .6) * (this.has('echo') ? 1.2 : 1);
    this.ki = Math.min(this.maxKi, this.ki + gain);
    if (this.ki > 0) this.exhaustPending = false;
    this.gainAnima(perfect ? 6 : 3);
    this.pulse = null;
    G.fx.ring(this.pos, stanceShift ? this.S.color : 0x7ff0ff, 2.2, .35);
    G.fx.motes({ x: this.pos.x, y: .6, z: this.pos.z }, 0x9ff3ff, 18, .6, 2.2, .1, .7);
    G.audio.sfx('pulse', { vol: perfect ? 1 : .6 });
    G.hud.toast(stanceShift ? 'Resonant Shift' : perfect ? 'Perfect Resonance' : 'Resonance', 'pulse');
  }

  gainAnima(n) {
    if (this.shifted) return;
    const before = this.anima;
    this.anima = Math.min(100, this.anima + n * this.animaGain);
    if (before < 100 && this.anima >= 100) { this.G.hud.toast(`Faelight full — ${this.G.hud.key('shift')} to Fae Shift`, 'anima'); this.G.audio.sfx('heal', { vol: .5 }); }
  }

  heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); }

  // Standing in flames: steady damage, no stagger.
  burn(dmg) {
    const G = this.G;
    if (this.shifted) { this.anima -= dmg * .5; if (this.anima <= 0) this.endShift(); return; }
    if (this.has('emberwing')) dmg *= .5;
    this.hp -= dmg; this.burnedT = G.time;
    G.hud.screenFlash('hurt'); G.audio.sfx('playerHurt', { vol: .35 });
    if (this.hp <= 0) this.die();
  }

  addPoison(n) {
    if (this.poisoned > 0 || !this.alive) return;
    this.poison += n * (this.has('rootbound') ? .5 : 1);
    if (this.poison >= 100) { this.poison = 0; this.poisoned = 12; this.G.hud.toast('Blighted', 'poison'); this.G.audio.sfx('poison'); }
  }

  // Frost: icy blows and freezing ground build chill; at full the knight is Frostbitten for a while,
  // slow on the feet and slow to catch breath. Moondew or a Moonwell thaws it.
  addChill(n) {
    if (this.frozen > 0 || !this.alive || this.shifted) return;
    this.chill += n * (this.has('hearthstone') ? .5 : 1);
    this.chillT = this.G.time;
    if (this.chill >= 100) {
      this.chill = 0; this.frozen = 6;
      this.G.hud.toast('Frostbitten', 'frost'); this.G.audio.sfx('chill');
      this.G.fx.shatter({ x: this.pos.x, y: 1.1, z: this.pos.z }, 18, 0xcfeaff, 3);
    }
  }
  thaw() { this.chill = 0; this.frozen = 0; }

  // A foe turned the blade aside: the arm jars back and the guard opens for a moment.
  recoil(from) {
    const G = this.G;
    if (!this.alive || this.state === 'flashcut' || this.state === 'grapple') return;
    this.setState('hurt'); this.hurtDur = .55;
    this.anim.play('hurt', 1.1, .02);
    if (from) this.knock = { yaw: yawTo(from.pos.x, from.pos.z, this.pos.x, this.pos.z), v: 3.5 };
    this.pulse = null; this.chain = 0; this.resetChain();
    G.hitstop = Math.max(G.hitstop, .08); G.cam.shake(.25);
  }

  // Bolas and nets: legs bound, no sprinting until they fall away or are shaken off with dashes.
  snare(t) {
    if (!this.alive || this.shifted || this.G.time < (this.snareFree ?? 0)) return;
    if (!(this.snared > 0)) { this.G.hud.toast('Snared — dash to break free', 'warn'); this.G.audio.sfx('grapple', { vol: .6 }); }
    this.snared = Math.max(this.snared, t);
  }

  setStance(s) {
    if (s === this.stance || !this.alive || ['rest', 'grapple', 'flashcut', 'dead'].includes(this.state)) return;
    const G = this.G;
    this.stance = s;
    const resonant = this.pulse && G.time <= this.pulse.close;
    if (resonant) this.doPulse(true);
    G.fx.ring(this.pos, this.S.color, 1.6, .25, .08);
    G.audio.sfx('stance', { pitch: s === 'high' ? .8 : s === 'low' ? 1.3 : 1 });
    G.hud.stance(s);
  }

  // ------------------------------------------------ targeting
  candidates(maxD = 20) {
    const G = this.G;
    return G.enemies.filter(e => e.alive && e.outer.visible && e.distToPlayer() < maxD && G.world.los(this.pos, e.pos, 1.4));
  }

  toggleLock() {
    const G = this.G;
    if (this.lock) { this.lock = null; return; }
    const camYaw = G.cam.yaw;
    let best = null, bs = Infinity;
    for (const e of this.candidates()) {
      const ang = Math.abs(angleDiff(camYaw, yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z)));
      if (ang > 1.25) continue;
      const s = ang * 8 + e.distToPlayer();
      if (s < bs) { bs = s; best = e; }
    }
    if (best) { this.lock = best; G.audio.sfx('ui'); }
    else G.cam.recenter(this.yaw);
  }

  switchLock(dir) {
    if (!this.lock) return;
    const G = this.G, camYaw = G.cam.yaw;
    const cur = angleDiff(camYaw, yawTo(this.pos.x, this.pos.z, this.lock.pos.x, this.lock.pos.z));
    let best = null, bd = Infinity;
    for (const e of this.candidates()) {
      if (e === this.lock) continue;
      const a = angleDiff(camYaw, yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z));
      const rel = (cur - a) * dir;   // dir +1 = to the right on screen = more negative yaw
      if (rel <= 0) continue;
      if (rel < bd) { bd = rel; best = e; }
    }
    if (best) { this.lock = best; G.audio.sfx('ui'); }
  }

  updateLock(dt) {
    const e = this.lock;
    if (!e) return;
    if (!e.alive || e.state === 'dead') {
      const next = this.candidates(10).sort((a, b) => a.distToPlayer() - b.distToPlayer())[0];
      this.lock = next || null;
      return;
    }
    if (e.distToPlayer() > 26) { this.lock = null; return; }
    this.lockHidden = this.G.world.los(this.pos, e.pos, 1.4) ? 0 : (this.lockHidden || 0) + dt;
    if (this.lockHidden > 2) this.lock = null;
  }

  // Nearest foe the knight is facing (or locked on), for lunges and soft aim.
  focusTarget(maxD = 4.5) {
    if (this.lock && this.lock.alive && this.lock.distToPlayer() < maxD + 2) return this.lock;
    let best = null, bd = maxD;
    for (const e of this.G.enemies) {
      if (!e.alive) continue;
      const d = e.distToPlayer() - e.radius;
      if (d < bd && Math.abs(angleDiff(this.yaw, yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z))) < 1.1) { bd = d; best = e; }
    }
    return best;
  }

  findCrit() {
    const G = this.G;
    let best = null, bd = Infinity;
    for (const e of G.enemies) {
      if (!e.alive) continue;
      const d = e.distToPlayer() - e.radius;
      if (d > 3.2) continue;
      const toE = yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z);
      const facing = Math.abs(angleDiff(this.lock === e ? toE : (this.inputYaw ?? this.yaw), toE)) < 1.4;
      if (e.state === 'broken' && facing && d < bd) { best = { e, kind: 'execute' }; bd = d; continue; }
      if (!e.aware && !e.boss && !e.elite && d < 1.8) {
        const behind = Math.abs(angleDiff(e.yaw, yawTo(e.pos.x, e.pos.z, this.pos.x, this.pos.z))) > 2.1;
        if (behind && facing && d < bd) { best = { e, kind: 'ambush' }; bd = d; }
      }
    }
    return best;
  }

  // ------------------------------------------------ actions
  tryStart(a, from = null) {
    const G = this.G;
    if (a === 'light' || a === 'heavy') {
      // A strike inside the Flashcut window after a deflect becomes a Flashcut.
      if (this.flash && G.time <= this.flash.until && this.flash.e?.alive && this.flash.e.distToPlayer() < 5.5) return this.startFlashcut(this.flash.e);
      // A strike straight after a Moonstep blinks behind the attacker: the Moonstep Riposte.
      const r = this.riposte;
      if (r && G.time <= r.until && r.e.alive && r.e.distToPlayer() < 7.5) return this.startFlashcut(r.e, 'riposte');
      const airborne = this.pos.y > .3;
      if (airborne) {
        if (this.ki <= 0 && !this.shifted) return false;
        if (a === 'heavy') return this.startAttack('plunge');
        if (this.airCount >= AIR.maxStrikes) return false;
        this.airCount++;
        return this.startAttack(from === 'chain' && this.atk?.air && ATK[this.atk.next]?.air ? this.atk.next : KIT[this.weapon].air);
      }
      const crit = this.findCrit();
      if (crit) return this.startExecution(crit.e, crit.kind);
      if (this.ki <= 0 && !this.shifted) return false;
      // Guard held + strike: the launcher.
      if (a === 'light' && from !== 'dash' && from !== 'slide' && G.controlsOn && G.input.down('guard')) { this.resetChain(); return this.startAttack('launch'); }
      return this.startAttack(a === 'heavy' ? this.pickHeavy(from) : this.pickLight(from));
    }
    if (a === 'swap') return this.swapWeapon(from === 'strike');
    if (a === 'art') return this.startArt();
    if (a === 'dodge') {
      if (this.ki <= 0 && !this.shifted) return false;
      return this.pos.y > .3 ? this.startAirDash() : this.startDash();
    }
    if (a === 'burst') {
      if (this.ki <= 0 && !this.shifted) return false;
      this.spendKi(THORN.cost, false);
      this.setState('thorn'); this.anim.play('burst', 1.2, .03);
      this.faceTarget(true);
      G.audio.sfx('swing', { vol: .5 });
      G.fx.flash(_a.set(this.pos.x, 1.2, this.pos.z), 0xff6ad5, 1.4, .25, true);
      return true;
    }
    if (a === 'heal') {
      if (this.elixirs <= 0) { G.hud.toast('No Moondew left'); return false; }
      this.elixirs--; this.healed = false;
      this.setState('drink'); this.anim.play('drink', 1.25);
      G.audio.sfx('drink');
      return true;
    }
    if (a === 'shift') {
      if (this.anima < 100 || this.shifted) { if (!this.shifted) G.hud.toast('Faelight is not yet full'); return false; }
      this.setState('shift'); this.anim.play('shift', 1.3);
      G.audio.sfx('shift');
      G.cam.shake(.4);
      return true;
    }
    return false;
  }

  // ------------------------------------------------ chains and forms
  // Striking on the move (toward a locked foe, when locked) takes the form's moving chain.
  movingForward() {
    if (this.inputYaw === null) return false;
    if (!this.lock) return true;
    return Math.abs(angleDiff(this.inputYaw, yawTo(this.pos.x, this.pos.z, this.lock.pos.x, this.lock.pos.z))) < 1.1;
  }
  get form() { return FORMS[this.weapon][this.stance]; }
  newChain(kind) {
    const c = this.cmb, F = this.form;
    kind ||= this.movingForward() ? 'forward' : 'neutral';
    Object.assign(c, { kind, form: F, list: F[kind], i: 0, step: 1, cued: false });
    return c;
  }
  resetChain() { Object.assign(this.cmb, { list: null, kind: null, step: 0, cued: false }); }
  chainLive() { const c = this.cmb; return !!c.list && c.form === this.form && this.G.time <= c.until; }

  // The next light strike: the next place in the chain, the pause combo, or a run, dash or slide strike.
  pickLight(from) {
    const W = this.W, F = this.form, c = this.cmb, live = this.chainLive();
    if (from === 'slide') { this.resetChain(); return KIT[this.weapon].slide; }
    if (!live && (from === 'dash' || (from === null && this.wasSprinting))) {
      // Run and dash strikes open a chain; the next strike carries on from its second place.
      this.newChain(from === 'dash' ? null : 'forward');
      return from === 'dash' ? W.dash : W.run;
    }
    if (!live) return this.newChain().list[0];
    // After two strikes, a strike held back a beat (past the glint) is the form's pause combo.
    if (c.kind !== 'pause' && c.step >= 2 && this.pressT >= c.pauseAt && from !== 'dash') {
      Object.assign(c, { kind: 'pause', list: [F.pause], i: 0 }); c.step++;
      return F.pause;
    }
    c.i++; c.step++;
    if (c.i >= c.list.length) {
      // The chain loops, re-reading standing or moving; after a pause combo it starts over.
      const step = c.kind === 'pause' ? 1 : c.step;
      this.newChain(); c.step = step;
    }
    // A strike out of a dash keeps the chain going and takes this place in it (NieR's dodge offset).
    return from === 'dash' ? W.dash : c.list[c.i];
  }

  // The next heavy: a finisher straight out of the chain (by how many strikes came first), else the stance's heavy.
  pickHeavy(from) {
    const c = this.cmb, live = this.chainLive();
    let key = this.W.heavy[this.stance];
    if (live && c.step >= 1 && from !== 'dash' && from !== 'slide') key = KIT[this.weapon].fin[Math.min(c.step, 3) - 1];
    else if (from === 'chain' && this.atk?.heavy && !this.atk.fin && ATK[this.atk.next]?.heavy) key = this.atk.next;
    this.resetChain();
    return key;
  }

  // A weapon's own name for a strike, else the strike's.
  moveName(key, w = this.weapon) { return WEAPONS[w]?.names?.[key] || ATK[key]?.name || key; }

  startAttack(key) {
    const G = this.G, S = this.S, wid = this.weapon;
    let a = ATK[key];
    // Grind (Grinder's Wheel): every strike keeps biting while it lasts, lighter per bite.
    if (wid === 'saw' && !a.multi && !a.hurl && !a.plunge && !a.launch) a = GRIND.get(key) || GRIND.set(key, { ...a, multi: .11, dmg: a.dmg * .42, ki: a.ki * .55, poise: a.poise * .5 }).get(key);
    const slideV = this.state === 'slide' ? this.slideSpeed() : 0;
    // Momentum (Warblade) counts the strikes of the chain; a finisher keeps the count it was fed.
    this.momN = wid === 'great' ? (this.cmb.list ? this.cmb.step : a.fin ? this.momN || 1 : 0) : 0;
    // Iai (Rimeblade): after a wait the next strike on the ground is a draw-cut.
    this.iaiMul = wid === 'katana' && this.iaiReady && !a.air ? IAI.mul : 1; this.iaiReady = false;
    this.hexFire = wid === 'hexblade' && (a.heavy || a.fin) && this.hexN > 0 ? this.hexN : 0;
    if (this.hexFire) this.hexN = 0;
    this.hurled = false;
    this.atk = a; this.atkKey = key; this.hitSet = new Set(); this.multiBeat = -1; this.atkT0 = G.time;
    this.aspeed = S.speed * this.W.speed * (this.shifted ? 1.15 : 1) * (1 + this.frenzy.n * FRENZY.speed) * (a.speed || 1);
    this.setState('attack');
    this.anim.play(this.W.oneHand && ACTIONS['oh:' + a.anim] ? 'oh:' + a.anim : a.anim, this.aspeed, .04);
    if (this.iaiMul > 1) { this.k.tip.getWorldPosition(_b); G.fx.flash(_b, 0xdff4ff, 1.6, .3, true); G.audio.sfx('flashDraw', { vol: .6 }); }
    this.spendKi(a.cost * S.cost * this.W.cost * (a.launch && this.has('skyward') ? .6 : 1));
    this.chargeT = 0; this.chargeDone = false; this.chargeMul = 1;
    this.launchedUp = false;
    if (a.air) this.vy = Math.max(this.vy, 2.6);   // each air strike holds the knight up a moment
    if (a.plunge) { this.vy = Math.min(this.vy, -6); this.lock && (this.yaw = yawTo(this.pos.x, this.pos.z, this.lock.pos.x, this.lock.pos.z)); G.audio.sfx('swingHeavy'); }
    this.faceTarget(true);
    // Close the gap to the foe in front, within reason; charges always travel their full length.
    const t = this.focusTarget();
    if (a.fixedMove || !t) this.lungeDist = a.move + slideV * .3;   // a slide attack carries the slide on
    else this.lungeDist = clamp(t.distToPlayer() - (t.radius + a.reach * .55), a.move * .2, a.move + 1.4);
    this.lunged = 0;
    this.swung = false;
    this.pulse = null;
    this.waveDone = false;
    const c = this.cmb;
    if (c.list) {
      c.until = G.time + a.dur / this.aspeed + CHAIN.keep;
      c.pauseAt = G.time + Math.max(a.chain / this.aspeed + CHAIN.pause, a.hit[1] / this.aspeed + .2);
      c.cued = false;
    }
    // Finishers spend the combo counter; they and pause combos call out their names.
    this.finMul = 1;
    if (a.fin) {
      const n = this.combo.n;
      this.finMul = 1 + Math.min(COMBO.finMax, n * COMBO.fin); this.combo.n = 0;
      G.hud.toast(n >= 4 ? `${this.moveName(key)} ×${this.finMul.toFixed(1)}` : this.moveName(key), 'anima');
    } else if (c.kind === 'pause' && c.list?.[0] === key) G.hud.toast(this.moveName(key), 'pulse');
    return true;
  }

  startDash() {
    const G = this.G, S = this.S;
    this.pulse = null;
    this.sprintArmed = true;
    this.moonstepped = false;
    if (this.inputYaw === null) {
      this.spendKi(HOP.cost * S.dash.cost * (this.has('quickstep') ? .67 : 1) * (this.has('shadowsilk') ? .5 : 1));
      this.setState('hop'); this.anim.play('hop', 1, .03);
      this.dashYaw = this.yaw + Math.PI;
      this.dash = { dur: HOP.dur, dist: HOP.dist * S.dash.dist, iframes: HOP.iframes };
    } else {
      this.spendKi(DASH.cost * S.dash.cost * (this.has('quickstep') ? .67 : 1) * (this.has('shadowsilk') ? .5 : 1));
      this.setState('dash');
      this.dashYaw = this.inputYaw;
      const dur = DASH.dur * S.dash.dur;
      this.dash = { dur, dist: DASH.dist * S.dash.dist * (this.frozen > 0 ? .8 : 1), iframes: [0, DASH.iframes[1] * S.dash.dur + (this.stance === 'low' ? .04 : 0)] };
      this.anim.play('dash', DASH.dur / dur, .02);
      if (!this.lock) this.yaw = this.inputYaw;
      G.fx.dust(this.pos, 5);
    }
    this.dashed = 0; this.ghostT = 0;
    if (this.snared > 0) { this.snared -= 1.1; if (this.snared <= 0) { this.snareFree = G.time + 3; G.hud.toast('Broke free', 'pulse'); } }
    G.audio.sfx('roll');
    return true;
  }

  // A slide out of a sprint: low and fast, carrying the run's speed.
  startSlide() {
    const G = this.G, sp = Math.hypot(this.vel.x, this.vel.z);
    this.slideYaw = sp > 1 ? Math.atan2(this.vel.x, this.vel.z) : this.inputYaw ?? this.yaw;
    this.slideV = Math.max(SLIDE.min, sp * SLIDE.boost);
    this.spendKi(SLIDE.cost, false);
    this.setState('slide'); this.anim.play('slide', 1, .06);
    this.yaw = this.slideYaw; this.pulse = null;
    G.fx.dust(this.pos, 8); G.audio.sfx('slide');
    return true;
  }
  slideSpeed() { return this.slideV * Math.exp(-SLIDE.drag * this.st); }

  // Wingleap: out of a slide, a long dive up and forward on the wings; the slide's speed carries into it.
  startLeap() {
    const G = this.G;
    if (this.ki <= 0 && !this.shifted) return false;
    const yaw = this.slideYaw ?? this.yaw, v = Math.max(LEAP.speed, this.slideSpeed());
    this.spendKi(LEAP.cost, false);
    this.setState('air'); this.anim.play('leap', 1, .04);
    this.vy = LEAP.vy; this.carry = { x: Math.sin(yaw) * v, z: Math.cos(yaw) * v };
    this.vel.set(0, 0, 0); this.yaw = yaw;
    this.airCount = 0; this.airDashed = false; this.glideT = 0;
    this.ghosts.spawn(this.S.color, .45, .5);
    G.fx.dust(this.pos, 14); G.fx.ring(this.pos, 0xcff6ff, 1.8, .3);
    G.audio.sfx('leap');
    return true;
  }

  // A crescent of moonlight thrown on from a strike: it runs along the ground and cuts what it passes.
  spawnWave(a) {
    const w = a.wave;
    this.waves.push({ x: this.pos.x, z: this.pos.z, yaw: this.yaw, d: .6, len: w.len, speed: w.speed, w: w.w, color: w.color, fxT: 0, hit: new Set(),
      atk: { ...a, dmg: a.dmg * w.dmg, ki: a.ki * w.dmg, poise: a.poise * w.dmg, multi: 0, last: 0, pop: 0, wave: null, aoe: 0 } });
    this.G.audio.sfx('wave');
  }
  updateWaves(dt) {
    const G = this.G;
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const W = this.waves[i], d0 = W.d, sx = Math.sin(W.yaw), sz = Math.cos(W.yaw);
      W.d = Math.min(W.len, W.d + W.speed * dt);
      const fx = W.x + sx * W.d, fz = W.z + sz * W.d;
      if (!G.world.los(W, { x: fx, z: fz }, 1)) W.d = W.len;   // walls stop it
      W.fxT -= dt;
      if (W.fxT <= 0) {
        W.fxT = .03;
        G.fx.arc({ x: fx - sx * 1.1, z: fz - sz * 1.1 }, W.yaw, 1.5, 120, W.color, .9, 0, .3);
        G.fx.motes({ x: fx, y: .8, z: fz }, W.color, 2, .5, .4, .08, .5);
      }
      const inPath = (x, z, r) => {
        const rx = x - W.x, rz = z - W.z, along = rx * sx + rz * sz;
        return along >= d0 - .6 && along <= W.d + .4 && Math.abs(rx * sz - rz * sx) <= W.w + r;
      };
      for (const e of G.enemies) {
        if (!e.alive || W.hit.has(e) || e.state === 'grappled' || e.pos.y > 2.5 || !inPath(e.pos.x, e.pos.z, e.radius)) continue;
        W.hit.add(e); this.strike(e, W.atk, W.yaw, false);
      }
      for (const b of G.world.breakables) if (!b.broken && !W.hit.has(b) && inPath(b.x, b.z, b.r)) { W.hit.add(b); G.world.hitBreakable(b, 3, W.yaw); }
      if (W.d >= W.len) this.waves.splice(i, 1);
    }
  }

  // One short dash per jump, hanging in the air.
  startAirDash() {
    const G = this.G;
    if ((this.airDashed || 0) >= (this.has('windstep') ? 2 : 1)) return false;
    this.airDashed = (this.airDashed || 0) + 1;
    this.spendKi(DASH.cost * .8 * (this.has('quickstep') ? .67 : 1));
    this.setState('airdash'); this.anim.play('dash', 1.3, .03);
    this.dashYaw = this.inputYaw ?? this.yaw;
    this.dash = { ...AIR.dash }; this.dashed = 0; this.ghostT = 0; this.vy = 0;
    if (!this.lock && this.inputYaw !== null) this.yaw = this.inputYaw;
    G.audio.sfx('roll');
    return true;
  }

  land() {
    const G = this.G;
    this.pos.y = 0; this.vy = 0; this.airDashed = false; this.airCount = 0; this.glideT = 0; this.gliding = false;
    if (this.carry) { this.vel.set(this.carry.x, 0, this.carry.z); this.carry = null; }   // land running
    if (this.state === 'attack' && this.atk.plunge) return this.plungeImpact();
    if (this.state === 'air' || this.state === 'airdash' || (this.state === 'attack' && (this.atk.air || this.atk.launch))) {
      this.setState('free'); this.anim.play('hop', 1.5, .04);
      G.fx.dust(this.pos, 6); G.audio.sfx('step');
    }
  }

  // Starfall: the plunge hits the ground and everything around it; foes still in the air are driven down.
  plungeImpact() {
    const G = this.G, a = this.atk, S = this.S;
    G.fx.ring(this.pos, 0xdff4ff, a.aoe * 1.3, .4); G.fx.ring(this.pos, S.color, a.aoe * .8, .3, .1); G.fx.dust(this.pos, 26);
    G.audio.sfx('slam'); G.cam.shake(.55); G.hitstop = Math.max(G.hitstop, .08);
    for (const e of G.enemies) {
      if (!e.alive || e.state === 'grappled' || e.pos.y > 3) continue;
      if (Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z) > a.aoe + e.radius) continue;
      e.slam();
      if (!this.hitSet.has(e)) this.strike(e, a);
    }
    this.setState('land'); this.anim.play('plungeLand', 1.2, .02);
    G.hud.toast('Starfall', 'pulse');
  }

  startExecution(e, kind) {
    const G = this.G;
    this.pulse = null; this.resetChain();
    this.grapple = { e, kind, hits: 0 };
    e.endAttack(); e.state = 'grappled'; e.st = 0; e.grappleK = 0;
    const toE = yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z);
    this.yaw = toE;
    if (kind === 'ambush') e.yaw = toE;
    const stand = e.radius + .75;
    this.grapple.x = e.pos.x - Math.sin(toE) * stand; this.grapple.z = e.pos.z - Math.cos(toE) * stand;
    this.setState('grapple'); this.anim.play('grapple', 1.25, .04);
    this.iframes = true; this.iframesT = .1;   // nothing may interrupt it on its first frame
    G.hud.toast(kind === 'ambush' ? 'Ambush' : 'Execution', 'crit');
    G.audio.sfx('swingHeavy');
    this.lock = this.lock || e;
    return true;
  }

  // Flashcut: the knight blinks through the foe with one draw-cut.
  startFlashcut(e, kind = 'flash') {
    const G = this.G;
    this.flash = null; this.riposte = null; this.resetChain();
    this.fc = { e, hit: false, kind };
    const toE = yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z);
    const stand = e.radius + 1.1;
    if (kind === 'riposte') {
      // Blink round to the attacker's back and cut from there.
      const back = e.yaw + Math.PI;
      this.fc.x = e.pos.x + Math.sin(back) * stand; this.fc.z = e.pos.z + Math.cos(back) * stand;
      this.yaw = yawTo(this.fc.x, this.fc.z, e.pos.x, e.pos.z);
      this.ghosts.spawn(0xb8c8ff, .5, .7);
      G.fx.ring(this.pos, 0x9fb8ff, 2.5, .3);
    } else {
      this.yaw = toE;
      this.fc.x = e.pos.x - Math.sin(toE) * stand; this.fc.z = e.pos.z - Math.cos(toE) * stand;
    }
    this.setState('flashcut'); this.anim.play('flashcut', 1, .02);
    this.iframes = true; this.iframesT = .9;
    if (e.state === 'attack') e.hurt(.7); else e.endAttack();   // never leave a foe mid-attack with no step
    G.slowmo = Math.max(G.slowmo, .35);
    G.hud.screenFlash('flashcut');
    G.audio.sfx('flashDraw');
    this.ghosts.spawn(0xffffff, .35, .6);
    return true;
  }

  faceTarget(snap) {
    let want = null;
    if (this.lock) want = yawTo(this.pos.x, this.pos.z, this.lock.pos.x, this.lock.pos.z);
    else if (this.inputYaw !== null) want = this.inputYaw;
    else { const t = this.focusTarget(3.5); if (t) want = yawTo(this.pos.x, this.pos.z, t.pos.x, t.pos.z); }
    if (want !== null) this.yaw = snap ? want : turnTowards(this.yaw, want, .25);
  }

  // Enemy-side entry point. Returns 'miss' | 'countered' | 'deflected' | 'blocked' | 'hit'.
  receiveHit(h) {
    const G = this.G;
    if (!this.alive) return 'miss';
    // Moonstep: a dash that starts just before the blow slows the world.
    if ((this.state === 'dash' || this.state === 'hop') && this.st <= DASH.perfect + (this.has('moonpetal') ? .07 : 0) && !this.moonstepped) {
      this.moonstep();
      if (h.from?.alive && !h.projectile && !h.ranged) this.riposte = { e: h.from, until: G.time + RIPOSTE_WINDOW };
      return 'miss';
    }
    if (this.iframes) return 'miss';
    // High in the air, swings and ground shocks pass beneath; thrown things still find you.
    const reachUp = Math.max(1.4, (h.from?.height || 0) * .7);   // big foes can swat the knight out of the air
    if (!h.projectile && (this.pos.y > reachUp || (h.aoe && this.pos.y > .6))) return 'miss';
    // Thorn Counter
    if (this.state === 'thorn' && this.st >= THORN.window[0] && this.st <= THORN.window[1] && !(h.aoe && !h.burst)) {
      const th = this.has('thornheart');
      this.ki = Math.min(this.maxKi, this.ki + (th ? 32 : 20));
      this.gainAnima((h.burst ? 14 : 8) + (th ? 4 : 0));
      G.audio.sfx('burstCounter');
      G.fx.ring(this.pos, 0xff7ae0, 3, .4, 1.1);
      if (h.from && !h.projectile && h.from.alive) {
        if (h.burst) { h.from.countered(true); G.hud.toast('Thorn Counter', 'burst'); this.startFlashcut(h.from); return 'countered'; }
        h.from.countered(false);
        this.flash = { until: G.time + FLASH_WINDOW, e: h.from };
      }
      this.setState('counter'); this.anim.play('counter', 1.2, .02);
      this.iframesT = .4;
      G.hitstop = .09; G.cam.shake(.3);
      G.hud.toast('Counter', 'burst');
      G.hud.screenFlash('burst');
      return 'countered';
    }
    // Guard and Deflect (Dread attacks can't be guarded).
    const facing = this.weapon === 'aegis' || Math.abs(angleDiff(this.yaw, h.dirYaw)) < 1.4;   // Bulwark: a guard from every side
    const recovering = this.state === 'attack' && this.st * this.aspeed >= this.atk.hit[1];
    const window = DEFLECT + (this.has('mirrorguard') ? .06 : 0) + (this.weapon === 'tonfas' ? .1 : this.weapon === 'rapier' ? .05 : 0);
    const justPressed = G.time - this.guardPressT <= window && (['free', 'deflect', 'hurt', 'counter'].includes(this.state) || recovering);
    if ((this.guarding || justPressed) && facing && !h.burst) {
      if (justPressed && !h.aoe) return this.deflect(h);
      const kiDmg = h.dmg * (h.heavy ? 1.05 : .8) * this.S.guard * (this.has('wardstone') ? .75 : 1) * (this.weapon === 'aegis' ? .6 : this.weapon === 'tonfas' ? .7 : 1);
      if (h.chill) this.addChill(h.chill * .35);   // the cold seeps through a guard
      this.ki -= kiDmg; this.kiSpentT = G.time;
      const sp = _a.set(this.pos.x + Math.sin(this.yaw) * .5, 1.25, this.pos.z + Math.cos(this.yaw) * .5);
      G.fx.spark(sp, { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }, 16, 0xffe0a0, 6);
      if (this.ki < 0) {
        this.ki = 0; this.setState('stagger'); this.anim.play('stagger', 1.2);
        G.audio.sfx('guardBreak'); G.hud.toast('Guard broken', 'warn'); G.cam.shake(.4);
        return 'blocked';
      }
      G.audio.sfx('block');
      this.knock = { yaw: h.dirYaw + Math.PI, v: h.heavy ? 5 : 2.5 };
      G.hitstop = .04;
      return 'blocked';
    }
    // Hit.
    let dmg = h.dmg;
    const stalwart = this.state === 'attack' && this.weapon === 'hammer' && !this.atk.air && this.st * this.aspeed < this.atk.hit[1] + .1;
    if (stalwart) dmg *= STALWART.dmg;
    if (this.shifted) {
      this.anima -= dmg * .5;
      dmg = 0;
      G.fx.spark(_a.set(this.pos.x, 1.2, this.pos.z), { x: 0, z: 0 }, 14, 0xff7ae0, 5);
      if (this.anima <= 0) this.endShift();
    }
    this.hp -= dmg;
    this.chain = 0;
    this.resetChain(); this.combo.n = Math.floor(this.combo.n / 2);   // a blow breaks the chain and halves the combo
    if (h.poison) this.addPoison(h.poison);
    if (h.snare) this.snare(h.snare);
    if (h.chill) this.addChill(h.chill);
    G.hitstop = .06;
    G.cam.shake(h.heavy ? .45 : .28);
    G.audio.sfx('playerHurt');
    G.fx.blood(_a.set(this.pos.x, 1.2, this.pos.z), { x: -Math.sin(h.dirYaw), z: -Math.cos(h.dirYaw) }, 14, 0x5a0808);
    G.hud.screenFlash('hurt');
    if (this.hp <= 0) { this.die(); return 'hit'; }
    const armored = (stalwart || (this.state === 'attack' && this.atk.heavy && this.st * this.aspeed > .2 && this.st * this.aspeed < this.atk.hit[1])) && !h.heavy;
    if (!armored && !this.shifted) {
      this.setState('hurt'); this.hurtDur = h.heavy ? .62 : .34;
      this.anim.play(h.heavy ? 'stagger' : 'hurt', h.heavy ? 1.9 : 1.3, .03);
      this.knock = { yaw: h.dirYaw + Math.PI, v: h.heavy ? 6 : 3 };
      this.pulse = null;
    }
    return 'hit';
  }

  deflect(h) {
    const G = this.G;
    this.setState('deflect'); this.anim.play('deflect', 1.3, .02);
    this.ki = Math.min(this.maxKi, this.ki + (this.has('thornheart') ? 20 : 8) + (this.weapon === 'tonfas' ? 10 : 0));
    this.gainAnima(this.has('thornheart') ? 10 : 6);
    const sp = _a.set(this.pos.x + Math.sin(this.yaw) * .6, 1.3, this.pos.z + Math.cos(this.yaw) * .6);
    G.fx.spark(sp, { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }, 34, 0xdff8ff, 9);
    G.fx.flash(sp, 0xffffff, 2.2, .22, true);
    G.audio.sfx('deflect');
    G.hitstop = .1; G.cam.shake(.22);
    if (!h.projectile && h.from?.alive) {
      h.from.deflected(h);
      this.flash = { until: G.time + FLASH_WINDOW, e: h.from };
      G.hud.toast('Deflect', 'pulse');
    }
    return 'deflected';
  }

  moonstep() {
    const G = this.G;
    this.moonstepped = true;
    G.warp = this.has('shadowsilk') ? 1.7 : 1.1;
    if (this.has('moonveil')) this.veilT = G.time + 3;
    this.ki = Math.min(this.maxKi, this.ki + 15);
    this.gainAnima(10);
    G.fx.ring(this.pos, 0x9fb8ff, 3.5, .5);
    this.ghosts.spawn(0xb8c8ff, .6, .7);
    G.audio.sfx('moonstep');
    G.hud.screenFlash('moon');
    G.hud.toast('Moonstep', 'pulse');
  }

  die() {
    const G = this.G;
    this.hp = 0; this.alive = false; this.lock = null;
    this.setState('dead'); this.anim.play('death', 1.2, .05);
    this.endShift(true);
    G.onPlayerDeath();
  }

  startShift() {
    const G = this.G;
    this.shifted = true; this.shiftT = this.shiftDur;
    this.setShiftLook(true);
    G.fx.ring(this.pos, 0xff7ae0, 5, .6);
    G.fx.motes({ x: this.pos.x, y: 1, z: this.pos.z }, 0xff9cf0, 40, 1, 3, .14, 1.2);
    G.hud.toast('Fae Shift', 'anima');
    G.hud.screenFlash('shift');
  }

  endShift(silent = false) {
    if (!this.shifted) return;
    this.shifted = false; this.anima = 0;
    this.setShiftLook(false);
    if (!silent) { this.G.fx.ring(this.pos, 0xff7ae0, 3, .5); this.G.audio.sfx('pulse', { vol: .5 }); }
  }

  setShiftLook(on) {
    const k = this.k;
    k.mats.blade.emissive.setHex(on ? 0xff4ad0 : 0x4fd8ff);
    k.mats.blade.emissiveIntensity = on ? 1.2 : .12;
    k.mats.wing.color.setHex(on ? 0xffb0f0 : 0xffffff);
    k.mats.visor.emissive.setHex(on ? 0xff6ad5 : 0x7ff0ff);
    k.fuller.visible = on;
    this.refreshLook();
  }
  // Trail and blade colour: pink in a Fae Shift, the brand's colour while one lasts, else the weapon's own.
  refreshLook() {
    const k = this.k, b = this.brand && ARTS[this.brand.kind];
    const col = this.shifted ? 0xff6ad5 : b ? b.hex : this.W.color;
    this.trail.mat.uniforms.uColor.value.setHex(col); this.trail2.mat.uniforms.uColor.value.setHex(col);
    k.mats.blade.emissive.setHex(this.shifted ? 0xff4ad0 : b ? b.hex : 0x4fd8ff);
    k.mats.blade.emissiveIntensity = this.shifted ? 1.2 : b ? .9 : .12;
  }

  // What the HUD shows beside the weapon: Frenzy, Hex charges, Iai ready, Momentum.
  weaponNote() {
    if (this.weapon === 'fangs' && this.frenzy.n) return `Frenzy ${this.frenzy.n}`;
    if (this.weapon === 'hexblade' && this.hexN) return `Hex ${this.hexN}`;
    if (this.weapon === 'katana' && this.iaiReady) return 'Iai';
    if (this.weapon === 'great' && this.state === 'attack' && this.momN > 1) return `Momentum +${Math.round(Math.min(.36, .06 * (this.momN - 1)) * 100)}%`;
    return '';
  }

  // ------------------------------------------------ Fae Arts
  refillArts() { for (const id of this.arts) this.artUses[id] = ARTS[id].uses; }
  cycleArt() {
    if (this.arts.length < 2) return;
    const list = ARTS_ORDER.filter(id => this.arts.includes(id));
    this.art = list[(list.indexOf(this.art) + 1) % list.length];
    if (this.G.save?.data) this.G.save.data.artSel = this.art;
    this.G.audio.sfx('ui');
  }
  startArt() {
    const G = this.G, id = this.art, A = ARTS[id];
    if (!A || !this.arts.includes(id)) return false;
    if (!(this.artUses[id] > 0)) { G.hud.toast(`No ${A.name} left — more at a Moonwell`); return false; }
    this.artUses[id]--;
    this.artKind = id; this.artFired = false; this.pulse = null;
    this.setState('art'); this.anim.play(A.brand ? 'brand' : 'throw', 1.2, .04);
    this.faceTarget(true);
    G.audio.sfx(A.brand ? 'magic' : 'swing', { pitch: 1.3, vol: .7 });
    return true;
  }
  fireArt(id) {
    const G = this.G, A = ARTS[id];
    if (A.brand) {
      this.brand = { kind: id, until: G.time + BRAND.dur };
      this.refreshLook();
      G.hud.toast(A.name, 'anima'); G.fx.ring(this.pos, A.hex, 2.2, .4); G.audio.sfx('pulse');
      this.k.tip.getWorldPosition(_b); G.fx.flash(_b, A.hex, 1.6, .4, true);
      return;
    }
    // Aim at the locked foe, else the nearest ahead, else straight on.
    const t = this.lock?.alive ? this.lock : this.focusTarget(14);
    const yaw = t ? yawTo(this.pos.x, this.pos.z, t.pos.x, t.pos.z) : this.yaw;
    this.k.armL.hand.getWorldPosition(_a);
    if (id === 'darts') {
      for (const o of [-DART.spread, 0, DART.spread]) {
        const d = t ? Math.max(1, Math.hypot(t.pos.x - _a.x, t.pos.z - _a.z)) : 10, ty = t ? t.pos.y + t.height * .55 : _a.y;
        const mesh = new THREE.Mesh(new THREE.ConeGeometry(.035, .32, 5), new THREE.MeshBasicMaterial({ color: A.hex }));
        mesh.geometry.rotateX(Math.PI / 2);
        this.addShot({ kind: 'dart', mesh, x: _a.x, y: _a.y, z: _a.z, vx: Math.sin(yaw + o) * DART.speed, vz: Math.cos(yaw + o) * DART.speed, vy: (ty - _a.y) / d * DART.speed, life: DART.life, yaw: yaw + o });
      }
      G.audio.sfx('throw');
    } else if (id === 'bomb') {
      const d = t ? Math.min(BOMB.range, Math.hypot(t.pos.x - this.pos.x, t.pos.z - this.pos.z)) : 8;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), new THREE.MeshBasicMaterial({ color: A.hex }));
      this.addShot({ kind: 'bomb', mesh, x0: _a.x, y0: _a.y, z0: _a.z, x1: this.pos.x + Math.sin(yaw) * d, z1: this.pos.z + Math.cos(yaw) * d, dur: BOMB.flight });
      G.audio.sfx('throw');
    }
  }
  addShot(s) { s.t = 0; s.hit = new Set(); this.G.scene.add(s.mesh); this.shots.push(s); }
  dropShot(s) { this.G.scene.remove(s.mesh); s.mesh.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); }

  // Hurl, Gale, Ring Throw: spectral copies of the weapon wheel out along the aim and come home to hand.
  makeThrown(kind) {
    const mat = () => new THREE.MeshBasicMaterial({ color: this.W.color, transparent: true, opacity: .9, side: THREE.DoubleSide });
    const g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);   // spin turns: hatchets end over end, fans and rings flat
    if (kind === 'hatchet') { spin.add(new THREE.Mesh(new THREE.BoxGeometry(.04, .44, .04), mat())); const h = new THREE.Mesh(new THREE.BoxGeometry(.03, .12, .2), mat()); h.position.y = .18; spin.add(h); }
    else if (kind === 'fan') { const f = new THREE.Mesh(new THREE.CircleGeometry(.36, 12, 0, Math.PI), mat()); f.rotation.x = -Math.PI / 2; spin.add(f); }
    else { const t = new THREE.Mesh(new THREE.TorusGeometry(.24, .035, 6, 20), mat()); t.rotation.x = Math.PI / 2; spin.add(t); }
    return g;
  }
  hurlWeapon(a) {
    const G = this.G, H = a.hurl;
    const t = this.lock?.alive ? this.lock : this.focusTarget(H.range);
    const yaw = t ? yawTo(this.pos.x, this.pos.z, t.pos.x, t.pos.z) : this.yaw;
    for (let i = 0; i < H.n; i++) {
      const o = H.n > 1 ? (i ? 1 : -1) * H.spread : 0;
      this.addShot({ kind: 'boomer', mesh: this.makeThrown(H.kind), x: this.pos.x, y: this.pos.y + 1.2, z: this.pos.z, yaw: yaw + o, d: 0, out: true, range: H.range, speed: H.speed,
        spinAxis: H.kind === 'hatchet' ? 'x' : 'y', atk: { ...a, hurl: null, kb: H.kb ?? a.kb } });
    }
    G.audio.sfx('throw'); G.audio.sfx('swing', { pitch: .8 });
  }
  // Hex Charge: the charges fly as seeking bolts at the foe in front, or whoever is near.
  fireHex(n) {
    const G = this.G;
    this.k.tip.getWorldPosition(_a);
    const foes = G.enemies.filter(e => e.alive && !e.burrowed && e.distToPlayer() < 16).sort((m, q) => m.distToPlayer() - q.distToPlayer());
    for (let i = 0; i < n; i++) {
      const tg = this.lock?.alive ? this.lock : foes[i % Math.max(1, foes.length)];
      const yaw = this.yaw + (i - (n - 1) / 2) * .4;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), new THREE.MeshBasicMaterial({ color: 0x9dff7a }));
      this.addShot({ kind: 'hex', mesh, x: _a.x, y: Math.max(1, _a.y), z: _a.z, vx: Math.sin(yaw) * HEX.speed, vy: 1.5, vz: Math.cos(yaw) * HEX.speed, tg, life: 1.8 });
    }
    G.audio.sfx('magic'); G.fx.flash(_a, 0x9dff7a, 1.6, .3, true);
  }
  updateShots(dt) {
    const G = this.G;
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i]; s.t += dt;
      let done = false;
      if (s.kind === 'dart') {
        const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt, nz = s.z + s.vz * dt;
        if (!G.world.los(s, { x: nx, z: nz }, ny)) { done = true; G.fx.spark({ x: s.x, y: s.y, z: s.z }, { x: -s.vx, z: -s.vz }, 6, 0xd8f0a0, 3); }
        for (const e of G.enemies) {
          if (done || !e.alive || e.burrowed || Math.hypot(e.pos.x - nx, e.pos.z - nz) > e.radius + .35 || ny < e.pos.y - .1 || ny > e.pos.y + e.height + .2) continue;
          const res = e.takeHit({ dmg: DART.dmg * this.dmgMul, ki: DART.ki, poise: DART.poise, dir: s.yaw });
          if (res) { this.combo.n++; this.combo.t = G.time; }
          G.fx.spark({ x: nx, y: ny, z: nz }, { x: s.vx, z: s.vz }, 8, 0xd8f0a0, 4); G.audio.sfx('hit', { x: nx, z: nz, vol: .5 });
          done = true;
        }
        s.x = nx; s.y = ny; s.z = nz;
        s.mesh.position.set(nx, ny, nz); s.mesh.rotation.set(-Math.atan2(s.vy, Math.hypot(s.vx, s.vz)), s.yaw, 0);
        if (Math.random() < dt * 40) G.fx.motes(s.mesh.position, 0xd8f0a0, 1, .05, 0, .05, .3);
        if (s.t >= s.life) done = true;
      } else if (s.kind === 'boomer') {
        // Out along the aim (a wall turns it back), then home to the knight's hand; it cuts on the way both ways.
        const sx = Math.sin(s.yaw), sz = Math.cos(s.yaw);
        if (s.out) {
          const nd = s.d + s.speed * dt, nx = s.x + sx * s.speed * dt, nz = s.z + sz * s.speed * dt;
          if (nd >= s.range || !G.world.los(s, { x: nx, z: nz }, s.y)) { s.out = false; s.hit.clear(); }
          else { s.x = nx; s.z = nz; s.d = nd; }
        } else {
          const tx = this.pos.x - s.x, ty = this.pos.y + 1.2 - s.y, tz = this.pos.z - s.z, dd = Math.hypot(tx, ty, tz), v = s.speed * 1.15 * dt;
          if (dd < .8) done = true;
          else { s.x += tx / dd * v; s.y += ty / dd * v; s.z += tz / dd * v; }
        }
        for (const e of G.enemies) {
          if (done || !e.alive || e.burrowed || s.hit.has(e) || Math.hypot(e.pos.x - s.x, e.pos.z - s.z) > e.radius + .8 || s.y < e.pos.y - .2 || s.y > e.pos.y + e.height + .5) continue;
          s.hit.add(e); this.strike(e, s.atk, yawTo(s.x, s.z, e.pos.x, e.pos.z), false);
        }
        for (const b of G.world.breakables) if (!b.broken && !s.hit.has(b) && Math.hypot(b.x - s.x, b.z - s.z) < b.r + .5) { s.hit.add(b); G.world.hitBreakable(b, 2, s.yaw); }
        s.mesh.position.set(s.x, s.y, s.z); s.mesh.rotation.y = s.yaw;
        s.mesh.children[0].rotation[s.spinAxis] += dt * 26;
        if (Math.random() < dt * 40) G.fx.motes(s.mesh.position, this.W.color, 1, .1, .1, .07, .35);
        if (s.t > 5) done = true;
      } else if (s.kind === 'hex') {
        // Seeking: the heading bends toward the mark.
        if (s.tg?.alive) {
          const tx = s.tg.pos.x - s.x, ty = s.tg.pos.y + s.tg.height * .55 - s.y, tz = s.tg.pos.z - s.z, dd = Math.max(.01, Math.hypot(tx, ty, tz));
          const k = 1 - Math.exp(-5 * dt);
          s.vx += (tx / dd * HEX.speed - s.vx) * k; s.vy += (ty / dd * HEX.speed - s.vy) * k; s.vz += (tz / dd * HEX.speed - s.vz) * k;
        }
        s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
        for (const e of G.enemies) {
          if (done || !e.alive || e.burrowed || Math.hypot(e.pos.x - s.x, e.pos.z - s.z) > e.radius + .4 || s.y < e.pos.y - .2 || s.y > e.pos.y + e.height + .3) continue;
          e.takeHit({ dmg: HEX.dmg * this.dmgMul, ki: 30, poise: 20, dir: Math.atan2(s.vx, s.vz) });
          this.combo.n++; this.combo.t = G.time;
          G.fx.flash({ x: s.x, y: s.y, z: s.z }, 0x9dff7a, 1.4, .25, true); G.audio.sfx('hit', { x: s.x, z: s.z }); done = true;
        }
        s.mesh.position.set(s.x, s.y, s.z);
        if (Math.random() < dt * 60) G.fx.motes(s.mesh.position, 0x9dff7a, 1, .05, .1, .07, .4);
        if (s.t > s.life || s.y < 0) done = true;
      } else if (s.kind === 'bomb') {
        const u = Math.min(1, s.t / s.dur);
        s.mesh.position.set(s.x0 + (s.x1 - s.x0) * u, s.y0 * (1 - u) + 3 * 4 * u * (1 - u) * .8, s.z0 + (s.z1 - s.z0) * u);
        if (Math.random() < dt * 50) G.fx.motes(s.mesh.position, 0xffb070, 1, .05, .3, .08, .4);
        if (u >= 1) { done = true; this.bombBurst(s.x1, s.z1); }
      }
      if (done) { this.dropShot(s); this.shots.splice(i, 1); }
    }
  }
  bombBurst(x, z) {
    const G = this.G, p = { x, y: 0, z };
    G.fx.explosion(p, BOMB.radius * .8); G.fx.ring(p, 0xffc890, BOMB.radius, .35);
    G.audio.sfx('explode', { x, z }); G.cam.shake(.35);
    for (const e of G.enemies) {
      if (!e.alive || e.burrowed || e.pos.y > 3 || Math.hypot(e.pos.x - x, e.pos.z - z) > BOMB.radius + e.radius) continue;
      const res = e.takeHit({ dmg: BOMB.dmg * this.dmgMul * (e.boss ? .7 : 1), ki: BOMB.ki, poise: BOMB.poise, dir: yawTo(x, z, e.pos.x, e.pos.z), heavy: true, kb: 6 });
      if (res) { this.combo.n++; this.combo.t = G.time; }
      if (res && res !== 'kill' && e.state !== 'air') e.launch(4, true);
    }
    G.world.smash(x, z, BOMB.radius);
  }

  // ------------------------------------------------ frame
  update(dt) {
    const G = this.G, inp = G.input;
    this.st += dt;

    // Input buffering.
    if (this.alive && G.controlsOn) {
      for (const a of ['light', 'heavy', 'dodge', 'burst', 'heal', 'shift', 'swap', 'art']) if (inp.hit(a)) this.buffer = { a, t: G.time };
      if (inp.hit('heal') && inp.down('guard')) this.buffer = { a: 'art', t: G.time };   // guard + Moondew: a Fae Art
      if (inp.hit('artNext')) this.cycleArt();
      if (inp.hit('lock')) this.toggleLock();
      if (inp.hit('nextTarget')) this.switchLock(1);
      if (inp.hit('prevTarget')) this.switchLock(-1);
      if (inp.hit('guard')) {
        this.guardPressT = G.time;
        if (this.pulse && G.time <= this.pulse.close) this.doPulse();
      }
      if (inp.hit('stanceHigh')) this.setStance('high');
      if (inp.hit('stanceMid')) this.setStance('mid');
      if (inp.hit('stanceLow')) this.setStance('low');
      if (inp.hit('stanceUp')) this.setStance(ORDER[Math.min(2, ORDER.indexOf(this.stance) + 1)]);
      if (inp.hit('stanceDown')) this.setStance(ORDER[Math.max(0, ORDER.indexOf(this.stance) - 1)]);
      if (!inp.down('dodge')) this.sprintArmed = false;
    }
    // A press waits half a second, or, made during a strike, until that strike can chain (the hammer is slow).
    if (this.buffer) {
      const during = this.state === 'attack' && this.buffer.t >= this.atkT0;
      const keep = during ? Math.max(.5, this.atkT0 + this.atk.chain / this.aspeed + .1 - this.buffer.t) : .5;
      if (G.time - this.buffer.t > keep) this.buffer = null;
    }
    if (this.pulse && G.time > this.pulse.close) this.pulse = null;
    if (this.flash && G.time > this.flash.until) this.flash = null;
    if (this.riposte && G.time > this.riposte.until) this.riposte = null;
    this.updateLock(dt);

    // Camera-relative move input.
    const mv = G.controlsOn && this.alive ? inp.move() : { x: 0, y: 0 };
    const cy = G.cam.yaw, mag = Math.min(1, Math.hypot(mv.x, mv.y));
    const wx = Math.sin(cy) * mv.y - Math.cos(cy) * mv.x, wz = Math.cos(cy) * mv.y + Math.sin(cy) * mv.x;
    this.inputYaw = mag > .15 ? Math.atan2(wx, wz) : null;

    let want = { x: 0, z: 0 }, turn = null, turnRate = 20;
    this.iframes = this.iframesT > 0;
    this.iframesT = Math.max(0, (this.iframesT || 0) - dt);
    this.guarding = false; this.sprinting = false;
    const lean = this.anim.leanTarget; lean.x = 0; lean.z = 0;
    const take = a => { if (this.buffer && this.buffer.a === a) { this.pressT = this.buffer.t; this.buffer = null; return true; } return false; };
    const takeAny = list => { if (this.buffer && list.includes(this.buffer.a)) { const a = this.buffer.a; this.pressT = this.buffer.t; this.buffer = null; return a; } return null; };

    // The pause-combo cue: two strikes into a chain, a beat after the last, the blade glints.
    const cm = this.cmb;
    if (cm.list && !cm.cued && cm.kind !== 'pause' && cm.step >= 2 && G.time >= cm.pauseAt && this.chainLive() && (this.state === 'attack' || this.state === 'free')) {
      cm.cued = true;
      this.k.tip.getWorldPosition(_b); G.fx.flash(_b, 0xfff2c0, 1.1, .4, true); G.audio.sfx('cue');
    }
    const moveInput = () => this.inputYaw !== null;

    switch (this.state) {
      case 'free': {
        if (this.exhaustPending && this.ki <= 0) { this.exhaustPending = false; this.setState('exhausted'); this.anim.play('stagger', 1.3); G.hud.toast('Out of breath', 'warn'); G.audio.sfx('playerHurt', { vol: .4 }); break; }
        this.exhaustPending = false;
        const act = takeAny(['light', 'heavy', 'dodge', 'burst', 'heal', 'shift', 'swap', 'art']);
        if (act && this.tryStart(act)) break;
        // Guard at a sprint (or the slide button at a run) drops into a slide.
        const runSpeed = Math.hypot(this.vel.x, this.vel.z);
        if (G.controlsOn && ((inp.hit('guard') && this.wasSprinting) || (inp.hit('slide') && runSpeed > 3)) && mag > .3 && !(this.snared > 0) && (this.ki > 0 || this.shifted)) { this.startSlide(); break; }
        this.guarding = G.controlsOn && inp.down('guard');
        this.sprinting = !!this.sprintArmed && inp.down('dodge') && mag > .3 && !this.guarding && !(this.snared > 0);
        this.wasSprinting = this.sprinting;
        const speed = this.guarding ? 3 : this.sprinting ? 8.2 : this.lock ? 5 : 6.2;
        const s = speed * mag * (this.snared > 0 ? .45 : 1) * (this.frozen > 0 ? .62 : 1);
        if (moveInput()) {
          // The heading swings toward the stick rather than snapping to it: tight at a walk, a wider arc at a
          // run. From a standstill it takes the new direction at once and the body pivots to follow.
          const sp = Math.hypot(this.vel.x, this.vel.z), diff = angleDiff(this.heading, this.inputYaw);
          if (sp < 1.2) this.heading = this.inputYaw;
          else {
            const k = this.lock ? 16 : this.sprinting ? 7 : 11, max = (this.lock ? 14 : this.sprinting ? 6.5 : 9.5) * dt;
            this.heading += clamp(diff * (1 - Math.exp(-k * dt)), -max, max);
          }
          // A hard reversal bleeds speed while the knight wheels round; so does setting off facing away.
          const lag = Math.abs(angleDiff(this.heading, this.inputYaw)), face = this.lock ? 0 : Math.abs(angleDiff(this.yaw, this.heading));
          const k2 = clamp(Math.cos(Math.max(lag, face) * .5) * 1.25, .3, 1);
          want = { x: Math.sin(this.heading) * s * k2, z: Math.cos(this.heading) * s * k2 };
        }
        if (this.lock && !this.sprinting) turn = yawTo(this.pos.x, this.pos.z, this.lock.pos.x, this.lock.pos.z);
        else if (moveInput()) { turn = this.heading; turnRate = 13; }
        break;
      }
      case 'attack': {
        const a = this.atk;
        // Held heavies charge: the pose holds at the top of the windup while the button stays down.
        if (a.charge && !this.chargeDone && this.st * this.aspeed >= a.charge) {
          if (G.controlsOn && inp.down('heavy') && this.chargeT < CHARGE.max) {
            this.chargeT += dt * (this.has('skullbead') ? 2 : 1); this.st -= dt; this.anim.speed = 0;
            const k = this.chargeT / CHARGE.max;
            if (this.lock) this.yaw = turnTowards(this.yaw, yawTo(this.pos.x, this.pos.z, this.lock.pos.x, this.lock.pos.z), 6 * dt);
            else if (moveInput()) this.yaw = turnTowards(this.yaw, this.inputYaw, 6 * dt);
            if (Math.random() < dt * 40) { this.k.tip.getWorldPosition(_b); G.fx.motes(_b, this.W.color, 1, .2, .6, .08 + k * .06, .4); }
            if (this.chargeT >= CHARGE.max) { G.fx.flash(_a.set(this.pos.x, 1.2, this.pos.z), 0xffffff, 1.8, .2, true); G.audio.sfx('glint', { vol: 1 }); G.hud.toast('Full charge', 'pulse'); }
          } else {
            this.chargeDone = true; this.anim.speed = this.aspeed;
            this.chargeMul = 1 + .8 * Math.min(1, this.chargeT / CHARGE.max);
          }
        }
        const t = this.st * this.aspeed;
        const idle = () => { this.setState(this.pos.y > .05 ? 'air' : 'free'); if (this.state === 'air') this.anim.play('fall', 1, .1); };
        if (a.launch && !this.launchedUp && t >= a.hit[0]) {
          this.launchedUp = true; this.vy = AIR.rise * (this.S.dash.dist > 1 ? 1.05 : 1);
          G.fx.dust(this.pos, 10); G.fx.ring(this.pos, this.S.color, 1.6, .25);
        }
        if (a.plunge) {
          this.ghostT -= dt; if (this.ghostT <= 0) { this.ghostT = .05; this.ghosts.spawn(0xdff4ff, .25, .35); }
          // Anything airborne in the dive's path is carried down with it.
          for (const e of G.enemies) if (e.state === 'air' && Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z) < 2.4 + e.radius && Math.abs(e.pos.y - this.pos.y) < 2) e.slam();
          break;
        }
        if (t < .1 && !this.lock && moveInput()) this.yaw = turnTowards(this.yaw, this.inputYaw, 10 * dt);
        // Lunge through the windup, stopping short of whoever is in the way.
        const until = a.fixedMove ? a.hit[1] : a.hit[0] + .04;
        if (t < until) {
          const k = smooth(clamp(t / until, 0, 1)), dist = this.lungeDist * k - this.lunged;
          const blocker = !a.pass && G.enemies.some(e => e.alive && !e.burrowed && e.distToPlayer() < e.radius + this.radius + .45 && Math.abs(angleDiff(this.yaw, yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z))) < .9);
          if (!blocker) { this.pos.x += Math.sin(this.yaw) * dist; this.pos.z += Math.cos(this.yaw) * dist; }
          this.lunged += dist;
          lean.x = .12;
        }
        if (!this.swung && t >= a.hit[0] - .05) { this.swung = true; G.audio.sfx(a.heavy ? 'swingHeavy' : 'swing', { pitch: this.stance === 'low' ? 1.2 : this.stance === 'high' ? .85 : 1 }); }
        if (a.multi && t >= a.hit[0] && t <= a.hit[1]) {
          // Flurries: the hit set clears on a beat, so each foe can be cut again. A flurry with a hard last
          // beat keeps that beat to the end of the window.
          let beat = Math.floor((t - a.hit[0]) / a.multi);
          if (a.last) beat = Math.min(beat, Math.floor((a.hit[1] - a.hit[0] - 1e-3) / a.multi));
          if (beat !== this.multiBeat) { this.multiBeat = beat; this.hitSet.clear(); if (a.aoe) this.aoeDone = false; }   // each slam shakes the ground
        }
        if (a.wave && !this.waveDone && t >= (a.wave.at ?? a.hit[0])) { this.waveDone = true; this.spawnWave(a); }
        if (a.hurl && !this.hurled && t >= (a.hurl.at ?? .22)) { this.hurled = true; this.hurlWeapon(a); }
        if (this.hexFire && t >= a.hit[0]) { this.fireHex(this.hexFire); this.hexFire = 0; }
        if (t >= a.hit[0] && t <= a.hit[1] + .02) this.detectHits(a);
        if (t >= a.hit[1] && this.pulseAmount) this.openPulse();
        if (t >= a.chain) {
          const nxt = takeAny(['light', 'heavy']);
          if (nxt && this.tryStart(nxt, 'chain')) break;
        }
        // Recovery can be cut short by a dash, a counter, a Switch Strike, raising the guard, or simply moving.
        if (t >= a.hit[1] + .02) {
          const c = takeAny(['dodge', 'burst', 'heal', 'swap', 'art']);
          if (c && this.tryStart(c, c === 'swap' ? 'strike' : null)) break;
          if (G.controlsOn && inp.down('guard') && this.pos.y <= .05) { this.setState('free'); break; }
        }
        if (t >= a.dur * .78 && moveInput()) { idle(); break; }
        if (t >= a.dur) idle();
        break;
      }
      case 'air': {
        const c = takeAny(['light', 'heavy', 'dodge']);
        if (c && this.tryStart(c)) break;
        // Hold dash while falling to glide on spread wings, for a few seconds each time in the air.
        this.gliding = G.controlsOn && inp.down('dodge') && this.vy < 0 && this.glideT < GLIDE.max;
        if (this.gliding) {
          this.glideT += dt;
          if (this.anim.name !== 'glide') this.anim.play('glide', 1, .15);
          if (Math.random() < dt * 30) G.fx.motes({ x: this.pos.x, y: this.pos.y + 1.1, z: this.pos.z }, 0xcff6ff, 1, .6, .1, .07, .6);
        } else if (this.anim.name === 'glide' || !this.anim.action) this.anim.play('fall', 1, .15);
        const s = (this.gliding ? GLIDE.speed : 3) * mag;
        if (moveInput()) want = { x: Math.sin(this.inputYaw) * s, z: Math.cos(this.inputYaw) * s };
        if (this.lock && !this.gliding) turn = yawTo(this.pos.x, this.pos.z, this.lock.pos.x, this.lock.pos.z);
        else if (moveInput()) turn = this.inputYaw;
        break;
      }
      case 'slide': {
        // Momentum bleeds off; the stick steers a little. Strike for the slide attack, dash to Wingleap.
        const v = this.slideSpeed();
        if (moveInput()) this.slideYaw = turnTowards(this.slideYaw, this.inputYaw, SLIDE.turn * dt);
        this.pos.x += Math.sin(this.slideYaw) * v * dt; this.pos.z += Math.cos(this.slideYaw) * v * dt;
        this.vel.set(Math.sin(this.slideYaw) * v, 0, Math.cos(this.slideYaw) * v);
        this.yaw = this.lock ? turnTowards(this.yaw, yawTo(this.pos.x, this.pos.z, this.lock.pos.x, this.lock.pos.z), 8 * dt) : this.slideYaw;
        lean.x = -.08;
        if (Math.random() < dt * 30) G.fx.dust(this.pos, 1);
        const c = takeAny(['light', 'heavy', 'dodge', 'burst']);
        if (c === 'dodge' && this.startLeap()) break;
        if (c && c !== 'dodge' && this.tryStart(c, c === 'burst' ? null : 'slide')) break;
        if (this.st >= SLIDE.dur || v < 3) { this.setState('free'); this.anim.play('hop', 1.6, .08); }
        break;
      }
      case 'airdash': {
        const D = this.dash, t = this.st, k = clamp(t / (D.dur * .85), 0, 1);
        const d = D.dist * (1 - Math.pow(1 - k, 2.4)), step = d - this.dashed; this.dashed = d;
        this.pos.x += Math.sin(this.dashYaw) * step; this.pos.z += Math.cos(this.dashYaw) * step;
        this.iframes = t >= D.iframes[0] && t <= D.iframes[1];
        this.ghostT -= dt;
        if (this.ghostT <= 0) { this.ghostT = .05; this.ghosts.spawn(this.S.color, .25, .35); }
        if (t >= .12) { const c = takeAny(['light', 'heavy']); if (c && this.tryStart(c)) break; }
        if (t >= D.dur) { this.setState('air'); this.anim.play('fall', 1, .1); }
        break;
      }
      case 'land': {
        if (this.st >= .18) { const c = takeAny(['dodge', 'light', 'heavy']); if (c && this.tryStart(c)) break; }
        if (this.st >= .45) this.setState('free');
        break;
      }
      case 'dash':
      case 'hop': {
        const D = this.dash, t = this.st, k = clamp(t / (D.dur * .8), 0, 1);
        const d = D.dist * (1 - Math.pow(1 - k, 2.6));
        const step = d - this.dashed; this.dashed = d;
        this.pos.x += Math.sin(this.dashYaw) * step; this.pos.z += Math.cos(this.dashYaw) * step;
        this.iframes = t >= D.iframes[0] && t <= D.iframes[1];
        if (this.lock) this.yaw = turnTowards(this.yaw, yawTo(this.pos.x, this.pos.z, this.lock.pos.x, this.lock.pos.z), 12 * dt);
        else if (this.state === 'hop') this.yaw = this.dashYaw + Math.PI;
        const rel = angleDiff(this.yaw, this.dashYaw);
        lean.x = Math.cos(rel) * (this.state === 'hop' ? .2 : .3); lean.z = -Math.sin(rel) * .38;
        // Afterimages.
        this.ghostT -= dt;
        if (this.ghostT <= 0 && t < D.dur * .75) { this.ghostT = .05; this.ghosts.spawn(this.S.color, .28, .35); }
        if (t > D.dur * .6 && this.pulseAmount) this.openPulse();
        if (t >= DASH.attackAt * D.dur / DASH.dur) {
          const c = takeAny(['light', 'heavy', 'burst', 'swap']);
          if (c && this.tryStart(c, c === 'burst' ? null : c === 'swap' ? 'strike' : 'dash')) break;
        }
        if (t >= DASH.chainAt * D.dur / DASH.dur && take('dodge')) { this.setState('free'); this.tryStart('dodge'); break; }
        if (t >= D.dur) { this.setState('free'); this.vel.set(Math.sin(this.dashYaw) * 3, 0, Math.cos(this.dashYaw) * 3); }
        break;
      }
      case 'hurt': {
        if (this.st > this.hurtDur * .6 && take('dodge') && this.tryStart('dodge')) break;
        if (this.st >= this.hurtDur) this.setState('free');
        break;
      }
      case 'stagger':
      case 'exhausted':
        if (this.st >= (this.state === 'stagger' ? 1 : .8)) { this.setState('free'); this.ki = Math.max(this.ki, this.maxKi * .25); }
        break;
      case 'drink': {
        const s = 2 * mag;
        if (moveInput()) want = { x: Math.sin(this.inputYaw) * s, z: Math.cos(this.inputYaw) * s };
        if (moveInput() && !this.lock) { turn = this.inputYaw; turnRate = 8; }
        if (!this.healed && this.st >= .48) {
          this.healed = true;
          this.heal((this.maxHp * .42 + 40) * (this.has('dewdrop') ? 1.33 : 1));
          this.poisoned = 0; this.poison = 0; this.thaw();
          if (this.has('winterbloom')) { this.ki = this.maxKi; this.gainAnima(10); }
          G.audio.sfx('heal');
          G.fx.motes({ x: this.pos.x, y: .4, z: this.pos.z }, 0xff9cd0, 24, .5, 2, .12, 1);
        }
        if (this.st >= .92) this.setState('free');
        break;
      }
      case 'thorn':
        if (this.st >= THORN.dur) this.setState('free');
        break;
      case 'deflect':
      case 'counter': {
        // A strike here becomes a Flashcut (via tryStart); a dash or guard also cancels.
        const c = takeAny(['light', 'heavy', 'dodge']);
        if (c && this.tryStart(c)) break;
        if (this.st >= (this.state === 'deflect' ? .26 : .5)) this.setState('free');
        break;
      }
      case 'flashcut': {
        const f = this.fc, e = f.e;
        this.iframes = true;
        this.pos.x = damp(this.pos.x, f.x, 30, dt); this.pos.z = damp(this.pos.z, f.z, 30, dt);
        if (!f.hit && this.st >= .1) { f.hit = true; this.flashcutHit(e); }
        if (this.st >= .45) { const c = takeAny(['light', 'heavy', 'dodge']); if (c) { this.setState('free'); this.tryStart(c); break; } }
        if (this.st >= .82) this.setState('free');
        break;
      }
      case 'grapple': {
        const g = this.grapple, e = g.e;
        this.iframes = true;
        this.pos.x = damp(this.pos.x, g.x, 20, dt); this.pos.z = damp(this.pos.z, g.z, 20, dt);
        this.yaw = yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z);
        const T = 1.1 / 1.25;
        e.grappleK = clamp(this.st / T, 0, 1);
        const big = e.boss || e.elite;
        const total = ATK.heavy.dmg * this.dmgMul * (big ? 2.2 : 3.4) * (this.shifted ? 1.4 : 1) * (this.has('gnawtooth') ? 1.33 : 1)
          * (this.weapon === 'rapier' ? 1.5 : this.weapon === 'daggers' && g.kind === 'ambush' ? 1.33 : 1);
        if (g.hits === 0 && this.st >= .3 / 1.25) { g.hits = 1; this.critHit(e, total * .35, false); }
        if (g.hits === 1 && this.st >= .8 / 1.25) { g.hits = 2; this.critHit(e, total * .65, true); }
        if (this.st >= T) {
          this.setState('free');
          if (e.alive && e.state === 'grappled') { e.state = 'hurt'; e.st = 0; e.hurtDur = .7; e.ki = e.maxKi * .6; }
        }
        break;
      }
      case 'shift':
        this.iframes = true;
        if (this.st >= .35 && !this.shifted) this.startShift();
        if (this.st >= .77) this.setState('free');
        break;
      case 'rest':
        this.iframes = true;
        break;
      case 'rise':
        if (this.st >= .9 || (this.st > .4 && moveInput())) this.setState('free');
        break;
      case 'fog': {
        // Walk through the briars and on into the arena, so the camera ends up inside too.
        this.iframes = true;
        const S = G.level.seal, [ix, iz] = S.inside, sp = 3.6;
        const dx = ix - this.pos.x, dz = iz - this.pos.z, dd = Math.hypot(dx, dz);
        const step = Math.min(dd, sp * dt);
        if (dd > 1e-3) { this.pos.x += dx / dd * step; this.pos.z += dz / dd * step; }
        this.yaw = S.yaw;
        want = { x: Math.sin(S.yaw) * sp, z: Math.cos(S.yaw) * sp };
        if (dd < .1 || this.st >= 3) { this.pos.set(ix, 0, iz); this.setState('free'); this.anim.stop(); G.onFogCrossed(); }
        break;
      }
      case 'pickup':
        if (this.st >= .5) this.setState('free');
        break;
      case 'art': {
        // Throw from the off hand, or draw the brand along the weapon; a slow walk meanwhile.
        const A = ARTS[this.artKind], at = A.brand ? .35 : .13, end = A.brand ? .66 : .42, s = 2 * mag;
        if (moveInput()) want = { x: Math.sin(this.inputYaw) * s, z: Math.cos(this.inputYaw) * s };
        if (!this.artFired && this.st >= at) { this.artFired = true; this.fireArt(this.artKind); }
        if (this.artFired) { const c = takeAny(['dodge', 'light', 'heavy']); if (c && this.tryStart(c)) break; }
        if (this.st >= end) this.setState('free');
        break;
      }
      case 'swap': {
        const s = 3 * mag;
        if (moveInput()) want = { x: Math.sin(this.inputYaw) * s, z: Math.cos(this.inputYaw) * s };
        if (this.st >= .12) { const c = takeAny(['light', 'heavy', 'dodge', 'burst']); if (c && this.tryStart(c)) break; }
        if (this.st >= .3) this.setState('free');
        break;
      }
      case 'dead':
        break;
    }

    // Height: launchers, air strikes and the Starfall; gravity eases while an air strike is swinging, and
    // the glide holds the knight up. A Wingleap's momentum carries on through the air, strikes and all.
    if (this.pos.y > 0 || this.vy > 0) {
      const a = this.state === 'attack' ? this.atk : null, t = a ? this.st * this.aspeed : 0;
      const hanging = a && (a.air || (a.launch && this.launchedUp)) && t < a.dur * .85;
      const g = a?.plunge ? AIR.plungeG : this.state === 'airdash' ? 0 : hanging && this.vy < 2 ? AIR.hang : AIR.g;
      this.vy -= g * dt;
      if (hanging && a.air) this.vy = Math.max(this.vy, -2.5);
      if (this.gliding && this.state === 'air') this.vy = Math.max(this.vy, -GLIDE.sink);
      if (this.carry && !a?.plunge) {
        this.pos.x += this.carry.x * dt; this.pos.z += this.carry.z * dt;
        const k = Math.exp(-(a ? 2.5 : this.gliding ? .35 : .7) * dt); this.carry.x *= k; this.carry.z *= k;
      }
      this.pos.y = Math.max(0, this.pos.y + this.vy * dt);
      if (this.pos.y <= 0 && this.vy <= 0) this.land();
    }
    this.updateWaves(dt); this.updateShots(dt);
    // Iai: the Rimeblade glints once it has been held back long enough.
    if (this.weapon === 'katana') {
      if (this.state === 'attack') this.iaiT = G.time;
      else if (!this.iaiReady && this.state === 'free' && G.time - (this.iaiT ?? -9) > IAI.wait) {
        this.iaiReady = true; this.k.tip.getWorldPosition(_b); G.fx.flash(_b, 0xdff4ff, 1, .35, true); G.audio.sfx('glint', { vol: .6 });
      }
    } else this.iaiReady = false;

    // Outside free movement the heading follows where the body is actually going (or facing, at rest).
    if (this.state !== 'free') { const sp = Math.hypot(this.vel.x, this.vel.z); this.heading = sp > 1 ? Math.atan2(this.vel.x, this.vel.z) : this.yaw; }

    // Knockback from blocks and hits decays smoothly.
    if (this.knock) {
      this.pos.x += Math.sin(this.knock.yaw) * this.knock.v * dt; this.pos.z += Math.cos(this.knock.yaw) * this.knock.v * dt;
      this.knock.v = damp(this.knock.v, 0, 9, dt);
      if (this.knock.v < .05) this.knock = null;
    }

    // Voluntary movement: quick to start, quick to stop.
    const accel = this.state === 'free' ? (Math.hypot(want.x, want.z) > .1 ? 16 : 20) : 30;
    this.vel.x = damp(this.vel.x, want.x, accel, dt); this.vel.z = damp(this.vel.z, want.z, accel, dt);
    if (['free', 'drink', 'swap', 'air', 'art'].includes(this.state)) { this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt; }
    else this.vel.multiplyScalar(Math.exp(-10 * dt));
    if (turn !== null) {
      const before = this.yaw;
      this.yaw = turnTowards(this.yaw, turn, turnRate * dt);
      // Lean into turns at speed.
      const sp = Math.hypot(this.vel.x, this.vel.z);
      lean.z = clamp(angleDiff(before, this.yaw) / Math.max(dt, 1e-3) * -.03 * sp / 6, -.3, .3);
      lean.x = Math.min(.18, sp / 6 * .1);
    }

    // Collisions: walls, then bodies.
    if (this.state !== 'fog') G.world.collide(this.pos, this.radius);
    for (const e of G.enemies) {
      if (!e.alive || e.burrowed || Math.abs(e.pos.y - this.pos.y) > 1.2 || (this.state === 'grapple' && this.grapple.e === e) || (this.state === 'flashcut' && this.fc.e === e)) continue;
      if (this.state === 'attack' && this.atk.pass && this.st * this.aspeed < this.atk.hit[1]) continue;   // the Viper Dash slips through
      const dx = this.pos.x - e.pos.x, dz = this.pos.z - e.pos.z, d = Math.hypot(dx, dz), m = this.radius + e.radius;
      if (d < m && d > 1e-4) {
        const push = m - d, share = e.boss || e.elite || e.state === 'attack' ? 1 : .6;
        this.pos.x += dx / d * push * share; this.pos.z += dz / d * push * share;
        e.pos.x -= dx / d * push * (1 - share); e.pos.z -= dz / d * push * (1 - share);
      }
    }
    if (this.state !== 'fog') G.world.collide(this.pos, this.radius);

    this.updateResources(dt);
    this.updateVisuals(dt);
  }

  // Weapons that move on their own: the Briar Chain's rope hangs and whips after the swing; the saw-wheel turns;
  // the Hexblade's orb swells with charge.
  updateGear(dt) {
    const G = this.G, k = this.k, W = k.weapons, R = W.chain.rope;
    if (R.line.parent !== G.scene) G.scene.add(R.line, R.sickle);
    const on = this.weapon === 'chain';
    R.line.visible = R.sickle.visible = on;
    if (!on) R.pts.length = 0;
    else {
      k.root.updateMatrixWorld(true);
      W.chain.node.getWorldPosition(_a); k.tip.getWorldPosition(_b);
      const P = R.pts, n = R.N, seg = R.len / n;
      if (!P.length) for (let i = 0; i <= n; i++) {
        const u = i / n, x = _a.x + (_b.x - _a.x) * u, y = _a.y + (_b.y - _a.y) * u, z = _a.z + (_b.z - _a.z) * u;
        P.push({ x, y, z, px: x, py: y, pz: z });
      }
      const swing = this.state === 'attack' || this.state === 'counter' || this.state === 'flashcut';
      for (let i = 1; i <= n; i++) {
        const p = P[i], vx = (p.x - p.px) * .92, vy = (p.y - p.py) * .92, vz = (p.z - p.pz) * .92;
        p.px = p.x; p.py = p.y; p.pz = p.z;
        p.x += vx; p.y += vy - 9.8 * dt * dt; p.z += vz;
      }
      // The sickle end is drawn toward where the swing would carry it: hard in a strike, loosely at rest.
      const pull = swing ? .45 : .06, e = P[n];
      e.x += (_b.x - e.x) * pull; e.y += (_b.y - e.y) * pull; e.z += (_b.z - e.z) * pull;
      P[0].x = _a.x; P[0].y = _a.y; P[0].z = _a.z;
      for (let it = 0; it < 4; it++) for (let i = 0; i < n; i++) {
        const p = P[i], q = P[i + 1], dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z, d = Math.hypot(dx, dy, dz) || 1e-4, f = (d - seg) / d;
        const wa = i === 0 ? 0 : .5, wb = i === 0 ? 1 : .5;
        p.x += dx * f * wa; p.y += dy * f * wa; p.z += dz * f * wa; q.x -= dx * f * wb; q.y -= dy * f * wb; q.z -= dz * f * wb;
      }
      for (const p of P) if (p.y < .03) p.y = .03;
      for (let i = 0; i < n; i++) {
        const p = P[i], q = P[i + 1], m = R.line.children[i];
        _a.set(q.x - p.x, q.y - p.y, q.z - p.z); const len = _a.length() || 1e-4;
        m.position.set((p.x + q.x) / 2, (p.y + q.y) / 2, (p.z + q.z) / 2);
        m.quaternion.setFromUnitVectors(_UP, _a.divideScalar(len)); m.scale.set(1, len, 1);
      }
      R.sickle.position.set(e.x, e.y, e.z);
      R.sickle.lookAt(e.x + (e.x - P[n - 1].x), e.y + (e.y - P[n - 1].y), e.z + (e.z - P[n - 1].z));
    }
    if (this.weapon === 'saw') W.saw.disc.rotation.x -= dt * (this.state === 'attack' ? 40 : 7);
    if (this.weapon === 'hexblade') W.hexblade.orb.scale.setScalar(1 + (this.hexN || 0) * .3 + (this.hexN ? Math.sin(G.time * 8) * .08 : 0));
  }

  flashcutHit(e) {
    const G = this.G;
    if (!e.alive) return;
    const big = e.boss || e.elite;
    if (this.fc.kind === 'riposte') return this.riposteHit(e, big);
    const dmg = (e.boss ? e.maxHp * .1 : e.elite ? Math.max(e.maxHp * .28, 150) : e.hp + 1) * (this.weapon === 'rapier' ? 1.5 : 1);
    this.chain = G.time - (this.chainT || -9) < 3 ? this.chain + 1 : 1;
    this.chainT = G.time;
    const res = e.takeHit({ dmg: dmg * (this.shifted ? 1.3 : 1), ki: big ? 140 : 999, poise: 99, dir: this.yaw, heavy: true, crit: true, flash: true });
    const p = _a.set(e.pos.x, Math.min(1.5, e.height * .55), e.pos.z);
    G.fx.slash(p, this.yaw, 5.5, 0xffffff);
    G.fx.spark(p, { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }, 50, 0xffffff, 12);
    G.fx.blood(p, { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }, 30, 0x2a0606);
    G.audio.sfx('flashcut');
    G.hitstop = .2; G.cam.shake(.55);
    this.gainAnima(12);
    this.ki = Math.min(this.maxKi, this.ki + 25);
    G.hud.toast(this.chain > 1 ? `Flashcut ×${this.chain}` : 'Flashcut', 'flash');
    if (this.has('lanternheart')) this.heal(this.maxHp * .08);
    return res;
  }

  // Moonstep Riposte: heavy damage and posture, not an outright kill.
  riposteHit(e, big) {
    const G = this.G;
    const dmg = (e.boss ? e.maxHp * .045 : big ? Math.max(e.maxHp * .12, 90) : 150) * this.dmgMul * (this.shifted ? 1.3 : 1) * (this.has('moonpetal') ? 1.33 : 1) * (this.weapon === 'rapier' ? 1.5 : 1);
    const res = e.takeHit({ dmg, ki: big ? 90 : 140, poise: 60, dir: this.yaw, heavy: true, crit: true });
    const p = _a.set(e.pos.x, Math.min(1.5, e.height * .55), e.pos.z);
    G.fx.slash(p, this.yaw, 4.5, 0xb8c8ff);
    G.fx.spark(p, { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }, 36, 0xcfd8ff, 10);
    G.fx.blood(p, { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }, 20, 0x2a0606);
    G.audio.sfx('flashcut', { vol: .8 });
    G.hitstop = .14; G.cam.shake(.4);
    this.gainAnima(10);
    this.ki = Math.min(this.maxKi, this.ki + 20);
    G.hud.toast('Moonstep Riposte', 'flash');
    if (this.has('lanternheart')) this.heal(this.maxHp * .08);
    return res;
  }

  critHit(e, dmg, final) {
    const G = this.G;
    const res = e.takeHit({ dmg, ki: 0, poise: 0, dir: this.yaw, heavy: true, crit: true });
    const p = _a.set(e.pos.x, e.height * .55, e.pos.z);
    G.fx.spark(p, { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }, final ? 40 : 20, 0xffd080, final ? 10 : 6);
    G.fx.blood(p, { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }, final ? 30 : 12, 0x2a0606);
    G.audio.sfx(final ? 'grapple' : 'hitHeavy');
    G.hitstop = final ? .14 : .07; G.cam.shake(final ? .5 : .28);
    this.gainAnima(final ? 10 : 4);
    return res;
  }

  detectHits(a) {
    const G = this.G, S = this.S;
    // Area strikes shake the ground in front of the knight.
    if (a.aoe && !this.aoeDone) {
      this.aoeDone = true;
      const at = a.aoeAt ?? 1.3, c = { x: this.pos.x + Math.sin(this.yaw) * at, z: this.pos.z + Math.cos(this.yaw) * at };
      G.fx.ring(c, S.color, a.aoe * 1.3, .35); G.fx.dust(c, 16);
      G.audio.sfx('slam', { vol: .8 }); G.cam.shake(.35);
      for (const e of G.enemies) {
        if (!e.alive || this.hitSet.has(e) || e.state === 'grappled') continue;
        if (Math.hypot(e.pos.x - c.x, e.pos.z - c.z) < a.aoe + e.radius) this.strike(e, a);
      }
      G.world.smash(c.x, c.z, a.aoe);
    }
    // Hex orbs can be cut out of the air.
    for (const pr of G.projectiles.list) {
      if (pr.kind !== 'orb' || pr.reflected || pr.kill) continue;
      const o = pr.obj.position, dx = o.x - this.pos.x, dz = o.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d > a.reach + .5 || o.y > 2.8) continue;
      if (d > 1.2 && Math.abs(angleDiff(this.yaw, Math.atan2(dx, dz))) > a.arc * Math.PI / 360 + .25) continue;
      G.projectiles.cut(pr);
      this.gainAnima(2);
    }
    const reach = a.reach * (this.W.reach || 1) * (a.air || a.launch ? this.W.airReach : 1) * (this.has('pikeband') ? 1.1 : 1), high = this.pos.y > .6 || a.air;
    for (const e of G.enemies) {
      if (!e.alive || this.hitSet.has(e) || e.state === 'grappled') continue;
      // In the air, only foes near the knight's height; from the ground, not foes juggled high overhead.
      if (high ? Math.abs(e.pos.y - this.pos.y) > 2.2 : e.pos.y > 2.4) continue;
      const dx = e.pos.x - this.pos.x, dz = e.pos.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d > reach + e.radius) continue;
      const ang = Math.abs(angleDiff(this.yaw, Math.atan2(dx, dz)));
      if (ang > a.arc * Math.PI / 360 && d > e.radius + .7) continue;
      this.strike(e, a);
    }
    // Crates, barrels, urns and crystals in the arc.
    for (const b of G.world.breakables) {
      if (b.broken || this.hitSet.has(b) || this.pos.y > b.h + 1.2) continue;
      const dx = b.x - this.pos.x, dz = b.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d > reach + b.r) continue;
      if (Math.abs(angleDiff(this.yaw, Math.atan2(dx, dz))) > a.arc * Math.PI / 360 && d > b.r + .7) continue;
      this.hitSet.add(b); G.world.hitBreakable(b, a.heavy ? 3 : 1, this.yaw);
    }
  }

  strike(e, a, dir = this.yaw, own = true) {
    const G = this.G, S = this.S, wid = this.weapon;
    if (own) this.hitSet.add(e);
    const dx = e.pos.x - this.pos.x, dz = e.pos.z - this.pos.z, d = Math.max(.01, Math.hypot(dx, dz));
    const cm = this.chargeMul || 1;
    const charm = (a.heavy && this.has('tusk') ? 1.15 : 1) * (a.air && this.has('skyward') ? 1.25 : 1) * (a.air || a.launch ? this.W.airDmg : 1);
    const fz = (this.weapon === 'fangs' ? 1 + this.frenzy.n * FRENZY.dmg : 1) * (G.time < (this.veilT || 0) ? 1.25 : 1);
    // The combo counter's tier, a finisher's spent combo, and the hard last beat of a flurry.
    const tier = Math.min(COMBO.tiers, Math.floor(this.combo.n / COMBO.tier));
    const last = a.multi && a.last && this.multiBeat >= Math.floor((a.hit[1] - a.hit[0] - 1e-3) / a.multi) ? a.last : 1;
    const cmb = (1 + tier * COMBO.per) * (a.fin ? this.finMul || 1 : 1) * last;
    const forged = 1 + FORGE.per * (this.forge[this.weapon] || 0);
    // The weapon's own weight, and its mechanic: Momentum, Backstab, Reap, Iai.
    let mech = this.W.dmg || 1;
    if (wid === 'great') mech *= 1 + Math.min(.36, .06 * Math.max(0, (this.momN || 1) - 1));
    if (wid === 'daggers' && Math.abs(angleDiff(e.yaw, yawTo(e.pos.x, e.pos.z, this.pos.x, this.pos.z))) > 2) mech *= 1.6;
    if (wid === 'scythe' && e.hp < e.maxHp * .35) mech *= 1.6;
    if (wid === 'katana') mech *= this.iaiMul || 1;
    const mul = this.dmgMul * S.dmg * cm * charm * fz * cmb * forged * mech * (this.shifted ? 1.6 : 1) * (e.state === 'broken' ? (this.has('iceheart') ? 1.5 : 1.25) : 1);
    // Knockback: Snare pulls, Reap's sweeps draw in, Sweep and Gale push.
    let kb = last > 1 ? Math.max(a.kb ?? 0, 4.5) : a.kb;
    if (wid === 'chain' && !a.air) kb = a.heavy || a.fin ? -5 : -1.8;
    if (wid === 'scythe' && kb === undefined && a.arc >= 180) kb = -1.5;
    if (wid === 'staff') kb = (kb ?? (a.heavy ? 4.5 : 2)) + 2;
    if (wid === 'fans' && !(kb < 0)) kb = Math.max(kb ?? 0, 4);
    const flow = (wid === 'fists' ? FLOW.posture : wid === 'hatchets' ? 1.15 : wid === 'saw' ? 1.4 : 1) * (this.brand?.kind === 'storm' ? BRAND.stormKi : 1);
    const res = e.takeHit({ dmg: a.dmg * mul, ki: a.ki * S.ki * cm * Math.sqrt(cmb) * flow * (this.shifted ? 1.5 : 1) * (this.has('knuckle') ? 1.2 : 1), poise: a.poise * cm * last * (this.stance === 'high' ? 1.3 : 1), dir, heavy: !!a.heavy || last > 1, kb, airY: this.pos.y > .3 ? this.pos.y : undefined });
    if (!res) return;
    this.combo.n++; this.combo.t = G.time;
    if (this.weapon === 'fists' && !this.shifted) { this.ki = Math.min(this.maxKi, this.ki + FLOW.ki); if (this.ki > 0) this.exhaustPending = false; }
    // Bleed (Wolf Claws), Sweep (Moonstaff: two foes at once wins stamina back), Hex Charge (Hexblade).
    if (wid === 'claws') e.bleed?.();
    if (wid === 'staff' && own && this.sweptT !== this.atkT0) {
      let n = 0; for (const x of this.hitSet) if (x.takeHit) n++;
      if (n >= 2) { this.sweptT = this.atkT0; this.ki = Math.min(this.maxKi, this.ki + 6); }
    }
    if (wid === 'hexblade' && !a.hexBolt) {
      this.hexHits = (this.hexHits || 0) + 1;
      if (this.hexHits >= HEX.per) { this.hexHits = 0; if ((this.hexN || 0) < HEX.max) { this.hexN = (this.hexN || 0) + 1; G.audio.sfx('glint', { vol: .5 }); } }
    }
    // Brands: fire burns, frost slows, storm leaps to a second foe nearby.
    const brand = this.brand?.kind;
    if (brand === 'ember' && res !== 'blocked') e.burn(BRAND.burn);
    if (brand === 'rime' && res !== 'blocked') e.rime(BRAND.rime);
    if (brand === 'storm' && G.time > (this.arcT || 0)) {
      const o = G.enemies.filter(x => x !== e && x.alive && !x.burrowed && Math.hypot(x.pos.x - e.pos.x, x.pos.z - e.pos.z) < BRAND.arcRange)
        .sort((m, n) => Math.hypot(m.pos.x - e.pos.x, m.pos.z - e.pos.z) - Math.hypot(n.pos.x - e.pos.x, n.pos.z - e.pos.z))[0];
      if (o) {
        this.arcT = G.time + .15;
        o.takeHit({ dmg: a.dmg * mul * BRAND.arc, ki: a.ki * .5, poise: 4, dir: yawTo(e.pos.x, e.pos.z, o.pos.x, o.pos.z) });
        G.fx.bolt({ x: e.pos.x, y: e.pos.y + e.height * .6, z: e.pos.z }, { x: o.pos.x, y: o.pos.y + o.height * .6, z: o.pos.z });
        G.audio.sfx('glint', { vol: .8 });
      }
    }
    if (a.launch && res !== 'kill' && e.launch(a.launch)) G.hud.toast('Launch', 'pulse');
    // Pops: small ones trip a foe off its feet, big ones throw it up for the taking.
    if (a.pop && res !== 'kill' && res !== 'blocked' && e.state !== 'air' && e.launch(a.pop, true) && a.pop >= 8) G.hud.toast('Launch', 'pulse');
    const p = _a.set(e.pos.x - dx / d * e.radius * .6, e.pos.y + Math.min(1.3, e.height * .55), e.pos.z - dz / d * e.radius * .6);
    const side = this.atkKey === 'light1' || this.atkKey === 'light4' ? 1 : -1;
    const sdir = { x: Math.cos(dir) * side, z: -Math.sin(dir) * side };
    G.fx.spark(p, sdir, a.heavy ? 22 : 12, this.shifted ? 0xff9cf0 : 0xffd080, a.heavy ? 8 : 6);
    G.fx.blood(p, { x: dx / d, z: dz / d }, a.heavy ? 16 : 8, 0x2a0606);
    G.audio.sfx(a.heavy ? 'hitHeavy' : 'hit', { x: e.pos.x, z: e.pos.z });
    G.hitstop = Math.max(G.hitstop, a.multi ? .02 : a.heavy ? .08 : .045);
    if (this.weapon === 'fangs') {
      const f = this.frenzy, before = f.n;
      const wild = this.has('wildfang'), max = wild ? 8 : FRENZY.max;
      f.n = Math.min(max, (G.time - f.t <= FRENZY.keep * (wild ? 1.8 : 1) ? f.n : 0) + 1); f.t = G.time;
      if (f.n === max && before < max) { G.hud.toast('Frenzy', 'anima'); G.fx.ring(this.pos, 0xffb4c8, 2, .3); }
    }
    G.cam.shake(a.heavy ? .22 : .08);
    this.gainAnima(a.heavy ? 7 : 4);
  }

  updateResources(dt) {
    const G = this.G;
    const busy = ['attack', 'dash', 'hop', 'thorn'].includes(this.state);
    if (!busy && G.time - this.kiSpentT > .35 && this.ki < this.maxKi) {
      const rate = 52 * (this.guarding ? .45 : 1) * (this.state === 'exhausted' || this.state === 'stagger' ? 1.5 : 1) * (this.sprinting ? .6 : 1) * (this.frozen > 0 ? .5 : 1);
      this.ki = Math.min(this.maxKi, this.ki + rate * dt);
    }
    if (this.poisoned > 0 && this.alive && G.state === 'play' && this.state !== 'rest') {
      this.poisoned -= dt;
      this.hp -= this.maxHp * .012 * dt * (this.has('rootbound') ? .6 : 1);
      if (Math.random() < dt * 6) G.fx.motes({ x: this.pos.x, y: 1, z: this.pos.z }, 0x8fe040, 1, .3, .8, .1, .8);
      if (this.hp <= 0) this.die();
    } else this.poison = Math.max(0, this.poison - 8 * dt);
    if (this.frozen > 0) {
      this.frozen -= dt;
      if (Math.random() < dt * 10) G.fx.motes({ x: this.pos.x, y: rand(.3, 1.8), z: this.pos.z }, 0xcfeaff, 1, .4, .3, .08, .8);
    } else if (G.time - (this.chillT ?? -9) > 1.5) this.chill = Math.max(0, this.chill - 10 * dt);
    if (this.snared > 0) {
      this.snared -= dt;
      if (this.snared <= 0) this.snareFree = G.time + 3;   // a moment's grace before the next bola can bind
      if (Math.random() < dt * 8) G.fx.motes({ x: this.pos.x, y: .3, z: this.pos.z }, 0xc8a060, 1, .3, .4, .08, .5);
    }
    if (this.shifted) {
      this.anima -= 100 / this.shiftDur * dt;
      if (Math.random() < dt * 30) G.fx.motes({ x: this.pos.x, y: 1.2, z: this.pos.z }, Math.random() < .5 ? 0xff9cf0 : 0x9ff3ff, 1, .5, 1, .1, .8);
      if (this.anima <= 0) this.endShift();
    }
    if (this.state !== 'attack') this.aoeDone = false;
    if (this.frenzy.n && G.time - this.frenzy.t > FRENZY.keep * (this.has('wildfang') ? 1.8 : 1)) this.frenzy.n = 0;
    if (this.combo.n && G.time - this.combo.t > COMBO.keep) this.combo.n = 0;
    if (this.brand) {
      if (G.time >= this.brand.until) { this.brand = null; this.refreshLook(); }
      else if (Math.random() < dt * 24) { this.k.tip.getWorldPosition(_b); G.fx.motes(_b, ARTS[this.brand.kind].hex, 1, .12, .4, .07, .45); }
    }
  }

  updateVisuals(dt) {
    const G = this.G, k = this.k, A = this.anim;
    k.root.rotation.y = this.yaw;
    const sp = Math.hypot(this.vel.x, this.vel.z);
    const lf = Math.cos(this.yaw) * this.vel.z + Math.sin(this.yaw) * this.vel.x;
    const ls = Math.cos(this.yaw) * this.vel.x - Math.sin(this.yaw) * this.vel.z;
    A.capeLag = clamp(sp / 8, 0, 1) * .9 + (this.state === 'dash' ? .5 : 0);
    const prevStep = Math.floor(A.gait / Math.PI);
    A.update(dt, { speed: ['free', 'drink', 'fog'].includes(this.state) ? sp : 0, forward: sp > .1 ? lf / sp : 1, side: sp > .1 ? ls / sp : 0, guard: this.guarding, sprint: this.sprinting, shifted: this.shifted, stance: this.stance, weapon: this.weapon });
    if (Math.floor(A.gait / Math.PI) !== prevStep && sp > .8) G.audio.sfx('step');
    this.ghosts.update(dt);
    // Rime creeps over the armour as chill builds; frostbite glazes it outright.
    const fz = this.frozen > 0 ? .5 + Math.sin(G.time * 5) * .08 : this.chill / 260;
    k.mats.steel.emissive.setRGB(fz * .3, fz * .55, fz * .9);

    this.updateGear(dt);

    // Sword trail while swinging.
    const swinging = ['attack', 'counter', 'grapple', 'flashcut', 'deflect', 'land'].includes(this.state) || (this.state === 'thorn' && this.st < .1);
    k.root.updateMatrixWorld(true);
    if (swinging) {
      // Kicks leave their trail on the kicking leg, knee to toe.
      const kick = this.state === 'attack' && this.atk.kick;
      if (kick) { (kick === 'L' ? k.knL : k.knR).getWorldPosition(_a); (kick === 'L' ? k.toeL : k.toeR).getWorldPosition(_b); }
      else { k.base.getWorldPosition(_a); k.tip.getWorldPosition(_b); }
      this.trail.add(_a, _b, G.time);
      if (k.tip2) { k.base2.getWorldPosition(_a); k.tip2.getWorldPosition(_b); this.trail2.add(_a, _b, G.time); }
    }
    this.trail.update(G.time); this.trail2.update(G.time);

    // The wisp bobs behind the right shoulder, lagging a little.
    const wt = G.time;
    _a.set(this.pos.x - Math.cos(this.yaw) * .55 - Math.sin(this.yaw) * .45, 2.05 + Math.sin(wt * 2.3) * .1, this.pos.z + Math.sin(this.yaw) * .55 - Math.cos(this.yaw) * .45);
    this.wispPos.lerp(_a, 1 - Math.exp(-dt * (this.wispPos.lengthSq() ? 7 : 1e3)));
    this.wisp.position.copy(this.wispPos);
    this.wispLight.color.setHex(this.shifted ? 0xffb0f0 : 0xd8ecff);
    if (Math.random() < dt * 8) G.fx.motes(this.wispPos, this.shifted ? 0xff9cf0 : 0xcff6ff, 1, .05, .1, .05, .6);
    // Resonance cue: light gathers while the window is open. Flash window: a white gleam.
    const g = k.glow.material;
    if (this.flash) {
      g.color.setHex(0xffffff); g.opacity = .4 + Math.sin(G.time * 40) * .15; k.glow.scale.setScalar(1.8);
    } else if (this.pulse) {
      const perfect = G.time <= this.pulse.perfect;
      g.color.setHex(perfect ? 0xbff8ff : 0x5fd0ff);
      g.opacity = perfect ? .45 : .2;
      k.glow.scale.setScalar(perfect ? 1.9 : 1.6);
      if (Math.random() < dt * 40) G.fx.motes({ x: this.pos.x, y: .3, z: this.pos.z }, 0x9ff3ff, 1, .5, 2.5, .08, .4);
    } else if (this.shifted) {
      g.color.setHex(0xff7ae0); g.opacity = .2 + Math.sin(G.time * 6) * .06; k.glow.scale.setScalar(2);
    } else g.opacity = Math.max(0, g.opacity - dt * 4);
    for (const t of k.antTip) t.scale.setScalar(this.pulse ? 1.8 : 1);
  }
}
