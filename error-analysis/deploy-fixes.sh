#!/bin/bash
# 大希 H5 错误修复部署脚本
# 使用时间：2026-03-01 15:50 GMT+8

set -e

echo "======================================"
echo "大希 H5 错误修复部署脚本"
echo "======================================"
echo ""

# 配置
PROJECT_DIR="/home/ubuntu/.openclaw/workspace/code/daxi-aiguide-h5"
REMOTE_USER="ubuntu"
REMOTE_HOST="html.qkbyte.cn"
REMOTE_PATH="/var/www/html/daxi"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
cd "$PROJECT_DIR" || exit 1

echo "📁 项目目录：$PROJECT_DIR"
echo ""

# 步骤 1: 验证修复文件
echo "📋 步骤 1: 验证修复文件..."
echo ""

FILES_TO_CHECK=(
    "map_sdk/map/daximap.api.js"
    "map_sdk/map/daximap.control.js"
    "map_sdk/map/daximap.scene.js"
    "map_sdk/map/daximap.utils.js"
    "map_sdk/map/daximap-core.js"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ $file"
    else
        echo -e "  ${RED}❌ $file (文件不存在)${NC}"
        exit 1
    fi
done

echo ""

# 步骤 2: 检查是否还有未修复的 global 引用
echo "🔍 步骤 2: 检查 global 引用..."
echo ""

UNFIXED_GLOBALS=$(grep -rn "= global\." map_sdk/map/*.js 2>/dev/null | grep -v "window" | grep -v "// " || true)

if [ -z "$UNFIXED_GLOBALS" ]; then
    echo -e "  ✅ 所有 global 引用已修复"
else
    echo -e "  ${RED}❌ 发现未修复的 global 引用:${NC}"
    echo "$UNFIXED_GLOBALS"
    exit 1
fi

echo ""

# 步骤 3: 本地测试（可选）
echo "🧪 步骤 3: 本地测试（可选）..."
echo ""
read -p "是否运行本地截图测试？(y/N): " run_test

if [ "$run_test" = "y" ] || [ "$run_test" = "Y" ]; then
    echo "运行测试..."
    pnpm test:screenshot || echo -e "${YELLOW}⚠️  测试失败，但可以继续部署${NC}"
fi

echo ""

# 步骤 4: 构建项目
echo "🏗️  步骤 4: 构建项目..."
echo ""

if command -v pnpm &> /dev/null; then
    pnpm build
    echo -e "  ✅ 构建完成"
else
    echo -e "  ${YELLOW}⚠️  pnpm 未安装，跳过构建${NC}"
fi

echo ""

# 步骤 5: 部署到远程服务器
echo "🚀 步骤 5: 部署到远程服务器..."
echo ""

read -p "是否部署到远程服务器？(y/N): " deploy

if [ "$deploy" = "y" ] || [ "$deploy" = "Y" ]; then
    echo "请输入远程服务器密码或使用 SSH 密钥..."
    echo ""
    
    # 部署文件
    echo "上传文件..."
    
    rsync -avz \
        map_sdk/map/daximap.api.js \
        map_sdk/map/daximap.control.js \
        map_sdk/map/daximap.scene.js \
        map_sdk/map/daximap.utils.js \
        map_sdk/map/daximap-core.js \
        "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/map_sdk/map/"
    
    echo -e "  ✅ 文件上传完成"
    
    # 如果构建了 dist，也部署 dist
    if [ -d "dist" ]; then
        echo ""
        echo "上传 dist 目录..."
        rsync -avz dist/ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"
        echo -e "  ✅ dist 目录上传完成"
    fi
    
    echo ""
    echo -e "${GREEN}======================================"
    echo "✅ 部署完成！"
    echo "======================================${NC}"
    echo ""
    echo "请访问以下 URL 验证："
    echo "  基础测试：https://${REMOTE_HOST}/daxi/"
    echo "  带参数测试：https://${REMOTE_HOST}/daxi/?token=YOUR_TOKEN&buildingId=S10000008"
    echo ""
else
    echo "⚠️  跳过部署"
    echo ""
    echo "手动部署命令："
    echo "  rsync -avz map_sdk/map/*.js ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/map_sdk/map/"
    echo ""
fi

# 步骤 6: 创建备份（在远程服务器上）
echo "💾 步骤 6: 创建备份建议..."
echo ""
echo "建议在远程服务器上创建备份："
echo "  cd ${REMOTE_PATH}/map_sdk/map/"
echo "  cp daximap.api.js daximap.api.js.bak.\$(date +%Y%m%d-%H%M%S)"
echo "  cp daximap.control.js daximap.control.js.bak.\$(date +%Y%m%d-%H%M%S)"
echo "  cp daximap.scene.js daximap.scene.js.bak.\$(date +%Y%m%d-%H%M%S)"
echo "  cp daximap.utils.js daximap.utils.js.bak.\$(date +%Y%m%d-%H%M%S)"
echo "  cp daximap-core.js daximap-core.js.bak.\$(date +%Y%m%d-%H%M%S)"
echo ""

echo "======================================"
echo "脚本执行完成"
echo "======================================"
