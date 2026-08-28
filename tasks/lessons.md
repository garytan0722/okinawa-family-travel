# Lessons

- Never place real booking codes, access links, PINs, or private accommodation names in source code—even as denylist test fixtures. Test privacy through schema rules and generic public labels, then scan and purge Git history before publication.
- A successful Pages deployment and fresh-browser QA do not prove that existing PWA clients update. Test the upgrade path from the previous service-worker cache; revision shell assets, prefer network for online navigations, and explicitly trigger worker update/takeover.
