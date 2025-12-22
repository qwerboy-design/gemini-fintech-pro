# Google Apps Script USER_STOCKS_SHEET_NAME 未定義錯誤修復

## 錯誤訊息

```
ReferenceError: USER_STOCKS_SHEET_NAME is not defined
initializeUserStocksSheet @ 程式碼.gs:499
```

## 問題原因

Google Apps Script 編輯器中的 `Code.gs` 文件缺少 `USER_STOCKS_SHEET_NAME` 常數的定義。

此常數需要在文件開頭（與 `SHEET_ID` 和 `SHEET_NAME` 一起）定義。

---

## 解決方案

### 方法 1：完整更新整個文件（推薦）

1. **打開本地文件** `google-apps-script/Code.gs`
2. **全選並複製所有內容**（Ctrl+A, Ctrl+C）
3. **打開 Google Apps Script 編輯器**
4. **全選並刪除舊代碼**
5. **貼上新代碼**（Ctrl+V）
6. **點擊「儲存」按鈕**（💾）

### 方法 2：僅添加缺失的常數（快速修復）

如果您想快速修復，只需要在 Google Apps Script 編輯器中：

1. 找到文件開頭的配置部分（約第 39-42 行）
2. 在 `const SHEET_NAME = 'CursorFintechDB';` 這一行之後，添加：

```javascript
const USER_STOCKS_SHEET_NAME = 'UserStocks'; // Sheet 工作表名稱 (用於股票資料)
```

完整配置部分應該看起來像這樣：

```javascript
// ========== 配置 ==========
const SHEET_ID = '1zzpbZADRiJNd52OcK4sAxAzrDg5ZKuhgJhSzYPo9wS4'; // 替換為您的 Google Sheet ID
const SHEET_NAME = 'CursorFintechDB'; // Sheet 工作表名稱 (用於登入記錄)
const USER_STOCKS_SHEET_NAME = 'UserStocks'; // Sheet 工作表名稱 (用於股票資料)
```

3. 點擊「儲存」按鈕（💾）

---

## 驗證修復

### 步驟 1：檢查常數是否已定義

在 Google Apps Script 編輯器中：

1. 按 `Ctrl+F`（或 `Cmd+F`）打開搜索框
2. 搜索：`USER_STOCKS_SHEET_NAME`
3. 應該能看到至少 2 個結果：
   - ✅ 第 42 行：`const USER_STOCKS_SHEET_NAME = 'UserStocks';`（定義）
   - ✅ 其他行：使用這個常數的地方

如果只找到使用的地方，找不到定義，說明常數仍未添加。

### 步驟 2：執行測試函數

1. 在函數選擇器中選擇 `initializeUserStocksSheetStandalone`
2. 點擊「執行」按鈕 ▶️
3. 查看執行記錄，應該**不再**看到 `USER_STOCKS_SHEET_NAME is not defined` 錯誤

### 步驟 3：預期的成功日誌

執行成功時，應該看到：

```
=== 開始初始化 UserStocks 工作表（獨立執行）===
Sheet ID: [您的 Sheet ID]
工作表名稱: UserStocks
成功打開 Spreadsheet, ss type: object
initializeUserStocksSheet called, ss type: object
ss is undefined: false
檢查工作表是否已存在: UserStocks
[後續日誌...]
```

**不應該**看到：
- ❌ `ReferenceError: USER_STOCKS_SHEET_NAME is not defined`
- ❌ `TypeError: Cannot read properties of undefined`

---

## 為什麼會發生這個問題？

這個錯誤通常發生在以下情況：

1. **代碼未完全更新**：只更新了部分代碼，遺漏了文件開頭的配置部分
2. **複製時遺漏**：複製代碼時沒有從文件開頭開始複製
3. **手動編輯錯誤**：手動添加代碼時遺漏了某些必要的常數定義

---

## 完整配置檢查清單

確保以下所有常數都在 Google Apps Script 編輯器中正確定義：

- [ ] `SHEET_ID` - Google Sheet ID（約第 40 行）
- [ ] `SHEET_NAME` - 登入記錄工作表名稱（約第 41 行）
- [ ] **`USER_STOCKS_SHEET_NAME`** - 股票資料工作表名稱（約第 42 行）⚠️ **必須存在**

---

## 如果仍然失敗

如果添加常數後仍然出現錯誤：

1. ✅ 確認已點擊「儲存」按鈕
2. ✅ 清除瀏覽器緩存並重新載入頁面
3. ✅ 嘗試完全重新複製整個 `Code.gs` 文件
4. ✅ 確認常數名稱拼寫正確（大小寫敏感）
5. ✅ 檢查是否有語法錯誤（缺少分號等）

---

**最後更新**: 2025-12-16










