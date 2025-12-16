# GitHub Pages 部署診斷指南

## 🔍 問題分析

根據生產構建代碼分析，環境變數在構建時已被正確替換。如果仍然出現登入問題，請檢查以下項目：

---

## ✅ 1. 檢查 GitHub Secrets 設置

### 步驟：

1. **前往 GitHub 倉庫設置**：
   - 訪問：`https://github.com/qwerboy-design/gemini-fintech-pro/settings/secrets/actions`

2. **確認以下 Secrets 已設置**：
   - ✅ `VITE_GAS_URL`: Google Apps Script Web App URL
   - ✅ `VITE_GEMINI_API_KEY`: Gemini API Key（可選，如果使用）

3. **驗證 Secret 值**：
   ```
   VITE_GAS_URL 應該是：
   https://script.google.com/macros/s/AKfycbzoEKE_10KGmlx8DfLgPa1SohOUYhrxuwmCHJRMogTkarwBL9NBAjBmP23JgRVE_GUk/exec
   ```

---

## ✅ 2. 檢查 Google Apps Script 部署設置

### 關鍵檢查項目：

#### A. 部署權限設置 ⚠️ **最重要**

1. 前往 Google Apps Script：https://script.google.com
2. 打開專案 → **「部署」** → **「管理部署」**
3. 點擊部署旁的 **「編輯」**（鉛筆圖標）
4. **確認「具有存取權的使用者」設置為「任何人」** ⚠️
   - ❌ **錯誤**：僅限我自己 / 僅限我的組織
   - ✅ **正確**：任何人（包括匿名使用者）

#### B. 驗證部署 URL

```bash
# 測試部署 URL 是否可訪問
curl -X POST https://script.google.com/macros/s/AKfycbzoEKE_10KGmlx8DfLgPa1SohOUYhrxuwmCHJRMogTkarwBL9NBAjBmP23JgRVE_GUk/exec \
  -H "Content-Type: application/json" \
  -d '{"action":"login","userId":"test","timestamp":"2025-01-01T00:00:00.000Z"}'
```

**預期回應**：應該返回 JSON 格式的成功或錯誤訊息（不是 HTML 404 頁面）

#### C. 檢查 Code.gs 配置

確認以下配置正確：

```javascript
const SHEET_ID = '1pB5UyKUcgQ4NU7yme1aDiLCWvr6gXHYq5CglWYj5IvU0QVzwi2z32nd9';
const SHEET_NAME = 'CursorFintechDB';
```

---

## ✅ 3. 檢查瀏覽器控制台

### 在部署的網站上：

1. 打開：https://qwerboy-design.github.io/gemini-fintech-pro/
2. 按 `F12` 打開開發者工具
3. 切換到 **Console** 標籤
4. 點擊「登入」按鈕並嘗試登入
5. 查看控制台輸出：

**應該看到的日誌**：
```javascript
發送登入請求到: https://script.google.com/macros/s/...
請求數據: {action: "login", userId: "...", timestamp: "..."}
環境變數檢查: {hasGASUrl: true, gasUrlFromEnv: "https://..."}
```

**如果出現錯誤**：
- `Failed to fetch`: 通常是 CORS 或部署權限問題
- `404`: URL 不正確或部署已刪除
- `500`: Google Apps Script 內部錯誤

---

## ✅ 4. 檢查網絡請求（Network Tab）

1. 在開發者工具中切換到 **Network** 標籤
2. 嘗試登入
3. 查找對 Google Apps Script URL 的請求
4. 檢查：
   - **狀態碼**：應該是 `200` 或 `302`（Google Apps Script 可能重定向）
   - **Response Headers**：確認沒有 CORS 錯誤
   - **Request Payload**：確認數據格式正確

---

## 🔧 常見問題解決方案

### 問題 1: "Failed to fetch" 錯誤

**解決方案**：
1. ✅ 確認 Google Apps Script 部署權限為「任何人」
2. ✅ 重新部署 Google Apps Script（獲取新 URL）
3. ✅ 更新 GitHub Secret `VITE_GAS_URL` 為新 URL
4. ✅ 重新觸發 GitHub Actions 部署

### 問題 2: 環境變數為空

**解決方案**：
1. ✅ 確認 GitHub Secrets 已正確設置
2. ✅ 確認 Secret 名稱完全正確（區分大小寫）
3. ✅ 重新觸發部署：前往 Actions → 選擇最新工作流 → "Re-run jobs"

### 問題 3: 本地可運行，部署後失敗

**可能原因**：
- GitHub Secrets 未設置
- 構建時環境變數未注入
- 瀏覽器快取舊版本

**解決方案**：
1. ✅ 確認 GitHub Secrets 設置
2. ✅ 清除瀏覽器快取（Ctrl+Shift+R）
3. ✅ 使用無痕模式測試

---

## 📋 快速檢查清單

在報告問題前，請確認以下項目：

- [ ] GitHub Secret `VITE_GAS_URL` 已設置
- [ ] Google Apps Script 部署權限為「任何人」
- [ ] 已重新部署 Google Apps Script（如果修改了代碼）
- [ ] GitHub Actions 構建成功
- [ ] 已清除瀏覽器快取
- [ ] 檢查了瀏覽器控制台錯誤訊息
- [ ] 檢查了 Network 標籤的請求狀態

---

## 🔄 重新部署步驟

如果修改了配置，需要重新部署：

### 1. 更新 Google Apps Script（如需要）

1. 修改 `Code.gs`（如需要）
2. 部署 → 管理部署 → 編輯 → 新增版本
3. 複製新的部署 URL

### 2. 更新 GitHub Secret（如需要）

1. Settings → Secrets and variables → Actions
2. 找到 `VITE_GAS_URL`
3. 更新值為新的部署 URL

### 3. 觸發重新部署

**方式 1：推送代碼**
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

**方式 2：手動觸發**
- 前往 Actions → Deploy to GitHub Pages → Run workflow

---

## 📞 獲取詳細錯誤訊息

如果問題仍然存在，請提供以下資訊：

1. **瀏覽器控制台完整錯誤訊息**
2. **Network 標籤中失敗請求的詳細資訊**（包括 Response）
3. **Google Apps Script 部署 URL**（可在控制台日誌中看到）
4. **部署權限設置截圖**

---

**最後更新**: 2025-12-16
