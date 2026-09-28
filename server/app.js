import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();
app.disable('x-powered-by');
let database;
async function collection() {
  if (!process.env.MONGODB_URI) return null;
  if (!database) database = (async () => {
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    await client.connect();
    const cache = client.db(process.env.MONGODB_DB || 'aether_weather').collection('forecasts');
    await cache.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    return cache;
  })().catch(error => { database = null; throw error; });
  return database;
}
async function upstream(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Weather provider unavailable');
  return response.json();
}
app.get('/api/health', (_req, res) => res.json({ status: 'ok', databaseConfigured: Boolean(process.env.MONGODB_URI) }));
app.get('/api/search', async (req, res, next) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (query.length < 2 || query.length > 100) return res.status(400).json({ error: 'Enter between 2 and 100 characters.' });
  try {
    const data = await upstream('https://geocoding-api.open-meteo.com/v1/search?' + new URLSearchParams({ name: query, count: '8', language: 'en', format: 'json' }));
    res.set('Cache-Control', 'public, s-maxage=3600').json({ results: data.results || [] });
  } catch (error) { next(error); }
});
app.get('/api/weather', async (req, res, next) => {
  const valid = (value, min, max) => typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max;
  if (!valid(req.query.lat, -90, 90) || !valid(req.query.lon, -180, 180)) return res.status(400).json({ error: 'Valid latitude and longitude are required.' });
  // Coarse coordinates are sufficient for forecasts and avoid storing precise device location.
  const lat = Number(req.query.lat).toFixed(2), lon = Number(req.query.lon).toFixed(2);
  try {
    const cache = await collection().catch(() => null);
    const key = `${lat},${lon}`;
    const cached = cache && await cache.findOne({ _id: key, expiresAt: { $gt: new Date() } }).catch(() => null);
    if (cached) return res.json(cached.data);
    const params = new URLSearchParams({ latitude: lat, longitude: lon, timezone: 'auto', forecast_days: '7', current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m', hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,visibility,uv_index,is_day', daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max' });
    const data = await upstream('https://api.open-meteo.com/v1/forecast?' + params);
    if (cache) await cache.updateOne({ _id: key }, { $set: { data, expiresAt: new Date(Date.now() + 600000) } }, { upsert: true }).catch(() => {});
    res.json(data);
  } catch (error) { next(error); }
});
app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
app.use((error, _req, res, _next) => res.status(502).json({ error: 'The weather service is temporarily unavailable. Please try again.' }));
export default app;
