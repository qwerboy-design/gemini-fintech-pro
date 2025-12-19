import { GoogleGenAI } from '@google/genai';

/**
 * Gemini API 服務
 * 
 * 提供 AI 智能日報功能，使用 Google Gemini 2.5 Flash Lite API 生成股市分析報告
 * 搭配 Grounding Metadata 確保回應基於真實的網路搜尋結果
 */

const CACHE_KEY = 'gemini-fintech-ai-daily-report';

/**
 * 快取資料格式
 */
interface CachedReport {
  content: string;
  date: string; // YYYY-MM-DD
}

/**
 * 獲取今天的日期字串（YYYY-MM-DD）
 */
function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * 從 localStorage 載入快取的報告
 */
function loadCachedReport(): CachedReport | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as CachedReport;
      // 檢查是否為今天的報告
      if (parsed.date === getTodayDateString()) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('載入快取報告失敗:', error);
  }
  return null;
}

/**
 * 保存報告到 localStorage
 */
function saveCachedReport(content: string): void {
  try {
    const report: CachedReport = {
      content,
      date: getTodayDateString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(report));
  } catch (error) {
    console.error('保存快取報告失敗:', error);
  }
}

/**
 * 獲取每日股市報告
 * 
 * @returns 報告內容（500 字以內）
 * @throws 如果 API Key 缺失或 API 呼叫失敗
 */
export async function getDailyMarketReport(): Promise<string> {
  // 檢查快取
  const cached = loadCachedReport();
  if (cached) {
    return cached.content;
  }

  // 檢查 API Key
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key 未配置。請在環境變數中設置 VITE_GEMINI_API_KEY');
  }

  try {
    // 初始化 Gemini API 客戶端
    const genAI = new GoogleGenAI({ apiKey });

    // 獲取今天的日期（用於提示詞）
    const today = new Date();
    const todayString = today.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // 構建提示詞（包含今天的日期，明確要求使用 grounding）
    const prompt = `請提供今日(${todayString})台灣股市的重要資訊和分析，包括：
1. 市場整體表現
2. 重要個股動態
3. 產業趨勢
4. 投資建議

**重要**：請使用 Google Search 獲取最新的市場資訊和數據，確保資訊的準確性和時效性。
請以簡潔明瞭的方式呈現，總字數控制在 500 字以內。`;

    // 配置 Grounding 功能（強制啟用 Google Search grounding）
    // 這確保所有回應都基於真實的網路搜尋結果
    // Gemini 2.5 Flash Lite 支援 Grounding Metadata，可追蹤引用來源
    const config = {
      tools: [
        {
          googleSearch: {
            // 強制使用 grounding，確保回應基於真實資料
            // 啟用後，API 會自動返回 groundingMetadata
            // 包含 webSearchQueries、groundingChunks 等資訊
          },
        },
      ],
      // 確保返回完整的 grounding metadata
      // 這將包含搜索查詢、引用來源和支援資訊
    };

    // 呼叫 API（設置超時）
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('API 呼叫超時')), 30000); // 30 秒超時
    });

    const apiPromise = genAI.models.generateContent({
      model: 'gemini-2.5-flash-lite', // 使用 Gemini 2.5 Flash Lite 模型
      contents: prompt,
      config,
    });
    const response = await Promise.race([apiPromise, timeoutPromise]);

    // 提取回應內容
    let content = response.text;

    // 提取 grounding metadata（引用來源）
    // 當啟用 Google Search grounding 時，API 會自動返回 groundingMetadata
    try {
      // 檢查響應中是否包含 grounding metadata
      // 注意：@google/genai 包的實際響應結構可能不同，需要根據實際情況調整
      const responseData = response as unknown as {
        groundingMetadata?: {
          webSearchQueries?: string[];
          groundingChunks?: Array<{
            web?: {
              uri?: string;
              title?: string;
            };
            retrievedContext?: {
              uri?: string;
              title?: string;
            };
            maps?: {
              uri?: string;
              title?: string;
            };
          }>;
          groundingSupports?: Array<{
            segment?: { startIndex?: number; endIndex?: number };
            groundingChunkIndices?: number[];
          }>;
        };
      };

      if (responseData.groundingMetadata) {
        const groundingInfo = responseData.groundingMetadata;
        
        // 記錄 grounding 資訊（用於調試和驗證）
        if (import.meta.env.DEV) {
          console.log('✅ Grounding 功能已啟用 (Gemini 2.5 Flash Lite)');
          console.log('Grounding Metadata:', {
            searchQueries: groundingInfo.webSearchQueries || [],
            chunksCount: groundingInfo.groundingChunks?.length || 0,
            supportsCount: groundingInfo.groundingSupports?.length || 0,
          });
        }
        
        // 提取引用來源並添加到內容末尾
        if (groundingInfo.groundingChunks && groundingInfo.groundingChunks.length > 0) {
          const sources: Array<{ uri: string; title?: string }> = [];
          
          groundingInfo.groundingChunks.forEach((chunk) => {
            // 優先使用 web 來源（最常見）
            if (chunk.web?.uri) {
              sources.push({
                uri: chunk.web.uri,
                title: chunk.web.title,
              });
            } else if (chunk.retrievedContext?.uri) {
              sources.push({
                uri: chunk.retrievedContext.uri,
                title: chunk.retrievedContext.title,
              });
            } else if (chunk.maps?.uri) {
              sources.push({
                uri: chunk.maps.uri,
                title: chunk.maps.title,
              });
            }
          });
          
          // 去重（基於 URI）並限制數量
          const uniqueSources = Array.from(
            new Map(sources.map((s) => [s.uri, s])).values()
          ).slice(0, 3);
          
          if (uniqueSources.length > 0) {
            content += '\n\n📚 資料來源（Grounding Metadata）：';
            uniqueSources.forEach((source, index) => {
              if (source.title) {
                content += `\n${index + 1}. ${source.title}\n   ${source.uri}`;
              } else {
                content += `\n${index + 1}. ${source.uri}`;
              }
            });
          }
        }
        
        // 如果有搜索查詢，也可以顯示（開發環境）
        if (import.meta.env.DEV && groundingInfo.webSearchQueries && groundingInfo.webSearchQueries.length > 0) {
          console.log('🔍 使用的搜索查詢:', groundingInfo.webSearchQueries);
        }
      } else {
        // 如果沒有 grounding metadata，記錄警告（開發環境）
        if (import.meta.env.DEV) {
          console.warn('⚠️ 警告：未檢測到 grounding metadata，請確認 grounding 功能已正確啟用');
        }
      }
    } catch (error) {
      // 如果提取 grounding metadata 失敗，不影響主要功能
      if (import.meta.env.DEV) {
        console.warn('提取 grounding metadata 時發生錯誤:', error);
      }
    }

    // 檢查內容是否存在
    if (!content || typeof content !== 'string') {
      throw new Error('API 回應格式錯誤：未返回有效文字內容');
    }

    // 確保內容不超過 500 字
    if (content.length > 500) {
      content = content.substring(0, 500) + '...';
    }

    // 保存到快取
    saveCachedReport(content);

    return content;
  } catch (error) {
    if (error instanceof Error) {
      // 處理特定錯誤
      if (error.message.includes('API_KEY')) {
        throw new Error('Gemini API Key 無效，請檢查環境變數設置');
      }
      if (error.message.includes('超時')) {
        throw new Error('API 呼叫超時，請稍後再試');
      }
      throw new Error(`獲取 AI 報告失敗: ${error.message}`);
    }
    throw new Error('獲取 AI 報告時發生未知錯誤');
  }
}

/**
 * 清除快取（用於測試或強制刷新）
 */
export function clearReportCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('清除快取失敗:', error);
  }
}

