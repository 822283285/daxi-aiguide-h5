# 大希地图 map_sdk 加载问题分析报告

**分析时间**: 2026-03-01  
**分析人**: 小猫 (AI Assistant)

---

## 📊 测试结果

### 使用正确参数的测试

**测试 URL**:

```
https://html.qkbyte.cn/daxi/?token=806bc162812065750b3d3958f9056008&buildingId=S10000008&userId=ot5qm6-uO9a_wfMf_fkRab5q3pgw&testLocWs=true&appId=wxd006a15115585c6&device=SW_android_HUAWEI_NAM-AL00&disabledH5Location=true&wsIndex=0&sendLocType=hash
```

**测试结果**: ❌ 失败

**主要错误**:

1. `SyntaxError: Unexpected token 'export'` - daximap.utils.js 使用了 ES6 export 语法
2. `ReferenceError: DaxiMap is not defined` - daximap-core.js 引用未定义的 DaxiMap
3. `ReferenceError: global is not defined` - daximap.api.js 使用了 Node.js 的 global 对象
4. `SyntaxError: Identifier 'thisObject' has already been declared` - 变量重复声明
5. `TypeError: Cannot read properties of undefined (reading 'domUtil')` - 依赖加载顺序问题

**页面状态**:

- ✅ 页面可以加载
- ✅ runtimeConfig 存在
- ❌ DaxiApp 未定义
- ❌ #app 容器为空（地图未渲染）
- ⚠️ 多个 JavaScript 错误导致应用无法初始化

---

## 🔍 旧版 map_sdk 加载方式分析

### 旧版加载流程（shouxihu 项目）

**1. 入口文件**: `app/navi_app/shouxihu/index_src.html`

```html
<script src="./js/bootstrap-loader.js"></script>
```

**2. 加载器**: `bootstrap-loader.js`

采用**分组串行加载**策略，按顺序加载：

```javascript
const scriptGroups = [
  {
    name: "preload",
    files: ["./utils/getParam.js", "./js/runtime-config.js"],
  },
  {
    name: "vendor",
    files: [
      "../libs/swiper/swiper-bundle.min.js",
      "../libs/jweixin-1.6.js",
      "../libs/zepto.min.js",
      // ... 其他第三方库
    ],
  },
  {
    name: "map_sdk",
    files: [
      "../../../map_sdk/map/daximap.utils.js",
      "../../../map_sdk/map/scene/daximap.visitor.js",
      "../../../map_sdk/map/scene/daximap.core.js",
      "../../../map_sdk/map/scene/daximap.indoor.js",
      "../../../map_sdk/map/scene/daximap.outdoor.js",
      "../../../map_sdk/map/scene/daximap.layers.js",
      "../../../map_sdk/map/daximap.scene.js",
      "../../../map_sdk/map/daximap.api.js",
      "../../../map_sdk/map/daximap.control.js",
      "../../../map_sdk/map/daximap.location.js",
      "../../../map_sdk/map/daximap.speak.js",
      "../../../map_sdk/map/daximap.navi.js",
      "../../../map_sdk/map/daximap.routes.js",
      "../../../map_sdk/map/daximap.naviManager.js",
    ],
  },
  {
    name: "daxi_runtime",
    files: [
      "./utils/environment.js",
      // ... 应用代码
    ],
  },
];
```

**3. 加载特点**:

- ✅ **串行加载**: 每组内文件按顺序加载，前一个加载完才加载下一个
- ✅ **分组隔离**: 不同组之间有明显界限
- ✅ **重试机制**: 失败自动重试 2 次
- ✅ **超时控制**: 单个脚本 10 秒超时，全局 45 秒超时
- ✅ **错误处理**: 失败时显示友好提示
- ✅ **状态追踪**: `window.__daxiBootstrapStatus` 记录加载状态

**4. 关键发现**:

- 旧版**没有** `daximap-core.js` 这个文件
- map_sdk 从 `daximap.utils.js` 开始加载
- **没有使用 ES6 module**，全部是传统 script 标签加载

---

## 🆚 新旧版本对比

### 新版本（Vite 构建）

**入口文件**: `dist/index.html`

```html
<!-- Map SDK (必须在应用初始化前加载) -->
<script src="./map_sdk/map/daximap.utils.js"></script>
<script src="./map_sdk/map/daximap-core.js"></script>
<script src="./map_sdk/map/daximap.api.js"></script>
<script src="./map_sdk/map/daximap.scene.js"></script>
<script src="./map_sdk/map/daximap.control.js"></script>
<!-- ... 其他 SDK 文件 -->

<script type="module" crossorigin src="/daxi/assets/main.XLbnqzcP.js"></script>
```

**问题**:

1. ❌ **daximap-core.js 是新增文件**，旧版没有
2. ❌ **daximap.utils.js 使用了 ES6 export**，但用普通 script 标签加载
3. ❌ **daximap.api.js 使用了 `global` 对象**（Node.js 环境），浏览器中应该是 `window`
4. ❌ **加载顺序可能不正确**，某些依赖可能未定义
5. ❌ **没有使用 bootstrap-loader 的可靠加载机制**

### 旧版本（传统加载）

**优点**:

- ✅ 稳定可靠的加载机制
- ✅ 完整的错误处理和重试
- ✅ 经过生产环境验证
- ✅ 没有 ES6 module 兼容性问题

**缺点**:

- ❌ 加载速度较慢（串行）
- ❌ 代码不够现代化

---

## 🐛 核心问题定位

### 问题 1: daximap.utils.js 使用 ES6 export

**文件**: `map_sdk/map/daximap.utils.js`

```javascript
// 第 52 行
export { Class };
```

**问题**: 使用普通 `<script>` 标签加载，但包含 ES6 `export` 语法

**解决方案**:

- 方案 A: 移除 `export`，改为挂载到 `window`
- 方案 B: 将 `<script>` 改为 `<script type="module">`

### 问题 2: daximap-core.js 引用未定义的 DaxiMap

**文件**: `map_sdk/map/daximap-core.js`

```javascript
// 第 10 行
if (typeof window !== "undefined") {
  window.DaxiMap = DaxiMap; // ❌ DaxiMap 未定义
}
```

**问题**: 文件试图导出 `DaxiMap`，但 `DaxiMap` 在这个文件中没有定义

**解决方案**:

- 这个文件可能是多余的，旧版没有这个文件
- 或者需要正确定义 `DaxiMap` 对象

### 问题 3: daximap.api.js 使用 Node.js 的 global

**文件**: `map_sdk/map/daximap.api.js`

```javascript
// 第 10 行
const daximap = (global.DaxiMap = global.DaxiMap || {});
```

**问题**: `global` 是 Node.js 环境对象，浏览器中应该是 `window`

**解决方案**:

```javascript
const daximap = (window.DaxiMap = window.DaxiMap || {});
```

### 问题 4: 加载顺序问题

旧版加载顺序：

1. daximap.utils.js
2. daximap.visitor.js (scene/)
3. daximap.core.js (scene/) ← 注意：这是 scene 目录下的
4. daximap.indoor.js (scene/)
5. daximap.outdoor.js (scene/)
6. daximap.layers.js (scene/)
7. daximap.scene.js
8. daximap.api.js
9. ...

新版加载顺序：

1. daximap.utils.js
2. daximap-core.js ← ❌ 这是新的根目录文件，不是 scene/ 下的
3. daximap.api.js ← ❌ 太早了，依赖的 scene 模块还没加载
4. daximap.scene.js
5. ...

---

## ✅ 修复方案

### 方案 A: 恢复旧版加载方式（推荐）

**步骤**:

1. **移除有问题的 daximap-core.js**

   ```bash
   rm dist/map_sdk/map/daximap-core.js
   ```

2. **修改 dist/index.html，使用旧版加载顺序**

   ```html
   <!-- Map SDK (按旧版顺序加载) -->
   <script src="./map_sdk/map/daximap.utils.js"></script>
   <script src="./map_sdk/map/scene/daximap.visitor.js"></script>
   <script src="./map_sdk/map/scene/daximap.core.js"></script>
   <script src="./map_sdk/map/scene/daximap.indoor.js"></script>
   <script src="./map_sdk/map/scene/daximap.outdoor.js"></script>
   <script src="./map_sdk/map/scene/daximap.layers.js"></script>
   <script src="./map_sdk/map/daximap.scene.js"></script>
   <script src="./map_sdk/map/daximap.api.js"></script>
   <script src="./map_sdk/map/daximap.control.js"></script>
   <script src="./map_sdk/map/daximap.location.js"></script>
   <script src="./map_sdk/map/daximap.speak.js"></script>
   <script src="./map_sdk/map/daximap.navi.js"></script>
   <script src="./map_sdk/map/daximap.routes.js"></script>
   <script src="./map_sdk/map/daximap.naviManager.js"></script>
   ```

3. **修复 daximap.api.js 的 global 问题**

   ```javascript
   // 将 global 改为 window
   const daximap = (window.DaxiMap = window.DaxiMap || {});
   ```

4. **修复 daximap.utils.js 的 export 问题**
   ```javascript
   // 移除 export { Class };
   // 改为：
   window.DaxiMap = window.DaxiMap || {};
   window.DaxiMap.Class = Class;
   ```

### 方案 B: 使用 bootstrap-loader

将旧版的 `bootstrap-loader.js` 复制到 `dist/` 目录，并在 `index.html` 中引用：

```html
<script src="./js/bootstrap-loader.js"></script>
```

然后复制 `bootstrap-loader.js` 并调整路径。

### 方案 C: 使用 ES6 Module 方式

将所有 map_sdk 文件改为 ES6 module，使用 `type="module"` 加载。但这需要大量修改 SDK 代码。

---

## 📝 建议

**推荐方案 A**，原因：

1. 最小改动，风险最低
2. 旧版已经过生产验证
3. 保持向后兼容
4. 可以快速修复问题

**长期建议**:

- 考虑将 map_sdk 打包成 npm 包
- 使用现代化的模块系统（ES6 modules）
- 添加单元测试确保 SDK 正常工作

---

## 📎 附录

### 测试报告文件位置

```
/home/ubuntu/.openclaw/workspace/code/daxi-aiguide-h5/test-screenshots/report-2026-03-01T07-19-07-752Z.json
```

### 截图文件位置

```
/home/ubuntu/.openclaw/workspace/code/daxi-aiguide-h5/test-screenshots/screenshot-2026-03-01T07-19-07-752Z.png
/home/ubuntu/.openclaw/workspace/code/daxi-aiguide-h5/test-screenshots/screenshot-2026-03-01T07-19-07-752Z-3s.png
```

### 旧版加载器位置

```
/home/ubuntu/.openclaw/workspace/code/daxi-aiguide-h5/app/navi_app/shouxihu/js/bootstrap-loader.js
```
