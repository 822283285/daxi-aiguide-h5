# 代码库重构分析文档

**生成时间**: 2026-02-26  
**项目名称**: daxi-aiguide-h5 (大希智能导游 H5 应用)  
**重构目标**: 模块化 + ES6 重构，剔除 window 引用，使用 export/import 进行模块引用

---

## 目录

1. [项目概况](#1-项目概况)
2. [技术缺陷分析](#2-技术缺陷分析)
3. [架构缺陷分析](#3-架构缺陷分析)
4. [结构缺陷分析](#4-结构缺陷分析)
5. [现有重构进展](#5-现有重构进展)
6. [重构策略](#6-重构策略)
7. [重构任务分解](#7-重构任务分解)
8. [实施路线图](#8-实施路线图)

---

## 1. 项目概况

### 1.1 基本统计

| 指标                 | 数值                  |
| -------------------- | --------------------- |
| JS 文件总数          | 194 个                |
| 总代码行数           | 161,972 行            |
| window 引用次数      | 833 次读取，67 次写入 |
| 使用 window 的文件数 | 66 个                 |
| 现有 ES6 模块数      | 47 个 (src/目录)      |

### 1.2 项目结构

```
daxi-aiguide-h5/
├── app/
│   ├── components/              # UI 组件系统
│   └── navi_app/                # 主导航应用
│       ├── components/          # 组件 (daxiapp.component.js - 12,056 行)
│       ├── libs/                # 第三方库 (30+ 文件)
│       ├── utils/               # 工具函数
│       └── shouxihu/            # 瘦西湖实现
│           ├── js/              # 旧代码 (20+ 页面状态)
│           ├── extend_guobo/    # 扩展功能
│           ├── src/             # 新模块化代码 (正在进行)
│           └── index_src.html   # 入口 HTML
├── map_sdk/                     # 地图 SDK
│   ├── map/                     # 地图核心 (daximap.scene.js - 10,912 行)
│   └── location/                # 定位 SDK (wx.loc.js - 26,252 行)
├── jsbridge/                    # JS 桥接
│   ├── android.back/            # Android 桥接
│   └── ios.back/                # iOS 桥接
├── scripts/                     # 构建和检查脚本
└── docs/                        # 文档
```

### 1.3 技术栈

**核心框架/库**:

- Zepto (jQuery 轻量版)
- Three.js (3D 渲染)
- Mapbox GL (地图渲染)
- Swiper (轮播组件)
- Crypto-JS (加密)

**构建系统**:

- ❌ **无** - 使用传统 script 标签顺序加载
- 使用 bootstrap-loader.js 管理依赖顺序

**模块系统**:

- ❌ 无统一模块系统
- 混用：全局变量、IIFE、AMD (第三方库)
- ✅ 新代码使用 ES6 modules (src/)

---

## 2. 技术缺陷分析

### 2.1 无构建系统

**问题描述**:
项目没有使用任何现代构建工具（webpack、vite、rollup 等），导致：

- 无法使用 pnpm/yarn 管理依赖
- 无法进行代码分割和懒加载
- 无法进行 Tree Shaking 优化
- 无法使用现代 CSS 预处理器
- 开发效率低（无热重载）

**影响**:

- 所有依赖通过 `<script>` 标签加载
- 加载顺序硬编码在 bootstrap-loader.js 中
- 无法利用现代前端工程化优势

**建议**:
引入 Vite 或 Webpack 作为构建工具

### 2.2 模块系统混乱

**问题描述**:
项目混用了多种模块模式：

| 模式        | 文件数 | 示例                                 |
| ----------- | ------ | ------------------------------------ |
| 全局变量    | 66 个  | `window.DaxiApp = {}`                |
| IIFE        | 2 个   | `(function(global) { ... })(window)` |
| AMD         | 少量   | `define([], function() { ... })`     |
| ES6 Modules | 47 个  | `export function xxx() {}`           |

**影响**:

- 模块依赖关系不清晰
- 无法静态分析依赖
- 难以进行自动化测试
- 代码重构困难

**建议**:
统一迁移到 ES6 Modules

### 2.3 Window 引用过度使用

**问题统计**:

- **833 次** window 读取
- **67 次** window 写入
- **66 个文件** 使用 window

**主要 window 全局变量**:

| 全局变量                         | 用途           | 写入次数 | 读取次数 |
| -------------------------------- | -------------- | -------- | -------- |
| `window.DaxiApp`                 | 应用命名空间   | 1        | 50+      |
| `window.DaxiMap`                 | 地图命名空间   | 1        | 30+      |
| `window.langData`                | 多语言数据     | 1        | 100+     |
| `window.rootPath`                | 根路径配置     | 1        | 20+      |
| `window.command`                 | 命令对象       | 1        | 50+      |
| `window.currentEnv`              | 环境配置       | 3        | 10+      |
| `window.locWebSocketPostMessage` | WebSocket 通信 | -        | 5+       |
| `window.DXDomUtil`               | DOM 工具       | 2        | 100+     |
| `window.getParam`                | URL 参数解析   | 1        | 50+      |

**影响**:

- 全局命名空间污染
- 变量来源不清晰
- 难以追踪数据流
- 单元测试困难（需要 mock window）
- 无法进行 Tree Shaking

**建议**:
通过依赖注入和服务模式替代 window 访问

### 2.4 超大文件问题

**TOP 10 最大文件**:

| 排名 | 文件                                               | 行数   | 问题               |
| ---- | -------------------------------------------------- | ------ | ------------------ |
| 1    | `map_sdk/location/wx.loc.js`                       | 26,252 | 单体架构，职责过多 |
| 2    | `app/navi_app/components/daxiapp.component.js`     | 12,056 | 组件系统过于复杂   |
| 3    | `map_sdk/map/daximap.scene.js`                     | 10,912 | 场景管理臃肿       |
| 4    | `app/navi_app/components/daxiapp.basecomponent.js` | 6,191  | 基类职责不单一     |
| 5    | `app/navi_app/libs/crypto-js.js`                   | 6,191  | 第三方库           |
| 6    | `map_sdk/map/daximap.utils.js`                     | 5,336  | 工具类过于庞大     |
| 7    | `map_sdk/map/daximap.navi.js`                      | 5,177  | 导航逻辑复杂       |
| 8    | `map_sdk/map/daximap.navi.ok.js`                   | 4,957  | 导航逻辑重复       |
| 9    | `app/navi_app/utils/daxiapp.utils.js`              | 4,871  | 工具函数过多       |
| 10   | `app/navi_app/libs/FBXLoader.js`                   | 4,114  | 第三方库           |

**影响**:

- 难以理解和维护
- 加载性能差
- 测试覆盖率低
- 容易出现回归 bug

**建议**:
对超过 1000 行的自研代码进行拆分重构

### 2.5 重复文件问题

**发现 15 组重复文件**:

| 重复文件          | 数量  | 位置                              |
| ----------------- | ----- | --------------------------------- |
| `index.js`        | 16 个 | src/各层（正常）                  |
| `ARNavigation.js` | 2 个  | utils/ 和 utils/AR/               |
| `cordova.js`      | 2 个  | jsbridge/android.back 和 ios.back |
| `three.min.js`    | 2 个  | libs/ 和 utils/AR/                |
| `FBXLoader.js`    | 2 个  | libs/ 和 utils/AR/                |
| `zepto.min.js`    | 2 个  | libs/ 和 voucher/libs/            |
| `dxDomUtill.js`   | 2 个  | libs/ 和 utils/                   |

**影响**:

- 代码维护困难
- 容易出现版本不一致
- 增加打包体积

**建议**:

- 统一第三方库到 libs/目录
- AR 相关库应该引用 libs/而非复制

### 2.6 无类型系统

**问题描述**:

- 纯 JavaScript，无 TypeScript
- 函数参数和返回值无类型声明
- 依赖运行时错误发现

**影响**:

- IDE 自动补全差
- 重构风险高
- 运行时错误多

**建议**:
考虑迁移使用 JSDoc

### 2.7 无自动化测试

**问题描述**:

- 无单元测试
- 无集成测试
- 无 E2E 测试
- 依赖手动测试

**影响**:

- 重构信心不足
- 回归 bug 难以发现
- 代码质量无法保证

**建议**:
引入 Jest + Testing Library

---

## 3. 架构缺陷分析

### 3.1 分层架构不清晰

**当前状态**:
项目正在进行分层重构（src/目录），但尚未完成：

```
src/
├── core/           # 核心层 ✅ 部分完成
├── domain/         # 领域层 ⚠️ 仅占位
├── application/    # 应用层 ✅ 部分完成
├── ui/             # UI 层 ✅ 部分完成
├── platform/       # 平台层 ✅ 部分完成
└── legacy/         # 兼容层 ✅ 部分完成
```

**依赖规则**（预期）:

```
ui -> application -> domain -> core
platform -> core
legacy -> (所有层)
```

**问题**:

- domain 层几乎为空
- application 层只有 CommandBus 和 usecase
- 旧代码完全不分层
- 层之间边界模糊

**建议**:
完成 Clean Architecture 分层架构

### 3.2 全局状态管理

**当前状态**:

- 使用 `window.DaxiApp` 作为全局状态容器
- 各模块直接访问和修改全局状态
- 无状态变化追踪

**问题**:

```javascript
// 当前代码
window.DaxiApp.currentState = "loading";
window.DaxiApp.userData = fetchData();
window.DaxiApp.updateUI();

// 问题：
// 1. 谁修改了状态？
// 2. 何时修改的？
// 3. 为什么会修改？
```

**影响**:

- 状态变化难以追踪
- 调试困难
- 容易出现竞态条件

**建议**:
引入状态管理模式（如 Redux 或 Zustand）

### 3.3 组件系统混乱

**当前状态**:

- 使用自定义组件系统（DXBaseComponent.extend）
- 类似 Backbone/Class 的继承模式
- 组件生命周期管理不完善

```javascript
// 当前模式
DXMapComponent = DXBaseComponent.extend({
  init: function() { ... },
  render: function() { ... },
  destroy: function() { ... }
});
```

**问题**:

- 非标准组件模型
- 学习成本高
- 无法利用现代框架优势

**建议**:
考虑迁移到 Vue/React 或完善现有组件系统

### 3.4 依赖注入缺失

**当前状态**:

```javascript
// 直接访问全局
const app = window.DaxiApp;
const config = window.config;
const api = window.DaxiApp.api;
```

**问题**:

- 硬编码依赖
- 无法替换 mock
- 测试困难

**建议**:

```javascript
// 依赖注入
export function createComponent(options = {}) {
  const app = options.app || window.DaxiApp;
  const config = options.config || ConfigService.getInstance();
  // ...
}
```

### 3.5 错误处理不统一

**当前状态**:

- 混用 try-catch、回调、Promise
- 无统一错误处理机制
- 错误信息不规范

**建议**:

- 统一使用 Promise + async/await
- 建立错误类层次结构
- 全局错误边界

---

## 4. 结构缺陷分析

### 4.1 文件组织混乱

**问题**:

- 同一功能文件分散在不同目录
- 命名不规范（大小写混用）
- 目录层级过深或过浅

**示例**:

```
app/navi_app/utils/AR/ARNavigation.js      # AR 导航
app/navi_app/utils/ARNavigation.js         # 也是 AR 导航
app/navi_app/utils/ARNavigation-new.js     # 新版本？
app/navi_app/utils/ARNavigation-newAR.js   # 又一个版本？
app/navi_app/utils/ARNavigationAPI.js      # API 版本
app/navi_app/utils/ARNavigationAPI_12306.js # 12306 定制版
```

**建议**:

- 统一目录结构
- 规范命名（kebab-case 或 camelCase）
- 清理废弃文件

### 4.2 循环依赖风险

**当前状态**:
由于使用全局变量，循环依赖被隐藏：

```javascript
// fileA.js
const b = window.DaxiApp.moduleB;

// fileB.js
const a = window.DaxiApp.moduleA;
```

**问题**:

- 运行时才能发现循环依赖
- 初始化顺序敏感

**建议**:
使用 ES6 modules + 静态分析工具检测

### 4.3 入口文件过多

**问题**:

- `index_src.html` 加载 20+ 个脚本
- 每个页面状态都是独立入口
- 无代码共享

**建议**:

- 统一到单入口（main.js）
- 使用动态导入进行代码分割

---

## 5. 现有重构进展

### 5.1 已完成的架构设计

**分层架构**（src/目录）:

```
src/
├── main.js                      # ✅ ES6 入口
├── core/                        # ✅ 核心层
│   ├── index.js
│   └── config/
│       ├── index.js
│       └── config-service.js    # ✅ 配置服务
├── domain/                      # ⚠️ 领域层（仅占位）
│   ├── index.js
│   ├── navigation/
│   ├── poi/
│   └── route/
├── application/                 # ✅ 应用层
│   ├── index.js
│   ├── commands/
│   │   ├── index.js
│   │   └── command-bus.js       # ✅ 命令总线
│   ├── usecases/
│   │   ├── index.js
│   │   └── app-init-usecase.js  # ✅ 初始化用例
│   └── state/
│       └── index.js
├── ui/                          # ✅ UI 层
│   ├── index.js
│   └── controllers/
│       ├── page-controller-registry.js  # ✅ 页面控制器注册
│       ├── legacy-page-controller-adapter.js  # ✅ 旧控制器适配
│       ├── home-page-controller.js
│       ├── service-page-controller.js
│       └── ... (20+ 页面控制器)
├── platform/                    # ✅ 平台层
│   ├── index.js
│   └── bridge/
│       ├── index.js
│       ├── bridge-service.js    # ✅ 桥接服务
│       └── downloader-factory.js # ✅ 下载器工厂
└── legacy/                      # ✅ 兼容层
    ├── index.js
    └── bridge-compat.js         # ✅ 桥接兼容
```

### 5.2 已完成的核心模块

| 模块           | 文件                                       | 状态 | 说明             |
| -------------- | ------------------------------------------ | ---- | ---------------- |
| ConfigService  | `core/config/config-service.js`            | ✅   | 配置管理服务     |
| BridgeService  | `platform/bridge/bridge-service.js`        | ✅   | JSBridge 封装    |
| CommandBus     | `application/commands/command-bus.js`      | ✅   | 命令总线         |
| AppInitUsecase | `application/usecases/app-init-usecase.js` | ✅   | 应用初始化       |
| PageController | `ui/controllers/*.js`                      | ✅   | 页面控制器 (20+) |
| LegacyAdapter  | `legacy/bridge-compat.js`                  | ✅   | 旧代码兼容       |

### 5.3 已完成的设计模式

**1. 依赖注入**:

```javascript
export function createModularApp(options = {}) {
  const configService = options.configService || ConfigService.fromWindow(globalRef);
  const bridgeService = options.bridgeService || BridgeService.fromWindow({...});
  // ...
}
```

**2. 适配器模式**:

```javascript
export function createLegacyPageController(pageName, options = {}) {
  // 将旧页面控制器适配为新接口
  return deps.daxiapp[pageName] || null;
}
```

**3. 工厂模式**:

```javascript
export function createDownloaderFactory(options = {}) {
  return {
    create(platform, jsBridge) {
      if (isNativePlatform(platform)) {
        return new nativeDownloaderCtor(jsBridge);
      }
      return new appRef.DXDownloader();
    },
  };
}
```

### 5.4 待完成的工作

| 工作项        | 优先级 | 工作量 | 说明                    |
| ------------- | ------ | ------ | ----------------------- |
| Domain 层实现 | 高     | 大     | 核心业务逻辑            |
| 旧代码迁移    | 高     | 极大   | 66 个文件的 window 引用 |
| 构建系统搭建  | 高     | 中     | webpack/vite配置        |
| 状态管理      | 中     | 中     | Redux/Zustand           |
| 测试框架      | 中     | 中     | Jest + Testing Library  |

---

## 6. 重构策略

### 6.1 总体策略：渐进式重构

**不推荐**: 大爆炸式重写

- ❌ 风险极高
- ❌ 周期长
- ❌ 容易引入新 bug
- ❌ 团队学习成本高

**推荐**: 渐进式重构

- ✅ 风险可控
- ✅ 可快速见效
- ✅ 随时可回滚
- ✅ 团队逐步适应

### 6.2 重构原则

1. **保持向后兼容**: 新代码必须能与旧代码共存
2. **逐步迁移**: 一个模块一个模块地迁移
3. **测试保障**: 每个模块迁移后必须测试
4. **小步快跑**: 每次提交只改一个小点
5. **依赖注入**: 新代码使用 DI，旧代码保持全局访问

### 6.3 技术选型建议

| 领域     | 推荐方案              | 备选方案      |
| -------- | --------------------- | ------------- |
| 构建工具 | **Vite**              | Webpack       |
| 包管理   | **pnpm**              | yarn, pnpm    |
| 状态管理 | **Zustand**           | Redux, Vuex   |
| 类型系统 | **JSDOC**             | 无            |
| 测试框架 | **Jest**              | Vitest, Mocha |
| 代码规范 | **ESLint + Prettier** | TSLint        |

**推荐理由**:

- Vite: 开发速度快，配置简单，原生支持 ES6 modules
- Zustand: 轻量级，API 简单，适合中小型项目

### 6.4 Window 引用消除策略

**策略**: 分层消除

**第 1 层：配置相关**

```javascript
// 之前
const rootPath = window.rootPath;
const config = window.config;

// 之后
import { ConfigService } from "@/core/config";
const config = ConfigService.getInstance();
```

**第 2 层：工具函数**

```javascript
// 之前
const params = window.getParam();
const dom = window.DXDomUtil.find(...);

// 之后
import { parseParams } from '@/utils/params';
import { $ } from '@/utils/dom';
```

**第 3 层：应用状态**

```javascript
// 之前
window.DaxiApp.currentUser = user;
window.DaxiApp.updateUI();

// 之后
import { useAppState } from "@/application/state";
const state = useAppState();
state.setCurrentUser(user);
```

**第 4 层：平台 API**

```javascript
// 之前
window.locWebSocketPostMessage(data);

// 之后
import { bridgeService } from "@/platform/bridge";
bridgeService.postLocationMessage("custom", data);
```

### 6.5 兼容层设计

**目的**: 让新代码和旧代码能够共存

```javascript
// legacy/bridge-compat.js
export function installLegacyBridgeCompat(options = {}) {
  const { globalRef } = options;

  // 创建桥接对象，同时支持新旧访问方式
  const compatBridge = {
    // 新代码使用
    invoke(method, ...args) {
      return bridgeService.invoke(method, ...args);
    },

    // 旧代码使用
    getMethod(name) {
      return globalRef.DaxiApp?.[name];
    },
  };

  // 保持旧访问方式可用
  globalRef.DaxiApp = new Proxy(globalRef.DaxiApp || {}, {
    get(target, key) {
      return compatBridge[key] || target[key];
    },
  });

  return compatBridge;
}
```

---

## 7. 重构任务分解

### 7.1 阶段 1: 基础设施搭建 (预计 2-3 天)

#### 任务 1.1: 初始化 pnpm 项目

```bash
pnpm init -y
pnpm install --save-dev vite @vitejs/plugin-legacy
pnpm install --save-dev eslint prettier
pnpm install --save-dev jest @testing-library/jest-dom
```

**交付物**:

- [ ] `package.json`
- [ ] `vite.config.js`
- [ ] `.eslintrc.js`
- [ ] `.prettierrc`
- [ ] `jest.config.js`

#### 任务 1.2: 配置 Vite

```javascript
// vite.config.js
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
});
```

**交付物**:

- [ ] Vite 配置文件
- [ ] 别名配置
- [ ] 构建输出配置

#### 任务 1.3: 迁移第三方库到 pnpm

```bash
# 识别 package.json 中缺失的依赖
pnpm install zepto crypto-js md5
pnpm install three @three.js/fbxloader
pnpm install mapbox-gl
pnpm install swiper
```

**交付物**:

- [ ] `package.json` dependencies 更新
- [ ] 移除 libs/中的重复库
- [ ] 更新 import 路径

#### 任务 1.4: 配置开发服务器

```javascript
// vite.config.js
export default defineConfig({
  server: {
    port: 3000,
    open: "/app/navi_app/shouxihu/index_src.html",
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
```

**交付物**:

- [ ] 开发服务器启动
- [ ] 热重载工作
- [ ] API 代理配置

### 7.2 阶段 2: 完善核心架构 (预计 5-7 天)

#### 任务 2.1: 完善 Core 层

**ConfigService** (已完成，需增强):

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
    // 从 UA 或 jsBridge 识别环境
    return "ios_web"; // ios, android, web, etc.
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
}
```

**新增工具模块**:

```javascript
// core/utils/param-parser.js
export function parseParams(url = window.location.href) {
  // 提取 getParam.js 的逻辑
}

// core/utils/env-detector.js
export function detectEnvironment(jsBridge) {
  // 环境检测逻辑
}
```

**交付物**:

- [ ] ConfigService 增强
- [ ] 工具函数抽取
- [ ] 单元测试

#### 任务 2.2: 完善 Domain 层

**领域模型**:

```javascript
// domain/poi/poi-entity.js
export class POI {
  constructor(data) {
    this.id = data.id;
    this.poiId = data.poiId;
    this.name = data.name;
    this.address = data.address;
    this.lon = data.lon;
    this.lat = data.lat;
    this.bdid = data.bdid;
  }
}

// domain/poi/poi-repository.js
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

// domain/navigation/route-entity.js
export class Route {
  constructor(startPoint, endPoint, waypoints = []) {
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.waypoints = waypoints;
  }

  get distance() {
    // 计算距离
  }

  get duration() {
    // 计算时长
  }
}
```

**交付物**:

- [ ] POI 领域模型
- [ ] Route 领域模型
- [ ] Repository 接口
- [ ] 领域服务

#### 任务 2.3: 完善 Application 层

**状态管理**:

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

  // 导航状态
  isNavigating: false,
  currentRoute: null,
  startNavigation: (route) => set({ isNavigating: true, currentRoute: route }),
  stopNavigation: () => set({ isNavigating: false, currentRoute: null }),

  // UI 状态
  currentPage: "HomePage",
  setCurrentPage: (page) => set({ currentPage: page }),
}));
```

**Use Cases**:

```javascript
// application/usecases/load-poi-detail.js
export function createLoadPOIDetailUsecase(options = {}) {
  const { poiRepository, logger = console } = options;

  return {
    async execute(poiId) {
      try {
        logger.info(`[LoadPOIDetail] Loading POI: ${poiId}`);
        const poi = await poiRepository.getById(poiId);
        return { success: true, data: poi };
      } catch (error) {
        logger.error(`[LoadPOIDetail] Failed: ${error.message}`);
        return { success: false, error };
      }
    },
  };
}
```

**交付物**:

- [ ] 状态管理实现
- [ ] Use Cases 实现
- [ ] 命令处理完善

#### 任务 2.4: 完善 Platform 层

**API 服务**:

```javascript
// platform/api/api-service.js
export class ApiService {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "";
    this.bridgeService = options.bridgeService;
  }

  async get(endpoint, params = {}) {
    const url = new URL(endpoint, this.baseUrl);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async post(endpoint, data) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
}
```

**交付物**:

- [ ] API 服务封装
- [ ] 错误处理
- [ ] 请求拦截器

### 7.3 阶段 3: UI 层重构 (预计 10-15 天)

#### 任务 3.1: 页面控制器基类

```javascript
// ui/controllers/base-page-controller.js
export class BasePageController {
  constructor(options = {}) {
    this.name = options.name;
    this.app = options.app;
    this.state = options.state;
    this.logger = options.logger || console;
  }

  /**
   * 页面创建时调用
   */
  onCreate(params) {}

  /**
   * 页面显示时调用
   */
  onShow() {}

  /**
   * 页面隐藏时调用
   */
  onHide() {}

  /**
   * 页面销毁时调用
   */
  onDestroy() {}

  /**
   * 处理命令
   */
  handleCommand(command, context) {
    const methodName = `handle${command}`;
    if (typeof this[methodName] === "function") {
      return this[methodName](context);
    }
  }
}
```

#### 任务 3.2: 迁移现有页面控制器

已完成 20+ 个页面控制器，需要检查完整性和测试覆盖。

#### 任务 3.3: 组件系统完善

```javascript
// ui/components/base-component.js
export class BaseComponent {
  constructor(options = {}) {
    this.props = options.props || {};
    this.state = options.state || {};
    this.el = options.el || null;
  }

  render() {
    throw new Error("render() must be implemented");
  }

  mount(container) {
    const html = this.render();
    if (typeof html === "string") {
      container.innerHTML = html;
      this.el = container.firstElementChild;
    } else {
      container.appendChild(html);
      this.el = html;
    }
    this.onMount();
  }

  onMount() {}

  unmount() {
    this.el?.remove();
    this.onUnmount();
  }

  onUnmount() {}

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }
}
```

**交付物**:

- [ ] BasePageController
- [ ] BaseComponent
- [ ] 页面控制器迁移
- [ ] 组件迁移

### 7.4 阶段 4: 消除 Window 引用 (预计 10-15 天)

#### 任务 4.1: 创建 Window 访问抽象层

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

#### 任务 4.2: 逐步替换 Window 访问

**优先级排序**:

1. **配置相关** (高优先级)
   - `window.rootPath` → `ConfigService`
   - `window.config` → `ConfigService`
   - `window.currentEnv` → `ConfigService`

2. **工具函数** (高优先级)
   - `window.getParam()` → `parseParams()`
   - `window.DXDomUtil` → DOM 工具模块

3. **应用状态** (中优先级)
   - `window.DaxiApp` → 依赖注入
   - `window.DaxiMap` → 依赖注入

4. **平台 API** (中优先级)
   - `window.locWebSocketPostMessage` → `BridgeService`
   - `window.command` → `CommandBus`

5. **其他** (低优先级)
   - 第三方库的全局变量

#### 任务 4.3: 建立 Window 使用基线

运行现有脚本建立基线：

```bash
node scripts/quality/check-globals.js --mode update-baseline
```

每次重构后检查：

```bash
node scripts/quality/check-globals.js --mode check
```

**交付物**:

- [ ] WindowAdapter
- [ ] Window 访问替换清单
- [ ] 基线检查通过

### 7.5 阶段 5: 测试和文档 (预计 5-7 天)

#### 任务 5.1: 单元测试

```javascript
// __tests__/config-service.test.js
import { ConfigService } from "@/core/config/config-service";

describe("ConfigService", () => {
  it("should parse URL params", () => {
    const mockWindow = {
      location: { href: "http://test.com/?userId=123&bdid=B001" },
    };
    const config = ConfigService.fromWindow(mockWindow);
    expect(config.get("userId")).toBe("123");
    expect(config.get("bdid")).toBe("B001");
  });

  it("should detect environment", () => {
    // ...
  });
});
```

#### 任务 5.2: 集成测试

```javascript
// __tests__/app-integration.test.js
import { createModularApp } from "@/main";

describe("App Integration", () => {
  it("should initialize successfully", () => {
    const app = createModularApp();
    const result = app.start();
    expect(result.status).toBe("ready");
  });
});
```

#### 任务 5.3: 文档编写

**需要编写的文档**:

- [ ] `README.md` - 项目说明
- [ ] `ARCHITECTURE.md` - 架构文档
- [ ] `REFACTORING_GUIDE.md` - 重构指南
- [ ] `API.md` - API 文档
- [ ] 各模块的 JSDoc 注释

**交付物**:

- [ ] 单元测试覆盖关键模块
- [ ] 集成测试覆盖主流程
- [ ] 完整的文档

---

## 8. 实施路线图

### 8.1 时间规划

| 阶段       | 任务             | 预计时间     | 里程碑                 |
| ---------- | ---------------- | ------------ | ---------------------- |
| **阶段 1** | 基础设施搭建     | 2-3 天       | Vite 开发服务器启动    |
| **阶段 2** | 完善核心架构     | 5-7 天       | Domain 层实现完成      |
| **阶段 3** | UI 层重构        | 10-15 天     | 所有页面控制器迁移完成 |
| **阶段 4** | 消除 Window 引用 | 10-15 天     | Window 引用减少 80%    |
| **阶段 5** | 测试和文档       | 5-7 天       | 测试覆盖率达到 70%     |
| **总计**   |                  | **32-47 天** |                        |

### 8.2 风险控制

| 风险           | 影响 | 概率 | 缓解措施                |
| -------------- | ---- | ---- | ----------------------- |
| 旧代码依赖复杂 | 高   | 高   | 渐进式重构，保持兼容    |
| 测试覆盖率低   | 中   | 高   | 优先为核心模块编写测试  |
| 团队学习成本   | 中   | 中   | 文档 + 培训             |
| 需求插入       | 高   | 中   | 预留缓冲时间            |
| 第三方库不兼容 | 中   | 低   | 提前验证，准备 fallback |

### 8.3 成功标准

**技术指标**:

- [ ] ES6 模块覆盖率 > 90%
- [ ] Window 引用减少 > 80%
- [ ] 单元测试覆盖率 > 70%
- [ ] 构建时间 < 30 秒
- [ ] 打包体积减少 > 20%

**质量指标**:

- [ ] 无循环依赖
- [ ] 所有文件 < 1000 行
- [ ] ESLint 规则全部通过

**业务指标**:

- [ ] 功能与重构前完全一致
- [ ] 性能无明显下降
- [ ] 用户体验无影响

### 8.4 持续改进

重构完成后，建立持续改进机制：

1. **代码审查**: 新增代码必须符合新规范
2. **技术债务看板**: 跟踪待改进点
3. **定期重构日**: 每周固定时间处理技术债务
4. **自动化检查**: CI 中加入架构检查

---

## 附录 A: Window 引用完整清单

详见 `docs/reports/global-usage-baseline.json`

## 附录 B: 文件依赖关系图

待补充（可使用 madge 等工具生成）

## 附录 C: 术语表

| 术语       | 说明                      |
| ---------- | ------------------------- |
| POI        | Point of Interest，兴趣点 |
| BDID       | Building ID，建筑物 ID    |
| JSBridge   | 原生与 H5 通信桥接        |
| UseCase    | 用例，应用层业务逻辑封装  |
| Repository | 仓储，数据访问抽象        |
| Entity     | 实体，领域模型            |

---

**文档版本**: 1.0  
**最后更新**: 2026-02-26  
**维护者**: [待填写]
