// Full-screen menus: title, pause, the Moonwell (level up, travel, charms), Gear, the Fae Crossroads map overlay,
// controls, movesets, the Journal, settings and the cleared / ending screens. They follow Nioh's look (menuui.js):
// a header plaque, gold-lit lists, a bar of key hints, pages switched with Q / E (LB / RB).
// Mouse, keyboard (arrows + Enter/Esc) and gamepad (d-pad + A/B) all work.
import { derive, ATK, WEAPONS } from './player.js';
import { FORMS, KIT } from './movesets.js';
import { levelCost, forgeCost, FORGE, SETTINGS_DEFAULT } from './save.js';
import { CHARMS, CHARM_SLOTS } from './charms.js';
import { roman } from './overworld.js';
import { RANGED } from './ranged.js';
import { RARITY, SLOTS, SLOT_NAME, SETS, fxText, itemName, weaponMul, armorDef, defReduce, dismantleValue, reforgeCost, soulMatchCost } from './gear.js';
import { TIER, DEED_GLIMMER } from './deeds.js';
import { PACK } from './loot.js';
import { CORES, CORE_MAX } from './cores.js';
import { SIDES, sidesOf } from './sides.js';
import { wayName, wayDesc, wayLvl } from './ways.js';
import { themeOf, depthScale } from './underbriar.js';
import { TREE, xpFor, pointsAt, treeCost, canLearn, treeFor, SKILL_KITS, MECH_MASTERY } from './skills.js';
import { esc, glyph, head, keybar, entries, infoBox, option, inkWash, padDiagram } from './menuui.js';
import { PATRONS, PATRON_ORDER, shiftText } from './patrons.js';
import { OMENS, phaseOf } from './moontonight.js';
import { PAD_LABEL, PS_LABEL } from './input.js';
import { gravePetals } from './graves.js';
import { MARKET_TABS, VIAL_MAX } from './market.js';
import { DYES, DYE_ORDER, LOOK_PARTS } from './wardrobe.js';

const STATS = [
  { k: 'vit', name: 'Vitality', desc: 'Maximum health' },
  { k: 'end', name: 'Endurance', desc: 'Maximum stamina' },
  { k: 'str', name: 'Strength', desc: 'Weapon damage' },
  { k: 'spi', name: 'Spirit', desc: 'Faelight gain and Fae Shift length' },
];

// Settings, page by page. A row is a list of choices (vals, names) or a range (min, max, step).
const pct = v => `${Math.round(v * 100)}%`;
const SETTINGS = [
  { name: 'Game', rows: [
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
  ] },
];

// Keyboard and mouse, grouped as the game plays.
const KB = [
  ['Moving', [['Move', 'W A S D'], ['Camera', 'Mouse'], ['Dodge · hold to sprint', 'Space'], ['Slide (at a sprint)', 'Z', 'Shift'], ['Wingleap (from a slide)', 'Space'], ['Glide (while falling)', 'hold Space'], ['Interact', 'E']]],
  ['Fighting', [['Strike', 'LMB'], ['Strike hard', 'RMB'], ['Guard · tap as a blow lands to Deflect', 'Shift'], ['Stance: High / Mid / Low', '1 2 3'], ['Stance up / down', 'C', 'X'], ['Thorn Counter', 'F'], ['Lock on', 'Q', 'MMB'], ['Switch target', 'Wheel', 'Tab'], ['Switch weapon', 'V']]],
  ['Faelight and tools', [['Fae Shift', 'G'], ['Soul Core skills', 'G+LMB', 'G+RMB'], ['Use Fae Art', 'T', 'Shift+R'], ['Change Fae Art', 'Y'], ['Aim the ranged weapon', 'Ctrl', 'L'], ['Fire (hold to draw a bow)', 'LMB'], ['Drink Moondew', 'R'], ['Pause', 'Esc']]],
  ['Menus', [['Choose', 'Enter'], ['Back', 'Esc'], ['Change page', 'Q', 'E'], ['The chosen item\'s other actions', 'F', 'R']]],
];
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
];

const CPAGES = ['Keyboard & Mouse', 'Gamepad', 'Techniques', 'How it plays'];

const hex = n => '#' + n.toString(16).padStart(6, '0');
const col = r => hex(RARITY[r].color);
const SLOT_ICON = { head: '⛑', body: '⛨', hands: '✋', legs: '⛓' };
const kbKeys = (...ks) => ks.map(k => k.split('+').map(x => `<kbd class="k kb">${esc(x)}</kbd>`).join(' + ')).join(' <i>or</i> ');

export class Menu {
  constructor(G) {
    this.G = G;
    this.el = document.getElementById('menu');
    this.stack = [];
    this.focus = 0;
    this.el.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      // On the map, a click anywhere else picks the landmark under the pointer.
      if (!b && this.top?.screen === 'map' && !e.target.closest('.panel')) { this.G.overworld.pick(e.clientX, e.clientY); return; }
      if (!b || b.disabled) return;
      this.G.audio.init();
      this.G.audio.sfx('uiOk');
      this.run(b.dataset.act, b, +(e.target.closest('[data-dir]')?.dataset.dir || 1));
    });
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
  // Light the chosen row; screens that show more of it (Gear's detail, a setting's description) hear of it.
  paint(scroll = false) {
    const list = this.items();
    if (this.top) this.top.focus = this.focus;
    list.forEach((b, i) => { b.classList.toggle('focus', i === this.focus); if (scroll && i === this.focus) b.scrollIntoView?.({ block: 'nearest' }); });
    this.onFocus?.(list[this.focus]);
  }

  show(screen, data) { this.stack = [{ screen, data }]; this.G.hud?.clearOverlays(); this.render(); }
  push(screen, data) { this.stack.push({ screen, data }); this.render(); }
  pop() { this.stack.pop(); if (this.stack.length) this.render(); else this.close(); }
  close() { this.stack = []; this.el.className = ''; this.el.innerHTML = ''; this.onFocus = null; this.lastTop = null; this.G.overworld?.setActive(false); this.G.onMenuClosed?.(); }

  // Keyboard / gamepad navigation.
  nav(inp) {
    if (!this.open) return;
    // The map: directions travel between landmarks, confirm sets out, back returns (unless the map is all there is).
    if (this.top.screen === 'map') {
      const O = this.G.overworld;
      if (!O.entering) for (const d of ['left', 'right', 'up', 'down']) if (inp.hit(d)) O.step(d);
      if (inp.hit('confirm')) this.el.querySelector('.owpanel [data-act=setout]:not([disabled])')?.click();
      if (inp.hit('mAlt') && !O.entering) this.el.querySelector('.owpanel [data-act=sides]:not([disabled])')?.click();
      if (inp.hit('mAlt2') && !O.entering) this.el.querySelector('.owpanel [data-act=underbriar]')?.click();
      if (inp.hit('back') && ['shrine', 'title'].includes(this.top.data?.from) && !O.entering) { this.G.audio.sfx('ui'); this.pop(); }
      return;
    }
    // The key bar: change page (Q / E, LB / RB) and the chosen item's other actions (F / R, Y / X).
    for (const [a, dir] of [['mPrev', -1], ['mNext', 1], ['mAlt', 1], ['mAlt2', 1]]) {
      if (!inp.hit(a)) continue;
      const k = this.el.querySelector(`.nkeys [data-key~=${a}][data-act]:not([disabled])`);
      if (k) { this.G.audio.sfx('uiOk'); this.run(k.dataset.act, k, dir); return; }
    }
    const list = this.items();
    if (list.length <= 1) {   // a page of reading: up and down scroll it
      const panel = [...this.el.querySelectorAll('.map,.spanel,.panel')].find(e => e.scrollHeight > e.clientHeight + 2);
      if (panel && inp.hit('up')) panel.scrollBy({ top: -120, behavior: 'smooth' });
      if (panel && inp.hit('down')) panel.scrollBy({ top: 120, behavior: 'smooth' });
    } else {
      if (inp.hit('up')) { this.focus = (this.focus - 1 + list.length) % list.length; this.paint(true); this.G.audio.sfx('ui'); }
      if (inp.hit('down')) { this.focus = (this.focus + 1) % list.length; this.paint(true); this.G.audio.sfx('ui'); }
    }
    const cur = list[this.focus];
    // Left and right: change a setting, or else turn the page.
    for (const [d, dir] of [['left', -1], ['right', 1]]) {
      if (!inp.hit(d)) continue;
      if (['opt', 'lookOpt'].includes(cur?.dataset.act)) { this.G.audio.sfx('ui'); this.run(cur.dataset.act, cur, dir); return; }
      const k = this.el.querySelector(`.nkeys [data-key~=${dir < 0 ? 'mPrev' : 'mNext'}][data-act]`);
      if (k) { this.G.audio.sfx('ui'); this.run(k.dataset.act, k, dir); return; }
    }
    if (inp.hit('confirm') && cur) { cur.click(); }
    const fixed = ['title', 'ending', 'cleared', 'sidecleared'].includes(this.top?.screen);
    if (inp.hit('back') && !fixed) {
      this.G.audio.sfx('ui');
      if (this.top.screen === 'shrine') this.run('leave'); else this.pop();
    }
  }

  run(act, b, dir = 1) {
    const G = this.G, d = G.save.data;
    // Acts from the key bar work on the chosen row.
    const uidOf = () => +(b?.dataset.uid || this.cur()?.dataset.uid || 0);
    switch (act) {
      case 'new': if (G.save.exists) this.push('confirm'); else G.newGame(); break;
      case 'newYes': G.newGame(); break;
      case 'continue': G.continueGame(); break;
      case 'library': location.href = 'library.html'; break;
      case 'controls': this.push('controls', { page: G.input.usingPad ? 1 : 0 }); break;
      case 'settings': this.push('settings', { page: 0 }); break;
      case 'back': this.pop(); break;
      case 'resume': this.close(); break;
      case 'quit': G.quitToTitle(); break;
      case 'levelup': this.push('levelup', this.top.data); break;
      case 'level': G.levelUp(b.dataset.stat); this.render(); break;
      case 'travelTo': this.push('travel', this.top.data); break;
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
      case 'charms': this.push('charms'); break;
      case 'patrons': this.push('patrons'); break;
      case 'pledge': {
        const id = b?.dataset.id || this.cur()?.dataset.id;
        if (b?.dataset.locked || !G.setPatron(id)) { G.audio.sfx('ui'); G.hud.toast(`Fell the warlord of ${G.LEVELS[PATRONS[id]?.from]?.name || 'its mission'} to free this spirit`); }
        else G.hud.toast(`${PATRONS[id].name} is pledged to you`, 'anima');
        this.render(); break;
      }
      case 'journal': this.push('journal'); break;
      case 'graveFight': this.close(); G.challengeGrave(+b.dataset.i); break;
      case 'market': this.push('market', { tab: 'gear' }); break;
      case 'mTab': { const i = MARKET_TABS.findIndex(t => t.id === this.top.data.tab); this.top.data.tab = MARKET_TABS[(i + dir + MARKET_TABS.length) % MARKET_TABS.length].id; this.top.focus = 0; this.top.scrolls = null; this.render(); break; }
      case 'buy': { const key = b?.dataset.key || this.cur()?.dataset.key; if (!G.buy(this.top.data.tab, key)) G.audio.sfx('ui'); this.render(); break; }
      case 'wardrobe': this.push('wardrobe'); break;
      case 'lookOpt': this.setLookOpt(b.dataset.opt, dir); break;
      case 'lookReset': for (const P of LOOK_PARTS) G.setLook(P.k, null); this.render(); break;
      case 'deeds': this.push('deeds'); break;
      case 'moves': this.push('moves', { w: G.player.weapon }); break;
      case 'arsenal': this.push('arsenal', { forge: this.atWell() }); break;
      case 'wield': G.wieldWeapon(b.dataset.w); this.render(); break;
      case 'ready': G.readyRanged(b.dataset.r); this.render(); break;
      case 'forge': if (!G.forgeWeapon(b.dataset.w)) G.audio.sfx('ui'); this.render(); break;
      case 'movesW': this.top.data = { w: b.dataset.w }; this.render(); break;
      case 'movesCycle': { const a = G.player.arms, i = Math.max(0, a.indexOf(this.top.data.w)); this.top.data = { w: a[(i + dir + a.length) % a.length] }; this.top.focus = 0; this.render(); break; }
      case 'skills': this.push('skills', { w: G.player.weapon }); break;
      case 'skillsW': this.top.data = { w: b.dataset.w }; this.top.focus = 0; this.render(); break;
      case 'skillsCycle': { const a = [...G.player.arms, ...(G.player.rangedOwned || [])], i = Math.max(0, a.indexOf(this.top.data.w)); this.top.data = { w: a[(i + dir + a.length) % a.length] }; this.top.focus = 0; this.render(); break; }
      case 'learn': if (!G.learnSkill(b.dataset.w, b.dataset.id)) G.audio.sfx('ui'); this.render(); break;
      case 'gear': this.push('gear', { cat: 'w:' + G.player.weapon, forge: this.atWell() }); break;
      case 'gCat': { const cats = this.gearCats(), i = Math.max(0, cats.findIndex(c => c.id === this.top.data.cat)); this.top.data.cat = cats[(i + dir + cats.length) % cats.length].id; this.top.focus = 0; this.top.scrolls = null; this.render(); break; }
      case 'equipGear': { const u = uidOf(); if (u) G.equipGear(u); this.render(); break; }
      case 'dismantle': { const u = uidOf(), got = u ? G.dismantleGear([u]) : 0; if (got) G.hud.toast(`Dismantled for ${got} Glimmer`, 'item'); else G.audio.sfx('ui'); this.render(); break; }
      case 'smith': { const u = uidOf(); if (u && this.atWell()) this.push('smith', { uid: u }); else G.audio.sfx('ui'); break; }
      case 'setCore': { const c = b.dataset.core ?? this.cur()?.dataset.core; if (c) G.setCore(+b.dataset.slot, c); this.render(); break; }
      case 'coreOut': { const at = (d.coreSlots || []).indexOf(this.cur()?.dataset.core); if (at >= 0) G.setCore(at, null); else G.audio.sfx('ui'); this.render(); break; }
      case 'dismantleBelow': { const got = G.dismantleBelow(+b.dataset.rar); G.hud.toast(got ? `Dismantled for ${got.toLocaleString()} Glimmer` : 'Nothing to dismantle', 'item'); this.render(); break; }
      case 'reforge': if (!G.reforge(this.top.data.uid, +b.dataset.i)) G.audio.sfx('ui'); this.render(); break;
      case 'soulmatch': if (!G.soulMatch(this.top.data.uid, +b.dataset.from)) G.audio.sfx('ui'); this.render(); break;
      case 'letter': this.push('letter', { m: b.dataset.m, id: b.dataset.id }); G.audio.sfx('page'); break;
      case 'charm': if (!G.equipCharm(b.dataset.id)) G.hud.toast('All three charm slots are worn'); this.render(); break;
      case 'opt': this.setOpt(b.dataset.opt, dir); break;
      case 'spage': case 'cpage': {
        const n = act === 'spage' ? SETTINGS.length : CPAGES.length;
        this.top.data.page = b?.dataset.to != null ? +b.dataset.to : ((this.top.data.page || 0) + dir + n) % n;
        this.top.focus = 0; this.top.scrolls = null; this.render(); break;
      }
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

  // Gear's categories, turned through with Q / E (LB / RB): each weapon carried or found, each armour slot, Soul Cores.
  // The Wardrobe: the next or last choice for one part of the look.
  setLookOpt(k, dir) {
    const G = this.G, d = G.save.data, vals = k === 'set' ? [null, ...(d.looks || ['errant']).filter(x => SETS[x])] : [null, ...DYE_ORDER.filter(x => (d.dyes || []).includes(x))];
    const i = Math.max(0, vals.indexOf(d.look?.[k] ?? null));
    G.setLook(k, vals[(i + dir + vals.length) % vals.length]);
    this.render();
  }
  gearCats() {
    const d = this.G.save.data, p = this.G.player;
    return [...d.arms.map(w => ({ id: 'w:' + w, name: p.weaponName(w), w })), ...SLOTS.map(s => ({ id: s, name: SLOT_NAME[s], slot: s })), { id: 'cores', name: 'Soul Cores' }];
  }

  // The chosen piece in full, set against what is worn now.
  gearDetail(el, C) {
    const G = this.G, d = G.save.data, g = d.gear, p = G.player, wn = id => p.weaponName(id);
    if (C.id === 'cores') {
      const slots = d.coreSlots || [null, null];
      const set = slots.map((id, i) => `<div class="gd-fx ${id ? 'set' : 'off'}"><span>Slot ${i + 1} · ${glyph(G, i ? 'core1' : 'core0')}</span><span class="v">${id ? esc(CORES[id].name) : 'empty'}</span></div>`).join('');
      const id = el?.dataset.core, K = CORES[id];
      if (!K) return `<div class="gd-sec">Set</div>${set}<div class="gd-note">Each core set lends a passive and a skill; skills cost Faelight.</div>`;
      const gr = Math.min(CORE_MAX, d.cores[id]);
      return `<div class="glv"><span>Soul Core</span><span>${gr > 1 ? `Fused +${gr - 1}` : ''}</span></div><h3 style="color:#c89aff">${esc(K.name)}</h3>
        <div class="grar">${esc(K.skillName)} · ${K.cost} Faelight</div>
        <div class="gd-note">${esc(K.desc)}.</div>
        <div class="gd-sec">Passive</div><div class="gd-fx"><span>${esc(fxText(K.fx[0], Math.round(K.fx[1] * (1 + (gr - 1) * .15))))}</span></div>
        <div class="gd-sec">Set</div>${set}
        <div class="gd-note">Found again, a core fuses into the one you hold and grows stronger (up to +${CORE_MAX - 1}).</div>`;
    }
    const st = p.gear || { def: 0, sets: {} };
    const harness = C.slot ? `<div class="gd-sec">Harness</div><div class="gd-fx"><span>Defence</span><span class="v">${st.def}</span></div><div class="gd-fx"><span>Blows land lighter by</span><span class="v">${Math.round(defReduce(st.def) * 100)}%</span></div>` : '';
    const it = g.items.find(x => x.uid === +(el?.dataset.uid || 0));
    if (!it) return harness || '<div class="gd-note">Foes drop weapons of every kind you carry; better ones from elites and warlords.</div>';
    return `${this.itemDetail(it)}${harness}
      <div class="gd-note">Dismantles for ${dismantleValue(it).toLocaleString()} Glimmer.${this.atWell() ? '' : ' Reforge or soul-match it at a Moonwell.'}</div>`;
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
    return `<div class="glv"><span>${esc(isW ? wn(it.type) : SLOT_NAME[it.slot])}</span><span>Lv ${it.lvl}</span></div>
      <h3 style="color:${col(it.rar)}">${esc(itemName(it, wn))}</h3>
      <div class="grar">${RARITY[it.rar].name}${S ? ` · ${esc(S.name)} set` : ''}${it.uid && worn.has(it.uid) ? ' · equipped' : ''}</div>
      <div class="gd-cmp"><span>${isW ? 'Damage' : 'Defence'}</span><span>${eq && eq !== it ? `<span class="was">${fmt(was)}</span> → ` : ''}<span class="now">${fmt(val)}</span> ${cmp}</span></div>
      <div class="gd-sec">Special Effects</div>
      ${it.fx.length ? it.fx.map(([id, v]) => `<div class="gd-fx"><span>${esc(fxText(id, v))}</span></div>`).join('') : '<div class="gd-fx off"><span>None: a Common piece carries no effects.</span></div>'}
      ${S ? `<div class="gd-sec">${esc(S.name)} set · ${n} of 4 worn</div><div class="gd-fx set ${n >= 2 ? '' : 'off'}"><span>Two: ${esc(S.two)}</span></div><div class="gd-fx set ${n >= 4 ? '' : 'off'}"><span>Four: ${esc(S.four)}</span></div>` : ''}
      ${eq && eq !== it ? `<div class="gd-sec">Worn now: ${esc(itemName(eq, wn))}</div>${eq.fx.length ? eq.fx.map(([id, v]) => `<div class="gd-fx off"><span>${esc(fxText(id, v))}</span></div>`).join('') : '<div class="gd-fx off"><span>No effects</span></div>'}` : ''}`;
  }

  render() {
    const { screen, data } = this.top, G = this.G;
    // Keep each screen's scroll, so a change made far down a list doesn't jump back to its top.
    const scrollers = () => [...this.el.querySelectorAll('.map,.gitems,.nlist,.spanel')];
    if (this.lastTop) this.lastTop.scrolls = scrollers().map(e => e.scrollTop);
    this.onFocus = null;
    let cls = screen, h = '';
    const art = `<div class="nart" style="background-image:url(${inkWash()})"></div>`;
    const back = ['back', 'Back', 'back'];
    if (screen === 'title') {
      const has = G.save.exists, off = !G.ready;
      cls = 'title nioh';
      const ph = G.settings.realMoon !== false && phaseOf();
      h = `<h1 class="ntitle">PIXIELORDS</h1><div class="ntag">A fae knight · a warren of rot · a lord upon the throne</div>
        ${ph ? `<div class="ntonight"><i class="mphase" style="--lit:${ph.lit.toFixed(2)};--wax:${ph.frac < .5 ? 1 : -1}"></i>Tonight: ${esc(ph.name)} · ${esc(ph.desc)}</div>` : ''}
        ${G.ready ? '' : `<div class="loading tl"><i style="transform:scaleX(${G.loadProgress || 0})"></i><span>Summoning the warren… ${Math.round((G.loadProgress || 0) * 100)}%</span></div>`}
        <div class="nlist">${entries([
          has && ['continue', 'Continue', 'Resume', G.save.summary(G.LEVELS), '', off],
          has && G.save.data.unlocked.length > 1 && ['map', 'The Crossroads', 'Journey', 'Choose where the path leads.', '', off],
          ['new', 'New Game', 'Begin', has ? 'Begin again, from the Grubhold\'s gate.' : 'A fae knight wakes beneath a fading moon.', '', off],
          ['controls', 'Controls', 'How to play', 'Keyboard and mouse, the gamepad, and the ways of the fight.'],
          ['settings', 'Settings', 'Options', 'Camera, reading, sound and display.'],
          ['library', 'Asset Library', 'Gallery', 'Every model and animation in the game, to look at.'],
        ])}</div>
        <div class="nfoot">${G.touchOnly ? 'PixieLords needs a keyboard and mouse, or a gamepad.' : 'Made for keyboard and mouse · a gamepad works too · best with headphones'}</div>
        ${keybar(G, [['confirm', 'Select']])}`;
    } else if (screen === 'confirm') {
      h = `<div class="panel"><h2>Begin anew?</h2><p>Your current journey will be forgotten.</p>
        <div class="btns"><button class="btn" data-act="newYes">Begin a new journey</button><button class="btn" data-act="back">Keep my journey</button></div></div>
        ${keybar(G, [['confirm', 'Select'], back])}`;
    } else if (screen === 'pause') {
      const sv = G.save, L = G.level, side = G.sideDef();
      cls = 'pause nioh';
      h = `${art}${head('Paused', side ? side.name : L.depth ? `The Underbriar · Depth ${L.depth}` : L.name)}
        <div class="nlist">${entries([
          ['resume', 'Return', 'Resume', 'Back to the fight.'],
          ['gear', 'Harness', 'Equipment', 'Weapons, armour and Soul Cores found.'],
          ['arsenal', 'Armoury', 'Arsenal', 'Choose the two weapons you carry, and the ranged one.'],
          ['wardrobe', 'Attire', 'Wardrobe', 'How your harness looks, and its dyes.'],
          ['skills', 'Mastery', 'Skills', 'Spend what each weapon has taught you.'],
          ['moves', 'Forms', 'Movesets', 'Each weapon\'s stances, combos and finishers.'],
          ['journal', 'Chronicle', 'Journal', `${sv.data.letters.length} letters read · ${sv.data.pixies.length} Lost Pixies freed.`],
          ['deeds', 'Renown', 'Deeds', 'Long goals kept across every mission, Way and depth.'],
          ['controls', 'Teachings', 'Controls', 'Keys, the gamepad, and the ways of the fight.'],
          ['settings', 'Customs', 'Settings', 'Camera, reading, sound and display.'],
          side && ['abandon', 'Forsake', 'Abandon side mission', `${side.name}: a side run keeps its own Moonwells. Abandon it to return to the mission itself.`],
          L.depth && ['leaveAbyss', 'Resurface', 'Leave the Underbriar', 'Climb back up to the Fae Crossroads.'],
          ['quit', 'Withdraw', 'Quit to title', 'Progress is saved each time you rest at a Moonwell or vanquish a warlord.'],
        ])}</div>
        ${infoBox([['Level', sv.level], ['Glimmer', sv.glimmer.toLocaleString()], ['Moonpetals', (sv.data.petals || 0).toLocaleString()], ['Moondew', `${G.player.elixirs ?? sv.elixirMax} / ${sv.elixirMax}`], ['Way', wayName(sv.data.ng)], G.tonight && ['Tonight', G.tonight.phase.name + (G.tonight.omen ? ' · ' + G.tonight.omen.name : '')]])}
        ${keybar(G, [['confirm', 'Select'], ['back', 'Back', 'resume']])}`;
    } else if (screen === 'shrine') {
      const sv = G.save, d = sv.data, p = G.player, cost = levelCost(sv.level);
      const other = Object.values(G.level.shrines).filter(s => s.id !== data.id && sv.m.kindled.includes(s.id));
      const deeds = G.deedsView(), earned = deeds.reduce((a, r) => a + r.tier, 0);
      cls = 'shrine nioh';
      h = `${art}${head(data.name, 'Moonwell')}
        <div class="nlist">${entries([
          ['levelup', 'Kindle', 'Level up', sv.glimmer >= cost ? `Spend ${cost.toLocaleString()} Glimmer to grow stronger.` : `The next level needs ${cost.toLocaleString()} Glimmer.`],
          ['travelTo', 'Wayfaring', 'Travel', other.length ? `To another Moonwell kindled here: ${other.map(s => s.name).join(', ')}.` : 'No other Moonwell here is kindled yet.', '', !other.length],
          ['gear', 'Harness', 'Equipment', 'Weapons, armour and Soul Cores. Reforge and soul-match here.'],
          ['arsenal', 'Armoury', 'Arsenal', 'Choose two weapons, and forge them stronger.'],
          ['skills', 'Mastery', 'Skills', 'Spend what each weapon has taught you.'],
          ['patrons', 'Patronage', 'Patron Spirit', `${PATRONS[d.patron || 'lantern'].name} is pledged to you · ${(d.patrons || ['lantern']).length} of ${PATRON_ORDER.length} freed.`],
          d.charms.length && ['charms', 'Trinkets', 'Charms', `${d.equipped.length} of ${CHARM_SLOTS} worn.`],
          ['market', 'Pedlar', 'Hidden Market', `${(d.petals || 0).toLocaleString()} Moonpetals · new wares every night.`],
          ['wardrobe', 'Attire', 'Wardrobe', 'How your harness looks, and its dyes.'],
          ['moves', 'Forms', 'Movesets', 'Each weapon\'s stances, combos and finishers.'],
          ['journal', 'Chronicle', 'Journal', `${d.letters.length} letters · ${d.pixies.length} Lost Pixies freed.`],
          ['deeds', 'Renown', 'Deeds', `${earned} of ${deeds.length * 3} tiers earned.`],
          d.unlocked.length > 1 && ['journey', 'Crossroads', 'Journey elsewhere', 'Walk the Fae Crossroads to another mission.'],
          ['leave', 'Rise', 'Leave', 'Resting mends you, refills your Moondew, and calls every fallen foe back.'],
        ])}</div>
        ${infoBox([['Level', sv.level], ['Glimmer', sv.glimmer.toLocaleString()], ['Next level', cost.toLocaleString()], ['Moonpetals', (d.petals || 0).toLocaleString()], ['Health · Stamina', `${p.maxHp} · ${p.maxKi}`], ['Moondew', sv.elixirMax]])}
        ${keybar(G, [['confirm', 'Select'], ['back', 'Rise', 'leave']])}`;
    } else if (screen === 'levelup') {
      const sv = G.save, p = G.player, lvl = sv.level, cost = levelCost(lvl), afford = sv.glimmer >= cost, cur = derive(sv.stats);
      const rows = STATS.map(st => {
        const dd = derive({ ...sv.stats, [st.k]: sv.stats[st.k] + 1 });
        const gain = st.k === 'vit' ? `+${dd.maxHp - cur.maxHp} health` : st.k === 'end' ? `+${dd.maxKi - cur.maxKi} stamina` : st.k === 'str' ? `+${Math.round((dd.dmgMul - cur.dmgMul) * 100)}% damage` : `+${Math.round((dd.animaGain - cur.animaGain) * 100)}% Faelight, +1 s Shift`;
        return `<button class="btn lrow" data-act="level" data-stat="${st.k}" ${afford ? '' : 'disabled'}><span class="ln"><b>${st.name}</b><small>${st.desc}</small></span><span class="lval">${sv.stats[st.k]} <i>›</i> ${sv.stats[st.k] + 1}</span><span class="lgain">${gain}</span></button>`;
      }).join('');
      cls = 'levelup sheet';
      h = `${head('Kindle', 'Level up')}
        <div class="spanel lvl">
          <div class="lvtop"><div><small>Level</small><b>${lvl} <i>›</i> ${lvl + 1}</b></div><div><small>Glimmer</small><b class="gold">${sv.glimmer.toLocaleString()}</b></div><div><small>Required</small><b class="${afford ? '' : 'short'}">${cost.toLocaleString()}</b></div></div>
          ${rows}
          <div class="lvder">Health <b>${p.maxHp}</b> · Stamina <b>${p.maxKi}</b> · Damage <b>×${p.dmgMul.toFixed(2)}</b> · Moondew <b>${sv.elixirMax}</b></div>
          <div class="sdesc">${afford ? 'Each level raises one attribute by one.' : `${(cost - sv.glimmer).toLocaleString()} more Glimmer is needed. Fell foes, and don't fall with it on you.`}</div>
        </div>
        ${keybar(G, [['confirm', 'Raise'], back])}`;
    } else if (screen === 'travel') {
      const sv = G.save, list = Object.values(G.level.shrines).filter(s => sv.m.kindled.includes(s.id));
      cls = 'travel nioh';
      h = `${art}${head('Wayfaring', G.level.name)}
        <div class="nlist">${entries(list.map(s => s.id === data.id ? ['travel', s.name, 'You rest here', '', `data-shrine="${s.id}"`, true] : ['travel', s.name, 'Moonwell', `Travel to ${s.name}.`, `data-shrine="${s.id}"`]))}</div>
        ${keybar(G, [['confirm', 'Travel'], back])}`;
    } else if (screen === 'settings') {
      const pg = SETTINGS[data?.page || 0], s = G.settings;
      const rows = pg.rows.map(R => {
        const v = s[R.k];
        if (R.vals) { const i = Math.max(0, R.vals.findIndex(x => x == v)); return option(R.k, R.label, R.names[i], i, R.vals.length, R.desc); }
        const n = Math.round((R.max - R.min) / R.step) + 1, i = Math.round(((+v || 0) - R.min) / R.step);
        return option(R.k, R.label, R.fmt(+v || 0), i, n, R.desc);
      }).join('');
      cls = 'settings sheet';
      h = `${head('Settings', pg.name)}
        <button class="pgarr l" data-act="spage" data-dir="-1">‹</button>
        <div class="spanel">
          <div class="stabs">${SETTINGS.map((P, i) => `<span class="${P === pg ? 'on' : ''}" data-act="spage" data-to="${i}">${esc(P.name)}</span>`).join('')}</div>
          ${rows}
          <div class="sdesc"></div>
          <div class="spages">${SETTINGS.map(P => `<i class="${P === pg ? 'on' : ''}"></i>`).join('')}</div>
        </div>
        <button class="pgarr r" data-act="spage" data-dir="1">›</button>
        ${keybar(G, [[['mPrev', 'mNext'], 'Page', 'spage'], ['mAlt', 'Revert to defaults', 'revert'], ['confirm', 'Change'], back])}`;
      this.onFocus = el => { const q = this.el.querySelector('.sdesc'); if (q) q.textContent = el?.dataset.desc || ''; };
    } else if (screen === 'controls') {
      const page = data?.page || 0, P = G.input.padPS ? PS_LABEL : PAD_LABEL;
      let body;
      if (page === 0) body = `<div class="kbgrid">${KB.map(([grp, rows]) => `<h4>${esc(grp)}</h4>${rows.map(([n, ...ks]) => `<div class="kbrow"><span>${esc(n)}</span><span>${kbKeys(...ks)}</span></div>`).join('')}`).join('')}</div>`;
      else if (page === 1) body = padDiagram(G.input.padPS);
      else if (page === 2) body = `<table class="ctl tech"><tr><th></th><th>Keyboard + mouse</th><th>Gamepad</th></tr>${TECH.map(([n, k, pf]) => `<tr><td>${esc(n)}</td><td>${esc(k)}</td><td>${esc(pf(P))}</td></tr>`).join('')}</table>`;
      else body = `<div class="tips">${TIPS.map(([b, t]) => `<p><b>${esc(b)}</b>: ${esc(t)}</p>`).join('')}</div>`;
      cls = 'controls sheet';
      h = `${head('Controls', CPAGES[page])}
        <button class="pgarr l" data-act="cpage" data-dir="-1">‹</button>
        <div class="spanel">
          <div class="stabs">${CPAGES.map((n, i) => `<span class="${i === page ? 'on' : ''}" data-act="cpage" data-to="${i}">${esc(n)}</span>`).join('')}</div>
          ${body}
          <div class="spages">${CPAGES.map((n, i) => `<i class="${i === page ? 'on' : ''}"></i>`).join('')}</div>
        </div>
        <button class="pgarr r" data-act="cpage" data-dir="1">›</button>
        ${keybar(G, [[['mPrev', 'mNext'], 'Page', 'cpage'], back])}`;
    } else if (screen === 'gear') {
      const d = G.save.data, g = d.gear, p = G.player, wn = id => p.weaponName(id), worn = new Set([...Object.values(g.equip.weapons), ...Object.values(g.equip.armor)]);
      // Older callers name a tab and a slot or weapon.
      if (data.tab) { data.cat = data.tab === 'cores' ? 'cores' : data.tab === 'weapons' ? 'w:' + (data.w || p.weapon) : (data.slot || 'body'); delete data.tab; }
      const cats = this.gearCats(), C = cats.find(c => c.id === data.cat) || cats[0];
      data.cat = C.id;
      const sort = (a, b) => (worn.has(b.uid) - worn.has(a.uid)) || (b.lvl * 10 + b.rar) - (a.lvl * 10 + a.rar);
      let list;
      if (C.id === 'cores') {
        const slots = d.coreSlots || [null, null], owned = Object.keys(d.cores || {}).filter(id => CORES[id]).sort((a, b) => (slots.includes(b) - slots.includes(a)) || CORES[a].name.localeCompare(CORES[b].name));
        list = owned.map(id => {
          const at = slots.indexOf(id), gr = Math.min(CORE_MAX, d.cores[id]);
          return `<button class="btn gi" data-act="setCore" data-slot="0" data-core="${id}"><span class="ic" style="color:#c89aff">◈</span><span style="color:#c89aff">${esc(CORES[id].name)}${gr > 1 ? ` +${gr - 1}` : ''}${at >= 0 ? `<span class="eq">SLOT ${at + 1}</span>` : ''}</span><span class="gl">${CORES[id].cost} FL</span></button>`;
        }).join('') || '<p class="dim gnone">No Soul Cores yet. Foes leave them sometimes, elites often, and every gatekeeper and warlord always.</p>';
      } else {
        list = g.items.filter(it => (C.w ? it.type === C.w : it.slot === C.slot)).sort(sort).map(it =>
          `<button class="btn gi" data-act="equipGear" data-uid="${it.uid}"><span class="ic">${C.w ? '⚔' : SLOT_ICON[C.slot]}</span><span style="color:${col(it.rar)}">${esc(itemName(it, wn))}${worn.has(it.uid) ? '<span class="eq">E</span>' : ''}</span><span class="gl">Lv ${it.lvl}</span></button>`).join('')
          || `<p class="dim gnone">${C.w ? `No ${esc(wn(C.w))} of any rarity yet: the one you carry hits at ×1.00. Foes drop better ones.` : 'Nothing for this slot yet.'}</p>`;
      }
      cls = 'gear';
      h = `${head('Equipment', `Pack ${g.items.length} / ${PACK}${data.forge ? ' · at the Moonwell' : ''}`)}
        <div class="gwrap">
          <div class="glist">
            <div class="gcat"><span class="arr" data-act="gCat" data-dir="-1">‹ ${glyph(G, 'mPrev')}</span><span>${esc(C.name)}</span><span class="arr" data-act="gCat" data-dir="1">${glyph(G, 'mNext')} ›</span></div>
            <div class="gtabs">${cats.map(c => `<i class="${c === C ? 'on' : ''}" title="${esc(c.name)}"></i>`).join('')}</div>
            <div class="gitems">${list}</div>
            ${C.id === 'cores' ? '' : '<div class="gfoot"><button class="btn small" data-act="dismantleBelow" data-rar="0">Dismantle all Common</button><button class="btn small" data-act="dismantleBelow" data-rar="1">…and all Fine</button></div>'}
          </div>
          <div class="gdetail"></div>
        </div>
        ${keybar(G, C.id === 'cores'
          ? [[['mPrev', 'mNext'], 'Category', 'gCat'], ['confirm', 'Set in slot 1'], ['mAlt', 'Set in slot 2', 'setCore', 'data-slot="1"'], ['mAlt2', 'Take out', 'coreOut'], back]
          : [[['mPrev', 'mNext'], 'Category', 'gCat'], ['confirm', 'Equip'], ['mAlt', 'Dismantle', 'dismantle'], data.forge && ['mAlt2', 'Forge', 'smith'], back])}`;
      this.onFocus = el => { const box = this.el.querySelector('.gdetail'); if (box) box.innerHTML = this.gearDetail(el, C); };
    } else if (screen === 'patrons') {
      // Patron Spirits (patrons.js): the one pledged, and the rest, freed or still held by their warlords.
      const d = G.save.data, have = d.patrons || ['lantern'], cur = d.patron || 'lantern';
      const list = PATRON_ORDER.map(id => {
        const P = PATRONS[id];
        return have.includes(id)
          ? `<button class="btn gi" data-act="pledge" data-id="${id}"><span class="ic" style="color:${P.css}">✦</span><span style="color:${P.css}">${esc(P.name)}${id === cur ? '<span class="eq">PLEDGED</span>' : ''}</span><span class="gl">${esc(P.title)}</span></button>`
          : `<button class="btn gi" data-act="pledge" data-id="${id}" data-locked="1"><span class="ic dim">?</span><span class="dim">A spirit held captive</span><span class="gl dim">${roman(G.ORDER.indexOf(P.from) + 1)}</span></button>`;
      }).join('');
      cls = 'gear patrons';
      h = `${head('Patronage', `${have.length} of ${PATRON_ORDER.length} freed · ${PATRONS[cur].name} pledged`)}
        <div class="gwrap"><div class="glist"><div class="gcat"><span></span><span>Patron Spirits</span><span></span></div><div class="gitems">${list}</div></div><div class="gdetail"></div></div>
        ${keybar(G, [['confirm', 'Pledge'], back])}`;
      this.onFocus = el => {
        const box = this.el.querySelector('.gdetail'), id = el?.dataset.id, P = PATRONS[id];
        if (!box || !P) return;
        if (el.dataset.locked) { box.innerHTML = `<div class="glv"><span>Patron Spirit</span><span></span></div><h3 class="dim">A spirit held captive</h3><div class="gd-note">The warlord of ${esc(G.LEVELS[P.from]?.name || '')} holds it. Fell the warlord to set it free.</div>`; return; }
        box.innerHTML = `<div class="glv"><span>Patron Spirit</span><span>${id === cur ? 'pledged' : ''}</span></div><h3 style="color:${P.css}">${esc(P.name)}</h3><div class="grar">${esc(P.title)}</div>
          <div class="gd-sec">While pledged</div>${P.fx.map(([k, v]) => `<div class="gd-fx"><span>${esc(fxText(k, v))}</span></div>`).join('')}
          <div class="gd-sec">In the Fae Shift</div>${shiftText(P).map(t => `<div class="gd-fx set"><span>${esc(t[0].toUpperCase() + t.slice(1))}</span></div>`).join('')}
          <div class="gd-fx set"><span>As it begins, a burst that throws back everything within ${P.shift.burst[1]} paces</span></div>
          <div class="gd-note">${esc(P.lore)}</div>`;
      };
    } else if (screen === 'market') {
      // The Hidden Market (market.js): tonight's wares by tab, bought with Moonpetals.
      const d = G.save.data, W = G.market(), T = MARKET_TABS.find(t => t.id === data.tab) || MARKET_TABS[0], sold = d.market.sold, wn = id => G.player.weaponName(id);
      data.tab = T.id;
      const price = w => `<span class="gl ${(d.petals || 0) < w.price ? 'short' : ''}">✿ ${w.price}</span>`;
      const gone = w => (!w.repeat && sold.includes(w.key)) || w.owned || w.off;
      const tag = w => (w.owned ? '<span class="eq">OWNED</span>' : w.off ? '<span class="eq">FULL</span>' : !w.repeat && sold.includes(w.key) ? '<span class="eq">SOLD</span>' : '');
      const row = (w, ic, name, color) => `<button class="btn gi ${gone(w) ? 'sold' : ''}" data-act="buy" data-key="${esc(w.key)}"><span class="ic" style="color:${color}">${ic}</span><span style="color:${color}">${esc(name)}${tag(w)}</span>${price(w)}</button>`;
      const list = T.id === 'gear' ? W.gear.map(w => row(w, w.it.kind === 'weapon' ? '⚔' : SLOT_ICON[w.it.slot], itemName(w.it, wn), col(w.it.rar)))
        : T.id === 'prov' ? W.prov.map(w => row(w, { vial: '⚱', purse: '◉', core: '◈', lantern: '✧' }[w.kind], w.name, w.kind === 'core' ? '#c89aff' : '#efe3c6'))
        : W.dyes.map(w => row(w, `<i class="swatch" style="background:${hex(DYES[w.dye].hex)}"></i>`, w.name, '#efe3c6'));
      cls = 'gear market';
      h = `${head('Hidden Market', `✿ ${(d.petals || 0).toLocaleString()} Moonpetals · new wares every night at noon`)}
        <div class="gwrap">
          <div class="glist">
            <div class="gcat"><span class="arr" data-act="mTab" data-dir="-1">‹ ${glyph(G, 'mPrev')}</span><span>${esc(T.name)}</span><span class="arr" data-act="mTab" data-dir="1">${glyph(G, 'mNext')} ›</span></div>
            <div class="gtabs">${MARKET_TABS.map(t => `<i class="${t === T ? 'on' : ''}" title="${esc(t.name)}"></i>`).join('')}</div>
            <div class="gitems">${list.join('')}</div>
            <div class="gfoot petals">✿ ${(d.petals || 0).toLocaleString()} Moonpetals</div>
          </div>
          <div class="gdetail"></div>
        </div>
        ${keybar(G, [[['mPrev', 'mNext'], 'Wares', 'mTab'], ['confirm', 'Buy'], back])}`;
      this.onFocus = el => {
        const box = this.el.querySelector('.gdetail'), w = [...W.gear, ...W.prov, ...W.dyes].find(x => x.key === el?.dataset.key);
        if (!box || !w) return;
        const foot = `<div class="gd-sec">Price</div><div class="gd-fx"><span>✿ ${w.price} Moonpetals</span><span class="v">${(d.petals || 0) >= w.price ? `${d.petals - w.price} left after` : `${w.price - (d.petals || 0)} short`}</span></div>
          <div class="gd-note">${gone(w) ? (w.owned ? 'Already yours.' : w.off ? `Your Moondew is already at ${VIAL_MAX}.` : 'Sold. The pedlar has more tomorrow night.') : w.repeat ? 'The pedlar keeps plenty of these.' : 'One of these tonight.'} Moonpetals come from Revenants at their graves, Duels and other side missions, Deeds, and warlords.</div>`;
        if (w.it) { box.innerHTML = this.itemDetail(w.it) + foot; return; }
        if (w.kind === 'dye') {
          const D = DYES[w.dye];
          box.innerHTML = `<div class="glv"><span>Dye</span><span></span></div><h3>${esc(w.name)}</h3><div class="dyebig" style="background:${hex(D.hex)}"></div><div class="gd-note">For the Wardrobe: dye your plate, cloak, trim, wings or visor with it.</div>${foot}`;
          return;
        }
        const extra = w.kind === 'vial' ? `<div class="gd-fx"><span>Moondew</span><span class="v">${d.elixirMax} → ${Math.min(VIAL_MAX, d.elixirMax + 1)}</span></div>` : w.kind === 'purse' ? `<div class="gd-fx"><span>Glimmer</span><span class="v">${w.glimmer.toLocaleString()}</span></div>`
          : w.kind === 'core' ? `<div class="gd-fx"><span>Held</span><span class="v">+${Math.max(0, (d.cores[w.core] || 1) - 1)} → +${d.cores[w.core] || 1}</span></div>` : '';
        box.innerHTML = `<div class="glv"><span>Provisions</span><span></span></div><h3>${esc(w.name)}</h3><div class="gd-note">${esc(w.desc)}</div>${extra}${foot}`;
      };
    } else if (screen === 'wardrobe') {
      // The Wardrobe (wardrobe.js): a look from any set known, and dyes, set part by part.
      const d = G.save.data, L = d.look ||= {}, looks = (d.looks || ['errant']).filter(k => SETS[k]), dyes = DYE_ORDER.filter(k => (d.dyes || []).includes(k));
      const rows = LOOK_PARTS.map(P => {
        const vals = P.k === 'set' ? [null, ...looks] : [null, ...dyes], i = Math.max(0, vals.indexOf(L[P.k] ?? null)), v = vals[i];
        const name = P.k === 'set' ? (v ? SETS[v].name : 'As worn') : v ? DYES[v].name : 'Undyed';
        const sw = P.k === 'set' ? (v ? SETS[v].look : null) : v ? { one: DYES[v].hex } : null;
        const swh = sw ? (sw.one != null ? `<i class="swatch" style="background:${hex(sw.one)}"></i>` : `<i class="swatch" style="background:linear-gradient(90deg,${hex(sw.steel)} 0 33%,${hex(sw.cloth)} 33% 66%,${hex(sw.trim)} 66%)"></i>`) : '';
        return `<button class="btn opt" data-act="lookOpt" data-opt="${P.k}" data-desc="${esc(P.desc)}"><span class="olab">${esc(P.name)}</span><span class="oval"><em class="arr l" data-dir="-1">‹</em><b>${swh}${esc(name)}</b><span class="meter"><u style="width:${vals.length > 1 ? Math.round(i / (vals.length - 1) * 100) : 0}%"></u></span><em class="arr r" data-dir="1">›</em></span></button>`;
      }).join('');
      cls = 'wardrobe nioh';
      h = `${head('Wardrobe', `${looks.length} looks known · ${dyes.length} of ${DYE_ORDER.length} dyes`)}
        <div class="wpanel">${rows}<div class="sdesc"></div>
          <div class="gd-note">A look is learned from any piece of a set you carry. Dyes are sold in the Hidden Market at every Moonwell.</div></div>
        ${keybar(G, [['mAlt', 'Undo all', 'lookReset'], ['confirm', 'Change'], back])}`;
      this.onFocus = el => { const q = this.el.querySelector('.sdesc'); if (q) q.textContent = el?.dataset.desc || ''; };
    } else if (screen === 'grave') {
      // A Revenant Grave (graves.js): who fell here, how, and what laying them to rest would leave.
      const K = data.K, P = PATRONS[K.patron], S = SETS[K.set], wn = G.player.weaponName(K.weapon), carries = G.save.data.arms.includes(K.weapon);
      const petals = gravePetals(K, G.save.data.ng || 0, !!G.tonight?.omen);
      cls = 'grave nioh';
      h = `${art}${head('Bloodied Grave', G.level.name)}
        <div class="gravebox">
          <div class="gk">Revenant · Level ${K.lvl}</div><h2>${esc(K.name)}</h2><div class="gh">${esc(K.how)}</div>
          <div class="gr"><span>Weapon</span><b>${esc(wn)}</b></div>
          <div class="gr"><span>Harness</span><b>${esc(S.name)}</b></div>
          <div class="gr"><span>Patron Spirit</span><b style="color:${P.css}">${esc(P.name)}, ${esc(P.title)}</b></div>
          <div class="gr sp"><span>Spoils</span><b>${petals} Moonpetals · a piece of its harness${carries ? ` or its ${esc(wn)}` : ''}, Rare or finer · now and then its Soul Core</b></div>
        </div>
        <div class="nlist">${entries([
          ['graveFight', 'Challenge', 'Summon', 'Raise the Revenant and fight it here, alone.', `data-i="${data.i}"`],
          ['back', 'Leave it', 'Let it lie', 'Walk on. The grave will wait.'],
        ])}</div>
        ${keybar(G, [['confirm', 'Select'], back])}`;
    } else if (screen === 'cleared') {
      const sv = G.save, L = G.level, m = Math.floor(sv.time / 60), s = Math.floor(sv.time % 60);
      h = `<div class="panel ending"><div class="kicker">Mission complete</div><h1>${esc(L.name.toUpperCase())}</h1>
        <p>${esc(L.outro || '')}</p>
        <div class="lv"><div><small>Time</small><b>${m}:${String(s).padStart(2, '0')}</b></div><div><small>Deaths</small><b>${sv.deaths}</b></div><div><small>Level</small><b>${sv.level}</b></div><div><small>Glimmer</small><b class="gold">${sv.glimmer.toLocaleString()}</b></div></div>
        <div class="btns"><button class="btn" data-act="missions">Onward</button></div></div>
        ${keybar(G, [['confirm', 'Onward']])}`;
    } else if (screen === 'map') {
      // The overworld draws itself; this is its overlay: floating labels and the chosen mission's panel.
      const O = G.overworld, sv = G.save, d = sv.data, id = O.selected, L = G.LEVELS[id], i = G.ORDER.indexOf(id), st = O.status(id);
      const opening = O.revealing?.n.id === id, shown = st !== 'sealed' && (d.seen?.includes(id) || opening), m = d.missions[id] || { kindled: [], items: [] };
      const charms = (L.items || []).filter(it => it.kind === 'charm').map(it => it.id), trophies = [L.gate?.charm, L.bossCharm].filter(Boolean);
      const found = charms.filter(c => m.items.includes(c)).length + trophies.filter(c => d.charms.includes(c)).length;
      const prev = G.LEVELS[G.ORDER[i - 1]];
      const labels = O.nodes.map(n => {
        const s = O.status(n.id), vis = s !== 'sealed' && d.seen?.includes(n.id);
        const om = vis && OMENS[G.tonight?.omens[n.id]];
        return `<button class="owl ${vis ? s : 'sealed'} ${n.id === id ? 'sel' : ''}" data-act="node" data-id="${n.id}"><span class="n">${roman(n.i + 1)}</span>${vis ? esc(n.L.name) : 'Sealed'}${om ? `<span class="omen" style="color:${om.css}" title="${esc(om.name)}">☾</span>` : ''}</button>`;
      }).join('');
      const back = data?.from === 'shrine' ? '<button class="btn" data-act="back">Stay</button>' : data?.from === 'title' ? '<button class="btn" data-act="back">Back</button>' : '<button class="btn" data-act="title">Return to title</button>';
      const keys = G.input.usingPad ? 'D-pad or stick to travel · A to set out' + (data?.from === 'cleared' ? '' : ' · B to go back') : 'Arrows or WASD to travel · Enter to set out' + (data?.from === 'cleared' ? '' : ' · Esc to go back') + ' · or click a landmark';
      h = `<div class="owlabels">${labels}</div>
        <div class="panel owpanel">
          <div class="kicker">The Fae Crossroads · ${roman(i + 1)} · Lv ${L.level + wayLvl(d.ng)}+${d.ng ? ' · ' + esc(wayName(d.ng)) : ''}</div>
          <h2>${shown ? esc(L.name) : 'Sealed'}</h2>
          ${opening ? '<div class="kicker">A new path opens</div>' : ''}
          ${shown && OMENS[G.tonight?.omens[id]] ? `<div class="owomen" style="color:${OMENS[G.tonight.omens[id]].css}">☾ Tonight, a ${esc(OMENS[G.tonight.omens[id]].name)}: ${esc(OMENS[G.tonight.omens[id]].desc)}</div>` : ''}
          <p>${esc(shown ? L.blurb : prev ? `The path is not yet open. Clear ${prev.name} to find the way.` : 'The path is not yet open.')}</p>
          ${shown ? `<div class="owstats"><span class="mtag ${st}">${{ cleared: 'Cleared', inprogress: 'In progress', new: 'New' }[st]}</span><span>Moonwells ${m.kindled.length} / ${Object.keys(L.shrines).length}</span><span>Charms ${found} / ${charms.length + trophies.length}</span><span>Letters ${(L.letters || []).filter(l => d.letters.includes(id + ':' + l.id)).length} / ${(L.letters || []).length}</span><span>Pixies ${(L.pixies || []).filter(q => d.pixies.includes(id + ':' + q.id)).length} / ${(L.pixies || []).length}</span></div>` : ''}
          ${st === 'cleared' && !opening ? `<div class="owsides">${sidesOf(id).map(S => `<span class="mtag ${d.sides?.[S.id] ? 'cleared' : 'new'}" title="${esc(S.name)}">${esc(S.kindName)}${d.sides?.[S.id] ? ' ✓' : ''}</span>`).join('')}</div>` : ''}
          <div class="btns"><button class="btn" data-act="setout" data-id="${id}" ${shown && !opening ? '' : 'disabled'}>Set out</button>${st === 'cleared' && !opening ? `<button class="btn" data-act="sides" data-id="${id}">Side missions <small>${esc(G.hud.key('mAlt'))}</small></button>` : ''}${d.missions.keep?.cleared && !opening ? `<button class="btn" data-act="underbriar">The Underbriar <small>${esc(G.hud.key('mAlt2'))} · deepest ${d.abyss?.best || 0}</small></button>` : ''}${back}</div>
          <div class="foot">${keys}</div>
        </div>
        <div class="owfade"></div>`;
    } else if (screen === 'sides') {
      // A cleared mission's side missions (sides.js), over the Crossroads.
      const d = G.save.data, L = G.LEVELS[data.m];
      const rows = sidesOf(data.m).map(S => {
        const n = d.sides?.[S.id] || 0, lv = L.level + S.lvl + wayLvl(d.ng);
        return `<button class="btn side" data-act="side" data-m="${data.m}" data-id="${S.id}"><span class="kicker">${esc(S.kindName)} · Lv ${lv}+${n ? ` · done ×${n}` : ' · first run: double Glimmer and an extra piece'}</span><b>${esc(S.name.replace(/^[^:]*: /, ''))}</b><small>${esc(S.desc)}</small></button>`;
      }).join('');
      h = `<div class="panel wide sides"><div class="kicker">${esc(L.name)} · side missions</div><h2>Side Missions</h2>
        <div class="map">${rows}</div>
        <p class="dim">A side run keeps its own Moonwells and leaves the mission's own as they were. Spoils: Glimmer and gear of Rare or better; its gatekeeper or Revenant always leaves its Soul Core.</p>
        <div class="btns"><button class="btn" data-act="back">Back</button></div></div>
        ${keybar(G, [['confirm', 'Set out'], back])}`;
    } else if (screen === 'underbriar') {
      // The endless maze under the Crossroads: start from the first depth or any lit Moonwell reached.
      const a = G.save.data.abyss || { cps: [1], best: 0 };
      const rows = [...a.cps].sort((x, y) => y - x).map(cp => {
        const L = G.LEVELS[themeOf(cp)];
        return `<button class="btn side" data-act="descend" data-depth="${cp}"><span class="kicker">Depth ${cp} · Lv ${depthScale(cp).level + wayLvl(G.save.data.ng)}+${cp === 1 ? ' · the beginning' : ' · a lit Moonwell'}</span><b>Descend from Depth ${cp}</b><small>Its halls are dressed as ${esc(L.name)}'s.</small></button>`;
      }).join('');
      h = `<div class="panel wide sides"><div class="kicker">Beneath the Fae Crossroads · deepest cleared: ${a.best || 0}</div><h2>The Underbriar</h2>
        <p>An endless maze where everything the moon ever lit goes to dream, made anew at every depth. Slay every foe on a depth to open the way down; every fifth depth ends with a warlord, and the depth after it holds a lit Moonwell to start from again. The deeper, the harder, and the richer.</p>
        <div class="map">${rows}</div>
        <div class="btns"><button class="btn" data-act="back">Back</button></div></div>
        ${keybar(G, [['confirm', 'Descend'], back])}`;
    } else if (screen === 'sidecleared') {
      const S = SIDES[data.id], g = G.save.data.gear, got = data.spoils.map(uid => g.items.find(it => it.uid === uid)).filter(Boolean);
      h = `<div class="panel ending"><div class="kicker">Side mission complete${data.first ? ' · first time' : ''}</div><h1>${esc(S.name.replace(/^[^:]*: /, '').toUpperCase())}</h1>
        <p>${esc(S.desc)}</p>
        <div class="lv"><div><small>Spoils</small><b class="gold">${data.gl.toLocaleString()} Glimmer</b></div>${data.pt ? `<div><small>Moonpetals</small><b style="color:#ffb8d8">✿ ${data.pt}</b></div>` : ''}${got.map(it => `<div><small>${esc(RARITY[it.rar].name)} · Lv ${it.lvl}</small><b style="color:#${RARITY[it.rar].color.toString(16).padStart(6, '0')}">${esc(itemName(it, w => WEAPONS[w]?.name || w))}</b></div>`).join('')}</div>
        <div class="btns"><button class="btn" data-act="missions">Onward</button></div></div>
        ${keybar(G, [['confirm', 'Onward']])}`;
    } else if (screen === 'journal') {
      // Letters found, mission by mission, and the Lost Pixies freed.
      const d = G.save.data;
      const rows = G.ORDER.filter(id => d.unlocked.includes(id)).map(id => {
        const L = G.LEVELS[id], ls = L.letters || [], ps = L.pixies || [];
        const read = ls.filter(l => d.letters.includes(id + ':' + l.id)).length, freed = ps.filter(q => d.pixies.includes(id + ':' + q.id)).length;
        const btns = ls.map(l => d.letters.includes(id + ':' + l.id)
          ? `<button class="btn lt" data-act="letter" data-m="${id}" data-id="${l.id}">${esc(l.title)}</button>`
          : '<button class="btn lt" disabled>— a letter not yet found —</button>').join('');
        return `<div class="entry"><b>${esc(L.name)}</b><small>Letters ${read} / ${ls.length} · Lost Pixies ${freed} / ${ps.length}</small>${btns}</div>`;
      }).join('');
      cls = 'journal chrome';
      h = `${head('Journal', `${d.letters.length} letters · ${d.pixies.length} Lost Pixies freed (+${d.pixies.length}% health and stamina)`)}
        <div class="panel wide missions journal"><div class="map">${rows}</div></div>
        ${keybar(G, [['confirm', 'Read'], back])}`;
    } else if (screen === 'arsenal') {
      // Every weapon found: take one in hand (the other carried goes to the back), and at a Moonwell, forge it.
      const d = G.save.data, sv = G.save;
      const rows = d.arms.map(w => {
        const W = WEAPONS[w], rank = d.forge[w] || 0, cost = forgeCost(rank), inHand = d.wield === w, onBack = !inHand && d.loadout.includes(w);
        const forms = ['high', 'mid', 'low'].map(s => FORMS[w][s].name).join(' · ');
        const gw = d.gear?.items.find(it => it.uid === d.gear.equip.weapons[w]);
        const forge = !data.forge ? '' : rank >= FORGE.max ? '<button class="btn small" disabled>Forged to +10</button>'
          : `<button class="btn small" data-act="forge" data-w="${w}" ${sv.glimmer >= cost ? '' : 'disabled'}>Forge to +${rank + 1} <small>${cost.toLocaleString()} Glimmer</small></button>`;
        return `<div class="arm ${inHand ? 'hand' : onBack ? 'back' : ''}"><div class="ainfo"><b>${esc(W.name)}${rank ? ` <span class="rank">+${rank}</span>` : ''}</b>
            <span class="mtag ${inHand || onBack ? 'cleared' : 'sealed'}">${inHand ? 'In hand' : onBack ? 'On your back' : 'Stowed'}</span>
            <small>${esc(W.desc)}</small>${W.mech ? `<small><b class="mech">${esc(W.mech)}</b>: ${esc(W.mechDesc)}</small>` : ''}<small class="dim">${esc(forms)}${rank ? ` · +${Math.round(rank * FORGE.per * 100)}% damage` : ''}</small>${gw ? `<small>Gear: <span style="color:${col(gw.rar)}">${esc(itemName(gw, id => G.player.weaponName(id)))}</span> · Lv ${gw.lvl} · ×${weaponMul(gw).toFixed(2)}</small>` : ''}</div>
          <div class="abtns"><button class="btn small" data-act="wield" data-w="${w}" ${inHand ? 'disabled' : ''}>${inHand ? 'Wielded' : 'Take in hand'}</button>${forge}</div></div>`;
      }).join('');
      // The ranged weapon carried: one at a time.
      const rrows = (d.ranged || ['wisp']).map(r => {
        const R = RANGED[r], on = d.rangedSel === r;
        return `<div class="arm ${on ? 'hand' : ''}"><div class="ainfo"><b>${esc(R.name)}</b><span class="mtag ${on ? 'cleared' : 'sealed'}">${on ? 'Carried' : 'Stowed'}</span>
          <small>${esc(R.desc)}</small><small class="dim">${R.ammo ? `${R.ammo} ${{ bow: 'arrows', rifle: 'shot', cannon: 'shells' }[r]}, refilled at Moonwells` : 'No ammunition: it overheats'}</small></div>
          <div class="abtns"><button class="btn small" data-act="ready" data-r="${r}" ${on ? 'disabled' : ''}>${on ? 'Carried' : 'Carry'}</button></div></div>`;
      }).join('');
      cls = 'arsenal chrome';
      h = `${head('Arsenal', `${d.arms.length} weapon${d.arms.length === 1 ? '' : 's'} found · two carried`)}
        <div class="panel wide arsenal"><div class="map">${rows}<div class="kicker rhead">Ranged · one carried · aim with ${esc(G.hud.key('aim'))}</div>${rrows}</div>
        <p class="dim">${data.forge ? `Glimmer: ${sv.glimmer.toLocaleString()}. Each forging adds 5% damage with that weapon, up to +10.` : 'Weapons can be forged stronger at any Moonwell.'} Switch between your two weapons with ${esc(G.hud.key('swap'))}.</p></div>
        ${keybar(G, [['confirm', 'Choose'], back])}`;
    } else if (screen === 'moves') {
      // Every weapon carried: its three forms (standing, moving and pause strings), finishers, slide and air.
      const arms = G.player.arms, w = arms.includes(data.w) ? data.w : arms[0], Wp = WEAPONS[w], K = KIT[w];
      const nm = k => esc(Wp.names?.[k] || ATK[k]?.name || k);
      const tabs = arms.map(id => `<button class="btn tab${id === w ? ' on' : ''}" data-act="movesW" data-w="${id}">${esc(WEAPONS[id].name)}</button>`).join('');
      const forms = ['high', 'mid', 'low'].map(s => {
        const F = FORMS[w][s];
        return `<div class="form ${s}"><div class="fh"><i>${{ high: '▲', mid: '◆', low: '▼' }[s]}</i><b>${esc(F.name)}</b><small>${{ high: 'High', mid: 'Mid', low: 'Low' }[s]} stance</small></div>
          <p><em>Standing</em>${F.neutral.map(nm).join(' → ')}</p>
          <p><em>Moving</em>${F.forward.map(nm).join(' → ')}</p>
          <p><em>Pause</em>two strikes, wait for the glint, strike: <b>${nm(F.pause)}</b></p>
          <p><em>Heavy</em>${nm(Wp.heavy[s])}</p></div>`;
      }).join('');
      cls = 'moves chrome';
      h = `${head('Movesets', Wp.name)}<div class="panel wide moves"><div class="tabs">${tabs}</div>
        <div class="forms">${forms}</div>
        <div class="kit">${Wp.mech ? `<p><em>${esc(Wp.mech)}</em>${esc(Wp.desc)} ${esc(Wp.mechDesc)}.</p>` : `<p><em>The weapon</em>${esc(Wp.desc)}</p>`}<p><em>Finishers</em>strike then heavy: <b>${nm(K.fin[0])}</b> · two strikes then heavy: <b>${nm(K.fin[1])}</b> · three or more: <b>${nm(K.fin[2])}</b>. A finisher spends the combo counter: the more hits counted, the harder it lands (up to 1.8×).</p>
          <p><em>On the move</em>at a sprint, strike: ${nm(Wp.run)} · out of a dash: ${nm(Wp.dash)} (the chain carries on through dashes) · from a slide: <b>${nm(K.slide)}</b></p>
          <p><em>Skills</em>${[['back', 'Backstep Strike'], ['counter', 'Guard Counter'], ['airFin', 'Air Finisher'], ['skill', 'Weapon Skill']].map(([k, n]) => { const t = TREE.find(x => x.move === k), has = G.save.data.mastery?.[w]?.learned.includes(t.id); return `${n}: <b>${nm(SKILL_KITS[w][k])}</b>${has ? '' : ' <span class="dim">(not yet learned)</span>'}`; }).join(' · ')}</p>
          <p><em>Combo</em>every 12 hits in a row add 6% damage, up to +24%. A blow taken halves the count; four seconds without a hit clears it.</p></div></div>
        ${keybar(G, [[['mPrev', 'mNext'], 'Weapon', 'movesCycle'], back])}`;
    } else if (screen === 'smith') {
      // The Moonwell's forge: reroll an effect, or raise the piece's level with another of its kind.
      const d = G.save.data, g = d.gear, p = G.player, it = g.items.find(x => x.uid === data.uid), wn = id => p.weaponName(id);
      cls = 'smith chrome';
      if (!it) h = `${head('The Moonwell\'s Forge')}<div class="panel wide"><p class="dim">That piece is gone.</p></div>${keybar(G, [back])}`;
      else {
        const rc = reforgeCost(it), worn = new Set([...Object.values(g.equip.weapons), ...Object.values(g.equip.armor)]);
        const fod = g.items.filter(x => x !== it && !worn.has(x.uid) && x.lvl > it.lvl && (it.kind === 'weapon' ? x.type === it.type : x.slot === it.slot)).sort((a, b) => b.lvl - a.lvl).slice(0, 8);
        h = `${head('The Moonwell\'s Forge', `Glimmer ${G.save.glimmer.toLocaleString()}`)}<div class="panel wide arsenal gear smith"><h3 class="gname" style="color:${col(it.rar)}">${esc(itemName(it, wn))}</h3>
          <p class="dim">${RARITY[it.rar].name} · Lv ${it.lvl} · ${it.kind === 'weapon' ? `×${weaponMul(it).toFixed(2)} damage` : `${armorDef(it)} defence`}</p>
          <div class="map"><div class="kicker rhead">Reforge: roll one effect anew · ${rc.toLocaleString()} Glimmer each</div>
          ${it.fx.length ? it.fx.map(([id, v], i) => `<div class="arm"><div class="ainfo"><small>${esc(fxText(id, v))}</small></div><div class="abtns"><button class="btn small" data-act="reforge" data-i="${i}" ${G.save.glimmer >= rc ? '' : 'disabled'}>Reforge</button></div></div>`).join('') : '<p class="dim">A Common piece has no effects to reforge.</p>'}
          <div class="kicker rhead">Soul Match: raise it to another piece's level (that piece is consumed)</div>
          ${fod.length ? fod.map(x => { const c = soulMatchCost(it, x); return `<div class="arm"><div class="ainfo"><small>To Lv <b>${x.lvl}</b>, consuming ${esc(itemName(x, wn))}</small></div><div class="abtns"><button class="btn small" data-act="soulmatch" data-from="${x.uid}" ${G.save.glimmer >= c ? '' : 'disabled'}>Soul Match <small>${c.toLocaleString()} Glimmer</small></button></div></div>`; }).join('') : '<p class="dim">No higher-level piece of this kind to match it with (worn pieces are never consumed).</p>'}</div></div>
          ${keybar(G, [['confirm', 'Select'], back])}`;
      }
    } else if (screen === 'deeds') {
      // Deeds: long goals across every mission, Way and depth (deeds.js).
      const list = G.deedsView(), earned = list.reduce((a, r) => a + r.tier, 0);
      const rows = list.map(({ D, n, tier }) => {
        const next = D.tiers[tier], pc = next ? Math.min(100, n / next * 100) : 100;
        return `<div class="arm deed ${tier ? 'hand' : ''}"><div class="ainfo"><b>${esc(D.name)} <span class="rank">${tier ? TIER[tier - 1] : ''}</span></b>
          <span class="mtag ${tier === 3 ? 'cleared' : 'sealed'}">${esc(D.desc)} · ${n.toLocaleString()}${next ? ` / ${next.toLocaleString()}` : ' · complete'}</span>
          <s class="dbar"><u style="width:${pc}%"></u></s>
          <small>Each tier: ${esc(fxText(D.fx[0], D.fx[1]))}, for good${next ? ` · next pays ${DEED_GLIMMER[tier].toLocaleString()} Glimmer` : ''}</small></div></div>`;
      }).join('');
      cls = 'deeds chrome';
      h = `${head('Deeds', `${earned} of ${list.length * 3} tiers earned`)}<div class="panel wide arsenal deeds"><div class="map">${rows}</div></div>${keybar(G, [back])}`;
    } else if (screen === 'skills') {
      // Each weapon's tree: mastery earned by using it, points to spend, skills in tiers.
      const d = G.save.data, owned = [...G.player.arms, ...(G.player.rangedOwned || [])], w = owned.includes(data.w) ? data.w : owned[0];
      const m = d.mastery?.[w] || { xp: 0, learned: [] }, tree = treeFor(w), earned = pointsAt(m.xp), free = earned - treeCost(m.learned);
      const Wn = WEAPONS[w]?.name || G.player.rangedDef?.(w)?.name || w, K = SKILL_KITS[w] || {};
      const tabs = owned.map(id => {
        const mi = d.mastery?.[id] || { xp: 0, learned: [] }, f = pointsAt(mi.xp) - treeCost(mi.learned);
        return `<button class="btn tab${id === w ? ' on' : ''}" data-act="skillsW" data-w="${id}">${esc(WEAPONS[id]?.name || G.player.rangedDef?.(id)?.name || id)}${f > 0 ? ` <span class="pts">${f}</span>` : ''}</button>`;
      }).join('');
      const next = xpFor(earned + 1), prev = xpFor(earned), frac = Math.min(1, (m.xp - prev) / (next - prev));
      const tiers = [0, 1, 2, 3].map(tier => tree.filter(t => t.tier === tier)).filter(r => r.length).map(row => `<div class="srow">${row.map(t => {
        const has = m.learned.includes(t.id), open = canLearn(tree, m.learned, t.id), afford = free >= t.cost;
        const needs = t.req ? t.req.map(r => tree.find(x => x.id === r).name).join(' or ') : '';
        const desc = t.id === 'mech' ? `${WEAPONS[w]?.mech || 'Mechanic'} Mastery: ${MECH_MASTERY[w] || ''}` : t.move && K[t.move] ? `${t.desc} <b>${esc(G.player.moveName(K[t.move], w))}</b>` : esc(t.desc);
        const tag = has ? 'Learned' : !open ? `Needs ${esc(needs)}` : `${t.cost} point${t.cost > 1 ? 's' : ''}`;
        return `<button class="btn skill ${has ? 'has' : open && afford ? 'can' : 'no'}" data-act="learn" data-w="${w}" data-id="${t.id}" ${has || !open || !afford ? 'disabled' : ''}>
          <b>${esc(t.id === 'mech' ? `${WEAPONS[w]?.mech || ''} Mastery` : t.name)}</b><small>${desc}</small><span class="stag">${tag}</span></button>`;
      }).join('')}</div>`).join('');
      cls = 'skills chrome';
      h = `${head('Skills', Wn)}<div class="panel wide skills"><div class="tabs">${tabs}</div>
        <div class="mastery"><span>Mastery ${Math.floor(m.xp).toLocaleString()}</span><i><b style="width:${Math.round(frac * 100)}%"></b></i><span>${free} of ${earned} skill point${earned === 1 ? '' : 's'} to spend · next at ${next.toLocaleString()}</span></div>
        <div class="tree">${tiers}</div>
        <p class="dim">Every blow landed with a weapon teaches it a little; felling a foe teaches more. Skills can be learned anywhere.</p></div>
        ${keybar(G, [[['mPrev', 'mNext'], 'Weapon', 'skillsCycle'], ['confirm', 'Learn'], back])}`;
    } else if (screen === 'letter') {
      const L = G.LEVELS[data.m], l = (L.letters || []).find(x => x.id === data.id);
      cls = 'letter chrome';
      h = `${head(l.title, L.name)}<div class="panel wide"><div class="parchment"><p>${esc(l.text)}</p></div></div>${keybar(G, [back])}`;
    } else if (screen === 'charms') {
      const d = G.save.data, worn = d.equipped;
      const rows = d.charms.map(id => {
        const c = CHARMS[id], on = worn.includes(id), full = !on && worn.length >= CHARM_SLOTS;
        return `<button class="btn mission charm ${on ? 'on' : ''}" data-act="charm" data-id="${id}">
          <span class="node" style="color:${c.color};border-color:${c.color}">◆</span><span class="mtext"><b>${esc(c.name)}</b><small>${esc(c.desc)}</small></span>
          <span class="mtag ${on ? 'cleared' : 'sealed'}">${on ? 'Worn' : full ? '' : 'Wear'}</span></button>`;
      }).join('');
      cls = 'charms chrome';
      h = `${head('Charms', `${worn.length} of ${CHARM_SLOTS} worn`)}<div class="panel wide missions charms"><div class="map">${rows}</div>
        <p class="dim">${d.charms.length} of ${Object.keys(CHARMS).length} found. Charms lie hidden in the missions, and every gatekeeper and warlord guards one.</p></div>
        ${keybar(G, [['confirm', 'Wear or take off'], back])}`;
    } else if (screen === 'ending') {
      const sv = G.save, m = Math.floor(sv.time / 60), s = Math.floor(sv.time % 60);
      h = `<div class="panel ending"><h1>${esc(G.level.endingTitle || 'THE PATHS ARE STILL')}</h1>
        <p>${esc(G.level.ending || G.level.outro || '')}</p>
        <div class="lv"><div><small>Time</small><b>${m}:${String(s).padStart(2, '0')}</b></div><div><small>Deaths</small><b>${sv.deaths}</b></div><div><small>Level</small><b>${sv.level}</b></div><div><small>Way</small><b>${esc(wayName(sv.ng))}</b></div></div>
        <p class="dim">Next: <b>${esc(wayName(sv.ng + 1))}</b>. ${esc(wayDesc(sv.ng + 1))} You keep your level, gear, weapons, Soul Cores and skills; the missions begin again.</p>
        <div class="btns"><button class="btn" data-act="ngplus">Walk the ${esc(wayName(sv.ng + 1))} · New Game+</button><button class="btn" data-act="missions">Walk the Fae Crossroads</button><button class="btn" data-act="title">Return to title</button></div></div>
        ${keybar(G, [['confirm', 'Select']])}`;
    }
    this.el.className = 'on ' + cls;
    G.overworld?.setActive(screen === 'map' || screen === 'sides' || screen === 'underbriar');
    this.el.innerHTML = h;
    if (screen === 'map') G.overworld.bindLabels(this.el);
    this.lastTop = this.top;
    if (this.top.scrolls) scrollers().forEach((e, i) => { e.scrollTop = this.top.scrolls[i] || 0; });
    this.focus = Math.max(0, Math.min(this.top.focus ?? 0, this.items().length - 1));
    this.paint(true);
  }
}
