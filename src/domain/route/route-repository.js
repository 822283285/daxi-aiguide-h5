/**
 * Route 领域仓储接口
 * @description 定义路线数据访问的抽象接口（由 Platform 层实现）
 */

export class RouteRepository {
  /**
   * 获取所有路线列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Route[]>}
   */
  async findAll(options = {}) {
    throw new Error("Method 'findAll' must be implemented by Platform layer");
  }

  /**
   * 根据 ID 获取路线
   * @param {string} id - 路线 ID
   * @returns {Promise<Route|null>}
   */
  async findById(id) {
    throw new Error("Method 'findById' must be implemented by Platform layer");
  }

  /**
   * 根据编码获取路线
   * @param {string} code - 路线编码
   * @returns {Promise<Route|null>}
   */
  async findByCode(code) {
    throw new Error("Method 'findByCode' must be implemented by Platform layer");
  }

  /**
   * 根据类型获取路线列表
   * @param {string} type - 路线类型
   * @param {Object} [options] - 查询选项
   * @returns {Promise<Route[]>}
   */
  async findByType(type, options = {}) {
    throw new Error("Method 'findByType' must be implemented by Platform layer");
  }

  /**
   * 规划路线
   * @param {Object} origin - 起点 {lng, lat, floor?}
   * @param {Object} destination - 终点 {lng, lat, floor?}
   * @param {Object} [options] - 规划选项
   * @returns {Promise<RoutePlan>}
   */
  async planRoute(origin, destination, options = {}) {
    throw new Error("Method 'planRoute' must be implemented by Platform layer");
  }

  /**
   * 规划多点路线
   * @param {Object} origin - 起点
   * @param {Object} destination - 终点
   * @param {Array<Object>} waypoints - 途经点列表
   * @param {Object} [options] - 规划选项
   * @returns {Promise<RoutePlan>}
   */
  async planMultiPointRoute(origin, destination, waypoints = [], options = {}) {
    throw new Error("Method 'planMultiPointRoute' must be implemented by Platform layer");
  }

  /**
   * 获取推荐路线列表
   * @param {Object} [options] - 查询选项
   * @returns {Promise<Route[]>}
   */
  async getRecommendedRoutes(options = {}) {
    return this.findByType("recommended", options);
  }

  /**
   * 获取自定义路线列表
   * @param {Object} [options] - 查询选项
   * @returns {Promise<Route[]>}
   */
  async getCustomRoutes(options = {}) {
    return this.findByType("custom", options);
  }

  /**
   * 保存路线
   * @param {Route} route - 路线对象
   * @returns {Promise<Route>}
   */
  async save(route) {
    throw new Error("Method 'save' must be implemented by Platform layer");
  }

  /**
   * 删除路线
   * @param {string} id - 路线 ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error("Method 'delete' must be implemented by Platform layer");
  }
}

/**
 * 路线规划结果（用于 Repository 内部）
 */
export class RoutePlan {
  constructor(data) {
    this.origin = data.origin || null;
    this.destination = data.destination || null;
    this.waypoints = data.waypoints || [];
    this.routes = data.routes || [];
    this.selectedRoute = data.selectedRoute || null;
    this.metadata = data.metadata || {};
  }

  static from(data) {
    return new RoutePlan(data);
  }
}
