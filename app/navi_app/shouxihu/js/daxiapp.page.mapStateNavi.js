(function (global) {
  "use strict";
  var daxiapp = global["DaxiApp"] || {};
  var daximap = window["DaxiMap"] || {};
  var dxUtils = daxiapp["utils"];
  var domUtils = daxiapp["dom"];

  var MapStateClass = daxiapp["MapStateClass"];
  var MapStateNavi = MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "MapStateNavi";
    },

    initialize: function (app, container) {
      this._super(app, container);
      var thisObject = this;
      // var app  = thisObject._app;
      var basicMap_html = '<div id="navigation_page" class="navi_page"></div>';
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#navigation_page");
      thisObject._bdid = "";
      var naviManager = app._mapView._naviManager;
      thisObject._naviEndInfoView = new daxiapp["DXNaviEndInfoView"](app, thisObject._dom);
      thisObject._naviEndInfoView.init({
        onCloseButtonClicked: function () {
          naviManager["exitNavi"]();
          app._stateManager.goBack();
        },
      });
      thisObject._naviEndInfoView.hide();
      thisObject._naviTipView = new daxiapp["DXNaviTipView"](app, thisObject._dom);
      thisObject._naviTipView.init({
        onTap: function () {
          // naviManager["exitNavi();
          // app.mapStateManager.goBack();
        },
        triggerResume: function () {
          naviManager["resumeNavi"]();
        },
      });
      thisObject._naviTipView.hide();

      thisObject._naviBottomView = new daxiapp["DXNaviBottomView"](app, thisObject._dom);
      thisObject._naviBottomView.init({
        onExitButtonClicked: function () {
          var params = {
            text: "您确定退出导航",
            btn1: "取消",
            confirmCB: function () {
              thisObject.exitNaviModal = null;
              thisObject.setUserTrackingModeToNone();
              naviManager["exitNavi"]();
              app._stateManager.goBack();
            },
            cancelCB: function () {
              thisObject.exitNaviModal = null;
              naviManager["resumeNavi"]();
            },
          };
          if (!thisObject.exitNaviModal) {
            thisObject.exitNaviModal = daxiapp["domUtil"].dialogWithModal(params);
            naviManager["pauseNavi"]();
          }
        },
        onNaviButtonClicked: function () {
          naviManager["resumeNavi"]();
        },
      });
      thisObject._floorChangeView = new daxiapp["DXImageBtnComponent"](thisObject._dom);
      thisObject._floorChangeView.init({});
      thisObject._floorChangeView.setStyle(
        {
          "line-height": 1.5,
          background: "rgb(255, 255, 255)",
          "border-radius": "6px",
          color: "rgb(121, 121, 121)",
          "align-items": "center",
          "justify-content": "center",
          display: "flex",
          "box-sizing": "border-box",
          width: "80px",
          height: "80px",
          "text-align": "center",
          position: "absolute",
          top: "42%",
          left: "50%",
          "margin-top": "-40px",
          "margin-left": "-40px",
        },
        { width: "80%", height: "80%" }
      );
      thisObject._floorChangeView.hide();
      naviManager["addFloorChangeListener"](function (sender, data) {
        if (thisObject.visible) {
          var imageUrl = "./images/";
          switch (data.type) {
            case "futi":
              imageUrl += "escalator_";
              break;
            case "louti":
              imageUrl += "stair_";
              break;
            case "zhiti":
              imageUrl += "elevator_";
              break;
          }
          if (data.direction.indexOf("up") != -1) {
            imageUrl += "up.png";
          } else {
            imageUrl += "down.png";
          }

          thisObject._floorChangeView.updateData(imageUrl);
          thisObject._floorChangeView.show();
        }
      });
      naviManager["naviCoreEvents"]["EventShowFloorChanger"].addEventHandler(function (sender, data) {
        if (thisObject.visible) {
          if (data == true) {
            // thisObject._floorChangeView.show();
          } else {
            thisObject._floorChangeView.hide();
          }
        }
      });
      this.show(false);
      if (app._config["ARConfig"] && daxiapp["ARNavigation"]) {
        thisObject.arBtn = new daxiapp["DXBaseImageComponent"]();
        thisObject.startARNavi = false;
        this._app._mapView.arNavigation.on("closed", function () {
          thisObject.hideARNavi();
        });

        thisObject.arBtn.init(thisObject._dom, {
          imgUrl: "./images/ARBtn.png",
          style: {
            position: "absolute",
            bottom: "236px",
            right: "15px",
            color: "rgb(42, 42, 42)",
            width: "30px",
            background: "#fff",
            padding: "4px 2px",
            "border-radius": "6px",
          },
          listener: {
            onClicked: function () {
              if (!thisObject.startARNavi) {
                thisObject.arOpened = true;
                thisObject.showARNavi();
              } else {
                thisObject.arOpened = false;
                thisObject.hideARNavi();
              }
            },
          },
        });
        // thisObject.arBtn.updateText("实景导航");
      }
    },
    createRoute: function (routeData) {
      var dxRouteManager = new daximap["DXRouteManager"]();
      dxRouteManager["initialize"](this._app._mapView._mapSDK);
      if (routeData["route"]) {
        dxRouteManager["setRouteDatas"]([routeData]);
      } else if (routeData["transits"]) {
        dxRouteManager["setRouteDatas"](routeData["transits"]);
      }
      this._renderObjects.push(dxRouteManager);
    },
    showARNavi: function () {
      var thisObject = this;
      var mapView = this._app._mapView;
      var myPosition = mapView._locationManager.getMyPositionInfo();
      if (!myPosition["bdid"]) {
        var params = {
          text: "室外不支持实景导航",
          btn1: "取消",
          confirmCB: function () {
            //   arNavigation.startArNavigation(restPoint,heading,myPosition);
            //   mapView._mapSDK.getMapBoxMap()["setPadding"]({"top":window.innerHeight*0.6});
          },
          cancelCB: function () {},
        };

        daxiapp["domUtil"].dialogWithModal(params);
        return;
      }
      this.startARNavi = true;
      this._dom.addClass("arNavi");
      var mapView = this._app._mapView;
      var arNavigation = mapView.arNavigation;
      var restPoint = [];
      var floorId = mapView._mapSDK.getCurrentFloorId();

      DXGrayPolyLineVisitor(mapView._mapSDK["getRootScene"]()).visit(floorId, thisObject.naviGrayT, null, restPoint);
      if (arNavigation) {
        var heading = myPosition["direction"];

        if (!arNavigation.isInited && daxiapp["deviceType"]["osName"] == "iPhone") {
          var osVersion = daxiapp["deviceType"]["osVersion"];
          if (osVersion && parseFloat(osVersion) > 14.3) {
            var params = {
              text: "请授权AR展示",
              btn1: "取消",
              confirmCB: function () {
                arNavigation.startArNavigation(restPoint, heading, myPosition);
                mapView._mapSDK.getMapBoxMap()["setPadding"]({ top: window.innerHeight * 0.6 });
              },
              cancelCB: function () {},
            };

            daxiapp["domUtil"].dialogWithModal(params);
          } else {
            var params = {
              text: "系统版本过低不支持AR,如需使用请升至14.3以上",
              btn1: "取消",
              confirmCB: function () {},
              cancelCB: function () {},
            };

            daxiapp["domUtil"].dialogWithModal(params);
          }
        } else {
          arNavigation.startArNavigation(restPoint, heading, myPosition);
          thisObject._app._mapView._mapSDK.getMapBoxMap()["setPadding"]({ top: window.innerHeight * 0.6 });
        }
      }
    },
    hideARNavi: function () {
      this.startARNavi = false;
      this._dom.removeClass("arNavi");
      var arNavigation = this._app._mapView.arNavigation;
      arNavigation && arNavigation.hide();
      this._app._mapView._mapSDK.getMapBoxMap()["setPadding"]({ top: 0 });
    },
    onStateBeginWithParam: function (args) {
      this._super(args);
      this.params = dxUtils.copyData(args);
      if (!args) return;
      this.arOpened = false;
      var thisObject = this;
      var mapView = this._app._mapView;
      mapView.setTopViewHeight(80);
      mapView.setBottomViewHeight(60);
      mapView._locationBtnCtrl.setUserTrackingMode(daximap["UserTrackingMode"]["FollowWithHeading"]);
      var locationManager = mapView._locationManager;
      var posInfo = locationManager.getMyPositionInfo();
      var startPos = this.params["startPoint"];
      thisObject._naviEndInfoView.hide();
      if (
        posInfo["floorId"] != startPos["floorId"] ||
        daxiapp.naviMath.getGeodeticCircleDistance({ x: posInfo["position"][0], y: posInfo["position"][1] }, { x: startPos["lon"], y: startPos["lat"] }) > 5
      ) {
        this.startNavi(true, posInfo, args);
      } else {
        //直接导航
        this.startNavi(false, null, args);
      }
    },
    startNavi: function (reCalculateRoute, posInfo, args) {
      var thisObject = this;
      thisObject.navigationState = "navigating";
      thisObject.arBtn?.setStyle({ bottom: "236px" });
      var mapView = this._app._mapView;
      var route;
      var naviManager = mapView._naviManager;
      if (!reCalculateRoute) {
        mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap["UserTrackingMode"]["FollowWithHeading"]);
        var routeData = naviManager.getSelectedRouteData();
        var routeOverlay = new daximap.DXRouteOverlay();
        routeOverlay.initialize(thisObject._app._mapView._mapSDK, routeData);
        routeOverlay.addToMap();
        thisObject._renderObjects.push(routeOverlay);

        naviManager.startNavigation();
        thisObject._naviBottomView.setNaviState("navigating");
        thisObject._naviTipView.setNaviState("navigating");
        // mapView._mapSDK.setTilt(50);
        route = naviManager.getSelectedRoute();
      }

      naviManager.registerCallback({
        onNavigationReset: function (routeData) {},
        onCalculateRouteSuccess: function (data) {
          //路线计算成功
          thisObject.onRouteReviced(data);
          route = naviManager.getSelectedRoute();
          showViewByRouteSegment();
          if (thisObject.arOpened) {
            thisObject.showARNavi();
          }
        },
        onRouteParsed: function (data) {},
        onNaviStateChanged: function (naviState) {
          //隐藏换层动画图片
          thisObject._floorChangeView.hide();
        },
        onNavigationFinished: function (data) {
          //导航完成
          nextToRouteSegment(data);
          thisObject.hideCross();
          thisObject.hideARNavi();
          thisObject.arBtn?.setStyle({ bottom: "336px" });
        },
        onNavigationExited: function () {
          thisObject._floorChangeView.hide();
          thisObject.hideCross();
          thisObject.hideARNavi();
        },
        onCalculateRouteFailure: function (code) {
          thisObject.hideCross();
          //路线计算失败
          daxiapp.domUtil.tipMessage("路线规划失败", 3000, function () {
            thisObject._app._mapView._naviManager.exitNavi();
            thisObject._app._stateManager.goBack();
          });
        },
        onArriveDestination: function (args, data) {
          //导航完成
          // console.log("onArriveDestination");
          // nextToRouteSegment(data);
        },
        onEndEmulatorNavi: function (data) {
          //模拟导航完成
          // nextToRouteSegment(data);
        },

        showCross: function (crossData) {
          //显示路口放大图
          if (crossData) {
            //打开路口放大图
            if (crossData["imagePath"].indexOf("pano://") != -1) {
              thisObject.showCross(crossData);
            } else {
              // 显示路口放大图图片
            }
          } else {
            //关闭
            thisObject._app.crossPano.hide();
          }
        },
        hideCross: function () {
          thisObject.hideCross();
        },

        onArrivedWayPoint: function (wayPointInfo) {},
        onGetNavigationText: function (args) {
          // 导航语音变化
          console.log("onGetNavigationText:" + args);
        },
        onNaviInfoUpdated: function (naviInfo) {
          // 导航信息更新
          // naviInfo属性定义
          // totalLength     路线总长
          // remainDistance  到终点的剩余距离
          // remainTime      到终点的剩余时间
          // distanceToNext  到下一个转弯处的距离
          // nextInstuction  下一段的指令
          // segmentIndex    当前路段的索引

          if (thisObject._naviTipView) {
            thisObject._naviTipView.updateData(naviInfo);
          }

          if (thisObject._naviBottomView) {
            thisObject._naviBottomView.updateData(naviInfo);
          }
          if (naviInfo["grayT"] != undefined) {
            var restPoint = null;
            if (thisObject.startARNavi) {
              var restPoint = [];
            }
            thisObject.naviGrayT = naviInfo["grayT"];
            DXGrayPolyLineVisitor(mapView._mapSDK["getRootScene"]()).visit(naviInfo["floorId"], naviInfo["grayT"], naviInfo["grayData"], restPoint);
            var myPosition = mapView._locationManager.getMyPositionInfo();
            restPoint && thisObject._app._mapView.arNavigation.redrawAr(restPoint, myPosition);
          }
        },
        onReCalculateRouteForYaw: function (params) {
          //开始偏航重算路径
          var config = thisObject._app._config;
          var transittype =
            thisObject.params["transittype"] != undefined ? thisObject.params["transittype"] : config.transittype == undefined ? 0 : config.transittype;
          params["transittype"] = transittype;
          if (thisObject.params["strategy"] != undefined) {
            params["strategy"] = thisObject.params["strategy"];
          }
          params["includeStartEnd"] = "false";
          var mapView = thisObject._app._mapView;
          mapView._naviManager.exitNavi();
          mapView._speakListener && mapView._speakListener.speakNow("您已偏离导航,正在为您重新规划路线");
          daxiapp.domUtil.tipNotice("您已偏离导航,正在为您重新规划路线", 3000);
          naviManager["queryRoutePath"](params);
        },
        onLocationChanged: function (naviLocation) {},
        updateCameraInfo: function (naviCameraInfo) {},
        onOpenTriNaviApp: function () {
          nextToRouteSegment();
        },

        onRouteStepPause: function (routeStep) {
          thisObject._naviBottomView.setNaviState("pause");
          thisObject._naviTipView.setNaviState("pause");
        },
        onRouteStepResume: function (routeStep) {
          thisObject._naviBottomView.setNaviState("navigating");
          thisObject._naviTipView.setNaviState("navigating");
          mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap["UserTrackingMode"]["FollowWithHeading"]);
          //thisObject._listener && thisObject._listener["onRouteStepResume"] && thisObject._listener["onRouteStepResume"](routeStep);
        },
      });
      function nextToRouteSegment(data) {
        var isFinished = route.isLastSegment();
        if (isFinished) {
          thisObject.onNavigationFinished(args, data);
        } else {
          var nextSegmentIndex = route.getNextOutDoorIndoorChangeStepIndex();
          route.activeStep(nextSegmentIndex);
          showViewByRouteSegment(data);
        }
      }
      function showViewByRouteSegment(data) {
        var currentMapStep = route.getCurrentMapStep();
        if (currentMapStep.getTripMode() == 3) {
          thisObject.showIndoorNaviComponent();
        } else {
          var isFinished = route.isLastSegment();
          if (isFinished) {
            // route.getNextOutDoorIndoorChangeStep()
            thisObject._app._stateManager.goBack();
            // thisObject.onNavigationFinished(args,data);
            return;
          }
          var nextMapStep = route.getNextOutDoorIndoorChangeStep();
          if (nextMapStep) {
            var nextStartInfo = nextMapStep.getStartInfo();
            var startAddrss = nextStartInfo["name"] || "进入下一路段";
            var params = {
              text: "已到达" + startAddrss + "\n点击继续导航",
              btn1: "退出导航",
              confirmCB: function () {
                nextToRouteSegment();
              },
              cancelCB: function () {
                thisObject._app._mapView._naviManager.exitNavi();
                thisObject._app._stateManager.goBack();
              },
            };
            setTimeout(function () {
              daxiapp.domUtil.dialogWithModal(params);
            }, 2000);
          }
        }
      }
      if (!reCalculateRoute) {
        showViewByRouteSegment();
      } else {
        var config = thisObject._app._config;
        var params = thisObject.params;
        var transittype =
          thisObject.params["transittype"] != undefined ? thisObject.params["transittype"] : config.transittype == undefined ? 0 : config.transittype;
        params["transittype"] = transittype;
        params["startPoint"] = { floorId: posInfo["floorId"], bdid: posInfo["bdid"], lon: posInfo["position"][0], lat: posInfo["position"][1] };
        params["includeStartEnd"] = "false";
        params["token"] = thisObject._app._params["token"];
        var mapView = thisObject._app._mapView;
        naviManager["queryRoutePath"](params);
      }
    },
    showIndoorNaviComponent: function () {
      var thisObject = this;
      if (thisObject._naviTipView) {
        thisObject._naviTipView.show();
      }
      if (thisObject._naviBottomView) {
        thisObject._naviBottomView.show();
      }
      if (thisObject._naviEndInfoView) {
        // thisObject._naviEndInfoView.updateData(args["startPoint"],args["endPoint"],100,20);
        thisObject._naviEndInfoView.hide();
      }
    },
    onNavigationFinished: function (args, data) {
      var thisObject = this;

      if (thisObject._naviTipView) {
        thisObject._naviTipView.hide();
      }
      if (thisObject._naviBottomView) {
        thisObject._naviBottomView.hide();
      }
      if (thisObject._naviEndInfoView) {
        thisObject._naviEndInfoView.updateData(args["startPoint"], args["endPoint"], 100, 20, data["msg"]);
        thisObject._naviEndInfoView.show();
      }
      var mapView = this._app._mapView;
      //导航结束解除抓路
      var locationManager = mapView._locationManager;
      locationManager["stopMatchRoute"]();
      mapView.setTopViewHeight(16);
      mapView.setBottomViewHeight(160);
      thisObject.setUserTrackingModeToNone();
      thisObject.navigationState = "finished";
      mapView._mapSDK["fire"]("navigationFinished", { poiId: this.params.endPoint.poiId });
      thisObject._naviTipView.setNaviState("finished");
      mapView._speakListener.speakNow("导航结束");
    },
    onRouteReviced: function (data) {
      var thisObject = this;
      thisObject.clearAllRenderObject();
      var mapView = this._app._mapView;
      mapView._mapSDK["clearPolylineGrayData"]();
      DXClearLineArrowVisitor(mapView._mapSDK["getRootScene"]()).visit();
      thisObject.routeData = data;
      thisObject.routeIndex = 0;
      var naviManager = this._app._mapView._naviManager;
      naviManager["selectRouteId"](0);
      this.createRoute(data);
      naviManager["startNavigation"]();
      thisObject._naviTipView.show();
      thisObject._naviTipView.setNaviState("navigating");
    },

    setUserTrackingModeToNone: function () {
      var mapView = this._app._mapView;
      var locationManager = mapView._locationManager;
      var locState = locationManager["getLocationState"]();
      if (locState == daximap["LocationState"]["LOCATED"]) {
        mapView._locationBtnCtrl.setUserTrackingMode(daximap["UserTrackingMode"]["None"]);
      } else {
        mapView._locationBtnCtrl.setUserTrackingMode(daximap["UserTrackingMode"]["Unknown"]);
      }
    },
    onShowByPopStack: function (args) {
      this._super(args);
      var mapView = this._app._mapView;
      mapView._mapSDK["clearPolylineGrayData"]();
      DXClearLineArrowVisitor(mapView._mapSDK["getRootScene"]()).visit();
      this.arOpened = false;
    },

    onStateEnd: function (args) {
      this._super(args);
      var mapView = this._app._mapView;
      var locationManager = mapView._locationManager;
      locationManager["stopMatchRoute"]();
      mapView._mapSDK["clearPolylineGrayData"]();
      DXClearLineArrowVisitor(mapView._mapSDK["getRootScene"]()).visit();
      this.arOpened = false;
    },
    exitNavi: function () {
      var app = this._app;
      if (this.navigationState == "finished") {
        var naviManager = app._mapView._naviManager;
        naviManager.exitNavi();
        app._mapStateManager.goBack();
      } else {
        this._naviBottomView.triggerExitNaviBtnClick();
      }
    },

    // Run Command
    runCommand: function (command) {
      var thisObject = this;
      var naviManager = this._app._mapView._naviManager;
      var params = {
        text: "您确定退出导航",
        btn1: "取消",
        confirmCB: function () {
          thisObject.setUserTrackingModeToNone();
          naviManager["exitNavi"]();
          thisObject._app._stateManager.goBack();
          thisObject.exitNaviModal = null;
        },
        cancelCB: function () {
          naviManager["resumeNavi"]();
          thisObject.exitNaviModal = null;
        },
      };
      if (!thisObject.exitNaviModal) {
        thisObject.exitNaviModal = daxiapp["domUtil"].dialogWithModal(params);
        naviManager["pauseNavi"]();
      } else {
        thisObject.exitNaviModal.close();
      }
    },
    showCross: function (crossData) {
      var thisObject = this;
      if (!thisObject._app.crossPano) {
        var baseUrl = window.location.href;
        baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf("/") + 1);
        var panoBaseUrl = window["panoPath"] || "../pano/index.html";
        var targetDomain = baseUrl + panoBaseUrl;
        thisObject._app.crossPano = new daxiapp["DXIframeComponent"](thisObject._app, thisObject._app._dom, {
          link: targetDomain,
          id: "crossRoadPanoIfr",
          style: { height: "50vh" },
        });
        thisObject._app.crossPano.init();
      }
      var panoUrl = thisObject._app._config["panoUrl"];
      var bdid = crossData["bdid"];
      panoUrl = panoUrl.replace("{{bdid}}", bdid);
      var data = {
        server: panoUrl,
        id: crossData["imagePath"].replace("pano://", ""),
        Id: crossData["Id"],
        heading: crossData["Heading"],
        currFloor: crossData["floorName"],
        bdid: bdid,
      };
      thisObject._app.crossPano.show();
      thisObject._app.crossPano.postMessage("loadPano", data);
      var mapSDK = thisObject._app._mapView._mapSDK;

      mapSDK["setPadding"]({ top: window.innerHeight * 0.5 });
    },
    hideCross: function () {
      //隐藏路口放大图
      this._app.crossPano && this._app.crossPano.hide();
      var mapSDK = this._app._mapView._mapSDK;
      mapSDK["setPadding"]({ top: 50 });
    },
  });

  daxiapp["MapStateNavi"] = MapStateNavi;
})(window);
