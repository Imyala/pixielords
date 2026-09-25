// Full-screen menus: title, pause, shrine (rest, level up, travel), charms, the Fae Crossroads map overlay,
// controls, movesets, the Journal, settings and the cleared / ending screens.
// Mouse, keyboard (arrows + Enter/Esc) and gamepad (d-pad + A/B) all work.
import { derive, ATK, WEAPONS } from './player.js';
import { FORMS, KIT } from './movesets.js';
import { levelCost, forgeCost, FORGE } from './save.js';
import { CHARMS, CHARM_SLOTS } from './charms.js';
import { roman } from './overworld.js';

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
  ['Charge a heavy (Moonglaive)', 'Hold right click', 'Hold RT'],
  ['Launcher  ·  then strike in the air', 'Hold Shift + left click', 'Hold LB + RB'],
  ['In the air: Starfall  ·  air dash', 'Right click  ·  Space', 'RT  ·  B'],
  ['Thorn Counter', 'F', 'LT'],
  ['Lock on  ·  switch target', 'Q / middle click  ·  wheel / Tab', 'R3  ·  flick right stick'],
  ['Drink Moondew', 'R', 'X'],
  ['Interact', 'E', 'A'],
  ['Fae Shift (Faelight full)', 'G', 'Y'],
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
    const fixed = ['title', 'ending', 'cleared'].includes(this.top?.screen);
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
      case 'charms': this.push('charms'); break;
      case 'journal': this.push('journal'); break;
      case 'moves': this.push('moves', { w: G.player.weapon }); break;
      case 'arsenal': this.push('arsenal', { forge: this.top?.screen === 'shrine' }); break;
      case 'wield': { const f = this.focus; G.wieldWeapon(b.dataset.w); this.render(); this.focus = f; this.paint(); break; }
      case 'forge': { const f = this.focus; if (!G.forgeWeapon(b.dataset.w)) G.audio.sfx('ui'); this.render(); this.focus = f; this.paint(); break; }
      case 'movesW': this.top.data = { w: b.dataset.w }; this.render(); break;
      case 'letter': { const y = this.el.querySelector('.map')?.scrollTop || 0; this.top.scroll = y; this.push('letter', { m: b.dataset.m, id: b.dataset.id }); G.audio.sfx('page'); break; }
      case 'charm': { const f = this.focus; if (!G.equipCharm(b.dataset.id)) G.hud.toast('All three charm slots are worn'); const y = this.el.querySelector('.map')?.scrollTop || 0; this.render(); this.focus = f; this.paint(); const m = this.el.querySelector('.map'); if (m) m.scrollTop = y; break; }
    }
  }

  render() {
    const { screen, data } = this.top, G = this.G;
    this.el.className = 'on ' + screen;
    G.overworld?.setActive(screen === 'map');
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
        <button class="btn" data-act="arsenal">Arsenal</button><button class="btn" data-act="moves">Movesets</button><button class="btn" data-act="journal">Journal</button><button class="btn" data-act="settings">Settings</button><button class="btn" data-act="quit">Quit to title</button></div>
        <p class="dim">Progress is saved each time you rest at a Moonwell or vanquish a warlord.</p></div>`;
    } else if (screen === 'controls') {
      h = `<div class="panel wide"><h2>Controls</h2><table class="ctl"><tr><th></th><th>Keyboard + mouse</th><th>Gamepad</th></tr>
        ${CONTROLS.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table>
        <div class="tips">
          <p><b>Stamina</b> fuels strikes, dashes and blocked blows. Run dry and you stagger, out of breath.</p>
          <p><b>Resonance</b>: as a strike ends, blue light gathers around you. Tap guard then and the stamina you spent flows back. Change stance in that moment for a Resonant Shift.</p>
          <p><b>Forms</b>: every weapon fights its own way in each stance (High hits hardest, Mid is balanced, Low is quick). Strike standing still and strike on the move for two different chains. Two strikes in, wait for the blade to glint, then strike: the form's <b>pause combo</b>. Strike then heavy for a <b>finisher</b>, chosen by how many strikes came first; it spends the combo counter for extra damage. See <b>Movesets</b> for every form.</p>
          <p><b>Arsenal</b>: you carry two weapons at a time; choose them in the Arsenal (pause menu or any Moonwell), and forge them stronger at a Moonwell. The <b>Thornhammer</b> is Stalwart (blows can't stagger its swings); the <b>Starfists</b> punch and kick, and every hit wins back stamina.</p>
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
          <button class="btn" data-act="moves">Movesets <small>each weapon's forms, combos and finishers</small></button>
          <button class="btn" data-act="journal">Journal <small>${sv.data.letters.length} letters · ${sv.data.pixies.length} Lost Pixies freed</small></button>
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
          <div class="kicker">The Fae Crossroads · ${roman(i + 1)} · Lv ${L.level}+</div>
          <h2>${shown ? esc(L.name) : 'Sealed'}</h2>
          ${opening ? '<div class="kicker">A new path opens</div>' : ''}
          <p>${esc(shown ? L.blurb : prev ? `The path is not yet open. Clear ${prev.name} to find the way.` : 'The path is not yet open.')}</p>
          ${shown ? `<div class="owstats"><span class="mtag ${st}">${{ cleared: 'Cleared', inprogress: 'In progress', new: 'New' }[st]}</span><span>Moonwells ${m.kindled.length} / ${Object.keys(L.shrines).length}</span><span>Charms ${found} / ${charms.length + trophies.length}</span><span>Letters ${(L.letters || []).filter(l => d.letters.includes(id + ':' + l.id)).length} / ${(L.letters || []).length}</span><span>Pixies ${(L.pixies || []).filter(q => d.pixies.includes(id + ':' + q.id)).length} / ${(L.pixies || []).length}</span></div>` : ''}
          <div class="btns"><button class="btn" data-act="setout" data-id="${id}" ${shown && !opening ? '' : 'disabled'}>Set out</button>${back}</div>
          <div class="foot">${keys}</div>
        </div>
        <div class="owfade"></div>`;
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
        const forge = !data.forge ? '' : rank >= FORGE.max ? '<button class="btn small" disabled>Forged to +10</button>'
          : `<button class="btn small" data-act="forge" data-w="${w}" ${sv.glimmer >= cost ? '' : 'disabled'}>Forge to +${rank + 1} <small>${cost.toLocaleString()} Glimmer</small></button>`;
        return `<div class="arm ${inHand ? 'hand' : onBack ? 'back' : ''}"><div class="ainfo"><b>${esc(W.name)}${rank ? ` <span class="rank">+${rank}</span>` : ''}</b>
            <span class="mtag ${inHand || onBack ? 'cleared' : 'sealed'}">${inHand ? 'In hand' : onBack ? 'On your back' : 'Stowed'}</span>
            <small>${esc(W.desc)}</small>${W.mech ? `<small><b class="mech">${esc(W.mech)}</b>: ${esc(W.mechDesc)}</small>` : ''}<small class="dim">${esc(forms)}${rank ? ` · +${Math.round(rank * FORGE.per * 100)}% damage` : ''}</small></div>
          <div class="abtns"><button class="btn small" data-act="wield" data-w="${w}" ${inHand ? 'disabled' : ''}>${inHand ? 'Wielded' : 'Take in hand'}</button>${forge}</div></div>`;
      }).join('');
      h = `<div class="panel wide arsenal"><div class="kicker">Arsenal · ${d.arms.length} weapons found · two carried</div><h2>What will you fight with?</h2>
        <div class="map">${rows}</div>
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
          <p><em>Combo</em>every 12 hits in a row add 6% damage, up to +24%. A blow taken halves the count; four seconds without a hit clears it.</p></div>
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
        <div class="lv"><div><small>Time</small><b>${m}:${String(s).padStart(2, '0')}</b></div><div><small>Deaths</small><b>${sv.deaths}</b></div><div><small>Level</small><b>${sv.level}</b></div><div><small>Cycle</small><b>${sv.ng + 1}</b></div></div>
        <div class="btns"><button class="btn" data-act="ngplus">Journey again · New Game+</button><button class="btn" data-act="missions">Walk the Fae Crossroads</button><button class="btn" data-act="title">Return to title</button></div></div>`;
    }
    this.el.innerHTML = h;
    if (screen === 'map') G.overworld.bindLabels(this.el);
    this.focus = 0;
    if (this.top.scroll) { const m = this.el.querySelector('.map'); if (m) m.scrollTop = this.top.scroll; }
    this.paint();
  }
}
