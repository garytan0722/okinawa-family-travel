import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  getPartyForDate,
  getStayForDate,
  getVariantDay,
  mapUrl,
  nextFixedEvent,
} from '../src/trip-domain.mjs';

const trip = JSON.parse(readFileSync(new URL('../content/trip.json', import.meta.url), 'utf8'));

test('party labels identify 譚家 and 曾蘿情侶 while all six stay together through October 4', () => {
  assert.deepEqual(getPartyForDate(trip, '2026-09-24'), {
    adults: 2, children: 2, label: '譚家',
  });
  assert.deepEqual(getPartyForDate(trip, '2026-09-30'), {
    adults: 4, children: 2, label: '譚家＋曾蘿情侶',
  });
  assert.deepEqual(getPartyForDate(trip, '2026-10-04'), {
    adults: 4, children: 2, label: '譚家＋曾蘿情侶',
  });
});

test('stay lookup keeps private navigation out of public output', () => {
  const stay = getStayForDate(trip, '2026-10-02');
  assert.equal(stay.name, '那霸私人住宿');
  assert.equal(stay.privateNavigation, true);
  assert.equal(stay.mapQuery, '');
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
