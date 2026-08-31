import { getVariantDay, mapUrl, nextFixedEvent } from './src/trip-domain.mjs?v=15';
import { centeredScrollLeft, renderDay, renderEmergencyView, renderFlightSummary, renderRainyDayView, renderSources, renderVariantTabs, escapeHtml } from './src/render.mjs?v=15';
import { createEmptyState, exportBackup, importBackup, loadState, saveState } from './src/storage.mjs?v=15';
import { installPwaUpdate } from './src/pwa-update.mjs?v=15';

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
    <div class="hero-copy"><p class="eyebrow">OKINAWA · PAW PAW ROAD BOOK</p><h1>踩著小腳印，<br><em>去沖繩玩。</em></h1><p class="hero-note">汪汪與喵喵，陪你挑一個今天剛剛好的速度。</p></div>
    <div class="pet-pals" aria-hidden="true">
      <svg class="pet-face pet-face--dog" viewBox="0 0 120 112">
        <path class="pet-ear" d="M27 39C5 24 4 58 16 75c7 9 19 2 22-9zM93 39c22-15 23 19 11 36-7 9-19 2-22-9z"/>
        <path class="pet-head" d="M24 55C24 22 42 10 60 10s36 12 36 45v18c0 24-16 35-36 35S24 97 24 73z"/>
        <circle class="pet-eye" cx="46" cy="58" r="4"/><circle class="pet-eye" cx="74" cy="58" r="4"/>
        <ellipse class="pet-muzzle" cx="60" cy="75" rx="20" ry="16"/><path class="pet-nose" d="M54 70q6-6 12 0-1 8-6 8t-6-8"/>
      </svg>
      <svg class="pet-face pet-face--cat" viewBox="0 0 120 112">
        <path class="pet-head" d="M22 41 27 9l25 17q8-3 16 0L93 9l5 32v34c0 23-16 33-38 33S22 98 22 75z"/>
        <path class="pet-ear-inner" d="m30 20 5 18 12-8zM90 20l-5 18-12-8z"/>
        <path class="pet-eye-line" d="M40 58q7 7 14 0M66 58q7 7 14 0"/>
        <path class="pet-nose" d="M55 68q5-5 10 0-1 7-5 7t-5-7"/>
        <path class="pet-whisker" d="M48 75 24 70m24 12-25 5m49-12 24-5M72 82l25 5"/>
      </svg>
      <span>汪喵帶路中</span>
    </div>
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
  queueMicrotask(() => {
    const current = document.querySelector('[aria-current="date"]');
    const strip = current?.closest('.date-strip');
    if (!strip) return;
    const stripBounds = strip.getBoundingClientRect();
    const currentBounds = current.getBoundingClientRect();
    strip.scrollTo({
      left: centeredScrollLeft(
        strip.clientWidth,
        strip.scrollWidth,
        strip.scrollLeft,
        stripBounds.left,
        currentBounds.left,
        currentBounds.width,
      ),
      behavior: 'instant',
    });
  });
}

function renderLogistics() {
  const events = [...trip.fixedEvents].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const stays = trip.stays.map((stay) => `<article class="tool-card"><span class="card-number">STAY</span><h3>${escapeHtml(stay.name)}</h3><p>${escapeHtml(stay.from)} — ${escapeHtml(stay.to)}</p>${stay.privateNavigation ? '<small>地址與入住資料留在私人訂房訊息，不公開在此網站。</small>' : `<a href="${mapUrl(stay.mapQuery)}" target="_blank" rel="noopener noreferrer">開啟導航</a>`}</article>`).join('');
  app.innerHTML = `<section class="tool-view"><p class="eyebrow">FIXED LOGISTICS</p><h1>固定行程與住宿</h1><p class="lede">這些是不能移動的時間；其餘景點都應讓位給它們。</p>${renderFlightSummary(trip)}<div class="tool-grid">${stays}</div><ol class="fixed-list">${events.map((event) => `<li><time>${dateLabel(event.date)}<strong>${event.time}${event.end ? `–${event.end}` : ''}</strong></time><div><h3>${escapeHtml(event.title)}</h3><p>${escapeHtml(event.place)}</p>${event.note ? `<small>${escapeHtml(event.note)}</small>` : ''}</div></li>`).join('')}</ol></section>`;
}

function renderRecords() {
  const variant = state.variants[state.selectedVariant];
  const completed = Object.values(variant.completed).filter(Boolean).length;
  const noted = Object.values(variant.notes).filter(Boolean).length;
  app.innerHTML = `<section class="tool-view"><p class="eyebrow">YOUR FIELD NOTES</p><h1>記錄與備份</h1><p class="lede">記錄只保存在這台裝置的瀏覽器；換手機前請先匯出。</p><div class="record-summary"><div><strong>${completed}</strong><span>完成行程</span></div><div><strong>${noted}</strong><span>天有筆記</span></div><div><strong>${state.selectedVariant}</strong><span>目前版本</span></div></div><div class="action-stack"><button type="button" data-action="export-backup">下載 JSON 備份</button><label class="file-button">從備份還原<input type="file" accept="application/json" data-action="import-backup"></label><button type="button" class="danger-button" data-action="clear-records">清除本機記錄</button></div><section class="pdf-box"><p class="eyebrow">PRINT EDITIONS</p><h2>A・B・C 三版 PDF</h2><div class="pdf-links"><a href="./output/pdf/okinawa-family-trip-A-balanced.pdf?v=15" download>A 親子平衡</a><a href="./output/pdf/okinawa-family-trip-B-active.pdf?v=15" download>B 景點豐富</a><a href="./output/pdf/okinawa-family-trip-C-relaxed.pdf?v=15" download>C 度假放鬆</a></div></section></section>`;
}

function renderRoute() {
  const route = routeName();
  document.querySelectorAll('.bottom-nav a').forEach((link) => link.classList.toggle('is-active', link.dataset.route === route || (route === 'rainy' && link.dataset.route === 'sources') || (route === 'home' && link.dataset.route === 'home')));
  if (route === 'logistics') renderLogistics();
  else if (route === 'emergency') app.innerHTML = renderEmergencyView(trip);
  else if (route === 'records') renderRecords();
  else if (route === 'rainy') app.innerHTML = renderRainyDayView(trip);
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
    const response = await fetch('./content/trip.json?v=15');
    if (!response.ok) throw new Error('行程資料載入失敗');
    trip = await response.json();
    renderRoute();
    window.addEventListener('hashchange', renderRoute);
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();
    if ('serviceWorker' in navigator) {
      installPwaUpdate(navigator.serviceWorker, () => location.reload()).catch(() => {});
    }
  } catch (error) {
    app.innerHTML = `<section class="error-card"><h1>暫時打不開行程</h1><p>${escapeHtml(error.message)}</p><button onclick="location.reload()">再試一次</button></section>`;
  }
}

boot();
