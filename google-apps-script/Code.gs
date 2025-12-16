/**
 * Google Apps Script - 股票登入系統
 * 
 * 功能：
 * 1. 處理登入請求
 * 2. 將用戶資訊寫入 Google Sheets
 * 
 * ⚠️ 重要：關於 CORS Headers
 * 
 * Google Apps Script 的 ContentService API 不支持手動設置 HTTP headers（包括 CORS headers）。
 * CORS headers 會根據部署權限自動設置：
 * - 如果部署權限設置為「任何人」，Google 會自動添加 CORS headers
 * - 如果部署權限設置為「僅限我自己」，Google 不會添加 CORS headers
 * 
 * 標準後端應該設置的 CORS headers（參考 CORS_TECHNICAL_GUIDE.md）：
 * - Access-Control-Allow-Origin: 指定允許的來源
 * - Access-Control-Allow-Credentials: 允許攜帶認證資訊
 * - Access-Control-Allow-Headers: 允許的請求標頭
 * - Access-Control-Allow-Methods: 允許的 HTTP 方法
 * 
 * 部署步驟：
 * 1. 在 Google Drive 創建新的 Google Apps Script 專案
 * 2. 複製此代碼到編輯器
 * 3. 創建 Google Sheet 並獲取 Sheet ID（在 Sheet URL 中）
 * 4. 更新下面的 SHEET_ID 變數
 * 5. 部署為 Web App（部署 -> 新增部署 -> 類型：網頁應用程式）
 * 6. ⚠️ 執行權限必須設置為：任何人均可存取（才能自動添加 CORS headers）
 * 7. 複製部署 URL 並設置為環境變數 VITE_GAS_URL
 */

// ========== 配置 ==========
const SHEET_ID = '1pB5UyKUcgQ4NU7yme1aDiLCWvr6gXHYq5CglWYj5IvU0QVzwi2z32nd9'; // 替換為您的 Google Sheet ID
const SHEET_NAME = 'CursorFintechDB'; // Sheet 工作表名稱

/**
 * 處理 HTTP GET 請求（用於測試連接）
 */
function doGet(e) {
  const output = ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      message: 'Google Apps Script Web App 運行正常',
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
  
  // 設置 CORS headers（雖然 GAS 不直接支持，但這樣寫可以確保一致性）
  return output;
}

/**
 * 處理 OPTIONS 請求（CORS 預檢請求）
 * 
 * 注意：Google Apps Script 可能不支持 doOptions() 函數。
 * CORS 預檢請求（OPTIONS）由 Google 根據部署權限自動處理。
 * 
 * 標準後端應該在 OPTIONS 請求中返回：
 * - Access-Control-Allow-Origin
 * - Access-Control-Allow-Methods
 * - Access-Control-Allow-Headers
 * - Access-Control-Allow-Credentials（如果需要）
 * 
 * 但在 Google Apps Script 中，這些 headers 是自動添加的（當部署權限為「任何人」時）。
 */
function doOptions() {
  // Google Apps Script 可能會自動處理 OPTIONS 請求
  // 此函數可能不會被調用，但保留以備未來支持
  const output = ContentService.createTextOutput('');
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * 處理 HTTP POST 請求
 * 
 * 注意：前端可能使用 text/plain 作為 Content-Type 來避免 CORS 預檢請求。
 * 無論 Content-Type 是 application/json 還是 text/plain，
 * postData.contents 都是字符串，可以直接用 JSON.parse() 解析。
 */
function doPost(e) {
  try {
    // 解析請求數據
    // 注意：即使 Content-Type 是 text/plain，內容仍然是 JSON 字符串
    let requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
    } catch (parseError) {
      const output = ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: 'JSON 解析錯誤: ' + parseError.toString()
        })
      ).setMimeType(ContentService.MimeType.JSON);
      return output;
    }
    
    // 根據 action 執行不同操作
    let result;
    if (requestData.action === 'login') {
      result = handleLogin(requestData);
    } else {
      result = ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '未知的操作類型'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    return result;
  } catch (error) {
    Logger.log('doPost 錯誤: ' + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: '處理請求時發生錯誤: ' + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 處理登入請求
 */
function handleLogin(data) {
  try {
    // 驗證必要欄位
    if (!data.userId) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '缺少必要欄位：userId'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 打開 Google Sheet（添加錯誤處理）
    let ss;
    try {
      ss = SpreadsheetApp.openById(SHEET_ID);
    } catch (openError) {
      Logger.log('打開 Sheet 失敗: ' + openError.toString());
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '無法訪問 Google Sheet。請檢查：\n' +
                   '1. Sheet ID 是否正確\n' +
                   '2. 是否已授權 Google Apps Script 訪問 Sheets\n' +
                   '3. Sheet 是否存在且未被刪除\n' +
                   '錯誤詳情: ' + openError.toString()
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    // 如果工作表不存在，創建它
    if (!sheet) {
      const newSheet = ss.insertSheet(SHEET_NAME);
      
      // 設置表頭
      newSheet.getRange(1, 1, 1, 4).setValues([['時間戳記', '用戶 ID', 'IP 地址', '狀態']]);
      newSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
      
      // 使用新工作表
      const sheetToUse = ss.getSheetByName(SHEET_NAME);
      
      // 添加數據
      addLoginRecord(sheetToUse, data);
    } else {
      // 添加數據到現有工作表
      addLoginRecord(sheet, data);
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: '登入記錄已成功保存',
        data: {
          userId: data.userId,
          timestamp: data.timestamp
        }
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: '保存登入記錄時發生錯誤: ' + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 添加登入記錄到 Sheet
 */
function addLoginRecord(sheet, data) {
  // 獲取 IP 地址（如果可用）
  const ipAddress = 'N/A'; // Google Apps Script 無法直接獲取客戶端 IP
  
  // 準備要寫入的數據
  const rowData = [
    data.timestamp || new Date().toISOString(), // 時間戳記
    data.userId,                                 // 用戶 ID
    ipAddress,                                   // IP 地址
    '成功'                                       // 狀態
  ];
  
  // 追加數據到 Sheet（使用 appendRow）
  sheet.appendRow(rowData);
  
  // 可選：格式化最後一行
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    // 設置時間戳記格式
    sheet.getRange(lastRow, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  }
}

/**
 * 測試 Sheet 訪問（用於診斷問題）
 * 
 * 在 Google Apps Script 編輯器中運行此函數來測試：
 * 1. Sheet ID 是否正確
 * 2. 是否有權限訪問 Sheet
 * 3. 工作表是否存在
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

/**
 * 初始化函數（手動運行以創建工作表）
 */
function initializeSheet() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    // 檢查工作表是否存在
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      // 創建新工作表
      sheet = ss.insertSheet(SHEET_NAME);
      
      // 設置表頭
      const headers = [['時間戳記', '用戶 ID', 'IP 地址', '狀態']];
      sheet.getRange(1, 1, 1, 4).setValues(headers);
      
      // 格式化表頭
      const headerRange = sheet.getRange(1, 1, 1, 4);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      
      // 設置列寬
      sheet.setColumnWidth(1, 180); // 時間戳記
      sheet.setColumnWidth(2, 150); // 用戶 ID
      sheet.setColumnWidth(3, 120); // IP 地址
      sheet.setColumnWidth(4, 100); // 狀態
      
      Logger.log('工作表已成功創建');
    } else {
      Logger.log('工作表已存在');
    }
    
    return sheet;
  } catch (error) {
    Logger.log('初始化工作表時發生錯誤: ' + error.toString());
    throw error;
  }
}
