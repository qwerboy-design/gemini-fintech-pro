# 如何找到 testSheetAccess 函數

## 📍 重要說明

**`testSheetAccess` 函數在 Google Apps Script 編輯器中，不在 Google Sheet 中！**

您需要：
1. 打開 Google Apps Script 編輯器（不是 Google Sheet）
2. 在編輯器中找到函數選擇器
3. 選擇並運行函數

---

## ✅ 步驟說明

### 步驟 1: 打開 Google Apps Script 編輯器

**方法 A: 從 Google Sheet 打開**

1. **打開您的 Google Sheet**（CursorFintech）
2. **點擊頂部選單**：「擴充功能」→「Apps Script」
3. 這會打開 Google Apps Script 編輯器

**方法 B: 直接訪問**

1. **前往**: https://script.google.com
2. **登入**您的 Google 帳號
3. **找到並打開您的專案**（應該包含登入相關的 `Code.gs`）

---

### 步驟 2: 找到函數選擇器

在 Google Apps Script 編輯器中：

1. **查看編輯器頂部**，應該會看到：
   - 左側：函數選擇器（下拉選單，可能顯示「選擇函數」）
   - 右側：「執行」按鈕（▶️ 圖標）

2. **如果看不到函數選擇器**：
   - 可能是因為代碼還沒有保存
   - 或者函數還沒有添加到代碼中
   - 參考下面的「如果找不到函數」部分

---

### 步驟 3: 選擇 testSheetAccess 函數

1. **點擊函數選擇器**（下拉選單）
2. **在列表中尋找 `testSheetAccess`**
3. **點擊選擇它**

---

### 步驟 4: 運行函數

1. **點擊「執行」按鈕**（▶️ 圖標或「執行」文字按鈕）
2. **如果出現授權提示**：
   - 點擊「檢閱權限」
   - 選擇您的 Google 帳號
   - 點擊「進階」→「前往 [專案名稱]（不安全）」
   - **點擊「允許」**
3. **查看執行記錄**：
   - 點擊「執行記錄」（通常在編輯器底部）
   - 或「檢視」→「執行記錄」

---

## 🔍 如果找不到 testSheetAccess 函數

### 原因 1: 代碼還沒有更新到 Google Apps Script

**解決方案**：

1. **打開本地專案中的 `google-apps-script/Code.gs`**
2. **複製全部內容**（Ctrl+A, Ctrl+C）
3. **在 Google Apps Script 編輯器中**：
   - 全選舊代碼（Ctrl+A）
   - 刪除（Delete）
   - 貼上新代碼（Ctrl+V）
4. **保存**（Ctrl+S 或點擊「儲存」圖標）
5. **刷新頁面**（F5）
6. **再次檢查函數選擇器**

---

### 原因 2: 函數還沒有被保存

**檢查**：

1. 查看編輯器頂部是否有 `*` 或「未儲存的變更」提示
2. 如果有的話，**按 Ctrl+S 保存**
3. **刷新頁面**（F5）
4. **再次檢查函數選擇器**

---

### 原因 3: 函數選擇器沒有顯示

**解決方案**：

1. **確認您在 Google Apps Script 編輯器中**（不是 Google Sheet）
2. **確認代碼已經保存**
3. **嘗試使用快捷鍵**：`Ctrl+Enter` 或點擊「執行」按鈕
4. **如果仍然沒有，手動運行**：直接在編輯器中找到 `testSheetAccess` 函數定義，將游標放在函數內部，然後點擊「執行」

---

## 🎯 替代方法：直接運行現有函數

如果找不到 `testSheetAccess`，可以使用現有函數完成授權：

### 方法 1: 運行 `initializeSheet`

1. **在函數選擇器中選擇 `initializeSheet`**
2. **點擊「執行」**
3. **完成授權流程**
4. **查看執行記錄**確認成功

### 方法 2: 運行 `doGet`

1. **在函數選擇器中選擇 `doGet`**
2. **點擊「執行」**
3. **完成授權流程**

---

## 📋 快速檢查清單

- [ ] 我已打開 Google Apps Script 編輯器（不是 Google Sheet）
- [ ] 我已複製最新的 `Code.gs` 代碼到編輯器
- [ ] 我已保存代碼（Ctrl+S）
- [ ] 我已刷新頁面（F5）
- [ ] 我可以在函數選擇器中看到 `testSheetAccess`

---

## 🔗 相關文件

- `GAS_ADD_TEST_FUNCTION.md` - 如何添加測試函數的詳細說明
- `google-apps-script/Code.gs` - 包含 `testSheetAccess` 函數的完整代碼

---

**最後更新**: 2025-12-16






