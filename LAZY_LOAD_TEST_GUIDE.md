# 懒加载功能测试指南

## 🚀 快速开始

### 1. 启动开发服务器

```bash
cd /home/ubuntu/.openclaw/workspace/code/daxi-aiguide-h5
pnpm run dev
```

### 2. 打开浏览器

访问开发服务器地址（通常是 `http://localhost:5173`）

## 🧪 测试步骤

### 测试 1: 验证懒加载是否生效

**步骤**:

1. 打开 Chrome DevTools (F12)
2. 切换到 **Network** 面板
3. 筛选 **Img** 类型
4. 刷新页面
5. **观察**: 只有首屏可见的图片会被加载

**预期结果**:

- ✅ 初始加载时，只有少量图片请求
- ✅ 向下滚动时，图片逐步加载
- ✅ 未滚动到的区域，图片不会加载

### 测试 2: 检查懒加载样式

**步骤**:

1. 打开页面
2. 快速滚动到图片区域
3. 观察图片加载效果

**预期结果**:

- ✅ 图片加载前有灰色占位符背景 (#f0f0f0)
- ✅ 图片加载时有淡入效果 (opacity 过渡)
- ✅ 图片加载完成后完全显示 (opacity: 1)

### 测试 3: 验证动态内容懒加载

**步骤**:

1. 打开包含动态内容的页面（如景点列表、轮播图）
2. 触发动态内容加载
3. 观察新图片是否自动应用懒加载

**预期结果**:

- ✅ 动态加载的图片也使用懒加载
- ✅ 不需要手动调用初始化函数

### 测试 4: 性能对比

**工具**: Chrome Lighthouse

**步骤**:

1. 打开 Chrome DevTools
2. 切换到 **Lighthouse** 面板
3. 选择 **Performance** 类别
4. 点击 **Analyze page load**
5. 记录性能评分

**关键指标**:

- **FCP** (First Contentful Paint): 首次内容绘制时间
- **LCP** (Largest Contentful Paint): 最大内容绘制时间
- **SI** (Speed Index): 速度指数
- **TBT** (Total Blocking Time): 总阻塞时间

**预期改进**:

- ✅ FCP 减少 20-40%
- ✅ LCP 减少 15-30%
- ✅ 整体性能评分提升

### 测试 5: 移动端测试

**步骤**:

1. 在 Chrome DevTools 中切换到 **Device Toolbar** (Ctrl+Shift+M)
2. 选择移动设备（如 iPhone 12）
3. 选择 **Slow 3G** 网络节流
4. 测试图片加载效果

**预期结果**:

- ✅ 在慢速网络下，懒加载效果更明显
- ✅ 滚动流畅，无明显卡顿
- ✅ 图片加载优先级合理

### 测试 6: 兼容性测试

**步骤**:

1. 在不同浏览器中测试：
   - Chrome (最新)
   - Firefox (最新)
   - Safari (最新)
   - Edge (最新)
2. 检查懒加载功能是否正常

**预期结果**:

- ✅ 现代浏览器：使用 IntersectionObserver 懒加载
- ✅ 旧浏览器：降级为立即加载，功能正常

## 📊 监控指标

### Network 面板监控

**观察点**:

1. **初始请求数量**: 刷新页面时的图片请求数
2. **滚动请求**: 滚动时新增的图片请求
3. **请求时机**: 图片在可见前 50px 开始加载
4. **数据节省**: 对比懒加载前后的总数据量

### Performance 面板监控

**录制步骤**:

1. 打开 Performance 面板
2. 点击录制按钮
3. 执行滚动操作
4. 停止录制
5. 分析性能数据

**关键指标**:

- 📉 **FPS** (Frames Per Second): 应保持 60fps
- 📉 **CPU Usage**: 滚动时应保持低位
- 📉 **Paint events**: 减少不必要的重绘

## 🔍 调试技巧

### 1. 检查图片是否正确标记

```javascript
// 在控制台运行
document.querySelectorAll("img[data-src]").length;
// 应该返回已标记为懒加载的图片数量
```

### 2. 检查 IntersectionObserver 状态

```javascript
// 在控制台运行
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    console.log("Image visibility:", entry.isIntersecting, entry.target.src);
  });
});

document.querySelectorAll("img.lazy").forEach((img) => observer.observe(img));
```

### 3. 强制触发懒加载

```javascript
// 在控制台运行，强制加载所有懒加载图片
document.querySelectorAll("img[data-src]").forEach((img) => {
  img.src = img.dataset.src;
  img.removeAttribute("data-src");
});
```

### 4. 检查懒加载初始化

```javascript
// 检查懒加载是否已初始化
console.log("Lazy load initialized:", window.lazyLoadInitialized);
```

## ⚠️ 常见问题排查

### 问题 1: 图片不显示

**可能原因**:

- `data-src` 属性值错误
- 图片路径不正确
- IntersectionObserver 未触发

**解决方法**:

```javascript
// 检查图片属性
const img = document.querySelector("img.lazy");
console.log("data-src:", img.dataset.src);
console.log("src:", img.src);
console.log("isIntersecting:" /* 检查可见性 */);
```

### 问题 2: 图片立即加载（未懒加载）

**可能原因**:

- 图片在初始视口内
- rootMargin 设置过大
- IntersectionObserver 配置错误

**解决方法**:

- 检查图片位置
- 调整 rootMargin 值（建议 50px）
- 检查浏览器控制台是否有错误

### 问题 3: 滚动时图片闪烁

**可能原因**:

- 占位符背景色与图片差异大
- 过渡效果未生效
- 图片加载过慢

**解决方法**:

```css
/* 优化占位符样式 */
img.lazy {
  background: #f0f0f0; /* 使用接近图片平均颜色的值 */
  transition: opacity 0.3s ease-in-out;
}
```

## 📈 性能优化建议

### 1. 调整 rootMargin

根据实际场景调整预加载距离：

```javascript
// 快速滚动场景（如长列表）
rootMargin: "100px 0px";

// 慢速浏览场景（如相册）
rootMargin: "50px 0px";

// 精确加载（节省流量）
rootMargin: "0px 0px";
```

### 2. 使用响应式图片

```html
<img
  data-src="/path/to/image.jpg"
  data-srcset="/path/to/image@2x.jpg 2x, /path/to/image@3x.jpg 3x"
  alt="描述"
  class="lazy"
/>
```

### 3. 关键图片不懒加载

对于首屏关键图片（如 Logo），直接加载：

```html
<img src="/path/to/logo.png" alt="Logo" />
```

## ✅ 验收标准

- [ ] 初始加载只加载首屏可见图片
- [ ] 滚动时图片按需加载，无明显延迟
- [ ] 图片加载有平滑的过渡效果
- [ ] 动态内容图片也支持懒加载
- [ ] 在慢速网络下表现良好
- [ ] 性能评分有所提升
- [ ] 所有主流浏览器兼容
- [ ] 无控制台错误

---

**测试日期**: 2026-03-01  
**项目**: 大希智能导游 H5 应用
