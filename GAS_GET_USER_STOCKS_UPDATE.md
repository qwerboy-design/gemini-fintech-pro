# Google Apps Script 更新指南：添加 getUserStocks 功能

## 問題診斷

從調試日誌可以看到，Google Apps Script 返回了以下錯誤：
```
"未知的操作類型: getUserStocks"
```

這表示您的 Google Apps Script 項目中的 `doPost` 函數還沒有處理 `getUserStocks` action。

## 解決方案

您需要更新 Google Apps Script 項目中的代碼，添加 `getUserStocks` 的處理邏輯。

### 方法 1：完整更新（推薦）

**最簡單的方法是直接複製整個 `Code.gs` 文件到您的 Google Apps Script 項目中。**

1. 打開本地文件：`google-apps-script/Code.gs`
2. 複製全部內容（Ctrl+A, Ctrl+C）
3. 前往您的 Google Apps Script 項目編輯器
4. 刪除現有的 `Code.gs` 內容
5. 貼上新的代碼（Ctrl+V）
6. 點擊「保存」按鈕（磁碟圖標）
7. **重要**：點擊「部署」→「管理部署」，然後點擊「編輯」按鈕（鉛筆圖標），然後點擊「重新部署」

### 方法 2：部分更新（如果不想替換整個文件）

如果您只想更新必要的部分，請按照以下步驟：

#### 步驟 1：更新 `doPost` 函數

在您的 `doPost` 函數中，找到處理 action 的部分（通常在 `else if` 語句之後），添加以下代碼：

```javascript
function doPost(e) {
  try {
    // ... 現有的解析 requestData 的代碼 ...
    
    // 根據 action 執行不同操作
    let result;
    if (requestData.action === 'login') {
      result = handleLogin(requestData);
    } else if (requestData.action === 'saveStock') {
      result = handleSaveStock(requestData);
    } else if (requestData.action === 'deleteStock') {
      result = handleDeleteStock(requestData);
    } else if (requestData.action === 'getUserStocks') {  // ← 添加這一行
      result = handleGetUserStocks(requestData);          // ← 添加這一行
    } else {
      result = ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '未知的操作類型: ' + (requestData.action || '未指定')  // ← 可以更新錯誤訊息格式
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    return result;
  } catch (error) {
    // ... 現有的錯誤處理 ...
  }
}
```

#### 步驟 2：添加 `handleGetUserStocks` 函數

在您的 `Code.gs` 文件末尾，添加以下完整的 `handleGetUserStocks` 函數：

```javascript
/**
 * 獲取用戶的所有股票記錄（每個股票代號只返回最新一筆）
 * 
 * @param {Object} data 請求數據
 * @param {string} data.userId 用戶 ID
 * @returns {TextOutput} JSON 響應
 */
function handleGetUserStocks(data) {
  try {
    // 驗證必要欄位
    if (!data || !data.userId) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '缺少必要欄位：userId'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const userId = data.userId;

    // 打開 Google Sheet
    let ss;
    try {
      ss = SpreadsheetApp.openById(SHEET_ID);
    } catch (openError) {
      Logger.log('打開 Sheet 失敗: ' + openError.toString());
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '無法訪問 Google Sheet: ' + openError.toString()
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 獲取 UserStocks 工作表
    let sheet = ss.getSheetByName(USER_STOCKS_SHEET_NAME);
    
    if (!sheet) {
      // 如果工作表不存在，返回空列表
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: '沒有找到股票記錄',
          data: {
            stocks: []
          }
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 讀取所有數據（從第2行開始，跳過表頭）
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: '沒有找到股票記錄',
          data: {
            stocks: []
          }
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 讀取所有列：UserId, StockSymbol, StockName, Price, Change, Volume, Chips, BuySellRatio, CreatedAt, UpdatedAt
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 10);
    const values = dataRange.getValues();
    
    // 過濾該用戶的記錄
    const userRecords = values.filter(row => row[0] === userId);
    
    if (userRecords.length === 0) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: '沒有找到股票記錄',
          data: {
            stocks: []
          }
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 按股票代號分組，每個股票代號只保留最新一筆（按 UpdatedAt 排序）
    const stockMap = {};
    userRecords.forEach((row) => {
      const stockSymbol = row[1]; // StockSymbol
      const updatedAt = row[9]; // UpdatedAt
      
      // 確保 updatedAt 是 Date 對象，如果是字符串則轉換
      let updatedAtDate = null;
      if (updatedAt) {
        if (typeof updatedAt === 'string' && updatedAt.trim() !== '') {
          updatedAtDate = new Date(updatedAt);
          // 檢查是否為有效日期
          if (isNaN(updatedAtDate.getTime())) {
            updatedAtDate = null;
          }
        } else if (updatedAt && typeof updatedAt.getTime === 'function') {
          // 已經是 Date 對象，檢查是否有效
          if (!isNaN(updatedAt.getTime())) {
            updatedAtDate = updatedAt;
          }
        }
      }
      
      const existingRecord = stockMap[stockSymbol];
      let shouldUpdate = false;
      
      if (!existingRecord) {
        shouldUpdate = true;
      } else if (!existingRecord.updatedAt) {
        shouldUpdate = true;
      } else if (updatedAtDate && updatedAtDate.getTime && !isNaN(updatedAtDate.getTime())) {
        // 將現有記錄的 updatedAt 也轉換為 Date
        let existingUpdatedAt = existingRecord.updatedAt;
        if (existingUpdatedAt) {
          if (typeof existingUpdatedAt === 'string') {
            existingUpdatedAt = new Date(existingUpdatedAt);
          }
          
          // 檢查現有記錄的日期是否有效
          if (existingUpdatedAt && existingUpdatedAt.getTime && !isNaN(existingUpdatedAt.getTime())) {
            if (updatedAtDate.getTime() > existingUpdatedAt.getTime()) {
              shouldUpdate = true;
            }
          } else {
            shouldUpdate = true;
          }
        } else {
          shouldUpdate = true;
        }
      }
      
      if (shouldUpdate) {
        stockMap[stockSymbol] = {
          symbol: stockSymbol,
          name: row[2] || stockSymbol, // StockName
          price: row[3] || 0, // Price
          change: row[4] || 0, // Change
          volume: row[5] || 0, // Volume
          chips: row[6] || 0, // Chips
          buySellRatio: row[7] || 0, // BuySellRatio
          updatedAt: updatedAtDate || updatedAt // UpdatedAt（保存原始值或轉換後的值）
        };
      }
    });
    
    // 轉換為陣列
    const stocks = Object.values(stockMap);
    
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: '成功獲取股票記錄',
        data: {
          stocks: stocks
        }
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('handleGetUserStocks 錯誤: ' + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: '獲取股票記錄時發生錯誤: ' + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

#### 步驟 3：確認常量定義

確保您的 `Code.gs` 文件頂部有定義 `USER_STOCKS_SHEET_NAME` 常量：

```javascript
const USER_STOCKS_SHEET_NAME = 'UserStocks'; // Sheet 工作表名稱 (用於股票資料)
```

### 步驟 4：重新部署

**非常重要**：更新代碼後，您必須重新部署 Google Apps Script：

1. 在 Google Apps Script 編輯器中，點擊「部署」→「管理部署」
2. 找到現有的部署，點擊右側的「編輯」按鈕（鉛筆圖標）
3. 在彈出的對話框中，點擊「部署」按鈕
4. 等待部署完成

**注意**：如果沒有重新部署，新的代碼不會生效，您仍然會看到 `"未知的操作類型: getUserStocks"` 錯誤。

## 驗證更新

更新並重新部署後，請：

1. 刷新前端頁面
2. 使用 mike 帳號登入
3. 嘗試搜尋並儲存股票（例如 2317）
4. 確認股票出現在列表中

如果更新成功，您應該能夠：
- 登入後自動載入資料庫中的所有股票
- 儲存新股票後，股票會立即出現在列表中
- 刪除股票後，股票會從列表中移除

## 故障排除

如果更新後仍然出現錯誤：

1. **確認代碼已保存**：在 GAS 編輯器中點擊「保存」按鈕
2. **確認已重新部署**：必須重新部署才能生效
3. **檢查執行日誌**：在 GAS 編輯器中，點擊「執行」→「查看執行日誌」，檢查是否有錯誤
4. **確認常量定義**：確保 `SHEET_ID`、`SHEET_NAME` 和 `USER_STOCKS_SHEET_NAME` 都已正確定義

---

**最後更新**: 2025-12-16  
**相關文件**: `GAS_UPDATE_INSTRUCTIONS.md`, `STOCK_DATABASE_FEATURE.md`








