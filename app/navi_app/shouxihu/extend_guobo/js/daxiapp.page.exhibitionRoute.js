(function (global) {
  "use strict";
  const daxiapp = global.DaxiApp || {};
  const daximap = global.DaxiMap || {};
  const DXMapUtils = daximap.DXMapUtils;
  const domUtils = daxiapp.dom;
  const dxUtils = daxiapp.utils;
  const MapStateClass = daxiapp.MapStateClass;
  const dxUtil = daxiapp.utils;
  const STATE_init = 0;
  const STATE_unReaded = 1;
  const STATE_Played = 2;
  const MapStateExhibitionRoute = MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "MapStateExhibitionRoute";
    },
    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      thisObject.name = thisObject.pageName = "exhibitsroute_view_page";
      const basicMapHtml = `<div id="${thisObject.pageName}" class="route_page_container"></div>`;
      domUtils.append(thisObject._container, basicMapHtml);
      thisObject._dom = domUtils.find(thisObject._container, `#${thisObject.pageName}`);
      thisObject._confirmComponent = new daxiapp.DXShowConfirmComponent();
      thisObject._confirmComponent.init(thisObject._dom, { visible: false });

      // 返回按钮初始化
      let backBtn = thisObject._dom.find(".hospital-back");
      if (backBtn.length == 0) {
        thisObject._dom.append("<div class='hospital-back' style='top:10px; left:10px'></div>");
      }
      thisObject._backBtn = domUtils.find(thisObject._dom, ".hospital-back");
      thisObject._backBtn.on("click", () => {
        thisObject.routeManager.removeFromMap();
        thisObject._app._stateManager.goBack();
      });

      thisObject._bdid = "";
      thisObject._token = app._params.token;
      thisObject._currentRoute = null;
      thisObject._startPoint = { lon: 0, lat: 0, bdid: "", floorId: "", name: "", address: "", floorName: "" };
      thisObject._endPoint = { lon: 0, lat: 0, bdid: "", floorId: "", name: "", address: "", floorName: "" };
      thisObject.naviManager = thisObject._app._mapView._naviManager;

      thisObject.dxSwiperComponent = new daxiapp.DXSwiperComponent();
      thisObject.dxSwiperComponent.init(thisObject._dom, {
        style: {
          position: "absolute",
          width: "100%",
          left: "0",
          bottom: "12px",
          "border-radius": "20px",
          background: "#fff",
          height: "100px",
          top: `${document.body.clientHeight - 100}px`,
        },
        listener: {
          slideChangeTransitionEnd: (sender, activeSlide) => {
            sender.getAllSlides().forEach((slide) => {
              if (slide == activeSlide) {
                thisObject.changeRoute(sender.activeIndex(), slide.pcompsInstance._activeIndex);
                thisObject.addActiveScenicMarker();
              }
            });
          },
        },
      });

      // 初始化弹窗组件
      thisObject._confirmComponent = new daxiapp.DXShowConfirmComponent();
      thisObject._confirmComponent.init(thisObject._dom, { visible: false });
      thisObject._confirmBottomComponent = new daxiapp.DXShowConfirmBottomComponent();
      thisObject._confirmBottomComponent.init(thisObject._dom, { visible: false });
      thisObject._tipComponent = new daxiapp.DXShowTipsComponent();
      thisObject._tipComponent.init(thisObject._dom, { visible: false });
      thisObject._payComponent = new daxiapp.DXShowPayComponent();
      thisObject._payComponent.init(thisObject._dom, { visible: false });

      app._mapView._locationManager.registBleStateListener((data) => {
        thisObject._exhibitInfoCtrls?.forEach((ctrl) => ctrl.setRightTopBtnState(data.state));
      });

      /** 设置路由图层可见性 */
      const setRouteLayersVisibility = (routeLayers, targetIndex, targetSubIndex, visible) => {
        routeLayers.forEach((item, i) => {
          for (let j = 0; j < item.length; j++) {
            const isActive = visible && targetIndex == i && targetSubIndex == j;
            item[j].routeLayer.forEach((polylines) => {
              polylines.forEach((p) => (p.visible = isActive));
            });
            item[j].exhibitsMarkers.forEach((marker) => (marker.visible = isActive));
          }
        });
      };

      /** 根据交通类型获取路线颜色 */
      const getLineColorByTraffic = (traffic) => {
        const colorMap = { 1: "#30cc2a", 2: "#ffd213", 3: "#1db4fb" };
        return colorMap[traffic] || "#30cc2a";
      };

      thisObject.routeManager = ((thisObject) => {
        const that = {
          routeLayers: [],
          renderLayer: {},
          _visible: thisObject.visible,
          activeIndex: 0,
          activeSubIndex: 0,
        };

        that.getCurentRoute = () => that.routeLayers.length && that.routeLayers[that.activeIndex];

        that.initRouteLayers = (exhitionRoutes, index) => {
          // 处理夜景模式排序
          if (app._config.hasNightScene) {
            const hours = new Date().getHours() + new Date().getMinutes() / 60;
            const [dayStart, dayEnd] = app._config.dayTime;
            thisObject.isDay = hours > dayStart && hours < dayEnd;
            const sortKey = thisObject.isDay ? "daySort" : "nightSort";
            exhitionRoutes.sort((a, b) => a[sortKey] - b[sortKey]);
          }

          const mapSDK = app._mapView._mapSDK;
          that.removeFromMap();
          that.transits = exhitionRoutes;

          const geneItem = (item, i, subIndex) => {
            const routeLayer = [];
            const markerLayers = [];
            const naviPointMarkerOptions = [];
            const routesInfo = item.routesInfo;

            routesInfo.forEach((routeInfo, routeindex) => {
              const segments = routeInfo.segments;
              let exhibition = routeInfo.exhibition;
              const segmentPolylines = [];
              let lineColor = routeInfo.roadColor;

              // 根据交通类型设置颜色
              if (routeInfo.traffic != undefined && !lineColor) {
                lineColor = getLineColorByTraffic(routeInfo.traffic);
                routeInfo.roadColor = lineColor;
              }

              const markerOptions = [];
              // 设置起点标记
              if (routeindex == 0) {
                segments[0].startPoint.imageUrl = "start";
                markerOptions.push(segments[0].startPoint);
              }

              let bdid, floorId;
              segments.forEach((segment, m) => {
                const routeMarkerOption = [];
                floorId = segment.floorId;
                bdid = segment.bdid;

                // 创建路线折线
                const polylineLayer = new daximap.DXScenePolyline();
                polylineLayer.initialize(
                  mapSDK,
                  {
                    lineData: segment.polyline,
                    id: dxUtils.createUUID(),
                    bdid,
                    floorId,
                    lineColor: lineColor || "#f78716",
                    outLine: { lineColor: "#fff" },
                  },
                  floorId,
                );
                polylineLayer.addToMap();
                segmentPolylines.push(polylineLayer);

                // 处理换层标记
                if (segments.length > 1) {
                  if (m == 0) {
                    segment.endPoint.imageUrl = "huan_end";
                    routeMarkerOption.push(segment.endPoint);
                  } else {
                    segment.startPoint.imageUrl = "huan_start";
                    routeMarkerOption.push(segment.startPoint);
                    if (m < segments.length - 1) {
                      segment.endPoint.imageUrl = "huan_end";
                      routeMarkerOption.push(segment.endPoint);
                    }
                  }
                } else if (routeindex < routesInfo.length - 1) {
                  Object.assign(segment.endPoint, {
                    markerIcon: "images/green_point.png",
                    scale: 0.5,
                    anchor: "center",
                  });
                  routeMarkerOption.push(segment.endPoint);
                }

                // 添加路线标记图层
                if (routeMarkerOption.length) {
                  const markerLayer = new daximap.DXSceneMarkerLayer();
                  markerLayer.initialize(mapSDK, {
                    markers: routeMarkerOption,
                    bdid,
                    floorId,
                    "icon-allow-overlap": true,
                    "text-allow-overlap": true,
                  });
                  markerLayer.id = `marker${dxUtils.createUUID()}`;
                  markerLayer.addToMap();
                  markerLayers.push(markerLayer);
                }

                // 处理辅助线
                if (segment.auxiliaryLine) {
                  const auxPolyline = new daximap.DXSceneSymbolLine();
                  auxPolyline.initialize(
                    mapSDK,
                    {
                      lineData: segment.auxiliaryLine,
                      arrowIcon: "./images/red_circle.png",
                      id: dxUtils.createUUID(),
                      bdid,
                      floorId,
                      "line-color": segment.auxiliaryLine.roadColor || "#f00",
                      width: 10,
                      height: 10,
                      "line-dasharray": [0, 3],
                      "line-cap": "round",
                    },
                    floorId,
                  );
                  auxPolyline.addToMap();
                  segmentPolylines.push(auxPolyline);
                }
              });

              // 处理展品信息
              if (exhibition) {
                exhibition = { ...exhibition };
                const exhibitId = exhibition.exhibitId;
                Object.assign(exhibition, {
                  width: 40,
                  height: 40,
                  highlightWidth: 64,
                  highlightHeight: 64,
                  showText: true,
                  state: STATE_init,
                  id2: exhibition.id,
                  id: exhibitId,
                  "text-anchor": "top",
                });
                if (exhibitId && !exhibition.markerIcon) {
                  exhibition.activeMarkerIcon = exhibition.markerIcon = `museum_${exhibitId}`;
                }
                markerOptions.push(exhibition);
                naviPointMarkerOptions.push(exhibition);
                bdid = exhibition.bdid;
                floorId = exhibition.floorId;
              }

              // 设置终点标记
              if (routeindex == routesInfo.length - 1) {
                const lastSegment = segments[segments.length - 1];
                lastSegment.endPoint.imageUrl = "end";
                markerOptions.push(lastSegment.endPoint);
                bdid = lastSegment.endPoint.bdid;
                floorId = lastSegment.endPoint.floorId;
              }

              // 创建展品图层
              const markerLayer = new daximap.DXSceneMarkerLayer();
              markerLayer.initialize(mapSDK, {
                markers: markerOptions,
                bdid,
                floorId,
                "icon-allow-overlap": true,
                "text-allow-overlap": true,
                onClick: (markerInfo) => thisObject.openPoiDetailPage(markerInfo),
              });
              markerLayer.id = `marker${dxUtils.createUUID()}`;
              markerLayer.addToMap();
              markerLayers.push(markerLayer);
              routeLayer.push(segmentPolylines);
            });

            if (subIndex == 0) that.routeLayers[i] = [];
            that.routeLayers[i].push({
              routeLayer,
              exhibitsMarkers: markerLayers,
              markersInfo: naviPointMarkerOptions,
              routesInfo,
            });
          };

          exhitionRoutes.forEach((item, i) => {
            if (item.routeInfo) {
              geneItem(item, i, 0);
            } else {
              item.child.forEach((childItem, index) => geneItem(childItem, i, index));
            }
          });

          that.activeRouteLayer(index, true, 0);
        };

        that.removeFromMap = () => {
          that.routeLayers.forEach((item) => {
            item.forEach((layer) => {
              layer.routeLayer.forEach((polylines) => polylines.forEach((p) => p.removeFromMap()));
              layer.exhibitsMarkers.forEach((marker) => marker.removeFromMap());
            });
          });
          that.routeLayers = [];
        };

        that.activeRouteLayer = (index, force, subIndex = 0) => {
          thisObject.nearExhibit = null;
          thisObject.exhibitInfoCtrl.hide();
          thisObject.clearHilightMarker();
          thisObject.currRouteLayer = { routes: [], markers: [] };

          if (force || that.activeIndex != index || subIndex != that.activeSubIndex) {
            that.activeIndex = index;
            that.activeSubIndex = subIndex;

            that.routeLayers.forEach((item, i) => {
              item.forEach((layer, j) => {
                const visible = index == i && subIndex == j;
                layer.routeLayer.forEach((polylines) => {
                  polylines.forEach((p) => {
                    p.visible = visible;
                    if (visible) thisObject.currRouteLayer.routes.push(p);
                  });
                });
                layer.exhibitsMarkers.forEach((marker) => {
                  marker.visible = visible;
                  if (visible) thisObject.currRouteLayer.markers.push(marker);
                });
              });
            });

            const mapSDK = app._mapView._mapSDK;
            const activeData = that.routeLayers[index][subIndex];
            thisObject.activeData = activeData;

            const firstInfo = activeData.markersInfo[0] || activeData.routesInfo[0];
            const bdid = firstInfo.bdid;
            const floorId = firstInfo.floorId;

            mapSDK.changeFloor(bdid, floorId);
            mapSDK.setTilt(10);

            const ret = DXGetPolyLineBoundaryRecursiveVisitor(mapSDK.getRootScene(), bdid, floorId).visit();
            if (ret.isSuccess) {
              const { _min, _max } = ret.aabb;
              setTimeout(() => {
                mapSDK.fitBounds({ bounds: [_min[0], _min[1], _max[0], _max[1]], padding: 10 });
              }, 10);
            }
          }
        };

        that.hideCurrentRoute = () => {
          thisObject.currRouteLayer?.routes.forEach((item) => (item.visible = false));
          thisObject.currRouteLayer?.markers.forEach((item) => (item.visible = false));
        };

        that.showCurrentRoute = () => {
          thisObject.currRouteLayer?.routes.forEach((item) => (item.visible = true));
          thisObject.currRouteLayer?.markers.forEach((item) => (item.visible = true));
        };

        that.setGrayByTime = (index, floorId, grayT) => {
          that.routeLayers[that.activeIndex]?.routeLayer?.[index]?.forEach((polyline) => {
            if (polyline.floorId == floorId) polyline.setGrayPoints(grayT);
          });
        };

        that.resetGray = () => {
          that.routeLayers[that.activeIndex]?.routeLayer?.[that.activeIndex]?.forEach((p) => p.setGrayPoints(0));
        };

        daxiapp.defineProperties(that, {
          visible: {
            get: () => that._visible,
            set: (val) => {
              if (val != that._visible) {
                that._visible = val;
                setRouteLayersVisibility(that.routeLayers, that.activeIndex, that.activeSubIndex, val);
              }
            },
          },
        });

        return that;
      })(thisObject);

      thisObject._renderObjects.push(thisObject.routeManager);

      /** 关闭展品弹窗并继续导航 */
      const handleExhibitClose = () => {
        thisObject.exhibitInfoCtrl.hide();
        thisObject.exhibitInfoCtrl.cancel();
        thisObject.clearHilightMarker();
        thisObject._app._mapView.setBottomViewHeight(56);
        thisObject.exhibitPalying = false;
        thisObject.continueExhibitRouteNavi(true);
      };

      thisObject.exhibitInfoCtrl = new daxiapp.DXDetailInfoComponent();
      thisObject.exhibitInfoCtrl.init(thisObject._dom, {
        style: {
          "margin-bottom": "0px",
          position: "absolute",
          width: "100%",
          left: 0,
          bottom: 0,
          "z-index": 10,
        },
        visible: false,
        listener: {
          onDeatilBtnClicked: (sender, data) => thisObject.openDetail(data),
          onAudioClicked: () => {},
          onAudioEnded: handleExhibitClose,
          onClose: handleExhibitClose,
        },
        speakListener: thisObject._app._mapView._speakListener,
      });

      /** 发送消息到小程序 */
      const postToMiniProgram = (userId, exhibitId, bdid, token) => {
        const msg = {
          type: "postEventToMiniProgram",
          id: userId,
          methodToMiniProgram: `exhibitId=${exhibitId}&bdid=${bdid}&token=${token}`,
          roleType: "receiver",
        };
        window.locWebSocketPostMessage?.(msg);
      };

      /** 导航到小程序页面 */
      const navigateToMiniProgram = (isScenic2, exhibitId, token, bdid) => {
        const url = `/pages/index/index?exhibitId=${exhibitId}&token=${token}&bdid=${bdid}`;
        if (isScenic2) {
          wx.miniProgram.navigateTo({ url });
        } else {
          wx.miniProgram.switchTab({ url });
        }
      };

      thisObject._dxCardWithAudioCtrl = new daxiapp.DXSpotPopupComponent();
      thisObject._dxCardWithAudioCtrl.init(thisObject._dom, {
        visible: false,
        listener: {
          onRouteBtnClicked: (sender, data) => thisObject.openRoute(data),
          onDeatilBtnClicked: (sender, data) => thisObject.openDetail(data),
          onAudioClicked: () => {},
          onClose: () => thisObject._dxCardWithAudioCtrl._dom.hide(),
          onImgLoaded: () => {
            const height = thisObject._dom.find(".detailInfo-component").height();
            if (height) app._mapView.setBottomViewHeight(height);
          },
          onListenBtnClicked: (sender, data) => {
            const params = thisObject._app._params;
            const { userId, token } = params;
            const bdId = data.bdid || params.buildingId;
            const exhibitId = data.id2 || data.id;
            const isScenic2 = params.scenic == "2";

            if (isScenic2) {
              postToMiniProgram(userId, exhibitId, bdId, token);
              navigateToMiniProgram(true, data.id2, token, bdId);
              return;
            }

            thisObject.getPayStatus((res) => {
              thisObject._app._stateManager.goBack();
              if (res.code != 0) {
                wx.miniProgram.navigateTo({ url: `/pages/pay/pay?token=${token}&bdid=${bdId}` });
              } else {
                postToMiniProgram(userId, exhibitId, data.bdid, params.token);
                navigateToMiniProgram(isScenic2, data.id2, token, bdId);
              }
            });
          },
          moreClick: (sender, data) => {
            let alertBox = thisObject._dom.find(".alertBox");
            if (alertBox.length) alertBox.remove();

            const imgHtml = data.introImage ? `<div><img style="width: 100%" src="${data.introImage}"></div>` : "";
            const dom = `
              <div class="alertBox">
                <div class="close icon-close2"></div>
                ${imgHtml}
                <div class="name">${data.name}</div>
                <div class="description">${data.description}</div>
              </div>`;

            domUtils.showMask();
            thisObject._dom.append($(dom));
            alertBox = thisObject._dom.find(".alertBox");

            const hideAlert = () => {
              alertBox.hide();
              domUtils.hideMask();
            };
            alertBox.find(".close").on("click", hideAlert);
            $("#__mask_info_1").on("click", hideAlert);
          },
        },
      });

      this.show(false);
      app._mapView._locationManager.on("onLocationChanged", (sender, e) => {
        if (e.locType == "GPS") {
          thisObject.aoaLoc = e;
          if (thisObject.navigating) {
            const nearData = thisObject.findNearestExhibit(e);
            nearData?.marker && thisObject.detectExhibitionTrigger(nearData);
          }
        }
      });

      thisObject.getAppConfig((appConfig) => {
        thisObject.appConfig = appConfig;
      });
    },
    clearHilightMarker: function () {
      const routeLayer = this.routeManager.getCurentRoute();
      routeLayer?.exhibitsMarkers?.forEach((item) => item.highlightMarker(""));
    },

    findNearestExhibit: function (loc, minDistance) {
      const routeLayer = this.routeManager.getCurentRoute();
      loc = loc || this.aoaLoc;
      if (!loc) return { marker: null, distance: -1, index: -1 };

      let minDis = minDistance || this._app._config.exhibitionNavPlayDis || 6;
      let nearestMarker = null;
      let markerIndex;

      routeLayer?.markersInfo?.forEach((marker, index) => {
        if (marker.floorId == loc.floorId && marker.sate != STATE_Played) {
          const dis = daxiapp.naviMath.getGeodeticCircleDistance({ x: marker.lon, y: marker.lat }, { x: loc.position[0], y: loc.position[1] });
          if (minDis > dis) {
            nearestMarker = marker;
            markerIndex = index;
            minDis = dis;
          }
        }
      });

      return { marker: nearestMarker, distance: minDis, index: markerIndex };
    },

    /** 设置路线段灰度状态 */
    _setRouteGray: function (routeLayer, index, grayValue) {
      routeLayer?.routeLayer?.[index]?.forEach((item) => item.setGrayPoints(grayValue));
    },

    detectExhibitionTrigger: function (data) {
      const thisObject = this;
      const markerIndex = data.index;
      let markerInfo = data.marker;
      const routeLayer = this.routeManager.getCurentRoute();

      if (!markerInfo && markerIndex != -1) {
        markerInfo = routeLayer?.markersInfo?.[markerIndex];
      }
      if (!markerInfo || markerInfo.markerIcon == "end") return;

      if (markerInfo.state != STATE_Played) {
        Object.assign(markerInfo, {
          autoplay: true,
          noRoute: true,
          enableClose: true,
          showLineBtn: false,
          iconClose: true,
          state: STATE_Played,
        });

        this.exhibitInfoCtrl.updateData(markerInfo);
        routeLayer.exhibitsMarkers[markerIndex].highlightMarker(markerInfo.id);
        this.exhibitInfoCtrl.show();
        this.exhibitInfoCtrl.startPlay();
        this.exhibitPalying = true;

        this._setRouteGray(routeLayer, markerIndex, 1);

        setTimeout(() => {
          const height = thisObject.exhibitInfoCtrl.getHeight();
          thisObject._app._mapView.setBottomViewHeight(height + 6);
        }, 0);
      }

      // 更新路线段灰度状态
      const markersInfo = routeLayer.markersInfo;
      markersInfo.forEach((marker, i) => {
        if (i <= markerIndex) {
          this._setRouteGray(routeLayer, i, 1);
        } else if (marker.state != STATE_Played) {
          if (this.naviExhibitIndex < markerIndex) {
            this.naviExhibitIndex = markerIndex;
          }
          this._setRouteGray(routeLayer, i, 0);
        }
      });
    },

    openRoute: function (poinInfo) {
      const locationManager = this._app._mapView._locationManager;
      let startPoint = {};

      if (locationManager) {
        const myPositionInfo = locationManager.getMyPositionInfo();
        startPoint = {
          lon: myPositionInfo.position[0],
          lat: myPositionInfo.position[1],
          bdid: myPositionInfo.bdid || "",
          floorId: myPositionInfo.floorId || "",
          name: "我的位置",
          posMode: "myPosition",
        };
      }

      this._app._stateManager.pushState("MapStateRoute", {
        method: "takeToThere",
        endPoint: poinInfo,
        startPoint,
      });
    },

    openDetail: function (data) {
      this._app.jsBridge.openExhibitDetail(
        data,
        () => {},
        () => {},
      );
    },

    /** 隐藏所有展品图层 */
    _hideAllExhibitsLayers: function () {
      const exhibitsLayer = this._app.exhibitsLayer;
      if (exhibitsLayer) {
        Object.keys(exhibitsLayer).forEach((key) => (exhibitsLayer[key].visible = false));
      }
    },

    /** 拷贝点位信息到目标对象 */
    _copyPointInfo: function (target, source) {
      if (!source) return;
      Object.assign(target, {
        lon: source.lon || 0,
        lat: source.lat || 0,
        bdid: source.bdid || "",
        floorId: source.floorId || "",
        name: source.name || source.text || "",
        address: source.address || "",
        posMode: source.posMode || "",
        poiId: source.poiId || source.id,
      });
    },

    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) return;

      const thisObject = this;
      thisObject.params = dxUtils.copyData(args);
      const mapView = this._app._mapView;

      this._hideAllExhibitsLayers();
      mapView.setBottomViewHeight(96);

      // 起点未设置时使用当前定位
      if (!thisObject.params.startPoint?.lon || !thisObject.params.startPoint?.lat) {
        const posInfo = mapView._locationManager.getMyPositionInfo();
        if (posInfo.position[0] && posInfo.position[1]) {
          thisObject.params.startPoint = {
            lon: posInfo.position[0],
            lat: posInfo.position[1],
            floorId: posInfo.floorId,
            bdid: posInfo.bdid,
            name: "我的位置",
            posMode: "myPosition",
          };
        }
      }

      this._copyPointInfo(thisObject._startPoint, thisObject.params.startPoint);
      this._copyPointInfo(thisObject._endPoint, thisObject.params.endPoint);

      this.loadExhibitsRoutes();
      mapView._mapSDK.on("poiClick", this.onPoiClick, this);
    },

    onHideByPushStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView.pushState(true);
      mapView._mapSDK.off("poiClick", this.onPoiClick, this);
      this._hideAllExhibitsLayers();
      this.routeManager.hideCurrentRoute();
    },

    onShowByPopStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView.popState();
      this._hideAllExhibitsLayers();
      this.routeManager.showCurrentRoute();
      mapView._mapSDK.on("poiClick", this.onPoiClick, this);
    },

    onStateEnd: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView._mapSDK.off("poiClick", this.onPoiClick, this);

      if (this.searchRouteTimer) {
        clearTimeout(this.searchRouteTimer);
        this.searchRouteTimer = null;
      }

      this.routeManager.removeFromMap();
      if (this.dxRouteManager) {
        this.dxRouteManager.removeFromMap();
        this.dxRouteManager = null;
      }

      this.dxSwiperComponent.top(document.body.clientHeight - 100);
      this.dxSwiperComponent.removeAllSlides();
    },
    loadExhibitsRoutes: function () {
      const thisObject = this;
      const app = thisObject._app;
      const exhibitRoute = daxiapp.cache.storage.getItem("exhibitRoute");
      const mapView = app._mapView;
      const GPSState = mapView._locationManager.getGPSState();
      const bdid = app._params.bdid || app._params.buildingId || "";

      thisObject._exhibitInfoCtrls = [];

      /** 构建单条路线子项数据 */
      const buildLineChild = (name, lineData) => ({
        name,
        description: lineData.description,
        lines: "",
        imageUrl: lineData.imageUrl,
        rightTopBtn: { icon: "icon-headset icon-middle circle-border icon-theme" },
        traffic: lineData.traffic?.split(",") || [],
        routesInfo: lineData.routesInfo,
        distance: lineData.distance,
        duration: lineData.duration,
      });

      /** 渲染路线数据 */
      const rendRoute = (data) => {
        const transits = data?.result;
        if (!transits?.length) return;

        // 处理夜景模式排序
        if (app._config.hasNightScene) {
          const hours = new Date().getHours() + new Date().getMinutes() / 60;
          const [dayStart, dayEnd] = app._config.dayTime;
          thisObject.isDay = hours > dayStart && hours < dayEnd;
          transits.sort((a, b) => a[thisObject.isDay ? "daySort" : "nightSort"] - b[thisObject.isDay ? "daySort" : "nightSort"]);
        }

        thisObject.dxSwiperComponent.removeAllSlides();
        thisObject.dxSwiperComponent.setActiveIndex(0);

        const exhitionRoutes = [];
        const slides = [];

        transits.forEach((item) => {
          const name = item.name || "推荐路线";
          let cardInfo;

          if (!item.routesInfo) {
            cardInfo = { name, child: [] };
            ["line1", "line2", "lineInfo"].forEach((key) => {
              if (item[key]) cardInfo.child.push(buildLineChild(name, item[key]));
            });
          } else {
            cardInfo = { ...buildLineChild(name, item), description: item.description };
          }

          if (app._params.exhibitRouteTest) cardInfo.test = app._params.exhibitRouteTest;
          exhitionRoutes.push(cardInfo);

          const exhibitInfoCtrl = new daxiapp.DXInfoCardComponent2();
          exhibitInfoCtrl.init(null, {
            class: "swiper-slide routeTab",
            style: { width: "100%", "padding-bottom": "20px" },
            data: cardInfo,
            listener: {
              rightTopBtnCLicked: (sender, btnData) => {
                if (!btnData.isActive) {
                  daxiapp.dom.showTips("请开启定位开关", "如何开启", () => {
                    thisObject._tipComponent.show({
                      title: "<i class='icon_gb-lanya blue'></i>如何开启定位开关",
                      content: "上/下滑找到<span class='red'>定位图标</span>打开或<span class='red'>在设置</span>中打开",
                      img: "./images/GPS.png",
                    });
                  });
                  return;
                }

                const position = mapView._locationManager.getMyPositionInfo();
                if (position.bdid != bdid) {
                  thisObject._confirmComponent.show({
                    title: "只有在景区内才能开启",
                    btnArray: ["确定"],
                  });
                  return;
                }

                thisObject._app._stateManager.pushState("MapStateVisitNavi", {
                  startPoint: position,
                  visitRoute: {
                    exhibitsMarkers: thisObject.activeData?.markerLayers,
                    routesInfo: thisObject.activeData?.routesInfo,
                    markersInfo: thisObject.activeData?.markersInfo,
                  },
                });
              },
              simulateBtnClicked: () => {},
              onClose: () => {
                thisObject.routeManager.removeFromMap();
                if (thisObject._app._stateManager._pageStack.length > 1) app._stateManager.goBack();
              },
              switchSubItem: (sender, activeSlide, subIndex) => {
                thisObject.changeRoute(thisObject.routeManager.activeIndex, subIndex);
              },
            },
          });

          thisObject._exhibitInfoCtrls.push(exhibitInfoCtrl);
          if (!GPSState) exhibitInfoCtrl.setRightTopBtnState(false);
          slides.push(exhibitInfoCtrl.getDomWithIns());
        });

        thisObject.dxSwiperComponent.appendSlide(slides);
        thisObject.addActiveScenicMarker();

        const height = Math.max(thisObject.dxSwiperComponent.getHeight(), 98);
        thisObject.routeManager.initRouteLayers(exhitionRoutes, 0);
        mapView.setBottomViewHeight(height + 6);

        // 首次使用引导
        if (!daxiapp.cache.storage.getItem("isFirstLuxian")) {
          thisObject._courseCtrl = new daxiapp.DXCourseComponent();
          thisObject._courseCtrl.init(thisObject._dom, {
            listener: { onFinish: (sender, courseData) => console.log(courseData) },
          });
          thisObject._courseCtrl.updateLuxian();
          daxiapp.cache.storage.setItem("isFirstLuxian", true);
        }
      };

      if (exhibitRoute) {
        rendRoute(JSON.parse(exhibitRoute));
        return;
      }

      daxiapp.api.getRouteAll(
        {},
        (data) => {
          const mapStateBrowse = thisObject._app._stateManager.getMapState("MapStateBrowse");
          const exhibitions = mapStateBrowse?.exhibitions || [];

          // 构建展品映射表（id2 -> exhibition）
          const exhibitionsMap = Object.fromEntries(exhibitions.filter((e) => e.id2).map((e) => [e.id2, e]));

          // 合并展品详情数据
          data.result?.forEach((routes) => {
            Object.keys(routes)
              .filter((key) => key.startsWith("line") && routes[key]?.routesInfo)
              .forEach((key) => {
                routes[key].routesInfo.forEach((routeSpot) => {
                  const targetId = routeSpot?.exhibition?.id;
                  if (targetId && exhibitionsMap[targetId]) {
                    routeSpot.exhibition = exhibitionsMap[targetId];
                  }
                });
              });
          });

          if (!thisObject.visible) return;
          rendRoute(data);
        },
        () => {},
      );
    },

    startNavigation: function () {
      this.drawNaviRoute();
    },

    drawNaviRoute: function () {
      this.findNearestExhibit(null, this._app._config.minAOAExhitionDis || 200);
    },

    changeRoute: function (index, subIndex) {
      this.routeManager.activeRouteLayer(index, false, subIndex);
    },

    activeExhibit: function (markerInfo) {
      markerInfo.noRoute = true;
      this.exhibitInfoCtrl.updateData(markerInfo);
      this.exhibitInfoCtrl.show();
      const height = this.exhibitInfoCtrl.getHeight();
      this._app._mapView.setBottomViewHeight(height);
    },

    boundBoxByRoute: function (isFullView) {
      const mapSDK = this._app._mapView._mapSDK;
      const bdid = isFullView ? "" : mapSDK.getCurrentBDID();
      const floorId = isFullView ? "" : mapSDK.getCurrentFloorId();

      const ret = DXGetPolyLineBoundaryRecursiveVisitor(mapSDK.getRootScene(), bdid, floorId).visit();
      if (ret.isSuccess) {
        const { _min, _max } = ret.aabb;
        mapSDK.fitBounds({
          bounds: [_min[0], _min[1], _max[0], _max[1]],
          duration: 300,
          padding: 10,
        });
      }
    },

    runCommand: function (command, id) {
      if (id) this.activeScenic(id);
    },

    activeScenic: function (id) {
      if (id != this.activeScenicId) {
        this.activeScenicId = id;
        this.addActiveScenicMarker();
      }
    },

    addActiveScenicMarker: function () {
      const activeSlider = this.dxSwiperComponent.getActiveSlide();
      if (!this.activeScenicId) return;

      $(activeSlider)
        .find(".routeDetail .routeList li")
        .forEach((scenic) => {
          const $scenic = $(scenic);
          const id = $scenic.attr("data-id");
          $scenic.toggleClass("posIn", id == this.activeScenicId);
        });
    },

    /**
     * 获取支付状态
     * @param {Function} successFn 成功回调
     * @param {Function} failedFn 失败回调
     */
    getPayStatus: function (successFn, failedFn) {
      const params = this._app._params;
      daxiapp.utils.getPayStatus(
        {
          getPayStatusUrl: this._app._config.getPayStatusUrl,
          token: params.token,
          bdid: params.bdid,
          userId: params.userId,
        },
        successFn,
        failedFn,
      );
    },

    getAppConfig: function (callbackFn) {
      const params = this._app._params;
      const token = params.token;
      const bdid = params.bdid || params.buildingId;
      const url = `${window.dataPath}${token}/${bdid}/pages/config.json`;

      this._app.downloader.getServiceData(url, "get", "json", {}, (data) => {
        callbackFn?.(data.config || this._app._config);
      });
    },

    /** 处理图片 URL（http 开头则直接使用，否则添加景区前缀） */
    _resolveImageUrl: function (url) {
      if (!url) return url;
      return url.startsWith("http") ? url : daxiapp.utils.addScenicUrl(url);
    },

    openPoiDetailPage: function (markerInfo) {
      if (!markerInfo.exhibitId) return;

      const floorId = markerInfo.floorId;
      if (!floorId || !(markerInfo.highlightImageUrl || markerInfo.imageUrl)) return;

      // 设置基础属性
      if (markerInfo.sprite != 1) {
        markerInfo.id = markerInfo.exhibitId || "";
      }
      markerInfo.description = markerInfo.description || "";

      // 设置图标
      if (markerInfo.id) {
        markerInfo.markerIcon = markerInfo.activeMarkerIcon = `museum_${markerInfo.id}`;
      }

      if (markerInfo.sprite == 0) {
        const iconUrl = this._resolveImageUrl(markerInfo.imageUrl);
        markerInfo.markerIcon = markerInfo.activeMarkerIcon = iconUrl;
      }

      // 解析坐标
      markerInfo.lon = parseFloat(markerInfo.lon);
      markerInfo.lat = parseFloat(markerInfo.lat);

      // 精灵图特殊处理
      if (markerInfo.sprite == 1) {
        markerInfo.markerIcon = markerInfo.activeMarkerIcon = "museum_1";
        if (!markerInfo.audioUrl?.startsWith("http")) {
          markerInfo.audioUrl = `https://cdn.metadesk.group/voiceguide/${markerInfo.audioUrl}`;
        }
      }

      // 设置尺寸和显示属性
      Object.assign(markerInfo, {
        width: markerInfo.width || 48,
        height: markerInfo.height || 48,
        highlightWidth: markerInfo.highlightWidth || 64,
        highlightHeight: markerInfo.highlightHeight || 64,
        highlightLater: true,
        showText: markerInfo.showText != 0,
        noIcon: markerInfo.type != 1,
        thumbnail: daxiapp.utils.addScenicUrl(markerInfo.thumbnail),
        imageUrl: daxiapp.utils.addScenicUrl(markerInfo.imageUrl),
        iconClose: true,
        showLineBtn: true,
        "text-anchor": "top",
        bdid: markerInfo.bdid || this._app._params.bdid || this._app._params.buildingId,
      });

      if (markerInfo.introImage) {
        markerInfo.introImage = daxiapp.utils.addScenicUrl(markerInfo.introImage);
      }

      this._dxCardWithAudioCtrl.updateData(markerInfo);
      this._dxCardWithAudioCtrl._dom.show();
    },

    onPoiClick: function (sender, feature) {
      setTimeout(() => sender.openPoi(feature.properties), 0);
    },

    openPoi: function (poiInfo, markerLayer) {
      const mapSDK = this._app._mapView._mapSDK;
      const bdid = mapSDK.getCurrentBDID();
      const token = this._app._params.token;
      const arealType = bdid ? "indoor" : "outdoor";

      const poiData = {
        ...daxiapp.utils.copyData(poiInfo),
        featureId: poiInfo.featureId || poiInfo.id,
        bdid: poiInfo.bdid || bdid,
        floorName: poiInfo.floorName || "",
        address: poiInfo.address || "",
        exhibitId: poiInfo.exhibitId || "",
      };

      const args = {
        method: "openPoiDetailPage",
        data: { bdid, token, arealType, poiInfo: poiData },
      };

      // 处理默认起点
      if (this.buildingInfo?.defStartPoint) {
        this.buildingInfo.defStartPoint.bdid = this.buildingInfo.bdid;
        const myPositionInfo = this._app._mapView._locationManager.getMyPositionInfo();
        if (!myPositionInfo.floorId || myPositionInfo.bdid != this.buildingInfo.bdid) {
          args.data.defStartPoint = this.buildingInfo.defStartPoint;
        }
      }

      const stateManager = this._app._stateManager;
      const currentState = stateManager.getCurrentState();
      const mapStatePoiDetail = stateManager.getMapState("MapStatePoiDetail");

      if (this == currentState) {
        stateManager.pushState("MapStatePoiDetail", args);
      } else if (mapStatePoiDetail == currentState) {
        mapStatePoiDetail.openPoiDetailPage(args.data.poiInfo, markerLayer);
      }
    },
  });
  daxiapp.MapStateExhibitionRoute = MapStateExhibitionRoute;
})(window);
