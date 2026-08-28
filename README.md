# 沖繩遛小孩

2026/9/24–10/4 沖繩親子自駕旅行手帳。以手機優先的靜態 PWA 製作，支援離線瀏覽、A／B／C 三種行程節奏、完成勾選、孩子體力與每日筆記。

Live site: <https://garytan0722.github.io/okinawa-family-travel/>

## 三種節奏

- A 親子平衡：一天一個主角，保留午睡與海風。
- B 景點豐富：同區多走一站，每天保留可刪的次要行程。
- C 度假放鬆：飯店與海邊優先，減少長途移動。

固定班機、OTS 換車與住宿時段由 `content/trip.json` 統一管理。私人住宿一律使用通用名稱，地址、門鎖與入住憑證不放入公開網站、PDF 或 Git 歷史。

## Local development

```sh
npm test
npm run build
npm run serve
```

開啟 <http://localhost:4173/#/>。推送至 `main` 後，GitHub Actions 會驗證並部署 Pages。
