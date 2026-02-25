(function (global) {
  "use strict";
  var daxiapp = global["DaxiApp"] || {};
  var domUtils = daxiapp["dom"];
  var MapStateClass = daxiapp["MapStateClass"];
  var MapStateChangeStartEndPoint = MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "MapStateChangeStartEndPoint";
    },

    initialize: function (app, container) {
      this._super(app, container);
      var thisObject = this;
      thisObject.token = app._config.token || app._params.token || "";
      thisObject._bdid = "";
      // var app  = thisObject._app;
      var basicMap_html = '<div id="change_start_end_point_page" class="dx_full_frame_container"></div>';
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#change_start_end_point_page");

      thisObject._headerView = new daxiapp["DXSearchComponent"](app, thisObject._dom);
      thisObject._headerView.init({
        onSearchViewBackBtnClicked: function (sender, e) {
          var command = {
            retVal: "Cancel",
          };
          app._stateManager.invokeCallback("selectPointCallback", command);
        },
        onSearchInputed: function (sender, text) {
          thisObject.searchPoi(text);
        },
        onSearchViewMicBtnClicked: function (sender, text) {
          // 搜索
          thisObject.searchPoi(text);
          thisObject.addHistory({ keyword: text });
          var historyData = thisObject.getHistoryData()["historyList"];
          thisObject._history.updateData(historyData);
        },
      });
      // <div class="search_display_wrapper
      var searchWraperhtml =
        '<div class="main_content" style="position: relative;flex-grow: 1;"><div class="wrapper" style="height:100%;display:flex;flex-direction: column;"></div></div>';
      domUtils.append(thisObject._dom, searchWraperhtml);
      var mainContentdom = domUtils.find(thisObject._dom, ".main_content .wrapper");
      // 我的位置 地图选点selecteOption
      thisObject._selectPointType = new daxiapp["DXSelectPointOptionComponent"](app, mainContentdom);
      thisObject._selectPointType.init({
        onMyPostionBtnClicked: function (sender, e) {
          var locInfo = app._mapView._locationManager["getMyPositionInfo"]();
          var pointType = thisObject.pointType;
          var command = {
            retVal: "OK",
            method: "startEndPointChanged",
            data: { pointType: pointType },
          };
          var pos = locInfo["position"];
          var pointInfo = {
            lon: pos[0],
            lat: pos[1],
            floorId: locInfo["floorId"],
            bdid: locInfo["bdid"],
            floorName: locInfo["floorName"],
            text: "我的位置",
            posMode: "myPosition",
          };
          if (pointType == "startPoint") {
            command["data"]["startPoint"] = pointInfo;
          } else {
            command["data"]["endPoint"] = pointInfo;
          }
          // 传搜索数据还是keyword 进去的问题 changeStartEndPointCallback
          app._stateManager.invokeCallback("selectPointCallback", command);
        },
        onMapSelectPointBtnClicked: function (sender, e) {
          var pointType = thisObject.pointType;
          var command = {
            retVal: "OK",
            method: "SelectMapPoint",
            data: { pointType: pointType },
          };
          if (pointType == "startPoint") {
            command.data["startPoint"] = e;
          } else {
            command.data["endPoint"] = e;
          }
          var page = app._stateManager.pushState("MapStateSelectPoint", command);
          page._once("selectMapPointCallback", function (sender, selectPointResult) {
            if (selectPointResult.retVal == "OK") {
              app._stateManager.invokeCallback("selectPointCallback", selectPointResult);
            } else {
              var command = {
                retVal: "Cancel",
              };
              app._stateManager.invokeCallback("selectPointCallback", command);
            }
          });
        },
      });
      domUtils.append(mainContentdom, '<div class="search_display_wrapper"></div>');
      thisObject._disWrapper = domUtils.find(thisObject._dom, ".search_display_wrapper");

      //历史记录

      // DXComboxListPanelView
      if (daxiapp["DXComboxListPanelView"] && app._config.hotWordUrl) {
        thisObject._comboxListPanel = new daxiapp["DXComboxListPanelView"](app, thisObject._disWrapper);
        thisObject._comboxListPanel.init({
          onListItemClicked: function (sender, e) {
            var pointType = thisObject.pointType;
            var command = {
              retVal: "OK",
              method: "startEndPointChanged",
              data: {
                pointType: pointType,
              },
            };
            if (pointType == "startPoint") {
              command["data"]["startPoint"] = e;
            } else {
              command["data"]["endPoint"] = e;
            }
            // 传搜索数据还是keyword 进去的问题 changeStartEndPointCallback
            // changeStartEndPointCallback
            app._stateManager.invokeCallback("selectPointCallback", command);
          },
        });
      }

      thisObject._history = new daxiapp["DXHistoryListComponent"](app, thisObject._disWrapper);
      thisObject._history.init({
        onListItemClicked: function (sender, e) {
          var pointType = thisObject.pointType;
          var command = {
            retVal: "OK",
            method: "startEndPointChanged",
            data: {
              pointType: pointType,
            },
          };
          if (pointType == "startPoint") {
            command["data"]["startPoint"] = e;
          } else {
            command["data"]["endPoint"] = e;
          }
          // 传搜索数据还是keyword 进去的问题 changeStartEndPointCallback
          // changeStartEndPointCallback
          app._stateManager.invokeCallback("selectPointCallback", command);
        },
        onClearBtnClicked: function (sender, e) {
          thisObject.clearHistory();
        },
      });

      // 搜索结果
      thisObject._resulView = new daxiapp["DXSelectPoiListComponent"](app, thisObject._disWrapper);
      thisObject._resulView.init({
        onListItemClicked: function (sender, e) {
          var pointType = thisObject.pointType;
          var command = {
            retVal: "OK",
            data: {
              pointType: pointType,
              method: "startEndPointChanged",
            },
          };

          command["data"][pointType] = e;
          e["token"] = thisObject.token;
          thisObject.addHistory(e);

          // var hisData = {"token":thisObject.token,"bdid":e["bdid"],"poiId":e["poiId"],"text":e["text"],"type":e["type"],"viewType":e["viewType"]};
          // thisObject.addHistory(hisData);
          // 传搜索数据还是keyword 进去的问题 changeStartEndPointCallback
          var historyData = thisObject.getHistoryData()["historyList"];
          thisObject._history.updateData(historyData);
          thisObject._resulView.hide();
          // 传搜索数据还是keyword 进去的问题 changeStartEndPointCallback
          app._stateManager.invokeCallback("selectPointCallback", command);
        },
        onTakeToThere: function (sender, e) {
          var pointType = thisObject.pointType;
          var command = {
            retVal: "OK",
            method: "startEndPointChanged",
            data: {
              pointType: pointType,
            },
          };
          if (pointType == "startPoint") {
            command["data"]["startPoint"] = e;
          } else {
            command["data"]["endPoint"] = e;
          }
          // 传搜索数据还是keyword 进去的问题 changeStartEndPointCallback
          // changeStartEndPointCallback
          app._stateManager.invokeCallback("selectPointCallback", command);
        },
      });
      thisObject._resulView.hide();
      thisObject._loadingWidget = new daxiapp["LoadingComponent"](app, thisObject._disWrapper);
      thisObject._loadingWidget.init({});
      thisObject._loadingWidget.hide();

      this.show(false);
    },
    getHotWrordView: function () {
      var thisObject = this;
      if (thisObject._comboxListPanel) {
        var mapSDK = thisObject._app._mapView._mapSDK;
        var token = thisObject.token;
        var url = thisObject._app._config["hotWordUrl"];
        var bdid = mapSDK["getCurrentBDID"]();
        var flid = mapSDK["getCurrentFloorId"]();
        var bdInfo = thisObject._app._mapView.getCurrIndoorBuilding()["bdInfo"];
        bdid = bdInfo["bdid"];
        floorId = floorId || bdInfo["groundFloorId"];
        if (mapSDK["getCurrentBDID"]() != bdid) {
          lon = bdInfo["center"][0];
          lat = bdInfo["center"][1];
        }

        var params = { url: url, token: token, bdid: bdid, floorId: flid, dataType: "hotword" }; //var params = {"url":url,"token":token,"bdid":bdid,"dataType":"hotword"};
        // var data = [{
        //     "token":token,
        //     "bdid":"B000A11DAN",
        //     "floorId":"DX0000350110200001",
        //     "name":"北京南站",
        //     "lon":116.378954,
        //     "lat": 39.865135,
        //     "children":[{
        //         "bdid":"B000A11DAN",
        //         "floorId":"DX0000350110200001",
        //         "name":"东进站口",
        //         "lon":116.3793571478441,
        //         "lat":39.86531166915354,
        //     },
        //     {
        //         "bdid":"B000A11DAN",
        //         "floorId":"DX0000350110200001",
        //         "name":"西进站口",
        //         "lon":116.3786839000023,
        //         "lat": 39.86461845440972,
        //     },
        //     {
        //         "bdid":"B000A11DAN",
        //         "floorId":"DX0000350110100001",
        //         "name":"南进出站口",
        //         "lon":116.3803462525556,
        //         "lat": 39.8638260176027,
        //     },
        //     {
        //         "bdid":"B000A11DAN",
        //         "floorId":"DX0000350110100001",
        //         "name":"北进出站口",
        //         "lon":116.3776793787732,
        //         "lat": 39.86611310855026,
        //     }
        //     ]
        // }];
        thisObject._comboxListPanel.updateData(params);
        // thisObject._search["query"](params,function(data){
        //     thisObject._comboxListPanel.updateData(data);
        // },function(data){
        //     thisObject._comboxListPanel.updateData(data);

        // });
      }
    },
    changeStateChange: function (state) {
      var thisObject = this;
      switch (state) {
        case "loading":
          thisObject._loadingWidget.show();
          thisObject._resulView.hide();
          thisObject._history.hide();
          break;
        case "compeleted":
          thisObject._loadingWidget.hide();
          thisObject._resulView.show();
          thisObject._history.hide();
          break;
        default:
          thisObject._loadingWidget.hide();
          thisObject._resulView.hide();
          thisObject._history.show();
      }
    },

    searchPoi: function (keyword, callback) {
      var thisObject = this;
      var token = thisObject.token;

      var params = thisObject.params;
      var bdid = params["bdid"];
      var floorId = params["floorId"];
      var lon = params["position"][0];
      var lat = params["position"][1];

      thisObject.searchConf = thisObject._app._config["search"];
      var url = thisObject.searchConf["url"];
      var params = { token: token, bdid: bdid, floorId: floorId, keyword: keyword, url: url };
      if (lon && lat) {
        params["lon"] = lon;
        params["lat"] = lat;
      } else {
        // 洗手间
        var center = thisObject._app._config["center"];
        params["lon"] = center["lon"];
        params["lat"] = center["lat"];
      }
      if (bdid) {
        params["type"] = 1;
      } else {
        params["type"] = 21;
      }
      var search = thisObject._app._mapView._search;
      search["cancel"]();
      if (keyword == "") {
        thisObject.changeStateChange("default");
        return;
      }
      var searchUrl = thisObject._app._config["searchUrl"];
      if (searchUrl) {
        params["url"] = searchUrl;
      }

      thisObject.changeStateChange("loading");
      var count = thisObject._app._config["searchCount"];
      count && (params["count"] = count);
      params["myPositionInfo"] = thisObject._app._mapView._locationManager.getMyPositionInfo();
      search["query"](
        params,
        function (data) {
          if (data && !lon && !lat) {
            data.forEach(function (item) {
              delete item["distance"];
            });
          }
          var hideSearchDis = thisObject._app._config["hideSearchDis"];
          thisObject._resulView.updateData(data, { hideDis: hideSearchDis });
          thisObject.changeStateChange("compeleted");
        },
        function (data) {
          thisObject._resulView.updateData(data);
          thisObject.changeStateChange("compeleted");
        }
      );
    },

    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) return;
      this.params = args["data"];
      this.pointType = args["data"]["pointType"];
      var mapView = this._app._mapView;
      mapView.setTopViewHeight(66);
      mapView.setBottomViewHeight(60);
      var thisObject = this;
      var bdid = args["bdid"];
      if (thisObject._bdid != bdid) {
        thisObject._bdid = bdid;
        // thisObject.updateHotKeyWordResult();
      }
      var text = (this.params && this.params["keyword"]) || "";
      this._headerView.updateData(text);
      if (this._comboxListPanel) {
        this.getHotWrordView();
      }
      var historyData = this.getHistoryData()["historyList"];
      this._history.updateData(historyData);
      this.changeStateChange("default");
    },

    onHideByPushStack: function (args) {
      this._super(args);
    },

    onShowByPopStack: function (args) {
      this._super(args);
      var mapView = this._app._mapView;
      mapView.setTopViewHeight(66);
      mapView.setBottomViewHeight(60);
      var text = (args && args["keyword"]) || "";
      this._headerView.updateData(text);
      this.changeStateChange("default");
    },

    onStateEnd: function (args) {
      this._super(args);
    },

    // Run Command
    getHistoryData: function () {
      var token = this.token;
      var bdid = this._bdid;
      var _tempData = { historyList: [] };

      var data = daxiapp["cache"].history.getAll(token + "_" + bdid + "SearchSelect");
      data.forEach(function (a) {
        a["name"] = a["keyword"] || a["text"];
        a["name"] += "";
        _tempData["historyList"].push(a);
      });
      return _tempData;
    },
    addHistory: function (_data) {
      var token = this.token;
      var bdid = this._bdid;
      daxiapp["cache"].history.add(_data, token + "_" + bdid + "SearchSelect");
    },
    clearHistory: function () {
      var token = this.token;
      var bdid = this._bdid;
      daxiapp["cache"].history.clear(token + "_" + bdid + "SearchSelect");
      this._history.updateData([]);
    },
  });

  daxiapp["MapStateChangeStartEndPoint"] = MapStateChangeStartEndPoint;
})(window);
