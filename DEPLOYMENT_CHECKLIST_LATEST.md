# GitHub Pages 部署檢查清單

**部署時間**: 2025-01-XX  
**提交**: `d348810` - feat: Integrate FinMind and Finnhub APIs

---

## ✅ 已完成的步驟

### 1. 代碼提交和推送
- ✅ 所有更改已提交
- ✅ 代碼已推送到 `main` 分支
- ✅ GitHub Actions 工作流程已觸發

### 2. 功能整合
- ✅ FinMind API 服務已整合
- ✅ Finnhub API 服務已整合
- ✅ 「我的收藏」策略功能已實現
- ✅ Fear and Greed Index 自動更新已實現
- ✅ 單元測試已創建

---

## ⚠️ 需要確認的配置

### GitHub Secrets 設置

請確認以下環境變數已在 GitHub 倉庫的 Secrets 中設置：

1. **VITE_GAS_URL**
   - 路徑: Settings → Secrets and variables → Actions
   - 用途: Google Apps Script 後端 URL

2. **VITE_GEMINI_API_KEY**
   - 路徑: Settings → Secrets and variables → Actions
   - 用途: Google Gemini API 用於 AI 智能日報

3. **VITE_FINMIND_API_KEY** ⭐ 新增
   - 路徑: Settings → Secrets and variables → Actions
   - 用途: FinMind API 用於台股即時報價
   - 獲取方式: https://finmindtrade.com/

4. **VITE_FINNHUB_API_KEY** ⭐ 新增
   - 路徑: Settings → Secrets and variables → Actions
   - 用途: Finnhub API 用於 Fear and Greed Index
   - 獲取方式: https://finnhub.io/

---

## 📋 部署流程

### 自動部署（已觸發）

當代碼推送到 `main` 分支時，GitHub Actions 會自動：

1. **構建階段**
   - 安裝依賴 (`npm ci`)
   - 運行構建 (`npm run build`)
   - 使用 GitHub Secrets 中的環境變數
   - 生成 `dist` 目錄

2. **部署階段**
   - 上傳構建產物到 GitHub Pages
   - 自動發布到 `https://qwerboy-design.github.io/gemini-fintech-pro/`

### 手動觸發（可選）

如果需要手動觸發部署：

1. 前往 GitHub 倉庫
2. 點擊 **Actions** 標籤
3. 選擇 **Deploy to GitHub Pages** 工作流程
4. 點擊 **Run workflow** 按鈕

---

## 🔍 檢查部署狀態

### 1. 查看 GitHub Actions 日誌

1. 前往: `https://github.com/qwerboy-design/gemini-fintech-pro/actions`
2. 點擊最新的工作流程運行
3. 檢查構建和部署步驟是否成功

### 2. 常見問題排查

#### 構建失敗
- **原因**: 環境變數未設置或錯誤
- **解決**: 檢查 GitHub Secrets 是否正確設置

#### 部署失敗
- **原因**: GitHub Pages 設置問題
- **解決**: 
  1. 前往 Settings → Pages
  2. 確認 Source 設置為 "GitHub Actions"
  3. 確認分支為 `main`

#### API 調用失敗
- **原因**: API Key 未設置或無效
- **解決**: 
  1. 檢查瀏覽器控制台錯誤
  2. 確認 GitHub Secrets 中的 API Keys 正確
  3. 確認 API Keys 有足夠的權限（FinMind 需要贊助會員）

---

## 🧪 部署後測試

### 1. 基本功能測試
- [ ] 頁面正常載入
- [ ] 登入功能正常
- [ ] 股票搜索功能正常
- [ ] 收藏功能正常

### 2. 新功能測試
- [ ] 「我的收藏」策略按鈕顯示
- [ ] 點擊「我的收藏」後顯示收藏股票
- [ ] 收藏股票顯示即時價格（如果 API Key 有效）
- [ ] 顯示「更新即時價格中...」載入提示
- [ ] Fear and Greed Index 顯示
- [ ] Fear and Greed Index 每 5 分鐘自動更新

### 3. API 功能測試
- [ ] 檢查瀏覽器控制台是否有 API 錯誤
- [ ] 確認 FinMind API 調用（如果 API Key 有效）
- [ ] 確認 Finnhub API 調用（如果 API Key 有效）
- [ ] 測試 API 失敗時的 fallback 機制

---

## 📝 部署後檢查清單

### 環境變數確認
- [ ] VITE_GAS_URL 已設置
- [ ] VITE_GEMINI_API_KEY 已設置
- [ ] VITE_FINMIND_API_KEY 已設置 ⭐
- [ ] VITE_FINNHUB_API_KEY 已設置 ⭐

### 功能驗證
- [ ] 所有頁面正常載入
- [ ] 登入功能正常
- [ ] 股票搜索和收藏功能正常
- [ ] 「我的收藏」策略功能正常
- [ ] 即時價格更新功能正常（如果 API Key 有效）
- [ ] Fear and Greed Index 顯示和更新正常（如果 API Key 有效）

### 錯誤處理
- [ ] API Key 缺失時顯示友好提示
- [ ] API 調用失敗時不影響其他功能
- [ ] 錯誤訊息清晰易懂

---

## 🚀 部署完成

部署完成後，應用將可在以下網址訪問：

**生產環境**: `https://qwerboy-design.github.io/gemini-fintech-pro/`

---

## 📞 問題排查

如果遇到問題：

1. **檢查 GitHub Actions 日誌**
   - 查看構建和部署步驟的詳細日誌
   - 確認是否有錯誤訊息

2. **檢查瀏覽器控制台**
   - 打開開發者工具 (F12)
   - 查看 Console 和 Network 標籤
   - 確認 API 調用是否成功

3. **檢查環境變數**
   - 確認 GitHub Secrets 已正確設置
   - 確認 API Keys 有效且有足夠權限

4. **檢查 GitHub Pages 設置**
   - Settings → Pages
   - 確認 Source 為 "GitHub Actions"
   - 確認分支為 `main`

---

## ✅ 部署狀態

- **代碼推送**: ✅ 完成
- **GitHub Actions 觸發**: ✅ 已觸發
- **構建狀態**: ⏳ 進行中（請查看 GitHub Actions）
- **部署狀態**: ⏳ 等待構建完成

**下一步**: 請前往 GitHub Actions 查看部署進度。



