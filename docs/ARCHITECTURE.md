# 架构说明文档

**项目**: daxi-aiguide-h5  
**版本**: 1.0.0  
**最后更新**: 2026-03-01

---

## 📐 架构概述

### 架构风格

本项目采用 **分层架构 (Layered Architecture)** 结合 **整洁架构 (Clean Architecture)** 的设计原则：

- **关注点分离**: 每层有明确的职责
- **依赖规则**: 依赖只能指向内层
- **可测试性**: 各层可独立测试
- **可维护性**: 易于理解和修改

### 架构分层

```
┌────────────────────────────────────────────────────┐
│                  UI Layer (外层)                    │
│  职责：用户界面展示和交互                            │
│  目录：src/ui/                                     │
├────────────────────────────────────────────────────┤
│              Application Layer                      │
│  职责：业务逻辑编排和用例实现                        │
│  目录：src/application/                            │
├────────────────────────────────────────────────────┤
│                Domain Layer (内层)                  │
│  职责：核心业务逻辑和规则                            │
│  目录：src/domain/                                 │
├────────────────────────────────────────────────────┤
│            Core Layer (基础设施)                    │
│  职责：核心基础设施和通用服务                        │
│  目录：src/core/                                   │
├────────────────────────────────────────────────────┤
│           Platform/API Layer (外层)                 │
│  职责：外部系统适配和平台交互                        │
│  目录：src/platform/, src/api/                     │
└────────────────────────────────────────────────────┘
```

---

## 🏗️ 分层详细设计

### 1. UI Layer (UI 层)

**位置**: `src/ui/`

**职责**:
- 用户界面展示
- 用户交互处理
- 视图渲染
- 事件触发

**子目录**:
```
ui/
├── pages/              # 页面控制器
│   ├── home/          # 首页
│   ├── scenic/        # 景点页
│   ├── route/         # 路线页
│   ├── service/       # 服务页
│   └── user/          # 用户页
├── components/         # UI 组件
│   ├── common/        # 通用组件
│   └── business/      # 业务组件
└── styles/            # 样式文件
```

**依赖规则**:
- ✅ 可依赖：Application Layer
- ❌ 禁止依赖：Domain Layer (跨层)
- ❌ 禁止依赖：Platform/API Layer (跨层)

**示例**:
```javascript
// src/ui/pages/home/HomePage.js
import { homeService } from '@/application/services/home-service';

export class HomePage {
  async init() {
    // 调用应用服务获取数据
    const data = await homeService.loadData();
    // 渲染视图
    this.render(data);
  }
  
  onUserClick() {
    // 触发应用事件
    homeService.handleUserAction();
  }
}
```

---

### 2. Application Layer (应用层)

**位置**: `src/application/`

**职责**:
- 业务逻辑编排
- 用例实现
- 服务协调
- 状态管理

**子目录**:
```
application/
├── services/           # 应用服务
│   ├── home-service.js
│   ├── scenic-service.js
│   └── order-service.js
├── stores/            # 状态存储
│   ├── user-store.js
│   └── order-store.js
└── events/            # 应用事件
    └── app-events.js
```

**依赖规则**:
- ✅ 可依赖：Domain Layer, Platform Layer, API Layer
- ❌ 禁止依赖：UI Layer (反向依赖)

**示例**:
```javascript
// src/application/services/scenic-service.js
import { scenicRepository } from '@domain/repositories/scenic-repository';
import { mapService } from '@platform/map/map-service';
import { storage } from '@platform/storage/local-storage';

export class ScenicService {
  async loadScenicDetail(id) {
    // 1. 从缓存加载
    let cached = storage.get(`scenic_${id}`);
    if (cached) return cached;
    
    // 2. 从领域层获取数据
    const scenic = await scenicRepository.getById(id);
    
    // 3. 调用平台服务更新地图
    await mapService.centerOn(scenic.location);
    
    // 4. 缓存数据
    storage.set(`scenic_${id}`, scenic);
    
    return scenic;
  }
}
```

---

### 3. Domain Layer (领域层)

**位置**: `src/domain/`

**职责**:
- 核心业务逻辑
- 业务规则
- 实体定义
- 值对象

**子目录**:
```
domain/
├── entities/           # 业务实体
│   ├── scenic.js      # 景点实体
│   ├── user.js        # 用户实体
│   └── order.js       # 订单实体
├── values/            # 值对象
│   ├── location.js    # 位置
│   └── money.js       # 金额
├── events/            # 领域事件
│   └── order-events.js
└── repositories/      # 仓储接口
    └── scenic-repository.js
```

**依赖规则**:
- ✅ 可依赖：无 (最内层，零依赖)
- ❌ 禁止依赖：任何外层

**示例**:
```javascript
// src/domain/entities/scenic.js
export class Scenic {
  constructor(id, name, location, description) {
    this.id = id;
    this.name = name;
    this.location = location; // Location 值对象
    this.description = description;
  }
  
  // 业务规则
  isOpenNow(currentTime) {
    return currentTime >= this.openTime && currentTime <= this.closeTime;
  }
  
  // 业务规则
  getTicketPrice(userType) {
    if (userType === 'child') return this.price * 0.5;
    if (userType === 'senior') return this.price * 0.7;
    return this.price;
  }
}
```

---

### 4. Core Layer (核心层)

**位置**: `src/core/`

**职责**:
- 核心基础设施
- 通用服务
- 配置管理
- 状态管理
- 路由管理

**子目录**:
```
core/
├── config/            # 配置服务
│   └── config-service.js
├── state/             # 状态管理
│   └── state-manager.js
├── router/            # 路由管理
│   └── state-router.js
└── utils/             # 工具函数
    ├── env-detector.js
    └── helpers.js
```

**依赖规则**:
- ✅ 可依赖：无 (基础设施层)
- ❌ 禁止依赖：业务逻辑层

**示例**:
```javascript
// src/core/state/state-manager.js
export class StateManager {
  constructor() {
    this.state = {};
    this.listeners = [];
  }
  
  getState() {
    return { ...this.state };
  }
  
  setState(newState) {
    const oldState = this.state;
    this.state = { ...this.state, ...newState };
    this.notifyListeners(this.state, oldState);
  }
  
  subscribe(listener) {
    this.listeners.push(listener);
    return () => this.unsubscribe(listener);
  }
  
  notifyListeners(newState, oldState) {
    this.listeners.forEach(fn => fn(newState, oldState));
  }
}

export const appState = new StateManager();
```

---

### 5. Platform Layer (平台层)

**位置**: `src/platform/`

**职责**:
- 平台适配
- 外部系统交互
- 设备能力封装
- 第三方 SDK 集成

**子目录**:
```
platform/
├── map/               # 地图服务
│   ├── map-service.js
│   └── map-adapter.js
├── bridge/            # JSBridge
│   └── jsbridge.js
├── storage/           # 本地存储
│   ├── local-storage.js
│   └── session-storage.js
└── device/            # 设备能力
    └── device-info.js
```

**依赖规则**:
- ✅ 可依赖：Core Layer
- ❌ 禁止依赖：UI/Application Layer

**示例**:
```javascript
// src/platform/map/map-service.js
import { MapSDK } from '@map_sdk';

export class MapService {
  constructor() {
    this.map = null;
  }
  
  init(containerId, options) {
    this.map = new MapSDK(containerId, options);
  }
  
  async centerOn(location) {
    if (!this.map) throw new Error('Map not initialized');
    await this.map.setCenter(location);
  }
  
  addMarker(options) {
    return this.map.addMarker(options);
  }
}

export const mapService = new MapService();
```

---

### 6. API Layer (API 层)

**位置**: `src/api/`

**职责**:
- 网络请求
- 数据序列化
- 认证授权
- 接口定义

**子目录**:
```
api/
├── http-client.js     # HTTP 客户端
├── auth-api.js        # 认证 API
├── scenic-api.js      # 景点 API
└── order-api.js       # 订单 API
```

**依赖规则**:
- ✅ 可依赖：Core Layer
- ❌ 禁止依赖：UI/Application Layer

**示例**:
```javascript
// src/api/scenic-api.js
import { httpClient } from './http-client';

export class ScenicAPI {
  async getList(params) {
    return httpClient.get('/api/scenic/list', params);
  }
  
  async getDetail(id) {
    return httpClient.get(`/api/scenic/${id}`);
  }
  
  async getAudio(id) {
    return httpClient.get(`/api/scenic/${id}/audio`);
  }
}

export const scenicApi = new ScenicAPI();
```

---

## 🔄 数据流设计

### 完整数据流

```
用户操作
   ↓
[UI Layer] 页面控制器捕获事件
   ↓
[Application Layer] 服务处理业务逻辑
   ↓
[Domain Layer] 执行业务规则
   ↓
[Platform/API Layer] 调用外部接口
   ↓
[Domain Layer] 返回业务实体
   ↓
[Application Layer] 处理响应
   ↓
[Core Layer] 更新状态
   ↓
[UI Layer] 视图重新渲染
```

### 状态驱动更新

```javascript
// 1. 用户操作
button.addEventListener('click', async () => {
  // 2. UI 层调用应用服务
  await scenicService.loadScenic(123);
});

// 3. 应用层更新状态
class ScenicService {
  async loadScenic(id) {
    const scenic = await scenicApi.getDetail(id);
    appState.setState({ currentScenic: scenic }); // 触发状态更新
  }
}

// 4. UI 层监听状态变化
appState.subscribe((state) => {
  if (state.currentScenic) {
    renderScenicDetail(state.currentScenic); // 重新渲染
  }
});
```

---

## 📋 依赖规则总结

### 允许依赖

```
UI → Application
Application → Domain
Application → Platform
Application → API
Platform → Core
API → Core
```

### 禁止依赖

```
❌ UI → Domain (跨层)
❌ UI → Platform (跨层)
❌ UI → API (跨层)
❌ Application → UI (反向依赖)
❌ Domain → 任何层 (最内层)
❌ Platform → UI (反向依赖)
❌ Platform → Application (反向依赖)
```

### 依赖倒置

对于需要跨层通信的场景，使用 **依赖倒置原则 (DIP)**:

```javascript
// Domain Layer 定义接口
// src/domain/repositories/scenic-repository.js
export const ScenicRepositoryInterface = {
  getById: async (id) => {},
  getList: async (params) => {}
};

// API Layer 实现接口
// src/api/scenic-repository-impl.js
import { scenicApi } from './scenic-api';

export class ScenicRepositoryImpl {
  async getById(id) {
    return scenicApi.getDetail(id);
  }
  
  async getList(params) {
    return scenicApi.getList(params);
  }
}

// Application Layer 使用接口
// src/application/services/scenic-service.js
import { scenicRepository } from '@domain/repositories/scenic-repository';

export class ScenicService {
  async loadScenic(id) {
    return scenicRepository.getById(id);
  }
}
```

---

## 🎯 架构决策

### 为什么选择分层架构？

**优点**:
1. **清晰的职责划分**: 每层有明确的职责
2. **易于测试**: 各层可独立测试
3. **易于维护**: 修改影响范围可控
4. **技术无关**: 业务逻辑不依赖具体技术

**权衡**:
1. **代码量增加**: 需要定义更多文件和接口
2. **学习曲线**: 新成员需要理解架构
3. **过度设计风险**: 简单功能可能过于复杂

### 为什么不使用 MVVM？

**考虑因素**:
1. 项目使用原生 JavaScript，无框架绑定
2. 分层架构更灵活，适合渐进式改造
3. 现有代码结构更接近分层架构

### 为什么保留 Legacy 层？

**原因**:
1. **渐进式改造**: 允许新旧代码并存
2. **降低风险**: 逐步迁移，避免一次性重构
3. **业务连续**: 保证业务不中断

---

## 📊 架构指标

### 代码分布

| 层级 | 目录 | 文件数 | 行数 | 占比 |
|------|------|--------|------|------|
| UI | src/ui/ | ~20 | ~3000 | 25% |
| Application | src/application/ | ~15 | ~2000 | 17% |
| Domain | src/domain/ | ~10 | ~1500 | 13% |
| Core | src/core/ | ~12 | ~2000 | 17% |
| Platform | src/platform/ | ~8 | ~1500 | 13% |
| API | src/api/ | ~5 | ~1000 | 8% |
| Legacy | src/legacy/ | ~30 | ~800 | 7% |

### 依赖健康度

- **循环依赖**: 0 (✅ 优秀)
- **跨层依赖**: 0 (✅ 优秀)
- **反向依赖**: 0 (✅ 优秀)
- **测试覆盖率**: ~60% (⚠️ 需提升)

---

## 🔮 架构演进

### 当前阶段 (Phase 2)

- ✅ 分层架构建立
- ✅ 核心层迁移完成
- ✅ 代码现代化改造完成
- ⏳ 业务层逐步迁移

### 下一阶段 (Phase 3)

- 性能优化实施
- 代码分割优化
- 懒加载实现
- 测试覆盖率提升

### 未来规划

1. **TypeScript 迁移**: 提升类型安全
2. **组件库引入**: 提升开发效率
3. **微前端探索**: 支持多团队协作
4. **SSR/SSG**: 提升首屏性能

---

## 📚 参考资料

### 架构模式

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design - Eric Evans](https://domainlanguage.com/ddd/)
- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)

### JavaScript 架构

- [JavaScript Application Design](https://www.manning.com/books/javascript-application-design)
- [Pro JavaScript Design Patterns](https://www.apress.com/gp/book/9781590599082)

### 相关文档

- [开发者文档](./DEVELOPER_GUIDE.md)
- [性能优化报告](../PERFORMANCE_OPTIMIZATION_REPORT.md)
- [重构设计文档](../REFACTORING_DIRECTORY_DESIGN.md)

---

**维护者**: 大希团队  
**最后更新**: 2026-03-01
