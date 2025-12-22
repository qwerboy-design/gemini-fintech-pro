/**
 * Google Apps Script 服務
 * 
 * 用於與 Google Apps Script Web App 通信，將數據寫入 Google Sheets
 * 
 * [重要] CORS 處理技巧
 * 
 * 使用 text/plain 作為 Content-Type 可以避開 CORS 預檢請求（OPTIONS），
 * 這對於 Google Apps Script 特別有效，因為它不需要手動設置 CORS headers。
 * 
 * 雖然 Content-Type 是 text/plain，但 body 仍然是 JSON 字符串，
 * Google Apps Script 可以正常解析 JSON.parse()。
 */

/**
 * 登入請求數據
 */
export interface LoginRequest {
  action: 'login';
  userId: string;
  timestamp: string;
}

/**
 * 股票數據
 */
export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume?: number;
  chips?: number;
  buySellRatio?: number;
}

/**
 * 儲存股票請求數據
 */
export interface SaveStockRequest {
  action: 'saveStock';
  userId: string;
  stock: StockData;
}

/**
 * 刪除股票請求數據
 */
export interface DeleteStockRequest {
  action: 'deleteStock';
  userId: string;
  stockSymbol: string;
}

/**
 * 獲取用戶股票請求數據
 */
export interface GetUserStocksRequest {
  action: 'getUserStocks';
  userId: string;
}

/**
 * 獲取用戶股票響應數據
 */
export interface GetUserStocksResponse extends GasResponse {
  data?: {
    stocks: StockData[];
  };
}

/**
 * API 響應
 */
export interface GasResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

/**
 * 提交登入資訊到 Google Apps Script
 * 
 * @param url Google Apps Script Web App URL
 * @param userId 用戶 ID
 * @returns API 響應
 */
export async function submitLoginToGAS(
  url: string,
  userId: string
): Promise<GasResponse> {
  try {
    const requestBody = JSON.stringify({
      action: 'login',
      userId,
      timestamp: new Date().toISOString(),
    } as LoginRequest);

    let response: Response | null = null;
    let fetchError: unknown = null;
    
    // 策略 1: 完全不設置 Content-Type header（最簡單的請求）
    try {
      response = await fetch(url, {
        method: 'POST',
        // 不設置任何 headers，讓瀏覽器自動處理，完全避免 CORS 預檢
        body: requestBody,
        mode: 'cors',
      });
      
      // 如果請求成功（沒有拋出異常），檢查響應狀態
      if (response.ok) {
        fetchError = null;
      } else {
        // 如果響應狀態不是 ok，但也不是 CORS 錯誤，直接處理
        // 如果是 CORS 相關錯誤（例如 0 狀態碼），嘗試第二個方法
        if (response.status === 0) {
          // 狀態碼 0 通常表示 CORS 錯誤或網絡錯誤
          fetchError = new Error('CORS error or network error');
          response = null;
        } else {
          // 其他 HTTP 錯誤，直接處理
          fetchError = null;
        }
      }
    } catch (firstError) {
      fetchError = firstError;
      response = null;
    }
    
    // 如果第一個方法失敗（CORS 錯誤或網絡錯誤），嘗試第二個方法
    if (!response || fetchError) {
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            // 關鍵：使用 text/plain 可以避開預檢請求
            'Content-Type': 'text/plain;charset=utf-8',
          },
          // body 仍然是 JSON 字符串，Google Apps Script 可以正常解析
          body: requestBody,
          mode: 'cors',
        });
        fetchError = null;
      } catch (secondError) {
        // 兩種方法都失敗
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError || '無法獲取響應');
        const secondErrorMessage = secondError instanceof Error ? secondError.message : String(secondError);
        
        if (errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('CORS') ||
            errorMessage.includes('blocked') ||
            secondErrorMessage.includes('Failed to fetch') ||
            secondErrorMessage.includes('CORS') ||
            secondErrorMessage.includes('blocked') ||
            fetchError instanceof TypeError ||
            secondError instanceof TypeError) {
          throw new Error(
            '無法連接到 Google Apps Script（CORS 錯誤）。\n\n' +
            '請確認以下設置：\n' +
            '1. ✓ 前往 Google Apps Script 編輯器\n' +
            '2. ✓ 點擊「部署」→「管理部署」\n' +
            '3. ✓ 編輯部署，設置「具有存取權的使用者」為「任何人」\n' +
            '4. ✓ 點擊「重新部署」\n\n' +
            '詳細說明請參考：CORS_QUICK_FIX.md 或 LOGIN_TROUBLESHOOTING.md'
          );
        }
        throw secondError instanceof Error ? secondError : new Error(String(secondError));
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result as GasResponse;
  } catch (error) {
    console.error('GAS API 錯誤:', error);
    throw error;
  }
}

/**
 * 儲存股票資訊到 Google Apps Script
 * 
 * @param url Google Apps Script Web App URL
 * @param userId 用戶 ID
 * @param stock 股票資料
 * @returns API 響應（不會拋出錯誤，總是返回結果對象）
 */
export async function saveStockToGAS(
  url: string,
  userId: string,
  stock: StockData
): Promise<GasResponse> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:entry',message:'Function entry',data:{url,userId,stockSymbol:stock.symbol},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  try {
    // 參數驗證
    if (!url || !userId || !stock || !stock.symbol) {
      const errorMsg = !url ? 'GAS URL 未配置' : !userId ? '用戶 ID 未提供' : '股票資料不完整';
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:validation',message:'Parameter validation failed',data:{error:errorMsg},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return { success: false, message: errorMsg };
    }

    const requestBody = JSON.stringify({
      action: 'saveStock',
      userId,
      stock,
    } as SaveStockRequest);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:before-fetch',message:'Before fetch request',data:{requestBody},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    let response: Response | null = null;
    let fetchError: unknown = null;

    // 策略 1: 完全不設置 Content-Type header（最簡單的請求）
    try {
      response = await fetch(url, {
        method: 'POST',
        body: requestBody,
        mode: 'cors',
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:fetch-strategy1',message:'Fetch strategy 1 result',data:{ok:response.ok,status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      if (response.ok) {
        fetchError = null;
      } else if (response.status === 0) {
        // 狀態碼 0 通常表示 CORS 錯誤或網絡錯誤
        fetchError = new Error('CORS error or network error');
        response = null;
      }
    } catch (firstError) {
      fetchError = firstError;
      response = null;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:fetch-strategy1-error',message:'Fetch strategy 1 error',data:{error:firstError instanceof Error ? firstError.message : String(firstError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    }

    // 策略 2: 使用 text/plain Content-Type（如果方法 1 失敗）
    if (!response || fetchError) {
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: requestBody,
          mode: 'cors',
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:fetch-strategy2',message:'Fetch strategy 2 result',data:{ok:response.ok,status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion

        fetchError = null;
      } catch (secondError) {
        // 兩種方法都失敗
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError || '無法獲取響應');
        const secondErrorMessage = secondError instanceof Error ? secondError.message : String(secondError);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:fetch-both-failed',message:'Both fetch strategies failed',data:{firstError:errorMessage,secondError:secondErrorMessage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion

        if (errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('CORS') ||
            errorMessage.includes('blocked') ||
            secondErrorMessage.includes('Failed to fetch') || 
            secondErrorMessage.includes('CORS') ||
            secondErrorMessage.includes('blocked') ||
            fetchError instanceof TypeError ||
            secondError instanceof TypeError) {
          return {
            success: false,
            message: '無法連接到 Google Apps Script（CORS 錯誤）。\n\n請確認以下設置：\n1. ✓ 前往 Google Apps Script 編輯器\n2. ✓ 點擊「部署」→「管理部署」\n3. ✓ 編輯部署，設置「具有存取權的使用者」為「任何人」\n4. ✓ 點擊「重新部署」\n\n詳細說明請參考：CORS_QUICK_FIX.md 或 LOGIN_TROUBLESHOOTING.md'
          };
        }
        
        return {
          success: false,
          message: `網絡請求失敗: ${secondErrorMessage || errorMessage || '未知錯誤'}`
        };
      }
    }

    if (!response) {
      return {
        success: false,
        message: '無法獲取伺服器響應'
      };
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:before-response-check',message:'Before response.ok check',data:{ok:response.ok,status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (textError) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:response-text-error',message:'Failed to read response text',data:{error:textError instanceof Error ? textError.message : String(textError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
      }

      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        if (errorText) {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        }
      } catch {
        if (errorText) {
          errorMessage = errorText || errorMessage;
        }
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:response-not-ok',message:'Response not ok',data:{status:response.status,statusText:response.statusText,errorMessage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion

      return {
        success: false,
        message: errorMessage
      };
    }

    const responseText = await response.text();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:before-parse',message:'Before JSON parse',data:{responseTextLength:responseText.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion

    let result: GasResponse;
    try {
      result = JSON.parse(responseText) as GasResponse;
    } catch (parseError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:parse-error',message:'JSON parse error',data:{error:parseError instanceof Error ? parseError.message : String(parseError),responseText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
      // #endregion
      return {
        success: false,
        message: `無法解析伺服器響應: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      };
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:before-success-check',message:'Before success check',data:{success:result.success,message:result.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
    // #endregion

    // 檢查後端返回的 success 標誌
    if (!result.success) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:backend-failure',message:'Backend returned success=false',data:{message:result.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
      // #endregion
      return {
        success: false,
        message: result.message || '寫入失敗：伺服器返回錯誤'
      };
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:success',message:'Function success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
    // #endregion

    return result;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gasService.ts:saveStockToGAS:catch',message:'Unexpected error in catch block',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'P'})}).catch(()=>{});
    // #endregion
    console.error('❌ saveStockToGAS 錯誤:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知錯誤'
    };
  }
}

/**
 * 從 Google Apps Script 刪除股票記錄
 * 
 * @param url Google Apps Script Web App URL
 * @param userId 用戶 ID
 * @param stockSymbol 股票代號
 * @returns API 響應
 */
export async function deleteStockFromGAS(
  url: string,
  userId: string,
  stockSymbol: string
): Promise<GasResponse> {
  try {
    const requestBody = JSON.stringify({
      action: 'deleteStock',
      userId,
      stockSymbol,
    } as DeleteStockRequest);

    let response: Response;

    // 策略 1: 完全不設置 Content-Type header（最簡單的請求）
    try {
      response = await fetch(url, {
        method: 'POST',
        body: requestBody,
        mode: 'cors',
      });
    } catch (firstError) {
      // 策略 2: 使用 text/plain Content-Type（如果方法 1 失敗）
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: requestBody,
        mode: 'cors',
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result as GasResponse;
  } catch (error) {
    console.error('GAS API 錯誤 (deleteStock):', error);
    throw error;
  }
}

/**
 * 從 Google Apps Script 獲取用戶的所有股票記錄（每個股票代號只返回最新一筆）
 * 
 * @param url Google Apps Script Web App URL
 * @param userId 用戶 ID
 * @returns API 響應
 */
export async function getUserStocksFromGAS(
  url: string,
  userId: string
): Promise<GetUserStocksResponse> {
  try {
    const requestBody = JSON.stringify({
      action: 'getUserStocks',
      userId,
    } as GetUserStocksRequest);

    let response: Response;

    // 策略 1: 完全不設置 Content-Type header（最簡單的請求）
    try {
      response = await fetch(url, {
        method: 'POST',
        body: requestBody,
        mode: 'cors',
      });
    } catch (firstError) {
      // 策略 2: 使用 text/plain Content-Type（如果方法 1 失敗）
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: requestBody,
        mode: 'cors',
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    
    let result: GetUserStocksResponse;
    try {
      result = JSON.parse(responseText) as GetUserStocksResponse;
    } catch (parseError) {
      throw new Error('無法解析伺服器響應: ' + String(parseError));
    }
    
    return result;
  } catch (error) {
    console.error('GAS API 錯誤 (getUserStocks):', error);
    throw error;
  }
}

/**
 * 測試 Google Apps Script 連接
 * 
 * @param url Google Apps Script Web App URL
 * @returns 是否連接成功
 */
export async function testGASConnection(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'GET',
    });

    return response.ok;
  } catch (error) {
    console.error('GAS 連接測試失敗:', error);
    return false;
  }
}









