import { getVariantDay, mapUrl, nextFixedEvent } from './src/trip-domain.mjs';
import { renderDay, renderSources, renderVariantTabs, escapeHtml } from './src/render.mjs';
import { createEmptyState, exportBackup, importBackup, loadState, saveState } from './src/storage.mjs';

const app = document.querySelector('#app');
const quickPanel = document.querySelector('#quick-panel-content');
const networkStatus = document.querySelector('#network-status');
let trip;
let state = loadState(localStorage);

const dateLabel = (date) => new Intl.DateTimeFormat('zh-TW', {
  month: 'numeric', day: 'numeric', weekday: 'short', timeZone: 'Asia/Tokyo',
}).format(new Date(`${date}T12:00:00+09:00`));

function persist() {
  saveState(localStorage, state);
}

function routeName() {
  return location.hash.replace(/^#\/?/, '').split('/')[0] || 'home';
}

function renderHero() {
  return `<section class="trip-hero">
    <div><p class="eyebrow">OKINAWA · FAMILY ROAD BOOK</p><h1>海島自駕，<br><em>孩子的速度。</em></h1></div>
    <div class="hero-facts"><span><strong>9/24</strong>抵達</span><span><strong>9/30</strong>六人會合</span><span><strong>10/4</strong>旅程結束</span></div>
  </section>`;
}

function renderDateStrip(days) {
  return `<nav class="date-strip" aria-label="選擇日期">${days.map((day, index) => `
    <button type="button" data-date="${day.date}" aria-current="${day.date === state.selectedDate ? 'date' : 'false'}">
      <small>DAY ${String(index + 1).padStart(2, '0')}</small><strong>${dateLabel(day.date)}</strong>
    </button>`).join('')}</nav>`;
}

function renderHome() {
  const days = trip.days[state.selectedVariant];
  if (!days.some((day) => day.date === state.selectedDate)) state.selectedDate = days[0].date;
  const day = getVariantDay(trip, state.selectedVariant, state.selectedDate);
  app.innerHTML = `${renderHero()}${renderVariantTabs(trip, state.selectedVariant)}${renderDateStrip(days)}${renderDay(trip, day, state.variants[state.selectedVariant])}`;
  queueMicrotask(() => document.querySelector('[aria-current="date"]')?.scrollIntoView({ inline: 'center', block: 'nearest' }));
}

function renderLogistics() {
  const events = [...trip.fixedEvents].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const stays = trip.stays.map((stay) => `<article class="tool-card"><span class="card-number">STAY</span><h3>${escapeHtml(stay.name)}</h3><p>${escapeHtml(stay.from)} — ${escapeHtml(stay.to)}</p>${stay.privateNavigation ? '<small>地址與入住資料留在私人訂房訊息，不公開在此網站。</small>' : `<a href="${mapUrl(stay.mapQuery)}" target="_blank" rel="noopener noreferrer">開啟導航</a>`}</article>`).join('');
  app.innerHTML = `<section class="tool-view"><p class="eyebrow">FIXED LOGISTICS</p><h1>班機、換車與住宿</h1><p class="lede">這些是不能移動的時間；其餘景點都應讓位給它們。</p><div class="tool-grid">${stays}</div><ol class="fixed-list">${events.map((event) => `<li><time>${dateLabel(event.date)}<strong>${event.time}${event.end ? `–${event.end}` : ''}</strong></time><div><h3>${escapeHtml(event.title)}</h3><p>${escapeHtml(event.place)}</p>${event.note ? `<small>${escapeHtml(event.note)}</small>` : ''}</div></li>`).join('')}</ol></section>`;
}

function renderEmergency() {
  app.innerHTML = `<section class="tool-view emergency-view"><p class="eyebrow">KEEP CALM</p><h1>緊急聯絡</h1><p class="lede">日本電話號碼。危及生命時直接請附近人員協助撥打。</p><div class="emergency-grid">${trip.emergency.map((item) => `<a class="emergency-card" href="tel:${escapeHtml(item.phone)}"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.phone)}</strong><small>${escapeHtml(item.note)}</small></a>`).join('')}</div><article class="rain-card"><span>🚙 發生車禍</span><p>先確保人員安全，必要時撥 110／119；不要自行和解，並聯絡 OTS 與保險窗口。</p></article></section>`;
}

function renderRecords() {
  const variant = state.variants[state.selectedVariant];
  const completed = Object.values(variant.completed).filter(Boolean).length;
  const noted = Object.values(variant.notes).filter(Boolean).length;
  app.innerHTML = `<section class="tool-view"><p class="eyebrow">YOUR FIELD NOTES</p><h1>記錄與備份</h1><p class="lede">記錄只保存在這台裝置的瀏覽器；換手機前請先匯出。</p><div class="record-summary"><div><strong>${completed}</strong><span>完成行程</span></div><div><strong>${noted}</strong><span>天有筆記</span></div><div><strong>${state.selectedVariant}</strong><span>目前版本</span></div></div><div class="action-stack"><button type="button" data-action="export-backup">下載 JSON 備份</button><label class="file-button">從備份還原<input type="file" accept="application/json" data-action="import-backup"></label><button type="button" class="danger-button" data-action="clear-records">清除本機記錄</button></div><section class="pdf-box"><p class="eyebrow">PRINT EDITIONS</p><h2>A・B・C 三版 PDF</h2><div class="pdf-links"><a href="./output/pdf/okinawa-family-trip-A-balanced.pdf" download>A 親子平衡</a><a href="./output/pdf/okinawa-family-trip-B-active.pdf" download>B 景點豐富</a><a href="./output/pdf/okinawa-family-trip-C-relaxed.pdf" download>C 度假放鬆</a></div></section></section>`;
}

function renderRoute() {
  const route = routeName();
  document.querySelectorAll('.bottom-nav a').forEach((link) => link.classList.toggle('is-active', link.dataset.route === route || (route === 'home' && link.dataset.route === 'home')));
  if (route === 'logistics') renderLogistics();
  else if (route === 'emergency') renderEmergency();
  else if (route === 'records') renderRecords();
  else if (route === 'sources') app.innerHTML = renderSources(trip);
  else renderHome();
  renderQuickPanel();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderQuickPanel() {
  const now = new Date();
  const tokyo = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo', dateStyle: 'short', timeStyle: 'short', hour12: false }).format(now);
  const [date, time] = tokyo.split(' ');
  const next = nextFixedEvent(trip, date, time) ?? trip.fixedEvents[0];
  quickPanel.innerHTML = `<article><span>下一個固定行程</span><strong>${dateLabel(next.date)} · ${next.time}</strong><h3>${escapeHtml(next.title)}</h3><p>${escapeHtml(next.place)}</p></article><article><span>公開版提醒</span><p>私人住宿的地址與入住資料請從訂房訊息開啟。</p></article>`;
}

app.addEventListener('click', (event) => {
  const variant = event.target.closest('[data-variant]');
  if (variant) {
    state.selectedVariant = variant.dataset.variant;
    persist(); renderHome(); return;
  }
  const date = event.target.closest('button[data-date]');
  if (date) {
    state.selectedDate = date.dataset.date;
    persist(); renderHome(); return;
  }
  const action = event.target.closest('[data-action]');
  if (!action) return;
  const variantState = state.variants[state.selectedVariant];
  if (action.dataset.action === 'set-energy') {
    variantState.energy[state.selectedDate] = action.dataset.energy;
    persist(); renderHome();
  } else if (action.dataset.action === 'export-backup') {
    const blob = new Blob([exportBackup(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = Object.assign(document.createElement('a'), { href: url, download: 'okinawa-trip-backup.json' });
    anchor.click(); URL.revokeObjectURL(url);
  } else if (action.dataset.action === 'clear-records' && confirm('確定清除這台裝置上的行程勾選與筆記？')) {
    state = createEmptyState(); persist(); renderRecords();
  }
});

app.addEventListener('change', async (event) => {
  const action = event.target.dataset.action;
  const variantState = state.variants[state.selectedVariant];
  if (action === 'toggle-event') {
    variantState.completed[event.target.dataset.eventId] = event.target.checked;
    persist(); event.target.closest('.event-card')?.classList.toggle('is-complete', event.target.checked);
  } else if (action === 'import-backup' && event.target.files?.[0]) {
    try {
      state = importBackup(await event.target.files[0].text()); persist(); alert('備份已還原。'); renderRecords();
    } catch (error) { alert(error.message); }
  }
});

app.addEventListener('input', (event) => {
  if (event.target.dataset.action === 'day-note') {
    state.variants[state.selectedVariant].notes[state.selectedDate] = event.target.value;
    persist();
  }
});

function updateNetworkStatus() {
  networkStatus.textContent = navigator.onLine ? '● ONLINE' : '● OFFLINE 可用';
  networkStatus.classList.toggle('is-offline', !navigator.onLine);
}

async function boot() {
  try {
    const response = await fetch('./content/trip.json');
    if (!response.ok) throw new Error('行程資料載入失敗');
    trip = await response.json();
    renderRoute();
    window.addEventListener('hashchange', renderRoute);
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
  } catch (error) {
    app.innerHTML = `<section class="error-card"><h1>暫時打不開行程</h1><p>${escapeHtml(error.message)}</p><button onclick="location.reload()">再試一次</button></section>`;
  }
}

boot();
