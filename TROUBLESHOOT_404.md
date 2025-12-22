# GitHub Pages 404 錯誤排查指南

**問題**: 訪問 https://qwerboy-design.github.io/gemini-fintech-pro/ 出現 404 錯誤

---

## 🔍 快速檢查清單

### 1. GitHub Pages 設定檢查 ⚠️ **最重要**

請前往以下連結確認設定：
```
https://github.com/qwerboy-design/gemini-fintech-pro/settings/pages
```

**必須確認的設定**：
- [ ] Source: 選擇 **"Deploy from a branch"**
- [ ] Branch: 選擇 **"gh-pages"**
- [ ] Folder: 選擇 **"/ (root)"**
- [ ] 狀態顯示: **"Your site is published at https://qwerboy-design.github.io/gemini-fintech-pro/"**

**如果 Source 選項沒有顯示**：
- 可能 GitHub Pages 尚未啟用
- 或者倉庫是私有倉庫（私有倉庫需要 GitHub Pro 才能使用 Pages）

---

### 2. 部署時間等待

**首次部署**：
- ⏱️ 可能需要 **5-10 分鐘** 才能生效
- ⏱️ 有時可能需要 **更長時間**（最多 30 分鐘）

**檢查部署狀態**：
- 前往 GitHub 倉庫的 Actions 標籤（如果有使用 Actions）
- 或者查看 gh-pages 分支的最新提交時間

---

### 3. 倉庫名稱確認

確認倉庫 URL 是否正確：
- ✅ 正確: `https://github.com/qwerboy-design/gemini-fintech-pro`
- ❌ 錯誤: `https://github.com/qwerboy-design/gemini-fintech-pro/`（多了斜線）

GitHub Pages URL 格式：
```
https://[用戶名或組織名].github.io/[倉庫名稱]/
```

---

### 4. 清除瀏覽器快取

**方法**：
1. 使用無痕模式（Ctrl+Shift+N 或 Cmd+Shift+N）
2. 或硬性重新整理（Ctrl+F5 或 Cmd+Shift+R）
3. 或清除瀏覽器快取

---

## 🔧 常見問題解決方案

### 問題 A: GitHub Pages 未啟用

**症狀**: Settings > Pages 頁面顯示 "Pages settings" 但沒有發布狀態

**解決步驟**：
1. 前往 Settings > Pages
2. 在 Source 區塊選擇 "Deploy from a branch"
3. 選擇 branch: **gh-pages**
4. 選擇 folder: **/ (root)**
5. 點擊 **Save**
6. 等待 5-10 分鐘後重新訪問

---

### 問題 B: gh-pages 分支為空或沒有 index.html

**檢查方法**：
```bash
# 檢查 gh-pages 分支內容
git fetch origin gh-pages
git checkout gh-pages
ls -la
```

**如果分支為空，解決方法**：
```bash
# 重新部署
npm run deploy
```

---

### 問題 C: 資源路徑不正確（403/404 錯誤）

**症狀**: 頁面載入但顯示空白，Console 顯示資源 404

**檢查 index.html**：
- 確認資源路徑包含 `/gemini-fintech-pro/` 前綴
- 例如：`/gemini-fintech-pro/assets/index-xxx.js`

**如果路徑不正確**：
- 確認 `vite.config.ts` 中 `base: '/gemini-fintech-pro/'`
- 重新構建和部署：`npm run deploy`

---

### 問題 D: 私有倉庫限制

**症狀**: Pages 設定頁面顯示需要升級到 GitHub Pro

**解決方案**：
- 將倉庫改為公開（Public）
- 或升級到 GitHub Pro（付費）
- 或使用其他免費託管服務（如 Vercel, Netlify）

---

## ✅ 驗證步驟

### 步驟 1: 確認 gh-pages 分支存在

```bash
git ls-remote --heads origin gh-pages
```

**預期輸出**：
```
[commit-hash]	refs/heads/gh-pages
```

### 步驟 2: 確認 gh-pages 分支包含 index.html

在 GitHub 網頁上：
1. 前往倉庫頁面
2. 切換分支到 `gh-pages`
3. 確認看到 `index.html` 文件

### 步驟 3: 確認 GitHub Pages 已啟用

前往 Settings > Pages，應該看到：
- ✅ Source: Deploy from a branch - gh-pages / (root)
- ✅ Your site is published at https://qwerboy-design.github.io/gemini-fintech-pro/

---

## 🚀 重新部署步驟

如果上述檢查都正常但仍出現 404，嘗試重新部署：

```bash
# 1. 確保所有更改已提交
git add .
git commit -m "fix: 重新部署到 GitHub Pages"

# 2. 重新部署
npm run deploy

# 3. 等待 5-10 分鐘後訪問網站
```

---

## 📝 診斷命令

執行以下命令並檢查輸出：

```bash
# 1. 檢查構建輸出
npm run build

# 2. 檢查 dist/index.html 中的路徑
cat dist/index.html

# 3. 檢查 gh-pages 分支
git ls-remote --heads origin gh-pages

# 4. 檢查本地 gh-pages（如果存在）
git branch -a | grep gh-pages
```

---

## 🔗 有用的連結

- **GitHub Pages 設定**: https://github.com/qwerboy-design/gemini-fintech-pro/settings/pages
- **GitHub Pages 狀態**: 通常在倉庫主頁右側會顯示 "⚙️ Settings" > "Pages"
- **GitHub Pages 文檔**: https://docs.github.com/zh/pages

---

## ⚠️ 重要提醒

1. **首次部署需要時間**：即使是正確的設定，首次部署也可能需要 5-30 分鐘
2. **檢查倉庫可見性**：私有倉庫需要 GitHub Pro 才能使用 Pages
3. **分支名稱必須正確**：必須是 `gh-pages`（不是 `gh-page` 或其他名稱）
4. **路徑必須正確**：`vite.config.ts` 中的 base path 必須與倉庫名稱匹配

---

**最後更新**: 2025-12-16









