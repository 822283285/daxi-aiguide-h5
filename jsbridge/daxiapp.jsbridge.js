// ES6 Module - DXJSBridge
// 与原生 App 通信的核心模块

// ==================== 全局命名空间 (保持向后兼容) ====================
const DaxiApp = window["DaxiApp"] || {};
window["DaxiApp"] = DaxiApp;

// ==================== EventHandler 类 ====================
class EventHandler {
  constructor(eventId) {
    const __handlerList = [];
    __handlerList.remove = function(index) {
      if (isNaN(index) || index > this.length) {
        return false;
      }
      this.splice(index, 1);
    };
    __handlerList.clear = function() {
      for (let i = 0; i < __handlerList.length; i++) {
        if (__handlerList[i].f) {
          __handlerList.remove(i);
        }
      }
    };
    const __eventId = eventId;

    this._addEventHandler = function(callbackListener) {
      for (let i = 0; i < __handlerList.length; i++) {
        if (__handlerList[i].f == callbackListener) {
          return;
        }
      }
      __handlerList.push({ o: null, f: callbackListener });
    };

    this._removeEventHandler = function(callbackListener) {
      for (let i = 0; i < __handlerList.length; i++) {
        if (__handlerList[i].f == callbackListener) {
          __handlerList.remove(i);
        }
      }
    };

    this._clearEventHandler = function() {
      __handlerList.clear();
    };

    this._notifyEvent = function(sender, pVal) {
      for (let i = 0; i < __handlerList.length; i++) {
        __handlerList[i].f(pVal);
      }
    };

    this["addEventHandler"] = function(callbackListener) {
      this._addEventHandler(callbackListener);
    };

    this["removeEventHandler"] = function(callbackListener) {
      this._removeEventHandler(callbackListener);
    };

    this["clearEventHandler"] = function() {
      this._clearEventHandler();
    };
    this["notifyEvent"] = function(sender, pVal) {
      this._notifyEvent(sender, pVal);
    };
  }
}

// ==================== PageManager 类 ====================
class PageManager {
  constructor(name) {
    this.name = name;
    this.pageStack = [];
  }

  pushPage(pageCommand) {
    for (let i = 0, len = this.pageStack.length; i < len; i++) {
      if (this.pageStack[i]["method"] == pageCommand["method"]) {
        this.pageStack.splice(i, len - i);
        break;
      }
    }
    this.pageStack.push(pageCommand);
    return true;
  }

  updateStack(pageCommand) {
    for (let i = 0, len = this.pageStack.length; i < len; i++) {
      if (this.pageStack[i]["page"] == pageCommand["page"]) {
        this.pageStack.splice(i);
        break;
      }
    }
    this.pageStack.push(pageCommand);
    return true;
  }

  popPage() {
    if (this.pageStack.length >= 0) {
      return this.pageStack.pop();
    }
    return;
  }

  getCount() {
    return this.pageStack.length;
  }

  getTopPage() {
    const len = this.pageStack.length;
    if (len > 0) {
      return this.pageStack[len - 1];
    } else {
      return null;
    }
  }

  clearPageStack() {
    this.pageStack = [];
  }

  popPageToTop() {
    const topPage = this.pageStack[0];
    this.pageStack = [topPage];
    return topPage;
  }

  getViewState(pageState) {
    for (let i = this.pageStack.length - 1; i >= 0; i--) {
      const pageInfo = this.pageStack[i];
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
  }
}

// ==================== DXNativeDownloader 类 ====================
class DXNativeDownloader {
  constructor(jsBridge) {
    this.jsBridge = jsBridge;
  }

  getData(url, method, dataType, data, successCB, errorCB, func) {
    const dxUtil = DaxiApp.utils;
    dxUtil.getData(url, data, dataType, successCB, errorCB);
  }

  getPackageData(url, method, dataType, data, successCB, errorCB, func) {
    const dxUtil = DaxiApp.utils;
    this.jsBridge.downloadPackage(data.token, data.bdid, function(e) {
      dxUtil.getData(url, {}, dataType, successCB, errorCB);
    });
  }

  getData2(url, method, dataType, data, successCB, errorCB, func) {
    if (window["command"] && window["command"]["platform"].indexOf("android") != -1) {
      const dxUtil = DaxiApp.utils;
      dxUtil.getDataBySecurityRequest(url, method, data, successCB, errorCB, dataType);
    } else {
      this.jsBridge.getDataByNative(
        url,
        method,
        "application/json",
        data,
        function(resdata) {
          if (resdata && resdata["result"]) {
            let resultStr = resdata["result"];
            const _index = resultStr.indexOf("&&");
            if (_index != -1) {
              resultStr = resultStr.slice(resultStr.indexOf("(") + 1, -1);
            }
            const result = JSON.parse(resultStr);
            result && (result["reqparams"] = data);
            successCB(result);
          } else {
            errorCB(resdata);
          }
        },
        errorCB
      );
    }
  }

  getServiceData(url, method, dataType, data, successCB, errorCB, func) {
    if ((window["command"] && window["command"]["platform"].indexOf("android") != -1) || window.location.href.indexOf("platform=android") != -1) {
      const dxUtil = DaxiApp.utils;
      dxUtil.getDataBySecurityRequest(url, method, data, successCB, errorCB, dataType);
    } else {
      this.jsBridge.getDataByNative(
        url,
        method,
        "application/json",
        data,
        function(resdata) {
          if (resdata && resdata["result"]) {
            let resultStr = resdata["result"];
            const _index = resultStr.indexOf("&&");
            if (_index != -1) {
              resultStr = resultStr.slice(resultStr.indexOf("(") + 1, -1);
            }
            const result = JSON.parse(resultStr);
            result && (result["reqparams"] = data);
            successCB(result);
          } else {
            errorCB(resdata);
          }
        },
        errorCB
      );
    }
  }
}

// ==================== 工具函数 ====================
function extend(target) {
  const args = arguments;
  if (args.length > 0) {
    const len = args.length;
    if (typeof args[0] == "object") {
      for (let i = 1; i < len; i++) {
        if (typeof args[i] != "object") {
          continue;
        }
        for (const key in args[i]) {
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
  const paramType1 = typeof param1,
    paramType2 = typeof param2;
  if (paramType1 == typeof paramType2) {
    if (paramType1 != "object" && param1 == param2) {
      return true;
    } else {
      const keys1 = Object.keys(param1),
        keys2 = Object.keys(param2);
      if (keys1.length == keys2.length) {
        for (let i = keys1.length; i > 0; i--) {
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

// 当前操作状态
let currentOperation = {};

function invokeNativeMethod(successCallback, failureCallback, funcName, params) {
  let jsonString = "";
  const _timeStamp = new Date().getTime();
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
  let jsonString = "";
  if (callbackParams !== undefined) {
    jsonString = JSON.stringify(callbackParams);
  }
  jsonString = encodeURIComponent(jsonString);
  cordova.exec(successCallback, failureCallback, "DXJSBridge", "invokeCallback", [callbackFuncName, jsonString]);
}

// ==================== DXJSBridge 类 ====================
class DXJSBridge {
  constructor() {
    this.pageManager = new PageManager("DXJSBridge");
    this.eventGoBack = new EventHandler("GoBackEvent");
    this.navLocalStorage = {
      getLocalStorageData: (successCallBack, errorCallBack) => {
        const params = { method: "getLocalStorageData", data: {} };
        invokeNativeCallback(successCallBack, errorCallBack, "notifyMessage", { data: JSON.stringify(params) });
      },
      setValue: (key, value) => {
        const params = { method: "addLocStorageData", data: { key: key, value: value } };
        this.data["key"] = value;
        invokeNativeMethod(successCallBack, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
      },
      removeValue: (key) => {
        delete this.data[key];
        const params = { method: "removeLocStorageData", data: { key: key } };
        invokeNativeMethod(successCallBack, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
      },
      getValue: (key, value) => {
        return this._data[key];
      },
    };
  }

  watchBLEScan(successCB, failureCB) {
    cordova.exec(successCB, failureCB, "IndoorLocation", "watchBLEScan", []);
  }

  getRequestParam(url) {
    if (!url || url.indexOf("?") == -1) {
      return null;
    }
    const param = {};
    const searchString = url.split("?")[1];
    const tempArr = searchString.split("&");
    tempArr.forEach(function(item) {
      const kv = item.split("=");
      if (kv.length > 1) {
        param[kv[0]] = kv[1];
      } else {
        param[kv[0]] = "";
      }
    });
    return param;
  }

  getDataByXHR(url, params, method, dataType, successCallback, failureCallback) {
    method = method.toUpperCase();
    const httpRequest = new XMLHttpRequest();
    if (dataType) {
      httpRequest["responseType"] = dataType;
    }
    httpRequest.onreadystatechange = function(event) {
      if (httpRequest["readyState"] == 4) {
        if (httpRequest["status"] == 200 || httpRequest["status"] == 304) {
          let result;
          const resDataType = httpRequest["dataType"];
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
          const error = {};
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
        for (const key in params) {
          url.indexOf("?") == -1 ? (url += "&" + key + "=" + params[key]) : (url += "?" + key + "=" + params[key]);
        }
      }
      params = null;
    }
    httpRequest["open"](method, url, true);
    httpRequest.send(params);
  }

  getSignatureParams(method, params, onSuccess, onError) {
    let paramString = "";
    if (params) {
      paramString = JSON.stringify(params);
    }
    const jsonString = encodeURIComponent(paramString);
    const timeStr = new Date().getTime() + "";
    cordova.exec(
      function(data) {
        data["t"] = timeStr;
        onSuccess(data);
      },
      onError,
      "DXJSBridge",
      "signatureRequest",
      [method, jsonString, timeStr]
    );
  }

  getSignature(method, params, onSuccess, onError, timeStr) {
    let paramString = "";
    if (params) {
      paramString = JSON.stringify(params);
    }
    const jsonString = encodeURIComponent(paramString);
    cordova.exec(onSuccess, onError, "DXJSBridge", "signatureRequest", [method, jsonString, timeStr]);
  }

  getDataBySecurityRequest(url, params, method, dataType, onSuccess, error) {
    const that = this;
    const t = new Date().getTime() + "";
    method = method.toLocaleUpperCase();
    const provider = params["provider"] || "dx";
    const v = params["v"] || 1;

    const onSignatureSuc = (signatureData) => {
      let _url = url;
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

      const options = {
        url: _url,
        type: method,
        dataType: dataType,
        timeout: 10000,
        success: onSuccess || function() {},
        error: error,
      };
      if (method == "POST") {
        options["contentType"] = "application/json";
        options["data"] = JSON.stringify(params);
      } else {
        options["data"] = params;
      }

      $["ajax"](options);
    };

    const onSignatureErr = () => {
      const error = { msg: "get signature failed" };
      error(error);
    };
    const urlParams = that.getRequestParam(url);
    if (urlParams) {
      for (const key in urlParams) {
        if (urlParams[key] == undefined) {
          delete urlParams[key];
        }
      }
    }
    if (params) {
      for (const key in params) {
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
  }

  getDataByNative(url, method, dataType, data, onSuccess, onError) {
    const paramString = (data && JSON.stringify(data)) || "";
    cordova.exec(onSuccess, onError, "DXJSBridge", "getDataByNative", [url, method, dataType, paramString]);
  }

  downloadPackage(token, bdid, successCallback, failureCallback) {
    this.downloadPackageCallback = successCallback;
    invokeNativeMethod(undefined, failureCallback, "downloadPackage", { bdid: bdid, token: token });
  }

  getBuildingListDataByNative(onSuccess, onError) {
    cordova.exec(onSuccess, onError, "DXJSBridge", "getBuildingListDataByNative", [""]);
  }

  setChangeBuilding(ischanging) {
    this.changingBuilding = ischanging;
  }

  initCross(argument) {}

  pushStack(pageCommand) {
    this.mapPageStack.push(pageCommand);
  }

  onceGoBackListener(callback) {
    const onceFun = (sender, data) => {
      callback && callback(data);
      this.eventGoBack._removeEventHandler(onceFun);
    };
    this.eventGoBack._addEventHandler(onceFun);
  }

  openBuild(bdid, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "openBuild", { bdid: bdid });
  }

  mapInitFinished(bdListData, successCallback, failureCallback) {
    cordova.exec(successCallback, failureCallback, "DXJSBridge", "postMessage", ["mapInitFinished", ""]);
  }

  onIndoorBuildingLoaded(indoorBuildingInfo, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "onIndoorBuildingLoaded", { info: indoorBuildingInfo });
  }

  onFloorChanged(data, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "onFloorChanged", data);
  }

  onIndoorBuildingActive(bdid, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "onIndoorBuildingActive", { bdid: bdid });
  }

  getCommandQueue(successCallback, failureCallback) {
    const scb = (ret) => {
      const jsonString = decodeURIComponent(ret["commandList"]);
      const jsonObj = JSON.parse(jsonString);
      successCallback && successCallback(jsonObj);
    };
    cordova.exec(scb, failureCallback, "DXJSBridge", "getCommandQueue", []);
  }

  mapInitFailed(errorMsg, successCallback, failureCallback) {
    cordova.exec(successCallback, failureCallback, "DXJSBridge", "postMessage", ["mapInitFailed", errorMsg]);
  }

  pageInitFinished(successCallback, failureCallback) {
    setTimeout(function() {
      cordova.exec(successCallback, failureCallback, "DXJSBridge", "postMessage", ["pageInitFinished", ""]);
    }, 10);
  }

  mapPageBack() {}

  goBack(successCallback, failureCallback, params) {
    invokeNativeMethod(null, null, "goBack", { bdid: "" });
  }

  routeReviced(routeData, successCallback, failureCallback) {
    invokeNativeMethod(null, null, "routeReviced", { routeData: routeData });
  }

  goBackToState(pageState, successCallback, failureCallback) {
    invokeNativeMethod(null, null, "goBackToState", { state: pageState });
  }

  onTeminateNavigation(pageState, successCallback, failureCallback) {
    invokeNativeMethod(null, null, "onTeminateNavigation", { state: pageState });
  }

  onCloseNavigation(pageState, successCallback, failureCallback) {
    invokeNativeMethod(null, null, "onCloseNavigation", { state: pageState });
  }

  activeView(successCallback, failureCallback) {
    invokeNativeMethod(successCallback, null, "activeView", { bdid: "" });
  }

  comfirmedBack(successCallback, failureCallback) {
    const thisObject = this;
    const pageCount = thisObject.pageManager.getCount();
    if (pageCount > 1) {
      thisObject.pageManager.popPage();
      const topViewInfo = thisObject.pageManager.getTopPage();
      if (topViewInfo !== undefined) {
        thisObject.watchCallback(topViewInfo);
      }
    }
    invokeNativeCallback(null, null, "goBackCallback", { pageCount: pageCount });
  }

  innerGoBack(successCallback, failureCallback) {
    const thisObject = this;
    const pageCount = thisObject.pageManager.getCount();
    if (pageCount > 1) {
      thisObject.pageManager.popPage();
      const cmd = thisObject.pageManager.getTopPage();
      thisObject.watchCallback(cmd);
    }
  }

  openMapPage(bdid, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "openMapPage", { bdid: bdid });
  }

  showPoiDetail(data, successCallback, failureCallback) {
    const params = {
      page: "SelectPoiPage",
      saveStack: true,
      poiInfo: data["poiInfo"],
      poiId: data["poiId"],
      arealType: data["arealType"],
    };
    invokeNativeMethod(successCallback, failureCallback, "showPoiDetail", params);
  }

  onMarkerClick(markerid, successCallback, failureCallback) {
    const params = {
      markerId: markerid,
    };
    invokeNativeMethod(successCallback, failureCallback, "onMarkerClick", params);
  }

  openMainPoiPage(data, successCallback, failureCallback) {
    const params = {
      bdid: data["bdid"],
      arealType: data["arealType"],
    };
    invokeNativeMethod(successCallback, failureCallback, "openMainPoiPage", params);
  }

  startNavigation(params, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "startNavigation", params);
  }

  startSimulate(params, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "startSimulate", params);
  }

  takeToThere(poiInfo, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "takeToThere", poiInfo);
  }

  changeUserTrackingMode(params, successCallback, failureCallback) {
    const data = {};
    if (params["range"]) {
      data["range"] = params["range"];
    }
    invokeNativeMethod(successCallback, failureCallback, "changeUserTrackingMode", data);
  }

  onCameraChangeFinish(params, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "onCameraChangeFinish", params);
  }

  onScreenTouched(successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "onScreenTouched", {});
  }

  openSelectPointPage(data, successCallback, failureCallback) {
    const params = {
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
  }

  openSearchPage(data, successCallback, failureCallback) {
    const params = {
      arealType: data["arealType"] || "indoor",
      keyword: data["keyword"] || "",
    };
    invokeNativeMethod(successCallback, failureCallback, "openSearchPage", params);
  }

  openVoiceSearch(arealType, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "openVoiceSearch", { arealType: arealType });
  }

  startListeningVoice(arealType, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "startListeningVoice", { arealType: arealType });
  }

  stopListeningVoice(arealType, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "stopListeningVoice", { arealType: arealType });
  }

  openSearchResultPage(data, successCallback, failureCallback) {
    const params = {
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
  }

  goSearch(arealType, keyword, pois, lon, lat, floorId, successCallback, failureCallbac) {
    const params = {
      arealType: arealType,
      keyword: keyword,
      pois: pois,
      lon: lon,
      lat: lat,
      floorId: floorId,
    };
    invokeNativeMethod(successCallback, failureCallback, "goSearch", params);
  }

  changeStartEndPoint(data, successCallback, failureCallback) {
    const params = {
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
  }

  reversalStartEndPoint(data, successCallback, failureCallback) {
    const _timeStamp = new Date().getTime();
    invokeNativeMethod(successCallback, failureCallback, "reversalStartEndPoint");
  }

  toOutdoorMap(data, successCallback, failureCallback) {
    const params = {
      lon: data["lon"],
      lat: data["lat"],
      range: data["range"],
      floorId: data["floorId"],
    };
    invokeNativeMethod(successCallback, failureCallback, "toOutdoorMap", params);
  }

  finishCallback(callbackName, retInfo, isCancel, successCallback, failureCallback) {
    retInfo["retVal"] = isCancel ? "Cancel" : "OK";
    if (!isCancel && retInfo["arealType"] == "outdoor" && retInfo["bdid"]) {
      delete retInfo["bdid"];
    }
    console.log("invokeNativeCallback:" + callbackName);
    invokeNativeCallback(null, null, callbackName, retInfo);
  }

  sharePos(params, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "shareMyPos", params);
  }

  toIndoorMap(state, successCallback, failureCallback) {
    const params = {
      state: state,
    };
    invokeNativeMethod(successCallback, failureCallback, "toIndoorMap", params);
  }

  showPoi(poiID, poiLon, poiLat, flID, name, poitype, address, successCallback, failureCallback) {
    const params = {
      targetPoiID: poiID,
      targetlon: poiLon,
      targetLat: poiLat,
      targetFlID: flID,
      targetPoiName: name,
      targetPoiType: poitype,
      targetAddress: address,
    };
    invokeNativeMethod(successCallback, failureCallback, "showPoi", params);
  }

  onNavigationFinished(args, successCallback, failureCallback) {
    const params = {};
    invokeNativeMethod(successCallback, failureCallback, "onNavigationFinished", params);
  }

  onReNaviRoute(args, successCallback, failureCallback) {
    const params = {};
    invokeNativeMethod(successCallback, failureCallback, "onReNaviRoute", params);
  }

  // 关闭导航界面  操作流程结束 回到 首页
  closeNavigation(successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "closeNavigation", {});
  }

  popWindow(bdid, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "popWindow", {});
  }

  openBuildList(bdid, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "openBuildList", { bdid: bdid });
  }

  changeBuilding(params, successCallback, failureCallback) {
    params = { bdid: params["bdid"] };
    invokeNativeMethod(successCallback, failureCallback, "changeBuilding", params);
  }

  openMap(bdid, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "postMessage", {});
  }

  exitApp(bdid, successCallback, failureCallback) {
    invokeNativeMethod(successCallback, failureCallback, "exitApp", {});
  }

  postMessage(msg, args, successCallback, failureCallback) {
    const logCB = function(e) {
      console.log(e);
    };
    const scb = successCallback || logCB;
    const fcb = failureCallback || logCB;
    cordova.exec(scb, fcb, "DXJSBridge", "postMessage", [msg, args]);
  }

  addMessageListener(watchCB, innerCheckCB) {
    const logCB = function(e) {
      console.log(e);
    };
    const thisObject = this;
    thisObject.watchCallback = watchCB;

    const dealCommand = (cmd) => {
      if (currentOperation.method == cmd["method"]) {
        currentOperation.finished = true;
      }
      if (cmd["method"] == "goBack") {
        const result = watchCB(cmd);
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
    };

    cordova.exec(dealCommand, null, "DXJSBridge", "addMessageListener", []);
  }

  addGoBackMessageListener(watchCB) {
    const realRunCommand = (cmd) => {
      if (cmd["method"] == "goBack") {
        watchCB(cmd);
      }
    };
    cordova.exec(realRunCommand, null, "DXJSBridge", "addMessageListener", []);
  }

  realGoBack(successCallback, failureCallback, args, isSwitchTab) {
    const params = { realGoBack: true };
    if (args["pageCount"]) {
      params["pageCount"] = args["pageCount"];
    }
    if (args["popPageCount"]) {
      params["popPageCount"] = args["popPageCount"];
    }
    invokeNativeMethod(successCallback, failureCallback, "realGoBackCallback", params, isSwitchTab);
  }

  openVoice(successCallback, failureCallback) {
    cordova.exec(null, null, "DXJSBridge", "postMessage", ["openVoice"]);
  }

  getNaviConfig(successCallback, failureCallback) {
    cordova.exec(successCallback, failureCallback, "DXJSBridge", "postMessage", ["getNaviConfig"]);
  }

  pushStackTop(data) {
    const viewPageInfo = {};
    viewPageInfo["saveStack"] = true;
    for (const key in data) {
      let val = data[key];
      if (val == undefined) continue;
      if (val.indexOf("%") != -1) {
        val = decodeURIComponent(val);
      }
      viewPageInfo[key] = val;
    }
    const pageViewInfo = this.pageManager.getTopPage();
    if (!pageViewInfo) {
      this.pageManager.pushPage(viewPageInfo);
    }
  }

  pageStackPopToTop() {
    this.goBack();
  }

  loadPano(successCallback, failureCallback, data) {
    const params = {
      id: data["id"],
      panoServer: data["panoServer"],
      floorId: data["floorId"],
    };
    invokeNativeCallback(successCallback, failureCallback, "loadPano", params);
  }

  // 听展览
  openExhibitionPage(data, successCallBack, failureCallback) {
    const params = { method: "openExhibitionPage", data: data || {} };
    invokeNativeMethod(successCallBack, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
  }

  // 展品详情
  openExhibitDetail(data, successCallback, failureCallback) {
    const _data = {
      id: data["exhibitId"] || data["id"],
      forwardPage: decodeURIComponent(data["forwardPage"] || "展厅导览详情页"),
      forwardPageDetails: decodeURIComponent(data["forwardPageDetails"] || "大希地图"),
      mapType: data["mapType"] || "daxiLocation",
    };
    const params = { method: "openExhibitDetail", data: _data };
    invokeNativeMethod(successCallback, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
  }

  // 展览详情
  openExhibitionDetail(data, successCallback, failureCallback) {
    const _data = {
      id: data["exhibitId"] || data["id"],
      forwardPage: decodeURIComponent(data["forwardPage"] || "导览页"),
      forwardPageDetails: decodeURIComponent(data["forwardPageDetails"] || "展览"),
      mapType: data["mapType"] || "daxiLocation",
    };
    const params = { method: "openExhibitDetail", data: _data };
    invokeNativeMethod(successCallback, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
  }

  openExtraPoiDetail(data, successCallback, failureCallback) {
    const params = { method: "openExtraPoiDetail", data: data };
    invokeNativeMethod(successCallback, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
  }

  openLocation(params, successCallback, failureCallback) {
    params = { method: "openLocation", data: params };
    invokeNativeMethod(successCallback, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
  }

  gotoARPage(params, successCallback, failureCallback) {
    params = { method: "openARPage", data: params };
    invokeNativeMethod(successCallback, failureCallback, "notifyMessage", { data: JSON.stringify(params) });
  }
}

// ==================== WXMiniProgramJSBridge 对象 ====================
const WXMiniProgramJSBridge = (function() {
  const thisObject = {};
  thisObject.navigateToPage = function() {};
  thisObject.openExtraPoiDetail = function(params, a, d) {
    params.forwardPage =
      "Exhibition" == params.type
        ? "\u5c55\u5385\u5bfc\u89c8\u8be6\u60c5\u9875"
        : "Exhibit" == params.type
        ? "\u5c55\u54c1\u5bfc\u89c8\u8be6\u60c5\u9875"
        : "\u5c55\u5385\u5bfc\u89c8\u8be6\u60c5\u9875";
    let url =
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
          success: function(a) {
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
  thisObject.openExhibitDetail = function(data, successCallback, failureCallback) {
    const url =
      "/pages/exhibit/detail/index?id=" +
      (data["exhibitId"] || data["id"]) +
      "&forwardPage=" +
      decodeURIComponent(data["forwardPage"] || "展厅导览详情页") +
      "&forwardPageDetails=" +
      decodeURIComponent(data["forwardPageDetails"] || "大希地图") +
      "&mapType=" +
      (data["mapType"] || "daxiLocation");
    try {
      wx["miniProgram"] &&
        wx["miniProgram"]["navigateTo"]({
          url: url,
          success: function(res) {
            res.eventChannel && res.eventChannel.emit("acceptDataFromOpenerPage", { data: "test" });
          },
        });
    } catch (e) {
      alert("openExhibitDetail:" + e.toString());
    }
  };
  // 展览详情
  thisObject.openExhibitionDetail = function(data, successCallback, failureCallback) {
    const url =
      "/pages/exhibit/exhibit?id=" +
      (data["exhibitId"] || data["id"]) +
      "&forwardPage=" +
      decodeURIComponent(data["forwardPage"] || "导览页") +
      "&forwardPageDetails=" +
      decodeURIComponent(data["forwardPageDetails"] || "展览") +
      "&mapType=" +
      (data["mapType"] || "daxiLocation");
    try {
      wx["miniProgram"] &&
        wx["miniProgram"]["navigateTo"]({
          url: url,
          success: function(res) {
            res.eventChannel && res.eventChannel.emit("acceptDataFromOpenerPage", { data: "test" });
          },
        });
    } catch (e) {
      alert("openExhibitionDetail:" + e.toString());
    }
  };
  thisObject.shareToFriend = function(params, successCB, failureCB) {
    let url = "../share/showShare?";
    let str = "";
    for (const key in params) {
      str.length > 0 ? (str += "&") : (str += "");
      str += key + "=" + params[key];
    }
    url += str;
    try {
      wx["miniProgram"] &&
        wx["miniProgram"]["navigateTo"]({
          url: url,
          success: function(res) {
            res.eventChannel && res.eventChannel.emit("acceptDataFromOpenerPage", { data: "test" });
          },
        });
    } catch (e) {
      alert("shareToFriend:" + e.toString());
    }
  };
  thisObject.chooseImage = function(params, successCB, failureCB) {
    try {
      wx &&
        wx["chooseImage"]({
          count: 1,
          sizeType: ["compressed"],
          success: function(data) {
            const localId = data["localIds"][0];
            wx["getLocalImgData"]({
              localId: localId,
              success: function(res) {
                const localData = res.localData;
                successCB && successCB(localData);
              },
            });
          },
        });
    } catch (e) {}
  };
  thisObject.toUserPage = function(params) {
    const url = params["url"] || "/pages/user/nickname/nickname";
    try {
      wx["miniProgram"] &&
        wx["miniProgram"]["navigateTo"]({
          url: url,
          success: function(res) {},
        });
    } catch (e) {
      console.log("openExhibitionDetail:" + e.toString());
    }
  };
  thisObject.inviteFriendToGroup = function(params, successCB, failureCB) {
    let url = "../../subpage/invite/invite?";
    let str = "";
    for (const key in params) {
      str.length > 0 ? (str += "&") : "";
      str += key + "=" + params[key];
    }
    url += str;
    try {
      wx["miniProgram"] &&
        wx["miniProgram"]["navigateTo"]({
          url: url,
          success: function(res) {
            res.eventChannel && res.eventChannel.emit("acceptDataFromOpenerPage", { data: "test" });
          },
        });
    } catch (e) {}
  };
  thisObject.openExhibitionPage = function(params) {
    const url = "/pages/explanation/index";
    try {
      wx["miniProgram"] &&
        wx["miniProgram"]["navigateTo"]({
          url: url,
          success: function(res) {},
        });
    } catch (e) {
      alert("openExhibitionDetail:" + e.toString());
    }
  };
  thisObject.openOutdoorRoutePage = function(params) {
    let url = "/pages/route/route";
    for (const key in params) {
      if (key && params[key] != undefined) {
        url.indexOf("?") == -1 ? (url += "?" + key + "=" + params[key]) : (url += "&" + key + "=" + params[key]);
      }
    }
    try {
      wx["miniProgram"] &&
        wx["miniProgram"]["navigateTo"]({
          url: url,
          success: function(res) {},
        });
    } catch (e) {
      alert("openExhibitionDetail:" + e.toString());
    }
  };
  thisObject.gotoARPage = function(params, successCallback, failureCallback) {
    let url = params["url"];
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
      wx["miniProgram"] &&
        wx["miniProgram"]["navigateTo"]({
          url: url,
          success: function(res) {},
        });
    } catch (e) {
      alert("gotoARPage:" + e.toString());
    }
  };
  thisObject.goBack = function(url, switchTap) {
    try {
      if (wx["miniProgram"]) {
        if (switchTap) {
          wx["miniProgram"] &&
            wx["miniProgram"]["switchTab"]({
              url: url || "/pages/index/index",
              success: function(res) {
                console.log(res);
              },
            });
        } else {
          wx["miniProgram"] &&
            wx["miniProgram"]["navigateTo"]({
              url: url || "/pages/index/index",
              success: function(res) {
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

// ==================== AliMiniProgramJSBridge 对象 ====================
const AliMiniProgramJSBridge = (function() {
  const thisObject = {};
  thisObject.navigateToPage = function() {};

  thisObject.shareToFriend = function(params, successCB, failureCB) {
    if (window["my"]) {
      window["my"]["postMessage"] &&
        window["my"]["postMessage"]({ method: "showShare", data: { searchStr: str, title: "位置分享  " + (params["name"] || params["text"] || "") } });
    }
  };
  thisObject.chooseImage = function(params, successCB, failureCB) {
    try {
      if (ap) {
        ap &&
          ap["chooseImage"](
            {
              count: 1,
              sizeType: ["compressed"],
            },
            function(res) {
              successCB && successCB(res.apFilePaths[0]);
            }
          );
      } else {
        AlipayJSBridge &&
          AlipayJSBridge.call(
            "chooseImage",
            {
              sourceType: ["camera", "album"],
              count: 1,
            },
            function(res) {
              successCB && successCB(res.apFilePaths[0]);
            }
          );
      }
    } catch (e) {}
  };
  thisObject.openOutdoorRoutePage = function(params) {
    try {
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

// ==================== WebJSBridge 类 ====================
class WebJSBridge {
  constructor() {
    this.pageManager = new PageManager("WebJSBridge");
    this.routeInfo = { startPos: {}, endPos: {} };
    this.invokeWebMethod = new EventHandler("invokeWebMethod");
    const thisObject = this;
    this.getBrowser(function() {
      if (thisObject.browserType == "WEIXIN" || thisObject.browserType == "miniProgram") {
        thisObject.envAppCore = WXMiniProgramJSBridge;
      }
      if (thisObject.browserType == "ALIPAY") {
        thisObject.envAppCore = AliMiniProgramJSBridge;
      }
    });
  }

  realGoBack(successCallBack, failureCallback, params, isSwitchTab) {
    if (this.envAppCore && this.envAppCore.goBack) {
      this.envAppCore.goBack(params, isSwitchTab);
    }
  }

  getBrowser(callback) {
    const thisObject = this;
    const ua = window.navigator.userAgent.toLowerCase();
    if (/micromessenger/.test(ua)) {
      if (window["wx"] && wx.miniProgram) {
        wx.miniProgram.getEnv(function(res) {
          if (res.miniprogram) {
            thisObject.browserType = "miniProgram";
            callback && callback();
            return "miniProgram";
          } else {
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
    } else if (/alipayclient/.test(ua)) {
      thisObject.browserType = "ALIPAY";
      callback && callback();
      return "ALIPAY";
    } else {
      thisObject.browserType = "commonBrowser";
      callback && callback();
    }
  }

  setChangeBuilding(ischanging) {
    this.changingBuilding = ischanging;
  }

  windowBack(params, baseUrl, isMapPage, token) {
    if (this.browserType == "commonBrowser") {
      if (params) {
        let url = window.location.origin + window.location.pathname.replace("stationList.html", "map.html");
        url += "?";
        for (const key in params) {
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
        const _search = location.search;
        if (_search) {
          _search = _search.slice(0);
          const _params = _search.split("&");
          const res = {};
          res.forEach(function(str) {
            const _item = str.split("=");
            if (_item.length > 1) {
              res[_item[0]] = _item[1];
            }
          });
          this.currentBdid = res["bdid"];
          this.token = res["token"] || this.token;
        }
      }
      const _url =
        "https://map1a.daxicn.com/wxtest/indoormap_new2?bdid=" +
        this.currentBdid +
        "&view=MapPage&page=MapPage&singlePage=false&token=" +
        (this.token || window["launcher"].getParamValue("token"));
      window.location.replace(_url);
    }
  }

  windowOpen(baseUrl, params, isMapPage, token) {
    this.currentBdid = params["bdid"];
    let _url = baseUrl;
    if (this.browserType == "WEIXIN" && isMapPage) {
      _url = "https://map1a.daxicn.com/wxtest/indoormap_new2?token=" + (token || window["launcher"].getParamValue("token"));
    }
    if (params) {
      for (const key in params) {
        const val = params[key];
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
    if (this.browserType == "commonBrowser") {
      window.location.replace(_url);
    }
    if (this.browserType == "miniProgram") {
    }
    if (this.browserType == "WEIXIN") {
      window.location.replace(_url);
    }
  }

  initCross(targetDomain, ifw) {
    const cross = new Cross(window, targetDomain, ifw);
    this.cross = cross;
    return cross;
  }

  loadPano(data, successCallback, failureCallback) {
    this.cross["call"]("loadPano", data);
  }

  getCommandQueue(successCallback, failureCallback) {}

  mapInitFinished() {}

  mapInitFailed(errorMsg, successCallback, failureCallback) {
    alert(errorMsg["msg"]);
  }

  pageInitFinished(successCallback, failureCallback) {
    console.log("pageInitFinished");
  }

  finishCallback(callbackName, retInfo, isCancel, successCallback, failureCallback) {}

  setRouteInfo(options) {}

  openBuild(bdid, successCallback, failureCallback) {
    const str = window.location.origin;
    let pathname = window.location.pathname;
    pathname = pathname.replace("map/index.html", "building_selector/build.html");
    pathname = pathname.replace("index.html", "building_selector/build.html");
    pathname = pathname.replace(bdid + ".html", "building_selector/build.html");
    window.location.href = str + pathname;
    this.pageManager.clearPageStack();
  }

  openBuildList(bdid, successCallback, failureCallback, token) {
    this.windowOpen("./stationList.html", { bdid: bdid, token: token });
  }

  changeBuilding(params, successCallback, failureCallback) {
    params = { bdid: params["bdid"] };
    if (this.browserType == "WEIXIN") {
      window.location.replace(_url);
    }
  }

  pushStackTop(data) {
    const viewPageInfo = {};
    viewPageInfo["saveStack"] = true;
    for (const key in data) {
      let val = data[key];
      if (val && val.indexOf("%") != -1) {
        val = decodeURIComponent(val);
      }
      viewPageInfo[key] = val;
    }
    viewPageInfo["method"] = viewPageInfo["method"] || "initPage";
    viewPageInfo["view"] = viewPageInfo["view"] || viewPageInfo["page"] || "MapPage";
    const pageViewInfo = this.pageManager.getTopPage();
    if (!pageViewInfo) {
      this.pageManager.pushPage(viewPageInfo);
    }
  }

  goBack(successCallback, failureCallback) {
    if (this.envAppCore) {
      this.envAppCore.goBack();
    } else if (window["goBack"] && window["goBack"]["call"]) {
      window["goBack"]["call"]("goBack");
    }
  }

  gotoARPage(params, successCallback, failureCallback) {
    if (this.envAppCore && this.envAppCore.gotoARPage) {
      this.envAppCore.gotoARPage(params);
    }
  }

  routeReviced(routeData, successCallback, failureCallback) {}

  goBackToState(pageState, successCallback, failureCallback) {
    if (!pageState) {
      return;
    }
    const viewInfo = this.pageManager.getViewState(pageState);
    if (viewInfo) {
      this.goPage(viewInfo);
    } else {
      this.goBack();
    }
  }

  activeView(successCallback, failureCallback) {
    successCallback && successCallback();
  }

  changeUserTrackingMode(successCallback, failureCallback) {}

  goPage(viewPageInfo) {}

  openMapPage(bdid) {
    const viewPageInfo = { page: "MapPage", view: "MapPage", saveStack: true, method: "initPage", view: "MapPage" };
    this.goPage(viewPageInfo);
  }

  showPoiDetail(data, successCallback, failureCallback) {}

  openSelectPointPage(data) {}

  openMainPoiPage() {}

  openSearchPage(data) {}

  openSearchResultPage(data) {}

  openRoutePage(targetId, targetFloorId, targetLon, targetLat, targetName, startFloorId, startLon, startLat, startName, routeData) {}

  changeStartEndPoint(data, successCallback, failureCallback) {}

  startNavigation(options, successCallback, failureCallback) {}

  startSimulate(options, successCallback, failureCallback) {}

  takeToThere(options, successCallback, failureCallback) {}

  openVoiceSearch(arealType, successCallback, failureCallback) {}

  startListeningVoice(arealType, successCallback, failureCallback) {}

  stopListeningVoice(arealType, successCallback, failureCallback) {}

  watchBLEScan(successCB, failureCB) {}

  getRequestParam(url) {
    if (!url || url.indexOf("?") == -1) {
      return null;
    }
    const param = {};
    const searchString = url.split("?")[1];
    const tempArr = searchString.split("&");
    tempArr.forEach(function(item) {
      const kv = item.split("=");
      if (kv.length > 1) {
        param[kv[0]] = kv[1];
      } else {
        param[kv[0]] = "";
      }
    });
    return param;
  }

  getSignature(method, params, onSuccess, onError, timeStr) {}

  getSignatureParams(method, params, onSuccess, onError) {}

  showPoi(poiID, poiLon, poiLat, flID, name, poitype, address, successCallback, failureCallback) {}

  onNavigationFinished() {}

  closeNavigation(successCallback, failureCallback) {}

  exitApp(bdid, successCallback, failureCallback) {
    if (window["wx"]) {
      window["wx"]["closeWindow"]();
    }
  }

  postMessage(msg, args, successCallback, failureCallback) {}

  downloadPackage(token, bdid, successCallback, failureCallback) {
    if (window["exec"]) {
      this.downloadPackageCallback = successCallback;
      invokeNativeMethod(undefined, failureCallback, "downloadPackage", { bdid: bdid, token: token });
    }
  }

  addMessageListener(watchCB, innerCheckCB) {
    const thisObject = this;
    thisObject.watchCallback = watchCB;
    const dealCommand = (cmd) => {
      if (cmd["method"] == "goBack") {
        const result = watchCB(cmd);
        if (result && result["pageCount"]) {
          invokeNativeCallback(null, null, "goBackCallback", { pageCount: result["pageCount"] });
        }
      } else if (cmd["method"] == "onPackageDownloaded") {
        thisObject.downloadPackageCallback && thisObject.downloadPackageCallback();
      } else {
        watchCB(cmd);
      }
    };
    if (window["cordova"]) {
      cordova && cordova.exec(dealCommand, null, "DXJSBridge", "addMessageListener", []);
    }
  }

  openExhibitionPage(params) {
    this.envAppCore && this.envAppCore.openExhibitionPage(params);
  }

  openExhibitDetail(params, successCallback, failureCallback) {
    this.envAppCore && this.envAppCore.openExhibitDetail(params, successCallback, failureCallback);
  }

  openExhibitionDetail(params, successCallback, failureCallback) {
    this.envAppCore && this.envAppCore.openExhibitionDetail(params, successCallback, failureCallback);
  }

  openExtraPoiDetail(params) {
    this.envAppCore && this.envAppCore.openExtraPoiDetail(params);
  }

  shareToFriend(params, successCB, failureCB) {
    this.envAppCore && this.envAppCore.shareToFriend(params, successCB, failureCB);
  }

  chooseImage(params, successCB, failureCB) {
    this.envAppCore && this.envAppCore.chooseImage(params, successCB, failureCB);
  }

  openLocation(params, successCB, failedCB) {
    if (window["wx"]) {
      const targetName = (params["targetName"] || "") + " " + (params["name"] || "目的地");
      window["wx"]["openLocation"]({
        latitude: parseFloat(params["lat"]),
        longitude: parseFloat(params["lon"]),
        scale: 14,
        name: targetName,
        address: params["address"] || "",
        success: function(res) {
          successCB && successCB();
        },
        fail: function(res) {
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
        success: function(res) {
          successCB && successCB();
        },
        fail: function(res) {
          failedCB && failedCB();
        },
      });
    }
  }

  openOutdoorRoutePage(params, successCB, failureCB) {
    this.envAppCore && this.envAppCore.openOutdoorRoutePage(params, successCB, failureCB);
  }

  toUserPage(params, successCB, failureCB) {
    this.envAppCore && this.envAppCore.toUserPage(params, successCB, failureCB);
  }

  inviteFriendToGroup(params, successCB, failureCB) {
    this.envAppCore && this.envAppCore.inviteFriendToGroup(params, successCB, failureCB);
  }
}

// ==================== 全局导出 (兼容旧 API) ====================
// 为了保持向后兼容，同时支持 ES6 模块导出和全局变量
window["DXNativeDownloader"] = DXNativeDownloader;
window["DXJSBridge"] = DXJSBridge;
window["WebJSBridge"] = WebJSBridge;

// 微信 JSBridge 就绪处理
function onBridgeReady() {
  if (typeof WeixinJSBridge !== "undefined") {
    WeixinJSBridge.call("hideToolbar");
  }
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

// Cordova 初始化
const initCordova = function(options, cb) {
  const dxUtil = DaxiApp["utils"];
  const platform = options["platform"];
  const cordovaPath = options["cordovaPath"] || "../../../jsbridge/";
  if (platform == "android" || platform == "android_web") {
    dxUtil.loadScript(cordovaPath + "android/cordova.js", function() {
      window["cordova"].exec = window["cordova"]["require"]("cordova/exec");
      cb && cb(window["cordova"]);
    });
  } else if (platform == "ios" || platform == "ios_web") {
    dxUtil.loadScript(cordovaPath + "ios/cordova.js", function() {
      window["cordova"].exec = window["cordova"]["require"]("cordova/exec");
      cb && cb(window["cordova"]);
    });
  } else {
    cb && cb();
  }
};

DaxiApp.createJSBrigde = function(options, callback) {
  initCordova(options, function(cordova) {
    if (cordova && cordova["exec"] && window["DXJSBridge"]) {
      const jsBridge = new window["DXJSBridge"]();
      callback && callback(jsBridge);
    } else {
      const jsBridge = new window["WebJSBridge"]();
      callback && callback(jsBridge);
    }
  });
};

// ES6 模块导出
export { DXJSBridge, WebJSBridge, DXNativeDownloader, EventHandler, PageManager, DaxiApp };
