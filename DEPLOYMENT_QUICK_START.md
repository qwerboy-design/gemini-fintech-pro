# GitHub Pages 快速部署指南

## 📋 快速步驟

### 1. 確認配置已完成 ✅

以下文件已自動更新：
- ✅ `vite.config.ts` - 已設定 base path
- ✅ `package.json` - 已添加部署腳本

### 2. 執行部署命令

```bash
npm run deploy
```

此命令會自動：
1. 構建專案（`npm run build`）
2. 將 `dist` 目錄部署到 `gh-pages` 分支

### 3. 啟用 GitHub Pages

1. 前往 https://github.com/qwerboy-design/gemini-fintech-pro/settings/pages
2. 在 **Source** 區塊：
   - 選擇 **Deploy from a branch**
   - Branch: 選擇 **gh-pages**
   - Folder: 選擇 **/ (root)**
3. 點擊 **Save**

### 4. 訪問您的網站

部署完成後（約 1-2 分鐘），訪問：
```
https://qwerboy-design.github.io/gemini-fintech-pro/
```

---

## 🔄 更新部署

當程式碼變更後，重新執行：

```bash
# 提交變更
git add .
git commit -m "更新內容"
git push origin main

# 重新部署
npm run deploy
```

---

## ⚠️ 常見問題

### 頁面顯示空白
- 確認 `vite.config.ts` 中 `base: '/gemini-fintech-pro/'` 設定正確
- 檢查瀏覽器 Console 是否有錯誤

### 404 錯誤
- 首次部署需要等待 5-10 分鐘
- 確認 GitHub Pages 設定中 branch 為 `gh-pages`

---

詳細說明請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)










