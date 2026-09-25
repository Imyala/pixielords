// Rooms and passages: a level laid out as rectangles joined by straight passages, the way the Underbriar and
// the second act's missions are built. A passage runs north-south (from one room's north wall to the next
// room's south wall) or east-west, at a given x (or z) and width; the rooms' walls are raised with a gap
// wherever a passage meets them, and the passage gets walls of its own down both sides.
//   rooms:  [{ id, x0, z0, x1, z1, edge, open: ['n', ...] }]   edge: how its sides are walled (below)
//   passes: [{ a, b, at, w, edge }]                             a and b are room ids; b lies north or east of a
// An edge is 'wall' (masonry, { mat, h, crenel }), 'cliff', 'palisade', 'balustrade', 'icefall', 'thorn'
// (a hedge of briar), or 'none'; a function (w, x0, z0, x1, z1) builds anything else.
import * as THREE from 'three';

// Where each passage runs, and the gaps it leaves in the rooms it joins.
export function joinRooms(rooms, passes) {
  const by = Object.fromEntries(rooms.map(r => [r.id, r]));
  for (const r of rooms) r.doors = [];
  return passes.map(p => {
    const a = by[p.a], b = by[p.b];
    const ns = b.z0 >= a.z1 - .01;
    if (ns) {
      a.doors.push({ side: 'n', at: p.at, w: p.w }); b.doors.push({ side: 's', at: p.at, w: p.w });
      return { ...p, ns: true, x0: p.at - p.w / 2, x1: p.at + p.w / 2, z0: a.z1, z1: b.z0 };
    }
    a.doors.push({ side: 'e', at: p.at, w: p.w }); b.doors.push({ side: 'w', at: p.at, w: p.w });
    return { ...p, ns: false, x0: a.x1, x1: b.x0, z0: p.at - p.w / 2, z1: p.at + p.w / 2 };
  });
}

// One stretch of edge.
export function edge(w, kind, x0, z0, x1, z1, o = {}) {
  if (Math.hypot(x1 - x0, z1 - z0) < .6 || !kind || kind === 'none') return;
  if (typeof kind === 'function') return kind(w, x0, z0, x1, z1);
  switch (kind) {
    case 'cliff': return w.cliff(x0, z0, x1, z1, { h: o.h ?? 7.5 });
    case 'palisade': return w.palisade(x0, z0, x1, z1, o.h ?? 4.6);
    case 'balustrade': return w.balustrade(x0, z0, x1, z1);
    case 'icefall': return w.icefall(x0, z0, x1, z1, o.h ?? 7);
    case 'thorn': return thornHedge(w, x0, z0, x1, z1, o.h ?? 4.2);
    default: return w.wall(x0, z0, x1, z1, { h: o.h ?? 7, mat: o.mat || 'wall', crenel: o.crenel ?? (o.mat || 'wall') === 'wall' });
  }
}

// Walls round every room (with gaps for its doors and any side left open) and down both sides of every passage.
export function raiseRooms(w, rooms, corrs, def = {}) {
  for (const rm of rooms) {
    const kind = rm.edge ?? def.edge ?? 'wall', o = { ...def, ...rm.o };
    const side = (s, a0, a1, fixed, horiz) => {
      if (rm.open?.includes(s)) return;
      const gaps = rm.doors.filter(d => d.side === s).map(d => [d.at - d.w / 2, d.at + d.w / 2]).sort((a, b) => a[0] - b[0]);
      let from = a0;
      for (const [g0, g1] of gaps) { if (horiz) edge(w, kind, from, fixed, g0, fixed, o); else edge(w, kind, fixed, from, fixed, g0, o); from = g1; }
      if (horiz) edge(w, kind, from, fixed, a1, fixed, o); else edge(w, kind, fixed, from, fixed, a1, o);
    };
    side('s', rm.x0, rm.x1, rm.z0, true); side('n', rm.x0, rm.x1, rm.z1, true);
    side('w', rm.z0, rm.z1, rm.x0, false); side('e', rm.z0, rm.z1, rm.x1, false);
  }
  for (const c of corrs) {
    const kind = c.edge ?? def.passEdge ?? def.edge ?? 'wall', o = { ...def, ...c.o };
    if (c.ns) { edge(w, kind, c.x0, c.z0, c.x0, c.z1, o); edge(w, kind, c.x1, c.z0, c.x1, c.z1, o); }
    else { edge(w, kind, c.x0, c.z0, c.x1, c.z0, o); edge(w, kind, c.x0, c.z1, c.x1, c.z1, o); }
  }
}

// Areas for the HUD's banners, one per named room.
export const roomAreas = rooms => rooms.filter(r => r.name).map(r => ({ id: r.id, name: r.name, x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 }));

// A hedge of briar: a dark bank of thorny stems, as solid as a wall.
function thornHedge(w, x0, z0, x1, z1, h) {
  const M = w.mats;
  M.briar ||= w.cutout(new THREE.MeshStandardMaterial({ color: 0x2a1e24, emissive: 0x1a0a1a, roughness: .9, flatShading: true }));
  M.thornleaf ||= w.cutout(new THREE.MeshStandardMaterial({ color: 0x24341e, roughness: 1, flatShading: true }));
  const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), rot = Math.atan2(-dz, dx), R = w.R;
  for (let s = .5; s < L; s += 1.1) {
    const px = x0 + dx * s / L, pz = z0 + dz * s / L, hh = h * (.8 + R() * .4);
    const g = w.rock(1, Math.floor(R() * 999), .35); g.scale(.9, hh * .55, .8); g.rotateY(rot + R()); g.translate(px, hh * .45, pz); w.batch('thornleaf', g);
    for (let k = 0; k < 3; k++) {
      const t = new THREE.ConeGeometry(.07, .7, 4); t.rotateZ(Math.PI / 2 + (R() - .5)); t.rotateY(R() * 6.28);
      t.translate(px + (R() - .5) * 1.2, .5 + R() * hh, pz + (R() - .5) * 1.2); w.batch('briar', t);
    }
  }
  return w.addBox((x0 + x1) / 2, (z0 + z1) / 2, L / 2 + .5, .7, rot, h);
}

// Floors under every room and passage; slab: a stone block beneath each, for platforms hung in the sky.
export function floorRooms(w, rooms, corrs, mat, o = {}) {
  for (const r of [...rooms, ...corrs]) {
    const m = r.floor || mat;
    w.floor(r.x0 - .6, r.z0 - .6, r.x1 + .6, r.z1 + .6, m, o.tile || 4, r.floorY ?? .004);
    if (o.slab) { const s = new THREE.BoxGeometry(r.x1 - r.x0 + 1.2, 3, r.z1 - r.z0 + 1.2); s.translate((r.x0 + r.x1) / 2, -1.5, (r.z0 + r.z1) / 2); w.batch(o.slab, s); }
  }
}

// Points inside a room, clear of what must stay clear (spawns, items, shrines, doors), for decor.
export function scatter(R, room, n, keep, o = {}) {
  const m = o.margin ?? 2, out = [], gap = o.gap ?? 2.2;
  const doors = (room.doors || []).map(d => d.side === 'n' ? [d.at, room.z1] : d.side === 's' ? [d.at, room.z0] : d.side === 'e' ? [room.x1, d.at] : [room.x0, d.at]);
  for (let t = 0; t < n * 12 && out.length < n; t++) {
    const x = room.x0 + m + R() * (room.x1 - room.x0 - m * 2), z = room.z0 + m + R() * (room.z1 - room.z0 - m * 2);
    if (o.edge && Math.min(x - room.x0, room.x1 - x, z - room.z0, room.z1 - z) > m + o.edge) continue;
    if (doors.some(([dx, dz]) => Math.hypot(dx - x, dz - z) < 4)) continue;
    if (keep.some(k => Math.hypot(k.x - x, k.z - z) < (k.r ?? 2))) continue;
    if (out.some(p => Math.hypot(p.x - x, p.z - z) < gap)) continue;
    out.push({ x, z });
  }
  return out;
}
