// Charms: trinkets that bend the rules a little. Found in the missions or won from gatekeepers and
// warlords; three can be worn at once, changed at any Moonwell. The effects live where the rules do
// (player.js, main.js); this file only names and describes them.
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
  // Trophies from gatekeepers and warlords.
  gateseal: { name: "Gatewarden's Seal", desc: 'Ten percent more health.', color: '#d6ac52', trophy: true },
  gnawtooth: { name: "Gnawfang's Tooth", desc: 'Executions and Ambushes strike a third harder.', color: '#e8e0c8', trophy: true },
  skullbead: { name: "Skullsplitter's Bead", desc: 'Held heavies charge twice as fast.', color: '#e06040', trophy: true },
  tusk: { name: "Warlord's Tusk", desc: 'Heavy strikes hit fifteen percent harder.', color: '#ffc080', trophy: true },
  knuckle: { name: "Breaker's Knuckle", desc: 'Strikes break stamina a fifth faster.', color: '#9a92b0', trophy: true },
  seereye: { name: "Seer's Eye", desc: 'Faelight fills a quarter faster.', color: '#c9b4ff', trophy: true },
  pikeband: { name: "Moon-Pike's Band", desc: 'Strikes reach a tenth further.', color: '#dfe4f2', trophy: true },
  shadowsilk: { name: 'Shadowsilk', desc: 'Dashing costs half the stamina, and Moonstep slows the world for longer.', color: '#8a78c8', trophy: true },
};
