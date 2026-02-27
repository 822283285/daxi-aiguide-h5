/**
 * 页面控制器基类
 * 所有页面控制器都应继承此类
 * 
 * @class BasePageController
 */
export class BasePageController {
  /**
   * 创建页面控制器实例
   * @param {Object} options - 配置选项
   * @param {HTMLElement} options.container - 容器元素
   * @param {StateRouter} options.router - 路由实例
   * @param {Object} options.params - 页面参数
   */
  constructor(options = {}) {
    /** @type {HTMLElement} */
    this.container = options.container || null;

    /** @type {StateRouter} */
    this.router = options.router || null;

    /** @type {Object} */
    this.params = options.params || {};

    /** @type {boolean} */
    this.isCreated = false;

    /** @type {boolean} */
    this.isVisible = false;

    /** @type {Array} */
    this.eventListeners = [];

    /** @type {string} 页面标识符，子类应重写 */
    this.pageName = "BasePage";
  }

  /**
   * 页面创建时调用（生命周期）
   * @param {Object} params - 页面参数
   * @returns {Promise<void>|void}
   */
  async onCreate(params) {
    console.log(`[Page] onCreate: ${this.pageName}`, params);
    this.isCreated = true;
  }

  /**
   * 页面显示时调用（生命周期）
   * @returns {Promise<void>|void}
   */
  async onShow() {
    console.log(`[Page] onShow: ${this.pageName}`);
    this.isVisible = true;
  }

  /**
   * 页面隐藏时调用（生命周期）
   * @returns {Promise<void>|void}
   */
  async onHide() {
    console.log(`[Page] onHide: ${this.pageName}`);
    this.isVisible = false;
  }

  /**
   * 页面销毁时调用（生命周期）
   * @returns {Promise<void>|void}
   */
  async onDestroy() {
    console.log(`[Page] onDestroy: ${this.pageName}`);
    this.isCreated = false;
    this.isVisible = false;
    this.removeAllEventListeners();
  }

  /**
   * 获取容器元素
   * @returns {HTMLElement} 容器元素
   */
  getContainer() {
    return this.container;
  }

  /**
   * 获取路由实例
   * @returns {StateRouter} 路由实例
   */
  getRouter() {
    return this.router;
  }

  /**
   * 获取页面参数
   * @returns {Object} 页面参数
   */
  getParams() {
    return { ...this.params };
  }

  /**
   * 获取单个参数
   * @param {string} key - 参数名
   * @param {*} defaultValue - 默认值
   * @returns {*} 参数值
   */
  getParam(key, defaultValue = undefined) {
    return key in this.params ? this.params[key] : defaultValue;
  }

  /**
   * 导航到指定页面
   * @param {string} pageName - 页面名称
   * @param {Object} params - 参数
   * @returns {Promise<boolean>} 是否成功
   */
  async navigateTo(pageName, params = {}) {
    if (!this.router) {
      console.error("[Page] Router not initialized");
      return false;
    }
    return await this.router.navigate(pageName, params);
  }

  /**
   * 返回上一页
   * @returns {boolean} 是否成功
   */
  back() {
    if (!this.router) {
      console.error("[Page] Router not initialized");
      return false;
    }
    return this.router.back();
  }

  /**
   * 返回到指定页面
   * @param {string} pageName - 页面名称
   * @returns {boolean} 是否成功
   */
  backTo(pageName) {
    if (!this.router) {
      console.error("[Page] Router not initialized");
      return false;
    }
    return this.router.backTo(pageName);
  }

  /**
   * 替换当前页面
   * @param {string} pageName - 页面名称
   * @param {Object} params - 参数
   * @returns {Promise<boolean>} 是否成功
   */
  async replaceCurrent(pageName, params = {}) {
    if (!this.router) {
      console.error("[Page] Router not initialized");
      return false;
    }
    return await this.router.replace(pageName, params);
  }

  /**
   * 获取当前应用状态
   * @returns {Object} 应用状态
   */
  getAppState() {
    if (!this.router || !this.router.appState) {
      console.error("[Page] AppState not available");
      return null;
    }
    return this.router.appState.getState();
  }

  /**
   * 更新应用状态
   * @param {Function|Object} updater - 状态更新器
   */
  updateAppState(updater) {
    if (!this.router || !this.router.appState) {
      console.error("[Page] AppState not available");
      return;
    }
    this.router.appState.setState(updater);
  }

  /**
   * 订阅应用状态变化
   * @param {Function} listener - 监听器函数
   * @returns {Function} 取消订阅函数
   */
  subscribeAppState(listener) {
    if (!this.router || !this.router.appState) {
      console.error("[Page] AppState not available");
      return () => {};
    }
    return this.router.appState.subscribe(listener);
  }

  /**
   * 添加事件监听器（自动管理生命周期）
   * @param {EventTarget} target - 目标元素
   * @param {string} event - 事件类型
   * @param {Function} handler - 处理函数
   * @param {Object} options - 选项
   */
  addEventListener(target, event, handler, options = {}) {
    if (!target || !event || !handler) {
      console.error("[Page] Invalid event listener arguments");
      return;
    }

    target.addEventListener(event, handler, options);
    this.eventListeners.push({ target, event, handler, options });
  }

  /**
   * 移除所有事件监听器
   * @private
   */
  removeAllEventListeners() {
    this.eventListeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }

  /**
   * 查找元素（简化版）
   * @param {string} selector - 选择器
   * @param {HTMLElement} context - 上下文，默认为 container
   * @returns {HTMLElement|null}
   */
  $(selector, context = null) {
    const ctx = context || this.container;
    if (!ctx) return null;
    return ctx.querySelector(selector);
  }

  /**
   * 查找所有匹配元素
   * @param {string} selector - 选择器
   * @param {HTMLElement} context - 上下文
   * @returns {NodeList}
   */
  $$(selector, context = null) {
    const ctx = context || this.container;
    if (!ctx) return new NodeList();
    return ctx.querySelectorAll(selector);
  }

  /**
   * 设置元素 HTML
   * @param {HTMLElement} element - 元素
   * @param {string} html - HTML 字符串
   */
  setHtml(element, html) {
    if (element) {
      element.innerHTML = html;
    }
  }

  /**
   * 显示元素
   * @param {HTMLElement} element - 元素
   */
  show(element) {
    if (element) {
      element.style.display = "";
    }
  }

  /**
   * 隐藏元素
   * @param {HTMLElement} element - 元素
   */
  hide(element) {
    if (element) {
      element.style.display = "none";
    }
  }

  /**
   * 切换元素显示状态
   * @param {HTMLElement} element - 元素
   * @param {boolean} show - 是否显示
   */
  toggle(element, show) {
    if (element) {
      element.style.display = show ? "" : "none";
    }
  }

  /**
   * 添加 CSS 类
   * @param {HTMLElement} element - 元素
   * @param {string} className - 类名
   */
  addClass(element, className) {
    if (element) {
      element.classList.add(className);
    }
  }

  /**
   * 移除 CSS 类
   * @param {HTMLElement} element - 元素
   * @param {string} className - 类名
   */
  removeClass(element, className) {
    if (element) {
      element.classList.remove(className);
    }
  }

  /**
   * 切换 CSS 类
   * @param {HTMLElement} element - 元素
   * @param {string} className - 类名
   * @param {boolean} force - 强制添加/移除
   */
  toggleClass(element, className, force = null) {
    if (element) {
      element.classList.toggle(className, force);
    }
  }

  /**
   * 判断是否包含 CSS 类
   * @param {HTMLElement} element - 元素
   * @param {string} className - 类名
   * @returns {boolean} 是否包含
   */
  hasClass(element, className) {
    if (!element) return false;
    return element.classList.contains(className);
  }

  /**
   * 导出页面状态用于调试
   * @returns {Object} 页面快照
   */
  toJSON() {
    return {
      pageName: this.pageName,
      isCreated: this.isCreated,
      isVisible: this.isVisible,
      params: this.params,
      eventListenerCount: this.eventListeners.length,
    };
  }
}

/**
 * 页面控制器工厂函数
 * @param {string} pageName - 页面名称
 * @param {Object} methods - 页面方法
 * @returns {Class} 页面控制器类
 */
export function createPageController(pageName, methods = {}) {
  return class extends BasePageController {
    constructor(options) {
      super(options);
      this.pageName = pageName;

      // 如果子类定义了 initialize，则调用
      if (typeof methods.initialize === "function") {
        methods.initialize.call(this, options);
      }
    }

    async onCreate(params) {
      if (typeof methods.onCreate === "function") {
        await methods.onCreate.call(this, params);
      }
      return super.onCreate(params);
    }

    async onShow() {
      if (typeof methods.onShow === "function") {
        await methods.onShow.call(this);
      }
      return super.onShow();
    }

    async onHide() {
      if (typeof methods.onHide === "function") {
        await methods.onHide.call(this);
      }
      return super.onHide();
    }

    async onDestroy() {
      if (typeof methods.onDestroy === "function") {
        await methods.onDestroy.call(this);
      }
      return super.onDestroy();
    }
  };
}
