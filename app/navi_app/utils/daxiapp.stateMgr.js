(function (global) {
  "use strict";

  const daxiapp = (global.DaxiApp = global.DaxiApp || {});
  const EventHandlerManager = daxiapp.EventHandlerManager;
  const domUtils = daxiapp.dom;

  /**
   * @class MapStateClass
   * @classdesc 地图状态基类，所有具体状态类都应继承此类
   */
  const MapStateClass = (function (Class) {
    const MapStateClass = Class.extend({
      /** 构造函数 */
      __init__: function () {
        this._rtti = "MapStateClass";
      },

      /**
       * 初始化状态
       * @param {Object} app - 应用实例
       * @param {HTMLElement} container - DOM 容器
       */
      initialize: function (app, container) {
        this._app = app;
        this._container = container;
        this._eventMgr = new EventHandlerManager();
        this._renderObjects = [];
        this._domComps = [];
        this._dom = null;
        this.visible = true;
      },

      /** 销毁状态 */
      finalize: function () {
        this._super();
      },

      /**
       * 控制状态可见性
       * @param {boolean} visible - 是否可见
       */
      show: function (visible) {
        this.visible = visible;
        domUtils?.show(this._dom, visible);
      },

      /**
       * 状态创建时调用
       * @param {Object} args - 传入参数
       */
      onStateBeginWithParam: function (args) {
        this._args = args;
        this.show(true);
      },

      /** 状态被压入栈隐藏时调用 */
      onHideByPushStack: function () {
        this.show(false);
        this.setAllRenderObjectVisible(false);
      },

      /**
       * 状态被推到栈顶显示时调用
       * @param {Object} args - 传入参数
       */
      onShowByPopStack: function (args) {
        this.show(true);
        this.setAllRenderObjectVisible(true);
      },

      /** 状态结束时调用 */
      onStateEnd: function () {
        this.show(false);
        this.clearAllRenderObject();
      },

      /**
       * 设置所有渲染对象可见性
       * @param {boolean} visible - 是否可见
       */
      setAllRenderObjectVisible: function (visible) {
        this._renderObjects.forEach((ro) => {
          ro.visible = visible;
        });
      },

      /** 清除所有渲染对象 */
      clearAllRenderObject: function () {
        this._renderObjects.forEach((ro) => {
          ro.removeFromMap();
        });
        this._renderObjects.length = 0;
      },

      /**
       * 触发回调事件
       * @param {string} callbackName - 回调名称
       * @param {*} command - 传递的数据
       */
      invokeCallback: function (callbackName, command) {
        this._eventMgr.fire(callbackName, command);
      },

      /**
       * 切换语言
       * @param {string} lang - 语言代码
       */
      changeLanguage: function (lang) {
        this._domComps.forEach((domComp) => {
          domComp.changeLanguage?.(lang);
        });
      },

      _on: function (type, fn) {
        this._eventMgr.on(type, fn);
      },

      _once: function (type, fn) {
        this._eventMgr.once(type, fn);
      },

      _off: function (type, fn) {
        this._eventMgr.off(type, fn);
      },

      _fire: function (type, data) {
        this._eventMgr.fire(type, data);
      },
    });

    return MapStateClass;
  })(Class);

  /**
   * @class DXMapStateManager
   * @classdesc 地图状态管理器，管理页面栈和状态切换
   */
  function DXMapStateManager(app, container) {
    this._app = app;
    this._container = container;
    this._pagePool = {};
    this._pageStack = [];
    this._curPage = null;
    this._eventMgr = new EventHandlerManager();
  }

  const proto = DXMapStateManager.prototype;

  /** 初始化管理器，监听浏览器返回事件 */
  proto.init = function () {
    const self = this;
    window.addEventListener(
      "popstate",
      function (e) {
        if (!e?.state) return;

        const stackCount = self.getMapStateStackCount();
        if (stackCount > 1) {
          const stateName = self.getCurrentStateName();
          if (stateName === "MapStateSimulateNavi" || stateName === "MapStateNavi") {
            self.getCurrentState()?.exitNavi();
          } else {
            self.goBack();
          }
        } else {
          const uni = window.uni || window.parent?.uni;
          uni?.navigateBack();
        }
      },
      false,
    );
  };

  /**
   * 规范化状态名称
   * @param {string} stateName - 状态名称
   * @returns {string} 小写状态名称
   */
  proto._normalizeStateName = function (stateName) {
    return stateName?.toLowerCase() || "";
  };

  /**
   * 注册状态
   * @param {string} stateName - 状态名称
   * @param {MapStateClass} state - 状态实例
   */
  proto.registerState = function (stateName, state) {
    this._pagePool[this._normalizeStateName(stateName)] = state;
  };

  /** @deprecated 使用 registerState 替代 */
  proto.registState = proto.registerState;

  /**
   * 获取状态
   * @param {string} stateName - 状态名称
   * @returns {MapStateClass|undefined}
   */
  proto.getState = function (stateName) {
    return this._pagePool[this._normalizeStateName(stateName)];
  };

  /** @deprecated 使用 getState 替代 */
  proto.getMapState = proto.getState;

  /**
   * 获取当前状态
   * @returns {MapStateClass|null}
   */
  proto.getCurrentState = function () {
    return this._curPage;
  };

  /**
   * 获取当前状态名称
   * @returns {string|null}
   */
  proto.getCurrentStateName = function () {
    return this._curPage?._rtti || null;
  };

  /**
   * 从栈中获取指定状态
   * @param {string} stateName - 状态名称
   * @returns {MapStateClass|null}
   */
  proto.getStateFromStack = function (stateName) {
    const normalizedName = this._normalizeStateName(stateName);
    for (let i = 0; i < this._pageStack.length; i++) {
      if (this._pageStack[i]._rtti?.toLowerCase() === normalizedName) {
        return this._pageStack[i];
      }
    }
    return null;
  };

  /**
   * 获取页面栈数量
   * @returns {number}
   */
  proto.getPageCount = function () {
    return this._pageStack.length;
  };

  /**
   * 获取状态栈数量（getPageCount 的别名）
   * @returns {number}
   */
  proto.getMapStateStackCount = function () {
    return this._pageStack.length;
  };

  /**
   * 触发状态变更事件
   * @param {MapStateClass} state - 当前状态
   */
  proto.onStateChanged = function (state) {
    this._eventMgr.fire("stateChanged", state);
  };

  /**
   * 监听事件
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @param {*} context - 上下文
   */
  proto.on = function (eventName, callback, context) {
    this._eventMgr.on(eventName, callback, context);
  };

  /**
   * 取消监听
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @param {*} context - 上下文
   */
  proto.off = function (eventName, callback, context) {
    this._eventMgr.off(eventName, callback, context);
  };

  /**
   * 弹出并结束栈顶状态（内部方法）
   * @returns {MapStateClass|null}
   */
  proto._popAndEndCurrentPage = function () {
    const page = this._pageStack.pop();
    if (page) {
      page.onStateEnd();
      this._curPage = this._pageStack[this._pageStack.length - 1] || null;
      this.onStateChanged(this._curPage);
    }
    return page;
  };

  /**
   * 退出到宿主应用（内部方法）
   */
  proto._exitToHost = function () {
    const config = this._app?._config || {};
    const url = config.exitMapUrl || "";
    const isSwitchTap = config.mapIsSwitchTap;
    this._app?.jsBridge?.goBack(url, isSwitchTap);
  };

  /**
   * 压入状态
   * @param {string} pageName - 状态名称
   * @param {Object} args - 传入参数
   * @returns {MapStateClass|null}
   */
  proto.pushState = function (pageName, args) {
    const normalizedName = this._normalizeStateName(pageName);
    const targetPage = this._pagePool[normalizedName];
    if (!targetPage) return null;

    // 如果目标状态已是当前状态，重置它
    if (this._curPage === targetPage) {
      targetPage.onStateEnd();
      targetPage.onStateBeginWithParam(args);
      return targetPage;
    }

    // 检查栈中是否已存在该状态
    for (let i = 0; i < this._pageStack.length; i++) {
      if (this._pageStack[i]._rtti?.toLowerCase() === normalizedName) {
        // 弹出所有在其之上的状态
        while (this._pageStack.length > i + 1) {
          this._pageStack[this._pageStack.length - 1].onStateEnd();
          this._pageStack.pop();
        }
        this._pageStack[i].onShowByPopStack(args);
        this._curPage = targetPage;
        return targetPage;
      }
    }

    // 隐藏当前状态，压入新状态
    this._curPage?.onHideByPushStack();
    this._curPage = targetPage;
    this.onStateChanged(targetPage);
    this._pageStack.push(targetPage);
    targetPage.onStateBeginWithParam(args);

    return targetPage;
  };

  /**
   * 打开状态（带回调）
   * @param {string} pageName - 状态名称
   * @param {Object} args - 传入参数
   * @param {string} eventName - 事件名称
   * @param {Function} callbackFn - 成功回调
   * @returns {MapStateClass|null}
   */
  proto.openState = function (pageName, args, eventName, callbackFn) {
    const normalizedName = this._normalizeStateName(pageName);
    const targetPage = this._pagePool[normalizedName];
    if (!targetPage) return null;

    this._curPage?.onHideByPushStack();

    this._curPage = targetPage;
    targetPage._once(eventName, (sender, data) => {
      callbackFn?.(data);
    });

    this.onStateChanged(targetPage);
    this._pageStack.push(targetPage);
    targetPage.onStateBeginWithParam(args, eventName);

    return targetPage;
  };

  /**
   * 压入页面（不检查栈中已有状态）
   * @param {string} pageName - 页面名称
   * @param {Object} args - 传入参数
   * @returns {MapStateClass|null}
   */
  proto.pushPage = function (pageName, args) {
    const normalizedName = this._normalizeStateName(pageName);
    const targetPage = this._pagePool[normalizedName];
    if (!targetPage) return null;

    // 如果目标状态已是当前状态，重置它
    if (this._curPage === targetPage) {
      targetPage.onStateEnd();
      targetPage.onStateBeginWithParam(args);
      return targetPage;
    }

    this._curPage?.onHideByPushStack();
    this._curPage = targetPage;
    this.onStateChanged(targetPage);
    targetPage.onStateBeginWithParam(args);

    return targetPage;
  };

  /**
   * 返回上一状态
   * @param {boolean} forcePop - 是否强制弹出（即使只有一层）
   * @param {Function} callbackFn - 成功回调
   * @param {Object} args - 传递给上一状态的参数
   */
  proto.goBack = function (forcePop, callbackFn, args) {
    const stackLength = this._pageStack.length;

    if (stackLength === 0) return;

    if (stackLength === 1) {
      if (forcePop) {
        const page = this._popAndEndCurrentPage();
        this._curPage?.onShowByPopStack(args || null);
        callbackFn?.(page);
      }
      this._exitToHost();
      return;
    }

    // 栈有多层，正常弹出
    const page = this._popAndEndCurrentPage();
    this._curPage?.onShowByPopStack(args || null);
    callbackFn?.(page);
  };

  /**
   * 返回到指定状态
   * @param {string} stateName - 目标状态名称
   * @param {Function} callbackFn - 成功回调
   */
  proto.goBackToState = function (stateName, callbackFn) {
    const stackLength = this._pageStack.length;

    if (stackLength === 0) return;

    if (stackLength === 1) {
      this._exitToHost();
      return;
    }

    // 查找目标状态在栈中的位置
    for (let i = 0; i < this._pageStack.length; i++) {
      if (this._pageStack[i]._rtti === stateName) {
        // 弹出栈顶
        const page = this._pageStack.pop();
        page?.onStateEnd();

        // 截取到目标状态
        this._pageStack = this._pageStack.slice(0, i + 1);
        this._curPage = this._pageStack[this._pageStack.length - 1] || null;
        this.onStateChanged(this._curPage);
        this._curPage?.onShowByPopStack(null);

        callbackFn?.(page);
        break;
      }
    }
  };

  /**
   * 调用回调并返回
   * @param {string} callbackName - 回调名称
   * @param {*} command - 传递的数据
   */
  proto.invokeCallback = function (callbackName, command) {
    const self = this;
    setTimeout(() => {
      self.goBack(
        true,
        (lastPage) => {
          lastPage?._fire(callbackName, command);
        },
        command,
      );
    }, 0);
  };

  daxiapp.MapStateClass = MapStateClass;
  daxiapp.DXMapStateManager = DXMapStateManager;
})(window);
