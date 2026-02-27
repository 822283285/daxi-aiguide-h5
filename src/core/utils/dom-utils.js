/**
 * DOM 工具函数
 */

import { $ } from "../../utils/zepto.js";

/**
 * 查找元素
 * @param {string} selector - 选择器
 * @param {HTMLElement} context - 上下文，默认为 document
 * @returns {HTMLElement|null}
 */
export function find(selector, context = document) {
  return $(selector, context)[0] || null;
}

/**
 * 查找所有匹配元素
 * @param {string} selector - 选择器
 * @param {HTMLElement} context - 上下文
 * @returns {Array}
 */
export function findAll(selector, context = document) {
  return Array.from($(selector, context));
}

/**
 * 创建元素
 * @param {string} html - HTML 字符串
 * @returns {HTMLElement}
 */
export function createElement(html) {
  const div = document.createElement("div");
  div.innerHTML = html.trim();
  return div.firstElementChild;
}

