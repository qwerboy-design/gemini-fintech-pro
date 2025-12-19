   # Google Apps Script 設定指南

**創建日期**: 2025-12-16  
**用途**: 將登入用戶資訊存儲到 Google Sheets

---

## 📋 前置準備

### 1. 創建 Google Sheet

1. 訪問 [Google Sheets](https://sheets.google.com)
2. 創建新的空白試算表
3. 記錄 Sheet ID（在 URL 中找到）：
   ```
   https://docs.google.com/spreadsheets/d/[1pB5UyKUcgQ4NU7yme1aDiLCWvr6gXHYq5CglWYj5IvU0QVzwi2z32nd9]/edit
   ```
   `SHEET_ID` 就是您需要的 ID

---

## 🔧 設置步驟

### 步驟 1: 創建 Google Apps Script 專案

1. 訪問 [Google Apps Script](https://script.google.com)
2. 點擊「新增專案」
3. 複製 `google-apps-script/Code.gs` 的內容到編輯器
4. 更新 `SHEET_ID` 變數為您的 Google Sheet ID：
   ```javascript
   const SHEET_ID = '您的_SHEET_ID'; // 替換這裡
   ```

### 步驟 2: 初始化工作表

1. 在 Apps Script 編輯器中，選擇 `initializeSheet` 函數
2. 點擊「執行」按鈕
3. 首次執行需要授權：
   - 點擊「檢閱權限」
   - 選擇您的 Google 帳號
   - 點擊「進階」→「前往 [專案名稱]（不安全）」
   - 點擊「允許」

### 步驟 3: 部署為 Web App

1. 點擊「部署」→「新增部署」
2. 選擇「類型」→「網頁應用程式」
3. 設置：
   - **說明**: 股票登入系統 API
   - **執行身分**: 我
   - **具有存取權的使用者**: 任何人
   - **版本**: 新版本（或選擇現有版本）
4. 點擊「部署」
5. **重要**: 複製「Web 應用程式 URL」

### 步驟 4: 配置環境變數

1. 在專案根目錄創建 `.env` 文件（如果不存在）
2. 添加以下內容：
   ```env
   VITE_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```
   將 `YOUR_DEPLOYMENT_ID` 替換為部署後獲得的實際 URL

3. 如果已有 `.env.example`，更新它作為範本：
   ```env
   # Google Apps Script Web App URL
   VITE_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

---

## ✅ 驗證設置

### 測試連接

1. 在瀏覽器中訪問您的 Web App URL（GET 請求）
2. 應該看到 JSON 響應：
   ```json
   {
     "success": true,
     "message": "Google Apps Script Web App 運行正常",
     "timestamp": "2025-12-16T..."
   }
   ```

### 測試登入功能

1. 啟動開發服務器：`npm run dev`
2. 點擊「登入」按鈕
3. 輸入帳號
4. 提交表單
5. 檢查 Google Sheet 是否添加了新行

---

## 📊 Google Sheet 結構

### 工作表：登入記錄

| 時間戳記 | 用戶 ID | IP 地址 | 狀態 |
|---------|---------|---------|------|
| 2025-12-16 10:30:00 | user123 | N/A | 成功 |

### 欄位說明

- **時間戳記**: 登入時間（ISO 格式）
- **用戶 ID**: 用戶輸入的帳號
- **IP 地址**: 客戶端 IP（目前為 N/A，可通過其他方式獲取）
- **狀態**: 登入狀態（成功/失敗）

---

## 🔒 安全性考量

### 當前設置

- **執行身分**: 我（使用您的 Google 帳號執行）
- **存取權限**: 任何人（公開訪問）

### 建議改進

1. **限制存取**:
   - 如果需要限制存取，可以：
     - 使用 Google OAuth 驗證
     - 添加 API Key 驗證
     - 使用 IP 白名單（需要額外設置）

2. **數據驗證**:
   - 在 Apps Script 中驗證輸入格式
   - 防止重複登入記錄（可選）
   - 添加速率限制

3. **錯誤處理**:
   - 記錄錯誤日誌
   - 發送錯誤通知（可選）

---

## 🐛 故障排除

### 問題 1: "找不到工作表"

**解決方案**:
1. 運行 `initializeSheet` 函數
2. 或手動在 Google Sheet 中創建名為「登入記錄」的工作表

### 問題 2: "權限不足"

**解決方案**:
1. 確保已授權 Apps Script 訪問 Google Sheets
2. 重新運行並授權

### 問題 3: CORS 錯誤

**解決方案**:
- Google Apps Script Web App 默認支持 CORS
- 如果仍有問題，檢查部署設置

### 問題 4: 無法寫入 Sheet

**解決方案**:
1. 確認 Sheet ID 正確
2. 確認工作表名稱匹配（默認：登入記錄）
3. 確認有寫入權限

---

## 📝 代碼說明

### 主要函數

1. **doGet()**: 處理 GET 請求（測試連接）
2. **doPost()**: 處理 POST 請求（登入請求）
3. **handleLogin()**: 處理登入邏輯
4. **addLoginRecord()**: 將數據寫入 Sheet
5. **initializeSheet()**: 初始化工作表結構

### 自定義配置

可以在 `Code.gs` 中自定義：

```javascript
const SHEET_ID = 'YOUR_SHEET_ID';        // Sheet ID
const SHEET_NAME = '登入記錄';            // 工作表名稱
```

---

## 🚀 下一步

1. ✅ 完成 Google Apps Script 設置
2. ✅ 配置環境變數
3. ✅ 測試登入功能
4. ⏭️ 可選：添加更多功能（查詢記錄、統計等）

---

**最後更新**: 2025-12-16






