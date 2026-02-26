(function (global) {
  "use strict";

  function resolveDeps(options) {
    var daxiapp = options.daxiapp || global["DaxiApp"] || {};
    return {
      daxiapp: daxiapp,
      domUtils: options.domUtils || daxiapp["dom"],
      MapStateClass: options.MapStateClass || daxiapp["MapStateClass"],
      PoiDetailViewCtor: options.PoiDetailViewCtor || daxiapp["DXPoiDetailViewComponent"],
    };
  }

  function createPoiDetailPageController(options) {
    var deps = resolveDeps(options || {});
    var domUtils = deps.domUtils;
    var MapStateClass = deps.MapStateClass;
    var PoiDetailViewCtor = deps.PoiDetailViewCtor;

    if (!MapStateClass || typeof MapStateClass.extend !== "function") {
      return null;
    }

    return MapStateClass.extend({
      __init__: function () {
        this._super();
        this._rtti = "PoiDetailPage";
      },
      initialize: function (app, container) {
        this._super(app, container);
        var thisObject = this;
        thisObject.bdid = "unknown";
        thisObject._app = app;

        var basicMapHtml = '<div id="poiDetail_page" class="dx_full_frame_container"><div class="back"></div><div class="wrapper"></div></div>';
        domUtils.append(thisObject._container, basicMapHtml);
        thisObject._dom = domUtils.find(thisObject._container, "#poiDetail_page");
        thisObject._bdid = "";
        thisObject._wrapper = domUtils.find(thisObject._dom, ".wrapper");
        thisObject._loadingDom = domUtils.find(thisObject._dom, "#loading");

        var mainContainerHtml = '<div class="poiDtail-main"></div>';
        domUtils.append(thisObject._wrapper, mainContainerHtml);
        thisObject._mainContainerDom = domUtils.find(thisObject._wrapper, ".poiDtail-main");

        thisObject._poiDetailView = new PoiDetailViewCtor(app, container);
        thisObject._poiDetailView.init({
          onGoback: function () {
            app._stateManager.goBack();
          },
        });

        this.show(false);
      },
      onStateBeginWithParam: function (args) {
        this._super(args);
        if (!args) return;
        this.configData = {};
        this.params = args["data"];
        this.updateData(args);
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
        this._poiDetailView.updateData(data);
      },
      onHideByPushStack: function (args) {
        this._super(args);
      },
      onShowByPopStack: function (args) {
        this._super(args);
      },
      onStateEnd: function (args) {
        this._super(args);
      },
      runCommond: function () {},
    });
  }

  function registerPoiDetailPageController(options) {
    var deps = resolveDeps(options || {});
    var controller =
      (options && options.controller) ||
      createPoiDetailPageController({
        daxiapp: deps.daxiapp,
        domUtils: deps.domUtils,
        MapStateClass: deps.MapStateClass,
        PoiDetailViewCtor: deps.PoiDetailViewCtor,
      });

    if (!controller) {
      return null;
    }

    deps.daxiapp["PoiDetailPage"] = controller;
    return controller;
  }

  registerPoiDetailPageController({});
})(window);
