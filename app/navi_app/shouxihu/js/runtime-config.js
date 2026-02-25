(function (global) {
  "use strict";

  global.indoorLocalAlgorithms = "fusion";
  global.mapSDKPath = "../../../map_sdk/";

  const ALLOWED_QUERY_PARAMS = [
    "env",
    "token",
    "buildingId",
    "userId",
    "appId",
    "device",
    "testLocWs",
    "disabledH5Location",
    "wsIndex",
    "sendLocType",
    "method",
    "platform",
    "lang",
    "scenic",
  ];

  const ENV_MATRIX = {
    dev: {
      apiBaseUrl: "https://cloud.daxicn.com/publicData",
      staticBaseUrl: "https://cloud.daxicn.com/publicData",
      wsBaseUrl: "wss://map.daxicn.com/ws/loc",
      mapDataBaseUrl: "https://cloud.daxicn.com/publicData",
    },
    uat: {
      apiBaseUrl: "https://cloud.daxicn.com/publicData",
      staticBaseUrl: "https://cloud.daxicn.com/publicData",
      wsBaseUrl: "wss://map.daxicn.com/ws/loc",
      mapDataBaseUrl: "https://cloud.daxicn.com/publicData",
    },
    prod: {
      apiBaseUrl: "https://cloud.daxicn.com/scenic",
      staticBaseUrl: "https://cloud.daxicn.com/scenic",
      wsBaseUrl: "wss://map.daxicn.com/ws/loc",
      mapDataBaseUrl: "https://cloud.daxicn.com/scenic",
    },
  };

  function getAllQueryParams(search = global.location.search) {
    const params = {};
    const searchParams = new URLSearchParams(search || "");
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    return params;
  }

  function pickAllowedQuery(search = global.location.search) {
    const source = getAllQueryParams(search);
    const result = {};
    ALLOWED_QUERY_PARAMS.forEach((key) => {
      if (source[key] !== undefined) {
        result[key] = source[key];
      }
    });
    return result;
  }

  const queryParams = pickAllowedQuery();
  const currentEnv = queryParams.env || "dev";
  const envConfig = ENV_MATRIX[currentEnv] || ENV_MATRIX.dev;

  function getParam(name) {
    if (!name) return null;
    if (queryParams[name] !== undefined) {
      return queryParams[name];
    }
    return getAllQueryParams()[name] ?? null;
  }

  function normalizeBaseUrl(baseUrl) {
    if (typeof baseUrl !== "string") {
      return "";
    }
    return baseUrl.replace(/\/+$/, "");
  }

  function getEnvConfig() {
    return {
      env: currentEnv,
      ...envConfig,
    };
  }

  function getScenicUrls() {
    const token = getParam("token") || "";
    const buildingId = getParam("buildingId") || "";
    const base = normalizeBaseUrl(getEnvConfig().mapDataBaseUrl);

    return {
      baseUrl: `${base}/`,
      projectUrl: token ? `${base}/${token}/` : `${base}/`,
      scenicUrl: token && buildingId ? `${base}/${token}/${buildingId}/` : `${base}/`,
    };
  }

  function generateAESData(openid, nickname) {
    if (typeof CryptoJS === "undefined") {
      console.warn("CryptoJS 未加载，AES 加密降级为明文 JSON");
      return JSON.stringify({ openid, nickname });
    }

    const data = {
      openid,
      nickname,
    };

    const key = CryptoJS.enc.Utf8.parse("Y5jtoFVaMismiJ2y");
    const srcs = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
    const encrypted = CryptoJS.AES.encrypt(srcs, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    return encrypted.toString();
  }

  function buildMiniProgramUrl(pagePath, params = {}) {
    if (!pagePath) {
      return "";
    }

    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      query.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    });

    const queryString = query.toString();
    if (!queryString) {
      return pagePath;
    }
    return `${pagePath}${pagePath.includes("?") ? "&" : "?"}${queryString}`;
  }

  /**
   * 向 uni-app 小程序发送导航消息（通过 WebSocket）
   * @param {string} action - 操作类型 ('changeTab' | 'navigateTo' | 'redirectTo' | 'reLaunch')
   * @param {string} pagePath - 页面路径，如 '/pages/media/player-2'
   * @param {Object} [params={}] - 页面参数对象
   */
  function navigateToUni(action, pagePath, params = {}) {
    if (!pagePath) {
      console.warn("[navigateToUni] pagePath 为空");
      return false;
    }

    if (!global.ws) {
      console.error("[navigateToUni] WebSocket 不可用");
      return false;
    }

    // 构建 method 字符串：action=pagePath?key=value&key2=value2
    let method = `${action}=${pagePath}`;
    const queryPairs = [];
    for (const [key, value] of Object.entries(params || {})) {
      if (value == null || value == undefined) continue;
      queryPairs.push(`${key}=${typeof value == "object" ? JSON.stringify(value) : String(value)}`);
    }
    if (queryPairs.length > 0) {
      method += `?${queryPairs.join("&")}`;
    }

    const message = {
      type: "postEventToMiniProgram",
      id: getParam("userId") || "",
      methodToMiniProgram: method,
      roleType: "receiver",
    };

    global.ws.send(JSON.stringify(message));
    console.log("[navigateToUni] 发送消息:", method);
    return true;
  }

  global.runtimeConfig = {
    ALLOWED_QUERY_PARAMS,
    ENV_MATRIX,
    getAllQueryParams,
    pickAllowedQuery,
    getParam,
    getEnvConfig,
    getScenicUrls,
  };

  global.commonUtils = {
    ...(global.commonUtils || {}),
    getAllQueryParams,
    getQueryParam: getParam,
    getRuntimeParam: getParam,
    getQueryParamFromSelfOrParent: getParam,
    getBaseUrl: function () {
      return getScenicUrls().baseUrl;
    },
    getProjectUrl: function () {
      return getScenicUrls().projectUrl;
    },
    getScenicUrl: function () {
      return getScenicUrls().scenicUrl;
    },
    getUserInfoUrl: function () {
      const apiBaseUrl = getEnvConfig().apiBaseUrl || "";
      return `${apiBaseUrl}/payApi/merchantApi/api/wxuser/info`;
    },
    generateAESData,
    navigateToUni,
  };

  global.navigateToUni = navigateToUni;

  const scenicUrls = getScenicUrls();
  global.dataPath = scenicUrls.baseUrl;
  global.projectUrl = scenicUrls.projectUrl;
  global.scenicUrl = scenicUrls.scenicUrl;
  global.localFont = true;

  console.log("运行在直连模式，已使用 URL 参数完成运行时配置初始化", {
    env: currentEnv,
    dataPath: global.dataPath,
  });
})(window);
