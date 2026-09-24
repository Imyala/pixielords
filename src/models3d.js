// ============================================================ SCULPTED 3D MODELS (Imyala)
// ES-module loader for the sculpted goblin and ratman models brought over from TowerLords.
// Each model is one Meshy sculpt (~3M triangles) run through Imyala's TowerLords model pipeline:
// quadric decimation to 5k triangles, box-projection UV charts packed into one 1024 atlas, colours
// re-baked from the original texture, and a five-bone region rig (root / armL / armR / legL / legR).
//
// TowerLords embeds each <id>_asset.json in a <script> tag; here the same files are fetched from
// assets/models/<family>/ instead. File format (geo is base64):
//   pos:u16x3 · uv:u16x2 · idx:u16x3 · nrm:i8x3 · limb:u8 · limbW:u8   (2-byte arrays first for alignment)
// h.min / h.scale de-quantise positions into model units: Y up, faces +Z, feet at y = -0.95.
// Each vertex blends one limb bone (1 armL, 2 armR, 3 legL, 4 legR, 0 none) with the root.
//
// PixieLords grows that five-bone rig into eleven at load time (see buildRig): a chest and head over the
// waist, an elbow in each arm and a knee in each leg, placed and weighted from the vertex layout, so enemies
// can twist, look, bend and stride instead of swinging rigid limbs.
import * as THREE from 'three';

export const AUTHOR = 'Imyala';

// Per-role size multipliers, as TowerLords uses them (the clubber is the wall of muscle).
export const MODEL_SIZE = {
  'goblin-scout': 1, 'goblin-shaman': 1, 'goblin-archer': 1, 'goblin-poisoner': 1, 'goblin-trapper': 1,
  'goblin-bomber': 1, 'goblin-berserker': 1.1, 'goblin-spearguard': 1.1, 'goblin-commander': 1.15, 'goblin-clubber': 1.35,
  'ratman-scout': .95, 'ratman-skirmisher': 1, 'ratman-slinger': 1, 'ratman-poisoner': 1, 'ratman-shaman': 1,
  'ratman-assassin': 1, 'ratman-packleader': 1.1, 'ratman-brute': 1.3, 'ratman-warblade': 1.3,
};

const cache = new Map();   // id -> Promise<{geo, tex, bones}>

export function assetUrl(id, base = 'assets/models') {
  const family = id.startsWith('ratman-') ? 'ratmen' : 'goblins';
  return `${base}/${family}/${id}_asset.json`;
}

function decode(D) {
  const h = D.h, nv = h.nv, nf = h.nf;
  const b64 = atob(D.geo); const bin = new Uint8Array(b64.length);
  for (let i = 0; i < b64.length; i++) bin[i] = b64.charCodeAt(i);
  const buf = bin.buffer; let o = 0;
  const p16 = new Uint16Array(buf, o, nv * 3); o += nv * 6;
  const uv16 = new Uint16Array(buf, o, nv * 2); o += nv * 4;
  const idx = new Uint16Array(buf, o, nf * 3); o += nf * 6;
  const nrm = new Int8Array(buf, o, nv * 3); o += nv * 3;
  const limb = new Uint8Array(buf, o, nv); o += nv;
  const limbW = new Uint8Array(buf, o, nv); o += nv;

  const pos = new Float32Array(nv * 3);
  for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) pos[i * 3 + k] = h.min[k] + p16[i * 3 + k] * h.scale[k] + (k === 1 ? .95 : 0);   // feet on y = 0
  const bones = {};   // absolute pivots, shifted with the mesh so feet sit on y = 0
  for (const [name, p] of Object.entries(h.bones)) bones[name] = [p[0], p[1] + .95, p[2]];
  const rig = buildRig(pos, limb, limbW, bones);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(nrm), 3, true));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Uint16Array(uv16), 2, true));
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(rig.si, 4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(rig.sw, 4, true));
  geo.setIndex(new THREE.BufferAttribute(new Uint16Array(idx), 1));
  geo.computeBoundingSphere(); geo.computeBoundingBox();

  const tex = new THREE.TextureLoader().load(D.tex);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.flipY = true;

  return { geo, tex, bones: rig.piv, has: rig.has, id: h.id, author: h.author };
}

// Bone order in the skeleton. The first five keep the baked limb ids.
export const BONES = ['root', 'armL', 'armR', 'legL', 'legR', 'chest', 'head', 'foreL', 'foreR', 'shinL', 'shinR'];
const BI = Object.fromEntries(BONES.map((b, i) => [b, i]));
const PARENT = { root: null, chest: 'root', head: 'chest', armL: 'chest', armR: 'chest', foreL: 'armL', foreR: 'armR', legL: 'root', legR: 'root', shinL: 'legL', shinR: 'legR' };
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Derive chest, head, elbows and knees from the region rig: pivots from the geometry, weights by position.
function buildRig(pos, limb, limbW, B) {
  const nv = limb.length, P = (i, k) => pos[i * 3 + k];
  const has = { arms: !!(B.armL && B.armR), legs: !!(B.legL && B.legR) };
  let maxY = 0; for (let i = 0; i < nv; i++) maxY = Math.max(maxY, P(i, 1));
  const hipY = has.legs ? (B.legL[1] + B.legR[1]) / 2 : maxY * .32;
  const shY = has.arms ? (B.armL[1] + B.armR[1]) / 2 : hipY + (maxY - hipY) * .5;
  const torso = Math.max(.15, shY - hipY);
  const waist = hipY + torso * .22, neck = shY + torso * .06;
  const piv = { root: [0, 0, 0], chest: [0, waist, 0], head: [0, neck, 0] };
  for (const n of ['armL', 'armR', 'legL', 'legR']) piv[n] = B[n] || (n.startsWith('arm') ? [n === 'armL' ? -.3 : .3, shY, 0] : [n === 'legL' ? -.15 : .15, hipY, 0]);
  // Elbows: the ring of arm vertices about half a torso from the shoulder (weapons belong to the forearm).
  const ua = torso * .55;
  for (const [arm, fore, id] of [['armL', 'foreL', 1], ['armR', 'foreR', 2]]) {
    const S = piv[arm]; let n = 0, x = 0, y = 0, z = 0;
    for (let i = 0; i < nv; i++) {
      if (limb[i] !== id) continue;
      const d = Math.hypot(P(i, 0) - S[0], P(i, 1) - S[1], P(i, 2) - S[2]);
      if (d > ua * .85 && d < ua * 1.15) { n++; x += P(i, 0); y += P(i, 1); z += P(i, 2); }
    }
    piv[fore] = n ? [x / n, y / n, z / n] : [S[0], S[1] - ua, S[2]];
  }
  // Knees: halfway down each leg.
  for (const [leg, shin, id] of [['legL', 'shinL', 3], ['legR', 'shinR', 4]]) {
    const H = piv[leg], ky = H[1] * .5; let n = 0, x = 0, z = 0;
    for (let i = 0; i < nv; i++) if (limb[i] === id && Math.abs(P(i, 1) - ky) < .05) { n++; x += P(i, 0); z += P(i, 2); }
    piv[shin] = n ? [x / n, ky, z / n] : [H[0], ky, H[2]];
  }
  // Weights: at most four influences per vertex, quantised to sum to 255.
  const si = new Uint8Array(nv * 4), sw = new Uint8Array(nv * 4), w = [0, 0, 0, 0], ix = [0, 0, 0, 0];
  for (let i = 0; i < nv; i++) {
    const L = limb[i], wl = L ? limbW[i] / 255 : 0, y = P(i, 1);
    const c = sstep(waist - torso * .1, waist + torso * .3, y);
    if (L === 1 || L === 2) {
      const S = piv[L === 1 ? 'armL' : 'armR'], d = Math.hypot(P(i, 0) - S[0], y - S[1], P(i, 2) - S[2]);
      const f = sstep(ua * .8, ua * 1.2, d);
      ix[0] = L; w[0] = wl * (1 - f); ix[1] = BI[L === 1 ? 'foreL' : 'foreR']; w[1] = wl * f;
      ix[2] = BI.chest; w[2] = (1 - wl) * c; ix[3] = BI.root; w[3] = (1 - wl) * (1 - c);
    } else if (L === 3 || L === 4) {
      const kn = piv[L === 3 ? 'shinL' : 'shinR'], sh = 1 - sstep(kn[1] - .05, kn[1] + .05, y);
      ix[0] = L; w[0] = wl * (1 - sh); ix[1] = BI[L === 3 ? 'shinL' : 'shinR']; w[1] = wl * sh;
      ix[2] = BI.root; w[2] = 1 - wl; ix[3] = 0; w[3] = 0;
    } else {
      const hd = sstep(neck - torso * .05, neck + torso * .2, y);
      ix[0] = BI.root; w[0] = 1 - c; ix[1] = BI.chest; w[1] = c * (1 - hd); ix[2] = BI.head; w[2] = c * hd; ix[3] = 0; w[3] = 0;
    }
    let tot = 0, big = 0;
    for (let k = 0; k < 4; k++) { const q = Math.round(w[k] * 255); sw[i * 4 + k] = q; si[i * 4 + k] = ix[k]; tot += q; if (w[k] > w[big]) big = k; }
    sw[i * 4 + big] += 255 - tot;
  }
  return { si, sw, piv, has };
}

// Fetch + decode once per id. Resolves to {geo, tex, bones}.
export function loadModel(id, opts = {}) {
  if (!cache.has(id)) {
    cache.set(id, fetch(opts.url || assetUrl(id, opts.base))
      .then(r => { if (!r.ok) throw new Error(`${r.status} ${r.url}`); return r.json(); })
      .then(decode)
      .catch(err => { cache.delete(id); throw err; }));
  }
  return cache.get(id);
}

// Build one animatable instance: a Group whose feet sit on y = 0, facing +Z.
// opts.scale multiplies the per-role MODEL_SIZE. userData.arms / userData.legs hold the limb bones
// (rotation.x swings them); a model whose rig has no arm or leg bones leaves that list empty.
export async function createModel(id, opts = {}) {
  const M = await loadModel(id, opts);
  const k = (opts.scale ?? 1) * (MODEL_SIZE[id] ?? 1);
  const grp = new THREE.Group();
  grp.name = id;
  grp.userData = { model3d: id, author: AUTHOR, arms: [], legs: [] };

  const mat = new THREE.MeshStandardMaterial({ map: M.tex, emissiveMap: M.tex, emissive: 0xffffff, emissiveIntensity: .08, roughness: .85, metalness: 0 });
  const skin = new THREE.SkinnedMesh(M.geo, mat);
  skin.scale.setScalar(k); skin.castShadow = true; skin.receiveShadow = true; skin.frustumCulled = false;
  grp.add(skin); grp.userData.mesh = skin;

  // Bones sit at their pivots, each positioned relative to its parent.
  const B = M.bones, bone = {};
  for (const name of ['root', 'chest', 'head', 'armL', 'armR', 'foreL', 'foreR', 'legL', 'legR', 'shinL', 'shinR']) {   // parents first
    const b = new THREE.Bone(); b.name = name; const p = B[name], par = PARENT[name] && B[PARENT[name]];
    b.position.set(p[0] - (par ? par[0] : 0), p[1] - (par ? par[1] : 0), p[2] - (par ? par[2] : 0));
    (PARENT[name] ? bone[PARENT[name]] : skin).add(b); bone[name] = b;
  }
  skin.bind(new THREE.Skeleton(BONES.map(n => bone[n])));
  grp.userData.bones = bone;
  if (M.has.arms) grp.userData.arms.push(bone.armL, bone.armR);   // two-handed bows / planted spears have no arm swing
  if (M.has.legs) grp.userData.legs.push(bone.legL, bone.legR);   // floor-length robes have no leg swing
  grp.userData.fore = M.has.arms ? [bone.foreL, bone.foreR] : [];
  grp.userData.shins = M.has.legs ? [bone.shinL, bone.shinR] : [];
  return grp;
}

// Walk-swing driver, the same motion TowerLords' enemy loop applies. t in seconds; amount 0..1 (0 = idle).
export function animateWalk(grp, t, amount = 1, speed = 8) {
  const s = Math.sin(t * speed) * .55 * amount;
  const [aL, aR] = grp.userData.arms, [lL, lR] = grp.userData.legs;
  if (lL) { lL.rotation.x = s; lR.rotation.x = -s; }
  if (aL) { aL.rotation.x = -s * .8; aR.rotation.x = s * .8; }
  grp.userData.mesh.position.y = Math.abs(Math.sin(t * speed)) * .04 * amount * grp.userData.mesh.scale.y;   // body bob
}
