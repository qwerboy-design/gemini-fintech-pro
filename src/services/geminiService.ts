import { GoogleGenAI } from '@google/genai';

/**
 * Gemini API 服務
 * 
 * 提供 AI 智能日報功能，使用 Google Gemini API 生成股市分析報告
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

  // 檢查 API Key
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key 未配置。請在環境變數中設置 VITE_GEMINI_API_KEY');
  }

  try {
    // 初始化 Gemini API 客戶端
    const genAI = new GoogleGenAI({ apiKey });

    // 獲取今天的日期（用於提示詞）
    const today = new Date();
    const todayString = today.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // 構建提示詞（包含今天的日期）
    const prompt = `請提供今日(${todayString})台灣股市的重要資訊和分析，包括：
1. 市場整體表現
2. 重要個股動態
3. 產業趨勢
4. 投資建議

請以簡潔明瞭的方式呈現，總字數控制在 500 字以內。`;

    // 配置 Google Search 工具（用於獲取即時資訊）
    const config = {
      tools: [
        {
          googleSearch: {},
        },
      ],
    };

    // 呼叫 API（設置超時）
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('API 呼叫超時')), 30000); // 30 秒超時
    });

    const apiPromise = genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config,
    });
    const response = await Promise.race([apiPromise, timeoutPromise]);

    // 提取回應內容
    let content = response.text;

    // 檢查內容是否存在
    if (!content || typeof content !== 'string') {
      throw new Error('API 回應格式錯誤：未返回有效文字內容');
    }

    // 確保內容不超過 500 字
    if (content.length > 500) {
      content = content.substring(0, 500) + '...';
    }

    // 保存到快取
    saveCachedReport(content);

    return content;
  } catch (error) {
    if (error instanceof Error) {
      // 處理特定錯誤
      if (error.message.includes('API_KEY')) {
        throw new Error('Gemini API Key 無效，請檢查環境變數設置');
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
