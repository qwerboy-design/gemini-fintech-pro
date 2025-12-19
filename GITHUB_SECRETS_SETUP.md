# GitHub Secrets 設置指南

## 📋 概述

為了讓部署在 GitHub Pages 上的應用程式能夠使用登入功能，需要在 GitHub Secrets 中設置環境變數 `VITE_GAS_URL`。

---

## ✅ 完整設置步驟

### 步驟 1: 訪問 GitHub 倉庫

1. **打開瀏覽器**，前往您的 GitHub 倉庫：
   ```
   https://github.com/qwerboy-design/gemini-fintech-pro
   ```

2. **確認已登入**您的 GitHub 帳號

---

### 步驟 2: 進入 Settings（設置）

1. **點擊倉庫頂部的「Settings」標籤**
   - 如果看不到「Settings」，確認您是否有倉庫的管理權限
   - Settings 標籤位於：Code、Issues、Pull requests、Actions、Projects、Wiki、**Settings**

---

### 步驟 3: 進入 Secrets and variables

1. **在左側導航欄中**，找到「Secrets and variables」
2. **點擊展開「Secrets and variables」**
3. **點擊「Actions」**（用於 GitHub Actions 工作流程）

   > **路徑**: Settings → Secrets and variables → Actions

---

### 步驟 4: 添加新的 Secret

1. **點擊「New repository secret」按鈕**
   - 按鈕位於頁面右上角，綠色按鈕

2. **填寫 Secret 資訊**：
   - **Name（名稱）**: `VITE_GAS_URL`
     - 必須完全一致，區分大小寫
   - **Secret（值）**: 
     ```
     https://script.google.com/macros/s/AKfycbzoEKE_10KGmlx8DfLgPa1SohOUYhrxuwmCHJRMogTkarwBL9NBAjBmP23JgRVE_GUk/exec
     ```
     - 從您的 `.env` 文件中複製，確保沒有多餘的空格或換行

3. **點擊「Add secret」按鈕**

---

### 步驟 5: 確認 Secret 已添加

1. **在「Repository secrets」列表中**，應該能看到：
   - `VITE_GAS_URL`（只顯示名稱，值被隱藏為 `***`）

2. **驗證 Secret 名稱正確**：
   - ✅ 名稱：`VITE_GAS_URL`（完全匹配）
   - ✅ 顯示為已添加狀態

---

### 步驟 6: 觸發重新部署

設置完成後，需要觸發一次部署以應用新的環境變數。有兩種方式：

#### 方式 A: 自動觸發（推薦）

1. **推送任意更改到 `main` 分支**（例如修改 README）
   ```bash
   # 在本地執行
   git add .
   git commit -m "Trigger deployment with new secrets"
   git push origin main
   ```

2. **GitHub Actions 會自動觸發部署**
   - 前往：https://github.com/qwerboy-design/gemini-fintech-pro/actions
   - 查看部署進度

#### 方式 B: 手動重新運行工作流程

1. **前往 Actions 頁面**：
   ```
   https://github.com/qwerboy-design/gemini-fintech-pro/actions
   ```

2. **找到最近一次的工作流程運行**
   - 點擊進入查看詳情

3. **點擊右上角的「Re-run jobs」→「Re-run all jobs」**
   - 這會使用新的 Secrets 重新部署

---

## 🔍 驗證設置是否生效

### 檢查 GitHub Actions 構建日誌

1. **前往 Actions 頁面**：
   ```
   https://github.com/qwerboy-design/gemini-fintech-pro/actions
   ```

2. **點擊最新的工作流程運行**

3. **展開「Build」步驟**

4. **檢查環境變數是否正確設置**：
   - 應該能看到 `VITE_GAS_URL` 在環境變數列表中
   - 注意：Secret 的值不會顯示在日誌中（安全原因）

---

### 檢查網站功能

1. **等待部署完成**（通常 2-5 分鐘）

2. **訪問網站**：
   ```
   https://qwerboy-design.github.io/gemini-fintech-pro/
   ```

3. **測試登入功能**：
   - 點擊「登入」按鈕
   - 輸入帳號（例如：`mike`）
   - 點擊「登入」
   - ✅ **如果成功**：應該能正常登入，無警告訊息
   - ❌ **如果失敗**：檢查瀏覽器控制台的錯誤訊息

---

## ⚠️ 常見問題

### 問題 1: 找不到「Settings」標籤

**可能原因**：
- 您沒有倉庫的管理權限
- 您不是倉庫的擁有者或協作者

**解決方案**：
- 聯繫倉庫擁有者給予管理權限
- 或請擁有者協助設置 Secrets

---

### 問題 2: 找不到「Secrets and variables」

**可能原因**：
- Settings 頁面未完全載入
- 您使用的是舊版 GitHub 介面

**解決方案**：
1. 刷新頁面
2. 確認路徑：Settings → Secrets and variables → Actions
3. 如果仍找不到，直接訪問：
   ```
   https://github.com/qwerboy-design/gemini-fintech-pro/settings/secrets/actions
   ```

---

### 問題 3: Secret 名稱輸入錯誤

**症狀**：
- 部署後登入功能仍無法使用
- 網站仍然顯示配置警告

**解決方案**：
1. **檢查 Secret 名稱**：
   - 必須完全匹配：`VITE_GAS_URL`
   - 區分大小寫
   - 無多餘空格

2. **檢查 `.github/workflows/deploy.yml`**：
   - 確認工作流程中使用的環境變數名稱與 Secret 名稱一致

3. **重新設置 Secret**：
   - 刪除舊的 Secret
   - 重新添加，確保名稱正確

---

### 問題 4: Secret 值不正確

**檢查項目**：
1. ✅ URL 是否完整（包含 `https://`）
2. ✅ URL 結尾沒有多餘空格
3. ✅ 沒有換行符
4. ✅ URL 與 `.env` 文件中的值一致

**解決方案**：
1. 從 `.env` 文件中複製完整的 URL
2. 刪除舊的 Secret
3. 重新添加，確保值完全正確

---

### 問題 5: 部署後仍未生效

**可能原因**：
- GitHub Actions 使用的是舊的構建快取
- Secret 設置後沒有觸發重新部署

**解決方案**：
1. **清除 GitHub Actions 快取**（如果有的話）
2. **手動觸發重新部署**：
   - 推送一個小更改到 `main` 分支
   - 或重新運行最新的工作流程

---

## 📋 設置檢查清單

完成設置後，請確認：

- [ ] 已訪問 GitHub 倉庫 Settings
- [ ] 已進入 Secrets and variables → Actions
- [ ] 已添加 Secret，名稱：`VITE_GAS_URL`
- [ ] Secret 值已正確設置（與 `.env` 文件一致）
- [ ] Secret 已顯示在 Repository secrets 列表中
- [ ] 已觸發重新部署（推送更改或重新運行工作流程）
- [ ] 已檢查 Actions 構建日誌，確認部署成功
- [ ] 已測試網站登入功能，確認正常運作

---

## 🔗 相關文件

- `DEPLOYMENT_STATUS.md` - 部署狀態報告
- `.github/workflows/deploy.yml` - GitHub Actions 工作流程配置
- `.env.example` - 環境變數範例
- `LOGIN_TROUBLESHOOTING.md` - 登入功能故障排除指南

---

## 📸 視覺化指引

### Secret 設置頁面位置

```
GitHub 倉庫
├── Code
├── Issues
├── Pull requests
├── Actions
├── Projects
├── Wiki
└── Settings ← 點擊這裡
    └── Secrets and variables ← 展開
        └── Actions ← 點擊這裡
            └── New repository secret ← 點擊這裡
```

---

## 🎯 快速參考

### Secret 資訊

- **名稱**: `VITE_GAS_URL`
- **值**: `https://script.google.com/macros/s/AKfycbzoEKE_10KGmlx8DfLgPa1SohOUYhrxuwmCHJRMogTkarwBL9NBAjBmP23JgRVE_GUk/exec`

### 直接訪問連結

- **倉庫 Settings**: https://github.com/qwerboy-design/gemini-fintech-pro/settings
- **Secrets 設置頁面**: https://github.com/qwerboy-design/gemini-fintech-pro/settings/secrets/actions
- **Actions 頁面**: https://github.com/qwerboy-design/gemini-fintech-pro/actions

---

**最後更新**: 2025-12-16






