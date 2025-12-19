# CORS 錯誤修復完整指南

## 🚨 問題說明

您遇到的錯誤：
```
Access to fetch at 'https://script.google.com/macros/s/...' from origin 'https://qwerboy-design.github.io' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**核心問題**: Google Apps Script 部署權限未正確設置，導致瀏覽器阻止跨域請求。

---

## ✅ 解決方案（必須完全按照步驟執行）

### 步驟 1: 訪問 Google Apps Script

1. 前往：https://script.google.com
2. 登入您的 Google 帳號
3. 找到並打開您的專案（應該包含之前創建的 `Code.gs`）

---

### 步驟 2: 檢查並更新代碼

**重要**: 確保您的 `Code.gs` 包含以下內容：

1. 打開專案編輯器
2. 確認代碼中包含 `doGet` 和 `doPost` 函數
3. 如果代碼已更新，繼續下一步

---

### 步驟 3: 部署為 Web App（關鍵步驟）

1. **點擊「部署」按鈕**（右上角或左側選單）
2. **選擇「管理部署」**（Manage deployments）
3. **如果已有部署**:
   - 找到現有部署
   - 點擊右側的 **「編輯」圖標**（鉛筆圖標 ✏️）
4. **如果沒有部署**:
   - 點擊 **「新增部署」**（New deployment）
   - 選擇類型：**「網頁應用程式」**（Web app）

---

### 步驟 4: 設置部署權限（最重要）

在部署設置對話框中，**必須設置為以下值**：

```
執行身分: 我（myself）
具有存取權的使用者: 任何人 ← ⚠️ 這是最關鍵的設置！
版本: 新版本（或選擇「Head」）
說明: （可選，留空也可以）
```

**⚠️ 關鍵點**:
- **「具有存取權的使用者」必須選擇「任何人」**
- 如果選擇「僅限我自己」或「僅限我的組織」，會導致 CORS 錯誤
- 選擇「任何人」後，Google 會自動處理 CORS headers

---

### 步驟 5: 保存並部署

1. 點擊 **「部署」**（Deploy）按鈕
2. 如果是第一次部署：
   - 會要求授權（點擊「授權存取」）
   - 選擇您的 Google 帳號
   - 點擊「進階」→「前往 [專案名稱]（不安全）」（這是正常的，因為是您的腳本）
   - 點擊「允許」
3. **複製部署 URL**：
   - 部署成功後，會顯示 Web App URL
   - URL 格式：`https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec`
   - **複製這個 URL**（稍後需要更新）

---

### 步驟 6: 測試部署 URL

在瀏覽器中訪問您複製的 URL（使用 GET 請求）:

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

**預期結果**（成功）:
```json
{
  "success": true,
  "message": "Google Apps Script Web App 運行正常",
  "timestamp": "2025-12-16T..."
}
```

**如果看到錯誤**:
- **403 Forbidden**: ❌ 權限未正確設置，請返回步驟 4
- **404 Not Found**: ❌ URL 錯誤，請重新複製
- **500 Internal Server Error**: ❌ 代碼有錯誤，請檢查 `Code.gs`

---

### 步驟 7: 更新環境變數

1. **更新本地 `.env` 文件**:
   ```env
   VITE_GAS_URL=https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec
   ```

2. **更新 GitHub Secrets**（用於生產環境）:
   - 前往：https://github.com/qwerboy-design/gemini-fintech-pro/settings/secrets/actions
   - 找到或創建 `VITE_GAS_URL` secret
   - 更新值為新的部署 URL
   - 保存

3. **更新 `.env.example`**（可選，用於文檔）:
   ```env
   VITE_GAS_URL=https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec
   ```

---

### 步驟 8: 重新部署前端

**方式 1: 手動部署**
```bash
npm run deploy
```

**方式 2: 自動部署**
- 推送代碼到 `main` 分支
- GitHub Actions 會自動部署

---

### 步驟 9: 驗證修復

1. **等待 1-2 分鐘**（讓部署生效）
2. **清除瀏覽器快取**（Ctrl+Shift+R 或 Cmd+Shift+R）
3. **打開開發者工具**（F12）
4. **嘗試登入**:
   - 輸入帳號
   - 點擊「登入」
5. **檢查控制台**:
   - ❌ **如果仍然看到 CORS 錯誤**: 返回步驟 4，確認權限設置
   - ✅ **如果登入成功**: 問題已解決！

---

## 🔍 故障排除

### 問題 1: 仍然看到 CORS 錯誤

**可能原因**:
- 部署權限未正確設置為「任何人」
- 使用了舊的部署 URL

**解決方案**:
1. 重新檢查步驟 4 的權限設置
2. 創建新的部署（選擇「新版本」）
3. 使用新的 URL 更新環境變數

---

### 問題 2: 看到 403 Forbidden

**原因**: 部署權限限制

**解決方案**:
1. 確保選擇「任何人」作為存取權限
2. 重新部署（會生成新 URL）
3. 更新環境變數

---

### 問題 3: 本地可以，部署後不行

**原因**: GitHub Secrets 未設置或使用了舊的 URL

**解決方案**:
1. 確認 GitHub Secrets 中的 `VITE_GAS_URL` 已更新
2. 重新觸發 GitHub Actions 部署
3. 清除瀏覽器快取

---

### 問題 4: 修改代碼後需要重新部署嗎？

**答案**: 如果只修改了代碼邏輯，不需要重新部署（除非您選擇了特定版本）。但為了確保更改生效，建議：

1. 在部署管理界面選擇「新版本」部署
2. 或選擇「Head」版本（始終使用最新代碼）

---

## 📋 檢查清單

在報告問題前，請確認：

- [ ] Google Apps Script 部署權限設置為「任何人」
- [ ] 部署 URL 已複製並更新到 `.env` 文件
- [ ] GitHub Secrets 中的 `VITE_GAS_URL` 已更新
- [ ] 已重新部署前端代碼
- [ ] 已清除瀏覽器快取
- [ ] 已測試部署 URL 可以直接訪問（GET 請求返回 JSON）

---

## 🔗 相關文檔

- `LOGIN_TROUBLESHOOTING.md` - 完整的登入故障排除指南
- `GOOGLE_APPS_SCRIPT_SETUP.md` - Google Apps Script 設置指南
- `DEPLOYMENT_DIAGNOSIS.md` - 部署診斷指南

---

## ⚠️ 重要提醒

1. **安全考慮**: 設置為「任何人」意味著任何人都可以調用您的腳本。確保：
   - 腳本中沒有敏感邏輯
   - 不處理敏感數據（如密碼、支付信息）
   - 適當驗證輸入數據

2. **配額限制**: Google Apps Script 有每日執行配額限制。如果您的應用需要高頻率調用，請考慮：
   - 使用緩存機制
   - 實現錯誤重試邏輯
   - 監控執行配額使用情況

---

**最後更新**: 2025-12-16





