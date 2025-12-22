# 如何在 Google Apps Script 中添加測試函數

## 🚨 問題

在 Google Apps Script 編輯器中找不到 `testSheetAccess` 函數。

---

## ✅ 解決方案

### 方法 1: 更新整個 Code.gs 文件（推薦）

1. **打開本地專案中的 `google-apps-script/Code.gs`**
2. **複製全部內容**（Ctrl+A, Ctrl+C）
3. **前往 Google Apps Script 編輯器**: https://script.google.com
4. **打開您的專案**
5. **完全替換代碼**：
   - 選擇編輯器中的所有代碼（Ctrl+A）
   - 刪除舊代碼
   - 貼上新代碼（Ctrl+V）
6. **保存**（Ctrl+S 或點擊「儲存」圖標）
7. **現在應該可以在函數選擇器中看到 `testSheetAccess`**

---

### 方法 2: 手動添加測試函數

如果只想添加測試函數，可以在 Google Apps Script 編輯器的最後添加以下代碼：

```javascript
/**
 * 測試 Sheet 訪問（用於診斷問題）
 */
function testSheetAccess() {
  try {
    Logger.log('開始測試 Sheet 訪問...');
    Logger.log('Sheet ID: ' + SHEET_ID);
    Logger.log('工作表名稱: ' + SHEET_NAME);
    
    // 測試打開 Sheet
    const ss = SpreadsheetApp.openById(SHEET_ID);
    Logger.log('✅ Sheet 打開成功');
    
    // 測試查找工作表
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (sheet) {
      Logger.log('✅ 工作表 "' + SHEET_NAME + '" 已存在');
      Logger.log('工作表行數: ' + sheet.getLastRow());
    } else {
      Logger.log('⚠️ 工作表 "' + SHEET_NAME + '" 不存在，將在首次登入時自動創建');
    }
    
    return {
      success: true,
      message: 'Sheet 訪問測試成功',
      sheetId: SHEET_ID,
      sheetName: SHEET_NAME,
      sheetExists: !!sheet
    };
  } catch (error) {
    Logger.log('❌ 錯誤: ' + error.toString());
    return {
      success: false,
      message: 'Sheet 訪問測試失敗',
      error: error.toString(),
      suggestions: [
        '1. 檢查 Sheet ID 是否正確',
        '2. 確認已授權 Google Apps Script 訪問 Google Sheets',
        '3. 確認 Sheet 存在且未被刪除',
        '4. 確認「執行身分」設置為「我」'
      ]
    };
  }
}
```

---

## 📋 使用測試函數

### 步驟 1: 找到函數

1. **在 Google Apps Script 編輯器中**
2. **點擊頂部的函數選擇器**（通常顯示「選擇函數」或一個下拉選單）
3. **選擇 `testSheetAccess`**

### 步驟 2: 運行函數

1. **點擊「執行」**按鈕（▶️ 圖標）
2. **如果出現授權提示**：
   - 點擊「檢閱權限」
   - 選擇您的 Google 帳號
   - 點擊「進階」→「前往 [專案名稱]（不安全）」
   - **點擊「允許」** ← 這是最關鍵的！

### 步驟 3: 查看結果

1. **點擊「執行記錄」**（或「檢視」→「執行記錄」）
2. **查看輸出**：
   - ✅ 如果看到 `Sheet 打開成功`，表示授權成功
   - ❌ 如果看到錯誤，按照錯誤訊息的建議操作

---

## 🔧 如果函數選擇器中仍然找不到

### 檢查事項：

1. **確認代碼已保存**：
   - 檢查編輯器頂部是否有未保存的指示（例如 `*`）
   - 按 Ctrl+S 保存

2. **刷新頁面**：
   - 有時需要刷新瀏覽器頁面才能看到新函數
   - 按 F5 或 Ctrl+R

3. **檢查函數名稱拼寫**：
   - 確保函數名稱是 `testSheetAccess`（注意大小寫）

4. **確認函數位置**：
   - 函數應該在文件的任何位置都可以
   - 但最好放在其他函數附近

---

## 🎯 快速測試方法（不使用測試函數）

如果不想添加測試函數，也可以直接運行 `initializeSheet` 函數來測試：

1. **在函數選擇器中選擇 `initializeSheet`**
2. **點擊「執行」**
3. **完成授權流程**（如果首次運行）
4. **查看執行記錄**確認是否成功

---

## 📝 完整的更新步驟總結

1. **複製本地 `google-apps-script/Code.gs` 的全部內容**
2. **在 Google Apps Script 編輯器中完全替換代碼**
3. **保存代碼**（Ctrl+S）
4. **在函數選擇器中選擇 `testSheetAccess`**
5. **點擊「執行」**
6. **完成授權流程**（如果出現提示）
7. **查看執行記錄確認成功**

---

**最後更新**: 2025-12-16










