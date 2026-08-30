function inRange(date, from, to) {
  return date >= from && date <= to;
}

export function getPartyForDate(trip, date) {
  const period = trip.partyPeriods.find((item) => inRange(date, item.from, item.to));
  if (!period) return null;
  return {
    adults: period.adults,
    children: period.children,
    label: period.label,
  };
}

export function getStayForDate(trip, date) {
  return trip.stays.find((stay) => inRange(date, stay.from, stay.to)) ?? null;
}

export function getVariantDay(trip, variantId, date) {
  const days = trip.days[variantId];
  if (!Array.isArray(days)) return null;
  return days.find((day) => day.date === date) ?? null;
}

export function nextFixedEvent(trip, date, time = '00:00') {
  return trip.fixedEvents
    .filter((event) => event.date > date || (event.date === date && event.time >= time))
    .sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`))[0] ?? null;
}

export function mapUrl(query) {
  if (!query) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const GENERIC_ROUTE_QUERY = /(?:子連れ|周邊|附近|テイクアウト|ブランチ|ランチ$|ディナー$)/i;

function routeStops(day) {
  const seen = new Set();
  return (day?.events ?? []).flatMap((event) => {
    const query = event.mapQuery?.trim();
    if (!query || event.type === 'walk' || GENERIC_ROUTE_QUERY.test(query) || seen.has(query)) return [];
    seen.add(query);
    return [query];
  });
}

export function directionsUrl(stops) {
  if (!Array.isArray(stops) || stops.length < 2) return '';
  const params = new URLSearchParams({
    api: '1',
    origin: stops[0],
    destination: stops.at(-1),
    travelmode: 'driving',
    dir_action: 'navigate',
  });
  if (stops.length > 2) params.set('waypoints', stops.slice(1, -1).join('|'));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function dayRouteSegments(day, maxPoints = 5) {
  const stops = routeStops(day);
  if (stops.length < 2) return [];
  const safeMax = Math.max(2, maxPoints);
  const segments = [];
  for (let index = 0; index < stops.length - 1; index += safeMax - 1) {
    const segmentStops = stops.slice(index, index + safeMax);
    if (segmentStops.length < 2) break;
    segments.push({ stops: segmentStops, url: directionsUrl(segmentStops) });
  }
  return segments;
}
