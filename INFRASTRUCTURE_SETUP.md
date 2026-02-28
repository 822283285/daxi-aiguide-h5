# 基础设施配置说明

本文档描述了项目的代码质量和开发工具配置。

## 📦 已安装的工具

### 1. Prettier (v3.8.1)

代码格式化工具，确保代码风格统一。

**配置文件:**

- `.prettierrc` - Prettier 配置
- `.prettierignore` - 忽略文件列表

**可用脚本:**

```bash
pnpm run format          # 格式化 src/ 目录下的文件
pnpm run format:check    # 检查格式（不修改）
pnpm run format:all      # 格式化所有文件
```

**主要配置:**

- 行宽：100 字符
- 缩进：2 空格
- 引号：双引号
- 分号：需要
- 行尾：LF (Unix)

### 2. ESLint (v9.0.0+)

代码质量检查工具。

**配置文件:**

- `eslint.config.js` - ESLint 配置（Flat Config）

**主要规则:**

- `prefer-const`: error - 优先使用 const
- `no-var`: error - 禁止使用 var
- `prefer-template`: error - 优先使用模板字符串
- `prefer-arrow-callback`: error - 优先使用箭头函数
- `quotes`: error - 双引号
- `semi`: error - 需要分号
- `indent`: error - 2 空格缩进

**可用脚本:**

```bash
pnpm run lint      # 检查代码
pnpm run lint:fix  # 自动修复问题
```

### 3. Husky (v9.1.7) + lint-staged (v16.2.7)

Git hooks 管理工具，在提交前自动执行代码检查。

**配置文件:**

- `.husky/pre-commit` - Git pre-commit hook
- `package.json` - lint-staged 配置

**工作流程:**

1. Git commit 时自动触发
2. 只对暂存的文件执行检查
3. 自动修复格式问题
4. 如果检查失败，阻止提交

**lint-staged 配置:**

```json
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,css,scss,md,html}": ["prettier --write"]
}
```

### 4. EditorConfig

跨编辑器统一代码风格。

**配置文件:**

- `.editorconfig`

**主要配置:**

- 字符集：UTF-8
- 行尾：LF
- 缩进：2 空格
- 删除行尾空格
- 文件末尾空行

## 🚀 使用指南

### 首次设置

```bash
# 安装依赖
pnpm install

# Husky 会自动通过 prepare 脚本初始化
```

### 日常开发

```bash
# 开发时自动格式化
pnpm run format

# 提交前手动检查
pnpm run lint
pnpm run format:check

# 自动修复所有问题
pnpm run lint:fix
pnpm run format
```

### Git 提交

```bash
# 添加文件
git add .

# 提交（自动触发 lint-staged）
git commit -m "feat: your message"
```

## 📋 检查清单

- [x] Prettier 安装和配置
- [x] ESLint 规则完善（prefer-template, no-var, prefer-const 等）
- [x] Husky + lint-staged 配置
- [x] EditorConfig 配置
- [x] package.json 脚本添加

## 🔧 故障排除

### Husky 不工作

```bash
# 重新初始化 Husky
pnpm exec husky init
```

### lint-staged 不工作

```bash
# 检查 package.json 中的 lint-staged 配置
# 确保 .husky/pre-commit 包含：npx lint-staged
```

### Prettier 和 ESLint 冲突

两个工具配置已协调：

- Prettier 负责格式（缩进、空格、引号等）
- ESLint 负责代码质量（未使用变量、最佳实践等）

## 📚 相关资源

- [Prettier 文档](https://prettier.io/docs/en/)
- [ESLint 文档](https://eslint.org/docs/latest/)
- [Husky 文档](https://typicode.github.io/husky/)
- [lint-staged 文档](https://github.com/lint-staged/lint-staged)
- [EditorConfig](https://editorconfig.org/)
