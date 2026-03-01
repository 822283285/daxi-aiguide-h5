/**
 * Route 领域模型
 * @description 定义路线规划的核心业务实体
 */

export class Route {
  constructor(data) {
    this.id = data.id || "";
    this.name = data.name || "";
    this.code = data.code || "";
    this.type = data.type || "recommended"; // recommended, custom, navigation
    this.description = data.description || "";
    this.totalDistance = data.totalDistance || 0; // 总距离（米）
    this.estimatedTime = data.estimatedTime || 0; // 预计时间（分钟）
    this.waypoints = data.waypoints || []; // 途经点列表
    this.path = data.path || []; // 路径坐标点
    this.metadata = data.metadata || {};
    this.status = data.status || "active"; // active, inactive
    this.sortOrder = data.sortOrder || 0;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  /**
   * 获取路线的显示名称
   * @returns {string}
   */
  getDisplayName() {
    return this.name || this.code || "未知路线";
  }

  /**
   * 获取途经点数量
   * @returns {number}
   */
  getWaypointCount() {
    return this.waypoints.length;
  }

  /**
   * 获取起点
   * @returns {Object|null}
   */
  getStartPoint() {
    return this.waypoints[0] || null;
  }

  /**
   * 获取终点
   * @returns {Object|null}
   */
  getEndPoint() {
    return this.waypoints[this.waypoints.length - 1] || null;
  }

  /**
   * 检查路线是否可用
   * @returns {boolean}
   */
  isActive() {
    return this.status === "active";
  }

  /**
   * 获取 formatted 距离
   * @returns {string}
   */
  getFormattedDistance() {
    if (this.totalDistance >= 1000) {
      return `${(this.totalDistance / 1000).toFixed(1)}km`;
    }
    return `${Math.round(this.totalDistance)}m`;
  }

  /**
   * 获取 formatted 时间
   * @returns {string}
   */
  getFormattedTime() {
    if (this.estimatedTime >= 60) {
      const hours = Math.floor(this.estimatedTime / 60);
      const minutes = this.estimatedTime % 60;
      return `${hours}小时${minutes > 0 ? minutes + "分钟" : ""}`;
    }
    return `${this.estimatedTime}分钟`;
  }

  /**
   * 添加途经点
   * @param {Object} waypoint - 途经点
   */
  addWaypoint(waypoint) {
    this.waypoints.push(waypoint);
  }

  /**
   * 移除途经点
   * @param {string} waypointId - 途经点 ID
   * @returns {boolean}
   */
  removeWaypoint(waypointId) {
    const index = this.waypoints.findIndex((wp) => wp.id === waypointId);
    if (index !== -1) {
      this.waypoints.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取路径的边界框
   * @returns {Object|null} {minLng, maxLng, minLat, maxLat}
   */
  getBounds() {
    if (this.path.length === 0) {
      return null;
    }

    let minLng = Infinity,
      maxLng = -Infinity;
    let minLat = Infinity,
      maxLat = -Infinity;

    this.path.forEach((point) => {
      const lng = point.longitude || point.lng || 0;
      const lat = point.latitude || point.lat || 0;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    });

    return { minLng, maxLng, minLat, maxLat };
  }

  /**
   * 转换为纯对象
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      type: this.type,
      description: this.description,
      totalDistance: this.totalDistance,
      estimatedTime: this.estimatedTime,
      waypoints: this.waypoints,
      path: this.path,
      metadata: this.metadata,
      status: this.status,
      sortOrder: this.sortOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 从对象创建 Route 实例
   * @param {Object} data
   * @returns {Route}
   */
  static from(data) {
    return new Route(data);
  }

  /**
   * 从对象数组创建 Route 实例数组
   * @param {Array<Object>} dataList
   * @returns {Route[]}
   */
  static fromList(dataList) {
    return (dataList || []).map((data) => new Route(data));
  }
}

/**
 * 路线规划结果
 */
export class RoutePlan {
  constructor(data) {
    this.origin = data.origin || null; // 起点
    this.destination = data.destination || null; // 终点
    this.waypoints = data.waypoints || []; // 途经点
    this.routes = data.routes || []; // 可选路线列表
    this.selectedRoute = data.selectedRoute || null; // 选中的路线
    this.metadata = data.metadata || {};
  }

  /**
   * 获取最佳路线
   * @returns {Route|null}
   */
  getBestRoute() {
    if (this.routes.length === 0) {
      return null;
    }
    return this.routes[0];
  }

  /**
   * 设置选中的路线
   * @param {Route} route
   */
  selectRoute(route) {
    this.selectedRoute = route;
  }

  /**
   * 转换为纯对象
   * @returns {Object}
   */
  toJSON() {
    return {
      origin: this.origin,
      destination: this.destination,
      waypoints: this.waypoints,
      routes: this.routes.map((r) => r.toJSON()),
      selectedRoute: this.selectedRoute?.toJSON() || null,
      metadata: this.metadata,
    };
  }

  /**
   * 从对象创建 RoutePlan 实例
   * @param {Object} data
   * @returns {RoutePlan}
   */
  static from(data) {
    return new RoutePlan(data);
  }
}
