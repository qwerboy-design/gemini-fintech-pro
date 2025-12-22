import type { Stock } from '../types/stock';

/**
 * FinMind API 服務
 * 
 * 提供台股即時報價功能，使用 FinMind API 獲取股票價格資訊
 */

/**
 * FinMind API 響應格式（TaiwanStockPrice - 日線資料）
 * 注意：此端點不需要贊助會員，但提供的是日線資料而非即時報價
 */
interface FinMindQuoteResponse {
  msg: string;
  status: number;
  data: Array<{
    stock_id: string;
    date: string; // 日期
    close: number; // 收盤價
    open: number; // 開盤價
    high: number; // 最高價
    low: number; // 最低價
    volume: number; // 成交量
    Trading_Volume?: number; // 交易量（備用）
    Trading_money?: number; // 交易金額
    spread?: number; // 價差
    Trading_turnover?: number; // 成交筆數
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
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finmindService.ts:47',message:'getStockQuote called',data:{symbol,hasApiKey:!!apiKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  if (!apiKey) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finmindService.ts:52',message:'API Key not configured',data:{symbol},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    console.warn('FinMind API Key 未配置');
    return null;
  }

  try {
    // 使用 TaiwanStockPrice 端點（日線資料，不需要贊助會員）
    // 端點：/api/v4/data，參數：dataset=TaiwanStockPrice, data_id=股票代碼, start_date=日期
    // 在開發環境使用代理，生產環境直接調用（如果 API 支持 CORS）
    const isDev = import.meta.env.DEV;
    const baseUrl = isDev 
      ? '/api/finmind/api/v4/data'  // 開發環境使用代理
      : 'https://api.finmindtrade.com/api/v4/data';  // 生產環境直接調用
    
    const url = new URL(baseUrl, isDev ? window.location.origin : undefined);
    const today = new Date().toISOString().split('T')[0]; // 格式：YYYY-MM-DD
    
    url.searchParams.set('dataset', 'TaiwanStockPrice');
    url.searchParams.set('data_id', symbol);
    url.searchParams.set('start_date', today);
    url.searchParams.set('end_date', today);
    url.searchParams.set('token', apiKey); // token 作為查詢參數（可選，但建議提供以提高請求上限）

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finmindService.ts:66',message:'Fetching stock quote',data:{symbol,url:url.toString(),isDev},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finmindService.ts:75',message:'Fetch response received',data:{symbol,status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      // 處理權限錯誤（非贊助會員）
      if (response.status === 401 || response.status === 403) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finmindService.ts:81',message:'API permission error',data:{symbol,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.warn(`FinMind API 權限錯誤: 可能需要贊助會員才能使用即時資訊功能`);
        return null;
      }
      
      // 處理速率限制（429 Too Many Requests）
      if (response.status === 429) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finmindService.ts:87',message:'API rate limit',data:{symbol,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.warn('FinMind API 速率限制（429），請稍後再試');
        // 拋出錯誤以便上層處理重試
        throw new Error('API rate limit 429');
      }
      
      // 處理 IP 封鎖（402 Payment Required）
      if (response.status === 402) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finmindService.ts:402',message:'API IP blocked',data:{symbol,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.warn('FinMind API IP 被封鎖（402），請求過於頻繁');
        // 拋出錯誤以便上層處理重試
        throw new Error('API IP blocked 402');
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finmindService.ts:92',message:'API request failed',data:{symbol,status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.warn(`FinMind API 請求失敗: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as FinMindQuoteResponse;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finmindService.ts:97',message:'API response parsed',data:{symbol,status:data.status,msg:data.msg,dataLength:data.data?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // 檢查響應狀態
    if (data.status !== 200 || !data.data || data.data.length === 0) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finmindService.ts:102',message:'API response error',data:{symbol,status:data.status,msg:data.msg,dataLength:data.data?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.warn(`FinMind API 返回錯誤: ${data.msg || '未知錯誤'}`);
      return null;
    }

    // 獲取最新的資料（通常是陣列中的最後一筆，因為按日期排序）
    const quotes = data.data;
    if (quotes.length === 0) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finmindService.ts:109',message:'No quotes returned',data:{symbol},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.warn(`FinMind API 未返回 ${symbol} 的資料`);
      return null;
    }
    
    // 取最後一筆（最新的資料）
    const quote = quotes[quotes.length - 1];

    // 轉換為 Stock 格式
    // TaiwanStockPrice 返回的字段：close（收盤價）、open（開盤價）、volume（成交量）
    const price = typeof quote.close === 'number' ? quote.close : 0;
    const open = typeof quote.open === 'number' ? quote.open : 0;
    const volume = typeof quote.volume === 'number' ? quote.volume : (typeof quote.Trading_Volume === 'number' ? quote.Trading_Volume : 0);
    
    // 計算漲跌幅：((收盤價 - 開盤價) / 開盤價) * 100
    const change = open > 0 ? ((price - open) / open) * 100 : 0;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finmindService.ts:120',message:'Stock quote parsed successfully',data:{symbol,price,change,volume},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    return {
      symbol: quote.stock_id,
      name: quote.stock_id, // FinMind 可能不包含名稱，使用代碼作為 fallback
      price: price, // 使用 close 作為價格
      change: change, // 計算漲跌幅（百分比）
      volume: volume, // 成交量
      // 其他欄位保持 undefined，由調用方補充
    };
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finmindService.ts:133',message:'getStockQuote error',data:{symbol,error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
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

  // 多個股票時，使用批次處理（避免觸發 API 402 錯誤）
  return await getStockQuotesParallel(uniqueSymbols);
}

/**
 * 批次處理延遲函數
 * 
 * @param ms 延遲毫秒數
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 批次獲取多個股票報價（優化版本，避免觸發 API 402 錯誤）
 * 
 * 策略：
 * 1. 將請求分成小批次（每批 5 個股票）
 * 2. 批次之間添加延遲（500ms）
 * 3. 批次內並行請求，但限制並發數量
 * 4. 處理 402 錯誤並實現退避策略
 * 
 * @param symbols 股票代碼陣列
 * @returns Map<symbol, Stock>
 */
async function getStockQuotesParallel(symbols: string[]): Promise<Map<string, Stock>> {
  const BATCH_SIZE = 5; // 每批處理 5 個股票
  const BATCH_DELAY = 500; // 批次之間延遲 500ms
  const MAX_RETRIES = 2; // 最大重試次數
  const RETRY_DELAY = 2000; // 重試延遲 2 秒
  
  const resultMap = new Map<string, Stock>();
  
  // 將股票代碼分成批次
  const batches: string[][] = [];
  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    batches.push(symbols.slice(i, i + BATCH_SIZE));
  }
  
  if (import.meta.env.DEV) {
    console.log(`將 ${symbols.length} 個股票分成 ${batches.length} 批次處理，每批 ${BATCH_SIZE} 個`);
  }
  
  // 逐批次處理
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    // 批次內並行請求
    const batchResults = await Promise.allSettled(
      batch.map(async (symbol) => {
        let retries = 0;
        let lastError: Error | null = null;
        
        // 重試邏輯
        while (retries <= MAX_RETRIES) {
          try {
            const stock = await getStockQuote(symbol);
            if (stock) {
              return { symbol, stock };
            }
            // 如果返回 null，可能是 API 錯誤，但不拋出異常
            return null;
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            
            // 檢查是否是 402 錯誤（Payment Required / IP Blocked）
            if (error instanceof Error && error.message.includes('402')) {
              if (retries < MAX_RETRIES) {
                const delayMs = RETRY_DELAY * (retries + 1); // 指數退避
                if (import.meta.env.DEV) {
                  console.warn(`股票 ${symbol} 請求被限制（402），${delayMs}ms 後重試 (${retries + 1}/${MAX_RETRIES})`);
                }
                await delay(delayMs);
                retries++;
                continue;
              } else {
                if (import.meta.env.DEV) {
                  console.error(`股票 ${symbol} 請求失敗：已達最大重試次數，可能 IP 被封鎖`);
                }
                return null;
              }
            }
            
            // 其他錯誤，不重試
            if (import.meta.env.DEV) {
              console.warn(`股票 ${symbol} 請求失敗:`, lastError.message);
            }
            return null;
          }
        }
        
        return null;
      })
    );
    
    // 處理批次結果
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const { symbol, stock } = result.value;
        resultMap.set(symbol, stock);
      }
    });
    
    // 批次之間添加延遲（最後一批不需要延遲）
    if (batchIndex < batches.length - 1) {
      await delay(BATCH_DELAY);
    }
    
    if (import.meta.env.DEV) {
      console.log(`批次 ${batchIndex + 1}/${batches.length} 完成，已獲取 ${resultMap.size}/${symbols.length} 個股票價格`);
    }
  }
  
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




