/**
 * @fileoverview API 统一导出文件
 * @description 将所有 API 模块按功能分类导出，提供统一的调用接口
 *             支持自动初始化，无需手动调用 initApi
 * @author daxi
 * @created 2026-02-26
 * @version 2.0
 */

// 导入请求封装（自动初始化）
import { get, post, getAppParams } from './request.js';

// 导入各模块 API
import userApi from './modules/user.js';
import scenicApi from './modules/scenic.js';
import exhibitApi from './modules/exhibit.js';
import searchApi from './modules/search.js';
import footprintApi from './modules/footprint.js';
import paymentApi from './modules/payment.js';
import routeApi from './modules/route.js';
import homeApi from './modules/home.js';
import serviceApi from './modules/service.js';

/**
 * API 模块集合
 */
const apiModules = {
  user: userApi,
  scenic: scenicApi,
  exhibit: exhibitApi,
  search: searchApi,
  footprint: footprintApi,
  payment: paymentApi,
  route: routeApi,
  home: homeApi,
  service: serviceApi,
};

/**
 * 初始化 API 服务（可选，用于手动覆盖配置）
 * @param {Object} config - 初始化配置（可选）
 * @returns {Promise<void>}
 */
async function initApi(config) {
  console.log('[API] 手动初始化 API 服务...', config);
  const { init } = await import('./request.js');
  await init(config);
  console.log('[API] API 服务初始化完成');
}

// 浏览器环境：自动挂载到全局
if (typeof window !== 'undefined') {
  const oldApi = window.DaxiApp?.api;
  
  window.DaxiApp = window.DaxiApp || {};
  window.DaxiApp.api = {
    ...apiModules,
    initApi,
    
    // 兼容旧 API
    updateUserInfo: (...args) => {
      console.warn('[API] updateUserInfo 已废弃，请使用 api.user.updateUserInfo');
      return userApi.updateUserInfo(...args);
    },
    getUserInfo: (...args) => {
      console.warn('[API] getUserInfo 已废弃，请使用 api.user.getUserInfo');
      return userApi.getUserInfo(...args);
    },
    getScenicConfig: (...args) => {
      console.warn('[API] getScenicConfig 已废弃，请使用 api.scenic.getScenicConfig');
      return scenicApi.getScenicConfig(...args);
    },
    getExhibitAll: (...args) => {
      console.warn('[API] getExhibitAll 已废弃，请使用 api.exhibit.getExhibitAll');
      return exhibitApi.getExhibitAll(...args);
    },
    getExplainAll: (...args) => {
      console.warn('[API] getExplainAll 已废弃，请使用 api.exhibit.getExhibitExplainAll');
      return exhibitApi.getExhibitExplainAll(...args);
    },
    getSearchHotWords: (...args) => {
      console.warn('[API] getSearchHotWords 已废弃，请使用 api.search.getHotWords');
      return searchApi.getHotWords(...args);
    },
    cacheTokenAndBDID: (...args) => {
      console.warn('[API] cacheTokenAndBDID 已废弃，请使用 api.payment.cacheTokenAndBDID');
      return paymentApi.cacheTokenAndBDID(...args);
    },
    getFootprints: (...args) => {
      console.warn('[API] getFootprints 已废弃，请使用 api.footprint.getFootprints');
      return footprintApi.getFootprints(...args);
    },
    getExhibitByNum: (...args) => {
      console.warn('[API] getExhibitByNum 已废弃，请使用 api.exhibit.getExhibitByNum');
      return exhibitApi.getExhibitByNum(...args);
    },
    getHomePageConfig: (...args) => {
      console.warn('[API] getHomePageConfig 已废弃，请使用 api.home.getPageConfig');
      return homeApi.getPageConfig(...args);
    },
    getServicePageConfig: (...args) => {
      console.warn('[API] getServicePageConfig 已废弃，请使用 api.service.getPageConfig');
      return serviceApi.getServicePageConfig(...args);
    },
    getRouteAll: (...args) => {
      console.warn('[API] getRouteAll 已废弃，请使用 api.route.getRouteAll');
      return routeApi.getRouteAll(...args);
    },
    ...(oldApi || {}),
  };
  
  console.log('[API] API 模块已挂载到 window.DaxiApp.api，支持自动初始化');
}

// ES6 导出
export {
  initApi,
  apiModules as api,
  userApi as user,
  scenicApi as scenic,
  exhibitApi as exhibit,
  searchApi as search,
  footprintApi as footprint,
  paymentApi as payment,
  routeApi as route,
  homeApi as home,
  serviceApi as service,
};

// CommonJS 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initApi,
    api: apiModules,
    user: userApi,
    scenic: scenicApi,
    exhibit: exhibitApi,
    search: searchApi,
    footprint: footprintApi,
    payment: paymentApi,
    route: routeApi,
    home: homeApi,
    service: serviceApi,
  };
}
