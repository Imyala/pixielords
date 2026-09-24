// The Pixie Lord's controller.
// Three stances (High / Mid / Low) change pace and power. A four-strike chain, stance heavies, a fae dash
// with afterimages (a perfect dash triggers Moonstep slow time), guard and perfect-guard Deflect, the
// Flashcut draw-cut that follows a Deflect or a Thorn Counter, Resonance (tap guard as a strike ends to win
// back stamina), executions, ambushes, Moondew flasks and the Fae Shift.
import * as THREE from 'three';
import { buildKnight, KnightAnimator } from './knight.js';
import { Trail } from './fx.js';
import { clamp, lerp, damp, angleDiff, turnTowards, yawTo, smooth } from './util.js';

export const STANCES = {
  high: { key: 'high', name: 'High', speed: 1.12, dmg: 1.32, cost: 1.25, ki: 1.4, guard: .9, dash: { dist: .88, dur: 1.1, cost: 1.15 }, color: 0xffb060, heavy: 'skyfall' },
  mid: { key: 'mid', name: 'Mid', speed: 1.38, dmg: 1, cost: 1, ki: 1, guard: .7, dash: { dist: 1, dur: 1, cost: 1 }, color: 0x8ff0ff, heavy: 'heavy' },
  low: { key: 'low', name: 'Low', speed: 1.75, dmg: .74, cost: .7, ki: .75, guard: 1.15, dash: { dist: 1.12, dur: .92, cost: .75 }, color: 0x9dff9a, heavy: 'needle' },
};
const ORDER = ['low', 'mid', 'high'];

// Times are in animation seconds; the stance speed scales them. hit: active frames. chain: earliest next strike.
const ATK = {
  light1: { anim: 'light1', dur: .62, hit: [.19, .31], dmg: 40, ki: 24, poise: 10, cost: 13, reach: 2.4, arc: 160, move: .7, chain: .3, next: 'light2' },
  light2: { anim: 'light2', dur: .6, hit: [.17, .29], dmg: 40, ki: 24, poise: 10, cost: 13, reach: 2.4, arc: 160, move: .7, chain: .28, next: 'light3' },
  light3: { anim: 'light3', dur: .78, hit: [.3, .4], dmg: 52, ki: 32, poise: 18, cost: 15, reach: 2.4, arc: 80, move: .9, chain: .46, next: 'light4' },
  light4: { anim: 'light4', dur: .8, hit: [.2, .5], dmg: 58, ki: 34, poise: 22, cost: 17, reach: 2.6, arc: 360, move: .6, chain: .64, next: 'light1' },
  heavy: { anim: 'heavy', dur: 1.0, hit: [.53, .63], dmg: 90, ki: 58, poise: 32, cost: 26, reach: 2.6, arc: 90, move: 1.2, chain: .74, next: 'heavy', heavy: true },
  skyfall: { anim: 'skyfall', dur: 1.05, hit: [.55, .64], dmg: 118, ki: 75, poise: 45, cost: 30, reach: 2.6, arc: 110, move: 2.2, chain: .84, next: 'heavy', heavy: true, aoe: 2.4 },
  needle: { anim: 'needle', dur: .72, hit: [.2, .4], dmg: 62, ki: 40, poise: 24, cost: 18, reach: 2.8, arc: 50, move: 4.4, chain: .5, next: 'heavy', heavy: true, fixedMove: true },
  run: { anim: 'light3', dur: .78, hit: [.3, .4], dmg: 56, ki: 30, poise: 20, cost: 16, reach: 2.4, arc: 80, move: 3.2, chain: .5, next: 'light2', fixedMove: true },
  dashSlash: { anim: 'light2', dur: .6, hit: [.15, .29], dmg: 48, ki: 26, poise: 14, cost: 12, reach: 2.5, arc: 170, move: 1.8, chain: .3, next: 'light3' },
};
const DASH = { dur: .36, dist: 4.4, iframes: [0, .24], cost: 13, perfect: .16, attackAt: .15, chainAt: .22 };
const HOP = { dur: .32, dist: 2.4, iframes: [0, .2], cost: 9 };
const THORN = { dur: .5, window: [.02, .32], cost: 10 };
const DEFLECT = .2;          // seconds after pressing guard in which a blow is deflected
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

const _a = new THREE.Vector3(), _b = new THREE.Vector3();

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
    this.stats = { vit: 1, end: 1, str: 1, spi: 1 };
    this.applyStats();
    this.spawnAt(0, 0, 0);
  }

  applyStats() { Object.assign(this, derive(this.stats)); }

  spawnAt(x, z, yaw) {
    this.pos.set(x, 0, z); this.yaw = yaw; this.vel.set(0, 0, 0);
    this.hp = this.maxHp; this.ki = this.maxKi; this.anima = this.anima ?? 0;
    this.state = 'free'; this.st = 0; this.alive = true;
    this.poison = 0; this.poisoned = 0;
    this.buffer = null; this.pulse = null; this.lock = null; this.flash = null; this.chain = 0;
    this.shifted = false; this.iframes = false; this.iframesT = 0; this.guarding = false;
    this.exhaustPending = false; this.kiSpentT = -9; this.guardPressT = -9;
    this.anim.stop();
    this.k.root.rotation.y = yaw;
    this.setShiftLook(false);
  }

  get isAttacking() { return this.state === 'attack'; }
  get moving() { return Math.hypot(this.vel.x, this.vel.z) > .5; }
  get S() { return STANCES[this.stance]; }

  setState(s) { this.state = s; this.st = 0; }

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
    this.pulse = { open: t, perfect: t + .22, close: t + .55, amount: this.pulseAmount };
    this.pulseAmount = 0;
  }

  // Resonance: tapped in time after a strike, the spent stamina flows back.
  doPulse(stanceShift = false) {
    const G = this.G, perfect = G.time <= this.pulse.perfect;
    const gain = this.pulse.amount * (perfect ? 1.1 : .6);
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
    this.hp -= dmg;
    G.hud.screenFlash('hurt'); G.audio.sfx('playerHurt', { vol: .35 });
    if (this.hp <= 0) this.die();
  }

  addPoison(n) {
    if (this.poisoned > 0 || !this.alive) return;
    this.poison += n;
    if (this.poison >= 100) { this.poison = 0; this.poisoned = 12; this.G.hud.toast('Blighted', 'poison'); this.G.audio.sfx('poison'); }
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
      const crit = this.findCrit();
      if (crit) return this.startExecution(crit.e, crit.kind);
      if (this.ki <= 0 && !this.shifted) return false;
      let key = a === 'heavy' ? this.S.heavy : 'light1';
      if (from === 'chain' && this.atk && a === 'light') key = ATK[this.atk.next] && !ATK[this.atk.next].heavy ? this.atk.next : 'light1';
      if (from === 'dash') key = a === 'light' ? 'dashSlash' : this.S.heavy;
      if (from === null && a === 'light' && this.sprinting) key = 'run';
      return this.startAttack(key);
    }
    if (a === 'dodge') {
      if (this.ki <= 0 && !this.shifted) return false;
      return this.startDash();
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

  startAttack(key) {
    const G = this.G, a = ATK[key], S = this.S;
    this.atk = a; this.atkKey = key; this.hitSet = new Set();
    this.aspeed = S.speed * (this.shifted ? 1.15 : 1);
    this.setState('attack');
    this.anim.play(a.anim, this.aspeed, .04);
    this.spendKi(a.cost * S.cost);
    this.faceTarget(true);
    // Close the gap to the foe in front, within reason; charges always travel their full length.
    const t = this.focusTarget();
    if (a.fixedMove || !t) this.lungeDist = a.move;
    else this.lungeDist = clamp(t.distToPlayer() - (t.radius + a.reach * .55), a.move * .2, a.move + 1.4);
    this.lunged = 0;
    this.swung = false;
    this.pulse = null;
    return true;
  }

  startDash() {
    const G = this.G, S = this.S;
    this.pulse = null;
    this.sprintArmed = true;
    this.moonstepped = false;
    if (this.inputYaw === null) {
      this.spendKi(HOP.cost * S.dash.cost);
      this.setState('hop'); this.anim.play('hop', 1, .03);
      this.dashYaw = this.yaw + Math.PI;
      this.dash = { dur: HOP.dur, dist: HOP.dist * S.dash.dist, iframes: HOP.iframes };
    } else {
      this.spendKi(DASH.cost * S.dash.cost);
      this.setState('dash');
      this.dashYaw = this.inputYaw;
      const dur = DASH.dur * S.dash.dur;
      this.dash = { dur, dist: DASH.dist * S.dash.dist, iframes: [0, DASH.iframes[1] * S.dash.dur + (this.stance === 'low' ? .04 : 0)] };
      this.anim.play('dash', DASH.dur / dur, .02);
      if (!this.lock) this.yaw = this.inputYaw;
      G.fx.dust(this.pos, 5);
    }
    this.dashed = 0; this.ghostT = 0;
    G.audio.sfx('roll');
    return true;
  }

  startExecution(e, kind) {
    const G = this.G;
    this.pulse = null;
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
  startFlashcut(e) {
    const G = this.G;
    this.flash = null;
    this.fc = { e, hit: false };
    const toE = yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z);
    this.yaw = toE;
    const stand = e.radius + 1.1;
    this.fc.x = e.pos.x - Math.sin(toE) * stand; this.fc.z = e.pos.z - Math.cos(toE) * stand;
    this.setState('flashcut'); this.anim.play('flashcut', 1, .02);
    this.iframes = true; this.iframesT = .9;
    e.endAttack();
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
    if ((this.state === 'dash' || this.state === 'hop') && this.st <= DASH.perfect && !this.moonstepped) { this.moonstep(); return 'miss'; }
    if (this.iframes) return 'miss';
    // Thorn Counter
    if (this.state === 'thorn' && this.st >= THORN.window[0] && this.st <= THORN.window[1] && !(h.aoe && !h.burst)) {
      this.ki = Math.min(this.maxKi, this.ki + 20);
      this.gainAnima(h.burst ? 14 : 8);
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
    const facing = Math.abs(angleDiff(this.yaw, h.dirYaw)) < 1.4;
    const recovering = this.state === 'attack' && this.st * this.aspeed >= this.atk.hit[1];
    const justPressed = G.time - this.guardPressT <= DEFLECT && (['free', 'deflect', 'hurt', 'counter'].includes(this.state) || recovering);
    if ((this.guarding || justPressed) && facing && !h.burst) {
      if (justPressed && !h.aoe) return this.deflect(h);
      const kiDmg = h.dmg * (h.heavy ? 1.05 : .8) * this.S.guard;
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
    if (this.shifted) {
      this.anima -= dmg * .5;
      dmg = 0;
      G.fx.spark(_a.set(this.pos.x, 1.2, this.pos.z), { x: 0, z: 0 }, 14, 0xff7ae0, 5);
      if (this.anima <= 0) this.endShift();
    }
    this.hp -= dmg;
    this.chain = 0;
    if (h.poison) this.addPoison(h.poison);
    G.hitstop = .06;
    G.cam.shake(h.heavy ? .45 : .28);
    G.audio.sfx('playerHurt');
    G.fx.blood(_a.set(this.pos.x, 1.2, this.pos.z), { x: -Math.sin(h.dirYaw), z: -Math.cos(h.dirYaw) }, 14, 0x5a0808);
    G.hud.screenFlash('hurt');
    if (this.hp <= 0) { this.die(); return 'hit'; }
    const armored = this.state === 'attack' && this.atk.heavy && this.st * this.aspeed > .2 && this.st * this.aspeed < this.atk.hit[1] && !h.heavy;
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
    this.ki = Math.min(this.maxKi, this.ki + 8);
    this.gainAnima(6);
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
    G.warp = 1.1;
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
    this.trail.mat.uniforms.uColor.value.setHex(on ? 0xff6ad5 : 0x9ff3ff);
  }

  // ------------------------------------------------ frame
  update(dt) {
    const G = this.G, inp = G.input;
    this.st += dt;

    // Input buffering.
    if (this.alive && G.controlsOn) {
      for (const a of ['light', 'heavy', 'dodge', 'burst', 'heal', 'shift']) if (inp.hit(a)) this.buffer = { a, t: G.time };
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
    if (this.buffer && G.time - this.buffer.t > .35) this.buffer = null;
    if (this.pulse && G.time > this.pulse.close) this.pulse = null;
    if (this.flash && G.time > this.flash.until) this.flash = null;
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
    const take = a => { if (this.buffer && this.buffer.a === a) { this.buffer = null; return true; } return false; };
    const takeAny = list => { if (this.buffer && list.includes(this.buffer.a)) { const a = this.buffer.a; this.buffer = null; return a; } return null; };
    const moveInput = () => this.inputYaw !== null;

    switch (this.state) {
      case 'free': {
        if (this.exhaustPending && this.ki <= 0) { this.exhaustPending = false; this.setState('exhausted'); this.anim.play('stagger', 1.3); G.hud.toast('Out of breath', 'warn'); G.audio.sfx('playerHurt', { vol: .4 }); break; }
        this.exhaustPending = false;
        const act = takeAny(['light', 'heavy', 'dodge', 'burst', 'heal', 'shift']);
        if (act && this.tryStart(act)) break;
        this.guarding = G.controlsOn && inp.down('guard');
        this.sprinting = !!this.sprintArmed && inp.down('dodge') && mag > .3 && !this.guarding;
        const speed = this.guarding ? 3 : this.sprinting ? 8.2 : this.lock ? 5 : 6.2;
        const s = speed * mag;
        if (moveInput()) want = { x: Math.sin(this.inputYaw) * s, z: Math.cos(this.inputYaw) * s };
        if (this.lock && !this.sprinting) turn = yawTo(this.pos.x, this.pos.z, this.lock.pos.x, this.lock.pos.z);
        else if (moveInput()) turn = this.inputYaw;
        break;
      }
      case 'attack': {
        const a = this.atk, t = this.st * this.aspeed;
        if (t < .1 && !this.lock && moveInput()) this.yaw = turnTowards(this.yaw, this.inputYaw, 10 * dt);
        // Lunge through the windup, stopping short of whoever is in the way.
        const until = a.fixedMove ? a.hit[1] : a.hit[0] + .04;
        if (t < until) {
          const k = smooth(clamp(t / until, 0, 1)), dist = this.lungeDist * k - this.lunged;
          const blocker = G.enemies.some(e => e.alive && e.distToPlayer() < e.radius + this.radius + .45 && Math.abs(angleDiff(this.yaw, yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z))) < .9);
          if (!blocker) { this.pos.x += Math.sin(this.yaw) * dist; this.pos.z += Math.cos(this.yaw) * dist; }
          this.lunged += dist;
          lean.x = .12;
        }
        if (!this.swung && t >= a.hit[0] - .05) { this.swung = true; G.audio.sfx(a.heavy ? 'swingHeavy' : 'swing', { pitch: this.stance === 'low' ? 1.2 : this.stance === 'high' ? .85 : 1 }); }
        if (t >= a.hit[0] && t <= a.hit[1] + .02) this.detectHits(a);
        if (t >= a.hit[1] && this.pulseAmount) this.openPulse();
        if (t >= a.chain) {
          const nxt = takeAny(['light', 'heavy']);
          if (nxt && this.tryStart(nxt, 'chain')) break;
        }
        // Recovery can be cut short by a dash, a counter, raising the guard, or simply moving.
        if (t >= a.hit[1] + .02) {
          const c = takeAny(['dodge', 'burst', 'heal']);
          if (c && this.tryStart(c)) break;
          if (G.controlsOn && inp.down('guard')) { this.setState('free'); break; }
        }
        if (t >= a.dur * .78 && moveInput()) { this.setState('free'); break; }
        if (t >= a.dur) this.setState('free');
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
          const c = takeAny(['light', 'heavy', 'burst']);
          if (c && this.tryStart(c, c === 'burst' ? null : 'dash')) break;
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
        if (moveInput() && !this.lock) turn = this.inputYaw;
        if (!this.healed && this.st >= .48) {
          this.healed = true;
          this.heal(this.maxHp * .42 + 40);
          this.poisoned = 0; this.poison = 0;
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
        const total = ATK.heavy.dmg * this.dmgMul * (big ? 2.2 : 3.4) * (this.shifted ? 1.4 : 1);
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
      case 'dead':
        break;
    }

    // Knockback from blocks and hits decays smoothly.
    if (this.knock) {
      this.pos.x += Math.sin(this.knock.yaw) * this.knock.v * dt; this.pos.z += Math.cos(this.knock.yaw) * this.knock.v * dt;
      this.knock.v = damp(this.knock.v, 0, 9, dt);
      if (this.knock.v < .05) this.knock = null;
    }

    // Voluntary movement: quick to start, quick to stop.
    const accel = this.state === 'free' ? (Math.hypot(want.x, want.z) > .1 ? 16 : 20) : 30;
    this.vel.x = damp(this.vel.x, want.x, accel, dt); this.vel.z = damp(this.vel.z, want.z, accel, dt);
    if (this.state === 'free' || this.state === 'drink') { this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt; }
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
      if (!e.alive || (this.state === 'grapple' && this.grapple.e === e) || (this.state === 'flashcut' && this.fc.e === e)) continue;
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

  flashcutHit(e) {
    const G = this.G;
    if (!e.alive) return;
    const big = e.boss || e.elite;
    const dmg = e.boss ? e.maxHp * .1 : e.elite ? Math.max(e.maxHp * .28, 150) : e.hp + 1;
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
      const c = { x: this.pos.x + Math.sin(this.yaw) * 1.3, z: this.pos.z + Math.cos(this.yaw) * 1.3 };
      G.fx.ring(c, S.color, a.aoe * 1.3, .35); G.fx.dust(c, 16);
      G.audio.sfx('slam', { vol: .8 }); G.cam.shake(.35);
      for (const e of G.enemies) {
        if (!e.alive || this.hitSet.has(e) || e.state === 'grappled') continue;
        if (Math.hypot(e.pos.x - c.x, e.pos.z - c.z) < a.aoe + e.radius) this.strike(e, a);
      }
    }
    for (const e of G.enemies) {
      if (!e.alive || this.hitSet.has(e) || e.state === 'grappled') continue;
      const dx = e.pos.x - this.pos.x, dz = e.pos.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d > a.reach + e.radius) continue;
      const ang = Math.abs(angleDiff(this.yaw, Math.atan2(dx, dz)));
      if (ang > a.arc * Math.PI / 360 && d > e.radius + .7) continue;
      this.strike(e, a);
    }
  }

  strike(e, a) {
    const G = this.G, S = this.S;
    this.hitSet.add(e);
    const dx = e.pos.x - this.pos.x, dz = e.pos.z - this.pos.z, d = Math.max(.01, Math.hypot(dx, dz));
    const mul = this.dmgMul * S.dmg * (this.shifted ? 1.6 : 1) * (e.state === 'broken' ? 1.25 : 1);
    const res = e.takeHit({ dmg: a.dmg * mul, ki: a.ki * S.ki * (this.shifted ? 1.5 : 1), poise: a.poise * (this.stance === 'high' ? 1.3 : 1), dir: this.yaw, heavy: !!a.heavy });
    if (!res) return;
    const p = _a.set(e.pos.x - dx / d * e.radius * .6, Math.min(1.3, e.height * .55), e.pos.z - dz / d * e.radius * .6);
    const side = this.atkKey === 'light1' || this.atkKey === 'light4' ? 1 : -1;
    const dir = { x: Math.cos(this.yaw) * side, z: -Math.sin(this.yaw) * side };
    G.fx.spark(p, dir, a.heavy ? 22 : 12, this.shifted ? 0xff9cf0 : 0xffd080, a.heavy ? 8 : 6);
    G.fx.blood(p, { x: dx / d, z: dz / d }, a.heavy ? 16 : 8, 0x2a0606);
    G.audio.sfx(a.heavy ? 'hitHeavy' : 'hit', { x: e.pos.x, z: e.pos.z });
    G.hitstop = Math.max(G.hitstop, a.heavy ? .08 : .045);
    G.cam.shake(a.heavy ? .22 : .08);
    this.gainAnima(a.heavy ? 7 : 4);
  }

  updateResources(dt) {
    const G = this.G;
    const busy = ['attack', 'dash', 'hop', 'thorn'].includes(this.state);
    if (!busy && G.time - this.kiSpentT > .35 && this.ki < this.maxKi) {
      const rate = 52 * (this.guarding ? .45 : 1) * (this.state === 'exhausted' || this.state === 'stagger' ? 1.5 : 1) * (this.sprinting ? .6 : 1);
      this.ki = Math.min(this.maxKi, this.ki + rate * dt);
    }
    if (this.poisoned > 0 && this.alive && G.state === 'play' && this.state !== 'rest') {
      this.poisoned -= dt;
      this.hp -= this.maxHp * .012 * dt;
      if (Math.random() < dt * 6) G.fx.motes({ x: this.pos.x, y: 1, z: this.pos.z }, 0x8fe040, 1, .3, .8, .1, .8);
      if (this.hp <= 0) this.die();
    } else this.poison = Math.max(0, this.poison - 8 * dt);
    if (this.shifted) {
      this.anima -= 100 / this.shiftDur * dt;
      if (Math.random() < dt * 30) G.fx.motes({ x: this.pos.x, y: 1.2, z: this.pos.z }, Math.random() < .5 ? 0xff9cf0 : 0x9ff3ff, 1, .5, 1, .1, .8);
      if (this.anima <= 0) this.endShift();
    }
    if (this.state !== 'attack') this.aoeDone = false;
  }

  updateVisuals(dt) {
    const G = this.G, k = this.k, A = this.anim;
    k.root.rotation.y = this.yaw;
    const sp = Math.hypot(this.vel.x, this.vel.z);
    const lf = Math.cos(this.yaw) * this.vel.z + Math.sin(this.yaw) * this.vel.x;
    const ls = Math.cos(this.yaw) * this.vel.x - Math.sin(this.yaw) * this.vel.z;
    A.capeLag = clamp(sp / 8, 0, 1) * .9 + (this.state === 'dash' ? .5 : 0);
    const prevStep = Math.floor(A.gait / Math.PI);
    A.update(dt, { speed: ['free', 'drink', 'fog'].includes(this.state) ? sp : 0, forward: sp > .1 ? lf / sp : 1, side: sp > .1 ? ls / sp : 0, guard: this.guarding, sprint: this.sprinting, shifted: this.shifted, stance: this.stance });
    if (Math.floor(A.gait / Math.PI) !== prevStep && sp > .8) G.audio.sfx('step');
    this.ghosts.update(dt);

    // Sword trail while swinging.
    const swinging = ['attack', 'counter', 'grapple', 'flashcut', 'deflect'].includes(this.state) || (this.state === 'thorn' && this.st < .1);
    k.root.updateMatrixWorld(true);
    if (swinging) {
      k.base.getWorldPosition(_a); k.tip.getWorldPosition(_b);
      this.trail.add(_a, _b, G.time);
    }
    this.trail.update(G.time);

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
