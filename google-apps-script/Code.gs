/**
 * Google Apps Script - 股票登入系統
 * 
 * 功能：
 * 1. 處理登入請求
 * 2. 將用戶資訊寫入 Google Sheets
 * 
 * 部署步驟：
 * 1. 在 Google Drive 創建新的 Google Apps Script 專案
 * 2. 複製此代碼到編輯器
 * 3. 創建 Google Sheet 並獲取 Sheet ID（在 Sheet URL 中）
 * 4. 更新下面的 SHEET_ID 變數
 * 5. 部署為 Web App（部署 -> 新增部署 -> 類型：網頁應用程式）
 * 6. 執行權限設置為：任何人均可存取（或根據需求設置）
 * 7. 複製部署 URL 並設置為環境變數 VITE_GAS_URL
 */

// ========== 配置 ==========
const SHEET_ID = 'YOUR_SHEET_ID_HERE'; // 替換為您的 Google Sheet ID
const SHEET_NAME = '登入記錄'; // Sheet 工作表名稱

/**
 * 處理 HTTP GET 請求（用於測試連接）
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      message: 'Google Apps Script Web App 運行正常',
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 處理 HTTP POST 請求
 */
function doPost(e) {
  try {
    // 解析請求數據
    const requestData = JSON.parse(e.postData.contents);
    
    // 根據 action 執行不同操作
    if (requestData.action === 'login') {
      return handleLogin(requestData);
    } else {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '未知的操作類型'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
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
    if (!data.userId || !data.email) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '缺少必要欄位：userId 或 email'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 打開 Google Sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // 如果工作表不存在，創建它
    if (!sheet) {
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const newSheet = ss.insertSheet(SHEET_NAME);
      
      // 設置表頭
      newSheet.getRange(1, 1, 1, 5).setValues([['時間戳記', '用戶 ID', '電子郵件', 'IP 地址', '狀態']]);
      newSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
      
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
          email: data.email,
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
    data.email,                                  // 電子郵件
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
      const headers = [['時間戳記', '用戶 ID', '電子郵件', 'IP 地址', '狀態']];
      sheet.getRange(1, 1, 1, 5).setValues(headers);
      
      // 格式化表頭
      const headerRange = sheet.getRange(1, 1, 1, 5);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      
      // 設置列寬
      sheet.setColumnWidth(1, 180); // 時間戳記
      sheet.setColumnWidth(2, 150); // 用戶 ID
      sheet.setColumnWidth(3, 200); // 電子郵件
      sheet.setColumnWidth(4, 120); // IP 地址
      sheet.setColumnWidth(5, 100); // 狀態
      
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
