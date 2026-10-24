import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { handler } from '../server.js';
let server, base;
before(async () => { server = http.createServer(handler); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => new Promise(resolve => server.close(resolve)));
test('complete bilingual datasets and stable aligned reading IDs', async () => {
  const ids = [];
  for (const lang of ['en', 'ar']) {
    const { data, meta } = await (await fetch(`${base}/api/v1/book?lang=${lang}`)).json();
    assert.equal(meta.lang, lang); assert.equal(data.days.length, 7);
    assert.equal(data.days.reduce((sum, day) => sum + day.hours.length, 0), 59);
    assert.ok(data.introduction.commentary_body.length); assert.equal(data.source_document, undefined);
    const readings = await (await fetch(`${base}/api/v1/readings?lang=${lang}`)).json();
    ids.push(readings.data.map(entry => entry.id));
    assert.equal(readings.meta.total, 59);
    assert.ok(lang === 'ar' ? /[\u0600-\u06ff]/.test(data.title) : /[A-Za-z]/.test(data.title));
  }
  assert.deepEqual(ids[0], ids[1]);
});
test('filters by day, text and reading ID', async () => {
  const day = await (await fetch(`${base}/api/v1/readings?day=2`)).json();
  assert.ok(day.data.length); assert.ok(day.data.every(entry => entry.day_index === 2));
  const one = await (await fetch(`${base}/api/v1/readings?id=day-1-hour-1`)).json();
  assert.equal(one.data.length, 1);
  const text = one.data[0].commentary_body[0].split(/\s+/).slice(0, 3).join(' ');
  const found = await (await fetch(`${base}/api/v1/readings?q=${encodeURIComponent(text)}`)).json();
  assert.ok(found.data.some(entry => entry.id === one.data[0].id));
  const empty = await (await fetch(`${base}/api/v1/readings?q=nonexistentwordzxzy`)).json(); assert.equal(empty.meta.total, 0);
});
test('validates input, restricts methods and handles conditional requests', async () => {
  assert.equal((await fetch(`${base}/api/v1/book?lang=fr`)).status, 400);
  assert.equal((await fetch(`${base}/api/v1/readings?q=${'a'.repeat(201)}`)).status, 400);
  assert.equal((await fetch(`${base}/api/v1/book`, { method: 'POST' })).status, 405);
  assert.equal((await fetch(`${base}/missing`)).status, 404);
  const response = await fetch(`${base}/api/v1/book`);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.equal((await fetch(`${base}/api/v1/book`, { headers: { 'If-None-Match': response.headers.get('etag') } })).status, 304);
  const head = await fetch(`${base}/health`, { method: 'HEAD' }); assert.equal(head.status, 200); assert.equal(await head.text(), '');
});
test('reader and static assets are served with content types and CSP', async () => {
  for (const [path, type] of [['/', 'text/html'], ['/app.js', 'text/javascript'], ['/style.css', 'text/css']]) {
    const response = await fetch(base + path); assert.equal(response.status, 200); assert.ok(response.headers.get('content-type').startsWith(type)); assert.ok(response.headers.get('content-security-policy'));
  }
});
