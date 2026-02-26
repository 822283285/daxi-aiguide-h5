function resolveDeps(options = {}) {
  const globalRef = options.globalRef || globalThis;
  const daxiapp = options.daxiapp || globalRef.DaxiApp || {};
  const daximap = options.daximap || globalRef.DaxiMap || {};

  return {
    daxiapp,
    domUtils: options.domUtils || daxiapp.dom,
    MapStateClass: options.MapStateClass || daxiapp.MapStateClass,
    HeaderWithTipCtor: options.HeaderWithTipCtor || daxiapp.DXHeaderWithTipComponent,
    ImageComponentCtor: options.ImageComponentCtor || daxiapp.DXImageComponent,
    PoiResultViewCtor: options.PoiResultViewCtor || daxiapp.DXPoiResultView2,
    naviMath: options.naviMath || daxiapp.naviMath,
    utils: options.utils || daxiapp.utils,
    SceneMarkerCtor: options.SceneMarkerCtor || daximap.DXSceneMarker,
  };
}

export function createMapStateSelectPointPageController(options = {}) {
  const deps = resolveDeps(options);
  const { domUtils, MapStateClass, HeaderWithTipCtor, ImageComponentCtor, PoiResultViewCtor, naviMath, utils, SceneMarkerCtor } = deps;
  if (!MapStateClass || typeof MapStateClass.extend !== "function") {
    return null;
  }

  return MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "MapStateSelectPoint";
    },

    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      thisObject._bdid = "unkown";

      thisObject.pageName = "select_point_page";
      const basicMapHtml = `<div id="${thisObject.pageName}" class="dx_widget_base_container"></div>`;
      domUtils.append(thisObject._container, basicMapHtml);
      thisObject._dom = domUtils.find(thisObject._container, `#${thisObject.pageName}`);

      thisObject._headerView = new HeaderWithTipCtor(app, thisObject._dom);
      thisObject._headerView.init({
        onBackBtnClicked: function () {
          const command = {
            ret: "Cancel",
          };
          app._stateManager.invokeCallback("selectMapPointCallback", command);
        },
      });

      thisObject._markerComponent = new ImageComponentCtor(app, thisObject._dom);
      thisObject._markerComponent.init({});
      thisObject._markerComponent.setWrapperStyle({
        position: "absolute",
        top: "44px",
        bottom: "254px",
        width: "100vw",
        "pointer-events": "none",
      });

      thisObject._poiResultView = new PoiResultViewCtor(app, thisObject._dom);
      thisObject._poiResultView.init({
        onSelectItemAtIndexPath: function (_sender, e) {
          const mapSDK = app._mapView._mapSDK;
          mapSDK.easeTo(e);
        },
        onTakeToThere: function (_sender, e) {
          const command = {
            retVal: "OK",
            method: "selectPointCallback",
            data: {
              pointType: thisObject.pointType,
            },
          };
          command.data[thisObject.pointType] = e;
          app._stateManager.invokeCallback("selectMapPointCallback", command);
        },
      });
      thisObject._poiResultView.setWidgetHeight(254);

      this.show(false);
    },

    searchPoi: function (sender) {
      const thisObject = sender;
      const searchConf = thisObject._app._config.search || {};
      const token = thisObject._app._params.token;

      const params = { token };
      const mapView = thisObject._app._mapView;
      const cameraPose = mapView._mapSDK.cameraPose();
      params.lon = cameraPose.lon;
      params.lat = cameraPose.lat;

      if (mapView.currBuilding) {
        const currFloorInfo = mapView.currBuilding.getCurrentFloorInfo();
        const flid = currFloorInfo.flid;
        const range = currFloorInfo.rect;
        const inPolygon = naviMath.pointInPolygon(
          [params.lon, params.lat],
          [
            [range[0], range[1]],
            [range[2], range[1]],
            [range[2], range[3]],
            [range[0], range[3]],
          ],
        );
        if (inPolygon) {
          params.floorId = flid;
          params.bdid = cameraPose.bdid;
        }
      }
      if (params.bdid) {
        params.circle = 200;
        params.floorlimit = 1;
        params.type = 1;
      } else {
        params.circle = 3000;
        params.type = 11;
      }
      if (thisObject._app._config.searchType) {
        params.type = thisObject._app._config.searchType;
      }
      const search = thisObject._app._mapView._search;
      search.cancel();
      thisObject._poiResultView.showLoading();
      params.url = searchConf.url;

      thisObject._markerComponent.animate("markertip_animation");
      const myPosInfo = {
        poiId: utils.createUUID(),
        bdid: params.bdid,
        floorId: params.floorId,
        lat: params.lat,
        lon: params.lon,
        text: "\u5730\u56fe\u9009\u70b9\u4f4d\u7f6e",
        address: "",
      };
      const count = searchConf.ount;
      if (count) {
        params.count = count;
      }
      params.myPositionInfo = thisObject._app._mapView._locationManager.getMyPositionInfo();
      search.query(
        params,
        function (data) {
          const mergedData = [myPosInfo].concat(data);
          thisObject._poiResultView.updateData(mergedData);
          thisObject._poiResultView.setActiveByIndex(0, true);
        },
        function () {
          thisObject._poiResultView.updateData([myPosInfo]);
          thisObject._poiResultView.setActiveByIndex(0, true);
        },
      );
    },
    showMarkers: function (data) {
      const thisObject = this;
      const mapSDK = thisObject._app._mapView._mapSDK;
      const onMarkerClick = function (marker) {
        thisObject._poiResultView.setActiveById(marker._options.featureId);
      };
      for (const poiIndex in data) {
        const poiInfo = data[poiIndex];
        const markerOption = {
          featureId: poiInfo.poiId,
          bdid: poiInfo.bdid,
          lon: poiInfo.lon,
          lat: poiInfo.lat,
          floorId: poiInfo.floorId,
          imageUrl: "blue_dot",
          highlightImageUrl: "red_dot",
          scale: 0.5,
          onClick: onMarkerClick,
        };
        const marker = new SceneMarkerCtor();
        marker.initialize(mapSDK, markerOption);
        marker.id = utils.createUUID();
        marker.addToMap();
        thisObject._renderObjects.push(marker);
      }
    },

    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) {
        return;
      }
      this.params = args.data;
      const mapView = this._app._mapView;
      mapView.setTopViewHeight(66);
      mapView.setBottomViewHeight(254);
      mapView._mapSDK.setPadding({
        bottom: 240,
        top: 44,
      });
      const thisObject = this;
      thisObject.pointType = args.data.pointType;
      if (thisObject.pointType == "startPoint") {
        thisObject._headerView.updateData("\u9009\u62e9\u8d77\u70b9");
        const url = "./images/start_point.png";
        thisObject._markerComponent.updateData(url);
      } else {
        thisObject._headerView.updateData("\u9009\u62e9\u7ec8\u70b9");
        const url = "./images/end_point.png";
        thisObject._markerComponent.updateData(url);
      }
      this._poiResultView.show();

      this.searchPoi(thisObject);
      this._app._mapView._mapSDK.on("onMapDragEnd", this.searchPoi, thisObject);
    },

    onHideByPushStack: function (args) {
      this._super(args);
      const search = this._app._mapView._search;
      search.cancel();
      this._app._mapView._mapSDK.off("onMapDragEnd", this.searchPoi);
    },

    onShowByPopStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView.setTopViewHeight(66);
      mapView.setBottomViewHeight(254);
      mapView._mapSDK.setPadding({
        bottom: 240,
        top: 44,
      });
      this._app._mapView._mapSDK.on("onMapDragEnd", this.searchPoi, this);
    },

    onStateEnd: function (args) {
      this._poiResultView.show();
      const search = this._app._mapView._search;
      search.cancel();
      this._super(args);
      this._app._mapView._mapSDK.off("onMapDragEnd", this.searchPoi);
    },

    runCommond: function () {},
  });
}

export function registerMapStateSelectPointPageController(options = {}) {
  const deps = resolveDeps(options);
  const controller =
    options.controller ||
    createMapStateSelectPointPageController({
      ...options,
      daxiapp: deps.daxiapp,
      domUtils: deps.domUtils,
      MapStateClass: deps.MapStateClass,
      HeaderWithTipCtor: deps.HeaderWithTipCtor,
      ImageComponentCtor: deps.ImageComponentCtor,
      PoiResultViewCtor: deps.PoiResultViewCtor,
      naviMath: deps.naviMath,
      utils: deps.utils,
      SceneMarkerCtor: deps.SceneMarkerCtor,
    });

  if (!controller) {
    return null;
  }

  deps.daxiapp.MapStateSelectPoint = controller;
  return controller;
}
