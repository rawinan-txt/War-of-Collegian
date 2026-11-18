const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { encodePng, decodePng } = require('../tools/pixel/png');
const { generateCharacter } = require('../tools/pixel/generate');
const { CHARACTERS } = require('../tools/pixel/characters');

const ROOT = path.join(__dirname, '..');
const cfg = require('../assets/characters/animations.json').characters;
const COUNTS = { idle: 4, walk: 6, attack: 6, skill: 10, hurt: 3, death: 6 };
const ANIMS = Object.keys(COUNTS);

function sheet(def, anim) {
  const buf = fs.readFileSync(path.join(ROOT, def.anims[anim].sheet));
  return decodePng(buf);
}
function frameOf(png, i) {
  const out = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const s = (y * png.w + i * 64 + x) * 4, d = (y * 64 + x) * 4;
    for (let k = 0; k < 4; k++) out[d + k] = png.rgba[s + k];
  }
  return out;
}
function bounds(f) {
  let minX = 64, maxX = -1, minY = 64, maxY = -1, n = 0;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (f[(y * 64 + x) * 4 + 3]) {
    n++; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  return { n, minX, maxX, minY, maxY };
}

test('PNG encoder round-trips random RGBA', () => {
  const w = 13, h = 7, rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < rgba.length; i++) rgba[i] = (i * 37 + 11) & 255;
  const back = decodePng(encodePng(w, h, rgba));
  assert.equal(back.w, w);
  assert.equal(back.h, h);
  assert.deepEqual(Array.from(back.rgba), Array.from(rgba));
});

test('config lists characters and every sheet exists with the right size', () => {
  assert.ok(Object.keys(cfg).length >= 1);
  for (const [id, def] of Object.entries(cfg)) {
    for (const a of ANIMS) {
      const d = def.anims[a];
      assert.ok(d, `${id}.${a} missing`);
      assert.equal(d.frameCount, COUNTS[a], `${id}.${a} frames`);
      assert.equal(d.frameWidth, 64);
      assert.equal(d.frameHeight, 64);
      assert.ok(d.frameRate > 0);
      assert.ok(fs.existsSync(path.join(ROOT, d.sheet)), `${d.sheet} missing`);
      const png = sheet(def, a);
      assert.equal(png.w, 64 * COUNTS[a], `${id}.${a} width`);
      assert.equal(png.h, 64);
    }
  }
});

test('pixels are hard-edged: alpha is only 0 or 255', () => {
  for (const def of Object.values(cfg)) for (const a of ANIMS) {
    const { rgba } = sheet(def, a);
    for (let i = 3; i < rgba.length; i += 4) assert.ok(rgba[i] === 0 || rgba[i] === 255, `${def.name}.${a} alpha ${rgba[i]}`);
  }
});

test('every frame is non-empty and fits inside the 64x64 frame', () => {
  for (const [id, def] of Object.entries(cfg)) for (const a of ANIMS) {
    const png = sheet(def, a);
    for (let i = 0; i < COUNTS[a]; i++) {
      const b = bounds(frameOf(png, i));
      // the last death frame is allowed to be a tiny puff
      assert.ok(b.n >= (a === 'death' && i === 5 ? 4 : 60), `${id}.${a}[${i}] only ${b.n} px`);
      assert.ok(b.minX >= 0 && b.maxX <= 63 && b.minY >= 0 && b.maxY <= 63);
    }
  }
});

test('idle and walk keep the feet on the ground row (55 +-1)', () => {
  for (const [id, def] of Object.entries(cfg)) for (const a of ['idle', 'walk']) {
    const png = sheet(def, a);
    for (let i = 0; i < COUNTS[a]; i++) {
      const b = bounds(frameOf(png, i));
      assert.ok(Math.abs(b.maxY - 55) <= 1, `${id}.${a}[${i}] bottom row ${b.maxY}`);
    }
  }
});

test('animations actually animate (frames are not all identical)', () => {
  for (const [id, def] of Object.entries(cfg)) for (const a of ANIMS) {
    const png = sheet(def, a);
    const set = new Set();
    for (let i = 0; i < COUNTS[a]; i++) set.add(Buffer.from(frameOf(png, i)).toString('base64'));
    assert.ok(set.size >= (a === 'hurt' ? 2 : 3), `${id}.${a} has ${set.size} distinct frames`);
  }
});

test('palette is limited (<= 24 distinct opaque colours per character)', () => {
  for (const [id, def] of Object.entries(cfg)) {
    const colors = new Set();
    for (const a of ANIMS) {
      const { rgba } = sheet(def, a);
      for (let i = 0; i < rgba.length; i += 4) if (rgba[i + 3]) colors.add((rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2]);
    }
    assert.ok(colors.size <= 24, `${id} uses ${colors.size} colours`);
  }
});

test('generation is deterministic', () => {
  const def = CHARACTERS.bug;
  const a = generateCharacter(def), b = generateCharacter(def);
  for (const anim of ANIMS) {
    assert.equal(a.anims[anim].length, COUNTS[anim]);
    for (let i = 0; i < COUNTS[anim]; i++) assert.ok(Buffer.from(a.anims[anim][i].data).equals(Buffer.from(b.anims[anim][i].data)));
  }
});

test('generated files on disk match a fresh generation (assets are up to date)', () => {
  const def = CHARACTERS.bug;
  const fresh = generateCharacter(def);
  for (const anim of ANIMS) {
    const png = decodePng(fs.readFileSync(path.join(ROOT, cfg.bug.anims[anim].sheet)));
    for (let i = 0; i < COUNTS[anim]; i++) {
      assert.ok(Buffer.from(frameOf(png, i)).equals(Buffer.from(fresh.anims[anim][i].data)), `${anim}[${i}] stale`);
    }
  }
});

test('Bug Hunter config carries combat metadata', () => {
  assert.equal(cfg.bug.folder, 'ict/bug_hunter');
  assert.equal(cfg.bug.skillMode, 'onStack');
  assert.equal(cfg.bug.impact.attack, 3);
  assert.equal(typeof cfg.bug.impact.skill, 'number');
});
