/**
 * @fileoverview 用户相关 API
 * @description 提供用户信息获取、更新、注册等功能
 * @author daxi
 * @created 2026-02-26
 */

import { get, post, getAppParams, ensureInitialized } from "../request.js";

/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
  getUserInfoUrl: "https://map1a.daxicn.com/payApi/merchantApi/api/wxuser/info",
  updateUserInfoUrl: "https://map1a.daxicn.com/payApi/merchantApi/api/wxuser/add",
};

/**
 * 获取当前用户参数（等待初始化完成后）
 * @returns {Promise<Object>} 用户参数对象
 */
async function getCurrentUserParams() {
  await ensureInitialized(); // 确保已初始化
  const appParams = getAppParams();
  return {
    token: appParams.token,
    bdid: appParams.bdid,
    openid: appParams.userId,
  };
}

/**
 * 获取用户信息
 * @param {Object} options - 请求参数
 * @param {string} [options.openid] - 用户 openid（可选，默认使用 appParams.userId）
 * @param {string} [options.client='wechat'] - 客户端类型
 * @param {boolean} [options.showLog=true] - 是否显示日志
 * @returns {Promise<Object>} 用户信息数据
 */
export async function getUserInfo(options = {}) {
  const { openid, client = "wechat", showLog = true } = options;

  // 等待初始化完成并获取参数
  const params = await getCurrentUserParams();
  const requestOpenid = openid || params.openid;

  if (!requestOpenid) {
    console.warn("[UserAPI] getUserInfo: openid 为空");
    console.warn("[UserAPI] 当前 appParams:", params);
    console.warn("[UserAPI] 请确保 URL 中包含 userId 参数，或手动传入 openid");
    throw new Error("用户 openid 不能为空");
  }

  const url = DEFAULT_CONFIG.getUserInfoUrl;

  try {
    const result = await get(
      url,
      {
        t: Date.now(),
        openid: requestOpenid,
        client,
      },
      { showLog }
    );

    console.log("[UserAPI] 获取用户信息成功", result);
    return result;
  } catch (error) {
    console.error("[UserAPI] 获取用户信息失败:", error);
    throw error;
  }
}

/**
 * 更新用户信息
 * @param {Object} options - 请求参数
 * @param {string} [options.username] - 用户名
 * @param {string} [options.avatarUrl] - 头像 URL
 * @param {string} [options.openid] - 用户 openid
 * @param {boolean} [options.showLog=true] - 是否显示日志
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUserInfo(options = {}) {
  const { username, avatarUrl, openid, showLog = true } = options;

  // 等待初始化完成并获取参数
  const params = await getCurrentUserParams();

  const defaultAvatar =
    "https://daoyou.daxicn.com/managerApi/api/anon/localOssFiles/avatar/fc2eeed6-85db-4681-822c-eb892e19f6b5.jpg";
  const requestUsername = username || "匿名用户";
  const requestAvatarUrl = avatarUrl || defaultAvatar;
  const requestOpenid = openid || params.openid;

  if (!requestOpenid) {
    console.warn("[UserAPI] updateUserInfo: openid 为空");
    throw new Error("用户 openid 不能为空");
  }

  const data = {
    username: requestUsername,
    avatarUrl: requestAvatarUrl,
    openid: requestOpenid,
  };

  const url = DEFAULT_CONFIG.updateUserInfoUrl;

  try {
    const result = await post(url, data, { showLog });
    console.log("[UserAPI] 更新用户信息成功", result);
    return result;
  } catch (error) {
    console.error("[UserAPI] 更新用户信息失败:", error);
    throw error;
  }
}

/**
 * 注册用户
 */
export async function registerUser(openid, username = "匿名用户", avatarUrl) {
  return updateUserInfo({ username, avatarUrl, openid });
}

/**
 * 缓存用户信息
 */
export function cacheUserInfo(userInfo) {
  if (!userInfo) {
    console.warn("[UserAPI] cacheUserInfo: 用户信息为空");
    return;
  }
  try {
    localStorage.setItem("daxi_user_info", JSON.stringify(userInfo));
    console.log("[UserAPI] 用户信息已缓存");
  } catch (error) {
    console.error("[UserAPI] 缓存用户信息失败:", error);
  }
}

/**
 * 获取缓存的用户信息
 */
export function getCachedUserInfo() {
  try {
    const cached = localStorage.getItem("daxi_user_info");
    if (cached) return JSON.parse(cached);
  } catch (error) {
    console.error("[UserAPI] 读取缓存失败:", error);
  }
  return null;
}

/**
 * 清除缓存的用户信息
 */
export function clearCachedUserInfo() {
  try {
    localStorage.removeItem("daxi_user_info");
    console.log("[UserAPI] 已清除缓存");
  } catch (error) {
    console.error("[UserAPI] 清除缓存失败:", error);
  }
}

export default {
  getUserInfo,
  updateUserInfo,
  registerUser,
  cacheUserInfo,
  getCachedUserInfo,
  clearCachedUserInfo,
};
