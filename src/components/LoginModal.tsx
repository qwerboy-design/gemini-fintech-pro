import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Loader2, AlertCircle, Info } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userId: string) => void;
  googleAppsScriptUrl?: string;
}

/**
 * 登入模態框組件
 */
export function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  googleAppsScriptUrl,
}: LoginModalProps) {
  const [formData, setFormData] = useState({
    userId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 檢查 Google Apps Script 是否已配置
  const isGASConfigured = Boolean(googleAppsScriptUrl && googleAppsScriptUrl.trim() !== '');

  // 當模態框打開時，清除之前的錯誤
  useEffect(() => {
    if (isOpen) {
      setError(null); // 清除之前的錯誤
    }
  }, [isOpen]);

  const handleInputChange = (value: string) => {
    setFormData((prev) => ({ ...prev, userId: value }));
    setError(null); // 清除錯誤訊息
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 驗證輸入
    if (!formData.userId.trim()) {
      setError('請輸入帳號');
      return;
    }

    // 檢查 Google Apps Script 是否已配置
    if (!isGASConfigured) {
      setError(
        'Google Apps Script 未配置。請按照 GOOGLE_APPS_SCRIPT_SETUP.md 的說明進行配置，並在 .env 文件中設置 VITE_GAS_URL 環境變數。'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // TypeScript 類型檢查：此時 googleAppsScriptUrl 已經確認存在（通過 isGASConfigured 檢查）
      const gasUrl = googleAppsScriptUrl!;
      
      // 只在開發環境中輸出詳細日誌
      if (import.meta.env.DEV) {
        console.log('發送登入請求到:', gasUrl);
        console.log('請求數據:', {
          action: 'login',
          userId: formData.userId.trim(),
          timestamp: new Date().toISOString(),
        });
        
        // 額外日誌：檢查環境變數
        console.log('環境變數檢查:', {
          hasGASUrl: !!import.meta.env.VITE_GAS_URL,
          gasUrlFromEnv: import.meta.env.VITE_GAS_URL ? '已設置' : '未設置',
        });
      }

      // 使用 fetch 發送請求
      // 關鍵：嘗試多種方法避免 CORS 預檢請求
      const requestBody = JSON.stringify({
        action: 'login',
        userId: formData.userId.trim(),
        timestamp: new Date().toISOString(),
      });

      let response: Response | null = null;
      let fetchError: unknown = null;

      // 策略 1: 完全不設置 Content-Type header（讓瀏覽器自動處理，最簡單的請求）
      try {
        response = await fetch(gasUrl, {
          method: 'POST',
          // 關鍵：不設置任何 headers，讓瀏覽器自動處理
          // 這樣會變成最簡單的請求，完全避免 CORS 預檢
          body: requestBody,
          mode: 'cors',
        });
        
        // 請求成功（沒有拋出異常），繼續處理響應
        fetchError = null;
      } catch (firstError) {
        fetchError = firstError;
        if (import.meta.env.DEV) {
          console.warn('方法 1 失敗（無 headers），嘗試方法 2 (text/plain):', firstError);
        }
        
        // 策略 2: 使用 text/plain Content-Type（簡單請求的 Content-Type）
        try {
          response = await fetch(gasUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: requestBody,
            mode: 'cors',
          });
          fetchError = null; // 清除錯誤，因為方法 2 成功了
        } catch (secondError) {
          fetchError = secondError;
          response = null; // 確保 response 為 null
          // 兩種方法都失敗，準備拋出詳細錯誤
          if (import.meta.env.DEV) {
            console.error('所有方法都失敗:', { firstError, secondError });
          }
        }
      }

      // 如果所有方法都失敗或 response 為 null，拋出詳細錯誤
      if (!response) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError || '無法獲取響應');
        if (errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('CORS') ||
            errorMessage.includes('blocked') ||
            fetchError instanceof TypeError) {
          throw new Error(
            '無法連接到 Google Apps Script（CORS 錯誤）。\n\n' +
            '請確認以下設置：\n' +
            '1. ✓ 前往 Google Apps Script 編輯器\n' +
            '2. ✓ 點擊「部署」→「管理部署」\n' +
            '3. ✓ 編輯部署，設置「具有存取權的使用者」為「任何人」\n' +
            '4. ✓ 點擊「重新部署」\n\n' +
            '詳細說明請參考：CORS_QUICK_FIX.md 或 LOGIN_TROUBLESHOOTING.md'
          );
        }
        if (fetchError) {
          throw fetchError;
        }
        throw new Error('請求失敗：無法獲取響應');
      }

      // 檢查響應狀態
      if (!response.ok) {
        const errorText = await response.text().catch(() => '無法讀取錯誤訊息');
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `請求失敗: ${response.status}` };
        }
        throw new Error(errorData.message || `請求失敗: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // 登入成功
        onLoginSuccess(formData.userId.trim());
        // 重置表單
        setFormData({ userId: '' });
        onClose();
      } else {
        throw new Error(result.message || '登入失敗');
      }
    } catch (err) {
      // 只在開發環境中輸出詳細錯誤日誌
      if (import.meta.env.DEV) {
        console.error('登入錯誤:', err);
      }
      const errorMessage = err instanceof Error ? err.message : '登入失敗，請稍後再試';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ userId: '' });
      setError(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* 模態框 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-md pointer-events-auto"
            >
              {/* 標題欄 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <h2 className="text-xl font-semibold text-white">登入</h2>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="關閉"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* 表單內容 */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Google Apps Script 未配置警告 */}
                {!isGASConfigured && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg"
                  >
                    <Info size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-yellow-300 font-medium text-sm mb-1">
                        Google Apps Script 未配置
                      </p>
                      <p className="text-yellow-400 text-xs leading-relaxed">
                        請按照 <span className="font-mono text-yellow-300">GOOGLE_APPS_SCRIPT_SETUP.md</span> 的說明進行配置：
                      </p>
                      <ol className="text-yellow-400 text-xs mt-2 ml-4 list-decimal space-y-1">
                        <li>創建 Google Sheet 和 Apps Script 專案</li>
                        <li>部署為 Web App 並獲取 URL</li>
                        <li>在 <span className="font-mono text-yellow-300">.env</span> 文件中設置 <span className="font-mono text-yellow-300">VITE_GAS_URL</span></li>
                      </ol>
                    </div>
                  </motion.div>
                )}

                {/* 錯誤訊息 */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                      !isGASConfigured && error.includes('未配置')
                        ? 'bg-yellow-900/30 border border-yellow-700 text-yellow-300'
                        : 'bg-red-900/30 border border-red-700 text-red-300'
                    }`}
                  >
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* 帳號輸入 */}
                <div>
                  <label
                    htmlFor="userId"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>帳號</span>
                    </div>
                  </label>
                  <input
                    id="userId"
                    type="text"
                    value={formData.userId}
                    onChange={(e) => handleInputChange(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="請輸入您的帳號"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    autoFocus
                  />
                </div>

                {/* 提交按鈕 */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    !isGASConfigured
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                  title={!isGASConfigured ? '點擊以查看配置說明' : ''}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>登入中...</span>
                    </>
                  ) : !isGASConfigured ? (
                    <span>需要配置 Google Apps Script</span>
                  ) : (
                    <span>登入</span>
                  )}
                </button>

                {/* 配置提示 */}
                {isGASConfigured && (
                  <p className="text-xs text-gray-500 text-center">
                    ✓ Google Apps Script 已配置
                  </p>
                )}
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
