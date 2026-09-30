# PlayLab

給中學生使用的雙語互動學習遊戲入口。學生先選科目，再選遊戲。遊戲在頁面裡的 iframe 中開啟。平台負責瀏覽、說明、全螢幕、語言，以及收集成績。

預設顯示名稱是 **PlayLab**，定義在 `src/config.ts` 的 `PLATFORM_NAME`。

## 開發

```bash
npm install
npm run dev
npm run build
npm run preview
```

靜態部署時會使用 `public/_redirects`，把所有路徑交回 `index.html`。

GitHub Pages 要發布建置結果，不能直接把這個原始碼目錄當成網站。推上 `main` 後，`.github/workflows/pages.yml` 會執行 `npm run build`，並把 `dist` 發到 `https://<user>.github.io/<repo>/`。倉庫的 Pages 來源請選 **GitHub Actions**。專案站的資源基底是 `/<repo>/`；本機 `npm run dev` 仍從網站根路徑提供。

## 新增遊戲

不要把遊戲寫成 React 元件。日後新增時：

1. 放入靜態檔 `public/games/{subject}/{gameId}/index.html`。
2. 在 `src/data/catalog.ts` 登錄一筆資料。

若要回報分數，遊戲向父頁面送出：

```js
window.parent.postMessage({
  type: 'playlab:score',
  subject: '<subject>',
  gameId: '<gameId>',
  score: 1234,
  metadata: {}
}, '*');
```

分數愈高愈好。0 或負數不會儲存。同一個去重鍵只保留嚴格變高的分數。離開頁面時，父頁面會送 `{ type: 'playlab:requestScore' }`。遊戲應同時聽 `pagehide` 與 `beforeunload`，不要把切換分頁當成結束。

第一階段成績寫入 `localStorage` 的 `playlab-scores`，寫入點只有 `src/scores/scoreStore.ts` 的 `recordScore`。雲端排行榜與 Google 登入見 `docs/PHASE2.md`。

`public/games/tools/score-check/index.html` 只是分數接口的佔位頁，不是學習遊戲。
