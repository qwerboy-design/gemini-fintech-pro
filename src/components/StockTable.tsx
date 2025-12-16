import { Star, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Stock } from '../types/stock';

export type SortType =
  | 'default'
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'change-asc'
  | 'change-desc'
  | 'volume-asc'
  | 'volume-desc';

interface StockTableProps {
  stocks: Stock[];
  onToggleFavorite: (symbol: string) => void;
  sortType: SortType;
  onSortChange: (sort: SortType) => void;
}

/**
 * 股票表格組件
 */
export function StockTable({
  stocks,
  onToggleFavorite,
  sortType,
  onSortChange,
}: StockTableProps) {
  const formatPrice = (price: number) => {
    return price.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  };

  const formatTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const period = now.getHours() < 12 ? '上午' : '下午';
    return `${period}${hours}:${minutes}:${seconds}`;
  };

  const handleSortClick = () => {
    // 循環切換排序：default -> name-asc -> name-desc -> price-asc -> price-desc -> change-asc -> change-desc -> default
    const sortOrder: SortType[] = [
      'default',
      'name-asc',
      'name-desc',
      'price-desc',
      'price-asc',
      'change-desc',
      'change-asc',
      'volume-desc',
      'volume-asc',
    ];
    const currentIndex = sortOrder.indexOf(sortType);
    const nextIndex = (currentIndex + 1) % sortOrder.length;
    onSortChange(sortOrder[nextIndex]);
  };

  const getSortLabel = () => {
    switch (sortType) {
      case 'name-asc':
        return '名稱 ↑';
      case 'name-desc':
        return '名稱 ↓';
      case 'price-asc':
        return '價格 ↑';
      case 'price-desc':
        return '價格 ↓';
      case 'change-asc':
        return '變化 ↑';
      case 'change-desc':
        return '變化 ↓';
      case 'volume-asc':
        return '成交量 ↑';
      case 'volume-desc':
        return '成交量 ↓';
      default:
        return '';
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation(); // 防止觸發行點擊
    onToggleFavorite(symbol);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* 表格標題 */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-sm font-medium text-gray-400">RANK</span>
            <span className="text-sm font-medium text-gray-400 flex items-center gap-2">
              SYMBOL
              <button
                onClick={handleSortClick}
                className="hover:bg-gray-800 p-1 rounded transition-colors flex items-center gap-1"
                title={`點擊排序 (當前: ${getSortLabel() || '預設'})`}
              >
                <ChevronUp
                  size={14}
                  className={`${
                    sortType.includes('-asc') && sortType !== 'default'
                      ? 'text-purple-500'
                      : 'text-gray-500'
                  }`}
                />
                <ChevronDown
                  size={14}
                  className={`${
                    sortType.includes('-desc')
                      ? 'text-purple-500'
                      : 'text-gray-500'
                  } -mt-1`}
                />
                {sortType !== 'default' && (
                  <span className="text-xs text-purple-500 ml-1">
                    {getSortLabel()}
                  </span>
                )}
              </button>
            </span>
            <span className="text-sm font-medium text-gray-400">PRICE</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-xs text-gray-500">Updated: {formatTime()}</div>
            <span className="text-sm font-medium text-gray-400">CHIPS</span>
            <span className="text-sm font-medium text-gray-400">B/B %</span>
          </div>
        </div>
      </div>

      {/* 表格內容 */}
      <div className="divide-y divide-gray-800">
        <AnimatePresence mode="wait">
          {stocks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-6 py-8 text-center text-gray-500"
            >
              沒有符合條件的股票
            </motion.div>
          ) : (
            stocks.map((stock, index) => {
            const isPricePositive = stock.change >= 0;
            const priceColor = isPricePositive ? 'text-red-500' : 'text-green-500';
            const changeColor = isPricePositive ? 'text-green-500' : 'text-red-500';

            return (
              <motion.div
                key={stock.symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                className="px-6 py-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  {/* 左側：排名、收藏、股票資訊、價格 */}
                  <div className="flex items-center gap-6 flex-1">
                    {/* 排名和收藏 */}
                    <div className="flex items-center gap-2 w-16">
                      <span className="text-sm text-gray-400">{stock.rank}</span>
                      <motion.button
                        onClick={(e) => handleFavoriteClick(e, stock.symbol)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="hover:opacity-80 transition-opacity"
                        title={stock.isFavorite ? '取消收藏' : '加入收藏'}
                      >
                        <motion.div
                          animate={{
                            scale: stock.isFavorite ? [1, 1.2, 1] : 1,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <Star
                            size={18}
                            className={
                              stock.isFavorite
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-600'
                            }
                          />
                        </motion.div>
                      </motion.button>
                    </div>

                    {/* 股票名稱和代碼 */}
                    <div className="flex-1">
                      <div className="text-white font-medium">{stock.name}</div>
                      <div className="text-xs text-gray-500">{stock.symbol}</div>
                    </div>

                    {/* 價格和變化 */}
                    <div className="flex flex-col items-end">
                      <div className={`text-lg font-semibold ${priceColor}`}>
                        {formatPrice(stock.price)}
                      </div>
                      <div className={`text-xs flex items-center gap-1 ${changeColor}`}>
                        {isPricePositive ? (
                          <span>▲ {stock.change.toFixed(2)}%</span>
                        ) : (
                          <span>▼ {Math.abs(stock.change).toFixed(2)}%</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 右側：CHIPS 和 B/B %} */}
                  <div className="flex items-center gap-12">
                    {/* CHIPS */}
                    <div className="text-right w-20">
                      <div className="text-white font-medium">
                        {stock.chips?.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">大戶</div>
                    </div>

                    {/* B/B %} */}
                    <div className="w-32">
                      <div className="relative h-6 bg-gray-800 rounded overflow-hidden">
                        {/* 買入比例（綠色） */}
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-green-500"
                          style={{ width: `${stock.buySellRatio || 0}%` }}
                        ></div>
                        {/* 賣出比例（紅色） */}
                        <div
                          className="absolute right-0 top-0 bottom-0 bg-red-500"
                          style={{
                            width: `${100 - (stock.buySellRatio || 0)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
