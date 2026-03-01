/**
 * Building 领域模型
 * @description 定义建筑/楼层相关的核心业务实体
 */

/**
 * 楼层信息
 */
export class Floor {
  constructor(data) {
    this.id = data.id || "";
    this.name = data.name || "";
    this.number = data.number || 1; // 楼层号
    this.altitude = data.altitude || 0; // 海拔高度（米）
    this.height = data.height || 0; // 层高（米）
    this.bounds = data.bounds || null; // 楼层边界 {minLng, maxLng, minLat, maxLat}
    this.mapUrl = data.mapUrl || ""; // 楼层地图 URL
    this.poiCount = data.poiCount || 0; // POI 数量
    this.metadata = data.metadata || {};
  }

  /**
   * 获取楼层显示名称
   * @returns {string}
   */
  getDisplayName() {
    if (this.name) {
      return this.name;
    }
    if (this.number > 0) {
      return `${this.number}层`;
    }
    if (this.number === 0) {
      return "地面层";
    }
    return `B${Math.abs(this.number)}层`;
  }

  /**
   * 检查是否为地下楼层
   * @returns {boolean}
   */
  isUnderground() {
    return this.number < 0;
  }

  /**
   * 检查坐标是否在楼层边界内
   * @param {number} lng - 经度
   * @param {number} lat - 纬度
   * @returns {boolean}
   */
  contains(lng, lat) {
    if (!this.bounds) {
      return false;
    }
    return (
      lng >= this.bounds.minLng &&
      lng <= this.bounds.maxLng &&
      lat >= this.bounds.minLat &&
      lat <= this.bounds.maxLat
    );
  }

  /**
   * 转换为纯对象
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      number: this.number,
      altitude: this.altitude,
      height: this.height,
      bounds: this.bounds,
      mapUrl: this.mapUrl,
      poiCount: this.poiCount,
      metadata: this.metadata,
    };
  }

  /**
   * 从对象创建实例
   * @param {Object} data
   * @returns {Floor}
   */
  static from(data) {
    return new Floor(data);
  }

  /**
   * 从对象数组创建实例数组
   * @param {Array<Object>} dataList
   * @returns {Floor[]}
   */
  static fromList(dataList) {
    return (dataList || []).map((data) => new Floor(data));
  }
}

/**
 * 建筑信息
 */
export class Building {
  constructor(data) {
    this.id = data.id || "";
    this.code = data.code || ""; // 建筑编码 (bdid)
    this.name = data.name || "";
    this.address = data.address || "";
    this.location = {
      longitude: data.longitude || 0,
      latitude: data.latitude || 0,
    };
    this.floors = data.floors || []; // Floor 数组
    this.defaultFloor = data.defaultFloor || 1; // 默认楼层
    this.metadata = data.metadata || {};
    this.status = data.status || "active"; // active, inactive
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  /**
   * 获取建筑显示名称
   * @returns {string}
   */
  getDisplayName() {
    return this.name || this.code || "未知建筑";
  }

  /**
   * 获取楼层数量
   * @returns {number}
   */
  getFloorCount() {
    return this.floors.length;
  }

  /**
   * 检查建筑是否可用
   * @returns {boolean}
   */
  isActive() {
    return this.status === "active";
  }

  /**
   * 根据楼层号获取楼层
   * @param {number} floorNumber - 楼层号
   * @returns {Floor|null}
   */
  getFloorByNumber(floorNumber) {
    return this.floors.find((f) => f.number === floorNumber) || null;
  }

  /**
   * 根据楼层 ID 获取楼层
   * @param {string} floorId - 楼层 ID
   * @returns {Floor|null}
   */
  getFloorById(floorId) {
    return this.floors.find((f) => f.id === floorId) || null;
  }

  /**
   * 获取所有楼层号（排序）
   * @returns {number[]}
   */
  getFloorNumbers() {
    return this.floors.map((f) => f.number).sort((a, b) => b - a);
  }

  /**
   * 获取地下楼层列表
   * @returns {Floor[]}
   */
  getUndergroundFloors() {
    return this.floors.filter((f) => f.isUnderground());
  }

  /**
   * 获取地上楼层列表
   * @returns {Floor[]}
   */
  getAbovegroundFloors() {
    return this.floors.filter((f) => f.number >= 0);
  }

  /**
   * 获取默认楼层
   * @returns {Floor|null}
   */
  getDefaultFloor() {
    return this.getFloorByNumber(this.defaultFloor) || this.floors[0] || null;
  }

  /**
   * 添加楼层
   * @param {Floor} floor
   */
  addFloor(floor) {
    // 移除已存在的同楼层号
    this.floors = this.floors.filter((f) => f.number !== floor.number);
    this.floors.push(floor);
    // 按楼层号降序排序
    this.floors.sort((a, b) => b.number - a.number);
  }

  /**
   * 移除楼层
   * @param {number|string} floorIdentifier - 楼层号或 ID
   * @returns {boolean}
   */
  removeFloor(floorIdentifier) {
    const index = this.floors.findIndex(
      (f) => f.number === floorIdentifier || f.id === floorIdentifier
    );
    if (index !== -1) {
      this.floors.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取建筑的边界框
   * @returns {Object|null}
   */
  getBounds() {
    if (this.floors.length === 0) {
      return null;
    }

    let minLng = Infinity,
      maxLng = -Infinity;
    let minLat = Infinity,
      maxLat = -Infinity;

    this.floors.forEach((floor) => {
      if (floor.bounds) {
        if (floor.bounds.minLng < minLng) minLng = floor.bounds.minLng;
        if (floor.bounds.maxLng > maxLng) maxLng = floor.bounds.maxLng;
        if (floor.bounds.minLat < minLat) minLat = floor.bounds.minLat;
        if (floor.bounds.maxLat > maxLat) maxLat = floor.bounds.maxLat;
      }
    });

    if (minLng === Infinity) {
      return null;
    }

    return { minLng, maxLng, minLat, maxLat };
  }

  /**
   * 转换为纯对象
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      address: this.address,
      location: this.location,
      floors: this.floors.map((f) => f.toJSON()),
      defaultFloor: this.defaultFloor,
      metadata: this.metadata,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 从对象创建实例
   * @param {Object} data
   * @returns {Building}
   */
  static from(data) {
    const building = new Building(data);
    if (data.floors) {
      building.floors = Floor.fromList(data.floors);
    }
    return building;
  }

  /**
   * 从对象数组创建实例数组
   * @param {Array<Object>} dataList
   * @returns {Building[]}
   */
  static fromList(dataList) {
    return (dataList || []).map((data) => Building.from(data));
  }
}

/**
 * 建筑服务（简化版，具体实现在 Platform 层）
 */
export class BuildingService {
  constructor() {
    this.currentBuilding = null;
  }

  /**
   * 设置当前建筑
   * @param {Building} building
   */
  setCurrentBuilding(building) {
    this.currentBuilding = building;
  }

  /**
   * 获取当前建筑
   * @returns {Building|null}
   */
  getCurrentBuilding() {
    return this.currentBuilding;
  }

  /**
   * 获取当前楼层
   * @returns {Floor|null}
   */
  getCurrentFloor() {
    if (!this.currentBuilding) {
      return null;
    }
    return this.currentBuilding.getDefaultFloor();
  }

  /**
   * 根据楼层号获取楼层
   * @param {number} floorNumber
   * @returns {Floor|null}
   */
  getFloor(floorNumber) {
    if (!this.currentBuilding) {
      return null;
    }
    return this.currentBuilding.getFloorByNumber(floorNumber);
  }

  /**
   * 获取所有楼层
   * @returns {Floor[]}
   */
  getAllFloors() {
    if (!this.currentBuilding) {
      return [];
    }
    return this.currentBuilding.floors;
  }

  /**
   * 获取楼层列表（按楼层号排序）
   * @returns {number[]}
   */
  getFloorNumbers() {
    if (!this.currentBuilding) {
      return [];
    }
    return this.currentBuilding.getFloorNumbers();
  }
}
