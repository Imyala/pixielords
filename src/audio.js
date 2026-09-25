// Every sound is synthesised with WebAudio, so the game ships no audio files.
// sfx(name, {x, z, vol}) plays a one-shot; music(mode) switches between 'explore', 'boss' and 'none'.

export class Audio {
  constructor() {
    this.ctx = null;
    this.vol = { master: .8, sfx: .9, music: .55 };
    this.listener = { x: 0, z: 0 };
    this.mode = 'none';
    this.nextBeat = 0;
    this.step = 0;
    this.last = {};
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = this.vol.master;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp).connect(c.destination);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.vol.sfx; this.sfxBus.connect(this.master);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.vol.music; this.musicBus.connect(this.master);

    // A long dark hall reverb shared by everything.
    const len = c.sampleRate * 2.6, ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    this.verb = c.createConvolver(); this.verb.buffer = ir;
    this.verbIn = c.createGain(); this.verbIn.gain.value = .32;
    this.verbIn.connect(this.verb).connect(this.master);

    const nlen = c.sampleRate * 2;
    this.noise = c.createBuffer(1, nlen, c.sampleRate);
    const nd = this.noise.getChannelData(0);
    for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;

    this.timer = setInterval(() => this.schedule(), 40);
  }

  setVolume(kind, v) {
    this.vol[kind] = v;
    if (!this.ctx) return;
    if (kind === 'master') this.master.gain.value = v;
    if (kind === 'sfx') this.sfxBus.gain.value = v;
    if (kind === 'music') this.musicBus.gain.value = v;
  }

  // ---------- building blocks
  out(vol, x, z, wet = 1) {
    const c = this.ctx, g = c.createGain();
    let v = vol;
    let pan = 0;
    if (x !== undefined) {
      const dx = x - this.listener.x, dz = z - this.listener.z, d = Math.hypot(dx, dz);
      v *= 1 / (1 + d * d * .012);
      const ang = Math.atan2(dx, dz) - (this.listener.yaw || 0);
      pan = Math.max(-1, Math.min(1, -Math.sin(ang) * .7));
    }
    g.gain.value = v;
    if (c.createStereoPanner) {
      const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(this.sfxBus);
      if (wet) { const s = c.createGain(); s.gain.value = wet; p.connect(s).connect(this.verbIn); }
    } else {
      g.connect(this.sfxBus);
    }
    return g;
  }

  noiseBurst(dest, t, dur, { type = 'bandpass', f0 = 1000, f1 = f0, q = 1, a = .005, peak = 1 } = {}) {
    const c = this.ctx, s = c.createBufferSource();
    s.buffer = this.noise; s.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f).connect(g).connect(dest);
    s.start(t, Math.random()); s.stop(t + dur + .05);
  }

  tone(dest, t, dur, { type = 'sine', f0 = 440, f1 = f0, a = .005, peak = 1, detune = 0 } = {}) {
    const c = this.ctx, o = c.createOscillator();
    o.type = type; o.detune.value = detune;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(10, f1), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(dest); o.start(t); o.stop(t + dur + .05);
  }

  // ---------- one-shots
  sfx(name, o = {}) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    // Rate-limit identical sounds so a crowd doesn't clip.
    if (this.last[name] && now - this.last[name] < .03) return;
    this.last[name] = now;
    const t = now + .005, vol = o.vol ?? 1, R = Math.random;
    const d = (v, wet) => this.out(v * vol, o.x, o.z, wet);
    switch (name) {
      case 'swing': { const pp = o.pitch || 1; this.noiseBurst(d(.5, .3), t, .16 / pp, { f0: (900 + R() * 300) * pp, f1: 3200 * pp, q: 1.4, a: .03 }); break; }
      case 'stance': { const g = d(.45, .6), pp = o.pitch || 1; this.noiseBurst(g, t, .18, { f0: 600 * pp, f1: 2400 * pp, q: 1.2, a: .02, peak: .6 }); this.tone(g, t, .25, { type: 'triangle', f0: 520 * pp, f1: 780 * pp, peak: .18 }); break; }
      case 'deflect': {
        const g = d(1, .9);
        for (const f of [2200, 3300, 4700, 6100]) this.tone(g, t, .7 + R() * .3, { type: 'triangle', f0: f * (1 + R() * .015), peak: .16, a: .001 });
        this.noiseBurst(g, t, .08, { type: 'highpass', f0: 5000, peak: .9 });
        this.tone(g, t, .2, { type: 'sine', f0: 180, f1: 90, peak: .6 }); break;
      }
      case 'moonstep': {
        const g = d(.8, 1);
        this.tone(g, t, .9, { type: 'sine', f0: 260, f1: 1100, a: .05, peak: .35 });
        this.tone(g, t + .05, .9, { type: 'sine', f0: 390, f1: 1650, a: .05, peak: .2 });
        this.noiseBurst(g, t, .6, { f0: 3000, f1: 400, q: .8, a: .02, peak: .4 }); break;
      }
      case 'flashDraw': this.noiseBurst(d(.8, .5), t, .22, { type: 'highpass', f0: 1500, f1: 9000, a: .01, peak: .8 }); break;
      case 'flashcut': {
        const g = d(1.3, 1);
        this.noiseBurst(g, t, .14, { type: 'highpass', f0: 7000, f1: 2500, a: .001, peak: 1.2 });
        this.tone(g, t, .9, { type: 'sine', f0: 90, f1: 32, peak: 1.4 });
        for (const f of [1760, 2640, 3520]) this.tone(g, t + .02, 1.4, { type: 'sine', f0: f, peak: .12, a: .002 });
        this.noiseBurst(g, t + .03, .5, { type: 'lowpass', f0: 1500, f1: 80, peak: .8 }); break;
      }
      case 'swingHeavy':
        this.noiseBurst(d(.7, .4), t, .32, { f0: 400, f1: 1800, q: 1.2, a: .1 });
        this.tone(d(.25), t, .3, { type: 'sine', f0: 90, f1: 60, a: .08 }); break;
      case 'enemySwing': this.noiseBurst(d(.45, .3), t, .24, { f0: 500, f1: 1400, q: 1, a: .06 }); break;
      case 'hit': {
        const g = d(.9, .5);
        this.noiseBurst(g, t, .12, { type: 'lowpass', f0: 2400, f1: 300, a: .002 });
        this.tone(g, t, .16, { type: 'sine', f0: 160, f1: 50, peak: .9 });
        this.noiseBurst(g, t + .01, .09, { f0: 1600, f1: 900, q: 3, peak: .5 }); break;
      }
      case 'hitHeavy': {
        const g = d(1.1, .6);
        this.noiseBurst(g, t, .22, { type: 'lowpass', f0: 1800, f1: 120, a: .002 });
        this.tone(g, t, .28, { type: 'sine', f0: 120, f1: 35, peak: 1.2 });
        this.tone(g, t, .1, { type: 'square', f0: 220, f1: 80, peak: .2 }); break;
      }
      // Blows landing, by what they are: a cut's bright slice, a crush's deep thud, a stab's short punch; the ring
      // of steel on armour laid over any of them; and a killing blow's weight. o.heavy: a heavier blow.
      case 'hitCut': {
        const g = d(o.heavy ? 1.05 : .85, .5), hv = o.heavy ? 1 : 0;
        this.noiseBurst(g, t, .07 + hv * .05, { type: 'highpass', f0: 5200 - R() * 800, f1: 2000, a: .001, peak: .9 });
        this.noiseBurst(g, t + .004, .13 + hv * .1, { type: 'lowpass', f0: 2200, f1: 260, a: .002, peak: .8 + hv * .3 });
        this.tone(g, t, .16 + hv * .12, { type: 'sine', f0: 150 - hv * 30, f1: 45, peak: .8 + hv * .5 }); break;
      }
      case 'hitBlunt': {
        const g = d(o.heavy ? 1.2 : .95, .55), hv = o.heavy ? 1 : 0;
        this.tone(g, t, .22 + hv * .16, { type: 'sine', f0: 105 - hv * 25, f1: 30, peak: 1.3 + hv * .4 });
        this.noiseBurst(g, t, .16 + hv * .12, { type: 'lowpass', f0: 900, f1: 90, a: .002, peak: 1.1 });
        this.noiseBurst(g, t + .01, .06, { f0: 1400, f1: 700, q: 2.5, peak: .5 + hv * .3 });
        if (hv) this.tone(g, t, .09, { type: 'square', f0: 160, f1: 60, peak: .22 }); break;
      }
      case 'hitPierce': {
        const g = d(o.heavy ? 1 : .8, .45);
        this.noiseBurst(g, t, .05, { f0: 3400, f1: 1800, q: 4, a: .001, peak: .9 });
        this.noiseBurst(g, t + .02, .1, { type: 'lowpass', f0: 1600, f1: 200, peak: .7 });
        this.tone(g, t, .12, { type: 'sine', f0: 220, f1: 70, peak: .7 + (o.heavy ? .4 : 0) }); break;
      }
      case 'hitArmor': {
        const g = d(.7, .8);
        for (const f of [880, 1470, 2290]) this.tone(g, t, .3 + R() * .15, { type: 'triangle', f0: f * (1 + R() * .04), f1: f * .96, peak: .14, a: .001 });
        this.noiseBurst(g, t, .05, { type: 'highpass', f0: 4000, peak: .5 }); break;
      }
      case 'killBlow': {
        const g = d(1.1, .8);
        this.tone(g, t + .015, .5, { type: 'sine', f0: 70, f1: 26, peak: 1.3 });
        this.noiseBurst(g, t, .35, { type: 'lowpass', f0: 1200, f1: 60, a: .004, peak: .8 });
        this.noiseBurst(g, t + .03, .3, { type: 'bandpass', f0: 2600, f1: 600, q: 1.2, a: .01, peak: .35 }); break;
      }
      case 'bodyFall': {
        const g = d(.8, .5);
        this.tone(g, t, .25, { type: 'sine', f0: 90, f1: 35, peak: .9 });
        this.noiseBurst(g, t, .3, { type: 'lowpass', f0: 600, f1: 80, a: .003, peak: .9 }); break;
      }
      case 'playerHurt': {
        const g = d(1, .3);
        this.noiseBurst(g, t, .2, { type: 'lowpass', f0: 1500, f1: 200, a: .002, peak: 1 });
        this.tone(g, t, .22, { type: 'sawtooth', f0: 180, f1: 90, peak: .25 });
        this.tone(g, t, .3, { type: 'sine', f0: 90, f1: 40, peak: .9 }); break;
      }
      case 'block': {
        const g = d(.75, .8);
        for (const f of [1320, 1980, 2710, 3530]) this.tone(g, t, .45 + R() * .2, { type: 'triangle', f0: f * (1 + R() * .02), f1: f * .98, peak: .18, a: .001 });
        this.noiseBurst(g, t, .06, { type: 'highpass', f0: 3000, peak: .7 }); break;
      }
      case 'guardBreak': {
        const g = d(1, .8);
        this.sfx('block', o);
        this.tone(g, t + .02, .6, { type: 'sawtooth', f0: 300, f1: 60, peak: .3 });
        this.noiseBurst(g, t, .4, { type: 'lowpass', f0: 2000, f1: 100, peak: .8 }); break;
      }
      case 'burstCounter': {
        const g = d(1, 1);
        this.noiseBurst(g, t, .25, { type: 'highpass', f0: 2000, f1: 6000, peak: .6 });
        for (const f of [880, 1320, 1760, 2640]) this.tone(g, t, 1.2, { type: 'sine', f0: f, peak: .22, a: .002 });
        this.tone(g, t, .4, { type: 'sine', f0: 110, f1: 40, peak: 1.2 }); break;
      }
      case 'burstWarn': {
        const g = d(.8, .9);
        this.tone(g, t, .5, { type: 'sawtooth', f0: 1100, f1: 1400, peak: .12, a: .01 });
        this.tone(g, t, .5, { type: 'square', f0: 1650, f1: 2100, peak: .06, a: .01 });
        this.noiseBurst(g, t, .3, { type: 'highpass', f0: 5000, peak: .4, a: .01 }); break;
      }
      case 'glint': this.tone(d(.35, 1), t, .35, { type: 'sine', f0: 2600, f1: 3000, peak: .3, a: .002 }); break;
      case 'pulse': {
        const g = d(.7, 1);
        for (const [i, f] of [1046, 1568, 2093].entries()) this.tone(g, t + i * .035, .5, { type: 'sine', f0: f, peak: .25 });
        this.noiseBurst(g, t, .25, { type: 'highpass', f0: 4000, f1: 8000, peak: .25 }); break;
      }
      case 'roll': this.noiseBurst(d(.45, .2), t, .32, { type: 'lowpass', f0: 700, f1: 200, a: .04, peak: .9 }); break;
      // Movement and combos: a slide's scrape, the Wingleap, a thrown crescent of moonlight, the pause-combo cue.
      case 'slide': { const g = d(.5, .2); this.noiseBurst(g, t, .55, { type: 'bandpass', f0: 1800, f1: 500, q: .7, a: .02, peak: .8 }); this.noiseBurst(g, t, .3, { type: 'lowpass', f0: 400, f1: 150, peak: .6 }); break; }
      case 'leap': { const g = d(.6, .7); this.noiseBurst(g, t, .45, { f0: 500, f1: 2600, q: .9, a: .03, peak: .7 }); this.tone(g, t, .5, { type: 'sine', f0: 330, f1: 990, a: .03, peak: .18 }); break; }
      case 'wave': { const g = d(.7, 1); this.noiseBurst(g, t, .5, { type: 'highpass', f0: 2500, f1: 7000, a: .01, peak: .5 }); this.tone(g, t, .6, { type: 'triangle', f0: 1400, f1: 500, peak: .2, a: .005 }); break; }
      case 'cue': { const g = d(.4, 1); this.tone(g, t, .3, { type: 'sine', f0: 1760, peak: .22, a: .002 }); this.tone(g, t + .05, .35, { type: 'sine', f0: 2637, peak: .16, a: .002 }); break; }
      case 'step': this.noiseBurst(d(.12 + R() * .06, .1), t, .07, { type: 'lowpass', f0: 500 + R() * 300, f1: 150, peak: 1 }); break;
      case 'growl': {
        const g = d(.5, .5), f = (o.pitch || 1) * (70 + R() * 30);
        this.tone(g, t, .5, { type: 'sawtooth', f0: f, f1: f * .7, a: .05, peak: .35 });
        this.noiseBurst(g, t, .45, { f0: 500 * (o.pitch || 1), f1: 250, q: 3, a: .05, peak: .5 }); break;
      }
      case 'squeal': {
        const g = d(.4, .5), f = (o.pitch || 1) * (900 + R() * 300);
        this.tone(g, t, .25, { type: 'sawtooth', f0: f, f1: f * 1.5, a: .02, peak: .15 });
        this.tone(g, t + .08, .2, { type: 'square', f0: f * 1.2, f1: f * .8, peak: .08 }); break;
      }
      case 'enemyDie': {
        const g = d(.7, .7), p = o.pitch || 1;
        this.tone(g, t, .7, { type: 'sawtooth', f0: 160 * p, f1: 40 * p, a: .02, peak: .3 });
        this.noiseBurst(g, t, .6, { type: 'lowpass', f0: 1200, f1: 80, peak: .6 }); break;
      }
      case 'roar': {
        const g = d(1.2, 1);
        this.tone(g, t, 1.6, { type: 'sawtooth', f0: 95, f1: 55, a: .15, peak: .6 });
        this.tone(g, t, 1.6, { type: 'sawtooth', f0: 142, f1: 70, a: .15, peak: .35, detune: 12 });
        this.noiseBurst(g, t, 1.5, { f0: 600, f1: 200, q: 2, a: .2, peak: 1 }); break;
      }
      case 'slam': {
        const g = d(1.2, .7);
        this.tone(g, t, .6, { type: 'sine', f0: 80, f1: 28, peak: 1.4 });
        this.noiseBurst(g, t, .5, { type: 'lowpass', f0: 900, f1: 60, peak: 1 }); break;
      }
      case 'drink': {
        const g = d(.5, .3);
        for (let i = 0; i < 4; i++) this.tone(g, t + i * .11, .08, { type: 'sine', f0: 300 + R() * 200, f1: 600, peak: .3 }); break;
      }
      case 'heal': {
        const g = d(.5, 1);
        for (const [i, f] of [523, 659, 784, 1046].entries()) this.tone(g, t + i * .06, .9, { type: 'sine', f0: f, peak: .16 }); break;
      }
      case 'rest': {
        const g = d(.6, 1);
        for (const [i, f] of [220, 277, 330, 440, 554, 659].entries()) this.tone(g, t + i * .12, 3, { type: 'sine', f0: f, peak: .12, a: .3 }); break;
      }
      case 'levelUp': {
        const g = d(.6, 1);
        for (const [i, f] of [392, 523, 659, 784].entries()) this.tone(g, t + i * .07, 1.1, { type: 'triangle', f0: f, peak: .18 }); break;
      }
      case 'glimmer': this.tone(d(.25, 1), t, .4, { type: 'sine', f0: 1800 + R() * 800, f1: 2600, peak: .2 }); break;
      case 'pickup': {
        const g = d(.6, 1);
        for (const [i, f] of [660, 880, 1320].entries()) this.tone(g, t + i * .08, .6, { type: 'triangle', f0: f, peak: .2 }); break;
      }
      case 'arrow': this.noiseBurst(d(.35, .2), t, .25, { f0: 3000, f1: 1500, q: 6, peak: .6 }); break;
      case 'throw': this.noiseBurst(d(.35, .2), t, .2, { f0: 700, f1: 1500, q: 2, a: .03 }); break;
      case 'explode': {
        const g = d(1.2, 1);
        this.noiseBurst(g, t, .9, { type: 'lowpass', f0: 3000, f1: 60, a: .002, peak: 1.2 });
        this.tone(g, t, .7, { type: 'sine', f0: 70, f1: 25, peak: 1.3 }); break;
      }
      case 'storm': {   // a bolt out of a clear sky: the crack, then the rumble
        const g = d(1, 1);
        this.noiseBurst(g, t, .18, { type: 'highpass', f0: 6000, f1: 2000, a: .001, peak: 1.1 });
        this.noiseBurst(g, t + .05, 1.1, { type: 'lowpass', f0: 900, f1: 50, a: .05, peak: .9 });
        this.tone(g, t, .5, { type: 'sawtooth', f0: 180, f1: 40, peak: .25 }); break;
      }
      case 'magic': {
        const g = d(.5, 1);
        this.tone(g, t, .8, { type: 'sine', f0: 300, f1: 900, a: .2, peak: .25 });
        this.tone(g, t, .8, { type: 'triangle', f0: 450, f1: 1350, a: .2, peak: .12, detune: 7 }); break;
      }
      case 'poison': this.noiseBurst(d(.4, .5), t, .6, { f0: 300, f1: 900, q: 8, a: .1, peak: .6 }); break;
      case 'ice': {   // spikes cracking up through frozen ground
        const g = d(.7, .8);
        this.noiseBurst(g, t, .18, { type: 'highpass', f0: 2500, f1: 6000, a: .002, peak: .9 });
        this.noiseBurst(g, t, .35, { type: 'lowpass', f0: 800, f1: 120, a: .004, peak: .6 });
        for (let i = 0; i < 3; i++) this.tone(g, t + i * .03, .25, { type: 'sine', f0: 2200 + R() * 1800, peak: .08, a: .002 }); break;
      }
      case 'shatter': {   // rime armour or an ice wall giving way
        const g = d(1.1, 1);
        this.noiseBurst(g, t, .7, { type: 'highpass', f0: 1800, f1: 7000, a: .002, peak: 1 });
        this.tone(g, t, .5, { type: 'sine', f0: 90, f1: 35, peak: 1 });
        for (let i = 0; i < 8; i++) this.tone(g, t + i * .045 + R() * .02, .5, { type: 'sine', f0: 1800 + R() * 3200, peak: .1, a: .002 }); break;
      }
      case 'wood': {   // a crate or barrel stove in
        const g = d(.8, .5);
        this.noiseBurst(g, t, .22, { type: 'bandpass', f0: 900, f1: 300, q: 1.5, a: .002, peak: 1.1 });
        for (let i = 0; i < 4; i++) this.tone(g, t + i * .035 + R() * .02, .12, { type: 'triangle', f0: 180 + R() * 160, f1: 90, peak: .35, a: .002 }); break;
      }
      case 'clay': {   // an urn smashed
        const g = d(.7, .6);
        this.noiseBurst(g, t, .3, { type: 'highpass', f0: 1400, f1: 3500, a: .002, peak: .8 });
        for (let i = 0; i < 6; i++) this.tone(g, t + i * .03 + R() * .02, .15, { type: 'triangle', f0: 700 + R() * 900, peak: .12, a: .002 }); break;
      }
      case 'pixie': {   // a Lost Pixie freed
        const g = d(.6, 1);
        for (const [i, f] of [880, 1109, 1319, 1760, 2217].entries()) this.tone(g, t + i * .06, .9, { type: 'sine', f0: f, peak: .14, a: .004 });
        this.noiseBurst(g, t, .6, { type: 'highpass', f0: 5000, f1: 9000, a: .05, peak: .15 }); break;
      }
      case 'page': this.noiseBurst(d(.5, .3), t, .28, { type: 'bandpass', f0: 2600, f1: 1200, q: .8, a: .03, peak: .7 }); break;
      case 'chill': this.noiseBurst(d(.4, .6), t, .7, { type: 'bandpass', f0: 3000, f1: 900, q: 3, a: .08, peak: .5 }); break;
      case 'gate': {
        const g = d(1, .8);
        this.noiseBurst(g, t, 2.2, { type: 'lowpass', f0: 300, f1: 90, a: .3, peak: 1 });
        for (let i = 0; i < 10; i++) this.tone(g, t + i * .2, .12, { type: 'square', f0: 90 + R() * 40, f1: 60, peak: .08 }); break;
      }
      case 'fog': this.noiseBurst(d(.6, 1), t, 1.2, { f0: 400, f1: 2400, q: .7, a: .3, peak: .7 }); break;
      case 'shift': {
        const g = d(.9, 1);
        for (const [i, f] of [220, 330, 440, 660, 880, 1320].entries()) this.tone(g, t + i * .05, 1.4, { type: 'sawtooth', f0: f, f1: f * 1.01, peak: .06, a: .1 });
        this.noiseBurst(g, t, 1.2, { f0: 800, f1: 5000, q: 1, a: .4, peak: .6 }); break;
      }
      case 'grapple': {
        const g = d(1.2, .8);
        this.sfx('hitHeavy', o);
        this.tone(g, t + .12, .5, { type: 'sine', f0: 60, f1: 30, peak: 1.2 });
        this.noiseBurst(g, t + .1, .4, { type: 'lowpass', f0: 2000, f1: 100, peak: .9 }); break;
      }
      case 'died': {
        const g = d(1, 1);
        this.tone(g, t, 4, { type: 'sine', f0: 55, f1: 40, a: .05, peak: 1 });
        for (const f of [110, 131, 165]) this.tone(g, t + .2, 4.5, { type: 'triangle', f0: f, f1: f * .97, a: 1, peak: .15 }); break;
      }
      case 'felled': {
        const g = d(1, 1);
        this.tone(g, t, 1.5, { type: 'sine', f0: 60, f1: 40, peak: 1.2 });
        for (const [i, f] of [294, 370, 440, 587, 740].entries()) this.tone(g, t + .4 + i * .09, 4, { type: 'triangle', f0: f, peak: .13, a: .4 }); break;
      }
      case 'ui': this.tone(d(.25, 0), t, .08, { type: 'triangle', f0: 880, peak: .3 }); break;
      case 'uiOk': this.tone(d(.3, .3), t, .2, { type: 'triangle', f0: 660, f1: 990, peak: .3 }); break;
    }
  }

  // ---------- music
  music(mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    if (!this.ctx) return;
    this.step = 0;
    this.nextBeat = this.ctx.currentTime + .1;
    if (this.drone) { const d = this.drone; d.g.gain.setTargetAtTime(0, this.ctx.currentTime, .8); setTimeout(() => d.o.forEach(o => o.stop()), 4000); this.drone = null; }
    if (mode === 'explore' || mode === 'boss') this.startDrone(mode === 'boss' ? 36.7 : 55);
  }

  startDrone(f) {
    const c = this.ctx, g = c.createGain(), filt = c.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 380; filt.Q.value = 2;
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = .07; lg.gain.value = 180; lfo.connect(lg).connect(filt.frequency);
    const o = [f, f * 1.5, f * 2.003].map((fr, i) => {
      const x = c.createOscillator(); x.type = i ? 'sawtooth' : 'triangle'; x.frequency.value = fr; x.detune.value = (i - 1) * 6;
      x.connect(filt); x.start(); return x;
    });
    lfo.start(); o.push(lfo);
    g.gain.value = 0; g.gain.setTargetAtTime(.13, c.currentTime, 2);
    filt.connect(g).connect(this.musicBus);
    const wet = c.createGain(); wet.gain.value = .5; g.connect(wet).connect(this.verbIn);
    this.drone = { o, g };
  }

  schedule() {
    const c = this.ctx;
    if (!c || c.state !== 'running' || this.mode === 'none') return;
    const bus = this.musicBus;
    while (this.nextBeat < c.currentTime + .2) {
      const t = this.nextBeat, s = this.step++;
      if (this.mode === 'explore') {
        // Sparse bells in D minor pentatonic over the drone.
        if (s % 4 === 0 && Math.random() < .55) {
          const f = [293.7, 349.2, 392, 440, 523.3, 587.3, 698.5][Math.floor(Math.random() * 7)];
          const g = c.createGain(); g.gain.value = .05; g.connect(bus);
          const w = c.createGain(); w.gain.value = .9; g.connect(w).connect(this.verbIn);
          this.tone(g, t, 3.5, { type: 'sine', f0: f, peak: 1, a: .01 });
          this.tone(g, t, 2, { type: 'sine', f0: f * 2.76, peak: .25, a: .005 });
        }
        this.nextBeat += .75;
      } else {
        // Boss: taiko pattern with a low ostinato, 16th steps at 150 bpm.
        const bar = s % 16;
        const g = c.createGain(); g.gain.value = .5; g.connect(bus);
        if ([0, 3, 6, 8, 10, 11, 14].includes(bar)) {
          const big = bar === 0 || bar === 8;
          this.tone(g, t, big ? .5 : .28, { type: 'sine', f0: big ? 110 : 150, f1: 40, peak: big ? 1.1 : .6, a: .002 });
          this.noiseBurst(g, t, .12, { type: 'lowpass', f0: 1200, f1: 200, peak: big ? .5 : .25 });
        }
        if (bar % 4 === 2) this.noiseBurst(g, t, .05, { type: 'highpass', f0: 6000, peak: .08 });
        const riff = [73.4, 0, 73.4, 87.3, 0, 82.4, 73.4, 0, 65.4, 0, 65.4, 77.8, 0, 73.4, 69.3, 0];
        const phrase = Math.floor(s / 16) % 4;
        const f = riff[bar] * (phrase === 3 ? 1.189 : 1);
        if (f) {
          const bg = c.createGain(); bg.gain.value = .22;
          const filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 600;
          bg.connect(filt).connect(bus);
          this.tone(bg, t, .22, { type: 'sawtooth', f0: f, peak: 1, a: .005 });
          this.tone(bg, t, .22, { type: 'sawtooth', f0: f * 2, peak: .4, a: .005, detune: 8 });
        }
        if (bar === 0 && phrase % 2 === 1) {
          const sg = c.createGain(); sg.gain.value = .07; sg.connect(bus);
          const w = c.createGain(); w.gain.value = 1; sg.connect(w).connect(this.verbIn);
          for (const fr of [293.7, 349.2, 440]) this.tone(sg, t, 1.6, { type: 'sawtooth', f0: fr * (phrase === 3 ? 1.189 : 1), peak: 1, a: .05 });
        }
        this.nextBeat += 60 / 150 / 4;
      }
    }
  }
}
