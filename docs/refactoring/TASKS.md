# 重构任务清单

基于 [REFACTORING_ANALYSIS.md](./REFACTORING_ANALYSIS.md) 生成的详细任务清单。

---

## 阶段 1: 基础设施搭建 (预计 2-3 天)

### 任务 1.1: 初始化 pnpm 项目

**目标**: 建立 pnpm 包管理体系

**子任务**:

- [ ] 1.1.1: 创建 `package.json`
  - 项目名称：`daxi-aiguide-h5`
  - 版本：`1.0.0`
  - 描述：大希智能导游 H5 应用
  - 添加基本的 scripts（dev, build, test, lint）

- [ ] 1.1.2: 安装核心依赖

  ```bash
  # 构建工具
  pnpm install --save-dev vite@5 @vitejs/plugin-legacy

  # 代码规范
  pnpm install --save-dev eslint@8 prettier@3 eslint-config-prettier

  # 测试框架
  pnpm install --save-dev jest@29 @testing-library/jest-dom jsdom

  # 第三方库（从 libs/迁移）
  pnpm install zepto crypto-js md5 three mapbox-gl swiper
  ```

- [ ] 1.1.3: 创建 `.gitignore` 更新
  - 添加 `node_modules/`
  - 添加 `dist/`
  - 添加 `.env`

- [ ] 1.1.4: 验证安装
  ```bash
  pnpm install
  pnpm run dev
  ```

**交付物**:

- `package.json`
- `package-lock.json`
- 更新后的 `.gitignore`

**验收标准**:

- `pnpm install` 成功
- `node_modules` 生成
- 无严重依赖冲突

---

### 任务 1.2: 配置 Vite

**目标**: 建立现代构建系统

**子任务**:

- [ ] 1.2.1: 创建 `vite.config.js`

  ```javascript
  import { defineConfig } from "vite";
  import { resolve } from "path";

  export default defineConfig({
    resolve: {
      alias: {
        "@": resolve(__dirname, "app/navi_app/shouxihu/src"),
        "@core": resolve(__dirname, "app/navi_app/shouxihu/src/core"),
        "@domain": resolve(__dirname, "app/navi_app/shouxihu/src/domain"),
        "@application": resolve(
          __dirname,
          "app/navi_app/shouxihu/src/application",
        ),
        "@ui": resolve(__dirname, "app/navi_app/shouxihu/src/ui"),
        "@platform": resolve(__dirname, "app/navi_app/shouxihu/src/platform"),
        "@legacy": resolve(__dirname, "app/navi_app/shouxihu/src/legacy"),
        "@map_sdk": resolve(__dirname, "map_sdk"),
        "@jsbridge": resolve(__dirname, "jsbridge"),
      },
    },
    build: {
      outDir: "dist",
      rollupOptions: {
        input: {
          main: resolve(__dirname, "app/navi_app/shouxihu/src/main.js"),
        },
      },
    },
    server: {
      port: 3000,
      host: true,
    },
  });
  ```

- [ ] 1.2.2: 创建 `index.html`

  ```html
  <!DOCTYPE html>
  <html lang="zh-CN">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
      <title>大希地图</title>
    </head>
    <body>
      <div id="first_page"></div>
      <div id="app" class="map_page_container"></div>
      <div id="container" class="ui_page_container"></div>
      <script type="module" src="/app/navi_app/shouxihu/src/main.js"></script>
    </body>
  </html>
  ```

- [ ] 1.2.3: 更新 `package.json` scripts

  ```json
  {
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview",
      "lint": "eslint . --ext .js",
      "lint:fix": "eslint . --ext .js --fix",
      "test": "jest"
    }
  }
  ```

- [ ] 1.2.4: 测试开发服务器
  ```bash
  pnpm run dev
  # 访问 http://localhost:3000
  ```

**交付物**:

- `vite.config.js`
- `index.html`
- 更新的 `package.json`

**验收标准**:

- `pnpm run dev` 成功启动
- 浏览器能访问开发服务器
- 模块热重载工作正常

---

### 任务 1.3: 配置 ESLint 和 Prettier

**目标**: 建立代码规范

**子任务**:

- [ ] 1.3.1: 创建 `.eslintrc.js`

  ```javascript
  module.exports = {
    env: {
      browser: true,
      es2021: true,
      node: true,
    },
    extends: ["eslint:recommended", "prettier"],
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
    },
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
  libs/
  ```

- [ ] 1.3.4: 测试代码规范检查
  ```bash
  pnpm run lint
  pnpm run lint:fix
  ```

**交付物**:

- `.eslintrc.js`
- `.prettierrc`
- `.prettierignore`

**验收标准**:

- `pnpm run lint` 可执行
- 自动修复工作正常
- 新代码符合规范

---

### 任务 1.4: 配置 Jest 测试

**目标**: 建立单元测试框架

**子任务**:

- [ ] 1.4.1: 创建 `jest.config.js`

  ```javascript
  module.exports = {
    testEnvironment: "jsdom",
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/app/navi_app/shouxihu/src/$1",
      "^@core/(.*)$": "<rootDir>/app/navi_app/shouxihu/src/core/$1",
      "^@domain/(.*)$": "<rootDir>/app/navi_app/shouxihu/src/domain/$1",
      "^@application/(.*)$":
        "<rootDir>/app/navi_app/shouxihu/src/application/$1",
      "^@ui/(.*)$": "<rootDir>/app/navi_app/shouxihu/src/ui/$1",
      "^@platform/(.*)$": "<rootDir>/app/navi_app/shouxihu/src/platform/$1",
      "^@legacy/(.*)$": "<rootDir>/app/navi_app/shouxihu/src/legacy/$1",
    },
    testMatch: ["**/__tests__/**/*.test.js"],
    collectCoverageFrom: [
      "app/navi_app/shouxihu/src/**/*.js",
      "!**/node_modules/**",
    ],
  };
  ```

- [ ] 1.4.2: 创建测试目录结构

  ```bash
  mkdir -p app/navi_app/shouxihu/src/__tests__
  mkdir -p __tests__
  ```

- [ ] 1.4.3: 创建第一个测试文件

  ```javascript
  // __tests__/config-service.test.js
  import { describe, it, expect } from "@jest/globals";
  import { ConfigService } from "@/core/config/config-service";

  describe("ConfigService", () => {
    it("should create instance", () => {
      const config = new ConfigService();
      expect(config).toBeDefined();
    });
  });
  ```

- [ ] 1.4.4: 测试 Jest
  ```bash
  pnpm test
  ```

**交付物**:

- `jest.config.js`
- 测试目录结构
- 示例测试文件

**验收标准**:

- `pnpm test` 可执行
- 测试能通过
- 覆盖率报告生成

---

## 阶段 2: 完善核心架构 (预计 5-7 天)

### 任务 2.1: 完善 ConfigService

**目标**: 提供统一的配置管理服务

**子任务**:

- [ ] 2.1.1: 增强 ConfigService

  ```javascript
  // core/config/config-service.js
  export class ConfigService {
    constructor(options = {}) {
      this.globalRef = options.globalRef || globalThis;
      this.env = this.detectEnv();
      this.params = this.parseParams();
    }

    static fromWindow(globalRef) {
      return new ConfigService({ globalRef });
    }

    detectEnv() {
      const ua = this.globalRef.navigator?.userAgent || "";
      if (/Android/i.test(ua)) return "android";
      if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
      return "web";
    }

    parseParams() {
      const url = new URL(this.globalRef.location.href);
      return Object.fromEntries(url.searchParams);
    }

    get(key, defaultValue) {
      return this.params[key] ?? defaultValue;
    }

    getCurrentEnv() {
      return this.env;
    }

    isNativePlatform() {
      return ["ios", "android"].includes(this.env);
    }
  }
  ```

- [ ] 2.1.2: 为 ConfigService 编写单元测试
  - 测试参数解析
  - 测试环境检测
  - 测试 get 方法

- [ ] 2.1.3: 迁移 `getParam.js` 逻辑
  - 将 `window.getParam` 替换为 `ConfigService.get`

**交付物**:

- 增强的 `ConfigService`
- 单元测试
- 迁移文档

**验收标准**:

- 测试覆盖率 > 80%
- 功能与原 `getParam` 一致
- 无 window 直接访问

---

### 任务 2.2: 实现 Domain 层 - POI 领域

**目标**: 建立 POI 领域模型

**子任务**:

- [ ] 2.2.1: 创建 POI Entity

  ```javascript
  // domain/poi/poi-entity.js
  export class POI {
    constructor(data) {
      this.id = data.id || "";
      this.poiId = data.poiId || "";
      this.name = data.name || "";
      this.address = data.address || "";
      this.lon = parseFloat(data.lon) || 0;
      this.lat = parseFloat(data.lat) || 0;
      this.bdid = data.bdid || "";
      this.code = data.code || "";
      this.barcode = data.barcode || "";
      this.category = data.category;
      this.floorId = data.floorId || "";
    }

    get fullName() {
      return `${this.name} (${this.address})`;
    }

    get coordinates() {
      return [this.lon, this.lat];
    }
  }
  ```

- [ ] 2.2.2: 创建 POI Repository

  ```javascript
  // domain/poi/poi-repository.js
  import { POI } from "./poi-entity";

  export class POIRepository {
    constructor(apiService) {
      this.api = apiService;
    }

    async getById(id) {
      const data = await this.api.getPOI(id);
      return new POI(data);
    }

    async search(query) {
      const results = await this.api.searchPOI(query);
      return results.map((data) => new POI(data));
    }
  }
  ```

- [ ] 2.2.3: 编写单元测试
  - 测试 POI 构造函数
  - 测试 Repository 方法

**交付物**:

- `poi-entity.js`
- `poi-repository.js`
- 单元测试

**验收标准**:

- Entity 正确封装数据
- Repository 正确调用 API
- 测试覆盖关键逻辑

---

### 任务 2.3: 实现 Domain 层 - Route 领域

**目标**: 建立导航路线领域模型

**子任务**:

- [ ] 2.3.1: 创建 Route Entity

  ```javascript
  // domain/route/route-entity.js
  export class Route {
    constructor(startPoint, endPoint, waypoints = []) {
      this.startPoint = startPoint;
      this.endPoint = endPoint;
      this.waypoints = waypoints;
    }

    get distance() {
      // 计算总距离
      return this.calculateDistance();
    }

    get duration() {
      // 计算预计时长
      return this.calculateDuration();
    }

    calculateDistance() {
      // 使用 Haversine 公式计算距离
      // TODO: 实现具体逻辑
      return 0;
    }

    calculateDuration() {
      // 基于距离和速度计算时长
      // TODO: 实现具体逻辑
      return 0;
    }
  }
  ```

- [ ] 2.3.2: 创建 RouteRepository

  ```javascript
  // domain/route/route-repository.js
  export class RouteRepository {
    constructor(apiService) {
      this.api = apiService;
    }

    async calculateRoute(start, end, options = {}) {
      const data = await this.api.calculateRoute(start, end, options);
      return new Route(data.startPoint, data.endPoint, data.waypoints);
    }
  }
  ```

**交付物**:

- `route-entity.js`
- `route-repository.js`
- 单元测试

---

### 任务 2.4: 完善 Application 层 - 状态管理

**目标**: 引入集中式状态管理

**子任务**:

- [ ] 2.4.1: 安装 Zustand

  ```bash
  pnpm install zustand
  ```

- [ ] 2.4.2: 创建应用状态 Store

  ```javascript
  // application/state/app-state.js
  import { create } from "zustand";

  export const useAppState = create((set, get) => ({
    // 用户状态
    currentUser: null,
    setCurrentUser: (user) => set({ currentUser: user }),

    // 地图状态
    currentBuilding: null,
    setCurrentBuilding: (bdid) => set({ currentBuilding: bdid }),
    availableBuildings: [],
    setAvailableBuildings: (buildings) =>
      set({ availableBuildings: buildings }),

    // 导航状态
    isNavigating: false,
    currentRoute: null,
    startNavigation: (route) =>
      set({ isNavigating: true, currentRoute: route }),
    stopNavigation: () => set({ isNavigating: false, currentRoute: null }),

    // UI 状态
    currentPage: "HomePage",
    setCurrentPage: (page) => set({ currentPage: page }),
    uiState: {},
    updateUIState: (state) =>
      set((prev) => ({ uiState: { ...prev.uiState, ...state } })),
  }));
  ```

- [ ] 2.4.3: 创建状态选择器

  ```javascript
  // application/state/selectors.js
  export const selectCurrentUser = (state) => state.currentUser;
  export const selectCurrentBuilding = (state) => state.currentBuilding;
  export const selectIsNavigating = (state) => state.isNavigating;
  ```

- [ ] 2.4.4: 编写测试
  - 测试状态更新
  - 测试选择器

**交付物**:

- `app-state.js`
- `selectors.js`
- 单元测试

**验收标准**:

- 状态可正确更新
- 组件可订阅状态变化
- 测试通过

---

## 阶段 3: UI 层重构 (预计 10-15 天)

### 任务 3.1: 创建页面控制器基类

**目标**: 统一页面控制器接口

**子任务**:

- [ ] 3.1.1: 创建 BasePageController

  ```javascript
  // ui/controllers/base-page-controller.js
  export class BasePageController {
    constructor(options = {}) {
      this.name = options.name || "BasePage";
      this.app = options.app;
      this.container = options.container;
      this.logger = options.logger || console;
      this.isShown = false;
    }

    onCreate(params) {
      this.logger.info(`[${this.name}] onCreate`, params);
    }

    onShow() {
      this.isShown = true;
      this.logger.info(`[${this.name}] onShow`);
    }

    onHide() {
      this.isShown = false;
      this.logger.info(`[${this.name}] onHide`);
    }

    onDestroy() {
      this.logger.info(`[${this.name}] onDestroy`);
    }

    handleCommand(command, context) {
      const methodName = `handle${command}`;
      if (typeof this[methodName] === "function") {
        return this[methodName](context);
      }
      this.logger.warn(`[${this.name}] Command not handled: ${command}`);
    }
  }
  ```

- [ ] 3.1.2: 更新现有控制器继承基类
  - 检查所有 `ui/controllers/*.js`
  - 确保都继承 BasePageController

**交付物**:

- `base-page-controller.js`
- 更新的控制器文件

---

## 阶段 4: 消除 Window 引用 (预计 10-15 天)

### 任务 4.1: 创建 Window Adapter

**目标**: 抽象 window 访问

**子任务**:

- [ ] 4.1.1: 创建 WindowAdapter 类

  ```javascript
  // legacy/window-adapter.js
  export class WindowAdapter {
    constructor(options = {}) {
      this.globalRef = options.globalRef || globalThis;
    }

    // 配置相关
    get rootPath() {
      return this.globalRef.rootPath || "../../../data/";
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

    get DaxiMap() {
      return this.globalRef.DaxiMap || {};
    }

    set DaxiMap(value) {
      this.globalRef.DaxiMap = value;
    }

    // 工具函数
    getParam(key) {
      return this.globalRef.getParam?.(key);
    }

    // 方法委托
    invoke(method, ...args) {
      return this.globalRef[method]?.(...args);
    }

    // 事件
    dispatchEvent(event) {
      return this.globalRef.dispatchEvent?.(event);
    }

    addEventListener(event, handler) {
      return this.globalRef.addEventListener?.(event, handler);
    }
  }
  ```

**交付物**:

- `window-adapter.js`

---

### 任务 4.2: 替换配置相关 Window 引用

**目标**: 消除配置的 window 访问

**子任务**:

- [ ] 4.2.1: 替换 `window.rootPath`

  ```javascript
  // 之前
  const path = window.rootPath;

  // 之后
  import { ConfigService } from "@/core/config";
  const config = ConfigService.getInstance();
  const path = config.get("rootPath", "../../../data/");
  ```

- [ ] 4.2.2: 替换 `window.currentEnv`

  ```javascript
  // 之前
  const env = window.currentEnv;

  // 之后
  const config = ConfigService.getInstance();
  const env = config.getCurrentEnv();
  ```

- [ ] 4.2.3: 替换 `window.langData`

  ```javascript
  // 之前
  const text = window.langData[key] || defaultVal;

  // 之后
  import { useAppState } from "@/application/state";
  const langData = useAppState.getState().langData;
  const text = langData[key] || defaultVal;
  ```

**交付物**:

- 替换清单
- 更新的代码文件

**验收标准**:

- `window.rootPath` 引用减少 100%
- `window.currentEnv` 引用减少 100%
- 功能正常

---

## 阶段 5: 测试和文档 (预计 5-7 天)

### 任务 5.1: 编写核心模块测试

**子任务**:

- [ ] 5.1.1: ConfigService 测试
- [ ] 5.1.2: BridgeService 测试
- [ ] 5.1.3: CommandBus 测试
- [ ] 5.1.4: POI Entity 测试
- [ ] 5.1.5: Route Entity 测试

### 任务 5.2: 编写集成测试

**子任务**:

- [ ] 5.2.1: 应用初始化测试
- [ ] 5.2.2: 页面切换测试
- [ ] 5.2.3: 导航流程测试

### 任务 5.3: 编写文档

**子任务**:

- [ ] 5.3.1: 更新 README.md
- [ ] 5.3.2: 创建 ARCHITECTURE.md
- [ ] 5.3.3: 创建 CONTRIBUTING.md
- [ ] 5.3.4: 编写 API 文档

---

## 总体检查清单

### 重构完成标准

- [ ] 所有新代码使用 ES6 modules
- [ ] Window 引用减少 > 80%
- [ ] 单元测试覆盖率 > 70%
- [ ] 构建时间 < 30 秒
- [ ] 无 ESLint 错误
- [ ] 所有测试通过
- [ ] 功能与重构前一致
- [ ] 性能无明显下降

### 质量指标

- [ ] 最大文件 < 1000 行
- [ ] 无循环依赖
- [ ] 所有函数有 JSDoc 注释
- [ ] 代码符合 Prettier 格式
- [ ] Git 提交历史清晰

---

**文档版本**: 1.0  
**最后更新**: 2026-02-26  
**状态**: 待执行
