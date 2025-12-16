import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Loader2, AlertCircle } from 'lucide-react';

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
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: 'userId' | 'email', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    if (!formData.email.trim()) {
      setError('請輸入電子郵件');
      return;
    }

    // 簡單的電子郵件格式驗證
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('請輸入有效的電子郵件地址');
      return;
    }

    setIsSubmitting(true);

    try {
      // 調用 Google Apps Script API
      if (!googleAppsScriptUrl) {
        throw new Error('Google Apps Script URL 未配置');
      }

      const response = await fetch(googleAppsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          userId: formData.userId.trim(),
          email: formData.email.trim(),
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `請求失敗: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // 登入成功
        onLoginSuccess(formData.userId.trim());
        // 重置表單
        setFormData({ userId: '', email: '' });
        onClose();
      } else {
        throw new Error(result.message || '登入失敗');
      }
    } catch (err) {
      console.error('登入錯誤:', err);
      setError(
        err instanceof Error
          ? err.message
          : '登入失敗，請稍後再試'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ userId: '', email: '' });
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
                {/* 錯誤訊息 */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm"
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
                    onChange={(e) => handleInputChange('userId', e.target.value)}
                    disabled={isSubmitting}
                    placeholder="請輸入您的帳號"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    autoFocus
                  />
                </div>

                {/* 電子郵件輸入 */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <span>電子郵件</span>
                    </div>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isSubmitting}
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* 提交按鈕 */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>登入中...</span>
                    </>
                  ) : (
                    <span>登入</span>
                  )}
                </button>

                {/* 提示訊息 */}
                {!googleAppsScriptUrl && (
                  <p className="text-xs text-gray-500 text-center">
                    注意: Google Apps Script URL 未配置，請在環境變數中設置
                    VITE_GAS_URL
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
