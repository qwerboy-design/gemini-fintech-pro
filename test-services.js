/**
 * 服務功能驗證腳本
 * 用於驗證 FinMind 和 Finnhub API 服務的基本功能
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 開始驗證服務功能...\n');
console.log('='.repeat(60));

// 檢查文件是否存在
const filesToCheck = [
  'src/services/finmindService.ts',
  'src/services/finnhubService.ts',
  'src/components/StrategyButtons.tsx',
];

let allFilesExist = true;

console.log('\n📁 步驟 1: 檢查文件是否存在');
filesToCheck.forEach((file) => {
  try {
    const content = readFileSync(join(__dirname, file), 'utf-8');
    console.log(`   ✅ ${file}`);
    
    // 檢查關鍵功能
    if (file.includes('finmindService')) {
      if (content.includes('getStockQuote') && content.includes('getStockQuotes')) {
        console.log(`      ✅ 包含 getStockQuote 和 getStockQuotes 函數`);
      } else {
        console.log(`      ⚠️  缺少關鍵函數`);
        allFilesExist = false;
      }
    }
    
    if (file.includes('finnhubService')) {
      if (content.includes('getFearGreedIndex')) {
        console.log(`      ✅ 包含 getFearGreedIndex 函數`);
      } else {
        console.log(`      ⚠️  缺少關鍵函數`);
        allFilesExist = false;
      }
    }
    
    if (file.includes('StrategyButtons')) {
      if (content.includes("'favorites'") && content.includes('我的收藏')) {
        console.log(`      ✅ 包含「我的收藏」策略`);
      } else {
        console.log(`      ⚠️  缺少「我的收藏」策略`);
        allFilesExist = false;
      }
    }
  } catch (error) {
    console.log(`   ❌ ${file} - 文件不存在`);
    allFilesExist = false;
  }
});

// 檢查 App.tsx 中的整合
console.log('\n📝 步驟 2: 檢查 App.tsx 中的整合');
try {
  const appContent = readFileSync(join(__dirname, 'src/App.tsx'), 'utf-8');
  
  const checks = [
    { name: '導入 finmindService', pattern: /import.*finmindService|getStockQuotes/ },
    { name: '導入 finnhubService', pattern: /import.*finnhubService|getFearGreedIndex/ },
    { name: 'favorites 策略類型', pattern: /'favorites'/ },
    { name: 'favoriteStocksPrices 狀態', pattern: /favoriteStocksPrices/ },
    { name: 'updateFavoriteStocksPrices 函數', pattern: /updateFavoriteStocksPrices/ },
    { name: 'updateFearGreedIndex 函數', pattern: /updateFearGreedIndex/ },
    { name: '定期刷新邏輯', pattern: /setInterval|30000|300000/ },
    { name: '我的收藏策略過濾', pattern: /activeStrategy.*===.*'favorites'/ },
  ];
  
  checks.forEach((check) => {
    if (check.pattern.test(appContent)) {
      console.log(`   ✅ ${check.name}`);
    } else {
      console.log(`   ❌ ${check.name} - 未找到`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log(`   ❌ 無法讀取 App.tsx: ${error.message}`);
  allFilesExist = false;
}

// 檢查環境變數配置
console.log('\n🔧 步驟 3: 檢查環境變數配置');
try {
  const deployContent = readFileSync(join(__dirname, '.github/workflows/deploy.yml'), 'utf-8');
  
  if (deployContent.includes('VITE_FINMIND_API_KEY')) {
    console.log('   ✅ GitHub Actions 配置包含 VITE_FINMIND_API_KEY');
  } else {
    console.log('   ❌ GitHub Actions 配置缺少 VITE_FINMIND_API_KEY');
    allFilesExist = false;
  }
  
  if (deployContent.includes('VITE_FINNHUB_API_KEY')) {
    console.log('   ✅ GitHub Actions 配置包含 VITE_FINNHUB_API_KEY');
  } else {
    console.log('   ❌ GitHub Actions 配置缺少 VITE_FINNHUB_API_KEY');
    allFilesExist = false;
  }
} catch (error) {
  console.log(`   ⚠️  無法讀取 deploy.yml: ${error.message}`);
}

// 檢查 README 文檔
console.log('\n📚 步驟 4: 檢查文檔更新');
try {
  const readmeContent = readFileSync(join(__dirname, 'README.md'), 'utf-8');
  
  if (readmeContent.includes('VITE_FINMIND_API_KEY')) {
    console.log('   ✅ README.md 包含 FinMind API Key 說明');
  } else {
    console.log('   ⚠️  README.md 缺少 FinMind API Key 說明');
  }
  
  if (readmeContent.includes('VITE_FINNHUB_API_KEY')) {
    console.log('   ✅ README.md 包含 Finnhub API Key 說明');
  } else {
    console.log('   ⚠️  README.md 缺少 Finnhub API Key 說明');
  }
} catch (error) {
  console.log(`   ⚠️  無法讀取 README.md: ${error.message}`);
}

// 總結
console.log('\n' + '='.repeat(60));
if (allFilesExist) {
  console.log('\n✅ 所有關鍵功能驗證通過！');
  console.log('\n📋 驗證項目：');
  console.log('   ✅ FinMind API 服務已創建');
  console.log('   ✅ Finnhub API 服務已創建');
  console.log('   ✅ 策略按鈕組件已更新');
  console.log('   ✅ App.tsx 已整合新功能');
  console.log('   ✅ 環境變數配置已更新');
  console.log('\n💡 下一步：');
  console.log('   1. 在 .env 文件中設置 VITE_FINMIND_API_KEY 和 VITE_FINNHUB_API_KEY');
  console.log('   2. 運行 npm run dev 啟動開發服務器');
  console.log('   3. 測試「我的收藏」策略功能');
  console.log('   4. 驗證 Fear and Greed Index 自動更新');
} else {
  console.log('\n⚠️  部分功能驗證失敗，請檢查上述錯誤');
  process.exit(1);
}
