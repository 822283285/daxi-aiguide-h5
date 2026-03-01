/**
 * 地图搜索状态控制器
 * 处理搜索功能、搜索结果展示等
 */
import { BasePageController } from "@ui/controllers/base-page-controller.js";
import { loadPOIs, searchPOIs } from "@utils/poi-utils.js";
import { getHotWords } from "@api/modules/search.js";
import { POICardList } from "@ui/components/poi-card.js";
import { SearchBox } from "@ui/components/search-box.js";

/**
 * @class MapStateSearchController
 * @extends BasePageController
 */
export class MapStateSearchController extends BasePageController {
  /**
   * 创建地图搜索状态控制器实例
   * @param {Object} options - 配置选项
   */
  constructor(options) {
    super(options);
    this.pageName = "MapStateSearch";

    /** @type {Array} 所有 POI 数据 */
    this.allPOIs = [];

    /** @type {Array} 搜索结果 */
    this.searchResults = [];

    /** @type {string} 搜索关键词 */
    this.searchKeyword = "";

    /** @type {Array} 搜索历史 */
    this.searchHistory = [];

    /** @type {Array} 热门搜索词 */
    this.hotWords = [];

    /** @type {boolean} 是否正在搜索 */
    this.isSearching = false;

    /** @type {SearchBox} 搜索框组件 */
    this.searchBoxComponent = null;

    /** @type {POICardList} POI 卡片列表组件 */
    this.poiCardListComponent = null;
  }

  /**
   * 页面创建时调用
   * @param {Object} params - 页面参数
   */
  async onCreate(params) {
    await super.onCreate(params);
    console.log("[MapStateSearch] Creating with params:", params);

    // 获取初始关键词
    this.searchKeyword = params.keyword || "";

    // 加载数据
    await this.loadData();

    // 渲染页面
    this.render();
  }

  /**
   * 页面显示时调用
   */
  async onShow() {
    await super.onShow();
    console.log("[MapStateSearch] Showing");

    // 初始化组件
    this.initComponents();

    // 绑定事件
    this.bindEvents();

    // 如果有初始关键词，执行搜索
    if (this.searchKeyword) {
      this.performSearch(this.searchKeyword);
    }
  }

  /**
   * 页面隐藏时调用
   */
  async onHide() {
    await super.onHide();
    console.log("[MapStateSearch] Hiding");

    // 解绑事件
    this.unbindEvents();
  }

  /**
   * 页面销毁时调用
   */
  async onDestroy() {
    await super.onDestroy();
    console.log("[MapStateSearch] Destroying");

    // 清理组件
    if (this.searchBoxComponent) {
      this.searchBoxComponent.unmount();
      this.searchBoxComponent = null;
    }

    if (this.poiCardListComponent) {
      this.poiCardListComponent.unmount();
      this.poiCardListComponent = null;
    }

    // 清理数据
    this.allPOIs = [];
    this.searchResults = [];
  }

  /**
   * 加载数据
   */
  async loadData() {
    try {
      // 加载 POI 数据
      this.allPOIs = await loadPOIs({});
      console.log("[MapStateSearch] 加载 POI 数据成功:", this.allPOIs.length);

      // 加载搜索历史
      this.loadSearchHistory();

      // 加载热门搜索词
      await this.loadHotWords();
    } catch (error) {
      console.error("[MapStateSearch] Load data error:", error);
    }
  }

  /**
   * 加载搜索历史
   */
  loadSearchHistory() {
    try {
      const history = localStorage.getItem("search_history");
      if (history) {
        this.searchHistory = JSON.parse(history);
      }
    } catch (error) {
      console.error("[MapStateSearch] 加载搜索历史失败:", error);
    }
  }

  /**
   * 保存搜索历史
   */
  saveSearchHistory() {
    try {
      localStorage.setItem("search_history", JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error("[MapStateSearch] 保存搜索历史失败:", error);
    }
  }

  /**
   * 加载热门搜索词
   */
  async loadHotWords() {
    try {
      const result = await getHotWords({});
      if (result && result.list) {
        this.hotWords = result.list.map((item) => item.word || item.name).slice(0, 10);
      }
      console.log("[MapStateSearch] 加载热门搜索词成功:", this.hotWords.length);
    } catch (error) {
      console.error("[MapStateSearch] 加载热门搜索词失败:", error);
      // 使用默认热门词
      this.hotWords = ["博物馆", "展览", "艺术品", "历史", "文化"];
    }
  }

  /**
   * 渲染页面
   */
  render() {
    const container = this.getContainer();
    if (!container) return;

    const hasResults = this.searchResults.length > 0;

    const html = `
      <div class="map-state-search">
        <div class="search-header">
          <div class="search-back" id="searchBackBtn">
            <span class="back-icon">←</span>
          </div>
          <div class="search-input-container" id="searchInputContainer" style="flex: 1;"></div>
        </div>
        
        ${!hasResults ? this.renderSearchPanel() : this.renderResultsPanel()}
      </div>
    `;

    this.setHtml(container, html);
  }

  /**
   * 渲染搜索面板
   * @returns {string} HTML 字符串
   */
  renderSearchPanel() {
    return `
      <div class="search-panel">
        ${this.searchHistory.length > 0 ? this.renderHistory() : ""}
        ${this.hotWords.length > 0 ? this.renderHotWords() : ""}
      </div>
    `;
  }

  /**
   * 渲染搜索历史
   * @returns {string} HTML 字符串
   */
  renderHistory() {
    return `
      <div class="search-section">
        <div class="section-header">
          <h3>搜索历史</h3>
          <button class="clear-history" id="clearHistoryBtn">清空</button>
        </div>
        <div class="history-list">
          ${this.searchHistory
            .map(
              (word) => `
            <button class="history-item" data-word="${this.escapeHtml(word)}">
              <span class="history-icon">🕐</span>
              <span class="history-text">${this.escapeHtml(word)}</span>
            </button>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  /**
   * 渲染热门搜索
   * @returns {string} HTML 字符串
   */
  renderHotWords() {
    return `
      <div class="search-section">
        <h3>热门搜索</h3>
        <div class="hot-words-list">
          ${this.hotWords
            .map(
              (word, index) => `
            <button class="hot-word-item ${index < 3 ? "hot" : ""}" data-word="${this.escapeHtml(word)}">
              ${this.escapeHtml(word)}
            </button>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  /**
   * 渲染结果面板
   * @returns {string} HTML 字符串
   */
  renderResultsPanel() {
    return `
      <div class="results-panel">
        <div class="results-header">
          <h3>搜索结果 (${this.searchResults.length})</h3>
        </div>
        <div class="results-content" id="resultsContent"></div>
      </div>
    `;
  }

  /**
   * HTML 转义
   * @param {string} text - 文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * 初始化组件
   */
  initComponents() {
    // 初始化搜索框
    const searchInputContainer = this.$("#searchInputContainer");
    if (searchInputContainer) {
      this.searchBoxComponent = new SearchBox({
        placeholder: "搜索景点、路线...",
        value: this.searchKeyword,
        showHistory: false,
        showHotWords: false,
        onSearch: (keyword) => {
          this.performSearch(keyword);
        },
        onInputChange: (keyword) => {
          // 可选：实时搜索
        },
        onClear: () => {
          this.clearSearch();
        },
      });

      this.searchBoxComponent.mount(searchInputContainer);
    }

    // 如果有搜索结果，初始化列表
    if (this.searchResults.length > 0) {
      this.initResultsList();
    }
  }

  /**
   * 初始化结果列表
   */
  initResultsList() {
    const resultsContent = this.$("#resultsContent");
    if (!resultsContent) return;

    if (this.poiCardListComponent) {
      this.poiCardListComponent.unmount();
    }

    this.poiCardListComponent = new POICardList({
      pois: this.searchResults,
      showDistance: false,
      showCategory: true,
      onPOIClick: (poi) => {
        this.handlePOIClick(poi);
      },
    });

    this.poiCardListComponent.mount(resultsContent);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 返回按钮
    const backBtn = this.$("#searchBackBtn");
    if (backBtn) {
      this.addEventListener(backBtn, "click", () => {
        this.back();
      });
    }

    // 清空历史按钮
    const clearHistoryBtn = this.$("#clearHistoryBtn");
    if (clearHistoryBtn) {
      this.addEventListener(clearHistoryBtn, "click", () => {
        this.clearHistory();
      });
    }

    // 历史项点击
    const historyItems = this.$$(".history-item");
    historyItems.forEach((item) => {
      this.addEventListener(item, "click", (e) => {
        const word = e.currentTarget.dataset.word;
        this.performSearch(word);
      });
    });

    // 热门词点击
    const hotWordItems = this.$$(".hot-word-item");
    hotWordItems.forEach((item) => {
      this.addEventListener(item, "click", (e) => {
        const word = e.currentTarget.dataset.word;
        this.performSearch(word);
      });
    });
  }

  /**
   * 解绑事件
   */
  unbindEvents() {
    // 事件会自动清理
  }

  /**
   * 执行搜索
   * @param {string} keyword - 搜索关键词
   */
  performSearch(keyword) {
    if (!keyword || !keyword.trim()) {
      return;
    }

    const searchKeyword = keyword.trim();
    console.log("[MapStateSearch] 执行搜索:", searchKeyword);

    this.isSearching = true;
    this.searchKeyword = searchKeyword;

    // 添加到搜索历史
    this.addToHistory(searchKeyword);

    // 搜索 POI
    this.searchResults = searchPOIs(this.allPOIs, searchKeyword, {
      searchDescription: true,
      searchCategory: true,
    });

    console.log("[MapStateSearch] 搜索结果数量:", this.searchResults.length);

    // 重新渲染
    this.render();
    this.initComponents();
    this.bindEvents();

    this.isSearching = false;
  }

  /**
   * 添加到搜索历史
   * @param {string} keyword - 关键词
   */
  addToHistory(keyword) {
    // 移除重复项
    this.searchHistory = this.searchHistory.filter((word) => word !== keyword);

    // 添加到开头
    this.searchHistory.unshift(keyword);

    // 限制历史记录数量
    if (this.searchHistory.length > 10) {
      this.searchHistory = this.searchHistory.slice(0, 10);
    }

    // 保存
    this.saveSearchHistory();
  }

  /**
   * 清除搜索
   */
  clearSearch() {
    this.searchKeyword = "";
    this.searchResults = [];
    this.render();
    this.initComponents();
    this.bindEvents();
  }

  /**
   * 清空搜索历史
   */
  clearHistory() {
    this.searchHistory = [];
    this.saveSearchHistory();
    this.render();
    this.bindEvents();
  }

  /**
   * 处理 POI 点击
   * @param {Object} poi - POI 数据
   */
  handlePOIClick(poi) {
    console.log("[MapStateSearch] POI clicked:", poi);
    this.navigateTo("POIDetailPage", { poiId: poi.id || poi.poi_id });
  }

  /**
   * 导出页面状态
   */
  toJSON() {
    return {
      ...super.toJSON(),
      searchKeyword: this.searchKeyword,
      resultCount: this.searchResults.length,
      historyCount: this.searchHistory.length,
      isSearching: this.isSearching,
    };
  }
}

/**
 * 创建并注册地图搜索状态控制器
 * @param {Object} options - 配置选项
 * @returns {MapStateSearchController}
 */
export function createMapStateSearch(options = {}) {
  return new MapStateSearchController(options);
}

/**
 * 注册地图搜索状态控制器到全局
 * @param {Object} options - 配置选项
 */
export async function registerMapStateSearch(_options = {}) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("MapStateSearch", MapStateSearchController);
}
