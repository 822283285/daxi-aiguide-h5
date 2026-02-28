/**
 * @fileoverview 支付相关 API
 * @description 提供缓存 token/bdid、支付状态查询等功能
 * @author daxi
 * @created 2026-02-26
 */

import { post, getAppParams, ensureInitialized } from "../request.js";

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
 * 缓存用户 token 和 BDID（切换景点时调用）
 * @param {Object} options - 请求参数
 * @param {string} [options.token] - 用户 token
 * @param {string} [options.bdid] - 建筑 ID
 * @param {string} [options.openid] - 用户 openid
 * @param {string} [options.cacheUrl] - API URL（可选）
 * @param {boolean} [options.showLog=true] - 是否显示日志
 * @returns {Promise<Object>} 缓存结果
 *
 * @example
 * // 缓存 token 和 BDID
 * const result = await paymentApi.cacheTokenAndBDID({
 *   token: 'xxx',
 *   bdid: 'B000A11DAN',
 * });
 */
export async function cacheTokenAndBDID(options = {}) {
  const { token, bdid, openid, cacheUrl, showLog = true } = options;
  const params = await getCurrentUserParams();

  const requestToken = token || params.token;
  const requestBdid = bdid || params.bdid;
  const requestOpenid = openid || params.userId;

  if (!requestToken || !requestBdid) {
    console.warn("[PaymentAPI] cacheTokenAndBDID: token 或 bdid 为空");
    throw new Error("token 和 bdid 不能为空");
  }

  // 从 appConfig 获取 URL 或使用默认值
  const appParamsObj = getAppParams();
  const appConfig = appParamsObj.appConfig || {};
  const defaultUrl =
    appConfig.payApi?.cacheTokenAndBDIDUrl ||
    "https://map1a.daxicn.com/payApi/merchantApi/api/pay/cacheTokenAndBDID";
  const requestUrl = cacheUrl || defaultUrl;

  const data = {
    token: requestToken,
    bdid: requestBdid,
    openid: requestOpenid,
  };

  try {
    const result = await post(requestUrl, data, { showLog });
    console.log("[PaymentAPI] 缓存 token 和 BDID 成功", result);
    return result;
  } catch (error) {
    console.error("[PaymentAPI] 缓存 token 和 BDID 失败:", error);
    throw error;
  }
}

/**
 * 获取支付状态（待实现）
 * @param {Object} options - 请求参数
 * @param {string} [options.orderId] - 订单 ID
 * @returns {Promise<Object>} 支付状态
 *
 * @example
 * // 获取支付状态
 * const status = await paymentApi.getPayStatus({ orderId: 'order123' });
 */
export async function getPayStatus(options = {}) {
  const { orderId } = options;

  if (!orderId) {
    console.warn("[PaymentAPI] getPayStatus: orderId 为空");
    throw new Error("订单 ID 不能为空");
  }

  // TODO: 实现支付状态查询 API
  console.warn("[PaymentAPI] getPayStatus 方法待实现");

  return Promise.resolve({ status: "pending" });
}

// 导出所有方法
export default {
  cacheTokenAndBDID,
  getPayStatus,
};
