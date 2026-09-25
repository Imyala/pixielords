// Fae Arts: the knight's tools beside the weapon, as ninjutsu and onmyo magic are in Nioh. Each has a few
// uses that return at every Moonwell. Thrown arts fly from the off hand; a brand lays an element on the
// weapon in hand for a while (one brand at a time). Found in the missions, except the darts, carried from
// the start. Used with T (or guard + Moondew), chosen with Y (or Select).
export const ARTS = {
  darts: { name: 'Thistle Darts', uses: 8, color: '#d8f0a0', hex: 0xd8f0a0, desc: 'Three thorn darts in a fan. They sting, and stagger ordinary foes.' },
  bomb: { name: 'Pixie Bomb', uses: 3, color: '#ffb070', hex: 0xffb070, desc: 'A lobbed pouch of pixie-fire that bursts where it lands and knocks foes down. It sets off powder kegs.' },
  ember: { name: 'Emberbrand', uses: 2, brand: true, color: '#ff8a30', hex: 0xff8a30, desc: 'For 30 seconds your weapon burns: every hit sets foes alight.' },
  storm: { name: 'Stormbrand', uses: 2, brand: true, color: '#c8b8ff', hex: 0xc8b8ff, desc: 'For 30 seconds your weapon crackles: hits break posture harder and leap to a second foe.' },
  rime: { name: 'Rimebrand', uses: 2, brand: true, color: '#9fd8ff', hex: 0x9fd8ff, desc: 'For 30 seconds your weapon frosts over: hits slow foes to a crawl.' },
};
export const ARTS_ORDER = ['darts', 'bomb', 'ember', 'storm', 'rime'];
// Numbers: darts fly 28 m/s for 0.7 s; the bomb flies 0.7 s and bursts 3.2 m wide; brands last 30 s.
export const DART = { speed: 28, life: .7, spread: .12, dmg: 22, ki: 12, poise: 34 };
export const BOMB = { flight: .7, range: 12, radius: 3.2, dmg: 150, ki: 70, poise: 60 };
export const BRAND = { dur: 30, burn: 4, rime: 3.5, stormKi: 1.35, arc: .3, arcRange: 5 };
