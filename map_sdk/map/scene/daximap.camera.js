/**
 * Daximap 相机控制模块
 * 提供相机视角控制和相机动画功能
 */

"use strict";

const daximap = window.DaxiMap || {};

/**
 * DXCameraController - 相机控制器类
 * 负责管理相机的视角、位置和动画
 */
class DXCameraController {
  /**
   * 初始化相机控制器
   * @param {Object} mapSDK 地图 SDK 实例
   */
  constructor(mapSDK) {
    this._mapSDK = mapSDK;
    this._camera = null;
    this._target = null;
    this._enabled = true;
  }

  /**
   * 初始化相机
   * @param {Object} camera 相机对象
   */
  initialize(camera) {
    this._camera = camera;
    this._target = camera?.target || null;
  }

  /**
   * 设置相机位置
   * @param {Number} lon 经度
   * @param {Number} lat 纬度
   * @param {Number} zoom 缩放级别
   */
  setPosition(lon, lat, zoom) {
    if (this._camera) {
      this._camera.setCenter(lon, lat);
      this._camera.setZoom(zoom);
    }
  }

  /**
   * 设置相机目标点
   * @param {Number} lon 经度
   * @param {Number} lat 纬度
   */
  setTarget(lon, lat) {
    if (this._camera) {
      this._target = { lon, lat };
      this._camera.lookAt(lon, lat);
    }
  }

  /**
   * 获取相机位置
   * @returns {Object} 相机位置对象
   */
  getPosition() {
    return this._camera ? this._camera.getPosition() : null;
  }

  /**
   * 获取相机目标点
   * @returns {Object} 目标点对象
   */
  getTarget() {
    return this._target;
  }

  /**
   * 设置相机启用状态
   * @param {Boolean} enabled 是否启用
   */
  setEnabled(enabled) {
    this._enabled = enabled;
  }

  /**
   * 获取相机启用状态
   * @returns {Boolean} 启用状态
   */
  isEnabled() {
    return this._enabled;
  }

  /**
   * 更新相机
   */
  update() {
    if (!this._enabled || !this._camera) return;
    // 相机更新逻辑
  }

  /**
   * 销毁相机控制器
   */
  dispose() {
    this._camera = null;
    this._target = null;
    this._mapSDK = null;
  }
}

// 导出相机控制器类
export { DXCameraController };

// 同时挂载到 window.DaxiMap 以保持向后兼容
if (typeof window !== "undefined") {
  window.DaxiMap = window.DaxiMap || {};
  window.DaxiMap.DXCameraController = DXCameraController;
}
