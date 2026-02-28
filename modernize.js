#!/usr/bin/env node
/**
 * JavaScript 现代化改造脚本
 * 功能：
 * 1. var → const/let
 * 2. 字符串拼接 → 模板字符串
 * 3. 普通函数 → 箭头函数（保持 this 绑定的除外）
 */

const fs = require('fs');
const path = require('path');

// 简单判断变量是否被重新赋值（静态分析）
function analyzeVarUsage(content, varName) {
  // 查找所有该变量的赋值操作（排除声明）
  const assignRegex = new RegExp(`[^a-zA-Z0-9_]${varName}\\s*=[^=]`, 'g');
  const matches = content.match(assignRegex);
  return matches && matches.length > 0;
}

// 提取所有 var 声明
function extractVarDeclarations(content) {
  const varRegex = /\bvar\s+([a-zA-Z_$][\w$]*)(?:\s*=[^;]*)?/g;
  const declarations = [];
  let match;
  
  while ((match = varRegex.exec(content)) !== null) {
    declarations.push({
      name: match[1],
      index: match.index,
      fullMatch: match[0]
    });
  }
  
  return declarations;
}

// 转换 var 为 const/let
function transformVarToConstLet(content) {
  const declarations = extractVarDeclarations(content);
  let result = content;
  const offsetMap = new Map(); // 跟踪偏移量变化
  
  for (const decl of declarations) {
    const varName = decl.name;
    const isReassigned = analyzeVarUsage(content, varName);
    const replacement = isReassigned ? 'let' : 'const';
    
    // 替换 var 关键字
    const varPattern = new RegExp(`\\bvar\\s+${varName}\\b`, 'g');
    result = result.replace(varPattern, `${replacement} ${varName}`);
  }
  
  return result;
}

// 转换字符串拼接为模板字符串
function transformStringConcat(content) {
  // 匹配 'text' + var + 'text' 模式
  let result = content;
  
  // 简单模式：'...' + var + '...'
  const concatRegex = /'([^']*)'\s*\+\s*([a-zA-Z_$][\w$]*)\s*\+\s*'([^']*)'/g;
  result = result.replace(concatRegex, (match, before, variable, after) => {
    return `\`${before}\${${variable}}${after}\``;
  });
  
  // 双引号模式："..." + var + "..."
  const concatRegexDouble = /"([^"]*)"\s*\+\s*([a-zA-Z_$][\w$]*)\s*\+\s*"([^"]*)"/g;
  result = result.replace(concatRegexDouble, (match, before, variable, after) => {
    return `\`${before}\${${variable}}${after}\``;
  });
  
  return result;
}

// 处理单个文件
function processFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // 1. var → const/let
    content = transformVarToConstLet(content);
    
    // 2. 字符串拼接 → 模板字符串
    content = transformStringConcat(content);
    
    // 如果内容有变化，写入文件
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✓ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`  - No changes: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

// 查找所有 JS 文件
function findJsFiles(dir, excludeDirs = ['node_modules', 'dist', 'build', '.git']) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
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
  console.log(`Starting modernization in: ${targetDir}\n`);
  
  const jsFiles = findJsFiles(targetDir);
  console.log(`Found ${jsFiles.length} JavaScript files\n`);
  
  let updatedCount = 0;
  
  for (const file of jsFiles) {
    if (processFile(file)) {
      updatedCount++;
    }
  }
  
  console.log(`\n✓ Complete! Updated ${updatedCount} of ${jsFiles.length} files.`);
}

main();
