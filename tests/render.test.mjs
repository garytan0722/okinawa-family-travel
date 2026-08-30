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
  assert.equal(renderModule.centeredScrollLeft(320, 900, 40, 350, 710, 86), 283);
  assert.equal(renderModule.centeredScrollLeft(320, 900, 0, 350, 366, 86), 0);
  assert.equal(renderModule.centeredScrollLeft(320, 900, 388, 350, 782, 86), 580);
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

test('event completion keeps a native checkbox and shows a dog-paw image stamp', () => {
  const day = trip.days.A[0];
  const eventId = day.events[0].id;
  const html = renderDay(trip, day, { completed: { [eventId]: true }, notes: {}, energy: {} });
  assert.match(html, /type="checkbox"[^>]*checked/);
  assert.match(html, /<img class="dog-paw-stamp" src="\.\/icons\/dog-paw-stamp\.svg\?v=12" alt=""/);
  assert.match(html, /class="sr-only">完成/);
});

test('user-supplied Google Maps links are preserved for the two new attractions', () => {
  const september27 = trip.days.A.find((item) => item.date === '2026-09-27');
  const september28 = trip.days.A.find((item) => item.date === '2026-09-28');
  const toyHtml = renderDay(trip, september27, { completed: {}, notes: {}, energy: {} });
  const adventureHtml = renderDay(trip, september28, { completed: {}, notes: {}, energy: {} });
  assert.match(toyHtml, /https:\/\/maps\.app\.goo\.gl\/x5uAXns3p6EgxshAA\?g_st=il/);
  assert.match(adventureHtml, /https:\/\/maps\.app\.goo\.gl\/ZqBSD95bMudWB7G9A\?g_st=il/);
});

test('paid attraction cards show official ticket prices next to the itinerary stop', () => {
  const day = trip.days.A.find((item) => item.date === '2026-09-25');
  const html = renderDay(trip, day, { completed: {}, notes: {}, energy: {} });
  assert.match(html, /class="ticket-info"/);
  assert.match(html, /門票/);
  assert.match(html, /成人 ¥2,100/);
  assert.match(html, /4歲～中學生 ¥1,050/);
  assert.match(html, /查核 2026-08-29/);
  assert.match(html, /查看官方票價/);
});

test('snorkeling card makes the earlier meeting time, location, and safety notes actionable', () => {
  const day = trip.days.A.find((item) => item.date === '2026-10-02');
  const html = renderDay(trip, day, { completed: {}, notes: {}, energy: {} });
  assert.match(html, /青潛 BEST DIVE OKINAWA/);
  assert.match(html, /09:00 活動 · 08:00 集合/);
  assert.match(html, /青潛免費停車場《裝備區》/);
  assert.match(html, /沖縄県国頭郡恩納村字仲泊94番地/);
  assert.match(html, /206 066 043\*58/);
  assert.match(html, /08:20/);
  assert.match(html, /氣喘/);
  assert.match(html, /浴巾/);
  assert.match(html, /tel:\+81-70-3124-7160/);
  assert.match(html, /goo\.gl\/maps\/3tW6KhLeoWA63FyE7/);
});

test('flight summary shows the named groups and labels only genuinely missing details', () => {
  assert.equal(typeof renderModule.renderFlightSummary, 'function');
  if (typeof renderModule.renderFlightSummary !== 'function') return;
  const html = renderModule.renderFlightSummary(trip);
  assert.match(html, /9\/24/);
  assert.match(html, /08:00.*10:45/s);
  assert.match(html, /華航 CI120/);
  assert.doesNotMatch(html, /班號未提供/);
  assert.match(html, /航線未提供/);
  assert.match(html, /IT230/);
  assert.match(html, /TPE → OKA/);
  assert.match(html, /星宇航空 JX871/);
  assert.match(html, /譚家/);
  assert.match(html, /曾蘿情侶/);
  assert.match(html, /15:50.*抵達時間未提供/s);
  assert.match(html, /OKA → TPE T2/);
});

test('emergency view puts 110 and 119 first and provides actionable OTS instructions', () => {
  assert.equal(typeof renderModule.renderEmergencyView, 'function');
  if (typeof renderModule.renderEmergencyView !== 'function') return;
  const html = renderModule.renderEmergencyView(trip);
  assert.ok(html.indexOf('tel:110') < html.indexOf('tel:119'));
  assert.ok(html.indexOf('tel:119') < html.indexOf('tel:0120-34-3732'));
  assert.match(html, /08:00–19:00/);
  assert.match(html, /19:01–07:59/);
  assert.match(html, /車牌號碼或預約編號/);
  assert.match(html, /事故・故障時の連絡先/);
  assert.match(html, /事故不分大小先撥 110.*傷病或火災再撥 119.*聯絡 OTS.*不要私下和解/s);
  assert.match(html, /https:\/\/www\.otsinternational\.jp\/otsrentacar\/guide\/road-service\//);
  assert.match(html, /https:\/\/www\.otsinternational\.jp\/otsrentacar\/rule\/menseki\//);
});

test('private accommodation renders generic guidance without a public map link', () => {
  const day = trip.days.C.find((item) => item.date === '2026-10-03');
  const html = renderDay(trip, day, { completed: {}, notes: {}, energy: {} });
  assert.match(html, /那霸私人住宿（譚家＋曾蘿情侶）/);
  assert.doesNotMatch(html, /<strong>那霸私人住宿（譚家＋曾蘿情侶）<\/strong><a /);
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
  assert.match(html, /沖繩美麗海水族館官方票價/);
  assert.match(html, /2026-09-17/);
  assert.equal(trip.sources.some((source) => source.id === 'private-stay'), false);
});
