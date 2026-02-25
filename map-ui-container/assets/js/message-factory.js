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
    if (global.parent && global.parent !== global && global.parent.ws) {
      return global.parent.ws;
    }
    return null;
  }

  function sendToParentWs(message, logTag = "MessageFactory") {
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
    sendToParentWs,
    buildMiniProgramMessage,
    buildH5Message,
  };
})(window);
