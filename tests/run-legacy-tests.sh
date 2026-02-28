#!/bin/bash

# 测试运行脚本 - Legacy 模块
# 用于运行现代化改造后的单元测试

set -e

echo "🧪 运行 Legacy 模块单元测试"
echo "================================"
echo ""

cd "$(dirname "$0")/../../.."

# 检查依赖
if [ ! -d "node_modules" ]; then
  echo "❌ 未找到 node_modules，请先运行：pnpm install"
  exit 1
fi

# 运行测试
echo "📋 测试文件列表:"
echo "  - tests/unit/legacy/mapView.test.js"
echo "  - tests/unit/legacy/command.test.js"
echo "  - tests/unit/legacy/mapStatePoi.test.js"
echo "  - tests/unit/legacy/mapStateNavi.test.js"
echo "  - tests/unit/legacy/mapStateRoute.test.js"
echo ""

echo "🚀 开始运行测试..."
echo ""

# 运行所有 legacy 测试
pnpm test -- tests/unit/legacy/ --verbose

echo ""
echo "================================"
echo "✅ 测试完成!"
echo ""
echo "📊 查看覆盖率报告:"
echo "   pnpm test:coverage"
echo "   然后打开：coverage/lcov-report/index.html"
echo ""
