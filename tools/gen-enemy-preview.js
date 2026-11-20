// Builds docs/enemy-remodel/preview.html: an offline browser page that shows all 9 enemies next to Bug Hunter
// (6x enlarged, 2x as drawn in battle) with pixel-art consistency metrics measured from the real PNG files.
// Run: node tools/gen-enemy-preview.js   (read-only for the game; writes only the HTML page)
const fs = require('node:fs');
const path = require('node:path');
const { decodePng } = require('./pixel/png');

const root = path.join(__dirname, '..');
const LIST = [
  { id: 'assignment', name: 'Assignment Monster', role: 'basic', state: 'game' },
  { id: 'deadline', name: 'Deadline Monster', role: 'fast', state: 'game' },
  { id: 'group', name: 'Group Project Gang', role: 'tank', state: 'game' },
  { id: 'quiz', name: 'Midterm Exam', role: 'ranged', state: 'game' },
  { id: 'final', name: 'Final Exam', role: 'boss', state: 'game', gameScale: 3.3 },
  { id: 'professor', name: 'Strict Professor', role: 'concept (basic type)', state: 'concept' },
  { id: 'ta', name: 'Ruthless TA', role: 'concept (fast type)', state: 'concept' },
  { id: 'advisor', name: 'Thesis Advisor', role: 'concept (tank / support type)', state: 'concept' },
  { id: 'exammaster', name: 'Exam Master', role: 'concept (boss type)', state: 'concept' },
];
const HERO = { id: 'bug', name: 'Bug Hunter (reference hero)', file: 'assets/characters/ict/bug_hunter/idle.png', frames: 4 };

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
  return { w: fw, h: png.h, bbox: `${x1 - x0 + 1} x ${y1 - y0 + 1}`, top: y0, bottom: y1, colours: colours.size, soft, px: n, outerWhite: Math.round((100 * edgeWhite) / Math.max(1, edge)) };
}

const rows = [];
const mHero = measure(HERO.file, HERO.frames);
for (const e of LIST) e.m = measure(`assets/enemies/${e.id}/idle.png`);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const metricRow = (name, m, tag) => `<tr><td>${esc(name)}</td><td>${tag}</td><td>${m.w}x${m.h}</td><td>${m.bbox}</td><td>${m.colours}</td><td>${m.soft === 0 ? 'hard-edged' : m.soft + ' soft px'}</td><td>${m.outerWhite}%</td></tr>`;

const card = (e) => `<article class="card ${e.state}">
  <header><h3>${esc(e.name)}</h3><p><span class="tag ${e.state}">${e.state === 'game' ? 'in game' : 'concept only'}</span> ${esc(e.role)}${e.gameScale ? ` &middot; drawn ${e.gameScale}x in battle` : ''}</p></header>
  <div class="views">
    <figure><img class="s6" src="../../assets/enemies/${e.id}/idle.png" alt="${esc(e.name)} 6x"><figcaption>6x (as authored, faces right)</figcaption></figure>
    <figure><div class="field"><span class="spr hero"></span><img class="s2 flip" src="../../assets/enemies/${e.id}/idle.png" alt="${esc(e.name)} 2x"></div><figcaption>2x in battle: Bug Hunter vs ${esc(e.name)} (mirrored toward the heroes)</figcaption></figure>
  </div>
  <p class="meta">${e.m.w}x${e.m.h}px, ${e.m.colours} colours, ${e.m.soft === 0 ? 'hard-edged' : e.m.soft + ' soft px'}, art ${e.m.bbox}</p>
</article>`;

const lineup = [
  `<figure><span class="spr hero"></span><figcaption>Bug Hunter</figcaption></figure>`,
  ...LIST.map((e) => `<figure><img class="s2 flip" src="../../assets/enemies/${e.id}/idle.png" alt=""><figcaption>${esc(e.name)}</figcaption></figure>`),
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
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:16px}
.card{background:var(--panel);border:2px solid var(--ink);border-radius:14px;padding:14px}.card.concept{border-color:var(--gold)}
.card h3{margin:0;font-size:18px}.card header p{margin:2px 0 10px;color:var(--muted)}
.tag{display:inline-block;padding:1px 8px;border-radius:999px;font-size:12px;font-weight:700;color:var(--ink)}.tag.game{background:#52d49a}.tag.concept{background:var(--gold)}
.views{display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap}figure{margin:0}figcaption{font-size:12px;color:var(--muted);margin-top:4px;max-width:340px}
.s6{width:384px;height:384px;display:block}.s2{width:128px;height:128px;display:block}.flip{transform:scaleX(-1)}
.bg-sky .s6,.bg-sky .field,.bg-sky .strip{background:linear-gradient(var(--sky) 70%,var(--road) 70%)}
.bg-dark .s6,.bg-dark .field,.bg-dark .strip{background:#1c2250}
.bg-check .s6,.bg-check .field,.bg-check .strip{background:repeating-conic-gradient(#d9d9d9 0 25%,#fff 0 50%) 0 0/16px 16px}
.field{display:flex;align-items:flex-end;justify-content:center;gap:0;width:288px;height:150px;padding-bottom:2px}
.spr{display:block;width:128px;height:128px;flex:none}.hero{background:url(../../assets/characters/ict/bug_hunter/idle.png) 0 0/400% 100% no-repeat}
.meta{margin:10px 0 0;font-size:12.5px;color:var(--muted)}
.strip{display:flex;align-items:flex-end;gap:0;padding:12px 8px 6px;border-radius:14px;overflow-x:auto}.strip figure{flex:none;text-align:center;width:150px}.strip figcaption{max-width:none;color:#13204f}
.bg-dark .strip figcaption{color:var(--muted)}
table{border-collapse:collapse;width:100%;max-width:980px;font-size:13.5px}th,td{text-align:left;padding:6px 10px;border-bottom:1px solid #2a3c86}th{color:var(--muted);font-weight:600}
.note{color:var(--muted);font-size:13px;max-width:90ch}
@media (max-width:520px){.s6{width:100%;height:auto;aspect-ratio:1}.field{width:100%}}
</style></head>
<body class="bg-sky">
<h1>War of Collegian - Enemy preview (static, review build)</h1>
<p class="lead">All nine enemies next to Bug Hunter. The five "in game" enemies are the current roster; the four "concept only" teaching-staff characters are <b>not</b> in gameplay. Sprites are 64x64 chibi pixel art with a dark inner and a white outer outline. No animation yet.</p>
<div class="bar" role="group" aria-label="Background"><button data-bg="bg-sky" aria-pressed="true">Battlefield</button><button data-bg="bg-dark" aria-pressed="false">Dark</button><button data-bg="bg-check" aria-pressed="false">Transparency</button></div>

<h2>Side by side with Bug Hunter (2x, as drawn in battle)</h2>
<div class="strip">${lineup}</div>
<p class="note">Enemies are mirrored in the game so they face the heroes. The Final Exam boss is drawn 3.3x in the battle (2 x the 1.65 boss scale); Exam Master has no in-game scale yet.</p>

<h2>Each enemy (6x and 2x)</h2>
<div class="grid">${LIST.map(card).join('')}</div>

<h2>Pixel-art consistency (measured from the PNG files)</h2>
<table><thead><tr><th>Sprite</th><th>Status</th><th>Frame</th><th>Art size (px)</th><th>Colours</th><th>Edges</th><th>Outer outline white</th></tr></thead><tbody>
${metricRow(HERO.name, mHero, 'reference')}
${LIST.map((e) => metricRow(e.name, e.m, e.state === 'game' ? 'in game' : 'concept')).join('\n')}
</tbody></table>
<p class="note">"Outer outline white" is the share of silhouette-edge pixels that are pure white (the heroes' light outer outline). Small detached bits such as sparks and loose pages are drawn without it, so it is below 100% on purpose. Every sprite is hard-edged (alpha is only 0 or 255), so nearest-neighbour scaling stays crisp.</p>
<script>
document.querySelectorAll('.bar button').forEach(function(b){b.addEventListener('click',function(){
  document.body.className=b.dataset.bg;document.querySelectorAll('.bar button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});});});
</script>
</body></html>
`;
fs.writeFileSync(path.join(root, 'docs', 'enemy-remodel', 'preview.html'), html);
console.log('docs/enemy-remodel/preview.html', LIST.length, 'enemies');
for (const e of LIST) console.log(e.id.padEnd(11), JSON.stringify(e.m));
console.log('bug hero'.padEnd(11), JSON.stringify(mHero));
