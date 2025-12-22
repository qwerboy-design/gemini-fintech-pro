import type { MarketSentiment } from '../types/stock';

/**
 * Finnhub API 服務
 * 
 * 提供 Fear and Greed Index 功能，使用 Finnhub API 獲取市場情緒指數
 */

/**
 * Finnhub Fear and Greed Index 響應格式
 * 注意：需要根據實際 API 響應格式調整
 */
interface FearGreedIndexResponse {
  value?: number;
  timestamp?: number;
  [key: string]: unknown;
}

/**
 * 根據指數值計算情緒等級
 * 
 * @param index 指數值（0-100）
 * @returns 情緒等級和顏色
 */
function calculateSentimentLevel(index: number): {
  level: MarketSentiment['level'];
  color: string;
} {
  if (index <= 20) {
    return { level: 'Extreme Fear', color: '#ef4444' };
  } else if (index <= 40) {
    return { level: 'Fear', color: '#f97316' };
  } else if (index <= 60) {
    return { level: 'Neutral', color: '#eab308' };
  } else if (index <= 80) {
    return { level: 'Greed', color: '#22c55e' };
  } else {
    return { level: 'Extreme Greed', color: '#16a34a' };
  }
}

/**
 * 獲取 Fear and Greed Index
 * 
 * @returns 市場情緒數據，如果失敗則返回 null
 */
export async function getFearGreedIndex(): Promise<MarketSentiment | null> {
  const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
  
  if (!apiKey) {
    console.warn('Finnhub API Key 未配置');
    return null;
  }

  try {
    // 注意：需要確認實際的 Finnhub Fear and Greed Index 端點
    // 這裡使用一個可能的端點格式，可能需要根據實際 API 文檔調整
    const url = new URL('https://finnhub.io/api/v1/forex/fear-greed');
    url.searchParams.set('token', apiKey);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // 如果端點不存在，嘗試其他可能的端點
      if (response.status === 404) {
        console.warn('Finnhub Fear and Greed Index 端點不存在，可能需要使用替代 API');
        return null;
      }
      
      if (response.status === 401 || response.status === 403) {
        console.warn('Finnhub API Key 無效或權限不足');
        return null;
      }

      console.warn(`Finnhub API 請求失敗: ${response.status} ${response.statusText}`);
      return null;
    }

    // 檢查響應 Content-Type，確保是 JSON
    const contentType = response.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      // 響應不是 JSON，可能是 HTML 錯誤頁面
      const text = await response.text();
      console.warn('Finnhub API 返回非 JSON 響應（可能是 HTML 錯誤頁面）:', contentType);
      console.warn('響應預覽:', text.substring(0, 200));
      return null;
    }

    let data: FearGreedIndexResponse;
    try {
      data = (await response.json()) as FearGreedIndexResponse;
    } catch (jsonError) {
      console.error('解析 Finnhub API 響應失敗:', jsonError);
      return null;
    }

    // 提取指數值（需要根據實際 API 響應格式調整）
    let index: number;
    
    if (typeof data.value === 'number') {
      index = data.value;
    } else if (typeof data.fearGreedIndex === 'number') {
      index = data.fearGreedIndex;
    } else if (typeof data.index === 'number') {
      index = data.index;
    } else {
      // 如果響應格式不符合預期，嘗試從其他欄位提取
      console.warn('Finnhub API 響應格式不符合預期:', data);
      return null;
    }

    // 確保指數在 0-100 範圍內
    index = Math.max(0, Math.min(100, index));

    // 計算情緒等級和顏色
    const { level, color } = calculateSentimentLevel(index);

    return {
      level,
      index,
      color,
    };
  } catch (error) {
    console.error('獲取 Fear and Greed Index 失敗:', error);
    return null;
  }
}





