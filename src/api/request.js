/**
 * @fileoverview axios 请求封装
 * @description 支持自动初始化，从 URL 和远程配置获取参数
 * @author daxi
 * @created 2026-02-26
 * @version 2.1
 */

import { windowAdapter } from "@/legacy/window-adapter.js";

const isBrowser = windowAdapter.isBrowser;
let axiosInstance = null;

if (isBrowser) {
  if (windowAdapter.axios) {
    axiosInstance = windowAdapter.axios.create();
  } else {
    console.error("[Request] 未找到 axios，请确保已引入 axios 库");
  }
} else {
  try {
    const axios = require("axios");
    axiosInstance = axios.create();
  } catch (e) {
    console.error("[Request] 未找到 axios 模块:", e.message);
  }
}

const REMOTE_CONFIG_URL =
  "https://cloud.daxicn.com/publicData/806bc162812065750b3d3958f9056008/appConfig/app.json";
const DEFAULT_CONFIG = {
  timeout: 15000,
  needSign: true,
  showLog: true,
  headers: { "Content-Type": "application/json" },
};

const appConfig = {
  baseUrl: "",
  scenicApiUrl: "",
  userApiUrl: "",
  secret: "1CFE42085637416ADAF6AEF60A832342",
};
let appParams = { token: "", bdid: "", userId: "", appId: "" };
let isInitialized = false;
let initPromise = null;
let signMd5Utils = null;

function getUrlParam(name) {
  if (!isBrowser) return null;
  const url = windowAdapter.location.href.split("#")[0];
  const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`);
  const query = url.split("?")[1] || "";
  const result = query.match(reg);
  return result != null ? decodeURIComponent(result[2]) : null;
}

function getAppParamsFromUrl() {
  return {
    token: getUrlParam("token") || windowAdapter.getParam?.("token") || "",
    bdid:
      getUrlParam("bdid") ||
      windowAdapter.getParam?.("bdid") ||
      getUrlParam("buildingId") ||
      windowAdapter.getParam?.("buildingId") ||
      getUrlParam("poiid") ||
      windowAdapter.getParam?.("poiid") ||
      "",
    userId: getUrlParam("userId") || windowAdapter.getParam?.("userId") || "",
    appId: getUrlParam("appId") || windowAdapter.getParam?.("appId") || "",
  };
}

function getSign(url, data) {
  if (!signMd5Utils) {
    console.warn("[Request] 签名工具未加载，跳过签名");
    return "";
  }
  return signMd5Utils.getSign(url, data);
}

function getTimestamp() {
  return signMd5Utils ? signMd5Utils.getTimestamp() : Date.now();
}

function buildSignHeaders(url, data) {
  return {
    "X-Sign": getSign(url, data),
    "X-TIMESTAMP": getTimestamp(),
    "Content-Type": "application/json",
  };
}

function requestLog(type, options) {
  if (!options.showLog) return;
  const { url, method, params, data, response, error, duration } = options;
  const timestamp = new Date().toISOString();
  if (type === "request") {
    console.log(`[Request] ${timestamp} 发送`, url, method, params, data);
  } else if (type === "response") {
    console.log(`[Request] ${timestamp} 响应`, url, method, `${duration}ms`, response);
  } else if (type === "error") {
    console.error(`[Request] ${timestamp} 失败`, url, method, `${duration}ms`, error);
  }
}

function requestInterceptor(config) {
  config.startTime = Date.now();
  config.headers = { ...DEFAULT_CONFIG.headers, ...(config.headers || {}) };
  if (config.needSign !== false && signMd5Utils) {
    const signTarget = config.method?.toUpperCase() === "POST" ? config.data : config.params;
    config.headers = { ...config.headers, ...buildSignHeaders(config.url, signTarget || {}) };
  }
  if (appParams.token) config.params = { ...config.params, token: appParams.token };
  if (appParams.bdid) config.params = { ...config.params, bdid: appParams.bdid };
  if (config.showLog !== false) {
    requestLog("request", {
      url: config.url,
      method: config.method,
      params: config.params,
      data: config.data,
      showLog: config.showLog,
    });
  }
  return config;
}

function responseInterceptor(response) {
  const config = response.config;
  const duration = Date.now() - config.startTime;
  if (config.showLog !== false) {
    requestLog("response", {
      url: config.url,
      method: config.method,
      response: response.data,
      duration,
      showLog: config.showLog,
    });
  }
  const responseData = response.data;
  if (!responseData.hasOwnProperty("code") && !responseData.hasOwnProperty("status"))
    return responseData;
  const successCodes = [200, 0, "200", "0"];
  if (successCodes.includes(responseData.code) || successCodes.includes(responseData.status)) {
    return responseData.data || responseData;
  }
  const error = new Error(responseData.message || "请求失败");
  error.code = responseData.code || responseData.status;
  error.data = responseData.data;
  throw error;
}

function errorInterceptor(error) {
  const config = error.config;
  const duration = Date.now() - (config.startTime || Date.now());
  if (config?.showLog !== false) {
    requestLog("error", {
      url: config.url,
      method: config.method,
      error: error.message || error,
      duration,
      showLog: config.showLog,
    });
  }
  let errorMessage = "网络请求失败",
    errorCode = "NETWORK_ERROR";
  if (error.response) {
    const status = error.response.status;
    const errorMap = {
      400: ["请求参数错误", "BAD_REQUEST"],
      401: ["未授权", "UNAUTHORIZED"],
      403: ["拒绝访问", "FORBIDDEN"],
      404: ["资源不存在", "NOT_FOUND"],
      500: ["服务器错误", "SERVER_ERROR"],
    };
    [errorMessage, errorCode] = errorMap[status] || [
      error.response.data?.message || `HTTP ${status}`,
      `HTTP_${status}`,
    ];
  } else if (error.request) {
    errorMessage = "网络超时";
    errorCode = "NETWORK_TIMEOUT";
  }
  const customError = new Error(errorMessage);
  customError.code = errorCode;
  customError.originalError = error;
  customError.status = error.response?.status;
  throw customError;
}

async function initFromRemoteConfig() {
  if (!axiosInstance) throw new Error("[Request] axios 未初始化");
  try {
    console.log("[Request] 加载远程配置...", REMOTE_CONFIG_URL);
    const response = await axiosInstance.get(REMOTE_CONFIG_URL, { timeout: 10000, showLog: false });
    const config = response.data;
    const result = {
      baseUrl: config.scenic?.static_url || "",
      scenicApiUrl: config.scenic?.api_url || "",
      userApiUrl: config.user?.userServerUrl || "",
      secret: config.secret || "1CFE42085637416ADAF6AEF60A832342",
      rawConfig: config,
    };
    console.log("[Request] 远程配置加载成功", result);
    return result;
  } catch (error) {
    console.error("[Request] 远程配置加载失败:", error);
    return {
      baseUrl: "",
      scenicApiUrl: "",
      userApiUrl: "",
      secret: "1CFE42085637416ADAF6AEF60A832342",
      rawConfig: {},
    };
  }
}

async function init(config) {
  if (!axiosInstance) throw new Error("[Request] axios 未初始化");
  if (isInitialized) {
    console.log("[Request] 已初始化，跳过");
    return;
  }

  try {
    if (!config) {
      console.log("[Request] 自动初始化...");
      console.log("[Request] 检查依赖:", {
        "windowAdapter.axios": windowAdapter.axios ? "✓" : "✗",
        "windowAdapter.CryptoJS": windowAdapter.CryptoJS ? "✓" : "✗",
        "windowAdapter.signMd5Utils": windowAdapter.signMd5Utils ? "✓" : "✗",
      });

      const remoteConfig = await initFromRemoteConfig();
      const urlParams = getAppParamsFromUrl();
      config = {
        baseUrl: remoteConfig.baseUrl,
        scenicApiUrl: remoteConfig.scenicApiUrl,
        userApiUrl: remoteConfig.userApiUrl,
        appParams: urlParams,
        secret: remoteConfig.secret,
        signUtils: windowAdapter.signMd5Utils || null,
      };

      if (!config.signUtils) {
        console.warn("[Request] ⚠️ 签名工具未加载，请求将不签名！");
        console.warn("[Request] 请确保在 HTML 中按顺序引入：");
        console.warn("  1. crypto-js.js");
        console.warn("  2. signMd5Utils.js");
        console.warn("  3. API 模块");
      }

      console.log("[Request] 配置:", config);
    }

    if (config.baseUrl) appConfig.baseUrl = config.baseUrl;
    if (config.scenicApiUrl) appConfig.scenicApiUrl = config.scenicApiUrl;
    if (config.userApiUrl) appConfig.userApiUrl = config.userApiUrl;
    if (config.secret) appConfig.secret = config.secret;
    if (config.appParams) appParams = { ...appParams, ...config.appParams };
    if (config.signUtils) {
      signMd5Utils = config.signUtils;
      console.log("[Request] ✓ 签名工具已加载");
    }

    axiosInstance.defaults.timeout = DEFAULT_CONFIG.timeout;
    if (appConfig.baseUrl) axiosInstance.defaults.baseURL = appConfig.baseUrl;
    axiosInstance.interceptors.request.use(
      (config) => requestInterceptor(config),
      (error) => Promise.reject(error)
    );
    axiosInstance.interceptors.response.use(
      (response) => responseInterceptor(response),
      (error) => errorInterceptor(error)
    );

    isInitialized = true;
    console.log("[Request] ✓ 初始化成功", { baseUrl: appConfig.baseUrl, params: appParams });
  } catch (error) {
    console.error("[Request] ✗ 初始化失败:", error);
    throw error;
  }
}

async function ensureInitialized() {
  if (!isInitialized) {
    if (!initPromise) initPromise = init();
    await initPromise;
  }
}

async function request(options) {
  await ensureInitialized();
  if (!axiosInstance) throw new Error("[Request] axios 未初始化");
  const config = { ...DEFAULT_CONFIG, ...options };
  try {
    return axiosInstance.request(config);
  } catch (error) {
    console.error("[Request] 请求失败:", error);
    throw error;
  }
}

function get(url, params = {}, config = {}) {
  return request({ ...config, url, method: "GET", params });
}
function post(url, data = {}, config = {}) {
  return request({ ...config, url, method: "POST", data });
}

function updateAppParams(params) {
  appParams = { ...appParams, ...params };
  console.log("[Request] 参数已更新", appParams);
}
function getAppParams() {
  return { ...appParams };
}
function getAppConfig() {
  return { ...appConfig };
}
function getRemoteConfig() {
  return initFromRemoteConfig();
}

export {
  init,
  request,
  get,
  post,
  updateAppParams,
  getAppParams,
  getAppConfig,
  getRemoteConfig,
  ensureInitialized,
  axiosInstance,
};

if (isBrowser) {
  windowAdapter.daxiRequest = {
    init,
    request,
    get,
    post,
    updateAppParams,
    getAppParams,
    getAppConfig,
    getRemoteConfig,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    init,
    request,
    get,
    post,
    updateAppParams,
    getAppParams,
    getAppConfig,
    getRemoteConfig,
    axiosInstance,
  };
}
