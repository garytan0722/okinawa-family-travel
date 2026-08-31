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

function routePoints(day) {
  const points = [];
  for (const event of day?.events ?? []) {
    const query = event.mapQuery?.trim();
    if (!query || GENERIC_ROUTE_QUERY.test(query) || points.at(-1)?.query === query) continue;
    points.push({ query, label: event.place || event.title || query });
  }
  return points;
}

function routeStops(day) {
  return routePoints(day).map((point) => point.query);
}

function previousDate(date) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

function stayPoint(stay) {
  const query = stay?.routeQuery || stay?.mapQuery;
  if (!query) return null;
  return { query, label: stay.privateNavigation ? `${stay.name}附近` : stay.name };
}

function appendPoint(points, point, replaceMatchingLabel = false) {
  if (!point) return;
  if (points.at(-1)?.query === point.query) {
    if (replaceMatchingLabel) points[points.length - 1] = point;
    return;
  }
  points.push(point);
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

export function dayRoutePlan(trip, day, maxPoints = 5) {
  const points = [];
  appendPoint(points, stayPoint(getStayForDate(trip, previousDate(day.date))));
  for (const point of routePoints(day)) appendPoint(points, point);

  const finishesAtAirport = day.events.at(-1)?.type === 'flight';
  if (!finishesAtAirport) appendPoint(points, stayPoint(getStayForDate(trip, day.date)), true);

  const stops = points.map((point) => point.query);
  const routeDay = { events: stops.map((mapQuery) => ({ mapQuery })) };
  return { points, stops, segments: dayRouteSegments(routeDay, maxPoints) };
}
