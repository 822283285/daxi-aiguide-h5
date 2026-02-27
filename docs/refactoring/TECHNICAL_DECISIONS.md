# 技术选型修正说明

**项目**: daxi-aiguide-h5 模块化重构
**更新日期**: 2026-02-26
**状态**: 技术选型最终确认

---

## 关键技术决策

### 1. 状态管理方案调整

**原建议**: Zustand（基于 React 生态）
**调整为**: ✅ **自定义无依赖状态管理器**

**理由**:
- 项目不使用 Vue/React 等框架
- 需要轻量级、无依赖的状态管理
- 基于现有的 state manager 概念

**实现方案**:
```javascript
// core/state/state-manager.js
/**
 * 轻量级状态管理器
 * 无依赖，基于观察者模式
 */
export class StateManager {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Map();
    this.middleware = [];
  }

  // 获取当前状态
  getState() {
    return this.state;
  }

  // 更新状态
  setState(updater) {
    const prevState = this.state;
    this.state = typeof updater === 'function' ? updater(prevState) : updater;

    // 通知所有订阅者
    this.notify(this.state, prevState);
  }

  // 订阅状态变化
  subscribe(listener) {
    const id = Symbol('listener');
    this.listeners.set(id, listener);
    return () => this.listeners.delete(id);
  }

  // 通知订阅者
  notify(nextState, prevState) {
    let middlewareIndex = 0;

    const dispatch = (state) => {
      if (middlewareIndex < this.middleware.length) {
        const middleware = this.middleware[middlewareIndex++];
        return middleware(state, prevState, dispatch);
      }

      // 执行所有监听器
      this.listeners.forEach(listener => {
        try {
          listener(nextState, prevState);
        } catch (error) {
          console.error('[StateManager] Listener error:', error);
        }
      });
    };

    dispatch(this.state);
  }

  // 添加中间件
  use(middleware) {
    this.middleware.push(middleware);
  }
}

// 创建全局状态实例
export const appState = new StateManager({
  // 用户状态
  currentUser: null,

  // 地图状态
  currentBuilding: null,
  availableBuildings: [],

  // 导航状态
  isNavigating: false,
  currentRoute: null,

  // UI 状态
  currentPage: 'HomePage',
  pageHistory: [],
});
```

---

### 2. 类型系统调整

**原建议**: TypeScript
**调整为**: ✅ **JSDoc + VS Code 类型提示**

**理由**:
- 项目不使用 TypeScript
- JSDoc 足以提供类型提示
- 降低构建复杂度

**实现方案**:
```javascript
/**
 * @typedef {Object} POIData
 * @property {string} id - POI ID
 * @property {string} poiId - POI 业务 ID
 * @property {string} name - POI 名称
 * @property {string} address - 地址
 * @property {number} lon - 经度
 * @property {number} lat - 纬度
 * @property {string} bdid - 建筑物 ID
 * @property {string} floorId - 楼层 ID
 */

/**
 * POI 实体类
 * @class
 */
export class POI {
  /**
   * 创建 POI 实例
   * @param {POIData} data - POI 数据
   */
  constructor(data) {
    /** @type {string} */
    this.id = data.id || '';

    /** @type {string} */
    this.name = data.name || '';

    /** @type {number} */
    this.lon = parseFloat(data.lon) || 0;

    /** @type {number} */
    this.lat = parseFloat(data.lat) || 0;
  }

  /**
   * 获取完整名称
   * @returns {string}
   */
  getFullName() {
    return `${this.name} (${this.address || ''})`;
  }
}
```

**VS Code 配置** (`.vscode/settings.json`):
```json
{
  "javascript.implicitProjectConfig.checkJs": true,
  "javascript.implicitProjectConfig.typeChecking.mode": "strict"
}
```

---

### 3. 包管理工具调整

**原建议**: npm
**调整为**: ✅ **pnpm**

**理由**:
- 更快的安装速度
- 更严格的依赖管理
- 节省磁盘空间

**实现方案**:
```bash
# 安装 pnpm (如果未安装)
npm install -g pnpm

# 初始化项目
pnpm init

# 安装依赖
pnpm add zepto crypto-js three mapbox-gl swiper
pnpm add -D vite @vitejs/plugin-legacy eslint prettier jest

# 运行命令
pnpm dev
pnpm build
pnpm test
```

---

### 4. 应用架构调整

**原理解**: 可能保留多页面结构
**调整为**: ✅ **单页面应用 (SPA) 架构**

**核心特征**:
- **单一入口**: `index.html`
- **单一启动**: `main.js`
- **基于状态的路由**: 使用 State Manager 管理页面状态

**架构图**:
```
┌─────────────────────────────────────┐
│          index.html                 │
│  (唯一入口，静态 HTML)              │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│            main.js                  │
│  (应用启动，状态管理初始化)          │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│         StateManager                │
│  (currentPage 状态驱动路由)          │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│      PageController 注册表           │
│  (HomePage, MapStateBrowse, ...)    │
└──────────────────┬──────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌──────────────┐    ┌──────────────┐
│ UI Layer     │    │ Platform    │
│ (Controllers)│    │ (Services)  │
└──────────────┘    └──────────────┘
```

**路由实现**:
```javascript
// core/router/state-router.js
import { appState } from '../state/state-manager';
import { pageControllerRegistry } from '@/ui/controllers/page-controller-registry';

/**
 * 基于状态的路由管理器
 * 通过监听 appState.currentPage 变化来切换页面
 */
export class StateRouter {
  constructor() {
    this.currentController = null;
    this.container = null;
  }

  /**
   * 初始化路由
   * @param {string} containerId - 容器元素 ID
   */
  init(containerId = 'container') {
    this.container = document.getElementById(containerId);

    // 监听页面状态变化
    appState.subscribe((nextState, prevState) => {
      if (nextState.currentPage !== prevState.currentPage) {
        this.navigate(nextState.currentPage);
      }
    });
  }

  /**
   * 导航到指定页面
   * @param {string} pageName - 页面名称
   * @param {Object} params - 页面参数
   */
  navigate(pageName, params = {}) {
    console.log(`[Router] Navigating to: ${pageName}`);

    // 1. 销毁当前页面
    if (this.currentController) {
      this.currentController.onDestroy();
      this.currentController = null;
    }

    // 2. 获取新页面控制器
    const ControllerClass = pageControllerRegistry[pageName];
    if (!ControllerClass) {
      console.error(`[Router] Page not found: ${pageName}`);
      return;
    }

    // 3. 创建并初始化新页面
    this.currentController = new ControllerClass({
      container: this.container,
      router: this
    });

    // 4. 调用页面生命周期
    this.currentController.onCreate(params);
    this.currentController.onShow();

    // 5. 更新历史记录
    const history = appState.getState().pageHistory || [];
    appState.setState({
      pageHistory: [...history, pageName]
    });
  }

  /**
   * 返回上一页
   */
  back() {
    const history = appState.getState().pageHistory || [];
    if (history.length > 1) {
      history.pop(); // 移除当前页
      const prevPage = history.pop(); // 获取上一页
      appState.setState({ currentPage: prevPage });
    }
  }
}

// 全局路由实例
export const router = new StateRouter();
```

**页面控制器注册**:
```javascript
// ui/controllers/page-controller-registry.js
import { HomePageController } from './home-page-controller';
import { MapStateBrowseController } from './map-state-browse-page-controller';
// ... 其他控制器

/**
 * 页面控制器注册表
 * 将页面名称映射到控制器类
 */
export const pageControllerRegistry = {
  'HomePage': HomePageController,
  'MapStateBrowse': MapStateBrowseController,
  'MapStateRoute': MapStateRouteController,
  'MapStateNavi': MapStateNaviController,
  // ... 其他页面
};
```

**main.js 入口**:
```javascript
// main.js
import { appState } from './core/state/state-manager';
import { router } from './core/router/state-router';
import { ConfigService } from './core/config/config-service';
import { BridgeService } from './platform/bridge/bridge-service';
import { registerAllPageControllers } from './ui/controllers';

/**
 * 应用启动函数
 */
async function bootstrap() {
  console.log('[App] Bootstrap started');

  // 1. 初始化配置服务
  const config = ConfigService.fromWindow(window);
  console.log('[App] Environment:', config.getCurrentEnv());

  // 2. 初始化桥接服务
  const bridge = new BridgeService({ globalRef: window });
  console.log('[App] Bridge available:', bridge.isAvailable());

  // 3. 注册所有页面控制器
  registerAllPageControllers({ globalRef: window });

  // 4. 初始化路由
  router.init('container');

  // 5. 解析 URL 参数，确定初始页面
  const params = config.parseParams();
  const initialPage = params.page || 'HomePage';

  // 6. 启动应用
  appState.setState({
    currentPage: initialPage,
    initialParams: params
  });

  console.log('[App] Bootstrap completed');
}

// 启动应用
bootstrap().catch(error => {
  console.error('[App] Bootstrap failed:', error);
});
```

**单一 index.html**:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
  <title>大希智能导游</title>

  <!-- 样式 -->
  <link rel="stylesheet" href="/app/navi_app/shouxihu/css/main.css">
  <link rel="stylesheet" href="/app/navi_app/shouxihu/css/blue.css">
</head>
<body>
  <!-- 加载中容器 -->
  <div id="first_page"></div>

  <!-- 地图容器 -->
  <div id="app" class="map_page_container"></div>

  <!-- 页面容器 (路由挂载点) -->
  <div id="container" class="ui_page_container"></div>

  <!-- 应用入口 -->
  <script type="module" src="/app/navi_app/shouxihu/main.js"></script>
</body>
</html>
```

---

## 更新的技术栈

| 领域 | 选择 | 说明 |
|------|------|------|
| **构建工具** | Vite | 快速开发，原生 ES6 支持 |
| **包管理** | pnpm | 高效，严格依赖管理 |
| **状态管理** | 自定义 StateManager | 无依赖，基于观察者模式 |
| **路由** | State-based Router | 基于状态驱动的页面切换 |
| **类型提示** | JSDoc | VS Code 类型检查 |
| **代码规范** | ESLint + Prettier | 行业标准 |
| **测试框架** | Jest | 单元测试 |
| **UI 框架** | ❌ 无 | 自定义组件系统 |

---

## 更新的文件结构

```
daxi-aiguide-h5/
├── index.html                    # 唯一入口
├── pnpm-lock.yaml
├── package.json
├── vite.config.js
├── eslint.config.js
├── jest.config.js
│
├── app/navi_app/shouxihu/
│   ├── main.js                   # 应用启动入口 ✨
│   ├── src/                      # 模块化源码
│   │   ├── core/
│   │   │   ├── state/
│   │   │   │   └── state-manager.js  # 状态管理器 ✨
│   │   │   ├── router/
│   │   │   │   └── state-router.js   # 状态路由 ✨
│   │   │   └── config/
│   │   │       └── config-service.js
│   │   ├── domain/
│   │   ├── application/
│   │   ├── platform/
│   │   ├── ui/
│   │   │   └── controllers/
│   │   │       ├── page-controller-registry.js
│   │   │       ├── home-page-controller.js
│   │   │       └── ...
│   │   └── legacy/
│   │       └── bridge-compat.js
│   │
│   ├── css/                      # 样式文件
│   ├── js/                       # 旧代码（待迁移）
│   └── libs/                     # 第三方库（迁移到 npm）
│
├── map_sdk/                      # 保持不变
├── jsbridge/                     # 保持不变
├── scripts/                      # 构建脚本
└── docs/                         # 文档
```

---

## 迁移路径

### Phase 1: 基础设施（不变）
- pnpm 项目初始化
- Vite 配置
- ESLint/Prettier 配置

### Phase 2: 核心架构（调整）
- ✅ 实现 StateManager
- ✅ 实现 StateRouter
- ✅ ConfigService 完善
- ✅ BridgeService 完善

### Phase 3: 页面控制器（不变）
- 20+ 页面控制器迁移
- 基于状态的路由集成

### Phase 4: Window 引用消除（不变）
- 逐步替换 window 访问

### Phase 5: 测试和文档（不变）
- 单元测试
- 集成测试
- 文档完善

---

## 示例：页面控制器实现

```javascript
// ui/controllers/home-page-controller.js
import { appState } from '@/core/state/state-manager';
import { BasePageController } from './base-page-controller';

/**
 * 首页控制器
 * @class
 */
export class HomePageController extends BasePageController {
  /**
   * @override
   */
  onCreate(params) {
    super.onCreate(params);
    console.log('[HomePage] onCreate with params:', params);

    this.render();
    this.bindEvents();
  }

  /**
   * 渲染页面
   */
  render() {
    this.container.innerHTML = `
      <div class="home-page">
        <h1>大希智能导游</h1>
        <button data-action="browse">浏览地图</button>
        <button data-action="service">服务</button>
        <button data-action="profile">我的</button>
      </div>
    `;
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    this.container.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (!action) return;

      switch (action) {
        case 'browse':
          // 通过状态更新触发路由
          appState.setState({ currentPage: 'MapStateBrowse' });
          break;
        case 'service':
          appState.setState({ currentPage: 'ServicePage' });
          break;
        case 'profile':
          appState.setState({ currentPage: 'ProfilePage' });
          break;
      }
    });
  }

  /**
   * @override
   */
  onDestroy() {
    console.log('[HomePage] onDestroy');
    this.container.innerHTML = '';
  }
}
```

---

## 验证清单

- [ ] 单一 index.html 入口
- [ ] 单一 main.js 启动脚本
- [ ] StateManager 无依赖实现
- [ ] StateRouter 基于状态切换页面
- [ ] 所有页面控制器继承 BasePageController
- [ ] 通过 appState.currentPage 控制路由
- [ ] JSDoc 类型提示工作正常
- [ ] pnpm 包管理正常
- [ ] 无 Vue/React 依赖

---

**版本**: 2.0
**更新日期**: 2026-02-26
**状态**: ✅ 技术选型已最终确认
