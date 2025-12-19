# Google Apps Script 權限設置說明

## 🎯 重要澄清

**設置「具有存取權的使用者」為「任何人」並不等於需要 Google 帳號認證！**

這是一個常見的誤解。讓我詳細說明：

---

## 📊 兩種權限的區別

### 1. 「具有存取權的使用者」（Who has access）

**這是關於「誰可以訪問 Web App URL」，與認證無關！**

| 設置 | 含義 | 是否需要 Google 登入 | CORS Headers |
|------|------|-------------------|-------------|
| **「任何人」** | **任何人都可以訪問（匿名）** | ❌ **不需要** | ✅ **自動添加** |
| 「僅限我自己」 | 只有您可以訪問 | ✅ 需要登入您的 Google 帳號 | ❌ 不添加 |

**關鍵點**：
- ✅ 設置為「任何人」= **允許匿名訪問**（不需要 Google 登入）
- ✅ 這是公開的 Web API（類似公開的 REST API）
- ✅ 訪問者不需要任何認證

---

### 2. 「執行身分」（Execute as）

**這是關於「腳本以誰的身份執行」（訪問您的 Google Sheets）**

| 設置 | 含義 | 影響 |
|------|------|------|
| **「我」** | 腳本以您的身份執行 | 可以訪問您的 Google Sheets |
| 「訪問使用者」 | 腳本以訪問者的身份執行 | 訪問者需要有訪問 Sheet 的權限 |

**關鍵點**：
- 「執行身分」=「我」只是表示**腳本本身**以您的身份運行
- **訪問者不需要登入或認證**
- 這是為了讓腳本有權限訪問您的 Google Sheets

---

## ✅ 推薦設置（解決 CORS + 無需訪問者認證）

### 完美組合：

```
執行身分：我（your-email@gmail.com）
具有存取權的使用者：任何人
```

### 這意味著：

1. ✅ **訪問者不需要 Google 帳號**（匿名訪問）
2. ✅ **不需要登入 Google**
3. ✅ **自動添加 CORS headers**（解決 CORS 問題）
4. ✅ **腳本可以訪問您的 Google Sheets**（因為以您的身份執行）

---

## 🔍 為什麼會有誤解？

### 誤解：「任何人」需要認證

**事實**：
- 「任何人」= 允許匿名訪問
- 訪問者**完全不需要** Google 帳號
- 就像訪問公開的 REST API 一樣

### 實際行為對比

#### 設置為「僅限我自己」：
```
訪問者 → 訪問 URL → 被重定向到 Google 登入頁面 → 需要登入 → 才能訪問
```
- ❌ 需要 Google 帳號認證
- ❌ 導致 CORS 錯誤（因為未認證的請求被重定向）

#### 設置為「任何人」：
```
訪問者 → 訪問 URL → 直接獲得 JSON 響應（無需登入）
```
- ✅ **不需要** Google 帳號認證
- ✅ **不需要** 登入
- ✅ CORS headers 自動添加

---

## 🎯 實際示例

### 當前推薦設置：

```
執行身分：我（your-email@gmail.com）
具有存取權的使用者：任何人
```

### 這會如何運作：

1. **用戶訪問您的網站**（不需要 Google 帳號）
2. **網站發送請求到 Apps Script URL**（不需要認證）
3. **Apps Script 以您的身份執行**（訪問您的 Google Sheets）
4. **返回 JSON 響應**（包含 CORS headers）

### 用戶體驗：

```
用戶在您的網站上
  ↓
點擊「登入」按鈕（輸入帳號，如：mike）
  ↓
前端發送 POST 請求到 Apps Script（無需 Google 認證）
  ↓
Apps Script 處理請求（以您的身份執行）
  ↓
寫入 Google Sheets
  ↓
返回成功響應
```

**整個過程中，用戶不需要 Google 帳號！**

---

## ⚠️ 常見問題

### Q1: 設置為「任何人」是否安全？

**安全性分析**：

✅ **相對安全的原因**：
1. **URL 包含隨機 ID**：不容易猜測
2. **只有知道 URL 的人才能訪問**：您不公開分享就安全
3. **執行身分仍然是「我」**：只能訪問您的 Sheets，不能訪問其他資源
4. **可以在代碼中添加驗證**：例如檢查請求來源、添加 API key 等

⚠️ **風險**：
1. 如果有人知道 URL，可以發送請求
2. 如果沒有額外驗證，可能被濫用

✅ **建議**：
- 不要在公開場合分享 Apps Script URL
- 考慮在代碼中添加簡單的驗證（例如 API key）
- 監控 Google Sheets 中的記錄

---

### Q2: 是否可以完全取消認證？

**回答**：
- ✅ **訪問者層面**：已經不需要認證（設置為「任何人」）
- ⚠️ **腳本執行層面**：仍需要「執行身分」=「我」來訪問您的 Sheets

**無法完全取消的原因**：
- Google Sheets 是您的私有資源
- 需要某種身份來訪問
- 「執行身分」=「我」提供了這個身份

**但這不影響用戶體驗**：
- 用戶不需要認證
- 這是後端的身份，對用戶透明

---

## 🔄 替代方案（如果需要更嚴格的控制）

### 方案 1: 添加 API Key 驗證

在 Apps Script 代碼中添加簡單的 API key 檢查：

```javascript
function doPost(e) {
  // 簡單的 API key 驗證
  const requestData = JSON.parse(e.postData.contents);
  
  // 檢查 API key（從環境變數或代碼中）
  const API_KEY = 'your-secret-api-key';
  if (requestData.apiKey !== API_KEY) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: '無效的 API key'
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  // 處理正常請求...
}
```

### 方案 2: 檢查請求來源

```javascript
function doPost(e) {
  // 檢查 Referer（可選，容易被偽造）
  const referer = e.parameter.referer;
  const allowedDomains = ['qwerboy-design.github.io'];
  
  // 簡單的來源檢查...
}
```

---

## ✅ 總結

### 關鍵要點：

1. ✅ **「具有存取權的使用者」設置為「任何人」** = **允許匿名訪問**
   - 用戶**不需要** Google 帳號
   - 用戶**不需要** 登入
   - 就像訪問公開的 REST API

2. ✅ **「執行身分」設置為「我」** = **腳本執行身份**
   - 這是後端身份（對用戶透明）
   - 用戶不需要知道或關心
   - 只是讓腳本能訪問您的 Google Sheets

3. ✅ **這是解決 CORS 問題的唯一方法**
   - Google 會自動添加 CORS headers
   - 無法通過代碼手動設置

### 推薦設置：

```
✅ 執行身分：我
✅ 具有存取權的使用者：任何人
```

**結果**：
- ✅ 用戶不需要 Google 帳號認證
- ✅ CORS 問題解決
- ✅ 功能正常運作

---

## 🔗 相關文檔

- `BACKEND_CORS_FIX.md` - 完整的後端 CORS 處理指南
- `GAS_302_REDIRECT_FIX.md` - 302 重定向問題解決
- `DEPLOYMENT_CHECKLIST.md` - 部署設置檢查清單

---

**最後更新**: 2025-12-16






