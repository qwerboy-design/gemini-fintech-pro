/**
 * StrategyButtons 組件單元測試
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrategyButtons } from '../StrategyButtons';

describe('StrategyButtons 組件', () => {
  it('應該渲染所有策略按鈕', () => {
    const mockOnStrategyChange = vi.fn();
    
    render(
      <StrategyButtons
        activeStrategy="all"
        onStrategyChange={mockOnStrategyChange}
      />
    );

    expect(screen.getByText('所有策略')).toBeInTheDocument();
    expect(screen.getByText('多頭排列')).toBeInTheDocument();
    expect(screen.getByText('法人抬轎')).toBeInTheDocument();
    expect(screen.getByText('軋空警訊')).toBeInTheDocument();
    expect(screen.getByText('我的收藏')).toBeInTheDocument();
  });

  it('應該在點擊時調用 onStrategyChange', () => {
    const mockOnStrategyChange = vi.fn();
    
    render(
      <StrategyButtons
        activeStrategy="all"
        onStrategyChange={mockOnStrategyChange}
      />
    );

    const favoritesButton = screen.getByText('我的收藏');
    fireEvent.click(favoritesButton);

    expect(mockOnStrategyChange).toHaveBeenCalledWith('favorites');
  });

  it('應該正確顯示活動策略的樣式', () => {
    const mockOnStrategyChange = vi.fn();
    
    const { rerender } = render(
      <StrategyButtons
        activeStrategy="favorites"
        onStrategyChange={mockOnStrategyChange}
      />
    );

    const favoritesButton = screen.getByText('我的收藏').closest('button');
    expect(favoritesButton).toHaveClass('bg-purple-600');

    // 切換到其他策略
    rerender(
      <StrategyButtons
        activeStrategy="bullish"
        onStrategyChange={mockOnStrategyChange}
      />
    );

    const bullishButton = screen.getByText('多頭排列').closest('button');
    expect(bullishButton).toHaveClass('bg-purple-600');
    expect(favoritesButton).not.toHaveClass('bg-purple-600');
  });
});

