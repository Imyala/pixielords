// How a blow lands. Every weapon has a weight (a dagger's flick, a sword's cut, a hammer's crash) and a material
// (it cuts, it crushes, it pierces); every strike its own heft (light, heavy, finisher, charged, a flurry's beat).
// From them come the hit-stop, the camera's jolt along the blow and the lens's punch on the heaviest, the sound
// (and the ring of steel on armour), whether the blow floors an ordinary foe when it breaks its poise, and a killing
// blow's weight. player.js asks here each time a strike lands.
const WEIGHT = {
  daggers: .75, fans: .75, fangs: .78, claws: .8, rapier: .8, ring: .8, tonfas: .85, fists: .9, hatchets: .95, chain: .95,
  sword: 1, katana: 1, hexblade: 1, staff: 1, scythe: 1.1, glaive: 1.1, aegis: 1.15, saw: 1.3, great: 1.35, hammer: 1.4,
};
const MATERIAL = { hammer: 'blunt', fists: 'blunt', tonfas: 'blunt', staff: 'blunt', aegis: 'blunt', rapier: 'pierce' };
export const weightOf = w => WEIGHT[w] ?? 1;
export const materialOf = (w, a) => MATERIAL[w] || (a?.thrust || /thrust|pierce|needle|lunge|stab/i.test(a?.name || '') ? 'pierce' : 'cut');

// k: the blow's heft (1 = a sword's plain cut). kd: breaking an ordinary foe's poise floors it.
export function heft(w, a, cm = 1) {
  const W = weightOf(w);
  const k = W * (a.heavy ? 1.55 : 1) * (a.fin ? 1.35 : 1) * Math.max(1, cm) * (a.multi ? .45 : 1) * (a.air ? .85 : 1);
  return { k, kd: !a.multi && (a.kd || k >= 1.9 || (a.fin && W >= 1.1)) };
}

// The blow has landed on e with result res ('hit', 'stagger', 'broken', 'kill', 'blocked'...).
export function land(G, p, e, a, res, dir, cm = 1) {
  const { k } = heft(p.weapon, a, cm), kill = res === 'kill', big = e.boss || e.elite;
  const mat = res === 'blocked' ? 'block' : materialOf(p.weapon, a);
  // Hit-stop: the heavier, the longer the world holds; a kill or a broken poise holds a beat more.
  const stop = Math.min(.15, Math.max(.018, .034 * k)) + (kill ? .05 : 0) + (res === 'broken' ? .05 : 0);
  G.hitstop = Math.max(G.hitstop, stop);
  G.cam.shake(Math.min(.4, .055 * k * (kill ? 1.5 : 1)));
  G.cam.kick?.(dir, Math.min(.22, .045 * k * (kill ? 1.4 : 1)), k >= 1.9 || (kill && big) ? Math.min(1, k / 3) : 0);
  // Sound: the cut, crush or stab, and the ring of steel when it lands on armour.
  const at = { x: e.pos.x, z: e.pos.z, heavy: k >= 1.45 };
  G.audio.sfx(mat === 'block' ? 'block' : mat === 'blunt' ? 'hitBlunt' : mat === 'pierce' ? 'hitPierce' : 'hitCut', at);
  if (mat !== 'block' && (e.T.knight || e.armored || e.T.shield || e.T.armor)) G.audio.sfx('hitArmor', { ...at, vol: .55 });
  if (kill) {
    G.audio.sfx('killBlow', { ...at, vol: big ? 1 : .8 });
    // The last foe of a fight, or a great one: the world slows a moment to watch it fall.
    const last = !G.enemies.some(o => o !== e && o.alive && o.aware && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 16);
    if (big || (last && k >= 1.3)) G.slowmo = Math.max(G.slowmo, big ? .7 : .35);
  }
  return k;
}
