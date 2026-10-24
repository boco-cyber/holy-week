import http from 'node:http';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const books = Object.fromEntries(['en', 'ar'].map(lang => [lang, JSON.parse(readFileSync(new URL(`./data/${lang}.json`, import.meta.url), 'utf8'))]));
const assets = Object.fromEntries([
  ['/', 'index.html', 'text/html; charset=utf-8'],
  ['/app.js', 'app.js', 'text/javascript; charset=utf-8'],
  ['/style.css', 'style.css', 'text/css; charset=utf-8'],
].map(([route, file, type]) => [route, { body: readFileSync(new URL(`./public/${file}`, import.meta.url)), type }]));

export function entries(lang) {
  return books[lang].days.flatMap((day, dayIndex) => day.hours.map((hour, hourIndex) => ({
    id: `day-${dayIndex + 1}-hour-${hourIndex + 1}`, day: day.day, day_index: dayIndex + 1, ...hour,
  })));
}
function normalize(text) {
  return String(text).normalize('NFKD').replace(/[\u064B-\u065F\u0670ـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').toLowerCase();
}
export function handler(req, res) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'",
  };
  function send(status, body, type = 'application/json; charset=utf-8', cache = 'public, max-age=300') {
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(type.startsWith('application/json') ? JSON.stringify(body) : body);
    const etag = '"' + createHash('sha256').update(buffer).digest('hex') + '"';
    const unchanged = status === 200 && req.headers['if-none-match'] === etag;
    res.writeHead(unchanged ? 304 : status, { ...headers, 'Content-Type': type, 'Cache-Control': cache, ETag: etag });
    res.end(req.method === 'HEAD' || unchanged ? undefined : buffer);
  }
  if (req.method === 'OPTIONS') { res.writeHead(204, headers); return res.end(); }
  if (!['GET', 'HEAD'].includes(req.method)) { headers.Allow = 'GET, HEAD, OPTIONS'; return send(405, { error: 'Method not allowed' }, undefined, 'no-store'); }
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { return send(400, { error: 'Invalid URL' }); }
  const lang = url.searchParams.get('lang') || 'en';
  if (url.pathname === '/health') return send(200, { status: 'ok', languages: ['en', 'ar'], readings: { en: entries('en').length, ar: entries('ar').length } }, undefined, 'no-store');
  if (url.pathname.startsWith('/api/')) {
    if (!Object.hasOwn(books, lang)) return send(400, { error: 'Supported languages: en, ar' }, undefined, 'no-store');
    if (url.pathname === '/api/v1/book') return send(200, { data: books[lang], meta: { lang, version: 1 } });
    if (url.pathname === '/api/v1/days') return send(200, { data: books[lang].days.map((day, index) => ({ id: index + 1, day: day.day, readings: day.hours.length })), meta: { lang } });
    if (url.pathname === '/api/v1/readings') {
      let data = entries(lang);
      const day = url.searchParams.get('day');
      if (day) data = data.filter(entry => String(entry.day_index) === day || entry.day === day);
      const q = url.searchParams.get('q') || '';
      if (q.length > 200) return send(400, { error: 'Search must be 200 characters or fewer' }, undefined, 'no-store');
      const terms = normalize(q).split(/\s+/).filter(Boolean);
      if (terms.length) data = data.filter(entry => { const text = normalize(JSON.stringify(entry)); return terms.every(term => text.includes(term)); });
      const id = url.searchParams.get('id');
      if (id) data = data.filter(entry => entry.id === id);
      return send(200, { data, meta: { lang, total: data.length } });
    }
    return send(404, { error: 'Endpoint not found' }, undefined, 'no-store');
  }
  const asset = assets[url.pathname];
  if (asset) return send(200, asset.body, asset.type, 'public, max-age=60');
  return send(404, { error: 'Not found' }, undefined, 'no-store');
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const server = http.createServer(handler);
  server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Holy Week listening on port ' + (process.env.PORT || 3000)));
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
}
