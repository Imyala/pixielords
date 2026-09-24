// The Pixie Lord's controller: movement, a light/heavy combo chain, dodge roll with i-frames, guard,
// Ki (stamina) with Ki Pulse, Burst Counter, grapples/backstabs, elixirs and the Fae Shift.
import * as THREE from 'three';
import { buildKnight, KnightAnimator } from './knight.js';
import { Trail } from './fx.js';
import { clamp, lerp, damp, angleDiff, turnTowards, yawTo, rand, smooth } from './util.js';

// Anim time is seconds at speed 1. hit: active window. chain: earliest next attack. cancel: earliest dodge.
const ATK = {
  light1: { anim: 'light1', dur: .62, hit: [.19, .31], dmg: 42, ki: 24, poise: 10, cost: 15, reach: 2.4, arc: 160, move: .75, chain: .34, cancel: .36, next: 'light2' },
  light2: { anim: 'light2', dur: .6, hit: [.17, .29], dmg: 42, ki: 24, poise: 10, cost: 15, reach: 2.4, arc: 160, move: .75, chain: .32, cancel: .34, next: 'light3' },
  light3: { anim: 'light3', dur: .78, hit: [.3, .4], dmg: 62, ki: 36, poise: 20, cost: 19, reach: 2.4, arc: 80, move: 1, chain: .56, cancel: .5, next: 'light1' },
  heavy: { anim: 'heavy', dur: 1.0, hit: [.53, .63], dmg: 92, ki: 58, poise: 32, cost: 28, reach: 2.6, arc: 90, move: 1.2, chain: .74, cancel: .72, next: 'heavy', heavy: true },
  run: { anim: 'light3', dur: .78, hit: [.3, .4], dmg: 58, ki: 30, poise: 20, cost: 18, reach: 2.4, arc: 80, move: 3, chain: .56, cancel: .5, next: 'light2' },
};
const ROLL = { dur: .6, dist: 4.4, iframes: [.03, .36], cost: 17, attackAt: .44 };
const BACKSTEP = { dur: .42, dist: 1.9, iframes: [.02, .2], cost: 10 };
const BURST = { dur: .55, window: [.02, .34], cost: 10 };

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

export class Player {
  constructor(G) {
    this.G = G;
    this.k = buildKnight();
    this.anim = new KnightAnimator(this.k);
    G.scene.add(this.k.root);
    this.k.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
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
    this.stats = { vit: 1, end: 1, str: 1, spi: 1 };
    this.applyStats();
    this.spawnAt(0, 0, 0);
  }

  applyStats() {
    const d = derive(this.stats);
    Object.assign(this, d);
  }

  spawnAt(x, z, yaw) {
    this.pos.set(x, 0, z); this.yaw = yaw; this.vel.set(0, 0, 0);
    this.hp = this.maxHp; this.ki = this.maxKi; this.anima = this.anima ?? 0;
    this.state = 'free'; this.st = 0; this.alive = true;
    this.poison = 0; this.poisoned = 0;
    this.buffer = null; this.pulse = null; this.lock = null;
    this.shifted = false; this.iframes = false; this.guarding = false;
    this.exhaustPending = false; this.kiSpentT = -9;
    this.hpTrail = this.hp;
    this.anim.stop();
    this.k.root.rotation.y = yaw;
    this.setShiftLook(false);
  }

  get isAttacking() { return this.state === 'attack'; }
  get moving() { return Math.hypot(this.vel.x, this.vel.z) > .5; }
  get lockable() { return true; }

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

  doPulse() {
    const G = this.G, perfect = G.time <= this.pulse.perfect;
    const gain = this.pulse.amount * (perfect ? 1.1 : .6);
    this.ki = Math.min(this.maxKi, this.ki + gain);
    if (this.ki > 0) this.exhaustPending = false;
    this.gainAnima(perfect ? 6 : 3);
    this.pulse = null;
    G.fx.ring(this.pos, 0x7ff0ff, 2.2, .35);
    G.fx.motes({ x: this.pos.x, y: .6, z: this.pos.z }, 0x9ff3ff, 18, .6, 2.2, .1, .7);
    G.audio.sfx('pulse', { vol: perfect ? 1 : .6 });
    G.hud.toast(perfect ? 'Perfect Ki Pulse' : 'Ki Pulse', 'pulse');
  }

  gainAnima(n) {
    if (this.shifted) return;
    const before = this.anima;
    this.anima = Math.min(100, this.anima + n * this.animaGain);
    if (before < 100 && this.anima >= 100) { this.G.hud.toast('Anima full — G to Fae Shift', 'anima'); this.G.audio.sfx('heal', { vol: .5 }); }
  }

  addPoison(n) {
    if (this.poisoned > 0 || !this.alive) return;
    this.poison += n;
    if (this.poison >= 100) { this.poison = 0; this.poisoned = 12; this.G.hud.toast('Poisoned', 'poison'); this.G.audio.sfx('poison'); }
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
      // dir +1 = to the right on screen = more negative yaw.
      const rel = (cur - a) * dir;
      if (rel <= 0) continue;
      if (rel < bd) { bd = rel; best = e; }
    }
    if (best) { this.lock = best; G.audio.sfx('ui'); }
  }

  updateLock() {
    const e = this.lock;
    if (!e) return;
    if (!e.alive || e.state === 'dead') {
      // Hop to the next nearby foe, like the classics do.
      const next = this.candidates(10).sort((a, b) => a.distToPlayer() - b.distToPlayer())[0];
      this.lock = next || null;
      return;
    }
    if (e.distToPlayer() > 26) { this.lock = null; return; }
    this.lockHidden = this.G.world.los(this.pos, e.pos, 1.4) ? 0 : (this.lockHidden || 0) + 1 / 60;
    if (this.lockHidden > 2) this.lock = null;
  }

  findCrit() {
    const G = this.G;
    let best = null, bd = Infinity;
    for (const e of G.enemies) {
      if (!e.alive) continue;
      const d = e.distToPlayer() - e.radius;
      if (d > 3.2) continue;
      const toE = yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z);
      const facing = Math.abs(angleDiff(this.lock === e ? toE : this.yaw, toE)) < 1.3;
      if (e.state === 'broken' && facing && d < bd) { best = { e, kind: 'grapple' }; bd = d; continue; }
      if (!e.aware && !e.boss && !e.elite && d < 1.6) {
        const behind = Math.abs(angleDiff(e.yaw, yawTo(e.pos.x, e.pos.z, this.pos.x, this.pos.z))) > 2.1;
        if (behind && facing && d < bd) { best = { e, kind: 'backstab' }; bd = d; }
      }
    }
    return best;
  }

  // ------------------------------------------------ actions
  tryStart(a, fromChain = false) {
    const G = this.G;
    if (a === 'light' || a === 'heavy') {
      const crit = this.findCrit();
      if (crit) return this.startGrapple(crit.e, crit.kind);
      if (this.ki <= 0 && !this.shifted) return false;
      let key = a === 'heavy' ? 'heavy' : 'light1';
      if (a === 'light' && this.sprinting && !fromChain) key = 'run';
      if (fromChain && this.atk) {
        if (a === 'light') key = this.atk.next === 'heavy' ? 'light1' : this.atk.next;
        if (a === 'heavy') key = 'heavy';
      }
      if (this.state === 'roll' && a === 'light') key = 'light2';
      return this.startAttack(key);
    }
    if (a === 'dodge') {
      if (this.ki <= 0 && !this.shifted) return false;
      return this.startRoll();
    }
    if (a === 'burst') {
      if (this.ki <= 0 && !this.shifted) return false;
      this.spendKi(BURST.cost, false);
      this.setState('burst'); this.anim.play('burst', 1, .03);
      this.faceTarget(true);
      G.audio.sfx('swing', { vol: .5 });
      G.fx.flash(_a.set(this.pos.x, 1.2, this.pos.z), 0xff6ad5, 1.6, .3, true);
      return true;
    }
    if (a === 'heal') {
      if (this.elixirs <= 0) { G.hud.toast('No elixirs left'); return false; }
      this.elixirs--; this.healed = false;
      this.setState('drink'); this.anim.play('drink');
      G.audio.sfx('drink');
      return true;
    }
    if (a === 'shift') {
      if (this.anima < 100 || this.shifted) { if (!this.shifted) G.hud.toast('Anima is not yet full'); return false; }
      this.setState('shift'); this.anim.play('shift');
      G.audio.sfx('shift');
      G.cam.shake(.4);
      return true;
    }
    return false;
  }

  startAttack(key) {
    const G = this.G, a = ATK[key];
    this.atk = a; this.atkKey = key; this.hitSet = new Set();
    this.setState('attack');
    this.anim.play(a.anim, 1, .05);
    this.spendKi(a.cost);
    this.faceTarget(true);
    this.lunged = 0;
    this.swung = false;
    this.pulse = null;
    return true;
  }

  startRoll() {
    const G = this.G;
    this.pulse = null;
    this.sprintArmed = true;
    if (this.inputYaw === null) {
      this.spendKi(BACKSTEP.cost);
      this.setState('backstep'); this.anim.play('backstep', 1, .04);
      this.rollYaw = this.yaw + Math.PI;
    } else {
      this.spendKi(ROLL.cost);
      this.setState('roll'); this.anim.play('roll', 1, .03);
      this.rollYaw = this.inputYaw;
      this.yaw = this.inputYaw;
      G.fx.dust(this.pos, 6);
    }
    this.rolled = 0;
    G.audio.sfx('roll');
    return true;
  }

  startGrapple(e, kind) {
    const G = this.G;
    this.pulse = null;
    this.grapple = { e, kind, hits: 0 };
    e.endAttack(); e.state = 'grappled'; e.st = 0; e.grappleK = 0;
    const toE = yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z);
    this.yaw = toE;
    if (kind === 'backstab') e.yaw = toE;
    const stand = e.radius + .75;
    this.grapple.x = e.pos.x - Math.sin(toE) * stand; this.grapple.z = e.pos.z - Math.cos(toE) * stand;
    this.setState('grapple'); this.anim.play('grapple', 1, .04);
    this.iframes = true; this.iframesT = .1;   // nothing may interrupt the grapple on its first frame
    G.hud.toast(kind === 'backstab' ? 'Backstab' : 'Grapple', 'crit');
    G.audio.sfx('swingHeavy');
    this.lock = this.lock || e;
    return true;
  }

  faceTarget(snap) {
    const G = this.G;
    let want = null;
    if (this.lock) want = yawTo(this.pos.x, this.pos.z, this.lock.pos.x, this.lock.pos.z);
    else if (this.inputYaw !== null) want = this.inputYaw;
    else {
      // Soft aim: the nearest foe roughly ahead.
      let bd = 3.5;
      for (const e of G.enemies) {
        if (!e.alive) continue;
        const d = e.distToPlayer(), y = yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z);
        if (d < bd && Math.abs(angleDiff(this.yaw, y)) < 1) { bd = d; want = y; }
      }
    }
    if (want !== null) this.yaw = snap ? want : turnTowards(this.yaw, want, .2);
  }

  // Enemy-side entry point. Returns 'miss' | 'countered' | 'blocked' | 'hit'.
  receiveHit(h) {
    const G = this.G;
    if (!this.alive || this.iframes) return 'miss';
    // Burst Counter
    if (this.state === 'burst' && this.st >= BURST.window[0] && this.st <= BURST.window[1] && !(h.aoe && !h.burst)) {
      this.setState('counter'); this.anim.play('counter', 1, .02);
      this.iframesT = .45;
      this.ki = Math.min(this.maxKi, this.ki + 20);
      this.gainAnima(h.burst ? 14 : 8);
      if (h.from && !h.projectile) {
        h.from.countered(h.burst);
        this.yaw = yawTo(this.pos.x, this.pos.z, h.from.pos.x, h.from.pos.z);
      }
      G.hitstop = h.burst ? .16 : .09;
      G.cam.shake(h.burst ? .5 : .3);
      G.audio.sfx('burstCounter');
      G.fx.spark(_a.set(this.pos.x + Math.sin(this.yaw) * .7, 1.2, this.pos.z + Math.cos(this.yaw) * .7), { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }, 30, 0x9ff3ff, 9);
      G.fx.ring(this.pos, 0xff7ae0, 3, .4, 1.1);
      G.hud.toast(h.burst ? 'Burst Counter' : 'Counter', 'burst');
      G.hud.screenFlash('burst');
      return 'countered';
    }
    // Guard
    const facing = Math.abs(angleDiff(this.yaw, h.dirYaw)) < 1.35;
    if (this.guarding && facing && !h.burst) {
      const kiDmg = h.dmg * (h.heavy ? 1.05 : .8);
      this.ki -= kiDmg; this.kiSpentT = G.time;
      const sp = _a.set(this.pos.x + Math.sin(this.yaw) * .5, 1.25, this.pos.z + Math.cos(this.yaw) * .5);
      G.fx.spark(sp, { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }, 16, 0xffe0a0, 6);
      if (this.ki < 0) {
        this.ki = 0; this.setState('stagger'); this.anim.play('stagger');
        G.audio.sfx('guardBreak'); G.hud.toast('Guard broken', 'warn'); G.cam.shake(.4);
        return 'blocked';
      }
      G.audio.sfx('block');
      const push = h.heavy ? .5 : .2;
      this.pos.x -= Math.sin(h.dirYaw) * push; this.pos.z -= Math.cos(h.dirYaw) * push;
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
    if (h.poison) this.addPoison(h.poison);
    G.hitstop = .07;
    G.cam.shake(h.heavy ? .45 : .28);
    G.audio.sfx('playerHurt');
    G.fx.blood(_a.set(this.pos.x, 1.2, this.pos.z), { x: -Math.sin(h.dirYaw), z: -Math.cos(h.dirYaw) }, 14, 0x5a0808);
    G.hud.screenFlash('hurt');
    if (this.hp <= 0) { this.die(); return 'hit'; }
    const armored = this.state === 'attack' && this.atk.heavy && this.st > .25 && this.st < this.atk.hit[1] && !h.heavy;
    if (!armored && !this.shifted) {
      this.setState('hurt'); this.hurtDur = h.heavy ? .75 : .42;
      this.anim.play(h.heavy ? 'stagger' : 'hurt', h.heavy ? 1.6 : 1, .03);
      this.knock = { yaw: h.dirYaw + Math.PI, v: h.heavy ? 5 : 2.2 };
      this.pulse = null;
    }
    return 'hit';
  }

  die() {
    const G = this.G;
    this.hp = 0; this.alive = false; this.lock = null;
    this.setState('dead'); this.anim.play('death', 1, .05);
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
      if (inp.hit('guard') && this.pulse && G.time <= this.pulse.close) this.doPulse();
      if (!inp.down('dodge')) this.sprintArmed = false;
    }
    if (this.buffer && G.time - this.buffer.t > .4) this.buffer = null;
    if (this.pulse && G.time > this.pulse.close) this.pulse = null;
    this.updateLock();

    // Camera-relative move input.
    const mv = G.controlsOn && this.alive ? inp.move() : { x: 0, y: 0 };
    const cy = G.cam.yaw, mag = Math.min(1, Math.hypot(mv.x, mv.y));
    const wx = Math.sin(cy) * mv.y - Math.cos(cy) * mv.x, wz = Math.cos(cy) * mv.y + Math.sin(cy) * mv.x;
    this.inputYaw = mag > .15 ? Math.atan2(wx, wz) : null;

    let want = { x: 0, z: 0 }, turn = null, turnRate = 14;
    this.iframes = this.iframesT > 0;
    this.iframesT = Math.max(0, (this.iframesT || 0) - dt);
    this.guarding = false; this.sprinting = false;
    const take = a => { if (this.buffer && this.buffer.a === a) { this.buffer = null; return true; } return false; };
    const takeAny = list => { if (this.buffer && list.includes(this.buffer.a)) { const a = this.buffer.a; this.buffer = null; return a; } return null; };

    switch (this.state) {
      case 'free': {
        if (this.exhaustPending && this.ki <= 0) { this.exhaustPending = false; this.setState('exhausted'); this.anim.play('stagger', .9); G.hud.toast('Ki exhausted', 'warn'); G.audio.sfx('playerHurt', { vol: .4 }); break; }
        this.exhaustPending = false;
        const act = takeAny(['light', 'heavy', 'dodge', 'burst', 'heal', 'shift']);
        if (act && this.tryStart(act)) break;
        this.guarding = G.controlsOn && inp.down('guard');
        this.sprinting = !!this.sprintArmed && inp.down('dodge') && mag > .3 && !this.guarding;
        const speed = this.guarding ? 2.3 : this.sprinting ? 6.8 : 4.5;
        const s = speed * mag;
        want = { x: Math.sin(this.inputYaw ?? 0) * s, z: Math.cos(this.inputYaw ?? 0) * s };
        if (this.inputYaw === null) want = { x: 0, z: 0 };
        if (this.lock && !this.sprinting) turn = yawTo(this.pos.x, this.pos.z, this.lock.pos.x, this.lock.pos.z);
        else if (this.inputYaw !== null) turn = this.inputYaw;
        break;
      }
      case 'attack': {
        const a = this.atk, t = this.st;
        if (t < .12) { this.faceTarget(false); }
        // Lunge forward through the windup, stopping short of whoever we're swinging at.
        if (t < a.hit[1]) {
          const k = smooth(clamp(t / a.hit[1], 0, 1)), dist = a.move * k - this.lunged;
          const blocker = G.enemies.some(e => e.alive && e.distToPlayer() < e.radius + this.radius + .55 && Math.abs(angleDiff(this.yaw, yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z))) < .9);
          if (!blocker) { this.pos.x += Math.sin(this.yaw) * dist; this.pos.z += Math.cos(this.yaw) * dist; }
          this.lunged += dist;
        }
        if (!this.swung && t >= a.hit[0] - .06) { this.swung = true; G.audio.sfx(a.heavy ? 'swingHeavy' : 'swing'); }
        if (t >= a.hit[0] && t <= a.hit[1] + .02) this.detectHits(a);
        if (t >= a.hit[1] && this.pulseAmount) this.openPulse();
        if (t >= a.chain) {
          const nxt = takeAny(['light', 'heavy']);
          if (nxt) { if (this.tryStart(nxt, true)) break; }
        }
        if (t >= a.cancel) {
          const c = takeAny(['dodge', 'burst']);
          if (c && this.tryStart(c)) break;
        }
        if (t >= a.dur) this.setState('free');
        break;
      }
      case 'roll':
      case 'backstep': {
        const R = this.state === 'roll' ? ROLL : BACKSTEP;
        const t = this.st, k = clamp(t / (R.dur * .78), 0, 1);
        const d = R.dist * (1 - Math.pow(1 - k, 2.2));
        const step = d - this.rolled; this.rolled = d;
        this.pos.x += Math.sin(this.rollYaw) * step; this.pos.z += Math.cos(this.rollYaw) * step;
        this.iframes = t >= R.iframes[0] && t <= R.iframes[1];
        if (this.state === 'backstep') this.yaw = this.rollYaw + Math.PI;
        if (t > R.dur * .7 && this.pulseAmount) this.openPulse();
        if (this.state === 'roll' && t >= ROLL.attackAt) {
          const c = takeAny(['light', 'heavy', 'dodge', 'burst']);
          if (c) {
            if (c === 'dodge') { this.setState('free'); this.tryStart('dodge'); break; }
            if (this.tryStart(c)) break;
          }
        }
        if (t >= R.dur) { this.setState('free'); G.fx.dust(this.pos, 4); }
        break;
      }
      case 'hurt': {
        if (this.knock) {
          this.pos.x += Math.sin(this.knock.yaw) * this.knock.v * dt; this.pos.z += Math.cos(this.knock.yaw) * this.knock.v * dt;
          this.knock.v = damp(this.knock.v, 0, 8, dt);
        }
        if (this.st > this.hurtDur * .7 && take('dodge') && this.tryStart('dodge')) break;
        if (this.st >= this.hurtDur) this.setState('free');
        break;
      }
      case 'stagger':
      case 'exhausted':
        if (this.st >= (this.state === 'stagger' ? 1.2 : 1.05)) { this.setState('free'); this.ki = Math.max(this.ki, this.maxKi * .25); }
        break;
      case 'drink': {
        const s = 1.2 * mag;
        want = this.inputYaw === null ? want : { x: Math.sin(this.inputYaw) * s, z: Math.cos(this.inputYaw) * s };
        if (this.inputYaw !== null && !this.lock) turn = this.inputYaw;
        if (!this.healed && this.st >= .6) {
          this.healed = true;
          this.hp = Math.min(this.maxHp, this.hp + this.maxHp * .42 + 40);
          this.poisoned = 0; this.poison = 0;
          G.audio.sfx('heal');
          G.fx.motes({ x: this.pos.x, y: .4, z: this.pos.z }, 0xff9cd0, 24, .5, 2, .12, 1);
        }
        if (this.st >= 1.15) this.setState('free');
        break;
      }
      case 'burst':
        if (this.st >= BURST.dur) this.setState('free');
        break;
      case 'counter':
        if (this.st >= .7) this.setState('free');
        else if (this.st > .35) { const c = takeAny(['light', 'heavy']); if (c) { this.setState('free'); this.tryStart(c); } }
        break;
      case 'grapple': {
        const g = this.grapple, e = g.e;
        this.iframes = true;
        this.pos.x = damp(this.pos.x, g.x, 20, dt); this.pos.z = damp(this.pos.z, g.z, 20, dt);
        this.yaw = yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z);
        e.grappleK = clamp(this.st / 1.1, 0, 1);
        const big = e.boss || e.elite;
        const total = ATK.heavy.dmg * this.dmgMul * (big ? 2.2 : 3.4) * (this.shifted ? 1.4 : 1);
        if (g.hits === 0 && this.st >= .3) { g.hits = 1; this.critHit(e, total * .35, false); }
        if (g.hits === 1 && this.st >= .8) { g.hits = 2; this.critHit(e, total * .65, true); }
        if (this.st >= 1.1) {
          this.setState('free');
          if (e.alive && e.state === 'grappled') { e.state = 'hurt'; e.st = 0; e.hurtDur = .7; e.ki = e.maxKi * .6; }
        }
        break;
      }
      case 'shift':
        this.iframes = true;
        if (this.st >= .45 && !this.shifted) this.startShift();
        if (this.st >= 1) this.setState('free');
        break;
      case 'rest':
        this.iframes = true;
        break;
      case 'rise':
        if (this.st >= 1.2) this.setState('free');
        break;
      case 'fog': {
        // Walk through the fog and on into the arena, so the camera ends up inside too.
        this.iframes = true;
        const sp = 3.4;
        this.pos.x = damp(this.pos.x, 0, 6, dt);
        this.pos.z += sp * dt; this.yaw = 0;
        want = { x: 0, z: sp };
        if (this.pos.z >= 122.6 || this.st >= 3) { this.pos.set(0, 0, 122.6); this.setState('free'); this.anim.stop(); G.onFogCrossed(); }
        break;
      }
      case 'pickup':
        if (this.st >= .7) this.setState('free');
        break;
      case 'dead':
        break;
    }

    // Velocity integration for voluntary movement (actions move the position directly).
    const accel = this.state === 'free' ? 22 : 30;
    this.vel.x = damp(this.vel.x, want.x, accel, dt); this.vel.z = damp(this.vel.z, want.z, accel, dt);
    if (this.state === 'free' || this.state === 'drink') { this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt; }
    else this.vel.multiplyScalar(Math.exp(-10 * dt));
    if (turn !== null) this.yaw = turnTowards(this.yaw, turn, turnRate * dt);

    // Collisions: walls, then bodies.
    if (this.state !== 'fog') G.world.collide(this.pos, this.radius);
    for (const e of G.enemies) {
      if (!e.alive || (this.state === 'grapple' && this.grapple.e === e)) continue;
      const dx = this.pos.x - e.pos.x, dz = this.pos.z - e.pos.z, d = Math.hypot(dx, dz), m = this.radius + e.radius;
      if (d < m && d > 1e-4) {
        const push = m - d, share = e.boss || e.elite || e.state === 'attack' ? 1 : .6;
        this.pos.x += dx / d * push * share; this.pos.z += dz / d * push * share;
        e.pos.x -= dx / d * push * (1 - share); e.pos.z -= dz / d * push * (1 - share);
      }
    }
    if (this.state !== 'fog') G.world.collide(this.pos, this.radius);

    this.updateResources(dt);
    this.updateVisuals(dt, mag);
  }

  critHit(e, dmg, final) {
    const G = this.G;
    const res = e.takeHit({ dmg, ki: 0, poise: 0, dir: this.yaw, heavy: true, crit: true });
    const p = _a.set(e.pos.x, e.height * .55, e.pos.z);
    G.fx.spark(p, { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }, final ? 40 : 20, 0xffd080, final ? 10 : 6);
    G.fx.blood(p, { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }, final ? 30 : 12, 0x2a0606);
    G.audio.sfx(final ? 'grapple' : 'hitHeavy');
    G.hitstop = final ? .16 : .08; G.cam.shake(final ? .55 : .3);
    this.gainAnima(final ? 10 : 4);
    return res;
  }

  detectHits(a) {
    const G = this.G;
    for (const e of G.enemies) {
      if (!e.alive || this.hitSet.has(e) || e.state === 'grappled') continue;
      const dx = e.pos.x - this.pos.x, dz = e.pos.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d > a.reach + e.radius) continue;
      const ang = Math.abs(angleDiff(this.yaw, Math.atan2(dx, dz)));
      if (ang > a.arc * Math.PI / 360 && d > e.radius + .7) continue;
      this.hitSet.add(e);
      const mul = this.dmgMul * (this.shifted ? 1.6 : 1) * (e.state === 'broken' ? 1.25 : 1);
      const res = e.takeHit({ dmg: a.dmg * mul, ki: a.ki * (this.shifted ? 1.5 : 1), poise: a.poise, dir: this.yaw, heavy: !!a.heavy });
      if (!res) continue;
      const p = _a.set(e.pos.x - dx / d * e.radius * .6, Math.min(1.3, e.height * .55), e.pos.z - dz / d * e.radius * .6);
      const dir = { x: Math.cos(this.yaw) * (this.atkKey === 'light1' ? 1 : -1), z: -Math.sin(this.yaw) * (this.atkKey === 'light1' ? 1 : -1) };
      G.fx.spark(p, dir, a.heavy ? 22 : 12, this.shifted ? 0xff9cf0 : 0xffd080, a.heavy ? 8 : 6);
      G.fx.blood(p, { x: dx / d, z: dz / d }, a.heavy ? 16 : 8, 0x2a0606);
      G.audio.sfx(a.heavy ? 'hitHeavy' : 'hit', { x: e.pos.x, z: e.pos.z });
      G.hitstop = Math.max(G.hitstop, a.heavy ? .09 : .055);
      G.cam.shake(a.heavy ? .22 : .1);
      this.gainAnima(a.heavy ? 7 : 4);
    }
  }

  updateResources(dt) {
    const G = this.G;
    // Ki regeneration.
    const busy = ['attack', 'roll', 'backstep', 'burst'].includes(this.state);
    if (!busy && G.time - this.kiSpentT > .45 && this.ki < this.maxKi) {
      const rate = 46 * (this.guarding ? .45 : 1) * (this.state === 'exhausted' || this.state === 'stagger' ? 1.5 : 1) * (this.sprinting ? .6 : 1);
      this.ki = Math.min(this.maxKi, this.ki + rate * dt);
    }
    // Poison.
    if (this.poisoned > 0 && this.alive && G.state === 'play' && this.state !== 'rest') {
      this.poisoned -= dt;
      this.hp -= this.maxHp * .012 * dt;
      if (Math.random() < dt * 6) G.fx.motes({ x: this.pos.x, y: 1, z: this.pos.z }, 0x8fe040, 1, .3, .8, .1, .8);
      if (this.hp <= 0) this.die();
    } else this.poison = Math.max(0, this.poison - 8 * dt);
    // Fae Shift drains Anima.
    if (this.shifted) {
      this.anima -= 100 / this.shiftDur * dt;
      if (Math.random() < dt * 30) G.fx.motes({ x: this.pos.x, y: 1.2, z: this.pos.z }, Math.random() < .5 ? 0xff9cf0 : 0x9ff3ff, 1, .5, 1, .1, .8);
      if (this.anima <= 0) this.endShift();
    }
    this.hpTrail = this.hpTrail > this.hp ? Math.max(this.hp, this.hpTrail - this.maxHp * .35 * dt * (G.time - (this.lastHpDrop || 0) > .6 ? 1 : 0)) : this.hp;
  }

  updateVisuals(dt, mag) {
    const G = this.G, k = this.k, A = this.anim;
    k.root.rotation.y = this.yaw;
    // Local velocity for the gait.
    const sp = Math.hypot(this.vel.x, this.vel.z);
    const lf = Math.cos(this.yaw) * this.vel.z + Math.sin(this.yaw) * this.vel.x;
    const ls = Math.cos(this.yaw) * this.vel.x - Math.sin(this.yaw) * this.vel.z;
    A.capeLag = clamp(sp / 7, 0, 1) * .9 + (this.state === 'roll' ? .3 : 0);
    const prevStep = Math.floor(A.gait / Math.PI);
    A.update(dt, { speed: ['free', 'drink', 'fog'].includes(this.state) ? sp : 0, forward: sp > .1 ? lf / sp : 1, side: sp > .1 ? ls / sp : 0, guard: this.guarding, sprint: this.sprinting, shifted: this.shifted });
    if (Math.floor(A.gait / Math.PI) !== prevStep && sp > .8) G.audio.sfx('step');

    // Sword trail while swinging.
    const swinging = ['attack', 'counter', 'grapple'].includes(this.state) || (this.state === 'burst' && this.st < .1);
    k.root.updateMatrixWorld(true);
    if (swinging) {
      k.base.getWorldPosition(_a); k.tip.getWorldPosition(_b);
      this.trail.add(_a, _b, G.time);
    }
    this.trail.update(G.time);

    // The wisp bobs behind the right shoulder, lagging a little.
    const wt = G.time;
    _a.set(this.pos.x - Math.cos(this.yaw) * .55 - Math.sin(this.yaw) * .45, 2.05 + Math.sin(wt * 2.3) * .1, this.pos.z + Math.sin(this.yaw) * .55 - Math.cos(this.yaw) * .45);
    this.wispPos.lerp(_a, 1 - Math.exp(-dt * (this.wispPos.lengthSq() ? 6 : 1e3)));
    this.wisp.position.copy(this.wispPos);
    this.wispLight.color.setHex(this.shifted ? 0xffb0f0 : 0xd8ecff);
    if (Math.random() < dt * 8) G.fx.motes(this.wispPos, this.shifted ? 0xff9cf0 : 0xcff6ff, 1, .05, .1, .05, .6);
    // Ki Pulse cue: blue light gathers while the window is open.
    const g = k.glow.material;
    if (this.pulse) {
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
