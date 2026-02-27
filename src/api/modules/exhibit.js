/**
 * @fileoverview 展品相关 API
 * @description 提供展品列表、展品详情、讲解数据等功能
 * @author daxi
 * @created 2026-02-26
 */

import { get, getAppParams, ensureInitialized } from '../request.js';

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
  const baseUrl = appConfig.scenic?.static_url || '';
  
  return `${baseUrl}/${token}/${bdid}/${path}`;
}

/**
 * 获取景区内展品列表
 * @param {Object} options - 请求参数
 * @param {string} [options.token] - 用户 token
 * @param {string} [options.bdid] - 建筑 ID
 * @param {boolean} [options.showLog=true] - 是否显示日志
 * @returns {Promise<Object>} 展品列表数据
 * 
 * @example
 * // 获取展品列表
 * const exhibits = await exhibitApi.getExhibitAll({});
 */
export async function getExhibitAll(options = {}) {
  const { token, bdid, showLog = true } = options;
  const params = await getCurrentUserParams();
  
  const requestToken = token || params.token;
  const requestBdid = bdid || params.bdid;
  
  if (!requestToken || !requestBdid) {
    console.warn('[ExhibitAPI] getExhibitAll: token 或 bdid 为空');
    throw new Error('token 和 bdid 不能为空');
  }
  
  const url = await buildStaticUrl(requestToken, requestBdid, 'exhibit-all.json');
  
  try {
    const result = await get(url, {}, { showLog, needSign: false });
    console.log('[ExhibitAPI] 获取展品列表成功', result);
    return result;
  } catch (error) {
    console.error('[ExhibitAPI] 获取展品列表失败:', error);
    throw error;
  }
}

/**
 * 获取展品详情列表（讲解数据）
 * @param {Object} options - 请求参数
 * @param {string} [options.token] - 用户 token
 * @param {string} [options.bdid] - 建筑 ID
 * @param {boolean} [options.showLog=true] - 是否显示日志
 * @returns {Promise<Object>} 展品详情列表数据
 * 
 * @example
 * // 获取展品详情列表
 * const explains = await exhibitApi.getExhibitExplainAll({});
 */
export async function getExhibitExplainAll(options = {}) {
  const { token, bdid, showLog = true } = options;
  const params = await getCurrentUserParams();
  
  const requestToken = token || params.token;
  const requestBdid = bdid || params.bdid;
  
  if (!requestToken || !requestBdid) {
    console.warn('[ExhibitAPI] getExhibitExplainAll: token 或 bdid 为空');
    throw new Error('token 和 bdid 不能为空');
  }
  
  const url = buildStaticUrl(requestToken, requestBdid, 'explain-all.json');
  
  try {
    const result = await get(url, {}, { showLog, needSign: false });
    console.log('[ExhibitAPI] 获取展品详情列表成功', result);
    return result;
  } catch (error) {
    console.error('[ExhibitAPI] 获取展品详情列表失败:', error);
    throw error;
  }
}

/**
 * 根据展品编号查询展品详情
 * @param {Object} options - 请求参数
 * @param {string} options.exhibitNum - 展品编号
 * @param {string} [options.code] - 展品 code（可选，与 exhibitNum 相同）
 * @param {Object} [options.params] - 额外的请求参数
 * @param {string} [options.baseUrl] - API 基础 URL（可选）
 * @param {boolean} [options.showLog=true] - 是否显示日志
 * @returns {Promise<Object>} 展品详情数据
 * 
 * @example
 * // 根据展品编号获取详情
 * const exhibit = await exhibitApi.getExhibitByNum({ exhibitNum: 'E12345' });
 * 
 * @example
 * // 使用 code 参数
 * const exhibit = await exhibitApi.getExhibitByNum({ code: 'E12345' });
 */
export async function getExhibitByNum(options = {}) {
  const { exhibitNum, code, params = {}, baseUrl, showLog = true } = options;
  
  const exhibitNumber = exhibitNum || code;
  
  if (!exhibitNumber) {
    console.warn('[ExhibitAPI] getExhibitByNum: exhibitNum 或 code 为空');
    throw new Error('展品编号不能为空');
  }
  
  const requestBaseUrl = baseUrl || 'https://appapi.chnmuseum.cn/api/exhibit/detail_by_num';
  const url = `${requestBaseUrl}?p=wxmini&exhibit_num=${exhibitNumber}`;
  
  try {
    const result = await get(url, params, { showLog });
    console.log('[ExhibitAPI] 获取展品详情成功', result);
    return result;
  } catch (error) {
    console.error('[ExhibitAPI] 获取展品详情失败:', error);
    throw error;
  }
}

// 导出所有方法
export default {
  getExhibitAll,
  getExhibitExplainAll,
  getExhibitByNum,
};
