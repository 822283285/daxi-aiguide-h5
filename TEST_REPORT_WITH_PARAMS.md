# 大希地图测试报告 - 带 URL 参数

**测试时间**: 2026-03-01 15:25 GMT+8  
**测试人**: 小猫 (AI Assistant)

---

## ✅ 任务 1: 使用正确参数测试

### 测试 URL

```
https://html.qkbyte.cn/daxi/?token=806bc162812065750b3d3958f9056008
&buildingId=S10000008
&userId=ot5qm6-uO9a_wfMf_fkRab5q3pgw
&testLocWs=true
&appId=wxd006a15115585c6
&device=SW_android_HUAWEI_NAM-AL00
&disabledH5Location=true
&wsIndex=0
&sendLocType=hash
```

### 测试结果: ❌ 失败

**页面状态**:

- ✅ 页面可以加载
- ✅ 标题正确："大希智能导游"
- ✅ runtimeConfig 正确初始化
- ❌ 地图未渲染（#app 容器为空）
- ❌ DaxiApp 未定义
- ❌ 存在多个 JavaScript 错误

**控制台错误**:

```
1. SyntaxError: Unexpected token 'export'
   - 位置：daximap.utils.js
   - 原因：使用 ES6 export 语法但通过普通 <script> 标签加载

2. ReferenceError: DaxiMap is not defined
   - 位置：daximap-core.js:13
   - 原因：文件引用未定义的 DaxiMap 变量

3. ReferenceError: global is not defined
   - 位置：daximap.api.js:10
   - 原因：使用 Node.js 的 global 对象，浏览器中应该是 window

4. SyntaxError: Identifier 'thisObject' has already been declared
   - 原因：变量重复声明

5. TypeError: Cannot read properties of undefined (reading 'domUtil')
   - 位置：daximap.control.js:543
   - 原因：依赖加载顺序问题，daximap 未正确初始化

6. SyntaxError: Identifier 'daximap' has already been declared
   - 位置：daximap.routes.js
   - 原因：变量重复声明
```

**测试报告文件**:

```
/home/ubuntu/.openclaw/workspace/code/daxi-aiguide-h5/test-screenshots/report-2026-03-01T07-25-14-003Z.json
```

---

## ✅ 任务 2: 旧版 map_sdk 加载方式分析

### 旧版加载流程

**项目位置**: `app/navi_app/shouxihu/`

**入口文件**: `index_src.html`

```html
<script src="./js/bootstrap-loader.js"></script>
```

**加载器**: `bootstrap-loader.js`

采用**分组串行加载**策略：

```javascript
const scriptGroups = [
  { name: "preload", files: ["./utils/getParam.js", "./js/runtime-config.js"] },
  { name: "vendor", files: ["../libs/swiper/...", "../libs/jweixin-1.6.js", ...] },
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
    ]
  },
  { name: "daxi_runtime", files: [...] }
];
```

### 旧版加载特点

✅ **优点**:

1. **串行加载**: 每组内文件按顺序加载，确保依赖顺序
2. **分组隔离**: preload → vendor → map_sdk → daxi_runtime
3. **重试机制**: 失败自动重试 2 次
4. **超时控制**: 单个脚本 10 秒，全局 45 秒
5. **错误处理**: 失败时显示友好提示
6. **状态追踪**: `window.__daxiBootstrapStatus` 记录加载状态
7. **生产验证**: 已在 shouxihu 项目中稳定运行

### 关键发现

1. **旧版没有 `daximap-core.js`** - 这是新版新增的文件
2. **旧版先加载 scene 模块** - visitor.js, core.js, indoor.js 等
3. **旧版没有使用 ES6 module** - 全部是传统 script 标签
4. **旧版使用 window 对象** - 不是 Node.js 的 global

---

## ✅ 任务 3: 新旧版本对比

| 特性             | 旧版 (shouxihu)       | 新版 (Vite)     | 问题                |
| ---------------- | --------------------- | --------------- | ------------------- |
| 加载方式         | bootstrap-loader 串行 | script 标签并行 | ❌ 依赖顺序无法保证 |
| daximap-core.js  | 不存在                | 新增            | ❌ 文件有 bug       |
| daximap.utils.js | 无 export             | 有 ES6 export   | ❌ 语法不兼容       |
| daximap.api.js   | 使用 window           | 使用 global     | ❌ Node.js 语法     |
| scene 模块       | 先加载                | 后加载或缺失    | ❌ 依赖缺失         |
| 错误处理         | 完善                  | 无              | ❌ 失败无提示       |
| 重试机制         | 有                    | 无              | ❌ 网络问题无法恢复 |

### 加载顺序对比

**旧版顺序**:

```
1. daximap.utils.js
2. scene/daximap.visitor.js
3. scene/daximap.core.js
4. scene/daximap.indoor.js
5. scene/daximap.outdoor.js
6. scene/daximap.layers.js
7. daximap.scene.js
8. daximap.api.js
9. daximap.control.js
...
```

**新版顺序**:

```
1. daximap.utils.js
2. daximap-core.js (❌ 新增，有 bug)
3. daximap.api.js (❌ 太早，依赖未加载)
4. daximap.scene.js
...
(❌ 缺失 scene/ 目录下的文件)
```

---

## ✅ 任务 4: 修复方案

### 方案 A: 修复远程服务器文件（推荐）

**步骤**:

1. **修复 `daximap.api.js`** (第 10 行)

   ```javascript
   // 修改前:
   const daximap = (global.DaxiMap = global.DaxiMap || {});

   // 修改后:
   const daximap = (window.DaxiMap = window.DaxiMap || {});
   ```

2. **修复 `daximap.utils.js`** (第 57 行)

   ```javascript
   // 修改前:
   export { Class };

   // 修改后:
   window.DaxiMap = window.DaxiMap || {};
   window.DaxiMap.Class = Class;
   ```

3. **修复或删除 `daximap-core.js`**

   ```javascript
   // 修改前:
   window.DaxiMap = DaxiMap; // ❌ DaxiMap 未定义

   // 修改后:
   window.DaxiMap = window.DaxiMap || {}; // ✅ 初始化空对象
   ```

4. **更新 `dist/index.html` 的 SDK 加载顺序**

   ```html
   <!-- Map SDK (按旧版顺序加载) -->
   <script src="./map_sdk/map/daximap.utils.js"></script>
   <script src="./map_sdk/map/daximap-core.js"></script>
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
   <script src="./map_sdk/map/daximap.downloader.js"></script>
   <script src="./map_sdk/map/daximap.pluginManager.js"></script>
   ```

5. **部署到远程服务器**

   ```bash
   # 构建项目
   pnpm build

   # 部署 dist 目录到 html.qkbyte.cn
   # (具体部署流程根据实际环境)
   ```

### 方案 B: 使用 bootstrap-loader（备选）

将旧版的 `bootstrap-loader.js` 集成到新版本：

1. 复制 `app/navi_app/shouxihu/js/bootstrap-loader.js` 到 `dist/js/`
2. 修改 `dist/index.html` 引用加载器
3. 调整加载器中的路径

### 方案 C: 完全重构为 ES6 Module（长期方案）

将所有 map_sdk 文件改为 ES6 module，使用 `type="module"` 加载。但这需要大量修改 SDK 代码。

---

## 📋 本地修复完成状态

我已经在本地完成了以下修复：

✅ `map_sdk/map/daximap.api.js` - 将 `global` 改为 `window`  
✅ `map_sdk/map/daximap.utils.js` - 移除 `export`，改为挂载到 `window`  
✅ `map_sdk/map/daximap-core.js` - 修复 DaxiMap 未定义问题  
✅ `dist/index.html` - 更新 SDK 加载顺序，添加 scene 目录文件  
✅ `scripts/screenshot-test.js` - 添加 URL 参数

**注意**: 这些是本地文件修改。远程服务器 `html.qkbyte.cn` 上的文件需要重新部署才能生效。

---

## 📊 交付物清单

1. ✅ **使用正确参数的测试报告**
   - 文件：`test-screenshots/report-2026-03-01T07-25-14-003Z.json`
   - 截图：`test-screenshots/screenshot-2026-03-01T07-25-14-003Z.png`

2. ✅ **旧版 map_sdk 加载方式分析**
   - 文件：`MAP_SDK_ANALYSIS.md`
   - 详细分析了 bootstrap-loader.js 的加载机制

3. ✅ **新旧版本对比**
   - 见本报告"任务 3: 新旧版本对比"章节
   - 包含加载顺序、文件差异、问题分析

4. ✅ **修复方案**
   - 见本报告"任务 4: 修复方案"章节
   - 包含具体代码修改和部署步骤

---

## 🎯 下一步行动

**需要主人操作**:

1. **部署修复到远程服务器**
   - 将本地修改的文件上传到 `html.qkbyte.cn`
   - 或重新构建并部署整个项目

2. **重新测试**
   - 部署后再次运行 `pnpm test:screenshot`
   - 验证地图是否正常加载

3. **验证功能**
   - 测试地图渲染
   - 测试导航功能
   - 测试 WebSocket 定位

---

**报告生成时间**: 2026-03-01 15:25 GMT+8  
**测试脚本**: `scripts/screenshot-test.js`  
**项目位置**: `/home/ubuntu/.openclaw/workspace/code/daxi-aiguide-h5/`
