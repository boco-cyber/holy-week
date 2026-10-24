# Holy Week — hour by hour

Public English and Arabic Holy Week reader and read-only JSON API for Coptic Faith Explained. Seven days and 59 readings per language, with Gospel passages, introductions, and spiritual reflections.

## Run

Requires Node.js 22 or newer. There are no third-party runtime dependencies.

```sh
npm start
npm test
```

Open `http://localhost:3000` or `http://localhost:3000/?lang=ar`. `PORT` defaults to `3000`.

The reader supports day filters, full-text search, direct links to readings, language switching, text sizing, previous/next navigation, and printing. Language-independent reading IDs preserve the selected reading when switching languages.

## Public API

All endpoints accept `lang=en` or `lang=ar` (default: English). Invalid languages return HTTP 400.

| Endpoint | Response |
| --- | --- |
| `GET /health` | Status and reading counts |
| `GET /api/v1/book?lang=ar` | Complete dataset: `{data: {title, introduction, days}, meta: {lang, version}}` |
| `GET /api/v1/days?lang=en` | Day IDs, names and reading counts |
| `GET /api/v1/readings?lang=en` | Readings with stable IDs |
| `GET /api/v1/readings?lang=ar&day=2&q=المسيح` | Filter by day number and/or search text |
| `GET /api/v1/readings?id=day-1-hour-1` | One reading |

GET and HEAD are read-only; OPTIONS is supported. Public data responses permit cross-origin reads, support ETags and have a five-minute cache lifetime. No accounts, credentials, writes, or database are required.

## Content

`data/en.json` and `data/ar.json` were extracted from the existing Coptic Faith Holy Week page. The reading and commentary text is preserved; machine-local source-document paths are excluded. The introductory reflection is by Fr. Matta El Meskeen as credited in the original page. Existing content rights remain with their respective authors; public repository visibility does not grant a new content license.

Edit these files to update the standalone reader and the main site's service-backed readings together. WordPress retains its original bundled copy as an outage fallback.

## Deployment

Build the root `Dockerfile` with Coolify, expose port 3000 and use `/health` for health checks. The container runs as the unprivileged Node user. No persistent volume or secrets are needed.

The main WordPress site reads `/api/v1/book?lang=en|ar` on the server through `cf_holy_week_data()`. It caches successful responses for five minutes, retains a stale response for a day, and uses its bundled same-language dataset if the service is unavailable. `HOLY_WEEK_API_BASE_URL` can override the service URL.
