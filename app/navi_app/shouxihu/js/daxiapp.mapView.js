const MapView = function (app, container, options) {;
  const daximap = window["DaxiMap"] || {};

  const daxiapp = window["DaxiApp"];
  const domUtils = daxiapp["dom"];
  const DxDomUtil = daxiapp["domUtil"];
  const EventHandlerManager = daxiapp["EventHandlerManager"];
  const DXMapUtils = daximap["DXMapUtils"];
  const naviMath = daxiapp["naviMath"];
  const thisObject = {};
  thisObject.parentObj = container;
  thisObject._topContainers = [];
  thisObject._bottomContainers = [];
  thisObject._topViewHeight = 0;
  thisObject._bottomViewHeight = 0;
  thisObject._viewStateStack = [];
  thisObject["extendCtrlBtns"] = [];
  thisObject.currBuildingInfo = null;

  const basicMap_html = `<div id="Container1" class="map_container"><!--地图容器--></div>`;
  domUtils.html(container, basicMap_html);
  thisObject._dom = domUtils.find(container, ".map_container");
  function initMap(container) {
    const params = app._params;
    const downloader = app.downloader;
    if (!downloader) {
      const platform = params["platform"];
      if (platform == "android" || platform == "ios" || platform == "android_web" || platform == "ios_web") {
        downloader = new DXNativeDownloader(app.jsBridge);
      } else {
        downloader = null;
      }
    }
    const mapConfig = {
      token: params["token"] || "11da506a647aae682d208c5c5bb43098", //开发者Token
      appName: "daxiapp", //开发者应用名称
      baseMapPath: window["mapSDKPath"] + "map/",
      locPath: (window["mapSDKPath"] && window["mapSDKPath"] + "location/") || "../../../map_sdk/location/",
      debugEngine: false,
      dataPath: params["dataRootPath"] ? params["dataRootPath"].replace("{{filename}}", "") : "../../data/map_data/",
      downloader: downloader,
      version: params["version"],
    };
    ["buildingId", "heading", "tilt", "zoom", "lon", "lat", "showOutDoorMap", "explodedView", "mapStyle", "spriteUrl"].forEach(function (key) {
      if (params[key] != undefined) {
        mapConfig[key] = params[key] || app._config[key];
      }
    });
    if (!mapConfig["defaultZoomLevel"]) {
      mapConfig["defaultZoomLevel"] = app._config["defaultZoomLevel"];
    }

    const mapSDK = new daximap["Map"]("Container1", mapConfig);
    const postLocRes = params.postLocRes || app._config["postLocRes"];
    const ctrlLocByUser = params.ctrlLocByUser;
    const userId = params.userId;
    const userName = params.userName;
    const deviceType = params.device;
    if (postLocRes && !deviceType && params["unique_deviceno"]) {
      deviceType = daximap["browser"] + (daximap["deviceType"]["isAndroid"] ? "android" : "ios") + (new Date().getTime() % 10000);
    }

    const sessionKey = params.sessionKey;

    if (typeof app._config["location"] == "object") {
      locOptions = app._config["location"];
    } else {
      locOptions = {};
    }
    Object.assign(locOptions, {
      token: mapConfig["token"] || "11da506a647aae682d208c5c5bb43098",
      bdid: mapConfig["bdid"] || mapConfig["buildingId"],
      type: params["projScene"] || "wechat", // 环境类型为native/微信
      postLocRes: postLocRes,
      ctrlLocByUser: ctrlLocByUser,
      userId: userId || params["openid"] || "",
      platform: params["platform"] || "",
      device: deviceType,
      sessionKey: sessionKey,
      unique_deviceno: params["unique_deviceno"],
      deviceId: params["deviceId"] || "",
      downloader: downloader,
      id: params["id"],
      locType: params["locType"],
      locPath: mapConfig["locPath"],
    });
    const locationManager = new daximap["LocationManager"](locOptions);
    thisObject.listenUserchangedOnce = function (e) {
      const hash;
      if (typeof data == "string") {
        hash = data;
      } else {
        hash = window.location.hash;
      }
      window.lastHashCount = window.history.length;
      if (hash && hash.length > 1) {
        try {
          if (hash[0] == "#") {
            hash = decodeURIComponent(hash.slice(1));
          }
          const paramArray = hash.split("|");
          if (paramArray.indexOf("userchanged=true") != -1 || paramArray.indexOf("userchanged=userback") != -1) {
            thisObject.userChangedCallback && thisObject.userChangedCallback();
          }
        } catch (e) {
          console.log(e);
        }
      }
    };
    thisObject.updateUserInfo = function (callback) {
      thisObject.userChangedCallback = callback;
      window.removeEventListener("hashchange", thisObject.listenUserchangedOnce);
      window.addEventListener("hashchange", thisObject.listenUserchangedOnce);
      locationManager["navigateToGetWXUser"]();
    };
    mapSDK["on"]("loadComplete", function (sender, bdListData) {
      // 默认启用 3D 地形效果
      const terrainConfig = app._config["terrainConfig"];
      if (terrainConfig !== false && terrainConfig !== "false") {
        const terrainUrl = daxiapp.utils.addProjectUrl("/appConfig/terrain.json");
        mapSDK["enableTerrainWithHillshade"]({
          terrainJsonUrl: terrainUrl,
          exaggeration: terrainConfig?.exaggeration || 1,
          hillshadeExaggeration: terrainConfig?.hillshadeExaggeration || 0.5,
        });
      }

      // AR 实例化
      if (app._config["ARConfig"] && daxiapp["ARNavigation"]) {
        thisObject.arNavigation = new daxiapp["ARNavigation"](thisObject._dom);
      }

      thisObject.bottomLeftCompsWrapper = new daximap["ComponentsWrapper"](thisObject._dom[0], {
        anchor: "BottomLeft",
        pos: {
          x: 12,
          y: 66,
        },
        styleObj: {
          width: "36px",
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
        },
      });
      const bottomLeftNode = thisObject.bottomLeftCompsWrapper["getDom"]();

      // 爆炸图按钮
      if (app._config["showExplodedView"] == true || app._config["showExplodedView"] == "true") {
        app._config["explodedConfig"] && mapSDK["setFloorInterval"](app._config["explodedConfig"]["floorInterval"] || 150);
        thisObject._mulityFloorCtrl = new daximap["IconButtonControl"](bottomLeftNode, {
          iconName: "layer",
          anchor: "auto",
          styleObj: {
            "margin-bottom": "8px",
            background: "#fff",
            "border-radius": "6px",
            position: "static",
            padding: "5px",
            "font-size": "24px",
            border: "1px solid #bfbfbf",
          },
          onClick: function () {
            const enable = !mapSDK["getExplodedView"]();
            mapSDK["setExplodedView"](enable, app._config["explodedConfig"] || { tilt: 60 });
            enable && setUserTrackingMode();
          },
        });

        mapSDK["on"]("explodedViewChanged", function (sender, explodedView) {
          explodedView ? thisObject._mulityFloorCtrl["addClass"]("active") : thisObject._mulityFloorCtrl["removeClass"]("active");
        });
      }
      // 创建楼层选择控件
      thisObject._floorCtrl = new daximap["FloorControl"](mapSDK, {
        anchor: "auto",
        styleObj: {
          padding: "0px 4px",
          "margin-bottom": "6px",
          position: "static",
        },
        visible: false,
        onClick: setUserTrackingMode,
        parentNode: bottomLeftNode,
      });
      // 创建指北针
      thisObject._compass = new daximap["CompassControl"](mapSDK, {
        anchor: "TopLeft",
        pos: {
          x: -2,
          y: -52,
        },
        onClick: function () {
          const defaultHeading = 0;
          mapSDK["setHeading"](defaultHeading);
          setUserTrackingMode();
        },
        parentNode: bottomLeftNode,
      });
      thisObject._bottomContainers.push(thisObject._compass);
      if (!app._config["hideScenicVisited"] == true) {
        thisObject._sceneStateBtn = new daximap["ButtonControl"](bottomLeftNode, {
          anchor: "auto",
          styleObj: {
            position: "static",
            "margin-bottom": "14px",
            width: "38px",
            height: "38px",
          },
          onClick: function (e) {
            // mapSDK["on"]("mapClicked", onMapClick, thisObject);
            // thisObject.selectPoint["setVisible"](false);
            // thisObject.comfirmSelectPoint["setVisible"](true);
          },
        });
      }

      // thisObject._sceneStateBtn.setChild("<p><span></span></p>");
      thisObject._bottomContainers.push(thisObject._compass);

      thisObject._locationBtnCtrl = new daximap["LocationButtonControl"](mapSDK, {
        anchor: "auto",
        styleObj: {
          position: "static",
        },
        enable: true,
        state: -1, //locationManager["getLocationState"](),
        parentNode: bottomLeftNode,
      });
      function setUserTrackingMode(mode) {
        if (daximap["UserTrackingMode"]["None"] < thisObject._locationBtnCtrl["getUserTrackingMode"]()) {
          thisObject._locationBtnCtrl["setUserTrackingMode"](daximap["UserTrackingMode"]["None"]);
        }
        thisObject._naviManager["pauseNavi"]();
      }
      // bootomRight wrapper
      thisObject.bottomRightCompsWrapper = new daximap["ComponentsWrapper"](thisObject._dom[0], {
        anchor: "BottomRight",
        pos: {
          x: 12,
          y: 66,
        },
        styleObj: {
          width: "36px",
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
        },
      });
      const bRCompsWrapperNode = thisObject.bottomRightCompsWrapper["getDom"]();

      // 初始化图层切换控件
      thisObject._initLayerSwitchControl(mapSDK, bRCompsWrapperNode, setUserTrackingMode);

      if (!app._config["disabledOutDoor"] && !app._params["disabledOutDoor"]) {
        thisObject._toBuildingCtrl = new daximap["IconButtonControl"](bRCompsWrapperNode, {
          width: 34,
          height: 34,
          iconName: "icon-buxing", //"icon-jingdian",//"icon-quanlan",
          styleObj: {
            "text-align": "center",
            "font-size": "22px",
            "line-height": "28px",
            position: "static",
            "margin-bottom": "10px",
            color: "#26c9d5",
          },
          onClick: function () {
            const myPositionInfo = locationManager.getMyPositionInfo();
            const inBuilding = thisObject._toBuildingCtrl.getData("inBuilding");
            if (thisObject.currBuildingInfo && !inBuilding) {
              setUserTrackingMode();
              const bdInfo = thisObject.currBuildingInfo["bdInfo"];
              const center = bdInfo["center"];
              const zoom = bdInfo["mapZoom"] || bdInfo["zoomLevel"] || bdInfo["zoom"] || 18;
              // var defHeading = bdInfo["defaultHeading"];
              const heading = mapSDK.getHeading();
              // var tilt = bdInfo["defaultTilt"]||0;
              mapSDK["easeTo"]({ lon: center[0], lat: center[1], zoom: zoom, heading: heading, duration: 1000 });
            } else {
              const pos = myPositionInfo.position;
              if (pos[0]) {
                thisObject._locationBtnCtrl["setUserTrackingMode"](daximap["UserTrackingMode"]["FollowWithHeading"]);
              }
            }
          },
        });
        thisObject._toBuildingCtrl["setBackground"]("#fff");
        thisObject._toBuildingCtrl["setVisible"](false);
      }

      // 2D/3D切换控件
      thisObject._viewModeCtrl = new daximap["ViewModeControl"](mapSDK, {
        anchor: "auto",
        styleObj: {
          position: "static",
          "margin-bottom": "10px",
          "font-size": "1.2rem",
          border: "0px",
          border: "1px solid #bfbfbf",
        },
        parentNode: bRCompsWrapperNode,
        onClick: function () {
          if (mapSDK["getExplodedView"]()) {
            mapSDK["setExplodedView"](false);
          }
          setUserTrackingMode();
        },
      });

      // 创建缩放控件
      thisObject._zoomCtrl = new daximap["ZoomControl"](mapSDK, {
        anchor: "auto",
        styleObj: {
          position: "static",
          border: "1px solid #bfbfbf",
        },
        parentNode: bRCompsWrapperNode,
        onClick: setUserTrackingMode,
      });

      initializeUserLocationMarker();

      mapSDK["on"]("selectBoxEnd", function (sender, data) {
        console.log(data);
      });
      // 创建定位状态控件
      imageUrl = "./images/gps_deactive.png";
      const myPosInfo = locationManager["getMyPositionInfo"]();
      if (myPosInfo["position"][0]) {
        imageUrl = myPosInfo["locType"] == "GPS" ? "./images/gps_active.png" : "./images/ble_active.png";
      }
      if (thisObject._userCtrl) {
        thisObject._locStateCtrlOffsetTop = 38;
      } else {
        thisObject._locStateCtrlOffsetTop = 0;
      }
      if (!app._config["hideLocState"]) {
        thisObject._locationStateCtrl = new daximap["ImageButtonControl"](thisObject._dom[0], {
          anchor: "TopRight",
          width: 26,
          height: 26,
          pos: {
            x: 16,
            y: 60 + thisObject._locStateCtrlOffsetTop,
          },
          imageUrl: imageUrl,
        });
      }

      if (postLocRes) {
        thisObject.startLogCtrl = new daximap["ButtonControl"](thisObject._dom[0], {
          anchor: "BottomRight",
          pos: { x: 16, y: 240 },
          width: 36,
          height: 36,
          onClick: function () {
            const token = app._params["token"] || "";
            const bdid = (thisObject.currBuildingInfo && thisObject.currBuildingInfo.bdid) || "";
            const locVersion = app._config.useLocator || "daxionemap";
            locationManager["startSendLog"](
              { userId: userId, userName: userName, bdid: bdid, token: token, locVersion: locVersion, deviceType: deviceType, ctrlLocByUser: ctrlLocByUser },
              function (data) {
                thisObject.stopLogCtrl["setVisible"](true);
                thisObject.startLogCtrl["setVisible"](false);
                thisObject.selectPoint && thisObject.selectPoint["setVisible"](true);
              },
            );
          },
        });
        thisObject.startLogCtrl["updateText"]("开始log记录");
        thisObject.stopLogCtrl = new daximap["ButtonControl"](thisObject._dom[0], {
          anchor: "BottomRight",
          pos: { x: 16, y: 240 },
          width: 36,
          height: 36,

          onClick: function () {
            locationManager["stopSendLog"](function (data) {
              thisObject.stopLogCtrl["setVisible"](false);
              thisObject.startLogCtrl["setVisible"](true);
              if (thisObject.stopSelectPoint && thisObject.stopSelectPoint["getVisible"]()) {
                thisObject.stopSelectPoint["fire"]("onClick");
              } else if (thisObject.selectPoint) {
                thisObject.selectPoint["setVisible"](false);
                thisObject.comfirmSelectPoint["setVisible"](false);
                if (collectLocInfoPoint) {
                  collectLocInfoPoint["removeFromMap"]();
                  collectLocInfoPoint = null;
                }
              }
            });
          },
        });
        thisObject.stopLogCtrl["updateText"]("结束log记录");
        thisObject.stopLogCtrl["setVisible"](false);
      }
      thisObject.indoorLocated = false;
      // 初始状态 控件设值
      locationManager["setBuildingsData"](bdListData);
      const config = app._config;
      const centerPos = config["defaultCenter"];
      const building = null;
      const defaultBdid = app._params["buildingId"] || app._config["buildingId"];
      if (defaultBdid) {
        if (app._params["lon"] && app._params["lat"]) {
          centerPos = { lon: app._params["lon"], lat: app._params["lat"] };
        }
        const filelist = bdListData["list"];
        for (var i = 0, len = filelist.length; i < len; i++) {
          if (filelist[i]["bdid"] == defaultBdid) {
            const bdInfo = filelist[i];
            const pos = bdInfo["location"].split(",").map(function (item) {;
              return Number(item);
            });
            centerPos = { lon: pos[0], lat: pos[1] };
            building = bdInfo;
            break;
          }
        }
      }

      if (centerPos) {
        const zoom = mapConfig["zoom"] || mapConfig["defaultZoomLevel"];
        const heading = mapConfig["heading"] || 0;
        const tilt = mapConfig["tilt"] || 0;
        if (building) {
          const mapZoom = building["mapZoom"] || building["mapLevel"];
          zoom = mapZoom || zoom;
          heading = heading || building["defaultHeading"];
          tilt = tilt || building["defaultTilt"];
        }
        const params = { lon: centerPos["lon"], lat: centerPos["lat"], zoom: zoom };
        if (heading) {
          params["heading"] = heading;
        }
        if (tilt) {
          params["tilt"] = tilt;
        }
        if (config["floorId"]) {
          params["floorId"] = config["floorId"];
        }
        config.bdid ? (params["bdid"] = defaultBdid) : "";
        mapSDK["jumpTo"](params);
      } else {
        const bdInfo = bdListData["list"][0];
        const pos = bdInfo["location"].split(",").map(function (item) {;
          return Number(item);
        });

        const zoom = bdInfo["mapZoom"] || bdInfo["zoomLevel"] || Math.round(mapConfig["defaultZoomLevel"] + 0.1);
        mapSDK["jumpTo"]({ lon: pos[0], lat: pos[1], zoom: zoom });
      }

      options && options["callback"] && options["callback"](mapSDK);
      const defaultBdid = app._params["buildingId"] || app._config["buildingId"];
      if (defaultBdid) {
        //指明bdid 就没有选building的逻辑了
        const followLoc = app._params["followLoc"] || app._config["followLoc"];
        if (followLoc == true) {
          if (locationManager["getLocationState"]() == DaxiMap["LocationState"]["LOCATED"]) {
            thisObject._locationBtnCtrl["setUserTrackingMode"](daximap["UserTrackingMode"]["Follow"]);
          }
          return;
        }
        thisObject._locationBtnCtrl["setUserTrackingMode"](daximap["UserTrackingMode"]["None"]);
        return;
      }
      // 选择building
      // bdListData
      const bdInitType = (app._config["bdInitType"] = app._config["bdInitType"] || 1);
      const location = app._config["location"];
      if (bdInitType != 3 && (!location || location["disableGPS"] != true)) {
        //3当前定位结果 跟随状态
        setTimeout(function () {
          if (app._stateManager._curPage._rtti != "MapStateBrowse") {
            thisObject._locationBtnCtrl["setUserTrackingMode"](daximap["UserTrackingMode"]["None"]);
            return;
          }
          if (bdInitType == 1) {
            thisObject._bdListCtrl = daxiapp["domUtil"].listViewWithModal({ list: [] });
            thisObject._bdListCtrl.hide();
          }
          // bdInitType 1：显示当前城市列表，2:进最近的站
          thisObject.checkInitialBuilding(bdInitType, bdListData);
        }, 3000);
      }
      // 地图初始化完成
      thisObject["extendCtrlBtns"] = [];
      if (window["dx_createMapFinished"] && typeof window["dx_createMapFinished"] == "function") {
        window["dx_createMapFinished"](mapSDK, thisObject["extendCtrlBtns"], app._stateManager, locationManager, app._config, app._params);
      }
    });
    thisObject.updateLocViewStatus = function (inBuilding) {
      const myPosInfo = thisObject._locationManager.getMyPositionInfo();
      const pos = myPosInfo.position;
      if (inBuilding) {
        thisObject._toBuildingCtrl.setData("inBuilding", true);
        thisObject._toBuildingCtrl.updateIcon("icon-buxing");
        // if(!pos[0]){
        //   thisObject._toBuildingCtrl.setVisible(false);
        //   return;
        // }
      } else {
        thisObject._toBuildingCtrl.setData("inBuilding", false);
        thisObject._toBuildingCtrl.updateIcon("icon-jingdian");
      }
      // thisObject._toBuildingCtrl.setVisible(thisObject._toBuildingCtrl.getData("visible")&&true);
    };
    function initBuildingsLayer(buildings, mapSDK) {
      thisObject.buildingLayer = new daximap["DXSceneMarkerLayer"]();
      const markers = [];
      const onMarkerClick = function (marker) {;
        mapSDK["jumpTo"]({ lon: marker["lon"], lat: marker["lat"], zoom: marker["defaultZoom"] });
      };
      buildings.forEach(function (building) {
        const bdid = building["bdid"];
        const center = building["location"].split(",").map(function (item) {;
          return parseFloat(item);
        });
        const icon = building["icon"] || "./images/normal_stop.png";
        if (building["icon"] && icon.indexOf("http") == -1 && icon.indexOf("./") == -1 && icon.indexOf(".") != -1) {
          icon = "./images/" + icon;
        }
        const markerOption = {
          featureId: bdid,
          id: bdid,
          lon: center[0],
          lat: center[1],
          floorId: "",
          imageUrl: icon,
          highlightImageUrl: icon,
          scale: 0.5,
          defaultZoom: building["defaultZoom"] || 16,
          // "onClick":onMarkerClick
        };
        markers.push(markerOption);
        if (markers.length == buildings.length) {
          thisObject.buildingLayer.initialize(mapSDK, {
            markers: markers,
            bdid: "",
            filter: ["<=", ["zoom"], 13],
            onClick: onMarkerClick,
            onMouseOver: function () {},
            onMouseLeave: function () {},
          });
          thisObject.buildingLayer.id = "customer_building_marker_layer";
          thisObject.buildingLayer.addToMap();
        }
      });
    }
    function initializeUserLocationMarker() {
      const locationBtnCtrl = thisObject._locationBtnCtrl;
      const userLocationMarker = new daximap["UserLocationMarker"](mapSDK);
      const myPosInfo = locationManager["getMyPositionInfo"]();
      const naviConfig = app._config["naviConfig"] || {};
      const showLevel = naviConfig["realPosLevel"] || 0;
      const minDistance = naviConfig["minDistance"] || 0;
      userLocationMarker.setRealLevel(showLevel, minDistance);
      const locationState = locationManager["getLocationState"]();
      if (myPosInfo["position"][0]) {
        userLocationMarker.setLocation({
          lng: myPosInfo.position[0],
          lat: myPosInfo.position[1],
          heading: myPosInfo.direction,
          floorId: myPosInfo.floorId,
          bdid: myPosInfo.bdid,
        });

        userLocationMarker.setVisible(locationState == DaxiMap["LocationState"]["LOCATED"]);
      }
      // 当定位更新的时候更新LocationMarker的位置

      locationManager["on"]("onLocationChanged", function (sender, e) {
        const loc = {
          lng: e["position"][0],
          lat: e["position"][1],
          real_pos: e["real_pos"],
          heading: e["direction"],
          floorId: e["floorId"],
          bdid: e["bdid"],
          duration: 300,
        };
        if (!thisObject.indoorLocated) {
          // 首次室内定位成功
          thisObject.indoorLocated = true;
          const locationBdlist = app._config["location"] && app._config["location"]["bdlist"];
          const currentMapSate = app._stateManager.getCurrentStateName();
          const bdid = app._params["bdid"] || app._params["buildingId"] || app._config["bdid"];
          if ((!bdid || bdid == e["bdid"]) && locationBdlist?.[e["bdid"]]?.["loactedMapZoom"]) {
            if (currentMapSate == "MapStateBrowse") {
              mapSDK.jumpTo({ bdid: e["bdid"], floorId: e["floorId"], lon: loc["lng"], lat: loc["lat"], zoom: locationBdlist[e["bdid"]]["loactedMapZoom"] });
            } else {
              // mapSDK.setZoom(locationBdlist[e["bdid"]]["loactedMapZoom"]);
            }
          }
        }

        const userTrackingMode = thisObject._locationBtnCtrl["getUserTrackingMode"]();
        const bdInitType = (app._config["bdInitType"] = app._config["bdInitType"] || 1);
        const followLoc = app._params["followLoc"] || app._config["followLoc"];
        if (userTrackingMode == daximap["UserTrackingMode"]["Unknown"]) {
          if (followLoc == true || bdInitType == 3 || (bdInitType == 2 && thisObject.indoorLocated)) {
            thisObject._locationBtnCtrl["setUserTrackingMode"](daximap["UserTrackingMode"]["Follow"]);
          }
        }
        const naviStatus = thisObject._naviManager["getNaviStatus"]();
        if (naviStatus != 0 && naviStatus != 4 && naviStatus != 3) {
          userLocationMarker.setLocation(loc);
        }
        if (thisObject._locationStateCtrl) {
          if (e["bdid"]) {
            if (e["isIndoorAreaGPS"]) {
              thisObject._locationStateCtrl["setImageUrl"]("./images/gps_indoorarea.png");
            } else {
              thisObject._locationStateCtrl["setImageUrl"]("./images/ble_active.png");
            }
            thisObject._bdListCtrl && thisObject._bdListCtrl.hide();
          } else {
            thisObject._locationStateCtrl["setImageUrl"]("./images/gps_active.png");
          }
        }
      });

      // 当定位状态变化的时候,修改LocationButton的状态
      locationManager["on"]("onLocationStateChanged", function (sender, locationState) {
        //thisObject._locationBtnCtrl["getUserTrackingMode"]()
        if (thisObject.initailLocationFailed) {
          //定位成功延迟较大在 checkInitialBuilding 之后
          // if(thisObject.initCheckedBuilding){
          locationBtnCtrl["setUserTrackingMode"](daximap["UserTrackingMode"]["None"]);
        } else {
          const userTrackingMode = thisObject._locationBtnCtrl["getUserTrackingMode"]();
          const bdInitType = (app._config["bdInitType"] = app._config["bdInitType"] || 1);
          const followLoc = app._params["followLoc"] || app._config["followLoc"];
          if (userTrackingMode == daximap["UserTrackingMode"]["Unknown"] && (followLoc == true || bdInitType == 3)) {
            // thisObject._locationBtnCtrl["setUserTrackingMode"](daximap["UserTrackingMode"]["Follow"]);
            locationBtnCtrl["onLocationStateChanged"](locationState);
          }
        }
        // else{
        //     locationBtnCtrl["onLocationStateChanged"](locationState);
        // }
        //定位状态变化不直接修改 在 initCheckedBuilding 判断
        userLocationMarker.setVisible(locationState == DaxiMap["LocationState"]["LOCATED"]);
      });

      // 当按钮点击的时候，如果没有定位或者定位失败，则重新定位，否则切换按钮图标状态
      locationBtnCtrl["on"]("onClick", function (sender) {
        const myPosInfo = thisObject._locationManager["getMyPositionInfo"]();
        const pos = myPosInfo["position"];
        if (!pos[0] || !pos[1]) {
          //alert("定位信号弱,请到");
          return;
        }
        if (locationManager["getLocationState"]() < DaxiMap["LocationState"]["LOCATED"]) {
          locationBtnCtrl["updateIcon"](DaxiMap["LocationIcon"]["Locating"]);
          locationManager["Relocation"]();
        } else {
          locationBtnCtrl["changeUserTrackingMode"]();
        }
      });

      // 当定位按钮图标状态发生变化的时候，修改userLocationMarker的跟随状态
      locationBtnCtrl["on"]("onUserTrackingModeChanged", function (sender, mode) {
        const bdid = userLocationMarker.getBDID(),;
          floorId = userLocationMarker.getFloorId(),
          heading = userLocationMarker.getHeading();
        userLocationMarker["setUserTrackingMode"](mode);
        //没有定位成功
        if (locationManager["getLocationState"]() < daximap["LocationState"]["LOCATED"]) {
          return;
        }
        if (mode == daximap["UserTrackingMode"]["Follow"]) {
          if (userLocationMarker.position[0]) {
            mapSDK["moveTo"]({
              lon: userLocationMarker.position[0],
              lat: userLocationMarker.position[1],
              bdid: bdid,
              heading: 0,
              // zoomLevel:18,
              floorId: floorId,
              duration: 300,
            });
          }
        } else if (mode == daximap["UserTrackingMode"]["FollowWithHeading"]) {
          if (userLocationMarker.position[0]) {
            mapSDK["moveTo"]({
              lon: userLocationMarker.position[0],
              lat: userLocationMarker.position[1],
              bdid: bdid,
              heading: heading,
              floorId: floorId,
              duration: 300,
            });
          }
        }
      });

      // 当地图拖动是图标变成Free状态
      mapSDK["on"](
        "onMapDragEnd",
        function (sender, e) {
          sender._naviManager["pauseNavi"]();
          if (locationBtnCtrl["getUserTrackingMode"]() <= 0) return;
          locationBtnCtrl["setUserTrackingMode"](daximap["UserTrackingMode"]["None"]);
        },
        thisObject,
      );

      thisObject._userLocationMarker = userLocationMarker;
      thisObject._naviManager["setIndicator"](thisObject._userLocationMarker);
    }
    // 当室内场景可见时，显示楼层控件，如果没有可以显示的室内场景，隐藏楼层控件
    mapSDK["on"]("onIndoorBuildingActive", function (sender, building) {
      if (building) {
        const bdid = building["bdid"];
        locationManager["changeBuilding"](bdid);
        thisObject.setCurrIndoorBuilding(building);
        thisObject._floorCtrl && thisObject._floorCtrl["updateMap"](building);
        if (building.children.length > 1) {
          thisObject._floorCtrl && thisObject._floorCtrl["setVisible"](true);
        }
        if (thisObject._mulityFloorCtrl) {
          thisObject._mulityFloorCtrl["setVisible"](true);
          const arr = thisObject._floorCtrl["getPosition"]();
          const height = thisObject._floorCtrl["getHeight"]();
          thisObject._mulityFloorCtrl["setPosition"](arr[0], arr[1] + height + 10);
        }
        if (thisObject.currBuilding != building) {
          thisObject.getAllSceneList(bdid);
        }
        thisObject.currBuilding = building;
        thisObject._eventMgr.fire("onIndoorBuildingActive", { building: building });
        mapSDK.forceRedraw();
        thisObject.updateLocViewStatus(true);
      } else {
        thisObject._floorCtrl && thisObject._floorCtrl["setVisible"](false);
        thisObject._mulityFloorCtrl && thisObject._mulityFloorCtrl["setVisible"](false);
        thisObject.updateLocViewStatus(false);
      }
    });

    // mapSDK["on"]("changeFloor", function (sender, floorId) {
    //   thisObject._floorCtrl && thisObject._floorCtrl["activeFloorById"](floorId);
    // })
    thisObject._mapSDK = mapSDK;
    thisObject._locationManager = locationManager;
    thisObject._search = new DaxiMap["Search"](mapSDK);
    const _config = app._config;
    // init speakListener
    const speakServerUrl = _config.speakServerUrl || "";
    const canSpeak = _config.canSpeak != false ? true : false;
    //Container, id, baiduAudioToken,language,speakServerUrl,canSpeak

    const speakListener = new DaxiMap["SpeakListener"]({;
      containerDom: container,
      id: "speakSynthesizer",
      baiduAudioToken: "",
      speakServerUrl: speakServerUrl,
      canSpeak: canSpeak,
      platform: app._params["platform"],
    });
    speakListener.init();
    thisObject._speakListener = speakListener;
    const audioDom = $("#speakSynthesizer");
    // if(window["DeviceMotionEvent"]["requestPermission"]){//针对ios语音播报
    document.body.addEventListener("click", function () {
      speakListener.triggerPlay();
      document.body.removeEventListener("click", arguments.callee);
    });
    // }
    //讲解和导航播报同时播放时语音会停止，把播放状态传给小程序端做处理
    audioDom.on("ended", function (e) {
      const data = {
        type: "postEventToMiniProgram",
        id: app._params["userId"],
        methodToMiniProgram: "naviSpeakerStatus=ended",
        roleType: "receiver",
      };
      window["locWebSocketPostMessage"] && window["locWebSocketPostMessage"](data);
      console.log("ended", e);
    });
    audioDom.on("play", function (e) {
      const data = {
        type: "postEventToMiniProgram",
        id: app._params["userId"],
        methodToMiniProgram: "naviSpeakerStatus=play",
        roleType: "receiver",
      };
      window["locWebSocketPostMessage"] && window["locWebSocketPostMessage"](data);
      console.log("play", e);
    });
    audioDom.on("pause", function (e) {
      const data = {
        type: "postEventToMiniProgram",
        id: app._params["userId"],
        methodToMiniProgram: "naviSpeakerStatus=pause",
        roleType: "receiver",
      };
      window["locWebSocketPostMessage"] && window["locWebSocketPostMessage"](data);
      console.log("pause", e);
    });

    // init NavigationManager
    const naviManager = new DaxiMap["NavigationManager"](thisObject._mapSDK);
    //app._config
    if (_config["route"] && _config["route"]["url"]) {
      _config["navi"] && (_config["navi"]["routeUrl"] = _config["route"]["url"]);
    }
    naviManager["init"]({
      options: { naviConfig: _config["navi"], route: _config["route"] },
      locationManager: thisObject._locationManager,
      speakListener: speakListener,
    });
    thisObject._naviManager = naviManager;
  }
  initMap(container);
  thisObject.setCurrIndoorBuilding = function (building) {
    if (!thisObject.currBuildingInfo && building && thisObject._toBuildingCtrl) {
      thisObject._toBuildingCtrl.setVisible(true);
    }
    thisObject.currBuildingInfo = building;
  };
  // thisObject.setCurrIndoorBuilding = function (building) {
  //   thisObject.currBuildingInfo = building;
  // };
  thisObject.getCurrIndoorBuilding = function (building) {
    return thisObject.currBuildingInfo;
  };
  thisObject.getUserDetailInfo = function (userInfo, successCB, failedCB) {
    const userServerUrl = app._config["user"]["userServerUrl"];
    const appId = app._params["appId"] || app._config["appId"],;
      userId = userInfo["userId"],
      secret = app._params["secret"] || "";
    const url = userServerUrl + "/get?t=" + new Date().getTime();
    if (!appId || !secret || !userId) {
      return;
    }

    DXMapUtils.getData(
      url,
      { appId: appId, userId: userId, secret: secret },
      "json",
      function (result) {
        if (result.success && result.result) {
          const data = result.result;
          for (var key in data) {
            userInfo[key] = data[key];
          }
          userInfo["userName"] = data["nickName"];
          successCB && successCB(userInfo);
        } else {
          failedCB && failedCB(result);
        }
      },
      function (errer) {
        failedCB && failedCB(errer);
      },
    );

    // https://map1a.daxicn.com/daxi-manager/endUser/get?appId=wxe51129e09bb46147&secret=F67D8EE9CD3C162CF75B4336DD4441C8&userId=abcd12468711225
  };
  thisObject._eventMgr = new EventHandlerManager();
  thisObject.initailLocationFailed = false;
  thisObject.initCheckedBuilding = false;
  thisObject.checkInitialBuilding = function (type, bdListData) {
    if (app._stateManager._curPage._rtti != "MapStateBrowse") {
      thisObject._locationBtnCtrl["setUserTrackingMode"](daximap["UserTrackingMode"]["None"]);
      return;
    }
    const locationManager = thisObject._locationManager;
    const localInfo = locationManager["getMyPositionInfo"]();
    const point = app._mapView._mapSDK["getPosition"]();
    const lon = localInfo.position[0] || point["lon"];
    const lat = localInfo.position[1] || point["lat"];
    const geodecodeSuccessFn = (geodata) => {
      const citycode = geodata.citycode;

      /**
       * 设置定位跟踪模式并标记初始化完成
       * @param {string} mode - 跟踪模式
       * @param {object} [jumpParams] - 可选的地图跳转参数
       */
      const setTrackingModeAndFinish = (mode, jumpParams) => {
        thisObject._locationBtnCtrl.setUserTrackingMode(daximap.UserTrackingMode[mode]);
        thisObject.initCheckedBuilding = true;
        if (jumpParams) {
          thisObject._mapSDK.jumpTo(jumpParams);
        }
      };

      // 定位在站点范围内，直接切到定位位置
      if (localInfo.bdid) {
        if (localInfo.position[0]) {
          thisObject._mapSDK.jumpTo({ lon: localInfo.position[0], lat: localInfo.position[1] });
          setTrackingModeAndFinish("Follow");
        } else {
          thisObject.initCheckedBuilding = true;
        }
        return;
      }

      // 没有定位到站内，需检查当前城市的 building 列表
      const pos = localInfo.position[0] ? [localInfo.position[0], localInfo.position[1]] : null;

      if (!pos) {
        // GPS 也没有定位成功，直接按默认位置显示
        thisObject.initailLocationFailed = true;
        DxDomUtil.tipNotice("定位信号弱，地图显示默认位置", 2000, null, { subStyle: { color: "#1f97ef" } });
        const defaultBuilding = app._config.defaultBuilding;
        if (defaultBuilding?.lon) {
          const zoom = defaultBuilding.mapZoom;
          thisObject._mapSDK.jumpTo({ lon: defaultBuilding.lon, lat: defaultBuilding.lat, zoom });
        }
        setTrackingModeAndFinish("None");
        return;
      }

      const bdItems = [];
      for (let i = 0, len = bdListData.list.length; i < len; i++) {
        const item = bdListData.list[i];
        if (item.noIndoorMap) continue;

        const center = item.location.split(",").map(parseFloat);
        center[2] = center[2] || 1000;
        const distance = naviMath.getGeodeticCircleDistance({ x: center[0], y: center[1] }, { x: pos[0], y: pos[1] });

        // 定位在建筑范围内，直接显示当前站
        if (distance <= center[2]) {
          setTrackingModeAndFinish("Follow");
          return;
        }
        if (item.citycode == citycode) {
          bdItems.push({ text: item.cn_name, bdid: item.bdid, location: item.location, distance, center });
        }
      }

      // 当前城市没有匹配到 building，定位成功后切到定位位置
      if (bdItems.length == 0) {
        setTrackingModeAndFinish("Follow", { lon: pos[0], lat: pos[1] });
        return;
      }

      bdItems.sort((a, b) => a.distance - b.distance);

      if (type == 1) {
        // 显示选站列表
        thisObject._bdListCtrl.updateData({
          list: bdItems,
          onItemSelected: (e) => {
            const target = e.target;
            const zoom = target.getAttribute("data-zoom") || 17;
            const location = target.getAttribute("data-location").split(",");
            thisObject._locationBtnCtrl.setUserTrackingMode(daximap.UserTrackingMode.None);
            thisObject._mapSDK.jumpTo({ lon: location[0], lat: location[1], zoom });
            thisObject._bdListCtrl.hide();
          },
        });
        thisObject._bdListCtrl.show();
      } else if (type == 2 && bdItems.length > 0) {
        // 切入最近的站
        const item = bdItems[0];
        if (thisObject._mapSDK.getCurrentBDID() != item.bdid) {
          const zoom = item.zoom || 17;
          const { center } = item;
          thisObject._locationBtnCtrl.setUserTrackingMode(daximap.UserTrackingMode.None);
          thisObject._mapSDK.jumpTo({ lon: center[0], lat: center[1], zoom });
        }
      }
      thisObject.initCheckedBuilding = true;
    };
    daxiapp.service.api.geodecode({ location: lon + "," + lat }, geodecodeSuccessFn, (err) => {
      console.error(err);
    });
  };
  thisObject.setTopViewHeight = function (val) {
    if (thisObject._topViewHeight == val) return;

    if (thisObject._locationStateCtrl) {
      thisObject._locationStateCtrl["setParams"]({
        pos: {
          y: val + thisObject._locStateCtrlOffsetTop,
        },
      });
    }
    if (thisObject._userCtrl) {
      thisObject._userCtrl["setParams"]({
        pos: {
          y: val,
        },
      });
    }
    thisObject["extendCtrlBtns"].forEach(function (ctrlBtn) {
      ctrlBtn["setParams"] &&
        ctrlBtn["setParams"]({
          pos: {
            y: val + ctrlBtn["getPrimaryY"](),
          },
        });
    });
  };

  thisObject.setBottomViewHeight = function (val, changePosition) {
    if (thisObject._bottomViewHeight == val) return;
    thisObject._bottomViewHeight = val;
    // thisObject._zoomCtrl["setParams"]({
    //     "pos": {
    //         "y": val + 8
    //     }
    // });
    // thisObject._viewModeCtrl["setParams"]({
    //     "pos": {
    //         // "y": val + 96
    //         "y": val + 90
    //     }
    // });
    thisObject.bottomRightCompsWrapper["setParams"]({
      pos: {
        y: val + 8,
      },
    });
    thisObject.bottomLeftCompsWrapper["setParams"]({
      pos: {
        y: val + 8,
      },
    });
    thisObject["extendCtrlBtns"].forEach(function (ctrlBtn) {
      ctrlBtn["setParams"] &&
        ctrlBtn["setParams"]({
          pos: {
            y: val + ctrlBtn["getPrimaryY"](),
          },
        });
    });
    if (changePosition == false) {
      thisObject._mapSDK["setPadding"]({ top: thisObject._topViewHeight, bottom: thisObject._bottomViewHeight, left: 60, right: 60 });
    }
  };
  ((thisObject.getAllSceneList = function (bdid) {
    // if (bdid == "B000A11DMZ") return;
    const thisObject = this;
    // var app = this._app;
    if (!thisObject.visitingBDInfo || thisObject.visitingBDInfo["bdid"] != bdid) {
      thisObject.visitingBDInfo = {
        bdid: bdid,
      };
    }

    daxiapp.api.getExplainAll({}, (data) => {
      if (thisObject.visitingBDInfo.bdid != bdid) return;

      const sceneList = data.result.filter((item) => item.level == 3);
      const merchantList = data.result.filter((item) => item.level == 4);
      thisObject.visitingBDInfo.totalCount = sceneList.length;

      const visitedCount = thisObject.visitingBDInfo.visitedCount || 0;
      thisObject._sceneStateBtn?.setChild(
        `<p style='display: flex;justify-content: space-between;line-height: 34px;height: 34px;padding: 3px;'>
          <span style='font-size:1.2rem;align-self: flex-start;line-height: 1;width: fit-content;height: fit-content;margin-top: 2px;' id='visitedCount'>${visitedCount}</span>
          <span style='transform: rotateZ(20deg);font-size: 1.8rem;padding: 0px;margin-left: -2px;margin-top: 1px;'>/</span>
          <span id='totalCount' style='margin-left: -4px;font-size:1rem;align-self: flex-end;line-height: 1;width: fit-content;height: fit-content;'>${sceneList.length}</span>
        </p>`,
      );
    });
  }),
    (thisObject.setVisitedScene = function (bdid, count) {
      if (!this.visitingBDInfo) {
        this.visitingBDInfo = {
          bdid: bdid,
          visitedCount: count,
        };
      } else if (this.visitingBDInfo["bdid"] == bdid) {
        this.visitingBDInfo["visitedCount"] = count;
      }
      if (this._sceneStateBtn) {
        const dom = document.getElementById("visitedCount");
        dom && (dom["textContent"] = count);
      }
    }));
  thisObject.show = function () {
    thisObject._dom.show();
  };
  thisObject.hide = function () {
    thisObject._dom.hide();
  };
  thisObject.pushState = function (restorePos) {
    const state = {
      restorePos: restorePos,
    };

    const cameraPose = thisObject._mapSDK["cameraPose"]();
    state.lon = cameraPose["lon"];
    state.lat = cameraPose["lat"];
    state.heading = cameraPose["heading"];
    state.tilt = cameraPose["tilt"];
    state.floorId = cameraPose["floorId"];
    state.bdid = cameraPose["bdid"];
    state.zoomLevel = thisObject._mapSDK["getZoom"]();
    state.topViewHeight = thisObject._topViewHeight;
    state.bottomViewHeight = thisObject._bottomViewHeight;
    const stateName = app._stateManager.getCurrentStateName();
    if (stateName == "MapStateAutoPlayExhibit") {
      thisObject._userCtrl && thisObject._userCtrl["setVisible"](false);
      thisObject._locationStateCtrl && thisObject._locationStateCtrl["setVisible"](false);
    }
    // save all control visible
    thisObject._viewStateStack.push(state);
  };

  thisObject.popState = function () {
    const stateName = app._stateManager.getCurrentStateName();
    if (stateName != "MapStateAutoPlayExhibit") {
      thisObject._userCtrl && thisObject._userCtrl["setVisible"](true);
      thisObject._locationStateCtrl && thisObject._locationStateCtrl["setVisible"](true);
    }
    const state = thisObject._viewStateStack.pop();
    if (!state) return;
    if (state.topViewHeight != thisObject._topViewHeight || state.bottomViewHeight != thisObject._bottomViewHeight) {
      thisObject.setTopViewHeight(state.topViewHeight);
      thisObject.setBottomViewHeight(state.bottomViewHeight);
    }

    if (state.restorePos) {
      if (state.lon != 0 && state.lat != 0) {
        const loc = {
          lon: state.lon,
          lat: state.lat,
          heading: state.heading,
          tilt: state.tilt,
          zoomLevel: state.zoomLevel,
          floorId: state.floorId,
          bdid: state.bdid,
          duration: 300,
        };
        thisObject._mapSDK["moveTo"](loc);
      }
    }
  };

  /////////////////////////////////////////////////////////////////////
  // Map Event
  /////////////////////////////////////////////////////////////////////
  thisObject._on = function (type, fn, context) {
    thisObject._eventMgr.on(type, fn, context);
  };

  thisObject._once = function (type, fn, context) {
    thisObject._eventMgr.once(type, fn, context);
  };

  thisObject._off = function (type, fn, context) {
    thisObject._eventMgr.off(type, fn, context);
  };

  thisObject._fire = function (type, data) {
    thisObject._eventMgr.fire(type, data);
  };

  /**
   * 从场景中获取手绘图层对象
   * @param {Object} mapSDK 地图SDK对象
   * @returns {Array} 手绘图层对象数组
   */
  function getHandLayersFromScene(mapSDK) {
    const handLayers = [];
    try {
      const scene = mapSDK._coreMap._scene;
      if (scene && scene.children) {
        function findWMTSLayers(children) {
          for (var i = 0; i < children.length; i++) {
            const child = children[i];
            if (child && child._rtti === "DXMapBoxWMTSLayer") {
              handLayers.push(child);
            }
            // 递归查找
            if (child.children) {
              findWMTSLayers(child.children);
            }
            // 查找 floorObject
            if (child._floorObject) {
              findWMTSLayers([child._floorObject]);
            }
          }
        }
        findWMTSLayers(scene.children);
      }
    } catch (e) {
      console.warn("获取手绘图层失败:", e);
    }
    return handLayers;
  }

  /**
   * 初始化图层切换控件
   * @param {Object} mapSDK 地图SDK对象
   * @param {HTMLElement} parentNode 父容器节点
   * @param {Function} setUserTrackingMode 设置定位跟踪模式函数
   */
  thisObject._initLayerSwitchControl = function (mapSDK, parentNode, setUserTrackingMode) {
    const daximap = window["DaxiMap"] || {};

    // 默认启用图层切换 (enableLayerSwitch 默认为 true)
    if (app._config["enableLayerSwitch"] === false || app._config["enableLayerSwitch"] === "false") {
      return;
    }

    // 默认图层为手绘图 (defaultMapLayer 默认为 "hand")
    const defaultLayer = app._config["defaultMapLayer"] || "hand";

    // 创建图层切换控件
    thisObject._layerSwitchCtrl = new daximap["LayerSwitchControl"](mapSDK, {
      anchor: "auto",
      styleObj: {
        position: "static",
        "margin-bottom": "10px",
      },
      parentNode: parentNode,
      defaultLayer: defaultLayer,
      onClick: function () {
        setUserTrackingMode();
      },
    });

    // 存储图层对象引用
    const layerObjects = {
      hand: null,
      road: null,
      satellite: null,
      hybrid: null,
    };

    // 获取已有的手绘图层 (从场景中复用已加载的 wmtsLayer)
    const handLayers = getHandLayersFromScene(mapSDK);
    if (handLayers.length > 0) {
      // 手绘图层已存在，复用已有的图层对象
      const handLayerObj = {
        _layers: handLayers,
      };
      handLayerObj.setVisible = function (visible) {
        handLayers.forEach(function (layer) {
          if (layer && typeof layer.setVisible === "function") {
            layer.setVisible(visible);
          }
        });
      };
      handLayerObj.getVisible = function () {
        return handLayers.length > 0 && typeof handLayers[0].getVisible === "function" ? handLayers[0].getVisible() : true;
      };
      layerObjects.hand = handLayerObj;
    } else if (app._config["handLayerConfig"]) {
      // 如果场景中还没有手绘图层，尝试使用配置创建
      const handLayerConfig = app._config["handLayerConfig"];
      const handLayer = new daximap["DXMapBoxWMTSLayer"]();
      handLayer["initialize"](mapSDK, {
        tiles: handLayerConfig.tiles || [],
        layerType: "raster",
        minzoom: handLayerConfig.minzoom || 12,
        maxzoom: handLayerConfig.maxzoom || 20,
        layerName: "handLayer",
      });
      handLayer["addToMap"]();
      layerObjects.hand = handLayer;
      handLayer.setFloorObject = function () {};
    }

    // 创建高德道路图层
    if (app._config["enableGaodeRoad"] !== false) {
      const roadLayer = new daximap["DXMapBoxGaodeLayer"]();
      roadLayer["initialize"](mapSDK, {
        layerType: "road",
        layerName: "roadLayer",
      });
      roadLayer["addToMap"]();
      layerObjects.road = roadLayer;
      roadLayer.setFloorObject = function () {};
    }

    // 创建高德卫星图层
    if (app._config["enableGaodeSatellite"] !== false) {
      const satelliteLayer = new daximap["DXMapBoxGaodeLayer"]();
      satelliteLayer["initialize"](mapSDK, {
        layerType: "satellite",
        layerName: "satelliteLayer",
      });
      satelliteLayer["addToMap"]();
      layerObjects.satellite = satelliteLayer;
      satelliteLayer.setFloorObject = function () {};
    }

    // 创建高德混合图层
    if (app._config["enableGaodeHybrid"] !== false) {
      const hybridLayer = new daximap["DXMapBoxGaodeLayer"]();
      hybridLayer["initialize"](mapSDK, {
        layerType: "hybrid",
        layerName: "hybridLayer",
      });
      hybridLayer["addToMap"]();
      layerObjects.hybrid = hybridLayer;
      hybridLayer.setFloorObject = function () {};
    }

    // 根据当前图层类型控制可见性
    const updateLayerVisibility = function (currentLayer) {
      // 先隐藏所有图层
      for (var key in layerObjects) {
        const layer = layerObjects[key];
        if (layer && typeof layer.setVisible === "function") {
          layer.setVisible(false);
        }
      }
      // 显示当前图层
      const currentLayerObj = layerObjects[currentLayer];
      if (currentLayerObj && typeof currentLayerObj.setVisible === "function") {
        currentLayerObj.setVisible(true);
      }
    };

    // 初始化时隐藏除默认外的所有图层
    for (var key in layerObjects) {
      const layer = layerObjects[key];
      if (key !== defaultLayer && layer && typeof layer.setVisible === "function") {
        layer.setVisible(false);
      }
    }

    // 监听图层切换事件
    thisObject._layerSwitchCtrl.on("layerChanged", function (sender, data) {
      updateLayerVisibility(data.layerType);
    });

    // 暴露切换图层的方法到 mapView 对象
    thisObject.switchMapLayer = function (layerType) {
      if (layerObjects[layerType]) {
        thisObject._layerSwitchCtrl.switchLayer(layerType);
      }
    };

    // 暴露获取当前图层的方法
    thisObject.getCurrentMapLayer = function () {
      return thisObject._layerSwitchCtrl.getCurrentLayer();
    };
  };

  return thisObject;
};
