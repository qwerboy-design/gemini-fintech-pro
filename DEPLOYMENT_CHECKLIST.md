# Google Apps Script 部署設置檢查清單

## 📋 完整檢查步驟

請按照以下步驟逐一檢查，確保每個項目都正確設置。

---

## ✅ 步驟 1: 檢查 Google Apps Script 編輯器

### 1.1 訪問編輯器
- [ ] 前往：https://script.google.com
- [ ] 已登入正確的 Google 帳號
- [ ] 已找到並打開您的 Apps Script 專案（例如：CursorFintech）

---

## ✅ 步驟 2: 檢查代碼配置

### 2.1 確認 Sheet ID 和 Sheet Name

在 `Code.gs` 文件中，檢查以下配置：

```javascript
const SHEET_ID = '1pB5UyKUcgQ4NU7yme1aDiLCWvr6gXHYq5CglWYj5IvU0QVzwi2z32nd9';
const SHEET_NAME = 'CursorFintechDB';
```

- [ ] `SHEET_ID` 是否正確（從 Google Sheet URL 複製）
- [ ] `SHEET_NAME` 是否與 Google Sheet 中的工作表名稱完全匹配
- [ ] 代碼已保存（Ctrl+S）

### 2.2 驗證 Sheet 存在且可訪問

1. 打開您的 Google Sheet
2. 從 URL 複製 Sheet ID（`/d/[SHEET_ID]/edit` 中的部分）
3. 與 `Code.gs` 中的 `SHEET_ID` 比對

- [ ] Sheet ID 完全匹配
- [ ] Sheet 存在且未被刪除
- [ ] 您有該 Sheet 的訪問權限

---

## ✅ 步驟 3: 檢查部署設置（最關鍵！）

### 3.1 進入部署管理

1. 在 Apps Script 編輯器中
2. 點擊左側選單的「部署」（Deploy）
3. 點擊「管理部署」（Manage deployments）

- [ ] 已進入部署管理頁面
- [ ] 可以看到現有的部署（應該有 Web App URL）

### 3.2 檢查部署詳情

找到您的部署，點擊右側的「編輯」圖標 ✏️

**關鍵設置檢查**：

#### A. 執行身分（Execute as）
- [ ] **必須設置為「我（your-email@gmail.com）」**
- [ ] 不是「訪問使用者」

#### B. 具有存取權的使用者（Who has access）← **最關鍵！**
- [ ] **必須設置為「任何人」（Anyone）**
- [ ] 不是「僅限我自己」
- [ ] 不是您的 Google 帳號

⚠️ **如果這裡不是「任何人」，就會出現 `302 Found` 或 `403 Forbidden`！**

### 3.3 確認部署狀態

在「管理部署」頁面：
- [ ] 看到部署 URL（類似：`https://script.google.com/macros/s/.../exec`）
- [ ] 「狀態」顯示為「已部署」（Active）
- [ ] 「版本」有版本號

---

## ✅ 步驟 4: 重新部署（如果設置已更改）

### 4.1 編輯部署

如果「具有存取權的使用者」不是「任何人」：

1. 點擊「編輯」圖標
2. 更改「具有存取權的使用者」為「任何人」
3. 確認「執行身分」為「我」
4. **點擊「部署」按鈕保存**

- [ ] 已更改設置
- [ ] 已點擊「部署」按鈕
- [ ] 已等待部署完成（通常幾秒鐘）

---

## ✅ 步驟 5: 驗證部署權限

### 5.1 檢查「管理部署」頁面

返回「管理部署」頁面，確認：

- [ ] 「具有存取權的使用者」顯示為「任何人」
- [ ] 「執行身分」顯示為「我」

### 5.2 測試 GET 請求

1. 複製部署 URL（以 `/exec` 結尾）
2. 在新標籤頁或無痕模式中打開
3. 查看響應

**預期結果（成功）**：
```json
{
  "success": true,
  "message": "Google Apps Script Web App 運行正常",
  "timestamp": "2025-12-16T..."
}
```

**失敗的跡象**：
- ❌ 看到登入頁面 → `302 Found`（權限設置錯誤）
- ❌ 看到 403 Forbidden → 權限設置錯誤
- ❌ 看到錯誤訊息 → 代碼或配置問題

- [ ] 可以直接看到 JSON 響應（不是登入頁面）
- [ ] Status Code 為 `200 OK`（不是 302 或 403）

---

## ✅ 步驟 6: 檢查 Network Headers

### 6.1 使用瀏覽器開發者工具

1. 打開瀏覽器開發者工具（F12）
2. 切換到「Network」標籤
3. 清除記錄（點擊清除圖標）
4. 訪問您的 Apps Script URL

### 6.2 檢查請求詳情

點擊請求，查看：

**General Headers**：
- [ ] **Status Code**: `200 OK`（不是 302 或 403）
- [ ] **Request Method**: `GET` 或 `POST`
- [ ] **Request URL**: 正確的 Apps Script URL

**Response Headers**：
- [ ] **應該包含**：`Access-Control-Allow-Origin: *`
- [ ] **Content-Type**: `application/json`

**如果 Status Code 是 302**：
- ❌ 部署權限可能仍然不是「任何人」
- ❌ 需要重新檢查步驟 3

---

## ✅ 步驟 7: 檢查環境變數配置

### 7.1 本地環境變數

檢查 `.env` 文件：

```env
VITE_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

- [ ] `VITE_GAS_URL` 已設置
- [ ] URL 與「管理部署」中的 URL 完全一致
- [ ] URL 以 `/exec` 結尾（不是 `/dev`）

### 7.2 GitHub Secrets（生產環境）

如果使用 GitHub Pages：

- [ ] 已在 GitHub Secrets 中設置 `VITE_GAS_URL`
- [ ] Secret 名稱完全匹配：`VITE_GAS_URL`
- [ ] URL 值與部署 URL 一致

---

## 🔍 常見問題診斷

### 問題 1: 仍然是 302 Found

**檢查**：
1. ✅ 確認「具有存取權的使用者」設置為「任何人」
2. ✅ 確認已點擊「部署」按鈕保存
3. ✅ 清除瀏覽器快取（Ctrl+Shift+Delete）
4. ✅ 使用無痕模式測試
5. ✅ 確認使用的是 `/exec` URL（不是 `/dev`）

---

### 問題 2: 403 Forbidden

**檢查**：
1. ✅ 確認部署權限設置為「任何人」
2. ✅ 確認「執行身分」設置為「我」
3. ✅ 確認 Sheet ID 正確
4. ✅ 確認已授權 Apps Script 訪問 Sheets

---

### 問題 3: 404 Not Found

**檢查**：
1. ✅ 確認 URL 正確（從「管理部署」複製）
2. ✅ 確認部署存在且未刪除
3. ✅ 確認使用的是最新部署的 URL

---

## 📝 快速驗證命令

如果您想在終端中測試：

```bash
# 測試 GET 請求（替換 YOUR_URL）
curl https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# 預期看到 JSON 響應
```

---

## ✅ 完整檢查清單總結

完成所有檢查後，確認：

- [ ] Sheet ID 和 Sheet Name 配置正確
- [ ] 部署權限設置為「任何人」
- [ ] 「執行身分」設置為「我」
- [ ] 已重新部署並保存
- [ ] 直接訪問 URL 可以看見 JSON（不是登入頁面）
- [ ] Network Headers 顯示 `200 OK`
- [ ] Response Headers 包含 `Access-Control-Allow-Origin: *`
- [ ] 環境變數配置正確

---

## 🔗 相關文檔

- `BACKEND_CORS_FIX.md` - 完整後端 CORS 處理指南
- `GAS_302_REDIRECT_FIX.md` - 302 重定向問題解決
- `LOGIN_TROUBLESHOOTING.md` - 登入功能故障排除

---

**最後更新**: 2025-12-16





