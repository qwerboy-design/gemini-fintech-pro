# Google Apps Script 修復指南：修復 saveStock 錯誤

## 問題診斷

根據錯誤日誌，問題出現在 `saveOrUpdateStock` 函數中：
```
Error: sheet parameter is required
```

這表示在調用 `saveOrUpdateStock` 時，`sheet` 參數是 `null` 或 `undefined`。

**根本原因**：
- `handleSaveStock` 函數在初始化 `UserStocks` 工作表後，沒有再次確認 `sheet` 是否為 `null`
- 如果初始化失敗但沒有拋出異常，`sheet` 可能仍然是 `null`
- 當調用 `saveOrUpdateStock(sheet, data)` 時就會拋出 "sheet parameter is required" 錯誤

## 解決方案

我已經修復了 `handleSaveStock` 函數，添加了：
1. **詳細的調試日誌**：追蹤每個步驟的執行狀態
2. **額外的空值檢查**：在調用 `saveOrUpdateStock` 之前再次確認 `sheet` 不為 `null`
3. **更清晰的錯誤訊息**：幫助診斷問題

## 更新步驟

### 方法 1：完整更新（推薦）

**最簡單的方法是直接複製整個 `Code.gs` 文件到您的 Google Apps Script 項目中。**

1. 打開本地文件：`google-apps-script/Code.gs`
2. 複製全部內容（Ctrl+A, Ctrl+C）
3. 前往您的 Google Apps Script 項目編輯器
4. 刪除現有的 `Code.gs` 內容
5. 貼上新的代碼（Ctrl+V）
6. 點擊「保存」按鈕（磁碟圖標）
7. **重要**：點擊「部署」→「管理部署」，然後點擊「編輯」按鈕（鉛筆圖標），然後點擊「重新部署」

### 方法 2：部分更新

如果您只想更新 `handleSaveStock` 和 `saveOrUpdateStock` 函數，請按照以下步驟：

#### 步驟 1：更新 `handleSaveStock` 函數

在您的 `Code.gs` 文件中，找到 `handleSaveStock` 函數（大約在第 335 行），替換為以下代碼：

```javascript
/**
 * 處理儲存股票請求
 */
function handleSaveStock(data) {
  // #region agent log
  Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:entry', message:'handleSaveStock entry', data:{userId:data?.userId, stockSymbol:data?.stock?.symbol, sheetId:SHEET_ID, sheetName:USER_STOCKS_SHEET_NAME}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
  // #endregion
  
  try {
    // 驗證必要欄位
    if (!data || !data.userId || !data.stock || !data.stock.symbol) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:validationError', message:'Validation failed for handleSaveStock', data:{data:data}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
      // #endregion
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '缺少必要欄位：userId 或 stock.symbol'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 打開 Google Sheet
    let ss;
    try {
      ss = SpreadsheetApp.openById(SHEET_ID);
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:openByIdSuccess', message:'Spreadsheet opened by ID', data:{sheetId:SHEET_ID, ssIsNotNull:!!ss}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
      // #endregion
    } catch (openError) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:openByIdError', message:'Failed to open spreadsheet by ID', data:{sheetId:SHEET_ID, error:openError.toString()}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
      // #endregion
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '無法訪問 Google Sheet (SHEET_ID 錯誤或權限不足): ' + openError.toString()
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 獲取或創建 UserStocks 工作表
    let sheet = ss.getSheetByName(USER_STOCKS_SHEET_NAME);
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:getSheetByName', message:'Attempted to get UserStocks sheet', data:{sheetName:USER_STOCKS_SHEET_NAME, sheetIsNotNull:!!sheet}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
    // #endregion
    
    if (!sheet) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:sheetNotFound', message:'UserStocks sheet not found, attempting to initialize', data:{sheetName:USER_STOCKS_SHEET_NAME}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
      // #endregion
      try {
        sheet = initializeUserStocksSheet(ss);
        // #region agent log
        Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:initResult', message:'Initialize UserStocks sheet result', data:{sheetIsNotNull:!!sheet, sheetName:sheet?.getName()}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
        // #endregion
      } catch (initError) {
        // #region agent log
        Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:initFailed', message:'Failed to initialize UserStocks sheet', data:{initError:initError.toString()}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
        // #endregion
        return ContentService.createTextOutput(
          JSON.stringify({
            success: false,
            message: '創建 UserStocks 工作表失敗: ' + initError.toString()
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // 再次確認 sheet 不為 null（防止初始化失敗但沒有拋出異常的情況）
    if (!sheet) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:sheetStillNull', message:'UserStocks sheet is still null after initialization attempt', data:{sheetName:USER_STOCKS_SHEET_NAME}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
      // #endregion
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: 'UserStocks 工作表初始化後仍無法獲取，請檢查 SHEET_ID 和權限設置'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:sheetReady', message:'UserStocks sheet is ready', data:{sheetName:sheet.getName(), sheetLastRow:sheet.getLastRow()}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
    // #endregion
    
    // 保存或更新股票記錄
    const result = saveOrUpdateStock(sheet, data);
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:saveResult', message:'saveOrUpdateStock returned', data:{resultSuccess:result?.success, resultMessage:result?.message}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
    // #endregion
    
    return ContentService.createTextOutput(
      JSON.stringify(result)
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:error', message:'handleSaveStock caught error', data:{error:error.toString(), stack:error.stack}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
    // #endregion
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: '儲存股票時發生錯誤: ' + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

#### 步驟 2：更新 `saveOrUpdateStock` 函數

找到 `saveOrUpdateStock` 函數（大約在第 545 行），在函數開頭添加調試日誌：

```javascript
function saveOrUpdateStock(sheet, data) {
  // #region agent log
  Logger.log(JSON.stringify({location:'Code.gs:saveOrUpdateStock:entry', message:'saveOrUpdateStock entry', data:{sheetIsNotNull:!!sheet, dataIsNotNull:!!data, userId:data?.userId, stockSymbol:data?.stock?.symbol}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
  // #endregion
  
  // 參數驗證
  if (!sheet) {
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:saveOrUpdateStock:sheetNull', message:'Sheet parameter is null in saveOrUpdateStock', timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
    // #endregion
    throw new Error('sheet parameter is required');
  }
  
  if (!data) {
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:saveOrUpdateStock:dataNull', message:'Data parameter is null in saveOrUpdateStock', timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
    // #endregion
    throw new Error('data parameter is required');
  }
  
  const userId = data.userId;
  const stock = data.stock;
  
  // #region agent log
  Logger.log(JSON.stringify({location:'Code.gs:saveOrUpdateStock:paramsExtracted', message:'Params extracted in saveOrUpdateStock', data:{userId:userId, stockSymbol:stock?.symbol, stockName:stock?.name}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
  // #endregion
  
  // ... 其餘代碼保持不變 ...
}
```

### 步驟 3：重新部署

**非常重要**：更新代碼後，您必須重新部署 Google Apps Script：

1. 在 Google Apps Script 編輯器中，點擊「保存」按鈕
2. 點擊「部署」→「管理部署」
3. 找到現有的部署，點擊右側的「編輯」按鈕（鉛筆圖標）
4. 在彈出的對話框中，點擊「部署」按鈕
5. 等待部署完成

**注意**：如果沒有重新部署，新的代碼不會生效。

## 驗證修復

更新並重新部署後：

1. 刷新前端頁面
2. 使用 mike 帳號登入
3. 嘗試搜尋並儲存股票（例如 2317）
4. 確認股票成功儲存並出現在列表中

## 查看調試日誌

如果問題仍然存在，您可以查看 Google Apps Script 的執行日誌：

1. 在 Google Apps Script 編輯器中，點擊「執行」→「查看執行記錄」
2. 查看最新的執行日誌，找到以 `{location:'Code.gs:handleSaveStock` 開頭的日誌
3. 這些日誌會顯示每個步驟的執行狀態，幫助診斷問題

## 常見問題排查

### 1. SHEET_ID 錯誤

**症狀**：日誌顯示 `Failed to open spreadsheet by ID`

**解決方法**：
- 確認 `SHEET_ID` 常量是否正確設置
- 確認 Google Sheet 的 ID 是否正確（從 Sheet URL 中獲取）

### 2. 權限不足

**症狀**：日誌顯示 `無法訪問 Google Sheet` 或 `openById 返回 null`

**解決方法**：
- 確認 Google Apps Script 已經授權訪問 Google Sheets
- 在 GAS 編輯器中，點擊「執行」→「授權訪問」
- 確認部署權限設置為「任何人」或正確的用戶

### 3. UserStocks 工作表無法創建

**症狀**：日誌顯示 `Failed to initialize UserStocks sheet` 或 `sheet is still null after initialization`

**解決方法**：
- 確認 `USER_STOCKS_SHEET_NAME` 常量已定義
- 手動執行 `initializeUserStocksSheetStandalone()` 函數來創建工作表
- 檢查是否有足夠的權限創建新工作表

---

**最後更新**: 2025-12-16  
**相關文件**: `GAS_GET_USER_STOCKS_UPDATE.md`, `GAS_UPDATE_INSTRUCTIONS.md`







