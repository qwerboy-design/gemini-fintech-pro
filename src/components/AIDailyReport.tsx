import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface AIDailyReportProps {
  content: string | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

/**
 * AI 智能日報組件
 * 
 * 顯示由 Gemini API 生成的每日股市分析報告
 */
export function AIDailyReport({
  content,
  isLoading,
  error,
  onRetry,
}: AIDailyReportProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (onRetry && !isRetrying) {
      setIsRetrying(true);
      try {
        await onRetry();
      } finally {
        setIsRetrying(false);
      }
    }
  };

  // 獲取今天的日期
  const today = new Date();
  const dateString = today.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
      {/* 標題和日期 */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">AI 智能日報</h2>
          <p className="text-sm text-gray-400">{dateString}</p>
        </div>
        {onRetry && (error || (!isLoading && content)) && (
          <button
            onClick={handleRetry}
            disabled={isRetrying || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
            title="重新載入報告"
          >
            <RefreshCw
              size={16}
              className={isRetrying ? 'animate-spin' : ''}
            />
            <span>重新載入</span>
          </button>
        )}
      </div>

      {/* 載入狀態 */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 size={48} className="text-purple-500 animate-spin" />
          <p className="text-gray-400">正在生成 AI 報告...</p>
        </div>
      )}

      {/* 錯誤狀態 */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle size={48} className="text-red-500" />
          <div className="text-center space-y-2">
            <p className="text-red-400 font-medium">載入報告失敗</p>
            <p className="text-gray-400 text-sm max-w-md">{error}</p>
            {onRetry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isRetrying ? '重試中...' : '重試'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 報告內容 */}
      {content && !isLoading && !error && (
        <div className="prose prose-invert max-w-none">
          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      )}

      {/* 空狀態（不應該出現，但作為安全措施） */}
      {!content && !isLoading && !error && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <p className="text-gray-400">暫無報告內容</p>
          {onRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              載入報告
            </button>
          )}
        </div>
      )}
    </div>
  );
}






