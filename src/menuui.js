// The menus' look: "moonglass and briar". Every screen is built from these parts, so they all read alike:
//   shell()   the frame: title and where you are (top left), the tabs you can flip through with Q / E (LB / RB),
//             what you are carrying (top right), the body, a line of help for whatever is chosen, and the keys.
//   panel()   a pane of dark moonglass with notched corners and a sprig of briar in two of them.
//   row()     a line in a list: an icon, a name, a note, and whatever sits at its right; the chosen row is lit
//             by a moonbeam and marked by the crescent cursor that slides to it.
//   subtabs() pages within a screen, turned with Z / C (LT / RT) or left and right.
// menu.js lays out each screen from these; menu.css styles them.
import { KEY_LABEL, PAD_LABEL, PS_LABEL } from './input.js';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------------------------------------------------------- icons
// One hand, one line weight: 24-unit squares drawn in strokes (a few filled), coloured by the text around them.
const P = {
  moon: 'M15.5 3.5a8.5 8.5 0 1 0 5 14.6A7 7 0 0 1 15.5 3.5z',
  resume: 'M15.5 3.5a8.5 8.5 0 1 0 5 14.6A7 7 0 0 1 15.5 3.5z|F:M9.5 8.5l6 3.5-6 3.5z',
  status: 'M12 3l7.5 2.8v5.7c0 4.6-3.2 7.9-7.5 9.3-4.3-1.4-7.5-4.7-7.5-9.3V5.8z|M14.2 8.4a3.8 3.8 0 1 0 1.7 5.6 3.1 3.1 0 0 1-1.7-5.6z',
  levelup: 'M12 20V8.5|M7.5 12.5L12 8l4.5 4.5|M8 4h8',
  travel: 'M7 20c1.6 0 2.4-1.2 2.4-2.6S8.6 15 7 15s-2 1.2-2 2.5S5.4 20 7 20z|M15 14c1.6 0 2.4-1.2 2.4-2.6S16.6 9 15 9s-2 1.2-2 2.5.4 2.5 2 2.5z|M8 9c1.3 0 2-1 2-2.1S9.3 5 8 5s-1.7 1-1.7 2S6.7 9 8 9z|M17 21h.01M18.5 5h.01',
  equipment: 'M5 15c0-5.6 3-10 7-10s7 4.4 7 10v4h-4.5v-4.2h-5V19H5z|M12 5v6.5|M8.2 12h7.6',
  arsenal: 'M4.5 4.5l10 10|M19.5 4.5l-10 10|M7.5 17l-3 3|M16.5 17l3 3|M6 15.5l2.5 2.5|M18 15.5L15.5 18',
  skills: 'M5 18l4.5-6 4.5 3 5-9|F:M5 18m-1.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 1 0-3.2 0|F:M9.5 12m-1.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 1 0-3.2 0|F:M14 15m-1.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 1 0-3.2 0|F:M19 6m-1.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 1 0-3.2 0',
  moves: 'M12 3l3.4 4.5H8.6z|M12 10l3 2-3 2-3-2z|M8.6 16.5h6.8L12 21z',
  wardrobe: 'M12 6.2a1.9 1.9 0 1 1 1.9 1.9c-1 0-1.9.8-1.9 1.9|M12 10L4 15h16z|M6.5 15l1 5.5h9l1-5.5',
  journal: 'M4 5.5c3-1.2 6-1.2 8 .8 2-2 5-2 8-.8v13c-3-1.2-6-1.2-8 .8-2-2-5-2-8-.8z|M12 6.3v13',
  bestiary: 'M7.5 4c1.2 5.2.4 11-2 16|M12.5 4c1.2 5.2.4 11-2 16|M17.5 4c1.2 5.2.4 11-2 16',
  deeds: 'M12 3l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.5l-5.3 2.9 1.1-6-4.4-4.1 6-.8z',
  settings: 'M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z|M12 2.5v3|M12 18.5v3|M2.5 12h3|M18.5 12h3|M5.3 5.3l2.1 2.1|M16.6 16.6l2.1 2.1|M5.3 18.7l2.1-2.1|M16.6 7.4l2.1-2.1',
  controls: 'M7 8.5h10a4.5 4.5 0 0 1 4.5 4.5v1a3 3 0 0 1-5.2 2L14.5 14h-5l-1.8 2a3 3 0 0 1-5.2-2v-1A4.5 4.5 0 0 1 7 8.5z|M7.5 11v4|M5.5 13h4|F:M16 11.2m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0|F:M18 13.6m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0',
  quit: 'M14 4H5v16h9|M10 12h10|M16.5 8.5L20 12l-3.5 3.5',
  patron: 'M12 20.5c-4.4-3-7.5-7-7.5-11.5 3 0 5.4 2 7.5 5.2 2.1-3.2 4.5-5.2 7.5-5.2 0 4.5-3.1 8.5-7.5 11.5z|M12 14.2V9|M12 5.5h.01',
  kinship: 'M8 10.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z|M16 10.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z|M3 19.5c0-3 2.2-5.2 5-5.2s5 2.2 5 5.2|M11 19.5c0-3 2.2-5.2 5-5.2s5 2.2 5 5.2',
  market: 'M9 3.5h6|M10.5 3.5V6|M13.5 3.5V6|M8 6.5h8l-1 11H9z|M10 20.5h4|M12 17.5v3|M12 9.5c1.2 1.4 1.2 3 0 4.5-1.2-1.5-1.2-3.1 0-4.5z',
  charms: 'M8 3c0 3.2 1.6 5.4 4 6.4 2.4-1 4-3.2 4-6.4|M12 9.5v1.5|M12 11l-4 5 4 5 4-5z',
  crossroads: 'M12 3v18|M12 6h7l2 2-2 2h-7|M12 12.5H5l-2 2 2 2h7',
  rise: 'M5 21h14|M12 17V5|M7.5 9.5L12 5l4.5 4.5',
  sword: 'M14.5 3.5l6-.5-.5 6-9 9-3.1-3.1z|M7.5 13.5l-3.2 3.2 3 3 3.2-3.2|M4.8 19.2L3 21',
  helm: 'M5 15c0-5.6 3-10 7-10s7 4.4 7 10v4h-4.5v-4.2h-5V19H5z|M12 5v6.5|M8.2 12h7.6',
  mail: 'M8 3.5l4 2 4-2 3.5 3-2.5 3v11h-10v-11L4.5 6.5z|M12 5.5v15',
  hands: 'M8.5 21v-6.5L5.5 11.2l1.2-1.1 1.8 1.4V5.8a1.2 1.2 0 0 1 2.4 0V10V4.6a1.2 1.2 0 0 1 2.4 0V10V5.6a1.2 1.2 0 0 1 2.4 0V11V8a1.2 1.2 0 0 1 2.4 0v7.2L16.5 21z',
  legs: 'M9 3h6v10l2 5v3H7v-3l2-5z|M9 8h6',
  core: 'M12 3l7 6-7 12L5 9z|M5 9h14|M9 9l3 12 3-12',
  petal: 'M12 21c-5-4-6.2-9.2-3-14.2C10 8.8 11 9.8 12 9.8s2-1 3-3c3.2 5 2 10.2-3 14.2z',
  cup: 'M5 6h14c0 5-3 8-7 8S5 11 5 6z|M12 14v4|M8 20h8|M8.5 3.5l1 1M12 2.5v1.5M15.5 3.5l-1 1',
  vial: 'M10 3h4|M10.5 3v5L6.3 15.4A3.3 3.3 0 0 0 9.2 20.5h5.6a3.3 3.3 0 0 0 2.9-5.1L13.5 8V3|M7.5 14h9',
  purse: 'M8 7.5h8l3 5c1 4.2-2 8-7 8s-8-3.8-7-8z|M9 7.5l-1.2-3.5h8.4L15 7.5|M12 11.5v5M10 13h3.2a1.2 1.2 0 0 1 0 2.4H10',
  dye: 'M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z|M9.5 15.5a2.5 2.5 0 0 0 2.5 2.5',
  grave: 'M7 21V10a5 5 0 0 1 10 0v11|M4 21h16|M12 11.5v6|M9.8 13.7h4.4',
  sides: 'M6 21v-7c0-4 6-4 6-8V3|M12 8c0 4 6 4 6 8v5',
  abyss: 'M12 12.5a1 1 0 1 1 1-1 3 3 0 1 1-3.7 3 5 5 0 1 1 6.2 5.3|M4 20c2.4.8 5 .8 7.5 0',
  glimmer: 'F:M12 2.5c.9 5.4 3.9 8.6 9.5 9.5-5.6.9-8.6 4.1-9.5 9.5-.9-5.4-3.9-8.6-9.5-9.5 5.6-.9 8.6-4.1 9.5-9.5z',
  lock: 'M7.5 11V8a4.5 4.5 0 0 1 9 0v3|M5.5 11h13v10h-13z|M12 15v2.5',
  check: 'M5 12.5l4.2 4.2L19 7',
  hammer: 'M13.5 4l6.5 6.5-3 3L10.5 7z|M11.5 9L4 20',
  anvil: 'M3.5 8h12c0 3 2 4 5 4v2h-7.5l-1 3h3v3.5h-9V17h3l-1-3H6c0-3-2.5-6-2.5-6z',
  bow: 'M6.5 3c8 3.2 8 14.8 0 18|M6.5 3v18|M3.5 12H19|M16 9l3 3-3 3',
  sparkle: 'M12 3v5M12 16v5M3 12h5M16 12h5|M6.5 6.5l2.5 2.5M15 15l2.5 2.5M6.5 17.5L9 15M15 9l2.5-2.5',
  library: 'M4 4.5h16v15H4z|M4 15.5l5-5 4 4 3-3 4 4|F:M15.5 8.5m-1.5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0',
  letter: 'M4 6h16v12H4z|M4 6.5l8 6 8-6',
  pixie: 'M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0|M10 11C7 6 3.5 6.5 4.5 10s4.5 2.5 5.5 2|M14 11c3-5 6.5-4.5 5.5-1s-4.5 2.5-5.5 2|M10.5 13.5c-2.5 3.5-2 6-.5 6s1.8-3 1.5-5M13.5 13.5c2.5 3.5 2 6 .5 6s-1.8-3-1.5-5',
  realm: 'M12 12m-8.5 0a8.5 8.5 0 1 0 17 0 8.5 8.5 0 1 0-17 0|M12 12m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0|F:M12 12m-1.3 0a1.3 1.3 0 1 0 2.6 0 1.3 1.3 0 1 0-2.6 0',
  chev: 'M9 5l7 7-7 7',
  dot: 'F:M12 12m-2.2 0a2.2 2.2 0 1 0 4.4 0 2.2 2.2 0 1 0-4.4 0',
  diamond: 'M12 5l6 7-6 7-6-7z',
  crown: 'M4 18h16l-1.5-9-4.5 4-2-6-2 6-4.5-4z|M4 21h16',
};
// An icon by name, as inline SVG. A leading 'F:' fills that part instead of stroking it.
export function icon(name, cls = '') {
  const d = P[name] || P.dot;
  const parts = d.split('|').map(s => s.startsWith('F:') ? `<path d="${s.slice(2)}" fill="currentColor" stroke="none"/>` : `<path d="${s}"/>`).join('');
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${parts}</svg>`;
}

// The moon as it is tonight: a disc with its lit part. frac is how far through the month (0 new, .5 full).
export function moonDisc(frac = .5, cls = '') {
  const lit = (1 - Math.cos(frac * Math.PI * 2)) / 2, wax = frac < .5, r = 50, k = Math.abs(1 - 2 * lit) * r;
  const big = wax ? (lit > .5 ? 1 : 0) : (lit > .5 ? 0 : 1);   // which way the terminator bulges
  const lx = wax ? 'M50 0 A50 50 0 0 1 50 100' : 'M50 0 A50 50 0 0 0 50 100';
  const term = `A${k.toFixed(2)} 50 0 0 ${big} 50 0`;
  return `<svg class="mxmoon ${cls}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="${r}" class="dark"/>${lit > .01 ? `<path d="${lx} ${term}Z" class="lit"/>` : ''}<circle cx="50" cy="50" r="${r - .6}" class="rim"/></svg>`;
}

// ---------------------------------------------------------------- keys
// A key or button, as the player would press it.
export function glyph(G, action) {
  const inp = G.input;
  const t = inp.usingPad ? (inp.padPS ? PS_LABEL : PAD_LABEL)[action] : KEY_LABEL[action];
  return `<kbd class="k ${inp.usingPad ? (inp.padPS ? 'ps' : 'xb') : 'kb'} ${esc(action)}">${esc(t ?? action)}</kbd>`;
}
// The key bar. Each hint: [input action (or several), label, menu act, extra attributes].
export function keybar(G, hints) {
  return `<div class="nkeys">${hints.filter(Boolean).map(([a, label, act, data = '']) => {
    const as = [].concat(a);
    return `<button class="nk" data-key="${as.join(' ')}" ${act ? `data-act="${act}"` : ''} ${data}>${as.map(x => glyph(G, x)).join('')}<span>${esc(label)}</span></button>`;
  }).join('')}</div>`;
}

// ---------------------------------------------------------------- the frame
// shell({ title, crumb, spine: [{ id, name, icon, badge }], at, chips: [[icon, text, cls]], layout, body, hints, cls, moon })
export function shell(G, o) {
  const spine = o.spine?.length ? `<nav class="mx-spine">${glyph(G, 'mPrev')}${o.spine.map(t => `<button class="mx-tab ${t.id === o.at ? 'on' : ''}" data-act="spine" data-to="${t.id}" title="${esc(t.name)}">${icon(t.icon)}<span>${esc(t.name)}</span>${t.badge ? `<i class="bd">${esc(t.badge)}</i>` : ''}</button>`).join('')}${glyph(G, 'mNext')}</nav>` : '';
  const chips = (o.chips || []).filter(Boolean).map(([ic, text, c = '']) => `<span class="mx-chip ${c}">${icon(ic)}<b>${esc(text)}</b></span>`).join('');
  return `<div class="mx ${o.layout || ''} ${o.cls || ''}">
    ${o.moon != null ? `<div class="mx-moonmark">${moonDisc(o.moon)}</div>` : ''}
    <header class="mx-top"><div class="mx-title"><i class="mx-sigil">${icon(o.sigil || 'moon')}</i><div><h1>${esc(o.title)}</h1>${o.crumb ? `<small>${esc(o.crumb)}</small>` : ''}</div></div>${spine}<div class="mx-chips">${chips}</div></header>
    <main class="mx-body">${o.body}</main>
    <footer class="mx-foot"><div class="mx-help"></div>${keybar(G, o.hints || [])}</footer>
  </div>`;
}
// A pane of moonglass. head: a title and what sits at its right.
export const panel = (inner, cls = '', head = null) => `<section class="mx-panel ${cls}"><i class="orn tl"></i><i class="orn br"></i>${head ? `<div class="mx-ph"><span>${esc(head[0])}</span>${head[1] ? `<em>${head[1]}</em>` : ''}</div>` : ''}${inner}</section>`;
// A list, with the crescent cursor that slides to the chosen row.
export const list = (rows, cls = '') => `<div class="mx-list ${cls}"><i class="mx-cursor">${icon('moon')}</i>${rows}</div>`;
// A row. o: { act, icon, title, note, right, desc, extra, off, cls, color, tag }
export function row(o) {
  return `<button class="btn mx-row ${o.cls || ''}" data-act="${o.act || 'none'}" ${o.extra || ''} ${o.desc ? `data-desc="${esc(o.desc)}"` : ''} ${o.off ? 'disabled' : ''}>`
    + `${o.icon ? `<span class="ri"${o.color ? ` style="color:${o.color}"` : ''}>${o.icon.startsWith('<') ? o.icon : icon(o.icon)}</span>` : ''}`
    + `<span class="rm"><b${o.color ? ` style="color:${o.color}"` : ''}>${o.titleHtml ?? esc(o.title)}${o.tag ? `<i class="tag">${esc(o.tag)}</i>` : ''}</b>${o.note ? `<small>${o.noteHtml ? o.note : esc(o.note)}</small>` : ''}</span>`
    + `${o.right != null ? `<span class="rr">${o.right}</span>` : ''}</button>`;
}
// A heading between rows (not chosen).
export const divider = text => `<div class="mx-div"><span>${esc(text)}</span></div>`;
// Pages within a screen: turned with Z / C (LT / RT), or left and right, or a click.
export function subtabs(G, pages, at, act) {
  return `<div class="mx-sub">${glyph(G, 'mSubPrev')}<div class="st">${pages.map((p, i) => `<button class="${i === at ? 'on' : ''}" data-act="${act}" data-to="${i}">${p.icon ? icon(p.icon) : ''}<span>${esc(p.name ?? p)}</span>${p.badge ? `<i class="bd">${esc(p.badge)}</i>` : ''}</button>`).join('')}</div>${glyph(G, 'mSubNext')}</div>`;
}
// Figures, label beside value.
export const stats = (rows, cls = '') => `<div class="mx-stats ${cls}">${rows.filter(Boolean).map(([k, v, c = '']) => `<div class="s ${c}"><span>${esc(k)}</span><b>${v}</b></div>`).join('')}</div>`;
// A heading inside a detail pane.
export const sec = text => `<div class="mx-sec"><span>${esc(text)}</span></div>`;
// An option: label, and a value between arrows with a pip for each choice (or a meter).
export function option(key, label, value, i, n, desc = '', act = 'opt', swatch = '') {
  const pips = n <= 9 ? `<span class="pips">${Array.from({ length: n }, (_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</span>` : `<span class="meter"><u style="width:${Math.round(i / Math.max(1, n - 1) * 100)}%"></u></span>`;
  return `<button class="btn mx-opt" data-act="${act}" data-opt="${key}" data-desc="${esc(desc)}"><span class="ol">${esc(label)}</span><span class="ov"><em class="arr" data-dir="-1">${icon('chev', 'l')}</em><b>${swatch}${esc(value)}</b><em class="arr" data-dir="1">${icon('chev')}</em>${pips}</span></button>`;
}
// A bar that fills: value 0..1.
export const meter = (k, cls = '') => `<span class="mx-meter ${cls}"><u style="width:${Math.round(Math.max(0, Math.min(1, k)) * 100)}%"></u></span>`;

// ---------------------------------------------------------------- the gamepad, drawn
// What each button does (Nioh's Type A), as Nioh's Basic Actions page shows it.
export function padDiagram(ps = false) {
  const N = ps ? { LT: 'L2', LB: 'L1', RT: 'R2', RB: 'R1', Y: '△', X: '□', B: '○', A: '✕', L3: 'L3', R3: 'R3', view: 'Create', menu: 'Options' }
    : { LT: 'LT', LB: 'LB', RT: 'RT', RB: 'RB', Y: 'Y', X: 'X', B: 'B', A: 'A', L3: 'L3', R3: 'R3', view: 'View', menu: 'Menu' };
  const COL = ps ? { Y: '#4fc6a8', X: '#e27ab8', B: '#e0505a', A: '#6f9ef0' } : { Y: '#e3c04a', X: '#4a90e0', B: '#d8484e', A: '#5cb85c' };
  const t = (x, y, s, cls = 'lbl', anchor = 'start') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(s)}</text>`;
  const ln = pts => `<polyline points="${pts}" fill="none" stroke="rgba(242,184,255,.5)" stroke-width="1.3"/>`;
  const face = (k, x, y, r = 12) => `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(0,0,0,.55)" stroke="${COL[k]}" stroke-width="2"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" class="fb" fill="${COL[k]}">${N[k]}</text>`;
  const body = 'M390 110 C420 100 580 100 610 110 C650 122 668 160 676 205 L700 300 C710 345 668 360 640 330 L600 285 L400 285 L360 330 C332 360 290 345 300 300 L324 205 C332 160 350 122 390 110 Z';
  const S = 'rgba(206,214,238,.42)', F = 'rgba(22,26,42,.95)';
  return `<svg class="pad" viewBox="0 0 1000 420" role="img" aria-label="Gamepad layout">
    <path d="${body}" fill="${F}" stroke="${S}" stroke-width="2"/>
    <rect x="372" y="64" width="62" height="24" rx="9" fill="${F}" stroke="${S}"/><rect x="566" y="64" width="62" height="24" rx="9" fill="${F}" stroke="${S}"/>
    <rect x="360" y="92" width="86" height="14" rx="7" fill="${F}" stroke="${S}"/><rect x="554" y="92" width="86" height="14" rx="7" fill="${F}" stroke="${S}"/>
    ${t(403, 81, N.LT, 'fb', 'middle')}${t(597, 81, N.RT, 'fb', 'middle')}${t(403, 103, N.LB, 'fs', 'middle')}${t(597, 103, N.RB, 'fs', 'middle')}
    <circle cx="390" cy="170" r="27" fill="rgba(0,0,0,.5)" stroke="${S}"/><circle cx="390" cy="170" r="17" fill="rgba(50,56,78,.9)"/>
    <circle cx="555" cy="235" r="27" fill="rgba(0,0,0,.5)" stroke="${S}"/><circle cx="555" cy="235" r="17" fill="rgba(50,56,78,.9)"/>
    <path d="M433 211h24v12h12v24h-12v12h-24v-12h-12v-24h12z" fill="rgba(50,56,78,.9)" stroke="${S}"/>
    <rect x="455" y="160" width="20" height="11" rx="5" fill="rgba(50,56,78,.9)"/><rect x="525" y="160" width="20" height="11" rx="5" fill="rgba(50,56,78,.9)"/>
    <circle cx="500" cy="136" r="11" fill="rgba(242,184,255,.18)" stroke="rgba(242,184,255,.6)"/>
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
    ${t(500, 412, `In menus: ${N.A} choose · ${N.B} back · ${N.LB} / ${N.RB} tabs · ${N.LT} / ${N.RT} pages · ${N.Y} / ${N.X} more actions`, 'note', 'middle')}
  </svg>`;
}
