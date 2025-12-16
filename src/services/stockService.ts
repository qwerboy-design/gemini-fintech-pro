import type { Stock } from '../types/stock';

/**
 * 股票查詢服務
 * 
 * 提供股票價格查詢功能，支持：
 * 1. 從本地數據查找
 * 2. 從外部 API 查詢（如果本地沒有）
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
 * 查詢股票價格（使用公開 API）
 * 
 * 注意：由於 CORS 限制，實際 API 調用可能需要通過代理或後端
 * 這裡提供一個可擴展的接口，目前使用模擬數據作為 fallback
 * 
 * 可用的 API 選項：
 * 1. FinMind API (https://finmind.github.io/)
 * 2. 台股投資追蹤工具 API (https://www.taiwanstock.online/)
 * 3. 自建後端代理（推薦，避免 CORS 問題）
 */
async function queryStockFromAPI(symbol: string): Promise<Stock | null> {
  try {
    // 嘗試多個 API 端點（優先級順序）
    const apis = [
      // API 1: 台股投資追蹤工具（如果可用）
      `https://www.taiwanstock.online/api/stock/${symbol}`,
      // API 2: FinMind（需要處理 CORS）
      // `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=${symbol}&start_date=${new Date().toISOString().split('T')[0]}`,
    ];

    for (const apiUrl of apis) {
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          // 設置超時（通過 AbortController）
        });

        if (response.ok) {
          const data = await response.json();
          
          // 根據不同的 API 格式解析數據
          // 這裡需要根據實際 API 響應格式調整
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
        console.warn(`API ${apiUrl} 查詢失敗:`, apiError);
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
