/**
 * 路线卡片组件
 * 用于展示路线信息卡片
 *
 * @class RouteCard
 * @extends BaseComponent
 */
import { BaseComponent } from "./base-component.js";
import { formatRouteDistance, formatRouteDuration } from "../../utils/route-utils.js";

export class RouteCard extends BaseComponent {
  /**
   * 创建路线卡片组件
   * @param {Object} options - 配置选项
   * @param {Object} options.route - 路线数据
   * @param {boolean} [options.showWaypoints=true] - 显示途经点
   * @param {boolean} [options.showDescription=true] - 显示描述
   * @param {Function} [options.onClick] - 点击回调
   */
  constructor(options = {}) {
    super(options);
    this.componentName = "RouteCard";

    this.route = options.route || {};
    this.showWaypoints = options.showWaypoints !== false;
    this.showDescription = options.showDescription !== false;
    this.onClick = options.onClick || null;
  }

  /**
   * 渲染组件
   * @returns {string} HTML 字符串
   */
  render() {
    const route = this.route;
    const icon = route.icon || "🗺️";
    const color = route.color || "#1890ff";
    const distanceText = formatRouteDistance(route.distance);
    const durationText = formatRouteDuration(route.duration);
    const waypointsCount = route.waypoints ? route.waypoints.length : 0;

    return `
      <div class="route-card" data-route-id="${route.id}" style="border-left: 4px solid ${color}">
        <div class="route-card-header">
          <span class="route-card-icon">${icon}</span>
          <h3 class="route-card-title">${route.name || route.title}</h3>
        </div>
        
        ${this.showDescription && route.description ? `<p class="route-card-description">${this.truncateText(route.description, 80)}</p>` : ""}
        
        <div class="route-card-info">
          <div class="route-card-info-item">
            <span class="route-card-info-label">距离</span>
            <span class="route-card-info-value">${distanceText}</span>
          </div>
          <div class="route-card-info-item">
            <span class="route-card-info-label">预计时间</span>
            <span class="route-card-info-value">${durationText}</span>
          </div>
          ${this.showWaypoints ? `<div class="route-card-info-item">
            <span class="route-card-info-label">途经点</span>
            <span class="route-card-info-value">${waypointsCount}个</span>
          </div>` : ""}
        </div>
        
        ${this.showWaypoints && route.waypoints && route.waypoints.length > 0 ? `
          <div class="route-card-waypoints">
            ${route.waypoints.slice(0, 3).map((wp, index) => `<div class="route-card-waypoint">
              <span class="route-card-waypoint-index">${index + 1}</span>
              <span class="route-card-waypoint-name">${wp.name || `途经点${index + 1}`}</span>
            </div>`).join("")}
            ${waypointsCount > 3 ? `<div class="route-card-waypoints-more">还有${waypointsCount - 3}个途经点...</div>` : ""}
          </div>
        ` : ""}
      </div>
    `;
  }

  /**
   * 组件挂载后调用
   */
  onMount() {
    if (this.onClick) {
      const card = this.$(".route-card");
      if (card) {
        this.addEventListener(card, "click", () => {
          this.onClick(this.route);
        });
      }
    }
  }

  /**
   * 更新路线数据
   * @param {Object} route - 新路线数据
   */
  updateRoute(route) {
    this.update({ route }, {});
  }

  /**
   * 截断文本
   * @param {string} text - 文本
   * @param {number} maxLength - 最大长度
   * @returns {string} 截断后的文本
   */
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + "...";
  }

  /**
   * 导出组件状态
   */
  toJSON() {
    return {
      ...super.toJSON(),
      routeId: this.route.id,
      routeName: this.route.name,
    };
  }
}

/**
 * 路线卡片列表组件
 * 用于展示多个路线卡片
 *
 * @class RouteCardList
 * @extends BaseComponent
 */
export class RouteCardList extends BaseComponent {
  /**
   * 创建路线卡片列表组件
   * @param {Object} options - 配置选项
   * @param {Array} [options.routes=[]] - 路线列表
   * @param {boolean} [options.showWaypoints=true] - 显示途经点
   * @param {Function} [options.onRouteClick] - 路线点击回调
   */
  constructor(options = {}) {
    super(options);
    this.componentName = "RouteCardList";

    this.routes = options.routes || [];
    this.showWaypoints = options.showWaypoints !== false;
    this.onRouteClick = options.onRouteClick || null;
  }

  /**
   * 渲染组件
   * @returns {string} HTML 字符串
   */
  render() {
    if (!this.routes || this.routes.length === 0) {
      return '<div class="route-card-list-empty">暂无路线数据</div>';
    }

    const cards = this.routes
      .map((route) => {
        const card = new RouteCard({
          route,
          showWaypoints: this.showWaypoints,
          onClick: this.onRouteClick,
        });

        return card.render();
      })
      .join("");

    return `<div class="route-card-list">${cards}</div>`;
  }

  /**
   * 更新路线列表
   * @param {Array} routes - 新路线列表
   */
  updateRoutes(routes) {
    this.update({ routes }, {});
  }
}

/**
 * 创建路线卡片组件
 * @param {Object} options - 配置选项
 * @returns {RouteCard}
 */
export function createRouteCard(options = {}) {
  return new RouteCard(options);
}

/**
 * 创建路线卡片列表组件
 * @param {Object} options - 配置选项
 * @returns {RouteCardList}
 */
export function createRouteCardList(options = {}) {
  return new RouteCardList(options);
}

/**
 * 默认导出
 */
export default {
  RouteCard,
  RouteCardList,
  createRouteCard,
  createRouteCardList,
};
