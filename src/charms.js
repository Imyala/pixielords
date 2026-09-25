// Charms: trinkets that bend the rules a little. Found in the missions or won from gatekeepers and
// warlords; three can be worn at once, changed at any Moonwell. The effects live where the rules do
// (player.js, main.js); this file only names and describes them. The second act's charms carry their effects
// here as gear effects (fx, gear.js), which the knight adds to its gear's while they are worn.
export const CHARM_SLOTS = 3;

export const CHARMS = {
  dewdrop: { name: 'Dewdrop Charm', desc: 'Moondew heals a third more.', color: '#ff9cd0' },
  wardstone: { name: 'Wardstone', desc: 'Blocked blows cost a quarter less stamina.', color: '#b8c4d8' },
  thornheart: { name: 'Thornheart', desc: 'Deflects and Thorn Counters return more stamina and Faelight.', color: '#ff7ae0' },
  echo: { name: 'Echo Shell', desc: 'Resonance returns a fifth more stamina and stays open longer.', color: '#7ff0ff' },
  quickstep: { name: 'Quickstep Anklet', desc: 'Dashing costs a third less stamina.', color: '#9dff9a' },
  moonpetal: { name: 'Moonpetal', desc: 'The Moonstep window is wider, and Ripostes cut a third deeper.', color: '#b8c8ff' },
  emberwing: { name: 'Emberwing', desc: 'Fire and burning ground hurt you half as much.', color: '#ff9a50' },
  rootbound: { name: 'Rootbound Knot', desc: 'Poison builds half as fast and drains you more slowly.', color: '#9cff5a' },
  glimmerseed: { name: 'Glimmerseed', desc: 'Fallen foes give a fifth more Glimmer.', color: '#ffe07a' },
  skyward: { name: 'Skyward Feather', desc: 'Launchers cost less stamina, and air strikes hit a quarter harder.', color: '#dff4ff' },
  moonveil: { name: 'Moonveil', desc: 'For three seconds after a Moonstep, strikes hit a quarter harder.', color: '#aebcff' },
  wildfang: { name: 'Wildfang Tassel', desc: 'Frenzy lasts longer and stacks to eight.', color: '#ffb4c8' },
  windstep: { name: 'Windstep Sash', desc: 'Two air dashes per jump.', color: '#c8f4ff' },
  lanternheart: { name: 'Lanternheart', desc: 'Flashcuts and Moonstep Ripostes mend a little health.', color: '#ffe8a8' },
  hearthstone: { name: 'Hearthstone', desc: 'Chill builds half as fast.', color: '#ffb070' },
  winterbloom: { name: 'Winterbloom', desc: 'Moondew also restores all your stamina and a little Faelight.', color: '#e8f4ff' },
  iceheart: { name: 'Icicle Heart', desc: 'Strikes against Shattered foes hit harder still.', color: '#9fd8ff' },
  // Trophies from gatekeepers and warlords.
  gateseal: { name: "Gatewarden's Seal", desc: 'Ten percent more health.', color: '#d6ac52', trophy: true },
  gnawtooth: { name: "Gnawfang's Tooth", desc: 'Executions and Ambushes strike a third harder.', color: '#e8e0c8', trophy: true },
  skullbead: { name: "Skullsplitter's Bead", desc: 'Held heavies charge twice as fast.', color: '#e06040', trophy: true },
  tusk: { name: "Warlord's Tusk", desc: 'Heavy strikes hit fifteen percent harder.', color: '#ffc080', trophy: true },
  knuckle: { name: "Breaker's Knuckle", desc: 'Strikes break stamina a fifth faster.', color: '#9a92b0', trophy: true },
  seereye: { name: "Seer's Eye", desc: 'Faelight fills a quarter faster.', color: '#c9b4ff', trophy: true },
  pikeband: { name: "Moon-Pike's Band", desc: 'Strikes reach a tenth further.', color: '#dfe4f2', trophy: true },
  shadowsilk: { name: 'Shadowsilk', desc: 'Dashing costs half the stamina, and Moonstep slows the world for longer.', color: '#8a78c8', trophy: true },
  mirrorguard: { name: 'Mirror Guard', desc: 'The Deflect window is wider.', color: '#bfe0ff', trophy: true },
  wintercrown: { name: 'Winter Crown', desc: 'Fae Shift lasts a third longer.', color: '#dff0ff', trophy: true },
  // The second act: found in the missions across the Moonlit Sea, and won from their gatekeepers and warlords.
  tidepearl: { name: 'Tide Pearl', desc: 'Moondew heals a quarter more, and stamina returns a tenth faster.', color: '#9fffe8', fx: [['moondew', 25], ['kiRegen', 10]] },
  cinderring: { name: 'Cinder Ring', desc: 'Fire harms you forty percent less.', color: '#ff9a50', fx: [['fireRes', 40]] },
  rosethorn: { name: 'Rosethorn', desc: 'One strike in eight opens a bleeding wound.', color: '#ff6aa0', fx: [['bleed', 12]] },
  starglass: { name: 'Starglass Lens', desc: 'Fifteen percent more Faelight.', color: '#c8b0ff', fx: [['anima', 15]] },
  moonmote: { name: 'Moonmote', desc: 'Stamina returns fifteen percent faster, and dashes cost a tenth less.', color: '#eef2ff', fx: [['kiRegen', 15], ['dash', 10]] },
  bellclapper: { name: "Bell-Warden's Clapper", desc: 'Strikes break stamina an eighth faster, and blocked blows cost a tenth less.', color: '#d8b870', trophy: true, fx: [['ki', 12], ['guard', 10]] },
  saintveil: { name: "Saint's Veil", desc: 'Chill builds half as fast, and forty more health.', color: '#7fffe0', trophy: true, fx: [['chillRes', 50], ['hp', 40]] },
  forgebrand: { name: 'Forgebrand', desc: 'Heavies and finishers hit fifteen percent harder.', color: '#ff7a2a', trophy: true, fx: [['heavy', 15]] },
  tyrantcrown: { name: "Tyrant's Circlet", desc: 'Eight percent more damage, and blows land four percent lighter.', color: '#ffb070', trophy: true, fx: [['dmg', 8], ['ward', 4]] },
  briarknot: { name: 'Briar Knot', desc: 'Blight builds sixty percent slower.', color: '#c0ff6a', trophy: true, fx: [['poisonRes', 60]] },
  heirsigil: { name: "Heir's Sigil", desc: 'Twenty percent more damage from behind.', color: '#ff4a8a', trophy: true, fx: [['back', 20]] },
  shardheart: { name: 'Shard Heart', desc: 'Forty more stamina.', color: '#b8a0ff', trophy: true, fx: [['kiMax', 40]] },
  stareye: { name: "Star-Eater's Eye", desc: 'Fifteen percent more Glimmer, and foes drop fifteen percent more gear.', color: '#d0b8ff', trophy: true, fx: [['glimmer', 15], ['drops', 15]] },
  maelislantern: { name: "Maelis's Lantern", desc: 'Deflects give back fifteen stamina, and strikes at full health hit ten percent harder.', color: '#ffe8a8', trophy: true, fx: [['deflect', 15], ['dmgFull', 10]] },
  waningcrown: { name: 'The Waning Crown', desc: 'Ten percent more damage, and ten percent more Faelight.', color: '#ffffff', trophy: true, fx: [['dmg', 10], ['anima', 10]] },
};
