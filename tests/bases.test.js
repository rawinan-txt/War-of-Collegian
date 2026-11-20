// Faculty base sprites: data, drawing, fallback. The art must never change a battle (combat is covered by the combat-trace tests).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadGame } = require('./harness');
const { decodePng } = require('../tools/pixel/png');
const { build } = require('../tools/gen-bases');

const ROOT = path.join(__dirname, '..');
const J = (g, code) => JSON.parse(g.run(`JSON.stringify(${code})`));

test('the committed ICT base PNG matches the generator (re-run node tools/gen-bases.js if this fails)', () => {
  const committed = fs.readFileSync(path.join(ROOT, 'assets', 'bases', 'ict.png'));
  assert.ok(Buffer.compare(committed, build().ict.png) === 0);
});

test('ICT base is a transparent PNG with a hard-edged palette (no anti-aliasing)', () => {
  const img = decodePng(fs.readFileSync(path.join(ROOT, 'assets', 'bases', 'ict.png')));
  assert.equal(img.w, 61); assert.equal(img.h, 60);
  const colours = new Set(); let transparent = 0;
  for (let i = 0; i < img.rgba.length; i += 4) {
    const a = img.rgba[i + 3];
    assert.ok(a === 0 || a === 255, 'alpha is 0 or 255 only');
    if (a === 0) transparent++; else colours.add(img.rgba.slice(i, i + 3).join(','));
  }
  assert.ok(transparent > 0, 'has transparent background');
  assert.ok(colours.size <= 40, `limited palette (${colours.size})`);
});

test('base config lives on the existing faculty entry; only ICT has one and its file exists', () => {
  const g = loadGame(1);
  const withBase = J(g, 'faculties.filter(f=>f[5]).map(f=>f[0])');
  assert.deepEqual(withBase, ['ICT']);
  const cfg = J(g, "faculties.find(f=>f[0]==='ICT')[5]");
  assert.equal(cfg.displayScale, 2);
  assert.equal(cfg.groundOffset, 0);
  assert.match(cfg.referenceUrl, /^https:\/\/www\.ict\.mahidol\.ac\.th\//);
  assert.ok(fs.existsSync(path.join(ROOT, cfg.sprite)));
});

test('drawBase draws the ICT sprite ground-aligned at 2x once loaded, and the old drawing before that', () => {
  const g = loadGame(1);
  g.run("faculty='ICT'");
  g.run('ctx.__calls.length=0;drawBase(35,240,true)');
  assert.equal(J(g, "ctx.__calls.filter(c=>c.k==='drawImage').length"), 0, 'not loaded yet: original drawing');
  assert.ok(J(g, "ctx.__calls.filter(c=>c.k==='fillRect'||c.k==='roundRect'||c.k==='fillText').length") > 0);
  g.run('ensureBase(fdata());const i=BASE_IMGS.ICT.img;i.naturalWidth=61;i.naturalHeight=60');
  g.run('ctx.__calls.length=0;drawBase(35,240,true)');
  const di = J(g, "ctx.__calls.filter(c=>c.k==='drawImage')");
  assert.equal(di.length, 1);
  const [, x, y, w, h] = di[0].args;
  assert.deepEqual([x, y, w, h], [30, 342 - 120, 122, 120]);
  assert.equal(y + h, 342, 'bottom edge sits on the ground line (same as the old building)');
  assert.equal(g.run('ctx.imageSmoothingEnabled'), false, 'nearest-neighbour');
});

test('other faculties and the enemy base keep the original drawing', () => {
  const g = loadGame(1);
  g.run("ensureBase(faculties.find(f=>f[0]==='ICT'));const i=BASE_IMGS.ICT.img;i.naturalWidth=61;i.naturalHeight=60");
  g.run("faculty='EG';ctx.__calls.length=0;drawBase(35,240,true)");
  assert.equal(J(g, "ctx.__calls.filter(c=>c.k==='drawImage').length"), 0, 'faculty without a base sprite');
  g.run("faculty='ICT';ctx.__calls.length=0;drawBase(975,240,false)");
  assert.equal(J(g, "ctx.__calls.filter(c=>c.k==='drawImage').length"), 0, 'enemy base');
});

test('a failed sprite load falls back to the original drawing', () => {
  const g = loadGame(1, { failSheets: 'assets/bases/' });
  g.run("faculty='ICT';ensureBase(fdata());ctx.__calls.length=0;drawBase(35,240,true)");
  assert.equal(J(g, "ctx.__calls.filter(c=>c.k==='drawImage').length"), 0);
  assert.equal(g.run('baseReady(fdata())'), null);
});

test('base drawing does not request images (loading happens on the faculty screen)', () => {
  const g = loadGame(1, { lazy: true });
  g.run("faculty='ICT';startBattle();screen='battle'");
  for (let i = 0; i < 20; i++) g.run('update(0.05);draw()');
  assert.ok(!(J(g, 'Image.requested||[]').some((s) => /assets\/bases\//.test(s))), 'draw/startBattle never request the base');
  g.run('ensureBase(fdata())');
  assert.ok(J(g, 'Image.requested||[]').some((s) => /assets\/bases\/ict\.png$/.test(s)), 'ensureBase (called by the faculty screen) requests the base');
});
