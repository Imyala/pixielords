# PixieLords

A fast, stance-based action game in the browser, inspired by the Nioh series and Onimusha. You play a fae
knight cutting a path through a ruined keep held by goblins and ratmen, up to the warlord on its throne.

## Play

The game loads its models over HTTP, so serve the folder and open it in a desktop browser:

```sh
python3 -m http.server
# then open http://localhost:8000
```

Keyboard and mouse or a gamepad. Click the game to capture the mouse. Progress saves to the browser
every time you rest at a Moonwell or vanquish a warlord.

| Action | Keyboard + mouse | Gamepad |
|--------|------------------|---------|
| Move / camera | WASD / mouse | Left / right stick |
| Strike · strike hard | Left click · right click | RB · RT |
| Guard (tap as a blow lands to Deflect) | Shift | LB |
| Dash (hold to sprint) | Space | B |
| Stance High / Mid / Low | 1 · 2 · 3 (or C / X) | D-pad up / down |
| Thorn Counter | F | LT |
| Lock on · switch target | Q or middle click · wheel or Tab | R3 · flick right stick |
| Drink Moondew | R | X |
| Interact | E | A |
| Fae Shift (Faelight full) | G | Y |
| Pause | Esc | Start |

## How it plays

- **Stances.** High hits hardest and its heavy is a leaping slam. Mid is balanced. Low is quick, dashes
  further, and its heavy is a dashing thrust. Four strikes chain into a spinning cut.
- **Stamina** fuels strikes, dashes and blocked blows. As a strike ends, blue light gathers around the
  knight: tap guard then for **Resonance** and the stamina flows back. Change stance in that moment for a
  Resonant Shift.
- **Deflect and Flashcut.** Tap guard just as a blow lands to Deflect it. Strike straight after for a
  **Flashcut**: one draw-cut that fells ordinary foes outright, bites deep into elites and warlords, and
  chains from foe to foe.
- **The fae dash** can't be touched mid-dash. Dash at the last instant to **Moonstep**, and the world slows
  for a moment while you don't.
- **Dread strikes** glow red and can't be guarded. Dash through them or **Thorn Counter** them into a
  Flashcut.
- Drain a foe's stamina to **Shatter** it, then strike to **Execute**. Catch sleeping foes from behind for
  an **Ambush**.
- Fallen foes release **souls**: gold Glimmer flies straight to you, green motes mend you and violet motes
  feed Faelight. The coloured motes wait where they fell until you come close.
- Strikes, Deflects and Resonance fill **Faelight**. At full, **Fae Shift**: wings flare, damage rises, and
  hits drain Faelight instead of health.
- **Moonwells** heal you, refill Moondew and bring every foe back. Spend Glimmer there to level up, or
  travel between awakened Moonwells. Fall and your Glimmer stays with your **Echo** where you fell.
- **The keep:** the Fallen Grove, the Grubhold Gatehouse (its Gatewarden holds the portcullis), the
  Gnawing Halls, then the Briar Seal and Gnawfang, Warblade of the Warren. Beat him to unlock New Game+.

## Code

```
index.html        the game: canvas, HUD and menu styles
library.html      the asset library
src/main.js       boot, game loop, Moonwells, souls and the Echo, the boss fight, saving
src/player.js     the knight's controller: stances, chains, dash and Moonstep, Deflect and Flashcut, Resonance, Fae Shift
src/knight.js     the knight's model, built from primitives, with pose blending and two-bone IK for the sword arm
src/enemies.js    enemy stats and attack chains, AI, procedural animation on the five-bone rigs, projectiles
src/world.js      level layout, collision, Moonwells, wisp lanterns, portcullis and Briar Seal, wall cutout shader
src/camera.js     third-person camera with lock-on, wall collision and shake
src/fx.js         particles, sword trails, slash arcs, telegraphs
src/audio.js      every sound and both music tracks, synthesised with WebAudio
src/hud.js        bars, lock-on reticle, boss bar, prompts and banners
src/menu.js       title, pause, Moonwell, controls, settings and ending screens
src/save.js       localStorage save and settings
src/textures.js   procedural stone, brick, moss and sky textures
src/models3d.js   loads the sculpted models into three.js
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
