(function (global) {
  "use strict";
  var daxiapp = global["DaxiApp"] || {};
  var daximap = window["DaxiMap"] || {};

  var dxUtils = daxiapp["utils"];
  var domUtils = daxiapp["dom"];

  var MapStateClass = daxiapp["MapStateClass"];
  var MapStatePoi = MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "MapStatePoi";
      this._markers = {};
      this._markerLayers = [];
    },

    initialize: function (app, container) {
      this._super(app, container);
      var thisObject = this;
      var lastOpenVoiceTime = 0;
      thisObject.pageName = "search_result_page";
      var basicMap_html = '<div id="' + thisObject.pageName + '" class="search_result_page"></div>';
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#" + thisObject.pageName);
      var backBtn = thisObject._dom.find(".hospital-back");
      if (backBtn.length == 0) {
        backBtn = "<div class='hospital-back' style='top:106px; left:10px'></div>";
        thisObject._dom.append(backBtn);
      }
      thisObject._backBtn = domUtils.find(thisObject._dom, ".hospital-back");
      thisObject._backBtn.on("click", function () {
        thisObject._app._stateManager.goBack();
      });

      thisObject._bdid = "";
      thisObject.searchConf = thisObject._app._config["search"];
      if (thisObject._app._config["bigFont"]) {
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
                var mapView = thisObject._app._mapView;
                var mapSDK = mapView._mapSDK;
                var bdid = mapSDK.getCurrentBDID();
                var floorId = mapSDK.getCurrentFloorId();
                if (!floorId) {
                  var bdInfo = mapView.getCurrIndoorBuilding()["bdInfo"];
                  bdid = bdInfo["bdid"];
                  floorId = bdInfo["groundFloorId"];
                  args["position"] = bdInfo["center"];
                } else {
                  var pos = mapSDK.getPosition();
                  args["position"] = [pos["lon"], pos["lat"]];
                }
                args["bdid"] = bdid;
                args["floorId"] = floorId;
                var myPositionInfo = mapView._locationManager.getMyPositionInfo();
                if (myPositionInfo["position"][0] && myPositionInfo["bdid"] == bdid) {
                  args["position"] = myPositionInfo["position"];
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
            },
          });
        },
        onSearchViewSearchBtnClicked: function (sender, e) {
          thisObject.openSearchPage(e);
        },
        onSearchViewMicBtnClicked: function (sender, e) {
          var curT = new Date().getTime();
          if (curT - lastOpenVoiceTime < 900) {
            return;
          }
          lastOpenVoiceTime = curT;
          if (window["cordova"]) {
            var bdid = app._mapView._mapSDK["getCurrentBDID"]();
            if (app.nativeSDKAPI && app.nativeSDKAPI.openVoicePage) {
              app.nativeSDKAPI.openVoicePage(
                { token: app._params["token"], bdid: bdid },
                function (data) {
                  var keyword = decodeURIComponent(data["keyword"]);
                  if (keyword) {
                    var data = {
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
          var page = app._stateManager.pushState("VoiceListenerPage", {});
        },
      });
      thisObject._searchView.setSearchIconClass("voice_search");
      var poiResultOptions = {};
      if (app._config["poiPageConfig"] && app._config["poiPageConfig"]["noDetail"]) {
        poiResultOptions["noDetail"] = true;
      }
      thisObject._poiResultView = new daxiapp["DXPoiResultView"](app, thisObject._dom, poiResultOptions);
      thisObject._poiResultView.init({
        onSelectItemAtIndexPath: function (sender, e) {
          // active marker
          thisObject.setUserTrackingModeToNone();
          var mapSDK = app._mapView._mapSDK;
          if (e["bdid"] && e["floorId"]) {
            mapSDK["changeFloor"](e["bdid"], e["floorId"]);
          }
          var marker = DXHighlightMarkerVisitor(mapSDK["getRootScene"](), e["poiId"])["visit"]().highlightMarker;

          for (var i = 0; i < thisObject._markerLayers.length; i++) {
            var markerLayers = thisObject._markerLayers;
            if (markerLayers[i].bdid == e["bdid"] && markerLayers[i].floorId == e["floorId"]) {
              var bbox = markerLayers[i].getBoundsByVisibleData();
            }
          }
          if (bbox) {
            var diffLon = e["lon"] - (bbox._min[0] + bbox._max[0]) * 0.5;
            var diffLat = e["lat"] - (bbox._min[1] + bbox._max[1]) * 0.5;
            var bounds = [bbox._min[0] + diffLon, bbox._min[1] + diffLat, bbox._max[0] + diffLon, bbox._max[1] + diffLat];
            var maxZoom, minZoom;
            if (app._config["poiResultPage"] && app._config["poiResultPage"]["maxZoom"]) {
              maxZoom = app._config["poiResultPage"]["maxZoom"];
              minZoom = app._config["poiResultPage"]["minZoom"];
            }
            mapSDK["fitBounds"]({
              bounds: bounds,
              bdid: e["bdid"],
              floorId: e["floorId"],
              maxZoom: maxZoom,
              duration: 800,
              padding: { bottom: thisObject._poiResultView.getHeight(), left: 10, right: 10 },
            });
          }
        },

        onSelectItemDetail: function (sender, e) {
          var args = {
            method: "showPoiDetail",
            data: {
              poiInfo: e,
            },
          };
          if (thisObject.params.defStartPoint) {
            args["data"]["defStartPoint"] = thisObject.params.defStartPoint;
          }
          if (e["detailtype"] == 0) {
            // 一般poi详情信息 extend info
            app.pageCommand.openPoiState(e);
          } else if (e["detailtype"] == 1) {
            // 地铁详情
            app._stateManager.pushState("MapStateSubWay", args);
          }
        },

        onTakeToThere: function (sender, e) {
          var locationManager = app._mapView._locationManager;
          var startPoint = {};
          var params = thisObject.params;
          var defStartPoint = params.defStartPoint;
          if (locationManager) {
            var myPositionInfo = locationManager["getMyPositionInfo"]();
            if (defStartPoint && (myPositionInfo["bdid"] != defStartPoint.bdid || !myPositionInfo["floorId"])) {
              startPoint = defStartPoint;
              startPoint["name"] = defStartPoint["name"] || "站内起点";
            } else {
              var lon = (params["position"] && params["position"][0]) || myPositionInfo["position"][0];
              var lat = (params["position"] && params["position"][1]) || myPositionInfo["position"][1];
              var bdid = (params["position"] && params["bdid"]) || myPositionInfo["bdid"] || "";
              var floorId = (params["position"] && params["floorId"]) || myPositionInfo["floorId"] || "";
              var token = params["token"] || myPositionInfo["token"];
              startPoint["lon"] = lon;
              startPoint["lat"] = lat;
              startPoint["bdid"] = bdid;
              startPoint["floorId"] = floorId;

              if (!params["position"] || !params["position"][0]) {
                startPoint["name"] = params["startName"] || "我的位置";
                startPoint["posMode"] = "myPosition";
              } else {
                startPoint["name"] = params["startName"] || "起点位置";
                startPoint["name"] = params["startPosMode"] || "";
              }
            }
          }

          var args = {
            method: "takeToThere",
            endPoint: e,
            startPoint: startPoint, // 定位起点信息
          };

          if (app._config["openThirdApp_amap"]) {
            var urlParams =
              "lon=" + e["lon"] + "&lat=" + e["lat"] + (e["name"] ? "&name=" + encodeURIComponent(e["name"]) : "") + "&t=0&dev=0&sourceApplication=miniapp";
            console.log(urlParams);
            if (window.AlipayJSBridge) {
              window.AlipayJSBridge.call("amapOpenPage", {
                pageName: "navi",
                urlParams: urlParams,
                isDialog: false,
                complete: function (res) {
                  alert(JSON.stringify(res));
                },
                fail: function (res) {
                  alert(res.errorMessage);
                },
              });
            }
            return;
          } else {
            setTimeout(function () {
              app._stateManager.pushState("MapStateRoute", args);
            }, 0);
          }
        },

        viewStateChanged: function (sender, arg) {
          var viewHeight = arg["viewHeight"];
          var mapView = thisObject._app._mapView;
          var height = 16 + viewHeight;
          mapView.setBottomViewHeight(height);
        },
      });

      var locationManager = thisObject._app._mapView._locationManager;
      var state = locationManager["getLocationState"]();
      if (state > 1) {
        thisObject._poiResultView.updateTitle("");
      } else {
        locationManager["on"]("onLocationStateChanged", function (sender, state) {
          if (state > 1) {
            thisObject._poiResultView.updateTitle("");
          }
        });
      }
      this.show(false);
    },

    setUserTrackingModeToNone: function () {
      var mapView = this._app._mapView;
      var locationManager = mapView._locationManager;
      var locState = locationManager["getLocationState"]();
      if (locState == DaxiMap["LocationState"]["LOCATED"]) {
        mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap["UserTrackingMode"]["None"]);
      } else {
        mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap["UserTrackingMode"]["Unknown"]);
      }
    },
    onStateBeginWithParam: function (args) {
      var thisObject = this;
      this._super(args);
      if (!args) return;
      var mapView = this._app._mapView;
      mapView.setTopViewHeight(60);
      mapView.setBottomViewHeight(284);
      this.params = dxUtils.copyData(args);
      try {
        this.showPois(dxUtils.copyData(args));
      } catch (e) {
        console.log(e.toString());
      }
      thisObject._searchView.updateData();
    },
    openMainPoiPage: function (args) {
      var thisObject = this;
      var params = thisObject.params;

      var command = { data: params, method: "openMainPoiPage" };
      if (thisObject.buildingInfo) {
        command["data"]["cnname"] = thisObject.buildingInfo.cn_name;
      }
      var page = thisObject._app._stateManager.pushState("MapStateMainPoiPage", command);
      page._once("selectPoiCallback", function (sender, selectPoiResult) {
        if (selectPoiResult.retVal == "OK") {
          thisObject.showPois(selectPoiResult["data"]);
        }
      });
    },

    onHideByPushStack: function (args) {
      this._super(args);
      var mapView = this._app._mapView;
      mapView.pushState(true);
    },

    onShowByPopStack: function (args) {
      this._super(args);
      var mapView = this._app._mapView;
      mapView.popState();
    },

    onStateEnd: function (args) {
      this._super(args);
      var _search = this._app._mapView._search;
      _search["cancel"]();
    },

    // Run Command
    runCommond: function (command) {},
    showMarkers: function (data) {
      var thisObject = this;
      var mapSDK = thisObject._app._mapView._mapSDK;
      thisObject.clearAllRenderObject();
      var onMarkerClick = function (marker) {
        thisObject._poiResultView.setActiveById(marker.id || marker._options["featureId"]);
      };
      var markerMap = {};
      var markers = [];
      var bdid = thisObject._app._mapView._mapSDK["getCurrentBDID"]();
      for (var poiIndex in data) {
        var poiInfo = data[poiIndex];
        bdid = poiInfo["bdid"] || "";
        var markerOption = {
          featureId: poiInfo["poiId"],
          id: poiInfo["poiId"],
          bdid: poiInfo["bdid"],
          lon: poiInfo["lon"],
          lat: poiInfo["lat"],
          floorId: poiInfo["floorId"] || "",
          imageUrl: "blue_dot",
          highlightImageUrl: "red_dot",
          scale: 0.5,
          onClick: onMarkerClick,
        };
        var bdid = poiInfo["bdid"] || "outdoor",
          floorId = markerOption["floorId"];
        var key = bdid + floorId;
        if (!markerMap[key]) {
          markerMap[key] = { bdid: bdid, floorId: floorId, data: [] };
        }
        markerMap[key]["data"].push(markerOption);
      }
      for (var key in markerMap) {
        var bdid = markerMap[key]["bdid"] || "outdoor",
          floorId = markerMap[key]["floorId"] || "",
          markers = markerMap[key]["data"];
        var markerLayer = new daximap["DXSceneMarkerLayer"]();
        markerLayer.initialize(mapSDK, { markers: markers, bdid: bdid, floorId: floorId, onClick: onMarkerClick });
        markerLayer.id = "marker" + dxUtils.createUUID();
        markerLayer.bdid = bdid;
        markerLayer.floorId = floorId;
        markerLayer.addToMap();
        thisObject._markerLayers.push(markerLayer);
        thisObject._renderObjects.push(markerLayer);
      }

      setTimeout(function () {
        thisObject._poiResultView.setActiveByIndex(0);
      }, 0);
    },

    // 打开PoiDetailPage 或者去showPoiDetail
    openPoiDetailPage: function (data) {
      var params = this.params;
      var command = {
        method: "showPoiDetail",
        data: { poiInfo: data, defStartPoint: params["defStartPoint"] || "" },
      };
      this._app._stateManager.pushState("MapStatePoiDetail", command);
    },

    // 打开SearchPage
    openSearchPage: function (data) {
      var thisObject = this;
      var mapSDK = thisObject._app._mapView._mapSDK;
      // 当前地图点位
      var params = this.params;
      var token = params["token"] || thisObject._app._params.token;
      var bdid = params["bdid"] || mapSDK["getCurrentBDID"]();
      var floorId = params["floorId"] || mapSDK["getCurrentFloorId"]();
      var pos = mapSDK["getPosition"]();
      var bdInfo = thisObject._app._mapView.getCurrIndoorBuilding()["bdInfo"];
      bdid = bdInfo["bdid"];
      floorId = floorId || bdInfo["groundFloorId"];
      if (mapSDK["getCurrentBDID"]() != bdid) {
        lon = bdInfo["center"][0];
        lat = bdInfo["center"][1];
      }

      var stateParams = {
        method: "openSearchPage",
        data: {
          bdid: bdid,
          token: token,
          floorId: floorId,
          position: params["position"] || [pos["lon"], pos["lat"]],
          keyword: data["keyword"],
          defStartPoint: params["defStartPoint"] || "",
        },
      };

      var page = thisObject._app._stateManager.pushState("MapStateSearchPage", stateParams);
      page._once("searchPageCallback", function (sender, searchResult) {
        if (searchResult.retVal == "OK") {
          searchResult["data"]["defStartPoint"] = params["defStartPoint"] || "";
          thisObject._app.pageCommand.openPoiState(searchResult["data"]);
        }
      });
    },

    // 显示Pois
    showPois: function (params) {
      var thisObject = this;
      var defStartPoint = thisObject.params.defStartPoint;
      var mapView = this._app._mapView;
      var locationManager = mapView._locationManager;
      var resListOptions = {};
      if (thisObject._app._config["hideSearchDis"]) {
        resListOptions["hideDis"] = thisObject._app._config["hideSearchDis"];
      } else {
        if (locationManager["getLocationState"]() != daximap["LocationState"]["LOCATED"]) {
          resListOptions["hideDis"] = true;
          params["hideDis"] = true;
        }
      }
      if (params["method"] == "showErrorMessage") {
        this._poiResultView.showErrorText({ tip: params["keyword"] });
        return;
      }
      if (params["results"]) {
        thisObject._poiResultView.updateData(params["results"], resListOptions);
        thisObject.showMarkers(params["results"]);
        thisObject._searchView.updateInputText(params["keyword"] || params["text"] || "");
        return;
      }
      this._poiResultView.showLoading();

      if (params["lat"] && params["lon"] && params["text"]) {
        thisObject._poiResultView.updateData([params], resListOptions);
        thisObject.showMarkers([params]);
        thisObject._searchView.updateInputText(params["keyword"] || params["text"] || "");
        return;
      }

      var position = params["position"];
      if (position) {
        params["lon"] = position[0];
        params["lat"] = position[1];
      }
      var myPositionInfo = locationManager && locationManager["getMyPositionInfo"]();
      var locPos = myPositionInfo["position"];
      if (!params["lon"]) {
        if (locPos[0]) {
          params["lon"] = locPos[0];
          params["lat"] = locPos[1];
        } else {
          var pos = mapView._mapSDK.getPosition();
          params["lon"] = pos["lon"];
          params["lat"] = pos["lat"];
        }
      }
      params["myPositionInfo"] = myPositionInfo;

      var mapView = this._app._mapView;
      var _search = mapView._search;
      params["url"] = thisObject.searchConf["url"];
      params["url"] += "?t=" + new Date().getTime();
      var count = thisObject.searchConf["count"];
      count && (params["count"] = count);
      if (params["poiIds"]) {
        params["featureIds"] = params["poiIds"];
      }
      if (params["keyword"]) {
        thisObject._searchView.updateInputText(params["keyword"]);
      } else if (params["name"]) {
        thisObject._searchView.updateInputText(params["name"]);
      }
      if (!params["lon"]) {
        var pos = mapView._mapSDK["getPosition"]();
        params["lon"] = pos["lon"];
        params["lat"] = pos["lat"];
        var currBuilding = mapView.currBuilding;
        if (currBuilding) {
          params["bdid"] = currBuilding["bdid"];
          params["floorId"] = currBuilding["getCurrentFloorId"]() || mapView._mapSDK["getCurrentFloorId"]();
        }
      }
      params["floorId"] = params["floorId"] || mapView._mapSDK["getCurrentFloorId"]();
      params["bdid"] = params["bdid"] || mapView._mapSDK["getCurrentBDID"]();
      if (params["searchType"] == "classSearch") {
        params["types"] = params["keyword"] || params["name"];
        delete params["keyword"];
        delete params["name"];
        delete params["poiIds"];
        delete params["featureIds"];
      }
      params["token"] = thisObject._app._params["token"];
      var mapStateManager = thisObject._app._stateManager;
      var count = thisObject.searchConf["count"];
      count && (params["count"] = count);
      _search["query"](
        params,
        function (data) {
          data = data || [];
          if (mapStateManager._curPage == thisObject) {
            thisObject.setUserTrackingModeToNone();
            if (params && !params["lon"] && !params["lon"]) {
              data.forEach(function (item) {
                delete item["distance"];
              });
            }
            data?.forEach(function (item) {
              // 测试地铁数据
              if (params["keyword"] == "地铁") {
                item["poiDetailType"] = 1;
              }
              // 测试地铁数据
              if (params["keyword"] == "公交") {
                item["extendInfo"] = "114路,12路,33路";
              }
            });
            var hideSearchDis = thisObject._app._config["hideSearchDis"];
            if (hideSearchDis) {
              params["hideDis"] = true;
            }
            thisObject._poiResultView.updateData(data, resListOptions);
            thisObject.showMarkers(data);
          }
        },
        function (data) {
          if (mapStateManager._curPage == thisObject) {
            thisObject.showMarkers([]);
            thisObject._poiResultView.updateData(data, resListOptions);
          }
        },
      );
    },
  });

  daxiapp["MapStatePoi"] = MapStatePoi;
})(window);
