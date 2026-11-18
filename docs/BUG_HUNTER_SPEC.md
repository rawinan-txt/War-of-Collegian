# Bug Hunter (ICT) - Visual Specification

Status: **approved specification, no sprite exists yet.** This document is the visual standard for Bug Hunter and the reference for all future War of Collegian character art. It changes no gameplay, stats, AT cost, skills or balance.

Reference image: `War of Collegian Pixel Character Roster.png` (Bug Hunter card and the large "Sprite & Animation" example). That image is a blurry 1536x1024 AI render, so it is a **design reference only**. It must not be cropped and enlarged into a sprite, and the old procedural placeholder must not be reused as the new sprite.

Part 1 is the character design. Part 2 is the technical sprite specification. Part 3 is the validation procedure.

---

## Part 1 - Character design

### Overall impression
A cute, relaxed Mahidol ICT student: a bit nerdy, friendly, holding a glowing laptop. Clearly a university student, not a fantasy warrior. 8-bit-inspired chibi pixel art.

### View and proportions
- Three-quarter view, **facing right**, standing idle; the face turns slightly toward the viewer.
- Head is about **55-58% of the total character height**. Short torso and short legs.
- Full body visible: both hands (one supports the laptop, one is visible at the side) and both shoes.

### Hair
- Dark navy (about `#2a2c52`) with a soft violet-grey highlight band (about `#8a7ba8`) curving across the top of the head.
- Layered side-swept bangs framing the face, parted near the centre, with a small strand falling by the cheek.
- Messy, jagged back and left side; one small ahoge (tuft) on the crown.
- Ears are mostly hidden by hair.

### Eyes
- Very large: about 9-11 px tall (on the 96 px canvas), saturated blue (iris about `#1a4fd8`, lighter `#4aa0ff` toward the bottom), dark pupil.
- Thick dark upper lash line. One or two white sparkle pixels at the upper right of each eye.
- Near eye larger, far eye narrower for the three-quarter angle; a clear gap between the eyes.

### Glasses
- Thin blue frame (about `#2f6fe0`), **1 px** thick, nearly round, fitting each eye, joined by a very thin bridge.
- The eyes must stay clearly readable inside the frames (not merged into them).

### Face
- Peach skin (`#f6cfa8`, shade `#e3a07c`), small pink blush, tiny short mouth, no drawn nose.

### Student outfit
- White shirt (`#f4f4f8`, shade `#c4c8e0`) under a dark navy vest or strap, with a small orange-red collar accent at the neck.
- **Student ID lanyard**: blue cord with a gold-yellow ID card (`#f0c040`) on the chest.
- Dark navy trousers (`#1e2142`, shade `#14162e`).
- Orange-brown shoes (`#c87a4a`), both toes visible.
- Optional small dark grey-brown backpack behind the left shoulder; if used it must stay small and not hide the body.

### Laptop
- Held in front of the body on the right, open and slightly tilted, screen facing the viewer.
- Navy-grey body (`#3a4a8a`), bright blue screen (`#2a7bff`) with a 1-2 px light blue glow (`#7fd0ff`) and a small white `</>` symbol.
- One hand supports it from below.

### Outline
- Dark inner outline (`#14142a`), 1 px, around the whole figure and separating hair shapes.
- Clean white outer outline, 1 px, around the entire silhouette.
- No drop shadow and no glow outside the white outline.

---

## Part 2 - Sprite technical specification

| Item | Requirement |
|---|---|
| Character / ID | Bug Hunter / `bug` |
| Animation / frames | `idle`, 1 frame |
| Frame size | **96x96 px** |
| Format | **8-bit RGBA PNG** (not an indexed palette) |
| Background | 100% transparent |
| Pixel grid | True pixel grid: 1 design pixel = 1 image pixel. No upscaled, blurred or resampled pixels. |
| Alpha | Only fully transparent (0) or fully opaque (255). **No semi-transparent pixels.** |
| Colours | About **40 or fewer** opaque colours |
| Figure height | 80-84 px |
| Head height | about 46 px (55-58% of the figure) |
| Width | about 70 px including the laptop |
| Feet | Lowest opaque row between rows 88 and 90; horizontal centre near column 48 |
| Margin | At least 3 px of transparent space around the figure; nothing touches the frame edge |

Import command (once an approved PNG exists):

```
node tools/import-sprite.js add bug path/to/bug_idle.png --anim idle --frames 1 --frame 96x96 --scale 1.5
```

`--scale` is adjusted after the first in-game look so the on-screen size matches the other heroes.

### Source tooling note
AI image generators usually produce pseudo-pixel art (blur, many colours). If one is used, the result must be cleaned in a pixel editor (for example Aseprite or Piskel): reduce to 96x96 with nearest-neighbour, quantise to about 40 colours, remove semi-transparent pixels and fix edges by hand. The best result comes from a pixel artist redrawing or cleaning the image using the roster as reference.

---

## Part 3 - Automatic validation

Run these from the repository root on the candidate PNG before importing it.

**1. Format, size and transparency (the importer, in a scratch folder so the game is untouched):**
```
node tools/import-sprite.js add bug path/to/bug_idle.png --anim idle --frames 1 --frame 96x96 --root C:/temp/bug-check
```
Fails if the PNG is not 8-bit RGBA, is not exactly 96x96, or has no transparent pixels. It warns about semi-transparent pixels and prints the detected feet row. Delete the scratch folder afterwards.

**2. Colour count, soft alpha and bounding box:**
```
node -e "const {readPng}=require('./tools/import-sprite');const i=readPng(process.argv[1]);const c=new Set();let soft=0,x0=i.w,x1=-1,y0=i.h,y1=-1;for(let y=0;y<i.h;y++)for(let x=0;x<i.w;x++){const k=(y*i.w+x)*4,a=i.rgba[k+3];if(!a)continue;if(a<255)soft++;c.add(i.rgba.slice(k,k+3).join());x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}console.log({size:i.w+'x'+i.h,colors:c.size,softAlpha:soft,bbox:[x0,y0,x1,y1],height:y1-y0+1})" path/to/bug_idle.png
```

**Pass criteria**

| Check | Pass |
|---|---|
| size | `96x96` |
| softAlpha | `0` |
| colors | about 40 or fewer |
| bbox | x from 3 to 92, y from 3 to 92 (3 px margin); bottom `y1` between 88 and 90 |
| height | 80-84 |

**3. Visual checks (manual, against Part 1):**
- Make an enlarged nearest-neighbour preview and compare it with the roster.
- Head is 55-58% of the figure height; hair highlight and ahoge, big eyes with sparkle and thin glasses, lanyard with ID card, laptop with glow and `</>`, dark inner and white outer outline are all present.
- No blur, no stray pixels, no clipping.

**4. In-game checks (after import):**
- Sprite is sharp, feet on the ground line, facing right, not clipped.
- The other 11 heroes and enemies render as before.
- Missing animations (walk, attack, skill, hurt, death) fall back to the idle frame without errors.
- `node tools/import-sprite.js check` and `node --test tests/` pass.

**Not automated:** head ratio and the design details in Part 1 are judged visually. The importer does not check them.

---

## Scope and rules

- This round: specification only. No sprite, animation or in-game import.
- Do not change gameplay, character names, faculties, stars, HP/ATK/DEF, AT cost, cooldowns, skills, damage, the Faculty Laser, the statistics panel, enemy AI or balance.
- Animation work (walk, attack, skill, hurt, death) and the other 11 characters start only after the static Bug Hunter is approved.
