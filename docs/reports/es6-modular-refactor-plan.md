# daxi-aiguide-h5 模块化 + ES6 重构分析与实施文档

> 目标：在不影响线上稳定性的前提下，将当前“脚本拼装 + 全局变量”架构演进为“模块化 + ES6 import/export”架构，系统性减少 `window` 依赖并建立可维护的工程边界。

## 1. 代码库现状总览

## 1.1 入口与加载方式

当前主入口 `app/navi_app/shouxihu/index_src.html` 仅注入 `bootstrap-loader.js`，后续由 loader 按组串行动态注入大量脚本（vendor / map_sdk / runtime）。这一方式本质上依赖“脚本加载顺序 + 全局符号可见性”，没有显式模块依赖声明。

- `index_src.html`：页面入口仅保留一个 bootstrap 脚本。
- `bootstrap-loader.js`：定义 `scriptGroups` 串行加载，并通过 `window.__daxiBootstrapStatus` 暴露状态。
- `dxapi.app.js` 与 `app-init.js`：通过 `window.DaxiApp`、`window.DaxiMap`、`window.$`、`window.OnDXMapCreated` 等全局对象协作。

## 1.2 规模与复杂度（结合仓库检查数据）

- 健康报告显示：JS 文件 144 个，总行数 157575 行；超大文件集中于定位、地图场景、组件核心。
- 现有报告中记录了 136 个 `window.* =` 全局写入点（包含业务代码与三方库）。
- 本次扫描结果（命令统计）：
  - `window.` 引用（app/map/jsbridge 全部 JS）约 **703** 处；
  - `window` 显式赋值约 **117** 处；
  - IIFE 模式 `(...)()` 约 **997** 处；
  - 真正 ESM `import/export` 在业务代码中几乎不存在（命中主要来自注释或三方产物）。
- 首方代码（剔除大部分 min/libs）中依然存在高密度 `window` 引用（约 439）与 IIFE（约 636）。

## 1.3 典型结构问题（从入口可见）

1. 启动链路长且隐式：`index_src.html -> bootstrap-loader -> N个script -> 全局对象拼装`。
2. 运行时全局通信：模块边界由命名约定而非类型/接口约束。
3. 业务生命周期、地图引擎、平台桥接（jsbridge）耦合在同一启动阶段。
4. 代码副作用大：加载即执行，难以进行局部测试。

---

## 2. 技术缺陷分析（Technical Gaps）

## 2.1 模块系统缺失

- 缺陷：依赖“脚本顺序”而不是“依赖图”，易出现隐式破坏。
- 影响：
  - 难做按需加载与增量重构；
  - 失败时定位成本高；
  - 任何文件改动都可能产生跨域副作用。

## 2.2 全局变量污染严重

- 缺陷：`window` 既是配置仓库，又是跨模块事件总线、函数注册中心。
- 影响：
  - 命名冲突风险高；
  - 测试隔离困难；
  - 多页面/多实例场景不可控；
  - 很难做 SSR、Worker、微前端等演进。

## 2.3 大文件与低内聚

- 缺陷：如 `daxiapp.component.js`、`daximap.scene.js`、`wx.loc.js` 等承担过多职责。
- 影响：
  - 单文件认知负担过高；
  - review 与回归范围过大；
  - 无法建立明确的 Owner 边界。

## 2.4 运行时状态管理分散

- 缺陷：状态散落在 `window`、闭包对象、DOM 状态、SDK 状态中。
- 影响：
  - 状态来源不唯一；
  - bug 可复现性低；
  - debug 依赖经验。

## 2.5 测试与质量门禁偏弱

- 当前 CI 更偏“语法/文件存在”检查，缺少：
  - 模块级单测；
  - 依赖边界扫描（循环依赖、层级越界）；
  - 关键流程集成测试（初始化、定位、导航、桥接命令）。

---

## 3. 架构缺陷分析（Architecture Gaps）

## 3.1 分层不清晰

建议中的层次（当前未成形）：

- `platform`：jsbridge / 设备能力（定位、音频、传感器）；
- `domain`：导航、POI、路线、会话命令；
- `application`：页面状态机、用例编排；
- `ui`：页面组件与渲染。

当前问题：跨层直接调用与反向依赖普遍存在（UI 直接触发 platform 逻辑，SDK 层反向写入页面全局回调）。

## 3.2 依赖方向不可验证

- 由于无 import graph，无法自动识别“低层依赖高层”的架构违例。
- 依赖关系只能靠运行时/人工经验判断。

## 3.3 初始化职责堆叠

启动链中同时承担：配置解析、资源加载、桥接初始化、地图实例创建、UI 初始化、命令回放，导致首屏阶段职责过重。

## 3.4 第三方库与业务代码边界薄弱

- vendor 直接暴露到全局并被业务随处引用。
- 缺少统一 adapter，替换库或升级版本风险较高。

---

## 4. 结构缺陷分析（Codebase Structure Gaps）

## 4.1 目录与职责映射不足

- 同类能力存在多处实现或历史副本（例如 AR 工具链、页面脚本分散于多个目录）。
- 页面脚本目录与通用能力目录交叉调用，缺少“公共模块层”。

## 4.2 重复实现与历史包袱

仓库已有重复文件名组（健康报告显示 14 组），说明存在复制演进而非抽象复用的问题，长期导致分叉 bug 与维护成本上升。

## 4.3 构建边界缺失

- 目前没有明确 src/build/dist 边界（以“运行时脚本仓库”为主）。
- 不利于 tree-shaking、分包、缓存优化及环境隔离（dev/test/prod）。

---

## 5. 重构目标与原则

## 5.1 目标

1. 以 ES6 `import/export` 建立静态依赖图。
2. 将 `window` 从“默认通信机制”降级为“受控兼容层（仅少量）”。
3. 建立分层架构与目录边界，支持长期演进。
4. 在“可回滚、可灰度、可观测”的前提下逐步替换，不做一次性大爆炸。

## 5.2 原则

- 兼容优先：先“包一层”再“替换内核”。
- 小步提交：每个 PR 可独立验证。
- 双轨运行：新旧入口并行，保留 fallback。
- 可观测驱动：对错误率、初始化耗时、命令成功率设 KPI。

---

## 6. 目标架构（模块化 + ES6）

建议引入如下逻辑结构（可映射到 `app/navi_app/src`）：

- `src/core/`：应用容器、依赖注入、事件总线（非 window）。
- `src/platform/`：
  - `bridge/`（jsbridge 适配器）
  - `location/`（定位适配）
  - `audio/`（语音适配）
- `src/domain/`：
  - `navigation/`
  - `poi/`
  - `route/`
- `src/application/`：
  - `usecases/`
  - `state/`
  - `commands/`
- `src/ui/`：页面控制器、视图组件。
- `src/legacy/`：旧全局 API 兼容层（过渡期）。
- `src/main.js`：唯一启动入口。

依赖规则：`ui -> application -> domain -> platform`，`core` 可被各层使用但不反向依赖业务层。

---

## 7. window 剥离策略（重点）

## 7.1 分类治理

将 `window` 用法分为四类：

1. **配置类**（如 `window.rootPath`）→ 改为 `ConfigService` 注入。
2. **能力类**（如 `window.locWebSocketPostMessage`）→ 改为 `PlatformAdapter`。
3. **回调注册类**（如 `window.OnDXMapCreated`）→ 改为 `EventBus` / 生命周期 Hook。
4. **兼容暴露类**（外部必须调用）→ 放入 `legacy/bridge-compat.js` 统一挂载。

## 7.2 过渡做法

- 阶段1：保留旧全局读写，但所有新代码只通过模块 API 访问。
- 阶段2：在兼容层内集中读写 `window`，业务侧禁止直接访问。
- 阶段3：对外发布“去全局版”，仅保留白名单全局（例如 `window.DxAppCompat`）。

## 7.3 白名单机制

建立 `global-whitelist.json`，只允许极少数全局符号存在；CI 增加扫描，若新增未授权全局直接失败。

---

## 8. 分阶段重构路线图（详细）

## Phase 0：基线建设（1~2 周）

- 建立目录骨架与 lint/test/tooling（ESLint + Prettier + Vitest/Jest）。
- 新增 `window` 扫描脚本（区分首方/三方、读/写）。
- 建立架构约束检查（例如 dependency-cruiser / eslint-plugin-boundaries）。
- 输出 ADR：分层规则、命名规范、模块导出规范。

**交付物**

- `docs/architecture/*.md`
- `scripts/quality/check-globals.js`
- `scripts/quality/check-deps.js`

## Phase 1：启动链模块化（2~3 周）

- 新建 `src/main.js`，将 `app-init` 逻辑迁入模块。
- 将 `bootstrap-loader` 从“脚本顺序装配”升级为“模块入口加载 + 兼容脚本桥”。
- 将运行时配置解析抽离为 `ConfigService`。

**验收标准**

- 首屏可正常加载。
- 新入口可在灰度开关下切换。

## Phase 2：核心服务解耦（3~4 周）

- 抽离 `BridgeService`、`MapService`、`CommandBus`。
- `dxapi.app.js` 由 IIFE 改造为模块 + 工厂函数（`createDxApp()`）。
- 将 `window.downloader/window.command/window.projDataPath` 等迁移到服务上下文。

**验收标准**

- 命令处理链路可通过集成测试。
- 关键全局写入点下降 40%+。

## Phase 3：页面与状态层重构（4~6 周）

- 页面脚本（mapState\*）按“控制器 + 用例 + 视图模型”拆分。
- 引入统一状态容器（轻量 store），禁止页面跨文件直接改全局。
- 逐步替换历史重复页面实现（先保留行为一致，再删副本）。

**验收标准**

- 页面状态切换路径具备自动化回归。
- 页面层不再直接读写 `window`。

## Phase 4：地图与定位域重构（4~8 周）

- 将 `daximap.*`、`wx.loc.js` 的业务粘合逻辑抽到 adapter/service。
- 大文件按能力拆分：渲染、图层、导航、定位、语音。
- 为 map/location 建立契约测试（mock bridge + mock sensor）。

**验收标准**

- Map/Location 可在测试环境独立初始化。
- 关键超大文件行数下降并拆为多模块。

## Phase 5：兼容层收敛与清理（2~3 周）

- `legacy` 统一导出兼容 API，业务代码零散 `window` 引用清零（白名单除外）。
- 删除废弃脚本与重复文件。
- 完成迁移文档与对外接入升级指南。

**验收标准**

- 非白名单全局新增为 0。
- 新模块化入口成为默认入口。

---

## 9. 任务拆解清单（可直接执行）

## 9.1 P0（必须先做）

1. 建立 `src/` 模块化目录与单入口 `main.js`。
2. 增加 `window` 使用扫描与 CI 阻断。
3. 建立分层依赖约束检查。
4. 完成 `ConfigService` 与 `BridgeService` 雏形。
5. 将 `dxapi.app.js` 外围初始化改造为可注入工厂。

## 9.2 P1（核心收益）

6. 将 `app-init.js` 改造成模块并接入新入口。
7. 抽离命令总线：`processCommand` 改为模块事件流。
8. 抽离下载器工厂，移除 `window.downloader` 直写。
9. 完成 `OnDXMapCreated` 兼容桥（event hook + legacy API）。
10. 首批页面（3~5个）改造为模块控制器。

## 9.3 P2（结构治理）

11. 拆分 `daxiapp.component.js` 与 `daxiapp.basecomponent.js`。
12. 拆分 `daximap.scene.js` / `daximap.utils.js`。
13. 清理重复目录与副本脚本（先比对行为后删除）。
14. 建立三方库 adapter 层（zepto/three/mapbox 的边界封装）。

## 9.4 P3（质量与发布）

15. 为启动、定位、导航、桥接四条主链路补齐自动化测试。
16. 加入性能指标采集：首屏时间、地图 ready 时间、命令成功率。
17. 推出灰度发布方案（开关、回滚、告警阈值）。
18. 形成迁移手册与编码规范（禁直连 window、禁跨层依赖）。

---

## 10. 里程碑与 KPI 建议

- M1（Phase1 结束）：新入口可灰度，启动成功率 ≥ 99.9%。
- M2（Phase2 结束）：首方 `window` 写入点下降 40%。
- M3（Phase3 结束）：页面层 `window` 直接引用下降 70%。
- M4（Phase5 结束）：非白名单全局引用为 0，主干全模块化。

---

## 11. 风险与应对

1. **隐式依赖被打断**：
   - 应对：建立兼容层 + 双入口灰度。
2. **大文件拆分回归风险高**：
   - 应对：先契约测试再拆分，按能力逐段迁移。
3. **团队习惯迁移成本**：
   - 应对：lint 规则 + 模板脚手架 + code review 清单。
4. **三方库升级牵连广**：
   - 应对：先适配器封装，避免业务直接依赖三方全局。

---

## 12. 推荐首月执行计划（周粒度）

- 第1周：基线脚本、ESLint/边界检查、目录骨架、ADR。
- 第2周：`main.js` + `app-init` 模块化、灰度开关。
- 第3周：`dxapi.app` 工厂化、Bridge/Config/Command 抽离。
- 第4周：完成首批页面改造 + 回归测试 + 指标看板。

> 结论：该仓库适合采用“兼容层先行 + 核心链路先拆 + 页面增量迁移”的重构策略。若直接一次性去 `window`，风险不可控；应以可观测、可回滚、可灰度为约束，分阶段完成 ES6 模块化演进。
