import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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

test('the approved September 30 through October 4 itinerary stays byte-for-byte equivalent', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const expectedHashes = {
    A: '1e076c1741a54cfe2ab6c1e39367c615f375c2240d3d65342d67f096a155f947',
    B: '47814f3b41cc80feeede6b23ac75b3c716a46eb01f44e1309fe710ab23d7182c',
    C: '48cdb389f886c9f731f99f161cc7dde11e4e6639683f9cc629ce6cb8c4487f08',
  };

  for (const [variantId, expectedHash] of Object.entries(expectedHashes)) {
    const frozenDays = trip.days[variantId].filter((day) => day.date >= '2026-09-30');
    const actualHash = createHash('sha256').update(JSON.stringify(frozenDays)).digest('hex');
    assert.equal(actualHash, expectedHash, `${variantId} late itinerary must remain unchanged`);
  }
});

test('September 24 through 29 use the approved northern plan without late-itinerary attractions', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const forbiddenLateAttractions = [
    '美麗海', '美國村', 'BANTA', '港川', '普天滿', '來客夢', 'Rycom',
    '首里城', '沖繩世界', '玉泉洞', 'DMM', '瀨長島', '波上宮', 'PARCO',
    '國際通', '牧志市場', 'Ashibinaa',
  ];

  for (const variantId of ['A', 'B', 'C']) {
    const earlyDays = trip.days[variantId].filter((day) => day.date <= '2026-09-29');
    const earlyText = JSON.stringify(earlyDays);
    for (const place of forbiddenLateAttractions) {
      assert.equal(earlyText.includes(place), false, `${variantId} repeats late attraction: ${place}`);
    }
    for (const required of ['部瀨名', '名護鳳梨園', '古宇利', '沖繩兒童王國', '琉球村', '萬座毛']) {
      assert.match(earlyText, new RegExp(required), `${variantId} must include ${required}`);
    }
  }
  for (const variantId of ['A', 'B']) {
    const earlyText = JSON.stringify(trip.days[variantId].filter((day) => day.date <= '2026-09-29'));
    assert.match(earlyText, /Neo Park Okinawa/);
    assert.match(earlyText, /東南植物樂園/);
  }
});

test('relaxed plan keeps September 28 to one main attraction', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const day = trip.days.C.find((item) => item.date === '2026-09-28');
  const mainEvents = day.events.filter((event) => ['activity', 'culture'].includes(event.type));
  assert.deepEqual(mainEvents.map((event) => event.title), ['沖繩兒童王國']);
});

test('flight summary includes only confirmed times and known flight identifiers', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  assert.deepEqual(trip.flights, [
    { date: '2026-09-24', party: '譚家', departure: '08:00', arrival: '10:45', airline: '華航', flightNumber: 'CI120', route: null },
    { date: '2026-09-30', party: '曾蘿情侶', departure: '06:50', arrival: '09:20', airline: null, flightNumber: 'IT230', route: 'TPE → OKA' },
    { date: '2026-10-04', party: '譚家', departure: '15:50', arrival: null, airline: '星宇航空', flightNumber: 'JX871', route: 'OKA → TPE T2' },
  ]);
});

test('October 3 has no flight or airport split and keeps all six travelers together', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  assert.equal(
    trip.fixedEvents.some((event) => event.date === '2026-10-03' && event.kind.startsWith('flight-')),
    false,
  );

  for (const variantId of ['A', 'B', 'C']) {
    const day = trip.days[variantId].find((item) => item.date === '2026-10-03');
    const serialized = JSON.stringify(day);
    assert.doesNotMatch(serialized, /flight|機場|那覇空港|兩位大人|一家四口先回台|機場分流/);
    assert.match(serialized, /六人/);
  }
});

test('public trip content uses the corrected 曾蘿情侶 label everywhere', () => {
  const serialized = readFileSync(tripPath, 'utf8');
  assert.match(serialized, /曾蘿情侶/);
  assert.doesNotMatch(serialized, /曾羅佳/);
});

test('October 4 plans finish at the corrected JX871 departure', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));

  for (const variantId of ['A', 'B', 'C']) {
    const day = trip.days[variantId].find((item) => item.date === '2026-10-04');
    const departure = day.events.at(-1);
    assert.deepEqual(
      { time: departure.time, type: departure.type, title: departure.title },
      { time: '15:50', type: 'flight', title: '譚家 JX871 起飛' },
      `${variantId} must end with the corrected flight`,
    );
  }
});

test('OTS roadside support keeps official daytime and vehicle-specific after-hours guidance', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  assert.deepEqual(trip.roadsideAssistance, {
    provider: 'OTS 租車',
    dayHours: '08:00–19:00',
    dayPhone: '0120-34-3732',
    afterHours: '19:01–07:59',
    afterHoursNote: '查看車內「事故・故障時の連絡先」貼紙；夜間窗口依車輛不同。',
    beforeCalling: ['車牌號碼或預約編號', '目前地址／定位', '車輛狀況'],
    sourceIds: ['ots-road-service', 'ots-insurance'],
  });
  assert.equal(
    trip.sources.find((source) => source.id === 'ots-road-service')?.url,
    'https://www.otsinternational.jp/otsrentacar/guide/road-service/',
  );
  assert.equal(
    trip.sources.find((source) => source.id === 'ots-insurance')?.url,
    'https://www.otsinternational.jp/otsrentacar/rule/menseki/',
  );
});

test('fixed logistics preserve the confirmed car handoff and departures', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const fixed = trip.fixedEvents.map(({ date, time, kind }) => ({ date, time, kind }));

  assert.deepEqual(fixed.filter((event) => event.date === '2026-09-30'), [
    { date: '2026-09-30', time: '09:20', kind: 'flight-arrival' },
    { date: '2026-09-30', time: '11:30', kind: 'car-pickup' },
    { date: '2026-09-30', time: '12:00', kind: 'car-return' },
  ]);
  assert.equal(fixed.some((event) => event.date === '2026-10-03' && event.kind === 'flight-departure'), false);
  assert.ok(fixed.some((event) => event.date === '2026-10-04' && event.time === '12:30' && event.kind === 'car-return'));
  assert.ok(fixed.some((event) => event.date === '2026-10-04' && event.time === '15:50' && event.kind === 'flight-departure'));
});

test('all itineraries preserve the confirmed October 2 snorkeling booking', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const booking = trip.fixedEvents.find((event) => event.id === 'f-1002-snorkeling');

  assert.deepEqual(
    booking && { date: booking.date, time: booking.time, kind: booking.kind, sourceIds: booking.sourceIds },
    { date: '2026-10-02', time: '09:00', kind: 'snorkeling', sourceIds: ['pinkmermaid'] },
  );
  assert.equal(
    trip.sources.find((source) => source.id === 'pinkmermaid')?.url,
    'https://www.instagram.com/pinkmermaid_okinawa/',
  );

  for (const variantId of ['A', 'B', 'C']) {
    const day = trip.days[variantId].find((item) => item.date === '2026-10-02');
    assert.ok(day.events.some((event) => (
      event.time === '09:00'
      && event.title.includes('Pink Mermaid Okinawa')
      && event.sourceIds?.includes('pinkmermaid')
    )), `${variantId} must include the fixed snorkeling booking`);
  }
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
