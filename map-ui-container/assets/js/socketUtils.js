/**
 * Socket 通信工具函数库
 * 提供与地图页面的 WebSocket 通信功能
 * 依赖：window.commonUtils.getQueryParam
 */

/**
 * 获取 URL 参数的辅助函数
 * 优先使用公共工具函数，如果不存在则使用备用实现
 * @param {string} name - 参数名
 * @returns {string|null} 参数值
 */
function _getQueryParam(name) {
  if (window.commonUtils && window.commonUtils.getQueryParam) {
    return window.commonUtils.getQueryParam(name);
  }
  // 备用实现
  const url = window.location.href.split("#")[0];
  const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
  const query = url.split("?")[1] || "";
  const result = query.match(reg);
  if (result != null) {
    return decodeURIComponent(result[2]);
  }
  return null;
}

/**
 * 地图配置对象
 * 从 URL 参数动态获取配置信息
 */
const MAP_CONFIG = {
  TOKEN: _getQueryParam("token") || "806bc162812065750b3d3958f9056008",
  DEFAULT_SCENIC_ID: "B000A11DMZ",
  USER_ID: _getQueryParam("userId") || "ot5qm6-uO9a_wfMf_fkRab5q3pgw",
  APP_ID: _getQueryParam("appId") || "wxd0206a15115585c6",
  DEVICE: _getQueryParam("device") || "SW_android_HUAWEI_NAM-AL00",
  ROLE_TYPE: "sender",
  WS_INDEX: Number(_getQueryParam("wsIndex")) || 0,
};
/**
 * POI 消息基础配置对象
 * 包含所有 POI 相关消息的公共属性
 */
const POI_MESSAGE = {
  id: MAP_CONFIG.USER_ID,
  userId: MAP_CONFIG.USER_ID,
  appId: MAP_CONFIG.APP_ID,
  appType: "wechat",
  type: "postEventToH5",
  roleType: MAP_CONFIG.ROLE_TYPE,
  forceCover: true,
  reconnect: true,
  H5Received: 0,
};

/**
 * 向 H5 地图页面发送消息
 * @param {Object} message - 消息对象
 */
function sendToH5(message) {
  window.parent.ws.send(JSON.stringify(message));
}

/**
 * 在地图页面显示 POI 点位
 * @param {string} keyword - 搜索关键词
 * @param {string} poiIds - POI ID（可选）
 */
function openPoiToH5(keyword, poiIds) {
  const message = {
    ...POI_MESSAGE,
    methodToH5: `method=showPois&keyword=${keyword}${poiIds ? `&poiIds=${poiIds}` : ""}`,
  };
  console.log("开始执行openPoiToH5函数", keyword, poiIds);
  sendToH5(message);
}

/**
 * 在地图页面显示展品详情
 * @param {string} exhibitId - 展品 ID
 */
function openExhibitToH5(exhibitId) {
  const message = {
    ...POI_MESSAGE,
    methodToH5: `method=showExhibit&id=${exhibitId}`,
  };
  console.log("开始执行openExhibitToH5函数", exhibitId);
  sendToH5(message);
}

/**
 * 在地图页面显示游览路线
 */
function openRouteToH5() {
  const message = {
    ...POI_MESSAGE,
    methodToH5: "method=exhibitionRoute",
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
 * @example
 * // 无参数跳转
 * navigateToUni('changeTab', '/pages/media/player-2');
 *
 * // 带简单参数
 * navigateToUni('navigateTo', '/pages/detail/index', {
 *     id: '123',
 *     type: 'audio'
 * });
 *
 * // 带复杂对象参数
 * navigateToUni('navigateTo', '/pages/media/player-2', {
 *     tracker: { exhibitId: '001', timestamp: Date.now() },
 *     source: 'map'
 * });
 */
function navigateToUni(action, pagePath, params = {}, options = {}) {
  // 构建methodToMiniProgram字符串
  let method = `${action}=${pagePath}`;

  // 如果有参数，序列化为查询字符串
  if (params && Object.keys(params).length > 0) {
    const queryPairs = [];

    for (const [key, value] of Object.entries(params)) {
      if (value == null || value == undefined) {
        continue; // 跳过空值
      }

      // 对象/数组需要JSON序列化后编码
      const encodedValue = typeof value == "object" ? JSON.stringify(value) : String(value);

      queryPairs.push(`${key}=${encodedValue}`);
    }

    if (queryPairs.length > 0) {
      method += `?${queryPairs.join("&")}`;
    }
  }

  // 构建消息对象
  const message = {
    type: "postEventToMiniProgram",
    id: options.userId || window.parent.commonUtils.getQueryParam("userId"),
    methodToMiniProgram: method,
    roleType: "receiver",
  };

  // 发送WebSocket消息
  if (window.parent && window.parent.ws) {
    window.parent.ws.send(JSON.stringify(message));
    console.log("[navigateToUni] 发送消息:", method);
  } else {
    console.error("[navigateToUni] WebSocket未连接");
  }
}

// 导出到全局，供其他页面使用
window.openPoiToH5 = openPoiToH5;
window.openExhibitToH5 = openExhibitToH5;
window.openRouteToH5 = openRouteToH5;
window.navigateToUni = navigateToUni;
// getQueryParam 已在 utils.js 中通过 commonUtils 导出，无需重复导出
