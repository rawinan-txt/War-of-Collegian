// Stage selection is its own screen, after team building: faculty -> team -> stage -> battle.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadGame } = require('./harness');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').split('\r\n').join('\n');
const section = (id) => { const i = html.indexOf(`<section id="${id}"`); return html.slice(i, html.indexOf('</section>', i)); };
const J = (g, c) => JSON.parse(g.run(`JSON.stringify(${c})`));

test('the stage picker lives on its own screen, not in the team builder', () => {
  assert.ok(!section('team').includes('stagePick'), 'team builder has no stage tiles');
  assert.ok(section('stageSelect').includes('id="stagePick"'), 'the stage screen has them');
  assert.match(section('stageSelect'), /show\('team'\)/, 'a back button returns to the team builder');
  assert.match(section('stageSelect'), /onclick="startBattle\(\)" id="startBtn2"/, 'the stage screen starts the battle');
});

test('the team builder continues to the stage screen instead of starting the battle', () => {
  assert.match(section('team'), /onclick="show\('stageSelect'\)" id="startBtn"/);
  assert.ok(!/startBattle\(\)/.test(section('team')), 'no battle is started from the team builder');
});

test('show("stageSelect") shows only that screen and renders both stages with their enemies and boss', () => {
  const g = loadGame(1, { lazy: true });
  g.run("globalThis.__h={};for(const id of ['home','faculty','team','stageSelect','battle','result']){const e=document.getElementById(id);e.classList.toggle=(n,f)=>{__h[id]=f}}");
  g.run("show('stageSelect')");
  assert.deepEqual(J(g, '__h'), { home: true, faculty: true, team: true, stageSelect: false, battle: true, result: true });
  const out = g.run("document.getElementById('stagePick').innerHTML");
  assert.match(out, /Stage 1 · Midterm Rush/); assert.match(out, /Stage 2 · Faculty Staff/);
  for (const id of ['assignment', 'deadline', 'group', 'quiz', 'final', 'professor', 'ta', 'advisor', 'exammaster']) assert.ok(out.includes(`enemies/${id}/static.png`), `${id} is shown`);
  assert.match(out, /บอส: <b>Final Exam<\/b>/); assert.match(out, /บอส: <b>Exam Master<\/b>/);
  assert.equal((out.match(/class="stage-card sel"/g) || []).length, 1, 'exactly one stage is selected');
  assert.match(out, /class="stage-card sel"[^>]*aria-pressed="true"[\s\S]*?Stage 1/, 'Stage 1 is the default');
});

test('choosing a stage marks it and the battle starts in that stage', () => {
  const g = loadGame(2, { lazy: true });
  g.run("team=['bug','mecha','night','lab','chem','dental'];show('stageSelect')");
  g.run('setStage(2)');
  assert.match(g.run("document.getElementById('stagePick').innerHTML"), /class="stage-card sel"[^>]*aria-pressed="true"[\s\S]*?Stage 2/);
  g.run('startBattle(5)');
  assert.equal(g.run('battle.stage'), 2);
  assert.equal(g.run("document.getElementById('battleTitle').textContent"), 'Stage 2 · Faculty Staff');
  g.run('setStage(1);startBattle(5)');
  assert.equal(g.run('battle.stage'), 1);
});

test('the team survives the round trip team -> stage -> team and is shown on the stage screen', () => {
  const g = loadGame(3, { lazy: true });
  const t = ['night', 'lab', 'chem', 'dental', 'music', 'public'];
  g.run(`team=${JSON.stringify(t)};show('stageSelect')`);
  const strip = g.run("document.getElementById('stageTeam').innerHTML");
  for (const id of t) assert.ok(strip.includes(J(g, `heroes.find(h=>h.id==='${id}').name`)), `${id} is on the stage screen`);
  g.run("show('team')");
  assert.deepEqual(J(g, 'team'), t, 'going back keeps the team');
  assert.equal(g.run("document.getElementById('startBtn').disabled"), false);
});

test('the stage choice is remembered when going back and forth', () => {
  const g = loadGame(4, { lazy: true });
  g.run("show('stageSelect');setStage(2);show('team');show('stageSelect')");
  assert.equal(g.run('stage'), 2);
  assert.match(g.run("document.getElementById('stagePick').innerHTML"), /class="stage-card sel"[^>]*aria-pressed="true"[\s\S]*?Stage 2/);
});

test('every stage tile is keyboard operable (button role, focusable, Enter / Space)', () => {
  const g = loadGame(5, { lazy: true });
  g.run("show('stageSelect')");
  const out = g.run("document.getElementById('stagePick').innerHTML");
  assert.equal((out.match(/role="button" tabindex="0"/g) || []).length, 2);
  assert.equal((out.match(/event\.key==='Enter'\|\|event\.key===' '/g) || []).length, 2);
});
