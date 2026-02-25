(function (global) {
  "use strict";
  const daxiapp = global.DaxiApp || {};
  const domUtils = daxiapp.dom;
  const MapStateClass = daxiapp.MapStateClass;
  const xiui = daxiapp.xiui;

  /**
   * 服务页组件
   * 支持模块化 JSON 数据驱动，同时向后兼容旧数据格式
   */
  const ServicePage = MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "ServicePage";
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
        <div id="service_page" class="service-page dx_full_frame_container">
          <style>
            .service-page { display: flex; flex-direction: column; height: 100vh; background: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow: hidden; position: relative; z-index: 100; }
            .service-page .hide-scrollbar::-webkit-scrollbar { display: none; }
            .service-page .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .service-page .main-content { flex: 1; overflow-y: auto; padding-bottom: 60px; }
          </style>
          <div class="main-content hide-scrollbar"></div>
        </div>
      `;

      domUtils.append(this._container, pageHtml);
      this._dom = domUtils.find(this._container, "#service_page");
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

      this._loadServiceData();
    },

    /** 加载服务页数据 */
    _loadServiceData: function () {
      const thisObject = this;
      const command = thisObject._app?._params;
      const buildImageUrl = this._buildImageUrl.bind(this);

      daxiapp.api.getServicePageConfig(
        { token: command?.token, bdid: command?.bdid },
        (data) => {
          thisObject._configData = data;
          thisObject._initComponents(data, buildImageUrl);
          thisObject._componentsInitialized = true;
        },
        (err) => {
          console.error("服务页配置加载失败", err);
          domUtils.showInfo("服务页加载失败，请重试");
        },
      );
    },

    /** 显示所有模块组件 */
    _showComponents: function () {
      this._modules.forEach((comp) => comp.show());
      this._tabbar?.show();
      this._tabbar?.setActiveByName("服务");
    },

    /** 隐藏所有模块组件 */
    _hideComponents: function () {
      this._modules.forEach((comp) => comp.hide());
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

      const creators = {
        quick_actions: (m) => this._createQuickActions(m, buildImageUrl),
        poi_category_list: (m) => this._createPoiCategoryList(m),
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
     * 创建快捷操作组件
     * @param {Object} module - 模块配置
     * @param {Function} buildImageUrl - 图片URL构建函数
     * @returns {XIKingkong}
     */
    _createQuickActions: function (module, buildImageUrl) {
      const thisObject = this;
      return new xiui.XIKingkong({
        parent: this._mainContent,
        config: module.config,
        data: (module.data || []).map((item) => ({
          ...item,
          imageicon: item?.icon?.includes(".png") ? item.icon : item.icon ? `${item.icon}.png` : undefined,
        })),
        buildImageUrl: buildImageUrl,
        className: "service-kingkong",
        listener: {
          onItemClick: (sender, item) => {
            const cmd = item.action?.command || item.command;
            if (cmd?.funcName === "showPois") {
              thisObject._handlePoiClick({ keyword: cmd.keyword || item.name });
            }
          },
        },
      });
    },

    /**
     * 创建 POI 分类列表组件
     * @param {Object} module - 模块配置
     * @returns {XIPoiCategoryList}
     */
    _createPoiCategoryList: function (module) {
      const thisObject = this;
      return new xiui.XIPoiCategoryList({
        parent: this._mainContent,
        config: module.config,
        data: module.data || [],
        listener: {
          onItemClick: (sender, { keyword }) => {
            thisObject._handlePoiClick({ keyword });
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
      const mainPoiPage = data?.mainPoiPage;

      // 常见服务区域
      if (mainPoiPage?.commonPois?.length) {
        const kingkong = new xiui.XIKingkong({
          parent: thisObject._mainContent,
          data: mainPoiPage.commonPois.map((item) => ({
            ...item,
            imageicon: `${item.icon}.png`,
          })),
          columns: 4,
          buildImageUrl: buildImageUrl,
          className: "service-kingkong",
          listener: {
            onItemClick: (sender, item) => {
              thisObject._handlePoiClick(item);
            },
          },
        });
        thisObject._modules.push(kingkong);
      }

      // 服务分类列表
      if (mainPoiPage?.poiTypeList?.length) {
        const poiList = new xiui.XIPoiCategoryList({
          parent: thisObject._mainContent,
          data: mainPoiPage.poiTypeList,
          listener: {
            onItemClick: (sender, { keyword }) => {
              thisObject._handlePoiClick({ keyword });
            },
          },
        });
        thisObject._modules.push(poiList);
      }
    },

    // -------------------- 独立组件 --------------------

    /** 初始化底部导航栏 */
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
        activeName: "服务",
        listener: {
          onTabClick: (sender, { id, name }) => {
            thisObject._handleFooterClick(id);
          },
        },
      });
    },

    /**
     * 处理 POI 点击
     * @param {Object} poiItem - POI 数据
     */
    _handlePoiClick: function (poiItem) {
      const thisObject = this;
      const keyword = poiItem.keyword || poiItem.name || "";

      thisObject._app._stateManager.pushState("MapStateBrowse", {});
      setTimeout(() => {
        const browse = thisObject._app._stateManager.getState("MapStateBrowse");
        browse?.showPois?.({ keyword, method: "showPois" });
      }, 100);
    },

    /**
     * 底部导航栏点击处理
     * @param {number} id - 标签ID
     */
    _handleFooterClick: function (id) {
      const pageActions = {
        0: () => this._app._stateManager.pushState("HomePage", {}),
        1: () => this._app._stateManager.pushState("MapStateBrowse", {}),
        2: () => window.parent.navigateToUni("navigateTo", "/pages/media/player-2"),
        // 3: 服务页（当前页面）
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

  daxiapp.ServicePage = ServicePage;
})(window);
