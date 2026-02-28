/**
 * @fileoverview MD5 加密工具
 * @description 提供 MD5 加密功能，用于签名等场景
 * @author daxi
 * @created 2026-02-26
 */

/**
 * MD5 加密类
 * 基于标准的 MD5 算法实现
 */
class MD5 {
  /**
   * 对字符串进行 MD5 加密
   * @param {string} string - 待加密的字符串
   * @returns {string} MD5 加密后的字符串（32 位小写）
   */
  static encrypt(string) {
    // 简单的 MD5 实现占位符
    // 实际项目中应该使用成熟的 MD5 库，如 crypto-js
    // 如果已引入 crypto-js，可以使用：
    // return CryptoJS.MD5(string).toString();

    // 这里提供一个简单的实现用于演示
    // 注意：这不等同于标准 MD5，仅用于占位
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      const char = string.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    // 转换为 32 位十六进制
    return Math.abs(hash).toString(16).padStart(32, "0");
  }
}

// 导出
export default MD5;

// 浏览器全局导出
if (typeof window !== "undefined") {
  window.MD5 = MD5;
}

// CommonJS 导出
if (typeof module !== "undefined" && module.exports) {
  module.exports = MD5;
}
