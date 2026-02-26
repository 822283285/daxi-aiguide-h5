#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");

const defaultIncludeDirs = [
  "app/components",
  "app/navi_app/shouxihu/js",
  "app/navi_app/shouxihu/extend_guobo/js",
  "app/navi_app/utils",
  "jsbridge",
  "map_sdk/map",
];

const defaultBaselinePath = "docs/reports/global-usage-baseline.json";

const ignoredPathFragments = ["/libs/", "/mapbox/", "/sdk/"];

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function parseArgs(argv) {
  const includeDirs = [];
  let mode = "check";
  let baselinePath = defaultBaselinePath;
  let outputPath = "";

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--mode") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("Missing value for --mode");
      }
      mode = value;
      i += 1;
      continue;
    }

    if (arg === "--include-dir") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("Missing value for --include-dir");
      }
      includeDirs.push(value);
      i += 1;
      continue;
    }

    if (arg === "--baseline") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("Missing value for --baseline");
      }
      baselinePath = value;
      i += 1;
      continue;
    }

    if (arg === "--output") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("Missing value for --output");
      }
      outputPath = value;
      i += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return { help: true };
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  const validModes = new Set(["report", "check", "update-baseline"]);
  if (!validModes.has(mode)) {
    throw new Error(`Invalid mode "${mode}", expected one of: report, check, update-baseline`);
  }

  return {
    help: false,
    mode,
    includeDirs: includeDirs.length > 0 ? includeDirs : defaultIncludeDirs,
    baselinePath,
    outputPath,
  };
}

function printHelp() {
  console.log("Global window usage scanner");
  console.log(
    "Usage: node scripts/quality/check-globals.js [--mode <check|report|update-baseline>] [--include-dir <dir>]... [--baseline <file>] [--output <file>]",
  );
  console.log("Defaults:");
  console.log(`  mode: check`);
  console.log(`  baseline: ${defaultBaselinePath}`);
  defaultIncludeDirs.forEach((item) => console.log(`  include dir: ${item}`));
}

function shouldIgnore(relativePath) {
  if (relativePath.endsWith(".min.js")) {
    return true;
  }

  for (const fragment of ignoredPathFragments) {
    if (relativePath.includes(fragment)) {
      return true;
    }
  }

  return false;
}

function collectJsFiles(includeDirs) {
  const files = [];

  function walk(absPath) {
    const entries = fs.readdirSync(absPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(absPath, entry.name);
      const relativePath = rel(fullPath);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      if (!relativePath.endsWith(".js")) {
        continue;
      }
      if (shouldIgnore(relativePath)) {
        continue;
      }
      files.push({ fullPath, relativePath });
    }
  }

  includeDirs.forEach((dir) => {
    const absDir = path.resolve(repoRoot, dir);
    if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
      throw new Error(`Include directory not found: ${dir}`);
    }
    walk(absDir);
  });

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return files;
}

const readPatterns = [/\bwindow\.[A-Za-z_$][\w$]*/g, /\bwindow\s*\[\s*['"][^'"\]]+['"]\s*\]/g];
const writePatterns = [
  /\bwindow\.[A-Za-z_$][\w$]*\s*=(?!=)/g,
  /\bwindow\s*\[\s*['"][^'"\]]+['"]\s*\]\s*=(?!=)/g,
];

function scanFile(content) {
  const lines = content.split(/\r?\n/);

  let readHits = 0;
  let writeHits = 0;
  const samples = [];

  lines.forEach((lineText, index) => {
    for (const readPattern of readPatterns) {
      readPattern.lastIndex = 0;
      const readMatches = lineText.match(readPattern);
      if (readMatches) {
        readHits += readMatches.length;
        readMatches.slice(0, 2).forEach((matched) => {
          samples.push({ line: index + 1, kind: "read", snippet: matched.trim() });
        });
      }
    }

    for (const writePattern of writePatterns) {
      writePattern.lastIndex = 0;
      const writeMatches = lineText.match(writePattern);
      if (writeMatches) {
        writeHits += writeMatches.length;
        writeMatches.slice(0, 2).forEach((matched) => {
          samples.push({ line: index + 1, kind: "write", snippet: matched.trim() });
        });
      }
    }
  });

  return {
    readHits,
    writeHits,
    samples: samples.slice(0, 8),
  };
}

function generateReport(includeDirs) {
  const files = collectJsFiles(includeDirs);

  const byFile = [];
  let totalReads = 0;
  let totalWrites = 0;

  files.forEach((file) => {
    const source = fs.readFileSync(file.fullPath, "utf8");
    const result = scanFile(source);
    totalReads += result.readHits;
    totalWrites += result.writeHits;

    if (result.readHits > 0 || result.writeHits > 0) {
      byFile.push({
        file: file.relativePath,
        reads: result.readHits,
        writes: result.writeHits,
        samples: result.samples,
      });
    }
  });

  byFile.sort((a, b) => {
    if (b.writes !== a.writes) return b.writes - a.writes;
    if (b.reads !== a.reads) return b.reads - a.reads;
    return a.file.localeCompare(b.file);
  });

  return {
    generatedAt: new Date().toISOString(),
    includeDirs,
    ignoredPathFragments,
    totals: {
      filesScanned: files.length,
      filesWithWindowUsage: byFile.length,
      windowReadHits: totalReads,
      windowWriteHits: totalWrites,
    },
    byFile,
  };
}

function loadJsonFromRepoPath(relativePath) {
  const absPath = path.resolve(repoRoot, relativePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

function saveJsonToRepoPath(relativePath, data) {
  const absPath = path.resolve(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function checkAgainstBaseline(current, baseline) {
  const failures = [];

  const currentTotals = current.totals || {};
  const baselineTotals = baseline.totals || {};

  if ((currentTotals.windowWriteHits || 0) > (baselineTotals.windowWriteHits || 0)) {
    failures.push(
      `window write hits increased: current=${currentTotals.windowWriteHits || 0}, baseline=${baselineTotals.windowWriteHits || 0}`,
    );
  }

  if ((currentTotals.windowReadHits || 0) > (baselineTotals.windowReadHits || 0)) {
    failures.push(
      `window read hits increased: current=${currentTotals.windowReadHits || 0}, baseline=${baselineTotals.windowReadHits || 0}`,
    );
  }

  const baselineByFile = new Map((baseline.byFile || []).map((item) => [item.file, item]));
  const currentByFile = current.byFile || [];

  currentByFile.forEach((item) => {
    const baselineItem = baselineByFile.get(item.file);

    if (!baselineItem) {
      failures.push(`new file introduced window usage: ${item.file}`);
      return;
    }

    if ((item.writes || 0) > (baselineItem.writes || 0)) {
      failures.push(
        `window writes increased in ${item.file}: current=${item.writes || 0}, baseline=${baselineItem.writes || 0}`,
      );
    }

    if ((item.reads || 0) > (baselineItem.reads || 0)) {
      failures.push(
        `window reads increased in ${item.file}: current=${item.reads || 0}, baseline=${baselineItem.reads || 0}`,
      );
    }
  });

  return failures;
}

function execute(args, io = console) {
  const report = generateReport(args.includeDirs);

  if (args.outputPath) {
    saveJsonToRepoPath(args.outputPath, report);
    io.log(`[globals] report written to ${args.outputPath}`);
  }

  if (args.mode === "report") {
    io.log(
      `[globals] files=${report.totals.filesScanned} files_with_window=${report.totals.filesWithWindowUsage} reads=${report.totals.windowReadHits} writes=${report.totals.windowWriteHits}`,
    );
    io.log(JSON.stringify(report, null, 2));
    return { exitCode: 0, report, failures: [] };
  }

  if (args.mode === "update-baseline") {
    saveJsonToRepoPath(args.baselinePath, report);
    io.log(
      `[globals] files=${report.totals.filesScanned} files_with_window=${report.totals.filesWithWindowUsage} reads=${report.totals.windowReadHits} writes=${report.totals.windowWriteHits}`,
    );
    io.log(`[PASS] [globals] baseline updated: ${args.baselinePath}`);
    return { exitCode: 0, report, failures: [] };
  }

  if (args.mode === "check") {
    let baseline;
    try {
      baseline = loadJsonFromRepoPath(args.baselinePath);
    } catch (error) {
      io.error(`[FAIL] [globals] ${error.message}`);
      io.error(
        `[FAIL] [globals] baseline missing. Run: node scripts/quality/check-globals.js --mode update-baseline`,
      );
      return { exitCode: 1, report, failures: ["baseline-missing"] };
    }

    const failures = checkAgainstBaseline(report, baseline);
    io.log(
      `[globals] files=${report.totals.filesScanned} files_with_window=${report.totals.filesWithWindowUsage} reads=${report.totals.windowReadHits} writes=${report.totals.windowWriteHits}`,
    );
    if (failures.length > 0) {
      failures.forEach((item) => io.error(`[FAIL] [globals] ${item}`));
      io.error(`[FAIL] [globals] window usage regression detected`);
      return { exitCode: 1, report, failures };
    }

    io.log(`[PASS] [globals] no window usage regression`);
    return { exitCode: 0, report, failures: [] };
  }

  io.error(`[FAIL] [globals] unsupported mode: ${args.mode}`);
  return { exitCode: 2, report, failures: ["unsupported-mode"] };
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[FAIL] [globals] ${error.message}`);
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
  defaultIncludeDirs,
  defaultBaselinePath,
  parseArgs,
  generateReport,
  checkAgainstBaseline,
  execute,
};
