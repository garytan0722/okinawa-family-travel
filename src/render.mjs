import { dayRouteSegments, getPartyForDate, getStayForDate, mapUrl } from './trip-domain.mjs?v=16';

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

function renderDiningGuide(trip, event) {
  const guide = event.diningGuideId ? trip.diningGuides?.[event.diningGuideId] : null;
  if (!guide) return '';
  const options = guide.options.map((option) => {
    const source = option.sourceId ? trip.sources.find((item) => item.id === option.sourceId) : null;
    return `<article class="dining-option${option.rank === '首選' ? ' is-primary' : ''}">
      <span class="dining-rank">${escapeHtml(option.rank)}</span>
      <div><strong>${escapeHtml(option.name)}</strong><small>${escapeHtml(option.food)}</small></div>
      <p>${escapeHtml(option.familyNote)}</p>
      <div class="dining-actions">
        <a href="${escapeHtml(mapUrl(option.mapQuery))}" target="_blank" rel="noopener noreferrer">📍 直接導航</a>
        ${source ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">官方資料</a>` : ''}
      </div>
    </article>`;
  }).join('');
  return `<aside class="dining-guide" aria-label="${escapeHtml(guide.title)}">
    <div class="dining-heading"><span aria-hidden="true">🐾</span><div><small>汪喵順路選餐 · 查核 ${escapeHtml(guide.checkedAt)}</small><strong>${escapeHtml(guide.title)}</strong></div></div>
    <p class="dining-route"><strong>不繞路理由：</strong>${escapeHtml(guide.routeNote)}</p>
    <div class="dining-options">${options}</div>
  </aside>`;
}

function renderEvent(trip, event, completed) {
  const maps = event.navigationUrl || mapUrl(event.mapQuery);
  const isDone = completed[event.id] === true;
  return `
    <li class="event-card${isDone ? ' is-complete' : ''}" data-event-id="${escapeHtml(event.id)}">
      <span class="route-dot" aria-hidden="true"><span class="paw-print" aria-hidden="true"></span></span>
      <label class="event-check">
        <input type="checkbox" data-action="toggle-event" data-event-id="${escapeHtml(event.id)}"${isDone ? ' checked' : ''}>
        <span class="check-paw" aria-hidden="true"><img class="dog-paw-stamp" src="./icons/dog-paw-stamp.svg?v=16" alt=""></span>
        <span class="sr-only">完成 ${escapeHtml(event.title)}</span>
      </label>
      <time>${escapeHtml(event.time)}</time>
      <div class="event-body">
        <span class="event-kind">${TYPE_ICONS[event.type] ?? '•'} ${escapeHtml(event.type)}</span>
        <h3>${escapeHtml(event.title)}</h3>
        <p class="event-place">${escapeHtml(event.place)}</p>
        ${event.note ? `<p class="event-note">${escapeHtml(event.note)}</p>` : ''}
        ${renderDiningGuide(trip, event)}
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
  const routeSegments = dayRouteSegments(day);
  const routeActions = routeSegments.map((segment, index) => {
    const label = routeSegments.length === 1 ? '開啟全日路線' : `${index === 0 ? '上午' : index === 1 ? '下午' : `第 ${index + 1} 段`}路線`;
    return `<a href="${escapeHtml(segment.url)}" target="_blank" rel="noopener noreferrer">🗺 ${label}<small>${segment.stops.length} 個停靠點</small></a>`;
  }).join('');

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
      ${routeActions ? `<section class="day-route-card" aria-label="今日 Google Maps 多站導航"><div><span>GOOGLE MAPS ROUTE</span><strong>今天照順序一路開</strong></div><div class="day-route-actions">${routeActions}</div></section>` : ''}
      <ol class="event-list">${events}</ol>
      <section class="rain-card"><span>☔ 雨天／疲累備案</span><p>${escapeHtml(day.rainPlan)}</p><a href="#/rainy">查看 24 個雨天備案 →</a></section>
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
      <a class="rainy-portal" href="#/rainy"><span aria-hidden="true">☔🐾</span><div><strong>打開雨天備案庫</strong><small>24 個室內、遮雨與親子地點，依類型挑選</small></div><b aria-hidden="true">→</b></a>
      <ul>${items}</ul>
    </section>`;
}

export function renderRainyDayView(trip) {
  const groups = trip.rainyDayCategories.map((category) => {
    const options = trip.rainyDayOptions.filter((item) => item.category === category.id);
    return `<section class="rainy-category" id="rainy-${escapeHtml(category.id)}">
      <header><span aria-hidden="true">${escapeHtml(category.icon)}</span><div><h2>${escapeHtml(category.label)}</h2><small>${options.length} 個選擇</small></div></header>
      <div class="rainy-grid">${options.map((item) => `<article class="rainy-option-card${item.inItinerary ? ' is-planned' : ''}">
        <div class="rainy-card-top"><span>${escapeHtml(item.area)}</span>${item.inItinerary ? '<b>已在行程</b>' : ''}</div>
        <h3>${escapeHtml(item.name)}</h3>
        <div class="rainy-tags"><span>${escapeHtml(item.weatherFit)}</span><span>${escapeHtml(item.duration)}</span></div>
        <p>${escapeHtml(item.familyNote)}</p>
        <div class="rainy-actions"><a href="${escapeHtml(mapUrl(item.mapQuery))}" target="_blank" rel="noopener noreferrer">📍 直接導航</a><a href="${escapeHtml(item.officialUrl)}" target="_blank" rel="noopener noreferrer">官方資料</a></div>
      </article>`).join('')}</div>
    </section>`;
  }).join('');
  const categoryNav = trip.rainyDayCategories.map((category) => `<span>${escapeHtml(category.icon)} ${escapeHtml(category.label)}</span>`).join('');
  return `<section class="tool-view rainy-view">
    <p class="eyebrow">RAINY DAY PAW PLAN</p><h1>下雨也有地方玩</h1>
    <p class="lede">依當天所在區域挑最近的備案；「部分遮雨」遇強風豪雨時仍優先換成全室內場館。</p>
    <div class="rainy-category-nav" aria-label="雨天備案分類">${categoryNav}</div>
    ${groups}
    <aside class="rainy-source-note"><strong>資料怎麼整理？</strong><p>${escapeHtml(trip.rainyDaySource.note)} 各場館狀態查核於 2026-08-30，出發前仍請複核。</p><a href="${escapeHtml(trip.rainyDaySource.url)}" target="_blank" rel="noopener noreferrer">查看原始分享</a></aside>
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
  const medical = trip.medicalSupport;
  const roadsideSources = roadside.sourceIds
    .map((id) => trip.sources.find((item) => item.id === id))
    .filter(Boolean);
  const emergencyCards = trip.emergency.map((item) => `
    <a class="emergency-card" href="tel:${escapeHtml(item.phone)}">
      <span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.phone)}</strong>${item.hours ? `<b>${escapeHtml(item.hours)}</b>` : ''}<small>${escapeHtml(item.note)}</small>
    </a>`).join('');
  const checklist = roadside.beforeCalling.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

  return `<section class="tool-view emergency-view">
    <p class="eyebrow">KEEP CALM</p><h1>緊急聯絡</h1>
    <p class="lede">發生事故不分大小先報警；有傷病或火災再叫救護／消防。</p>
    <div class="emergency-grid">${emergencyCards}</div>
    <article class="medical-support-card">
      <div class="medical-heading"><span aria-hidden="true">🩺</span><div><small>不是 24 小時急診 · 查核 ${escapeHtml(medical.checkedAt)}</small><h2>${escapeHtml(medical.provider)}</h2><strong>${escapeHtml(medical.role)} · ${escapeHtml(medical.hours)}</strong></div></div>
      <p class="medical-emergency"><strong>危急先撥 119：</strong>${escapeHtml(medical.emergencyRule)}</p>
      <div class="medical-facts"><section><span>這趟行程適用</span><strong>${escapeHtml(medical.preTripPlan)}</strong><p>${escapeHtml(medical.groupRule)}</p></section><section><span>沖繩領藥</span><strong>以調劑藥局領取為主</strong><p>${escapeHtml(medical.okinawaMedicine)}</p></section></div>
      <p class="medical-child">👧 ${escapeHtml(medical.childrenNote)}</p>
      <p class="medical-warning">⚠ ${escapeHtml(medical.priceWarning)}</p>
      <div class="medical-actions"><a href="${escapeHtml(medical.planUrl)}" target="_blank" rel="noopener noreferrer">出發前方案與官方 LINE</a><a href="${escapeHtml(medical.bookingUrl)}" target="_blank" rel="noopener noreferrer">已在日本直接預約</a></div>
    </article>
    <article class="ots-support-card">
      <span class="card-number">OTS ACCIDENT &amp; BREAKDOWN</span><h2>${escapeHtml(roadside.provider)}事故／故障窗口</h2>
      <a class="ots-phone" href="tel:${escapeHtml(roadside.dayPhone)}"><span>${escapeHtml(roadside.dayHours)}</span><strong>${escapeHtml(roadside.dayPhone)}</strong><small>OTS 租車預約中心</small></a>
      <div class="ots-support-grid"><section><h3>打電話前準備</h3><ul>${checklist}</ul></section><section><h3>夜間 ${escapeHtml(roadside.afterHours)}</h3><p>${escapeHtml(roadside.afterHoursNote)}</p></section></div>
      <div class="official-links">${roadsideSources.map((source) => `<a class="official-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a>`).join('')}</div>
    </article>
    <article class="accident-steps"><span>🚙 發生車禍</span><p>先確保人員安全；事故不分大小先撥 110，傷病或火災再撥 119；接著聯絡 OTS；不要私下和解。</p></article>
  </section>`;
}
