# Adding a faculty base (real-building pixel art)

Status: process drafted from the ICT pilot. Do not remodel other faculties until the ICT base is approved in-game.

## 1. Research (per faculty)
1. Find the faculty's real building and campus from its official site. Faculties are not all at Salaya.
2. If there are several buildings, pick the one that represents the faculty and record why.
3. Open every photo and sort them: **exterior** (use for the facade), interior (hints only). Do not trust file names or captions.
4. Write down only what you can see: silhouette, roof, facade materials/colours, windows, entrance, signature element.
5. Record source URLs, selected building and campus, and every uncertainty in `docs/base-remodel/<id>/REFERENCES.md`
   (copy the ICT file as a template). Photos are reference only: never store them in the repo, never trace or crop them into the sprite.

## 2. Draw
- Add a `draw<Id>()` function in `tools/gen-bases.js` and register it in `BASES`. It uses `tools/pixel/buf.js` (hard-edged, no anti-aliasing).
- Canvas rule: art ≈ 60 × 60 px, drawn at `displayScale: 2` (integer scale, same pixel density as the 64 px characters).
  Bottom row = ground contact. The old base is 100 × 102 px with its bottom at y = 342, so keep roughly the same footprint.
- Front elevation, 1px dark outline, flat colours, about 25–40 colours. Plain pixel lettering for a faculty name sign;
  never reproduce an official logo or insignia without permission.
- `node tools/gen-bases.js` writes `assets/bases/<id>.png` and a preview `docs/base-remodel/<id>/<id>_x8.png`.

## 3. Wire it in (data only)
Add the optional 6th field to the faculty entry in `index.html` (`faculties` array, the single source of faculty data):

```js
['ICT', 'เทคโนโลยีสารสนเทศและการสื่อสาร', '💻', '#39c5ff', 'Digital Beam', {
    buildingName:'ICT Building (MUICT)', sprite:'assets/bases/ict.png', referenceUrl:'https://…', displayScale:2, groundOffset:0
}]
```

- `groundOffset` shifts the sprite vertically (canvas px) if a building needs it.
- The laser look stays in the existing `FACULTY_LASER_VFX` (cosmetic only). Do not copy a laser field into the base block.
- A faculty without the 6th field keeps the original drawing. A sprite that fails to load falls back to it too.

## 4. Verify (all must pass)
- `node tests/bases.test.js` (add the new id to the expectations) and the full `tests/*.test.js` (no new failures vs baseline).
- Combat unchanged: compare `tests/lib/combat-trace.js` runs between the previous `index.html` and the new one (including `draw: true`).
- Browser at 1920×1080, 1366×768, 1280×720: faculty preview shows the sprite, the battle draws it ground-aligned, nothing overlaps the HUD, the laser leaves the building at the usual place.
- All faculties still share `FACULTY_LASER` (500 damage, 45 s cooldown, 1 hit, no status effects).
