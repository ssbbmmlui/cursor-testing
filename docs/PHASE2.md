# 第二階段規格

第一階段只完成本機平台：瀏覽、雙語、遊戲播放頁，以及寫入這部裝置的分數。本文件描述下一階段要做的事。現在不要建立後端、不要接 Google、不要建立資料庫、不要寫 migration、不要呼叫任何雲端 API 來存分數。

第一階段的分數寫入集中在 `src/scores/scoreStore.ts` 的 `recordScore`。下一階段只要把這個函式裡「寫入 localStorage」換成「寫入資料庫」。去重規則維持不變。排行榜、個人檔案與公開檔案的版面直接更換資料來源，不需要重做介面。

環境變數到那時才需要：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ALLOWED_EMAIL_DOMAIN`

第一階段不要寫死任何學校網域。

## 1. Google 登入

使用 Supabase Auth 的 Google OAuth，流程用 PKCE。頁首的登入按鈕到那時才真正呼叫 OAuth。`signInWithGoogle` 不再只打開說明。

登入狀態使用獨立的 storage key，避免和 iframe 裡的儲存互相覆蓋。

## 2. 允許的網域

允許登入的網域由 `VITE_ALLOWED_EMAIL_DOMAIN` 決定。做三層檢查：

1. OAuth 的 hosted domain。
2. 前端若電郵網域不符，就登出並顯示錯誤。
3. 資料庫拒絕不符的電郵。

## 3. `game_scores` 資料表

欄位：

| 欄位 | 說明 |
| --- | --- |
| id | uuid 主鍵 |
| user_id | 登入者 |
| user_email | 電郵 |
| user_name | 顯示名稱 |
| subject | 科目 id |
| game_id | 遊戲 id |
| score | numeric，愈高愈好 |
| metadata | jsonb |
| created_at | 建立時間 |

索引：

- `(subject, game_id, score desc)`
- `(user_id, created_at desc)`

權限：

- 任何人可讀。
- 已登入者只能插入自己的 `user_id`。
- 客戶端不可更新或刪除。
- 0 分不插入。負分也不插入。

## 4. 分數寫入

`recordScore` 從追加 `localStorage` 的 `playlab-scores`，改為插入 `game_scores`。

去重規則不變：

- `score` 必須是有限數字，愈高愈好。
- 同一個去重鍵只保留嚴格變高的分數。
- 沒有特別鍵時用 `__default__`。
- metadata 有 `trackId` 時，去重鍵是 `trackId` 加 `difficulty`。
- metadata 不參與排名。

未登入不寫入雲端。雲端排行榜改為登入後才顯示名次。

## 5. 排行榜

每個使用者在所選期間只取最高分，較早達到者在前。期間仍是本學年、所有時間、本月。學年仍以香港時間 9 月 1 日至次年 8 月 31 日計算。

名次連到 `/profile/:userId`。自己的檔案仍是 `/profile`。

## 6. `profiles` 資料表

欄位：id、display_name、avatar_url、updated_at。

登入時寫入 Google 顯示名稱與頭像。公開檔案不顯示電郵。自己的檔案可以顯示電郵。

頁首已預留頭像選單（個人檔案、登出）。登入成功後才顯示，並接上真正的 `signOut`。

## 7. 個人檔案與熱力圖

個人檔案、公開檔案、活動熱力圖改讀 `game_scores`。熱力圖仍以使用者本地日曆日計算，週一為一週的第一天。

## 8. 作者連結

作者名稱若與某位玩家的顯示名稱相同，作者文字改成連到該玩家檔案。第一階段作者只顯示文字。
