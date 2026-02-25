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
