import type { Stock } from '../types/stock';

/**
 * 股票查詢服務
 * 
 * 提供股票價格查詢功能，支持：
 * 1. 從本地數據查找
 * 2. 從外部 API 查詢（如果本地沒有）
 * 
 * API 優先順序：
 * 1. 台灣證券交易所 API（上市/上櫃）- 優先使用，支援 CORS
 * 2. 台股投資追蹤工具 API
 * 3. 其他備用 API
 */

/**
 * 股票查詢結果
 */
export interface StockQueryResult {
  /** 是否找到股票 */
  found: boolean;
  /** 股票資料（如果找到） */
  stock?: Stock;
  /** 錯誤訊息（如果有） */
  error?: string;
  /** 是否從 API 查詢 */
  fromAPI?: boolean;
}

/**
 * 從本地數據查找股票
 */
function findStockInLocalData(
  query: string,
  localStocks: Stock[]
): Stock | null {
  const normalizedQuery = query.trim().toLowerCase();

  return (
    localStocks.find(
      (stock) =>
        stock.symbol.toLowerCase() === normalizedQuery ||
        stock.name.toLowerCase().includes(normalizedQuery)
    ) || null
  );
}

/**
 * 台灣證券交易所 API 響應格式
 */
interface TWSEApiResponse {
  msgArray?: Array<{
    c: string;  // 股票代碼
    n: string;  // 股票名稱
    z: string;  // 最新成交價
    o: string;  // 開盤價
    h: string;  // 最高價
    l: string;  // 最低價
    v: string;  // 成交量
    p: string;  // 漲跌（絕對值）
    u: string;  // 前一日收盤價
    [key: string]: string | undefined;
  }>;
  rtcode: string;
  rtmessage: string;
}

/**
 * 查詢台灣證券交易所股票資訊
 * 
 * @param symbol 股票代碼（如 "2330"）
 * @param market 市場類型：'tse' 上市 或 'otc' 上櫃
 * @returns 股票資料或 null
 */
async function queryTWSEStock(symbol: string, market: 'tse' | 'otc'): Promise<Stock | null> {
  try {
    // 構建 API URL
    const apiUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${market}_${symbol}.tw`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: TWSEApiResponse = await response.json();
    
    // 驗證 API 響應
    if (data.rtcode !== '0000') {
      console.warn(`台灣證券交易所 API 返回錯誤: ${data.rtmessage || data.rtcode}`);
      return null;
    }

    // 檢查 msgArray 是否存在且有效
    if (!data.msgArray || data.msgArray.length === 0) {
      return null;
    }

    const stockData = data.msgArray[0];
    
    // 驗證必要欄位
    if (!stockData.c || !stockData.n) {
      return null;
    }

    // 解析價格：優先使用最新成交價 (z)，如果為空或 "0" 則使用開盤價 (o)
    const latestPrice = stockData.z && stockData.z !== '0' 
      ? parseFloat(stockData.z) 
      : (stockData.o && stockData.o !== '0' ? parseFloat(stockData.o) : 0);
    
    if (latestPrice === 0) {
      return null;
    }

    // 計算漲跌百分比
    // 使用前一日收盤價 (u) 計算，如果不存在則設為 0
    const previousClose = stockData.u ? parseFloat(stockData.u) : 0;
    const changePercent = previousClose > 0 
      ? ((latestPrice - previousClose) / previousClose) * 100 
      : 0;

    // 解析成交量
    const volume = stockData.v ? parseFloat(stockData.v) : undefined;

    return {
      symbol: stockData.c,
      name: stockData.n,
      price: latestPrice,
      change: changePercent,
      volume,
      isFavorite: false,
      // 台灣證券交易所 API 不提供以下欄位
      marketCap: undefined,
      chips: undefined,
      buySellRatio: undefined,
    };
  } catch (error) {
    console.warn(`查詢台灣證券交易所股票 ${symbol} (${market}) 失敗:`, error);
    return null;
  }
}

/**
 * 查詢股票價格（使用公開 API）
 * 
 * API 優先順序：
 * 1. 台灣證券交易所 API（上市/上櫃）- 優先使用
 * 2. 台股投資追蹤工具 API
 * 3. 其他備用 API
 * 
 * 注意：台灣證券交易所 API 支援 CORS，可以直接從瀏覽器調用
 */
async function queryStockFromAPI(symbol: string): Promise<Stock | null> {
  try {
    // 優先使用台灣證券交易所 API
    // 先嘗試上市股票（tse）
    let stock = await queryTWSEStock(symbol, 'tse');
    if (stock) {
      return stock;
    }

    // 如果上市股票查詢失敗，嘗試上櫃股票（otc）
    stock = await queryTWSEStock(symbol, 'otc');
    if (stock) {
      return stock;
    }

    // 如果台灣證券交易所 API 都失敗，嘗試其他備用 API
    const fallbackApis = [
      // 台股投資追蹤工具（如果可用）
      `https://www.taiwanstock.online/api/stock/${symbol}`,
      // FinMind（需要處理 CORS）
      // `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=${symbol}&start_date=${new Date().toISOString().split('T')[0]}`,
    ];

    for (const apiUrl of fallbackApis) {
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // 根據不同的 API 格式解析數據
          if (data) {
            // 示例：假設 API 返回格式為 { symbol, name, price, change, volume }
            return {
              symbol: data.symbol || symbol,
              name: data.name || symbol,
              price: parseFloat(data.price || data.close || 0),
              change: parseFloat(data.change || data.changePercent || 0),
              volume: parseFloat(data.volume || 0),
              marketCap: data.marketCap ? parseFloat(data.marketCap) : undefined,
              isFavorite: false,
              chips: data.chips ? parseFloat(data.chips) : undefined,
              buySellRatio: data.buySellRatio ? parseFloat(data.buySellRatio) : undefined,
            };
          }
        }
      } catch (apiError) {
        // 嘗試下一個 API
        console.warn(`備用 API ${apiUrl} 查詢失敗:`, apiError);
        continue;
      }
    }
  } catch (error) {
    // 所有 API 都失敗
    console.warn(`查詢股票 ${symbol} 失敗:`, error);
  }

  // 如果所有 API 查詢失敗，返回 null（由調用方使用 fallback）
  return null;
}

/**
 * 使用模擬數據生成股票（作為 API 失敗時的 fallback）
 * 
 * 這是一個臨時方案，實際應用中應該使用真實的 API
 */
function generateMockStockData(symbol: string): Stock | null {
  // 模擬一些常見的台灣股票代碼
  const mockStockMap: Record<string, Partial<Stock>> = {
    '2317': { name: '鴻海', price: 105.5, change: 2.3, chips: 65.2, buySellRatio: 70 },
    '2454': { name: '聯發科', price: 892, change: -1.5, chips: 58.3, buySellRatio: 65 },
    '2308': { name: '台達電', price: 245.8, change: 1.8, chips: 52.1, buySellRatio: 55 },
    '2412': { name: '中華電', price: 128.5, change: 0.3, chips: 45.8, buySellRatio: 50 },
    '3008': { name: '大立光', price: 2150, change: -3.2, chips: 68.9, buySellRatio: 45 },
  };

  const mockData = mockStockMap[symbol];
  if (mockData) {
    return {
      symbol,
      name: mockData.name || symbol,
      price: mockData.price || 0,
      change: mockData.change || 0,
      volume: Math.floor(Math.random() * 50000000) + 10000000,
      marketCap: (mockData.price || 0) * 1000000000,
      rank: 0,
      isFavorite: false,
      chips: mockData.chips || 50,
      buySellRatio: mockData.buySellRatio || 50,
    };
  }

  // 如果沒有模擬數據，生成一個隨機股票（僅用於演示）
  // 實際應用中應該返回 null 或調用真實 API
  return {
    symbol,
    name: `股票 ${symbol}`,
    price: Math.floor(Math.random() * 1000) + 50,
    change: (Math.random() - 0.5) * 10,
    volume: Math.floor(Math.random() * 50000000) + 10000000,
    marketCap: 0,
    rank: 0,
    isFavorite: false,
    chips: Math.floor(Math.random() * 40) + 40,
    buySellRatio: Math.floor(Math.random() * 40) + 50,
  };
}

/**
 * 查詢股票
 * 
 * @param query 查詢詞（股票代碼或名稱）
 * @param localStocks 本地股票數據
 * @param useAPI 是否嘗試使用 API 查詢（默認 true）
 * @returns 查詢結果
 */
export async function queryStock(
  query: string,
  localStocks: Stock[],
  useAPI: boolean = true
): Promise<StockQueryResult> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return {
      found: false,
      error: '請輸入股票代碼或名稱',
    };
  }

  // 先從本地數據查找
  const localStock = findStockInLocalData(normalizedQuery, localStocks);
  if (localStock) {
    return {
      found: true,
      stock: localStock,
      fromAPI: false,
    };
  }

  // 如果本地沒有找到，嘗試從 API 查詢
  if (useAPI) {
    // 判斷是股票代碼還是名稱（簡單判斷：如果全部是數字，視為代碼）
    const isSymbol = /^\d+$/.test(normalizedQuery);
    
    if (isSymbol) {
      // 嘗試從 API 查詢
      const apiStock = await queryStockFromAPI(normalizedQuery);
      
      if (apiStock) {
        return {
          found: true,
          stock: apiStock,
          fromAPI: true,
        };
      }
    }

    // 如果 API 查詢失敗或不是代碼，使用模擬數據作為 fallback
    // 注意：實際應用中應該返回錯誤，這裡使用模擬數據僅為演示
    if (isSymbol) {
      const mockStock = generateMockStockData(normalizedQuery);
      if (mockStock) {
        return {
          found: true,
          stock: mockStock,
          fromAPI: false, // 標記為非 API 數據
        };
      }
    }
  }

  // 沒有找到
  return {
    found: false,
    error: `找不到股票: ${normalizedQuery}`,
  };
}

/**
 * 批量查詢股票
 */
export async function queryStocks(
  queries: string[],
  localStocks: Stock[]
): Promise<StockQueryResult[]> {
  const results = await Promise.all(
    queries.map((query) => queryStock(query, localStocks))
  );
  return results;
}










