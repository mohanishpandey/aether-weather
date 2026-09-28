import test from 'node:test';
import assert from 'node:assert/strict';
import { selectScene, loadScene } from './weather-scenes.js';

test('conditions take precedence over temperature and clear night uses a night scene', () => {
  const current = { is_day: 1, temperature_2m: 35, weather_code: 0 };
  assert.equal(selectScene(current), 'hot');
  assert.equal(selectScene({ ...current, temperature_2m: 3 }), 'cold');
  assert.equal(selectScene({ ...current, temperature_2m: 22 }), 'clear');
  for (const [weather_code, scene] of [[95,'storm'],[75,'snow'],[61,'rain'],[45,'fog'],[3,'cloudy']]) assert.equal(selectScene({ ...current, weather_code }), scene);
  assert.equal(selectScene({ ...current, is_day: 0 }), 'night');
  assert.equal(selectScene({ ...current, is_day: 0, weather_code: 61 }), 'rain');
});
test('returning landscape is read from device cache without fetching', async () => {
  const originalFetch = globalThis.fetch, originalCaches = globalThis.caches;
  let calls = 0;
  const entries = new Map();
  globalThis.caches = { open: async () => ({ match: async key => entries.get(key)?.clone(), put: async (key, response) => entries.set(key, response), keys: async () => [...entries.keys()], delete: async key => entries.delete(key) }) };
  globalThis.fetch = async () => { calls++; return new Response('image bytes', { headers: { 'Content-Type': 'image/jpeg' } }); };
  try {
    assert.equal(await (await loadScene('https://example.com/rain')).text(), 'image bytes');
    await loadScene('https://example.com/rain');
    assert.equal(calls, 1);
  } finally { globalThis.fetch = originalFetch; globalThis.caches = originalCaches; }
});
