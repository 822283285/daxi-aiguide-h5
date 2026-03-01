/**
 * 路由懒加载配置
 * 使用动态导入实现代码分割
 */

/**
 * 页面路由映射表
 * 每个页面使用动态导入，实现懒加载
 */
export const routes = {
  // 首页
  HomePage: () => import("@ui/pages/home-page/index.js"),

  // 服务页面
  ServicePage: () => import("@ui/pages/service-page/index.js"),

  // 地图状态页面
  MapStateBrowse: () => import("@ui/pages/map-state-browse/index.js"),
  MapStateRoute: () => import("@ui/pages/map-state-route/index.js"),
  MapStateNavi: () => import("@ui/pages/map-state-navi/index.js"),
  MapStatePOI: () => import("@ui/pages/map-state-p-o-i/index.js"),
  MapStateSearch: () => import("@ui/pages/map-state-search/index.js"),

  // 其他页面
  ProfilePage: () => import("@ui/pages/profile-page/index.js"),
  POIDetailPage: () => import("@ui/pages/p-o-i-detail-page/index.js"),
  PayResultPage: () => import("@ui/pages/pay-result-page/index.js"),
  AboutPage: () => import("@ui/pages/about-page/index.js"),
};

/**
 * 异步加载页面控制器
 * @param {string} pageName - 页面名称
 * @returns {Promise<Class>} 控制器类
 */
export async function loadPageController(pageName) {
  const importFn = routes[pageName];

  if (!importFn) {
    console.error(`[Routes] Page not found: ${pageName}`);
    return null;
  }

  try {
    const module = await importFn();
    // 查找导出的控制器类（通常以 Controller 结尾）
    const controllerExport = Object.entries(module).find(([key]) =>
      key.endsWith("Controller")
    );

    if (controllerExport) {
      return controllerExport[1];
    }

    // 如果没有找到 Controller，尝试查找默认导出
    if (module.default) {
      return module.default;
    }

    console.error(`[Routes] No controller found for: ${pageName}`);
    return null;
  } catch (error) {
    console.error(`[Routes] Failed to load page: ${pageName}`, error);
    return null;
  }
}

/**
 * 预加载指定页面
 * @param {string} pageName - 页面名称
 * @returns {Promise<void>}
 */
export async function preloadPage(pageName) {
  if (routes[pageName]) {
    await routes[pageName]();
  }
}

/**
 * 预加载多个页面
 * @param {Array<string>} pageNames - 页面名称列表
 * @returns {Promise<void>}
 */
export async function preloadPages(pageNames) {
  await Promise.all(pageNames.map((name) => preloadPage(name)));
}

/**
 * 获取所有已配置的页面名称
 * @returns {Array<string>} 页面名称列表
 */
export function getAllPageNames() {
  return Object.keys(routes);
}
