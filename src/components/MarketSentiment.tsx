import type { MarketSentiment as MarketSentimentType } from '../types/stock';

interface MarketSentimentProps {
  sentiment: MarketSentimentType;
}

/**
 * 市場情緒指標組件
 */
export function MarketSentiment({ sentiment }: MarketSentimentProps) {
  const getGaugePosition = (index: number) => {
    // 指數範圍 0-100，映射到 0-100% 位置
    return `${index}%`;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-xs text-gray-400 uppercase tracking-wider">MARKET SENTIMENT</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-red-500 mb-1">{sentiment.level}</h2>
          <p className="text-sm text-gray-400">Fear & Greed Index</p>
        </div>

        <div className="flex items-center gap-4">
          {/* 情緒指標條 */}
          <div className="relative w-48 h-6 bg-gray-800 rounded-full overflow-hidden">
            {/* 顏色分段 */}
            <div className="absolute inset-0 flex">
              <div className="flex-1 bg-red-600"></div>
              <div className="flex-1 bg-orange-500"></div>
              <div className="flex-1 bg-yellow-500"></div>
              <div className="flex-1 bg-green-400"></div>
              <div className="flex-1 bg-green-600"></div>
            </div>
            {/* 指針 */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white"
              style={{ left: getGaugePosition(sentiment.index) }}
            ></div>
          </div>

          {/* 指數數字 */}
          <div className="text-4xl font-bold text-white">{sentiment.index}</div>
        </div>
      </div>
    </div>
  );
}
