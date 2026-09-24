// In-game HUD, drawn with DOM elements over the canvas.
import * as THREE from 'three';
import { KEY_LABEL, PAD_LABEL } from './input.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class HUD {
  constructor(G) {
    this.G = G;
    const el = this.el = document.getElementById('hud');
    el.innerHTML = `
      <div class="stats">
        <div class="bar hp"><i class="trail"></i><i class="fill"></i></div>
        <div class="bar ki"><i class="pool"></i><i class="fill"></i></div>
        <div class="bar anima"><i class="fill"></i><span class="ready">G · FAE SHIFT</span></div>
        <div class="stance"><span data-s="high">▲</span><span data-s="mid">◆</span><span data-s="low">▼</span><b>Mid</b><small></small></div>
        <div class="weapon"><b>Fae Sword</b><small></small></div>
        <div class="status"><span class="poison" hidden>☠ Poisoned</span><span class="snared" hidden>⛓ Snared</span><span class="burning" hidden>🔥 Burning</span><span class="pbuild"><i></i></span></div>
      </div>
      <div class="elixir"><div class="flask"><i></i></div><b>0</b><small class="key heal"></small></div>
      <div class="glimmer"><span class="gain"></span><div><small>GLIMMER</small><b>0</b></div></div>
      <div class="lock"></div>
      <div class="ebars"></div>
      <div class="boss" hidden><div class="bname"></div><div class="bbar"><i class="trail"></i><i class="fill"></i></div><div class="bki"><i class="fill"></i></div></div>
      <div class="prompt" hidden></div>
      <div class="toasts"></div>
      <div class="banner"><span></span></div>
      <div class="big"><span></span><em></em></div>
      <div class="flash"></div>
      <div class="edge"></div>
      <div class="msg" hidden><p></p><small></small></div>
      <div class="fade"></div>
      <div class="loadingMsg"><span>The path unfolds…</span></div>`;
    this.q = {
      hpBar: $('.bar.hp', el), hp: $('.bar.hp .fill', el), hpTrail: $('.bar.hp .trail', el),
      kiBar: $('.bar.ki', el), ki: $('.bar.ki .fill', el), pool: $('.bar.ki .pool', el),
      anima: $('.bar.anima .fill', el), animaBar: $('.bar.anima', el),
      poison: $('.poison', el), snared: $('.snared', el), burning: $('.burning', el), pbuild: $('.pbuild', el), pbuildI: $('.pbuild i', el),
      flask: $('.elixir', el), flaskN: $('.elixir b', el), flaskKey: $('.elixir .key', el),
      glimmer: $('.glimmer b', el), gain: $('.glimmer .gain', el),
      lock: $('.lock', el), ebars: $('.ebars', el),
      boss: $('.boss', el), bname: $('.bname', el), bfill: $('.bbar .fill', el), btrail: $('.bbar .trail', el), bki: $('.bki .fill', el),
      prompt: $('.prompt', el), toasts: $('.toasts', el), banner: $('.banner', el), bannerT: $('.banner span', el),
      big: $('.big', el), bigT: $('.big span', el), bigS: $('.big em', el), flash: $('.flash', el), edge: $('.edge', el),
      msg: $('.msg', el), msgP: $('.msg p', el), msgS: $('.msg small', el), fade: $('.fade', el),
    };
    this.bars = new Map();
    this.v = new THREE.Vector3();
    this.hpTrail = 1; this.bossTrail = 1; this.glimmerShown = 0; this.gainAmt = 0; this.gainT = 0;
  }

  show(on) { this.el.classList.toggle('on', on); }

  key(a) { return this.G.input.usingPad ? PAD_LABEL[a] : KEY_LABEL[a]; }

  toast(text, cls = '') {
    const d = document.createElement('div');
    d.className = 'toast ' + cls; d.textContent = text;
    this.q.toasts.appendChild(d);
    while (this.q.toasts.children.length > 3) this.q.toasts.firstChild.remove();
    setTimeout(() => d.classList.add('out'), 1400);
    setTimeout(() => d.remove(), 2000);
  }

  banner(text) {
    const b = this.q.banner;
    this.q.bannerT.textContent = text;
    b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
  }

  big(text, cls = '', dur = 4, sub = '') {
    const b = this.q.big;
    this.q.bigT.textContent = text;
    this.q.bigS.textContent = sub;
    b.className = 'big on ' + cls;
    clearTimeout(this.bigTimer);
    this.bigTimer = setTimeout(() => b.classList.remove('on'), dur * 1000);
  }

  clearOverlays() {
    this.q.big.classList.remove('on'); this.q.banner.classList.remove('on');
    this.q.toasts.innerHTML = ''; this.closeMessage(); this.prompt(null);
  }

  loading(on) { this.el.querySelector('.loadingMsg').classList.toggle('on', on); if (on) this.el.classList.add('on'); }

  fadeTo(on, sec = .8) { const f = this.q.fade; f.style.transitionDuration = sec + 's'; f.classList.toggle('on', on); }

  screenFlash(kind) {
    const f = this.q.flash;
    f.className = 'flash'; void f.offsetWidth; f.className = 'flash ' + kind;
  }

  burstWarn() {
    const e = this.q.edge;
    e.className = 'edge'; void e.offsetWidth; e.className = 'edge on';
  }

  enemyBroken(e) { this.floatText(e, 'SHATTERED', 'broken'); }

  stance(s) {
    const el = this.el.querySelector('.stance');
    for (const sp of el.querySelectorAll('span')) sp.classList.toggle('on', sp.dataset.s === s);
    el.querySelector('b').textContent = { high: 'High', mid: 'Mid', low: 'Low' }[s];
    el.dataset.s = s;
    this.stanceShown = s;
  }

  weapon(id) {
    const el = this.el.querySelector('.weapon'), p = this.G.player;
    el.querySelector('b').textContent = { sword: 'Fae Sword', glaive: 'Moonglaive' }[id] || id;
    el.dataset.w = id;
    el.querySelector('small').textContent = p.arms.length > 1 ? `${this.key('swap')} ⇄` : '';
  }

  floatText(e, text, cls) {
    const b = this.bar(e);
    const t = document.createElement('div'); t.className = 'ftext ' + cls; t.textContent = text;
    b.appendChild(t); setTimeout(() => t.remove(), 1400);
  }

  prompt(text) {
    const p = this.q.prompt;
    if (!text) { p.hidden = true; this.promptText = null; return; }
    const html = `<kbd>${esc(this.key('interact'))}</kbd> ${esc(text)}`;
    if (this.promptText !== html) { p.innerHTML = html; this.promptText = html; }
    p.hidden = false;
  }

  message(text) {
    this.q.msgP.textContent = text;
    this.q.msgS.textContent = `${this.key('interact')} to close`;
    this.q.msg.hidden = false;
  }
  closeMessage() { this.q.msg.hidden = true; }
  get messageOpen() { return !this.q.msg.hidden; }

  addGlimmer(n) { this.gainAmt += n; this.gainT = 2.5; }

  setBoss(e) { this.bossE = e; this.q.boss.hidden = !e; if (e) { this.q.bname.textContent = e.name; this.bossTrail = e.hp / e.maxHp; } }

  bar(e) {
    let b = this.bars.get(e);
    if (!b) {
      b = document.createElement('div'); b.className = 'ebar';
      b.innerHTML = '<div class="eh"><i class="trail"></i><i class="fill"></i></div><div class="ek"><i class="fill"></i></div><span class="dmg"></span>';
      b._fill = b.querySelector('.eh .fill'); b._trail = b.querySelector('.eh .trail'); b._ki = b.querySelector('.ek .fill'); b._dmg = b.querySelector('.dmg');
      b._tr = 1;
      this.q.ebars.appendChild(b); this.bars.set(e, b);
    }
    return b;
  }

  project(x, y, z) {
    const v = this.v.set(x, y, z).project(this.G.camera);
    if (v.z > 1) return null;
    return { x: (v.x * .5 + .5) * innerWidth, y: (-v.y * .5 + .5) * innerHeight };
  }

  update(dt) {
    const G = this.G, p = G.player, q = this.q;
    if (!p) return;
    // Player bars; length grows with the stat.
    q.hpBar.style.width = Math.min(46, 16 + p.maxHp / 30) + 'vw';
    q.kiBar.style.width = Math.min(36, 12 + p.maxKi / 12) + 'vw';
    const hp = Math.max(0, p.hp / p.maxHp);
    this.hpTrail = this.hpTrail > hp ? Math.max(hp, this.hpTrail - dt * .35) : hp;
    q.hp.style.transform = `scaleX(${hp})`; q.hpTrail.style.transform = `scaleX(${this.hpTrail})`;
    const ki = Math.max(0, p.ki / p.maxKi);
    q.ki.style.transform = `scaleX(${ki})`;
    q.kiBar.classList.toggle('low', p.ki < p.maxKi * .2);
    const pool = p.pulse ? Math.min(1, (Math.max(0, p.ki) + p.pulse.amount) / p.maxKi) : 0;
    q.pool.style.transform = `scaleX(${pool})`;
    q.kiBar.classList.toggle('pulse', !!p.pulse);
    q.anima.style.transform = `scaleX(${p.anima / 100})`;
    q.animaBar.classList.toggle('full', p.anima >= 100 && !p.shifted);
    q.animaBar.classList.toggle('shift', p.shifted);
    q.poison.hidden = !(p.poisoned > 0);
    q.snared.hidden = !(p.snared > 0);
    q.burning.hidden = !(this.G.time - (p.burnedT ?? -9) < .6);
    q.pbuild.style.display = p.poison > 1 && !(p.poisoned > 0) ? '' : 'none';
    q.pbuildI.style.transform = `scaleX(${p.poison / 100})`;
    q.flaskN.textContent = p.elixirs;
    q.flask.classList.toggle('empty', p.elixirs <= 0);
    q.flaskKey.textContent = this.key('heal');
    $('.ready', q.animaBar).textContent = `${this.key('shift')} · FAE SHIFT`;
    if (this.stanceShown !== p.stance) this.stance(p.stance);
    const wk = `${p.weapon}|${p.arms.length}|${this.key('swap')}`; if (this.weaponShown !== wk) { this.weaponShown = wk; this.weapon(p.weapon); }
    const sk = this.key('stance'); if (this.stanceKey !== sk) { this.stanceKey = sk; this.el.querySelector('.stance small').textContent = sk; }

    // Glimmer counter rolls up.
    const target = G.save.glimmer;
    this.glimmerShown = this.glimmerShown < target ? Math.min(target, this.glimmerShown + Math.max(1, (target - this.glimmerShown) * dt * 6)) : target;
    q.glimmer.textContent = Math.round(this.glimmerShown).toLocaleString();
    this.gainT -= dt;
    if (this.gainT > 0 && this.gainAmt) { q.gain.textContent = '+' + this.gainAmt.toLocaleString(); q.gain.style.opacity = Math.min(1, this.gainT); }
    else { q.gain.style.opacity = 0; this.gainAmt = 0; }

    // Lock-on reticle.
    const L = p.lock;
    const lp = L && this.project(L.pos.x, L.height * .55, L.pos.z);
    q.lock.style.display = lp ? '' : 'none';
    if (lp) q.lock.style.transform = `translate(${lp.x}px, ${lp.y}px)`;

    // Enemy bars above heads.
    for (const e of G.enemies) {
      const want = e.alive && !e.boss && !(e.elite && this.bossE === e) && (e.barT > 0 || e === L) && e.hp < e.maxHp + (e === L ? 1 : 0);
      let b = this.bars.get(e);
      if (!want) { if (b) b.style.display = 'none'; continue; }
      b = this.bar(e);
      const sp = this.project(e.pos.x, e.height + .35, e.pos.z);
      if (!sp) { b.style.display = 'none'; continue; }
      b.style.display = '';
      b.style.transform = `translate(${sp.x}px, ${sp.y}px)`;
      const f = Math.max(0, e.hp / e.maxHp);
      b._tr = b._tr > f ? Math.max(f, b._tr - dt * .5) : f;
      b._fill.style.transform = `scaleX(${f})`; b._trail.style.transform = `scaleX(${b._tr})`;
      b._ki.style.transform = `scaleX(${Math.max(0, e.ki / e.maxKi)})`;
      b.classList.toggle('broken', e.state === 'broken');
      b._dmg.textContent = e.dmgShown > 0 ? Math.round(e.dmgShown) : '';
    }

    // Boss bar.
    const B = this.bossE;
    if (B) {
      const f = Math.max(0, B.hp / B.maxHp);
      this.bossTrail = this.bossTrail > f ? Math.max(f, this.bossTrail - dt * .25) : f;
      q.bfill.style.transform = `scaleX(${f})`; q.btrail.style.transform = `scaleX(${this.bossTrail})`;
      q.bki.style.transform = `scaleX(${Math.max(0, B.ki / B.maxKi)})`;
      q.boss.classList.toggle('broken', B.state === 'broken');
    }
  }
}
