import assert from 'node:assert/strict';
import test from 'node:test';

import { parseOtsReservations } from '../src/private-bookings.mjs';

test('OTS mail is parsed locally into ordered reservation fields without retaining the full message', () => {
  const text = `
預約號碼為 OTS0000001。
提車時間： 2026年09月30日 11:30
歸還時間： 2026年10月04日 12:30
https://www.otsinternational.jp/otsrentacar/cn/reserve/detail/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/
https://www.otsinternational.jp/otsrentacar/cn/contact/1/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/

預約號碼為 OTS0000002。
提車時間： 2026年09月24日 12:00
歸還時間： 2026年09月30日 12:00
https://www.otsinternational.jp/otsrentacar/cn/reserve/detail/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/
https://www.otsinternational.jp/otsrentacar/cn/contact/1/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/`;

  const result = parseOtsReservations(text);

  assert.equal(result.length, 2);
  assert.deepEqual(result.map((item) => item.confirmationCode), ['OTS0000002', 'OTS0000001']);
  assert.deepEqual(result.map((item) => item.pickupAt), ['2026-09-24 12:00', '2026-09-30 11:30']);
  assert.match(result[0].detailUrl, /\/reserve\/detail\//);
  assert.match(result[1].contactUrl, /\/contact\/1\//);
  assert.equal(Object.hasOwn(result[0], 'rawText'), false);
});

test('non-OTS and non-https links are discarded', () => {
  const result = parseOtsReservations(`
預約號碼為 OTS0000003。
提車時間： 2026年09月24日 12:00
http://example.com/reserve/detail/not-safe/
javascript:alert(1)`);

  assert.equal(result[0].detailUrl, '');
  assert.equal(result[0].contactUrl, '');
});
