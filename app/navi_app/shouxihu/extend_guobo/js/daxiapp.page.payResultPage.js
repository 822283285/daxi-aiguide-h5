(function (global) {
  "use strict";
  var daxiapp = global["DaxiApp"] || {};
  var domUtils = daxiapp["dom"];
  var dxUtil = daxiapp["utils"];
  var MapStateClass = daxiapp["MapStateClass"];
  var PayResultPage = MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "PayResultPage";
    },
    initialize: function (app, container) {
      this._super(app, container);
      var thisObject = this;
      thisObject.bdid = "unknown";
      thisObject._app = app;
      var mapView = app._mapView;
      var basicMap_html = '<div id="payResult_page" class="dx_full_frame_container"><div class="back"></div>' + '<div class="wrapper">' + "</div></div>";
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#payResult_page");
      thisObject._bdid = "";
      thisObject._wrapper = domUtils.find(thisObject._dom, ".wrapper");
      thisObject._loadingDom = domUtils.find(thisObject._dom, "#loading");
      var mainContainerHtml = '<div class="pay-main"></div>';
      domUtils.append(thisObject._wrapper, mainContainerHtml);
      thisObject._mainContainerDom = domUtils.find(thisObject._wrapper, ".payResult-main");
      thisObject._payResultView = new daxiapp["DXPayResultViewComponent"](app, container);
      thisObject._payResultView.init({
        onGoback: function (e) {
          app._stateManager.goBack();
        },
        finish: function (e) {
          thisObject._app._stateManager.pushState("MapStateBrowse", { method: "openAutoDesc" });
        },
      });
      this.show(false);
    },
    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) return;
      var thisObject = this;
      this.configData = {};
      this.params = args["data"];
      thisObject.updateData(args);
      //}
    },
    runCommand: function (cmd) {
      this.params = cmd;
      var bdid = this.params["bdid"];
      if (this.bdid != bdid) {
        this.bdid = bdid;
        this.updateData(bdid);
      }
    },
    updateData: function (data) {
      this._payResultView.updateData(data);
    },
    onHideByPushStack: function (args) {
      this._super(args);
    },

    onShowByPopStack: function (args) {
      this._super(args);
      var mapView = this._app._mapView;
    },

    onStateEnd: function (args) {
      this._super(args);
      // var mapView = this._app._mapView;
    },

    // Run Command
    runCommond: function (command) {},
  });

  daxiapp["PayResultPage"] = PayResultPage;
})(window);
