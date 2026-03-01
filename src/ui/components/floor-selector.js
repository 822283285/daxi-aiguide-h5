/**
 * 楼层选择器组件
 * 用于选择和切换楼层
 *
 * @class FloorSelector
 * @extends BaseComponent
 */
import { BaseComponent } from "./base-component.js";
import { getFloorList, getFloorName } from "../../utils/map-utils.js";

export class FloorSelector extends BaseComponent {
  /**
   * 创建楼层选择器组件
   * @param {Object} options - 配置选项
   * @param {Array} [options.floors=[]] - 楼层列表
   * @param {string} [options.currentFloor='0'] - 当前楼层
   * @param {boolean} [options.vertical=true] - 垂直布局
   * @param {Function} [options.onFloorChange] - 楼层变化回调
   */
  constructor(options = {}) {
    super(options);
    this.componentName = "FloorSelector";

    this.floors = getFloorList(options.floors || []);
    this.currentFloor = options.currentFloor || "0";
    this.vertical = options.vertical !== false;
    this.onFloorChange = options.onFloorChange || null;

    this.isExpanded = false;
  }

  /**
   * 渲染组件
   * @returns {string} HTML 字符串
   */
  render() {
    const layoutClass = this.vertical ? "floor-selector-vertical" : "floor-selector-horizontal";
    const currentFloorName = getFloorName(this.currentFloor);

    return `
      <div class="floor-selector ${layoutClass}">
        ${this.vertical ? this.renderVertical(currentFloorName) : this.renderHorizontal(currentFloorName)}
      </div>
    `;
  }

  /**
   * 渲染垂直布局
   * @param {string} currentFloorName - 当前楼层名称
   * @returns {string} HTML 字符串
   */
  renderVertical(currentFloorName) {
    const floorButtons = this.floors
      .sort((a, b) => {
        // 按楼层值排序 (高楼层在上)
        return parseInt(b.value) - parseInt(a.value);
      })
      .map((floor) => {
        const isActive = String(floor.value) === String(this.currentFloor);
        return `
          <button 
            class="floor-button ${isActive ? "active" : ""}" 
            data-floor="${floor.value}"
            title="${floor.name}"
          >
            ${floor.name}
          </button>
        `;
      })
      .join("");

    return `
      <div class="floor-selector-toggle">
        <button class="floor-selector-current" id="floorSelectorCurrent">
          <span class="floor-selector-label">楼层</span>
          <span class="floor-selector-value">${currentFloorName}</span>
          <span class="floor-selector-arrow">${this.isExpanded ? "▲" : "▼"}</span>
        </button>
      </div>
      <div class="floor-selector-dropdown ${this.isExpanded ? "show" : ""}" id="floorSelectorDropdown">
        ${floorButtons}
      </div>
    `;
  }

  /**
   * 渲染水平布局
   * @param {string} currentFloorName - 当前楼层名称
   * @returns {string} HTML 字符串
   */
  renderHorizontal(currentFloorName) {
    const floorButtons = this.floors
      .sort((a, b) => {
        return parseInt(b.value) - parseInt(a.value);
      })
      .map((floor) => {
        const isActive = String(floor.value) === String(this.currentFloor);
        return `
          <button 
            class="floor-button ${isActive ? "active" : ""}" 
            data-floor="${floor.value}"
          >
            ${floor.name}
          </button>
        `;
      })
      .join("");

    return `
      <div class="floor-selector-bar">
        ${floorButtons}
      </div>
    `;
  }

  /**
   * 组件挂载后调用
   */
  onMount() {
    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 垂直布局：切换按钮
    if (this.vertical) {
      const toggleBtn = this.$("#floorSelectorCurrent");
      if (toggleBtn) {
        this.addEventListener(toggleBtn, "click", () => {
          this.toggleDropdown();
        });
      }

      // 点击外部关闭下拉菜单
      this.addEventListener(document, "click", (e) => {
        const selector = this.$(".floor-selector");
        if (selector && !selector.contains(e.target)) {
          this.closeDropdown();
        }
      });
    }

    // 楼层按钮点击
    const floorButtons = this.$$(".floor-button");
    floorButtons.forEach((btn) => {
      this.addEventListener(btn, "click", (e) => {
        const floor = e.currentTarget.dataset.floor;
        this.selectFloor(floor);
      });
    });
  }

  /**
   * 切换下拉菜单
   */
  toggleDropdown() {
    this.isExpanded = !this.isExpanded;
    this.rerender();
  }

  /**
   * 关闭下拉菜单
   */
  closeDropdown() {
    this.isExpanded = false;
    this.rerender();
  }

  /**
   * 选择楼层
   * @param {string} floor - 楼层值
   */
  selectFloor(floor) {
    if (String(floor) === String(this.currentFloor)) {
      if (this.vertical) {
        this.closeDropdown();
      }
      return;
    }

    this.currentFloor = String(floor);

    if (this.onFloorChange) {
      this.onFloorChange(floor);
    }

    if (this.vertical) {
      this.closeDropdown();
    } else {
      this.rerender();
    }
  }

  /**
   * 更新楼层列表
   * @param {Array} floors - 新楼层列表
   */
  updateFloors(floors) {
    this.floors = getFloorList(floors);
    this.rerender();
  }

  /**
   * 设置当前楼层
   * @param {string} floor - 楼层值
   */
  setCurrentFloor(floor) {
    this.currentFloor = String(floor);
    this.rerender();
  }

  /**
   * 获取当前楼层
   * @returns {string} 当前楼层
   */
  getCurrentFloor() {
    return this.currentFloor;
  }

  /**
   * 上一楼层
   */
  previousFloor() {
    const currentIndex = this.floors.findIndex((f) => String(f.value) === String(this.currentFloor));
    if (currentIndex > 0) {
      this.selectFloor(this.floors[currentIndex - 1].value);
    }
  }

  /**
   * 下一楼层
   */
  nextFloor() {
    const currentIndex = this.floors.findIndex((f) => String(f.value) === String(this.currentFloor));
    if (currentIndex >= 0 && currentIndex < this.floors.length - 1) {
      this.selectFloor(this.floors[currentIndex + 1].value);
    }
  }
}

/**
 * 创建楼层选择器组件
 * @param {Object} options - 配置选项
 * @returns {FloorSelector}
 */
export function createFloorSelector(options = {}) {
  return new FloorSelector(options);
}

/**
 * 默认导出
 */
export default {
  FloorSelector,
  createFloorSelector,
};
