/**
 * 基于状态的路由管理器
 * 通过监听 appState.currentPage 变化来切换页面
 *
 * @class StateRouter
 */
export class StateRouter {
  /**
   * 创建路由实例
   */
  constructor() {
    /** @type {Object|null} */
    this.currentController = null;

    /** @type {HTMLElement|null} */
    this.container = null;

    /** @type {Object} */
    this.appState = null;

    /** @type {Map} 控制器注册表 */
    this.controllerRegistry = new Map();

    /** @type {Array} 路由守卫 */
    this.guards = [];

    /** @type {boolean} 是否正在导航 */
    this.isNavigating = false;

    /** @type {Object} 当前路由参数 */
    this.currentParams = {};
  }

  /**
   * 初始化路由
   * @param {string} containerId - 容器元素 ID
   * @param {Object} appState - 应用状态实例
   */
  init(containerId = "container", appState) {
    this.container = document.getElementById(containerId);
    this.appState = appState;

    if (!this.container) {
      console.warn(`[StateRouter] Container #${containerId} not found`);
      return;
    }

    // 监听页面状态变化
    this.appState.subscribe((nextState, prevState) => {
      if (nextState.currentPage !== prevState.currentPage) {
        this.navigate(nextState.currentPage, nextState.currentPageParams || {});
      }
    });

    console.log("[StateRouter] Initialized");
  }

  /**
   * 注册页面控制器
   * @param {string} pageName - 页面名称
   * @param {Class} ControllerClass - 控制器类
   */
  register(pageName, ControllerClass) {
    if (typeof ControllerClass !== "function") {
      console.error("[Router] ControllerClass must be a constructor function");
      return;
    }

    this.controllerRegistry.set(pageName, ControllerClass);
    console.log(`[Router] Registered: ${pageName}`);
  }

  /**
   * 批量注册页面控制器
   * @param {Object} controllers - 控制器映射表 { pageName: ControllerClass }
   */
  registerAll(controllers) {
    Object.entries(controllers).forEach(([pageName, ControllerClass]) => {
      this.register(pageName, ControllerClass);
    });
  }

  /**
   * 添加路由守卫
   * @param {Function} guard - 守卫函数
   * @returns {Function} 取消订阅函数
   */
  useGuard(guard) {
    this.guards.push(guard);

    // 返回取消订阅函数
    return () => {
      const index = this.guards.indexOf(guard);
      if (index !== -1) {
        this.guards.splice(index, 1);
      }
    };
  }

  /**
   * 导航到指定页面
   * @param {string} pageName - 页面名称
   * @param {Object} params - 页面参数
   * @returns {Promise<boolean>} 是否导航成功
   */
  async navigate(pageName, params = {}) {
    // 防止重复导航
    if (this.isNavigating) {
      console.warn("[Router] Navigation in progress, ignoring...");
      return false;
    }

    this.isNavigating = true;

    try {
      console.log(`[Router] Navigating to: ${pageName}`, params);

      // 1. 执行路由守卫
      const guardResult = await this.executeGuards(pageName, params);
      if (!guardResult) {
        console.log("[Router] Navigation blocked by guard");
        return false;
      }

      // 2. 销毁当前页面
      if (this.currentController) {
        this.destroyCurrentController();
      }

      // 3. 获取页面控制器
      const ControllerClass = this.getController(pageName);
      if (!ControllerClass) {
        console.error(`[Router] Page controller not found: ${pageName}`);
        return false;
      }

      // 4. 创建并初始化新页面
      this.currentController = new ControllerClass({
        container: this.container,
        router: this,
        params,
      });

      this.currentParams = params;

      // 5. 调用页面生命周期
      if (typeof this.currentController.onCreate === "function") {
        await this.currentController.onCreate(params);
      }

      if (typeof this.currentController.onShow === "function") {
        await this.currentController.onShow();
      }

      // 6. 更新历史记录
      this.updatePageHistory(pageName);

      console.log(`[Router] Navigation completed: ${pageName}`);
      return true;
    } catch (error) {
      console.error("[Router] Navigation error:", error);
      return false;
    } finally {
      this.isNavigating = false;
    }
  }

  /**
   * 执行路由守卫
   * @private
   * @param {string} pageName - 页面名称
   * @param {Object} params - 参数
   * @returns {Promise<boolean>} 是否通过守卫
   */
  async executeGuards(pageName, params) {
    for (const guard of this.guards) {
      try {
        const result = await guard(pageName, params, this);
        if (result === false) {
          return false;
        }
      } catch (error) {
        console.error("[Router] Guard error:", error);
        return false;
      }
    }
    return true;
  }

  /**
   * 销毁当前页面控制器
   * @private
   */
  destroyCurrentController() {
    if (typeof this.currentController.onHide === "function") {
      this.currentController.onHide();
    }

    if (typeof this.currentController.onDestroy === "function") {
      this.currentController.onDestroy();
    }

    this.currentController = null;
  }

  /**
   * 更新页面历史记录
   * @private
   * @param {string} pageName - 页面名称
   */
  updatePageHistory(pageName) {
    const history = this.appState.getState().pageHistory || [];

    // 避免重复添加
    if (history[history.length - 1] !== pageName) {
      this.appState.setState(
        {
          pageHistory: [...history, pageName],
        },
        false
      ); // 不触发历史保存
    }
  }

  /**
   * 获取页面控制器类
   * @private
   * @param {string} pageName - 页面名称
   * @returns {Class|null} 控制器类
   */
  getController(pageName) {
    return this.controllerRegistry.get(pageName) || null;
  }

  /**
   * 返回上一页
   * @returns {boolean} 是否成功返回
   */
  back() {
    const history = this.appState.getState().pageHistory || [];

    if (history.length <= 1) {
      console.warn("[Router] No history to go back");
      return false;
    }

    history.pop(); // 移除当前页
    const prevPage = history.pop(); // 获取上一页

    if (prevPage) {
      this.appState.setState({ currentPage: prevPage });
      return true;
    }

    return false;
  }

  /**
   * 返回到指定页面
   * @param {string} pageName - 页面名称
   * @returns {boolean} 是否成功
   */
  backTo(pageName) {
    const history = this.appState.getState().pageHistory || [];
    const index = history.lastIndexOf(pageName);

    if (index === -1 || index === history.length - 1) {
      console.warn(`[Router] Page not in history: ${pageName}`);
      return false;
    }

    // 移除当前页之后的所有历史
    history.splice(index + 1);
    this.appState.setState({
      currentPage: pageName,
      pageHistory: history,
    });

    return true;
  }

  /**
   * 替换当前页面（不保留历史）
   * @param {string} pageName - 页面名称
   * @param {Object} params - 参数
   * @returns {boolean} 是否成功
   */
  replace(pageName, params = {}) {
    const history = this.appState.getState().pageHistory || [];

    // 移除当前页
    if (history.length > 0) {
      history.pop();
    }

    // 添加新页面
    history.push(pageName);

    this.appState.setState({
      currentPage: pageName,
      pageHistory: history,
      currentPageParams: params,
    });

    return true;
  }

  /**
   * 清空历史记录并从新开始
   * @param {string} pageName - 新起始页面
   * @param {Object} params - 参数
   */
  resetHistory(pageName, params = {}) {
    this.appState.setState({
      currentPage: pageName,
      pageHistory: [pageName],
      currentPageParams: params,
    });
  }

  /**
   * 获取当前页面名称
   * @returns {string} 当前页面名称
   */
  getCurrentPage() {
    return this.appState.getState().currentPage || "";
  }

  /**
   * 获取当前页面参数
   * @returns {Object} 当前页面参数
   */
  getCurrentParams() {
    return { ...this.currentParams };
  }

  /**
   * 获取页面历史记录
   * @returns {Array<string>} 页面历史
   */
  getHistory() {
    return [...(this.appState.getState().pageHistory || [])];
  }

  /**
   * 判断是否可以返回
   * @returns {boolean} 是否可以返回
   */
  canBack() {
    const history = this.appState.getState().pageHistory || [];
    return history.length > 1;
  }

  /**
   * 检查页面是否已注册
   * @param {string} pageName - 页面名称
   * @returns {boolean} 是否已注册
   */
  isRegistered(pageName) {
    return this.controllerRegistry.has(pageName);
  }

  /**
   * 获取所有已注册的页面
   * @returns {Array<string>} 页面名称列表
   */
  getRegisteredPages() {
    return Array.from(this.controllerRegistry.keys());
  }

  /**
   * 导出路由状态用于调试
   * @returns {Object} 路由快照
   */
  toJSON() {
    return {
      currentPage: this.getCurrentPage(),
      currentParams: this.currentParams,
      history: this.getHistory(),
      registeredPages: this.getRegisteredPages(),
      guardCount: this.guards.length,
      isNavigating: this.isNavigating,
    };
  }
}

/**
 * 创建全局路由实例
 * @type {StateRouter}
 */
export const router = new StateRouter();
