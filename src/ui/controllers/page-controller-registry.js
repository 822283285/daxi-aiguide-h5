/**
 * 页面控制器注册表
 * 自动注册和管理所有页面控制器
 */
import { router } from "../../core/router/state-router.js";
import { BasePageController, createPageController } from "./base-page-controller.js";

/**
 * 页面控制器注册表类
 */
export class PageControllerRegistry {
  /**
   * 创建注册表实例
   */
  constructor() {
    /** @type {Map} */
    this.registry = new Map();

    /** @type {boolean} */
    this.isInitialized = false;
  }

  /**
   * 注册单个页面控制器
   * @param {string} pageName - 页面名称
   * @param {Class} ControllerClass - 控制器类
   */
  register(pageName, ControllerClass) {
    if (typeof ControllerClass !== "function") {
      console.error("[Registry] ControllerClass must be a constructor function");
      return;
    }

    // 验证是否继承自 BasePageController
    if (!(ControllerClass.prototype instanceof BasePageController)) {
      console.warn(
        `[Registry] ${pageName} does not extend BasePageController`
      );
    }

    this.registry.set(pageName, ControllerClass);
    console.log(`[Registry] Registered: ${pageName}`);
  }

  /**
   * 批量注册页面控制器
   * @param {Object} controllers - 控制器映射表
   */
  registerAll(controllers) {
    Object.entries(controllers).forEach(([pageName, ControllerClass]) => {
      this.register(pageName, ControllerClass);
    });
  }

  /**
   * 获取页面控制器类
   * @param {string} pageName - 页面名称
   * @returns {Class|null}
   */
  get(pageName) {
    return this.registry.get(pageName) || null;
  }

  /**
   * 检查页面是否已注册
   * @param {string} pageName - 页面名称
   * @returns {boolean}
   */
  has(pageName) {
    return this.registry.has(pageName);
  }

  /**
   * 获取所有已注册的页面
   * @returns {Array<string>}
   */
  getAll() {
    return Array.from(this.registry.keys());
  }

  /**
   * 清空注册表
   */
  clear() {
    this.registry.clear();
  }

  /**
   * 获取注册表大小
   * @returns {number}
   */
  size() {
    return this.registry.size;
  }

  /**
   * 自动注册并同步到路由器
   * @param {Object} controllers - 控制器映射表
   */
  autoRegister(controllers) {
    this.registerAll(controllers);

    // 同步到路由器
    this.registry.forEach((ControllerClass, pageName) => {
      router.register(pageName, ControllerClass);
    });

    this.isInitialized = true;
    console.log(
      `[Registry] Auto-registered ${this.registry.size} pages, synced to router`
    );
  }

  /**
   * 导出注册表状态
   * @returns {Object}
   */
  toJSON() {
    return {
      pages: this.getAll(),
      size: this.size(),
      isInitialized: this.isInitialized,
    };
  }
}

/**
 * 创建全局注册表实例
 * @type {PageControllerRegistry}
 */
export const pageControllerRegistry = new PageControllerRegistry();

/**
 * 快捷注册函数
 * @param {string} pageName - 页面名称
 * @param {Class} ControllerClass - 控制器类
 */
export function registerPage(pageName, ControllerClass) {
  pageControllerRegistry.register(pageName, ControllerClass);
}

/**
 * 快捷批量注册函数
 * @param {Object} controllers - 控制器映射表
 */
export function registerAllPages(controllers) {
  pageControllerRegistry.autoRegister(controllers);
}

/**
 * 创建页面控制器的快捷工厂
 * @param {string} pageName - 页面名称
 * @param {Object} methods - 页面方法
 * @returns {Class}
 */
export function definePage(pageName, methods = {}) {
  const ControllerClass = createPageController(pageName, methods);

  // 自动注册
  registerPage(pageName, ControllerClass);

  return ControllerClass;
}
