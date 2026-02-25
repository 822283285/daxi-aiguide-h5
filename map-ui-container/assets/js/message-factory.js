/**
 * 消息工厂模块
 * 统一构建父子容器通信消息，并提供父窗口 WebSocket 发送能力
 */
(function (global) {
  "use strict";

  function getParam(name) {
    if (global.commonUtils?.getQueryParamFromSelfOrParent) {
      return global.commonUtils.getQueryParamFromSelfOrParent(name);
    }
    if (global.commonUtils?.getQueryParam) {
      return global.commonUtils.getQueryParam(name);
    }
    return null;
  }

  function getParentWs() {
    if (global.parent && global.parent.ws) {
      return global.parent.ws;
    }
    return null;
  }

  /**
   * 构建 method 字符串
   * @param {string} action - 主动作，如 changeTab / method
   * @param {string} pathOrValue - path 或 value
   * @param {Object} [params={}] - 参数对象
   * @returns {string}
   */
  function buildMethodString(action, pathOrValue, params = {}) {
    let method = `${action}=${pathOrValue}`;

    const queryPairs = [];
    for (const [key, value] of Object.entries(params || {})) {
      if (value == null || value == undefined) continue;
      const encodedValue = typeof value == "object" ? JSON.stringify(value) : String(value);
      queryPairs.push(`${key}=${encodedValue}`);
    }

    if (queryPairs.length > 0) {
      method += `?${queryPairs.join("&")}`;
    }

    return method;
  }

  /**
   * 校验消息基础字段
   * @param {Object} message - 消息对象
   * @returns {boolean}
   */
  function validateMessage(message) {
    if (!message || typeof message != "object") {
      console.error("[MessageFactory] 无效消息对象", message);
      return false;
    }

    if (!message.type) {
      console.error("[MessageFactory] 消息缺少 type 字段", message);
      return false;
    }

    if (message.type == "postEventToMiniProgram" && !message.methodToMiniProgram) {
      console.error("[MessageFactory] MiniProgram 消息缺少 methodToMiniProgram", message);
      return false;
    }

    if (message.type == "postEventToH5" && !message.methodToH5) {
      console.error("[MessageFactory] H5 消息缺少 methodToH5", message);
      return false;
    }

    if (!message.id && global.__DX_DEBUG__) {
      console.warn("[MessageFactory] 消息未携带 id（调试告警）", message);
    }

    return true;
  }

  function sendToParentWs(message, logTag = "MessageFactory") {
    if (!validateMessage(message)) {
      return false;
    }

    const ws = getParentWs();
    if (!ws) {
      console.error(`[${logTag}] 父窗口 WebSocket 不可用`);
      return false;
    }

    ws.send(JSON.stringify(message));
    return true;
  }

  function buildMiniProgramMessage(methodToMiniProgram, options = {}) {
    return {
      type: "postEventToMiniProgram",
      id: options.userId || getParam("userId") || "",
      methodToMiniProgram,
      roleType: options.roleType || "receiver",
    };
  }

  function buildH5Message(methodToH5, options = {}) {
    const userId = options.userId || getParam("userId") || "";
    return {
      id: userId,
      userId,
      appId: options.appId || getParam("appId") || "",
      appType: options.appType || "wechat",
      type: options.type || "postEventToH5",
      roleType: options.roleType || "sender",
      forceCover: options.forceCover !== undefined ? options.forceCover : true,
      reconnect: options.reconnect !== undefined ? options.reconnect : true,
      H5Received: options.H5Received !== undefined ? options.H5Received : 0,
      methodToH5,
    };
  }

  global.messageFactory = {
    getParam,
    getParentWs,
    buildMethodString,
    validateMessage,
    sendToParentWs,
    buildMiniProgramMessage,
    buildH5Message,
  };
})(window);
