/**
 * 轻量级状态管理器
 * 无依赖，基于观察者模式
 *
 * @class StateManager
 */
export class StateManager {
  /**
   * 创建状态管理器实例
   * @param {Object} initialState - 初始状态
   */
  constructor(initialState = {}) {
    /** @type {Object} */
    this.state = initialState;

    /** @type {Map} */
    this.listeners = new Map();

    /** @type {Array} */
    this.middleware = [];

    /** @type {Array} 状态变更历史 */
    this.history = [];

    /** @type {number} 最大历史记录数 */
    this.maxHistoryLength = 50;
  }

  /**
   * 获取当前状态
   * @returns {Object} 当前状态
   */
  getState() {
    return this.state;
  }

  /**
   * 获取状态的特定路径
   * @param {string} path - 点分隔的路径，如 'currentUser.name'
   * @returns {*} 路径对应的值
   */
  getStateAtPath(path) {
    if (!path) return this.state;

    return path.split(".").reduce((obj, key) => {
      return obj && obj[key] !== undefined ? obj[key] : undefined;
    }, this.state);
  }

  /**
   * 更新状态
   * @param {Function|Object} updater - 状态更新器 (函数或对象)
   * @param {boolean} saveHistory - 是否保存历史记录
   */
  setState(updater, saveHistory = true) {
    const prevState = this.state;
    this.state = typeof updater === "function" ? updater(prevState) : updater;

    // 保存历史记录
    if (saveHistory) {
      this.saveHistory(prevState, this.state);
    }

    // 通知所有订阅者
    this.notify(this.state, prevState);
  }

  /**
   * 批量更新状态 (合并多次更新为一次通知)
   * @param {Object} updates - 更新对象
   */
  batchSetState(updates) {
    const prevState = this.state;

    // 合并所有更新
    if (typeof updates === "object") {
      this.state = { ...this.state, ...updates };
    }

    // 保存历史记录
    this.saveHistory(prevState, this.state);

    // 只通知一次
    this.notify(this.state, prevState);
  }

  /**
   * 异步更新状态
   * @param {Function|Object} updater - 状态更新器
   * @returns {Promise<Object>} 返回更新后的状态
   */
  async setStateAsync(updater) {
    return new Promise((resolve) => {
      this.setState(updater);
      // 下一个事件循环周期执行
      setTimeout(() => {
        resolve(this.state);
      }, 0);
    });
  }

  /**
   * 条件更新状态
   * @param {Function} predicate - 条件函数，返回 true 才更新
   * @param {Function|Object} updater - 状态更新器
   */
  setStateIf(predicate, updater) {
    if (predicate(this.state)) {
      this.setState(updater);
      return true;
    }
    return false;
  }

  /**
   * 保存状态历史
   * @private
   * @param {Object} prevState - 上一个状态
   * @param {Object} nextState - 下一个状态
   */
  saveHistory(prevState, nextState) {
    const historyItem = {
      prevState: { ...prevState },
      nextState: { ...nextState },
      timestamp: Date.now(),
    };

    this.history.push(historyItem);

    // 限制历史记录长度
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  /**
   * 撤销到上一个状态
   * @returns {boolean} 是否成功撤销
   */
  undo() {
    if (this.history.length === 0) {
      return false;
    }

    const lastHistory = this.history.pop();
    this.state = { ...lastHistory.prevState };

    // 通知变化，但不保存历史
    this.notify(this.state, lastHistory.nextState);

    return true;
  }

  /**
   * 订阅状态变化
   * @param {Function} listener - 监听器函数
   * @returns {Function} 取消订阅函数
   */
  subscribe(listener) {
    const id = Symbol("listener");
    this.listeners.set(id, listener);
    return () => this.listeners.delete(id);
  }

  /**
   * 订阅状态的特定路径变化
   * @param {string} path - 状态路径
   * @param {Function} listener - 监听器函数
   * @returns {Function} 取消订阅函数
   */
  subscribeAtPath(path, listener) {
    let lastValue = this.getStateAtPath(path);

    const pathListener = (nextState, prevState) => {
      const currentValue = nextState[path];
      if (currentValue !== lastValue) {
        listener(currentValue, lastValue);
        lastValue = currentValue;
      }
    };

    return this.subscribe(pathListener);
  }

  /**
   * 通知所有订阅者
   * @private
   * @param {Object} nextState - 下一个状态
   * @param {Object} prevState - 上一个状态
   */
  notify(nextState, prevState) {
    let middlewareIndex = 0;

    const dispatch = (state) => {
      if (middlewareIndex < this.middleware.length) {
        const middleware = this.middleware[middlewareIndex++];
        return middleware(state, prevState, dispatch);
      }

      // 执行所有监听器
      this.listeners.forEach((listener) => {
        try {
          listener(nextState, prevState);
        } catch (error) {
          console.error("[StateManager] Listener error:", error);
        }
      });
    };

    dispatch(this.state);
  }

  /**
   * 添加中间件
   * @param {Function} middleware - 中间件函数
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * 移除中间件
   * @param {Function} middleware - 要移除的中间件
   */
  removeMiddleware(middleware) {
    const index = this.middleware.indexOf(middleware);
    if (index !== -1) {
      this.middleware.splice(index, 1);
    }
  }

  /**
   * 重置状态到初始值
   * @param {Object} initialState - 新的初始状态
   */
  reset(initialState = {}) {
    const prevState = this.state;
    this.state = initialState;
    this.history = [];
    this.notify(this.state, prevState);
  }

  /**
   * 获取状态历史
   * @param {number} count - 获取最近多少条记录
   * @returns {Array} 历史记录
   */
  getHistory(count = 10) {
    return this.history.slice(-count);
  }

  /**
   * 清空历史记录
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * 获取监听器数量
   * @returns {number} 监听器数量
   */
  getListenerCount() {
    return this.listeners.size;
  }

  /**
   * 导出状态用于调试
   * @returns {Object} 状态快照
   */
  toJSON() {
    return {
      state: this.state,
      listenerCount: this.listeners.size,
      middlewareCount: this.middleware.length,
      historyLength: this.history.length,
    };
  }
}

/**
 * 创建全局应用状态实例
 * @type {StateManager}
 */
export const appState = new StateManager({
  // 用户状态
  currentUser: null,

  // 地图状态
  currentBuilding: null,
  availableBuildings: [],

  // 导航状态
  isNavigating: false,
  currentRoute: null,

  // UI 状态
  currentPage: "HomePage",
  pageHistory: [],

  // 语言数据
  langData: {},
});
