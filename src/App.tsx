import { useState, useMemo, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { MarketSentiment } from './components/MarketSentiment';
import { StrategyButtons } from './components/StrategyButtons';
import { StockTable } from './components/StockTable';
import { LoginModal } from './components/LoginModal';
import { mockStocks } from './data/mockStocks';
import { queryStock } from './services/stockService';
import type { Stock } from './types/stock';
import './App.css';

type TabType = '金額排行' | 'AI 智能日報' | '國際盤';
type StrategyType = 'all' | 'bullish' | 'institutional' | 'shortsqueeze';
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

function App() {
  // 標籤狀態
  const [activeTab, setActiveTab] = useState<TabType>('金額排行');

  // 策略狀態
  const [activeStrategy, setActiveStrategy] = useState<StrategyType>('all');

  // 收藏狀態（從 localStorage 載入）
  const [favorites, setFavorites] = useState<Set<string>>(() =>
    loadFavoritesFromStorage()
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

  // Google Apps Script URL（從環境變數讀取）
  const gasUrl = import.meta.env.VITE_GAS_URL || '';

  // 當收藏狀態改變時，保存到 localStorage
  useEffect(() => {
    saveFavoritesToStorage(favorites);
  }, [favorites]);

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

  // 處理搜索查詢改變（帶 debounce）
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

    // 檢查是否應該執行 API 查詢
    // 如果查詢是純數字（股票代碼）且本地沒有，則查詢 API
    const isSymbol = /^\d{4}$/.test(query.trim()); // 台灣股票代碼通常是 4 位數
    const localMatch = mockStocks.find(
      (s) =>
        s.symbol.toLowerCase() === query.trim().toLowerCase() ||
        s.name.toLowerCase().includes(query.trim().toLowerCase())
    );

    // 如果是 4 位數股票代碼且本地沒有匹配，執行 API 查詢（帶 debounce）
    if (isSymbol && !localMatch && query.trim().length === 4) {
      // 保存當前查詢值，避免閉包陷阱
      const currentQuery = query.trim();
      
      // 設置 debounce，避免頻繁請求
      searchTimeoutRef.current = setTimeout(async () => {
        // 檢查查詢是否仍然有效（用戶可能已經改變了輸入）
        if (searchQueryRef.current.trim() !== currentQuery) {
          // 查詢已改變，不執行操作
          return;
        }

        setIsSearching(true);
        try {
          const result = await queryStock(currentQuery, mockStocks, true);
          // 再次檢查查詢是否仍然相同（雙重檢查）
          if (searchQueryRef.current.trim() === currentQuery) {
            if (result.found && result.stock) {
              // 添加到查詢結果列表
              setQueriedStocks([result.stock]);
              // 添加到搜索歷史（addToSearchHistory 內部已有去重邏輯）
              addToSearchHistory(currentQuery);
            } else {
              setSearchError(result.error || '找不到該股票');
              setQueriedStocks([]);
            }
          }
        } catch (error) {
          console.error('查詢股票失敗:', error);
          // 只有在查詢仍然相同時才顯示錯誤
          if (searchQueryRef.current.trim() === currentQuery) {
            setSearchError('查詢失敗，請稍後再試');
            setQueriedStocks([]);
          }
        } finally {
          // 只有在查詢仍然相同時才清除載入狀態
          if (searchQueryRef.current.trim() === currentQuery) {
            setIsSearching(false);
          }
        }
      }, 800); // 800ms debounce
    } else {
      // 本地匹配或名稱搜索，清除 API 查詢結果
      setQueriedStocks([]);
      setIsSearching(false);
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

  // 處理登入成功
  const handleLoginSuccess = (userId: string) => {
    setCurrentUser(userId);
    // 保存到 localStorage
    try {
      localStorage.setItem('gemini-fintech-user', JSON.stringify(userId));
    } catch (error) {
      console.error('保存用戶資訊失敗:', error);
    }
    setIsLoginModalOpen(false);
  };

  // 處理登入/登出點擊
  const handleLoginClick = () => {
    if (currentUser) {
      // 登出
      setCurrentUser(null);
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

  // 市場情緒數據
  const marketSentiment = {
    level: 'Extreme Fear' as const,
    index: 4,
    color: 'red',
  };

  // 切換收藏狀態
  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      return newFavorites;
    });
  };

  // 過濾和排序股票
  const filteredAndSortedStocks = useMemo(() => {
    // 合併本地股票和查詢到的股票
    let stocks = [...mockStocks];
    
    // 如果查詢到了新股票，添加到列表中（去重）
    if (queriedStocks.length > 0) {
      queriedStocks.forEach((queriedStock) => {
        const exists = stocks.some((s) => s.symbol === queriedStock.symbol);
        if (!exists) {
          stocks.push(queriedStock);
        }
      });
    }

    // 更新收藏狀態
    stocks = stocks.map((stock) => ({
      ...stock,
      isFavorite: favorites.has(stock.symbol),
    }));

    // 搜索過濾（按名稱或代碼）
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      stocks = stocks.filter(
        (stock) =>
          stock.name.toLowerCase().includes(query) ||
          stock.symbol.toLowerCase().includes(query)
      );
    }

    // 策略過濾（目前使用模擬邏輯）
    if (activeStrategy !== 'all') {
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

    return stocks;
  }, [activeStrategy, favorites, sortType, searchQuery, queriedStocks]);

  return (
    <div className="min-h-screen bg-black text-white">
                  <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchQueryChange={handleSearchQueryChange}
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
        {/* 市場情緒 */}
        <MarketSentiment sentiment={marketSentiment} />

        {/* 策略按鈕 */}
        <StrategyButtons
          activeStrategy={activeStrategy}
          onStrategyChange={setActiveStrategy}
        />

        {/* 股票表格 */}
        <StockTable
          stocks={filteredAndSortedStocks}
          onToggleFavorite={toggleFavorite}
          sortType={sortType}
          onSortChange={setSortType}
        />
      </main>
    </div>
  );
}

export default App;
