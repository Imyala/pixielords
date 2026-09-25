// Patron Spirits, as Nioh's Guardian Spirits are: every warlord holds a fae spirit captive, and felling it sets
// the spirit free to pledge itself to you. One patron at a time, chosen at a Moonwell. A patron lends a few
// passive effects (gear effects, gear.js, added to the knight's) and changes the Fae Shift: how hard it hits
// and breaks posture, how long it lasts, an element on every strike in it, and a burst as it begins.
//   shift: dmg (strike damage in the Shift; the Lantern's is 1.6), ki (posture), dur (a multiplier on how long it
//   lasts), element ('ember' | 'rime' | 'storm' | 'bleed'), leech (health back per strike, a share of the damage),
//   ward (the share of a blow's harm the Faelight takes; the Lantern's is .5), speed (strikes faster), echo (each strike lands again, a spectral echo at this share), feed (Faelight back
//   per strike), burst (the blast as it begins: damage, radius).
export const PATRONS = {
  lantern: { name: 'The Fae Lantern', title: 'the light you set out with', color: 0xff7ae0, css: '#ff9cf0', fx: [['anima', 5]],
    shift: { dmg: 1.6, ki: 1.5, burst: [90, 3] },
    lore: 'The little light every fae knight is given when they set out. It asks nothing of you but that you keep going.' },
  bramble: { name: 'Bramble', title: 'the Hedge-Hog', from: 'keep', color: 0x9ac860, css: '#b8e07a', fx: [['guard', 10], ['hp', 30]],
    shift: { dmg: 1.5, ki: 2, ward: .35, burst: [110, 3.4] },
    lore: 'Gnawfang kept Bramble in a cage of bones to guard the warren\'s stores. It is small, and very prickly, and it does not let go.' },
  cinder: { name: 'Cinder', title: 'the Ember Fox', from: 'rotwood', color: 0xff8a30, css: '#ffae60', fx: [['fireRes', 25], ['dmg', 3]],
    shift: { dmg: 1.65, ki: 1.5, element: 'ember', burst: [130, 3.6] },
    lore: 'The fox that lit the Rotwood\'s pyres, before Grimtusk chained it to the tallest of them. Everything it touches is a little warmer, and some of it catches.' },
  glim: { name: 'Glim', title: 'the Cave-Moth', from: 'deep', color: 0x8ff0ff, css: '#a8f4ff', fx: [['anima', 12]],
    shift: { dmg: 1.55, ki: 1.5, dur: 1.15, feed: 1.2, burst: [90, 3] },
    lore: 'Mother Skritch fed on Glim\'s light for years in the dark of the Deep. It is thin now, and brighter for it.' },
  hollowmoon: { name: 'Hollowmoon', title: 'the White Hare', from: 'moonspire', color: 0xeef2ff, css: '#f4f6ff', fx: [['dash', 12], ['back', 6]],
    shift: { dmg: 1.5, ki: 1.4, speed: 1.3, burst: [80, 3] },
    lore: 'The hare that ran the Moonspire\'s stairs faster than the monks could climb them. Silkclaw caught it in a web of moonless silk.' },
  rime: { name: 'Rime', title: 'the Snow Owl', from: 'frostmere', color: 0x9fd8ff, css: '#bfe6ff', fx: [['chillRes', 35], ['kiRegen', 6]],
    shift: { dmg: 1.6, ki: 1.6, element: 'rime', burst: [110, 4] },
    lore: 'The Winter Court\'s own owl, kept by the Rat King and the Hexer as a crown-jewel. It watches everything, and everything it watches slows down.' },
  tidemother: { name: 'Tidemother', title: 'the Great Carp', from: 'abbey', color: 0x7fffe0, css: '#9fffe8', fx: [['moondew', 20], ['hp', 40]],
    shift: { dmg: 1.5, ki: 1.5, ward: .25, dur: 1.2, burst: [100, 3.6] },
    lore: 'The carp that lived in the abbey\'s font, older than the abbey. When the sea came in, the Abbess made it carry the tide.' },
  anvil: { name: 'Anvil', title: 'the Iron Boar', from: 'forge', color: 0xd07a2a, css: '#f0a060', fx: [['heavy', 10], ['guard', 8]],
    shift: { dmg: 1.75, ki: 1.8, ward: .3, burst: [150, 3.4] },
    lore: 'The Iron Tyrant yoked Anvil to the Emberforge\'s bellows. It has never once turned aside, and never once been made to.' },
  briar: { name: 'Briar', title: 'the Thorn Wolf', from: 'thornwood', color: 0xff6ab0, css: '#ff8ac0', fx: [['back', 12], ['bleed', 6]],
    shift: { dmg: 1.6, ki: 1.5, element: 'bleed', speed: 1.1, burst: [120, 3.4] },
    lore: 'Prince Hawthorn raised Briar from a whelp in the hedges, and taught it to bite. It was never his.' },
  starling: { name: 'Starling', title: 'the Comet-Crow', from: 'crater', color: 0xc8b0ff, css: '#d8c8ff', fx: [['ki', 10], ['anima', 6]],
    shift: { dmg: 1.6, ki: 1.7, element: 'storm', burst: [130, 4] },
    lore: 'A crow that flew into the falling star and came out of it lit. The Star-Eater swallowed it whole, and it flew out again.' },
  crescent: { name: 'Crescent', title: 'the Moon Stag', from: 'court', color: 0xd8e0ff, css: '#e8ecff', fx: [['dmgFull', 8], ['kiMax', 15]],
    shift: { dmg: 1.6, ki: 1.5, dur: 1.45, burst: [120, 4.2] },
    lore: 'The stag that pulled the moon\'s cart across the sky. The Waning Queen stabled it in her court and let the moon stand still.' },
  pearl: { name: 'Pearl', title: 'the Tide Turtle', from: 'shore', color: 0xf0ece0, css: '#fff8e8', fx: [['hp', 60], ['moondew', 10]],
    shift: { dmg: 1.55, ki: 1.5, leech: .05, ward: .4, burst: [110, 3.6] },
    lore: 'The turtle that carries the Sea of Tranquility\'s tide in its shell. Gloam had grown over it like a barnacle.' },
  dusk: { name: 'Dusk', title: 'the Moth of Dreams', from: 'hollows', color: 0xe8d0ff, css: '#f0dcff', fx: [['anima', 10], ['pause', 10]],
    shift: { dmg: 1.6, ki: 1.6, element: 'rime', feed: .8, dur: 1.15, burst: [120, 4] },
    lore: 'Nyx\'s eldest, who would not eat the light. It dreams of the fae world lit again, and foes it touches half-dream too.' },
  swans: { name: 'The Twin Swans', title: 'Aurel\'s and Ilune\'s', from: 'necropolis', color: 0xffe0a0, css: '#ffe8b8', fx: [['deflect', 12], ['exec', 10]],
    shift: { dmg: 1.55, ki: 1.5, echo: .45, burst: [130, 3.8] },
    lore: 'The first king and queen kept a pair of swans, and were buried with them. The swans are awake now, and still together.' },
  umbra: { name: 'Umbra', title: 'the Shadow Hound', from: 'umbra', color: 0x8a5aff, css: '#b08aff', fx: [['dmgLow', 12], ['back', 10]],
    shift: { dmg: 1.95, ki: 1.6, dur: .75, speed: 1.1, burst: [160, 3.6] },
    lore: 'Nightmaw\'s own shadow, cut loose when it fell. It is hungrier than the hound was, and it burns out faster.' },
  solace: { name: 'Solace', title: 'the First Light', from: 'heart', color: 0xffd890, css: '#ffe0a8', fx: [['dmg', 6], ['anima', 8]],
    shift: { dmg: 1.8, ki: 1.7, element: 'ember', echo: .25, leech: .02, dur: 1.1, burst: [200, 4.6] },
    lore: 'The first light the first fae ever lit, which the Eclipse swallowed when the chain slipped. It has been waiting a long time for someone to come for it.' },
};
export const PATRON_ORDER = Object.keys(PATRONS);
// Which patron a mission's warlord frees.
export const PATRON_OF = Object.fromEntries(Object.entries(PATRONS).filter(([, P]) => P.from).map(([id, P]) => [P.from, id]));
export const ELEMENT_NAME = { ember: 'burn', rime: 'frost', storm: 'crackle and leap to a second foe', bleed: 'open bleeding wounds' };

// What a patron does to the Fae Shift, in words.
export function shiftText(P) {
  const s = P.shift, out = [`Strikes hit ${Math.round((s.dmg - 1) * 100)}% harder`];
  if (s.ki !== 1.5) out.push(`break posture ${s.ki > 1.5 ? 'harder' : 'less'} (${Math.round(s.ki * 100)}%)`);
  if (s.element) out.push(`${ELEMENT_NAME[s.element]}`);
  if (s.dur && s.dur !== 1) out.push(`lasts ${s.dur > 1 ? Math.round((s.dur - 1) * 100) + '% longer' : Math.round((1 - s.dur) * 100) + '% shorter'}`);
  if (s.speed) out.push(`strikes ${Math.round((s.speed - 1) * 100)}% faster`);
  if (s.leech) out.push(`every strike mends ${Math.round(s.leech * 100)}% of its damage`);
  if (s.feed) out.push(`strikes feed the Faelight back`);
  if (s.ward !== undefined) out.push(`blows drain ${Math.round(s.ward * 200)}% as much Faelight`);
  if (s.echo) out.push(`every strike lands again as an echo (${Math.round(s.echo * 100)}%)`);
  return out;
}
