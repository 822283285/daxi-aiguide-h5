(function (global) {
  "use strict";

  function resolveDeps(options) {
    const daxiapp = options.daxiapp || global["DaxiApp"] || {};

    return {
      globalRef: options.globalRef || global,
      daxiapp: daxiapp,
      domUtils: options.domUtils || daxiapp["dom"],
      MapStateClass: options.MapStateClass || daxiapp["MapStateClass"],
      SearchViewCtor: options.SearchViewCtor || daxiapp["DXSearchViewComponent2"],
      CommonPoiViewCtor: options.CommonPoiViewCtor || daxiapp["DXCommonPOIViewComponent"],
      PoiTypeListViewCtor: options.PoiTypeListViewCtor || daxiapp["DXPoiTypeListViewComponent"],
    };
  }

  function createMapStateMainPoiPageController(options) {
    const deps = resolveDeps(options || {});
    const globalRef = deps.globalRef;
    const domUtils = deps.domUtils;
    const MapStateClass = deps.MapStateClass;
    const SearchViewCtor = deps.SearchViewCtor;
    const CommonPoiViewCtor = deps.CommonPoiViewCtor;
    const PoiTypeListViewCtor = deps.PoiTypeListViewCtor;

    if (!MapStateClass || typeof MapStateClass.extend !== "function") {
      return null;
    }

    return MapStateClass.extend({
      __init__: function () {
        this._super();
        this._rtti = "MapStateMainPoiPage";
      },

      initialize: function (app, container) {
        this._super(app, container);
        const thisObject = this;
        thisObject.bdid = "unknown";
        thisObject._app = app;

        const basicMapHtml =;
          '<div id="main_poi_page" class="mainpoi_page_container">' +
          '<div class="wrapper" style="width: 100%;height: 100%;display: flex;flex-direction: column;">' +
          "</div>" +
          "</div>";
        domUtils.append(thisObject._container, basicMapHtml);
        thisObject._dom = domUtils.find(thisObject._container, "#main_poi_page");
        thisObject._bdid = "";
        thisObject._wrapper = domUtils.find(thisObject._dom, ".wrapper");

        thisObject._searchView = new SearchViewCtor(app, thisObject._wrapper);
        thisObject._searchView.init({
          onSearchViewBackBtnClicked: function () {
            const command = {
              ret: "Cancel",
            };
            app._stateManager.invokeCallback("selectPoiCallback", command);
          },
          onSearchViewSearchBtnClicked: function () {
            const searchResultArgs = {
              method: "openSearchPage",
              data: thisObject.params,
            };
            const page = thisObject._app._stateManager.pushState("MapStateSearchPage", searchResultArgs);
            page._once("searchPageCallback", function (_sender, searchResult) {
              if (searchResult.retVal == "OK") {
                if (thisObject.params.defStartPoint) {
                  searchResult["defStartPoint"] = thisObject.params.defStartPoint;
                }
                app._stateManager.invokeCallback("selectPoiCallback", searchResult);
              }
            });
          },
        });

        const mainContainerHtml = '<div class="home-main"></div>';
        domUtils.append(thisObject._wrapper, mainContainerHtml);
        thisObject._mainContainerDom = domUtils.find(thisObject._wrapper, ".home-main");

        thisObject._commonPoiView = new CommonPoiViewCtor(app, thisObject._mainContainerDom);
        thisObject._commonPoiView.init({
          onItemBtnClicked: function (_sender, data) {
            const args = {
              method: "openSearchPage",
              retVal: "OK",
              data: data,
            };

            if (thisObject.params.defStartPoint) {
              args["data"]["defStartPoint"] = thisObject.params.defStartPoint;
            }
            app._stateManager.invokeCallback("selectPoiCallback", args);
          },
        });

        thisObject._poiTypeListView = new PoiTypeListViewCtor(app, thisObject._mainContainerDom);
        thisObject._poiTypeListView.init({
          onItemBtnClicked: function (_sender, data) {
            const args = {
              retVal: "OK",
              data: data,
            };
            if (thisObject.params.defStartPoint) {
              args["data"]["defStartPoint"] = thisObject.params.defStartPoint;
            }
            if (data["type"] == 100) {
              app._stateManager.pushState("MapStateTrainSchedule", { data: { lineName: data["keyword"], stationName: thisObject.params["cnname"] } });
            } else {
              app._stateManager.invokeCallback("selectPoiCallback", args);
            }
          },
        });

        this.show(false);
        this.configData = {
          bdid_: app._config,
        };
      },

      onStateBeginWithParam: function (args) {
        this._super(args);
        if (!args) return;
        const thisObject = this;
        this.params = args["data"];
        const bdid = this.params["bdid"];
        if (thisObject.bdid != bdid) {
          thisObject.bdid = bdid;
          thisObject.updateData(bdid);
        }
      },
      runCommand: function () {
        this._app._stateManager.goBack();
      },
      updateData: function (bdid) {
        const thisObject = this;
        const params = thisObject._app._params;
        const projDataPath = params.dataRootPath || "../projdata/" + params["token"] + "/{{bdid}}/{{filename}}";
        const url = projDataPath;

        const data = {};
        const key = "bdid_" + bdid;
        if (thisObject.configData[key]) {
          const mainPageData = thisObject.configData[key]["mainPoiPage"];
          const commonPois = mainPageData["commonPois"];
          const poiTypeList = mainPageData["poiTypeList"];
          thisObject._commonPoiView.updateData(commonPois);
          thisObject._poiTypeListView.updateData(poiTypeList);
        } else {
          if (bdid.length != 0) {
            url = url.replace("{{bdid}}", bdid).replace("{{filename}}", "pages/config.json");
            url += "?t=" + (globalRef["version"] || new Date().getTime());
          } else {
            url = url.replace("{{bdid}}", "appConfig").replace("{{filename}}", "app.json");
            url += "?t=" + (globalRef["version"] || new Date().getTime());
          }
          thisObject._app.downloader.getServiceData(url, "get", "json", data, function (responseData) {
            thisObject.configData[key] = responseData;
            const mainPageData = responseData["mainPoiPage"];
            const commonPois = mainPageData["commonPois"];
            const poiTypeList = mainPageData["poiTypeList"];
            thisObject._commonPoiView.updateData(commonPois);
            thisObject._poiTypeListView.updateData(poiTypeList);
          });
        }

        if (globalRef.$ && globalRef.$("#first_page").length) {
          globalRef.$("#first_page")["animate"]({ left: "-100vw" }, 600, "linear");
        }
        thisObject._dom["css"]({ opacity: 1 });
      },
      onHideByPushStack: function (args) {
        this._super(args);
      },

      onShowByPopStack: function (args) {
        this._super(args);
        const mapView = this._app._mapView;
        mapView.setTopViewHeight(66);
        mapView.setBottomViewHeight(60);
      },

      onStateEnd: function (args) {
        this._super(args);
      },

      runCommond: function (command) {
        const thisObject = this;
        if (command.method == "showPois") {
          thisObject.showPois(command);
        } else if (command.method == "openSearchPage") {
          thisObject.openSearchPage(command);
        }
      },
      openSearchPage: function () {
        const args = {
          method: "openSearchPage",
          data: this.params,
        };
        this._app.mapStateManager.pushState("MapStateSearchPage", args);
      },
    });
  }

  function registerMapStateMainPoiPageController(options) {
    const deps = resolveDeps(options || {});
    const controller =;
      (options && options.controller) ||
      createMapStateMainPoiPageController({
        globalRef: deps.globalRef,
        daxiapp: deps.daxiapp,
        domUtils: deps.domUtils,
        MapStateClass: deps.MapStateClass,
        SearchViewCtor: deps.SearchViewCtor,
        CommonPoiViewCtor: deps.CommonPoiViewCtor,
        PoiTypeListViewCtor: deps.PoiTypeListViewCtor,
      });

    if (!controller) {
      return null;
    }

    deps.daxiapp["MapStateMainPoiPage"] = controller;
    return controller;
  }

  registerMapStateMainPoiPageController({});
})(window);
