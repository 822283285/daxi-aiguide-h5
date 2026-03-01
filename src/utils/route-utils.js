/**
 * 路线工具模块
 * 提供路线规划相关的通用工具函数
 * @module utils/route-utils
 */

import { getRouteAll } from "../api/modules/route.js";
import { calculateDistance } from "./map-utils.js";

/**
 * 路线类型定义
 */
export const ROUTE_TYPES = {
  RECOMMENDED: "recommended", // 推荐路线
  CUSTOM: "custom", // 自定义路线
  QUICKEST: "quickest", // 最快路线
  SHORTEST: "shortest", // 最短路线
  ACCESSIBLE: "accessible", // 无障碍路线
  TOUR: "tour", // 游览路线
};

/**
 * 路线状态
 */
export const ROUTE_STATUS = {
  PLANNING: "planning", // 规划中
  READY: "ready", // 已就绪
  NAVIGATING: "navigating", // 导航中
  PAUSED: "paused", // 已暂停
  FINISHED: "finished", // 已完成
  CANCELLED: "cancelled", // 已取消
};

/**
 * 从 API 加载路线数据
 * @param {Object} options - 加载选项
 * @param {string} [options.token] - 用户 token
 * @param {string} [options.bdid] - 建筑 ID
 * @param {boolean} [options.showLog=true] - 是否显示日志
 * @returns {Promise<Array>} 路线列表
 */
export async function loadRoutes(options = {}) {
  try {
    const routeData = await getRouteAll(options);
    console.log("[RouteUtils] 加载路线数据成功:", routeData);

    // 转换路线数据为标准格式
    const routes = transformRouteData(routeData);
    return routes;
  } catch (error) {
    console.error("[RouteUtils] 加载路线失败:", error);
    return [];
  }
}

/**
 * 转换路线数据为标准格式
 * @param {Object} routeData - 路线数据
 * @returns {Array} 路线列表
 */
export function transformRouteData(routeData) {
  if (!routeData || !routeData.list) {
    return [];
  }

  return routeData.list.map((route) => ({
    id: route.route_id || route.id,
    name: route.name || route.title,
    title: route.name || route.title,
    description: route.description || route.intro || "",
    type: route.type || ROUTE_TYPES.RECOMMENDED,
    status: ROUTE_STATUS.READY,
    distance: route.distance || 0,
    duration: route.duration || 0,
    floor: route.floor || "0",
    waypoints: route.waypoints || route.points || [],
    path: route.path || route.geometry || null,
    exhibits: route.exhibits || [],
    isRecommended: route.is_recommend || route.recommended || false,
    sort: route.sort || 0,
    icon: route.icon || "🗺️",
    color: route.color || "#1890ff",
  }));
}

/**
 * 规划路线
 * @param {Array} waypoints - 途经点列表 [{lng, lat}, ...]
 * @param {Object} options - 规划选项
 * @param {string} [options.type=custom] - 路线类型
 * @param {boolean} [options.avoidStairs=false] - 是否避免楼梯
 * @param {boolean} [options.preferElevator=false] - 是否优先电梯
 * @returns {Object} 路线规划结果
 */
export function planRoute(waypoints, options = {}) {
  const type = options.type || ROUTE_TYPES.CUSTOM;
  const avoidStairs = options.avoidStairs || false;
  const preferElevator = options.preferElevator || false;

  console.log("[RouteUtils] 规划路线:", { waypoints, type, avoidStairs, preferElevator });

  // 基础验证
  if (!waypoints || waypoints.length < 2) {
    return {
      success: false,
      error: "至少需要起点和终点两个点",
      route: null,
    };
  }

  // 计算总距离
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const point1 = Array.isArray(waypoints[i]) ? waypoints[i] : [waypoints[i].lng, waypoints[i].lat];
    const point2 = Array.isArray(waypoints[i + 1])
      ? waypoints[i + 1]
      : [waypoints[i + 1].lng, waypoints[i + 1].lat];
    totalDistance += calculateDistance(point1, point2);
  }

  // 估算时间 (假设步行速度 1.2m/s)
  const estimatedDuration = Math.round(totalDistance / 1.2 / 60); // 分钟

  // 生成路径 (简化为直线连接)
  const path = waypoints.map((point) => (Array.isArray(point) ? point : [point.lng, point.lat]));

  const route = {
    id: `route_${Date.now()}`,
    name: "自定义路线",
    type,
    status: ROUTE_STATUS.READY,
    distance: Math.round(totalDistance),
    duration: estimatedDuration,
    waypoints,
    path,
    avoidStairs,
    preferElevator,
    createdAt: Date.now(),
  };

  return {
    success: true,
    error: null,
    route,
  };
}

/**
 * 计算路线距离
 * @param {Array} path - 路径点列表 [[lng, lat], ...]
 * @returns {number} 总距离 (米)
 */
export function calculateRouteDistance(path) {
  if (!path || path.length < 2) {
    return 0;
  }

  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    totalDistance += calculateDistance(path[i], path[i + 1]);
  }

  return Math.round(totalDistance);
}

/**
 * 估算路线时间
 * @param {number} distance - 距离 (米)
 * @param {number} [speed=1.2] - 速度 (m/s)
 * @returns {number} 时间 (分钟)
 */
export function estimateRouteDuration(distance, speed = 1.2) {
  if (!distance || distance <= 0) {
    return 0;
  }

  return Math.round(distance / speed / 60);
}

/**
 * 格式化路线距离显示
 * @param {number} distance - 距离 (米)
 * @returns {string} 格式化后的距离文本
 */
export function formatRouteDistance(distance) {
  if (!distance || distance <= 0) {
    return "0m";
  }

  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  } else {
    return `${(distance / 1000).toFixed(1)}km`;
  }
}

/**
 * 格式化路线时间显示
 * @param {number} duration - 时间 (分钟)
 * @returns {string} 格式化后的时间文本
 */
export function formatRouteDuration(duration) {
  if (!duration || duration <= 0) {
    return "0 分钟";
  }

  if (duration < 60) {
    return `${Math.round(duration)}分钟`;
  } else {
    const hours = Math.floor(duration / 60);
    const minutes = Math.round(duration % 60);
    return `${hours}小时${minutes > 0 ? minutes + "分钟" : ""}`;
  }
}

/**
 * 获取路线上的下一个点
 * @param {Array} path - 路径点列表
 * @param {number} currentIndex - 当前索引
 * @returns {Object|null} 下一个点信息
 */
export function getNextPoint(path, currentIndex) {
  if (!path || currentIndex >= path.length - 1) {
    return null;
  }

  const nextIndex = currentIndex + 1;
  const currentPoint = path[currentIndex];
  const nextPoint = path[nextIndex];

  const distance = calculateDistance(currentPoint, nextPoint);
  const duration = estimateRouteDuration(distance);

  return {
    point: nextPoint,
    index: nextIndex,
    distance,
    duration,
    isLast: nextIndex === path.length - 1,
  };
}

/**
 * 获取路线上的前一个点
 * @param {Array} path - 路径点列表
 * @param {number} currentIndex - 当前索引
 * @returns {Object|null} 前一个点信息
 */
export function getPreviousPoint(path, currentIndex) {
  if (!path || currentIndex <= 0) {
    return null;
  }

  const prevIndex = currentIndex - 1;
  const currentPoint = path[currentIndex];
  const prevPoint = path[prevIndex];

  const distance = calculateDistance(currentPoint, prevPoint);

  return {
    point: prevPoint,
    index: prevIndex,
    distance,
  };
}

/**
 * 检查是否到达目标点
 * @param {Array} currentLocation - 当前位置 [lng, lat]
 * @param {Array} targetPoint - 目标点 [lng, lat]
 * @param {number} [threshold=10] - 到达阈值 (米)
 * @returns {boolean} 是否到达
 */
export function isArrivedAtPoint(currentLocation, targetPoint, threshold = 10) {
  if (!currentLocation || !targetPoint) {
    return false;
  }

  const distance = calculateDistance(currentLocation, targetPoint);
  return distance <= threshold;
}

/**
 * 获取路线进度
 * @param {Array} path - 路径点列表
 * @param {number} currentIndex - 当前索引
 * @returns {Object} 进度信息 {current, total, percentage}
 */
export function getRouteProgress(path, currentIndex) {
  if (!path || path.length === 0) {
    return { current: 0, total: 0, percentage: 0 };
  }

  const total = path.length;
  const current = Math.min(currentIndex + 1, total);
  const percentage = Math.round((current / total) * 100);

  return {
    current,
    total,
    percentage,
  };
}

/**
 * 生成路线指引
 * @param {Array} path - 路径点列表
 * @param {number} currentIndex - 当前索引
 * @param {Object} options - 选项
 * @returns {string} 指引文本
 */
export function generateRouteGuidance(path, currentIndex, options = {}) {
  if (!path || currentIndex >= path.length - 1) {
    return "已到达目的地";
  }

  const next = getNextPoint(path, currentIndex);
  if (!next) {
    return "已到达目的地";
  }

  const distanceText = formatRouteDistance(next.distance);
  const direction = options.showDirection ? getDirectionText(path, currentIndex) : "";

  if (next.isLast) {
    return `前方${distanceText}${direction ? "，" + direction : ""}到达目的地`;
  } else {
    return `前方${distanceText}${direction ? "，" + direction : ""}前往下一个点`;
  }
}

/**
 * 获取方向文本 (简化版)
 * @param {Array} path - 路径点列表
 * @param {number} currentIndex - 当前索引
 * @returns {string} 方向文本
 */
function getDirectionText(path, currentIndex) {
  if (currentIndex < 0 || currentIndex >= path.length - 1) {
    return "";
  }

  // 简化实现：根据坐标变化判断方向
  const current = path[currentIndex];
  const next = path[currentIndex + 1];

  const dLng = next[0] - current[0];
  const dLat = next[1] - current[1];

  if (Math.abs(dLng) > Math.abs(dLat)) {
    return dLng > 0 ? "向东" : "向西";
  } else {
    return dLat > 0 ? "向北" : "向南";
  }
}

/**
 * 查找最近的路线点
 * @param {Array} path - 路径点列表
 * @param {Array} location - 位置 [lng, lat]
 * @returns {Object} 最近的点信息 {point, index, distance}
 */
export function findNearestPoint(path, location) {
  if (!path || path.length === 0 || !location) {
    return null;
  }

  let nearestPoint = null;
  let nearestIndex = -1;
  let nearestDistance = Infinity;

  path.forEach((point, index) => {
    const distance = calculateDistance(location, point);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPoint = point;
      nearestIndex = index;
    }
  });

  return {
    point: nearestPoint,
    index: nearestIndex,
    distance: nearestDistance,
  };
}

/**
 * 路线工具模块默认导出
 */
export default {
  ROUTE_TYPES,
  ROUTE_STATUS,
  loadRoutes,
  transformRouteData,
  planRoute,
  calculateRouteDistance,
  estimateRouteDuration,
  formatRouteDistance,
  formatRouteDuration,
  getNextPoint,
  getPreviousPoint,
  isArrivedAtPoint,
  getRouteProgress,
  generateRouteGuidance,
  findNearestPoint,
};
