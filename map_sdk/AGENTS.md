# MAP SDK 模块

**生成时间:** 2026-02-02

## 概述
基于 Mapbox GL 构建的自定义 36K 行代码地图渲染引擎，支持室内导航。

## 结构
```
map_sdk/
├── map/                    # 渲染引擎
│   ├── daximap.api.js      # 公共 API (地图初始化)
│   ├── daximap.scene.js    # 场景管理 (12,398 行！)
│   ├── daximap.control.js  # 用户控制
│   ├── daximap.location.js # 位置标记
│   ├── daximap.navi.js     # 导航逻辑
│   ├── daximap.routes.js   # 路线渲染
│   ├── daximap.speak.js    # 语音引导
│   ├── daximap.utils.js    # 工具 + Class.extend OOP
│   ├── daximap.downloader.js # 资源加载
│   ├── daximap.naviManager.js # 导航状态机
│   ├── daximap.pluginManager.js # 插件系统
│   ├── mapbox/            # 多个 Mapbox GL 版本 (2.15.0, 3.5.1, 3.9.1)
│   └── sdk/               # 引擎封装
└── location/
    └── wx.loc.js          # GPS/BLE/WebSocket 定位
```

## 快速查找
| 任务 | 位置 | 说明 |
|------|------|------|
| 地图初始化 | `daximap.api.js` | `DaxiMap.init()` |
| 场景设置 | `daximap.scene.js` | 相机、图层、源 |
| 导航 | `daximap.navi.js` | 路线计算 |
| 定位 | `wx.loc.js` | 多源定位融合 |
| 工具 | `daximap.utils.js` | `Class.extend()` OOP 系统 |

## 核心模块（8 个文件）

### 1. daximap.api.js
**用途:** 公共 API，地图初始化
**主要导出:** `DaxiMap.init()`，版本常量
**用法:**
```javascript
var map = new DaxiMap.init({
  container: "app",
  token: "...",
  buildingId: "...",
  ...
});
```

### 2. daximap.scene.js
**用途:** 场景图管理（巨型 - 12,398 行）
**职责:**
- 相机控制
- 图层管理
- 源管理
- 3D 模型渲染
- ⚠️ **应该拆分为更小的模块**

### 3. daximap.control.js
**用途:** 用户交互控制
**功能:** 缩放、旋转、平移、点击处理

### 4. daximap.location.js
**用途:** 用户位置标记
**功能:**
- 方向箭头
- 精度圆
- 多种标记样式

### 5. daximap.navi.js
**用途:** 导航路线计算
**功能:**
- 路径规划
- 路线吸附
- 逐向引导

### 6. daximap.routes.js
**用途:** 路线渲染
**功能:**
- 路线
- 交通可视化
- 路线样式

### 7. daximap.speak.js
**用途:** 语音引导
**功能:** 导航指令的 TTS

### 8. daximap.utils.js
**用途:** 工具 + OOP 系统
**主要导出:**
- `Class.extend()` - 自定义继承
- 辅助函数

## 定位模块 (location/wx.loc.js)

**多源定位:**
- GPS (H5 Geolocation API)
- BLE 信标
- WebSocket (测试模式)
- 手动 (URL hash)

**通过 URL 参数配置:**
- `testLocWs=true` - 启用 WebSocket 定位
- `disabledH5Location=true` - 禁用 GPS
- `sendLocType=h5|wss|hash` - 位置源

## API 模式

### 初始化
```javascript
var map = DaxiMap.init({
  container: "app",
  token: getParam("token"),
  buildingId: getParam("buildingId"),
  onLoad: function() { /* 就绪 */ }
});
```

### 导航
```javascript
map.startNavigation(startPoint, endPoint, {
  routeType: "shortest",  // shortest | recommended
  naviMode: "walk"        // walk | drive
});
```

### 位置更新
```javascript
map.on("locationUpdate", function(loc) {
  console.log(loc.lat, loc.lng, loc.heading);
});
```

## 规范
- 始终先调用 `DaxiMap.init()`
- 等待 `onLoad` 完成后再使用地图 API
- 使用 buildingId 特定的 URL
- 室内坐标: 基于像素，非经纬度
- Mapbox 版本因建筑而异（检查配置）

## 反模式
- ❌ 直接编辑 daximap.scene.js（太大，脆弱）
- ❌ 同时使用多个 Mapbox 版本
- ❌ 硬编码 URL（使用 token/buildingId 模式）
