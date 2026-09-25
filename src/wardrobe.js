// The Wardrobe: how the knight looks, apart from what it wears. The harness can take the look of any set you
// have ever carried a piece of (whatever set is worn keeps its defence, effects and bonuses), and each part of
// it can be dyed: plate, cloak, trim, wings and the visor's glow. Three dyes are yours from the start; the rest
// are sold in the Hidden Market (market.js), a few each night. Saved in d.look; player.js applies it.
import { SETS } from './gear.js';

export const DYES = {
  ink: { name: 'Ink', hex: 0x18181e, price: 0 },
  bone: { name: 'Bone', hex: 0xd8d0bc, price: 0 },
  moss: { name: 'Moss', hex: 0x3a5a2a, price: 0 },
  moonsilver: { name: 'Moonsilver', hex: 0xdfe6f4, price: 18 },
  midnight: { name: 'Midnight', hex: 0x1a2050, price: 18 },
  storm: { name: 'Storm', hex: 0x5a6a8a, price: 18 },
  cinder: { name: 'Cinder', hex: 0x3a2826, price: 18 },
  ember: { name: 'Ember', hex: 0xd8581a, price: 24 },
  rose: { name: 'Briar Rose', hex: 0xe07aa0, price: 24 },
  rime: { name: 'Rime', hex: 0x9fd8ff, price: 24 },
  teal: { name: 'Deepwater', hex: 0x1a7a7a, price: 24 },
  coral: { name: 'Coral', hex: 0xff8a70, price: 24 },
  blood: { name: 'Blood Moon', hex: 0x8a1020, price: 30 },
  pearl: { name: 'Pearl', hex: 0xf0ece0, price: 30 },
  amethyst: { name: 'Amethyst', hex: 0x7a4ab8, price: 30 },
  jade: { name: 'Jade', hex: 0x3ac08a, price: 30 },
  sunflower: { name: 'Sunflower', hex: 0xf0c030, price: 30 },
  gold: { name: 'Lantern Gold', hex: 0xd6ac52, price: 36 },
  violet: { name: 'Soul Violet', hex: 0xb07aff, price: 36 },
  eclipse: { name: 'Eclipse', hex: 0x0a0a10, price: 36 },
  starlight: { name: 'Starlight', hex: 0xfff4c8, price: 42 },
  faerie: { name: 'Faerie Pink', hex: 0xff9cf0, price: 42 },
};
export const DYE_ORDER = Object.keys(DYES);
export const FREE_DYES = ['ink', 'bone', 'moss'];
// The parts of a look, as the Wardrobe lists them. 'set' takes a set's look; the rest take a dye (or none).
export const LOOK_PARTS = [
  { k: 'set', name: 'Harness', desc: 'Wear the look of any set you have carried a piece of. What you wear still decides defence, effects and set bonuses.' },
  { k: 'steel', name: 'Plate', desc: 'The colour of the plate.' },
  { k: 'cloth', name: 'Cloak', desc: 'The cloak and tabard.' },
  { k: 'trim', name: 'Trim', desc: 'Gilding, straps and edging.' },
  { k: 'wing', name: 'Wings', desc: 'A tint through the wings\' light.' },
  { k: 'visor', name: 'Visor glow', desc: 'The light behind the visor.' },
];
export const freshLook = () => ({ set: null, steel: null, cloth: null, trim: null, wing: null, visor: null });

// The colours the knight wears: the chosen set's look (or the worn mail's), with any dyes laid over it.
// wing and visor are null when left as they are.
export function lookColors(look, wornSet) {
  const L = look || {}, base = SETS[L.set]?.look || SETS[wornSet]?.look || SETS.errant.look, dye = k => DYES[L[k]]?.hex;
  return { steel: dye('steel') ?? base.steel, cloth: dye('cloth') ?? base.cloth, trim: dye('trim') ?? base.trim, wing: dye('wing') ?? null, visor: dye('visor') ?? null };
}
