# wx.loc.js 职责切分清单（第一批）

## 职责切分
- 定位采集：`onBleUpdate`、`onGPSUpdate`、`onAOAUpdate`、`onOrientationUpdate`（保留在旧门面，待后续下沉到 adapter/provider）。
- 融合算法：`_locatorManager`、`_routeMatcher.update`、`onLocalizationSucceed`（核心算法暂保留，避免大回归）。
- UI日志：定位日志入库 `locationLogManager.addData`（已迁移到 `ui/location-log.js` 适配入口）。
- 网络传输：WebSocket/TestLoc 逻辑（暂留旧文件，待独立 infra 传输层）。
- 事件总线：`_providerManager.trigger` 与注册监听（暂留旧文件，待下一步拆分）。
- 工具层：定位状态初始化（已迁移到 `domain/location-state.js`）。

## 分层目录
- `domain/location-state.js`
- `infra/index.js`
- `ui/location-log.js`
- `adapter/index.js`

## 行为对照表
| 旧函数/逻辑 | 新模块路径 | 主要调用方 |
|---|---|---|
| `lastOrientation` 初始化 | `map_sdk/location/domain/location-state.js#createLastOrientation` | `map_sdk/location/wx.loc.js` |
| `globalValues` 初始化 | `map_sdk/location/domain/location-state.js#createGlobalValues` | `map_sdk/location/wx.loc.js` |
| `locationLogManager.addData` | `map_sdk/location/ui/location-log.js#addLocationLog` | `WXLocation.prototype.onLocalizationSucceed` |

## 迁移日志
1. 新增 adapter 统一导出入口。
2. 旧文件 `wx.loc.js` 仅保留兼容门面，并添加 DEPRECATED 注释。
3. 本批次仅迁移“状态初始化 + UI日志”子域，可独立回滚。
