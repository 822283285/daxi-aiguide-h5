/**
 * Socket 通信工具函数库
 * 提供与地图页面的 WebSocket 通信功能
 * 依赖：window.runtimeConfig / window.messageFactory
 */

function buildMethod(action, value, params = {}) {
  if (window.messageFactory?.buildMethodString) {
    return window.messageFactory.buildMethodString(action, value, params);
  }

  let method = `${action}=${value}`;
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, val]) => {
    if (val != null && val != undefined) {
      const nextVal = typeof val == "object" ? JSON.stringify(val) : String(val);
      query.append(key, nextVal);
    }
  });
  const queryString = query.toString();
  if (queryString) {
    method += `?${queryString}`;
  }
  return method;
}

function checkSocketRequiredParams(context, extraRequired = []) {
  const requiredKeys = ["token", "buildingId", "userId", "appId", "device", ...extraRequired];
  return (
    window.runtimeConfig?.requireParams?.(requiredKeys, `socketUtils:${context}`) || {
      valid: false,
      values: {},
      missing: requiredKeys,
    }
  );
}

/**
 * 向 H5 地图页面发送消息
 * @param {Object} message - 消息对象
 * @returns {boolean} 是否发送成功
 */
function sendToH5(message, context = "sendToH5") {
  const checkResult = checkSocketRequiredParams(context);
  if (!checkResult.valid) {
    return false;
  }
  return window.messageFactory?.sendToParentWs?.(message, context) || false;
}

/**
 * 在地图页面显示 POI 点位
 * @param {string} keyword - 搜索关键词
 * @param {string} poiIds - POI ID（可选）
 */
function openPoiToH5(keyword, poiIds) {
  const checkResult = checkSocketRequiredParams("openPoiToH5");
  if (!checkResult.valid) {
    return;
  }

  const methodToH5 = buildMethod("method", "showPois", {
    keyword: keyword || "",
    poiIds: poiIds || undefined,
  });

  const message = window.messageFactory?.buildH5Message
    ? window.messageFactory.buildH5Message(methodToH5, {
        userId: checkResult.values.userId,
        appId: checkResult.values.appId,
      })
    : {
        id: checkResult.values.userId,
        userId: checkResult.values.userId,
        appId: checkResult.values.appId,
        appType: "wechat",
        type: "postEventToH5",
        roleType: "sender",
        forceCover: true,
        reconnect: true,
        H5Received: 0,
        methodToH5,
      };

  console.log("开始执行openPoiToH5函数", keyword, poiIds);
  sendToH5(message, "openPoiToH5");
}

/**
 * 在地图页面显示展品详情
 * @param {string} exhibitId - 展品 ID
 */
function openExhibitToH5(exhibitId) {
  const checkResult = checkSocketRequiredParams("openExhibitToH5");
  if (!checkResult.valid) {
    return;
  }

  const methodToH5 = buildMethod("method", "showExhibit", { id: exhibitId });

  const message = window.messageFactory?.buildH5Message
    ? window.messageFactory.buildH5Message(methodToH5, {
        userId: checkResult.values.userId,
        appId: checkResult.values.appId,
      })
    : {
        id: checkResult.values.userId,
        userId: checkResult.values.userId,
        appId: checkResult.values.appId,
        appType: "wechat",
        type: "postEventToH5",
        roleType: "sender",
        forceCover: true,
        reconnect: true,
        H5Received: 0,
        methodToH5,
      };

  console.log("开始执行openExhibitToH5函数", exhibitId);
  sendToH5(message, "openExhibitToH5");
}

/**
 * 在地图页面显示游览路线
 */
function openRouteToH5() {
  const checkResult = checkSocketRequiredParams("openRouteToH5");
  if (!checkResult.valid) {
    return;
  }

  const methodToH5 = buildMethod("method", "exhibitionRoute");

  const message = window.messageFactory?.buildH5Message
    ? window.messageFactory.buildH5Message(methodToH5, {
        userId: checkResult.values.userId,
        appId: checkResult.values.appId,
      })
    : {
        id: checkResult.values.userId,
        userId: checkResult.values.userId,
        appId: checkResult.values.appId,
        appType: "wechat",
        type: "postEventToH5",
        roleType: "sender",
        forceCover: true,
        reconnect: true,
        H5Received: 0,
        methodToH5,
      };

  console.log("开始执行openRouteToH5函数");
  sendToH5(message, "openRouteToH5");
}

/**
 * 向uni-app小程序发送导航消息
 * @param {string} action - 操作类型 ('changeTab' | 'navigateTo' | 'redirectTo' | 'reLaunch')
 * @param {string} pagePath - 页面路径，如 '/pages/media/player-2'
 * @param {Object} [params={}] - 页面参数对象
 * @param {Object} [options={}] - 额外配置
 * @param {string} [options.userId] - 用户ID（必填，允许显式传入覆盖）
 */
function navigateToUni(action, pagePath, params = {}, options = {}) {
  const checkResult = checkSocketRequiredParams("navigateToUni");
  if (!checkResult.valid) {
    return;
  }

  const method = buildMethod(action, pagePath, params);
  const userId = options.userId || checkResult.values.userId;

  const message = window.messageFactory?.buildMiniProgramMessage
    ? window.messageFactory.buildMiniProgramMessage(method, { userId })
    : {
        type: "postEventToMiniProgram",
        id: userId,
        methodToMiniProgram: method,
        roleType: "receiver",
      };

  const success = window.messageFactory?.sendToParentWs?.(message, "navigateToUni");
  if (success) {
    console.log("[navigateToUni] 发送消息:", method);
  }
}

window.openPoiToH5 = openPoiToH5;
window.openExhibitToH5 = openExhibitToH5;
window.openRouteToH5 = openRouteToH5;
window.navigateToUni = navigateToUni;
