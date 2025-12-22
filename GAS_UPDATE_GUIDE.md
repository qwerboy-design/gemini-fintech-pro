# Google Apps Script 代碼更新指南

## 🚨 問題說明

如果看到錯誤訊息「缺少必要欄位 : userId 或 email」，這表示 Google Apps Script 上的代碼還是舊版本，仍檢查 email 欄位。

---

## ✅ 解決步驟

### 步驟 1: 打開 Google Apps Script 編輯器

1. 前往：https://script.google.com
2. 登入您的 Google 帳號
3. 找到並打開您的登入專案

---

### 步驟 2: 更新代碼

1. **打開 `Code.gs` 文件**（或主要代碼文件）
2. **完全替換為最新代碼**：
   - 打開本地專案中的 `google-apps-script/Code.gs`
   - 複製全部內容
   - 在 Google Apps Script 編輯器中，**完全刪除舊代碼**，貼上新代碼
3. **保存**：按 `Ctrl+S` 或點擊「儲存」圖標

---

### 步驟 3: 檢查關鍵修改點

確保以下代碼正確：

#### ✅ 正確的 handleLogin 函數（只檢查 userId）:

```javascript
function handleLogin(data) {
  try {
    // 驗證必要欄位（只檢查 userId）
    if (!data.userId) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '缺少必要欄位：userId'  // ← 不應該有 "或 email"
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    // ... 其他代碼
  }
}
```

#### ❌ 錯誤的舊代碼（檢查 userId 和 email）:

```javascript
// 這是舊版本，需要刪除
if (!data.userId || !data.email) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: false,
      message: '缺少必要欄位：userId 或 email'  // ← 這是舊的錯誤訊息
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

---

### 步驟 4: 重新部署（重要）

更新代碼後，**必須重新部署**才能生效：

1. **點擊「部署」**（右上角或左側選單）
2. **選擇「管理部署」**（Manage deployments）
3. **編輯現有部署**（點擊鉛筆圖標 ✏️）
4. **選擇版本**：
   - 選擇 **「新版本」**（New version）- **推薦**
   - 或選擇 **「Head」**（始終使用最新代碼）
5. **確認權限設置**：
   ```
   執行身分: 我
   具有存取權的使用者: 任何人 ← 必須是這個！
   ```
6. **點擊「部署」**按鈕
7. **等待部署完成**（通常幾秒鐘）

---

### 步驟 5: 測試

1. **等待 1-2 分鐘**（讓部署生效）
2. **清除瀏覽器快取**（Ctrl+Shift+R）
3. **訪問網站**：https://qwerboy-design.github.io/gemini-fintech-pro/
4. **嘗試登入**：
   - 輸入帳號（如 "mike"）
   - 點擊「登入」
5. **檢查結果**：
   - ✅ **如果登入成功**：問題已解決
   - ❌ **如果仍然看到錯誤**：檢查步驟 4 的部署是否完成

---

## 🔍 驗證代碼是否已更新

### 方法 1: 檢查錯誤訊息

- ❌ **舊版本錯誤訊息**：`缺少必要欄位 : userId 或 email`
- ✅ **新版本錯誤訊息**：`缺少必要欄位：userId`

### 方法 2: 檢查代碼內容

在 Google Apps Script 編輯器中搜索：

- 搜索 `email`，如果找到任何與 email 相關的驗證邏輯，表示代碼未完全更新
- 搜索 `缺少必要欄位`，檢查是否還包含 "或 email"

---

## 🐛 常見問題

### 問題 1: 更新代碼後仍然看到舊錯誤

**原因**：沒有重新部署，或部署時選擇了舊版本

**解決方案**：
1. 確認已保存代碼（Ctrl+S）
2. 重新部署時選擇「新版本」或「Head」
3. 等待部署完成
4. 清除瀏覽器快取

---

### 問題 2: 部署時看不到「新版本」選項

**解決方案**：
- 如果使用「Head」版本，每次保存代碼後自動使用最新版本
- 如果需要特定版本，選擇「新版本」並添加版本說明

---

### 問題 3: 代碼更新了但功能還是不正常

**檢查項目**：
1. ✅ 代碼是否已保存
2. ✅ 是否選擇了正確的部署版本
3. ✅ 部署權限是否設置為「任何人」
4. ✅ 是否等待了足夠的時間讓部署生效
5. ✅ 是否清除了瀏覽器快取

---

## 📋 快速檢查清單

在報告問題前，請確認：

- [ ] 已複製最新的 `Code.gs` 代碼到 Google Apps Script
- [ ] 已保存代碼（Ctrl+S）
- [ ] 已重新部署（選擇「新版本」或「Head」）
- [ ] 部署權限設置為「任何人」
- [ ] 已等待 1-2 分鐘讓部署生效
- [ ] 已清除瀏覽器快取
- [ ] 錯誤訊息已更新（不再包含 "或 email"）

---

## 🔗 相關文件

- `google-apps-script/Code.gs` - 最新的後端代碼
- `CORS_WORKAROUND.md` - CORS 問題解決方案
- `LOGIN_TROUBLESHOOTING.md` - 完整的登入故障排除指南

---

**最後更新**: 2025-12-16









