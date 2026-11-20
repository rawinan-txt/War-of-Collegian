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

test('palette is limited (<= 32 distinct opaque colours per character)', () => {
  for (const [id, def] of Object.entries(cfg)) {
    const colors = new Set();
    for (const a of ANIMS) {
      const { rgba } = sheet(def, a);
      for (let i = 0; i < rgba.length; i += 4) if (rgba[i + 3]) colors.add((rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2]);
    }
    assert.ok(colors.size <= 32, `${id} uses ${colors.size} colours`);
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

// ---- Task 5: full roster ----
const HERO_IDS = ['bug', 'mecha', 'lab', 'night', 'chem', 'animal', 'dental', 'music', 'runner', 'global', 'public', 'nurse'];
const FOLDERS = {
  bug: 'ict/bug_hunter', mecha: 'engineering/mecha_freshy', lab: 'science/lab_maniac', night: 'medicine/night_shifter', chem: 'pharmacy/chemist_pro',
  animal: 'veterinary/animal_keeper', dental: 'dentistry/dental_blitz', music: 'music/sound_wave', runner: 'sports/ace_runner', global: 'muic/global_exchange',
  public: 'public_health/health_guardian', nurse: 'nursing/angel_of_care', dog: 'veterinary/dog',
};

test('colour parser accepts #rgb shorthand', () => {
  const { rgb } = require('../tools/pixel/buf');
  assert.deepEqual(rgb('#fff'), [255, 255, 255]);
  assert.deepEqual(rgb('#1a2'), [17, 170, 34]);
  assert.deepEqual(rgb('#102030'), [16, 32, 48]);
});

test('all 12 heroes and the dog have sprite sheets in the agreed folders', () => {
  for (const id of [...HERO_IDS, 'dog']) {
    assert.ok(cfg[id], `${id} missing from config`);
    assert.equal(cfg[id].folder, FOLDERS[id], id);
  }
  assert.equal(Object.keys(cfg).length, 13);
});

test('config matches the game roster: every hero id has a sprite config and the same skillMode', () => {
  const g = require('./harness').loadGame(1, { lazy: true });
  const ids = JSON.parse(g.run('JSON.stringify(heroes.map(h=>h.id))'));
  assert.deepEqual(ids.sort(), [...HERO_IDS].sort());
  for (const id of ids) {
    const mode = g.run(`SKILL_MODE[${JSON.stringify(id)}]`);
    assert.ok(['onDeploy', 'onPulse', 'onStack', 'every3'].includes(mode), `SKILL_MODE for ${id}`);
    assert.equal(cfg[id].skillMode, mode, id);
  }
});

function silhouette(png, i) {
  const f = frameOf(png, i), bits = [];
  for (let k = 3; k < f.length; k += 4) bits.push(f[k] ? 1 : 0);
  return bits;
}

test('every hero has a distinct silhouette (idle) and a distinct skill sheet', () => {
  const sil = {}, skills = {};
  for (const id of HERO_IDS) {
    sil[id] = silhouette(sheet(cfg[id], 'idle'), 0);
    skills[id] = fs.readFileSync(path.join(ROOT, cfg[id].anims.skill.sheet)).toString('base64');
  }
  for (let a = 0; a < HERO_IDS.length; a++) for (let b = a + 1; b < HERO_IDS.length; b++) {
    const A = HERO_IDS[a], B = HERO_IDS[b];
    let diff = 0;
    for (let k = 0; k < sil[A].length; k++) if (sil[A][k] !== sil[B][k]) diff++;
    assert.ok(diff >= 60, `${A} vs ${B} silhouettes differ by only ${diff} px`);
    assert.notEqual(skills[A], skills[B], `${A} and ${B} share a skill sheet`);
  }
});

test('regenerating every character reproduces the committed sheets (assets are up to date)', () => {
  for (const id of Object.keys(cfg)) {
    const fresh = generateCharacter(CHARACTERS[id]);
    for (const anim of ANIMS) {
      const png = decodePng(fs.readFileSync(path.join(ROOT, cfg[id].anims[anim].sheet)));
      for (let i = 0; i < COUNTS[anim]; i++) assert.ok(Buffer.from(frameOf(png, i)).equals(Buffer.from(fresh.anims[anim][i].data)), `${id}.${anim}[${i}] stale`);
    }
  }
});

test('hero skill animations differ from their own attack animations', () => {
  for (const id of HERO_IDS) {
    const a = fs.readFileSync(path.join(ROOT, cfg[id].anims.attack.sheet)).toString('base64');
    const s = fs.readFileSync(path.join(ROOT, cfg[id].anims.skill.sheet)).toString('base64');
    assert.notEqual(a, s, id);
  }
});

// ---- Remodel (reference style): proportions, outlines, hair highlight, eyes ----
const { HEAD_H, FIGURE_H, OUT_DARK, OUT_WHITE } = require('../tools/pixel/rig');
const { rgb } = require('../tools/pixel/buf');

function pixelsOf(id, i = 0, anim = 'idle') { return frameOf(sheet(cfg[id], anim), i); }
function countColor(f, hex) {
  const [r, g, b] = rgb(hex); let n = 0;
  for (let k = 0; k < f.length; k += 4) if (f[k + 3] && f[k] === r && f[k + 1] === g && f[k + 2] === b) n++;
  return n;
}
const opaque = (f, x, y) => (x < 0 || y < 0 || x > 63 || y > 63 ? 0 : f[(y * 64 + x) * 4 + 3]);

test('the head is about 55% of the figure height (big-head chibi proportions)', () => {
  const ratio = HEAD_H / FIGURE_H;
  assert.ok(ratio >= 0.5 && ratio <= 0.62, `head ratio ${ratio.toFixed(2)}`);
});

test('every character has a white outer outline over a dark inner outline', () => {
  for (const id of [...HERO_IDS, 'dog']) {
    const f = pixelsOf(id);
    const [wr, wg, wb] = rgb(OUT_WHITE);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      if (!opaque(f, x, y)) continue;
      const edge = !opaque(f, x - 1, y) || !opaque(f, x + 1, y) || !opaque(f, x, y - 1) || !opaque(f, x, y + 1);
      if (edge) {
        const k = (y * 64 + x) * 4;
        assert.ok(f[k] === wr && f[k + 1] === wg && f[k + 2] === wb, `${id} edge pixel (${x},${y}) is not white`);
      }
    }
    assert.ok(countColor(f, OUT_DARK) >= 80, `${id} has too little dark inner outline`);
  }
});

test('heroes have shaded hair (distinct highlight), a coloured iris and eye sparkle', () => {
  for (const id of HERO_IDS) {
    const look = CHARACTERS[id].look;
    const f = pixelsOf(id);
    assert.notEqual(look.hairHi.toLowerCase(), look.hair.toLowerCase(), `${id} highlight equals base hair`);
    assert.ok(countColor(f, look.hairHi) >= 4, `${id} hair highlight not visible`);
    assert.ok(countColor(f, look.iris) >= 4, `${id} iris colour not visible`);
    // sparkle: white pixels surrounded by opaque pixels (inside the face, not the outline)
    let sparkle = 0;
    for (let y = 1; y < 63; y++) for (let x = 1; x < 63; x++) {
      const k = (y * 64 + x) * 4;
      if (f[k + 3] && f[k] === 255 && f[k + 1] === 255 && f[k + 2] === 255 && opaque(f, x - 1, y) && opaque(f, x + 1, y) && opaque(f, x, y - 1) && opaque(f, x, y + 1)) sparkle++;
    }
    assert.ok(sparkle >= 2, `${id} has no eye sparkle`);
  }
});

test('Health Guardian keeps the public-health theme (green vest, shield with cross, not a business look)', () => {
  assert.equal(cfg.public.faculty, 'PH');
  assert.equal(cfg.public.name, 'Health Guardian');
  const f = pixelsOf('public');
  assert.ok(countColor(f, '#5acbb9') >= 20, 'public-health teal missing');
});
