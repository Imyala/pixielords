# PixieLords

A fast, stance-based action game in the browser, inspired by the Nioh series, Onimusha and the swordplay of
NieR: Automata. You play a fae knight on a run of missions through goblin and ratman country (a ruined keep,
a burning forest, a crystal mine, a temple above the clouds, a frozen mere), each ending with a warlord.

## Play

The game loads its models over HTTP, so serve the folder and open it in a desktop browser:

```sh
python3 -m http.server
# then open http://localhost:8000
```

Keyboard and mouse or a gamepad. Click the game to capture the mouse. Progress saves to the browser
every time you rest at a Moonwell, vanquish a warlord or clear a mission.

| Action | Keyboard + mouse | Gamepad |
|--------|------------------|---------|
| Move / camera | WASD / mouse | Left / right stick |
| Strike · strike hard | Left click · right click | RB · RT |
| Guard (tap as a blow lands to Deflect) | Shift | LB |
| Dash (hold to sprint) | Space | B |
| Slide (at a sprint) · from a slide: Wingleap | Shift or Z · Space | LB or L3 · B |
| Glide (while falling) | Hold Space | Hold B |
| Stance High / Mid / Low | 1 · 2 · 3 (or C / X) | D-pad up / down |
| Switch between your two weapons (as a strike ends: Switch Strike) | V | D-pad left |
| Fae Art: use · change | T (or Shift + R) · Y | LB + X · Select |
| Aim the ranged weapon · fire (hold to draw the bow) | Ctrl or L · left click | D-pad right · RB |
| Weapon Skill (once learned) | Hold Shift + right click | Hold LB + RT |
| Backstep Strike · Guard Counter (once learned) | Space with no direction, then strike · strike just after a block | B with no direction, then RB · RB just after a block |
| Charge a heavy (Moonglaive) | Hold right click | Hold RT |
| Launcher | Hold Shift + left click | Hold LB + RB |
| In the air: strike · Starfall · air dash | Left click · right click · Space | RB · RT · B |
| Thorn Counter | F | LT |
| Lock on · switch target | Q or middle click · wheel or Tab | R3 · flick right stick |
| Drink Moondew | R | X |
| Interact · read a letter | E | A |
| Fae Shift (Faelight full) | G | Y |
| Soul Core skills: first · second | Hold G + left click · hold G + right click | Hold Y + RB · hold Y + RT |
| Side missions (on the Crossroads map) | G | Y |
| The Underbriar (on the Crossroads map) | R | X |
| Pause | Esc | Start |

## How it plays

- **Stances.** High hits hardest and breaks posture, Mid is balanced, Low is quick and dashes further.
- **Forms.** Every weapon fights its own way in every stance, like a stance mod in Warframe: sixty forms in
  all across twenty weapons, every one with strikes of its own (see [The armory](#the-armory)). Each form
  has three strings:
  - **Standing**: strike standing still (or circling a locked foe).
  - **Moving**: strike on the move and a different chain comes out.
  - **Pause combo**: two strikes in, let the blade rest a beat. A glint and a chime mark the moment; strike
    then and the form's pause combo comes out instead of the next strike.

  | | High | Mid | Low |
  |---|---|---|---|
  | **Fae Sword** | *Falling Star*: two-handed cleaves, a wheel, a hop-and-slam; pause: the Sundering Blow, which throws a crescent of moonlight | *Moonlit Path*: the flowing four-cut chain, a stepping thrust, a rising cut that trips; pause: Triple Moon | *Crescent Tide*: hip draws, backhands, flurries, an ankle sweep; pause: Petal Storm |
  | **Moonglaive** | *Moonreaper*: overhead chops, butt-and-blade, reaping cuts that drag foes in; pause: the Reaping Cyclone | *Tide of the Moon*: thrust, sweep, wheel, vault, a twin thrust, the overhead Moon Helix; pause: Twin Tides | *Tidesweep*: sweeps that trip, low thrusts, a flick that lifts; pause: the Undertow |
  | **Twin Fangs** | *Falcon Dive*: crossing cuts from above, a somersault that throws foes up, a plunging double stab; pause: Skyrend | *Swallow's Dance*: alternating cuts, a twin step, a corkscrew; pause: a Hundred Cuts | *Serpent Coil*: reverse-grip hooks, stab flurries, a darting cut straight through; pause: the Venom Tornado |
  | **Thornhammer** | *Mountainfall*: crushing blows from over the shoulder, a hooking swing that drags foes in, a leaping slam; pause: the Meteorfall | *Anvil Rhythm*: swings across and back, an overhead slam, a great turn, a haft charge; pause: the Earthshaker, three slams | *Stonewheel*: ankle sweeps, a ram with the head, a dragging rush that lifts; pause: the Spinning Top |
  | **Starfists** | *Crescent Kick*: snap, axe and spinning hook kicks, a flying side kick; pause: the Tornado Kick | *Moonfist*: jab, cross, hook, roundhouse, a flying knee; pause: Hundred Fists | *Tiger Palm*: body blows, an uppercut, a leg sweep, a twin palm; pause: the Rising Dragon |

  Strikes do different things, not just look different: some trip ordinary foes off their feet, some throw
  them up for air combos, reaping cuts pull foes in, wheels knock them back, and a few throw moonlight on.
- **Finishers.** Strike then heavy is a finisher, chosen by how many strikes came first (as in NieR): one,
  two, or three and more, three per weapon (the sword's Moonrise, Wheel of Thorns and Moonpiercer, for
  example). The chain carries on through dashes, so you can dodge mid-combo and keep going.
- **Combo counter.** Hits in a row build a counter (right of screen). Every 12 add 6% damage, up to +24%.
  A finisher spends it: the more hits counted, the harder it lands, up to 1.8×. A blow taken halves the
  count; four seconds without a hit clears it. **Movesets** (pause menu or any Moonwell) lists every form.
- **Weapons.** The Fae Sword is quick and close. The **Moonglaive**, found in the Gnawing Halls, is a
  polearm: long reach, wide sweeps, heavy posture damage, and heavies you can hold to charge (up to 1.8×):
  the Crescent (Mid), the Moonfall pole-vault (High) and the Piercing Rush (Low). The **Twin Fangs**, found
  in Grubnest in the Rotwood, are a curved blade in each hand: the quickest and lightest on stamina, with
  flurries that strike again and again, a Whirlwind (Mid), a Crossfall leap (High) and a Viper Dash that
  slips straight through a foe (Low). Every hit with the Fangs builds **Frenzy**, up to six stacks, each one
  5% faster and 4% harder while you keep cutting. The **Thornhammer**, found in the Lower Drift of the Gnawed
  Deep, is slow and hungry for stamina but **Stalwart**: mid-swing, ordinary blows can't stagger you and land
  for a fifth less, and its slams shake foes off their feet. The **Starfists**, found in the Starlit Library
  on the Moonspire, fight with punches and kicks, quickest of all, and **Flow**: every hit wins back a little
  stamina and breaks posture 30% harder. Switch weapons as a strike ends for a **Switch Strike**, a wheeling
  cut with the weapon you draw, which also counts as Resonance if the window is open.
- **Skills.** Every weapon learns from use, as in Nioh: blows landed with it earn mastery (felling a foe
  earns more), and mastery earns skill points for that weapon. Spend them under **Skills** (pause menu or any
  Moonwell) on its tree: four new moves (a **Backstep Strike** out of a backstep, a **Guard Counter** just
  after a blocked blow, an **Air Finisher** that slams airborne foes down, and the weapon's own **Weapon
  Skill** on guard + heavy, such as the Warblade's Tempest Cleave or the Rimeblade's Winter Moon Iai) and
  passives: Proficiency, Pause Mastery, Finisher Mastery and mastery of the weapon's own mechanic (Momentum
  to +54%, five hex charges, Bleed on the fourth wound, and so on). A weapon's whole tree takes twenty points,
  a few missions of steady use. Ranged weapons have a shorter tree of their own.
- **Ranged weapons.** One carried beside the two melee weapons. Aim (Ctrl, L or D-pad right) brings the
  camera in over the shoulder and the knight to a steady walk; strike fires. The **Wisp Pod** (from the start,
  after NieR's pods) pours motes while strike is held and needs no ammunition, but overheats. The **Moonbow**
  (the Gatewarden) draws while strike is held and looses on release, harder the longer the draw. The
  **Starlock Rifle** (Grimtusk) fires one heavy shot, then a long reload. The **Thunder Cannon** (Mother
  Skritch) throws a shell that bursts where it lands and knocks everything down, and kicks you back. Shots to
  the head hit half again as hard. Arrows, shot and shells refill at every Moonwell, and crates sometimes
  hold a few. Lock on and the aim goes straight to the locked foe.
- **Gear.** Foes drop loot, as in Nioh: weapons (only of kinds you already carry) and armour, marked by a
  beam of light in the rarity's colour and taken by walking over it. Ordinary foes drop now and then, elites
  often, gatekeepers and warlords always, and better. Every piece has a **rarity** (Common, Fine, Rare,
  Fabled, Moonlit: the rarer, the more effects), an **item level** (higher in later missions and every New
  Game+) and **effects** rolled from a pool of 28, such as +damage at full health, a chance to set foes
  burning, health mended per hit, cheaper dashes, fire resistance or more Glimmer. A weapon's level and
  rarity raise its damage; armour's raise its defence, which takes a share off every blow. Armour comes in
  **sets**, one per mission plus the Knight-Errant's you start in, and two or four pieces of one set wake its
  bonuses; the knight takes on the colours of the set its mail belongs to. Equip it under **Gear** (pause
  menu or any Moonwell) and dismantle what you won't wear for Glimmer.
- **Soul Cores.** As in Nioh 2, a fallen foe sometimes leaves the core of what it was: a violet beam where it
  fell. Ordinary foes leave one now and then, elites often, and every gatekeeper, warlord and Revenant always.
  There are 24, one for each kind of foe (a Scout's, a Brute's, a Shaman's...) and one for each gatekeeper and
  warlord. Set two under **Gear** (the Soul Cores tab). Each lends a **passive** from the gear pool (Brute: +30
  health; Silkclaw: +20% damage from behind) and a **skill**: hold Fae Shift and strike for the first core's,
  strike hard for the second's. Skills cost Faelight. Among them: a fan of thrown knives, a phantom spear, a
  firebomb, a blight cloud, a leap and slam, Shadow Step (blink behind a foe and cut), seeking hex orbs, a
  bola, a Blood Frenzy (harder strikes, no stagger), ice waves, the Gatewarden's gate-breaking hammer, Brakka's
  thrown axes, Grimtusk's ring of fire, Varkh's lance, the Rime Knight's crescents and the Frost-Hexer's nova.
  A tap of Fae Shift still shifts. A core found again **fuses** into the one you hold, up to +4: each step
  makes its skill hit harder and its passive stronger.
- **Arsenal and forging.** You carry two weapons at a time, one in hand and one on your back, as in Nioh.
  Choose them in the **Arsenal** (pause menu or any Moonwell). At a Moonwell, forge a weapon with Glimmer, up
  to +10; each rank is 5% more damage with it.
- **Fae Arts.** Tools beside the weapon, like Nioh's ninjutsu and magic, with a few uses each that return at
  every Moonwell. **Thistle Darts** (carried from the start) sting and stagger ordinary foes; **Pixie Bombs**
  (the Goblin Larder) burst where they land, knock foes down and set off powder kegs. The brands lay an
  element on your weapon for thirty seconds, one at a time: **Emberbrand** (the Tanner's Camp) sets foes
  burning, **Stormbrand** (by the Moon Gate) breaks posture harder and arcs lightning to a second foe, and
  **Rimebrand** (the Frozen Boathouse) slows foes to a crawl.
- **Movement.** Hold dash to sprint and strike for a running attack. At a sprint, guard (or Z / L3) drops
  into a **slide**; strike from it for the weapon's slide attack, or dash for a **Wingleap**, a long dive up
  and forward that carries its speed into the air. Air strikes, the air dash and the Starfall all work from a
  Wingleap. Hold dash while falling to **glide** on spread wings for a few seconds.
- **Turning.** The knight leans into turns rather than snapping round: a quick reversal at a run takes about
  half a second and a sprint carves a wider arc, while lock-on keeps turns tight.
- **Stamina** fuels strikes, dashes and blocked blows. As a strike ends, blue light gathers around the
  knight: tap guard then for **Resonance** and the stamina flows back. Change stance in that moment for a
  Resonant Shift.
- **Deflect and Flashcut.** Tap guard just as a blow lands to Deflect it. Strike straight after for a
  **Flashcut**: one draw-cut that fells ordinary foes outright, bites deep into elites and warlords, and
  chains from foe to foe.
- **The fae dash** can't be touched mid-dash. Dash at the last instant to **Moonstep**, and the world slows
  for a moment while you don't. Strike straight after for a **Moonstep Riposte**: you blink behind the
  attacker and cut.
- **Hex orbs** can be cut out of the air with any strike. Deflect one and it flies back at its caster.
- **Launcher and air combos.** Hold guard and strike: a rising cut throws ordinary foes skyward and the knight
  leaps after them. Up to four air strikes keep you both aloft (each blow draws the foe to your height); a
  heavy in the air is the **Starfall**, a plunge that drives everything below into the ground. Floored foes
  take a fifth more damage while they get up. Heavy foes (brutes, packleaders) stand firm until their stamina
  is below 40% or broken; gatekeepers and warlords can't be launched at all, but you can still leap and
  strike them. You get one air dash per jump. High in the air, most blows pass beneath you, but big foes can
  still reach up.
- **Charms** bend the rules: twenty-seven of them, hidden in the missions or won from every gatekeeper and
  warlord. Wear up to three and change them at any Moonwell. Among them: Dewdrop (Moondew heals more),
  Thornheart (Deflects restore more), Moonpetal (a wider Moonstep window), Emberwing (fire hurts less),
  Skyward Feather (cheaper launchers, harder air strikes) and the trophies, like the Gatewarden's Seal
  (+10% health) and the Skullsplitter's Bead (heavies charge twice as fast).
- **Dread strikes** glow red and can't be guarded. Dash through them or **Thorn Counter** them into a
  Flashcut.
- Drain a foe's stamina to **Shatter** it, then strike to **Execute**. Catch sleeping foes from behind for
  an **Ambush**.
- Fallen foes release **souls**: gold Glimmer flies straight to you, green motes mend you and violet motes
  feed Faelight. The coloured motes wait where they fell until you come close.
- Strikes, Deflects and Resonance fill **Faelight**. At full, **Fae Shift**: wings flare, damage rises, and
  hits drain Faelight instead of health.
- **Awareness.** Idle foes look about and wander near their posts; sentries walk their rounds. A foe notices
  you by sight (a cone ahead of it, and anything close) and by sound (sprinting and dashing are loud, walking
  quieter, standing still quietest); walls block sight and muffle noise. A **?** over a head means it has
  half-noticed something and is turning to look; a **!** means it has seen you, and it calls the allies
  around it. Sneak up slowly from behind for an Ambush.
- **Breakables.** Crates, barrels, urns and moon-crystals shatter when struck (a heavy or a slam breaks
  sturdier ones at once) and spill Glimmer, sometimes a green mote, sometimes something hidden inside.
  Skull-marked **powder kegs** explode a moment after they break: they burn the ground, hurt everything
  nearby (you too) and set off any keg beside them. Lure foes to them. Everything breakable is back the next
  time you rest or fall.
- **Letters.** Notes, orders and diaries lie about every mission, glowing faintly. Press E to read one. Read
  letters stay in the **Journal** (from the pause menu or any Moonwell), mission by mission. Many are from
  Maelis, a fae knight who went ahead of you, and they often hint at what's coming.
- **Lost Pixies.** Five in every mission, some in plain sight, some shut in crates and urns. Walk into one to
  free it. Each freed pixie is kept for good (even into New Game+) and adds 1% to your health and stamina.
- **Moonwells** heal you, refill Moondew and bring every foe back. Spend Glimmer there to level up, or
  travel between awakened Moonwells. Fall and your Glimmer stays with your **Echo** where you fell.
- **Snares and fire.** Goblin Trappers hurl bolas: while snared you move slowly and can't sprint, so
  dash to shake them loose. Firebombs and Grimtusk's blows leave burning ground that hurts every
  half-second.
- **Chill.** On the Frostmere, icy blows, frost shards and freezing ground build chill (a pale gauge in
  the status row). When it fills you are **Frostbitten** for six seconds: slower on your feet, shorter dashes
  and slower to catch your breath. A guard lets a little of the cold through. Moondew or a Moonwell thaws
  you, and the Hearthstone charm halves the build-up.
- **Ice waves.** Some foes send a line of ice spikes racing along the ground. Step off the line, leap it,
  dash through as it reaches you, or take it on your guard. Walls stop them.

## The armory

Twenty weapons, covering every melee archetype of Warframe, Nioh, Nioh 2 and NieR: Automata. Each has its own
model and hold, its own numbers (speed, stamina, damage, reach), a mechanic, and three stance forms with
standing, moving and pause strings, finishers, a slide attack, air strikes and a Weapon Skill, all its own.
You carry two; choose them in the Arsenal.

| Weapon | Covers | Mechanic | Where |
|---|---|---|---|
| Fae Sword | Swords · Nioh sword · NieR small swords | the surest blade for Deflects and Flashcuts | carried from the start |
| Moonglaive | Polearms · Nioh spear · NieR spears | Charge: heavies can be held | the Gnawing Halls (Grubhold) |
| Twin Fangs | Dual Swords, Dual Nikanas · Nioh dual swords | Frenzy: hits stack speed and damage | Grubnest (Rotwood) |
| Thornhammer | Hammers · Nioh axe | Stalwart: swings can't be staggered | the Lower Drift (Gnawed Deep) |
| Starfists | Fists, Sparring · Nioh 2 fists · NieR combat bracers | Flow: hits win back stamina, break posture | the Starlit Library (Moonspire) |
| Warblade | Heavy Blade, Two-Handed Nikana · Nioh odachi · NieR large swords | Momentum: each strike of a chain 6% harder, to +36% | Gnawfang, the Grubhold's warlord |
| Warden's Aegis | Sword and Shield | Bulwark: guard from every side, blocks cost 40% less | the Gatewarden |
| Thorn Daggers | Daggers, Dual Daggers | Backstab: 60% harder from behind | the Goblin Larder (Grubhold) |
| Twin Hatchets | Machetes · Nioh 2 hatchets | Hurl: heavies throw both hatchets, which come back | Brakka the Skullsplitter |
| Briar Chain | Whips, Blade and Whip · Nioh kusarigama | Snare: the longest reach, and every lash pulls | the Tanner's Camp (Rotwood) |
| Harvest Moon | Scythes, Heavy Scythe · Nioh 2 switchglaive | Reap: 60% harder on foes below a third of their health | Grimtusk, the Rotwood's warlord |
| Wolf Claws | Claws | Bleed: every fifth wound bursts | the Crystal Gallery (Gnawed Deep) |
| Grinder's Wheel | Assault Saw | Grind: every strike bites again and again | Grinder the Tunnel-Breaker |
| Seer's Hexblade | Gunblade | Hex Charge: hits charge seeking bolts that a heavy looses | Mother Skritch |
| Moonstaff | Staves, Nunchaku · Nioh 2 splitstaff | Sweep: blows knock back; two foes at once wins stamina | the Terrace of Chimes (Moonspire) |
| Moth Fans | Warfans | Gale: cuts push; heavies throw both fans | the Starlit Library (Moonspire) |
| Moon Tonfas | Tonfas · Nioh tonfa | Tonfa Guard: wider Deflects, cheaper blocks | Varkh the Moon-Pike |
| Silkclaw's Rapier | Rapiers | Riposte: Flashcuts, Ripostes and Executions half again as hard | Silkclaw |
| Rimeblade | Nikanas · Nioh iaido | Iai: held back, the next strike is a 60% harder draw-cut | the Rime Knight |
| Moonring | Glaives (thrown) | Ring Throw: heavies throw the ring out and home | the Winter Court |

A save that has already felled a gatekeeper or warlord is given its weapon on the next load.

The armour sets:

| Set | Drops in | Two pieces | Four pieces |
|---|---|---|---|
| Knight-Errant's | worn from the start | +10 stamina | +20 health |
| Gatewarden's | the Grubhold | blocked blows cost 15% less stamina | Deflects give back 20 more stamina |
| Rotwood Stalker's | the Rotwood Hollow | +15% damage from behind | strikes from behind open a bleeding wound |
| Deepdelver's | the Gnawed Deep | 40% less harm from fire | below half health: +12% damage, stamina returns 25% faster |
| Moon Pilgrim's | the Moonspire | +15% Faelight | Fae Shift lasts 5 s longer, strikes in it hit 15% harder |
| Winter Court | the Frostmere | chill builds half as fast | one strike in five frosts foes, slowing them |

Item levels run 1–6 in the Grubhold, 8–14 in the Rotwood, 16–22 in the Deep, 24–30 on the Moonspire and
32–38 on the Frostmere, twenty higher each New Game+ (each Way, below), which keeps your gear, skills and
weapons. In the Underbriar they run about two per depth. From the Way of the Thorn on, a sixth rarity drops:
**Divine**, with five effects and the highest multiplier of all.

How the fifteen newest fight (the first five are in [How it plays](#how-it-plays)):

| Weapon | High | Mid | Low | Weapon Skill |
|---|---|---|---|---|
| Warblade | *Heaven's Edge*: falling and crossing cleaves, a leaping cleave; pause: Heaven Splitter, which throws moonlight | *Iron Tide*: two-handed sweeps both ways, the Iron Wheel, an overhead cleave, a striding thrust; pause: Iron Tide | *Ground Reaver*: the blade dragged and ripped up, low wheels, a scooping cut; pause: Reaver's Whirl | Tempest Cleave |
| Warden's Aegis | *Bastion*: falling cuts, the Shield Uppercut, a leaping cut; pause: Bastion Break, a shield slam and a chop | *Warden's Way*: cuts and stabs over the shield's rim, shield bashes; pause: Warden's Rhythm | *Low Wall*: low cuts, a low bash that trips, a shield wheel; pause: Turning Wall | Bulwark Charge |
| Thorn Daggers | *Magpie*: a crossing cut, falling stabs, a rising spin; pause: Thorn Rain | *Needlework*: cut and counter-cut with both hands, twin stabs, a slipping cut straight through; pause: Thousand Needles | *Shadow Step*: hamstring cuts, needle stabs, a low spin; pause: Shadow Cyclone | Shadow Dance |
| Twin Hatchets | *Woodsplitter*: twin chops, a bearded hook, a splitting leap; pause: Splitting Storm | *Chopping Dance*: right chop, left chop, hook, the Woodsman's Wheel; pause: Kindling | *Root Cutter*: root hacks, ankle hooks, a root wheel; pause: Timber Wheel | Timberfall |
| Briar Chain | *Hanging Thorn*: an overhead crack, a falling sickle, the chain whirled overhead; pause: Thorn Storm | *Briar Dance*: lashes both ways, the sickle snapped out and hauled back, a chain windmill; pause: Briar Dance | *Creeping Vine*: ankle lashes, low snaps, a creeping wheel; pause: Strangling Vine | Briar Tempest |
| Harvest Moon | *Grim Harvest*: a harvest hook, falling and rising crescents, a leaping reap; pause: Reaper's Moon | *Sickle Moon*: reaping sweeps that drag foes in, the Crescent Wheel; pause: Harvest Dance | *Gleaner*: gleaning sweeps and wheels, a flick that lifts; pause: Threshing Wheel | Reaper's Eclipse |
| Wolf Claws | *Pounce*: falling rends, a rising rake, a pounce from range; pause: Rending Moon | *Rending Moon*: right rake, left rake, the Twin Rend, a rake spin; pause: Thousand Rends | *Belly Rake*: low rakes, gutting hooks up from a crouch; pause: Rake Storm | Blood Moon |
| Grinder's Wheel | *Rockcutter*: the Grinding Press held down, a leaping fall; pause: Cave-in | *Grindstone*: grinding sweeps, the Wheel Ram held in, the Grindstone; pause: Millstone | *Undercut*: undercuts, low rams, a low grind; pause: Grinding Top | Grinding Ascent |
| Seer's Hexblade | *Hexfall*: falling and rising hexes, a hex cleave, a leaping Hexfall | *Seer's Path*: hex cuts, the Sigil Wheel, a hex palm; pause: Triple Hex | *Plague Cuts*: low cuts, a low sigil, a plague wheel; pause: Hexstorm | Hex Nova |
| Moonstaff | *Pillar*: falling staff, butt strikes, the staff whirled overhead, a pole-vault kick; pause: Pillar Dance | *Whirling Staff*: jabs, sweeps both ways, a windmill; pause: Rolling Thunder | *Leg Breaker*: leg breakers, low butt strikes, shin jabs; pause: Rolling Thunder | Monkey King's Whirl |
| Moth Fans | *Moth Wing*: falling wings, rising gusts, a diving leap; pause: Moth Storm | *Paper Moon*: both fans opened outward and swept closed, a turning dance, a flutter; pause: Paper Moon | *Dust Devil*: low gusts and turns; pause: Dust Devil | Moon Moth Waltz |
| Moon Tonfas | *Rising Guard*: hammer batons, twin uppercuts, a leaping hammer; pause: Moon Storm | *Twin Batons*: jab, cross, a turning elbow led by the baton, spinning batons; pause: Baton Barrage | *Low Batons*: low jabs, twin uppercuts, a sliding baton; pause: Rising Batons | Crescent Barrage |
| Silkclaw's Rapier | *Silk Needle*: head thrusts, the coupé, a crown moulinet, the balestra; pause: Starpoint | *Duelist's Line*: the fencer's lunge, parry and cut, feint and lunge, moulinets, the flèche; pause: Hundred Stings | *Crouching Fence*: low lines, ankle cuts, low moulinets; pause: Petal Fence | Silk Thousand |
| Rimeblade | *Winter Moon*: two-handed downward, crossing and rising cuts, a falling frost; pause: Frostfall Draw | *Still Water*: the draw-cut from the hip and its flick, two-handed cuts, a passing draw straight through; pause: Three Frosts | *Drawn Frost*: low draws, crescent draws, a frost wheel; pause: Scattering Petals | Winter Moon Iai |
| Moonring | *Moonlit Arc*: falling and rising rings, a crown loop overhead; pause: Moonlit Arc | *Orbit*: ring arcs, the ring punch, the Orbit; pause: Triple Orbit | *Rolling Ring*: low arcs, rolling loops, a low orbit; pause: Ring Storm | Eclipse |

The ranged weapons:

| Weapon | Fires | Ammunition | Where |
|---|---|---|---|
| Wisp Pod | a stream of motes while strike is held (NieR's pod) | none: it overheats | from the start |
| Moonbow | hold to draw, release to loose; a longer draw hits harder and falls less | 30 arrows | the Gatewarden (Grubhold) |
| Starlock Rifle | one heavy, fast shot, then a long reload | 12 shot | Grimtusk (Rotwood) |
| Thunder Cannon | a shell that bursts where it lands and throws foes down; it kicks | 5 shells | Mother Skritch (Gnawed Deep) |

## Missions

Missions are chosen on **the Fae Crossroads**, an overworld: the whole realm laid out as a small diorama, with
a landmark for each mission (the keep on its hill, the Rotwood's pyre smoking in the trees, the mine mouth
under the mountains, the Moonspire in its ring of cloud, the frozen mere under the aurora) and a road of
glowing stones between them. Your knight walks the road: arrows, WASD, the d-pad or the stick travel from
landmark to landmark, clicking a landmark walks there, and Enter (A) sets out, stepping into the Pixie Gate
ring. Sealed missions lie under fae mist; clear the one before and, the next time the map opens, the road
lights up stone by stone to the new one and the mist lifts. The panel shows each mission's state, Moonwells
awakened, charms found, and the letters and Lost Pixies found there. Open the map from the title ("The Fae
Crossroads"), from any Moonwell ("Journey elsewhere…"), or by going onward from a cleared mission. Each mission keeps its own Moonwells, fallen
warlords and items. Level, Glimmer and Moondew carry over.

1. **The Grubhold** (level 1+): the Fallen Grove, the Grubhold Gatehouse (its Gatewarden holds the
   portcullis), the Gnawing Halls, then the Briar Seal and Gnawfang, Warblade of the Warren. Off the yard,
   through a gap in the west wall: the Goblin Larder, with its meat hooks and a stack of powder kegs.
2. **The Rotwood Hollow** (level 12+): a winding cliff trail, the goblin village of Grubnest (Brakka the
   Skullsplitter holds its palisade gate), the Rotting Glade with its poison pools and ratman pack, then
   the Pyre of Grimtusk, Warlord of the Pyre. West of Grubnest, through the palisade: the Tanner's Camp.
   New foes: Goblin Hexers, whose chant heals nearby allies; Goblin Trappers; and the Ratman Packleader,
   whose howl wakes the glade.
3. **The Gnawed Deep** (level 24+): a ratman mine lit by moon-crystals. The Upper Drift, the Crystal
   Gallery, the Lower Drift, the Breaker's Pit (Grinder the Tunnel-Breaker brings the roof down on you
   and holds the mine gate), the Brood Warren, then the Seer's Hollow and Mother Skritch, the Plague Seer:
   she blinks away when cornered, casts orbs in fans and rings, rains plague vials and bursts in a Dread
   nova. Her crystals block orbs, so use them as cover. New foes: Ratman Delvers, who burrow under you and
   erupt; and Glowseers, who blink away. Off the Crystal Gallery: the Glimmer Grotto, where a great crystal
   heart holds a hoard.
4. **The Moonspire** (level 36+): a ruined fae temple above the clouds. The Moonstair Landing, the Broken
   Bridge, the Terrace of Chimes, the Pilgrim's Stair, the Moon Gate (Varkh the Moon-Pike holds it), the
   Garden of Still Water, then the Crown of the Spire and Silkclaw, the Moonless Blade: a fast duelist who
   steps behind you, throws fans of knives, lunges in Dread and, at half health, splits into shadows. New
   foes: Goblin Skyguards, whose shields turn aside blows from the front (go round, or break the guard
   with heavies); Warchanters, whose chant makes nearby allies burn red, hit harder and ignore stagger;
   and Ratman Shadowblades, who vanish and reappear behind you. A bridge off the Terrace of Chimes leads to
   the Starlit Library, its shelves round a great orrery.
5. **The Frostmere** (level 48+): a frozen mere under the aurora, where the stolen moonlight ran. The
   Shivering Pass, the Rimefall Stair with its frozen waterfall, the Icefisher's Hamlet on its iced-over
   pond, the Causeway across the mere, the Knight's Vigil, the Frozen Court (a ruined winter palace), then
   the Mirror of the Mere. East of the hamlet, on the shore: the Frozen Boathouse. New foes, all rimed and
   carrying chill: Goblin Rimecallers (frost shards and ice waves), Ratman Frostfangs (quick pack biters),
   Goblin Hailslingers (hail pots that leave the ground freezing), Goblin Rimebreakers (hammer slams that
   fan out ice waves), and rimed Rimeguards, Snowdelvers and Rimebrutes. Clear it to unlock New Game+.

Later missions field hardier rank-and-file: in the Rotwood regular foes have 1.25× the health, in the Deep
1.6×, on the Moonspire 2×, on the Frostmere 2.4×, and they hit harder and drop more Glimmer to match.

### Warlords and gatekeepers

Every warlord fights its own way, and each wears something of its own: Gnawfang a crown of bone, Mother
Skritch orbiting seer-crystals, Silkclaw a crescent moon, the Rat King a silver crown, the Frost-Hexer a crown
of ice. The Frostmere brings two new kinds of fight:

- **The Rime Knight** holds the Knight's Vigil and its wall of ice: a fae knight who came to the mere before
  you and froze there. It is built from your own knight and fights with your own moves: four-cut chains, a
  Dread needle thrust, a leaping Skyfall, a Flashcut of its own that blinks behind you, and a crescent that
  sends ice racing along the floor. It **parries** quick cuts and answers at once, so break through with
  heavies, catch it as its own blows end, or Deflect it and Flashcut. At half health its light turns to
  frost (Rime Shift): its wings flare, its slams throw rings of ice, and it chains faster.
- **The Winter Court** waits on the Mirror of the Mere: **Morrowgnaw, the Rat King** and **Hrimwen, the
  Frost-Hexer**, fought together with a bar each. The King is all weight (cleaves, a tail whirl, a royal
  charge and a throne-breaking leap); the Hexer keeps her distance (fans of frost shards, triple ice waves,
  icicle rain, a Dread frost nova, and a blink when you close in). They mostly take turns. When one falls,
  the other **grieves**: it mends, roars into its second phase and the ice of the mere breaks into freezing
  water. A grieving King grows **rime armour**: blows glance off until his stamina is Shattered, which breaks
  the armour for good, and his slams send ice waves out in a fan. A grieving Hexer calls down the winter:
  starbursts of ice in every direction and rings of shards.

Enemies are the sculpted TowerLords models. Their five-bone region rig (root, arms, legs) is grown into
eleven bones when a model loads: a chest and head over the waist, an elbow in each arm and a knee in each
leg, placed and weighted from the vertex layout. That lets foes stride with bending knees and swinging
arms, turn their heads to track you, sidestep when strafing, and wind blows up through the torso.

### Side missions

Once a mission is cleared its landmark on the Crossroads offers three **side missions** (G or Y on the map, or
the "Side missions" button), each replayable, as Nioh's sub-missions and Twilight missions are:

- **Twilight**: the whole mission again under a blood moon, the fog and light gone red. Every foe has 1.6×
  the health and hits harder, drops more Glimmer, and drops gear 8 levels higher and rarer. Felling the warlord
  ends it.
- **Hunt**: the mission's gatekeeper has come back, with more than twice the health, harder blows and more
  stamina, guarded only by the foes at its gate. You start at the mission's second Moonwell, the gate already
  open behind the quarry.
- **Duel**: a **Revenant** waits in the warlord's arena: the echo of a fae knight who fell there before you,
  built from your own knight and fighting with the weapon it carried, stroke for stroke with your own moves.
  **Sir Aldric Thornwake** (the Grubhold) swings a greatblade in wide tides and leaping cleaves; **Sister
  Hollowmoon** (the Rotwood) draws and cuts with a katana and parries often; **Brother Emberlight** (the Deep)
  beats a hammer's rhythm and lands in fire; **Dame Ysolde of the Wane** (the Moonspire) feints, lunges and
  flèches with a rapier and parries more than any; **the Lanternless Knight** (the Frostmere) dances with twin
  fangs. The way to the arena is quiet; cross the Briar Seal and the Revenant rises, and at half health it
  burns brighter.

A side run keeps its own Moonwells and fallen foes and leaves the mission's own as they were (its items
already taken). Its end gathers whatever gear still lies on the ground and pays out: Glimmer, and a piece of
Rare or Fabled gear (Moonlit, the first time through the Frostmere's hardest). The first run of each pays
double Glimmer and an extra piece. Hunts and Duels always leave their foe's Soul Core. Abandon a side run from
the pause menu, or set out elsewhere from any Moonwell.

### The Underbriar

An endless maze beneath the Fae Crossroads, open once the Grubhold is cleared (the "Underbriar" button on the
map, or R / X there). Like Nioh's Abyss, every **depth** is made anew from a seed: a start room, a chain of four
to six rooms joined by briar-hung passages, and side rooms off them holding Glimmer and Moondew draughts (a
draught fills one flask there and then). Each run of five depths is dressed as one of the missions (the
Grubhold's halls, the Rotwood's cliffs and trees, the Deep's crystals and stalagmites, the Moonspire's marble,
the Frostmere's snow) and peopled by that mission's foes; past the twenty-fifth depth the foes of every mission
wander together.

- **Slay every foe** on a depth and the Pixie Gate down opens, with Glimmer for the depth. The HUD counts them.
- **Every fifth depth** ends in a warlord's arena behind a Briar Seal: the gatekeepers and warlords of the five
  missions in turn, then the five Revenants, then round again, harder. Each leaves Rare gear or better (Fabled
  from the twentieth depth) and its Soul Core.
- **The depth after each warlord holds a lit Moonwell**, a checkpoint. The other depths' Moonwells are dim.
  Health, Moondew and Faelight carry from depth to depth; only a lit Moonwell refills them.
- **Fall, and you wake at the last lit Moonwell** you reached; your Echo waits where you fell, on that depth.
- Start again from the first depth or any lit Moonwell you have reached. The Underbriar remembers your deepest.

Foes grow hardier the deeper you go (by the twenty-first depth, as hardy as the Frostmere's; past the
seventy-fifth, everything, warlords included, keeps growing), Champions rise more often, and gear drops at
higher levels and rarer.

### Champions and the Ways

**Champions** are foes risen with the moon's leftover light: one or more affixes, shown in the name over their
bar and a ring in the first affix's colour at their feet. They have 60% more health, hit a little harder, and
pay out as elites do (twice the Glimmer, gear more often and better, a chance of a Soul Core).

| Affix | What it does |
|---|---|
| Swift | moves and strikes a quarter faster |
| Bloodthirsty | mends itself with every blow it lands |
| Emberborn | its blows leave you standing in fire, and it trails flame |
| Rimebound | its blows chill you |
| Blighted | its blows build blight |
| Warded | a ward soaks a third of its health in blows; left alone six seconds, it returns |
| Wrathful | below a third of its health it rages: harder and faster |
| Stoneskin | hardier still, and hard to stagger |
| Stormcaller | calls lightning down where you stand (move off the marked circle) |
| Phasing | steps through the air to your back |

The roll is seeded by mission, foe and Way, so the same foe is the same Champion every time you meet it.
Gatekeepers, warlords and Revenants are never Champions.

Each New Game+ is a **Way**, as Nioh's difficulties are: the **Way of the Knight** (the first walk), the **Way
of the Thorn**, the **Way of the Moon**, the **Way of the Fae Lord**, and then the Fae Lord +1, +2... Each keeps
your level, gear, weapons, Soul Cores, skills, side-mission record and Underbriar record, and begins the
missions again with foes half again as hardy, hitting harder, gear twenty levels higher, and Champions: a few
on the first Way (never in the Grubhold), one in seven on the Thorn, more with two affixes on the Moon, and up
to three affixes on the Fae Lord. Divine gear drops from the Way of the Thorn on, more often on each Way after.

Missions are data. Each file in `src/levels/` describes one: where it sits on the Fae Crossroads, its areas,
fog and light, Moonwells, foes, items (an item can wait inside a breakable), letters, Lost Pixies, gate,
seal and exit (and, for a fight whose arena gives way, where the ice breaks), plus a `build()` that dresses
the world with the engine's builders. A mission's `boss` can name one warlord or a pair.

## Code

```
index.html        the game: canvas, HUD and menu styles
library.html      the asset library
src/main.js       boot, game loop, missions and level switching, side runs (a duel's Revenant, a hunt's quarry, spoils), Moonwells, souls and the Echo, boss fights (single or paired), breakables and keg blasts, letters, Lost Pixies, saving
src/player.js     the knight's controller: weapons and stances, forms and chains, pause combos, finishers, the combo counter, moonlight waves, charge, Frenzy, Switch Strike, launcher and air combos, dash, slide, Wingleap and glide, Moonstep and Riposte, Deflect and Flashcut, Resonance, Fae Shift, charm effects
src/movesets.js   the first five weapons' stance forms (standing, moving and pause strings), every strike's numbers, finishers, slide and air strikes, combo and movement tuning
src/arts.js       the Fae Arts: darts, pixie bombs and the three brands
src/armory.js     the fifteen armory weapons: which archetypes they cover, their numbers, mechanics and where they are won
src/signatures.js the fifteen's own strikes: animations, numbers and forms, heavies, finishers, run, dash, slide, air and Switch strikes
src/strikeshapes.js  shapes of strike the movesets are built from: cuts, chops, thrusts, whirls, rising blows, twirls, windmills, punches, rakes, strings
src/skills.js     weapon skills: the skill tree, mastery and points, and every weapon's Backstep Strike, Guard Counter, Air Finisher and Weapon Skill
src/ranged.js     ranged weapons: the Wisp Pod, Moonbow, Starlock Rifle and Thunder Cannon; aiming, firing, ammunition, shots in flight, headshots
src/rangedmodels.js  their models (the bow's string follows the draw hand)
src/gear.js       gear: rarities, the effect pool, armour sets and their bonuses, item generation, names, damage and defence
src/loot.js       loot on the ground: what fallen foes drop (gear and Soul Cores), the beams, walking over it to take it
src/cores.js      Soul Cores: the 24 cores, their passives and skills (thrown knives, spears, bombs, clouds, slams, blinks, orbs, waves...), fusing, and using them
src/sides.js      side missions: Twilight, Hunts and Duels for each mission, their foes, difficulty, loot and spoils
src/underbriar.js the Underbriar: a depth made from a seed (rooms, passages, decor in five looks, foes, treasure, warlord arenas), checkpoints and scaling
src/champions.js  Champions: the ten affixes, how often they rise and with how many, their ring and ward
src/ways.js       the Ways (New Game+ cycles): names, what each asks, and Divine gear's weight
src/armorymodels.js  their models (the chain's links, the turning saw-wheel, the shield on the forearm)
src/armoryanims.js   their holds, one-handed variants of the sword's strikes, the shield bash and rush, the throws
src/moveanims.js  keyframes for the forms' strikes, finishers and the slide, Wingleap and glide poses
src/charms.js     the charms: names, descriptions and slot count
src/knight.js     the knight and its weapons, built from primitives, with pose blending (angle-aware, so weapons can twirl) and two-bone IK for both arms and blades
src/enemies.js    enemy stats and attack chains (blink, burrow, volleys, rings, ice waves), AI (sight, hearing, idle wandering, alerts), procedural animation on the rigs, knight-shaped foes and the Revenants, parrying, rime armour, warlord regalia, burning and rime-slowed foes, projectiles and hazards
src/world.js      the world engine: collision, builders (walls, cliffs, trees, huts, palisades, fires, crystals, mine timbers and rails, balustrades, arches, moonwater, snowy firs, drifts, icefalls, breaking ice), breakables, letters, Lost Pixies, aurora, Moonwells, gates (portcullis, palisade, ice wall), Briar Seal, wall cutout shader
src/levels/       one file per mission (keep.js, rotwood.js, deep.js, moonspire.js, frostmere.js); shape.js has ring and path helpers; index.js sets the unlock order
src/overworld.js  the Fae Crossroads: the overworld map's terrain, landmarks, road, reveals, the walking knight and its camera
src/camera.js     third-person camera with lock-on, the over-the-shoulder aim, wall collision and shake
src/fx.js         particles, debris, sword trails, slash arcs, telegraphs
src/audio.js      every sound and both music tracks, synthesised with WebAudio
src/hud.js        bars, lock-on reticle, boss bar, prompts, banners, letters and the ? / ! markers over foes
src/menu.js       title, pause, Moonwell, charms, the Arsenal (loadout, ranged weapon and forging), Gear (armour, weapons, Soul Cores), Skills, movesets, the Journal, the map's overlay (labels, mission panel, side missions), controls, settings and ending screens
src/save.js       localStorage save and settings
src/textures.js   procedural stone, brick, moss, forest floor, cave floor, rock, snowfield, lake ice, thatch and sky textures
src/models3d.js   loads the sculpted models into three.js and derives their eleven-bone rigs
```

Add `?manual` to the URL to stop the render loop; `window.__pl.tick(frames)` then steps the game, which is
how it was playtested headlessly.

## Assets

PixieLords reuses the art made for [TowerLords](https://github.com/Imyala/TowerLords). The files here are
copies, taken from TowerLords at commit `b6dc98c`. Nothing in TowerLords was changed, and the two repos don't
depend on each other.

Browse everything with the asset library (`library.html`), served the same way as the game.

```
assets/
  manifest.json          every asset below, with names, roles, traits and the TowerLords file it came from
  models/goblins/        10 sculpted goblins
  models/ratmen/         9 sculpted ratmen (the burrower has no sculpt yet)
  concept/               14 enemy-family concept sheets, 10 enemies each
  reference/goblins/     one concept crop per goblin role (01-scout … 10-commander)
  reference/ratmen/      one concept crop per ratman role (01-scout … 10-burrower)
  ui/                    skill-tree glyphs (PNG + SVG)
vendor/three.module.js   three.js r160
```

### Models

Each model is a ~5k-triangle, textured and rigged version of a Meshy sculpt. It comes as five files:

| File | What it is |
|------|------------|
| `<id>_asset.json` | Geometry, rig and texture in one file. `src/models3d.js` loads it. |
| `<id>_5k.obj` / `.mtl` | The same mesh, for Blender or Godot |
| `<id>_atlas.png` | 1024² texture atlas used by the OBJ |
| `<id>_rig.png` | Bone-weight plot, for checking the rig |

Ids are `<family>-<role>`, for example `goblin-spearguard` or `ratman-packleader`.

```js
import * as THREE from 'three';
import { createModel, animateWalk } from './src/models3d.js';

const goblin = await createModel('goblin-clubber');   // THREE.Group, feet on y = 0, facing +Z
scene.add(goblin);
// each frame:
animateWalk(goblin, clock.elapsedTime, 1);             // amount 0 = standing still
```

`createModel(id, { scale })` applies each role's size from TowerLords, so a clubber is 1.35× a scout. The
rig has five bones: root, armL, armR, legL and legR. Some models leave out the arm or leg bones because
swinging them would bend the mesh. The archer, spear guard, trapper and slinger have no arm swing, and the
goblin shaman has no leg swing. `userData.arms` and `userData.legs` list only the bones that exist.

### Credits

Models, concept art and the model pipeline are © 2026 Imyala, MIT licence. The pipeline that produced the
models lives in TowerLords under `tools/model-pipeline/`. three.js is © three.js authors, MIT licence.
