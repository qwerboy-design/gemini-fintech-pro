import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { MarketSentiment as MarketSentimentComponent } from './components/MarketSentiment';
import { StrategyButtons } from './components/StrategyButtons';
import { StockTable } from './components/StockTable';
import { LoginModal } from './components/LoginModal';
import { AIDailyReport } from './components/AIDailyReport';
import { mockStocks } from './data/mockStocks';
import { queryStock } from './services/stockService';
import { saveStockToGAS, deleteStockFromGAS, getUserStocksFromGAS, type StockData } from './services/gasService';
import { getDailyMarketReport } from './services/geminiService';
import { getStockQuotes } from './services/finmindService';
import { getFearGreedIndex } from './services/finnhubService';
import type { Stock, MarketSentiment } from './types/stock';
import './App.css';

type TabType = '金額排行' | 'AI 智能日報' | '國際盤';
type StrategyType = 'all' | 'bullish' | 'institutional' | 'shortsqueeze' | 'favorites';
type SortType =
  | 'default'
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'change-asc'
  | 'change-desc'
  | 'volume-asc'
  | 'volume-desc';

const FAVORITES_STORAGE_KEY = 'gemini-fintech-favorites';
const SEARCH_HISTORY_STORAGE_KEY = 'gemini-fintech-search-history';
const HIDDEN_STOCKS_STORAGE_KEY = 'gemini-fintech-hidden-stocks';
const MAX_SEARCH_HISTORY = 10;

/**
 * 從 localStorage 載入收藏狀態
 */
function loadFavoritesFromStorage(): Set<string> {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      const favoritesArray = JSON.parse(stored) as string[];
      return new Set(favoritesArray);
    }
  } catch (error) {
    console.error('載入收藏狀態失敗:', error);
  }
  // 如果沒有存儲或載入失敗，使用初始數據中的收藏狀態
  return new Set(mockStocks.filter(s => s.isFavorite).map(s => s.symbol));
}

/**
 * 保存收藏狀態到 localStorage
 */
function saveFavoritesToStorage(favorites: Set<string>) {
  try {
    const favoritesArray = Array.from(favorites);
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritesArray));
  } catch (error) {
    console.error('保存收藏狀態失敗:', error);
  }
}

/**
 * 從 localStorage 載入搜索歷史
 */
function loadSearchHistoryFromStorage(): string[] {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as string[];
    }
  } catch (error) {
    console.error('載入搜索歷史失敗:', error);
  }
  return [];
}

/**
 * 保存搜索歷史到 localStorage
 */
function saveSearchHistoryToStorage(history: string[]) {
  try {
    localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('保存搜索歷史失敗:', error);
  }
}

/**
 * 從 localStorage 載入隱藏的股票列表
 */
function loadHiddenStocksFromStorage(): Set<string> {
  try {
    const stored = localStorage.getItem(HIDDEN_STOCKS_STORAGE_KEY);
    if (stored) {
      const hiddenArray = JSON.parse(stored) as string[];
      return new Set(hiddenArray);
    }
  } catch (error) {
    console.error('載入隱藏股票列表失敗:', error);
  }
  return new Set();
}

/**
 * 保存隱藏的股票列表到 localStorage
 */
function saveHiddenStocksToStorage(hiddenStocks: Set<string>) {
  try {
    const hiddenArray = Array.from(hiddenStocks);
    localStorage.setItem(HIDDEN_STOCKS_STORAGE_KEY, JSON.stringify(hiddenArray));
  } catch (error) {
    console.error('保存隱藏股票列表失敗:', error);
  }
}

function App() {
  // 標籤狀態
  const [activeTab, setActiveTab] = useState<TabType>('金額排行');

  // 策略狀態
  const [activeStrategy, setActiveStrategy] = useState<StrategyType>('all');

  // 收藏狀態（從 localStorage 載入）
  const [favorites, setFavorites] = useState<Set<string>>(() =>
    loadFavoritesFromStorage()
  );

  // 收藏股票即時價格（從 FinMind API 獲取）
  const [favoriteStocksPrices, setFavoriteStocksPrices] = useState<Map<string, Stock>>(new Map());
  const [isLoadingFavoritePrices, setIsLoadingFavoritePrices] = useState(false);

  // 隱藏的股票列表（從 localStorage 載入）
  const [hiddenStocks, setHiddenStocks] = useState<Set<string>>(() =>
    loadHiddenStocksFromStorage()
  );

  // 排序狀態
  const [sortType, setSortType] = useState<SortType>('default');

  // 搜索查詢
  const [searchQuery, setSearchQuery] = useState('');

  // 搜索歷史
  const [searchHistory, setSearchHistory] = useState<string[]>(() =>
    loadSearchHistoryFromStorage()
  );

  // 查詢到的股票（從 API）
  const [queriedStocks, setQueriedStocks] = useState<Stock[]>([]);

  // 從資料庫載入的股票
  const [userStocksFromDB, setUserStocksFromDB] = useState<Stock[]>([]);

  // 搜索載入狀態
  const [isSearching, setIsSearching] = useState(false);

  // 搜索錯誤
  const [searchError, setSearchError] = useState<string | null>(null);

  // 登入狀態
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    // 從 localStorage 讀取登入狀態
    try {
      const stored = localStorage.getItem('gemini-fintech-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // AI 智能日報狀態
  const [aiDailyReport, setAiDailyReport] = useState<string | null>(null);
  const [isLoadingAIReport, setIsLoadingAIReport] = useState(false);
  const [aiReportError, setAiReportError] = useState<string | null>(null);

  // Google Apps Script URL（從環境變數讀取）
  const gasUrl = import.meta.env.VITE_GAS_URL || '';

  // 當收藏狀態改變時，保存到 localStorage
  useEffect(() => {
    saveFavoritesToStorage(favorites);
  }, [favorites]);

  // 當隱藏股票列表改變時，保存到 localStorage
  useEffect(() => {
    saveHiddenStocksToStorage(hiddenStocks);
  }, [hiddenStocks]);

  // 當搜索歷史改變時，保存到 localStorage
  useEffect(() => {
    saveSearchHistoryToStorage(searchHistory);
  }, [searchHistory]);

  // 鍵盤快捷鍵支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K 打開搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // 觸發搜索框打開（通過 Header 組件處理）
        const searchButton = document.querySelector(
          '[title="搜索"]'
        ) as HTMLElement;
        if (searchButton) {
          searchButton.click();
        }
      }
      // ESC 關閉搜索
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  // 添加到搜索歷史
  const addToSearchHistory = (query: string) => {
    if (!query.trim()) return;

    setSearchHistory((prev) => {
      const newHistory = [query, ...prev.filter((item) => item !== query)];
      // 限制歷史記錄數量
      return newHistory.slice(0, MAX_SEARCH_HISTORY);
    });
  };

  // 從搜索歷史移除
  const removeFromSearchHistory = (query: string) => {
    setSearchHistory((prev) => prev.filter((item) => item !== query));
  };

  // Debounce timer ref
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 使用 ref 來追蹤最新的 searchQuery，避免閉包陷阱
  const searchQueryRef = useRef<string>('');

  // 同步更新 ref
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  // 處理搜索查詢改變（只處理輸入變化，不自動觸發搜尋）
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    setSearchError(null);

    // 清除之前的 timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 如果查詢為空，清除查詢結果
    if (!query.trim()) {
      setQueriedStocks([]);
      setIsSearching(false);
      return;
    }

    // 只處理本地過濾，不自動觸發 API 搜尋
    // API 搜尋將由 handleSearchSubmit 按鈕觸發
  };

  // 處理搜尋按鈕點擊或 Enter 鍵觸發
  const handleSearchSubmit = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:handleSearchSubmit:entry',message:'handleSearchSubmit called',data:{query:searchQuery.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    
    const query = searchQuery.trim();
    if (!query) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:handleSearchSubmit:emptyQuery',message:'Query is empty, returning early',timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      return;
    }

    // 清除之前的 timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:handleSearchSubmit:beforeQueryStock',message:'About to call queryStock',data:{query:query,mockStocksLength:mockStocks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      const result = await queryStock(query, mockStocks, true);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:handleSearchSubmit:afterQueryStock',message:'queryStock returned',data:{found:result.found,hasStock:!!result.stock,stockSymbol:result.stock?.symbol,stockName:result.stock?.name,error:result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      if (result.found && result.stock) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:handleSearchSubmit:settingQueriedStocks',message:'Setting queriedStocks',data:{stockSymbol:result.stock.symbol,stockName:result.stock.name,stockKeys:Object.keys(result.stock)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        
        // 添加到查詢結果列表
        setQueriedStocks([result.stock]);
        // 添加到搜索歷史（addToSearchHistory 內部已有去重邏輯）
        addToSearchHistory(query);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:handleSearchSubmit:queriedStocksSet',message:'queriedStocks state updated',timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:handleSearchSubmit:stockNotFound',message:'Stock not found',data:{error:result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        
        setSearchError(result.error || '找不到該股票');
        setQueriedStocks([]);
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:handleSearchSubmit:error',message:'Error in handleSearchSubmit',data:{error:String(error),errorStack:error instanceof Error?error.stack:'no stack'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      
      // 只在開發環境中輸出詳細錯誤
      if (import.meta.env.DEV) {
        console.error('查詢股票失敗:', error);
      }
      setSearchError('查詢失敗，請稍後再試');
      setQueriedStocks([]);
    } finally {
      setIsSearching(false);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:handleSearchSubmit:finally',message:'handleSearchSubmit completed',timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
    }
  };

  // 清理 timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // 從資料庫載入用戶股票
  const loadUserStocksFromDB = async (userId: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:295',message:'loadUserStocksFromDB called',data:{userId:userId,gasUrl:gasUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (!gasUrl) {
      if (import.meta.env.DEV) {
        console.warn('GAS URL 未配置，無法載入用戶股票');
      }
      return;
    }

    try {
      const result = await getUserStocksFromGAS(gasUrl, userId);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:305',message:'getUserStocksFromGAS result',data:{success:result.success,hasData:!!result.data,stocksCount:result.data?.stocks?.length||0,stockSymbols:result.data?.stocks?.map((s:StockData)=>s.symbol)||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (result.success && result.data && result.data.stocks) {
        // 將 StockData 轉換為 Stock 格式
        const stocks: Stock[] = result.data.stocks.map((stockData: StockData) => ({
          symbol: stockData.symbol,
          name: stockData.name,
          price: stockData.price,
          change: stockData.change,
          volume: stockData.volume,
          chips: stockData.chips,
          buySellRatio: stockData.buySellRatio,
          isFavorite: favorites.has(stockData.symbol),
        }));

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:336',message:'About to set userStocksFromDB',data:{stocksCount:stocks.length,stockSymbols:stocks.map(s=>s.symbol),stocksDetails:stocks.map(s=>({symbol:s.symbol,name:s.name}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        setUserStocksFromDB(stocks);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:342',message:'userStocksFromDB state updated',data:{stocksCount:stocks.length,stockSymbols:stocks.map(s=>s.symbol)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        if (import.meta.env.DEV) {
          console.log(`成功載入 ${stocks.length} 筆股票記錄`);
        }
      } else {
        setUserStocksFromDB([]);
        if (import.meta.env.DEV) {
          console.log('沒有找到股票記錄或載入失敗');
        }
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:335',message:'loadUserStocksFromDB error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      console.error('載入用戶股票失敗:', error);
      setUserStocksFromDB([]);
    }
  };

  // 更新收藏股票即時價格（使用 FinMind API）
  const updateFavoriteStocksPrices = useCallback(async () => {
    if (!currentUser || userStocksFromDB.length === 0) {
      return;
    }

    // 獲取收藏股票代碼列表
    const favoriteSymbols = userStocksFromDB
      .filter(stock => favorites.has(stock.symbol))
      .map(stock => stock.symbol);

    if (favoriteSymbols.length === 0) {
      return;
    }

    setIsLoadingFavoritePrices(true);

    try {
      const prices = await getStockQuotes(favoriteSymbols);
      setFavoriteStocksPrices(prices);
      
      if (import.meta.env.DEV) {
        console.log(`成功更新 ${prices.size} 筆收藏股票價格`);
      }
    } catch (error) {
      console.error('更新收藏股票價格失敗:', error);
    } finally {
      setIsLoadingFavoritePrices(false);
    }
  }, [currentUser, userStocksFromDB, favorites]);

  // 更新 Fear and Greed Index（使用 Finnhub API）
  const updateFearGreedIndex = useCallback(async () => {
    try {
      const sentiment = await getFearGreedIndex();
      if (sentiment) {
        setMarketSentiment(sentiment);
        if (import.meta.env.DEV) {
          console.log('Fear and Greed Index 更新成功:', sentiment);
        }
      }
    } catch (error) {
      console.error('更新 Fear and Greed Index 失敗:', error);
      // 保持現有值不變
    }
  }, []);

  // 處理登入成功
  const handleLoginSuccess = async (userId: string) => {
    setCurrentUser(userId);
    // 保存到 localStorage
    try {
      localStorage.setItem('gemini-fintech-user', JSON.stringify(userId));
    } catch (error) {
      console.error('保存用戶資訊失敗:', error);
    }
    setIsLoginModalOpen(false);
    
    // 載入用戶的股票記錄
    await loadUserStocksFromDB(userId);
  };

  // 處理登入/登出點擊
  const handleLoginClick = () => {
    if (currentUser) {
      // 登出
      setCurrentUser(null);
      setUserStocksFromDB([]); // 清除資料庫股票
      try {
        localStorage.removeItem('gemini-fintech-user');
      } catch (error) {
        console.error('清除用戶資訊失敗:', error);
      }
    } else {
      // 顯示登入模態框
      setIsLoginModalOpen(true);
    }
  };

  // 市場情緒數據（從 Finnhub API 獲取）
  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment>({
    level: 'Extreme Fear',
    index: 4,
    color: '#ef4444',
  });

  // 切換收藏狀態
  // 處理收藏切換（加入收藏時顯示確認對話框，確認後寫入資料庫）
  const toggleFavorite = async (symbol: string) => {
    const isCurrentlyFavorite = favorites.has(symbol);
    
    // 如果是加入收藏，顯示確認對話框
    if (!isCurrentlyFavorite) {
      // 找到股票資訊（從當前顯示的股票列表中查找）
      const stock = filteredAndSortedStocks.find(s => s.symbol === symbol) ||
                    mockStocks.find(s => s.symbol === symbol) ||
                    queriedStocks.find(s => s.symbol === symbol);
      const stockName = stock?.name || symbol;
      
      // 顯示確認對話框
      const confirmed = window.confirm(
        `確定要收藏股票「${stockName} (${symbol})」嗎？\n\n收藏後將自動儲存到您的資料庫中。`
      );
      
      if (!confirmed) {
        return; // 用戶取消
      }
      
      // 更新收藏狀態
      setFavorites((prev) => {
        const newFavorites = new Set(prev);
        newFavorites.add(symbol);
        return newFavorites;
      });
      
      // 如果用戶已登入，寫入資料庫
      if (currentUser && gasUrl && stock) {
        try {
          const stockData: StockData = {
            symbol: stock.symbol,
            name: stock.name,
            price: stock.price,
            change: stock.change,
            volume: stock.volume,
            chips: stock.chips,
            buySellRatio: stock.buySellRatio,
          };
          
          const result = await saveStockToGAS(gasUrl, currentUser, stockData);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:441',message:'saveStockToGAS result received',data:{success:result.success,message:result.message,symbol:symbol},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          
          if (result.success) {
            if (import.meta.env.DEV) {
              console.log('股票已儲存/更新到資料庫:', symbol);
            }
            // 後端已經處理唯一鍵（UserId, StockSymbol），儲存或更新都會正確處理
            // 重新載入資料庫股票列表以顯示最新數據（30秒自動刷新也會確保同步）
            await loadUserStocksFromDB(currentUser);
          } else {
            console.error('儲存股票失敗:', result.message);
            alert(`儲存股票失敗: ${result.message || '未知錯誤'}`);
          }
        } catch (error) {
          console.error('儲存股票時發生錯誤:', error);
          alert('儲存股票時發生錯誤，請稍後再試');
        }
      } else if (!currentUser) {
        // 未登入提示（收藏仍會成功，只是不會寫入資料庫）
        // 可以選擇是否要顯示提示
        // alert('提示：請先登入才能將股票儲存到資料庫。目前僅儲存在本地收藏列表中。');
      }
    } else {
      // 取消收藏，不需要確認，直接執行
      setFavorites((prev) => {
        const newFavorites = new Set(prev);
        newFavorites.delete(symbol);
        return newFavorites;
      });
    }
  };

  // 刪除股票（隱藏 + 資料庫同步）
  const handleDeleteStock = async (symbol: string): Promise<void> => {
    // 找到要刪除的股票資訊（用於確認對話框）
    const stockToDelete = filteredAndSortedStocks.find(s => s.symbol === symbol);
    const stockName = stockToDelete?.name || symbol;

    // 顯示確認對話框
    const confirmed = window.confirm(
      `確定要刪除股票「${stockName} (${symbol})」嗎？\n\n此操作將從您的列表中移除此股票。`
    );

    if (!confirmed) {
      return; // 用戶取消刪除
    }

    // 如果用戶已登入，同步刪除資料庫記錄
    if (currentUser && gasUrl) {
      try {
        const result = await deleteStockFromGAS(gasUrl, currentUser, symbol);
        if (result.success) {
          if (import.meta.env.DEV) {
            console.log('股票已從資料庫刪除:', symbol);
          }
          // 重新載入資料庫股票列表以反映刪除操作
          await loadUserStocksFromDB(currentUser);
        } else {
          console.error('刪除股票失敗:', result.message);
          // 即使資料庫刪除失敗，仍然執行本地刪除
        }
      } catch (error) {
        console.error('刪除股票時發生錯誤:', error);
        // 即使發生錯誤，仍然執行本地刪除，避免影響用戶體驗
      }
    }

    // 更新本地狀態（隱藏股票）
    setHiddenStocks((prev) => {
      const newHiddenStocks = new Set(prev);
      newHiddenStocks.add(symbol);
      return newHiddenStocks;
    });
  };

  // 當用戶登入時，自動載入資料庫股票
  useEffect(() => {
    if (currentUser && gasUrl) {
      loadUserStocksFromDB(currentUser);
    }
  }, [currentUser, gasUrl]); // 僅在用戶或 GAS URL 改變時觸發

  // 當收藏狀態改變時，更新資料庫股票的收藏狀態
  useEffect(() => {
    setUserStocksFromDB((prev: Stock[]) =>
      prev.map((stock: Stock) => ({
        ...stock,
        isFavorite: favorites.has(stock.symbol),
      }))
    );
  }, [favorites]);

  // 過濾和排序股票
  const filteredAndSortedStocks = useMemo(() => {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:filteredAndSortedStocks:entry',message:'filteredAndSortedStocks computation started',data:{userStocksFromDBCount:userStocksFromDB.length,queriedStocksCount:queriedStocks.length,searchQuery:searchQuery,activeStrategy:activeStrategy,sortType:sortType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      
      // 合併本地股票、資料庫股票和查詢到的股票
      let stocks = [...mockStocks];
    
    // 添加從資料庫載入的股票（優先於 mockStocks，去重）
    if (userStocksFromDB.length > 0) {
      userStocksFromDB.forEach((dbStock: Stock) => {
        const existingIndex = stocks.findIndex((s) => s.symbol === dbStock.symbol);
        if (existingIndex >= 0) {
          // 如果已存在，用資料庫的數據替換（資料庫數據更新）
          stocks[existingIndex] = dbStock;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:552',message:'Replaced existing stock with DB stock',data:{symbol:dbStock.symbol,index:existingIndex},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
        } else {
          // 如果不存在，添加新股票
          stocks.push(dbStock);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:557',message:'Added new DB stock to list',data:{symbol:dbStock.symbol,name:dbStock.name,currentStocksCount:stocks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
        }
      });
    }
    
    // 如果查詢到了新股票，添加到列表中（去重，但優先級低於資料庫股票）
    if (queriedStocks.length > 0) {
      queriedStocks.forEach((queriedStock) => {
        const exists = stocks.some((s) => s.symbol === queriedStock.symbol);
        if (!exists) {
          stocks.push(queriedStock);
        }
      });
    }

    // 過濾掉隱藏的股票
    stocks = stocks.filter((stock) => !hiddenStocks.has(stock.symbol));

    // 更新收藏狀態
    stocks = stocks.map((stock) => ({
      ...stock,
      isFavorite: favorites.has(stock.symbol),
    }));

    // 搜索過濾（按名稱或代碼）
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:filteredAndSortedStocks:beforeSearchFilter',message:'Before search filter',data:{query:query,stocksCount:stocks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      
      stocks = stocks.filter((stock) => {
        try {
          const nameMatch = stock.name && typeof stock.name === 'string' && stock.name.toLowerCase().includes(query);
          const symbolMatch = stock.symbol && typeof stock.symbol === 'string' && stock.symbol.toLowerCase().includes(query);
          return nameMatch || symbolMatch;
        } catch (filterError) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:filteredAndSortedStocks:searchFilterError',message:'Error in search filter',data:{error:String(filterError),stockSymbol:stock.symbol,stockName:stock.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
          // #endregion
          console.error('搜尋過濾錯誤:', filterError, stock);
          return false; // 如果過濾時出錯，排除該股票
        }
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:filteredAndSortedStocks:afterSearchFilter',message:'After search filter',data:{filteredCount:stocks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
    }

    // 策略過濾
    if (activeStrategy !== 'all') {
      if (activeStrategy === 'favorites') {
        // 我的收藏：只顯示資料庫中的收藏股票
        const favoriteSymbols = new Set(
          userStocksFromDB
            .filter(stock => favorites.has(stock.symbol))
            .map(stock => stock.symbol)
        );
        
        stocks = stocks.filter((stock) => favoriteSymbols.has(stock.symbol));
        
        // 使用即時價格更新股票數據
        stocks = stocks.map((stock) => {
          const realTimePrice = favoriteStocksPrices.get(stock.symbol);
          if (realTimePrice) {
            return {
              ...stock,
              price: realTimePrice.price,
              change: realTimePrice.change,
              volume: realTimePrice.volume ?? stock.volume,
            };
          }
          // 如果沒有即時價格，使用資料庫中的價格作為 fallback
          return stock;
        });
      } else {
        stocks = stocks.filter((stock) => {
          switch (activeStrategy) {
            case 'bullish':
              // 多頭排列：價格上漲
              return stock.change > 0;
            case 'institutional':
              // 法人抬轎：CHIPS 較高
              return (stock.chips || 0) > 60;
            case 'shortsqueeze':
              // 軋空警訊：價格上漲且成交量較大
              return stock.change > 0 && (stock.volume || 0) > 40000000;
            default:
              return true;
          }
        });
      }
    }

    // 排序
    if (sortType !== 'default') {
      stocks.sort((a, b) => {
        switch (sortType) {
          case 'name-asc':
            return a.name.localeCompare(b.name, 'zh-TW');
          case 'name-desc':
            return b.name.localeCompare(a.name, 'zh-TW');
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'change-asc':
            return a.change - b.change;
          case 'change-desc':
            return b.change - a.change;
          case 'volume-asc':
            return (a.volume || 0) - (b.volume || 0);
          case 'volume-desc':
            return (b.volume || 0) - (a.volume || 0);
          default:
            return 0;
        }
      });

      // 重新分配排名
      stocks = stocks.map((stock, index) => ({
        ...stock,
        rank: index + 1,
      }));
    }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:filteredAndSortedStocks:computed',message:'filteredAndSortedStocks computed successfully',data:{finalStocksCount:stocks.length,finalStockSymbols:stocks.map(s=>s.symbol),stocksSample:stocks.slice(0,3).map(s=>({symbol:s.symbol,name:s.name,hasPrice:typeof s.price==='number',hasChange:typeof s.change==='number'}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      
      return stocks;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:filteredAndSortedStocks:error',message:'CRITICAL: Error in filteredAndSortedStocks computation',data:{error:String(error),errorStack:error instanceof Error?error.stack:'no stack',searchQuery:searchQuery,queriedStocksLength:queriedStocks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      
      console.error('過濾和排序股票時發生錯誤:', error);
      // 返回空陣列而不是崩潰，讓 UI 顯示「沒有符合條件的股票」
      return [];
    }
  }, [activeStrategy, favorites, sortType, searchQuery, queriedStocks, hiddenStocks, userStocksFromDB, favoriteStocksPrices]);

  // 追蹤已從資料庫載入的股票代號（避免重複儲存）
  const loadedStockSymbolsRef = useRef<Set<string>>(new Set());

  // 當資料庫股票載入完成後，更新已載入的股票代號集合
  useEffect(() => {
    if (userStocksFromDB.length > 0) {
      const symbols = new Set(userStocksFromDB.map(stock => stock.symbol));
      loadedStockSymbolsRef.current = symbols;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:638',message:'Updated loadedStockSymbolsRef',data:{symbols:Array.from(symbols)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    }
  }, [userStocksFromDB]);

  // 每30秒自動從資料庫讀取最新股票清單（確保資料同步）
  useEffect(() => {
    // 如果用戶未登入或沒有 GAS URL，跳過
    if (!currentUser || !gasUrl) {
      return;
    }

    // 立即載入一次
    loadUserStocksFromDB(currentUser);

    // 設置每30秒自動刷新
    const intervalId = setInterval(() => {
      if (currentUser && gasUrl) {
        if (import.meta.env.DEV) {
          console.log('自動刷新資料庫股票清單...');
        }
        loadUserStocksFromDB(currentUser);
      }
    }, 30000); // 30秒 = 30000毫秒

    // 清理函數：組件卸載或依賴改變時清除定時器
    return () => {
      clearInterval(intervalId);
    };
  }, [currentUser, gasUrl]); // 依賴：用戶狀態、GAS URL

  // 定期更新收藏股票即時價格（每 30 秒）
  useEffect(() => {
    if (!currentUser || userStocksFromDB.length === 0) {
      return;
    }

    // 立即更新一次
    updateFavoriteStocksPrices();

    // 設置每 30 秒自動刷新
    const intervalId = setInterval(() => {
      if (currentUser && userStocksFromDB.length > 0) {
        updateFavoriteStocksPrices();
      }
    }, 30000); // 30 秒

    return () => {
      clearInterval(intervalId);
    };
  }, [currentUser, userStocksFromDB, updateFavoriteStocksPrices]);

  // 定期更新 Fear and Greed Index（每 5 分鐘）
  useEffect(() => {
    // 立即更新一次
    updateFearGreedIndex();

    // 設置每 5 分鐘自動刷新
    const intervalId = setInterval(() => {
      updateFearGreedIndex();
    }, 300000); // 5 分鐘 = 300000 毫秒

    return () => {
      clearInterval(intervalId);
    };
  }, [updateFearGreedIndex]);

  // 追蹤 AI 報告載入狀態的 ref（避免重複呼叫）
  const isLoadingAIReportRef = useRef(false);

  // 載入 AI 智能日報
  const loadAIDailyReport = useCallback(async () => {
    // 如果正在載入，避免重複呼叫
    if (isLoadingAIReportRef.current) {
      return;
    }

    isLoadingAIReportRef.current = true;
    setIsLoadingAIReport(true);
    setAiReportError(null);

    try {
      const report = await getDailyMarketReport();
      setAiDailyReport(report);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '載入 AI 報告時發生未知錯誤';
      setAiReportError(errorMessage);
      console.error('載入 AI 報告失敗:', error);
    } finally {
      setIsLoadingAIReport(false);
      isLoadingAIReportRef.current = false;
    }
  }, []);

  // 監聽 activeTab 變化，切換到 AI 智能日報時觸發載入
  useEffect(() => {
    if (activeTab === 'AI 智能日報') {
      loadAIDailyReport();
    }
  }, [activeTab, loadAIDailyReport]); // 依賴 activeTab 和 loadAIDailyReport

  return (
    <div className="min-h-screen bg-black text-white">
                  <Header
        activeTab={activeTab}
        onTabChange={(tab: TabType) => setActiveTab(tab)}
        searchQuery={searchQuery}
        onSearchQueryChange={handleSearchQueryChange}
        onSearchSubmit={handleSearchSubmit}
        searchHistory={searchHistory}
        onRemoveFromSearchHistory={removeFromSearchHistory}
        favoritesCount={favorites.size}
        isSearching={isSearching}
        searchError={searchError}
        currentUser={currentUser}
        onLoginClick={handleLoginClick}
      />
      {/* 登入模態框 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        googleAppsScriptUrl={gasUrl}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* 根據 activeTab 條件渲染不同內容 */}
        {activeTab === 'AI 智能日報' ? (
          /* AI 智能日報 */
          <AIDailyReport
            content={aiDailyReport}
            isLoading={isLoadingAIReport}
            error={aiReportError}
            onRetry={loadAIDailyReport}
          />
        ) : (
          <>
            {/* 市場情緒 */}
            <MarketSentimentComponent sentiment={marketSentiment} />

            {/* 策略按鈕 */}
            <div className="flex items-center gap-3">
              <StrategyButtons
                activeStrategy={activeStrategy}
                onStrategyChange={setActiveStrategy}
              />
              {isLoadingFavoritePrices && activeStrategy === 'favorites' && (
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  <span>更新即時價格中...</span>
                </div>
              )}
            </div>

            {/* 股票表格 */}
            <StockTable
              stocks={filteredAndSortedStocks}
              onToggleFavorite={toggleFavorite}
              onDeleteStock={handleDeleteStock}
              sortType={sortType}
              onSortChange={setSortType}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
