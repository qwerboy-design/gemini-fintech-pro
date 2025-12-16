# 登入功能故障排除完整指南

**問題**: 無論使用帳號 ID 或 Google 郵件信箱都無法登入，顯示 "Failed to fetch" 錯誤

---

## 🚨 快速診斷（5 分鐘內完成）

### 步驟 1: 檢查瀏覽器控制台錯誤

1. 打開瀏覽器開發者工具（按 `F12`）
2. 切換到 **Console** 標籤
3. 嘗試登入
4. **記錄完整的錯誤訊息**（包括任何 CORS 相關錯誤）

### 步驟 2: 測試 Google Apps Script URL

在瀏覽器中直接訪問您的 Google Apps Script URL：

```
https://script.google.com/macros/s/AKfycbzoEKE_10KGmlx8DfLgPa1SohOUYhrxuwmCHJRMogTkarwBL9NBAjBmP23JgRVE_GUk/exec
```

**預期結果**（成功）:
```json
{
  "success": true,
  "message": "Google Apps Script Web App 運行正常",
  "timestamp": "2025-12-16T..."
}
```

**如果看到錯誤**:
- **403 Forbidden**: ❌ **部署權限問題** - 必須設置為「任何人」
- **404 Not Found**: ❌ **URL 錯誤或部署不存在**
- **500 Internal Server Error**: ❌ **Apps Script 代碼錯誤**

### 步驟 3: 檢查 Network 請求

1. 打開瀏覽器開發者工具（`F12`）
2. 切換到 **Network** 標籤
3. 嘗試登入
4. 查看對 Google Apps Script 的請求：
   - **狀態碼**（Status Code）
   - **請求 URL**
   - **請求方法**（應該是 POST）
   - **響應內容**（Response）

---

## 🔍 最常見問題：Google Apps Script 部署權限

**90% 的問題都源於此**

### 問題說明

Google Apps Script Web App 必須設置為「任何人」才能從瀏覽器訪問，否則會觸發 CORS 錯誤。

### 解決步驟（必須完全按照以下步驟）

1. **前往 Google Apps Script**
   - 訪問: https://script.google.com
   - 打開您的專案

2. **打開部署管理**
   - 點擊左側「部署」（Deploy）
   - 點擊「管理部署」（Manage deployments）

3. **編輯部署設置**
   - 找到現有的部署（應該會看到一個 URL）
   - 點擊右側的「編輯」圖標（筆形圖標 ⚙️）

4. **關鍵設置**（必須完全一致）:
   ```
   執行身分: 我
   具有存取權的使用者: 任何人 ← 這是最關鍵的！
   版本: 新版本（推薦）
   ```

5. **保存並部署**
   - 點擊「部署」（Deploy）按鈕
   - **重要**: 如果修改了「具有存取權的使用者」，會生成**新的 URL**

6. **複製新的 URL**
   - 部署完成後，複製新的 Web App URL
   - URL 格式: `https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec`

7. **更新環境變數**
   - 打開 `.env` 文件
   - 更新 `VITE_GAS_URL` 為新的 URL
   - 保存文件

8. **重啟開發服務器**
   ```bash
   # 停止當前服務器（Ctrl+C）
   npm run dev
   ```

---

## 🔧 其他可能問題及解決方案

### 問題 2: URL 格式錯誤

**檢查項目**:
- ✅ URL 必須以 `/exec` 結尾（不是 `/dev`）
- ✅ URL 必須完整，不能有空格或換行
- ✅ 確保 `.env` 文件中沒有引號（除非是必須的）

**正確格式**:
```env
VITE_GAS_URL=https://script.google.com/macros/s/AKfycbzoEKE_10KGmlx8DfLgPa1SohOUYhrxuwmCHJRMogTkarwBL9NBAjBmP23JgRVE_GUk/exec
```

**錯誤格式**（不要這樣）:
```env
VITE_GAS_URL="https://script.google.com/macros/s/..."  # 有多餘引號
VITE_GAS_URL=https://script.google.com/macros/s/.../dev  # 使用了 /dev
```

### 問題 3: 環境變數未正確載入

**檢查步驟**:
1. 確認 `.env` 文件在專案根目錄
2. 確認文件命名為 `.env`（不是 `.env.txt` 或 `.env.example`）
3. 確認變數名為 `VITE_GAS_URL`（必須有 `VITE_` 前綴）
4. **重啟開發服務器**（修改 `.env` 後必須重啟）

**驗證環境變數**:
```bash
# 運行診斷工具
node check-env.js
```

### 問題 4: Google Apps Script 代碼錯誤

**檢查步驟**:
1. 在 Apps Script 編輯器中
2. 運行 `doGet` 函數測試（點擊「執行」→ 選擇 `doGet`）
3. 查看執行日誌是否有錯誤
4. 確保 `SHEET_ID` 和 `SHEET_NAME` 正確

**常見錯誤**:
- `SHEET_ID` 錯誤：無法打開 Google Sheet
- `SHEET_NAME` 不存在：工作表名稱不匹配
- 權限問題：Apps Script 沒有訪問 Sheet 的權限

### 問題 5: 網絡或防火牆問題

**檢查步驟**:
1. 嘗試在無痕模式下訪問
2. 檢查是否使用 VPN 或代理
3. 嘗試使用不同的網絡（如手機熱點）
4. 檢查企業防火牆是否阻擋 Google Apps Script

### 問題 6: 瀏覽器擴展干擾

**檢查步驟**:
1. 嘗試在無痕模式下測試
2. 暫時禁用瀏覽器擴展（特別是廣告攔截器、隱私保護工具）
3. 嘗試使用不同的瀏覽器

---

## 🧪 詳細診斷步驟

### 診斷 1: 瀏覽器控制台檢查

1. **打開開發者工具** (`F12`)
2. **切換到 Console**
3. **嘗試登入**
4. **查找以下錯誤**:

   **CORS 錯誤**:
   ```
   Access to fetch at '...' from origin '...' has been blocked by CORS policy
   ```
   → **解決方案**: 檢查 Google Apps Script 部署權限（必須是「任何人」）

   **網絡錯誤**:
   ```
   Failed to fetch
   TypeError: Failed to fetch
   ```
   → **解決方案**: 檢查 URL 是否正確、網絡是否正常

   **HTTP 錯誤**:
   ```
   403 Forbidden
   404 Not Found
   500 Internal Server Error
   ```
   → **解決方案**: 檢查部署設置和 Apps Script 代碼

### 診斷 2: Network 標籤檢查

1. **打開開發者工具** (`F12`)
2. **切換到 Network**
3. **清空記錄**（點擊清除圖標）
4. **嘗試登入**
5. **找到對 Google Apps Script 的請求**:
   - 請求名稱應該是類似 `exec` 的文件
   - 方法（Method）應該是 `POST`
   - 狀態（Status）應該顯示狀態碼

6. **檢查請求詳情**:
   - 點擊請求
   - 查看 **Headers** 標籤：
     - **Request URL**: 確認 URL 正確
     - **Request Method**: 應該是 `POST`
     - **Content-Type**: 應該是 `application/json`
   - 查看 **Payload** 標籤：
     - 確認請求數據格式正確
   - 查看 **Response** 標籤：
     - 查看服務器返回的內容

### 診斷 3: 使用 curl 測試（可選）

如果瀏覽器測試失敗，可以使用命令行測試：

```bash
curl -X POST \
  "https://script.google.com/macros/s/AKfycbzoEKE_10KGmlx8DfLgPa1SohOUYhrxuwmCHJRMogTkarwBL9NBAjBmP23JgRVE_GUk/exec" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "login",
    "userId": "test",
    "timestamp": "2025-12-16T10:00:00Z"
  }'
```

**預期結果**:
```json
{
  "success": true,
  "message": "登入記錄已成功保存",
  "data": {
    "userId": "test",
    "timestamp": "..."
  }
}
```

**如果 curl 成功但瀏覽器失敗**:
→ 這是 CORS 或瀏覽器設置問題

**如果 curl 也失敗**:
→ 這是 Google Apps Script 設置或代碼問題

---

## ✅ 檢查清單

按照順序檢查以下項目：

### 基礎檢查
- [ ] `.env` 文件存在於專案根目錄
- [ ] `VITE_GAS_URL` 變數名正確（有 `VITE_` 前綴）
- [ ] URL 格式正確（以 `/exec` 結尾）
- [ ] 開發服務器已重啟（修改 `.env` 後）
- [ ] 瀏覽器控制台沒有其他 JavaScript 錯誤

### Google Apps Script 檢查
- [ ] 部署權限設置為「**任何人**」（最關鍵！）
- [ ] 執行身分設置為「我」
- [ ] 使用最新版本的部署
- [ ] `SHEET_ID` 在 `Code.gs` 中正確
- [ ] `SHEET_NAME` 在 `Code.gs` 中正確
- [ ] `doGet` 函數可以正常執行（測試連接）

### 網絡檢查
- [ ] 可以直接在瀏覽器中訪問 Google Apps Script URL（GET 請求）
- [ ] 瀏覽器控制台顯示正確的請求 URL
- [ ] Network 標籤顯示請求狀態碼
- [ ] 沒有防火牆或代理阻擋

### 代碼檢查
- [ ] 前端代碼中的 `googleAppsScriptUrl` 不為空
- [ ] 請求數據格式正確（`action`, `userId`, `timestamp`）
- [ ] 瀏覽器控制台顯示發送的請求數據

---

## 🔄 完整修復流程（推薦）

如果以上檢查都沒有問題，請按照以下完整流程重新設置：

### 1. 重新部署 Google Apps Script

1. 打開 Apps Script 編輯器
2. 確認 `Code.gs` 中的 `SHEET_ID` 和 `SHEET_NAME` 正確
3. 點擊「部署」→「管理部署」
4. 刪除舊的部署（如果存在）
5. 點擊「新部署」
6. 選擇類型：**Web 應用程式**
7. **關鍵設置**:
   ```
   說明: 登入服務
   執行身分: 我
   具有存取權的使用者: 任何人 ← 必須選擇這個！
   ```
8. 點擊「部署」
9. **複製新的 Web App URL**

### 2. 更新環境變數

1. 打開 `.env` 文件
2. 更新 `VITE_GAS_URL`:
   ```env
   VITE_GAS_URL=https://script.google.com/macros/s/[新的部署ID]/exec
   ```
3. 保存文件

### 3. 重啟開發服務器

```bash
# 停止當前服務器（按 Ctrl+C）
npm run dev
```

### 4. 清除瀏覽器快取

1. 按 `Ctrl+Shift+Delete`（Windows/Linux）或 `Cmd+Shift+Delete`（Mac）
2. 選擇「快取的圖片和檔案」
3. 清除快取
4. 或使用無痕模式測試

### 5. 測試登入

1. 打開瀏覽器開發者工具 (`F12`)
2. 切換到 Console 標籤
3. 嘗試登入
4. 查看是否有錯誤
5. 檢查 Network 標籤確認請求狀態

---

## 📞 如果問題仍未解決

請收集以下信息：

### 必要信息

1. **瀏覽器控制台錯誤**:
   - 完整的錯誤訊息
   - 錯誤堆棧（如果有的話）

2. **Network 請求詳情**:
   - 請求 URL
   - 狀態碼
   - 響應內容（Response）

3. **環境信息**:
   - 瀏覽器類型和版本
   - 操作系統
   - 是否使用 VPN/代理
   - 是否在企業網絡環境

4. **Google Apps Script 信息**:
   - 部署設置截圖（特別是「具有存取權的使用者」）
   - Apps Script 執行日誌（如果有錯誤）

5. **診斷工具輸出**:
   ```bash
   node check-env.js
   ```

---

## 🎯 常見錯誤訊息對照表

| 錯誤訊息 | 可能原因 | 解決方案 |
|---------|---------|---------|
| `Failed to fetch` | 網絡錯誤、CORS、URL 錯誤 | 檢查部署權限、URL 格式、網絡連接 |
| `403 Forbidden` | 部署權限不是「任何人」 | 重新部署，設置為「任何人」 |
| `404 Not Found` | URL 錯誤或部署不存在 | 檢查 URL、重新部署 |
| `CORS policy blocked` | 部署權限問題 | 設置為「任何人」 |
| `500 Internal Server Error` | Apps Script 代碼錯誤 | 檢查 `Code.gs`、執行日誌 |
| `缺少必要欄位：userId` | 請求數據格式問題 | 檢查前端代碼 |
| `JSON 解析錯誤` | 請求數據格式問題 | 檢查前端發送的數據 |

---

**最後更新**: 2025-12-16
