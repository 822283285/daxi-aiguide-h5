/**
 * 应用状态管理
 * @description 管理应用全局状态
 */

export class AppState {
  constructor(initialState = {}) {
    this.state = {
      // 页面状态
      currentPage: "home",
      currentPageParams: {},
      pageHistory: [],

      // POI 状态
      pois: [],
      poisLoaded: false,
      poisLoading: false,
      selectedPOI: null,

      // 路线状态
      routes: [],
      routesLoaded: false,
      selectedRoute: null,
      routePlan: null,

      // 导航状态
      navigationSession: null,
      isNavigating: false,
      currentPosition: null,

      // 建筑/楼层状态
      currentBuilding: null,
      currentFloor: 1,
      availableFloors: [],

      // 搜索状态
      searchQuery: "",
      searchResults: [],
      searchLoading: false,

      // 用户状态
      userInfo: null,
      isAuthenticated: false,

      // UI 状态
      loading: false,
      error: null,
      toast: null,

      ...initialState,
    };

    this.listeners = new Set();
    this.middlewares = [];
  }

  /**
   * 获取当前状态
   * @returns {Object}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * 设置状态
   * @param {Object} newState - 新状态片段
   * @param {boolean} [notify=true] - 是否通知监听器
   */
  setState(newState, notify = true) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };

    if (notify) {
      this.notify(this.state, prevState);
    }
  }

  /**
   * 重置状态
   * @param {Object} [initialState] - 初始状态
   */
  reset(initialState = {}) {
    const prevState = { ...this.state };
    this.state = {
      currentPage: "home",
      currentPageParams: {},
      pageHistory: [],
      pois: [],
      poisLoaded: false,
      poisLoading: false,
      selectedPOI: null,
      routes: [],
      routesLoaded: false,
      selectedRoute: null,
      routePlan: null,
      navigationSession: null,
      isNavigating: false,
      currentPosition: null,
      currentBuilding: null,
      currentFloor: 1,
      availableFloors: [],
      searchQuery: "",
      searchResults: [],
      searchLoading: false,
      userInfo: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      toast: null,
      ...initialState,
    };
    this.notify(this.state, prevState);
  }

  /**
   * 订阅状态变化
   * @param {Function} listener - 监听函数
   * @returns {Function} 取消订阅函数
   */
  subscribe(listener) {
    if (typeof listener !== "function") {
      throw new Error("Listener must be a function");
    }
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听器
   * @private
   */
  notify(nextState, prevState) {
    // 执行中间件
    let enhancedNextState = nextState;
    for (const mw of this.middlewares) {
      try {
        const result = mw(enhancedNextState, prevState);
        if (result && typeof result === "object") {
          enhancedNextState = result;
        }
      } catch (error) {
        console.error("[AppState] Middleware error:", error);
      }
    }

    // 通知监听器
    this.listeners.forEach((listener) => {
      try {
        listener(enhancedNextState, prevState);
      } catch (error) {
        console.error("[AppState] Listener error:", error);
      }
    });
  }

  /**
   * 注册中间件
   * @param {Function} middleware - 中间件函数
   */
  use(middleware) {
    if (typeof middleware !== "function") {
      throw new Error("Middleware must be a function");
    }
    this.middlewares.push(middleware);
  }

  /**
   * 批量更新状态（支持异步）
   * @param {Object|Function} updater - 更新函数或状态对象
   * @returns {Promise<void>}
   */
  async batchUpdate(updater) {
    const prevState = { ...this.state };

    if (typeof updater === "function") {
      this.state = await updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }

    this.notify(this.state, prevState);
  }

  /**
   * 显示加载状态
   * @param {boolean} [loading=true]
   */
  setLoading(loading = true) {
    this.setState({ loading });
  }

  /**
   * 显示错误
   * @param {string|Object} error - 错误信息
   */
  setError(error) {
    this.setState({
      error: typeof error === "string" ? { message: error } : error,
    });
  }

  /**
   * 清除错误
   */
  clearError() {
    this.setState({ error: null });
  }

  /**
   * 显示 Toast 提示
   * @param {Object} toast - {message, type, duration}
   */
  showToast(toast) {
    this.setState({ toast });
  }

  /**
   * 清除 Toast
   */
  clearToast() {
    this.setState({ toast: null });
  }

  /**
   * 导航到页面
   * @param {string} pageName - 页面名称
   * @param {Object} [params] - 页面参数
   */
  navigateTo(pageName, params = {}) {
    const history = [...this.state.pageHistory];
    if (history[history.length - 1] !== pageName) {
      history.push(pageName);
    }

    this.setState({
      currentPage: pageName,
      currentPageParams: params,
      pageHistory: history,
    });
  }

  /**
   * 返回上一页
   */
  goBack() {
    const history = [...this.state.pageHistory];
    if (history.length <= 1) {
      return false;
    }
    history.pop();
    const prevPage = history.pop() || "home";

    this.setState({
      currentPage: prevPage,
      currentPageParams: {},
      pageHistory: history,
    });
    return true;
  }

  /**
   * 替换当前页面
   * @param {string} pageName
   * @param {Object} [params]
   */
  replacePage(pageName, params = {}) {
    const history = [...this.state.pageHistory];
    if (history.length > 0) {
      history.pop();
    }
    history.push(pageName);

    this.setState({
      currentPage: pageName,
      currentPageParams: params,
      pageHistory: history,
    });
  }

  /**
   * 选择 POI
   * @param {Object} poi - POI 对象
   */
  selectPOI(poi) {
    this.setState({ selectedPOI: poi });
  }

  /**
   * 清除选中的 POI
   */
  clearSelectedPOI() {
    this.setState({ selectedPOI: null });
  }

  /**
   * 选择路线
   * @param {Object} route - 路线对象
   */
  selectRoute(route) {
    this.setState({ selectedRoute: route });
  }

  /**
   * 清除选中的路线
   */
  clearSelectedRoute() {
    this.setState({ selectedRoute: null });
  }

  /**
   * 设置导航会话
   * @param {Object} session - 导航会话
   */
  setNavigationSession(session) {
    this.setState({
      navigationSession: session,
      isNavigating: !!session,
    });
  }

  /**
   * 更新当前位置
   * @param {Object} position - 位置 {lng, lat, floor}
   */
  updatePosition(position) {
    this.setState({ currentPosition: position });
  }

  /**
   * 切换楼层
   * @param {number} floor - 楼层号
   */
  setFloor(floor) {
    this.setState({ currentFloor: floor });
  }

  /**
   * 执行搜索
   * @param {string} query - 搜索词
   */
  search(query) {
    this.setState({
      searchQuery: query,
      searchLoading: !!query,
      searchResults: [],
    });
  }

  /**
   * 设置搜索结果
   * @param {Array} results - 搜索结果
   */
  setSearchResults(results) {
    this.setState({
      searchResults: results,
      searchLoading: false,
    });
  }

  /**
   * 设置用户信息
   * @param {Object} userInfo - 用户信息
   */
  setUserInfo(userInfo) {
    this.setState({
      userInfo,
      isAuthenticated: !!userInfo,
    });
  }

  /**
   * 登出
   */
  logout() {
    this.setState({
      userInfo: null,
      isAuthenticated: false,
    });
  }

  /**
   * 导出状态快照
   * @returns {Object}
   */
  toJSON() {
    return { ...this.state };
  }
}

/**
 * 创建全局应用状态实例
 * @type {AppState}
 */
export const appState = new AppState();
