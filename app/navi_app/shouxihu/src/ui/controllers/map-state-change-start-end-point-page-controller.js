function resolveDeps(options = {}) {
  const globalRef = options.globalRef || globalThis;
  const daxiapp = options.daxiapp || globalRef.DaxiApp || {};

  return {
    daxiapp,
    domUtils: options.domUtils || daxiapp.dom,
    MapStateClass: options.MapStateClass || daxiapp.MapStateClass,
    SearchComponentCtor: options.SearchComponentCtor || daxiapp.DXSearchComponent,
    SelectPointOptionCtor: options.SelectPointOptionCtor || daxiapp.DXSelectPointOptionComponent,
    ComboxListPanelCtor: options.ComboxListPanelCtor || daxiapp.DXComboxListPanelView,
    HistoryListComponentCtor: options.HistoryListComponentCtor || daxiapp.DXHistoryListComponent,
    SelectPoiListComponentCtor: options.SelectPoiListComponentCtor || daxiapp.DXSelectPoiListComponent,
    LoadingComponentCtor: options.LoadingComponentCtor || daxiapp.LoadingComponent,
    cache: options.cache || daxiapp.cache,
  };
}

export function createMapStateChangeStartEndPointPageController(options = {}) {
  const deps = resolveDeps(options);
  const {
    domUtils,
    MapStateClass,
    SearchComponentCtor,
    SelectPointOptionCtor,
    ComboxListPanelCtor,
    HistoryListComponentCtor,
    SelectPoiListComponentCtor,
    LoadingComponentCtor,
    cache,
  } = deps;
  if (!MapStateClass || typeof MapStateClass.extend !== "function") {
    return null;
  }

  return MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "MapStateChangeStartEndPoint";
    },

    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      thisObject.token = app._config.token || app._params.token || "";
      thisObject._bdid = "";
      const basicMapHtml = '<div id="change_start_end_point_page" class="dx_full_frame_container"></div>';
      domUtils.append(thisObject._container, basicMapHtml);
      thisObject._dom = domUtils.find(thisObject._container, "#change_start_end_point_page");

      thisObject._headerView = new SearchComponentCtor(app, thisObject._dom);
      thisObject._headerView.init({
        onSearchViewBackBtnClicked: function () {
          const command = {
            retVal: "Cancel",
          };
          app._stateManager.invokeCallback("selectPointCallback", command);
        },
        onSearchInputed: function (_sender, text) {
          thisObject.searchPoi(text);
        },
        onSearchViewMicBtnClicked: function (_sender, text) {
          thisObject.searchPoi(text);
          thisObject.addHistory({ keyword: text });
          const historyData = thisObject.getHistoryData().historyList;
          thisObject._history.updateData(historyData);
        },
      });

      const searchWrapperHtml =
        '<div class="main_content" style="position: relative;flex-grow: 1;"><div class="wrapper" style="height:100%;display:flex;flex-direction: column;"></div></div>';
      domUtils.append(thisObject._dom, searchWrapperHtml);
      const mainContentDom = domUtils.find(thisObject._dom, ".main_content .wrapper");

      thisObject._selectPointType = new SelectPointOptionCtor(app, mainContentDom);
      thisObject._selectPointType.init({
        onMyPostionBtnClicked: function () {
          const locInfo = app._mapView._locationManager.getMyPositionInfo();
          const pointType = thisObject.pointType;
          const command = {
            retVal: "OK",
            method: "startEndPointChanged",
            data: { pointType },
          };
          const pos = locInfo.position;
          const pointInfo = {
            lon: pos[0],
            lat: pos[1],
            floorId: locInfo.floorId,
            bdid: locInfo.bdid,
            floorName: locInfo.floorName,
            text: "\u6211\u7684\u4f4d\u7f6e",
            posMode: "myPosition",
          };
          if (pointType == "startPoint") {
            command.data.startPoint = pointInfo;
          } else {
            command.data.endPoint = pointInfo;
          }
          app._stateManager.invokeCallback("selectPointCallback", command);
        },
        onMapSelectPointBtnClicked: function (_sender, e) {
          const pointType = thisObject.pointType;
          const command = {
            retVal: "OK",
            method: "SelectMapPoint",
            data: { pointType },
          };
          if (pointType == "startPoint") {
            command.data.startPoint = e;
          } else {
            command.data.endPoint = e;
          }
          const page = app._stateManager.pushState("MapStateSelectPoint", command);
          page._once("selectMapPointCallback", function (_sender, selectPointResult) {
            if (selectPointResult.retVal == "OK") {
              app._stateManager.invokeCallback("selectPointCallback", selectPointResult);
            } else {
              const cancelCommand = {
                retVal: "Cancel",
              };
              app._stateManager.invokeCallback("selectPointCallback", cancelCommand);
            }
          });
        },
      });
      domUtils.append(mainContentDom, '<div class="search_display_wrapper"></div>');
      thisObject._disWrapper = domUtils.find(thisObject._dom, ".search_display_wrapper");

      if (ComboxListPanelCtor && app._config.hotWordUrl) {
        thisObject._comboxListPanel = new ComboxListPanelCtor(app, thisObject._disWrapper);
        thisObject._comboxListPanel.init({
          onListItemClicked: function (_sender, e) {
            const pointType = thisObject.pointType;
            const command = {
              retVal: "OK",
              method: "startEndPointChanged",
              data: {
                pointType,
              },
            };
            if (pointType == "startPoint") {
              command.data.startPoint = e;
            } else {
              command.data.endPoint = e;
            }
            app._stateManager.invokeCallback("selectPointCallback", command);
          },
        });
      }

      thisObject._history = new HistoryListComponentCtor(app, thisObject._disWrapper);
      thisObject._history.init({
        onListItemClicked: function (_sender, e) {
          const pointType = thisObject.pointType;
          const command = {
            retVal: "OK",
            method: "startEndPointChanged",
            data: {
              pointType,
            },
          };
          if (pointType == "startPoint") {
            command.data.startPoint = e;
          } else {
            command.data.endPoint = e;
          }
          app._stateManager.invokeCallback("selectPointCallback", command);
        },
        onClearBtnClicked: function () {
          thisObject.clearHistory();
        },
      });

      thisObject._resulView = new SelectPoiListComponentCtor(app, thisObject._disWrapper);
      thisObject._resulView.init({
        onListItemClicked: function (_sender, e) {
          const pointType = thisObject.pointType;
          const command = {
            retVal: "OK",
            data: {
              pointType,
              method: "startEndPointChanged",
            },
          };

          command.data[pointType] = e;
          e.token = thisObject.token;
          thisObject.addHistory(e);
          const historyData = thisObject.getHistoryData().historyList;
          thisObject._history.updateData(historyData);
          thisObject._resulView.hide();
          app._stateManager.invokeCallback("selectPointCallback", command);
        },
        onTakeToThere: function (_sender, e) {
          const pointType = thisObject.pointType;
          const command = {
            retVal: "OK",
            method: "startEndPointChanged",
            data: {
              pointType,
            },
          };
          if (pointType == "startPoint") {
            command.data.startPoint = e;
          } else {
            command.data.endPoint = e;
          }
          app._stateManager.invokeCallback("selectPointCallback", command);
        },
      });
      thisObject._resulView.hide();
      thisObject._loadingWidget = new LoadingComponentCtor(app, thisObject._disWrapper);
      thisObject._loadingWidget.init({});
      thisObject._loadingWidget.hide();

      this.show(false);
    },
    getHotWrordView: function () {
      const thisObject = this;
      if (thisObject._comboxListPanel) {
        const mapSDK = thisObject._app._mapView._mapSDK;
        const token = thisObject.token;
        const url = thisObject._app._config.hotWordUrl;
        let bdid = mapSDK.getCurrentBDID();
        const flid = mapSDK.getCurrentFloorId();
        const currIndoorBuilding = thisObject._app._mapView.getCurrIndoorBuilding();
        const bdInfo = currIndoorBuilding && currIndoorBuilding.bdInfo;
        if (bdInfo) {
          bdid = bdInfo.bdid;
        }
        const floorId = flid || (bdInfo && bdInfo.groundFloorId);

        const params = { url, token, bdid, floorId, dataType: "hotword" };
        thisObject._comboxListPanel.updateData(params);
      }
    },
    changeStateChange: function (state) {
      const thisObject = this;
      switch (state) {
        case "loading":
          thisObject._loadingWidget.show();
          thisObject._resulView.hide();
          thisObject._history.hide();
          break;
        case "compeleted":
          thisObject._loadingWidget.hide();
          thisObject._resulView.show();
          thisObject._history.hide();
          break;
        default:
          thisObject._loadingWidget.hide();
          thisObject._resulView.hide();
          thisObject._history.show();
      }
    },

    searchPoi: function (keyword) {
      const thisObject = this;
      const token = thisObject.token;

      const stateParams = thisObject.params || {};
      const bdid = stateParams.bdid;
      const floorId = stateParams.floorId;
      const lon = stateParams.position?.[0];
      const lat = stateParams.position?.[1];

      thisObject.searchConf = thisObject._app._config.search || {};
      const url = thisObject.searchConf.url;
      const params = { token, bdid, floorId, keyword, url };
      if (lon && lat) {
        params.lon = lon;
        params.lat = lat;
      } else {
        const center = thisObject._app._config.center || {};
        params.lon = center.lon;
        params.lat = center.lat;
      }
      if (bdid) {
        params.type = 1;
      } else {
        params.type = 21;
      }
      const search = thisObject._app._mapView._search;
      search.cancel();
      if (keyword == "") {
        thisObject.changeStateChange("default");
        return;
      }
      const searchUrl = thisObject._app._config.searchUrl;
      if (searchUrl) {
        params.url = searchUrl;
      }

      thisObject.changeStateChange("loading");
      const count = thisObject._app._config.searchCount;
      if (count) {
        params.count = count;
      }
      params.myPositionInfo = thisObject._app._mapView._locationManager.getMyPositionInfo();
      search.query(
        params,
        function (data) {
          if (data && !lon && !lat) {
            data.forEach(function (item) {
              delete item.distance;
            });
          }
          const hideSearchDis = thisObject._app._config.hideSearchDis;
          thisObject._resulView.updateData(data, { hideDis: hideSearchDis });
          thisObject.changeStateChange("compeleted");
        },
        function (data) {
          thisObject._resulView.updateData(data);
          thisObject.changeStateChange("compeleted");
        },
      );
    },

    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) {
        return;
      }
      this.params = args.data;
      this.pointType = args.data.pointType;
      const mapView = this._app._mapView;
      mapView.setTopViewHeight(66);
      mapView.setBottomViewHeight(60);
      const thisObject = this;
      const bdid = args.bdid;
      if (thisObject._bdid != bdid) {
        thisObject._bdid = bdid;
      }
      const text = (this.params && this.params.keyword) || "";
      this._headerView.updateData(text);
      if (this._comboxListPanel) {
        this.getHotWrordView();
      }
      const historyData = this.getHistoryData().historyList;
      this._history.updateData(historyData);
      this.changeStateChange("default");
    },

    onHideByPushStack: function (args) {
      this._super(args);
    },

    onShowByPopStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView.setTopViewHeight(66);
      mapView.setBottomViewHeight(60);
      const text = (args && args.keyword) || "";
      this._headerView.updateData(text);
      this.changeStateChange("default");
    },

    onStateEnd: function (args) {
      this._super(args);
    },

    getHistoryData: function () {
      const token = this.token;
      const bdid = this._bdid;
      const tempData = { historyList: [] };

      const data = cache.history.getAll(`${token}_${bdid}SearchSelect`);
      data.forEach(function (item) {
        item.name = item.keyword || item.text;
        item.name += "";
        tempData.historyList.push(item);
      });
      return tempData;
    },
    addHistory: function (data) {
      const token = this.token;
      const bdid = this._bdid;
      cache.history.add(data, `${token}_${bdid}SearchSelect`);
    },
    clearHistory: function () {
      const token = this.token;
      const bdid = this._bdid;
      cache.history.clear(`${token}_${bdid}SearchSelect`);
      this._history.updateData([]);
    },
  });
}

export function registerMapStateChangeStartEndPointPageController(options = {}) {
  const deps = resolveDeps(options);
  const controller =
    options.controller ||
    createMapStateChangeStartEndPointPageController({
      ...options,
      daxiapp: deps.daxiapp,
      domUtils: deps.domUtils,
      MapStateClass: deps.MapStateClass,
      SearchComponentCtor: deps.SearchComponentCtor,
      SelectPointOptionCtor: deps.SelectPointOptionCtor,
      ComboxListPanelCtor: deps.ComboxListPanelCtor,
      HistoryListComponentCtor: deps.HistoryListComponentCtor,
      SelectPoiListComponentCtor: deps.SelectPoiListComponentCtor,
      LoadingComponentCtor: deps.LoadingComponentCtor,
      cache: deps.cache,
    });

  if (!controller) {
    return null;
  }

  deps.daxiapp.MapStateChangeStartEndPoint = controller;
  return controller;
}
