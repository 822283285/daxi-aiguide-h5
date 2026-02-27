const DEFAULT_ENV = "dev";

const DEFAULT_ENV_MATRIX = {
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

const DEFAULT_ALLOWED_QUERY_PARAMS = [
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

function normalizeBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string") {
    return "";
  }
  return baseUrl.replace(/\/+$/, "");
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
}

export class ConfigService {
  constructor(options = {}) {
    this.globalRef = options.globalRef || globalThis;
    this.allowedQueryParams = options.allowedQueryParams || DEFAULT_ALLOWED_QUERY_PARAMS;
    this.envMatrix = options.envMatrix || DEFAULT_ENV_MATRIX;
    this.defaultEnv = options.defaultEnv || DEFAULT_ENV;
  }

  static fromWindow(globalRef) {
    return new ConfigService({ globalRef });
  }

  getAllQueryParams(search = this.globalRef?.location?.search || "") {
    const params = {};
    const searchParams = new URLSearchParams(search || "");
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    return params;
  }

  getAllowedQueryParams(search = this.globalRef?.location?.search || "") {
    const source = this.getAllQueryParams(search);
    const result = {};

    this.allowedQueryParams.forEach((key) => {
      if (source[key] !== undefined) {
        result[key] = source[key];
      }
    });

    return result;
  }

  getParam(name, options = {}) {
    if (!name) {
      return null;
    }

    const runtimeGetter = this.globalRef?.runtimeConfig?.getParam;
    if (typeof runtimeGetter === "function") {
      const runtimeValue = runtimeGetter(name);
      if (runtimeValue !== undefined && runtimeValue !== null) {
        return options.decode === false ? runtimeValue : safeDecode(runtimeValue);
      }
    }

    const safeParams = this.getAllowedQueryParams();
    if (safeParams[name] !== undefined) {
      return options.decode === false ? safeParams[name] : safeDecode(safeParams[name]);
    }

    if (options.allowUnsafe === true) {
      const allParams = this.getAllQueryParams();
      if (allParams[name] !== undefined) {
        return options.decode === false ? allParams[name] : safeDecode(allParams[name]);
      }
    }

    return null;
  }

  getCurrentEnv() {
    return this.getParam("env") || this.defaultEnv;
  }

  getEnvConfig() {
    const env = this.getCurrentEnv();
    const selected = this.envMatrix[env] || this.envMatrix[this.defaultEnv] || {};
    return {
      env,
      ...selected,
    };
  }

  getScenicUrls() {
    const token = this.getParam("token") || "";
    const buildingId = this.getParam("buildingId") || "";
    const base = normalizeBaseUrl(this.getEnvConfig().mapDataBaseUrl);

    return {
      baseUrl: `${base}/`,
      projectUrl: token ? `${base}/${token}/` : `${base}/`,
      scenicUrl: token && buildingId ? `${base}/${token}/${buildingId}/` : `${base}/`,
    };
  }
}

