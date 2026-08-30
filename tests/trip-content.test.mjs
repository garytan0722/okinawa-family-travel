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

test('rainy-day catalog contains 24 verified, correctly separated venues', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  assert.equal(trip.rainyDayOptions?.length, 24);
  assert.deepEqual(
    Object.fromEntries(trip.rainyDayCategories.map((category) => [
      category.id,
      trip.rainyDayOptions.filter((item) => item.category === category.id).length,
    ])),
    { family: 8, art: 3, nature: 3, industry: 3, malls: 3, shopping: 3, special: 1 },
  );
  const serialized = JSON.stringify(trip.rainyDayOptions);
  for (const required of ['やんばる森のおもちゃ美術館', '南城美術館', '普天満宮', 'ナゴパイナップルパーク', 'iias沖縄豊崎', 'マンガ倉庫 那覇店']) {
    assert.match(serialized, new RegExp(required));
  }
  assert.doesNotMatch(serialized, /博物館藝術|美術館自然|普天滿宮產業|鳳梨園百貨|IIAS精品|漫畫倉庫特別/);
  for (const item of trip.rainyDayOptions) {
    assert.equal(item.checkedAt, '2026-08-30');
    for (const key of ['area', 'weatherFit', 'duration', 'familyNote', 'mapQuery', 'officialUrl']) assert.ok(item[key], `${item.id} needs ${key}`);
    assert.match(item.officialUrl, /^https:\/\//);
  }
});

test('the approved September 30 through October 4 itinerary stays byte-for-byte equivalent', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const expectedHashes = {
    A: '7f8548371bdcddda9ede039d8d3f8fd51aadbb2f4a8f710ac0dd26257d354db3',
    B: '530e784e85b6e419b8a4523e014f5eb490cbb8e54deeb4e2a007794d2dd19502',
    C: 'bbd5dfd851b4e746aff1fc6bb90764c2f0dfb99a8f7650ffe4d3421428ae0b79',
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
    for (const required of ['部瀨名', '名護鳳梨園', '古宇利', 'やんばる森のおもちゃ美術館', '釣って見つけるぼうけんの国', '琉球村', '萬座毛']) {
      assert.match(earlyText, new RegExp(required), `${variantId} must include ${required}`);
    }
  }
  for (const variantId of ['A', 'B']) {
    const earlyText = JSON.stringify(trip.days[variantId].filter((day) => day.date <= '2026-09-29'));
    assert.match(earlyText, /Neo Park Okinawa/);
    assert.match(earlyText, /沖繩兒童王國/);
  }
});

test('new family attractions replace the approved northern stops without touching the frozen segment', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const toyMap = 'https://maps.app.goo.gl/x5uAXns3p6EgxshAA?g_st=il';
  const adventureMap = 'https://maps.app.goo.gl/ZqBSD95bMudWB7G9A?g_st=il';

  for (const variantId of ['A', 'B', 'C']) {
    const september27 = trip.days[variantId].find((item) => item.date === '2026-09-27');
    const september28 = trip.days[variantId].find((item) => item.date === '2026-09-28');
    assert.ok(september27.events.some((event) => event.title.includes('やんばる森のおもちゃ美術館') && event.navigationUrl === toyMap));
    assert.ok(september27.events.some((event) => event.title.includes('AEON 名護')));
    assert.doesNotMatch(JSON.stringify(september27), /今歸仁|今帰仁/);
    assert.ok(september28.events.some((event) => event.title.includes('釣って見つけるぼうけんの国') && event.navigationUrl === adventureMap));
    assert.doesNotMatch(JSON.stringify(september28), /東南植物樂園|東南植物楽園/);
  }

  for (const variantId of ['A', 'B']) {
    const day = trip.days[variantId].find((item) => item.date === '2026-09-28');
    assert.ok(day.events.some((event) => event.title.includes('沖繩兒童王國')));
  }
  const relaxedDay = trip.days.C.find((item) => item.date === '2026-09-28');
  const relaxedMainEvents = relaxedDay.events.filter((event) => ['activity', 'culture'].includes(event.type));
  assert.deepEqual(relaxedMainEvents.map((event) => event.title), ['釣って見つけるぼうけんの国 沖縄']);
});

test('September 24 through 29 meals resolve to concrete route-aware family dining guides', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const requiredGuides = [
    'toyosaki-lunch', 'nago-coast-lunch', 'busena-lunch', 'nago-attractions-lunch', 'kouri-lunch',
    'aeon-nago-dinner', 'ishikawa-lunch', 'owan-dinner', 'onna-lunch',
  ];

  assert.deepEqual(Object.keys(trip.diningGuides ?? {}).sort(), requiredGuides.sort());
  for (const [guideId, guide] of Object.entries(trip.diningGuides)) {
    assert.match(guide.checkedAt, /^2026-08-30$/);
    assert.ok(guide.routeNote.length > 12, `${guideId} must explain why it is on route`);
    assert.equal(guide.options.length, 2, `${guideId} must offer a primary and backup restaurant`);
    assert.deepEqual(guide.options.map((option) => option.rank), ['首選', '備選']);
    for (const option of guide.options) {
      assert.ok(option.name.length > 2);
      assert.ok(option.familyNote.length > 8);
      assert.doesNotMatch(option.mapQuery, /子連れ|周邊|附近|ランチ$/);
    }
  }

  for (const variantId of ['A', 'B', 'C']) {
    const earlyMeals = trip.days[variantId]
      .filter((day) => day.date >= '2026-09-24' && day.date <= '2026-09-29')
      .flatMap((day) => day.events)
      .filter((event) => event.type === 'meal');
    for (const event of earlyMeals) {
      assert.ok(event.diningGuideId, `${event.id} must not remain a generic restaurant search`);
      assert.ok(trip.diningGuides[event.diningGuideId], `${event.id} must resolve dining guide ${event.diningGuideId}`);
      assert.doesNotMatch(event.mapQuery ?? '', /子連れ|周邊|附近|ランチ$/);
    }
  }
});

test('September 28 follows one direction from the attractions to the supplied Owan City dinner', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const owanMap = 'https://maps.app.goo.gl/dCrZJu6TaCYwdDhM8?g_st=i';
  assert.deepEqual(
    trip.diningGuides?.['owan-dinner']?.options.map((option) => option.name),
    ['和風亭 大湾シティ店', '大阪王将 大湾シティ店'],
  );

  for (const variantId of ['A', 'B', 'C']) {
    const day = trip.days[variantId].find((item) => item.date === '2026-09-28');
    const adventureIndex = day.events.findIndex((event) => event.title.includes('釣って見つけるぼうけんの国'));
    const lunchIndex = day.events.findIndex((event) => event.diningGuideId === 'ishikawa-lunch');
    const dinnerIndex = day.events.findIndex((event) => event.diningGuideId === 'owan-dinner');
    const dinner = day.events[dinnerIndex];
    assert.ok(lunchIndex >= 0 && adventureIndex >= 0 && dinnerIndex > adventureIndex);
    assert.equal(dinner.navigationUrl, owanMap);
    assert.match(dinner.title, /サンエー大湾シティ/);
    assert.ok(day.events.slice(dinnerIndex + 1).every((event) => event.type === 'drive' || event.type === 'stay'));
  }
});

test('September 29 active plan runs west-to-north without returning to Cape Zanpa', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const day = trip.days.B.find((item) => item.date === '2026-09-29');
  const titles = day.events.map((event) => event.title).join(' → ');
  assert.match(titles, /^殘波岬.*琉球村.*親子午餐.*萬座毛.*回飯店整理行李$/);
  assert.equal(day.events.filter((event) => event.diningGuideId === 'onna-lunch').length, 1);
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
  const fixed = trip.fixedEvents.find((event) => event.id === 'f-1002-snorkeling');
  const booking = trip.activityBookings?.['bestdive-snorkeling'];

  assert.deepEqual(
    fixed && { date: fixed.date, time: fixed.time, kind: fixed.kind, bookingId: fixed.bookingId, sourceIds: fixed.sourceIds },
    { date: '2026-10-02', time: '09:00', kind: 'snorkeling', bookingId: 'bestdive-snorkeling', sourceIds: ['bestdive'] },
  );
  assert.deepEqual(
    booking && {
      operator: booking.operator,
      activityTime: booking.activityTime,
      meetingTime: booking.meetingTime,
      meetingPlace: booking.meetingPlace,
      address: booking.address,
      mapCode: booking.mapCode,
      phone: booking.phone,
    },
    {
      operator: '青潛 BEST DIVE OKINAWA',
      activityTime: '09:00',
      meetingTime: '08:00',
      meetingPlace: '青潛免費停車場《裝備區》',
      address: '〒904-0415 沖縄県国頭郡恩納村字仲泊94番地',
      mapCode: '206 066 043*58',
      phone: '+81-70-3124-7160',
    },
  );
  assert.ok(booking.bring.includes('浴巾'));
  assert.ok(booking.precautions.some((item) => item.includes('08:20')));
  assert.ok(booking.precautions.some((item) => item.includes('氣喘')));
  assert.ok(booking.precautions.some((item) => item.includes('每2位小朋友')));
  assert.ok(booking.sourceIds.includes('bestdive-meeting'));
  assert.ok(booking.sourceIds.includes('bestdive-flow'));
  assert.ok(booking.sourceIds.includes('bestdive-terms'));

  for (const variantId of ['A', 'B', 'C']) {
    const day = trip.days[variantId].find((item) => item.date === '2026-10-02');
    assert.ok(day.events.some((event) => (
      event.time === '09:00'
      && event.title.includes('青潛 BEST DIVE OKINAWA')
      && event.bookingId === 'bestdive-snorkeling'
      && event.sourceIds?.includes('bestdive')
    )), `${variantId} must include the fixed snorkeling booking`);
  }
  assert.doesNotMatch(JSON.stringify(trip), /Pink Mermaid|pinkmermaid/i);
});

test('every paid itinerary attraction resolves to current official ticket information', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const expectedTicketIds = [
    'adventure-okinawa', 'bestdive', 'busena', 'churaumi', 'dmm', 'fruitsland',
    'kouri', 'manzamo', 'neopark', 'okinawaworld', 'pineapple', 'ryukyumura',
    'shurijo', 'toy-museum', 'zoo',
  ];
  assert.deepEqual(trip.ticketInfo.map((item) => item.id).sort(), expectedTicketIds);

  const tickets = new Map(trip.ticketInfo.map((item) => [item.id, item]));
  for (const ticket of tickets.values()) {
    assert.ok(ticket.price.length > 0, `${ticket.id} must include a price summary`);
    assert.match(ticket.checkedAt, /^2026-08-(29|30)$/);
    assert.ok(trip.sources.some((source) => source.id === ticket.sourceId), `${ticket.id} must resolve an official source`);
  }
  assert.match(tickets.get('toy-museum').price, /成人.*¥1,400.*1歲以上小學生.*¥1,000/);
  assert.match(tickets.get('adventure-okinawa').price, /成人.*¥2,670.*3歲以上未就學兒童.*¥1,860/);
  assert.equal(tickets.get('toy-museum').checkedAt, '2026-08-30');
  assert.equal(tickets.get('adventure-okinawa').checkedAt, '2026-08-30');
  assert.match(tickets.get('busena').price, /成人 ¥2,100.*4歲～中學生 ¥1,050/);
  assert.match(tickets.get('neopark').price, /¥1,800.*¥1,000/);
  assert.match(tickets.get('churaumi').price, /成人 ¥2,180.*未滿6歲免費/);
  assert.match(tickets.get('dmm').price, /成人 ¥2,800～¥3,200.*4～12歲 ¥1,700～¥2,100/);

  const paidSourceIds = new Set(expectedTicketIds);
  for (const variantId of ['A', 'B', 'C']) {
    for (const day of trip.days[variantId]) {
      for (const event of day.events) {
        const matchedPaidSource = event.sourceIds?.find((sourceId) => paidSourceIds.has(sourceId));
        if (matchedPaidSource) assert.ok(tickets.has(matchedPaidSource), `${event.id} must resolve ticket info`);
      }
    }
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
