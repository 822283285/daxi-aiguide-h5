# 优化实施清单

**项目**: daxi-aiguide-h5  
**创建日期**: 2026-03-01  
**状态**: 待实施

---

## 📋 总览

本文档提供性能优化的详细实施清单，按优先级和阶段分类。

### 优先级说明

- 🔴 **P0**: 高优先级，快速收益，立即实施
- 🟡 **P1**: 中优先级，重要优化，短期实施
- 🟢 **P2**: 低优先级，深度优化，中期实施
- 🔵 **P3**: 长期优化，持续改进

---

## 🔴 P0: 快速收益 (1-2 天)

### 1. 图片压缩优化

**目标**: 减少图片资源体积 50%+

#### 任务清单

- [ ] **1.1** 安装图片优化工具
  ```bash
  pnpm add -D vite-plugin-image-optimizer
  ```

- [ ] **1.2** 配置 Vite 插件
  ```javascript
  // vite.config.js
  import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
  
  plugins: [
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 75 },
      jpg: { quality: 75 },
      webp: { quality: 75 }
    })
  ]
  ```

- [ ] **1.3** 压缩大图资源
  - autoDescTip.png (360KB → <100KB)
  - loading_bg 系列 (250-340KB → <80KB)
  - jingdian 系列 (200-240KB → <100KB)
  - voiceBg 系列 (160-230KB → <60KB)

- [ ] **1.4** 验证压缩效果
  ```bash
  pnpm build
  ls -lhS dist/assets/ | head -20
  ```

**预期收益**: 资源体积减少 40-50%  
**实施时间**: 2-3 小时  
**风险**: 低

---

### 2. 转换 WebP 格式

**目标**: 使用现代图片格式，减少体积 30%+

#### 任务清单

- [ ] **2.1** 配置 WebP 转换
  ```javascript
  // vite.config.js
  ViteImageOptimizer({
    webp: { quality: 75, lossless: false }
  })
  ```

- [ ] **2.2** 更新 HTML/JS 引用
  ```html
  <!-- 使用 picture 标签提供多格式支持 -->
  <picture>
    <source srcset="image.webp" type="image/webp">
    <img src="image.jpg" alt="description">
  </picture>
  ```

- [ ] **2.3** 测试浏览器兼容性
  - Chrome/Edge: ✅ 支持
  - Firefox: ✅ 支持
  - Safari: ✅ 支持 (iOS 14+)
  - 旧浏览器：降级到 JPG/PNG

**预期收益**: 图片体积减少 30-40%  
**实施时间**: 2-3 小时  
**风险**: 低

---

### 3. 配置 Terser 压缩

**目标**: 移除生产环境 console，减少 bundle 体积

#### 任务清单

- [ ] **3.1** 更新 Vite 配置
  ```javascript
  // vite.config.js
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      }
    }
  }
  ```

- [ ] **3.2** 构建验证
  ```bash
  pnpm build
  # 检查 dist 中是否还有 console.log
  ```

- [ ] **3.3** 保留开发环境 console
  ```javascript
  // 开发环境不启用 terser 优化
  // 生产环境自动启用
  ```

**预期收益**: JS 体积减少 5-10%  
**实施时间**: 30 分钟  
**风险**: 低 (注意不要移除错误日志)

---

### 4. 启用 Gzip/Brotli 压缩

**目标**: 服务器端压缩，减少传输体积 70%+

#### 任务清单

- [ ] **4.1** 配置 Nginx Gzip
  ```nginx
  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
  ```

- [ ] **4.2** 配置 Brotli (可选)
  ```nginx
  brotli on;
  brotli_comp_level 6;
  brotli_types text/plain text/css application/json application/javascript;
  ```

- [ ] **4.3** 验证压缩效果
  ```bash
  curl -H "Accept-Encoding: gzip" -I https://your-domain.com/assets/main.js
  ```

**预期收益**: 传输体积减少 70%+  
**实施时间**: 1-2 小时  
**风险**: 低

---

## 🟡 P1: 重要优化 (3-5 天)

### 5. 代码分割配置

**目标**: 按需加载，减少首屏 bundle 体积 50%+

#### 任务清单

- [ ] **5.1** 分析当前 bundle
  ```bash
  pnpm build
  # 查看 dist/assets 文件大小
  ```

- [ ] **5.2** 配置 manualChunks
  ```javascript
  // vite.config.js
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 第三方依赖
          'vendor-core': ['zepto', 'crypto-js'],
          'vendor-polyfills': ['core-js'],
          
          // SDK
          'map-sdk': ['@map_sdk'],
          'jsbridge': ['@jsbridge'],
          
          // 按功能模块
          'page-home': ['./src/ui/pages/home'],
          'page-scenic': ['./src/ui/pages/scenic'],
          'page-route': ['./src/ui/pages/route']
        }
      }
    }
  }
  ```

- [ ] **5.3** 测试按需加载
  ```bash
  pnpm build
  # 检查是否生成了多个 chunk
  ```

- [ ] **5.4** 性能测试
  - 首屏加载时间
  - 总请求数
  - 总传输体积

**预期收益**: 首屏加载减少 50%+  
**实施时间**: 1-2 天  
**风险**: 中 (需测试所有页面)

---

### 6. 路由懒加载

**目标**: 按需加载页面代码，减少初始加载

#### 任务清单

- [ ] **6.1** 实现动态导入
  ```javascript
  // src/core/router/state-router.js
  const pageLoaders = {
    HomePage: () => import('@ui/pages/home/HomePage.js'),
    ScenicPage: () => import('@ui/pages/scenic/ScenicPage.js'),
    RoutePage: () => import('@ui/pages/route/RoutePage.js'),
    ServicePage: () => import('@ui/pages/service/ServicePage.js'),
    UserPage: () => import('@ui/pages/user/UserPage.js')
  };
  
  async function loadPage(pageName) {
    const loader = pageLoaders[pageName];
    if (!loader) throw new Error(`Page not found: ${pageName}`);
    
    const module = await loader();
    return module.default;
  }
  ```

- [ ] **6.2** 更新路由逻辑
  ```javascript
  // 导航时动态加载页面
  async navigateTo(pageName, params) {
    const PageComponent = await loadPage(pageName);
    const page = new PageComponent(params);
    page.init();
  }
  ```

- [ ] **6.3** 添加加载状态
  ```javascript
  // 显示 loading 指示器
  function showLoading() {
    document.getElementById('loading').style.display = 'block';
  }
  
  function hideLoading() {
    document.getElementById('loading').style.display = 'none';
  }
  ```

- [ ] **6.4** 测试所有路由
  - 首页
  - 景点页
  - 路线页
  - 服务页
  - 用户页

**预期收益**: 初始加载减少 60%+  
**实施时间**: 1-2 天  
**风险**: 中 (需充分测试)

---

### 7. 图片懒加载

**目标**: 按需加载图片，减少首屏请求

#### 任务清单

- [ ] **7.1** 实现懒加载工具
  ```javascript
  // src/utils/lazy-load.js
  export function setupLazyLoad() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  }
  ```

- [ ] **7.2** 更新 HTML 模板
  ```html
  <!-- 使用 data-src 代替 src -->
  <img data-src="image.jpg" alt="description" class="lazy">
  ```

- [ ] **7.3** 添加占位图
  ```css
  img.lazy {
    background: #f0f0f0;
    min-height: 200px;
  }
  ```

- [ ] **7.4** 初始化懒加载
  ```javascript
  // src/main.js
  import { setupLazyLoad } from '@utils/lazy-load';
  
  function bootstrap() {
    // ... 其他初始化
    setupLazyLoad();
  }
  ```

**预期收益**: 首屏图片请求减少 70%+  
**实施时间**: 3-4 小时  
**风险**: 低

---

### 8. Polyfill 优化

**目标**: 按需加载 Polyfill，减少 legacy bundle 体积

#### 任务清单

- [ ] **8.1** 更新 legacy 插件配置
  ```javascript
  // vite.config.js
  import legacy from '@vitejs/plugin-legacy';
  
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11', 'iOS >= 10', 'Android >= 5'],
      modernPolyfills: true, // 现代浏览器按需 polyfill
      renderLegacyChunks: true,
      polyfills: [
        // 只包含必需的 polyfills
        'es.promise',
        'es.array.iterator',
        'es.object.entries'
      ]
    })
  ]
  ```

- [ ] **8.2** 测试现代浏览器
  - Chrome/Edge: 不加载 legacy polyfills
  - Firefox: 不加载 legacy polyfills
  - Safari: 不加载 legacy polyfills

- [ ] **8.3** 测试旧浏览器
  - iOS 10: 加载必需 polyfills
  - Android 5: 加载必需 polyfills

**预期收益**: Legacy bundle 减少 30-40%  
**实施时间**: 2-3 小时  
**风险**: 中 (需测试兼容性)

---

## 🟢 P2: 深度优化 (1-2 周)

### 9. Service Worker 缓存

**目标**: 离线缓存，提升重复访问速度

#### 任务清单

- [ ] **9.1** 安装插件
  ```bash
  pnpm add -D vite-plugin-pwa
  ```

- [ ] **9.2** 配置插件
  ```javascript
  // vite.config.js
  import { VitePWA } from 'vite-plugin-pwa';
  
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 天
              }
            }
          }
        ]
      }
    })
  ]
  ```

- [ ] **9.3** 测试离线功能
  - 断网访问
  - 缓存更新
  - 版本升级

**预期收益**: 重复访问速度提升 80%+  
**实施时间**: 1-2 天  
**风险**: 中 (需测试缓存策略)

---

### 10. 资源预加载

**目标**: 提前加载关键资源，提升首屏速度

#### 任务清单

- [ ] **10.1** 配置关键资源预加载
  ```html
  <!-- index.html -->
  <head>
    <link rel="preload" href="/assets/main.css" as="style">
    <link rel="preload" href="/assets/vendor-core.js" as="script">
    <link rel="prefetch" href="/assets/polyfills-legacy.js" as="script">
  </head>
  ```

- [ ] **10.2** 动态预加载下一页资源
  ```javascript
  // 用户浏览首页时，预加载景点页
  function preloadNextPage() {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/assets/page-scenic.js';
    document.head.appendChild(link);
  }
  ```

- [ ] **10.3** 预加载关键图片
  ```html
  <link rel="preload" as="image" href="/assets/logo.webp">
  ```

**预期收益**: 首屏加载时间减少 20-30%  
**实施时间**: 2-3 小时  
**风险**: 低

---

### 11. CSS 优化

**目标**: 减少 CSS 体积，提升渲染性能

#### 任务清单

- [ ] **11.1** 移除未使用 CSS
  ```bash
  pnpm add -D @fullhuman/postcss-purgecss
  ```

- [ ] **11.2** CSS 压缩
  ```javascript
  // vite.config.js 已启用
  build: {
    cssMinify: true
  }
  ```

- [ ] **11.3** 提取关键 CSS
  ```html
  <!-- 内联关键 CSS -->
  <style>
    /* 首屏必需样式 */
    body { margin: 0; }
    .header { height: 60px; }
  </style>
  ```

- [ ] **11.4** 异步加载非关键 CSS
  ```html
  <link rel="preload" href="non-critical.css" as="style" onload="this.rel='stylesheet'">
  ```

**预期收益**: CSS 体积减少 30-40%  
**实施时间**: 3-4 小时  
**风险**: 低

---

## 🔵 P3: 长期优化 (持续改进)

### 12. 性能监控

**目标**: 持续监控性能指标

#### 任务清单

- [ ] **12.1** 集成 Web Vitals
  ```bash
  pnpm add web-vitals
  ```

- [ ] **12.2** 上报性能数据
  ```javascript
  // src/utils/performance-monitor.js
  import { getCLS, getFID, getFCP, getLCP } from 'web-vitals';
  
  export function reportWebVitals(onReport) {
    getCLS(onReport);
    getFID(onReport);
    getFCP(onReport);
    getLCP(onReport);
  }
  ```

- [ ] **12.3** 配置性能预算
  ```javascript
  // vite.config.js
  build: {
    chunkSizeWarningLimit: 500
  }
  ```

- [ ] **12.4** 接入监控平台
  - Google Analytics
  - 自建监控服务
  - 第三方监控平台

**预期收益**: 持续性能改进  
**实施时间**: 1-2 天  
**风险**: 低

---

### 13. CDN 部署

**目标**: 全球加速，减少延迟

#### 任务清单

- [ ] **13.1** 选择 CDN 服务商
  - Cloudflare
  - 阿里云 CDN
  - 腾讯云 CDN

- [ ] **13.2** 配置构建输出
  ```javascript
  // vite.config.js
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
  ```

- [ ] **13.3** 配置缓存策略
  - 静态资源：1 年
  - HTML 文件：不缓存
  - API 响应：根据业务

**预期收益**: 全球访问速度提升 50%+  
**实施时间**: 2-3 天  
**风险**: 中 (需配置 DNS)

---

### 14. TypeScript 迁移

**目标**: 提升类型安全，减少运行时错误

#### 任务清单

- [ ] **14.1** 安装 TypeScript
  ```bash
  pnpm add -D typescript @types/node
  ```

- [ ] **14.2** 配置 tsconfig.json
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "ESNext",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true
    }
  }
  ```

- [ ] **14.3** 逐步迁移文件
  - 先迁移工具函数
  - 再迁移核心服务
  - 最后迁移业务逻辑

- [ ] **14.4** 配置 Vite 支持
  ```javascript
  // vite.config.js 已支持
  ```

**预期收益**: 类型安全，减少 bug  
**实施时间**: 1-2 周  
**风险**: 高 (工作量大)

---

## 📊 实施进度追踪

### 阶段统计

| 阶段 | 任务数 | 已完成 | 进度 |
|------|--------|--------|------|
| P0: 快速收益 | 4 | 0 | 0% |
| P1: 重要优化 | 4 | 0 | 0% |
| P2: 深度优化 | 3 | 0 | 0% |
| P3: 长期优化 | 3 | 0 | 0% |
| **总计** | **14** | **0** | **0%** |

### 预期效果

| 优化类别 | 优化前 | 优化后 | 提升 |
|----------|--------|--------|------|
| 首屏加载时间 | ~3.5s | ~1.2s | 65% ↓ |
| JS Bundle 总量 | ~284KB | ~150KB | 47% ↓ |
| 图片资源总量 | ~5.3MB | ~2.0MB | 62% ↓ |
| Lighthouse 性能 | ~65 | ~85+ | 30% ↑ |

---

## 📝 实施记录

### 2026-03-01

- [x] 创建优化实施清单
- [x] 生成性能优化报告
- [x] 创建开发者文档
- [x] 更新 README.md

### 待实施

- [ ] P0-1: 图片压缩优化
- [ ] P0-2: 转换 WebP 格式
- [ ] P0-3: 配置 Terser 压缩
- [ ] P0-4: 启用 Gzip/Brotli 压缩

---

## 📚 参考资料

- [Vite 性能优化](https://vitejs.dev/guide/performance.html)
- [Web Vitals](https://web.dev/vitals/)
- [图片优化最佳实践](https://web.dev/fast/#optimize-your-images)
- [代码分割](https://web.dev/code-splitting/)

---

**维护者**: 大希团队  
**最后更新**: 2026-03-01
