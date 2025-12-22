# GitHub Actions 自動部署指南

**創建日期**: 2025-12-16  
**用途**: 自動將專案部署到 GitHub Pages

---

## ✅ 自動部署功能

### 功能說明

現在專案已配置 GitHub Actions 工作流，當您推送代碼到 `main` 分支時，會自動：

1. ✅ 構建專案（`npm run build`）
2. ✅ 部署到 GitHub Pages
3. ✅ 無需手動執行 `npm run deploy`

---

## 🔧 設置步驟

### 步驟 1: 啟用 GitHub Pages

1. 前往您的 GitHub 倉庫
2. 點擊 **Settings** → **Pages**
3. 在 **Source** 下拉選單中選擇：
   - **Source**: `GitHub Actions`
   - （不要選擇 `gh-pages` 分支，因為我們使用 Actions 部署）
4. 點擊 **Save**

### 步驟 2: 檢查工作流文件

確保 `.github/workflows/deploy.yml` 文件已存在並包含正確的配置。

### 步驟 3: 推送代碼

```bash
git add .
git commit -m "feat: 設置 GitHub Actions 自動部署"
git push origin main
```

### 步驟 4: 查看部署狀態

1. 前往您的 GitHub 倉庫
2. 點擊 **Actions** 標籤
3. 您應該會看到 "Deploy to GitHub Pages" 工作流正在運行
4. 點擊工作流查看詳細日誌

---

## 📋 工作流配置說明

### 觸發條件

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch: # 允許手動觸發
```

- **自動觸發**: 推送到 `main` 分支時
- **手動觸發**: 在 GitHub Actions 頁面可以手動運行

### 構建步驟

1. **Checkout**: 檢出代碼
2. **Setup Node.js**: 設置 Node.js 20 環境
3. **Install dependencies**: 安裝依賴（`npm ci`）
4. **Build**: 構建專案（`npm run build`）
5. **Upload artifact**: 上傳構建產物

### 部署步驟

使用 GitHub Pages Actions 部署構建產物到 `gh-pages` 分支。

---

## 🔐 環境變數配置（可選）

如果您的構建需要使用環境變數（如 API Keys），可以在 GitHub Secrets 中設置：

### 設置 GitHub Secrets

1. 前往您的 GitHub 倉庫
2. 點擊 **Settings** → **Secrets and variables** → **Actions**
3. 點擊 **New repository secret**
4. 添加以下 secrets（如需要）：
   - `VITE_GAS_URL`: Google Apps Script URL
   - `VITE_GEMINI_API_KEY`: Gemini API Key

### 在工作流中使用

如果設置了 secrets，可以在 `deploy.yml` 的 Build 步驟中取消註釋：

```yaml
- name: Build
  run: npm run build
  env:
    VITE_GAS_URL: ${{ secrets.VITE_GAS_URL }}
    VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
```

---

## ⚠️ 注意事項

### 1. 構建時間

- 首次部署可能需要幾分鐘
- 後續部署通常更快（由於緩存）

### 2. 構建失敗

如果構建失敗，檢查：
- TypeScript 錯誤
- 依賴安裝問題
- 環境變數配置

### 3. 部署 URL

部署成功後，您的網站將在以下 URL 可用：
```
https://[您的用戶名].github.io/[倉庫名稱]/
```

例如：
```
https://qwerboy-design.github.io/gemini-fintech-pro/
```

---

## 🔄 部署流程

```
推送代碼到 main 分支
    ↓
GitHub Actions 觸發
    ↓
構建專案（npm run build）
    ↓
上傳構建產物
    ↓
部署到 GitHub Pages
    ↓
網站更新完成
```

---

## 🐛 故障排除

### 問題 1: 工作流沒有觸發

**解決方案**:
1. 確認 `.github/workflows/deploy.yml` 文件存在
2. 確認代碼已推送到 `main` 分支
3. 檢查 GitHub Actions 是否已啟用（Settings → Actions）

### 問題 2: 構建失敗

**解決方案**:
1. 查看 Actions 日誌了解錯誤原因
2. 確保所有依賴已正確安裝
3. 檢查 TypeScript 編譯錯誤

### 問題 3: 部署後網站未更新

**解決方案**:
1. 等待幾分鐘讓 GitHub Pages 更新
2. 清除瀏覽器快取
3. 檢查部署日誌確認是否成功

### 問題 4: 404 錯誤

**解決方案**:
1. 確認 `vite.config.ts` 中的 `base` 路徑正確
2. 確認 GitHub Pages 設置為使用 GitHub Actions
3. 檢查構建產物是否包含 `index.html`

---

## 📊 與手動部署的對比

| 特性 | 手動部署 (`npm run deploy`) | 自動部署 (GitHub Actions) |
|------|---------------------------|-------------------------|
| 觸發方式 | 手動執行命令 | 自動（推送代碼時） |
| 速度 | 快速 | 稍慢（需要構建時間） |
| 穩定性 | 依賴本地環境 | 使用統一構建環境 |
| 可追溯性 | 無日誌 | 有完整日誌 |
| 回滾 | 手動重新部署 | 可以查看歷史部署 |

---

## ✅ 驗證部署

### 1. 檢查 Actions 狀態

1. 前往 GitHub 倉庫的 **Actions** 標籤
2. 查看最新的工作流運行狀態
3. 應該顯示綠色的 ✓ 表示成功

### 2. 檢查部署狀態

1. 前往 **Settings** → **Pages**
2. 查看 "Latest deployment" 狀態
3. 應該顯示最新的部署時間和狀態

### 3. 訪問網站

訪問您的 GitHub Pages URL 確認網站已更新。

---

## 🚀 最佳實踐

1. **提交前測試**: 在本地運行 `npm run build` 確保構建成功
2. **檢查 Actions**: 推送後檢查 Actions 日誌確認部署成功
3. **使用分支保護**: 可以設置分支保護規則確保代碼質量
4. **環境變數**: 敏感信息使用 GitHub Secrets 而不是硬編碼

---

## 📝 工作流文件位置

```
.github/
└── workflows/
    └── deploy.yml  # GitHub Actions 工作流配置
```

---

**最後更新**: 2025-12-16  
**狀態**: ✅ 已配置並可以使用









