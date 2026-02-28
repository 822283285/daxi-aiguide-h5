/**
 * 单元测试说明文档
 * 
 * 本目录包含为现代化改造的核心模块创建的单元测试。
 */

# Legacy 模块单元测试

## 测试文件说明

本目录 (`tests/unit/legacy/`) 包含为以下已改造模块创建的单元测试：

### 1. mapView.test.js
测试 `daxiapp.mapView.js` - 地图视图核心模块

**测试内容**:
- MapView 构造函数
- 地图容器管理
- 视图状态栈管理
- 扩展控制按钮
- 建筑信息管理

**依赖**:
- DaxiMap (地图 SDK)
- DaxiApp (应用框架)
- Zepto (DOM 库)

### 2. command.test.js
测试 `daxiapp.page.command.js` - 命令处理模块

**测试内容**:
- initDaxiCommand 初始化
- 状态注册与管理
- WebSocket 事件处理
- URL 参数解析
- Hash 变化监听
- 展览展示命令

**依赖**:
- DaxiApp
- Zepto
- StateManager

### 3. mapStatePoi.test.js
测试 `daxiapp.page.mapStatePoi.js` - POI 处理模块

**测试内容**:
- MapStatePoi 类
- initialize 方法
- POI 数据管理
- 事件绑定

**依赖**:
- DaxiApp
- Zepto

### 4. mapStateNavi.test.js
测试 `daxiapp.page.mapStateNavi.js` - 导航页面模块

**测试内容**:
- MapStateNavi 类
- initialize 方法
- 导航状态管理

**依赖**:
- DaxiApp
- DaxiMap
- Zepto

### 5. mapStateRoute.test.js
测试 `daxiapp.page.mapStateRoute_new.js` - 路线规划模块

**测试内容**:
- MapStateRoute 类
- initialize 方法
- 路线数据管理

**依赖**:
- DaxiApp
- DaxiMap
- Zepto

## 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test -- mapView.test.js

# 监听模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage
```

## 测试配置

### Jest 配置

Jest 配置已更新以支持 legacy 模块测试：

**jest.config.js**:
- ✅ 允许测试 `/app/` 目录
- ✅ 包含 legacy 模块覆盖率
- ✅ 配置 transformIgnorePatterns

### 测试设置

**tests/setup.js** 提供以下 Mock:
- Zepto ($)
- DaxiApp
- DaxiMap
- localStorage
- sessionStorage
- fetch
- location

## 注意事项

### 模块加载

Legacy 模块使用 IIFE (Immediately Invoked Function Expression) 模式，通过 `global` 对象导出：

```javascript
// Legacy 模式
(function (global) {
  function MapView() { ... }
  global["MapView"] = MapView;
})(window);

// 测试中访问
const MapView = global.MapView;
```

### 依赖注入

测试时需要 Mock 所有外部依赖：

```javascript
beforeAll(() => {
  global.DaxiApp = { ... };
  global.DaxiMap = { ... };
  global.$ = jest.fn(() => ({ ... }));
});
```

### 已知问题

1. **语法错误**: 部分 legacy 文件在转换后存在语法错误（如重复声明、多余符号）
   - 状态：正在修复
   - 影响：测试无法完全运行
   
2. **ES6 导出**: Legacy 文件尚未添加 ES6 导出语句
   - 计划：后续添加
   - 当前：使用 global 对象访问

## 后续改进

1. **修复语法错误**: 完成所有文件的语法验证
2. **添加 ES6 导出**: 统一模块导出方式
3. **提高覆盖率**: 增加测试场景和边界条件
4. **集成测试**: 添加模块间交互测试
5. **E2E 测试**: 添加端到端测试

## 参考资料

- [Jest 文档](https://jestjs.io/)
- [现代化改造完成报告](../../../MODERNIZATION_COMPLETE.md)
- [改造总结](../../../TRANSFORMATION_SUMMARY.md)

---

**最后更新**: 2026-03-01
