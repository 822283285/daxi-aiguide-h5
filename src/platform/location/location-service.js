/**
 * 定位服务
 * @description 封装定位功能（支持 H5 和原生桥接）
 */

import { BridgeService } from "../bridge/bridge-service.js";

export class LocationService {
  constructor(options = {}) {
    this.options = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 0,
      useBridge: options.useBridge ?? true,
      ...options,
    };

    this.bridgeService = options.bridgeService || new BridgeService();
    this.watchId = null;
    this.listeners = new Set();
    this.lastPosition = null;
  }

  /**
   * 获取当前位置
   * @returns {Promise<Object>} 位置信息 {lng, lat, floor, accuracy, timestamp}
   */
  async getCurrentPosition() {
    // 优先尝试原生桥接
    if (this.options.useBridge && this.bridgeService.isAvailable()) {
      try {
        const position = await this._getNativePosition();
        if (position) {
          this.lastPosition = position;
          return position;
        }
      } catch (error) {
        console.warn("[LocationService] Native position failed, fallback to H5:", error);
      }
    }

    // 降级到 H5 Geolocation
    return this._getH5Position();
  }

  /**
   * 开始监听位置变化
   * @param {Function} callback - 位置回调函数
   * @returns {number} 监听 ID
   */
  watchPosition(callback) {
    if (typeof callback !== "function") {
      throw new Error("Callback must be a function");
    }

    this.listeners.add(callback);

    // 发送最后一次已知位置
    if (this.lastPosition) {
      callback(this.lastPosition);
    }

    if (this.watchId === null) {
      this._startWatching();
    }

    return this.watchId;
  }

  /**
   * 停止监听位置
   * @param {number} watchId - 监听 ID
   */
  clearWatch(watchId) {
    this.listeners.clear();

    if (this.watchId !== null) {
      if (this.options.useBridge && this.bridgeService.isAvailable()) {
        this._stopNativeWatch();
      } else {
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.clearWatch(this.watchId);
        }
      }
      this.watchId = null;
    }
  }

  /**
   * 检查定位权限
   * @returns {Promise<string>} 'granted' | 'denied' | 'prompt'
   */
  async checkPermission() {
    if (typeof navigator !== "undefined" && navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        return result.state;
      } catch (error) {
        console.warn("[LocationService] Permission check failed:", error);
        return "prompt";
      }
    }
    return "prompt";
  }

  /**
   * 获取最后已知位置
   * @returns {Object|null}
   */
  getLastKnownPosition() {
    return this.lastPosition;
  }

  /**
   * 获取原生定位
   * @private
   */
  async _getNativePosition() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Native location timeout"));
      }, this.options.timeout);

      this.bridgeService.call("getLocation", {}, (error, result) => {
        clearTimeout(timeout);
        if (error) {
          reject(error);
        } else {
          resolve(this._normalizePosition(result));
        }
      });
    });
  }

  /**
   * 获取 H5 定位
   * @private
   */
  async _getH5Position() {
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const normalized = this._normalizeH5Position(position);
          this.lastPosition = normalized;
          resolve(normalized);
        },
        (error) => {
          reject(this._handleGeolocationError(error));
        },
        {
          enableHighAccuracy: this.options.enableHighAccuracy,
          timeout: this.options.timeout,
          maximumAge: this.options.maximumAge,
        }
      );
    });
  }

  /**
   * 开始监听位置
   * @private
   */
  _startWatching() {
    this.watchId = Date.now();

    const handlePositionUpdate = (position) => {
      this.lastPosition = position;
      this.listeners.forEach((callback) => {
        try {
          callback(position);
        } catch (error) {
          console.error("[LocationService] Listener error:", error);
        }
      });
    };

    if (this.options.useBridge && this.bridgeService.isAvailable()) {
      this._startNativeWatch(handlePositionUpdate);
    } else {
      this._startH5Watch(handlePositionUpdate);
    }
  }

  /**
   * 开始原生监听
   * @private
   */
  _startNativeWatch(callback) {
    this.bridgeService.call("watchLocation", {}, (error, result) => {
      if (!error && result) {
        callback(this._normalizePosition(result));
      }
    });
  }

  /**
   * 停止原生监听
   * @private
   */
  _stopNativeWatch() {
    this.bridgeService.call("stopWatchLocation", {});
  }

  /**
   * 开始 H5 监听
   * @private
   */
  _startH5Watch(callback) {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.watchPosition(
      (position) => {
        callback(this._normalizeH5Position(position));
      },
      (error) => {
        console.error("[LocationService] Watch error:", error);
      },
      {
        enableHighAccuracy: this.options.enableHighAccuracy,
        timeout: this.options.timeout,
        maximumAge: this.options.maximumAge,
      }
    );
  }

  /**
   * 标准化原生位置
   * @private
   */
  _normalizePosition(data) {
    return {
      lng: data.longitude || data.lng || 0,
      lat: data.latitude || data.lat || 0,
      floor: data.floor || 1,
      accuracy: data.accuracy || 0,
      altitude: data.altitude || 0,
      heading: data.heading || 0,
      speed: data.speed || 0,
      timestamp: data.timestamp || Date.now(),
      source: "native",
    };
  }

  /**
   * 标准化 H5 位置
   * @private
   */
  _normalizeH5Position(position) {
    return {
      lng: position.coords.longitude,
      lat: position.coords.latitude,
      floor: 1, // H5 无法获取楼层
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp || Date.now(),
      source: "h5",
    };
  }

  /**
   * 处理定位错误
   * @private
   */
  _handleGeolocationError(error) {
    const errorMap = {
      1: "用户拒绝定位权限",
      2: "定位不可用",
      3: "定位超时",
    };
    const message = errorMap[error.code] || "定位失败";
    return new Error(message);
  }
}

/**
 * 创建全局定位服务实例
 * @type {LocationService}
 */
export const locationService = new LocationService();
