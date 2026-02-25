const util = {
  /**
   * 判断是否是微信浏览器
   * @returns {boolean}
   */
  isWeixin() {
    const ua = navigator.userAgent.toLowerCase();
    return /micromessenger/i.test(ua);
  },

  /**
   * 判断是否是微信小程序环境
   * @returns {boolean}
   */
  isMiniProgram() {
    const ua = navigator.userAgent.toLowerCase();
    // 同时检查微信环境和小程序特有标识
    return /micromessenger/i.test(ua) && (/miniprogram/i.test(ua) || this._checkWxMiniProgram());
  },

  /**
   * 微信小程序环境检测（内部方法）
   * @returns {boolean}
   */
  _checkWxMiniProgram() {
    if (typeof window !== 'undefined' && window.wx && window.wx.miniProgram) {
      return true;
    }
    // 处理webview嵌套情况
    if (typeof window !== 'undefined' && window.parent && window.parent.wx && window.parent.wx.miniProgram) {
      return true;
    }
    return false;
  },

  /**
   * 判断是否是安卓系统
   * @returns {boolean}
   */
  isAndroid() {
    const ua = navigator.userAgent;
    return /android/i.test(ua);
  },

  /**
   * 判断是否是iOS系统
   * @returns {boolean}
   */
  isIos() {
    const ua = navigator.userAgent;
    // 检测iPhone、iPad、iPod，以及Mac上的触摸设备
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  },

  /**
   * 判断是否是PC端
   * @returns {boolean}
   */
  isPc() {
    const userAgentInfo = navigator.userAgent;
    const agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
    const flag = agents.some(agent => userAgentInfo.indexOf(agent) > 0);
    
    // 如果不是移动设备，并且屏幕宽度较大或者是非触摸设备，认为是PC
    return !flag && (window.screen.width >= 1024 || !('ontouchstart' in window));
  },

  /**
   * 获取详细环境信息
   * @returns {object}
   */
  getEnvInfo() {
    return {
      isWeixin: this.isWeixin(),
      isMiniProgram: this.isMiniProgram(),
      isAndroid: this.isAndroid(),
      isIos: this.isIos(),
      isPc: this.isPc(),
      userAgent: navigator.userAgent,
      platform: navigator.platform
    };
  }
};

// 挂载到全局 DaxiApp 命名空间
if (typeof window !== 'undefined') {
  window.DaxiApp = window.DaxiApp || {};
  window.DaxiApp.environment = util;
}
