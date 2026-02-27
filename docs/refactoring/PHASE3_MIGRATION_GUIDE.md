# Phase 3 UI 层迁移指南

**阶段**: Phase 3 - UI 层迁移  
**任务**: 页面控制器迁移  
**日期**: 2026-02-27  

---

## 📋 迁移任务清单

### 现有控制器 (24 个)

#### 基础页面 (4 个)
- [ ] home-page-controller.js
- [ ] service-page-controller.js
- [ ] profile-page-controller.js
- [ ] about-page-controller.js

#### 地图状态页面 (15 个)
- [ ] map-state-browse-page-controller.js
- [ ] map-state-change-start-end-point-page-controller.js
- [ ] map-state-create-group-page-controller.js
- [ ] map-state-exhibition-route-page-controller.js
- [ ] map-state-main-poi-page-controller.js
- [ ] map-state-navi-page-controller.js
- [ ] map-state-poi-detail-page-controller.js
- [ ] map-state-poi-page-controller.js
- [ ] map-state-route-page-controller.js
- [ ] map-state-search-page-controller.js
- [ ] map-state-select-point-page-controller.js
- [ ] map-state-share-group-page-controller.js
- [ ] map-state-share-pos-page-controller.js
- [ ] map-state-simulate-navi-page-controller.js
- [ ] map-state-visit-navi-page-controller.js

#### 其他页面 (5 个)
- [ ] poi-detail-page-controller.js
- [ ] pay-result-page-controller.js
- [ ] legacy-page-controller-adapter.js
- [ ] named-page-controller-factory.js
- [ ] page-controller-registry.js

---

## 🎯 迁移策略

### 旧架构 vs 新架构

#### 旧架构
```javascript
// 工厂函数模式
export function createHomePageController(options) {
  return createNamedPageController('HomePage', options);
}

// 实际控制器在 DaxiApp 命名空间
const controller = DaxiApp.HomePage;
```

#### 新架构
```javascript
// ES6 Class 模式
import { BasePageController } from '@/ui/controllers/base-page-controller.js';

export class HomePageController extends BasePageController {
  constructor(options) {
    super(options);
    this.pageName = 'HomePage';
  }

  async onCreate(params) {
    await super.onCreate(params);
    // 初始化逻辑
  }
}
```

### 迁移步骤

#### Step 1: 创建页面目录结构
```
src/ui/pages/
├── home-page/
│   ├── index.js
│   ├── home-page.controller.js
│   └── home-page.template.html
├── service-page/
├── profile-page/
└── ...
```

#### Step 2: 迁移控制器逻辑
1. 创建新的 Class 继承 BasePageController
2. 迁移生命周期方法 (onCreate, onShow, onHide, onDestroy)
3. 迁移事件处理
4. 更新导航调用

#### Step 3: 注册到 Router
```javascript
import { registerAllPages } from '@/ui/controllers/page-controller-registry.js';

registerAllPages({
  'HomePage': HomePageController,
  'ServicePage': ServicePageController,
  // ...
});
```

#### Step 4: 更新引用
- 更新所有对旧控制器的引用
- 删除旧的工厂函数

---

## 📝 迁移示例

### 示例：HomePage 迁移

#### 旧代码
```javascript
// app/navi_app/shouxihu/src/ui/controllers/home-page-controller.js
import { createNamedPageController } from "./named-page-controller-factory.js";

const PAGE_NAME = "HomePage";

export function createHomePageController(options = {}) {
  return createNamedPageController(PAGE_NAME, options);
}
```

#### 新代码
```javascript
// src/ui/pages/home-page/home-page.controller.js
import { BasePageController } from '@/ui/controllers/base-page-controller.js';

export class HomePageController extends BasePageController {
  constructor(options) {
    super(options);
    this.pageName = 'HomePage';
  }

  async onCreate(params) {
    await super.onCreate(params);
    console.log('[HomePage] Created');
    this.loadHomeData();
  }

  async onShow() {
    await super.onShow();
    console.log('[HomePage] Shown');
    this.bindEvents();
  }

  async onHide() {
    await super.onHide();
    console.log('[HomePage] Hidden');
    this.unbindEvents();
  }

  async onDestroy() {
    await super.onDestroy();
    console.log('[HomePage] Destroyed');
  }

  loadHomeData() {
    // 加载首页数据
  }

  bindEvents() {
    const btn = this.$('.search-btn');
    if (btn) {
      this.addEventListener(btn, 'click', () => {
        this.navigateTo('SearchPage');
      });
    }
  }

  unbindEvents() {
    // 事件会自动清理
  }
}
```

#### 页面入口
```javascript
// src/ui/pages/home-page/index.js
export { HomePageController } from './home-page.controller.js';
```

---

## 🔧 迁移工具

### 批量迁移脚本
```javascript
// scripts/migrate-controllers.js
const controllers = [
  'HomePage',
  'ServicePage',
  'ProfilePage',
  // ...
];

controllers.forEach(name => {
  console.log(`Migrating ${name}...`);
  // 创建文件、目录等
});
```

### 验证脚本
```javascript
// scripts/verify-migration.js
const { pageControllerRegistry } = import('@/ui/controllers/page-controller-registry.js');

const registered = pageControllerRegistry.getAll();
console.log('Registered pages:', registered);

const expected = ['HomePage', 'ServicePage', ...];
const missing = expected.filter(name => !registered.includes(name));

if (missing.length > 0) {
  console.error('Missing controllers:', missing);
  process.exit(1);
}

console.log('All controllers migrated!');
```

---

## ⚠️ 注意事项

### 1. 生命周期对应关系

| 旧生命周期 | 新生命周期 | 说明 |
|-----------|-----------|------|
| initialize | onCreate | 初始化 |
| onShow | onShow | 显示 |
| onHide | onHide | 隐藏 |
| finalize | onDestroy | 销毁 |

### 2. 导航 API 对应

| 旧 API | 新 API | 说明 |
|--------|--------|------|
| app.switchState(name) | router.navigate(name) | 导航 |
| app.back() | router.back() | 返回 |

### 3. 状态访问对应

| 旧 API | 新 API | 说明 |
|--------|--------|------|
| DaxiApp.state | appState.getState() | 获取状态 |
| DaxiApp.xxx | appState.getStateAtPath('xxx') | 获取特定状态 |

### 4. DOM 操作对应

| 旧 API | 新 API | 说明 |
|--------|--------|------|
| $() | this.$() | 查找元素 |
| DXDomUtil.show() | this.show() | 显示 |
| DXDomUtil.hide() | this.hide() | 隐藏 |

---

## ✅ 验收标准

### 功能验收
- [ ] 所有页面能正常访问
- [ ] 导航功能正常
- [ ] 生命周期钩子正常调用
- [ ] 事件处理正常
- [ ] 状态更新正常

### 代码质量验收
- [ ] 所有控制器继承 BasePageController
- [ ] 使用新的导航 API
- [ ] 使用新的事件管理
- [ ] 无 window 直接访问
- [ ] ESLint 检查通过

### 性能验收
- [ ] 页面切换流畅
- [ ] 无内存泄漏
- [ ] 事件监听器正确清理

---

## 📊 迁移进度

| 阶段 | 控制器数 | 已迁移 | 进度 |
|------|----------|--------|------|
| 基础页面 | 4 | 0 | 0% |
| 地图状态 | 15 | 0 | 0% |
| 其他页面 | 5 | 0 | 0% |
| **总计** | **24** | **0** | **0%** |

---

**下一步**: 开始批量迁移控制器
