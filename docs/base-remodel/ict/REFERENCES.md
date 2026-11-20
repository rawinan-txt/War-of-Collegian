# ICT Base — references and findings (Phase A)

Status: **concept approved; integrated in the game (Phase B), awaiting in-game approval.** Approval note: add an ICT sign on
the right side. It is plain pixel lettering on a blue board, not the official logo. The official photos are used as
architectural reference only; none of their pixels are in the artwork, and they are not stored in this repository.

## Selected building
- **Faculty:** Faculty of Information and Communication Technology (MUICT), Mahidol University
- **Building:** "ICT Building" / "MUICT Building" (the official site's own labels)
- **Campus:** Salaya, 999 Phuttamonthon 4 Road, Nakhon Pathom 73170
- Floor count, wings, year built and architect: **not stated** on any official page found.

## Source pages (official)
- https://www.ict.mahidol.ac.th/en/facilities/ — "ICT Building" gallery (mostly interiors)
- https://www.ict.mahidol.ac.th/en/contact-us/ — address; the only image labelled "MUICT Building"
- https://www.ict.mahidol.ac.th/en/history/ — faculty history (established 20 May 2009); reuses the same building photo
- https://www.ict.mahidol.ac.th/en/facilities360/muict/ — virtual tour (not opened)

## Reference images reviewed
| File (under `https://www.ict.mahidol.ac.th/en/wp-content/uploads/2023/08/`) | What it actually shows | Used for |
|---|---|---|
| `101-59-of-122-scaled.jpg` | **Exterior**: entrance elevation, large flat canopy, glass tower, stairs (flower overlay in the foreground) | main reference |
| `building-scaled-1.jpg` | Interior atrium courtyard, terracotta paving, 4+ floors of ribbon windows around it | window rhythm, floor count hint |
| `15-108-scaled-1.jpg` | Atrium-side shopfront with 4–5 floors of dark ribbon windows above | window style |
| `ICTBuilding-001/002/004.jpg`, `IMG_0486.jpg`, `010965-26-scaled-1.jpg`, `15-52-scaled-1.jpg` | Interiors (corridor, cinema room, classrooms, 4th-floor Grand Auditorium) | not used for the facade |

## Architectural features taken from the exterior photo
1. Off-white / cream concrete mass with dark-framed ribbon windows
2. Horizontally ribbed grey tile (or painted) strip next to the glass core
3. Tall translucent pale green-teal glass stair/lift tower, the tallest element
4. Large flat cantilevered entrance canopy, thin slab, terracotta/orange edge
5. Recessed entrance wall of vertical timber-look slats, glass door
6. Wide stepped grey concrete stairs
7. Right wing receding with four rows of ribbon windows and a louvre panel at the top

## Uncertainties (please read before approving)
- Only **one** exterior photograph exists on the official pages, and it is an oblique, flower-overlaid crop. Back, sides,
  roof and the full width of the right wing are not visible. The wing's width and the floor count are extrapolated from it
  and from the atrium photos (≥ 4 floors around the courtyard; the Grand Auditorium is on the 4th floor).
- The concept is a **front elevation**; the real photo is oblique, so the canopy looks shorter and the tower more centred
  than in the photo.
- Slat material (real timber vs timber-look cladding) and whether the ribbed strip is tile or painted concrete are unclear.
- Colours are approximated from a daylight photo.
- The real building has **no ICT-blue**. If the base must read as the player's faculty at a glance, a small blue pennant
  could be added later; it is not in the concept because it is not on the real building.
- Not to be confused with Prince Mahidol Hall (a separate five-storey university building that houses the ICT Grand
  Auditorium text on the facilities page).

## Files
- `assets/bases/ict.png` — the game asset: 61×60 px original pixel art, transparent background
- `tools/gen-bases.js` — deterministic generator (`node tools/gen-bases.js`); `tests/bases.test.js` fails if the PNG is stale
- `ict_x8.png` — 8× nearest-neighbour preview
- `ingame-before-1280x720.png` (old base), `ingame-after-1280x720.png` (real game with the ICT base)
- `ict-<resolution>-1-faculty.png`, `ict-<resolution>-2-battle.png`, `ict-laser-crop.png` — verification screenshots
- Process for the other faculties: `docs/ADDING_A_FACULTY_BASE.md`

## Phase B as built
- The existing `faculties` entry for `ICT` got an optional 6th field `{ buildingName, sprite, referenceUrl, displayScale: 2, groundOffset: 0 }`
  (same data source, no second table). `laserVfxTheme` was not added: the cosmetic laser look already lives in `FACULTY_LASER_VFX`.
- `drawBase` draws the sprite nearest-neighbour, bottom edge on the ground line (y = 342), left edge at x = 30. It only reads the image cache;
  the image is requested when the faculty screen is shown (so no test or draw call creates Images). Not loaded yet or failed: original drawing.
- The faculty screen preview shows the same sprite (4× integer scale) for ICT and the original preview for other faculties.
- Unchanged: laser (origin x = 150, y = 318, same numbers), HP (DOM top bar), spawn x, collision and every combat number.
- Known visual note: allies spawn at x ≈ 116, so a freshly deployed unit stands in front of the right wing and can cover part of the sign for a moment.
  Moving the spawn would change combat, so it was left alone.
