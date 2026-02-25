# JSBRIDGE 模块

**生成时间:** 2026-02-02

## 概述
基于 Cordova 的原生桥接，用于 iOS/Android 与 H5 应用通信。

## 结构
```
jsbridge/
├── daxiapp.jsbridge.js   # 主桥接（67KB）
├── android.back/         # Android 备份
│   └── cordova.js        # Cordova Android
└── ios.back/             # iOS 备份
    └── cordova.js        # Cordova iOS
```

## 快速查找
| 任务 | 位置 | 说明 |
|------|------|------|
| 桥接 API | `daxiapp.jsbridge.js` | 所有桥接方法 |
| Android 原生 | `android.back/cordova.js` | 平台特定 |
| iOS 原生 | `ios.back/cordova.js` | 平台特定 |

## 核心 API (daxiapp.jsbridge.js)

### 事件系统
```javascript
// 注册事件处理器
daxiapp.eventHandler.register("eventName", callback);

// 触发事件
daxiapp.eventHandler.trigger("eventName", data);
```

### 页面管理
```javascript
// 推入导航栈
daxiapp.pageManager.pushPage(pageConfig);

// 弹出栈
daxiapp.pageManager.popPage();

// 获取当前页面
daxiapp.pageManager.getCurrentPage();
```

### 原生调用
```javascript
// 调用原生方法
daxiapp.callHandler("methodName", params, callback);

// 示例：获取位置
daxiapp.callHandler("getLocation", {}, function(loc) {
  console.log(loc.lat, loc.lng);
});
```

### 平台检测
```javascript
daxiapp.deviceType.isMobile    // Android/iOS
daxiapp.deviceType.isIos       // 仅 iOS
daxiapp.deviceType.isAndroid   // 仅 Android
daxiapp.deviceType.isWeiXin    // 微信浏览器
```

## 常用方法

| 方法 | 参数 | 回调 | 用途 |
|------|------|------|------|
| `getLocation` | {} | (lat, lng) | 获取 GPS 位置 |
| `scanQRCode` | {} | (result) | 扫描二维码 |
| `share` | {title, url} | (success) | 原生分享对话框 |
| `setNavigationBar` | {title, color} | - | 更新导航栏 |
| `openWebView` | {url} | - | 打开应用内浏览器 |
| `closeWebView` | - | - | 关闭当前 webview |

## 通信流程

### H5 → 原生
```javascript
// 在 H5 页面中
daxiapp.callHandler("methodName", params, function(response) {
  // 处理原生响应
});
```

### 原生 → H5
```javascript
// 原生触发 JS 事件
// 在 H5 中，注册处理器：
daxiapp.eventHandler.register("nativeEvent", function(data) {
  // 处理原生事件
});
```

## CORDOVA 集成

### 平台文件
- **Android**: `android.back/cordova.js`
- **iOS**: `ios.back/cordova.js`

### Cordova 就绪模式
```javascript
document.addEventListener('deviceready', function() {
  // Cordova 已加载，可安全调用桥接
  daxiapp.callHandler("...");
}, false);
```

## 错误处理

### 回调模式
```javascript
daxiapp.callHandler("method", params,
  function(success) { /* 成功 */ },
  function(error) { /* 错误 */ }
);
```

### 平台检查
```javascript
if (daxiapp.deviceType.isIos) {
  // iOS 特定代码
} else if (daxiapp.deviceType.isAndroid) {
  // Android 特定代码
}
```

## 规范
- 调用桥接前始终检查 `deviceready`
- 使用回调处理异步操作
- 使用平台特定功能前检查平台
- 在第二个回调参数中处理错误

## 反模式
- ❌ 在 `deviceready` 之前调用桥接（将失败）
- ❌ 不处理平台差异（iOS vs Android）
- ❌ 忘记注销事件处理器（内存泄漏）
- ❌ 为必需参数传递 null/undefined
