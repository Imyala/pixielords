// Full-screen menus: title, pause, shrine (rest, level up, travel), charms, the Fae Crossroads map overlay,
// controls, movesets, the Journal, settings and the cleared / ending screens.
// Mouse, keyboard (arrows + Enter/Esc) and gamepad (d-pad + A/B) all work.
import { derive, ATK, WEAPONS } from './player.js';
import { FORMS, KIT } from './movesets.js';
import { levelCost, forgeCost, FORGE } from './save.js';
import { CHARMS, CHARM_SLOTS } from './charms.js';
import { roman } from './overworld.js';
import { RANGED } from './ranged.js';
import { RARITY, SLOTS, SLOT_NAME, SETS, fxText, itemName, weaponMul, armorDef, defReduce, dismantleValue, reforgeCost, soulMatchCost } from './gear.js';
import { TIER, DEED_GLIMMER } from './deeds.js';
import { PACK } from './loot.js';
import { CORES, CORE_MAX } from './cores.js';
import { SIDES, sidesOf } from './sides.js';
import { wayName, wayDesc } from './ways.js';
import { themeOf } from './underbriar.js';
import { TREE, xpFor, pointsAt, treeCost, canLearn, treeFor, SKILL_KITS, MECH_MASTERY } from './skills.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const STATS = [
  { k: 'vit', name: 'Vitality', desc: 'Maximum health' },
  { k: 'end', name: 'Endurance', desc: 'Maximum stamina' },
  { k: 'str', name: 'Strength', desc: 'Weapon damage' },
  { k: 'spi', name: 'Spirit', desc: 'Faelight gain and Fae Shift length' },
];

const CONTROLS = [
  ['Move', 'W A S D', 'Left stick'],
  ['Camera', 'Mouse', 'Right stick'],
  ['Strike  ·  strike hard', 'Left click  ·  right click', 'RB  ·  RT'],
  ['Guard  ·  tap as a blow lands to Deflect', 'Shift', 'LB'],
  ['Dash  ·  hold to sprint', 'Space', 'B'],
  ['Slide (at a sprint)  ·  from a slide: Wingleap', 'Shift or Z  ·  Space', 'LB or L3  ·  B'],
  ['Glide (falling)', 'Hold Space', 'Hold B'],
  ['Stance: High / Mid / Low', '1  2  3  (or C / X)', 'D-pad ↑ / ↓'],
  ['Switch weapon (two carried)  ·  as a strike ends: Switch Strike', 'V', 'D-pad ←'],
  ['Fae Art: use  ·  change', 'T (or Shift + R)  ·  Y', 'LB + X  ·  Select'],
  ['Aim the ranged weapon  ·  fire (hold to draw the bow)', 'Ctrl or L  ·  left click', 'D-pad →  ·  RB'],
  ['Skills once learned: Weapon Skill', 'Hold Shift + right click', 'Hold LB + RT'],
  ['Skills once learned: Backstep Strike  ·  Guard Counter', 'Space (no direction), strike  ·  strike after a block', 'B (no direction), RB  ·  RB after a block'],
  ['Charge a heavy (Moonglaive)', 'Hold right click', 'Hold RT'],
  ['Launcher  ·  then strike in the air', 'Hold Shift + left click', 'Hold LB + RB'],
  ['In the air: Starfall  ·  air dash', 'Right click  ·  Space', 'RT  ·  B'],
  ['Thorn Counter', 'F', 'LT'],
  ['Lock on  ·  switch target', 'Q / middle click  ·  wheel / Tab', 'R3  ·  flick right stick'],
  ['Drink Moondew', 'R', 'X'],
  ['Interact', 'E', 'A'],
  ['Fae Shift (Faelight full)', 'G', 'Y'],
  ['Soul Core skills: first  ·  second', 'Hold G + left click  ·  hold G + right click', 'Hold Y + RB  ·  hold Y + RT'],
  ['Side missions (on the Crossroads map)', 'G', 'Y'],
  ['The Underbriar (on the Crossroads map)', 'R', 'X'],
  ['Pause', 'Esc', 'Start'],
];

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
      this.run(b.dataset.act, b);
    });
    this.el.addEventListener('input', e => {
      const s = e.target.closest('[data-set]');
      if (s) this.G.setSetting(s.dataset.set, s.type === 'checkbox' ? s.checked : +s.value);
    });
    this.el.addEventListener('mousemove', e => {
      const b = e.target.closest('.btn,[data-set]');
      const list = this.items();
      const i = list.indexOf(b);
      if (i >= 0 && i !== this.focus) { this.focus = i; this.paint(); }
    });
  }

  get open() { return this.stack.length > 0; }
  get top() { return this.stack[this.stack.length - 1]; }

  items() { return [...this.el.querySelectorAll('.btn:not([disabled]),[data-set]')]; }
  paint(scroll = false) {
    this.items().forEach((b, i) => { b.classList.toggle('focus', i === this.focus); if (scroll && i === this.focus) b.scrollIntoView?.({ block: 'nearest' }); });
  }

  show(screen, data) { this.stack = [{ screen, data }]; this.G.hud?.clearOverlays(); this.render(); }
  push(screen, data) { this.stack.push({ screen, data }); this.render(); }
  pop() { this.stack.pop(); if (this.stack.length) this.render(); else this.close(); }
  close() { this.stack = []; this.el.className = ''; this.el.innerHTML = ''; this.G.overworld?.setActive(false); this.G.onMenuClosed?.(); }

  // Keyboard / gamepad navigation.
  nav(inp) {
    if (!this.open) return;
    // The map: directions travel between landmarks, confirm sets out, back returns (unless the map is all there is).
    if (this.top.screen === 'map') {
      const O = this.G.overworld;
      if (!O.entering) for (const d of ['left', 'right', 'up', 'down']) if (inp.hit(d)) O.step(d);
      if (inp.hit('confirm')) this.el.querySelector('.owpanel [data-act=setout]:not([disabled])')?.click();
      if (inp.hit('shift') && !O.entering) this.el.querySelector('.owpanel [data-act=sides]:not([disabled])')?.click();
      if (inp.hit('heal') && !O.entering) this.el.querySelector('.owpanel [data-act=underbriar]')?.click();
      if (inp.hit('back') && ['shrine', 'title'].includes(this.top.data?.from) && !O.entering) { this.G.audio.sfx('ui'); this.pop(); }
      return;
    }
    const list = this.items();
    if (list.length <= 1) {   // a page of reading with a lone Back button: up and down scroll it
      const panel = this.el.querySelector('.panel');
      if (panel && inp.hit('up')) panel.scrollBy({ top: -120, behavior: 'smooth' });
      if (panel && inp.hit('down')) panel.scrollBy({ top: 120, behavior: 'smooth' });
    } else {
      if (inp.hit('up')) { this.focus = (this.focus - 1 + list.length) % list.length; this.paint(true); this.G.audio.sfx('ui'); }
      if (inp.hit('down')) { this.focus = (this.focus + 1) % list.length; this.paint(true); this.G.audio.sfx('ui'); }
    }
    const cur = list[this.focus];
    if (cur?.dataset.set && cur.type === 'range') {
      const step = +cur.step || .05;
      if (inp.hit('left')) { cur.value = +cur.value - step; cur.dispatchEvent(new Event('input', { bubbles: true })); }
      if (inp.hit('right')) { cur.value = +cur.value + step; cur.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    if (inp.hit('confirm') && cur) { cur.click(); }
    const fixed = ['title', 'ending', 'cleared', 'sidecleared'].includes(this.top?.screen);
    if (inp.hit('back') && !fixed) {
      this.G.audio.sfx('ui');
      if (this.top.screen === 'shrine') this.run('leave'); else this.pop();
    }
  }

  run(act, b) {
    const G = this.G;
    switch (act) {
      case 'new': if (G.save.exists) this.push('confirm'); else G.newGame(); break;
      case 'newYes': G.newGame(); break;
      case 'continue': G.continueGame(); break;
      case 'controls': this.push('controls'); break;
      case 'settings': this.push('settings'); break;
      case 'back': this.pop(); break;
      case 'resume': this.close(); break;
      case 'quit': G.quitToTitle(); break;
      case 'level': G.levelUp(b.dataset.stat); this.render(); break;
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
      case 'journal': this.push('journal'); break;
      case 'moves': this.push('moves', { w: G.player.weapon }); break;
      case 'arsenal': this.push('arsenal', { forge: this.top?.screen === 'shrine' }); break;
      case 'wield': { const f = this.focus; G.wieldWeapon(b.dataset.w); this.render(); this.focus = f; this.paint(); break; }
      case 'ready': { const f = this.focus; G.readyRanged(b.dataset.r); this.render(); this.focus = f; this.paint(); break; }
      case 'forge': { const f = this.focus; if (!G.forgeWeapon(b.dataset.w)) G.audio.sfx('ui'); this.render(); this.focus = f; this.paint(); break; }
      case 'movesW': this.top.data = { w: b.dataset.w }; this.render(); break;
      case 'skills': this.push('skills', { w: G.player.weapon }); break;
      case 'gear': this.push('gear', { tab: 'armor', w: G.player.weapon, slot: 'body', forge: this.top?.screen === 'shrine' }); break;
      case 'smith': this.push('smith', { uid: +b.dataset.uid }); break;
      case 'reforge': { const f = this.focus; if (!G.reforge(this.top.data.uid, +b.dataset.i)) G.audio.sfx('ui'); this.render(); this.focus = f; this.paint(); break; }
      case 'soulmatch': { if (G.soulMatch(this.top.data.uid, +b.dataset.from)) { this.render(); } else G.audio.sfx('ui'); break; }
      case 'deeds': this.push('deeds'); break;
      case 'gearTab': Object.assign(this.top.data, { tab: b.dataset.tab }); this.render(); break;
      case 'gearW': Object.assign(this.top.data, { w: b.dataset.w }); this.render(); break;
      case 'gearSlot': Object.assign(this.top.data, { slot: b.dataset.slot }); this.render(); break;
      case 'equipGear': { const f = this.focus; G.equipGear(+b.dataset.uid); this.render(); this.focus = f; this.paint(); break; }
      case 'dismantle': { const f = this.focus, got = G.dismantleGear([+b.dataset.uid]); if (got) G.hud.toast(`Dismantled for ${got} Glimmer`, 'item'); this.render(); this.focus = Math.min(f, this.items().length - 1); this.paint(); break; }
      case 'setCore': { const f = this.focus; G.setCore(+b.dataset.slot, b.dataset.core || null); this.render(); this.focus = f; this.paint(); break; }
      case 'dismantleBelow': { const got = G.dismantleBelow(+b.dataset.rar); G.hud.toast(got ? `Dismantled for ${got.toLocaleString()} Glimmer` : 'Nothing to dismantle', 'item'); this.render(); break; }
      case 'skillsW': this.top.data = { w: b.dataset.w }; this.render(); break;
      case 'learn': { const f = this.focus; if (!G.learnSkill(b.dataset.w, b.dataset.id)) G.audio.sfx('ui'); this.render(); this.focus = f; this.paint(); break; }
      case 'letter': { const y = this.el.querySelector('.map')?.scrollTop || 0; this.top.scroll = y; this.push('letter', { m: b.dataset.m, id: b.dataset.id }); G.audio.sfx('page'); break; }
      case 'charm': { const f = this.focus; if (!G.equipCharm(b.dataset.id)) G.hud.toast('All three charm slots are worn'); const y = this.el.querySelector('.map')?.scrollTop || 0; this.render(); this.focus = f; this.paint(); const m = this.el.querySelector('.map'); if (m) m.scrollTop = y; break; }
    }
  }

  render() {
    const { screen, data } = this.top, G = this.G;
    this.el.className = 'on ' + screen;
    G.overworld?.setActive(screen === 'map' || screen === 'sides' || screen === 'underbriar');
    let h = '';
    if (screen === 'title') {
      const has = G.save.exists, ready = G.ready;
      h = `<div class="panel title">
        <h1>PIXIELORDS</h1>
        <div class="tag">A fae knight · a warren of rot · a lord upon the throne</div>
        ${ready ? '' : `<div class="loading"><i style="transform:scaleX(${G.loadProgress || 0})"></i><span>Summoning the warren… ${Math.round((G.loadProgress || 0) * 100)}%</span></div>`}
        <div class="btns">
          ${has ? `<button class="btn" data-act="continue" ${ready ? '' : 'disabled'}>Continue <small>${esc(G.save.summary(G.LEVELS))}</small></button>` : ''}
          ${has && G.save.data.unlocked.length > 1 ? `<button class="btn" data-act="map" ${ready ? '' : 'disabled'}>The Fae Crossroads <small>Choose where the path leads</small></button>` : ''}
          <button class="btn" data-act="new" ${ready ? '' : 'disabled'}>New Game</button>
          <button class="btn" data-act="controls">Controls</button>
          <button class="btn" data-act="settings">Settings</button>
          <a class="btn link" href="library.html">Asset Library ↗</a>
        </div>
        <div class="foot">${G.touchOnly ? 'PixieLords needs a keyboard and mouse, or a gamepad.' : 'Keyboard + mouse or a gamepad · best with headphones'}</div>
      </div>`;
    } else if (screen === 'confirm') {
      h = `<div class="panel"><h2>Begin anew?</h2><p>Your current journey will be forgotten.</p>
        <div class="btns"><button class="btn" data-act="newYes">Begin a new journey</button><button class="btn" data-act="back">Keep my journey</button></div></div>`;
    } else if (screen === 'pause') {
      h = `<div class="panel"><h2>Paused</h2>
        <div class="btns"><button class="btn" data-act="resume">Resume</button><button class="btn" data-act="controls">Controls</button>
        <button class="btn" data-act="arsenal">Arsenal</button><button class="btn" data-act="gear">Gear</button><button class="btn" data-act="skills">Skills</button><button class="btn" data-act="moves">Movesets</button><button class="btn" data-act="journal">Journal</button><button class="btn" data-act="deeds">Deeds</button><button class="btn" data-act="settings">Settings</button>${G.sideDef() ? '<button class="btn" data-act="abandon">Abandon side mission</button>' : ''}${G.level.depth ? '<button class="btn" data-act="leaveAbyss">Leave the Underbriar</button>' : ''}<button class="btn" data-act="quit">Quit to title</button></div>
        ${G.sideDef() ? `<p class="dim">${esc(G.sideDef().name)}: a side run keeps its own Moonwells. Abandon it to return to the mission itself.</p>` : ''}
        <p class="dim">Progress is saved each time you rest at a Moonwell or vanquish a warlord.</p></div>`;
    } else if (screen === 'controls') {
      h = `<div class="panel wide"><h2>Controls</h2><table class="ctl"><tr><th></th><th>Keyboard + mouse</th><th>Gamepad</th></tr>
        ${CONTROLS.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table>
        <div class="tips">
          <p><b>Stamina</b> fuels strikes, dashes and blocked blows. Run dry and you stagger, out of breath.</p>
          <p><b>Resonance</b>: as a strike ends, blue light gathers around you. Tap guard then and the stamina you spent flows back. Change stance in that moment for a Resonant Shift.</p>
          <p><b>Forms</b>: every weapon fights its own way in each stance (High hits hardest, Mid is balanced, Low is quick). Strike standing still and strike on the move for two different chains. Two strikes in, wait for the blade to glint, then strike: the form's <b>pause combo</b>. Strike then heavy for a <b>finisher</b>, chosen by how many strikes came first; it spends the combo counter for extra damage. See <b>Movesets</b> for every form.</p>
          <p><b>Arsenal</b>: you carry two weapons at a time; choose them in the Arsenal (pause menu or any Moonwell), and forge them stronger at a Moonwell. The <b>Thornhammer</b> is Stalwart (blows can't stagger its swings); the <b>Starfists</b> punch and kick, and every hit wins back stamina.</p>
          <p><b>Gear</b>: foes drop weapons and armour, marked by beams of light in their rarity's colour; walk over them to take them. Rarer pieces carry more effects, and two or four pieces of one armour set wake its bonuses. Equip under Gear; dismantle the rest for Glimmer.</p>
          <p><b>Soul Cores</b>: fallen foes sometimes leave a violet core (elites often, gatekeepers, warlords and Revenants always). Set two under Gear: each lends a passive and a skill. Hold Fae Shift and strike for the first, strike hard for the second; skills cost Faelight. A core found again fuses into the one you hold and grows stronger.</p>
          <p><b>Side missions</b>: a cleared mission offers three more on the Crossroads map. <b>Twilight</b> runs the whole mission under a blood moon, every foe hardier and its gear better; a <b>Hunt</b> sends you after its gatekeeper, returned stronger; a <b>Duel</b> sets you against a <b>Revenant</b>, a fallen fae knight who fights with your own weapons. Each can be run again for more spoils.</p>
          <p><b>Champions</b>: now and then a foe rises with one or more affixes (Swift, Bloodthirsty, Emberborn, Rimebound, Blighted, Warded, Wrathful, Stoneskin, Stormcaller, Phasing), named for them and ringed in their colour. Hardier and more dangerous, they pay out as elites do. More come on later Ways, in Twilight and deep in the Underbriar.</p>
          <p><b>Ways</b>: each New Game+ is a Way: the Thorn, the Moon, the Fae Lord and beyond. Foes grow hardier, Champions carry more affixes, gear drops higher, and <b>Divine</b> gear, the rarest, appears.</p>
          <p><b>The Underbriar</b> (from the Crossroads map, once the Grubhold is cleared): an endless maze made anew at every depth. Slay every foe to open the way down; every fifth depth ends with a warlord, and the next holds a lit Moonwell to start from again. Health and Moondew carry from depth to depth; fall, and you wake at the last lit Moonwell.</p>
          <p><b>Deeds</b> (pause menu or any Moonwell): long goals kept across every mission, Way and depth: foes felled by kind, Deflects, Flashcuts, missions and side missions, the Underbriar's depths, pixies and letters found, gear smithed. Each has three tiers; each tier pays Glimmer and a small bonus for good.</p>
          <p><b>The Moonwell's forge</b>: open Gear at a Moonwell to <b>reforge</b> a piece (roll one of its effects anew) or <b>soul-match</b> it (raise its level to that of another piece of its kind, which is consumed), so a favourite piece can keep up as you go deeper.</p>
          <p><b>Skills</b>: every weapon learns from use. Blows landed earn it mastery and skill points; spend them under Skills on new moves (a Backstep Strike, a Guard Counter, an Air Finisher, the weapon's own Weapon Skill on guard + heavy) and on mastery of its ways.</p>
          <p><b>Ranged weapons</b>: aim to bring the camera over your shoulder, strike to fire. The Wisp Pod needs no ammunition but overheats; the Moonbow draws while you hold strike; the rifle and hand cannon hit hardest but reload slowly. Shots to the head hit harder. Ammunition refills at every Moonwell.</p>
          <p><b>Fae Arts</b>: thrown darts and pixie bombs, and brands that set your weapon burning, crackling or frosting for thirty seconds. Their uses return at every Moonwell.</p>
          <p><b>Movement</b>: at a sprint, guard to <b>slide</b> (strike for a slide attack), dash out of the slide to <b>Wingleap</b>, and hold dash while falling to <b>glide</b>. Chains carry on through dashes.</p>
          <p><b>Deflect</b> by tapping guard just as a blow lands. Strike straight after for a <b>Flashcut</b>, one cut that fells ordinary foes and chains from one to the next.</p>
          <p><b>Moonstep</b>: dash at the last instant and the world slows around you. Strike straight after for a <b>Moonstep Riposte</b>: you blink behind the attacker and cut.</p>
          <p><b>Weapons</b>: switch as a strike ends for a <b>Switch Strike</b>, a wheeling cut with the weapon you draw. The Moonglaive reaches further and hits posture harder; hold a heavy to charge it. The Twin Fangs are quickest: flurries hit again and again, and every hit builds <b>Frenzy</b> (faster, harder strikes while it lasts).</p>
          <p>Strikes cut hex orbs out of the air. Deflect one and it flies back at its caster.</p>
          <p><b>Launcher</b>: hold guard and strike to throw a foe skyward and leap after it. Up to four air strikes keep you both aloft; a heavy in the air is the <b>Starfall</b>, a plunge that drives everything below into the ground. Floored foes take more damage. Gatekeepers and warlords can't be launched, but you can still leap and strike them.</p>
          <p><b>Charms</b> bend the rules a little. Wear up to three; change them at any Moonwell.</p>
          <p><b>Dread strikes</b> glow red and can't be guarded. Dash through them, or Thorn Counter as they land.</p>
          <p>Drain a foe's stamina bar and it is <b>Shattered</b>: strike to <b>Execute</b>. Strike unaware foes from behind for an <b>Ambush</b>.</p>
        </div>
        <div class="btns"><button class="btn" data-act="back">Back</button></div></div>`;
    } else if (screen === 'settings') {
      const s = G.settings;
      const slider = (k, label, min, max, step) => `<label class="row"><span>${label}</span><input type="range" data-set="${k}" min="${min}" max="${max}" step="${step}" value="${s[k]}"></label>`;
      h = `<div class="panel"><h2>Settings</h2>
        ${slider('sens', 'Camera sensitivity', .2, 3, .05)}
        <label class="row"><span>Invert camera Y</span><input type="checkbox" data-set="invertY" ${s.invertY ? 'checked' : ''}></label>
        ${slider('master', 'Master volume', 0, 1, .05)}
        ${slider('music', 'Music', 0, 1, .05)}
        ${slider('sfx', 'Effects', 0, 1, .05)}
        <label class="row"><span>Screen shake</span><input type="range" data-set="shake" min="0" max="1" step=".1" value="${s.shake}"></label>
        <label class="row"><span>High quality (shadows, sharper)</span><input type="checkbox" data-set="quality" ${s.quality ? 'checked' : ''}></label>
        <div class="btns"><button class="btn" data-act="back">Back</button></div></div>`;
    } else if (screen === 'shrine') {
      const sv = G.save, p = G.player, lvl = sv.level, cost = levelCost(lvl);
      const cur = derive(sv.stats);
      const rows = STATS.map(st => {
        const next = { ...sv.stats, [st.k]: sv.stats[st.k] + 1 }, d = derive(next);
        const gain = st.k === 'vit' ? `+${d.maxHp - cur.maxHp} health` : st.k === 'end' ? `+${d.maxKi - cur.maxKi} stamina` : st.k === 'str' ? `+${Math.round((d.dmgMul - cur.dmgMul) * 100)}% damage` : `+${Math.round((d.animaGain - cur.animaGain) * 100)}% Faelight, +1s shift`;
        return `<div class="stat"><div><b>${st.name}</b> <span class="val">${sv.stats[st.k]}</span><small>${st.desc} · ${gain}</small></div>
          <button class="btn plus" data-act="level" data-stat="${st.k}" ${sv.glimmer >= cost ? '' : 'disabled'}>+</button></div>`;
      }).join('');
      const other = Object.values(G.level.shrines).filter(s => s.id !== data.id && sv.m.kindled.includes(s.id));
      h = `<div class="panel shrine"><h2>${esc(data.name)}</h2>
        <div class="lv"><div><small>Level</small><b>${lvl}</b></div><div><small>Glimmer</small><b class="gold">${sv.glimmer.toLocaleString()}</b></div><div><small>Next level</small><b>${cost.toLocaleString()}</b></div></div>
        <div class="derived">Health ${p.maxHp} · Stamina ${p.maxKi} · Damage ×${p.dmgMul.toFixed(2)} · Moondew ${sv.elixirMax}</div>
        ${rows}
        <div class="btns">
          ${other.map(s => `<button class="btn" data-act="travel" data-shrine="${s.id}">Travel to ${esc(s.name)}</button>`).join('')}
          ${sv.data.charms.length ? `<button class="btn" data-act="charms">Charms (${sv.data.equipped.length} / ${CHARM_SLOTS} worn)</button>` : ''}
          <button class="btn" data-act="arsenal">Arsenal <small>choose two weapons · forge them stronger</small></button>
          <button class="btn" data-act="gear">Gear <small>weapons and armour found · reforge, soul-match, dismantle</small></button>
          <button class="btn" data-act="skills">Skills <small>spend what each weapon has taught you</small></button>
          <button class="btn" data-act="moves">Movesets <small>each weapon's forms, combos and finishers</small></button>
          <button class="btn" data-act="journal">Journal <small>${sv.data.letters.length} letters · ${sv.data.pixies.length} Lost Pixies freed</small></button>
          <button class="btn" data-act="deeds">Deeds <small>${Object.values(sv.data.deeds || {}).reduce((a, b) => a + b, 0)} of ${G.deedsView().length * 3} earned</small></button>
          ${sv.data.unlocked.length > 1 ? '<button class="btn" data-act="journey">Journey elsewhere…</button>' : ''}
          <button class="btn" data-act="leave">Rise</button>
        </div>
        <p class="dim">Resting mends you, refills your Moondew, and calls every fallen foe back.</p></div>`;
    } else if (screen === 'cleared') {
      const sv = G.save, L = G.level, m = Math.floor(sv.time / 60), s = Math.floor(sv.time % 60);
      h = `<div class="panel ending"><div class="kicker">Mission complete</div><h1>${esc(L.name.toUpperCase())}</h1>
        <p>${esc(L.outro || '')}</p>
        <div class="lv"><div><small>Time</small><b>${m}:${String(s).padStart(2, '0')}</b></div><div><small>Deaths</small><b>${sv.deaths}</b></div><div><small>Level</small><b>${sv.level}</b></div><div><small>Glimmer</small><b class="gold">${sv.glimmer.toLocaleString()}</b></div></div>
        <div class="btns"><button class="btn" data-act="missions">Onward</button></div></div>`;
    } else if (screen === 'map') {
      // The overworld draws itself; this is its overlay: floating labels and the chosen mission's panel.
      const O = G.overworld, sv = G.save, d = sv.data, id = O.selected, L = G.LEVELS[id], i = G.ORDER.indexOf(id), st = O.status(id);
      const opening = O.revealing?.n.id === id, shown = st !== 'sealed' && (d.seen?.includes(id) || opening), m = d.missions[id] || { kindled: [], items: [] };
      const charms = (L.items || []).filter(it => it.kind === 'charm').map(it => it.id), trophies = [L.gate?.charm, L.bossCharm].filter(Boolean);
      const found = charms.filter(c => m.items.includes(c)).length + trophies.filter(c => d.charms.includes(c)).length;
      const prev = G.LEVELS[G.ORDER[i - 1]];
      const labels = O.nodes.map(n => {
        const s = O.status(n.id), vis = s !== 'sealed' && d.seen?.includes(n.id);
        return `<button class="owl ${vis ? s : 'sealed'} ${n.id === id ? 'sel' : ''}" data-act="node" data-id="${n.id}"><span class="n">${roman(n.i + 1)}</span>${vis ? esc(n.L.name) : 'Sealed'}</button>`;
      }).join('');
      const back = data?.from === 'shrine' ? '<button class="btn" data-act="back">Stay</button>' : data?.from === 'title' ? '<button class="btn" data-act="back">Back</button>' : '<button class="btn" data-act="title">Return to title</button>';
      const keys = G.input.usingPad ? 'D-pad or stick to travel · A to set out' + (data?.from === 'cleared' ? '' : ' · B to go back') : 'Arrows or WASD to travel · Enter to set out' + (data?.from === 'cleared' ? '' : ' · Esc to go back') + ' · or click a landmark';
      h = `<div class="owlabels">${labels}</div>
        <div class="panel owpanel">
          <div class="kicker">The Fae Crossroads · ${roman(i + 1)} · Lv ${L.level + d.ng * 20}+${d.ng ? ' · ' + esc(wayName(d.ng)) : ''}</div>
          <h2>${shown ? esc(L.name) : 'Sealed'}</h2>
          ${opening ? '<div class="kicker">A new path opens</div>' : ''}
          <p>${esc(shown ? L.blurb : prev ? `The path is not yet open. Clear ${prev.name} to find the way.` : 'The path is not yet open.')}</p>
          ${shown ? `<div class="owstats"><span class="mtag ${st}">${{ cleared: 'Cleared', inprogress: 'In progress', new: 'New' }[st]}</span><span>Moonwells ${m.kindled.length} / ${Object.keys(L.shrines).length}</span><span>Charms ${found} / ${charms.length + trophies.length}</span><span>Letters ${(L.letters || []).filter(l => d.letters.includes(id + ':' + l.id)).length} / ${(L.letters || []).length}</span><span>Pixies ${(L.pixies || []).filter(q => d.pixies.includes(id + ':' + q.id)).length} / ${(L.pixies || []).length}</span></div>` : ''}
          ${st === 'cleared' && !opening ? `<div class="owsides">${sidesOf(id).map(S => `<span class="mtag ${d.sides?.[S.id] ? 'cleared' : 'new'}" title="${esc(S.name)}">${esc(S.kindName)}${d.sides?.[S.id] ? ' ✓' : ''}</span>`).join('')}</div>` : ''}
          <div class="btns"><button class="btn" data-act="setout" data-id="${id}" ${shown && !opening ? '' : 'disabled'}>Set out</button>${st === 'cleared' && !opening ? `<button class="btn" data-act="sides" data-id="${id}">Side missions <small>${esc(G.hud.key('shift'))}</small></button>` : ''}${d.missions.keep?.cleared && !opening ? `<button class="btn" data-act="underbriar">The Underbriar <small>${esc(G.hud.key('heal'))} · deepest ${d.abyss?.best || 0}</small></button>` : ''}${back}</div>
          <div class="foot">${keys}</div>
        </div>
        <div class="owfade"></div>`;
    } else if (screen === 'sides') {
      // A cleared mission's side missions (sides.js), over the Crossroads.
      const d = G.save.data, L = G.LEVELS[data.m];
      const rows = sidesOf(data.m).map(S => {
        const n = d.sides?.[S.id] || 0, lv = L.level + S.lvl + d.ng * 20;
        return `<button class="btn side" data-act="side" data-m="${data.m}" data-id="${S.id}"><span class="kicker">${esc(S.kindName)} · Lv ${lv}+${n ? ` · done ×${n}` : ' · first run: double Glimmer and an extra piece'}</span><b>${esc(S.name.replace(/^[^:]*: /, ''))}</b><small>${esc(S.desc)}</small></button>`;
      }).join('');
      h = `<div class="panel wide sides"><div class="kicker">${esc(L.name)} · side missions</div><h2>Side Missions</h2>
        <div class="map">${rows}</div>
        <p class="dim">A side run keeps its own Moonwells and leaves the mission's own as they were. Spoils: Glimmer and gear of Rare or better; its gatekeeper or Revenant always leaves its Soul Core.</p>
        <div class="btns"><button class="btn" data-act="back">Back</button></div></div>`;
    } else if (screen === 'underbriar') {
      // The endless maze under the Crossroads: start from the first depth or any lit Moonwell reached.
      const a = G.save.data.abyss || { cps: [1], best: 0 };
      const rows = [...a.cps].sort((x, y) => y - x).map(cp => {
        const L = G.LEVELS[themeOf(cp)];
        return `<button class="btn side" data-act="descend" data-depth="${cp}"><span class="kicker">Depth ${cp} · Lv ${Math.round(1 + (cp - 1) * 2.3) + G.save.data.ng * 20}+${cp === 1 ? ' · the beginning' : ' · a lit Moonwell'}</span><b>Descend from Depth ${cp}</b><small>Its halls are dressed as ${esc(L.name)}'s.</small></button>`;
      }).join('');
      h = `<div class="panel wide sides"><div class="kicker">Beneath the Fae Crossroads · deepest cleared: ${a.best || 0}</div><h2>The Underbriar</h2>
        <p>An endless maze where everything the moon ever lit goes to dream, made anew at every depth. Slay every foe on a depth to open the way down; every fifth depth ends with a warlord, and the depth after it holds a lit Moonwell to start from again. The deeper, the harder, and the richer.</p>
        <div class="map">${rows}</div>
        <div class="btns"><button class="btn" data-act="back">Back</button></div></div>`;
    } else if (screen === 'sidecleared') {
      const S = SIDES[data.id], g = G.save.data.gear, got = data.spoils.map(uid => g.items.find(it => it.uid === uid)).filter(Boolean);
      h = `<div class="panel ending"><div class="kicker">Side mission complete${data.first ? ' · first time' : ''}</div><h1>${esc(S.name.replace(/^[^:]*: /, '').toUpperCase())}</h1>
        <p>${esc(S.desc)}</p>
        <div class="lv"><div><small>Spoils</small><b class="gold">${data.gl.toLocaleString()} Glimmer</b></div>${got.map(it => `<div><small>${esc(RARITY[it.rar].name)} · Lv ${it.lvl}</small><b style="color:#${RARITY[it.rar].color.toString(16).padStart(6, '0')}">${esc(itemName(it, w => WEAPONS[w]?.name || w))}</b></div>`).join('')}</div>
        <div class="btns"><button class="btn" data-act="missions">Onward</button></div></div>`;
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
      h = `<div class="panel wide missions journal"><div class="kicker">Journal · ${d.letters.length} letters · ${d.pixies.length} Lost Pixies freed (+${d.pixies.length}% health and stamina)</div><h2>What the paths remember</h2>
        <div class="map">${rows}</div>
        <div class="btns"><button class="btn" data-act="back">Back</button></div></div>`;
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
            <small>${esc(W.desc)}</small>${W.mech ? `<small><b class="mech">${esc(W.mech)}</b>: ${esc(W.mechDesc)}</small>` : ''}<small class="dim">${esc(forms)}${rank ? ` · +${Math.round(rank * FORGE.per * 100)}% damage` : ''}</small>${gw ? `<small>Gear: <span style="color:#${RARITY[gw.rar].color.toString(16).padStart(6, '0')}">${esc(itemName(gw, id => G.player.weaponName(id)))}</span> · Lv ${gw.lvl} · ×${weaponMul(gw).toFixed(2)}</small>` : ''}</div>
          <div class="abtns"><button class="btn small" data-act="wield" data-w="${w}" ${inHand ? 'disabled' : ''}>${inHand ? 'Wielded' : 'Take in hand'}</button>${forge}</div></div>`;
      }).join('');
      // The ranged weapon carried: one at a time.
      const rrows = (d.ranged || ['wisp']).map(r => {
        const R = RANGED[r], on = d.rangedSel === r;
        return `<div class="arm ${on ? 'hand' : ''}"><div class="ainfo"><b>${esc(R.name)}</b><span class="mtag ${on ? 'cleared' : 'sealed'}">${on ? 'Carried' : 'Stowed'}</span>
          <small>${esc(R.desc)}</small><small class="dim">${R.ammo ? `${R.ammo} ${{ bow: 'arrows', rifle: 'shot', cannon: 'shells' }[r]}, refilled at Moonwells` : 'No ammunition: it overheats'}</small></div>
          <div class="abtns"><button class="btn small" data-act="ready" data-r="${r}" ${on ? 'disabled' : ''}>${on ? 'Carried' : 'Carry'}</button></div></div>`;
      }).join('');
      h = `<div class="panel wide arsenal"><div class="kicker">Arsenal · ${d.arms.length} weapons found · two carried</div><h2>What will you fight with?</h2>
        <div class="map">${rows}<div class="kicker rhead">Ranged · one carried · aim with ${esc(G.hud.key('aim'))}</div>${rrows}</div>
        <p class="dim">${data.forge ? `Glimmer: ${sv.glimmer.toLocaleString()}. Each forging adds 5% damage with that weapon, up to +10.` : 'Weapons can be forged stronger at any Moonwell.'} Switch between your two weapons with ${esc(G.hud.key('swap'))}.</p>
        <div class="btns"><button class="btn" data-act="back">Back</button></div></div>`;
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
      h = `<div class="panel wide moves"><div class="kicker">Movesets</div><h2>${esc(Wp.name)}</h2><div class="tabs">${tabs}</div>
        <div class="forms">${forms}</div>
        <div class="kit">${Wp.mech ? `<p><em>${esc(Wp.mech)}</em>${esc(Wp.desc)} ${esc(Wp.mechDesc)}.</p>` : `<p><em>The weapon</em>${esc(Wp.desc)}</p>`}<p><em>Finishers</em>strike then heavy: <b>${nm(K.fin[0])}</b> · two strikes then heavy: <b>${nm(K.fin[1])}</b> · three or more: <b>${nm(K.fin[2])}</b>. A finisher spends the combo counter: the more hits counted, the harder it lands (up to 1.8×).</p>
          <p><em>On the move</em>at a sprint, strike: ${nm(Wp.run)} · out of a dash: ${nm(Wp.dash)} (the chain carries on through dashes) · from a slide: <b>${nm(K.slide)}</b></p>
          <p><em>Skills</em>${[['back', 'Backstep Strike'], ['counter', 'Guard Counter'], ['airFin', 'Air Finisher'], ['skill', 'Weapon Skill']].map(([k, n]) => { const t = TREE.find(x => x.move === k), has = G.save.data.mastery?.[w]?.learned.includes(t.id); return `${n}: <b>${nm(SKILL_KITS[w][k])}</b>${has ? '' : ' <span class="dim">(not yet learned)</span>'}`; }).join(' · ')}</p>
          <p><em>Combo</em>every 12 hits in a row add 6% damage, up to +24%. A blow taken halves the count; four seconds without a hit clears it.</p></div>
        <div class="btns"><button class="btn" data-act="back">Back</button></div></div>`;
    } else if (screen === 'gear') {
      // Gear found: weapons by kind, armour by slot. Equip, or dismantle for Glimmer.
      const d = G.save.data, g = d.gear, p = G.player, wn = id => p.weaponName(id), worn = new Set([...Object.values(g.equip.weapons), ...Object.values(g.equip.armor)]);
      const col = r => '#' + RARITY[r].color.toString(16).padStart(6, '0');
      const row = it => {
        const on = worn.has(it.uid), stat = it.kind === 'weapon' ? `×${weaponMul(it).toFixed(2)} damage` : `${armorDef(it)} defence`;
        return `<div class="arm ${on ? 'hand' : ''}"><div class="ainfo"><b style="color:${col(it.rar)}">${esc(itemName(it, wn))}</b>
          <span class="mtag ${on ? 'cleared' : 'sealed'}">${on ? 'Equipped · ' : ''}${RARITY[it.rar].name} · Lv ${it.lvl} · ${stat}</span>
          ${it.fx.map(([id, v]) => `<small>${esc(fxText(id, v))}</small>`).join('')}${it.set ? `<small class="dim">${esc(SETS[it.set].name)} set</small>` : ''}</div>
          <div class="abtns">${on ? '<button class="btn small" disabled>Equipped</button>' : `<button class="btn small" data-act="equipGear" data-uid="${it.uid}">${it.kind === 'weapon' ? 'Wield' : 'Wear'}</button><button class="btn small" data-act="dismantle" data-uid="${it.uid}">Dismantle <small>${dismantleValue(it)} Glimmer</small></button>`}${data.forge ? `<button class="btn small" data-act="smith" data-uid="${it.uid}">Forge <small>reforge · soul-match</small></button>` : ''}</div></div>`;
      };
      const sort = (a, b) => (worn.has(b.uid) - worn.has(a.uid)) || (b.lvl * 10 + b.rar) - (a.lvl * 10 + a.rar);
      let body = '', tabs2 = '';
      if (data.tab === 'cores') {
        const slots = d.coreSlots || [null, null], owned = Object.keys(d.cores || {}).filter(id => CORES[id]);
        const keyOf = i => `${G.hud.key('shift')} + ${G.hud.key(i ? 'heavy' : 'light')}`;
        const pas = id => { const C = CORES[id], gr = Math.min(CORE_MAX, d.cores[id]); return fxText(C.fx[0], Math.round(C.fx[1] * (1 + (gr - 1) * .15))); };
        body = `<div class="gsum">${slots.map((id, i) => `<small>Slot ${i + 1} · <b>${esc(keyOf(i))}</b> · ${id ? `<span class="on">${esc(CORES[id].name)}</span>: ${esc(CORES[id].skillName)} (${CORES[id].cost} Faelight)` : '<span class="dim">empty</span>'}</small>`).join('')}</div>`
          + (owned.length ? owned.sort((a, b) => slots.includes(b) - slots.includes(a)).map(id => {
            const C = CORES[id], gr = Math.min(CORE_MAX, d.cores[id]), at = slots.indexOf(id);
            return `<div class="arm ${at >= 0 ? 'hand' : ''}"><div class="ainfo"><b style="color:#c89aff">${esc(C.name)}${gr > 1 ? ` <span class="rank">+${gr - 1}</span>` : ''}</b>
              <span class="mtag ${at >= 0 ? 'cleared' : 'sealed'}">${at >= 0 ? `Set in slot ${at + 1}` : 'Held'} · ${C.cost} Faelight</span>
              <small><b>${esc(C.skillName)}</b>: ${esc(C.desc)}.</small><small>Passive: ${esc(pas(id))}</small></div>
              <div class="abtns">${[0, 1].map(i => `<button class="btn small" data-act="setCore" data-slot="${i}" data-core="${id}" ${slots[i] === id ? 'disabled' : ''}>Set in slot ${i + 1}</button>`).join('')}${at >= 0 ? `<button class="btn small" data-act="setCore" data-slot="${at}" data-core="">Take out</button>` : ''}</div></div>`;
          }).join('') : '<p class="dim">No Soul Cores yet. Foes leave them sometimes, elites often, and every gatekeeper and warlord always.</p>');
      } else if (data.tab === 'weapons') {
        const w = d.arms.includes(data.w) ? data.w : d.arms[0];
        tabs2 = d.arms.map(id => `<button class="btn tab${id === w ? ' on' : ''}" data-act="gearW" data-w="${id}">${esc(wn(id))} <span class="dim">${g.items.filter(it => it.type === id).length}</span></button>`).join('');
        const list = g.items.filter(it => it.type === w).sort(sort);
        body = (g.equip.weapons[w] ? '' : `<p class="dim">No ${esc(wn(w))} of any rarity yet: the one you carry hits at ×1.00. Foes drop better ones.</p>`) + list.map(row).join('');
      } else {
        const slot = SLOTS.includes(data.slot) ? data.slot : 'body', st = p.gear || { def: 0, sets: {}, bonus: new Set() };
        tabs2 = SLOTS.map(s => `<button class="btn tab${s === slot ? ' on' : ''}" data-act="gearSlot" data-slot="${s}">${SLOT_NAME[s]} <span class="dim">${g.items.filter(it => it.slot === s).length}</span></button>`).join('');
        const sets = Object.entries(st.sets).map(([id, n]) => `<small><b>${esc(SETS[id].name)}</b> ${n} / 4 · two: <span class="${n >= 2 ? 'on' : 'dim'}">${esc(SETS[id].two)}</span> · four: <span class="${n >= 4 ? 'on' : 'dim'}">${esc(SETS[id].four)}</span></small>`).join('');
        body = `<div class="gsum"><small>Defence <b>${st.def}</b> · blows land for ${Math.round(defReduce(st.def) * 100)}% less</small>${sets}</div>` + g.items.filter(it => it.slot === slot).sort(sort).map(row).join('');
      }
      h = `<div class="panel wide arsenal gear"><div class="kicker">Gear · pack ${g.items.length} / ${PACK}</div><h2>${{ weapons: 'Weapons', cores: 'Soul Cores' }[data.tab] || 'Armour'}</h2>
        <div class="tabs"><button class="btn tab${data.tab === 'armor' ? ' on' : ''}" data-act="gearTab" data-tab="armor">Armour</button><button class="btn tab${data.tab === 'weapons' ? ' on' : ''}" data-act="gearTab" data-tab="weapons">Weapons</button><button class="btn tab${data.tab === 'cores' ? ' on' : ''}" data-act="gearTab" data-tab="cores">Soul Cores</button></div>
        <div class="tabs sub">${tabs2}</div>
        <div class="map">${body || '<p class="dim">Nothing here yet.</p>'}</div>
        ${data.forge ? '' : '<p class="dim">Reforge and soul-match gear at any Moonwell.</p>'}
        <div class="btns row"><button class="btn small" data-act="dismantleBelow" data-rar="0">Dismantle all Common</button><button class="btn small" data-act="dismantleBelow" data-rar="1">Dismantle all Common and Fine</button></div>
        <div class="btns"><button class="btn" data-act="back">Back</button></div></div>`;
    } else if (screen === 'smith') {
      // The Moonwell's forge: reroll an effect, or raise the piece's level with another of its kind.
      const d = G.save.data, g = d.gear, p = G.player, it = g.items.find(x => x.uid === data.uid), wn = id => p.weaponName(id);
      if (!it) { h = '<div class="panel"><p class="dim">That piece is gone.</p><div class="btns"><button class="btn" data-act="back">Back</button></div></div>'; }
      else {
        const col = '#' + RARITY[it.rar].color.toString(16).padStart(6, '0'), rc = reforgeCost(it), worn = new Set([...Object.values(g.equip.weapons), ...Object.values(g.equip.armor)]);
        const fod = g.items.filter(x => x !== it && !worn.has(x.uid) && x.lvl > it.lvl && (it.kind === 'weapon' ? x.type === it.type : x.slot === it.slot)).sort((a, b) => b.lvl - a.lvl).slice(0, 8);
        h = `<div class="panel wide arsenal gear"><div class="kicker">The Moonwell's forge · Glimmer ${G.save.glimmer.toLocaleString()}</div><h2 style="color:${col}">${esc(itemName(it, wn))}</h2>
          <p class="dim">${RARITY[it.rar].name} · Lv ${it.lvl} · ${it.kind === 'weapon' ? `×${weaponMul(it).toFixed(2)} damage` : `${armorDef(it)} defence`}</p>
          <div class="map"><div class="kicker rhead">Reforge: roll one effect anew · ${rc.toLocaleString()} Glimmer each</div>
          ${it.fx.length ? it.fx.map(([id, v], i) => `<div class="arm"><div class="ainfo"><small>${esc(fxText(id, v))}</small></div><div class="abtns"><button class="btn small" data-act="reforge" data-i="${i}" ${G.save.glimmer >= rc ? '' : 'disabled'}>Reforge</button></div></div>`).join('') : '<p class="dim">A Common piece has no effects to reforge.</p>'}
          <div class="kicker rhead">Soul Match: raise it to another piece's level (that piece is consumed)</div>
          ${fod.length ? fod.map(x => { const c = soulMatchCost(it, x); return `<div class="arm"><div class="ainfo"><small>To Lv <b>${x.lvl}</b>, consuming ${esc(itemName(x, wn))}</small></div><div class="abtns"><button class="btn small" data-act="soulmatch" data-from="${x.uid}" ${G.save.glimmer >= c ? '' : 'disabled'}>Soul Match <small>${c.toLocaleString()} Glimmer</small></button></div></div>`; }).join('') : '<p class="dim">No higher-level piece of this kind to match it with (worn pieces are never consumed).</p>'}</div>
          <div class="btns"><button class="btn" data-act="back">Back</button></div></div>`;
      }
    } else if (screen === 'deeds') {
      // Deeds: long goals across every mission, Way and depth (deeds.js).
      const list = G.deedsView(), earned = list.reduce((a, r) => a + r.tier, 0);
      const rows = list.map(({ D, n, tier }) => {
        const next = D.tiers[tier], pct = next ? Math.min(100, n / next * 100) : 100;
        return `<div class="arm deed ${tier ? 'hand' : ''}"><div class="ainfo"><b>${esc(D.name)} <span class="rank">${tier ? TIER[tier - 1] : ''}</span></b>
          <span class="mtag ${tier === 3 ? 'cleared' : 'sealed'}">${esc(D.desc)} · ${n.toLocaleString()}${next ? ` / ${next.toLocaleString()}` : ' · complete'}</span>
          <s class="dbar"><u style="width:${pct}%"></u></s>
          <small>Each tier: ${esc(fxText(D.fx[0], D.fx[1]))}, for good${next ? ` · next pays ${DEED_GLIMMER[tier].toLocaleString()} Glimmer` : ''}</small></div></div>`;
      }).join('');
      h = `<div class="panel wide arsenal deeds"><div class="kicker">Deeds · ${earned} of ${list.length * 3} tiers earned</div><h2>Deeds</h2>
        <div class="map">${rows}</div>
        <div class="btns"><button class="btn" data-act="back">Back</button></div></div>`;
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
      h = `<div class="panel wide skills"><div class="kicker">Skills · learned with use</div><h2>${esc(Wn)}</h2><div class="tabs">${tabs}</div>
        <div class="mastery"><span>Mastery ${Math.floor(m.xp).toLocaleString()}</span><i><b style="width:${Math.round(frac * 100)}%"></b></i><span>${free} of ${earned} skill point${earned === 1 ? '' : 's'} to spend · next at ${next.toLocaleString()}</span></div>
        <div class="tree">${tiers}</div>
        <p class="dim">Every blow landed with a weapon teaches it a little; felling a foe teaches more. Skills can be learned anywhere.</p>
        <div class="btns"><button class="btn" data-act="back">Back</button></div></div>`;
    } else if (screen === 'letter') {
      const L = G.LEVELS[data.m], l = (L.letters || []).find(x => x.id === data.id);
      h = `<div class="panel wide"><div class="kicker">${esc(L.name)}</div><h2>${esc(l.title)}</h2>
        <div class="parchment"><p>${esc(l.text)}</p></div>
        <div class="btns"><button class="btn" data-act="back">Back</button></div></div>`;
    } else if (screen === 'charms') {
      const d = G.save.data, worn = d.equipped;
      const rows = d.charms.map(id => {
        const c = CHARMS[id], on = worn.includes(id), full = !on && worn.length >= CHARM_SLOTS;
        return `<button class="btn mission charm ${on ? 'on' : ''}" data-act="charm" data-id="${id}">
          <span class="node" style="color:${c.color};border-color:${c.color}">◆</span><span class="mtext"><b>${esc(c.name)}</b><small>${esc(c.desc)}</small></span>
          <span class="mtag ${on ? 'cleared' : 'sealed'}">${on ? 'Worn' : full ? '' : 'Wear'}</span></button>`;
      }).join('');
      h = `<div class="panel wide missions charms"><div class="kicker">Charms · ${worn.length} of ${CHARM_SLOTS} worn</div><h2>What will you carry?</h2>
        <div class="map">${rows}</div>
        <p class="dim">${d.charms.length} of ${Object.keys(CHARMS).length} found. Charms lie hidden in the missions, and every gatekeeper and warlord guards one.</p>
        <div class="btns"><button class="btn" data-act="back">Back</button></div></div>`;
    } else if (screen === 'ending') {
      const sv = G.save, m = Math.floor(sv.time / 60), s = Math.floor(sv.time % 60);
      h = `<div class="panel ending"><h1>${esc(G.level.endingTitle || 'THE PATHS ARE STILL')}</h1>
        <p>${esc(G.level.ending || G.level.outro || '')}</p>
        <div class="lv"><div><small>Time</small><b>${m}:${String(s).padStart(2, '0')}</b></div><div><small>Deaths</small><b>${sv.deaths}</b></div><div><small>Level</small><b>${sv.level}</b></div><div><small>Way</small><b>${esc(wayName(sv.ng))}</b></div></div>
        <p class="dim">Next: <b>${esc(wayName(sv.ng + 1))}</b>. ${esc(wayDesc(sv.ng + 1))} You keep your level, gear, weapons, Soul Cores and skills; the missions begin again.</p>
        <div class="btns"><button class="btn" data-act="ngplus">Walk the ${esc(wayName(sv.ng + 1))} · New Game+</button><button class="btn" data-act="missions">Walk the Fae Crossroads</button><button class="btn" data-act="title">Return to title</button></div></div>`;
    }
    this.el.innerHTML = h;
    if (screen === 'map') G.overworld.bindLabels(this.el);
    this.focus = 0;
    if (this.top.scroll) { const m = this.el.querySelector('.map'); if (m) m.scrollTop = this.top.scroll; }
    this.paint();
  }
}
