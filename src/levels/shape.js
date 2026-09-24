// Layout helpers shared by the outdoor and underground missions: rings of wall around a clearing and
// winding paths between them. A path is a list of [x, z, halfWidth] points.

// A point on a circle; a = 0 is due south (toward -z), angles turn toward +x.
export const ring = (c, r, a) => [c.x + Math.sin(a) * r, c.z - Math.cos(a) * r];

// The two edges of a path, offset by its half-width along the averaged normal.
export function pathSides(path) {
  const L = [], R = [];
  for (let i = 0; i < path.length; i++) {
    const [x, z, w] = path[i], a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)];
    let nx = b[1] - a[1], nz = -(b[0] - a[0]);
    const n = Math.hypot(nx, nz); nx /= n; nz /= n;
    R.push([x + nx * w, z + nz * w]); L.push([x - nx * w, z - nz * w]);
  }
  return { L, R };
}

export function distToPath(path, x, z) {
  let best = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, az] = path[i], [bx, bz] = path[i + 1], dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}

// Cliffs round a clearing, leaving out the segments listed in `skip`.
export function ringCliffs(w, c, r, n, skip, h, hr, R, th) {
  for (let i = 0; i < n; i++) {
    if (skip.includes(i)) continue;
    w.cliff(...ring(c, r, i / n * Math.PI * 2), ...ring(c, r, (i + 1) / n * Math.PI * 2), { h: h + R() * hr, th });
  }
}
