// ES6 Module Version of daxiapp.utils.js
// Auto-generated from IIFE format

// 全局 DaxiApp 对象
export const DaxiApp = window.DaxiApp || {};

// 复用 DaxiMap 的设备检测
DaxiApp.deviceType = window.DaxiMap ? window.DaxiMap.deviceType : {};

// 复用 DaxiMap 的事件系统和跨域通信
DaxiApp.EventHandler = window.EventHandler;
DaxiApp.EventHandlerManager = window.EventHandlerManager;
DaxiApp.Cross = window.Cross;

//////////////////////////////////////////////////////////////
// DXUtils - 工具库
//////////////////////////////////////////////////////////////
export const DXUtils = (function () {
  const thisObject = {
    sysParams: {},
    myScroll: null,
    animateTime: 300,
    lastCacheTime: 0,
    maxCacheInterval: 30000,
    cachedTrainData: [],
    Platform: DaxiApp.deviceType,
  };

  /**
   * 获取支付状态
   * @param {Object} params 参数对象，包含 getPayStatusUrl, token, bdid, userId
   * @param {Function} successCB 成功回调
   * @param {Function} failedCB 失败回调
   */
  thisObject.getPayStatus = (params, successCB, failedCB) => {
    const userId = params.userId;
    const url = `${params.getPayStatusUrl}?token=${params.token}&bdid=${params.bdid}&openid=${userId}&t=${new Date().getTime()}`;

    // TODO: 开发期间，暂未开发支付相关功能 (2025.12.29)
    successCB && successCB({});
  };

  /**
   * 获取建筑 ID
   * @param {Object} params 参数对象
   * @returns {string} 建筑 ID
   */
  thisObject.getBdid = (params) => {
    return params["bdid"] || params["poiid"] || params["buildingId"] || (window["launcher"] && window["launcher"]["getBdid"]()) || "B000A11DAF";
  };

  /**
   * 获取字符串值（带 URL 解码）
   * @param {string} val 原始值
   * @param {string} [defaultValue=""] 默认值
   * @returns {string} 解码后的字符串
   */
  thisObject.getStringVal = (val, defaultValue) => {
    return decodeURIComponent(val || defaultValue || "");
  };

  /**
   * 获取整数值
   * @param {*} val 原始值
   * @param {number} [defaultValue=0] 默认值
   * @returns {number} 整数
   */
  thisObject.getIntVal = (val, defaultValue) => {
    const result = parseInt(val, 10);
    return isNaN(result) ? parseInt(defaultValue, 10) || 0 : result;
  };

  /**
   * 获取浮点数值
   * @param {*} val 原始值
   * @param {number} [defaultValue=0] 默认值
   * @returns {number} 浮点数
   */
  thisObject.getFloatVal = (val, defaultValue) => {
    const result = parseFloat(val);
    return isNaN(result) ? parseFloat(defaultValue) || 0 : result;
  };

  /**
   * 获取布尔值
   * @param {*} val 原始值
   * @param {boolean} [defaultValue=false] 默认值
   * @returns {boolean} 布尔值
   */
  thisObject.getBooleanVal = (val, defaultValue) => {
    if (val === true || val === "true" || val === "1") {
      return true;
    }
    if (val === false || val === "false" || val === "0") {
      return false;
    }
    return defaultValue || false;
  };

  /**
   * 解析 URL 查询参数
   * @param {string} url URL 字符串
   * @returns {Object} 参数键值对对象
   */
  thisObject.parseLancherParam = (url) => {
    const result = {};
    const queryString = url.indexOf("?") !== -1 ? url.split("?")[1] : url.substr(1);
    queryString = queryString.split("#")[0];

    if (!queryString) return result;

    const pairs = queryString.split("&");
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i].split("=");
      if (pair[0]) {
        result[pair[0]] = pair[1] !== undefined ? decodeURIComponent(pair[1]) : "";
      }
    }
    return result;
  };

  /**
   * 从 URL 解析命令参数
   * @returns {Object} 格式化的命令配置对象
   */
  thisObject.getCommand = () => {
    const queryStr = location.search || location.hash;
    const params = thisObject.parseLancherParam(queryStr);

    if (location.hash) {
      const hashString = location.hash.substr(1);
      const hashArr = hashString.split("&");
      for (let i = 0; i < hashArr.length; i++) {
        const pair = hashArr[i].split("=");
        if (pair[1] && pair[1] !== "null") {
          params[pair[0]] = decodeURIComponent(pair[1]);
        }
      }
    }

    window.rawParams = params;

    const paramConfig = {
      method: { type: "string", defaultValue: "initPage" },
      buildingId: { type: "string", alias: ["poiid", "bdid"], defaultValue: "B000A11DAN" },
      token: { type: "string" },
      page: { type: "string", alias: ["showPage"], defaultValue: "MainPage" },
      initPage: { type: "string" },
      singlePage: { type: "string" },
      view: { type: "string", defaultValue: "MapPage" },
      keyword: { type: "string" },
      name: { type: "string" },
      poiIds: { type: "string" },
      poiId: { type: "string" },
      poiInfo: { type: "string" },
      address: { type: "string" },
      searchType: { type: "string" },
      floorId: { type: "string" },
      lon: { type: "float", defaultValue: 0 },
      lat: { type: "float", defaultValue: 0 },
      arealType: { type: "string" },
      startID: { type: "string" },
      startFloorId: { type: "string" },
      startLon: { type: "float", defaultValue: 0 },
      startLat: { type: "float", defaultValue: 0 },
      startFloorName: { type: "string" },
      startFloorCnName: { type: "string" },
      startName: { type: "string" },
      startPosMode: { type: "string" },
      startAddress: { type: "string" },
      targetID: { type: "string" },
      targetFloorId: { type: "string" },
      targetLon: { type: "float", defaultValue: 0 },
      targetLat: { type: "float", defaultValue: 0 },
      targetFloorName: { type: "string" },
      targetFloorCnName: { type: "string" },
      targetName: { type: "string" },
      targetPosMode: { type: "string" },
      targetAddress: { type: "string" },
      lines: { type: "string" },
      routeState: { type: "int", defaultValue: 3 },
      routeData: { type: "string" },
      strategy: { type: "string", defaultValue: "0" },
      goRoute: { type: "bool", defaultValue: false },
      simulate: { type: "bool", defaultValue: false },
      showTopMargin: { type: "string", defaultValue: "false" },
      topMargin: { type: "string" },
      bottomMargin: { type: "string" },
      floatTopMargin: { type: "string" },
      floatBottomMargin: { type: "string" },
      floatLeftBottomMargin: { type: "string" },
      floatLeftRightMargin: { type: "string" },
      userTrackingMode: { type: "int", defaultValue: 0 },
      showPano: { type: "bool", defaultValue: false },
      showToOutDoorBtn: { type: "bool", defaultValue: false },
      showParking: { type: "bool", defaultValue: false },
      showShare: { type: "bool" },
      title: { type: "string" },
      platform: { type: "string", defaultValue: "web" },
      deviceId: { type: "string", defaultValue: "" },
      wbrs: { type: "string", defaultValue: "false" },
      depend: { type: "string", defaultValue: "false" },
      runDepend: { type: "string", defaultValue: "3dmap" },
      resVersion: { type: "string", defaultValue: "" },
      configMD5: { type: "string" },
      domain: { type: "string" },
      bdlistUrl: { type: "string" },
      actionType: { type: "string", defaultValue: "wait/arrive" },
      autoExit: { type: "string" },
      locationCitycode: { type: "string" },
      indoorMapInited: { type: "bool", defaultValue: true },
      ccb: { type: "string" },
      mainContentID: { type: "string" },
      perItemCount: { type: "int", defaultValue: 1 },
      logLevel: { type: "int" },
      merchantCode: { type: "string" },
      action: { type: "string" },
      patientId: { type: "string" },
      code: { type: "string" },
      userId: { type: "string" },
      extendParams: { type: "string" },
    };

    const command = {};
    Object.assign(command, params);

    for (let key in paramConfig) {
      const config = paramConfig[key];
      let value = params[key];

      if (value === undefined && config.alias) {
        for (let j = 0; j < config.alias.length; j++) {
          if (params[config.alias[j]] !== undefined) {
            value = params[config.alias[j]];
            break;
          }
        }
      }

      switch (config.type) {
        case "string":
          command[key] = thisObject.getStringVal(value, config.defaultValue);
          break;
        case "int":
          command[key] = thisObject.getIntVal(value, config.defaultValue);
          break;
        case "float":
          command[key] = thisObject.getFloatVal(value, config.defaultValue);
          break;
        case "bool":
          command[key] = thisObject.getBooleanVal(value, config.defaultValue);
          break;
        default:
          command[key] = value || config.defaultValue || "";
      }
    }

    command.isInit = true;
    command.isMultiScenes = params.mcp === "true" || params.mcp === "1";
    command.provider = params.provider || "dx";
    command.v = params.v || 1;
    command.speed = params.speed || "1.0";
    command.themeStyle = params.themeStyle || "";
    command.pointType = params.pointType || "";

    return command;
  };

  /**
   * 将距离数值转换为可读文本
   * @param {number|string} distance 距离（米）
   * @returns {string} 格式化的距离文本
   */
  thisObject.distanceToText = (distance) => {
    distance = Number(distance);
    if (!distance || distance <= 0) {
      return "";
    }

    const lang = window.langData || {};

    if (distance >= 1000) {
      const km = distance / 1000;
      return km.toFixed(km >= 10 ? 1 : 2) + (lang.kilometer || "公里");
    }

    return Math.round(distance) + (lang["meter:distance"] || "米");
  };

  /**
   * 向数组添加不重复的回调函数
   * @param {Array} arr 回调数组
   * @param {Function} cb 回调函数
   */
  thisObject.addCallback = (arr, cb) => {
    if (arr.indexOf(cb) === -1) {
      arr.push(cb);
    }
  };

  /**
   * 从数组移除回调函数
   * @param {Array} arr 回调数组
   * @param {Function} cb 回调函数
   */
  thisObject.removeCallback = (arr, cb) => {
    const index = arr.indexOf(cb);
    if (index !== -1) {
      arr.splice(index, 1);
    }
  };

  /**
   * 触发数组中的所有回调函数
   * @param {Array} arr 回调数组
   * @param {Array} [params] 传递给回调的参数数组
   */
  thisObject.trigger = (arr, params) => {
    params = params || [];
    for (let i = 0; i < arr.length; i++) {
      arr[i].apply(null, params);
    }
  };

  /**
   * 验证中国大陆手机号
   * @param {string} phoneNumber 手机号
   * @returns {boolean} 是否有效
   */
  thisObject.isValidPhoneNumber = (phoneNumber) => {
    return /^1[3-9]\d{9}$/.test(phoneNumber);
  };

  /**
   * 预加载图片
   * @param {Array} imageUrls 图片 URL 数组
   * @param {string} [baseURL=""] 基础 URL 前缀
   * @returns {Promise} 全部加载完成后 resolve
   */
  thisObject.preloadImages = (imageUrls, baseURL) => {
    baseURL = baseURL || "";
    return new Promise((resolve, reject) => {
      if (!imageUrls || !imageUrls.length) {
        return resolve();
      }

      let loadedCount = 0;
      const totalCount = imageUrls.length;

      imageUrls.forEach((url) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === totalCount) {
            resolve();
          }
        };
        img.onerror = () => {
          loadedCount++;
          console.warn("Image load failed:", baseURL + url);
          if (loadedCount === totalCount) {
            resolve();
          }
        };
        img.src = baseURL + url;
      });
    });
  };

  /**
   * 将秒数格式化为 "MM:SS" 格式
   * @param {number} totalSeconds 总秒数
   * @returns {string} 格式化的时间字符串
   */
  thisObject.formatSecondsToTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  /**
   * 生成随机十六进制字符串
   * @param {number} length 字节数
   * @returns {string} 十六进制字符串
   */
  const randomHex = (length) => {
    let hex = "";
    for (let i = 0; i < length; i++) {
      hex += Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0");
    }
    return hex;
  };

  /**
   * 生成 UUID
   * @returns {string} UUID 字符串
   */
  thisObject.createUUID = () => {
    return `${randomHex(4)}-${randomHex(2)}-${randomHex(2)}-${randomHex(2)}-${randomHex(6)}`;
  };

  /**
   * 动态加载外部脚本或 JSON 文件
   * @param {string} url - 资源 URL
   * @param {Function} callback - 加载成功回调
   * @param {Function} [failedCB] - 加载失败回调
   */
  thisObject.loadScript = (url, callback, failedCB) => {
    const isJSON = url.includes(".json");

    if (isJSON) {
      thisObject.getDataTextViaBlob(url, callback, failedCB);
      return;
    }

    const script = document.createElement("script");
    script.type = "text/javascript";

    const onLoadComplete = () => {
      callback && callback();
    };

    const onLoadError = (e) => {
      console.error("Script load failed:", url, e);
      failedCB && failedCB(e);
    };

    if (script.readyState) {
      script.onreadystatechange = function () {
        if (script.readyState === "loaded" || script.readyState === "complete") {
          script.onreadystatechange = null;
          onLoadComplete();
        }
      };
    } else {
      script.onload = onLoadComplete;
      script.onerror = onLoadError;
    }

    script.src = url;
    document.body.appendChild(script);
  };

  /**
   * 递归加载脚本列表
   * @param {Array} fileList 脚本列表
   * @param {number} [index=0] 当前索引
   * @param {Function} [successCB] 每个脚本加载成功回调
   * @param {Function} [failedCB] 脚本加载失败回调
   */
  thisObject.loadScriptRecursive = (fileList, index, successCB, failedCB) => {
    if (!fileList || !fileList.length) {
      failedCB && failedCB("fileList is empty");
      return;
    }

    index = index || 0;

    if (index >= fileList.length) {
      return;
    }

    const item = fileList[index];
    let url, onSuccess, onFailed;

    if (typeof item === "object") {
      url = item.url;
      onSuccess = item.successCB || successCB;
      onFailed = item.failedCB || failedCB;
    } else {
      url = item;
      onSuccess = successCB;
      onFailed = failedCB;
    }

    thisObject.loadScript(
      url,
      (data) => {
        onSuccess && onSuccess(data);
        thisObject.loadScriptRecursive(fileList, index + 1, successCB, failedCB);
      },
      (error) => {
        const shouldContinue = onFailed && onFailed(error);
        if (shouldContinue === true) {
          thisObject.loadScriptRecursive(fileList, index + 1, successCB, failedCB);
        }
      },
    );
  };

  /**
   * 初始化 Cordova 环境
   * @param {string} platform 平台类型
   * @param {Function} [callbackFn] 初始化完成回调
   */
  thisObject.initCordova = (platform, callbackFn) => {
    const platformPaths = {
      android: "../dependency/android/cordova.js",
      ios: "../dependency/ios/cordova.js",
    };

    const cordovaPath = platformPaths[platform];

    if (!cordovaPath) {
      callbackFn && callbackFn();
      return;
    }

    thisObject.loadScript(cordovaPath, () => {
      window.cordova.exec = window.cordova.require("cordova/exec");
      callbackFn && callbackFn();
    });
  };

  /**
   * 加载语言文件
   * @param {string} [lang="zh"] 语言代码
   * @param {Function} [successFn] 成功回调
   * @param {Function} [failedFn] 失败回调
   */
  thisObject.loadLangFile = (lang, successFn, failedFn) => {
    lang = lang || "zh";
    const url = `../langs/${lang}.json`;
    thisObject.getDataJsonViaBlob(url, successFn, failedFn);
  };

  /**
   * 通用路径解析函数
   * @private
   * @param {string} path 原始路径
   * @param {string} baseUrlKey window 上的基础 URL 变量名
   * @returns {string} 解析后的完整路径
   */
  const _resolveUrl = (path, baseUrlKey) => {
    const command = thisObject.getCommand();
    if (!path) {
      return "";
    }
    path = path.replace("$token", command.token).replace("$bdid", command.buildingId);
    if (path.indexOf("http") === -1) {
      return window[baseUrlKey] + path;
    }
    return path;
  };

  /**
   * 添加数据路径
   * @param {string} path 路径
   * @returns {string} 完整路径
   */
  thisObject.addDataPath = (path) => {
    return _resolveUrl(path, "dataPath");
  };

  /**
   * 添加项目路径
   * @param {string} path 路径
   * @returns {string} 完整路径
   */
  thisObject.addProjectUrl = (path) => {
    return _resolveUrl(path, "projectUrl");
  };

  /**
   * 添加景区路径
   * @param {string} path 路径
   * @returns {string} 完整路径
   */
  thisObject.addScenicUrl = (path) => {
    return _resolveUrl(path, "scenicUrl");
  };

  /**
   * 解析地理围栏数据
   * @param {Object} geofenceData 地理围栏数据
   * @returns {Object} 解析后的数据
   */
  thisObject.parseGeofenceObject = (geofenceData) => {
    const DEGREE_TO_SECOND = 1 / 3600.0;

    const convertCoordinatesArray = (coords) => {
      for (let j = 0; j < coords.length; j++) {
        coords[j][0] *= DEGREE_TO_SECOND;
        coords[j][1] *= DEGREE_TO_SECOND;
      }
    };

    const convertCoordinates = (coords) => {
      coords[0] *= DEGREE_TO_SECOND;
      coords[1] *= DEGREE_TO_SECOND;
    };

    const fieldConfigs = [
      {
        key: "geofences",
        path: (f) => f.geometry.coordinates[0],
        isPoint: false,
      },
      {
        key: "flInfo",
        path: (f) => f.geometry.coordinates[0],
        isPoint: false,
      },
      {
        key: "roadMapLinks",
        path: (f) => f.geometry.coordinates,
        isPoint: false,
      },
      {
        key: "ble",
        path: (f) => f.geometry.coordinates,
        isPoint: true,
      },
      {
        key: "checkpoints",
        path: (f) => f.geometry.coordinates,
        isPoint: true,
      },
    ];

    const result = {};

    for (let dataKey in geofenceData) {
      if (!geofenceData.hasOwnProperty(dataKey)) continue;

      const obj = geofenceData[dataKey];

      for (let i = 0; i < fieldConfigs.length; i++) {
        const config = fieldConfigs[i];
        if (obj[config.key] && obj[config.key].features) {
          const features = obj[config.key].features;
          for (let j = 0; j < features.length; j++) {
            const coords = config.path(features[j]);
            if (config.isPoint) {
              convertCoordinates(coords);
            } else {
              convertCoordinatesArray(coords);
            }
          }
          result[config.key] = features;
        }
      }
    }

    return result;
  };

  /**
   * 将 ArrayBuffer 转换为字符串
   * @param {ArrayBuffer} buffer 二进制数据
   * @param {string} [encoding="utf-8"] 字符编码
   * @param {Function} [callbackFn] 回调函数
   * @returns {string} 如果不传回调则同步返回字符串
   */
  thisObject.arraybufferToString = (buffer, encoding, callbackFn) => {
    encoding = encoding || "utf-8";
    const text = new TextDecoder(encoding).decode(buffer);
    if (callbackFn) {
      callbackFn(text);
    }
    return text;
  };

  /**
   * 通用 XHR 请求函数
   * @param {Object} options 请求配置
   * @returns {XMLHttpRequest|null} XHR 对象
   */
  thisObject.request = (options) => {
    const xhr = thisObject.getHttpObject();
    if (!xhr) return null;

    const method = (options.method || "GET").toUpperCase();
    const url = options.url;
    const timeout = options.timeout || 15000;

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;

      if (xhr.status === 200 || xhr.status === 304 || xhr.status === 0) {
        options.success && options.success(xhr.response);
      } else {
        options.error && options.error({ status: xhr.status, statusText: xhr.statusText });
      }
    };

    xhr.onerror = function (e) {
      options.error && options.error(e);
    };

    xhr.ontimeout = function (e) {
      console.warn("Request timeout:", url);
      options.error && options.error(e);
    };

    xhr.open(method, url, true);

    if (options.responseType) {
      xhr.responseType = options.responseType;
    }

    xhr.timeout = timeout;

    if (options.headers) {
      for (let key in options.headers) {
        if (options.headers.hasOwnProperty(key)) {
          xhr.setRequestHeader(key, options.headers[key]);
        }
      }
    }

    xhr.send(options.body || null);
    return xhr;
  };

  /**
   * 通过 POST 请求获取 JSON 数据
   * @param {string} url 请求地址
   * @param {Object} data 请求数据
   * @param {Function} [successFn] 成功回调
   * @param {Function} [failedFn] 失败回调
   * @returns {XMLHttpRequest} 请求对象
   */
  thisObject.getDataByPostRaw = (url, data, successFn, failedFn) => {
    return thisObject.request({
      method: "POST",
      url: url,
      headers: { "Content-Type": "application/json" },
      responseType: "json",
      body: JSON.stringify(data),
      success: successFn,
      error: failedFn,
    });
  };

  /**
   * 通过 POST 上传 FormData 数据
   * @param {string} url 请求地址
   * @param {Object} data 表单数据对象
   * @param {Function} [successFn] 成功回调
   * @param {Function} [failedFn] 失败回调
   * @returns {XMLHttpRequest} 请求对象
   */
  thisObject.postDataXHR = (url, data, successFn, failedFn) => {
    const formData = new FormData();
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        formData.append(key, data[key]);
      }
    }

    return thisObject.request({
      method: "POST",
      url: url,
      body: formData,
      success: successFn,
      error: failedFn,
    });
  };

  /**
   * 根据请求类型自动选择合适的请求方法
   * @param {string} url 请求地址
   * @param {string} [method="GET"] 请求方法
   * @param {Object} data 请求数据
   * @param {Function} [successFn] 成功回调
   * @param {Function} [failedFn] 失败回调
   * @param {string} [type="json"] 响应类型
   * @returns {XMLHttpRequest} 请求对象
   */
  thisObject.getDataBySecurityRequest = (url, method, data, successFn, failedFn, type) => {
    method = (method || "GET").toUpperCase();
    type = type || "json";

    if (method === "POST" || type === "rawPost") {
      return thisObject.getDataByPostRaw(url, data, successFn, failedFn);
    }

    if (url.indexOf("?") === -1) {
      url += "?";
    }

    if (type === "json") {
      return thisObject.getData(url, data, "json", successFn, failedFn);
    }

    const fullUrl = thisObject.jsonToUrl(url, data);
    return thisObject.getDataTextViaBlob(fullUrl, successFn, failedFn);
  };

  /**
   * 将对象参数拼接到 URL
   * @param {string} url 基础 URL
   * @param {Object} data 参数对象
   * @returns {string} 拼接后的完整 URL
   */
  thisObject.jsonToUrl = (url, data) => {
    if (!data || typeof data !== "object") {
      return url || "";
    }

    const params = [];

    for (let key in data) {
      if (!data.hasOwnProperty(key)) continue;

      const value = data[key];
      if (value === undefined || value === null || value === "") continue;

      const encodedKey = encodeURIComponent(key);
      if (url.indexOf(`${encodedKey}=`) !== -1) continue;

      params.push(`${encodedKey}=${encodeURIComponent(value)}`);
    }

    if (!params.length) {
      return url;
    }

    const separator = url.indexOf("?") === -1 ? "?" : "&";
    return `${url}${separator}${params.join("&")}`;
  };

  /**
   * 通过 Blob 方式下载文本
   * @param {string} url 数据路径
   * @param {Function} [successFn] 成功回调
   * @param {Function} [failedFn] 失败回调
   * @returns {XMLHttpRequest} 请求对象
   */
  thisObject.getDataTextViaBlob = (url, successFn, failedFn) => {
    return thisObject.loadByteStream(
      url,
      (arrayBuffer) => {
        const text = thisObject.arraybufferToString(arrayBuffer, "utf-8");
        successFn && successFn(text);
      },
      failedFn,
    );
  };

  /**
   * 通过 Blob 方式下载 JSON
   * @param {string} url 数据路径
   * @param {Function} [successFn] 成功回调
   * @param {Function} [failedFn] 失败回调
   * @returns {XMLHttpRequest} 请求对象
   */
  thisObject.getDataJsonViaBlob = (url, successFn, failedFn) => {
    return thisObject.loadByteStream(
      url,
      (arrayBuffer) => {
        try {
          const text = thisObject.arraybufferToString(arrayBuffer, "utf-8");
          const json = JSON.parse(text);
          successFn && successFn(json);
        } catch (e) {
          console.error("JSON parse error:", e);
          failedFn && failedFn(e);
        }
      },
      failedFn,
    );
  };

  /**
   * 下载 ArrayBuffer 数据
   * @param {string} url 数据路径
   * @param {Function} [successFn] 成功回调
   * @param {Function} [failedFn] 失败回调
   * @returns {XMLHttpRequest|null} 请求对象
   */
  thisObject.loadByteStream = (url, successFn, failedFn) => {
    return thisObject.request({
      method: "GET",
      url: url,
      responseType: "arraybuffer",
      success: (response) => {
        if (response) {
          successFn && successFn(response);
        } else {
          failedFn && failedFn("No response data");
        }
      },
      error: failedFn,
    });
  };

  /**
   * 创建 XMLHttpRequest 对象
   * @returns {XMLHttpRequest|null} XHR 对象
   */
  thisObject.getHttpObject = () => {
    if (window.XMLHttpRequest) {
      return new XMLHttpRequest();
    }
    if (window.ActiveXObject) {
      return new ActiveXObject("Microsoft.XMLHTTP");
    }
    return null;
  };

  /**
   * 通过 GET 方法下载数据
   * @param {string} url 数据路径
   * @param {Object} [data] 请求参数
   * @param {string} [dataType="text"] 期望的响应类型
   * @param {Function} [successFn] 成功回调
   * @param {Function} [failedFn] 失败回调
   * @param {boolean} [isAsync=true] 是否异步
   * @returns {XMLHttpRequest} XHR 对象
   */
  thisObject.getData = (url, data, dataType, successFn, failedFn, isAsync) => {
    const xhr = thisObject.getHttpObject();
    if (!xhr) return null;

    isAsync = isAsync !== false;

    xhr.ontimeout = () => {
      failedFn && failedFn({ errMsg: "Timeout" });
    };

    xhr.onerror = (e) => {
      failedFn && failedFn(e);
    };

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;

      if (xhr.status !== 200 && xhr.status !== 304) {
        failedFn && failedFn({ status: xhr.status, response: xhr.responseText });
        return;
      }

      const contentType = xhr.getResponseHeader("Content-Type") || "";
      let result;

      try {
        if (contentType.indexOf("xml") !== -1 && xhr.responseXML) {
          result = xhr.responseXML;
        } else if (contentType.indexOf("application/json") !== -1 || dataType === "json") {
          result = JSON.parse(xhr.responseText);
        } else {
          result = xhr.responseText;
        }
        successFn && successFn(result);
      } catch (e) {
        console.error("getData parse error:", e);
        console.log("错误数据", { url, data, dataType });
        failedFn && failedFn(e);
      }
    };

    url = thisObject.jsonToUrl(url, data);
    xhr.open("GET", url, isAsync);
    xhr.timeout = 15000;
    xhr.send(null);

    return xhr;
  };

  /**
   * 获取图片资源 URL
   * @param {string} path 图片路径
   * @returns {string} 完整的图片 URL
   */
  thisObject.getImgUrl = (path) => {
    const envSuffix = window.currentEnv === "uat" ? "-beta" : "";
    return `https://apigm${envSuffix}.huawei.com/api/map-feature-material/map-materials/${path}?X-MAG-ID=com.huawei.livespace`;
  };

  /**
   * 获取地图数据 URL
   * @param {string} path 数据路径
   * @returns {string} 完整的数据 URL
   */
  thisObject.getMapUrl = (path) => {
    if (window.HWH5) {
      const envSuffix = window.currentEnv === "uat" ? "-beta" : "";
      const url = `https://apigw${envSuffix}.huawei.com/api/map-static-v2/data/${path}`;
      return thisObject.jsonToUrl(url, window.additionalQuery || {});
    }
    return `../../../data/${path}`;
  };

  /**
   * 添加埋点记录
   * @param {string} eventName 事件名称
   * @param {Object} [data] 附加数据
   */
  thisObject.addRecord = (eventName, data) => {
    const doRecord = () => {
      const config = thisObject.recordList[eventName];
      if (!config || !window.hwa) return;

      if (config.type === "trackStructEvent") {
        window.hwa("trackStructEvent", {
          uem_id: config.uem_id,
          uem_label: config.uem_label,
          data: data,
        });
      } else if (config.type === "trackPageView") {
        window.hwa("trackPageView", config.id, { data: data });
      }
    };

    if (thisObject.recordList) {
      doRecord();
      return;
    }

    const url = thisObject.getMapUrl("config/config/record.json");
    thisObject.getData(
      url,
      {},
      "json",
      (res) => {
        thisObject.recordList = res;
        doRecord();
      },
      (err) => {
        console.warn("获取 record.json 失败:", err);
      },
    );
  };

  /**
   * 深拷贝数据
   * @param {Object} data 源数据
   * @returns {Object} 深拷贝后的数据
   */
  thisObject.copyData = (data) => {
    const str = JSON.stringify(data);
    return JSON.parse(str);
  };

  /**
   * 创建带方法名的命令对象
   * @param {string} method 方法名
   * @param {Object} [data] 原始数据
   * @param {string} [retVal="OK"] 返回值标识
   * @returns {Object} 命令对象
   */
  thisObject.createCommandByCloneData = (method, data, retVal) => {
    const command = thisObject.copyData(data || {});
    command.method = method;
    command.retVal = DaxiApp.defaultValue(retVal, "OK");
    return command;
  };

  /**
   * 比较两个对象是否相同
   * @param {Object} objA 对象 A
   * @param {Object} objB 对象 B
   * @returns {boolean} 是否相同
   */
  thisObject.compareObj = (objA, objB) => {
    return JSON.stringify(objA) === JSON.stringify(objB);
  };

  /**
   * 创建类型检查函数
   * @param {string} type 类型名称
   * @returns {Function} 类型检查函数
   */
  const createTypeChecker = (type) => {
    return (obj) => {
      return Object.prototype.toString.call(obj) === `[object ${type}]`;
    };
  };

  thisObject.isObject = createTypeChecker("Object");
  thisObject.isString = createTypeChecker("String");
  thisObject.isArray = Array.isArray || createTypeChecker("Array");
  thisObject.isFunction = createTypeChecker("Function");
  thisObject.isUndefined = createTypeChecker("Undefined");

  /** 模态框组件 */
  thisObject.modal = (function () {
    let modalEl = null;
    let timer = null;
    let currentCallback = null;

    const createModal = (options) => {
      const div = document.createElement("div");
      div.id = "modal";
      div.innerHTML = `
        <div class="layerhide"></div>
        <div class="modal-content">
          <div class="modal-confirm-content">
            ${options.img ? `<div class="modal-confirm-content-img"><img src="${options.img}" alt=""></div>` : ""}
            ${options.text ? `<div class="modal-confirm-content-text">${options.text}</div>` : ""}
            ${options.detail ? `<div class="modal-confirm-content-detail">${options.detail}</div>` : ""}
            ${options.html ? `<div class="modal-confirm-content-box">${options.html}</div>` : ""}
            <div class="modal-footer">
              ${options.buttons
                .map((btn, i) => {
                  return `<div class="btn_modal" data-index="${i + 1}">${btn}</div>`;
                })
                .join("")}
            </div>
          </div>
        </div>
      `;
      return div;
    };

    const bindEvents = (options) => {
      const buttons = modalEl.querySelectorAll(".btn_modal");
      buttons.forEach((btn) => {
        btn.addEventListener("click", function () {
          const index = this.getAttribute("data-index");
          if (currentCallback) {
            currentCallback(index);
          }
          if (options.autoClose !== false) {
            modal.destroy();
          }
        });
      });
    };

    const startCountdown = (seconds, updateFn) => {
      let remaining = seconds;
      const firstBtn = modalEl.querySelector(".btn_modal");

      const tick = () => {
        updateFn && updateFn(remaining);

        if (remaining > 0) {
          firstBtn.textContent = `关闭 (${remaining})`;
          timer = setTimeout(tick, 1000);
          remaining--;
        } else {
          firstBtn.textContent = "关闭";
          updateFn && updateFn(0);
          modal.destroy();
        }
      };

      tick();
    };

    const modal = {
      visible: false,

      show: (params) => {
        params = params || {};

        if (modalEl) {
          this.destroy();
        }

        const options = {
          text: params.text || "",
          detail: params.detail || "",
          img: params.img || "",
          html: params.html || "",
          buttons: params.btnArr || ["确认"],
          autoClose: params.autoClose !== false,
        };

        currentCallback = params.callback;

        modalEl = createModal(options);
        document.body.appendChild(modalEl);

        if (options.buttons.length === 1) {
          const btn = modalEl.querySelector(".btn_modal");
          btn.style.minWidth = "62%";
        }

        bindEvents(options);

        if (params.time) {
          startCountdown(parseInt(params.time), params.timerUpdateCallback);
        }

        this.visible = true;
      },

      destroy: () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        if (modalEl && modalEl.parentNode) {
          modalEl.parentNode.removeChild(modalEl);
        }
        modalEl = null;
        currentCallback = null;
        this.visible = false;
      },

      stopCountdown: () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
    };

    return modal;
  })();

  return thisObject;
})();

// 导出 DXUtils
export { DXUtils };

// 注意：其余部分（Vector3, Matrix4, DXDownloader, MapSearch, GCJ2WGSUtils 等）
// 需要在后续文件中继续转换
