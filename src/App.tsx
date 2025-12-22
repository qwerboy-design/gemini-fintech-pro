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

  // 所有股票的即時價格（從 FinMind API 獲取）
  // 注意：此 Map 存儲所有已獲取價格的股票，不僅限於收藏股票
  const [allStocksPrices, setAllStocksPrices] = useState<Map<string, Stock>>(new Map());
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
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:270',message:'handleSearchSubmit called',data:{searchQuery:searchQuery.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const query = searchQuery.trim();
    if (!query) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:274',message:'Query is empty, returning early',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return;
    }

    // 清除之前的 timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    setSearchError(null);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:285',message:'Starting queryStock',data:{query:query},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    try {
      const result = await queryStock(query, mockStocks, true);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:289',message:'queryStock result',data:{found:result.found,hasStock:!!result.stock,error:result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (result.found && result.stock) {
        // 添加到查詢結果列表
        setQueriedStocks([result.stock]);
        // 添加到搜索歷史（addToSearchHistory 內部已有去重邏輯）
        addToSearchHistory(query);
        // 清空搜索查詢，避免持續過濾股票列表
        setSearchQuery('');
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:293',message:'Stock found and added to queriedStocks',data:{symbol:result.stock.symbol,name:result.stock.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } else {
        setSearchError(result.error || '找不到該股票');
        setQueriedStocks([]);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:297',message:'Stock not found',data:{error:result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      }
    } catch (error) {
      // 只在開發環境中輸出詳細錯誤
      if (import.meta.env.DEV) {
        console.error('查詢股票失敗:', error);
      }
      setSearchError('查詢失敗，請稍後再試');
      setQueriedStocks([]);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:304',message:'Query error',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    } finally {
      setIsSearching(false);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:310',message:'handleSearchSubmit finished',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
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
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:loadUserStocksFromDB:entry',message:'Function entry',data:{userId,favoritesSize:favorites.size,favoritesArray:Array.from(favorites)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
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
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:loadUserStocksFromDB:after-fetch',message:'After getUserStocksFromGAS',data:{success:result.success,stocksCount:result.data?.stocks?.length || 0,stockSymbols:result.data?.stocks?.map((s:StockData)=>s.symbol) || []},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (result.success && result.data && result.data.stocks && result.data.stocks.length > 0) {
        // 資料庫有股票記錄：轉換為 Stock 格式，並去重（保留最後一個）
        const stocksMap = new Map<string, Stock>();
        const dbStockSymbols = new Set<string>();
        
        result.data.stocks.forEach((stockData: StockData) => {
          dbStockSymbols.add(stockData.symbol);
          stocksMap.set(stockData.symbol, {
            symbol: stockData.symbol,
            name: stockData.name,
            price: stockData.price,
            change: stockData.change,
            volume: stockData.volume,
            chips: stockData.chips,
            buySellRatio: stockData.buySellRatio,
            isFavorite: favorites.has(stockData.symbol),
          });
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:loadUserStocksFromDB:before-sync',message:'Before favorites sync',data:{dbStockSymbols:Array.from(dbStockSymbols),currentFavorites:Array.from(favorites),favoritesSize:favorites.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        // 同步收藏狀態：將資料庫中的所有股票 symbol 加入到 favorites Set 中
        // 因為這些股票已經在資料庫中，應該被視為收藏的股票
        setFavorites((prev) => {
          const newFavorites = new Set(prev);
          let addedCount = 0;
          dbStockSymbols.forEach((symbol) => {
            if (!newFavorites.has(symbol)) {
              newFavorites.add(symbol);
              addedCount++;
            }
          });
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:loadUserStocksFromDB:favorites-updated',message:'Favorites updated',data:{addedCount,newFavoritesSize:newFavorites.size,newFavoritesArray:Array.from(newFavorites)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion

          return newFavorites;
        });
        
        const stocks = Array.from(stocksMap.values());
        
        // 更新股票的 isFavorite 狀態（現在應該都是 true，因為已經加入到 favorites）
        stocks.forEach((stock) => {
          stock.isFavorite = true;
        });

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:loadUserStocksFromDB:before-setUserStocksFromDB',message:'Before setUserStocksFromDB',data:{stocksCount:stocks.length,stocksWithFavorite:stocks.filter(s=>s.isFavorite).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion

        // 設置資料庫股票（會自動顯示在股票清單中）
        setUserStocksFromDB(stocks);
        
        // 注意：不清空 queriedStocks，允許用戶搜尋結果與資料庫股票共存
        // 只有在登入時才清空（在 handleLoginSuccess 中處理）
        
        if (import.meta.env.DEV) {
          console.log(`成功載入 ${stocks.length} 筆股票記錄`);
        }
      } else {
        // 資料庫沒有股票記錄：清空資料庫股票
        // 注意：不清空 queriedStocks，允許用戶搜尋
        setUserStocksFromDB([]);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:loadUserStocksFromDB:no-stocks',message:'No stocks in database',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion

        if (import.meta.env.DEV) {
          console.log('資料庫沒有股票記錄');
        }
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:loadUserStocksFromDB:error',message:'Error loading stocks',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      console.error('載入用戶股票失敗:', error);
      // 發生錯誤時，也清空股票清單
      setUserStocksFromDB([]);
      setQueriedStocks([]);
    }
  };

  // 更新股票即時價格（使用 FinMind API）
  // 只查詢股票清單（mockStocks + userStocksFromDB）和收藏的股票
  const updateFavoriteStocksPrices = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:408',message:'updateFavoriteStocksPrices called',data:{favoritesSize:favorites.size,userStocksFromDBCount:userStocksFromDB.length,mockStocksCount:mockStocks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // 獲取需要更新價格的股票代碼列表
    // 1. 股票清單：mockStocks + userStocksFromDB（去重）
    // 2. 收藏的股票（favorites）
    // 注意：不查詢 queriedStocks，因為這些是臨時查詢結果
    const symbolsToUpdate = new Set<string>();
    
    // 1. 添加股票清單中的股票（mockStocks + userStocksFromDB）
    mockStocks.forEach(stock => symbolsToUpdate.add(stock.symbol));
    userStocksFromDB.forEach(stock => symbolsToUpdate.add(stock.symbol));
    
    // 2. 添加收藏的股票
    favorites.forEach(symbol => symbolsToUpdate.add(symbol));

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:422',message:'Symbols to update prepared',data:{symbolsToUpdateSize:symbolsToUpdate.size,symbolsToUpdate:Array.from(symbolsToUpdate)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (symbolsToUpdate.size === 0) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:424',message:'No symbols to update, returning early',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return;
    }

    setIsLoadingFavoritePrices(true);

    try {
      const symbolsArray = Array.from(symbolsToUpdate);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:431',message:'Calling getStockQuotes',data:{symbolsArrayCount:symbolsArray.length,symbolsArray},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const prices = await getStockQuotes(symbolsArray);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:435',message:'getStockQuotes result',data:{pricesSize:prices.size,pricesSymbols:Array.from(prices.keys()),pricesData:Array.from(prices.entries()).map(([symbol,stock])=>({symbol,price:stock.price,change:stock.change}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // 完全替換價格 Map，清除舊的價格數據，只保留最新的
      setAllStocksPrices(new Map(prices));
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:439',message:'Price update completed',data:{pricesSize:prices.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (import.meta.env.DEV) {
        console.log(`成功更新 ${prices.size} 筆股票價格（共 ${symbolsArray.length} 筆請求）`);
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:445',message:'Price update error',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error('更新股票價格失敗:', error);
    } finally {
      setIsLoadingFavoritePrices(false);
    }
  }, [userStocksFromDB, favorites]);

  // 更新 Fear and Greed Index（優先使用 CNN API，fallback 到 Finnhub API）
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
    
    // 登入時清空搜尋結果，準備載入資料庫股票
    setQueriedStocks([]);
    
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
      
      // 如果當前策略不是「我的收藏」，自動切換到「我的收藏」策略，讓用戶立即看到收藏的股票
      if (activeStrategy !== 'favorites') {
        setActiveStrategy('favorites');
      }
      
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:toggleFavorite:unfavorite',message:'Unfavoriting stock',data:{symbol,currentUser,hasInDB:userStocksFromDB.some(s=>s.symbol===symbol)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion

      // 更新收藏狀態
      setFavorites((prev) => {
        const newFavorites = new Set(prev);
        newFavorites.delete(symbol);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:toggleFavorite:favorites-updated',message:'Favorites updated after unfavorite',data:{symbol,newFavoritesSize:newFavorites.size,newFavoritesArray:Array.from(newFavorites)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion

        return newFavorites;
      });

      // 如果用戶已登入且該股票在資料庫中，從資料庫刪除
      if (currentUser && gasUrl) {
        const stockInDB = userStocksFromDB.find(s => s.symbol === symbol);
        if (stockInDB) {
          try {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:toggleFavorite:delete-from-db',message:'Deleting stock from database',data:{symbol,currentUser},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
            // #endregion

            const result = await deleteStockFromGAS(gasUrl, currentUser, symbol);
            if (result.success) {
              if (import.meta.env.DEV) {
                console.log('股票已從資料庫刪除:', symbol);
              }
              // 重新載入資料庫股票列表以顯示最新數據
              await loadUserStocksFromDB(currentUser);
            } else {
              console.error('從資料庫刪除股票失敗:', result.message);
            }
          } catch (error) {
            console.error('從資料庫刪除股票時發生錯誤:', error);
          }
        }
      }
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
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:641',message:'filteredAndSortedStocks start',data:{activeStrategy,userStocksFromDBCount:userStocksFromDB.length,queriedStocksCount:queriedStocks.length,mockStocksCount:mockStocks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // 合併本地股票、資料庫股票和查詢到的股票
      // 使用 Map 確保每個股票代號只出現一次（以最後一個為準）
      const stocksMap = new Map<string, Stock>();
      
      // 1. 先添加 mockStocks（基礎數據）
      mockStocks.forEach((stock) => {
        stocksMap.set(stock.symbol, stock);
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:649',message:'After adding mockStocks',data:{stocksMapSize:stocksMap.size,mockStocksSymbols:mockStocks.map(s=>s.symbol)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // 2. 用資料庫股票覆蓋或添加（資料庫數據優先，並去重）
      if (userStocksFromDB.length > 0) {
        // 先對 userStocksFromDB 去重（保留最後一個）
        const uniqueUserStocks = new Map<string, Stock>();
        userStocksFromDB.forEach((dbStock: Stock) => {
          uniqueUserStocks.set(dbStock.symbol, dbStock);
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:656',message:'userStocksFromDB before dedup',data:{userStocksFromDBCount:userStocksFromDB.length,userStocksFromDBSymbols:userStocksFromDB.map(s=>s.symbol)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        // 添加到主 Map
        uniqueUserStocks.forEach((stock, symbol) => {
          stocksMap.set(symbol, stock);
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:662',message:'After adding userStocksFromDB',data:{stocksMapSize:stocksMap.size,uniqueUserStocksSize:uniqueUserStocks.size,uniqueUserStocksSymbols:Array.from(uniqueUserStocks.keys())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }
      
      // 3. 添加查詢到的股票（優先顯示搜尋結果，覆蓋已存在的股票）
      if (queriedStocks.length > 0) {
        // 先對 queriedStocks 去重（保留最後一個）
        const uniqueQueriedStocks = new Map<string, Stock>();
        queriedStocks.forEach((queriedStock) => {
          uniqueQueriedStocks.set(queriedStock.symbol, queriedStock);
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:669',message:'queriedStocks before dedup',data:{queriedStocksCount:queriedStocks.length,queriedStocksSymbols:queriedStocks.map(s=>s.symbol)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        // 添加到主 Map（搜尋結果優先，覆蓋已存在的股票）
        uniqueQueriedStocks.forEach((stock, symbol) => {
          stocksMap.set(symbol, stock);
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:675',message:'After adding queriedStocks',data:{stocksMapSize:stocksMap.size,uniqueQueriedStocksSize:uniqueQueriedStocks.size,uniqueQueriedStocksSymbols:Array.from(uniqueQueriedStocks.keys())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }
      
      // 轉換 Map 為陣列（此時已確保無重複）
      let stocks = Array.from(stocksMap.values());
      
      // #region agent log
      const duplicateSymbolsBeforeFilter = stocks.map(s => s.symbol).filter((symbol, index, arr) => arr.indexOf(symbol) !== index);
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:681',message:'After converting Map to array',data:{stocksCount:stocks.length,stocksSymbols:stocks.map(s=>s.symbol),duplicateSymbols:duplicateSymbolsBeforeFilter,stocksMapSize:stocksMap.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // 如果 Map 轉換後仍有重複，立即去重（這不應該發生，但作為安全措施）
      if (duplicateSymbolsBeforeFilter.length > 0) {
        const dedupMap = new Map<string, Stock>();
        stocks.forEach(stock => {
          dedupMap.set(stock.symbol, stock);
        });
        stocks = Array.from(dedupMap.values());
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:emergency-dedup',message:'Emergency deduplication after Map conversion',data:{beforeCount:stocks.length,afterCount:stocks.length,duplicateSymbols:duplicateSymbolsBeforeFilter},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
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
      
      stocks = stocks.filter((stock) => {
        try {
          const nameMatch = stock.name && typeof stock.name === 'string' && stock.name.toLowerCase().includes(query);
          const symbolMatch = stock.symbol && typeof stock.symbol === 'string' && stock.symbol.toLowerCase().includes(query);
          return nameMatch || symbolMatch;
        } catch (filterError) {
          console.error('搜尋過濾錯誤:', filterError, stock);
          return false; // 如果過濾時出錯，排除該股票
        }
      });
    }

    // 策略過濾
    if (activeStrategy !== 'all') {
      if (activeStrategy === 'favorites') {
        // 我的收藏：顯示所有收藏的股票（包括資料庫和本地）
        // 如果用戶已登入且有資料庫股票，優先顯示資料庫中的收藏股票
        // 否則顯示所有股票中收藏的項目
        if (currentUser && userStocksFromDB.length > 0) {
          // 優先使用資料庫中的收藏股票
          const favoriteSymbols = new Set(
            userStocksFromDB
              .filter(stock => favorites.has(stock.symbol))
              .map(stock => stock.symbol)
          );
          
          stocks = stocks.filter((stock) => favoriteSymbols.has(stock.symbol));
        } else {
          // 如果沒有資料庫股票或未登入，顯示所有收藏的股票
          stocks = stocks.filter((stock) => favorites.has(stock.symbol));
        }
        
        // 使用即時價格更新股票數據
        stocks = stocks.map((stock) => {
          const realTimePrice = allStocksPrices.get(stock.symbol);
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
        
        // 對於非收藏策略，也使用 API 獲取的價格更新股票數據
        stocks = stocks.map((stock) => {
          const realTimePrice = allStocksPrices.get(stock.symbol);
          if (realTimePrice) {
            return {
              ...stock,
              price: realTimePrice.price,
              change: realTimePrice.change,
              volume: realTimePrice.volume ?? stock.volume,
            };
          }
          return stock;
        });
      }
    } else {
      // 當策略為 'all' 時，也使用 API 獲取的價格更新所有股票
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:831',message:'Before price update for all strategy',data:{stocksCount:stocks.length,stocksSymbols:stocks.map(s=>s.symbol),allStocksPricesSize:allStocksPrices.size,allStocksPricesSymbols:Array.from(allStocksPrices.keys())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      stocks = stocks.map((stock) => {
        const realTimePrice = allStocksPrices.get(stock.symbol);
        // #region agent log
        if (realTimePrice) {
          fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:838',message:'Updating stock price',data:{symbol:stock.symbol,oldPrice:stock.price,newPrice:realTimePrice.price,oldChange:stock.change,newChange:realTimePrice.change},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        } else {
          fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:840',message:'No real-time price found for stock',data:{symbol:stock.symbol,price:stock.price},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        }
        // #endregion
        
        if (realTimePrice) {
          return {
            ...stock,
            price: realTimePrice.price,
            change: realTimePrice.change,
            volume: realTimePrice.volume ?? stock.volume,
          };
        }
        return stock;
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:852',message:'After price update for all strategy',data:{stocksCount:stocks.length,stocksSymbols:stocks.map(s=>s.symbol),updatedPrices:stocks.map(s=>({symbol:s.symbol,price:s.price,change:s.change}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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

    // 最終去重：確保沒有重複的股票代碼（以防萬一）
    // 使用 Map 確保每個股票代碼只出現一次（保留最後一個）
    // #region agent log
    const duplicateSymbolsBeforeFinal = stocks.map(s => s.symbol).filter((symbol, index, arr) => arr.indexOf(symbol) !== index);
    const duplicateDetails = duplicateSymbolsBeforeFinal.map(symbol => {
      const duplicates = stocks.filter(s => s.symbol === symbol);
      return {
        symbol,
        count: duplicates.length,
        sources: duplicates.map(s => ({
          name: s.name,
          price: s.price,
          change: s.change,
          isFromDB: userStocksFromDB.some(db => db.symbol === symbol),
          isFromMock: mockStocks.some(m => m.symbol === symbol),
          isFromQueried: queriedStocks.some(q => q.symbol === symbol)
        }))
      };
    });
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:821',message:'Before final deduplication',data:{stocksCount:stocks.length,stocksSymbols:stocks.map(s=>s.symbol),duplicateSymbols:duplicateSymbolsBeforeFinal,duplicateDetails,activeStrategy,currentUser,userStocksFromDBCount:userStocksFromDB.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    const finalStocksMap = new Map<string, Stock>();
    stocks.forEach((stock) => {
      finalStocksMap.set(stock.symbol, stock);
    });
    stocks = Array.from(finalStocksMap.values());
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:827',message:'After final deduplication',data:{stocksCount:stocks.length,stocksSymbols:stocks.map(s=>s.symbol),finalStocksMapSize:finalStocksMap.size,removedDuplicates:duplicateSymbolsBeforeFinal.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

      return stocks;
    } catch (error) {
      console.error('過濾和排序股票時發生錯誤:', error);
      // 返回空陣列而不是崩潰，讓 UI 顯示「沒有符合條件的股票」
      return [];
    }
  }, [activeStrategy, favorites, sortType, searchQuery, queriedStocks, hiddenStocks, userStocksFromDB, allStocksPrices, currentUser]);

  // 追蹤已從資料庫載入的股票代號（避免重複儲存）
  const loadedStockSymbolsRef = useRef<Set<string>>(new Set());

  // 當資料庫股票載入完成後，更新已載入的股票代號集合
  useEffect(() => {
    if (userStocksFromDB.length > 0) {
      const symbols = new Set(userStocksFromDB.map(stock => stock.symbol));
      loadedStockSymbolsRef.current = symbols;
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

  // 定期更新收藏股票即時價格（每 60 秒，降低請求頻率避免觸發 API 402）
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:921',message:'Price update effect triggered',data:{favoritesSize:favorites.size,userStocksFromDBCount:userStocksFromDB.length,mockStocksCount:mockStocks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // 更新所有股票的價格（不僅僅是收藏的股票）
    // 因為用戶可能想要看到所有股票的即時價格
    // 延遲 2 秒後首次更新，避免頁面載入時立即發送大量請求
    const initialTimeout = setTimeout(() => {
      updateFavoriteStocksPrices();
    }, 2000);

    // 設置每 60 秒自動刷新（從 30 秒改為 60 秒，降低請求頻率）
    const intervalId = setInterval(() => {
      // 更新所有股票的價格
      updateFavoriteStocksPrices();
    }, 60000); // 60 秒（降低頻率避免觸發 API 402）

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [favorites, currentUser, userStocksFromDB, updateFavoriteStocksPrices]);

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
