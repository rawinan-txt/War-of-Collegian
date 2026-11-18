const test = require('node:test');
const assert = require('node:assert');
const { loadGame } = require('./harness');

test('loads game and starts a battle', () => {
  const g = loadGame();
  g.run('startBattle()');
  assert.equal(g.run('battle.baseHp'), 5000);
});

test('deploy spends AT and adds a unit', () => {
  const g = loadGame();
  g.run('startBattle()');
  g.run("deploy('bug')");
  assert.ok(g.run('battle.at') < 180);
  assert.equal(g.run('battle.units.length'), 1);
});
