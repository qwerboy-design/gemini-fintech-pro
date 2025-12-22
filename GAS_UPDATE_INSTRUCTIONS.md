# Google Apps Script 代碼更新指南

## 問題診斷

根據執行記錄，您執行的 `initializeUserStocksSheet` 函數仍然是舊版本，錯誤發生在：
```
Code.gs:441: const sheet = ss.insertSheet(USER_STOCKS_SHEET_NAME);
```

這表明 Google Apps Script 編輯器中的代碼還沒有更新到最新版本。

---

## 解決方案：更新 Google Apps Script 代碼

### 步驟 1：打開本地代碼文件

1. 在您的本地項目中，打開文件：
   ```
   google-apps-script/Code.gs
   ```
2. 全選所有內容（Ctrl+A 或 Cmd+A）
3. 複製所有內容（Ctrl+C 或 Cmd+C）

### 步驟 2：更新 Google Apps Script 編輯器

1. 打開 Google Apps Script 編輯器：
   - 訪問：https://script.google.com
   - 或者從您的 Google Drive 打開對應的 Apps Script 專案

2. 在編輯器中：
   - 全選現有代碼（Ctrl+A 或 Cmd+A）
   - 刪除舊代碼
   - 貼上新的代碼（Ctrl+V 或 Cmd+V）

3. 點擊「儲存」按鈕（💾 圖標或 Ctrl+S）

### 步驟 3：驗證更新

在貼上並保存新代碼後，請在 Google Apps Script 編輯器中進行以下檢查：

#### 檢查 1：確認常數定義存在

捲動到文件開頭（約第 39-42 行），確認以下常數都已定義：

```javascript
const SHEET_ID = '1zzpbZADRiJNd52OcK4sAxAzrDg5ZKuhgJhSzYPo9wS4'; // 替換為您的 Google Sheet ID
const SHEET_NAME = 'CursorFintechDB'; // Sheet 工作表名稱 (用於登入記錄)
const USER_STOCKS_SHEET_NAME = 'UserStocks'; // Sheet 工作表名稱 (用於股票資料)
```

**⚠️ 重要**：必須看到 `const USER_STOCKS_SHEET_NAME = 'UserStocks';` 這一行！如果沒有，說明您沒有完整複製整個文件。

#### 檢查 2：確認關鍵函數存在

1. **`initializeUserStocksSheet(ss)`** - 應該包含參數檢查邏輯（約在第 469 行）
   - ✅ 應該有 `if (!ss) { ... }` 檢查
   - ✅ 應該有自動打開 Spreadsheet 的邏輯

2. **`initializeUserStocksSheetStandalone()`** - 新增的獨立函數（約在第 558 行）
   - ✅ 應該存在這個函數
   - ✅ 不需要任何參數即可執行

---

## 測試步驟

### 方法 1：使用獨立函數（推薦）

1. 在 Google Apps Script 編輯器中，確保已保存最新代碼
2. 在函數選擇器中，選擇：**`initializeUserStocksSheetStandalone`**
3. 點擊「執行」按鈕 ▶️
4. 如果出現授權提示：
   - 點擊「授權」
   - 選擇您的 Google 帳號
   - 點擊「進階」→「前往 [專案名稱]（不安全）」
   - 點擊「允許」
5. 查看「執行記錄」：
   - ✅ 應該看到：「開始初始化 UserStocks 工作表（獨立執行）...」
   - ✅ 應該看到：「成功打開 Spreadsheet」
   - ✅ 應該看到：「UserStocks 工作表已成功創建」或「UserStocks 工作表已存在」
   - ❌ 不應該看到 `TypeError: Cannot read properties of undefined`

### 方法 2：驗證修復後的函數

即使手動執行 `initializeUserStocksSheet`（不傳參數），現在也應該可以工作：

1. 在函數選擇器中，選擇：**`initializeUserStocksSheet`**
2. 點擊「執行」按鈕 ▶️
3. 查看執行記錄：
   - ✅ 應該看到：「ss 參數未提供，自動打開 Sheet ID: ...」
   - ✅ 應該看到：「成功打開 Sheet」
   - ✅ 不應該看到 `TypeError`

---

## 預期的執行記錄輸出

### 成功執行 `initializeUserStocksSheetStandalone` 時：

```
=== 開始初始化 UserStocks 工作表（獨立執行）===
Sheet ID: [您的 Sheet ID]
工作表名稱: UserStocks
成功打開 Spreadsheet, ss type: object
initializeUserStocksSheet called, ss type: object
ss is undefined: false
檢查工作表是否已存在: UserStocks
[如果工作表不存在]
開始創建工作表: UserStocks
工作表創建成功，開始設置表頭和格式
UserStocks 工作表已成功創建，表頭和格式設置完成
初始化完成！工作表行數: 1
=== 初始化成功 ===
```

### 如果工作表已存在：

```
=== 開始初始化 UserStocks 工作表（獨立執行）===
Sheet ID: [您的 Sheet ID]
工作表名稱: UserStocks
成功打開 Spreadsheet, ss type: object
initializeUserStocksSheet called, ss type: object
ss is undefined: false
檢查工作表是否已存在: UserStocks
UserStocks 工作表已存在，無需創建
初始化完成！工作表行數: [行數]
=== 初始化成功 ===
```

---

## 常見問題

### Q1: 更新後仍然看到 `USER_STOCKS_SHEET_NAME is not defined` 錯誤？

**A**: 這是最常見的問題！請確保：

1. ✅ **已完整複製所有代碼**（檢查文件總行數，應該是 692 行）
2. ✅ **已點擊「儲存」按鈕**（非常重要！）
3. ✅ **在 Google Apps Script 編輯器中，第 42 行應該有 `const USER_STOCKS_SHEET_NAME = 'UserStocks';`**
   - 如果沒有看到這行，請重新複製整個文件
4. ✅ 清除瀏覽器緩存或重新載入編輯器頁面（F5 或 Ctrl+R）
5. ✅ 確認複製時沒有遺漏文件開頭的配置部分（第 39-42 行）

**驗證方法**：在 Google Apps Script 編輯器中，按 Ctrl+F（或 Cmd+F），搜索 `USER_STOCKS_SHEET_NAME`，應該能在第 42 行找到定義。

### Q2: 找不到 `initializeUserStocksSheetStandalone` 函數？

**A**: 這表示代碼沒有正確更新。請：
1. 重新複製整個 `Code.gs` 文件內容
2. 確認複製的內容包含該函數（約在第 558 行）

### Q3: 仍然出現 `TypeError`？

**A**: 請檢查：
1. ✅ `SHEET_ID` 常數是否正確設置（在文件開頭）
2. ✅ Google Apps Script 是否有權限訪問該 Sheet
3. ✅ Sheet ID 是否有效（在 Sheet URL 中確認）

### Q4: 如何確認代碼已更新？

**A**: 檢查以下特徵：
- ✅ `initializeUserStocksSheet` 函數中應該有 `if (!ss) { ... }` 邏輯（約第 476 行）
- ✅ 應該存在 `initializeUserStocksSheetStandalone` 函數（約第 558 行）
- ✅ 文件中應該有多個 `// #region agent log` 註釋

---

## 驗證清單

完成更新後，請確認：

- [ ] 已將最新的 `Code.gs` 內容複製到 Google Apps Script 編輯器
- [ ] 已點擊「儲存」按鈕
- [ ] 可以看到 `initializeUserStocksSheetStandalone` 函數
- [ ] `initializeUserStocksSheet` 函數包含參數檢查邏輯
- [ ] 成功執行 `initializeUserStocksSheetStandalone` 沒有錯誤
- [ ] 在 Google Sheets 中可以看到 `UserStocks` 工作表
- [ ] 工作表表頭正確設置（UserId, StockSymbol, StockName, ...）

---

**最後更新**: 2025-12-16










