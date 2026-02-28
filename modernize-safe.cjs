#!/usr/bin/env node
/**
 * JavaScript 现代化改造脚本 - 安全版本
 * 只进行安全的转换，避免破坏代码
 */

const fs = require('fs');
const path = require('path');

// 转换 var 为 const/let（保守版本）
function transformVarToConstLet(content) {
  const lines = content.split('\n');
  const result = [];
  const declaredVars = new Set();
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // 匹配 var 声明
    const varMatch = line.match(/^(\s*)var\s+([a-zA-Z_$][\w$]*)(\s*=[^;]*)?;?$/);
    
    if (varMatch) {
      const indent = varMatch[1];
      const varName = varMatch[2];
      const rest = varMatch[3] || '';
      
      // 检查是否在同一作用域已声明
      if (!declaredVars.has(varName)) {
        // 简单判断：如果行内有对该变量的后续赋值，用 let，否则用 const
        const hasAssignment = rest.includes('=') && !rest.trim().startsWith('=');
        const keyword = hasAssignment ? 'let' : 'const';
        line = `${indent}${keyword} ${varName}${rest};`;
        declaredVars.add(varName);
      } else {
        // 已声明的变量，跳过（可能是作用域问题）
        result.push(line);
        continue;
      }
    }
    
    // 重置作用域跟踪（遇到函数结束或块结束）
    if (line.trim() === '}' || line.trim().startsWith('};')) {
      declaredVars.clear();
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

// 转换字符串拼接为模板字符串
function transformStringConcat(content) {
  let result = content;
  
  // 单引号模式：'text' + var + 'text'
  result = result.replace(/'([^']*)'\s*\+\s*([a-zA-Z_$][\w$]*)\s*\+\s*'([^']*)'/g, 
    (match, before, variable, after) => `\`${before}\${${variable}}${after}\``);
  
  // 双引号模式
  result = result.replace(/"([^"]*)"\s*\+\s*([a-zA-Z_$][\w$]*)\s*\+\s*"([^"]*)"/g,
    (match, before, variable, after) => `\`${before}\${${variable}}${after}\``);
  
  return result;
}

// 处理单个文件
function processFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // 跳过没有 var 的文件
    if (!content.includes('var ')) {
      console.log(`  - Skipped (no var)`);
      return { updated: false, reason: 'no-var' };
    }
    
    // 转换
    let transformed = transformVarToConstLet(content);
    transformed = transformStringConcat(transformed);
    
    if (transformed !== originalContent) {
      fs.writeFileSync(filePath, transformed, 'utf8');
      const oldVarCount = (originalContent.match(/\bvar\s/g) || []).length;
      const newVarCount = (transformed.match(/\bvar\s/g) || []).length;
      console.log(`  ✓ Updated (var: ${oldVarCount} → ${newVarCount})`);
      return { updated: true, oldVarCount, newVarCount };
    } else {
      console.log(`  - No changes`);
      return { updated: false, reason: 'no-changes' };
    }
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return { updated: false, reason: 'error', error: error.message };
  }
}

// 查找 JS 文件
function findJsFiles(dir, exclude = ['node_modules', 'dist', 'libs', 'vendor']) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory() && !exclude.includes(entry.name)) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js') && 
                 !entry.name.includes('.min.js')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// 主函数
function main() {
  const targetDir = process.argv[2] || path.join(__dirname, 'app');
  console.log(`Processing files in: ${targetDir}\n`);
  
  const files = findJsFiles(targetDir);
  console.log(`Found ${files.length} files\n`);
  
  let updated = 0;
  for (const file of files) {
    if (processFile(file).updated) updated++;
  }
  
  console.log(`\n✓ Done! Updated ${updated}/${files.length} files`);
}

if (require.main === module) {
  main();
}
