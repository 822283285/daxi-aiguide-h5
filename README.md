# daxi-aiguide-h5

## Health Check 报告脚本

仓库提供了健康检查脚本，用于生成 JS 代码基线报告。

### 运行方式

```bash
node scripts/health-check/generate-health-check.js
```

### 输出结果

脚本会覆盖写入以下报告文件（可重复执行）：

- `docs/reports/health-check.md`

报告内容包含：

1. JS 文件数量、总行数、TOP 大文件；
2. 重复文件名扫描结果；
3. `window.* =` 全局写入点扫描结果；
4. 报告生成时间戳。

## 最小 CI（纯脚本仓库）

### 一键执行

```bash
node scripts/ci/minimal-ci.js
```

### 检查项

- **语法检查**：递归扫描关键目录中的 `.js`（默认跳过 `.min.js`），用 Node 内置 `vm.Script` 做 parse 检查；
- **Smoke 检查**：校验 `app/navi_app/shouxihu/index_src.html` 中本地 `<script src="...">` 引用文件是否存在；
- **标准化日志**：输出 `[PASS|FAIL] [syntax|smoke] <文件路径> <附加信息>`；
- **失败返回码**：只要存在任意 FAIL，进程退出码为 `1`。

### 可选参数

```bash
node scripts/ci/minimal-ci.js --syntax-dir <目录> --smoke-html <HTML文件>
```

- `--syntax-dir`：可重复传入，覆盖默认关键目录；
- `--smoke-html`：可重复传入，覆盖默认 smoke 目标文件。

### 样例输出（成功）

```text
[PASS] [syntax] app/components/daxi-guide-ui.component.js
[PASS] [smoke] app/navi_app/shouxihu/js/bootstrap-loader.js referenced by app/navi_app/shouxihu/index_src.html
SUMMARY pass=89 fail=0 syntax_checked=87
```

### 失败示例

```bash
node scripts/ci/minimal-ci.js --smoke-html app/navi_app/shouxihu/not-exist.html
```

```text
[FAIL] [smoke] app/navi_app/shouxihu/not-exist.html html file not found
SUMMARY pass=87 fail=1 syntax_checked=87
```

该失败示例的退出码为 `1`。
