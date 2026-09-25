// PixieLords: a stance-based fae action game in the browser. Boot, game loop and the rules that tie the
// systems together (Moonwells, souls and the Echo, the Gatewarden's portcullis, the Briar Seal and the boss).
import * as THREE from 'three';
import { Input } from './input.js';
import { Audio } from './audio.js';
import { World, CUT } from './world.js';
import { LEVELS, ORDER } from './levels/index.js';
import { ARMORY, ARMORY_ITEMS } from './armory.js';
import { Player } from './player.js';
import { buildKnight, KnightAnimator } from './knight.js';
import { Enemy, Projectiles, TYPES } from './enemies.js';
import { fallenKnight, graveType, gravePetals } from './graves.js';
import { wares, nightOf, VIAL_MAX } from './market.js';
import { FX } from './fx.js';
import { HUD } from './hud.js';
import { Menu } from './menu.js';
import { Overworld } from './overworld.js';
import { CameraRig } from './camera.js';
import { Save, levelCost, forgeCost, FORGE, loadSettings, saveSettings, freshGear, freshMission, freshAbyss, SETTINGS_DEFAULT } from './save.js';
import { loadModel } from './models3d.js';
import { glowTexture } from './textures.js';
import { CHARMS, CHARM_SLOTS } from './charms.js';
import { PATRONS, PATRON_OF } from './patrons.js';
import { tonight, OMENS } from './moontonight.js';
import { pointsAt, treeCost, canLearn, treeFor } from './skills.js';
import { RANGED } from './ranged.js';
import { ARTS } from './arts.js';
import { Loot, PACK } from './loot.js';
import { RARITY, SETS as GEAR_SETS, itemName, dismantleValue, fxText, reforgeCost, rerollFx, soulMatchCost } from './gear.js';
import { CORES, CORE_MAX } from './cores.js';
import { SIDES } from './sides.js';
import { wayName, wayDesc, WAY_TIER, wayGlimmer } from './ways.js';
import { makeFloor, isCheckpoint, checkpointOf, isBossDepth } from './underbriar.js';
import { DEEDS, TIER, DEED_GLIMMER, deedTier } from './deeds.js';
import { clamp, damp, rand } from './util.js';

const G = { time: 0, hitstop: 0, slowmo: 0, enemies: [], bosses: [], controlsOn: false, attackTokens: 0, state: 'boot', ready: false, ngMul: 1, LEVELS, ORDER };
// The armory's weapons that lie in the missions join each mission's items.
for (const [m, list] of Object.entries(ARMORY_ITEMS)) for (const w of [].concat(list)) {
  const L = LEVELS[m];
  if (L && !L.items.some(i => i.id === 'w-' + w.id)) L.items.push({ id: 'w-' + w.id, x: w.x, z: w.z, kind: 'weapon', weapon: w.id, label: w.label, desc: w.desc, tip: w.tip });
}
// Weapons won from a mission's gatekeeper ('gate') or warlord ('boss').
const armoryFrom = (kind, mission) => Object.keys(ARMORY).filter(id => ARMORY[id].source[kind] === mission);
const rangedFrom = (kind, mission) => Object.keys(RANGED).filter(id => RANGED[id].source?.[kind] === mission);
// The side mission under way (sides.js), or null.
const sideDef = () => SIDES[G.save.data.side] || null;
// Deeds (deeds.js): tally what the knight does; a tier reached pays Glimmer and a bonus for good.
// max: the tally is a high-water mark (deepest depth, pixies freed) rather than a count.
G.tally = (key, n = 1, max = false) => {
  const d = G.save.data, t = d.tally ||= {};
  t[key] = max ? Math.max(t[key] || 0, n) : (t[key] || 0) + n;
  checkDeeds(false);
};
function checkDeeds(quiet) {
  const d = G.save.data, t = d.tally ||= {}, got = d.deeds ||= {};
  let n = 0, gl = 0, pt = 0;
  for (const D of DEEDS) {
    const tier = deedTier(D, t[D.tally] || 0);
    while ((got[D.id] || 0) < tier) {
      const k = got[D.id] || 0; got[D.id] = k + 1; n++; gl += DEED_GLIMMER[k]; pt += (k + 1) * 5;
      if (!quiet) G.after(.3 + n * .6, () => { G.hud.toast(`Deed: ${D.name} ${TIER[k]} · ${fxText(D.fx[0], D.fx[1])} · ${DEED_GLIMMER[k].toLocaleString()} Glimmer · ${(k + 1) * 5} Moonpetals`, 'loot r4'); G.audio.sfx('levelUp'); });
    }
  }
  if (!n) return;
  G.save.glimmer += gl; if (!quiet) G.hud.addGlimmer(gl);
  d.petals = (d.petals || 0) + pt;   // Moonpetals (market.js), five a tier and more for the higher
  G.player.applyDeeds();
  if (quiet) G.after(2, () => G.hud.toast(`Deeds earned: ${n} · ${gl.toLocaleString()} Glimmer`, 'loot r4'));
  G.save.write();
}
// Older saves: count what was done before Deeds were kept.
function syncDeeds() {
  const d = G.save.data, t = d.tally ||= {};
  t.pixies = Math.max(t.pixies || 0, d.pixies.length); t.letters = Math.max(t.letters || 0, d.letters.length);
  t.depth = Math.max(t.depth || 0, d.abyss?.best || 0); t.ways = Math.max(t.ways || 0, d.ng || 0);
  t.missions = Math.max(t.missions || 0, Object.entries(d.missions).filter(([id, m]) => LEVELS[id] && m.cleared).length);
  t.sides = Math.max(t.sides || 0, Object.values(d.sides || {}).reduce((a, b) => a + b, 0));
  t.patrons = Math.max(t.patrons || 0, (d.patrons?.length || 1) - 1);
  // Moonpetals came after Deeds: tiers already earned pay theirs once.
  if (!d.deedPetals) { d.deedPetals = true; d.petals = (d.petals || 0) + Object.values(d.deeds || {}).reduce((a, n) => a + 5 * n * (n + 1) / 2, 0); }
  checkDeeds(true);
}
G.deedsView = () => DEEDS.map(D => ({ D, n: G.save.data.tally?.[D.tally] || 0, tier: G.save.data.deeds?.[D.id] || 0 }));

// In the Underbriar (underbriar.js): its depths are made as they are reached, not kept in LEVELS.
const abyss = () => G.level?.id === 'underbriar';
const levelFor = id => {
  if (id !== 'underbriar') return LEVELS[id] || LEVELS.keep;
  const a = G.save.data.abyss ||= freshAbyss();
  return G.level?.id === 'underbriar' && G.level.depth === a.depth ? G.level : makeFloor(a.depth, a.seed);
};
G.sideDef = sideDef; G.SIDES = SIDES;
window.__pl = G;
G.touchOnly = matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches;

// Game-time timers: they pause with the game and stretch with slow motion.
const timers = [];
G.after = (sec, fn) => timers.push({ t: G.time + sec, fn });
// A tip that waits its turn: it never covers a letter or another tip already open, nor opens over a menu.
G.tipAfter = (sec, text) => G.settings.tips !== false && G.after(sec, function show() { if (G.hud.messageOpen || G.menu.open || G.state !== 'play') G.after(.4, show); else G.hud.message(text); });
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
G.tonight = tonight(G.settings, G.save.data.unlocked, G.save.data.mission);   // the sky's moon, as it is tonight
G.input = new Input(canvas);
G.audio = new Audio();
G.fx = new FX(scene);
G.level = levelFor(G.save.data.mission);
G.world = new World(G, G.level);
G.cam = new CameraRig(camera, G.world);
G.hud = new HUD(G);
G.menu = new Menu(G);
G.overworld = new Overworld(G);
G.projectiles = new Projectiles(G);
G.loot = new Loot(G);
G.player = new Player(G);
const envTex = makeEnv();
for (const m of Object.values(G.player.k.mats)) if (m.isMeshStandardMaterial) { m.envMap = envTex; m.envMapIntensity = .9; }

G.setSetting = (k, v) => {
  G.settings[k] = v; saveSettings(G.settings); applySettings();
  if (k === 'realMoon') G.refreshTonight?.(G.level?.id);
};
G.resetSettings = () => { G.settings = { ...SETTINGS_DEFAULT }; saveSettings(G.settings); applySettings(); };
function applySettings() {
  const s = G.settings;
  G.input.sens = s.sens; G.input.invertY = s.invertY;
  G.audio.setVolume('master', s.master); G.audio.setVolume('music', s.music); G.audio.setVolume('sfx', s.sfx);
  G.shakeScale = s.shake;
  G.cam.lockHeight = s.lockHeight ?? 1; G.cam.distScale = [.82, 1, 1.22][s.camDist ?? 1];
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
  // Twilight: a blood moon, and a redder dark.
  if (sideDef()?.kind === 'twilight') {
    const tint = (hex, to, k) => new THREE.Color(hex).lerp(new THREE.Color(to), k).getHex();
    scene.fog.color.setHex(tint(L.fog.color, 0x3a0e1c, .55)); scene.background.copy(scene.fog.color);
    hemi.color.setHex(tint(lt.sky ?? 0x7d8fc4, 0xc4586a, .5)); moon.color.setHex(0xff7a5a); moon.intensity *= .9;
  }
}

async function loadEnemies() {
  const L = G.level, all = [...L.spawns, ...(L.adds || [])];
  const types = [...new Set(all.map(s => Enemy.modelFor(s.type)).filter(Boolean))];
  let done = 0;
  G.loadProgress = 0;
  await Promise.all(types.map(t => loadModel(t).then(() => { done++; G.loadProgress = done / types.length; if (G.menu.top?.screen === 'title') G.menu.render(); })));
  G.enemies = await Promise.all(all.map(s => Enemy.create(G, s)));
  G.sideFoe = null;
  for (const e of G.enemies) if (e.spawn.add) e.kill();
  // A mission's warlord may be one foe or a pair fought together.
  G.bosses = bossIds(L).map(id => G.enemies.find(e => e.id === id)).filter(Boolean);
  G.boss = G.bosses[0];
  G.gatekeeper = L.gate ? G.enemies.find(e => e.id === L.gate.guardian) : null;
  if (L.depth) for (const b of G.bosses) b.boss = true;   // a depth's warlord waits behind its seal, whatever it was
}

const bossIds = L => [].concat(L.boss);

// Swap in another mission's world and foes.
async function setLevel(id) {
  const L = levelFor(id);
  if (G.level === L && G.enemies.length) return;
  G.loading = true;
  if (G.level !== L) {
    for (const e of G.enemies) e.dispose();
    G.enemies = [];
    G.projectiles.clear(); G.loot.clear();
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
  const d = G.save.data, m = G.save.m, L = G.level, S = sideDef();
  syncSide();
  G.player.lock = null;
  G.ngMul = (S?.hard || 1) * (L.depthMul || 1); G.wayTier = (d.ng || 0) * WAY_TIER;
  syncGraves();
  for (const e of G.enemies) {
    e.reset();
    if (e.spawn.add || m.dead.includes(e.id)) e.kill();
  }
  // A hunt's quarry comes back stronger, and faces the way you come (its gate stands open behind you).
  const q = S?.kind === 'hunt' && G.sideTarget;
  if (q?.alive) {
    q.maxHp = Math.round(q.maxHp * S.hp); q.hp = q.maxHp; q.dmgMul *= S.dmg; q.maxKi = Math.round(q.maxKi * 1.3); q.ki = q.maxKi;
    q.yaw = q.home.yaw = 0; q.outer.rotation.y = 0;
  }
  if (L.gate) { if (m.dead.includes(L.gate.guardian) || S?.kind === 'hunt') G.world.openPortcullis(true); else G.world.closePortcullis(); }
  const bossDead = G.bosses.every(b => m.dead.includes(b.id));
  G.world.setBreaks(false);
  G.world.setFogGate(!bossDead);
  G.world.setExit(abyss() ? !!m.cleared : bossDead && !S);
  G.world.resetBreakables();
  // A side run finds the mission's items already taken (they were, the first time through).
  for (const it of G.world.interactables) if (it.kind === 'item') G.world.setItemTaken(it.id, !!S || m.items.includes(it.id));
  for (const l of G.world.letters) G.world.setLetterRead(l.id, d.letters.includes(L.id + ':' + l.id));
  for (const px of G.world.pixieList) G.world.setPixie(px.id, d.pixies.includes(L.id + ':' + px.id));
  for (const s of Object.values(L.shrines)) s.fx.lit = !s.dim && m.kindled.includes(s.id) ? 1 : 0;
  G.projectiles.clear();
  for (const h of L.hazards || []) G.projectiles.hazard(h.x, h.z, h.r, Infinity, h.poison ?? 45, h.kind, true);
  G.attackTokens = 0;
  G.bossFight = false;
  G.hud.setBoss(null);
  G.hud.objective(S && S.kindName, S && (S.kind === 'twilight' ? `Fell ${G.bosses.map(b => b.name.split(',')[0]).join(' and ')}` : `Fell ${(G.sideTarget?.name || '').split(',')[0]}`));
  if (abyss()) abyssObjective();
  updateGrave();
}

// ---------------------------------------------------------------- the Underbriar
// What a depth asks: its warlord, every foe, or nothing more (the way down is open).
function abyssObjective() {
  const L = G.level, m = G.save.m, left = abyssLeft();
  G.hud.objective(`Underbriar · Depth ${L.depth}`, m.cleared ? 'The way down is open' : L.isBoss ? `Fell ${G.bosses.map(b => b.name.split(',')[0]).join(' and ')}` : `Slay every foe · ${left} remain${left === 1 ? 's' : ''}`);
}
const abyssLeft = () => G.enemies.filter(e => e.alive && !e.spawn.add && !G.bosses.includes(e)).length;
// Every foe down (or the warlord): the Pixie Gate opens, with Glimmer for the depth, and the record grows.
function depthCleared() {
  const d = G.save.data, m = G.save.m, L = G.level, a = d.abyss;
  if (m.cleared) return;
  m.cleared = true;
  const gl = Math.round(90 * L.depth ** 1.2 * wayGlimmer(d.ng));
  a.best = Math.max(a.best || 0, L.depth); G.tally('depth', L.depth, true);
  G.save.glimmer += gl; G.hud.addGlimmer(gl);
  G.after(.8, () => { G.world.setExit(true); G.hud.toast(`Depth ${L.depth} cleared · ${gl.toLocaleString()} Glimmer · the way down opens`, 'item'); G.audio.sfx('rest'); });
  abyssObjective();
  G.save.write();
}
// A depth's warlord falls: its spoils (a piece of Rare gear or better), and the way down.
function abyssWarlordFell() {
  const L = G.level, m = G.save.m;
  for (const b of G.bosses) if (!m.dead.includes(b.id)) m.dead.push(b.id);
  for (const e of G.enemies) if (e.spawn.add && e.alive) e.die({});
  G.slowmo = 1.4; G.audio.music('none');
  const it = G.loot.roll(1.8, L.depth >= 20 ? 3 : 2);
  G.after(1.4, () => { G.hud.big('WARLORD OF THE DEPTH FELLED', 'gold felled', 5, `Depth ${L.depth} · the next holds a lit Moonwell`); G.audio.sfx('felled'); G.hud.setBoss(null); G.bossFight = false; });
  G.after(3.6, () => { if (!G.takeGear(it)) G.save.glimmer += dismantleValue(it); });
  G.after(4.2, () => { G.world.setFogGate(false); depthCleared(); G.audio.music('explore'); });
  G.after(5, () => G.addPetals(3 + Math.floor(L.depth / 5)));
}
// Into the Underbriar at a depth (a lit Moonwell's), or on down through the Pixie Gate.
// carry: health, Moondew and Faelight brought down from the depth above (a Moonwell is the only refill).
G.enterUnderbriar = async (depth, descending = false, carry = null) => {
  const d = G.save.data, a = d.abyss ||= freshAbyss();
  if (!descending && !a.cps.includes(depth)) return false;
  if (!descending && d.mission !== 'underbriar') a.from = d.mission;
  d.mission = 'underbriar'; d.side = null; d.sideRun = null;
  a.depth = depth;
  if (isCheckpoint(depth) && !a.cps.includes(depth)) a.cps.push(depth);
  d.missions.underbriar = freshMission();
  G.save.write();
  await startRun();
  const L = G.level, p = G.player;
  if (carry) { p.hp = Math.min(p.maxHp, carry.hp); p.elixirs = carry.elixirs; p.anima = carry.anima; }
  G.after(1, () => G.hud.big(`DEPTH ${depth}`, 'intro side', 4, `${LEVELS[L.theme]?.name.replace(/^The /, 'The Underbriar of the ') || 'The Underbriar'}${L.lit ? ' · a Moonwell burns here' : ''}${isBossDepth(depth) ? ' · a warlord waits below' : ''}`));
  if (!a.tip) { a.tip = true; G.tipAfter(5.5, 'The Underbriar: slay every foe on a depth to open the Pixie Gate down. Every fifth depth ends with a warlord; the next depth has a lit Moonwell to rest at and start from again. Fall, and you wake at the last lit Moonwell you reached.'); }
  return true;
};
G.leaveUnderbriar = () => { G.menu.close(); G.openMap('cleared', G.save.data.abyss?.from || 'keep'); };
function descend() {
  const p = G.player, a = G.save.data.abyss;
  G.controlsOn = false; p.iframesT = 99;
  G.audio.sfx('shift'); G.hud.fadeTo(true, 1);
  a.best = Math.max(a.best || 0, G.level.depth);
  const carry = { hp: p.hp, elixirs: p.elixirs, anima: p.anima };
  G.after(1.1, () => G.enterUnderbriar(G.level.depth + 1, true, carry));
}

// A duel's Revenant joins the mission's foes while the side run lasts, in the warlord's place; leaving the
// run sends it away. Hunts mark their quarry, the gatekeeper.
async function prepareSide() {
  const S = sideDef(), L = G.level, want = S?.kind === 'duel' ? S.foe : null;
  syncSide();
  if (want && !G.sideFoe) {
    const b = L.spawns.find(s => s.id === bossIds(L)[0]);
    const e = G.sideFoe = await Enemy.create(G, { id: 'revenant', type: want, x: bossIds(L).length > 1 ? 0 : b.x, z: b.z, yaw: b.yaw ?? Math.PI });
    e.boss = true;   // it waits behind the Briar Seal and wakes when you cross, as a warlord does
    G.enemies.push(e);
  }
  syncSide();
}
function syncSide() {
  const S = sideDef(), L = G.level;
  if (G.sideFoe && G.sideFoe.spawn.type !== (S?.kind === 'duel' ? S.foe : null)) { G.sideFoe.dispose(); G.enemies.splice(G.enemies.indexOf(G.sideFoe), 1); G.sideFoe = null; }
  G.bosses = G.sideFoe ? [G.sideFoe] : bossIds(L).map(id => G.enemies.find(e => e.id === id)).filter(Boolean);
  G.boss = G.bosses[0];
  G.gatekeeper = L.gate ? G.enemies.find(e => e.id === L.gate.guardian) : null;
  G.sideTarget = S?.kind === 'hunt' ? G.gatekeeper : S?.kind === 'duel' ? G.sideFoe : null;
}
// A side run's start: twilight from the first Moonwell with every foe; a hunt from the second, with only the
// foes that guard the gate; a duel from the second, the way to the arena quiet.
function beginSide(S, m) {
  const L = G.level, ids = Object.keys(L.shrines), gz = L.gate?.z ?? Infinity;
  m.shrine = S.kind === 'twilight' ? firstShrine() : ids[1] || ids[0];
  m.kindled = [m.shrine]; m.dead = [];
  if (S.kind === 'twilight') return;
  const t = G.sideTarget;
  for (const e of G.enemies) {
    if (e === G.sideFoe || e === t || e.spawn.add) continue;
    const guard = S.kind === 'hunt' && t && !G.bosses.includes(e) && e.spawn.z < gz && Math.hypot(e.spawn.x - t.spawn.x, e.spawn.z - t.spawn.z) < 20;
    if (!guard) m.dead.push(e.id);
  }
}

G.updateGrave = () => updateGrave();
// An Echo lies in the mission, or side run, where the knight fell.
const graveHere = g => !!g && g.mission === G.level.id && (g.side || null) === (G.save.data.side || null) && (g.depth || 0) === (G.level.depth || 0);
function updateGrave() {
  const g = G.save.data.grave;
  grave.visible = graveHere(g);
  if (g) grave.position.set(g.x, 0, g.z);
}

// ---------------------------------------------------------------- Revenant Graves (graves.js)
// Graves lie in a mission's own run, and in its Twilight and Hunt; not on a Duel, nor in the Underbriar.
const gravesHere = () => !G.level.depth && sideDef()?.kind !== 'duel';
// Whoever lies in grave i now (a new knight each time one is laid to rest and you rest after).
G.graveKnight = i => {
  const m = G.save.m, L = G.level, an = n => (/^[AEIOU]/.test(n) ? 'an ' : 'a ') + n;
  const foes = [...new Set(G.enemies.filter(e => !e.spawn.add && e.spawn.grave == null && e !== G.sideFoe).map(e => e.T.boss || e.spawn.elite ? e.T.name.split(',')[0] : an(e.T.name)))];
  return fallenKnight(L.id, i, (m.graveGen || [])[i] || 0, foes, L.level || 1);
};
// A grave's Revenant goes back to the earth whenever the world is reset (a rest, a fall); graves dim once laid.
function syncGraves() {
  const m = G.save.m, on = gravesHere();
  for (const e of G.enemies.filter(e => e.spawn.grave != null)) { e.dispose(); G.enemies.splice(G.enemies.indexOf(e), 1); }
  G.graveFoe = null;
  for (const g of G.world.graves || []) { g.on = on; g.grp.visible = on; g.col.on = on; g.set(on && !(m.graves || []).includes(g.i)); }
}
// Raise grave i's fallen knight behind its grave, facing you.
G.challengeGrave = async i => {
  const g = G.world.graves?.[i], p = G.player, m = G.save.m;
  if (!g || !g.on || G.graveFoe || (m.graves || []).includes(i)) return null;
  const K = G.graveKnight(i), key = `revenant-fallen-${K.mission}-${i}-${K.gen}`;
  TYPES[key] ||= graveType(K, TYPES);
  const a = Math.atan2(p.pos.x - g.x, p.pos.z - g.z);
  const e = G.graveFoe = await Enemy.create(G, { id: `grave${i}`, type: key, x: g.x - Math.sin(a) * 1.5, z: g.z - Math.cos(a) * 1.5, yaw: a, grave: i, noChamp: true });
  e.graveK = K;
  G.enemies.push(e);
  e.state = 'intro'; e.st = .7;
  G.fx.ring(e.pos, 0xff4a4a, 6, .8); G.fx.ring(g.grp.position, 0xff8a6a, 3.5, .6);
  G.audio.sfx('roar', { x: e.pos.x, z: e.pos.z, pitch: 1.2 }); G.audio.sfx('shift', { pitch: .7 });
  G.cam.shake(.35);
  p.lock = e; G.hud.setBoss(e);
  G.hud.toast(`${K.name} rises from the grave`, 'warn');
  if (!G.save.data.graveTip) { G.save.data.graveTip = true; G.tipAfter(2.4, 'A Revenant: the echo of a knight who fell here. Lay it to rest for Moonpetals and a piece of what it wore or carried. The grave stays dark until you rest at a Moonwell.'); }
  return e;
};
// Laid to rest: Moonpetals, a piece of its harness or its weapon (Rare or finer), now and then more, and its Core.
function graveFell(e) {
  const d = G.save.data, m = G.save.m, i = e.spawn.grave, K = e.graveK, g = G.world.graves?.[i];
  if (!(m.graves ||= []).includes(i)) m.graves.push(i);
  G.graveFoe = null; g?.set(false);
  if (G.hud.bossE === e) G.hud.setBoss(null);
  G.tally('graves');
  const petals = gravePetals(K, d.ng || 0, !!G.tonight?.omen);
  const want = { set: K.set, weapon: d.arms.includes(K.weapon) ? K.weapon : null }, mul = (1 + G.player.gf('drops') / 100) * (G.tonight?.drops || 1);
  const drops = [G.loot.roll(1.4, 2, want)];
  if (Math.random() < .3 * mul) drops.push(G.loot.roll(.9, 1, want));
  drops.forEach((it, k) => G.loot.place(it, e.pos.x + Math.sin(k * 2.4) * .9, e.pos.z + Math.cos(k * 2.4) * .9));
  if (Math.random() < .2 * (G.tonight?.cores || 1)) G.loot.place({ core: 'revenant' }, e.pos.x - .7, e.pos.z + .5);
  G.audio.sfx('glint', { vol: .7, pitch: .8 });
  G.after(1, () => { G.hud.big('REVENANT LAID TO REST', 'gold felled', 3.4, `${K.name} · ${petals} Moonpetals`); G.audio.sfx('felled', { vol: .6 }); G.addPetals(petals); });
  G.save.write();
}
// Moonpetals (market.js): the Hidden Market's coin.
G.addPetals = (n, quiet = false) => {
  const d = G.save.data;
  d.petals = (d.petals || 0) + n; G.tally('petals', n);
  if (!quiet) G.hud.toast(`+${n} Moonpetals · ${d.petals} held`, 'petal');
  if (!d.petalTip) { d.petalTip = true; G.tipAfter(1.5, 'Moonpetals: the coin of the Hidden Market, found at any Moonwell. Revenants, Duels, Deeds and the Underbriar\'s warlords give them.'); }
  G.save.write();
};

// ---------------------------------------------------------------- the Hidden Market (market.js) and the Wardrobe
// The night's stall; what was bought on an earlier night is forgotten.
G.market = () => { const d = G.save.data; if (d.market?.night !== nightOf()) d.market = { night: nightOf(), sold: [] }; return wares(d); };
G.buy = (tab, key) => {
  const d = G.save.data, W = G.market(), w = W[tab]?.find(x => x.key === key), p = G.player;
  if (!w || w.off || w.owned || (!w.repeat && d.market.sold.includes(key)) || (d.petals || 0) < w.price) return false;
  if (w.kind === 'lantern' && !(gravesHere() && G.world.graves?.length)) { G.hud.toast('No graves lie here', 'warn'); return false; }
  if (w.it) {
    if (d.gear.items.length >= PACK) { G.hud.toast('Your pack is full: dismantle something first', 'warn'); return false; }
    d.gear.uid = (d.gear.uid || 1) + 1;
    G.takeGear({ ...w.it, fx: w.it.fx.map(f => [...f]), uid: d.gear.uid });
  } else if (w.kind === 'vial') { d.elixirMax = Math.min(VIAL_MAX, d.elixirMax + 1); d.vials = (d.vials || 0) + 1; p.elixirs = d.elixirMax; G.hud.toast(`Moondew: ${d.elixirMax} draughts`, 'item'); }
  else if (w.kind === 'purse') { G.save.glimmer += w.glimmer; G.hud.addGlimmer(w.glimmer); G.hud.toast(`${w.glimmer.toLocaleString()} Glimmer`, 'item'); }
  else if (w.kind === 'core') G.takeCore(w.core);
  else if (w.kind === 'lantern') {
    const m = G.save.m, gen = m.graveGen ||= [];
    for (const g of G.world.graves || []) gen[g.i] = (gen[g.i] || 0) + 1;
    m.graves = []; syncGraves(); G.hud.toast('The graves here stir: new Revenants wait in them', 'petal');
  } else if (w.kind === 'dye') { if (!d.dyes.includes(w.dye)) d.dyes.push(w.dye); G.hud.toast(`${w.name}: find it in the Wardrobe`, 'item'); }
  d.petals -= w.price;
  if (!w.repeat) d.market.sold.push(key);
  G.tally('bought');
  G.audio.sfx('glimmer', { pitch: 1.3 });
  G.save.write();
  return true;
};
// The Wardrobe: set one part of the look (wardrobe.js); null takes the worn set's own.
G.setLook = (k, v) => { const d = G.save.data; (d.look ||= {})[k] = v; G.player.applyGear(); G.save.write(); };
// Sets whose look is known: the Knight-Errant's, and every set a piece of which is carried (older saves).
function syncLooks() {
  const d = G.save.data, L = d.looks ||= ['errant'];
  for (const it of d.gear.items) if (it.set && GEAR_SETS[it.set] && !L.includes(it.set)) L.push(it.set);
}

function firstShrine() { return G.level.titleShrine || Object.keys(G.level.shrines)[0]; }
function placeAtShrine(id) {
  const s = G.level.shrines[id] || G.level.shrines[firstShrine()];
  const p = G.player;
  p.stats = { ...G.save.stats }; p.setCharms(G.save.data.equipped || []); p.applyDeeds(); p.setPatron(G.save.data.patron);
  const d = G.save.data;
  p.arms = [...d.arms]; p.loadout = [...d.loadout]; p.forge = d.forge; p.setWeapon(d.wield);
  p.arts = [...d.arts]; p.art = d.artSel;
  p.rangedOwned = [...d.ranged]; p.rangedSel = d.rangedSel; p.k.setRanged(null, RANGED[d.rangedSel]?.kind === 'pod' ? null : d.rangedSel);
  p.spawnAt(s.spawn[0], s.spawn[1], s.yaw);
  p.elixirs = G.save.elixirMax;
  G.cam.snap(p);
}

// A mission cleared before a later one existed still opens the way on.
function syncUnlocks() {
  const d = G.save.data;
  ORDER.forEach((id, i) => { const next = ORDER[i + 1]; if (next && d.missions[id]?.cleared && !d.unlocked.includes(next)) d.unlocked.push(next); });
}
syncUnlocks();

// The Moon Tonight (moontonight.js): the real moon's phase, and the night's omens, for the mission at hand.
G.refreshTonight = (id = G.save.data.mission) => {
  G.tonight = tonight(G.settings, G.save.data.unlocked, id);
  G.player?.setMoon(G.tonight?.phase.fx);
  return G.tonight;
};
function announceTonight() {
  const T = G.tonight, key = `${G.level.id}|${Math.floor(Date.now() / 36e5)}`;
  if (!T || G.level.depth || G.tonightShown === key) return;
  G.tonightShown = key;
  G.after(7.2, () => {
    G.hud.toast(`Tonight: ${T.phase.name} — ${T.phase.desc}`, 'anima');
    if (T.omen) G.after(2.4, () => G.hud.toast(`${T.omen.name} over ${G.level.name}: ${T.omen.desc}`, 'item'));
  });
}
async function startRun() {
  G.audio.init();
  syncUnlocks();
  G.refreshTonight();
  G.traveling = false;
  timers.length = 0;
  if (G.level.id !== G.save.data.mission || !G.enemies.length || (G.level.depth && G.level.depth !== G.save.data.abyss?.depth)) {
    G.hud.fadeTo(true, .3); G.menu.close(); G.hud.loading(true);
    await setLevel(G.save.data.mission);
    G.hud.loading(false);
  }
  applyLevelLook();
  await prepareSide();
  const m = G.save.m, S = sideDef();
  if (!m.shrine) { if (S) beginSide(S, m); else { m.shrine = firstShrine(); m.kindled.push(m.shrine); } }
  G.sideEnding = false;
  grantTrophies();
  syncDeeds(); syncLooks();
  applyWorldState();
  placeAtShrine(m.shrine);
  announceTonight();
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
// The Fae Crossroads, the overworld map: from the title, a Moonwell, or a cleared mission (focused there, so any
// newly opened path is revealed from it).
G.openMap = (from = 'title', focus) => {
  syncUnlocks(); G.refreshTonight();
  G.input.wantLock = false; G.input.releaseLock();
  G.overworld.prepare(focus);
  if (from === 'cleared') G.menu.show('map', { from }); else G.menu.push('map', { from });
};
G.startMission = async id => {
  const d = G.save.data, fresh = !G.save.mission(id).shrine;
  d.mission = id; d.side = null; d.sideRun = null; G.save.write();
  await startRun();
  if (fresh) missionIntro();
};
// A side mission (sides.js), open once its mission is cleared. Each run starts afresh.
G.startSide = async id => {
  const d = G.save.data, S = SIDES[id];
  if (!S || !d.missions[S.mission]?.cleared) return false;
  d.mission = S.mission; d.side = id; d.sideRun = freshMission(); G.save.write();
  await startRun();
  G.after(1.2, () => G.hud.big(S.name, 'intro side', 5.5, S.desc));
  return true;
};
G.newGamePlus = async () => {
  const d = G.save.data;
  const keep = { stats: d.stats, glimmer: d.glimmer, elixirMax: d.elixirMax, deaths: d.deaths, time: d.time, ng: d.ng + 1, charms: d.charms, equipped: d.equipped, arms: d.arms, wield: d.wield, letters: d.letters, pixies: d.pixies, loadout: d.loadout, forge: d.forge, arts: d.arts, artSel: d.artSel,
    mastery: d.mastery, ranged: d.ranged, rangedSel: d.rangedSel, skillTip: d.skillTip, gear: d.gear, gearTip: d.gearTip, cores: d.cores, coreSlots: d.coreSlots, coreTip: d.coreTip, sides: d.sides, abyss: { ...d.abyss, depth: 1, from: 'keep' }, tally: d.tally, deeds: d.deeds, patrons: d.patrons, patron: d.patron,
    petals: d.petals, market: d.market, vials: d.vials, dyes: d.dyes, look: d.look, looks: d.looks, graveTip: d.graveTip, petalTip: d.petalTip, deedPetals: d.deedPetals };
  G.save.reset(d.ng + 1);
  Object.assign(G.save.data, keep);
  G.tally('ways', d.ng + 1, true);
  G.save.write();
  await startRun();
  G.after(1.2, () => G.hud.big(wayName(d.ng + 1), 'intro side', 6, wayDesc(d.ng + 1)));
  G.after(7.5, missionIntro);
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
  const amt = Math.round(e.T.glimmer * G.ngMul * (e.tier || 1) * (e.champion ? 2.2 : 1) * (hit.flash ? 1.5 : 1) * (G.player.has('glimmerseed') ? 1.2 : 1) * (1 + G.player.gf('glimmer') / 100) * (G.tonight?.glimmer || 1));
  if (e.spawn.grave == null) G.loot.dropFrom(e, e === G.sideTarget);   // a grave's Revenant leaves its own spoils
  G.save.glimmer += amt;
  const ty = e.spawn.type || '';
  if (ty.startsWith('revenant-')) G.tally('revenant');
  else if (e.spawn.elite === 'warden' || e === G.gatekeeper) G.tally('gatekeeper');
  else if (e.T.boss || (G.bosses.includes(e) && G.level.depth)) G.tally('warlord');
  else if (e.T.knight) G.tally('knight');
  else if (ty.startsWith('goblin') || (e.T.model || '').startsWith('goblin')) G.tally('goblin');
  else if (ty.startsWith('ratman') || (e.T.model || '').startsWith('ratman')) G.tally('ratman');
  if (e.champion) G.tally('champion');
  G.tally('glimmer', amt);
  G.hud.addGlimmer(amt);
  const p = G.player, at = { x: e.pos.x, y: e.height * .5, z: e.pos.z }, to = () => ({ x: p.pos.x, y: 1.1, z: p.pos.z });
  G.fx.wisps(at, Math.min(24, 4 + Math.round(amt / 60)), to, () => G.audio.sfx('glimmer', { vol: .5 }));
  // Souls: green motes mend, violet motes feed Faelight. They wait where they fell until you come close.
  const big = e.boss ? 3 : e.elite || e.champion ? 2 : 0;
  const life = big ? 4 * big : (Math.random() < .6 ? 1 : 0) + (hit.flash ? 1 : 0), fae = big ? 3 * big : Math.random() < .5 ? 1 : 0;
  G.fx.wisps(at, life, to, () => { p.heal(p.maxHp * .04); G.audio.sfx('glimmer', { vol: .4 }); }, 0x7dff8a, { range: 6, hover: 14, size: .24 });
  G.fx.wisps(at, fae, to, () => { p.gainAnima(5); G.audio.sfx('glimmer', { vol: .4 }); }, 0xc08cff, { range: 6, hover: 14, size: .22 });
  const S = sideDef();
  if (e.spawn.grave != null) graveFell(e);
  if (G.bosses.includes(e)) { const rest = G.bosses.filter(b => b.alive); if (rest.length) partnerFell(e, rest); else if (S) sideComplete(S); else if (abyss()) abyssWarlordFell(); else bossDefeated(); }
  else if (e === G.gatekeeper) { if (S?.kind === 'hunt') sideComplete(S); else gatekeeperDefeated(); }
  if (abyss() && !e.spawn.add && !G.bosses.includes(e)) { if (!G.level.isBoss && !abyssLeft()) depthCleared(); else abyssObjective(); }
};

// ---------------------------------------------------------------- breakables, letters and Lost Pixies
// Broken crates and urns spill a little Glimmer (more in later missions), now and then a mote of healing, and
// whatever was shut inside. A powder keg goes up a moment later.
G.onBreak = b => {
  const L = G.level, p = G.player, mult = (L.tier || 1) * (1 + (L.level || 1) / 11) * G.ngMul;
  const at = { x: b.x, y: b.h * .5 + .3, z: b.z }, to = () => ({ x: p.pos.x, y: 1.1, z: p.pos.z });
  if (b.glim[1]) {
    const amt = Math.round(rand(b.glim[0], b.glim[1]) * mult);
    G.save.glimmer += amt; G.hud.addGlimmer(amt);
    G.fx.wisps(at, Math.min(10, 2 + Math.round(amt / 40)), to, () => G.audio.sfx('glimmer', { vol: .4 }));
  }
  if (!b.blast && Math.random() < .22) G.fx.wisps(at, 1, to, () => { p.heal(p.maxHp * .04); G.audio.sfx('glimmer', { vol: .4 }); }, 0x7dff8a, { range: 6, hover: 14, size: .24 });
  if (b.blast) G.after(.18, () => blast(b));
  // Now and then a few arrows, shot or a shell for the ranged weapon carried.
  const R = RANGED[p.rangedSel];
  if (R?.ammo && !b.blast && Math.random() < .3) {
    const got = p.addAmmo(p.rangedSel, { bow: 5, rifle: 2, cannon: 1 }[p.rangedSel]);
    if (got) G.after(.3, () => G.hud.toast(`+${got} ${{ bow: 'arrows', rifle: 'shot', cannon: got > 1 ? 'shells' : 'shell' }[p.rangedSel]}`, 'item'));
  }
};

function blast(b) {
  const p = G.player, r = b.blast;
  G.fx.explosion({ x: b.x, y: .2, z: b.z }, r); G.audio.sfx('explode', { x: b.x, z: b.z }); G.cam.shake(.6, b);
  G.projectiles.hazard(b.x, b.z, 1.8, 3, 30, 'fire');
  for (const e of G.enemies) {
    if (!e.alive || Math.hypot(e.pos.x - b.x, e.pos.z - b.z) > r + e.radius) continue;
    e.takeHit({ dmg: e.boss ? 120 : 190, ki: 90, poise: 80, dir: Math.atan2(e.pos.x - b.x, e.pos.z - b.z), heavy: true });
  }
  if (p.alive && Math.hypot(p.pos.x - b.x, p.pos.z - b.z) < r * .85 + p.radius) p.receiveHit({ dmg: 75, aoe: true, heavy: true, dirYaw: Math.atan2(b.x - p.pos.x, b.z - p.pos.z) });
  G.world.smash(b.x, b.z, r);   // and the kegs beside it
}

// A letter is read in full and kept in the Journal.
function readLetter(it) {
  const d = G.save.data, key = G.level.id + ':' + it.id, first = !d.letters.includes(key);
  G.hud.letter(it.letter.title, it.letter.text, first ? 'Kept in your Journal' : '');
  G.audio.sfx('page');
  if (first) { d.letters.push(key); G.world.setLetterRead(it.id, true); G.tally('letters', d.letters.length, true); G.save.write(); }
}

// A Lost Pixie flies into the knight's wisp; each one freed adds a little health and stamina for good.
function freePixie(px) {
  const d = G.save.data, p = G.player, L = G.level, key = L.id + ':' + px.id;
  if (d.pixies.includes(key)) return;
  d.pixies.push(key); G.tally('pixies', d.pixies.length, true);
  G.world.setPixie(px.id, true);
  G.fx.wisps({ x: px.g.position.x, y: px.g.position.y, z: px.g.position.z }, 8, () => ({ x: p.pos.x, y: 1.8, z: p.pos.z }), null, 0xff9cf0);
  G.fx.ring(p.pos, 0xff9cf0, 1.8, .4, 1.2);
  G.audio.sfx('pixie');
  const here = (L.pixies || []).filter(q => d.pixies.includes(L.id + ':' + q.id)).length;
  p.setCharms(d.equipped); p.heal(p.maxHp * .02);
  G.hud.toast(`Lost Pixie freed · ${here} of ${(L.pixies || []).length} here · health and stamina +1%`, 'item');
  if (d.pixies.length === 1) G.tipAfter(.9, 'A Lost Pixie: one of the fae\'s little lights, scattered when the moon began to fade.\nEach one you free lends you its light for good: a little more health and stamina. Five hide in every mission, some shut inside crates and urns.');
  G.save.write();
}

// ---------------------------------------------------------------- charms
// A new charm goes straight into a free slot; otherwise it waits to be worn at a Moonwell.
function grantCharm(id, quiet = false) {
  const d = G.save.data, c = CHARMS[id];
  if (!c || d.charms.includes(id)) return false;
  d.charms.push(id);
  const worn = d.equipped.length < CHARM_SLOTS;
  if (worn) { d.equipped.push(id); G.player.setCharms(d.equipped); }
  if (!quiet) G.after(.6, () => G.hud.toast(`Charm: ${c.name} — ${c.desc}${worn ? '' : ' Wear it at a Moonwell.'}`, 'item'));
  return true;
}
// A Patron Spirit freed by a warlord: it waits to be pledged to at a Moonwell.
function grantPatron(id, quiet = false) {
  const d = G.save.data, P = PATRONS[id];
  d.patrons ||= ['lantern']; d.patron ||= 'lantern';
  if (!P || d.patrons.includes(id)) return false;
  d.patrons.push(id); G.tally('patrons', d.patrons.length - 1, true);
  if (!quiet) { G.hud.big(`${P.name.toUpperCase()}`, 'gold', 4.5, `${P.title} · a Patron Spirit is freed`); G.audio.sfx('rest'); G.fx.motes({ x: G.player.pos.x, y: 1.5, z: G.player.pos.z }, P.color, 60, 1.4, 3, .16, 1.6); G.after(4.8, () => G.hud.toast(`${P.name} will lend you its strength. Pledge to it at any Moonwell (Patronage).`, 'item')); }
  return true;
}
G.setPatron = id => {
  const d = G.save.data;
  if (!d.patrons?.includes(id)) return false;
  d.patron = id; G.player.setPatron(id); G.audio.sfx('rest'); G.save.write();
  return true;
};
// A weapon won from a gatekeeper or warlord: into the Arsenal, and into hand's reach if one is free.
function grantWeapon(id, quiet = false) {
  const d = G.save.data, p = G.player, A = ARMORY[id];
  if (!A || d.arms.includes(id)) return false;
  d.arms.push(id); p.arms = [...d.arms];
  if (d.loadout.length < 2) { d.loadout.push(id); p.loadout = [...d.loadout]; p.setWeapon(p.weapon); }
  if (!quiet) {
    G.after(.6, () => { G.hud.toast(`Weapon: ${A.name} — ${A.mech}`, 'item'); G.audio.sfx('pickup'); });
    G.tipAfter(1.4, `${A.name}: ${A.desc}\n${A.mech}: ${A.mechDesc}.\nChoose your two weapons in the Arsenal (pause menu or any Moonwell).`);
  }
  return true;
}
// A ranged weapon won the same way: carried at once, in place of whatever was carried before.
function grantRanged(id, quiet = false) {
  const d = G.save.data, p = G.player, R = RANGED[id];
  if (!R || d.ranged.includes(id)) return false;
  d.ranged.push(id); p.rangedOwned = [...d.ranged];
  if (!quiet) {
    readyRanged(id);
    G.after(.9, () => { G.hud.toast(`Ranged weapon: ${R.name}`, 'item'); G.audio.sfx('pickup'); });
    G.tipAfter(1.8, `${R.name}: ${R.desc}\nAim with ${G.hud.key('aim')} and ${G.hud.key('fire')} to fire; ${G.hud.key('aim')} again (or let go, on a gamepad) or guard to lower it. Ammunition is refilled at every Moonwell. Change ranged weapons in the Arsenal.`);
  }
  return true;
}
function readyRanged(id) {
  const d = G.save.data, p = G.player;
  if (!d.ranged.includes(id)) return;
  d.rangedSel = id; p.rangedSel = id; p.endAim(); p.refillAmmo();
  p.k.setRanged(null, RANGED[id].kind === 'pod' ? null : id);
}
G.readyRanged = id => { readyRanged(id); G.audio.sfx('stance', { pitch: 1.2 }); G.save.write(); };
// Gatekeepers and warlords already felled (older saves, or a mission cleared before charms) still owe theirs.
function grantTrophies() {
  const d = G.save.data;
  d.ranged ||= ['wisp']; if (!d.ranged.includes(d.rangedSel)) d.rangedSel = d.ranged[0]; d.mastery ||= {};
  d.gear ||= freshGear(); d.cores ||= {}; d.coreSlots ||= [null, null]; d.sides ||= {};
  for (const L of Object.values(LEVELS)) {
    const dead = G.save.mission(L.id).dead;
    const gateDown = L.gate && dead.includes(L.gate.guardian), bossDown = bossIds(L).every(id => dead.includes(id));
    if (L.gate?.charm && gateDown) grantCharm(L.gate.charm, true);
    if (L.bossCharm && bossDown) grantCharm(L.bossCharm, true);
    if (gateDown) for (const w of armoryFrom('gate', L.id)) grantWeapon(w, true);
    if (bossDown) for (const w of armoryFrom('boss', L.id)) grantWeapon(w, true);
    if (gateDown) for (const r of rangedFrom('gate', L.id)) grantRanged(r, true);
    if (bossDown) for (const r of rangedFrom('boss', L.id)) grantRanged(r, true);
    if (bossDown && PATRON_OF[L.id]) grantPatron(PATRON_OF[L.id], true);
  }
}
G.equipCharm = id => {
  const d = G.save.data, i = d.equipped.indexOf(id);
  if (i >= 0) d.equipped.splice(i, 1);
  else if (d.charms.includes(id) && d.equipped.length < CHARM_SLOTS) d.equipped.push(id);
  else return false;
  G.player.setCharms(d.equipped);
  G.save.write();
  return true;
};

function gatekeeperDefeated() {
  const gt = G.level.gate;
  G.save.m.dead.push(gt.guardian);
  if (gt.charm) G.after(3.4, () => { grantCharm(gt.charm); G.save.write(); });
  for (const w of armoryFrom('gate', G.level.id)) G.after(4.2, () => { grantWeapon(w); G.save.write(); });
  for (const r of rangedFrom('gate', G.level.id)) G.after(6.4, () => { grantRanged(r); G.save.write(); });
  G.save.write();
  G.slowmo = .9;
  G.after(0.9, () => {
    G.hud.big(gt.banner || 'VANQUISHED', 'gold', 4);
    G.audio.sfx('felled');
    G.hud.setBoss(null);
  });
  G.after(2.6, () => { G.world.openPortcullis(); G.audio.sfx('gate', { x: gt.x, z: gt.z }); G.hud.toast(gt.toast || 'The way opens'); });
}

// One of a pair falls: the other grieves. It mends, rages into its second phase and takes up new arts.
function partnerFell(e, rest) {
  G.slowmo = .7;
  G.hud.toast(`${e.name.split(',')[0]} falls`, 'warn');
  G.audio.sfx('felled', { vol: .6 });
  G.after(1, () => {
    for (const b of rest) {
      if (!b.alive || b.phase2) continue;
      b.phase2 = true; b.hp = Math.min(b.maxHp, b.hp + b.maxHp * .3); b.barT = 4;
      if (b.state !== 'attack') { b.endAttack(); b.state = 'engage'; b.st = 0; b.think = .1; }
      G.fx.ring(b.pos, 0x7dff8a, 3, .5);
    }
  });
}

function bossDefeated() {
  for (const id of bossIds(G.level)) if (!G.save.m.dead.includes(id)) G.save.m.dead.push(id);
  if (!G.save.m.cleared) { const pt = 5 + 2 * Math.floor(ORDER.indexOf(G.level.id) / 5); G.after(9, () => G.addPetals(pt)); }   // a warlord felled the first time
  if (G.level.bossCharm) G.after(3, () => { grantCharm(G.level.bossCharm); G.save.write(); });
  if (PATRON_OF[G.level.id]) G.after(7, () => { grantPatron(PATRON_OF[G.level.id]); G.save.write(); });
  for (const w of armoryFrom('boss', G.level.id)) G.after(3.8, () => { grantWeapon(w); G.save.write(); });
  for (const r of rangedFrom('boss', G.level.id)) G.after(6.2, () => { grantRanged(r); G.save.write(); });
  G.save.write();
  G.slowmo = 1.6;
  G.audio.music('none');
  for (const e of G.enemies) if (e.spawn.add && e.alive) e.die({});
  G.after(1.4, () => {
    G.hud.big(G.bosses.length > 1 ? 'WARLORDS VANQUISHED' : 'WARLORD VANQUISHED', 'gold felled', 6);
    G.audio.sfx('felled');
    G.hud.setBoss(null);
    G.bossFight = false;
  });
  G.after(5.2, () => { G.world.setFogGate(false); G.world.setExit(true); G.hud.toast(G.level.exitToast || 'A Pixie Gate opens'); G.audio.sfx('rest'); G.audio.music('explore'); });
}

// A side mission done: the spoils (Glimmer and gear, twice the Glimmer and an extra piece the first time),
// whatever still lies on the ground, and back to the Crossroads.
function sideComplete(S) {
  if (G.sideEnding) return;
  G.sideEnding = true;
  const d = G.save.data, p = G.player, m = G.save.m;
  for (const e of [G.sideTarget, ...G.bosses]) if (e && !m.dead.includes(e.id)) m.dead.push(e.id);
  const first = !d.sides[S.id];
  d.sides[S.id] = (d.sides[S.id] || 0) + 1; G.tally('sides');
  const gl = Math.round(S.glimmer * wayGlimmer(d.ng) * (first ? 2 : 1));
  const spoils = [G.loot.roll(1.5, first && S.moonlit ? 4 : S.minRar)];
  if (first) spoils.push(G.loot.roll(1.5, S.minRar));
  G.save.write();
  p.iframesT = 99;
  G.slowmo = 1.4;
  G.audio.music('none');
  for (const e of G.enemies) if (e.spawn.add && e.alive) e.die({});
  G.after(1.4, () => {
    G.hud.big(S.banner, 'gold felled', 5, S.name);
    G.audio.sfx('felled');
    G.hud.setBoss(null); G.hud.objective(null);
    G.bossFight = false;
  });
  // Moonpetals (market.js): a Duel pays best, and the first time best of all.
  const act = Math.floor(ORDER.indexOf(S.mission) / 5), pt = S.kind === 'duel' ? (first ? 12 + 4 * act : 6 + 2 * act) : first ? 6 + 2 * act : 3 + act;
  G.after(3.2, () => { G.save.glimmer += gl; G.hud.addGlimmer(gl); G.hud.toast(`${S.kindName} spoils: ${gl.toLocaleString()} Glimmer`, 'item'); G.audio.sfx('glimmer'); });
  G.after(3.9, () => G.addPetals(pt));
  spoils.forEach((it, i) => G.after(4 + i * .9, () => { if (!G.takeGear(it)) { G.save.glimmer += dismantleValue(it); G.hud.addGlimmer(dismantleValue(it)); } }));
  G.after(8.5, () => {
    G.loot.gather();
    G.state = 'ending'; G.controlsOn = false;
    G.hud.fadeTo(true, 1.4);
    G.after(1.5, () => {
      d.side = null; d.sideRun = null; G.save.write();
      G.hud.show(false); G.input.releaseLock();
      G.menu.show('sidecleared', { id: S.id, gl, pt, spoils: spoils.map(it => it.uid), first });
    });
  });
}
// Leave a side run for the mission itself.
G.abandonSide = () => { const d = G.save.data; if (!d.side) return; G.startMission(d.mission); };

G.onBossPhase2 = (boss) => {
  G.hud.toast(boss.T.phase2Line || G.level.phase2Line || 'The warlord rages', 'warn');
  if (!G.bosses.includes(boss)) return;   // a gatekeeper's second wind brings no one with it
  // Some arenas give way: the ice breaks into open, freezing water.
  if (G.level.breaks && !G.world.breaksOn) {
    G.world.setBreaks(true);
    for (const h of G.level.breaks) G.projectiles.hazard(h.x, h.z, h.r, Infinity, h.chill ?? 34, 'frost', true);
    G.cam.shake(.7); G.audio.sfx('shatter');
    G.hud.toast('The ice breaks', 'frost');
  }
  if (sideDef()?.kind === 'duel') return;   // a Revenant fights alone
  let i = 0;
  for (const e of G.enemies) {
    if (!e.spawn.add) continue;
    e.reset(); e.state = 'engage'; e.st = 0; e.think = .6 + i++ * .3;
    G.fx.poisonCloud(e.pos, 1.2);
  }
};

G.onFogCrossed = () => {
  if (G.bosses.some(b => b.alive) && !G.bossFight) startBossFight();
};

function startBossFight() {
  const b = G.boss;
  G.bossFight = true;
  for (const e of G.bosses) { e.reset(); e.state = 'intro'; e.st = 0; e.partner = G.bosses.find(o => o !== e) || null; }
  G.hud.setBoss(G.bosses.length > 1 ? G.bosses : b);
  G.player.lock = b;
  G.audio.sfx('roar', { x: b.pos.x, z: b.pos.z });
  G.audio.music('boss');
  G.cam.shake(.5);
}

G.onPlayerDeath = () => {
  const p = G.player, d = G.save.data;
  G.state = 'dead'; G.controlsOn = false;
  G.hud.closeMessage();
  d.deaths++; G.tally('deaths');
  d.grave = d.glimmer > 0 ? { mission: G.level.id, side: d.side || null, depth: G.level.depth || 0, x: p.pos.x, z: p.pos.z, amount: d.glimmer } : null;
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
  // In the Underbriar you wake at the last lit Moonwell, depths above.
  if (abyss() && checkpointOf(G.level.depth) !== G.level.depth) { G.enterUnderbriar(checkpointOf(G.level.depth), true); return; }
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
  p.vel.set(0, 0, 0); p.poisoned = 0; p.poison = 0; p.thaw();
  G.controlsOn = false;
  G.hud.big(first ? 'MOONWELL AWAKENED' : 'MOONWELL', 'shrine', 2.5);
  G.audio.sfx('rest');
  G.after(0.9, () => {
    if (G.state !== 'play') return;
    const gen = m.graveGen ||= [];   // a grave laid to rest holds another knight after a rest
    for (const i of m.graves || []) gen[i] = (gen[i] || 0) + 1;
    m.graves = [];
    applyWorldState();
    p.hp = p.maxHp; p.ki = p.maxKi; p.elixirs = d.elixirMax; p.poisoned = 0; p.poison = 0; p.thaw(); p.refillAmmo();
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

// The Arsenal: take a weapon in hand (the one held before goes to the back), or forge one a rank higher.
G.wieldWeapon = w => {
  const d = G.save.data, p = G.player;
  if (!d.arms.includes(w)) return;
  const back = w === d.wield ? d.loadout.find(x => x !== w) : d.wield;
  d.loadout = back ? [w, back] : [w]; d.wield = w;
  p.loadout = [...d.loadout]; p.resetChain(); p.setWeapon(w);
  G.audio.sfx('stance', { pitch: .9 });
  G.save.write();
};
// Gear (gear.js, loot.js): a piece picked up goes in the pack, and straight into use if nothing of its kind is.
G.takeGear = it => {
  const d = G.save.data, g = d.gear, p = G.player;
  if (g.items.length >= PACK) return false;
  g.items.push(it);
  if (it.set && !(d.looks ||= ['errant']).includes(it.set)) d.looks.push(it.set);   // the Wardrobe knows its look now
  const worn = it.kind === 'weapon' ? g.equip.weapons : g.equip.armor, key = it.kind === 'weapon' ? it.type : it.slot;
  if (!worn[key]) { worn[key] = it.uid; p.applyGear(); }
  const R = RARITY[it.rar];
  G.hud.toast(`${itemName(it, w => p.weaponName(w))} · Lv ${it.lvl}`, 'loot r' + it.rar);
  G.audio.sfx('pickup', { vol: .6 + it.rar * .1 });
  if (it.rar >= 3) G.fx.ring(p.pos, R.color, 2, .35);
  if (!d.gearTip) { d.gearTip = true; G.tipAfter(1, 'Gear: foes drop weapons and armour, better from elites and warlords. Each has a rarity, a level and effects, and armour of one set wakes bonuses when two or four pieces are worn. Equip it under Gear (pause menu or any Moonwell); dismantle what you won\'t wear for Glimmer.'); }
  G.save.write();
  return true;
};
// A Soul Core: new ones are set straight into an empty slot; one already held fuses into it.
G.takeCore = id => {
  const d = G.save.data, p = G.player, C = CORES[id];
  d.cores ||= {}; d.coreSlots ||= [null, null];
  const n = d.cores[id] || 0;
  if (n >= CORE_MAX) { G.save.glimmer += 600; G.hud.addGlimmer(600); G.hud.toast(`${C.name} (fully fused): 600 Glimmer`, 'loot r3'); G.save.write(); return; }
  d.cores[id] = n + 1;
  if (!n) { const i = d.coreSlots.indexOf(null); if (i >= 0) d.coreSlots[i] = id; } else G.tally('fused');
  p.applyGear();
  G.hud.toast(n ? `${C.name} fused: +${n}` : `Soul Core: ${C.name}`, 'loot r3');
  G.audio.sfx('magic'); G.fx.ring(p.pos, 0xb07aff, 2.2, .4);
  if (!d.coreTip) { d.coreTip = true; G.tipAfter(1, `Soul Cores: what a fallen foe was. Two can be set at once (under Gear). Each lends a passive, and a skill: ${G.hud.key('core0')} for the first, ${G.hud.key('core1')} for the second. Skills cost Faelight. A core found again fuses into the one you hold, and grows stronger.`); }
  G.save.write();
};
G.setCore = (slot, id) => {
  const d = G.save.data;
  if (id && !d.cores?.[id]) return false;
  const other = d.coreSlots.indexOf(id);
  if (id && other >= 0 && other !== slot) d.coreSlots[other] = d.coreSlots[slot];
  d.coreSlots[slot] = id || null;
  G.player.applyGear(); G.audio.sfx('stance', { pitch: .8 }); G.save.write();
  return true;
};
G.equipGear = uid => {
  const d = G.save.data, g = d.gear, it = g.items.find(x => x.uid === uid);
  if (!it) return false;
  if (it.kind === 'weapon') g.equip.weapons[it.type] = uid; else g.equip.armor[it.slot] = uid;
  G.player.applyGear(); G.audio.sfx('stance', { pitch: .9 }); G.save.write();
  return true;
};
const equippedUids = g => new Set([...Object.values(g.equip.weapons), ...Object.values(g.equip.armor)]);
G.dismantleGear = uids => {
  const d = G.save.data, g = d.gear, worn = equippedUids(g);
  let got = 0, n = 0;
  g.items = g.items.filter(it => { if (!uids.includes(it.uid) || worn.has(it.uid)) return true; got += dismantleValue(it); n++; return false; });
  if (!n) return 0;
  G.save.glimmer += got; G.hud.addGlimmer(got); G.hud.glimmerShown = G.save.glimmer; G.tally('dismantled', n);
  G.audio.sfx('shatter', { vol: .5 }); G.save.write();
  return got;
};
// Everything not worn at or below a rarity.
G.dismantleBelow = rar => { const g = G.save.data.gear, worn = equippedUids(g); return G.dismantleGear(g.items.filter(it => it.rar <= rar && !worn.has(it.uid)).map(it => it.uid)); };

// The Moonwell's forge (gear.js): reroll one of a piece's effects, or raise its level to another piece's of the
// same kind (a weapon of the same type, armour for the same slot), which is consumed.
G.reforge = (uid, i) => {
  const d = G.save.data, it = d.gear.items.find(x => x.uid === uid), cost = it && reforgeCost(it);
  if (!it || !it.fx[i] || G.save.glimmer < cost) return false;
  G.save.glimmer -= cost; G.hud.glimmerShown = G.save.glimmer;
  it.fx[i] = rerollFx(it, i);
  G.player.applyGear(); G.audio.sfx('levelUp'); G.audio.sfx('shatter', { vol: .3 }); G.tally('smithed');
  G.save.write();
  return true;
};
G.soulMatch = (uid, fromUid) => {
  const d = G.save.data, g = d.gear, it = g.items.find(x => x.uid === uid), fod = g.items.find(x => x.uid === fromUid), worn = equippedUids(g);
  if (!it || !fod || fod === it || worn.has(fod.uid) || fod.lvl <= it.lvl || (it.kind === 'weapon' ? fod.type !== it.type : fod.slot !== it.slot)) return false;
  const cost = soulMatchCost(it, fod);
  if (G.save.glimmer < cost) return false;
  G.save.glimmer -= cost; G.hud.glimmerShown = G.save.glimmer;
  it.lvl = fod.lvl; g.items = g.items.filter(x => x !== fod);
  G.player.applyGear(); G.audio.sfx('levelUp'); G.tally('smithed');
  G.save.write();
  return true;
};

// Skills (skills.js): spend a weapon's skill points on one of its skills, once what it needs is learned.
G.learnSkill = (w, id) => {
  const d = G.save.data, m = ((d.mastery ||= {})[w] ||= { xp: 0, learned: [] }), tree = treeFor(w), t = tree.find(x => x.id === id);
  if (!t || !canLearn(tree, m.learned, id) || pointsAt(m.xp) - treeCost(m.learned) < t.cost) return false;
  m.learned.push(id);
  G.audio.sfx('levelUp');
  const p = G.player; G.fx.motes({ x: p.pos.x, y: .8, z: p.pos.z }, 0x9ff3ff, 24, .6, 2, .1, 1);
  G.save.write();
  return true;
};
G.forgeWeapon = w => {
  const sv = G.save, d = sv.data, rank = d.forge[w] || 0, cost = forgeCost(rank);
  if (rank >= FORGE.max || sv.glimmer < cost) return false;
  sv.glimmer -= cost; d.forge[w] = rank + 1;
  G.hud.glimmerShown = sv.glimmer;
  G.audio.sfx('levelUp'); G.audio.sfx('shatter', { vol: .4 });
  const p = G.player; G.fx.motes({ x: p.pos.x, y: .8, z: p.pos.z }, 0xffcf8a, 30, .6, 2, .1, 1);
  sv.write();
  return true;
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
    if (it.kind === 'item' && (it.taken || it.hidden)) continue;   // an item still shut in a crate can't be picked up through it
    if (it.kind === 'fog' && (w.fogGate.gone || G.bossFight || w.sealSide(p.pos.x, p.pos.z) > -1.1 || !G.bosses.some(b => b.alive))) continue;
    if (it.kind === 'exit' && !w.exitGate.on) continue;
    if (it.kind === 'grave' && (!it.grave.on || !it.grave.lit || G.graveFoe || G.bossFight)) continue;
    const d = Math.hypot(p.pos.x - it.x, p.pos.z - it.z);
    if (d < it.r && d < bd) { bd = d; best = it; }
  }
  return best;
}

function interact(it) {
  const p = G.player, d = G.save.data, m = G.save.m;
  switch (it.kind) {
    case 'shrine':
      if (it.shrine.dim) { G.hud.toast('This Moonwell is dim: only those past a warlord burn', 'warn'); G.audio.sfx('ui'); break; }
      rest(it.shrine); break;
    case 'message': G.hud.message(it.text); G.audio.sfx('ui'); break;
    case 'grave':
      G.controlsOn = false; G.input.wantLock = false; G.input.releaseLock();
      G.menu.show('grave', { i: it.i, K: G.graveKnight(it.i) }); G.audio.sfx('page');
      break;
    case 'letter': readLetter(it); break;
    case 'item': {
      const item = it.item;
      m.items.push(item.id);
      G.world.setItemTaken(item.id, true);
      if (item.kind === 'grace') { if (d.elixirMax < 8) { d.elixirMax++; p.elixirs++; } else { G.save.glimmer += 400; G.hud.addGlimmer(400); } }
      if (item.kind === 'glimmer') { G.save.glimmer += item.amount; G.hud.addGlimmer(item.amount); }
      if (item.kind === 'dew') p.elixirs = Math.min(d.elixirMax, p.elixirs + 1);
      if (item.kind === 'charm') {
        const first = !d.charms.length;
        grantCharm(item.charm, true);
        if (first) G.tipAfter(.8, 'Charms bend the rules a little. Up to three can be worn at once; change them at any Moonwell.');
      }
      if (item.kind === 'weapon' && !d.arms.includes(item.weapon)) {
        d.arms.push(item.weapon); p.arms = [...d.arms];
        if (d.loadout.length < 2) { d.loadout.push(item.weapon); p.loadout = [...d.loadout]; }
        p.setWeapon(p.weapon);
        G.tipAfter(.8, (item.tip || item.desc) + (d.arms.length > 2 ? '\nYou carry two weapons at a time: choose them in the Arsenal (pause menu or any Moonwell), and forge them stronger at a Moonwell.' : ''));
      }
      if (item.kind === 'art' && !d.arts.includes(item.art)) {
        d.arts.push(item.art); p.arts = [...d.arts]; p.artUses[item.art] = ARTS[item.art]?.uses || 0;   // ready at once
        G.tipAfter(.8, item.tip || item.desc);
      }
      const c = item.kind === 'charm' && CHARMS[item.charm];
      G.hud.toast(c ? `${c.name} — ${c.desc}` : `${item.label} — ${item.desc}`, 'item');
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
      if (abyss()) { descend(); break; }
      G.state = 'ending'; G.controlsOn = false;
      p.poisoned = 0; p.poison = 0; p.thaw(); p.iframesT = 99;
      // Mission cleared: unlock the next one.
      m.cleared = true; G.tally('missions');
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
  inp.ctx = { menu: G.menu.open || G.hud.messageOpen, aiming: !!G.player?.aiming };
  inp.poll(rdt);

  // Menus eat input first.
  const menuWasOpen = G.menu.open;
  if (menuWasOpen) { G.menu.nav(inp); if (G.overworld.active) G.overworld.update(rdt, inp); inp.pressed.clear(); }   // a button that closes a menu shouldn't also act in game

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
  // The world waits while a menu is open, and while a wisp's words, a letter or a tip are being read.
  const paused = G.state === 'play' && ((G.menu.open && G.menu.top?.screen !== 'shrine') || (G.hud.messageOpen && G.settings.readPause !== false));
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
  if (draw) { if (G.overworld.active) G.overworld.render(renderer); else renderer.render(scene, camera); }
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
  // A pair's second phase comes when one of them falls, not from wounds.
  for (const b of G.bosses) if (b.alive && G.bossFight && !b.phase2 && !b.T.duo && b.hp < b.maxHp * (b.T.phase2At ?? .5)) b.phase2 = true;
  const gf = G.graveFoe;
  if (gf?.alive && !gf.phase2 && gf.hp < gf.maxHp * (gf.T.phase2At ?? .5)) gf.phase2 = true;
  const w = G.gatekeeper;
  if (w && w.alive) {
    const engaged = w.aware && w.state !== 'return' && w.distToPlayer() < 22;
    if (engaged && w.T.phase2 && !w.phase2 && w.hp < w.maxHp * (w.T.phase2At ?? .5)) w.phase2 = true;
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
  if (graveHere(gd) && p.alive && G.state === 'play' && Math.hypot(p.pos.x - gd.x, p.pos.z - gd.z) < 1.3) {
    G.save.glimmer += gd.amount; G.hud.addGlimmer(gd.amount);
    G.fx.wisps({ x: gd.x, y: 1, z: gd.z }, 16, () => ({ x: p.pos.x, y: 1.1, z: p.pos.z }), () => G.audio.sfx('glimmer', { vol: .5 }), 0x9dff9a);
    G.hud.toast('Echo reclaimed', 'item');
    G.save.data.grave = null; G.save.write(); updateGrave();
  }
  if (grave.visible) { echoAnim.update(rdt, { speed: 0 }); grave.userData.core.rotation.y += rdt * 2; grave.userData.core.position.y = 1.9 + Math.sin(G.time * 2) * .1; if (Math.random() < rdt * 20) G.fx.motes({ x: grave.position.x, y: .3, z: grave.position.z }, 0x9dff9a, 1, .3, 1.2, .08, 1); }

  G.loot.update(rdt);
  // Lost Pixies are freed by coming close.
  if (G.state === 'play' && p.alive) for (const px of G.world.pixieList) {
    if (px.taken || px.hidden) continue;
    if (Math.hypot(p.pos.x - px.x, p.pos.z - px.z) < 1.5 && Math.abs(p.pos.y + 1 - px.y) < 1.9) freePixie(px);
    else if (Math.random() < rdt * 4 && Math.hypot(p.pos.x - px.x, p.pos.z - px.z) < 40) G.fx.motes(px.g.position, 0xffb8f4, 1, .1, .3, .06, .9);
  }

  // Area names.
  const area = G.world.areaAt(p.pos.x, p.pos.z);
  if (area && area.id !== G.lastArea && G.state === 'play') { G.lastArea = area.id; G.hud.banner(area.name); }
  const L = G.level;
  scene.fog.density = damp(scene.fog.density, L.fog.byArea?.[area?.id] ?? L.fog.base, 1.5, rdt);

  // Ambient particles: embers, fireflies, falling leaves.
  if (Math.random() < rdt * 10) G.fx.motes({ x: p.pos.x + rand(-12, 12), y: rand(.2, 3), z: p.pos.z + rand(-12, 12) }, L.motes?.[area?.id] ?? L.motes?.base ?? 0xffb070, 1, .1, .25, .07, 4);
  if (L.leaves && Math.random() < rdt * 6) G.fx.leaf({ x: p.pos.x + rand(-10, 10), y: rand(5, 8), z: p.pos.z + rand(-10, 10) }, L.leafColors);
  if (L.snow) for (let i = 0; i < 2; i++) if (Math.random() < rdt * 22) G.fx.leaf({ x: p.pos.x + rand(-14, 14), y: rand(4, 10), z: p.pos.z + rand(-14, 14) }, L.leafColors);
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
