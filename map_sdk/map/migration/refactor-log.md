# daximap.scene.js 职责切分清单（第一批）

## 职责切分
- 定位采集：无（不属于 scene 模块）。
- 融合算法：楼层显隐与图层参数融合（保留在旧文件）。
- UI日志：无（当前批次无迁移）。
- 网络传输：无（当前批次无迁移）。
- 事件总线：`_mapSDK._fire("floorChanged")`（暂留旧文件）。
- 工具层：图层默认 paint 配置生成（已迁移到 domain）。

## 分层目录
- `domain/scene-layer-paint.js`
- `infra/index.js`
- `ui/index.js`
- `adapter/index.js`

## 行为对照表
| 旧函数/逻辑 | 新模块路径 | 主要调用方 |
|---|---|---|
| `getDefPaintByType(type)` | `map_sdk/map/domain/scene-layer-paint.js#getDefPaintByType` | `map_sdk/map/daximap.scene.js`（兼容门面） |

## 迁移日志
1. 新增 scene 子域统一 adapter 导出。
2. 旧 `daximap.scene.js` 中的同名函数改为兼容门面 + DEPRECATED 注释。
3. 本批次仅迁移“图层默认样式工具”子域，便于小步回滚。
