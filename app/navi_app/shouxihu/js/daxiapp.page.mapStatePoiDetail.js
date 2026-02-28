(function (global) {
  "use strict";
  const daxiapp = global["DaxiApp"] || {};
  const daximap = window["DaxiMap"] || {};
  const DXMapUtils = daximap["DXMapUtils"];
  const domUtils = daxiapp["dom"];

  const MapStateClass = daxiapp["MapStateClass"];
  const MapStatePoiDetail = MapStateClass.extend({;
    __init__: function () {
      this._super();
      this._rtti = "MapStatePoiDetail";
    },

    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      // var app  = thisObject._app;
      const basicMap_html = '<div id="poi_detail_page" class=""></div>';
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#poi_detail_page");
      thisObject._bdid = "";
      const mapView = app._mapView;
      thisObject.bottomViewHeight = 70;
      thisObject._searchView = new daxiapp["DXSearchViewComponent"](app, thisObject._dom);
      thisObject._searchView.init({
        onSearchViewBackBtnClicked: function (sender, e) {
          app._stateManager.goBack();
        },
        onSearchViewSearchBtnClicked: function (sender, e) {
          const bdid = thisObject._app._mapView._mapSDK["getCurrentBDID"]();
          const token = thisObject._app._params.token;
          const arealType = "outdoor";
          if (bdid) {
            arealType = "indoor";
          }
          const args = {
            method: "openSearchPage",
            data: {
              bdid: bdid,
              token: token,
              arealType: arealType,
              keyword: e["keyword"],
            },
          };
          const params = thisObject.params;
          if (params["defStartPoint"]) {
            args["data"]["defStartPoint"] = params["defStartPoint"];
          }

          const page = thisObject._app._stateManager.pushState("MapStateSearchPage", args);
          page._once("searchPageCallback", function (sender, searchResult) {
            if (searchResult.retVal == "OK") {
              //poiDetailPageCallback
              const params = thisObject.params;
              if (params["defStartPoint"]) {
                searchResult["data"]["defStartPoint"] = params["defStartPoint"];
              }
              //thisObject._app._stateManager.goBack();
              thisObject._app._stateManager.pushState("MapStatePoi", searchResult["data"]);
            }
          });
        },
        onSearchViewMicBtnClicked: function (sender, e) {
          const bdid = thisObject._app._mapView._mapSDK["getCurrentBDID"]();
          const token = thisObject._app._params.token;
          const arealType = "outdoor";
          if (bdid) {
            arealType = "indoor";
          }
          const args = {
            method: "openSearchPage",
            data: {
              bdid: bdid,
              token: token,
              arealType: arealType,
              keyword: e["keyword"],
            },
          };
          const params = thisObject.params;
          if (params["defStartPoint"]) {
            args["data"]["defStartPoint"] = params["defStartPoint"];
          }
          const page = thisObject._app._stateManager.pushState("MapStateSearchPage", args);
          page._once("searchCallback", function (sender, searchResult) {
            if (searchResult.retVal == "OK") {
              const params = thisObject.params;
              if (params["defStartPoint"]) {
                searchResult["data"]["defStartPoint"] = params["defStartPoint"];
              }
              thisObject._app._stateManager.pushState("MapStatePoi", searchResult);
            }
          });
        },
      });
      const showShare = app._config["showSahre"] == false ? false : true;
      thisObject._poiDetailView = new daxiapp["DXPoiDetialView"](app, thisObject._dom, showShare);
      thisObject._poiDetailView.init({
        viewStateChanged: function (sender, e) {
          thisObject.bottomViewHeight = e["viewHeight"];
          mapView.setBottomViewHeight(thisObject.bottomViewHeight);
        },
        onTakeToThere: function (sender, e) {
          const locationManager = mapView._locationManager;
          const startPoint = {};
          const defStartPoint = thisObject.params.defStartPoint;
          if (locationManager) {
            const myPositionInfo = locationManager["getMyPositionInfo"]();
            if (defStartPoint && (myPositionInfo["bdid"] != defStartPoint.bdid || !myPositionInfo["floorId"])) {
              startPoint = defStartPoint;
              startPoint["name"] = defStartPoint["name"] || "站内起点";
            } else {
              startPoint["lon"] = myPositionInfo["position"][0];
              startPoint["lat"] = myPositionInfo["position"][1];
              startPoint["bdid"] = myPositionInfo["bdid"] || "";
              startPoint["floorId"] = myPositionInfo["floorId"] || "";
              startPoint["name"] = "我的位置";
              startPoint["posMode"] = "myPosition";
            }
          }
          const args = {
            method: "takeToThere",
            endPoint: e,
            startPoint: startPoint, //定位起点信息
          };
          const params = thisObject.params;
          if (params["defStartPoint"]) {
            args["defStartPoint"] = params["defStartPoint"];
          }
          if (app._config["openThirdApp_amap"]) {
            const urlParams = "sid=&did=&dlat=" + e["lat"] + "&dlon=" + e["lon"] + "&dname=" + encodeURIComponent(e["name"]) + "&t=0";
            if (startPoint["lon"] && startPoint["lat"]) {
              urlParams += "&slat=" + startPoint["lat"] + "&slon=" + startPoint["lon"] + "&sname=" + encodeURIComponent(startPoint["name"]);
            }
            console.log(urlParams);
            if (window.AlipayJSBridge) {
              window.AlipayJSBridge.call("amapOpenPage", {
                pageName: "route_plan",
                urlParams: urlParams,
                isDialog: false,
                complete: function (res) {
                  alert(JSON.stringify(res));
                },
              });
            }
            return;
          } else {
            app._stateManager.pushState("MapStateRoute", args);
          }
          // app._stateManager.pushState("MapStateRoute",args);
        },
        onShareBtnClicked: function (sender, poiInfo) {
          poiInfo["method"] = "showPoiDetail";
          poiInfo["shareType"] = "poi";
          const locationManager = mapView._locationManager;
          poiInfo["buildingId"] = poiInfo["bdid"] || "";
          const mapConfig = thisObject._app._config;
          poiInfo["token"] = thisObject._app._params["token"] || mapConfig["token"];
          delete poiInfo["bdid"];
          if (mapConfig["platform"] && mapConfig["wbrs"]) {
            poiInfo["platform"] = mapConfig["platform"];
            poiInfo["wbrs"] = mapConfig["wbrs"];
          }
          locationManager["shareToFriend"](poiInfo);
        },
      });

      this.show(false);
    },

    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) return;
      const mapView = this._app._mapView;
      mapView.setTopViewHeight(66);
      mapView.setBottomViewHeight(this.bottomViewHeight);
      this.params = args["data"];
      this._poiDetailView.show();
      // this._poiDetailView.updateData(args["data"]);
      // this.showMarker(args["data"]["poiInfo"]);
      this.openPoiDetailPage(args["data"]["poiInfo"]);
      mapView._mapSDK["on"]("poiClick", this.onPoiClick, this);
    },

    onHideByPushStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView.pushState(true);
      mapView._mapSDK["off"]("poiClick", this.onPoiClick, this);
    },

    onShowByPopStack: function (args) {
      this._super(args);
      var mapView = this._app._mapView;
      mapView.popState();
      mapView._mapSDK["on"]("poiClick", this.onPoiClick, this);
    },

    onStateEnd: function (args) {
      this._super(args);
      var mapView = this._app._mapView;
      mapView._mapSDK["off"]("poiClick", this.onPoiClick, this);
    },

    onPoiClick: function (sender, feature) {
      setTimeout(function () {
        sender.openPoiDetailPage(feature["properties"]);
      }, 0);
    },

    // open PoiDetail
    openPoiDetailPage: function (poiInfo) {
      const thisObject = this;
      const bdid = thisObject._app._mapView._mapSDK["getCurrentBDID"]() || "";
      const token = thisObject._app._params.token;
      const arealType = "outdoor";
      if (bdid) {
        arealType = "indoor";
      }
      const floorId = poiInfo["floorId"];
      const floorName = "",;
        floorCnName = "";
      if (floorId && thisObject._app._mapView.currBuilding) {
        const floorInfo = thisObject._app._mapView.currBuilding["getFloorInfo"](floorId);
        floorName = floorInfo["flname"];
        floorCnName = floorInfo["flcnname"];
      }
      const args = {
        method: "openPoiDetailPage",
        data: {
          bdid: bdid,
          token: token,
          arealType: arealType,
          poiInfo: {
            featureId: poiInfo["poiId"] || poiInfo["id"],
            text: poiInfo["text"],
            lon: poiInfo["lon"],
            lat: poiInfo["lat"],
            bdid: poiInfo["bdid"] || bdid,
            floorId: poiInfo["floorId"],
            floorName: poiInfo["floorName"] || floorName,
            address: poiInfo["address"] || floorCnName,
            detail: poiInfo["detailed"] || "",
          },
        },
      };

      const mapView = thisObject._app._mapView;
      if (poiInfo["bdid"] && poiInfo["floorId"]) {
        mapView._mapSDK["changeFloor"](poiInfo["bdid"], poiInfo["floorId"]);
      }

      this.showMarker(args.data["poiInfo"]);
      this._poiDetailView.updateData(args["data"]);
      this._searchView.updateInputText(poiInfo["text"] || "");
    },

    showMarker: function (poiInfo) {
      const thisObject = this;
      thisObject.clearAllRenderObject();
      const markerOption = {
        featureId: poiInfo["featureId"],
        lon: poiInfo["lon"],
        lat: poiInfo["lat"],
        bdid: poiInfo["bdid"],
        floorId: poiInfo["floorId"],
        imageUrl: "red_dot",
        highlightImageUrl: "red_dot",
        name: poiInfo["text"],
        text: poiInfo["text"],
        "text-anchor": "top",
        scale: 0.5,
        showText: true,
      };
      const mapSDK = thisObject._app._mapView._mapSDK;
      const marker = new daximap["DXSceneMarker"]();
      marker["initialize"](mapSDK, markerOption);
      marker.id = daxiapp["utils"].createUUID();
      marker["addToMap"]();

      mapSDK["jumpTo"]({
        lon: poiInfo["lon"],
        lat: poiInfo["lat"],
        // zoomLevel:18,
        bdid: poiInfo["bdid"],
        floorId: poiInfo["floorId"],
      });

      thisObject._renderObjects.push(marker);
    },

    // Run Command
    runCommond: function (command) {
      // var thisObject = this;
      // if(args.method = "openMainPoiPage"){
      //     thisObject.openMainPoiPage(command);
      // }else if(args.method == "showPois"){
      //     thisObject.showPois(command);
      // }else if(args.method == "openSearchPage"){
      //     thisObject.openSearchPage(command);
      // }
    },
  });

  daxiapp["MapStatePoiDetail"] = MapStatePoiDetail;
})(window);
