function resolveDeps(options = {}) {
  const globalRef = options.globalRef || globalThis;
  const daxiapp = options.daxiapp || globalRef.DaxiApp || {};

  return {
    daxiapp,
    domUtils: options.domUtils || daxiapp.dom,
    MapStateClass: options.MapStateClass || daxiapp.MapStateClass,
    PoiDetailViewCtor: options.PoiDetailViewCtor || daxiapp.DXPoiDetailViewComponent,
  };
}

export function createPoiDetailPageController(options = {}) {
  const deps = resolveDeps(options);
  const { domUtils, MapStateClass, PoiDetailViewCtor } = deps;
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
      const thisObject = this;
      thisObject.bdid = "unknown";
      thisObject._app = app;

      const basicMapHtml = '<div id="poiDetail_page" class="dx_full_frame_container"><div class="back"></div><div class="wrapper"></div></div>';
      domUtils.append(thisObject._container, basicMapHtml);
      thisObject._dom = domUtils.find(thisObject._container, "#poiDetail_page");
      thisObject._bdid = "";
      thisObject._wrapper = domUtils.find(thisObject._dom, ".wrapper");
      thisObject._loadingDom = domUtils.find(thisObject._dom, "#loading");

      const mainContainerHtml = '<div class="poiDtail-main"></div>';
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

export function registerPoiDetailPageController(options = {}) {
  const deps = resolveDeps(options);
  const controller =
    options.controller ||
    createPoiDetailPageController({
      ...options,
      daxiapp: deps.daxiapp,
      domUtils: deps.domUtils,
      MapStateClass: deps.MapStateClass,
      PoiDetailViewCtor: deps.PoiDetailViewCtor,
    });

  if (!controller) {
    return null;
  }

  deps.daxiapp.PoiDetailPage = controller;
  return controller;
}

