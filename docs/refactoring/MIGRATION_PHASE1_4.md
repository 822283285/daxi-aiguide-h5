# Phase 1.4 迁移指南

**阶段**: Phase 1 - 基础设施搭建  
**子阶段**: Phase 1.4 - 核心层文件迁移  
**状态**: 🔄 进行中  
**日期**: 2026-02-27  

---

## 📋 迁移任务清单

### ✅ 已完成迁移

#### Core 层
- [x] ConfigService (从 app/navi_app/shouxihu/src/core/config/)
- [x] StateManager (新建)
- [x] StateRouter (新建)
- [x] param-parser.js (新建)
- [x] env-detector.js (新建)
- [x] dom-utils.js (新建)
- [x] app-constants.js (新建)

#### 模块入口
- [x] 所有 29 个 index.js 文件创建

#### 配置文件
- [x] package.json
- [x] vite.config.js
- [x] eslint.config.js
- [x] jest.config.js
- [x] tests/setup.js

### 🔄 待迁移

#### Assets 资源
- [ ] images/ → src/assets/images/
- [ ] fonts/ → src/assets/fonts/
- [ ] audio/ → src/assets/audio/
- [ ] videos/ → src/assets/videos/ (如有)

#### Styles 样式
- [ ] css/ → src/ui/styles/
  - main.css → base.css
  - blue.css → components/blue.css
  - 其他 CSS 文件

#### Utils 工具 (评估中)
- [ ] 评估 app/navi_app/utils/ 中的工具函数
- [ ] 选择性地合并到 src/utils/ 或 src/core/utils/

---

## 🎯 迁移策略

### Assets 迁移原则

1. **直接复制**: 图片、字体、音频直接复制
2. **保持结构**: 维持原有目录结构
3. **后续处理**: 构建时 Vite 会处理这些资源

### Styles 迁移原则

1. **分类整理**: 
   - 基础样式 → src/ui/styles/base.css
   - 组件样式 → src/ui/styles/components/
   - 页面样式 → src/ui/styles/pages/
   - 主题样式 → src/ui/styles/themes/

2. **CSS 变量**: 后续将颜色、字体等提取为 CSS 变量

3. **依赖检查**: 检查 CSS 文件中的路径引用

---

## 📊 迁移进度

### 目录大小统计

```bash
# 旧目录大小
app/navi_app/shouxihu/images/   - 待统计
app/navi_app/shouxihu/fonts/    - 待统计
app/navi_app/shouxihu/audio/    - 待统计
app/navi_app/shouxihu/css/      - 待统计
```

### 预计迁移时间

- Assets 迁移：1-2 小时
- Styles 迁移：2-3 小时
- Utils 评估：1 小时
- 验证测试：1 小时

**总计**: 5-7 小时

---

## 🔧 迁移步骤

### Step 1: Assets 迁移

```bash
# 复制 images
cp -r app/navi_app/shouxihu/images/* src/assets/images/

# 复制 fonts
cp -r app/navi_app/shouxihu/fonts/* src/assets/fonts/

# 复制 audio
cp -r app/navi_app/shouxihu/audio/* src/assets/audio/
```

### Step 2: Styles 迁移

```bash
# 复制 CSS 文件
cp app/navi_app/shouxihu/css/*.css src/ui/styles/

# 创建分类目录
mkdir -p src/ui/styles/components
mkdir -p src/ui/styles/pages
mkdir -p src/ui/styles/themes
```

### Step 3: 更新路径引用

- 检查 CSS 中的 url() 路径
- 检查 JS 中的资源引用
- 更新为新的路径别名

### Step 4: 验证

- 运行 `pnpm dev`
- 检查资源加载
- 检查样式渲染

---

**下一步**: 开始执行 Assets 迁移
