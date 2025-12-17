# Google Apps Script 後端 CORS 處理指南

## 🚨 重要說明

**Google Apps Script 不支持手動設置 CORS headers！**

這是 Google Apps Script 的一個**平台限制**。與標準後端服務器不同，您無法在代碼中手動設置 `Access-Control-Allow-Origin` 等 CORS headers。

---

## ✅ 唯一解決方案：部署權限設置

**Google Apps Script 的 CORS headers 是根據部署權限自動添加的**：

| 部署權限設置 | CORS Headers | 結果 |
|------------|-------------|------|
| **「任何人」** | ✅ **自動添加** | ✅ 支持跨域請求 |
| 「僅限我自己」 | ❌ **不會添加** | ❌ CORS 錯誤 |

---

## 📝 完整設置步驟

### 步驟 1: 打開 Google Apps Script 編輯器

1. **前往**: https://script.google.com
2. **登入**您的 Google 帳號
3. **找到並打開您的專案**（例如：CursorFintech）

---

### 步驟 2: 進入部署管理

1. **點擊左側選單的「部署」**（Deploy）
2. **點擊「管理部署」**（Manage deployments）
   - 如果還沒有部署，點擊「新增部署」（New deployment）

---

### 步驟 3: 編輯部署設置

1. **找到現有的部署**（應該會看到一個 Web App URL）
2. **點擊部署右側的「編輯」圖標**（鉛筆圖標 ✏️）

---

### 步驟 4: 配置關鍵設置

在部署設置對話框中，確保以下設置：

#### 1. **執行身分**（Execute as）
```
選擇：我（your-email@gmail.com）
```
- 這確保腳本以您的身份執行
- 這是訪問 Google Sheets 的必要設置

#### 2. **具有存取權的使用者**（Who has access）
```
選擇：任何人（Anyone） ← 這是最關鍵的設置！
```

⚠️ **這是解決 CORS 問題的關鍵！**

- ✅ **選擇「任何人」**：Google 會自動添加 CORS headers，允許跨域請求
- ❌ **選擇「僅限我自己」**：Google 不會添加 CORS headers，會導致 CORS 錯誤

---

### 步驟 5: 重新部署

1. **點擊「部署」**（Deploy）按鈕
2. **等待部署完成**（通常幾秒鐘）
3. **確認新的部署 URL**（URL 應該保持不變，但版本會更新）

---

## 🔍 驗證設置是否正確

### 方法 1: 檢查部署設置

1. **返回「管理部署」頁面**
2. **確認「具有存取權的使用者」顯示為「任何人」**

### 方法 2: 測試 GET 請求

在瀏覽器中直接訪問您的 Google Apps Script URL：

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

**預期結果（成功）**：
```json
{
  "success": true,
  "message": "Google Apps Script Web App 運行正常",
  "timestamp": "2025-12-16T..."
}
```

**如果看到 403 Forbidden 或 302 Found**：
- ❌ 部署權限可能不是「任何人」
- ❌ 302 Found 表示請求被重定向（通常是權限問題）
- ❌ 需要重新檢查步驟 4

**詳細說明**：如果看到 `302 Found` 狀態碼，請參考 `GAS_302_REDIRECT_FIX.md`

---

### 方法 3: 檢查 Network Headers

1. **打開瀏覽器開發者工具**（F12）
2. **切換到 Network 標籤**
3. **訪問您的 Google Apps Script URL**（GET 請求）
4. **點擊請求，查看 Response Headers**

**如果設置正確，應該看到**：
```
Access-Control-Allow-Origin: *
```

**如果沒有這個 header**：
- ❌ 部署權限可能不是「任何人」
- ❌ 需要重新設置部署權限

---

## ⚠️ 為什麼無法手動設置 CORS Headers？

### Google Apps Script 的限制

**標準後端（如 Node.js/Express）**：
```javascript
// 可以手動設置 CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

**Google Apps Script**：
```javascript
// ❌ 不支持！無法手動設置 headers
function doPost(e) {
  // ContentService.createTextOutput() 不支持設置自定義 headers
  const output = ContentService.createTextOutput(...);
  // ❌ output.setHeader('Access-Control-Allow-Origin', '*') // 不存在此方法
  return output;
}
```

### 技術原因

1. **ContentService API 限制**：
   - `ContentService.createTextOutput()` 只支持設置 `MimeType`
   - 不支持設置自定義 HTTP headers

2. **平台架構**：
   - Google Apps Script 運行在 Google 的服務器上
   - HTTP 響應頭由 Google 的基礎設施控制
   - 開發者無法直接操縱 HTTP 響應頭

3. **安全設計**：
   - Google 通過部署權限來控制 CORS headers
   - 這是為了確保安全性

---

## 🔄 代碼檢查清單

即使無法手動設置 CORS headers，確保您的代碼正確處理請求：

### ✅ doGet 函數（GET 請求）

```javascript
function doGet(e) {
  const output = ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      message: 'Google Apps Script Web App 運行正常',
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
  
  return output; // Google 會根據部署權限自動添加 CORS headers
}
```

### ✅ doPost 函數（POST 請求）

```javascript
function doPost(e) {
  try {
    // 解析請求數據（支持 text/plain 和 application/json）
    const requestData = JSON.parse(e.postData.contents);
    
    // 處理業務邏輯
    const result = {
      success: true,
      data: requestData
    };
    
    // 返回 JSON 響應
    return ContentService.createTextOutput(
      JSON.stringify(result)
    ).setMimeType(ContentService.MimeType.JSON);
    
    // Google 會根據部署權限自動添加 CORS headers
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### ❌ 錯誤示例（不要這樣做）

```javascript
function doPost(e) {
  // ❌ 不存在的方法
  const output = ContentService.createTextOutput(...);
  output.setHeader('Access-Control-Allow-Origin', '*'); // ❌ 不存在
  return output;
}
```

---

## 📊 部署權限對比

| 設置 | 執行身分 | 具有存取權的使用者 | CORS Headers | 跨域請求 |
|------|---------|----------------|-------------|---------|
| ✅ **推薦** | 我 | **任何人** | ✅ 自動添加 | ✅ 支持 |
| ⚠️ 僅本地測試 | 我 | 僅限我自己 | ❌ 不添加 | ❌ 不支持 |
| ❌ 不安全 | 訪問使用者 | 任何人 | ✅ 自動添加 | ✅ 支持（但不推薦） |

---

## 🎯 完整解決流程

### 1. 後端設置（必須完成）✅

1. ✅ 確保 Google Apps Script 代碼正確
2. ✅ **設置部署權限為「任何人」** ← **關鍵步驟！**
3. ✅ 重新部署
4. ✅ 驗證部署 URL 正確

### 2. 前端優化（已完成）✅

1. ✅ 使用簡單請求（無 headers）
2. ✅ 備用方案：使用 text/plain
3. ✅ 增強錯誤處理

### 3. 測試驗證

1. ✅ 清除瀏覽器快取
2. ✅ 測試登入功能
3. ✅ 檢查 Network Headers
4. ✅ 確認無 CORS 錯誤

---

## 🔗 相關文檔

- `FRONTEND_CORS_FIX.md` - 前端 CORS 解決方案
- `CORS_QUICK_FIX.md` - 快速修復指南
- `LOGIN_TROUBLESHOOTING.md` - 完整故障排除指南
- `GAS_CORS_FIX.md` - Google Apps Script CORS 詳解

---

## ✅ 總結

**後端（Google Apps Script）解決 CORS 的唯一方法**：

1. ✅ **將部署權限設置為「任何人」**
   - 這是**必須的**步驟
   - Google 會自動添加 CORS headers
   - 無法通過代碼手動設置

2. ✅ **確保代碼正確處理請求**
   - 使用 `ContentService.createTextOutput()`
   - 設置正確的 `MimeType`
   - 返回 JSON 格式響應

3. ⚠️ **前端優化只是輔助**
   - 前端優化可以提高成功率
   - 但後端部署權限設置是**必須的**

**關鍵點**：**部署權限設置為「任何人」是解決 CORS 問題的關鍵，無法通過代碼繞過！**

---

**最後更新**: 2025-12-16
