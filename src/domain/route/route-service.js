/**
 * Route 领域服务
 * @description 提供路线规划相关的核心业务逻辑
 */

import { Route, RoutePlan } from "./route-entity.js";

export class RouteService {
  /**
   * @param {RouteRepository} repository - 路线仓储实例
   */
  constructor(repository) {
    if (!repository) {
      throw new Error("RouteRepository is required");
    }
    this.repository = repository;
  }

  /**
   * 加载所有路线数据
   * @param {Object} options - 加载选项
   * @returns {Promise<Route[]>}
   */
  async loadAllRoutes(options = {}) {
    const routes = await this.repository.findAll(options);
    return Route.fromList(routes);
  }

  /**
   * 获取路线详情
   * @param {string} id - 路线 ID
   * @returns {Promise<Route|null>}
   */
  async getRouteDetail(id) {
    const route = await this.repository.findById(id);
    return route ? new Route(route) : null;
  }

  /**
   * 根据编码获取路线
   * @param {string} code - 路线编码
   * @returns {Promise<Route|null>}
   */
  async getRouteByCode(code) {
    const route = await this.repository.findByCode(code);
    return route ? new Route(route) : null;
  }

  /**
   * 获取推荐路线列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Route[]>}
   */
  async getRecommendedRoutes(options = {}) {
    const routes = await this.repository.getRecommendedRoutes(options);
    return Route.fromList(routes);
  }

  /**
   * 规划从起点到终点的路线
   * @param {Object} origin - 起点 {lng, lat, floor?, name?}
   * @param {Object} destination - 终点 {lng, lat, floor?, name?}
   * @param {Object} options - 规划选项
   * @returns {Promise<RoutePlan>}
   */
  async planRoute(origin, destination, options = {}) {
    if (!origin || !destination) {
      throw new Error("起点和终点不能为空");
    }

    const plan = await this.repository.planRoute(origin, destination, options);
    return RoutePlan.from(plan);
  }

  /**
   * 规划多点路线
   * @param {Object} origin - 起点
   * @param {Object} destination - 终点
   * @param {Array<Object>} waypoints - 途经点列表
   * @param {Object} options - 规划选项
   * @returns {Promise<RoutePlan>}
   */
  async planMultiPointRoute(origin, destination, waypoints = [], options = {}) {
    if (!origin || !destination) {
      throw new Error("起点和终点不能为空");
    }

    const plan = await this.repository.planMultiPointRoute(
      origin,
      destination,
      waypoints,
      options
    );
    return RoutePlan.from(plan);
  }

  /**
   * 保存自定义路线
   * @param {Object} routeData - 路线数据
   * @returns {Promise<Route>}
   */
  async saveCustomRoute(routeData) {
    const route = new Route({
      ...routeData,
      type: "custom",
    });
    const saved = await this.repository.save(route);
    return new Route(saved);
  }

  /**
   * 删除路线
   * @param {string} id - 路线 ID
   * @returns {Promise<boolean>}
   */
  async deleteRoute(id) {
    return this.repository.delete(id);
  }

  /**
   * 获取路线的途经点列表
   * @param {Route} route - 路线对象
   * @returns {Array<Object>}
   */
  getWaypoints(route) {
    if (!route) {
      return [];
    }
    return route.waypoints || [];
  }

  /**
   * 获取路线的路径坐标
   * @param {Route} route - 路线对象
   * @returns {Array<Object>}
   */
  getPathCoordinates(route) {
    if (!route) {
      return [];
    }
    return route.path || [];
  }

  /**
   * 计算路线的平均速度（米/分钟）
   * @param {Route} route - 路线对象
   * @returns {number}
   */
  calculateAverageSpeed(route) {
    if (!route || route.estimatedTime === 0) {
      return 0;
    }
    return route.totalDistance / route.estimatedTime;
  }

  /**
   * 估算步行时间（基于距离）
   * @param {number} distance - 距离（米）
   * @param {number} [speed=80] - 步行速度（米/分钟）
   * @returns {number} 时间（分钟）
   */
  estimateWalkingTime(distance, speed = 80) {
    if (!distance || distance <= 0) {
      return 0;
    }
    return Math.round(distance / speed);
  }

  /**
   * 过滤活跃路线
   * @param {Route[]} routes - 路线列表
   * @returns {Route[]}
   */
  filterActive(routes) {
    return (routes || []).filter((route) => route.isActive());
  }

  /**
   * 按距离排序路线
   * @param {Route[]} routes - 路线列表
   * @param {string} [order='asc'] - 排序方向
   * @returns {Route[]}
   */
  sortByDistance(routes, order = "asc") {
    return [...(routes || [])].sort((a, b) => {
      return order === "asc"
        ? a.totalDistance - b.totalDistance
        : b.totalDistance - a.totalDistance;
    });
  }

  /**
   * 按时间排序路线
   * @param {Route[]} routes - 路线列表
   * @param {string} [order='asc'] - 排序方向
   * @returns {Route[]}
   */
  sortByTime(routes, order = "asc") {
    return [...(routes || [])].sort((a, b) => {
      return order === "asc"
        ? a.estimatedTime - b.estimatedTime
        : b.estimatedTime - a.estimatedTime;
    });
  }
}
