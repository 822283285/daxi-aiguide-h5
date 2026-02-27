# API 请求封装文档 (v2.0)

## 概述

本项目使用 axios 进行 HTTP 请求封装，提供：
- ✅ **自动初始化**：从 URL 和远程配置自动获取参数
- ✅ **统一拦截**：请求/响应拦截、签名验证、错误处理
- ✅ **模块化设计**：按功能分类的 API 模块
- ✅ **日志输出**：完整的请求/响应日志
- ✅ **JSDoc 注释**：全中文注释，支持 IDE 提示

## 自动初始化

### 特性
- 无需手动调用 `initApi()`
- 自动从 URL 获取：`token`、`bdid`、`userId`、`appId`
- 自动从远程配置获取：`baseUrl`、`scenicApiUrl`、`userApiUrl`
- 首次请求时自动初始化

### 参数来源

| 参数 | 来源 | 说明 |
|------|------|------|
| `token` | URL 参数 (`?token=xxx`) | 用户 token |
| `bdid` | URL 参数 (`?bdid=xxx` 或 `?poiid=xxx`) | 建筑 ID |
| `userId` | URL 参数 (`?userId=xxx`) | 用户 ID |
| `appId` | URL 参数 (`?appId=xxx`) | 应用 ID |
| `baseUrl` | 远程配置 `scenic.static_url` | 基础 URL |
| `scenicApiUrl` | 远程配置 `scenic.api_url` | 景区 API URL |
| `userApiUrl` | 远程配置 `user.userServerUrl` | 用户 API URL |
| `secret` | 远程配置 `secret` | 签名密钥 |

### 远程配置 URL
```
https://cloud.daxicn.com/publicData/806bc162812065750b3d3958f9056008/appConfig/app.json
```

## 快速开始

### 1. 引入 axios 库

```html
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
```

### 2. 引入 API 模块

```javascript
// ES6 模块
import { api } from './src/api/index.js';

// 或直接使用全局对象
// window.DaxiApp.api
```

### 3. 使用 API（自动初始化）

```javascript
// 第一次调用时会自动初始化
const userInfo = await api.user.getUserInfo({});

// 获取景区配置
const config = await api.scenic.getScenicConfig({});

// 获取展品列表
const exhibits = await api.exhibit.getExhibitAll({});
```

### URL 示例

```
https://your-domain.com/index.html?token=abc123&bdid=B000A11DAN&userId=user123
```

API 会自动从 URL 中提取这些参数。

## API 模块详解

### user - 用户模块

```javascript
// 获取用户信息
const userInfo = await api.user.getUserInfo({
  openid: 'user123', // 可选，默认使用 URL 中的 userId
  showLog: true,     // 是否显示日志
});

// 更新用户信息
const result = await api.user.updateUserInfo({
  username: '张三',
  avatarUrl: 'https://example.com/avatar.jpg',
  openid: 'user123',
});

// 缓存用户信息
api.user.cacheUserInfo(userInfo);

// 获取缓存的用户信息
const cachedUser = api.user.getCachedUserInfo();
```

### scenic - 景区配置模块

```javascript
// 获取景区配置
const config = await api.scenic.getScenicConfig({});

// 获取首页配置
const homeConfig = await api.scenic.getHomePageConfig({});

// 获取服务页配置
const serviceConfig = await api.scenic.getServicePageConfig({});

// 获取展览路线
const routes = await api.scenic.getRouteAll({});
```

### exhibit - 展品模块

```javascript
// 获取展品列表
const exhibits = await api.exhibit.getExhibitAll({});

// 获取展品详情列表
const explains = await api.exhibit.getExhibitExplainAll({});

// 根据展品编号获取详情
const exhibit = await api.exhibit.getExhibitByNum({
  exhibitNum: 'E12345',
  // 或
  code: 'E12345',
});
```

### search - 搜索模块

```javascript
// 获取搜索热门词
const hotWords = await api.search.getHotWords({});
```

### footprint - 足迹模块

```javascript
// 获取用户足迹
const footprints = await api.footprint.getFootprints({});
```

### payment - 支付模块

```javascript
// 缓存 token 和 BDID
const result = await api.payment.cacheTokenAndBDID({
  token: 'xxx',
  bdid: 'B000A11DAN',
});
```

### route - 路线模块

```javascript
// 获取展览路线
const routes = await api.route.getRouteAll({});
```

### home - 首页模块

```javascript
// 获取首页配置
const config = await api.home.getPageConfig({});
```

### service - 服务页模块

```javascript
// 获取服务页配置
const config = await api.service.getPageConfig({});
```

## 手动初始化（可选）

如果需要手动覆盖配置：

```javascript
import { initApi } from './src/api/index.js';

await initApi({
  baseUrl: 'https://custom-url.com',
  appParams: {
    token: 'custom-token',
    bdid: 'B000A11DAN',
  },
});
```

## 错误处理

```javascript
try {
  const userInfo = await api.user.getUserInfo({});
  console.log('成功:', userInfo);
} catch (error) {
  console.error('失败:', error);
  console.error('错误码:', error.code);
  console.error('HTTP 状态码:', error.status);
}
```

### 常见错误码

| 错误码 | 说明 |
|--------|------|
| `UNAUTHORIZED` | 未授权 |
| `FORBIDDEN` | 拒绝访问 |
| `NOT_FOUND` | 资源不存在 |
| `SERVER_ERROR` | 服务器错误 |
| `NETWORK_TIMEOUT` | 网络超时 |

## 日志控制

```javascript
// 禁用日志
const result = await api.user.getUserInfo({
  showLog: false,
});
```

## 签名验证

默认自动添加签名，如需禁用：

```javascript
const config = await api.scenic.getScenicConfig({
  needSign: false,
});
```

## 兼容旧代码

旧的 `daxiapp.api` 调用方式仍然可用，但会输出 deprecation 警告：

```javascript
// 旧方式（不推荐）
daxiapp.api.getUserInfo({ openid: 'user123' }, successCB, errorCB);

// 新方式（推荐）
const userInfo = await daxiapp.api.user.getUserInfo({ openid: 'user123' });
```

## 更新应用参数

```javascript
import { updateAppParams } from './src/api/request.js';

updateAppParams({
  token: 'new-token',
  bdid: 'B000A11DNEW',
});
```

## 获取远程配置

```javascript
import { getRemoteConfig } from './src/api/request.js';

const config = await getRemoteConfig();
console.log('远程配置:', config);
```

## 注意事项

1. **axios 依赖**：确保已引入 axios 库
2. **URL 参数**：确保 URL 中包含必要的参数（token, bdid）
3. **网络访问**：远程配置需要网络访问权限
4. **签名工具**：如需签名，确保 `window.signMd5Utils` 已定义
5. **自动初始化**：首次请求时会自动初始化，无需手动调用

## 示例代码

```javascript
import { api } from './src/api/index.js';

async function loadData() {
  try {
    // 自动初始化后执行
    const [userInfo, config, exhibits] = await Promise.all([
      api.user.getUserInfo({}),
      api.scenic.getScenicConfig({}),
      api.exhibit.getExhibitAll({}),
    ]);
    
    console.log('用户信息:', userInfo);
    console.log('景区配置:', config);
    console.log('展品列表:', exhibits);
  } catch (error) {
    console.error('加载失败:', error);
  }
}

loadData();
```

## 更新日志

- **v2.0 (2026-02-26)**: 支持自动初始化，从 URL 和远程配置获取参数
- **v1.0 (2026-02-26)**: 初始版本

## 签名工具

### 位置

签名工具位于 `src/utils/signMd5Utils.js`

### 引入方式

```javascript
// ES6 模块
import signMd5Utils from './src/utils/signMd5Utils.js';

// 或浏览器全局对象
const sign = window.signMd5Utils.getSign(url, params);
const timestamp = window.signMd5Utils.getTimestamp();
```

### 依赖

签名工具需要 MD5 库支持，项目需要引入 `crypto-js`：

```html
<script src="https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/crypto-js.min.js"></script>
```

引入后，`signMd5Utils` 会自动使用 `CryptoJS.MD5` 进行加密。

### 方法说明

#### `getSign(url, requestParams, secret)`

获取请求签名

```javascript
// GET 请求
const sign = signMd5Utils.getSign(
  'https://api.example.com/path?param1=value1',
  { param2: 'value2' }
);

// POST 请求
const sign = signMd5Utils.getSign(
  'https://api.example.com/path',
  { key: 'value' }
);

// 使用自定义密钥
const sign = signMd5Utils.getSign(url, params, 'your-secret-key');
```

#### `getTimestamp()`

获取当前时间戳

```javascript
const timestamp = signMd5Utils.getTimestamp();
// 返回：1234567890123
```

#### `buildSignHeaders(url, data, customHeaders)`

构建签名请求头

```javascript
const headers = signMd5Utils.buildSignHeaders(url, data);
// 返回：
// {
//   'X-Sign': 'xxx',
//   'X-TIMESTAMP': 1234567890123,
//   'Content-Type': 'application/json'
// }
````

### 在 API 中使用

签名工具已自动集成到 API 请求封装中，无需手动调用。

API 会自动使用 `window.signMd5Utils` 为每个请求添加签名：

```javascript
// 自动添加签名
const result = await api.user.getUserInfo({});

// 请求头会包含：
// X-Sign: xxxxx
// X-TIMESTAMP: 1234567890123
```

如需禁用签名：

```javascript
const result = await api.scenic.getScenicConfig({
  needSign: false, // 禁用签名
});
```

### 签名算法

1. 解析 URL 中的查询参数
2. 合并 URL 参数和请求体参数
3. 按 key 升序排列所有参数
4. 转换为 JSON 字符串
5. 拼接密钥字符串
6. MD5 加密后转为大写

### 注意事项

1. **必须引入 crypto-js**：否则使用简单实现，签名不兼容生产环境
2. **密钥一致性**：前后端密钥必须一致
3. **参数顺序**：签名时参数按 key 升序排列
4. **数值处理**：数值类型会转为字符串处理
