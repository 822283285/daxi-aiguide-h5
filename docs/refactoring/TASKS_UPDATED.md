# 重构任务清单 (更新版)

**项目**: daxi-aiguide-h5 模块化重构
**更新日期**: 2026-02-26
**状态**: 待执行

---

## 技术选型（已确认）

| 领域 | 选择 | 说明 |
|------|------|------|
| 构建工具 | **Vite** | 快速开发，原生 ES6 支持 |
| 包管理 | **pnpm** | 高效，严格依赖管理 |
| 状态管理 | **自定义 StateManager** | 无依赖，基于观察者模式 |
| 路由 | **State-based Router** | 基于状态驱动的页面切换 |
| 类型提示 | **JSDoc** | VS Code 类型检查 |
| 代码规范 | **ESLint + Prettier** | 行业标准 |
| 测试框架 | **Jest** | 单元测试 |
| UI 框架 | **无** | 自定义组件系统 |

---

## 阶段 1: 基础设施搭建 (预计 2-3 天)

### 任务 1.1: 初始化 pnpm 项目

**目标**: 建立 pnpm 包管理体系

**子任务**:
- [ ] 1.1.1: 创建 `package.json`
  ```json
  {
    "name": "daxi-aiguide-h5",
    "version": "1.0.0",
    "type": "module",
    "description": "大希智能导游 H5 应用",
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview",
      "lint": "eslint .",
      "lint:fix": "eslint . --fix",
      "format": "prettier --write \"**/*.{js,css,html}\"",
      "test": "jest"
    },
    "devDependencies": {
      "@vitejs/plugin-legacy": "^5.0.0",
      "eslint": "^8.50.0",
      "eslint-config-prettier": "^9.0.0",
      "jest": "^29.7.0",
      "jest-environment-jsdom": "^29.7.0",
      "prettier": "^3.0.0",
      "vite": "^5.0.0"
    },
    "dependencies": {
      "crypto-js": "^4.2.0",
      "mapbox-gl": "^3.0.0",
      "swiper": "^11.0.0",
      "three": "^0.160.0"
    }
  }
  ```

- [ ] 1.1.2: 安装依赖
  ```bash
  # 安装 pnpm (如果未安装)
  npm install -g pnpm

  # 安装项目依赖
  pnpm install
  ```

- [ ] 1.1.3: 创建 `.npmrc`
  ```ini
  shamefully-hoist=true
  ```

- [ ] 1.1.4: 更新 `.gitignore`
  ```
  node_modules/
  .pnpm-store/
  dist/
  *.log
  .env
  .vscode/
  ```

**交付物**:
- `package.json`
- `pnpm-lock.yaml`
- `.npmrc`
- 更新的 `.gitignore`

**验收标准**:
- `pnpm install` 成功
- `node_modules` 生成

---

### 任务 1.2: 配置 Vite

**目标**: 建立现代构建系统

**子任务**:
- [ ] 1.2.1: 创建 `vite.config.js`
  ```javascript
  import { defineConfig } from 'vite';
  import { resolve } from 'path';

  export default defineConfig({
    resolve: {
      alias: {
        '@': resolve(__dirname, 'app/navi_app/shouxihu/src'),
        '@core': resolve(__dirname, 'app/navi_app/shouxihu/src/core'),
        '@domain': resolve(__dirname, 'app/navi_app/shouxihu/src/domain'),
        '@application': resolve(__dirname, 'app/navi_app/shouxihu/src/application'),
        '@ui': resolve(__dirname, 'app/navi_app/shouxihu/src/ui'),
        '@platform': resolve(__dirname, 'app/navi_app/shouxihu/src/platform'),
        '@legacy': resolve(__dirname, 'app/navi_app/shouxihu/src/legacy'),
      }
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        }
      }
    },
    server: {
      port: 3000,
      host: true,
      open: true
    }
  });
  ```

- [ ] 1.2.2: 创建单一入口 `index.html`
  ```html
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
    <title>大希智能导游</title>
    <link rel="stylesheet" href="/app/navi_app/shouxihu/css/main.css">
    <link rel="stylesheet" href="/app/navi_app/shouxihu/css/blue.css">
  </head>
  <body>
    <div id="first_page"></div>
    <div id="app" class="map_page_container"></div>
    <div id="container" class="ui_page_container"></div>
    <script type="module" src="/app/navi_app/shouxihu/main.js"></script>
  </body>
  </html>
  ```

- [ ] 1.2.3: 创建 `app/navi_app/shouxihu/main.js`
  ```javascript
  /**
   * 应用启动入口
   */

  console.log('[App] Initializing...');

  // TODO: 导入核心模块
  // import { appState } from './src/core/state/state-manager.js';
  // import { router } from './src/core/router/state-router.js';

  console.log('[App] Ready!');
  ```

- [ ] 1.2.4: 测试开发服务器
  ```bash
  pnpm dev
  # 访问 http://localhost:3000
  ```

**交付物**:
- `vite.config.js`
- `index.html`（项目根目录）
- `main.js`
- 更新的 `package.json`

**验收标准**:
- `pnpm dev` 成功启动
- 浏览器能访问
- 模块热重载工作

---

### 任务 1.3: 配置 ESLint 和 Prettier

**目标**: 建立代码规范

**子任务**:
- [ ] 1.3.1: 创建 `eslint.config.js`
  ```javascript
  module.exports = {
    env: {
      browser: true,
      es2021: true,
      node: true
    },
    extends: ['eslint:recommended', 'prettier'],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  };
  ```

- [ ] 1.3.2: 创建 `.prettierrc`
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "all",
    "printWidth": 100
  }
  ```

- [ ] 1.3.3: 创建 `.prettierignore`
  ```
  node_modules
  dist
  *.min.js
  pnpm-lock.yaml
  ```

- [ ] 1.3.4: 配置 VS Code JSDoc 类型检查
  创建 `.vscode/settings.json`:
  ```json
  {
    "javascript.implicitProjectConfig.checkJs": true,
    "javascript.implicitProjectConfig.typeChecking.mode": "strict"
  }
  ```

- [ ] 1.3.5: 测试
  ```bash
  pnpm lint
  pnpm format
  ```

**交付物**:
- `eslint.config.js`
- `.prettierrc`
- `.prettierignore`
- `.vscode/settings.json`

**验收标准**:
- `pnpm lint` 可执行
- JSDoc 类型提示工作

---

### 任务 1.4: 配置 Jest 测试

**目标**: 建立单元测试框架

**子任务**:
- [ ] 1.4.1: 安装 Jest 依赖
  ```bash
  pnpm add -D jest jest-environment-jsdom @testing-library/jest-dom
  ```

- [ ] 1.4.2: 创建 `jest.config.js`
  ```javascript
  module.exports = {
    testEnvironment: 'jsdom',
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/app/navi_app/shouxihu/src/$1',
      '^@core/(.*)$': '<rootDir>/app/navi_app/shouxihu/src/core/$1',
      '^@domain/(.*)$': '<rootDir>/app/navi_app/shouxihu/src/domain/$1',
      '^@application/(.*)$': '<rootDir>/app/navi_app/shouxihu/src/application/$1',
      '^@ui/(.*)$': '<rootDir>/app/navi_app/shouxihu/src/ui/$1',
      '^@platform/(.*)$': '<rootDir>/app/navi_app/shouxihu/src/platform/$1',
      '^@legacy/(.*)$': '<rootDir>/app/navi_app/shouxihu/src/legacy/$1',
    },
    testMatch: ['**/__tests__/**/*.test.js'],
    collectCoverageFrom: [
      'app/navi_app/shouxihu/src/**/*.js',
      '!**/node_modules/**'
    ]
  };
  ```

- [ ] 1.4.3: 创建测试目录
  ```bash
  mkdir -p app/navi_app/shouxihu/src/__tests__
  ```

- [ ] 1.4.4: 创建第一个测试
  ```javascript
  // src/__tests__/state-manager.test.js
  import { describe, it, expect } from '@jest/globals';
  import { StateManager } from '@/core/state/state-manager';

  describe('StateManager', () => {
    it('should create instance', () => {
      const state = new StateManager({ foo: 'bar' });
      expect(state.getState()).toEqual({ foo: 'bar' });
    });

    it('should update state', () => {
      const state = new StateManager({ count: 0 });
      state.setState({ count: 1 });
      expect(state.getState().count).toBe(1);
    });

    it('should notify listeners', () => {
      const state = new StateManager({ value: 0 });
      let called = false;
      state.subscribe(() => { called = true; });
      state.setState({ value: 1 });
      expect(called).toBe(true);
    });
  });
  ```

- [ ] 1.4.5: 测试
  ```bash
  pnpm test
  ```

**交付物**:
- `jest.config.js`
- 测试目录结构
- 示例测试

**验收标准**:
- `pnpm test` 可执行
- 测试通过

---

## 阶段 2: 完善核心架构 (预计 5-7 天)

### 任务 2.1: 实现 StateManager

**目标**: 无依赖的状态管理器

**子任务**:
- [ ] 2.1.1: 创建 StateManager
  ```javascript
  // src/core/state/state-manager.js
  /**
   * 轻量级状态管理器
   * 无依赖，基于观察者模式
   * @class
   */
  export class StateManager {
    /**
     * 创建状态管理器实例
     * @param {Object} initialState - 初始状态
     */
    constructor(initialState = {}) {
      /** @private */
      this.state = initialState;

      /** @private */
      this.listeners = new Map();

      /** @private */
      this.middleware = [];
    }

    /**
     * 获取当前状态
     * @returns {Object}
     */
    getState() {
      return this.state;
    }

    /**
     * 更新状态
     * @param {Object|Function} updater - 状态更新函数或新状态
     */
    setState(updater) {
      const prevState = { ...this.state };
      this.state = typeof updater === 'function'
        ? updater(this.state)
        : { ...this.state, ...updater };

      this.notify(this.state, prevState);
    }

    /**
     * 订阅状态变化
     * @param {Function} listener - 监听器函数
     * @returns {Function} 取消订阅函数
     */
    subscribe(listener) {
      const id = Symbol('listener');
      this.listeners.set(id, listener);
      return () => this.listeners.delete(id);
    }

    /**
     * 通知所有订阅者
     * @private
     */
    notify(nextState, prevState) {
      let middlewareIndex = 0;

      const dispatch = (state) => {
        if (middlewareIndex < this.middleware.length) {
          const middleware = this.middleware[middlewareIndex++];
          return middleware(state, prevState, dispatch);
        }

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

    /**
     * 添加中间件
     * @param {Function} middleware - 中间件函数
     */
    use(middleware) {
      this.middleware.push(middleware);
    }
  }
  ```

- [ ] 2.1.2: 创建全局应用状态
  ```javascript
  // src/core/state/app-state.js
  import { StateManager } from './state-manager.js';

  /**
   * 全局应用状态
   * @type {StateManager}
   */
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

- [ ] 2.1.3: 编写单元测试
  - 测试状态更新
  - 测试订阅通知
  - 测试中间件

**交付物**:
- `state-manager.js`
- `app-state.js`
- 单元测试

**验收标准**:
- 测试覆盖率 > 80%
- 无 window 依赖

---

### 任务 2.2: 实现 StateRouter

**目标**: 基于状态的路由管理器

**子任务**:
- [ ] 2.2.1: 创建 StateRouter
  ```javascript
  // src/core/router/state-router.js
  import { appState } from '../state/app-state.js';
  import { pageControllerRegistry } from '@ui/controllers/page-controller-registry';

  /**
   * 基于状态的路由管理器
   * @class
   */
  export class StateRouter {
    constructor() {
      /** @private */
      this.currentController = null;

      /** @private */
      this.container = null;
    }

    /**
     * 初始化路由
     * @param {string} containerId - 容器元素 ID
     */
    init(containerId = 'container') {
      this.container = document.getElementById(containerId);

      if (!this.container) {
        throw new Error(`[Router] Container not found: ${containerId}`);
      }

      // 监听页面状态变化
      appState.subscribe((nextState, prevState) => {
        if (nextState.currentPage !== prevState.currentPage) {
          this.navigate(nextState.currentPage);
        }
      });

      console.log('[Router] Initialized');
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

      // 2. 清空容器
      this.container.innerHTML = '';

      // 3. 获取新页面控制器
      const ControllerClass = pageControllerRegistry[pageName];
      if (!ControllerClass) {
        console.error(`[Router] Page not found: ${pageName}`);
        return;
      }

      // 4. 创建并初始化新页面
      this.currentController = new ControllerClass({
        container: this.container,
        router: this,
        params
      });

      // 5. 调用页面生命周期
      this.currentController.onCreate(params);
      this.currentController.onShow();

      // 6. 更新历史记录
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
        history.pop();
        const prevPage = history.pop();
        appState.setState({ currentPage: prevPage });
      }
    }
  }

  // 全局路由实例
  export const router = new StateRouter();
  ```

- [ ] 2.2.2: 更新页面控制器注册表
  ```javascript
  // src/ui/controllers/page-controller-registry.js
  import { HomePageController } from './home-page-controller.js';
  import { ServicePageController } from './service-page-controller.js';
  import { ProfilePageController } from './profile-page-controller.js';
  import { MapStateBrowseController } from './map-state-browse-page-controller.js';
  // ... 其他控制器

  /**
   * 页面控制器注册表
   * 将页面名称映射到控制器类
   */
  export const pageControllerRegistry = {
    'HomePage': HomePageController,
    'ServicePage': ServicePageController,
    'ProfilePage': ProfilePageController,
    'MapStateBrowse': MapStateBrowseController,
    // ... 其他页面
  };
  ```

- [ ] 2.2.3: 编写测试
  - 测试路由切换
  - 测试页面生命周期

**交付物**:
- `state-router.js`
- 更新的注册表
- 单元测试

---

### 任务 2.3: 实现 BasePageController

**目标**: 统一页面控制器基类

**子任务**:
- [ ] 2.3.1: 创建基类
  ```javascript
  // src/ui/controllers/base-page-controller.js
  /**
   * 页面控制器基类
   * @class
   */
  export class BasePageController {
    /**
     * 创建页面控制器实例
     * @param {Object} options - 配置选项
     * @param {HTMLElement} options.container - 容器元素
     * @param {StateRouter} options.router - 路由实例
     * @param {Object} options.params - 页面参数
     */
    constructor(options = {}) {
      this.name = this.constructor.name || 'BasePage';
      this.container = options.container;
      this.router = options.router;
      this.params = options.params || {};
      this.isShown = false;
    }

    /**
     * 页面创建时调用（子类实现）
     * @param {Object} params - 页面参数
     */
    onCreate(params) {
      console.log(`[${this.name}] onCreate`, params);
    }

    /**
     * 页面显示时调用（子类实现）
     */
    onShow() {
      this.isShown = true;
      console.log(`[${this.name}] onShow`);
    }

    /**
     * 页面隐藏时调用
     */
    onHide() {
      this.isShown = false;
      console.log(`[${this.name}] onHide`);
    }

    /**
     * 页面销毁时调用（子类实现）
     */
    onDestroy() {
      console.log(`[${this.name}] onDestroy`);
      this.container.innerHTML = '';
    }

    /**
     * 处理命令（子类可扩展）
     * @param {string} command - 命令名称
     * @param {Object} context - 命令上下文
     */
    handleCommand(command, context) {
      const methodName = `handle${command.charAt(0).toUpperCase() + command.slice(1)}`;
      if (typeof this[methodName] === 'function') {
        return this[methodName](context);
      }
      console.warn(`[${this.name}] Command not handled: ${command}`);
    }
  }
  ```

- [ ] 2.3.2: 创建示例控制器
  ```javascript
  // src/ui/controllers/home-page-controller.js
  import { BasePageController } from './base-page-controller.js';
  import { appState } from '@/core/state/app-state.js';

  /**
   * 首页控制器
   * @class
   * @extends BasePageController
   */
  export class HomePageController extends BasePageController {
    /**
     * @override
     */
    onCreate(params) {
      super.onCreate(params);
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

        const pageMap = {
          browse: 'MapStateBrowse',
          service: 'ServicePage',
          profile: 'ProfilePage'
        };

        const pageName = pageMap[action];
        if (pageName) {
          appState.setState({ currentPage: pageName });
        }
      });
    }
  }
  ```

**交付物**:
- `base-page-controller.js`
- 示例控制器

---

### 任务 2.4: 完善 ConfigService

**目标**: 统一配置管理

**子任务**:
- [ ] 2.4.1: 增强 ConfigService
  ```javascript
  // src/core/config/config-service.js
  /**
   * 配置服务
   * @class
   */
  export class ConfigService {
    /**
     * 创建配置服务实例
     * @param {Object} options - 配置选项
     * @param {Window} options.globalRef - 全局对象引用
     */
    constructor(options = {}) {
      /** @private */
      this.globalRef = options.globalRef || globalThis;

      /** @private */
      this.env = this.detectEnv();

      /** @private */
      this.params = this.parseParams();
    }

    /**
     * 从 window 创建实例
     * @param {Window} globalRef
     * @returns {ConfigService}
     */
    static fromWindow(globalRef) {
      return new ConfigService({ globalRef });
    }

    /**
     * 检测当前环境
     * @returns {string}
     */
    detectEnv() {
      const ua = this.globalRef.navigator?.userAgent || '';

      if (/Android/i.test(ua)) return 'android';
      if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
      if (/MicroMessenger/i.test(ua)) return 'wechat';

      return 'web';
    }

    /**
     * 解析 URL 参数
     * @returns {Object}
     */
    parseParams() {
      try {
        const url = new URL(this.globalRef.location.href);
        return Object.fromEntries(url.searchParams);
      } catch (error) {
        console.error('[ConfigService] Failed to parse URL:', error);
        return {};
      }
    }

    /**
     * 获取配置值
     * @param {string} key - 配置键
     * @param {*} defaultValue - 默认值
     * @returns {*}
     */
    get(key, defaultValue) {
      return this.params[key] ?? defaultValue;
    }

    /**
     * 获取当前环境
     * @returns {string}
     */
    getCurrentEnv() {
      return this.env;
    }

    /**
     * 是否为原生平台
     * @returns {boolean}
     */
    isNativePlatform() {
      return ['ios', 'android'].includes(this.env);
    }
  }
  ```

**交付物**:
- 增强的 `config-service.js`
- 单元测试

---

## 阶段 3: UI 层迁移 (预计 10-15 天)

### 任务 3.1: 迁移现有页面控制器

**目标**: 将 20+ 个页面控制器迁移到新架构

**子任务**:
- [ ] 3.1.1: 迁移核心页面（高优先级）
  - [ ] HomePage
  - [ ] MapStateBrowse
  - [ ] MapStateRoute
  - [ ] MapStateNavi
  - [ ] ServicePage
  - [ ] ProfilePage

- [ ] 3.1.2: 迁移次要页面（中优先级）
  - [ ] POI 相关页面
  - [ ] 路线相关页面
  - [ ] 分享相关页面

- [ ] 3.1.3: 迁移辅助页面（低优先级）
  - [ ] VoiceListenerPage
  - [ ] CommandPage

**验收标准**:
- 所有控制器继承 BasePageController
- 通过状态切换页面
- 生命周期正确调用

---

## 阶段 4: 消除 Window 引用 (预计 10-15 天)

### 任务 4.1: 创建 WindowAdapter

**目标**: 抽象 window 访问

**子任务**:
- [ ] 4.1.1: 创建适配器
  ```javascript
  // src/legacy/window-adapter.js
  /**
   * Window 访问适配器
   * @class
   */
  export class WindowAdapter {
    constructor(options = {}) {
      this.globalRef = options.globalRef || globalThis;
    }

    // 配置相关
    get rootPath() {
      return this.globalRef.rootPath || '../../../data/';
    }

    get langData() {
      return this.globalRef.langData || {};
    }

    get currentEnv() {
      return this.globalRef.currentEnv || {};
    }

    // 应用相关
    get DaxiApp() {
      return this.globalRef.DaxiApp || {};
    }

    set DaxiApp(value) {
      this.globalRef.DaxiApp = value;
    }

    // 工具函数
    getParam(key) {
      return this.globalRef.getParam?.(key);
    }

    // 方法委托
    invoke(method, ...args) {
      return this.globalRef[method]?.(...args);
    }
  }
  ```

**交付物**:
- `window-adapter.js`

---

### 任务 4.2: 逐步替换 Window 访问

**优先级**:

**高优先级**（Week 7-8）:
- [ ] `window.rootPath` → ConfigService
- [ ] `window.currentEnv` → ConfigService
- [ ] `window.getParam` → ConfigService

**中优先级**（Week 8-9）:
- [ ] `window.langData` → StateManager
- [ ] `window.DaxiApp` → 依赖注入
- [ ] `window.command` → CommandBus

**低优先级**（Week 9）:
- [ ] 第三方库全局变量
- [ ] 平台特定 API

**验收标准**:
- Window 引用减少 > 80%
- 基线检查通过

---

## 阶段 5: 测试和文档 (预计 5-7 天)

### 任务 5.1: 编写测试

**子任务**:
- [ ] StateManager 测试
- [ ] StateRouter 测试
- [ ] ConfigService 测试
- [ ] 页面控制器测试
- [ ] 集成测试

### 任务 5.2: 编写文档

**子任务**:
- [ ] 更新 README.md
- [ ] 创建 ARCHITECTURE.md
- [ ] 编写 API 文档（JSDoc）

---

## 总体验收标准

### 技术指标
- [ ] ES6 模块覆盖率 > 90%
- [ ] Window 引用减少 > 80%
- [ ] 单元测试覆盖率 > 70%
- [ ] 最大文件 < 1000 行
- [ ] 无循环依赖

### 架构指标
- [ ] 单一 index.html 入口
- [ ] 单一 main.js 启动
- [ ] StateManager 无依赖
- [ ] StateRouter 状态驱动
- [ ] 所有控制器继承基类

### 质量指标
- [ ] ESLint 规则通过
- [ ] JSDoc 类型提示工作
- [ ] 所有测试通过
- [ ] 功能与重构前一致

---

**文档版本**: 2.0
**最后更新**: 2026-02-26
**状态**: 待执行
