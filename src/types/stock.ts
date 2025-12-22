/**
 * 股票資料類型定義
 */

export interface Stock {
  /** 股票代碼 */
  symbol: string;
  /** 公司名稱 */
  name: string;
  /** 當前價格 */
  price: number;
  /** 價格變化（百分比） */
  change: number;
  /** 成交量（可選） */
  volume?: number;
  /** 市值（可選） */
  marketCap?: number;
  /** 排名 */
  rank?: number;
  /** 是否收藏 */
  isFavorite?: boolean;
  /** 大戶持股比例（CHIPS） */
  chips?: number;
  /** 買賣比（B/B %） */
  buySellRatio?: number;
}

export interface StockPriceHistory {
  /** 日期時間戳 */
  timestamp: number;
  /** 價格 */
  price: number;
  /** 成交量 */
  volume?: number;
}

export interface MarketSentiment {
  /** 情緒等級 */
  level: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  /** 指數值 */
  index: number;
  /** 顏色 */
  color: string;
}










