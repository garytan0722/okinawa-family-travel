import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  renderDay,
  renderSources,
  renderVariantTabs,
} from '../src/render.mjs';
import * as renderModule from '../src/render.mjs';

const trip = JSON.parse(readFileSync(new URL('../content/trip.json', import.meta.url), 'utf8'));

test('date centering calculates horizontal scroll without moving the page', () => {
  assert.equal(typeof renderModule.centeredScrollLeft, 'function');
  assert.equal(renderModule.centeredScrollLeft(320, 900, 400, 86), 283);
  assert.equal(renderModule.centeredScrollLeft(320, 900, 16, 86), 0);
  assert.equal(renderModule.centeredScrollLeft(320, 900, 820, 86), 580);
});

test('variant tabs expose selected state and all three pacing choices', () => {
  const html = renderVariantTabs(trip, 'B');
  assert.match(html, /role="tablist"/);
  assert.match(html, /data-variant="A"/);
  assert.match(html, /data-variant="B"[^>]*aria-selected="true"/);
  assert.match(html, /data-variant="C"/);
  assert.match(html, /景點豐富/);
  assert.equal(html.match(/class="variant-paw paw-print"/g)?.length, 3);
});

test('day timeline keeps chronological order and map links', () => {
  const day = trip.days.A.find((item) => item.date === '2026-09-30');
  const html = renderDay(trip, day, { completed: {}, notes: {}, energy: {} });
  assert.ok(html.indexOf('08:45') < html.indexOf('11:30'));
  assert.ok(html.indexOf('11:30') < html.indexOf('12:00'));
  assert.match(html, /Google Maps/);
  assert.match(html, /換車・會合・搬到那霸/);
  assert.equal(html.match(/class="paw-print" aria-hidden="true"/g)?.length, day.events.length);
});

test('private accommodation renders generic guidance without a public map link', () => {
  const day = trip.days.C.find((item) => item.date === '2026-10-03');
  const html = renderDay(trip, day, { completed: {}, notes: {}, energy: {} });
  assert.match(html, /那霸私人住宿（兩位大人）/);
  assert.doesNotMatch(html, /<strong>那霸私人住宿（兩位大人）<\/strong><a /);
});

test('user-controlled notes are escaped', () => {
  const day = trip.days.A[0];
  const html = renderDay(trip, day, {
    completed: {},
    notes: { '2026-09-24': '<img src=x onerror=alert(1)>' },
    energy: {},
  });
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('source ledger renders official links and recheck date', () => {
  const html = renderSources(trip);
  assert.match(html, /沖繩美麗海水族館官方網站/);
  assert.match(html, /2026-09-17/);
  assert.equal(trip.sources.some((source) => source.id === 'private-stay'), false);
});
