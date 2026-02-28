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

console.log("[App] 大希智能导游 v1.0.0");

/**
 * 应用启动函数
 */
function bootstrap() {
  console.log("[App] Bootstrap started");

  try {
    // 1. 初始化配置服务
    const config = ConfigService.fromWindow(globalThis);
    const env = config.getCurrentEnv();
    console.log("[App] Environment:", env);

    // 2. 检测运行环境
    const platform = detectEnvironment(globalThis);
    console.log("[App] Platform:", platform);

    // 3. 注册所有页面控制器
    // await registerAllPageControllers();
    console.log("[App] Page controllers registered");

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

    console.log("[App] Bootstrap completed successfully");
  } catch (error) {
    console.error("[App] Bootstrap failed:", error);
    throw error;
  }
}

/**
 * 注册所有页面控制器
 * TODO: 实现控制器自动注册
 */
async function registerAllPageControllers() {
  // 动态导入所有页面控制器
  // const controllers = await import('./ui/controllers/index.js');
  // return controllers;
}

// 启动应用
bootstrap().catch((error) => {
  console.error("[App] Fatal error:", error);
});
