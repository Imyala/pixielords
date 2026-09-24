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
  const si = new Uint8Array(nv * 4), sw = new Uint8Array(nv * 4);
  for (let i = 0; i < nv; i++) { si[i * 4] = limb[i]; sw[i * 4] = limbW[i]; sw[i * 4 + 1] = 255 - limbW[i]; }   // one limb bone + the root takes the rest

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(nrm), 3, true));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Uint16Array(uv16), 2, true));
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4, true));
  geo.setIndex(new THREE.BufferAttribute(new Uint16Array(idx), 1));
  geo.computeBoundingSphere(); geo.computeBoundingBox();

  const tex = new THREE.TextureLoader().load(D.tex);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.flipY = true;

  const bones = {};   // pivots, shifted with the mesh so feet sit on y = 0
  for (const [name, p] of Object.entries(h.bones)) bones[name] = [p[0], p[1] + .95, p[2]];
  return { geo, tex, bones, id: h.id, author: h.author };
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

  const B = M.bones;
  const mk = (name, parent) => { const b = new THREE.Bone(); b.name = name; const p = B[name] || [0, 0, 0]; b.position.set(p[0], p[1], p[2]); parent.add(b); return b; };
  const root = mk('root', skin), aL = mk('armL', root), aR = mk('armR', root), lL = mk('legL', root), lR = mk('legR', root);   // order matches the baked limb ids
  skin.bind(new THREE.Skeleton([root, aL, aR, lL, lR]));
  if (B.armL && B.armR) grp.userData.arms.push(aL, aR);   // two-handed bows / planted spears have no arm swing
  if (B.legL && B.legR) grp.userData.legs.push(lL, lR);   // floor-length robes have no leg swing
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
