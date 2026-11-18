// Writes docs/character-sheet.html: the 12 heroes side by side on a plain background with name, faculty and stars
// (names / faculties / stars are read from index.html, the source of truth).
// Usage: node tools/character-sheet.js   then open docs/character-sheet.html (or screenshot it).
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const cfg = require('../assets/characters/animations.json').characters;

const heroes = [...src.matchAll(/\{id:'(\w+)',name:'([^']+)',f:'(\w+)',star:(\d)/g)].map((m) => ({ id: m[1], name: m[2], f: m[3], star: +m[4] }));
const faculties = {};
for (const m of src.matchAll(/\['(\w+)','([^']+)','([^']*)','#[0-9a-f]{6}','[^']*'\]/g)) faculties[m[1]] = { th: m[2], emoji: m[3] };

const SCALE = 4;
const cells = heroes.map((h) => {
  const fac = faculties[h.f] || { th: h.f, emoji: '' };
  const idle = cfg[h.id].anims.idle;
  return `<div class="cell">
  <div class="spr" style="background-image:url(../${idle.sheet});background-size:${idle.frameCount * 64 * SCALE}px ${64 * SCALE}px"></div>
  <div class="name">${h.name}</div>
  <div class="fac">${fac.emoji} ${h.f} · ${fac.th}</div>
  <div class="stars">${'★'.repeat(h.star)}<span>${'★'.repeat(5 - h.star)}</span></div>
</div>`;
});

const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>War of Collegian - Character Sheet</title>
<style>
body{margin:0;background:#566080;color:#fff;font-family:system-ui,'Noto Sans Thai',sans-serif}
h1{margin:0;padding:18px 24px 6px;font-size:22px;letter-spacing:.5px}
.sub{padding:0 24px 12px;color:#d4dbef;font-size:13px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:8px 24px 24px}
.cell{display:flex;flex-direction:column;align-items:center;padding:8px 0}
.spr{width:${64 * SCALE}px;height:${64 * SCALE}px;background-repeat:no-repeat;background-position:0 0;image-rendering:pixelated}
.name{font-weight:800;font-size:18px;margin-top:2px}
.fac{font-size:13px;color:#e4e9f7;margin-top:2px}
.stars{color:#ffd45a;font-size:15px;margin-top:2px}.stars span{color:#7d87a8}
</style></head><body>
<h1>WAR OF COLLEGIAN - Character Sheet (12 heroes)</h1>
<div class="sub">8-bit pixel art - 64x64 frames shown at ${SCALE}x, nearest-neighbour - names, faculties and stars come from the game code</div>
<div class="grid">${cells.join('\n')}</div></body></html>`;

fs.writeFileSync(path.join(ROOT, 'docs', 'character-sheet.html'), html);
console.log('wrote docs/character-sheet.html with', heroes.length, 'heroes');
