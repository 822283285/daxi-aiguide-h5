/**
 * Navigation 领域模型
 * @description 定义导航相关的核心业务实体
 */

/**
 * 导航状态枚举
 */
export const NavigationStatus = {
  IDLE: "idle", // 空闲
  PLANNING: "planning", // 规划中
  NAVIGATING: "navigating", // 导航中
  PAUSED: "paused", // 暂停
  COMPLETED: "completed", // 已完成
  CANCELLED: "cancelled", // 已取消
};

/**
 * 导航模式枚举
 */
export const NavigationMode = {
  WALKING: "walking", // 步行
  AR: "ar", // AR 导航
  MAP: "map", // 地图导航
};

/**
 * 导航指令
 */
export class NavigationInstruction {
  constructor(data) {
    this.id = data.id || "";
    this.type = data.type || "straight"; // straight, turn_left, turn_right, arrive, etc.
    this.text = data.text || ""; // 指令文本
    this.distance = data.distance || 0; // 到下一个指令的距离（米）
    this.duration = data.duration || 0; // 预计耗时（秒）
    this.location = data.location || null; // 指令位置 {lng, lat, floor}
    this.icon = data.icon || ""; // 指令图标
    this.metadata = data.metadata || {};
  }

  /**
   * 获取 formatted 距离
   * @returns {string}
   */
  getFormattedDistance() {
    if (this.distance >= 100) {
      return `${(this.distance / 100).toFixed(1)}百米`;
    }
    return `${Math.round(this.distance)}米`;
  }

  /**
   * 转换为纯对象
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      text: this.text,
      distance: this.distance,
      duration: this.duration,
      location: this.location,
      icon: this.icon,
      metadata: this.metadata,
    };
  }

  /**
   * 从对象创建实例
   * @param {Object} data
   * @returns {NavigationInstruction}
   */
  static from(data) {
    return new NavigationInstruction(data);
  }
}

/**
 * 导航会话
 */
export class NavigationSession {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.route = data.route || null; // 关联的路线
    this.status = data.status || NavigationStatus.IDLE;
    this.mode = data.mode || NavigationMode.WALKING;
    this.currentPosition = data.currentPosition || null; // 当前位置 {lng, lat, floor}
    this.currentInstruction = data.currentInstruction || null; // 当前指令
    this.instructions = data.instructions || []; // 所有指令
    this.progress = data.progress || 0; // 进度 0-100
    this.startedAt = data.startedAt || null;
    this.completedAt = data.completedAt || null;
    this.metadata = data.metadata || {};
  }

  /**
   * 生成会话 ID
   * @returns {string}
   */
  generateId() {
    return `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 开始导航
   */
  start() {
    if (this.status === NavigationStatus.NAVIGATING) {
      return false;
    }
    this.status = NavigationStatus.NAVIGATING;
    this.startedAt = new Date().toISOString();
    return true;
  }

  /**
   * 暂停导航
   */
  pause() {
    if (this.status !== NavigationStatus.NAVIGATING) {
      return false;
    }
    this.status = NavigationStatus.PAUSED;
    return true;
  }

  /**
   * 恢复导航
   */
  resume() {
    if (this.status !== NavigationStatus.PAUSED) {
      return false;
    }
    this.status = NavigationStatus.NAVIGATING;
    return true;
  }

  /**
   * 取消导航
   */
  cancel() {
    if (
      this.status === NavigationStatus.COMPLETED ||
      this.status === NavigationStatus.CANCELLED
    ) {
      return false;
    }
    this.status = NavigationStatus.CANCELLED;
    return true;
  }

  /**
   * 完成导航
   */
  complete() {
    if (this.status !== NavigationStatus.NAVIGATING) {
      return false;
    }
    this.status = NavigationStatus.COMPLETED;
    this.completedAt = new Date().toISOString();
    return true;
  }

  /**
   * 更新当前位置
   * @param {Object} position - 位置 {lng, lat, floor}
   */
  updatePosition(position) {
    this.currentPosition = position;
    this.updateProgress();
    this.updateCurrentInstruction();
  }

  /**
   * 更新进度
   * @private
   */
  updateProgress() {
    if (!this.route || !this.currentPosition) {
      return;
    }

    // 简化的进度计算（实际应该基于路径距离）
    const totalDistance = this.route.totalDistance || 1;
    // TODO: 计算已行走距离
    const traveledDistance = 0;
    this.progress = Math.min(100, Math.round((traveledDistance / totalDistance) * 100));
  }

  /**
   * 更新当前指令
   * @private
   */
  updateCurrentInstruction() {
    if (!this.instructions.length || !this.currentPosition) {
      return;
    }

    // TODO: 基于位置确定当前指令
    // 简化实现：获取第一个未完成的指令
    this.currentInstruction = this.instructions[0];
  }

  /**
   * 获取下一个指令
   * @returns {NavigationInstruction|null}
   */
  getNextInstruction() {
    if (!this.currentInstruction) {
      return null;
    }
    const index = this.instructions.indexOf(this.currentInstruction);
    return this.instructions[index + 1] || null;
  }

  /**
   * 检查是否到达目的地
   * @returns {boolean}
   */
  hasArrived() {
    return this.progress >= 100 || this.status === NavigationStatus.COMPLETED;
  }

  /**
   * 获取剩余距离
   * @returns {number}
   */
  getRemainingDistance() {
    if (!this.route) {
      return 0;
    }
    const totalDistance = this.route.totalDistance || 0;
    // TODO: 计算实际剩余距离
    return totalDistance;
  }

  /**
   * 获取剩余时间
   * @returns {number} 分钟
   */
  getRemainingTime() {
    if (!this.route || !this.startedAt) {
      return 0;
    }
    // TODO: 基于进度和已用时间计算
    return this.route.estimatedTime || 0;
  }

  /**
   * 转换为纯对象
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      route: this.route?.toJSON() || null,
      status: this.status,
      mode: this.mode,
      currentPosition: this.currentPosition,
      currentInstruction: this.currentInstruction?.toJSON() || null,
      instructions: this.instructions.map((i) => i.toJSON()),
      progress: this.progress,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      metadata: this.metadata,
    };
  }

  /**
   * 从对象创建实例
   * @param {Object} data
   * @returns {NavigationSession}
   */
  static from(data) {
    return new NavigationSession(data);
  }
}
