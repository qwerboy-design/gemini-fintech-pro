# CORS 錯誤快速修復指南

## 🚨 您當前的錯誤

```
Access to fetch at 'https://script.google.com/macros/s/AKfycbzoEKE_10KGmlx8DfLgPa1SohOUYhrxuwmCHJRMogTkarwBL9NBAjBmP23JgRVE_GUk/exec' 
from origin 'https://qwerboy-design.github.io' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**根本原因**: Google Apps Script 部署權限**不是「任何人」**，導致瀏覽器阻止跨域請求。

---

## ✅ 立即解決步驟（3 分鐘）

### 步驟 1: 訪問 Google Apps Script

1. **打開瀏覽器**，訪問：https://script.google.com
2. **登入**您的 Google 帳號
3. **找到您的專案**（應該包含登入相關的 `Code.gs`）

---

### 步驟 2: 進入部署管理

1. 在 Apps Script 編輯器左側或頂部，找到 **「部署」**（Deploy）按鈕
2. 點擊 **「部署」**
3. 選擇 **「管理部署」**（Manage deployments）

---

### 步驟 3: 編輯現有部署

1. 您應該會看到一個現有的部署（可能顯示 URL 或「網頁應用程式」）
2. **點擊部署右側的「編輯」圖標**（通常是鉛筆圖標 ✏️ 或三個點的選單）

---

### 步驟 4: 修改權限設置（關鍵步驟）

在打開的對話框中，找到以下設置：

#### ⚠️ 最重要的設置：

**「具有存取權的使用者」**（Who has access）

**必須選擇：**
- ✅ **「任何人」**（Anyone）

**不要選擇：**
- ❌ 「僅限我自己」（Only myself）
- ❌ 「僅限我的組織」（Only members of my organization）

#### 其他設置：

- **執行身分**（Execute as）: **「我」**（Me）
- **版本**（Version）: **「新版本」**（New version）或 **「Head」**

---

### 步驟 5: 保存並重新部署

1. **點擊「部署」**（Deploy）按鈕
2. 如果出現授權提示，點擊 **「授權存取」** 並完成授權流程
3. **等待部署完成**（通常幾秒鐘）

---

### 步驟 6: 檢查 URL 是否改變

1. 部署完成後，**複製新的 Web App URL**
2. **比較**新 URL 和舊 URL：
   - 如果 URL **相同**：繼續下一步
   - 如果 URL **改變了**：需要更新環境變數（見步驟 7）

---

### 步驟 7: 更新環境變數（僅當 URL 改變時）

**如果步驟 6 中 URL 改變了**，需要更新：

#### 7.1 更新本地 `.env` 文件

打開項目根目錄的 `.env` 文件，更新：

```env
VITE_GAS_URL=https://script.google.com/macros/s/YOUR_NEW_URL/exec
```

#### 7.2 更新 GitHub Secrets

1. 訪問：https://github.com/qwerboy-design/gemini-fintech-pro/settings/secrets/actions
2. 找到 `VITE_GAS_URL` secret
3. 點擊「更新」或「編輯」
4. 更新值為新的 URL
5. 保存

#### 7.3 重新部署前端（僅當 URL 改變時）

```bash
npm run deploy
```

---

### 步驟 8: 測試修復

1. **等待 1-2 分鐘**（讓 Google Apps Script 部署生效）
2. **清除瀏覽器快取**：
   - 按 `Ctrl+Shift+R` (Windows/Linux) 或 `Cmd+Shift+R` (Mac)
   - 或使用無痕模式
3. **訪問網站**：https://qwerboy-design.github.io/gemini-fintech-pro/
4. **打開開發者工具**：按 `F12`
5. **切換到 Console 標籤**
6. **嘗試登入**：
   - 輸入帳號
   - 點擊「登入」
7. **檢查結果**：
   - ✅ **如果登入成功**：問題已解決！
   - ❌ **如果仍然看到 CORS 錯誤**：繼續下面的故障排除

---

## 🔍 故障排除

### 問題 1: 仍然看到 CORS 錯誤

**可能原因**：
- 部署權限仍然不是「任何人」
- 使用了舊的部署 URL（緩存問題）

**解決方案**：
1. **再次確認步驟 4**：
   - 打開部署管理
   - 點擊「編輯」
   - **確保「具有存取權的使用者」是「任何人」**
2. **創建全新的部署**：
   - 在部署管理界面，點擊「刪除部署」（如果有多個，刪除舊的）
   - 點擊「新增部署」
   - 選擇「網頁應用程式」
   - 設置為「任何人」
   - 部署並複製新 URL
3. **強制清除緩存**：
   - 使用無痕模式測試
   - 或在開發者工具中勾選「Disable cache」

---

### 問題 2: 部署時看不到「任何人」選項

**可能原因**：
- Google Workspace 組織限制
- 帳號權限問題

**解決方案**：
1. 檢查是否使用個人 Google 帳號（不是企業帳號）
2. 如果使用企業帳號，聯繫管理員確認是否允許公開部署
3. 嘗試使用個人 Google 帳號創建新的 Apps Script 專案

---

### 問題 3: 看到 403 Forbidden

**原因**：權限設置錯誤

**解決方案**：
1. 確保「具有存取權的使用者」設置為「任何人」
2. 重新部署
3. 如果問題持續，創建全新的部署

---

### 問題 4: 測試 URL 返回 HTML 而不是 JSON

**原因**：可能訪問了錯誤的 URL 或需要授權

**解決方案**：
1. 確保 URL 結尾是 `/exec`（不是 `/dev`）
2. 在瀏覽器中直接訪問 URL
3. 如果看到授權頁面，完成授權後再試

---

## 📋 檢查清單

在報告問題前，請確認以下所有項目：

- [ ] 已訪問 Google Apps Script 編輯器
- [ ] 已打開「部署」→「管理部署」
- [ ] 已點擊「編輯」圖標
- [ ] **「具有存取權的使用者」已設置為「任何人」**
- [ ] 已點擊「部署」按鈕並等待完成
- [ ] 已測試 URL 可以直接訪問（在瀏覽器中打開返回 JSON）
- [ ] 已清除瀏覽器快取
- [ ] 已使用無痕模式測試
- [ ] 如果 URL 改變，已更新 `.env` 和 GitHub Secrets

---

## 🎯 快速驗證命令

在瀏覽器中直接訪問您的 URL，應該看到：

```
https://script.google.com/macros/s/AKfycbzoEKE_10KGmlx8DfLgPa1SohOUYhrxuwmCHJRMogTkarwBL9NBAjBmP23JgRVE_GUk/exec
```

**成功回應**（JSON 格式）:
```json
{
  "success": true,
  "message": "Google Apps Script Web App 運行正常",
  "timestamp": "2025-12-16T..."
}
```

**失敗回應**:
- 看到 HTML 頁面或錯誤訊息 → 權限問題
- 403 Forbidden → 權限未設置為「任何人」
- 404 Not Found → URL 錯誤

---

## ⚡ 最常見錯誤

**錯誤**: 忘記將「具有存取權的使用者」設置為「任何人」

**正確做法**: 
1. 打開部署編輯界面
2. 找到「具有存取權的使用者」選項
3. **明確選擇「任何人」**
4. 保存並重新部署

---

## 📞 如果問題仍然存在

如果完成以上所有步驟後，問題仍然存在，請提供：

1. **部署權限設置截圖**（顯示「具有存取權的使用者」設置）
2. **測試 URL 的直接訪問結果**（在瀏覽器中打開 URL 的截圖）
3. **瀏覽器控制台完整錯誤訊息**

---

**最後更新**: 2025-12-16  
**預估修復時間**: 3-5 分鐘






