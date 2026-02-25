(function (global) {
  "use strict";

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
      apiBaseUrl: "http://192.168.50.83:9300",
      staticBaseUrl: "http://192.168.50.83:9300",
      wsBaseUrl: "ws://192.168.50.83:9300/ws",
      mapDataBaseUrl: "http://192.168.50.83:9300",
    },
    uat: {
      apiBaseUrl: "https://cloud.daxicn.com/publicData",
      staticBaseUrl: "https://cloud.daxicn.com/publicData",
      wsBaseUrl: "wss://cloud.daxicn.com/publicData/ws",
      mapDataBaseUrl: "https://cloud.daxicn.com/publicData",
    },
    prod: {
      apiBaseUrl: "https://cloud.daxicn.com/scenic",
      staticBaseUrl: "https://cloud.daxicn.com/scenic",
      wsBaseUrl: "wss://cloud.daxicn.com/scenic/ws",
      mapDataBaseUrl: "https://cloud.daxicn.com/scenic",
    },
  };

  const envInjection = global.__DX_RUNTIME_INJECT__ || {};

  function pickAllowedQuery(search = global.location.search) {
    const params = new URLSearchParams(search || "");
    const result = {};
    for (const key of ALLOWED_QUERY_PARAMS) {
      if (params.has(key)) {
        result[key] = params.get(key);
      }
    }
    return result;
  }

  const queryParams = pickAllowedQuery();
  const currentEnv = queryParams.env || envInjection.env || "dev";
  const envConfig = ENV_MATRIX[currentEnv] || ENV_MATRIX.dev;

  function getParam(name) {
    if (!name || !ALLOWED_QUERY_PARAMS.includes(name)) {
      return null;
    }
    return queryParams[name] ?? null;
  }

  function maskValue(value) {
    if (typeof value != "string") {
      return value;
    }
    if (value.length <= 4) {
      return "****";
    }
    return `${value.slice(0, 2)}***${value.slice(-2)}`;
  }

  function reportObservableError(code, detail = {}) {
    const payload = {
      code,
      detail,
      ts: Date.now(),
    };

    console.error(`[runtime-config:${code}]`, payload);
    global.dispatchEvent(
      new CustomEvent("daxi:observable-error", {
        detail: payload,
      })
    );

    return payload;
  }

  function requireParams(requiredKeys, context = "runtime") {
    const missing = [];
    const values = {};

    (requiredKeys || []).forEach((key) => {
      const value = getParam(key);
      if (value == null || value === "") {
        missing.push(key);
      }
      values[key] = value;
    });

    if (missing.length > 0) {
      reportObservableError("MISSING_REQUIRED_PARAMS", {
        context,
        missing,
        provided: Object.fromEntries(Object.entries(values).map(([key, val]) => [key, maskValue(val)])),
      });
      return {
        valid: false,
        missing,
        values,
      };
    }

    return {
      valid: true,
      missing,
      values,
    };
  }

  function getEnvConfig() {
    return {
      env: currentEnv,
      ...envConfig,
      ...envInjection,
    };
  }


  function normalizeBaseUrl(baseUrl) {
    if (typeof baseUrl != "string") {
      return "";
    }
    return baseUrl.replace(/\/+$/, "");
  }

  function getScenicUrls() {
    const token = getParam("token");
    const buildingId = getParam("buildingId");
    const base = normalizeBaseUrl(getEnvConfig().mapDataBaseUrl);

    return {
      baseUrl: `${base}/`,
      projectUrl: token ? `${base}/${token}` : base,
      scenicUrl: token && buildingId ? `${base}/${token}/${buildingId}` : base,
    };
  }

  global.runtimeConfig = {
    ALLOWED_QUERY_PARAMS,
    ENV_MATRIX,
    pickAllowedQuery,
    getParam,
    getEnvConfig,
    getScenicUrls,
    maskValue,
    requireParams,
    reportObservableError,
  };
})(window);
