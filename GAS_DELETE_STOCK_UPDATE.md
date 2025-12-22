# Google Apps Script 刪除股票功能更新指南

**更新日期**: 2025-12-16  
**功能**: 修復刪除股票功能，確保刪除指定 UserId 和股票代號的所有記錄

---

## ⚠️ 重要：需要手動更新 Google Apps Script

本次更新修改了 Google Apps Script 後端代碼中的 `deleteStockRecord` 函數。**您需要手動將更新後的代碼複製到您的 Google Apps Script 專案中**。

---

## 📋 更新步驟

### 1. 打開 Google Apps Script 編輯器

1. 前往 https://script.google.com
2. 找到並打開您的專案（如果沒有，請參考 `GOOGLE_APPS_SCRIPT_SETUP.md` 創建新專案）

### 2. 更新 `deleteStockRecord` 函數

在編輯器中找到 `deleteStockRecord` 函數（約在第 612-652 行），將其替換為以下代碼：

```javascript
/**
 * 刪除股票記錄（刪除指定 UserId 和股票代號的所有記錄）
 */
function deleteStockRecord(sheet, userId, stockSymbol) {
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return {
      success: false,
      message: '沒有找到要刪除的記錄'
    };
  }
  
  // 從第2行開始查找（跳過表頭）
  const dataRange = sheet.getRange(2, 1, lastRow - 1, 2); // 只讀取 UserId 和 StockSymbol 列
  const values = dataRange.getValues();
  
  // 收集所有匹配的行號（使用陣列收集所有匹配的記錄）
  const rowsToDelete = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === userId && values[i][1] === stockSymbol) {
      rowsToDelete.push(i + 2); // +2 因為從第2行開始，且陣列索引從0開始
    }
  }
  
  if (rowsToDelete.length === 0) {
    return {
      success: false,
      message: '未找到對應的股票記錄'
    };
  }
  
  // 從後往前刪除（避免刪除後行號變化影響後續刪除）
  // 先對行號進行降序排序
  rowsToDelete.sort(function(a, b) { return b - a; });
  
  // 依次刪除每一行
  for (let i = 0; i < rowsToDelete.length; i++) {
    sheet.deleteRow(rowsToDelete[i]);
  }
  
  Logger.log('刪除股票記錄: ' + userId + ' - ' + stockSymbol + ' (共 ' + rowsToDelete.length + ' 筆)');
  
  return {
    success: true,
    message: '已成功刪除 ' + rowsToDelete.length + ' 筆股票記錄'
  };
}
```

### 3. 保存並重新部署

1. 點擊編輯器上方的「💾 儲存」按鈕（或按 `Ctrl+S`）
2. 點擊「部署」→「管理部署」
3. 找到現有部署，點擊「✏️ 編輯」圖標
4. 點擊「部署」按鈕（版本號會自動更新）

---

## 🔍 主要改進

### 修改前（只刪除第一筆）
```javascript
let rowToDelete = -1;
for (let i = 0; i < values.length; i++) {
  if (values[i][0] === userId && values[i][1] === stockSymbol) {
    rowToDelete = i + 2;
    break; // ❌ 只找到第一筆就跳出
  }
}
sheet.deleteRow(rowToDelete); // 只刪除一筆
```

### 修改後（刪除所有匹配記錄）
```javascript
const rowsToDelete = [];
for (let i = 0; i < values.length; i++) {
  if (values[i][0] === userId && values[i][1] === stockSymbol) {
    rowsToDelete.push(i + 2); // ✅ 收集所有匹配的行號
  }
}
rowsToDelete.sort(function(a, b) { return b - a; }); // 降序排序
for (let i = 0; i < rowsToDelete.length; i++) {
  sheet.deleteRow(rowsToDelete[i]); // ✅ 從後往前刪除所有記錄
}
```

---

## ✅ 功能驗證

更新後，請執行以下測試：

1. **測試刪除功能**：
   - 在網站中刪除一支股票
   - 檢查 Google Sheets 的 UserStocks 工作表
   - 確認該 UserId 和股票代號的所有記錄都被刪除

2. **檢查執行日誌**：
   - 在 Google Apps Script 編輯器中點擊「執行記錄」
   - 確認日誌顯示「刪除股票記錄: [UserId] - [股票代號] (共 X 筆)」

---

## 📝 技術說明

### 為什麼要從後往前刪除？

在 Google Sheets 中，當刪除一行時，後續行的行號會改變。例如：
- 刪除第 5 行後，原第 6 行變成第 5 行
- 如果先刪除前面的行，會導致後續行的索引失效

**解決方案**：先收集所有匹配的行號，排序後從後往前刪除，確保每次刪除的都是正確的行號。

---

## 🔗 相關文件

- **完整設置指南**: `GOOGLE_APPS_SCRIPT_SETUP.md`
- **更新代碼指南**: `GAS_UPDATE_INSTRUCTIONS.md`
- **部署狀態**: `DEPLOYMENT_STATUS.md`

---

**注意**: 如果您的 Google Apps Script 專案中的 `Code.gs` 文件內容與本地的 `google-apps-script/Code.gs` 不一致，建議複製整個文件內容進行完整更新，參考 `GAS_UPDATE_INSTRUCTIONS.md`。










