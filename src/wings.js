// Wings: every mission's optional wing, as Nioh's missions have their side paths. Off one of the mission's early
// rooms, a passage (trapped: a blade swings across it, and a plate in its floor looses darts) leads out to a court
// where a Wanderer walks its rounds, a champion of the mission's own kind with its guards. Felled, it gives up a
// key to the vault beyond the court (a Moonlit piece, Moonsteel, Moonpetals). A wall of the court is no wall at
// all: strike it, and a forgotten room lies behind (a cache: Fabled gear and Moonsteel). And from the court's far
// corner a passage runs on to a later room of the mission, shut by a wicket bolted from that room's side: open it
// from there, and it is a second shortcut.
//
// The wing is planned before the level is built (like the shortcut, shortcuts.js): for the missions built from
// rooms, from the rooms themselves (a host room before the gatekeeper, a later room for the wicket, on the side the
// shortcut doesn't take); the first act's hand-built missions give theirs (L.wingWay). world.js raises it; main.js
// runs its traps and remembers its key, vault and wicket.
import * as THREE from 'three';
import { raiseRooms } from './levels/rooms.js';
import { buildGate } from './shortcuts.js';
import { TYPES } from './enemies.js';

const W = 5, GAP = 2.2;
export const WING_NAMES = {
  keep: 'The Old Barracks', rotwood: 'The Charcoal Burners\' Clearing', deep: 'The Flooded Stope', moonspire: 'The Orrery', frostmere: 'The Ice-Cutters\' Yard',
  abbey: 'The Chapter House', forge: 'The Slag Pits', thornwood: 'The Briar Maze', crater: 'The Shard Field', court: 'The Hall of Mirrors',
  shore: 'The Tidepools', hollows: 'The Echo Chambers', necropolis: 'The Ossuary', umbra: 'The Penumbra', heart: 'The Chained Vault',
};

// The wing's rooms and passages, from where it leaves its host (a wall at x = hx, a door at z = hz, sgn +1 east
// or -1 west) and, if it has one, where the wicket meets a later room (a wall at x = bx, at z = bz).
export function wingLayout(sgn, hx, hz, back) {
  const X = d => hx + sgn * d, span = (a, b) => ({ x0: Math.min(X(a), X(b)), x1: Math.max(X(a), X(b)) });
  const entry = { ...span(0, 16), z0: hz - W / 2, z1: hz + W / 2 };
  const court = { ...span(16, 40), z0: hz - 13, z1: hz + 13 };
  const vaultLink = { ...span(40, 46), z0: hz - 2, z1: hz + 2 };
  const vault = { ...span(46, 56), z0: hz - 5, z1: hz + 5 };
  const cx = (court.x0 + court.x1) / 2;
  const secretLink = { x0: cx - 2.5, x1: cx + 2.5, z0: hz - 17, z1: hz - 13 };
  const secret = { x0: cx - 6, x1: cx + 6, z0: hz - 29, z1: hz - 17 };
  const near = sgn > 0 ? court.x0 : court.x1, far = sgn > 0 ? 'e' : 'w', nearSide = sgn > 0 ? 'w' : 'e';
  const out = { sgn, hx, hz, entry, court, vaultLink, vault, secretLink, secret, cx };
  out.courtDoors = [{ side: nearSide, at: hz, w: W }, { side: far, at: hz, w: 4 }, { side: 's', at: cx, w: W }];
  out.vaultDoors = [{ side: nearSide, at: hz, w: 4 }];
  out.secretDoors = [{ side: 'n', at: cx, w: W }];
  if (back) {
    // The wicket: up out of the court's north side near its inner edge, north to the later room, and in.
    const sx0 = sgn > 0 ? near + 2 : near - 2 - W;
    const spine = { x0: sx0, x1: sx0 + W, z0: court.z1, z1: back.z + W / 2 + 1.5 };
    const link = sgn > 0 ? { x0: back.x, x1: sx0, z0: back.z - W / 2, z1: back.z + W / 2 } : { x0: sx0 + W, x1: back.x, z0: back.z - W / 2, z1: back.z + W / 2 };
    out.spine = spine; out.link = link; out.back = back;
    out.courtDoors.push({ side: 'n', at: sx0 + W / 2, w: W });
    // The wicket stands just outside the later room, bolted on that room's side.
    out.wicket = { id: 'wicket', gx: back.x + sgn * 2, gz: back.z, openSign: -sgn, ns: false };
  }
  out.vaultGate = { id: 'vault', gx: sgn > 0 ? vault.x0 : vault.x1, gz: hz, openSign: -sgn, ns: false, w: 4, lock: true };
  out.secretWall = { x: cx, z: court.z0, w: W };
  // Traps: a dart plate just inside the passage, a blade swinging across it further on; fire vents in the court.
  out.plate = { x: X(4.5), z: hz };
  out.blade = { x: X(10), z: hz };
  out.vents = [{ x: X(22), z: hz + 8 }, { x: X(34), z: hz - 8 }];
  out.rects = [entry, court, vaultLink, vault, secretLink, secret, ...(back ? [out.spine, out.link] : [])];
  return out;
}

const clearOf = (blocks, skip = []) => r => blocks.every(b => skip.includes(b) || r.x1 <= b.x0 - GAP || r.x0 >= b.x1 + GAP || r.z1 <= b.z0 - GAP || r.z0 >= b.z1 + GAP);

// Plan (once per level) the wing, or null. Adds the wing's foes, finds and areas to the level.
export function planWing(L) {
  if (L._wing !== undefined) return L._wing;
  L._wing = null;
  if (L.depth || L.yard || !L.shrines || !L.spawns) return null;
  let wl = null;
  if (L.wingWay) {
    const H = L.wingWay;
    wl = wingLayout(H.side === 'w' ? -1 : 1, H.hx, H.hz, H.back);
    wl.cuts = [doorCut(wl.sgn, H.hx, H.hz), ...(H.back ? [doorCut(wl.sgn, H.back.x, H.back.z)] : [])];
    // A hand-built wall may lean or curve: the passages reach two paces inside it, so no gap opens beside them.
    const inset = r => (wl.sgn > 0 ? { ...r, x0: r.x0 - 2 } : { ...r, x1: r.x1 + 2 });
    wl.entry = inset(wl.entry); wl.rects[0] = wl.entry;
    if (wl.link) { wl.link = inset(wl.link); wl.rects[wl.rects.length - 1] = wl.link; }
  } else if (L.rooms && L.corrs) wl = planFromRooms(L);
  if (!wl) return null;
  const grow = (r, k) => ({ x0: r.x0 - k, x1: r.x1 + k, z0: r.z0 - k, z1: r.z1 + k });
  wl.keepOut = wl.rects.map(r => grow(r, 1.2));
  wl.name = WING_NAMES[L.id] || 'The Wanderer\'s Court';
  L.areas = [...(L.areas || []), { id: 'wing', name: wl.name, ...wl.court }, { id: 'wingvault', name: 'The Wanderer\'s Vault', ...wl.vault }, { id: 'wingsecret', name: 'A Forgotten Room', ...wl.secret }];
  populate(L, wl);
  return (L._wing = wl);
}

// A hand-built level's walls are split round a doorway (sgn: which way the wing lies from the wall).
function doorCut(sgn, x, z) {
  return sgn > 0 ? { x0: x - 3.5, x1: x + 1.5, z0: z - W / 2 + .15, z1: z + W / 2 - .15 } : { x0: x - 1.5, x1: x + 3.5, z0: z - W / 2 + .15, z1: z + W / 2 - .15 };
}

// The missions of rooms: a host room before the gatekeeper and a later room for the wicket, on whichever side
// is clear (the shortcut's side last).
function planFromRooms(L) {
  const inside = (r, s) => s.x >= r.x0 && s.x <= r.x1 && s.z >= r.z0 && s.z <= r.z1;
  const ids = Object.keys(L.shrines), first = L.shrines[L.titleShrine || ids[0]], second = L.shrines[ids.find(i => L.shrines[i] !== first)];
  const A = L.rooms.find(r => inside(r, first)), B = second && L.rooms.find(r => inside(r, second));
  const gateZ = L.gate?.z ?? (B ? B.z0 : Infinity), sealZ = L.seal?.z ?? Infinity;
  const blocks = [...L.rooms, ...L.corrs, ...(L._sc?.floor || [])];
  const scSide = L._sc ? (L._sc.openSign > 0 ? 'e' : 'w') : null;
  const sides = scSide === 'e' ? ['w', 'e'] : ['e', 'w'];
  const hosts = L.rooms.filter(r => r !== A && (r.z0 + r.z1) / 2 < gateZ && r.z1 - r.z0 >= 14).sort((a, b) => (b.z1 - b.z0) - (a.z1 - a.z0));
  const backs = L.rooms.filter(r => (r.z0 + r.z1) / 2 > gateZ && r.z1 < sealZ && r.z1 - r.z0 >= 12);
  const doorFree = (r, side, at) => !r.doors?.some(d => d.side === side && Math.abs(d.at - at) < (d.w + W) / 2 + 1.5);
  for (const side of sides) {
    const sgn = side === 'e' ? 1 : -1;
    for (const H of hosts) {
      const hx = sgn > 0 ? H.x1 : H.x0, hz = Math.round((H.z0 + H.z1) / 2);
      if (!doorFree(H, side, hz)) continue;
      // The wing stands clear of every room it passes: push it out past them if it must.
      for (const push of [0, 6, 12, 18]) {
        const wx = hx + sgn * push;
        const entryExtra = push ? { x0: Math.min(hx, wx), x1: Math.max(hx, wx), z0: hz - W / 2, z1: hz + W / 2 } : null;
        let best = null;
        for (const Bk of [null, ...backs]) {
          const bx = Bk ? (sgn > 0 ? Bk.x1 : Bk.x0) : 0, bz = Bk ? Math.round(Bk.z0 + (Bk.z1 - Bk.z0) * .4) : 0;
          if (Bk && !doorFree(Bk, side, bz)) continue;
          const wl = wingLayout(sgn, wx, hz, Bk ? { x: bx, z: bz } : null);
          if (Bk && (bz < wl.court.z1 + 8 || (sgn > 0 ? bx > wl.spine.x0 - 3 : bx < wl.spine.x1 + 3))) continue;
          const ok = clearOf(blocks, [H, Bk].filter(Boolean));
          const own = [wl.court, wl.vaultLink, wl.vault, wl.secretLink, wl.secret, ...(Bk ? [wl.spine] : [])];
          if (!own.every(ok) || !ok(entryExtra || wl.entry) || (Bk && !clearOf(blocks, [Bk])(wl.link))) continue;
          if (entryExtra && !clearOf(blocks, [H])(entryExtra)) continue;
          best = { wl, H, Bk, bz }; if (Bk) break;
        }
        if (!best) continue;
        const { wl } = best;
        if (push) { wl.entry = { x0: Math.min(hx, wl.entry.x0, wl.entry.x1), x1: Math.max(hx, wl.entry.x0, wl.entry.x1), z0: wl.entry.z0, z1: wl.entry.z1 }; wl.rects[0] = wl.entry; }
        H.doors.push({ side, at: hz, w: W });
        if (best.Bk) best.Bk.doors.push({ side, at: best.bz, w: W });
        wl.host = H.id; wl.backRoom = best.Bk?.id;
        return wl;
      }
    }
  }
  return null;
}

// The wing's foes and finds, from the mission's own kinds.
function populate(L, wl) {
  const S = wl.sgn, X = d => wl.hx + S * d, hz = wl.hz, C = wl.court;
  const kinds = [...new Set(L.spawns.filter(s => { const T = TYPES[s.type]; return T && !T.boss && !T.elite && !s.elite && !s.add && !T.shade; }).map(s => s.type))];
  if (!kinds.length) return;
  const melee = kinds.filter(k => TYPES[k].style !== 'ranged'), ranged = kinds.filter(k => TYPES[k].style === 'ranged');
  const strong = (melee.length ? melee : kinds).slice().sort((a, b) => TYPES[b].hp - TYPES[a].hp)[0];
  let n = 0; const pick = (list, i) => list[(i + n++) % list.length];
  const spawn = (o) => L.spawns.push({ yaw: S > 0 ? -Math.PI / 2 : Math.PI / 2, ...o, wing: true });
  const cx = wl.cx, face = S > 0 ? -Math.PI / 2 : Math.PI / 2;
  // The Wanderer walks the court's rounds.
  spawn({ id: 'wanderer', type: strong, x: cx, z: hz + 6, yaw: face, wanderer: true, affixes: ['stone', 'wrath'],
    patrol: [[C.x0 + 5, C.z0 + 5], [C.x1 - 5, C.z0 + 5], [C.x1 - 5, C.z1 - 5], [C.x0 + 5, C.z1 - 5]] });
  // Its guards: one at the passage's end, three in the court (one asleep, one with a bow if the mission has them).
  spawn({ id: 'wg1', type: pick(melee.length ? melee : kinds, 1), x: X(13.5), z: hz + 1, yaw: face });
  spawn({ id: 'wg2', type: pick(melee.length ? melee : kinds, 2), x: X(20), z: hz - 9, yaw: face });
  spawn({ id: 'wg3', type: pick(melee.length ? melee : kinds, 3), x: X(35), z: hz + 9, yaw: face, idle: 'sleep' });
  spawn({ id: 'wg4', type: ranged.length ? pick(ranged, 0) : pick(kinds, 4), x: X(37), z: hz - 2, yaw: face });
  if (wl.spine) spawn({ id: 'wg5', type: pick(melee.length ? melee : kinds, 5), x: (wl.spine.x0 + wl.spine.x1) / 2, z: (wl.spine.z0 + wl.spine.z1) / 2, yaw: 0, patrol: [[(wl.spine.x0 + wl.spine.x1) / 2, wl.spine.z0 + 4], [(wl.spine.x0 + wl.spine.x1) / 2, wl.spine.z1 - 4]] });
  // Finds: the hoard in the vault, the cache in the forgotten room.
  L.items = [...(L.items || []),
    { id: 'winghoard', x: (wl.vault.x0 + wl.vault.x1) / 2, z: hz, kind: 'hoard', label: 'The Wanderer\'s Hoard', desc: 'a Moonlit piece, Moonsteel and Moonpetals' },
    { id: 'wingcache', x: cx, z: (wl.secret.z0 + wl.secret.z1) / 2, kind: 'cache', label: 'A Forgotten Cache', desc: 'Fabled gear and Moonsteel' }];
}

// Raise the wing (its walls, floors and lights), its vault door, wicket and illusory wall, and its traps.
export function buildWing(w, wl) {
  const cuts = w.cuts, keep = w.keepOut; w.cuts = w.keepOut = null;
  const L = w.level, edge = L.wingEdge || L.shortcutEdge || { edge: 'wall', h: 6, mat: 'wall', crenel: false };
  const rooms = [{ id: 'wcourt', ...wl.court, doors: wl.courtDoors }, { id: 'wvault', ...wl.vault, doors: wl.vaultDoors }, { id: 'wsecret', ...wl.secret, doors: wl.secretDoors }];
  const corrs = [{ ns: false, ...wl.entry }, { ns: false, ...wl.vaultLink }, { ns: true, ...wl.secretLink }];
  if (wl.spine) {
    // The wicket's passage north is a long room: open at its foot into the court, a doorway in its side for the
    // link, which runs on to the later room.
    const sp = wl.spine, mid = (sp.x0 + sp.x1) / 2;
    rooms.push({ id: 'wspine', ...sp, doors: [{ side: 's', at: mid, w: W }, { side: wl.sgn > 0 ? 'w' : 'e', at: wl.back.z, w: W }] });
    corrs.push({ ns: false, ...wl.link });
  }
  raiseRooms(w, rooms, corrs, edge);
  for (const r of wl.rects) w.floor(r.x0, r.z0, r.x1, r.z1, 'floor', 4, .015);
  // Light: braziers at the court's corners, one in the vault and one in the forgotten room.
  const C = wl.court;
  for (const [x, z] of [[C.x0 + 2, C.z0 + 2], [C.x1 - 2, C.z0 + 2], [C.x0 + 2, C.z1 - 2], [C.x1 - 2, C.z1 - 2]]) w.brazier(x, z);
  w.brazier((wl.vault.x0 + wl.vault.x1) / 2 + wl.sgn * 3.5, wl.vault.z1 - 1.5, 0xffd36a);
  w.brazier(wl.secret.x0 + 1.5, wl.secret.z0 + 1.5, 0x9ff3ff, false);
  w.brazier(wl.hx + wl.sgn * 2.2, wl.hz + 1.9, 0xff8a3a, false);   // a low fire at the passage's mouth, so it can be seen from the room
  // Some wreckage in the court to fight around, and urns in the forgotten room.
  for (const [dx, dz] of [[-3, -2.5], [3, 3]]) w.pillar?.(wl.cx + dx, wl.hz + dz);
  w.breakable('crate', C.x0 + 3, wl.hz - 10, { id: 'wcrate1' }); w.breakable('barrel', C.x1 - 3, wl.hz + 10.5, { id: 'wbarrel1' });
  w.breakable('urn', wl.secret.x1 - 1.5, wl.secret.z0 + 1.5, { id: 'wurn1' }); w.breakable('urn', wl.secret.x1 - 2.5, wl.secret.z0 + 1.2, { id: 'wurn2', s: .8 });
  w.cuts = cuts; w.keepOut = keep;

  const out = { wl, gates: [] };
  out.vault = buildGate(w, wl.vaultGate, { open: 'vault', shut: null, openPrompt: 'Unlock the vault' });
  if (wl.wicket) out.wicket = buildGate(w, wl.wicket, { open: 'shortcut', shut: 'barred', openPrompt: 'Draw the bolt', shutPrompt: 'Try the door' });
  out.secret = illusoryWall(w, wl.secretWall, edge);
  out.traps = new Traps(w, wl);
  return out;
}

// A wall that isn't: it looks like the court's own, and gives way at a blow.
function illusoryWall(w, s, edge) {
  const M = w.mats, h = edge.h || 6;
  const mat = { cliff: M.rock, palisade: M.stake || M.wood, thorn: M.briar, icefall: M.ice }[edge.edge] || M[edge.mat || 'wall'] || M.wall || M.stone;
  const grp = new THREE.Group(); grp.position.set(s.x, 0, s.z);
  const m = new THREE.Mesh(new THREE.BoxGeometry(s.w + .2, h, .7), mat); m.position.y = h / 2; m.castShadow = m.receiveShadow = true; grp.add(m);
  w.group.add(grp);
  const col = w.addBox(s.x, s.z, s.w / 2 + .1, .35, 0, h);
  const b = { id: 'wingwall', kind: 'illusory', x: s.x, z: s.z, y: 0, r: s.w / 2, h, hp: 1, maxHp: 1, grp, col, bits: mat, glim: [0, 0], blast: false, sound: 'shatter',
    B: { bits: 14, size: .5, r: s.w / 2, h }, s: 1, broken: false, shake: 0, secret: true };
  w.breakables.push(b);
  return b;
}

// The wing's traps: the dart plate and the swinging blade in the passage, the fire vents in the court.
export class Traps {
  constructor(w, wl) {
    this.w = w; this.wl = wl; this.t = 0; this.cool = 0;
    const M = w.mats, iron = M.iron, wood = M.wood;
    // The blade: a beam overhead across the passage, a rod, and a crescent of iron that swings across it.
    const b = wl.blade, pivotY = 5.2, rod = 3.6;
    const g = new THREE.Group(); g.position.set(b.x, pivotY, b.z);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(.4, .4, W + .6), wood); beam.position.y = .1; w.group.add(beam); beam.position.set(b.x, pivotY + .1, b.z);
    const arm = new THREE.Group(); g.add(arm);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, rod, 6), iron); r.position.y = -rod / 2; arm.add(r);
    const blade = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, .08, 24, 1, false, 0, Math.PI), iron);
    blade.rotation.z = Math.PI / 2; blade.rotation.y = Math.PI / 2; blade.position.y = -rod - .2; arm.add(blade);
    w.group.add(g);
    this.blade = { g, arm, x: b.x, z: b.z, pivotY, rod: rod + .6 };
    // The plate: a slab in the floor that sinks when stepped on.
    const p = wl.plate;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.6, .08, 1.6), M.stone || M.wall); plate.position.set(p.x, .05, p.z); w.group.add(plate);
    this.plate = { m: plate, x: p.x, z: p.z, armed: true, fireAt: 0, rearm: 0 };
    // Vents: grates in the court floor.
    this.vents = wl.vents.map(v => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, .06, 16), iron); m.position.set(v.x, .04, v.z); w.group.add(m);
      return { ...v, m, t: Math.random() * 6 };
    });
  }
  update(G, dt) {
    const p = G.player, wl = this.wl;
    this.t += dt; this.cool = Math.max(0, this.cool - dt);
    // The blade swings across the passage (along z), low at the bottom of each swing.
    const B = this.blade, th = 1.15 * Math.sin(this.t * 2.1);
    B.arm.rotation.x = th;
    if (!p.alive || G.state !== 'play') return;
    const near = Math.abs(p.pos.x - B.x) < 30 && Math.abs(p.pos.z - B.z) < 30;
    if (!near) return;
    const bz = B.z - Math.sin(th) * B.rod, by = B.pivotY - Math.cos(th) * B.rod;
    if (this.cool <= 0 && by < 2.2 && Math.abs(p.pos.x - B.x) < .7 && Math.abs(p.pos.z - bz) < .9 && p.pos.y < 1.5) {
      this.cool = 1;
      const r = p.receiveHit({ dmg: p.maxHp * .18, heavy: true, kd: true, hyper: true, dirYaw: Math.cos(this.t * 2.1) > 0 ? Math.PI : 0, trap: true });
      if (r === 'hit' || r === 'blocked') { G.audio.sfx('hitCut', { x: B.x, z: bz }); G.fx.spark({ x: p.pos.x, y: 1.2, z: p.pos.z }, { x: 0, z: 1 }, 12, 0xffe0a0, 5); }
    }
    // The plate: stepped on, a click, and a moment later darts across the passage from its wall.
    const P = this.plate;
    if (P.armed && Math.abs(p.pos.x - P.x) < .8 && Math.abs(p.pos.z - P.z) < .8 && p.pos.y < .3) {
      P.armed = false; P.fireAt = G.time + .45; P.rearm = G.time + 3; P.m.position.y = .01;
      G.audio.sfx('glint', { x: P.x, z: P.z }); G.fx.telegraph({ x: P.x, z: P.z }, 1.6, .45, 0xff4030);
      if (!G.save.data.trapTip) { G.save.data.trapTip = true; G.hud.toast('A pressure plate: dash!', 'warn'); }
    }
    if (P.fireAt && G.time >= P.fireAt) {
      P.fireAt = 0;
      for (let i = -2; i <= 2; i++) G.fx.spark({ x: P.x + i * .15, y: 1.1 + (i % 2) * .3, z: P.z - W / 2 }, { x: 0, z: 1 }, 4, 0xd0c0a0, 9);
      G.audio.sfx('arrow', { x: P.x, z: P.z });
      if (Math.abs(p.pos.x - P.x) < 1.2 && Math.abs(p.pos.z - P.z) < W / 2 && p.pos.y < 1.6) p.receiveHit({ dmg: p.maxHp * .1, poison: 40, dirYaw: 0, projectile: true, trap: true });
    }
    if (!P.armed && P.rearm && G.time >= P.rearm) { P.armed = true; P.rearm = 0; P.m.position.y = .05; }
    // The vents: a glow, then a gout of fire, in turn.
    const inCourt = p.pos.x > wl.court.x0 && p.pos.x < wl.court.x1 && p.pos.z > wl.court.z0 && p.pos.z < wl.court.z1;
    if (!inCourt) return;
    for (const v of this.vents) {
      v.t += dt;
      if (v.t > 6) { v.t = 0; G.fx.telegraph({ x: v.x, z: v.z }, 1.9, .9, 0xff6a2a); G.after(.9, () => { G.projectiles.hazard(v.x, v.z, 1.9, 2.2, 30, 'fire'); G.fx.ring({ x: v.x, z: v.z }, 0xff6a2a, 2, .4); }); }
    }
  }
}
