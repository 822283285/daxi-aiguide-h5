/**
 * @fileoverview 服务页相关 API
 * @description 提供服务页配置数据获取功能
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

  return `${baseUrl}/${token}/${bdid}/${path}`;
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
 * const config = await serviceApi.getPageConfig({});
 */
export async function getPageConfig(options = {}) {
  const { token, bdid, showLog = true } = options;
  const params = await getCurrentUserParams();

  const requestToken = token || params.token;
  const requestBdid = bdid || params.bdid;

  if (!requestToken || !requestBdid) {
    console.warn("[ServiceAPI] getPageConfig: token 或 bdid 为空");
    throw new Error("token 和 bdid 不能为空");
  }

  const url = await buildStaticUrl(requestToken, requestBdid, "pages/service.json");

  try {
    const result = await get(url, {}, { showLog, needSign: false });
    console.log("[ServiceAPI] 获取服务页配置成功", result);
    return result;
  } catch (error) {
    console.error("[ServiceAPI] 获取服务页配置失败:", error);
    throw error;
  }
}

// 导出所有方法
export default {
  getPageConfig,
};
