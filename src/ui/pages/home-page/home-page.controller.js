/**
 * 首页控制器
 * 应用的主入口页面
 */
import { BasePageController } from "@ui/controllers/base-page-controller.js";
import { getPageConfig } from "@api/modules/home.js";
import { getRecommendedPOIs, loadPOIs } from "@utils/poi-utils.js";
import { POICardList } from "@ui/components/poi-card.js";

/**
 * @class HomePageController
 * @extends BasePageController
 */
export class HomePageController extends BasePageController {
  /**
   * 创建首页控制器实例
   * @param {Object} options - 配置选项
   */
  constructor(options) {
    super(options);
    this.pageName = "HomePage";

    /** @type {Array} 轮播图数据 */
    this.bannerData = [];

    /** @type {Array} 推荐 POI 数据 */
    this.recommendedPOIs = [];

    /** @type {Array} 所有 POI 数据 */
    this.allPOIs = [];

    /** @type {POICardList} POI 卡片列表组件 */
    this.poiCardListComponent = null;

    /** @type {Object} 首页配置 */
    this.pageConfig = null;
  }

  /**
   * 页面创建时调用
   * @param {Object} params - 页面参数
   */
  async onCreate(params) {
    await super.onCreate(params);
    console.log("[HomePage] Creating with params:", params);

    // 加载首页数据
    await this.loadHomeData();

    // 渲染页面
    this.render();
  }

  /**
   * 页面显示时调用
   */
  async onShow() {
    await super.onShow();
    console.log("[HomePage] Showing");

    // 绑定事件
    this.bindEvents();

    // 初始化组件
    this.initComponents();

    // 刷新数据
    this.refreshData();

    // 启动轮播图
    this.startBannerAutoPlay();
  }

  /**
   * 页面隐藏时调用
   */
  async onHide() {
    await super.onHide();
    console.log("[HomePage] Hiding");

    // 解绑事件
    this.unbindEvents();

    // 停止轮播图
    this.stopBannerAutoPlay();
  }

  /**
   * 页面销毁时调用
   */
  async onDestroy() {
    await super.onDestroy();
    console.log("[HomePage] Destroying");

    // 清理组件
    if (this.poiCardListComponent) {
      this.poiCardListComponent.unmount();
      this.poiCardListComponent = null;
    }

    // 清理数据
    this.bannerData = [];
    this.recommendedPOIs = [];
    this.allPOIs = [];
    this.pageConfig = null;
  }

  /**
   * 加载首页数据
   */
  async loadHomeData() {
    try {
      // 加载首页配置
      try {
        this.pageConfig = await getPageConfig({});
        console.log("[HomePage] 加载首页配置成功:", this.pageConfig);

        // 提取轮播图数据
        if (this.pageConfig.banners) {
          this.bannerData = this.pageConfig.banners;
        }
      } catch (error) {
        console.warn("[HomePage] 加载首页配置失败，使用默认数据:", error);
        // 使用默认轮播图
        this.bannerData = this.getDefaultBanners();
      }

      // 加载 POI 数据
      this.allPOIs = await loadPOIs({});
      console.log("[HomePage] 加载 POI 数据成功:", this.allPOIs.length);

      // 获取推荐 POI
      this.recommendedPOIs = getRecommendedPOIs(this.allPOIs, 10);
      console.log("[HomePage] 推荐 POI 数量:", this.recommendedPOIs.length);

      console.log("[HomePage] Data loaded");
    } catch (error) {
      console.error("[HomePage] Load data error:", error);
    }
  }

  /**
   * 获取默认轮播图
   * @returns {Array} 默认轮播图数据
   */
  getDefaultBanners() {
    return [
      {
        id: "banner1",
        title: "欢迎参观",
        image: "https://via.placeholder.com/800x400?text=Banner+1",
        link: "",
      },
      {
        id: "banner2",
        title: "精彩展览",
        image: "https://via.placeholder.com/800x400?text=Banner+2",
        link: "",
      },
      {
        id: "banner3",
        title: "特色服务",
        image: "https://via.placeholder.com/800x400?text=Banner+3",
        link: "",
      },
    ];
  }

  /**
   * 刷新数据
   */
  refreshData() {
    // 刷新轮播图
    this.updateBanner();

    // 刷新推荐 POI
    this.updateRecommendedPOIs();
  }

  /**
   * 更新轮播图
   */
  updateBanner() {
    const bannerContainer = this.$(".home-banner");
    if (bannerContainer && this.bannerData.length > 0) {
      const bannerHTML = this.renderBanner();
      this.setHtml(bannerContainer, bannerHTML);

      // 初始化轮播图
      this.initBanner();
    }
  }

  /**
   * 渲染轮播图
   * @returns {string} 轮播图 HTML
   */
  renderBanner() {
    if (!this.bannerData || this.bannerData.length === 0) {
      return "";
    }

    const banners = this.bannerData
      .map((banner, index) => {
        return `
          <div class="banner-item ${index === 0 ? "active" : ""}" data-banner-id="${banner.id}">
            <img src="${banner.image}" alt="${banner.title}" />
            ${banner.title ? `<div class="banner-title">${banner.title}</div>` : ""}
          </div>
        `;
      })
      .join("");

    const indicators =
      this.bannerData.length > 1
        ? `
          <div class="banner-indicators">
            ${this.bannerData
              .map((_, index) => `<span class="banner-indicator ${index === 0 ? "active" : ""}" data-index="${index}"></span>`)
              .join("")}
          </div>
        `
        : "";

    const arrows =
      this.bannerData.length > 1
        ? `
          <button class="banner-arrow banner-prev">‹</button>
          <button class="banner-arrow banner-next">›</button>
        `
        : "";

    return `
      <div class="banner-container">
        <div class="banner-wrapper">
          ${banners}
        </div>
        ${indicators}
        ${arrows}
      </div>
    `;
  }

  /**
   * 初始化轮播图
   */
  initBanner() {
    this.currentBannerIndex = 0;
    this.bannerAutoPlayTimer = null;

    // 绑定指示器点击事件
    const indicators = this.$$(".banner-indicator");
    indicators.forEach((indicator) => {
      this.addEventListener(indicator, "click", (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this.goToBanner(index);
      });
    });

    // 绑定箭头点击事件
    const prevBtn = this.$(".banner-prev");
    const nextBtn = this.$(".banner-next");

    if (prevBtn) {
      this.addEventListener(prevBtn, "click", () => {
        this.prevBanner();
      });
    }

    if (nextBtn) {
      this.addEventListener(nextBtn, "click", () => {
        this.nextBanner();
      });
    }
  }

  /**
   * 启动轮播图自动播放
   */
  startBannerAutoPlay() {
    if (this.bannerData.length <= 1) {
      return;
    }

    this.stopBannerAutoPlay();

    this.bannerAutoPlayTimer = setInterval(() => {
      this.nextBanner();
    }, 5000);
  }

  /**
   * 停止轮播图自动播放
   */
  stopBannerAutoPlay() {
    if (this.bannerAutoPlayTimer) {
      clearInterval(this.bannerAutoPlayTimer);
      this.bannerAutoPlayTimer = null;
    }
  }

  /**
   * 切换到指定轮播图
   * @param {number} index - 索引
   */
  goToBanner(index) {
    if (index < 0 || index >= this.bannerData.length || index === this.currentBannerIndex) {
      return;
    }

    const items = this.$$(".banner-item");
    const indicators = this.$$(".banner-indicator");

    if (items[this.currentBannerIndex]) {
      items[this.currentBannerIndex].classList.remove("active");
    }

    if (indicators[this.currentBannerIndex]) {
      indicators[this.currentBannerIndex].classList.remove("active");
    }

    this.currentBannerIndex = index;

    if (items[this.currentBannerIndex]) {
      items[this.currentBannerIndex].classList.add("active");
    }

    if (indicators[this.currentBannerIndex]) {
      indicators[this.currentBannerIndex].classList.add("active");
    }
  }

  /**
   * 上一个轮播图
   */
  prevBanner() {
    const newIndex = (this.currentBannerIndex - 1 + this.bannerData.length) % this.bannerData.length;
    this.goToBanner(newIndex);
  }

  /**
   * 下一个轮播图
   */
  nextBanner() {
    const newIndex = (this.currentBannerIndex + 1) % this.bannerData.length;
    this.goToBanner(newIndex);
  }

  /**
   * 更新推荐 POI
   */
  updateRecommendedPOIs() {
    const poiContainer = this.$(".poi-list");
    if (poiContainer && this.recommendedPOIs.length > 0) {
      // 创建 POI 卡片列表组件
      if (this.poiCardListComponent) {
        this.poiCardListComponent.unmount();
      }

      this.poiCardListComponent = new POICardList({
        pois: this.recommendedPOIs,
        showDistance: false,
        onPOIClick: (poi) => {
          this.handlePOIClick(poi);
        },
      });

      this.poiCardListComponent.mount(poiContainer);
    }
  }

  /**
   * 渲染页面
   */
  render() {
    const container = this.getContainer();
    if (!container) return;

    const html = `
      <div class="home-page">
        <header class="home-header">
          <div class="search-bar" id="homeSearchBar">
            <span class="search-icon">🔍</span>
            <span class="search-text">搜索景点、路线</span>
          </div>
        </header>
        
        <div class="home-banner">
          <!-- 轮播图 -->
        </div>
        
        <div class="quick-actions">
          <div class="action-item" data-action="map">
            <span class="icon">🗺️</span>
            <span class="text">地图</span>
          </div>
          <div class="action-item" data-action="route">
            <span class="icon">🚶</span>
            <span class="text">路线</span>
          </div>
          <div class="action-item" data-action="service">
            <span class="icon">🎧</span>
            <span class="text">客服</span>
          </div>
          <div class="action-item" data-action="profile">
            <span class="icon">👤</span>
            <span class="text">我的</span>
          </div>
        </div>
        
        <div class="recommended-pois">
          <h3>热门推荐</h3>
          <div class="poi-list">
            <!-- POI 列表 -->
          </div>
        </div>
      </div>
    `;

    this.setHtml(container, html);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 快捷操作点击事件
    const actionItems = this.$$(".quick-actions .action-item");
    actionItems.forEach((item) => {
      this.addEventListener(item, "click", (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // 搜索栏点击事件
    const searchBar = this.$("#homeSearchBar");
    if (searchBar) {
      this.addEventListener(searchBar, "click", () => {
        this.navigateTo("MapStateSearch");
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
   * 处理快捷操作
   * @param {string} action - 操作类型
   */
  handleQuickAction(action) {
    const pageMap = {
      map: "MapStateBrowse",
      route: "MapStateRoute",
      service: "ServicePage",
      profile: "ProfilePage",
    };

    const targetPage = pageMap[action];
    if (targetPage) {
      this.navigateTo(targetPage);
    }
  }

  /**
   * 处理 POI 点击
   * @param {Object} poi - POI 数据
   */
  handlePOIClick(poi) {
    console.log("[HomePage] POI clicked:", poi);
    this.navigateTo("POIDetailPage", { poiId: poi.id || poi.poi_id });
  }

  /**
   * 初始化组件
   */
  initComponents() {
    // POI 卡片列表组件在 updateRecommendedPOIs 中初始化
  }

  /**
   * 导出页面状态
   */
  toJSON() {
    return {
      ...super.toJSON(),
      bannerCount: this.bannerData.length,
      poiCount: this.recommendedPOIs.length,
    };
  }
}

/**
 * 创建并注册首页控制器
 * @param {Object} options - 配置选项
 * @returns {HomePageController}
 */
export function createHomePage(options = {}) {
  return new HomePageController(options);
}

/**
 * 注册首页控制器到全局
 * @param {Object} options - 配置选项
 */
export async function registerHomePage(_options = {}) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("HomePage", HomePageController);
}
