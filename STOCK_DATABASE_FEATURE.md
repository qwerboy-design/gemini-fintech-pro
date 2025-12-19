# 股票資料庫儲存功能實作說明

## 功能概述

實作用戶股票資訊儲存到 Google Sheets 資料庫，包括：
- 自動儲存列表中顯示的股票資訊
- 刪除股票時同步刪除資料庫記錄
- 刪除確認對話框

---

## 資料庫結構

### Google Sheets 工作表：`UserStocks`

**表頭欄位**：
| 欄位 | 說明 | 類型 |
|------|------|------|
| UserId | 用戶ID | 文字 |
| StockSymbol | 股票代號 | 文字 |
| StockName | 股票名稱 | 文字 |
| Price | 價格 | 數字 |
| Change | 變化百分比 | 數字 |
| Volume | 成交量 | 數字（可選） |
| Chips | 大戶比 | 數字（可選） |
| BuySellRatio | 買賣比 | 數字（可選） |
| CreatedAt | 建立時間 | ISO 日期時間 |
| UpdatedAt | 更新時間 | ISO 日期時間 |

---

## 技術實作

### 1. Google Apps Script 後端

#### 新增函數

**`handleSaveStock(data)`**：
- 功能：根據 UserId + StockSymbol 查找記錄
- 存在則更新（保留 CreatedAt，更新 UpdatedAt）
- 不存在則新增
- 自動創建 `UserStocks` 工作表（如果不存在）

**`handleDeleteStock(data)`**：
- 功能：根據 UserId + StockSymbol 刪除對應行
- 返回成功/失敗訊息

**`initializeUserStocksSheet(ss)`**：
- 功能：初始化 `UserStocks` 工作表
- 設置表頭、格式化、列寬

**`saveOrUpdateStock(sheet, data)`**：
- 功能：保存或更新股票記錄的核心邏輯
- 查找現有記錄（UserId + StockSymbol）
- 執行新增或更新操作

**`deleteStockRecord(sheet, userId, stockSymbol)`**：
- 功能：刪除股票記錄的核心邏輯
- 查找並刪除對應行

#### API 端點

- **POST** `action: 'saveStock'`
  - 請求體：`{ action: 'saveStock', userId: string, stock: StockData }`
  - 響應：`{ success: boolean, message: string, action?: 'created' | 'updated' }`

- **POST** `action: 'deleteStock'`
  - 請求體：`{ action: 'deleteStock', userId: string, stockSymbol: string }`
  - 響應：`{ success: boolean, message: string }`

---

### 2. 前端服務層

#### 新增函數（`src/services/gasService.ts`）

**`saveStockToGAS(url, userId, stock)`**：
- 發送 POST 請求保存股票資訊
- 使用雙重策略 CORS 處理（無 headers → text/plain）
- 返回 `GasResponse`

**`deleteStockFromGAS(url, userId, stockSymbol)`**：
- 發送 POST 請求刪除股票
- 使用雙重策略 CORS 處理
- 返回 `GasResponse`

#### 新增類型定義

- `StockData`：股票資料介面
- `SaveStockRequest`：儲存請求介面
- `DeleteStockRequest`：刪除請求介面

---

### 3. 前端業務邏輯（`src/App.tsx`）

#### 自動儲存功能

**觸發時機**：
- 用戶已登入
- 股票列表更新（`filteredAndSortedStocks` 改變）
- 1.5 秒防抖延遲（避免過多請求）

**實作方式**：
```typescript
useEffect(() => {
  if (!currentUser || !gasUrl || filteredAndSortedStocks.length === 0) {
    return;
  }

  const timeoutId = setTimeout(async () => {
    // 批量儲存所有股票（並行執行）
    const savePromises = stocksToSave.map(stock =>
      saveStockToGAS(gasUrl, currentUser, stock)
    );
    await Promise.all(savePromises);
  }, 1500);

  return () => clearTimeout(timeoutId);
}, [filteredAndSortedStocks, currentUser, gasUrl]);
```

**儲存策略**：
- 批量並行儲存（提高效率）
- 個別錯誤不影響其他股票
- 僅在開發環境輸出詳細日誌

#### 刪除功能增強

**確認對話框**：
- 使用 `window.confirm` 顯示確認訊息
- 顯示股票名稱和代號
- 用戶確認後才執行刪除

**刪除流程**：
1. 顯示確認對話框
2. 用戶確認後：
   - 如果已登入：調用 `deleteStockFromGAS` 刪除資料庫記錄
   - 更新 `hiddenStocks` 狀態（本地隱藏）
   - 更新 localStorage（持久化）

**錯誤處理**：
- 資料庫刪除失敗不影響本地刪除
- 確保用戶體驗流暢

---

## 資料流程

### 自動儲存流程

```
用戶登入
  ↓
股票列表顯示/更新
  ↓
useEffect 監聽 filteredAndSortedStocks 變化
  ↓
防抖 1.5 秒
  ↓
批量並行儲存所有股票到 GAS
  ↓
GAS 處理（saveOrUpdateStock）
  ↓
寫入/更新 Google Sheets UserStocks 工作表
```

### 刪除流程

```
用戶向左滑動股票行
  ↓
顯示刪除按鈕
  ↓
點擊刪除按鈕
  ↓
顯示確認對話框
  ↓
用戶確認
  ↓
調用 deleteStockFromGAS（如果已登入）
  ↓
GAS 處理（deleteStockRecord）
  ↓
從 Google Sheets 刪除記錄
  ↓
更新 hiddenStocks 狀態
  ↓
更新 localStorage
  ↓
UI 更新（股票從列表中隱藏）
```

---

## 錯誤處理

### 網路錯誤
- 自動儲存：靜默失敗，不影響 UI
- 刪除：資料庫刪除失敗時，仍然執行本地刪除

### API 錯誤
- 記錄錯誤日誌（開發環境）
- 顯示用戶友好的錯誤訊息（可選）

### 未登入狀態
- 自動儲存：自動跳過
- 刪除：僅執行本地刪除

---

## 性能優化

### 防抖（Debounce）
- **延遲時間**：1.5 秒
- **目的**：避免頻繁的 API 請求
- **場景**：股票列表快速變化時

### 批量儲存
- **策略**：並行執行（`Promise.all`）
- **優勢**：提高儲存效率
- **容錯**：個別失敗不影響其他

### 條件觸發
- 僅在用戶登入時觸發自動儲存
- 僅在有股票時執行儲存操作

---

## 使用者體驗

### 自動儲存
- **無感知**：後台自動執行，不影響用戶操作
- **可靠性**：即使部分失敗也不影響整體體驗

### 刪除確認
- **安全性**：確認對話框防止誤刪
- **資訊清晰**：顯示股票名稱和代號
- **即時反饋**：刪除後立即從列表移除

---

## 配置要求

### Google Apps Script

1. **工作表配置**：
   - Sheet ID：已配置
   - 工作表名稱：`UserStocks`（自動創建）

2. **部署權限**：
   - 執行身分：我
   - 具有存取權的使用者：**任何人**（必須，否則 CORS 錯誤）

3. **環境變數**：
   - 前端：`VITE_GAS_URL`（`.env` 和 GitHub Secrets）

---

## 測試建議

### 功能測試

1. **自動儲存**：
   - 登入後，觀察 Google Sheets 是否自動新增股票記錄
   - 修改股票列表（搜索、過濾），確認更新記錄
   - 重新載入頁面，確認記錄持續存在

2. **刪除功能**：
   - 點擊刪除按鈕，確認顯示確認對話框
   - 確認後，檢查 Google Sheets 是否刪除記錄
   - 確認股票從列表中隱藏

3. **錯誤處理**：
   - 斷網測試：確認自動儲存失敗不影響 UI
   - 未登入測試：確認僅執行本地操作

---

## 相關文件

- `google-apps-script/Code.gs` - 後端 API 實作
- `src/services/gasService.ts` - 前端服務函數
- `src/App.tsx` - 業務邏輯整合
- `src/types/stock.ts` - 股票類型定義

---

**最後更新**: 2025-12-16





