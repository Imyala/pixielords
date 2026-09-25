// Keyboard, mouse and gamepad, folded into named actions.
// down(a): held now · hit(a): pressed this frame · up(a): released this frame.

// Keyboard and mouse are the main scheme. The gamepad follows Nioh's Type A: strike X (Square), strike hard Y
// (Triangle), dodge A (Cross), interact B (Circle), guard LB (L1), Resonance RB (R1), aim LT (L2, hold), fire RT
// (R2) while aiming; RB + Y / X / A for High / Mid / Low stance; RT + X / Y for the Soul Core skills, RT + B for
// the Thorn Counter; B + Y together for Fae Shift; the d-pad for Moondew, Fae Arts and weapons. The chords are
// turned into the virtual codes below ('Pad…') by poll(), so the game reads them like any other key.
const BIND = {
  light:    ['Mouse0', 'KeyJ', 'Pad2', 'PadFire'],
  heavy:    ['Mouse2', 'KeyK', 'Pad3'],
  guard:    ['ShiftLeft', 'ShiftRight', 'Pad4'],
  dodge:    ['Space', 'Pad0'],
  burst:    ['KeyF', 'PadBurst'],
  lock:     ['KeyQ', 'Mouse1', 'Pad11'],
  heal:     ['KeyR', 'Pad12'],
  interact: ['KeyE', 'Pad1'],
  shift:    ['KeyG', 'PadShift'],
  pause:    ['Escape', 'KeyP', 'Pad9', 'Pad8'],
  nextTarget: ['Tab', 'WheelDown'],   // on a gamepad: flick the right stick
  aim:      ['ControlLeft', 'KeyL', 'PadAim'],   // raise or lower the ranged weapon
  prevTarget: ['WheelUp'],
  swap:     ['KeyV', 'Pad14'],
  slide:    ['KeyZ', 'Pad10'],   // also: guard while sprinting
  art:      ['KeyT', 'Pad13'],   // also: guard + Moondew
  artNext:  ['KeyY', 'Pad15'],
  pulse:    ['PadPulse'],   // Resonance on its own button (keyboard: tap guard)
  core0:    ['PadCore0'],   // keyboard: hold Fae Shift and strike
  core1:    ['PadCore1'],
  up:    ['KeyW', 'ArrowUp', 'Pad12'],
  down:  ['KeyS', 'ArrowDown', 'Pad13'],
  left:  ['KeyA', 'ArrowLeft', 'Pad14'],   // menus only (in play the d-pad is Moondew, Arts and weapons)
  right: ['KeyD', 'ArrowRight', 'Pad15'],
  stanceHigh: ['Digit1', 'PadStanceHigh'],
  stanceMid:  ['Digit2', 'PadStanceMid'],
  stanceLow:  ['Digit3', 'PadStanceLow'],
  stanceUp:   ['KeyC'],
  stanceDown: ['KeyX'],
  confirm: ['Enter', 'Pad0'],
  back:    ['Escape', 'Pad1'],
  // Menus: switch tab, and a piece's other actions (dismantle, forge...).
  mPrev: ['KeyQ', 'Pad4'],
  mNext: ['KeyE', 'Pad5'],
  mAlt:  ['KeyF', 'Pad3'],
  mAlt2: ['KeyR', 'Pad2'],
};

export const KEY_LABEL = {
  light: 'LMB', heavy: 'RMB', guard: 'Shift', dodge: 'Space', burst: 'F', lock: 'Q', heal: 'R',
  interact: 'E', shift: 'G', pause: 'Esc', stance: '1 2 3', swap: 'V', slide: 'Z', art: 'T', artNext: 'Y', aim: 'Ctrl',
  core0: 'G + LMB', core1: 'G + RMB', pulse: 'Shift (tap)', confirm: 'Enter', back: 'Esc', mPrev: 'Q', mNext: 'E', mAlt: 'F', mAlt2: 'R', fire: 'LMB',
};
export const PAD_LABEL = {
  light: 'X', heavy: 'Y', guard: 'LB', dodge: 'A', burst: 'RT + B', lock: 'R3', heal: 'D-pad ↑',
  interact: 'B', shift: 'B + Y', pause: 'Start', stance: 'RB + Y / X / A', swap: 'D-pad ←', slide: 'L3', art: 'D-pad ↓', artNext: 'D-pad →', aim: 'LT',
  core0: 'RT + X', core1: 'RT + Y', pulse: 'RB', confirm: 'A', back: 'B', mPrev: 'LB', mNext: 'RB', mAlt: 'Y', mAlt2: 'X', fire: 'RT',
};
// The same buttons as a PlayStation pad names them.
export const PS_LABEL = {
  light: '□', heavy: '△', guard: 'L1', dodge: '✕', burst: 'R2 + ○', lock: 'R3', heal: 'D-pad ↑',
  interact: '○', shift: '○ + △', pause: 'Options', stance: 'R1 + △ / □ / ✕', swap: 'D-pad ←', slide: 'L3', art: 'D-pad ↓', artNext: 'D-pad →', aim: 'L2',
  core0: 'R2 + □', core1: 'R2 + △', pulse: 'R1', confirm: '✕', back: '○', mPrev: 'L1', mNext: 'R1', mAlt: '△', mAlt2: '□', fire: 'R2',
};

export class Input {
  constructor(el) {
    this.el = el;
    this.held = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.look = { x: 0, y: 0 };
    this.sens = 1;
    this.invertY = false;
    this.locked = false;
    this.usingPad = false;
    this.padPrev = [];
    this.padStick = { lx: 0, ly: 0, rx: 0, ry: 0 };
    this.rsFlick = 0;

    const down = code => { if (!this.held.has(code)) this.pressed.add(code); this.held.add(code); };
    const up = code => { if (this.held.has(code)) this.released.add(code); this.held.delete(code); };

    addEventListener('keydown', e => {
      if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      if (e.repeat) return;
      this.usingPad = false;
      down(e.code);
    });
    addEventListener('keyup', e => up(e.code));
    el.addEventListener('mousedown', e => {
      this.usingPad = false;
      if (!this.locked && this.wantLock) this.requestLock();
      down('Mouse' + e.button);
    });
    addEventListener('mouseup', e => up('Mouse' + e.button));
    el.addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('mousemove', e => {
      if (!this.locked) return;
      if (Math.abs(e.movementX) > 300 || Math.abs(e.movementY) > 300) return;   // Chrome spikes on lock
      this.look.x += e.movementX * .0022 * this.sens;
      this.look.y += e.movementY * .0022 * this.sens * (this.invertY ? -1 : 1);
    });
    el.addEventListener('wheel', e => {
      e.preventDefault();
      const code = e.deltaY > 0 ? 'WheelDown' : 'WheelUp';
      this.pressed.add(code); this.released.add(code);
    }, { passive: false });
    addEventListener('blur', () => { for (const c of this.held) this.released.add(c); this.held.clear(); });
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === el; });
  }

  requestLock() {
    try { const p = this.el.requestPointerLock?.(); p?.catch?.(() => {}); } catch { /* not allowed here */ }
  }
  releaseLock() { if (document.pointerLockElement) document.exitPointerLock(); }

  down(a) { return BIND[a].some(c => this.held.has(c)); }
  hit(a) { return BIND[a].some(c => this.pressed.has(c)); }
  up(a) { return BIND[a].some(c => this.released.has(c)); }
  anyHit() { return this.pressed.size > 0; }

  // Movement in camera space: x right, y forward. Length ≤ 1.
  move() {
    let x = 0, y = 0;
    if (this.held.has('KeyW') || this.held.has('ArrowUp')) y += 1;
    if (this.held.has('KeyS') || this.held.has('ArrowDown')) y -= 1;
    if (this.held.has('KeyD') || this.held.has('ArrowRight')) x += 1;
    if (this.held.has('KeyA') || this.held.has('ArrowLeft')) x -= 1;
    const { lx, ly } = this.padStick;
    if (Math.hypot(lx, ly) > .18) { x = lx; y = -ly; }
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x, y };
  }

  poll(dt) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = [...pads].find(p => p && p.connected);
    if (!pad) { this.padStick.lx = this.padStick.ly = this.padStick.rx = this.padStick.ry = 0; return; }
    this.padPS = /054c|sony|playstation|dualshock|dualsense/i.test(pad.id);
    const dz = v => (Math.abs(v) < .15 ? 0 : v);
    this.padStick.lx = dz(pad.axes[0] || 0); this.padStick.ly = dz(pad.axes[1] || 0);
    this.padStick.rx = dz(pad.axes[2] || 0); this.padStick.ry = dz(pad.axes[3] || 0);
    const now = pad.buttons.map(b => b.pressed || b.value > .5);
    const was = this.padPrev, hit = i => now[i] && !was[i], rel = i => !now[i] && was[i];
    const press = code => { this.pressed.add(code); this.held.add(code); this.usingPad = true; };
    const lift = code => { if (this.held.has(code)) this.released.add(code); this.held.delete(code); };
    const ctx = this.ctx || {}, menu = !!ctx.menu;
    const R1 = now[5] && !menu, R2 = now[7] && !menu;
    // Modifiers first: RB + face for stance, RT + face for Soul Core skills and the Thorn Counter.
    const used = new Set();
    if (R1) { if (hit(3)) { press('PadStanceHigh'); used.add(3); } if (hit(2)) { press('PadStanceMid'); used.add(2); } if (hit(0)) { press('PadStanceLow'); used.add(0); } }
    if (R2 && !ctx.aiming) { if (hit(2)) { press('PadCore0'); used.add(2); } if (hit(3)) { press('PadCore1'); used.add(3); } if (hit(1)) { press('PadBurst'); used.add(1); } }
    if (!menu) {
      if (hit(5)) press('PadPulse');
      if (rel(5)) lift('PadPulse');
      if (hit(7) && ctx.aiming) press('PadFire');
      if (!now[7]) lift('PadFire');
      if (hit(6) && !ctx.aiming) press('PadAim');
      if (rel(6) && ctx.aiming) press('PadAim');   // letting go of LT lowers the weapon, as in Nioh
    }
    for (const c of ['PadStanceHigh', 'PadStanceMid', 'PadStanceLow', 'PadCore0', 'PadCore1', 'PadBurst', 'PadAim', 'PadShift']) if (this.held.has(c) && !this.pressed.has(c)) lift(c);
    // B + Y together is Fae Shift: a press of either waits a moment for the other before it counts alone.
    const t = performance.now();
    if (!menu) {
      for (const i of [1, 3]) if (hit(i) && !used.has(i)) { this.pend ||= {}; this.pend[i] = t; used.add(i); }
      const p = this.pend || {};
      if (p[1] && p[3]) { press('PadShift'); delete p[1]; delete p[3]; this.chordHeld = true; }
      for (const i of [1, 3]) if (p[i] && (t - p[i] > 70 || !now[i])) { press('Pad' + i); if (!now[i]) this.released.add('Pad' + i), this.held.delete('Pad' + i); delete p[i]; }
      if (this.chordHeld && !now[1] && !now[3]) this.chordHeld = false;
    }
    now.forEach((on, i) => {
      const code = 'Pad' + i;
      if (on && !was[i] && !used.has(i) && !(this.chordHeld && (i === 1 || i === 3))) press(code);
      if (!on && was[i]) lift(code);
      if (on && this.chordHeld && (i === 1 || i === 3)) this.held.delete(code);
    });
    this.padPrev = now;
    const { rx, ry, lx, ly } = this.padStick;
    if (Math.abs(lx) + Math.abs(ly) + Math.abs(rx) + Math.abs(ry) > 0) this.usingPad = true;
    this.look.x += rx * 2.6 * dt * this.sens;
    this.look.y += ry * 1.8 * dt * this.sens * (this.invertY ? -1 : 1);
    // A hard right-stick flick switches lock-on target.
    if (this.rsFlick <= 0 && Math.abs(rx) > .85) { this.pressed.add(rx > 0 ? 'Tab' : 'WheelUp'); this.rsFlick = .35; }
    this.rsFlick -= dt;
  }

  takeLook() { const l = { x: this.look.x, y: this.look.y }; this.look.x = this.look.y = 0; return l; }

  endFrame() { this.pressed.clear(); this.released.clear(); }
}
