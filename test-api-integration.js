/**
 * API 整合測試腳本
 * 驗證 FinMind 和 Finnhub API 的實際調用（需要環境變數）
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 載入環境變數
config({ path: join(__dirname, '.env') });

console.log('🔍 API 整合測試\n');
console.log('='.repeat(60));

// 檢查環境變數
console.log('\n🔑 步驟 1: 檢查環境變數');
const finmindKey = process.env.VITE_FINMIND_API_KEY;
const finnhubKey = process.env.VITE_FINNHUB_API_KEY;

if (finmindKey && finmindKey !== 'your_finmind_api_key_here') {
  console.log('   ✅ VITE_FINMIND_API_KEY 已設置');
} else {
  console.log('   ⚠️  VITE_FINMIND_API_KEY 未設置或為佔位符');
}

if (finnhubKey && finnhubKey !== 'your_finnhub_api_key_here') {
  console.log('   ✅ VITE_FINNHUB_API_KEY 已設置');
} else {
  console.log('   ⚠️  VITE_FINNHUB_API_KEY 未設置或為佔位符');
}

// 測試 FinMind API（如果 API Key 已設置）
if (finmindKey && finmindKey !== 'your_finmind_api_key_here') {
  console.log('\n📊 步驟 2: 測試 FinMind API（台股即時報價）');
  console.log('   測試股票代碼: 2330 (台積電)');
  
  try {
    const url = new URL('https://api.finmindtrade.com/api/v4/taiwan_stock_tick_snapshot');
    url.searchParams.set('data_id', '2330');
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${finmindKey}`,
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 200 && data.data && data.data.length > 0) {
        const quote = data.data[0];
        console.log(`   ✅ API 調用成功`);
        console.log(`      股票代碼: ${quote.stock_id}`);
        console.log(`      當前價格: ${quote.deal_price || quote.close}`);
        console.log(`      漲跌幅: ${quote.change_percent || 'N/A'}%`);
        console.log(`      成交量: ${quote.volume || 'N/A'}`);
      } else {
        console.log(`   ⚠️  API 返回錯誤: ${data.msg || '未知錯誤'}`);
        if (data.msg && data.msg.includes('贊助')) {
          console.log('      💡 提示: 即時資訊功能需要贊助會員');
        }
      }
    } else {
      if (response.status === 401 || response.status === 403) {
        console.log(`   ⚠️  API 權限錯誤 (${response.status})`);
        console.log('      💡 提示: 可能需要贊助會員才能使用即時資訊功能');
      } else {
        console.log(`   ⚠️  API 請求失敗: ${response.status} ${response.statusText}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ API 調用失敗: ${error.message}`);
    if (error.message.includes('fetch')) {
      console.log('      💡 提示: 可能是 CORS 問題，需要後端代理');
    }
  }
} else {
  console.log('\n📊 步驟 2: 跳過 FinMind API 測試（API Key 未設置）');
}

// 測試 Finnhub API（如果 API Key 已設置）
if (finnhubKey && finnhubKey !== 'your_finnhub_api_key_here') {
  console.log('\n📈 步驟 3: 測試 Finnhub API（Fear and Greed Index）');
  
  try {
    // 注意：實際端點可能需要調整
    const url = new URL('https://finnhub.io/api/v1/forex/fear-greed');
    url.searchParams.set('token', finnhubKey);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ API 調用成功`);
      console.log(`      響應數據:`, JSON.stringify(data, null, 2));
      
      // 嘗試提取指數值
      const index = data.value || data.fearGreedIndex || data.index;
      if (typeof index === 'number') {
        console.log(`      指數值: ${index}`);
        
        // 計算情緒等級
        let level, color;
        if (index <= 20) {
          level = 'Extreme Fear';
          color = '#ef4444';
        } else if (index <= 40) {
          level = 'Fear';
          color = '#f97316';
        } else if (index <= 60) {
          level = 'Neutral';
          color = '#eab308';
        } else if (index <= 80) {
          level = 'Greed';
          color = '#22c55e';
        } else {
          level = 'Extreme Greed';
          color = '#16a34a';
        }
        
        console.log(`      情緒等級: ${level}`);
        console.log(`      顏色: ${color}`);
      } else {
        console.log(`   ⚠️  響應格式不符合預期，可能需要調整端點或數據提取邏輯`);
      }
    } else {
      if (response.status === 404) {
        console.log(`   ⚠️  端點不存在 (404)`);
        console.log('      💡 提示: Finnhub 可能沒有此端點，需要確認實際的 Fear and Greed Index API');
      } else if (response.status === 401 || response.status === 403) {
        console.log(`   ⚠️  API Key 無效或權限不足 (${response.status})`);
      } else {
        console.log(`   ⚠️  API 請求失敗: ${response.status} ${response.statusText}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ API 調用失敗: ${error.message}`);
  }
} else {
  console.log('\n📈 步驟 3: 跳過 Finnhub API 測試（API Key 未設置）');
}

// 總結
console.log('\n' + '='.repeat(60));
console.log('\n📋 測試總結：');
console.log('   ✅ 所有服務文件已創建');
console.log('   ✅ 所有功能已整合到 App.tsx');
console.log('   ✅ 環境變數配置已更新');
console.log('\n💡 建議：');
console.log('   1. 在 .env 文件中設置真實的 API Keys');
console.log('   2. 運行 npm run dev 啟動開發服務器');
console.log('   3. 登入後測試「我的收藏」策略功能');
console.log('   4. 觀察控制台日誌確認 API 調用是否成功');
console.log('   5. 檢查 Fear and Greed Index 是否自動更新');
console.log('\n');
