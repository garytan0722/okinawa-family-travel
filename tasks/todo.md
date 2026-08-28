# Delivery checklist

- [x] Confirm GitHub repository and authentication
- [x] Create isolated implementation branch
- [x] Update design and implementation plan for GitHub Pages
- [x] Add canonical fixed logistics and content tests
- [x] Research and author A/B/C itineraries
- [x] Implement domain and local-record modules with TDD
- [x] Build the responsive PWA
- [x] Add offline support and Pages workflow
- [x] Generate and inspect A/B/C PDFs
- [x] Run final privacy, mobile, offline, and build verification
- [x] Merge, push, enable Pages, and verify deployment

## Privacy remediation

- [x] Audit public assets, PDFs, local Git objects, and remote refs
- [x] Replace the private accommodation name with a generic public label
- [x] Regenerate and inspect all PDFs
- [x] Rewrite and verify clean local and remote Git history

## Review

- Published with GitHub Pages at `https://garytan0722.github.io/okinawa-family-travel/`.
- GitHub Actions completed the test, build, and deployment workflow successfully.
- Verified the live mobile layout, A/B/C plan persistence, offline reload, and service-worker cache.
- Verified all public HTML, JavaScript, CSS, manifest, trip data, and generated PDFs return HTTP 200.
- Scanned the published artifacts for the removed private accommodation name; no matches remain.

## Cute visual redesign

- [x] Add failing tests for the paw-print itinerary and refreshed offline cache
- [x] Implement the cream travel-journal palette, pet guides, paw trail, and cute controls
- [x] Preserve mobile accessibility, local records, privacy, and offline behavior
- [x] Run automated tests and build verification
- [x] Inspect mobile and desktop screenshots and refine visual issues
- [x] Push to `main` and verify the updated GitHub Pages deployment

### Redesign review

- Published the cream travel-journal theme with inline dog and cat guides, paw-print progress, and a matching PWA icon.
- Verified 320px, 390px, and 1440px layouts across all five routes with zero horizontal overflow.
- Verified date centering, 44px touch targets, keyboard focus contrast, local-state restoration, cache v3, and offline reload.
- Independent review found no remaining Critical or Important issues after accessibility and cache-scope fixes.
- Verified the live app shell, data, icon, service worker, and all three PDFs return HTTP 200 with a clean privacy scan.

## Existing-client update recovery

- [x] Confirm the GitHub Pages CDN serves the redesigned release
- [x] Reproduce an old service worker continuing to show the previous UI
- [x] Add failing tests for revisioned assets, network-first navigation, and client takeover
- [x] Implement the durable v4 update protocol
- [x] Verify a real previous-version browser upgrades automatically and still works offline
- [x] Deploy and verify the canonical and cache-busting URLs

### Update recovery review

- Deployed the v4 release through GitHub Actions run `33161204292`.
- Verified the recovery URL and canonical URL both render the paw-print redesign on the live GitHub Pages origin.
- Verified a browser controlled by the previous service worker upgrades to v4, keeps only the v4 cache, and reloads offline.
- Verified the live 390px layout has zero horizontal overflow and public assets remain free of private booking credentials.
- Independent review found no Critical or Important issues after the revisioned offline-shell fix.

## October 2 snorkeling booking

- [x] Add a fixed 2026-10-02 09:00 Pink Mermaid Okinawa snorkeling event
- [x] Replace conflicting October 2 activities in A/B/C with the confirmed booking
- [x] Add the canonical operator source without Instagram tracking parameters
- [x] Rotate the PWA release so existing phones receive the itinerary update
- [x] Regenerate and inspect all three PDFs
- [x] Deploy and verify the live website, offline cache, and downloadable PDFs

### Snorkeling update review

- Deployed the fixed 2026-10-02 09:00 Pink Mermaid Okinawa snorkeling booking through GitHub Actions run `33162354478`.
- Verified A/B/C, the fixed-logistics view, the canonical Instagram link, v5 cache takeover, and offline reload on the live GitHub Pages origin.
- Verified all three deployed PDF hashes match the inspected local artifacts and CI reads their extracted itinerary content.
- Kept the meeting point, participant list, equipment details, and child eligibility in the private operator messages rather than guessing or publishing them.
- Independent review found no remaining Critical or Important issues after PDF release URLs and CI verification were fixed.

## Front itinerary refresh and travel-tool update

- [x] Add regression tests that lock every 9/30–10/4 day object in A/B/C
- [x] Replace 9/24–9/29 with the approved non-duplicating A/B/C plans
- [x] Add a confirmed-flight summary without guessing missing flight details
- [x] Add the official OTS accident/breakdown contact and after-hours guidance
- [x] Replace the completion mark with an accessible dog-paw stamp
- [x] Rotate all web, service-worker, and PDF URLs to release v6
- [x] Regenerate and visually inspect all three PDFs
- [x] Verify mobile, persistence, offline upgrade, privacy, and production deployment

### Front itinerary refresh review

- Deployed release v6 from commit `d5d7f61` through GitHub Actions run `33168570409`.
- Verified 47/47 tests, all 15 required public assets, and three visually inspected 17-page PDFs.
- Confirmed the 9/30–10/4 A/B/C hashes are unchanged; early plans do not repeat late attractions, and C 9/28 keeps one main attraction.
- Verified the live 320/390/1440px layouts, checkbox persistence, v5-to-v6 takeover, offline reload, OTS guidance, dog-paw stamp, and exact deployed PDF hashes.
- Independent review found no remaining Critical or Important issues after mandatory 110 guidance and paw-asset packaging were corrected.

## Confirmed flight correction

- [x] Lock the corrected 9/24 China Airlines CI120 flight in tests
- [x] Lock the corrected 10/4 STARLUX JX871 15:50 departure without inventing an arrival time
- [x] Reconcile all 10/4 A/B/C events with the earlier departure while preserving the rest of the late itinerary
- [x] Rotate the PWA shell and offline cache to release v7
- [x] Regenerate and visually inspect all three PDFs
- [x] Run full verification, deploy GitHub Pages, and confirm the live flight data

### Flight correction review

- Deployed release v7 from commit `d78b580` through GitHub Actions run `33171862918`.
- Verified the live app shell and service worker use v7 and the public trip data contains China Airlines CI120 plus STARLUX JX871 at 15:50.
- Removed the superseded BR185/20:20 details and labels JX871's unprovided arrival time explicitly instead of guessing it.
- Preserved all unrelated 9/30–10/4 activities; only the 10/4 post-return airport timeline changed to fit the earlier departure.
- Verified 48/48 tests, privacy checks, three visually inspected 17-page PDFs, and exact local-to-live PDF hashes.

## Larger cat-paw completion stamp

- [x] Add a failing visual-style test for a substantially larger completion stamp
- [x] Increase the stamp and tap target without covering itinerary text
- [x] Rotate the PWA shell and offline cache to release v8
- [x] Verify checked and unchecked states at 320px, 390px, and desktop widths
- [x] Deploy GitHub Pages and confirm the live v8 stamp

### Larger stamp review

- Increased the visible paw art from 36px to 50px and the tap target from 44px to 56px; the checked parent transform presents the stamp at about 62px.
- Increased itinerary-card right padding so the larger mark remains separate from long titles.
- Verified checked and unchecked states at 320px, 390px, and 1440px with no title overlap or horizontal overflow.
- Deployed release v8 from commit `e506ed8` through GitHub Actions run `33181625775` and confirmed the live CSS and cache revision.

## Corrected October 3–4 group split

- [x] Add regression tests for the named groups and the absence of a 10/3 flight
- [x] Keep all six travelers together on 10/3 in A/B/C
- [x] Assign 10/4 STARLUX JX871 to 譚家 and leave 曾羅佳's later transport unspecified
- [x] Rotate the PWA shell and offline cache to release v9
- [x] Regenerate and visually inspect all three PDFs
- [ ] Run full verification, deploy GitHub Pages, and confirm the live correction
