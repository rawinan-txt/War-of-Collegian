const test = require('node:test');
const assert = require('node:assert');
const { simulate, TEAMS } = require('./balance.sim');

test('ultimates are occasional: Wi-Fi Down stun uptime <= 25% (mixed team, bot play)', () => {
  const r = simulate(TEAMS.mixed, 'wifi', 1);
  assert.ok(r.fires >= 1, 'ultimate should fire at least once');
  const uptime = (r.fires * 3) / r.time;
  assert.ok(uptime <= 0.25, `stun uptime ${(uptime * 100).toFixed(0)}% (${r.fires} fires in ${r.time}s)`);
});
