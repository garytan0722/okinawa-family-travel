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
- [x] Assign 10/4 STARLUX JX871 to 譚家 and leave 曾蘿情侶's later transport unspecified
- [x] Rotate the PWA shell and offline cache to release v9
- [x] Regenerate and visually inspect all three PDFs
- [x] Run full verification, deploy GitHub Pages, and confirm the live correction

### Corrected group split review

- Deployed release v9 from commit `c4d480a` through GitHub Actions run `33184540635`.
- Verified 49/49 tests, the static build, and all three regenerated 17-page PDFs.
- Confirmed the live trip data has no 10/3 flight or airport split, keeps all six travelers together through 10/4, and assigns STARLUX JX871 to 譚家.
- Published the user-provided group labels 譚家 and 曾蘿情侶 while keeping the private accommodation address and booking credentials out of the repository.
- Verified the live app shell and service worker use v9, and the three deployed PDF hashes exactly match the inspected local artifacts.

## Corrected couple label

- [x] Add failing tests for the exact label 曾蘿情侶 and removal of the typo 曾羅佳
- [x] Update website data, A/B/C itinerary copy, and documentation without changing logistics
- [x] Rotate the PWA shell and offline cache to release v10
- [x] Regenerate and visually inspect all three PDFs
- [x] Run full verification, deploy GitHub Pages, and confirm the live correction

### Corrected couple label review

- Deployed release v10 from commit `1d25d71` through GitHub Actions run `33186779210`.
- Replaced the typo 曾羅佳 with the exact user-provided label 曾蘿情侶 across the website, A/B/C copy, documentation, and PDFs without changing logistics.
- Verified 50/50 tests, the static privacy-safe build, and all three regenerated 17-page PDFs.
- Visually inspected each PDF's cover, flight summary, October 3, and October 4 pages; the longer label is legible and unclipped.
- Confirmed the live v10 JSON and service worker, absence of the old typo, and exact local-to-live PDF hashes.

## 青潛集合資訊與官方門票

- [x] 查核青潛官方集合地點、活動流程、限制與 09:00 時段的集合時間
- [x] 盤點 A／B／C 行程內所有付費景點並查核官方票價
- [x] 以測試鎖定青潛集合資訊、付費景點票價與 v11 離線更新
- [x] 實作網站行程卡的集合／注意事項與門票資訊
- [x] 重建並視覺檢查 A／B／C PDF
- [x] 完整驗證、部署 GitHub Pages 並確認線上版本

### 青潛與門票 review

- 依青潛 BEST DIVE OKINAWA 官網，保留 10/2 09:00 活動並明列 08:00 集合、青潛免費停車場（裝備區）、MapCode、停車格、攜帶物與健康／遲到限制。
- 只修正 10/2 與青潛預約直接相關的資訊；9/30、10/1、10/3、10/4 行程內容未變更。
- 為 A／B／C 行程內 15 個付費活動／景點加入官方票價、年齡區間、備註與官方查價連結，票價查核日為 2026-08-29。
- Verified 53/53 tests, the privacy-safe static build, and three visually inspected 20-page PDFs.
- Deployed release v11 from commit `dea3c26` through GitHub Actions run `33239104995`.
- Confirmed the live JSON contains the 08:00 meeting／09:00 activity split and all 15 ticket records, the live service worker uses v11, and all three deployed PDF hashes exactly match the inspected local artifacts.

## 新增北部親子景點與 AEON 名護

- [x] 以失敗測試鎖定兩個使用者 Maps 連結、9/27／9/28 動線與 v12
- [x] 9/27 加入やんばる森のおもちゃ美術館與 AEON 名護，移除今歸仁
- [x] 9/28 加入釣って見つけるぼうけんの国，移除東南植物樂園
- [x] 加入兩處官方票價、營業／維護時間、停車與官方來源
- [x] 重建並視覺檢查 A／B／C PDF
- [x] 完整驗證、部署 GitHub Pages 並確認線上版本

### 北部親子景點 review

- 9/27 A／B／C 均採古宇利海洋塔 → やんばる森のおもちゃ美術館 → AEON名護，並使用使用者提供的玩具美術館 Maps 連結。
- 9/28 A／B 保留兒童王國上午、下午改釣魚尋寶冒險；C 只留冒險王國一個主景點，使用使用者提供的 Maps 連結。
- 移除不再使用的今歸仁與東南植物樂園票價，改加入兩個新景點的官方票價、營業／維護時間、停車與預約提示。
- Verified 54/54 tests, privacy-safe static build, frozen 9/30–10/4 hashes, and three visually inspected 21-page PDFs.
- Deployed release v12 from commit `ff3d6a9` through GitHub Actions run `33305830823`.
- Confirmed the live JSON contains both original Maps links, the two new ticket records, the AEON名護 replacement, no removed stops, and exact local-to-live PDF hashes.

## 9/24–9/30 順路親子餐廳

- [x] 查核 9/24–9/30 A／B／C 的景點與用餐方向，不為餐廳繞回頭路
- [x] 以失敗測試鎖定 9/28 サンエー大湾シティ、具名餐廳與 9/30 凍結資料
- [x] 為 9/24–9/29 模糊用餐事件加入首選／備選餐廳及直接導航
- [x] 調整 9/28 與 9/29 的順路時間軸並保留 9/30–10/4 原始內容
- [x] 在網站與 A／B／C PDF 顯示親子餐廳指南
- [x] 更新離線版本，完成測試、手機、PDF、隱私與部署驗證

### 順路親子餐廳 review

- 9/24–9/29 的 A／B／C 用餐點都改為具名首選與備選，並提供直接導航與不繞路理由；9/30–10/4 的完整 day objects 雜湊未變。
- 9/28 採沖繩市／石川 → 冒險王國 → サンエー大湾シティ → 西岸飯店，保留使用者提供的大灣 Maps 連結；9/29 B 版改為殘波岬 → 琉球村 → 恩納午餐 → 萬座毛 → 飯店。
- 發現 なかむらそば 會越過萬座毛後折返，最終改為 58 號沿線的恩菜食房 ぴぱら，確保備選也順路。
- Verified 58/58 tests, privacy-safe static build, 390px live layout with zero horizontal overflow, and three visually inspected 24-page PDFs.
- Deployed release v13 from commit `13672c6` through GitHub Actions run `33306901023`; live app, JSON, service worker, and PDFs all return HTTP 200, and deployed PDF hashes exactly match local artifacts.

## 每日 Google Maps 路線與雨天備案庫

- [x] 以測試鎖定每日多站導航、5 點分段、去重與模糊地點排除
- [x] 加入 24 個分類雨天備案、官方連結與行程內標示
- [x] 在每日行程與「更多」頁加入雨天備案入口
- [x] 保持 9/30–10/4 A／B／C day objects 雜湊完全不變
- [x] 輪替 v14 離線快取並驗證手機、離線、隱私與公開資產
- [ ] 部署 GitHub Pages 並確認線上版本
