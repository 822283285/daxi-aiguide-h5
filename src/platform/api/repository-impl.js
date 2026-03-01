/**
 * API 平台服务
 * @description 封装 API 调用，实现 Domain 层的 Repository 接口
 */

import { POIRepository } from "@/domain/poi/poi-repository.js";
import { RouteRepository } from "@/domain/route/route-repository.js";

/**
 * POI 仓储实现（基于现有 API）
 */
export class POIRepositoryImpl extends POIRepository {
  constructor(apiService, options = {}) {
    super();
    this.apiService = apiService;
    this.options = options;
    this.cache = new Map();
  }

  async findAll(options = {}) {
    const cacheKey = `pois_all_${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey) && !options.forceRefresh) {
      return this.cache.get(cacheKey);
    }

    try {
      // 调用现有的 exhibit API 获取展品数据
      const exhibitData = await this.apiService.exhibit.getExhibitAll({
        showLog: false,
      });

      // 转换为 POI 格式
      const pois = this._convertExhibitsToPOIs(exhibitData);

      this.cache.set(cacheKey, pois);
      return pois;
    } catch (error) {
      console.error("[POIRepositoryImpl] findAll error:", error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const pois = await this.findAll();
      return pois.find((poi) => poi.id === id) || null;
    } catch (error) {
      console.error("[POIRepositoryImpl] findById error:", error);
      throw error;
    }
  }

  async findByCode(code) {
    try {
      const pois = await this.findAll();
      return pois.find((poi) => poi.code === code) || null;
    } catch (error) {
      console.error("[POIRepositoryImpl] findByCode error:", error);
      throw error;
    }
  }

  async findByType(type, options = {}) {
    try {
      const pois = await this.findAll(options);
      return pois.filter((poi) => poi.type === type);
    } catch (error) {
      console.error("[POIRepositoryImpl] findByType error:", error);
      throw error;
    }
  }

  async findByCategory(category, options = {}) {
    try {
      const pois = await this.findAll(options);
      return pois.filter((poi) => poi.category === category);
    } catch (error) {
      console.error("[POIRepositoryImpl] findByCategory error:", error);
      throw error;
    }
  }

  async findByFloor(floor, options = {}) {
    try {
      const pois = await this.findAll(options);
      return pois.filter((poi) => (poi.location?.floor || 1) === floor);
    } catch (error) {
      console.error("[POIRepositoryImpl] findByFloor error:", error);
      throw error;
    }
  }

  async search(keyword, options = {}) {
    try {
      const pois = await this.findAll(options);
      const keywordLower = keyword.toLowerCase();
      return pois.filter(
        (poi) =>
          poi.name?.toLowerCase().includes(keywordLower) ||
          poi.description?.toLowerCase().includes(keywordLower) ||
          poi.code?.toLowerCase().includes(keywordLower)
      );
    } catch (error) {
      console.error("[POIRepositoryImpl] search error:", error);
      throw error;
    }
  }

  async findNearby(longitude, latitude, radius = 100, options = {}) {
    try {
      const pois = await this.findAll(options);
      return pois.filter((poi) => {
        const poiLng = poi.location?.longitude || poi.location?.lng || 0;
        const poiLat = poi.location?.latitude || poi.location?.lat || 0;
        const distance = this._calculateDistance(longitude, latitude, poiLng, poiLat);
        return distance <= radius;
      });
    } catch (error) {
      console.error("[POIRepositoryImpl] findNearby error:", error);
      throw error;
    }
  }

  /**
   * 将展品数据转换为 POI 格式
   * @private
   */
  _convertExhibitsToPOIs(exhibitData) {
    if (!exhibitData || !exhibitData.data) {
      return [];
    }

    return (exhibitData.data || []).map((exhibit) => ({
      id: exhibit.id || exhibit.exhibit_id || "",
      code: exhibit.code || exhibit.exhibit_num || "",
      name: exhibit.name || exhibit.title || "",
      type: "exhibit",
      category: exhibit.category || "",
      description: exhibit.description || exhibit.brief || "",
      location: {
        longitude: exhibit.longitude || exhibit.lng || 0,
        latitude: exhibit.latitude || exhibit.lat || 0,
        floor: exhibit.floor || 1,
        x: exhibit.x || 0,
        y: exhibit.y || 0,
      },
      media: {
        images: exhibit.images || (exhibit.image ? [exhibit.image] : []),
        audio: exhibit.audio || [],
        video: exhibit.video || [],
      },
      metadata: exhibit,
      status: exhibit.status || "active",
      sortOrder: exhibit.sort_order || 0,
    }));
  }

  /**
   * 计算两点间距离（简化版）
   * @private
   */
  _calculateDistance(lng1, lat1, lng2, lat2) {
    const R = 6371000; // 地球半径（米）
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * Route 仓储实现
 */
export class RouteRepositoryImpl extends RouteRepository {
  constructor(apiService, options = {}) {
    super();
    this.apiService = apiService;
    this.options = options;
    this.cache = new Map();
  }

  async findAll(options = {}) {
    const cacheKey = `routes_all_${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey) && !options.forceRefresh) {
      return this.cache.get(cacheKey);
    }

    try {
      const routeData = await this.apiService.route.getRouteAll({
        showLog: false,
      });

      const routes = this._convertRoutes(routeData);
      this.cache.set(cacheKey, routes);
      return routes;
    } catch (error) {
      console.error("[RouteRepositoryImpl] findAll error:", error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const routes = await this.findAll();
      return routes.find((route) => route.id === id) || null;
    } catch (error) {
      console.error("[RouteRepositoryImpl] findById error:", error);
      throw error;
    }
  }

  async findByCode(code) {
    try {
      const routes = await this.findAll();
      return routes.find((route) => route.code === code) || null;
    } catch (error) {
      console.error("[RouteRepositoryImpl] findByCode error:", error);
      throw error;
    }
  }

  async findByType(type, options = {}) {
    try {
      const routes = await this.findAll(options);
      return routes.filter((route) => route.type === type);
    } catch (error) {
      console.error("[RouteRepositoryImpl] findByType error:", error);
      throw error;
    }
  }

  async planRoute(origin, destination, options = {}) {
    // TODO: 实现路线规划算法
    // 目前返回一个简单的直线路径
    return {
      origin,
      destination,
      routes: [
        {
          id: `route_${Date.now()}`,
          name: "规划路线",
          type: "navigation",
          totalDistance: this._calculateDistance(
            origin.lng,
            origin.lat,
            destination.lng,
            destination.lat
          ),
          estimatedTime: 10,
          waypoints: [origin, destination],
          path: [
            [origin.lng, origin.lat],
            [destination.lng, destination.lat],
          ],
        },
      ],
      selectedRoute: null,
    };
  }

  async planMultiPointRoute(origin, destination, waypoints = [], options = {}) {
    // TODO: 实现多点路线规划
    const allPoints = [origin, ...waypoints, destination];
    let totalDistance = 0;

    for (let i = 0; i < allPoints.length - 1; i++) {
      totalDistance += this._calculateDistance(
        allPoints[i].lng,
        allPoints[i].lat,
        allPoints[i + 1].lng,
        allPoints[i + 1].lat
      );
    }

    return {
      origin,
      destination,
      waypoints,
      routes: [
        {
          id: `route_${Date.now()}`,
          name: "多点路线",
          type: "navigation",
          totalDistance,
          estimatedTime: Math.round(totalDistance / 80), // 假设步行速度 80 米/分钟
          waypoints: allPoints,
          path: allPoints.map((p) => [p.lng, p.lat]),
        },
      ],
      selectedRoute: null,
    };
  }

  async save(route) {
    // TODO: 实现保存逻辑
    console.log("[RouteRepositoryImpl] save:", route);
    return route;
  }

  async delete(id) {
    // TODO: 实现删除逻辑
    console.log("[RouteRepositoryImpl] delete:", id);
    return true;
  }

  /**
   * 转换路线数据
   * @private
   */
  _convertRoutes(routeData) {
    if (!routeData || !routeData.data) {
      return [];
    }

    return (routeData.data || []).map((route) => ({
      id: route.id || route.route_id || "",
      code: route.code || route.route_num || "",
      name: route.name || route.title || "",
      type: route.type || "recommended",
      description: route.description || "",
      totalDistance: route.distance || 0,
      estimatedTime: route.time || 0,
      waypoints: route.waypoints || [],
      path: route.path || [],
      metadata: route,
      status: route.status || "active",
      sortOrder: route.sort_order || 0,
    }));
  }

  /**
   * 计算两点间距离
   * @private
   */
  _calculateDistance(lng1, lat1, lng2, lat2) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }
}
