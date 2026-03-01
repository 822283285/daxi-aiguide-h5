/**
 * POI 卡片组件
 * 用于展示 POI 信息卡片
 *
 * @class POICard
 * @extends BaseComponent
 */
import { BaseComponent } from "./base-component.js";
import { getPOIIcon, getPOICategoryName, getPOIDistanceText } from "../../utils/poi-utils.js";

export class POICard extends BaseComponent {
  /**
   * 创建 POI 卡片组件
   * @param {Object} options - 配置选项
   * @param {Object} options.poi - POI 数据
   * @param {boolean} [options.showDistance=false] - 显示距离
   * @param {boolean} [options.showCategory=true] - 显示分类
   * @param {boolean} [options.showImage=true] - 显示图片
   * @param {Function} [options.onClick] - 点击回调
   */
  constructor(options = {}) {
    super(options);
    this.componentName = "POICard";

    this.poi = options.poi || {};
    this.showDistance = options.showDistance || false;
    this.showCategory = options.showCategory !== false;
    this.showImage = options.showImage !== false;
    this.onClick = options.onClick || null;

    this.distance = options.distance || null;
  }

  /**
   * 渲染组件
   * @returns {string} HTML 字符串
   */
  render() {
    const poi = this.poi;
    const icon = poi.icon || getPOIIcon(poi.category);
    const categoryName = this.showCategory ? getPOICategoryName(poi.category) : "";
    const distanceText = this.showDistance && this.distance ? getPOIDistanceText(this.distance) : "";
    const imageUrl = this.showImage && poi.images && poi.images[0] ? poi.images[0] : null;

    return `
      <div class="poi-card" data-poi-id="${poi.id || poi.poi_id}">
        ${imageUrl ? `<div class="poi-card-image"><img src="${imageUrl}" alt="${poi.name}" /></div>` : ""}
        <div class="poi-card-content">
          <div class="poi-card-header">
            <span class="poi-card-icon">${icon}</span>
            <h3 class="poi-card-title">${poi.name || poi.title}</h3>
          </div>
          ${poi.description ? `<p class="poi-card-description">${this.truncateText(poi.description, 50)}</p>` : ""}
          <div class="poi-card-footer">
            ${categoryName ? `<span class="poi-card-category">${categoryName}</span>` : ""}
            ${distanceText ? `<span class="poi-card-distance">${distanceText}</span>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 组件挂载后调用
   */
  onMount() {
    if (this.onClick) {
      const card = this.$(".poi-card");
      if (card) {
        this.addEventListener(card, "click", () => {
          this.onClick(this.poi);
        });
      }
    }
  }

  /**
   * 更新 POI 数据
   * @param {Object} poi - 新 POI 数据
   */
  updatePOI(poi) {
    this.update({ poi }, {});
  }

  /**
   * 更新距离
   * @param {number} distance - 新距离
   */
  updateDistance(distance) {
    this.distance = distance;
    this.rerender();
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
      poiId: this.poi.id || this.poi.poi_id,
      poiName: this.poi.name,
    };
  }
}

/**
 * POI 卡片列表组件
 * 用于展示多个 POI 卡片
 *
 * @class POICardList
 * @extends BaseComponent
 */
export class POICardList extends BaseComponent {
  /**
   * 创建 POI 卡片列表组件
   * @param {Object} options - 配置选项
   * @param {Array} [options.pois=[]] - POI 列表
   * @param {boolean} [options.showDistance=false] - 显示距离
   * @param {Function} [options.onPOIClick] - POI 点击回调
   */
  constructor(options = {}) {
    super(options);
    this.componentName = "POICardList";

    this.pois = options.pois || [];
    this.showDistance = options.showDistance || false;
    this.onPOIClick = options.onPOIClick || null;
    this.currentLocation = options.currentLocation || null;
  }

  /**
   * 渲染组件
   * @returns {string} HTML 字符串
   */
  render() {
    if (!this.pois || this.pois.length === 0) {
      return '<div class="poi-card-list-empty">暂无 POI 数据</div>';
    }

    const cards = this.pois
      .map((poi) => {
        const distance = this.currentLocation
          ? this.calculateDistance(this.currentLocation, poi)
          : null;

        const card = new POICard({
          poi,
          showDistance: this.showDistance,
          distance,
          onClick: this.onPOIClick,
        });

        return card.render();
      })
      .join("");

    return `<div class="poi-card-list">${cards}</div>`;
  }

  /**
   * 计算距离
   * @param {Array} location - 位置 [lng, lat]
   * @param {Object} poi - POI 对象
   * @returns {number|null} 距离
   */
  calculateDistance(location, poi) {
    if (!poi.location) {
      return null;
    }

    const poiLocation = Array.isArray(poi.location)
      ? poi.location
      : [poi.location.lng, poi.location.lat];

    const [lng1, lat1] = location;
    const [lng2, lat2] = poiLocation;

    const R = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 角度转弧度
   * @param {number} deg - 角度
   * @returns {number} 弧度
   */
  toRad(deg) {
    return (deg * Math.PI) / 180;
  }

  /**
   * 更新 POI 列表
   * @param {Array} pois - 新 POI 列表
   */
  updatePOIs(pois) {
    this.update({ pois }, {});
  }

  /**
   * 更新当前位置
   * @param {Array} location - 新位置 [lng, lat]
   */
  updateLocation(location) {
    this.currentLocation = location;
    this.rerender();
  }
}

/**
 * 创建 POI 卡片组件
 * @param {Object} options - 配置选项
 * @returns {POICard}
 */
export function createPOICard(options = {}) {
  return new POICard(options);
}

/**
 * 创建 POI 卡片列表组件
 * @param {Object} options - 配置选项
 * @returns {POICardList}
 */
export function createPOICardList(options = {}) {
  return new POICardList(options);
}

/**
 * 默认导出
 */
export default {
  POICard,
  POICardList,
  createPOICard,
  createPOICardList,
};
