# 後端 CORS 快速修復指南

## 🎯 核心問題

**Google Apps Script 不支持手動設置 CORS headers！**

唯一的解決方法是：**將部署權限設置為「任何人」**

---

## ✅ 3 分鐘快速修復

### 步驟 1: 打開部署管理

1. 前往: https://script.google.com
2. 打開您的 Apps Script 專案
3. 點擊「部署」→「管理部署」

### 步驟 2: 編輯部署

1. 點擊部署右側的「編輯」圖標 ✏️

### 步驟 3: 設置關鍵選項

**「具有存取權的使用者」** → 選擇 **「任何人」** ← **這是最關鍵的！**

### 步驟 4: 重新部署

1. 點擊「部署」
2. 等待完成

---

## ✅ 驗證

在瀏覽器中訪問您的 Apps Script URL：
```
https://script.google.com/macros/s/YOUR_ID/exec
```

**應該看到**：
```json
{
  "success": true,
  "message": "Google Apps Script Web App 運行正常"
}
```

**如果看到 403 Forbidden 或 302 Found**：
- ❌ 部署權限設置錯誤
- ❌ `302 Found` 表示請求被重定向（通常是權限問題）
- ❌ 需要重新設置為「任何人」並重新部署

**詳細說明**：如果看到 `302 Found`，請參考 `GAS_302_REDIRECT_FIX.md`

---

## ⚠️ 重要說明

- ✅ Google Apps Script 會**自動添加** CORS headers（當部署權限為「任何人」時）
- ❌ **無法通過代碼手動設置** CORS headers
- ❌ `ContentService` API 不支持設置自定義 headers

---

**詳細說明**: 請參考 `BACKEND_CORS_FIX.md`

**最後更新**: 2025-12-16







