/**
 * Google Apps Script 服務
 * 
 * 用於與 Google Apps Script Web App 通信，將數據寫入 Google Sheets
 */

/**
 * 登入請求數據
 */
export interface LoginRequest {
  action: 'login';
  userId: string;
  email: string;
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
 * @param email 電子郵件
 * @returns API 響應
 */
export async function submitLoginToGAS(
  url: string,
  userId: string,
  email: string
): Promise<GasResponse> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'login',
        userId,
        email,
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
