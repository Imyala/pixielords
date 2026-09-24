// Full-screen menus: title, pause, shrine (rest, level up, travel), controls, settings, ending.
// Mouse, keyboard (arrows + Enter/Esc) and gamepad (d-pad + A/B) all work.
import { derive } from './player.js';
import { levelCost } from './save.js';
import { CHARMS, CHARM_SLOTS } from './charms.js';

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
  ['Stance: High / Mid / Low', '1  2  3  (or C / X)', 'D-pad ↑ / ↓'],
  ['Switch weapon  ·  as a strike ends: Switch Strike', 'V', 'D-pad ←'],
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
  close() { this.stack = []; this.el.className = ''; this.el.innerHTML = ''; this.G.onMenuClosed?.(); }

  // Keyboard / gamepad navigation.
  nav(inp) {
    if (!this.open) return;
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
    const fixed = ['title', 'ending', 'cleared'].includes(this.top?.screen) || (this.top?.screen === 'missions' && this.stack.length === 1);
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
      case 'missions': this.show('missions'); break;
      case 'journey': this.push('missions', { from: 'shrine' }); break;
      case 'mission': G.startMission(b.dataset.id); break;
      case 'charms': this.push('charms'); break;
      case 'charm': { const f = this.focus; if (!G.equipCharm(b.dataset.id)) G.hud.toast('All three charm slots are worn'); const y = this.el.querySelector('.map')?.scrollTop || 0; this.render(); this.focus = f; this.paint(); const m = this.el.querySelector('.map'); if (m) m.scrollTop = y; break; }
    }
  }

  render() {
    const { screen, data } = this.top, G = this.G;
    this.el.className = 'on ' + screen;
    let h = '';
    if (screen === 'title') {
      const has = G.save.exists, ready = G.ready;
      h = `<div class="panel title">
        <h1>PIXIELORDS</h1>
        <div class="tag">A fae knight · a warren of rot · a lord upon the throne</div>
        ${ready ? '' : `<div class="loading"><i style="transform:scaleX(${G.loadProgress || 0})"></i><span>Summoning the warren… ${Math.round((G.loadProgress || 0) * 100)}%</span></div>`}
        <div class="btns">
          ${has ? `<button class="btn" data-act="continue" ${ready ? '' : 'disabled'}>Continue <small>${esc(G.save.summary(G.LEVELS))}</small></button>` : ''}
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
        <button class="btn" data-act="settings">Settings</button><button class="btn" data-act="quit">Quit to title</button></div>
        <p class="dim">Progress is saved each time you rest at a Moonwell or vanquish a warlord.</p></div>`;
    } else if (screen === 'controls') {
      h = `<div class="panel wide"><h2>Controls</h2><table class="ctl"><tr><th></th><th>Keyboard + mouse</th><th>Gamepad</th></tr>
        ${CONTROLS.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table>
        <div class="tips">
          <p><b>Stamina</b> fuels strikes, dashes and blocked blows. Run dry and you stagger, out of breath.</p>
          <p><b>Resonance</b>: as a strike ends, blue light gathers around you. Tap guard then and the stamina you spent flows back. Change stance in that moment for a Resonant Shift.</p>
          <p><b>Stances</b>: High hits hardest and slams from the air, Mid is balanced, Low is quick and ends in a dashing thrust.</p>
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
    } else if (screen === 'missions') {
      const sv = G.save;
      const rows = G.ORDER.map((id, i) => {
        const L = G.LEVELS[id], open = sv.data.unlocked.includes(id), st = sv.data.missions[id];
        const tag = !open ? 'Sealed' : st?.cleared ? 'Cleared' : st?.shrine ? 'In progress' : 'New';
        return `<button class="btn mission ${open ? '' : 'locked'}" data-act="mission" data-id="${id}" ${open ? '' : 'disabled'}>
          <span class="node">${i + 1}</span><span class="mtext"><b>${esc(L.name)}</b><small>${esc(open ? L.blurb : 'The path here is not yet open.')}</small></span>
          <span class="mtag ${tag.replace(' ', '').toLowerCase()}">${tag}<small>Lv ${L.level}+</small></span></button>`;
      }).join('');
      h = `<div class="panel wide missions"><div class="kicker">The Fae Crossroads</div><h2>Where does the path lead?</h2>
        <div class="map">${rows}</div>
        <div class="btns">${data?.from === 'shrine' ? '<button class="btn" data-act="back">Stay</button>' : '<button class="btn" data-act="title">Return to title</button>'}</div></div>`;
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
        <div class="btns"><button class="btn" data-act="ngplus">Journey again · New Game+</button><button class="btn" data-act="title">Return to title</button></div></div>`;
    }
    this.el.innerHTML = h;
    this.focus = 0;
    this.paint();
  }
}
