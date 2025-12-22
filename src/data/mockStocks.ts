import type { Stock } from '../types/stock';

/**
 * 模擬股票數據（台灣股票）
 */
export const mockStocks: Stock[] = [
  {
    symbol: '3443',
    name: '創意',
    price: 1629,
    change: 6.12,
    volume: 52345678,
    marketCap: 2750000000000,
    rank: 1,
    isFavorite: true,
    chips: 68.5,
    buySellRatio: 85,
  },
  {
    symbol: '3653',
    name: '健策',
    price: 919.2,
    change: -7.8,
    volume: 23456789,
    marketCap: 1850000000000,
    rank: 2,
    isFavorite: false,
    chips: 45.2,
    buySellRatio: 35,
  },
  {
    symbol: '2330',
    name: '台積電',
    price: 992.8,
    change: 3.5,
    volume: 34567890,
    marketCap: 2810000000000,
    rank: 3,
    isFavorite: true,
    chips: 72.3,
    buySellRatio: 20,
  },
  {
    symbol: '3661',
    name: '世芯-KY',
    price: 2368,
    change: -2.1,
    volume: 78901234,
    marketCap: 789000000000,
    rank: 4,
    isFavorite: false,
    chips: 55.8,
    buySellRatio: 60,
  },
  {
    symbol: '3231',
    name: '緯創',
    price: 111.9,
    change: 1.2,
    volume: 45678901,
    marketCap: 1560000000000,
    rank: 5,
    isFavorite: false,
    chips: 42.1,
    buySellRatio: 70,
  },
  {
    symbol: '2382',
    name: '廣達',
    price: 297,
    change: 4.8,
    volume: 67890123,
    marketCap: 1198000000000,
    rank: 6,
    isFavorite: false,
    chips: 58.6,
    buySellRatio: 75,
  },
];










