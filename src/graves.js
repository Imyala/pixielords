// Revenant Graves, as Nioh's bloody graves: the fae knights who came this way before you, and fell. Two lie in
// every mission (not in the Underbriar, nor on a Duel), a blade driven into a mound and lit red. Touch one and
// the knight who fell there rises as a Revenant, in the harness it died in and with the weapon it carried, and
// fights as you fight: its strokes are a Duel Revenant's of that weapon (the player's own animations), its
// strength that of the mission's own Duel. Lay it to rest for Moonpetals (market.js), a piece of its harness or
// its weapon, and now and then its Soul Core. The grave then lies dark until you rest at a Moonwell, and after
// that another knight's echo waits in it.
// World places the graves (graveSpots, graveProp); main.js raises and rewards them; menu.js shows the grave.
import * as THREE from 'three';
import { rng } from './util.js';
import { SETS, MISSION_GEAR } from './gear.js';
import { SIDES } from './sides.js';
import { PATRONS, PATRON_ORDER } from './patrons.js';
import { glowTexture, runeCircle } from './textures.js';

// The Duel Revenant whose strokes a fallen knight borrows, by the weapon it carried.
export const GRAVE_WEAPONS = {
  sword: 'revenant-last', great: 'revenant-thornwake', katana: 'revenant-hollowmoon', hammer: 'revenant-emberlight', rapier: 'revenant-ysolde',
  fangs: 'revenant-lanternless', daggers: 'revenant-graves', hatchets: 'revenant-ashkettle', claws: 'revenant-rook', fans: 'revenant-cinderwing',
  hexblade: 'revenant-oathbound', chain: 'revenant-lark', staff: 'revenant-halloway', aegis: 'revenant-mourne', tonfas: 'revenant-tamsin',
};
// Titles go with names: Sir and Brother, Dame and Sister, or none at all.
const HIS = ['Alder', 'Corwin', 'Dunstan', 'Fenn', 'Hollis', 'Jory', 'Osric', 'Perrin', 'Ulric', 'Bramwell', 'Darrow', 'Emrys', 'Florian', 'Gideon', 'Ivo', 'Lorcan', 'Piran', 'Silas', 'Anselm', 'Merrow'];
const HERS = ['Bryony', 'Elowen', 'Gwyneth', 'Isolde', 'Linnet', 'Vesper', 'Cressida', 'Hazel', 'Juniper', 'Maud', 'Niamh', 'Odile', 'Rosalind', 'Tilda', 'Briar-Rose', 'Kestrel', 'Wren', 'Nettle'];
const THEIRS = ['Quill', 'Rowan', 'Sorrel', 'Thistle', 'Yarrow', 'Aubrey', 'Wren', 'Kestrel', 'Nettle', 'Merrow', 'Fenn'];
const NAMES = [['Sir', HIS], ['Brother', HIS], ['Dame', HERS], ['Sister', HERS], ['', THEIRS], ['', HIS], ['', HERS]];
const SUR = ['of the Reeds', 'Ashvale', 'the Unlucky', 'Hartwell', 'of the Long Road', 'Mossbrook', 'the Bold', 'Thornby', 'of Nine Lanterns', 'Greyholt',
  'the Quiet', 'Fairweather', 'of the Low Moon', 'Brackenridge', 'the Last to Leave', 'Wychwood', 'Dunmere', 'the Oathless', 'Starwick', 'of the Briar Gate',
  'Hollowell', 'the Twice-Fallen', 'Candlemere', 'Rimebrook', 'the Eager', 'Lanternjaw', 'of the Far Hedge', 'Moth-Wing'];
const HOW = [f => `Fell to ${f}.`, f => `Fell to ${f}, one blow short.`, f => `Fell to ${f}, and would not stay down.`, f => `Fell to ${f}, far from home.`,
  f => `Fell to ${f}, with its Moondew still full.`, f => `Fell to ${f}, guarding when it should have dodged.`, f => `Fell to ${f}, out of breath.`,
  f => `Fell to ${f}, reaching for its Faelight.`, f => `Fell to ${f}, the last of its company.`];
// How red a grave burns, and its fallen knight's eyes and trail.
const RED = { dark: 0x140c10, visor: 0xff4a4a, glow: 0xd8383a, trail: 0xff8a8a };

const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
// A strike list's average harm, to set one moveset's strength against another's.
const avgDmg = T => { const d = [...T.attacks, ...(T.phase2 || [])].flatMap(a => a.steps || a.seq || []).map(s => s.dmg).filter(v => v > 0); return d.length ? d.reduce((a, b) => a + b, 0) / d.length : 80; };

// The fallen knight in a mission's grave: slot is the grave (0 or 1), gen how many have lain there before it.
// foes: names of the mission's foes, to say which of them it fell to; salt keeps other callers' knights apart
// (kindred.js). The same arguments give the same knight.
export function fallenKnight(mission, slot, gen, foes = [], level = 1, salt = '') {
  const R = rng(hash(`${salt}${mission}:${slot}:${gen}`) || 1), pick = a => a[Math.floor(R() * a.length)];
  const weapons = Object.keys(GRAVE_WEAPONS), weapon = pick(weapons);
  // Its harness: the Knight-Errant's, or a set from this mission or one it came through on the way.
  const order = Object.keys(MISSION_GEAR), upto = Math.max(0, order.indexOf(mission));
  const sets = ['errant', ...order.slice(0, upto + 1).map(id => MISSION_GEAR[id].set)];
  const set = R() < .45 ? MISSION_GEAR[mission]?.set || 'errant' : pick(sets);
  const [title, given] = pick(NAMES), name = `${title ? title + ' ' : ''}${pick(given)} ${pick(SUR)}`;
  const patron = pick(PATRON_ORDER);
  return { mission, slot, gen, weapon, set, name, patron, lvl: Math.max(1, level + Math.floor(R() * 7) - 3), how: pick(HOW)(foes.length ? pick(foes) : 'the dark'), act: Math.floor(upto / 5) };
}

// The Moonpetals a laid Revenant leaves: more in later acts and Ways, half again under an omen.
export const gravePetals = (K, ng = 0, omen = false) => Math.round((4 + 2 * K.act + ng * 2) * (omen ? 1.5 : 1));

// The foe type a fallen knight fights as: a Duel Revenant's strokes, in the knight's own harness, as strong as
// the mission's own Duel Revenant (a little less hardy). TYPES is enemies.js's table.
export function graveType(K, TYPES) {
  const base = TYPES[GRAVE_WEAPONS[K.weapon]], duel = TYPES[SIDES[`${K.mission}-duel`]?.foe] || base;
  const L = SETS[K.set]?.look || SETS.errant.look, P = PATRONS[K.patron];
  const hp = Math.round(duel.hp * .72 * (1 + (K.lvl - (K.lvl0 ?? K.lvl)) * .02));
  return {
    ...base, name: `${K.name}, Revenant`, hp, glimmer: Math.round(hp * 2.4),
    knight: { ...RED, steel: L.steel, cloth: L.cloth, trim: L.trim, blade: 0xffe0e0, wing: P?.color ?? 0xff9a9a },
    dmgScale: avgDmg(duel) / avgDmg(base) * .9, grave: true,
    phase2Line: `${K.name} burns red`,
  };
}

// Where a mission's graves lie: open ground on the way through (flood-filled from the first Moonwell, the
// warlord's seal shut), well clear of Moonwells, foes, finds and hazards; one in the first half of the way, one in
// the second. The same level always gives the same places.
export function graveSpots(W, L) {
  if (!L.areas?.length || !L.shrines || L.depth || L.noGraves) return [];
  const xs = L.areas.flatMap(a => [a.x0, a.x1]), zs = L.areas.flatMap(a => [a.z0, a.z1]), st = 1;
  const x0 = Math.min(...xs) - 2, z0 = Math.min(...zs) - 2, nx = Math.ceil((Math.max(...xs) + 2 - x0) / st), nz = Math.ceil((Math.max(...zs) + 2 - z0) / st);
  const free = (x, z, r) => { const q = { x, z }; W.collide(q, r); return Math.hypot(q.x - x, q.z - z) < .05; };
  // Gates stand open (their far side is part of the way), crates and urns don't count; the seal stays shut.
  const pc = W.portcullis?.col.on; if (W.portcullis) W.portcullis.col.on = false;
  const brk = W.breakables.map(b => b.col?.on); W.breakables.forEach(b => { if (b.col) b.col.on = false; });
  const first = L.shrines[L.titleShrine] || Object.values(L.shrines)[0], [sx, sz] = first.spawn;
  const dist = new Int32Array(nx * nz).fill(-1), q = [];
  const si = Math.round((sx - x0) / st), sj = Math.round((sz - z0) / st);
  if (si >= 0 && sj >= 0 && si < nx && sj < nz) { dist[sj * nx + si] = 0; q.push(sj * nx + si); }
  const seal = L.seal ? (x, z) => W.sealSide(x, z) : () => -99;
  for (let h = 0; h < q.length; h++) {
    const c = q[h], i = c % nx, j = (c - i) / nx;
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const u = i + a, v = j + b, k = v * nx + u;
      if (u < 0 || v < 0 || u >= nx || v >= nz || dist[k] !== -1) continue;
      const x = x0 + u * st, z = z0 + v * st;
      if (seal(x, z) > -1.5 || !free(x, z, .45)) { dist[k] = -2; continue; }
      dist[k] = dist[c] + 1; q.push(k);
    }
  }
  if (W.portcullis) W.portcullis.col.on = pc;
  W.breakables.forEach((b, i) => { if (b.col) b.col.on = brk[i]; });
  // What a grave keeps clear of: [x, z, radius].
  const keep = [
    ...Object.values(L.shrines).map(s => [s.x, s.z, 9]), [sx, sz, 14],
    ...L.spawns.flatMap(s => [[s.x, s.z, s.elite ? 12 : 5.5], ...(s.patrol || []).map(([px, pz]) => [px, pz, 4])]),
    ...[...(L.items || []), ...(L.letters || []), ...(L.pixies || []), ...(L.messages || [])].map(o => [o.x, o.z, 3]),
    ...(L.hazards || []).map(h => [h.x, h.z, h.r + 3]),
    ...(L.exit ? [[L.exit.x, L.exit.z, 8]] : []), ...(L.gate ? [[L.gate.x, L.gate.z, 6]] : []),
  ];
  let far = 0;
  for (const v of dist) far = Math.max(far, v);
  // A crowded mission gives a little: its clearances shrink until both graves fit.
  const R = rng((L.seed || 1) * 7 + 4242), out = [];
  for (const [lo, hi] of [[.22, .5], [.58, .92]]) {
    for (const give of [1, .75, .55]) {
      const band = [];
      for (let k = 0; k < dist.length; k++) {
        if (dist[k] < far * lo || dist[k] > far * hi) continue;
        const x = x0 + (k % nx) * st, z = z0 + Math.floor(k / nx) * st;
        if (seal(x, z) > -6 || keep.some(([kx, kz, r]) => Math.hypot(x - kx, z - kz) < r * give) || out.some(o => Math.hypot(o.x - x, o.z - z) < 25 * give)) continue;
        band.push({ x, z });
      }
      let c = null;
      for (let tries = 0; tries < 80 && band.length && !c; tries++) {
        const b = band.splice(Math.floor(R() * band.length), 1)[0];
        if (free(b.x, b.z, 2.2 * Math.max(.75, give))) c = b;
      }
      if (c) { out.push({ x: c.x, z: c.z, yaw: R() * Math.PI * 2 }); break; }
    }
  }
  return out;
}

// A grave: a blade driven into a low mound, a red rune about it, red light and embers rising. set(lit) dims it.
let GLOW = null, RUNE = null;
export function graveProp(W, g) {
  const grp = new THREE.Group(); grp.position.set(g.x, 0, g.z); grp.rotation.y = g.yaw;
  const earth = new THREE.MeshStandardMaterial({ color: W.level.moon ? 0x6a6a78 : W.level.frost ? 0x8a94a8 : 0x3a2c24, roughness: 1, flatShading: true });
  const steel = new THREE.MeshStandardMaterial({ color: 0xb8bcc8, metalness: .85, roughness: .3, emissive: 0x4a0808, emissiveIntensity: .6 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x2a1a14, roughness: .8 });
  const mound = new THREE.Mesh(new THREE.SphereGeometry(.85, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), earth);
  mound.scale.set(1.25, .32, .8); mound.receiveShadow = mound.castShadow = true;
  const stone = new THREE.Mesh(new THREE.BoxGeometry(.5, .7, .14), W.mats.stone || earth); stone.position.set(0, .3, -.72); stone.rotation.x = -.12; stone.castShadow = true;
  const blade = new THREE.Group(); blade.position.set(.1, .22, .05); blade.rotation.set(.18, .3, -.14);
  const b = new THREE.Mesh(new THREE.BoxGeometry(.075, 1.05, .018), steel); b.position.y = .45;
  const guard = new THREE.Mesh(new THREE.BoxGeometry(.34, .05, .06), grip); guard.position.y = .98;
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .26, 6), grip); hilt.position.y = 1.13;
  const pom = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), steel); pom.position.y = 1.27;
  blade.add(b, guard, hilt, pom); blade.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW ||= glowTexture(), color: 0xff3a3a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .8 }));
  glow.position.y = .9; glow.scale.set(2.2, 3.4, 1);
  const rune = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: RUNE ||= runeCircle('255,70,70'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .5 }));
  rune.rotation.x = -Math.PI / 2; rune.position.y = .04;
  const embers = [];
  for (let i = 0; i < 7; i++) {
    const e = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xff6a4a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    e.scale.setScalar(.14); e.userData = { a: i * 2.1, r: .3 + (i % 3) * .25, t: i / 7 }; grp.add(e); embers.push(e);
  }
  grp.add(mound, stone, blade, glow, rune);
  W.group.add(grp);
  const G = { ...g, grp, lit: 1, on: true, col: W.prop(W.addCyl(g.x, g.z, .7, 1.2)) };
  W.anim.push((t, dt = 1 / 60) => {
    const k = G.lit;
    glow.visible = k > .02; glow.material.opacity = (.55 + Math.sin(t * 2.6 + g.x) * .15) * k; glow.scale.set(2 + k * .3, 3 + Math.sin(t * 1.7) * .3, 1);
    rune.material.opacity = .08 + .45 * k; rune.rotation.z = -t * .12;
    steel.emissiveIntensity = .6 * k;
    for (const e of embers) {
      const u = e.userData; u.t = (u.t + dt * .35) % 1;
      e.visible = k > .02; e.position.set(Math.cos(u.a + t * .5) * u.r, .2 + u.t * 2.4, Math.sin(u.a + t * .5) * u.r);
      e.material.opacity = Math.sin(u.t * Math.PI) * .9 * k;
    }
  });
  G.set = lit => { G.lit = lit ? 1 : 0; };
  return G;
}
