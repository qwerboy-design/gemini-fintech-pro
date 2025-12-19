/**
 * Gemini API 服務
 * 
 * 提供 AI 智能日報功能，通過 Google Apps Script 後端調用 Gemini API
 * API Key 存儲在後端，永遠不會暴露給客戶端，符合安全最佳實踐
 */

const CACHE_KEY = 'gemini-fintech-ai-daily-report';

/**
 * 快取資料格式
 */
interface CachedReport {
  content: string;
  date: string; // YYYY-MM-DD
}

/**
 * 獲取今天的日期字串（YYYY-MM-DD）
 */
function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * 從 localStorage 載入快取的報告
 */
function loadCachedReport(): CachedReport | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as CachedReport;
      // 檢查是否為今天的報告
      if (parsed.date === getTodayDateString()) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('載入快取報告失敗:', error);
  }
  return null;
}

/**
 * 保存報告到 localStorage
 */
function saveCachedReport(content: string): void {
  try {
    const report: CachedReport = {
      content,
      date: getTodayDateString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(report));
  } catch (error) {
    console.error('保存快取報告失敗:', error);
  }
}

/**
 * 獲取每日股市報告
 * 
 * @returns 報告內容（500 字以內）
 * @throws 如果 API Key 缺失或 API 呼叫失敗
 */
export async function getDailyMarketReport(): Promise<string> {
  // 檢查快取
  const cached = loadCachedReport();
  if (cached) {
    return cached.content;
  }

  // 從環境變數獲取 GAS URL（不再需要 VITE_GEMINI_API_KEY）
  const gasUrl = import.meta.env.VITE_GAS_URL;
  if (!gasUrl) {
    throw new Error('Google Apps Script URL 未配置。請在環境變數中設置 VITE_GAS_URL');
  }

  try {
    // 調用 GAS 後端（API Key 隱藏在後端）
    // 嘗試多種方法避免 CORS 預檢請求
    const requestBody = JSON.stringify({
      action: 'getGeminiReport',
      timestamp: new Date().toISOString(),
    });

    let response: Response | null = null;
    let fetchError: unknown = null;

    // 策略 1: 使用 text/plain 避免 CORS 預檢請求
    try {
      response = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: requestBody,
      });
    } catch (error) {
      fetchError = error;
      // 策略 2: 完全不設置 Content-Type
      try {
        response = await fetch(gasUrl, {
          method: 'POST',
          body: requestBody,
        });
      } catch (error2) {
        fetchError = error2;
        // 策略 3: 使用標準 JSON
        try {
          response = await fetch(gasUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: requestBody,
          });
        } catch (error3) {
          fetchError = error3;
        }
      }
    }

    // 如果所有方法都失敗
    if (!response) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError || '無法獲取響應');
      if (errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('CORS') ||
          errorMessage.includes('blocked') ||
          fetchError instanceof TypeError) {
        throw new Error(
          '無法連接到 Google Apps Script（CORS 錯誤）。\n\n' +
          '請確認以下設置：\n' +
          '1. ✓ 前往 Google Apps Script 編輯器\n' +
          '2. ✓ 點擊「部署」→「管理部署」\n' +
          '3. ✓ 編輯部署，設置「具有存取權的使用者」為「任何人」\n' +
          '4. ✓ 點擊「重新部署」\n' +
          '5. ✓ 確認已更新 Code.gs 代碼（包含 handleGeminiReport 函數）\n' +
          '6. ✓ 確認已在 Script Properties 中設置 GEMINI_API_KEY\n\n' +
          '詳細說明請參考：GOOGLE_APPS_SCRIPT_SETUP.md'
        );
      }
      throw new Error(`網絡請求失敗: ${errorMessage}`);
    }

    // 檢查響應狀態
    if (!response.ok) {
      const errorText = await response.text().catch(() => '無法讀取錯誤訊息');
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `HTTP 錯誤: ${response.status}` };
      }
      throw new Error(errorData.message || `HTTP 錯誤: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '獲取 AI 報告失敗');
    }

    // 檢查內容是否存在
    if (!data.content || typeof data.content !== 'string') {
      throw new Error('API 回應格式錯誤：未返回有效文字內容');
    }

    // 確保內容不超過 500 字
    let content = data.content;
    if (content.length > 500) {
      content = content.substring(0, 500) + '...';
    }

    // 保存到快取
    saveCachedReport(content);

    return content;
  } catch (error) {
    if (error instanceof Error) {
      // 如果錯誤訊息已經包含詳細說明，直接拋出
      if (error.message.includes('無法連接到 Google Apps Script') || 
          error.message.includes('CORS')) {
        throw error;
      }
      if (error.message.includes('超時')) {
        throw new Error('API 呼叫超時，請稍後再試');
      }
      throw new Error(`獲取 AI 報告失敗: ${error.message}`);
    }
    throw new Error('獲取 AI 報告時發生未知錯誤');
  }
}

/**
 * 清除快取（用於測試或強制刷新）
 */
export function clearReportCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('清除快取失敗:', error);
  }
}


