// Umbral Realms, as Nioh 2's Dark Realms: in every mission one foe, the hardiest of the rank and file about
// the middle of the way, has swallowed a shard of the moon's dark and spreads it about itself: an Umbral Realm,
// a ring of purple dusk. Inside it your stamina returns slower and foes hit harder, but Faelight comes faster.
// The host is Umbral: much hardier, harder-hitting, named for it. Fell it and the realm is dispelled, for better
// spoils (gear, Moonpetals, now and then a Moon Cup). It rises again whenever the world does (a rest, a fall).
// main.js makes the realm for a mission's host and reads who is inside; enemies.js and player.js read G.inRealm
// and G.realmAt(); hud.js shows the banner.
import * as THREE from 'three';
import { rng } from './util.js';

export const REALM = { r: 14, ki: .6, dmg: 1.15, anima: 1.5, hp: 2.3, hostDmg: 1.25, fog: 0x1a0826 };

// The spawn that hosts a mission's realm: among ordinary foes in the middle half of the way, well clear of the
// Moonwells, one of the three hardiest (the same one every time).
export function realmHost(L, TYPES) {
  if (L.depth || L.noRealm || !L.spawns?.length) return null;
  const main = L.spawns.filter(s => !s.wing);   // a wing's foes (wings.js) keep to their wing
  const zs = main.map(s => s.z), z0 = Math.min(...zs), z1 = Math.max(...zs), bosses = [].concat(L.boss);
  const cand = main.filter(s => {
    const T = TYPES[s.type];
    return T && !T.boss && !T.elite && !s.elite && !s.add && !bosses.includes(s.id) && s.id !== L.gate?.guardian
      && s.z > z0 + (z1 - z0) * .25 && s.z < z0 + (z1 - z0) * .75
      && Object.values(L.shrines).every(sh => Math.hypot(sh.x - s.x, sh.z - s.z) > REALM.r + 6)
      && (!L.seal || (s.x - L.seal.x) * Math.sin(L.seal.yaw) + (s.z - L.seal.z) * Math.cos(L.seal.yaw) < -REALM.r);
  }).sort((a, b) => TYPES[b.type].hp - TYPES[a.type].hp || a.id.localeCompare(b.id)).slice(0, 3);
  if (!cand.length) return null;
  return cand[Math.floor(rng((L.seed || 1) * 13 + 777)() * cand.length)];
}

let TEX = null;
// The realm's floor: dusk pooled toward the middle, a bright rim.
function realmTexture() {
  if (TEX) return TEX;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(20,6,34,.85)'); gr.addColorStop(.7, 'rgba(30,8,50,.6)'); gr.addColorStop(.93, 'rgba(70,20,120,.5)'); gr.addColorStop(.97, 'rgba(170,90,255,.55)'); gr.addColorStop(1, 'rgba(120,40,200,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  TEX = new THREE.CanvasTexture(c); TEX.colorSpace = THREE.SRGBColorSpace;
  return TEX;
}

export class Realm {
  constructor(G, host) {
    this.G = G; this.host = host; this.k = 0; this.x = host.spawn.x; this.z = host.spawn.z; this.r = REALM.r;
    this.disc = new THREE.Mesh(new THREE.CircleGeometry(this.r, 64), new THREE.MeshBasicMaterial({ map: realmTexture(), transparent: true, depthWrite: false, opacity: 0 }));
    this.disc.rotation.x = -Math.PI / 2; this.disc.position.set(this.x, .05, this.z); this.disc.renderOrder = 2;
    this.rim = new THREE.Mesh(new THREE.CylinderGeometry(this.r, this.r, 3.2, 64, 1, true), new THREE.MeshBasicMaterial({ color: 0x8a4aff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.rim.position.set(this.x, 1.6, this.z);
    G.scene.add(this.disc, this.rim);
    this.was = true;
  }
  get on() { return this.k > .5; }
  inside(p) { return this.on && Math.hypot(p.x - this.x, p.z - this.z) < this.r; }
  update(dt) {
    const G = this.G, h = this.host, alive = h.alive && h.active;
    this.k += ((alive ? 1 : 0) - this.k) * Math.min(1, dt * (alive ? 3 : 1.2));
    this.disc.material.opacity = .85 * this.k; this.rim.material.opacity = (.07 + Math.sin(G.time * 1.7) * .02) * this.k;
    this.disc.visible = this.rim.visible = this.k > .01;
    if (this.k > .2) {
      // Dusk rising at the rim, and about the host.
      if (Math.random() < dt * 18) { const a = Math.random() * Math.PI * 2; G.fx.motes({ x: this.x + Math.sin(a) * this.r, y: .2, z: this.z + Math.cos(a) * this.r }, 0x9a5aff, 1, .3, 2.4, .12, 1.6); }
      if (alive && Math.random() < dt * 10) G.fx.motes({ x: h.pos.x, y: h.height * .6, z: h.pos.z }, 0x6a2aaa, 2, h.radius + .2, 1.2, .14, .9);
    }
    // Felled: the dusk breaks up.
    if (this.was && !alive && h.state === 'dead') {
      G.fx.ring({ x: this.x, z: this.z }, 0xb07aff, this.r, 1.2); G.fx.motes({ x: this.x, y: 1, z: this.z }, 0xc8a0ff, 80, this.r * .8, 3, .16, 1.6);
    }
    this.was = alive;
  }
  dispose() {
    this.G.scene.remove(this.disc, this.rim);
    this.disc.geometry.dispose(); this.disc.material.dispose(); this.rim.geometry.dispose(); this.rim.material.dispose();
  }
}
