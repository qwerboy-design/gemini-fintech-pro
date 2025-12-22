import { Search, Settings, User, X, Clock, Star, Loader2, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = '金額排行' | 'AI 智能日報' | '國際盤';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearchSubmit?: () => void | Promise<void>;
  searchHistory?: string[];
  onRemoveFromSearchHistory?: (query: string) => void;
  favoritesCount?: number;
  isSearching?: boolean;
  searchError?: string | null;
  currentUser?: string | null;
  onLoginClick?: () => void;
}

/**
 * 頂部導航欄組件
 */
export function Header({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  searchHistory = [],
  onRemoveFromSearchHistory,
  favoritesCount = 0,
  isSearching = false,
  searchError = null,
  currentUser = null,
  onLoginClick,
}: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const tabs: TabType[] = ['金額排行', 'AI 智能日報', '國際盤'];

  const handleLogin = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      alert('登入功能開發中...');
    }
  };

  const handleLogout = () => {
    if (onLoginClick) {
      // 登出邏輯由父組件處理
      onLoginClick();
    }
  };

  // 點擊外部關閉搜索歷史
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchHistory(false);
      }
    };

    if (showSearchHistory) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSearchHistory]);

  const handleSearchClick = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      // 延遲聚焦，確保搜索框已渲染
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const handleHistoryItemClick = (query: string) => {
    onSearchQueryChange(query);
    setShowSearchHistory(false);
    setShowSearch(false);
  };

  const handleSettingsClick = () => {
    // TODO: 實現設置邏輯
    alert('設置功能開發中...');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Header.tsx:99',message:'handleSearchSubmit called',data:{searchQuery:searchQuery.trim(),hasOnSearchSubmit:!!onSearchSubmit,isSearching,eventType:e.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Header.tsx:107',message:'Search query is empty, returning early',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setShowSearch(false);
      return;
    }
    // 觸發父組件的搜尋函數
    if (onSearchSubmit) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Header.tsx:113',message:'Calling onSearchSubmit',data:{searchQuery:searchQuery.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      try {
        onSearchSubmit();
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Header.tsx:118',message:'onSearchSubmit error',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      }
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Header.tsx:122',message:'onSearchSubmit is not provided',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }
  };

  const handleSearchChange = (value: string) => {
    onSearchQueryChange(value);
    // 如果輸入內容，保持搜索框打開並顯示歷史
    if (value.trim() && !showSearch) {
      setShowSearch(true);
    }
    // 當有輸入時顯示歷史（但不在查詢 API 時顯示）
    if (!isSearching) {
      setShowSearchHistory(true);
    }
  };

  const handleSearchFocus = () => {
    if (searchHistory.length > 0) {
      setShowSearchHistory(true);
    }
  };

  const handleSearchBlur = () => {
    // 延遲關閉，讓點擊歷史項的事件先執行
    setTimeout(() => {
      setShowSearchHistory(false);
      // 如果搜索框為空，才關閉搜索框
      if (!searchQuery.trim()) {
        setShowSearch(false);
      }
    }, 200);
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-600 rounded transform rotate-45 flex items-center justify-center">
              <div className="w-4 h-4 bg-purple-400 rounded"></div>
            </div>
          </div>

          {/* 搜索框（條件顯示） */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                ref={searchContainerRef}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 max-w-md mx-4 relative"
              >
                <form onSubmit={handleSearchSubmit} className="relative" onClick={(e) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Header.tsx:172',message:'Form clicked',data:{targetTag:(e.target as HTMLElement).tagName,targetType:(e.target as HTMLElement).getAttribute('type')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                  // #endregion
                }}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Header.tsx:177',message:'Search input changed',data:{value:e.target.value,trimmedValue:e.target.value.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                      // #endregion
                      handleSearchChange(e.target.value);
                    }}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    onKeyDown={(e) => {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Header.tsx:184',message:'Search input keydown',data:{key:e.key},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                      // #endregion
                      if (e.key === 'Enter') {
                        handleSearchSubmit(e);
                      }
                    }}
                    placeholder="搜索股票名稱或代碼... (Enter 或點擊搜尋按鈕)"
                    disabled={isSearching}
                    className={`w-full px-4 py-2 pr-24 bg-gray-800 border rounded-l-lg rounded-r-none text-white placeholder-gray-500 focus:outline-none transition-colors ${
                      searchError
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-gray-700 focus:border-purple-600'
                    } ${isSearching ? 'opacity-50 cursor-wait' : ''}`}
                  />
                  <div className="absolute right-16 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isSearching && (
                      <Loader2 size={16} className="text-purple-500 animate-spin" />
                    )}
                    {searchError && !isSearching && (
                      <div title={searchError}>
                        <AlertCircle size={16} className="text-red-500" />
                      </div>
                    )}
                    {searchQuery && !isSearching && (
                      <button
                        type="button"
                        onClick={() => {
                          onSearchQueryChange('');
                          searchInputRef.current?.focus();
                        }}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        title="清除搜索"
                      >
                        <X size={16} className="text-gray-400" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    onClick={() => {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/b8c98d22-52ac-4284-8d1d-8e26f94e8b62',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Header.tsx:216',message:'Search button clicked',data:{isSearching,searchQuery:searchQuery.trim(),isDisabled:isSearching || !searchQuery.trim(),hasOnSearchSubmit:!!onSearchSubmit},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                      // #endregion
                    }}
                    className={`absolute right-0 top-0 bottom-0 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-r-lg transition-colors flex items-center gap-2 ${
                      isSearching ? 'opacity-50' : ''
                    }`}
                    title="搜尋股票"
                  >
                    <Search size={16} />
                    <span className="text-sm">搜尋</span>
                  </button>
                  {searchError && !isSearching && (
                    <div className="absolute top-full left-0 right-0 mt-1 px-3 py-2 bg-red-900/50 border border-red-700 rounded text-xs text-red-300">
                      {searchError}
                    </div>
                  )}
                </form>

                {/* 搜索歷史下拉框 */}
                <AnimatePresence>
                  {showSearchHistory && searchHistory.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto"
                    >
                      <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-700 flex items-center gap-2">
                        <Clock size={14} />
                        最近搜索
                      </div>
                      {searchHistory.map((item, index) => (
                        <motion.div
                          key={`${item}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between px-3 py-2 hover:bg-gray-700 transition-colors cursor-pointer group"
                          onClick={() => handleHistoryItemClick(item)}
                        >
                          <span className="text-white text-sm">{item}</span>
                          {onRemoveFromSearchHistory && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveFromSearchHistory(item);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition-all"
                              title="移除"
                            >
                              <X size={14} className="text-gray-400" />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 收藏統計和登入按鈕 */}
          <div className="flex items-center gap-3">
            {favoritesCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg"
                title={`已收藏 ${favoritesCount} 支股票`}
              >
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="text-sm text-gray-300">{favoritesCount}</span>
              </motion.div>
            )}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-600 rounded-lg">
                  <User size={18} className="text-purple-400" />
                  <span className="text-sm text-purple-300">{currentUser}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  title="登出"
                >
                  登出
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
              >
                <User size={18} />
                <span className="text-sm">登入</span>
              </button>
            )}
          </div>

          {/* 右側圖標 */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSearchClick}
              className={`p-2 hover:bg-gray-800 rounded-lg transition-colors ${
                showSearch ? 'bg-gray-800' : ''
              }`}
              title="搜索"
            >
              <Search size={20} className="text-gray-400" />
            </button>
            <button
              onClick={handleSettingsClick}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="設置"
            >
              <Settings size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* 標籤導航 */}
        <nav className="flex gap-6 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`relative pb-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}









