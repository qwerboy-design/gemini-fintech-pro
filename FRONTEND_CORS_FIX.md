# 前端 CORS 解決方案

## 🎯 問題

從瀏覽器控制台可以看到 CORS 錯誤：
```
Access to fetch at 'https://script.google.com/macros/s/...' from origin 'https://qwerboy-design.github.io' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

即使已經實現了 `Content-Type: text/plain` 的 workaround，仍然出現 CORS 錯誤。

---

## ✅ 前端解決方案

### 策略 1: 完全不設置 Content-Type Header（優先使用）

**原理**：
- 不設置任何自定義 headers，讓瀏覽器自動處理
- 這樣會變成最簡單的請求（Simple Request）
- 完全避免 CORS 預檢請求（OPTIONS）

**實現**：
```typescript
response = await fetch(gasUrl, {
  method: 'POST',
  // 關鍵：不設置任何 headers
  body: JSON.stringify(requestData),
  mode: 'cors',
});
```

---

### 策略 2: 使用 text/plain Content-Type（備用方案）

**原理**：
- `text/plain` 是簡單請求允許的 Content-Type
- 不會觸發預檢請求
- body 仍然是 JSON 字符串，後端可以正常解析

**實現**：
```typescript
response = await fetch(gasUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain;charset=utf-8',
  },
  body: JSON.stringify(requestData),
  mode: 'cors',
});
```

---

## 🔄 雙重策略實現

代碼會自動嘗試兩種方法：

1. **首先嘗試策略 1**（無 headers）
2. **如果失敗，自動切換到策略 2**（text/plain）
3. **如果兩種方法都失敗**，顯示詳細的錯誤訊息

**優點**：
- ✅ 提高成功率
- ✅ 自動降級處理
- ✅ 用戶友好的錯誤提示

---

## 📝 已更新的文件

### 1. `src/components/LoginModal.tsx`

**主要更改**：
- 實現雙重策略（無 headers → text/plain）
- 增強錯誤處理和用戶提示
- 提供明確的 Google Apps Script 部署設置指導

**關鍵代碼**：
```typescript
let response: Response | null = null;
let fetchError: unknown = null;

// 策略 1: 完全不設置 Content-Type
try {
  response = await fetch(gasUrl, {
    method: 'POST',
    body: requestBody,
    mode: 'cors',
  });
} catch (firstError) {
  // 策略 2: 使用 text/plain
  try {
    response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: requestBody,
      mode: 'cors',
    });
  } catch (secondError) {
    // 兩種方法都失敗，顯示詳細錯誤
    fetchError = secondError;
  }
}
```

---

### 2. `src/services/gasService.ts`

**主要更改**：
- 同步實現雙重策略
- 保持與 `LoginModal.tsx` 一致的邏輯

---

## ⚠️ 重要提醒

### 前端解決方案的限制

**前端只能優化請求方式，但無法完全解決 CORS 問題！**

CORS 的最終解決仍然需要後端（Google Apps Script）的正確設置：

1. ✅ **部署權限必須設置為「任何人」**
   - 前往 Google Apps Script 編輯器
   - 點擊「部署」→「管理部署」
   - 編輯部署，設置「具有存取權的使用者」為「任何人」
   - 點擊「重新部署」

2. ✅ **執行身分必須設置為「我」**
   - 在部署設置中確認「執行身分」為「我」

### 為什麼前端解決方案不夠？

即使使用了簡單請求（無預檢），瀏覽器仍然會：
- 檢查響應中的 `Access-Control-Allow-Origin` header
- 如果後端沒有正確設置，請求仍然會被阻止

**Google Apps Script 的特殊性**：
- 當部署權限設置為「任何人」時，GAS 會**自動添加**必要的 CORS headers
- 當部署權限不是「任何人」時，GAS **不會**自動添加 CORS headers
- GAS 不支持手動設置 CORS headers（不像標準後端服務器）

---

## 🎯 完整解決流程

### 步驟 1: 前端優化（已完成）✅

- ✅ 實現雙重策略
- ✅ 增強錯誤處理
- ✅ 提供用戶友好的錯誤提示

### 步驟 2: 後端設置（必須完成）⚠️

1. **前往 Google Apps Script 編輯器**
2. **點擊「部署」→「管理部署」**
3. **編輯現有部署**
4. **確認設置**：
   - 「執行身分」：我
   - 「具有存取權的使用者」：**任何人** ← **這是最關鍵的！**
5. **點擊「重新部署」**
6. **等待部署完成**

### 步驟 3: 測試

1. **清除瀏覽器快取**（Ctrl+Shift+R 或 Cmd+Shift+R）
2. **訪問網站**：https://qwerboy-design.github.io/gemini-fintech-pro/
3. **嘗試登入**
4. **檢查結果**：
   - ✅ 成功：無 CORS 錯誤，登入正常
   - ❌ 失敗：檢查瀏覽器控制台，確認是否仍有 CORS 錯誤

---

## 🔍 診斷工具

### 檢查 Network 請求

1. **打開瀏覽器開發者工具**（F12）
2. **切換到 Network 標籤**
3. **嘗試登入**
4. **檢查對 Google Apps Script 的請求**：
   - **請求 Headers**：查看是否包含自定義 Content-Type
   - **響應 Headers**：查看是否包含 `Access-Control-Allow-Origin`
   - **狀態碼**：確認是 200 還是 403/404

---

## 📚 相關文檔

- `CORS_WORKAROUND.md` - text/plain workaround 詳細說明
- `CORS_QUICK_FIX.md` - 快速修復 CORS 錯誤指南
- `LOGIN_TROUBLESHOOTING.md` - 完整的故障排除指南
- `GAS_CORS_FIX.md` - Google Apps Script CORS 問題詳解

---

## ✅ 總結

**前端已優化**：
- ✅ 實現了雙重策略（無 headers → text/plain）
- ✅ 增強了錯誤處理和用戶提示
- ✅ 提高了請求成功率

**仍需後端設置**：
- ⚠️ **必須將 Google Apps Script 部署權限設置為「任何人」**
- ⚠️ 這是解決 CORS 問題的**關鍵步驟**

前端優化可以提高成功率，但後端設置是**必須的**！

---

**最後更新**: 2025-12-16





