// Champions: now and then an ordinary foe rises with the moon's leftover light in it, and fights with one or
// more affixes (as Nioh's and Diablo's champions do). A champion is hardier, glows in its first affix's colour
// with a ring at its feet, wears its affixes in its name, and pays out as an elite does. How often they come,
// and with how many affixes, grows with the Way (New Game+ cycles), Twilight, and depth in the Underbriar.
// The roll is seeded by mission, foe and cycle, so the same foe is the same champion every time you meet it.
// enemies.js applies the affixes (stats in reset, effects in update, deliver and takeHit); main.js pays out.
import * as THREE from 'three';
import { rng } from './util.js';

export const AFFIXES = {
  swift: { name: 'Swift', color: 0x9ff3ff, desc: 'moves and strikes a quarter faster' },
  vampiric: { name: 'Bloodthirsty', color: 0xff3a5a, desc: 'mends itself with every blow it lands' },
  ember: { name: 'Emberborn', color: 0xff8a3a, desc: 'its blows leave you standing in fire, and it trails flame' },
  rime: { name: 'Rimebound', color: 0xbfe6ff, desc: 'its blows chill you' },
  blight: { name: 'Blighted', color: 0x8fe040, desc: 'its blows build blight' },
  warded: { name: 'Warded', color: 0x7ab8ff, desc: 'a ward soaks blows until broken; left alone, it returns' },
  wrath: { name: 'Wrathful', color: 0xff5030, desc: 'below a third of its health it rages: harder and faster' },
  stone: { name: 'Stoneskin', color: 0xc8b890, desc: 'hardier still, and hard to stagger' },
  storm: { name: 'Stormcaller', color: 0xd8c8ff, desc: 'calls lightning down where you stand' },
  phasing: { name: 'Phasing', color: 0xc9b4ff, desc: 'steps through the air to your back' },
};
const IDS = Object.keys(AFFIXES);

const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };

// The chance a foe rises as a champion, and the most affixes one can carry.
export function championOdds(G) {
  const d = G.save.data, way = d.ng || 0, L = G.level, S = G.sideDef?.();
  let p = [.04, .14, .22, .3][Math.min(way, 3)] + Math.max(0, way - 3) * .03;
  if (L?.id === 'keep' && !way && !S) p = 0;   // the first mission teaches the basics first
  if (S?.kind === 'twilight') p += .12;
  if (L?.depth) p = Math.min(.5, .03 + L.depth * .008 + way * .06);
  const deep = L?.depth || 0;
  const max = 1 + (way >= 2 || deep >= 15 || S?.kind === 'twilight' ? 1 : 0) + (way >= 3 || deep >= 35 ? 1 : 0);
  return { p: Math.min(.55, p), max };
}

// The affixes a foe rises with ([] for none). Warlords, gatekeepers, a warlord's summons and shades never do.
export function rollChampion(G, e) {
  const s = e.spawn, T = e.T;
  if (!G.save || e.boss || s.add || s.elite || s.noChamp || T.shade || T.boss) return [];
  const L = G.level || {}, d = G.save.data;
  const R = rng(hash(`${L.id}:${L.depth || 0}:${e.id}:${d.ng || 0}:${d.side || ''}`));
  const { p, max } = championOdds(G);
  if (R() >= p) return [];
  const n = 1 + (max > 1 && R() < .45 ? 1 : 0) + (max > 2 && R() < .35 ? 1 : 0);
  const pool = IDS.filter(id => !(id === 'phasing' && T.attacks?.every(a => a.minRange)));   // archers don't blink to your back
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
  return out;
}

// A champion's ring and ward, made once per foe and shown while it is one.
const RING = new THREE.RingGeometry(.9, 1.1, 32).rotateX(-Math.PI / 2);
const BUBBLE = new THREE.SphereGeometry(1, 20, 14);
export function championDress(e) {
  if (!e.champFx) {
    const ring = new THREE.Mesh(RING, new THREE.MeshBasicMaterial({ transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    ring.position.y = .04;
    const ward = new THREE.Mesh(BUBBLE, new THREE.MeshBasicMaterial({ color: 0x7ab8ff, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false }));
    ward.position.y = e.height * .5;
    e.outer.add(ring, ward);
    e.champFx = { ring, ward };
  }
  const f = e.champFx, on = e.champion;
  f.ring.visible = on; f.ward.visible = on && e.ward > 0;
  if (on) {
    f.ring.material.color.setHex(AFFIXES[e.affixes[0]].color);
    f.ring.scale.setScalar(Math.max(.7, e.radius * 1.4));
    f.ward.scale.set(e.radius * 1.5 + .3, e.height * .62, e.radius * 1.5 + .3);
  }
}
export function championDispose(e) {
  if (!e.champFx) return;
  e.champFx.ring.material.dispose(); e.champFx.ward.material.dispose();
}
