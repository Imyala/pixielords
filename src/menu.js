// Full-screen menus: title, pause, shrine (rest, level up, travel), controls, settings, ending.
// Mouse, keyboard (arrows + Enter/Esc) and gamepad (d-pad + A/B) all work.
import { derive } from './player.js';
import { levelCost } from './save.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const STATS = [
  { k: 'vit', name: 'Vitality', desc: 'Maximum health' },
  { k: 'end', name: 'Endurance', desc: 'Maximum Ki' },
  { k: 'str', name: 'Strength', desc: 'Weapon damage' },
  { k: 'spi', name: 'Spirit', desc: 'Anima gain and Fae Shift length' },
];

const CONTROLS = [
  ['Move', 'W A S D', 'Left stick'],
  ['Camera', 'Mouse', 'Right stick'],
  ['Light attack', 'Left click', 'RB'],
  ['Heavy attack', 'Right click', 'RT'],
  ['Guard  ·  tap for Ki Pulse', 'Shift', 'LB'],
  ['Dodge  ·  hold to sprint', 'Space', 'B'],
  ['Burst Counter', 'F', 'LT'],
  ['Lock on  ·  switch target', 'Q / middle click  ·  wheel / Tab', 'R3  ·  flick right stick'],
  ['Drink elixir', 'R', 'X'],
  ['Interact', 'E', 'A'],
  ['Fae Shift (Anima full)', 'G', 'Y'],
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
  paint() { this.items().forEach((b, i) => b.classList.toggle('focus', i === this.focus)); }

  show(screen, data) { this.stack = [{ screen, data }]; this.G.hud?.clearOverlays(); this.render(); }
  push(screen, data) { this.stack.push({ screen, data }); this.render(); }
  pop() { this.stack.pop(); if (this.stack.length) this.render(); else this.close(); }
  close() { this.stack = []; this.el.className = ''; this.el.innerHTML = ''; this.G.onMenuClosed?.(); }

  // Keyboard / gamepad navigation.
  nav(inp) {
    if (!this.open) return;
    const list = this.items();
    if (inp.hit('up')) { this.focus = (this.focus - 1 + list.length) % list.length; this.paint(); this.G.audio.sfx('ui'); }
    if (inp.hit('down')) { this.focus = (this.focus + 1) % list.length; this.paint(); this.G.audio.sfx('ui'); }
    const cur = list[this.focus];
    if (cur?.dataset.set && cur.type === 'range') {
      const step = +cur.step || .05;
      if (inp.hit('left')) { cur.value = +cur.value - step; cur.dispatchEvent(new Event('input', { bubbles: true })); }
      if (inp.hit('right')) { cur.value = +cur.value + step; cur.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    if (inp.hit('confirm') && cur) { cur.click(); }
    if (inp.hit('back') && this.top?.screen !== 'title' && this.top?.screen !== 'ending') {
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
          ${has ? `<button class="btn" data-act="continue" ${ready ? '' : 'disabled'}>Continue <small>${esc(G.save.summary())}</small></button>` : ''}
          <button class="btn" data-act="new" ${ready ? '' : 'disabled'}>New Game</button>
          <button class="btn" data-act="controls">Controls</button>
          <button class="btn" data-act="settings">Settings</button>
          <a class="btn link" href="library.html">Asset Library ↗</a>
        </div>
        <div class="foot">Keyboard + mouse or a gamepad · best with headphones</div>
      </div>`;
    } else if (screen === 'confirm') {
      h = `<div class="panel"><h2>Begin anew?</h2><p>Your current journey will be forgotten.</p>
        <div class="btns"><button class="btn" data-act="newYes">Begin a new journey</button><button class="btn" data-act="back">Keep my journey</button></div></div>`;
    } else if (screen === 'pause') {
      h = `<div class="panel"><h2>Paused</h2>
        <div class="btns"><button class="btn" data-act="resume">Resume</button><button class="btn" data-act="controls">Controls</button>
        <button class="btn" data-act="settings">Settings</button><button class="btn" data-act="quit">Quit to title</button></div>
        <p class="dim">Progress is saved each time you rest at a shrine or fell a lord.</p></div>`;
    } else if (screen === 'controls') {
      h = `<div class="panel wide"><h2>Controls</h2><table class="ctl"><tr><th></th><th>Keyboard + mouse</th><th>Gamepad</th></tr>
        ${CONTROLS.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table>
        <div class="tips">
          <p><b>Ki</b> is your stamina. Strikes, dodges and blocked blows spend it; run dry and you stagger, out of breath.</p>
          <p><b>Ki Pulse</b>: as a strike ends, blue light gathers around you. Tap guard then to take back the Ki you spent. Tap while it's brightest for a perfect pulse.</p>
          <p><b>Burst attacks</b> glow red and can't be guarded. Dodge them, or press Burst Counter as they land to shatter the foe's Ki.</p>
          <p>Break a foe's <b>Ki</b> and it reels. Strike it then to <b>Grapple</b> for a killing blow. Unaware foes can be struck in the back.</p>
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
        <div class="btns"><button class="btn" data-act="back">Back</button></div></div>`;
    } else if (screen === 'shrine') {
      const sv = G.save, p = G.player, lvl = sv.level, cost = levelCost(lvl);
      const cur = derive(sv.stats);
      const rows = STATS.map(st => {
        const next = { ...sv.stats, [st.k]: sv.stats[st.k] + 1 }, d = derive(next);
        const gain = st.k === 'vit' ? `+${d.maxHp - cur.maxHp} health` : st.k === 'end' ? `+${d.maxKi - cur.maxKi} Ki` : st.k === 'str' ? `+${Math.round((d.dmgMul - cur.dmgMul) * 100)}% damage` : `+${Math.round((d.animaGain - cur.animaGain) * 100)}% Anima, +1s shift`;
        return `<div class="stat"><div><b>${st.name}</b> <span class="val">${sv.stats[st.k]}</span><small>${st.desc} · ${gain}</small></div>
          <button class="btn plus" data-act="level" data-stat="${st.k}" ${sv.amrita >= cost ? '' : 'disabled'}>+</button></div>`;
      }).join('');
      const other = Object.values(G.shrines).filter(s => s.id !== data.id && sv.kindled.includes(s.id));
      h = `<div class="panel shrine"><h2>${esc(data.name)}</h2>
        <div class="lv"><div><small>Level</small><b>${lvl}</b></div><div><small>Amrita</small><b class="gold">${sv.amrita.toLocaleString()}</b></div><div><small>Next level</small><b>${cost.toLocaleString()}</b></div></div>
        <div class="derived">Health ${p.maxHp} · Ki ${p.maxKi} · Damage ×${p.dmgMul.toFixed(2)} · Elixirs ${sv.elixirMax}</div>
        ${rows}
        <div class="btns">
          ${other.map(s => `<button class="btn" data-act="travel" data-shrine="${s.id}">Travel to ${esc(s.name)}</button>`).join('')}
          <button class="btn" data-act="leave">Rise</button>
        </div>
        <p class="dim">Resting mends you, refills your elixirs, and calls every fallen foe back to the keep.</p></div>`;
    } else if (screen === 'ending') {
      const sv = G.save, m = Math.floor(sv.time / 60), s = Math.floor(sv.time % 60);
      h = `<div class="panel ending"><h1>THE WARREN IS STILL</h1>
        <p>Gnawfang is dust upon his throne. The Pixie Gate hums with a light older than the keep. Beyond it lie other halls and other lords, waiting.</p>
        <div class="lv"><div><small>Time</small><b>${m}:${String(s).padStart(2, '0')}</b></div><div><small>Deaths</small><b>${sv.deaths}</b></div><div><small>Level</small><b>${sv.level}</b></div><div><small>Cycle</small><b>${sv.ng + 1}</b></div></div>
        <div class="btns"><button class="btn" data-act="ngplus">Journey again · New Game+</button><button class="btn" data-act="title">Return to title</button></div></div>`;
    }
    this.el.innerHTML = h;
    this.focus = 0;
    this.paint();
  }
}
