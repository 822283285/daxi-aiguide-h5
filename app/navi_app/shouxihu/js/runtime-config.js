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

  function navigateToUni(action, pagePath, params = {}) {
    const miniProgram = global.wx?.miniProgram;
    const url = buildMiniProgramUrl(pagePath, params);

    if (!miniProgram || !url) {
      console.warn("navigateToUni 调用失败：miniProgram 环境不可用或 url 为空", {
        action,
        pagePath,
      });
      return false;
    }

    const actionMapping = {
      changeTab: "switchTab",
      navigateTo: "navigateTo",
      redirectTo: "redirectTo",
      reLaunch: "reLaunch",
      switchTab: "switchTab",
    };

    const invokeAction = actionMapping[action] || "navigateTo";
    if (typeof miniProgram[invokeAction] !== "function") {
      console.warn("navigateToUni 调用失败：miniProgram API 不存在", {
        action,
        invokeAction,
      });
      return false;
    }

    miniProgram[invokeAction]({ url });
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
