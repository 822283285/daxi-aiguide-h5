# MAP UI CONTAINER 模块

**生成时间:** 2026-02-02

## 概述
基于 iframe 的多页面容器外壳，加载 4 个独立页面。

## 结构
```
map-ui-container/
├── index.html              # 主容器（62 行，4 个 iframe）
├── home.html               # 首页
├── service.html            # 服务页
├── more.html               # 更多/设置页
├── assets/
│   ├── css/                # 样式（base.css, tabbar.css, page-switcher.css）
│   └── js/
│       ├── utils.js        # getQueryParam，URL 辅助函数
│       ├── app-config.js   # 页面/底部导航注册表
│       ├── socketUtils.js  # WebSocket 通信
│       ├── tabbar.js       # 底部导航
│       ├── page-switcher.js # Iframe 可见性管理器
│       └── home/           # 首页脚本
└── lib/
    └── uni.webview.1.5.6.js # Uni-app webview 库
```

## 快速查找
| 任务 | 位置 | 说明 |
|------|------|------|
| 主入口 | `index.html` | 加载 4 个 iframe，默认显示地图 |
| 配置 | `assets/js/app-config.js` | 5 个页面注册表（首页、地图、讲解、服务、更多） |
| URL 参数 | `assets/js/utils.js` | `getQueryParam()` 辅助函数 |
| 底部导航 | `assets/js/tabbar.js` | 底部导航（4 个标签） |
| 页面切换器 | `assets/js/page-switcher.js` | 显示/隐藏 iframe |
| Socket 工具 | `assets/js/socketUtils.js` | WebSocket 到 H5 通信 |

## IFRAME 架构

### 容器布局
```
index.html（主外壳）
├── iframe-home（默认隐藏）
├── iframe-map（默认可见）
│   └── src: "../app/navi_app/shouxihu/index_src.html"
├── iframe-service（默认隐藏）
└── iframe-more（默认隐藏）
```

### 页面切换机制
1. 用户点击底部导航按钮
2. `tabbar.js` 调用 `pageSwitcher.showPage("map")`
3. `page-switcher.js` 设置 iframe 透明度：
   - 目标: `opacity: 1; pointer-events: auto`
   - 其他: `opacity: 0; pointer-events: none`
4. 高亮活动标签

### URL 参数传播
所有 URL 参数通过 `page-switcher.js` 传递到 iframe：
```javascript
const params = new URLSearchParams(window.location.search);
iframe.src = originalSrc + "?" + params.toString();
```

## 配置 (app-config.js)

### 页面注册表
```javascript
const APP_CONFIG = [
  { id: 1, key: "home", name: "首页", ... },
  { id: 2, key: "map", name: "地图", ... }, // 默认活动
  { id: 3, key: "lecture", name: "讲解", ... },
  { id: 4, key: "service", name: "服务", ... },
  { id: 5, key: "more", name: "更多", ... }
];
```

### 关键函数
- `getAppConfig()` - 获取所有页面
- `getConfigById(id)` - 获取单个页面
- `getTabbarConfig()` - 仅获取底部导航页面
- `getPageConfig()` - 获取 iframe 映射

## 通信模式

### 父容器 → Iframe (URL 参数)
```javascript
// 在 index.html 中
iframe.src = "../app/navi_app/shouxihu/index_src.html?token=...&buildingId=..."
```

### Iframe → 父容器 (window.parent)
```javascript
// 在 shouxihu/index_src.html 中
const dataPath = window.parent?.commonUtils?.getBaseUrl?.();
```

### Iframe ↔ Uni-app (WebSocket)
```javascript
// 在 socketUtils.js 中
window.parent.ws.send(JSON.stringify({
  type: "postEventToMiniProgram",
  methodToMiniProgram: "navigateTo=/pages/detail",
  ...
}));
```

## URL 参数
所有参数从容器流向 iframe：

| 参数 | 使用者 | 用途 |
|-------|---------|------|
| token | 地图 SDK | API 认证 |
| buildingId | 地图 SDK | 景区 ID |
| userId | Socket | 用户标识 |
| appId | Socket | 微信应用 ID |
| device | Socket | 设备信息 |
| testLocWs | 定位 | WebSocket 定位模式 |
| disabledH5Location | 定位 | 禁用 GPS |
| wsIndex | Socket | WebSocket 连接索引 |
| sendLocType | 定位 | 位置源类型 |

## 样式
- 底部导航: 固定底部，4-5 个标签
- Iframe: 全视口，通过 `z-index` 堆叠
- 过渡: 透明度淡入淡出（无滑动）
- 活动状态: 图标颜色变化

## 规范
- 始终先加载地图页（`page-iframe-active` 类）
- 将所有 URL 参数传递给 iframe（不过滤）
- 使用 `window.parent.commonUtils` 进行跨帧访问
- 底部导航图标: HTTPS URL（CDN 托管）

## 反模式
- ❌ 直接操作 iframe（使用 `pageSwitcher.showPage()`）
- ❌ 硬编码 URL（使用 `commonUtils.getScenicUrl()`）
- ❌ 中断 URL 参数链（始终传播）
