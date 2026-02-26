function resolveDeps(options = {}) {
  const globalRef = options.globalRef || globalThis;
  const daxiapp = options.daxiapp || globalRef.DaxiApp || {};

  return {
    daxiapp,
    domUtils: options.domUtils || daxiapp.dom,
    MapStateClass: options.MapStateClass || daxiapp.MapStateClass,
    PayResultViewCtor: options.PayResultViewCtor || daxiapp.DXPayResultViewComponent,
  };
}

export function createPayResultPageController(options = {}) {
  const deps = resolveDeps(options);
  const { domUtils, MapStateClass, PayResultViewCtor } = deps;
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
      const thisObject = this;
      thisObject.bdid = "unknown";
      thisObject._app = app;

      const basicMapHtml = '<div id="payResult_page" class="dx_full_frame_container"><div class="back"></div><div class="wrapper"></div></div>';
      domUtils.append(thisObject._container, basicMapHtml);
      thisObject._dom = domUtils.find(thisObject._container, "#payResult_page");
      thisObject._bdid = "";
      thisObject._wrapper = domUtils.find(thisObject._dom, ".wrapper");
      thisObject._loadingDom = domUtils.find(thisObject._dom, "#loading");

      const mainContainerHtml = '<div class="pay-main"></div>';
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
      this.params = args.data;
      this.updateData(args);
    },
    runCommand: function (cmd) {
      this.params = cmd;
      const bdid = this.params.bdid;
      if (this.bdid !== bdid) {
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

export function registerPayResultPageController(options = {}) {
  const deps = resolveDeps(options);
  const controller =
    options.controller ||
    createPayResultPageController({
      ...options,
      daxiapp: deps.daxiapp,
      domUtils: deps.domUtils,
      MapStateClass: deps.MapStateClass,
      PayResultViewCtor: deps.PayResultViewCtor,
    });

  if (!controller) {
    return null;
  }

  deps.daxiapp.PayResultPage = controller;
  return controller;
}

