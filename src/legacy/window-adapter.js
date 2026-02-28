/**
 * Window Adapter
 * 封装所有对 window 的直接访问，逐步消除全局依赖
 *
 * 使用方式:
 * import { WindowAdapter } from '@/legacy/window-adapter.js';
 * const adapter = new WindowAdapter();
 *
 * // 替代 window.DaxiApp
 * adapter.daxiApp
 *
 * // 替代 window.location
 * adapter.location.href
 *
 * // 替代 window.getParam()
 * adapter.getParam('key')
 */

/**
 * WindowAdapter 类
 */
export class WindowAdapter {
  /**
   * 创建 WindowAdapter 实例
   * @param {Object} globalRef - 全局对象引用，默认为 window
   */
  constructor(globalRef = null) {
    /** @type {Object} */
    this.globalRef = globalRef || (typeof window !== "undefined" ? window : globalThis);

    /** @type {Object} 缓存的 DaxiApp 引用 */
    this._daxiApp = null;
  }

  /**
   * 获取全局对象
   * @returns {Object} 全局对象
   */
  getGlobal() {
    return this.globalRef;
  }

  /**
   * 获取 DaxiApp 命名空间
   * @returns {Object} DaxiApp 对象
   */
  get daxiApp() {
    if (!this._daxiApp) {
      this._daxiApp = this.globalRef.DaxiApp || (this.globalRef.DaxiApp = {});
    }
    return this._daxiApp;
  }

  /**
   * 设置 DaxiApp 命名空间
   * @param {Object} value - DaxiApp 对象
   */
  set daxiApp(value) {
    this.globalRef.DaxiApp = value;
    this._daxiApp = value;
  }

  /**
   * 获取 location 对象
   * @returns {Location} location 对象
   */
  get location() {
    return this.globalRef.location;
  }

  /**
   * 获取当前 URL
   * @returns {string} 当前 URL
   */
  get currentUrl() {
    return this.globalRef.location?.href || "";
  }

  /**
   * 获取 URL 参数
   * @param {string} key - 参数名
   * @returns {string|null} 参数值
   */
  getParam(key) {
    if (typeof this.globalRef.getParam === "function") {
      return this.globalRef.getParam(key);
    }

    // 备用方案：使用 URLSearchParams
    try {
      const url = this.currentUrl;
      const urlObj = new URL(url);
      return urlObj.searchParams.get(key);
    } catch (e) {
      return null;
    }
  }

  /**
   * 获取所有 URL 参数
   * @returns {Object} 参数对象
   */
  getAllParams() {
    if (typeof this.globalRef.getAllParams === "function") {
      return this.globalRef.getAllParams();
    }

    // 备用方案
    try {
      const url = this.currentUrl;
      const urlObj = new URL(url);
      const params = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      return params;
    } catch (e) {
      return {};
    }
  }

  /**
   * 获取 CryptoJS
   * @returns {Object} CryptoJS 对象
   */
  get cryptoJS() {
    return this.globalRef.CryptoJS || null;
  }

  /**
   * 获取 MD5 函数
   * @returns {Function} MD5 函数
   */
  get md5() {
    return this.globalRef.MD5 || null;
  }

  /**
   * 获取 signMd5Utils
   * @returns {Object} signMd5Utils 对象
   */
  get signMd5Utils() {
    return this.globalRef.signMd5Utils || null;
  }

  /**
   * 获取 axios
   * @returns {Object} axios 对象
   */
  get axios() {
    return this.globalRef.axios || null;
  }

  /**
   * 获取 Zepto
   * @returns {Object} Zepto 对象
   */
  get zepto() {
    return this.globalRef.Zepto || this.globalRef.$ || null;
  }

  /**
   * 获取 DXDomUtil
   * @returns {Object} DXDomUtil 对象
   */
  get dxDomUtil() {
    return this.globalRef.DXDomUtil || null;
  }

  /**
   * 获取 command 函数
   * @returns {Function} command 函数
   */
  get command() {
    return this.globalRef.command || null;
  }

  /**
   * 获取 locWebSocketPostMessage 函数
   * @returns {Function} locWebSocketPostMessage 函数
   */
  get locWebSocketPostMessage() {
    return this.globalRef.locWebSocketPostMessage || null;
  }

  /**
   * 设置 DaxiApp.api
   * @param {Object} api - API 对象
   */
  setDaxiAppApi(api) {
    this.daxiApp.api = api;
  }

  /**
   * 获取 DaxiApp.api
   * @returns {Object} API 对象
   */
  getDaxiAppApi() {
    return this.daxiApp.api || null;
  }

  /**
   * 设置 DaxiApp 命名空间的属性
   * @param {string} key - 属性名
   * @param {*} value - 属性值
   */
  setDaxiAppProp(key, value) {
    this.daxiApp[key] = value;
  }

  /**
   * 获取 DaxiApp 命名空间的属性
   * @param {string} key - 属性名
   * @returns {*} 属性值
   */
  getDaxiAppProp(key) {
    return this.daxiApp[key] || null;
  }

  /**
   * 检查是否支持某个全局 API
   * @param {string} name - API 名称
   * @returns {boolean} 是否支持
   */
  hasGlobal(name) {
    return name in this.globalRef;
  }

  /**
   * 获取用户代理
   * @returns {string} User Agent
   */
  get userAgent() {
    return this.globalRef.navigator?.userAgent || "";
  }

  /**
   * 检查是否在微信环境
   * @returns {boolean} 是否在微信
   */
  get isWeChat() {
    const ua = this.userAgent;
    return /MicroMessenger/i.test(ua);
  }

  /**
   * 检查是否在 iOS 环境
   * @returns {boolean} 是否在 iOS
   */
  get isIOS() {
    const ua = this.userAgent;
    return /iPhone|iPad|iPod/i.test(ua);
  }

  /**
   * 检查是否在 Android 环境
   * @returns {boolean} 是否在 Android
   */
  get isAndroid() {
    const ua = this.userAgent;
    return /Android/i.test(ua);
  }

  /**
   * 检查是否在移动端
   * @returns {boolean} 是否在移动端
   */
  get isMobile() {
    return this.isIOS || this.isAndroid;
  }

  /**
   * 获取设备类型
   * @returns {string} 设备类型 (ios/android/wechat/web)
   */
  get deviceType() {
    if (this.isWeChat) return "wechat";
    if (this.isIOS) return "ios";
    if (this.isAndroid) return "android";
    return "web";
  }

  /**
   * 导航到指定 URL
   * @param {string} url - URL
   */
  navigateTo(url) {
    if (this.globalRef.location) {
      this.globalRef.location.href = url;
    }
  }

  /**
   * 替换当前 URL
   * @param {string} url - URL
   */
  replaceUrl(url) {
    if (this.globalRef.location) {
      this.globalRef.location.replace(url);
    }
  }

  /**
   * 返回上一页
   */
  back() {
    if (this.globalRef.history) {
      this.globalRef.history.back();
    }
  }

  /**
   * 前进一页
   */
  forward() {
    if (this.globalRef.history) {
      this.globalRef.history.forward();
    }
  }

  /**
   * 刷新页面
   */
  reload() {
    if (this.globalRef.location) {
      this.globalRef.location.reload();
    }
  }

  /**
   * 打开新窗口
   * @param {string} url - URL
   * @param {string} target - 目标窗口
   * @param {string} features - 特性
   * @returns {Window|null} 新窗口
   */
  openWindow(url, target, features) {
    if (this.globalRef.open) {
      return this.globalRef.open(url, target, features);
    }
    return null;
  }

  /**
   * 关闭当前窗口
   */
  closeWindow() {
    if (this.globalRef.close) {
      this.globalRef.close();
    }
  }

  /**
   * 设置 localStorage
   * @param {string} key - 键
   * @param {*} value - 值
   */
  setLocalStorage(key, value) {
    try {
      const str = typeof value === "string" ? value : JSON.stringify(value);
      this.globalRef.localStorage?.setItem(key, str);
    } catch (e) {
      console.warn("[WindowAdapter] localStorage setItem failed:", e);
    }
  }

  /**
   * 获取 localStorage
   * @param {string} key - 键
   * @returns {*} 值
   */
  getLocalStorage(key) {
    try {
      const str = this.globalRef.localStorage?.getItem(key);
      if (str === null) return null;
      try {
        return JSON.parse(str);
      } catch {
        return str;
      }
    } catch (e) {
      console.warn("[WindowAdapter] localStorage getItem failed:", e);
      return null;
    }
  }

  /**
   * 移除 localStorage
   * @param {string} key - 键
   */
  removeLocalStorage(key) {
    try {
      this.globalRef.localStorage?.removeItem(key);
    } catch (e) {
      console.warn("[WindowAdapter] localStorage removeItem failed:", e);
    }
  }

  /**
   * 清空 localStorage
   */
  clearLocalStorage() {
    try {
      this.globalRef.localStorage?.clear();
    } catch (e) {
      console.warn("[WindowAdapter] localStorage clear failed:", e);
    }
  }

  /**
   * 设置 sessionStorage
   * @param {string} key - 键
   * @param {*} value - 值
   */
  setSessionStorage(key, value) {
    try {
      const str = typeof value === "string" ? value : JSON.stringify(value);
      this.globalRef.sessionStorage?.setItem(key, str);
    } catch (e) {
      console.warn("[WindowAdapter] sessionStorage setItem failed:", e);
    }
  }

  /**
   * 获取 sessionStorage
   * @param {string} key - 键
   * @returns {*} 值
   */
  getSessionStorage(key) {
    try {
      const str = this.globalRef.sessionStorage?.getItem(key);
      if (str === null) return null;
      try {
        return JSON.parse(str);
      } catch {
        return str;
      }
    } catch (e) {
      console.warn("[WindowAdapter] sessionStorage getItem failed:", e);
      return null;
    }
  }

  /**
   * 导出 WindowAdapter 状态用于调试
   * @returns {Object} 状态快照
   */
  toJSON() {
    return {
      deviceType: this.deviceType,
      isMobile: this.isMobile,
      isWeChat: this.isWeChat,
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      hasCryptoJS: Boolean(this.cryptoJS),
      hasMD5: Boolean(this.md5),
      hasSignMd5Utils: Boolean(this.signMd5Utils),
      hasAxios: Boolean(this.axios),
      hasZepto: Boolean(this.zepto),
      hasDaxiApp: Boolean(this.globalRef.DaxiApp),
      currentUrl: this.currentUrl,
    };
  }
}

/**
 * 创建全局 WindowAdapter 实例
 * @type {WindowAdapter}
 */
export const windowAdapter = new WindowAdapter();

/**
 * 快捷访问函数
 */

// DaxiApp 访问
export const getDaxiApp = () => windowAdapter.daxiApp;
export const setDaxiApp = (value) => {
  windowAdapter.daxiApp = value;
};
export const getDaxiAppProp = (key) => windowAdapter.getDaxiAppProp(key);
export const setDaxiAppProp = (key, value) => windowAdapter.setDaxiAppProp(key, value);

// URL 参数访问
export const getParam = (key) => windowAdapter.getParam(key);
export const getAllParams = () => windowAdapter.getAllParams();

// 库访问
export const getCryptoJS = () => windowAdapter.cryptoJS;
export const getMD5 = () => windowAdapter.md5;
export const getSignMd5Utils = () => windowAdapter.signMd5Utils;
export const getAxios = () => windowAdapter.axios;
export const getZepto = () => windowAdapter.zepto;

// 环境检测
export const getDeviceType = () => windowAdapter.deviceType;
export const isMobile = () => windowAdapter.isMobile;
export const isWeChat = () => windowAdapter.isWeChat;
export const isIOS = () => windowAdapter.isIOS;
export const isAndroid = () => windowAdapter.isAndroid;

// 导航
export const navigateTo = (url) => windowAdapter.navigateTo(url);
export const replaceUrl = (url) => windowAdapter.replaceUrl(url);
export const back = () => windowAdapter.back();

// Storage
export const setLocal = (key, value) => windowAdapter.setLocalStorage(key, value);
export const getLocal = (key) => windowAdapter.getLocalStorage(key);
export const removeLocal = (key) => windowAdapter.removeLocalStorage(key);
export const clearLocal = () => windowAdapter.clearLocalStorage();

export const setSession = (key, value) => windowAdapter.setSessionStorage(key, value);
export const getSession = (key) => windowAdapter.getSessionStorage(key);
