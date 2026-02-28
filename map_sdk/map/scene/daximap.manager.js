/**
 * Daximap 场景管理器模块
 * 提供场景管理的统一入口和协调功能
 */

"use strict";

const daximap = window.DaxiMap || {};

/**
 * DXSceneManager - 场景管理器类
 * 负责协调和管理多个场景实例
 */
const DXSceneManager = function () {
  this.scenes = {};
  this.currentScene = null;
};

const proto = DXSceneManager.prototype;

/**
 * 注册场景
 * @param {String} id 场景 ID
 * @param {Object} scene 场景对象
 */
proto.registerScene = function (id, scene) {
  this.scenes[id] = scene;
};

/**
 * 获取场景
 * @param {String} id 场景 ID
 * @returns {Object} 场景对象
 */
proto.getScene = function (id) {
  return this.scenes[id];
};

/**
 * 设置当前场景
 * @param {String} id 场景 ID
 */
proto.setCurrentScene = function (id) {
  this.currentScene = this.scenes[id];
};

/**
 * 获取当前场景
 * @returns {Object} 当前场景对象
 */
proto.getCurrentScene = function () {
  return this.currentScene;
};

/**
 * 移除场景
 * @param {String} id 场景 ID
 */
proto.removeScene = function (id) {
  delete this.scenes[id];
  if (this.currentScene === this.scenes[id]) {
    this.currentScene = null;
  }
};

/**
 * 清理所有场景
 */
proto.clearAll = function () {
  this.scenes = {};
  this.currentScene = null;
};

// 导出场景管理器类
export { DXSceneManager };

// 同时挂载到 window.DaxiMap 以保持向后兼容
if (typeof window !== "undefined") {
  window.DaxiMap = window.DaxiMap || {};
  window.DaxiMap.DXSceneManager = DXSceneManager;
}
