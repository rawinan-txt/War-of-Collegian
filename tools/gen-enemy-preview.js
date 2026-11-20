// Builds docs/enemy-remodel/preview.html: an offline browser page with every enemy next to Bug Hunter (6x, 2x as in battle),
// live-playing animations (the real sheets, timing from ENEMY_ANIMS) and pixel-art consistency metrics measured from the PNG files.
// Run: node tools/gen-enemy-preview.js   (read-only for the game; writes only the HTML page)
const fs = require('node:fs');
const path = require('node:path');
const { decodePng } = require('./pixel/png');
const { registry, META } = require('./gen-enemies');

const root = path.join(__dirname, '..');
const REG = registry();
const LIST = [
  ['assignment', 'stage 1+2'], ['deadline', 'stage 1+2'], ['group', 'stage 1'], ['quiz', 'stage 1'], ['final', 'stage 1 boss'],
  ['professor', 'stage 2'], ['ta', 'stage 2'], ['advisor', 'stage 2'], ['exammaster', 'stage 2 boss'],
].map(([id, where]) => ({ id, where, name: META[id].name, role: META[id].role }));
const HERO = { name: 'Bug Hunter (reference hero)', file: 'assets/characters/ict/bug_hunter/idle.png', frames: 4 };

function measure(file, frames = 1) {
  const png = decodePng(fs.readFileSync(path.join(root, file)));
  const fw = png.w / frames, A = (x, y) => png.rgba[(y * png.w + x) * 4 + 3];
  let x0 = 99, x1 = -1, y0 = 99, y1 = -1, soft = 0, n = 0, edge = 0, edgeWhite = 0;
  const colours = new Set();
  for (let y = 0; y < png.h; y++) for (let x = 0; x < fw; x++) {
    const i = (y * png.w + x) * 4, a = png.rgba[i + 3];
    if (!a) continue;
    n++; if (a !== 255) soft++;
    colours.add(png.rgba[i] + ',' + png.rgba[i + 1] + ',' + png.rgba[i + 2]);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    const open = x === 0 || y === 0 || x === fw - 1 || y === png.h - 1 || !A(x - 1, y) || !A(x + 1, y) || !A(x, y - 1) || !A(x, y + 1);
    if (open) { edge++; if (png.rgba[i] > 245 && png.rgba[i + 1] > 245 && png.rgba[i + 2] > 245) edgeWhite++; }
  }
  return { w: fw, h: png.h, bbox: `${x1 - x0 + 1} x ${y1 - y0 + 1}`, colours: colours.size, soft, outerWhite: Math.round((100 * edgeWhite) / Math.max(1, edge)) };
}

const mHero = measure(HERO.file, HERO.frames);
for (const e of LIST) e.m = measure(`assets/enemies/${e.id}/static.png`);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const metricRow = (name, m, tag) => `<tr><td>${esc(name)}</td><td>${tag}</td><td>${m.w}x${m.h}</td><td>${m.bbox}</td><td>${m.colours}</td><td>${m.soft === 0 ? 'hard-edged' : m.soft + ' soft px'}</td><td>${m.outerWhite}%</td></tr>`;

// a live-playing animation: the real sheet, stepped through its frames at its real frame rate
const anim = (id, name, d, scale = 2) => {
  const w = d.frameCount * 64 * scale, dur = d.frameCount / d.frameRate;
  return `<figure class="an"><div class="cell" style="width:${64 * scale}px;height:${64 * scale}px"><div class="spr flip" style="width:${64 * scale}px;height:${64 * scale}px;background:url(../../${d.sheet}) 0 0/${w}px ${64 * scale}px;--end:-${w}px;animation:play-${id}-${name} ${dur}s steps(${d.frameCount}) ${d.repeat === -1 ? 'infinite' : 'infinite'}"></div></div><figcaption>${name} &middot; ${d.frameCount}f @${d.frameRate}</figcaption></figure>`;
};
const keyframes = LIST.flatMap((e) => Object.entries(REG[e.id].anims).map(([name, d]) => `@keyframes play-${e.id}-${name}{from{background-position:0 0}to{background-position:-${d.frameCount * 64 * 2}px 0}}`)).join('\n');

const strip = (id, name, d) => `<div class="strip"><b>${name}</b><img src="../../${d.sheet}" style="width:${d.frameCount * 64 * 2}px;height:128px" alt=""></div>`;

const card = (e) => `<article class="card ${e.where.includes('stage 2') && !e.where.includes('1') ? 'new' : ''}">
  <header><h3>${esc(e.name)}</h3><p><span class="tag">${esc(e.role)}</span> ${esc(e.where)}${REG[e.id].anims.idle.scale ? ` &middot; drawn ${REG[e.id].anims.idle.scale}x in battle` : ''}</p></header>
  <div class="views">
    <figure><img class="s6" src="../../assets/enemies/${e.id}/static.png" alt="${esc(e.name)} 6x"><figcaption>6x approved static design (faces right)</figcaption></figure>
    <figure><div class="field"><span class="spr hero"></span><img class="s2 flip" src="../../assets/enemies/${e.id}/static.png" alt=""></div><figcaption>2x in battle: Bug Hunter vs ${esc(e.name)} (mirrored toward the heroes)</figcaption></figure>
  </div>
  <div class="anims">${Object.entries(REG[e.id].anims).map(([n, d]) => anim(e.id, n, d)).join('')}</div>
  <details><summary>All frames</summary>${Object.entries(REG[e.id].anims).map(([n, d]) => strip(e.id, n, d)).join('')}</details>
  <p class="meta">${e.m.w}x${e.m.h}px, ${e.m.colours} colours, ${e.m.soft === 0 ? 'hard-edged' : e.m.soft + ' soft px'}, art ${e.m.bbox}</p>
</article>`;

const lineup = [
  `<figure><span class="spr hero"></span><figcaption>Bug Hunter</figcaption></figure>`,
  ...LIST.map((e) => `<figure><img class="s2 flip" src="../../assets/enemies/${e.id}/static.png" alt=""><figcaption>${esc(e.name)}</figcaption></figure>`),
].join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>War of Collegian - Enemy Preview</title>
<style>
:root{--bg:#0e1a48;--panel:#142764;--ink:#081032;--chalk:#f1f4ff;--muted:#bcc4ea;--gold:#ffd23a;--sky:#9ad0f5;--road:#c3c8cf}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--chalk);font:15px/1.5 system-ui,"Segoe UI",sans-serif;padding:24px}
h1{margin:0 0 4px;font-size:26px}h2{margin:32px 0 12px;font-size:20px;color:var(--gold)}p.lead{margin:0;color:var(--muted);max-width:80ch}
img,.spr{image-rendering:pixelated}
.bar{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.bar button{font:inherit;color:var(--chalk);background:var(--panel);border:2px solid var(--ink);border-radius:10px;padding:6px 12px;cursor:pointer}
.bar button[aria-pressed=true]{outline:3px solid var(--gold)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(440px,1fr));gap:16px}
.card{background:var(--panel);border:2px solid var(--ink);border-radius:14px;padding:14px}.card.new{border-color:var(--gold)}
.card h3{margin:0;font-size:18px}.card header p{margin:2px 0 10px;color:var(--muted)}
.tag{display:inline-block;padding:1px 8px;border-radius:999px;font-size:12px;font-weight:700;color:var(--ink);background:#52d49a}
.views{display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap}figure{margin:0}figcaption{font-size:12px;color:var(--muted);margin-top:4px;max-width:340px}
.s6{width:384px;height:384px;display:block}.s2{width:128px;height:128px;display:block}.flip{transform:scaleX(-1)}
.bg-sky .s6,.bg-sky .field,.bg-sky .strip img,.bg-sky .cell,.bg-sky .strip2{background:linear-gradient(var(--sky) 70%,var(--road) 70%)}
.bg-dark .s6,.bg-dark .field,.bg-dark .strip img,.bg-dark .cell,.bg-dark .strip2{background:#1c2250}
.bg-check .s6,.bg-check .field,.bg-check .strip img,.bg-check .cell,.bg-check .strip2{background:repeating-conic-gradient(#d9d9d9 0 25%,#fff 0 50%) 0 0/16px 16px}
.field{display:flex;align-items:flex-end;justify-content:center;width:288px;height:150px;padding-bottom:2px}
.spr{display:block;width:128px;height:128px;flex:none}.hero{background:url(../../assets/characters/ict/bug_hunter/idle.png) 0 0/400% 100% no-repeat}
.anims{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.an .cell{overflow:hidden}.an figcaption{max-width:130px}
.strip{margin:8px 0;overflow-x:auto}.strip b{display:block;font-size:12px;color:var(--muted)}
details{margin-top:8px;font-size:13px;color:var(--muted)}summary{cursor:pointer}
.meta{margin:10px 0 0;font-size:12.5px;color:var(--muted)}
.lineup{display:flex;align-items:flex-end;padding:12px 8px 6px;border-radius:14px;overflow-x:auto}.lineup figure{flex:none;text-align:center;width:150px}.lineup figcaption{max-width:none;color:#13204f}
.bg-sky .lineup{background:linear-gradient(var(--sky) 70%,var(--road) 70%)}.bg-dark .lineup{background:#1c2250}.bg-dark .lineup figcaption{color:var(--muted)}.bg-check .lineup{background:repeating-conic-gradient(#d9d9d9 0 25%,#fff 0 50%) 0 0/16px 16px}
table{border-collapse:collapse;width:100%;max-width:980px;font-size:13.5px}th,td{text-align:left;padding:6px 10px;border-bottom:1px solid #2a3c86}th{color:var(--muted);font-weight:600}
.note{color:var(--muted);font-size:13px;max-width:90ch}
${keyframes}
@media (prefers-reduced-motion: reduce){.spr[style*=animation]{animation:none!important}}
</style></head>
<body class="bg-sky">
<h1>War of Collegian - Enemy preview (animated build)</h1>
<p class="lead">All nine enemies next to Bug Hunter, with the real animation sheets playing at their real frame rates. Stage 1 has Assignment, Deadline, Group, Midterm and the Final Exam boss; Stage 2 (Faculty Staff) adds Strict Professor, Ruthless TA, Thesis Advisor and the Exam Master boss. Frame 0 of every idle sheet is the approved static design.</p>
<div class="bar" role="group" aria-label="Background"><button data-bg="bg-sky" aria-pressed="true">Battlefield</button><button data-bg="bg-dark" aria-pressed="false">Dark</button><button data-bg="bg-check" aria-pressed="false">Transparency</button></div>

<h2>Side by side with Bug Hunter (2x, as drawn in battle)</h2>
<div class="lineup">${lineup}</div>
<p class="note">Enemies are mirrored in the game so they face the heroes. The Final Exam is drawn 3.3x and the Exam Master 3.0x in battle (visual only; hitbox, range and targeting do not use the sprite size).</p>

<h2>Each enemy: design, animations (live) and frames</h2>
<div class="grid">${LIST.map(card).join('')}</div>

<h2>Pixel-art consistency (measured from the approved static PNG files)</h2>
<table><thead><tr><th>Sprite</th><th>Status</th><th>Frame</th><th>Art size (px)</th><th>Colours</th><th>Edges</th><th>Outer outline white</th></tr></thead><tbody>
${metricRow(HERO.name, mHero, 'reference')}
${LIST.map((e) => metricRow(e.name, e.m, e.where)).join('\n')}
</tbody></table>
<p class="note">"Outer outline white" is the share of silhouette-edge pixels that are pure white (the heroes' light outer outline). Detached bits (sparks, loose pages, aura) are drawn without it, so it is below 100% on purpose. Every sprite is hard-edged (alpha is only 0 or 255), so nearest-neighbour scaling stays crisp.</p>
<script>
document.querySelectorAll('.bar button').forEach(function(b){b.addEventListener('click',function(){
  document.body.className=b.dataset.bg;document.querySelectorAll('.bar button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});});});
</script>
</body></html>
`;
fs.writeFileSync(path.join(root, 'docs', 'enemy-remodel', 'preview.html'), html);
console.log('docs/enemy-remodel/preview.html', LIST.length, 'enemies');
