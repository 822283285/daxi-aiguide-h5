(function (global) {
  "use strict";
  const daxiapp = global["DaxiApp"] || {};
  const daximap = window["DaxiMap"] || {};
  const domUtils = daxiapp["dom"];
  const MapStateClass = daxiapp["MapStateClass"];

  const MapStateAutoPlayExhibit = MapStateClass.extend({;
    __init__: function () {
      this._super();
      this._rtti = "MapStateAutoPlayExhibit";
    },

    initialize: function (app, container) {
      this._super(app, container);
      this._app = app;
      this._mapView = app._mapView;
      this.panoPoiVisible = false;
      this._exhibitAutoPlay = true;
      this._stopCheckExhibitsByLoc = true;
      const thisObject = this;
      const basicMap_html = '<div id="auto_play_zhanpin_page" class="browse_map_page"></div>';
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#auto_play_zhanpin_page");
      thisObject._bdid = null;

      thisObject._listComponent = new daxiapp["DXListComponent"](thisObject._dom);
      thisObject._listComponent.init({});
      const listConponentTop = 48;
      if (app._config["hideLocState"]) {
        listConponentTop -= 34;
      }

      thisObject._listComponent.setStyle({ position: "absolute", top: listConponentTop + "px", right: "12px", "background-color": "rgba(255,255,255,0)" });

      // 国博按钮
      {
        // DXSliderTapPanelView
        thisObject._autoDescCtrl = new daxiapp["DXSliderTapPanelView"]({ desc: "自动讲解", disabledStateChange: true, active: true });
        thisObject._autoDescCtrl.init({
          onClicked: function (args) {
            app._stateManager.goBack();
          },
        });

        thisObject._autoDescCtrl.setStyle({
          border: "1px solid #e7e7e7",
          width: "30px",
          height: "auto",
          "text-align": "center",
          "font-size": "18px",
          "line-height": "26px",
        });
        thisObject._listComponent.appendItem(thisObject._autoDescCtrl._dom);
        thisObject._listComponent.showItem(thisObject._autoDescCtrl);
      }
      thisObject._listComponent.setItemStyle({ "border-bottom": "0px", margin: "2px 0px" });

      thisObject._listComponent.show();

      thisObject.dxSwiperComponent = new daxiapp["DXSwiperComponent"]();
      thisObject.dxSwiperComponent.init(thisObject._dom, {
        style: {
          position: "absolute",
          width: "100%",
          left: 0,
          bottom: 0,
          "border-radius": "6px 6px 0px 0px",
          height: "auto",
          background: "#fff",
        },
        listener: {
          slideChangeTransitionEnd: function (sender, activeSlide) {
            // console.log(activeSlide.pcompsInstance);
            sender.getAllSlides().forEach(function (slide) {
              if (slide != activeSlide) {
                slide.pcompsInstance && slide.pcompsInstance.pausePlay();
              } else {
                slide.pcompsInstance && slide.pcompsInstance.startPlay();
                const data = slide["pcompsInstance"]["_data"];
                data["width"] = 64;
                data["height"] = 64;
                thisObject.showMarker(data);
                // thisObject._app.exhibitsLayer[data["bdid"]+data["floorId"]].highlightMarker(data["exhibitId"]);
                thisObject._app._mapView._mapSDK["jumpTo"]({ bdid: data["bdid"], floorId: data["floorId"], lon: data["lon"], lat: data["lat"], zoom: 21 });
              }
            });
          },
        },
      });
      //获取展品
      daxiapp.api.getExplainAll({}, function (data) {
        thisObject.exhibitsAreaData = data;
        app._mapView._locationManager["on"]("onLocationChanged", function (sender, e) {
          if (e["locType"] == "AOA") {
            thisObject.aoaLoc = e;
            if (thisObject._stopCheckExhibitsByLoc) {
              return;
            }
            thisObject.startCheckExhibitsByLoc(data, e);
          }
        });
      });

      this.show(false);
    },

    onStateBeginWithParam: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView.setTopViewHeight(14);
      mapView.setBottomViewHeight(20);
      mapView.pushState();
      this.startCheckExhibitsByLoc(this.exhibitsAreaData, this.aoaLoc);
    },

    onHideByPushStack: function (args) {
      this.pauseExhibitPlay();
      this._super(args);
      this._app._mapView.popState();
      this.stopCheckExhibitsByLoc();
    },

    onShowByPopStack: function (args) {
      this._super(args);
      this._app._mapView.pushState();
      this.startCheckExhibitsByLoc(this.exhibitsAreaData, this.aoaLoc);
    },

    onStateEnd: function (args) {
      this.pauseExhibitPlay();
      this.stopCheckExhibitsByLoc();
      this._super(args);
      this._app._mapView.popState();
    },
    onPoiClick: function (sender, feature) {
      setTimeout(function () {
        if (feature["properties"]["icon"] != 9) {
          sender.openPoiDetailPage(feature["properties"]);
        } else {
          sender.openPanoPage(feature["properties"]);
        }
      }, 0);
    },

    openRoute: function (poinInfo) {
      const locationManager = this._mapView._locationManager;
      const startPoint = {};

      if (locationManager) {
        const myPositionInfo = locationManager["getMyPositionInfo"]();
        const lon = myPositionInfo["position"][0];
        const lat = myPositionInfo["position"][1];
        const bdid = myPositionInfo["bdid"] || "";
        const floorId = myPositionInfo["floorId"] || "";
        // var token = this._app._params["token"]||myPositionInfo["token"];
        startPoint["lon"] = lon;
        startPoint["lat"] = lat;
        startPoint["bdid"] = bdid;
        startPoint["floorId"] = floorId;
        startPoint["name"] = "我的位置";
        startPoint["posMode"] = "myPosition";
      }

      const args = {;
        method: "takeToThere",
        endPoint: poinInfo,
        startPoint: startPoint, //定位起点信息
      };
      this._app._stateManager.pushState("MapStateRoute", args);
    },
    openDetail: function (data) {
      this.pauseExhibitPlay();
      this._app.jsBridge.openExhibitDetail(
        data,
        function (data) {
          //success callback
        },
        function (data) {
          // failed callback
        },
      );
    },
    showMarker: function (poiInfo) {
      const thisObject = this;
      thisObject.clearAllRenderObject();
      const markerOption = {;
        featureId: poiInfo["featureId"],
        lon: poiInfo["lon"],
        lat: poiInfo["lat"],
        bdid: poiInfo["bdid"],
        floorId: poiInfo["floorId"],
        imageUrl: poiInfo["imageUrl"] || "red_dot",
        scale: !poiInfo["imageUrl"] ? 0.5 : 1,
        "icon-offset": [0, 0.2],
      };
      if (poiInfo["width"]) {
        markerOption["width"] = poiInfo["width"];
        markerOption["height"] = poiInfo["height"] || poiInfo["width"];
      }
      const mapSDK = thisObject._app._mapView._mapSDK;
      const marker = new daximap["DXSceneMarker"]();
      marker["initialize"](mapSDK, markerOption);
      marker.id = daxiapp["utils"].createUUID();
      marker["addToMap"]();
      thisObject._renderObjects.push(marker);
    },
    hideAutoExhibition: function () {
      this.lastMatch = false;
      this.clearAllRenderObject();
      this.dxSwiperComponent.hide();

      // thisObject._app._mapView.setBottomViewHeight(26);
    },
    // Run Command
    getParams: function () {
      const thisObject = this;
      const token = this._app._params["token"];
      const mapView = this._app._mapView;
      const mapSDK = mapView._mapSDK;
      const bdid = mapSDK["getCurrentBDID"]() || "";
      const floorId = mapSDK["getCurrentFloorId"]() || "";
      const pos = mapSDK["getPosition"]();
      const lon = pos["lon"],;
        lat = pos["lat"];
      // 定位点
      const locationManager = mapView._locationManager;
      const myPositionInfo = locationManager["getMyPositionInfo"]();

      const defStartPoint;
      if (bdid) {
        if (thisObject.buildingInfo && thisObject.buildingInfo["defStartPoint"]) {
          thisObject.buildingInfo["defStartPoint"]["bdid"] = thisObject.buildingInfo["bdid"];
          defStartPoint = thisObject.buildingInfo["defStartPoint"];
        }
        // 在室内并且室内配置了默认点，定位不在当前室内里用默认点搜索排序
        if (defStartPoint && (!myPositionInfo.floorId || myPositionInfo.bdid != thisObject.buildingInfo.bdid)) {
          ((lon = defStartPoint["lon"]), (lat = defStartPoint["lat"]), (bdid = defStartPoint["bdid"]), (floorId = defStartPoint["floorId"]));
        } else if (myPositionInfo.floorId) {
          //定位在当前室内 根据当前定位点搜索排序
          lon = myPositionInfo["position"][0];
          lat = myPositionInfo["position"][1];
          floorId = myPositionInfo["floorId"];
        }
      }
      // 室外的搜索都已当前地图位置搜索，如果想按照的
      const data = {;
        bdid: bdid,
        token: token,
        floorId: floorId,
        position: [lon, lat],
        locInfo: myPositionInfo,
      };

      if (defStartPoint) {
        data["defStartPoint"] = defStartPoint;
      }
      return data;
    },

    // open PoiDetail
    openPoiDetailPage: function (poiInfo) {
      thisObject._app._stateManager.pushState("MapStatePoiDetail", args);
    },
    openPanoPage: function (poiInfo) {
      //    var panoUrl = this._app._config["panoUrl"];
      //    var bdid = this.buildingInfo.bdid;
      //     panoUrl = panoUrl.replace("{{bdid}}",bdid);
    },
    triggerExhibit: function (data) {
      // tip
      // todo 处理展品播报
      this.showExhibit(data);
    },
    startCheckExhibitsByLoc: function (exhibitsAreaData, loc) {
      const thisObject = this;
      this._stopCheckExhibitsByLoc = false;

      if (exhibitsAreaData && loc) {
        const floorId = loc["floorId"],;
          lon = loc["position"][0],
          lat = loc["position"][1];
        const curFLExhibitsAreaData = exhibitsAreaData["result"];
        for (var i = 0, len = curFLExhibitsAreaData.length; i < len; i++) {
          if (loc["floorId"] != curFLExhibitsAreaData[i]["floorId"]) {
            continue;
          }

          const polygon = curFLExhibitsAreaData[i]["polygon"];
          const flag = daxiapp["naviMath"]["pointInPolygon"]([lon, lat], polygon);
          if (flag && (!thisObject.lastMatch || thisObject.lastMatch != curFLExhibitsAreaData[i])) {
            thisObject.dxSwiperComponent.show();
            // 更新
            thisObject.lastMatch = curFLExhibitsAreaData[i];
            const exhibits = curFLExhibitsAreaData[i]["exhibits"];
            const slide = thisObject.dxSwiperComponent.getActiveSlide();
            slide && slide.pcompsInstance && slide.pcompsInstance["cancel"]();
            thisObject.dxSwiperComponent.removeAllSlides();
            const slides = [];
            exhibits.forEach(function (data, index) {
              data["enableClose"] = true;
              data["autoplay"] = true;
              data["detailUrl"] = true;
              data["iconClose"] = true;
              const exhibitId = data["exhibitId"];
              data["activeMarkerIcon"] = data["markerIcon"] = "museum_" + exhibitId;
              data.showLineBtn = true;
              const exhibitInfoCtrl = new daxiapp["DXDetailInfoComponent"]();
              exhibitInfoCtrl.init(null, {
                class: "swiper-slide",
                style: {},
                data: data,
                listener: {
                  onRouteBtnClicked: function (sender, data) {
                    thisObject.openRoute(data);
                  },
                  onDeatilBtnClicked: function (sender, data) {
                    thisObject.openDetail(data);
                  },
                  onAudioEnded: function () {
                    if (thisObject.dxSwiperComponent.isEnd()) {
                      exhibitInfoCtrl.cancel();
                      thisObject.hideAutoExhibition();
                      thisObject.clearAllRenderObject();
                      mapView.setBottomViewHeight(26);
                      return;
                    }
                    thisObject.dxSwiperComponent.slideNext();
                  },
                  onClose: function () {
                    mapView.setBottomViewHeight(26);
                    thisObject.clearAllRenderObject();
                  },
                  onImgLoaded: function () {
                    const height = thisObject._dom.find(".detailInfo-component ").height();
                    if (height) {
                      thisObject._app._mapView.setBottomViewHeight(height + 16);
                    }
                  },
                },
                speakListener: thisObject._app._mapView._speakListener,
              });
              slides.push(exhibitInfoCtrl.getDomWithIns());
              if (index == 0) {
                // thisObject._app.exhibitsLayer[data["bdid"]+data["floorId"]].highlightMarker(data["exhibitId"]);
                data["width"] = data["height"] = 64;
                thisObject.showMarker(data);
                thisObject._app._mapView._mapSDK["jumpTo"]({ bdid: data["bdid"], floorId: data["floorId"], lon: data["lon"], lat: data["lat"], zoom: 21 });
                exhibitInfoCtrl.startPlay();
              }
            });

            thisObject.dxSwiperComponent.appendSlide(slides);
            const height = thisObject.dxSwiperComponent.getHeight();
            const mapView = thisObject._app._mapView;
            mapView.setBottomViewHeight(height + 26);
            break;
          }
        }
        return;
      }

      // 新进来的判断是否是已经播报的，已经播报的不加入队列，否则加入
    },
    stopCheckExhibitsByLoc: function () {
      this._stopCheckExhibitsByLoc = true;
      this.lastMatch = null;
      this.dxSwiperComponent.hide();
      const slide = this.dxSwiperComponent.getActiveSlide();
      slide && slide.pcompsInstance && slide.pcompsInstance["cancel"]();
      this.dxSwiperComponent.removeAllSlides();
    },
    pauseExhibitPlay: function () {
      const slide = this.dxSwiperComponent.getActiveSlide();
      slide && slide.pcompsInstance && slide.pcompsInstance["pausePlay"]();
    },
    runCommond: function (command) {
      if (command["method"] == "goBack") {
        this._app._stateManager.goBack();
      }
      if ((command.method = "openMainPoiPage")) {
        thisObject.openMainPoiPage(command);
      } else if (command.method == "showPois") {
        thisObject.showPois(command);
      }
    },
  });
  daxiapp["MapStateAutoPlayExhibit"] = MapStateAutoPlayExhibit;
})(window);
