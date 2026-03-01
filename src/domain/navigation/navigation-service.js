/**
 * Navigation 领域服务
 * @description 提供导航相关的核心业务逻辑
 */

import {
  NavigationSession,
  NavigationInstruction,
  NavigationStatus,
  NavigationMode,
} from "./navigation-models.js";

/**
 * 导航服务接口（由 Platform 层实现）
 */
export class NavigationService {
  constructor(options = {}) {
    this.session = null;
    this.listeners = new Map();
    this.options = options;
  }

  /**
   * 创建导航会话
   * @param {Object} route - 路线对象
   * @param {Object} options - 导航选项
   * @returns {NavigationSession}
   */
  createSession(route, options = {}) {
    this.session = new NavigationSession({
      route,
      mode: options.mode || NavigationMode.WALKING,
      metadata: options.metadata || {},
    });
    return this.session;
  }

  /**
   * 获取当前导航会话
   * @returns {NavigationSession|null}
   */
  getCurrentSession() {
    return this.session;
  }

  /**
   * 开始导航
   * @returns {boolean}
   */
  startNavigation() {
    if (!this.session) {
      console.warn("[NavigationService] No active session");
      return false;
    }
    const result = this.session.start();
    if (result) {
      this.emit("start", this.session);
    }
    return result;
  }

  /**
   * 暂停导航
   * @returns {boolean}
   */
  pauseNavigation() {
    if (!this.session) {
      return false;
    }
    const result = this.session.pause();
    if (result) {
      this.emit("pause", this.session);
    }
    return result;
  }

  /**
   * 恢复导航
   * @returns {boolean}
   */
  resumeNavigation() {
    if (!this.session) {
      return false;
    }
    const result = this.session.resume();
    if (result) {
      this.emit("resume", this.session);
    }
    return result;
  }

  /**
   * 取消导航
   * @returns {boolean}
   */
  cancelNavigation() {
    if (!this.session) {
      return false;
    }
    const result = this.session.cancel();
    if (result) {
      this.emit("cancel", this.session);
      this.session = null;
    }
    return result;
  }

  /**
   * 完成导航
   * @returns {boolean}
   */
  completeNavigation() {
    if (!this.session) {
      return false;
    }
    const result = this.session.complete();
    if (result) {
      this.emit("complete", this.session);
    }
    return result;
  }

  /**
   * 更新位置
   * @param {Object} position - 位置 {lng, lat, floor}
   */
  updatePosition(position) {
    if (!this.session || this.session.status !== NavigationStatus.NAVIGATING) {
      return;
    }
    this.session.updatePosition(position);
    this.emit("positionUpdate", {
      position,
      session: this.session,
      instruction: this.session.currentInstruction,
    });
  }

  /**
   * 生成导航指令
   * @param {Object} route - 路线对象
   * @returns {NavigationInstruction[]}
   */
  generateInstructions(route) {
    // 默认实现：基于路线路径点生成简单指令
    const instructions = [];
    const waypoints = route?.waypoints || [];

    waypoints.forEach((wp, index) => {
      const instruction = new NavigationInstruction({
        id: `inst_${index}`,
        type: index === 0 ? "start" : index === waypoints.length - 1 ? "arrive" : "straight",
        text: this.getInstructionText(wp, index, waypoints.length),
        distance: 0, // TODO: 计算距离
        location: {
          lng: wp.longitude || wp.lng,
          lat: wp.latitude || wp.lat,
          floor: wp.floor,
        },
      });
      instructions.push(instruction);
    });

    return instructions;
  }

  /**
   * 获取指令文本
   * @private
   */
  getInstructionText(waypoint, index, total) {
    if (index === 0) {
      return "开始导航";
    }
    if (index === total - 1) {
      return "已到达目的地";
    }
    return `途经点 ${index + 1}`;
  }

  /**
   * 注册事件监听器
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (!this.listeners.has(event)) {
      return;
    }
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * 触发事件
   * @private
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      return;
    }
    this.listeners.get(event).forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[NavigationService] Event listener error for ${event}:`, error);
      }
    });
  }

  /**
   * 清除所有监听器
   */
  clearListeners() {
    this.listeners.clear();
  }

  /**
   * 获取导航状态文本
   * @param {string} status - 状态码
   * @returns {string}
   */
  static getStatusText(status) {
    const statusMap = {
      [NavigationStatus.IDLE]: "空闲",
      [NavigationStatus.PLANNING]: "规划中",
      [NavigationStatus.NAVIGATING]: "导航中",
      [NavigationStatus.PAUSED]: "已暂停",
      [NavigationStatus.COMPLETED]: "已完成",
      [NavigationStatus.CANCELLED]: "已取消",
    };
    return statusMap[status] || "未知";
  }

  /**
   * 获取导航模式文本
   * @param {string} mode - 模式码
   * @returns {string}
   */
  static getModeText(mode) {
    const modeMap = {
      [NavigationMode.WALKING]: "步行导航",
      [NavigationMode.AR]: "AR 导航",
      [NavigationMode.MAP]: "地图导航",
    };
    return modeMap[mode] || "未知";
  }
}

// 重新导出模型
export { NavigationSession, NavigationInstruction, NavigationStatus, NavigationMode };
