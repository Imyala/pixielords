// Enemies: stats, attack sets, AI and procedural animation on top of the five-bone rigs from models3d.js.
// Every attack is a list of steps (windup → active → recover). A step marked burst is a Dread strike: it glows
// red and can't be guarded; the player dashes through it or answers with a Thorn Counter.
import * as THREE from 'three';
import { createModel, MODEL_SIZE } from './models3d.js';
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
    name: 'Gnawfang, Warblade of the Warren', scale: 1.55, radius: .9, hp: 2300, ki: 380, poise: 75, walk: 2, run: 5.2, glimmer: 6000, voice: 'growl', pitch: .55, boss: true, track: 3.2, aggro: .9,
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

export const MODEL_IDS = [...new Set(Object.keys(TYPES))];

// ---------------------------------------------------------------- projectiles & hazards
const _v = new THREE.Vector3();

export class Projectiles {
  constructor(G) {
    this.G = G; this.list = []; this.hazards = [];
    const M = THREE;
    this.geo = {
      arrow: new M.CylinderGeometry(.015, .015, .8, 4).rotateX(Math.PI / 2),
      stone: new M.IcosahedronGeometry(.1, 0),
      bomb: new M.SphereGeometry(.16, 10, 8),
      vial: new M.CapsuleGeometry(.06, .1, 4, 8),
    };
    this.mat = {
      arrow: new M.MeshStandardMaterial({ color: 0x6b5238, roughness: .8 }),
      stone: new M.MeshStandardMaterial({ color: 0x77736c, roughness: 1 }),
      bomb: new M.MeshStandardMaterial({ color: 0x1c1c1c, roughness: .5, metalness: .3 }),
      vial: new M.MeshStandardMaterial({ color: 0x8fe040, emissive: 0x4a8a10, emissiveIntensity: 1.2, transparent: true, opacity: .9 }),
    };
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
      const pr = { kind: k, obj, vel, t: 0, dmg: step.dmg * e.dmgMul, from: e, radius: k === 'orb' ? .35 : .18, ...extra };
      this.list.push(pr);
      return pr;
    };
    if (kind === 'arrow' || kind === 'stone') {
      // Lead the target a little.
      const tflight = origin.distanceTo(aim) / step.proj.speed;
      aim.x += p.vel.x * tflight * .6; aim.z += p.vel.z * tflight * .6;
      const v = aim.clone().sub(origin).normalize().multiplyScalar(step.proj.speed);
      if (kind === 'stone') v.y += 9.8 * .5 * tflight * .5;
      make(kind, v, { gravity: kind === 'stone' ? 4.9 : 0 });
      G.audio.sfx(kind === 'arrow' ? 'arrow' : 'throw', { x: from.x, z: from.z });
    } else if (kind === 'bomb' || kind === 'vial') {
      const T = step.proj.flight;
      const tx = p.pos.x + p.vel.x * T * .5, tz = p.pos.z + p.vel.z * T * .5;
      const v = new THREE.Vector3((tx - origin.x) / T, 0, (tz - origin.z) / T);
      v.y = (0 - origin.y + .5 * 9.8 * T * T) / T;
      const pr = make(kind, v, { gravity: 9.8, target: { x: tx, z: tz } });
      pr.warn = fx.telegraph({ x: tx, z: tz }, kind === 'bomb' ? 2.4 : 2, T, kind === 'bomb' ? 0xff5020 : 0x8fe040);
      G.audio.sfx('throw', { x: from.x, z: from.z });
    } else if (kind === 'orb') {
      const n = step.proj.count || 1;
      for (let i = 0; i < n; i++) {
        const ang = e.yaw + (i - (n - 1) / 2) * .45;
        const v = new THREE.Vector3(Math.sin(ang), .1, Math.cos(ang)).multiplyScalar(step.proj.speed);
        make('orb', v, { homing: 1.6, life: 4.5 });
      }
      G.audio.sfx('magic', { x: from.x, z: from.z });
    }
  }

  // Lingering ground effects: poison clouds and pools, or fire. Static ones belong to the level.
  hazard(x, z, r, dur, poison = 55, kind = 'poison', stat = false) {
    this.hazards.push({ x, z, r, t: 0, dur, poison, kind, stat });
    if (!stat) this.G.audio.sfx(kind === 'fire' ? 'explode' : 'poison', { x, z, vol: kind === 'fire' ? .4 : 1 });
  }

  update(dt) {
    const G = this.G, p = G.player, fx = G.fx;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const pr = this.list[i], o = pr.obj;
      pr.t += dt;
      let dead = false;
      if (pr.homing && p.alive) {
        _v.set(p.pos.x - o.position.x, 1.1 - o.position.y, p.pos.z - o.position.z).normalize().multiplyScalar(pr.vel.length());
        pr.vel.lerp(_v, 1 - Math.exp(-pr.homing * dt));
      }
      if (pr.gravity) pr.vel.y -= pr.gravity * dt;
      const step = pr.vel.length() * dt;
      _v.copy(pr.vel).normalize();
      const wall = G.world.raycast(o.position, _v, step);
      o.position.addScaledVector(pr.vel, Math.min(1, wall / Math.max(step, 1e-6)) * dt);
      if (pr.kind === 'arrow') o.lookAt(o.position.x + pr.vel.x, o.position.y + pr.vel.y, o.position.z + pr.vel.z);
      else if (pr.kind !== 'orb') { o.rotation.x += dt * 8; o.rotation.z += dt * 5; }
      if (pr.kind === 'orb') fx.motes(o.position, 0xb060ff, 1, .1, .2, .12, .5);
      if (pr.kind === 'arrow' || pr.kind === 'stone') fx.add.emit({ x: o.position.x, y: o.position.y, z: o.position.z, life: .22, size: pr.kind === 'arrow' ? .09 : .12, color: fx.col(0xffe6b0), alpha: .8 });
      if (pr.kind === 'bomb') fx.motes({ x: o.position.x, y: o.position.y + .18, z: o.position.z }, 0xffa040, 1, .02, .5, .08, .3);

      const hitWall = wall < step - 1e-4;
      if (hitWall) dead = true;
      if (pr.kind === 'bomb' || pr.kind === 'vial') {
        if ((o.position.y <= .1 && pr.vel.y < 0) || hitWall) {
          dead = true;
          if (pr.kind === 'bomb') {
            fx.explosion(o.position, 2.4); G.audio.sfx('explode', { x: o.position.x, z: o.position.z }); G.cam.shake(.35, o.position);
            const d = Math.hypot(p.pos.x - o.position.x, p.pos.z - o.position.z);
            if (d < 2.4 + p.radius) p.receiveHit({ dmg: pr.dmg, from: pr.from, dirYaw: yawTo(p.pos.x, p.pos.z, o.position.x, o.position.z), aoe: true, heavy: true });
          } else {
            this.hazard(o.position.x, o.position.z, 2.1, 5);
            fx.ring(o.position, 0x8fe040, 2.1, .4);
          }
        }
      } else if (p.alive) {
        const dx = p.pos.x - o.position.x, dz = p.pos.z - o.position.z;
        if (Math.hypot(dx, dz) < p.radius + pr.radius && o.position.y > 0 && o.position.y < 2) {
          const res = p.receiveHit({ dmg: pr.dmg, from: pr.from, projectile: true, dirYaw: yawTo(p.pos.x, p.pos.z, o.position.x, o.position.z) });
          if (res !== 'miss') dead = true;
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
      } else {
        if ((!h.stat || near < 30) && Math.random() < dt * (h.stat ? 5 : 14) * Math.min(2, h.r / 2)) fx.poisonCloud(h, h.r);
        if (p.alive && near < h.r) p.addPoison(h.poison * dt);
      }
      if (h.t > h.dur) this.hazards.splice(i, 1);
    }
  }

  clear() {
    for (const pr of this.list) {
      if (pr.warn) pr.warn.dead = true;
      if (pr.kind === 'orb') { const it = this.G.fx.items.find(x => x.obj === pr.obj); if (it) it.dead = true; }
      else this.G.scene.remove(pr.obj);
    }
    this.list.length = 0; this.hazards.length = 0;
  }
}

// ---------------------------------------------------------------- enemy
export class Enemy {
  // A type can reuse another model (variants and bosses); spawn.type names the TYPES entry.
  static modelFor(type) { return TYPES[type].model || type; }

  static async create(G, spawn) {
    const T = TYPES[spawn.type];
    const model = await createModel(Enemy.modelFor(spawn.type), { scale: T.scale });
    return new Enemy(G, spawn, T, model);
  }

  dispose() {
    this.G.scene.remove(this.outer);
    this.mat.dispose();
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
    this.cur = { pitch: 0, twist: 0, roll: 0, aL: 0, aR: 0, aLz: 0, aRz: 0, sq: 1, hop: 0, fwd: 0, spin: 0 };
    this.animVel = Object.fromEntries(Object.keys(this.cur).map(k => [k, 0]));
    this.tg = { ...this.cur };
    this.want = new THREE.Vector3(); this.impulse = new THREE.Vector3(); this.vel = new THREE.Vector3();
    this.cd = {};
    this.reset();
  }

  get alive() { return this.state !== 'dead' && this.active; }
  get aware() { return !['idle', 'sleep', 'patrol', 'return'].includes(this.state); }

  reset() {
    const s = this.spawn, T = this.T, ng = this.G.ngMul || 1;
    this.active = true; this.outer.visible = true;
    this.pos.set(s.x, 0, s.z); this.yaw = s.yaw || 0;
    this.home = { x: s.x, z: s.z, yaw: s.yaw || 0 };
    this.maxHp = Math.round(T.hp * ng); this.hp = this.maxHp;
    this.maxKi = T.ki; this.ki = this.maxKi;
    this.dmgMul = 1 + (ng - 1) * .6;
    this.poiseDmg = 0; this.poiseT = 0; this.kiT = 0;
    this.state = s.idle === 'sleep' ? 'sleep' : s.patrol ? 'patrol' : 'idle';
    this.st = 0; this.atk = null; this.step = null;
    this.patrolI = 0; this.think = rand(0, .3); this.vel.set(0, 0, 0); this.impulse.set(0, 0, 0); this.want.set(0, 0, 0);
    this.yawVel = 0; this.gait = 0; this.speedNow = 0; this.turnRate = 6; this.faceYaw = null; this.planT = 0; this.detour = 0;
    for (const k in this.animVel) this.animVel[k] = 0;
    Object.assign(this.cur, { pitch: 0, twist: 0, roll: 0, aL: 0, aR: 0, aLz: 0, aRz: 0, sq: 1, hop: 0, fwd: 0, spin: 0 });
    this.phase2 = false; this.usedOnce = {};
    this.dmgShown = 0; this.dmgShowT = 0; this.barT = 0;
    this.flash = 0; this.burstGlow = 0; this.lastHitBy = 0;
    this.hitList = null; this.alertT = 0; this.stuck = 0;
    this.cd = {};
    this.mat.transparent = false; this.mat.opacity = 1; this.mat.emissive.setHex(0xffffff); this.mat.emissiveIntensity = .08;
    this.outer.rotation.y = this.yaw;
    this.lean.rotation.set(0, 0, 0); this.lean.position.y = .45 * this.height;
    this.fadeT = 0; this.grappleK = 0; this.hop = null; this.plan = null;
  }

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

  alert(delay = 0) {
    if (this.aware || !this.alive || this.boss) return;
    this.state = 'alert'; this.st = -delay; this.alertT = 0;
    this.G.audio.sfx(this.T.voice, { x: this.pos.x, z: this.pos.z, pitch: this.T.pitch });
    // Wake friends that can see us.
    for (const o of this.G.enemies) {
      if (o === this || o.aware || !o.alive || o.boss) continue;
      const d = Math.hypot(o.pos.x - this.pos.x, o.pos.z - this.pos.z);
      if (d < 9 && o.state !== 'sleep' && this.G.world.los(o.pos, this.pos)) o.alert(rand(.3, .8));
    }
  }

  // ------------------------------------------------ taking damage
  // hit: {dmg, ki, poise, dir: yaw from attacker, heavy, crit}
  takeHit(hit) {
    if (!this.alive || this.state === 'intro') return null;
    const G = this.G;
    let dmg = hit.dmg;
    this.hp -= dmg;
    this.dmgShown += dmg; this.dmgShowT = 2.5; this.barT = 6;
    this.flash = 1;
    this.kiT = 1.4;
    if (this.state !== 'broken' && this.state !== 'grappled') this.ki -= hit.ki || 0;
    this.poiseDmg += hit.poise || 0; this.poiseT = 1.2;
    if (!this.aware && !this.boss) { this.alert(); this.state = 'engage'; this.st = 0; this.think = .15; }
    // Knockback as an impulse, plus a jolt through the pose springs.
    if (this.state !== 'grappled') {
      const kb = (hit.heavy ? 4.5 : 2) * (this.boss ? .15 : this.elite ? .35 : 1);
      this.impulse.x += Math.sin(hit.dir) * kb; this.impulse.z += Math.cos(hit.dir) * kb;
      this.pulseAnim(hit.heavy ? 'heavy' : 'hit', this.boss ? .4 : this.elite ? .6 : 1);
    }
    if (this.hp <= 0) { this.die(hit); return 'kill'; }
    if (this.state === 'grappled') return 'hit';
    if (this.ki <= 0 && this.state !== 'broken') { this.breakKi(); return 'broken'; }
    const armored = this.step && this.phase === 'active' && this.step.hyper || (this.step && this.step.hyper && this.phase === 'windup' && this.pt > this.step.windup * .4);
    if (this.poiseDmg >= this.T.poise && !armored && this.state !== 'broken') {
      this.poiseDmg = 0;
      this.hurt(hit.heavy ? .55 : .36);
      return 'stagger';
    }
    return 'hit';
  }

  hurt(dur) {
    this.endAttack();
    this.state = 'hurt'; this.st = 0; this.hurtDur = dur;
    this.G.audio.sfx(this.T.voice, { x: this.pos.x, z: this.pos.z, pitch: this.T.pitch * 1.2, vol: .6 });
  }

  breakKi() {
    this.endAttack();
    this.state = 'broken'; this.st = 0; this.ki = 0;
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
    G.audio.sfx('enemyDie', { x: this.pos.x, z: this.pos.z, pitch: this.T.pitch });
    G.onEnemyKilled(this, hit);
  }

  endAttack() {
    if (this.atk) this.G.attackTokens = Math.max(0, (this.G.attackTokens || 0) - 1);
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
      return d <= a.range && d >= a.minRange;
    });
    if (!ok.length) return null;
    const forced = ok.find(a => a.once);
    if (forced) return forced;
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
    const G = this.G, head = new THREE.Vector3(this.pos.x, this.height * .75, this.pos.z);
    if (s.burst) {
      this.burstGlow = 1;
      G.audio.sfx('burstWarn', { x: this.pos.x, z: this.pos.z });
      G.fx.flash(head, 0xff2020, 2.8 * Math.max(1, this.size * .7), .6, true);
      G.hud?.burstWarn();
    } else if (this.stepI === 0 && !s.proj && s.anim !== 'roar') {
      G.fx.flash(head.add(new THREE.Vector3(Math.sin(this.yaw) * .4, 0, Math.cos(this.yaw) * .4)), 0xfff2c0, 1.2 * Math.max(1, this.size * .6), .35, true);
      G.audio.sfx('glint', { x: this.pos.x, z: this.pos.z, vol: .5 });
    }
    if (s.anim === 'leap') {
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
      if (s.anim === 'leap') { this.leap.x1 = p.pos.x; this.leap.z1 = p.pos.z; }
      if (this.pt >= D.windup) {
        this.phase = 'active'; this.pt = 0;
        const want = s.lunge ? Math.min(s.lunge, Math.max(0, d - (s.reach * .55 + p.radius))) : 0;
        this.lungeTotal = s.anim === 'thrust' && s.lunge > 3 ? s.lunge : want;   // charges commit to their full length
        this.lungeDone = 0;
        if (s.proj) {
          const hand = new THREE.Vector3(this.pos.x + Math.sin(this.yaw) * .5, this.height * .7, this.pos.z + Math.cos(this.yaw) * .5);
          G.projectiles.spawn(s.proj.kind, hand, this, s);
        } else if (s.anim !== 'roar' && s.anim !== 'leap') {
          G.audio.sfx('enemySwing', { x: this.pos.x, z: this.pos.z, vol: Math.min(1.5, this.size) });
        }
        if (s.anim === 'roar') this.doRoar();
      }
    } else if (this.phase === 'active') {
      const ad = D.active;
      if (s.anim === 'leap') {
        const k = clamp(this.pt / ad, 0, 1), L = this.leap;
        this.pos.x = lerp(L.x0, L.x1, smooth(k)); this.pos.z = lerp(L.z0, L.z1, smooth(k));
      } else this.advanceLunge(ad, d, s, p);
      this.faceYaw = toP; this.turnRate = s.anim === 'thrust' && s.lunge > 3 ? 1.2 : .8;
      const hitAt = s.aoeAt ? ad * .5 : s.anim === 'leap' ? ad * .98 : 0;
      if (!this.hitDone && this.pt >= hitAt && !s.proj && s.anim !== 'roar') this.tryHit(s);
      if (this.pt >= ad) {
        this.phase = 'recover'; this.pt = 0; this.burstGlow = 0;
        if (!this.hitDone && !s.proj && s.anim !== 'roar') this.tryHit(s);
      }
    } else if (this.phase === 'recover') {
      this.advanceLunge(D.active, d, s, p, D.active + this.pt);
      if (this.pt >= D.recover) {
        this.stepI++;
        if (this.stepI < this.atk.steps.length) this.beginStep();
        else {
          this.endAttack();
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
    const res = p.receiveHit({
      dmg: s.dmg * this.dmgMul, from: this, burst: !!s.burst, poison: s.poison || 0, heavy: s.dmg >= 60,
      dirYaw: yawTo(p.pos.x, p.pos.z, from.x, from.z), aoe: !!s.aoe,
    });
    this.hitDone = true;
    return res;
  }

  doRoar() {
    const G = this.G;
    this.usedOnce[this.atk.name] = true;
    G.cam.shake(.7, this.pos);
    G.fx.ring(this.pos, 0x8fe040, 7, .8);
    G.projectiles.hazard(this.pos.x, this.pos.z, 5, 6, 40);
    G.onBossPhase2?.(this);
  }

  // ------------------------------------------------ main update
  update(dt) {
    if (!this.active) return;
    const G = this.G, p = G.player;
    this.st += dt;
    this.flash = Math.max(0, this.flash - dt * 6);
    this.dmgShowT -= dt; if (this.dmgShowT <= 0) this.dmgShown = 0;
    this.barT -= dt;
    this.poiseT -= dt; if (this.poiseT <= 0) this.poiseDmg = 0;
    this.kiT -= dt;
    if (this.kiT <= 0 && this.state !== 'broken' && this.ki < this.maxKi) this.ki = Math.min(this.maxKi, this.ki + this.maxKi * .35 * dt);
    this.want.set(0, 0, 0);
    this.faceYaw = null;

    if (this.state === 'dead') { this.updateDead(dt); this.integrate(dt); this.animate(dt); return; }

    const d = this.distToPlayer();
    const toP = yawTo(this.pos.x, this.pos.z, p.pos.x, p.pos.z);
    this.think -= dt;

    switch (this.state) {
      case 'sleep':
      case 'idle':
        if (this.think <= 0) { this.think = .2; if (this.canSee(d)) this.alert(); }
        this.faceYaw = this.home.yaw; this.turnRate = 2;
        break;
      case 'patrol': {
        const wp = this.spawn.patrol[this.patrolI];
        const dx = wp[0] - this.pos.x, dz = wp[1] - this.pos.z, dd = Math.hypot(dx, dz);
        if (dd < .6) this.patrolI = (this.patrolI + 1) % this.spawn.patrol.length;
        else this.steer(Math.atan2(dx, dz), this.T.walk * Math.min(1, dd / 1.5 + .3));
        if (this.think <= 0) { this.think = .2; if (this.canSee(d)) this.alert(); }
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
      case 'return': {
        const dx = this.home.x - this.pos.x, dz = this.home.z - this.pos.z, dd = Math.hypot(dx, dz);
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * .2 * dt);
        if (dd < .6) { this.state = this.spawn.patrol ? 'patrol' : 'idle'; this.hp = this.maxHp; this.ki = this.maxKi; }
        else this.steer(Math.atan2(dx, dz), this.T.run * .75 * Math.min(1, dd / 2 + .3));
        if (this.think <= 0) { this.think = .3; if (d < 9 && this.canSee(d)) { this.state = 'engage'; this.st = 0; this.planT = 0; } }
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
      if (a && (this.boss || this.elite || tokens < 2 || ranged) && (eager || this.boss)) { this.startAttack(a); return; }
    }
    this.planT -= dt;
    if (this.planT <= 0) {
      this.planT = rand(.7, 1.6);
      if (ranged) {
        const [lo, hi] = T.prefer;
        this.plan = d < lo ? 'back' : d > hi ? 'close' : Math.random() < .7 ? 'strafe' : 'hold';
      } else {
        const want = Math.min(...T.attacks.map(x => x.range)) * .85;
        const crowded = (G.attackTokens || 0) >= 2 && !this.boss && !this.elite;
        if (d > want + 1) this.plan = 'close';
        else if (crowded) this.plan = d < 3.4 ? 'back' : 'strafe';
        else this.plan = Math.random() < .2 ? 'back' : Math.random() < .75 ? 'strafe' : 'hold';
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
      this.steer(toP + this.strafeDir * (Math.PI / 2 - radial), T.walk * .9);
    }

    // Evasive types hop aside when the player swings at them.
    if (T.evasive && G.player.isAttacking && d < 3 && (this.hopCd || 0) < G.time && Math.random() < T.evasive * dt * 4) {
      this.hopCd = G.time + 2.5;
      const side = Math.random() < .5 ? -1 : 1, yaw = toP + side * Math.PI / 2;
      this.impulse.x += Math.sin(yaw) * 7; this.impulse.z += Math.cos(yaw) * 7;
      this.pulseAnim('hop');
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
    if (this.fadeT > 1.1) {
      this.mat.transparent = true;
      this.mat.opacity = Math.max(0, 1 - (this.fadeT - 1.1) / 1);
      if (Math.random() < .5) this.G.fx.motes({ x: this.pos.x, y: this.height * .4, z: this.pos.z }, 0xffc070, 1, this.radius, 1.2, .1, 1);
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
    let omega = 9, walk = Math.min(1.2, spd / 3.2);
    const E = x => smooth(clamp(x, 0, 1));
    switch (this.state) {
      case 'sleep':
        tg.pitch = .42; tg.sq = .8; tg.aL = .25; tg.aR = .25; tg.roll = Math.sin(t * 1.3) * .03; omega = 4;
        if (Math.random() < dt * .8) this.G.fx.motes({ x: this.pos.x, y: this.height * .9, z: this.pos.z }, 0x9fb8ff, 1, .1, .4, .06, 1.5);
        break;
      case 'idle':
      case 'return':
      case 'patrol':
        tg.pitch = .04 + Math.sin(t * 1.7 + this.pos.x) * .02; tg.twist = Math.sin(t * .6 + this.pos.z) * .06; tg.sq = 1 + Math.sin(t * 2.1 + this.pos.x) * .012; break;
      case 'engage':
        tg.pitch = .1; tg.twist = Math.sin(t * .9 + this.pos.z) * .05; tg.aL = -.35; tg.aR = -.25; tg.sq = .97 + Math.sin(t * 3 + this.pos.x) * .012; break;
      case 'alert': tg.pitch = -.2; tg.aL = tg.aR = -.6; tg.sq = 1.05; omega = 12; break;
      case 'intro': tg.pitch = -.4 + Math.sin(t * 20) * .04 * (this.st > .6 ? 1 : 0); tg.aL = tg.aR = -1.4; tg.aLz = .6; tg.aRz = -.6; break;
      case 'hurt': tg.pitch = -.25; tg.twist = .15; omega = 12; walk = 0; break;
      case 'broken': tg.pitch = .6 + Math.sin(t * 3) * .05; tg.sq = .84; tg.aL = tg.aR = .3; tg.roll = Math.sin(t * 2.3) * .1; walk = 0; omega = 7;
        if (Math.random() < dt * 8) this.G.fx.motes({ x: this.pos.x, y: this.height * .95, z: this.pos.z }, 0xffe070, 1, .3, .2, .1, .6);
        break;
      case 'grappled': tg.pitch = -.35 - this.grappleK * .4; tg.sq = .95; tg.aL = tg.aR = -.8; omega = 14; walk = 0; break;
      case 'dead': tg.pitch = -1.45; tg.sq = .9; tg.aL = tg.aR = -.4; omega = 5; walk = 0; tg.hop = -this.height * .12; break;
      case 'attack': {
        walk *= .3;
        const w = this.phase === 'windup' ? E(this.pt / this.stepDur.windup) : 1;
        const a = this.phase === 'active' ? E(this.pt / this.stepDur.active) : this.phase === 'recover' ? 1 : 0;
        const r = this.phase === 'recover' ? E(this.pt / this.stepDur.recover) : 0;
        const mix = (wind, act) => lerp(lerp(0, wind, w), act, a) * (1 - r);
        const mixS = (wind, act) => 1 + mix(wind - 1, act - 1);   // squash is neutral at 1
        omega = this.phase === 'active' ? 26 : this.phase === 'windup' ? 11 : 8;
        switch (s.anim) {
          case 'swing':
            tg.twist = mix(-.85, .7); tg.pitch = mix(-.2, .32); tg.aL = mix(-1.5, -.9); tg.aR = mix(-.9, -.4); tg.aLz = mix(-.5, .3); tg.sq = mixS(1.03, .96); break;
          case 'backswing':
            tg.twist = mix(.85, -.7); tg.pitch = mix(-.15, .3); tg.aL = mix(-1.4, -1); tg.aR = mix(-1.1, -.5); tg.aLz = mix(.4, -.3); tg.sq = mixS(1.03, .96); break;
          case 'overhead':
            tg.pitch = mix(-.55, .6); tg.aL = tg.aR = mix(-1.55, -.45); tg.sq = mixS(1.08, .86); break;
          case 'thrust':
            tg.pitch = mix(-.12, .35); tg.fwd = mix(-.25, .35) * this.size; tg.aL = mix(.5, -1.6); tg.aR = mix(.2, -1.2); tg.twist = mix(-.3, .1); tg.sq = mixS(.96, 1.03); break;
          case 'spin':
            tg.twist = mix(.9, .9); tg.sq = mixS(.9, .95); tg.aL = tg.aR = mix(-1.2, -1.5); tg.aLz = mix(-.8, -1.2); tg.aRz = mix(.8, 1.2);
            tg.spin = this.phase === 'active' ? -E(this.pt / this.stepDur.active) * TAU : 0; break;
          case 'leap':
            tg.sq = this.phase === 'windup' ? lerp(1, .72, w) : this.phase === 'active' ? 1.08 : lerp(.8, 1, r);
            tg.pitch = this.phase === 'windup' ? .35 * w : this.phase === 'active' ? -.2 + a * .8 : .6 * (1 - r);
            tg.aL = tg.aR = this.phase === 'active' ? lerp(-1.5, -.4, a) : mix(.4, -.4); break;
          case 'shoot':
            tg.twist = mix(.35, .3); tg.aL = mix(-1.5, -1.4); tg.aR = mix(-1.3, -.9); tg.pitch = mix(-.05, .05); break;
          case 'throw':
            tg.aL = mix(-1.6, -.5); tg.pitch = mix(-.3, .3); tg.twist = mix(-.6, .45); break;
          case 'cast':
            tg.aL = tg.aR = mix(-1.55, -1.1); tg.aLz = mix(-.5, -.2); tg.aRz = mix(.5, .2); tg.pitch = mix(-.3, .25); tg.sq = mixS(1.05, .95);
            if (this.phase === 'windup') this.G.fx.motes({ x: this.pos.x, y: this.height * .9, z: this.pos.z }, 0xb060ff, 1, .4, .6, .12, .6);
            break;
          case 'roar':
            tg.pitch = -.45 + Math.sin(t * 24) * .05; tg.aL = tg.aR = -1.4; tg.aLz = .8; tg.aRz = -.8; tg.sq = 1.08; break;
        }
        break;
      }
    }
    // Locomotion: a gait driven by distance travelled, so feet don't skate; lean into speed and turns.
    this.gait += spd * dt / (.85 * this.size) * Math.PI;
    const g = this.gait;
    if (walk > .02 || Math.abs(this.yawVel) > .8) {
      const wk = Math.max(walk, Math.min(.35, Math.abs(this.yawVel) * .15));
      tg.pitch += .09 * wk;
      tg.hop += Math.abs(Math.sin(g)) * .06 * wk * this.size;
      if (this.state !== 'attack') { tg.aL += Math.sin(g) * .5 * wk; tg.aR -= Math.sin(g) * .5 * wk; }
      tg.roll += Math.sin(g) * .04 * wk;
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

    this.outer.rotation.y = this.yaw;
    this.lean.rotation.set(c.pitch, c.twist + c.spin, c.roll);
    this.lean.position.y = .45 * this.height + c.hop;
    this.lean.position.z = c.fwd;
    const sq = clamp(c.sq, .6, 1.3);
    this.model.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    const [aL, aR] = this.arms, [lL, lR] = this.legs;
    if (aL) { aL.rotation.set(clamp(c.aL, -1.7, .8), 0, clamp(c.aLz, -1, 1)); aR.rotation.set(clamp(c.aR, -1.7, .8), 0, clamp(c.aRz, -1, 1)); }   // the region rig tears past ~100°
    if (lL) { const sw = Math.sin(g) * .6 * Math.min(1, walk + Math.min(.35, Math.abs(this.yawVel) * .15)); lL.rotation.x = sw; lR.rotation.x = -sw; }

    // Hit flash and dread glow.
    const burst = this.burstGlow > 0 ? .7 + Math.sin(t * 30) * .3 : 0;
    if (burst > 0) { this.mat.emissive.setRGB(1, .12, .08); this.mat.emissiveIntensity = .5 + burst * .6; }
    else if (this.state === 'broken') { this.mat.emissive.setRGB(1, .85, .4); this.mat.emissiveIntensity = .15 + Math.sin(t * 8) * .08; }
    else { this.mat.emissive.setRGB(1, 1, 1); this.mat.emissiveIntensity = .08 + this.flash * 1.4; }
  }
}
