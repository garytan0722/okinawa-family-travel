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
- [ ] Deploy and verify the canonical and cache-busting URLs
