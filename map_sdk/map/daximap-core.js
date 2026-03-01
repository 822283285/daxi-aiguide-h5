/**
 * DaxiMap Core Module
 * ES6 模块入口，提供全局 DaxiMap 命名空间
 */

/** @type {Object} DaxiMap 全局命名空间对象 */

/**
 * 同时挂载到 window 以保持向后兼容
 * （在浏览器环境中）
 */
if (typeof window !== 'undefined') {
  window.DaxiMap = DaxiMap;
}
