# 前端唯一鍵同步與自動刷新邏輯

## 修改日期
2025-12-16

## 修改摘要

調整前端邏輯以配合後端的唯一鍵處理機制，並實作每30秒自動從資料庫讀取最新股票清單。

## 核心變更

### 1. 移除自動儲存邏輯

**修改前**：
- 存在一個 `useEffect` 會自動監聽 `filteredAndSortedStocks` 變化
- 使用防抖（1.5秒）批量儲存新添加的股票
- 需要 `loadedStockSymbolsRef` 來追蹤已載入的股票，避免重複儲存

**修改後**：
- **移除自動儲存 `useEffect`**
- 原因：
  - 後端 `saveOrUpdateStock` 已經確保 `(UserId, StockSymbol)` 唯一鍵
  - 用戶收藏股票時（`toggleFavorite`）已經會調用 `saveStockToGAS`
  - 自動儲存會造成不必要的 API 請求

### 2. 添加每30秒自動刷新機制

**新增功能**：
```typescript
// 每30秒自動從資料庫讀取最新股票清單（確保資料同步）
useEffect(() => {
  if (!currentUser || !gasUrl) {
    return;
  }

  // 立即載入一次
  loadUserStocksFromDB(currentUser);

  // 設置每30秒自動刷新
  const intervalId = setInterval(() => {
    if (currentUser && gasUrl) {
      if (import.meta.env.DEV) {
        console.log('自動刷新資料庫股票清單...');
      }
      loadUserStocksFromDB(currentUser);
    }
  }, 30000); // 30秒 = 30000毫秒

  // 清理函數：組件卸載或依賴改變時清除定時器
  return () => {
    clearInterval(intervalId);
  };
}, [currentUser, gasUrl]);
```

**功能說明**：
- 當用戶登入且 GAS URL 配置後，立即載入一次股票清單
- 之後每30秒自動從資料庫讀取最新清單
- 確保多設備或外部更新後，前端能夠同步最新數據

### 3. 簡化儲存邏輯

**修改 `toggleFavorite` 函數**：

**修改前**：
```typescript
if (result.success) {
  // 將此股票標記為已載入（避免自動儲存重複寫入）
  loadedStockSymbolsRef.current.add(symbol);
  // ... 複雜的日誌邏輯
  await loadUserStocksFromDB(currentUser);
}
```

**修改後**：
```typescript
if (result.success) {
  if (import.meta.env.DEV) {
    console.log('股票已儲存/更新到資料庫:', symbol);
  }
  // 後端已經處理唯一鍵（UserId, StockSymbol），儲存或更新都會正確處理
  // 重新載入資料庫股票列表以顯示最新數據（30秒自動刷新也會確保同步）
  await loadUserStocksFromDB(currentUser);
}
```

**改進**：
- 移除不必要的 `loadedStockSymbolsRef` 追蹤
- 簡化日誌邏輯
- 明確說明後端已處理唯一鍵

## 資料同步流程

### 儲存流程

```
用戶收藏股票 (toggleFavorite)
    ↓
調用 saveStockToGAS (前端)
    ↓
後端 saveOrUpdateStock
    - 查找所有匹配 (UserId, StockSymbol) 的記錄
    - 刪除所有匹配記錄
    - 新增一筆新記錄（確保唯一性）
    ↓
前端重新載入清單 (loadUserStocksFromDB)
    ↓
更新 UI 顯示
```

### 自動同步流程

```
用戶登入
    ↓
立即載入一次 (loadUserStocksFromDB)
    ↓
設置 setInterval (每30秒)
    ↓
每30秒自動調用 loadUserStocksFromDB
    ↓
更新 userStocksFromDB 狀態
    ↓
UI 自動更新
```

## 唯一鍵保證

### 後端保證

- `saveOrUpdateStock` 函數確保每個 `(UserId, StockSymbol)` 組合只有一筆記錄
- 儲存或更新時，會先刪除所有匹配記錄，再新增一筆

### 前端配合

- 移除自動儲存邏輯，避免不必要的重複請求
- 每次收藏時調用 `saveStockToGAS`，後端自動處理儲存或更新
- 定期刷新確保資料同步

## 效能優化

### 減少 API 請求

- **修改前**：自動儲存 + 手動儲存 = 可能重複請求
- **修改後**：僅在用戶操作時儲存 + 定期刷新 = 更高效的請求模式

### 資料同步頻率

- **立即更新**：用戶儲存/刪除後立即重新載入
- **定期同步**：每30秒自動刷新，確保多設備同步

## 測試建議

### 測試場景

1. **儲存股票**：
   - 收藏一筆新股票
   - 預期：立即顯示在列表中，30秒後自動刷新確認

2. **更新股票**：
   - 再次收藏相同股票（不同價格）
   - 預期：後端更新記錄，前端顯示最新數據

3. **自動同步**：
   - 在其他設備或直接修改 Google Sheet
   - 預期：30秒內自動同步到前端

4. **多設備同步**：
   - 設備A儲存股票，設備B應在30秒內看到更新

## 相關檔案

- `src/App.tsx`：主要修改檔案
  - `toggleFavorite`：簡化儲存邏輯
  - 移除自動儲存 `useEffect`
  - 新增定期刷新 `useEffect`

- `google-apps-script/Code.gs`：後端唯一鍵處理（參考 `DATABASE_UNIQUE_KEY_FIX.md`）

## 備註

- `loadedStockSymbolsRef` 仍然保留在代碼中（用於追蹤已載入股票），但不再用於防止自動儲存
- 30秒的刷新間隔可以根據需求調整
- 如果需要在用戶不活動時暫停刷新，可以添加 `document.visibilityState` 檢測

---

**最後更新**: 2025-12-16  
**修改檔案**: `src/App.tsx`




