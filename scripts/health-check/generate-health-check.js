#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const outputPath = path.join(repoRoot, 'docs', 'reports', 'health-check.md');
const topN = 10;

const ignoreDirs = new Set([
  '.git',
  'node_modules',
  'docs/reports',
]);

function shouldIgnoreDir(dirPathFromRoot) {
  const normalized = dirPathFromRoot.replace(/\\/g, '/');
  for (const ignored of ignoreDirs) {
    if (normalized === ignored || normalized.startsWith(`${ignored}/`)) {
      return true;
    }
  }
  return false;
}

function collectJsFiles(startDir) {
  const results = [];

  function walk(currentDir) {
    const relativeDir = path.relative(repoRoot, currentDir).replace(/\\/g, '/');
    if (relativeDir && shouldIgnoreDir(relativeDir)) {
      return;
    }

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(repoRoot, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (!shouldIgnoreDir(relativePath)) {
          walk(fullPath);
        }
        continue;
      }

      if (entry.isFile() && relativePath.endsWith('.js')) {
        results.push({ fullPath, relativePath });
      }
    }
  }

  walk(startDir);
  return results;
}

function countLines(text) {
  if (!text) return 0;
  return text.split(/\r?\n/).length;
}

function scanWindowAssignments(fileContent) {
  const rows = [];
  const lines = fileContent.split(/\r?\n/);
  const patterns = [
    /\bwindow\.[A-Za-z_$][\w$]*\s*=/g,
    /\bwindow\s*\[\s*['"][^'"\]]+['"]\s*\]\s*=/g,
  ];

  lines.forEach((lineText, index) => {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const matches = lineText.match(pattern);
      if (matches) {
        for (const matched of matches) {
          rows.push({ line: index + 1, snippet: matched.trim() });
        }
      }
    }
  });

  return rows;
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Repository Health Check Report');
  lines.push('');
  lines.push(`- Generated at: ${report.generatedAt}`);
  lines.push('- Scope: `*.js` files under repository root');
  lines.push('');

  lines.push('## 1) JS 文件统计');
  lines.push('');
  lines.push(`- JS 文件总数: **${report.jsFileCount}**`);
  lines.push(`- JS 总行数: **${report.totalJsLines}**`);
  lines.push('');
  lines.push(`### TOP ${topN} 大文件（按行数）`);
  lines.push('');
  lines.push('| 排名 | 文件 | 行数 |');
  lines.push('| --- | --- | ---: |');
  report.topFiles.forEach((item, idx) => {
    lines.push(`| ${idx + 1} | ${item.relativePath} | ${item.lines} |`);
  });
  lines.push('');

  lines.push('## 2) 重复文件名扫描');
  lines.push('');
  if (report.duplicateFileNames.length === 0) {
    lines.push('未发现重复文件名。');
  } else {
    lines.push(`发现 **${report.duplicateFileNames.length}** 组重复文件名：`);
    lines.push('');
    report.duplicateFileNames.forEach((item) => {
      lines.push(`### ${item.fileName} (${item.paths.length} 个)`);
      item.paths.forEach((p) => lines.push(`- ${p}`));
      lines.push('');
    });
  }

  lines.push('## 3) `window.* =` 全局写入点扫描');
  lines.push('');
  if (report.windowAssignments.length === 0) {
    lines.push('未发现 `window.* =` 全局写入点。');
  } else {
    lines.push(`共发现 **${report.windowAssignments.length}** 个全局写入点：`);
    lines.push('');
    lines.push('| 文件 | 行号 | 命中片段 |');
    lines.push('| --- | ---: | --- |');
    report.windowAssignments.forEach((hit) => {
      lines.push(`| ${hit.relativePath} | ${hit.line} | ` + '\`' + hit.snippet + '\`' + ' |');
    });
  }

  lines.push('');
  return lines.join('\n');
}

function run() {
  const jsFiles = collectJsFiles(repoRoot);
  const metrics = [];
  const fileNameToPaths = new Map();
  const windowAssignments = [];

  jsFiles.forEach((file) => {
    const content = fs.readFileSync(file.fullPath, 'utf8');
    const lines = countLines(content);
    metrics.push({ relativePath: file.relativePath, lines });

    const baseName = path.basename(file.relativePath);
    if (!fileNameToPaths.has(baseName)) {
      fileNameToPaths.set(baseName, []);
    }
    fileNameToPaths.get(baseName).push(file.relativePath);

    const scans = scanWindowAssignments(content);
    scans.forEach((s) => {
      windowAssignments.push({ relativePath: file.relativePath, line: s.line, snippet: s.snippet });
    });
  });

  metrics.sort((a, b) => b.lines - a.lines || a.relativePath.localeCompare(b.relativePath));

  const duplicateFileNames = [...fileNameToPaths.entries()]
    .map(([fileName, paths]) => ({ fileName, paths: paths.sort() }))
    .filter((item) => item.paths.length > 1)
    .sort((a, b) => b.paths.length - a.paths.length || a.fileName.localeCompare(b.fileName));

  windowAssignments.sort((a, b) => {
    if (a.relativePath !== b.relativePath) return a.relativePath.localeCompare(b.relativePath);
    if (a.line !== b.line) return a.line - b.line;
    return a.snippet.localeCompare(b.snippet);
  });

  const report = {
    generatedAt: new Date().toISOString(),
    jsFileCount: metrics.length,
    totalJsLines: metrics.reduce((sum, m) => sum + m.lines, 0),
    topFiles: metrics.slice(0, topN),
    duplicateFileNames,
    windowAssignments,
  };

  const markdown = renderMarkdown(report);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, 'utf8');

  console.log(`Health check report generated: ${path.relative(repoRoot, outputPath)}`);
}

run();
