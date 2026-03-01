# 开发者文档

**项目**: daxi-aiguide-h5 - 大希智能导游 H5 应用  
**版本**: 1.0.0  
**最后更新**: 2026-03-01

---

## 📖 目录

1. [架构说明](#架构说明)
2. [API 文档](#api-文档)
3. [最佳实践](#最佳实践)
4. [开发指南](#开发指南)
5. [测试说明](#测试说明)

---

## 架构说明

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      H5 应用                              │
├─────────────────────────────────────────────────────────┤
│  UI Layer (ui/)                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Pages   │  │Components│  │   Utils  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
├─────────────────────────────────────────────────────────┤
│  Application Layer (application/)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Services │  │  Stores  │  │  Events  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
├─────────────────────────────────────────────────────────┤
│  Domain Layer (domain/)                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Entities │  │  Values  │  │  Events  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
├─────────────────────────────────────────────────────────┤
│  Core Layer (core/)                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Config  │  │  State   │  │  Router  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
├─────────────────────────────────────────────────────────┤
│  Platform Layer (platform/)                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Map    │  │  Bridge  │  │  Storage │              │
│  └──────────┘  └──────────┘  └──────────┘              │
├─────────────────────────────────────────────────────────┤
│  API Layer (api/)                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  HTTP    │  │  Auth    │  │  Data    │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

### 分层职责

#### 1. UI Layer (`src/ui/`)
**职责**: 用户界面展示和交互
- 页面控制器
- UI 组件
- 用户交互处理
- 视图渲染

**依赖**: Application Layer  
**禁止**: 直接依赖 Domain/Core/Platform

#### 2. Application Layer (`src/application/`)
**职责**: 应用业务逻辑编排
- 服务编排
- 状态管理
- 事件处理
- 用例实现

**依赖**: Domain Layer, Platform Layer  
**禁止**: 直接依赖 UI Layer

#### 3. Domain Layer (`src/domain/`)
**职责**: 核心业务领域逻辑
- 业务实体
- 值对象
- 领域事件
- 业务规则

**依赖**: 无 (最内层)  
**禁止**: 依赖任何外层

#### 4. Core Layer (`src/core/`)
**职责**: 核心基础设施
- 配置管理
- 状态管理
- 路由管理
- 工具函数

**依赖**: 无 (基础设施)  
**禁止**: 依赖业务逻辑

#### 5. Platform Layer (`src/platform/`)
**职责**: 平台适配和外部系统交互
- 地图 SDK 适配
- JSBridge 封装
- 本地存储
- 设备能力

**依赖**: Core Layer  
**禁止**: 依赖 UI/Application

#### 6. API Layer (`src/api/`)
**职责**: 网络请求和数据交互
- HTTP 客户端
- 认证授权
- 数据序列化
- 接口定义

**依赖**: Core Layer  
**禁止**: 依赖 UI/Application

### 数据流

```
用户交互
   ↓
UI Layer (事件触发)
   ↓
Application Layer (业务处理)
   ↓
Domain Layer (业务规则)
   ↓
Platform/API Layer (外部调用)
   ↓
State Manager (状态更新)
   ↓
UI Layer (视图更新)
```

### 模块依赖规则

```
UI → Application → Domain
     Application → Platform
     Application → API
     Platform → Core
     API → Core
     
❌ 禁止:
UI → Domain (跨层)
UI → Platform (跨层)
Domain → UI (反向依赖)
```

---

## API 文档

### 核心服务 API

#### ConfigService

**路径**: `src/core/config/config-service.js`

```javascript
import { ConfigService } from '@/core/config/config-service';

// 从全局对象创建实例
const config = ConfigService.fromWindow(globalThis);

// 获取当前环境
const env = config.getCurrentEnv();

// 获取所有查询参数
const params = config.getAllQueryParams();

// 获取特定参数
const page = config.getQueryParam('page');

// 获取 API 配置
const apiConfig = config.getApiConfig();
```

#### State Manager

**路径**: `src/core/state/state-manager.js`

```javascript
import { appState } from '@/core/state/state-manager';

// 获取当前状态
const currentState = appState.getState();

// 设置状态
appState.setState({
  currentPage: 'HomePage',
  userInfo: { id: 123 }
});

// 订阅状态变化
const unsubscribe = appState.subscribe((newState, oldState) => {
  console.log('State changed:', newState);
});

// 取消订阅
unsubscribe();
```

#### Router

**路径**: `src/core/router/state-router.js`

```javascript
import { router } from '@/core/router/state-router';

// 初始化路由
router.init('container', appState);

// 导航到页面
router.navigateTo('ScenicPage', { id: 123 });

// 获取当前页面
const currentPage = router.getCurrentPage();

// 监听路由变化
router.onRouteChange((route) => {
  console.log('Route changed:', route);
});
```

#### Environment Detector

**路径**: `src/core/utils/env-detector.js`

```javascript
import { detectEnvironment } from '@/core/utils/env-detector';

// 检测运行环境
const platform = detectEnvironment(globalThis);

// 返回:
// {
//   isWeChat: boolean,
//   isMobile: boolean,
//   isIOS: boolean,
//   isAndroid: boolean,
//   appVersion: string
// }
```

### 平台服务 API

#### Map SDK

**路径**: `map_sdk/`

```javascript
import { MapSDK } from '@map_sdk';

// 初始化地图
const map = new MapSDK('map-container', {
  center: [116.397428, 39.90923],
  zoom: 12
});

// 添加标记
map.addMarker({
  position: [116.397428, 39.90923],
  title: '景点名称'
});

// 绘制路线
map.drawRoute([
  [116.397428, 39.90923],
  [116.407428, 39.91923]
]);
```

#### JSBridge

**路径**: `jsbridge/`

```javascript
import { bridge } from '@jsbridge';

// 调用原生方法
bridge.call('share', {
  title: '分享标题',
  url: 'https://...'
});

// 监听原生事件
bridge.on('backButtonPress', () => {
  console.log('返回按钮被按下');
});

// 移除监听
bridge.off('backButtonPress');
```

#### Storage

**路径**: `src/platform/storage/local-storage.js`

```javascript
import { storage } from '@platform/storage/local-storage';

// 设置数据
storage.set('user', { id: 123, name: '张三' });

// 获取数据
const user = storage.get('user');

// 移除数据
storage.remove('user');

// 清空所有
storage.clear();
```

### API 服务

#### HTTP Client

**路径**: `src/api/http-client.js`

```javascript
import { httpClient } from '@api/http-client';

// GET 请求
const data = await httpClient.get('/api/scenic/123');

// POST 请求
const result = await httpClient.post('/api/order', {
  scenicId: 123,
  count: 2
});

// 带认证的请求
httpClient.setToken('Bearer xxx');
```

#### 景点 API

**路径**: `src/api/scenic-api.js`

```javascript
import { scenicApi } from '@api/scenic-api';

// 获取景点列表
const list = await scenicApi.getList({
  page: 1,
  size: 20
});

// 获取景点详情
const detail = await scenicApi.getDetail(123);

// 获取景点语音
const audio = await scenicApi.getAudio(123);
```

---

## 最佳实践

### 1. 代码规范

#### 使用 ES6 模块
```javascript
// ✅ 推荐
import { ConfigService } from '@/core/config/config-service';
export function myFunction() {}

// ❌ 避免
const ConfigService = require('@/core/config/config-service');
module.exports = { myFunction };
```

#### 使用 const/let
```javascript
// ✅ 推荐
const MAX_COUNT = 100;
let count = 0;

// ❌ 避免
var MAX_COUNT = 100;
var count = 0;
```

#### 使用路径别名
```javascript
// ✅ 推荐
import { service } from '@/application/service';
import { utils } from '@utils/helpers';

// ❌ 避免
import { service } from '../../../application/service';
```

### 2. 状态管理

#### 集中式状态
```javascript
// ✅ 推荐 - 使用状态管理器
appState.setState({ currentPage: 'Home' });

// ❌ 避免 - 直接操作 DOM
document.getElementById('page').innerText = 'Home';
```

#### 不可变更新
```javascript
// ✅ 推荐
appState.setState({
  ...state,
  user: { ...state.user, name: 'New Name' }
});

// ❌ 避免
state.user.name = 'New Name';
```

### 3. 错误处理

#### Try-Catch
```javascript
// ✅ 推荐
try {
  const data = await api.getData();
  appState.setState({ data });
} catch (error) {
  console.error('[API] Get data failed:', error);
  appState.setState({ error: error.message });
}

// ❌ 避免
const data = await api.getData(); // 未处理错误
```

#### 错误边界
```javascript
// ✅ 推荐 - 页面级错误处理
class PageController {
  async load() {
    try {
      await this.loadData();
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

### 4. 性能优化

#### 懒加载
```javascript
// ✅ 推荐 - 按需加载
const HomePage = () => import('@ui/pages/home');

// ❌ 避免 - 一次性加载所有
import HomePage from '@ui/pages/home';
import ScenicPage from '@ui/pages/scenic';
// ... 所有页面
```

#### 防抖节流
```javascript
// ✅ 推荐
import { debounce } from '@utils/debounce';

const handleSearch = debounce((query) => {
  api.search(query);
}, 300);

// ❌ 避免
const handleSearch = (query) => {
  api.search(query); // 每次输入都请求
};
```

### 5. 资源管理

#### 图片优化
```javascript
// ✅ 推荐 - 使用 WebP，懒加载
<img data-src="image.webp" class="lazy" />

// ❌ 避免
<img src="large-image.png" />
```

#### 清理副作用
```javascript
// ✅ 推荐
useEffect(() => {
  const subscription = store.subscribe(handler);
  return () => subscription.unsubscribe();
}, []);

// ❌ 避免
const subscription = store.subscribe(handler);
// 未清理，导致内存泄漏
```

### 6. 测试规范

#### 单元测试
```javascript
// ✅ 推荐
describe('ConfigService', () => {
  test('should return correct environment', () => {
    const config = ConfigService.fromWindow(mockWindow);
    expect(config.getCurrentEnv()).toBe('production');
  });
});

// ❌ 避免
test('config works', () => {
  // 测试逻辑不清晰
});
```

#### 测试覆盖率
```bash
# 运行测试并生成覆盖率报告
pnpm test:coverage

# 目标覆盖率:
# - 语句覆盖率：>80%
# - 分支覆盖率：>70%
# - 函数覆盖率：>80%
```

---

## 开发指南

### 环境设置

#### 1. 安装依赖
```bash
# 检查 Node.js 版本 (>= 18.0.0)
node --version

# 检查 pnpm 版本 (>= 8.0.0)
pnpm --version

# 安装依赖
pnpm install
```

#### 2. 启动开发服务器
```bash
pnpm dev
```

- 访问：http://localhost:3000
- 热重载：自动启用
- 代理：/api → http://localhost:8080

#### 3. 构建生产版本
```bash
pnpm build
```

- 输出目录：`dist/`
- Source Map: 已启用
- 旧浏览器兼容：已启用

### 开发流程

#### 1. 创建新功能
```bash
# 创建功能分支
git checkout -b feature/new-feature

# 开发
pnpm dev
pnpm test
pnpm lint

# 提交
git add .
git commit -m "feat: add new feature"

# 推送
git push origin feature/new-feature
```

#### 2. 修复 Bug
```bash
# 创建修复分支
git checkout -b fix/bug-description

# 修复并测试
pnpm dev
pnpm test

# 提交
git add .
git commit -m "fix: resolve bug description"
```

#### 3. 代码审查
- 确保通过所有测试
- 确保 lint 检查通过
- 确保代码符合规范
- 创建 Pull Request

### 目录结构

```
src/
├── main.js                 # 应用入口
├── core/                   # 核心层
│   ├── config/            # 配置服务
│   ├── state/             # 状态管理
│   ├── router/            # 路由管理
│   └── utils/             # 工具函数
├── domain/                 # 领域层
│   ├── entities/          # 业务实体
│   ├── values/            # 值对象
│   └── events/            # 领域事件
├── application/            # 应用层
│   ├── services/          # 应用服务
│   ├── stores/            # 状态存储
│   └── events/            # 应用事件
├── ui/                     # UI 层
│   ├── pages/             # 页面控制器
│   ├── components/        # UI 组件
│   └── styles/            # 样式文件
├── platform/               # 平台层
│   ├── map/               # 地图适配
│   ├── bridge/            # JSBridge
│   └── storage/           # 本地存储
├── api/                    # API 层
│   ├── http-client.js     # HTTP 客户端
│   ├── auth-api.js        # 认证 API
│   └── scenic-api.js      # 景点 API
├── assets/                 # 静态资源
├── config/                 # 配置文件
├── utils/                  # 通用工具
└── legacy/                 # 兼容层 (旧代码)
```

### 调试技巧

#### 1. 使用 Source Map
```bash
# 构建时启用 source map
pnpm build

# 在浏览器开发者工具中查看源码
```

#### 2. 日志调试
```javascript
// 使用带标签的日志
console.log('[Component] Method called:', data);
console.error('[API] Request failed:', error);
console.warn('[Deprecated] Use newMethod instead');
```

#### 3. 性能分析
```javascript
// 使用 Performance API
console.time('operation');
// ... 操作
console.timeEnd('operation');

// 使用 Chrome DevTools Performance 面板
```

---

## 测试说明

### 测试框架

- **测试运行器**: Jest 29.7.0
- **测试环境**: JSDOM
- **覆盖率工具**: Istanbul (内置于 Jest)

### 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式 (开发时使用)
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage
```

### 测试目录结构

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

### 编写测试

#### 单元测试示例
```javascript
// tests/unit/core/config-service.test.js
import { ConfigService } from '@/core/config/config-service';

describe('ConfigService', () => {
  let mockWindow;

  beforeEach(() => {
    mockWindow = {
      location: {
        search: '?env=production&page=Home',
        href: 'http://localhost:3000/?env=production'
      }
    };
  });

  test('should create instance from window', () => {
    const config = ConfigService.fromWindow(mockWindow);
    expect(config).toBeInstanceOf(ConfigService);
  });

  test('should get current environment', () => {
    const config = ConfigService.fromWindow(mockWindow);
    const env = config.getCurrentEnv();
    expect(env).toBe('production');
  });

  test('should get query params', () => {
    const config = ConfigService.fromWindow(mockWindow);
    const params = config.getAllQueryParams();
    expect(params.page).toBe('Home');
  });
});
```

#### 集成测试示例
```javascript
// tests/integration/api/scenic-api.test.js
import { scenicApi } from '@/api/scenic-api';

describe('ScenicAPI Integration', () => {
  test('should fetch scenic list', async () => {
    const list = await scenicApi.getList({ page: 1, size: 10 });
    expect(list).toHaveProperty('items');
    expect(list).toHaveProperty('total');
  });

  test('should fetch scenic detail', async () => {
    const detail = await scenicApi.getDetail(123);
    expect(detail).toHaveProperty('id');
    expect(detail).toHaveProperty('name');
  });
});
```

### 测试覆盖率目标

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### 测试最佳实践

#### 1. 测试命名
```javascript
// ✅ 推荐
test('should return empty array when list is empty', () => {});
test('should throw error when id is invalid', () => {});

// ❌ 避免
test('test1', () => {});
test('fix bug', () => {});
```

#### 2. Arrange-Act-Assert
```javascript
// ✅ 推荐
test('should calculate total price', () => {
  // Arrange
  const items = [
    { price: 100, count: 2 },
    { price: 50, count: 3 }
  ];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(350);
});
```

#### 3. Mock 外部依赖
```javascript
// ✅ 推荐
jest.mock('@/api/http-client', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} }))
}));

test('should fetch data', async () => {
  await service.loadData();
  expect(httpClient.get).toHaveBeenCalledWith('/api/data');
});
```

---

## 附录

### 常用命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm preview          # 预览构建结果

# 测试
pnpm test             # 运行测试
pnpm test:watch       # 监听模式
pnpm test:coverage    # 生成覆盖率报告

# 代码质量
pnpm lint             # ESLint 检查
pnpm lint:fix         # 自动修复
pnpm format           # Prettier 格式化
pnpm format:check     # 检查格式

# 工具
pnpm health-check     # 健康检查
pnpm ci               # CI 检查
```

### 相关文档

- [性能优化报告](./PERFORMANCE_OPTIMIZATION_REPORT.md)
- [重构设计文档](./REFACTORING_DIRECTORY_DESIGN.md)
- [Phase 1 完成报告](./docs/refactoring/PHASE1_COMPLETE.md)
- [现代化改造完成](../../MODERNIZATION_COMPLETE.md)

### 外部资源

- [Vite 文档](https://vitejs.dev/)
- [Jest 文档](https://jestjs.io/)
- [ESLint 文档](https://eslint.org/)
- [Web Vitals](https://web.dev/vitals/)

---

**维护者**: 大希团队  
**最后更新**: 2026-03-01
