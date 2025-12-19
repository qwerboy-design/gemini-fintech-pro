# Google Apps Script initializeUserStocksSheet 錯誤修復說明

## 問題描述

執行 `initializeUserStocksSheet` 函數時發生錯誤：
```
TypeError: Cannot read properties of undefined (reading 'insertSheet')
```

**錯誤位置**: `Code.gs:441`

**原因**: 函數參數 `ss` 為 `undefined`

---

## 問題分析

### 可能原因

1. **手動執行函數時未傳入參數**
   - 如果在 Google Apps Script 編輯器中直接選擇並執行 `initializeUserStocksSheet`
   - 函數期望接收 `ss` 參數，但手動執行時不會自動傳遞參數

2. **調用時參數未正確傳遞**
   - 雖然 `handleSaveStock` 中有傳遞 `ss`，但在某些錯誤情況下可能為 undefined

3. **SpreadsheetApp.openById 返回 null**
   - Sheet ID 錯誤或權限問題可能導致返回 null

---

## 解決方案

### 1. 修復 `initializeUserStocksSheet` 函數

**改進內容**：
- ✅ 添加參數檢查：如果 `ss` 為 `undefined`，自動打開 Spreadsheet
- ✅ 添加工作表存在檢查：如果工作表已存在，直接返回
- ✅ 添加錯誤處理和日誌記錄
- ✅ 驗證 `ss` 是否有效

### 2. 新增獨立初始化函數

**`initializeUserStocksSheetStandalone()`**：
- ✅ 不需要參數，可直接手動執行
- ✅ 適合在 Google Apps Script 編輯器中測試
- ✅ 包含完整的錯誤處理和日誌

---

## 使用方法

### 方法 1：直接執行獨立函數（推薦）

1. 打開 Google Apps Script 編輯器
2. 選擇函數：`initializeUserStocksSheetStandalone`
3. 點擊「執行」按鈕
4. 查看執行記錄確認結果

### 方法 2：通過 API 自動觸發

當前端調用 `saveStock` action 時，如果 `UserStocks` 工作表不存在，會自動創建。

---

## 測試步驟

### 測試獨立初始化函數

1. 打開 Google Apps Script 編輯器
2. 確保已更新最新的 `Code.gs` 內容
3. 選擇函數：`initializeUserStocksSheetStandalone`
4. 點擊「執行」按鈕
5. 查看「執行記錄」：
   - ✅ 應該看到「開始初始化 UserStocks 工作表...」
   - ✅ 應該看到「UserStocks 工作表已成功創建」
   - ✅ 或者看到「UserStocks 工作表已存在，無需創建」
6. 檢查 Google Sheets：
   - ✅ 應該看到新的 `UserStocks` 工作表
   - ✅ 表頭應該正確設置（UserId, StockSymbol, ...）

---

## 錯誤處理

### 如果仍然失敗

1. **檢查 Sheet ID**：
   - 確認 `SHEET_ID` 常數是否正確
   - 在 Sheet URL 中查看 ID（`/d/{SHEET_ID}/edit`）

2. **檢查權限**：
   - 確認 Google Apps Script 已授權訪問 Google Sheets
   - 執行函數時可能需要授權

3. **檢查工作表名稱衝突**：
   - 確認 `USER_STOCKS_SHEET_NAME`（預設為 "UserStocks"）沒有與現有工作表衝突

4. **查看執行記錄**：
   - 在 Google Apps Script 編輯器中查看「執行記錄」標籤
   - 查看 `Logger.log` 輸出的詳細資訊

---

## 修復內容摘要

### 原問題
- `initializeUserStocksSheet` 函數需要 `ss` 參數
- 手動執行時參數為 `undefined`，導致錯誤

### 修復方案
- ✅ 函數現在可以自動獲取 Spreadsheet（如果參數缺失）
- ✅ 新增獨立初始化函數，無需參數即可執行
- ✅ 添加完整的錯誤處理和日誌記錄
- ✅ 添加工作表存在檢查，避免重複創建

---

**最後更新**: 2025-12-16





