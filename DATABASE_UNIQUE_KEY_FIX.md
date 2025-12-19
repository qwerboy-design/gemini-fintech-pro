# 資料庫唯一鍵修正：saveOrUpdateStock 函數

## 修改日期
2025-12-16

## 問題描述

原本的 `saveOrUpdateStock` 函數實作有以下問題：

1. **只更新第一筆記錄**：當資料庫中存在多筆相同 `(UserId, StockSymbol)` 的記錄時，只更新第一筆，其他歷史記錄保留
2. **違反唯一性約束**：理論上 `(UserId, StockSymbol)` 應該作為唯一鍵，但實作允許多筆重複記錄存在
3. **資料不一致**：可能導致同一股票有多筆不同時間的記錄，造成資料混淆

## 修改內容

### 新的邏輯流程

修改後的 `saveOrUpdateStock` 函數實作以下邏輯：

1. **查找所有匹配記錄**：
   - 查找所有 `UserId === data.userId` 且 `StockSymbol === data.stock.symbol` 的記錄
   - 保存第一筆記錄的 `CreatedAt` 值（如果存在）

2. **刪除所有匹配記錄**：
   - 收集所有匹配記錄的行號
   - 從後往前刪除（避免行號變化影響後續刪除）
   - 確保刪除所有歷史記錄

3. **新增一筆新記錄**：
   - 無論是新增還是更新，都使用 `appendRow()` 新增
   - `CreatedAt`：如果原有記錄存在，使用原有值；否則使用當前時間
   - `UpdatedAt`：總是使用當前時間

### 核心改進

**修改前**：
```javascript
// 只查找第一筆，只更新第一筆
for (let i = 0; i < values.length; i++) {
  if (values[i][0] === userId && values[i][1] === stock.symbol) {
    existingRow = i + 2;
    break; // ⚠️ 只找第一筆
  }
}

if (existingRow === -1) {
  sheet.appendRow(rowData); // 新增
} else {
  sheet.getRange(existingRow, 1, 1, 10).setValues([rowData]); // 只更新第一筆
}
```

**修改後**：
```javascript
// 查找所有匹配記錄
const rowsToDelete = [];
let existingCreatedAt = null;

for (let i = 0; i < values.length; i++) {
  if (values[i][0] === userId && values[i][1] === stock.symbol) {
    rowsToDelete.push(i + 2);
    if (existingCreatedAt === null && values[i][8]) {
      existingCreatedAt = values[i][8]; // 保存第一筆的 CreatedAt
    }
    isUpdate = true;
  }
}

// 刪除所有匹配記錄（從後往前）
if (rowsToDelete.length > 0) {
  rowsToDelete.sort(function(a, b) { return b - a; });
  for (let i = 0; i < rowsToDelete.length; i++) {
    sheet.deleteRow(rowsToDelete[i]);
  }
}

// 新增記錄（確保唯一性）
sheet.appendRow(rowData);
```

## 唯一性保證

### 修改後的保證

1. **刪除所有舊記錄**：在新增前先刪除所有匹配 `(UserId, StockSymbol)` 的記錄
2. **只保留一筆記錄**：新增後，資料庫中只會有一筆該組合的記錄
3. **保留原始建立時間**：如果之前有記錄，`CreatedAt` 保持原值；否則使用當前時間

### CreatedAt 處理邏輯

```javascript
// 保存原有記錄的 CreatedAt（如果存在）
if (existingCreatedAt === null && values[i][8]) {
  existingCreatedAt = values[i][8];
}

// 使用原有 CreatedAt 或當前時間
const createdAt = existingCreatedAt || now;
```

## 影響範圍

### 資料庫結構

- **修改前**：可能有多筆 `(UserId, StockSymbol)` 相同的記錄
- **修改後**：確保每個 `(UserId, StockSymbol)` 組合只有一筆記錄

### 查詢性能

- **改進**：`handleGetUserStocks` 不再需要過濾多筆記錄（雖然仍有過濾邏輯作為防護）

### 資料完整性

- **改進**：確保資料一致性，每個用戶的每支股票只有最新一筆記錄

## 測試建議

### 測試場景

1. **新增記錄**：
   - 儲存一筆不存在的股票記錄
   - 預期：新增成功，`CreatedAt` 和 `UpdatedAt` 都是當前時間

2. **更新記錄**：
   - 儲存一筆已存在的股票記錄
   - 預期：刪除舊記錄，新增新記錄，`CreatedAt` 保持原值，`UpdatedAt` 更新為當前時間

3. **多筆歷史記錄**：
   - 如果資料庫中存在多筆相同 `(UserId, StockSymbol)` 的記錄
   - 預期：刪除所有舊記錄，只保留一筆新記錄

4. **批量儲存**：
   - 同時儲存多筆不同的股票
   - 預期：每筆都正確儲存，互不影響

## 部署步驟

1. **更新 Google Apps Script**：
   - 打開 `google-apps-script/Code.gs` 文件
   - 複製修改後的 `saveOrUpdateStock` 函數
   - 貼上到 Google Apps Script 編輯器

2. **保存並重新部署**：
   - 點擊「保存」按鈕
   - 點擊「部署」→「管理部署」
   - 編輯現有部署，點擊「重新部署」

3. **驗證**：
   - 測試儲存和更新功能
   - 檢查 Google Sheet，確認每組 `(UserId, StockSymbol)` 只有一筆記錄

## 相關函數

- `saveOrUpdateStock`: 修改的核心函數
- `deleteStockRecord`: 參考了此函數的刪除邏輯（從後往前刪除）

## 備註

- 此修改不會影響現有的 `deleteStockRecord` 函數
- `handleGetUserStocks` 的過濾邏輯仍然保留（作為防護措施）
- 此修改向後兼容：如果資料庫中已有重複記錄，下次儲存時會自動清理

---

**最後更新**: 2025-12-16  
**修改檔案**: `google-apps-script/Code.gs` (函數: `saveOrUpdateStock`)




