(function (global) {
  "use strict";
  var daxiapp = global["DaxiApp"] || {};
  var daximap = window["DaxiMap"] || {};
  var DXMapUtils = daximap["DXMapUtils"];
  var domUtils = daxiapp["dom"];
  var MapStateClass = daxiapp["MapStateClass"];
  var MapStateSimulateNavi = MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "MapStateSimulateNavi";
    },

    initialize: function (app, container) {
      this._super(app, container);
      var thisObject = this;
      // var app  = thisObject._app;
      var basicMap_html = '<div id="simulate_navi_page" class="navi_page"></div>';
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#simulate_navi_page");
      thisObject._bdid = "";
      thisObject.navigationView;
      var naviManager = app._mapView._naviManager;
      thisObject._naviEndInfoView = new daxiapp["DXNaviEndInfoView"](app, thisObject._dom);
      thisObject._naviEndInfoView.init({
        onCloseButtonClicked: function () {
          naviManager.exitNavi();
          app._stateManager.goBack();
          thisObject._naviEndInfoView.hide();
        },
        showPano: function (panoData) {
          var mapView = app._mapView;
          var mapStateBrowse = app._stateManager.getMapState("MapStateBrowse");
          var poiInfo = mapView._mapSDK["getPoiInfoById"](panoData["id"], panoData["bdid"]);
          poiInfo && mapView._panoUtil.openPanoPage(poiInfo);
        },
      });
      thisObject._naviEndInfoView.hide();

      thisObject._naviTipView = new daxiapp["DXNaviTipView"](app, thisObject._dom);
      thisObject._naviTipView.init({
        simulate: true,
        onTap: function () {
          // naviManager.exitNavi();
          // app.mapStateManager.goBack();
        },
        triggerResume: function () {
          naviManager["resumeNavi"]();
        },

        triggerChangeSpeed: function (speed) {
          // naviManager["resumeNavi"]();
          naviManager["setSimulatorNaviSpeed"](speed * 2);
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
              // naviManager
              naviManager["resumeNavi"]();
              thisObject.exitNaviModal = null;
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
      naviManager.addFloorChangeListener(function (sender, data) {
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
    onStateBeginWithParam: function (args) {
      this._super(args);
      this.params = daxiapp["utils"].copyData(args);
      if (!args) return;
      var thisObject = this;
      var mapView = this._app._mapView;
      mapView.setTopViewHeight(80);
      mapView.setBottomViewHeight(60);
      mapView._locationBtnCtrl.setUserTrackingMode(daximap["UserTrackingMode"]["FollowWithHeading"]);
      // mapView._userLocationMarker.setUserTrackingMode(daximap["UserTrackingMode"]["FollowWithHeading"]);
      var naviManager = mapView._naviManager;
      var routeData = naviManager.getSelectedRouteData();
      var routeOverlay = new daximap["DXRouteOverlay"]();
      routeOverlay.initialize(thisObject._app._mapView._mapSDK, routeData);
      routeOverlay.addToMap();
      thisObject._renderObjects.push(routeOverlay);

      naviManager.startSimulate();
      thisObject._naviBottomView.setNaviState("navigating");
      thisObject._naviTipView.show();
      thisObject._naviTipView.setNaviState("navigating");

      var route = naviManager.getSelectedRoute();
      thisObject.navigationState = "navigating";
      naviManager.registerCallback({
        onCalculateRouteSuccess: function (e) {
          //路线计算成功
          // if(!e || e.routes.length == 0) return;
        },
        onRouteParsed: function (data) {},
        onNaviStateChanged: function (naviState) {},
        onNavigationFinished: function (data) {
          //导航完成
          // thisObject.onNavigationFinished(args);
          nextToRouteSegment(data);
          thisObject.hideCross();
        },
        onNavigationExited: function () {
          //隐藏换层动画图片
          thisObject._floorChangeView.hide();
          thisObject.hideCross();
          thisObject._naviTipView.setNaviState("exit");
        },
        onCalculateRouteFailure: function (code) {
          thisObject.hideCross();
          //路线计算失败
          daxiapp["domUtil"].tipMessage("路线规划失败", 3000, function () {
            thisObject._app._mapView._naviManager.exitNavi();
            thisObject._app._stateManager.goBack();
          });
        },
        onArriveDestination: function () {
          //导航完成
          console.log("onArriveDestination");
        },
        // "onEndEmulatorNavi":function(data){
        //     //模拟导航完成
        //     // thisObject.onNavigationFinished(args);
        //     nextToRouteSegment(data);
        // },
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
            thisObject.hideCross();
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
          if (naviInfo["grayT"]) {
            DXGrayPolyLineVisitor(mapView._mapSDK["getRootScene"]()).visit(naviInfo["floorId"], naviInfo["grayT"], naviInfo["grayData"]);
          }
        },
        onReCalculateRouteForYaw: function () {
          //开始偏航重算路径
          console.log("onReCalculateRouteForYaw");
        },
        onLocationChanged: function (naviLocation) {},
        updateCameraInfo: function (naviCameraInfo) {},
        onOpenTriNaviApp: function () {
          // nextToRouteSegment();
        },
        onRouteStepPause: function (routeStep) {
          if (thisObject.visible) {
            thisObject._naviBottomView.setNaviState("pause");
            thisObject._naviTipView.setNaviState("pause");
          }
        },
        onRouteStepResume: function (routeStep) {
          if (!thisObject.visible) {
            return;
          }
          thisObject._naviBottomView.setNaviState("navigating");
          thisObject._naviTipView.setNaviState("navigating");
          mapView._locationBtnCtrl.setUserTrackingMode(daximap["UserTrackingMode"]["FollowWithHeading"]);
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
      function showViewByRouteSegment() {
        var currentMapStep = route.getCurrentMapStep();
        if (currentMapStep.getTripMode() == 3) {
          thisObject.showIndoorNaviComponent();
        } else {
          var isFinished = route.isLastSegment();
          if (isFinished || !route.getNextOutDoorIndoorChangeStep()) {
            // var startAddrss = currentMapStep["name"]||"目的地";
            var params = {
              text: "暂不支持室外模拟导航" + "\n剩余都为室外路线,模拟导航即将结束",
              btn1: "退出导航",
              btn2: "确定",
              confirmCB: function () {
                thisObject.exitNaviModal = null;
                thisObject._app._mapView._naviManager.exitNavi();
                thisObject._app._stateManager.goBack();
              },
              cancelCB: function () {
                thisObject.exitNaviModal = null;
                thisObject._app._mapView._naviManager.exitNavi();
                thisObject._app._stateManager.goBack();
              },
            };

            if (!thisObject.exitNaviModal) {
              thisObject.exitNaviModal = daxiapp["domUtil"].dialogWithModal(params);
            } else {
              thisObject.exitNaviModal.close();
              thisObject.exitNaviModal = daxiapp["domUtil"].dialogWithModal(params);
            }
            return;
          }
          var nextMapStep = route.getNextOutDoorIndoorChangeStep();
          if (nextMapStep) {
            var nextStartInfo = nextMapStep.getStartInfo();
            var startAddrss = nextStartInfo["name"] || "进入下一路段";
            var params = {
              text: "暂不支持室外模拟导航" + "\n是否切换下一段导航",
              btn1: "退出导航",
              btn2: "切换",
              confirmCB: function () {
                thisObject.exitNaviModal = null;
                nextToRouteSegment();
              },
              cancelCB: function () {
                thisObject.exitNaviModal = null;
                thisObject._app._mapView._naviManager.exitNavi();
                thisObject._app._stateManager.goBack();
              },
            };
            if (!thisObject.exitNaviModal) {
              thisObject.exitNaviModal = daxiapp["domUtil"].dialogWithModal(params);
            } else {
              thisObject.exitNaviModal.close();
              thisObject.exitNaviModal = daxiapp["domUtil"].dialogWithModal(params);
            }
          }
        }
      }
      showViewByRouteSegment();
      thisObject._naviTipView.setSpeed(1);
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
      mapView.setTopViewHeight(66);
      mapView.setBottomViewHeight(140);
      thisObject.setUserTrackingModeToNone();
      thisObject._naviTipView.setNaviState("finished");
      mapView._speakListener.speakNow("导航结束");
      thisObject.navigationState = "finished";
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
    onHideByPushStack: function (args) {
      this._super(args);
      var mapView = this._app._mapView;
      mapView._mapSDK["clearPolylineGrayData"]();
      DXClearLineArrowVisitor(mapView._mapSDK["getRootScene"]()).visit();
    },

    onShowByPopStack: function (args) {
      this._super(args);
      var mapView = this._app._mapView;
      mapView.setTopViewHeight(66);
      mapView.setBottomViewHeight(60);
      mapView._mapSDK["clearPolylineGrayData"]();
      DXClearLineArrowVisitor(mapView._mapSDK["getRootScene"]()).visit();
    },

    onStateEnd: function (args) {
      this._super(args);
      var mapView = this._app._mapView;
      var mapView = this._app._mapView;
      mapView._mapSDK["clearPolylineGrayData"]();
      DXClearLineArrowVisitor(mapView._mapSDK["getRootScene"]()).visit();
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
          thisObject.exitNaviModal = null;
          thisObject.setUserTrackingModeToNone();
          naviManager["exitNavi"]();
          thisObject._app._stateManager.goBack();
        },
        cancelCB: function () {
          thisObject.exitNaviModal = null;
          naviManager["resumeNavi"]();
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
      //显示路口放大图
      if (crossData) {
        //打开路口放大图
        if (crossData["imagePath"].indexOf("pano://") != -1) {
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
        }
      }
    },
    hideCross: function () {
      //隐藏路口放大图
      this._app.crossPano && this._app.crossPano.hide();
      var mapSDK = this._app._mapView._mapSDK;

      mapSDK["setPadding"]({ top: 50 });
    },
  });
  daxiapp["MapStateSimulateNavi"] = MapStateSimulateNavi;
})(window);
