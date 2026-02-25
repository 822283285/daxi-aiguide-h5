# daxiapp.component.js 职责切分清单（第一批）

## 职责切分
- 定位采集：无（组件层不直接采集定位）。
- 融合算法：无（算法逻辑不在此文件）。
- UI日志：组件文案、列表显隐样式控制（部分已迁移到 `ui/`）。
- 网络传输：无（通过 listener 回调给上层处理）。
- 事件总线：listener 回调分发（保留在旧组件实现中）。
- 工具层：POI抽取、关键字读取、列表项构造（已迁移到 domain/infra/ui）。

## 分层目录
- `domain/component-poi.js`
- `infra/component-dom-keyword.js`
- `ui/component-shared-ui.js`
- `adapter/index.js`

## 行为对照表
| 旧函数名 | 新模块路径 | 主要调用方 |
|---|---|---|
| `_getPoiData` | `app/navi_app/components/domain/component-poi.js#getPoiData` | 搜索结果列表、POI卡片、收藏列表等组件 |
| `_createListItem` | `app/navi_app/components/ui/component-shared-ui.js#createListItem` | `DXListView*` 相关组件 |
| `_getLang` | `app/navi_app/components/ui/component-shared-ui.js#getLang` | 多语言按钮/提示文案 |
| `_updateLastShowClass` | `app/navi_app/components/ui/component-shared-ui.js#updateLastShowClass` | 列表删除/刷新后样式更新 |
| `_getKeyword` | `app/navi_app/components/infra/component-dom-keyword.js#getKeyword` | 多类搜索框组件 |
| `_updateRoutePosUI` | `app/navi_app/components/ui/component-shared-ui.js#updateRoutePosUI` | 路线起终点组件 |

## 迁移日志
1. 建立组件四层目录与统一 adapter 导出。
2. 旧 `daxiapp.component.js` 顶部公共函数替换为兼容门面，保留调用签名。
3. 本批次仅迁移“公共工具函数”子域，避免一次性大拆分。
