# GitHub Pages 部署指南

## 概述

本文件提供將 Gemini FinTech Pro 專案部署至 GitHub Pages 的完整步驟與說明。

---

## 前置需求

### 1. 確認環境
- ✅ Node.js 已安裝（建議 v18+）
- ✅ Git 已安裝並設定
- ✅ GitHub 帳號與倉庫權限
- ✅ 專案已推送到 GitHub 遠端倉庫

### 2. 確認倉庫資訊
- **倉庫名稱**: `gemini-fintech-pro`
- **GitHub 用戶/組織**: `qwerboy-design`
- **完整 URL**: `https://github.com/qwerboy-design/gemini-fintech-pro.git`

---

## 部署流程

### 步驟 1: 配置 Vite 設定

Vite 需要設定 `base` 路徑以正確處理 GitHub Pages 的子路徑。

**文件**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/gemini-fintech-pro/', // GitHub Pages 的倉庫名稱路徑
})
```

**重要說明**:
- 如果您的 GitHub Pages 使用自定義域名，可以設定為 `/`
- 如果使用 `username.github.io` 根路徑，設定為 `/`
- 如果使用專案頁面（`username.github.io/repo-name`），設定為 `/repo-name/`

---

### 步驟 2: 更新 package.json 部署腳本

**文件**: `package.json`

添加以下腳本：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist",
    "predeploy": "npm run build"
  }
}
```

**腳本說明**:
- `predeploy`: 部署前自動執行的腳本（構建專案）
- `deploy`: 執行構建並將 `dist` 目錄部署到 `gh-pages` 分支

---

### 步驟 3: 執行部署

#### 方法 A: 使用 npm 腳本（推薦）

```bash
# 安裝依賴（如尚未安裝）
npm install

# 執行部署
npm run deploy
```

#### 方法 B: 手動部署

```bash
# 1. 構建專案
npm run build

# 2. 部署到 gh-pages 分支
npx gh-pages -d dist
```

---

### 步驟 4: 啟用 GitHub Pages

1. 前往 GitHub 倉庫頁面
2. 點擊 **Settings**（設定）
3. 在左側選單找到 **Pages**（頁面）
4. 在 **Source** 區塊中：
   - 選擇 **Deploy from a branch**
   - Branch: 選擇 **gh-pages**
   - Folder: 選擇 **/ (root)**
5. 點擊 **Save**（儲存）

---

### 步驟 5: 驗證部署

部署完成後，GitHub Pages 的 URL 通常為：
```
https://qwerboy-design.github.io/gemini-fintech-pro/
```

**注意**: 
- 首次部署可能需要幾分鐘時間
- 如果出現 404，請等待 5-10 分鐘後再試
- 檢查 GitHub Actions（如有使用）或 gh-pages 分支的提交記錄

---

## 自動化部署（進階）

### 使用 GitHub Actions（推薦）

創建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      pages: write
      id-token: write
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 故障排除

### 問題 1: 頁面顯示空白

**原因**: 資源路徑不正確

**解決方案**:
1. 確認 `vite.config.ts` 中的 `base` 設定正確
2. 檢查瀏覽器 Console 是否有 404 錯誤
3. 確認 `dist/index.html` 中的資源路徑

### 問題 2: 樣式或圖示無法載入

**原因**: 靜態資源路徑問題

**解決方案**:
- 確認 `public` 目錄中的檔案路徑使用相對路徑
- 檢查 `vite.config.ts` 的 `base` 設定

### 問題 3: gh-pages 部署失敗

**錯誤訊息**: `fatal: A branch named 'gh-pages' already exists.`

**解決方案**:
```bash
# 刪除現有的 gh-pages 分支（遠端）
git push origin --delete gh-pages

# 重新部署
npm run deploy
```

### 問題 4: 路由無法正常工作

**原因**: React Router（如使用）需要額外配置

**解決方案**:
- 如果使用 React Router，需要設定 HashRouter 或配置 404.html 重定向
- 參考 [React Router 官方文檔](https://reactrouter.com/en/main/start/overview)

---

## 更新部署

當您需要更新網站內容時：

```bash
# 1. 確保本地更改已提交
git add .
git commit -m "feat: 更新內容"

# 2. 推送到 main 分支
git push origin main

# 3. 重新部署
npm run deploy
```

---

## 環境變數處理

### 注意事項

GitHub Pages 是靜態網站託管，**無法使用後端環境變數**。

如果您的應用需要使用環境變數（如 API Key）：

1. **使用 Vite 環境變數前綴**: `VITE_`
   ```typescript
   // .env
   VITE_API_KEY=your_api_key_here
   
   // 在程式碼中使用
   const apiKey = import.meta.env.VITE_API_KEY
   ```

2. **安全考量**:
   - ⚠️ **警告**: 所有 `VITE_` 前綴的變數會被打包到客戶端程式碼中
   - 🔴 **絕不**將真實的 API Key 放在環境變數中（如果該 Key 不應該暴露）
   - 考慮使用代理伺服器或後端 API 來保護敏感資訊

---

## 部署檢查清單

部署前請確認：

- [ ] `vite.config.ts` 已設定正確的 `base` 路徑
- [ ] `package.json` 已添加 `deploy` 腳本
- [ ] 所有依賴已安裝（`npm install`）
- [ ] 本地構建成功（`npm run build`）
- [ ] 本地預覽正常（`npm run preview`）
- [ ] GitHub 倉庫的 Pages 設定已啟用
- [ ] gh-pages 分支已創建並包含構建結果

---

## 參考資源

- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [gh-pages 套件文檔](https://github.com/tschaub/gh-pages)
- [GitHub Pages 官方文檔](https://docs.github.com/zh/pages)

---

**文件版本**: 1.0  
**最後更新**: 2025-12-16  
**維護者**: System Analyst Team








