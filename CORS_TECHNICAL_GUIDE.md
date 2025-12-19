# CORS Headers 技術指南

## 📚 標準後端 CORS 設置

### 標準做法（適用於 Node.js, Python Flask/Django, PHP 等）

對於標準後端，應該在 Response Headers 中手動設置以下 CORS headers：

```javascript
// Node.js Express 示例
app.use((req, res, next) => {
  // 允許的來源（可以是特定域名或 * 表示所有域名）
  res.header('Access-Control-Allow-Origin', 'https://qwerboy-design.github.io');
  
  // 允許攜帶認證資訊（cookies, authorization headers）
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // 允許的 HTTP 方法
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // 允許的請求標頭
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // 預檢請求的緩存時間（秒）
  res.header('Access-Control-Max-Age', '3600');
  
  // 處理 OPTIONS 預檢請求
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
```

### 關鍵 CORS Headers 說明

#### 1. `Access-Control-Allow-Origin`
指定允許的來源。登入相關設置需要特別注意：

```javascript
// 允許特定來源（推薦用於生產環境）
'Access-Control-Allow-Origin': 'https://qwerboy-design.github.io'

// 允許所有來源（僅用於開發或公開 API）
'Access-Control-Allow-Origin': '*'
```

**注意**: 如果設置了 `Access-Control-Allow-Credentials: true`，則**不能**使用 `*`，必須明確指定域名。

#### 2. `Access-Control-Allow-Credentials`
允許攜帶認證資訊（cookies, authorization headers）：

```javascript
'Access-Control-Allow-Credentials': 'true'
```

#### 3. `Access-Control-Allow-Headers`
指定允許的請求標頭：

```javascript
'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
```

對於登入功能，通常需要：
- `Content-Type`: JSON 數據
- `Authorization`: Bearer token（如果有）
- `X-Requested-With`: 某些框架需要

#### 4. `Access-Control-Allow-Methods`
指定允許的 HTTP 方法：

```javascript
'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
```

對於登入功能，至少需要 `POST` 和 `OPTIONS`。

#### 5. `Access-Control-Max-Age`
預檢請求的緩存時間（秒）：

```javascript
'Access-Control-Max-Age': '3600'  // 1 小時
```

---

## ⚠️ Google Apps Script 的特殊限制

### 重要限制

**Google Apps Script `ContentService` API 不允許手動設置 HTTP headers**，包括 CORS headers。

### Google Apps Script 自動 CORS 機制

Google Apps Script 會根據**部署權限**自動處理 CORS：

#### 當部署權限設置為「任何人」時：

Google 會自動添加以下 CORS headers：
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

#### 當部署權限設置為「僅限我自己」時：

Google **不會**添加 CORS headers，導致瀏覽器阻止跨域請求。

---

## 🔄 替代方案

### 方案 1: 使用 Google Apps Script（當前方案）

**優點**:
- 無需維護服務器
- 自動擴展
- 與 Google Sheets 整合方便

**缺點**:
- 無法自定義 CORS headers
- 依賴 Google 的自動 CORS 處理
- 必須設置為「任何人」才能跨域

**實現方式**:
1. 確保部署權限設置為「任何人」
2. Google 會自動處理 CORS headers
3. 無需手動設置任何 headers

### 方案 2: 自建後端（推薦用於生產環境）

如果需要在後端完全控制 CORS headers，可以考慮：

#### 2.1 Node.js + Express 後端

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const app = express();

// 使用 cors 中間件
app.use(cors({
  origin: 'https://qwerboy-design.github.io',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 登入路由
app.post('/api/login', async (req, res) => {
  const { userId } = req.body;
  
  // 調用 Google Apps Script 或直接處理
  // ...
  
  res.json({ success: true, userId });
});

app.listen(3000);
```

#### 2.2 Python Flask 後端

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# 配置 CORS
CORS(app, 
     origins=['https://qwerboy-design.github.io'],
     supports_credentials=True,
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])

@app.route('/api/login', methods=['POST'])
def login():
    # 處理登入邏輯
    return {'success': True}

if __name__ == '__main__':
    app.run()
```

#### 2.3 代理服務器

使用 Nginx 或 Cloudflare Workers 作為代理，在代理層設置 CORS headers：

```nginx
# nginx.conf
location /api/ {
    # 設置 CORS headers
    add_header 'Access-Control-Allow-Origin' 'https://qwerboy-design.github.io' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    
    # 處理 OPTIONS 預檢請求
    if ($request_method = OPTIONS) {
        return 204;
    }
    
    # 代理到 Google Apps Script 或後端服務
    proxy_pass https://script.google.com;
}
```

---

## 🧪 驗證 CORS Headers

### 使用瀏覽器開發者工具

1. **打開開發者工具**（F12）
2. **切換到 Network 標籤**
3. **嘗試發送請求**（如登入）
4. **點擊失敗的請求**
5. **查看 Response Headers**，應該看到：

```
Access-Control-Allow-Origin: https://qwerboy-design.github.io
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### 使用 curl 測試

```bash
# 測試 OPTIONS 預檢請求
curl -X OPTIONS \
  -H "Origin: https://qwerboy-design.github.io" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v \
  https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# 應該看到響應中包含 CORS headers
```

### 檢查預檢請求（Preflight Request）

瀏覽器在發送實際請求前會先發送 OPTIONS 請求。檢查：

1. **Network 標籤**中應該看到兩個請求：
   - 第一個：`OPTIONS` 請求（預檢請求）
   - 第二個：`POST` 請求（實際請求）

2. **如果只看到 OPTIONS 請求失敗**，說明 CORS headers 設置不正確。

---

## 📝 Google Apps Script 代碼最佳實踐

雖然無法手動設置 headers，但可以優化代碼結構：

```javascript
/**
 * Google Apps Script - 優化後的代碼結構
 */

// 統一的響應處理函數
function createResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(
    JSON.stringify(data)
  ).setMimeType(ContentService.MimeType.JSON);
  
  // 注意：GAS 不支持設置 statusCode 或自定義 headers
  // CORS headers 由 Google 根據部署權限自動設置
  return output;
}

// 處理 OPTIONS 請求（雖然 GAS 可能不支持，但保留以備未來支持）
function doOptions() {
  return createResponse({}, 200);
}

// 處理 POST 請求
function doPost(e) {
  try {
    // 驗證請求來源（可選）
    // 注意：GAS 無法直接獲取 Origin header，這是 Google 自動處理的
    
    // 處理邏輯
    const requestData = JSON.parse(e.postData.contents);
    
    if (requestData.action === 'login') {
      return handleLogin(requestData);
    }
    
    return createResponse({
      success: false,
      message: '未知的操作類型'
    });
    
  } catch (error) {
    return createResponse({
      success: false,
      message: '處理請求時發生錯誤: ' + error.toString()
    });
  }
}
```

---

## 🎯 針對當前項目的建議

### 當前情況

- **後端**: Google Apps Script
- **前端**: React (部署在 GitHub Pages)
- **問題**: CORS 錯誤

### 解決方案選擇

#### 短期解決方案（推薦）

1. **確保 Google Apps Script 部署權限設置為「任何人」**
2. Google 會自動添加必要的 CORS headers
3. 無需修改代碼

#### 長期解決方案

如果需要更精細的 CORS 控制或更好的安全性：

1. **遷移到自建後端**（Node.js/Python）
2. 手動設置所有 CORS headers
3. 可以更精細地控制：
   - 允許的來源列表
   - 認證機制
   - 請求限制
   - 日誌記錄

---

## 🔒 安全考慮

### 設置 CORS 時的安全最佳實踐

1. **不要使用 `*` 作為 `Access-Control-Allow-Origin`**（如果使用 `credentials: true`）

2. **明確指定允許的來源**：
   ```javascript
   'Access-Control-Allow-Origin': 'https://qwerboy-design.github.io'
   ```

3. **限制允許的 HTTP 方法**：
   ```javascript
   'Access-Control-Allow-Methods': 'GET, POST'  // 只允許需要的方法
   ```

4. **限制允許的請求標頭**：
   ```javascript
   'Access-Control-Allow-Headers': 'Content-Type'  // 只允許需要的標頭
   ```

5. **驗證 Origin**（在服務器端）：
   ```javascript
   const allowedOrigins = [
     'https://qwerboy-design.github.io',
     'https://localhost:5173'  // 開發環境
   ];
   
   const origin = req.headers.origin;
   if (allowedOrigins.includes(origin)) {
     res.header('Access-Control-Allow-Origin', origin);
   }
   ```

---

## 📚 參考資源

- [MDN: HTTP CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Google Apps Script: Web Apps](https://developers.google.com/apps-script/guides/web)
- [Express CORS Middleware](https://expressjs.com/en/resources/middleware/cors.html)

---

**最後更新**: 2025-12-16







