// In-game HUD, drawn with DOM elements over the canvas and styled by hud.css in the menus' moonglass and briar:
// the stance crest and bars top left, the quick-slot cross bottom left (laid out as the d-pad), Glimmer bottom
// right, and over the world foes' bars, the warlord's bar, toasts, banners and the great words.
import * as THREE from 'three';
import { icon } from './menuui.js';
import { KEY_LABEL, PAD_LABEL, PS_LABEL } from './input.js';
import { CHARMS } from './charms.js';
import { COMBO } from './movesets.js';
import { WEAPONS } from './player.js';
import { ARTS } from './arts.js';
import { RANGED } from './ranged.js';
import { CORES } from './cores.js';
import { AFFIXES } from './champions.js';
import { PATRONS } from './patrons.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class HUD {
  constructor(G) {
    this.G = G;
    const el = this.el = document.getElementById('hud');
    el.innerHTML = `
      <div class="stats">
        <div class="vitals">
          <div class="stance"><span data-s="high">▲</span><span data-s="mid">◆</span><span data-s="low">▼</span><b>Mid</b><small></small></div>
          <div class="vbars">
            <div class="bar hp"><i class="trail"></i><i class="fill"></i></div>
            <div class="bar ki"><i class="pool"></i><i class="fill"></i></div>
            <div class="bar anima"><i class="fill"></i><span class="ready">G · FAE SHIFT</span></div>
          </div>
        </div>
        <div class="weapon"><b>Fae Sword</b><small></small></div>
        <div class="charmrow"></div>
        <div class="status"><span class="poison" hidden>☠ Poisoned</span><span class="snared" hidden>⛓ Snared</span><span class="burning" hidden>🔥 Burning</span><span class="frozen" hidden>❄ Frostbitten</span><span class="pbuild"><i></i></span><span class="pbuild cbuild"><i></i></span></div>
        <div class="kin" hidden><small></small><div class="kbar"><i></i></div></div>
      </div>
      <div class="realm" hidden><b>UMBRAL REALM</b><small>stamina returns slower · foes hit harder · Faelight comes faster</small></div>
      <div class="qcross">
        <div class="q up elixir"><div class="flask"><i></i></div><b>0</b><small class="key heal"></small></div>
        <div class="q left swapq" hidden>${icon('sword')}<small class="key"></small></div>
        <div class="q down artslot" hidden><i>◆</i><em></em><small class="key"></small><div><b></b></div></div>
        <div class="q right nextq" hidden>${icon('chev')}<small class="key"></small></div>
        <span class="hub"></span>
      </div>
      <div class="rangedslot" hidden><i>➶</i><div><b></b><small></small><s><u></u></s></div></div>
      <div class="reticle" hidden><i></i><b></b></div>
      <div class="coreslots"></div>
      <div class="objective" hidden><small></small><b></b></div>
      <div class="glimmer"><span class="gain"></span><div><small>Glimmer</small><b>0</b></div></div>
      <div class="combo"><b>0</b><small>hits</small></div>
      <div class="lock"></div>
      <div class="ebars"></div>
      <div class="boss" hidden></div>
      <div class="prompt" hidden></div>
      <div class="toasts"></div>
      <div class="banner"><span></span></div>
      <div class="lbox"><i></i><i></i></div>
      <div class="big"><span></span><em></em></div>
      <div class="flash"></div>
      <div class="edge"></div>
      <div class="msg" hidden><h3></h3><p></p><em></em><small></small></div>
      <div class="fade"></div>
      <div class="loadingMsg"><span>The path unfolds…</span></div>`;
    this.q = {
      hpBar: $('.bar.hp', el), hp: $('.bar.hp .fill', el), hpTrail: $('.bar.hp .trail', el),
      kiBar: $('.bar.ki', el), ki: $('.bar.ki .fill', el), pool: $('.bar.ki .pool', el),
      anima: $('.bar.anima .fill', el), animaBar: $('.bar.anima', el),
      poison: $('.poison', el), snared: $('.snared', el), burning: $('.burning', el), pbuild: $('.pbuild', el), pbuildI: $('.pbuild i', el),
      frozen: $('.frozen', el), cbuild: $('.cbuild', el), cbuildI: $('.cbuild i', el),
      flask: $('.elixir', el), flaskN: $('.elixir b', el), flaskKey: $('.elixir .key', el),
      glimmer: $('.glimmer b', el), gain: $('.glimmer .gain', el),
      lock: $('.lock', el), ebars: $('.ebars', el),
      boss: $('.boss', el),
      prompt: $('.prompt', el), toasts: $('.toasts', el), banner: $('.banner', el), bannerT: $('.banner span', el),
      big: $('.big', el), bigT: $('.big span', el), bigS: $('.big em', el), flash: $('.flash', el), edge: $('.edge', el),
      combo: $('.combo', el), comboN: $('.combo b', el), comboS: $('.combo small', el),
      art: $('.artslot', el), artI: $('.artslot > i', el), artB: $('.artslot b', el), artS: $('.artslot .key', el), artN: $('.artslot em', el),
      swapQ: $('.swapq', el), swapK: $('.swapq .key', el), nextQ: $('.nextq', el), nextK: $('.nextq .key', el),
      rng: $('.rangedslot', el), rngI: $('.rangedslot i', el), rngB: $('.rangedslot b', el), rngS: $('.rangedslot small', el), rngH: $('.rangedslot s', el), rngHI: $('.rangedslot u', el),
      ret: $('.reticle', el), retRing: $('.reticle b', el),
      kin: $('.kin', el), kinN: $('.kin small', el), kinBar: $('.kin .kbar i', el), realm: $('.realm', el),
      msg: $('.msg', el), msgP: $('.msg p', el), msgS: $('.msg small', el), msgH: $('.msg h3', el), msgE: $('.msg em', el), fade: $('.fade', el),
    };
    this.bars = new Map();
    this.v = new THREE.Vector3();
    this.hpTrail = 1; this.glimmerShown = 0; this.gainAmt = 0; this.gainT = 0;
    this.bossList = []; this.bossRows = []; this.marks = [];
  }

  show(on) { this.el.classList.toggle('on', on); }

  // A side mission's aim, top right: kind (Twilight, Hunt, Duel) and what to do; null hides it.
  objective(kind, text) {
    const o = this.el.querySelector('.objective');
    o.hidden = !kind; if (!kind) return;
    o.querySelector('small').textContent = kind; o.querySelector('b').textContent = text;
  }

  key(a) { const i = this.G.input; return i.usingPad ? (i.padPS ? PS_LABEL : PAD_LABEL)[a] : KEY_LABEL[a]; }

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

  // A great foe's entrance: bars across the screen, and the knight's own marks put away till it is over.
  cine(on) { this.el.classList.toggle('cine', !!on); }

  clearOverlays() {
    this.q.big.classList.remove('on'); this.q.banner.classList.remove('on');
    this.q.toasts.innerHTML = ''; this.closeMessage(); this.prompt(null);
    for (const m of this.marks) m.el.remove();
    this.marks.length = 0;
  }

  loading(on) { this.el.querySelector('.loadingMsg').classList.toggle('on', on); if (on) this.el.classList.add('on'); }

  fadeTo(on, sec = .8) { const f = this.q.fade; f.style.transitionDuration = sec + 's'; f.classList.toggle('on', on); }

  screenFlash(kind) {
    const f = this.q.flash;
    f.className = 'flash'; void f.offsetWidth; f.className = 'flash ' + kind;
    const P = this.G.post;   // and the look answers: colour splits on a Flashcut or a counter, light blooms
    if (P) ({ flashcut: () => { P.pulse('split', 1); P.pulse('bloom', .6); }, burst: () => { P.pulse('split', .7); P.pulse('bloom', .9); }, hurt: () => P.pulse('split', .3), moon: () => P.pulse('bloom', .5), shift: () => P.pulse('bloom', 1) })[kind]?.();
  }

  burstWarn() {
    const e = this.q.edge;
    e.className = 'edge'; void e.offsetWidth; e.className = 'edge on';
  }

  enemyBroken(e) { this.floatText(e, 'SHATTERED', 'broken'); }

  // A "?" when a foe half-notices the knight, a "!" when it raises the alarm.
  mark(e, text) {
    for (const m of this.marks) if (m.e === e) { m.el.remove(); m.dead = true; }
    const el = document.createElement('div'); el.className = 'emark ' + (text === '!' ? 'alarm' : 'sus'); el.textContent = text;
    this.q.ebars.appendChild(el);
    this.marks.push({ e, el, t: 0, dur: text === '!' ? 1.3 : 1.6 });
  }

  stance(s) {
    const el = this.el.querySelector('.stance');
    for (const sp of el.querySelectorAll('span')) sp.classList.toggle('on', sp.dataset.s === s);
    el.querySelector('b').textContent = { high: 'High', mid: 'Mid', low: 'Low' }[s];
    el.dataset.s = s;
    this.stanceShown = s;
  }

  weapon(id) {
    const el = this.el.querySelector('.weapon'), p = this.G.player;
    el.querySelector('b').textContent = WEAPONS[id]?.name || id;
    el.dataset.w = id;
    const note = p.weaponNote?.(), fz = note ? `  ·  ${note}` : '';
    el.querySelector('small').textContent = `${p.form?.name || ''}` + fz;   // the other weapon waits on the cross
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
    this.prompt(null);   // the reading takes the prompt's place
    this.q.msg.classList.remove('letter'); this.q.msgH.textContent = ''; this.q.msgE.textContent = '';
    this.q.msgP.textContent = text;
    this.q.msgS.textContent = `${this.key('interact')} to close`;
    this.q.msg.hidden = false;
  }
  // A letter on parchment: a title, the text, and a note that it is kept in the Journal.
  letter(title, text, note = '') {
    this.message(text);
    this.q.msg.classList.add('letter'); this.q.msgH.textContent = title; this.q.msgE.textContent = note;
    this.q.msgP.scrollTop = 0;
  }
  closeMessage() { this.q.msg.hidden = true; }
  get messageOpen() { return !this.q.msg.hidden; }

  addGlimmer(n) { this.gainAmt += n; this.gainT = 2.5; }

  // One bar per warlord in the fight (a pair stack), or null to hide.
  setBoss(e) {
    const list = !e ? [] : Array.isArray(e) ? e : [e], q = this.q;
    this.bossList = list; this.bossE = list[0] || null;
    q.boss.hidden = !list.length;
    q.boss.classList.toggle('duo', list.length > 1);
    // Notches on the bar where a warlord's next phase begins (its second, and a flagship's third).
    const notches = b => [...(b.T.phase2 && !b.T.duo ? [b.T.phase2At ?? .5] : []), ...(b.phase3At ? [b.phase3At] : [])]
      .map(f => `<b class="notch" style="left:calc(4px + (100% - 8px) * ${f})"></b>`).join('');
    q.boss.innerHTML = list.map(b => `<div class="brow${b.phase3At ? ' flagship' : ''}"><div class="bname">${esc(b.name)}</div><div class="bbar"><i class="trail"></i><i class="fill"></i>${notches(b)}</div><div class="bki"><i class="fill"></i></div></div>`).join('');
    this.bossRows = [...q.boss.children].map((row, i) => ({ row, e: list[i], fill: $('.bbar .fill', row), trail: $('.bbar .trail', row), ki: $('.bki .fill', row), tr: list[i].hp / list[i].maxHp }));
  }

  bar(e) {
    let b = this.bars.get(e);
    if (!b) {
      b = document.createElement('div'); b.className = 'ebar';
      b.innerHTML = '<div class="eh"><i class="trail"></i><i class="fill"></i></div><div class="ek"><i class="fill"></i></div><span class="dmg"></span><span class="cname"></span>';
      b._fill = b.querySelector('.eh .fill'); b._cn = b.querySelector('.cname'); b._trail = b.querySelector('.eh .trail'); b._ki = b.querySelector('.ek .fill'); b._dmg = b.querySelector('.dmg');
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
    q.frozen.hidden = !(p.frozen > 0);
    q.cbuild.style.display = p.chill > 1 && !(p.frozen > 0) ? '' : 'none';
    q.cbuildI.style.transform = `scaleX(${p.chill / 100})`;
    // A Kindred Spirit walking with you (kindred.js), and an Umbral Realm you stand in (umbral.js).
    const K = G.kindred;
    q.kin.hidden = !K || K.gone;
    if (K && !K.gone) {
      if (q.kinN.dataset.n !== K.name) { q.kinN.dataset.n = K.name; q.kinN.textContent = `Kindred · ${K.name}`; }
      q.kinBar.style.transform = `scaleX(${Math.max(0, K.hp / K.maxHp)})`;
      q.kin.classList.toggle('fallen', K.state === 'fallen');
    }
    q.realm.hidden = !G.inRealm;
    // The quick-slot cross: Moondew up, the other weapon left, the Fae Art down, the next art right. Keys are
    // written on the slots for the keyboard; with a pad, the cross is the d-pad itself.
    this.el.classList.toggle('pad', !!G.input.usingPad);
    q.flaskN.textContent = p.elixirs;
    q.flask.classList.toggle('empty', p.elixirs <= 0);
    q.flaskKey.textContent = this.key('heal');
    const two = p.arms.length > 1;
    q.swapQ.hidden = !two; if (two) q.swapK.textContent = this.key('swap');
    // The Fae Art at hand: its uses left, its name beside the cross, and with more than one, the next.
    const A = ARTS[p.art], ak = A && `${p.art}|${p.artUses?.[p.art]}|${this.key('art')}|${this.key('artNext')}|${p.arts?.length}|${p.brand?.kind === p.art}`;
    q.art.hidden = !A;
    q.nextQ.hidden = !A || !(p.arts?.length > 1);
    if (A && ak !== this.artShown) {
      this.artShown = ak;
      q.artI.style.color = A.color; q.artB.textContent = A.name; q.artN.textContent = p.artUses[p.art] ?? 0;
      q.artS.textContent = this.key('art'); q.nextK.textContent = this.key('artNext');
      q.art.classList.toggle('empty', !(p.artUses[p.art] > 0));
    }
    // Soul Cores set: each skill, its keys, and whether there is Faelight enough.
    const cs = G.save.data.coreSlots || [], cks = cs.map(id => id ? `${id}:${p.anima >= CORES[id].cost}` : '').join('|') + this.key('core0') + this.key('core1');
    if (cks !== this.coreShown) {
      this.coreShown = cks;
      this.el.querySelector('.coreslots').innerHTML = cs.map((id, i) => id ? `<div class="${p.anima >= CORES[id].cost ? 'ready' : ''}"><i>◈</i><b>${esc(CORES[id].skillName)}</b><small>${esc(this.key(i ? 'core1' : 'core0'))} · ${CORES[id].cost}</small></div>` : '').join('');
    }
    // The ranged weapon: its ammunition (or the pod's heat), and the reticle while aimed.
    const R = RANGED[p.rangedSel];
    q.rng.hidden = !R;
    if (R) {
      const n = p.ammo?.[p.rangedSel], rk = `${p.rangedSel}|${n}|${this.key('aim')}|${p.aiming}|${p.hot > 0}`;
      if (rk !== this.rngShown) {
        this.rngShown = rk;
        q.rngI.style.color = '#' + R.color.toString(16).padStart(6, '0');
        q.rngB.textContent = R.ammo ? `${R.name} ×${n ?? 0}` : R.name;
        q.rngS.textContent = p.aiming ? `${this.key('fire')} to ${R.kind === 'bow' ? 'draw and loose' : 'fire'}  ·  ${this.G.input.usingPad ? 'let go of ' + this.key('aim') : this.key('aim')} to lower` : `${this.G.input.usingPad ? 'hold ' : ''}${this.key('aim')} to aim`;
        q.rng.classList.toggle('empty', !!R.ammo && !(n > 0));
        q.rngH.hidden = R.kind !== 'pod';
      }
      if (R.kind === 'pod') { q.rngHI.style.width = `${Math.round(p.heat || 0)}%`; q.rngH.classList.toggle('hot', p.hot > 0); }
    }
    q.ret.hidden = !p.aiming;
    if (p.aiming) {
      const drawK = R?.kind === 'bow' ? Math.min(1, (p.drawT || 0) / (R.draw * .9)) : 1;
      q.retRing.style.transform = `translate(-50%,-50%) scale(${(2.2 - 1.2 * drawK).toFixed(3)})`;
      q.ret.classList.toggle('wait', (p.reloadT || 0) > 0 || (!!R?.ammo && !(p.ammo?.[p.rangedSel] > 0)) || p.hot > 0);
      q.ret.classList.toggle('lock', !!p.lock);
    }
    const pk = `${this.key('shift')}|${p.patron}`;
    if (this.patronShown !== pk) {   // the Faelight bar takes the pledged patron's colour, and its name
      this.patronShown = pk;
      const P = PATRONS[p.patron] || PATRONS.lantern, lantern = p.patron === 'lantern';
      $('.ready', q.animaBar).textContent = `${this.key('shift')} · FAE SHIFT${lantern ? '' : ' · ' + P.name.toUpperCase()}`;
      q.anima.style.background = lantern ? '' : `linear-gradient(90deg, ${P.css}, #ffffff)`;
    }
    if (this.stanceShown !== p.stance) this.stance(p.stance);
    const wk = `${p.weapon}|${p.stance}|${p.arms.length}|${this.key('swap')}|${p.weaponNote?.()}`; if (this.weaponShown !== wk) { this.weaponShown = wk; this.weapon(p.weapon); }
    // Combo counter: shown from three hits; every tier adds damage, and a finisher spends it.
    const cn = p.combo?.n || 0, on = cn >= 3;
    if (cn !== this.comboShown) {
      const tier = Math.min(COMBO.tiers, Math.floor(cn / COMBO.tier));
      if (cn > (this.comboShown || 0)) { q.combo.classList.remove('bump'); void q.combo.offsetWidth; q.combo.classList.add('bump'); }
      this.comboShown = cn;
      q.comboN.textContent = cn;
      q.comboS.textContent = tier ? `hits  ×${(1 + tier * COMBO.per).toFixed(2)}` : 'hits';
      q.combo.dataset.tier = tier;
    }
    q.combo.classList.toggle('on', on);
    const ck = [...(p.charms || [])].join(',');
    if (this.charmsShown !== ck) {
      this.charmsShown = ck;
      this.el.querySelector('.charmrow').innerHTML = [...(p.charms || [])].map(id => `<i style="color:${CHARMS[id]?.color}" title="${CHARMS[id]?.name}">◆</i>`).join('');
    }
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
    const lp = L && this.project(L.pos.x, L.pos.y + L.height * .55, L.pos.z);
    q.lock.style.display = lp ? '' : 'none';
    if (lp) q.lock.style.transform = `translate(${lp.x}px, ${lp.y}px)`;

    // Enemy bars above heads.
    for (const e of G.enemies) {
      // Champions show their bar and name as soon as they notice you.
      const champ = e.champion && e.aware && e.distToPlayer() < 16;
      const want = e.alive && !e.boss && !this.bossList.includes(e) && (((e.barT > 0 || e === L) && e.hp < e.maxHp + (e === L ? 1 : 0)) || champ);
      let b = this.bars.get(e);
      if (!want) { if (b) b.style.display = 'none'; continue; }
      b = this.bar(e);
      const sp = this.project(e.pos.x, e.pos.y + e.height + .35, e.pos.z);
      if (!sp) { b.style.display = 'none'; continue; }
      b.style.display = '';
      b.style.transform = `translate(${sp.x}px, ${sp.y}px)`;
      const f = Math.max(0, e.hp / e.maxHp);
      b._tr = b._tr > f ? Math.max(f, b._tr - dt * .5) : f;
      b._fill.style.transform = `scaleX(${f})`; b._trail.style.transform = `scaleX(${b._tr})`;
      b._ki.style.transform = `scaleX(${Math.max(0, e.ki / e.maxKi)})`;
      b.classList.toggle('broken', e.state === 'broken');
      b.classList.toggle('warded', e.ward > 0);
      if (b._cnFor !== e.name) { b._cnFor = e.name; b._cn.textContent = e.umbral ? 'Umbral' : e.champion ? e.affixes.map(a => AFFIXES[a].name).join(' · ') : ''; b._cn.style.color = e.umbral ? '#c8a0ff' : e.champion ? '#' + AFFIXES[e.affixes[0]].color.toString(16).padStart(6, '0') : ''; }
      b._dmg.textContent = e.dmgShown > 0 ? Math.round(e.dmgShown) : '';
    }

    // Notice marks ride over heads, then fade.
    for (let i = this.marks.length - 1; i >= 0; i--) {
      const m = this.marks[i]; m.t += dt;
      const sp = !m.dead && m.e.alive && m.t < m.dur && this.project(m.e.pos.x, m.e.pos.y + m.e.height + .55, m.e.pos.z);
      if (!sp) { if (!m.dead) m.el.remove(); this.marks.splice(i, 1); continue; }
      m.el.style.transform = `translate(${sp.x}px, ${sp.y - Math.min(1, m.t * 6) * 10}px) translate(-50%, -100%)`;
      m.el.style.opacity = Math.min(1, (m.dur - m.t) * 3);
    }

    // Boss bars.
    for (const r of this.bossRows) {
      const B = r.e, f = Math.max(0, B.hp / B.maxHp);
      r.tr = r.tr > f ? Math.max(f, r.tr - dt * .25) : f;
      r.fill.style.transform = `scaleX(${f})`; r.trail.style.transform = `scaleX(${r.tr})`;
      r.ki.style.transform = `scaleX(${Math.max(0, B.ki / B.maxKi)})`;
      r.row.classList.toggle('broken', B.state === 'broken');
      r.row.classList.toggle('armored', !!B.armored);
      r.row.classList.toggle('fallen', B.hp <= 0);
      r.row.classList.toggle('p3', !!B.phase3);
    }
  }
}
