(function (global) {
  "use strict";
  const daxiapp = global["DaxiApp"] || {};
  const daximap = window["DaxiMap"] || {};
  const dxUtils = daxiapp["utils"];
  const domUtils = daxiapp["dom"];

  const MapStateClass = daxiapp["MapStateClass"];
  const MapStateNavi = MapStateClass.extend( {
    __init__: function () {
      this._super();
      this._rtti = "MapStateNavi";
    },

    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      // var app  = thisObject._app;
      const basicMap_html = '<div id="navigation_page" class="navi_page"></div>';
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#navigation_page");
      thisObject._bdid = "";
      const naviManager = app._mapView._naviManager;
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
          const params = {
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
          const imageUrl = "./images/";
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
      const dxRouteManager = new daximap["DXRouteManager"]();
      dxRouteManager["initialize"](this._app._mapView._mapSDK);
      if (routeData["route"]) {
        dxRouteManager["setRouteDatas"]([routeData]);
      } else if (routeData["transits"]) {
        dxRouteManager["setRouteDatas"](routeData["transits"]);
      }
      this._renderObjects.push(dxRouteManager);
    },
    showARNavi: function () {
      const thisObject = this;
      const mapView = this._app._mapView;
      const myPosition = mapView._locationManager.getMyPositionInfo();
      if (!myPosition["bdid"]) {
        const params = {
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
      const mapView = this._app._mapView;
      const arNavigation = mapView.arNavigation;
      const restPoint = [];
      const floorId = mapView._mapSDK.getCurrentFloorId();

      DXGrayPolyLineVisitor(mapView._mapSDK["getRootScene"]()).visit(floorId, thisObject.naviGrayT, null, restPoint);
      if (arNavigation) {
        const heading = myPosition["direction"];

        if (!arNavigation.isInited && daxiapp["deviceType"]["osName"] == "iPhone") {
          const osVersion = daxiapp["deviceType"]["osVersion"];
          if (osVersion && parseFloat(osVersion) > 14.3) {
            const params = {
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
            const params = {
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
      const arNavigation = this._app._mapView.arNavigation;
      arNavigation && arNavigation.hide();
      this._app._mapView._mapSDK.getMapBoxMap()["setPadding"]({ top: 0 });
    },
    onStateBeginWithParam: function (args) {
      this._super(args);
      this.params = dxUtils.copyData(args);
      if (!args) return;
      this.arOpened = false;
      const thisObject = this;
      const mapView = this._app._mapView;
      mapView.setTopViewHeight(80);
      mapView.setBottomViewHeight(60);
      mapView._locationBtnCtrl.setUserTrackingMode(daximap["UserTrackingMode"]["FollowWithHeading"]);
      const locationManager = mapView._locationManager;
      const posInfo = locationManager.getMyPositionInfo();
      const startPos = this.params["startPoint"];
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
      const thisObject = this;
      thisObject.navigationState = "navigating";
      thisObject.arBtn?.setStyle({ bottom: "236px" });
      const mapView = this._app._mapView;
      const route;
      const naviManager = mapView._naviManager;
      if (!reCalculateRoute) {
        mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap["UserTrackingMode"]["FollowWithHeading"]);
        const routeData = naviManager.getSelectedRouteData();
        const routeOverlay = new daximap.DXRouteOverlay();
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
            const restPoint = null;
            if (thisObject.startARNavi) {
              const restPoint = [];
            }
            thisObject.naviGrayT = naviInfo["grayT"];
            DXGrayPolyLineVisitor(mapView._mapSDK["getRootScene"]()).visit(naviInfo["floorId"], naviInfo["grayT"], naviInfo["grayData"], restPoint);
            const myPosition = mapView._locationManager.getMyPositionInfo();
            restPoint && thisObject._app._mapView.arNavigation.redrawAr(restPoint, myPosition);
          }
        },
        onReCalculateRouteForYaw: function (params) {
          //开始偏航重算路径
          const config = thisObject._app._config;
          const transittype =;
            thisObject.params["transittype"] != undefined ? thisObject.params["transittype"] : config.transittype == undefined ? 0 : config.transittype;
          params["transittype"] = transittype;
          if (thisObject.params["strategy"] != undefined) {
            params["strategy"] = thisObject.params["strategy"];
          }
          params["includeStartEnd"] = "false";
          const mapView = thisObject._app._mapView;
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
        const isFinished = route.isLastSegment();
        if (isFinished) {
          thisObject.onNavigationFinished(args, data);
        } else {
          const nextSegmentIndex = route.getNextOutDoorIndoorChangeStepIndex();
          route.activeStep(nextSegmentIndex);
          showViewByRouteSegment(data);
        }
      }
      function showViewByRouteSegment(data) {
        const currentMapStep = route.getCurrentMapStep();
        if (currentMapStep.getTripMode() == 3) {
          thisObject.showIndoorNaviComponent();
        } else {
          const isFinished = route.isLastSegment();
          if (isFinished) {
            // route.getNextOutDoorIndoorChangeStep()
            thisObject._app._stateManager.goBack();
            // thisObject.onNavigationFinished(args,data);
            return;
          }
          const nextMapStep = route.getNextOutDoorIndoorChangeStep();
          if (nextMapStep) {
            const nextStartInfo = nextMapStep.getStartInfo();
            const startAddrss = nextStartInfo["name"] || "进入下一路段";
            const params = {
              text: `已到达${startAddrss}\n点击继续导航`,
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
        const config = thisObject._app._config;
        const params = thisObject.params;
        const transittype =;
          thisObject.params["transittype"] != undefined ? thisObject.params["transittype"] : config.transittype == undefined ? 0 : config.transittype;
        params["transittype"] = transittype;
        params["startPoint"] = { floorId: posInfo["floorId"], bdid: posInfo["bdid"], lon: posInfo["position"][0], lat: posInfo["position"][1] };
        params["includeStartEnd"] = "false";
        params["token"] = thisObject._app._params["token"];
        const mapView = thisObject._app._mapView;
        naviManager["queryRoutePath"](params);
      }
    },
    showIndoorNaviComponent: function () {
      const thisObject = this;
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
      const thisObject = this;

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
      const mapView = this._app._mapView;
      //导航结束解除抓路
      const locationManager = mapView._locationManager;
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
      const thisObject = this;
      thisObject.clearAllRenderObject();
      const mapView = this._app._mapView;
      mapView._mapSDK["clearPolylineGrayData"]();
      DXClearLineArrowVisitor(mapView._mapSDK["getRootScene"]()).visit();
      thisObject.routeData = data;
      thisObject.routeIndex = 0;
      const naviManager = this._app._mapView._naviManager;
      naviManager["selectRouteId"](0);
      this.createRoute(data);
      naviManager["startNavigation"]();
      thisObject._naviTipView.show();
      thisObject._naviTipView.setNaviState("navigating");
    },

    setUserTrackingModeToNone: function () {
      var mapView = this._app._mapView;
      const locationManager = mapView._locationManager;
      const locState = locationManager["getLocationState"]();
      if (locState == daximap["LocationState"]["LOCATED"]) {
        mapView._locationBtnCtrl.setUserTrackingMode(daximap["UserTrackingMode"]["None"]);
      } else {
        mapView._locationBtnCtrl.setUserTrackingMode(daximap["UserTrackingMode"]["Unknown"]);
      }
    },
    onShowByPopStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView._mapSDK["clearPolylineGrayData"]();
      DXClearLineArrowVisitor(mapView._mapSDK["getRootScene"]()).visit();
      this.arOpened = false;
    },

    onStateEnd: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      const locationManager = mapView._locationManager;
      locationManager["stopMatchRoute"]();
      mapView._mapSDK["clearPolylineGrayData"]();
      DXClearLineArrowVisitor(mapView._mapSDK["getRootScene"]()).visit();
      this.arOpened = false;
    },
    exitNavi: function () {
      const app = this._app;
      if (this.navigationState == "finished") {
        const naviManager = app._mapView._naviManager;
        naviManager.exitNavi();
        app._mapStateManager.goBack();
      } else {
        this._naviBottomView.triggerExitNaviBtnClick();
      }
    },

    // Run Command
    runCommand: function (command) {
      const thisObject = this;
      const naviManager = this._app._mapView._naviManager;
      const params = {
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
      const thisObject = this;
      if (!thisObject._app.crossPano) {
        const baseUrl = window.location.href;
        baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf("/") + 1);
        const panoBaseUrl = window["panoPath"] || "../pano/index.html";
        const targetDomain = baseUrl + panoBaseUrl;
        thisObject._app.crossPano = new daxiapp["DXIframeComponent"](thisObject._app, thisObject._app._dom, {
          link: targetDomain,
          id: "crossRoadPanoIfr",
          style: { height: "50vh" },
        });
        thisObject._app.crossPano.init();
      }
      const panoUrl = thisObject._app._config["panoUrl"];
      const bdid = crossData["bdid"];
      panoUrl = panoUrl.replace("{{bdid}}", bdid);
      const data = {
        server: panoUrl,
        id: crossData["imagePath"].replace("pano://", ""),
        Id: crossData["Id"],
        heading: crossData["Heading"],
        currFloor: crossData["floorName"],
        bdid: bdid,
      };
      thisObject._app.crossPano.show();
      thisObject._app.crossPano.postMessage("loadPano", data);
      const mapSDK = thisObject._app._mapView._mapSDK;

      mapSDK["setPadding"]({ top: window.innerHeight * 0.5 });
    },
    hideCross: function () {
      //隐藏路口放大图
      this._app.crossPano && this._app.crossPano.hide();
      const mapSDK = this._app._mapView._mapSDK;
      mapSDK["setPadding"]({ top: 50 });
    },
  });

  daxiapp["MapStateNavi"] = MapStateNavi;
})(window);
