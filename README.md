# PixieLords

A fast, stance-based action game in the browser, inspired by the Nioh series, Onimusha and the swordplay of
NieR: Automata. You play a fae knight on a run of fifteen missions in three acts, each ending with a warlord.
The first act crosses goblin and ratman country (a ruined keep, a burning forest, a crystal mine, a temple above
the clouds, a frozen mere); the second crosses the Moonlit Sea to the Waning Isles (a drowned abbey, a war-forge
in a fire mountain, an overgrown palace garden, a crater where the moon's shard fell, and the Waning Queen's
court in the sky); the third rides the white river of moonlight up to the moon itself (its silver shore, the
crystal hollows inside it, the first fae's necropolis, the black glass of its dark side, and its heart, where
the Eclipse is chained). After that: side missions, New Game+ Ways, and the endless Underbriar.

## Play

The game loads its models over HTTP, so serve the folder and open it in a desktop browser:

```sh
python3 -m http.server
# then open http://localhost:8000
```

Made for keyboard and mouse; a gamepad works too, laid out as Nioh's Type A. Click the game to capture the
mouse. Progress saves to the browser every time you rest at a Moonwell, vanquish a warlord or clear a mission.
The Controls screen (title or pause menu) shows every key, a diagram of the gamepad, and the techniques.

| Action | Keyboard + mouse | Gamepad (Xbox · PlayStation) |
|--------|------------------|---------|
| Move / camera | WASD / mouse | Left / right stick |
| Strike · strike hard | Left click · right click | X · Y (□ · △) |
| Guard (tap as a blow lands to Deflect) | Shift | LB (L1) |
| Dodge (hold to sprint) | Space | A (✕) |
| Slide (at a sprint) · from a slide: Wingleap | Z or Shift · Space | L3 or LB · A |
| Glide (while falling) | Hold Space | Hold A |
| Stance High / Mid / Low | 1 · 2 · 3 (or C / X to step) | RB + Y / X / A (R1 + △ / □ / ✕) |
| Resonance (as blue light gathers after a strike) | Tap Shift | RB (R1), or tap LB |
| Switch between your two weapons (as a strike ends: Switch Strike) | V | D-pad left |
| Fae Art: use · change | T (or Shift + R) · Y | D-pad down · D-pad right |
| Aim the ranged weapon · fire (hold to draw the bow) | Ctrl or L · left click | Hold LT · RT (L2 · R2) |
| Weapon Skill (once learned) | Hold Shift + right click | Hold LB + Y |
| Backstep Strike · Guard Counter (once learned) | Space with no direction, then strike · strike just after a block | A with no direction, then X · X just after a block |
| Charge a heavy (Moonglaive) | Hold right click | Hold Y |
| Launcher | Hold Shift + left click | Hold LB + X |
| In the air: strike · Starfall · air dash | Left click · right click · Space | X · Y · A |
| Thorn Counter | F | RT + B (R2 + ○) |
| Lock on · switch target | Q or middle click · wheel or Tab | R3 · flick right stick |
| Drink Moondew | R | D-pad up |
| Interact · read a letter | E | B (○) |
| Fae Shift (Faelight full) | G | B + Y together (○ + △) |
| Soul Core skills: first · second | Hold G + left click · hold G + right click | RT + X · RT + Y (R2 + □ · R2 + △) |
| Side missions · the Underbriar (on the Crossroads map) | F · R | Y · X |
| Menus: choose · back · tabs · pages within a screen · the chosen item's other actions | Enter · Esc · Q / E · Z / C · F / R | A · B · LB / RB · LT / RT · Y / X |
| Pause | Esc | Start |

The menus are one frame of moonglass and briar. The pause menu and a Moonwell are each a row of tabs along the
top (the pause menu: Knight, Equipment, Arsenal, Skills, Movesets, Wardrobe, Journal, Bestiary, Deeds, Settings,
Controls; a Moonwell: Moonwell, Level up, Equipment, Arsenal, Skills, Patronage, Kinship, Hidden Market,
Wardrobe, Charms, Journal, Deeds), turned
with Q / E (LB / RB) or clicked; a screen with pages of its own (Equipment's kinds, the Market's stalls, Settings,
Controls, the Bestiary's acts) turns them with Z / C (LT / RT). Back from a tab returns to the first one; back
from there closes the menu or leaves the Moonwell. A crescent marks the chosen row and slides as it moves, a line
at the foot says what the row does, the keys it answers to are listed beside it (and can be clicked), and
holding up or down keeps scrolling.

The HUD wears the same look. Top left, the **stance crest** (the stance held, lit in its colour) beside three
blade-shaped bars: health, stamina and Faelight. Bottom left, the **quick-slot cross**, laid out as the d-pad:
Moondew up, the other weapon left, the Fae Art in hand down (its uses on the slot, its name beside it) and the
next art right; on the keyboard each slot shows its key. The ranged weapon and the Soul Cores' skills sit above
the cross, Glimmer bottom right, and the warlord's bar bottom centre, its name between sprigs of briar.

The world is drawn through a **look** of its own: light that runs past white (fires, glows, crystals, the
Moonwell, a Flashcut) blooms; every mission (and the map, the Thornyard and a Twilight's blood moon) has its own
grade, colouring shadows more than light; a vignette and fine grain sit over it all. The moment has its colour
too: red breathing in at the corners when health runs low, the Fae Shift's rose, an Umbral Realm's violet
dusk, a split of colour on a Flashcut or a Thorn Counter, and grey on a fall. *Glow and grade* in Display
settings turns it off for a plainer, lighter image.

Settings (title or pause menu) are in pages as Nioh's are: **Game** (pause while reading, tips, the lock-on
camera's height, camera distance), **Camera** (sensitivity, invert, screen shake), **Sound** and **Display**
(quality, glow and grade).
With *pause while reading* on (the default), the world waits while a lantern-wisp's words, a letter or a tip
are open.

Locked on, the camera rises as high as it needs to keep the foe's upper body in view over the knight's head and
wings (higher the closer and smaller the foe) and shifts a little over the right shoulder for foes of ordinary
size; the mouse or right stick tilts it further up or down.

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
  count; four seconds without a hit clears it. **Movesets** (pause menu) lists every form.
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
  There are 35, one for each kind of foe (a Scout's, a Brute's, a Shaman's, a Fallen Knight's...) and one for each gatekeeper and
  warlord. Set two under **Gear** (the Soul Cores tab). Each lends a **passive** from the gear pool (Brute: +30
  health; Silkclaw: +20% damage from behind) and a **skill**: hold Fae Shift and strike for the first core's,
  strike hard for the second's. Skills cost Faelight. Among them: a fan of thrown knives, a phantom spear, a
  firebomb, a blight cloud, a leap and slam, Shadow Step (blink behind a foe and cut), seeking hex orbs, a
  bola, a Blood Frenzy (harder strikes, no stagger), ice waves, the Gatewarden's gate-breaking hammer, Brakka's
  thrown axes, Grimtusk's ring of fire, Varkh's lance, the Rime Knight's crescents and the Frost-Hexer's nova.
  A tap of Fae Shift still shifts. A core found again **fuses** into the one you hold, up to +4: each step
  makes its skill hit harder and its passive stronger.
- **The Moonwell's forge.** Open Gear at a Moonwell to **reforge** a piece (roll one of its effects anew, for
  Glimmer by its level and rarity) or **soul-match** it (raise its level to that of another piece of its kind,
  a weapon of the same type or armour for the same slot, which is consumed), so a favourite piece can keep up.
- **Deeds.** Long goals, as Nioh's titles are, kept across every mission, Way and depth (pause menu or any
  Moonwell): goblins, ratmen, fae knights, Champions, gatekeepers, warlords and Revenants felled; Deflects,
  Flashcuts, Executions, ranged hits and Fae Arts; missions and side missions cleared; the deepest Underbriar
  depth; Lost Pixies and letters found; gear dismantled and smithed; Soul Cores fused; Ways walked; Moondew
  drunk; Glimmer taken; Revenants laid to rest at their graves; wares bought at the Hidden Market; Umbral
  Realms dispelled; Kindred Spirits called; and falls. Each of the 28 has three tiers; a tier pays Glimmer (2,500, 12,000, 50,000), Moonpetals (5, 10, 15) and a
  small bonus for good (Goblinbane: +3% posture damage a tier; Warlord's Bane: +20 health a tier...).
- **Arsenal and forging.** You carry two weapons at a time, one in hand and one on your back, as in Nioh.
  Choose them in the **Arsenal** (pause menu or any Moonwell). At a Moonwell, forge a weapon with Glimmer, up
  to +10; each rank is 5% more damage with it.
- **Fae Arts.** Tools beside the weapon, like Nioh's ninjutsu and magic, with a few uses each that return at
  every Moonwell. **Thistle Darts** (carried from the start) sting and stagger ordinary foes; **Pixie Bombs**
  (the Goblin Larder) burst where they land, knock foes down and set off powder kegs. The brands lay an
  element on your weapon for thirty seconds, one at a time: **Emberbrand** (the Tanner's Camp) sets foes
  burning, **Stormbrand** (by the Moon Gate) breaks posture harder and arcs lightning to a second foe, and
  **Rimebrand** (the Frozen Boathouse) slows foes to a crawl. Five more are found further on: **Moon Veil**
  (the Drowned Abbey; for twenty seconds blows land 40% lighter), **Briar Snare** (the Thornwood Court; a seed
  that bursts into briars and holds foes near-still for four seconds), **Moonlance** (the Starfall Crater; a
  lance of moonlight through every foe in a line), **Pixie Haste** (the Waning Court; for twenty seconds strikes
  and dashes cost a third less stamina and come faster) and **Healing Pollen** (the Silver Shore; mends a third
  of your health over six seconds).
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
| Tide-Monk's | the Drowned Abbey | chill builds half as fast | Moondew heals 30% more, stamina returns 10% faster |
| Ironwright's | the Emberforge | 40% less harm from fire | +12% damage with heavies and finishers, +15% posture damage |
| Thornwood Courtier's | the Thornwood Court | +15% damage from behind | one strike in six opens a bleeding wound |
| Starfallen | the Starfall Crater | +20% Faelight | +10% damage and 10% more Glimmer |
| Waning Guard's | the Waning Court | +40 health | blows land 6% lighter, strikes at full health hit 10% harder |
| Selenite | the Silver Shore | +15% Faelight, stamina returns 10% faster | Moondew heals 30% more, +60 health |
| Geodeborn | the Hollows of Selene | chill builds half as fast | +15% posture damage, blocked blows cost 20% less |
| First Fae's | the Necropolis | +15% damage from behind | Deflects give back 20 more stamina, Executions hit 20% harder |
| Umbral | the Umbral Sea | +12% damage below a third of health | +12% damage, one strike in six opens a bleeding wound |
| Eclipse | the Heart of the Moon | +20% Faelight, 10% more Glimmer | +15% damage, blows land 8% lighter |

Item levels run 1–6 in the Grubhold, 8–14 in the Rotwood, 16–22 in the Deep, 24–30 on the Moonspire and
32–38 on the Frostmere, and so on eight levels a mission, to 112–118 at the Heart of the Moon; 126 higher on each
New Game+ (each Way, below), which keeps your gear, skills and weapons. In the Underbriar they follow the
depth's own level. From the Way of the Thorn on, a sixth rarity drops:
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
2. **The Rotwood Hollow** (level 10+): a winding cliff trail, the goblin village of Grubnest (Brakka the
   Skullsplitter holds its palisade gate), the Rotting Glade with its poison pools and ratman pack, then
   the Pyre of Grimtusk, Warlord of the Pyre. West of Grubnest, through the palisade: the Tanner's Camp.
   New foes: Goblin Hexers, whose chant heals nearby allies; Goblin Trappers; and the Ratman Packleader,
   whose howl wakes the glade.
3. **The Gnawed Deep** (level 18+): a ratman mine lit by moon-crystals. The Upper Drift, the Crystal
   Gallery, the Lower Drift, the Breaker's Pit (Grinder the Tunnel-Breaker brings the roof down on you
   and holds the mine gate), the Brood Warren, then the Seer's Hollow and Mother Skritch, the Plague Seer:
   she blinks away when cornered, casts orbs in fans and rings, rains plague vials and bursts in a Dread
   nova. Her crystals block orbs, so use them as cover. New foes: Ratman Delvers, who burrow under you and
   erupt; and Glowseers, who blink away. Off the Crystal Gallery: the Glimmer Grotto, where a great crystal
   heart holds a hoard.
4. **The Moonspire** (level 26+): a ruined fae temple above the clouds. The Moonstair Landing, the Broken
   Bridge, the Terrace of Chimes, the Pilgrim's Stair, the Moon Gate (Varkh the Moon-Pike holds it), the
   Garden of Still Water, then the Crown of the Spire and Silkclaw, the Moonless Blade: a fast duelist who
   steps behind you, throws fans of knives, lunges in Dread and, at half health, splits into shadows. New
   foes: Goblin Skyguards, whose shields turn aside blows from the front (go round, or break the guard
   with heavies); Warchanters, whose chant makes nearby allies burn red, hit harder and ignore stagger;
   and Ratman Shadowblades, who vanish and reappear behind you. A bridge off the Terrace of Chimes leads to
   the Starlit Library, its shelves round a great orrery.
5. **The Frostmere** (level 34+): a frozen mere under the aurora, where the stolen moonlight ran. The
   Shivering Pass, the Rimefall Stair with its frozen waterfall, the Icefisher's Hamlet on its iced-over
   pond, the Causeway across the mere, the Knight's Vigil, the Frozen Court (a ruined winter palace), then
   the Mirror of the Mere. East of the hamlet, on the shore: the Frozen Boathouse. New foes, all rimed and
   carrying chill: Goblin Rimecallers (frost shards and ice waves), Ratman Frostfangs (quick pack biters),
   Goblin Hailslingers (hail pots that leave the ground freezing), Goblin Rimebreakers (hammer slams that
   fan out ice waves), and rimed Rimeguards, Snowdelvers and Rimebrutes. The Winter Court falls, and still
   the moon does not wax: Maelis is gone from the ice, and her tracks lead east across the frozen sea.

**Act II: the Waning Isles.** Across the Moonlit Sea, reached by a causeway from the Frostmere on the
Crossroads map. The Lantern Court's own lands, gone over to the Waning Queen. Each mission here is a run of
halls joined by passages (built with the room kit, `src/levels/rooms.js`), and its foes include fae knights
gone over to the Queen, who fight with your own weapons and strikes.

6. **The Drowned Abbey** (level 42+): the Sea Stair, the Flooded Cloister round a sea-cold pool (the Sunken
   Garth off its west walk), the Nave of Bells (the Scriptorium off to the east), the Bell Tower Gate
   (**Brother Tolland, the Bell-Warden**: a hammer, and a bell whose toll sends rings of the tide racing out),
   the Undercroft, then the Drowned Choir and **Abbess Morwen, the Drowned Saint** (a staff of the tide, orbs,
   undertows, a blink and a bell that drowns). New foes: Drowned Ratmen and Brine Brutes whose blows chill,
   Goblin Tidecallers who mend their kin, and the abbey's Hollow Squires (sword and shield) and Hollow Lancers.
7. **The Emberforge** (level 50+): a war-forge in a fire mountain, its halls pooled with molten iron. The Ashen
   Gate, the Bellows Hall (the Slag Pits off to the west), the Foundry Floor, the Great Anvil (**Forgemaster
   Ghurk**: every slam leaves the ground burning; he throws slag, and rains it in his second wind), the Cooling
   Halls, then the Iron Throne and **the Iron Tyrant**, a fae knight the forge swallowed (a greatblade, crowns
   of fire racing out along the floor). New foes: Forgeguards (shields), Hammerers, Smelters (slag pots) and
   Slag Brutes, and Iron Sentinels, slow knights in forge-iron whose vents send fire along the ground.
8. **The Thornwood Court** (level 58+): the Lantern Court's palace garden, walled in hedges of briar. The Briar
   Wicket, the Overgrown Parterre (a garden maze; the Ruined Orangery off to the east), the Gallery of Thorns,
   the Warden's Court (**Sir Caddoc, the Briar Warden**, whose chain-blade reaches farther than any sword), the
   Queen's Rose Garden, then the Thorned Throne and **Prince Hawthorn, the Thorned Heir** (a scythe; crescents
   of thorn, blinks, and a field of thorns in his second phase). New foes: Thorn Knights (rapiers, and they
   parry), Thorn Reavers (scythes), Thornlings, Briar Stalkers, Briar Hexers and Thornbows.
9. **The Starfall Crater** (level 66+): glass fields and crystal groves round a fallen shard of the moon. The
   Crater Rim, the Glass Fields (the Geode off to the west), the Long Descent, the Shard Gate (**the Shardling**,
   a brute grown through with moon-glass: lines and rings of shards), the Heart of the Crater, then the
   Moonshard and **Gorgathul, the Star-Eater**, a rat grown vast on the moon's light (orbs, falling moons,
   star rings and a nova). New foes: Starbitten Ratmen, Shardseers, Crystal Brutes, Goblin Starcallers and
   Star-Shades (twin daggers; they blink behind you).
10. **The Waning Court** (level 74+): the Queen's palace hung in the sky. The Last Stair, the Hall of Crescents,
   the Night Gardens over the clouds (the Observatory off to the east), the Queen's Vigil (**Maelis, the Lost
   Knight**, the knight who went ahead of you, now the Queen's: your own strikes, and she drops her guard after
   the fourth cut of a chain), the Antechamber of the Moon, then the Throne of the Waning Moon and **the Waning
   Queen** (a moon-ring; waning tides, thrown moons, blinks, and the dark of the moon). Her fall sends the
   hoarded moonlight up in a white river, and the river carries you on to the moon.

Each second-act mission has its own armour set, a charm to find and a charm from each of its gatekeeper and
warlord, four letters (the other knight's notes, and the Queen's own), five Lost Pixies, and three side
missions (Twilight, a Hunt, and a Duel with one of five more Revenants: Sir Wendel Graves's daggers, Dame
Ashkettle's burning hatchets, Brother Rook's claws, Sister Cinderwing's fans and the Oathbound's hexblade).

The third act, on the moon (the pale island east of the Waning Isles on the map, over a bridge of moonlight).
The Queen hoarded the moonlight to starve what the first fae chained at the moon's heart; with the light back,
it wakes.

11. **The Silver Shore** (level 82+): the moon's near shore, the fae world hanging in its sky. The Pixie
   Landing, the Silver Dunes (the Wreck of the Lantern Barge off to the east), the Shallows of Light, the
   Lighthouse Steps (**Oriel, the Lamp-Keeper**: a lamp swung on a chain as long as the tide, beams of light,
   a lighthouse-fall leap), the Keeper's Cottage, then the Sea of Tranquility and **Gloam, the Shell-Colossus**
   (a crowned ratman grown vast in the shallows: shell mauls, a rolling charge, tides of dust, and a shell that
   closes over it at half health). Foes: Dust-Runners, Shellbacks, Goblin Lampwrights (they relight the
   fallen), Selene Sentries (glaives), Moonbows.
12. **The Hollows of Selene** (level 90+): inside the moon, caverns of singing crystal. The Crystal Mouth, the
   Singing Galleries (the Great Geode off to the west), the Underlake, the Warden's Cut (**Tessaly, the Crystal
   Warden**: a grinding wheel of crystal, shard lines, a cave-in), the Hall of the First Lamps, then the Moth-Nest
   and **Nyx, Mother of Moths** (swarms, dust of dreams, a blink from above, rings of moths, and her young at her
   side). Foes: Crystalbacks, Goblin Geomancers, Crystal Knights (shields), Moth-Shades (fans; they step behind).
13. **The Necropolis of the First Fae** (level 98+): a city of white tombs under the moon's sky. The Mourning
   Gate, the Avenue of Tombs (the Ossuary off to the east), the Garden of Stone Lilies, the Unsleeping Vigil
   (**Sir Corvin the Unsleeping**: a greatblade and the long watch), the Chapel of the First Fae, then the Royal
   Crypt and a pair fought together: **Aurel, the Hollow King** (a hammer that shakes the tombs) and **Ilune,
   the Hollow Queen** (fans, fan-storms, a queen's step). Fell one and the other grieves. Foes: Hollowed
   Courtiers (rapiers), Hollowed Guards (shields), Gravewights, Goblin Bonecallers.
14. **The Umbral Sea** (level 106+): the moon's dark side, where the fae world never rises: a sea of black glass
   under the stars, and low on the horizon the Eclipse, a dark sun ringed in fire. The Terminator, the Black
   Glass Flats (the Well of Stars off to the west), the Shadow Reefs, Vesper's Watch (**Vesper, the Watcher in
   the Dark**: tonfas, barrages, and the dark looking back through her), the Last Strand, then the Hound's Maw
   and **Nightmaw, Hound of the Eclipse** (rending chains, a maw rush, a shadow pounce and the hunt of the
   hound). Foes: Umbral Knights (katanas), Voidfangs, Night-Brutes, Goblin Voidcallers, Star-Shades.
15. **The Heart of the Moon** (level 114+): the hollow at the moon's core, veined with light. The Long Fall, the
   Veins of Light (the First Orrery off to the east), the Hall of Chains, the Lantern's Threshold (**Selene, the
   First Lantern**, who chained the Eclipse and has held the chain alone ever since: she fights with the light
   in her hands), the Heart's Antechamber, then the Heart of the Moon and **the Eclipse, That Eats the Moon**
   (it wears a knight's shape, because a knight is what came for it: a scythe of dark, corona crescents,
   totality, and black moons). Clear it to end the story and unlock New Game+ (the next Way).

Each third-act mission, too, has its armour set, a charm to find and a charm from its gatekeeper and warlord,
four letters (and Maelis's lanterns, left lit ahead of you), five Lost Pixies, and three side missions, the
Duels against five more Revenants: Dame Lark's long chain, Brother Halloway's staff, Sir Mourne's shield,
Tamsin Nightfist's tonfas, and the Last Knight, who fights exactly as you do.

Later missions field hardier rank-and-file: in the Rotwood regular foes have 1.25× the health, in the Deep
1.6×, on the Moonspire 2×, on the Frostmere 2.4×, across the sea 2.8× to 4.4×, and on the moon 4.8× to 6.4×
(a little more, as tiers rise: see [Balance](#balance)), and they hit harder and
drop more Glimmer to match.

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

Once a mission is cleared its landmark on the Crossroads offers three **side missions** (F or Y on the map, or
the "Side missions" button): forty-five in all, each replayable, as Nioh's sub-missions and Twilight missions are:

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
- **Every fifth depth** ends in a warlord's arena behind a Briar Seal: the first act's gatekeepers and warlords
  in turn, the first five Revenants, the second act's gatekeepers and warlords, five more Revenants, the moon's
  gatekeepers and warlords, the last five Revenants, then round again, harder. The depths' looks run through all
  fifteen missions (on the moon: silver dust, crystal hollows, white tombs, black glass, the golden-veined heart). Each leaves Rare gear or better (Fabled
  from the twentieth depth) and its Soul Core.
- **The depth after each warlord holds a lit Moonwell**, a checkpoint. The other depths' Moonwells are dim.
  Health, Moondew and Faelight carry from depth to depth; only a lit Moonwell refills them.
- **Fall, and you wake at the last lit Moonwell** you reached; your Echo waits where you fell, on that depth.
- Start again from the first depth or any lit Moonwell you have reached. The Underbriar remembers your deepest.

Foes grow hardier the deeper you go (by the twenty-first depth, as hardy as the Frostmere's; past the
seventy-fifth, everything, warlords included, keeps growing), Champions rise more often, and gear drops at
higher levels and rarer.

### Patron Spirits

As Nioh's Guardian Spirits: every warlord holds a fae spirit captive, and felling it sets the spirit free to
pledge itself to you. Pledge to one at a Moonwell (**Patronage**). A patron lends a few passive effects and
changes the **Fae Shift**: how hard strikes in it hit and break posture, how long it lasts, an element on every
strike, and a burst that throws back everything near as it begins. The Faelight bar and the Shift's glow take
its colour.

| Patron | Freed from | While pledged | In the Fae Shift |
|---|---|---|---|
| The Fae Lantern | yours from the start | +5% Faelight | as it always was |
| Bramble, the Hedge-Hog | Gnawfang | +10% guard, +30 health | breaks posture twice as hard; blows drain less Faelight |
| Cinder, the Ember Fox | Grimtusk | 25% less fire harm, +3% damage | strikes burn |
| Glim, the Cave-Moth | Mother Skritch | +12% Faelight | lasts longer; strikes feed the Faelight back |
| Hollowmoon, the White Hare | Silkclaw | dashes cost less, +6% from behind | strikes come 30% faster |
| Rime, the Snow Owl | the Winter Court | chill resistance, stamina regen | strikes frost foes |
| Tidemother, the Great Carp | the Drowned Saint | Moondew heals more, +40 health | lasts longer; blows drain half as much Faelight |
| Anvil, the Iron Boar | the Iron Tyrant | heavies hit harder, guard | hits 75% harder, breaks posture harder |
| Briar, the Thorn Wolf | the Thorned Heir | +12% from behind, bleeding | strikes open bleeding wounds, a little faster |
| Starling, the Comet-Crow | the Star-Eater | posture damage, Faelight | strikes crackle and leap to a second foe |
| Crescent, the Moon Stag | the Waning Queen | +8% at full health, +15 stamina | lasts 45% longer |
| Pearl, the Tide Turtle | Gloam | +60 health, Moondew | every strike mends you |
| Dusk, the Moth of Dreams | Nyx | Faelight, pause combos | strikes frost; they feed the Faelight back |
| The Twin Swans | the Hollow King and Queen | Deflects, Executions | every strike lands again as an echo |
| Umbra, the Shadow Hound | Nightmaw | +12% at low health, from behind | hits 95% harder, faster, but burns out sooner |
| Solace, the First Light | the Eclipse | +6% damage, Faelight | hits 80% harder, burns, echoes, mends, lasts longer |

Freeing them counts toward a Deed (Patron-Bound), and a new Way keeps them.

### The Moon Tonight

The game's moon follows the real one: its phase is worked out from the date and drawn in every sky (and on the
map), and each phase lends every mission a small blessing: a new moon's dark makes foes hit 10% harder but
Soul Cores fall twice as often; a waxing crescent fills Faelight faster; the first quarter quickens stamina;
a waxing gibbous brings more Glimmer; a **full moon** raises more Champions, drops more gear and more Glimmer;
a waning gibbous strengthens Moondew; the last quarter strengthens Deflects; a waning crescent drops rarer gear.
Each night, too, three of the missions you have opened lie under an **omen**, the same three for everyone that
night, as Nioh's rotating Twilight missions are: a **Harvest Moon** (half again as much Glimmer), a **Blood
Moon** (twice the Champions, rarer gear) or a **Hunter's Moon** (three times the Soul Cores, more gear). Omens
are marked ☾ on the Crossroads map. Tonight's phase shows on the title screen and in the pause menu; turn it
all off in Settings (*Follow the real moon*).

### Revenant Graves

As Nioh's bloody graves: two **bloodied graves** lie in every mission, a blade driven into a mound and lit red,
where fae knights fell before you. Examine one (at a distance, the world waits while you read) to see who lies
there: a name, a level, the weapon it carried, the harness it died in, its Patron Spirit and what it fell to.
**Challenge** it and it rises as a **Revenant**: a knight in that harness's colours with that weapon, fighting
stroke for stroke as you would (its strokes are a Duel Revenant's of the same weapon, as strong as the
mission's own Duel's, a little less hardy). Lay it to rest for **Moonpetals** (more in later acts and Ways, half
again under an omen), a piece of **its harness or its weapon** (the weapon only if you carry that kind), Rare or
finer and now and then a second, and now and then the **Revenant's Core**. The grave then lies dark until you
rest at a Moonwell; after that another fallen knight lies in it. Fall to a Revenant and it goes back into the
earth; its grave waits. Graves lie in a mission's own run and in its Twilight and Hunt, not on a Duel, and not in
the Underbriar. Where they lie is worked out from each mission's layout: open ground on the way through, well
clear of Moonwells, foes and finds, one in each half of the mission.

### Moonpetals and the Hidden Market

**Moonpetals** are a second coin, pink, kept apart from Glimmer and never lost when you fall. They come from
Revenants laid to rest at their graves, side missions (a Duel pays best, the first time best of all), Deeds
(five a tier, more for the higher), warlords felled the first time on each Way, and the Underbriar's warlords.

They buy from the **Hidden Market**, as Nioh's Hidden Teahouse: a pixie pedlar at every Moonwell. Its wares
change every night at noon, the same for everyone that night, and follow how far you have come:

- **Arms & Armour**: six pieces a night, Fabled or Moonlit (Divine on a Way), at the level of the furthest
  mission you have reached, mostly of the latest sets, weapons only of kinds you carry.
- **Provisions**: a **Moondew Vial** (one more draught for good, up to ten; dearer each time), three **Purses of
  Glimmer**, a **Soul Core** you already hold (to fuse), and **Grave Lanterns**, which wake every grave in the
  mission at once with new Revenants.
- **Dyes**: five of the night's, for the Wardrobe.

What you buy is gone until the next night (lanterns aside). The stall, and what each ware is, shows like the Gear
screen: a list by stall (Z / C, LT / RT) and the chosen ware in full.

### The Wardrobe

At a Moonwell or from the pause menu. The harness can wear the **look of any set** you have ever carried a
piece of (whatever you actually wear still decides defence, effects and set bonuses), and each part can be
**dyed**: plate, cloak, trim, wings and the visor's glow. Three dyes (Ink, Bone, Moss) are yours from the start;
nineteen more are sold in the Hidden Market. The knight is in view at the Moonwell while you change it.

### Kindred Spirits

As Nioh's Visitors. At a Moonwell, **Kinship** offers three kindred fae knights for the night (a name, a level
near yours, a weapon, a harness and a Patron Spirit, lit blue). Pour out a **Moon Cup** and one answers: it walks
the mission a pace behind your shoulder, and fights whatever you are locked on to or whatever is fighting it,
with the weapon it carried (a Duel Revenant's strokes for that weapon) and nearly as hard as you do. It guards
some blows and sidesteps others; red blows it can't guard. **Foes turn on it** as readily as on you (the nearer,
and whoever hit them last, draw them), so it can hold a crowd's attention while you work, and every foe is a
little hardier while it walks with you. Left behind, it catches up in a flicker of light; it comes through a
warlord's briars with you. Fallen, its echo lingers a while: stand over it and give up a third of your health to
raise it. It goes home when a warlord falls, when you rest (call another from the same Moonwell), or when you
fall. Its bar shows under yours. Not on a Duel: a Duel is fought alone.

**Moon Cups**: you start with two and carry up to ten. Gatekeepers leave one; Revenants at their graves often
do; a crate or urn now and then hides one; the Hidden Market sells three a night.

### Umbral Realms

As Nioh 2's Dark Realms. In every mission one foe, among the hardiest of the rank and file about the middle of
the way, has swallowed a shard of the moon's dark and spreads it about itself: a ring of purple dusk on the
ground, fog closing in as you step inside. **Inside, your stamina returns 40% slower and foes hit 15% harder, but
Faelight comes half again as fast.** The host is **Umbral**: more than twice as hardy, harder-hitting, named for
it on its bar. Fell it and the realm is **dispelled**: three times its Glimmer, a piece of Rare gear or better
(and often a second), Moonpetals and, half the time, a Moon Cup. It rises again with the world (a rest, a fall).

### The Bestiary

A tab of its own in the pause menu, beside the Journal: every foe of the fifteen missions, act by act, from goblin scouts to the Eclipse:
where it is met, its arts, its ways (it parries, it shoots, it hides behind a shield, it rimes over...), its Soul
Core and how many you have felled. A foe is known once felled, or once its mission has been cleared.

### The Thornyard

The fae knights' old training ground, reached from the Crossroads map at any time, as Nioh 2's Dojo is. Its
**Trial Stone** lists fifteen trials, each teaching one thing and passing the moment it is done. Choose one and
its lesson is read first (what the technique is for, and its keys, as your keyboard or pad names them); then its
sparring knights step into the ring. Echoes of the yard's old masters: the **Sparring Knight** only takes blows,
the **Yard-Knight** cuts slowly and plainly, to be Deflected, the **Thorn-Knight** thrusts red, to be met with
the Thorn Counter.

| Group | Trials |
|-------|--------|
| First Lessons | The Three Stances (a blow from each) · Resonance (three) · Deflect (three blows) · Flashcut (two) · Thorn Counter (two red strikes) · Chains and Finishers (two finishers) |
| The Knight's Craft | Break and Execute · Switch Strike (three; carry two weapons) · Launcher and Starfall · Moonstep (two) · Fae Shift (fell the knight while shifted) · Fae Arts (two; carry one) |
| Gauntlets | Three at Once (three goblins together) · The Warband (five, an archer at the back) · The Yard-Master (Dame Ysolde, who fights as a Revenant does) |

A fall only ends the trial: nothing is lost in the yard, and you wake at its Moonwell. Its foes leave nothing (no
Glimmer, gear or souls) but the lesson. A first pass pays Glimmer (by the tier of the furthest mission reached,
which the yard's foes are made for) and Moonpetals (5, 8 or 12 by group); a pass without taking a hit, three
Moonpetals more. The Stone keeps each trial's passes, whether it was passed unhurt and the best time. After a
pass the Stone opens again on the next trial. **Yard-Trained** is a Deed for trials passed.

### Balance

Every mission has a recommended level that its gear drops around: the Grubhold 1, then 10, 18, 26, 34, 42,
50, 58, 66 and 74 for the Waning Court. A knight who clears each mission once (and a side mission or two) arrives
at about that level. A mission's **tier** sets how hardy its rank and file are (health by the tier, blows by
1 + 0.85 a tier), and each mission gives its gatekeeper and warlord their own multipliers (`gatekeeper` and
`warlord` in its file), so they keep pace with the knight's level, gear and forging: across every mission an
ordinary foe falls to three or four strikes and takes eight to twelve of its blows to fell you; a warlord takes
forty-odd and needs five to eight. The Underbriar's warlords scale the same way with their depth.

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
missions again, each as hard as a mission six tiers further on (the Way's first mission stands where the
last Way ended; its gatekeepers and warlords rise with it), with the recommended levels and gear 126 levels
higher, and Champions: a few
on the first Way (never in the Grubhold), one in seven on the Thorn, more with two affixes on the Moon, and up
to three affixes on the Fae Lord. Divine gear drops from the Way of the Thorn on, more often on each Way after.

Missions are data. Each file in `src/levels/` describes one: where it sits on the Fae Crossroads, its areas,
fog and light, Moonwells, foes, items (an item can wait inside a breakable), letters, Lost Pixies, gate,
seal and exit (and, for a fight whose arena gives way, where the ice breaks), plus a `build()` that dresses
the world with the engine's builders. A mission's `boss` can name one warlord or a pair.

## Code

```
index.html        the game: canvas, HUD and menus
hud.css           the HUD's styles: stance crest and blade bars, the quick-slot cross, Glimmer, foes' and the warlord's bars, toasts, banners, great words, prompt and messages
menu.css          the menus' styles: moonglass panels, briar corners, the tab spine, rows and the crescent cursor, pages, options, layouts and how screens enter
fonts/            Alegreya SC, Alegreya and Alegreya Sans, served from here (fonts.css; OFL.txt is their licence)
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
src/cores.js      Soul Cores: the 35 cores, their passives and skills (thrown knives, spears, bombs, clouds, slams, blinks, orbs, waves...), fusing, and using them
src/sides.js      side missions: Twilight, Hunts and Duels for each mission, their foes, difficulty, loot and spoils
src/underbriar.js the Underbriar: a depth made from a seed (rooms, passages, decor in fifteen looks, foes, treasure, warlord arenas), checkpoints and scaling
src/champions.js  Champions: the ten affixes, how often they rise and with how many, their ring and ward
src/ways.js       the Ways (New Game+ cycles): names, what each asks, and Divine gear's weight
src/deeds.js      Deeds: the 30 long goals, their tallies, tiers and bonuses
src/armorymodels.js  their models (the chain's links, the turning saw-wheel, the shield on the forearm)
src/armoryanims.js   their holds, one-handed variants of the sword's strikes, the shield bash and rush, the throws
src/moveanims.js  keyframes for the forms' strikes, finishers and the slide, Wingleap and glide poses
src/charms.js     the charms: names, descriptions and slot count
src/knight.js     the knight and its weapons, built from primitives, with pose blending (angle-aware, so weapons can twirl) and two-bone IK for both arms and blades
src/enemies.js    enemy stats and attack chains (blink, burrow, volleys, rings, ice waves), AI (sight, hearing, idle wandering, alerts), procedural animation on the rigs, knight-shaped foes and the Revenants, parrying, rime armour, warlord regalia, burning and rime-slowed foes, projectiles and hazards
src/world.js      the world engine: collision, builders (walls, cliffs, trees, huts, palisades, fires, crystals, mine timbers and rails, balustrades, arches, moonwater, snowy firs, drifts, icefalls, breaking ice), breakables, letters, Lost Pixies, aurora, Moonwells, gates (portcullis, palisade, ice wall), Briar Seal, wall cutout shader
src/levels/       one file per mission (keep, rotwood, deep, moonspire, frostmere; abbey, forge, thornwood, crater, court; shore, hollows, necropolis, umbra, heart); rooms.js is the room kit (rooms and passages, walls with door gaps, briar hedges); shape.js has ring and path helpers; index.js sets the unlock order
src/foes2.js      the second act's foes, gatekeepers, warlords and Revenants
src/foes3.js      the third act's, on the moon
src/overworld.js  the Fae Crossroads: the overworld map's terrain, landmarks, road, reveals, the walking knight and its camera
src/camera.js     third-person camera with lock-on, the over-the-shoulder aim, wall collision and shake
src/fx.js         particles, debris, sword trails, slash arcs, telegraphs
src/audio.js      every sound and both music tracks, synthesised with WebAudio
src/hud.js        the HUD: stance crest, bars, the quick-slot cross, lock-on mark, boss bar, prompts, banners, letters and the ? / ! markers over foes
src/post.js       the look: a half-float target drawn as the screen would be, bloom (a chain of blurs), each place's grade, vignette, grain, and the moment's colour
src/trials.js     the Thornyard: its trials, the yard itself, and the runner (sparring knights, counting what the knight does, passing, failing, rewards)
src/menu.js       the menus' flow (tabs, pages, held scrolling, the cursor) and every screen: title, pause, Moonwell, charms, the Arsenal (loadout, ranged weapon and forging), Gear (armour, weapons, Soul Cores), Skills, movesets, the Journal, the map's overlay (labels, mission panel, side missions), controls, settings and ending screens
src/patrons.js    Patron Spirits: their passives and what each does to the Fae Shift
src/moontonight.js the Moon Tonight: the real moon's phase and blessings, and the night's omens
src/graves.js     Revenant Graves: where the two graves lie in each mission, who fell there (name, weapon, harness, patron, how), the Revenant it rises as, the grave itself
src/market.js     the Hidden Market: tonight's wares (gear, provisions, dyes) and their prices in Moonpetals
src/wardrobe.js   the Wardrobe: dyes, the parts of a look, and the colours a look and its dyes give the knight
src/kindred.js    Kindred Spirits: tonight's kindred at a mission's Moonwells, and the ally knight itself (following, choosing a foe, a Duel Revenant's strokes, guarding, sidestepping, falling and being raised)
src/umbral.js     Umbral Realms: which foe hosts a mission's realm, its look, and who stands in it
src/bestiary.js   the Bestiary: every foe placed in a mission, its role, act, arts, ways and Soul Core
src/menuui.js     the menus' pieces: the frame (title, tab spine, chips, help line, key bar), panels, rows with the crescent cursor, pages, options, the icon set, the moon, the gamepad diagram
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
The Alegreya, Alegreya SC and Alegreya Sans fonts are © The Alegreya Project Authors, SIL Open Font License
1.1 (`fonts/OFL.txt`).
