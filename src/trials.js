// The Thornyard: the fae knights' old training ground off the Fae Crossroads, as Nioh 2's Dojo is, where echoes of
// the yard's masters teach every technique of the fight, one trial at a time. The Trial Stone lists the trials;
// choose one, read its lesson, and its sparring knights step into the ring. Each trial asks one thing (a blow from
// each stance, three Deflects, a red thrust met with the Thorn Counter...) and passes the moment it is done. A fall
// only ends the trial: nothing is lost in the yard, and its foes leave nothing. A first pass pays Glimmer and
// Moonpetals, and a pass unhurt a few more petals; the best time is kept. The yard is ordinary level data (as
// src/levels/*.js are), made for the knight's furthest mission so its foes keep pace. main.js runs the runner;
// menu.js shows the Stone.
import * as THREE from 'three';
import { Enemy } from './enemies.js';
import { LEVELS, ORDER } from './levels/index.js';
import { raiseRooms } from './levels/rooms.js';

export const TRIAL_GROUPS = ['First Lessons', 'The Knight\'s Craft', 'Gauntlets'];
export const TRIAL_PAY = [[900, 5], [1600, 8], [3000, 12]];   // a first pass, by group: Glimmer (times the yard's tier) and Moonpetals

// foes: [type, x, z] about the ring's centre (the knight starts south of it, facing north).
// keys: [action, what it does] shown with the lesson. ev: the event counted; on(ev, data, st, G, run): progress.
// needs: 'two' (two weapons carried) or 'art' (a Fae Art). lesson: the foe comes back if felled before the end
// (back(G): what else comes back with it).
export const TRIALS = [
  { id: 'stances', g: 0, name: 'The Three Stances', goal: 'Land a blow from each stance', need: 3, foes: [['yard-post', 0, 3]], lesson: true,
    teach: 'Each stance fights its own way. High hits hardest and breaks poise; Mid is balanced; Low is quick and dashes further. Change stance at any time, even between strikes of a chain. Land a blow from each of the three.',
    keys: [['stance', 'Change stance'], ['light', 'Strike'], ['heavy', 'Strike hard']],
    on: (ev, d, st) => { if (ev !== 'hit') return; (st.s ||= new Set()).add(d.stance); return st.s.size; } },
  { id: 'resonance', g: 0, name: 'Resonance', goal: 'Resonate three times', need: 3, ev: 'resonance', foes: [['yard-post', 0, 3]], lesson: true,
    teach: 'Every strike spends stamina, and blue light gathers about you as a strike ends. Tap Guard in that moment to draw the stamina back: Resonance. Tapped the instant the light flares, it is Perfect, and gives back more. Resonate three times.',
    keys: [['light', 'Strike'], ['pulse', 'Resonance, as the light gathers']] },
  { id: 'deflect', g: 0, name: 'Deflect', goal: 'Deflect three blows', need: 3, ev: 'deflect', foes: [['yard-knight', 0, 4]], lesson: true,
    teach: 'The Yard-Knight cuts slowly and plainly. Tap Guard just as a blow lands to Deflect it: no harm to you, and its poise suffers. Held too early it is only a block, and blocks cost stamina. Deflect three blows.',
    keys: [['guard', 'Guard; tap as the blow lands']] },
  { id: 'flashcut', g: 0, name: 'Flashcut', goal: 'Land two Flashcuts', need: 2, ev: 'flashcut', foes: [['yard-knight', 0, 4]], lesson: true,
    teach: 'Deflect a blow, then strike at once: the Flashcut, one draw-cut that fells ordinary foes outright and bites deep into the rest. Land two.',
    keys: [['guard', 'Deflect'], ['light', 'then strike at once']] },
  { id: 'thorn', g: 0, name: 'Thorn Counter', goal: 'Thorn Counter two red strikes', need: 2, ev: 'thorn', foes: [['yard-thorn', 0, 4]], lesson: true,
    teach: 'A blow that glows red can\'t be guarded. Dash through it, or meet it as it comes with the Thorn Counter: the foe reels, and a Flashcut follows by itself. The Thorn-Knight thrusts red often. Counter two.',
    keys: [['burst', 'Thorn Counter'], ['dodge', 'or dash through']] },
  { id: 'finisher', g: 0, name: 'Chains and Finishers', goal: 'Land two finishers', need: 2, ev: 'finisher', foes: [['yard-post', 0, 3]], lesson: true,
    teach: 'Strike, strike, then strike hard: a chain ends in a finisher, which spends the combo counter for more harm. Standing still and on the move give different chains, and each stance its own. Two strikes in, wait for the glint for a pause combo. Land two finishers.',
    keys: [['light', 'Strike, twice or more'], ['heavy', 'then strike hard']] },
  { id: 'execute', g: 1, name: 'Break and Execute', goal: 'Execute a reeling foe', need: 1, ev: 'execute', foes: [['yard-post', 0, 3]], lesson: true,
    teach: 'Beneath a foe\'s health lies its poise, the white bar. Wear it away (heavy strikes and High stance wear fastest) and the foe reels, open. Strike it then for an Execution. Execute the Sparring Knight.',
    keys: [['heavy', 'Wear its poise down'], ['light', 'Execute while it reels']] },
  { id: 'switch', g: 1, name: 'Switch Strike', goal: 'Land three Switch Strikes', need: 3, ev: 'switch', needs: 'two', foes: [['yard-post', 0, 3]], lesson: true,
    teach: 'You carry two weapons. Switch as a strike ends and the other weapon comes in striking: a Switch Strike, which keeps the chain alive. Land three.',
    keys: [['light', 'Strike'], ['swap', 'Switch as the strike ends']] },
  { id: 'air', g: 1, name: 'Launcher and Starfall', goal: 'Launch a foe, then Starfall', need: 2, foes: [['goblin-scout', -2, 3], ['goblin-scout', 2, 4]], lesson: true,
    teach: 'Hold Guard and strike: a rising cut throws ordinary foes skyward, and the knight can follow. In the air, strike to juggle; strike hard for the Starfall, a plunge that drives everything below into the ground. Launch a goblin, then Starfall.',
    keys: [['guard', 'Hold, and'], ['light', 'strike to launch'], ['heavy', 'in the air: Starfall']],
    on: (ev, d, st) => { if (ev === 'launch') st.l = 1; else if (ev === 'starfall' && st.l) st.s = 1; else return; return (st.l || 0) + (st.s || 0); } },
  { id: 'moonstep', g: 1, name: 'Moonstep', goal: 'Moonstep twice', need: 2, ev: 'moonstep', foes: [['yard-knight', 0, 4]], lesson: true,
    teach: 'Dash at the last instant as a blow comes and you slip it in a Moonstep: the world slows a moment while you don\'t. Strike straight after for a Moonstep Riposte, a blink behind the attacker. Moonstep twice.',
    keys: [['dodge', 'Dash as the blow comes'], ['light', 'then strike: Riposte']] },
  { id: 'shift', g: 1, name: 'Fae Shift', goal: 'Fell the knight while Fae Shifted', need: 1, foes: [['yard-post', 0, 3, .3]], lesson: true,
    back: G => { if (!G.player.shifted) G.player.anima = 100; },   // felled unshifted: it rises, and the Faelight with it
    teach: 'Strikes, Resonance and souls fill Faelight, the violet bar. Full, it lets you Fae Shift: for a while your strikes hit harder, stamina costs little, and your Patron Spirit bursts out about you. Your Faelight is full. Shift, and fell the Sparring Knight before it ends.',
    keys: [['shift', 'Fae Shift']], prep: G => { G.player.anima = 100; },
    on: (ev, d, st, G) => ev === 'kill' && G.player.shifted ? 1 : undefined },
  { id: 'arts', g: 1, name: 'Fae Arts', goal: 'Use two Fae Arts', need: 2, ev: 'art', needs: 'art', foes: [['yard-post', 0, 3]], lesson: true,
    teach: 'Fae Arts are spells and tricks with a few uses each, refilled at a Moonwell: darts, bombs, brands for the blade, snares, veils. Use two on the Sparring Knight; change Arts to try another.',
    keys: [['art', 'Use the Fae Art'], ['artNext', 'Change Arts']] },
  { id: 'three', g: 2, name: 'Three at Once', goal: 'Fell all three goblins', need: 3, foes: [['goblin-scout', -4, 4], ['goblin-spearguard', 0, 6], ['goblin-berserker', 4, 4]],
    teach: 'Three goblins together. Keep them in front of you, strike the one that commits, and never let the berserker\'s leap catch you standing. Fell all three.',
    keys: [['lock', 'Lock on; switch targets'], ['dodge', 'Dash']], on: killsOf },
  { id: 'warband', g: 2, name: 'The Warband', goal: 'Fell the whole warband', need: 5, foes: [['ratman-scout', -5, 3], ['ratman-skirmisher', 5, 3], ['ratman-brute', 0, 7], ['ratman-assassin', -3, 8], ['goblin-archer', 4, 9]],
    teach: 'A warband of five, an archer at the back. Break up the pack, take the archer when you can, and use everything the yard has taught. Fell them all.',
    keys: [['lock', 'Lock on'], ['aim', 'Aim the ranged weapon']], on: killsOf },
  { id: 'master', g: 2, name: 'The Yard-Master', goal: 'Fell Dame Ysolde', need: 1, boss: true, foes: [['yard-master', 0, 6]],
    teach: 'Dame Ysolde kept the yard when there were knights to keep. She fights as you do: chains, red thrusts, a blink and a Flashcut of her own. Show her what the yard taught you.',
    keys: [['guard', 'Deflect'], ['burst', 'Thorn Counter']], on: killsOf },
];
function killsOf(ev, d, st, G, run) { if (ev === 'kill' && run.foes.includes(d.e)) return run.foes.filter(e => !e.alive).length; }
export const trialById = id => TRIALS.find(t => t.id === id);
// Whether the knight can take a trial: some need two weapons, or a Fae Art.
export const trialLock = (T, d) => T.needs === 'two' && (d.arms?.length || 0) < 2 ? 'Carry a second weapon (find one in the missions)' : T.needs === 'art' && !(d.arts?.length) ? 'Find a Fae Art first' : null;
export const trialsPassed = d => TRIALS.filter(T => d.trials?.[T.id]?.n).length;

// ---------------------------------------------------------------- the yard
const RING = { x: 0, z: 8, r: 11 };
export function makeYard(d) {
  const far = ORDER.filter(id => d.unlocked?.includes(id)).pop() || 'keep', F = LEVELS[far];
  return {
    id: 'thornyard', name: 'The Thornyard', yard: true, noGraves: true,
    level: F.level, tier: F.tier || 1, warlord: F.warlord, gatekeeper: F.gatekeeper, seed: 7070,
    forest: true, leaves: true, leafColors: [0xf2b8ff, 0xffe0f0, 0x5a3a6a],
    fog: { color: 0x120e1c, base: .011 }, light: { sky: 0xc0a8e0, ground: 0x18121c, hemi: 1.45, moonColor: 0xecdcff, moon: 2 },
    moon: { at: [-60, 110, 300], glow: 120, size: 16 }, enemyGlow: .12, motes: { base: 0xf2b8ff },
    areas: [{ id: 'yard', name: 'The Thornyard', x0: -18, x1: 18, z0: -16, z1: 26 }],
    shrines: { yard: { id: 'yard', name: 'Moonwell of the Thornyard', x: -6, z: -11, spawn: [-3.4, -9], yaw: 0 } },
    spawns: [], adds: [], boss: [], items: [], letters: [], pixies: [],
    messages: [{ x: 1, z: -7, text: 'The Thornyard: where the fae knights learned the fight, when there were fae knights to learn it. Read the Trial Stone to begin a trial. A fall here costs nothing, and the yard\'s foes leave nothing.' }],
    seal: { x: 0, z: -600, yaw: 0, width: 4, height: 4, inside: [0, -604] }, exit: { x: 0, z: -640 },
    stone: { x: 5, z: -11 }, ring: RING, trialStart: [RING.x, RING.z - 7],
    build(w, R) { buildYard(w, R, this); },
  };
}

function buildYard(w, R, L) {
  const M = w.mats, g = w.group;
  M.palestone = w.cutout(new THREE.MeshStandardMaterial({ map: M.pillar.map, normalMap: M.pillar.normalMap, color: 0xdcd4e4, roughness: .9 }));
  M.rose = new THREE.MeshStandardMaterial({ color: 0xd07ab8, emissive: 0x3a0a2a, roughness: .8, flatShading: true });
  w.floor(-60, -50, 60, 70, 'earth', 6, -.01);
  w.floor(-18, -16, 18, 26, 'floor', 4, 0);
  M.ring = M.floor.clone(); M.ring.color.setHex(0xd4cce0); M.ring.emissive = new THREE.Color(0x0c0a14);   // the ring: paler flagstones
  w.disc(RING.x, RING.z, RING.r, 'ring', 3.2);
  const yard = { x0: -18, x1: 18, z0: -16, z1: 26, doors: [] };
  raiseRooms(w, [yard], [], { edge: 'thorn', h: 4.4 });
  // Roses along the hedges, braziers of rose fire about the ring, and the old masters' posts at the edges.
  for (let i = 0; i < 150; i++) {
    const side = Math.floor(R() * 4), x = side < 2 ? -18 + R() * 36 : side === 2 ? -17.6 : 17.6, z = side >= 2 ? -16 + R() * 42 : side === 0 ? -15.6 : 25.6;
    const b = w.rock(.2 + R() * .12, Math.floor(R() * 999), .3); b.translate(x, .6 + R() * 2.6, z); w.batch('rose', b);
  }
  for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * Math.PI * 2; w.brazier(RING.x + Math.sin(a) * (RING.r + 1.6), RING.z + Math.cos(a) * (RING.r + 1.6), 0xf2b8ff, true, .9); }
  for (const [x, z] of [[-14, 0], [14, 0], [-14, 16], [14, 16], [-12, 23], [12, 23]]) w.pillar(x, z, .55, 3.2 + R() * 1.4, R() < .3, 'palestone');
  w.tree(-15, -13, 6, 11); w.tree(15, 23, 7, 12);
  // The Trial Stone: a slab of pale stone, a crescent of rose light on its face.
  const S = L.stone;
  const slab = new THREE.BoxGeometry(1.5, 2.8, .55); slab.translate(S.x, 1.4, S.z); w.batch('palestone', slab);
  const cap2 = new THREE.BoxGeometry(1.5, .3, .6); cap2.translate(S.x, 2.95, S.z); w.batch('palestone', cap2);
  const rune = new THREE.Mesh(new THREE.RingGeometry(.28, .4, 24, 1, -1.2, 2.4 + Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf2b8ff, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  rune.position.set(S.x, 1.9, S.z - .29); rune.rotation.y = Math.PI;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: w.glowTex, color: 0xf2b8ff, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.position.set(S.x, 1.9, S.z - .5); glow.scale.setScalar(1.8);
  g.add(rune, glow);
  w.anim.push(t => { rune.material.opacity = .7 + Math.sin(t * 2.1) * .2; glow.material.opacity = .45 + Math.sin(t * 2.1) * .12; });
  w.addBox(S.x, S.z, .8, .32, 0, 3.2);
  w.interactables.push({ kind: 'trials', x: S.x, z: S.z - 1, r: 2.2, prompt: 'Read the Trial Stone' });
}

// ---------------------------------------------------------------- the runner
export class Trials {
  constructor(G) { this.G = G; this.run = null; this.gen = 0; }

  // Begin a trial: its knights step into the ring, the knight stands ready, and the lesson is read first.
  async start(id) {
    const G = this.G, T = trialById(id), L = G.level, d = G.save.data;
    if (!T || !L.yard || trialLock(T, d)) return false;
    this.clear();
    const run = this.run = { T, n: 0, st: {}, t0: 0, hurt: false, foes: [], woke: false, done: false, gen: ++this.gen, back: [] };
    const foes = await Promise.all(T.foes.map(([type, x, z, hp], i) => Enemy.create(G, { id: `trial${i}`, type, x: L.ring.x + x, z: L.ring.z + z, yaw: Math.PI, noChamp: true, elite: T.boss ? 'boss' : undefined, hpK: hp })));
    if (this.run !== run) { for (const e of foes) e.dispose(); return false; }
    run.foes = foes;
    for (const e of foes) { e.reset(); if (e.spawn.hpK) { e.maxHp = Math.round(e.maxHp * e.spawn.hpK); e.hp = e.maxHp; } G.enemies.push(e); }
    const p = G.player;
    p.spawnAt(L.trialStart[0], L.trialStart[1], 0); p.lock = null;
    p.hp = p.maxHp; p.ki = p.maxKi; p.elixirs = G.save.elixirMax; p.poisoned = 0; p.poison = 0; p.thaw?.(); p.refillAmmo?.();
    G.cam.snap(p);
    T.prep?.(G, run);
    this.show();
    const keys = T.keys.map(([a, what]) => `${G.hud.key(a)} — ${what}`).join('\n');
    G.hud.message(`${T.name.toUpperCase()}\n\n${T.teach}\n\n${keys}`);
    G.audio.sfx('page');
    return true;
  }

  show() { const r = this.run; if (r) this.G.hud.objective(`Trial · ${r.T.name}`, `${r.T.goal} · ${Math.min(r.n, r.T.need)} / ${r.T.need}`); }

  // The trial's knights wake once the lesson is closed; a lesson's knight comes back if felled too soon.
  update(dt) {
    const G = this.G, run = this.run;
    if (!run || run.done) return;
    if (!run.woke) {
      if (G.hud.messageOpen || G.menu.open) return;
      run.woke = true; run.t0 = G.time;
      for (const e of run.foes) { e.alert(); e.state = 'engage'; e.st = 0; e.think = .4; }
      if (run.T.boss) { G.hud.setBoss(run.foes[0]); G.bossFight = true; G.audio.music('boss'); }
    }
    for (const b of run.back) b.t -= dt;
    for (let i = run.back.length - 1; i >= 0; i--) {
      const b = run.back[i]; if (b.t > 0) continue;
      run.back.splice(i, 1); b.e.reset(); if (b.e.spawn.hpK) { b.e.maxHp = Math.round(b.e.maxHp * b.e.spawn.hpK); b.e.hp = b.e.maxHp; }
      b.e.alert(); b.e.state = 'engage'; run.T.back?.(G);
      G.fx.ring(b.e.pos, 0xf2b8ff, 2.4, .4); G.audio.sfx('shift', { pitch: 1.4, vol: .4 });
    }
  }

  // Everything the knight does comes through here (G.did); a trial counts what it asks for.
  on(ev, data = {}) {
    const G = this.G, run = this.run;
    if (!run || run.done || !run.woke) return;
    if (ev === 'hurt') { run.hurt = true; return; }
    const T = run.T;
    if (ev === 'kill' && T.lesson && run.foes.includes(data.e)) run.back.push({ e: data.e, t: 1.6 });
    let n = run.n;
    if (T.on) { const r = T.on(ev, data, run.st, G, run); if (typeof r === 'number') n = r; }
    else if (ev === T.ev) n++;
    if (n === run.n) return;
    run.n = Math.min(T.need, n);
    this.show();
    G.audio.sfx('glint', { vol: .7 });
    if (run.n >= T.need) this.pass();
  }

  pass() {
    const G = this.G, run = this.run, T = run.T, d = G.save.data, rec = (d.trials ||= {})[T.id] ||= { n: 0 };
    run.done = true;
    const t = Math.max(0, G.time - run.t0), first = !rec.n, unhurtFirst = !run.hurt && !rec.unhurt;
    rec.n++; if (!run.hurt) rec.unhurt = true; rec.best = Math.min(rec.best ?? Infinity, Math.round(t * 10) / 10);
    const [gl, pt] = TRIAL_PAY[T.g], glim = first ? Math.round(gl * (G.level.tier || 1)) : 0, petals = (first ? pt : 0) + (unhurtFirst ? 3 : 0);
    if (glim) { G.save.glimmer += glim; G.hud.addGlimmer(glim); }
    G.tally('trials', trialsPassed(d), true);
    for (const e of run.foes) if (e.alive) { e.endAttack(); e.state = 'idle'; e.st = 0; }
    G.after(1.3, () => this.dismiss(run));   // the echoes bow out
    G.slowmo = Math.max(G.slowmo, .6);
    G.after(.5, () => { G.hud.big('TRIAL PASSED', 'gold', 3.4, `${T.name} · ${t.toFixed(1)}s${run.hurt ? '' : ' · unhurt'}`); G.audio.sfx('felled'); });
    if (petals) G.after(1.6, () => G.addPetals(petals));
    if (glim) G.after(1.2, () => G.hud.toast(`First pass · ${glim.toLocaleString()} Glimmer`, 'item'));
    if (trialsPassed(d) === TRIALS.length && first) G.after(3, () => G.hud.toast('Every trial of the Thornyard passed. Dame Ysolde would be proud.', 'anima'));
    G.save.write();
    G.after(3.6, () => { if (this.run !== run) return; this.clear(); this.toStone(); G.menu.show('trials', { focus: TRIALS[TRIALS.indexOf(T) + 1]?.id || T.id }); G.input.wantLock = false; G.input.releaseLock(); });
  }

  // A fall ends the trial (main.js wakes the knight at the Moonwell, nothing lost).
  fail(why) {
    const run = this.run; if (!run || run.done) return false;
    run.done = true;
    this.G.after(.6, () => this.G.hud.big('TRIAL FAILED', 'died', 3, why));
    return true;
  }

  // Stand before the Stone.
  toStone() { const G = this.G, S = G.level.stone; if (!S) return; G.player.spawnAt(S.x - .4, S.z - 2.6, Math.PI); G.cam.snap(G.player); }

  // Send the trial's knights away (the run stays until clear()).
  dismiss(run) {
    const G = this.G;
    for (const e of run.foes) {
      if (e.disposed) continue;
      if (e.alive) { G.fx.ring(e.pos, 0xf2b8ff, 2.2, .45); G.fx.motes({ x: e.pos.x, y: 1, z: e.pos.z }, 0xf2b8ff, 20, .6, 2, .1, 1); }
      e.disposed = true;
      const i = G.enemies.indexOf(e); if (i >= 0) G.enemies.splice(i, 1);
      const b = G.hud.bars.get(e); if (b) { b.remove(); G.hud.bars.delete(e); }
      if (G.player.lock === e) G.player.lock = null;
      e.dispose();
    }
    run.foes = [];
  }
  clear() {
    const G = this.G, run = this.run;
    this.run = null;
    if (!run) return;
    this.dismiss(run);
    if (run.T.boss) { G.hud.setBoss(null); G.bossFight = false; G.audio.music('explore'); }
    G.hud.objective(null);
  }
}
