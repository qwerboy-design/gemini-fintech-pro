/**
 * Google Apps Script - 股票登入系統
 * 
 * 功能：
 * 1. 處理登入請求
 * 2. 將用戶資訊寫入 Google Sheets
 * 
 * [重要] 關於 CORS Headers
 * 
 * Google Apps Script 的 ContentService API 不支持手動設置 HTTP headers（包括 CORS headers）。
 * CORS headers 會根據部署權限自動設置：
 * - [成功] 如果部署權限設置為「任何人」，Google 會自動添加 CORS headers（支持跨域請求）
 * - [失敗] 如果部署權限設置為「僅限我自己」，Google 不會添加 CORS headers（會導致 CORS 錯誤）
 * 
 * 解決 CORS 問題的唯一方法：
 * 1. 前往 Google Apps Script 編輯器
 * 2. 點擊「部署」→「管理部署」
 * 3. 編輯部署，設置「具有存取權的使用者」為「任何人」
 * 4. 點擊「重新部署」
 * 
 * 詳細說明請參考：BACKEND_CORS_FIX.md
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
 * 6. [重要] 執行權限必須設置為：任何人均可存取（才能自動添加 CORS headers）
 * 7. 複製部署 URL 並設置為環境變數 VITE_GAS_URL
 * 
 * [測試函式說明]
 * 
 * 如果您想測試特定功能，請使用以下測試函式：
 * - testSheetAccess(): 測試 Sheet 訪問權限
 * - testSaveOrUpdateStock(): 測試股票保存功能
 * - initializeUserStocksSheetStandalone(): 初始化 UserStocks 工作表
 * 
 * ⚠️ 警告：請勿直接執行內部函式（如 saveOrUpdateStock），這些函式需要參數且應通過對應的處理函式被呼叫。
 */

// ========== 配置 ==========
const SHEET_ID = '1zzpbZADRiJNd52OcK4sAxAzrDg5ZKuhgJhSzYPo9wS4'; // 替換為您的 Google Sheet ID
const SHEET_NAME = 'CursorFintechDB'; // Sheet 工作表名稱 (用於登入記錄)
const USER_STOCKS_SHEET_NAME = 'UserStocks'; // Sheet 工作表名稱 (用於股票資料)

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
  // #region agent log
  Logger.log(JSON.stringify({location:'Code.gs:doPost:entry', message:'doPost entry', data:{hasPostData:!!e.postData, contentLength:e.postData?.contents?.length||0}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H4'}));
  // #endregion
  
  try {
    // 解析請求數據
    // 注意：即使 Content-Type 是 text/plain，內容仍然是 JSON 字符串
    let requestData;
    try {
      if (!e.postData || !e.postData.contents) {
        // #region agent log
        Logger.log(JSON.stringify({location:'Code.gs:doPost:noPostData', message:'No postData in request', timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H4'}));
        // #endregion
        throw new Error('請求數據為空');
      }
      requestData = JSON.parse(e.postData.contents);
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:doPost:parsed', message:'Request data parsed', data:{action:requestData?.action, userId:requestData?.userId}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H4'}));
      // #endregion
    } catch (parseError) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:doPost:parseError', message:'JSON parse error', data:{error:parseError.toString()}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H4'}));
      // #endregion
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
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:doPost:dispatch', message:'Dispatching to handler', data:{action:requestData.action}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H4'}));
    // #endregion
    
    if (requestData.action === 'login') {
      result = handleLogin(requestData);
    } else if (requestData.action === 'saveStock') {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:doPost:beforeHandleSaveStock', message:'About to call handleSaveStock', data:{requestData:requestData}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H4'}));
      // #endregion
      result = handleSaveStock(requestData);
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:doPost:afterHandleSaveStock', message:'handleSaveStock returned', data:{resultIsNotNull:!!result}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H4'}));
      // #endregion
    } else if (requestData.action === 'deleteStock') {
      result = handleDeleteStock(requestData);
    } else if (requestData.action === 'getUserStocks') {
      result = handleGetUserStocks(requestData);
    } else if (requestData.action === 'getGeminiReport') {
      result = handleGeminiReport(requestData);
    } else {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:doPost:unknownAction', message:'Unknown action', data:{action:requestData.action}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H4'}));
      // #endregion
      result = ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '未知的操作類型: ' + (requestData.action || '未指定')
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    return result;
  } catch (error) {
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:doPost:error', message:'doPost caught error', data:{error:error.toString(), stack:error.stack}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H4'}));
    // #endregion
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
    Logger.log('[成功] Sheet 打開成功');
    
    // 測試查找工作表
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (sheet) {
      Logger.log('[成功] 工作表 "' + SHEET_NAME + '" 已存在');
      Logger.log('工作表行數: ' + sheet.getLastRow());
    } else {
      Logger.log('[警告] 工作表 "' + SHEET_NAME + '" 不存在，將在首次登入時自動創建');
    }
    
    return {
      success: true,
      message: 'Sheet 訪問測試成功',
      sheetId: SHEET_ID,
      sheetName: SHEET_NAME,
      sheetExists: !!sheet
    };
  } catch (error) {
    Logger.log('[錯誤] 錯誤: ' + error.toString());
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

/**
 * 處理儲存股票請求
 */
function handleSaveStock(data) {
  // #region agent log
  Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:entry', message:'handleSaveStock entry', data:{userId:data?.userId, stockSymbol:data?.stock?.symbol, sheetId:SHEET_ID, sheetName:USER_STOCKS_SHEET_NAME}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
  // #endregion
  
  try {
    // 驗證必要欄位
    if (!data || !data.userId || !data.stock || !data.stock.symbol) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:validationError', message:'Validation failed for handleSaveStock', data:{data:data}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
      // #endregion
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '缺少必要欄位：userId 或 stock.symbol'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 打開 Google Sheet
    let ss;
    try {
      ss = SpreadsheetApp.openById(SHEET_ID);
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:openByIdSuccess', message:'Spreadsheet opened by ID', data:{sheetId:SHEET_ID, ssIsNotNull:!!ss}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
      // #endregion
    } catch (openError) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:openByIdError', message:'Failed to open spreadsheet by ID', data:{sheetId:SHEET_ID, error:openError.toString()}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
      // #endregion
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '無法訪問 Google Sheet (SHEET_ID 錯誤或權限不足): ' + openError.toString()
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 獲取或創建 UserStocks 工作表
    let sheet = ss.getSheetByName(USER_STOCKS_SHEET_NAME);
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:getSheetByName', message:'Attempted to get UserStocks sheet', data:{sheetName:USER_STOCKS_SHEET_NAME, sheetIsNotNull:!!sheet}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
    // #endregion
    
    if (!sheet) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:sheetNotFound', message:'UserStocks sheet not found, attempting to initialize', data:{sheetName:USER_STOCKS_SHEET_NAME}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
      // #endregion
      try {
        sheet = initializeUserStocksSheet(ss);
        // #region agent log
        Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:initResult', message:'Initialize UserStocks sheet result', data:{sheetIsNotNull:!!sheet, sheetName:sheet?.getName()}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
        // #endregion
      } catch (initError) {
        // #region agent log
        Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:initFailed', message:'Failed to initialize UserStocks sheet', data:{initError:initError.toString()}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
        // #endregion
        return ContentService.createTextOutput(
          JSON.stringify({
            success: false,
            message: '創建 UserStocks 工作表失敗: ' + initError.toString()
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // 再次確認 sheet 不為 null（防止初始化失敗但沒有拋出異常的情況）
    if (!sheet) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:sheetStillNull', message:'UserStocks sheet is still null after initialization attempt', data:{sheetName:USER_STOCKS_SHEET_NAME}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
      // #endregion
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: 'UserStocks 工作表初始化後仍無法獲取，請檢查 SHEET_ID 和權限設置'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:sheetReady', message:'UserStocks sheet is ready before calling saveOrUpdateStock', data:{sheetName:sheet.getName(), sheetLastRow:sheet.getLastRow(), sheetIsNotNull:!!sheet, dataIsNotNull:!!data, dataUserId:data?.userId, dataStockSymbol:data?.stock?.symbol}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H1'}));
    // #endregion
    
    // 最終參數驗證（防禦性編程）
    if (!sheet) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:finalSheetCheckFailed', message:'CRITICAL: Sheet is null before calling saveOrUpdateStock', timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H1'}));
      // #endregion
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '內部錯誤：無法獲取工作表對象，請聯繫管理員'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (!data || !data.userId || !data.stock) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:finalDataCheckFailed', message:'CRITICAL: Data is invalid before calling saveOrUpdateStock', data:{data:data}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H1'}));
      // #endregion
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '內部錯誤：數據驗證失敗，請聯繫管理員'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 保存或更新股票記錄
    // 使用局部常量確保參數不會被意外修改
    const sheetToSave = sheet;
    const dataToSave = data;
    
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:aboutToCallSaveOrUpdate', message:'About to call saveOrUpdateStock - FINAL CHECK PASSED', data:{sheetIsNotNull:!!sheetToSave, dataIsNotNull:!!dataToSave, sheetName:sheetToSave?.getName(), userId:dataToSave?.userId, stockSymbol:dataToSave?.stock?.symbol, sheetType:typeof sheetToSave, dataType:typeof dataToSave}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H1'}));
    // #endregion
    
    // 最終驗證（使用局部常量）
    if (!sheetToSave || !dataToSave) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:criticalValidationFailed', message:'CRITICAL: Parameters became null/undefined just before call', data:{sheetToSaveIsNull:!sheetToSave, dataToSaveIsNull:!dataToSave, originalSheetIsNotNull:!!sheet, originalDataIsNotNull:!!data}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H1'}));
      // #endregion
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '內部錯誤：參數驗證失敗，請聯繫管理員並檢查系統日誌'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 驗證 dataToSave 的結構
    if (!dataToSave.userId || !dataToSave.stock || !dataToSave.stock.symbol) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:dataStructureInvalid', message:'CRITICAL: Data structure is invalid', data:{hasUserId:!!dataToSave.userId, hasStock:!!dataToSave.stock, hasStockSymbol:!!dataToSave.stock?.symbol}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H1'}));
      // #endregion
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '內部錯誤：數據結構不完整，請聯繫管理員'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:allChecksPassed', message:'All validation checks passed, calling saveOrUpdateStock', data:{sheetName:sheetToSave.getName(), userId:dataToSave.userId, stockSymbol:dataToSave.stock.symbol}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H1'}));
    // #endregion
    
    let result;
    try {
      // 最終驗證參數有效性（在呼叫前最後一次檢查）
      if (!sheetToSave || !dataToSave) {
        Logger.log('ERROR: sheetToSave or dataToSave is null before calling saveOrUpdateStock');
        throw new Error('參數驗證失敗：sheetToSave 或 dataToSave 為空');
      }
      
      if (!dataToSave.userId || !dataToSave.stock || !dataToSave.stock.symbol) {
        Logger.log('ERROR: dataToSave structure is invalid before calling saveOrUpdateStock');
        throw new Error('參數驗證失敗：dataToSave 結構不完整');
      }
      
      // 記錄呼叫前的參數狀態
      Logger.log('Calling saveOrUpdateStock with sheet: ' + (sheetToSave ? sheetToSave.getName() : 'null') + ', data.userId: ' + (dataToSave ? dataToSave.userId : 'null'));
      
      // 明確傳遞參數，確保參數順序正確
      result = saveOrUpdateStock(sheetToSave, dataToSave);
    } catch (saveError) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:saveOrUpdateStockThrew', message:'saveOrUpdateStock threw an error', data:{error:saveError.toString(), errorName:saveError.name, errorMessage:saveError.message, stack:saveError.stack}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H1'}));
      // #endregion
      throw saveError; // Re-throw to be caught by outer catch
    }
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:returningResult', message:'Returning result from handleSaveStock', data:{resultSuccess:result?.success, resultMessage:result?.message}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H1'}));
    // #endregion
    
    return ContentService.createTextOutput(
      JSON.stringify(result)
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:handleSaveStock:error', message:'handleSaveStock caught error', data:{error:error.toString(), errorName:error.name, stack:error.stack, errorMessage:error.message}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H1'}));
    // #endregion
    
    // 如果是參數錯誤，提供更詳細的錯誤訊息
    if (error.name === 'InvalidParameterError') {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '參數驗證失敗: ' + error.message + '。請檢查系統日誌。'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: '儲存股票時發生錯誤: ' + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 處理刪除股票請求
 */
function handleDeleteStock(data) {
  // #region agent log
  Logger.log(JSON.stringify({location:'Code.gs:handleDeleteStock:entry', message:'handleDeleteStock entry', data:{dataIsNotNull:!!data, dataType:typeof data, userId:data?.userId, stockSymbol:data?.stockSymbol}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H5'}));
  // #endregion
  
  try {
    // 驗證 data 本身是否存在
    if (!data) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleDeleteStock:dataIsNull', message:'Data parameter is null or undefined', timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H5'}));
      // #endregion
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '缺少請求數據'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 驗證必要欄位
    if (!data.userId || !data.stockSymbol) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleDeleteStock:validationError', message:'Validation failed - missing required fields', data:{hasUserId:!!data.userId, hasStockSymbol:!!data.stockSymbol}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H5'}));
      // #endregion
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '缺少必要欄位：userId 或 stockSymbol'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 打開 Google Sheet
    let ss;
    try {
      ss = SpreadsheetApp.openById(SHEET_ID);
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleDeleteStock:openByIdSuccess', message:'Spreadsheet opened by ID', data:{sheetId:SHEET_ID, ssIsNotNull:!!ss}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H5'}));
      // #endregion
    } catch (openError) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleDeleteStock:openByIdError', message:'Failed to open spreadsheet', data:{error:openError.toString()}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H5'}));
      // #endregion
      Logger.log('打開 Sheet 失敗: ' + openError.toString());
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '無法訪問 Google Sheet: ' + openError.toString()
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 獲取 UserStocks 工作表
    const sheet = ss.getSheetByName(USER_STOCKS_SHEET_NAME);
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:handleDeleteStock:getSheetByName', message:'Attempted to get UserStocks sheet', data:{sheetName:USER_STOCKS_SHEET_NAME, sheetIsNotNull:!!sheet}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H5'}));
    // #endregion
    
    if (!sheet) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:handleDeleteStock:sheetNotFound', message:'UserStocks sheet not found', timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H5'}));
      // #endregion
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: 'UserStocks 工作表不存在'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 使用局部常量保存參數
    const userIdToDelete = data.userId;
    const stockSymbolToDelete = data.stockSymbol;
    
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:handleDeleteStock:aboutToDelete', message:'About to call deleteStockRecord', data:{userId:userIdToDelete, stockSymbol:stockSymbolToDelete, sheetIsNotNull:!!sheet}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H5'}));
    // #endregion
    
    // 刪除股票記錄
    const result = deleteStockRecord(sheet, userIdToDelete, stockSymbolToDelete);
    
    return ContentService.createTextOutput(
      JSON.stringify(result)
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:handleDeleteStock:error', message:'handleDeleteStock caught error', data:{error:error.toString(), errorName:error.name, errorMessage:error.message, stack:error.stack}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H5'}));
    // #endregion
    Logger.log('handleDeleteStock 錯誤: ' + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: '刪除股票時發生錯誤: ' + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 初始化 UserStocks 工作表
 * 
 * @param {Spreadsheet} ss - Google Spreadsheet 對象（可選，如果不提供則自動打開）
 * @returns {Sheet} 創建的 UserStocks 工作表
 */
function initializeUserStocksSheet(ss) {
  // #region agent log
  Logger.log(JSON.stringify({location:'Code.gs:initializeUserStocksSheet:entry', message:'initializeUserStocksSheet entry', data:{ssIsNotNull:!!ss, sheetName:USER_STOCKS_SHEET_NAME, sheetId:SHEET_ID}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H3'}));
  // #endregion
  
  // 如果沒有傳入 ss 參數，自動打開 Spreadsheet
  if (!ss) {
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:initializeUserStocksSheet:ssIsNull', message:'Spreadsheet parameter is null, attempting to open by ID', data:{sheetId:SHEET_ID}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H3'}));
    // #endregion
    try {
      ss = SpreadsheetApp.openById(SHEET_ID);
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:initializeUserStocksSheet:openedById', message:'Opened spreadsheet by ID', data:{ssIsNotNull:!!ss}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H3'}));
      // #endregion
      if (!ss) {
        // #region agent log
        Logger.log(JSON.stringify({location:'Code.gs:initializeUserStocksSheet:ssStillNull', message:'openById returned null', timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H3'}));
        // #endregion
        throw new Error('SpreadsheetApp.openById 返回了 null 或 undefined');
      }
    } catch (openError) {
      // #region agent log
      Logger.log(JSON.stringify({location:'Code.gs:initializeUserStocksSheet:openError', message:'Failed to open spreadsheet', data:{error:openError.toString()}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H3'}));
      // #endregion
      Logger.log('打開 Sheet 失敗: ' + openError.toString());
      throw new Error('無法打開 Google Sheet: ' + openError.toString());
    }
  }
  
  // 檢查工作表是否已存在
  // #region agent log
  Logger.log(JSON.stringify({location:'Code.gs:initializeUserStocksSheet:checkExisting', message:'Checking for existing sheet', data:{sheetName:USER_STOCKS_SHEET_NAME}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H3'}));
  // #endregion
  let existingSheet = ss.getSheetByName(USER_STOCKS_SHEET_NAME);
  if (existingSheet) {
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:initializeUserStocksSheet:sheetExists', message:'Sheet already exists, returning', data:{sheetName:existingSheet.getName()}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H3'}));
    // #endregion
    return existingSheet;
  }
  
  // 創建新工作表
  // #region agent log
  Logger.log(JSON.stringify({location:'Code.gs:initializeUserStocksSheet:creatingSheet', message:'Creating new sheet', data:{sheetName:USER_STOCKS_SHEET_NAME}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H3'}));
  // #endregion
  const sheet = ss.insertSheet(USER_STOCKS_SHEET_NAME);
  // #region agent log
  Logger.log(JSON.stringify({location:'Code.gs:initializeUserStocksSheet:sheetCreated', message:'Sheet created', data:{sheetIsNotNull:!!sheet}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H3'}));
  // #endregion
  
  // 設置表頭
  const headers = [
    ['UserId', 'StockSymbol', 'StockName', 'Price', 'Change', 'Volume', 'Chips', 'BuySellRatio', 'CreatedAt', 'UpdatedAt']
  ];
  sheet.getRange(1, 1, 1, 10).setValues(headers);
  
  // 格式化表頭
  const headerRange = sheet.getRange(1, 1, 1, 10);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');
  
  // 設置列寬
  sheet.setColumnWidth(1, 120); // UserId
  sheet.setColumnWidth(2, 100); // StockSymbol
  sheet.setColumnWidth(3, 150); // StockName
  sheet.setColumnWidth(4, 100); // Price
  sheet.setColumnWidth(5, 100); // Change
  sheet.setColumnWidth(6, 120); // Volume
  sheet.setColumnWidth(7, 100); // Chips
  sheet.setColumnWidth(8, 120); // BuySellRatio
  sheet.setColumnWidth(9, 180); // CreatedAt
  sheet.setColumnWidth(10, 180); // UpdatedAt
  
  // #region agent log
  Logger.log(JSON.stringify({location:'Code.gs:initializeUserStocksSheet:exit', message:'initializeUserStocksSheet exit', data:{sheetIsNotNull:!!sheet, sheetName:sheet?.getName()}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H3'}));
  // #endregion
  Logger.log('UserStocks 工作表已成功創建');
  return sheet;
}

/**
 * 獨立初始化 UserStocks 工作表（用於手動執行測試）
 * 此函數不需要參數，可直接在 Google Apps Script 編輯器中執行
 * 
 * 使用方式：
 * 1. 在 Google Apps Script 編輯器中選擇此函數
 * 2. 點擊「執行」按鈕
 * 3. 查看「執行記錄」確認結果
 */
function initializeUserStocksSheetStandalone() {
  Logger.log('開始初始化 UserStocks 工作表...');
  
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    if (!ss) {
      throw new Error('無法打開 Spreadsheet，openById 返回 null');
    }
    
    const sheet = initializeUserStocksSheet(ss);
    Logger.log('初始化成功！工作表行數: ' + sheet.getLastRow());
    return sheet;
  } catch (error) {
    Logger.log('初始化失敗: ' + error.toString());
    throw error;
  }
}

/**
 * 保存或更新股票記錄
 * 
 * ⚠️ 警告：此函式不應直接執行！
 * 
 * 此函式是一個內部函式，應該只通過 handleSaveStock() 被呼叫。
 * 如果您想測試此函式，請使用 testSaveOrUpdateStock() 函式。
 * 
 * @param {Sheet} sheet - Google Sheet 工作表對象
 * @param {Object} data - 包含 userId 和 stock 的數據對象
 * @private
 */
function saveOrUpdateStock(sheet, data) {
  // 嚴格參數驗證 - 必須在函數開頭立即檢查
  // 檢查 arguments 對象以確保參數被正確傳遞
  if (arguments.length < 2) {
    // 記錄呼叫堆疊以便追蹤問題
    let stackTrace = '';
    try {
      throw new Error();
    } catch (e) {
      stackTrace = e.stack || '無法獲取堆疊資訊';
    }
    
    Logger.log('ERROR: saveOrUpdateStock called with ' + arguments.length + ' parameter(s). Stack trace: ' + stackTrace);
    
    const error = new Error(
      'saveOrUpdateStock 需要 2 個參數：sheet 和 data。收到 ' + arguments.length + ' 個參數。\n' +
      '此函式是內部函式，不應直接執行。\n' +
      '如果您想測試此函式，請使用 testSaveOrUpdateStock() 函式。\n' +
      '在生產環境中，此函式應該只通過 handleSaveStock() 被呼叫。'
    );
    error.name = 'InvalidParameterError';
    throw error;
  }
  
  if (!sheet || sheet === null || sheet === undefined) {
    const error = new Error('sheet parameter is required and cannot be null or undefined');
    error.name = 'InvalidParameterError';
    throw error;
  }
  
  if (!data || data === null || data === undefined) {
    const error = new Error('data parameter is required and cannot be null or undefined');
    error.name = 'InvalidParameterError';
    throw error;
  }
  
  // 驗證 data 的結構
  if (!data.userId || !data.stock || !data.stock.symbol) {
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:saveOrUpdateStock:dataInvalid', message:'Data structure is invalid', data:{hasUserId:!!data.userId, hasStock:!!data.stock, hasStockSymbol:!!data.stock?.symbol}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H1'}));
    // #endregion
    const error = new Error('data must contain userId, stock, and stock.symbol');
    error.name = 'InvalidParameterError';
    throw error;
  }
  
  const userId = data.userId;
  const stock = data.stock;
  
  // #region agent log
  Logger.log(JSON.stringify({location:'Code.gs:saveOrUpdateStock:paramsExtracted', message:'Params extracted in saveOrUpdateStock', data:{userId:userId, stockSymbol:stock?.symbol, stockName:stock?.name}, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId:'H1'}));
  // #endregion
  
  const now = new Date().toISOString();
  
  // 查找所有匹配的記錄（根據 UserId 和 StockSymbol 作為唯一鍵）
  const lastRow = sheet.getLastRow();
  const rowsToDelete = [];
  let existingCreatedAt = null; // 保存原有記錄的 CreatedAt（如果存在）
  let isUpdate = false;
  
  if (lastRow > 1) {
    // 從第2行開始查找（跳過表頭）
    // 讀取 UserId, StockSymbol, 和 CreatedAt（第9列）
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 9); // 讀取 UserId, StockSymbol, 以及到 CreatedAt 的所有列
    const values = dataRange.getValues();
    
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === userId && values[i][1] === stock.symbol) {
        const rowNumber = i + 2; // +2 因為從第2行開始，且陣列索引從0開始
        rowsToDelete.push(rowNumber);
        
        // 如果是第一筆匹配記錄，保存其 CreatedAt（Column 9，索引 8）
        if (existingCreatedAt === null && values[i][8]) {
          existingCreatedAt = values[i][8];
        }
        isUpdate = true;
      }
    }
  }
  
  // 如果有匹配記錄，先刪除所有匹配的記錄（確保唯一性）
  if (rowsToDelete.length > 0) {
    // #region agent log
    Logger.log(JSON.stringify({location:'Code.gs:saveOrUpdateStock:foundExistingRecords', message:'Found existing records to delete', data:{count:rowsToDelete.length, userId:userId, stockSymbol:stock.symbol, existingCreatedAt:existingCreatedAt}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H1'}));
    // #endregion
    
    // 從後往前刪除（避免刪除後行號變化影響後續刪除）
    rowsToDelete.sort(function(a, b) { return b - a; });
    
    for (let i = 0; i < rowsToDelete.length; i++) {
      sheet.deleteRow(rowsToDelete[i]);
    }
    
    Logger.log('刪除舊記錄: ' + userId + ' - ' + stock.symbol + ' (共 ' + rowsToDelete.length + ' 筆)');
  }
  
  // 準備要寫入的數據
  // CreatedAt: 如果原有記錄存在，使用原有值；否則使用當前時間
  const createdAt = existingCreatedAt || now;
  
  const rowData = [
    userId,
    stock.symbol || '',
    stock.name || '',
    stock.price || 0,
    stock.change || 0,
    stock.volume || '',
    stock.chips || '',
    stock.buySellRatio || '',
    createdAt, // CreatedAt (保持原值或新建)
    now // UpdatedAt (總是更新為當前時間)
  ];
  
  // 新增記錄（無論是新增還是更新，都使用新增操作以確保唯一性）
  sheet.appendRow(rowData);
  
  // #region agent log
  Logger.log(JSON.stringify({location:'Code.gs:saveOrUpdateStock:rowAdded', message:'Stock record added', data:{userId:userId, stockSymbol:stock.symbol, isUpdate:isUpdate, deletedCount:rowsToDelete.length}, timestamp:Date.now(), sessionId:'debug-session', runId:'run2', hypothesisId:'H1'}));
  // #endregion
  
  if (isUpdate) {
    Logger.log('更新股票記錄: ' + userId + ' - ' + stock.symbol + ' (刪除 ' + rowsToDelete.length + ' 筆舊記錄後新增)');
    return {
      success: true,
      message: '股票記錄已成功更新',
      action: 'updated'
    };
  } else {
    Logger.log('新增股票記錄: ' + userId + ' - ' + stock.symbol);
    return {
      success: true,
      message: '股票記錄已成功新增',
      action: 'created'
    };
  }
}

/**
 * 刪除股票記錄（刪除指定 UserId 和股票代號的所有記錄）
 */
function deleteStockRecord(sheet, userId, stockSymbol) {
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return {
      success: false,
      message: '沒有找到要刪除的記錄'
    };
  }
  
  // 從第2行開始查找（跳過表頭）
  const dataRange = sheet.getRange(2, 1, lastRow - 1, 2); // 只讀取 UserId 和 StockSymbol 列
  const values = dataRange.getValues();
  
  // 收集所有匹配的行號（使用陣列收集所有匹配的記錄）
  const rowsToDelete = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === userId && values[i][1] === stockSymbol) {
      rowsToDelete.push(i + 2); // +2 因為從第2行開始，且陣列索引從0開始
    }
  }
  
  if (rowsToDelete.length === 0) {
    return {
      success: false,
      message: '未找到對應的股票記錄'
    };
  }
  
  // 從後往前刪除（避免刪除後行號變化影響後續刪除）
  // 先對行號進行降序排序
  rowsToDelete.sort(function(a, b) { return b - a; });
  
  // 依次刪除每一行
  for (let i = 0; i < rowsToDelete.length; i++) {
    sheet.deleteRow(rowsToDelete[i]);
  }
  
  Logger.log('刪除股票記錄: ' + userId + ' - ' + stockSymbol + ' (共 ' + rowsToDelete.length + ' 筆)');
  
  return {
    success: true,
    message: '已成功刪除 ' + rowsToDelete.length + ' 筆股票記錄'
  };
}

/**
 * 獲取用戶的所有股票記錄（每個股票代號只返回最新一筆）
 */
function handleGetUserStocks(data) {
  try {
    // 驗證必要欄位
    if (!data || !data.userId) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '缺少必要欄位：userId'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const userId = data.userId;

    // 打開 Google Sheet
    let ss;
    try {
      ss = SpreadsheetApp.openById(SHEET_ID);
    } catch (openError) {
      Logger.log('打開 Sheet 失敗: ' + openError.toString());
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '無法訪問 Google Sheet: ' + openError.toString()
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 獲取 UserStocks 工作表
    let sheet = ss.getSheetByName(USER_STOCKS_SHEET_NAME);
    
    if (!sheet) {
      // 如果工作表不存在，返回空列表
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: '沒有找到股票記錄',
          data: {
            stocks: []
          }
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 讀取所有數據（從第2行開始，跳過表頭）
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: '沒有找到股票記錄',
          data: {
            stocks: []
          }
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 讀取所有列：UserId, StockSymbol, StockName, Price, Change, Volume, Chips, BuySellRatio, CreatedAt, UpdatedAt
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 10);
    const values = dataRange.getValues();
    
    // 過濾該用戶的記錄
    const userRecords = values.filter(row => row[0] === userId);
    
    if (userRecords.length === 0) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: '沒有找到股票記錄',
          data: {
            stocks: []
          }
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 按股票代號分組，每個股票代號只保留最新一筆（按 UpdatedAt 排序）
    // #region agent log
    Logger.log('=== handleGetUserStocks: 開始處理 ' + userRecords.length + ' 筆記錄 ===');
    // #endregion
    
    const stockMap = {};
    userRecords.forEach((row, index) => {
      const stockSymbol = row[1]; // StockSymbol
      const updatedAt = row[9]; // UpdatedAt
      
      // #region agent log
      Logger.log('處理記錄 ' + (index + 1) + ': symbol=' + stockSymbol + ', updatedAt=' + updatedAt + ' (type: ' + typeof updatedAt + ')');
      // #endregion
      
      // 確保 updatedAt 是 Date 對象，如果是字符串則轉換
      let updatedAtDate = null;
      if (updatedAt) {
        if (typeof updatedAt === 'string' && updatedAt.trim() !== '') {
          updatedAtDate = new Date(updatedAt);
          // 檢查是否為有效日期
          if (isNaN(updatedAtDate.getTime())) {
            updatedAtDate = null;
          }
        } else if (updatedAt && typeof updatedAt.getTime === 'function') {
          // 已經是 Date 對象，檢查是否有效
          if (!isNaN(updatedAt.getTime())) {
            updatedAtDate = updatedAt;
          }
        }
      }
      
      const existingRecord = stockMap[stockSymbol];
      let shouldUpdate = false;
      
      if (!existingRecord) {
        // #region agent log
        Logger.log('  新股票代號，直接添加: ' + stockSymbol);
        // #endregion
        shouldUpdate = true;
      } else if (!existingRecord.updatedAt) {
        // #region agent log
        Logger.log('  現有記錄沒有 updatedAt，更新: ' + stockSymbol);
        // #endregion
        shouldUpdate = true;
      } else if (updatedAtDate && updatedAtDate.getTime && !isNaN(updatedAtDate.getTime())) {
        // 將現有記錄的 updatedAt 也轉換為 Date
        let existingUpdatedAt = existingRecord.updatedAt;
        if (existingUpdatedAt) {
          if (typeof existingUpdatedAt === 'string') {
            existingUpdatedAt = new Date(existingUpdatedAt);
          }
          
          // 檢查現有記錄的日期是否有效
          if (existingUpdatedAt && existingUpdatedAt.getTime && !isNaN(existingUpdatedAt.getTime())) {
            if (updatedAtDate.getTime() > existingUpdatedAt.getTime()) {
              // #region agent log
              Logger.log('  找到更新的記錄，更新: ' + stockSymbol + ' (新: ' + updatedAtDate.toISOString() + ', 舊: ' + existingUpdatedAt.toISOString() + ')');
              // #endregion
              shouldUpdate = true;
            } else {
              // #region agent log
              Logger.log('  保留現有記錄（更新時間更舊）: ' + stockSymbol);
              // #endregion
            }
          } else {
            // #region agent log
            Logger.log('  現有記錄日期無效，更新: ' + stockSymbol);
            // #endregion
            shouldUpdate = true;
          }
        } else {
          // #region agent log
          Logger.log('  現有記錄沒有 updatedAt，更新: ' + stockSymbol);
          // #endregion
          shouldUpdate = true;
        }
      } else {
        // #region agent log
        Logger.log('  當前記錄 updatedAt 無效，跳過: ' + stockSymbol);
        // #endregion
      }
      
      if (shouldUpdate) {
        stockMap[stockSymbol] = {
          symbol: stockSymbol,
          name: row[2] || stockSymbol, // StockName
          price: row[3] || 0, // Price
          change: row[4] || 0, // Change
          volume: row[5] || 0, // Volume
          chips: row[6] || 0, // Chips
          buySellRatio: row[7] || 0, // BuySellRatio
          updatedAt: updatedAtDate || updatedAt // UpdatedAt（保存原始值或轉換後的值）
        };
      }
    });
    
    // 轉換為陣列
    const stocks = Object.values(stockMap);
    
    // #region agent log
    Logger.log('=== 處理完成，共 ' + stocks.length + ' 個不同的股票代號 ===');
    stocks.forEach((stock, index) => {
      Logger.log('股票 ' + (index + 1) + ': ' + stock.symbol + ' - ' + stock.name + ' (updatedAt: ' + (stock.updatedAt ? (typeof stock.updatedAt.getTime === 'function' ? stock.updatedAt.toISOString() : stock.updatedAt) : 'null') + ')');
    });
    // #endregion
    
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: '成功獲取股票記錄',
        data: {
          stocks: stocks
        }
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('handleGetUserStocks 錯誤: ' + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: '獲取股票記錄時發生錯誤: ' + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 測試 saveOrUpdateStock 函式（僅供測試使用）
 * 
 * 注意：此函式僅用於測試目的。在生產環境中，saveOrUpdateStock 應該只通過 handleSaveStock 被呼叫。
 * 
 * 使用方式：
 * 1. 在 Google Apps Script 編輯器中選擇此函式
 * 2. 點擊「執行」按鈕
 * 3. 查看「執行記錄」確認結果
 */
function testSaveOrUpdateStock() {
  try {
    Logger.log('開始測試 saveOrUpdateStock...');
    
    // 打開 Spreadsheet
    const ss = SpreadsheetApp.openById(SHEET_ID);
    if (!ss) {
      throw new Error('無法打開 Spreadsheet');
    }
    
    // 獲取或創建 UserStocks 工作表
    let sheet = ss.getSheetByName(USER_STOCKS_SHEET_NAME);
    if (!sheet) {
      sheet = initializeUserStocksSheet(ss);
    }
    
    // 準備測試數據
    const testData = {
      userId: 'test-user-' + Date.now(),
      stock: {
        symbol: '2330',
        name: '台積電',
        price: 500,
        change: 10,
        volume: '1000000',
        chips: 'institutional',
        buySellRatio: '1.5'
      }
    };
    
    // 呼叫 saveOrUpdateStock
    const result = saveOrUpdateStock(sheet, testData);
    
    Logger.log('測試成功！結果: ' + JSON.stringify(result));
    return result;
    
  } catch (error) {
    Logger.log('測試失敗: ' + error.toString());
    Logger.log('錯誤堆疊: ' + (error.stack || '無堆疊資訊'));
    throw error;
  }
}

/**
 * 處理 Gemini API 報告請求
 * API Key 存儲在 Script Properties 中，永遠不會暴露給客戶端
 * 
 * 設置步驟：
 * 1. 前往 Google Apps Script 編輯器
 * 2. 點擊「專案設定」（齒輪圖標）
 * 3. 找到「指令碼內容」區塊
 * 4. 點擊「新增指令碼內容」
 * 5. 添加：屬性鍵: GEMINI_API_KEY，屬性值: 您的 Gemini API Key
 * 6. 點擊「儲存指令碼內容」
 */
function handleGeminiReport(requestData) {
  try {
    // 從 Script Properties 獲取 API Key（安全存儲）
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    
    if (!apiKey) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: 'Gemini API Key 未配置。請在 Script Properties 中設置 GEMINI_API_KEY'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 獲取今天的日期（用於提示詞）
    const today = new Date();
    const todayString = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy年M月d日');
    
    // 構建提示詞
    const prompt = '請提供今日(' + todayString + ')台灣股市的重要資訊和分析，包括：\n' +
      '1. 市場整體表現\n' +
      '2. 重要個股動態\n' +
      '3. 產業趨勢\n' +
      '4. 投資建議\n\n' +
      '**重要**：請使用 Google Search 獲取最新的市場資訊和數據，確保資訊的準確性和時效性。\n' +
      '請以簡潔明瞭的方式呈現，總字數控制在 500 字以內。';
    
    // 調用 Gemini API
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + apiKey;
    
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      tools: [{
        googleSearch: {}
      }]
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      Logger.log('Gemini API 錯誤: ' + responseCode + ' - ' + responseText);
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: 'Gemini API 調用失敗: ' + responseCode
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    const responseData = JSON.parse(responseText);
    
    // 提取內容
    let content = '';
    if (responseData.candidates && responseData.candidates.length > 0) {
      const candidate = responseData.candidates[0];
      if (candidate.content && candidate.content.parts) {
        content = candidate.content.parts.map(function(part) {
          return part.text || '';
        }).join('');
      }
    }
    
    if (!content) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: 'API 回應格式錯誤：未返回有效文字內容'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 處理 grounding metadata（引用來源）
    if (responseData.groundingMetadata && responseData.groundingMetadata.groundingChunks) {
      const sources = [];
      responseData.groundingMetadata.groundingChunks.forEach(function(chunk) {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            uri: chunk.web.uri,
            title: chunk.web.title || ''
          });
        }
      });
      
      // 去重並限制數量
      const uniqueSources = [];
      const seenUris = {};
      for (var i = 0; i < sources.length && uniqueSources.length < 3; i++) {
        if (!seenUris[sources[i].uri]) {
          seenUris[sources[i].uri] = true;
          uniqueSources.push(sources[i]);
        }
      }
      
      if (uniqueSources.length > 0) {
        content += '\n\n📚 資料來源（Grounding Metadata）：';
        uniqueSources.forEach(function(source, index) {
          if (source.title) {
            content += '\n' + (index + 1) + '. ' + source.title + '\n   ' + source.uri;
          } else {
            content += '\n' + (index + 1) + '. ' + source.uri;
          }
        });
      }
    }
    
    // 確保內容不超過 500 字
    if (content.length > 500) {
      content = content.substring(0, 500) + '...';
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        content: content
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('handleGeminiReport 錯誤: ' + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: '獲取 AI 報告失敗: ' + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

