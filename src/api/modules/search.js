/**
 * @fileoverview 搜索相关 API
 * @description 提供搜索热门词、搜索建议等功能
 * @author daxi
 * @created 2026-02-26
 */

import { get, getAppParams } from '../request.js';

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
 * 获取景区搜索热门词
 * @param {Object} options - 请求参数
 * @param {string} [options.token] - 用户 token
 * @param {string} [options.bdid] - 建筑 ID
 * @param {string} [options.baseUrl] - API 基础 URL（可选）
 * @param {boolean} [options.showLog=true] - 是否显示日志
 * @returns {Promise<Object>} 搜索热门词数据
 * 
 * @example
 * // 获取搜索热门词
 * const hotWords = await searchApi.getHotWords({});
 */
export async function getHotWords(options = {}) {
  const { token, bdid, baseUrl, showLog = true } = options;
  const params = await getCurrentUserParams();
  
  const requestToken = token || params.token;
  const requestBdid = bdid || params.bdid;
  
  if (!requestToken || !requestBdid) {
    console.warn('[SearchAPI] getHotWords: token 或 bdid 为空');
    throw new Error('token 和 bdid 不能为空');
  }
  
  // 从 appConfig 获取 URL 或使用默认值
  const appParamsObj = getAppParams();
  const appConfig = appParamsObj.appConfig || {};
  const defaultBaseUrl = appConfig.searchPageConfig?.hotWords?.url || 'https://map1a.daxicn.com/daxi-manager/api/stat/hotWords/';
  const requestBaseUrl = baseUrl || defaultBaseUrl;
  
  const url = `${requestBaseUrl}/${requestToken}/${requestBdid}`;
  
  try {
    const result = await get(url, {}, { showLog });
    console.log('[SearchAPI] 获取搜索热门词成功', result);
    return result;
  } catch (error) {
    console.error('[SearchAPI] 获取搜索热门词失败:', error);
    throw error;
  }
}

/**
 * 获取搜索建议（待实现）
 * @param {string} keyword - 搜索关键字
 * @param {Object} options - 额外的请求参数
 * @returns {Promise<Object>} 搜索建议数据
 * 
 * @example
 * // 获取搜索建议
 * const suggestions = await searchApi.getSuggestions('博物馆');
 */
export async function getSuggestions(keyword, options = {}) {
  if (!keyword) {
    console.warn('[SearchAPI] getSuggestions: keyword 为空');
    throw new Error('搜索关键字不能为空');
  }
  
  // TODO: 实现搜索建议 API
  console.warn('[SearchAPI] getSuggestions 方法待实现');
  
  return Promise.resolve([]);
}

// 导出所有方法
export default {
  getHotWords,
  getSuggestions,
};
