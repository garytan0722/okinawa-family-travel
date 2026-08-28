# Lessons

- Never place real booking codes, access links, PINs, or private accommodation names in source code—even as denylist test fixtures. Test privacy through schema rules and generic public labels, then scan and purge Git history before publication.
- A successful Pages deployment and fresh-browser QA do not prove that existing PWA clients update. Test the upgrade path from the previous service-worker cache; revision shell assets, prefer network for online navigations, and explicitly trigger worker update/takeover.
- When the user freezes a date range, protect the complete serialized day objects with regression hashes and derive any new summary UI from separate confirmed data. Before replacing earlier attractions, compare them against the frozen segment and exclude cross-segment duplicates.
- When the user corrects confirmed logistics inside an otherwise frozen date range, treat that correction as a narrow exception: update every dependent timeline, keep unrelated activities unchanged, and refresh the regression hashes only after reviewing the exact day-object diff.
- When increasing a completion stamp, grow the visual mark, hit target, and card text clearance together; verify both unchecked and checked states at the narrowest supported width so the emphasis does not obscure itinerary content.
