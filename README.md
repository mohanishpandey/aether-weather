# Aether Weather

React + Vite frontend, Express/Node API, and optional MongoDB shared forecast cache.

## Run locally

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to Express on port 3001.

```sh
npm test
npm run build
```

## Deploy

1. Push this repository to GitHub.
2. In Vercel, import the repository. Use Vite, build command `npm run build`, output `dist`, and Node.js 22 or newer.
3. Deploy. `api/index.js` exports the Express app; `vercel.json` routes `/api/*` to it.
4. For MongoDB caching, create an Atlas cluster and a database user limited to read/write on `aether_weather`. Configure network access for the deployment environment. Add `MONGODB_URI` as an encrypted Vercel environment variable and redeploy. Do not commit credentials.

The app works without MongoDB, fetching directly through Express. With MongoDB configured, coarse-coordinate forecasts are cached for ten minutes using a TTL index. Database failure falls back to fresh forecasts. No account, exact device coordinate, or location history is stored in MongoDB. Saved places and appearance preferences stay in browser local storage.

## Features

- Debounced city/village search with keyboard selection and disambiguating regions.
- User-triggered geolocation, rounded before transmission, with denial and timeout handling.
- Current conditions, 24-hour forecast, seven-day outlook, UV, humidity, visibility, wind, sunrise and sunset.
- Celsius/Fahrenheit, saved places, two atmospheric themes, reduced-motion and transparency support.
- Scroll-linked landscape parallax, responsive frosted-glass panels, locally bundled Geist fonts.

## Services and assets

- Weather: [Open-Meteo](https://open-meteo.com/), attribution shown in the app. Review their usage terms before commercial deployment.
- Place search: Open-Meteo geocoding / GeoNames. Coverage varies for small villages; nearby town searches are supported.
- Decorative alpine background: Unsplash image `photo-1464822759023-fed622ff2c3b`, remotely served. It is scenery, not a photograph of the selected location.
- Icons: Phosphor. Web glass effects use CSS, not Apple's native Liquid Glass framework.

## Manual acceptance checks

Check desktop and mobile in both themes; search a city and a village, use keyboard result selection, switch units, save/reload a place, test allowed and denied location, and emulate reduced motion. Confirm `/api/health`, `/api/search?q=London`, and `/api/weather?lat=51.51&lon=-0.13` after deployment.

## Weather-responsive landscapes
Backgrounds select online Unsplash photos using WMO conditions, Celsius temperature (cold <=5, hot >=30), and day/night. Precipitation takes priority over temperature. Nine scenes are cached with the browser Cache API for repeat visits; private mode or storage eviction can require downloading again. No photo API key is required. Images are illustrative, not location-specific photographs. Failed downloads retain the previous scenery. Weather refreshes every five minutes while visible, on returning to the tab, and on reconnect. Motion follows the reduced-motion preference.

