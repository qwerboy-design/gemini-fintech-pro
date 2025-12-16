# 📝 創建 .env 文件指南

根據診斷結果，您的專案缺少 `.env` 文件。請按照以下步驟操作：

---

## 🚀 快速解決（3 步驟）

### 步驟 1: 創建 `.env` 文件

**Windows PowerShell**（在專案根目錄執行）:
```powershell
New-Item -Path .env -ItemType File -Force
```

**或使用編輯器**:
- 在專案根目錄（與 `package.json` 同一層）
- 創建新文件，命名為 `.env`（注意開頭的點）

### 步驟 2: 複製配置

在 `.env` 文件中添加以下內容：

```env
# Google Apps Script Web App URL
VITE_GAS_URL=https://script.google.com/macros/s/AKfycbzoEKE_10KGmlx8DfLgPa1SohOUYhrxuwmCHJRMogTkarwBL9NBAjBmP23JgRVE_GUk/exec

# Google Gemini AI API Key（如果需要）
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**⚠️ 重要**:
- 上面顯示的 URL 是從您的 `.env.example` 中發現的
- 如果這是您的實際 URL，可以直接使用
- 如果這不是您的 URL，請替換為正確的 URL

### 步驟 3: 重啟開發服務器

```bash
# 停止當前服務器（如果正在運行）
# 按 Ctrl+C

# 重新啟動
npm run dev
```

---

## ✅ 驗證配置

### 方法 1: 使用診斷工具

```bash
node check-env.js
```

應該看到：
```
✅ 環境變數配置看起來正確！
```

### 方法 2: 在瀏覽器中檢查

1. 訪問: http://localhost:5173
2. 打開開發者工具 (F12)
3. 在 Console 輸入:
   ```javascript
   console.log(import.meta.env.VITE_GAS_URL)
   ```
4. 應該顯示您的 URL

### 方法 3: 測試登入功能

1. 點擊「登入」按鈕
2. 應該**不顯示**黃色警告框
3. 應該顯示「✓ Google Apps Script 已配置」
4. 登入按鈕應該是紫色

---

## ⚠️ 額外檢查：Google Apps Script 配置

### 檢查 1: Code.gs 中的 SHEET_ID

請確認 `google-apps-script/Code.gs` 第 19 行：

**當前狀態**（可能是佔位符）:
```javascript
const SHEET_ID = 'YOUR_SHEET_ID_HERE';
```

**應該更新為**（您的實際 Sheet ID）:
```javascript
const SHEET_ID = '1pB5UyKUcgQ4NU7yme1aDiLCWvr6gXHYq5CglWYj5IvU0QVzwi2z32nd9';
```

### 檢查 2: 運行 initializeSheet() 函數

1. 在 Google Apps Script 編輯器中
2. 選擇 `initializeSheet` 函數
3. 點擊「執行」
4. 確認執行成功

---

## 🔍 如果仍有問題

### 問題 1: 登入時出現錯誤

**檢查**:
- Google Apps Script URL 是否正確
- 在瀏覽器中直接訪問 URL（GET 請求）應該返回 JSON

### 問題 2: 無法寫入 Google Sheet

**檢查**:
- `Code.gs` 中的 `SHEET_ID` 是否正確
- 是否已運行 `initializeSheet()` 函數
- Apps Script 是否有寫入權限

### 問題 3: 部署後無法使用

**原因**: GitHub Pages 不會讀取本地 `.env` 文件

**解決方案**: 參考 `GITHUB_ACTIONS_DEPLOYMENT.md`，在 GitHub Secrets 中設置環境變數

---

## 📋 完整檢查清單

- [ ] `.env` 文件已創建
- [ ] `VITE_GAS_URL` 已正確填入
- [ ] URL 格式正確（無引號、無空格）
- [ ] 開發服務器已重啟
- [ ] 瀏覽器 Console 顯示 URL 有值
- [ ] 登入模態框不顯示警告
- [ ] `Code.gs` 中的 `SHEET_ID` 已更新
- [ ] 已運行 `initializeSheet()` 函數
- [ ] 登入功能測試成功

---

**最後更新**: 2025-12-16
