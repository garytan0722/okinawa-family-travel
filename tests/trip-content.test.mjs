import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const tripPath = join(root, 'content', 'trip.json');

test('canonical trip content exists', () => {
  assert.equal(existsSync(tripPath), true, 'content/trip.json must exist');
});

test('all variants cover each trip date exactly once', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const expected = [
    '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27',
    '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01',
    '2026-10-02', '2026-10-03', '2026-10-04',
  ];

  for (const id of ['A', 'B', 'C']) {
    assert.deepEqual(trip.days[id].map((day) => day.date), expected);
  }
});

test('fixed logistics preserve the confirmed car handoff and departures', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const fixed = trip.fixedEvents.map(({ date, time, kind }) => ({ date, time, kind }));

  assert.deepEqual(fixed.filter((event) => event.date === '2026-09-30'), [
    { date: '2026-09-30', time: '09:20', kind: 'flight-arrival' },
    { date: '2026-09-30', time: '11:30', kind: 'car-pickup' },
    { date: '2026-09-30', time: '12:00', kind: 'car-return' },
  ]);
  assert.ok(fixed.some((event) => event.date === '2026-10-03' && event.time === '15:50' && event.kind === 'flight-departure'));
  assert.ok(fixed.some((event) => event.date === '2026-10-04' && event.time === '12:30' && event.kind === 'car-return'));
});

test('deployed content uses a generic label for private accommodation', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const stay = trip.stays.find((item) => item.privateNavigation === true);
  assert.equal(stay.name, '那霸私人住宿');
  assert.equal(stay.nameJa, '非公開');
  assert.equal(stay.privateNavigation, true);
  assert.equal(stay.mapQuery, '');
  const serialized = JSON.stringify(trip);
  assert.doesNotMatch(serialized, /"[^"\n]*(?:password|credential|checkinUrl|accessCode|doorCode|accessPin)[^"\n]*"\s*:/i);
});
