(function (global) {
  "use strict";

  function resolveDeps(options) {
    var daxiapp = options.daxiapp || global["DaxiApp"] || {};
    return {
      daxiapp: daxiapp,
      domUtils: options.domUtils || daxiapp["dom"],
      MapStateClass: options.MapStateClass || daxiapp["MapStateClass"],
      PayResultViewCtor: options.PayResultViewCtor || daxiapp["DXPayResultViewComponent"],
    };
  }

  function createPayResultPageController(options) {
    var deps = resolveDeps(options || {});
    var domUtils = deps.domUtils;
    var MapStateClass = deps.MapStateClass;
    var PayResultViewCtor = deps.PayResultViewCtor;

    if (!MapStateClass || typeof MapStateClass.extend !== "function") {
      return null;
    }

    return MapStateClass.extend({
      __init__: function () {
        this._super();
        this._rtti = "PayResultPage";
      },
      initialize: function (app, container) {
        this._super(app, container);
        var thisObject = this;
        thisObject.bdid = "unknown";
        thisObject._app = app;

        var basicMapHtml = '<div id="payResult_page" class="dx_full_frame_container"><div class="back"></div><div class="wrapper"></div></div>';
        domUtils.append(thisObject._container, basicMapHtml);
        thisObject._dom = domUtils.find(thisObject._container, "#payResult_page");
        thisObject._bdid = "";
        thisObject._wrapper = domUtils.find(thisObject._dom, ".wrapper");
        thisObject._loadingDom = domUtils.find(thisObject._dom, "#loading");

        var mainContainerHtml = '<div class="pay-main"></div>';
        domUtils.append(thisObject._wrapper, mainContainerHtml);
        thisObject._mainContainerDom = domUtils.find(thisObject._wrapper, ".payResult-main");

        thisObject._payResultView = new PayResultViewCtor(app, container);
        thisObject._payResultView.init({
          onGoback: function () {
            app._stateManager.goBack();
          },
          finish: function () {
            thisObject._app._stateManager.pushState("MapStateBrowse", { method: "openAutoDesc" });
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
        this._payResultView.updateData(data);
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

  function registerPayResultPageController(options) {
    var deps = resolveDeps(options || {});
    var controller =
      (options && options.controller) ||
      createPayResultPageController({
        daxiapp: deps.daxiapp,
        domUtils: deps.domUtils,
        MapStateClass: deps.MapStateClass,
        PayResultViewCtor: deps.PayResultViewCtor,
      });

    if (!controller) {
      return null;
    }

    deps.daxiapp["PayResultPage"] = controller;
    return controller;
  }

  registerPayResultPageController({});
})(window);
