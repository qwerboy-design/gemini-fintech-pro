/**
 * FinMind API 服務單元測試
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStockQuote, getStockQuotes } from '../finmindService';

// Mock fetch
global.fetch = vi.fn();

describe('FinMind API 服務', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 設置環境變數
    Object.defineProperty(import.meta, 'env', {
      value: {
        ...import.meta.env,
        VITE_FINMIND_API_KEY: 'test_finmind_key',
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStockQuote', () => {
    it('應該在 API Key 缺失時返回 null', async () => {
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...import.meta.env,
          VITE_FINMIND_API_KEY: undefined,
        },
        writable: true,
      });

      const result = await getStockQuote('2330');
      expect(result).toBeNull();
    });

    it('應該成功獲取股票報價', async () => {
      const mockResponse = {
        status: 200,
        msg: 'success',
        data: [
          {
            stock_id: '2330',
            deal_price: 550.5,
            change: 5.5,
            change_percent: 1.01,
            volume: 10000000,
            high: 555,
            low: 545,
            open: 548,
            close: 545,
          },
        ],
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getStockQuote('2330');

      expect(result).not.toBeNull();
      expect(result?.symbol).toBe('2330');
      expect(result?.price).toBe(550.5);
      expect(result?.change).toBe(1.01);
      expect(result?.volume).toBe(10000000);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('taiwan_stock_tick_snapshot'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test_finmind_key',
          }),
        })
      );
    });

    it('應該處理 API 錯誤響應', async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const result = await getStockQuote('2330');
      expect(result).toBeNull();
    });

    it('應該處理空數據響應', async () => {
      const mockResponse = {
        status: 200,
        msg: 'success',
        data: [],
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getStockQuote('2330');
      expect(result).toBeNull();
    });

    it('應該處理網路錯誤', async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await getStockQuote('2330');
      expect(result).toBeNull();
    });
  });

  describe('getStockQuotes', () => {
    it('應該在 API Key 缺失時返回空 Map', async () => {
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...import.meta.env,
          VITE_FINMIND_API_KEY: undefined,
        },
        writable: true,
      });

      const result = await getStockQuotes(['2330', '2317']);
      expect(result.size).toBe(0);
    });

    it('應該處理空陣列', async () => {
      const result = await getStockQuotes([]);
      expect(result.size).toBe(0);
    });

    it('應該成功批量獲取多個股票報價', async () => {
      const mockResponse = {
        status: 200,
        msg: 'success',
        data: [
          {
            stock_id: '2330',
            deal_price: 550.5,
            change: 5.5,
            change_percent: 1.01,
            volume: 10000000,
            high: 555,
            low: 545,
            open: 548,
            close: 545,
          },
          {
            stock_id: '2317',
            deal_price: 105.5,
            change: 2.3,
            change_percent: 2.23,
            volume: 5000000,
            high: 106,
            low: 104,
            open: 105,
            close: 103.2,
          },
        ],
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getStockQuotes(['2330', '2317']);

      expect(result.size).toBe(2);
      expect(result.get('2330')).toBeDefined();
      expect(result.get('2317')).toBeDefined();
      expect(result.get('2330')?.price).toBe(550.5);
      expect(result.get('2317')?.price).toBe(105.5);
    });

    it('應該去重股票代碼', async () => {
      const mockResponse = {
        status: 200,
        msg: 'success',
        data: [
          {
            stock_id: '2330',
            deal_price: 550.5,
            change: 5.5,
            change_percent: 1.01,
            volume: 10000000,
            high: 555,
            low: 545,
            open: 548,
            close: 545,
          },
        ],
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // 傳入重複的股票代碼
      const result = await getStockQuotes(['2330', '2330', '2330']);

      // 應該只調用一次 API
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.size).toBe(1);
    });

    it('應該在批量查詢失敗時使用並行查詢作為 fallback', async () => {
      // 第一次請求失敗（批量查詢）
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      // 後續並行查詢成功
      const mockResponse1 = {
        status: 200,
        msg: 'success',
        data: [
          {
            stock_id: '2330',
            deal_price: 550.5,
            change: 5.5,
            change_percent: 1.01,
            volume: 10000000,
            high: 555,
            low: 545,
            open: 548,
            close: 545,
          },
        ],
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse1,
      });

      const mockResponse2 = {
        status: 200,
        msg: 'success',
        data: [
          {
            stock_id: '2317',
            deal_price: 105.5,
            change: 2.3,
            change_percent: 2.23,
            volume: 5000000,
            high: 106,
            low: 104,
            open: 105,
            close: 103.2,
          },
        ],
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse2,
      });

      const result = await getStockQuotes(['2330', '2317']);

      // 應該嘗試批量查詢，然後使用並行查詢
      expect(result.size).toBeGreaterThan(0);
    });
  });
});




