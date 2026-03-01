# daxi-aiguide-h5

**大希智能导游 H5 应用**

---

## 🚀 快速开始

### 前置要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0

```bash
# 检查 Node 版本
node --version

# 检查 pnpm 版本
pnpm --version

# 如果没有 pnpm
npm install -g pnpm
```

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

- 访问：http://localhost:3000
- 热重载：自动启用
- 代理：/api → http://localhost:8080

### 构建生产版本

```bash
pnpm build
```

- 输出目录：`dist/`
- Source Map: 已启用
- 旧浏览器兼容：已启用

### 预览构建结果

```bash
pnpm preview
```

---

## 🧪 测试

### 运行测试

```bash
pnpm test
```

### 监听模式

```bash
pnpm test:watch
```

### 覆盖率报告

```bash
pnpm test:coverage
```

覆盖率报告生成在 `coverage/` 目录，打开 `coverage/lcov-report/index.html` 查看 HTML 报告。

### 测试目录

```
tests/
├── setup.js                # 测试配置
├── unit/                   # 单元测试
│   ├── core/              # 核心层测试
│   ├── domain/            # 领域层测试
│   ├── application/       # 应用层测试
│   └── ui/                # UI 层测试
├── integration/            # 集成测试
│   └── api/               # API 集成测试
└── e2e/                    # E2E 测试
    └── flows/             # 用户流程测试
```

### 测试覆盖率目标

- 语句覆盖率：>80%
- 分支覆盖率：>70%
- 函数覆盖率：>80%
- 行覆盖率：>80%

**详细测试说明**: 参见 [`docs/DEVELOPER_GUIDE.md#测试说明`](docs/DEVELOPER_GUIDE.md#测试说明)

---

## 🔍 代码质量

### ESLint 检查

```bash
pnpm lint
```

### 自动修复

```bash
pnpm lint:fix
```

### 健康检查

```bash
pnpm health-check
```

生成 JS 代码基线报告，包含：
- JS 文件数量、总行数
- 重复文件名扫描
- window 全局写入点扫描

### CI 检查

```bash
pnpm ci
```

检查项：
- 语法检查
- Smoke 检查
- 全局基线检查
- 分层依赖检查

---

## 📁 目录结构

```
daxi-aiguide-h5/
├── src/                    # 源码目录
│   ├── main.js            # 应用入口
│   ├── core/              # 核心层
│   ├── domain/            # 领域层
│   ├── application/       # 应用层
│   ├── ui/                # UI 层
│   ├── platform/          # 平台层
│   ├── api/               # API 层
│   ├── assets/            # 静态资源
│   ├── config/            # 配置文件
│   ├── utils/             # 工具函数
│   └── legacy/            # 兼容层
├── public/                 # 公共资源
│   ├── static/            # 静态资源
│   └── libs/              # 第三方库
├── tests/                  # 测试目录
│   ├── unit/              # 单元测试
│   ├── integration/       # 集成测试
│   ├── e2e/               # E2E 测试
│   └── setup.js           # 测试配置
├── dist/                   # 构建输出 (gitignore)
├── docs/                   # 文档目录
│   └── refactoring/       # 重构文档
├── app/                    # 旧代码目录 (待迁移)
├── map_sdk/                # 地图 SDK
└── jsbridge/               # JS 桥接
```

---

## 🔧 配置说明

### Vite 配置

**文件**: `vite.config.js`

**路径别名**:
```javascript
import { something } from "@/core/something";
import { other } from "@domain/other";
```

**可用别名**:
- `@/` - src/
- `@core/` - src/core/
- `@domain/` - src/domain/
- `@application/` - src/application/
- `@ui/` - src/ui/
- `@platform/` - src/platform/
- `@api/` - src/api/
- `@assets/` - src/assets/
- `@config/` - src/config/
- `@utils/` - src/utils/
- `@legacy/` - src/legacy/
- `@map_sdk/` - map_sdk/
- `@jsbridge/` - jsbridge/

**构建配置**:
- 输出目录：`dist/`
- Source Map: 已启用
- 旧浏览器兼容：已启用 (@vitejs/plugin-legacy)
- 代码分割：vendor-core (zepto, crypto-js)

**性能优化配置**: 参见 [`PERFORMANCE_OPTIMIZATION_REPORT.md#优化建议`](PERFORMANCE_OPTIMIZATION_REPORT.md#优化建议)

### ESLint 配置

**文件**: `eslint.config.js`

**特性**:
- ES2025 语法支持
- 浏览器环境
- 自动检测 window 使用并建议替换
- 旧代码目录 (app/, legacy/) 使用宽松规则

### Jest 配置

**文件**: `jest.config.js`

**特性**:
- 路径别名支持
- 覆盖率统计
- JSDOM 环境
- 自动 Mock 全局变量

**覆盖率目标**:
- 语句覆盖率：>80%
- 分支覆盖率：>70%
- 函数覆盖率：>80%

---

## 📚 文档

### 重构文档

- `REFACTORING_DIRECTORY_DESIGN.md` - 目录设计文档
- `docs/refactoring/PHASE1_COMPLETE.md` - Phase 1 完成报告
- `docs/refactoring/REFACTORING_ANALYSIS.md` - 重构分析
- `docs/refactoring/TECHNICAL_DECISIONS.md` - 技术决策
- `docs/refactoring/TASKS_UPDATED.md` - 任务清单
- `docs/refactoring/QUICK_REFERENCE.md` - 快速参考

### 现代化改造文档

- `../../TRANSFORMATION_SUMMARY.md` - JS 文件现代化改造总结
- `../../MODERNIZATION_COMPLETE.md` - 改造完成报告（2026-03-01）
- `tests/unit/legacy/` - 旧模块单元测试目录

### 性能优化文档

- `PERFORMANCE_OPTIMIZATION_REPORT.md` - 性能优化报告（2026-03-01）
- `docs/DEVELOPER_GUIDE.md` - 开发者文档（架构、API、最佳实践）

### 测试报告

- `docs/reports/health-check.md` - 健康检查报告

---

## 🎯 当前状态

### Phase 1: 基础设施搭建

- ✅ **Phase 1.1**: 目录结构创建 - **完成**
- ✅ **Phase 1.2**: 配置文件创建 - **完成**
- ✅ **Phase 1.3**: 模块入口文件 - **完成**
- ✅ **Phase 1.4**: 核心层迁移 - **完成**
- ✅ **Phase 1.5**: 验证 - **完成**

### Phase 2: 代码现代化改造

- ✅ **Phase 2.1**: var→const/let 转换 - **完成**
- ✅ **Phase 2.2**: ES6 模块导出 - **完成**
- ✅ **Phase 2.3**: 单元测试添加 - **完成**
- ✅ **Phase 2.4**: 文档更新 - **完成**

**改造详情**: 参见 [`../../MODERNIZATION_COMPLETE.md`](../../MODERNIZATION_COMPLETE.md)

### Phase 3: 性能优化 (2026-03-01)

- ✅ **Phase 3.1**: 构建分析 - **完成**
- ✅ **Phase 3.2**: 性能优化报告 - **完成**
- ✅ **Phase 3.3**: 开发者文档 - **完成**
- ⏳ **Phase 3.4**: 代码分割优化 - **待实施**
- ⏳ **Phase 3.5**: 图片资源优化 - **待实施**
- ⏳ **Phase 3.6**: 懒加载实现 - **待实施**

**优化详情**: 参见 [`PERFORMANCE_OPTIMIZATION_REPORT.md`](PERFORMANCE_OPTIMIZATION_REPORT.md)

### 下一步

#### 立即可做
1. 安装图片优化插件并压缩资源
2. 实施代码分割配置
3. 实现路由懒加载

#### 短期计划
1. 在开发环境验证改造后的代码
2. 运行完整测试套件
3. 性能优化实施（参考优化报告）

#### 长期规划
1. 考虑 TypeScript 迁移
2. 引入组件库按需加载
3. 接入性能监控系统

```bash
pnpm install
pnpm dev
pnpm test
pnpm test:coverage
```

---

## 🤝 贡献指南

### 开发流程

1. 创建功能分支
   ```bash
   git checkout -b feature/your-feature
   ```

2. 开发并测试
   ```bash
   pnpm dev
   pnpm test
   pnpm lint
   ```

3. 提交代码
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

4. 推送并创建 PR
   ```bash
   git push origin feature/your-feature
   ```

### 提交信息规范

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 重构
- `test:` 测试
- `chore:` 构建/工具

---

## 📄 许可证

MIT

---

## 📞 联系方式

大希团队

---

**最后更新**: 2026-02-27  
**版本**: 1.0.0
