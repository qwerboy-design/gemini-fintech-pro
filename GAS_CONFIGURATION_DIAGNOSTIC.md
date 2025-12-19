# Google Apps Script 配置診斷指南

**創建日期**: 2025-12-16  
**用途**: 診斷和解決 Google Apps Script 配置問題

---

## 🔍 常見問題檢查清單

### 問題 1: `.env` 文件不存在或位置錯誤

**症狀**: 
- 登入模態框顯示「Google Apps Script 未配置」
- 即使已在 `.env` 填入 URL

**解決方案**:

1. **確認 `.env` 文件位置**:
   ```
   專案根目錄/
   ├── .env          ← 必須在這裡
   ├── package.json
   ├── vite.config.ts
   └── src/
   ```

2. **確認 `.env` 文件格式**:
   ```env
   # 正確格式（無引號，無空格）
   VITE_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   
   # 錯誤格式範例 ❌
   VITE_GAS_URL="https://..."        # 不要加引號
   VITE_GAS_URL = "https://..."      # 等號兩邊不要有空格
   ```

3. **檢查 `.env` 文件是否在 `.gitignore` 中**:
   ```bash
   # .gitignore 應該包含
   .env
   .env.local
   ```

### 問題 2: 開發服務器未重啟

**症狀**: 
- 修改 `.env` 後，應用仍讀取舊值

**解決方案**:
1. 停止開發服務器（Ctrl+C）
2. 重新啟動：`npm run dev`
3. **重要**: Vite 只會在啟動時讀取環境變數

### 問題 3: 環境變數名稱錯誤

**症狀**: 
- 變數無法讀取

**檢查**:
- ✅ 必須以 `VITE_` 開頭
- ✅ 變數名必須完全匹配：`VITE_GAS_URL`
- ❌ 不要使用 `GAS_URL` 或 `GOOGLE_APPS_SCRIPT_URL`

### 問題 4: GitHub Pages 部署環境變數

**症狀**: 
- 本地開發正常，部署後無法使用

**原因**: 
GitHub Pages 是靜態部署，不會讀取本地 `.env` 文件

**解決方案**: 

#### 方式 1: 使用 GitHub Secrets（推薦）

1. 在 GitHub 倉庫設置 Secrets:
   - 前往: `Settings` → `Secrets and variables` → `Actions`
   - 點擊 `New repository secret`
   - Name: `VITE_GAS_URL`
   - Value: 您的 Google Apps Script URL

2. 更新 `.github/workflows/deploy.yml`:
   ```yaml
   - name: Build
     run: npm run build
     env:
       VITE_GAS_URL: ${{ secrets.VITE_GAS_URL }}
   ```

#### 方式 2: 在構建時直接設置（不推薦，會暴露 URL）

⚠️ **注意**: 這種方式會將 URL 暴露在代碼中，不建議用於敏感 URL。

---

## 🧪 診斷步驟

### 步驟 1: 檢查環境變數讀取

1. **在瀏覽器控制台檢查**:
   ```javascript
   // 在瀏覽器開發者工具 Console 中輸入
   console.log(import.meta.env.VITE_GAS_URL);
   ```

2. **預期結果**:
   - 已配置: 顯示完整的 URL
   - 未配置: 顯示 `undefined`

### 步驟 2: 驗證 `.env` 文件

創建或檢查 `.env` 文件：

```bash
# Windows (PowerShell)
Get-Content .env

# 或使用編輯器直接打開 .env 文件
```

**正確格式**:
```env
VITE_GAS_URL=https://script.google.com/macros/s/AKfycbzXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec
```

**常見錯誤**:
- ❌ 有引號: `VITE_GAS_URL="https://..."`
- ❌ 有多餘空格: `VITE_GAS_URL = https://...`
- ❌ 缺少 `VITE_` 前綴: `GAS_URL=https://...`
- ❌ 使用單引號: `VITE_GAS_URL='https://...'`

### 步驟 3: 測試 Google Apps Script URL

1. **在瀏覽器中直接訪問 URL** (GET 請求):
   ```
   https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

2. **預期響應**:
   ```json
   {
     "success": true,
     "message": "Google Apps Script Web App 運行正常",
     "timestamp": "2025-12-16T..."
   }
   ```

3. **如果看到錯誤**:
   - 檢查 Google Apps Script 是否正確部署
   - 確認部署權限設置為「任何人」
   - 確認 `doGet()` 函數存在

### 步驟 4: 檢查 Google Apps Script 代碼

1. **確認 `Code.gs` 中的 `SHEET_ID` 已更新**:
   ```javascript
   // ❌ 錯誤（還是佔位符）
   const SHEET_ID = 'YOUR_SHEET_ID_HERE';
   
   // ✅ 正確（已替換為實際 Sheet ID）
   const SHEET_ID = '1pB5UyKUcgQ4NU7yme1aDiLCWvr6gXHYq5CglWYj5IvU0QVzwi2z32nd9';
   ```

2. **確認工作表名稱**:
   ```javascript
   const SHEET_NAME = '登入記錄'; // 必須與 Google Sheet 中的工作表名稱匹配
   ```

3. **確認已運行 `initializeSheet()` 函數**:
   - 在 Apps Script 編輯器中
   - 選擇 `initializeSheet` 函數
   - 點擊「執行」
   - 檢查執行日誌是否有錯誤

---

## 🐛 常見錯誤訊息和解決方案

### 錯誤 1: "Google Apps Script 未配置"

**可能原因**:
- `.env` 文件不存在
- 環境變數名稱錯誤
- 開發服務器未重啟

**解決步驟**:
1. 確認 `.env` 文件在專案根目錄
2. 檢查變數名為 `VITE_GAS_URL`
3. 重啟開發服務器

### 錯誤 2: "請求失敗: 404"

**可能原因**:
- Google Apps Script URL 錯誤
- 部署未完成

**解決步驟**:
1. 確認 URL 完整且正確
2. 在瀏覽器中直接訪問 URL 測試
3. 檢查 Google Apps Script 部署狀態

### 錯誤 3: "保存登入記錄時發生錯誤"

**可能原因**:
- `SHEET_ID` 錯誤
- 工作表不存在
- 權限不足

**解決步驟**:
1. 確認 `Code.gs` 中的 `SHEET_ID` 正確
2. 運行 `initializeSheet()` 函數創建工作表
3. 確認 Apps Script 有寫入 Sheet 的權限

### 錯誤 4: "缺少必要欄位：userId"

**可能原因**:
- 前端未正確發送數據
- 請求格式錯誤

**解決步驟**:
1. 檢查瀏覽器 Network 標籤
2. 確認請求體包含 `action: 'login'` 和 `userId`
3. 確認 Content-Type 為 `application/json`

---

## 🔧 快速修復腳本

### 檢查環境變數是否正確讀取

在 `src/App.tsx` 中暫時添加（調試用）:

```typescript
// 在 App 組件開始處添加
console.log('VITE_GAS_URL:', import.meta.env.VITE_GAS_URL);
console.log('All env vars:', import.meta.env);
```

### 驗證 `.env` 文件格式

創建一個測試腳本 `check-env.js`:

```javascript
import { readFileSync } from 'fs';

try {
  const envContent = readFileSync('.env', 'utf-8');
  const lines = envContent.split('\n');
  
  const gasUrlLine = lines.find(line => line.startsWith('VITE_GAS_URL'));
  
  if (!gasUrlLine) {
    console.error('❌ VITE_GAS_URL 未找到');
  } else {
    console.log('✅ 找到 VITE_GAS_URL:', gasUrlLine);
    
    // 檢查格式
    if (gasUrlLine.includes('"') || gasUrlLine.includes("'")) {
      console.warn('⚠️  警告: URL 包含引號，可能導致問題');
    }
    
    if (gasUrlLine.includes(' = ')) {
      console.warn('⚠️  警告: 等號兩邊有空格');
    }
  }
} catch (error) {
  console.error('❌ 無法讀取 .env 文件:', error.message);
}
```

---

## ✅ 驗證檢查清單

完成以下檢查以確認配置正確：

- [ ] `.env` 文件存在於專案根目錄
- [ ] `.env` 文件中包含 `VITE_GAS_URL=https://...`
- [ ] URL 格式正確（無引號，無多餘空格）
- [ ] 變數名稱為 `VITE_GAS_URL`（以 `VITE_` 開頭）
- [ ] 開發服務器已重啟（修改 `.env` 後）
- [ ] 瀏覽器控制台顯示 `import.meta.env.VITE_GAS_URL` 有值
- [ ] Google Apps Script URL 在瀏覽器中可訪問（GET 請求）
- [ ] `Code.gs` 中的 `SHEET_ID` 已更新為實際值
- [ ] 已運行 `initializeSheet()` 函數
- [ ] Google Apps Script 部署權限設置為「任何人」
- [ ] 登入模態框不再顯示「未配置」警告

---

## 📝 測試步驟

1. **本地測試**:
   ```bash
   # 1. 確認 .env 文件存在並正確配置
   # 2. 重啟開發服務器
   npm run dev
   
   # 3. 打開瀏覽器訪問 http://localhost:5173
   # 4. 打開開發者工具 Console
   # 5. 輸入: console.log(import.meta.env.VITE_GAS_URL)
   # 6. 應該顯示您的 URL
   ```

2. **測試登入功能**:
   - 點擊「登入」按鈕
   - 應該**不**顯示黃色警告框
   - 輸入帳號並點擊「登入」
   - 檢查 Google Sheet 是否添加了新記錄

3. **生產環境測試**（如果已部署）:
   - 訪問 https://qwerboy-design.github.io/gemini-fintech-pro/
   - 檢查登入功能是否正常
   - 如果未配置，需要通過 GitHub Secrets 設置

---

## 🆘 如果問題仍未解決

1. **收集診斷信息**:
   - 瀏覽器控制台的錯誤訊息
   - Network 標籤中的請求詳情
   - `.env` 文件內容（**注意**: 不要分享真實 URL）
   - Google Apps Script 執行日誌

2. **檢查日誌**:
   - 瀏覽器 Console: `console.log(import.meta.env)`
   - Google Apps Script 執行日誌: Apps Script 編輯器 → 執行 → 查看日誌

3. **驗證步驟**:
   - 確認所有步驟都已完成
   - 使用上述檢查清單逐一驗證

---

**最後更新**: 2025-12-16






