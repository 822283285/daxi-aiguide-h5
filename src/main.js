/**
 * 应用主入口文件
 *
 * 职责:
 * 1. 初始化配置服务
 * 2. 初始化状态管理
 * 3. 初始化路由
 * 4. 注册所有页面控制器
 * 5. 启动应用
 */

import { ConfigService } from "./core/config/config-service.js";
import { appState } from "./core/state/state-manager.js";
import { router } from "./core/router/state-router.js";
import { detectEnvironment } from "./core/utils/env-detector.js";
import { routes } from "./core/router/routes.js";
import {
  setupLazyLoad,
  setupBackgroundLazyLoad,
  autoObserveDOMChanges,
} from "./utils/lazy-load.js";

console.log("[App] 大希智能导游 v1.0.0");
console.log("[Main] 应用开始初始化");

/**
 * 隐藏加载页面
 */
function hideFirstPage() {
  const firstPage = document.getElementById('first_page');
  if (firstPage) {
    firstPage.style.display = 'none';
    console.log('[Main] 隐藏加载页面');
  }
}

/**
 * 应用启动函数
 */
async function bootstrap() {
  console.log("[App] Bootstrap started");

  try {
    // 1. 初始化配置服务
    const config = ConfigService.fromWindow(globalThis);
    const env = config.getCurrentEnv();
    console.log("[App] Environment:", env);

    // 2. 检测运行环境
    const platform = detectEnvironment(globalThis);
    console.log("[App] Platform:", platform);

    // 3. 注册所有页面控制器（懒加载）
    await registerAllPageControllersLazy();
    console.log("[App] Page controllers registered (lazy loading enabled)");

    // 4. 初始化路由
    router.init("container", appState);
    console.log("[App] Router initialized");

    // 5. 解析 URL 参数，确定初始页面
    const params = config.getAllQueryParams();
    const initialPage = params.page || "HomePage";

    // 6. 启动应用，导航到初始页面
    appState.setState({
      currentPage: initialPage,
      initialParams: params,
    });

    // 初始化懒加载
    setupLazyLoad();
    setupBackgroundLazyLoad();
    autoObserveDOMChanges(); // 自动观察 DOM 变化，支持动态内容
    console.log("[App] Image lazy loading initialized");

    console.log("[App] Bootstrap completed successfully");
    console.log(`[App] Lazy loading enabled for ${Object.keys(routes).length} pages`);
    console.log('[Main] 应用初始化完成');

    // 确保隐藏加载页面
    setTimeout(() => {
      hideFirstPage();
    }, 100);
  } catch (error) {
    console.error("[App] Bootstrap failed:", error);
    throw error;
  }
}

/**
 * 注册所有页面控制器（懒加载版本）
 * 使用动态导入实现代码分割
 */
function registerAllPageControllersLazy() {
  // 注册所有懒加载路由
  router.registerAllLazy(routes);
  console.log(`[App] Registered ${Object.keys(routes).length} lazy routes`);
}

// 启动应用
bootstrap().catch((error) => {
  console.error("[Main] 应用初始化失败:", error);
  // 即使失败也要隐藏加载页面
  hideFirstPage();
});
