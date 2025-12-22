import type { MarketSentiment } from '../types/stock';

/**
 * Fear and Greed Index 服務
 * 
 * 提供 Fear and Greed Index 功能，優先使用 CNN API，fallback 到 Finnhub API
 */

/**
 * CNN Fear and Greed Index 響應格式
 */
interface CNNFearGreedIndexResponse {
  fear_and_greed_historical?: {
    data?: Array<{
      x: number; // Unix timestamp in milliseconds
      y: number; // Fear and Greed Index value (0-100)
    }>;
  };
  [key: string]: unknown;
}

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
 * 從 CNN API 獲取 Fear and Greed Index
 * 
 * @returns 市場情緒數據，如果失敗則返回 null
 */
async function getFearGreedIndexFromCNN(): Promise<MarketSentiment | null> {
  try {
    const response = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // 注意：瀏覽器會自動設置 User-Agent，無法手動設置
    });

    if (!response.ok) {
      if (response.status === 418) {
        // I'm a teapot - bot detection
        console.warn('CNN API 檢測到 bot，嘗試使用其他方法');
        return null;
      }
      console.warn(`CNN API 請求失敗: ${response.status} ${response.statusText}`);
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('CNN API 返回非 JSON 響應:', contentType);
      return null;
    }

    let data: CNNFearGreedIndexResponse;
    try {
      data = (await response.json()) as CNNFearGreedIndexResponse;
    } catch (jsonError) {
      console.error('解析 CNN API 響應失敗:', jsonError);
      return null;
    }

    // 從歷史數據中獲取最新的指數值
    if (data.fear_and_greed_historical?.data && data.fear_and_greed_historical.data.length > 0) {
      // 獲取最後一個數據點（最新的）
      const latestData = data.fear_and_greed_historical.data[data.fear_and_greed_historical.data.length - 1];
      const index = latestData.y;

      // 確保指數在 0-100 範圍內，並四捨五入為整數
      const normalizedIndex = Math.round(Math.max(0, Math.min(100, index)));

      // 計算情緒等級和顏色
      const { level, color } = calculateSentimentLevel(normalizedIndex);

      return {
        level,
        index: normalizedIndex,
        color,
      };
    }

    console.warn('CNN API 響應格式不符合預期: 缺少 fear_and_greed_historical.data');
    return null;
  } catch (error) {
    console.error('從 CNN API 獲取 Fear and Greed Index 失敗:', error);
    return null;
  }
}

/**
 * 從 Finnhub API 獲取 Fear and Greed Index（fallback）
 * 
 * @returns 市場情緒數據，如果失敗則返回 null
 */
async function getFearGreedIndexFromFinnhub(): Promise<MarketSentiment | null> {
  const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
  
  if (!apiKey) {
    return null;
  }

  try {
    const url = new URL('https://finnhub.io/api/v1/forex/fear-greed');
    url.searchParams.set('token', apiKey);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      
      if (response.status === 401 || response.status === 403) {
        return null;
      }

      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null;
    }

    let data: FearGreedIndexResponse;
    try {
      data = (await response.json()) as FearGreedIndexResponse;
    } catch (jsonError) {
      return null;
    }

    let index: number;
    
    if (typeof data.value === 'number') {
      index = data.value;
    } else if (typeof data.fearGreedIndex === 'number') {
      index = data.fearGreedIndex;
    } else if (typeof data.index === 'number') {
      index = data.index;
    } else {
      return null;
    }

    // 確保指數在 0-100 範圍內，並四捨五入為整數
    const normalizedIndex = Math.round(Math.max(0, Math.min(100, index)));
    const { level, color } = calculateSentimentLevel(normalizedIndex);

    return {
      level,
      index: normalizedIndex,
      color,
    };
  } catch (error) {
    return null;
  }
}

/**
 * 獲取 Fear and Greed Index
 * 優先使用 CNN API，如果失敗則 fallback 到 Finnhub API
 * 
 * @returns 市場情緒數據，如果失敗則返回 null
 */
export async function getFearGreedIndex(): Promise<MarketSentiment | null> {
  // 優先嘗試 CNN API
  const cnnResult = await getFearGreedIndexFromCNN();
  if (cnnResult) {
    if (import.meta.env.DEV) {
      console.log('成功從 CNN API 獲取 Fear and Greed Index:', cnnResult);
    }
    return cnnResult;
  }

  // 如果 CNN API 失敗，嘗試 Finnhub API
  const finnhubResult = await getFearGreedIndexFromFinnhub();
  if (finnhubResult) {
    if (import.meta.env.DEV) {
      console.log('成功從 Finnhub API 獲取 Fear and Greed Index:', finnhubResult);
    }
    return finnhubResult;
  }

  // 如果兩個 API 都失敗，返回 null
  console.warn('無法從 CNN 或 Finnhub API 獲取 Fear and Greed Index');
  return null;
}





