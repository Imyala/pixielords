// Kindred Spirits, as Nioh's Visitors: at a Moonwell, pour out a Moon Cup and a kindred fae knight's echo
// answers, lit blue, and walks the mission beside you. It fights with the weapon it carried (a Duel Revenant's
// strokes for that weapon, graves.js) and as hard as you do, near enough; guards and sidesteps what it sees
// coming; and foes turn on it as readily as on you (enemies.js: foe(), retarget()). While one walks with you,
// every foe is a little hardier. It stays until it falls and isn't raised, a warlord falls, you rest or you fall.
// Fallen, its echo lingers a while: stand over it and give up a third of your health to raise it.
// main.js calls and sends kindred; menu.js offers them (Kinship); hud.js shows its bar.
import * as THREE from 'three';
import { knightModel, KNIGHT_ACT, TYPES } from './enemies.js';
import { ACTIONS, KnightAnimator } from './knight.js';
import { Trail } from './fx.js';
import { GRAVE_WEAPONS, fallenKnight } from './graves.js';
import { SETS, weaponMul, defReduce } from './gear.js';
import { FORGE } from './save.js';
import { PATRONS } from './patrons.js';
import { glowTexture } from './textures.js';
import { clamp, lerp, smooth, rand, yawTo, angleDiff, damp } from './util.js';

export const CUP_MAX = 10;   // Moon Cups a knight can carry
const BLUE = { dark: 0x10141c, visor: 0x7fe0ff, glow: 0x4ab8ff, trail: 0x9fe8ff, blade: 0xe0f4ff };
const MOTTO = ['Answers every Moonwell it can hear.', 'Still owes the moon a debt.', 'Walked this way once, and will again.', 'Keeps the old oath: no knight fights alone.',
  'Never learned to leave a fight.', 'Remembers the way through, mostly.', 'Came back for the company.', 'Has a song for every warlord.', 'Guards your left.'];

// Tonight's three kindred at a mission's Moonwells: knights near your level, the same three all night.
export function kindredOffers(mission, night, level) {
  return [0, 1, 2].map(i => {
    const K = fallenKnight(mission, i, night, [], level, 'kin:');
    K.motto = MOTTO[(night + i * 7 + mission.length) % MOTTO.length];
    return K;
  });
}

let GLOW = null;
export class Kindred {
  constructor(G, K, at) {
    this.G = G; this.K = K; this.name = K.name; this.weapon = K.weapon;
    const base = TYPES[GRAVE_WEAPONS[K.weapon]], L = SETS[K.set]?.look || SETS.errant.look, P = PATRONS[K.patron];
    this.T = { knight: { ...BLUE, steel: L.steel, cloth: L.cloth, trim: L.trim, wing: P?.color ?? 0x9fd8ff }, weapon: K.weapon, scale: 1.04 };
    this.model = knightModel(this.T); this.k = this.model.userData.knight; this.anim = new KnightAnimator(this.k);
    this.mat = this.model.userData.mesh.material;
    this.k.mats.steel.emissive.setHex(0x0a2438); this.k.mats.steel.emissiveIntensity = 1;
    this.trail = new Trail(G.scene, BLUE.trail, 18, .16);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW ||= glowTexture(), color: 0x4ab8ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .3 }));
    this.glow.position.y = 1.1; this.glow.scale.set(1.9, 2.9, 1);
    this.outer = new THREE.Group(); this.outer.add(this.model, this.glow); G.scene.add(this.outer);
    // Strikes only: no casts, roars or thrown things.
    this.attacks = base.attacks.filter(a => a.steps.every(s => !s.proj && !s.heal && !s.chant && !s.blink && s.anim !== 'roar'));
    const ds = this.attacks.flatMap(a => a.steps).map(s => s.dmg).filter(v => v > 0);
    this.avg = ds.reduce((a, b) => a + b, 0) / Math.max(1, ds.length);
    this.pos = new THREE.Vector3(at.x, 0, at.z); this.vel = new THREE.Vector3(); this.want = new THREE.Vector3(); this.impulse = new THREE.Vector3();
    this.yaw = at.yaw || 0; this.radius = .5; this.height = 2.1;
    this.maxHp = Math.round(G.player.maxHp * 1.3); this.hp = this.maxHp; this.alive = true;
    this.state = 'rise'; this.st = 0; this.think = .6; this.cd = {}; this.iframes = 0; this.target = null; this.flash = 0; this.lostT = 0;
    this.anim.play('rise', 1, .02);
    G.fx.ring(this.pos, 0x7fe0ff, 2.4, .6); G.fx.motes({ x: this.pos.x, y: 1, z: this.pos.z }, 0x9fe8ff, 40, .8, 2.4, .14, 1.2);
  }

  get isAttacking() { return this.state === 'attack'; }
  get moving() { return Math.hypot(this.vel.x, this.vel.z) > .5; }
  get sprinting() { return false; }
  // Its strength follows yours: your might and the weapon in your hand, a little under.
  power() { const p = this.G.player; return 40 * p.dmgMul * weaponMul(p.gear?.weapon) * (1 + FORGE.per * (p.forge?.[p.weapon] || 0)) * .75; }

  // ---- being struck (enemies.js calls this as it would the knight's)
  receiveHit(hit) {
    const G = this.G;
    if (!this.alive || this.iframes > 0 || this.state === 'rise' || this.state === 'leave') return 'miss';
    // It guards what it sees coming, now and then; red blows can't be guarded.
    if (!hit.burst && !['attack', 'hurt', 'dodge'].includes(this.state) && Math.random() < .32) {
      const sp = new THREE.Vector3(this.pos.x + Math.sin(this.yaw) * .5, 1.3, this.pos.z + Math.cos(this.yaw) * .5);
      G.fx.spark(sp, { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }, 18, 0xbfeaff, 6);
      G.audio.sfx('block', { x: this.pos.x, z: this.pos.z, vol: .7 });
      this.anim.play('deflect', 1.2, .02); this.guardT = .4;
      return 'deflected';
    }
    const dmg = hit.dmg * (1 - defReduce(G.player.gear?.def || 0)) * .85;
    this.hp -= dmg; this.flash = 1;
    G.fx.spark(new THREE.Vector3(this.pos.x, 1.2, this.pos.z), { x: -Math.sin(hit.dirYaw || 0), z: -Math.cos(hit.dirYaw || 0) }, 10, 0x9fe8ff, 5);
    G.audio.sfx('hit', { x: this.pos.x, z: this.pos.z, vol: .6, pitch: 1.2 });
    if (this.hp <= 0) { this.fall(); return 'hit'; }
    if (hit.heavy || hit.burst) {
      this.endAttack(); this.state = 'hurt'; this.st = 0; this.hurtDur = hit.burst ? .8 : .5;
      this.anim.play(hit.burst ? 'stagger' : 'hurt', 1.2, .03);
      const back = (hit.dirYaw || 0) + Math.PI; this.impulse.x += Math.sin(back) * 4; this.impulse.z += Math.cos(back) * 4;
    }
    return 'hit';
  }
  recoil() { if (!this.alive) return; this.endAttack(); this.state = 'hurt'; this.st = 0; this.hurtDur = .55; this.anim.play('hurt', 1.3, .03); }

  fall() {
    const G = this.G;
    this.hp = 0; this.alive = false; this.endAttack(); this.state = 'fallen'; this.st = 0;
    this.anim.play('death', 1, .05);
    G.hud.toast(`${this.name.split(' ').slice(0, 2).join(' ')} has fallen · stand over its echo to raise it`, 'warn');
    for (const e of G.enemies) if (e.tgt === this) e.tgt = null;
  }
  // Raised by the knight: back on its feet with part of its health.
  revive() {
    if (this.state !== 'fallen') return;
    this.alive = true; this.hp = Math.round(this.maxHp * .45); this.state = 'rise'; this.st = 0; this.iframes = 1.2;
    this.anim.play('rise', 1.2, .03); this.mat.opacity = 1;
    this.G.fx.ring(this.pos, 0x7fe0ff, 2, .5); this.G.fx.motes({ x: this.pos.x, y: 1, z: this.pos.z }, 0x9fe8ff, 30, .6, 2, .12, 1);
  }
  // It bows and goes back to the moon.
  leave(why = '') {
    if (this.state === 'leave' || this.gone) return;
    const G = this.G;
    this.alive = false; this.endAttack(); this.state = 'leave'; this.st = 0;
    this.anim.play('rest', 1, .1);
    if (why) G.hud.toast(why, 'anima');
    for (const e of G.enemies) if (e.tgt === this) e.tgt = null;
  }
  dispose() {
    this.gone = true;
    this.G.scene.remove(this.outer, this.trail.mesh);
    this.trail.mesh.geometry.dispose(); this.trail.mat.dispose();
    for (const m of Object.values(this.k.mats)) m.dispose?.();
    this.glow.material.dispose();
  }

  // ---- thinking
  // Whom to fight: what you are locked on to, what is fighting it, else the nearest foe that is up and about.
  pickTarget() {
    const G = this.G, p = G.player, me = this.pos;
    const ok = e => e.alive && e.active && e.state !== 'intro' && !e.burrowed && (e.aware || e === p.lock)
      && Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) < 18 && Math.hypot(e.pos.x - me.x, e.pos.z - me.z) < 24;
    const cands = G.enemies.filter(ok);
    if (!cands.length) return null;
    const score = e => Math.hypot(e.pos.x - me.x, e.pos.z - me.z) - (e.tgt === this ? 6 : 0) - (e === p.lock ? 3 : 0) - (e === this.target ? 3 : 0);
    return cands.sort((a, b) => score(a) - score(b))[0];
  }

  update(dt) {
    const G = this.G, p = G.player;
    this.st += dt; this.iframes -= dt; this.flash = Math.max(0, this.flash - dt * 5); this.guardT = Math.max(0, (this.guardT || 0) - dt);
    this.want.set(0, 0, 0);
    if (this.state === 'leave') {
      const k = clamp(this.st / 1.4, 0, 1);
      this.mat.transparent = true; this.mat.opacity = 1 - k; this.glow.material.opacity = .3 * (1 - k) + k * .6;
      if (Math.random() < .6) G.fx.motes({ x: this.pos.x, y: .4 + k * 2, z: this.pos.z }, 0x9fe8ff, 2, .4, 1.6, .12, .8);
      if (k >= 1) this.dispose();
      this.animate(dt); return;
    }
    if (this.state === 'fallen') {
      // Its echo lingers a while, and fades.
      if (this.st > 1.2) { this.mat.transparent = true; this.mat.opacity = .45 + Math.sin(this.st * 3) * .1; }
      if (Math.random() < .2) G.fx.motes({ x: this.pos.x, y: .3, z: this.pos.z }, 0x7fe0ff, 1, .5, .8, .1, .9);
      if (this.st > 24) this.leave(`${this.name.split(' ').slice(0, 2).join(' ')} returns to the moon`);
      this.animate(dt); return;
    }
    // Out of a fight, it mends slowly.
    if (!this.target) this.hp = Math.min(this.maxHp, this.hp + this.maxHp * .015 * dt);
    const dp = Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
    // Left far behind (or stuck), it catches up in a flicker of light.
    this.lostT = dp > 14 && this.speedNow < .5 ? this.lostT + dt : 0;
    if ((dp > 30 || this.lostT > 2.5) && this.state !== 'attack') this.blinkTo(p);
    switch (this.state) {
      case 'rise': if (this.st > 1.1) { this.state = 'follow'; this.st = 0; } break;
      case 'hurt': if (this.st > this.hurtDur) { this.state = 'follow'; this.st = 0; this.think = .1; } break;
      case 'dodge': if (this.st > .35) { this.state = 'follow'; this.st = 0; } break;
      case 'attack': this.updateAttack(dt); break;
      default: {
        this.think -= dt;
        if (this.think <= 0) { this.think = rand(.25, .45); this.target = this.pickTarget(); }
        if (this.target && !this.target.alive) this.target = null;
        if (this.target) this.engage(dt); else this.follow(dt, p, dp);
      }
    }
    this.integrate(dt);
    this.animate(dt);
  }

  follow(dt, p, dp) {
    // A pace or two behind your left shoulder.
    const side = p.yaw + Math.PI * .78, gx = p.pos.x + Math.sin(side) * 2.4, gz = p.pos.z + Math.cos(side) * 2.4;
    const d = Math.hypot(gx - this.pos.x, gz - this.pos.z);
    if (d > .6) this.steer(Math.atan2(gx - this.pos.x, gz - this.pos.z), dp > 9 ? 7.2 : d > 3 ? 5.4 : 2.4 * Math.min(1, d));
    else this.faceYaw = p.yaw;
  }

  engage(dt) {
    const G = this.G, e = this.target, dx = e.pos.x - this.pos.x, dz = e.pos.z - this.pos.z, d = Math.hypot(dx, dz), to = Math.atan2(dx, dz);
    this.faceYaw = to;
    // Sidestep a blow it sees winding up at it.
    if (e.state === 'attack' && e.phase === 'windup' && e.foe?.() === this && d < 5 && (this.dodgeCd || 0) < G.time && Math.random() < dt * 5) {
      this.dodgeCd = G.time + 2.2;
      if (Math.random() < .55) {
        const s = Math.random() < .5 ? -1 : 1, y = to + s * Math.PI / 2;
        this.impulse.x += Math.sin(y) * 8; this.impulse.z += Math.cos(y) * 8; this.iframes = .35;
        this.state = 'dodge'; this.st = 0; this.anim.play('dash', 1.3, .02); G.audio.sfx('roll', { x: this.pos.x, z: this.pos.z, vol: .5 });
        return;
      }
    }
    const reach = e.radius + Math.min(...this.attacks.map(a => a.range)) * .8;
    if (this.think <= .12) {
      const ok = this.attacks.filter(a => (this.cd[a.name] || 0) < G.time && d <= a.range + e.radius * .6 && d >= (a.minRange || 0));
      if (ok.length && Math.random() < .75) {
        let r = Math.random() * ok.reduce((s, a) => s + (a.w || 1), 0), a = ok[0];
        for (const x of ok) { r -= x.w || 1; if (r <= 0) { a = x; break; } }
        this.startAttack(a); return;
      }
    }
    if (d > reach) this.steer(to, d > 6 ? 6.2 : 3.6);
    else if (d < reach * .6) this.steer(to + Math.PI, 2);
    else { this.circle ??= Math.random() < .5 ? -1 : 1; this.steer(to + this.circle * Math.PI / 2, 1.6); }
  }

  steer(yaw, speed) { this.want.set(Math.sin(yaw) * speed, 0, Math.cos(yaw) * speed); if (this.faceYaw == null) this.faceYaw = yaw; }

  blinkTo(p) {
    const G = this.G, a = p.yaw + Math.PI * .8;
    G.fx.motes({ x: this.pos.x, y: 1, z: this.pos.z }, 0x9fe8ff, 20, .5, 2, .12, .7);
    this.pos.set(p.pos.x + Math.sin(a) * 2, 0, p.pos.z + Math.cos(a) * 2);
    G.world.collide(this.pos, this.radius);
    this.vel.set(0, 0, 0); this.lostT = 0; this.endAttack(); this.state = 'follow'; this.target = null;
    G.fx.ring(this.pos, 0x7fe0ff, 1.6, .4); G.fx.motes({ x: this.pos.x, y: 1, z: this.pos.z }, 0x9fe8ff, 20, .5, 2, .12, .7);
  }

  // ---- striking: a Duel Revenant's strokes, as enemies.js plays them, landing on foes instead
  startAttack(a) {
    this.atk = a; this.stepI = 0; this.state = 'attack'; this.st = 0;
    this.cd[a.name] = this.G.time + (a.cd || 0) + 1.4;
    this.beginStep();
  }
  beginStep() {
    const s = this.atk.steps[this.stepI], e = this.target;
    this.step = s; this.phase = 'windup'; this.pt = 0; this.hitDone = false; this.lungeTotal = 0; this.lungeDone = 0;
    const [act, hitT] = KNIGHT_ACT[s.kact || s.anim] || (ACTIONS[s.kact] ? [s.kact, ACTIONS[s.kact].hit?.[0] ?? .25] : KNIGHT_ACT.swing);
    this.anim.play(act, clamp(hitT / Math.max(.05, s.windup), .3, 3), .05);
    if (s.anim === 'leap') this.leap = { x0: this.pos.x, z0: this.pos.z, x1: e?.pos.x ?? this.pos.x, z1: e?.pos.z ?? this.pos.z };
  }
  endAttack() { this.atk = null; this.step = null; if (this.state === 'attack') this.state = 'follow'; }
  updateAttack(dt) {
    const G = this.G, s = this.step, e = this.target;
    if (!s) { this.state = 'follow'; return; }
    this.pt += dt;
    const d = e ? Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z) : 9;
    if (e?.alive && this.phase !== 'recover') this.faceYaw = yawTo(this.pos.x, this.pos.z, e.pos.x, e.pos.z);
    if (this.phase === 'windup') {
      if (s.anim === 'leap' && e) { this.leap.x1 = e.pos.x; this.leap.z1 = e.pos.z; }
      if (this.pt >= s.windup) {
        this.phase = 'active'; this.pt = 0;
        this.lungeTotal = s.lunge ? Math.min(s.lunge, Math.max(0, d - (s.reach * .55 + (e?.radius || .5)))) : 0;
        G.audio.sfx(s.dmg > this.avg * 1.15 ? 'swingHeavy' : 'swing', { x: this.pos.x, z: this.pos.z, vol: .6 });
      }
    } else if (this.phase === 'active') {
      if (s.anim === 'leap') { const k = smooth(clamp(this.pt / s.active, 0, 1)), L = this.leap; this.pos.x = lerp(L.x0, L.x1, k); this.pos.z = lerp(L.z0, L.z1, k); }
      else if (this.lungeTotal > this.lungeDone) {
        const k = smooth(clamp(this.pt / (s.active * 1.35), 0, 1)), step = this.lungeTotal * k - this.lungeDone;
        this.lungeDone += step; this.pos.x += Math.sin(this.yaw) * step; this.pos.z += Math.cos(this.yaw) * step;
      }
      const hitAt = s.aoeAt ? s.active * .5 : s.anim === 'leap' ? s.active * .98 : 0;
      if (!this.hitDone && this.pt >= hitAt) this.strike(s);
      if (this.pt >= s.active) { this.phase = 'recover'; this.pt = 0; if (!this.hitDone) this.strike(s); }
    } else if (this.pt >= s.recover * .85) {
      this.stepI++;
      if (this.stepI < this.atk.steps.length && this.target?.alive) this.beginStep();
      else { this.atk = null; this.step = null; this.state = 'follow'; this.st = 0; this.think = rand(.3, .8); }
    }
  }
  strike(s) {
    const G = this.G, k = s.dmg / this.avg, pow = this.power(), fwd = { x: Math.sin(this.yaw), z: Math.cos(this.yaw) };
    this.hitDone = true;
    const c = s.aoe ? { x: this.pos.x + fwd.x * (s.reach ? s.reach * .8 : 0), z: this.pos.z + fwd.z * (s.reach ? s.reach * .8 : 0) } : null;
    if (c) { G.fx.ring(c, 0x9fe8ff, s.aoe * 1.2, .35); G.fx.dust(c, 12); G.audio.sfx('slam', { x: c.x, z: c.z, vol: .6 }); G.world.smash(c.x, c.z, s.aoe * .8); }
    else if (s.anim === 'spin') G.fx.arc(this.pos, 0, s.reach, 359, BLUE.trail, 1);
    else if (s.anim !== 'thrust') G.fx.arc(this.pos, this.yaw, s.reach, s.arc || 100, BLUE.trail, 1.1);
    const arcR = (s.arc || 100) * Math.PI / 360;
    for (const e of G.enemies) {
      if (!e.alive || !e.active) continue;
      const dx = e.pos.x - this.pos.x, dz = e.pos.z - this.pos.z, d = Math.hypot(dx, dz);
      const inAoe = c && Math.hypot(e.pos.x - c.x, e.pos.z - c.z) <= s.aoe + e.radius;
      const inArc = s.reach && d <= s.reach + e.radius && (Math.abs(angleDiff(this.yaw, Math.atan2(dx, dz))) <= arcR || d < this.radius + e.radius + .2);
      if (!inAoe && !inArc) continue;
      const res = e.takeHit({ dmg: pow * k, ki: 26 * k, poise: 22 * k, dir: Math.atan2(dx, dz), heavy: k > 1.15 || !!s.aoe, by: this });
      if (res) {
        G.fx.spark(new THREE.Vector3(e.pos.x - dx / (d || 1) * e.radius, e.height * .55, e.pos.z - dz / (d || 1) * e.radius), fwd, 12, 0xbfeaff, 5);
        G.audio.sfx('hit', { x: e.pos.x, z: e.pos.z, vol: .55 });
      }
    }
  }

  // ---- moving and posing
  integrate(dt) {
    const G = this.G, acc = 14 * dt, dvx = this.want.x - this.vel.x, dvz = this.want.z - this.vel.z, dv = Math.hypot(dvx, dvz);
    if (dv > 1e-4) { const k = Math.min(1, acc / dv); this.vel.x += dvx * k; this.vel.z += dvz * k; }
    const ox = this.pos.x, oz = this.pos.z;
    this.pos.x += (this.vel.x + this.impulse.x) * dt; this.pos.z += (this.vel.z + this.impulse.z) * dt;
    const id = Math.exp(-7 * dt); this.impulse.x *= id; this.impulse.z *= id;
    // Keep a little room from the knight and from foes.
    for (const o of [G.player, ...G.enemies]) {
      if (o !== G.player && !o.alive) continue;
      const dx = this.pos.x - o.pos.x, dz = this.pos.z - o.pos.z, d = Math.hypot(dx, dz), m = this.radius + (o.radius || .45) + .1;
      if (d < m && d > 1e-4) { this.pos.x += dx / d * (m - d) * .5; this.pos.z += dz / d * (m - d) * .5; }
    }
    G.world.collide(this.pos, this.radius);
    this.speedNow = dt > 0 ? Math.hypot(this.pos.x - ox, this.pos.z - oz) / dt : 0;
    if (this.faceYaw != null) this.yaw += angleDiff(this.yaw, this.faceYaw) * Math.min(1, dt * (this.state === 'attack' ? 6 : 10));
    this.faceYaw = null;
  }
  animate(dt) {
    const fv = Math.cos(this.yaw) * this.vel.z + Math.sin(this.yaw) * this.vel.x, sv = Math.cos(this.yaw) * this.vel.x - Math.sin(this.yaw) * this.vel.z, sp = Math.hypot(fv, sv);
    const moving = ['follow', 'rise', 'dodge'].includes(this.state) || (this.state === 'attack' && this.phase === 'windup');
    this.anim.update(dt, { speed: moving ? this.speedNow : 0, forward: sp > .1 ? fv / sp : 1, side: sp > .1 ? sv / sp : 0, sprint: this.speedNow > 5.8, stance: 'mid', weapon: this.weapon, guard: this.guardT > 0 });
    this.outer.position.copy(this.pos); this.outer.rotation.y = this.yaw;
    this.k.mats.visor.emissiveIntensity = 2.2 + this.flash * 3;
    this.glow.material.opacity = this.state === 'fallen' ? .5 : .28 + Math.sin(this.G.time * 3) * .05;
    const swinging = this.state === 'attack' && this.step && this.phase !== 'recover';
    if (swinging) { this.k.root.updateMatrixWorld(true); const b = new THREE.Vector3(), t = new THREE.Vector3(); this.k.base.getWorldPosition(b); this.k.tip.getWorldPosition(t); this.trail.add(b, t, this.G.time); }
    this.trail.update(this.G.time);
  }
}
