import type { Stock } from '../types/stock';

/**
 * FinMind API 服務
 * 
 * 提供台股即時報價功能，使用 FinMind API 獲取股票價格資訊
 */

/**
 * FinMind API 響應格式（taiwan_stock_tick_snapshot）
 */
interface FinMindQuoteResponse {
  msg: string;
  status: number;
  data: Array<{
    stock_id: string;
    deal_price: number;
    change: number;
    change_percent: number;
    volume: number;
    high: number;
    low: number;
    open: number;
    close: number;
    [key: string]: unknown;
  }>;
}

/**
 * FinMind API 使用資訊響應格式
 */
export interface FinMindUsageInfo {
  user_count: number; // 使用次數
  api_request_limit: number; // API 使用上限
  [key: string]: unknown;
}

/**
 * 獲取單一台股即時報價
 * 
 * @param symbol 股票代碼（如 '2330'）
 * @returns 股票資料，如果失敗則返回 null
 */
export async function getStockQuote(symbol: string): Promise<Stock | null> {
  const apiKey = import.meta.env.VITE_FINMIND_API_KEY;
  
  if (!apiKey) {
    console.warn('FinMind API Key 未配置');
    return null;
  }

  try {
    const url = new URL('https://api.finmindtrade.com/api/v4/taiwan_stock_tick_snapshot');
    url.searchParams.set('data_id', symbol);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // 處理權限錯誤（非贊助會員）
      if (response.status === 401 || response.status === 403) {
        console.warn(`FinMind API 權限錯誤: 可能需要贊助會員才能使用即時資訊功能`);
        return null;
      }
      
      // 處理速率限制
      if (response.status === 429) {
        console.warn('FinMind API 速率限制，請稍後再試');
        return null;
      }

      console.warn(`FinMind API 請求失敗: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as FinMindQuoteResponse;

    // 檢查響應狀態
    if (data.status !== 200 || !data.data || data.data.length === 0) {
      console.warn(`FinMind API 返回錯誤: ${data.msg || '未知錯誤'}`);
      return null;
    }

    const quote = data.data[0];

    // 轉換為 Stock 格式
    return {
      symbol: quote.stock_id,
      name: quote.stock_id, // FinMind 可能不包含名稱，使用代碼作為 fallback
      price: quote.deal_price || quote.close || 0,
      change: quote.change_percent || ((quote.deal_price - quote.close) / quote.close) * 100 || 0,
      volume: quote.volume || 0,
      // 其他欄位保持 undefined，由調用方補充
    };
  } catch (error) {
    console.error(`獲取股票 ${symbol} 報價失敗:`, error);
    return null;
  }
}

/**
 * 批量獲取多個台股報價
 * 
 * @param symbols 股票代碼陣列
 * @returns Map<symbol, Stock>，只包含成功獲取的股票
 */
export async function getStockQuotes(symbols: string[]): Promise<Map<string, Stock>> {
  const apiKey = import.meta.env.VITE_FINMIND_API_KEY;
  
  if (!apiKey) {
    console.warn('FinMind API Key 未配置');
    return new Map();
  }

  // 去重
  const uniqueSymbols = Array.from(new Set(symbols));
  
  if (uniqueSymbols.length === 0) {
    return new Map();
  }

  // 由於 FinMind API 的批量查詢在 CORS 預檢階段可能失敗（OPTIONS 返回 400），
  // 我們直接使用並行單一查詢，這樣更可靠且不會觸發 CORS 預檢問題
  // 如果只有一個股票，直接使用單一查詢
  if (uniqueSymbols.length === 1) {
    const stock = await getStockQuote(uniqueSymbols[0]);
    const result = new Map<string, Stock>();
    if (stock) {
      result.set(stock.symbol, stock);
    }
    return result;
  }

  // 多個股票時，使用並行單一查詢
  return await getStockQuotesParallel(uniqueSymbols);
}

/**
 * 並行獲取多個股票報價（fallback 方法）
 * 
 * @param symbols 股票代碼陣列
 * @returns Map<symbol, Stock>
 */
async function getStockQuotesParallel(symbols: string[]): Promise<Map<string, Stock>> {
  const results = await Promise.allSettled(
    symbols.map(symbol => getStockQuote(symbol))
  );

  const resultMap = new Map<string, Stock>();
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      resultMap.set(symbols[index], result.value);
    }
  });

  return resultMap;
}

/**
 * 獲取 FinMind API 使用次數資訊
 * 
 * 使用 token 查詢當前 API 使用次數和使用上限
 * 
 * @returns API 使用資訊，包含使用次數和上限，如果失敗則返回 null
 */
export async function getFinMindUsageInfo(): Promise<FinMindUsageInfo | null> {
  const apiKey = import.meta.env.VITE_FINMIND_API_KEY;
  
  if (!apiKey) {
    console.warn('FinMind API Key 未配置');
    return null;
  }

  try {
    const url = 'https://api.web.finmindtrade.com/v2/user_info';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // 處理權限錯誤
      if (response.status === 401 || response.status === 403) {
        console.warn('FinMind API 權限錯誤: 無法查詢使用資訊');
        return null;
      }
      
      // 處理速率限制
      if (response.status === 429) {
        console.warn('FinMind API 速率限制，請稍後再試');
        return null;
      }

      console.warn(`FinMind API 使用資訊請求失敗: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json() as FinMindUsageInfo;

    // 驗證返回數據格式
    if (typeof data.user_count !== 'number' || typeof data.api_request_limit !== 'number') {
      console.warn('FinMind API 返回的數據格式不正確');
      return null;
    }

    return data;
  } catch (error) {
    console.error('獲取 FinMind API 使用資訊失敗:', error);
    return null;
  }
}


