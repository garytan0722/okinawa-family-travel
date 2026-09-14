const OTS_ORIGIN = 'https://www.otsinternational.jp';

function normalizeDateTime(value = '') {
  const match = value.match(/(\d{4})年(\d{2})月(\d{2})日\s+(\d{2}:\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]} ${match[4]}` : '';
}

export function officialOtsUrl(value = '', kind = '') {
  try {
    const url = new URL(value.trim());
    const allowedPath = kind === 'contact'
      ? /^\/otsrentacar\/cn\/contact\/1\/[a-z0-9]+\/$/i
      : /^\/otsrentacar\/cn\/reserve\/detail\/[a-z0-9]+\/$/i;
    return url.origin === OTS_ORIGIN && !url.search && !url.hash && allowedPath.test(url.pathname)
      ? url.href
      : '';
  } catch {
    return '';
  }
}

function firstMatch(text, pattern) {
  return text.match(pattern)?.[1]?.trim() ?? '';
}

export function parseOtsReservations(text = '') {
  const source = String(text);
  const matches = [...source.matchAll(/預約號碼為\s*(OTS\d{7})/gi)];
  return matches.map((match, index) => {
    const segment = source.slice(match.index, matches[index + 1]?.index ?? source.length);
    const pickupRaw = firstMatch(segment, /提車時間[:：]\s*([^\n\r]+)/i);
    const returnRaw = firstMatch(segment, /歸還時間[:：]\s*([^\n\r]+)/i);
    const detailRaw = firstMatch(segment, /(https:\/\/www\.otsinternational\.jp\/otsrentacar\/cn\/reserve\/detail\/[a-z0-9]+\/)/i);
    const contactRaw = firstMatch(segment, /(https:\/\/www\.otsinternational\.jp\/otsrentacar\/cn\/contact\/1\/[a-z0-9]+\/)/i);
    return {
      confirmationCode: match[1].toUpperCase(),
      pickupAt: normalizeDateTime(pickupRaw),
      returnAt: normalizeDateTime(returnRaw),
      detailUrl: officialOtsUrl(detailRaw),
      contactUrl: officialOtsUrl(contactRaw, 'contact'),
    };
  }).sort((a, b) => a.pickupAt.localeCompare(b.pickupAt));
}
