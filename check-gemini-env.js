/**
 * 檢查 GEMINI API KEY 環境變數
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 檢查 GEMINI API KEY 環境變數\n');
console.log('='.repeat(60));

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env 文件不存在');
  console.log('請創建 .env 文件並添加 VITE_GEMINI_API_KEY');
  process.exit(1);
}

try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  console.log('\n📄 .env 文件內容:');
  lines.forEach((line, index) => {
    if (line.trim() && !line.trim().startsWith('#')) {
      // 隱藏敏感信息，只顯示變數名
      if (line.includes('VITE_GEMINI_API_KEY')) {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const value = parts.slice(1).join('=').trim();
          if (value && !value.includes('your_gemini_api_key_here') && !value.includes('YOUR')) {
            console.log(`   ✅ 第 ${index + 1} 行: VITE_GEMINI_API_KEY=***已設置***`);
          } else {
            console.log(`   ❌ 第 ${index + 1} 行: VITE_GEMINI_API_KEY=${value} (佔位符或未設置)`);
          }
        }
      } else if (line.includes('VITE_GAS_URL')) {
        console.log(`   ✅ 第 ${index + 1} 行: ${line.trim()}`);
      } else {
        console.log(`   📝 第 ${index + 1} 行: ${line.trim()}`);
      }
    }
  });
  
  // 檢查 VITE_GEMINI_API_KEY
  const geminiKeyLine = lines.find(line => 
    line.trim().startsWith('VITE_GEMINI_API_KEY') && 
    !line.trim().startsWith('#')
  );
  
  console.log('\n🔑 GEMINI API KEY 檢查:');
  if (!geminiKeyLine) {
    console.log('   ❌ 未找到 VITE_GEMINI_API_KEY');
    console.log('   ⚠️  這會導致 AI 智能日報功能無法使用');
    console.log('\n   解決方案:');
    console.log('   1. 在 .env 文件中添加:');
    console.log('      VITE_GEMINI_API_KEY=您的_Gemini_API_Key');
    console.log('   2. 重新構建和部署:');
    console.log('      npm run build');
    console.log('      npm run deploy');
  } else {
    const match = geminiKeyLine.match(/VITE_GEMINI_API_KEY=(.+)/);
    if (match) {
      const value = match[1].trim();
      if (value && !value.includes('your_gemini_api_key_here') && !value.includes('YOUR') && value.length > 10) {
        console.log('   ✅ VITE_GEMINI_API_KEY 已設置');
        console.log('   ✅ 值長度:', value.length, '字符');
      } else {
        console.log('   ❌ VITE_GEMINI_API_KEY 未設置或為佔位符');
        console.log('   ⚠️  請設置真實的 API Key');
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
} catch (error) {
  console.error('❌ 讀取 .env 文件時發生錯誤:', error.message);
  process.exit(1);
}





