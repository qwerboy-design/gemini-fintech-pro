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
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getGeminiReport',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP 錯誤: ${response.status}`);
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

