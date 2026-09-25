// Third-person orbit camera with lock-on framing, wall collision and trauma-based shake.
// yaw is the direction the camera looks (0 = +Z); pitch is the camera's elevation above the target.
import * as THREE from 'three';
import { clamp, damp, dampAngle, yawTo, angleDiff } from './util.js';

export class CameraRig {
  constructor(camera, world) {
    this.camera = camera; this.world = world;
    this.yaw = 0; this.pitch = .3; this.dist = 4.7; this.curDist = 4.7;
    this.trauma = 0; this.t = 0;
    this.pivot = new THREE.Vector3(); this.look = new THREE.Vector3();
    this.recenterT = 0; this.recenterYaw = 0;
    this.lockTilt = 0;   // the player's own tilt while locked on (mouse or right stick, up and down)
    this.lockHeight = 1;   // settings: 0 low, 1 normal, 2 high
    this.distScale = 1;   // settings: near, normal, far
  }

  recenter(yaw) { this.recenterT = .35; this.recenterYaw = yaw; }

  shake(amount, at) {
    let a = amount;
    if (at) { const d = Math.hypot(at.x - this.pivot.x, at.z - this.pivot.z); a *= clamp(1.4 - d / 18, 0, 1); }
    this.trauma = Math.min(1, this.trauma + a);
  }

  snap(player) {
    this.yaw = player.yaw; this.pitch = .32;
    this.update(0, player, null, { x: 0, y: 0 });
  }

  update(dt, player, lock, look) {
    this.t += dt;
    const p = player.pos;
    // Rise with the knight in the air, a little behind so launches feel tall.
    this.pivotY = dt ? damp(this.pivotY ?? 1.55, 1.55 + p.y * .75, 9, dt) : 1.55 + p.y * .75;
    this.pivot.set(p.x, this.pivotY, p.z);
    const bigLock = lock && lock.height > 3;
    this.dist = damp(this.dist, (bigLock ? 6.2 : lock ? 5.2 : 4.7) * this.distScale, 2, dt);
    // Aiming a ranged weapon: in close over the right shoulder.
    const ak = this.aimK = dt ? damp(this.aimK || 0, player.aiming ? 1 : 0, 9, dt) : player.aiming ? 1 : 0;
    if (ak > .001) this.pivot.add({ x: -Math.cos(this.yaw) * .78 * ak, y: .1 * ak, z: Math.sin(this.yaw) * .78 * ak });
    if (lock) {
      // Locked on: stay high enough to see the foe over the knight's shoulder (a little higher up close and for
      // big foes), and let the player tilt it themselves.
      const lp = lock.pos, d = Math.hypot(lp.x - p.x, lp.z - p.z);
      this.yaw = dampAngle(this.yaw, yawTo(p.x, p.z, lp.x, lp.z), 9, dt);
      const big = lock.height > 3;
      this.lockTilt = clamp(this.lockTilt + look.y, -.25, .35);
      const want = clamp((big ? .42 : .4) + (d < 3 ? .06 : 0) + (big && d < 6 ? .1 : 0) + (this.lockHeight - 1) * .1 + this.lockTilt, .15, .85);
      this.pitch = damp(this.pitch, want, 4, dt);
      this.look.set(lp.x, lp.y + Math.min(lock.height * .5, 2.6), lp.z).lerp(this.pivot, big ? .5 : .55);
      this.look.y = Math.max(this.look.y, this.pivot.y - .1);
    } else {
      this.lockTilt *= Math.max(0, 1 - dt * 4);
      this.yaw -= look.x; this.pitch = clamp(this.pitch + look.y, player.aiming ? -.6 : -.32, 1.15);
      if (this.recenterT > 0) { this.recenterT -= dt; this.yaw = dampAngle(this.yaw, this.recenterYaw, 14, dt); this.pitch = damp(this.pitch, .32, 10, dt); }
      this.look.copy(this.pivot);
    }
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const dir = new THREE.Vector3(-fx * cp, sp, -fz * cp);
    // Pull in when a wall is between the player and the camera.
    const dist = this.dist + (3 - this.dist) * ak;
    const hit = this.world.raycast(this.pivot, dir, dist + .3, true);
    const want = Math.max(.7, Math.min(dist, hit - .35));
    this.curDist = want < this.curDist ? want : damp(this.curDist, want, 3, dt);
    const cam = this.camera;
    cam.position.copy(this.pivot).addScaledVector(dir, this.curDist);
    // Pulled in close by a wall: lift the camera to look over the knight's head.
    const close = Math.max(0, 2.4 - this.curDist);
    cam.position.y = Math.max(.35, cam.position.y + close * .55);
    this.look.y += close * .25;
    // Shake.
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    const s = this.trauma * this.trauma;
    if (s > 0) {
      const t = this.t * 40;
      cam.position.x += Math.sin(t * 1.1) * .18 * s; cam.position.y += Math.sin(t * 1.7 + 1) * .14 * s; cam.position.z += Math.sin(t * 1.3 + 2) * .18 * s;
    }
    cam.lookAt(this.look.x, this.look.y + (lock ? 0 : .05), this.look.z);
    if (s > 0) cam.rotateZ(Math.sin(this.t * 33) * .03 * s);
  }
}
