// The flagship bosses: Gnawfang (the first warlord anyone meets), the Waning Queen (the second act's end) and the
// Eclipse (the last). Each makes an entrance (the camera turns to it, the screen letterboxes, its name is
// written across the dark) and fights in three phases: its own second, then at three tenths of its health a
// third, with new blows (a grab among them), its arena changing about the fight, and its music rising.
//   Gnawfang: the Warren Answers. Ratmen pour out of the arena's walls, and plague pools well up where you stand.
//   The Waning Queen: Moonfall. Pillars of moonlight fall where you stand and near it, marked a moment before.
//   The Eclipse: Totality. The arena goes dark but for three pools of light that move; out of them, the dark gnaws.
// main.js starts the entrance and the third phase and calls update(); enemies.js picks the third phase's blows.
import * as THREE from 'three';
import { Enemy, TYPES } from './enemies.js';
import { yawTo, rand } from './util.js';

const S = (anim, windup, active, recover, dmg, o = {}) => ({ anim, windup, active, recover, dmg, reach: 2, arc: 100, lunge: 0, ...o });
const A = (name, range, steps, o = {}) => ({ name, range, steps, minRange: 0, w: 1, cd: 0, ...o });

export const FLAGSHIPS = {
  'ratman-warblade': {
    level: 'keep', title: 'Gnawfang', sub: 'Warblade of the Warren · Lord of the Grubhold', arena: { x: 0, z: 135, r: 14 },
    music: { k: 1, bpm: 156 }, phase3Line: 'The Warren answers its lord', kind: 'swarm',
    phase3: [
      A('The Warren Answers', 30, [S('roar', 1.3, .6, .6, 0, { hyper: true })], { once: true }),
      A('Gnaw and Shake', 3.2, [S('thrust', .75, .24, 1.1, 150, { reach: 3.2, arc: 70, lunge: 3, burst: true, grab: { hold: 1.5 } })], { cd: 8, w: 1.1 }),
      A('Bone Rain', 16, [S('throw', .8, .15, .8, 70, { proj: { kind: 'knife', speed: 16, count: 7 } })], { minRange: 4, cd: 6, w: .8 }),
    ],
  },
  queen: {
    level: 'court', title: 'The Waning Queen', sub: 'She Who Would Have the Moon Wane', arena: { x: 0, z: 190, r: 13 },
    music: { k: 1.335, bpm: 138, choir: true }, phase3Line: 'The Queen calls the moon down on you', kind: 'moonfall',
    phase3: [
      A('Moonfall', 30, [S('roar', 1.3, .7, .7, 0, { hyper: true })], { once: true }),
      A('Queen\'s Embrace', 12, [S('cast', .35, .08, .05, 0, { blink: true, behind: true, kact: 'dash' }), S('thrust', .45, .24, 1.1, 170, { reach: 3.2, arc: 80, lunge: 2.4, burst: true, grab: { hold: 1.5 } })], { cd: 9, w: 1 }),
      A('New Moon Waltz', 3.6, [
        S('swing', .28, .14, .03, 110, { reach: 3.6, arc: 170, lunge: 1.2, kact: 'rg_arc' }),
        S('swing', .2, .14, .03, 110, { reach: 3.6, arc: 170, lunge: 1.2, kact: 'rg_back' }),
        S('swing', .2, .14, .03, 116, { reach: 3.6, arc: 170, lunge: 1.2, kact: 'rg_triple' }),
        S('spin', .34, .5, 1.1, 150, { reach: 3.8, arc: 360, kact: 'rg_orbit' }),
      ], { w: 1.2 }),
    ],
  },
  eclipse: {
    level: 'heart', title: 'The Eclipse', sub: 'That Eats the Moon', arena: { x: 0, z: 190, r: 13 },
    music: { k: .89, bpm: 168, choir: true, heavy: true }, phase3Line: 'Totality: every light goes out but three', kind: 'totality',
    phase3: [
      A('Totality', 30, [S('roar', 1.4, .8, .7, 0, { hyper: true })], { once: true }),
      A('Devour', 3.6, [S('thrust', .7, .26, 1.2, 210, { reach: 3.6, arc: 80, lunge: 3.4, burst: true, grab: { hold: 1.6 } })], { cd: 9, w: 1.1 }),
      A('Black Harvest', 20, [S('cast', 1, .3, .9, 110, { proj: { kind: 'orb', count: 16, speed: 8, ring: true } })], { cd: 7, w: .9 }),
    ],
  },
};
// Each flagship's third-phase blows join its type (enemies.js pickAttack reads T.phase3).
for (const [id, F] of Object.entries(FLAGSHIPS)) if (TYPES[id]) { TYPES[id].phase3 = F.phase3; TYPES[id].flagship = true; }
// A flagship fights as one only in its own mission's arena (a Twilight or Hunt there included), not in the Underbriar.
export const flagshipOf = (e, G) => { const F = e && FLAGSHIPS[e.spawn?.type]; return F && G?.level?.id === F.level ? F : null; };
export const PHASE3_AT = .3;

export class Flagships {
  constructor(G) { this.G = G; this.boss = null; this.cine = null; this.run = null; this.adds = []; this.pools = []; }

  // The entrance: a turn of the camera about it, bars across the screen, and its name.
  begin(boss) {
    const G = this.G, F = flagshipOf(boss, G);
    if (!F) return false;
    this.clear();
    this.boss = boss;
    const dur = 3.4;
    this.cine = { t: 0, dur };
    boss.introDur = dur;
    G.cam.cinema(boss, dur);
    G.hud.cine(true);
    G.after(.5, () => G.hud.big(F.title, 'flag', 2.8, F.sub));
    G.audio.music('boss', F.music);
    if (F.kind === 'swarm') this.prepare(boss);
    return true;
  }

  // The Warren's three ratmen are made while their lord makes its entrance, and wait out of sight.
  async prepare(boss) {
    const G = this.G;
    for (let i = 0; i < 3; i++) {
      const e = await Enemy.create(G, { id: 'warren' + i, type: 'ratman-scout', x: boss.pos.x, z: boss.pos.z, yaw: 0, warren: true, noChamp: true });
      if (this.boss !== boss) { e.dispose(); return; }
      e.reset(); e.kill();
      this.adds.push(e); G.enemies.push(e);
    }
  }

  // Three tenths of its health gone: the third phase, and the arena turns against you.
  phase3(boss) {
    const G = this.G, F = flagshipOf(boss, G);
    if (!F || this.run) return;
    this.run = { kind: F.kind, t: 0, next: 1.5, F, boss };
    G.hud.toast(F.phase3Line, 'warn');
    G.audio.music('boss', { ...F.music, intense: true });
    G.cam.shake(.8);
    if (F.kind === 'totality') {
      G.darkT = 1;   // main.js darkens the fog, post.js the grade
      const at = F.arena;
      for (let i = 0; i < 3; i++) this.pools.push(this.makePool(at.x + Math.sin(i / 3 * Math.PI * 2) * 8, at.z + Math.cos(i / 3 * Math.PI * 2) * 8));
      if (!G.save.data.totalityTip) { G.save.data.totalityTip = true; G.after(1.5, () => G.hud.toast('The dark gnaws: stand in the light', 'warn')); }
    }
  }

  update(dt, rdt) {
    const G = this.G;
    if (this.cine) {
      this.cine.t += rdt;
      if (this.cine.t >= this.cine.dur) { this.cine = null; G.hud.cine(false); }
    }
    const R = this.run;
    if (!R || !G.bossFight || dt <= 0) return;
    const b = R.boss, p = G.player, at = R.F.arena;
    if (!b.alive) return this.clear(false);   // its Warren's rats die with it (main.js); they go at the next reset
    R.t += dt; R.next -= dt;
    if (R.kind === 'swarm' && R.next <= 0) {
      // Ratmen out of the walls, three at most; and plague welling up where the knight stands.
      R.next = 6.5;
      this.rat(at);
      for (const q of [p.pos, { x: p.pos.x + rand(-5, 5), z: p.pos.z + rand(-5, 5) }]) {
        const x = q.x, z = q.z;
        G.fx.telegraph({ x, z }, 2.2, 1, 0x8fe040);
        G.after(1, () => G.projectiles.hazard(x, z, 2.2, 7, 55));
      }
    }
    if (R.kind === 'moonfall' && R.next <= 0) {
      // Moonlight falls: where the knight stands, and near it.
      R.next = 3.1;
      const pts = [{ x: p.pos.x, z: p.pos.z }, ...[0, 1].map(() => ({ x: p.pos.x + rand(-6, 6), z: p.pos.z + rand(-6, 6) }))];
      for (const q of pts) {
        G.fx.telegraph(q, 2.4, 1.1, 0xdff0ff);
        G.after(1.1, () => this.moonbeam(q, b));
      }
    }
    if (R.kind === 'totality') {
      // The pools drift to new places now and then; outside them the dark gnaws.
      if (R.next <= 0) {
        R.next = 10;
        for (const pl of this.pools) { const a = rand(0, Math.PI * 2), r = rand(3, at.r - 2); pl.to = { x: at.x + Math.sin(a) * r, z: at.z + Math.cos(a) * r }; }
      }
      let lit = false;
      for (const pl of this.pools) {
        if (pl.to) { pl.m.position.x += (pl.to.x - pl.m.position.x) * Math.min(1, dt * 1.2); pl.m.position.z += (pl.to.z - pl.m.position.z) * Math.min(1, dt * 1.2); }
        pl.beam.position.set(pl.m.position.x, 3, pl.m.position.z);
        pl.m.material.opacity = .3 + Math.sin(G.time * 3 + pl.m.position.x) * .05;
        if (Math.hypot(p.pos.x - pl.m.position.x, p.pos.z - pl.m.position.z) < 3.2) lit = true;
      }
      if (!lit && p.alive && G.state === 'play' && !p.iframes) {
        p.hp -= p.maxHp * .02 * dt;
        if (Math.random() < dt * 10) G.fx.motes({ x: p.pos.x, y: 1, z: p.pos.z }, 0x3a2a4a, 1, .4, .8, .1, .8);
        if (p.hp <= 0) p.fall();
      }
      this.lit = lit;
    }
  }

  // A ratman out of the arena's wall (the same three come again when felled).
  rat(at) {
    const G = this.G, a = rand(0, Math.PI * 2), x = at.x + Math.sin(a) * (at.r - .5), z = at.z + Math.cos(a) * (at.r - .5);
    const e = this.adds.find(o => !o.alive && o.fadeT > 2 || !o.active);
    if (!e) return;
    e.spawn.x = x; e.spawn.z = z; e.reset(); e.pos.set(x, 0, z); e.yaw = yawTo(x, z, at.x, at.z);
    e.alert(); e.state = 'engage'; e.think = .4;
    G.fx.dust(e.pos, 16); G.audio.sfx('squeal', { x, z });
  }

  moonbeam(q, b) {
    const G = this.G, p = G.player;
    if (!this.run) return;
    const at = new THREE.Vector3(q.x, 0, q.z);
    for (const y of [.5, 3, 6, 9]) G.fx.flash(at.clone().setY(y), 0xdff0ff, 3.4, .45, true);
    G.fx.ring(at, 0xdff0ff, 3, .5); G.audio.sfx('storm', { x: q.x, z: q.z, vol: .7 }); G.cam.shake(.25, at);
    if (p.alive && Math.hypot(p.pos.x - q.x, p.pos.z - q.z) < 2.4 + p.radius)
      p.receiveHit({ dmg: 95 * b.dmgMul * (G.diff?.dmg ?? 1), from: b, heavy: true, aoe: true, hyper: true, dirYaw: yawTo(p.pos.x, p.pos.z, q.x, q.z) });
  }

  makePool(x, z) {
    const G = this.G;
    const m = new THREE.Mesh(new THREE.CircleGeometry(3.2, 40), new THREE.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, .03, z);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.2, 6, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.set(x, 3, z);
    G.scene.add(m, beam);
    return { m, beam };
  }

  // The fight over, lost or left: the arena as it was (and, but at the boss's fall, its rats gone).
  clear(adds = true) {
    const G = this.G;
    if (this.cine) G.cam?.cinema(null);
    this.run = null; this.cine = null; this.boss = null;
    G.hud?.cine(false);
    G.darkT = 0;
    for (const pl of this.pools) { G.scene.remove(pl.m, pl.beam); pl.m.geometry.dispose(); pl.m.material.dispose(); pl.beam.geometry.dispose(); pl.beam.material.dispose(); }
    this.pools = [];
    if (!adds) { for (const e of this.adds) if (e.alive) e.die({}); return; }
    for (const e of this.adds) { const i = G.enemies.indexOf(e); if (i >= 0) G.enemies.splice(i, 1); const hb = G.hud?.bars.get(e); if (hb) { hb.remove(); G.hud.bars.delete(e); } e.dispose(); }
    this.adds = [];
  }
}
