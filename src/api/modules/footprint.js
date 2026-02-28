/**
 * @fileoverview 足迹相关 API
 * @description 提供用户足迹（已访问景点）查询功能
 * @author daxi
 * @created 2026-02-26
 */

import { get, getAppParams } from "../request.js";

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
    appId: appParams.appId,
  };
}

/**
 * 获取用户足迹（已访问的景点）
 * @param {Object} options - 请求参数
 * @param {string} [options.token] - 用户 token
 * @param {string} [options.bdid] - 建筑 ID
 * @param {string} [options.openid] - 用户 openid
 * @param {string} [options.secret] - 密钥（可选）
 * @param {string} [options.footprintsUrl] - API URL（可选）
 * @param {boolean} [options.showLog=true] - 是否显示日志
 * @returns {Promise<Object>} 足迹数据
 *
 * @example
 * // 获取用户足迹
 * const footprints = await footprintApi.getFootprints({});
 */
export async function getFootprints(options = {}) {
  const { token, bdid, openid, secret, footprintsUrl, showLog = true } = options;
  const params = await getCurrentUserParams();

  const requestToken = token || params.token;
  const requestBdid = bdid || params.bdid;
  const requestOpenid = openid || params.userId;
  const requestAppId = params.appId || requestToken;
  const requestSecret = secret || "1CFE42085637416ADAF6AEF60A832342";

  if (!requestToken || !requestBdid) {
    console.warn("[FootprintAPI] getFootprints: token 或 bdid 为空");
    throw new Error("token 和 bdid 不能为空");
  }

  // 从 appConfig 获取 URL 或使用默认值
  const appParamsObj = getAppParams();
  const appConfig = appParamsObj.appConfig || {};
  const defaultUrl =
    appConfig.footprintsUrl ||
    "https://map1a.daxicn.com/server39/daxi-manager/api/museum/footprints";
  const requestUrl = footprintsUrl || defaultUrl;

  const requestParams = {
    appid: requestAppId,
    token: requestToken,
    bdid: requestBdid,
    t: Date.now(),
    openid: requestOpenid,
    secret: requestSecret,
  };

  try {
    const result = await get(requestUrl, requestParams, { showLog });
    console.log("[FootprintAPI] 获取用户足迹成功", result);
    return result;
  } catch (error) {
    console.error("[FootprintAPI] 获取用户足迹失败:", error);
    throw error;
  }
}

// 导出所有方法
export default {
  getFootprints,
};
