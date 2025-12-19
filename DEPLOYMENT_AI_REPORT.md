# AI 智能日報功能部署指南

## 📋 部署前檢查清單

在部署到 GitHub Pages 之前，請確保完成以下步驟：

### ✅ 步驟 1: 設置 GitHub Secrets

**重要**: 需要在 GitHub Secrets 中添加 `VITE_GEMINI_API_KEY`，否則 AI 智能日報功能將無法使用。

#### 設置步驟：

1. **前往 GitHub Secrets 設置頁面**：
   ```
   https://github.com/qwerboy-design/gemini-fintech-pro/settings/secrets/actions
   ```

2. **檢查是否已有以下 Secrets**：
   - ✅ `VITE_GAS_URL` - Google Apps Script URL
   - ✅ `VITE_GEMINI_API_KEY` - Gemini API Key（**需要添加**）

3. **添加 VITE_GEMINI_API_KEY**：
   - 點擊「New repository secret」
   - Name: `VITE_GEMINI_API_KEY`
   - Secret: [從您的 `.env` 文件中複製 Gemini API Key]
   - 點擊「Add secret」

---

## 🚀 部署步驟

### 方式 1: 自動部署（推薦）

推送代碼到 `main` 分支，GitHub Actions 會自動觸發部署：

```bash
git push origin main
```

### 方式 2: 手動觸發部署

如果已經設置好 Secrets，可以手動觸發部署：

1. 前往：https://github.com/qwerboy-design/gemini-fintech-pro/actions
2. 選擇「Deploy to GitHub Pages」工作流程
3. 點擊「Run workflow」→「Run workflow」

---

## ✅ 驗證部署

### 1. 檢查部署狀態

1. 前往 Actions 頁面：https://github.com/qwerboy-design/gemini-fintech-pro/actions
2. 查看最新的「Deploy to GitHub Pages」工作流程
3. 確認構建和部署都成功（綠色 ✓）

### 2. 測試 AI 智能日報功能

1. **訪問網站**：
   ```
   https://qwerboy-design.github.io/gemini-fintech-pro/
   ```

2. **測試功能**：
   - 點擊頂部「AI 智能日報」標籤
   - 應該看到載入動畫
   - 幾秒後應該顯示 AI 生成的股市報告
   - 報告內容應該在 500 字以內

3. **測試快取機制**：
   - 重新載入頁面
   - 再次點擊「AI 智能日報」標籤
   - 應該立即顯示報告（不重新呼叫 API）

---

## 🐛 故障排除

### 問題 1: AI 報告顯示「API Key 未配置」

**原因**: GitHub Secrets 中未設置 `VITE_GEMINI_API_KEY`

**解決方案**:
1. 確認已在 GitHub Secrets 中添加 `VITE_GEMINI_API_KEY`
2. 重新觸發部署

### 問題 2: AI 報告顯示錯誤訊息

**可能原因**:
- API Key 無效
- API 呼叫超時
- 網路連線問題

**解決方案**:
1. 檢查 API Key 是否正確
2. 點擊「重新載入」按鈕重試
3. 查看瀏覽器控制台的錯誤訊息

### 問題 3: 部署失敗

**解決方案**:
1. 查看 GitHub Actions 日誌
2. 確認所有環境變數都已正確設置
3. 檢查 TypeScript 編譯錯誤

---

## 📝 功能說明

### AI 智能日報功能

- **自動載入**: 切換到「AI 智能日報」標籤時自動載入
- **快取機制**: 同一天內只呼叫一次 API，使用 localStorage 快取
- **錯誤處理**: 顯示友善的錯誤訊息和重試按鈕
- **字數限制**: 報告內容限制在 500 字以內

### 技術細節

- **API**: Google Gemini 1.5 Flash 模型
- **快取**: localStorage（Key: `gemini-fintech-ai-daily-report`）
- **超時**: 30 秒
- **環境變數**: `VITE_GEMINI_API_KEY`

---

## 🔗 相關文件

- [GitHub Secrets 快速設置指南](./GITHUB_SECRETS_QUICK_START.md)
- [GitHub Actions 部署指南](./GITHUB_ACTIONS_DEPLOYMENT.md)
- [GitHub Secrets 完整設置指南](./GITHUB_SECRETS_SETUP.md)

---

**最後更新**: 2025-01-XX


