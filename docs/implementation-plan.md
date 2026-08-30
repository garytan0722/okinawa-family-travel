# Implementation plan

1. Establish testable JSON contracts for fixed logistics and A/B/C date coverage.
2. Research official attraction facts and author three geographically coherent itineraries.
3. Implement pure trip selectors, versioned local records, and safe backup import/export with TDD.
4. Build the responsive Tabichō-inspired home and day timeline from real content.
5. Add manifest, service worker, emergency/source tools, and GitHub Pages workflow.
6. Generate and visually inspect three A4 PDFs from the same canonical JSON.
7. Run unit, build, privacy, mobile, offline, and PDF verification.
8. Merge the verified branch to `main`, push, enable Pages, and verify the public URL.
# v13 route-aware dining implementation

1. Add content tests for the exact 9/28 San-A Owan City link, concrete early meal guides, route order on 9/28 and 9/29, and unchanged hashes for 9/30–10/4.
2. Add render tests proving the real day renderer exposes primary/backup restaurant names and direct Google Maps links.
3. Add normalized `diningGuides` data and reference it only from 9/24–9/29 events. Replace the 9/28 return event with the on-route Owan City dinner; reorder B 9/29 west-to-north.
4. Render a compact dining panel in event cards and add matching PDF guide pages.
5. Rotate all shell imports and offline assets to v13, regenerate PDFs, run the full suite, inspect mobile/PDF output, deploy, and verify the live origin.

