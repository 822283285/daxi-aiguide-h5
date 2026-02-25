# NAVI_APP 模块

**生成时间:** 2026-02-02

## 概述
主导航应用，包含 DaxiApp 组件系统和 20 个页面状态。

## 结构
```
app/navi_app/
├── components/          # UI 组件系统 (DXBaseComponent 继承)
├── libs/               # 第三方库 (30+ 个文件, 无 package.json)
├── utils/              # 工具、缓存、DOM 辅助、AR 导航
└── shouxihu/           # 瘦西湖景点实现
    ├── js/             # 页面状态实现 (20 个状态)
    ├── pages/          # HTML 页面模板
    ├── extend_guobo/   # 扩展功能
    └── utils/          # 本地工具 (getParam.js, environment.js)
```

## 快速查找
| 任务 | 位置 | 说明 |
|------|------|------|
| 应用入口 | `shouxihu/index_src.html` | 加载 20+ 个脚本，初始化 DxApp |
| 组件基类 | `components/daxiapp.basecomponent.js` | 所有组件继承此类 |
| 应用启动 | `shouxihu/js/dxapi.app.js` | DxApp.init() 入口点 |
| 页面状态 | `shouxihu/js/dxapi.app.js` | 20 个注册状态 |
| API 层 | `shouxihu/js/daxiapp.api.js` | 服务器通信 |
| 工具 | `utils/daxiapp.utils.js` | 通用辅助函数 |
| 缓存 | `utils/daxiapp.cache.js` | localStorage 封装 |
| AR 导航 | `utils/AR/ARNavigation.js` | 基于 Three.js 的 AR |

## 核心模块

### 组件 (DaxiApp 命名空间)
- `daxiapp.component.js` - 组件注册系统
- `daxiapp.basecomponent.js` - 带生命周期方法的基类
- 模式: `DXSubClass = DXBaseComponent.extend({...})`

### 页面状态 (shouxihu/js/)
**核心状态:**
- `daxiapp.page.index.js` - 主索引页
- `daxiapp.page.home.js` - 首页
- `daxiapp.page.mapStateBrowse.js` - 地图浏览状态
- `daxiapp.page.mapStateRoute.js` - 导航路线状态
- `daxiapp.page.mapStateNavi.js` - 活跃导航

**扩展状态 (extend_guobo/):**
- `daxiapp.page.mapStateBrowse.js` - 扩展浏览
- `daxiapp.page.exhibitionRoute.js` - 展览路线
- `daxiapp.page.poiDetail.js` - POI 详情

### 工具
- `daxiapp.cache.js` - localStorage 封装
- `daxiapp.dom.js` - DOM 操作辅助
- `daxiapp.stateMgr.js` - 状态管理
- `ARNavigation.js` - AR 功能 (Three.js)

### 第三方库 (libs/)
- swiper, zepto, handlebars, crypto-js, md5, jweixin
- Three.js (3D 渲染)
- QRCode 生成器
- Mapbox GL 集成

## 规范
- 使用 `DaxiApp.namespace` 创建新模块
- 组件继承 `DXBaseComponent`
- 在 `dxapi.app.js` 中注册页面状态
- 全程使用中文注释
- 通过 `getParam()` 解析 URL 参数 (utils/getParam.js)

## 反模式
- `utils/AR/` 中有重复库 - 应使用 libs/
- 页面状态文件过大（>500 行）- 考虑拆分
