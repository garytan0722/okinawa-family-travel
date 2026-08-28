# 2026 沖繩親子自駕旅行手帳

## Outcome

Build a static, offline-first GitHub Pages PWA at
`https://garytan0722.github.io/okinawa-family-travel/` for the confirmed
2026/09/24–10/04 trip. It carries three complete pacing variants:

- A: 親子平衡
- B: 景點豐富
- C: 度假放鬆

The experience is inspired by the information architecture of the Tabichō
Tokyo travel site, but is independently implemented and deliberately excludes
Tokyo-only modules such as the 3D globe, fandom, reels, coupons, and cashback.

## Fixed logistics

- 09/24 08:00–10:45: the Tan family of four flies to Okinawa on China Airlines CI120.
- 09/24 12:00: first car pickup at OTS 臨空豐崎營業所.
- 09/24–09/30: two adults and two children stay at Okinawa Kariyushi Beach
  Resort Ocean Spa.
- 09/30 06:50–09:20: Zeng-Luo-Jia, two adults, arrive on Tigerair IT230, TPE → OKA.
- 09/30 11:30: second car pickup at OTS 臨空豐崎營業所.
- 09/30 12:00: first car return at the same branch.
- 09/30–10/04: the Tan family and Zeng-Luo-Jia, four adults and two children in total, stay at private accommodation in Naha.
- 10/03: all six travelers remain together; there is no flight or airport split.
- 10/04 12:30: second car return at OTS 臨空豐崎營業所.
- 10/04 15:50: the Tan family of four takes STARLUX JX871, OKA → TPE T2; arrival time was not provided.
- Zeng-Luo-Jia's transport after the 10/04 car return was not provided and is not inferred.

The deployed repository must never include the source PDF's private check-in
URL, check-in code, PIN, or user-entered travel notes.

## Product structure

- Mobile home: trip card, A/B/C switcher, offline status, and next fixed event.
- Day view: day navigation, party/hotel/car context, time-ordered event cards,
  child notes, parking/reservation flags, rain plan, and Google Maps links.
- Records: completion state, daily note, and child energy stored only in localStorage.
- Tools: JSON backup/import, emergency contacts, official-source ledger, and
  three downloadable PDFs.
- PWA: relative URLs, hash navigation, manifest, service worker, and a visible
  offline readiness status compatible with the GitHub Pages subpath.

## Visual direction

### Tokens

- Deep channel `#123B4A`: primary text and navigation.
- Kerama blue `#1D91A8`: links, selected controls, and route progress.
- Road orange `#E7773C`: fixed-time and driving warnings.
- Resort ivory `#FFF9EE`: page background.
- Sea foam `#DDF3EE`: supportive cards and offline success.
- Sunset pink `#F4B7A6`: alternative and child-energy accents.

Display text uses a restrained Japanese travel-poster serif stack; body and
utility text use system sans-serif fonts so the PWA has no external font
dependency.

### Signature

Every day card carries a vertical "island road" line whose stops change from
road-orange to Kerama-blue as the family checks them off. This is the one bold
motif; the remaining layout stays calm and operational.

## Privacy and reliability

- All record data remains device-local and is excluded from PDFs and deployment.
- Exported JSON is generated only on user action.
- Malformed imports never overwrite existing state.
- The service worker caches same-origin shell and content only.
- Official facts show their check date and a 2026/09/17 recheck reminder.

## Acceptance

- All A/B/C variants cover 09/24–10/04 exactly once per date.
- Fixed flights, hotels, party changes, and OTS events match the confirmed data.
- 390px layout has no horizontal overflow and all controls are at least 44px.
- Reload preserves records; export/clear/import restores the right variant only.
- Offline reload shows the itinerary after one online visit.
- Three PDFs render Traditional Chinese without clipping or private credentials.
- GitHub Pages publishes from `main` through Actions.
