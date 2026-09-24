# PixieLords

A soulslike action game in the browser, in the vein of Nioh 2 and Dark Souls. You play a fae knight
climbing a ruined keep held by goblins and ratmen. Learn each foe's tells, manage your Ki, and put down
the Warblade on his throne.

## Play

The game loads its models over HTTP, so serve the folder and open it in a desktop browser:

```sh
python3 -m http.server
# then open http://localhost:8000
```

Keyboard and mouse or a gamepad. Click the game to capture the mouse. Progress saves to the browser
every time you rest at a shrine or fell a lord.

| Action | Keyboard + mouse | Gamepad |
|--------|------------------|---------|
| Move / camera | WASD / mouse | Left / right stick |
| Light attack · heavy attack | Left click · right click | RB · RT |
| Guard (tap for Ki Pulse) | Shift | LB |
| Dodge (hold to sprint) | Space | B |
| Burst Counter | F | LT |
| Lock on · switch target | Q or middle click · wheel or Tab | R3 · flick right stick |
| Drink elixir | R | X |
| Interact | E | A |
| Fae Shift (Anima full) | G | Y |
| Pause | Esc | Start |

## How it plays

- **Ki** is stamina. Attacks, dodges and blocked blows spend it; empty it and you stagger. As a strike
  ends, blue light gathers around the knight: tap guard then to **Ki Pulse** and take the Ki back.
- **Dodge rolls** have invincibility frames. Standing still, you step back instead.
- **Burst attacks** glow red and can't be guarded. Dodge them, or press **Burst Counter** as they land
  to shatter the foe's Ki.
- Break a foe's Ki and it reels; strike it to **Grapple**. Unaware foes can be **backstabbed**.
- Hits, counters and pulses fill **Anima**. At full, **Fae Shift**: wings flare, damage rises, and hits
  drain Anima instead of health.
- **Shrines** heal you, refill elixirs and bring every foe back. Spend **Amrita** there to level up, or
  travel between kindled shrines. Die and your Amrita stays where you fell; reach it again to reclaim it,
  die first and it's gone.
- **The keep:** the Fallen Grove, the Grubhold Gatehouse (its Gatewarden holds the portcullis), the
  Gnawing Halls, then the fog gate and Gnawfang, Warblade of the Warren. Beat him to unlock New Game+.

## Code

```
index.html        the game: canvas, HUD and menu styles
library.html      the asset library
src/main.js       boot, game loop, shrines, death and Amrita, the boss fight, saving
src/player.js     the knight's controller: combos, roll, guard, Ki Pulse, Burst Counter, grapples, Fae Shift
src/knight.js     the knight's model, built from primitives, with pose blending and two-bone IK for the sword arm
src/enemies.js    enemy stats and attack chains, AI, procedural animation on the five-bone rigs, projectiles
src/world.js      level layout, collision, shrines, messages, portcullis and fog gate, wall cutout shader
src/camera.js     third-person camera with lock-on, wall collision and shake
src/fx.js         particles, sword trails, slash arcs, telegraphs
src/audio.js      every sound and both music tracks, synthesised with WebAudio
src/hud.js        bars, lock-on reticle, boss bar, prompts and banners
src/menu.js       title, pause, shrine, controls, settings and ending screens
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
