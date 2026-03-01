# 大希地图迁移清单

**生成日期**: 2026-03-01  
**详细报告**: `LEGACY_ANALYSIS.md`

---

## 📋 功能清单 (31 项)

### P0 - 核心功能 (9 项)

| # | 功能 | 文件 | 状态 |
|---|------|------|------|
| 1 | 应用启动框架 | bootstrap-loader.js, app-init.js | ⬜ 待迁移 |
| 2 | 地图视图核心 | daxiapp.mapView.js | ⬜ 待迁移 |
| 3 | 状态管理器 | daxiapp.stateMgr.js | ⬜ 待迁移 |
| 4 | 配置服务 | runtime-config.js, daxiapp.api.js | ⬜ 待迁移 |
| 5 | 桥接服务 | daxiapp.jsbridge.js | ⬜ 待迁移 |
| 6 | 首页 | daxiapp.page.home.js | ⬜ 待迁移 |
| 7 | 地图浏览 | daxiapp.page.mapStateBrowse.js | ⬜ 待迁移 |
| 8 | POI 展示 | daxiapp.page.mapStatePoi.js | ⬜ 待迁移 |
| 9 | POI 数据服务 | daxiapp.api.js | ⬜ 待迁移 |

### P1 - 重要功能 (8 项)

| # | 功能 | 文件 | 状态 |
|---|------|------|------|
| 10 | POI 详情 | daxiapp.page.mapStatePoiDetail.js | ⬜ 待迁移 |
| 11 | 搜索功能 | daxiapp.page.mapStateSearchPage.js | ⬜ 待迁移 |
| 12 | 路线规划 | daxiapp.page.mapStateRoute_new.js | ⬜ 待迁移 |
| 13 | 路线服务 | daximap.routes.js | ⬜ 待迁移 |
| 14 | 实时导航 | daxiapp.page.mapStateNavi.js | ⬜ 待迁移 |
| 15 | 导航服务 | daximap.naviManager.js | ⬜ 待迁移 |
| 16 | 服务页 | daxiapp.page.service.js | ⬜ 待迁移 |
| 17 | 个人中心 | daxiapp.page.profile.js | ⬜ 待迁移 |

### P2 - 扩展功能 (9 项)

| # | 功能 | 文件 | 状态 |
|---|------|------|------|
| 18 | 模拟导航 | daxiapp.page.mapStateSimulateNavi.js | ⬜ 待迁移 |
| 19 | 点位选择 | daxiapp.page.mapStateSelectPoint.js | ⬜ 待迁移 |
| 20 | 修改起终点 | daxiapp.page.mapStateChangeStartEndPoint.js | ⬜ 待迁移 |
| 21 | 位置分享 | daxiapp.page.mapStateSharePos.js | ⬜ 待迁移 |
| 22 | 展览路线 | daxiapp.page.exhibitionRoute.js | ⬜ 待迁移 |
| 23 | 参观导航 | daxiapp.page.visitNavi.js | ⬜ 待迁移 |
| 24 | 语音输入 | daxiapp.page.voiceListener.js | ⬜ 待迁移 |
| 25 | 支付功能 | daxiapp.page.payPage.js, payResultPage.js | ⬜ 待迁移 |
| 26 | 收藏功能 | daxiapp.page.favorite.js | ⬜ 待迁移 |

### P3 - 边缘功能 (5 项)

| # | 功能 | 文件 | 状态 |
|---|------|------|------|
| 27 | 创建群组 | daxiapp.page.mapStateCreateShareGroup.js | ⬜ 待迁移 |
| 28 | 群组分享 | daxiapp.page.mapStateGroupShare.js | ⬜ 待迁移 |
| 29 | 建筑列表 | daxiapp.page.mapStateBulldingList.js | ⬜ 待迁移 |
| 30 | 关于页面 | daxiapp.page.aboutPage.js | ⬜ 待迁移 |
| 31 | 自动播放 | daxiapp.page.mapStateAutoPlayExhibit.js | ⬜ 待迁移 |

---

## 🎯 迁移优先级

### 阶段一：核心基础 (40% 工作量)

**目标**: 能跑起来，能看地图，能显示 POI

```
✅ 1. 搭建新框架 (Vue3/React + TypeScript + Vite)
✅ 2. 实现应用启动和初始化
✅ 3. 集成地图 SDK
✅ 4. 实现状态管理系统
✅ 5. 实现配置和桥接服务
✅ 6. 实现首页和地图浏览
✅ 7. 实现 POI 数据加载和展示
```

**验收标准**:
- [ ] 地图正常加载
- [ ] POI 标记显示
- [ ] 点击 POI 显示详情
- [ ] 基础导航可用

### 阶段二：关键功能 (35% 工作量)

**目标**: 核心用户体验完整

```
✅ 8. 搜索功能 (关键词、语音、历史、热搜)
✅ 9. 路线规划 (室内/室外、多策略)
✅ 10. 实时导航 (语音播报、路径跟随)
✅ 11. 服务页和个人中心
```

**验收标准**:
- [ ] 搜索准确快速
- [ ] 路线规划合理
- [ ] 导航语音清晰
- [ ] 用户信息正常

### 阶段三：扩展功能 (20% 工作量)

**目标**: 增值功能完善

```
✅ 12. 模拟导航
✅ 13. 位置分享
✅ 14. 展览路线
✅ 15. 参观导航
✅ 16. 支付功能
```

**验收标准**:
- [ ] 分享功能正常
- [ ] 支付流程完整
- [ ] 特色功能可用

### 阶段四：边缘功能 (5% 工作量)

**目标**: 锦上添花

```
✅ 17. 群组功能
✅ 18. 建筑列表
✅ 19. 关于页面
✅ 20. 自动播放
```

**验收标准**:
- [ ] 功能完整
- [ ] 可裁剪不影响核心

---

## 📊 工作量估算

| 阶段 | 功能数 | 工作量 | 时间 (人天) | 累计时间 |
|------|--------|--------|-------------|----------|
| 阶段一 | 9 | 40% | 20-25 | 20-25 |
| 阶段二 | 8 | 35% | 15-20 | 35-45 |
| 阶段三 | 9 | 20% | 10-15 | 45-60 |
| 阶段四 | 5 | 5% | 3-5 | 48-65 |
| **总计** | **31** | **100%** | **48-65** | **-** |

---

## 🔑 关键技术点

### 必须保留的
- ✅ DaxiMap SDK (地图引擎)
- ✅ JSBridge 通信机制
- ✅ WebSocket 实时通信
- ✅ 离线地图数据格式

### 必须改进的
- ❌ 全局变量 → 模块化
- ❌ 回调嵌套 → Promise/async-await
- ❌ 无类型 → TypeScript
- ❌ 无构建 → Vite/Webpack
- ❌ 无测试 → Jest + E2E

### 可以裁剪的
- ⚪ 群组功能 (低频)
- ⚪ 自动播放 (低频)
- ⚪ 旧版兼容代码

---

## 📁 文件映射

### 旧版 → 新版 (建议)

```
旧版文件                          新版位置
─────────────────────────────────────────────────
js/bootstrap-loader.js         →  src/main.tsx
js/app-init.js                 →  src/app/init.ts
js/daxiapp.mapView.js          →  src/features/map/MapView.tsx
js/daxiapp.page.command.js     →  src/app/command-bus.ts
js/daxiapp.api.js              →  src/services/api.ts
js/dxapi.app.js                →  src/app/create-app.ts
js/daxiapp.page.mapState*.js   →  src/features/pages/*.tsx
utils/daxiapp.stateMgr.js      →  src/store/index.ts
utils/daxiapp.utils.js         →  src/utils/index.ts
components/*.js                →  src/components/*.tsx
css/*.css                      →  src/styles/*.scss
```

---

## ✅ 迁移检查清单

### 技术准备
- [ ] 新框架选型确定
- [ ] 开发环境搭建
- [ ] 代码规范配置
- [ ] CI/CD 流程配置

### 功能迁移
- [ ] P0 功能全部迁移
- [ ] P1 功能全部迁移
- [ ] P2 功能全部迁移
- [ ] P3 功能按需迁移

### 质量保障
- [ ] 单元测试覆盖 > 70%
- [ ] E2E 测试覆盖核心流程
- [ ] 性能测试达标
- [ ] 兼容性测试通过

### 上线准备
- [ ] 灰度发布方案
- [ ] 回滚方案
- [ ] 监控告警配置
- [ ] 用户文档更新

---

**备注**: 此清单为动态文档，迁移过程中可根据实际情况调整优先级和工作量估算。
