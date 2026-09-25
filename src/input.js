// Keyboard, mouse and gamepad, folded into named actions.
// down(a): held now · hit(a): pressed this frame · up(a): released this frame.

const BIND = {
  light:    ['Mouse0', 'KeyJ', 'Pad5'],
  heavy:    ['Mouse2', 'KeyK', 'Pad7'],
  guard:    ['ShiftLeft', 'ShiftRight', 'Pad4'],
  dodge:    ['Space', 'Pad1'],
  burst:    ['KeyF', 'Pad6'],
  lock:     ['KeyQ', 'Mouse1', 'Pad11'],
  heal:     ['KeyR', 'Pad2'],
  interact: ['KeyE', 'Pad0'],
  shift:    ['KeyG', 'Pad3'],
  pause:    ['Escape', 'KeyP', 'Pad9'],
  nextTarget: ['Tab', 'WheelDown', 'Pad15'],
  prevTarget: ['WheelUp'],
  swap:     ['KeyV', 'Pad14'],
  slide:    ['KeyZ', 'Pad10'],   // also: guard while sprinting
  up:    ['KeyW', 'ArrowUp', 'Pad12'],
  down:  ['KeyS', 'ArrowDown', 'Pad13'],
  left:  ['KeyA', 'ArrowLeft', 'Pad14'],   // menus only (in play the d-pad's left and right are swap and next target)
  right: ['KeyD', 'ArrowRight', 'Pad15'],
  stanceHigh: ['Digit1'],
  stanceMid:  ['Digit2'],
  stanceLow:  ['Digit3'],
  stanceUp:   ['Pad12', 'KeyC'],
  stanceDown: ['Pad13', 'KeyX'],
  confirm: ['Enter', 'Pad0'],
  back:    ['Escape', 'Pad1'],
};

export const KEY_LABEL = {
  light: 'LMB', heavy: 'RMB', guard: 'Shift', dodge: 'Space', burst: 'F', lock: 'Q', heal: 'R',
  interact: 'E', shift: 'G', pause: 'Esc', stance: '1 2 3', swap: 'V', slide: 'Z',
};
export const PAD_LABEL = {
  light: 'RB', heavy: 'RT', guard: 'LB', dodge: 'B', burst: 'LT', lock: 'R3', heal: 'X',
  interact: 'A', shift: 'Y', pause: 'Start', stance: 'D-pad ↑↓', swap: 'D-pad ←', slide: 'L3',
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
    const dz = v => (Math.abs(v) < .15 ? 0 : v);
    this.padStick.lx = dz(pad.axes[0] || 0); this.padStick.ly = dz(pad.axes[1] || 0);
    this.padStick.rx = dz(pad.axes[2] || 0); this.padStick.ry = dz(pad.axes[3] || 0);
    pad.buttons.forEach((b, i) => {
      const on = b.pressed || b.value > .5, was = this.padPrev[i];
      const code = 'Pad' + i;
      if (on && !was) { this.pressed.add(code); this.held.add(code); this.usingPad = true; }
      if (!on && was) { this.released.add(code); this.held.delete(code); }
      this.padPrev[i] = on;
    });
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
