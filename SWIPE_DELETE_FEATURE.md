# 向左滑動刪除功能實作說明

## 功能概述

在股票清單中實現向左滑動刪除功能，允許用戶通過觸控或滑鼠拖動來刪除股票項目。

---

## 實作細節

### 1. 狀態管理

#### App.tsx

- **新增狀態**：`hiddenStocks` (Set<string>)
  - 存儲被刪除（隱藏）的股票代碼
  - 從 `localStorage` 載入和保存

- **新增函數**：
  - `loadHiddenStocksFromStorage()`: 從 localStorage 載入隱藏列表
  - `saveHiddenStocksToStorage()`: 保存隱藏列表到 localStorage
  - `handleDeleteStock()`: 處理股票刪除，將股票加入隱藏列表

- **過濾邏輯更新**：
  - 在 `filteredAndSortedStocks` 中過濾掉隱藏的股票
  - 不影響原始 `mockStocks` 數據

---

### 2. 滑動手勢實現

#### StockTable.tsx

**滑動手勢檢測**：
- **觸控設備**：使用 `touchstart`、`touchmove`、`touchend` 事件
- **桌面設備**：使用 `mousedown`、`mousemove`（全局監聽）、`mouseup` 事件

**滑動邏輯**：
- 向左滑動超過 50px：顯示刪除按鈕
- 向右滑動：恢復原狀（隱藏刪除按鈕）
- 點擊已滑動的行：恢復原狀

**狀態管理**：
- `swipedRow`: 追蹤當前滑動的行（股票代碼）
- `swipeStartRef`: 記錄滑動起始位置
- `isDragging`: 追蹤是否正在拖動（滑鼠）

---

### 3. UI 實現

**刪除按鈕**：
- 紅色背景（`bg-red-600`）
- 位於行的右側，寬度 80px
- 使用 `Trash2` 圖標（lucide-react）
- 使用 Framer Motion 實現滑入/滑出動畫

**動畫效果**：
- 滑動動畫：使用 spring 動畫（stiffness: 300, damping: 30）
- 刪除動畫：使用 `AnimatePresence` 實現淡出效果
- 平滑的過渡效果

---

### 4. 刪除行為

**刪除方式**：
1. 向左滑動股票行
2. 顯示紅色刪除按鈕
3. 點擊刪除按鈕確認刪除

**刪除效果**：
- ✅ 從當前顯示列表中移除
- ✅ 保存到 localStorage（持久化）
- ✅ 不影響原始 `mockStocks` 數據
- ✅ 重新載入頁面後仍然隱藏

---

## 技術實現

### 組件結構

```typescript
// 股票行容器
<div className="relative overflow-hidden">
  {/* 刪除按鈕（滑入/滑出） */}
  <motion.div animate={{ x: isSwiped ? -80 : 0 }}>
    <button onClick={handleDelete}>刪除</button>
  </motion.div>

  {/* 股票行內容（滑動） */}
  <motion.div animate={{ x: isSwiped ? -80 : 0 }}>
    {/* 股票資訊 */}
  </motion.div>
</div>
```

---

### 關鍵代碼片段

#### 滑動手勢檢測

```typescript
// 觸控開始
const handleTouchStart = (e: React.TouchEvent, symbol: string) => {
  const touch = e.touches[0];
  swipeStartRef.current = { x: touch.clientX, symbol };
};

// 觸控移動
const handleTouchMove = (e: React.TouchEvent, symbol: string) => {
  const deltaX = touch.clientX - swipeStartRef.current.x;
  if (deltaX < -50) {
    setSwipedRow(symbol); // 顯示刪除按鈕
  }
};

// 滑鼠拖動（全局監聽）
useEffect(() => {
  const handleGlobalMouseMove = (e: MouseEvent) => {
    // 處理滑鼠拖動邏輯
  };
  document.addEventListener('mousemove', handleGlobalMouseMove);
  return () => document.removeEventListener('mousemove', handleGlobalMouseMove);
}, [isDragging]);
```

---

### 動畫配置

```typescript
// 滑動動畫
animate={{
  x: isSwiped ? -80 : 0
}}
transition={{
  type: 'spring',
  stiffness: 300,
  damping: 30
}}

// 刪除動畫
exit={{
  opacity: 0,
  x: 20
}}
```

---

## 用戶體驗

### 操作流程

1. **向左滑動**（觸控或滑鼠拖動）：
   - 手指/滑鼠向左移動超過 50px
   - 股票行向左滑動，顯示紅色刪除按鈕

2. **刪除確認**：
   - 點擊紅色刪除按鈕
   - 股票從列表中移除（帶有淡出動畫）

3. **取消滑動**：
   - 向右滑動或點擊已滑動的行
   - 股票行恢復原狀

---

## 設備支持

### ✅ 觸控設備（手機、平板）

- 使用原生觸控事件
- 響應流暢
- 符合移動端用戶習慣

### ✅ 桌面設備（滑鼠）

- 使用滑鼠拖動
- 全局事件監聽確保流暢體驗
- 支持滑鼠離開元素後繼續追蹤

---

## 數據持久化

### localStorage 鍵名

```typescript
HIDDEN_STOCKS_STORAGE_KEY = 'gemini-fintech-hidden-stocks'
```

### 存儲格式

```json
["2317", "2330", "2454"]
```

### 持久化邏輯

- 刪除時立即保存到 localStorage
- 頁面載入時自動恢復隱藏列表
- 確保用戶體驗的一致性

---

## 特性總結

✅ **雙平台支持**：觸控和滑鼠拖動  
✅ **流暢動畫**：使用 Framer Motion spring 動畫  
✅ **數據持久化**：使用 localStorage 保存狀態  
✅ **非破壞性**：不影響原始數據，僅隱藏顯示  
✅ **用戶友好**：符合直覺的操作方式  
✅ **響應式設計**：適配各種屏幕尺寸  

---

## 相關文件

- `src/components/StockTable.tsx` - 滑動手勢實現
- `src/App.tsx` - 狀態管理和數據過濾
- `src/types/stock.ts` - 股票類型定義

---

**最後更新**: 2025-12-16








