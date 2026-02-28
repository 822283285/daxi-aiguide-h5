(function (global) {
  "use strict";
  const daxiapp = global["DaxiApp"] || {};
  const daximap = global["DaxiMap"] || {};
  const domUtils = daxiapp["dom"];
  const dxUtils = daxiapp["utils"];
  const dxUtil = daxiapp["utils"];
  const MapStateClass = daxiapp["MapStateClass"];
  const STATE_init = 0,;
    STATE_unReaded = 1,
    STATE_Played = 2;
  const MapStateVisitNavi = MapStateClass.extend({;
    __init__: function () {
      this._super();
      this._rtti = "MapStateVisitNavi";
      this._visitorRouterLayers = [];
      this.exhitRectLayer = null;
      this.hideExhibitsLayer = true;
    },

    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      thisObject.name = thisObject.pageName = "visit_navi_view_page";
      const basicMap_html = '<div id="' + thisObject.pageName + '" class="navi_page"></div>';
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#" + thisObject.pageName);
      thisObject._bdid = "";
      thisObject._token = app._params["token"];
      thisObject._currentRoute = null;
      thisObject._startPoint = { lon: 0, lat: 0, bdid: "", floorId: "", name: "", address: "", floorName: "" };
      thisObject._endPoint = { lon: 0, lat: 0, bdid: "", floorId: "", name: "", address: "", floorName: "" };
      const naviManager = thisObject._app._mapView._naviManager;
      thisObject.naviManager = naviManager;
      thisObject._naviEndInfoView = new daxiapp["DXNaviEndInfoView"](app, thisObject._dom);
      thisObject._naviEndInfoView.init({
        onCloseButtonClicked: function () {
          naviManager["exitNavi"]();
          app._stateManager.goBack();
        },
      });
      thisObject._naviEndInfoView.hide();

      thisObject._naviTipView = new daxiapp["DXTouristNaviInfo"](app, thisObject._dom);
      thisObject._naviTipView.init({
        onTap: function () {
          // naviManager["exitNavi();
          // app.mapStateManager.goBack();
        },
        triggerResume: function () {
          naviManager["resumeNavi"]();
        },
        onExitButtonClicked: function () {
          dxUtils.modal.show({
            img: "./images/icon_position.png",
            text: "确定退出导航",
            detail: "",
            btnArr: ["取消", "确定"],
            callback: function (index) {
              if (index == 2) {
                naviManager["exitNavi"]();
                app._stateManager.goBack();
              }
            },
          });
        },
        onNaviToNextScnic: function () {
          thisObject.targetExhibitRect = null;
          thisObject._app._mapView._locationManager["off"]("onLocationChanged", thisObject.listenPosToNextScenic);
          const toNext = true;
          thisObject.startNaviToNextRoute(toNext);
        },
      });
      thisObject._naviTipView.hide();
      thisObject._dxCardWithAudioCtrl = new daxiapp["DXSpotPopupComponent"]();
      thisObject._dxCardWithAudioCtrl.init(thisObject._dom, {
        visible: false,
        // "data":data,
        listener: {
          onRouteBtnClicked: function (sender, data) {
            thisObject.openRoute(data);
          },
          onDeatilBtnClicked: function (sender, data) {
            thisObject.openDetail(data);
          },
          onAudioClicked: function () {},
          onClose: function () {
            thisObject._dxCardWithAudioCtrl.hide();
          },
          onImgLoaded: function () {
            const height = thisObject._dom.find(".detailInfo-component ").height();
            if (height) {
              thisObject._app._mapView.setBottomViewHeight(height + 26);
            }
          },
          onListenBtnClicked: function (sender, data) {
            const params = {;
              token: thisObject._app._params["token"],
              bdid: data["bdid"],
              getPayStatusUrl: thisObject._app._config["getPayStatusUrl"],
              userId: thisObject._app._params["userId"],
            };
            thisObject.getPayStatus(function (res) {
              if (res.code != 0) {
                window["wx"] &&
                  wx.miniProgram.navigateTo({
                    url: "/pages/pay/pay?token=" + thisObject._app._params.token + "&bdid=" + thisObject._app._params.bdid,
                  });
              } else {
                // 已支付未到期
                const d = {;
                  type: "postEventToMiniProgram",
                  id: params["userId"],
                  methodToMiniProgram: "exhibitId=" + (data["id2"] || data["id"]) + "&bdid=" + params.bdid + "&token=" + params.token,
                  roleType: "receiver",
                };
                window["locWebSocketPostMessage"] && window["locWebSocketPostMessage"](d);
                if (thisObject._app._params["scenic"] == "2") {
                  wx.miniProgram.navigateTo({
                    url: "/pages/index/index?exhibitId=" + data["id2"] + "&token=" + params.token + "&bdid=" + params.bdid,
                  });
                } else {
                  wx.miniProgram.switchTab({
                    url: "/pages/index/index?exhibitId=" + data["id2"] + "&token=" + params.token + "&bdid=" + params.bdid,
                  });
                }
              }
            });
          },
          moreClick: function (sender, data) {
            const alertBox = thisObject._dom.find(".alertBox");
            if (alertBox.length) {
              alertBox.remove();
            }
            const dom = '<div class="alertBox"><div class="close icon-close2"></div>';
            if (data.introImage) {
              dom += '<div><img style="width: 100%" src="' + data.introImage + '"></div>';
            }
            dom += '<div class="name">' + data.name + "</div>";
            dom += '<div class="description">' + data.description + "</div>";
            dom += "</div>";
            domUtils.showMask();
            thisObject._dom.append($(dom));
            alertBox = thisObject._dom.find(".alertBox");
            const closeBtn = alertBox.find(".close");
            const maskDom = $("#__mask_info_1");
            closeBtn.on("click", function () {
              alertBox.hide();
              domUtils.hideMask();
            });
            maskDom.on("click", function () {
              alertBox.hide();
              domUtils.hideMask();
            });
          },
        },
      });
      this.show(false);
    },
    findNearestExhibit: function (startPoint, toNext) {
      var routeLayer = this.params.visitRoute; //this.routeManager.getCurentRoute();
      const nearestMarker = null,;
        markerIndex;
      const playedExhibitCount = 0;
      const minDis = Number.MAX_VALUE;
      const thisObject = this;
      routeLayer["markersInfo"].forEach(function (marker, index) {
        if (toNext && index < routeLayer["markersInfo"].length - 1 && index <= thisObject.currTargetIndex) {
          return;
        }
        if (marker["sate"] == STATE_Played) {
          playedExhibitCount++;
        }
        if (marker["floorId"] == startPoint["floorId"] && marker["sate"] != STATE_Played) {
          const dis = daxiapp["naviMath"].getGeodeticCircleDistance({ x: marker["lon"], y: marker["lat"] }, { x: startPoint["lon"], y: startPoint["lat"] });
          if (minDis > dis) {
            nearestMarker = marker;
            markerIndex = index;
            minDis = dis;
          }
        }
      });

      const nearLine = null;
      routeLayer.routesInfo.forEach(function (item, index) {
        if (toNext && index < routeLayer.routesInfo.length - 1 && index <= thisObject.naviRouteIndex) {
          return;
        }
        if (!item.exhibition) {
          return;
        }
        const polyline = item["segments"][0]["polyline"];
        for (var i = 0, maxIndex = polyline.length - 1; i < maxIndex; i++) {
          const p1 = polyline[i],;
            p2 = polyline[i + 1];
          const res = [];
          daxiapp["naviMath"].pointToLineInVector([startPoint["lon"], startPoint["lat"]], p1, p2, res, 2000);
          if (item["exhibition"]["sate"] == STATE_Played) {
            return;
          }
          if (res.dis != undefined) {
            if (!nearLine || (res.dis && res.dis < nearLine.dis)) {
              //(nearestMarker && item["exhibition"].id == nearestMarker.id)
              nearLine = res;
              nearLine.routeInfo = item;
              nearLine.index = index;
            } else if (nearLine && nearestMarker && item["exhibition"].id != nearestMarker.id && res.dis && Math.abs(nearLine.dis - res.dis) < 5) {
              nearLine = res;
              nearLine.routeInfo = item;
              nearLine.index = index;
            }
          }
        }
      });
      if (nearLine) {
        return { marker: nearLine.routeInfo["exhibition"], distance: nearLine.dis, index: nearLine.index };
      }
      return { marker: nearLine, distance: minDis, index: markerIndex, isMarker: true };
    },

    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) return;
      const thisObject = this;
      thisObject.params = dxUtils.copyData(args);
      const mapView = this._app._mapView;
      mapView.setTopViewHeight(94);
      mapView.setBottomViewHeight(114);
      if (!thisObject.params["startPoint"] || !thisObject.params["startPoint"]["lon"] || !thisObject.params["startPoint"]["lat"]) {
        //没有起点定位成功的时候用定位点即我的位置 posMode myPosition
        thisObject.params["startPoint"] = {};
        const posInfo = mapView._locationManager["getMyPositionInfo"]();
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
        const target = thisObject._startPoint;
        const pointInfo = thisObject.params["startPoint"];
        target["lon"] = pointInfo["lon"] || 0;
        target["lat"] = pointInfo["lat"] || 0;
        target["bdid"] = pointInfo["bdid"] || "";
        target["floorId"] = pointInfo["floorId"] || "";
        target["name"] = pointInfo["name"] || pointInfo["text"] || "";
        target["address"] = pointInfo["address"] || "";
        target["posMode"] = pointInfo["posMode"] || "";
        target["poiId"] = pointInfo["poiId"] || pointInfo["id"];
      }
      this.visitRoute = thisObject.params["visitRoute"];
      const next = this.visitRoute.routesInfo[this.visitRoute.routesInfo.length - 1];
      const endPoint = next["segments"][0]["endPoint"];
      endPoint.name = next.name;
      thisObject.endPoint = endPoint;
      endPoint["imageUrl"] = "end";
      this.searchRoute(true);
      // mapView._mapSDK["on"]("poiClick",this.onPoiClick,this);
    },

    onHideByPushStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      // mapView._mapSDK["off"]("poiClick",this.onPoiClick,this);
      mapView.pushState(true);
      this.exhitRectLayer && (this.exhitRectLayer.visible = true);
      this._app._mapView._locationManager["off"]("onLocationChanged", this.listenPosToNextScenic);
    },

    onShowByPopStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      // mapView._mapSDK["off"]("poiClick",this.onPoiClick,this);
      mapView.popState();

      if (this._app.exhibitsLayer) {
        const exhibitsLayer = this._app.exhibitsLayer;
        for (var key in exhibitsLayer) {
          exhibitsLayer[key].visible = false;
        }
      }
      this.exhitRectLayer && (this.exhitRectLayer.visible = false);
      mapView._locationBtnCtrl["setUserTrackingMode"](daximap["UserTrackingMode"]["FollowWithHeading"]);
    },
    onStateEnd: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      // mapView._mapSDK["off"]("poiClick",this.onPoiClick,this);
      if (this.dxRouteManager) {
        this.dxRouteManager["removeFromMap"]();
        this.dxRouteManager = null;
        this.exhitRectLayer && this.exhitRectLayer["removeFromMap"]();
      }
      this._app._mapView._locationManager["off"]("onLocationChanged", this.listenPosToNextScenic);
    },
    searchRoute: function (isStart, toNext) {
      this.clearAllRenderObject();
      const thisObject = this;
      const mapView = this._app._mapView;
      const naviManager = mapView._naviManager;

      const startPoint = thisObject.params["startPoint"];
      const bdid = startPoint["bdid"] || "";
      const data = this.findNearestExhibit(startPoint, toNext);
      thisObject.currTargetIndex = data["index"];
      thisObject.currTargetMarker = data["maker"];
      if (!data["marker"]) {
        console.log("没有匹配到景点");
        return;
      }
      this.getExhibitPolygon(data["marker"]);

      const params = { startPoint: startPoint, token: thisObject._token, bdid: bdid, segments: [] };
      const routeInfo = this.visitRoute;
      const segments = routeInfo["routesInfo"].slice(data["index"] + 1);
      const segments2 = routeInfo["routesInfo"].slice(data["index"]);
      this._resetSegments = segments2;
      if (startPoint["floorId"] && startPoint["bdid"]) {
        startPoint["idtype"] = 3;
      } else {
        startPoint["idtype"] = 2; //2;
      }
      const bdid = startPoint["bdid"] | "";
      const params;
      if (segments.length == 0) {
        const _startPos = segments2[0]["segments"][0]["startPoint"];
        const _endPos = segments2[0]["segments"][0]["endPoint"];
        _endPos["name"] = segments2["name"];
        // var dis1 = daxiapp["naviMath"].getGeodeticCircleDistance({ x: _startPos["lon"], y: _startPos["lat"] }, {x:startPoint["lon"],y:startPoint["lat"]});
        // var dis2 = daxiapp["naviMath"].getGeodeticCircleDistance({ x: _endPos["lon"], y: _endPos["lat"] }, {x:startPoint["lon"],y:startPoint["lat"]});
        //    if(dis1>dis2*1.3){
        params = { startPoint: startPoint, endPoint: _endPos, token: thisObject._token, bdid: bdid, includeStartEnd: "false", transittype: 2 };
        //    }else{
        //    params = {"startPoint":startPoint,"endPoint":_startPos,"token":thisObject._token,"bdid":bdid,"includeStartEnd":"false","transittype":2};
        //    }
      } else {
        params = {
          startPoint: startPoint,
          endPoint: segments[0]["segments"][0]["startPoint"],
          token: thisObject._token,
          bdid: bdid,
          includeStartEnd: "false",
          transittype: 2,
        };
        params["endPoint"]["name"] = segments[0]["name"];
      }
      naviManager["registerCallback"]({
        onNavigationReset: function (routeData) {},
        onCalculateRouteSuccess: function (data) {
          //路线计算成功
          thisObject.onRouteReviced(data, segments2, isStart);
        },
        onRouteParsed: function (data) {},
        onNaviStateChanged: function (naviState) {
          //隐藏换层动画图片
          // thisObject._floorChangeView.hide();
        },
        onNavigationFinished: function (data) {
          //导航完成
          if (thisObject.naviRouteIndex < thisObject.naviRoutes.length - 1) {
            naviManager.exitNavi();
            thisObject.currTargetMarker && (thisObject.currTargetMarker.state = STATE_Played);
            thisObject.dxRouteManager.removeFromMap();
            thisObject._naviTipView.setNaviState("finishedNotLast");
            const _nextExhibitInfo = thisObject.visitRoute["markersInfo"][thisObject.currTargetIndex + 1];
            thisObject._naviTipView.setTargetInfo(_nextExhibitInfo);
            if (thisObject.targetExhibitRect) {
              thisObject._app._mapView._locationManager["on"]("onLocationChanged", thisObject.listenPosToNextScenic);
            } else {
              thisObject.naviRouteIndex++;
              thisObject.currTargetIndex++;
              // var _exhibitInfo = thisObject.visitRoute["markersInfo"][thisObject.currTargetIndex];

              if (_exhibitInfo) {
                thisObject.getExhibitPolygon(_exhibitInfo);
              }
              thisObject.startNavigation();
            }
          } else {
            thisObject.hideCross();
            thisObject._naviTipView.setNaviState("finished");
            thisObject.onNavigationFinished();
          }
        },
        onNavigationExited: function () {
          // thisObject._floorChangeView.hide();
          if (thisObject.naviRouteIndex < thisObject.naviRoutes.length - 1) {
            return;
          }
          thisObject.hideCross();
          thisObject._naviTipView.setNaviState("exit");
          thisObject._naviTipView.hide();
        },
        onCalculateRouteFailure: function (code) {
          thisObject.hideCross();
          //路线计算失败

          dxUtils.modal.show({
            img: "./images/icon_position.png",
            text: "重新规划失败",
            detail: "", // + (endPoint["address"] ? endPoint["address"]:" "),
            btnArr: ["关闭"],
            callback: function (index) {
              thisObject.exitNavigation();
              thisObject._app._stateManager.goBack();
            },
          });
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

          // if(thisObject._naviBottomView){
          //     thisObject._naviBottomView.updateData(naviInfo);
          // }
          if (naviInfo.remainDistance) {
            const date = new Date(Date.now() + naviInfo.remainDistance * 1000);
            const str = date.getHours() + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
            thisObject._naviTipView.setArringTime(str);
          }
          if (naviInfo["grayT"]) {
            // DXGrayPolyLineVisitor(mapView._mapSDK["getRootScene"]()).visit(naviInfo["floorId"], naviInfo["grayT"], naviInfo["grayData"]);
            thisObject.dxRouteManager.setGrayByTime(0, naviInfo["floorId"], naviInfo["grayT"]);
          }
        },
        onReCalculateRouteForYaw: function (params) {
          //开始偏航重算路径
          const config = thisObject._app._config;
          const transittype = config.transittype == undefined ? 0 : config.transittype;
          params["transittype"] = transittype;
          const mapView = thisObject._app._mapView;
          mapView._naviManager["exitNavi"]();

          const posInfo = mapView._locationManager.getMyPositionInfo();
          const real_pos = posInfo["real_pos"];
          if (thisObject.targetExhibitRect && real_pos && daxiapp["naviMath"].pointInPolygon([real_pos["x"], real_pos["y"]], thisObject.targetExhibitRect)) {
            thisObject.currTargetMarker && (thisObject.currTargetMarker.state = STATE_Played);
            if (thisObject.naviRouteIndex < thisObject.naviRoutes.length - 1) {
              thisObject._naviTipView.setNaviState("finishedNotLast");
              const _nextExhibitInfo = thisObject.visitRoute["markersInfo"][thisObject.currTargetIndex + 1];
              thisObject._naviTipView.setTargetInfo(_nextExhibitInfo);
            }

            thisObject.dxRouteManager.removeFromMap();
            thisObject._app._mapView._locationManager["on"]("onLocationChanged", thisObject.listenPosToNextScenic);
            return;
          }
          daxiapp["domUtil"].tipNotice("您已偏离导航,正在为您重新规划路线", 3000);
          // naviManager["queryRoutePath"](params);

          const startPoint = thisObject.params["startPoint"];
          const pos = posInfo["real_pos"];
          if (pos) {
            startPoint["lon"] = pos["x"];
            startPoint["lat"] = pos["y"];
            pos["floorId"] && (startPoint["floorId"] = pos["floorId"]);
          } else {
            pos = posInfo["position"];
            startPoint["lon"] = pos[0];
            startPoint["lat"] = pos[1];
          }

          startPoint["floorId"] = posInfo["floorId"];
          startPoint["bdid"] = posInfo["bdid"];
          thisObject.searchRoute();
        },
        onLocationChanged: function (naviLocation) {},
        updateCameraInfo: function (naviCameraInfo) {},
        onOpenTriNaviApp: function () {
          // nextToRouteSegment();
        },

        onRouteStepPause: function (routeStep) {
          if (!thisObject.visible) {
            return;
          }
          thisObject._naviTipView.setNaviState("pause");
        },
        onRouteStepResume: function (routeStep) {
          if (!thisObject.visible) {
            return;
          }
          thisObject._naviTipView.setNaviState("navigating");
          mapView._locationBtnCtrl.setUserTrackingMode(daximap["UserTrackingMode"]["FollowWithHeading"]);
          //thisObject._listener && thisObject._listener["onRouteStepResume"] && thisObject._listener["onRouteStepResume"](routeStep);
        },
      });
      naviManager["queryRoutePath"](params);
    },
    getExhibitPolygon: function (marker) {
      const thisObject = this;
      thisObject.exhitRectLayer && thisObject.exhitRectLayer["removeFromMap"]();
      if (marker && marker["id2"]) {
        // var toExhitDis = daxiapp["naviMath"].getGeodeticCircleDistance({ x: data["marker"]["lon"], y: data["marker"]["lat"] }, {x:startPoint["lon"],y:startPoint["lat"]});
        const id = marker["id2"];
        // 获取景点围栏
        const url =;
          (thisObject._app._config["getExhibitFenceUrl"] || "https://map1a.daxicn.com/server39/daxi-manager/api/museum/exhibitExplain") +
          "?token=" +
          thisObject._app._params["token"] +
          "&bdid=" +
          thisObject._app._params["bdid"] +
          "&id=" +
          id;
        dxUtil.getData(url, {}, "json", function (data) {
          if (data.success) {
            const res = data.result;
            const rect = res["extent"].split(",").map(function (item) {;
              const arr = item.split(" ");
              return [parseFloat(arr[0]), parseFloat(arr[1])];
            });
            thisObject.targetExhibitRect = rect;
            if (thisObject._app._params["postLocRes"]) {
              const mapSDK = thisObject._app._mapView._mapSDK;
              thisObject.exhitRectLayer = mapSDK.createPolygon({
                bdid: marker["bdid"],
                floorId: marker["floorId"],
                features: [
                  {
                    geometry: {
                      type: "Polygon",
                      coordinates: [rect],
                    },
                  },
                ],
                fillColor: "rgb(255,0,0)",
                lineColor: null,
                opacity: 0.3,
                outlineColor: null,
              });
            }
          } else {
            thisObject.targetExhibitRect = null;
          }
        });
      } else {
        thisObject.targetExhibitRect = null;
      }
    },
    exitNavigation: function () {
      this.navigating = false;
      const naviManager = this._app._mapView._naviManager;
      naviManager.exitNavi();
      this._naviTipView.setNaviState("exit");
      this._naviTipView.hide();
      const locationManager = this._app._mapView._locationManager;
      locationManager["stopMatchRoute"]();
      thisObject.exhitRectLayer && thisObject.exhitRectLayer["removeFromMap"]();
    },
    onNavigationFinished: function () {
      const thisObject = this;

      if (thisObject._naviTipView) {
        thisObject._naviTipView.hide();
      }
      // if(thisObject._naviBottomView){
      //     thisObject._naviBottomView.hide();
      // }

      const endPoint = thisObject.params.endPoint;
      dxUtils.modal.show({
        img: "./images/icon_position.png",
        text: "您已到达目的地",
        detail: endPoint && endPoint["name"], // + (endPoint["address"] ? endPoint["address"]:" "),
        btnArr: ["关闭"],
        callback: function (index) {
          thisObject.exitNavigation();
          thisObject._app._stateManager.goBack();
        },
      });
      thisObject._app._mapView._speakListener.speakNow("导航结束");
      thisObject.navigationState = "finished";
    },
    listenPosToNextScenic: function (sender, e) {
      const thisObject = DxApp._stateManager.getState("MapStateVisitNavi");
      if (thisObject.targetExhibitRect) {
        if (!daxiapp["naviMath"].pointInPolygon(e["position"], thisObject.targetExhibitRect)) {
          thisObject.targetExhibitRect = null;
          const locationManager = thisObject._app._mapView._locationManager;
          locationManager["off"]("onLocationChanged", thisObject.listenPosToNextScenic);
          thisObject.startNaviToNextRoute(true);
        }
      }
    },
    startNaviToNextRoute: function (toNext) {
      const thisObject = this;
      const locationManager = thisObject._app._mapView._locationManager;
      const posInfo = locationManager.getMyPositionInfo();
      if (posInfo["position"][0] && posInfo["position"][1]) {
        thisObject.params["startPoint"]["lon"] = posInfo["position"][0];
        thisObject.params["startPoint"]["lat"] = posInfo["position"][1];
        thisObject.params["startPoint"]["floorId"] = posInfo["floorId"];
        thisObject.params["startPoint"]["bdid"] = posInfo["bdid"];
        thisObject.params["startPoint"]["name"] = "我的位置";
        thisObject.params["startPoint"]["posMode"] = "myPosition";
      }
      // var currTargetIndex = thisObject.currTargetIndex;
      // var routesInfo = thisObject.params.visitRoute.routesInfo;
      // if(currTargetIndex < (routesInfo.length-1)){
      //     var polyline = this.params.visitRoute.routesInfo[currTargetIndex+1].segments[0].polyline;
      //     var minDis = Number.MAX_VALUE;
      //     for(var i = 1;i<polyline.length;i++){
      //         var p1 = polyline[i-1],p2 = polyline[i];
      //         var res = {};
      //         var isInLine = daxiapp["naviMath"].pointToLineInVector(posInfo["position"],p1,p2,res,1000);
      //         if(isInLine !=false && res["dis"] < minDis){
      //             minDis = res["dis"];
      //         }
      //     }
      //     if(minDis < 18){
      //         thisObject.naviRouteIndex++;
      //         thisObject.currTargetIndex++;
      //         var _exhibitInfo = thisObject.visitRoute["markersInfo"][thisObject.currTargetIndex];
      //         if(_exhibitInfo){
      //             thisObject.getExhibitPolygon(_exhibitInfo);
      //         }
      //         thisObject._naviTipView.setTargetInfo(_exhibitInfo);
      //         thisObject.startNavigation();
      //         return;
      //     }
      // }
      this.searchRoute(false, toNext);
    },

    onRouteReviced: function (data, segments, isStart) {
      //domUtils.showInfo("路线规划完成");
      const thisObject = this;
      if (!thisObject.visible) {
        return;
      }
      thisObject._renderObjects.forEach(function (item) {
        item["removeFromMap"]();
      });
      thisObject._renderObjects = [];
      thisObject._visitorRouterLayers = [];
      if (data["code"] == -1) {
        dxUtils.modal.show({
          img: "./images/icon_position.png",
          text: "导航路线规划失败,返回路线状态",
          detail: "",
          btnArr: ["确定"],
          callback: function (index) {
            thisObject._app._stateManager.goBack();
          },
        });
        return;
      }
      const mapSDK = this._app._mapView._mapSDK;
      const thisObject = this;
      const routes = [data];
      this.naviRoutes = routes;
      this.naviRouteIndex = 0;
      const markerMap = {};
      const bdid = thisObject.params["startPoint"]["bdid"];
      const flid = thisObject.params["startPoint"]["floorId"];
      markerMap[flid] = [thisObject.params["startPoint"]];
      thisObject.params["startPoint"]["imageUrl"] = "start";
      const endPoint = thisObject.endPoint;
      if (endPoint["floorId"] != flid) {
        markerMap[endPoint["floorId"]] = [endPoint];
      } else {
        markerMap[flid].push(endPoint);
      }
      segments.forEach(function (item, routeindex) {
        const exhibition = item["exhibition"];
        const segs = item["segments"];
        const bdid = segs[0]["bdid"];
        const segStartPos = segs[0]["startPoint"];
        const segEndPos = segs[segs.length - 1]["endPoint"];
        if (routeindex == 0) {
          data["transits"][0]["segments"][0]["exhibition"] = exhibition || (segEndPos["name"] = item["name"] && segEndPos);
        }
        const naviInfoList = [];
        const steps = [];
        if (routeindex > 0) {
          const routeInfo = {;
            code: 0,
            transits: [
              {
                segments: [
                  {
                    routetype: 3,
                    bdid: bdid,
                    detail: {
                      bdid: bdid,
                      departure_point: {
                        floorid: segStartPos["floorId"],
                        location: segStartPos["lon"] + "," + segStartPos["lat"],
                        name: "",
                      },
                      arrival_point: {
                        floorid: segEndPos["floorId"],
                        location: segEndPos["lon"] + "," + segEndPos["lat"],
                        name: item["name"],
                      },
                      steps: steps,
                      rawRoute: {
                        route: [
                          {
                            buildingId: bdid,
                            path: {
                              end: { x: segEndPos["lon"], y: segEndPos["lat"] },
                              start: { x: segStartPos["lon"], y: segStartPos["lat"] },
                              naviInfoList: naviInfoList,
                            },
                          },
                        ],
                      },
                    },
                    startpoint: segStartPos,
                    endpoint: segEndPos,
                    exhibition: exhibition,
                  },
                ],
              },
            ],
          };
          routes.push(routeInfo);
        }

        segs.forEach(function (seg, m) {
          const routeMarkerOption = [];
          const floorId = seg["floorId"];
          const bdid = seg["bdid"];
          var polylineArrs = seg["polyline"]; //.slice(1);
          const floorInfo = bdid ? mapSDK.getFloorInfo(bdid, seg["floorId"]) : {};
          const startPos = seg["startPoint"];
          const endPos = seg["endPoint"];
          if (segs.length > 1) {
            if (m == 0) {
              //第一段结尾
              seg["endPoint"]["imageUrl"] = "huan_end";
              routeMarkerOption.push(seg["endPoint"]);
            } else {
              // 换层起点
              seg["startPoint"]["imageUrl"] = "huan_start";
              routeMarkerOption.push(seg["startPoint"]);
              if (m < segs.length - 1) {
                //非最后一段换层终点
                seg["endPoint"]["imageUrl"] = "huan_end";
                routeMarkerOption.push(seg["endPoint"]);
              }
            }
          } else {
            if (routeindex < segments.length - 1) {
              seg["endPoint"]["markerIcon"] = "images/green_point.png";
              seg["endPoint"]["scale"] = 0.5;
              seg["endPoint"]["anchor"] = "center";
              routeMarkerOption.push(seg["endPoint"]);
            }
          }
          if (routeMarkerOption.length) {
            const markerLayer = new daximap["DXSceneMarkerLayer"]();
            markerLayer.initialize(mapSDK, {
              markers: routeMarkerOption,
              bdid: bdid,
              floorId: floorId,
              "icon-allow-overlap": true,
              "text-allow-overlap": true,
            });
            markerLayer.id = "marker" + dxUtils.createUUID();
            markerLayer.addToMap();
            thisObject._renderObjects.push(markerLayer);
          }
          const auxiliaryLine = seg["auxiliaryLine"];
          if (auxiliaryLine) {
            const polylineOptions = {;
              data: [{ coordinates: [auxiliaryLine] }],
              id: dxUtils.createUUID(),
              bdid: bdid,
              floorId: floorId,
              "line-color": auxiliaryLine["lineColor"] || "#f00", //#2b8cd8 // 橘色 #fa6b16
              "line-dasharray": [1, 1],
              "line-width": 4,
            };

            const polylineLayer = new daximap["DXMapPolylineLayer"]();
            polylineLayer["initialize"](mapSDK, polylineOptions, floorId);
            polylineLayer["addToMap"]();
            // segmentPolylines.push(polylineLayer);
            thisObject._renderObjects.push(polylineLayer);
          }
          if (routeindex > 0) {
            const geometry = [];
            const step = {;
              destination: endPos["lon"] + "," + endPos["lat"],
              floorId: startPos["floorId"],
              origin: startPos["lon"] + "," + startPos["lat"],
              polyline: "",
              outLineColor: "rgba(255,255,255,0.7)",
              lineColor: item["roadColor"],
            };
            polylineArrs.forEach(function (pos) {
              geometry.push({ x: pos[0], y: pos[1] });
              if (step["polyline"].length) {
                step["polyline"] += ";";
              }
              step["polyline"] += pos.join(",");
            });
            naviInfoList.push({ action: "0x06", floor: floorId, fn: floorInfo["flname"], fnum: floorInfo["flnum"], geometry: geometry });
            const polylineOptions = {;
              lineData: polylineArrs,
              id: dxUtils.createUUID(),
              bdid: bdid,
              floorId: floorId,
              lineColor: item["roadColor"] || "#f78716", //#2b8cd8 // 橘色 #fa6b16
              outLine: {
                lineColor: "#fff",
                // "lineWidth":12
              },
            };
            const polylineLayer = new daximap["DXScenePolyline"]();
            polylineLayer["initialize"](mapSDK, polylineOptions, floorId);
            polylineLayer["addToMap"]();
            // segmentPolylines.push(polylineLayer);
            thisObject._visitorRouterLayers.push(polylineLayer);
            thisObject._renderObjects.push(polylineLayer);
            steps.push(step);
          }
        });
        if (exhibition) {
          const exhibitId = exhibition["exhibitId"];
          exhibition["width"] = 40;
          exhibition["height"] = 40;
          exhibition["highlightWidth"] = 64;
          exhibition["highlightHeight"] = 64;
          exhibition["showText"] = true;
          exhibition["id"] = exhibitId;
          // 加展品图层
          const flid = exhibition["floorId"];
          if (!markerMap[flid]) {
            markerMap[flid] = [];
          }
          markerMap[flid].push(exhibition);
        }
      });
      for (var flid in markerMap) {
        const markerLayer = new daximap["DXSceneMarkerLayer"]();
        markerLayer.initialize(mapSDK, {
          markers: markerMap[flid],
          bdid: bdid,
          floorId: flid,
          "icon-allow-overlap": true,
          "text-allow-overlap": true,
          onClick: function (markerInfo) {
            // thisObject.openPoiDetailPage(markerInfo)
            /* if(markerInfo["type"] == 3){
                             DXHighlightMarkerVisitor(mapSDK["getRootScene"](), markerInfo["featureId"])["visit"]();
                             thisObject.activeExhibit(markerInfo);
                         }*/
          },
        });
        markerLayer.id = "marker" + dxUtils.createUUID();
        markerLayer.addToMap();
        thisObject._renderObjects.push(markerLayer);
      }
      thisObject.startNavigation(isStart);
    },
    startNavigation: function (isStart) {
      const thisObject = this;
      thisObject.navigationState = "navigating";
      const data = this.naviRoutes[this.naviRouteIndex];
      if (thisObject.dxRouteManager) {
        thisObject.dxRouteManager["removeFromMap"]();
      }
      const mapView = this._app._mapView;
      const naviManager = mapView._naviManager;
      for (var i = 0; i < this.naviRouteIndex - 1; i++) {
        thisObject._visitorRouterLayers[i].setGrayPoints(1);
      }
      const mapSDK = mapView._mapSDK;
      const dxRouteManager = new daximap["DXRouteManager"]();
      dxRouteManager["initialize"](mapSDK);
      if (data["route"]) {
        thisObject._currentRouteSegments = { segments: data.route };
        dxRouteManager["setRouteDatas"]([data]);
        naviManager.setRoute([data]);
      } else if (data["transits"]) {
        thisObject._currentRouteSegments = data["transits"][0];
        thisObject._currentRouteSegments["wrapperColor"] = "#fff";
        const options = { startPoint: false, endPoint: false };
        dxRouteManager["setRouteDatas"](data["transits"], 0, options);
        naviManager.setRoute(data["transits"]);
      }
      thisObject.dxRouteManager = dxRouteManager;
      naviManager.selectRouteId(0);
      const routeData = naviManager.getSelectedRouteData();
      const duration = routeData["segments"][0]["detail"]["duration"];
      if (duration) {
        const date = new Date(Date.now() + duration * 1000);
        const str = date.getHours() + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
        thisObject._naviTipView.setArringTime(str);
      }
      const endPoint = thisObject._currentRouteSegments["segments"][0]["exhibition"] || thisObject.endPoint;
      thisObject._naviTipView.setTargetInfo(endPoint);

      naviManager.startNavigation(null, { routeSegType: 4 });
      thisObject._naviTipView.show();
      // 定位导航跟随
      mapView._locationBtnCtrl.setUserTrackingMode(daximap["UserTrackingMode"]["FollowWithHeading"]);
      thisObject._naviTipView.setNaviState("navigating");
    },
    boundBoxByRoute: function (isFullView) {
      const mapSDK = this._app._mapView._mapSDK;
      if (isFullView) {
        const bdid = "",;
          floorId = "";
      } else {
        const bdid = mapSDK["getCurrentBDID"](),;
          floorId = mapSDK["getCurrentFloorId"]();
      }
      const ret = DXGetPolyLineBoundaryRecursiveVisitor(mapSDK["getRootScene"](), bdid, floorId).visit();
      var diffLon = 0; //e["lon"] - (bbox._min[0] + bbox._max[0]) * 0.5;
      var diffLat = 0; //e["lat"] - (bbox._min[1] + bbox._max[1]) * 0.5;
      if (ret.isSuccess) {
        const bbox = ret.aabb;
        const bounds = [bbox._min[0] + diffLon, bbox._min[1] + diffLat, bbox._max[0] + diffLon, bbox._max[1] + diffLat];
        mapSDK["fitBounds"]({
          bounds: bounds,
          duration: 300,
          padding: 10,
        });
      }
    },
    hideCross: function () {
      //隐藏路口放大图
      this._app.crossPano && this._app.crossPano.hide();
      const mapSDK = this._app._mapView._mapSDK;
      mapSDK["setPadding"]({ top: 50 });
    },
    exitNavi: function () {
      const app = this._app;
      if (this.navigationState == "finished") {
        const naviManager = app._mapView._naviManager;
        naviManager.exitNavi();
        app._stateManager.goBack();
      } else {
        this._naviTipView.triggerExitNaviBtnClick();
      }
    },
    runCommond: function (command) {
      if (command["method"] == "goBack") {
        this._backComboxBtn.triggerEvent("click");
      }
    },
    runCommand: function (command) {
      if (command["method"] == "goBack") {
        this._backComboxBtn.triggerEvent("click");
      }
      if (command["method"] == "showExhibit") {
        const app = this._app;
        const thisObject = this;
        const bdid = command["bdid"] || app._mapView._mapSDK.getCurrentBDID();
        const exhibitId = command["id"] || command["poiId"] || command["poiIds"];
        const exhibitUrl = app._config["exhibitDetailUrl"];
        const baseURL = app._config.baseURL;
        baseURL = baseURL.replace(/\$token/g, thisObject._app._params["token"]);
        baseURL = baseURL.replace(/\$bdid/g, thisObject._bdid || thisObject._app._params["bdid"]);
        if (exhibitUrl && exhibitId) {
          app.downloader.getServiceData(exhibitUrl + "/" + exhibitId, "get", "json", { token: app._params["token"], bdid: bdid }, function (data) {
            const params = data["result"];
            if (params) {
              const introImage = params["introImage"] == "null" ? "" : params["introImage"];
              const info = {;
                id: exhibitId,
                id2: params["id2"],
                name: params["name"] || params["exhibit_name"],
                exhibition_name: params["exhibitionName"] || params["name"],
                imageUrl: params["imageUrl"].indexOf("http") == -1 ? baseURL + params["imageUrl"] : params["imageUrl"],
                thumbnail: params["thumbnail"].indexOf("http") == -1 ? baseURL + params["thumbnail"] : params["thumbnail"],
                audioUrl: params["audioUrl"].indexOf("http") == -1 ? baseURL + params["audioUrl"] : params["audioUrl"],
                description: params["description"] || params["content"],
                address: params["address"] || params["place"],
                lon: params["lon"],
                lat: params["lat"],
                floorId: params["floorId"],
                bdid: params["bdid"],
                width: 64,
                height: 64,
                detailUrl: params["detailUrl"] || "/pages/exhibit/detail/index",
                iconClose: true,
                showLineBtn: false,
                type: params["type"] || "Exhibit",
                infoUrl: params["infoUrl"],
                detailText: "详情",
                exhibitId: exhibitId,
                introImage: introImage && introImage.indexOf("http") == -1 ? baseURL + introImage : introImage,
              };
              thisObject.audioInfo = info;
              thisObject._dxCardWithAudioCtrl.updateData(info);
              thisObject._dxCardWithAudioCtrl.show();
            } else {
              //提示没有查到相关数据
              thisObject._dxCardWithAudioCtrl.hide();
            }
          });
        }
      }
    },
    openPoiDetailPage: function (markerInfo, markerLayer) {
      const thisObject = this;
      if (!markerInfo.exhibitId) {
        return;
      }
      const baseURL = thisObject._app._config.baseURL;
      baseURL = baseURL.replace(/\$token/g, thisObject._app._params["token"]);
      baseURL = baseURL.replace(/\$bdid/g, thisObject._bdid || thisObject._app._params["bdid"]);
      const floorId = markerInfo["floorId"];
      if (!floorId || !(markerInfo["highlightImageUrl"] || markerInfo["imageUrl"])) {
        return;
      }
      // item["highlightImageUrl"] =  item["highlightImageUrl"] || item["imageUrl"];
      if (markerInfo["sprite"] != 1) {
        markerInfo["id"] = markerInfo["exhibitId"] || "";
      }
      markerInfo["description"] = markerInfo["description"] || "";
      if (markerInfo["id"]) {
        //展品图标默认取default_markers@2x.png
        markerInfo["markerIcon"] = "museum_" + markerInfo["id"];
        markerInfo["activeMarkerIcon"] = "museum_" + markerInfo["id"];
      }
      if (markerInfo["sprite"] == 0) {
        if (markerInfo["imageUrl"].indexOf("http") == -1) {
          markerInfo["markerIcon"] = baseURL + markerInfo["imageUrl"];
          markerInfo["activeMarkerIcon"] = baseURL + markerInfo["imageUrl"];
        } else {
          markerInfo["markerIcon"] = markerInfo["imageUrl"];
          markerInfo["activeMarkerIcon"] = markerInfo["imageUrl"];
        }
      }

      markerInfo["lon"] = parseFloat(markerInfo["lon"]);
      markerInfo["lat"] = parseFloat(markerInfo["lat"]);
      if (markerInfo["sprite"] == 1) {
        markerInfo["markerIcon"] = "museum_1";
        markerInfo["activeMarkerIcon"] = "museum_1";
        if (markerInfo.audioUrl.indexOf("http") == -1) {
          // todo 需要配置音频地址
          markerInfo.audioUrl = "https://cdn.metadesk.group/voiceguide/" + markerInfo.audioUrl;
        }
        // var loc = daxiapp["GCJ2WGSUtils"]["bd09_To_Gcj02"](markerInfo["lat"],markerInfo["lon"]);
        // markerInfo["lon"] = loc["lon"];
        // markerInfo["lat"] = loc["lat"];
      }
      markerInfo["width"] = markerInfo["width"] || 48;
      markerInfo["height"] = markerInfo["height"] || 48;
      markerInfo["highlightWidth"] = markerInfo["highlightWidth"] || 64;
      markerInfo["highlightHeight"] = markerInfo["highlightHeight"] || 64;
      markerInfo["highlightLater"] = true;
      if (markerInfo["showText"] != 0) {
        markerInfo["showText"] = true;
      }
      if (markerInfo["type"] != 1) {
        //商铺、餐饮不显示图标...
        markerInfo["noIcon"] = true;
      }
      markerInfo["thumbnail"] = baseURL + markerInfo["thumbnail"];
      if (markerInfo["introImage"]) {
        markerInfo["introImage"] = baseURL + markerInfo["introImage"];
      }
      markerInfo["imageUrl"] = baseURL + markerInfo["imageUrl"];
      markerInfo["iconClose"] = true;
      markerInfo["showLineBtn"] = true;
      markerInfo["text-anchor"] = "top";
      markerInfo["bdid"] = markerInfo["bdid"] || bdid;
      // markerInfo["type"] = "Exhibit";
      const key = markerInfo["bdid"] + markerInfo["floorId"];
      key += "_" + markerInfo["period"];
      thisObject._dxCardWithAudioCtrl.updateData(markerInfo);
      thisObject._dxCardWithAudioCtrl._dom.show();
    },
    openRoute: function (poinInfo) {
      const locationManager = this._app._mapView._locationManager;
      const startPoint = {};
      if (locationManager) {
        const myPositionInfo = locationManager["getMyPositionInfo"]();
        const lon = myPositionInfo["position"][0];
        const lat = myPositionInfo["position"][1];
        const bdid = myPositionInfo["bdid"] || "";
        const floorId = myPositionInfo["floorId"] || "";
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
    /**
     * 获取支付状态（调用全局工具方法）
     * @param {Function} successCB 成功回调
     * @param {Function} failedCB 失败回调
     */
    getPayStatus: function (successCB, failedCB) {
      const thisObject = this;
      const command = thisObject._app._params;
      daxiapp.utils.getPayStatus(
        {
          getPayStatusUrl: thisObject._app._config.getPayStatusUrl,
          token: command.token,
          bdid: command.bdid,
          userId: command.userId,
        },
        successCB,
        failedCB
      );
    },
    onPoiClick: function (sender, feature) {
      setTimeout(function () {
        sender.openPoi(feature["properties"]);
      }, 0);
    },
    openPoi: function (poiInfo, markerLayer) {
      const thisObject = this;
      const bdid = thisObject._app._mapView._mapSDK["getCurrentBDID"]();
      const token = thisObject._app._params.token;
      const arealType = "outdoor";
      if (bdid) {
        arealType = "indoor";
      }
      const floorId = poiInfo["floorId"];
      const floorName = "",;
        floorCnName = "";
      if (floorId && false) {
        const floorInfo = thisObject._app._mapView.currBuilding["getFloorInfo"](floorId);
        floorName = floorInfo["flname"];
        floorCnName = floorInfo["flcnname"];
      }
      const poiData = daxiapp.utils.copyData(poiInfo);
      poiData["featureId"] = poiData["featureId"] || poiData["id"];
      poiData["bdid"] = poiData["bdid"] || bdid;
      poiData["floorName"] = poiData["floorName"] || floorName;
      poiData["address"] = poiData["address"] || floorCnName || floorName;
      poiData["exhibitId"] = poiData["exhibitId"] || "";
      const args = {;
        method: "openPoiDetailPage",
        data: {
          bdid: bdid,
          token: token,
          arealType: arealType,
          poiInfo: poiData,
        },
      };
      // if(thisObject.buildingInfo && thisObject.buildingInfo.brsSearchByDef &&  thisObject.buildingInfo.defStartPoint){
      if (thisObject.buildingInfo && thisObject.buildingInfo.defStartPoint) {
        thisObject.buildingInfo.defStartPoint.bdid = thisObject.buildingInfo.bdid;
        const locationManager = thisObject._app._mapView._locationManager;
        // 定位点
        const myPositionInfo = locationManager["getMyPositionInfo"]();
        if (!myPositionInfo.floorId || myPositionInfo.bdid != thisObject.buildingInfo.bdid) {
          const defStartPoint = thisObject.buildingInfo.defStartPoint;
          args["data"]["defStartPoint"] = defStartPoint;
        }
      }
      const stateManager = thisObject._app._stateManager;
      const mapStatePoiDetail = stateManager.getMapState("MapStatePoiDetail");
      const MapStateExhibitionRoute = stateManager.getMapState("MapStateExhibitionRoute");
      if (thisObject == stateManager.getCurrentState()) {
        // markerLayer && markerLayer["highlightMarker"](poiInfo["id"]);
        thisObject._app._stateManager.pushState("MapStatePoiDetail", args);
      } else if (mapStatePoiDetail == stateManager.getCurrentState()) {
        // markerLayer && markerLayer["highlightMarker"](poiInfo["id"]);
        // domUtils.showInfo("mapStatePoiDetail++");
        mapStatePoiDetail.openPoiDetailPage(args["data"]["poiInfo"], markerLayer);
      } else if (MapStateExhibitionRoute == stateManager.getCurrentState()) {
        // MapStateExhibitionRoute.openPoiDetailPage(args["data"]["poiInfo"],markerLayer);
      }
    },
  });
  daxiapp["MapStateVisitNavi"] = MapStateVisitNavi;
})(window);
