# GitHub Secrets 快速設置指南

## 🚀 3 分鐘快速設置

### 步驟 1: 前往 Secrets 設置頁面

**直接點擊以下連結**（需要登入 GitHub）：

```
https://github.com/qwerboy-design/gemini-fintech-pro/settings/secrets/actions
```

或手動導航：
1. 前往倉庫：https://github.com/qwerboy-design/gemini-fintech-pro
2. 點擊頂部「Settings」標籤
3. 左側選單：Secrets and variables → Actions

---

### 步驟 2: 添加 Secret

1. **點擊「New repository secret」按鈕**

2. **填寫表單**：
   ```
   Name:  VITE_GAS_URL
   Secret: https://script.google.com/macros/s/AKfycbzoEKE_10KGmlx8DfLgPa1SohOUYhrxuwmCHJRMogTkarwBL9NBAjBmP23JgRVE_GUk/exec
   ```

3. **點擊「Add secret」**

---

### 步驟 3: 觸發重新部署

**方式 1: 推送小更改（推薦）**
```bash
git commit --allow-empty -m "Trigger deployment with secrets"
git push origin main
```

**方式 2: 手動觸發**
1. 前往：https://github.com/qwerboy-design/gemini-fintech-pro/actions
2. 選擇「Deploy to GitHub Pages」工作流程
3. 點擊「Run workflow」→「Run workflow」

---

### 步驟 4: 驗證

1. **等待 2-5 分鐘**讓部署完成

2. **訪問網站**：
   ```
   https://qwerboy-design.github.io/gemini-fintech-pro/
   ```

3. **測試登入**：
   - 點擊「登入」按鈕
   - 輸入帳號
   - ✅ 應該可以正常登入

---

## 📋 Secret 資訊

| 項目 | 值 |
|------|-----|
| **名稱** | `VITE_GAS_URL` |
| **值** | `https://script.google.com/macros/s/AKfycbzoEKE_10KGmlx8DfLgPa1SohOUYhrxuwmCHJRMogTkarwBL9NBAjBmP23JgRVE_GUk/exec` |

---

## ⚠️ 重要提醒

1. ✅ Secret 名稱必須完全匹配：`VITE_GAS_URL`（區分大小寫）
2. ✅ URL 值不要有空格或換行
3. ✅ 設置後需要觸發重新部署才能生效
4. ✅ Secret 設置後不會顯示實際值（安全原因）

---

**詳細說明**: 請參考 `GITHUB_SECRETS_SETUP.md`

**最後更新**: 2025-12-16
