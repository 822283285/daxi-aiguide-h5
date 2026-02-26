#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const globalsChecker = require('../quality/check-globals');
const depsChecker = require('../quality/check-deps');

const repoRoot = process.cwd();

const defaultSyntaxDirs = [
  'app/components',
  'app/navi_app/shouxihu/js',
  'app/navi_app/utils',
  'map_sdk/map'
];

const defaultSmokeHtmlFiles = [
  'app/navi_app/shouxihu/index_src.html'
];

function parseArgs(argv) {
  const syntaxDirs = [];
  const smokeHtmlFiles = [];
  let skipGlobals = false;
  let skipDeps = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--syntax-dir') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('Missing value for --syntax-dir');
      }
      syntaxDirs.push(value);
      i += 1;
      continue;
    }

    if (arg === '--smoke-html') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('Missing value for --smoke-html');
      }
      smokeHtmlFiles.push(value);
      i += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      return { help: true, syntaxDirs: [], smokeHtmlFiles: [], skipGlobals: false, skipDeps: false };
    }

    if (arg === '--skip-globals') {
      skipGlobals = true;
      continue;
    }

    if (arg === '--skip-deps') {
      skipDeps = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    help: false,
    syntaxDirs: syntaxDirs.length ? syntaxDirs : defaultSyntaxDirs,
    smokeHtmlFiles: smokeHtmlFiles.length ? smokeHtmlFiles : defaultSmokeHtmlFiles,
    skipGlobals,
    skipDeps
  };
}

function printHelp() {
  console.log('Minimal CI for script repository');
  console.log('Usage: node scripts/ci/minimal-ci.js [--syntax-dir <dir>]... [--smoke-html <file>]... [--skip-globals] [--skip-deps]');
  console.log('Defaults:');
  defaultSyntaxDirs.forEach((dir) => console.log(`  syntax dir: ${dir}`));
  defaultSmokeHtmlFiles.forEach((file) => console.log(`  smoke html: ${file}`));
  console.log('  globals check: enabled');
  console.log('  deps check: enabled');
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

function log(status, check, filePath, message) {
  const outputPath = filePath ? rel(filePath) : '-';
  console.log(`[${status}] [${check}] ${outputPath} ${message || ''}`.trim());
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

function syntaxCheck(syntaxDirs) {
  const jsFiles = [];
  let passCount = 0;
  let failCount = 0;

  syntaxDirs.forEach((dir) => {
    const absDir = path.resolve(repoRoot, dir);
    if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
      failCount += 1;
      log('FAIL', 'syntax', absDir, 'directory not found');
      return;
    }
    walkJsFiles(absDir, jsFiles);
  });

  jsFiles.sort();

  jsFiles.forEach((file) => {
    const source = fs.readFileSync(file, 'utf8');
    try {
      new vm.Script(source, { filename: file });
      passCount += 1;
      log('PASS', 'syntax', file);
    } catch (error) {
      failCount += 1;
      log('FAIL', 'syntax', file, error.message);
    }
  });

  return { passCount, failCount, checkedCount: jsFiles.length };
}

function extractLocalScriptPaths(htmlContent) {
  const srcList = [];
  const scriptRegex = /<script[^>]*\ssrc\s*=\s*['\"]([^'\"]+)['\"][^>]*>/gi;
  let match = scriptRegex.exec(htmlContent);

  while (match) {
    const src = match[1].trim();
    const isRemote = /^(https?:)?\/\//i.test(src);
    const isData = /^data:/i.test(src);

    if (!isRemote && !isData) {
      srcList.push(src);
    }

    match = scriptRegex.exec(htmlContent);
  }

  return srcList;
}

function smokeCheck(smokeHtmlFiles) {
  let passCount = 0;
  let failCount = 0;

  smokeHtmlFiles.forEach((htmlPath) => {
    const htmlAbsPath = path.resolve(repoRoot, htmlPath);
    if (!fs.existsSync(htmlAbsPath) || !fs.statSync(htmlAbsPath).isFile()) {
      failCount += 1;
      log('FAIL', 'smoke', htmlAbsPath, 'html file not found');
      return;
    }

    const htmlContent = fs.readFileSync(htmlAbsPath, 'utf8');
    const scriptPaths = extractLocalScriptPaths(htmlContent);

    if (scriptPaths.length === 0) {
      failCount += 1;
      log('FAIL', 'smoke', htmlAbsPath, 'no local script src found');
      return;
    }

    scriptPaths.forEach((scriptSrc) => {
      const scriptAbsPath = path.resolve(path.dirname(htmlAbsPath), scriptSrc);
      if (fs.existsSync(scriptAbsPath) && fs.statSync(scriptAbsPath).isFile()) {
        passCount += 1;
        log('PASS', 'smoke', scriptAbsPath, `referenced by ${rel(htmlAbsPath)}`);
      } else {
        failCount += 1;
        log('FAIL', 'smoke', scriptAbsPath, `missing reference in ${rel(htmlAbsPath)}`);
      }
    });
  });

  return { passCount, failCount };
}

function globalsCheck(skipGlobals) {
  if (skipGlobals) {
    log('PASS', 'globals', null, 'skipped by flag --skip-globals');
    return { passCount: 1, failCount: 0 };
  }

  const scriptAbsPath = path.resolve(repoRoot, 'scripts/quality/check-globals.js');
  if (!fs.existsSync(scriptAbsPath) || !fs.statSync(scriptAbsPath).isFile()) {
    log('FAIL', 'globals', scriptAbsPath, 'script not found');
    return { passCount: 0, failCount: 1 };
  }

  const result = globalsChecker.execute({
    mode: 'check',
    includeDirs: globalsChecker.defaultIncludeDirs,
    baselinePath: globalsChecker.defaultBaselinePath,
    outputPath: ''
  }, console);

  if (result.exitCode === 0) {
    log('PASS', 'globals', scriptAbsPath, 'window usage baseline check');
    return { passCount: 1, failCount: 0 };
  }

  log('FAIL', 'globals', scriptAbsPath, `window usage baseline check failed (exit=${result.exitCode})`);
  return { passCount: 0, failCount: 1 };
}

function depsCheck(skipDeps) {
  if (skipDeps) {
    log('PASS', 'deps', null, 'skipped by flag --skip-deps');
    return { passCount: 1, failCount: 0 };
  }

  const scriptAbsPath = path.resolve(repoRoot, 'scripts/quality/check-deps.js');
  if (!fs.existsSync(scriptAbsPath) || !fs.statSync(scriptAbsPath).isFile()) {
    log('FAIL', 'deps', scriptAbsPath, 'script not found');
    return { passCount: 0, failCount: 1 };
  }

  const result = depsChecker.execute({
    mode: 'check',
    srcRoot: depsChecker.defaultSrcRoot
  }, console);

  if (result.exitCode === 0) {
    log('PASS', 'deps', scriptAbsPath, 'layer dependency check');
    return { passCount: 1, failCount: 0 };
  }

  log('FAIL', 'deps', scriptAbsPath, `layer dependency check failed (exit=${result.exitCode})`);
  return { passCount: 0, failCount: 1 };
}

function main() {
  let args;

  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[FAIL] [args] - ${error.message}`);
    process.exit(2);
  }

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const syntax = syntaxCheck(args.syntaxDirs);
  const smoke = smokeCheck(args.smokeHtmlFiles);
  const globals = globalsCheck(args.skipGlobals);
  const deps = depsCheck(args.skipDeps);

  const totalPass = syntax.passCount + smoke.passCount + globals.passCount + deps.passCount;
  const totalFail = syntax.failCount + smoke.failCount + globals.failCount + deps.failCount;

  console.log(`SUMMARY pass=${totalPass} fail=${totalFail} syntax_checked=${syntax.checkedCount}`);

  if (totalFail > 0) {
    process.exit(1);
  }
}

main();
