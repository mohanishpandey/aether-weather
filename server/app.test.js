import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from './app.js';

test('health reports database configuration without exposing credentials', async () => {
  const response = await request(app).get('/api/health').expect(200);
  assert.equal(response.body.status, 'ok');
  assert.equal(typeof response.body.databaseConfigured, 'boolean');
});
test('invalid coordinates are rejected before requesting weather', async () => {
  for (const query of ['', '?lat=91&lon=0', '?lat=0&lon=181', '?lat=&lon=0', '?lat=abc&lon=0']) {
    await request(app).get('/api/weather' + query).expect(400);
  }
});
test('search rejects missing and oversized queries', async () => {
  await request(app).get('/api/search?q=a').expect(400);
  await request(app).get('/api/search?q=' + 'a'.repeat(101)).expect(400);
});
test('search returns matching places and handles provider failure', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ results: [{ name: 'Bengaluru' }] }) });
    const response = await request(app).get('/api/search?q=Bengaluru').expect(200);
    assert.equal(response.body.results[0].name, 'Bengaluru');
    globalThis.fetch = async () => ({ ok: false });
    const failure = await request(app).get('/api/search?q=Bengaluru').expect(502);
    assert.match(failure.body.error, /temporarily unavailable/);
  } finally { globalThis.fetch = original; }
});
test('forecast rounds device coordinates and requests required fields', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async url => {
      const parsed = new URL(url);
      assert.equal(parsed.searchParams.get('latitude'), '12.97');
      assert.equal(parsed.searchParams.get('longitude'), '77.59');
      assert.equal(parsed.searchParams.get('forecast_days'), '7');
      assert.match(parsed.searchParams.get('hourly'), /visibility/);
      return { ok: true, json: async () => ({ current: { temperature_2m: 24 } }) };
    };
    const response = await request(app).get('/api/weather?lat=12.971234&lon=77.591234').expect(200);
    assert.equal(response.body.current.temperature_2m, 24);
  } finally { globalThis.fetch = original; }
});
