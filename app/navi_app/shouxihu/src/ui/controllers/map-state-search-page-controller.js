function resolveDeps(options = {}) {
  const globalRef = options.globalRef || globalThis;
  const daxiapp = options.daxiapp || globalRef.DaxiApp || {};
  const daximap = options.daximap || globalRef.DaxiMap || {};

  return {
    globalRef,
    daxiapp,
    domUtils: options.domUtils || daxiapp.dom,
    MapStateClass: options.MapStateClass || daxiapp.MapStateClass,
    DXMapUtils: options.DXMapUtils || daximap.DXMapUtils,
    SearchComponentCtor: options.SearchComponentCtor || daxiapp.DXSearchComponent,
    HistoryListComponentCtor: options.HistoryListComponentCtor || daxiapp.DXHistoryListComponent,
    HotSearchComponentCtor: options.HotSearchComponentCtor || daxiapp.DXHotSearchComponent,
    SelectPoiListComponentCtor: options.SelectPoiListComponentCtor || daxiapp.DXSelectPoiListComponent,
    LoadingComponentCtor: options.LoadingComponentCtor || daxiapp.LoadingComponent,
    cache: options.cache || daxiapp.cache,
    api: options.api || daxiapp.api,
  };
}

function buildSearchCommand(method, data) {
  return {
    retVal: "OK",
    method,
    data,
  };
}

function getCacheKey(token, bdid) {
  return `${token}_${bdid}Search`;
}

export function createMapStateSearchPageController(options = {}) {
  const deps = resolveDeps(options);
  const {
    globalRef,
    domUtils,
    MapStateClass,
    DXMapUtils,
    SearchComponentCtor,
    HistoryListComponentCtor,
    HotSearchComponentCtor,
    SelectPoiListComponentCtor,
    LoadingComponentCtor,
    cache,
    api,
  } = deps;
  if (!MapStateClass || typeof MapStateClass.extend !== "function") {
    return null;
  }

  return MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "MapStateSearchPage";
    },

    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      thisObject.searchConf = app._config.search || {};
      const basicMapHtml = '<div id="search_page" class="dx_full_frame_container"></div>';
      domUtils.append(thisObject._container, basicMapHtml);
      thisObject._dom = domUtils.find(thisObject._container, "#search_page");
      thisObject.bdid = "";
      thisObject.token = app._params?.token || app._config?.token || "";

      thisObject._searchView = new SearchComponentCtor(app, thisObject._dom);
      thisObject._searchView.init({
        onSearchViewBackBtnClicked: function () {
          const command = { retVal: "Cancel" };
          thisObject._app._stateManager.invokeCallback("searchPageCallback", command);
        },
        onSearchInputed: function (_sender, text) {
          thisObject.searchPoi(text);
        },
        onSearchViewMicBtnClicked: function (_sender, text) {
          const command = buildSearchCommand("showPoi", {
            keyword: text,
            bdid: thisObject.bdid,
            token: thisObject.token,
          });
          thisObject.addHistory(command.data);
          thisObject._history.updateData(thisObject.getHistoryData().historyList);
          thisObject.getHotSearchData((hotData) => thisObject._hotSearch.updateData(hotData));
          thisObject._app._stateManager.invokeCallback("searchPageCallback", command);
        },
      });

      const searchWrapperHtml = '<div class="main_content" style="position: relative;flex-grow: 1;"><div class="search_display_wrapper"></div></div>';
      domUtils.append(thisObject._dom, searchWrapperHtml);
      thisObject._disWrapper = domUtils.find(thisObject._dom, ".search_display_wrapper");

      if (app._config.hotKeyWordUrl) {
        thisObject._disWrapper.append('<div class="hotWrapper_container"></div>');
        thisObject._hotKeyWordWrap = domUtils.find(thisObject._disWrapper, ".hotWrapper_container");
      }

      thisObject._history = new HistoryListComponentCtor(app, thisObject._disWrapper);
      thisObject._history.init({
        onListItemClicked: function (_sender, e) {
          const command = buildSearchCommand("showPoi", e);
          thisObject._app._stateManager.invokeCallback("searchPageCallback", command);
        },
        onClearBtnClicked: function () {
          thisObject.clearHistory();
        },
      });

      thisObject._hotSearch = new HotSearchComponentCtor(app, thisObject._disWrapper);
      thisObject._hotSearch.init({
        onListItemClicked: function (_sender, e) {
          const command = buildSearchCommand("showPoi", e);
          thisObject._app._stateManager.invokeCallback("searchPageCallback", command);
        },
      });

      thisObject._resulView = new SelectPoiListComponentCtor(app, thisObject._disWrapper);
      thisObject._resulView.init({
        onListItemClicked: function (_sender, e) {
          thisObject._resulView.hide();
          const command = buildSearchCommand("showPoi", e);
          const hisData = {
            token: thisObject.token,
            bdid: e.bdid,
            poiId: e.poiId,
            text: e.text,
            viewType: e.viewType,
          };
          if (e.type && typeof e.poiId === "string" && !e.poiId.includes("DX")) {
            hisData.type = e.type;
          }
          thisObject.addHistory(hisData);
          thisObject._history.updateData(thisObject.getHistoryData().historyList);
          thisObject.getHotSearchData((hotData) => thisObject._hotSearch.updateData(hotData));
          thisObject._app._stateManager.invokeCallback("searchPageCallback", command);
        },
        onTakeToThere: function (_sender, e) {
          const startPoint = thisObject._buildStartPoint();

          if (app._config.openThirdApp_amap) {
            thisObject._openAmapNavi(e);
            return;
          }
          setTimeout(() => {
            app._stateManager.pushState("MapStateRoute", {
              method: "takeToThere",
              endPoint: e,
              startPoint,
            });
          }, 0);
        },
      });
      thisObject._resulView.hide();

      thisObject._loadingWidget = new LoadingComponentCtor(app, thisObject._disWrapper);
      thisObject._loadingWidget.init({});
      thisObject._loadingWidget.hide();

      thisObject._dom.on("click", ".hot_keyword", function (event) {
        const { bdid, keyword } = event.currentTarget.dataset;
        const command = buildSearchCommand("showPoi", { bdid, keyword });
        thisObject._app._stateManager.invokeCallback("searchPageCallback", command);
      });

      this.show(false);
    },

    _buildStartPoint: function () {
      const locationManager = this._app._mapView._locationManager;
      const params = this.params || {};
      const defStartPoint = params.defStartPoint;
      const startPoint = {};

      if (!locationManager) {
        return startPoint;
      }

      const myPositionInfo = locationManager.getMyPositionInfo();

      if (defStartPoint && (myPositionInfo.bdid != defStartPoint.bdid || !myPositionInfo.floorId)) {
        return {
          ...defStartPoint,
          name: defStartPoint.name || "\u7ad9\u5185\u8d77\u70b9",
        };
      }

      startPoint.lon = params.position?.[0] || myPositionInfo.position?.[0];
      startPoint.lat = params.position?.[1] || myPositionInfo.position?.[1];
      startPoint.bdid = (params.position && params.bdid) || myPositionInfo.bdid || "";
      startPoint.floorId = (params.position && params.floorId) || myPositionInfo.floorId || "";

      if (!myPositionInfo.position?.[0]) {
        startPoint.name = params.startName || "\u8d77\u70b9\u4f4d\u7f6e";
      } else {
        startPoint.name = params.startName || "\u6211\u7684\u4f4d\u7f6e";
        startPoint.posMode = "myPosition";
      }

      return startPoint;
    },

    _openAmapNavi: function (e) {
      const urlParams = `lon=${e.lon}&lat=${e.lat}${e.name ? `&name=${encodeURIComponent(e.name)}` : ""}&t=0&dev=0&sourceApplication=miniapp`;
      if (globalRef.console && typeof globalRef.console.log === "function") {
        globalRef.console.log(urlParams);
      }
      globalRef.AlipayJSBridge?.call("amapOpenPage", {
        pageName: "navi",
        urlParams,
        isDialog: false,
        complete: (res) => globalRef.alert?.(JSON.stringify(res)),
        fail: (res) => globalRef.alert?.(res.errorMessage),
      });
    },

    getHotData: function () {
      const config = this._app._config || {};
      const hotKeyWordUrl = config.hotKeyWordUrl;
      if (!hotKeyWordUrl || !DXMapUtils || typeof DXMapUtils.getDataBySecurityRequest !== "function") {
        return;
      }

      const bdid = this._app._mapView._mapSDK.getCurrentBDID() || "";
      const data = {
        bdid,
        token: config.token,
        type: bdid ? 1 : 2,
      };

      DXMapUtils.getDataBySecurityRequest(
        hotKeyWordUrl,
        "GET",
        data,
        (res) => {
          const parsedData = JSON.parse(res);
          if (!parsedData.list?.length) {
            return;
          }

          const keywordItems = parsedData.list
            .map((item) => `<span class="hot_keyword" data-bdid="${item.bdid || ""}" data-keyword="${item.keyword}">${item.keyword}</span>`)
            .join("");

          this._hotKeyWordWrap.html(`
            <div class="hotWrapper">
              <p class="title" style="line-height: 2;font-size: 1.4rem;">\u70ed\u95e8\u5173\u952e\u8bcd</p>
              <p class="hotKeywords" style="margin: 4px 4px 0px 4px;">${keywordItems}</p>
            </div>
          `);
        },
        (err) => {
          if (globalRef.console && typeof globalRef.console.log === "function") {
            globalRef.console.log("error", err);
          }
        },
      );
    },

    changeStateChange: function (state) {
      const widgets = {
        loading: this._loadingWidget,
        result: this._resulView,
        history: this._history,
        hotSearch: this._hotSearch,
      };

      const stateConfig = {
        loading: { loading: true, result: false, history: false, hotSearch: false },
        compeleted: { loading: false, result: true, history: false, hotSearch: false },
        default: { loading: false, result: false, history: true, hotSearch: true },
      };

      const config = stateConfig[state] || stateConfig.default;
      Object.entries(config).forEach(([key, visible]) => {
        if (widgets[key]) {
          visible ? widgets[key].show() : widgets[key].hide();
        }
      });
    },

    searchPoi: function (keyword) {
      const thisObject = this;
      const paramsData = thisObject.params || {};
      const { token, bdid, floorId, defStartPoint } = paramsData;
      let { position, type } = paramsData;
      const locationManager = this._app._mapView._locationManager;
      const myPositionInfo = locationManager ? locationManager.getMyPositionInfo() : {};

      if (!position) {
        if (defStartPoint) {
          position = [defStartPoint.lon, defStartPoint.lat];
        } else if (myPositionInfo.position?.[0]) {
          position = myPositionInfo.position;
        } else {
          const pos = thisObject._app._mapView._mapSDK.getPosition();
          position = [pos.lon, pos.lat];
        }
      }

      const [lon, lat] = position || [];
      const params = {
        token,
        bdid: defStartPoint?.bdid || bdid,
        floorId: defStartPoint?.floorId || floorId,
        keyword,
        url: thisObject.searchConf.url,
        myPositionInfo,
      };

      if (params.bdid) {
        params.type = type && type < 10 ? type : 1;
      } else {
        type = type || thisObject.searchConf.type;
        params.type = type && type > 10 ? type : 11;
      }

      if (lon && lat) {
        params.lon = lon;
        params.lat = lat;
      }
      params.ac = 0;

      const search = thisObject._app._mapView._search;
      search?.cancel();

      if (keyword == "") {
        thisObject.changeStateChange("default");
        return;
      }

      thisObject.changeStateChange("loading");
      const count = thisObject.searchConf.count || 30;
      if (count) {
        params.count = count;
      }

      const hideSearchDis = thisObject._app._config.hideSearchDis;
      if (hideSearchDis) {
        params.hideDis = true;
      }

      search?.query(
        params,
        (data) => {
          if (data && !lon && !lat) {
            data.forEach((item) => {
              if (item.dataType == "Gaode") {
                item.dataType = 11;
              }
              delete item.distance;
            });
          }
          thisObject._resulView.updateData(data, { hideDis: hideSearchDis });
          thisObject.changeStateChange("compeleted");
        },
        () => {
          thisObject._resulView.updateData([]);
          thisObject.changeStateChange("compeleted");
        },
      );
    },

    getHotSearchData: function (callbackFn) {
      api?.getSearchHotWords({ bdid: this.bdid }, (data) => {
        if (data?.list?.length) {
          callbackFn?.(data.list);
        }
      });
    },

    getHistoryData: function () {
      const cacheKey = getCacheKey(this.token, this.bdid);
      const data = cache?.history?.getAll ? cache.history.getAll(cacheKey) : [];
      const historyList = data.map((item) => ({
        ...item,
        name: String(item.keyword || item.text),
      }));
      return { historyList };
    },

    addHistory: function (data) {
      const cacheKey = getCacheKey(this.token, this.bdid);
      cache?.history?.add?.(data, cacheKey);
    },

    clearHistory: function () {
      const cacheKey = getCacheKey(this.token, this.bdid);
      cache?.history?.clear?.(cacheKey);
      this._history.updateData([]);
    },

    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) {
        return;
      }
      this.params = args.data;

      this.bdid = this.params.bdid || this._app._config.search?.bdid || "";

      this._searchView.updateData("");
      this._searchView.setPlaceholder(
        this.bdid ? "\u8bf7\u8f93\u5165\u8981\u67e5\u8be2\u666f\u533a\u5185\u4f4d\u7f6e" : "\u8bf7\u8f93\u5165\u8981\u67e5\u8be2\u666f\u533a\u5916\u4f4d\u7f6e",
      );

      this._history.updateData(this.getHistoryData().historyList);
      this.getHotSearchData((hotData) => this._hotSearch.updateData(hotData));
      this.changeStateChange("default");

      if (this._app._config.hotKeyWordUrl) {
        this.getHotData();
      }
    },

    onHideByPushStack: function (args) {
      this._super(args);
    },

    onShowByPopStack: function (args) {
      this._searchView.updateData("");
      this._super(args);
      this.changeStateChange("default");
    },

    onStateEnd: function (args) {
      this._super(args);
    },
  });
}

export function registerMapStateSearchPageController(options = {}) {
  const deps = resolveDeps(options);
  const controller =
    options.controller ||
    createMapStateSearchPageController({
      ...options,
      globalRef: deps.globalRef,
      daxiapp: deps.daxiapp,
      domUtils: deps.domUtils,
      MapStateClass: deps.MapStateClass,
      DXMapUtils: deps.DXMapUtils,
      SearchComponentCtor: deps.SearchComponentCtor,
      HistoryListComponentCtor: deps.HistoryListComponentCtor,
      HotSearchComponentCtor: deps.HotSearchComponentCtor,
      SelectPoiListComponentCtor: deps.SelectPoiListComponentCtor,
      LoadingComponentCtor: deps.LoadingComponentCtor,
      cache: deps.cache,
      api: deps.api,
    });

  if (!controller) {
    return null;
  }

  deps.daxiapp.MapStateSearchPage = controller;
  return controller;
}
