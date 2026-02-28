#!/usr/bin/env node
/**
 * JavaScript 现代化改造脚本 - 高级版本
 * 功能：
 * 1. var → const/let（智能分析是否重新赋值）
 * 2. 字符串拼接 → 模板字符串
 * 3. 保持代码语法正确性
 */

const fs = require('fs');
const path = require('path');

// 分析变量在函数内是否被重新赋值
function isVariableReassigned(content, varName, startIdx, endIdx) {
  const scopeContent = content.substring(startIdx, endIdx);
  // 排除声明本身的赋值
  const assignPattern = new RegExp(`(?<!\\bvar\\s)${varName}\\s*=[^=]`, 'g');
  const matches = scopeContent.match(assignPattern);
  return matches && matches.length > 0;
}

// 查找函数作用域
function findFunctionScope(content, position) {
  let braceCount = 0;
  let start = position;
  let foundOpen = false;
  
  // 向前查找函数开始
  for (let i = position; i >= 0; i--) {
    if (content[i] === '}') braceCount++;
    if (content[i] === '{') {
      if (braceCount > 0) {
        braceCount--;
      } else {
        start = i;
        foundOpen = true;
        break;
      }
    }
  }
  
  if (!foundOpen) return null;
  
  // 向后查找函数结束
  braceCount = 0;
  let end = start;
  for (let i = start; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        end = i + 1;
        break;
      }
    }
  }
  
  return { start, end };
}

// 转换 var 为 const/let
function transformVarToConstLet(content) {
  let result = content;
  const varPattern = /\bvar\s+([a-zA-Z_$][\w$]*)/g;
  const matches = [...result.matchAll(varPattern)];
  
  // 从后向前替换，避免索引偏移问题
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const varName = match[1];
    const varIndex = match.index;
    
    // 查找作用域
    const scope = findFunctionScope(result, varIndex);
    const scopeEnd = scope ? scope.end : result.length;
    
    // 判断是否重新赋值
    const isReassigned = isVariableReassigned(result, varName, varIndex, scopeEnd);
    const replacement = isReassigned ? 'let' : 'const';
    
    // 替换 var
    result = result.substring(0, varIndex) + 
             replacement + 
             result.substring(varIndex + 3);
  }
  
  return result;
}

// 转换字符串拼接为模板字符串
function transformStringConcat(content) {
  let result = content;
  let changed = true;
  let iterations = 0;
  const maxIterations = 10;
  
  // 多次迭代以处理嵌套拼接
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    // 单引号模式
    const singleQuotePattern = /'([^']*)'\s*\+\s*([a-zA-Z_$][\w$]*)\s*\+\s*'([^']*)'/g;
    const newResult = result.replace(singleQuotePattern, (match, before, variable, after) => {
      changed = true;
      return `\`${before}\${${variable}}${after}\``;
    });
    result = newResult;
    
    // 双引号模式
    const doubleQuotePattern = /"([^"]*)"\s*\+\s*([a-zA-Z_$][\w$]*)\s*\+\s*"([^"]*)"/g;
    const newResult2 = result.replace(doubleQuotePattern, (match, before, variable, after) => {
      changed = true;
      return `\`${before}\${${variable}}${after}\``;
    });
    result = newResult2;
  }
  
  return result;
}

// 验证 JavaScript 语法
function validateSyntax(content, filePath) {
  try {
    // 使用 Function 构造函数进行基本语法检查
    new Function(content);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error.message,
      line: error.lineNumber 
    };
  }
}

// 处理单个文件
function processFile(filePath, options = {}) {
  const { dryRun = false, validate = true } = options;
  
  console.log(`Processing: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // 跳过已经现代化的文件
    if (!content.includes('var ')) {
      console.log(`  - Skipped (no var declarations)`);
      return { updated: false, reason: 'no-var' };
    }
    
    // 1. var → const/let
    let transformed = transformVarToConstLet(content);
    
    // 2. 字符串拼接 → 模板字符串
    transformed = transformStringConcat(transformed);
    
    // 验证语法
    if (validate && transformed !== originalContent) {
      const validation = validateSyntax(transformed, filePath);
      if (!validation.valid) {
        console.log(`  ⚠ Syntax error: ${validation.error}`);
        console.log(`  - Reverting changes`);
        return { updated: false, reason: 'syntax-error', error: validation.error };
      }
    }
    
    // 写入文件
    if (!dryRun && transformed !== originalContent) {
      fs.writeFileSync(filePath, transformed, 'utf8');
      const varCount = (originalContent.match(/\bvar\s/g) || []).length;
      const newVarCount = (transformed.match(/\bvar\s/g) || []).length;
      console.log(`  ✓ Updated (var: ${varCount} → ${newVarCount})`);
      return { updated: true, varCount, newVarCount };
    } else if (transformed === originalContent) {
      console.log(`  - No changes needed`);
      return { updated: false, reason: 'no-changes' };
    } else {
      console.log(`  - Dry run (would update)`);
      return { updated: true, dryRun: true };
    }
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return { updated: false, reason: 'error', error: error.message };
  }
}

// 查找所有 JS 文件
function findJsFiles(dir, excludePatterns = ['node_modules', 'dist', 'build', '.git', 'libs', 'vendor']) {
  const files = [];
  
  function walk(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          if (!excludePatterns.includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          // 排除库文件
          if (!entry.name.includes('.min.js') && 
              !entry.name.includes('-min.js') &&
              !entry.name.includes('bundle')) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading ${currentDir}: ${error.message}`);
    }
  }
  
  walk(dir);
  return files;
}

// 生成报告
function generateReport(results) {
  const total = results.length;
  const updated = results.filter(r => r.updated).length;
  const skipped = results.filter(r => !r.updated).length;
  const errors = results.filter(r => r.reason === 'error' || r.reason === 'syntax-error').length;
  
  console.log('\n' + '='.repeat(60));
  console.log('MODERNIZATION REPORT');
  console.log('='.repeat(60));
  console.log(`Total files processed: ${total}`);
  console.log(`Files updated: ${updated}`);
  console.log(`Files skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log('='.repeat(60));
  
  if (errors > 0) {
    console.log('\nFiles with errors:');
    results.forEach((r, i) => {
      if (r.reason === 'error' || r.reason === 'syntax-error') {
        console.log(`  - ${r.file}: ${r.error}`);
      }
    });
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const targetDir = args[0] || path.join(__dirname, 'app', 'navi_app', 'shouxihu', 'js');
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  const validate = !args.includes('--no-validate');
  
  console.log('JavaScript Modernization Tool');
  console.log('='.repeat(60));
  console.log(`Target directory: ${targetDir}`);
  console.log(`Dry run: ${dryRun ? 'YES' : 'NO'}`);
  console.log(`Validate syntax: ${validate ? 'YES' : 'NO'}`);
  console.log('='.repeat(60) + '\n');
  
  const jsFiles = findJsFiles(targetDir);
  console.log(`Found ${jsFiles.length} JavaScript files to process\n`);
  
  const results = [];
  
  for (const file of jsFiles) {
    const result = processFile(file, { dryRun, validate });
    result.file = file;
    results.push(result);
  }
  
  generateReport(results);
  
  // 保存报告
  const reportPath = path.join(__dirname, 'modernization-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

// 如果直接运行则执行 main
if (require.main === module) {
  main();
}

module.exports = {
  transformVarToConstLet,
  transformStringConcat,
  processFile,
  findJsFiles
};
