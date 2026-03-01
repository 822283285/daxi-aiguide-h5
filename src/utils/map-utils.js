/**
 * 地图工具模块
 * 提供地图相关的通用工具函数
 * @module utils/map-utils
 */

/**
 * 地图配置默认值
 */
export const MAP_DEFAULTS = {
  // 默认缩放级别
  defaultZoom: 15,
  // 最小缩放级别
  minZoom: 10,
  // 最大缩放级别
  maxZoom: 18,
  // 默认中心点 (经纬度)
  defaultCenter: [113.324529, 23.099082], // 广州塔附近
  // 地图容器 ID 前缀
  containerPrefix: "map-container-",
};

/**
 * 楼层信息
 */
export const FLOOR_INFO = {
  // 楼层映射 (实际楼层 -> 显示名称)
  floorNames: {
    "-2": "B2",
    "-1": "B1",
    "0": "L1",
    "1": "L2",
    "2": "L3",
    "3": "L4",
    "4": "L5",
    "5": "L6",
  },
  // 默认楼层
  defaultFloor: "0",
};

/**
 * 初始化地图
 * @param {string} containerId - 地图容器 ID
 * @param {Object} options - 地图配置选项
 * @param {Array} [options.center] - 中心点坐标 [lng, lat]
 * @param {number} [options.zoom] - 缩放级别
 * @param {number} [options.minZoom] - 最小缩放级别
 * @param {number} [options.maxZoom] - 最大缩放级别
 * @param {boolean} [options.showCompass=true] - 显示指南针
 * @param {boolean} [options.showScale=true] - 显示比例尺
 * @returns {Object} 地图实例配置
 */
export function initMap(containerId, options = {}) {
  const config = {
    container: containerId,
    center: options.center || MAP_DEFAULTS.defaultCenter,
    zoom: options.zoom || MAP_DEFAULTS.defaultZoom,
    minZoom: options.minZoom || MAP_DEFAULTS.minZoom,
    maxZoom: options.maxZoom || MAP_DEFAULTS.maxZoom,
    showCompass: options.showCompass !== false,
    showScale: options.showScale !== false,
  };

  console.log("[MapUtils] 初始化地图:", config);
  return config;
}

/**
 * 获取楼层列表
 * @param {Array} floors - 楼层数据
 * @returns {Array} 格式化后的楼层列表
 */
export function getFloorList(floors = []) {
  if (floors.length === 0) {
    // 返回默认楼层
    return Object.entries(FLOOR_INFO.floorNames).map(([value, name]) => ({
      value,
      name,
      isDefault: value === FLOOR_INFO.defaultFloor,
    }));
  }

  return floors.map((floor) => ({
    value: String(floor.value || floor.floor),
    name: floor.name || FLOOR_INFO.floorNames[floor] || `L${floor}`,
    isDefault: String(floor.value || floor.floor) === FLOOR_INFO.defaultFloor,
  }));
}

/**
 * 获取楼层显示名称
 * @param {string|number} floor - 楼层值
 * @returns {string} 楼层显示名称
 */
export function getFloorName(floor) {
  const floorStr = String(floor);
  return FLOOR_INFO.floorNames[floorStr] || `L${floor}`;
}

/**
 * 计算两点之间的距离 (米)
 * @param {Array} point1 - 点 1 坐标 [lng, lat]
 * @param {Array} point2 - 点 2 坐标 [lng, lat]
 * @returns {number} 距离 (米)
 */
export function calculateDistance(point1, point2) {
  const [lng1, lat1] = point1;
  const [lng2, lat2] = point2;

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
 * 计算地图中心点到 POI 的距离
 * @param {Array} center - 地图中心点 [lng, lat]
 * @param {Object} poi - POI 对象 (包含 location 字段)
 * @returns {number} 距离 (米)
 */
export function getPOIDistance(center, poi) {
  if (!poi || !poi.location) {
    return Infinity;
  }

  const poiLocation = Array.isArray(poi.location) ? poi.location : [poi.location.lng, poi.location.lat];
  return calculateDistance(center, poiLocation);
}

/**
 * 根据距离排序 POI 列表
 * @param {Array} pois - POI 列表
 * @param {Array} center - 中心点坐标
 * @returns {Array} 排序后的 POI 列表
 */
export function sortPOIsByDistance(pois, center) {
  return [...pois].sort((a, b) => {
    const distA = getPOIDistance(center, a);
    const distB = getPOIDistance(center, b);
    return distA - distB;
  });
}

/**
 * 生成 POI 标记配置
 * @param {Object} poi - POI 数据
 * @param {Object} options - 配置选项
 * @param {boolean} [options.showLabel=true] - 显示标签
 * @param {boolean} [options.clickable=true] - 可点击
 * @returns {Object} 标记配置
 */
export function createPOIMarker(poi, options = {}) {
  const config = {
    id: poi.id || poi.poi_id,
    position: Array.isArray(poi.location) ? poi.location : [poi.location?.lng, poi.location?.lat],
    title: poi.name || poi.title,
    icon: poi.icon || "default",
    showLabel: options.showLabel !== false,
    clickable: options.clickable !== false,
    floor: poi.floor || "0",
    category: poi.category || "default",
  };

  return config;
}

/**
 * 批量生成 POI 标记配置
 * @param {Array} pois - POI 列表
 * @param {Object} options - 配置选项
 * @returns {Array} 标记配置列表
 */
export function createPOIMarkers(pois, options = {}) {
  return pois.map((poi) => createPOIMarker(poi, options));
}

/**
 * 计算地图边界
 * @param {Array} points - 坐标点列表 [[lng, lat], ...]
 * @returns {Object} 边界对象 {north, south, east, west}
 */
export function calculateBounds(points) {
  if (!points || points.length === 0) {
    return null;
  }

  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;

  points.forEach(([lng, lat]) => {
    if (lat > north) north = lat;
    if (lat < south) south = lat;
    if (lng > east) east = lng;
    if (lng < west) west = lng;
  });

  return { north, south, east, west };
}

/**
 * 根据 POI 列表计算最佳地图视图
 * @param {Array} pois - POI 列表
 * @param {Object} options - 配置选项
 * @param {number} [options.padding=50] - 边距 (像素)
 * @returns {Object} 视图配置 {center, zoom}
 */
export function getBestViewForPOIs(pois, options = {}) {
  const padding = options.padding || 50;

  if (!pois || pois.length === 0) {
    return {
      center: MAP_DEFAULTS.defaultCenter,
      zoom: MAP_DEFAULTS.defaultZoom,
    };
  }

  const points = pois
    .filter((poi) => poi.location)
    .map((poi) => (Array.isArray(poi.location) ? poi.location : [poi.location.lng, poi.location.lat]));

  if (points.length === 0) {
    return {
      center: MAP_DEFAULTS.defaultCenter,
      zoom: MAP_DEFAULTS.defaultZoom,
    };
  }

  const bounds = calculateBounds(points);
  if (!bounds) {
    return {
      center: MAP_DEFAULTS.defaultCenter,
      zoom: MAP_DEFAULTS.defaultZoom,
    };
  }

  // 计算中心点
  const center = [(bounds.east + bounds.west) / 2, (bounds.north + bounds.south) / 2];

  // 计算缩放级别 (简化算法)
  const latDiff = bounds.north - bounds.south;
  const lngDiff = bounds.east - bounds.west;
  const maxDiff = Math.max(latDiff, lngDiff);

  // 根据范围估算缩放级别
  let zoom = MAP_DEFAULTS.defaultZoom;
  if (maxDiff > 0.1) zoom = 12;
  else if (maxDiff > 0.05) zoom = 13;
  else if (maxDiff > 0.01) zoom = 14;
  else if (maxDiff > 0.005) zoom = 15;
  else if (maxDiff > 0.001) zoom = 16;
  else zoom = 17;

  return { center, zoom };
}

/**
 * 格式化坐标显示
 * @param {Array} coordinate - 坐标 [lng, lat]
 * @param {number} [precision=4] - 小数精度
 * @returns {string} 格式化后的坐标字符串
 */
export function formatCoordinate(coordinate, precision = 4) {
  if (!coordinate || coordinate.length !== 2) {
    return "";
  }

  const [lng, lat] = coordinate;
  return `${lat.toFixed(precision)}°N, ${lng.toFixed(precision)}°E`;
}

/**
 * 检查坐标是否有效
 * @param {Array} coordinate - 坐标 [lng, lat]
 * @returns {boolean} 是否有效
 */
export function isValidCoordinate(coordinate) {
  if (!coordinate || !Array.isArray(coordinate) || coordinate.length !== 2) {
    return false;
  }

  const [lng, lat] = coordinate;
  return typeof lng === "number" && typeof lat === "number" && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}

/**
 * 地图工具模块默认导出
 */
export default {
  MAP_DEFAULTS,
  FLOOR_INFO,
  initMap,
  getFloorList,
  getFloorName,
  calculateDistance,
  getPOIDistance,
  sortPOIsByDistance,
  createPOIMarker,
  createPOIMarkers,
  calculateBounds,
  getBestViewForPOIs,
  formatCoordinate,
  isValidCoordinate,
};
