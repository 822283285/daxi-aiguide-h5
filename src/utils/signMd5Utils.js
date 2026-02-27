/**
 * @fileoverview 签名工具类
 * @description 提供请求签名功能，用于 API 请求的签名验证
 * @author daxi
 * @created 2026-02-26
 * @version 1.0
 * 
 * @example
 * // 使用示例
 * import signMd5Utils from './src/utils/signMd5Utils.js';
 * 
 * const sign = signMd5Utils.getSign('https://api.example.com/path', { key: 'value' });
 * const timestamp = signMd5Utils.getTimestamp();
 * 
 * // 或者使用全局对象（浏览器环境）
 * const sign = window.signMd5Utils.getSign(url, params);
 */

// 导入 MD5 库（如果项目已引入 crypto-js，使用 crypto-js）
let MD5Lib = null;

// 尝试从不同来源获取 MD5 实现
if (typeof window !== 'undefined') {
  // 浏览器环境
  if (window.CryptoJS && window.CryptoJS.MD5) {
    MD5Lib = (str) => CryptoJS.MD5(str).toString();
  } else if (window.MD5) {
    MD5Lib = window.MD5;
  }
}

// 如果没有找到 MD5 库，提供简单实现（仅用于开发环境）
if (!MD5Lib) {
  console.warn('[signMd5Utils] 未找到 MD5 库，使用简单实现（生产环境请引入 crypto-js）');
  MD5Lib = function simpleMD5(string) {
    // 简单的占位实现，不等同于标准 MD5
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      const char = string.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
  };
}

/**
 * 签名密钥串（前后端需保持一致）
 * 可以从配置中获取，或使用默认值
 */
const DEFAULT_SECRET = 'dd05f1c54d63749eda95f9fa6d49v442a';

/**
 * 签名工具类
 */
class SignMd5Utils {
  /**
   * 判断是否为有效数值
   * @param {*} value - 待判断的值
   * @returns {boolean} 是否为数值
   */
  static isNumeric(value) {
    return typeof value === 'number' && !isNaN(value);
  }

  /**
   * 将数值转为字符串（保持前后端加密规则一致）
   * @param {*} value - 待转换的值
   * @returns {string} 转换后的字符串
   */
  static normalizeValue(value) {
    return this.isNumeric(value) ? value.toString() : value;
  }

  /**
   * JSON 参数按 key 升序排列
   * @param {Object} jsonObj - JSON 对象
   * @returns {Object} 按 key 排序后的对象
   */
  static sortAsc(jsonObj) {
    const sortedKeys = Object.keys(jsonObj).sort();
    const sortObj = {};
    sortedKeys.forEach((key) => {
      sortObj[key] = jsonObj[key];
    });
    return sortObj;
  }

  /**
   * 解析 URL 中的查询参数为对象
   * @param {string} url - URL 字符串
   * @returns {Object} URL 参数对象
   */
  static parseQueryString(url) {
    const urlReg = /^[^?]+\?([\w\W]+)$/;
    const paramReg = /([^&=]+)=([\w\W]*?)(&|$|#)/g;
    const urlArray = urlReg.exec(url);
    const result = {};

    // 处理 URL 末段包含逗号的路径变量
    let lastPathVar = url.substring(url.lastIndexOf('/') + 1);
    if (lastPathVar.includes(',')) {
      if (lastPathVar.includes('?')) {
        lastPathVar = lastPathVar.substring(0, lastPathVar.indexOf('?'));
      }
      result['x-path-variable'] = decodeURIComponent(lastPathVar);
    }

    if (urlArray?.[1]) {
      const paramString = urlArray[1];
      let paramResult;
      while ((paramResult = paramReg.exec(paramString)) != null) {
        result[paramResult[1]] = this.normalizeValue(paramResult[2]);
      }
    }

    return result;
  }

  /**
   * 合并两个对象
   * @param {Object} objectOne - 第一个对象
   * @param {Object} objectTwo - 第二个对象
   * @returns {Object} 合并后的对象
   */
  static mergeObject(objectOne, objectTwo) {
    const result = { ...objectOne };
    if (objectTwo && Object.keys(objectTwo).length > 0) {
      Object.keys(objectTwo).forEach((key) => {
        result[key] = this.normalizeValue(objectTwo[key]);
      });
    }
    return result;
  }

  /**
   * 获取签名
   * @param {string} url - 请求的 URL（可包含查询参数）
   * @param {Object} requestParams - 请求参数（POST 的请求体参数或 GET 的查询参数）
   * @param {string} [secret] - 签名字符串（可选，默认使用内置密钥）
   * @returns {string} 签名值（32 位大写）
   * 
   * @example
   * // GET 请求
   * const sign = signMd5Utils.getSign('https://api.example.com/path?param1=value1', { param2: 'value2' });
   * 
   * @example
   * // POST 请求
   * const sign = signMd5Utils.getSign('https://api.example.com/path', { key: 'value' });
   */
  static getSign(url, requestParams, secret) {
    const urlParams = this.parseQueryString(url);
    const jsonObj = this.mergeObject(urlParams, requestParams);
    const requestBody = this.sortAsc(jsonObj);
    const secretKey = secret || DEFAULT_SECRET;
    
    const signStr = JSON.stringify(requestBody) + secretKey;
    return MD5Lib(signStr).toUpperCase();
  }

  /**
   * 获取当前时间戳（用于签名 header）
   * @returns {number} 当前时间戳（毫秒）
   */
  static getTimestamp() {
    return Date.now();
  }

  /**
   * 构建签名请求头
   * @param {string} url - 请求 URL
   * @param {Object} data - 请求数据
   * @param {Object} [customHeaders] - 自定义请求头（可选）
   * @returns {Object} 包含签名的请求头对象
   * 
   * @example
   * const headers = signMd5Utils.buildSignHeaders(url, data);
   * // 返回：
   * // {
   * //   'X-Sign': 'xxx',
   * //   'X-TIMESTAMP': 1234567890,
   * //   'Content-Type': 'application/json'
   * // }
   */
  static buildSignHeaders(url, data, customHeaders) {
    return {
      'X-Sign': this.getSign(url, data),
      'X-TIMESTAMP': this.getTimestamp(),
      'Content-Type': 'application/json',
      ...customHeaders,
    };
  }
}

// ES6 导出
export default SignMd5Utils;

// 浏览器全局导出
if (typeof window !== 'undefined') {
  window.signMd5Utils = SignMd5Utils;
  console.log('[signMd5Utils] 已挂载到 window.signMd5Utils');
}

// CommonJS 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SignMd5Utils;
}
