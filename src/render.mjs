import { getPartyForDate, getStayForDate, mapUrl } from './trip-domain.mjs';

const TYPE_ICONS = {
  activity: '🎟', car: '🚙', culture: '⛩', drive: '🛣', flight: '✈️',
  meal: '🍽', play: '🫧', rest: '🌿', shopping: '🛍', stay: '🏨',
  view: '🌊', walk: '👟', cafe: '☕',
};

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

function renderEvent(trip, event, completed) {
  const maps = mapUrl(event.mapQuery);
  const isDone = completed[event.id] === true;
  return `
    <li class="event-card${isDone ? ' is-complete' : ''}" data-event-id="${escapeHtml(event.id)}">
      <span class="route-dot" aria-hidden="true"></span>
      <label class="event-check">
        <input type="checkbox" data-action="toggle-event" data-event-id="${escapeHtml(event.id)}"${isDone ? ' checked' : ''}>
        <span class="sr-only">完成 ${escapeHtml(event.title)}</span>
      </label>
      <time>${escapeHtml(event.time)}</time>
      <div class="event-body">
        <span class="event-kind">${TYPE_ICONS[event.type] ?? '•'} ${escapeHtml(event.type)}</span>
        <h3>${escapeHtml(event.title)}</h3>
        <p class="event-place">${escapeHtml(event.place)}</p>
        ${event.note ? `<p class="event-note">${escapeHtml(event.note)}</p>` : ''}
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
      <span class="variant-letter">${id}</span>
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
