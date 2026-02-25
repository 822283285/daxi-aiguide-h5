(function (global) {
  "use strict";
  const daxiapp = global.DaxiApp || {};
  const domUtils = daxiapp.dom;
  const MapStateClass = daxiapp.MapStateClass;
  const xiui = daxiapp.xiui;

  /**
   * 首页组件
   * 使用 XIComponent 新组件系统
   * 支持模块化 JSON 数据驱动，通过 moduleType 自动分发创建组件
   * 同时向后兼容旧数据格式
   */
  const HomePage = MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "HomePage";
    },

    /**
     * 初始化页面
     * @param {Object} app - 应用实例
     * @param {HTMLElement} container - DOM容器
     */
    initialize: function (app, container) {
      this._super(app, container);
      this._app = app;
      this._configData = null;
      this._componentsInitialized = false;
      this._modules = [];

      const pageHtml = `
        <div id="home_page" class="home-page dx_full_frame_container">
          <style>
            .home-page { display: flex; flex-direction: column; height: 100vh; background: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow: hidden; position: relative; z-index: 100; }
            .home-page .hide-scrollbar::-webkit-scrollbar { display: none; }
            .home-page .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .home-page .main-content { flex: 1; overflow-y: auto; padding-bottom: 70px; }
          </style>
          <div class="main-content hide-scrollbar"></div>
        </div>
      `;

      domUtils.append(this._container, pageHtml);
      this._dom = domUtils.find(this._container, "#home_page");
      this._mainContent = domUtils.find(this._dom, ".main-content")[0];

      this.show(false);
    },

    /**
     * 状态开始，加载数据
     * @param {Object} args - 参数
     */
    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) return;

      this.params = args.data || {};

      if (this._componentsInitialized) {
        this._showComponents();
        return;
      }

      this._loadHomeData();
    },

    /** 加载首页数据 */
    _loadHomeData: function () {
      const thisObject = this;
      const command = thisObject._app?._params;
      const buildImageUrl = this._buildImageUrl.bind(this);

      daxiapp.api.getHomePageConfig(
        { token: command?.token, bdid: command?.bdid },
        (data) => {
          thisObject._configData = data;
          thisObject._initComponents(data, buildImageUrl);
          thisObject._componentsInitialized = true;
        },
        (err) => {
          console.error("首页配置加载失败", err);
          domUtils.showInfo("首页加载失败，请重试");
        },
      );
    },

    /** 显示所有模块组件并恢复状态 */
    _showComponents: function () {
      this._modules.forEach((comp) => {
        comp.show();
        if (typeof comp.resume === "function") comp.resume();
      });
      this._tabbar?.show();
      this._tabbar?.setActiveByName("首页");
    },

    /** 隐藏所有模块组件并暂停状态 */
    _hideComponents: function () {
      this._modules.forEach((comp) => {
        if (typeof comp.pause === "function") comp.pause();
        comp.hide();
      });
      this._tabbar?.hide();
    },

    /**
     * 初始化所有组件，自动判断新旧数据格式
     * @param {Object} data - 配置数据
     * @param {Function} buildImageUrl - 图片URL构建函数
     */
    _initComponents: function (data, buildImageUrl) {
      if (Array.isArray(data.modules)) {
        this._initModularComponents(data, buildImageUrl);
      } else {
        this._initLegacyComponents(data, buildImageUrl);
      }
      this._initTabBar();
    },

    // -------------------- 模块化数据驱动（新格式） --------------------

    /**
     * 遍历 modules 数组，按 moduleType 分发创建组件
     * @param {Object} data - 模块化配置数据
     * @param {Function} buildImageUrl - 图片URL构建函数
     */
    _initModularComponents: function (data, buildImageUrl) {
      const modules = [...data.modules].sort((a, b) => (a.orderNum || 0) - (b.orderNum || 0));

      /** @type {Record<string, Function>} moduleType → 创建方法映射 */
      const creators = {
        carousel: (m) => this._createCarousel(m, buildImageUrl),
        quick_actions: (m) => this._createQuickActions(m, buildImageUrl),
        feature_grid: (m) => this._createFeatureGrid(m),
        spot_list: (m) => this._createSpotList(m, buildImageUrl),
      };

      modules.forEach((module) => {
        if (module.visible === false) return;
        const create = creators[module.moduleType];
        if (create) {
          const comp = create(module);
          if (comp) this._modules.push(comp);
        }
      });
    },

    /**
     * 创建轮播图组件
     * @param {Object} module - 模块配置
     * @param {Function} buildImageUrl - 图片URL构建函数
     * @returns {XICarousel}
     */
    _createCarousel: function (module, buildImageUrl) {
      return new xiui.XICarousel({
        parent: this._mainContent,
        config: module.config,
        data: (module.data || []).map((item) => ({
          ...item,
          imgurl: buildImageUrl(item.imageUrl || item.imgurl),
        })),
        listener: {
          onSlideClick: (sender, item) => {
            console.log("轮播图点击:", item);
          },
        },
      });
    },

    /**
     * 创建金刚区快捷操作组件
     * @param {Object} module - 模块配置
     * @param {Function} buildImageUrl - 图片URL构建函数
     * @returns {XIKingkong}
     */
    _createQuickActions: function (module, buildImageUrl) {
      const thisObject = this;
      return new xiui.XIKingkong({
        parent: this._mainContent,
        config: module.config,
        data: module.data || [],
        buildImageUrl: buildImageUrl,
        listener: {
          onItemClick: (sender, item) => {
            const cmd = item.action?.command || item.command;
            if (cmd?.funcName === "showPois") {
              thisObject._app._stateManager.pushState("MapStateBrowse", {});
              setTimeout(() => {
                const browse = thisObject._app._stateManager.getState("MapStateBrowse");
                browse?.showPois?.({ keyword: cmd.keyword || item.name, method: "showPois" });
              }, 100);
            }
          },
        },
      });
    },

    /**
     * 创建智慧游览功能块组件
     * @param {Object} module - 模块配置
     * @returns {XIFeatureGrid}
     */
    _createFeatureGrid: function (module) {
      const thisObject = this;
      const featureData = module.data || {};
      return new xiui.XIFeatureGrid({
        parent: this._mainContent,
        title: module.config?.title || "",
        data: {
          main: featureData.main || {},
          subs: featureData.subs || [],
        },
        listener: {
          onMainClick: (sender, { action }) => {
            const mainAction = featureData.main?.action;
            const target = mainAction?.target || "MapStateBrowse";
            const params = mainAction?.params || {};
            thisObject._app._stateManager.pushState(target, params);
          },
          onSubClick: (sender, { sub }) => {
            const subAction = sub?.action;

            if (typeof subAction === "object" && subAction?.target) {
              const target = subAction.target;
              if (target !== "MapStateBrowse" && target.startsWith("MapState")) {
                thisObject._app._stateManager.pushState("MapStateBrowse", {});
                setTimeout(() => {
                  thisObject._app._stateManager.pushState(target, subAction.params || {});
                }, 100);
              } else {
                thisObject._app._stateManager.pushState(target, subAction.params || {});
              }
            } else if (subAction === "route") {
              thisObject._app._stateManager.pushState("MapStateBrowse", {});
              setTimeout(() => {
                thisObject._app._stateManager.pushState("MapStateExhibitionRoute", {});
              }, 100);
            } else if (subAction === "map") {
              thisObject._app._stateManager.pushState("MapStateBrowse", {});
            }
          },
        },
      });
    },

    /**
     * 创建景点列表组件
     * @param {Object} module - 模块配置
     * @param {Function} buildImageUrl - 图片URL构建函数
     * @returns {XISpotList}
     */
    _createSpotList: function (module, buildImageUrl) {
      const thisObject = this;
      return new xiui.XISpotList({
        parent: this._mainContent,
        config: module.config,
        data: module.data || [],
        buildImageUrl: buildImageUrl,
        listener: {
          onSpotClick: (sender, { exhibitId }) => {
            if (exhibitId) {
              thisObject._app._stateManager.pushState("MapStateBrowse", {});
              setTimeout(() => {
                thisObject._app?.pageCommand?.openExhibit({ id: exhibitId, type: "Exhibit" });
              }, 100);
            }
          },
        },
      });
    },

    // -------------------- 旧数据格式兼容 --------------------

    /**
     * 旧格式数据初始化（无 modules 字段时回退）
     * @param {Object} data - 旧格式配置数据
     * @param {Function} buildImageUrl - 图片URL构建函数
     */
    _initLegacyComponents: function (data, buildImageUrl) {
      const thisObject = this;

      // 轮播图
      const carousel = new xiui.XICarousel({
        parent: thisObject._mainContent,
        data: (data.banner || []).map((item) => ({
          ...item,
          imgurl: buildImageUrl(item.imgurl),
        })),
        autoPlay: true,
        interval: 4000,
        listener: {
          onSlideClick: (sender, item) => {
            console.log("轮播图点击:", item);
          },
        },
      });
      thisObject._modules.push(carousel);

      // 金刚区
      const kingkong = new xiui.XIKingkong({
        parent: thisObject._mainContent,
        data: data.indexIcon || [],
        columns: 5,
        buildImageUrl: buildImageUrl,
        listener: {
          onItemClick: (sender, item) => {
            thisObject._app._stateManager.pushState("MapStateBrowse", {});
            setTimeout(() => {
              const browse = thisObject._app._stateManager.getState("MapStateBrowse");
              browse?.showPois?.({ keyword: item.name, method: "showPois" });
            }, 100);
          },
        },
      });
      thisObject._modules.push(kingkong);

      // 智慧游览功能块
      const featureGrid = new xiui.XIFeatureGrid({
        parent: thisObject._mainContent,
        title: "智慧游览",
        data: {
          main: { title: "智能导游", desc: "AI 语音随身讲解", icon: "icon-headset2", action: "guide" },
          subs: [
            { title: "游览路线", desc: "经典/亲子/徒步", icon: "icon-line", action: "route" },
            { title: "景区地图", desc: "手绘/高清/导航", icon: "icon-map", action: "map" },
          ],
        },
        listener: {
          onMainClick: (sender, { action }) => {
            thisObject._app._stateManager.pushState("MapStateBrowse", { method: "openAutoDesc" });
          },
          onSubClick: (sender, { action }) => {
            if (action === "route") {
              thisObject._app._stateManager.pushState("MapStateBrowse", {});
              setTimeout(() => {
                thisObject._app._stateManager.pushState("MapStateExhibitionRoute", {});
              }, 100);
            } else if (action === "map") {
              thisObject._app._stateManager.pushState("MapStateBrowse", {});
            }
          },
        },
      });
      thisObject._modules.push(featureGrid);

      // 景点列表
      const spotList = new xiui.XISpotList({
        parent: thisObject._mainContent,
        title: "热门景点",
        data: data.introduce,
        maxCount: 10,
        buildImageUrl: buildImageUrl,
        listener: {
          onSpotClick: (sender, { exhibitId }) => {
            if (exhibitId) {
              thisObject._app._stateManager.pushState("MapStateBrowse", {});
              setTimeout(() => {
                thisObject._app?.pageCommand?.openExhibit({ id: exhibitId, type: "Exhibit" });
              }, 100);
            }
          },
        },
      });
      thisObject._modules.push(spotList);
    },

    // -------------------- 独立组件 --------------------

    /** 初始化底部导航栏（与数据格式无关） */
    _initTabBar: function () {
      const thisObject = this;
      const footerData = thisObject._app?._config?.browsePage?.naviData || [];
      thisObject._tabbar = new xiui.XITabBar({
        parent: thisObject._dom[0],
        data: footerData.map((item, index) => ({
          id: index,
          name: item.name,
          icon: item.icon,
        })),
        activeName: "首页",
        listener: {
          onTabClick: (sender, { id, name }) => {
            thisObject._handleFooterClick(id);
          },
        },
      });
    },

    /**
     * 底部导航栏点击处理
     * @param {number} id - 标签ID
     */
    _handleFooterClick: function (id) {
      const pageActions = {
        // 0: 首页（当前页面）
        1: () => this._app._stateManager.pushState("MapStateBrowse", {}),
        2: () => window.parent.navigateToUni("navigateTo", "/pages/media/player-2"),
        3: () => this._app._stateManager.pushState("ServicePage", {}),
        4: () => this._app._stateManager.pushState("ProfilePage", {}),
      };
      pageActions[id]?.();
    },

    /**
     * 构建图片URL
     * @param {string} imagePath - 图片路径
     * @returns {string} 完整URL
     */
    _buildImageUrl: function (imagePath) {
      if (!imagePath) return "";
      if (imagePath.startsWith("http")) return imagePath;

      const params = this._app?._params;
      const config = this._app?._config;
      const baseUrl = config?.scenic?.static_url || window.dataPath || "https://cloud.daxicn.com/publicData";

      if (imagePath.startsWith("/pages/images/")) {
        return `${baseUrl}/${params?.token}/${params?.bdid}${imagePath}`;
      }

      return `${baseUrl}/${params?.token}/${params?.bdid}/${imagePath}`;
    },

    onHideByPushStack: function (args) {
      this._super(args);
      this._hideComponents();
    },

    onShowByPopStack: function (args) {
      this._super(args);
      this._showComponents();
    },

    onStateEnd: function (args) {
      this._super(args);
      this._hideComponents();
    },
  });

  daxiapp.HomePage = HomePage;
})(window);
