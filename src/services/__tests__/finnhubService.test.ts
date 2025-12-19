/**
 * Finnhub API 服務單元測試
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getFearGreedIndex } from '../finnhubService';

// Mock fetch
global.fetch = vi.fn();

describe('Finnhub API 服務', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 設置環境變數
    Object.defineProperty(import.meta, 'env', {
      value: {
        ...import.meta.env,
        VITE_FINNHUB_API_KEY: 'test_finnhub_key',
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getFearGreedIndex', () => {
    it('應該在 API Key 缺失時返回 null', async () => {
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...import.meta.env,
          VITE_FINNHUB_API_KEY: undefined,
        },
        writable: true,
      });

      const result = await getFearGreedIndex();
      expect(result).toBeNull();
    });

    it('應該成功獲取 Fear and Greed Index（使用 value 欄位）', async () => {
      const mockResponse = {
        value: 45,
        timestamp: Date.now(),
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFearGreedIndex();

      expect(result).not.toBeNull();
      expect(result?.index).toBe(45);
      expect(result?.level).toBe('Neutral');
      expect(result?.color).toBe('#eab308');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('fear-greed'),
        expect.any(Object)
      );
    });

    it('應該成功獲取 Fear and Greed Index（使用 fearGreedIndex 欄位）', async () => {
      const mockResponse = {
        fearGreedIndex: 75,
        timestamp: Date.now(),
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFearGreedIndex();

      expect(result).not.toBeNull();
      expect(result?.index).toBe(75);
      expect(result?.level).toBe('Greed');
      expect(result?.color).toBe('#22c55e');
    });

    it('應該正確映射 Extreme Fear 等級（0-20）', async () => {
      const mockResponse = {
        value: 15,
        timestamp: Date.now(),
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFearGreedIndex();

      expect(result?.level).toBe('Extreme Fear');
      expect(result?.color).toBe('#ef4444');
    });

    it('應該正確映射 Fear 等級（21-40）', async () => {
      const mockResponse = {
        value: 30,
        timestamp: Date.now(),
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFearGreedIndex();

      expect(result?.level).toBe('Fear');
      expect(result?.color).toBe('#f97316');
    });

    it('應該正確映射 Neutral 等級（41-60）', async () => {
      const mockResponse = {
        value: 50,
        timestamp: Date.now(),
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFearGreedIndex();

      expect(result?.level).toBe('Neutral');
      expect(result?.color).toBe('#eab308');
    });

    it('應該正確映射 Greed 等級（61-80）', async () => {
      const mockResponse = {
        value: 70,
        timestamp: Date.now(),
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFearGreedIndex();

      expect(result?.level).toBe('Greed');
      expect(result?.color).toBe('#22c55e');
    });

    it('應該正確映射 Extreme Greed 等級（81-100）', async () => {
      const mockResponse = {
        value: 90,
        timestamp: Date.now(),
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFearGreedIndex();

      expect(result?.level).toBe('Extreme Greed');
      expect(result?.color).toBe('#16a34a');
    });

    it('應該將指數值限制在 0-100 範圍內', async () => {
      const mockResponse = {
        value: 150, // 超出範圍
        timestamp: Date.now(),
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFearGreedIndex();

      expect(result?.index).toBe(100);
      expect(result?.level).toBe('Extreme Greed');
    });

    it('應該處理負數指數值', async () => {
      const mockResponse = {
        value: -10, // 負數
        timestamp: Date.now(),
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFearGreedIndex();

      expect(result?.index).toBe(0);
      expect(result?.level).toBe('Extreme Fear');
    });

    it('應該處理 API 404 錯誤（端點不存在）', async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await getFearGreedIndex();
      expect(result).toBeNull();
    });

    it('應該處理 API 401/403 錯誤（權限不足）', async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const result = await getFearGreedIndex();
      expect(result).toBeNull();
    });

    it('應該處理不符合預期的響應格式', async () => {
      const mockResponse = {
        someOtherField: 50,
        // 沒有 value, fearGreedIndex, 或 index 欄位
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFearGreedIndex();
      expect(result).toBeNull();
    });

    it('應該處理網路錯誤', async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await getFearGreedIndex();
      expect(result).toBeNull();
    });
  });
});



