#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const defaultSrcRoot = 'app/navi_app/shouxihu/src';

const layerOrder = {
  core: 0,
  platform: 1,
  domain: 2,
  application: 3,
  ui: 4,
  legacy: 5
};

function toPosix(filePath) {
  return filePath.replace(/\\/g, '/');
}

function rel(filePath) {
  return toPosix(path.relative(repoRoot, filePath));
}

function parseArgs(argv) {
  let mode = 'check';
  let srcRoot = defaultSrcRoot;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--mode') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('Missing value for --mode');
      }
      mode = value;
      i += 1;
      continue;
    }

    if (arg === '--src-root') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('Missing value for --src-root');
      }
      srcRoot = value;
      i += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      return { help: true };
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!new Set(['check', 'report']).has(mode)) {
    throw new Error(`Invalid mode "${mode}", expected check|report`);
  }

  return { help: false, mode, srcRoot };
}

function printHelp() {
  console.log('Layer dependency checker');
  console.log('Usage: node scripts/quality/check-deps.js [--mode <check|report>] [--src-root <dir>]');
  console.log('Defaults:');
  console.log(`  mode: check`);
  console.log(`  src-root: ${defaultSrcRoot}`);
}

function walkJsFiles(dirPath, list) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  entries.forEach((entry) => {
    const absPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkJsFiles(absPath, list);
      return;
    }

    if (!entry.isFile()) {
      return;
    }

    if (!entry.name.endsWith('.js')) {
      return;
    }

    if (entry.name.endsWith('.min.js')) {
      return;
    }

    list.push(absPath);
  });
}

function extractSpecifiers(source) {
  const results = [];
  const lines = source.split(/\r?\n/);
  const fromRegex = /\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  const requireRegex = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  const dynamicImportRegex = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  lines.forEach((lineText, index) => {
    const lineNo = index + 1;

    [fromRegex, requireRegex, dynamicImportRegex].forEach((regex) => {
      regex.lastIndex = 0;
      let match = regex.exec(lineText);
      while (match) {
        results.push({ specifier: match[1], line: lineNo });
        match = regex.exec(lineText);
      }
    });
  });

  return results;
}

function resolveInternalSpecifier(filePath, specifier, srcAbsPath) {
  if (!specifier) {
    return null;
  }

  let candidate = '';
  const normalized = toPosix(specifier);

  if (normalized.startsWith('./') || normalized.startsWith('../')) {
    candidate = path.resolve(path.dirname(filePath), specifier);
  } else if (normalized.startsWith('/')) {
    candidate = path.resolve(srcAbsPath, `.${normalized}`);
  } else if (normalized.startsWith('@/')) {
    candidate = path.resolve(srcAbsPath, normalized.slice(2));
  } else if (normalized.startsWith('src/')) {
    candidate = path.resolve(srcAbsPath, normalized.slice(4));
  } else {
    return null;
  }

  const resolutionCandidates = [
    candidate,
    `${candidate}.js`,
    path.join(candidate, 'index.js')
  ];

  for (const item of resolutionCandidates) {
    if (fs.existsSync(item) && fs.statSync(item).isFile()) {
      return item;
    }
  }

  return candidate;
}

function getLayerFromRelativePath(relativePath, srcRoot) {
  const normalized = toPosix(relativePath);
  const prefix = `${toPosix(srcRoot)}/`;
  if (!normalized.startsWith(prefix)) {
    return null;
  }

  const tail = normalized.slice(prefix.length);
  const first = tail.split('/')[0];
  if (!first) {
    return 'entry';
  }
  if (layerOrder[first] === undefined) {
    return 'entry';
  }
  return first;
}

function isAllowedDependency(sourceLayer, targetLayer) {
  if (!sourceLayer || !targetLayer) {
    return true;
  }

  if (sourceLayer === 'entry') {
    return true;
  }

  if (sourceLayer === 'legacy') {
    return true;
  }

  if (targetLayer === 'legacy') {
    return sourceLayer === 'legacy';
  }

  if (targetLayer === 'core') {
    return true;
  }

  if (sourceLayer === 'core') {
    return targetLayer === 'core';
  }

  if (layerOrder[sourceLayer] === undefined || layerOrder[targetLayer] === undefined) {
    return true;
  }

  return layerOrder[targetLayer] <= layerOrder[sourceLayer];
}

function checkDependencies(srcRoot) {
  const srcAbsPath = path.resolve(repoRoot, srcRoot);
  if (!fs.existsSync(srcAbsPath) || !fs.statSync(srcAbsPath).isDirectory()) {
    throw new Error(`Source root not found: ${srcRoot}`);
  }

  const jsFiles = [];
  walkJsFiles(srcAbsPath, jsFiles);
  jsFiles.sort();

  const violations = [];
  let dependencyEdges = 0;

  jsFiles.forEach((filePath) => {
    const source = fs.readFileSync(filePath, 'utf8');
    const imports = extractSpecifiers(source);
    const fileRelPath = rel(filePath);
    const sourceLayer = getLayerFromRelativePath(fileRelPath, srcRoot);

    imports.forEach((entry) => {
      const resolvedTarget = resolveInternalSpecifier(filePath, entry.specifier, srcAbsPath);
      if (!resolvedTarget) {
        return;
      }

      if (!fs.existsSync(resolvedTarget) || !fs.statSync(resolvedTarget).isFile()) {
        violations.push({
          file: fileRelPath,
          line: entry.line,
          sourceLayer,
          specifier: entry.specifier,
          reason: 'unresolved internal dependency'
        });
        return;
      }

      const targetRelPath = rel(resolvedTarget);
      const targetLayer = getLayerFromRelativePath(targetRelPath, srcRoot);
      dependencyEdges += 1;

      if (!isAllowedDependency(sourceLayer, targetLayer)) {
        violations.push({
          file: fileRelPath,
          line: entry.line,
          sourceLayer,
          targetLayer,
          target: targetRelPath,
          specifier: entry.specifier,
          reason: 'layer dependency violation'
        });
      }
    });
  });

  return {
    srcRoot,
    totals: {
      filesScanned: jsFiles.length,
      dependencyEdges,
      violations: violations.length
    },
    violations
  };
}

function execute(args, io = console) {
  const report = checkDependencies(args.srcRoot);
  io.log(
    `[deps] files=${report.totals.filesScanned} edges=${report.totals.dependencyEdges} violations=${report.totals.violations}`
  );

  if (args.mode === 'report') {
    io.log(JSON.stringify(report, null, 2));
    return { exitCode: 0, report };
  }

  if (report.violations.length > 0) {
    report.violations.forEach((item) => {
      const source = `${item.file}:${item.line}`;
      const detail = item.target
        ? `${item.sourceLayer || 'unknown'} -> ${item.targetLayer || 'unknown'} (${item.target})`
        : item.specifier;
      io.error(`[FAIL] [deps] ${source} ${item.reason}: ${detail}`);
    });
    io.error('[FAIL] [deps] dependency boundary regression detected');
    return { exitCode: 1, report };
  }

  io.log('[PASS] [deps] layer dependency check passed');
  return { exitCode: 0, report };
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[FAIL] [deps] ${error.message}`);
    process.exit(2);
  }

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const result = execute(args, console);
  if (result.exitCode !== 0) {
    process.exit(result.exitCode);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  defaultSrcRoot,
  parseArgs,
  checkDependencies,
  execute
};
