/**
 * 測試環境設置
 */
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// 每次測試後清理
afterEach(() => {
  cleanup();
});

// Mock 環境變數
Object.defineProperty(import.meta, 'env', {
  value: {
    ...import.meta.env,
    VITE_FINMIND_API_KEY: 'test_finmind_key',
    VITE_FINNHUB_API_KEY: 'test_finnhub_key',
    DEV: true,
  },
  writable: true,
});
