// Shortcuts, as Nioh's and the old souls-games' are: a way back from deep in a mission to its first Moonwell, shut
// by a barred gate that opens only from the far side. Walk the mission, reach the room of its second Moonwell,
// find the hidden way out of it, follow it back, lift the bar, and the loop is open for good (a rest, a fall
// or a New Game+ within that run leave it open; each side run has its own).
//
// For the missions built from rooms (rooms.js), the way is laid out here, before the level is built: a
// passage runs out of the second Moonwell's room, round the outside of every room between, and back into the
// first Moonwell's room. Only the two doorways go into the level's own rooms (so their walls are raised with
// gaps); the way itself is raised here, apart, so nothing the level scatters through its rooms lands in it.
// The first act's hand-built missions give their own (L.shortcutWay: the same pieces, placed by hand).
// world.js builds it; main.js opens the gate.
import * as THREE from 'three';
import { raiseRooms } from './levels/rooms.js';

const W = 5, GAP = 2.2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// A way, from its measures: side ('e' or 'w': which side of the level it runs down), X (its spine's near x),
// zA and zB (where it meets the first and the second Moonwell's rooms), xA and xB (the x of those rooms' walls).
export function way({ side, X, zA, zB, xA, xB }) {
  const spine = { x0: X, x1: X + W, z0: zA - W / 2 - 1.5, z1: zB + W / 2 + 1.5 };
  const la = side === 'e' ? { x0: xA, x1: X, z0: zA - W / 2, z1: zA + W / 2 } : { x0: X + W, x1: xA, z0: zA - W / 2, z1: zA + W / 2 };
  const lb = side === 'e' ? { x0: xB, x1: X, z0: zB - W / 2, z1: zB + W / 2 } : { x0: X + W, x1: xB, z0: zB - W / 2, z1: zB + W / 2 };
  const back = side === 'e' ? 'w' : 'e', grow = (r, k) => ({ x0: r.x0 - k, x1: r.x1 + k, z0: r.z0 - k, z1: r.z1 + k });
  // cuts: where the way meets its rooms (a hand-built level's walls there are split round it); keepOut: the way
  // itself, which the level's scenery leaves clear.
  const into = (r, x) => side === 'e' ? { ...r, x0: Math.min(r.x0, x - 3.5) } : { ...r, x1: Math.max(r.x1, x + 3.5) };
  return { id: 'hidden', gx: (la.x0 + la.x1) / 2, gz: zA, openSign: side === 'e' ? 1 : -1, ns: false, floor: [spine, la, lb],
    cuts: [into({ ...la, z0: la.z0 + .15, z1: la.z1 - .15 }, xA), into({ ...lb, z0: lb.z0 + .15, z1: lb.z1 - .15 }, xB)], keepOut: [spine, la, lb].map(r => grow(r, 1.4)),
    room: { id: 'hiddenway', ...spine, doors: [{ side: back, at: zA, w: W }, { side: back, at: zB, w: W }] }, corrs: [{ ns: false, ...la }, { ns: false, ...lb }] };
}

// Plan (once per level): { id, gx, gz, openSign, ns } for the gate, or null if no clear way was found.
export function planShortcut(L) {
  if (L._sc !== undefined) return L._sc;
  L._sc = null;
  if (L.depth || L.yard || !L.shrines) return null;
  if (L.shortcutWay) {
    const sc = L._sc = way(L.shortcutWay);
    L.areas = [...(L.areas || []), { id: 'hiddenway', name: L.shortcutName || 'The Hidden Way', ...sc.floor[0] }];
    return sc;
  }
  if (!L.rooms || !L.corrs) return null;
  const ids = Object.keys(L.shrines), first = L.shrines[L.titleShrine || ids[0]], second = L.shrines[ids.find(i => L.shrines[i] !== first)];
  if (!second) return null;
  const inside = (r, s) => s.x >= r.x0 && s.x <= r.x1 && s.z >= r.z0 && s.z <= r.z1;
  const A = L.rooms.find(r => inside(r, first)), B = L.rooms.find(r => inside(r, second));
  if (!A || !B || A === B || B.z0 < A.z1) return null;
  const blocks = [...L.rooms, ...L.corrs];
  const clear = (rect, skip = []) => blocks.every(b => skip.includes(b) || rect.x1 <= b.x0 - GAP || rect.x0 >= b.x1 + GAP || rect.z1 <= b.z0 - GAP || rect.z0 >= b.z1 + GAP);
  const doorFree = (r, side, at) => !r.doors?.some(d => d.side === side && Math.abs(d.at - at) < (d.w + W) / 2 + 1);
  // Where the doors go: through the side of each room, a little way in from its corners.
  const zA = clamp((A.z0 + A.z1) / 2, A.z0 + W, A.z1 - W), zB = clamp(B.z0 + (B.z1 - B.z0) * .35, B.z0 + W, B.z1 - W);
  for (const side of ['e', 'w']) {
    const between = blocks.filter(b => b.z1 > zA - W && b.z0 < zB + W);
    const pad = 5 + (L.shortcutPad || 0);   // a level with things standing outside its rooms may ask for room to spare
    const X = side === 'e' ? Math.max(...between.map(b => b.x1)) + pad : Math.min(...between.map(b => b.x0)) - pad - W;
    const spine = { x0: X, x1: X + W, z0: zA - W / 2 - 1.5, z1: zB + W / 2 + 1.5 };
    const la = side === 'e' ? { x0: A.x1, x1: X, z0: zA - W / 2, z1: zA + W / 2 } : { x0: X + W, x1: A.x0, z0: zA - W / 2, z1: zA + W / 2 };
    const lb = side === 'e' ? { x0: B.x1, x1: X, z0: zB - W / 2, z1: zB + W / 2 } : { x0: X + W, x1: B.x0, z0: zB - W / 2, z1: zB + W / 2 };
    if (!clear(spine) || !clear(la, [A]) || !clear(lb, [B]) || !doorFree(A, side, zA) || !doorFree(B, side, zB)) continue;
    // Doorways in the two rooms' walls; the way's own walls and floor are raised by buildShortcut(). The gate
    // stands in the passage into the first Moonwell's room, barred on the hidden way's side.
    A.doors.push({ side, at: zA, w: W }); B.doors.push({ side, at: zB, w: W });
    L.areas = [...(L.areas || []), { id: 'hiddenway', name: L.shortcutName || 'The Hidden Way', ...spine }];
    return (L._sc = way({ side, X, zA, zB, xA: side === 'e' ? A.x1 : A.x0, xB: side === 'e' ? B.x1 : B.x0 }));
  }
  return null;
}

// The way (its walls, as the level asks: L.shortcutEdge, or old masonry), and its gate.
export function buildShortcutGate(w, sc) {
  const cuts = w.cuts, keep = w.keepOut; w.cuts = w.keepOut = null;   // the way's own walls stand where the cuts are
  if (sc.room) raiseRooms(w, [sc.room], sc.corrs, w.level.shortcutEdge || { edge: 'wall', h: 6, mat: 'wall', crenel: false });
  w.cuts = cuts; w.keepOut = keep;
  // Floors under the way (a hair above any the level laid, so they never fight).
  for (const r of sc.floor || []) w.floor(r.x0, r.z0, r.x1, r.z1, 'floor', 4, .015);
  return buildGate(w, sc);
}

// A gate: posts, a lintel, iron bars that lift, and a bar across them on one side (sc.openSign). Its prompts:
// kinds.open on the barred side (lift it), kinds.shut on the other (it won't give). A shortcut's by default; the
// wings (wings.js) make a wicket of it, and a vault door.
export function buildGate(w, sc, kinds = { open: 'shortcut', shut: 'barred', openPrompt: 'Lift the bar', shutPrompt: 'Try the gate' }) {
  const g = new THREE.Group(), iron = w.mats.iron, wood = w.mats.wood;
  const along = sc.ns;   // a gate across a north-south passage spans x; across an east-west one, z
  const span = (sc.w || W) + .2, H = 4.2;
  const post = new THREE.BoxGeometry(.5, H + .6, .5);
  for (const k of [-1, 1]) { const m = new THREE.Mesh(post, wood); m.position.set(along ? k * span / 2 : 0, (H + .6) / 2, along ? 0 : k * span / 2); m.castShadow = true; g.add(m); }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(along ? span + .6 : .6, .5, along ? .6 : span + .6), wood); lintel.position.y = H + .6; g.add(lintel);
  const bars = new THREE.Group();
  const bar = new THREE.CylinderGeometry(.06, .06, H, 6);
  for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(bar, iron); const u = (i + .5) / 10 - .5; m.position.set(along ? u * span : 0, H / 2, along ? 0 : u * span); m.castShadow = true; bars.add(m); }
  for (const y of [.8, 2.4, 3.8]) { const m = new THREE.Mesh(new THREE.BoxGeometry(along ? span : .12, .14, along ? .12 : span), iron); m.position.y = y; bars.add(m); }
  // The bar itself, across the gate on its far side: lifted, it is gone.
  const beam = new THREE.Mesh(new THREE.BoxGeometry(along ? span + .4 : .28, .28, along ? .28 : span + .4), wood);
  beam.position.set(along ? 0 : sc.openSign * .35, 1.6, along ? sc.openSign * .35 : 0);
  if (sc.lock) {   // a vault's: a padlock on the bar
    const lock = new THREE.Mesh(new THREE.BoxGeometry(.34, .4, .34), w.mats.gold || iron); lock.position.set(along ? 0 : sc.openSign * .2, -.1, along ? sc.openSign * .2 : 0); beam.add(lock);
  }
  g.add(bars, beam);
  g.position.set(sc.gx, 0, sc.gz);
  w.group.add(g);
  const col = w.addBox(sc.gx, sc.gz, along ? span / 2 : .3, along ? .3 : span / 2, 0, 5);
  const gate = { sc, g, bars, beam, col, open: false, t: 0 };
  let last = null;
  w.anim.push(t => {
    const dt = last === null ? 0 : Math.min(.1, t - last); last = t;
    if (!gate.open || gate.t >= 1) return;
    gate.t = Math.min(1, gate.t + dt * .8);
    bars.position.y = gate.t * (H - .3);
  });
  const off = 1.5 * sc.openSign;
  w.interactables.push({ kind: kinds.open, gate, x: along ? sc.gx : sc.gx + off, z: along ? sc.gz + off : sc.gz, r: 2, prompt: kinds.openPrompt });
  if (kinds.shut) w.interactables.push({ kind: kinds.shut, gate, x: along ? sc.gx : sc.gx - off, z: along ? sc.gz - off : sc.gz, r: 2, prompt: kinds.shutPrompt });
  return gate;
}
// Open (for good) or shut again (a new run).
export function setShortcut(gate, open, now = false) {
  if (!gate) return;
  gate.open = open; gate.col.on = !open; gate.beam.visible = !open;
  if (!open || now) { gate.t = open ? 1 : 0; gate.bars.position.y = open ? 3.9 : 0; }
}

// The parts of a straight segment that lie outside every rect (a rect's edges count as outside).
export function clipSegment(x0, z0, x1, z1, rects) {
  let spans = [[0, 1]];
  for (const r of rects) {
    // Liang-Barsky: the stretch [t0, t1] of the segment strictly inside r.
    let t0 = 0, t1 = 1;
    const dx = x1 - x0, dz = z1 - z0;
    const clipT = (pq, qq) => { if (Math.abs(pq) < 1e-9) return qq > 0; const t = qq / pq; if (pq < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } return true; };
    if (!(clipT(-dx, x0 - r.x0) && clipT(dx, r.x1 - x0) && clipT(-dz, z0 - r.z0) && clipT(dz, r.z1 - z0)) || t1 - t0 < 1e-4) continue;
    spans = spans.flatMap(([a, b]) => (t1 <= a || t0 >= b) ? [[a, b]] : [[a, Math.max(a, t0)], [Math.min(b, t1), b]].filter(([u, v]) => v - u > 1e-4));
  }
  return spans.map(([a, b]) => [x0 + (x1 - x0) * a, z0 + (z1 - z0) * a, x0 + (x1 - x0) * b, z0 + (z1 - z0) * b]);
}
// Hand-built levels: split walls, cliffs, palisades and icefalls round the cuts, and leave scenery out of the way.
export function guardBuilders(w) {
  for (const name of ['wall', 'cliff', 'palisade', 'icefall', 'balustrade', 'timber']) {
    const orig = w[name].bind(w);
    w[name] = (x0, z0, x1, z1, ...rest) => {
      if (!w.cuts) return orig(x0, z0, x1, z1, ...rest);
      let out;
      for (const [a, b, c, d] of clipSegment(x0, z0, x1, z1, w.cuts)) if (Math.hypot(c - a, d - b) > .35) out = orig(a, b, c, d, ...rest);
      return out;
    };
  }
  const inKeep = (x, z) => w.keepOut?.some(r => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1);
  for (const name of ['pillar', 'deadTree', 'tree', 'pine', 'boulder', 'hut', 'campfire', 'crystal', 'cart', 'stalagmite', 'nest', 'snowPine', 'drift', 'snowBoulder', 'arch', 'moonpool', 'totem', 'banner', 'brazier', 'pile']) {
    const orig = w[name].bind(w);
    w[name] = (x, z, ...rest) => inKeep(x, z) ? undefined : orig(x, z, ...rest);
  }
  const brk = w.breakable.bind(w);
  w.breakable = (kind, x, z, ...rest) => inKeep(x, z) ? undefined : brk(kind, x, z, ...rest);
}
