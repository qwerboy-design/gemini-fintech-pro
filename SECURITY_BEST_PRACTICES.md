# 資安最佳實踐指南

**創建日期**: 2025-12-16  
**主題**: API Key 和環境變數安全處理

---

## ⚠️ 重要：API Key 安全原則

### ❌ 絕對不要做的事

1. **不要在 `.env.example` 中放入真實的 API Key**
   - `.env.example` 會提交到 Git 倉庫
   - 任何人可以看到倉庫內容
   - 一旦洩漏，API Key 將被公開

2. **不要將 `.env` 文件提交到 Git**
   - `.env` 包含真實的 API Key
   - 即使後續刪除，Git 歷史記錄仍會保留

3. **不要在程式碼中硬編碼 API Key**
   - 程式碼會提交到版本控制系統
   - 容易被發現和濫用

---

## ✅ 正確做法

### 1. `.env.example` 的用途

`.env.example` 應該：
- ✅ 只包含**占位符**或**示例值**
- ✅ 作為**模板**供其他開發者參考
- ✅ 說明需要哪些環境變數
- ✅ **永遠不包含真實的憑證**

### 2. `.env` 文件的處理

`.env` 文件應該：
- ✅ 包含**真實的 API Key**
- ✅ **已被 `.gitignore` 忽略**
- ✅ **永遠不提交到 Git**
- ✅ 每個開發者本地維護自己的 `.env`

---

## 📋 當前配置檢查

### `.env.example`（已正確配置）

```env
# Google Apps Script Web App URL
VITE_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# Google Gemini AI API Key
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

✅ **正確**：使用占位符 `your_gemini_api_key_here`，不是真實的 API Key

### `.gitignore`（已正確配置）

```gitignore
# Environment variables
.env
.env.local
.env.production
.env.development
```

✅ **正確**：`.env` 文件已被忽略，不會提交到 Git

---

## 🔐 安全最佳實踐

### 1. 本地開發環境

1. **複製 `.env.example` 為 `.env`**：
   ```bash
   cp .env.example .env
   ```

2. **編輯 `.env` 填入真實值**：
   ```env
   VITE_GAS_URL=https://script.google.com/macros/s/實際的_ID/exec
   VITE_GEMINI_API_KEY=實際的_API_KEY
   ```

3. **確認 `.env` 在 `.gitignore` 中**

### 2. GitHub Pages 部署

對於 GitHub Pages 部署（公開網站），有兩種方式：

#### 方式 1: 使用 GitHub Secrets（推薦用於 GitHub Actions）

1. 在 GitHub 倉庫設置 Secrets：
   - Settings → Secrets and variables → Actions
   - 添加 `VITE_GEMINI_API_KEY`

2. 在工作流中使用：
   ```yaml
   - name: Build
     run: npm run build
     env:
       VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
   ```

⚠️ **注意**：由於 Vite 的環境變數會被打包到客戶端代碼中，這種方式**不適合**包含敏感資訊的 API Key，因為任何人都可以在瀏覽器中看到。

#### 方式 2: 前端環境變數（僅適用於公開 API Key）

如果 API Key 是**公開使用的**（如 Google Maps API Key 有域名限制），可以：
- 在構建時設置環境變數
- 注意：這些值會被打包到客戶端代碼中

### 3. 生產環境建議

如果 API Key 是**敏感的**（如 Gemini API 有配額限制）：

1. **使用後端代理**：
   - 將 API Key 存儲在後端服務器
   - 前端調用您的後端 API
   - 後端使用 API Key 調用 Gemini API
   - API Key 永遠不暴露給客戶端

2. **使用環境變數限制**：
   - 如果必須在前端使用，設置 API Key 的域名/IP 限制
   - 監控 API 使用情況
   - 設置配額限制和警報

---

## 🔍 安全檢查清單

### 提交代碼前檢查

- [ ] `.env` 文件在 `.gitignore` 中
- [ ] `.env.example` 只包含占位符
- [ ] 程式碼中沒有硬編碼的 API Key
- [ ] 確認 `git status` 中沒有 `.env` 文件
- [ ] 檢查 Git 歷史中沒有包含 API Key

### 如果已經誤提交了 API Key

1. **立即撤銷**：
   ```bash
   git rm --cached .env
   git commit -m "Remove .env file"
   ```

2. **旋轉 API Key**：
   - 前往 API 提供商（Google AI Studio）
   - 刪除舊的 API Key
   - 創建新的 API Key

3. **清理 Git 歷史**（如果需要）：
   - 使用 `git filter-branch` 或 `BFG Repo-Cleaner`
   - 或重新創建倉庫

---

## 📝 環境變數類型分類

### 1. 公開環境變數（可以放入 .env.example）

- 公開的配置選項
- 不包含敏感資訊的設定
- 例如：`VITE_APP_NAME=Gemini FinTech`

### 2. 半公開環境變數（可以用占位符）

- 有域名/IP 限制的 API Key
- 公開 API 的端點 URL
- 例如：`VITE_GAS_URL`（如果 Google Apps Script 有訪問限制）

### 3. 敏感環境變數（絕對不要放入 .env.example）

- 無限制的 API Key（如 Gemini API Key）
- 密碼和令牌
- 資料庫連接字串
- 私鑰和證書

---

## 🛡️ 額外安全建議

### 1. API Key 管理

1. **使用環境變數管理工具**（生產環境）：
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault

2. **設置 API Key 限制**：
   - 域名限制（如果可能）
   - IP 白名單
   - 使用配額和速率限制

3. **定期輪換**：
   - 定期更換 API Key
   - 監控異常使用

### 2. 代碼審查

1. **審查環境變數使用**：
   - 確認沒有硬編碼的憑證
   - 確認 `.env.example` 只包含占位符

2. **使用 Git Hooks**：
   - 設置 pre-commit hook 檢查是否誤提交 `.env`

### 3. 監控和警報

1. **監控 API 使用**：
   - 設置使用量警報
   - 監控異常活動

2. **日誌記錄**：
   - 記錄 API 調用（不記錄 API Key）
   - 監控錯誤和失敗

---

## 📚 參考資源

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [GitHub Secrets 文檔](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vite 環境變數文檔](https://vitejs.dev/guide/env-and-mode.html)

---

## ✅ 總結

### `.env.example` 的正確使用

```env
# ✅ 正確：使用占位符
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# ❌ 錯誤：使用真實的 API Key
VITE_GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

### 當前專案狀態

- ✅ `.env.example` 使用占位符（安全）
- ✅ `.env` 已在 `.gitignore` 中（安全）
- ✅ 文檔中說明了正確的使用方式

---

**最後更新**: 2025-12-16  
**狀態**: ✅ 當前配置符合安全最佳實踐
