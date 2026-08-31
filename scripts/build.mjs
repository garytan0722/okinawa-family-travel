import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';

const required = [
  'index.html', 'recovery.html', 'app.mjs', 'styles.css', 'manifest.json', 'sw.js', 'icons/icon.svg',
  'icons/dog-paw-stamp.svg',
  'content/trip.json', 'src/trip-domain.mjs', 'src/render.mjs', 'src/storage.mjs',
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
if (/"[^"\n]*(?:password|credential|checkinUrl|accessCode|doorCode|accessPin)[^"\n]*"\s*:/i.test(serializedTrip)) {
  throw new Error('Private booking field detected in content/trip.json');
}
for (const id of ['A', 'B', 'C']) {
  if (trip.days[id]?.length !== 11) throw new Error(`Variant ${id} must contain 11 days`);
}

console.log(`Static Pages build verified: ${required.length} assets, 3 variants, no private booking credentials.`);
