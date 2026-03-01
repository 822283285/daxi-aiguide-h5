  const daximap = window.DaxiMap || {};
  let DXMapUtils = daximap["DXMapUtils"];

  let EventHandler = daximap["EventHandler"];
  let EventHandlerManager = daximap["EventHandlerManager"];

  ////locationCore/////
  function NativeLocation() {
    this.cordova = window["cordova"];
  }

  NativeLocation.prototype.init = function (bdid, successCB, failureCB) {
    this.cordova && this.cordova["exec"](successCB, failureCB, "Location", "init", [bdid]);
  };
  NativeLocation.prototype.setHost = function (successCB, failureCB, serverURL) {
    this.cordova && this.cordova["exec"](successCB, failureCB, "Location", "setHost", [serverURL]);
  };
  NativeLocation.prototype.setLocationConfig = function (successCB, failureCB, configString) {
    this.cordova && this.cordova["exec"](successCB, failureCB, "Location", "setLocationConfig", [configString]);
  };
  //返回获取蓝牙的原始数据
  NativeLocation.prototype.watchBLEScan = function (successCB, failureCB) {
    this.cordova && this.cordova["exec"](successCB, failureCB, "Location", "watchBLEScan", []);
  };
  //daxi定位检测
  NativeLocation.prototype.watchLocation = function (successCB, failureCB, bdid, token) {
    this.cordova && this.cordova["exec"](successCB, failureCB, "Location", "watchLocation", [bdid, token]);
  };
  NativeLocation.prototype.clearWatch = function (successCB, failureCB) {
    this.cordova && this.cordova["exec"](successCB, failureCB, "Location", "clearWatch", [""]);
  };
  NativeLocation.prototype.geRotation = function (successCB, failureCB) {
    this.cordova && this.cordova["exec"](successCB, failureCB, "Location", "geRotation", [""]);
  };
  NativeLocation.prototype.isLocating = function (successCB, failureCB) {
    this.cordova && this.cordova["exec"](successCB, failureCB, "Location", "isLocating", [""]);
  };
  NativeLocation.prototype.getBdid = function (successCB, failureCB) {
    this.cordova && this.cordova["exec"](successCB, failureCB, "Location", "getBdid", [""]);
  };
  NativeLocation.prototype.getDownloadNetwork = function (successCB, failureCB) {
    this.cordova && this.cordova["exec"](successCB, failureCB, "Location", "getDownloadNetwork", [""]);
  };
  NativeLocation.prototype.getDataStatus = function (successCB, failureCB) {
    this.cordova && this.cordova["exec"](successCB, failureCB, "Location", "getDataStatus", [""]);
  };
  NativeLocation.prototype.startMatchRoute = function (successCB, failureCB, rawRoute, usingLineHeading) {
    this.cordova && this.cordova["exec"](successCB, failureCB, "Location", "startMatchRoute", [rawRoute, usingLineHeading]);
  };
  NativeLocation.prototype.stopMatchRoute = function (successCB, failureCB) {
    this.cordova && this.cordova["exec"](successCB, failureCB, "Location", "stopMatchRoute", []);
  };
  NativeLocation.prototype.getCurrentBeaconData = function (successCB, failureCB) {
    this.cordova && this.cordova["exec"](successCB, failureCB, "Location", "getCurrentBeaconData", []);
  };
  NativeLocation.prototype.shareToFriend = function (successCB, failureCB, params) {
    this.cordova && this.cordova["exec"](successCB, failureCB, "Location", "shareToFriend", params);
  };
  //微信定位接口
  function WXLocation() {
    this.locationEvent = new EventHandler("locationEvent");
  }
  WXLocation.prototype.init = function (watchSuccessCB, watchFailureCB, param) {
    // cordova["exec"](successCB, failureCB,params);
    this.bdid = bdid;
    if (this.wxLocation) {
      this.wxLocation["init"](param, watchSuccessCB, watchFailureCB);
    }
  };
  //返回获取蓝牙的原始数据
  WXLocation.prototype.watchBLEScan = function (successCB, failureCB) {
    // cordova["exec"](successCB, failureCB,"WXLocation","watchBLEScan");
  };
  WXLocation.prototype.registBleStateListener = function (callback) {
    if (this.wxLocation) {
      this.wxLocation["registBleStateListener"](callback);
    }
  };
  WXLocation.prototype.registGPSStateListener = function (callback) {
    if (this.wxLocation) {
      this.wxLocation["registGPSStateListener"](callback);
    }
  };
  WXLocation.prototype["registDebugListener"] = WXLocation.prototype.registDebugListener = function (callback) {
    if (this.wxLocation && this.wxLocation["registDebugListener"]) {
      this.wxLocation["registDebugListener"](callback);
    }
  };
  WXLocation.prototype.updateLocation = function (pos) {
    if (this.wxLocation && this.wxLocation["onLocationResultUpdate"]) {
      this.wxLocation["onLocationResultUpdate"](pos);
    }
  };
  //daxi定位检测
  WXLocation.prototype.watchLocation = function (watchSuccessCB, watchFailureCB, params) {
    let thisObject = this;
    function onInit(wxlocation) {
      params.wsLocUrl = ["wss://map.daxicn.com/ws/loc"];

      wxlocation["init"](watchSuccessCB, watchFailureCB, params);
    }

    if (!thisObject.wxLocation) {
      let locPath = params["locPath"] || "../dependency/libs/";
      let url;
      let indoorLocalAlgorithms = window["indoorLocalAlgorithms"] || "";
      if (indoorLocalAlgorithms == "huawei") {
        url = locPath + "wx.loc2.min.js?t=" + window["version"];
        if (window["command"] && window["command"]["locTest"]) {
          url = locPath + "wx.loc2.js?t=" + window["version"];
        }
      } else if (indoorLocalAlgorithms == "fusion") {
        if (window.location.href.indexOf("locTest=true") != -1) {
          url = locPath + "wx.loc.js?t=" + window["version"];
        } else {
          url = locPath + "wx.loc.js?t=" + window["version"];
        }
      } else if (indoorLocalAlgorithms == "fingerPrint") {
        url = locPath + "wx.ol.l1.js?t=" + window["version"];
      } else {
        return;
      }
      DXMapUtils.loadScript(url, function () {
        if (window["WXLocationEntity"]) {
          thisObject.wxLocation = window["WXLocationEntity"];
          onInit(thisObject.wxLocation);
        }
      });
    } else {
      onInit(thisObject.wxLocation);
    }
  };
  WXLocation.prototype.startSendLog = function (params, successCB, failureCB) {
    if (this.wxLocation) {
      this.wxLocation["locationLogManager"]["startSendLog"](params, successCB);
    }
  };
  WXLocation.prototype.stopSendLog = function (successCB, failureCB) {
    if (this.wxLocation) {
      this.wxLocation["locationLogManager"]["stopSendLog"](successCB);
    }
  };
  WXLocation.prototype.setCollectPoint = function (params, successCB, failureCB) {
    if (this.wxLocation) {
      this.wxLocation["locationLogManager"]["setCollectPoint"](params, successCB);
    }
  };
  WXLocation.prototype.clearCollectPoint = function (successCB, failureCB) {
    if (this.wxLocation) {
      this.wxLocation["locationLogManager"]["clearCollectPoint"](successCB);
    }
  };
  //setSensorStatus
  WXLocation.prototype.setSensorStatus = function (data) {
    if (this.wxLocation) {
      this.wxLocation["setSensorStatus"](data);
    }
  };

  WXLocation.prototype.sendBeaconsData = function (beacons) {
    if (this.wxLocation) {
      this.wxLocation["sendBeaconsData"](beacons);
    }
  };
  WXLocation.prototype.sendGPSData = function (gpsData) {
    if (this.wxLocation) {
      this.wxLocation["sendGPSData"](gpsData);
    }
  };
  WXLocation.prototype.sendHeadingData = function (heading) {
    if (this.wxLocation) {
      this.wxLocation["sendHeadingData"](heading);
    }
  };
  WXLocation.prototype.sendStep = function (heading) {
    if (this.wxLocation) {
      this.wxLocation["sendStep"](heading);
    }
  };
  WXLocation.prototype.sendAOAResult = function (data) {
    if (this.wxLocation) {
      this.wxLocation["sendAOAResult"](data);
    }
  };
  WXLocation.prototype.send5GResult = function (data) {
    if (this.wxLocation) {
      this.wxLocation["send5GResult"](data);
    }
  };
  WXLocation.prototype.setGeofenceData = function () {
    if (this.wxLocation) {
      this.wxLocation["setGeofenceData"](data);
    }
  };

  WXLocation.prototype.startMatchRoute = function (successCB, failureCB, routeData, usingLineHeading, naviStrictByLineDir) {
    if (this.wxLocation) {
      this.wxLocation["startMatchRoute"](routeData, usingLineHeading, naviStrictByLineDir);
    }
  };
  WXLocation.prototype.stopMatchRoute = function (args, successCB, failureCB) {
    if (this.wxLocation) {
      if (args) {
        let real_pos = args.real_pos;
        let pos = {
          position: [real_pos["x"], real_pos["y"], real_pos["z"]],
          heading: args.heading,
          timeStamp: new Date().getTime(),
          bdid: args.bdid,
          floorId: args.floorId,
          lontitude: real_pos["x"],
          latitude: real_pos["y"],
          locType: args.locType,
          isIndoorAreaGPS: args.isIndoorAreaGPS,
        };
      }
      this.wxLocation["stopMatchRoute"](pos);
    }
  };
  WXLocation.prototype.detectDevice = function (successCB, failureCB) {
    if (this.wxLocation && this.wxLocation["detectDevice"]) {
      this.wxLocation["detectDevice"](successCB, failureCB);
    }
  };
  WXLocation.prototype.getCurrentBeaconData = function (successCB, failureCB) {
    if (this.wxLocation) {
      return this.wxLocation["getCurrentBeaconData"](successCB, failureCB);
    }
    return null;
  };
  WXLocation.prototype.setBuildingsData = function (buildingsData) {
    if (this.wxLocation) {
      return this.wxLocation["setBuildingsData"](buildingsData);
    }
    return null;
  };
  // changeBuilding
  WXLocation.prototype.changeBuilding = function (bdid) {
    if (this.wxLocation) {
      return this.wxLocation["changeBuilding"](bdid);
    }
    return null;
  };
  WXLocation.prototype.shareToFriend = function (successCB, failureCB, params) {
    let url = "../share/showShare?";
    let str = "projName=DXOneMap_v3";
    for (let key in params) {
      str.length > 0 ? (str += "&") : "";
      str += key + "=" + params[key];
    }
    url += str;

    try {
      console.log('daximap["deviceType"]', JSON.stringify(daximap["deviceType"]), url);
      // 微信小程序
      if (daximap["deviceType"]["isWX"]) {
        wx["miniProgram"] &&
          wx["miniProgram"]["navigateTo"]({
            url: url,
            success: function (res) {
              // 通过eventChannel向被打开页面传送数据
              res.eventChannel && res.eventChannel.emit("acceptDataFromOpenerPage", { data: "test" });
            },
          });
      } else if (daximap["deviceType"]["isAliMiniProgram"]) {
        window["my"]["postMessage"] &&
          window["my"]["postMessage"]({
            method: "showShare",
            data: { searchStr: str, title: window["langData"]["sharepos:text"] || "位置分享", name: params["name"] || params["text"] || "" },
          });
      }
    } catch (e) {
      alert("shareToFriend:" + e.toString());
    }
  };
  WXLocation.prototype.getBleState = function () {
    if (this.wxLocation) {
      return this.wxLocation["getBleState"]();
    }
  };
  WXLocation.prototype.getGPSState = function () {
    if (this.wxLocation) {
      return this.wxLocation["getGPSState"]();
    }
  };
  WXLocation.prototype.navigateToGetWXUser = function () {
    let url = "../user/user";
    wx["miniProgram"] &&
      wx["miniProgram"]["navigateTo"]({
        url: url,
        success: function (res) {
          // 通过eventChannel向被打开页面传送数据
          res.eventChannel && res.eventChannel.emit("acceptDataFromOpenerPage", { data: "test" });
        },
      });
  };
  WXLocation.prototype["openVoicePage"] = WXLocation.prototype.openVoicePage = function (params, successCB, failureCB) {
    this.onVoiceSuccess = successCB;
    let url = "../transferVoice/transferVoice?";
    for (let key in params) {
      if (url[url.length - 1] != "?") {
        url += "&";
      }
      url += key + "=" + encodeURIComponent(params[key]);
    }
    wx["miniProgram"] &&
      wx["miniProgram"]["navigateTo"]({
        url: url,
        success: function (res) {
          // 通过eventChannel向被打开页面传送数据
          res.eventChannel && res.eventChannel.emit("acceptDataFromOpenerPage", { data: "test" });
        },
      });
  };
  //返回获取蓝牙的原始数据
  WXLocation.prototype["openUserPage"] = WXLocation.prototype.openUserPage = function (successCB, failureCB) {
    let url = "../user/user?";
    for (let key in params) {
      if (url[url.length - 1] != "?") {
        url += "&";
      }
      url += key + "=" + encodeURIComponent(params[key]);
    }
    wx["miniProgram"] &&
      wx["miniProgram"]["navigateTo"]({
        url: url,
        success: function (res) {
          // 通过eventChannel向被打开页面传送数据
          res["eventChannel"] && res["eventChannel"]["emit"]("acceptDataFromOpenerPage", { data: "test" });
        },
      });
  };
  WXLocation.prototype.register5GPhoneNumber = function (phoneNumber, successCB, failedCB) {
    if (this.wxLocation) {
      this.wxLocation["register5GPhoneNumber"](phoneNumber, successCB, failedCB);
    }
  };
  WXLocation.prototype.unregister5GPhoneNumber = function (successCB, failedCB) {
    if (this.wxLocation) {
      this.wxLocation["unregister5GPhoneNumber"](successCB, failedCB);
    }
  };
  WXLocation.prototype.get5GState = function () {
    if (this.wxLocation) {
      return this.wxLocation["get5GState"]();
    }
  };
  WXLocation.prototype.setStepH = function (h) {
    if (this.wxLocation) {
      return this.wxLocation["setStepH"](h);
    }
  };
  WXLocation.prototype.setLocStepH = function (h) {
    if (this.wxLocation) {
      return this.wxLocation["setLocStepH"](h);
    }
  };
  WXLocation.prototype.setStepHAOA = function (h) {
    if (this.wxLocation) {
      return this.wxLocation["setStepHAOA"](h);
    }
  };
  WXLocation.prototype.setLocStepHAOA = function (h) {
    if (this.wxLocation) {
      return this.wxLocation["setLocStepHAOA"](h);
    }
  };
  WXLocation.prototype.setStrictLocArea = function (h) {
    if (this.wxLocation) {
      return this.wxLocation["setStrictLocArea"](h);
    }
  };

  //阿里定位
  function AliLocation() {
    if (window["AliLocationEntity"]) {
      this.AliLocation = window["AliLocationEntity"];
    }
    this.locationEvent = new EventHandler("locationEvent");
  }
  AliLocation.prototype.init = function (successCB, failureCB, bdid, dataPath) {
    this.bdid = bdid;
    if (this.AliLocation) {
      this.AliLocation["init"]([bdid, dataPath], watchSuccessCB, watchFailureCB);
    }
  };
  AliLocation.prototype.setHost = function (successCB, failureCB, serverURL) {};
  AliLocation.prototype.setLocationConfig = function (successCB, failureCB, configString) {
    //cordova["exec"](successCB, failureCB, "AliLocation", "setLocationConfig", [configString]);
  };
  //返回获取蓝牙的原始数据
  AliLocation.prototype.watchBLEScan = function (successCB, failureCB) {
    // cordova["exec"](successCB, failureCB,"AliLocation","watchBLEScan");
  };
  //daxi定位检测
  //daxi定位检测
  AliLocation.prototype.watchLocation = function (successCB, failureCB, params) {
    // cordova["exec"](successCB, failureCB, "WXLocation", "watchLocation", [bdid]);
    if (this.AliLocation) {
      this.AliLocation["watchLocation"](successCB);
    }
  };
  AliLocation.prototype.clearWatch = function (successCB, failureCB) {
    if (this.AliLocation) {
      this.AliLocation["clearWatch"]();
    }
  };

  AliLocation.prototype.getRotation = function (successCB, failureCB) {
    // cordova["exec"](successCB, failureCB, "AliLocation", "geRotation", [""]);
  };
  AliLocation.prototype.isLocating = function (successCB, failureCB) {};
  AliLocation.prototype.getBdid = function (successCB, failureCB) {
    // cordova["exec"](successCB, failureCB, "AliLocation", "getBdid", [""]);
  };

  AliLocation.prototype.getDataStatus = function (successCB, failureCB) {
    // cordova["exec"](successCB, failureCB, "AliLocation", "getDataStatus", [""]);
  };
  AliLocation.prototype.startMatchRoute = function (successCB, failureCB, rawRoute, usingLineHeading) {
    if (this.AliLocation) {
      this.AliLocation["startMatchRoute"](rawRoute, usingLineHeading);
    }
  };
  AliLocation.prototype.stopMatchRoute = function (successCB, failureCB) {
    if (this.AliLocation) {
      this.AliLocation["stopMatchRoute"]();
    }
  };

  //////////////////////////////////////////////////////////////
  // DXLocationManager
  //////////////////////////////////////////////////////////////
  function LocationLogManager(logConfig, downloader) {
    this.type = 0;
    this.handler = null;
    this._locationResultArr = [];
    this._sendTimer = null;
    this.type = 1;
    let thisObject = this;
    this.getHandler = function (options, callback) {
      if (options["locLogType"] != undefined) {
        this.type = options["locLogType"];
      }
      let url = logConfig["handlerUrl"];
      if (logConfig["handlerUrl"]) {
        let serial = (options["deviceId"] || options["unique_deviceno"] || DXMapUtils.createUUID()) + "_" + options["userId"];
        let data = {
          token: options["token"],
          type: this.type,
          t: new Date().getTime(),
          device: options["platform"] || options["pltf"] || "",
          serial: encodeURIComponent(serial) + "|" + options["unique_deviceno"],
          bdid: options["bdid"] || "",
          os: options["platform"] || options["pltf"] || "",
        };
        if (downloader) {
          downloader["getData"](
            logConfig["handlerUrl"],
            "post",
            "text",
            data,
            function (data) {
              thisObject.handler = data;
            },
            function (err) {
              console.log(err);
            }
          );
        } else {
          DXMapUtils.getDataBySecurityRequest(
            url,
            "post",
            data,
            function (data) {
              thisObject.handler = data;
            },
            function (err) {
              console.log(err);
            },
            "text"
          );
        }
      }
    };

    this.addData = function (param) {
      if (thisObject.handler) {
        let locaResArr = this._locationResultArr;
        if (locaResArr.length) {
          let lastPos = locaResArr[locaResArr.length - 1];
          if (
            param["time"] - lastPos["time"] < 4000 &&
            lastPos["lon"] == param["lon"] &&
            lastPos["lat"] == param["lat"] &&
            lastPos["bdid"] == param["bdid"] &&
            lastPos["floorIndex"] == param["floorIndex"]
          ) {
            param["count"]++;
          } else {
            locaResArr.push(param);
          }
        } else {
          locaResArr.push(param);
        }

        if (locaResArr.length >= 10 && this.state != "sending") {
          this.sendLogs();
        }
      }
    };

    this.sendLogs = function () {
      if (thisObject.handler) {
        let locaResArr = this._locationResultArr;
        let url = logConfig["pushLocUrl"];
        if (url && thisObject.handler) {
          thisObject.state = "sending";
          let records = thisObject.handler + "|" + thisObject.type;
          locaResArr.forEach(function (item) {
            records += "|" + item["lon"] + "," + item["lat"] + "," + item["floorIndex"] + "," + item["time"] + "," + item["bdid"] + "," + item["count"];
          });
          if (downloader) {
            downloader["getServiceData"](
              url,
              "post",
              "text",
              { records: encodeURIComponent(records) },
              function (data) {
                thisObject._locationResultArr.length = 0;
                thisObject.state = "sended";
              },
              function (err) {
                thisObject.state = "failed";
                debugger;
              }
            );
          } else {
            DXMapUtils.getDataBySecurityRequest(
              url,
              "post",
              { records: encodeURIComponent(records) },
              function (data) {
                thisObject._locationResultArr.length = 0;
                thisObject.state = "sended";
              },
              function (err) {
                thisObject.state = "failed";
              },
              "rawPost"
            );
          }
        }
      }
    };

    this["getHandler"] = this.getHandler;
    this["addData"] = this.addData;
    this["sendLogs"] = this.sendLogs;

    return this;
  }

  let DXLocationManager = function (options) {
    let thisObject = this;
    thisObject._eventMgr = new EventHandlerManager();
    thisObject.events = {};
    thisObject.locationCore = null;
    if (options["rate"]) {
      thisObject.duration = options["rate"];
    } else {
      thisObject.duration = options["rate"] = 1000;
    }

    thisObject.animationIntervalTime = null;
    let UNLOCATE = -1;
    let LOCATION_FAILURE = 0;
    let LOCATION_LOADING = 1;
    let LOCATED = 2;
    let LOCATED_OUTDOOR = 3;
    let LOCATED_INDOOR = 2;
    thisObject.locationState = UNLOCATE;
    if (options) {
      thisObject.token = options["token"] || daximap["token"] || "";
      thisObject.bdid = options["bdid"] || options["buildingId"] || "";
      options["container"] = thisObject.containerType = options["container"] || options["type"] || "wechat"; //options["type"] || "wechat";
      thisObject.postLocRes = options["postLocRes"] || false;
      thisObject.ctrlLocByUser = options["ctrlLocByUser"] || false;
      thisObject.userId = options["userId"] || "";
      thisObject.sessionKey = options["sessionKey"] || "";
      options["unique_deviceno"] = thisObject.unique_deviceno = options["unique_deviceno"] || "";
      thisObject.dataPath = options["dataPath"];
      thisObject.platform = options["platform"] || "";
      thisObject.device = options["device"] || "";
      thisObject.ble = options["ble"] || {};
      thisObject.gps = options["gps"] || null;
      thisObject.wifi = options["wifi"] || null;
      thisObject.aoa = options["aoa"] || null;

      thisObject.log = options["log"] || null;
      thisObject.id = options["id"] || options["userId"] || "";

      thisObject.locPath = options["locPath"] || "";
      if (options["log"] && options["log"]["handlerUrl"]) {
        thisObject.locationLogManager = new LocationLogManager(options["log"], options["downloader"]);
        thisObject["locationLogManager"] = thisObject.locationLogManager;
        thisObject.locationLogManager.getHandler(options);
        thisObject._eventMgr.on("onLocationChanged", function (sender, loc) {});
      }
    }
    thisObject._location = {
      position: [0, 0],
      bdid: "",
      floorId: "",
      floorNum: 0,
      floorName: "",
      direction: 0,
    };

    let proto = DXLocationManager.prototype;
    function init(thisObject) {
      if (thisObject.containerType === "native") {
        thisObject.locationCore = new NativeLocation();
      } else if (thisObject.containerType === "wechat") {
        thisObject.locationCore = new WXLocation();
      } else if (thisObject.containerType === "alipay") {
        thisObject.locationCore = new AliLocation();
      } else {
        thisObject.locationCore = null;
      }
      if (thisObject.locationCore) {
        let url = thisObject.dataPath || "../projdata/{{token}}/locatingConfig/{{bdid}}/{{filename}}";
        thisObject.locationCore.watchLocation(thisObject._watchLocationCB, thisObject._watchLocationFailed, options);
      }
    }

    /////////////////////////////////////////////////////////////////////
    // Map Event
    /////////////////////////////////////////////////////////////////////
    proto._on = function (type, fn, context) {
      thisObject._eventMgr.on(type, fn);
    };
    proto["onLocationChanged"] = function (fn) {
      thisObject._eventMgr.on("onLocationChanged", fn);
    };
    proto._once = function (type, fn, context) {
      thisObject._eventMgr.once(type, fn);
    };

    proto._off = function (type, fn, context) {
      thisObject._eventMgr.off(type, fn);
    };

    proto._fire = function (type, data) {
      thisObject._eventMgr.fire(type, data);
    };

    proto._Relocation = function (cb, isSimulate) {
      let thisObject = this;
      thisObject._setLocationState(LOCATION_LOADING);
      thisObject._once(
        "onLocationStateChanged",
        function (sender, state) {
          if (state === LOCATED) {
            //定位成功
            thisObject._setLocationState(LOCATED);
            cb && cb(state);
          } else if (state === LOCATION_FAILURE) {
            //定位失败
            thisObject._setLocationState(LOCATION_FAILURE);
            cb && cb(state);
          }
          // else if (state === LOCATED_OUTDOOR) {
          //     // 定位成功但定位点在室外
          //     thisObject._setLocationState(LOCATED_OUTDOOR);
          //     cb && cb(state);
          // }
        },
        isSimulate
      );
    };

    proto._setLocationState = function (state) {
      if (thisObject.locationState != state) {
        thisObject.locationState = state;
        thisObject._eventMgr.fire("onLocationStateChanged", state);
      }
    };

    // 获取当前定位状态
    proto._getLocationState = function () {
      return thisObject.locationState;
    };

    proto._getMyPositionInfo = function () {
      let posInfo = thisObject._location;
      return posInfo;
    };

    proto._startMatchRoute = function (rawRoute, usingLineHeading, naviStrictByLineDir) {
      if (thisObject.locationCore) {
        thisObject.locationCore.startMatchRoute(null, null, rawRoute, usingLineHeading, naviStrictByLineDir);
      }
    };

    proto._stopMatchRoute = function (args) {
      if (thisObject.locationCore) {
        thisObject.locationCore.stopMatchRoute(args);
      }
    };

    proto._setLocationResult = function (loc) {
      thisObject._location = loc;
    };

    proto._postLocationResult = function (e) {
      let position = e["location"]["position"];
      if (position && (!e["location"] || !e["location"]["x"])) {
        if (!e["location"]) {
          e["location"] = {};
        }
        e["location"]["x"] = position[0];
        e["location"]["y"] = position[1];
        e["location"]["z"] = position[2] || e["location"]["floorIndex"] || 0;
      }
      if (!e["real_pos"]) {
        e["real_pos"] = {};
        e["real_pos"]["x"] = e["location"]["x"];
        e["real_pos"]["y"] = e["location"]["y"];
      }

      thisObject._watchLocationCB(e);
    };
    window["postLocationResult"] = proto._postLocationResult;

    proto._watchLocationCB = function (e) {
      let status = UNLOCATE;
      let code = e["code"];
      if (e["location"] && (!e["location"]["bdid"] || e["location"]["bdid"] == "outdoor")) {
        e["location"]["bdid"] = "";
      }

      if (e && parseInt(code) === 220) {
        status = LOCATED;
        let floornum = e["location"]["z"] || 0;

        let floorId = e["location"]["floorId"] || "";
        e["location"]["a"] = e["location"]["a"] < 0 ? 360 + e["location"]["a"] : e["location"]["a"];
        let matched = [e["location"]["x"], e["location"]["y"]];
        let loc = {
          floorNum: floornum,
          floorId: floorId,
          bdid: e["location"]["bdid"],
          position: matched,
          r: e["location"]["r"],
          real_pos: e["real_pos"],
          target_pos: e["target_pos"],
          direction: e["location"]["a"],
          beaconGroupId: e["beaconGroupId"] || 0,
          isIndoorAreaGPS: e["isIndoorAreaGPS"],
          locType: e["locType"] || "",
          duration: thisObject.duration,
          timeStamp: e["timeStamp"],
          receiveTime: e["receiveTime"],
        };

        thisObject._setLocationResult(loc);
        thisObject._eventMgr.fire("onLocationChanged", loc);
      } else {
        status = LOCATION_FAILURE;
      }
      if (status !== thisObject.locationState) {
        thisObject._setLocationState(status);
      }
    };

    proto._watchLocationFailed = function (e) {
      let status = LOCATION_FAILURE;
      if (status !== thisObject.locationState) {
        thisObject._setLocationState(status);
      }
    };
    proto._startSendLog = function (params, callback) {
      if (thisObject.locationCore) {
        thisObject.locationCore.startSendLog(params, callback);
      }
    };
    proto._stopSendLog = function (callback) {
      if (thisObject.locationCore && thisObject.locationCore.stopSendLog) {
        thisObject.locationCore.stopSendLog(callback);
      }
    };
    proto._setCollectPoint = function (params, callback) {
      if (thisObject.locationCore && thisObject.locationCore.setCollectPoint) {
        thisObject.locationCore.setCollectPoint(params, callback);
      }
    };
    proto._clearCollectPoint = function (callback) {
      if (thisObject.locationCore && thisObject.locationCore.clearCollectPoint) {
        thisObject.locationCore.clearCollectPoint(callback);
      }
    };
    proto._setBuildingsData = function (buildingData) {
      if (thisObject.locationCore) {
        thisObject.locationCore.setBuildingsData && thisObject.locationCore.setBuildingsData(buildingData);
      }
    };
    proto._changeBuilding = function (bdid) {
      if (thisObject.locationCore) {
        thisObject.locationCore.changeBuilding && thisObject.locationCore.changeBuilding(bdid);
      }
    };
    proto._shareToFriend = function (data, successCB, failedCB, params) {
      if (typeof params == "object") {
        for (let key in params) {
          if (params[key] != undefined && data[key] == undefined) {
            if (key == "testLocWs") {
              data["locByWSS"] = params[key];
            } else {
              data[key] = params[key];
            }
          }
        }
      }
      if (thisObject.locationCore) {
        thisObject.locationCore.shareToFriend &&
          thisObject.locationCore.shareToFriend(
            successCB ||
              function (res) {
                console.log(res);
              },
            failedCB ||
              function (err) {
                console.log(err);
              },
            data
          );
      }
    };
    proto._navigateToGetWXUser = function () {
      if (thisObject.locationCore) {
        thisObject.locationCore.navigateToGetWXUser && thisObject.locationCore.navigateToGetWXUser();
      }
    };
    proto["getBleState"] = function () {
      if (thisObject.locationCore && thisObject.locationCore.getBleState) {
        return thisObject.locationCore.getBleState();
      }
    };
    proto["getGPSState"] = function () {
      if (thisObject.locationCore && thisObject.locationCore.getGPSState) {
        return thisObject.locationCore.getGPSState();
      }
    };
    proto["registBleStateListener"] = function (callback) {
      if (thisObject.locationCore && thisObject.locationCore.registBleStateListener) {
        return thisObject.locationCore.registBleStateListener(callback);
      }
    };
    proto["registGPSStateListener"] = function (callback) {
      if (thisObject.locationCore && thisObject.locationCore.registGPSStateListener) {
        return thisObject.locationCore.registGPSStateListener(callback);
      }
    };
    proto["registDebugListener"] = function (callback) {
      if (thisObject.locationCore && thisObject.locationCore.registDebugListener) {
        return thisObject.locationCore.registDebugListener(callback);
      }
    };
    proto["setSensorStatus"] = function (data) {
      if (thisObject.locationCore && thisObject.locationCore.setSensorStatus) {
        thisObject.locationCore.setSensorStatus(data);
      }
    };
    proto["sendBeaconsData"] = function (beacons) {
      if (thisObject.locationCore && thisObject.locationCore.sendBeaconsData) {
        thisObject.locationCore.sendBeaconsData(beacons);
      }
    };
    proto["sendGPSData"] = function (gpsData) {
      if (thisObject.locationCore && thisObject.locationCore.sendGPSData) {
        thisObject.locationCore.sendGPSData(gpsData);
      }
    };
    proto["sendHeadingData"] = function (heading) {
      if (thisObject.locationCore && thisObject.locationCore.sendHeadingData) {
        thisObject.locationCore.sendHeadingData(heading);
      }
    };
    proto["sendStep"] = function (step) {
      if (thisObject.locationCore && thisObject.locationCore.sendStep) {
        thisObject.locationCore.sendStep(step);
      }
    };
    proto["setStepH"] = function (h) {
      if (thisObject.locationCore && thisObject.locationCore.setStepH) {
        thisObject.locationCore.setStepH(h);
      }
    };
    proto["setLocStepH"] = function (h) {
      if (thisObject.locationCore && thisObject.locationCore.setLocStepH) {
        thisObject.locationCore.setLocStepH(h);
      }
    };
    proto["setStepHAOA"] = function (h) {
      if (thisObject.locationCore && thisObject.locationCore.setStepHAOA) {
        thisObject.locationCore.setStepHAOA(h);
      }
    };
    proto["setLocStepHAOA"] = function (h) {
      if (thisObject.locationCore && thisObject.locationCore.setLocStepHAOA) {
        thisObject.locationCore.setLocStepHAOA(h);
      }
    };
    proto["setStrictLocArea"] = function (h) {
      if (thisObject.locationCore && thisObject.locationCore.setStrictLocArea) {
        thisObject.locationCore.setStrictLocArea(h);
      }
    };
    proto["sendAOAResult"] = function (data) {
      if (thisObject.locationCore && thisObject.locationCore.sendAOAResult) {
        thisObject.locationCore.sendAOAResult(data);
      }
    };
    proto["send5GResult"] = function (data) {
      if (thisObject.locationCore && thisObject.locationCore.send5GResult) {
        thisObject.locationCore.send5GResult(data);
      }
    };
    proto["setGeofenceData"] = function (data) {
      if (thisObject.locationCore && thisObject.locationCore.setGeofenceData) {
        thisObject.locationCore.setGeofenceData(data);
      }
    };

    init(thisObject);

    // proto["init"] = proto._init;
    proto["shareToFriend"] = proto._shareToFriend;
    proto["navigateToGetWXUser"] = proto._navigateToGetWXUser;
    proto["Relocation"] = proto._Relocation;
    proto["getLocationState"] = proto._getLocationState;
    proto["getMyPositionInfo"] = proto._getMyPositionInfo;
    proto["postLocationResult"] = proto._postLocationResult;
    proto["startMatchRoute"] = proto._startMatchRoute;
    proto["setBuildingsData"] = proto._setBuildingsData;
    proto["getCurrentBeaconData"] = function (successCB, failedCB) {
      if (thisObject.locationCore && thisObject.locationCore.getCurrentBeaconData) {
        return thisObject.locationCore.getCurrentBeaconData(successCB, failedCB);
      }
      return null;
    };
    proto["stopMatchRoute"] = proto._stopMatchRoute;
    proto["startSendLog"] = proto._startSendLog;
    proto["stopSendLog"] = proto._stopSendLog;
    proto["setCollectPoint"] = proto._setCollectPoint;
    proto["clearCollectPoint"] = proto._clearCollectPoint;
    proto["changeBuilding"] = proto._changeBuilding;
    proto["register5GPhoneNumber"] = function (phoneNumber, successCB, failedCB) {
      if (thisObject.locationCore && thisObject.locationCore.register5GPhoneNumber) {
        thisObject.locationCore.register5GPhoneNumber(phoneNumber, successCB, failedCB);
      }
    };
    proto["register5GPhoneNumber"] = function (phoneNumber, successCB, failedCB) {
      if (thisObject.locationCore && thisObject.locationCore.register5GPhoneNumber) {
        thisObject.locationCore.register5GPhoneNumber(phoneNumber, successCB, failedCB);
      }
    };
    proto["unregister5GPhoneNumber"] = function (successCB, failedCB) {
      if (thisObject.locationCore && thisObject.locationCore.register5GPhoneNumber) {
        thisObject.locationCore.unregister5GPhoneNumber(successCB, failedCB);
      }
    };
    proto["get5GState"] = function () {
      if (thisObject.locationCore && thisObject.locationCore.get5GState) {
        return thisObject.locationCore.get5GState();
      }
    };
    proto["updateLocation"] = function (loc) {
      if (thisObject.locationCore && thisObject.locationCore.updateLocation) {
        return thisObject.locationCore.updateLocation(loc);
      }
    };

    proto["on"] = proto._on;
    proto["once"] = proto._once;
    proto["off"] = proto._off;
    proto["fire"] = proto._fire;
  };

  daximap["LocationManager"] = DXLocationManager;
  let initSDKAPI = function (options) {
    let thisObject = this;
    options = options || {};
    thisObject.token = options["token"] || "";
    let envType = options["envType"] || (window["cordova"] ? "native" : "web");
    if (window["wx"] && window["wx"]["miniProgram"]) {
      envType = "wechat";
    } else if (window["my"]) {
      envType = "alipay";
    }
    if (envType === "native") {
      return new NativeLocation();
    } else if (envType === "wechat") {
      return new WXLocation();
    } else if (envType === "alipay") {
      return new AliLocation();
    } else {
      return null;
    }
  };

  daximap["initSDKAPI"] = initSDKAPI;

// ES6 模块导出
