import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';

const required = [
  'index.html', 'recovery.html', 'app.mjs', 'styles.css', 'manifest.json', 'sw.js', 'icons/icon.svg',
  'icons/dog-paw-stamp.svg',
  'content/trip.json', 'src/trip-domain.mjs', 'src/render.mjs', 'src/storage.mjs', 'src/private-bookings.mjs',
  'src/pwa-update.mjs', 'src/recovery.mjs', 'src/recovery-page.mjs',
  'output/pdf/okinawa-family-trip-A-balanced.pdf',
  'output/pdf/okinawa-family-trip-B-active.pdf',
  'output/pdf/okinawa-family-trip-C-relaxed.pdf',
];

for (const path of required) await access(new URL(`../${path}`, import.meta.url), constants.R_OK);

const publicFiles = await Promise.all(required.filter((path) => !path.endsWith('.pdf')).map(async (path) => ({
  path,
  text: await readFile(new URL(`../${path}`, import.meta.url), 'utf8'),
})));

const trip = JSON.parse(publicFiles.find((file) => file.path === 'content/trip.json').text);
const serializedTrip = JSON.stringify(trip);
const serializedPublicApp = publicFiles.map((file) => file.text).join('\n');
if (/"[^"\n]*(?:password|credential|checkinUrl|accessCode|doorCode|accessPin)[^"\n]*"\s*:/i.test(serializedTrip)) {
  throw new Error('Private booking field detected in content/trip.json');
}
if (/source_impression_id/i.test(serializedTrip)) {
  throw new Error('Tracking parameter detected in content/trip.json');
}
if (/\bOTS[1-9]\d{6}\b/.test(serializedPublicApp)) {
  throw new Error('Real OTS reservation number detected in public app files');
}
if (/\/otsrentacar\/cn\/(?:reserve\/detail|contact\/1)\/[a-f0-9]{20,}\//i.test(serializedPublicApp)) {
  throw new Error('Private OTS token URL detected in public app files');
}
if (/\b\d{1,4}-\d{1,4},\s+[A-Za-z][^,\n]+,\s+[A-Za-z][^,\n]+,\s+[A-Za-z][^,\n]+,\s+Okinawa Prefecture\s+\d{3}-\d{4}\b/i.test(serializedPublicApp)) {
  throw new Error('Exact private English-format address detected in public app files');
}
for (const stay of trip.stays ?? []) {
  if (!stay.listingUrl) continue;
  const url = new URL(stay.listingUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'www.airbnb.com.tw' || !/^\/rooms\/\d+$/.test(url.pathname) || url.search || url.hash) {
    throw new Error('Accommodation listing URL must be a clean Airbnb Taiwan room URL');
  }
}
for (const id of ['A', 'B', 'C']) {
  if (trip.days[id]?.length !== 11) throw new Error(`Variant ${id} must contain 11 days`);
}

console.log(`Static Pages build verified: ${required.length} assets, 3 variants, no private booking credentials, token URLs, exact private addresses, or tracking parameters.`);
