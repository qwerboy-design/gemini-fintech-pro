# Google Apps Script Sheet 訪問錯誤修復指南

## 🚨 錯誤說明

如果看到錯誤訊息：
```
保存登入記錄時發生錯誤: Exception: Unexpected error while getting the method or property openById on object SpreadsheetApp.
```

這表示 Google Apps Script 無法訪問指定的 Google Sheet。

---

## ✅ 解決步驟

### 步驟 1: 檢查 Google Sheet ID

1. **打開您的 Google Sheet**
2. **從 URL 中獲取 Sheet ID**：
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```
   `[SHEET_ID]` 就是您需要的 ID

3. **驗證 Sheet ID 是否正確**：
   - 檢查 `Code.gs` 中的 `SHEET_ID` 常量
   - 確保與 Google Sheet URL 中的 ID 完全一致
   - **注意**：不要包含 `https://docs.google.com/spreadsheets/d/` 或 `/edit`

---

### 步驟 2: 確認 Google Apps Script 有權限訪問 Sheet

#### 方法 A: 確保 Sheet 和 Script 在同一個 Google Drive 帳號下

1. **檢查 Sheet 的所有者**：
   - 打開 Google Sheet
   - 點擊右上角的「共用」
   - 確認您是所有者或至少是編輯者

2. **檢查 Script 的所有者**：
   - 打開 Google Apps Script 專案
   - 確認您使用相同的 Google 帳號

#### 方法 B: 給 Sheet 設置適當的權限

1. **打開 Google Sheet**
2. **點擊右上角的「共用」**
3. **確保設置**：
   - 如果是私有：確保 Google Apps Script 的執行帳號有訪問權限
   - 或者設置為「任何知道連結的人都可以編輯」（僅用於測試）

---

### 步驟 3: 運行授權流程

Google Apps Script 需要授權才能訪問 Google Sheets：

1. **在 Google Apps Script 編輯器中**：
   - 點擊函數選擇器（如果有的話）
   - 或者手動運行 `doGet` 或 `doPost` 函數
   - 或點擊「執行」按鈕

2. **首次運行會要求授權**：
   - 會出現「需要授權」對話框
   - 點擊「檢閱權限」
   - 選擇您的 Google 帳號
   - 點擊「進階」→「前往 [專案名稱]（不安全）」（這是正常的）
   - 點擊「允許」

3. **確認授權的範圍包括**：
   - ✅ 查看和管理 Google Sheets
   - ✅ 連線到外部服務

---

### 步驟 4: 測試 Sheet 訪問

在 Google Apps Script 編輯器中手動測試：

1. **創建測試函數**（可選）：

```javascript
function testSheetAccess() {
  try {
    const SHEET_ID = '1pB5UyKUcgQ4NU7yme1aDiLCWvr6gXHYq5CglWYj5IvU0QVzwi2z32nd9';
    const SHEET_NAME = 'CursorFintechDB';
    
    const ss = SpreadsheetApp.openById(SHEET_ID);
    Logger.log('Sheet opened successfully');
    
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (sheet) {
      Logger.log('Sheet found: ' + SHEET_NAME);
    } else {
      Logger.log('Sheet not found, will be created on first login');
    }
    
    return 'Success';
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return 'Error: ' + error.toString();
  }
}
```

2. **運行測試函數**：
   - 在函數選擇器中選擇 `testSheetAccess`
   - 點擊「執行」
   - 查看「執行記錄」中的輸出

---

### 步驟 5: 檢查部署設置

確保部署設置正確：

1. **點擊「部署」→「管理部署」**
2. **編輯現有部署**
3. **確認設置**：
   ```
   執行身分: 我 ← 必須是這個，才能訪問您的 Sheet
   具有存取權的使用者: 任何人
   ```

4. **如果更改了「執行身分」**：
   - 必須重新部署
   - 可能需要重新授權

---

## 🔍 常見問題

### 問題 1: Sheet ID 不正確

**症狀**：
- 錯誤訊息提到 `openById`
- 無法訪問 Sheet

**解決方案**：
1. 重新複製 Sheet ID（從 Google Sheet URL）
2. 更新 `Code.gs` 中的 `SHEET_ID` 常量
3. 保存並重新部署

---

### 問題 2: 權限不足

**症狀**：
- Sheet 存在但無法訪問
- 授權後仍然失敗

**解決方案**：
1. 確認您是 Sheet 的所有者或編輯者
2. 在 Sheet 的「共用」設置中，確保執行 Google Apps Script 的帳號有權限
3. 如果使用「執行身分：我」，確保「我」是 Sheet 的擁有者

---

### 問題 3: Sheet 不存在

**症狀**：
- Sheet ID 看起來正確
- 但無法找到 Sheet

**解決方案**：
1. 檢查 Sheet 是否被刪除
2. 確認 Sheet ID 是否正確（從 URL 複製）
3. 創建新的 Sheet 並更新 Sheet ID

---

### 問題 4: 工作表名稱不匹配

**症狀**：
- 可以訪問 Sheet，但找不到指定的工作表

**解決方案**：
1. 打開 Google Sheet
2. 查看底部的工作表標籤名稱
3. 確認 `SHEET_NAME` 常量與實際工作表名稱完全一致（包括大小寫和空格）

**注意**：如果工作表不存在，代碼會自動創建，但前提是能夠成功訪問 Sheet。

---

## 📋 快速檢查清單

在報告問題前，請確認：

- [ ] Sheet ID 與 Google Sheet URL 中的 ID 完全一致
- [ ] Google Apps Script 和 Google Sheet 在同一個 Google 帳號下
- [ ] 已運行授權流程（首次運行時）
- [ ] 「執行身分」設置為「我」
- [ ] Sheet 存在且未被刪除
- [ ] 工作表名稱（SHEET_NAME）與實際名稱一致
- [ ] 已保存並重新部署 Google Apps Script

---

## 🔧 快速修復步驟摘要

1. **確認 Sheet ID**：
   ```javascript
   const SHEET_ID = 'YOUR_SHEET_ID_HERE'; // 從 Sheet URL 複製
   ```

2. **確認工作表名稱**：
   ```javascript
   const SHEET_NAME = 'CursorFintechDB'; // 與實際工作表名稱一致
   ```

3. **運行授權**：
   - 在 Google Apps Script 編輯器中手動運行一次函數
   - 完成授權流程

4. **重新部署**：
   - 保存代碼
   - 重新部署（選擇「新版本」）

---

## 🔗 相關文件

- `google-apps-script/Code.gs` - 後端代碼
- `GAS_UPDATE_GUIDE.md` - Google Apps Script 更新指南
- `GOOGLE_APPS_SCRIPT_SETUP.md` - 完整設置指南

---

**最後更新**: 2025-12-16







