// The menus' look, after Nioh's: a header plaque at the top left, lists whose chosen row glows gold, a bar of
// key hints along the bottom right (keyboard keys, or the gamepad's buttons when one is in use), and an ink-wash
// ring behind the Moonwell and pause menus. menu.js builds its screens from these.
import { KEY_LABEL, PAD_LABEL, PS_LABEL } from './input.js';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// A key or button, as the player would press it.
export function glyph(G, action) {
  const inp = G.input;
  const t = inp.usingPad ? (inp.padPS ? PS_LABEL : PAD_LABEL)[action] : KEY_LABEL[action];
  return `<kbd class="k ${inp.usingPad ? (inp.padPS ? 'ps' : 'xb') : 'kb'}">${esc(t ?? action)}</kbd>`;
}

// The header plaque: a sigil, the title, and what it is about.
export const head = (title, sub = '') => `<div class="nhead"><i class="sigil"></i><div><h1>${esc(title)}</h1>${sub ? `<small>${esc(sub)}</small>` : ''}</div></div>`;

// The key-hint bar. Each hint: [input action (or several, shown side by side), label, menu act, extra attributes].
export function keybar(G, hints) {
  return `<div class="nkeys">${hints.filter(Boolean).map(([a, label, act, data = '']) => {
    const as = [].concat(a);
    return `<button class="nk" data-key="${as.join(' ')}" ${act ? `data-act="${act}"` : ''} ${data}>${as.map(x => glyph(G, x)).join('')}<span>${esc(label)}</span></button>`;
  }).join('')}</div>`;
}

// A Nioh-style list entry: a large title, a small-caps label beside it, and a line said of it when chosen.
export const entry = (act, title, label, desc = '', extra = '', off = false) =>
  `<button class="btn nitem" data-act="${act}" ${extra} ${off ? 'disabled' : ''}><b>${esc(title)}</b><span class="nlab">${esc(label)}</span>${desc ? `<span class="ndesc">${esc(desc)}</span>` : ''}</button>`;
// A whole list of them, bowed gently outward as Nioh's are. Rows: [act, title, label, desc, extra, off]; falsy rows are skipped.
export function entries(rows) {
  const list = rows.filter(Boolean), n = list.length;
  return list.map(([act, title, label, desc, extra = '', off], k) => entry(act, title, label, desc, `${extra} style="--i:${(Math.sin(Math.PI * (k + .5) / n) * 3).toFixed(2)}"`, off)).join('');
}
// The box of figures at the bottom right of the hub menus.
export const infoBox = rows => `<div class="ninfo">${rows.filter(Boolean).map(([k, v]) => `<div class="r"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`;

// An option row for settings: label, and a value with arrows either side and a dot for each choice.
export function option(key, label, value, i, n, desc = '') {
  const dots = n <= 8 ? `<span class="dots">${Array.from({ length: n }, (_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</span>` : `<span class="meter"><u style="width:${Math.round(i / (n - 1) * 100)}%"></u></span>`;
  return `<button class="btn opt" data-act="opt" data-opt="${key}" data-desc="${esc(desc)}"><span class="olab">${esc(label)}</span><span class="oval"><em class="arr l" data-dir="-1">‹</em><b>${esc(value)}</b>${dots}<em class="arr r" data-dir="1">›</em></span></button>`;
}

// The ink-wash ring behind the hub menus: pale strokes round a circle, mist, and flecks of gold, painted once.
let INK = null;
export function inkWash() {
  if (INK) return INK;
  const c = document.createElement('canvas'); c.width = c.height = 768;
  const g = c.getContext('2d'), R = (() => { let s = 90210; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const cx = 384, cy = 384;
  // Mist.
  for (let i = 0; i < 70; i++) {
    const a = R() * Math.PI * 2, r = R() * 260, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r, rad = 40 + R() * 120;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(200,205,215,${.05 + R() * .05})`); gr.addColorStop(1, 'rgba(200,205,215,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // The ring: a brush dragged round, heavy on one side and breaking up on the other.
  for (let pass = 0; pass < 3; pass++) {
    const r0 = 300 - pass * 26, a0 = -.6 + pass * .5, span = Math.PI * (1.55 - pass * .25);
    for (let k = 0; k < 900; k++) {
      const u = k / 900, a = a0 + span * u, w = Math.sin(u * Math.PI) * (26 - pass * 7) * (.6 + R() * .6);
      const r = r0 + Math.sin(a * 3 + pass) * 10 + (R() - .5) * 8, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (R() < .12 * (1 - Math.sin(u * Math.PI))) continue;   // dry brush at the ends
      g.fillStyle = `rgba(${pass ? 150 : 215},${pass ? 155 : 220},${pass ? 165 : 228},${.05 + R() * .06})`;
      g.beginPath(); g.ellipse(x, y, w, w * .45, a + Math.PI / 2, 0, Math.PI * 2); g.fill();
    }
  }
  // Splatter and gold flecks.
  for (let i = 0; i < 140; i++) {
    const a = R() * Math.PI * 2, r = 220 + R() * 150, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    g.fillStyle = R() < .35 ? `rgba(230,190,100,${.4 + R() * .5})` : `rgba(210,215,225,${.1 + R() * .25})`;
    g.beginPath(); g.arc(x, y, .8 + R() * 3.2, 0, Math.PI * 2); g.fill();
  }
  return (INK = c.toDataURL());
}

// The gamepad, drawn with what each button does (Nioh's Type A), as Nioh's Basic Actions page shows it.
export function padDiagram(ps = false) {
  const N = ps ? { LT: 'L2', LB: 'L1', RT: 'R2', RB: 'R1', Y: '△', X: '□', B: '○', A: '✕', L3: 'L3', R3: 'R3', view: 'Create', menu: 'Options' }
    : { LT: 'LT', LB: 'LB', RT: 'RT', RB: 'RB', Y: 'Y', X: 'X', B: 'B', A: 'A', L3: 'L3', R3: 'R3', view: 'View', menu: 'Menu' };
  const COL = ps ? { Y: '#4fc6a8', X: '#e27ab8', B: '#e0505a', A: '#6f9ef0' } : { Y: '#e3c04a', X: '#4a90e0', B: '#d8484e', A: '#5cb85c' };
  const t = (x, y, s, cls = 'lbl', anchor = 'start') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(s)}</text>`;
  const ln = pts => `<polyline points="${pts}" fill="none" stroke="rgba(230,195,106,.55)" stroke-width="1.3"/>`;
  const face = (k, x, y, r = 12) => `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(0,0,0,.55)" stroke="${COL[k]}" stroke-width="2"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" class="fb" fill="${COL[k]}">${N[k]}</text>`;
  const body = 'M390 110 C420 100 580 100 610 110 C650 122 668 160 676 205 L700 300 C710 345 668 360 640 330 L600 285 L400 285 L360 330 C332 360 290 345 300 300 L324 205 C332 160 350 122 390 110 Z';
  return `<svg class="pad" viewBox="0 0 1000 420" role="img" aria-label="Gamepad layout">
    <path d="${body}" fill="rgba(30,30,38,.9)" stroke="rgba(233,228,214,.45)" stroke-width="2"/>
    <rect x="372" y="64" width="62" height="24" rx="9" fill="rgba(30,30,38,.9)" stroke="rgba(233,228,214,.4)"/><rect x="566" y="64" width="62" height="24" rx="9" fill="rgba(30,30,38,.9)" stroke="rgba(233,228,214,.4)"/>
    <rect x="360" y="92" width="86" height="14" rx="7" fill="rgba(40,40,50,.95)" stroke="rgba(233,228,214,.4)"/><rect x="554" y="92" width="86" height="14" rx="7" fill="rgba(40,40,50,.95)" stroke="rgba(233,228,214,.4)"/>
    ${t(403, 81, N.LT, 'fb', 'middle')}${t(597, 81, N.RT, 'fb', 'middle')}${t(403, 103, N.LB, 'fs', 'middle')}${t(597, 103, N.RB, 'fs', 'middle')}
    <circle cx="390" cy="170" r="27" fill="rgba(0,0,0,.5)" stroke="rgba(233,228,214,.4)"/><circle cx="390" cy="170" r="17" fill="rgba(60,60,70,.9)"/>
    <circle cx="555" cy="235" r="27" fill="rgba(0,0,0,.5)" stroke="rgba(233,228,214,.4)"/><circle cx="555" cy="235" r="17" fill="rgba(60,60,70,.9)"/>
    <path d="M433 211h24v12h12v24h-12v12h-24v-12h-12v-24h12z" fill="rgba(60,60,70,.9)" stroke="rgba(233,228,214,.4)"/>
    <rect x="455" y="160" width="20" height="11" rx="5" fill="rgba(60,60,70,.9)"/><rect x="525" y="160" width="20" height="11" rx="5" fill="rgba(60,60,70,.9)"/>
    <circle cx="500" cy="136" r="11" fill="rgba(230,195,106,.25)" stroke="rgba(230,195,106,.6)"/>
    ${face('Y', 610, 144)}${face('X', 584, 170)}${face('B', 636, 170)}${face('A', 610, 196)}
    ${ln('372,76 290,58')}${t(282, 56, 'Aim (hold)', 'lbl', 'end')}${t(282, 74, 'let go to lower it', 'note', 'end')}
    ${ln('360,99 290,104')}${t(282, 104, 'Guard', 'lbl', 'end')}${t(282, 122, 'tap as a blow lands: Deflect', 'note', 'end')}
    ${ln('363,170 290,168')}${t(282, 166, 'Move', 'lbl', 'end')}${t(282, 184, `${N.L3}: Slide`, 'note', 'end')}
    ${ln('421,235 300,250')}${ln('292,206 292,296')}
    ${t(282, 214, '↑  Drink Moondew', 'lbl', 'end')}${t(282, 238, '←  Switch weapon', 'lbl', 'end')}${t(282, 262, '↓  Use Fae Art', 'lbl', 'end')}${t(282, 286, '→  Change Fae Art', 'lbl', 'end')}
    ${ln('628,76 712,58')}${t(720, 52, 'Fire (while aiming)', 'lbl')}${t(720, 70, `with ${N.X} / ${N.Y}: Soul Core skills`, 'note')}${t(720, 86, `with ${N.B}: Thorn Counter`, 'note')}
    ${ln('640,99 712,110')}${t(720, 112, 'Resonance', 'lbl')}${t(720, 130, `with ${N.Y} / ${N.X} / ${N.A}: High / Mid / Low`, 'note')}
    ${ln('650,170 700,176')}${ln('706,146 706,246')}
    ${face('Y', 728, 158, 10)}${t(746, 163, 'Strike hard', 'lbl')}
    ${face('X', 728, 184, 10)}${t(746, 189, 'Strike', 'lbl')}
    ${face('B', 728, 210, 10)}${t(746, 215, `Interact · with ${N.Y}: Fae Shift`, 'lbl')}
    ${face('A', 728, 236, 10)}${t(746, 241, 'Dodge · hold: Sprint', 'lbl')}
    ${ln('582,235 640,290 712,290')}${t(720, 288, 'Camera', 'lbl')}${t(720, 306, `${N.R3}: Lock on · flick: next target`, 'note')}
    ${t(500, 392, `${N.view} / ${N.menu}: Pause`, 'lbl', 'middle')}
    ${t(500, 412, `In menus: ${N.A} choose · ${N.B} back · ${N.LB} / ${N.RB} change page · ${N.Y} / ${N.X} the chosen item's other actions`, 'note', 'middle')}
  </svg>`;
}
