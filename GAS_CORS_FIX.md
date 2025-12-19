# Google Apps Script "Failed to fetch" 錯誤修復指南

**問題**: 登入時顯示 "Failed to fetch" 錯誤

---

## 🔍 常見原因

### 1. Google Apps Script 部署設置問題

**最常見原因**: 部署權限或版本設置不正確

**解決方案**:
1. 前往 https://script.google.com
2. 打開您的 Apps Script 專案
3. 點擊「部署」→「管理部署」
4. 點擊部署旁邊的「編輯」圖標（筆形圖標）
5. **確認設置**:
   - **執行身分**: 我
   - **具有存取權的使用者**: **任何人**（必須是這個選項！）
   - **版本**: 新版本（或選擇最新版本）
6. 點擊「部署」
7. **重要**: 如果更改了設置，會生成新的 URL，需要更新 `.env` 文件

### 2. CORS 問題

雖然 Google Apps Script Web App 默認支持 CORS，但某些情況下可能需要檢查。

**解決方案**:
- 確保使用 `ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON)`
- 不要使用自定義 CORS headers（Apps Script 會自動處理）

### 3. URL 格式問題

**檢查 URL**:
- 正確格式: `https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec`
- 不要使用 `/dev` 結尾（那是開發版本）
- 確保 URL 完整且正確

### 4. 網絡問題

**檢查**:
1. 在瀏覽器中直接訪問 URL（GET 請求）
2. 應該看到 JSON 響應:
   ```json
   {
     "success": true,
     "message": "Google Apps Script Web App 運行正常",
     "timestamp": "..."
   }
   ```
3. 如果無法訪問，可能是：
   - 網絡連接問題
   - URL 錯誤
   - 部署未完成

---

## 🧪 診斷步驟

### 步驟 1: 測試 URL 連接

在瀏覽器中訪問您的 Google Apps Script URL:
```
https://script.google.com/macros/s/AKfycbzoEKE_10KGmlx8DfLgPa1SohOUYhrxuwmCHJRMogTkarwBL9NBAjBmP23JgRVE_GUk/exec
```

**預期結果**:
```json
{
  "success": true,
  "message": "Google Apps Script Web App 運行正常",
  "timestamp": "2025-12-16T..."
}
```

**如果看到錯誤**:
- 403 Forbidden: 部署權限設置錯誤，需要設置為「任何人」
- 404 Not Found: URL 錯誤或部署不存在
- 500 Error: Apps Script 代碼有錯誤

### 步驟 2: 檢查瀏覽器控制台

1. 打開瀏覽器開發者工具 (F12)
2. 切換到 Console 標籤
3. 嘗試登入
4. 查看詳細錯誤訊息

**常見錯誤訊息**:
- `CORS policy`: 部署權限問題
- `Failed to fetch`: 網絡錯誤或 URL 無法訪問
- `TypeError`: 請求格式問題

### 步驟 3: 檢查 Network 標籤

1. 打開瀏覽器開發者工具 (F12)
2. 切換到 Network 標籤
3. 嘗試登入
4. 查看請求詳情:
   - 請求 URL
   - 請求方法 (應該是 POST)
   - 狀態碼
   - 響應內容

---

## 🔧 修復方案

### 方案 1: 重新部署 Google Apps Script

1. 在 Apps Script 編輯器中
2. 點擊「部署」→「管理部署」
3. 點擊「編輯」
4. **關鍵設置**:
   ```
   執行身分: 我
   具有存取權的使用者: 任何人
   版本: 新版本
   ```
5. 點擊「部署」
6. 複製新的 URL
7. 更新 `.env` 文件中的 `VITE_GAS_URL`
8. 重啟開發服務器

### 方案 2: 檢查代碼錯誤

1. 在 Apps Script 編輯器中
2. 運行 `doGet` 函數測試
3. 檢查執行日誌是否有錯誤
4. 確保所有函數都能正常執行

### 方案 3: 使用 curl 測試（可選）

在命令行中測試 POST 請求:

```bash
curl -X POST \
  "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "login",
    "userId": "test",
    "timestamp": "2025-12-16T10:00:00Z"
  }'
```

如果 curl 成功但瀏覽器失敗，可能是 CORS 或瀏覽器設置問題。

---

## ⚠️ 重要檢查清單

- [ ] Google Apps Script 部署權限設置為「任何人」
- [ ] 使用 `/exec` 結尾的 URL（不是 `/dev`）
- [ ] URL 在瀏覽器中可以訪問（GET 請求）
- [ ] `.env` 文件中的 URL 正確
- [ ] 開發服務器已重啟（修改 `.env` 後）
- [ ] 瀏覽器控制台沒有其他錯誤
- [ ] 網絡連接正常

---

## 🆘 如果問題仍未解決

### 收集診斷信息

1. **瀏覽器控制台錯誤**:
   - 完整的錯誤訊息
   - 錯誤堆棧

2. **Network 標籤信息**:
   - 請求 URL
   - 狀態碼
   - 響應內容

3. **Google Apps Script 執行日誌**:
   - Apps Script 編輯器 → 執行 → 查看日誌
   - 確認是否有錯誤

4. **環境信息**:
   - 瀏覽器類型和版本
   - 是否使用代理或 VPN

---

**最後更新**: 2025-12-16





