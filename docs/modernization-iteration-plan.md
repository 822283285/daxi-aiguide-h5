# 代码库现代化迭代计划（持续更新）

> 本文档用于分轮次记录优化动作、复盘结果与下一步计划。目标是在保证线上可用的前提下，逐步提升代码库可维护性与现代化程度。

## 长期目标

1. 降低全局变量与跨模块隐式依赖。
2. 统一配置、网络、消息协议，减少重复实现。
3. 拆分超大文件，建立清晰模块边界。
4. 建立最小工程化基线（静态检查、文档、提交规范）。

---

## 第 1 轮迭代（已完成）

### 本轮改动

1. **修复消息参数字段拼写错误**
   - 文件：`app/navi_app/shouxihu/extend_guobo/js/daxiapp.page.visitNavi.js`
   - 问题：`methodToMiniProgram` 参数中 `bdid` 字段写错为异常字符串，导致小程序侧参数解析风险。
   - 处理：统一修正为 `bdid`。

2. **修复状态页方法作用域错误**
   - 文件：`app/navi_app/shouxihu/js/daxiapp.page.mapStateBulldingList.js`
   - 问题：`setData` 方法中误用未定义的 `thisObject`，存在运行时异常风险。
   - 处理：改为正确的实例引用 `this`。

3. **移除容器入口无效脚本引用**
   - 文件：`map-ui-container/index.html`
   - 问题：页面尾部存在 `../xxxxx.js` 占位式脚本引用，可能触发 404 噪音与加载链不确定性。
   - 处理：删除无效引用。

### 本轮复盘

- 本轮主要以“低风险止血”为目标，优先修复显性错误与入口稳定性问题。
- 未进行大规模架构迁移，避免一次改动过大影响线上稳定性。

### 下一轮候选任务（第 2 轮）

1. 收敛 URL 参数读取逻辑（`getQueryParam` / `_getParam` / `_getQueryParam`）到单一实现。
2. 在容器层增加参数白名单透传，减少父子 iframe 间参数污染。
3. 为 `socketUtils` 增加 `window.parent.ws` 可用性守卫和错误上报。

---

## 迭代原则

1. 每轮只做一类问题（可回滚、可验证）。
2. 每轮必须记录“改动 + 风险 + 下一步”。
3. 优先顺序：可用性 > 安全性 > 可维护性 > 性能微调。

---

## 第 2 轮迭代（已完成）

### 本轮改动

1. **统一 URL 参数读取能力（容器层）**
   - 文件：`map-ui-container/assets/js/utils.js`
   - 新增：`getAllQueryParams`、`getQueryParamFromSelfOrParent`、`pickQueryParams`。
   - 调整：`getQueryParam` 改为基于 `URLSearchParams`，`_getParam` 统一复用新方法。

2. **增强 Socket 通信健壮性**
   - 文件：`map-ui-container/assets/js/socketUtils.js`
   - 调整：移除内部重复参数解析实现，统一复用 `commonUtils`。
   - 调整：`sendToH5` 与 `navigateToUni` 增加父窗口 WebSocket 可用性守卫。
   - 调整：`navigateToUni` 的 query 参数统一 `encodeURIComponent` 编码，降低特殊字符导致的协议解析风险。
   - 调整：移除 `TOKEN/USER_ID/APP_ID/DEVICE` 的硬编码默认值，改为缺失时空字符串兜底。

3. **限制 iframe 透传参数范围**
   - 文件：`map-ui-container/assets/js/page-switcher.js`
   - 调整：新增 `PASS_THROUGH_QUERY_KEYS` 白名单，仅透传业务必要参数，减少参数污染。

### 本轮复盘

- 本轮是“基础设施收敛”：减少重复实现，提升通信容错，控制参数边界。
- 仍保持向后兼容（`commonUtils` 缺失时保留兜底逻辑）。

### 下一轮候选任务（第 3 轮）

1. 抽离 `socketUtils` 与 `tabbar` 的 message 构建逻辑，形成统一消息工厂。
2. 为容器层增加基础单元测试（参数解析、消息编码、白名单过滤）。
3. 进一步清理 `map-ui-container` 的全局导出，收敛到单一命名空间。

---

## 第 3 轮迭代（已完成）

### 本轮改动

1. **新增统一消息工厂模块**
   - 文件：`map-ui-container/assets/js/message-factory.js`
   - 新增：`buildMiniProgramMessage`、`buildH5Message`、`sendToParentWs`、`getParentWs`。
   - 作用：统一父子通信协议构建与发送，减少各处重复拼装消息。

2. **Socket 通信与消息工厂对齐**
   - 文件：`map-ui-container/assets/js/socketUtils.js`
   - 调整：`openPoiToH5/openExhibitToH5/openRouteToH5/navigateToUni` 改为优先使用 `messageFactory`。
   - 调整：保留无 messageFactory 场景的兜底逻辑，保证向后兼容。

3. **Tabbar 跳转消息复用统一工厂**
   - 文件：`map-ui-container/assets/js/tabbar.js`
   - 调整：`听导游` 分支改为复用 `messageFactory` 构建并发送消息。
   - 调整：在父窗口 ws 不可用时输出明确 warning，提升可观测性。

4. **入口加载顺序补齐**
   - 文件：`map-ui-container/index.html`
   - 调整：新增 `message-factory.js` 引入，并置于 `socketUtils/tabbar` 前，确保依赖顺序正确。

### 本轮复盘

- 本轮重点是“通信层去重与标准化”，已经形成统一消息出口。
- 后续可继续将散落在 navi_app 内的消息拼装逻辑逐步纳入同一契约。

### 下一轮候选任务（第 4 轮）

1. 在 `map-ui-container` 增加最小化的浏览器端单元测试（参数解析、消息工厂、白名单透传）。
2. 将 `tabbar` 的页面名称映射外置到配置层，减少字符串分支硬编码。
3. 为 `messageFactory` 增加消息 schema 校验（开发环境告警）。

---

## 第 4 轮迭代（已完成）

### 本轮改动

1. **消息工厂新增方法构建与 schema 校验能力**
   - 文件：`map-ui-container/assets/js/message-factory.js`
   - 新增：`buildMethodString`，统一 `action=value?query` 拼接逻辑。
   - 新增：`validateMessage`，对 `postEventToMiniProgram` / `postEventToH5` 的关键字段做校验并输出错误日志。
   - 调整：`sendToParentWs` 在发送前执行校验，避免脏消息下发。

2. **socketUtils 统一复用 method 构建逻辑**
   - 文件：`map-ui-container/assets/js/socketUtils.js`
   - 新增：`buildMethod`（优先复用 `messageFactory.buildMethodString`，否则走兼容兜底）。
   - 调整：`openPoiToH5/openExhibitToH5/openRouteToH5/navigateToUni` 全部改为通过 `buildMethod` 构建 method 字段。
   - 效果：减少拼接分支，降低参数拼接错误概率。

### 本轮复盘

- 本轮重点是“消息协议字段标准化 + 发送前防御式校验”。
- 下一步可以把 `map-ui-container` 的消息常量和事件名彻底配置化，继续降低硬编码比例。

### 下一轮候选任务（第 5 轮）

1. 引入 `map-ui-container` 级别轻量单元测试（messageFactory 与 page-switcher 白名单逻辑）。
2. 提炼 tabbar 页面映射（`PAGE_NAME_MAP`）到配置层，避免中文文案直接控制流程分支。
3. 收敛容器层全局导出 API 到单入口对象，减少 `window.*` 分散导出。

---

## 第 5 轮迭代（已完成）

### 本轮问题分析（针对 404）

现象：初始化阶段出现 `.../app/navi_app/shouxihu/poi.json?name=...` 的 404 请求（同类请求多次触发）。

原因：
1. 室内地图在 `_parseFloorInfo` 中会遍历 `poilayer` 并为每层创建 `DXMapBoxPoiLayer`。
2. 当 `poilayer.link` 为历史写法 `poi.json` 时，引擎会继续发起按 `name` 查询的子请求。
3. 当前项目部署里并未提供该 legacy `poi.json` 资源，因此触发重复 404；该数据链路在现网业务中并非必需。

### 本轮改动

1. **默认跳过 legacy POI 请求**
   - 文件：`map_sdk/map/scene/daximap.indoor.js`
   - 调整：当 `poilayer.link` 命中 `poi.json` 时，默认跳过该图层初始化并输出 warning。
   - 可配置：如业务需要恢复该链路，可设置 `window.disableLegacyPoiJsonRequest = false` 显式开启。

### 本轮复盘

- 该改动能直接消除启动阶段无效 `poi.json` 404 噪音，并减少无意义网络开销。
- 保留了可配置开关，避免硬删除历史能力。

### 下一轮候选任务（第 6 轮）

1. 将 legacy 开关沉淀到统一配置层（避免直接读 `window`）。
2. 给室内图层初始化增加埋点（加载成功率、跳过原因、耗时）。
3. 继续清理 `navi_app` 中高频字符串拼接 URL 逻辑。
