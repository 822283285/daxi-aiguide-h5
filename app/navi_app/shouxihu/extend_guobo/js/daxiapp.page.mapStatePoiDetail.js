(function (global) {
  "use strict";
  const daxiapp = global["DaxiApp"] || {};
  const daximap = window["DaxiMap"] || {};
  const domUtils = daxiapp["dom"];
  const dxUtil = daxiapp["utils"];
  const MapStateClass = daxiapp["MapStateClass"];
  const MapStatePoiDetail = MapStateClass.extend({;
    __init__: function () {
      this._super();
      this._rtti = "MapStatePoiDetail";
    },
    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      this._app = app;
      const lastOpenVoiceTime = 0;
      // var app  = thisObject._app;
      const basicMap_html = '<div id="poi_detail_page" class=""></div>';
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#poi_detail_page");
      thisObject._bdid = "";
      const backBtn = thisObject._dom.find(".hospital-back");
      if (backBtn.length == 0) {
        backBtn = "<div class='hospital-back' style='top:88px; left:10px'></div>";
        thisObject._dom.append(backBtn);
      }
      thisObject._backBtn = domUtils.find(thisObject._dom, ".hospital-back");
      thisObject._backBtn.on("click", function () {
        thisObject._app._stateManager.goBack();
      });

      const mapView = app._mapView;
      thisObject.bottomViewHeight = 70;
      if (app._config["bigFont"]) {
        thisObject._searchView = new daxiapp["DXSearchViewComponent5"](app, thisObject._dom);
      } else {
        thisObject._searchView = new daxiapp["DXTopSearchComponent"](app, thisObject._dom);
      }

      thisObject._searchView.init({
        onSelectItemAtIndexPath: function (sender, args) {
          if (args.method == "openMainPoiPage") {
            thisObject.openMainPoiPage(args);
          } else {
            if (args.method == "showPois") {
              if (args.arealType == "indoor") {
                const mapSDK = mapView._mapSDK;
                const bdid = mapSDK.getCurrentBDID();
                const floorId = mapSDK.getCurrentFloorId();
                if (!floorId) {
                  const bdInfo = mapView.getCurrIndoorBuilding()["bdInfo"];
                  bdid = bdInfo["bdid"];
                  floorId = bdInfo["floorId"];
                }
              }
              thisObject.showPois(args);
            } else if (args.method == "showSubWay") {
              thisObject.showSubWay(args);
            } else if (args.method == "showErrorMessage") {
              thisObject.showPois(args);
            }
          }
        },
        onSearchViewBackBtnClicked: function (sender, e) {
          if (app._params["method"] == "indexPage") {
            thisObject.openIndexPage();
            return;
          }
          thisObject._confirmComponent.show({
            title: "确定要退出地图",
            btnArray: ["取消", "确定"],
            callback: function () {
              console.log("click btn1");
            },
            callback1: function () {
              app.jsBridge["realGoBack"] && app.jsBridge["realGoBack"](null, null, { pageCount: 1 });
              // console.log('click btn1');
            },
          });
        },
        onSearchViewSearchBtnClicked: function (sender, e) {
          thisObject.openSearchPage(e);
        },
        onSearchViewMicBtnClicked: function (sender, e) {
          const curT = new Date().getTime();
          if (curT - lastOpenVoiceTime < 900) {
            return;
          }
          lastOpenVoiceTime = curT;
          if (window["cordova"]) {
            //deviceName.indexOf("ios")!=-1 || deviceName.indexOf("iphone")!=-1||
            const bdid = app._mapView._mapSDK["getCurrentBDID"]();
            if (app.nativeSDKAPI && app.nativeSDKAPI.openVoicePage) {
              app.nativeSDKAPI.openVoicePage(
                { token: app._params["token"], bdid: bdid },
                function (data) {
                  const keyword = decodeURIComponent(data["keyword"]);
                  if (keyword) {
                    const data = {;
                      method: "showPois",
                      keyword: keyword,
                      bdid: bdid,
                    };
                    thisObject.showPois(data);
                  } else {
                    console.log(data);
                  }
                },
                function (data) {
                  console.log("voice error", data);
                },
              );
            } else {
              thisObject.openSearchPage(e);
            }
            return;
          }
          const page = app._stateManager.pushState("VoiceListenerPage", {});
        },
      });
      thisObject._searchView.setSearchIconClass("voice_search");
      thisObject.browseData = {
        bdid_: app._config["browsePage"]["naviData"],
      };

      // 普通POI详情弹窗（使用 DXSpotPopupComponent 统一风格）
      thisObject._poiDetailView = new daxiapp["DXSpotPopupComponent"]();
      thisObject._poiDetailView.init(thisObject._dom, {
        visible: false,
        listener: {
          onRouteBtnClicked: function (sender, poinInfo) {
            const startPoint = {};
            const locationManager = mapView.locationManager;
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
              startPoint: startPoint,
            };
            app._stateManager.pushState("MapStateRoute", args);
          },
          onListenBtnClicked: function (sender, data) {
            // 普通POI不支持讲解，可根据需求跳转详情或不做处理
          },
          moreClick: function (sender, data) {
            thisObject.openDetail(data);
          },
          onClose: function (sender, data) {
            thisObject._app._stateManager.goBack();
          },
          onImgLoaded: function () {
            const height = thisObject._dom.find(".spot-popup-card").height();
            if (height) {
              mapView.setBottomViewHeight(height + 26);
            }
          },
        },
      });
      thisObject._dxCardWithAudioCtrl = new daxiapp["DXSpotPopupComponent"]();
      thisObject._dxCardWithAudioCtrl.init(thisObject._dom, {
        visible: false,
        listener: {
          onRouteBtnClicked: function (sender, data) {
            thisObject.openRoute(data);
          },
          onDeatilBtnClicked: function (sender, data) {
            thisObject.openDetail(data);
          },
          onAudioClicked: function () {},
          onClose: function () {
            thisObject._app._stateManager.goBack();
          },
          onImgLoaded: function () {
            const height = thisObject._dom.find(".detailInfo-component ").height();
            if (height) {
              mapView.setBottomViewHeight(height + 26);
            }
          },
          onListenBtnClicked: function (sender, data) {
            const params = thisObject._app._params;
            const userId = params["userId"],;
              token = params["token"],
              bdid = data.bdid || params["buildingId"];
            if (thisObject._app._params["scenic"] == "2") {
              // if(data["sprite"] == 1){
              const d = {;
                type: "postEventToMiniProgram",
                id: userId,
                methodToMiniProgram: "exhibitId=" + (data["id2"] || data["id"]) + `&bdid=${bdid}&token=` + token,
                roleType: "receiver",
              };
              window["locWebSocketPostMessage"] && window["locWebSocketPostMessage"](d);
              if (thisObject._app._params["scenic"] == "2") {
                wx.miniProgram.navigateTo({
                  url: "/pages/index/index?exhibitId=" + data["id2"] + `&token=${token}&bdid=` + bdid,
                });
              } else {
                wx.miniProgram.switchTab({
                  url: "/pages/index/index?exhibitId=" + data["id2"] + `&token=${token}&bdid=` + bdid,
                });
              }

              return;
            }
            thisObject.getPayStatus(function (res) {
              thisObject._app._stateManager.goBack();
              if (res.code != 0) {
                // TODO: 此处为未支付跳转到支付页面逻辑，暂时跳过，直接执行跳转至播放器界面(2025-10-30)
                const tracker = { tracker: data };
                window.parent.navigateToUni("changeTab", "/pages/media/player-2", tracker);
                return;

                wx.miniProgram.navigateTo({
                  url: "/pages/pay/pay?" + `token=${token}&bdid=` + bdid + "&fromPage=mapView",
                });
              } else {
                // 已支付未到期
                const tracker = { tracker: data };
                window.parent.navigateToUni("changeTab", "/pages/media/player-2", tracker);
                return;
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
        failedCB,
      );
    },
    onStateBeginWithParam: function (args) {
      const thisObject = this;
      this._super(args);
      if (!args) return;
      const mapView = this._app._mapView;
      mapView.setBottomViewHeight(this.bottomViewHeight);
      this.params = args["data"];
      this._poiDetailView.show();
      this.openPoiDetailPage(args["data"]["poiInfo"]);
      mapView._mapSDK["on"]("poiClick", this.onPoiClick, this);
      thisObject._searchView.updateData();
      const topViewHeight = 0;
      domUtils.find($("body"), ".map_header_wrapper4").forEach(function (item) {
        const h = $(item).height();
        if (h > 0) {
          topViewHeight = h + 8;
        }
      });
      mapView.setTopViewHeight(topViewHeight);
    },

    onHideByPushStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView.pushState(true);
      mapView._mapSDK["off"]("poiClick", this.onPoiClick, this);
      this._dxCardWithAudioCtrl.pausePlay();
    },

    onShowByPopStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView.popState();
      mapView._mapSDK["on"]("poiClick", this.onPoiClick, this);
    },

    onStateEnd: function (args) {
      this._super(args);
      var mapView = this._app._mapView;
      mapView._mapSDK["off"]("poiClick", this.onPoiClick, this);
      this.audioInfo = null;
      this._dxCardWithAudioCtrl.pausePlay();
      this._dxCardWithAudioCtrl && this._dxCardWithAudioCtrl.cancel();
      this._dxCardWithAudioCtrl.hide();
      if (this._app.exhibitsLayer) {
        for (var key in this._app.exhibitsLayer) {
          this._app.exhibitsLayer[key]["highlightMarker"]("");
        }
      }
    },

    onPoiClick: function (sender, feature) {
      setTimeout(function () {
        sender.openPoiDetailPage(feature["properties"]);
      }, 0);
    },

    // open PoiDetail
    openPoiDetailPage: function (poiInfo) {
      const thisObject = this;
      const app = thisObject._app;
      const mapView = app._mapView;

      const locationManager = mapView._locationManager;
      if (locationManager.getLocationState() == 2) {
        const mypos = locationManager.getMyPositionInfo();
        const position = mypos["position"];
        const distance = daxiapp["naviMath"].getGeodeticCircleDistance({ x: position[0], y: position[1] }, { x: poiInfo["lon"], y: poiInfo["lat"] });
        distance = daxiapp["utils"].distanceToText(distance);
        mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap["UserTrackingMode"]["None"]);
      }

      if (poiInfo["viewType"] && thisObject["show" + poiInfo["viewType"]]) {
        thisObject["show" + poiInfo["viewType"]](poiInfo, distance);
      } else {
        thisObject.DXPOIInfoCard(poiInfo, distance);
      }
      if (poiInfo.description) {
        const viewHeight = thisObject._dxCardWithAudioCtrl._dom.height();
        mapView.setBottomViewHeight(viewHeight + 20, !thisObject.topCompass);
      }
      if (poiInfo.detailed == undefined) {
        //从搜索列表中进来的没有detail
        const poiId = poiInfo.featureId || poiInfo.id;
        if (poiInfo.detailed == 1) {
          //有POI详情
          thisObject.getPoiDetailInfo(poiInfo["id"] || poiInfo["featureId"], function (data) {
            thisObject.DXPOIInfoCard(poiInfo, distance, data);
          });
        }
      } else if (poiInfo.detailed == 1) {
        //点击POI进来的，有POI详情
        thisObject.getPoiDetailInfo(poiInfo["id"] || poiInfo["featureId"], function (data) {
          thisObject.DXPOIInfoCard(poiInfo, distance, data);
        });
      }
    },

    DXPOIInfoCard: function (poiInfo, distance, detailData) {
      const thisObject = this;
      thisObject.audioInfo = null;
      const app = this._app;
      const config = app._config;
      const mapView = app._mapView;
      const app = thisObject._app;
      const mapView = app._mapView;
      const bdid = poiInfo["bdid"] || thisObject._app._mapView._mapSDK["getCurrentBDID"]() || "";
      const arealType = "outdoor";
      if (bdid) {
        arealType = "indoor";
      }
      const type = poiInfo["type"];
      const poiInfo = poiInfo["data"] || poiInfo;
      if (type == "Exhibition" && !poiInfo["detailUrl"]) {
        poiInfo["detailUrl"] = "/pages/guide/index";
      }
      !poiInfo["type"] ? (poiInfo["type"] = type) : "";
      const floorId = poiInfo["floorId"];
      const floorName = "",;
        floorCnName = "";

      if (floorId && mapView.currBuilding) {
        const floorInfo = mapView.currBuilding["getFloorInfo"](floorId);
        floorName = floorInfo["flname"];
        floorCnName = floorInfo["flcnname"];
      }

      // poiDetail
      poiInfo["bdid"] = poiInfo["bdid"] || bdid;
      poiInfo["floorName"] = poiInfo["floorName"] || floorName;
      poiInfo["address"] = poiInfo["address"] || floorCnName || floorName;
      poiInfo["description"] = poiInfo["description"] || (distance ? "距离" + distance : "");
      poiInfo["icon"] = poiInfo["icon"] || (!poiInfo["imageUrl"] ? "icon-mypos" : poiInfo["icon"]);
      poiInfo["hasRouteBtn"] = true;
      poiInfo["iconClose"] = true;
      poiInfo["showLineBtn"] = true; // DXSpotPopupComponent 需要此字段显示路线按钮

      const zoom = config["poiDetailPage"] && config["poiDetailPage"]["minZoom"];

      const markerInfo = daxiapp.utils.copyData(poiInfo);
      delete markerInfo["imageUrl"];
      this.showMarker(markerInfo);
      this._poiDetailView.updateData(poiInfo, detailData);
      this._poiDetailView.show();
      setTimeout(function () {
        const bottomHeight = thisObject._poiDetailView.getHeight();
        console.log(thisObject);
        if (poiInfo["imageUrl"] && bottomHeight < 68) {
          bottomHeight += 14;
        }
        bottomHeight ? thisObject._app._mapView.setBottomViewHeight(bottomHeight, false) : "";
        app._mapView._mapSDK["easeTo"]({
          lon: poiInfo["lon"],
          lat: poiInfo["lat"],
          bdid: poiInfo["bdid"],
          floorId: poiInfo["floorId"],
          duration: 1000,
        });
      }, 0);

      this._searchView.updateInputText("");
      const topHeight = this._searchView.getHeight();
      thisObject._app._mapView.setTopViewHeight(topHeight + 8, false);
      if (this._dxCardWithAudioCtrl) {
        for (var key in this._app.exhibitsLayer) {
          this._app.exhibitsLayer[key]["highlightMarker"]("");
        }
        this._dxCardWithAudioCtrl.hide();
        this._dxCardWithAudioCtrl.pausePlay();
      }
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
    openDetail: function (data) {
      this._dxCardWithAudioCtrl && this._dxCardWithAudioCtrl.pausePlay();
      this._app._stateManager.pushState("PoiDetailPage", data);
    },

    showMarker: function (poiInfo) {
      //return
      const thisObject = this;
      thisObject.clearAllRenderObject();
      const markerOption = {;
        featureId: poiInfo["featureId"],
        lon: poiInfo["lon"],
        lat: poiInfo["lat"],
        bdid: poiInfo["bdid"],
        floorId: poiInfo["floorId"],
        markerIcon: poiInfo["markerIcon"] || poiInfo["imageUrl"],
        name: poiInfo["name"],
        text: poiInfo["name"],
        "text-anchor": "top",
        highlight: true,
      };
      // 处理精灵图模式
      if (poiInfo["sprite"] == 1 || (poiInfo["type"] == "Exhibit" && !markerOption["markerIcon"])) {
        // 使用精灵图，设置 imgKey 和 highlightImgKey
        const spriteKey = poiInfo["imgKey"] || poiInfo["markerIcon"] || "museum_" + (poiInfo["exhibitId"] || poiInfo["id"]);
        markerOption["markerIcon"] = spriteKey;
        markerOption["activeMarkerIcon"] = spriteKey;
        markerOption["imgKey"] = spriteKey;
        markerOption["highlightImgKey"] = spriteKey;
      }
      markerOption["activeMarkerIcon"] = poiInfo["activeMarkerIcon"] || poiInfo["highlightImageUrl"];
      // var markerOption = daxiapp.utils.copyData(poiInfo);
      markerOption["scale"] = !poiInfo["markerIcon"] ? 1 : 0.5;
      if (!markerOption["imageUrl"] && !markerOption["markerIcon"]) {
        markerOption["markerIcon"] = "red_dot";
        markerOption["scale"] = 0.5;
      }
      // markerOption["highlightScale"] = markerOption["scale"];
      markerOption["highlight"] = true;

      if (poiInfo["width"]) {
        markerOption["highlightWidth"] = markerOption["width"] = poiInfo["width"];
        markerOption["highlightHeight"] = markerOption["height"] = poiInfo["height"] || markerOption["width"];
      }
      const mapSDK = thisObject._app._mapView._mapSDK;
      const marker = new daximap["DXSceneMarker"]();
      marker["initialize"](mapSDK, markerOption);
      marker.id = daxiapp["utils"].createUUID();
      marker["addToMap"]();
      thisObject._renderObjects.push(marker);
    },
    showDXAudioInfoCard: function (poiInfo) {
      const thisObject = this;
      if (thisObject?.audioInfo?.id == poiInfo?.id && thisObject?.audioInfo?.id2 == poiInfo?.id2) {
        return;
      }
      thisObject.audioInfo = poiInfo;
      const type = poiInfo["type"];
      const data = poiInfo["data"] || poiInfo;
      data["type"] = data["type"] || type;
      data["detailUrl"] = data["detailUrl"] || "";
      thisObject._dxCardWithAudioCtrl?.cancel();
      thisObject.clearAllRenderObject();
      const app = thisObject._app;
      const poiDetailPageConfig = app._config?.["poiDetailPage"];
      const zoom = poiDetailPageConfig?.["exhibitZoom"];
      const maxZoom = poiDetailPageConfig?.["maxZoom"];
      const currZoom = app._mapView._mapSDK.getZoom();
      if (maxZoom && maxZoom < currZoom) {
        currZoom = maxZoom;
      }
      if (zoom && currZoom < zoom) {
        currZoom = zoom;
      }

      const id = data["id"] || data["exhibitId"] || data["exhibit_id"];
      const introImage = data["introImage"] == "null" ? "" : data["introImage"];
      data["audioUrl"] = data["audioUrl"] || "";
      const info = {;
        id: id,
        id2: data["id2"],
        name: data["name"] || data["exhibit_name"],
        exhibition_name: data["exhibitionName"] || data["name"],
        markerIcon: data["sprite"] == 1 ? data["markerIcon"] : daxiapp.utils.addScenicUrl(data["markerIcon"]),
        activeMarkerIcon: data["sprite"] == 1 ? data["activeMarkerIcon"] : daxiapp.utils.addScenicUrl(data["activeMarkerIcon"]),
        imgKey: data["sprite"] == 1 ? data["markerIcon"] : undefined,
        highlightImgKey: data["sprite"] == 1 ? data["activeMarkerIcon"] : undefined,
        imageUrl: daxiapp.utils.addScenicUrl(data["imageUrl"]),
        thumbnail: daxiapp.utils.addScenicUrl(data["thumbnail"]),
        audioUrl: daxiapp.utils.addScenicUrl(data["audioUrl"]),
        description: data["description"] || data["content"],
        address: data["address"] || data["place"],
        lon: data["lon"],
        lat: data["lat"],
        floorId: data["floorId"],
        bdid: poiInfo["bdid"],
        width: 64,
        height: 64,
        detailUrl: data["detailUrl"] || "/pages/exhibit/detail/index",
        iconClose: true,
        showLineBtn: true,
        type: data["type"] || "Exhibit",
        infoUrl: data["infoUrl"],
        detailText: "详情",
        exhibitId: poiInfo["exhibitId"],
        sprite: data["sprite"],
        introImage: daxiapp.utils.addScenicUrl(introImage),
      };

      delete app._params.comefrom;
      thisObject.audioInfo = info;
      thisObject._dxCardWithAudioCtrl.updateData(info);
      setTimeout(function () {
        thisObject._dxCardWithAudioCtrl.show();
        const height = thisObject._dxCardWithAudioCtrl.getHeight();
        thisObject._app._mapView.setBottomViewHeight(height + (thisObject._app._config?.["bottom"] ?? 0), false);
        app._mapView._mapSDK["easeTo"]({
          lon: data["lon"],
          lat: data["lat"],
          zoom: currZoom,
          bdid: data["bdid"],
          floorId: data["floorId"],
          duration: 1000,
        });
      }, 0);
      thisObject._dxCardWithAudioCtrl.show();
      thisObject._poiDetailView.hide();
      this.showMarker(info);
    },

    getParams: function () {
      const thisObject = this;
      const token = this._app._params["token"];
      const mapView = this._app._mapView;
      const mapSDK = mapView._mapSDK;
      const floorId = mapSDK["getCurrentFloorId"]() || "";
      const pos = mapSDK["getPosition"]();
      const lon = pos["lon"],;
        lat = pos["lat"];
      const bdInfo = mapView.getCurrIndoorBuilding()["bdInfo"];
      const bdid = bdInfo["bdid"];
      floorId = floorId || bdInfo["groundFloorId"];
      if (mapSDK["getCurrentBDID"]() != bdid) {
        lon = bdInfo["center"][0];
        lat = bdInfo["center"][1];
      }
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
    // 打开SearchPage
    openSearchPage: function (e) {
      const thisObject = this;
      // 当前地图点位
      const params = thisObject.getParams();
      params["keyword"] = e["keyword"];
      const command = { method: "openSearchPage", data: params };
      const page = thisObject._app._stateManager.pushState("MapStateSearchPage", command);
      page._once("searchPageCallback", function (sender, searchResult) {
        if (searchResult.retVal == "OK") {
          thisObject.showPois(searchResult["data"]);
        }
      });
    },
    showPois: function (args) {
      const params = this.getParams();
      if (params["bdid"]) {
        const arealType = "indoor";
        args["arealType"] = arealType;
        args["type"] == undefined ? (args["type"] = 1) : "";
      } else {
        const arealType = "outdoor";
        args["arealType"] = arealType;
        args["type"] == undefined ? (args["type"] = 11) : "";
      }
      for (var key in params) {
        if (!args[key]) {
          args[key] = params[key];
        }
      }
      args["keyword"] ? (args["keyword"] = decodeURIComponent(args["keyword"])) : "";
      // this._app._stateManager.pushState("MapStatePoi", args);
      this._app.pageCommand.openPoiState(args);
    },
    openMainPoiPage: function (args) {
      const thisObject = this;
      const params = thisObject.getParams();

      const command = { data: params, method: "openMainPoiPage" };
      if (thisObject.buildingInfo) {
        command["data"]["cnname"] = thisObject.buildingInfo.cn_name;
      }
      const page = thisObject._app._stateManager.pushState("MapStateMainPoiPage", command);
      page._once("selectPoiCallback", function (sender, selectPoiResult) {
        if (selectPoiResult.retVal == "OK") {
          thisObject.showPois(selectPoiResult["data"]);
        }
      });
    },
    getPoiDetailInfo: function (poiId, callback) {
      const thisObject = this;
      const command = this._app._params;
      const token = command["token"];
      const bdid = this._app._mapView._mapSDK.getCurrentBDID() || command["bdid"];
      const url = `https://map1a.daxicn.com/server39/daxi-manager/api/map/getDetail?token=${token}&bdid=` + bdid + `&ftId=${poiId}&t=` + Date.now();
      thisObject._app.downloader.getServiceData(
        url,
        "get",
        "json",
        {},
        function (data) {
          if (data.code == 200 && data.result) {
            callback && callback(data.result);
          } else {
            domUtils.showInfo("获取POI详情失败");
          }
        },
        function (error) {
          domUtils.showInfo("获取POI详情失败");
        },
      );
    },
  });

  daxiapp["MapStatePoiDetail"] = MapStatePoiDetail;
})(window);
