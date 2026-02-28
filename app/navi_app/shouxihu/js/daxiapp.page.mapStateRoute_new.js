(function (global) {
  "use strict";
  const daxiapp = global["DaxiApp"] || {};
  const daximap = global["DaxiMap"] || {};
  const domUtils = daxiapp["dom"];
  const dxUtils = daxiapp["utils"];
  const naviMath = daxiapp["naviMath"];
  const MapStateClass = daxiapp["MapStateClass"];

  /**
   * 格式化距离显示
   * @param {number} distance - 距离（米）
   * @returns {string} 格式化后的距离字符串
   */
  function formatDistance(distance) {
    if (distance && distance > 1000) {
      return `${(distance / 1000).toFixed(1)}公里`;
    }
    return `${~~distance}米`;
  }

  /**
   * 设置点位的 idtype
   * @param {Object} point - 点位对象
   * @param {number} transittype - 交通类型
   */
  function setIdType(point, transittype) {
    if (point["floorId"] && point["bdid"]) {
      point["idtype"] = 3;
    } else {
      point["idtype"] = transittype;
    }
  }

  /**
   * 将源点位信息赋值到目标对象
   * @param {Object} target - 目标对象
   * @param {Object} source - 源点位信息
   */
  function assignPointInfo(target, source) {
    target["lon"] = source["lon"] || 0;
    target["lat"] = source["lat"] || 0;
    target["bdid"] = source["bdid"] || "";
    target["floorId"] = source["floorId"] || "";
    target["name"] = source["name"] || source["text"] || "";
    target["address"] = source["address"] || "";
    target["posMode"] = source["posMode"] || "";
    target["poiId"] = source["poiId"] || source["id"];
  }

  /**
   * 根据建筑类型获取室内/室外名称
   * @param {Object} config - 应用配置对象
   * @param {boolean} isIndoor - 是否室内
   * @returns {string} 对应的名称
   */
  function getBuildingTypeName(config, isIndoor) {
    const buildingType = config["buildingType"];
    if (isIndoor) {
      if (buildingType == "station") {
        return window["langData"]["indoor:station"] || "站内";
      }
      if (buildingType == "library" || buildingType == "meeting") {
        return window["langData"]["indoor:library"] || "馆内";
      }
      return null;
    } else {
      if (buildingType == "station") {
        return window["langData"]["outdoor"] || "站外";
      }
      if (buildingType == "library" || buildingType == "meeting") {
        return "馆外";
      }
      return "室外";
    }
  }
  const MapStateRoute = MapStateClass.extend({;
    __init__: function () {
      this._super();
      this._rtti = "MapStateRoute";
    },

    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      thisObject.name = thisObject.pageName = "route_view_page";
      const basicMap_html = `<div id="${thisObject.pageName}" class="route_page_container"><div class="goback_radiubtn" style="dispaly:none"></div></div>`;
      domUtils.append(thisObject._container, basicMap_html);

      const driverRouteDom = '<div class="driverRoute"></div>';
      const busRouteDom = '<div class="busRoute"></div>';
      const walkRouteDom = '<div class="walkRoute"></div>';
      thisObject._dom = domUtils.find(thisObject._container, `#${thisObject.pageName}`);
      domUtils.append(thisObject._dom, driverRouteDom);
      domUtils.append(thisObject._dom, busRouteDom);
      domUtils.append(thisObject._dom, walkRouteDom);
      thisObject._driverRouteDom = domUtils.find(thisObject._container, ".driverRoute");
      thisObject._busRouteDom = domUtils.find(thisObject._container, ".busRoute");
      thisObject._walkRouteDom = domUtils.find(thisObject._container, ".walkRoute");
      thisObject.height = thisObject._dom.height() || window.innerHeight;
      thisObject.gobackBtn = domUtils.find(thisObject._dom, ".goback_radiubtn");
      thisObject._bdid = "";
      thisObject._token = app._params["token"];
      thisObject._currentRoute = null;
      thisObject._startPoint = { lon: 0, lat: 0, bdid: "", floorId: "", name: "", address: "", floorName: "" };
      thisObject._endPoint = { lon: 0, lat: 0, bdid: "", floorId: "", name: "", address: "", floorName: "" };
      const routeParams = {
        strategys: (app._config["route"] && app._config["route"]["strategys"]) || {},
      };
      if (routeParams["strategys"] && routeParams["strategys"]["indoor"]) {
        routeParams["strategys"]["indoor"].forEach(function (item) {
          if (item["default"]) {
            thisObject.strategy = item["strategy"];
          }
        });
      }
      if (routeParams["strategys"] && routeParams["strategys"]["outdoor"]) {
        routeParams["strategys"]["outdoor"].forEach(function (item) {
          if (item["default"]) {
            thisObject.transittype = item["strategyCode"];
          }
        });
      }
      if (app._config["travelVersion"] == "v2") {
        thisObject._driverRouteView = new daxiapp["DXDriverRouteDetailView"](routeParams, thisObject._driverRouteDom);
        thisObject._driverRouteView.init(thisObject._driverRouteDom, {
          listener: {
            onRouteIndexChanged: function (index) {
              thisObject.openRouteDetail(thisObject.routeData, index);
            },
          },
        });
        thisObject._driverRouteView.hide();

        thisObject._busRouteView = new daxiapp["DXBusRouteDetailView"](routeParams, thisObject._busRouteDom);
        thisObject._busRouteView.init(thisObject._busRouteDom, {
          listener: {
            onRouteIndexChanged: function (index) {},
          },
        });
        thisObject._busRouteView.hide();

        thisObject._walkRouteView = new daxiapp["DXWalkRouteDetailView"](routeParams, thisObject._walkRouteDom);
        thisObject._walkRouteView.init(thisObject._walkRouteDom, {
          listener: {
            onRouteIndexChanged: function (index) {
              thisObject.openRouteDetail(thisObject.routeData, index);
            },
          },
        });
        thisObject._walkRouteView.hide();
        thisObject._routeheaderView = new daxiapp["DXRouteSelectorHeaderView4"](routeParams, thisObject._dom);
      } else {
        thisObject._routeheaderView = new daxiapp["DXRouteSelectorHeaderView3"](routeParams, thisObject._dom);
      }
      thisObject._routeheaderView.init({
        onRouteStrategySelectChanged: function (data) {
          const isChanged = false;
          if (data["strategy"] != undefined && thisObject.strategy != data["strategy"]) {
            thisObject.strategy = data["strategy"];
            isChanged = true;
          }
          if (data["transittype"] != undefined && thisObject.transittype != data["transittype"]) {
            thisObject.transittype = data["transittype"];
            isChanged = true;
          }
          if (isChanged && thisObject._startPoint["lon"] && thisObject._startPoint["lat"] && thisObject._endPoint["lon"] && thisObject._endPoint["lat"]) {
            thisObject.searchRoute();
          }
        },
        onSegmentRouteActive: function (index, segInfo) {
          thisObject._routeTransitListView.changeSegmentRouteInfo(index);
          if (segInfo && segInfo["routetype"] != 3) {
            const bounds = [segInfo["startPoint"]["lon"], segInfo["startPoint"]["lat"], segInfo["endPoint"]["lon"], segInfo["endPoint"]["lat"]];
            mapSDK["fitBounds"]({
              bounds: bounds,
              duration: 300,
              padding: 10,
            });
          } else {
            mapSDK.changeFloor(segInfo["startPoint"]["bdid"], segInfo["startPoint"]["floorId"]);
            thisObject.boundBoxByRoute(false, segInfo["startPoint"]["bdid"], segInfo["startPoint"]["floorId"]);
          }
        },
        OnClickExitRoutePage: function (e) {
          app._stateManager.goBack();
        },
        OnStartTextViewClicked: function (e) {
          thisObject.openSelectStartEndPage(e);
        },
        OnEndTextViewClicked: function (e) {
          thisObject.openSelectStartEndPage(e);
        },
        OnChangeStartEndPos: function (e) {
          thisObject.startEndPosSwitch(e);
        },
        onScanBtnClicked: function () {
          app.nativeSDKAPI &&
            app.nativeSDKAPI["scanQRCode"]({
              qrcodeType: app._config["qrcodeType"] || 1,
              needResult: 1,
              success: function (str, rawStr) {
                const data = JSON.parse(str);
                window["setWXLocationResult"](data);
                thisObject._routeheaderView.setStartPoint(data);
                thisObject._startPoint = data;
                thisObject.searchRoute();
              },
              failed: function (data) {
                console.log(data);
                alert(JSON.stringify(data));
              },
            });
        },
        onViewChanged: function (data) {
          thisObject._app._mapView.setTopViewHeight(data["height"] + 6);
        },
        onOutdoorTypeClicked: function (transittype) {
          thisObject.transittype = transittype;
          thisObject.searchRoute();
        },
      });
      if (thisObject._app._config["travelVersion"] == "v2") {
        thisObject._routeTransitListView = new daxiapp["DXRouteTransitListView3"](app, thisObject._dom);
      } else {
        thisObject._routeTransitListView = new daxiapp["DXRouteTransitListView2"](app, thisObject._dom);
      }
      thisObject._routeTransitListView.init(thisObject._dom, {
        listener: {
          onViewChanged: function (data) {
            thisObject._app._mapView.setBottomViewHeight(thisObject.height - data["top"]);
          },
          triggerStartNavi: function (data) {
            if (thisObject.params.endPoint && thisObject.params.endPoint.code) {
              data.code = thisObject.params.endPoint.code;
            }
            thisObject.startNavigation(data);
          },
          triggerStartSimulateNavi: function (data) {
            if (thisObject.params.endPoint && thisObject.params.endPoint.code) {
              data.code = thisObject.params.endPoint.code;
            }
            thisObject.startSimulate(data);
          },
          triggerTirdNavi: function (data) {
            app.jsBridge.openOutdoorRoutePage &&
              app.jsBridge.openOutdoorRoutePage({ targetLon: data["lon"], targetLat: data["lat"], targetName: data["name"] });
          },
          onRouteErrorClicked: function (sender, state) {
            if (state) {
              if (state == "noStartPoint") {
                const data = thisObject._routeheaderView.getStartPoint();
              } else {
                const data = thisObject._routeheaderView.getEndPoint();
              }
              thisObject.openSelectStartEndPage(data);
              return;
            }
            thisObject.searchRoute();
          },
          triggerRouteBrowse: function (data) {
            const mapView = app._mapView;
            const pointInfo;
            switch (data["type"]) {
              case "browse":
                break;
              case "start":
                pointInfo = thisObject._startPoint;
                break;
              case "end":
                pointInfo = thisObject._endPoint;
                break;
              case "indoorPoint":
                pointInfo = data["point"];
                break;
              default:
            }
            if (pointInfo) {
              pointInfo["zoom"] = 19;
              mapView._mapSDK["changeFloor"](pointInfo["bdid"], pointInfo["floorId"]);
              mapView._mapSDK["easeTo"](pointInfo);
            } else {
              thisObject.boundBoxByRoute(true);
            }
          },
          onSelectPointTipClicked: function (data) {
            if (data["pointType"]) {
              thisObject.openSelectStartEndPage(data);
            }
          },
          triggerRouteIndex: function (index) {
            thisObject.onRouteReviced(thisObject.routeData, index);
            thisObject.routeActiveIndex = index;
          },
          triggerRouteDetail: function () {
            const index = thisObject.routeActiveIndex || 0;
            thisObject.openRouteDetail(thisObject.routeData, index);
          },
          onOpenPano: function (sender, data) {
            if (thisObject.panoData) {
              thisObject.openBrowseMapSate();
              const panoUrl = thisObject._app._config["panoUrl"];
              const bdid = thisObject._app._mapView._mapSDK.getCurrentBDID();
              panoUrl = panoUrl.replace("{{bdid}}", bdid);
              thisObject._app.panoInstance.show();
              thisObject._app.panoInstance.postMessage("creatPanoString", { server: panoUrl, panoData: thisObject.panoData });
            }
          },
        },
      });
      const mapView = app._mapView;
      const mapSDK = mapView._mapSDK;
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
          const routeData = mapView._naviManager.getSelectedRouteData();
          routeData && (thisObject.explodedRouteLayer = DaxiMapControl["createIndoorRoute"](mapView._mapSDK, { route: routeData["segments"] }));
          thisObject.dxRouteManager.visible = false;
        }
      });

      this.show(false);
    },

    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) return;
      const thisObject = this;
      thisObject.params = dxUtils.copyData(args);
      const mapView = this._app._mapView;
      mapView.setTopViewHeight(174);
      mapView.setBottomViewHeight(136);
      mapView._toBuildingCtrl.setVisible(false);
      if (thisObject.params["startPoint"]) {
        assignPointInfo(thisObject._startPoint, thisObject.params["startPoint"]);
      }
      if (thisObject.params["endPoint"]) {
        assignPointInfo(thisObject._endPoint, thisObject.params["endPoint"]);
      }
      if (
        !thisObject.params["startPoint"] ||
        !thisObject.params["startPoint"]["lon"] ||
        (!thisObject.params["startPoint"]["lat"] && mapView._locationManager.getLocationState() > -1)
      ) {
        // 没有起点定位成功的时候用定位点即我的位置 posMode myPosition
        thisObject.params["startPoint"] = {};
        const posInfo = mapView._locationManager["getMyPositionInfo"]();
        if (posInfo["position"][0] && posInfo["position"][1]) {
          thisObject.params["startPoint"]["lon"] = posInfo["position"][0];
          thisObject.params["startPoint"]["lat"] = posInfo["position"][1];
          thisObject.params["startPoint"]["floorId"] = posInfo["floorId"];
          thisObject.params["startPoint"]["bdid"] = posInfo["bdid"];
          thisObject.params["startPoint"]["name"] = window["langData"]["my:currentpos"] || "我的位置";
          thisObject.params["startPoint"]["posMode"] = "myPosition";
          this._startPoint = thisObject.params["startPoint"];
        } else {
          thisObject._routeheaderView.setVisible(true, { endPoint: thisObject.params["endPoint"] }, thisObject.strategy, thisObject.transittype);
          thisObject._routeTransitListView.setVisible(true, { endPoint: thisObject.params["endPoint"] }, thisObject.strategy, thisObject.transittype);
          return;
        }
      }

      if (!thisObject.params["endPoint"]) {
        thisObject._routeheaderView.setVisible(true, { startPoint: thisObject.params["startPoint"] }, thisObject.strategy, thisObject.transittype);
        thisObject._routeTransitListView.setVisible(true, { startPoint: thisObject.params["startPoint"] }, thisObject.strategy, thisObject.transittype);
        return;
      }
      if (args["routeType"] == 9) {
        thisObject.searchTaoshengRoute();
      } else {
        thisObject.searchRoute();
      }
      thisObject.explodedRouteLayer = null;
    },

    onHideByPushStack: function (args) {
      this.removeExplodedRoute();
      this._super(args);
      const mapView = this._app._mapView;
      mapView.pushState(true);
    },
    removeExplodedRoute: function () {
      const mapView = this._app._mapView;
      mapView._mulityFloorCtrl &&
        (mapView._mulityFloorCtrl["setVisible"](false), mapView._mapSDK["getExplodedView"]() ? mapView._mapSDK["setExplodedView"](false) : "");
      if (this.explodedRouteLayer) {
        this.explodedRouteLayer["removeFromMap"]();
        this.explodedRouteLayer = null;
      }
    },
    showExplodedView: function () {
      const mapView = this._app._mapView;
      if (mapView._mulityFloorCtrl) {
        if (
          this._currentRouteSegments &&
          this._currentRouteSegments["segments"][0]["routetype"] == 3 &&
          this._currentRouteSegments["segments"][0]["detail"] &&
          this._currentRouteSegments["segments"][0]["detail"]["steps"] &&
          this._currentRouteSegments["segments"][0]["detail"]["steps"].length > 1
        ) {
          mapView._mapSDK["setExplodedView"](true);
        }
        mapView._mulityFloorCtrl["setVisible"](true);
      }
    },

    onShowByPopStack: function (args) {
      this._super(args);
      const top = this._routeheaderView.getHeight();
      const bottom = this._routeTransitListView.getHeight();
      const mapView = this._app._mapView;
      mapView.setTopViewHeight(top + 6);
      mapView.setBottomViewHeight(bottom);
      mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap["UserTrackingMode"]["None"]);
    },
    onStateEnd: function (args) {
      this._app._mapView._toBuildingCtrl.setVisible(true);
      this.removeExplodedRoute();
      this._super(args);
      if (this.searchRouteTimer) {
        clearTimeout(this.searchRouteTimer);
        this.searchRouteTimer = null;
      }
      this.dxRouteManager = null;
    },
    startNavigation: function (params) {
      const data = {
        method: "startNavigation",
        startPoint: this._startPoint,
        endPoint: this._endPoint,
        segIndex: params["segindex"],
        routeType: this.params["routeType"],
        transittype: this.transittype,
        strategy: this.strategy,
      };
      if (params.code) {
        data.code = params.code;
      }
      this._app._stateManager.pushState("MapStateNavi", data);
    },

    startSimulate: function (params) {
      const data = {
        method: "startSimulate",
        startPoint: this._startPoint,
        endPoint: this._endPoint,
        segIndex: params["segindex"],
      };
      if (params.code) {
        data.code = params.code;
      }
      this._app._stateManager.pushState("MapStateSimulateNavi", data);
    },

    openSelectStartEndPage: function (data) {
      const thisObject = this;
      const pointType = data["pointType"];
      if (pointType == "startPoint") {
        data["endPoint"] = dxUtils.copyData(thisObject._endPoint);
      } else {
        data["startPoint"] = dxUtils.copyData(thisObject._startPoint);
      }
      const mapSDK = thisObject._app._mapView._mapSDK;
      const token = thisObject._app._params.token;
      const bdid = mapSDK["getCurrentBDID"]();
      const floorId = mapSDK["getCurrentFloorId"]();
      const pos = mapSDK["getPosition"]();
      data["token"] = token;
      data["bdid"] = bdid;
      data["floorId"] = floorId;
      data["position"] = [pos["lon"], pos["lat"]];

      const command = {
        method: "openChangeStartEndPointPage",
        data: data,
      };

      const page = thisObject._app._stateManager.pushState("MapStateChangeStartEndPoint", command);
      page._once("selectPointCallback", function (sender, selectPointResult) {
        if (selectPointResult.retVal == "OK") {
          thisObject.onStartEndPointChanged(selectPointResult["data"]);
        }
      });
    },

    onStartEndPointChanged: function (params) {
      const thisObject = this;
      const pointType = params["pointType"];
      const pointInfo = params[params["pointType"]];
      if (pointType == "startPoint") {
        thisObject._startPoint = pointInfo;
      } else {
        thisObject._endPoint = pointInfo;
      }
      if (pointInfo["lon"] == undefined) {
        return;
      }

      thisObject.searchRoute();
    },

    startEndPosSwitch: function (data) {
      const thisObject = this;
      thisObject._startPoint = data["startPoint"];
      thisObject._endPoint = data["endPoint"];
      thisObject.searchRoute();
    },

    searchRoute: function () {
      const thisObject = this;
      const startPoint = thisObject._startPoint;
      const endPoint = thisObject._endPoint;
      thisObject._routeheaderView.hide();
      thisObject.clearAllRenderObject();
      thisObject.removeExplodedRoute();
      if (thisObject._app._config["travelVersion"] == "v2") {
        thisObject.transittype = thisObject.transittype || 0;
        thisObject._routeheaderView.setVisible(true, { startPoint: startPoint, endPoint: endPoint }, thisObject.strategy, thisObject.transittype);

        const li = thisObject._routeheaderView._dom.find(".outdoorType li");
        li.forEach(function (item) {
          const tran = $(item).attr("data-transittype");
          if (tran == thisObject.transittype) {
            $(item).addClass("on").siblings().removeClass("on");
          }
        });
      } else {
        thisObject._routeheaderView.setVisible(true, { startPoint: startPoint, endPoint: endPoint }, thisObject.strategy, thisObject.transittype);
      }
      if (startPoint.floorId == endPoint.floorId) {
        if (startPoint.lon == endPoint.lon && startPoint.lat == endPoint.lat) {
          thisObject._routeTransitListView.setVisible(true, {
            errMsg: window["langData"]["startendpos:same:tip"] || "起点终点重合,请重新确认起终点",
            isSuccess: false,
          });
          return;
        } else if (naviMath.getGeodeticCircleDistance({ x: startPoint.lon, y: startPoint.lat }, { x: endPoint.lon, y: endPoint.lat }) < 6) {
          thisObject._routeTransitListView.setVisible(true, {
            errMsg: window["langData"]["nearby:targetPos:tip"] || "目的地在您附近请自行前往",
            isSuccess: false,
          });

          return;
        }
      }
      const mapView = this._app._mapView;
      mapView._naviManager.registerCallback({
        onCalculateRouteSuccess: function (data) {
          if (!thisObject.visible) {
            return;
          }
          thisObject._routeheaderView.show();
          mapView._mapSDK["easeTo"](thisObject._startPoint);
          if (data["route"] && data["route"].length == 0) {
            thisObject._routeheaderView.updateData(thisObject.params, thisObject.strategy);
            thisObject._routeTransitListView.setVisible(true, {
              isSuccess: false,
              errMsg: data["errMsg"] || window["langData"]["failed:getroute:navi"] || "规划路线失败",
            });
            return;
          }
          if (data["transits"] && data["transits"].length == 0) {
            thisObject._routeheaderView.updateData(thisObject.params, thisObject.strategy);
            thisObject._routeTransitListView.setVisible(true, {
              isSuccess: false,
              errMsg: data["errMsg"] || window["langData"]["failed:getroute:navi"] || "规划路线失败",
            });
            return;
          }
          thisObject.onRouteReviced(data);
        },
        onCalculateRouteFailure: function (data) {
          if (!thisObject.visible) {
            return;
          }
          data.isSuccess = false;
          thisObject._routeTransitListView.setVisible(true, data);
        },
      });

      if (!startPoint["lon"]) {
        thisObject._routeTransitListView.setVisible(true, {});
        return;
      }
      if (!endPoint["lon"]) {
        thisObject._routeTransitListView.setVisible(true, {});
        return;
      }
      const naviManager = this._app._mapView._naviManager;
      thisObject._routeTransitListView.showLoading();

      if (naviManager) {
        const transittype = thisObject.transittype;
        transittype = transittype == undefined ? 0 : transittype;
        setIdType(startPoint, transittype);
        setIdType(endPoint, transittype);
        const bdid = startPoint["bdid"] || endPoint["bdid"] || "";
        const params = {
          startPoint: startPoint,
          endPoint: endPoint,
          token: thisObject._token,
          bdid: bdid,
          includeStartEnd: "false",
          transittype: transittype,
          strategy: thisObject.strategy,
        };
        if (thisObject._app._config["simulation"]) {
          startPoint["floorId"] = thisObject._app._mapView.currBuildingInfo.bdInfo.data.initfloor;
          startPoint["posMode"] = null;
        }
        naviManager["queryRoutePath"](params);
      }
    },
    searchTaoshengRoute: function () {
      const thisObject = this;
      const app = thisObject._app;
      const startPoint = thisObject._startPoint;
      thisObject.clearAllRenderObject();
      thisObject.removeExplodedRoute();
      thisObject._routeheaderView.hide();
      thisObject.gobackBtn.show();
      const mapView = this._app._mapView;
      mapView._naviManager.registerCallback({
        onCalculateRouteSuccess: function (data) {
          if (!thisObject.visible) {
            return;
          }
          mapView._mapSDK["easeTo"](thisObject._startPoint);
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
          thisObject._routeTransitListView.setBottomVisible(true, "failed", data["errMsg"] || "");
        },
      });

      const naviManager = app._mapView._naviManager;
      thisObject._routeTransitListView.showLoading();

      if (naviManager) {
        const transittype = thisObject.transittype;
        transittype = transittype == undefined ? 0 : transittype;
        setIdType(startPoint, transittype);
        const bdid = startPoint["bdid"] || "";
        const params = {
          startPoint: startPoint,
          token: thisObject._token,
          bdid: bdid,
          includeStartEnd: "false",
          transittype: transittype,
          strategy: thisObject.strategy,
          routeType: 9,
          url: app._config["route"] && app._config["route"]["taoshengUrl"],
        };
        if (thisObject._app._config["simulation"]) {
          params["startPoint"]["posMode"] = "";
        }
        naviManager["queryRoutePath"](params);
        thisObject.queryRouteParams = params;
      }
    },
    onRouteReviced: function (data, index) {
      const thisObject = this;
      thisObject.routeData = data;
      thisObject.transittype = thisObject.transittype || 0;
      thisObject.routeIndex = index || 0;
      const mapView = this._app._mapView;
      const naviManager = mapView._naviManager;
      naviManager.selectRouteId(thisObject.routeIndex);
      thisObject.currentLoc = null;
      const mapSDK = mapView._mapSDK;
      if (!thisObject.dxRouteManager) {
        thisObject.dxRouteManager = new daximap["DXRouteManager"]();
        thisObject.dxRouteManager["initialize"](mapSDK);
      }
      thisObject.dxRouteManager.clearRoutes();
      if (data["route"]) {
        thisObject._currentRouteSegments = { segments: data.route };
        thisObject.dxRouteManager["setRouteDatas"]([data]);
      } else if (data["transits"]) {
        thisObject._currentRouteSegments = data["transits"];
        thisObject.dxRouteManager["setRouteDatas"](data["transits"], thisObject.routeIndex);
      }
      thisObject._renderObjects.push(thisObject.dxRouteManager);
      const startPoint = this._startPoint,;
        endPoint = this._endPoint;
      const routeSegData = { startPoint: startPoint, endPoint: endPoint };

      if (thisObject._currentRouteSegments && thisObject._currentRouteSegments.length) {
        thisObject._currentRouteSegments.forEach(function (item, index) {
          routeSegData["segments"] = [];
          const segments = item["segments"];
          item["disDesc"] = formatDistance(item["distance"]);
          item["timeDesc"] = naviMath.secondToDate(item["duration"]);
          segments.forEach(function (item, index) {
            const detail = item["detail"];
            const desc = detail["desc"] || "";
            const disDesc = formatDistance(detail["distance"]);
            const timeDesc = detail["timeDesc"];
            item["detail"]["disDesc"] = disDesc;
            item["detail"]["timeDesc"] = timeDesc;
            if (!detail["timeDesc"] && detail["duration"]) {
              timeDesc = naviMath.secondToDate(detail["duration"]);
              item["detail"]["timeDesc"] = timeDesc;
              if (!thisObject._app._config["travelVersion"]) {
                if (item["routetype"] == 0) {
                  timeDesc = `驾车需要${timeDesc}`;
                } else if (item["routetype"] == 1) {
                  timeDesc = `乘公交需要${timeDesc}`;
                } else if (item["routetype"] == 2) {
                  timeDesc = `步行需要${timeDesc}`;
                }
              }
            }
            if (index == 0) {
              item["startpoint"]["name"] = thisObject._startPoint["name"];
              item["startpoint"]["posMode"] = thisObject._startPoint["posMode"];
            }
            if (index == segments.length - 1) {
              item["endpoint"]["name"] = thisObject._endPoint["name"];
              item["endpoint"]["posMode"] = thisObject._endPoint["posMode"];
            }
            if (item["startpoint"]["bdid"] && item["startpoint"]["floorId"]) {
              const flInfo = mapSDK.getFloorInfo(item["startpoint"]["bdid"], item["startpoint"]["floorId"]);
              item["startpoint"]["flname"] = flInfo["flname"];
              item["startpoint"]["cname"] = flInfo["cname"];
            }
            if (item["endpoint"]["bdid"] && item["endpoint"]["floorId"]) {
              const flInfo = mapSDK.getFloorInfo(item["endpoint"]["bdid"], item["endpoint"]["floorId"]);
              item["endpoint"]["flname"] = flInfo["flname"];
              item["endpoint"]["cname"] = flInfo["cname"];
            }
            const name = getBuildingTypeName(thisObject._app._config, false);
            const segmentInfo = {
              startPoint: item["startpoint"],
              endPoint: item["endpoint"],
              name: item["name"] || (item["routetype"] != 3 ? name : ""),
              distance: "",
              disDesc: disDesc,
              timeDesc: timeDesc,
              desc: desc,
              routetype: item["routetype"],
            };
            if (item["routetype"] == 3) {
              const bdInfo = mapSDK.getBuildingInfo(item["startpoint"]["bdid"]);
              if (!segmentInfo["name"] && bdInfo) {
                const indoorName = getBuildingTypeName(thisObject._app._config, true);
                segmentInfo["name"] = indoorName || bdInfo["cn_name"];
              }
              segmentInfo["steps"] = detail["steps"];
              segmentInfo["steps"].forEach(function (step, index) {
                if (index == 0) {
                  step["startPoint"] = item["startpoint"];
                } else {
                  const origin = step["origin"].split(",");
                  step["startPoint"] = {
                    bdid: item["startpoint"]["bdid"],
                    floorId: step["floorId"],
                    lon: origin[0] * 1,
                    lat: origin[1] * 1,
                  };
                }
                if (index == segmentInfo["steps"].length - 1) {
                  step["endPoint"] = item["endpoint"];
                } else {
                  const destination = step["destination"].split(",");
                  step["endPoint"] = {
                    bdid: item["endpoint"]["bdid"],
                    floorId: step["floorId"],
                    lon: destination[0] * 1,
                    lat: destination[1] * 1,
                  };
                }
              });
              if (segmentInfo["startPoint"]["posMode"] != "myPosition" && thisObject._startPoint["posMode"] == "myPosition") {
                function locationChanged(sender, e) {
                  if (e["bdid"] && e["bdid"] == segmentInfo["startPoint"]["bdid"]) {
                    thisObject._routeTransitListView.changeSimulateToReal(e["bdid"]);
                    thisObject._routeheaderView.activeByBDID && thisObject._routeheaderView.activeByBDID(e["bdid"]);
                    mapView._locationManager.off("onLocationChanged", locationChanged);
                  }
                }
                mapView._locationManager.on("onLocationChanged", locationChanged);
              }
            } else {
              if (segmentInfo["endPoint"]["bdid"]) {
                const bdInfo = mapSDK.getBuildingInfo(segmentInfo["endPoint"]["bdid"]);
                segmentInfo["endPoint"]["targetName"] = bdInfo["cn_name"];
              }
            }
            routeSegData["segments"].push(segmentInfo);
          });
        });
      }
      if (!thisObject._app._config["travelVersion"]) {
        thisObject._routeheaderView.updateData(routeSegData, thisObject.strategy, thisObject.transittype);
        thisObject._routeTransitListView.setVisible(true, routeSegData);
      } else {
        if (thisObject.transittype == 0) {
          // 驾车更新顶部室内、室外，其他类型返回的数据格式不同，不做显示
          thisObject._routeheaderView.updateData(routeSegData, thisObject.strategy, thisObject.transittype);
          thisObject._routeTransitListView.setVisible(true, thisObject._currentRouteSegments, thisObject.routeIndex);
          thisObject._busRouteView.hide();
        } else if (thisObject.transittype == 1) {
          const busLine = [];
          thisObject._currentRouteSegments.forEach(function (item) {
            for (var i = 0; i < item.segments.length; i++) {
              const line = item.segments[i];
              if (line.routetype == 5) {
                busLine.push(item);
              }
            }
          });
          if (busLine.length) {
            thisObject._busRouteView.updateData(busLine, thisObject.routeIndex);
          } else {
            thisObject._routeTransitListView.setVisible(true, { errMsg: window["langData"]["no:bus:line"] || "无公交路线", isSuccess: false });
          }
        } else {
          thisObject._routeheaderView.updateData(routeSegData, thisObject.strategy, thisObject.transittype);
          thisObject._routeTransitListView.setVisible(true, thisObject._currentRouteSegments, thisObject.routeIndex);
          thisObject._busRouteView.hide();
        }
      }

      const isFullRouteView = true;
      if (startPoint["bdid"] && startPoint["bdid"] == endPoint["bdid"]) {
        isFullRouteView = false;
      }
      thisObject.boundBoxByRoute(isFullRouteView);
    },
    boundBoxByRoute: function (isFullView, _bdid, _floorId) {
      const mapSDK = this._app._mapView._mapSDK;
      if (isFullView) {
        const bdid = "",;
          floorId = "";
      } else {
        const bdid = _bdid || mapSDK["getCurrentBDID"](),;
          floorId = _floorId || mapSDK["getCurrentFloorId"]();
      }
      const ret = DXGetPolyLineBoundaryRecursiveVisitor(mapSDK["getRootScene"](), bdid, floorId).visit();
      if (ret.isSuccess) {
        const bbox = ret.aabb;
        const bounds = [bbox._min[0], bbox._min[1], bbox._max[0], bbox._max[1]];
        mapSDK["fitBounds"]({
          bounds: bounds,
          duration: 300,
          padding: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          },
        });
      }
    },

    onRouteSearchError: function (data) {
      this.routeData = null;
      this.routeIndex = 0;
    },
    openBrowseMapSate: function (command) {
      this._app._stateManager.pushState("MapStateBrowse", command);
    },
    openRouteDetail: function (routeData, index) {
      if (this.transittype == 0) {
        this._driverRouteView.updateData(routeData, index);
      } else if (this.transittype == 1) {
        this._busRouteView.updateData(routeData, index);
      } else if (this.transittype == 2) {
        this._walkRouteView.updateData(routeData, index);
      }
    },
  });
  daxiapp["MapStateRoute"] = MapStateRoute;
})(window);
