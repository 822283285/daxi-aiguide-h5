# 参数契约与来源优先级（Container ↔ iframe）

## 1. 参数来源优先级

统一由 `map-ui-container/config/runtime-config.js` 管理。

1. **URL 白名单参数**（最高优先级）
   - 仅允许：`env/token/buildingId/userId/appId/device/testLocWs/disabledH5Location/wsIndex/sendLocType/method/platform/lang/scenic`。
2. **环境注入参数**（补充）
   - 通过 `window.__DX_RUNTIME_INJECT__` 注入，典型用于 `env` 与域名覆盖。
3. **默认值**（兜底）
   - `env=dev`。

> 不再通过父子 iframe 相互调用 `_getParam` 链式回退；容器与子页面都应从统一 runtime 配置读取参数。

## 2. 必填参数契约

### 2.1 核心业务参数
- `token`
- `buildingId`
- `userId`

### 2.2 Socket/消息参数
- `appId`
- `device`

在 `socketUtils.js` 和 `tabbar.js` 中统一调用 `runtimeConfig.requireParams()` 进行校验；缺失时进入可观测错误分支：
- `console.error([runtime-config:MISSING_REQUIRED_PARAMS])`
- 广播事件：`daxi:observable-error`

日志输出中 token/buildingId/userId 采用脱敏展示（`runtimeConfig.maskValue`）。

## 3. 环境矩阵（dev/uat/prod）

由 `runtime-config.js` 内部维护：
- `apiBaseUrl`
- `staticBaseUrl`
- `wsBaseUrl`
- `mapDataBaseUrl`

当前基础链接约定：
- `dev`（本地）：`http://192.168.50.83:9300/`
- `uat`（线上测试）：`https://cloud.daxicn.com/publicData/`
- `prod`（线上生产）：`https://cloud.daxicn.com/scenic/`

业务代码统一通过：
- `runtimeConfig.getEnvConfig()` 获取环境域名
- `runtimeConfig.getScenicUrls()` 获取 `baseUrl/projectUrl/scenicUrl`

## 4. 迁移要求

- 禁止新增 `_getParam` 或跨帧 `window.parent.commonUtils.getQueryParam` 读取。
- 如需新增可透传参数，必须先更新 `runtime-config.js` 白名单。
- 新增通信能力必须复用 `runtimeConfig.requireParams()`，并在错误分支上报可观测事件。
