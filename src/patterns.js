// Attack patterns: every foe that fights up close learns two more ways to catch you out, drawn from its own blows,
// so the same foe asks for different answers (as Nioh's foes do with their delays and extended strings).
//   Delayed:    its heaviest single blow, held at the top of its windup a long beat (the body frozen, trembling)
//               before it falls. The glint comes late, just before the blow: dodge early and it lands.
//   Relentless: its longest chain, with its first blow again on the end, quicker; or, for a foe with no chains, its
//               two heaviest single blows run together. Stop attacking after the chain you expect ends, and it
//               doesn't.
// Both are chosen a little less often than the foe's own attacks. Warlords and gatekeepers learn them too, from
// their first-phase blows; the Thornyard's sparring knights, shades, and anything that only casts or shoots don't.
// enemies.js calls addPatterns() once every foe is defined, and animates a delayed windup (step.delay).

const SINGLE = ['swing', 'backswing', 'overhead', 'thrust'];
const isMelee = a => !a.once && !a.cond && a.steps.every(s => !s.proj && !s.blink && !s.heal && !s.chant && !s.howl && !s.burrow && !s.grab && s.anim !== 'roar' && s.anim !== 'cast' && s.dmg > 0);

export function addPatterns(TYPES) {
  for (const T of Object.values(TYPES)) {
    if (!T.attacks?.length || T.shade || T.yard || T.patterns === false) continue;
    const melee = T.attacks.filter(isMelee);
    const singles = melee.filter(a => a.steps.length === 1 && SINGLE.includes(a.steps[0].anim)).sort((a, b) => b.steps[0].dmg - a.steps[0].dmg);
    const chains = melee.filter(a => a.steps.length >= 2).sort((a, b) => b.steps.length - a.steps.length || b.steps[0].dmg - a.steps[0].dmg);
    const add = [];
    const H = singles[0];
    if (H) {
      const s = H.steps[0];
      add.push({ ...H, name: `Delayed ${H.name}`, steps: [{ ...s, windup: +(s.windup * 1.9 + .25).toFixed(2), delay: true }], w: +((H.w ?? 1) * .55).toFixed(2), cd: Math.max(H.cd || 0, 4), pattern: 'delayed' });
    }
    const C = chains[0];
    if (C) {
      const f = C.steps[0], n = C.steps.length;
      const steps = C.steps.map((s, i) => (i === n - 1 ? { ...s, recover: Math.min(s.recover, .22) } : s));
      steps.push({ ...f, windup: +Math.max(.22, f.windup * .6).toFixed(2), dmg: Math.round(f.dmg * 1.15), recover: Math.max(C.steps[n - 1].recover, .9) });
      add.push({ ...C, name: `Relentless ${C.name}`, steps, w: +((C.w ?? 1) * .6).toFixed(2), cd: Math.max(C.cd || 0, 3), pattern: 'relentless' });
    } else if (singles.length >= 2) {
      const [a, b] = singles;
      add.push({ name: `Relentless ${a.name}`, range: Math.min(a.range, b.range), minRange: 0, cd: 3, w: .6, pattern: 'relentless',
        steps: [{ ...a.steps[0], recover: .22 }, { ...b.steps[0], windup: +Math.max(.22, b.steps[0].windup * .6).toFixed(2) }] });
    }
    if (add.length) T.attacks = [...T.attacks, ...add];
  }
}
