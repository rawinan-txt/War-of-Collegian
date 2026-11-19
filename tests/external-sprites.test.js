const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { loadGame, tick } = require('./harness');
const imp = require('../tools/import-sprite');
const { encodePng } = require('../tools/pixel/png');

const CLI = path.join(__dirname, '..', 'tools', 'import-sprite.js');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ext-sprite-'));

// synthetic sheet: n frames of w x h, an opaque block whose bottom is at row `feet`
function sheet(file, n, w, h, feet) {
  const rgba = Buffer.alloc(n * w * h * 4);
  for (let f = 0; f < n; f++) for (let y = feet - 9; y <= feet; y++) for (let x = w / 2 - 5; x < w / 2 + 5; x++) {
    const i = (y * n * w + f * w + x) * 4;
    rgba[i] = 200; rgba[i + 1] = 60; rgba[i + 2] = 60; rgba[i + 3] = 255;
  }
  fs.writeFileSync(file, encodePng(n * w, h, rgba));
}

const SHIPPED = path.join(__dirname, '..', 'public', 'assets', 'characters', 'manifest.js');

test('shipped manifest: only listed heroes are external, all others keep built-in sprites', () => {
  const g = loadGame(1, { manifest: SHIPPED });
  const ext = JSON.parse(g.run('JSON.stringify(Object.keys(EXTERNAL_SPRITES))'));
  const all = JSON.parse(g.run('JSON.stringify(heroes.map(h=>h.id))'));
  for (const id of all) {
    assert.equal(g.run('spriteReady(' + JSON.stringify(id) + ')'), true, id + ' renders');
    assert.equal(g.run('!!CHARACTER_ANIMS.' + id + '.external'), ext.includes(id), id + ' external flag');
  }
  assert.deepEqual(imp.check(path.dirname(SHIPPED)), []);
});

test('importer validates size, transparency and format', () => {
  const root = tmp(), f = path.join(root, 'a.png');
  sheet(f, 2, 64, 64, 55);
  assert.throws(() => imp.add(root, 'bug', f, { anim: 'idle', frames: '3' }), /need 192x64/);
  fs.writeFileSync(f, encodePng(64, 64, Buffer.alloc(64 * 64 * 4, 255)));
  assert.throws(() => imp.add(root, 'bug', f, { anim: 'idle', frames: '1' }), /no transparent pixels/);
  assert.throws(() => imp.add(root, 'bug', f, { anim: 'dance' }), /--anim must be/);
});

test('add: auto feet row, config, manifest; remove restores', () => {
  const root = tmp(), f = path.join(root, 'a.png');
  sheet(f, 4, 64, 64, 50);
  const r = imp.add(root, 'bug', f, { anim: 'idle', frames: '4' });
  assert.equal(r.feetRow, 50);
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'sprites.json'), 'utf8'));
  assert.equal(cfg.characters.bug.anims.idle.frameCount, 4);
  assert.match(fs.readFileSync(path.join(root, 'manifest.js'), 'utf8'), /public\/assets\/characters\/bug\/idle\.png/);
  assert.deepEqual(imp.check(root), []);
  imp.remove(root, 'bug');
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'manifest.js'), 'utf8'), /bug\/idle/);
});

test('cli add works end to end', () => {
  const root = tmp(), f = path.join(root, 'a.png');
  sheet(f, 1, 96, 96, 80);
  execFileSync('node', [CLI, 'add', 'bug', f, '--anim', 'idle', '--frames', '1', '--frame', '96x96', '--scale', '1.5', '--root', root]);
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'sprites.json'), 'utf8'));
  assert.equal(cfg.characters.bug.scale, 1.5);
  assert.equal(cfg.characters.bug.anims.idle.feetRow, 80);
});

test('game uses the external sprite: feet on the ground, nearest neighbour, combat untouched', () => {
  const root = tmp(), f = path.join(root, 'a.png');
  sheet(f, 1, 96, 96, 80);
  imp.add(root, 'bug', f, { anim: 'idle', frames: '1', frame: '96x96', scale: '1.5' });
  const g = loadGame(7, { manifest: path.join(root, 'manifest.js') });
  assert.equal(g.run('CHARACTER_ANIMS.bug.external'), true);
  assert.equal(g.run('spriteReady("bug")'), true);
  g.run('ctx.__calls.length=0');
  g.run('drawSpriteFrame("bug","walk",0,300,200,true)'); // no walk sheet -> falls back to idle
  const calls = g.run('ctx.__calls').filter((c) => c.k === 'drawImage');
  assert.equal(calls.length, 1);
  const a = calls[0].args; // img, sx, sy, sw, sh, dx, dy, dw, dh
  assert.deepEqual([a[3], a[4], a[7], a[8]], [96, 96, 144, 144]);
  assert.ok(Math.abs(a[6] + (80 + 1) * 1.5 - 224) <= 0.5, 'feet row sits on y+24');
  assert.equal(g.run('ctx.imageSmoothingEnabled'), false);
});

test('hero stats and a full battle are identical with an external sprite', () => {
  const root = tmp(), f = path.join(root, 'a.png');
  sheet(f, 1, 64, 64, 55);
  imp.add(root, 'bug', f, { anim: 'idle', frames: '1' });
  const run = (opts) => {
    const g = loadGame(11, opts);
    g.run('team=["bug","mecha","night","lab","chem","dental"]; startBattle()');
    tick(g, 20);
    return g.run('JSON.stringify({kills:battle.kills,at:Math.round(battle.at),base:Math.round(battle.baseHp),heroes:JSON.stringify(heroes)})');
  };
  assert.equal(run({ manifest: path.join(root, 'manifest.js') }), run({}));
});
