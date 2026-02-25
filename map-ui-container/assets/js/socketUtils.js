/**
 * Socket 通信工具函数库
 * 提供与地图页面的 WebSocket 通信功能
 * 依赖：window.commonUtils / window.messageFactory
 */

function getParam(name) {
  return window.messageFactory?.getParam?.(name) || null;
}

/**
 * 向 H5 地图页面发送消息
 * @param {Object} message - 消息对象
 * @returns {boolean} 是否发送成功
 */
function sendToH5(message) {
  return window.messageFactory?.sendToParentWs?.(message, "sendToH5") || false;
}

/**
 * 在地图页面显示 POI 点位
 * @param {string} keyword - 搜索关键词
 * @param {string} poiIds - POI ID（可选）
 */
function openPoiToH5(keyword, poiIds) {
  const methodToH5 = `method=showPois&keyword=${keyword}${poiIds ? `&poiIds=${poiIds}` : ""}`;
  const message = window.messageFactory?.buildH5Message
    ? window.messageFactory.buildH5Message(methodToH5)
    : {
        type: "postEventToH5",
        methodToH5,
        roleType: "sender",
      };

  console.log("开始执行openPoiToH5函数", keyword, poiIds);
  sendToH5(message);
}

/**
 * 在地图页面显示展品详情
 * @param {string} exhibitId - 展品 ID
 */
function openExhibitToH5(exhibitId) {
  const methodToH5 = `method=showExhibit&id=${exhibitId}`;
  const message = window.messageFactory?.buildH5Message
    ? window.messageFactory.buildH5Message(methodToH5)
    : {
        type: "postEventToH5",
        methodToH5,
        roleType: "sender",
      };

  console.log("开始执行openExhibitToH5函数", exhibitId);
  sendToH5(message);
}

/**
 * 在地图页面显示游览路线
 */
function openRouteToH5() {
  const methodToH5 = "method=exhibitionRoute";
  const message = window.messageFactory?.buildH5Message
    ? window.messageFactory.buildH5Message(methodToH5)
    : {
        type: "postEventToH5",
        methodToH5,
        roleType: "sender",
      };

  console.log("开始执行openRouteToH5函数");
  sendToH5(message);
}

/**
 * 向uni-app小程序发送导航消息
 * @param {string} action - 操作类型 ('changeTab' | 'navigateTo' | 'redirectTo' | 'reLaunch')
 * @param {string} pagePath - 页面路径，如 '/pages/media/player-2'
 * @param {Object} [params={}] - 页面参数对象
 * @param {Object} [options={}] - 额外配置
 * @param {string} [options.userId] - 用户ID，默认从URL获取
 */
function navigateToUni(action, pagePath, params = {}, options = {}) {
  let method = `${action}=${pagePath}`;

  if (params && Object.keys(params).length > 0) {
    const queryPairs = [];

    for (const [key, value] of Object.entries(params)) {
      if (value == null || value == undefined) {
        continue;
      }
      const encodedValue = typeof value == "object" ? JSON.stringify(value) : String(value);
      queryPairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(encodedValue)}`);
    }

    if (queryPairs.length > 0) {
      method += `?${queryPairs.join("&")}`;
    }
  }

  const message = window.messageFactory?.buildMiniProgramMessage
    ? window.messageFactory.buildMiniProgramMessage(method, { userId: options.userId })
    : {
        type: "postEventToMiniProgram",
        id: options.userId || getParam("userId") || "",
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
