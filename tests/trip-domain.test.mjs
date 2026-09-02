import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  dayRoutePlan,
  dayRouteSegments,
  getPartyForDate,
  getStayForDate,
  getVariantDay,
  mapUrl,
  nextFixedEvent,
} from '../src/trip-domain.mjs';

const trip = JSON.parse(readFileSync(new URL('../content/trip.json', import.meta.url), 'utf8'));

test('party labels identify 譚家四口 and 小倆口 while all six stay together through October 4', () => {
  assert.deepEqual(getPartyForDate(trip, '2026-09-24'), {
    adults: 2, children: 2, label: '譚家四口',
  });
  assert.deepEqual(getPartyForDate(trip, '2026-09-30'), {
    adults: 4, children: 2, label: '譚家四口＋小倆口',
  });
  assert.deepEqual(getPartyForDate(trip, '2026-10-04'), {
    adults: 4, children: 2, label: '譚家四口＋小倆口',
  });
});

test('stay lookup keeps private navigation out of public output', () => {
  const stay = getStayForDate(trip, '2026-10-02');
  assert.equal(stay.name, '恩納村私人住宿');
  assert.equal(stay.privateNavigation, true);
  assert.equal(stay.mapQuery, '');
  assert.equal(stay.routeQuery, '恩納村希望ヶ丘');
});

test('variant day lookup returns the selected pace only', () => {
  assert.equal(getVariantDay(trip, 'A', '2026-09-25').title, '玻璃船看海・森林海灘玩沙');
  assert.equal(getVariantDay(trip, 'B', '2026-09-25').title, '部瀨名玻璃船・名護海灘');
});

test('next fixed event respects local date and time ordering', () => {
  assert.equal(nextFixedEvent(trip, '2026-09-30', '11:20').id, 'f-0930-car2');
  assert.equal(nextFixedEvent(trip, '2026-09-30', '11:45').id, 'f-0930-car1-return');
});

test('map URL encodes a Japanese search query', () => {
  assert.equal(
    mapUrl('OTSレンタカー 臨空豊崎営業所'),
    'https://www.google.com/maps/search/?api=1&query=OTS%E3%83%AC%E3%83%B3%E3%82%BF%E3%82%AB%E3%83%BC%20%E8%87%A8%E7%A9%BA%E8%B1%8A%E5%B4%8E%E5%96%B6%E6%A5%AD%E6%89%80',
  );
  assert.equal(mapUrl(''), '');
});

test('daily route keeps useful stops in itinerary order and opens Google Maps directions', () => {
  const day = trip.days.A.find((item) => item.date === '2026-09-28');
  const segments = dayRouteSegments(day);
  assert.equal(segments.length, 1);
  assert.deepEqual(segments[0].stops, [
    '沖縄こどもの国',
    '和風亭 石川シティ店',
    '釣って見つけるぼうけんの国 沖縄',
    'サンエー大湾シティ',
    '沖縄かりゆしビーチリゾート・オーシャンスパ',
  ]);
  const url = new URL(segments[0].url);
  assert.equal(url.pathname, '/maps/dir/');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('origin'), segments[0].stops[0]);
  assert.equal(url.searchParams.get('destination'), segments[0].stops.at(-1));
  assert.equal(url.searchParams.get('travelmode'), 'driving');
  assert.equal(url.searchParams.get('dir_action'), 'navigate');
});

test('daily route removes duplicate and generic stops then splits after five points with overlap', () => {
  const synthetic = { events: [
    { type: 'activity', mapQuery: 'A' }, { type: 'activity', mapQuery: 'A' },
    { type: 'meal', mapQuery: '恩納村 子連れ ランチ' }, { type: 'walk', mapQuery: '步行點' },
    { type: 'activity', mapQuery: 'B' }, { type: 'activity', mapQuery: 'C' },
    { type: 'activity', mapQuery: 'D' }, { type: 'activity', mapQuery: 'E' },
    { type: 'activity', mapQuery: 'F' }, { type: 'activity', mapQuery: 'G' },
  ] };
  const segments = dayRouteSegments(synthetic);
  assert.deepEqual(segments.map((item) => item.stops), [
    ['A', '步行點', 'B', 'C', 'D'],
    ['D', 'E', 'F', 'G'],
  ]);
  assert.ok(segments.every((item) => item.stops.length <= 5));
});

test('daily route includes overnight lodging at both ends and keeps walk destinations in order', () => {
  const day = trip.days.C.find((item) => item.date === '2026-10-02');
  const plan = dayRoutePlan(trip, day);

  assert.deepEqual(plan.stops, [
    '恩納村希望ヶ丘',
    '青潛 BEST DIVE OKINAWA',
    '美浜アメリカンビレッジ',
    '恩納村希望ヶ丘',
  ]);
  assert.deepEqual(plan.segments.map((segment) => segment.stops), [plan.stops]);
});

test('September 30 route starts at the prior hotel and ends at the corrected Onna stay', () => {
  const day = trip.days.A.find((item) => item.date === '2026-09-30');
  const plan = dayRoutePlan(trip, day);

  assert.equal(plan.stops[0], '沖縄かりゆしビーチリゾート・オーシャンスパ');
  assert.equal(plan.stops.at(-1), '恩納村希望ヶ丘');
  assert.deepEqual(plan.stops.slice(1, -1), [
    'OTSレンタカー 臨空豊崎営業所',
    '沖縄アウトレットモール あしびなー',
    '波上宮',
    '国際通り',
  ]);
  assert.deepEqual(plan.segments.map((segment) => segment.stops), [
    plan.stops.slice(0, 5),
    plan.stops.slice(4),
  ]);
});

test('every published daily route covers its full ordered stop list with mobile-safe overlapping segments', () => {
  for (const days of Object.values(trip.days)) {
    for (const day of days) {
      const plan = dayRoutePlan(trip, day);
      const reconstructed = plan.segments.flatMap((segment, index) => index === 0 ? segment.stops : segment.stops.slice(1));
      assert.deepEqual(reconstructed, plan.stops, `${day.date} must cover every stop in order`);
      for (const segment of plan.segments) {
        assert.ok(segment.stops.length <= 5, `${day.date} exceeds the mobile point limit`);
        assert.ok(segment.url.length < 2048, `${day.date} exceeds the Maps URL limit`);
        assert.doesNotMatch(segment.url, /恩納村私人住宿|非公開|airbnb/i);
      }
    }
  }
});
