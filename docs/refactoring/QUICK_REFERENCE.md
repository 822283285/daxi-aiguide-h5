# 重构快速参考指南

**项目**: daxi-aiguide-h5 模块化重构
**版本**: 2.0
**更新日期**: 2026-02-26

---

## 🚀 快速开始

### 环境准备

```bash
# 安装 pnpm
npm install -g pnpm

# 初始化项目
cd daxi-aiguide-h5
pnpm install

# 启动开发服务器
pnpm dev
```

### 项目结构

```
daxi-aiguide-h5/
├── index.html              # 唯一入口
├── main.js                 # 应用启动
├── src/                    # 模块化源码
│   ├── core/               # 核心层
│   │   ├── state/          # 状态管理
│   │   ├── router/         # 路由
│   │   └── config/         # 配置
│   ├── domain/             # 领域层
│   ├── application/        # 应用层
│   ├── ui/                 # UI 层
│   ├── platform/           # 平台层
│   └── legacy/             # 兼容层
├── map_sdk/                # 地图 SDK (保持不变)
└── jsbridge/               # JS 桥接 (保持不变)
```

---

## 📦 核心模块

### 1. StateManager (状态管理)

**文件**: `src/core/state/state-manager.js`

```javascript
import { StateManager } from '@/core/state/state-manager.js';

// 创建状态实例
const appState = new StateManager({
  currentPage: 'HomePage',
  currentUser: null,
  isNavigating: false
});

// 获取状态
const state = appState.getState();

// 更新状态
appState.setState({ currentPage: 'MapStateBrowse' });

// 订阅变化
const unsubscribe = appState.subscribe((nextState, prevState) => {
  console.log('State changed:', prevState, '->', nextState);
});

// 取消订阅
unsubscribe();
```

**JSDoc 类型提示**:
```javascript
/**
 * @typedef {Object} AppState
 * @property {string} currentPage - 当前页面
 * @property {User|null} currentUser - 当前用户
 * @property {boolean} isNavigating - 是否正在导航
 */

/**
 * @type {StateManager<AppState>}
 */
const appState = new StateManager({...});
```

---

### 2. StateRouter (路由管理)

**文件**: `src/core/router/state-router.js`

```javascript
import { router } from '@/core/router/state-router.js';
import { appState } from '@/core/state/app-state.js';

// 初始化路由
router.init('container'); // 挂载到 <div id="container">

// 导航（通过状态）
appState.setState({ currentPage: 'HomePage' });

// 返回上一页
router.back();
```

**页面控制器注册**:
```javascript
// src/ui/controllers/page-controller-registry.js
export const pageControllerRegistry = {
  'HomePage': HomePageController,
  'MapStateBrowse': MapStateBrowseController,
  'MapStateRoute': MapStateRouteController,
  // ...
};
```

---

### 3. BasePageController (页面控制器)

**文件**: `src/ui/controllers/base-page-controller.js`

```javascript
import { BasePageController } from '@/ui/controllers/base-page-controller.js';
import { appState } from '@/core/state/app-state.js';

export class HomePageController extends BasePageController {
  onCreate(params) {
    super.onCreate(params);
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="home-page">
        <h1>首页</h1>
        <button data-action="browse">浏览地图</button>
      </div>
    `;
  }

  bindEvents() {
    this.container.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'browse') {
        appState.setState({ currentPage: 'MapStateBrowse' });
      }
    });
  }

  onDestroy() {
    this.container.innerHTML = '';
  }
}
```

---

### 4. ConfigService (配置服务)

**文件**: `src/core/config/config-service.js`

```javascript
import { ConfigService } from '@/core/config/config-service.js';

// 创建实例
const config = ConfigService.fromWindow(window);

// 获取环境
const env = config.getCurrentEnv(); // 'ios' | 'android' | 'web' | 'wechat'

// 获取 URL 参数
const bdid = config.get('bdid', '');
const userId = config.get('userId', '');

// 检查是否为原生平台
if (config.isNativePlatform()) {
  // 原生平台逻辑
}
```

---

## 🔧 开发指南

### 创建新页面

**1. 创建控制器**:
```javascript
// src/ui/controllers/my-page-controller.js
import { BasePageController } from './base-page-controller.js';
import { appState } from '@/core/state/app-state.js';

export class MyPageController extends BasePageController {
  onCreate(params) {
    super.onCreate(params);
    console.log('Page params:', params);
    this.render();
  }

  render() {
    this.container.innerHTML = '<div class="my-page">...</div>';
  }

  onDestroy() {
    // 清理
  }
}
```

**2. 注册控制器**:
```javascript
// src/ui/controllers/page-controller-registry.js
import { MyPageController } from './my-page-controller.js';

export const pageControllerRegistry = {
  // ...其他页面
  'MyPage': MyPageController,
};
```

**3. 导航到页面**:
```javascript
// 在任何地方
appState.setState({ currentPage: 'MyPage', extraData: {...} });
```

---

### 使用状态管理

**推荐模式**:

```javascript
// 1. 定义初始状态
const initialState = {
  items: [],
  isLoading: false,
  error: null
};

// 2. 创建状态实例
const listState = new StateManager(initialState);

// 3. 在页面中使用
export class ListPageController extends BasePageController {
  onCreate(params) {
    super.onCreate(params);

    // 订阅状态变化
    this.unsubscribe = listState.subscribe((state) => {
      this.render(state);
    });

    // 加载数据
    this.loadData();
  }

  async loadData() {
    listState.setState({ isLoading: true });

    try {
      const items = await api.fetchItems();
      listState.setState({ items, isLoading: false, error: null });
    } catch (error) {
      listState.setState({ error, isLoading: false });
    }
  }

  render(state) {
    this.container.innerHTML = `
      <div class="list-page">
        ${state.isLoading ? '<p>加载中...</p>' : ''}
        ${state.error ? `<p>错误: ${state.error}</p>` : ''}
        <ul>
          ${state.items.map(item => `<li>${item.name}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  onDestroy() {
    // 取消订阅
    this.unsubscribe?.();
  }
}
```

---

### 依赖注入模式

```javascript
// 创建控制器时注入依赖
const controller = new MyPageController({
  container: document.getElementById('container'),
  router: router,
  apiService: myApiService,
  logger: console
});

// 在控制器中使用
export class MyPageController extends BasePageController {
  constructor(options = {}) {
    super(options);
    this.apiService = options.apiService;
    this.logger = options.logger || console;
  }

  async loadData() {
    try {
      const data = await this.apiService.fetch('/api/data');
      this.logger.info('Data loaded:', data);
    } catch (error) {
      this.logger.error('Failed to load:', error);
    }
  }
}
```

---

## 🧪 测试指南

### 单元测试示例

```javascript
// src/__tests__/state-manager.test.js
import { describe, it, expect, beforeEach } from '@jest/globals';
import { StateManager } from '@/core/state/state-manager.js';

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager({ count: 0 });
  });

  it('should get initial state', () => {
    expect(stateManager.getState()).toEqual({ count: 0 });
  });

  it('should update state', () => {
    stateManager.setState({ count: 1 });
    expect(stateManager.getState().count).toBe(1);
  });

  it('should notify listeners', () => {
    let called = false;
    stateManager.subscribe(() => { called = true; });
    stateManager.setState({ count: 1 });
    expect(called).toBe(true);
  });
});
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test -- --watch

# 覆盖率报告
pnpm test -- --coverage
```

---

## 📝 代码规范

### JSDoc 注释

```javascript
/**
 * 计算两点之间的距离
 * @param {Object} point1 - 起点坐标
 * @param {number} point1.lon - 经度
 * @param {number} point1.lat - 纬度
 * @param {Object} point2 - 终点坐标
 * @returns {number} 距离（米）
 */
export function calculateDistance(point1, point2) {
  // 实现...
}
```

### 命名规范

```javascript
// 类名: PascalCase
export class HomePageController {}

// 文件名: kebab-case
// home-page-controller.js

// 函数/变量: camelCase
const currentUser = null;
function getPageData() {}

// 常量: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// 私有成员: 前缀下划线
class Foo {
  _privateMethod() {}
}
```

---

## 🎯 常见任务

### 添加新依赖

```bash
# 运行时依赖
pnpm add <package-name>

# 开发依赖
pnpm add -D <package-name>
```

### 代码格式化

```bash
# 检查格式
pnpm lint

# 自动修复
pnpm lint:fix

# 格式化所有文件
pnpm format
```

### 构建生产版本

```bash
# 构建
pnpm build

# 预览构建结果
pnpm preview
```

---

## ⚠️ 注意事项

### 禁止事项

1. ❌ 不要直接访问 `window`（除了必要的浏览器 API）
2. ❌ 不要在模块顶层执行副作用
3. ❌ 不要在控制器中直接修改 DOM（使用 render 方法）
4. ❌ 不要在循环中创建订阅

### 推荐做法

1. ✅ 使用 StateManager 管理状态
2. ✅ 使用依赖注入传递依赖
3. ✅ 在 onDestroy 中清理订阅和事件
4. ✅ 使用 JSDoc 提供类型提示

---

## 🐛 调试技巧

### 状态追踪

```javascript
// 添加日志中间件
appState.use((state, prevState, next) => {
  console.log('[State]', prevState, '->', state);
  next(state);
});
```

### 路由追踪

```javascript
// 原始 navigate 方法
const originalNavigate = router.navigate.bind(router);
router.navigate = function(pageName, params) {
  console.log('[Router] Navigate to:', pageName, params);
  originalNavigate(pageName, params);
};
```

---

## 📚 相关文档

- [REFACTORING_ANALYSIS.md](./REFACTORING_ANALYSIS.md) - 完整分析
- [TASKS_UPDATED.md](./TASKS_UPDATED.md) - 详细任务
- [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md) - 技术决策

---

**最后更新**: 2026-02-26
**维护者**: 开发团队
