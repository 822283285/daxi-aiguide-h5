/**
 * 地图 POI 状态控制器
 * 处理 POI 列表、POI 搜索等功能
 */
import { BasePageController } from "@ui/controllers/base-page-controller.js";
import { loadPOIs, searchPOIs, filterPOIsByCategory, filterPOIsByFloor, groupPOIsByCategory } from "@utils/poi-utils.js";
import { getFloorList } from "@utils/map-utils.js";
import { POICardList } from "@ui/components/poi-card.js";
import { FloorSelector } from "@ui/components/floor-selector.js";
import { SearchBox } from "@ui/components/search-box.js";

/**
 * @class MapStatePOIController
 * @extends BasePageController
 */
export class MapStatePOIController extends BasePageController {
  /**
   * 创建地图 POI 状态控制器实例
   * @param {Object} options - 配置选项
   */
  constructor(options) {
    super(options);
    this.pageName = "MapStatePOI";

    /** @type {Array} 所有 POI 数据 */
    this.allPOIs = [];

    /** @type {Array} 当前显示的 POI */
    this.displayPOIs = [];

    /** @type {string} 当前楼层 */
    this.currentFloor = "0";

    /** @type {string} 当前分类 */
    this.currentCategory = "all";

    /** @type {string} 搜索关键词 */
    this.searchKeyword = "";

    /** @type {Array} 楼层列表 */
    this.floors = [];

    /** @type {Array} 分类列表 */
    this.categories = [];

    /** @type {FloorSelector} 楼层选择器组件 */
    this.floorSelectorComponent = null;

    /** @type {POICardList} POI 卡片列表组件 */
    this.poiCardListComponent = null;

    /** @type {SearchBox} 搜索框组件 */
    this.searchBoxComponent = null;
  }

  /**
   * 页面创建时调用
   * @param {Object} params - 页面参数
   */
  async onCreate(params) {
    await super.onCreate(params);
    console.log("[MapStatePOI] Creating with params:", params);

    // 加载 POI 数据
    await this.loadPOIData();

    // 渲染页面
    this.render();
  }

  /**
   * 页面显示时调用
   */
  async onShow() {
    await super.onShow();
    console.log("[MapStatePOI] Showing");

    // 初始化组件
    this.initComponents();

    // 绑定事件
    this.bindEvents();

    // 更新 POI 列表
    this.updatePOIList();
  }

  /**
   * 页面隐藏时调用
   */
  async onHide() {
    await super.onHide();
    console.log("[MapStatePOI] Hiding");

    // 解绑事件
    this.unbindEvents();
  }

  /**
   * 页面销毁时调用
   */
  async onDestroy() {
    await super.onDestroy();
    console.log("[MapStatePOI] Destroying");

    // 清理组件
    if (this.floorSelectorComponent) {
      this.floorSelectorComponent.unmount();
      this.floorSelectorComponent = null;
    }

    if (this.poiCardListComponent) {
      this.poiCardListComponent.unmount();
      this.poiCardListComponent = null;
    }

    if (this.searchBoxComponent) {
      this.searchBoxComponent.unmount();
      this.searchBoxComponent = null;
    }

    // 清理数据
    this.allPOIs = [];
    this.displayPOIs = [];
  }

  /**
   * 加载 POI 数据
   */
  async loadPOIData() {
    try {
      // 加载 POI 数据
      this.allPOIs = await loadPOIs({});
      console.log("[MapStatePOI] 加载 POI 数据成功:", this.allPOIs.length);

      // 提取楼层列表
      this.floors = this.extractFloorsFromPOIs(this.allPOIs);

      // 提取分类列表
      this.categories = this.extractCategoriesFromPOIs(this.allPOIs);

      // 设置默认值
      this.currentFloor = "0";
      this.currentCategory = "all";
    } catch (error) {
      console.error("[MapStatePOI] Load data error:", error);
    }
  }

  /**
   * 从 POI 数据中提取楼层列表
   * @param {Array} pois - POI 列表
   * @returns {Array} 楼层列表
   */
  extractFloorsFromPOIs(pois) {
    const floorSet = new Set();
    pois.forEach((poi) => {
      if (poi.floor) {
        floorSet.add(String(poi.floor));
      }
    });

    if (floorSet.size === 0) {
      return [];
    }

    return Array.from(floorSet).map((floor) => ({
      value: floor,
      name: this.getFloorName(floor),
    }));
  }

  /**
   * 获取楼层名称
   * @param {string} floor - 楼层值
   * @returns {string} 楼层名称
   */
  getFloorName(floor) {
    const floorNames = {
      "-2": "B2",
      "-1": "B1",
      "0": "L1",
      "1": "L2",
      "2": "L3",
      "3": "L4",
      "4": "L5",
      "5": "L6",
    };
    return floorNames[floor] || `L${parseInt(floor) + 1}`;
  }

  /**
   * 从 POI 数据中提取分类列表
   * @param {Array} pois - POI 列表
   * @returns {Array} 分类列表
   */
  extractCategoriesFromPOIs(pois) {
    const categorySet = new Set();
    pois.forEach((poi) => {
      if (poi.category) {
        categorySet.add(poi.category);
      }
    });

    return Array.from(categorySet).map((category) => ({
      value: category,
      name: this.getCategoryName(category),
    }));
  }

  /**
   * 获取分类名称
   * @param {string} category - 分类
   * @returns {string} 分类名称
   */
  getCategoryName(category) {
    const categoryNames = {
      exhibit: "展品",
      facility: "设施",
      service: "服务",
      entrance: "入口",
      exit: "出口",
      elevator: "电梯",
      stairs: "楼梯",
      restroom: "洗手间",
      cafe: "咖啡厅",
      shop: "商店",
      parking: "停车场",
      default: "其他",
    };
    return categoryNames[category] || category;
  }

  /**
   * 渲染页面
   */
  render() {
    const container = this.getContainer();
    if (!container) return;

    const html = `
      <div class="map-state-poi">
        <div class="poi-header">
          <div class="poi-back" id="poiBackBtn">
            <span class="back-icon">←</span>
            <span class="back-text">返回</span>
          </div>
          <h1 class="poi-title">景点导览</h1>
          <div class="poi-spacer"></div>
        </div>
        
        <div class="poi-search-container" id="poiSearchContainer"></div>
        
        <div class="poi-filters">
          <div class="filter-item">
            <span class="filter-label">楼层</span>
            <div class="filter-selector" id="floorFilterContainer"></div>
          </div>
          <div class="filter-item">
            <span class="filter-label">分类</span>
            <div class="filter-selector" id="categoryFilterContainer"></div>
          </div>
        </div>
        
        <div class="poi-list-container">
          <div class="poi-list-header">
            <h3>
              ${this.displayPOIs.length}个地点
              ${this.searchKeyword ? ` - "${this.searchKeyword}"` : ""}
            </h3>
          </div>
          <div class="poi-list-content" id="poiListContent"></div>
        </div>
      </div>
    `;

    this.setHtml(container, html);
  }

  /**
   * 初始化组件
   */
  initComponents() {
    // 初始化搜索框
    const searchContainer = this.$("#poiSearchContainer");
    if (searchContainer) {
      this.searchBoxComponent = new SearchBox({
        placeholder: "搜索景点、设施...",
        onSearch: (keyword) => {
          this.handleSearch(keyword);
        },
        onInputChange: (keyword) => {
          this.handleSearchInput(keyword);
        },
        onClear: () => {
          this.handleSearchClear();
        },
      });

      this.searchBoxComponent.mount(searchContainer);
    }

    // 初始化楼层选择器
    const floorFilterContainer = this.$("#floorFilterContainer");
    if (floorFilterContainer) {
      this.floorSelectorComponent = new FloorSelector({
        floors: this.floors,
        currentFloor: this.currentFloor,
        vertical: false,
        onFloorChange: (floor) => {
          this.handleFloorChange(floor);
        },
      });

      this.floorSelectorComponent.mount(floorFilterContainer);
    }

    // 初始化分类选择器
    this.initCategoryFilter();

    // 初始化 POI 列表
    this.updatePOIList();
  }

  /**
   * 初始化分类筛选
   */
  initCategoryFilter() {
    const categoryFilterContainer = this.$("#categoryFilterContainer");
    if (!categoryFilterContainer) return;

    const categories = [
      { value: "all", name: "全部" },
      ...this.categories,
    ];

    const html = `
      <div class="category-filter">
        ${categories
          .map(
            (cat) => `
          <button 
            class="category-btn ${cat.value === this.currentCategory ? "active" : ""}" 
            data-category="${cat.value}"
          >
            ${cat.name}
          </button>
        `
          )
          .join("")}
      </div>
    `;

    this.setHtml(categoryFilterContainer, html);

    // 绑定分类按钮事件
    const categoryBtns = this.$$(".category-btn");
    categoryBtns.forEach((btn) => {
      this.addEventListener(btn, "click", (e) => {
        const category = e.currentTarget.dataset.category;
        this.handleCategoryChange(category);
      });
    });
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 返回按钮
    const backBtn = this.$("#poiBackBtn");
    if (backBtn) {
      this.addEventListener(backBtn, "click", () => {
        this.back();
      });
    }
  }

  /**
   * 解绑事件
   */
  unbindEvents() {
    // 事件会自动清理
  }

  /**
   * 处理搜索
   * @param {string} keyword - 搜索关键词
   */
  handleSearch(keyword) {
    console.log("[MapStatePOI] 搜索:", keyword);
    this.searchKeyword = keyword;
    this.filterPOIs();
  }

  /**
   * 处理搜索输入
   * @param {string} keyword - 搜索关键词
   */
  handleSearchInput(keyword) {
    // 实时搜索 (可选)
    // this.searchKeyword = keyword;
    // this.filterPOIs();
  }

  /**
   * 处理搜索清除
   */
  handleSearchClear() {
    this.searchKeyword = "";
    this.filterPOIs();
  }

  /**
   * 处理楼层变化
   * @param {string} floor - 新楼层
   */
  handleFloorChange(floor) {
    console.log("[MapStatePOI] 楼层变化:", floor);
    this.currentFloor = floor;
    this.filterPOIs();
  }

  /**
   * 处理分类变化
   * @param {string} category - 新分类
   */
  handleCategoryChange(category) {
    console.log("[MapStatePOI] 分类变化:", category);
    this.currentCategory = category;

    // 更新按钮状态
    const categoryBtns = this.$$(".category-btn");
    categoryBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.category === category);
    });

    this.filterPOIs();
  }

  /**
   * 筛选 POI
   */
  filterPOIs() {
    let filtered = [...this.allPOIs];

    // 按楼层筛选
    if (this.currentFloor && this.currentFloor !== "all") {
      filtered = filterPOIsByFloor(filtered, this.currentFloor);
    }

    // 按分类筛选
    if (this.currentCategory && this.currentCategory !== "all") {
      filtered = filterPOIsByCategory(filtered, this.currentCategory);
    }

    // 按关键词搜索
    if (this.searchKeyword && this.searchKeyword.trim()) {
      filtered = searchPOIs(filtered, this.searchKeyword.trim());
    }

    this.displayPOIs = filtered;
    console.log("[MapStatePOI] 筛选后 POI 数量:", this.displayPOIs.length);

    // 更新 POI 列表
    this.updatePOIList();
  }

  /**
   * 更新 POI 列表
   */
  updatePOIList() {
    const poiListContent = this.$("#poiListContent");
    if (!poiListContent) return;

    if (this.poiCardListComponent) {
      this.poiCardListComponent.unmount();
    }

    if (this.displayPOIs.length === 0) {
      this.setHtml(poiListContent, '<div class="poi-list-empty">暂无符合条件的 POI</div>');
      return;
    }

    this.poiCardListComponent = new POICardList({
      pois: this.displayPOIs,
      showDistance: false,
      showCategory: true,
      onPOIClick: (poi) => {
        this.handlePOIClick(poi);
      },
    });

    this.poiCardListComponent.mount(poiListContent);
  }

  /**
   * 处理 POI 点击
   * @param {Object} poi - POI 数据
   */
  handlePOIClick(poi) {
    console.log("[MapStatePOI] POI clicked:", poi);
    this.navigateTo("POIDetailPage", { poiId: poi.id || poi.poi_id });
  }

  /**
   * 导出页面状态
   */
  toJSON() {
    return {
      ...super.toJSON(),
      totalPOICount: this.allPOIs.length,
      displayPOICount: this.displayPOIs.length,
      currentFloor: this.currentFloor,
      currentCategory: this.currentCategory,
      searchKeyword: this.searchKeyword,
    };
  }
}

/**
 * 创建并注册地图 POI 状态控制器
 * @param {Object} options - 配置选项
 * @returns {MapStatePOIController}
 */
export function createMapStatePOI(options = {}) {
  return new MapStatePOIController(options);
}

/**
 * 注册地图 POI 状态控制器到全局
 * @param {Object} options - 配置选项
 */
export async function registerMapStatePOI(_options = {}) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("MapStatePOI", MapStatePOIController);
}
