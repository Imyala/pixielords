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
    this.pivot.set(p.x, 1.55, p.z);
    const bigLock = lock && lock.height > 3;
    this.dist = damp(this.dist, bigLock ? 6 : 4.7, 2, dt);
    if (lock) {
      const lp = lock.pos, d = Math.hypot(lp.x - p.x, lp.z - p.z);
      this.yaw = dampAngle(this.yaw, yawTo(p.x, p.z, lp.x, lp.z), 9, dt);
      const big = lock.height > 3;
      const want = clamp((big ? .38 : .26) - (d < 2.5 ? .05 : 0) + (big && d < 6 ? .12 : 0), .1, .6);
      this.pitch = damp(this.pitch, want, 4, dt);
      this.look.set(lp.x, Math.min(lock.height * .55, 3), lp.z).lerp(this.pivot, big ? .5 : .6);
    } else {
      this.yaw -= look.x; this.pitch = clamp(this.pitch + look.y, -.32, 1.15);
      if (this.recenterT > 0) { this.recenterT -= dt; this.yaw = dampAngle(this.yaw, this.recenterYaw, 14, dt); this.pitch = damp(this.pitch, .32, 10, dt); }
      this.look.copy(this.pivot);
    }
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const dir = new THREE.Vector3(-fx * cp, sp, -fz * cp);
    // Pull in when a wall is between the player and the camera.
    const hit = this.world.raycast(this.pivot, dir, this.dist + .3, true);
    const want = Math.max(.7, Math.min(this.dist, hit - .35));
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
