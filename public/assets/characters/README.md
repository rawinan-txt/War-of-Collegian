# External character sprites

Drop-in replacement for hero art. Nothing here is enabled until you import a PNG; heroes without an external PNG keep the built-in sprites (which themselves fall back to the old canvas drawing). Stats, AT cost, skills, balance and combat code are never touched.

```
public/assets/characters/
  sprites.json     source of truth: hero id -> animations (generated and edited by the importer)
  manifest.js      generated; loaded by index.html after assets/characters/animations.js
  <heroId>/<anim>.png   imported sheets (idle, walk, attack, skill, hurt, death)
  _examples/       demo PNGs (not used by the game)
```

## PNG requirements

- 8-bit **RGBA** PNG with a transparent background (not an indexed palette), hard pixel edges (no anti-aliasing).
- One horizontal strip: `frameWidth * frameCount` by `frameHeight`. Default frame is 64x64; any size works with `--frame WxH`.
- Hero faces **right**. The game mirrors enemies automatically.

## Import a sprite (Bug Hunter example)

```
# static single image (idle only) - the game uses it for every state until more sheets exist
node tools/import-sprite.js add bug path/to/bug_idle.png --anim idle --frames 1

# a 4-frame idle strip, 96x96 frames drawn at 1.5x
node tools/import-sprite.js add bug path/to/bug_idle.png --anim idle --frames 4 --frame 96x96 --scale 1.5

# later, add more animation sheets the same way
node tools/import-sprite.js add bug path/to/bug_walk.png   --anim walk   --frames 6
node tools/import-sprite.js add bug path/to/bug_attack.png --anim attack --frames 6
```

Anim names: `idle walk attack skill hurt death`. Missing animations fall back to `idle`. Defaults per anim (frame rate, loop or once) match the built-in sheets; override with `--rate` and `--repeat loop|once`.

Other commands: `list`, `check` (validates all imported files), `remove <id> [--anim x]` (restores the placeholder), `build` (regenerates manifest.js).

Try it with the demo: `node tools/import-sprite.js add bug public/assets/characters/_examples/bug_idle_demo.png --anim idle --frames 1`, then `remove bug` to undo.

## How it behaves in the game

- **Scaling:** frames are drawn at an integer or fractional `--scale` (default 2) with `imageSmoothingEnabled = false`, so pixels stay sharp.
- **Feet alignment:** `--feet auto` (default for idle) records the lowest opaque row of the first frame as the feet line and places it on the ground (`y + 24`). Use `--feet <row>` to set it manually. Other anims reuse the idle feet row.
- **Animation timing:** `impact` frames and skill modes still come from the built-in config, so combat timing does not change. A hero with external sheets of different frame counts should keep the hit near the frame set in `assets/characters/animations.json` (`impact.attack`, `impact.skill`) - tell me if you want those adjustable per hero.
- Corpses play the `death` sheet if present, otherwise show the idle frame.
