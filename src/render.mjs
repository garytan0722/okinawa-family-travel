import { getPartyForDate, getStayForDate, mapUrl } from './trip-domain.mjs?v=12';

const TYPE_ICONS = {
  activity: '🎟', car: '🚙', culture: '⛩', drive: '🛣', flight: '✈️',
  meal: '🍽', play: '🫧', rest: '🌿', shopping: '🛍', stay: '🏨',
  view: '🌊', walk: '👟', cafe: '☕',
};

export function centeredScrollLeft(containerWidth, scrollWidth, currentScrollLeft, containerLeft, itemLeft, itemWidth) {
  const itemOffset = itemLeft - containerLeft + currentScrollLeft;
  const centered = itemOffset + (itemWidth / 2) - (containerWidth / 2);
  return Math.max(0, Math.min(scrollWidth - containerWidth, centered));
}

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function shortDate(date) {
  const [, month, day] = date.split('-');
  const weekday = new Intl.DateTimeFormat('zh-TW', {
    weekday: 'short', timeZone: 'Asia/Tokyo',
  }).format(new Date(`${date}T12:00:00+09:00`));
  return `${Number(month)}/${Number(day)} ${weekday}`;
}

function sourceLinks(trip, ids = []) {
  const links = ids
    .map((id) => trip.sources.find((source) => source.id === id))
    .filter(Boolean)
    .map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">官方資料</a>`);
  return links.length ? `<span class="source-links">${links.join(' · ')}</span>` : '';
}

function ticketForEvent(trip, event) {
  const sourceIds = event.sourceIds ?? [];
  return trip.ticketInfo?.find((ticket) => sourceIds.includes(ticket.id));
}

function renderTicketInfo(trip, event) {
  const ticket = ticketForEvent(trip, event);
  if (!ticket) return '';
  const source = trip.sources.find((item) => item.id === ticket.sourceId);
  const heading = ticket.kind === 'activity' ? '活動費' : '門票';
  return `<aside class="ticket-info" aria-label="${escapeHtml(ticket.label)}${heading}資訊">
    <span>🎟 ${heading} · 查核 ${escapeHtml(ticket.checkedAt)}</span>
    <strong>${escapeHtml(ticket.price)}</strong>
    <p>${escapeHtml(ticket.note)}</p>
    ${source ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">查看官方${heading === '門票' ? '票價' : heading}</a>` : ''}
  </aside>`;
}

function renderBookingInfo(trip, event) {
  const booking = event.bookingId ? trip.activityBookings?.[event.bookingId] : null;
  if (!booking) return '';
  const sources = booking.sourceIds
    .map((id) => trip.sources.find((source) => source.id === id))
    .filter(Boolean);
  return `<details class="booking-info" open>
    <summary>🌊 ${escapeHtml(booking.activityTime)} 活動 · ${escapeHtml(booking.meetingTime)} 集合</summary>
    <div class="booking-facts">
      <p><span>建議出發</span><strong>${escapeHtml(booking.recommendedDeparture)} 從那霸離開</strong></p>
      <p><span>集合地點</span><strong>${escapeHtml(booking.meetingPlace)}</strong></p>
      <p><span>地址</span><strong>${escapeHtml(booking.address)}</strong></p>
      <p><span>MapCode</span><strong>${escapeHtml(booking.mapCode)}</strong></p>
    </div>
    <p class="booking-parking">🚙 ${escapeHtml(booking.parking)}</p>
    <p class="booking-kit"><strong>自備：</strong>${booking.bring.map(escapeHtml).join('、')}<br><strong>店家提供：</strong>${booking.included.map(escapeHtml).join('、')}</p>
    <ul>${booking.precautions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    <div class="booking-actions">
      <a href="${escapeHtml(booking.navigationUrl)}" target="_blank" rel="noopener noreferrer">📍 官方集合導航</a>
      <a href="tel:${escapeHtml(booking.phone)}">☎ ${escapeHtml(booking.phone)}</a>
      ${sources.map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a>`).join('')}
    </div>
  </details>`;
}

function renderEvent(trip, event, completed) {
  const maps = event.navigationUrl || mapUrl(event.mapQuery);
  const isDone = completed[event.id] === true;
  return `
    <li class="event-card${isDone ? ' is-complete' : ''}" data-event-id="${escapeHtml(event.id)}">
      <span class="route-dot" aria-hidden="true"><span class="paw-print" aria-hidden="true"></span></span>
      <label class="event-check">
        <input type="checkbox" data-action="toggle-event" data-event-id="${escapeHtml(event.id)}"${isDone ? ' checked' : ''}>
        <span class="check-paw" aria-hidden="true"><img class="dog-paw-stamp" src="./icons/dog-paw-stamp.svg?v=12" alt=""></span>
        <span class="sr-only">完成 ${escapeHtml(event.title)}</span>
      </label>
      <time>${escapeHtml(event.time)}</time>
      <div class="event-body">
        <span class="event-kind">${TYPE_ICONS[event.type] ?? '•'} ${escapeHtml(event.type)}</span>
        <h3>${escapeHtml(event.title)}</h3>
        <p class="event-place">${escapeHtml(event.place)}</p>
        ${event.note ? `<p class="event-note">${escapeHtml(event.note)}</p>` : ''}
        ${renderBookingInfo(trip, event)}
        ${renderTicketInfo(trip, event)}
        <div class="event-actions">
          ${maps ? `<a href="${escapeHtml(maps)}" target="_blank" rel="noopener noreferrer">📍 Google Maps</a>` : ''}
          ${sourceLinks(trip, event.sourceIds)}
        </div>
      </div>
    </li>`;
}

export function renderVariantTabs(trip, selected) {
  const tabs = Object.entries(trip.variants).map(([id, variant]) => `
    <button type="button" role="tab" data-variant="${id}" aria-selected="${id === selected}" class="variant-tab${id === selected ? ' is-active' : ''}">
      <span class="variant-letter">${id}<span class="variant-paw paw-print" aria-hidden="true"></span></span>
      <span><strong>${escapeHtml(variant.name)}</strong><small>${escapeHtml(variant.tagline)}</small></span>
    </button>`).join('');
  return `<div class="variant-tabs" role="tablist" aria-label="選擇行程節奏">${tabs}</div>`;
}

export function renderDay(trip, day, variantState) {
  const party = getPartyForDate(trip, day.date);
  const stay = getStayForDate(trip, day.date);
  const note = variantState.notes?.[day.date] ?? '';
  const energy = variantState.energy?.[day.date] ?? 'okay';
  const events = day.events.map((event) => renderEvent(trip, event, variantState.completed ?? {})).join('');
  const stayMaps = stay && !stay.privateNavigation ? mapUrl(stay.mapQuery) : '';

  return `
    <article class="day-view" data-date="${day.date}">
      <header class="day-heading">
        <div><span class="day-kicker">${shortDate(day.date)} · ${escapeHtml(day.area)}</span><h2>${escapeHtml(day.title)}</h2></div>
        <span class="party-pill">${party ? `${party.adults}大 ${party.children}小` : '旅程日'}</span>
      </header>
      <div class="context-grid">
        <section><span>今晚住</span><strong>${escapeHtml(day.stay)}</strong>${stayMaps ? `<a href="${escapeHtml(stayMaps)}" target="_blank" rel="noopener noreferrer">導航</a>` : `<small>${stay?.privateNavigation ? '使用私人訂房資料導航' : ''}</small>`}</section>
        <section><span>今日車程</span><strong>${escapeHtml(day.drive)}</strong></section>
      </div>
      <ol class="event-list">${events}</ol>
      <section class="rain-card"><span>☔ 雨天／疲累備案</span><p>${escapeHtml(day.rainPlan)}</p></section>
      <section class="record-card">
        <div class="record-head"><span>今天孩子的電量</span><div class="energy-control" role="group" aria-label="孩子體力">
          ${[['great','滿格'],['okay','普通'],['tired','累了']].map(([value,label]) => `<button type="button" data-action="set-energy" data-energy="${value}" aria-pressed="${energy === value}">${label}</button>`).join('')}
        </div></div>
        <label>今日筆記<textarea data-action="day-note" rows="3" placeholder="臨時調整、孩子反應、停車位置…">${escapeHtml(note)}</textarea></label>
      </section>
    </article>`;
}

export function renderSources(trip) {
  const items = trip.sources.map((source) => `
    <li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a><span>查核 ${escapeHtml(source.checkedAt)}</span></li>`).join('');
  return `
    <section class="sources-view">
      <span class="section-kicker">FIELD NOTES</span>
      <h2>官方資料與行前複核</h2>
      <p>營業時間、海況與臨時休館可能變動，請在 <strong>${escapeHtml(trip.recheckBy)}</strong> 再確認。</p>
      <ul>${items}</ul>
    </section>`;
}

export function renderFlightSummary(trip) {
  const flights = trip.flights.map((flight) => {
    const flightLabel = [flight.airline, flight.flightNumber].filter(Boolean).join(' ') || '班號未提供';
    const arrival = flight.arrival || '抵達時間未提供';
    return `
    <article class="flight-card">
      <span class="card-number">${shortDate(flight.date)} · ${escapeHtml(flight.party)}</span>
      <div class="flight-times"><time>${escapeHtml(flight.departure)}</time><span aria-hidden="true">✈</span><time>${escapeHtml(arrival)}</time></div>
      <h3>${escapeHtml(flightLabel)}</h3>
      <p>${escapeHtml(flight.route || '航線未提供')}</p>
    </article>`;
  }).join('');
  return `<section class="flight-summary" aria-labelledby="flight-summary-title"><p class="eyebrow">FLIGHT BOARD</p><h2 id="flight-summary-title">班機時間</h2><p>只列已確認資料；未提供的抵達時間、班號與航線不推測。</p><div class="flight-grid">${flights}</div></section>`;
}

export function renderEmergencyView(trip) {
  const roadside = trip.roadsideAssistance;
  const roadsideSources = roadside.sourceIds
    .map((id) => trip.sources.find((item) => item.id === id))
    .filter(Boolean);
  const emergencyCards = trip.emergency.map((item) => `
    <a class="emergency-card" href="tel:${escapeHtml(item.phone)}">
      <span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.phone)}</strong><small>${escapeHtml(item.note)}</small>
    </a>`).join('');
  const checklist = roadside.beforeCalling.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

  return `<section class="tool-view emergency-view">
    <p class="eyebrow">KEEP CALM</p><h1>緊急聯絡</h1>
    <p class="lede">發生事故不分大小先報警；有傷病或火災再叫救護／消防。</p>
    <div class="emergency-grid">${emergencyCards}</div>
    <article class="ots-support-card">
      <span class="card-number">OTS ACCIDENT &amp; BREAKDOWN</span><h2>${escapeHtml(roadside.provider)}事故／故障窗口</h2>
      <a class="ots-phone" href="tel:${escapeHtml(roadside.dayPhone)}"><span>${escapeHtml(roadside.dayHours)}</span><strong>${escapeHtml(roadside.dayPhone)}</strong><small>OTS 租車預約中心</small></a>
      <div class="ots-support-grid"><section><h3>打電話前準備</h3><ul>${checklist}</ul></section><section><h3>夜間 ${escapeHtml(roadside.afterHours)}</h3><p>${escapeHtml(roadside.afterHoursNote)}</p></section></div>
      <div class="official-links">${roadsideSources.map((source) => `<a class="official-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a>`).join('')}</div>
    </article>
    <article class="accident-steps"><span>🚙 發生車禍</span><p>先確保人員安全；事故不分大小先撥 110，傷病或火災再撥 119；接著聯絡 OTS；不要私下和解。</p></article>
  </section>`;
}
