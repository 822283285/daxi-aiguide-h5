(function (global) {
  "use strict";
  const daxiapp = global["DaxiApp"] || {};
  const domUtils = daxiapp["dom"];
  const MapStateClass = daxiapp["MapStateClass"];
  const MapStateBuildingList = MapStateClass.extend({;
    __init__: function () {
      this._super();
      this._rtti = "MapStateBuildingList";
    },

    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      // var app  = thisObject._app;
      const basicMap_html = '<div id="stations_page" class="dx_full_frame_container stations_page"></div>';
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#stations_page");
      thisObject._bdid = "";

      thisObject._headerView = new daxiapp["DXHeaderComponent"](app, thisObject._dom);
      thisObject._headerView.init({
        onBackBtnClicked: function (sender, e) {
          const command = {;
            ret: "Cancel",
          };
          app._stateManager.invokeCallback("openBuildingCallback", command);
        },
      });

      var bdlistWraperhtml = '<div class="main_content" style="position: relative;flex-grow: 1;"></div>';
      domUtils.append(thisObject._dom, bdlistWraperhtml);
      thisObject._disWrapper = domUtils.find(thisObject._dom, ".main_content");

      thisObject._iframeContainer = new daxiapp["DXFullIframeComponent2"](app, thisObject._container);

      thisObject._iframeContainer.init({
        onClose: function (sender, e) {
          thisObject._iframeContainer.hide();
        },
      });
      thisObject._iframeContainer.setCloseBtnClass("icon-collapse");
      thisObject._iframeContainer.hide();
      // 搜索结果
      thisObject._buildingListView = new daxiapp["DXBuildingListComponent"](app, thisObject._disWrapper);
      thisObject._buildingListView.init({
        onStationClicked: function (sender, e) {
          const command = {;
            retVal: "OK",
            method: "changeBuilding",
          };
          command["data"] = e;
          if (e["noIndoorMap"]) {
            thisObject._iframeContainer.updateTitle(e["cn_name"]);
            thisObject._iframeContainer.updateIframe(e["mapUrl"] || "");
            thisObject._iframeContainer.show();
            return;
          }
          // thisObject.invokeCallback("changeBuildingCallback", command);
          app._stateManager.invokeCallback("changeBuildingCallback", command);
        },
      });
      if (app._mapView) {
        app._mapView._mapSDK["on"]("loadComplete", function (sender, data) {
          const title = data["bdListDesc"] || "建筑列表";
          thisObject._headerView.updateTitle(title);
          thisObject._buildingListView.updateData(data, "", app._params.token);
        });
      }

      thisObject._loadingWidget = new daxiapp["LoadingComponent"](app, thisObject._disWrapper);
      thisObject._loadingWidget.init({});
      thisObject._loadingWidget.hide();
      this.show(false);
    },
    setData: function (data, bdid, token) {
      const title = data["title"] || "建筑列表";
      // data buildingsData
      this._headerView.updateTitle(title);
      this._buildingListView.updateData(data, bdid, token);
    },
    changeStateChange: function (state) {
      const thisObject = this;
      switch (state) {
        case "loading":
          thisObject._loadingWidget.show();

          break;
        case "compeleted":
          thisObject._loadingWidget.hide();

          break;
        default:
          thisObject._loadingWidget.hide();
      }
    },
    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) return;

      if (this.params != args.data && args.data) {
        this.params = args.data;
      }

      this.changeStateChange("default");
    },

    onHideByPushStack: function (args) {
      this._super(args);
    },

    onShowByPopStack: function (args) {
      const text = (args && args["keyword"]) || "";
      this._super(args);
      this.changeStateChange("default");
    },

    onStateEnd: function (args) {
      this._super(args);
      const _search = this._app._mapView._search;
      _search["cancel"]();
    },
    // Run Command
    runCommond: function (command) {},
  });

  daxiapp["MapStateBuildingList"] = MapStateBuildingList;
})(window);
