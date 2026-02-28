(function (global) {
  "use strict";
  const daxiapp = global["DaxiApp"] || {};
  const daximap = window["DaxiMap"] || {};
  const DXMapUtils = daxiapp["utils"];

  const DxDomUtil = daxiapp["domUtil"];

  const domUtils = daxiapp["dom"];
  const MapStateClass = daxiapp["MapStateClass"];
  const MapStateSharePos = MapStateClass.extend({;
    __init__: function () {
      this._super();
      this._rtti = "MapStateSharePos";
      this._markers = {};
      this.state = "searchByAround";
      this._searchAroundMarkerLayer = null;
      this._selectedMarker = null;
      // this._selectedMarkerLayer = null;
      this.sendData = null;
      this.isFirstVisited = true;
    },
    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      this._app = app;
      const mapView = app._mapView;
      const mapSDK = mapView._mapSDK;
      thisObject.pageName = "sharepos_page";
      const basicMap_html =;
        '<div id="' +
        thisObject.pageName +
        '" class="sharepos_page" style="font-size:1.2rem">' +
        '<div class="header" style="point-events:none;position: absolute;top: 0px;padding: 14px;background-image: linear-gradient(#22222254, #5b585838, #b3acac05);width: 100%;box-sizing: border-box;color:#fff;">' +
        '<div class="hospital-back cancel" style="left:10px"></div>' + //<span class="goback cancel" style="pointer-events: auto; float: left;display: inline-block;padding: 4px;font-size: 1.3rem;">取消</span>'
        '<span class="send_sharepos" style="pointer-events: auto;">发送</span></div>' +
        '<div class="sharePage_container search_around_state" style="position:absolute;bottom:0px;width:100%;height:260px;background: #fff;display: flex;flex-direction: column;">' +
        '<div class="search_header_conponent" style="padding: 12px 12px 2px 12px;"><span class="expend"></span><div class="search" style="display: flex;line-height:2;"><p class="search_header_container" style="display: flex;flex-grow: 1;text-align: center;background: #e7e7e7;line-height: 2;border-radius: 6px;margin: 0px 4px;"><span class="icon-search2 sharepos_search" style="line-height:2;padding: 0px 10px;"></span><input class="sharepos_page_input" placeholder="搜索地点" style="line-height: 2;flex-grow: 1;font-size: 1.2rem;"/></p><span class="cancel_search">取消</span></div></div>' +
        '<div class="result_container"></div>' +
        '<div class="result_container2"></div>' +
        "</div></div>";
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#" + thisObject.pageName);
      thisObject._bdid = "";
      thisObject._sharePageContainer = domUtils.find(thisObject._dom, ".sharePage_container");
      thisObject._resultContainer = domUtils.find(thisObject._dom, ".result_container");
      thisObject._poiAroundResultView = new daxiapp["DXListBase"](thisObject._resultContainer);
      const renderTml =;
        "{{#eq list.length 0}}" +
        '<div class="empty-state">{{#if errMsg}}{{errMsg}}{{else}}没有搜到相关结果{{/if}}</div>' +
        "{{/eq}}" +
        "{{#gt list.length 0}}" +
        '<div class="list-view" style="padding: 0px 16px;">' +
        '<div class="list-items" >' +
        "{{#each list}}" +
        '<div class="list-item" style="display: flex;padding: 6px 6px;border-bottom: 1px solid #cccccc52;" data-id="{{id}}" {{#if name}} data-name="{{name}}"{{/if}} {{#if text}} data-text="{{text}}"{{/if}} data-poiid="{{poiId}}" data-lon={{lon}} data-lat={{lat}} data-bdid="{{bdid}}" data-floorid="{{floorId}}" data-floorname="{{floorName}}" data-address="{{address}}" >' +
        '<div class="item-info" style="flex-grow:1;">' +
        '<p class="info-main">{{#if name}}{{name}}{{else}}{{text}}{{/if}}</p>' +
        '<p class="extend" style="font-size: 1rem;line-height: 2;">{{#if distanceDes}}<span class="distance">{{distanceDes}}</span>{{/if}}{{#if floorName}}<span class="floor">{{floorName}}</span>{{/if}}{{#if address}}<span class="address">{{address}}</span>{{/if}} </p>' +
        "</div>" +
        "</div>" +
        "{{/each}}" +
        "</div></div>" +
        "{{/gt}}";
      thisObject._poiAroundResultView.init(
        {
          onItemClicked: function (sender, e) {
            thisObject.sendData = e;
            thisObject.setUserTrackingModeToNone();
            if (e["bdid"] && e["floorid"]) {
              mapSDK.changeFloor(e["bdid"], e["floorid"]);
            }
            thisObject._searchAroundMarkerLayer.highlightMarker(e["poiid"]);
            // DXHighlightMarkerVisitor(mapSDK.getRootScene(), e["poiid"]).visit().highlightMarker;
            mapSDK.moveTo({ lon: e["lon"], lat: e["lat"], duration: 100 });
            thisObject.enableSendBtn(true);
          },
        },
        "",
        renderTml,
        "",
        "list",
        ".list-item"
      );
      thisObject._resultContainer2 = domUtils.find(thisObject._dom, ".result_container2");
      thisObject._poiKeywordResultView = new daxiapp["DXListBase"](thisObject._resultContainer2);
      thisObject._poiKeywordResultView.init(
        {
          onItemClicked: function (sender, e) {
            thisObject.sendData = e;
            thisObject.setUserTrackingModeToNone();
            if (e["bdid"] && e["floorid"]) {
              mapSDK.changeFloor(e["bdid"], e["floorid"]);
            }
            mapSDK.moveTo({ lon: e["lon"], lat: e["lat"], duration: 100 });
            thisObject._selectedMarker && thisObject._selectedMarker.setVisible(true, true);
            thisObject._selectedMarker && thisObject._selectedMarker.setPosition("selectPoint", e.bdid || "", e.floorid || "", e["lon"], e["lat"], 0);

            thisObject._searchAroundMarkerLayer.highlightMarker(e["poiid"]);
            thisObject.enableSendBtn(true);
          },
        },
        "",
        renderTml,
        "",
        "list",
        ".list-item"
      );
      thisObject._poiKeywordResultView.hide();
      thisObject.sendBtn = domUtils.find(thisObject._dom, ".send_sharepos");
      domUtils.on(thisObject._dom, "click", ".send_sharepos", function (event) {
        if (!thisObject.enableSend) {
          return;
        }
        thisObject.sharePos();
      });
      domUtils.on(thisObject._dom, "click", ".cancel", function (event) {
        thisObject.cancel();
      });
      thisObject.searchInput = domUtils.find(thisObject._dom, ".sharepos_page_input");
      thisObject.searchCancelBtn = domUtils.find(thisObject._dom, ".cancel_search");
      domUtils.on(thisObject._dom, "click", ".cancel_search", function () {
        thisObject.setState("searchByAround");
      });
      thisObject.searchInput["on"]("click", function () {
        thisObject.setState("searchByKeyWord");
      });
      thisObject.searchInput["on"]("input", function (e) {
        thisObject.setState("searchByKeyWord");
        const text = e.target.value.trim(" ");
        if (text) {
          thisObject.showPoisByKeyword({ keyword: text });
        }
      });
      thisObject.searchInput["on"]("keyup", function (event) {
        event.stopPropagation();
        const keyword = this.value.replace(/ /g, "");
        keyword.trim();
        if (event.keyCode == 13 && keyword) {
          thisObject.setState("searchByAround");
          thisObject.showPoisByMapCenter({ keyword: keyword });
          this.blur();
        }
      });
      thisObject._markerComponent = new daxiapp["DXImageComponent"](app, thisObject._dom);
      thisObject._markerComponent.init({});
      thisObject._markerComponent.setWrapperStyle(
        {
          position: "absolute",
          // "top": "0px",
          top: "58px",
          bottom: "260px",
          width: "100vw",
          "pointer-events": "none",
        },
        { "margin-top": "-60px" }
      );
      thisObject._markerComponent.updateData("./images/xuanzeqipao.png");
      //animate("markertip_animation");
      // thisObject._markerComponent.hide();
      mapSDK.on("onMapDragEnd", function () {
        if (!thisObject.visible) {
          return;
        }
        if (thisObject.state == "searchByAround") {
          thisObject._markerComponent.animate("markertip_animation");
          thisObject.showPoisByMapCenter({});
        }
      });
      this.show(false);
    },
    setUserTrackingModeToNone: function () {
      const mapView = this._app._mapView;
      const locationManager = mapView._locationManager;
      const locState = locationManager.getLocationState();
      if (locState == DaxiMap["LocationState"]["LOCATED"]) {
        mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap["UserTrackingMode"]["None"]);
      } else {
        mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap["UserTrackingMode"]["Unknown"]);
      }
    },

    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) return;
      const thisObject = this;
      this.sendData = null;
      const mapView = this._app._mapView;
      mapView._dom.height(mapView._dom.height() - 260);
      mapView._mapSDK.resize();
      if (this.isFirstVisited) {
        this.isFirstVisited = false;
        mapView._mapSDK.on("changeFloor", function () {
          if (thisObject.visible && thisObject.state == "searchByKeyWord") {
            thisObject._selectedMarker && thisObject._selectedMarker.checkFloor();
          }
        });
      }
      mapView.setBottomViewHeight(0);
      this.params = DXMapUtils.copyData(args);
      const markers = [;
        {
          featureId: "selectPoint",
          id: "selectPoint",
          bdid: "",
          lon: 0,
          lat: 0,
          floorId: "",
          imageUrl: "./images/xuanzeqipao.png",
          highlightImageUrl: "./images/xuanzeqipao.png",
          anchor: "bottom",
          // "anchor":"top",
          scale: 0.2,
        },
      ];
      const markerLayer = (this._selectedMarker = new daximap.DXSceneMarkerLayer());
      markerLayer.initialize(mapView._mapSDK, { markers: markers, bdid: "", onClick: function () {} });
      markerLayer.id = "marker" + DXMapUtils.createUUID();
      markerLayer.addToMap();
      markerLayer.setVisible(false);
      this._renderObjects.push(this._selectedMarker);
      try {
        this.showPoisByMapCenter(DXMapUtils.copyData(args));
      } catch (e) {
        console.log(e.toString());
      }
    },

    onHideByPushStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView.pushState(true);
    },

    onShowByPopStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView.popState();
    },

    onStateEnd: function (args) {
      this._super(args);
      var mapView = this._app._mapView;
      // 后退移除了本状态页面的附加layer
      this._selectedMarker = null;
      this._searchAroundMarkerLayer = null;
      mapView._dom.height(mapView._dom.height() + 260);
      mapView._mapSDK.resize();
      const _search = mapView._search;
      _search["cancel"]();
    },
    sharePos: function () {
      //var data = {"method":"showPoiDetail"};
      const data = { viewState: "showPoiDetail" };
      const sendData = this.sendData;
      for (var key in sendData) {
        if (key == "bdid") {
          data["buildingId"] = sendData["bdid"];
        } else if (key == "floorid") {
          data["floorId"] = sendData["floorid"];
        } else if (key == "poiid") {
          data["poiId"] = sendData["poiid"];
        } else if (key == "floorname") {
          data["floorName"] = sendData["floorname"];
        } else {
          data[key] = sendData[key];
        }
      }
      const userInfo = this._app._params["userInfo"];
      data["address"] = data["address"] || data["text"];
      if (userInfo["userName"]) {
        data["title"] = userInfo["userName"];
      }
      const locationManager = this._app._mapView._locationManager;
      console.log("分享的数据为：", data);
      window.parent.navigateToUni("navigateTo", "/pages/share/share", { shareData: data });
      return;
      locationManager.shareToFriend(
        data,
        function () {},
        function () {},
        window["rawParams"]
      );
    },
    // Run Command
    runCommond: function (command) {},

    startQuery: function (data, callback) {
      const _search = this._app._mapView._search;
      const searchUrl = thisObject._app._config["searchUrl"];
      if (searchUrl) {
        data["params"]["url"] = searchUrl;
      }
      const count = thisObject._app._config["searchCount"];
      count && (data["params"]["count"] = count);
      _search["query"](
        data["params"],
        function (data) {
          //data["onSuccess"]&&data["onSuccess"](data);
        },
        function (data) {
          //data["onFailed"]&&data["onFailed"](data);
        }
      );
    },

    showMarkers: function (data) {
      // aroundMarker
      const thisObject = this;
      const mapSDK = thisObject._app._mapView._mapSDK;
      if (!thisObject.visible) {
        return;
      }
      const onMarkerClick = function (marker) {;
        // console.log(marker);
        const id = marker["featureId"];
        thisObject._poiAroundResultView.triggerActiveByKey("poiid", id);
      };
      const markers = [];
      const bdid = "";
      for (var poiIndex in data) {
        const poiInfo = data[poiIndex];
        bdid = poiInfo["bdid"] || "";
        poiInfo["poiId"] = poiInfo["poiId"] || poiInfo["poiid"];
        const markerOption = {;
          featureId: poiInfo["poiId"],
          id: poiInfo["poiId"],
          bdid: poiInfo["bdid"],
          lon: poiInfo["lon"],
          lat: poiInfo["lat"],
          floorId: poiInfo["floorId"],
          imageUrl: "./images/green_point.png",
          highlightImageUrl: "./images/pink_point.png",
          anchor: "center",
          scale: 0.4,
          onClick: onMarkerClick,
        };
        markers.push(markerOption);
      }
      if (thisObject._searchAroundMarkerLayer) {
        thisObject._searchAroundMarkerLayer.setVisible(true);
        thisObject._searchAroundMarkerLayer.setData(markers);
      } else {
        const markerLayer = new daximap.DXSceneMarkerLayer();
        markerLayer.initialize(mapSDK, { markers: markers, bdid: bdid, "icon-allow-overlap": true, priority: 3, onClick: onMarkerClick });
        markerLayer.id = "marker" + DXMapUtils.createUUID();
        markerLayer.addToMap();
        thisObject._searchAroundMarkerLayer = markerLayer;
        thisObject._renderObjects.push(markerLayer);
      }
    },
    cancel: function () {
      // 取消
      this.setState("searchByAround");
      this._poiKeywordResultView.clearData();
      this._app._stateManager.goBack();
    },
    setState: function (state) {
      state = state || "searchByAround";
      state == "searchByAround" ? this._markerComponent.show() : this._markerComponent.hide();
      if (state == this.state) {
        return;
      }
      if (state == "searchByAround") {
        this._sharePageContainer.addClass("search_around_state").removeClass("search_keyword_state");
        this._searchAroundMarkerLayer && this._searchAroundMarkerLayer.setVisible(true, true);
        this._selectedMarker && this._selectedMarker.setVisible(false, true);
        this.searchInput.val("");
        this._poiKeywordResultView.clearData();
        //状态切换 按钮置灰
        this.enableSendBtn(false);
        this._poiAroundResultView.triggerActiveBySelector(".active");
      } else {
        this._sharePageContainer.addClass("search_keyword_state").removeClass("search_around_state");
        this._searchAroundMarkerLayer && this._searchAroundMarkerLayer.setVisible(false, true);
        //状态切换 按钮置灰
        this.enableSendBtn(false);
      }
      this.state = state;
    },
    // 显示Pois
    showPoisByMapCenter: function (params) {
      const thisObject = this;
      thisObject.enableSendBtn(false);
      const mapView = this._app._mapView;
      thisObject._searchAroundMarkerLayer && thisObject._searchAroundMarkerLayer.setVisible(false, true);
      params["token"] = this._app._params["token"] || this._app._config["token"];
      this._selectedMarker && this._selectedMarker.setVisible(false, true);
      if (params["method"] == "showErrorMessage") {
        this._poiAroundResultView.showErrorText({ tip: params["keyword"] });
        return;
      }
      if (params["results"]) {
        thisObject._poiAroundResultView.rerender(params["results"]);
        thisObject._poiAroundResultView.triggerSelectedItemByIndex(0);
        return;
      }
      if (!params["keyword"] && !params["radius"]) {
        params["radius"] = 4000;
      }
      this._poiAroundResultView.showLoading();
      const position = params["position"];
      if (position) {
        params["lon"] = position[0];
        params["lat"] = position[1];
      }
      const mapView = this._app._mapView;
      const _search = mapView._search;
      const searchUrl = thisObject._app._config["search"]["url"];
      if (searchUrl) {
        params["url"] = searchUrl;
      }
      //按照地图当前位置搜索
      if (!params["lon"]) {
        // var locationManager = mapView._locationManager;
        // var posInfo = locationManager.getMyPositionInfo();
        // if(params["keyword"] && posInfo["position"] && posInfo["position"][0]){
        //     params["lon"] = posInfo["position"][0];
        //     params["lat"] = posInfo["position"][1];
        //     params["bdid"] = posInfo.bdid||'';
        //     params["floorId"] = posInfo.floorId||'';
        // }else{
        const pos = mapView._mapSDK.getPosition();
        params["lon"] = pos["lon"];
        params["lat"] = pos["lat"];
        const currBuilding = mapView.currBuilding;
        if (currBuilding) {
          params["bdid"] = currBuilding.bdid;
          params["floorId"] = currBuilding.getCurrentFloorId();
        }

        // }
      }
      const locationManager = mapView._locationManager;
      const posInfo = locationManager.getMyPositionInfo();
      const locPosition = posInfo["position"];
      const disNeedReCompute = false;
      if ((locPosition[0] && Math.abs(locPosition[0] - params["lon"]) > 0.00001) || Math.abs(locPosition[1] - params["lat"]) > 0.00001) {
        disNeedReCompute = true;
      }

      const mapStateManager = thisObject._app._stateManager;
      const count = thisObject._app._config["searchCount"] || 60;
      count && (params["count"] = count);
      _search["query"](
        params,
        function (data) {
          if (!thisObject.visible) {
            return;
          }
          if (thisObject.state != "searchByAround") {
            return;
          }
          if (mapStateManager._curPage == thisObject) {
            thisObject.setUserTrackingModeToNone();
            if (params && !params["lon"] && !params["lon"]) {
              data.forEach(function (item) {
                delete item["distance"];
              });
            }

            if (!params["keyword"]) {
              //地图选点位置
              const selcPosInfo = {;
                poiId: DXMapUtils.createUUID(),
                bdid: params["bdid"],
                floorId: params["floorId"],
                lat: params["lat"],
                lon: params["lon"],
                text: "地图选点位置",
                address: "", //地图中心点
              };
              data.unshift(selcPosInfo);
              //定位点位置

              //地图选点位置
              const position = posInfo["position"];
              if (position[0]) {
                const myPosInfo = {;
                  poiId: DXMapUtils.createUUID(),
                  bdid: posInfo["bdid"],
                  floorId: posInfo["floorId"],
                  lon: position[0],
                  lat: position[1],
                  text: "我的位置",
                  address: "", //地图中心点
                };
                data.unshift(myPosInfo);
              }
            } else if (disNeedReCompute && locPosition[0]) {
              if (disNeedReCompute && locPosition[0]) {
                data.forEach(function (item) {
                  delete item["distance"];
                  const dis = ~~daxiapp["naviMath"].getGeodeticCircleDistance({ x: item["lon"], y: item["lat"] }, { x: locPosition[0], y: locPosition[1] });
                  item["distance"] = dis > 1000 ? (dis * 0.001).toFixed(1) + "公里" : dis + "米";
                });
              }
            }

            thisObject._poiAroundResultView.rerender({ list: data });
            thisObject.showMarkers(data);
            if (myPosInfo) {
              thisObject._poiAroundResultView.triggerSelectedItemByIndex(1);
            } else {
              thisObject._poiAroundResultView.triggerSelectedItemByIndex(0);
            }
          }
        },
        function (data) {
          if (mapStateManager._curPage == thisObject) {
            thisObject._poiAroundResultView.rerender({ errMsg: data.errMsg || "请求失败" });
          }
        }
      );
      // this._app._mapStateManager.pushMapState("MapStateSharePos", command);
    },

    showPoisByKeyword: function (params) {
      const thisObject = this;
      const mapView = this._app._mapView;
      thisObject.enableSendBtn(false);
      thisObject._markerComponent.hide();
      thisObject._selectedMarker.setVisible(false, true);
      this._poiKeywordResultView.showLoading();
      const position = params["position"];
      if (position) {
        params["lon"] = position[0];
        params["lat"] = position[1];
      }
      const mapView = this._app._mapView;
      const _search = mapView._search;
      const searchUrl = thisObject._app._config["searchUrl"];
      if (searchUrl) {
        params["url"] = searchUrl;
      }
      params["token"] = thisObject._app._params["token"] || thisObject._app._config["token"];
      //按照地图当前位置搜索
      if (!params["lon"]) {
        const pos = mapView._mapSDK.getPosition();
        params["lon"] = pos["lon"];
        params["lat"] = pos["lat"];
        const currBuilding = mapView.currBuilding;
        if (currBuilding) {
          params["bdid"] = currBuilding.bdid;
          params["floorId"] = currBuilding.getCurrentFloorId();
        }
      }
      const locationManager = mapView._locationManager;
      const posInfo = locationManager.getMyPositionInfo();
      const locPosition = posInfo["position"];
      const disNeedReCompute = false;
      if ((locPosition[0] && Math.abs(locPosition[0] - params["lon"]) > 0.00001) || Math.abs(locPosition[1] - params["lat"]) > 0.00001) {
        disNeedReCompute = true;
      }
      const mapStateManager = thisObject._app._stateManager;
      const count = thisObject._app._config["searchCount"] || 60;
      count && (params["count"] = count);
      _search["query"](
        params,
        function (data) {
          if (!thisObject.visible) {
            return;
          }
          if (thisObject.state == "searchByAround") {
            return;
          }
          if (mapStateManager._curPage == thisObject) {
            thisObject.setUserTrackingModeToNone();
            if (params) {
              data.forEach(function (item) {
                if (disNeedReCompute && locPosition[0]) {
                  delete item["distance"];
                  const dis = ~~daxiapp["naviMath"].getGeodeticCircleDistance({ x: item["lon"], y: item["lat"] }, { x: locPosition[0], y: locPosition[1] });
                  item["distance"] = dis > 1000 ? (dis * 0.001).toFixed(1) + "公里" : dis + "米";
                }
              });
              thisObject.showMarkers(data);
            }

            thisObject._poiKeywordResultView.rerender({ list: data });
            thisObject._poiKeywordResultView.triggerSelectedItemByIndex(0);
          }
        },
        function (data) {
          if (mapStateManager._curPage == thisObject) {
            thisObject._poiKeywordResultView.rerender({ errMsg: data.errMsg || "请求失败" });
          }
        }
      );
    },
    enableSendBtn: function (value) {
      if (value == true) {
        this.sendBtn.removeClass("disabled");
      } else {
        this.sendBtn.addClass("disabled");
      }
      this.enableSend = value;
    },
  });

  daxiapp["MapStateSharePos"] = MapStateSharePos;
})(window);
