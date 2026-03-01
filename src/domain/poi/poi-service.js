/**
 * POI 领域服务
 * @description 提供 POI 相关的核心业务逻辑
 */

import { POI } from "./poi-entity.js";

export class POIService {
  /**
   * @param {POIRepository} repository - POI 仓储实例
   */
  constructor(repository) {
    if (!repository) {
      throw new Error("POIRepository is required");
    }
    this.repository = repository;
  }

  /**
   * 加载所有 POI 数据
   * @param {Object} options - 加载选项
   * @returns {Promise<POI[]>}
   */
  async loadAllPOIs(options = {}) {
    const pois = await this.repository.findAll(options);
    return POI.fromList(pois);
  }

  /**
   * 获取 POI 详情
   * @param {string} id - POI ID
   * @returns {Promise<POI|null>}
   */
  async getPOIDetail(id) {
    const poi = await this.repository.findById(id);
    return poi ? new POI(poi) : null;
  }

  /**
   * 根据编码获取 POI
   * @param {string} code - POI 编码
   * @returns {Promise<POI|null>}
   */
  async getPOIByCode(code) {
    const poi = await this.repository.findByCode(code);
    return poi ? new POI(poi) : null;
  }

  /**
   * 搜索 POI
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<POI[]>}
   */
  async searchPOIs(keyword, options = {}) {
    if (!keyword || keyword.trim() === "") {
      return [];
    }
    const results = await this.repository.search(keyword.trim(), options);
    return POI.fromList(results);
  }

  /**
   * 获取指定类型的 POI 列表
   * @param {string} type - POI 类型
   * @param {Object} options - 查询选项
   * @returns {Promise<POI[]>}
   */
  async getPOIsByType(type, options = {}) {
    const pois = await this.repository.findByType(type, options);
    return POI.fromList(pois);
  }

  /**
   * 获取指定分类的 POI 列表
   * @param {string} category - 分类
   * @param {Object} options - 查询选项
   * @returns {Promise<POI[]>}
   */
  async getPOIsByCategory(category, options = {}) {
    const pois = await this.repository.findByCategory(category, options);
    return POI.fromList(pois);
  }

  /**
   * 获取指定楼层的 POI 列表
   * @param {number} floor - 楼层
   * @param {Object} options - 查询选项
   * @returns {Promise<POI[]>}
   */
  async getPOIsByFloor(floor, options = {}) {
    const pois = await this.repository.findByFloor(floor, options);
    return POI.fromList(pois);
  }

  /**
   * 获取附近的 POI
   * @param {number} longitude - 经度
   * @param {number} latitude - 纬度
   * @param {number} [radius=100] - 半径（米）
   * @param {Object} [options] - 查询选项
   * @returns {Promise<POI[]>}
   */
  async getNearbyPOIs(longitude, latitude, radius = 100, options = {}) {
    const pois = await this.repository.findNearby(longitude, latitude, radius, options);
    return POI.fromList(pois);
  }

  /**
   * 获取所有展品
   * @param {Object} options - 查询选项
   * @returns {Promise<POI[]>}
   */
  async getAllExhibits(options = {}) {
    return this.getPOIsByType("exhibit", options);
  }

  /**
   * 获取所有服务设施
   * @param {Object} options - 查询选项
   * @returns {Promise<POI[]>}
   */
  async getAllServices(options = {}) {
    return this.getPOIsByType("service", options);
  }

  /**
   * 按楼层分组 POI
   * @param {POI[]} pois - POI 列表
   * @returns {Map<number, POI[]>}
   */
  groupByFloor(pois) {
    const map = new Map();
    (pois || []).forEach((poi) => {
      const floor = poi.location?.floor || 1;
      if (!map.has(floor)) {
        map.set(floor, []);
      }
      map.get(floor).push(poi);
    });
    return map;
  }

  /**
   * 按类型分组 POI
   * @param {POI[]} pois - POI 列表
   * @returns {Map<string, POI[]>}
   */
  groupByType(pois) {
    const map = new Map();
    (pois || []).forEach((poi) => {
      const type = poi.type || "unknown";
      if (!map.has(type)) {
        map.set(type, []);
      }
      map.get(type).push(poi);
    });
    return map;
  }

  /**
   * 按分类分组 POI
   * @param {POI[]} pois - POI 列表
   * @returns {Map<string, POI[]>}
   */
  groupByCategory(pois) {
    const map = new Map();
    (pois || []).forEach((poi) => {
      const category = poi.category || "unknown";
      if (!map.has(category)) {
        map.set(category, []);
      }
      map.get(category).push(poi);
    });
    return map;
  }

  /**
   * 过滤活跃的 POI
   * @param {POI[]} pois - POI 列表
   * @returns {POI[]}
   */
  filterActive(pois) {
    return (pois || []).filter((poi) => poi.isActive());
  }

  /**
   * 排序 POI 列表
   * @param {POI[]} pois - POI 列表
   * @param {string} [sortBy='sortOrder'] - 排序字段
   * @param {string} [order='asc'] - 排序方向
   * @returns {POI[]}
   */
  sortBy(pois, sortBy = "sortOrder", order = "asc") {
    return [...(pois || [])].sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return order === "asc" ? aVal - bVal : bVal - aVal;
    });
  }
}
