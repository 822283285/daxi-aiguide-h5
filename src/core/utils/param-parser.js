/**
 * 参数解析工具 - 使用 WindowAdapter
 * 从 URL 解析查询参数
 */
import { windowAdapter } from '../legacy/window-adapter.js';

/**
 * 解析 URL 参数
 * @param {string} url - 要解析的 URL，默认为当前页面 URL
 * @returns {Object} 参数对象
 */
export function parseParams(url = windowAdapter.currentUrl) {
  try {
    const urlObj = new URL(url);
    const params = {};
    
    for (const [key, value] of urlObj.searchParams.entries()) {
      params[key] = value;
    }
    
    return params;
  } catch (error) {
    console.error("[parseParams] Error parsing URL:", error);
    return {};
  }
}

/**
 * 获取单个参数
 * @param {string} key - 参数名
 * @param {string} url - URL，默认为当前页面
 * @returns {string|null} 参数值
 */
export function getParam(key, url = null) {
  if (url) {
    // 如果指定了 URL，使用 URLSearchParams
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get(key);
    } catch (e) {
      return null;
    }
  }
  
  // 否则使用 WindowAdapter
  return windowAdapter.getParam(key);
}
