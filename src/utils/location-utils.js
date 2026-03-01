/**
 * 定位工具模块
 * 提供位置相关的通用工具函数
 * @module utils/location-utils
 */

/**
 * 定位精度级别
 */
export const ACCURACY_LEVELS = {
  HIGH: "high", // 高精度 (GPS)
  BALANCED: "balanced", // 平衡 (网络 +GPS)
  LOW: "low", // 低功耗 (仅网络)
};

/**
 * 定位状态
 */
export const LOCATION_STATUS = {
  IDLE: "idle", // 空闲
  REQUESTING: "requesting", // 请求中
  SUCCESS: "success", // 成功
  ERROR: "error", // 失败
  UNAVAILABLE: "unavailable", // 不可用
};

/**
 * 定位错误码
 */
export const LOCATION_ERRORS = {
  PERMISSION_DENIED: "permission_denied",
  POSITION_UNAVAILABLE: "position_unavailable",
  TIMEOUT: "timeout",
  UNKNOWN: "unknown",
};

/**
 * 默认定位配置
 */
export const LOCATION_DEFAULTS = {
  // 启用高精度
  enableHighAccuracy: true,
  // 超时时间 (毫秒)
  timeout: 10000,
  // 最大缓存时间 (毫秒)
  maximumAge: 30000,
  // 定位更新间隔 (毫秒)
  updateInterval: 5000,
};

/**
 * 获取当前位置
 * @param {Object} options - 定位选项
 * @param {boolean} [options.enableHighAccuracy=true] - 启用高精度
 * @param {number} [options.timeout=10000] - 超时时间
 * @param {number} [options.maximumAge=30000] - 最大缓存时间
 * @returns {Promise<Object>} 位置信息
 */
export async function getCurrentPosition(options = {}) {
  const config = {
    ...LOCATION_DEFAULTS,
    ...options,
  };

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: LOCATION_ERRORS.UNAVAILABLE,
        message: "您的浏览器不支持地理定位",
      });
      return;
    }

    console.log("[LocationUtils] 请求当前位置...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
          coordinate: [position.coords.longitude, position.coords.latitude],
          status: LOCATION_STATUS.SUCCESS,
        };

        console.log("[LocationUtils] 获取位置成功:", location);
        resolve(location);
      },
      (error) => {
        const errorInfo = {
          code: mapGeolocationError(error.code),
          message: error.message || "定位失败",
        };

        console.error("[LocationUtils] 获取位置失败:", errorInfo);
        reject(errorInfo);
      },
      config
    );
  });
}

/**
 * 映射地理定位错误码
 * @param {number} code - 原生错误码
 * @returns {string} 标准化错误码
 */
function mapGeolocationError(code) {
  switch (code) {
  case 1:
    return LOCATION_ERRORS.PERMISSION_DENIED;
  case 2:
    return LOCATION_ERRORS.POSITION_UNAVAILABLE;
  case 3:
    return LOCATION_ERRORS.TIMEOUT;
  default:
    return LOCATION_ERRORS.UNKNOWN;
  }
}

/**
 * 监听位置变化
 * @param {Function} callback - 回调函数
 * @param {Object} options - 定位选项
 * @returns {Function} 取消监听函数
 */
export function watchPosition(callback, options = {}) {
  const config = {
    ...LOCATION_DEFAULTS,
    ...options,
  };

  if (!navigator.geolocation) {
    console.error("[LocationUtils] 浏览器不支持地理定位");
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location = {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
        coordinate: [position.coords.longitude, position.coords.latitude],
        status: LOCATION_STATUS.SUCCESS,
      };

      callback(location);
    },
    (error) => {
      const errorInfo = {
        code: mapGeolocationError(error.code),
        message: error.message || "定位失败",
        status: LOCATION_STATUS.ERROR,
      };

      callback(null, errorInfo);
    },
    config
  );

  console.log("[LocationUtils] 开始监听位置变化，watchId:", watchId);

  // 返回取消监听函数
  return () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      console.log("[LocationUtils] 停止监听位置变化");
    }
  };
}

/**
 * 检查定位权限
 * @returns {Promise<string>} 权限状态: 'granted' | 'denied' | 'prompt'
 */
export async function checkPermission() {
  if (!navigator.permissions) {
    console.warn("[LocationUtils] 浏览器不支持权限 API");
    return "prompt";
  }

  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    console.log("[LocationUtils] 定位权限状态:", result.state);
    return result.state;
  } catch (error) {
    console.error("[LocationUtils] 检查权限失败:", error);
    return "prompt";
  }
}

/**
 * 请求定位权限
 * @returns {Promise<boolean>} 是否获得权限
 */
export async function requestPermission() {
  const state = await checkPermission();

  if (state === "granted") {
    return true;
  }

  if (state === "denied") {
    console.warn("[LocationUtils] 定位权限已被拒绝");
    return false;
  }

  // 尝试获取位置来触发权限请求
  try {
    await getCurrentPosition();
    return true;
  } catch (error) {
    console.error("[LocationUtils] 请求权限失败:", error);
    return false;
  }
}

/**
 * 计算两个位置之间的距离
 * @param {Array} location1 - 位置 1 [lng, lat]
 * @param {Array} location2 - 位置 2 [lng, lat]
 * @returns {number} 距离 (米)
 */
export function calculateDistance(location1, location2) {
  if (!location1 || !location2) {
    return Infinity;
  }

  const [lng1, lat1] = location1;
  const [lng2, lat2] = location2;

  const R = 6371000; // 地球半径 (米)
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 角度转弧度
 * @param {number} deg - 角度
 * @returns {number} 弧度
 */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * 计算移动方向
 * @param {Array} from - 起点 [lng, lat]
 * @param {Array} to - 终点 [lng, lat]
 * @returns {number} 方向角度 (0-360 度，正北为 0)
 */
export function calculateBearing(from, to) {
  if (!from || !to) {
    return 0;
  }

  const [lng1, lat1] = from;
  const [lng2, lat2] = to;

  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * 弧度转角度
 * @param {number} rad - 弧度
 * @returns {number} 角度
 */
function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

/**
 * 格式化方向
 * @param {number} bearing - 方向角度
 * @returns {string} 方向文本
 */
export function formatBearing(bearing) {
  const directions = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * 格式化位置坐标
 * @param {Object} location - 位置对象
 * @param {number} [precision=6] - 小数精度
 * @returns {string} 格式化后的坐标字符串
 */
export function formatLocation(location, precision = 6) {
  if (!location) {
    return "";
  }

  const lat = location.latitude || location.lat;
  const lng = location.longitude || location.lng;

  if (lat === undefined || lng === undefined) {
    return "";
  }

  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

/**
 * 获取位置精度描述
 * @param {number} accuracy - 精度 (米)
 * @returns {string} 精度描述
 */
export function getAccuracyDescription(accuracy) {
  if (!accuracy || accuracy <= 0) {
    return "未知精度";
  }

  if (accuracy < 10) {
    return "极高精度 (<10m)";
  } else if (accuracy < 50) {
    return "高精度 (<50m)";
  } else if (accuracy < 100) {
    return "中等精度 (<100m)";
  } else if (accuracy < 500) {
    return "低精度 (<500m)";
  } else {
    return "极低精度 (>500m)";
  }
}

/**
 * 检查位置是否有效
 * @param {Object} location - 位置对象
 * @returns {boolean} 是否有效
 */
export function isValidLocation(location) {
  if (!location) {
    return false;
  }

  const lat = location.latitude || location.lat;
  const lng = location.longitude || location.lng;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return false;
  }

  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * 创建模拟位置 (用于测试)
 * @param {Object} baseLocation - 基础位置
 * @param {number} [radius=10] - 随机半径 (米)
 * @returns {Object} 模拟位置
 */
export function createMockLocation(baseLocation, radius = 10) {
  const baseLng = baseLocation.longitude || baseLocation.lng || 113.324529;
  const baseLat = baseLocation.latitude || baseLocation.lat || 23.099082;

  // 将米转换为经纬度偏移 (近似)
  const lngOffset = (Math.random() - 0.5) * (radius / 111320);
  const latOffset = (Math.random() - 0.5) * (radius / 110540);

  return {
    longitude: baseLng + lngOffset,
    latitude: baseLat + latOffset,
    accuracy: Math.random() * 10 + 5,
    altitude: null,
    heading: Math.random() * 360,
    speed: Math.random() * 2,
    timestamp: Date.now(),
    coordinate: [baseLng + lngOffset, baseLat + latOffset],
    status: LOCATION_STATUS.SUCCESS,
    isMock: true,
  };
}

/**
 * 定位工具模块默认导出
 */
export default {
  ACCURACY_LEVELS,
  LOCATION_STATUS,
  LOCATION_ERRORS,
  LOCATION_DEFAULTS,
  getCurrentPosition,
  watchPosition,
  checkPermission,
  requestPermission,
  calculateDistance,
  calculateBearing,
  formatBearing,
  formatLocation,
  getAccuracyDescription,
  isValidLocation,
  createMockLocation,
};
