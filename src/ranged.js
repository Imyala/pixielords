// Ranged weapons: Nioh's bow, matchlock rifle and hand cannon, and a NieR-style pod. One is carried beside the
// two melee weapons (chosen in the Arsenal). Aim raises it: the camera comes in over the shoulder, the knight
// slows to a walk and faces where the reticle points, and strike fires.
//   Wisp Pod        the pixie wisp at the knight's shoulder fires a stream of motes while strike is held.
//                   It needs no ammunition but heats as it fires; let it overheat and it falls silent a while.
//   Moonbow         hold strike to draw, let go to loose; the longer the draw, the harder and flatter the arrow.
//   Starlock Rifle  one heavy, fast shot, then a long reload.
//   Thunder Cannon  a shell that bursts where it lands, knocking everything down; the recoil shoves the knight back.
// Shots to the head hit half again as hard. Arrows, shot and shells are refilled at every Moonwell, and crates
// and urns sometimes hold a few. The functions below are mixed into the Player (player.js).
import * as THREE from 'three';
import { ACTIONS, K, pose } from './knight.js';
import { clamp, yawTo } from './util.js';

export const RANGED = {
  wisp: { name: 'Wisp Pod', kind: 'pod', color: 0xcff6ff, dmg: 9, ki: 5, poise: 1, speed: 40, rate: .085, heat: 5.5, cool: 38, overheat: 1.6, range: 30,
    desc: 'The wisp at your shoulder, taught to fight: hold strike to pour motes at the foe. No ammunition, but it overheats.', source: 'start' },
  bow: { name: 'Moonbow', kind: 'bow', color: 0xd8f0ff, dmg: 74, ki: 22, poise: 12, speed: 46, drop: 7, draw: .55, reload: .35, ammo: 30, range: 60,
    desc: 'A longbow strung with moonlight: draw, hold, loose. Quiet, quick, and deadly to the head.', source: { gate: 'keep' } },
  rifle: { name: 'Starlock Rifle', kind: 'rifle', color: 0xffe0a0, dmg: 210, ki: 60, poise: 40, speed: 150, drop: 0, reload: 1.6, ammo: 12, range: 80,
    desc: 'A goblin matchlock with a star-shard in its lock: one shot that fells ordinary foes, then a long reload.', source: { boss: 'rotwood' } },
  cannon: { name: 'Thunder Cannon', kind: 'cannon', color: 0xffb070, dmg: 260, ki: 90, poise: 70, speed: 30, drop: 9, reload: 2.5, ammo: 5, aoe: 3.4, recoil: 1.4, range: 50,
    desc: 'A hand cannon from the tunnel-warrens: a shell that bursts where it lands and throws foes down. It kicks.', source: { boss: 'deep' } },
};
export const RANGED_ORDER = ['wisp', 'bow', 'rifle', 'cannon'];

// ---------------------------------------------------------------- aiming poses (loops)
const STEADY = { lift: -.05, thLx: -.35, knL: .35, thRx: .35, knR: .3 };
Object.assign(ACTIONS, {
  // Side-on, bow arm out along the aim, the draw hand resting at the string (see DRAW for the full draw).
  aim_bow: { dur: 1, loop: true, keys: [K(0, { chestRy: -.9, chestRx: .02, headRy: .8, headRx: .05, lhX: .47, lhY: .24, lhZ: .37, lbYaw: .9, lbPitch: 0, lbRoll: 0,
    hiltA: .7, hiltR: .3, hiltH: .22, bladeYaw: .9, bladePitch: 0, bladeRoll: 0, twoHand: 0, wings: .5, ...STEADY })] },
  aim_rifle: { dur: 1, loop: true, keys: [K(0, { chestRy: -.3, chestRx: .05, headRy: .25, headRx: .1, hiltA: -.32, hiltR: .22, hiltH: .26, bladeYaw: .3, bladePitch: 0, bladeRoll: 0, twoHand: 1, wings: .4, ...STEADY })] },
  aim_cannon: { dur: 1, loop: true, keys: [K(0, { chestRy: -.35, chestRx: .1, headRy: .3, headRx: .05, hiltA: -.5, hiltR: .14, hiltH: .4, bladeYaw: .35, bladePitch: .04, bladeRoll: 0, twoHand: 1, wings: .4, ...STEADY, lift: -.08 })] },
  // The pod fires on its own; the knight points it on with the free hand.
  aim_pod: { dur: 1, loop: true, keys: [K(0, { lhX: .12, lhY: .32, lhZ: .55, chestRy: .1 })] },
});
// The full draw: the right hand back at the jaw.
export const DRAW = pose({ hiltA: -.85, hiltR: .08, hiltH: .26 });

// ---------------------------------------------------------------- the player's side
const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _p = new THREE.Vector3(), _h = new THREE.Vector3();
export const rangedMethods = {
  get R() { return RANGED[this.rangedSel]; },
  rangedDef(id) { return RANGED[id]; },
  ammoMax(id) { const R = RANGED[id]; return R?.ammo ? Math.round(R.ammo * (this.sk('r_quiver', id) ? 1.5 : 1)) : 0; },
  refillAmmo() { this.ammo ||= {}; for (const id of this.rangedOwned || []) if (RANGED[id].ammo) this.ammo[id] = this.ammoMax(id); this.heat = 0; this.hot = 0; },
  addAmmo(id, n) { if (!RANGED[id]?.ammo || !this.rangedOwned?.includes(id)) return 0; const before = this.ammo[id] || 0; this.ammo[id] = Math.min(this.ammoMax(id), before + n); return this.ammo[id] - before; },

  startAim() {
    const G = this.G, R = this.R;
    if (!R || this.aiming || this.state !== 'free' || this.pos.y > .1) return false;
    this.aiming = true; this.drawT = 0; this.drawing = false; this.reloadT = Math.max(this.reloadT || 0, 0);
    this.k.setRanged(R.kind === 'pod' ? null : this.rangedSel);
    this.anim.play('aim_' + R.kind, 1, .12);
    G.audio.sfx('stance', { pitch: 1.4, vol: .6 });
    return true;
  },
  endAim() {
    if (!this.aiming) return;
    this.aiming = false; this.drawing = false; this.drawT = 0;
    this.k.setRanged(null);
    if (this.anim.name?.startsWith('aim_')) this.anim.stop();
  },
  // The aim ray: from the camera through the reticle; the point is the first foe or wall it meets (a locked
  // foe is aimed at outright).
  aimPoint(out) {
    const G = this.G, cam = G.cam.camera;
    if (this.lock?.alive) { out.set(this.lock.pos.x, this.lock.pos.y + this.lock.height * .6, this.lock.pos.z); return null; }
    cam.getWorldPosition(_o); cam.getWorldDirection(_d);
    let best = this.R.range || 60, hitE = null;
    const wall = G.world.raycast(_o, _d, best); if (wall < best) best = wall;
    if (_d.y < -.01) best = Math.min(best, -_o.y / _d.y);   // the ground
    for (const e of G.enemies) {
      if (!e.alive || e.burrowed || !e.outer?.visible) continue;
      _p.set(e.pos.x, e.pos.y + e.height * .55, e.pos.z).sub(_o);
      const t = _p.dot(_d); if (t < 1 || t > best) continue;
      const r = Math.max(e.radius, e.height * .4) + .15;
      if (_p.lengthSq() - t * t < r * r) { best = t; hitE = e; }
    }
    out.copy(_o).addScaledVector(_d, best);
    return hitE;
  },

  // While aiming (the free state): turn to the reticle, fire, draw, reload, cool.
  updateAim(dt) {
    const G = this.G, inp = G.input, R = this.R;
    if (!R) { this.endAim(); return; }
    const pt = _h; this.aimPoint(pt);
    this.k.root.updateMatrixWorld(true);
    const want = yawTo(this.pos.x, this.pos.z, pt.x, pt.z);
    this.yaw = want;
    const dy = pt.y - (this.pos.y + 1.45), dh = Math.hypot(pt.x - this.pos.x, pt.z - this.pos.z);
    this.aimPitch = clamp(Math.atan2(dy, Math.max(1, dh)), -.6, .7);
    const quick = this.sk('r_quick', this.rangedSel) ? .67 : 1;
    this.reloadT = Math.max(0, (this.reloadT || 0) - dt / quick);
    const fire = G.controlsOn && (inp.down('light') || inp.down('heavy'));
    if (R.kind === 'pod') {
      this.hot = Math.max(0, (this.hot || 0) - dt);
      if (fire && !this.hot && this.reloadT <= 0) {
        this.reloadT = R.rate; this.heat = (this.heat || 0) + R.heat;
        this.fireRanged(1);
        if (this.heat >= 100) { this.hot = R.overheat; this.heat = 100; G.hud.toast('Wisp overheated', 'warn'); G.audio.sfx('ice', { vol: .5 }); }
      }
    } else if (R.kind === 'bow') {
      const loaded = this.reloadT <= 0 && this.ammo[this.rangedSel] > 0;
      if (fire && loaded) { if (!this.drawing) G.audio.sfx('swing', { pitch: .6, vol: .4 }); this.drawing = true; this.drawT = Math.min(R.draw * quick, this.drawT + dt); }
      else if (this.drawing) { this.fireRanged(.45 + .55 * this.drawT / (R.draw * quick)); this.drawing = false; this.drawT = 0; this.reloadT = R.reload; }
      else if (fire && !loaded && inp.hit('light') && !this.ammo[this.rangedSel]) G.hud.toast('No arrows left');
      this.k.ranged.bow.arrow.visible = loaded;
    } else if (G.controlsOn && (inp.hit('light') || inp.hit('heavy'))) {
      if (this.reloadT > 0) { /* still reloading */ }
      else if (!(this.ammo[this.rangedSel] > 0)) G.hud.toast(R.kind === 'cannon' ? 'No shells left' : 'No shot left');
      else { this.fireRanged(1); this.reloadT = R.reload; }
    }
    if (R.kind !== 'pod' && this.reloadT <= 0 && this.reloadDone === false) { this.reloadDone = true; G.audio.sfx('block', { vol: .35, pitch: 1.6 }); }
  },
  coolPod(dt) {
    const R = RANGED.wisp;
    if (!this.aiming || !(this.G.input.down('light') || this.G.input.down('heavy')) || this.hot) this.heat = Math.max(0, (this.heat || 0) - R.cool * (this.sk('r_quiver', 'wisp') ? 2 : 1) * dt);
  },

  fireRanged(power) {
    const G = this.G, R = this.R, id = this.rangedSel;
    const tg = this.aimPoint(_h);
    // From the muzzle (the bow's arrow, the pod's wisp) toward the aim point.
    if (R.kind === 'pod') _o.copy(this.wispPos);
    else this.k.ranged[id].muzzle.getWorldPosition(_o);
    _d.copy(_h).sub(_o); const dist = _d.length(); _d.normalize();
    const speed = R.speed * (R.kind === 'bow' ? .6 + .4 * power : 1);
    // Arrows and shells are aimed a little high to fall onto the point.
    if (R.drop) { const tt = dist / speed; _d.y += R.drop * tt * .5 / speed; _d.normalize(); }
    if (R.kind === 'pod') _d.x += (Math.random() - .5) * .03, _d.y += (Math.random() - .5) * .03;
    const mesh = this.shotMesh(R.kind);
    this.addShot({ kind: 'r_' + R.kind, mesh, x: _o.x, y: _o.y, z: _o.z, vx: _d.x * speed, vy: _d.y * speed, vz: _d.z * speed, life: (R.range / speed) + .4, power, id, tg });
    if (R.ammo) { this.ammo[id]--; this.reloadDone = false; }
    if (R.kind === 'pod') { G.audio.sfx('glint', { vol: .25, pitch: 1.8 }); G.fx.flash(_o, R.color, .5, .08, true); }
    else if (R.kind === 'bow') { G.audio.sfx('swing', { pitch: 1.5, vol: .6 }); }
    else {
      G.audio.sfx(R.kind === 'cannon' ? 'explode' : 'hitHeavy', { vol: R.kind === 'cannon' ? .7 : .8, pitch: R.kind === 'cannon' ? .8 : 1.6 });
      G.fx.flash(_o, 0xffd080, R.kind === 'cannon' ? 2.4 : 1.4, .12, true); G.fx.motes(_o, 0xb0a090, 10, .2, .6, .12, .8);
      G.cam.shake(R.kind === 'cannon' ? .45 : .18);
      this.shotKick = 1;
      if (R.recoil) { this.pos.x -= Math.sin(this.yaw) * R.recoil * .5; this.pos.z -= Math.cos(this.yaw) * R.recoil * .5; this.knock = { yaw: this.yaw + Math.PI, v: R.recoil * 4 }; }
    }
    return true;
  },
  shotMesh(kind) {
    const g = new THREE.Group();
    if (kind === 'bow') {
      const s = new THREE.CylinderGeometry(.008, .008, .72, 5); s.rotateX(Math.PI / 2);
      g.add(new THREE.Mesh(s, new THREE.MeshBasicMaterial({ color: 0x8a6a48 })));
      const h = new THREE.ConeGeometry(.02, .08, 5); h.rotateX(Math.PI / 2); h.translate(0, 0, .38); g.add(new THREE.Mesh(h, new THREE.MeshBasicMaterial({ color: 0xe8f4ff })));
    } else if (kind === 'cannon') g.add(new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), new THREE.MeshStandardMaterial({ color: 0x333338, metalness: .6, roughness: .4, emissive: 0x442200 })));
    else if (kind === 'rifle') { const t = new THREE.CylinderGeometry(.018, .018, .9, 5); t.rotateX(Math.PI / 2); g.add(new THREE.Mesh(t, new THREE.MeshBasicMaterial({ color: 0xffe8b0, transparent: true, opacity: .85 }))); }
    else g.add(new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xdff8ff })));
    return g;
  },

  // A ranged shot in flight: moves (arrows and shells fall), meets walls, foes and crates. Returns true when done.
  updateRangedShot(s, dt) {
    const G = this.G, R = RANGED[s.id];
    if (R.drop) s.vy -= R.drop * dt * (R.kind === 'bow' ? 1.6 - s.power : 1);
    const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt, nz = s.z + s.vz * dt;
    const burst = () => { if (R.aoe) this.shellBurst(s.x, s.y, s.z, s); };
    // Foes: the nearest crossed on this step's segment.
    let hitE = null, bt = 2;
    for (const e of G.enemies) {
      if (!e.alive || e.burrowed || e === s.last) continue;
      const t = segCylinder(s.x, s.y, s.z, nx, ny, nz, e.pos.x, e.pos.y, e.pos.z, e.radius + (R.kind === 'pod' ? .15 : .1), e.height);
      if (t >= 0 && t < bt) { bt = t; hitE = e; }
    }
    if (hitE) {
      const hx = s.x + (nx - s.x) * bt, hy = s.y + (ny - s.y) * bt, hz = s.z + (nz - s.z) * bt;
      if (R.aoe) { s.x = hx; s.y = hy; s.z = hz; burst(); return true; }
      const head = hy > hitE.pos.y + hitE.height * .74;
      const mul = this.dmgMul * (this.sk('r_power', s.id) ? 1.2 : 1) * (head ? (this.sk('r_head', s.id) ? 2 : 1.5) : 1) * (R.kind === 'bow' ? s.power : 1) * (this.shifted ? 1.3 : 1);
      const res = hitE.takeHit({ dmg: R.dmg * mul, ki: R.ki * (head ? 1.5 : 1), poise: R.poise * (R.kind === 'bow' ? s.power : 1), dir: Math.atan2(s.vx, s.vz), heavy: R.kind === 'rifle', kb: R.kind === 'rifle' ? 3 : 0, ranged: true });
      if (res) {
        this.combo.n++; this.combo.t = G.time;
        this.gainMastery(res === 'kill' ? 6 : R.kind === 'pod' ? .25 : 2, s.id);
        if (head && R.kind !== 'pod') G.hud.toast('Headshot', 'pulse');
        if (R.kind !== 'pod') G.tally?.('ranged');
      }
      G.fx.spark({ x: hx, y: hy, z: hz }, { x: s.vx, z: s.vz }, R.kind === 'pod' ? 4 : 12, R.kind === 'pod' ? 0xcff6ff : 0xffd080, R.kind === 'pod' ? 2 : 5);
      G.audio.sfx(R.kind === 'pod' ? 'glint' : 'hit', { x: hx, z: hz, vol: R.kind === 'pod' ? .15 : .7 });
      this.gainAnima(R.kind === 'pod' ? .3 : 3);
      return true;
    }
    // Walls and the ground.
    if (ny < 0 || !G.world.los({ x: s.x, z: s.z }, { x: nx, z: nz }, Math.max(.3, ny))) {
      if (R.aoe) { burst(); return true; }
      G.fx.spark({ x: s.x, y: Math.max(.1, s.y), z: s.z }, { x: -s.vx, z: -s.vz }, 6, 0xd8d0c0, 3);
      return true;
    }
    for (const b of G.world.breakables) if (!b.broken && ny < b.h + .2 && Math.hypot(b.x - nx, b.z - nz) < b.r + .1) {
      if (R.aoe) { burst(); return true; }
      G.world.hitBreakable(b, R.kind === 'pod' ? .25 : 3, Math.atan2(s.vx, s.vz)); return true;
    }
    s.x = nx; s.y = ny; s.z = nz;
    s.mesh.position.set(nx, ny, nz);
    s.mesh.rotation.set(-Math.atan2(s.vy, Math.hypot(s.vx, s.vz)), Math.atan2(s.vx, s.vz), 0, 'YXZ');
    if (R.kind === 'cannon' && Math.random() < dt * 60) G.fx.motes(s.mesh.position, 0x9a8a7a, 1, .1, .2, .12, .6);
    if (R.kind === 'pod' && Math.random() < dt * 30) G.fx.motes(s.mesh.position, 0xcff6ff, 1, .02, 0, .04, .25);
    return s.t >= s.life;
  },
  shellBurst(x, y, z, s) {
    const G = this.G, R = RANGED.cannon, p = { x, y: Math.max(0, y), z };
    G.fx.explosion(p, R.aoe * .8); G.fx.ring(p, 0xffb070, R.aoe, .35);
    G.audio.sfx('explode', { x, z }); G.cam.shake(.5, p);
    const mul = this.dmgMul * (this.sk('r_power', 'cannon') ? 1.2 : 1) * (this.shifted ? 1.3 : 1);
    for (const e of G.enemies) {
      if (!e.alive || e.burrowed) continue;
      const d = Math.hypot(e.pos.x - x, e.pos.z - z);
      if (d > R.aoe + e.radius || Math.abs(e.pos.y - p.y) > 3) continue;
      const k = 1 - .5 * Math.min(1, d / R.aoe);
      const res = e.takeHit({ dmg: R.dmg * mul * k, ki: R.ki * k, poise: R.poise, dir: yawTo(x, z, e.pos.x, e.pos.z), heavy: true, kb: 8, ranged: true });
      if (res) { this.combo.n++; this.combo.t = G.time; this.gainMastery(res === 'kill' ? 6 : 2, 'cannon'); }
      if (res && res !== 'kill' && res !== 'blocked' && e.state !== 'air') e.launch?.(3.4, true);
    }
    for (const b of G.world.breakables) if (!b.broken && Math.hypot(b.x - x, b.z - z) < R.aoe + b.r) G.world.hitBreakable(b, 3, 0);
    G.world.smash?.(x, z, R.aoe);
  },
};

// Where a segment first enters an upright cylinder (foot at y, height h): 0..1 along it, or -1.
function segCylinder(x0, y0, z0, x1, y1, z1, cx, cy, cz, r, h) {
  const dx = x1 - x0, dz = z1 - z0, fx = x0 - cx, fz = z0 - cz;
  const a = dx * dx + dz * dz, b = 2 * (fx * dx + fz * dz), c = fx * fx + fz * fz - r * r;
  let t;
  if (c <= 0) t = 0;
  else {
    if (a < 1e-9) return -1;
    const disc = b * b - 4 * a * c; if (disc < 0) return -1;
    t = (-b - Math.sqrt(disc)) / (2 * a);
    if (t < 0 || t > 1) return -1;
  }
  const y = y0 + (y1 - y0) * t;
  return y >= cy - .1 && y <= cy + h + .2 ? t : -1;
}
