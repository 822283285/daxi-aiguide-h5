/**
 * 基于状态的路由管理器
 * 通过监听 appState.currentPage 变化来切换页面
 * 支持同步和异步（懒加载）控制器
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

    /** @type {Map} 控制器注册表（同步） */
    this.controllerRegistry = new Map();

    /** @type {Map} 懒加载控制器导入函数 */
    this.lazyControllerRegistry = new Map();

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
   * 注册页面控制器（同步）
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
   * 注册懒加载页面控制器
   * @param {string} pageName - 页面名称
   * @param {Function} importFn - 动态导入函数
   */
  registerLazy(pageName, importFn) {
    if (typeof importFn !== "function") {
      console.error("[Router] importFn must be a function");
      return;
    }

    this.lazyControllerRegistry.set(pageName, importFn);
    console.log(`[Router] Registered lazy: ${pageName}`);
  }

  /**
   * 批量注册懒加载页面控制器
   * @param {Object} lazyRoutes - 懒加载映射表 { pageName: importFn }
   */
  registerAllLazy(lazyRoutes) {
    Object.entries(lazyRoutes).forEach(([pageName, importFn]) => {
      this.registerLazy(pageName, importFn);
    });
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

      // 3. 获取页面控制器（支持异步加载）
      const ControllerClass = await this.getController(pageName);
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
   * 获取页面控制器类（同步或异步）
   * @private
   * @param {string} pageName - 页面名称
   * @returns {Promise<Class|null>} 控制器类
   */
  async getController(pageName) {
    // 先检查同步注册表
    const syncController = this.controllerRegistry.get(pageName);
    if (syncController) {
      return syncController;
    }

    // 检查懒加载注册表
    const lazyImportFn = this.lazyControllerRegistry.get(pageName);
    if (lazyImportFn) {
      try {
        const module = await lazyImportFn();
        // 查找导出的控制器类（通常以 Controller 结尾）
        const controllerExport = Object.entries(module).find(([key]) =>
          key.endsWith("Controller")
        );

        if (controllerExport) {
          const ControllerClass = controllerExport[1];
          // 缓存到同步注册表，避免重复加载
          this.controllerRegistry.set(pageName, ControllerClass);
          return ControllerClass;
        }

        // 如果没有找到 Controller，尝试查找默认导出
        if (module.default) {
          this.controllerRegistry.set(pageName, module.default);
          return module.default;
        }

        console.error(`[Router] No controller found for: ${pageName}`);
        return null;
      } catch (error) {
        console.error(`[Router] Failed to load lazy controller: ${pageName}`, error);
        return null;
      }
    }

    return null;
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
   * 检查页面是否已注册（同步或懒加载）
   * @param {string} pageName - 页面名称
   * @returns {boolean} 是否已注册
   */
  isRegistered(pageName) {
    return this.controllerRegistry.has(pageName) || this.lazyControllerRegistry.has(pageName);
  }

  /**
   * 获取所有已注册的页面（包括懒加载）
   * @returns {Array<string>} 页面名称列表
   */
  getRegisteredPages() {
    const syncPages = Array.from(this.controllerRegistry.keys());
    const lazyPages = Array.from(this.lazyControllerRegistry.keys());
    // 合并并去重
    return [...new Set([...syncPages, ...lazyPages])];
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
