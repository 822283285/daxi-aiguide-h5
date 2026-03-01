/**
 * POI 领域模型
 * @description 定义 POI（兴趣点）的核心业务实体
 */

export class POI {
  constructor(data) {
    this.id = data.id || "";
    this.name = data.name || "";
    this.code = data.code || "";
    this.type = data.type || "poi"; // poi, exhibit, service, facility
    this.category = data.category || "";
    this.description = data.description || "";
    this.location = {
      longitude: data.longitude || 0,
      latitude: data.latitude || 0,
      floor: data.floor || 1,
      x: data.x || 0,
      y: data.y || 0,
    };
    this.media = {
      images: data.images || [],
      audio: data.audio || [],
      video: data.video || [],
    };
    this.metadata = data.metadata || {};
    this.status = data.status || "active"; // active, inactive, hidden
    this.sortOrder = data.sortOrder || 0;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  /**
   * 获取 POI 的显示名称
   * @returns {string}
   */
  getDisplayName() {
    return this.name || this.code || "未知 POI";
  }

  /**
   * 获取 POI 的完整坐标
   * @returns {Object} {lng, lat, floor}
   */
  getCoordinates() {
    return {
      lng: this.location.longitude,
      lat: this.location.latitude,
      floor: this.location.floor,
    };
  }

  /**
   * 获取 POI 的平面坐标（用于地图渲染）
   * @returns {Object} {x, y, floor}
   */
  getMapCoordinates() {
    return {
      x: this.location.x,
      y: this.location.y,
      floor: this.location.floor,
    };
  }

  /**
   * 检查 POI 是否可用
   * @returns {boolean}
   */
  isActive() {
    return this.status === "active";
  }

  /**
   * 获取 POI 的主要媒体资源
   * @returns {Object|null}
   */
  getMainMedia() {
    if (this.media.images?.length > 0) {
      return { type: "image", url: this.media.images[0] };
    }
    if (this.media.audio?.length > 0) {
      return { type: "audio", url: this.media.audio[0] };
    }
    if (this.media.video?.length > 0) {
      return { type: "video", url: this.media.video[0] };
    }
    return null;
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
      category: this.category,
      description: this.description,
      location: this.location,
      media: this.media,
      metadata: this.metadata,
      status: this.status,
      sortOrder: this.sortOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 从对象创建 POI 实例
   * @param {Object} data
   * @returns {POI}
   */
  static from(data) {
    return new POI(data);
  }

  /**
   * 从对象数组创建 POI 实例数组
   * @param {Array<Object>} dataList
   * @returns {POI[]}
   */
  static fromList(dataList) {
    return (dataList || []).map((data) => new POI(data));
  }
}
