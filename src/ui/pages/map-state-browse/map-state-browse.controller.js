/**
 * 地图浏览状态控制器
 * 处理地图浏览、楼层切换、POI 标记等功能
 */
import { BasePageController } from "@ui/controllers/base-page-controller.js";
import { initMap, getFloorList, getBestViewForPOIs, createPOIMarkers } from "@utils/map-utils.js";
import { loadPOIs, filterPOIsByFloor, getPopularPOIs } from "@utils/poi-utils.js";
import { getCurrentPosition } from "@utils/location-utils.js";
import { FloorSelector } from "@ui/components/floor-selector.js";
import { POICardList } from "@ui/components/poi-card.js";

/**
 * @class MapStateBrowseController
 * @extends BasePageController
 */
export class MapStateBrowseController extends BasePageController {
  /**
   * 创建地图浏览状态控制器实例
   * @param {Object} options - 配置选项
   */
  constructor(options) {
    super(options);
    this.pageName = "MapStateBrowse";

    /** @type {Object} 地图实例 */
    this.map = null;

    /** @type {Object} 地图配置 */
    this.mapConfig = null;

    /** @type {Array} 所有 POI 数据 */
    this.allPOIs = [];

    /** @type {Array} 当前楼层的 POI */
    this.currentFloorPOIs = [];

    /** @type {string} 当前楼层 */
    this.currentFloor = "0";

    /** @type {Array} 楼层列表 */
    this.floors = [];

    /** @type {FloorSelector} 楼层选择器组件 */
    this.floorSelectorComponent = null;

    /** @type {POICardList} POI 列表组件 */
    this.poiListComponent = null;

    /** @type {Object} 用户当前位置 */
    this.userLocation = null;

    /** @type {Array} POI 标记 */
    this.poiMarkers = [];
  }

  /**
   * 页面创建时调用
   * @param {Object} params - 页面参数
   */
  async onCreate(params) {
    await super.onCreate(params);
    console.log("[MapStateBrowse] Creating with params:", params);

    // 加载地图数据
    await this.loadMapData();

    // 渲染页面
    this.render();
  }

  /**
   * 页面显示时调用
   */
  async onShow() {
    await super.onShow();
    console.log("[MapStateBrowse] Showing");

    // 初始化地图
    this.initMapInstance();

    // 初始化组件
    this.initComponents();

    // 绑定事件
    this.bindEvents();

    // 获取用户位置
    this.getUserLocation();

    // 更新 POI 标记
    this.updatePOIMarkers();
  }

  /**
   * 页面隐藏时调用
   */
  async onHide() {
    await super.onHide();
    console.log("[MapStateBrowse] Hiding");

    // 解绑事件
    this.unbindEvents();

    // 停止定位
    this.stopLocationWatch();
  }

  /**
   * 页面销毁时调用
   */
  async onDestroy() {
    await super.onDestroy();
    console.log("[MapStateBrowse] Destroying");

    // 清理组件
    if (this.floorSelectorComponent) {
      this.floorSelectorComponent.unmount();
      this.floorSelectorComponent = null;
    }

    if (this.poiListComponent) {
      this.poiListComponent.unmount();
      this.poiListComponent = null;
    }

    // 清理地图
    this.destroyMap();

    // 清理数据
    this.map = null;
    this.allPOIs = [];
    this.currentFloorPOIs = [];
    this.poiMarkers = [];
  }

  /**
   * 加载地图数据
   */
  async loadMapData() {
    try {
      // 加载 POI 数据
      this.allPOIs = await loadPOIs({});
      console.log("[MapStateBrowse] 加载 POI 数据成功:", this.allPOIs.length);

      // 获取楼层列表
      this.floors = this.extractFloorsFromPOIs(this.allPOIs);
      console.log("[MapStateBrowse] 楼层列表:", this.floors);

      // 设置默认楼层
      this.currentFloor = "0";

      // 筛选当前楼层的 POI
      this.currentFloorPOIs = filterPOIsByFloor(this.allPOIs, this.currentFloor);
      console.log("[MapStateBrowse] 当前楼层 POI 数量:", this.currentFloorPOIs.length);
    } catch (error) {
      console.error("[MapStateBrowse] Load data error:", error);
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
   * 渲染页面
   */
  render() {
    const container = this.getContainer();
    if (!container) return;

    const html = `
      <div class="map-state-browse">
        <div class="map-container" id="mapContainer"></div>
        
        <div class="map-controls">
          <div class="floor-selector-container" id="floorSelectorContainer"></div>
          
          <div class="map-control-buttons">
            <button class="map-control-btn" id="locateUserBtn" title="定位">
              📍
            </button>
            <button class="map-control-btn" id="zoomInBtn" title="放大">
              ＋
            </button>
            <button class="map-control-btn" id="zoomOutBtn" title="缩小">
              －
            </button>
          </div>
        </div>
        
        <div class="poi-list-panel" id="poiListPanel">
          <div class="poi-list-header">
            <h3>热门地点</h3>
            <button class="poi-list-close" id="closePoiListBtn">✕</button>
          </div>
          <div class="poi-list-content" id="poiListContent"></div>
        </div>
        
        <button class="toggle-poi-list-btn" id="togglePoiListBtn">
          📍 查看地点
        </button>
      </div>
    `;

    this.setHtml(container, html);
  }

  /**
   * 初始化地图实例
   */
  initMapInstance() {
    const mapContainer = this.$("#mapContainer");
    if (!mapContainer) {
      console.error("[MapStateBrowse] Map container not found");
      return;
    }

    // 初始化地图配置
    this.mapConfig = initMap("mapContainer", {
      center: [113.324529, 23.099082],
      zoom: 16,
    });

    console.log("[MapStateBrowse] 地图配置:", this.mapConfig);

    // TODO: 这里应该初始化实际的地图实例
    // 例如：this.map = new MapLibreGL.Map(this.mapConfig);

    // 模拟地图加载完成
    setTimeout(() => {
      console.log("[MapStateBrowse] 地图加载完成");
      this.onMapLoaded();
    }, 500);
  }

  /**
   * 地图加载完成后调用
   */
  onMapLoaded() {
    // 设置最佳视图
    this.setBestView();

    // 添加 POI 标记
    this.updatePOIMarkers();
  }

  /**
   * 设置最佳视图
   */
  setBestView() {
    if (!this.currentFloorPOIs || this.currentFloorPOIs.length === 0) {
      return;
    }

    const view = getBestViewForPOIs(this.currentFloorPOIs);
    console.log("[MapStateBrowse] 设置最佳视图:", view);

    // TODO: 设置地图视图
    // this.map.flyTo({ center: view.center, zoom: view.zoom });
  }

  /**
   * 初始化组件
   */
  initComponents() {
    // 初始化楼层选择器
    const floorSelectorContainer = this.$("#floorSelectorContainer");
    if (floorSelectorContainer) {
      this.floorSelectorComponent = new FloorSelector({
        floors: this.floors,
        currentFloor: this.currentFloor,
        vertical: true,
        onFloorChange: (floor) => {
          this.handleFloorChange(floor);
        },
      });

      this.floorSelectorComponent.mount(floorSelectorContainer);
    }

    // 初始化 POI 列表
    this.updatePOIList();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 定位按钮
    const locateBtn = this.$("#locateUserBtn");
    if (locateBtn) {
      this.addEventListener(locateBtn, "click", () => {
        this.getUserLocation();
      });
    }

    // 放大按钮
    const zoomInBtn = this.$("#zoomInBtn");
    if (zoomInBtn) {
      this.addEventListener(zoomInBtn, "click", () => {
        this.zoomIn();
      });
    }

    // 缩小按钮
    const zoomOutBtn = this.$("#zoomOutBtn");
    if (zoomOutBtn) {
      this.addEventListener(zoomOutBtn, "click", () => {
        this.zoomOut();
      });
    }

    // 切换 POI 列表按钮
    const toggleBtn = this.$("#togglePoiListBtn");
    if (toggleBtn) {
      this.addEventListener(toggleBtn, "click", () => {
        this.togglePOIList();
      });
    }

    // 关闭 POI 列表按钮
    const closeBtn = this.$("#closePoiListBtn");
    if (closeBtn) {
      this.addEventListener(closeBtn, "click", () => {
        this.hidePOIList();
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
   * 处理楼层变化
   * @param {string} floor - 新楼层
   */
  handleFloorChange(floor) {
    console.log("[MapStateBrowse] 楼层变化:", floor);
    this.currentFloor = floor;

    // 筛选当前楼层的 POI
    this.currentFloorPOIs = filterPOIsByFloor(this.allPOIs, floor);
    console.log("[MapStateBrowse] 新楼层 POI 数量:", this.currentFloorPOIs.length);

    // 更新 POI 标记
    this.updatePOIMarkers();

    // 更新 POI 列表
    this.updatePOIList();

    // 设置最佳视图
    this.setBestView();
  }

  /**
   * 更新 POI 标记
   */
  updatePOIMarkers() {
    if (!this.map) {
      console.warn("[MapStateBrowse] 地图未初始化");
      return;
    }

    // 清除旧标记
    this.clearPOIMarkers();

    // 创建新标记
    const markers = createPOIMarkers(this.currentFloorPOIs, {
      showLabel: true,
      clickable: true,
    });

    console.log("[MapStateBrowse] 创建 POI 标记:", markers.length);

    // TODO: 添加标记到地图
    // markers.forEach(markerConfig => {
    //   const marker = new Marker(markerConfig);
    //   marker.addTo(this.map);
    //   this.poiMarkers.push(marker);
    // });

    this.poiMarkers = markers;
  }

  /**
   * 清除 POI 标记
   */
  clearPOIMarkers() {
    // TODO: 从地图移除标记
    // this.poiMarkers.forEach(marker => marker.remove());
    this.poiMarkers = [];
  }

  /**
   * 更新 POI 列表
   */
  updatePOIList() {
    const poiListContent = this.$("#poiListContent");
    if (!poiListContent) return;

    // 获取热门 POI
    const popularPOIs = getPopularPOIs(this.currentFloorPOIs, this.userLocation?.coordinate, 10);

    if (this.poiListComponent) {
      this.poiListComponent.unmount();
    }

    this.poiListComponent = new POICardList({
      pois: popularPOIs,
      showDistance: true,
      currentLocation: this.userLocation?.coordinate,
      onPOIClick: (poi) => {
        this.handlePOIClick(poi);
      },
    });

    this.poiListComponent.mount(poiListContent);
  }

  /**
   * 获取用户位置
   */
  async getUserLocation() {
    try {
      console.log("[MapStateBrowse] 获取用户位置...");
      this.userLocation = await getCurrentPosition();
      console.log("[MapStateBrowse] 用户位置:", this.userLocation);

      // 更新地图中心
      this.centerOnUserLocation();

      // 更新 POI 列表
      this.updatePOIList();
    } catch (error) {
      console.error("[MapStateBrowse] 获取用户位置失败:", error);
      alert("获取位置失败，请检查定位权限");
    }
  }

  /**
   * 停止定位监听
   */
  stopLocationWatch() {
    // TODO: 停止定位监听
    if (this.locationWatchUnsubscribe) {
      this.locationWatchUnsubscribe();
      this.locationWatchUnsubscribe = null;
    }
  }

  /**
   * 将地图中心设置为用户位置
   */
  centerOnUserLocation() {
    if (!this.userLocation || !this.map) {
      return;
    }

    const center = this.userLocation.coordinate;
    console.log("[MapStateBrowse] 设置地图中心为用户位置:", center);

    // TODO: 设置地图中心
    // this.map.flyTo({ center });
  }

  /**
   * 放大地图
   */
  zoomIn() {
    console.log("[MapStateBrowse] 放大");
    // TODO: 实现放大
    // if (this.map) {
    //   this.map.zoomIn();
    // }
  }

  /**
   * 缩小地图
   */
  zoomOut() {
    console.log("[MapStateBrowse] 缩小");
    // TODO: 实现缩小
    // if (this.map) {
    //   this.map.zoomOut();
    // }
  }

  /**
   * 切换 POI 列表显示
   */
  togglePOIList() {
    const panel = this.$("#poiListPanel");
    if (panel) {
      panel.classList.toggle("show");
    }
  }

  /**
   * 显示 POI 列表
   */
  showPOIList() {
    const panel = this.$("#poiListPanel");
    if (panel) {
      panel.classList.add("show");
    }
  }

  /**
   * 隐藏 POI 列表
   */
  hidePOIList() {
    const panel = this.$("#poiListPanel");
    if (panel) {
      panel.classList.remove("show");
    }
  }

  /**
   * 处理 POI 点击
   * @param {Object} poi - POI 数据
   */
  handlePOIClick(poi) {
    console.log("[MapStateBrowse] POI clicked:", poi);
    this.navigateTo("POIDetailPage", { poiId: poi.id || poi.poi_id });
  }

  /**
   * 销毁地图
   */
  destroyMap() {
    // TODO: 销毁地图实例
    // if (this.map) {
    //   this.map.remove();
    //   this.map = null;
    // }
  }

  /**
   * 导出页面状态
   */
  toJSON() {
    return {
      ...super.toJSON(),
      currentFloor: this.currentFloor,
      poiCount: this.currentFloorPOIs.length,
      markerCount: this.poiMarkers.length,
      hasUserLocation: !!this.userLocation,
    };
  }
}

/**
 * 创建并注册地图浏览状态控制器
 * @param {Object} options - 配置选项
 * @returns {MapStateBrowseController}
 */
export function createMapStateBrowse(options = {}) {
  return new MapStateBrowseController(options);
}

/**
 * 注册地图浏览状态控制器到全局
 * @param {Object} options - 配置选项
 */
export async function registerMapStateBrowse(_options = {}) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("MapStateBrowse", MapStateBrowseController);
}
