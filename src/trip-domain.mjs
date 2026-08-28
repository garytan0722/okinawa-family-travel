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
