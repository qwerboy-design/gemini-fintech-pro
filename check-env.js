/**
 * 環境變數診斷工具
 * 使用方法: node check-env.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Google Apps Script 環境變數診斷工具\n');
console.log('=' .repeat(60));

// 1. 檢查 .env 文件是否存在
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

console.log('\n📁 步驟 1: 檢查 .env 文件');
console.log(`   文件路徑: ${envPath}`);
console.log(`   文件存在: ${envExists ? '✅ 是' : '❌ 否'}`);

if (!envExists) {
  console.log('\n   ⚠️  .env 文件不存在！');
  console.log('   請在專案根目錄創建 .env 文件');
  console.log('   內容範例:');
  console.log('   VITE_GAS_URL=https://script.google.com/macros/s/YOUR_ID/exec\n');
  process.exit(1);
}

// 2. 讀取並檢查 .env 文件內容
console.log('\n📄 步驟 2: 檢查 .env 文件內容');

try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

  console.log(`   總行數: ${lines.length}`);

  // 查找 VITE_GAS_URL
  const gasUrlLine = lines.find(line => line.trim().startsWith('VITE_GAS_URL'));
  
  if (!gasUrlLine) {
    console.log('\n   ❌ 未找到 VITE_GAS_URL 變數');
    console.log('   請在 .env 文件中添加:');
    console.log('   VITE_GAS_URL=https://script.google.com/macros/s/YOUR_ID/exec\n');
    process.exit(1);
  }

  console.log(`   ✅ 找到 VITE_GAS_URL: ${gasUrlLine.trim()}`);

  // 3. 檢查格式問題
  console.log('\n🔍 步驟 3: 檢查格式問題');

  const issues = [];

  // 檢查是否有引號
  if (gasUrlLine.includes('"') || gasUrlLine.includes("'")) {
    issues.push('⚠️  警告: URL 包含引號（應移除）');
  }

  // 檢查等號兩邊是否有空格
  if (gasUrlLine.includes(' = ') || gasUrlLine.match(/^\s*VITE_GAS_URL\s+=\s+/)) {
    issues.push('⚠️  警告: 等號兩邊有空格（應移除）');
  }

  // 檢查變數名
  if (!gasUrlLine.trim().startsWith('VITE_GAS_URL=')) {
    issues.push('⚠️  警告: 變數名稱格式可能有問題');
  }

  // 提取 URL
  const urlMatch = gasUrlLine.match(/VITE_GAS_URL=(.+)/);
  if (urlMatch) {
    let url = urlMatch[1].trim();
    // 移除可能的引號
    url = url.replace(/^["']|["']$/g, '');
    
    console.log(`   URL: ${url}`);

    // 驗證 URL 格式
    if (!url.startsWith('https://script.google.com/macros/s/')) {
      issues.push('❌ 錯誤: URL 格式不正確（應以 https://script.google.com/macros/s/ 開頭）');
    } else if (!url.endsWith('/exec')) {
      issues.push('❌ 錯誤: URL 應以 /exec 結尾');
    } else {
      console.log('   ✅ URL 格式正確');
    }
  } else {
    issues.push('❌ 錯誤: 無法解析 URL');
  }

  // 顯示所有問題
  if (issues.length > 0) {
    console.log('\n   發現的問題:');
    issues.forEach(issue => console.log(`   ${issue}`));
  } else {
    console.log('\n   ✅ 格式檢查通過');
  }

  // 4. 檢查 Code.gs 中的 SHEET_ID
  console.log('\n📝 步驟 4: 檢查 Google Apps Script 配置');

  const codeGsPath = path.join(__dirname, 'google-apps-script', 'Code.gs');
  const codeGsExists = fs.existsSync(codeGsPath);

  if (codeGsExists) {
    const codeGsContent = fs.readFileSync(codeGsPath, 'utf-8');
    const sheetIdMatch = codeGsContent.match(/const SHEET_ID = ['"](.+)['"]/);
    
    if (sheetIdMatch) {
      const sheetId = sheetIdMatch[1];
      if (sheetId === 'YOUR_SHEET_ID_HERE') {
        console.log('   ⚠️  警告: Code.gs 中的 SHEET_ID 還是佔位符');
        console.log('   請更新為實際的 Google Sheet ID');
      } else {
        console.log(`   ✅ SHEET_ID 已配置: ${sheetId.substring(0, 20)}...`);
      }
    } else {
      console.log('   ⚠️  無法找到 SHEET_ID 配置');
    }
  } else {
    console.log('   ⚠️  Code.gs 文件不存在');
  }

  // 5. 總結
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 診斷總結:\n');

  if (issues.length === 0 && gasUrlLine) {
    console.log('✅ 環境變數配置看起來正確！');
    console.log('\n下一步:');
    console.log('1. 重啟開發服務器 (如果正在運行): npm run dev');
    console.log('2. 在瀏覽器中訪問 http://localhost:5173');
    console.log('3. 打開開發者工具 Console，輸入:');
    console.log('   console.log(import.meta.env.VITE_GAS_URL)');
    console.log('4. 應該顯示您的 Google Apps Script URL');
  } else {
    console.log('❌ 發現配置問題，請根據上述提示修復');
  }

  console.log('\n');

} catch (error) {
  console.error('\n❌ 讀取 .env 文件時發生錯誤:');
  console.error(`   ${error.message}\n`);
  process.exit(1);
}
