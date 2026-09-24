// Visual effects: point particles (additive and alpha-blended), sword trails, slash arcs, ground rings,
// sprite flashes and Glimmer wisps that fly to the player.
import * as THREE from 'three';
import { glowTexture } from './textures.js';
import { rand } from './util.js';

const PVERT = `
attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
uniform float uScale; varying float vAlpha; varying vec3 vColor;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  gl_PointSize = aSize * uScale / max(.1, -mv.z);
  gl_Position = projectionMatrix * mv;
  vAlpha = aAlpha; vColor = aColor;
}`;
const PFRAG = `
varying float vAlpha; varying vec3 vColor;
void main(){
  vec2 c = gl_PointCoord - .5; float d = length(c);
  float a = smoothstep(.5, .0, d);
  gl_FragColor = vec4(vColor, a * a * vAlpha);
}`;

class Particles {
  constructor(scene, n, blending) {
    this.n = n; this.i = 0;
    this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3); this.col = new Float32Array(n * 3);
    this.size = new Float32Array(n); this.alpha = new Float32Array(n); this.life = new Float32Array(n); this.max = new Float32Array(n);
    this.drag = new Float32Array(n); this.grav = new Float32Array(n); this.grow = new Float32Array(n); this.a0 = new Float32Array(n);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: PVERT, fragmentShader: PFRAG, transparent: true, depthWrite: false, blending,
      uniforms: { uScale: { value: 400 } },
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
    scene.add(this.points);
  }

  emit(o) {
    const i = this.i; this.i = (this.i + 1) % this.n;
    const i3 = i * 3;
    this.pos[i3] = o.x; this.pos[i3 + 1] = o.y; this.pos[i3 + 2] = o.z;
    this.vel[i3] = o.vx || 0; this.vel[i3 + 1] = o.vy || 0; this.vel[i3 + 2] = o.vz || 0;
    const c = o.color;
    this.col[i3] = c.r; this.col[i3 + 1] = c.g; this.col[i3 + 2] = c.b;
    this.size[i] = o.size ?? .2; this.life[i] = this.max[i] = o.life ?? 1;
    this.a0[i] = this.alpha[i] = o.alpha ?? 1;
    this.drag[i] = o.drag ?? 1; this.grav[i] = o.gravity ?? 0; this.grow[i] = o.grow ?? 0;
  }

  update(dt) {
    const { pos, vel, life } = this;
    for (let i = 0; i < this.n; i++) {
      if (life[i] <= 0) { this.alpha[i] = 0; continue; }
      life[i] -= dt;
      const i3 = i * 3, d = Math.exp(-this.drag[i] * dt);
      vel[i3] *= d; vel[i3 + 1] = vel[i3 + 1] * d - this.grav[i] * dt; vel[i3 + 2] *= d;
      pos[i3] += vel[i3] * dt; pos[i3 + 1] += vel[i3 + 1] * dt; pos[i3 + 2] += vel[i3 + 2] * dt;
      if (pos[i3 + 1] < .02 && this.grav[i] > 0) { pos[i3 + 1] = .02; vel[i3 + 1] *= -.3; vel[i3] *= .6; vel[i3 + 2] *= .6; }
      const k = Math.max(0, life[i] / this.max[i]);
      this.alpha[i] = this.a0[i] * Math.min(1, k * 2.5) * (k > .9 ? (1 - k) * 10 : 1);
      this.size[i] += this.grow[i] * dt;
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = g.attributes.aColor.needsUpdate = g.attributes.aSize.needsUpdate = g.attributes.aAlpha.needsUpdate = true;
  }
}

// Ribbon between successive (base, tip) sword samples.
const TVERT = `attribute float aA; varying float vA; void main(){ vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`;
const TFRAG = `uniform vec3 uColor; varying float vA; void main(){ gl_FragColor = vec4(uColor * (1. + vA), vA * vA * .6); }`;

export class Trail {
  constructor(scene, color, n = 18, life = .14) {
    this.n = n; this.life = life; this.samples = [];
    const g = new THREE.BufferGeometry();
    this.posA = new Float32Array(n * 2 * 3); this.aA = new Float32Array(n * 2);
    g.setAttribute('position', new THREE.BufferAttribute(this.posA, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aA', new THREE.BufferAttribute(this.aA, 1).setUsage(THREE.DynamicDrawUsage));
    const idx = [];
    for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    this.mat = new THREE.ShaderMaterial({ vertexShader: TVERT, fragmentShader: TFRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { uColor: { value: new THREE.Color(color) } } });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 11;
    scene.add(this.mesh);
  }
  add(base, tip, t) {
    this.samples.unshift({ b: base.clone(), p: tip.clone(), t });
    if (this.samples.length > this.n) this.samples.pop();
  }
  update(t) {
    const s = this.samples;
    while (s.length && t - s[s.length - 1].t > this.life) s.pop();
    for (let i = 0; i < this.n; i++) {
      const e = s[Math.min(i, s.length - 1)];
      const a = e && i < s.length ? Math.max(0, 1 - (t - e.t) / this.life) * (1 - i / this.n) : 0;
      if (e) {
        this.posA.set([e.b.x, e.b.y, e.b.z], i * 6);
        this.posA.set([e.p.x, e.p.y, e.p.z], i * 6 + 3);
      }
      this.aA[i * 2] = 0; this.aA[i * 2 + 1] = a;
    }
    this.mesh.visible = s.length > 1;
    this.mesh.geometry.attributes.position.needsUpdate = this.mesh.geometry.attributes.aA.needsUpdate = true;
  }
}

export class FX {
  constructor(scene) {
    this.scene = scene;
    this.add = new Particles(scene, 4000, THREE.AdditiveBlending);
    this.norm = new Particles(scene, 1500, THREE.NormalBlending);
    this.items = [];   // timed meshes/sprites: {obj, t, dur, update}
    this.wispList = [];
    this.glow = glowTexture(); this.star = glowTexture('star');
    this.c = new THREE.Color();
  }

  setScale(h, fov) { const s = h / 2 / Math.tan(fov * Math.PI / 360); this.add.mat.uniforms.uScale.value = this.norm.mat.uniforms.uScale.value = s; }

  col(hex) { return new THREE.Color(hex); }

  spark(p, dir, n = 14, color = 0xffc070, speed = 7) {
    const c = this.col(color);
    for (let i = 0; i < n; i++) {
      const s = speed * rand(.4, 1.2);
      this.add.emit({ x: p.x, y: p.y, z: p.z, vx: (dir.x + rand(-.8, .8)) * s, vy: rand(0, 1.2) * s * .6, vz: (dir.z + rand(-.8, .8)) * s,
        life: rand(.15, .4), size: rand(.04, .09), color: c, gravity: 9, drag: 2.5 });
    }
    this.add.emit({ x: p.x, y: p.y, z: p.z, life: .12, size: 1.2, color: c, alpha: .8, grow: 6 });
  }

  blood(p, dir, n = 12, color = 0x3a0a0a) {
    const c = this.col(color);
    for (let i = 0; i < n; i++) {
      const s = rand(1.5, 5);
      this.norm.emit({ x: p.x, y: p.y, z: p.z, vx: (dir.x + rand(-.6, .6)) * s, vy: rand(.5, 2.5), vz: (dir.z + rand(-.6, .6)) * s,
        life: rand(.4, .8), size: rand(.06, .14), color: c, gravity: 12, drag: 1, alpha: .9 });
    }
  }

  dust(p, n = 8, color = 0x6a6258) {
    const c = this.col(color);
    for (let i = 0; i < n; i++) {
      this.norm.emit({ x: p.x + rand(-.3, .3), y: .1, z: p.z + rand(-.3, .3), vx: rand(-1, 1), vy: rand(.2, .8), vz: rand(-1, 1),
        life: rand(.5, 1), size: rand(.3, .6), grow: .8, color: c, alpha: .25, drag: 3 });
    }
  }

  burstAura(p, color = 0xff2020, n = 3, h = 1.4, r = .6) {
    const c = this.col(color);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28;
      this.add.emit({ x: p.x + Math.cos(a) * r, y: p.y + rand(0, h), z: p.z + Math.sin(a) * r, vx: 0, vy: rand(1, 2.5), vz: 0, life: rand(.3, .6), size: rand(.15, .35), color: c, drag: 1, alpha: .8 });
    }
  }

  motes(p, color, n = 1, spread = 1, up = .5, size = .08, life = 1.5) {
    const c = this.col(color);
    for (let i = 0; i < n; i++) {
      this.add.emit({ x: p.x + rand(-spread, spread), y: p.y + rand(-.2, .2), z: p.z + rand(-spread, spread),
        vx: rand(-.2, .2), vy: rand(up * .5, up), vz: rand(-.2, .2), life: rand(life * .6, life), size: rand(size * .6, size), color: c, drag: .3 });
    }
  }

  explosion(p, r = 2.4) {
    const c = this.col(0xffa040), c2 = this.col(0x302418);
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * 6.28, s = rand(2, 9);
      this.add.emit({ x: p.x, y: p.y + .3, z: p.z, vx: Math.cos(a) * s, vy: rand(1, 7), vz: Math.sin(a) * s, life: rand(.2, .6), size: rand(.2, .5), color: c, drag: 3, gravity: 4 });
      this.norm.emit({ x: p.x + rand(-.5, .5), y: p.y + .4, z: p.z + rand(-.5, .5), vx: Math.cos(a) * s * .3, vy: rand(1, 3), vz: Math.sin(a) * s * .3, life: rand(.8, 1.6), size: rand(.6, 1.2), grow: 1.5, color: c2, alpha: .5, drag: 2 });
    }
    this.add.emit({ x: p.x, y: p.y + .5, z: p.z, life: .25, size: r * 3, color: c, grow: 8 });
    this.ring(p, 0xffa040, r, .35);
  }

  poisonCloud(p, r = 2, color = 0x7ccf3a) {
    const c = this.col(color);
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * r;
      this.norm.emit({ x: p.x + Math.cos(a) * d, y: rand(.2, 1.2), z: p.z + Math.sin(a) * d, vx: rand(-.2, .2), vy: rand(.1, .4), vz: rand(-.2, .2), life: rand(1, 2), size: rand(.8, 1.4), grow: .4, color: c, alpha: .22, drag: 1 });
    }
  }

  fire(p, r = 1.5) {
    const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * r;
    this.add.emit({ x: p.x + Math.cos(a) * d, y: .1, z: p.z + Math.sin(a) * d, vx: rand(-.3, .3), vy: rand(1.5, 3.5), vz: rand(-.3, .3), life: rand(.35, .8), size: rand(.25, .5), color: this.col(Math.random() < .3 ? 0xffd070 : 0xff5a1a), drag: 1.5, grow: -.3 });
  }

  // A leaf spiralling down through the canopy light.
  leaf(p) {
    this.norm.emit({ x: p.x, y: p.y, z: p.z, vx: rand(-.6, .6), vy: -rand(.5, .9), vz: rand(-.6, .6), life: rand(5, 8), size: rand(.08, .13), color: this.col(Math.random() < .5 ? 0x6b5a2a : 0x8a4a22), alpha: .9, drag: .05 });
  }

  // Expanding flat ring on the ground (or at height y).
  ring(p, color, radius = 2, dur = .4, y = .06, width = .12) {
    const m = new THREE.Mesh(new THREE.RingGeometry(1 - width, 1, 48), new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.set(p.x, y, p.z);
    this.scene.add(m);
    this.items.push({ obj: m, t: 0, dur, update: (k) => { m.scale.setScalar(.2 + k * radius); m.material.opacity = 1 - k; } });
  }

  // Warning disc that fills over `dur` (bomb landing points, leap targets).
  telegraph(p, radius, dur, color = 0xff3020) {
    const g = new THREE.Group(); g.position.set(p.x, .05, p.z);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.94, 1, 48), new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    const fill = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .15, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    for (const m of [ring, fill]) { m.rotation.x = -Math.PI / 2; g.add(m); }
    ring.scale.setScalar(radius);
    this.scene.add(g);
    const it = { obj: g, t: 0, dur, update: k => { fill.scale.setScalar(Math.max(.01, k * radius)); ring.material.opacity = .5 + Math.sin(k * 30) * .3; } };
    this.items.push(it);
    return it;
  }

  // Horizontal slash crescent in front of an attacker, for readability of enemy swings.
  arc(p, yaw, radius, arcDeg, color = 0xffffff, y = 1, tilt = 0, dur = .18) {
    const a = arcDeg * Math.PI / 180;
    const geo = new THREE.RingGeometry(radius * .55, radius, 32, 1, -a / 2, a);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    const g = new THREE.Group(); g.position.set(p.x, y, p.z); g.rotation.y = yaw + Math.PI;   // the ring's angle 0 lands on local -Z
    m.rotation.x = -Math.PI / 2 + tilt; m.rotation.z = Math.PI / 2;
    g.add(m); this.scene.add(g);
    this.items.push({ obj: g, t: 0, dur, update: k => { m.material.opacity = .28 * (1 - k) * (1 - k); m.scale.setScalar(1 + k * .15); } });
  }

  // A bright diagonal cut hanging in the air: the Flashcut.
  slash(p, yaw, len = 5, color = 0xffffff, dur = .45) {
    const g = new THREE.Group(); g.position.set(p.x, p.y, p.z); g.rotation.y = yaw;
    const mk = (w, h, c, o) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, side: THREE.DoubleSide }));
    const glow = mk(len * 1.05, .45, color, .45), core = mk(len, .06, 0xffffff, 1);
    for (const m of [glow, core]) { m.rotation.z = .38; m.renderOrder = 21; g.add(m); }
    this.scene.add(g);
    this.items.push({ obj: g, t: 0, dur, update: k => {
      const grow = Math.min(1, k * 6);
      g.scale.set(.2 + grow * .8, 1 - k * .7, 1);
      core.material.opacity = 1 - k; glow.material.opacity = .45 * (1 - k);
    } });
  }

  // Camera-facing flash (attack glints, burst warnings, pulses).
  flash(p, color, size = 1, dur = .3, star = false) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: star ? this.star : this.glow, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
    s.position.copy(p); s.renderOrder = 20;
    this.scene.add(s);
    this.items.push({ obj: s, t: 0, dur, update: k => { s.scale.setScalar(size * (star ? 1 + Math.sin(k * Math.PI) * .6 : .6 + k * .6)); s.material.opacity = star ? Math.sin(k * Math.PI) : 1 - k; s.material.rotation = k * 1.5; } });
    return s;
  }

  // Soul motes: burst from p, then home in on target() and call onArrive once each.
  // With o.range set, a mote hovers where it fell until the target comes within range (or o.hover runs out).
  wisps(p, n, target, onArrive, color = 0xffd27a, o = {}) {
    for (let i = 0; i < n; i++) {
      this.wispList.push({ x: p.x + rand(-.4, .4), y: p.y + rand(0, .8), z: p.z + rand(-.4, .4), vx: rand(-2.5, 2.5), vy: rand(2, 4), vz: rand(-2.5, 2.5), t: 0, delay: i * .03,
        target, onArrive, c: this.col(color), range: o.range || 0, hover: o.hover || 0, size: o.size || .16, homing: !o.range, ph: Math.random() * 6 });
    }
  }

  update(dt, t) {
    this.add.update(dt); this.norm.update(dt);
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i]; it.t += dt;
      const k = Math.min(1, it.t / it.dur);
      it.update(k);
      if (k >= 1 || it.dead) {
        this.scene.remove(it.obj);
        it.obj.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
        this.items.splice(i, 1);
      }
    }
    for (let i = this.wispList.length - 1; i >= 0; i--) {
      const w = this.wispList[i];
      w.t += dt;
      if (w.t < w.delay) continue;
      const tg = w.target(), dx = tg.x - w.x, dy = tg.y - w.y, dz = tg.z - w.z, d = Math.hypot(dx, dy, dz);
      if (!w.homing) {
        // Hover and bob where it fell until the knight comes near.
        const drag = Math.exp(-3 * dt); w.vx *= drag; w.vz *= drag; w.vy = w.vy * drag + (1.1 + Math.sin(w.t * 2 + w.ph) * .15 - w.y) * 3 * dt;
        w.x += w.vx * dt; w.y += w.vy * dt; w.z += w.vz * dt;
        if (Math.random() < dt * 30) this.add.emit({ x: w.x, y: w.y, z: w.z, life: .5, size: w.size, color: w.c, alpha: .8, vy: .3 });
        if (w.t > .5 && d < w.range) { w.homing = true; w.t = w.delay + .3; }
        if (w.t > w.hover) this.wispList.splice(i, 1);
        continue;
      }
      const pull = Math.min(1, (w.t - w.delay) * 1.2) * 40;
      w.vx += dx / d * pull * dt; w.vy += dy / d * pull * dt; w.vz += dz / d * pull * dt;
      const drag = Math.exp(-2.2 * dt); w.vx *= drag; w.vy *= drag; w.vz *= drag;
      w.x += w.vx * dt; w.y += w.vy * dt; w.z += w.vz * dt;
      this.add.emit({ x: w.x, y: w.y, z: w.z, life: .25, size: w.size, color: w.c, alpha: .9 });
      if (d < .5 || w.t > 6) { this.wispList.splice(i, 1); w.onArrive?.(); }
    }
  }
}
