/**
 * @fileoverview 景区配置相关 API
 * @description 提供景区配置、首页配置、服务页配置等功能
 * @author daxi
 * @created 2026-02-26
 */

import { get, getAppParams, ensureInitialized } from "../request.js";

/**
 * 获取当前用户参数
 * @returns {Object} 用户参数对象
 */
async function getCurrentUserParams() {
  await ensureInitialized();
  const appParams = getAppParams();
  return {
    token: appParams.token,
    bdid: appParams.bdid,
    userId: appParams.userId,
  };
}

/**
 * 构建静态资源 URL
 * @param {string} token - 用户 token
 * @param {string} bdid - 建筑 ID
 * @param {string} path - 资源路径
 * @returns {string} 完整的静态资源 URL
 */
async function buildStaticUrl(token, bdid, path) {
  await ensureInitialized();
  const appParams = getAppParams();
  const appConfig = appParams.appConfig || {};
  const baseUrl = appConfig.scenic?.static_url || "";

  if (!baseUrl) {
    console.warn("[ScenicAPI] static_url 未配置，使用空字符串");
  }

  return `${baseUrl}/${token}/${bdid}/${path}`;
}

/**
 * 获取景区配置
 * @param {Object} options - 请求参数
 * @param {string} [options.token] - 用户 token（可选，默认使用 appParams.token）
 * @param {string} [options.bdid] - 建筑 ID（可选，默认使用 appParams.bdid）
 * @param {boolean} [options.showLog=true] - 是否显示日志
 * @returns {Promise<Object>} 景区配置数据
 *
 * @example
 * // 获取当前景区配置
 * const config = await scenicApi.getScenicConfig({});
 */
export async function getScenicConfig(options = {}) {
  const { token, bdid, showLog = true } = options;
  const params = await getCurrentUserParams();

  const requestToken = token || params.token;
  const requestBdid = bdid || params.bdid;

  if (!requestToken || !requestBdid) {
    console.warn("[ScenicAPI] getScenicConfig: token 或 bdid 为空");
    throw new Error("token 和 bdid 不能为空");
  }

  const url = await buildStaticUrl(requestToken, requestBdid, "pages/config.json");

  try {
    const result = await get(url, {}, { showLog, needSign: false });
    console.log("[ScenicAPI] 获取景区配置成功", result);
    return result;
  } catch (error) {
    console.error("[ScenicAPI] 获取景区配置失败:", error);
    throw error;
  }
}

/**
 * 获取首页配置
 * @param {Object} options - 请求参数
 * @param {string} [options.token] - 用户 token
 * @param {string} [options.bdid] - 建筑 ID
 * @param {boolean} [options.showLog=true] - 是否显示日志
 * @returns {Promise<Object>} 首页配置数据
 *
 * @example
 * // 获取首页配置
 * const config = await scenicApi.getHomePageConfig({});
 */
export async function getHomePageConfig(options = {}) {
  const { token, bdid, showLog = true } = options;
  const params = await getCurrentUserParams();

  const requestToken = token || params.token;
  const requestBdid = bdid || params.bdid;

  if (!requestToken || !requestBdid) {
    console.warn("[ScenicAPI] getHomePageConfig: token 或 bdid 为空");
    throw new Error("token 和 bdid 不能为空");
  }

  const url = await buildStaticUrl(requestToken, requestBdid, "pages/home.json");

  try {
    const result = await get(url, {}, { showLog, needSign: false });
    console.log("[ScenicAPI] 获取首页配置成功", result);
    return result;
  } catch (error) {
    console.error("[ScenicAPI] 获取首页配置失败:", error);
    throw error;
  }
}

/**
 * 获取服务页配置
 * @param {Object} options - 请求参数
 * @param {string} [options.token] - 用户 token
 * @param {string} [options.bdid] - 建筑 ID
 * @param {boolean} [options.showLog=true] - 是否显示日志
 * @returns {Promise<Object>} 服务页配置数据
 *
 * @example
 * // 获取服务页配置
 * const config = await scenicApi.getServicePageConfig({});
 */
export async function getServicePageConfig(options = {}) {
  const { token, bdid, showLog = true } = options;
  const params = await getCurrentUserParams();

  const requestToken = token || params.token;
  const requestBdid = bdid || params.bdid;

  if (!requestToken || !requestBdid) {
    console.warn("[ScenicAPI] getServicePageConfig: token 或 bdid 为空");
    throw new Error("token 和 bdid 不能为空");
  }

  const url = await buildStaticUrl(requestToken, requestBdid, "pages/service.json");

  try {
    const result = await get(url, {}, { showLog, needSign: false });
    console.log("[ScenicAPI] 获取服务页配置成功", result);
    return result;
  } catch (error) {
    console.error("[ScenicAPI] 获取服务页配置失败:", error);
    throw error;
  }
}

/**
 * 获取展览路线数据
 * @param {Object} options - 请求参数
 * @param {string} [options.token] - 用户 token
 * @param {string} [options.bdid] - 建筑 ID
 * @param {boolean} [options.showLog=true] - 是否显示日志
 * @returns {Promise<Object>} 展览路线数据
 *
 * @example
 * // 获取展览路线
 * const routes = await scenicApi.getRouteAll({});
 */
export async function getRouteAll(options = {}) {
  const { token, bdid, showLog = true } = options;
  const params = await getCurrentUserParams();

  const requestToken = token || params.token;
  const requestBdid = bdid || params.bdid;

  if (!requestToken || !requestBdid) {
    console.warn("[ScenicAPI] getRouteAll: token 或 bdid 为空");
    throw new Error("token 和 bdid 不能为空");
  }

  const url = await buildStaticUrl(requestToken, requestBdid, "route-all.json");

  try {
    const result = await get(
      url,
      {
        token: requestToken,
        bdid: requestBdid,
        ...options,
      },
      { showLog, needSign: false }
    );

    console.log("[ScenicAPI] 获取展览路线成功", result);
    return result;
  } catch (error) {
    console.error("[ScenicAPI] 获取展览路线失败:", error);
    throw error;
  }
}

// 导出所有方法
export default {
  getScenicConfig,
  getHomePageConfig,
  getServicePageConfig,
  getRouteAll,
};
