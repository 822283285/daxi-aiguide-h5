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
