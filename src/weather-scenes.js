export const SCENES = {
  clear: 'photo-1470252649378-9c29740c9fa8',
  hot: 'photo-1509316785289-025f5b846b35',
  cold: 'photo-1464822759023-fed622ff2c3b',
  cloudy: 'photo-1501630834273-4b5604d2ee31',
  rain: 'photo-1516638022313-53fa45a84c7f',
  snow: 'photo-1418985991508-e47386d96a71',
  fog: 'photo-1485236715568-ddc5ee6ca227',
  storm: 'photo-1605727216801-e27ce1d0cc28',
  night: 'photo-1475274047050-1d0c0975c63e',
};
export function selectScene(current) {
  if (!current) return 'cold';
  const code = current.weather_code;
  if (code >= 95) return 'storm';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain';
  if ([45, 48].includes(code)) return 'fog';
  if (!current.is_day) return 'night';
  if (code === 3) return 'cloudy';
  if (current.temperature_2m <= 5) return 'cold';
  if (current.temperature_2m >= 30) return 'hot';
  if (code === 2) return 'cloudy';
  return 'clear';
}
export const sceneUrl = scene => `https://images.unsplash.com/${SCENES[scene]}?auto=format&fit=crop&w=1920&q=80`;
const CACHE = 'aether-landscapes-v1';
export async function loadScene(url, signal) {
  let cache;
  try { cache = await globalThis.caches?.open(CACHE); } catch { /* Private browsing may disable storage. */ }
  let response;
  try { response = await cache?.match(url); } catch { /* Fall back to network. */ }
  if (!response) {
    response = await fetch(url, { signal, mode: 'cors' });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error('Landscape unavailable');
    if (cache) {
      try {
        await cache.put(url, response.clone());
        const keys = await cache.keys();
        await Promise.all(keys.slice(0, Math.max(0, keys.length - 9)).map(key => cache.delete(key)));
      } catch { /* An image can still display if the cache quota is full. */ }
    }
  }
  return response.blob();
}

