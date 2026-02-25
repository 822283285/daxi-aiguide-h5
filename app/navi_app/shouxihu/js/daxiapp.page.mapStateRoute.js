(function (global) {
  "use strict";
  var daxiapp = global["DaxiApp"] || {};
  var daximap = global["DaxiMap"] || {};
  var domUtils = daxiapp["dom"];
  var dxUtils = daxiapp["utils"];

  var naviMath = daxiapp["naviMath"];
  var MapStateClass = daxiapp["MapStateClass"];
  var MapStateRoute = MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "MapStateRoute";
    },

    initialize: function (app, container) {
      this._super(app, container);
      var thisObject = this;
      thisObject.name = thisObject.pageName = "route_view_page";
      var basicMap_html = '<div id="' + thisObject.pageName + '" class="route_page_container"></div>';
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#" + thisObject.pageName);
      thisObject._bdid = "";
      thisObject._token = app._params["token"];
      thisObject._currentRoute = null;
      thisObject._startPoint = { lon: 0, lat: 0, bdid: "", floorId: "", name: "", address: "", floorName: "" };
      thisObject._endPoint = { lon: 0, lat: 0, bdid: "", floorId: "", name: "", address: "", floorName: "" };
      thisObject._routeheaderView = new daxiapp["DXRouteSelectorHeaderView"](app, thisObject._dom);
      thisObject._routeheaderView.init(
        {},
        {
          onRouteStrategySelectChanged: function (sender, e) {},
          OnClickExitRoutePage: function (sender, e) {
            app._stateManager.goBack();
          },
          OnStartTextViewClicked: function (sender, e) {
            thisObject.openSelectStartEndPage(e);
          },
          OnEndTextViewClicked: function (sender, e) {
            thisObject.openSelectStartEndPage(e);
          },
          OnChangeStartEndPos: function (sender, e) {
            thisObject.startEndPosSwitch(e);
          },
        }
      );

      thisObject._routeTransitListView = new daxiapp["DXRouteTransitListView"](app, thisObject._dom);
      thisObject._routeTransitListView.init({
        OnRouteTransitSelectChanged: function (sender, e) {},
        OnStartNavigationClicked: function (sender, e) {
          //开始导航
          var currentRouteSegments = thisObject._currentRouteSegments;
          var segments = currentRouteSegments["segments"];
          // var data = segments[thisObject.routeIndex];
          if (thisObject.routeIndex < segments.length) {
            thisObject.startNavigation();
          }
        },
        OnStartSimulateClicked: function (sender, e) {
          //startSimulate
          var currentRouteSegments = thisObject._currentRouteSegments;
          var segments = currentRouteSegments["segments"];
          var data = segments[thisObject.routeIndex];
          if (thisObject.routeIndex == segments.length - 1 && data["routetype"] != 3) {
            var params = {
              text: "暂不支持室外模拟导航",
              confirmCB: function () {
                // nextToRouteSegment();
              },
            };
            daxiapp["domUtil"].dialogWithModal(params);
            return;
          }
          if (thisObject.routeIndex < segments.length) {
            thisObject.startSimulate();
          }
        },
        onRouteErrorClicked: function (sender, state) {
          if (state) {
            if (state == "noStartPoint") {
              var data = thisObject._routeheaderView.getStartPoint();
            } else {
              var data = thisObject._routeheaderView.getEndPoint();
            }
            thisObject.openSelectStartEndPage(data);
            return;
          }
          thisObject.searchRoute();
        },
      });
      thisObject._routeTransitListView.setRealNaviBtn("语音导航");
      var mapView = app._mapView;
      var mapSDK = mapView._mapSDK;
      mapSDK["on"]("changeFloor", function (sender, floorId) {
        if (thisObject.visible) {
          thisObject.boundBoxByRoute();
        }
      });
      mapSDK["on"]("explodedViewChanged", function (sender, val) {
        if (!thisObject.visible) {
          return;
        }
        if (thisObject.explodedRouteLayer) {
          thisObject.explodedRouteLayer.visible = val;
          thisObject.dxRouteManager.visible = !val;
          return;
        }
        if (val) {
          var routeData = mapView._naviManager.getSelectedRouteData();
          routeData && (thisObject.explodedRouteLayer = DaxiMapControl["createIndoorRoute"](mapView._mapSDK, { route: routeData["segments"] }));
          thisObject.dxRouteManager.visible = false;
        }
      });

      this.show(false);
    },

    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) return;
      var thisObject = this;
      thisObject.params = dxUtils.copyData(args);
      var mapView = this._app._mapView;
      mapView.setTopViewHeight(94);
      mapView.setBottomViewHeight(66);
      mapView._mapSDK.setPadding({
        bottom: 66,
        top: 84,
      });
      if (!thisObject.params["startPoint"] || !thisObject.params["startPoint"]["lon"] || !thisObject.params["startPoint"]["lat"]) {
        //没有起点定位成功的时候用定位点即我的位置 posMode myPosition
        thisObject.params["startPoint"] = {};
        var posInfo = mapView._locationManager["getMyPositionInfo"]();
        if (posInfo["position"][0] && posInfo["position"][1]) {
          thisObject.params["startPoint"]["lon"] = posInfo["position"][0];
          thisObject.params["startPoint"]["lat"] = posInfo["position"][1];
          thisObject.params["startPoint"]["floorId"] = posInfo["floorId"];
          thisObject.params["startPoint"]["bdid"] = posInfo["bdid"];
          thisObject.params["startPoint"]["name"] = "我的位置";
          thisObject.params["startPoint"]["posMode"] = "myPosition";
        }
      }
      if (thisObject.params["startPoint"]) {
        var target = thisObject._startPoint;
        var pointInfo = thisObject.params["startPoint"];
        target["lon"] = pointInfo["lon"] || 0;
        target["lat"] = pointInfo["lat"] || 0;
        target["bdid"] = pointInfo["bdid"] || "";
        target["floorId"] = pointInfo["floorId"] || "";
        target["name"] = pointInfo["name"] || pointInfo["text"] || "";
        target["address"] = pointInfo["address"] || "";
        target["posMode"] = pointInfo["posMode"] || "";
        target["poiId"] = pointInfo["poiId"] || pointInfo["id"];
      }
      // if(thisObject.params["endPoint"] && thisObject.params["endPoint"]["lon"]){
      if (thisObject.params["endPoint"]) {
        var target = thisObject._endPoint;
        var pointInfo2 = thisObject.params["endPoint"];
        target["poiId"] = pointInfo2["poiId"] || pointInfo2["id"];
        target["lon"] = pointInfo2["lon"];
        target["lat"] = pointInfo2["lat"];
        target["bdid"] = pointInfo2["bdid"] || "";
        target["floorId"] = pointInfo2["floorId"] || "";
        target["name"] = pointInfo2["name"] || pointInfo2["text"] || "";
        target["address"] = pointInfo2["address"] || "";
        target["posMode"] = pointInfo2["posMode"] || "";
      }
      thisObject._routeheaderView.commandChanged(thisObject, thisObject.params);
      thisObject.searchRouteTimer = setTimeout(function (e) {
        thisObject.searchRoute();
      }, 0);
      thisObject.explodedRouteLayer = null;
    },

    onHideByPushStack: function (args) {
      this.removeExplodedRoute();
      this._super(args);
      var mapView = this._app._mapView;
      mapView.pushState(true);
      mapView._mapSDK.setPadding({
        bottom: 44,
        top: 0,
      });
    },
    removeExplodedRoute: function () {
      var mapView = this._app._mapView;
      mapView._mulityFloorCtrl &&
        (mapView._mulityFloorCtrl["setVisible"](false), mapView._mapSDK["getExplodedView"]() ? mapView._mapSDK["setExplodedView"](false) : "");
      if (this.explodedRouteLayer) {
        this.explodedRouteLayer["removeFromMap"]();
        this.explodedRouteLayer = null;
      }
    },
    showExplodedView: function () {
      var mapView = this._app._mapView;
      if (mapView._mulityFloorCtrl) {
        if (
          this._currentRouteSegments &&
          this._currentRouteSegments["segments"][0]["detail"] &&
          this._currentRouteSegments["segments"][0]["detail"]["steps"].length > 1
        ) {
          mapView._mapSDK["setExplodedView"](true);
        }
        mapView._mulityFloorCtrl["setVisible"](true);
      }
    },

    onShowByPopStack: function (args) {
      this._super(args);
      var mapView = this._app._mapView;
      mapView.popState();
      mapView.setTopViewHeight(94);
      mapView.setBottomViewHeight(66);
      mapView._mapSDK.setPadding({
        bottom: 66,
        top: 84,
      });
      if (this.dxRouteManager) {
        this.showExplodedView();
      }
    },
    onStateEnd: function (args) {
      this.removeExplodedRoute();
      this._super(args);
      this._app._mapView._mapSDK.setPadding({
        bottom: 44,
        top: 0,
      });
      if (this.searchRouteTimer) {
        clearTimeout(this.searchRouteTimer);
        this.searchRouteTimer = null;
      }
      this.dxRouteManager = null;
    },

    // Run Command
    runCommond: function (command) {
      var thisObject = this;
    },

    ///////////////////////////////////////////////
    // Other Method
    ///////////////////////////////////////////////
    startNavigation: function () {
      var data = {
        method: "startNavigation",
        startPoint: this._startPoint,
        endPoint: this._endPoint,
      };

      this._app._stateManager.pushState("MapStateNavi", data);
    },

    startSimulate: function () {
      var data = {
        method: "startSimulate",
        startPoint: this._startPoint,
        endPoint: this._endPoint,
      };

      this._app._stateManager.pushState("MapStateSimulateNavi", data);
    },

    openSelectStartEndPage: function (data) {
      var thisObject = this;
      var pointType = data["pointType"];
      if (pointType == "startPoint") {
        data["endPoint"] = dxUtils.copyData(thisObject._endPoint);
      } else {
        data["startPoint"] = dxUtils.copyData(thisObject._startPoint);
      }
      var mapSDK = thisObject._app._mapView._mapSDK;
      // 当前地图点位
      var token = thisObject._app._params.token;
      var bdid = mapSDK["getCurrentBDID"]();
      var floorId = mapSDK["getCurrentFloorId"]();
      var pos = mapSDK["getPosition"]();
      data["token"] = token;
      data["bdid"] = bdid;
      data["floorId"] = floorId;
      data["position"] = [pos["lon"], pos["lat"]];

      var command = {
        method: "openChangeStartEndPointPage",
        data: data,
      };

      var page = thisObject._app._stateManager.pushState("MapStateChangeStartEndPoint", command);
      page._once("selectPointCallback", function (sender, selectPointResult) {
        if (selectPointResult.retVal == "OK") {
          thisObject.onStartEndPointChanged(selectPointResult["data"]);
        } else {
          thisObject.showExplodedView();
        }
      });
    },

    onStartEndPointChanged: function (params) {
      var thisObject = this;
      var pointType = params["pointType"];
      var pointInfo = params[params["pointType"]];
      var target;
      if (pointType == "startPoint") {
        target = thisObject._startPoint = pointInfo;
        thisObject._routeheaderView.setStartPoint(pointInfo);
      } else {
        target = thisObject._endPoint = pointInfo;
        thisObject._routeheaderView.setEndPoint(pointInfo);
      }
      if (pointInfo["lon"] == undefined || !pointInfo["lon"] == undefined) {
        // 参数错误 起终点不能为空
        return;
      }

      target["lon"] = pointInfo["lon"];
      target["lat"] = pointInfo["lat"];
      target["bdid"] = pointInfo["bdid"] || "";
      target["floorId"] = pointInfo["floorId"] || "";
      target["name"] = pointInfo["name"] || pointInfo["text"] || "";
      target["address"] = pointInfo["address"] || "";
      target["posMode"] = pointInfo["posMode"] || "";

      thisObject.searchRoute();
    },

    startEndPosSwitch: function (data) {
      var thisObject = this;
      thisObject._startPoint = data["startPoint"];
      thisObject._endPoint = data["endPoint"];
      thisObject.searchRoute();
    },

    searchRoute: function () {
      var thisObject = this;
      var startPoint = thisObject._startPoint;
      var endPoint = thisObject._endPoint;
      thisObject.clearAllRenderObject();
      thisObject.removeExplodedRoute();
      if (startPoint.floorId == endPoint.floorId) {
        if (startPoint.lon == endPoint.lon && startPoint.lat == endPoint.lat) {
          thisObject._routeTransitListView.setBottomVisible(true, "failed", "起点终点重合,请重新确认起终点");
          return;
        } else if (naviMath.getGeodeticCircleDistance({ x: startPoint.lon, y: startPoint.lat }, { x: endPoint.lon, y: endPoint.lat }) < 6) {
          thisObject._routeTransitListView.setBottomVisible(true, "failed", "目的地在您附近请自行前往");
          return;
        }
      }
      var mapView = this._app._mapView;
      mapView._naviManager.registerCallback({
        onCalculateRouteSuccess: function (data) {
          if (!thisObject.visible) {
            return;
          }
          mapView._mapSDK["easeTo"](thisObject._startPoint);
          //路线计算成功
          if (data["route"] && data["route"].length == 0) {
            thisObject._routeTransitListView.setBottomVisible(true, "failed", data["errMsg"] || "没有请求到路线");
            return;
          }
          if (data["transits"] && data["transits"].length == 0) {
            thisObject._routeTransitListView.setBottomVisible(true, "failed", data["errMsg"] || "没有请求到路线");
            return;
          }
          thisObject.onRouteReviced(data);
          thisObject._routeTransitListView.setBottomVisible(true, "succeed");
        },
        onCalculateRouteFailure: function (data) {
          if (!thisObject.visible) {
            return;
          }
          //路线计算失败
          // console.log("onCalculateRouteFailure errorCode:" + code);
          thisObject._routeTransitListView.setBottomVisible(true, "failed", data["errMsg"] || "");
        },
      });

      if (!startPoint["lon"]) {
        // tip 请选择起点
        thisObject._routeTransitListView.setBottomVisible(true, "noStartPoint");
        return;
      }
      if (!endPoint["lon"]) {
        // tip 请选择终点
        thisObject._routeTransitListView.setBottomVisible(true, "noEndPoint");
        return;
      }
      if (startPoint["posMode"] == "myPosition") {
        thisObject._routeTransitListView.activeNaviBtn(true);
        if (thisObject._app._config.indoorHideSimulateNavi && startPoint.bdid && startPoint.floorId) {
          thisObject._routeTransitListView.hideSimulateBtn();
        } else {
          thisObject._routeTransitListView.showSimulateBtn();
        }
      } else {
        thisObject._routeTransitListView.activeNaviBtn(false);
        thisObject._routeTransitListView.showSimulateBtn();
      }
      // 请求路线
      var naviManager = this._app._mapView._naviManager;
      thisObject._routeTransitListView.showLoading();

      if (naviManager) {
        var transittype = thisObject._app._config.transittype;
        transittype = transittype == undefined ? 0 : transittype;
        if (startPoint["floorId"] && startPoint["bdid"]) {
          startPoint["idtype"] = 3;
        } else {
          startPoint["idtype"] = transittype; //2;
        }
        if (endPoint["floorId"] && endPoint["bdid"]) {
          endPoint["idtype"] = 3;
        } else {
          endPoint["idtype"] = transittype;
        }
        var bdid = startPoint["bdid"] || endPoint["bdid"] || "";
        var params = { startPoint: startPoint, endPoint: endPoint, token: thisObject._token, bdid: bdid, includeStartEnd: "false", transittype: transittype };

        naviManager["queryRoutePath"](params); //,thisObject.onRouteReviced,thisObject.onRouteSearchError);
      }
    },

    onRouteReviced: function (data) {
      var thisObject = this;
      thisObject.routeData = data;

      thisObject.routeIndex = 0;
      var mapView = this._app._mapView;
      var naviManager = mapView._naviManager;
      naviManager.selectRouteId(0);
      var mapSDK = mapView._mapSDK;

      var dxRouteManager = new daximap["DXRouteManager"]();
      dxRouteManager["initialize"](mapSDK);
      if (data["route"]) {
        thisObject._currentRouteSegments = { segments: data.route };
        dxRouteManager["setRouteDatas"]([data]);
      } else if (data["transits"]) {
        thisObject._currentRouteSegments = data["transits"][0];
        dxRouteManager["setRouteDatas"](data["transits"]);
      }
      thisObject.dxRouteManager = dxRouteManager;
      thisObject._renderObjects.push(dxRouteManager);
      var startPoint = this._startPoint,
        endPoint = this._endPoint;
      var isFullRouteView = true;
      if (startPoint["bdid"] && startPoint["bdid"] == endPoint["bdid"]) {
        isFullRouteView = false;
      }
      this.boundBoxByRoute(isFullRouteView);
      // if(thisObject._currentRouteSegments["segments"][0]["detail"] && thisObject._currentRouteSegments["segments"][0]["detail"]["steps"].length>1){
      this.showExplodedView();
      // }
    },
    boundBoxByRoute: function (isFullView) {
      var mapSDK = this._app._mapView._mapSDK;
      if (isFullView) {
        var bdid = "",
          floorId = "";
      } else {
        var bdid = mapSDK["getCurrentBDID"](),
          floorId = mapSDK["getCurrentFloorId"]();
      }
      var ret = DXGetPolyLineBoundaryRecursiveVisitor(mapSDK["getRootScene"](), bdid, floorId).visit();
      var diffLon = 0; //e["lon"] - (bbox._min[0] + bbox._max[0]) * 0.5;
      var diffLat = 0; //e["lat"] - (bbox._min[1] + bbox._max[1]) * 0.5;
      if (ret.isSuccess) {
        var bbox = ret.aabb;
        var bounds = [bbox._min[0] + diffLon, bbox._min[1] + diffLat, bbox._max[0] + diffLon, bbox._max[1] + diffLat];
        mapSDK["fitBounds"]({
          bounds: bounds,
          duration: 300,
          padding: 10,
        });
      }
    },

    onRouteSearchError: function (data) {
      thisObject.routeData = null;
      thisObject.routeIndex = 0;
    },
  });
  daxiapp["MapStateRoute"] = MapStateRoute;
})(window);
