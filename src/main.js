// PixieLords: a stance-based fae action game in the browser. Boot, game loop and the rules that tie the
// systems together (Moonwells, souls and the Echo, the Gatewarden's portcullis, the Briar Seal and the boss).
import * as THREE from 'three';
import { Input } from './input.js';
import { Audio } from './audio.js';
import { World, CUT } from './world.js';
import { LEVELS, ORDER } from './levels/index.js';
import { Player } from './player.js';
import { buildKnight, KnightAnimator } from './knight.js';
import { Enemy, Projectiles } from './enemies.js';
import { FX } from './fx.js';
import { HUD } from './hud.js';
import { Menu } from './menu.js';
import { CameraRig } from './camera.js';
import { Save, levelCost, loadSettings, saveSettings } from './save.js';
import { loadModel } from './models3d.js';
import { glowTexture } from './textures.js';
import { clamp, damp, rand } from './util.js';

const G = { time: 0, hitstop: 0, slowmo: 0, enemies: [], controlsOn: false, attackTokens: 0, state: 'boot', ready: false, ngMul: 1, LEVELS, ORDER };
window.__pl = G;
G.touchOnly = matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches;

// Game-time timers: they pause with the game and stretch with slow motion.
const timers = [];
G.after = (sec, fn) => timers.push({ t: G.time + sec, fn });
function runTimers() {
  for (let i = timers.length - 1; i >= 0; i--) if (G.time >= timers[i].t) { const f = timers[i].fn; timers.splice(i, 1); f(); }
}

// ---------------------------------------------------------------- renderer & scene
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0d1122, .026);
scene.background = new THREE.Color(0x0d1122);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 900);
Object.assign(G, { renderer, scene, camera });

const hemi = new THREE.HemisphereLight(0x7d8fc4, 0x2a2016, 1.35);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0xb4c4ff, 1.9);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 120 });
moon.shadow.bias = -.0006; moon.shadow.normalBias = .03;
scene.add(moon, moon.target);

// A small studio environment so steel and gold have something to reflect.
function makeEnv() {
  const env = new THREE.Scene();
  const geo = new THREE.SphereGeometry(10, 32, 16), col = [], pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 10;
    const c = y > 0 ? new THREE.Color(0x2a3558).lerp(new THREE.Color(0x8ea4d8), y) : new THREE.Color(0x2a3558).lerp(new THREE.Color(0x3a2a1c), -y);
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  env.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  for (const [x, y, z, c, s] of [[4, 6, 3, 0xdfe8ff, 4], [-6, 2, -4, 0xff9a50, 3], [0, -5, 6, 0x6fe8ff, 2]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
  }
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(env, .02).texture;
  pm.dispose();
  return tex;
}

// ---------------------------------------------------------------- systems
G.settings = loadSettings();
G.save = new Save();
G.input = new Input(canvas);
G.audio = new Audio();
G.fx = new FX(scene);
G.level = LEVELS[G.save.data.mission] || LEVELS.keep;
G.world = new World(G, G.level);
G.cam = new CameraRig(camera, G.world);
G.hud = new HUD(G);
G.menu = new Menu(G);
G.projectiles = new Projectiles(G);
G.player = new Player(G);
const envTex = makeEnv();
for (const m of Object.values(G.player.k.mats)) if (m.isMeshStandardMaterial) { m.envMap = envTex; m.envMapIntensity = .9; }

G.setSetting = (k, v) => {
  G.settings[k] = v; saveSettings(G.settings); applySettings();
};
function applySettings() {
  const s = G.settings;
  G.input.sens = s.sens; G.input.invertY = s.invertY;
  G.audio.setVolume('master', s.master); G.audio.setVolume('music', s.music); G.audio.setVolume('sfx', s.sfx);
  G.shakeScale = s.shake;
  const hi = !!s.quality;
  renderer.setPixelRatio(hi ? Math.min(devicePixelRatio, 1.75) : Math.min(devicePixelRatio, 1));
  moon.castShadow = hi;
  if (G.world) G.world.lightPool.forEach((l, i) => { l.visible = hi || i < 3; });
  if (G.fx) resize();
}
applySettings();
const shake = G.cam.shake.bind(G.cam);
G.cam.shake = (a, at) => shake(a * (G.shakeScale ?? 1), at);

// Your Echo: a kneeling ghost of the knight that holds lost Glimmer until you reach it.
const grave = new THREE.Group();
const echo = buildKnight(), echoAnim = new KnightAnimator(echo);
{
  const mat = new THREE.MeshBasicMaterial({ color: 0x8dff9a, transparent: true, opacity: .32, blending: THREE.AdditiveBlending, depthWrite: false });
  echo.root.traverse(o => { if (o.isMesh) { o.material = mat; o.castShadow = false; } if (o.isSprite) o.visible = false; });
  echoAnim.play('rest');
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x9dff9a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .6 }));
  glow.scale.set(1.6, 2.8, 1); glow.position.y = 1;
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(.12), new THREE.MeshBasicMaterial({ color: 0xcfffc0 }));
  core.position.y = 1.9; grave.add(echo.root, glow, core); grave.userData.core = core;
  grave.visible = false; scene.add(grave);
}


// ---------------------------------------------------------------- loading
// The level look: fog, sky tint and moonlight.
function applyLevelLook() {
  const L = G.level, lt = L.light || {};
  scene.fog.color.setHex(L.fog.color); scene.background.setHex(L.fog.color); scene.fog.density = L.fog.base;
  hemi.color.setHex(lt.sky ?? 0x7d8fc4); hemi.groundColor.setHex(lt.ground ?? 0x2a2016); hemi.intensity = lt.hemi ?? 1.35;
  moon.color.setHex(lt.moonColor ?? 0xb4c4ff); moon.intensity = lt.moon ?? 1.9;
}

async function loadEnemies() {
  const L = G.level, all = [...L.spawns, ...(L.adds || [])];
  const types = [...new Set(all.map(s => Enemy.modelFor(s.type)))];
  let done = 0;
  G.loadProgress = 0;
  await Promise.all(types.map(t => loadModel(t).then(() => { done++; G.loadProgress = done / types.length; if (G.menu.top?.screen === 'title') G.menu.render(); })));
  G.enemies = await Promise.all(all.map(s => Enemy.create(G, s)));
  for (const e of G.enemies) if (e.spawn.add) e.kill();
  G.boss = G.enemies.find(e => e.id === L.boss);
  G.gatekeeper = L.gate ? G.enemies.find(e => e.id === L.gate.guardian) : null;
}

// Swap in another mission's world and foes.
async function setLevel(id) {
  const L = LEVELS[id] || LEVELS.keep;
  if (G.level === L && G.enemies.length) return;
  G.loading = true;
  if (G.level !== L) {
    for (const e of G.enemies) e.dispose();
    G.enemies = [];
    G.projectiles.clear();
    G.world.dispose();
    G.level = L;
    G.world = new World(G, L);
    G.cam.world = G.world;
    applySettings();
  }
  applyLevelLook();
  await loadEnemies();
  G.loading = false;
}

async function load() {
  applyLevelLook();
  await loadEnemies();
  G.ready = true;
  if (G.menu.top?.screen === 'title') { titleScene(); G.menu.render(); }
}

// ---------------------------------------------------------------- flow
function applyWorldState() {
  const d = G.save.data, m = G.save.m, L = G.level;
  G.player.lock = null;
  G.ngMul = 1 + d.ng * .5;
  for (const e of G.enemies) {
    e.reset();
    if (e.spawn.add || m.dead.includes(e.id)) e.kill();
  }
  if (L.gate) { if (m.dead.includes(L.gate.guardian)) G.world.openPortcullis(true); else G.world.closePortcullis(); }
  const bossDead = m.dead.includes(L.boss);
  G.world.setFogGate(!bossDead);
  G.world.setExit(bossDead);
  for (const it of G.world.interactables) if (it.kind === 'item') G.world.setItemTaken(it.id, m.items.includes(it.id));
  for (const s of Object.values(L.shrines)) s.fx.lit = m.kindled.includes(s.id) ? 1 : 0;
  G.projectiles.clear();
  for (const h of L.hazards || []) G.projectiles.hazard(h.x, h.z, h.r, Infinity, h.poison ?? 45, h.kind, true);
  G.attackTokens = 0;
  G.bossFight = false;
  G.hud.setBoss(null);
  updateGrave();
}

G.updateGrave = () => updateGrave();
function updateGrave() {
  const g = G.save.data.grave;
  grave.visible = !!g && g.mission === G.level.id;
  if (g) grave.position.set(g.x, 0, g.z);
}

function firstShrine() { return G.level.titleShrine || Object.keys(G.level.shrines)[0]; }
function placeAtShrine(id) {
  const s = G.level.shrines[id] || G.level.shrines[firstShrine()];
  const p = G.player;
  p.stats = { ...G.save.stats }; p.applyStats();
  p.arms = [...(G.save.data.arms || ['sword'])]; p.setWeapon(G.save.data.wield || 'sword');
  p.spawnAt(s.spawn[0], s.spawn[1], s.yaw);
  p.elixirs = G.save.elixirMax;
  G.cam.snap(p);
}

async function startRun() {
  G.audio.init();
  G.traveling = false;
  timers.length = 0;
  if (G.level.id !== G.save.data.mission || !G.enemies.length) {
    G.hud.fadeTo(true, .3); G.menu.close(); G.hud.loading(true);
    await setLevel(G.save.data.mission);
    G.hud.loading(false);
  }
  const m = G.save.m;
  if (!m.shrine) { m.shrine = firstShrine(); m.kindled.push(m.shrine); }
  applyWorldState();
  placeAtShrine(m.shrine);
  G.player.anima = 0;
  G.player.setState('rise'); G.player.anim.play('rise');
  G.state = 'play'; G.controlsOn = true;
  G.menu.close();
  G.hud.show(true);
  G.hud.fadeTo(false, 1.2);
  G.audio.music('explore');
  G.lastArea = null;
  G.input.wantLock = true; G.input.requestLock();
}

// A mission's opening line, shown once as you set out.
function missionIntro() { if (G.level.intro) G.after(1.2, () => G.hud.big(G.level.intro, 'intro', 5.5)); }
G.newGame = async () => { G.save.reset(); G.save.write(); await startRun(); missionIntro(); };
G.continueGame = () => startRun();
G.startMission = async id => {
  const d = G.save.data, fresh = !G.save.mission(id).shrine;
  d.mission = id; G.save.write();
  await startRun();
  if (fresh) missionIntro();
};
G.newGamePlus = async () => {
  const d = G.save.data;
  const keep = { stats: d.stats, glimmer: d.glimmer, elixirMax: d.elixirMax, deaths: d.deaths, time: d.time, ng: d.ng + 1, charms: d.charms, equipped: d.equipped, arms: d.arms, wield: d.wield };
  G.save.reset(d.ng + 1);
  Object.assign(G.save.data, keep);
  G.save.write();
  await startRun(); missionIntro();
};

G.quitToTitle = () => {
  timers.length = 0;
  if (G.state === 'play' || G.state === 'dead') G.save.write();
  G.state = 'title'; G.controlsOn = false;
  G.hud.show(false); G.hud.setBoss(null);
  G.audio.music('none');
  G.input.wantLock = false; G.input.releaseLock();
  titleScene();
  G.menu.show('title');
};

G.onMenuClosed = () => {
  if (G.state === 'play' && G.player.state !== 'rest') { G.controlsOn = true; G.input.wantLock = true; G.input.requestLock(); }
};

function titleScene() {
  applyWorldStateSafe();
  const s = G.level.shrines[firstShrine()];
  G.player.spawnAt(s.spawn[0], s.spawn[1] - .4, Math.PI);
  G.player.setState('rest'); G.player.anim.play('rest');
  s.fx.lit = 1;
}
function applyWorldStateSafe() { if (G.ready) applyWorldState(); }

// ---------------------------------------------------------------- events from the systems
G.onEnemyKilled = (e, hit = {}) => {
  // A Flashcut kill yields half again as much Glimmer.
  const amt = Math.round(e.T.glimmer * G.ngMul * (hit.flash ? 1.5 : 1));
  G.save.glimmer += amt;
  G.hud.addGlimmer(amt);
  const p = G.player, at = { x: e.pos.x, y: e.height * .5, z: e.pos.z }, to = () => ({ x: p.pos.x, y: 1.1, z: p.pos.z });
  G.fx.wisps(at, Math.min(24, 4 + Math.round(amt / 60)), to, () => G.audio.sfx('glimmer', { vol: .5 }));
  // Souls: green motes mend, violet motes feed Faelight. They wait where they fell until you come close.
  const big = e.boss ? 3 : e.elite ? 2 : 0;
  const life = big ? 4 * big : (Math.random() < .6 ? 1 : 0) + (hit.flash ? 1 : 0), fae = big ? 3 * big : Math.random() < .5 ? 1 : 0;
  G.fx.wisps(at, life, to, () => { p.heal(p.maxHp * .04); G.audio.sfx('glimmer', { vol: .4 }); }, 0x7dff8a, { range: 6, hover: 14, size: .24 });
  G.fx.wisps(at, fae, to, () => { p.gainAnima(5); G.audio.sfx('glimmer', { vol: .4 }); }, 0xc08cff, { range: 6, hover: 14, size: .22 });
  if (e === G.boss) bossDefeated();
  else if (e === G.gatekeeper) gatekeeperDefeated();
};

function gatekeeperDefeated() {
  const gt = G.level.gate;
  G.save.m.dead.push(gt.guardian);
  G.save.write();
  G.slowmo = .9;
  G.after(0.9, () => {
    G.hud.big(gt.banner || 'VANQUISHED', 'gold', 4);
    G.audio.sfx('felled');
    G.hud.setBoss(null);
  });
  G.after(2.6, () => { G.world.openPortcullis(); G.audio.sfx('gate', { x: gt.x, z: gt.z }); G.hud.toast(gt.toast || 'The way opens'); });
}

function bossDefeated() {
  G.save.m.dead.push(G.level.boss);
  G.save.write();
  G.slowmo = 1.6;
  G.audio.music('none');
  for (const e of G.enemies) if (e.spawn.add && e.alive) e.die({});
  G.after(1.4, () => {
    G.hud.big('WARLORD VANQUISHED', 'gold felled', 6);
    G.audio.sfx('felled');
    G.hud.setBoss(null);
    G.bossFight = false;
  });
  G.after(5.2, () => { G.world.setFogGate(false); G.world.setExit(true); G.hud.toast(G.level.exitToast || 'A Pixie Gate opens'); G.audio.sfx('rest'); G.audio.music('explore'); });
}

G.onBossPhase2 = (boss) => {
  G.hud.toast(G.level.phase2Line || 'The warlord rages', 'warn');
  let i = 0;
  for (const e of G.enemies) {
    if (!e.spawn.add) continue;
    e.reset(); e.state = 'engage'; e.st = 0; e.think = .6 + i++ * .3;
    G.fx.poisonCloud(e.pos, 1.2);
  }
};

G.onFogCrossed = () => {
  if (G.boss && G.boss.alive && !G.bossFight) startBossFight();
};

function startBossFight() {
  const b = G.boss;
  G.bossFight = true;
  b.reset();
  b.state = 'intro'; b.st = 0;
  G.hud.setBoss(b);
  G.player.lock = b;
  G.audio.sfx('roar', { x: b.pos.x, z: b.pos.z });
  G.audio.music('boss');
  G.cam.shake(.5);
}

G.onPlayerDeath = () => {
  const p = G.player, d = G.save.data;
  G.state = 'dead'; G.controlsOn = false;
  G.hud.closeMessage();
  d.deaths++;
  d.grave = d.glimmer > 0 ? { mission: G.level.id, x: p.pos.x, z: p.pos.z, amount: d.glimmer } : null;
  d.glimmer = 0;
  G.save.write();
  G.audio.music('none');
  G.audio.sfx('died');
  G.slowmo = .8;
  G.after(.7, () => G.hud.big('FALLEN', 'died', 4.2, d.grave ? 'Your Glimmer lingers in your Echo.' : ''));
  G.after(4.2, () => G.hud.fadeTo(true, 1.2));
  G.after(5.6, respawn);
};

function respawn() {
  if (G.state !== 'dead') return;
  applyWorldState();
  placeAtShrine(G.save.m.shrine);
  G.player.anima = 0;
  G.player.setState('rise'); G.player.anim.play('rise');
  G.hud.fadeTo(false, 1.2);
  G.state = 'play'; G.controlsOn = true;
  G.audio.music('explore');
}

// ---------------------------------------------------------------- Moonwells & interaction
function rest(shrine) {
  const p = G.player, d = G.save.data, m = G.save.m;
  const first = !m.kindled.includes(shrine.id);
  if (first) m.kindled.push(shrine.id);
  m.shrine = shrine.id;
  p.setState('rest'); p.anim.play('rest');
  p.vel.set(0, 0, 0); p.poisoned = 0; p.poison = 0;
  G.controlsOn = false;
  G.hud.big(first ? 'MOONWELL AWAKENED' : 'MOONWELL', 'shrine', 2.5);
  G.audio.sfx('rest');
  G.after(0.9, () => {
    if (G.state !== 'play') return;
    applyWorldState();
    p.hp = p.maxHp; p.ki = p.maxKi; p.elixirs = d.elixirMax; p.poisoned = 0; p.poison = 0;
    G.save.write();
    G.input.wantLock = false; G.input.releaseLock();
    G.menu.show('shrine', shrine);
  });
}

G.leaveShrine = () => {
  if (G.traveling) return;
  G.menu.stack = [];
  G.menu.el.className = ''; G.menu.el.innerHTML = '';
  const p = G.player;
  p.setState('rise'); p.anim.play('rise');
  G.controlsOn = true;
  G.input.wantLock = true; G.input.requestLock();
};

G.levelUp = stat => {
  const sv = G.save, cost = levelCost(sv.level);
  if (sv.glimmer < cost) return;
  sv.glimmer -= cost;
  sv.data.stats[stat]++;
  const p = G.player;
  p.stats = { ...sv.stats }; p.applyStats();
  p.hp = p.maxHp; p.ki = p.maxKi;
  G.hud.glimmerShown = sv.glimmer;
  G.audio.sfx('levelUp');
  G.fx.motes({ x: p.pos.x, y: .3, z: p.pos.z }, 0xffd27a, 30, .6, 2.5, .12, 1.2);
  sv.write();
};

G.travel = id => {
  if (G.traveling) return;
  G.traveling = true;
  G.hud.fadeTo(true, .5);
  G.after(0.55, () => {
    G.traveling = false;
    G.input.wantLock = false; G.input.releaseLock();
    G.save.m.shrine = id;
    const s = G.level.shrines[id];
    placeAtShrine(id);
    G.player.setState('rest'); G.player.anim.play('rest');
    G.save.write();
    G.hud.fadeTo(false, .8);
    G.lastArea = null;
    G.menu.show('shrine', s);
  });
};

function findInteractable() {
  const p = G.player, w = G.world;
  let best = null, bd = Infinity;
  for (const it of w.interactables) {
    if (it.kind === 'item' && it.taken) continue;
    if (it.kind === 'fog' && (w.fogGate.gone || G.bossFight || w.sealSide(p.pos.x, p.pos.z) > -1.1 || !G.boss?.alive)) continue;
    if (it.kind === 'exit' && !w.exitGate.on) continue;
    const d = Math.hypot(p.pos.x - it.x, p.pos.z - it.z);
    if (d < it.r && d < bd) { bd = d; best = it; }
  }
  return best;
}

function interact(it) {
  const p = G.player, d = G.save.data, m = G.save.m;
  switch (it.kind) {
    case 'shrine': rest(it.shrine); break;
    case 'message': G.hud.message(it.text); G.audio.sfx('ui'); break;
    case 'item': {
      const item = it.item;
      m.items.push(item.id);
      G.world.setItemTaken(item.id, true);
      if (item.kind === 'grace') { if (d.elixirMax < 8) { d.elixirMax++; p.elixirs++; } else { G.save.glimmer += 400; G.hud.addGlimmer(400); } }
      if (item.kind === 'glimmer') { G.save.glimmer += item.amount; G.hud.addGlimmer(item.amount); }
      if (item.kind === 'weapon' && !d.arms.includes(item.weapon)) {
        d.arms.push(item.weapon); p.arms = [...d.arms]; p.setWeapon(p.weapon);
        G.after(.8, () => G.hud.message(item.tip || item.desc));
      }
      G.hud.toast(`${item.label} — ${item.desc}`, 'item');
      G.audio.sfx('pickup');
      p.setState('pickup'); p.anim.play('pickup');
      G.save.write();
      break;
    }
    case 'fog':
      p.setState('fog'); p.anim.play('fog'); p.lock = null;
      G.audio.sfx('fog');
      break;
    case 'exit': {
      G.state = 'ending'; G.controlsOn = false;
      p.poisoned = 0; p.poison = 0; p.iframesT = 99;
      // Mission cleared: unlock the next one.
      m.cleared = true;
      const next = ORDER[ORDER.indexOf(G.level.id) + 1];
      if (next && !d.unlocked.includes(next)) d.unlocked.push(next);
      G.save.write();
      G.audio.sfx('shift');
      G.hud.fadeTo(true, 1.5);
      G.after(1.6, () => { G.hud.show(false); G.input.releaseLock(); G.menu.show(next ? 'cleared' : 'ending', { next }); });
      break;
    }
  }
}

// ---------------------------------------------------------------- frame
const clock = new THREE.Clock();
let wasLocked = false;

// ?manual stops the render loop so tests can step the game deterministically with G.tick().
const manual = new URLSearchParams(location.search).has('manual');

function frame(fixed, draw = true) {
  const rdt = fixed ?? Math.min(clock.getDelta(), 1 / 20);
  const inp = G.input;
  inp.poll(rdt);

  // Menus eat input first.
  const menuWasOpen = G.menu.open;
  if (menuWasOpen) { G.menu.nav(inp); inp.pressed.clear(); }   // a button that closes a menu shouldn't also act in game

  if (G.state === 'play') {
    if (!menuWasOpen && G.player.state !== 'rest') {
      const lostLock = wasLocked && !inp.locked && G.player.alive;
      if (G.hud.messageOpen) {
        if (inp.hit('interact') || inp.hit('pause') || inp.hit('light') || inp.hit('dodge')) { G.hud.closeMessage(); inp.pressed.clear(); }
      } else if (inp.hit('pause') || lostLock) {
        G.controlsOn = false; G.menu.show('pause'); G.input.wantLock = false; G.input.releaseLock();
      }
    }
    wasLocked = inp.locked;
    G.controlsOn = !G.menu.open && !G.hud.messageOpen && G.player.state !== 'rest' && G.player.alive;
  } else wasLocked = inp.locked;

  // Hitstop and slow motion stretch game time; the camera keeps real time.
  let dt = rdt;
  if (G.hitstop > 0) { G.hitstop -= rdt; dt *= .04; }
  else if (G.slowmo > 0) { G.slowmo -= rdt; dt *= .3; }
  const paused = G.menu.open && G.state === 'play' && G.menu.top?.screen !== 'shrine';
  if (paused) dt = 0;

  if (G.state === 'play' || G.state === 'dead' || G.state === 'ending') {
    G.time += dt;
    if (G.state === 'play') G.save.data.time += dt;
    step(dt, rdt);
  } else if (G.state === 'title') {
    G.time += rdt;
    titleFrame(rdt);
  }
  inp.endFrame();
  if (draw) renderer.render(scene, camera);
}
G.tick = (n = 1, dt = 1 / 60, draw = false) => { for (let i = 0; i < n; i++) frame(dt, draw && i === n - 1); };

function step(dt, rdt) {
  const p = G.player, inp = G.input;
  runTimers();
  if (dt > 0) {
    p.update(dt);
    // Moonstep: the world slows while the knight doesn't.
    const edt = G.warp > 0 ? dt * .28 : dt;
    G.warp = Math.max(0, (G.warp || 0) - rdt);
    for (const e of G.enemies) {
      if (!e.active) continue;
      const d = e.distToPlayer();
      e.outer.visible = d < 60;
      if (d < 50 || e.aware) e.update(edt);
    }
    separate(edt);
    G.projectiles.update(edt);
  }
  // Boss phases and the gatekeeper's bar.
  const b = G.boss;
  if (b && b.alive && G.bossFight && !b.phase2 && b.hp < b.maxHp * .5) b.phase2 = true;
  const w = G.gatekeeper;
  if (w && w.alive) {
    const engaged = w.aware && w.state !== 'return' && w.distToPlayer() < 22;
    if (engaged && G.hud.bossE !== w) G.hud.setBoss(w);
    if (!engaged && G.hud.bossE === w) G.hud.setBoss(null);
  }

  // Interactions and the grave.
  if (G.state === 'play' && p.state === 'free' && G.controlsOn) {
    const it = findInteractable();
    G.hud.prompt(it ? it.prompt : null);
    if (it && inp.hit('interact')) { interact(it); G.hud.prompt(null); }
  } else G.hud.prompt(null);
  const gd = G.save.data.grave;
  if (gd && gd.mission === G.level.id && p.alive && G.state === 'play' && Math.hypot(p.pos.x - gd.x, p.pos.z - gd.z) < 1.3) {
    G.save.glimmer += gd.amount; G.hud.addGlimmer(gd.amount);
    G.fx.wisps({ x: gd.x, y: 1, z: gd.z }, 16, () => ({ x: p.pos.x, y: 1.1, z: p.pos.z }), () => G.audio.sfx('glimmer', { vol: .5 }), 0x9dff9a);
    G.hud.toast('Echo reclaimed', 'item');
    G.save.data.grave = null; G.save.write(); updateGrave();
  }
  if (grave.visible) { echoAnim.update(rdt, { speed: 0 }); grave.userData.core.rotation.y += rdt * 2; grave.userData.core.position.y = 1.9 + Math.sin(G.time * 2) * .1; if (Math.random() < rdt * 20) G.fx.motes({ x: grave.position.x, y: .3, z: grave.position.z }, 0x9dff9a, 1, .3, 1.2, .08, 1); }

  // Area names.
  const area = G.world.areaAt(p.pos.x, p.pos.z);
  if (area && area.id !== G.lastArea && G.state === 'play') { G.lastArea = area.id; G.hud.banner(area.name); }
  const L = G.level;
  scene.fog.density = damp(scene.fog.density, L.fog.byArea?.[area?.id] ?? L.fog.base, 1.5, rdt);

  // Ambient particles: embers, fireflies, falling leaves.
  if (Math.random() < rdt * 10) G.fx.motes({ x: p.pos.x + rand(-12, 12), y: rand(.2, 3), z: p.pos.z + rand(-12, 12) }, L.motes?.[area?.id] ?? L.motes?.base ?? 0xffb070, 1, .1, .25, .07, 4);
  if (L.leaves && Math.random() < rdt * 6) G.fx.leaf({ x: p.pos.x + rand(-10, 10), y: rand(5, 8), z: p.pos.z + rand(-10, 10) });
  for (const s of Object.values(L.shrines)) if (Math.random() < rdt * 6) G.fx.motes({ x: s.x, y: 1.4, z: s.z }, 0x9ff3ff, 1, .4, .6, .08, 1.6);

  G.world.update(dt, G.time, p.pos);
  G.fx.update(dt, G.time);
  const look = G.controlsOn ? inp.takeLook() : (inp.takeLook(), { x: 0, y: 0 });
  G.cam.update(rdt, p, p.lock, look);
  if (G.camOverride) { camera.position.copy(G.camOverride.pos); camera.lookAt(G.camOverride.look); }
  else {
    const resting = p.state === 'rest' || (p.state === 'rise' && p.st < .3);
    G.restCamK = clamp((G.restCamK || 0) + (resting ? 1.1 : -1.6) * rdt, 0, 1);
    if (G.restCamK > 0) restCam();
  }
  G.audio.listener = { x: p.pos.x, z: p.pos.z, yaw: G.cam.yaw };
  moon.position.set(p.pos.x - 18, 40, p.pos.z + 30); moon.target.position.set(p.pos.x, 0, p.pos.z);
  const fg = G.world.fogGate;
  const camSide = G.world.sealSide(camera.position.x, camera.position.z);
  fg.viewFade = damp(fg.viewFade, (G.bossFight && camSide < .2) || Math.abs(camSide) < 2.2 ? .12 : 1, 6, rdt);   // never smother the camera
  updateCutout(p);
  G.hud.update(rdt);
}

// Point the wall cutout at the knight.
const _cv = new THREE.Vector3();
function updateCutout(p) {
  camera.updateMatrixWorld();
  _cv.set(p.pos.x, 1.1, p.pos.z);
  const depth = _cv.clone().applyMatrix4(camera.matrixWorldInverse).z * -1;
  _cv.project(camera);
  const buf = renderer.getDrawingBufferSize(new THREE.Vector2());
  const r = 1.05 * (buf.y / 2) / Math.tan(camera.fov * Math.PI / 360) / Math.max(.5, depth);
  CUT.uCut.value.set((_cv.x * .5 + .5) * buf.x, (_cv.y * .5 + .5) * buf.y, G.state === 'play' || G.state === 'dead' ? r : 0);
  CUT.uCutDepth.value = depth;
}

// While resting, the camera drifts round to the front of the Moonwell.
const _rc = new THREE.Vector3(), _rl = new THREE.Vector3();
function restCam() {
  const p = G.player, s = Object.values(G.level.shrines).reduce((a, b) => (Math.hypot(b.x - p.pos.x, b.z - p.pos.z) < Math.hypot(a.x - p.pos.x, a.z - p.pos.z) ? b : a));
  const a = Math.atan2(p.pos.x - s.x, p.pos.z - s.z) + .9;
  _rc.set(s.x + Math.sin(a) * 4.6, 2.1, s.z + Math.cos(a) * 4.6);
  _rl.set((s.x + p.pos.x) / 2, 1.1, (s.z + p.pos.z) / 2);
  // Aim left of the pair so they sit on the right, clear of the Moonwell menu.
  const dx = _rl.x - _rc.x, dz = _rl.z - _rc.z, dl = Math.hypot(dx, dz);
  _rl.x += dz / dl * 1.7; _rl.z -= dx / dl * 1.7;
  const k = G.restCamK * G.restCamK * (3 - 2 * G.restCamK);
  camera.position.lerp(_rc, k);
  camera.lookAt(_rl.lerp(G.cam.look, 1 - k));
}

// Keep bodies apart softly: overlap is eased out over a few frames and a little personal space is kept,
// so crowds drift apart instead of jittering.
function separate(dt) {
  const E = G.enemies, k = 1 - Math.exp(-dt * 12);
  for (let i = 0; i < E.length; i++) {
    const a = E[i]; if (!a.alive) continue;
    for (let j = i + 1; j < E.length; j++) {
      const b = E[j]; if (!b.alive) continue;
      const dx = a.pos.x - b.pos.x, dz = a.pos.z - b.pos.z, d = Math.hypot(dx, dz), m = a.radius + b.radius + .3;
      if (d < m && d > 1e-4) {
        const hard = d < m - .3;
        const push = (m - d) / 2 * (hard ? Math.max(k, .5) : k * .5), wa = b.boss ? 1.8 : a.boss ? .2 : 1, wb = 2 - wa;
        a.pos.x += dx / d * push * wa; a.pos.z += dz / d * push * wa;
        b.pos.x -= dx / d * push * wb; b.pos.z -= dz / d * push * wb;
      }
    }
    G.world.collide(a.pos, a.radius);
  }
}

function titleFrame(dt) {
  const t = G.time * .08, s = G.level.shrines[firstShrine()];
  G.player.update(dt);
  G.world.update(dt, G.time, G.player.pos);
  G.fx.update(dt, G.time);
  if (Math.random() < dt * 8) G.fx.motes({ x: s.x + rand(-8, 8), y: rand(.2, 3), z: s.z + rand(-6, 10) }, 0xc8ff8a, 1, .1, .25, .07, 4);
  if (Math.random() < dt * 6) G.fx.motes({ x: s.x, y: 1.4, z: s.z }, 0x9ff3ff, 1, .4, .6, .08, 1.6);
  camera.position.set(s.x + Math.sin(t) * 6.5, 2.4 + Math.sin(t * .7) * .3, s.z + 1 + Math.cos(t) * 6.5);
  camera.lookAt(s.x, 1.3, s.z + .5);
  moon.position.set(s.x - 18, 40, s.z + 30); moon.target.position.set(s.x, 0, s.z);
}

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  G.fx.setScale(innerHeight * renderer.getPixelRatio(), camera.fov);
}
addEventListener('resize', resize);
resize();

// Save progress when the tab goes away mid-run.
addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play') G.save.write(); });
addEventListener('pointerdown', () => G.audio.init(), { once: false });
addEventListener('keydown', () => G.audio.init());

G.state = 'title';
titleScene();
G.menu.show('title');
G.hud.fadeTo(false, .01);
if (!manual) renderer.setAnimationLoop(() => frame());
load().catch(err => {
  console.error(err);
  G.loadError = err;
  const msg = location.protocol === 'file:' ? 'Open the game through a web server: run "python3 -m http.server" here and visit http://localhost:8000' : 'Could not load the models: ' + err.message;
  document.getElementById('menu').insertAdjacentHTML('beforeend', `<div class="error">${msg}</div>`);
});
