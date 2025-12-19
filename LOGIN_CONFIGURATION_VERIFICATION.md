# 登入功能配置驗證指南

**創建日期**: 2025-12-16  
**用途**: 驗證 Google Apps Script 配置狀態

---

## ✅ 改進內容

### 1. 配置狀態檢查

登入模態框現在會：
- ✅ **自動檢測** Google Apps Script 是否已配置
- ✅ **顯示清晰的警告** 如果未配置
- ✅ **提供配置指引** 包括具體步驟
- ✅ **禁用登入按鈕** 如果未配置（避免用戶困惑）

---

## 🔍 驗證步驟

### 步驟 1: 打開登入模態框

1. 訪問網站：https://qwerboy-design.github.io/gemini-fintech-pro/
2. 點擊右上角的「登入」按鈕
3. 觀察登入模態框的顯示內容

### 步驟 2: 檢查未配置狀態（預期行為）

**如果 Google Apps Script 未配置**，您應該看到：

1. **黃色警告框**：
   - 📍 位置：模態框頂部
   - 🎨 顏色：黃色背景 (`bg-yellow-900/30`)
   - 📝 標題：「Google Apps Script 未配置」
   - 📋 內容：配置步驟說明

2. **配置指引**：
   ```
   - 請按照 GOOGLE_APPS_SCRIPT_SETUP.md 的說明進行配置
   - 創建 Google Sheet 和 Apps Script 專案
   - 部署為 Web App 並獲取 URL
   - 在 .env 文件中設置 VITE_GAS_URL
   ```

3. **登入按鈕狀態**：
   - 🔴 按鈕被禁用（灰色，無法點擊）
   - 💡 懸停時顯示提示：「請先配置 Google Apps Script」

4. **底部狀態**：
   - 不顯示 "✓ Google Apps Script 已配置"

### 步驟 3: 檢查已配置狀態

**如果 Google Apps Script 已配置**（設置了 `VITE_GAS_URL`），您應該看到：

1. **沒有警告框**：
   - 頂部沒有黃色警告

2. **登入按鈕狀態**：
   - ✅ 按鈕可點擊（紫色）
   - 可以正常提交表單

3. **底部狀態**：
   - 顯示 "✓ Google Apps Script 已配置"

---

## 🧪 測試場景

### 測試 1: 未配置狀態（本地開發）

1. **確保 `.env` 文件中沒有 `VITE_GAS_URL`**：
   ```bash
   # 檢查 .env 文件
   # 應該沒有 VITE_GAS_URL 或值為空
   ```

2. **啟動開發服務器**：
   ```bash
   npm run dev
   ```

3. **測試登入模態框**：
   - 打開瀏覽器：http://localhost:5173
   - 點擊「登入」按鈕
   - 應該看到黃色警告框和配置指引

4. **嘗試提交表單**：
   - 輸入帳號
   - 點擊「登入」按鈕
   - 應該顯示錯誤訊息（因為未配置）
   - 按鈕應該被禁用

### 測試 2: 已配置狀態（本地開發）

1. **設置環境變數**：
   ```env
   # .env 文件
   VITE_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

2. **重啟開發服務器**：
   ```bash
   # 停止當前服務器（Ctrl+C）
   npm run dev
   ```

3. **測試登入模態框**：
   - 打開瀏覽器：http://localhost:5173
   - 點擊「登入」按鈕
   - 不應該看到黃色警告框
   - 應該看到 "✓ Google Apps Script 已配置"
   - 登入按鈕應該可點擊

4. **嘗試登入**：
   - 輸入帳號
   - 點擊「登入」按鈕
   - 應該嘗試調用 Google Apps Script API
   - 如果 API 正常，應該成功登入

### 測試 3: 部署後驗證（GitHub Pages）

1. **訪問部署的網站**：
   - https://qwerboy-design.github.io/gemini-fintech-pro/

2. **檢查配置狀態**：
   - 點擊「登入」按鈕
   - 觀察顯示的內容
   - 驗證警告或成功提示是否正確

**注意**：GitHub Pages 是靜態部署，不會讀取本地 `.env` 文件。環境變數需要在構建時設置（通過 GitHub Secrets 或構建時的環境變數）。

---

## 🐛 故障排除

### 問題 1: 即使配置了 URL，仍顯示未配置

**可能原因**：
- `.env` 文件中的 URL 格式錯誤
- 環境變數名稱錯誤（應該是 `VITE_GAS_URL`）
- 開發服務器需要重啟

**解決方案**：
1. 檢查 `.env` 文件格式：
   ```env
   VITE_GAS_URL=https://script.google.com/macros/s/YOUR_ID/exec
   ```
2. 確保沒有多餘的空格或引號
3. 重啟開發服務器

### 問題 2: 警告框沒有顯示

**可能原因**：
- 環境變數已正確設置
- 組件邏輯錯誤

**解決方案**：
1. 檢查控制台是否有錯誤
2. 確認 `googleAppsScriptUrl` prop 是否正確傳遞

### 問題 3: 登入按鈕仍然可點擊（即使未配置）

**可能原因**：
- `disabled` 屬性沒有正確設置

**解決方案**：
1. 檢查瀏覽器控制台
2. 確認 `isGASConfigured` 邏輯正確

---

## 📊 預期行為對照表

| 狀態 | 警告框 | 登入按鈕 | 底部提示 | 提交表單 |
|------|--------|----------|----------|----------|
| **未配置** | ✅ 顯示（黃色） | ❌ 禁用 | 無 | 顯示錯誤 |
| **已配置** | ❌ 不顯示 | ✅ 啟用 | ✅ 顯示 | 調用 API |

---

## ✅ 驗證檢查清單

### 未配置狀態

- [ ] 打開登入模態框時顯示黃色警告框
- [ ] 警告框包含配置指引
- [ ] 登入按鈕被禁用（灰色）
- [ ] 懸停按鈕時顯示提示文字
- [ ] 嘗試提交時顯示配置錯誤訊息
- [ ] 底部不顯示成功提示

### 已配置狀態

- [ ] 打開登入模態框時不顯示警告框
- [ ] 登入按鈕可點擊（紫色）
- [ ] 底部顯示 "✓ Google Apps Script 已配置"
- [ ] 可以提交表單
- [ ] API 調用正常（如果 GAS 正確設置）

---

## 🔧 配置 Google Apps Script

如果需要配置 Google Apps Script，請參考：

**詳細指南**: `GOOGLE_APPS_SCRIPT_SETUP.md`

**快速步驟**：
1. 創建 Google Sheet
2. 創建 Google Apps Script 專案
3. 複製 `google-apps-script/Code.gs` 到編輯器
4. 更新 `SHEET_ID`
5. 運行 `initializeSheet()` 函數
6. 部署為 Web App
7. 複製部署 URL 到 `.env` 文件

---

**最後更新**: 2025-12-16  
**狀態**: ✅ 配置檢查功能已實現







