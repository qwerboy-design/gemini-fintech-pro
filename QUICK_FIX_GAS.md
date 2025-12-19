# 🚀 快速修復 Google Apps Script 配置問題

**問題**: `.env` 文件不存在或配置不正確

---

## ✅ 解決步驟

### 步驟 1: 創建 `.env` 文件

1. **在專案根目錄**（與 `package.json` 同一層）創建 `.env` 文件

2. **Windows (PowerShell)**:
   ```powershell
   # 在專案根目錄執行
   New-Item -Path .env -ItemType File -Force
   ```

3. **Windows (CMD)**:
   ```cmd
   type nul > .env
   ```

4. **或直接使用編輯器創建文件**

### 步驟 2: 填入正確的配置

在 `.env` 文件中添加以下內容（**將 `YOUR_DEPLOYMENT_ID` 替換為您的實際 URL**）:

```env
# Google Apps Script Web App URL
VITE_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

**⚠️ 重要格式要求**:
- ✅ **不要**加引號
- ✅ **不要**在等號兩邊加空格
- ✅ 必須以 `VITE_` 開頭
- ✅ URL 應以 `https://script.google.com/macros/s/` 開頭
- ✅ URL 應以 `/exec` 結尾

**正確範例**:
```env
VITE_GAS_URL=https://script.google.com/macros/s/AKfycbzoEKE_10KGmlx8DfLgPa1SohOUYhrxuwmCHJRMogTkarwBL9NBAjBmP23JgRVE_GUk/exec
```

**錯誤範例** ❌:
```env
# ❌ 有引號
VITE_GAS_URL="https://..."

# ❌ 有空格
VITE_GAS_URL = "https://..."

# ❌ 缺少 VITE_ 前綴
GAS_URL=https://...
```

### 步驟 3: 驗證配置

1. **運行診斷工具**:
   ```bash
   node check-env.js
   ```

2. **檢查文件是否正確創建**:
   ```powershell
   # Windows PowerShell
   Get-Content .env
   ```

3. **確認輸出包含**:
   ```
   VITE_GAS_URL=https://script.google.com/macros/s/.../exec
   ```

### 步驟 4: 重啟開發服務器

**⚠️ 重要**: Vite 只在啟動時讀取環境變數，修改 `.env` 後必須重啟！

```bash
# 1. 停止當前服務器（Ctrl+C）
# 2. 重新啟動
npm run dev
```

### 步驟 5: 驗證環境變數是否載入

1. **打開瀏覽器**: http://localhost:5173
2. **打開開發者工具** (F12)
3. **切換到 Console 標籤**
4. **輸入以下命令**:
   ```javascript
   console.log(import.meta.env.VITE_GAS_URL)
   ```

5. **預期結果**:
   - ✅ 應該顯示您的完整 Google Apps Script URL
   - ❌ 如果顯示 `undefined`，說明配置未生效

### 步驟 6: 測試登入功能

1. 點擊「登入」按鈕
2. 應該**不顯示**黃色警告框
3. 應該顯示「✓ Google Apps Script 已配置」
4. 登入按鈕應該是紫色（不是黃色）
5. 輸入帳號並點擊「登入」測試

---

## 🔍 常見問題

### Q1: 即使創建了 `.env`，仍顯示「未配置」

**可能原因**:
- 開發服務器未重啟
- 環境變數格式錯誤
- 文件位置錯誤

**解決方案**:
1. 確認 `.env` 在專案根目錄（與 `package.json` 同層）
2. 確認格式正確（無引號、無空格）
3. 重啟開發服務器

### Q2: 如何獲取 Google Apps Script URL？

1. 訪問 https://script.google.com
2. 打開您的 Apps Script 專案
3. 點擊「部署」→「管理部署」
4. 點擊部署旁邊的「複製 URL」圖標
5. URL 格式: `https://script.google.com/macros/s/.../exec`

### Q3: GitHub Pages 部署後無法使用

**原因**: GitHub Pages 是靜態部署，不會讀取本地 `.env` 文件

**解決方案**: 
1. 在 GitHub 倉庫設置 Secrets: `Settings` → `Secrets and variables` → `Actions`
2. 添加 `VITE_GAS_URL` secret
3. 更新 `.github/workflows/deploy.yml`，在 build 步驟添加:
   ```yaml
   - name: Build
     run: npm run build
     env:
       VITE_GAS_URL: ${{ secrets.VITE_GAS_URL }}
   ```

---

## ✅ 驗證清單

完成以下所有步驟後，您的配置應該正常運作：

- [ ] `.env` 文件已創建在專案根目錄
- [ ] `.env` 中包含 `VITE_GAS_URL=https://.../exec`
- [ ] URL 格式正確（無引號、無空格）
- [ ] 開發服務器已重啟
- [ ] 瀏覽器 Console 顯示 `import.meta.env.VITE_GAS_URL` 有值
- [ ] 登入模態框不顯示警告
- [ ] 登入按鈕為紫色（不是黃色）

---

## 📝 快速命令參考

```bash
# 1. 創建 .env 文件（Windows PowerShell）
New-Item -Path .env -ItemType File -Force

# 2. 檢查 .env 內容
Get-Content .env

# 3. 運行診斷工具
node check-env.js

# 4. 重啟開發服務器
npm run dev
```

---

**最後更新**: 2025-12-16







