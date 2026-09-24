// Procedural canvas textures: flagstones, brick, moss, cracked arena stone, wings and soft sprites.
// Each surface returns { map, normalMap } built from one height field.
import * as THREE from 'three';
import { makeNoise, rng, clamp } from './util.js';

function canvas(n) { const c = document.createElement('canvas'); c.width = c.height = n; return c; }

function toTex(c, repeat = true, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Height field (0..1) → tangent-space normal map canvas.
function normalCanvas(H, n, strength = 3) {
  const c = canvas(n), ctx = c.getContext('2d'), img = ctx.createImageData(n, n), d = img.data;
  const h = (x, y) => H[((y + n) % n) * n + ((x + n) % n)];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = (h(x + 1, y) - h(x - 1, y)) * strength, dy = (h(x, y + 1) - h(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * n + x) * 4;
    d[i] = (-dx / l * .5 + .5) * 255; d[i + 1] = (dy / l * .5 + .5) * 255; d[i + 2] = (1 / l * .5 + .5) * 255; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function surface(n, fn, strength) {
  const H = new Float32Array(n * n), c = canvas(n), ctx = c.getContext('2d'), img = ctx.createImageData(n, n), d = img.data;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const [r, g, b, hgt] = fn(x, y), i = y * n + x;
    H[i] = hgt; d[i * 4] = clamp(r, 0, 255); d[i * 4 + 1] = clamp(g, 0, 255); d[i * 4 + 2] = clamp(b, 0, 255); d[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return { map: toTex(c), normalMap: toTex(normalCanvas(H, n, strength), true, false) };
}

// Irregular flagstones: jittered grid cells, rounded edges, dark mortar.
export function flagstone(seed = 3, tint = [1, 1, 1]) {
  const n = 512, N = makeNoise(seed), R = rng(seed), cells = 4, cs = n / cells;
  const off = []; for (let i = 0; i < cells * cells; i++) off.push([R() * .3 - .15, R() * .3 - .15, .75 + R() * .35]);
  return surface(n, (x, y) => {
    const gx = x / cs, gy = y / cs;
    const row = Math.floor(gy), shift = row % 2 ? .5 : 0;
    const cx = Math.floor(gx + shift), fx = gx + shift - cx, fy = gy - row;
    const o = off[((row % cells) * cells + ((cx % cells) + cells) % cells)];
    const e = Math.min(fx, 1 - fx, fy, 1 - fy) + N.fbm(x * .05, y * .05, 2) * .06;
    const edge = clamp(e / .06, 0, 1);
    const grain = N.fbm(x * .03, y * .03, 5), fine = N.n2(x * .4, y * .4);
    const moss = clamp((N.fbm(x * .012 + 9, y * .012, 3) - .56) * 5, 0, 1) * (1 - edge * .6);
    let v = (60 + grain * 70 + fine * 14) * o[2];
    let r = v, g = v * .97, b = v * .92;
    r = r * (1 - moss) + (38 + fine * 20) * moss; g = g * (1 - moss) + (58 + fine * 25) * moss; b = b * (1 - moss) + (30 + fine * 10) * moss;
    const k = .25 + .75 * edge;
    return [r * k * tint[0], g * k * tint[1], b * k * tint[2], edge * .7 + grain * .3 + fine * .05];
  }, 2.5);
}

// Running-bond ashlar blocks for walls.
export function brick(seed = 11, tint = [1, 1, 1]) {
  const n = 512, N = makeNoise(seed), R = rng(seed), rows = 8, bh = n / rows, bw = n / 4;
  const tones = []; for (let i = 0; i < 64; i++) tones.push(.72 + R() * .45);
  return surface(n, (x, y) => {
    const row = Math.floor(y / bh), sx = x + (row % 2 ? bw / 2 : 0), col = Math.floor(sx / bw) % 4;
    const fx = (sx % bw) / bw, fy = (y % bh) / bh;
    const e = Math.min(fx * bw, (1 - fx) * bw, fy * bh, (1 - fy) * bh) + N.fbm(x * .07, y * .07, 2) * 3;
    const edge = clamp((e - 2) / 5, 0, 1);
    const grain = N.fbm(x * .025, y * .05, 5), fine = N.n2(x * .5, y * .5);
    const t = tones[(row * 4 + col) % 64];
    const damp = clamp((1 - y / n) * 1.2 - .5 + N.fbm(x * .01, 3, 2) * .4, 0, 1);   // darker, wetter toward the base
    const v = (58 + grain * 60 + fine * 12) * t * (1 - damp * .35);
    const k = .22 + .78 * edge;
    return [v * k * tint[0], v * .95 * k * tint[1], v * .9 * k * tint[2], edge * .8 + grain * .2];
  }, 3);
}

// Dirt with grass tufts for the grove.
export function grass(seed = 5) {
  const n = 512, N = makeNoise(seed);
  return surface(n, (x, y) => {
    const a = N.fbm(x * .02, y * .02, 4), b = N.fbm(x * .15, y * .15, 3), f = N.n2(x * .9, y * .9);
    const g = clamp((a - .42) * 4, 0, 1);
    const r = (46 + b * 30) * (1 - g) + (34 + f * 30) * g;
    const gg = (38 + b * 24) * (1 - g) + (52 + f * 40 + b * 20) * g;
    const bb = (28 + b * 14) * (1 - g) + (24 + f * 10) * g;
    return [r, gg, bb, b * .6 + f * .4 * g];
  }, 2);
}

// Dark cracked stone with glowing-red veins for the throne arena.
export function arenaStone(seed = 21) {
  const n = 512, N = makeNoise(seed);
  return surface(n, (x, y) => {
    const a = N.fbm(x * .02, y * .02, 5), f = N.n2(x * .6, y * .6);
    const c = Math.abs(N.fbm(x * .018 + 4, y * .018, 4) - .5);
    const crack = clamp(1 - c / .025, 0, 1);
    const v = 40 + a * 50 + f * 10;
    return [v + crack * 40, v * .9, v * .88, (1 - crack) * .8 + a * .2];
  }, 3);
}

// Translucent wing with veins, used additively.
export function wingTexture() {
  const c = canvas(256), g = c.getContext('2d');
  const grd = g.createRadialGradient(40, 128, 10, 90, 128, 230);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(.35, 'rgba(160,240,255,.85)');
  grd.addColorStop(.75, 'rgba(210,140,255,.55)'); grd.addColorStop(1, 'rgba(255,120,220,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    g.beginPath(); g.moveTo(10, 128);
    const a = (i / 5 - .5) * 1.4;
    g.quadraticCurveTo(110, 128 + Math.sin(a) * 60, 250 * Math.cos(a * .4), 128 + Math.sin(a) * 120);
    g.stroke();
  }
  return toTex(c, false);
}

// Soft round sprite; 'star' adds a four-point glint.
export function glowTexture(kind = 'soft') {
  const c = canvas(128), g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(.25, 'rgba(255,255,255,.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  if (kind === 'star') {
    g.globalCompositeOperation = 'lighter';
    for (const [w, h] of [[128, 5], [5, 128]]) {
      const l = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      l.addColorStop(0, 'rgba(255,255,255,1)'); l.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = l; g.fillRect(64 - w / 2, 64 - h / 2, w, h);
    }
  }
  return toTex(c, false);
}

// Ring of runes for Moonwells.
export function runeCircle(color = '120,230,255') {
  const c = canvas(256), g = c.getContext('2d'), R = rng(99);
  g.translate(128, 128);
  g.strokeStyle = `rgba(${color},1)`; g.shadowColor = `rgba(${color},1)`; g.shadowBlur = 8;
  g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 118, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 96, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 16; i++) {
    g.save(); g.rotate(i / 16 * Math.PI * 2); g.translate(0, -107);
    g.beginPath();
    for (let k = 0; k < 3; k++) { g.moveTo((R() - .5) * 10, (R() - .5) * 10); g.lineTo((R() - .5) * 10, (R() - .5) * 10); }
    g.stroke(); g.restore();
  }
  g.lineWidth = 2;
  g.beginPath();
  for (let i = 0; i <= 5; i++) { const a = i * Math.PI * 4 / 5 - Math.PI / 2; g.lineTo(Math.cos(a) * 90, Math.sin(a) * 90); }
  g.stroke();
  return toTex(c, false);
}

// Night sky gradient with stars, painted onto the inside of a dome.
export function skyTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d'), R = rng(4);
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#02030a'); grd.addColorStop(.45, '#0b1022'); grd.addColorStop(.62, '#1b1830'); grd.addColorStop(.7, '#2a1c2a'); grd.addColorStop(1, '#07060a');
  g.fillStyle = grd; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 700; i++) {
    const y = R() * 300, a = R() * (1 - y / 320);
    g.fillStyle = `rgba(220,230,255,${a})`; g.fillRect(R() * 1024, y, R() < .1 ? 2 : 1, R() < .1 ? 2 : 1);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
