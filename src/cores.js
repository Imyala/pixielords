// Soul Cores, as in Nioh 2: fallen foes sometimes leave the core of what they were (gatekeepers and warlords
// always do). Two can be set at once. Each lends a passive (an effect from the gear pool, gear.js) and a skill:
// hold Fae Shift and strike to use the first, strike hard for the second. Skills cost Faelight, not stamina.
// Finding a core you already hold fuses it into the one you have, up to +4: each step makes its skill hit
// harder and its passive stronger. The functions below are mixed into the Player (player.js).
import * as THREE from 'three';
import { BRAND } from './arts.js';
import { yawTo } from './util.js';

const V = 0xb07aff;   // the violet of a soul
export const CORES = {
  scout: { name: 'Scout Core', skill: 'knives', skillName: 'Knife Fan', cost: 20, fx: ['dash', 8], from: ['goblin-scout', 'ratman-scout', 'ratman-frostfang'], desc: 'a fan of five thrown knives' },
  spear: { name: 'Spear Guard Core', skill: 'lunge', skillName: 'Phantom Spear', cost: 25, fx: ['ki', 8], from: ['goblin-spearguard', 'goblin-skyguard', 'goblin-rimeguard'], desc: 'a spectral spear driven straight through' },
  archer: { name: 'Archer Core', skill: 'volley', skillName: 'Arrow Volley', cost: 25, fx: ['back', 10], from: ['goblin-archer', 'ratman-slinger', 'goblin-hailslinger'], desc: 'three arrows loosed at once' },
  bomber: { name: 'Bomber Core', skill: 'firebomb', skillName: 'Firebomb', cost: 30, fx: ['fireRes', 20], from: ['goblin-bomber'], desc: 'a bomb that bursts and sets foes burning' },
  berserker: { name: 'Berserker Core', skill: 'frenzy', skillName: 'Blood Frenzy', cost: 35, fx: ['dmgLow', 12], from: ['goblin-berserker', 'goblin-rimebreaker'], desc: 'for eight seconds, strikes hit a quarter harder and blows can\'t stagger you' },
  poisoner: { name: 'Poisoner Core', skill: 'cloud', skillName: 'Blight Cloud', cost: 30, fx: ['poisonRes', 25], from: ['goblin-poisoner', 'ratman-poisoner'], desc: 'a lingering cloud that eats at foes' },
  brute: { name: 'Brute Core', skill: 'slam', skillName: 'Brute Slam', cost: 35, fx: ['hp', 30], from: ['ratman-brute', 'ratman-rimebrute'], desc: 'a leap and a slam that throws foes down' },
  assassin: { name: 'Assassin Core', skill: 'blink', skillName: 'Shadow Step', cost: 30, fx: ['back', 12], from: ['ratman-assassin', 'ratman-shadowblade'], desc: 'blink behind a foe and cut' },
  shaman: { name: 'Shaman Core', skill: 'orbs', skillName: 'Hex Orbs', cost: 30, fx: ['anima', 10], from: ['ratman-shaman', 'goblin-shaman', 'ratman-glowseer', 'goblin-warchanter'], desc: 'three seeking hex orbs' },
  trapper: { name: 'Trapper Core', skill: 'bola', skillName: 'Bola', cost: 20, fx: ['guard', 10], from: ['goblin-trapper'], desc: 'a bola that staggers a foe and slows it' },
  pack: { name: 'Packleader Core', skill: 'rush', skillName: 'Pack Rush', cost: 30, fx: ['kiMax', 15], from: ['ratman-packleader', 'ratman-skirmisher', 'ratman-delver', 'ratman-snowdelver'], desc: 'a charge that bowls through everything' },
  rimecaller: { name: 'Rimecaller Core', skill: 'icewave', skillName: 'Ice Wave', cost: 30, fx: ['chillRes', 25], from: ['goblin-rimecaller'], desc: 'a line of ice racing along the ground, frosting what it cuts' },
  // Gatekeepers, warlords and Revenants: always left behind.
  gatewarden: { name: 'Gatewarden\'s Core', boss: true, skill: 'quake', skillName: 'Gate-Breaker', cost: 45, fx: ['guard', 15], from: ['goblin-clubber'], desc: 'a great leaping slam' },
  gnawfang: { name: 'Gnawfang\'s Core', boss: true, skill: 'crescent', skillName: 'Warren Crescent', cost: 45, fx: ['dmg', 6], from: ['ratman-warblade'], desc: 'a sundering blow that throws a crescent of moonlight' },
  brakka: { name: 'Brakka\'s Core', boss: true, skill: 'axes', skillName: 'Skullsplitter\'s Axes', cost: 40, fx: ['heavy', 12], from: ['brakka'], desc: 'two axes thrown out and back' },
  grimtusk: { name: 'Grimtusk\'s Core', boss: true, skill: 'pyre', skillName: 'Pyre Ring', cost: 45, fx: ['fireRes', 30], from: ['grimtusk'], desc: 'a ring of fire that burns everything near' },
  grinder: { name: 'Grinder\'s Core', boss: true, skill: 'grindwheel', skillName: 'Tunnel Wheel', cost: 40, fx: ['ki', 12], from: ['grinder'], desc: 'a grinding wheel rolled along the ground' },
  skritch: { name: 'Mother Skritch\'s Core', boss: true, skill: 'nova', skillName: 'Plague Nova', cost: 50, fx: ['anima', 15], from: ['skritch'], desc: 'a burst of hex that throws foes back, and five seeking orbs' },
  varkh: { name: 'Varkh\'s Core', boss: true, skill: 'lance', skillName: 'Moon-Pike Lance', cost: 40, fx: ['deflect', 10], from: ['varkh'], desc: 'a charging thrust and a lance of moonlight' },
  silkclaw: { name: 'Silkclaw\'s Core', boss: true, skill: 'blink', skillName: 'Moonless Blink', cost: 35, fx: ['back', 20], from: ['silkclaw'], desc: 'blink behind a foe and cut, and on to the next' },
  rimeknight: { name: 'Rime Knight\'s Core', boss: true, skill: 'icewave3', skillName: 'Rime Crescents', cost: 45, fx: ['kiRegen', 12], from: ['rime-knight'], desc: 'three lines of ice fanning out' },
  ratking: { name: 'Rat King\'s Core', boss: true, skill: 'frenzy', skillName: 'Grief of the King', cost: 45, fx: ['hp', 50], from: ['rat-king'], desc: 'for twelve seconds, strikes hit a third harder and blows can\'t stagger you' },
  frosthexer: { name: 'Frost-Hexer\'s Core', boss: true, skill: 'frostnova', skillName: 'Frost Nova', cost: 45, fx: ['chillRes', 30], from: ['frost-hexer'], desc: 'a burst of frost that slows everything near' },
  revenant: { name: 'Revenant\'s Core', boss: true, skill: 'mirror', skillName: 'Revenant\'s Echo', cost: 40, fx: ['deflect', 8], from: ['revenant-thornwake', 'revenant-hollowmoon', 'revenant-emberlight', 'revenant-ysolde', 'revenant-lanternless'], desc: 'a spectral knight\'s wheeling cut' },
};
// The second act: its gatekeepers and warlords, its fallen fae knights, and its kin of the first act's foes.
Object.assign(CORES, {
  bellwarden: { name: 'Bell-Warden\'s Core', boss: true, skill: 'quake', skillName: 'Toll of the Deep', cost: 45, fx: ['kiMax', 20], from: ['bellwarden'], desc: 'a leaping slam that rings like a bell' },
  abbess: { name: 'Drowned Saint\'s Core', boss: true, skill: 'frostnova', skillName: 'Drowning Bell', cost: 45, fx: ['moondew', 20], from: ['abbess'], desc: 'a burst of sea-cold that slows everything near' },
  forgemaster: { name: 'Forgemaster\'s Core', boss: true, skill: 'pyre', skillName: 'Forge Ring', cost: 45, fx: ['fireRes', 35], from: ['forgemaster'], desc: 'a ring of forge-fire that burns everything near' },
  tyrant: { name: 'Iron Tyrant\'s Core', boss: true, skill: 'crescent', skillName: 'Tyrant\'s Sunder', cost: 45, fx: ['heavy', 15], from: ['tyrant'], desc: 'a sundering blow that throws a crescent of fire-light' },
  briarwarden: { name: 'Briar Warden\'s Core', boss: true, skill: 'lance', skillName: 'Snapping Vine', cost: 40, fx: ['poisonRes', 35], from: ['briarwarden'], desc: 'a charging thrust and a lance of briar' },
  hawthorn: { name: 'Thorned Heir\'s Core', boss: true, skill: 'blink', skillName: 'Blooming Step', cost: 35, fx: ['back', 22], from: ['hawthorn'], desc: 'blink behind a foe and cut, and on to the next' },
  shardling: { name: 'Shardling\'s Core', boss: true, skill: 'icewave3', skillName: 'Shard Lines', cost: 45, fx: ['kiMax', 25], from: ['shardling'], desc: 'three lines of moon-glass fanning out' },
  stareater: { name: 'Star-Eater\'s Core', boss: true, skill: 'nova', skillName: 'Swallow the Stars', cost: 50, fx: ['anima', 18], from: ['stareater'], desc: 'a burst that throws foes back, and five seeking orbs' },
  maelis: { name: 'Maelis\'s Core', boss: true, skill: 'mirror', skillName: 'Lantern Echo', cost: 40, fx: ['deflect', 15], from: ['maelis'], desc: 'a spectral knight that strikes beside you' },
  queen: { name: 'Waning Queen\'s Core', boss: true, skill: 'frenzy', skillName: 'Dark of the Moon', cost: 50, fx: ['dmg', 10], from: ['queen'], desc: 'for twelve seconds, strikes hit a third harder and blows can\'t stagger you' },
  fallen: { name: 'Fallen Knight\'s Core', skill: 'lunge', skillName: 'Fallen Lance', cost: 25, fx: ['dmgFull', 8], from: ['hollow-squire', 'hollow-lancer', 'iron-sentinel', 'thorn-knight', 'thorn-reaver', 'star-shade', 'waning-knight', 'waning-lancer'], desc: 'a spectral lance driven straight through' },
});
// The third act, on the moon.
Object.assign(CORES, {
  oriel: { name: 'Lamp-Keeper\'s Core', boss: true, skill: 'lance', skillName: 'Beacon Lance', cost: 40, fx: ['kiRegen', 18], from: ['oriel'], desc: 'a charging thrust and a lance of lamplight' },
  gloam: { name: 'Shell-Colossus\'s Core', boss: true, skill: 'quake', skillName: 'Dune Breaker', cost: 45, fx: ['hp', 70], from: ['gloam'], desc: 'a great leaping slam that throws the dust up' },
  tessaly: { name: 'Crystal Warden\'s Core', boss: true, skill: 'grindwheel', skillName: 'Crystal Wheel', cost: 40, fx: ['ki', 18], from: ['tessaly'], desc: 'a wheel of crystal rolled along the ground' },
  nyx: { name: 'Mother of Moths\' Core', boss: true, skill: 'nova', skillName: 'Moth Nova', cost: 50, fx: ['anima', 20], from: ['nyx'], desc: 'a burst of wings that throws foes back, and five seeking moths' },
  corvin: { name: 'Unsleeping Core', boss: true, skill: 'crescent', skillName: 'Lament of Blades', cost: 45, fx: ['exec', 20], from: ['corvin'], desc: 'a sundering blow that throws a crescent of grave-light' },
  aurel: { name: 'Hollow King\'s Core', boss: true, skill: 'quake', skillName: 'Crown-Quake', cost: 45, fx: ['guard', 20], from: ['hollow-king'], desc: 'a leaping slam that shakes the tombs' },
  ilune: { name: 'Hollow Queen\'s Core', boss: true, skill: 'blink', skillName: 'The Queen\'s Step', cost: 35, fx: ['back', 24], from: ['hollow-queen'], desc: 'blink behind a foe and cut, and on to the next' },
  vesper: { name: 'Watcher\'s Core', boss: true, skill: 'frenzy', skillName: 'Hundred Nights', cost: 45, fx: ['pause', 18], from: ['vesper'], desc: 'for twelve seconds, strikes hit a third harder and blows can\'t stagger you' },
  nightmaw: { name: 'Hound\'s Core', boss: true, skill: 'rush', skillName: 'Maw Rush', cost: 35, fx: ['dmgLow', 18], from: ['nightmaw'], desc: 'a charge that bowls through everything' },
  selene: { name: 'First Lantern\'s Core', boss: true, skill: 'mirror', skillName: 'First Lantern', cost: 40, fx: ['moondew', 25], from: ['selene'], desc: 'a spectral knight of light that strikes beside you' },
  eclipse: { name: 'Eclipse Core', boss: true, skill: 'pyre', skillName: 'Totality', cost: 50, fx: ['dmg', 12], from: ['eclipse'], desc: 'a ring of the Eclipse\'s fire that burns everything near' },
});
for (const [id, list] of Object.entries({
  fallen: ['selene-sentry', 'crystal-knight', 'moth-shade', 'hollow-courtier', 'hollow-guard', 'umbral-knight', 'eclipse-knight', 'eclipse-lancer'],
  scout: ['goblin-dustrunner'], brute: ['ratman-shellback'], pack: ['ratman-crystalback', 'ratman-gravewight'], assassin: ['ratman-voidfang'], berserker: ['goblin-nightbrute'],
  shaman: ['goblin-lampwright', 'goblin-geomancer', 'goblin-bonecaller', 'goblin-voidcaller'],
  revenant: ['revenant-lark', 'revenant-halloway', 'revenant-mourne', 'revenant-tamsin', 'revenant-last'],
})) CORES[id].from.push(...list);
for (const [id, list] of Object.entries({
  pack: ['ratman-drowned', 'ratman-starbitten'], brute: ['ratman-brinebrute', 'ratman-slagbrute', 'ratman-crystalbrute'],
  shaman: ['goblin-tidecaller', 'goblin-starcaller', 'goblin-briarhexer', 'ratman-shardseer'], spear: ['goblin-forgeguard'], berserker: ['goblin-hammerer'],
  bomber: ['goblin-smelter'], scout: ['goblin-thornling'], assassin: ['ratman-briarstalker', 'ratman-waneling'], archer: ['goblin-thornbow', 'goblin-moonbow'],
  revenant: ['revenant-graves', 'revenant-ashkettle', 'revenant-rook', 'revenant-cinderwing', 'revenant-oathbound'],
})) CORES[id].from.push(...list);
export const CORE_OF = {};
for (const [id, C] of Object.entries(CORES)) for (const t of C.from) CORE_OF[t] = id;
export const CORE_MAX = 5;   // a core fused four times over

// Skills that are strikes: played like any strike (player.js), with a violet spectral edge.
export const CORE_MOVES = {
  core_slam: { name: 'Brute Slam', anim: 'h_hleap', dur: 1.15, hit: [.6, .7], dmg: 110, ki: 80, poise: 60, cost: 0, reach: 2.8, arc: 360, move: 1.8, chain: .95, aoe: 3.2, aoeAt: 1.2, pop: 4, heavy: true, core: true },
  core_quake: { name: 'Gate-Breaker', anim: 'h_hmeteor', dur: 1.5, hit: [.9, 1.0], dmg: 150, ki: 110, poise: 80, cost: 0, reach: 3.0, arc: 360, move: 2, chain: 1.25, aoe: 4.4, aoeAt: 1.0, pop: 5, heavy: true, core: true },
  core_rush: { name: 'Pack Rush', anim: 'h_charge', dur: .7, hit: [.12, .5], dmg: 70, ki: 70, poise: 50, cost: 0, reach: 2.3, arc: 140, move: 7, fixedMove: true, pass: true, chain: .55, kb: 10, heavy: true, core: true },
  core_lunge: { name: 'Phantom Spear', anim: 's_lunge', dur: .6, hit: [.17, .3], dmg: 60, ki: 40, poise: 20, cost: 0, reach: 3.2, arc: 40, move: 1.6, chain: .4, core: true, wave: { len: 9, speed: 28, w: .6, dmg: 1, color: V, at: .2 } },
  core_lance: { name: 'Moon-Pike Lance', anim: 'g_pierce', dur: .85, hit: [.22, .46], dmg: 90, ki: 60, poise: 40, cost: 0, reach: 3.6, arc: 40, move: 5, fixedMove: true, chain: .6, heavy: true, core: true, wave: { len: 13, speed: 30, w: .7, dmg: 1, color: V, at: .3 } },
  core_crescent: { name: 'Warren Crescent', anim: 's_hsunder', dur: 1.1, hit: [.52, .64], dmg: 110, ki: 70, poise: 45, cost: 0, reach: 2.8, arc: 120, move: 1.2, chain: .86, heavy: true, core: true, wave: { len: 13, speed: 20, w: 1.5, dmg: 1, color: V } },
  core_axes: { name: 'Skullsplitter\'s Axes', anim: 'hurl2', dur: .62, hit: [9, 9], dmg: 70, ki: 50, poise: 30, cost: 0, reach: 0, arc: 0, move: .2, chain: .46, heavy: true, core: true, hurl: { kind: 'hatchet', n: 2, spread: .2, range: 13, speed: 20 } },
  core_nova: { name: 'Nova', anim: 'x_palm', dur: .6, hit: [.18, .3], dmg: 90, ki: 70, poise: 40, cost: 0, reach: 0, arc: 360, move: 0, chain: .44, aoe: 4.2, aoeAt: 0, kb: 9, heavy: true, core: true },
  core_mirror: { name: 'Revenant\'s Echo', anim: 'wb_turn', dur: 1.0, hit: [.2, .7], dmg: 50, ki: 40, poise: 25, cost: 0, reach: 3.6, arc: 360, move: .6, chain: .8, multi: .25, kb: 6, heavy: true, core: true },
};

const _a = new THREE.Vector3();
// Cast skills (not strikes): what each does when the cast reaches its moment.
const CASTS = {
  knives(p, pow) { p.throwDarts(5, .16, { dmg: 30 * pow, color: V }); },
  volley(p, pow) {
    const t = p.coreTarget(), yaw = t ? yawTo(p.pos.x, p.pos.z, t.pos.x, t.pos.z) : p.yaw;
    p.k.armL.hand.getWorldPosition(_a);
    for (const o of [-.08, 0, .08]) {
      const d = t ? Math.hypot(t.pos.x - _a.x, t.pos.z - _a.z) : 14, sp = 34, vy = t ? (t.pos.y + t.height * .6 - _a.y) / (d / sp) + 3.5 * (d / sp) : 2;
      p.addShot({ kind: 'r_bow', id: 'bow', mesh: p.shotMesh('bow'), x: _a.x, y: _a.y, z: _a.z, vx: Math.sin(yaw + o) * sp, vy, vz: Math.cos(yaw + o) * sp, life: 2, power: .8 * pow, core: true });
    }
    p.G.audio.sfx('throw');
  },
  firebomb(p, pow) { p.lobBomb({ fire: true, dmg: 1.2 * pow, color: 0xff8a40 }); },
  bola(p, pow) { p.throwDarts(1, 0, { dmg: 26 * pow, color: 0xc8a060, bola: true }); },
  cloud(p, pow) {
    const t = p.coreTarget(), at = t ? { x: t.pos.x, z: t.pos.z } : { x: p.pos.x + Math.sin(p.yaw) * 6, z: p.pos.z + Math.cos(p.yaw) * 6 };
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24), new THREE.MeshBasicMaterial({ color: 0x8fe040, transparent: true, opacity: .25, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    p.addShot({ kind: 'cloud', mesh, x: at.x, y: .06, z: at.z, r: 2.6, dmg: 16 * pow, life: 4.5, tick: 0 });
    p.G.audio.sfx('poison');
  },
  orbs(p, pow, C) { p.fireHex(C.skill === 'nova' ? 5 : 3, 1.2 * pow); },
  pyre(p, pow) {
    const G = p.G;
    G.fx.explosion({ x: p.pos.x, y: 0, z: p.pos.z }, 4); G.fx.ring(p.pos, 0xff8a40, 4.6, .5); G.audio.sfx('explode'); G.cam.shake(.4);
    p.areaHit(4.6, { dmg: 70 * pow, ki: 50, poise: 40, kb: 6, burn: true });
  },
  frostnova(p, pow) {
    const G = p.G;
    G.fx.shatter({ x: p.pos.x, y: 1, z: p.pos.z }, 40, 0xcfeaff, 6); G.fx.ring(p.pos, 0x9fe8ff, 4.8, .5); G.audio.sfx('ice'); G.cam.shake(.3);
    p.areaHit(4.8, { dmg: 60 * pow, ki: 50, poise: 30, kb: 5, frost: true });
  },
  icewave(p, pow, C) {
    const n = C.skill === 'icewave3' ? 3 : 1;
    for (let i = 0; i < n; i++) p.spawnWave({ dmg: 60 * pow, ki: 40, poise: 25, arc: 0, rime: true, wave: { len: 14, speed: 16, w: .8, dmg: 1, color: 0x9fe8ff }, yawOff: (i - (n - 1) / 2) * .35 });
  },
  grindwheel(p, pow) { p.spawnWave({ dmg: 95 * pow, ki: 90, poise: 50, arc: 0, heavy: true, wave: { len: 15, speed: 9, w: 1.1, dmg: 1, color: 0xffb060 } }); },
  frenzy(p, pow, C) {
    const big = !!C.boss;
    p.coreBuff = { until: p.G.time + (big ? 12 : 8), dmg: (big ? .33 : .25) * pow };
    p.G.fx.ring(p.pos, 0xff5a5a, 3, .45); p.G.hud.toast(C.skillName, 'burst');
  },
};
CASTS.icewave3 = CASTS.icewave;
// Which skills are strikes (and which strike), which are casts (and the cast's pose).
const STRIKE = { slam: 'core_slam', quake: 'core_quake', rush: 'core_rush', lunge: 'core_lunge', lance: 'core_lance', crescent: 'core_crescent', axes: 'core_axes', nova: 'core_nova', mirror: 'core_mirror' };
const POSE = { knives: 'throw', volley: 'throw', firebomb: 'throw', bola: 'throw', cloud: 'throw', orbs: 'brand', pyre: 'burst', frostnova: 'burst', icewave: 'x_palm', icewave3: 'x_palm', grindwheel: 'throw', frenzy: 'shift' };

export const coreMethods = {
  coreGrade(id) { return Math.min(CORE_MAX, this.G.save?.data.cores?.[id] || 0); },
  corePow(id) { return 1 + (this.coreGrade(id) - 1) * .12; },
  // Passives of the cores set, stronger with each fusing; summed in with gear (player.applyGear).
  coreFx() {
    const out = {};
    for (const id of this.G.save?.data.coreSlots || []) {
      const C = CORES[id]; if (!C || !this.coreGrade(id)) continue;
      out[C.fx[0]] = (out[C.fx[0]] || 0) + Math.round(C.fx[1] * (1 + (this.coreGrade(id) - 1) * .15));
    }
    return out;
  },
  coreTarget() { return this.lock?.alive ? this.lock : this.focusTarget(14); },
  frenzied() { return !!this.coreBuff && this.G.time < this.coreBuff.until; },
  // Use the core in slot i (0 or 1).
  useCore(i) {
    const G = this.G, id = G.save?.data.coreSlots?.[i], C = CORES[id];
    if (!C || !this.coreGrade(id)) { G.hud.toast('No Soul Core set there: set one under Gear'); return false; }
    if (this.anima < C.cost) { G.hud.toast(`${C.skillName} needs ${C.cost} Faelight`); return false; }
    if (this.pos.y > .3) return false;
    const pow = this.corePow(id);
    this.anima -= C.cost;
    this.ghosts.spawn(V, .5, .6); G.fx.ring(this.pos, V, 2.2, .35); G.audio.sfx('magic', { pitch: .8 });
    this.resetChain();
    if (C.skill === 'blink') {
      const t = this.coreTarget();
      if (!t) { this.anima += C.cost; G.hud.toast('No foe near enough'); return false; }
      G.hud.toast(C.skillName, 'anima');
      this.startFlashcut(t, 'riposte'); this.fc.core = 1.3 * pow;
      return true;
    }
    if (STRIKE[C.skill]) {
      this.coreMul = pow;
      this.startAttack(STRIKE[C.skill]);
      if (C.skill === 'nova') this.hexFire = 5;   // Plague Nova looses orbs too
      G.hud.toast(C.skillName, 'anima');
      return true;
    }
    this.coreCast = { C, pow, fired: false };
    this.setState('core'); this.anim.play(POSE[C.skill] || 'throw', 1.2, .04);
    this.faceTarget(true);
    G.hud.toast(C.skillName, 'anima');
    return true;
  },
  // The cast state: a slow walk, the skill at its moment, then free.
  updateCoreCast(dt, want) {
    const c = this.coreCast; if (!c) { this.setState('free'); return; }
    if (!c.fired && this.st >= .16) { c.fired = true; CASTS[c.C.skill](this, c.pow, c.C); }
    if (this.st >= .45) { this.coreCast = null; this.setState('free'); }
  },
  // Helpers the skills share.
  throwDarts(n, spread, o) {
    const G = this.G, t = this.coreTarget(), yaw = t ? yawTo(this.pos.x, this.pos.z, t.pos.x, t.pos.z) : this.yaw;
    this.k.armL.hand.getWorldPosition(_a);
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * spread, d = t ? Math.max(1, Math.hypot(t.pos.x - _a.x, t.pos.z - _a.z)) : 10, ty = t ? t.pos.y + t.height * .55 : _a.y, sp = 26;
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(o.bola ? .06 : .035, o.bola ? .2 : .32, 5), new THREE.MeshBasicMaterial({ color: o.color }));
      mesh.geometry.rotateX(Math.PI / 2);
      this.addShot({ kind: 'dart', mesh, x: _a.x, y: _a.y, z: _a.z, vx: Math.sin(yaw + off) * sp, vz: Math.cos(yaw + off) * sp, vy: (ty - _a.y) / d * sp, life: 1.2, yaw: yaw + off, dmg: o.dmg, bola: o.bola });
    }
    G.audio.sfx('throw');
  },
  lobBomb(o) {
    const G = this.G, t = this.coreTarget(), yaw = t ? yawTo(this.pos.x, this.pos.z, t.pos.x, t.pos.z) : this.yaw;
    const d = t ? Math.min(12, Math.hypot(t.pos.x - this.pos.x, t.pos.z - this.pos.z)) : 8;
    this.k.armL.hand.getWorldPosition(_a);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), new THREE.MeshBasicMaterial({ color: o.color }));
    this.addShot({ kind: 'bomb', mesh, x0: _a.x, y0: _a.y, z0: _a.z, x1: this.pos.x + Math.sin(yaw) * d, z1: this.pos.z + Math.cos(yaw) * d, dur: .55, fire: o.fire, mul: o.dmg });
    G.audio.sfx('throw');
  },
  // A burst around the knight.
  areaHit(r, o) {
    const G = this.G;
    for (const e of G.enemies) {
      if (!e.alive || e.burrowed || e.pos.y > 3 || Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z) > r + e.radius) continue;
      const res = e.takeHit({ dmg: o.dmg * this.dmgMul, ki: o.ki, poise: o.poise, dir: yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z), heavy: true, kb: o.kb });
      if (res) { this.combo.n++; this.combo.t = G.time; }
      if (res && res !== 'blocked') { if (o.burn) e.burn(BRAND.burn * 1.5); if (o.frost) e.rime(BRAND.rime * 1.5); }
    }
    for (const b of G.world.breakables) if (!b.broken && Math.hypot(b.x - this.pos.x, b.z - this.pos.z) < r + b.r) G.world.hitBreakable(b, 3, 0);
  },
  // A lingering blight cloud (a shot in flight that stays put): it eats at foes inside twice a second.
  updateCloud(s, dt) {
    const G = this.G;
    s.tick -= dt;
    s.mesh.material.opacity = .22 + Math.sin(s.t * 5) * .06;
    if (Math.random() < dt * 30) G.fx.motes({ x: s.x + (Math.random() - .5) * s.r * 1.6, y: .3, z: s.z + (Math.random() - .5) * s.r * 1.6 }, 0x8fe040, 1, .3, .6, .12, .9);
    if (s.tick <= 0) {
      s.tick = .5;
      for (const e of G.enemies) {
        if (!e.alive || e.burrowed || Math.hypot(e.pos.x - s.x, e.pos.z - s.z) > s.r + e.radius) continue;
        const res = e.takeHit({ dmg: s.dmg * this.dmgMul, ki: 8, poise: 0, dir: 0 });
        if (res) { this.combo.n++; this.combo.t = G.time; }
      }
    }
    return s.t >= s.life;
  },
};
