import { dayRoutePlan, getPartyForDate, getStayForDate, mapUrl } from './trip-domain.mjs?v=24';

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

function renderShoppingGuide(trip, event) {
  const guide = event.shoppingGuideId ? trip.shoppingGuides?.[event.shoppingGuideId] : null;
  if (!guide) return '';
  const shops = guide.shops.map((shop, index) => {
    const source = trip.sources.find((item) => item.id === shop.sourceId);
    const paymentLabel = shop.paymentStatus === 'cards-confirmed'
      ? '可刷卡'
      : shop.paymentStatus === 'cash-only' ? 'Cash only' : '付款未確認・備現金';
    return `<article class="shopping-option">
      <span class="shopping-order">${index + 1}</span>
      <div class="shopping-copy"><h4>${escapeHtml(shop.name)}</h4><p>${escapeHtml(shop.category)}</p><small>${escapeHtml(shop.hours)}</small></div>
      <span class="payment-badge payment-badge--${escapeHtml(shop.paymentStatus)}">${escapeHtml(paymentLabel)}</span>
      <p class="payment-note">${escapeHtml(shop.paymentNote)}</p>
      <div class="shopping-actions"><a href="${escapeHtml(mapUrl(shop.mapQuery))}" target="_blank" rel="noopener noreferrer">直接導航</a>${source ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">官方資料</a>` : ''}</div>
    </article>`;
  }).join('');
  return `<aside class="shopping-guide" aria-label="${escapeHtml(guide.title)}">
    <div class="shopping-heading"><span aria-hidden="true">🐾</span><div><small>順路逛店 · 查核 ${escapeHtml(guide.checkedAt)}</small><strong>${escapeHtml(guide.title)}</strong></div></div>
    <p class="shopping-route">${escapeHtml(guide.routeNote)}</p>
    <div class="shopping-options">${shops}</div>
    <p class="shopping-payment-summary"><strong>付款提醒：</strong>${escapeHtml(guide.paymentSummary)}</p>
  </aside>`;
}

function renderRainPicker(trip, event, rainSelections = {}) {
  const options = (event.rainBackupIds ?? [])
    .map((id) => trip.rainyDayOptions.find((option) => option.id === id))
    .filter(Boolean);
  if (!options.length) return '';

  const selectedId = rainSelections[event.id];
  const selected = options.find((option) => option.id === selectedId);
  const selection = selected ? `<aside class="event-rain-selection" aria-live="polite">
    <span>☔ 已選雨備</span><strong>${escapeHtml(selected.name)}</strong>
    <small>${escapeHtml(selected.area)} · ${escapeHtml(selected.weatherFit)} · ${escapeHtml(selected.duration)}</small>
    <div><a href="${escapeHtml(mapUrl(selected.mapQuery))}" target="_blank" rel="noopener noreferrer">📍 直接導航</a><button type="button" data-action="clear-rain-backup" data-event-id="${escapeHtml(event.id)}">恢復原行程</button></div>
  </aside>` : '';
  const choices = options.map((option) => `<button type="button" data-action="select-rain-backup" data-event-id="${escapeHtml(event.id)}" data-rain-option-id="${escapeHtml(option.id)}" aria-pressed="${option.id === selectedId}">
    <span>${escapeHtml(option.area)} · ${escapeHtml(option.duration)}</span><strong>${escapeHtml(option.name)}</strong><small>${escapeHtml(option.weatherFit)}</small>
  </button>`).join('');

  return `${selection}<details class="event-rain-picker"${selected ? ' open' : ''}>
    <summary>☔ 這時段下雨 <small>附近 ${options.length} 個選擇</small></summary>
    <div class="event-rain-options">${choices}</div>
  </details>`;
}

function renderEvent(trip, event, completed, rainSelections) {
  const maps = event.navigationUrl || mapUrl(event.mapQuery);
  const isDone = completed[event.id] === true;
  const hasRainSelection = Boolean(rainSelections?.[event.id]);
  return `
    <li class="event-card${isDone ? ' is-complete' : ''}${hasRainSelection ? ' has-rain-selection' : ''}" data-event-id="${escapeHtml(event.id)}">
      <span class="route-dot" aria-hidden="true"><span class="paw-print" aria-hidden="true"></span></span>
      <label class="event-check">
        <input type="checkbox" data-action="toggle-event" data-event-id="${escapeHtml(event.id)}"${isDone ? ' checked' : ''}>
        <span class="check-paw" aria-hidden="true"><img class="dog-paw-stamp" src="./icons/dog-paw-stamp.svg?v=24" alt=""></span>
        <span class="sr-only">完成 ${escapeHtml(event.title)}</span>
      </label>
      <time>${escapeHtml(event.time)}</time>
      <div class="event-body">
        <span class="event-kind">${TYPE_ICONS[event.type] ?? '•'} ${escapeHtml(event.type)}</span>
        <h3>${escapeHtml(event.title)}</h3>
        <p class="event-place">${escapeHtml(event.place)}</p>
        ${event.note ? `<p class="event-note">${escapeHtml(event.note)}</p>` : ''}
        ${renderRainPicker(trip, event, rainSelections)}
        ${renderDiningGuide(trip, event)}
        ${renderShoppingGuide(trip, event)}
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

export function renderStayAction(stay, navigationLabel = '導航') {
  if (!stay) return '';
  if (stay.privateNavigation) {
    const listing = stay.listingUrl
      ? `<a class="stay-listing-link" href="${escapeHtml(stay.listingUrl)}" target="_blank" rel="noopener noreferrer">🏠 開啟 Airbnb 房源</a>`
      : '';
    return `<small>精確地址、入住與門鎖資料仍使用私人訂房訊息。</small>${listing}`;
  }
  const navigationUrl = mapUrl(stay.mapQuery);
  return navigationUrl
    ? `<a href="${escapeHtml(navigationUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(navigationLabel)}</a>`
    : '';
}

export function renderDay(trip, day, variantState) {
  const party = getPartyForDate(trip, day.date);
  const stay = getStayForDate(trip, day.date);
  const note = variantState.notes?.[day.date] ?? '';
  const energy = variantState.energy?.[day.date] ?? 'okay';
  const rainPlan = trip.rainPlans?.find((item) => item.date === day.date);
  const isRainMode = variantState.rainMode?.[day.date] === true && Boolean(rainPlan);
  const activeDay = isRainMode ? rainPlan : day;
  const events = activeDay.events.map((event) => renderEvent(trip, event, variantState.completed ?? {}, variantState.rainSelections ?? {})).join('');
  const routePlan = dayRoutePlan(trip, activeDay);
  const routeSegments = routePlan.segments;
  const routeActions = routeSegments.map((segment, index) => {
    const start = index * 4 + 1;
    const end = start + segment.stops.length - 1;
    const label = routeSegments.length === 1 ? '開啟完整路線' : `開啟第 ${index + 1} 段`;
    return `<a href="${escapeHtml(segment.url)}" target="_blank" rel="noopener noreferrer">🗺 ${label}<small>第 ${start} → ${end} 站</small></a>`;
  }).join('');
  const routeStops = routePlan.points.map((point, index) => `<li><span>${index + 1}</span>${escapeHtml(point.label)}</li>`).join('');

  return `
    <article class="day-view" data-date="${day.date}">
      <header class="day-heading">
        <div><span class="day-kicker">${shortDate(day.date)} · ${escapeHtml(activeDay.area)}</span><h2>${escapeHtml(activeDay.title)}</h2></div>
        <span class="party-pill">${party ? `${party.adults}大 ${party.children}小` : '旅程日'}</span>
      </header>
      <section class="rain-mode-switch${isRainMode ? ' is-active' : ''}" aria-label="整日雨天行程切換">
        <div><span>${isRainMode ? '☔ 正在使用整日雨天版' : '🌤 目前使用原定行程'}</span><small>${isRainMode ? '固定班機、租車與預約活動仍保留' : '下整天雨時，可一次換成順路室內行程'}</small></div>
        <button type="button" data-action="toggle-rain-day" data-rain-date="${escapeHtml(day.date)}" aria-pressed="${isRainMode}"${rainPlan ? '' : ' disabled'}>${isRainMode ? '恢復原行程' : '切換整日雨天版'}</button>
      </section>
      <div class="context-grid">
        <section><span>今晚住</span><strong>${escapeHtml(activeDay.stay)}</strong>${renderStayAction(stay)}</section>
        <section><span>今日車程</span><strong>${escapeHtml(activeDay.drive)}</strong></section>
      </div>
      ${routeActions ? `<section class="day-route-card" aria-label="今日 Google Maps 多站導航"><div><span>GOOGLE MAPS ROUTE</span><strong>完整順序 · ${routePlan.points.length} 個停靠點</strong><small>手機版有途經點上限，請照段數依序開啟；每段會重疊上一段終點。</small></div><ol class="day-route-stops">${routeStops}</ol><div class="day-route-actions">${routeActions}</div></section>` : ''}
      <ol class="event-list">${events}</ol>
      <section class="rain-card"><span>${isRainMode ? '☔ 今日雨天路線' : '☔ 雨天／疲累備案'}</span><p>${escapeHtml(activeDay.rainPlan)}</p><a href="#/rainy">查看 24 個雨天備案 →</a></section>
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

function yen(value) {
  return `¥${new Intl.NumberFormat('en-US').format(value)}`;
}

export function renderTicketPassGuide(trip, selectedVariant) {
  const guide = trip.ticketPassGuide;
  if (!guide) return '';
  const threePass = guide.options.find((option) => option.id === 'three-pass');
  const fivePass = guide.options.find((option) => option.id === 'five-pass');
  const cards = Object.entries(guide.recommendationByVariant).map(([variantId, recommendation]) => {
    const variant = trip.variants[variantId];
    const selected = variantId === selectedVariant;
    const isPass = recommendation.decision === 'buy-three-pass';
    const totalSaving = recommendation.savingPerAdultYen * recommendation.quantity;
    const activation = recommendation.activationDate
      ? `${Number(recommendation.activationDate.slice(5, 7))}/${Number(recommendation.activationDate.slice(8, 10))} 啟用`
      : '不用啟用套票';
    return `<article data-pass-variant="${escapeHtml(variantId)}" class="pass-option-card${selected ? ' is-selected' : ''}">
      <header><span class="pass-variant">${escapeHtml(variantId)}</span><div><small>${escapeHtml(variant.name)}</small><h3>${escapeHtml(recommendation.headline)}</h3></div>${selected ? '<b>目前行程</b>' : ''}</header>
      <p class="pass-party">${escapeHtml(recommendation.party)}${isPass ? ` · ${escapeHtml(recommendation.quantity)} 張` : ''}</p>
      <div class="pass-saving">
        <span>${isPass ? escapeHtml(activation) : '照既定行程單買'}</span>
        <strong>${isPass ? `每位大人省 ${yen(recommendation.savingPerAdultYen)}` : `單買比三合一少 ${yen(threePass.adultPriceYen - recommendation.individualTotalYen)}`}</strong>
        <small>${isPass ? `兩位共省 ${yen(totalSaving)}` : `單買 ${yen(recommendation.individualTotalYen)}／三合一 ${yen(threePass.adultPriceYen)}`}</small>
      </div>
      <ol class="pass-use-list">${recommendation.uses.map((item) => `<li><span>${escapeHtml(item.date)}</span><strong>${escapeHtml(item.name)}</strong><small>${yen(item.priceYen)}</small></li>`).join('')}</ol>
      <p class="pass-note">${escapeHtml(recommendation.note)}</p>
    </article>`;
  }).join('');
  const advice = guide.familyAdvice.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const rules = guide.rules.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

  return `<section class="pass-guide" aria-labelledby="ticket-pass-title">
    <div class="pass-guide-heading"><div><p class="eyebrow">TICKET PAW CHECK · 查核 ${escapeHtml(guide.checkedAt)}</p><h2 id="ticket-pass-title">套票怎麼買最省</h2></div><span class="pass-paw" aria-hidden="true"><span class="paw-print"></span></span></div>
    <p class="pass-guide-lede">目前行程版本會亮起；要換版本可回「行程」切換 A／B／C。只在真的比單買便宜時才建議買。</p>
    <div class="pass-options">${cards}</div>
    <article class="pass-family-card"><h3>這團誰要買？</h3><ul>${advice}</ul></article>
    <details class="pass-rules"><summary>五合一為什麼不推薦？</summary><p>${escapeHtml(guide.whyNotFivePass)}</p><div class="pass-price-grid"><span><strong>${escapeHtml(threePass.name)}</strong>${yen(threePass.adultPriceYen)}／成人<small>${escapeHtml(threePass.summary)}</small></span><span><strong>${escapeHtml(fivePass.name)}</strong>${yen(fivePass.adultPriceYen)}／成人<small>${escapeHtml(fivePass.summary)}</small></span></div><ul>${rules}</ul></details>
    <div class="pass-actions"><a class="pass-buy" href="${escapeHtml(guide.purchaseUrl)}" target="_blank" rel="noopener noreferrer">到 Klook 看套票</a><a href="${escapeHtml(guide.officialUrl)}" target="_blank" rel="noopener noreferrer">查看 JTB 2026 官方規則</a></div>
  </section>`;
}

export function renderFlightSummary(trip) {
  const flights = trip.flights.map((flight) => {
    const flightLabel = [flight.airline, flight.flightNumber].filter(Boolean).join(' ') || '班號未提供';
    const arrival = flight.arrival || '抵達時間未提供';
    const [origin = '出發', arrivalPoint = '抵達'] = flight.route?.split('→').map((part) => part.trim()) ?? [];
    const [destination = '抵達', ...terminalParts] = arrivalPoint.split(/\s+/);
    const terminal = terminalParts.join(' ');
    const routeLabel = flight.route || '航線未提供';
    return `
    <article class="flight-card">
      <header class="flight-ticket-header">
        <span><b>BOARDING PASS</b><small>${shortDate(flight.date)}</small></span>
        <strong>${escapeHtml(flight.party)}</strong>
      </header>
      <div class="flight-ticket-perforation" aria-hidden="true"></div>
      <h3>${escapeHtml(flightLabel)}</h3>
      <div class="flight-ticket-route" aria-label="${escapeHtml(origin)} 到 ${escapeHtml(arrivalPoint)}">
        <span class="flight-endpoint"><small>出發</small><b>${escapeHtml(origin)}</b><time>${escapeHtml(flight.departure)}</time></span>
        <span class="flight-route-arrow" aria-hidden="true">→</span>
        <span class="flight-endpoint flight-endpoint--arrival"><small>抵達</small><b>${escapeHtml(destination)}</b><time>${escapeHtml(arrival)}</time>${terminal ? `<em>${escapeHtml(terminal)}</em>` : ''}</span>
      </div>
      <p class="flight-route-copy">${escapeHtml(routeLabel)}</p>
    </article>`;
  }).join('');
  return `<section class="flight-summary" aria-labelledby="flight-summary-title"><p class="eyebrow">BOARDING PASSES</p><h2 id="flight-summary-title">班機時間</h2><p>兩組旅伴分批往返；未提供的航線不推測。</p><div class="flight-grid">${flights}</div></section>`;
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
