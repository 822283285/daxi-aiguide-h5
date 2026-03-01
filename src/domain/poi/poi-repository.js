/**
 * POI 领域仓储接口
 * @description 定义 POI 数据访问的抽象接口（由 Platform 层实现）
 */

export class POIRepository {
  /**
   * 获取所有 POI 列表
   * @param {Object} options - 查询选项
   * @param {string} [options.type] - POI 类型过滤
   * @param {string} [options.category] - 分类过滤
   * @param {number} [options.floor] - 楼层过滤
   * @param {boolean} [options.activeOnly] - 只获取活跃的 POI
   * @returns {Promise<POI[]>}
   */
  async findAll(options = {}) {
    throw new Error("Method 'findAll' must be implemented by Platform layer");
  }

  /**
   * 根据 ID 获取 POI
   * @param {string} id - POI ID
   * @returns {Promise<POI|null>}
   */
  async findById(id) {
    throw new Error("Method 'findById' must be implemented by Platform layer");
  }

  /**
   * 根据编码获取 POI
   * @param {string} code - POI 编码
   * @returns {Promise<POI|null>}
   */
  async findByCode(code) {
    throw new Error("Method 'findByCode' must be implemented by Platform layer");
  }

  /**
   * 根据类型获取 POI 列表
   * @param {string} type - POI 类型
   * @param {Object} [options] - 查询选项
   * @returns {Promise<POI[]>}
   */
  async findByType(type, options = {}) {
    throw new Error("Method 'findByType' must be implemented by Platform layer");
  }

  /**
   * 根据分类获取 POI 列表
   * @param {string} category - 分类
   * @param {Object} [options] - 查询选项
   * @returns {Promise<POI[]>}
   */
  async findByCategory(category, options = {}) {
    throw new Error("Method 'findByCategory' must be implemented by Platform layer");
  }

  /**
   * 根据楼层获取 POI 列表
   * @param {number} floor - 楼层
   * @param {Object} [options] - 查询选项
   * @returns {Promise<POI[]>}
   */
  async findByFloor(floor, options = {}) {
    throw new Error("Method 'findByFloor' must be implemented by Platform layer");
  }

  /**
   * 搜索 POI
   * @param {string} keyword - 搜索关键词
   * @param {Object} [options] - 搜索选项
   * @returns {Promise<POI[]>}
   */
  async search(keyword, options = {}) {
    throw new Error("Method 'search' must be implemented by Platform layer");
  }

  /**
   * 获取附近的 POI
   * @param {number} longitude - 经度
   * @param {number} latitude - 纬度
   * @param {number} [radius=100] - 半径（米）
   * @param {Object} [options] - 查询选项
   * @returns {Promise<POI[]>}
   */
  async findNearby(longitude, latitude, radius = 100, options = {}) {
    throw new Error("Method 'findNearby' must be implemented by Platform layer");
  }

  /**
   * 获取展品列表
   * @param {Object} [options] - 查询选项
   * @returns {Promise<POI[]>}
   */
  async findExhibits(options = {}) {
    return this.findByType("exhibit", options);
  }

  /**
   * 获取服务设施列表
   * @param {Object} [options] - 查询选项
   * @returns {Promise<POI[]>}
   */
  async findServices(options = {}) {
    return this.findByType("service", options);
  }

  /**
   * 获取设施列表
   * @param {Object} [options] - 查询选项
   * @returns {Promise<POI[]>}
   */
  async findFacilities(options = {}) {
    return this.findByType("facility", options);
  }
}
