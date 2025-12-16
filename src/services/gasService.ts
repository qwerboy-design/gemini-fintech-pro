/**
 * Google Apps Script 服務
 * 
 * 用於與 Google Apps Script Web App 通信，將數據寫入 Google Sheets
 * 
 * ⚠️ 重要：CORS 處理技巧
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
    // 使用 text/plain 避免 CORS 預檢請求（OPTIONS）
    // 這對於 Google Apps Script 特別有效
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        // 關鍵：使用 text/plain 可以避開預檢請求
        'Content-Type': 'text/plain;charset=utf-8',
      },
      // body 仍然是 JSON 字符串，Google Apps Script 可以正常解析
      body: JSON.stringify({
        action: 'login',
        userId,
        timestamp: new Date().toISOString(),
      } as LoginRequest),
    });

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
