/**
 * 应用全局配置文件
 * 统一管理页面和导航栏配置，避免重复维护
 */

function getStaticAssetBaseUrl() {
  return window.runtimeConfig?.getEnvConfig?.().staticBaseUrl || "https://ar-video.daxicn.com/publicData";
}

/**
 * @type {Array<Object>} 页面和导航栏配置数组
 * 包含所有页面的统一配置信息
 */
const APP_CONFIG = [
  {
    // 地图页（主应用入口，HomePage/ServicePage/ProfilePage 已迁移至 app/navi_app 内部）
    id: 2,
    key: "map",
    name: "地图",
    activeIcon: `${getStaticAssetBaseUrl()}/download/route-active.png`,
    inactiveIcon: `${getStaticAssetBaseUrl()}/download/route-inactive.png`,
    isContainerMode: true,
    href: "../app/navi_app/shouxihu/index_src.html",
    iframeId: "iframe-map",
    src: "../app/navi_app/shouxihu/index_src.html",
  },
  {
    // 讲解页面（非主容器页面，跳转到 uni-app）
    id: 3,
    key: "lecture",
    name: "讲解",
    activeIcon: `${getStaticAssetBaseUrl()}/download/media-active.png`,
    inactiveIcon: `${getStaticAssetBaseUrl()}/download/media-inactive.png`,
    isContainerMode: false,
    href: "/pages/media/player-2",
    iframeId: null,
    src: null,
  },
];

/**
 * 获取所有配置
 * @returns {Array<Object>} 配置数组
 */
function getAppConfig() {
  return APP_CONFIG;
}

/**
 * 根据ID获取配置
 * @param {number} id - 页面ID
 * @returns {Object|null} 配置对象或null
 */
function getConfigById(id) {
  return APP_CONFIG.find((config) => config.id == id) || null;
}

/**
 * 根据key获取配置
 * @param {string} key - 页面key
 * @returns {Object|null} 配置对象或null
 */
function getConfigByKey(key) {
  return APP_CONFIG.find((config) => config.key == key) || null;
}

/**
 * 获取tabbar专用配置（只包含容器模式的页面）
 * @returns {Array<Object>} tabbar配置数组
 */
function getTabbarConfig() {
  return APP_CONFIG.filter((config) => config.isContainerMode);
}

/**
 * 获取iframe页面配置（只包含有iframeId的页面）
 * @returns {Object} iframe页面配置对象，key为页面key
 */
function getPageConfig() {
  const pageConfig = {};
  APP_CONFIG.forEach((config) => {
    if (config.iframeId) {
      pageConfig[config.key] = {
        id: config.id,
        iframeId: config.iframeId,
        src: config.src,
        name: config.name,
      };
    }
  });
  return pageConfig;
}

// 暴露全局接口
window.appConfig = {
  getAppConfig,
  getConfigById,
  getConfigByKey,
  getTabbarConfig,
  getPageConfig,
};
