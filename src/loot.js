// Loot on the ground: gear dropped by fallen foes (gear.js), marked by a beam of light in its rarity's colour,
// taken by walking over it. Ordinary foes drop now and then, elites often, gatekeepers and warlords always
// (and better). Weapons drop only of kinds the knight already carries; armour mostly of the mission's own set.
import * as THREE from 'three';
import { RARITY, SLOTS, SETS, MISSION_GEAR, makeItem, rollRarity, itemName } from './gear.js';

export const PACK = 80;   // pieces carried, equipped ones included

export class Loot {
  constructor(G) { this.G = G; this.list = []; this.beamGeo = new THREE.CylinderGeometry(.06, .06, 1, 6, 1, true); this.beamGeo.translate(0, .5, 0); this.gemGeo = new THREE.OctahedronGeometry(.14); }

  // A foe has fallen: roll what it leaves.
  dropFrom(e, big = false) {
    const G = this.G, p = G.player, d = G.save.data;
    const boss = big || G.bosses.includes(e) || e === G.gatekeeper;
    const mul = 1 + (p.gear?.fx.drops || 0) / 100;
    const n = boss ? 2 + (Math.random() < .5 ? 1 : 0) : e.elite ? (Math.random() < .55 * mul ? 1 : 0) : Math.random() < .085 * mul ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const it = this.roll(boss ? 1.6 : e.elite ? .7 : 0, boss && i === 0 ? 2 : 0);
      const a = Math.random() * Math.PI * 2, r = n > 1 ? .9 + i * .5 : .3;
      this.place(it, e.pos.x + Math.sin(a) * r, e.pos.z + Math.cos(a) * r);
    }
    if (n) G.audio.sfx('glint', { vol: .6, pitch: .8 });
  }
  // A new piece for this mission: kind, level and rarity (at least minRar).
  roll(luck = 0, minRar = 0) {
    const G = this.G, d = G.save.data, MG = MISSION_GEAR[G.level.id] || MISSION_GEAR.keep;
    const lvl = Math.round(MG.lvl[0] + Math.random() * (MG.lvl[1] - MG.lvl[0])) + d.ng * 20;
    const rar = Math.max(minRar, rollRarity(luck));
    d.gear.uid = (d.gear.uid || 1) + 1;
    if (Math.random() < .42) {
      const type = d.arms[Math.floor(Math.random() * d.arms.length)];
      return makeItem({ kind: 'weapon', type, lvl, rar }, d.gear.uid);
    }
    // Armour: the mission's set, or now and then a set from a mission already opened.
    const others = Object.entries(MISSION_GEAR).filter(([id]) => d.unlocked.includes(id)).map(([, g]) => g.set);
    const set = Math.random() < .72 || !others.length ? MG.set : others[Math.floor(Math.random() * others.length)];
    return makeItem({ kind: 'armor', slot: SLOTS[Math.floor(Math.random() * SLOTS.length)], set, lvl, rar }, d.gear.uid);
  }
  place(it, x, z) {
    const G = this.G, col = RARITY[it.rar].color;
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const beam = new THREE.Mesh(this.beamGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false }));
    beam.scale.set(1.3 + it.rar * .25, 1.6 + it.rar * .5, 1.3 + it.rar * .25);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.28, .36, 20), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .03;
    const gem = new THREE.Mesh(this.gemGeo, new THREE.MeshBasicMaterial({ color: col }));
    gem.position.y = .35;
    g.add(beam, gem, ring); G.scene.add(g);
    this.list.push({ it, g, beam, gem, ring, t: 0 });
    while (this.list.length > 40) this.remove(this.list[0]);
  }
  remove(l) { this.G.scene.remove(l.g); l.beam.material.dispose(); l.gem.material.dispose(); l.ring.geometry.dispose(); l.ring.material.dispose(); this.list.splice(this.list.indexOf(l), 1); }
  clear() { while (this.list.length) this.remove(this.list[0]); }

  update(dt) {
    const G = this.G, p = G.player;
    for (const l of [...this.list]) {
      l.t += dt;
      l.gem.rotation.y += dt * 2; l.gem.position.y = .35 + Math.sin(l.t * 3) * .06;
      l.beam.material.opacity = .45 + l.it.rar * .06 + Math.sin(l.t * 4) * .1; l.ring.scale.setScalar(1 + Math.sin(l.t * 3) * .12);
      if (Math.random() < dt * (2 + l.it.rar * 3)) G.fx.motes({ x: l.g.position.x, y: .4, z: l.g.position.z }, RARITY[l.it.rar].color, 1, .15, .8, .06, .7);
      if (!p.alive || G.state !== 'play' || Math.hypot(p.pos.x - l.g.position.x, p.pos.z - l.g.position.z) > 1.2 || p.pos.y > 1) continue;
      if (!G.takeGear(l.it)) { if (!this.fullToast || G.time - this.fullToast > 6) { this.fullToast = G.time; G.hud.toast(`Your pack is full (${PACK}): dismantle gear under Gear`, 'warn'); } continue; }
      this.remove(l);
    }
  }
}
export { itemName, SETS };
