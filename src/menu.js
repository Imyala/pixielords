// Full-screen menus: title, pause, the Moonwell and all it opens onto, Gear, the Fae Crossroads map's overlay,
// controls, movesets, the Journal, the Bestiary, settings, and the cleared and ending screens. Every one is laid out
// in the same frame (menuui.js): title and place at the top left, the hub's tabs along the top (Q / E, LB / RB),
// pages within a screen (Z / C, LT / RT), a line of help for whatever is chosen, and the keys. The pause menu and
// the Moonwell are hubs: their first tab is a list of everything, the rest flip past one another as Nioh's do.
// Mouse, keyboard (arrows, held to keep going) and gamepad (d-pad or stick) all work.
import { derive, ATK, WEAPONS } from './player.js';
import { FORMS, KIT } from './movesets.js';
import { levelCost, forgeCost, FORGE, SETTINGS_DEFAULT } from './save.js';
import { CHARMS, CHARM_SLOTS } from './charms.js';
import { roman } from './overworld.js';
import { RANGED } from './ranged.js';
import { RARITY, SLOTS, SLOT_NAME, SETS, fxText, itemName, weaponMul, armorDef, defReduce, dismantleValue, reforgeCost, soulMatchCost, SWORN, scalingOf, temperCost, TEMPER, moonsteelOf, fxVal } from './gear.js';
import { TIER, DEED_GLIMMER } from './deeds.js';
import { PACK } from './loot.js';
import { CORES, CORE_MAX } from './cores.js';
import { SIDES, sidesOf } from './sides.js';
import { wayName, wayDesc, wayLvl } from './ways.js';
import { themeOf, depthScale } from './underbriar.js';
import { TREE, xpFor, pointsAt, treeCost, canLearn, treeFor, SKILL_KITS, MECH_MASTERY } from './skills.js';
import { esc, glyph, keybar, shell, panel, list, row, divider, subtabs, stats, sec, option, meter, icon, moonDisc, padDiagram } from './menuui.js';
import { PATRONS, PATRON_ORDER, shiftText } from './patrons.js';
import { OMENS, phaseOf } from './moontonight.js';
import { PAD_LABEL, PS_LABEL, KEY_LABEL, REBIND, keyName, boundKey, defaultKey } from './input.js';
import { gravePetals } from './graves.js';
import { bestiary, ACTS, ROLE_COLOR, traits, coreOf, artsOf, known } from './bestiary.js';
import { TRIALS, TRIAL_GROUPS, TRIAL_PAY, trialLock, trialsPassed } from './trials.js';
import { MARKET_TABS, VIAL_MAX } from './market.js';
import { CUP_MAX } from './kindred.js';
import { DYES, DYE_ORDER, LOOK_PARTS } from './wardrobe.js';

const STATS = [
  { k: 'vit', name: 'Vitality', desc: 'Maximum health' },
  { k: 'end', name: 'Endurance', desc: 'Maximum stamina' },
  { k: 'str', name: 'Strength', desc: 'Weapon damage, by its Strength grade' },
  { k: 'spi', name: 'Spirit', desc: 'Faelight, Fae Shift length, and damage by its Spirit grade' },
];

// Settings, page by page. A row is a list of choices (vals, names) or a range (min, max, step).
const pct = v => `${Math.round(v * 100)}%`;
const SETTINGS = [
  { name: 'Game', rows: [
    { k: 'difficulty', label: 'Difficulty', vals: [0, 1, 2], names: ['Moonlit', 'Knight', 'Eclipse'], desc: 'Moonlit: foes hit for 60%, and the Deflect window is wider. Knight: the fight as it was made. Eclipse: foes are a sixth hardier, hit a third harder and press harder.' },
    { k: 'readPause', label: 'Pause while reading', vals: [true, false], names: ['On', 'Off'], desc: 'The world waits while a letter, a lantern-wisp\'s words or a tip are open.' },
    { k: 'tips', label: 'Tips', vals: [true, false], names: ['Show', 'Hide'], desc: 'A few words the first time something new is found: a weapon, gear, a Soul Core, a charm.' },
    { k: 'lockHeight', label: 'Lock-on camera height', vals: [0, 1, 2], names: ['Low', 'Normal', 'High'], desc: 'How far above the knight the camera sits while locked on. Tilt it yourself with the mouse or right stick too.' },
    { k: 'camDist', label: 'Camera distance', vals: [0, 1, 2], names: ['Near', 'Normal', 'Far'], desc: 'How far behind the knight the camera follows.' },
    { k: 'realMoon', label: 'Follow the real moon', vals: [true, false], names: ['On', 'Off'], desc: 'The moon in the game keeps the real moon\'s phase, with a small blessing for each, and three missions lie under an omen every night.' },
  ] },
  { name: 'Camera', rows: [
    { k: 'sens', label: 'Camera sensitivity', min: .2, max: 3, step: .1, fmt: v => v.toFixed(1), desc: 'How fast the mouse and right stick turn the camera.' },
    { k: 'invertY', label: 'Invert vertical', vals: [false, true], names: ['Normal', 'Inverted'], desc: 'Flip the camera\'s up and down.' },
    { k: 'shake', label: 'Screen shake', min: 0, max: 1, step: .1, fmt: pct, desc: 'How hard heavy blows and landings shake the view.' },
  ] },
  { name: 'Sound', rows: [
    { k: 'master', label: 'Master volume', min: 0, max: 1, step: .05, fmt: pct, desc: 'Everything at once.' },
    { k: 'music', label: 'Music', min: 0, max: 1, step: .05, fmt: pct, desc: 'The score.' },
    { k: 'sfx', label: 'Effects', min: 0, max: 1, step: .05, fmt: pct, desc: 'Steel, footfalls, spells and the world around.' },
  ] },
  { name: 'Display', rows: [
    { k: 'quality', label: 'Quality', vals: [1, 0], names: ['High', 'Fast'], desc: 'High: moonlit shadows and a sharper image. Fast: for slower machines.' },
    { k: 'glow', label: 'Glow and grade', vals: [true, false], names: ['On', 'Off'], desc: 'Light that blooms past white, each place\'s own colour, a vignette and fine grain, and the moment\'s colour (low health, the Fae Shift, a realm). Off: a plainer, lighter image.' },
  ] },
];

// The keys the player may move (input.js REBIND), grouped as the game plays; and those that stay where they are.
const REBIND_GROUPS = [
  ['Moving', [['up', 'Move forward'], ['down', 'Move back'], ['left', 'Move left'], ['right', 'Move right'], ['dodge', 'Dodge · hold to sprint · Wingleap'], ['slide', 'Slide (at a sprint)'], ['interact', 'Interact']]],
  ['Fighting', [['light', 'Strike'], ['heavy', 'Strike hard'], ['guard', 'Guard · tap as a blow lands to Deflect'], ['burst', 'Thorn Counter'], ['lock', 'Lock on'], ['stanceHigh', 'High stance'], ['stanceMid', 'Mid stance'], ['stanceLow', 'Low stance'], ['stanceUp', 'Stance up'], ['stanceDown', 'Stance down'], ['swap', 'Switch weapon']]],
  ['Faelight and tools', [['shift', 'Fae Shift (hold it and strike for the Soul Cores)'], ['art', 'Use Fae Art'], ['artNext', 'Change Fae Art'], ['aim', 'Aim the ranged weapon'], ['heal', 'Drink Moondew']]],
];
const FIXED_KEYS = [['Camera', 'Mouse'], ['Switch target', 'Wheel', 'Tab'], ['Pause', 'Esc'], ['Menus: choose · back', 'Enter', 'Esc'], ['Menus: tabs · pages', 'Q E', 'Z C'], ['Menus: the chosen item\'s other actions', 'F', 'R']];
// Techniques, on both: [name, keyboard, gamepad (with P(action) for the pad's own labels)].
const TECH = [
  ['Deflect', 'tap Shift as a blow lands', P => `tap ${P.guard} as a blow lands`],
  ['Flashcut', 'strike straight after a Deflect', P => `${P.light} straight after a Deflect`],
  ['Resonance', 'tap Shift as blue light gathers after a strike', P => `${P.pulse} as blue light gathers (or tap ${P.guard})`],
  ['Resonant Shift', 'change stance in the Resonance', P => `${P.stance} in the Resonance`],
  ['Pause combo', 'two strikes, wait for the glint, strike', P => `${P.light} ${P.light}, wait for the glint, ${P.light}`],
  ['Finisher', 'strikes, then strike hard', P => `${P.light}…, then ${P.heavy}`],
  ['Switch Strike', 'V as a strike ends', P => `${P.swap} as a strike ends`],
  ['Launcher', 'hold Shift + LMB', P => `hold ${P.guard} + ${P.light}`],
  ['Starfall · air dash', 'in the air: RMB · Space', P => `in the air: ${P.heavy} · ${P.dodge}`],
  ['Weapon Skill (once learned)', 'hold Shift + RMB', P => `hold ${P.guard} + ${P.heavy}`],
  ['Backstep Strike (once learned)', 'Space with no direction, then LMB', P => `${P.dodge} with no direction, then ${P.light}`],
  ['Guard Counter (once learned)', 'LMB straight after a block', P => `${P.light} straight after a block`],
  ['Charge a heavy (Moonglaive)', 'hold RMB', P => `hold ${P.heavy}`],
  ['Slide attack · Wingleap', 'from a slide: LMB · Space', P => `from a slide: ${P.light} · ${P.dodge}`],
  ['Moonstep Riposte', 'dodge at the last instant, then strike', P => `${P.dodge} at the last instant, then ${P.light}`],
  ['Soul Core skills', 'hold G, then LMB / RMB', P => `${P.core0} · ${P.core1}`],
  ['Execute · Ambush', 'strike a Shattered foe · an unaware foe from behind', () => 'the same'],
];
const TIPS = [
  ['Stamina', 'fuels strikes, dashes and blocked blows. Run dry and you stagger, out of breath.'],
  ['Resonance', 'as a strike ends, blue light gathers around you. Tap guard then and the stamina you spent flows back. Change stance in that moment for a Resonant Shift.'],
  ['Forms', 'every weapon fights its own way in each stance (High hits hardest, Mid is balanced, Low is quick). Strike standing still and on the move for two different chains; two strikes in, wait for the glint for the pause combo; strike then heavy for a finisher. See Movesets.'],
  ['Deflect', 'by tapping guard just as a blow lands. Strike straight after for a Flashcut, one cut that fells ordinary foes and chains from one to the next. Dread strikes glow red and can\'t be guarded: dodge through them, or Thorn Counter as they land.'],
  ['Moonstep', 'dodge at the last instant and the world slows. Strike straight after for a Moonstep Riposte.'],
  ['Shattered', 'drain a foe\'s stamina bar and it is Shattered: strike to Execute. Strike unaware foes from behind for an Ambush.'],
  ['Arsenal', 'you carry two weapons at a time; choose them in the Arsenal and forge them stronger at a Moonwell.'],
  ['Gear', 'foes drop weapons and armour, marked by beams in their rarity\'s colour. Rarer pieces carry more effects; two or four pieces of one set wake its bonuses. At a Moonwell, reforge a piece\'s effects or soul-match it to a higher level.'],
  ['Soul Cores', 'set two under Equipment: each lends a passive and a skill that costs Faelight. A core found again fuses into the one you hold.'],
  ['Skills', 'blows landed teach a weapon; spend its points under Skills on new moves and mastery.'],
  ['Ranged', 'aim to bring the camera over your shoulder and fire. Shots to the head hit harder. Ammunition refills at every Moonwell.'],
  ['Launcher', 'hold guard and strike to throw a foe skyward and leap after it; a heavy in the air is the Starfall.'],
  ['Side missions', 'a cleared mission offers three more on the Crossroads map: Twilight, a Hunt and a Duel with a Revenant.'],
  ['Champions', 'foes risen with affixes, named for them and ringed in their colour. Hardier, and richer.'],
  ['Ways', 'each New Game+ is a Way: foes grow hardier, gear drops higher, and Divine gear appears.'],
  ['The Underbriar', 'from the Crossroads map: an endless maze made anew at every depth, a warlord every fifth.'],
  ['Deeds', 'long goals kept across everything. Each tier pays Glimmer and a small bonus for good.'],
  ['Patron Spirits', 'every warlord holds a fae spirit captive; fell it and the spirit is freed. Pledge to one at a Moonwell (Patronage): it lends passives and changes your Fae Shift, its element, its strength and how long it lasts.'],
  ['The Moon Tonight', 'the moon in the game keeps the real moon\'s phase, and each phase lends a small blessing. Each night three missions lie under an omen (Harvest, Blood or Hunter\'s Moon), marked ☾ on the map. It can be turned off in Settings.'],
  ['Revenant Graves', 'two bloodied graves lie in every mission, where fae knights fell before you. Examine one to raise its Revenant, in the harness it died in and with the weapon it carried. Lay it to rest for Moonpetals and a piece of what it wore or carried. The grave then stays dark until you rest at a Moonwell, and another knight lies in it.'],
  ['The Hidden Market', 'a pixie pedlar at every Moonwell who takes only Moonpetals: Fabled and Moonlit gear from the sets you have reached, Moondew Vials, purses of Glimmer, Soul Cores, Grave Lanterns and dyes. The wares change every night at noon.'],
  ['Wardrobe', 'wear the look of any set you have carried a piece of, whatever you actually wear, and dye the plate, cloak, trim, wings and visor.'],
  ['Kindred Spirits', 'at a Moonwell (Kinship), pour out a Moon Cup and a kindred fae knight walks the mission beside you, fighting as you do. Foes turn on it too. Fallen, stand over its echo to raise it for a third of your health. It goes home when a warlord falls or you rest.'],
  ['Umbral Realms', 'one foe in every mission spreads a ring of purple dusk. Inside, stamina returns slower and foes hit harder, but Faelight comes faster. Fell its Umbral host to dispel it, for better spoils.'],
  ['Bestiary', 'in the Journal: every foe, where it is met, its arts and ways, its Soul Core, and how many you have felled.'],
];

const CPAGES = ['Keyboard & Mouse', 'Gamepad', 'Techniques', 'How it plays'];

const hex = n => '#' + n.toString(16).padStart(6, '0');
const col = r => hex(RARITY[r].color);
const kbKeys = (...ks) => ks.map(k => k.split('+').map(x => `<kbd class="k kb">${esc(x)}</kbd>`).join(' + ')).join(' <i>or</i> ');

// The tabs a hub opens onto, flipped through with Q / E (LB / RB): the pause menu's, the Moonwell's, and the title's.
const TAB = {
  pause: { name: 'Knight', icon: 'status' }, shrine: { name: 'Moonwell', icon: 'moon' }, title: { name: 'Title', icon: 'moon' },
  levelup: { name: 'Level up', icon: 'levelup' }, gear: { name: 'Equipment', icon: 'equipment' }, arsenal: { name: 'Arsenal', icon: 'arsenal' },
  skills: { name: 'Skills', icon: 'skills' }, moves: { name: 'Movesets', icon: 'moves' }, wardrobe: { name: 'Wardrobe', icon: 'wardrobe' },
  journal: { name: 'Journal', icon: 'journal' }, bestiary: { name: 'Bestiary', icon: 'bestiary' }, deeds: { name: 'Deeds', icon: 'deeds' },
  settings: { name: 'Settings', icon: 'settings' }, controls: { name: 'Controls', icon: 'controls' }, patrons: { name: 'Patronage', icon: 'patron' },
  kinship: { name: 'Kinship', icon: 'kinship' }, market: { name: 'Hidden Market', icon: 'market' }, charms: { name: 'Charms', icon: 'charms' },
};
// The pack's orders (Equipment, the V key or R3): best first, rarest first, newest first.
const GEAR_SORT = [['best', 'best'], ['rarity', 'rarity'], ['newest', 'newest']];
const PAUSE_TABS = ['pause', 'gear', 'arsenal', 'skills', 'moves', 'wardrobe', 'journal', 'bestiary', 'deeds', 'settings', 'controls'];
const WELL_TABS = ['shrine', 'levelup', 'gear', 'arsenal', 'skills', 'patrons', 'kinship', 'market', 'wardrobe', 'charms', 'journal', 'deeds'];
const TITLE_TABS = ['settings', 'controls'];
const SLOT_ICON = { head: 'helm', body: 'mail', hands: 'hands', legs: 'legs' };
const ROLE_ICON = { Foe: 'dot', Elite: 'diamond', Gatekeeper: 'lock', Warlord: 'crown', Revenant: 'grave' };
const STANCE_ICON = { high: 'levelup', mid: 'diamond', low: 'chev' };

export class Menu {
  constructor(G) {
    this.G = G;
    this.el = document.getElementById('menu');
    this.stack = [];
    this.focus = 0;
    this.rep = { dir: 0, t: 0, h: 0, ht: 0 };
    this.el.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      // On the map, a click anywhere else picks the landmark under the pointer.
      if (!b && this.top?.screen === 'map' && !e.target.closest('.mx-panel,.mx-top,.mx-foot')) { this.G.overworld.pick(e.clientX, e.clientY); return; }
      if (!b || b.disabled) return;
      this.G.audio.init();
      this.G.audio.sfx('uiOk');
      this.run(b.dataset.act, b, +(e.target.closest('[data-dir]')?.dataset.dir || 1));
    });
    // A list that scrolls fades at the edge where more waits.
    this.el.addEventListener('scroll', e => this.edges(e.target), true);
    this.el.addEventListener('mousemove', e => {
      const i = this.items().indexOf(e.target.closest('.btn'));
      if (i >= 0 && i !== this.focus) { this.focus = i; this.paint(); }
    });
  }

  get open() { return this.stack.length > 0; }
  get top() { return this.stack[this.stack.length - 1]; }
  atWell() { return this.stack.some(f => f.screen === 'shrine'); }

  items() { return [...this.el.querySelectorAll('.btn:not([disabled])')]; }
  cur() { return this.items()[this.focus]; }
  // Light the chosen row, slide the crescent to it, and say what it is on the help line.
  paint(scroll = false) {
    const list = this.items(), el = list[this.focus];
    if (this.top) this.top.focus = this.focus;
    list.forEach((b, i) => b.classList.toggle('focus', i === this.focus));
    if (scroll && el) el.scrollIntoView?.({ block: 'nearest' });
    for (const c of this.el.querySelectorAll('.mx-cursor')) {
      const on = el && c.parentElement.contains(el) && el.classList.contains('mx-row');
      c.style.opacity = on ? 1 : 0;
      if (on) c.style.transform = `translateY(${el.offsetTop + el.offsetHeight / 2 - 9}px)`;
    }
    const help = this.el.querySelector('.mx-help');
    if (help) help.textContent = el?.dataset.desc || this.help || '';
    for (const l of this.el.querySelectorAll('.mx-list,.mx-scroll')) this.edges(l);
    this.onFocus?.(el);
  }
  edges(l) {
    if (!l.classList || !l.matches('.mx-list,.mx-scroll')) return;
    l.classList.toggle('less', l.scrollTop > 2);
    l.classList.toggle('more', l.scrollTop + l.clientHeight < l.scrollHeight - 2);
  }

  show(screen, data) { this.stack = [{ screen, data }]; this.G.hud?.clearOverlays(); this.render(); }
  push(screen, data) { this.stack.push({ screen, data }); this.render(); }
  pop() { this.stack.pop(); if (this.stack.length) this.render(); else this.close(); }
  close() { this.stack = []; this.el.className = ''; this.el.innerHTML = ''; this.onFocus = null; this.lastTop = null; this.G.overworld?.setActive(false); this.G.onMenuClosed?.(); }

  // ---- tabs
  // The tabs open here: the hub at the bottom of the stack, and the tab shown above it.
  spine() {
    const root = this.stack[0]?.screen, d = this.G.save.data;
    const tabs = root === 'pause' ? PAUSE_TABS : root === 'shrine' ? WELL_TABS.filter(t => t !== 'charms' || d.charms.length) : root === 'title' ? TITLE_TABS : null;
    if (!tabs || this.stack.length > 2 || !tabs.includes(this.top.screen)) return null;
    return tabs;
  }
  tabData(id) {
    const G = this.G, p = G.player, well = this.atWell();
    return { gear: { cat: 'w:' + p.weapon, forge: well }, arsenal: { forge: well }, skills: { w: p.weapon }, moves: { w: p.weapon }, market: { tab: 'gear' },
      bestiary: { act: 0 }, settings: { page: 0 }, controls: { page: G.input.usingPad ? 1 : 0 }, levelup: this.stack[0]?.data }[id] || {};
  }
  // Open a tab: over the hub, in place of the tab shown, or back to the hub itself.
  goTab(id) {
    const root = this.stack[0]?.screen;
    if (id === root) { this.stack.length = 1; this.stack[0].focus = this.stack[0].focus ?? 0; this.render(); return; }
    const f = { screen: id, data: this.tabData(id) };
    if (this.stack.length >= 2 && (this.spine() || []).includes(this.top.screen)) this.stack[this.stack.length - 1] = f; else this.stack.push(f);
    this.render();
  }
  turnTab(dir) {
    const tabs = this.spine();
    if (!tabs) return false;
    const i = tabs.indexOf(this.top.screen), at = this.stack.length === 1 ? 0 : i;
    this.goTab(tabs[(at + dir + tabs.length) % tabs.length]);
    return true;
  }
  // A screen's own pages: the tab strip inside it, turned one way or the other.
  turnPage(dir) {
    const on = this.el.querySelector('.mx-sub .st button.on');
    if (!on) return false;
    this.run(on.dataset.act, null, dir);
    return true;
  }

  // ---- keyboard, gamepad and stick
  nav(inp, dt = 1 / 60) {
    if (!this.open) return;
    const G = this.G, st = inp.padStick || { lx: 0, ly: 0 };
    const now = (this.clock = (this.clock || 0) + dt * 1000);   // held keys repeat on the menu's own clock
    // The map: directions travel between landmarks, confirm sets out, back returns (unless the map is all there is).
    if (this.top.screen === 'map') {
      const O = G.overworld;
      if (!O.entering) for (const d of ['left', 'right', 'up', 'down']) if (inp.hit(d)) O.step(d);
      if (inp.hit('confirm')) this.el.querySelector('.owpanel [data-act=setout]:not([disabled])')?.click();
      if (inp.hit('mAlt') && !O.entering) this.el.querySelector('.owpanel [data-act=sides]:not([disabled])')?.click();
      if (inp.hit('mAlt2') && !O.entering) this.el.querySelector('.owpanel [data-act=underbriar]')?.click();
      if (inp.hit('back') && ['shrine', 'title'].includes(this.top.data?.from) && !O.entering) { G.audio.sfx('ui'); this.pop(); }
      return;
    }
    // Tabs first (Q / E, LB / RB), then the screen's own pages (Z / C, LT / RT).
    for (const [a, dir] of [['mPrev', -1], ['mNext', 1]]) if (inp.hit(a)) { if (this.turnTab(dir) || this.turnPage(dir)) G.audio.sfx('ui'); return; }
    for (const [a, dir] of [['mSubPrev', -1], ['mSubNext', 1]]) if (inp.hit(a)) { if (this.turnPage(dir)) G.audio.sfx('ui'); return; }
    // The chosen item's other actions (F / R, Y / X), from the key bar.
    for (const a of ['mAlt', 'mAlt2', 'mAlt3', 'mAlt4']) {
      if (!inp.hit(a)) continue;
      const k = this.el.querySelector(`.nkeys [data-key~=${a}][data-act]:not([disabled])`);
      if (k) { G.audio.sfx('uiOk'); this.run(k.dataset.act, k, 1); return; }
    }
    const list = this.items();
    // Up and down, held to keep going (keys, d-pad or stick).
    const vy = inp.down('up') || st.ly < -.55 ? -1 : inp.down('down') || st.ly > .55 ? 1 : 0;
    let step = 0;
    if (vy !== this.rep.dir) { this.rep.dir = vy; this.rep.t = now + 360; step = vy; }
    else if (vy && now >= this.rep.t) { this.rep.t = now + 65; step = vy; }
    if (step) {
      if (list.length <= 1) {   // a page of reading: scroll it
        const panel = [...this.el.querySelectorAll('.mx-scroll,.mx-detail,.parch,.mx-list')].find(e => e.scrollHeight > e.clientHeight + 2);
        panel?.scrollBy({ top: step * 90, behavior: 'smooth' });
      } else {
        const grid = list[this.focus]?.classList.contains('skill');
        this.focus = grid ? this.gridStep(list, step, 0) : (this.focus + step + list.length) % list.length;
        this.paint(true); G.audio.sfx('ui');
      }
    }
    const cur = list[this.focus];
    // Left and right: change an option, move about a grid of skills, or turn the screen's pages.
    const vx = inp.down('left') || st.lx < -.6 ? -1 : inp.down('right') || st.lx > .6 ? 1 : 0;
    let sx = 0;
    if (vx !== this.rep.h) { this.rep.h = vx; this.rep.ht = now + 380; sx = vx; }
    else if (vx && now >= this.rep.ht && ['opt', 'lookOpt'].includes(cur?.dataset.act)) { this.rep.ht = now + 110; sx = vx; }
    if (sx) {
      if (['opt', 'lookOpt'].includes(cur?.dataset.act)) { G.audio.sfx('ui'); this.run(cur.dataset.act, cur, sx); return; }
      if (cur?.classList.contains('skill')) { this.focus = this.gridStep(list, 0, sx); this.paint(true); G.audio.sfx('ui'); return; }
      if (this.turnPage(sx)) { G.audio.sfx('ui'); return; }
    }
    if (inp.hit('confirm') && cur) cur.click();
    const fixed = ['title', 'ending', 'cleared', 'sidecleared'].includes(this.top?.screen);
    if (inp.hit('back') && !fixed) {
      G.audio.sfx('ui');
      if (this.top.screen === 'shrine') this.run('leave'); else if (this.top.screen === 'pause') this.close(); else this.pop();
    }
  }
  // In a grid of buttons (the skill tree), the nearest one up, down, left or right.
  gridStep(list, dy, dx) {
    const a = list[this.focus]?.getBoundingClientRect();
    if (!a) return this.focus;
    let best = this.focus, bd = Infinity;
    list.forEach((b, i) => {
      if (i === this.focus) return;
      const r = b.getBoundingClientRect(), ddx = (r.left + r.width / 2) - (a.left + a.width / 2), ddy = (r.top + r.height / 2) - (a.top + a.height / 2);
      if ((dy && Math.sign(ddy) !== dy) || (dx && Math.sign(ddx) !== dx) || (dy && Math.abs(ddy) < 4) || (dx && Math.abs(ddx) < 4)) return;
      const dd = dy ? Math.abs(ddy) + Math.abs(ddx) * 2 : Math.abs(ddx) + Math.abs(ddy) * 2;
      if (dd < bd) { bd = dd; best = i; }
    });
    if (best === this.focus && dy) return (this.focus + dy + list.length) % list.length;
    return best;
  }

  run(act, b, dir = 1) {
    const G = this.G, d = G.save.data;
    // Acts from the key bar work on the chosen row.
    const uidOf = () => +(b?.dataset.uid || this.cur()?.dataset.uid || 0);
    const page = (key, n) => { this.top.data[key] = b?.dataset.to != null ? +b.dataset.to : ((this.top.data[key] || 0) + dir + n) % n; this.top.focus = 0; this.top.scrolls = null; this.fresh = true; this.render(); };
    switch (act) {
      case 'spine': this.goTab(b.dataset.to); break;
      case 'new': if (G.save.exists) this.push('confirm'); else G.newGame(); break;
      case 'newYes': G.newGame(); break;
      case 'continue': G.continueGame(); break;
      case 'library': location.href = 'library.html'; break;
      case 'controls': case 'settings': case 'gear': case 'arsenal': case 'skills': case 'moves': case 'wardrobe': case 'journal':
      case 'bestiary': case 'deeds': case 'levelup': case 'patrons': case 'kinship': case 'market': case 'charms': {
        const tabs = { pause: PAUSE_TABS, shrine: WELL_TABS, title: TITLE_TABS }[this.stack[0]?.screen];
        if (tabs?.includes(act) && this.stack.length <= 2) this.goTab(act); else this.push(act, this.tabData(act));
        break;
      }
      case 'back': this.pop(); break;
      case 'resume': this.close(); break;
      case 'quit': G.quitToTitle(); break;
      case 'level': G.levelUp(b.dataset.stat); this.render(); break;
      case 'travelTo': this.push('travel', this.stack[0].data); break;
      case 'travel': G.travel(b.dataset.shrine); break;
      case 'leave': G.leaveShrine(); break;
      case 'ngplus': G.newGamePlus(); break;
      case 'title': G.quitToTitle(); break;
      case 'missions': G.openMap('cleared', G.level.id); break;
      case 'journey': G.openMap('shrine'); break;
      case 'map': G.openMap('title'); break;
      case 'mission': G.startMission(b.dataset.id); break;
      case 'node': G.overworld.select(b.dataset.id); break;
      case 'setout': G.overworld.enter(b.dataset.id); break;
      case 'sides': this.push('sides', { m: b.dataset.id, from: this.top.data?.from }); break;
      case 'side': this.pop(); G.overworld.enter(b.dataset.m, b.dataset.id); break;
      case 'abandon': G.abandonSide(); break;
      case 'underbriar': this.push('underbriar', { from: this.top.data?.from }); break;
      case 'descend': G.menu.close(); G.enterUnderbriar(+b.dataset.depth); break;
      case 'leaveAbyss': G.leaveUnderbriar(); break;
      case 'thornyard': G.menu.close(); G.enterYard(); break;
      case 'trial': G.startTrial(b.dataset.id); break;
      case 'trialLocked': G.audio.sfx('ui'); G.hud.toast(trialLock(TRIALS.find(t => t.id === b.dataset.id), G.save.data) || '', 'warn'); break;
      case 'abandonTrial': G.abandonTrial(); break;
      case 'leaveYard': G.leaveYard(); break;
      case 'pledge': {
        const id = b?.dataset.id || this.cur()?.dataset.id;
        if (b?.dataset.locked || !G.setPatron(id)) { G.audio.sfx('ui'); G.hud.toast(`Fell the warlord of ${G.LEVELS[PATRONS[id]?.from]?.name || 'its mission'} to free this spirit`); }
        else G.hud.toast(`${PATRONS[id].name} is pledged to you`, 'anima');
        this.render(); break;
      }
      case 'bAct': page('act', 3); break;
      case 'beast': case 'none': break;
      case 'graveFight': this.close(); G.challengeGrave(+b.dataset.i); break;
      case 'callKin': if (G.callKindred(+b.dataset.i)) this.goTab('shrine'); else G.audio.sfx('ui'); break;
      case 'sendKin': G.sendKindred(); this.render(); break;
      case 'mTab': { const n = MARKET_TABS.length, i = MARKET_TABS.findIndex(t => t.id === this.top.data.tab), to = b?.dataset.to != null ? +b.dataset.to : (i + dir + n) % n; this.top.data.tab = MARKET_TABS[to].id; this.top.focus = 0; this.top.scrolls = null; this.fresh = true; this.render(); break; }
      case 'buy': { const key = b?.dataset.key || this.cur()?.dataset.key; if (!G.buy(this.top.data.tab, key)) G.audio.sfx('ui'); this.render(); break; }
      case 'lookOpt': this.setLookOpt(b.dataset.opt, dir); break;
      case 'lookReset': for (const P of LOOK_PARTS) G.setLook(P.k, null); this.render(); break;
      case 'wield': { const w = b?.dataset.w || this.cur()?.dataset.w, r = b?.dataset.r || this.cur()?.dataset.r; if (w) G.wieldWeapon(w); else if (r) G.readyRanged(r); this.render(); break; }
      case 'ready': G.readyRanged(b.dataset.r); this.render(); break;
      case 'forge': { const w = b?.dataset.w || this.cur()?.dataset.w; if (!w || !this.atWell() || !G.forgeWeapon(w)) G.audio.sfx('ui'); this.render(); break; }
      case 'movesW': { const a = G.player.arms, i = Math.max(0, a.indexOf(this.top.data.w)), to = b?.dataset.to != null ? +b.dataset.to : (i + dir + a.length) % a.length; this.top.data = { w: a[to] }; this.top.focus = 0; this.fresh = true; this.render(); break; }
      case 'skillsW': { const a = [...G.player.arms, ...(G.player.rangedOwned || [])], i = Math.max(0, a.indexOf(this.top.data.w)), to = b?.dataset.to != null ? +b.dataset.to : (i + dir + a.length) % a.length; this.top.data = { w: a[to] }; this.top.focus = 0; this.fresh = true; this.render(); break; }
      case 'learn': if (!G.learnSkill(b.dataset.w, b.dataset.id)) G.audio.sfx('ui'); this.render(); break;
      case 'gCat': { const cats = this.gearCats(), i = Math.max(0, cats.findIndex(c => c.id === this.top.data.cat)), to = b?.dataset.to != null ? +b.dataset.to : (i + dir + cats.length) % cats.length; this.top.data.cat = cats[to].id; this.top.focus = 0; this.top.scrolls = null; this.fresh = true; this.render(); break; }
      case 'equipGear': { const u = uidOf(); if (u) G.equipGear(u); this.render(); break; }
      case 'dismantle': { const u = uidOf(), got = u ? G.dismantleGear([u]) : 0; if (got) G.hud.toast(`Dismantled for ${got} Glimmer${G.lastSteel ? ` and ${G.lastSteel} Moonsteel` : ''}`, 'item'); else G.audio.sfx('ui'); this.render(); break; }
      case 'lockGear': { const u = uidOf(); if (!u || !G.lockGear(u)) G.audio.sfx('ui'); this.render(); break; }
      case 'gearSort': { const i = GEAR_SORT.findIndex(o => o[0] === d.gearSort); d.gearSort = GEAR_SORT[(i + 1) % GEAR_SORT.length][0]; G.save.write(); this.top.focus = 0; this.render(); break; }
      case 'temper': if (!G.temper(this.top.data.uid)) G.audio.sfx('ui'); this.render(); break;
      case 'saveKit': { const i = +(this.cur()?.dataset.kit ?? -1); if (i >= 0 && G.saveKit(i)) G.hud.toast(`Saved as Loadout ${i + 1}`, 'item'); else G.audio.sfx('ui'); this.render(); break; }
      case 'wearKit': { const i = +(b?.dataset.kit ?? this.cur()?.dataset.kit ?? -1); if (i >= 0 && G.wearKit(i)) G.hud.toast(`Loadout ${i + 1} worn`, 'item'); else if (i >= 0 && G.saveKit(i)) G.hud.toast(`Saved as Loadout ${i + 1}`, 'item'); this.render(); break; }
      case 'smith': { const u = uidOf(); if (u && this.atWell()) this.push('smith', { uid: u }); else G.audio.sfx('ui'); break; }
      case 'setCore': { const c = b?.dataset.core ?? this.cur()?.dataset.core; if (c) G.setCore(+(b?.dataset.slot || 0), c); this.render(); break; }
      case 'coreOut': { const at = (d.coreSlots || []).indexOf(this.cur()?.dataset.core); if (at >= 0) G.setCore(at, null); else G.audio.sfx('ui'); this.render(); break; }
      case 'dismantleBelow': { const got = G.dismantleBelow(+b.dataset.rar); G.hud.toast(got ? `Dismantled for ${got.toLocaleString()} Glimmer${G.lastSteel ? ` and ${G.lastSteel} Moonsteel` : ''}` : 'Nothing to dismantle', 'item'); this.render(); break; }
      case 'reforge': if (!G.reforge(this.top.data.uid, +b.dataset.i)) G.audio.sfx('ui'); this.render(); break;
      case 'soulmatch': if (!G.soulMatch(this.top.data.uid, +b.dataset.from)) G.audio.sfx('ui'); this.render(); break;
      case 'letter': this.push('letter', { m: b.dataset.m, id: b.dataset.id }); G.audio.sfx('page'); break;
      case 'charm': if (!G.equipCharm(b.dataset.id)) G.hud.toast('All three charm slots are worn'); this.render(); break;
      case 'opt': this.setOpt(b.dataset.opt, dir); break;
      case 'rebind': {   // wait for the next key; one already in use trades places with the old
        const a = b.dataset.a; this.capturing = a; this.render();
        G.input.captureNext(code => {
          this.capturing = null;
          if (code !== 'Escape') {
            const map = { ...(G.settings.keys || {}) }, cur = x => map[x] || defaultKey(x);
            const other = REBIND.find(x => x !== a && cur(x) === code);
            if (other) map[other] = cur(a);
            map[a] = code;
            for (const x of Object.keys(map)) if (map[x] === defaultKey(x)) delete map[x];
            G.setSetting('keys', map);
            G.audio.sfx('uiOk');
            if (other) G.hud.toast(`${keyName(code)} was on another action: they traded keys`, 'item');
          }
          if (this.top?.screen === 'controls') this.render();
        });
        break;
      }
      case 'resetKeys': G.setSetting('keys', {}); this.render(); break;
      case 'spage': page('page', SETTINGS.length); break;
      case 'cpage': page('page', CPAGES.length); break;
      case 'revert': G.resetSettings(); G.hud.toast('Settings returned to their defaults'); this.render(); break;
    }
  }

  // A setting stepped one way or the other.
  setOpt(k, dir) {
    const R = SETTINGS.flatMap(P => P.rows).find(r => r.k === k), G = this.G, v = G.settings[k];
    if (!R) return;
    let nv;
    if (R.vals) { const i = Math.max(0, R.vals.findIndex(x => x == v)); nv = R.vals[(i + dir + R.vals.length) % R.vals.length]; }
    else nv = +Math.min(R.max, Math.max(R.min, (+v || 0) + dir * R.step)).toFixed(2);
    G.setSetting(k, nv);
    this.render();
  }
  // The Wardrobe: the next or last choice for one part of the look.
  setLookOpt(k, dir) {
    const G = this.G, d = G.save.data, vals = k === 'set' ? [null, ...(d.looks || ['errant']).filter(x => SETS[x])] : [null, ...DYE_ORDER.filter(x => (d.dyes || []).includes(x))];
    const i = Math.max(0, vals.indexOf(d.look?.[k] ?? null));
    G.setLook(k, vals[(i + dir + vals.length) % vals.length]);
    this.render();
  }
  // Gear's pages: each weapon carried or found, each armour slot, Soul Cores.
  gearCats() {
    const d = this.G.save.data, p = this.G.player;
    return [...d.arms.map(w => ({ id: 'w:' + w, name: p.weaponName(w), w, icon: 'sword' })), ...SLOTS.map(s => ({ id: s, name: SLOT_NAME[s], slot: s, icon: SLOT_ICON[s] })), { id: 'cores', name: 'Soul Cores', icon: 'core' }, { id: 'kits', name: 'Loadouts', icon: 'equipment' }];
  }

  // ---- pieces the screens share
  chips(...ks) {
    const sv = this.G.save, d = sv.data;
    const C = { lvl: ['moon', `Level ${sv.level}`, 'lvl'], glim: ['glimmer', sv.glimmer.toLocaleString(), 'glim'], petal: ['petal', (d.petals || 0).toLocaleString(), 'petal'], cup: ['cup', String(d.cups ?? 0), 'cup'], steel: ['anvil', `${d.moonsteel || 0} Moonsteel`, 'steel'] };
    return ks.map(k => C[k]);
  }
  // A piece in full, pack or not (the Hidden Market's too), set against what is worn now.
  itemDetail(it) {
    const G = this.G, g = G.save.data.gear, p = G.player, wn = id => p.weaponName(id), st = p.gear || { def: 0, sets: {} };
    const worn = new Set([...Object.values(g.equip.weapons), ...Object.values(g.equip.armor)]);
    const isW = it.kind === 'weapon', eq = g.items.find(x => x.uid === (isW ? g.equip.weapons[it.type] : g.equip.armor[it.slot]));
    const val = isW ? weaponMul(it) : armorDef(it), was = isW ? weaponMul(eq) : armorDef(eq), diff = val - was;
    const fmt = v => (isW ? '×' + v.toFixed(2) : String(v));
    const cmp = eq === it ? '<span class="same">worn</span>' : Math.abs(diff) < 1e-6 ? '<span class="same">=</span>'
      : `<span class="${diff > 0 ? 'up' : 'down'}">${diff > 0 ? '▲' : '▼'} ${isW ? Math.abs(diff).toFixed(2) : Math.abs(diff)}</span>`;
    const S = it.set && SETS[it.set], n = S ? (st.sets?.[it.set] || 0) : 0;
    const sc = isW && scalingOf(it.type), W = SWORN[it.sworn];
    return `<div class="mx-kick"><span>${esc(isW ? wn(it.type) : SLOT_NAME[it.slot])}</span><span>Level ${it.lvl}${it.tmp ? ` · tempered +${it.tmp}` : ''}${it.lock ? ' · locked' : ''}</span></div>
      <h3 style="color:${col(it.rar)}">${esc(itemName(it, wn))}</h3>
      <div class="sub">${RARITY[it.rar].name}${S ? ` · ${esc(S.name)} set` : ''}${it.uid && worn.has(it.uid) ? ' · worn' : ''}</div>
      <div class="mx-cmp"><span>${isW ? 'Damage' : 'Defence'}</span><span>${eq && eq !== it ? `<span class="was">${fmt(was)}</span> → ` : ''}<span class="now">${fmt(val)}</span> ${cmp}</span></div>
      ${sc ? `<div class="mx-fx plain scal"><span>Scaling</span><span class="v">Strength <b class="gr g${sc[0]}">${sc[0]}</b> · Spirit <b class="gr g${sc[1]}">${sc[1]}</b></span></div>` : ''}
      ${W ? `${sec('Moonsworn')}<div class="mx-fx sworn"><span><b>${esc(W.name)}</b> · ${esc(W.t)}</span></div>` : ''}
      ${sec('Special effects')}
      ${it.fx.length ? it.fx.map(([id, v]) => `<div class="mx-fx"><span>${esc(fxText(id, fxVal(it, v)))}</span></div>`).join('') : '<div class="mx-fx off"><span>None: a Common piece carries no effects.</span></div>'}
      ${S ? `${sec(`${S.name} set · ${n} of 4 worn`)}<div class="mx-fx set ${n >= 2 ? '' : 'off'}"><span>Two: ${esc(S.two)}</span></div><div class="mx-fx set ${n >= 4 ? '' : 'off'}"><span>Four: ${esc(S.four)}</span></div>` : ''}
      ${eq && eq !== it ? `${sec(`Worn now: ${itemName(eq, wn)}`)}${SWORN[eq.sworn] ? `<div class="mx-fx off"><span>Moonsworn ${esc(SWORN[eq.sworn].name)}</span></div>` : ''}${eq.fx.length ? eq.fx.map(([id, v]) => `<div class="mx-fx off"><span>${esc(fxText(id, fxVal(eq, v)))}</span></div>`).join('') : '<div class="mx-fx off"><span>No effects</span></div>'}` : ''}`;
  }
  // The chosen gear row in full.
  gearDetail(el, C) {
    const G = this.G, d = G.save.data, g = d.gear, p = G.player;
    if (C.id === 'cores') {
      const slots = d.coreSlots || [null, null];
      const set = slots.map((id, i) => `<div class="mx-fx ${id ? 'set' : 'off'}"><span>Slot ${i + 1} · ${glyph(G, i ? 'core1' : 'core0')}</span><span class="v">${id ? esc(CORES[id].name) : 'empty'}</span></div>`).join('');
      const id = el?.dataset.core, K = CORES[id];
      if (!K) return `${sec('Set')}${set}<div class="mx-note">Each core set lends a passive and a skill; skills cost Faelight.</div>`;
      const gr = Math.min(CORE_MAX, d.cores[id]);
      return `<div class="mx-kick"><span>Soul Core</span><span>${gr > 1 ? `Fused +${gr - 1}` : ''}</span></div><h3 style="color:#c89aff">${esc(K.name)}</h3>
        <div class="sub">${esc(K.skillName)} · ${K.cost} Faelight</div>
        <div class="mx-note">${esc(K.desc)}.</div>
        ${sec('Passive')}<div class="mx-fx"><span>${esc(fxText(K.fx[0], Math.round(K.fx[1] * (1 + (gr - 1) * .15))))}</span></div>
        ${sec('Set')}${set}
        <div class="mx-note">Found again, a core fuses into the one you hold and grows stronger (up to +${CORE_MAX - 1}).</div>`;
    }
    if (C.id === 'kits') {
      const i = +(el?.dataset.kit ?? -1), K = d.kits?.[i], by = uid => g.items.find(it => it.uid === uid), wn = id => p.weaponName(id);
      if (!K) return `<div class="mx-kick"><span>Loadout</span></div><h3>${i >= 0 ? `Loadout ${i + 1}` : 'Loadouts'}</h3><div class="mx-note">A loadout keeps the two weapons you carry, the gear on each, your armour and your charms. Save what you wear now into one with ${G.hud.key('mAlt')}, and put it all back on at once later.</div>`;
      const line = (label, it) => `<div class="mx-fx plain"><span>${label}</span><span class="v" style="color:${it ? col(it.rar) : 'var(--mx-faint)'}">${it ? esc(itemName(it, wn)) : 'gone'}</span></div>`;
      return `<div class="mx-kick"><span>Loadout ${i + 1}</span><span>${K.arms.map(wn).join(' · ')}</span></div><h3>${esc(K.arms.map(wn).join(' and '))}</h3>
        ${sec('Weapons')}${K.arms.map(w => line(esc(wn(w)), by(K.weapons[w]))).join('')}
        ${sec('Armour')}${SLOTS.map(sl => line(SLOT_NAME[sl], by(K.armor[sl]))).join('')}
        ${sec('Charms')}${K.charms.length ? K.charms.map(c => `<div class="mx-fx plain"><span>${esc(CHARMS[c]?.name || c)}</span></div>`).join('') : '<div class="mx-fx off"><span>None</span></div>'}`;
    }
    const st = p.gear || { def: 0, sets: {} };
    const harness = C.slot ? `${sec('Harness')}${stats([['Defence', st.def], ['Blows land lighter by', `${Math.round(defReduce(st.def) * 100)}%`]])}` : '';
    const it = g.items.find(x => x.uid === +(el?.dataset.uid || 0));
    if (!it) return harness || '<div class="mx-note">Foes drop weapons of every kind you carry; better ones from elites and warlords.</div>';
    const steel = moonsteelOf(it);
    return `${this.itemDetail(it)}${harness}<div class="mx-note">${it.lock ? 'Locked: it won\'t be dismantled or consumed.' : `Dismantles for ${dismantleValue(it).toLocaleString()} Glimmer${steel ? ` and ${steel} Moonsteel` : ''}.`}${this.atWell() ? '' : ' Reforge, temper or soul-match it at a Moonwell.'}</div>`;
  }
  // Fill the detail pane, fading the new in.
  fill(html) {
    const box = this.el.querySelector('.mx-detail.live');
    if (!box) return;
    box.innerHTML = html;
    box.classList.remove('fresh'); void box.offsetWidth; box.classList.add('fresh');
  }

  // ---- drawing a screen
  render() {
    const { screen } = this.top, G = this.G;
    // Keep each screen's scroll, so a change made far down a list doesn't jump back to its top.
    const scrollers = () => [...this.el.querySelectorAll('.mx-list,.mx-scroll,.mx-detail')];
    if (this.lastTop) this.lastTop.scrolls = scrollers().map(e => e.scrollTop);
    const entering = this.lastTop !== this.top || this.fresh;
    this.fresh = false;
    this.onFocus = null; this.help = '';
    this.top.data ||= {};
    const S = this.screens[screen]?.call(this, this.top.data) || { ctx: 'veil', html: '' };
    this.el.className = `on ${S.ctx || 'veil'} ${screen}${entering ? ' enter' : ''}`;
    G.overworld?.setActive(screen === 'map' || screen === 'sides' || screen === 'underbriar');
    this.el.innerHTML = S.html;
    this.onFocus = S.onFocus || null; this.help = S.help || '';
    this.el.querySelectorAll('.mx-row,.mx-opt').forEach((r, i) => r.style.setProperty('--n', Math.min(i, 16)));
    if (screen === 'map') G.overworld.bindLabels(this.el);
    this.lastTop = this.top;
    if (this.top.scrolls) scrollers().forEach((e, i) => { e.scrollTop = this.top.scrolls[i] || 0; });
    this.focus = Math.max(0, Math.min(this.top.focus ?? 0, this.items().length - 1));
    this.paint(true);
    clearTimeout(this.enterT);
    if (entering) this.enterT = setTimeout(() => this.el.classList.remove('enter'), 700);
  }
  // shell() with this menu's tabs.
  frame(o) {
    const tabs = this.spine(), G = this.G, d = G.save.data;
    const badge = id => {
      if (id !== 'skills') return '';
      const n = [...(G.player.arms || []), ...(G.player.rangedOwned || [])].reduce((a, w) => { const m = d.mastery?.[w] || { xp: 0, learned: [] }; return a + Math.max(0, pointsAt(m.xp) - treeCost(m.learned)); }, 0);
      return n || '';
    };
    const root = this.stack[0]?.screen;
    return shell(G, { ...o, spine: tabs?.map(id => ({ id, ...TAB[id], name: id === 'shrine' ? 'Moonwell' : TAB[id].name, badge: badge(id) })), at: this.stack.length === 1 ? root : this.top.screen,
      moon: o.moon ?? (G.settings.realMoon !== false && ['pause', 'shrine', 'title'].includes(this.top.screen) ? phaseOf().frac : null) });
  }
}

// ---------------------------------------------------------------- the screens
// Each returns { ctx: the backdrop (world, veil, map, plain), html, onFocus, help }.
Menu.prototype.screens = {
  title() {
    const G = this.G, has = G.save.exists, off = !G.ready, ph = G.settings.realMoon !== false && phaseOf();
    const rows = [
      has && row({ act: 'continue', icon: 'resume', title: 'Continue', right: '', desc: G.save.summary(G.LEVELS), off }),
      has && G.save.data.unlocked.length > 1 && row({ act: 'map', icon: 'crossroads', title: 'The Crossroads', desc: 'Choose where the path leads.', off }),
      row({ act: 'new', icon: 'sparkle', title: 'New Game', desc: has ? 'Begin again, from the Grubhold\'s gate.' : 'A fae knight wakes beneath a fading moon.', off }),
      row({ act: 'controls', icon: 'controls', title: 'Controls', desc: 'Keyboard and mouse, the gamepad, and the ways of the fight.' }),
      row({ act: 'settings', icon: 'settings', title: 'Settings', desc: 'Camera, reading, sound and display.' }),
      row({ act: 'library', icon: 'library', title: 'Asset Library', desc: 'Every model and animation in the game, to look at.' }),
    ].filter(Boolean).join('');
    const body = `<div class="mx-logo"><h1>PixieLords</h1><p>A fae knight, a waning moon, and every warlord between.</p>
        ${ph ? `<div class="tonight">${moonDisc(ph.frac)}<span>Tonight, ${esc(ph.name)}: ${esc(ph.desc)}</span></div>` : ''}</div>
      <div class="mx-left">${off ? `<div class="mx-loading">${meter(G.loadProgress || 0)}<small>Summoning the warren… ${Math.round((G.loadProgress || 0) * 100)}%</small></div>` : ''}${list(rows, 'hubl')}</div>`;
    return { ctx: 'world', html: this.frame({ title: 'PixieLords', layout: 'hub', cls: 'titlescreen', body, hints: [['confirm', 'Select']] }),
      help: G.touchOnly ? 'PixieLords needs a keyboard and mouse, or a gamepad.' : 'Made for keyboard and mouse · a gamepad works too · best with headphones' };
  },
  confirm() {
    const body = panel(`<div class="mx-detail"><h3>Begin anew?</h3><div class="mx-lore">Your current journey will be forgotten: its level, gear, Moonwells and all.</div></div>
      ${list(row({ act: 'newYes', icon: 'sparkle', title: 'Begin a new journey' }) + row({ act: 'back', icon: 'quit', title: 'Keep my journey' }))}`, '');
    return { ctx: 'veil', html: this.frame({ title: 'New Game', crumb: 'Title', layout: 'dialog', body, hints: [['confirm', 'Select'], ['back', 'Back', 'back']] }) };
  },
  // The pause menu's first tab: the knight as it stands, and the ways out.
  pause() {
    const G = this.G, sv = G.save, d = sv.data, L = G.level, side = G.sideDef(), p = G.player, T = G.tonight;
    const rows = [
      row({ act: 'resume', icon: 'resume', title: 'Return', desc: 'Back to the fight.' }),
      ...['gear', 'arsenal', 'skills', 'moves', 'wardrobe', 'journal', 'bestiary', 'deeds', 'settings', 'controls'].map(id => row({ act: id, icon: TAB[id].icon, title: TAB[id].name, desc: {
        gear: 'Weapons, armour and Soul Cores found.', arsenal: 'Choose the two weapons you carry, and the ranged one.', skills: 'Spend what each weapon has taught you.',
        moves: 'Each weapon\'s stances, combos and finishers.', wardrobe: 'How your harness looks, and its dyes.', journal: `${d.letters.length} letters read · ${d.pixies.length} Lost Pixies freed.`,
        bestiary: 'Every foe met, its arts and its ways.', deeds: 'Long goals kept across every mission, Way and depth.', settings: 'Camera, reading, sound and display.', controls: 'Keys, the gamepad, and the ways of the fight.' }[id] })),
      side && row({ act: 'abandon', icon: 'sides', title: 'Abandon side mission', desc: `${side.name}: a side run keeps its own Moonwells. Abandon it to return to the mission itself.` }),
      L.depth && row({ act: 'leaveAbyss', icon: 'rise', title: 'Leave the Underbriar', desc: 'Climb back up to the Fae Crossroads.' }),
      G.trials.run && row({ act: 'abandonTrial', icon: 'quit', title: 'Abandon the trial', desc: `${G.trials.run.T.name}: end it and stand before the Trial Stone again.` }),
      L.yard && row({ act: 'leaveYard', icon: 'rise', title: 'Leave the Thornyard', desc: 'Back to the Fae Crossroads.' }),
      row({ act: 'quit', icon: 'quit', title: 'Quit to title', desc: 'Progress is saved each time you rest at a Moonwell or vanquish a warlord.' }),
    ].filter(Boolean).join('');
    const K = G.kindred?.alive ? G.kindred : null;
    const card = panel(stats([
      ['Level', sv.level, 'rose'], ['Health · Stamina', `${Math.round(p.hp)} / ${p.maxHp} · ${p.maxKi}`], ['Damage', `×${p.dmgMul.toFixed(2)}`], ['Defence', p.gear?.def ?? 0],
      ['Moondew', `${p.elixirs ?? sv.elixirMax} / ${sv.elixirMax}`, 'cyan'], ['Patron Spirit', PATRONS[d.patron || 'lantern'].name], K && ['Kindred', K.name, 'cyan'],
      ['Way', wayName(d.ng)], T && ['Tonight', T.phase.name + (T.omen ? ' · ' + T.omen.name : '')], ['Time · Falls', `${Math.floor(sv.time / 60)} min · ${sv.deaths}`],
    ]), 'mx-card tall', ['The Knight', side ? side.kindName : L.depth ? `Depth ${L.depth}` : '']);
    return { ctx: 'world', html: this.frame({ title: 'Paused', crumb: side ? side.name : L.depth ? `The Underbriar · Depth ${L.depth}` : L.name, sigil: 'status', layout: 'hub',
      chips: this.chips('glim', 'petal', 'cup'), body: `<div class="mx-left">${list(rows, 'hubl dense')}</div>${card}`, hints: [['confirm', 'Select'], ['back', 'Return', 'resume']] }) };
  },
  shrine(data) {
    const G = this.G, sv = G.save, d = sv.data, p = G.player, cost = levelCost(sv.level);
    const other = Object.values(G.level.shrines).filter(s => s.id !== data.id && sv.m.kindled.includes(s.id));
    const deeds = G.deedsView(), earned = deeds.reduce((a, r) => a + r.tier, 0), K = G.kindred?.alive ? G.kindred : null;
    const rows = [
      row({ act: 'levelup', icon: 'levelup', title: 'Level up', right: sv.glimmer >= cost ? 'ready' : '', desc: sv.glimmer >= cost ? `Spend ${cost.toLocaleString()} Glimmer to grow stronger.` : `The next level needs ${cost.toLocaleString()} Glimmer.` }),
      row({ act: 'travelTo', icon: 'travel', title: 'Travel', desc: other.length ? `To another Moonwell kindled here: ${other.map(s => s.name).join(', ')}.` : 'No other Moonwell here is kindled yet.', off: !other.length }),
      row({ act: 'gear', icon: 'equipment', title: 'Equipment', desc: 'Weapons, armour and Soul Cores. Reforge and soul-match here.' }),
      row({ act: 'arsenal', icon: 'arsenal', title: 'Arsenal', desc: 'Choose two weapons, and forge them stronger.' }),
      row({ act: 'skills', icon: 'skills', title: 'Skills', desc: 'Spend what each weapon has taught you.' }),
      row({ act: 'patrons', icon: 'patron', title: 'Patronage', desc: `${PATRONS[d.patron || 'lantern'].name} is pledged to you · ${(d.patrons || ['lantern']).length} of ${PATRON_ORDER.length} freed.` }),
      row({ act: 'kinship', icon: 'kinship', title: 'Kinship', right: K ? 'with you' : '', desc: K ? `${K.name} walks with you.` : `${d.cups ?? 0} Moon Cups · call a kindred knight to fight beside you.` }),
      row({ act: 'market', icon: 'market', title: 'Hidden Market', desc: `${(d.petals || 0).toLocaleString()} Moonpetals · new wares every night.` }),
      row({ act: 'wardrobe', icon: 'wardrobe', title: 'Wardrobe', desc: 'How your harness looks, and its dyes.' }),
      d.charms.length && row({ act: 'charms', icon: 'charms', title: 'Charms', right: `${d.equipped.length} / ${CHARM_SLOTS}`, desc: 'Wear up to three.' }),
      row({ act: 'journal', icon: 'journal', title: 'Journal', desc: `${d.letters.length} letters · ${d.pixies.length} Lost Pixies freed.` }),
      row({ act: 'deeds', icon: 'deeds', title: 'Deeds', right: `${earned} / ${deeds.length * 3}`, desc: 'Long goals kept across every mission, Way and depth.' }),
      d.unlocked.length > 1 && row({ act: 'journey', icon: 'crossroads', title: 'Journey elsewhere', desc: 'Walk the Fae Crossroads to another mission.' }),
      row({ act: 'leave', icon: 'rise', title: 'Rise', desc: 'Resting mends you, refills your Moondew, and calls every fallen foe back.' }),
    ].filter(Boolean).join('');
    const card = panel(stats([['Level', sv.level, 'rose'], ['Glimmer', sv.glimmer.toLocaleString(), 'gold'], ['Next level', cost.toLocaleString()], ['Health · Stamina', `${p.maxHp} · ${p.maxKi}`], ['Moondew', sv.elixirMax, 'cyan']]), 'mx-card', ['Rested', G.level.name]);
    return { ctx: 'world', html: this.frame({ title: 'Moonwell', crumb: data.name, sigil: 'moon', layout: 'hub', chips: this.chips('glim', 'petal', 'cup'), body: `<div class="mx-left">${list(rows, 'hubl dense')}</div>${card}`, hints: [['confirm', 'Select'], ['back', 'Rise', 'leave']] }) };
  },
  levelup() {
    const G = this.G, sv = G.save, p = G.player, lvl = sv.level, cost = levelCost(lvl), afford = sv.glimmer >= cost, cur = derive(sv.stats, p.weapon), sc = scalingOf(p.weapon);
    const rows = STATS.map(st => {
      const dd = derive({ ...sv.stats, [st.k]: sv.stats[st.k] + 1 }, p.weapon), dmg = `+${((dd.dmgMul - cur.dmgMul) * 100).toFixed(1)}% damage (${sc[st.k === 'str' ? 0 : 1]})`;
      const gain = st.k === 'vit' ? `+${dd.maxHp - cur.maxHp} health` : st.k === 'end' ? `+${dd.maxKi - cur.maxKi} stamina` : st.k === 'str' ? dmg : `+${Math.round((dd.animaGain - cur.animaGain) * 100)}% Faelight, ${dmg}`;
      return row({ act: 'level', cls: 'lrow', icon: { vit: 'status', end: 'rise', str: 'sword', spi: 'patron' }[st.k], title: st.name, note: st.desc, right: `<span class="val">${sv.stats[st.k]} → ${sv.stats[st.k] + 1}</span><span class="gain">${gain}</span>`, extra: `data-stat="${st.k}"`, off: !afford, desc: `${st.name}: ${st.desc.toLowerCase()}. ${gain}.` });
    }).join('');
    const body = panel(`<div class="lvl-top"><div><small>Level</small><b>${lvl} <i>›</i> ${lvl + 1}</b></div><div><small>Glimmer</small><b style="color:var(--mx-gold)">${sv.glimmer.toLocaleString()}</b></div><div><small>Required</small><b class="${afford ? '' : 'short'}">${cost.toLocaleString()}</b></div></div>
      ${list(rows)}${stats([['Health · Stamina', `${p.maxHp} · ${p.maxKi}`], ['Damage', `×${p.dmgMul.toFixed(2)}`], ['Moondew', sv.elixirMax]])}`, 'sht', ['Kindle', afford ? 'each level raises one attribute by one' : `${(cost - sv.glimmer).toLocaleString()} more Glimmer needed`]);
    return { ctx: 'veil', html: this.frame({ title: 'Level up', crumb: this.stack[0]?.data?.name || 'Moonwell', layout: 'sheet', chips: this.chips('lvl', 'glim'), body, hints: [['confirm', 'Raise'], ['back', 'Back', 'back']] }) };
  },
  travel(data) {
    const G = this.G, sv = G.save, all = Object.values(G.level.shrines).filter(s => sv.m.kindled.includes(s.id));
    const rows = all.map(s => row({ act: 'travel', icon: 'moon', title: s.name, right: s.id === data.id ? 'you rest here' : '', extra: `data-shrine="${s.id}"`, off: s.id === data.id, desc: `Travel to ${s.name}.` })).join('');
    return { ctx: 'veil', html: this.frame({ title: 'Travel', crumb: G.level.name, layout: 'dialog', body: panel(list(rows), '', ['Moonwells kindled', '']), hints: [['confirm', 'Travel'], ['back', 'Back', 'back']] }) };
  },
  settings(data) {
    const G = this.G, at = data.page || 0, pg = SETTINGS[at], s = G.settings;
    const rows = pg.rows.map(R => {
      const v = s[R.k];
      if (R.vals) { const i = Math.max(0, R.vals.findIndex(x => x == v)); return option(R.k, R.label, R.names[i], i, R.vals.length, R.desc); }
      const n = Math.round((R.max - R.min) / R.step) + 1, i = Math.round(((+v || 0) - R.min) / R.step);
      return option(R.k, R.label, R.fmt(+v || 0), i, n, R.desc);
    }).join('');
    const body = panel(`${subtabs(G, SETTINGS.map(P => ({ name: P.name })), at, 'spage')}${list(rows)}`, 'sht');
    return { ctx: 'veil', html: this.frame({ title: 'Settings', crumb: pg.name, layout: 'sheet', body, hints: [[['mSubPrev', 'mSubNext'], 'Page', 'spage'], ['mAlt', 'Defaults', 'revert'], ['confirm', 'Change'], ['back', 'Back', 'back']] }) };
  },
  controls(data) {
    const G = this.G, at = data.page || 0, P = G.input.padPS ? PS_LABEL : PAD_LABEL;
    let inner;
    // Keyboard and mouse: every key the player may move is a row; choose one, then press its new key.
    if (at === 0) inner = list(REBIND_GROUPS.map(([grp, acts]) => divider(grp) + acts.map(([a, n]) => {
      const code = boundKey(a), moved = code !== defaultKey(a), wait = this.capturing === a;
      return row({ act: 'rebind', cls: wait ? 'capturing' : '', title: n, extra: `data-a="${a}"`, right: wait ? '<i class="mx-wait">press a key…</i>' : `${moved ? '<i class="tag">moved</i> ' : ''}<kbd class="k kb">${esc(keyName(code))}</kbd>`,
        desc: wait ? 'Press the new key or mouse button · Esc to cancel' : `${n}: choose to set a new key${moved ? ` (it was ${keyName(defaultKey(a))})` : ''}. A key already in use trades places.` });
    }).join('')).join('') + divider('Where they stay') + FIXED_KEYS.map(([n, ...ks]) => `<div class="kbrow"><span>${esc(n)}</span><span>${kbKeys(...ks)}</span></div>`).join('')
      + row({ act: 'resetKeys', icon: 'rise', title: 'Put every key back', desc: 'Every key to where it started.' }), 'dense');
    else if (at === 1) inner = padDiagram(G.input.padPS);
    else if (at === 2) inner = `<table class="mx-table"><tr><th></th><th>Keyboard and mouse</th><th>Gamepad</th></tr>${TECH.map(([n, k, pf]) => { const kb = pf(KEY_LABEL); return `<tr><td>${esc(n)}</td><td>${esc(kb === 'the same' ? k : kb)}</td><td>${esc(pf(P))}</td></tr>`; }).join('')}</table>`;
    else inner = `<div class="mx-tips">${TIPS.map(([b, t]) => `<p><b>${esc(b)}</b> ${esc(t)}</p>`).join('')}</div>`;
    const body = panel(`${subtabs(G, CPAGES.map((n, i) => ({ name: n, icon: ['controls', 'controls', 'sword', 'journal'][i] })), at, 'cpage')}<div class="mx-scroll">${inner}</div>`, 'sht');
    return { ctx: 'veil', html: this.frame({ title: 'Controls', crumb: CPAGES[at], layout: 'sheet', body, hints: [at === 0 && ['confirm', 'Set a new key'], [['mSubPrev', 'mSubNext'], 'Page', 'cpage'], ['back', 'Back', 'back']].filter(Boolean) }) };
  },
  gear(data) {
    const G = this.G, d = G.save.data, g = d.gear, p = G.player, wn = id => p.weaponName(id), worn = new Set([...Object.values(g.equip.weapons), ...Object.values(g.equip.armor)]);
    if (data.tab) { data.cat = data.tab === 'cores' ? 'cores' : data.tab === 'weapons' ? 'w:' + (data.w || p.weapon) : (data.slot || 'body'); delete data.tab; }
    const cats = this.gearCats(), C = cats.find(c => c.id === data.cat) || cats[0], ci = cats.indexOf(C);
    data.cat = C.id;
    const order = d.gearSort || 'best', sort = (a, b) => (worn.has(b.uid) - worn.has(a.uid))
      || (order === 'newest' ? b.uid - a.uid : order === 'rarity' ? (b.rar - a.rar) || (b.lvl - a.lvl) : (weaponMul(b) * 100 + armorDef(b) + b.rar) - (weaponMul(a) * 100 + armorDef(a) + a.rar));
    let rows;
    if (C.id === 'kits') {
      rows = [0, 1, 2].map(i => { const K = d.kits?.[i]; return row({ act: 'wearKit', icon: 'equipment', title: `Loadout ${i + 1}`, note: K ? K.arms.map(w => wn(w)).join(' · ') : 'empty', extra: `data-kit="${i}"`, off: false, desc: K ? 'Wear this loadout.' : 'Empty: save what you wear now into it.' }); }).join('');
    } else if (C.id === 'cores') {
      const slots = d.coreSlots || [null, null], owned = Object.keys(d.cores || {}).filter(id => CORES[id]).sort((a, b) => (slots.includes(b) - slots.includes(a)) || CORES[a].name.localeCompare(CORES[b].name));
      rows = owned.map(id => { const at = slots.indexOf(id), gr = Math.min(CORE_MAX, d.cores[id]); return row({ act: 'setCore', icon: 'core', color: '#c89aff', title: `${CORES[id].name}${gr > 1 ? ` +${gr - 1}` : ''}`, tag: at >= 0 ? `Slot ${at + 1}` : '', right: `${CORES[id].cost} FL`, extra: `data-slot="0" data-core="${id}"`, desc: `${CORES[id].skillName}: ${CORES[id].desc}.` }); }).join('')
        || '<div class="mx-empty">No Soul Cores yet. Foes leave them sometimes, elites often, and every gatekeeper and warlord always.</div>';
    } else {
      rows = g.items.filter(it => (C.w ? it.type === C.w : it.slot === C.slot)).sort(sort).map(it => row({ act: 'equipGear', icon: C.w ? 'sword' : SLOT_ICON[C.slot], color: col(it.rar), title: itemName(it, wn), tag: [worn.has(it.uid) && 'Worn', it.lock && 'Locked'].filter(Boolean).join(' · '), right: `Lv ${it.lvl}`, extra: `data-uid="${it.uid}"` })).join('')
        || `<div class="mx-empty">${C.w ? `No ${esc(wn(C.w))} of any rarity yet: the one you carry hits at ×1.00. Foes drop better ones.` : 'Nothing for this slot yet.'}</div>`;
      rows += divider('Clear the pack') + row({ act: 'dismantleBelow', icon: 'hammer', title: 'Dismantle all Common', extra: 'data-rar="0"', desc: 'Every Common piece not worn or locked, for Glimmer.' }) + row({ act: 'dismantleBelow', icon: 'hammer', title: 'Dismantle all Common and Fine', extra: 'data-rar="1"', desc: 'Every Common and Fine piece not worn or locked, for Glimmer.' })
        + row({ act: 'dismantleBelow', icon: 'hammer', title: 'Dismantle all Rare and below', extra: 'data-rar="2"', desc: 'Every Rare, Fine and Common piece not worn or locked, for Glimmer, and Moonsteel from the Rare.' });
    }
    const body = panel(`${subtabs(G, cats.map(c => ({ name: c.name, icon: c.icon })), ci, 'gCat')}${list(rows)}`, 'lst', null) + panel('<div class="mx-detail gdetail live"></div>', 'det');
    return { ctx: 'veil', onFocus: el => this.fill(this.gearDetail(el?.dataset.uid || el?.dataset.core || el?.dataset.kit ? el : null, C)),
      html: this.frame({ title: 'Equipment', crumb: `Pack ${g.items.length} of ${PACK} · ${GEAR_SORT.find(o => o[0] === order)?.[1] || 'best'} first${data.forge ? ' · at the Moonwell' : ''}`, layout: 'browse', chips: this.chips('lvl', 'glim', 'steel'), body,
        hints: C.id === 'cores'
          ? [[['mSubPrev', 'mSubNext'], 'Category', 'gCat'], ['confirm', 'Set in slot 1'], ['mAlt', 'Set in slot 2', 'setCore', 'data-slot="1"'], ['mAlt2', 'Take out', 'coreOut'], ['back', 'Back', 'back']]
          : C.id === 'kits'
          ? [[['mSubPrev', 'mSubNext'], 'Category', 'gCat'], ['confirm', 'Wear'], ['mAlt', 'Save here', 'saveKit'], ['back', 'Back', 'back']]
          : [[['mSubPrev', 'mSubNext'], 'Category', 'gCat'], ['confirm', 'Equip'], ['mAlt', 'Dismantle', 'dismantle'], ['mAlt3', 'Lock', 'lockGear'], ['mAlt4', 'Sort', 'gearSort'], data.forge && ['mAlt2', 'Forge', 'smith'], ['back', 'Back', 'back']] }) };
  },
  patrons() {
    const G = this.G, d = G.save.data, have = d.patrons || ['lantern'], cur = d.patron || 'lantern';
    const rows = PATRON_ORDER.map(id => {
      const P = PATRONS[id];
      return have.includes(id) ? row({ act: 'pledge', icon: 'patron', color: P.css, title: P.name, note: P.title, tag: id === cur ? 'Pledged' : '', extra: `data-id="${id}"` })
        : row({ act: 'pledge', icon: 'lock', title: 'A spirit held captive', note: `Held in ${G.LEVELS[P.from]?.name || '?'}`, right: roman(G.ORDER.indexOf(P.from) + 1), cls: 'dimmed', extra: `data-id="${id}" data-locked="1"` });
    }).join('');
    const body = panel(list(rows), 'lst', ['Patron Spirits', `${have.length} of ${PATRON_ORDER.length} freed`]) + panel('<div class="mx-detail gdetail live"></div>', 'det');
    return { ctx: 'veil', html: this.frame({ title: 'Patronage', crumb: `${PATRONS[cur].name} is pledged to you`, layout: 'browse', body, hints: [['confirm', 'Pledge'], ['back', 'Back', 'back']] }),
      onFocus: el => {
        const id = el?.dataset.id, P = PATRONS[id];
        if (!P) return;
        if (el.dataset.locked) { this.fill(`<div class="mx-kick"><span>Patron Spirit</span><span></span></div><h3>A spirit held captive</h3><div class="mx-note">The warlord of ${esc(G.LEVELS[P.from]?.name || '')} holds it. Fell the warlord to set it free.</div>`); return; }
        this.fill(`<div class="mx-kick"><span>Patron Spirit</span><span>${id === cur ? 'pledged' : ''}</span></div><h3 style="color:${P.css}">${esc(P.name)}</h3><div class="sub">${esc(P.title)}</div>
          ${sec('While pledged')}${P.fx.map(([k, v]) => `<div class="mx-fx"><span>${esc(fxText(k, v))}</span></div>`).join('')}
          ${sec('In the Fae Shift')}${shiftText(P).map(t => `<div class="mx-fx set"><span>${esc(t[0].toUpperCase() + t.slice(1))}</span></div>`).join('')}
          <div class="mx-fx set"><span>As it begins, a burst that throws back everything within ${P.shift.burst[1]} paces</span></div>
          <div class="mx-note">${esc(P.lore)}</div>`);
      } };
  },
  market(data) {
    const G = this.G, d = G.save.data, W = G.market(), ti = Math.max(0, MARKET_TABS.findIndex(t => t.id === data.tab)), T = MARKET_TABS[ti], sold = d.market.sold, wn = id => G.player.weaponName(id);
    data.tab = T.id;
    const gone = w => (!w.repeat && sold.includes(w.key)) || w.owned || w.off;
    const tag = w => (w.owned ? 'Owned' : w.off ? 'Full' : !w.repeat && sold.includes(w.key) ? 'Sold' : '');
    const price = w => `<span class="${(d.petals || 0) < w.price ? 'short' : ''}">${icon('petal')} ${w.price}</span>`;
    const mk = (w, ic, name, color) => row({ act: 'buy', icon: ic, color, title: name, tag: tag(w), right: price(w), cls: gone(w) ? 'sold' : '', extra: `data-key="${esc(w.key)}"` });
    const rows = T.id === 'gear' ? W.gear.map(w => mk(w, w.it.kind === 'weapon' ? 'sword' : SLOT_ICON[w.it.slot], itemName(w.it, wn), col(w.it.rar)))
      : T.id === 'prov' ? W.prov.map(w => mk(w, { vial: 'vial', purse: 'purse', core: 'core', lantern: 'market', cup: 'cup' }[w.kind], w.name, w.kind === 'core' ? '#c89aff' : w.kind === 'cup' ? '#9fe8ff' : null))
      : W.dyes.map(w => mk(w, `<i class="swatch" style="background:${hex(DYES[w.dye].hex)}"></i>`, w.name, null));
    const body = panel(`${subtabs(G, MARKET_TABS.map(t => ({ name: t.name, icon: { gear: 'sword', prov: 'vial', dyes: 'dye' }[t.id] })), ti, 'mTab')}${list(rows.join(''))}`, 'lst') + panel('<div class="mx-detail gdetail live"></div>', 'det');
    return { ctx: 'veil', html: this.frame({ title: 'Hidden Market', crumb: 'New wares every night at noon', sigil: 'market', layout: 'browse', chips: this.chips('petal', 'cup', 'glim'), body, hints: [[['mSubPrev', 'mSubNext'], 'Wares', 'mTab'], ['confirm', 'Buy'], ['back', 'Back', 'back']] }),
      onFocus: el => {
        const w = [...W.gear, ...W.prov, ...W.dyes].find(x => x.key === el?.dataset.key);
        if (!w) return;
        const foot = `${sec('Price')}<div class="mx-fx plain"><span>${icon('petal')} ${w.price} Moonpetals</span><span class="v">${(d.petals || 0) >= w.price ? `${d.petals - w.price} left after` : `${w.price - (d.petals || 0)} short`}</span></div>
          <div class="mx-note">${gone(w) ? (w.owned ? 'Already yours.' : w.off ? (w.kind === 'cup' ? `You carry as many Moon Cups as you can (${CUP_MAX}).` : `Your Moondew is already at ${VIAL_MAX}.`) : 'Sold. The pedlar has more tomorrow night.') : w.repeat ? 'The pedlar keeps plenty of these.' : 'One of these tonight.'} Moonpetals come from Revenants at their graves, Duels and other side missions, Deeds, and warlords.</div>`;
        if (w.it) { this.fill(this.itemDetail(w.it) + foot); return; }
        if (w.kind === 'dye') { const D = DYES[w.dye]; this.fill(`<div class="mx-kick"><span>Dye</span><span></span></div><h3>${esc(w.name)}</h3><div class="dyebig" style="background:${hex(D.hex)}"></div><div class="mx-note">For the Wardrobe: dye your plate, cloak, trim, wings or visor with it.</div>${foot}`); return; }
        const extra = w.kind === 'cup' ? ['Moon Cups', `${d.cups ?? 0} → ${Math.min(CUP_MAX, (d.cups ?? 0) + 1)}`] : w.kind === 'vial' ? ['Moondew', `${d.elixirMax} → ${Math.min(VIAL_MAX, d.elixirMax + 1)}`]
          : w.kind === 'purse' ? ['Glimmer', w.glimmer.toLocaleString()] : w.kind === 'core' ? ['Held', `+${Math.max(0, (d.cores[w.core] || 1) - 1)} → +${d.cores[w.core] || 1}`] : null;
        this.fill(`<div class="mx-kick"><span>Provisions</span><span></span></div><h3>${esc(w.name)}</h3><div class="mx-note">${esc(w.desc)}</div>${extra ? stats([extra]) : ''}${foot}`);
      } };
  },
  wardrobe() {
    const G = this.G, d = G.save.data, L = d.look ||= {}, looks = (d.looks || ['errant']).filter(k => SETS[k]), dyes = DYE_ORDER.filter(k => (d.dyes || []).includes(k));
    const rows = LOOK_PARTS.map(P => {
      const vals = P.k === 'set' ? [null, ...looks] : [null, ...dyes], i = Math.max(0, vals.indexOf(L[P.k] ?? null)), v = vals[i];
      const name = P.k === 'set' ? (v ? SETS[v].name : 'As worn') : v ? DYES[v].name : 'Undyed';
      const sw = P.k === 'set' ? (v ? SETS[v].look : null) : v ? { one: DYES[v].hex } : null;
      const swh = sw ? (sw.one != null ? `<i class="swatch" style="background:${hex(sw.one)}"></i>` : `<i class="swatch" style="background:linear-gradient(90deg,${hex(sw.steel)} 0 33%,${hex(sw.cloth)} 33% 66%,${hex(sw.trim)} 66%)"></i>`) : '';
      return option(P.k, P.name, name, i, vals.length, P.desc, 'lookOpt', swh);
    }).join('');
    const body = panel(`${list(rows)}<div class="mx-detail"><div class="mx-note">A look is learned from any piece of a set you carry. Dyes are sold in the Hidden Market at every Moonwell.</div></div>`, '', ['Attire', `${looks.length} looks · ${dyes.length} of ${DYE_ORDER.length} dyes`]);
    return { ctx: 'world', html: this.frame({ title: 'Wardrobe', crumb: 'Change how your harness looks', sigil: 'wardrobe', layout: 'side', body, hints: [['mAlt', 'Undo all', 'lookReset'], [['left', 'right'], 'Change'], ['back', 'Back', 'back']] }) };
  },
  kinship() {
    const G = this.G, d = G.save.data, cups = d.cups ?? 0, offers = G.kinOffers(), K0 = G.kindred?.alive ? G.kindred : null, ok = G.kinAllowed();
    const rows = [
      ...offers.map((K, i) => row({ act: 'callKin', icon: 'kinship', title: K.name, right: `Level ${K.lvl}`, extra: `data-i="${i}"`, off: !ok || !cups, desc: !ok ? 'A Duel is fought alone.' : cups ? K.motto : 'No Moon Cups: Revenants, gatekeepers and the Hidden Market have them.' })),
      K0 && row({ act: 'sendKin', icon: 'rise', title: 'Send home', desc: `${K0.name} goes back to the moon.` }),
      row({ act: 'back', icon: 'quit', title: 'Leave', desc: 'Walk on alone.' }),
    ].filter(Boolean).join('');
    const card = panel('<div class="mx-detail live"></div>', 'mx-card tall kin-card', ['Kindred Spirit', '']);
    return { ctx: 'world', html: this.frame({ title: 'Kinship', crumb: K0 ? `${K0.name} walks with you` : 'No kindred walks with you', sigil: 'kinship', layout: 'hub', chips: this.chips('cup'), body: `<div class="mx-left">${list(rows, 'hubl')}</div>${card}`, hints: [['confirm', 'Call'], ['back', 'Back', 'back']] }),
      onFocus: el => {
        const K = offers[+(el?.dataset.i ?? -1)] || (el?.dataset.act === 'sendKin' ? K0?.K : null) || offers[0];
        if (!K) return;
        const P = PATRONS[K.patron], S = SETS[K.set];
        this.fill(`<div class="mx-kick"><span>Level ${K.lvl}</span><span>one Moon Cup</span></div><h3>${esc(K.name)}</h3><div class="sub">${esc(K.motto || '')}</div>
          ${stats([['Weapon', esc(G.player.weaponName(K.weapon))], ['Harness', esc(S.name)], ['Patron Spirit', `<span style="color:${P.css}">${esc(P.name)}</span>`]])}
          <div class="mx-note">It stays until it falls (raise it for a third of your health), a warlord falls, or you rest. Foes grow a little hardier while it walks with you.</div>`);
      } };
  },
  grave(data) {
    const G = this.G, K = data.K, P = PATRONS[K.patron], S = SETS[K.set], wn = G.player.weaponName(K.weapon), carries = G.save.data.arms.includes(K.weapon);
    const petals = gravePetals(K, G.save.data.ng || 0, !!G.tonight?.omen);
    const card = panel(`<div class="mx-detail"><div class="mx-kick"><span>Revenant · Level ${K.lvl}</span><span></span></div><h3>${esc(K.name)}</h3><div class="sub">${esc(K.how)}</div>
      ${stats([['Weapon', esc(wn)], ['Harness', esc(S.name)], ['Patron Spirit', `<span style="color:${P.css}">${esc(P.name)}</span>`]])}
      ${sec('Spoils')}<div class="mx-fx"><span>${petals} Moonpetals</span></div><div class="mx-fx"><span>A piece of its harness${carries ? ` or its ${esc(wn)}` : ''}, Rare or finer</span></div><div class="mx-fx off"><span>Now and then its Soul Core, or a Moon Cup</span></div></div>`, 'mx-card tall grave-card', ['Bloodied Grave', '']);
    const rows = row({ act: 'graveFight', icon: 'grave', title: 'Challenge', extra: `data-i="${data.i}"`, desc: 'Raise the Revenant and fight it here.' }) + row({ act: 'back', icon: 'quit', title: 'Leave it', desc: 'Walk on. The grave will wait.' });
    return { ctx: 'world', html: this.frame({ title: 'Bloodied Grave', crumb: G.level.name, sigil: 'grave', layout: 'hub', body: `<div class="mx-left">${list(rows, 'hubl')}</div>${card}`, hints: [['confirm', 'Select'], ['back', 'Back', 'back']] }) };
  },
  cleared() {
    const G = this.G, sv = G.save, L = G.level, m = Math.floor(sv.time / 60), s = Math.floor(sv.time % 60);
    const body = panel(`<div class="mx-ceremony"><div class="kick">Mission complete</div><h2>${esc(L.name)}</h2><div class="mx-lore">${esc(L.outro || '')}</div>
      <div class="mx-figs"><div><small>Time</small><b>${m}:${String(s).padStart(2, '0')}</b></div><div><small>Falls</small><b>${sv.deaths}</b></div><div><small>Level</small><b>${sv.level}</b></div><div><small>Glimmer</small><b style="color:var(--mx-gold)">${sv.glimmer.toLocaleString()}</b></div></div>
      ${list(row({ act: 'missions', icon: 'crossroads', title: 'Onward', desc: 'To the Fae Crossroads.' }))}</div>`, '');
    return { ctx: 'plain', html: this.frame({ title: 'Cleared', crumb: L.name, sigil: 'deeds', layout: 'result', body, hints: [['confirm', 'Onward']] }) };
  },
  sidecleared(data) {
    const G = this.G, S = SIDES[data.id], g = G.save.data.gear, got = data.spoils.map(uid => g.items.find(it => it.uid === uid)).filter(Boolean);
    const body = panel(`<div class="mx-ceremony"><div class="kick">Side mission complete${data.first ? ' · first time' : ''}</div><h2>${esc(S.name.replace(/^[^:]*: /, ''))}</h2><div class="mx-lore">${esc(S.desc)}</div>
      <div class="mx-figs"><div><small>Glimmer</small><b style="color:var(--mx-gold)">${data.gl.toLocaleString()}</b></div>${data.pt ? `<div><small>Moonpetals</small><b style="color:#ffb8e0">${data.pt}</b></div>` : ''}${got.map(it => `<div><small>${esc(RARITY[it.rar].name)} · Lv ${it.lvl}</small><b style="color:${col(it.rar)};font-size:18px">${esc(itemName(it, w => WEAPONS[w]?.name || w))}</b></div>`).join('')}</div>
      ${list(row({ act: 'missions', icon: 'crossroads', title: 'Onward', desc: 'To the Fae Crossroads.' }))}</div>`, '');
    return { ctx: 'plain', html: this.frame({ title: S.kindName, crumb: G.LEVELS[S.mission]?.name, sigil: 'sides', layout: 'result', body, hints: [['confirm', 'Onward']] }) };
  },
  ending() {
    const G = this.G, sv = G.save, m = Math.floor(sv.time / 60), s = Math.floor(sv.time % 60);
    const rows = row({ act: 'ngplus', icon: 'sparkle', title: `Walk the ${wayName(sv.ng + 1)}`, note: 'New Game+', desc: `${wayDesc(sv.ng + 1)} You keep your level, gear, weapons, Soul Cores and skills; the missions begin again.` })
      + row({ act: 'missions', icon: 'crossroads', title: 'Walk the Fae Crossroads', desc: 'Any mission, any side mission, the Underbriar.' }) + row({ act: 'title', icon: 'quit', title: 'Return to title' });
    const body = panel(`<div class="mx-ceremony"><div class="kick">${esc(wayName(sv.ng))}</div><h2>${esc(G.level.endingTitle || 'The Paths Are Still')}</h2><div class="mx-lore">${esc(G.level.ending || G.level.outro || '')}</div>
      <div class="mx-figs"><div><small>Time</small><b>${m}:${String(s).padStart(2, '0')}</b></div><div><small>Falls</small><b>${sv.deaths}</b></div><div><small>Level</small><b>${sv.level}</b></div></div>${list(rows)}</div>`, '');
    return { ctx: 'plain', html: this.frame({ title: 'The End', crumb: 'For now', sigil: 'moon', layout: 'result', body, hints: [['confirm', 'Select']] }) };
  },
  // The overworld draws itself; this is its overlay: floating labels and the chosen mission's pane.
  map(data) {
    const G = this.G, O = G.overworld, sv = G.save, d = sv.data, id = O.selected, L = G.LEVELS[id], i = G.ORDER.indexOf(id), st = O.status(id);
    const opening = O.revealing?.n.id === id, shown = st !== 'sealed' && (d.seen?.includes(id) || opening), m = d.missions[id] || { kindled: [], items: [] };
    const charms = (L.items || []).filter(it => it.kind === 'charm').map(it => it.id), trophies = [L.gate?.charm, L.bossCharm].filter(Boolean);
    const found = charms.filter(c => m.items.includes(c)).length + trophies.filter(c => d.charms.includes(c)).length;
    const prev = G.LEVELS[G.ORDER[i - 1]], om = shown && OMENS[G.tonight?.omens[id]];
    const labels = O.nodes.map(n => {
      const s = O.status(n.id), vis = s !== 'sealed' && d.seen?.includes(n.id), o = vis && OMENS[G.tonight?.omens[n.id]];
      return `<button class="owl ${vis ? s : 'sealed'} ${n.id === id ? 'sel' : ''}" data-act="node" data-id="${n.id}"><span class="n">${roman(n.i + 1)}</span>${vis ? esc(n.L.name) : 'Sealed'}${o ? `<span class="omen" style="color:${o.css}" title="${esc(o.name)}">☾</span>` : ''}</button>`;
    }).join('');
    const acts = [
      row({ act: 'setout', icon: 'travel', title: 'Set out', extra: `data-id="${id}"`, off: !shown || opening, desc: shown ? `Walk into ${L.name}.` : '' }),
      st === 'cleared' && !opening && row({ act: 'sides', icon: 'sides', title: 'Side missions', right: G.hud.key('mAlt'), extra: `data-id="${id}"`, desc: 'Twilight, a Hunt and a Duel.' }),
      d.missions.keep?.cleared && !opening && row({ act: 'underbriar', icon: 'abyss', title: 'The Underbriar', right: `deepest ${d.abyss?.best || 0}`, desc: 'The endless maze beneath the Crossroads.' }),
      !opening && row({ act: 'thornyard', icon: 'sword', title: 'The Thornyard', right: `${trialsPassed(d)} / ${TRIALS.length}`, desc: 'Trials that teach every technique of the fight. A fall there costs nothing.' }),
      data?.from === 'shrine' ? row({ act: 'back', icon: 'moon', title: 'Stay', desc: 'Back to the Moonwell.' }) : data?.from === 'title' ? row({ act: 'back', icon: 'quit', title: 'Back' }) : row({ act: 'title', icon: 'quit', title: 'Return to title' }),
    ].filter(Boolean).join('');
    const tags = shown ? `<div class="owtags"><span class="t ${st}">${{ cleared: 'Cleared', inprogress: 'In progress', new: 'New' }[st]}</span><span>Moonwells ${m.kindled.length} / ${Object.keys(L.shrines).length}</span><span>Charms ${found} / ${charms.length + trophies.length}</span><span>Letters ${(L.letters || []).filter(l => d.letters.includes(id + ':' + l.id)).length} / ${(L.letters || []).length}</span><span>Pixies ${(L.pixies || []).filter(q => d.pixies.includes(id + ':' + q.id)).length} / ${(L.pixies || []).length}</span>${st === 'cleared' ? sidesOf(id).map(S => `<span class="t ${d.sides?.[S.id] ? 'cleared' : 'new'}">${esc(S.kindName)}${d.sides?.[S.id] ? ' ✓' : ''}</span>`).join('') : ''}</div>` : '';
    const pane = panel(`<div class="mx-detail"><div class="mx-kick"><span>${roman(i + 1)} · Level ${L.level + wayLvl(d.ng)}+</span><span>${d.ng ? esc(wayName(d.ng)) : ''}</span></div>
      <h3>${shown ? esc(L.name) : 'Sealed'}</h3>${opening ? '<div class="sub">A new path opens</div>' : ''}
      ${om ? `<div class="owomen" style="color:${om.css}">☾ Tonight, a ${esc(om.name)}: ${esc(om.desc)}</div>` : ''}
      <div class="mx-note" style="margin-top:4px">${esc(shown ? L.blurb : prev ? `The path is not yet open. Clear ${prev.name} to find the way.` : 'The path is not yet open.')}</div>${tags}</div>${list(acts)}`, 'owpanel');
    return { ctx: 'map', html: `${this.frame({ title: 'The Fae Crossroads', crumb: d.ng ? wayName(d.ng) : 'Choose where the path leads', sigil: 'crossroads', layout: '', chips: this.chips('lvl', 'glim', 'petal'), body: `<div class="owlabels">${labels}</div>${pane}`,
      hints: [[['left', 'right'], 'Travel'], ['confirm', 'Set out'], st === 'cleared' && ['mAlt', 'Side missions'], d.missions.keep?.cleared && ['mAlt2', 'Underbriar'], ['back', 'Back']] })}<div class="owfade"></div>` };
  },
  sides(data) {
    const G = this.G, d = G.save.data, L = G.LEVELS[data.m];
    const rows = sidesOf(data.m).map(S => {
      const n = d.sides?.[S.id] || 0, lv = L.level + S.lvl + wayLvl(d.ng);
      return row({ act: 'side', icon: { twilight: 'moon', hunt: 'lock', duel: 'grave' }[S.kind], title: S.name.replace(/^[^:]*: /, ''), note: `${S.kindName}${n ? ` · done ×${n}` : ' · first run: double Glimmer and an extra piece'}`, right: `Lv ${lv}+`, extra: `data-m="${data.m}" data-id="${S.id}"`, desc: S.desc });
    }).join('');
    const body = panel(`${list(rows + row({ act: 'back', icon: 'quit', title: 'Back' }))}<div class="mx-detail"><div class="mx-note">A side run keeps its own Moonwells and leaves the mission's own as they were. Spoils: Glimmer, Moonpetals and gear of Rare or better; its gatekeeper or Revenant always leaves its Soul Core.</div></div>`, '', ['Side missions', L.name]);
    return { ctx: 'map', html: this.frame({ title: 'Side Missions', crumb: L.name, sigil: 'sides', layout: 'dialog', body, hints: [['confirm', 'Set out'], ['back', 'Back', 'back']] }) };
  },
  underbriar() {
    const G = this.G, a = G.save.data.abyss || { cps: [1], best: 0 };
    const rows = [...a.cps].sort((x, y) => y - x).map(cp => row({ act: 'descend', icon: cp === 1 ? 'abyss' : 'moon', title: `Descend from Depth ${cp}`, note: `Its halls are dressed as ${G.LEVELS[themeOf(cp)].name}'s.`, right: `Lv ${depthScale(cp).level + wayLvl(G.save.data.ng)}+`, extra: `data-depth="${cp}"`, desc: cp === 1 ? 'From the beginning.' : 'From a lit Moonwell you reached.' })).join('');
    const body = panel(`<div class="mx-detail"><div class="mx-note">An endless maze where everything the moon ever lit goes to dream, made anew at every depth. Slay every foe on a depth to open the way down; every fifth depth ends with a warlord, and the depth after it holds a lit Moonwell. The deeper, the harder, and the richer.</div></div>${list(rows + row({ act: 'back', icon: 'quit', title: 'Back' }))}`, '', ['The Underbriar', `deepest cleared: ${a.best || 0}`]);
    return { ctx: 'map', html: this.frame({ title: 'The Underbriar', crumb: 'Beneath the Fae Crossroads', sigil: 'abyss', layout: 'dialog', body, hints: [['confirm', 'Descend'], ['back', 'Back', 'back']] }) };
  },
  // Letters, mission by mission, each read in full at the right as it is chosen.
  journal() {
    const G = this.G, d = G.save.data;
    let rows = '';
    for (const id of G.ORDER.filter(x => d.unlocked.includes(x))) {
      const L = G.LEVELS[id], ls = L.letters || [], ps = L.pixies || [];
      const read = ls.filter(l => d.letters.includes(id + ':' + l.id)).length, freed = ps.filter(q => d.pixies.includes(id + ':' + q.id)).length;
      rows += divider(`${L.name} · ${read} / ${ls.length} letters · ${freed} / ${ps.length} pixies`);
      rows += ls.map(l => d.letters.includes(id + ':' + l.id) ? row({ act: 'letter', icon: 'letter', title: l.title, extra: `data-m="${id}" data-id="${l.id}"` }) : row({ act: 'none', icon: 'lock', title: 'A letter not yet found', off: true })).join('');
    }
    const body = panel(list(rows), 'lst') + panel('<div class="mx-detail gdetail live"></div>', 'det');
    return { ctx: 'veil', html: this.frame({ title: 'Journal', crumb: `${d.letters.length} letters · ${d.pixies.length} Lost Pixies freed (+${d.pixies.length}% health and stamina)`, layout: 'browse', chips: this.chips('lvl'), body, hints: [['confirm', 'Read in full'], ['back', 'Back', 'back']] }),
      onFocus: el => {
        const L = G.LEVELS[el?.dataset.m], l = L?.letters?.find(x => x.id === el.dataset.id);
        this.fill(l ? `<div class="mx-kick"><span>${esc(L.name)}</span><span>letter</span></div><h3>${esc(l.title)}</h3><div class="lettertext">${esc(l.text)}</div>` : '<div class="mx-note">Letters lie where their writers left them. Read ones stay here.</div>');
      } };
  },
  letter(data) {
    const G = this.G, L = G.LEVELS[data.m], l = (L.letters || []).find(x => x.id === data.id);
    return { ctx: 'veil', html: this.frame({ title: l.title, crumb: L.name, sigil: 'letter', layout: 'sheet', body: panel(`<div class="parch">${esc(l.text)}</div>`, 'sht'), hints: [['back', 'Back', 'back']] }) };
  },
  bestiary(data) {
    const G = this.G, d = G.save.data, all = bestiary(), act = data.act ?? 0, lst = all.filter(B => B.act === act);
    const felled = all.filter(B => (d.beast?.[B.id] || 0) > 0).length;
    const rows = lst.map(B => known(d, B)
      ? row({ act: 'beast', icon: ROLE_ICON[B.role], color: ROLE_COLOR[B.role], title: B.T.name.split(',')[0], right: String(d.beast?.[B.id] || 0), extra: `data-id="${B.id}"` })
      : row({ act: 'beast', icon: 'lock', title: 'Not yet felled', right: roman(G.ORDER.indexOf(B.missions[0]) + 1), cls: 'dimmed', extra: `data-id="${B.id}" data-locked="1"` })).join('');
    const body = panel(`${subtabs(G, ACTS.map((a, i) => ({ name: `${roman(i + 1)} · ${a}` })), act, 'bAct')}${list(rows)}`, 'lst') + panel('<div class="mx-detail gdetail live"></div>', 'det');
    return { ctx: 'veil', html: this.frame({ title: 'Bestiary', crumb: `${felled} of ${all.length} felled · ${d.beast?.fallen || 0} fallen knights laid to rest`, layout: 'browse', body, hints: [[['mSubPrev', 'mSubNext'], 'Act', 'bAct'], ['back', 'Back', 'back']] }),
      onFocus: el => {
        const B = all.find(x => x.id === el?.dataset.id);
        if (!B) return;
        const where = B.missions.map(m => G.LEVELS[m]?.name).filter(Boolean).join(' · ');
        if (el.dataset.locked) { this.fill(`<div class="mx-kick"><span>${esc(B.role)}</span><span></span></div><h3>Not yet felled</h3>${sec('Met in')}<div class="mx-note">${esc(where)}</div>`); return; }
        const C = coreOf(B.id), tr = traits(B.T), n = d.beast?.[B.id] || 0;
        this.fill(`<div class="mx-kick"><span>${esc(B.role)}</span><span>Act ${roman(B.act + 1)}</span></div><h3 style="color:${ROLE_COLOR[B.role]}">${esc(B.T.name)}</h3><div class="sub">Felled ${n} time${n === 1 ? '' : 's'}</div>
          ${sec('Met in')}<div class="mx-note" style="margin-top:0">${esc(where)}</div>
          ${sec('Its arts')}${artsOf(B.T).map(a => `<div class="mx-fx plain"><span>${esc(a)}</span></div>`).join('')}
          ${tr.length ? `${sec('Its ways')}${tr.map(t => `<div class="mx-fx set"><span>${esc(t)}</span></div>`).join('')}` : ''}
          ${sec('Soul Core')}<div class="mx-fx ${C ? '' : 'off'}"><span>${C ? `${esc(C.name)} · ${esc(C.skillName)}` : 'None'}</span></div>`);
      } };
  },
  // Every weapon found: take one in hand (the other carried goes to the back), forge it at a Moonwell; the ranged one carried.
  arsenal(data) {
    const G = this.G, d = G.save.data, sv = G.save;
    let rows = d.arms.map(w => {
      const W = WEAPONS[w], rank = d.forge[w] || 0, inHand = d.wield === w, onBack = !inHand && d.loadout.includes(w);
      return row({ act: 'wield', icon: 'sword', title: `${W.name}${rank ? ` +${rank}` : ''}`, tag: inHand ? 'In hand' : onBack ? 'On your back' : '', right: W.mech ? esc(W.mech) : '', extra: `data-w="${w}"`, cls: inHand || onBack ? '' : 'dimmed' });
    }).join('');
    rows += divider(`Ranged · one carried · aim with ${G.hud.key('aim')}`) + (d.ranged || ['wisp']).map(r => row({ act: 'wield', icon: 'bow', title: RANGED[r].name, tag: d.rangedSel === r ? 'Carried' : '', extra: `data-r="${r}"` })).join('');
    const body = panel(list(rows), 'lst', ['Weapons', `${d.arms.length} found · two carried`]) + panel('<div class="mx-detail gdetail live"></div>', 'det');
    return { ctx: 'veil', html: this.frame({ title: 'Arsenal', crumb: `Switch between your two with ${G.hud.key('swap')}`, layout: 'browse', chips: this.chips('glim'), body, hints: [['confirm', 'Take in hand'], data.forge && ['mAlt', 'Forge', 'forge'], ['back', 'Back', 'back']] }),
      onFocus: el => {
        const w = el?.dataset.w, r = el?.dataset.r;
        if (r) { const R = RANGED[r]; this.fill(`<div class="mx-kick"><span>Ranged</span><span>${d.rangedSel === r ? 'carried' : ''}</span></div><h3>${esc(R.name)}</h3><div class="mx-note">${esc(R.desc)}</div>${stats([['Ammunition', R.ammo ? `${R.ammo} ${{ bow: 'arrows', rifle: 'shot', cannon: 'shells' }[r]}, refilled at Moonwells` : 'None: it overheats']])}`); return; }
        const W = WEAPONS[w]; if (!W) return;
        const rank = d.forge[w] || 0, cost = forgeCost(rank), gw = d.gear?.items.find(it => it.uid === d.gear.equip.weapons[w]);
        this.fill(`<div class="mx-kick"><span>${d.wield === w ? 'In hand' : d.loadout.includes(w) ? 'On your back' : 'Stowed'}</span><span>${rank ? `forged +${rank}` : ''}</span></div><h3>${esc(W.name)}</h3><div class="sub">${esc(W.desc)}</div>
          ${W.mech ? `${sec(W.mech)}<div class="mx-note" style="margin-top:0">${esc(W.mechDesc)}</div>` : ''}
          ${sec('Scaling')}<div class="mx-fx plain scal"><span>Damage grows with</span><span class="v">Strength <b class="gr g${scalingOf(w)[0]}">${scalingOf(w)[0]}</b> · Spirit <b class="gr g${scalingOf(w)[1]}">${scalingOf(w)[1]}</b></span></div>
          ${sec('Forms')}${['high', 'mid', 'low'].map(s => `<div class="mx-fx plain"><span>${{ high: 'High', mid: 'Mid', low: 'Low' }[s]}</span><span class="v">${esc(FORMS[w][s].name)}</span></div>`).join('')}
          ${gw ? `${sec('Gear in hand')}<div class="mx-fx plain"><span style="color:${col(gw.rar)}">${esc(itemName(gw, id => G.player.weaponName(id)))}</span><span class="v">Lv ${gw.lvl} · ×${weaponMul(gw).toFixed(2)}</span></div>` : ''}
          ${sec('Forging')}${rank >= FORGE.max ? '<div class="mx-fx set"><span>Forged to +10</span></div>' : `<div class="mx-fx ${data.forge ? 'plain' : 'off'}"><span>To +${rank + 1}: 5% more damage with it</span><span class="v">${cost.toLocaleString()} Glimmer</span></div>`}
          <div class="mx-note">${data.forge ? (sv.glimmer >= cost ? `Forge it with ${G.hud.key('mAlt')}.` : 'Not enough Glimmer to forge it.') : 'Weapons are forged at a Moonwell.'}</div>`);
      } };
  },
  moves(data) {
    const G = this.G, arms = G.player.arms, w = arms.includes(data.w) ? data.w : arms[0], Wp = WEAPONS[w], K = KIT[w];
    const nm = k => esc(Wp.names?.[k] || ATK[k]?.name || k);
    const forms = ['high', 'mid', 'low'].map(s => {
      const F = FORMS[w][s];
      return `<div class="form ${s}"><div class="fh">${icon(STANCE_ICON[s])}<b>${esc(F.name)}</b><small>${{ high: 'High', mid: 'Mid', low: 'Low' }[s]}</small></div>
        <p><em>Standing</em>${F.neutral.map(nm).join(' → ')}</p><p><em>Moving</em>${F.forward.map(nm).join(' → ')}</p>
        <p><em>Pause</em>two strikes, wait for the glint, strike: <b>${nm(F.pause)}</b></p><p><em>Heavy</em>${nm(Wp.heavy[s])}</p></div>`;
    }).join('');
    const kit = `<div class="kit">${Wp.mech ? `<p><em>${esc(Wp.mech)}</em>${esc(Wp.desc)} ${esc(Wp.mechDesc)}.</p>` : `<p><em>The weapon</em>${esc(Wp.desc)}</p>`}<p><em>Finishers</em>strike then heavy: <b>${nm(K.fin[0])}</b> · two strikes then heavy: <b>${nm(K.fin[1])}</b> · three or more: <b>${nm(K.fin[2])}</b>. A finisher spends the combo counter: the more hits counted, the harder it lands (up to 1.8×).</p>
      <p><em>On the move</em>at a sprint, strike: ${nm(Wp.run)} · out of a dash: ${nm(Wp.dash)} · from a slide: <b>${nm(K.slide)}</b></p>
      <p><em>Skills</em>${[['back', 'Backstep Strike'], ['counter', 'Guard Counter'], ['airFin', 'Air Finisher'], ['skill', 'Weapon Skill']].map(([k, n]) => { const t = TREE.find(x => x.move === k), has = G.save.data.mastery?.[w]?.learned.includes(t.id); return `${n}: <b>${nm(SKILL_KITS[w][k])}</b>${has ? '' : ' (not yet learned)'}`; }).join(' · ')}</p>
      <p><em>Combo</em>every 12 hits in a row add 6% damage, up to +24%. A blow taken halves the count; four seconds without a hit clears it.</p></div>`;
    const body = panel(`${subtabs(G, arms.map(id => ({ name: WEAPONS[id].name, icon: 'sword' })), arms.indexOf(w), 'movesW')}<div class="mx-scroll"><div class="forms3">${forms}</div>${kit}</div>`, 'sht');
    return { ctx: 'veil', html: this.frame({ title: 'Movesets', crumb: Wp.name, layout: 'sheet', body, hints: [[['mSubPrev', 'mSubNext'], 'Weapon', 'movesW'], ['back', 'Back', 'back']] }) };
  },
  skills(data) {
    const G = this.G, d = G.save.data, owned = [...G.player.arms, ...(G.player.rangedOwned || [])], w = owned.includes(data.w) ? data.w : owned[0];
    const m = d.mastery?.[w] || { xp: 0, learned: [] }, tree = treeFor(w), earned = pointsAt(m.xp), free = earned - treeCost(m.learned);
    const Wn = WEAPONS[w]?.name || G.player.rangedDef?.(w)?.name || w, K = SKILL_KITS[w] || {};
    const pages = owned.map(id => { const mi = d.mastery?.[id] || { xp: 0, learned: [] }, f = pointsAt(mi.xp) - treeCost(mi.learned); return { name: WEAPONS[id]?.name || G.player.rangedDef?.(id)?.name || id, icon: WEAPONS[id] ? 'sword' : 'bow', badge: f > 0 ? f : '' }; });
    const next = xpFor(earned + 1), prev = xpFor(earned), frac = Math.min(1, (m.xp - prev) / (next - prev));
    const tiers = [0, 1, 2, 3].map(tier => tree.filter(t => t.tier === tier)).filter(r => r.length).map(r => `<div class="srow">${r.map(t => {
      const has = m.learned.includes(t.id), open = canLearn(tree, m.learned, t.id), afford = free >= t.cost;
      const needs = t.req ? t.req.map(q => tree.find(x => x.id === q).name).join(' or ') : '';
      const desc = t.id === 'mech' ? `${WEAPONS[w]?.mech || 'Mechanic'} Mastery: ${MECH_MASTERY[w] || ''}` : t.move && K[t.move] ? `${t.desc} <b>${esc(G.player.moveName(K[t.move], w))}</b>` : esc(t.desc);
      const tag = has ? 'Learned' : !open ? `Needs ${esc(needs)}` : `${t.cost} point${t.cost > 1 ? 's' : ''}`;
      return `<button class="btn skill ${has ? 'has' : open && afford ? 'can' : 'no'}" data-act="learn" data-w="${w}" data-id="${t.id}" data-desc="${esc((t.id === 'mech' ? `${WEAPONS[w]?.mech || ''} Mastery` : t.name) + ' · ' + tag)}">
        <b>${esc(t.id === 'mech' ? `${WEAPONS[w]?.mech || ''} Mastery` : t.name)}</b><small>${desc}</small><span class="stag">${tag}</span></button>`;
    }).join('')}</div>`).join('');
    const body = panel(`${subtabs(G, pages, owned.indexOf(w), 'skillsW')}<div class="mastery"><span>Mastery ${Math.floor(m.xp).toLocaleString()}</span>${meter(frac)}<span>${free} of ${earned} point${earned === 1 ? '' : 's'} to spend · next at ${next.toLocaleString()}</span></div><div class="mx-scroll"><div class="tree">${tiers}</div></div>`, 'sht');
    return { ctx: 'veil', html: this.frame({ title: 'Skills', crumb: Wn, layout: 'sheet', body, hints: [[['mSubPrev', 'mSubNext'], 'Weapon', 'skillsW'], ['confirm', 'Learn'], ['back', 'Back', 'back']] }),
      help: 'Every blow landed with a weapon teaches it a little; felling a foe teaches more. Skills can be learned anywhere.' };
  },
  // The Moonwell's forge: reroll an effect, or raise the piece's level with another of its kind.
  smith(data) {
    const G = this.G, d = G.save.data, g = d.gear, p = G.player, it = g.items.find(x => x.uid === data.uid), wn = id => p.weaponName(id);
    if (!it) return { ctx: 'veil', html: this.frame({ title: 'The Forge', layout: 'dialog', body: panel('<div class="mx-empty">That piece is gone.</div>'), hints: [['back', 'Back', 'back']] }) };
    const rc = reforgeCost(it), worn = new Set([...Object.values(g.equip.weapons), ...Object.values(g.equip.armor)]);
    const fod = g.items.filter(x => x !== it && !worn.has(x.uid) && !x.lock && x.lvl > it.lvl && (it.kind === 'weapon' ? x.type === it.type : x.slot === it.slot)).sort((a, b) => b.lvl - a.lvl).slice(0, 8);
    let rows = divider(`Reforge · ${rc.toLocaleString()} Glimmer each`) + (it.fx.length ? it.fx.map(([id, v], i) => row({ act: 'reforge', icon: 'anvil', title: fxText(id, v), note: 'Roll it anew', right: `${rc.toLocaleString()}`, extra: `data-i="${i}"`, off: G.save.glimmer < rc, desc: 'One effect rolled anew, into another the piece doesn\'t carry.' })).join('') : '<div class="mx-empty">A Common piece has no effects to reforge.</div>');
    const tc = temperCost(it), tmp = it.tmp || 0;
    rows += divider(`Temper · ${d.moonsteel || 0} Moonsteel held`) + (tmp >= TEMPER.max ? '<div class="mx-empty">Tempered to +5: it can be hardened no further.</div>'
      : row({ act: 'temper', icon: 'anvil', title: `Temper to +${tmp + 1}`, note: `${tc.steel} Moonsteel · ${it.kind === 'weapon' ? `${TEMPER.dmg * 100}% more damage` : `${TEMPER.def * 100}% more defence`}, effects a tenth stronger`, right: tc.glimmer.toLocaleString(), off: G.save.glimmer < tc.glimmer || (d.moonsteel || 0) < tc.steel, desc: 'Moonsteel comes from dismantling Rare, Fabled, Moonlit and Divine pieces.' }));
    rows += divider('Soul Match · the other piece is consumed') + (fod.length ? fod.map(x => { const c = soulMatchCost(it, x); return row({ act: 'soulmatch', icon: 'core', title: `To level ${x.lvl}`, note: `consuming ${itemName(x, wn)}`, right: c.toLocaleString(), extra: `data-from="${x.uid}"`, off: G.save.glimmer < c, desc: 'Raise it to the other piece\'s level.' }); }).join('') : '<div class="mx-empty">No higher-level piece of this kind to match it with (worn pieces are never consumed).</div>');
    const body = panel(list(rows), 'lst', ['The Moonwell\'s forge', '']) + panel(`<div class="mx-detail">${this.itemDetail(it)}</div>`, 'det');
    return { ctx: 'veil', html: this.frame({ title: 'The Forge', crumb: itemName(it, wn), sigil: 'anvil', layout: 'browse', chips: this.chips('glim', 'steel'), body, hints: [['confirm', 'Select'], ['back', 'Back', 'back']] }) };
  },
  deeds() {
    const G = this.G, all = G.deedsView(), earned = all.reduce((a, r) => a + r.tier, 0);
    const rows = all.map(({ D, n, tier }) => { const next = D.tiers[tier]; return row({ act: 'none', icon: 'deeds', color: tier === 3 ? 'var(--mx-gold)' : tier ? 'var(--mx-rose)' : null, title: D.name, tag: tier ? TIER[tier - 1] : '', right: next ? `${n.toLocaleString()} / ${next.toLocaleString()}` : 'complete', extra: `data-id="${D.id}"` }); }).join('');
    const body = panel(list(rows), 'lst', ['Deeds', `${earned} of ${all.length * 3} tiers`]) + panel('<div class="mx-detail gdetail live"></div>', 'det');
    return { ctx: 'veil', html: this.frame({ title: 'Deeds', crumb: 'Long goals kept across every mission, Way and depth', layout: 'browse', body, hints: [['back', 'Back', 'back']] }),
      onFocus: el => {
        const r = all.find(x => x.D.id === el?.dataset.id); if (!r) return;
        const { D, n, tier } = r, next = D.tiers[tier];
        this.fill(`<div class="mx-kick"><span>Deed</span><span>${tier ? `tier ${TIER[tier - 1]}` : 'not yet begun'}</span></div><h3>${esc(D.name)}</h3><div class="sub">${esc(D.desc)}</div>
          ${meter(next ? n / next : 1, 'gold')}<div class="mx-fx plain"><span>${n.toLocaleString()}${next ? ` of ${next.toLocaleString()}` : ''}</span><span class="v">${next ? `${Math.round(n / next * 100)}%` : 'complete'}</span></div>
          ${sec('Tiers')}${D.tiers.map((t, k) => `<div class="mx-fx ${k < tier ? 'set' : 'off'}"><span>${TIER[k]} · ${t.toLocaleString()}</span><span class="v">${DEED_GLIMMER[k].toLocaleString()} Glimmer · ${(k + 1) * 5} Moonpetals</span></div>`).join('')}
          ${sec('Each tier, for good')}<div class="mx-fx"><span>${esc(fxText(D.fx[0], D.fx[1]))}</span></div>`);
      } };
  },
  // The Thornyard's Trial Stone: the trials by group, and the chosen one's lesson, keys, record and reward.
  trials(data) {
    const G = this.G, d = G.save.data, run = G.trials.run, passed = trialsPassed(d), tier = G.level.tier || 1;
    if (data.focus) { this.top.focus = Math.max(0, TRIALS.findIndex(t => t.id === data.focus)); data.focus = null; }
    let rows = '';
    TRIAL_GROUPS.forEach((gn, g) => {
      rows += divider(gn);
      rows += TRIALS.filter(T => T.g === g).map(T => {
        const r = d.trials?.[T.id], lock = trialLock(T, d);
        return row({ act: lock ? 'trialLocked' : 'trial', icon: lock ? 'lock' : r?.n ? 'check' : ['sword', 'sparkle', 'crown'][g], color: lock ? 'var(--mx-faint)' : r?.unhurt ? 'var(--mx-gold)' : r?.n ? 'var(--mx-rose)' : null,
          title: T.name, tag: r?.unhurt ? 'Unhurt' : '', right: r?.n ? `${r.best.toFixed(1)}s` : '', extra: `data-id="${T.id}"`, desc: lock || T.goal });
      }).join('');
    });
    rows += row({ act: run ? 'abandonTrial' : 'back', icon: 'quit', title: run ? 'Abandon the trial' : 'Step away', desc: run ? 'End the trial under way.' : 'Back to the yard.' });
    const body = panel(list(rows), 'lst', ['Trials', `${passed} of ${TRIALS.length} passed`]) + panel('<div class="mx-detail gdetail live"></div>', 'det');
    return { ctx: 'veil', html: this.frame({ title: 'The Trial Stone', crumb: 'The Thornyard · where the fae knights learned the fight', sigil: 'sword', layout: 'browse', chips: this.chips('lvl', 'glim', 'petal'), body,
      hints: [['confirm', 'Begin the trial'], ['back', 'Back', 'back']] }),
      onFocus: el => {
        const T = TRIALS.find(t => t.id === el?.dataset.id);
        if (!T) { this.fill(`<div class="mx-kick"><span>The Thornyard</span></div><h3>The Trial Stone</h3><div class="mx-lore">Each trial teaches one thing and passes the moment it is done. A fall here costs nothing, and the yard's foes leave nothing. A first pass pays Glimmer and Moonpetals; a pass unhurt, three petals more.</div>`); return; }
        const r = d.trials?.[T.id], lock = trialLock(T, d), [gl, pt] = TRIAL_PAY[T.g];
        this.fill(`<div class="mx-kick"><span>${esc(TRIAL_GROUPS[T.g])}</span><span>${r?.n ? `passed ×${r.n}` : 'not yet passed'}</span></div>
          <h3>${esc(T.name)}</h3><div class="sub">${esc(T.goal)}</div><div class="mx-lore">${esc(T.teach)}</div>
          ${sec('The keys')}${T.keys.map(([a, what]) => `<div class="mx-fx plain"><span>${esc(what)}</span><span class="v">${glyph(G, a)}</span></div>`).join('')}
          ${sec('Record')}<div class="mx-fx ${r?.n ? 'set' : 'off'}"><span>Passed</span><span class="v">${r?.n ? `×${r.n} · best ${r.best.toFixed(1)}s` : 'not yet'}</span></div><div class="mx-fx ${r?.unhurt ? 'set' : 'off'}"><span>Unhurt</span><span class="v">${r?.unhurt ? 'yes' : 'not yet'}</span></div>
          ${sec('First pass')}<div class="mx-fx ${r?.n ? 'off' : ''}"><span>${Math.round(gl * tier).toLocaleString()} Glimmer · ${pt} Moonpetals</span><span class="v">${r?.n ? 'taken' : ''}</span></div><div class="mx-fx ${r?.unhurt ? 'off' : ''}"><span>Unhurt: 3 Moonpetals more</span><span class="v">${r?.unhurt ? 'taken' : ''}</span></div>
          ${lock ? `<div class="mx-note" style="color:var(--mx-red)">${esc(lock)}</div>` : ''}`);
      } };
  },
  charms() {
    const G = this.G, d = G.save.data, worn = d.equipped;
    const rows = d.charms.map(id => { const c = CHARMS[id], on = worn.includes(id); return row({ act: 'charm', icon: 'charms', color: c.color, title: c.name, tag: on ? 'Worn' : '', extra: `data-id="${id}"`, desc: c.desc }); }).join('');
    const body = panel(list(rows), 'lst', ['Charms', `${worn.length} of ${CHARM_SLOTS} worn`]) + panel('<div class="mx-detail gdetail live"></div>', 'det');
    return { ctx: 'veil', html: this.frame({ title: 'Charms', crumb: `${d.charms.length} of ${Object.keys(CHARMS).length} found`, layout: 'browse', body, hints: [['confirm', 'Wear or take off'], ['back', 'Back', 'back']] }),
      onFocus: el => { const c = CHARMS[el?.dataset.id]; if (!c) return; const on = worn.includes(el.dataset.id); this.fill(`<div class="mx-kick"><span>Charm</span><span>${on ? 'worn' : ''}</span></div><h3 style="color:${c.color}">${esc(c.name)}</h3><div class="mx-lore">${esc(c.desc)}</div><div class="mx-note">Charms lie hidden in the missions, and every gatekeeper and warlord guards one. Up to ${CHARM_SLOTS} can be worn at once.</div>`); } };
  },
};
