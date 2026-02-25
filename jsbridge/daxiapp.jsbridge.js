(function (global) {
  var daxiapp = (global["DaxiApp"] = global["DaxiApp"] || {});

  var EventHandler = function (eventId) {
    var __handlerList = new Array();
    __handlerList.remove = function (index) {
      if (isNaN(index) || index > this.length) {
        return false;
      }
      this.splice(index, 1);
    };
    __handlerList.clear = function () {
      for (var i = 0; i < __handlerList.length; i++) {
        if (__handlerList[i].f) {
          __handlerList.remove(i);
        }
      }
    };
    __eventId = eventId;

    this._addEventHandler = function (callbackListener) {
      for (var i = 0; i < __handlerList.length; i++) {
        if (__handlerList[i].f == callbackListener) {
          return;
        }
      }
      __handlerList.push({ o: null, f: callbackListener });
    };

    this._removeEventHandler = function (callbackListener) {
      for (var i = 0; i < __handlerList.length; i++) {
        if (__handlerList[i].f == callbackListener) {
          __handlerList.remove(i);
        }
      }
    };

    this._clearEventHandler = function () {
      __handlerList.clear();
    };

    this._notifyEvent = function (sender, pVal) {
      for (var i = 0; i < __handlerList.length; i++) {
        // __handlerList[i].f( sender, pVal );
        __handlerList[i].f(pVal);
      }
    };

    this["addEventHandler"] = function (callbackListener) {
      this._addEventHandler(callbackListener);
    };

    this["removeEventHandler"] = function (callbackListener) {
      this._removeEventHandler(callbackListener);
    };

    this["clearEventHandler"] = function () {
      this._clearEventHandler();
    };
    this["notifyEvent"] = function (sender, pVal) {
      this._notifyEvent(sender, pVal);
    };
  };
  var __global = global || window;
  var PageManager = (function () {
    function PageManager(name) {
      this.name = name;
      this.pageStack = [];
    }
    PageManager.prototype.pushPage = function (pageCommand) {
      for (var i = 0, len = this.pageStack.length; i < len; i++) {
        if (this.pageStack[i]["method"] == pageCommand["method"]) {
          this.pageStack.splice(i, len - i);
          break;
        }
      }
      this.pageStack.push(pageCommand);
      return true;
    };
    PageManager.prototype.updateStack = function (pageCommand) {
      for (var i = 0, len = this.pageStack.length; i < len; i++) {
        if (this.pageStack[i]["page"] == pageCommand["page"]) {
          this.pageStack.splice(i);
          break;
        }
      }
      this.pageStack.push(pageCommand);
      return true;
    };
    PageManager.prototype.popPage = function () {
      if (this.pageStack.length >= 0) {
        return this.pageStack.pop();
      }
      return;
    };
    PageManager.prototype.getCount = function () {
      return this.pageStack.length;
    };
    PageManager.prototype.getTopPage = function () {
      var len = this.pageStack.length;
      if (len > 0) {
        return this.pageStack[len - 1];
      } else {
        return null;
      }
    };
    PageManager.prototype.clearPageStack = function () {
      this.pageStack = [];
    };
    PageManager.prototype.popPageToTop = function (argument) {
      // body...
      var topPage = this.pageStack[0];
      this.pageStack = [topPage];
      return topPage;
    };
    PageManager.prototype.getViewState = function (pageState) {
      for (var i = this.pageStack.length - 1; i >= 0; i--) {
        var pageInfo = this.pageStack[i];
        switch (pageState) {
          case "MapStatePoi":
            if (pageInfo["method"] == "showPois" || pageInfo["method"] == "showPoiDetail") {
              return pageInfo;
            }

            break;
          default:
        }
      }
      return;
    };
    return PageManager;
  })();
  var DXNativeDownloader = (function () {
    var DXNativeDownloader = function (jsBridge) {
      this.jsBridge = jsBridge;
    };

    var proto = DXNativeDownloader.prototype;
    proto.getData = function (url, method, dataType, data, successCB, errorCB, func) {
      var dxUtil = daxiapp["utils"];
      dxUtil.getData(url, data, dataType, successCB, errorCB);
    };

    proto.getPackageData = function (url, method, dataType, data, successCB, errorCB, func) {
      var dxUtil = daxiapp["utils"];
      this.jsBridge.downloadPackage(data.token, data.bdid, function (e) {
        dxUtil.getData(url, {}, dataType, successCB, errorCB);
      });
    };
    proto.getData2 = function (url, method, dataType, data, successCB, errorCB, func) {
      if (window["command"] && window["command"]["platform"].indexOf("android") != -1) {
        var dxUtil = daxiapp["utils"];
        dxUtil.getDataBySecurityRequest(url, method, data, successCB, errorCB, dataType);
      } else {
        this.jsBridge.getDataByNative(
          url,
          method,
          "application/json",
          data,
          function (resdata) {
            if (resdata && resdata["result"]) {
              var resultStr = resdata["result"];
              var _index = resultStr.indexOf("&&");
              if (_index != -1) {
                resultStr = resultStr.slice(resultStr.indexOf("(") + 1, -1);
              }
              var result = JSON.parse(resultStr);
              result && (result["reqparams"] = data);
              successCB(result);
            } else {
              errorCB(resdata);
            }
          },
          errorCB
        );
      }
    };
    proto.getServiceData = function (url, method, dataType, data, successCB, errorCB, func) {
      if ((window["command"] && window["command"]["platform"].indexOf("android") != -1) || window.location.href.indexOf("platform=android") != -1) {
        var dxUtil = daxiapp["utils"];
        dxUtil.getDataBySecurityRequest(url, method, data, successCB, errorCB, dataType);
      } else {
        this.jsBridge.getDataByNative(
          url,
          method,
          "application/json",
          data,
          function (resdata) {
            if (resdata && resdata["result"]) {
              var resultStr = resdata["result"];
              var _index = resultStr.indexOf("&&");
              if (_index != -1) {
                resultStr = resultStr.slice(resultStr.indexOf("(") + 1, -1);
              }
              var result = JSON.parse(resultStr);
              result && (result["reqparams"] = data);
              successCB(result);
            } else {
              errorCB(resdata);
            }
          },
          errorCB
        );
      }
    };
    return DXNativeDownloader;
  })();
  var DXJSBridge = (function () {
    function extend(target) {
      var args = arguments;
      if (args.length > 0) {
        var len = args.length;
        if (typeof args[0] == "object") {
          for (var i = 1; i < len; i++) {
            if (typeof args[i] != "object") {
              continue;
            }
            for (var key in args[i]) {
              target[key] = args[i][key];
            }
          }
        } else {
          return target;
        }
      } else {
        return null;
      }
      return target;
    }

    function isSame(param1, param2) {
      var paramType1 = typeof param1,
        paramType2 = typeof param2;
      if (paramType1 == typeof paramType2) {
        if (paramType1 != "object" && param1 == param2) {
          return true;
        } else {
          var keys1 = Object.keys(param1),
            keys2 = Object.keys(param2);
          if (keys1.length == keys2.length) {
            for (var i = keys1.length; i > 0; i--) {
              if (param1[keys1[i]] != param1[keys1[i]]) {
                return false;
              }
            }
            return true;
          } else {
            return false;
          }
        }
      }
      return false;
    }

    function invokeNativeMethod(successCallback, failureCallback, funcName, params) {
      var jsonString = "";
      var _timeStamp = new Date().getTime();
      if (currentOperation.method == funcName) {
        if (currentOperation.timeStamp && _timeStamp - currentOperation.timeStamp < 300) {
          return;
        }
        if (!currentOperation.finished && isSame(params, currentOperation.params)) {
          return;
        }
      }

      currentOperation.timeStamp = _timeStamp;
      currentOperation.method = funcName;
      if (funcName == "reversalStartEndPoint") {
        currentOperation.method = "setStartEndPoint";
      }
      currentOperation.params = params;

      if (params !== undefined) {
        jsonString = JSON.stringify(params);
      }
      jsonString = encodeURIComponent(jsonString);
      cordova.exec(successCallback, failureCallback, "DXJSBridge", "postMessage", [funcName, jsonString]);
    }

    function invokeNativeCallback(successCallback, failureCallback, callbackFuncName, callbackParams) {
      if (callbackParams !== undefined) {
        jsonString = JSON.stringify(callbackParams);
      }
      jsonString = encodeURIComponent(jsonString);
      cordova.exec(successCallback, failureCallback, "DXJSBridge", "invokeCallback", [callbackFuncName, jsonString]);
    }

    var currentOperation = {};
    var DXJSBridge = function () {
      this.pageManager = new PageManager("DXJSBridge");
      this.eventGoBack = new EventHandler("GoBackEvent");
      this.navLocalStorage = {
        getLocalStorageData: function (successCallBack, errorCallBack) {
          var params = { method: "getLocalStorageData", data: {} };
          invokeNativeCallback(successCallBack, errorCallBack, "notifyMessage", { data: JSON.stringify(params) });
        },
        setValue: function (key, value) {
          var params = { method: "addLocStorageData", data: { key: key, value: value } };
          this.data["key"] = value;
          invokeNativeMethod(successCallBack, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
        },
        removeValue: function (key) {
          delete this.data[key];
          var params = { method: "removeLocStorageData", data: { key: key } };
          invokeNativeMethod(successCallBack, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
        },
        getValue: function (key, value) {
          return this._data[key];
        },
      };
    };

    DXJSBridge.prototype.watchBLEScan = function (successCB, failureCB) {
      cordova.exec(successCB, failureCB, "IndoorLocation", "watchBLEScan", []);
    };

    DXJSBridge.prototype.getRequestParam = function (url) {
      if (!url || url.indexOf("?") == -1) {
        return null;
      }
      var param = {};
      var searchString = url.split("?")[1];
      var tempArr = searchString.split("&");
      tempArr.forEach(function (item) {
        var kv = item.split("=");
        if (kv.length > 1) {
          param[kv[0]] = kv[1];
        } else {
          param[kv[0]] = "";
        }
      });
      return param;
    };

    DXJSBridge.prototype.getDataByXHR = function (url, params, method, dataType, successCallback, failureCallback) {
      // body...
      method = method.toUpperCase();
      var httpRequest = new XMLHttpRequest();
      if (dataType) {
        httpRequest["responseType"] = dataType;
      }
      httpRequest.onreadystatechange = function (event) {
        if (httpRequest["readyState"] == 4) {
          if (httpRequest["status"] == 200 || httpRequest["status"] == 304) {
            var result;
            var resDataType = httpRequest["dataType"];
            switch (resDataType) {
              case "blob":
              case "arraybuffer":

              case "json":
              case "text":
              case "":
                result = httpRequest["response"];
                break;
              case "document":
                result = httpRequest["responseXML"];
              default:
                result = httpRequest["response"];
            }
            successCallback && successCallback(result);
          } else {
            var error = {};
            error["status"] = httpRequest["status"];
            error["statusText"] = httpRequest["statusText"];
            error["resText"] = httpRequest["response"];
            if (failureCallback) {
              failureCallback(error);
            }
          }
        }
      };
      if (method == "GET") {
        if (typeof params == "object") {
          for (var key in params) {
            url.indexOf("?") == -1 ? (url += "&" + key + "=" + params[key]) : (url += "?" + key + "=" + params[key]);
          }
        }
        params = null;
      }
      httpRequest["open"](method, url, true);

      httpRequest.send(params);
    };

    DXJSBridge.prototype.getSignatureParams = function (method, params, onSuccess, onError) {
      if (params) {
        var paramString = JSON.stringify(params);
      } else {
        var paramString = "";
      }
      jsonString = encodeURIComponent(paramString);
      var timeStr = new Date().getTime() + "";
      cordova.exec(
        function (data) {
          data["t"] = timeStr;
          onSuccess(data);
        },
        onError,
        "DXJSBridge",
        "signatureRequest",
        [method, jsonString, timeStr]
      );
    };

    DXJSBridge.prototype.getSignature = function (method, params, onSuccess, onError, timeStr) {
      if (params) {
        var paramString = JSON.stringify(params);
      } else {
        var paramString = "";
      }
      jsonString = encodeURIComponent(paramString);

      cordova.exec(onSuccess, onError, "DXJSBridge", "signatureRequest", [method, jsonString, timeStr]);
    };

    DXJSBridge.prototype.getDataBySecurityRequest = function (url, params, method, dataType, onSuccess, error) {
      var that = this;
      var t = new Date().getTime() + "";
      method = method.toLocaleUpperCase();
      var provider = params["provider"] || "dx";
      var v = params["v"] || 1;

      function onSignatureSuc(signatureData) {
        var _url = url;
        if (_url.indexOf("?") == -1) {
          _url += "?";
        } else {
          _url += "&";
        }
        if (signatureData) {
          console.log("signatureData:", signatureData);
          _url += "signature=" + signatureData["signature"] + "&t=" + t;
        } else {
          console.log("signatureData:", signatureData);
          _url += "t=" + t;
        }
        _url += "&provider=" + provider + "&v=" + v;

        var options = {
          url: _url,
          type: method,
          dataType: dataType,
          timeout: 10000,
          success: onSuccess || function () {},
          error: error,
        };
        if (method == "POST") {
          options["contentType"] = "application/json";
          options["data"] = JSON.stringify(params);
        } else {
          options["data"] = params;
        }

        $["ajax"](options);
      }

      function onSignatureErr() {
        var error = { msg: "get signature failed" };
        error(error);
      }
      var urlParams = that.getRequestParam(url);
      if (urlParams) {
        for (var key in urlParams) {
          if (urlParams[key] == undefined) {
            delete urlParams[key];
          }
        }
      }
      if (params) {
        for (var key in params) {
          if (params[key] == undefined) {
            delete params[key];
          }
        }
      }
      if (urlParams && params) {
        extend(urlParams, params);
      } else if (params) {
        urlParams = params;
      }
      if (urlParams) {
        provider = urlParams["provider"] || "dx";
        v = urlParams["v"] || 1;
        delete urlParams["provider"];
        delete urlParams["v"];
      }
      if (params && params["provider"]) {
        delete params["provider"];
        delete params["v"];
      }
      that.getSignature(method, urlParams, onSignatureSuc, onSignatureErr, provider + t + v);
    };

    DXJSBridge.prototype.getDataByNative = function (url, method, dataType, data, onSuccess, onError) {
      var paramString = (data && JSON.stringify(data)) || "";
      cordova.exec(onSuccess, onError, "DXJSBridge", "getDataByNative", [url, method, dataType, paramString]);
    };

    DXJSBridge.prototype.downloadPackage = function (token, bdid, successCallback, failureCallback) {
      this.downloadPackageCallback = successCallback;
      invokeNativeMethod(undefined, failureCallback, "downloadPackage", { bdid: bdid, token: token });
    };

    DXJSBridge.prototype.getBuildingListDataByNative = function (onSuccess, onError) {
      cordova.exec(onSuccess, onError, "DXJSBridge", "getBuildingListDataByNative", [""]);
    };

    DXJSBridge.prototype.setChangeBuilding = function (ischanging) {
      this.changingBuilding = ischanging;
    };

    DXJSBridge.prototype.initCross = function (argument) {};

    DXJSBridge.prototype.pushStack = function (pageCommand) {
      this.mapPageStack.push(pageCommand);
    };

    DXJSBridge.prototype.onceGoBackListener = function (callback) {
      function onceFun(sender, data) {
        callback && callback(data);
        this.eventGoBack._removeEventHandler(onceFun);
      }
      this.eventGoBack._addEventHandler(onceFun);
    };

    DXJSBridge.prototype.openBuild = function (bdid, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "openBuild", { bdid: bdid });
    };

    DXJSBridge.prototype.mapInitFinished = function (bdListData, successCallback, failureCallback) {
      cordova.exec(successCallback, failureCallback, "DXJSBridge", "postMessage", ["mapInitFinished", ""]);
    };

    DXJSBridge.prototype.onIndoorBuildingLoaded = function (indoorBuildingInfo, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "onIndoorBuildingLoaded", { info: indoorBuildingInfo });
    };
    DXJSBridge.prototype.onFloorChanged = function (data, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "onFloorChanged", data);
    };

    DXJSBridge.prototype.onIndoorBuildingActive = function (bdid, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "onIndoorBuildingActive", { bdid: bdid });
    };
    DXJSBridge.prototype.getCommandQueue = function (successCallback, failureCallback) {
      function scb(ret) {
        var jsonString = decodeURIComponent(ret["commandList"]);
        var jsonObj = JSON.parse(jsonString);
        successCallback && successCallback(jsonObj);
      }
      cordova.exec(scb, failureCallback, "DXJSBridge", "getCommandQueue", []);
    };
    DXJSBridge.prototype.mapInitFailed = function (errorMsg, successCallback, failureCallback) {
      cordova.exec(successCallback, failureCallback, "DXJSBridge", "postMessage", ["mapInitFailed", errorMsg]);
    };
    DXJSBridge.prototype.pageInitFinished = function (successCallback, failureCallback) {
      setTimeout(function () {
        cordova.exec(successCallback, failureCallback, "DXJSBridge", "postMessage", ["pageInitFinished", ""]);
      }, 10);
    };

    DXJSBridge.prototype.mapPageBack = function () {};
    DXJSBridge.prototype.goBack = function (successCallback, failureCallback, params) {
      invokeNativeMethod(null, null, "goBack", { bdid: "" });
    };
    DXJSBridge.prototype.routeReviced = function (routeData, successCallback, failureCallback) {
      invokeNativeMethod(null, null, "routeReviced", { routeData: routeData });
    };
    DXJSBridge.prototype.goBackToState = function (pageState, successCallback, failureCallback) {
      invokeNativeMethod(null, null, "goBackToState", { state: pageState });
    };

    DXJSBridge.prototype.onTeminateNavigation = function (pageState, successCallback, failureCallback) {
      invokeNativeMethod(null, null, "onTeminateNavigation", { state: pageState });
    };

    DXJSBridge.prototype.onCloseNavigation = function (pageState, successCallback, failureCallback) {
      invokeNativeMethod(null, null, "onCloseNavigation", { state: pageState });
    };

    DXJSBridge.prototype.activeView = function (successCallback, failureCallback) {
      invokeNativeMethod(successCallback, null, "activeView", { bdid: "" });
    };

    DXJSBridge.prototype.comfirmedBack = function (successCallback, failureCallback) {
      var thisObject = this;
      var pageCount = thisObject.pageManager.getCount();
      if (pageCount > 1) {
        thisObject.pageManager.popPage();
        var topViewInfo = thisObject.pageManager.getTopPage();
        if (topViewInfo !== undefined) {
          thisObject.watchCallback(topViewInfo);
        }
      }
      invokeNativeCallback(null, null, "goBackCallback", { pageCount: pageCount });
    };

    DXJSBridge.prototype.innerGoBack = function (successCallback, failureCallback) {
      var thisObject = this;
      var pageCount = thisObject.pageManager.getCount();
      if (pageCount > 1) {
        thisObject.pageManager.popPage();
        var cmd = thisObject.pageManager.getTopPage();
        thisObject.watchCallback(cmd);
      }
    };
    DXJSBridge.prototype.openMapPage = function (bdid, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "openMapPage", { bdid: bdid });
    };
    DXJSBridge.prototype.showPoiDetail = function (data, successCallback, failureCallback) {
      var params = {
        page: "SelectPoiPage",
        saveStack: true,
        poiInfo: data["poiInfo"],
        poiId: data["poiId"],
        arealType: data["arealType"],
      };
      invokeNativeMethod(successCallback, failureCallback, "showPoiDetail", params);
    };

    DXJSBridge.prototype.onMarkerClick = function (markerid, successCallback, failureCallback) {
      var params = {
        markerId: markerid,
      };

      invokeNativeMethod(successCallback, failureCallback, "onMarkerClick", params);
    };

    DXJSBridge.prototype.openMainPoiPage = function (data, successCallback, failureCallback) {
      var params = {
        bdid: data["bdid"],
        arealType: data["arealType"],
      };
      invokeNativeMethod(successCallback, failureCallback, "openMainPoiPage", params);
    };
    DXJSBridge.prototype.startNavigation = function (params, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "startNavigation", params);
    };
    DXJSBridge.prototype.startSimulate = function (params, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "startSimulate", params);
    };
    DXJSBridge.prototype.takeToThere = function (poiInfo, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "takeToThere", poiInfo);
    };
    DXJSBridge.prototype.changeUserTrackingMode = function (params, successCallback, failureCallback) {
      var data = {};
      if (params["range"]) {
        data["range"] = params["range"];
      }
      invokeNativeMethod(successCallback, failureCallback, "changeUserTrackingMode", data);
    };

    DXJSBridge.prototype.onCameraChangeFinish = function (params, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "onCameraChangeFinish", params);
    };

    DXJSBridge.prototype.onScreenTouched = function (successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "onScreenTouched", {});
    };

    DXJSBridge.prototype.openSelectPointPage = function (data, successCallback, failureCallback) {
      var params = {
        page: "SelectPointMapPage",
        saveStack: false,
        pointType: data["pointType"],
        arealType: data["arealType"],
        startPosMode: data["startPosMode"] || "",
        startLon: data["startLon"],
        startLat: data["startLat"],
        startFloorId: data["startFloorId"] || "",
        startFloorName: data["startFloorName"] || "",
        startFloorCnName: data["startFloorCnName"] || "",
        startName: data["startName"],
        bdid: data["bdid"],
        startAddress: data["startAddress"] || "",

        targetPosMode: data["targetPosMode"] || "",
        targetLon: data["targetLon"],
        targetLat: data["targetLat"],
        targetFloorId: data["targetFloorId"] || "",
        targetFloorName: data["targetFloorName"] || "",
        targetFloorCnName: data["targetFloorCnName"] || "",
        targetName: data["targetName"],
        targetAddress: data["targetAddress"] || "",
      };
      invokeNativeMethod(successCallback, failureCallback, "openSelectPointPage", params);
    };

    DXJSBridge.prototype.openSearchPage = function (data, successCallback, failureCallback) {
      var params = {
        arealType: data["arealType"] || "indoor",
        keyword: data["keyword"] || "",
      };
      invokeNativeMethod(successCallback, failureCallback, "openSearchPage", params);
    };
    DXJSBridge.prototype.openVoiceSearch = function (arealType, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "openVoiceSearch", { arealType: arealType });
    };
    DXJSBridge.prototype.startListeningVoice = function (arealType, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "startListeningVoice", { arealType: arealType });
    };
    DXJSBridge.prototype.stopListeningVoice = function (arealType, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "stopListeningVoice", { arealType: arealType });
    };
    DXJSBridge.prototype.openSearchResultPage = function (data, successCallback, failureCallback) {
      var params = {
        page: "SearchResultPage",
        saveStack: true,
        keyword: data["keyword"],
        name: data["name"],
        perItemCount: data["perItemCount"],
        poi: data["poi"],
        poiIds: data["poiIds"],
        lon: data["lon"],
        lat: data["lat"],
        address: data["address"],
        sort: data["sort"],
        distance: data["distance"],
        floorId: data["floorId"],
        floorName: data["floorName"],
        floorCnName: data["floorCnName"],
        resultList: data["resultList"],
        text: data["text"] || "",
        sort: data["sort"],
        value: data["value"],
        arealType: data["arealType"],
      };
      if (!params["keyword"] && data["resultList"]) {
        params["keyword"] = data["resultList"][0]["keyword"] || data["resultList"][0]["text"];
      }
      invokeNativeMethod(successCallback, failureCallback, "showPois", params);
    };
    DXJSBridge.prototype.goSearch = function (arealType, keyword, pois, lon, lat, floorId, successCallback, failureCallbac) {
      var params = {
        arealType: arealType,
        keyword: keyword,
        pois: pois,
        lon: lon,
        lat: lat,
        floorId: floorId,
      };
      invokeNativeMethod(successCallback, failureCallback, "goSearch", params);
    };
    DXJSBridge.prototype.changeStartEndPoint = function (data, successCallback, failureCallback) {
      var params = {
        page: "ChangeStartEndPointPage",
        pointType: data["pointType"],
        arealType: data["arealType"],
        startPosMode: data["startPosMode"] || "",
        startLon: data["startLon"],
        startLat: data["startLat"],
        startFloorId: data["startFloorId"] || "",
        startFloorName: data["startFloorName"] || "",
        startFloorCnName: data["startFloorCnName"] || "",
        startName: data["startName"],
        startAddress: data["startAddress"] || "",
        targetPosMode: data["targetPosMode"] || "",
        targetLon: data["targetLon"],
        targetLat: data["targetLat"],
        targetFloorId: data["targetFloorId"] || "",
        targetFloorName: data["targetFloorName"] || "",
        targetFloorCnName: data["targetFloorCnName"] || "",
        targetName: data["targetName"],
        targetAddress: data["targetAddress"] || "",
      };
      invokeNativeMethod(successCallback, failureCallback, "changeStartEndPoint", params);
    };
    DXJSBridge.prototype.reversalStartEndPoint = function (data, successCallback, failureCallback) {
      var _timeStamp = new Date().getTime();
      invokeNativeMethod(successCallback, failureCallback, "reversalStartEndPoint");
    };

    DXJSBridge.prototype.toOutdoorMap = function (data, successCallback, failureCallback) {
      var params = {
        lon: data["lon"],
        lat: data["lat"],
        range: data["range"],
        floorId: data["floorId"],
      };
      invokeNativeMethod(successCallback, failureCallback, "toOutdoorMap", params);
    };

    DXJSBridge.prototype.finishCallback = function (callbackName, retInfo, isCancel, successCallback, failureCallback) {
      retInfo["retVal"] = isCancel ? "Cancel" : "OK";
      if (!isCancel && retInfo["arealType"] == "outdoor" && retInfo["bdid"]) {
        delete retInfo["bdid"];
      }
      console.log("invokeNativeCallback:" + callbackName);
      invokeNativeCallback(null, null, callbackName, retInfo);
    };

    DXJSBridge.prototype.sharePos = function (params, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "shareMyPos", params);
    };

    DXJSBridge.prototype.toIndoorMap = function (state, successCallback, failureCallback) {
      var params = {
        state: state,
      };
      invokeNativeMethod(successCallback, failureCallback, "toIndoorMap", params);
    };
    DXJSBridge.prototype.showPoi = function (poiID, poiLon, poiLat, flID, name, poitype, address, successCallback, failureCallback) {
      var params = {
        targetPoiID: poiID,
        targetlon: poiLon,
        targetLat: poiLat,
        targetFlID: flID,
        targetPoiName: name,
        targetPoiType: poitype,
        targetAddress: address,
      };
      invokeNativeMethod(successCallback, failureCallback, "showPoi", params);
    };
    DXJSBridge.prototype.onNavigationFinished = function (args, successCallback, failureCallback) {
      var params = {};
      invokeNativeMethod(successCallback, failureCallback, "onNavigationFinished", params);
    };
    DXJSBridge.prototype.onReNaviRoute = function (args, successCallback, failureCallback) {
      var params = {};
      invokeNativeMethod(successCallback, failureCallback, "onReNaviRoute", params);
    };
    //关闭导航界面  操作流程结束 回到 首页
    DXJSBridge.prototype.closeNavigation = function (successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "closeNavigation", {});
    };

    DXJSBridge.prototype.popWindow = function (bdid, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "popWindow", {});
    };

    DXJSBridge.prototype.openBuildList = function (bdid, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "openBuildList", { bdid: bdid });
    };
    DXJSBridge.prototype.changeBuilding = function (params, successCallback, failureCallback) {
      var params = { bdid: params["bdid"] };
      invokeNativeMethod(successCallback, failureCallback, "changeBuilding", params);
    };
    DXJSBridge.prototype.openMap = function (bdid, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "postMessage", {});
    };

    DXJSBridge.prototype.exitApp = function (bdid, successCallback, failureCallback) {
      invokeNativeMethod(successCallback, failureCallback, "exitApp", {});
    };

    DXJSBridge.prototype.postMessage = function (msg, args, successCallback, failureCallback) {
      var logCB = function (e) {
        console.log(e);
      };
      var scb = successCallback || logCB;
      var fcb = failureCallback || logCB;
      cordova.exec(scb, fcb, "DXJSBridge", "postMessage", [msg, args]);
    };

    var commandList = [];
    DXJSBridge.prototype.addMessageListener = function (watchCB, innerCheckCB) {
      var logCB = function (e) {
        console.log(e);
      };
      var thisObject = this;
      thisObject.watchCallback = watchCB;

      function dealCommand(cmd) {
        if (currentOperation.method == cmd["method"]) {
          currentOperation.finished = true;
        }
        if (cmd["method"] == "goBack") {
          var result = watchCB(cmd);
          if (result && result["pageCount"]) {
            invokeNativeCallback(null, null, "goBackCallback", { pageCount: result["pageCount"] });
          }
          return;
        } else if (cmd["method"] == "onPackageDownloaded") {
          console.log("onPackageDownloaded");
          thisObject.downloadPackageCallback && thisObject.downloadPackageCallback();
        } else {
          watchCB(cmd);
        }
      }

      cordova.exec(dealCommand, null, "DXJSBridge", "addMessageListener", []);
    };

    DXJSBridge.prototype.addGoBackMessageListener = function (watchCB) {
      function realRunCommand(cmd) {
        if (cmd["method"] == "goBack") {
          watchCB(cmd);
        }
      }
      cordova.exec(realRunCommand, null, "DXJSBridge", "addMessageListener", []);
    };
    DXJSBridge.prototype.realGoBack = function (successCallback, failureCallback, args, isSwitchTab) {
      var params = { realGoBack: true };
      if (args["pageCount"]) {
        params["pageCount"] = args["pageCount"];
      }
      if (args["popPageCount"]) {
        params["popPageCount"] = args["popPageCount"];
      }
      invokeNativeMethod(successCallback, failureCallback, "realGoBackCallback", params, isSwitchTab);
    };

    DXJSBridge.prototype.openVoice = function (successCallback, failureCallback) {
      cordova.exec(null, null, "DXJSBridge", "postMessage", ["openVoice"]);
    };
    DXJSBridge.prototype.getNaviConfig = function (successCallback, failureCallback) {
      cordova.exec(successCallback, failureCallback, "DXJSBridge", "postMessage", ["getNaviConfig"]);
    };

    DXJSBridge.prototype.pushStackTop = function (data) {
      var viewPageInfo = {};
      viewPageInfo["saveStack"] = true;
      for (var key in data) {
        var val = data[key];
        if (val == undefined) continue;
        if (val.indexOf("%") != -1) {
          val = decodeURIComponent(val);
        }
        viewPageInfo[key] = val;
      }
      var pageViewInfo = this.pageManager.getTopPage();
      if (!pageViewInfo) {
        this.pageManager.pushPage(viewPageInfo);
      }
    };
    DXJSBridge.prototype.pageStackPopToTop = function () {
      this.goBack();
    };
    DXJSBridge.prototype.loadPano = function (successCallback, failureCallback, data) {
      var params = {
        id: data["id"],
        panoServer: data["panoServer"],
        floorId: data["floorId"],
      };
      invokeNativeCallback(successCallback, failureCallback, "loadPano", params);
    };
    //听展览
    DXJSBridge.prototype.openExhibitionPage = function (data, successCallBack, failureCallback) {
      var params = { method: "openExhibitionPage", data: data || {} };

      invokeNativeMethod(successCallBack, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
    };
    // 展品详情
    DXJSBridge.prototype.openExhibitDetail = function (data, successCallback, failureCallback) {
      // @id  展品id
      // @forwardPage 从哪儿进入 此处固定传参"展厅导览详情页"
      // @forwardPageDetails 从那个模块进入 此处固定传参"大希地图"
      // @mapType  地图类型 此处固定传参"daxiLocation"
      var _data = {
        id: data["exhibitId"] || data["id"],
        forwardPage: decodeURIComponent(data["forwardPage"] || "展厅导览详情页"),
        forwardPageDetails: decodeURIComponent(data["forwardPageDetails"] || "大希地图"),
        mapType: data["mapType"] || "daxiLocation",
      };
      var params = { method: "openExhibitDetail", data: _data };
      invokeNativeMethod(successCallback, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
    };
    //展览详情
    DXJSBridge.prototype.openExhibitionDetail = function (data, successCallback, failureCallback) {
      // @id  展品id
      // @forwardPage  从哪进入 此处固定传参"导览页"
      // @forwardPageDetails 从那个模块进入 此处固定传参"展览"
      // @mapType  地图类型 此处固定传参"daxiLocation"
      var _data = {
        id: data["exhibitId"] || data["id"],
        forwardPage: decodeURIComponent(data["forwardPage"] || "导览页"),
        forwardPageDetails: decodeURIComponent(data["forwardPageDetails"] || "展览"),
        mapType: data["mapType"] || "daxiLocation",
      };
      var params = { method: "openExhibitDetail", data: _data };
      invokeNativeMethod(successCallback, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
    };
    DXJSBridge.prototype.openExtraPoiDetail = function (data, successCallback, failureCallback) {
      var params = { method: "openExtraPoiDetail", data: data };
      invokeNativeMethod(successCallback, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
    };
    DXJSBridge.prototype.openLocation = function (params, successCallback, failureCallback) {
      var params = { method: "openLocation", data: params };
      invokeNativeMethod(successCallback, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
    };
    DXJSBridge.prototype.gotoARPage = function (params, successCallback, failureCallback) {
      var params = { method: "openARPage", data: params };
      invokeNativeMethod(successCallback, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
    };
    return DXJSBridge;
  })();
  var WXMiniProgramJSBridge = (function () {
    var thisObject = {};
    thisObject.navigateToPage = function () {};
    thisObject.openExtraPoiDetail = function (params, a, d) {
      params.forwardPage =
        "Exhibition" == params.type
          ? "\u5c55\u5385\u5bfc\u89c8\u8be6\u60c5\u9875"
          : "Exhibit" == params.type
          ? "\u5c55\u54c1\u5bfc\u89c8\u8be6\u60c5\u9875"
          : "\u5c55\u5385\u5bfc\u89c8\u8be6\u60c5\u9875";
      var url =
        params.detailUrl +
        "?id=" +
        params.id +
        "&forwardPage=" +
        decodeURIComponent(params.forwardPage) +
        "&forwardPageDetails=" +
        decodeURIComponent(params.forwardPageDetails || "\u5927\u5e0c\u5730\u56fe") +
        "&mapType=" +
        (params.mapType || "daxiLocation");
      try {
        wx.miniProgram &&
          wx.miniProgram.navigateTo({
            url: url,
            success: function (a) {
              a.eventChannel &&
                a.eventChannel.emit("acceptDataFromOpenerPage", {
                  data: "test",
                });
            },
          });
      } catch (e) {
        alert("openExhibitDetail:" + e.toString());
      }
    };
    // 展品详情
    thisObject.openExhibitDetail = function (data, successCallback, failureCallback) {
      // @id  展品id
      // @forwardPage 从哪儿进入 此处固定传参"展厅导览详情页"
      // @forwardPageDetails 从那个模块进入 此处固定传参"大希地图"
      // @mapType  地图类型 此处固定传参"daxiLocation"
      var url =
        "/pages/exhibit/detail/index?id=" +
        (data["exhibitId"] || data["id"]) +
        "&forwardPage=" +
        decodeURIComponent(data["forwardPage"] || "展厅导览详情页") +
        "&forwardPageDetails=" +
        decodeURIComponent(data["forwardPageDetails"] || "大希地图") +
        "&mapType=" +
        (data["mapType"] || "daxiLocation");
      try {
        // 微信小程序
        wx["miniProgram"] &&
          wx["miniProgram"]["navigateTo"]({
            url: url,
            success: function (res) {
              // 通过eventChannel向被打开页面传送数据
              res.eventChannel && res.eventChannel.emit("acceptDataFromOpenerPage", { data: "test" });
            },
          });
      } catch (e) {
        alert("openExhibitDetail:" + e.toString());
      }
    };
    //展览详情
    thisObject.openExhibitionDetail = function (data, successCallback, failureCallback) {
      // @id  展品id
      // @forwardPage 从哪儿进入 此处固定传参"展厅导览详情页"
      // @forwardPageDetails 从那个模块进入 此处固定传参"大希地图"
      // @mapType  地图类型 此处固定传参"daxiLocation"
      var url =
        "/pages/exhibit/exhibit?id=" +
        (data["exhibitId"] || data["id"]) +
        "&forwardPage=" +
        decodeURIComponent(data["forwardPage"] || "导览页") +
        "&forwardPageDetails=" +
        decodeURIComponent(data["forwardPageDetails"] || "展览") +
        "&mapType=" +
        (data["mapType"] || "daxiLocation");
      try {
        // 微信小程序
        wx["miniProgram"] &&
          wx["miniProgram"]["navigateTo"]({
            url: url,
            success: function (res) {
              // 通过eventChannel向被打开页面传送数据
              res.eventChannel && res.eventChannel.emit("acceptDataFromOpenerPage", { data: "test" });
            },
          });
      } catch (e) {
        alert("openExhibitionDetail:" + e.toString());
      }
    };
    thisObject.shareToFriend = function (params, successCB, failureCB) {
      var url = "../share/showShare?";
      var str = "";
      for (var key in params) {
        str.length > 0 ? (str += "&") : (str += "");
        str += key + "=" + params[key];
      }
      url += str;
      try {
        // 微信小程序

        wx["miniProgram"] &&
          wx["miniProgram"]["navigateTo"]({
            url: url,
            success: function (res) {
              // 通过eventChannel向被打开页面传送数据
              res.eventChannel && res.eventChannel.emit("acceptDataFromOpenerPage", { data: "test" });
            },
          });
      } catch (e) {
        alert("shareToFriend:" + e.toString());
      }
    };
    thisObject.chooseImage = function (params, successCB, failureCB) {
      try {
        // 微信小程序
        wx &&
          wx["chooseImage"]({
            count: 1, // 默认9
            sizeType: ["compressed"],
            success: function (data) {
              var localId = data["localIds"][0];
              wx["getLocalImgData"]({
                localId: localId, // 图片的localID
                success: function (res) {
                  var localData = res.localData; // localData是图片的base64数据，可以用img标签显示
                  successCB && successCB(localData);
                },
              });
            },
          });
      } catch (e) {}
    };
    thisObject.toUserPage = function (params) {
      var url = params["url"] || "/pages/user/nickname/nickname";

      try {
        // 微信小程序
        wx["miniProgram"] &&
          wx["miniProgram"]["navigateTo"]({
            url: url,
            success: function (res) {},
          });
      } catch (e) {
        console.log("openExhibitionDetail:" + e.toString());
      }
    };
    thisObject.inviteFriendToGroup = function (params, successCB, failureCB) {
      var url = "../../subpage/invite/invite?";
      var str = "";
      for (var key in params) {
        str.length > 0 ? (str += "&") : "";
        str += key + "=" + params[key];
      }
      url += str;
      try {
        // 微信小程序
        wx["miniProgram"] &&
          wx["miniProgram"]["navigateTo"]({
            url: url,
            success: function (res) {
              // 通过eventChannel向被打开页面传送数据
              res.eventChannel && res.eventChannel.emit("acceptDataFromOpenerPage", { data: "test" });
            },
          });
      } catch (e) {
        // alert("shareToFriend:"+e.toString())
      }
    };
    thisObject.openExhibitionPage = function (params) {
      //guobo 听展览页面
      var url = "/pages/explanation/index";
      try {
        // 微信小程序
        wx["miniProgram"] &&
          wx["miniProgram"]["navigateTo"]({
            url: url,
            success: function (res) {},
          });
      } catch (e) {
        alert("openExhibitionDetail:" + e.toString());
      }
    };
    thisObject.openOutdoorRoutePage = function (params) {
      //guobo 听展览页面
      var url = "/pages/route/route";
      for (var key in params) {
        if (key && params[key] != undefined) {
          url.indexOf("?") == -1 ? (url += "?" + key + "=" + params[key]) : (url += "&" + key + "=" + params[key]);
        }
      }
      try {
        // 微信小程序
        wx["miniProgram"] &&
          wx["miniProgram"]["navigateTo"]({
            url: url,
            success: function (res) {},
          });
      } catch (e) {
        alert("openExhibitionDetail:" + e.toString());
      }
    };
    thisObject.gotoARPage = function (params, successCallback, failureCallback) {
      var url = params["url"];
      if (params["name"]) {
        url += "?name=" + params["name"];
      }
      if (params["code"]) {
        url += "&barcode=" + params["code"];
      }
      if (params["id"] || params["poiId"]) {
        url += "&tiktokid=" + (params["id"] || params["poiId"]);
      }
      url += "&method=openAR";
      try {
        // 微信小程序
        wx["miniProgram"] &&
          wx["miniProgram"]["navigateTo"]({
            url: url,
            success: function (res) {},
          });
      } catch (e) {
        alert("gotoARPage:" + e.toString());
      }
    };
    thisObject.goBack = function (url, switchTap) {
      try {
        if (wx["miniProgram"]) {
          if (switchTap) {
            wx["miniProgram"] &&
              wx["miniProgram"]["switchTab"]({
                url: url || "/pages/index/index",
                success: function (res) {
                  console.log(res);
                },
              });
          } else {
            wx["miniProgram"] &&
              wx["miniProgram"]["navigateTo"]({
                url: url || "/pages/index/index",
                success: function (res) {
                  console.log(res);
                },
              });
          }
        }
      } catch (e) {
        console.log("goBack history.length", e);
      }
    };
    return thisObject;
  })();
  var AliMiniProgramJSBridge = (function () {
    var thisObject = {};
    thisObject.navigateToPage = function () {};

    thisObject.shareToFriend = function (params, successCB, failureCB) {
      if (window["my"]) {
        window["my"]["postMessage"] &&
          window["my"]["postMessage"]({ method: "showShare", data: { searchStr: str, title: "位置分享  " + (params["name"] || params["text"] || "") } });
      }
    };
    thisObject.chooseImage = function (params, successCB, failureCB) {
      try {
        // 支付宝小程序
        if (ap) {
          ap &&
            ap["chooseImage"](
              {
                count: 1, // 默认9
                sizeType: ["compressed"],
              },
              function (res) {
                successCB && successCB(res.apFilePaths[0]);
              }
            );
        } else {
          //支付宝h5 环境
          AlipayJSBridge &&
            AlipayJSBridge.call(
              "chooseImage",
              {
                sourceType: ["camera", "album"],
                count: 1, // 默认9
              },
              function (res) {
                successCB && successCB(res.apFilePaths[0]);
              }
            );
        }
      } catch (e) {}
    };
    thisObject.openOutdoorRoutePage = function (params) {
      try {
        // 微信小程序
        window["my"] &&
          window["my"]["postMessage"]({
            method: "navigateToAmapNavi",
            params: params,
          });
      } catch (e) {
        alert("openExhibitionDetail:" + e.toString());
      }
    };
    return thisObject;
  })();
  var WebJSBridge = (function () {
    function extend(target) {
      var args = arguments;
      if (args.length > 0) {
        var len = args.length;
        if (typeof args[0] == "object") {
          for (var i = 1; i < len; i++) {
            if (typeof args[i] != "object") {
              continue;
            }
            for (var key in args[i]) {
              target[key] = args[i][key];
            }
          }
        } else {
          return target;
        }
      } else {
        return null;
      }
      return target;
    }
    //非native jsbridge
    var WebJSBridge = function () {
      this.pageManager = new PageManager("WebJSBridge");
      this.routeInfo = { startPos: {}, endPos: {} };
      this.invokeWebMethod = new EventHandler("invokeWebMethod");
      var thisObject = this;
      this.getBrowser(function () {
        if (thisObject.browserType == "WEIXIN" || thisObject.browserType == "miniProgram") {
          thisObject.envAppCore = WXMiniProgramJSBridge;
        }
        if (thisObject.browserType == "ALIPAY") {
          thisObject.envAppCore = AliMiniProgramJSBridge;
        }
      });
    };
    WebJSBridge.prototype.realGoBack = function (successCallBack, failureCallback, params, isSwitchTab) {
      if (this.envAppCore && this.envAppCore.goBack) {
        this.envAppCore.goBack(params, isSwitchTab);
      }
    };
    WebJSBridge.prototype.getBrowser = function (callback) {
      var thisObject = this;
      var ua = window.navigator.userAgent.toLowerCase();
      if (/micromessenger/.test(ua)) {
        if (window["wx"] && wx.miniProgram) {
          wx.miniProgram.getEnv(function (res) {
            if (res.miniprogram) {
              //在小程序中
              thisObject.browserType = "miniProgram";
              callback && callback();
              return "miniProgram";
            } else {
              //在微信中
              thisObject.browserType = "WEIXIN";
              callback && callback();
              return "WEIXIN";
            }
          });
        } else {
          thisObject.browserType = "commonBrowser";
          callback && callback();
          return;
        }

        // return "WEIXIN";
      } else if (/alipayclient/.test(ua)) {
        thisObject.browserType = "ALIPAY";
        callback && callback();
        return "ALIPAY";
      } else {
        thisObject.browserType = "commonBrowser";
        callback && callback();
        // return "other";
      }
    };
    WebJSBridge.prototype.setChangeBuilding = function (ischanging) {
      this.changingBuilding = ischanging;
    };

    WebJSBridge.prototype.windowBack = function (params, baseUrl, isMapPage, token) {
      // WEIXIN
      if (this.browserType == "commonBrowser") {
        if (params) {
          var url = window.location.origin + window.location.pathname.replace("stationList.html", "map.html");
          url += "?";
          for (var key in params) {
            url += key + "=" + params[key] + "&";
          }
          window.location.replace(url);
        } else {
          window.history.back();
        }
      }
      if (this.browserType == "miniProgram") {
      }
      if (this.browserType == "WEIXIN") {
        if (params) {
          this.currentBdid = params["bdid"];
          this.token = params["token"];
        }
        if (!this.currentBdid) {
          var _search = location.search;
          if (_search) {
            _search = _search.slice(0);
            var _params = _search.split("&");
            var res = {};
            res.forEach(function (str) {
              var _item = str.split("=");
              if (_item.length > 1) {
                res[_item[0]] = _item[1];
              }
            });
            this.currentBdid = res["bdid"];
            this.token = res["token"] || this.token;
          }
        }
        var _url =
          "https://map1a.daxicn.com/wxtest/indoormap_new2?bdid=" +
          this.currentBdid +
          "&view=MapPage&page=MapPage&singlePage=false&token=" +
          (this.token || window["launcher"].getParamValue("token"));
        window.location.replace(_url);
      }
    };
    WebJSBridge.prototype.windowOpen = function (baseUrl, params, isMapPage, token) {
      this.currentBdid = params["bdid"];
      var _url = baseUrl;
      if (this.browserType == "WEIXIN" && isMapPage) {
        _url = "https://map1a.daxicn.com/wxtest/indoormap_new2?token=" + (token || window["launcher"].getParamValue("token"));
      }
      if (params) {
        for (var key in params) {
          var val = params[key];

          if (_url.indexOf("?") == -1) {
            _url += "?";
          } else {
            if (_url.indexOf("?") != _url.length - 1) {
              _url += "&";
            }
          }
          _url = _url + key + "=" + val;
        }
        _url += "&t=" + new Date().getTime();
      }
      // WEIXIN
      if (this.browserType == "commonBrowser") {
        window.location.replace(_url);
      }
      if (this.browserType == "miniProgram") {
      }
      if (this.browserType == "WEIXIN") {
        window.location.replace(_url);
      }
    };

    WebJSBridge.prototype.initCross = function (targetDomain, ifw) {
      var cross = new Cross(window, targetDomain, ifw);
      this.cross = cross;
      return cross;
    };
    WebJSBridge.prototype.loadPano = function (data, successCallback, failureCallback) {
      this.cross["call"]("loadPano", data);
    };
    WebJSBridge.prototype.getCommandQueue = function (successCallback, failureCallback) {
      // todo
    };
    WebJSBridge.prototype.mapInitFinished = function () {};
    // mapInitFailed
    WebJSBridge.prototype.mapInitFailed = function (errorMsg, successCallback, failureCallback) {
      alert(errorMsg["msg"]);
    };
    WebJSBridge.prototype.pageInitFinished = function (successCallback, failureCallback) {
      console.log("pageInitFinished");
    };
    WebJSBridge.prototype.finishCallback = function (callbackName, retInfo, isCancel, successCallback, failureCallback) {};
    WebJSBridge.prototype.setRouteInfo = function (options) {};

    WebJSBridge.prototype.openBuild = function (bdid, successCallback, failureCallback) {
      var str = window.location.origin;
      var pathname = window.location.pathname;
      pathname = pathname.replace("map/index.html", "building_selector/build.html");
      pathname = pathname.replace("index.html", "building_selector/build.html");
      pathname = pathname.replace(bdid + ".html", "building_selector/build.html");
      window.location.href = str + pathname;
      this.pageManager.clearPageStack();
    };
    WebJSBridge.prototype.openBuildList = function (bdid, successCallback, failureCallback, token) {
      this.windowOpen("./stationList.html", { bdid: bdid, token: token });
    };
    WebJSBridge.prototype.changeBuilding = function (params, successCallback, failureCallback) {
      var params = { bdid: params["bdid"] };

      if (this.browserType == "WEIXIN") {
        window.location.replace(_url);
      }
    };
    WebJSBridge.prototype.pushStackTop = function (data) {
      var viewPageInfo = {};
      viewPageInfo["saveStack"] = true;
      for (var key in data) {
        var val = data[key];
        if (val && val.indexOf("%") != -1) {
          val = decodeURIComponent(val);
        }
        viewPageInfo[key] = val;
      }
      viewPageInfo["method"] = viewPageInfo["method"] || "initPage";
      viewPageInfo["view"] = viewPageInfo["view"] || viewPageInfo["page"] || "MapPage";
      var pageViewInfo = this.pageManager.getTopPage();
      if (!pageViewInfo) {
        this.pageManager.pushPage(viewPageInfo);
      }
    };
    WebJSBridge.prototype.goBack = function (successCallback, failureCallback) {
      if (this.envAppCore) {
        this.envAppCore.goBack();
      } else if (window["goBack"] && window["goBack"]["call"]) {
        //鸿蒙元服务
        window["goBack"]["call"]("goBack");
      }
    };
    WebJSBridge.prototype.gotoARPage = function (params, successCallback, failureCallback) {
      if (this.envAppCore && this.envAppCore.gotoARPage) {
        this.envAppCore.gotoARPage(params);
      }
    };
    WebJSBridge.prototype.routeReviced = function (routeData, successCallback, failureCallback) {};

    WebJSBridge.prototype.goBackToState = function (pageState, successCallback, failureCallback) {
      if (!pageState) {
        return;
      }
      var viewInfo = this.pageManager.getViewState(pageState);
      if (viewInfo) {
        this.goPage(viewInfo);
      } else {
        this.goBack();
      }
    };
    WebJSBridge.prototype.activeView = function (successCallback, failureCallback) {
      successCallback && successCallback();
    };
    WebJSBridge.prototype.changeUserTrackingMode = function (successCallback, failureCallback) {};

    WebJSBridge.prototype.goPage = function (viewPageInfo) {};
    WebJSBridge.prototype.openMapPage = function (bdid) {
      var viewPageInfo = { page: "MapPage", view: "MapPage", saveStack: true, method: "initPage", view: "MapPage" };
      this.goPage(viewPageInfo);
    };
    WebJSBridge.prototype.showPoiDetail = function (data, successCallback, failureCallback) {};

    WebJSBridge.prototype.openSelectPointPage = function (data) {};
    WebJSBridge.prototype.openMainPoiPage = function () {};
    WebJSBridge.prototype.openSearchPage = function (data) {};
    WebJSBridge.prototype.openSearchResultPage = function (data) {};

    WebJSBridge.prototype.openRoutePage = function (
      targetId,
      targetFloorId,
      targetLon,
      targetLat,
      targetName,
      startFloorId,
      startLon,
      startLat,
      startName,
      routeData
    ) {};

    WebJSBridge.prototype.changeStartEndPoint = function (data, successCallback, failureCallback) {};

    WebJSBridge.prototype.startNavigation = function (options, successCallback, failureCallback) {};

    WebJSBridge.prototype.startSimulate = function (options, successCallback, failureCallback) {};
    WebJSBridge.prototype.takeToThere = function (options, successCallback, failureCallback) {};
    WebJSBridge.prototype.openVoiceSearch = function (arealType, successCallback, failureCallback) {
      //arealType is indoor or outdoor
    };
    WebJSBridge.prototype.startListeningVoice = function (arealType, successCallback, failureCallback) {
      //arealType is indoor or outdoor
    };
    WebJSBridge.prototype.stopListeningVoice = function (arealType, successCallback, failureCallback) {
      //arealType is indoor or outdoor
    };

    WebJSBridge.prototype.watchBLEScan = function (successCB, failureCB) {};
    WebJSBridge.prototype.getRequestParam = function (url) {
      // body...
      if (!url || url.indexOf("?") == -1) {
        return null;
      }
      var param = {};
      var searchString = url.split("?")[1];
      var tempArr = searchString.split("&");
      tempArr.forEach(function (item) {
        var kv = item.split("=");
        if (kv.length > 1) {
          param[kv[0]] = kv[1];
        } else {
          param[kv[0]] = "";
        }
      });
      return param;
    };

    WebJSBridge.prototype.getSignature = function (method, params, onSuccess, onError, timeStr) {};
    WebJSBridge.prototype.getSignatureParams = function (method, params, onSuccess, onError) {};
    WebJSBridge.prototype.showPoi = function (poiID, poiLon, poiLat, flID, name, poitype, address, successCallback, failureCallback) {};
    WebJSBridge.prototype.onNavigationFinished = function () {};
    //关闭导航界面  操作流程结束 回到 首页
    WebJSBridge.prototype.closeNavigation = function (successCallback, failureCallback) {};
    WebJSBridge.prototype.exitApp = function (bdid, successCallback, failureCallback) {
      if (window["wx"]) {
        window["wx"]["closeWindow"]();
      }
    };

    WebJSBridge.prototype.postMessage = function (msg, args, successCallback, failureCallback) {};
    WebJSBridge.prototype.downloadPackage = function (token, bdid, successCallback, failureCallback) {
      if (window["exec"]) {
        this.downloadPackageCallback = successCallback;
        invokeNativeMethod(undefined, failureCallback, "downloadPackage", { bdid: bdid, token: token });
      }
    };
    WebJSBridge.prototype.addMessageListener = function (watchCB, innerCheckCB) {
      var thisObject = this;
      thisObject.watchCallback = watchCB;
      function dealCommand(cmd) {
        if (cmd["method"] == "goBack") {
          var result = watchCB(cmd);
          if (result && result["pageCount"]) {
            invokeNativeCallback(null, null, "goBackCallback", { pageCount: result["pageCount"] });
          }
        } else if (cmd["method"] == "onPackageDownloaded") {
          thisObject.downloadPackageCallback && thisObject.downloadPackageCallback();
        } else {
          watchCB(cmd);
        }
      }
      if (window["cordova"]) {
        cordova && cordova.exec(dealCommand, null, "DXJSBridge", "addMessageListener", []);
      }
    };
    WebJSBridge.prototype.openExhibitionPage = function (params) {
      this.envAppCore && this.envAppCore.openExhibitionPage(params);
    };
    // 展品详情
    WebJSBridge.prototype.openExhibitDetail = function (params, successCallback, failureCallback) {
      this.envAppCore && this.envAppCore.openExhibitDetail(params, successCallback, failureCallback);
    };
    //展览详情
    WebJSBridge.prototype.openExhibitionDetail = function (params, successCallback, failureCallback) {
      // @id  展品id
      // @forwardPage 从哪儿进入 此处固定传参"展厅导览详情页"
      // @forwardPageDetails 从那个模块进入 此处固定传参"大希地图"
      // @mapType  地图类型 此处固定传参"daxiLocation"
      this.envAppCore && this.envAppCore.openExhibitionDetail(params, successCallback, failureCallback);
    };
    WebJSBridge.prototype.openExtraPoiDetail = function (params) {
      this.envAppCore && this.envAppCore.openExtraPoiDetail(params);
    };

    WebJSBridge.prototype.shareToFriend = function (params, successCB, failureCB) {
      this.envAppCore && this.envAppCore.shareToFriend(params, successCB, failureCB);
    };
    WebJSBridge.prototype.chooseImage = function (params, successCB, failureCB) {
      this.envAppCore && this.envAppCore.chooseImage(params, successCB, failureCB);
    };
    WebJSBridge.prototype.openLocation = function (params, successCB, failedCB) {
      if (window["wx"]) {
        var targetName = (params["targetName"] || "") + " " + (params["name"] || "目的地");
        window["wx"]["openLocation"]({
          latitude: parseFloat(params["lat"]),
          longitude: parseFloat(params["lon"]),
          scale: 14,
          name: targetName,
          address: params["address"] || "",
          success: function (res) {
            // trigger next
            successCB && successCB();
          },
          fail: function (res) {
            failedCB && failedCB();
          },
        });
      }
      if (window["my"]) {
        window["my"]["openLocation"]({
          latitude: parseFloat(params["lat"]),
          longitude: parseFloat(params["lon"]),
          scale: 14,
          name: targetName,
          address: params["address"] || "",
          success: function (res) {
            // trigger next
            successCB && successCB();
          },
          fail: function (res) {
            failedCB && failedCB();
          },
        });
      }
    };
    WebJSBridge.prototype.openOutdoorRoutePage = function (params, successCB, failureCB) {
      this.envAppCore && this.envAppCore.openOutdoorRoutePage(params, successCB, failureCB);
    };
    WebJSBridge.prototype.toUserPage = function (params, successCB, failureCB) {
      this.envAppCore && this.envAppCore.toUserPage(params, successCB, failureCB);
    };
    WebJSBridge.prototype.inviteFriendToGroup = function (params, successCB, failureCB) {
      this.envAppCore && this.envAppCore.inviteFriendToGroup(params, successCB, failureCB);
    };
    return WebJSBridge;
  })();
  global["DXNativeDownloader"] = DXNativeDownloader;
  global["DXJSBridge"] = DXJSBridge;
  global["WebJSBridge"] = WebJSBridge;

  function onBridgeReady() {
    WeixinJSBridge.call("hideToolbar");
  }

  if (typeof WeixinJSBridge == "undefined") {
    if (document.addEventListener) {
      document.addEventListener("WeixinJSBridgeReady", onBridgeReady, false);
    } else if (document.attachEvent) {
      document.attachEvent("WeixinJSBridgeReady", onBridgeReady);
      document.attachEvent("onWeixinJSBridgeReady", onBridgeReady);
    }
  } else {
    onBridgeReady();
  }

  var initCordova = function (options, cb) {
    var dxUtil = daxiapp["utils"];
    var platform = options["platform"];
    var cordovaPath = options["cordovaPath"] || "../../../jsbridge/";
    if (platform == "android" || platform == "android_web") {
      dxUtil.loadScript(cordovaPath + "android/cordova.js", function () {
        window["cordova"].exec = window["cordova"]["require"]("cordova/exec");
        cb && cb(window["cordova"]);
      });
    } else if (platform == "ios" || platform == "ios_web") {
      dxUtil.loadScript(cordovaPath + "ios/cordova.js", function () {
        window["cordova"].exec = window["cordova"]["require"]("cordova/exec");
        cb && cb(window["cordova"]);
      });
    } else {
      cb && cb();
    }
  };
  daxiapp.createJSBrigde = function (options, callback) {
    initCordova(options, function (cordova) {
      if (cordova && cordova["exec"] && window["DXJSBridge"]) {
        var jsBridge = new window["DXJSBridge"]();
        callback && callback(jsBridge);
      } else {
        var jsBridge = new window["WebJSBridge"]();
        callback && callback(jsBridge);
      }
    });
  };
})(window);
