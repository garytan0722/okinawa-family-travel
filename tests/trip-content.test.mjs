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

test('B follows the supplied September 30 through October 4 itinerary in route order', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const expectedTitles = {
    '2026-09-30': ['台灣虎航 IT230 抵達', 'A&W 那霸機場早餐', '取第二台車', '還第一台車、六人會合', 'C&C BREAKFAST 早午餐', '波上宮', '第一牧志公設市場與國際通', 'San-A Naha Main Place 晚餐'],
    '2026-10-01': ['北上美麗海', '沖繩美麗海水族館', 'BANTA CAFE 看日落', '美國村晚餐與散步', '回恩納住宿'],
    '2026-10-02': ['青潛 08:00 集合', '青潛 BEST DIVE OKINAWA 青洞浮潛（固定）', '港川外人住宅', '普天滿宮', 'AEON Rycom 晚餐'],
    '2026-10-03': ['首里城公園', '達摩寺', '沖縄そばの店 しむじょう', '沖繩世界・玉泉洞', '六人：PARCO CITY 晚餐與採買'],
  };

  for (const [date, titles] of Object.entries(expectedTitles)) {
    const day = trip.days.B.find((item) => item.date === date);
    assert.deepEqual(day.events.map((event) => event.title), titles, `${date} must follow the supplied itinerary`);
  }

  const october4 = trip.days.B.find((item) => item.date === '2026-10-04');
  assert.deepEqual(october4.events.map((event) => event.title), [
    'DMM Kariyushi水族館',
    'Ashibinaa快速採買',
    'OTS還車',
    '譚家四口機場報到；小倆口寄放行李',
    '小倆口搭計程車往瀨長島',
    '譚家四口 JX871 起飛',
    '小倆口由瀨長島搭計程車回機場',
    '小倆口 BR185 起飛',
  ]);
});

test('rain plans cover every trip date exactly once and retain fixed logistics', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const expectedDates = [
    '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27',
    '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01',
    '2026-10-02', '2026-10-03', '2026-10-04',
  ];

  assert.deepEqual(trip.rainPlans?.map((day) => day.date), expectedDates);
  for (const plan of trip.rainPlans) {
    for (const key of ['title', 'area', 'stay', 'drive', 'rainPlan']) assert.ok(plan[key], `${plan.date} needs ${key}`);
    assert.ok(plan.events.length >= 3, `${plan.date} needs a usable full-day rain schedule`);
    const expectedFixedIds = trip.fixedEvents.filter((event) => event.date === plan.date).map((event) => event.id);
    const actualFixedIds = plan.events.filter((event) => event.fixedEventId).map((event) => event.fixedEventId);
    assert.deepEqual(actualFixedIds, expectedFixedIds, `${plan.date} rain mode must retain every fixed logistic`);
  }
});

test('October 1 rain mode retains the Churaumi indoor main hall before a southbound covered stop', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const plan = trip.rainPlans.find((day) => day.date === '2026-10-01');
  const usefulStops = plan.events.filter((event) => event.type === 'activity');

  assert.deepEqual(usefulStops.map((event) => event.title), [
    '沖繩美麗海水族館室內主館',
    '名護鳳梨園',
  ]);
  assert.deepEqual(usefulStops.map((event) => event.mapQuery), [
    '沖縄美ら海水族館',
    'ナゴパイナップルパーク',
  ]);
});

test('weather-sensitive events expose two or three valid nearby quick rain backups', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const optionIds = new Set(trip.rainyDayOptions.map((item) => item.id));
  const weatherSensitiveTypes = new Set(['activity', 'culture', 'walk', 'view', 'play', 'cafe']);

  for (const [variantId, days] of Object.entries(trip.days)) {
    for (const day of days) {
      const quickBackups = day.events.filter((event) => event.rainBackupIds);
      assert.ok(quickBackups.length > 0 || day.events.every((event) => !weatherSensitiveTypes.has(event.type)), `${variantId} ${day.date} needs a quick rain choice`);
      for (const event of day.events.filter((item) => weatherSensitiveTypes.has(item.type))) {
        assert.ok(event.rainBackupIds, `${event.id} is weather-sensitive`);
      }
      for (const event of quickBackups) {
        assert.ok(event.rainBackupIds.length >= 2 && event.rainBackupIds.length <= 3, `${event.id} needs 2-3 backups`);
        assert.equal(new Set(event.rainBackupIds).size, event.rainBackupIds.length, `${event.id} backups must be unique`);
        for (const id of event.rainBackupIds) assert.ok(optionIds.has(id), `${event.id} references missing backup ${id}`);
      }
    }
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
    { date: '2026-09-24', party: '譚家四口', departure: '08:00', arrival: '10:45', airline: '華航', flightNumber: 'CI120', route: null },
    { date: '2026-09-30', party: '小倆口', departure: '06:50', arrival: '09:20', airline: '台灣虎航', flightNumber: 'IT230', route: 'TPE → OKA' },
    { date: '2026-10-04', party: '譚家四口', departure: '15:50', arrival: '16:25', airline: '星宇航空', flightNumber: 'JX871', route: 'OKA → TPE T2' },
    { date: '2026-10-04', party: '小倆口', departure: '20:20', arrival: '20:55', airline: '長榮航空', flightNumber: 'BR185', route: 'OKA → TPE T2' },
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

test('public trip content uses only the corrected 譚家四口 and 小倆口 labels', () => {
  const serialized = readFileSync(tripPath, 'utf8');
  assert.match(serialized, /譚家四口/);
  assert.match(serialized, /小倆口/);
  assert.doesNotMatch(serialized, /曾蘿情侶|曾羅佳|譚家(?!四口)/);
});

test('October 4 plans preserve JX871 and finish with the confirmed BR185 departure', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const jxFlight = trip.fixedEvents.find((event) => event.id === 'f-1004-flight');
  const brFlight = trip.fixedEvents.find((event) => event.id === 'f-1004-flight-couple');
  assert.equal(jxFlight.end, '16:25');
  assert.match(jxFlight.note, /16:25.*抵達台灣/);
  assert.deepEqual(
    brFlight && { time: brFlight.time, end: brFlight.end, title: brFlight.title },
    { time: '20:20', end: '20:55', title: '長榮航空 BR185 小倆口返回台灣' },
  );

  for (const variantId of ['A', 'B', 'C']) {
    const day = trip.days[variantId].find((item) => item.date === '2026-10-04');
    const jxDeparture = day.events.find((event) => event.time === '15:50');
    const brDeparture = day.events.at(-1);
    assert.deepEqual(
      { time: jxDeparture.time, type: jxDeparture.type, title: jxDeparture.title },
      { time: '15:50', type: 'flight', title: '譚家四口 JX871 起飛' },
    );
    assert.deepEqual(
      { time: brDeparture.time, type: brDeparture.type, title: brDeparture.title },
      { time: '20:20', type: 'flight', title: '小倆口 BR185 起飛' },
      `${variantId} must end with the confirmed companion flight`,
    );
    assert.match(jxDeparture.note, /16:25.*抵達台灣/);
    assert.match(brDeparture.note, /20:55.*抵達台灣.*T2/);
    assert.doesNotMatch(JSON.stringify(day), /後續.*未提供|交通尚未提供/);
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

test('OHDr is stored as non-emergency Okinawa medical backup with verified limitations', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  assert.deepEqual(trip.medicalSupport, {
    provider: 'OHDr. for Traveler',
    role: '非緊急中文線上門診',
    hours: '09:00–22:00',
    checkedAt: '2026-08-31',
    preTripPlan: '8–15 日個人方案 ¥1,100；方案內看診 ¥4,200／次',
    groupRule: '團體最多 3 人，需同班機、同住宿並由 1 人聯絡。',
    childrenNote: '幼兒可由家長申請為同行者；兒童糖漿可能需等待 7–8 小時或前往較遠藥局。',
    okinawaMedicine: '沖繩不在快速送藥城市名單；優先請 OHDr. 安排附近調劑藥局領取。',
    priceWarning: '官方頁面價格可能調整且目前不同頁面顯示不一致；付款前由繁中官方頁確認。',
    emergencyRule: '呼吸困難、意識異常、嚴重過敏、持續抽搐或重大外傷直接撥 119。',
    planUrl: 'https://oh-doctor.com/zh-tw/oh-traveler-dr-tw/',
    bookingUrl: 'https://oh-doctor.com/zh-tw/start-spot-tw/',
    sourceIds: ['ohdr-traveler'],
  });
  assert.ok(trip.emergency.some((item) => item.phone === '0570-050-235' && item.hours === '24 小時・全年無休'));
  assert.equal(trip.sources.find((item) => item.id === 'okinawa-medical-hotline')?.url, 'https://www.pref.okinawa.lg.jp/iryokenko/iryo/1005807/1006345/1006367.html');
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
  assert.ok(fixed.some((event) => event.date === '2026-10-04' && event.time === '20:20' && event.kind === 'flight-departure'));
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

test('deployed content exposes only a tracking-free listing for private accommodation', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const stay = trip.stays.find((item) => item.privateNavigation === true);
  assert.equal(stay.name, '恩納村私人住宿');
  assert.equal(stay.nameJa, '非公開');
  assert.equal(stay.privateNavigation, true);
  assert.equal(stay.mapQuery, '');
  assert.equal(stay.routeQuery, '恩納村希望ヶ丘');
  assert.equal(stay.listingUrl, 'https://www.airbnb.com.tw/rooms/1685544413136173306');
  assert.doesNotMatch(stay.listingUrl, /\?|source_impression_id/);
  const serialized = JSON.stringify(trip);
  assert.doesNotMatch(serialized, /source_impression_id/);
  assert.doesNotMatch(serialized, /onestayapp|checkinCode|pinCode/i);
  assert.equal(
    Object.values(trip.days).flat().flatMap((day) => day.events).some((event) => /^\d{3}$/.test(event.note ?? '')),
    false,
    'three-digit private placeholder notes must not be copied from the attachment',
  );
  assert.doesNotMatch(serialized, /"[^"\n]*(?:password|credential|checkinUrl|accessCode|doorCode|accessPin)[^"\n]*"\s*:/i);
});

test('TokuToku guide recommends only purchases that beat individual admission for each itinerary', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const guide = trip.ticketPassGuide;

  assert.equal(guide.checkedAt, '2026-09-03');
  assert.equal(guide.purchaseUrl, 'https://www.klook.com/zh-TW/activity/8900-churaumi-toku-toku-5-pass-okinawa/');
  assert.doesNotMatch(guide.purchaseUrl, /[?&](?:utm_|dd_referrer|aff_)/);
  assert.deepEqual(guide.options.map(({ id, adultPriceYen, includesChuraumi }) => ({ id, adultPriceYen, includesChuraumi })), [
    { id: 'three-pass', adultPriceYen: 3800, includesChuraumi: false },
    { id: 'five-pass', adultPriceYen: 5900, includesChuraumi: true },
  ]);

  const recommendations = guide.recommendationByVariant;
  assert.deepEqual(recommendations.A.uses.map((item) => item.name), ['Neo Park Okinawa', '沖繩兒童王國', '琉球村']);
  assert.deepEqual(recommendations.B.uses.map((item) => item.name), ['沖繩水果樂園', 'Neo Park Okinawa', '琉球村']);
  for (const variantId of ['A', 'B']) {
    const recommendation = recommendations[variantId];
    assert.equal(recommendation.decision, 'buy-three-pass');
    assert.equal(recommendation.party, '譚家四口中的兩位大人');
    assert.equal(recommendation.quantity, 2);
    assert.equal(recommendation.activationDate, '2026-09-26');
    assert.equal(recommendation.savingPerAdultYen, recommendation.individualTotalYen - 3800);
    assert.ok(recommendation.savingPerAdultYen > 0);
  }
  assert.equal(recommendations.C.decision, 'individual');
  assert.ok(recommendations.C.individualTotalYen < 3800);
  assert.match(guide.familyAdvice.join(' '), /小倆口.*單買/);
  assert.match(guide.familyAdvice.join(' '), /4–5歲.*不買套票/);
  assert.match(guide.rules.join(' '), /連續 5 天.*不可退款.*Neo Park.*另付/);
});

test('American Village shopping guide keeps a walkable family order and evidence-based payment labels', () => {
  const trip = JSON.parse(readFileSync(tripPath, 'utf8'));
  const guide = trip.shoppingGuides?.['american-village-family-shopping'];

  assert.ok(guide, 'American Village shopping guide must exist');
  assert.equal(guide.checkedAt, '2026-09-03');
  assert.deepEqual(guide.shops.map((shop) => shop.name), [
    'AMERICAN DEPOT',
    'RANCH',
    'SKIP',
    '海岸倉庫21',
    'OKINAWA MARKET',
  ]);
  assert.deepEqual(guide.shops.map((shop) => shop.paymentStatus), [
    'unverified', 'unverified', 'unverified', 'cards-confirmed', 'unverified',
  ]);
  assert.match(guide.paymentSummary, /未查到官方確認 Cash only.*付款方式未確認.*備現金/);
  for (const shop of guide.shops) {
    assert.ok(shop.hours);
    assert.ok(shop.mapQuery);
    assert.ok(trip.sources.some((source) => source.id === shop.sourceId), `${shop.name} needs an official source`);
  }

  const attachedEvents = Object.entries(trip.days).flatMap(([variantId, days]) => days.flatMap((day) => day.events
    .filter((event) => event.shoppingGuideId === 'american-village-family-shopping')
    .map((event) => `${variantId}:${day.date}:${event.id}`)));
  assert.deepEqual(attachedEvents, [
    'A:2026-10-01:A-1001-4',
    'B:2026-10-01:B-1001-4',
    'C:2026-10-02:C-1002-3',
  ]);
});
