# CORS 預檢請求繞過方案

## 🎯 解決方案：使用 `text/plain` Content-Type

### 問題

當使用 `Content-Type: application/json` 時，瀏覽器會發送 **CORS 預檢請求（OPTIONS）**，這需要後端正確設置 CORS headers。對於 Google Apps Script，如果部署權限未正確設置，預檢請求會失敗。

### 解決方案

使用 `text/plain` 作為 Content-Type 可以將請求變成**簡單請求（Simple Request）**，從而避開 CORS 預檢請求。

---

## 📝 前端實現

### React/JavaScript 範例

```javascript
const loginData = {
  action: 'login',
  userId: 'user123',
  timestamp: new Date().toISOString()
};

fetch('https://script.google.com/macros/s/YOUR_ID/exec', {
  method: 'POST',
  // 關鍵 1: 使用 text/plain，避開 OPTIONS 預檢
  headers: {
    'Content-Type': 'text/plain;charset=utf-8',
  },
  // 關鍵 2: 雖然 Header 說是文字，但內容還是送 JSON 字串
  body: JSON.stringify(loginData),
})
.then(res => res.json()) // GAS 會回傳 JSON，這裡直接轉物件
.then(data => console.log(data))
.catch(error => console.error('錯誤:', error));
```

### TypeScript 範例

```typescript
interface LoginRequest {
  action: 'login';
  userId: string;
  timestamp: string;
}

async function submitLogin(url: string, userId: string): Promise<GasResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', // 避免預檢請求
    },
    body: JSON.stringify({
      action: 'login',
      userId,
      timestamp: new Date().toISOString(),
    } as LoginRequest),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}
```

---

## 🔍 原理說明

### 什麼是簡單請求（Simple Request）？

滿足以下所有條件的請求被視為簡單請求，**不需要預檢**：

1. **HTTP 方法**：GET、HEAD、POST
2. **Content-Type**：只能是以下之一：
   - `text/plain`
   - `multipart/form-data`
   - `application/x-www-form-urlencoded`
3. **請求標頭**：只能包含以下簡單標頭：
   - Accept
   - Accept-Language
   - Content-Language
   - Content-Type（僅限上述值）

### 為什麼 `application/json` 需要預檢？

`application/json` 不是簡單請求的 Content-Type，所以瀏覽器會：
1. 先發送 `OPTIONS` 預檢請求
2. 檢查響應中的 CORS headers
3. 如果檢查通過，才發送實際的 `POST` 請求

### 使用 `text/plain` 的優勢

- ✅ **不需要預檢請求**：直接發送 POST 請求
- ✅ **避免 CORS headers 問題**：不需要後端設置複雜的 CORS headers
- ✅ **適用於 Google Apps Script**：完美解決 GAS 的 CORS 限制

---

## ⚙️ 後端處理（Google Apps Script）

即使前端使用 `text/plain`，後端仍然可以正常解析 JSON：

```javascript
function doPost(e) {
  try {
    // 即使 Content-Type 是 text/plain，postData.contents 仍然是 JSON 字符串
    // 可以直接使用 JSON.parse() 解析
    const requestData = JSON.parse(e.postData.contents);
    
    if (requestData.action === 'login') {
      return handleLogin(requestData);
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: '未知的操作類型'
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: '處理請求時發生錯誤: ' + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

**關鍵點**：
- `e.postData.contents` 始終是字符串
- 無論 Content-Type 是什麼，都可以用 `JSON.parse()` 解析
- Google Apps Script 不關心 Content-Type 的值，只處理字符串內容

---

## ✅ 優點

1. **簡單有效**：不需要修改後端配置
2. **避免預檢**：直接發送請求，減少延遲
3. **兼容性好**：適用於所有支持 JSON 的後端
4. **解決 GAS 限制**：特別適合 Google Apps Script

---

## ⚠️ 注意事項

### 1. 仍然需要正確的部署權限

雖然避免了預檢請求，但如果 Google Apps Script 部署權限不是「任何人」，可能仍然會有問題。建議：
- 設置部署權限為「任何人」
- 或使用此方法作為補充解決方案

### 2. 請求仍然是跨域的

這個方法只是避免了預檢請求，但請求本身仍然是跨域的。後端仍然需要：
- 設置為「任何人」訪問（對於 Google Apps Script）
- 或正確設置 CORS headers（對於標準後端）

### 3. 安全性考慮

- `text/plain` 方法不會降低安全性
- 仍然需要驗證和授權機制
- 建議在後端驗證請求內容

---

## 🔄 與標準 CORS 方法的比較

### 標準方法（使用 application/json）

```javascript
// 前端
fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json', // 會觸發預檢請求
  },
  body: JSON.stringify(data),
});

// 後端需要設置 CORS headers
// Access-Control-Allow-Origin: *
// Access-Control-Allow-Methods: POST, OPTIONS
// Access-Control-Allow-Headers: Content-Type
```

### 繞過方法（使用 text/plain）

```javascript
// 前端
fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain', // 不會觸發預檢請求
  },
  body: JSON.stringify(data), // 仍然是 JSON 字符串
});

// 後端：不需要特殊處理，直接解析 JSON
const data = JSON.parse(e.postData.contents);
```

---

## 📚 參考資源

- [MDN: Simple Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests)
- [MDN: Preflight Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#preflighted_requests)
- [Google Apps Script: Web Apps](https://developers.google.com/apps-script/guides/web)

---

## 🎯 適用場景

### ✅ 推薦使用

- Google Apps Script 後端
- 無法修改後端 CORS 配置的情況
- 需要快速解決 CORS 問題

### ❌ 不推薦使用

- 需要嚴格的 Content-Type 驗證
- 後端已經正確配置 CORS
- 需要利用 Content-Type 進行路由的情況

---

**最後更新**: 2025-12-16








