/**
 * 环境检测工具 - 使用 WindowAdapter
 */
import { windowAdapter } from "../../legacy/window-adapter.js";

/**
 * 检测当前运行环境
 * @param {Object} globalRef - 全局对象引用，默认为 window (已废弃，使用 WindowAdapter)
 * @returns {string} 环境标识：'ios' | 'android' | 'web'
 */
export function detectEnvironment(globalRef = null) {
  // 如果传入了 globalRef，使用旧的逻辑（兼容）
  if (globalRef) {
    const ua = globalRef.navigator?.userAgent || "";

    if (/Android/i.test(ua)) {
      return "android";
    }

    if (/iPhone|iPad|iPod/i.test(ua)) {
      return "ios";
    }

    return "web";
  }

  // 否则使用 WindowAdapter
  return windowAdapter.deviceType;
}

/**
 * 判断是否在原生 App 环境
 * @param {Object} globalRef - 全局对象引用
 * @returns {boolean}
 */
export function isNativePlatform(globalRef = null) {
  const env = detectEnvironment(globalRef);
  return env === "ios" || env === "android";
}

/**
 * 判断是否在微信环境
 * @returns {boolean}
 */
export function isWeChat() {
  return windowAdapter.isWeChat;
}

/**
 * 判断是否在移动端
 * @returns {boolean}
 */
export function isMobile() {
  return windowAdapter.isMobile;
}

/**
 * 获取设备类型
 * @returns {string} 设备类型
 */
export function getDeviceType() {
  return windowAdapter.deviceType;
}
