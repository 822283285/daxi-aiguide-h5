/**
 * 首页控制器
 * 应用的主入口页面
 */
import { BasePageController } from '../../controllers/base-page-controller.js';

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
    this.pageName = 'HomePage';
    
    /** @type {Array} 轮播图数据 */
    this.bannerData = [];
    
    /** @type {Array} 推荐 POI 数据 */
    this.recommendedPOIs = [];
  }

  /**
   * 页面创建时调用
   * @param {Object} params - 页面参数
   */
  async onCreate(params) {
    await super.onCreate(params);
    console.log('[HomePage] Creating with params:', params);
    
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
    console.log('[HomePage] Showing');
    
    // 绑定事件
    this.bindEvents();
    
    // 刷新数据
    this.refreshData();
  }

  /**
   * 页面隐藏时调用
   */
  async onHide() {
    await super.onHide();
    console.log('[HomePage] Hiding');
    
    // 解绑事件
    this.unbindEvents();
  }

  /**
   * 页面销毁时调用
   */
  async onDestroy() {
    await super.onDestroy();
    console.log('[HomePage] Destroying');
    
    // 清理数据
    this.bannerData = [];
    this.recommendedPOIs = [];
  }

  /**
   * 加载首页数据
   */
  async loadHomeData() {
    try {
      // TODO: 调用 API 加载数据
      // const response = await fetch('/api/home');
      // this.bannerData = response.banners;
      // this.recommendedPOIs = response.recommendedPOIs;
      
      console.log('[HomePage] Data loaded');
    } catch (error) {
      console.error('[HomePage] Load data error:', error);
    }
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
    const bannerContainer = this.$('.home-banner');
    if (bannerContainer && this.bannerData.length > 0) {
      // TODO: 渲染轮播图
      console.log('[HomePage] Banner updated');
    }
  }

  /**
   * 更新推荐 POI
   */
  updateRecommendedPOIs() {
    const poiContainer = this.$('.recommended-pois');
    if (poiContainer && this.recommendedPOIs.length > 0) {
      // TODO: 渲染推荐 POI
      console.log('[HomePage] POIs updated');
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
          <div class="search-bar" onclick="app.router.navigate('SearchPage')">
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
    const actionItems = this.$$('.quick-actions .action-item');
    actionItems.forEach(item => {
      this.addEventListener(item, 'click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // 搜索栏点击事件
    const searchBar = this.$('.search-bar');
    if (searchBar) {
      this.addEventListener(searchBar, 'click', () => {
        this.navigateTo('SearchPage');
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
      'map': 'MapStateBrowse',
      'route': 'MapStateRoute',
      'service': 'ServicePage',
      'profile': 'ProfilePage'
    };

    const targetPage = pageMap[action];
    if (targetPage) {
      this.navigateTo(targetPage);
    }
  }

  /**
   * 导出页面状态
   */
  toJSON() {
    return {
      ...super.toJSON(),
      bannerCount: this.bannerData.length,
      poiCount: this.recommendedPOIs.length
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
export function registerHomePage(options = {}) {
  const { registerPage } = await import('../../controllers/page-controller-registry.js');
  registerPage('HomePage', HomePageController);
}
