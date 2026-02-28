(function (global) {
  "use strict";

  function resolveDeps(options) {
    const daxiapp = options.daxiapp || global["DaxiApp"] || {};
    return {
      daxiapp: daxiapp,
      domUtils: options.domUtils || daxiapp["dom"],
      MapStateClass: options.MapStateClass || daxiapp["MapStateClass"],
      AboutViewCtor: options.AboutViewCtor || daxiapp["DXAboutViewComponent"],
    };
  }

  function createAboutPageController(options) {
    const deps = resolveDeps(options || {});
    const domUtils = deps.domUtils;
    const MapStateClass = deps.MapStateClass;
    const AboutViewCtor = deps.AboutViewCtor;

    if (!MapStateClass || typeof MapStateClass.extend !== "function") {
      return null;
    }

    return MapStateClass.extend({
      __init__: function () {
        this._super();
        this._rtti = "AboutPage";
      },
      initialize: function (app, container) {
        this._super(app, container);
        const thisObject = this;
        thisObject.bdid = "unknown";
        thisObject._app = app;

        const basicMapHtml = '<div id="about_page" class="dx_full_frame_container"><div class="back"></div><div class="wrapper"></div></div>';
        domUtils.append(thisObject._container, basicMapHtml);
        thisObject._dom = domUtils.find(thisObject._container, "#about_page");
        thisObject._bdid = "";
        thisObject._wrapper = domUtils.find(thisObject._dom, ".wrapper");
        thisObject._loadingDom = domUtils.find(thisObject._dom, "#loading");

        const mainContainerHtml = '<div class="about-main"></div>';
        domUtils.append(thisObject._wrapper, mainContainerHtml);
        thisObject._mainContainerDom = domUtils.find(thisObject._wrapper, ".about-main");

        thisObject._aboutView = new AboutViewCtor(app, container);
        thisObject._aboutView.init({
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
        const bdid = this.params["bdid"];
        if (this.bdid != bdid) {
          this.bdid = bdid;
          this.updateData(bdid);
        }
      },
      updateData: function (data) {
        this._aboutView.updateData(data);
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

  function registerAboutPageController(options) {
    const deps = resolveDeps(options || {});
    const controller =;
      (options && options.controller) ||
      createAboutPageController({
        daxiapp: deps.daxiapp,
        domUtils: deps.domUtils,
        MapStateClass: deps.MapStateClass,
        AboutViewCtor: deps.AboutViewCtor,
      });

    if (!controller) {
      return null;
    }

    deps.daxiapp["AboutPage"] = controller;
    return controller;
  }

  registerAboutPageController({});
})(window);
