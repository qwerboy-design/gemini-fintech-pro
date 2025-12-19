# 瀏覽器控制台異常診斷指南

## 🔍 常見控制台異常問題

### 1. 環境變數相關警告

**症狀**：
- 控制台顯示 `undefined` 或空字符串
- 警告訊息提到 `VITE_GAS_URL` 未設置

**原因**：
- GitHub Pages 部署時，環境變數需要通過 GitHub Secrets 設置
- 構建時環境變數未正確注入

**解決方案**：
1. 確認 GitHub Secrets 已設置（參考 `DEPLOYMENT_DIAGNOSIS.md`）
2. 重新觸發 GitHub Actions 部署
3. 清除瀏覽器快取（Ctrl+Shift+R）

---

### 2. "Failed to fetch" 錯誤

**症狀**：
- 控制台顯示 `Failed to fetch` 錯誤
- 網絡請求失敗

**可能原因**：
1. **Google Apps Script 部署權限未設置為「任何人」** ⚠️ **最常見**
2. CORS 策略限制
3. 網絡連接問題
4. URL 不正確

**解決方案**：
- 參考 `LOGIN_TROUBLESHOOTING.md` 進行完整診斷
- 確認 Google Apps Script 部署權限為「任何人」

---

### 3. 環境變數暴露問題

**症狀**：
- 控制台日誌中顯示完整的 API URL 或敏感信息

**已修復**：
- ✅ 已優化代碼，生產環境中不輸出敏感信息
- ✅ 只在開發環境（`import.meta.env.DEV`）中輸出詳細日誌

---

### 4. 類型錯誤或運行時錯誤

**症狀**：
- `TypeError: Cannot read property ...`
- `ReferenceError: ... is not defined`

**診斷步驟**：
1. 打開瀏覽器開發者工具（F12）
2. 切換到 **Console** 標籤
3. 查看完整的錯誤堆棧訊息
4. 記錄錯誤發生的具體操作步驟

**解決方案**：
- 根據錯誤訊息修復代碼
- 檢查變數是否正確定義
- 確認類型定義正確

---

### 5. localStorage 相關錯誤

**症狀**：
- `QuotaExceededError`
- `SecurityError`

**可能原因**：
- 瀏覽器 localStorage 存儲空間已滿
- 隱私模式或瀏覽器設置限制

**解決方案**：
1. 清除瀏覽器快取和存儲數據
2. 檢查瀏覽器隱私設置
3. 使用正常模式（非無痕模式）訪問

---

## 📋 診斷檢查清單

在報告異常前，請確認：

- [ ] 已清除瀏覽器快取（Ctrl+Shift+R）
- [ ] 使用的是最新版本的代碼
- [ ] 已檢查 **Console** 標籤的完整錯誤訊息
- [ ] 已檢查 **Network** 標籤的請求狀態
- [ ] 已確認 GitHub Secrets 設置正確
- [ ] 已確認 Google Apps Script 部署權限為「任何人」

---

## 🔍 獲取詳細錯誤訊息

### 步驟 1: 打開開發者工具

1. 訪問網站：https://qwerboy-design.github.io/gemini-fintech-pro/
2. 按 `F12` 或 `Ctrl+Shift+I`（Windows/Linux）或 `Cmd+Option+I`（Mac）
3. 切換到 **Console** 標籤

### 步驟 2: 重現問題

1. 執行會觸發異常的操作（如登入、查詢股票等）
2. 觀察控制台輸出

### 步驟 3: 記錄錯誤信息

請記錄以下信息：
- **錯誤類型**（如 `TypeError`, `ReferenceError` 等）
- **錯誤訊息**（完整的錯誤文本）
- **錯誤位置**（文件名和行號，如果有）
- **操作步驟**（如何觸發該錯誤）

---

## 📞 報告異常時請提供

當報告控制台異常時，請提供：

1. **完整的錯誤訊息**（包括堆棧跟踪）
2. **截圖**（如果可能）
3. **操作步驟**（如何重現問題）
4. **瀏覽器信息**（瀏覽器名稱和版本）
5. **Console 標籤的完整輸出**（如果有多個錯誤）

---

## ✅ 已修復的問題

### 生產環境日誌優化

- ✅ 移除了生產環境中的敏感信息日誌
- ✅ `console.log` 只在開發環境中輸出
- ✅ `console.error` 保留但僅輸出必要信息
- ✅ 環境變數檢查日誌已優化

**修改位置**：
- `src/components/LoginModal.tsx`: 日誌輸出條件化
- `src/App.tsx`: 錯誤日誌優化

---

## 🔄 如果問題仍然存在

1. **確認代碼已更新**：
   ```bash
   git pull origin main
   npm install
   npm run build
   ```

2. **重新部署**：
   - 推送代碼觸發自動部署，或
   - 執行 `npm run deploy`

3. **清除瀏覽器快取**：
   - 使用無痕模式測試
   - 或清除瀏覽器所有數據

4. **檢查 GitHub Actions**：
   - 確認最新部署是否成功
   - 檢查構建日誌是否有錯誤

---

**最後更新**: 2025-12-16








