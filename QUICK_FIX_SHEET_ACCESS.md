# Google Sheet 訪問錯誤快速修復

## 🚨 錯誤訊息

```
保存登入記錄時發生錯誤: Exception: Unexpected error while getting the method or property openById on object SpreadsheetApp.
```

---

## ✅ 立即解決步驟（5 分鐘）

### 步驟 1: 檢查並運行授權（最重要）

1. **前往 Google Apps Script**: https://script.google.com
2. **打開您的專案**
3. **在函數選擇器中選擇 `testSheetAccess`**（已添加到代碼中）
4. **點擊「執行」**按鈕
5. **如果出現授權提示**：
   - 點擊「檢閱權限」
   - 選擇您的 Google 帳號
   - 點擊「進階」→「前往 [專案名稱]（不安全）」
   - **點擊「允許」** ← 這是最關鍵的步驟！

6. **查看執行記錄**：
   - 點擊「執行記錄」查看輸出
   - 如果看到 `✅ Sheet 打開成功`，表示授權成功

---

### 步驟 2: 驗證 Sheet ID

1. **打開您的 Google Sheet**
2. **查看 URL**：
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```
3. **確認 `Code.gs` 中的 `SHEET_ID` 與 URL 中的 ID 完全一致**

---

### 步驟 3: 檢查部署設置

1. **點擊「部署」→「管理部署」**
2. **編輯現有部署**
3. **確認設置**：
   ```
   執行身分: 我 ← 必須是這個！
   具有存取權的使用者: 任何人
   ```
4. **重新部署**（選擇「新版本」）

---

### 步驟 4: 測試

1. **運行 `testSheetAccess` 函數**（在 Google Apps Script 編輯器中）
2. **如果測試成功**，嘗試在前端登入
3. **如果仍然失敗**，繼續下面的故障排除

---

## 🔍 故障排除

### 問題 1: 授權被拒絕或未完成

**解決方案**：
1. 前往 Google 帳號設置：https://myaccount.google.com/permissions
2. 找到您的 Apps Script 專案
3. 撤銷權限
4. 重新運行 `testSheetAccess` 函數
5. 重新授權

---

### 問題 2: Sheet ID 錯誤

**驗證步驟**：
1. 打開 Google Sheet
2. 複製完整的 URL
3. 提取 Sheet ID（URL 中 `/d/` 和 `/edit` 之間的部分）
4. 更新 `Code.gs` 中的 `SHEET_ID`
5. 保存並重新部署

---

### 問題 3: Sheet 不存在或被刪除

**解決方案**：
1. 檢查 Sheet 是否真的存在
2. 如果不存在，創建新的 Sheet
3. 複製新的 Sheet ID
4. 更新 `Code.gs` 中的 `SHEET_ID`
5. 保存並重新部署

---

### 問題 4: 權限不足

**檢查項目**：
1. ✅ 您是 Sheet 的所有者嗎？
2. ✅ Google Apps Script 和 Sheet 在同一個 Google 帳號下嗎？
3. ✅ 「執行身分」設置為「我」嗎？

**解決方案**：
- 確保 Sheet 的所有者是執行 Apps Script 的帳號
- 或者給 Sheet 設置為「任何知道連結的人都可以編輯」（僅用於測試）

---

## 📋 快速檢查清單

在報告問題前，請確認：

- [ ] 已運行 `testSheetAccess` 函數並完成授權
- [ ] Sheet ID 與 Google Sheet URL 中的 ID 完全一致
- [ ] Sheet 存在且未被刪除
- [ ] 「執行身分」設置為「我」
- [ ] 已重新部署（選擇「新版本」）
- [ ] 測試函數顯示 `✅ Sheet 打開成功`

---

## 🔧 測試函數使用說明

已在 `Code.gs` 中添加 `testSheetAccess` 函數：

1. **在 Google Apps Script 編輯器中**：
   - 在函數選擇器中選擇 `testSheetAccess`
   - 點擊「執行」
   - 查看「執行記錄」中的輸出

2. **預期結果**（成功）：
   ```
   ✅ Sheet 打開成功
   ✅ 工作表 "CursorFintechDB" 已存在
   ```

3. **如果失敗**：
   - 查看錯誤訊息
   - 按照錯誤訊息的建議操作

---

## ⚡ 最常見問題

**90% 的問題都是因為沒有完成授權流程！**

**解決方案**：
1. 在 Google Apps Script 編輯器中運行 `testSheetAccess` 函數
2. 完成授權流程（點擊「允許」）
3. 再次運行測試函數確認成功
4. 重新部署

---

## 🔗 相關文件

- `GAS_SHEET_ACCESS_FIX.md` - 完整的修復指南
- `google-apps-script/Code.gs` - 包含 `testSheetAccess` 測試函數

---

**最後更新**: 2025-12-16





