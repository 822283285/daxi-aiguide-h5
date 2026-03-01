/**
 * POI 工具模块
 * 提供 POI 相关的通用工具函数
 * @module utils/poi-utils
 */

import { getExhibitAll, getExhibitExplainAll } from "../api/modules/exhibit.js";
import { getPOIDistance, sortPOIsByDistance } from "./map-utils.js";

/**
 * POI 分类定义
 */
export const POI_CATEGORIES = {
  EXHIBIT: "exhibit", // 展品
  FACILITY: "facility", // 设施
  SERVICE: "service", // 服务
  ENTRANCE: "entrance", // 入口
  EXIT: "exit", // 出口
  ELEVATOR: "elevator", // 电梯
  STAIRS: "stairs", // 楼梯
  RESTROOM: "restroom", // 洗手间
  CAFE: "cafe", // 咖啡厅
  SHOP: "shop", // 商店
  PARKING: "parking", // 停车场
  DEFAULT: "default",
};

/**
 * POI 分类图标映射
 */
export const POI_ICONS = {
  [POI_CATEGORIES.EXHIBIT]: "🎨",
  [POI_CATEGORIES.FACILITY]: "🏛️",
  [POI_CATEGORIES.SERVICE]: "ℹ️",
  [POI_CATEGORIES.ENTRANCE]: "🚪",
  [POI_CATEGORIES.EXIT]: "🚪",
  [POI_CATEGORIES.ELEVATOR]: "🛗",
  [POI_CATEGORIES.STAIRS]: "🪜",
  [POI_CATEGORIES.RESTROOM]: "🚻",
  [POI_CATEGORIES.CAFE]: "☕",
  [POI_CATEGORIES.SHOP]: "🛍️",
  [POI_CATEGORIES.PARKING]: "🅿️",
  [POI_CATEGORIES.DEFAULT]: "📍",
};

/**
 * POI 分类名称映射
 */
export const POI_CATEGORY_NAMES = {
  [POI_CATEGORIES.EXHIBIT]: "展品",
  [POI_CATEGORIES.FACILITY]: "设施",
  [POI_CATEGORIES.SERVICE]: "服务",
  [POI_CATEGORIES.ENTRANCE]: "入口",
  [POI_CATEGORIES.EXIT]: "出口",
  [POI_CATEGORIES.ELEVATOR]: "电梯",
  [POI_CATEGORIES.STAIRS]: "楼梯",
  [POI_CATEGORIES.RESTROOM]: "洗手间",
  [POI_CATEGORIES.CAFE]: "咖啡厅",
  [POI_CATEGORIES.SHOP]: "商店",
  [POI_CATEGORIES.PARKING]: "停车场",
  [POI_CATEGORIES.DEFAULT]: "其他",
};

/**
 * 从 API 数据加载 POI 列表
 * @param {Object} options - 加载选项
 * @param {string} [options.token] - 用户 token
 * @param {string} [options.bdid] - 建筑 ID
 * @param {boolean} [options.showLog=true] - 是否显示日志
 * @returns {Promise<Array>} POI 列表
 */
export async function loadPOIs(options = {}) {
  try {
    const exhibitData = await getExhibitAll(options);
    console.log("[POIUtils] 加载展品列表成功:", exhibitData);

    // 转换展品数据为 POI 格式
    const pois = transformExhibitsToPOIs(exhibitData);
    return pois;
  } catch (error) {
    console.error("[POIUtils] 加载 POI 失败:", error);
    return [];
  }
}

/**
 * 从展品详情加载 POI 列表
 * @param {Object} options - 加载选项
 * @returns {Promise<Array>} POI 列表
 */
export async function loadPOIDetails(options = {}) {
  try {
    const explainData = await getExhibitExplainAll(options);
    console.log("[POIUtils] 加载展品详情成功:", explainData);

    // 转换展品详情数据为 POI 格式
    const pois = transformExplainsToPOIs(explainData);
    return pois;
  } catch (error) {
    console.error("[POIUtils] 加载 POI 详情失败:", error);
    return [];
  }
}

/**
 * 将展品数据转换为 POI 格式
 * @param {Object} exhibitData - 展品数据
 * @returns {Array} POI 列表
 */
export function transformExhibitsToPOIs(exhibitData) {
  if (!exhibitData || !exhibitData.list) {
    return [];
  }

  return exhibitData.list.map((exhibit) => ({
    id: exhibit.exhibit_id || exhibit.id,
    poi_id: exhibit.exhibit_id || exhibit.id,
    name: exhibit.name || exhibit.title,
    title: exhibit.name || exhibit.title,
    description: exhibit.description || exhibit.intro || "",
    category: POI_CATEGORIES.EXHIBIT,
    icon: POI_ICONS[POI_CATEGORIES.EXHIBIT],
    location: exhibit.location
      ? Array.isArray(exhibit.location)
        ? exhibit.location
        : [exhibit.location.lng, exhibit.location.lat]
      : null,
    floor: exhibit.floor || "0",
    images: exhibit.images || exhibit.image ? [exhibit.images || exhibit.image] : [],
    audio: exhibit.audio || null,
    video: exhibit.video || null,
    isRecommended: exhibit.is_recommend || exhibit.recommended || false,
    sort: exhibit.sort || 0,
  }));
}

/**
 * 将展品详情数据转换为 POI 格式
 * @param {Object} explainData - 展品详情数据
 * @returns {Array} POI 列表
 */
export function transformExplainsToPOIs(explainData) {
  if (!explainData || !explainData.list) {
    return [];
  }

  return explainData.list.map((explain) => ({
    id: explain.exhibit_id || explain.id,
    poi_id: explain.exhibit_id || explain.id,
    name: explain.name || explain.title,
    title: explain.name || explain.title,
    description: explain.description || explain.content || "",
    category: POI_CATEGORIES.EXHIBIT,
    icon: POI_ICONS[POI_CATEGORIES.EXHIBIT],
    location: explain.location
      ? Array.isArray(explain.location)
        ? explain.location
        : [explain.location.lng, explain.location.lat]
      : null,
    floor: explain.floor || "0",
    images: explain.images || explain.image ? [explain.images || explain.image] : [],
    audio: explain.audio || null,
    video: explain.video || null,
    content: explain.content || explain.description || "",
    sort: explain.sort || 0,
  }));
}

/**
 * 搜索 POI
 * @param {Array} pois - POI 列表
 * @param {string} keyword - 搜索关键词
 * @param {Object} options - 搜索选项
 * @param {boolean} [options.searchDescription=true] - 是否搜索描述
 * @param {boolean} [options.searchCategory=true] - 是否搜索分类
 * @returns {Array} 搜索结果
 */
export function searchPOIs(pois, keyword, options = {}) {
  if (!keyword || !pois) {
    return [];
  }

  const searchDescription = options.searchDescription !== false;
  const searchCategory = options.searchCategory !== false;
  const keywordLower = keyword.toLowerCase();

  return pois.filter((poi) => {
    // 搜索名称
    if (poi.name && poi.name.toLowerCase().includes(keywordLower)) {
      return true;
    }

    // 搜索标题
    if (poi.title && poi.title.toLowerCase().includes(keywordLower)) {
      return true;
    }

    // 搜索描述
    if (searchDescription && poi.description && poi.description.toLowerCase().includes(keywordLower)) {
      return true;
    }

    // 搜索分类
    if (searchCategory && poi.category && poi.category.toLowerCase().includes(keywordLower)) {
      return true;
    }

    return false;
  });
}

/**
 * 按分类筛选 POI
 * @param {Array} pois - POI 列表
 * @param {string} category - 分类
 * @returns {Array} 筛选结果
 */
export function filterPOIsByCategory(pois, category) {
  if (!category || !pois) {
    return pois || [];
  }

  return pois.filter((poi) => poi.category === category);
}

/**
 * 按楼层筛选 POI
 * @param {Array} pois - POI 列表
 * @param {string} floor - 楼层
 * @returns {Array} 筛选结果
 */
export function filterPOIsByFloor(pois, floor) {
  if (!floor || !pois) {
    return pois || [];
  }

  return pois.filter((poi) => String(poi.floor) === String(floor));
}

/**
 * 获取推荐 POI 列表
 * @param {Array} pois - POI 列表
 * @param {number} [limit=10] - 返回数量限制
 * @returns {Array} 推荐 POI 列表
 */
export function getRecommendedPOIs(pois, limit = 10) {
  if (!pois) {
    return [];
  }

  const recommended = pois.filter((poi) => poi.isRecommended);

  // 按排序字段排序
  recommended.sort((a, b) => (b.sort || 0) - (a.sort || 0));

  return limit ? recommended.slice(0, limit) : recommended;
}

/**
 * 获取 POI 图标
 * @param {string} category - POI 分类
 * @returns {string} 图标字符
 */
export function getPOIIcon(category) {
  return POI_ICONS[category] || POI_ICONS[POI_CATEGORIES.DEFAULT];
}

/**
 * 获取 POI 分类名称
 * @param {string} category - POI 分类
 * @returns {string} 分类名称
 */
export function getPOICategoryName(category) {
  return POI_CATEGORY_NAMES[category] || POI_CATEGORY_NAMES[POI_CATEGORIES.DEFAULT];
}

/**
 * 获取 POI 距离文本
 * @param {number} distance - 距离 (米)
 * @returns {string} 格式化后的距离文本
 */
export function getPOIDistanceText(distance) {
  if (distance === Infinity || distance === null || distance === undefined) {
    return "";
  }

  if (distance < 100) {
    return `${Math.round(distance)}m`;
  } else if (distance < 1000) {
    return `${Math.round(distance / 10) * 10}m`;
  } else {
    return `${(distance / 1000).toFixed(1)}km`;
  }
}

/**
 * 计算 POI 与当前位置的距离
 * @param {Object} poi - POI 对象
 * @param {Array} currentLocation - 当前位置 [lng, lat]
 * @returns {number} 距离 (米)
 */
export function calculatePOIDistance(poi, currentLocation) {
  if (!poi || !poi.location || !currentLocation) {
    return Infinity;
  }

  return getPOIDistance(currentLocation, poi);
}

/**
 * 按距离排序 POI 列表
 * @param {Array} pois - POI 列表
 * @param {Array} currentLocation - 当前位置 [lng, lat]
 * @returns {Array} 排序后的 POI 列表
 */
export function sortPOIsByDistanceFromLocation(pois, currentLocation) {
  return sortPOIsByDistance(pois, currentLocation);
}

/**
 * 获取热门 POI (基于距离和推荐度)
 * @param {Array} pois - POI 列表
 * @param {Array} currentLocation - 当前位置 [lng, lat]
 * @param {number} [limit=10] - 返回数量限制
 * @returns {Array} 热门 POI 列表
 */
export function getPopularPOIs(pois, currentLocation, limit = 10) {
  if (!pois) {
    return [];
  }

  // 复制并排序
  const sorted = [...pois].sort((a, b) => {
    const distA = calculatePOIDistance(a, currentLocation);
    const distB = calculatePOIDistance(b, currentLocation);

    // 推荐 POI 优先
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;

    // 否则按距离排序
    return distA - distB;
  });

  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * 获取 POI 详情
 * @param {Array} pois - POI 列表
 * @param {string} poiId - POI ID
 * @returns {Object|null} POI 详情
 */
export function getPOIDetail(pois, poiId) {
  if (!pois || !poiId) {
    return null;
  }

  return pois.find((poi) => poi.id === poiId || poi.poi_id === poiId) || null;
}

/**
 * 分组 POI 按楼层
 * @param {Array} pois - POI 列表
 * @returns {Object} 按楼层分组的 POI {floor: [pois]}
 */
export function groupPOIsByFloor(pois) {
  if (!pois) {
    return {};
  }

  return pois.reduce((groups, poi) => {
    const floor = String(poi.floor || "0");
    if (!groups[floor]) {
      groups[floor] = [];
    }
    groups[floor].push(poi);
    return groups;
  }, {});
}

/**
 * 分组 POI 按分类
 * @param {Array} pois - POI 列表
 * @returns {Object} 按分类分组的 POI {category: [pois]}
 */
export function groupPOIsByCategory(pois) {
  if (!pois) {
    return {};
  }

  return pois.reduce((groups, poi) => {
    const category = poi.category || POI_CATEGORIES.DEFAULT;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(poi);
    return groups;
  }, {});
}

/**
 * POI 工具模块默认导出
 */
export default {
  POI_CATEGORIES,
  POI_ICONS,
  POI_CATEGORY_NAMES,
  loadPOIs,
  loadPOIDetails,
  transformExhibitsToPOIs,
  transformExplainsToPOIs,
  searchPOIs,
  filterPOIsByCategory,
  filterPOIsByFloor,
  getRecommendedPOIs,
  getPOIIcon,
  getPOICategoryName,
  getPOIDistanceText,
  calculatePOIDistance,
  sortPOIsByDistanceFromLocation,
  getPopularPOIs,
  getPOIDetail,
  groupPOIsByFloor,
  groupPOIsByCategory,
};
