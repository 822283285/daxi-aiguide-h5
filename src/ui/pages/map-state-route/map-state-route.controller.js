/**
 * 地图路线状态控制器
 * 处理路线规划、起点终点选择、路线展示等功能
 */
import { BasePageController } from "@ui/controllers/base-page-controller.js";
import { loadRoutes, planRoute, formatRouteDistance, formatRouteDuration } from "@utils/route-utils.js";
import { RouteCardList } from "@ui/components/route-card.js";
import { FloorSelector } from "@ui/components/floor-selector.js";

/**
 * @class MapStateRouteController
 * @extends BasePageController
 */
export class MapStateRouteController extends BasePageController {
  /**
   * 创建地图路线状态控制器实例
   * @param {Object} options - 配置选项
   */
  constructor(options) {
    super(options);
    this.pageName = "MapStateRoute";

    /** @type {Object} 地图实例 */
    this.map = null;

    /** @type {Array} 所有路线数据 */
    this.allRoutes = [];

    /** @type {Object} 规划的路线 */
    this.plannedRoute = null;

    /** @type {Object} 起点 */
    this.startPoint = null;

    /** @type {Object} 终点 */
    this.endPoint = null;

    /** @type {Array} 途经点 */
    this.waypoints = [];

    /** @type {string} 当前楼层 */
    this.currentFloor = "0";

    /** @type {Array} 楼层列表 */
    this.floors = [];

    /** @type {RouteCardList} 路线卡片列表组件 */
    this.routeCardListComponent = null;

    /** @type {FloorSelector} 楼层选择器组件 */
    this.floorSelectorComponent = null;

    /** @type {boolean} 是否在选择起点 */
    this.isSelectingStart = false;

    /** @type {boolean} 是否在选择终点 */
    this.isSelectingEnd = false;
  }

  /**
   * 页面创建时调用
   * @param {Object} params - 页面参数
   */
  async onCreate(params) {
    await super.onCreate(params);
    console.log("[MapStateRoute] Creating with params:", params);

    // 从参数中获取起点终点
    this.startPoint = params.startPoint || null;
    this.endPoint = params.endPoint || null;

    // 加载路线数据
    await this.loadRouteData();

    // 渲染页面
    this.render();
  }

  /**
   * 页面显示时调用
   */
  async onShow() {
    await super.onShow();
    console.log("[MapStateRoute] Showing");

    // 初始化地图
    this.initMapInstance();

    // 初始化组件
    this.initComponents();

    // 绑定事件
    this.bindEvents();

    // 如果有起点终点，立即规划路线
    if (this.startPoint && this.endPoint) {
      this.planRouteFromPoints();
    }
  }

  /**
   * 页面隐藏时调用
   */
  async onHide() {
    await super.onHide();
    console.log("[MapStateRoute] Hiding");

    // 解绑事件
    this.unbindEvents();
  }

  /**
   * 页面销毁时调用
   */
  async onDestroy() {
    await super.onDestroy();
    console.log("[MapStateRoute] Destroying");

    // 清理组件
    if (this.routeCardListComponent) {
      this.routeCardListComponent.unmount();
      this.routeCardListComponent = null;
    }

    if (this.floorSelectorComponent) {
      this.floorSelectorComponent.unmount();
      this.floorSelectorComponent = null;
    }

    // 清理地图
    this.destroyMap();

    // 清理数据
    this.map = null;
    this.allRoutes = [];
    this.plannedRoute = null;
  }

  /**
   * 加载路线数据
   */
  async loadRouteData() {
    try {
      // 加载推荐路线
      this.allRoutes = await loadRoutes({});
      console.log("[MapStateRoute] 加载路线数据成功:", this.allRoutes.length);

      // 提取楼层列表
      this.floors = this.extractFloorsFromRoutes(this.allRoutes);
    } catch (error) {
      console.error("[MapStateRoute] Load data error:", error);
    }
  }

  /**
   * 从路线数据中提取楼层列表
   * @param {Array} routes - 路线列表
   * @returns {Array} 楼层列表
   */
  extractFloorsFromRoutes(routes) {
    const floorSet = new Set();
    routes.forEach((route) => {
      if (route.floor) {
        floorSet.add(String(route.floor));
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

    const hasStart = !!this.startPoint;
    const hasEnd = !!this.endPoint;

    const html = `
      <div class="map-state-route">
        <div class="route-header">
          <div class="route-back" id="routeBackBtn">
            <span class="back-icon">←</span>
            <span class="back-text">返回</span>
          </div>
          <h1 class="route-title">路线规划</h1>
          <div class="route-spacer"></div>
        </div>
        
        <div class="route-input-panel">
          <div class="route-point-input ${!hasStart ? "active" : ""}" id="startPointInput">
            <span class="point-icon start">🟢</span>
            <input 
              type="text" 
              class="point-input" 
              placeholder="选择起点"
              value="${hasStart ? this.startPoint.name : ""}"
              readonly
            />
            ${hasStart ? '<button class="point-clear" id="clearStartBtn">✕</button>' : ""}
          </div>
          
          <div class="route-point-input ${!hasEnd ? "active" : ""}" id="endPointInput">
            <span class="point-icon end">🔴</span>
            <input 
              type="text" 
              class="point-input" 
              placeholder="选择终点"
              value="${hasEnd ? this.endPoint.name : ""}"
              readonly
            />
            ${hasEnd ? '<button class="point-clear" id="clearEndBtn">✕</button>' : ""}
          </div>
          
          <button class="route-plan-btn" id="planRouteBtn" ${!hasStart || !hasEnd ? "disabled" : ""}>
            规划路线
          </button>
        </div>
        
        <div class="map-container" id="mapContainer"></div>
        
        <div class="route-results-panel" id="routeResultsPanel">
          <div class="route-results-header">
            <h3>推荐路线</h3>
          </div>
          <div class="route-results-content" id="routeResultsContent"></div>
        </div>
        
        <div class="route-detail-panel" id="routeDetailPanel" style="display: none;">
          <div class="route-detail-header">
            <button class="route-detail-back" id="routeDetailBackBtn">← 返回</button>
            <h3>路线详情</h3>
          </div>
          <div class="route-detail-info" id="routeDetailInfo"></div>
          <button class="route-start-nav-btn" id="startNavBtn">开始导航</button>
        </div>
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
      console.error("[MapStateRoute] Map container not found");
      return;
    }

    // TODO: 初始化地图
    console.log("[MapStateRoute] 初始化地图...");

    // 模拟地图加载完成
    setTimeout(() => {
      console.log("[MapStateRoute] 地图加载完成");
    }, 500);
  }

  /**
   * 初始化组件
   */
  initComponents() {
    // 初始化路线列表
    this.updateRouteList();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 返回按钮
    const backBtn = this.$("#routeBackBtn");
    if (backBtn) {
      this.addEventListener(backBtn, "click", () => {
        this.back();
      });
    }

    // 起点输入框
    const startInput = this.$("#startPointInput");
    if (startInput) {
      this.addEventListener(startInput, "click", () => {
        this.startSelectPoint("start");
      });
    }

    // 终点输入框
    const endInput = this.$("#endPointInput");
    if (endInput) {
      this.addEventListener(endInput, "click", () => {
        this.startSelectPoint("end");
      });
    }

    // 清除起点
    const clearStartBtn = this.$("#clearStartBtn");
    if (clearStartBtn) {
      this.addEventListener(clearStartBtn, "click", () => {
        this.clearStartPoint();
      });
    }

    // 清除终点
    const clearEndBtn = this.$("#clearEndBtn");
    if (clearEndBtn) {
      this.addEventListener(clearEndBtn, "click", () => {
        this.clearEndPoint();
      });
    }

    // 规划路线按钮
    const planBtn = this.$("#planRouteBtn");
    if (planBtn) {
      this.addEventListener(planBtn, "click", () => {
        this.planRouteFromPoints();
      });
    }

    // 路线详情返回
    const detailBackBtn = this.$("#routeDetailBackBtn");
    if (detailBackBtn) {
      this.addEventListener(detailBackBtn, "click", () => {
        this.hideRouteDetail();
      });
    }

    // 开始导航
    const startNavBtn = this.$("#startNavBtn");
    if (startNavBtn) {
      this.addEventListener(startNavBtn, "click", () => {
        this.startNavigation();
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
   * 开始选择点
   * @param {string} type - 类型：start 或 end
   */
  startSelectPoint(type) {
    console.log("[MapStateRoute] 开始选择点:", type);

    if (type === "start") {
      this.isSelectingStart = true;
    } else {
      this.isSelectingEnd = true;
    }

    // 导航到地图选择页面
    this.navigateTo("MapStateBrowse", {
      selectMode: true,
      selectType: type,
    });
  }

  /**
   * 清除起点
   */
  clearStartPoint() {
    this.startPoint = null;
    this.plannedRoute = null;
    this.render();
    this.bindEvents();
  }

  /**
   * 清除终点
   */
  clearEndPoint() {
    this.endPoint = null;
    this.plannedRoute = null;
    this.render();
    this.bindEvents();
  }

  /**
   * 从起点终点规划路线
   */
  planRouteFromPoints() {
    if (!this.startPoint || !this.endPoint) {
      alert("请选择起点和终点");
      return;
    }

    console.log("[MapStateRoute] 规划路线:", this.startPoint, this.endPoint);

    // 创建途经点
    const waypoints = [
      this.startPoint.coordinate || [this.startPoint.lng, this.startPoint.lat],
      this.endPoint.coordinate || [this.endPoint.lng, this.endPoint.lat],
    ];

    // 规划路线
    const result = planRoute(waypoints, {
      type: "custom",
    });

    if (result.success) {
      this.plannedRoute = result.route;
      console.log("[MapStateRoute] 路线规划成功:", this.plannedRoute);

      // 显示路线详情
      this.showRouteDetail(this.plannedRoute);

      // 在地图上显示路线
      this.displayRouteOnMap(this.plannedRoute);
    } else {
      console.error("[MapStateRoute] 路线规划失败:", result.error);
      alert("路线规划失败：" + result.error);
    }
  }

  /**
   * 更新路线列表
   */
  updateRouteList() {
    const routeResultsContent = this.$("#routeResultsContent");
    if (!routeResultsContent) return;

    if (this.routeCardListComponent) {
      this.routeCardListComponent.unmount();
    }

    this.routeCardListComponent = new RouteCardList({
      routes: this.allRoutes.slice(0, 5),
      showWaypoints: true,
      onRouteClick: (route) => {
        this.handleRouteClick(route);
      },
    });

    this.routeCardListComponent.mount(routeResultsContent);
  }

  /**
   * 处理路线点击
   * @param {Object} route - 路线数据
   */
  handleRouteClick(route) {
    console.log("[MapStateRoute] 路线点击:", route);
    this.showRouteDetail(route);
    this.displayRouteOnMap(route);
  }

  /**
   * 显示路线详情
   * @param {Object} route - 路线数据
   */
  showRouteDetail(route) {
    const detailPanel = this.$("#routeDetailPanel");
    const detailInfo = this.$("#routeDetailInfo");

    if (!detailPanel || !detailInfo) return;

    const distanceText = formatRouteDistance(route.distance);
    const durationText = formatRouteDuration(route.duration);

    const html = `
      <div class="route-detail-summary">
        <div class="detail-item">
          <span class="detail-label">距离</span>
          <span class="detail-value">${distanceText}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">预计时间</span>
          <span class="detail-value">${durationText}</span>
        </div>
      </div>
      
      <div class="route-waypoints">
        <h4>途经点</h4>
        ${route.waypoints
          ? route.waypoints
              .map(
                (wp, index) => `
            <div class="waypoint-item">
              <span class="waypoint-index">${index + 1}</span>
              <span class="waypoint-name">${wp.name || `途经点${index + 1}`}</span>
            </div>
          `
              )
              .join("")
          : ""}
      </div>
    `;

    this.setHtml(detailInfo, html);
    detailPanel.style.display = "block";
  }

  /**
   * 隐藏路线详情
   */
  hideRouteDetail() {
    const detailPanel = this.$("#routeDetailPanel");
    if (detailPanel) {
      detailPanel.style.display = "none";
    }
  }

  /**
   * 在地图上显示路线
   * @param {Object} route - 路线数据
   */
  displayRouteOnMap(route) {
    console.log("[MapStateRoute] 在地图上显示路线:", route);

    // TODO: 在地图上绘制路线
    // if (this.map && route.path) {
    //   const line = new Polyline({
    //     path: route.path,
    //     color: route.color || "#1890ff",
    //     width: 4,
    //   });
    //   line.addTo(this.map);
    // }
  }

  /**
   * 开始导航
   */
  startNavigation() {
    if (!this.plannedRoute) {
      alert("请先规划路线");
      return;
    }

    console.log("[MapStateRoute] 开始导航:", this.plannedRoute);

    // 导航到导航状态
    this.navigateTo("MapStateNavi", {
      route: this.plannedRoute,
      startPoint: this.startPoint,
      endPoint: this.endPoint,
    });
  }

  /**
   * 从其他页面返回选择的点
   * @param {Object} point - 选择的点
   */
  onPointSelected(point) {
    console.log("[MapStateRoute] 收到选择的点:", point);

    if (this.isSelectingStart) {
      this.startPoint = point;
      this.isSelectingStart = false;
    } else if (this.isSelectingEnd) {
      this.endPoint = point;
      this.isSelectingEnd = false;
    }

    // 重新渲染
    this.render();
    this.bindEvents();

    // 如果起点终点都有了，自动规划路线
    if (this.startPoint && this.endPoint) {
      this.planRouteFromPoints();
    }
  }

  /**
   * 销毁地图
   */
  destroyMap() {
    // TODO: 销毁地图实例
  }

  /**
   * 导出页面状态
   */
  toJSON() {
    return {
      ...super.toJSON(),
      hasStartPoint: !!this.startPoint,
      hasEndPoint: !!this.endPoint,
      hasPlannedRoute: !!this.plannedRoute,
      routeCount: this.allRoutes.length,
    };
  }
}

/**
 * 创建并注册地图路线状态控制器
 * @param {Object} options - 配置选项
 * @returns {MapStateRouteController}
 */
export function createMapStateRoute(options = {}) {
  return new MapStateRouteController(options);
}

/**
 * 注册地图路线状态控制器到全局
 * @param {Object} options - 配置选项
 */
export async function registerMapStateRoute(_options = {}) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("MapStateRoute", MapStateRouteController);
}
