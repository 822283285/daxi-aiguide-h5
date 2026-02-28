// ES6 Module Version of daxiapp.utils.js
// Converted from IIFE to ES6 modules

import { DaxiMap, EventHandler, EventHandlerManager, Cross } from '../../map_sdk/map/daximap.utils.js';

// Global DaxiApp object
export const DaxiApp = window.DaxiApp || {};



  // 复用 DaxiMap 的设备检测
  DaxiApp.deviceType = window.DaxiMap ? window.DaxiMap.deviceType : {};

  // 复用 DaxiMap 的事件系统和跨域通信
  DaxiApp["EventHandler"] = window.EventHandler; // 复用事件系统
  DaxiApp["EventHandlerManager"] = window.EventHandlerManager; // 复用事件管理器
  DaxiApp["Cross"] = window.Cross; // 复用跨域通信类

  //////////////////////////////////////////////////////////////
  // DXUtils - 工具库
  //////////////////////////////////////////////////////////////
  export const DXUtils = (() => {
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

      // TODO: 开发期间，暂未开发支付相关功能(2025.12.29)
      successCB && successCB({});

      // thisObject.getDataJsonViaBlob(
      //   url,
      //   function (result) {
      //     successCB && successCB(result);
      //   },
      //   function (error) {
      //     failedCB && failedCB(error);
      //   }
      // );
    };

    /**
     * 获取建筑ID
     * @param {Object} params 参数对象
     * @returns {string} 建筑ID
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
      queryString = queryString.split("#")[0]; // 移除 hash 部分

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
      // 解析 URL 参数
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

      // 保存原始参数
      window.rawParams = params;

      // 参数配置表（type: string/int/float/bool, defaultValue, alias: 别名数组）
      const paramConfig = {
        // 基础参数
        method: { type: "string", defaultValue: "initPage" },
        buildingId: { type: "string", alias: ["poiid", "bdid"], defaultValue: "B000A11DAN" },
        token: { type: "string" },
        page: { type: "string", alias: ["showPage"], defaultValue: "MainPage" },
        initPage: { type: "string" },
        singlePage: { type: "string" },
        view: { type: "string", defaultValue: "MapPage" },

        // 搜索相关
        keyword: { type: "string" },
        name: { type: "string" },
        poiIds: { type: "string" },
        poiId: { type: "string" },
        poiInfo: { type: "string" },
        address: { type: "string" },
        searchType: { type: "string" },

        // 位置相关
        floorId: { type: "string" },
        lon: { type: "float", defaultValue: 0 },
        lat: { type: "float", defaultValue: 0 },
        arealType: { type: "string" },

        // 起点参数
        startID: { type: "string" },
        startFloorId: { type: "string" },
        startLon: { type: "float", defaultValue: 0 },
        startLat: { type: "float", defaultValue: 0 },
        startFloorName: { type: "string" },
        startFloorCnName: { type: "string" },
        startName: { type: "string" },
        startPosMode: { type: "string" },
        startAddress: { type: "string" },

        // 终点参数
        targetID: { type: "string" },
        targetFloorId: { type: "string" },
        targetLon: { type: "float", defaultValue: 0 },
        targetLat: { type: "float", defaultValue: 0 },
        targetFloorName: { type: "string" },
        targetFloorCnName: { type: "string" },
        targetName: { type: "string" },
        targetPosMode: { type: "string" },
        targetAddress: { type: "string" },

        // 路线相关
        lines: { type: "string" },
        routeState: { type: "int", defaultValue: 3 },
        routeData: { type: "string" },
        strategy: { type: "string", defaultValue: "0" },
        goRoute: { type: "bool", defaultValue: false },
        simulate: { type: "bool", defaultValue: false },

        // 界面相关
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

        // 配置相关
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

        // 业务相关
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

      // 构建 command 对象
      const command = {};

      Object.assign(command, params);

      for (let key in paramConfig) {
        const config = paramConfig[key];
        const value = params[key];

        // 处理别名
        if (value === undefined && config.alias) {
          for (let j = 0; j < config.alias.length; j++) {
            if (params[config.alias[j]] !== undefined) {
              value = params[config.alias[j]];
              break;
            }
          }
        }

        // 类型转换
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

      // 特殊参数处理
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
     * @param {Array} imageUrls 图片URL数组
     * @param {string} [baseURL=""] 基础URL前缀
     * @returns {Promise} 全部加载完成后 resolve
     */
    thisObject.preloadImages = (imageUrls, baseURL) => {
      baseURL = baseURL || "";
      return new Promise((resolve, reject) => {
        if (!imageUrls || !imageUrls.length) {
          return resolve();
        }

        const loadedCount = 0;
        const totalCount = imageUrls.length;

        imageUrls.forEach((url) => {
          const img = new Image();
          img.onload = () => {
            loadedCount++;
            if (loadedCount === totalCount) {
              resolve();
            }
          };
          img.onerror = (e) => {
            loadedCount++;
            console.warn(`Image load failed: ${baseURL}${url}`);
            if (loadedCount === totalCount) {
              resolve();
            }
          };
          img.src = `${baseURL}${url}`;
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
     * 生成 UUID (格式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
     * @returns {string} UUID 字符串
     */
    thisObject.createUUID = () => {
      return `${randomHex(4)}-${randomHex(2)}-${randomHex(2)}-${randomHex(2)}-${randomHex(6)}`;
    };

    /**
     * 动态加载外部脚本或JSON文件
     * @param {string} url - 资源URL
     * @param {Function} callback - 加载成功回调
     * @param {Function} [failedCB] - 加载失败回调（可选）
     */
    thisObject.loadScript = (url, callback, failedCB) => {
      const isJSON = url.includes(".json");

      if (isJSON) {
        thisObject.getDataTextViaBlob(url, callback, failedCB);
        return;
      }

      const script = document.createElement("script");
      script.type = "text/javascript";

      // 绑定加载完成事件
      const onLoadComplete = () => {
        callback && callback();
      };

      // 绑定加载失败事件
      const onLoadError = (e) => {
        console.error("Script load failed:", url, e);
        failedCB && failedCB(e);
      };

      // IE 浏览器使用 readyState
      if (script.readyState) {
        script.onreadystatechange = () => {
          if (script.readyState === "loaded" || script.readyState === "complete") {
            script.onreadystatechange = null;
            onLoadComplete();
          }
        };
      } else {
        // 现代浏览器：Firefox, Safari, Chrome, Opera, Edge
        script.onload = onLoadComplete;
        script.onerror = onLoadError;
      }

      script.src = url;
      document.body.appendChild(script);
    };

    /**
     * 递归加载脚本列表
     * @param {Array} fileList 脚本列表（可以是 URL 字符串或 {url, successCB, failedCB} 对象）
     * @param {number} [index=0] 当前索引
     * @param {Function} [successCB] 每个脚本加载成功回调
     * @param {Function} [failedCB] 脚本加载失败回调（返回 true 可继续加载后续脚本）
     */
    thisObject.loadScriptRecursive = (fileList, index, successCB, failedCB) => {
      // 参数校验
      if (!fileList || !fileList.length) {
        failedCB && failedCB("fileList is empty");
        return;
      }

      index = index || 0;

      // 全部加载完成
      if (index >= fileList.length) {
        return;
      }

      // 解析当前项
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

      // 加载脚本
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
     * @param {string} platform 平台类型 ("android" | "ios")
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
    }

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
     * 解析地理围栏数据，将坐标从秒转换为度
     * @param {Object} geofenceData 地理围栏数据
     * @returns {Object} 解析后的数据 { floors, building, roadMapLink, ble, checkpoints }
     */
    thisObject.parseGeofenceObject = (geofenceData) => {
      const DEGREE_TO_SECOND = 1 / 3600.0;

      // 转换坐标数组（多边形/线段）
      const convertCoordinatesArray = (coords) => {
        for (let j = 0; j < coords.length; j++) {
          coords[j][0] *= DEGREE_TO_SECOND;
          coords[j][1] *= DEGREE_TO_SECOND;
        }
      }

      // 转换单个坐标（点）
      const convertCoordinates = (coords) => {
        coords[0] *= DEGREE_TO_SECOND;
        coords[1] *= DEGREE_TO_SECOND;
      }

      // 数据字段配置 { key: 字段名, path: 坐标路径, isPoint: 是否为点坐标 }
      const fieldConfigs = [
        {
          key: "geofences",
          path: (f) => {
            return f.geometry.coordinates[0];
          },
          isPoint: false,
        },
        {
          key: "flInfo",
          path: (f) => {
            return f.geometry.coordinates[0];
          },
          isPoint: false,
        },
        {
          key: "roadMapLinks",
          path: (f) => {
            return f.geometry.coordinates;
          },
          isPoint: false,
        },
        {
          key: "ble",
          path: (f) => {
            return f.geometry.coordinates;
          },
          isPoint: true,
        },
        {
          key: "checkpoints",
          path: (f) => {
            return f.geometry.coordinates;
          },
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
     * @param {Function} [callbackFn] 回调函数（兼容旧 API）
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
     * @param {string} options.url 请求地址
     * @param {string} [options.method="GET"] 请求方法
     * @param {Object} [options.headers] 请求头
     * @param {string} [options.responseType=""] 响应类型 (json/arraybuffer/text)
     * @param {*} [options.body] 请求体
     * @param {number} [options.timeout=15000] 超时时间（毫秒）
     * @param {Function} [options.success] 成功回调
     * @param {Function} [options.error] 失败回调
     * @returns {XMLHttpRequest|null} XHR 对象
     */
    thisObject.request = (options) => {
      const xhr = thisObject.getHttpObject();
      if (!xhr) return null;

      const method = (options.method || "GET").toUpperCase();
      const url = options.url;
      const timeout = options.timeout || 15000;

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return;

        if (xhr.status === 200 || xhr.status === 304 || xhr.status === 0) {
          options.success && options.success(xhr.response);
        } else {
          options.error && options.error({ status: xhr.status, statusText: xhr.statusText });
        }
      };

      xhr.onerror = (e) => {
        options.error && options.error(e);
      };

      xhr.ontimeout = (e) => {
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
     * @param {string} [method="GET"] 请求方法 (GET/POST)
     * @param {Object} data 请求数据
     * @param {Function} [successFn] 成功回调
     * @param {Function} [failedFn] 失败回调
     * @param {string} [type="json"] 响应类型 (json/text/rawPost)
     * @returns {XMLHttpRequest} 请求对象
     */
    thisObject.getDataBySecurityRequest = (url, method, data, successFn, failedFn, type) => {
      method = (method || "GET").toUpperCase();
      type = type || "json";

      // POST 请求
      if (method === "POST" || type === "rawPost") {
        return thisObject.getDataByPostRaw(url, data, successFn, failedFn);
      }

      // GET 请求
      if (url.indexOf("?") === -1) {
        url += "?";
      }

      if (type === "json") {
        return thisObject.getData(url, data, "json", successFn, failedFn);
      }

      // 其他类型（如 text）
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
     * @returns {XMLHttpRequest|null} XHR 对象，不支持时返回 null
     */
    thisObject.getHttpObject = () => {
      if (window.XMLHttpRequest) {
        return new XMLHttpRequest();
      }
      // 兼容 IE6/7
      if (window.ActiveXObject) {
        return new ActiveXObject("Microsoft.XMLHTTP");
      }
      return null;
    };

    /**
     * 通过 GET 方法下载数据
     * @param {string} url 数据路径
     * @param {Object} [data] 请求参数（会拼接到 URL）
     * @param {string} [dataType="text"] 期望的响应类型 (json/xml/text)
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

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return;

        if (xhr.status !== 200 && xhr.status !== 304) {
          failedFn && failedFn({ status: xhr.status, response: xhr.responseText });
          return;
        }

        // 解析响应数据
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

    //////////////////////////////////////////////////////////////

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
      // HWH5 环境使用远程 API
      if (window.HWH5) {
        const envSuffix = window.currentEnv === "uat" ? "-beta" : "";
        const url = `https://apigw${envSuffix}.huawei.com/api/map-static-v2/data/${path}`;
        return thisObject.jsonToUrl(url, window.additionalQuery || {});
      }
      // 本地开发使用相对路径
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

      // 已有配置则直接记录
      if (thisObject.recordList) {
        doRecord();
        return;
      }

      // 首次加载配置
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

    //////////////////////////////////////////////////////////////

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
     * 创建带方法名的命令对象（深拷贝原数据）
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
     * 比较两个对象是否相同（通过 JSON 序列化比较）
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

    /**
     * 检查是否为对象
     * @param {*} obj 待检查的值
     * @returns {boolean}
     */
    thisObject.isObject = createTypeChecker("Object");

    /**
     * 检查是否为字符串
     * @param {*} obj 待检查的值
     * @returns {boolean}
     */
    thisObject.isString = createTypeChecker("String");

    /**
     * 检查是否为数组
     * @param {*} obj 待检查的值
     * @returns {boolean}
     */
    thisObject.isArray = Array.isArray || createTypeChecker("Array");

    /**
     * 检查是否为函数
     * @param {*} obj 待检查的值
     * @returns {boolean}
     */
    thisObject.isFunction = createTypeChecker("Function");

    /**
     * 检查是否为 undefined
     * @param {*} obj 待检查的值
     * @returns {boolean}
     */
    thisObject.isUndefined = createTypeChecker("Undefined");

    /** 模态框组件 */
    thisObject.modal = (() => {
      const modalEl = null;
      const timer = null;
      const currentCallback = null;

      /**
       * 创建模态框 DOM
       * @param {Object} options 配置项
       * @returns {HTMLElement}
       */
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
      }

      /**
       * 绑定按钮点击事件
       * @param {Object} options 配置项
       */
      const bindEvents = (options) => {
        const buttons = modalEl.querySelectorAll(".btn_modal");
        buttons.forEach((btn) => {
          btn.addEventListener("click", () => {
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

      /**
       * 启动倒计时
       * @param {number} seconds 秒数
       * @param {Function} updateFn 更新回调
       */
      const startCountdown = (seconds, updateFn) => {
        const remaining = seconds;
        const firstBtn = modalEl.querySelector(".btn_modal");

        const tick = () => {
          updateFn && updateFn(remaining);

          if (remaining > 0) {
            firstBtn.textContent = `关闭(${remaining})`;
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

        /**
         * 显示模态框
         * @param {Object} params 配置参数
         * @param {string} [params.text] 主标题
         * @param {string} [params.detail] 详细描述
         * @param {string} [params.img] 图片 URL
         * @param {string} [params.html] 自定义 HTML
         * @param {Array} [params.btnArr=["确认"]] 按钮文本数组
         * @param {Function} [params.callback] 按钮点击回调（参数为按钮索引，从 1 开始）
         * @param {number} [params.time] 倒计时秒数
         * @param {boolean} [params.autoClose=true] 点击按钮后是否自动关闭
         */
        show: (params) => {
          params = params || {};

          // 先销毁已有的
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

          // 创建并添加到页面
          modalEl = createModal(options);
          document.body.appendChild(modalEl);

          // 设置按钮样式
          if (options.buttons.length === 1) {
            const btn = modalEl.querySelector(".btn_modal");
            btn.style.minWidth = "62%";
          }

          // 绑定事件
          bindEvents(options);

          // 启动倒计时
          if (params.time) {
            startCountdown(parseInt(params.time), params.timerUpdateCallback);
          }

          this.visible = true;
        },

        /** 销毁模态框 */
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

        /** 停止倒计时 */
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

  ((DaxiApp) => {
    //////////////////////////////////////////////////////////////
    // Vector3 - 向量工具库
    //////////////////////////////////////////////////////////////
    const Vector3 = {};
    DXUtils["Vector3"] = Vector3;

    /**
     * 将向量各分量设为 0
     * @param {number[]} vec 目标向量
     * @returns {number[]} 目标向量
     */
    Vector3.makeZero = (vec) => {
      vec[0] = 0;
      vec[1] = 0;
      vec[2] = 0;
      return vec;
    };

    /**
     * 创建一个新的零向量 [0, 0, 0]
     * @returns {number[]} 新向量
     */
    Vector3.create = () => {
      return [0, 0, 0];
    };

    /**
     * 根据指定分量创建一个新向量
     * @param {number} x X 分量
     * @param {number} y Y 分量
     * @param {number} z Z 分量
     * @returns {number[]} 新向量
     */
    Vector3.make = (x, y, z) => {
      return [x, y, z];
    };

    /**
     * 为现有向量的分量赋值
     * @param {number[]} vec 目标向量
     * @param {number} x X 分量
     * @param {number} y Y 分量
     * @param {number} z Z 分量
     * @returns {number[]} 目标向量
     */
    Vector3.assign = (vec, x, y, z) => {
      vec[0] = x;
      vec[1] = y;
      vec[2] = z;
      return vec;
    };

    /**
     * 向量加法 (retVal = vec1 + vec2)
     * @param {number[]} retVal 结果向量
     * @param {number[]} vec1 输入向量 1
     * @param {number[]} vec2 输入向量 2
     * @returns {number[]} 结果向量
     */
    Vector3.add = (retVal, vec1, vec2) => {
      retVal[0] = vec1[0] + vec2[0];
      retVal[1] = vec1[1] + vec2[1];
      retVal[2] = vec1[2] + vec2[2];
      return retVal;
    };

    /**
     * 向量减法 (retVal = vec1 - vec2)
     * @param {number[]} retVal 结果向量
     * @param {number[]} vec1 被减向量
     * @param {number[]} vec2 减数向量
     * @returns {number[]} 结果向量
     */
    Vector3.sub = (retVal, vec1, vec2) => {
      retVal[0] = vec1[0] - vec2[0];
      retVal[1] = vec1[1] - vec2[1];
      retVal[2] = vec1[2] - vec2[2];
      return retVal;
    };

    /**
     * 向量乘法 (retVal = vec1 * vec2)
     * @param {number[]} retVal 结果向量
     * @param {number[]} vec1 输入向量 1
     * @param {number[]} vec2 输入向量 2
     * @returns {number[]} 结果向量
     */
    Vector3.multiply = (retVal, vec1, vec2) => {
      retVal[0] = vec1[0] * vec2[0];
      retVal[1] = vec1[1] * vec2[1];
      retVal[2] = vec1[2] * vec2[2];
      return retVal;
    };

    /**
     * 向量缩放 (retVal = vec * scale)
     * @param {number[]} retVal 结果向量
     * @param {number[]} vec 输入向量
     * @param {number} scale 缩放比例
     * @returns {number[]} 结果向量
     */
    Vector3.scale = (retVal, vec, scale) => {
      retVal[0] = vec[0] * scale;
      retVal[1] = vec[1] * scale;
      retVal[2] = vec[2] * scale;
      return retVal;
    };

    /**
     * 向量归一化
     * @param {number[]} retVal 结果向量
     * @param {number[]} vec 输入向量
     * @returns {number[]} 结果向量
     */
    Vector3.normalize = (retVal, vec) => {
      const length = Vector3.length(vec);
      if (length > 0.0) {
        const r = 1 / length;
        retVal[0] = vec[0] * r;
        retVal[1] = vec[1] * r;
        retVal[2] = vec[2] * r;
      }
      return retVal;
    };

    /**
     * 向量点积
     * @param {number[]} vec1 向量 1
     * @param {number[]} vec2 向量 2
     * @returns {number} 点积结果
     */
    Vector3.dot = (vec1, vec2) => {
      return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];
    };

    /**
     * 向量叉积 (retVal = left x right)
     * @param {number[]} retVal 结果向量
     * @param {number[]} left 左向量
     * @param {number[]} right 右向量
     * @returns {number[]} 结果向量
     */
    Vector3.cross = (retVal, left, right) => {
      const leftX = left[0];
      const leftY = left[1];
      const leftZ = left[2];
      const rightX = right[0];
      const rightY = right[1];
      const rightZ = right[2];

      const x = leftY * rightZ - leftZ * rightY;
      const y = leftZ * rightX - leftX * rightZ;
      const z = leftX * rightY - leftY * rightX;

      retVal[0] = x;
      retVal[1] = y;
      retVal[2] = z;

      return retVal;
    };

    /**
     * 使用矩阵变换法向量 (不含平移)
     * @param {number[]} retVal 结果向量
     * @param {number[]} vec 输入法向量
     * @param {number[]} mat 4x4 变换矩阵 (列主序)
     * @returns {number[]} 结果向量
     */
    Vector3.transformNormal = (retVal, vec, mat) => {
      const x = vec[0],
        y = vec[1],
        z = vec[2];
      retVal[0] = x * mat[0] + y * mat[4] + z * mat[8];
      retVal[1] = x * mat[1] + y * mat[5] + z * mat[9];
      retVal[2] = x * mat[2] + y * mat[6] + z * mat[10];
      return retVal;
    };

    /**
     * 计算向量的欧几里得长度 (模)
     * @param {number[]} vec 输入向量
     * @returns {number} 向量长度
     */
    Vector3.length = (vec) => {
      return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
    };

    /**
     * 计算两个向量之间的欧几里得距离
     * @param {number[]} left 向量 1
     * @param {number[]} right 向量 2
     * @returns {number} 两点之间的距离
     */
    Vector3.distance = (left, right) => {
      return Math.sqrt((left[0] - right[0]) * (left[0] - right[0]) + (left[1] - right[1]) * (left[1] - right[1]) + (left[2] - right[2]) * (left[2] - right[2]));
    };

    /**
     * 计算向量长度的平方 (避免开方运算，用于比较)
     * @param {number[]} vec 输入向量
     * @returns {number} 向量长度的平方
     */
    Vector3.squaredLength = (vec) => {
      return vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2];
    };

    /**
     * 克隆向量到目标向量
     * @param {number[]} retVal 目标向量
     * @param {number[]} vec 源向量
     * @returns {number[]} 目标向量
     */
    Vector3.clone = (retVal, vec) => {
      retVal[0] = vec[0];
      retVal[1] = vec[1];
      retVal[2] = vec[2];
      return retVal;
    };

    /**
     * 在给定容差范围内比较两个向量是否相等
     * @param {number[]} left 向量 1
     * @param {number[]} right 向量 2
     * @param {number} epsilon 容差值
     * @returns {boolean} 是否近似相等
     */
    Vector3.equalsEpsilon = (left, right, epsilon) => {
      return left === right || (Math.abs(left[0] - right[0]) <= epsilon && Math.abs(left[1] - right[1]) <= epsilon && Math.abs(left[2] - right[2]) <= epsilon);
    };

    /**
     * 向量取反 (retVal = -vec)
     * @param {number[]} retVal 结果向量
     * @param {number[]} vec 输入向量
     * @returns {number[]} 结果向量
     */
    Vector3.negate = (retVal, vec) => {
      retVal[0] = -vec[0];
      retVal[1] = -vec[1];
      retVal[2] = -vec[2];
      return retVal;
    };

    /**
     * 向量各分量取绝对值
     * @param {number[]} retVal 结果向量
     * @param {number[]} vec 输入向量
     * @returns {number[]} 结果向量
     */
    Vector3.abs = (retVal, vec) => {
      retVal[0] = Math.abs(vec[0]);
      retVal[1] = Math.abs(vec[1]);
      retVal[2] = Math.abs(vec[2]);
      return retVal;
    };

    /**
     * 向量乘加运算 (retVal = vec1 + vec2 * t)
     * @param {number[]} retVal 结果向量
     * @param {number[]} vec1 基础向量
     * @param {number[]} vec2 缩放向量
     * @param {number} t 缩放因子
     * @returns {number[]} 结果向量
     */
    Vector3.mad = (retVal, vec1, vec2, t) => {
      retVal[0] = vec1[0] + vec2[0] * t;
      retVal[1] = vec1[1] + vec2[1] * t;
      retVal[2] = vec1[2] + vec2[2] * t;
      return retVal;
    };

    /**
     * 使用矩阵变换坐标 (含透视除法)
     * @param {number[]} retVal 结果向量
     * @param {number[]} vec 输入坐标向量
     * @param {number[]} mat 4x4 变换矩阵 (列主序)
     * @returns {number[]} 结果向量
     */
    Vector3.transformCoordEx = (retVal, vec, mat) => {
      const vX = vec[0];
      const vY = vec[1];
      const vZ = vec[2];
      const vW = mat[3] * vX + mat[7] * vY + mat[11] * vZ + mat[15];
      const invW = 1 / vW;

      const x = (mat[0] * vX + mat[4] * vY + mat[8] * vZ + mat[12]) * invW;
      const y = (mat[1] * vX + mat[5] * vY + mat[9] * vZ + mat[13]) * invW;
      const z = (mat[2] * vX + mat[6] * vY + mat[10] * vZ + mat[14]) * invW;

      retVal[0] = x;
      retVal[1] = y;
      retVal[2] = z;
      return retVal;
    };

    /**
     * 复制向量（创建新数组）
     * @param {number[]} vec 源向量
     * @returns {number[]} 新的向量副本
     */
    Vector3.copy = (vec) => {
      return [vec[0], vec[1], vec[2]];
    };

    /**
     * 使用矩阵变换坐标（不含透视除法）
     * @param {number[]} retVal 结果向量
     * @param {number[]} vec 输入坐标向量
     * @param {number[]} mat 4x4 变换矩阵 (列主序)
     * @returns {number[]} 结果向量
     */
    Vector3.transformCoord = (retVal, vec, mat) => {
      const vX = vec[0];
      const vY = vec[1];
      const vZ = vec[2];
      retVal[0] = mat[0] * vX + mat[4] * vY + mat[8] * vZ + mat[12];
      retVal[1] = mat[1] * vX + mat[5] * vY + mat[9] * vZ + mat[13];
      retVal[2] = mat[2] * vX + mat[6] * vY + mat[10] * vZ + mat[14];
      return retVal;
    };

    /** @type {number[]} 用于 lerp 计算的临时向量 */
    const _lerpTempDir = [0, 0, 0];

    /**
     * 向量线性插值 (retVal = vec1 + (vec2 - vec1) * t)
     * @param {number[]} retVal 结果向量
     * @param {number[]} vec1 起始向量
     * @param {number[]} vec2 结束向量
     * @param {number} t 插值系数 [0, 1]
     * @returns {number[]} 结果向量
     */
    Vector3.lerp = (retVal, vec1, vec2, t) => {
      Vector3.sub(_lerpTempDir, vec2, vec1);
      Vector3.mad(retVal, vec1, _lerpTempDir, t);
      return retVal;
    };

    /** @type {number[]} 零向量常量 */
    Vector3.ZERO = [0.0, 0.0, 0.0];
    /** @type {number[]} X 轴单位向量常量 */
    Vector3.UNIT_X = [1.0, 0.0, 0.0];
    /** @type {number[]} Y 轴单位向量常量 */
    Vector3.UNIT_Y = [0.0, 1.0, 0.0];
    /** @type {number[]} Z 轴单位向量常量 */
    Vector3.UNIT_Z = [0.0, 0.0, 1.0];

    //////////////////////////////////////////////////////////////
    // Matrix - 矩阵工具库
    //////////////////////////////////////////////////////////////
    const Matrix = {};
    DXUtils["Matrix"] = Matrix;

    /**
     *
     * @param mat
     */
    Matrix.makeIdentity = (mat) => {
      mat[0] = 1;
      mat[1] = 0;
      mat[2] = 0;
      mat[3] = 0;
      mat[4] = 0;
      mat[5] = 1;
      mat[6] = 0;
      mat[7] = 0;
      mat[8] = 0;
      mat[9] = 0;
      mat[10] = 1;
      mat[11] = 0;
      mat[12] = 0;
      mat[13] = 0;
      mat[14] = 0;
      mat[15] = 1;
    };

    Matrix.create = () => {
      return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    };

    /**
     *
     * @param array
     * @returns {{stack: Array, push: Function, pop: Function}}
     */
    Matrix.makeMatrixStack = (array) => {
      const stk = [];
      stk.top = 0;
      return {
        stack: stk,
        push: () => {
          const bt = this.stack;
          if (bt.top < bt.length) {
            return bt[bt.top++];
          }
          const bu = new array(16);
          bt[bt.top] = bu;
          if (++bt.top > 100) {
            console.log("error: matrix stack overflow!");
          }
          return bu;
        },
        pop: () => {
          if (--this.stack.top < 0) {
            console.log("error: matrix stack underflow");
          }
        },
      };
    };

    /**
     * Matrix Multiply
     * @param { Matrix } retVal output matrix;
     * @param { Matrix } m1  input matrix1;
     * @param { Matrix } m2  input matrix2;
     */
    Matrix.multiply = (retVal, m1, m2) => {
      const M00 = m1[0],
        M01 = m1[1],
        M02 = m1[2],
        M03 = m1[3],
        M10 = m1[4],
        M11 = m1[5],
        M12 = m1[6],
        M13 = m1[7],
        M20 = m1[8],
        M21 = m1[9],
        M22 = m1[10],
        M23 = m1[11],
        M30 = m1[12],
        M31 = m1[13],
        M32 = m1[14],
        M33 = m1[15],
        n00 = m2[0],
        n01 = m2[1],
        n02 = m2[2],
        n03 = m2[3],
        n10 = m2[4],
        n11 = m2[5],
        n12 = m2[6],
        n13 = m2[7],
        n20 = m2[8],
        n21 = m2[9],
        n22 = m2[10],
        n23 = m2[11],
        n30 = m2[12],
        n31 = m2[13],
        n32 = m2[14],
        n33 = m2[15];

      retVal[0] = M00 * n00 + M01 * n10 + M02 * n20 + M03 * n30;
      retVal[1] = M00 * n01 + M01 * n11 + M02 * n21 + M03 * n31;
      retVal[2] = M00 * n02 + M01 * n12 + M02 * n22 + M03 * n32;
      retVal[3] = M00 * n03 + M01 * n13 + M02 * n23 + M03 * n33;

      retVal[4] = M10 * n00 + M11 * n10 + M12 * n20 + M13 * n30;
      retVal[5] = M10 * n01 + M11 * n11 + M12 * n21 + M13 * n31;
      retVal[6] = M10 * n02 + M11 * n12 + M12 * n22 + M13 * n32;
      retVal[7] = M10 * n03 + M11 * n13 + M12 * n23 + M13 * n33;

      retVal[8] = M20 * n00 + M21 * n10 + M22 * n20 + M23 * n30;
      retVal[9] = M20 * n01 + M21 * n11 + M22 * n21 + M23 * n31;
      retVal[10] = M20 * n02 + M21 * n12 + M22 * n22 + M23 * n32;
      retVal[11] = M20 * n03 + M21 * n13 + M22 * n23 + M23 * n33;

      retVal[12] = M30 * n00 + M31 * n10 + M32 * n20 + M33 * n30;
      retVal[13] = M30 * n01 + M31 * n11 + M32 * n21 + M33 * n31;
      retVal[14] = M30 * n02 + M31 * n12 + M32 * n22 + M33 * n32;
      retVal[15] = M30 * n03 + M31 * n13 + M32 * n23 + M33 * n33;
    };

    Matrix.lookatRH = (retVal, position, target, up) => {
      const xAxis = [0, 0, 0];
      const yAxis = [0, 0, 0];
      const zAxis = [0, 0, 0];

      Vector3.sub(zAxis, position, target);
      Vector3.normalize(zAxis, zAxis);

      Vector3.cross(xAxis, up, zAxis);
      Vector3.normalize(xAxis, xAxis);

      Vector3.cross(yAxis, zAxis, xAxis);
      Vector3.normalize(yAxis, yAxis);

      ((retVal[0] = xAxis[0]), (retVal[1] = yAxis[0]), (retVal[2] = zAxis[0]), (retVal[3] = 0));
      ((retVal[4] = xAxis[1]), (retVal[5] = yAxis[1]), (retVal[6] = zAxis[1]), (retVal[7] = 0));
      ((retVal[8] = xAxis[2]), (retVal[9] = yAxis[2]), (retVal[10] = zAxis[2]), (retVal[11] = 0));
      retVal[12] = -Vector3.dot(xAxis, position);
      retVal[13] = -Vector3.dot(yAxis, position);
      retVal[14] = -Vector3.dot(zAxis, position);
      retVal[15] = 1.0;
    };

    Matrix.perspectiveRH = (retVal, fovy, aspect, zn, zf) => {
      const tan_fovy = 1 / Math.tan(fovy * 0.5);
      retVal[0] = tan_fovy / aspect;
      retVal[1] = 0;
      retVal[2] = 0;
      retVal[3] = 0;
      retVal[4] = 0;
      retVal[5] = tan_fovy;
      retVal[6] = 0;
      retVal[7] = 0;
      retVal[8] = 0;
      retVal[9] = 0;
      retVal[10] = (zf + zn) / (zn - zf);
      retVal[11] = -1;
      retVal[12] = 0.0;
      retVal[13] = 0;
      retVal[14] = (2.0 * zn * zf) / (zn - zf);
      retVal[15] = 0;
    };

    Matrix.orthoRH = (retVal, w, h, zn, zf) => {
      //const tan_fovy = 1 / Math.tan(fovy * 0.5);
      retVal[0] = 2 / w;
      retVal[1] = 0;
      retVal[2] = 0;
      retVal[3] = 0;
      retVal[4] = 0;
      retVal[5] = 2 / h;
      retVal[6] = 0;
      retVal[7] = 0;
      retVal[8] = 0;
      retVal[9] = 0;
      retVal[10] = 2.0 / (zn - zf);
      retVal[11] = 0;
      retVal[12] = 0.0;
      retVal[13] = 0;
      retVal[14] = (zf + zn) / (zn - zf);
      retVal[15] = 1.0;
    };

    Matrix.computeOrthographicOffCenter = (left, right, bottom, top, near, far, result) => {
      const a = 1.0 / (right - left);
      const b = 1.0 / (top - bottom);
      const c = 1.0 / (far - near);

      const tx = -(right + left) * a;
      const ty = -(top + bottom) * b;
      const tz = -(far + near) * c;
      a *= 2.0;
      b *= 2.0;
      c *= -2.0;

      result[0] = a;
      result[1] = 0.0;
      result[2] = 0.0;
      result[3] = 0.0;
      result[4] = 0.0;
      result[5] = b;
      result[6] = 0.0;
      result[7] = 0.0;
      result[8] = 0.0;
      result[9] = 0.0;
      result[10] = c;
      result[11] = 0.0;
      result[12] = tx;
      result[13] = ty;
      result[14] = tz;
      result[15] = 1.0;
      return result;
    };

    Matrix.fromTNBP = (retVal, xAxis, yAxis, zAxis, vecP) => {
      ((retVal[0] = xAxis[0]), (retVal[1] = xAxis[1]), (retVal[2] = xAxis[2]), (retVal[3] = 0));
      ((retVal[4] = yAxis[0]), (retVal[5] = yAxis[1]), (retVal[6] = yAxis[2]), (retVal[7] = 0));
      ((retVal[8] = zAxis[0]), (retVal[9] = zAxis[1]), (retVal[10] = zAxis[2]), (retVal[11] = 0));
      ((retVal[12] = vecP[0]), (retVal[13] = vecP[1]), (retVal[14] = vecP[2]), (retVal[15] = 1));

      return retVal;
    };

    Matrix.translate = (retVal, x, y, z) => {
      retVal[0] = 1;
      retVal[1] = 0;
      retVal[2] = 0;
      retVal[3] = 0;
      retVal[4] = 0;
      retVal[5] = 1;
      retVal[6] = 0;
      retVal[7] = 0;
      retVal[8] = 0;
      retVal[9] = 0;
      retVal[10] = 1;
      retVal[11] = 0;
      retVal[12] = x;
      retVal[13] = y;
      retVal[14] = z;
      retVal[15] = 1;
    };

    Matrix.scale = (retVal, x, y, z) => {
      retVal[0] = x;
      retVal[1] = 0;
      retVal[2] = 0;
      retVal[3] = 0;
      retVal[4] = 0;
      retVal[5] = y;
      retVal[6] = 0;
      retVal[7] = 0;
      retVal[8] = 0;
      retVal[9] = 0;
      retVal[10] = z;
      retVal[11] = 0;
      retVal[12] = 0;
      retVal[13] = 0;
      retVal[14] = 0;
      retVal[15] = 1;
    };

    Matrix.rotateAxisX = (retVal, angel) => {
      const cos_angel = Math.cos(angel);
      const sin_angel = Math.sin(angel);
      retVal[0] = 1;
      retVal[1] = 0;
      retVal[2] = 0;
      retVal[3] = 0;
      retVal[4] = 0;
      retVal[5] = cos_angel;
      retVal[6] = sin_angel;
      retVal[7] = 0;
      retVal[8] = 0;
      retVal[9] = -sin_angel;
      retVal[10] = cos_angel;
      retVal[11] = 0;
      retVal[12] = 0;
      retVal[13] = 0;
      retVal[14] = 0;
      retVal[15] = 1;
    };

    Matrix.rotateAxisY = (retVal, angel) => {
      const cos_angel = Math.cos(angel);
      const sin_angel = Math.sin(angel);
      retVal[0] = cos_angel;
      retVal[1] = 0;
      retVal[2] = -sin_angel;
      retVal[3] = 0;
      retVal[4] = 0;
      retVal[5] = 0;
      retVal[6] = 0;
      retVal[7] = 0;
      retVal[8] = sin_angel;
      retVal[9] = 0;
      retVal[10] = cos_angel;
      retVal[11] = 0;
      retVal[12] = 0;
      retVal[13] = 0;
      retVal[14] = 0;
      retVal[15] = 1;
    };

    Matrix.rotateAxisZ = (retVal, angel) => {
      const cos_angel = Math.cos(angel);
      const sin_angel = Math.sin(angel);
      retVal[0] = cos_angel;
      retVal[1] = sin_angel;
      retVal[2] = 0;
      retVal[3] = 0;
      retVal[4] = -sin_angel;
      retVal[5] = cos_angel;
      retVal[6] = 0;
      retVal[7] = 0;
      retVal[8] = 0;
      retVal[9] = 0;
      retVal[10] = 1;
      retVal[11] = 0;
      retVal[12] = 0;
      retVal[13] = 0;
      retVal[14] = 0;
      retVal[15] = 1;
    };

    Matrix.rotateAxis = (retVal, from, to, angel) => {};

    Matrix.fromQuaternion = (retVal, q) => {
      const x = q[0],
        y = q[1],
        z = q[2],
        w = q[3];
      const xx = x * x;
      const xy = x * y;
      const xz = x * z;
      const xw = x * w;

      const yy = y * y;
      const yz = y * z;
      const yw = y * w;

      const zz = z * z;
      const zw = z * w;

      retVal[0] = 1 - 2 * (yy + zz);
      retVal[1] = 2 * (xy + zw);
      retVal[2] = 2 * (xz - yw);

      retVal[4] = 2 * (xy - zw);
      retVal[5] = 1 - 2 * (xx + zz);
      retVal[6] = 2 * (yz + xw);

      retVal[8] = 2 * (xz + yw);
      retVal[9] = 2 * (yz - xw);
      retVal[10] = 1 - 2 * (xx + yy);

      retVal[3] = retVal[7] = retVal[11] = retVal[12] = retVal[13] = retVal[14] = 0;
      retVal[15] = 1;
    };

    Matrix.inverse = (result, matrix) => {
      const a0 = matrix[0] * matrix[5] - matrix[1] * matrix[4];
      const a1 = matrix[0] * matrix[6] - matrix[2] * matrix[4];
      const a2 = matrix[0] * matrix[7] - matrix[3] * matrix[4];
      const a3 = matrix[1] * matrix[6] - matrix[2] * matrix[5];
      const a4 = matrix[1] * matrix[7] - matrix[3] * matrix[5];
      const a5 = matrix[2] * matrix[7] - matrix[3] * matrix[6];

      const b0 = matrix[8] * matrix[13] - matrix[9] * matrix[12];
      const b1 = matrix[8] * matrix[14] - matrix[10] * matrix[12];
      const b2 = matrix[8] * matrix[15] - matrix[11] * matrix[12];
      const b3 = matrix[9] * matrix[14] - matrix[10] * matrix[13];
      const b4 = matrix[9] * matrix[15] - matrix[11] * matrix[13];
      const b5 = matrix[10] * matrix[15] - matrix[11] * matrix[14];

      const det = a0 * b5 - a1 * b4 + a2 * b3 + a3 * b2 - a4 * b1 + a5 * b0;
      // if ( AnGeoMath<N>::fabs_(det) <= AnGeoMath<N>::s_zero_tolerance )
      //     return Matrix4x4<N>::s_zero;

      //Matrix4x4 mat_ret;
      result[0] = +matrix[5] * b5 - matrix[6] * b4 + matrix[7] * b3;
      result[4] = -matrix[4] * b5 + matrix[6] * b2 - matrix[7] * b1;
      result[8] = +matrix[4] * b4 - matrix[5] * b2 + matrix[7] * b0;
      result[12] = -matrix[4] * b3 + matrix[5] * b1 - matrix[6] * b0;
      result[1] = -matrix[1] * b5 + matrix[2] * b4 - matrix[3] * b3;
      result[5] = +matrix[0] * b5 - matrix[2] * b2 + matrix[3] * b1;
      result[9] = -matrix[0] * b4 + matrix[1] * b2 - matrix[3] * b0;
      result[13] = +matrix[0] * b3 - matrix[1] * b1 + matrix[2] * b0;
      result[2] = +matrix[13] * a5 - matrix[14] * a4 + matrix[15] * a3;
      result[6] = -matrix[12] * a5 + matrix[14] * a2 - matrix[15] * a1;
      result[10] = +matrix[12] * a4 - matrix[13] * a2 + matrix[15] * a0;
      result[14] = -matrix[12] * a3 + matrix[13] * a1 - matrix[14] * a0;
      result[3] = -matrix[9] * a5 + matrix[10] * a4 - matrix[11] * a3;
      result[7] = +matrix[8] * a5 - matrix[10] * a2 + matrix[11] * a1;
      result[11] = -matrix[8] * a4 + matrix[9] * a2 - matrix[11] * a0;
      result[15] = +matrix[8] * a3 - matrix[9] * a1 + matrix[10] * a0;

      const inv_det = 1.0 / det;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          result[(row << 2) + col] *= inv_det;
        }
      }

      return result;
    };

    Matrix.transpose = (mat) => {
      const tmp = 0;
      tmp = mat[1];
      mat[1] = mat[4];
      mat[4] = tmp;
      tmp = mat[2];
      mat[2] = mat[8];
      mat[8] = tmp;
      tmp = mat[3];
      mat[3] = mat[12];
      mat[12] = tmp;
      tmp = mat[6];
      mat[6] = mat[9];
      mat[9] = tmp;
      tmp = mat[7];
      mat[7] = mat[13];
      mat[13] = tmp;
      tmp = mat[11];
      mat[11] = mat[14];
      mat[14] = tmp;
    };

    Matrix.clone = (result, matrix) => {
      result[0] = matrix[0];
      result[1] = matrix[1];
      result[2] = matrix[2];
      result[3] = matrix[3];
      result[4] = matrix[4];
      result[5] = matrix[5];
      result[6] = matrix[6];
      result[7] = matrix[7];
      result[8] = matrix[8];
      result[9] = matrix[9];
      result[10] = matrix[10];
      result[11] = matrix[11];
      result[12] = matrix[12];
      result[13] = matrix[13];
      result[14] = matrix[14];
      result[15] = matrix[15];
      return result;
    };

    Matrix.transformCoord = (retVal, vec, mat) => {
      const vX = vec[0];
      const vY = vec[1];
      const vZ = vec[2];
      const vW = mat[3] * vX + mat[7] * vY + mat[11] * vZ + mat[15];
      const invW = 1 / vW;

      const x = (mat[0] * vX + mat[4] * vY + mat[8] * vZ + mat[12]) * invW;
      const y = (mat[1] * vX + mat[5] * vY + mat[9] * vZ + mat[13]) * invW;
      const z = (mat[2] * vX + mat[6] * vY + mat[10] * vZ + mat[14]) * invW;

      retVal[0] = x;
      retVal[1] = y;
      retVal[2] = z;
      return retVal;
    };

    //-----------------------------------------------------------------------
    Matrix.toEulerAnglesZXY = (result, matrix) => {
      result[1] = Math.asin(matrix[6]);
      if (result[1] < Math.PI * 0.5) {
        if (result[1] > -Math.PI * 0.5) {
          result[0] = Math.atan2(-matrix[4], matrix[5]);
          result[2] = Math.atan2(-matrix[2], matrix[10]);
          return true;
        } else {
          // WARNING.  Not a unique solution.
          const fRmY = Math.atan2(matrix[8], matrix[0]);
          result[2] = 0.0; // any angle works
          result[0] = result[2] - fRmY;
          return false;
        }
      } else {
        // WARNING.  Not a unique solution.
        const fRpY = Math.atan2(matrix[8], matrix[0]);
        result[2] = 0.0; // any angle works
        result[0] = fRpY - result[2];
        return false;
      }
    };

    //////////////////////////////////////////////////////////////
    // Plane - 平面工具库
    //////////////////////////////////////////////////////////////
    const Plane = {};
    DXUtils["Plane"] = Plane;
    Plane.create = () => {
      return [0, 0, 0, 1];
    };

    Plane.assign = (retVal, x, y, z, w) => {
      retVal[0] = x;
      retVal[1] = y;
      retVal[2] = z;
      retVal[3] = w;
    };

    const s_zero_tolerance = 2.2204460492503131e-16;
    Plane.intersectRay = (intersectPt, ray, plane) => {
      const delt = Vector3.dot(ray._dir, [0, 0, 1]);
      if (Math.abs(delt) < s_zero_tolerance) {
        return false;
      }

      const dist = Vector3.dot([0, 0, 0], [0, 0, 1]);
      const t = (dist - Vector3.dot(ray._orig, [0, 0, 1])) / delt;
      Vector3.mad(intersectPt, ray._orig, ray._dir, t);
      return true;
    };

    //////////////////////////////////////////////////////////////
    // navi_utils - 导航工具库
    //////////////////////////////////////////////////////////////
    const navi_utils = {};
    /** @type {number} 地球赤道半径（米） */
    const earthRadius = 6378137.0;
    navi_utils.earth_radius = earthRadius;
    /** @type {number} 度数转弧度的转换系数 */
    const DEGREE_TO_RADIAN = 0.0174532925199433;
    /** @type {number} 角秒转弧度的转换系数 */
    const SECOND_TO_RADIAN = DEGREE_TO_RADIAN / 3600;
    /** @type {number} 弧度转度数的转换系数 */
    const RADIAN_TO_DEGREE = 180 / Math.PI;

    navi_utils.DEGREE_TO_RADIAN = DEGREE_TO_RADIAN;
    navi_utils.RADIAN_TO_DEGREE = RADIAN_TO_DEGREE;
    navi_utils.SECOND_TO_RADIANS = SECOND_TO_RADIAN;
    /**
     * 从几何数组中获取指定索引的坐标对象（对象格式）
     * @param {Array} geometry - 几何坐标数组
     * @param {number} index - 索引
     * @returns {{x: number, y: number, segment_length: number}} 坐标对象
     */
    navi_utils.getVector = (geometry, index) => {
      return {
        x: geometry[index]["x"],
        y: geometry[index]["y"],
        segment_length: geometry[index].segment_length,
      };
    };

    /**
     * 从墨卡托坐标数组中获取指定索引的坐标对象
     * @param {Array} geometry - 墨卡托坐标数组
     * @param {number} index - 索引
     * @returns {{x: number, y: number, segment_length: number}} 坐标对象
     */
    navi_utils.getVectorMectro = (geometry, index) => {
      return {
        x: geometry[index]["x"],
        y: geometry[index]["y"],
        segment_length: geometry[index].segment_length,
      };
    };

    /**
     * 从几何数组中获取指定索引的坐标对象（数组格式 [x, y]）
     * @param {Array} geometry - 几何坐标数组
     * @param {number} index - 索引
     * @returns {{x: number, y: number, segment_length: number}} 坐标对象
     */
    navi_utils.getVector2 = (geometry, index) => {
      return {
        x: geometry[index][0],
        y: geometry[index][1],
        segment_length: geometry[index].segment_length,
      };
    };

    /**
     * 从几何数组中获取指定索引的三维向量
     * @param {Array} geometry - 几何坐标数组
     * @param {number} index - 索引
     * @returns {number[]} 三维向量 [x, y, 0]
     */
    navi_utils.getVector3 = (geometry, index) => {
      return [geometry[index][0], geometry[index][1], 0];
    };

    /**
     * 将地理坐标（经度、纬度、半径）转换为 ECEF 坐标
     * @param {number[]} vecOut - 输出的 ECEF 坐标 [x, y, z]
     * @param {number[]} vecIn - 输入的地理坐标 [longitude, latitude, radius]（弧度制）
     */
    navi_utils.transformGeographicToECEF = (vecOut, vecIn) => {
      const longitude = vecIn[0],
        latitude = vecIn[1],
        radius = vecIn[2];
      const cos_lat = radius * Math.cos(latitude);
      vecOut[0] = cos_lat * Math.cos(longitude);
      vecOut[1] = cos_lat * Math.sin(longitude);
      vecOut[2] = radius * Math.sin(latitude);
    };

    /**
     * 将 ECEF 坐标转换为地理坐标（经度、纬度、半径）
     * @param {number[]} vecOut - 输出的地理坐标 [longitude, latitude, radius]（弧度制）
     * @param {number[]} vecIn - 输入的 ECEF 坐标 [x, y, z]
     */
    navi_utils.transformECEFToGeographic = (vecOut, vecIn) => {
      const x = vecIn[0],
        y = vecIn[1],
        z = vecIn[2];
      const ret_z = Math.sqrt(x * x + y * y + z * z);
      vecOut[0] = Math.atan2(y, x);
      vecOut[1] = Math.asin(z / ret_z);
      vecOut[2] = ret_z;
    };

    /** @type {number} 地球赤道周长的一半（米） */
    const halfcircumference = 20037508.34;

    /**
     * 将经度转换为墨卡托投影 X 坐标
     * @param {number} longtitude - 经度（角度制）
     * @returns {number} 墨卡托 X 坐标
     */
    navi_utils.transformLonToMectroX = (longtitude) => {
      return (longtitude / 180) * halfcircumference;
    };

    /**
     * 将纬度转换为墨卡托投影 Y 坐标
     * @param {number} latitude - 纬度（角度制）
     * @returns {number} 墨卡托 Y 坐标
     */
    navi_utils.transformLatToMectroY = (latitude) => {
      return (Math.log(Math.tan(Math.PI * 0.25 + latitude * 0.5 * DEGREE_TO_RADIAN)) * halfcircumference) / Math.PI;
    };

    /**
     * 将墨卡托投影 X 坐标转换为经度
     * @param {number} x - 墨卡托 X 坐标
     * @returns {number} 经度（角度制）
     */
    navi_utils.transformMectroXToLon = (x) => {
      return (x / halfcircumference) * 180;
    };

    /**
     * 将墨卡托投影 Y 坐标转换为纬度
     * @param {number} y - 墨卡托 Y 坐标
     * @returns {number} 纬度（角度制）
     */
    navi_utils.transformMectroYToLat = (y) => {
      y = (y / halfcircumference) * Math.PI;
      return RADIAN_TO_DEGREE * (2 * Math.atan(Math.exp(y)) - Math.PI / 2);
    };

    /**
     * 将经纬度坐标转换为墨卡托投影坐标
     * @param {Object|Array} lonlat - 经纬度坐标，支持 {lon, lat}, {x, y} 或 [lon, lat] 格式
     * @returns {{x: number, y: number}} 墨卡托投影坐标对象
     */
    navi_utils.lonLatToMectro = (lonlat) => {
      const lon = lonlat.lon || lonlat.x || lonlat[0];
      const lat = lonlat.lat || lonlat.y || lonlat[1];
      const x = navi_utils.transformLonToMectroX(lon);
      const y = navi_utils.transformLatToMectroY(lat);
      return { x: x, y: y };
    };

    /**
     * 将墨卡托投影坐标转换为经纬度坐标
     * @param {Object} mectroXY - 墨卡托投影坐标对象 {x, y}
     * @returns {{lon: number, lat: number}} 经纬度坐标对象
     */
    navi_utils.mectroTolLonLat = (mectroXY) => {
      const lon = navi_utils.transformMectroXToLon(mectroXY["x"]);
      const lat = navi_utils.transformMectroYToLat(mectroXY["y"]);
      return { lon: lon, lat: lat };
    };

    /**
     * 将经纬度坐标转换为 UTM 坐标
     * @param {number[]} lonLat - 经纬度数组 [longitude, latitude]
     * @param {number[]} utmXY - 接收转换结果的数组 [x, y]
     */
    navi_utils.lonlatToUtmXY = (lonLat, utmXY) => {
      // 计算 UTM 分带 (Zone)
      const zone = parseInt(Math.floor((lonLat[0] + 180.0) / 6)) + 1;
      MapLatLonToXY(DegToRad(lonLat[1]), DegToRad(lonLat[0]), UTMCentralMeridian(zone), utmXY);

      // 应用 UTM 比例因子和东伪偏移
      utmXY[0] = utmXY[0] * UTMScaleFactor + 500000.0;
      utmXY[1] = utmXY[1] * UTMScaleFactor;

      // 如果位于南半球，增加北伪偏移
      if (utmXY[1] < 0.0) utmXY[1] += 10000000.0;
    };

    navi_utils.getArrowBodyPoints = (points, neckLeft, neckRight, tailWidthFactor) => {
      const allLen = PlotUtils.wholeDistance(points);
      const len = PlotUtils.getBaseLength(points);
      const tailWidth = len * tailWidthFactor;
      const neckWidth = PlotUtils.distance(neckLeft, neckRight);
      const widthDif = (tailWidth - neckWidth) / 2;
      const tempLen = 0,
        leftBodyPnts = [],
        rightBodyPnts = [];
      for (let i = 1; i < points.length - 1; i++) {
        const angle = PlotUtils.getAngleOfThreePoints(points[i - 1], points[i], points[i + 1]) / 2;
        tempLen += PlotUtils.distance(points[i - 1], points[i]);
        const w = (tailWidth / 2 - (tempLen / allLen) * widthDif) / Math.sin(angle);
        const left = PlotUtils.getThirdPoint(points[i - 1], points[i], Math.PI - angle, w, true);
        const right = PlotUtils.getThirdPoint(points[i - 1], points[i], angle, w, false);
        leftBodyPnts.push(left);
        rightBodyPnts.push(right);
      }
      return leftBodyPnts.concat(rightBodyPnts);
    };
    navi_utils.getArrowHeadPoints = (
      points,
      tailLeft,
      tailRight,
      headWidthFactor,
      headHeightFactor,
      headTailFactor,
      neckWidthFactor,
      neckHeightFactor,
    ) => {
      headWidthFactor = headWidthFactor || 0.25;
      headHeightFactor = headHeightFactor || 0.18;
      headTailFactor = headTailFactor || 0.15;
      neckWidthFactor = neckWidthFactor || 0.2;
      neckHeightFactor = neckHeightFactor || 0.85;

      const len = PlotUtils.getBaseLength(points);
      const headHeight = len * headHeightFactor;
      const headPnt = points[points.length - 1];
      len = PlotUtils.distance(headPnt, points[points.length - 2]);
      const tailWidth = PlotUtils.distance(tailLeft, tailRight);
      if (headHeight > tailWidth * headTailFactor) {
        headHeight = tailWidth * headTailFactor;
      }
let headWidth = 1; //headHeight * headWidthFactor;
let neckWidth = 0.5; //headHeight * neckWidthFactor;
      headHeight = 1; //headHeight > len ? len : headHeight;
      const neckHeight = headHeight * neckHeightFactor;
      const headEndPnt = PlotUtils.getThirdPoint(points[points.length - 2], headPnt, 0.317, headHeight, true);
      const neckEndPnt = PlotUtils.getThirdPoint(points[points.length - 2], headPnt, 0.317, neckHeight, true);
      const headLeft = PlotUtils.getThirdPoint(headPnt, headEndPnt, P.Constants.HALF_PI, headWidth, false);
      const headRight = PlotUtils.getThirdPoint(headPnt, headEndPnt, P.Constants.HALF_PI, headWidth, true);
      const neckLeft = PlotUtils.getThirdPoint(headPnt, neckEndPnt, P.Constants.HALF_PI, neckWidth, false);
      const neckRight = PlotUtils.getThirdPoint(headPnt, neckEndPnt, P.Constants.HALF_PI, neckWidth, true);
      return [neckLeft, headLeft, headPnt, headRight, neckRight];
    };
    navi_utils.generate = (points) => {
      const poinstLen = points.length;
      if (poinstLen < 2) {
        return;
      }
      if (poinstLen == 2) {
        return points;
      }
      const pnts = points;
      // 计算箭尾
      const tailLeft = pnts[0];
      const tailRight = pnts[1];
      if (PlotUtils.isClockWise(pnts[0], pnts[1], pnts[2])) {
        tailLeft = pnts[1];
        tailRight = pnts[0];
      }
      const midTail = PlotUtils.mid(tailLeft, tailRight);
      const bonePnts = [midTail].concat(pnts.slice(2));
      // 计算箭头
      const headPnts = navi_utils.getArrowHeadPoints(bonePnts, tailLeft, tailRight);
      const neckLeft = headPnts[0];
      const neckRight = headPnts[4];
      const tailWidthFactor = PlotUtils.distance(tailLeft, tailRight) / PlotUtils.getBaseLength(bonePnts);
      // 计算箭身
      const bodyPnts = navi_utils.getArrowBodyPoints(bonePnts, neckLeft, neckRight, tailWidthFactor);
      // 整合
      const count = bodyPnts.length;
      const leftPnts = [tailLeft].concat(bodyPnts.slice(0, count / 2));
      leftPnts.push(neckLeft);
      const rightPnts = [tailRight].concat(bodyPnts.slice(count / 2, count));
      rightPnts.push(neckRight);

      return [leftPnts.concat(headPnts, rightPnts.reverse())];
    };

    /**
     * 创建一个4x4单位矩阵（列主序存储）
     * @returns {number[]} 长度为16的数组，表示4x4单位矩阵
     */
    navi_utils.makeMatrix = () => {
      return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    };

    /**
     * 计算从ECEF（地心地固坐标系）到ENU（东北天坐标系）的转换矩阵
     * ECEF: Earth-Centered, Earth-Fixed，以地心为原点的笛卡尔坐标系
     * ENU: East-North-Up，以某点为原点的本地坐标系（东-北-天）
     * @param {number[]} matOut - 输出的4x4转换矩阵（列主序，长度16）
     * @param {number[]} vecIn - ECEF坐标系下的参考点位置向量 [x, y, z]
     */
    navi_utils.matrixECEFToENU = (matOut, vecIn) => {
      const vec_x = [0, 0, 0],
        vec_y = [0, 0, 0],
        vec_z = navi_utils.Vector3_copy(vecIn);
      const s_unit_z = [0, 0, 1];

      navi_utils.Vector3_normalize(vec_z, vec_z);

      navi_utils.Vector3_cross(vec_x, s_unit_z, vec_z);
      navi_utils.Vector3_normalize(vec_x, vec_x);

      navi_utils.Vector3_cross(vec_y, vec_z, vec_x);
      navi_utils.Vector3_normalize(vec_y, vec_y);

      navi_utils.Matrix_fromTNBP(matOut, vec_x, vec_y, vec_z, vecIn);
      navi_utils.Matrix_inverse(matOut, matOut);
    };

    /**
     * 计算从ENU（东北天坐标系）到ECEF（地心地固坐标系）的转换矩阵
     * @param {number[]} matOut - 输出的4x4转换矩阵（列主序，长度16）
     * @param {number[]} vecIn - ECEF坐标系下的参考点位置向量 [x, y, z]
     */
    navi_utils.matrixENUToECEF = (matOut, vecIn) => {
      const vec_x = [0, 0, 0];
      const vec_y = [0, 0, 0];
      const vec_z = navi_utils.Vector3_copy(vecIn);
      const s_unit_z = [0, 0, 1];
      navi_utils.Vector3_normalize(vec_z, vec_z);

      navi_utils.Vector3_cross(vec_x, s_unit_z, vec_z);
      navi_utils.Vector3_normalize(vec_x, vec_x);

      navi_utils.Vector3_cross(vec_y, vec_z, vec_x);
      navi_utils.Vector3_normalize(vec_y, vec_y);

      navi_utils.Matrix_fromTNBP(matOut, vec_x, vec_y, vec_z, vecIn);
    };

    /**
     * 根据切线(T)、法线(N)、副法线(B)和位置(P)向量构建4x4变换矩阵
     * 矩阵采用列主序存储，布局如下：
     * | xAxis[0]  yAxis[0]  zAxis[0]  vecP[0] |
     * | xAxis[1]  yAxis[1]  zAxis[1]  vecP[1] |
     * | xAxis[2]  yAxis[2]  zAxis[2]  vecP[2] |
     * |    0         0         0         1   |
     * @param {number[]} retVal - 输出的4x4矩阵（列主序，长度16）
     * @param {number[]} xAxis - X轴方向向量（切线/Tangent）
     * @param {number[]} yAxis - Y轴方向向量（法线/Normal）
     * @param {number[]} zAxis - Z轴方向向量（副法线/Binormal）
     * @param {number[]} vecP - 位置向量（Position）
     * @returns {number[]} 返回构建的矩阵（同retVal）
     */
    navi_utils.Matrix_fromTNBP = (retVal, xAxis, yAxis, zAxis, vecP) => {
      ((retVal[0] = xAxis[0]), (retVal[1] = xAxis[1]), (retVal[2] = xAxis[2]), (retVal[3] = 0));
      ((retVal[4] = yAxis[0]), (retVal[5] = yAxis[1]), (retVal[6] = yAxis[2]), (retVal[7] = 0));
      ((retVal[8] = zAxis[0]), (retVal[9] = zAxis[1]), (retVal[10] = zAxis[2]), (retVal[11] = 0));
      ((retVal[12] = vecP[0]), (retVal[13] = vecP[1]), (retVal[14] = vecP[2]), (retVal[15] = 1));

      return retVal;
    };

    /**
     * 计算仿射变换矩阵的逆矩阵（假设旋转部分为正交矩阵）
     * 利用正交矩阵的性质：逆矩阵 = 转置矩阵
     * 对于变换矩阵 [R|T]，其逆为 [R^T | -R^T * T]
     * @param {number[]} result - 输出的逆矩阵（列主序，长度16）
     * @param {number[]} matrix - 输入的原始矩阵（列主序，长度16）
     * @returns {number[]} 返回逆矩阵（同result）
     */
    navi_utils.Matrix_inverse = (result, matrix) => {
      const matrix0 = matrix[0];
      const matrix1 = matrix[1];
      const matrix2 = matrix[2];
      const matrix4 = matrix[4];
      const matrix5 = matrix[5];
      const matrix6 = matrix[6];
      const matrix8 = matrix[8];
      const matrix9 = matrix[9];
      const matrix10 = matrix[10];

      const vX = matrix[12];
      const vY = matrix[13];
      const vZ = matrix[14];

      const x = -matrix0 * vX - matrix1 * vY - matrix2 * vZ;
      const y = -matrix4 * vX - matrix5 * vY - matrix6 * vZ;
      const z = -matrix8 * vX - matrix9 * vY - matrix10 * vZ;

      result[0] = matrix0;
      result[1] = matrix4;
      result[2] = matrix8;
      result[3] = 0.0;
      result[4] = matrix1;
      result[5] = matrix5;
      result[6] = matrix9;
      result[7] = 0.0;
      result[8] = matrix2;
      result[9] = matrix6;
      result[10] = matrix10;
      result[11] = 0.0;
      result[12] = x;
      result[13] = y;
      result[14] = z;
      result[15] = 1.0;
      return result;
    };

    /**
     * 计算两点间的大圆弧弧度（弧度制）
     * @param {number} lon1 - 第一点经度（弧度）
     * @param {number} lat1 - 第一点纬度（弧度）
     * @param {number} lon2 - 第二点经度（弧度）
     * @param {number} lat2 - 第二点纬度（弧度）
     * @returns {number} 大圆弧弧度
     */
    navi_utils.getGeodeticCircleRadians = (lon1, lat1, lon2, lat2) => {
      const a = Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2) + Math.sin(lat1) * Math.sin(lat2);
      return Math.abs(Math.acos(a));
    };

    /**
     * 创建一个新的轴对齐包围盒（AABB）
     * @returns {{_min: number[], _max: number[]}} AABB 对象
     */
    navi_utils.AABB_create = () => {
      return {
        _min: [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE],
        _max: [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE],
      };
    };

    /**
     * 将 AABB 重置为无效状态
     * @param {{_min: number[], _max: number[]}} extOut - AABB 对象
     * @returns {{_min: number[], _max: number[]}} 重置后的 AABB
     */
    navi_utils.AABB_makeInvalid = (extOut) => {
      extOut._min[0] = Number.MAX_VALUE;
      extOut._min[1] = Number.MAX_VALUE;
      extOut._min[2] = Number.MAX_VALUE;
      extOut._max[0] = -Number.MAX_VALUE;
      extOut._max[1] = -Number.MAX_VALUE;
      extOut._max[2] = -Number.MAX_VALUE;
      return extOut;
    };

    /**
     * 将点合并到 AABB 中（扩展包围盒）
     * @param {{_min: number[], _max: number[]}} extOut - 输出 AABB
     * @param {{_min: number[], _max: number[]}} ext1 - 输入 AABB
     * @param {number[]} vec - 要合并的点
     */
    navi_utils.AABB_mergePoint = (extOut, ext1, vec) => {
      extOut._max[0] = Math.max(ext1._max[0], vec[0]);
      extOut._min[0] = Math.min(ext1._min[0], vec[0]);
      extOut._max[1] = Math.max(ext1._max[1], vec[1]);
      extOut._min[1] = Math.min(ext1._min[1], vec[1]);
      extOut._max[2] = Math.max(ext1._max[2], vec[2]);
      extOut._min[2] = Math.min(ext1._min[2], vec[2]);
    };

    /**
     * 检测 AABB 是否有效
     * @param {{_min: number[], _max: number[]}} aabb - AABB 对象
     * @returns {boolean} 是否有效
     */
    navi_utils.AABB_isValid = (aabb) => {
      return aabb._max[0] >= aabb._min[0] && aabb._max[1] >= aabb._min[1] && aabb._max[2] >= aabb._min[2] && aabb._max[0] >= 0;
    };

    navi_utils.Vector3_copy = (vec) => {
      return Vector3.copy(vec);
    };

    navi_utils.Vector3_add = (retVal, vec1, vec2) => {
      return Vector3.add(retVal, vec1, vec2);
    };

    navi_utils.Vector3_sub = (retVal, vec1, vec2) => {
      return Vector3.sub(retVal, vec1, vec2);
    };

    navi_utils.Vector3_scale = (retVal, vec, scale) => {
      return Vector3.scale(retVal, vec, scale);
    };

    navi_utils.Vector3_normalize = (retVal, vec) => {
      return Vector3.normalize(retVal, vec);
    };

    navi_utils.Vector3_length = (vec) => {
      return Vector3.length(vec);
    };

    navi_utils.Vector3_distance = (vec1, vec2) => {
      return Vector3.distance(vec1, vec2);
    };

    navi_utils.Vector3_dot = (vec1, vec2) => {
      return Vector3.dot(vec1, vec2);
    };

    navi_utils.Vector3_cross = (retVal, left, right) => {
      return Vector3.cross(retVal, left, right);
    };

    navi_utils.Vector3_transformCoord = (retVal, vec, mat) => {
      return Vector3.transformCoord(retVal, vec, mat);
    };

    navi_utils.Vector3_transformNormal = (retVal, vec, mat) => {
      return Vector3.transformNormal(retVal, vec, mat);
    };

    navi_utils.Vector3_lerp = (retVal, vec1, vec2, t) => {
      return Vector3.lerp(retVal, vec1, vec2, t);
    };

    navi_utils.Vector3_mad = (retVal, vec1, vec2, t) => {
      return Vector3.mad(retVal, vec1, vec2, t);
    };

    /**
     * 计算四元数的长度
     * @param {number[]} q - 四元数 [x, y, z, w]
     * @returns {number} 四元数的欧几里得范数
     */
    navi_utils.Quaternion_length = (q) => {
      return Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
    };

    /**
     * 四元数归一化
     * @param {number[]} retVal - 结果四元数
     * @param {number[]} q - 输入四元数
     * @returns {number[]} 归一化后的四元数
     */
    navi_utils.Quaternion_normalize = (retVal, q) => {
      const len = navi_utils.Quaternion_length(q);
      if (len > 1e-12) {
        const invLen = 1.0 / len;
        retVal[0] = q[0] * invLen;
        retVal[1] = q[1] * invLen;
        retVal[2] = q[2] * invLen;
        retVal[3] = q[3] * invLen;
      } else {
        retVal[0] = retVal[1] = retVal[2] = retVal[3] = 0.0;
      }
      return retVal;
    };

    /**
     * 四元数球面线性插值 (Slerp)
     * @param {number[]} retVal - 结果四元数
     * @param {number[]} q1 - 起始四元数
     * @param {number[]} q2 - 结束四元数
     * @param {number} t - 插值系数 [0, 1]
     */
    navi_utils.Quaternion_slerp = (retVal, q1, q2, t) => {
      const x1 = q1[0],
        y1 = q1[1],
        z1 = q1[2],
        w1 = q1[3];
      const x2 = q2[0],
        y2 = q2[1],
        z2 = q2[2],
        w2 = q2[3];
      const fCos = x1 * x2 + y1 * y2 + z1 * z2 + w1 * w2;

let x3, y3, z3, w3;
      if (fCos < 0.0) {
        fCos = -fCos;
        x3 = -x2;
        y3 = -y2;
        z3 = -z2;
        w3 = -w2;
      } else {
        x3 = x2;
        y3 = y2;
        z3 = z2;
        w3 = w2;
      }

      if (Math.abs(fCos) < 0.999) {
        const fSin = Math.sqrt(1 - fCos * fCos);
        const fAngle = Math.atan2(fSin, fCos);
        const fInvSin = 1.0 / fSin;
        const fCoeff0 = Math.sin((1.0 - t) * fAngle) * fInvSin;
        const fCoeff1 = Math.sin(t * fAngle) * fInvSin;
        retVal[0] = fCoeff0 * x1 + fCoeff1 * x3;
        retVal[1] = fCoeff0 * y1 + fCoeff1 * y3;
        retVal[2] = fCoeff0 * z1 + fCoeff1 * z3;
        retVal[3] = fCoeff0 * w1 + fCoeff1 * w3;
      } else {
        retVal[0] = (1.0 - t) * x1 + t * x3;
        retVal[1] = (1.0 - t) * y1 + t * y3;
        retVal[2] = (1.0 - t) * z1 + t * z3;
        retVal[3] = (1.0 - t) * w1 + t * w3;
        navi_utils.Quaternion_normalize(retVal, retVal);
      }
    };

    /**
     * 从欧拉角创建四元数 (YXZ 顺序)
     * @param {number[]} retVal - 结果四元数 [x, y, z, w]
     * @param {number} x - 绕 X 轴旋转角度（弧度）
     * @param {number} y - 绕 Y 轴旋转角度（弧度）
     * @param {number} z - 绕 Z 轴旋转角度（弧度）
     */
    navi_utils.Quaternion_fromEuler = (retVal, x, y, z) => {
      const c1 = Math.cos(y * 0.5),
        c2 = Math.cos(z * 0.5),
        c3 = Math.cos(x * 0.5);
      const s1 = Math.sin(y * 0.5),
        s2 = Math.sin(z * 0.5),
        s3 = Math.sin(x * 0.5);
      retVal[3] = c1 * c2 * c3 - s1 * s2 * s3;
      retVal[0] = s1 * s2 * c3 + c1 * c2 * s3;
      retVal[1] = s1 * c2 * c3 + c1 * s2 * s3;
      retVal[2] = c1 * s2 * c3 - s1 * c2 * s3;
    };

    /**
     * 将四元数转换为欧拉角
     * @param {number[]} retVal - 结果欧拉角 [x, y, z]（弧度）
     * @param {number[]} q - 四元数 [x, y, z, w]
     */
    navi_utils.Quaternion_toEuler = (retVal, q) => {
      const qx = q[0],
        qy = q[1],
        qz = q[2],
        qw = q[3];
      const qx2 = qx * qx,
        qy2 = qy * qy,
        qz2 = qz * qz;
      const test = qx * qy + qz * qw;

      if (test > 0.499) {
        retVal[0] = 0.0;
        retVal[1] = Math.atan2(qx, qw) * 2;
        retVal[2] = Math.PI * 0.5;
        return;
      }
      if (test < -0.499) {
        retVal[0] = 0.0;
        retVal[1] = -Math.atan2(qx, qw) * 2.0;
        retVal[2] = -Math.PI * 0.5;
        return;
      }

      retVal[0] = Math.atan2(2.0 * qx * qw - 2.0 * qy * qz, 1.0 - 2.0 * qx2 - 2.0 * qz2);
      retVal[1] = Math.atan2(2.0 * qy * qw - 2.0 * qx * qz, 1.0 - 2.0 * qy2 - 2.0 * qz2);
      retVal[2] = Math.asin(2.0 * test);
    };

    /**
     * 计算两点间的大地线距离（度数输入，对象格式）
     * @param {{x: number, y: number}} vec1 - 第一个坐标点
     * @param {{x: number, y: number}} vec2 - 第二个坐标点
     * @returns {number} 距离（米）
     */
    navi_utils.getGeodeticCircleDistance = (vec1, vec2) => {
      const dis =
        navi_utils.getGeodeticCircleRadians(vec1.x * DEGREE_TO_RADIAN, vec1.y * DEGREE_TO_RADIAN, vec2.x * DEGREE_TO_RADIAN, vec2.y * DEGREE_TO_RADIAN) *
        earthRadius;
      return isNaN(dis) ? 0 : dis;
    };

    /**
     * 计算两点间的大地线距离（角秒输入，对象格式）
     * @param {{x: number, y: number}} vec1 - 第一个坐标点（角秒）
     * @param {{x: number, y: number}} vec2 - 第二个坐标点（角秒）
     * @returns {number} 距离（米）
     */
    navi_utils.getGeodeticCircleDistanceSecond = (vec1, vec2) => {
      const dis =
        navi_utils.getGeodeticCircleRadians(vec1.x * SECOND_TO_RADIAN, vec1.y * SECOND_TO_RADIAN, vec2.x * SECOND_TO_RADIAN, vec2.y * SECOND_TO_RADIAN) *
        earthRadius;
      return isNaN(dis) ? 0 : dis;
    };

    /**
     * 计算两点间的大地线距离（度数输入，数组格式）
     * @param {number[]} vec1 - 第一个坐标点 [lon, lat]
     * @param {number[]} vec2 - 第二个坐标点 [lon, lat]
     * @returns {number} 距离（米）
     */
    navi_utils.getGeodeticCircleDistanceVector = (vec1, vec2) => {
      const dis =
        navi_utils.getGeodeticCircleRadians(vec1[0] * DEGREE_TO_RADIAN, vec1[1] * DEGREE_TO_RADIAN, vec2[0] * DEGREE_TO_RADIAN, vec2[1] * DEGREE_TO_RADIAN) *
        earthRadius;
      return isNaN(dis) ? 0 : dis;
    };

    /**
     * 计算两点间的大地线距离（角秒输入，数组格式）
     * @param {number[]} vec1 - 第一个坐标点 [lon, lat]（角秒）
     * @param {number[]} vec2 - 第二个坐标点 [lon, lat]（角秒）
     * @returns {number} 距离（米）
     */
    navi_utils.getGeodeticCircleDistanceVectorSecond = (vec1, vec2) => {
      const dis =
        navi_utils.getGeodeticCircleRadians(vec1[0] * SECOND_TO_RADIAN, vec1[1] * SECOND_TO_RADIAN, vec2[0] * SECOND_TO_RADIAN, vec2[1] * SECOND_TO_RADIAN) *
        earthRadius;
      return isNaN(dis) ? 0 : dis;
    };

    /**
     * 遍历对象的私有属性
     * @param {Object} obj - 要遍历的对象
     * @param {Function} callbackFn - 回调函数 (key, value)
     */
    navi_utils.forEach = (obj, callbackFn) => {
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          callbackFn(key, obj[key]);
        }
      }
    };

    /**
     * 遍历对象的私有属性（可中断）
     * @param {Object} obj - 要遍历的对象
     * @param {Function} callbackFn - 回调函数 (key, value)，返回 1 时中断遍历
     */
    navi_utils.foreach = (obj, callbackFn) => {
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (callbackFn(key, obj[key]) === 1) break;
        }
      }
    };

    /**
     * 计算三点之间的拐弯角度
     * @param {{x: number, y: number}} a - 起始点
     * @param {{x: number, y: number}} b - 中间点（拐点）
     * @param {{x: number, y: number}} c - 结束点
     * @returns {number} 拐弯角度（度），左转为负，右转为正
     */
    navi_utils.calcAngel = (a, b, c) => {
      const a_sphr = [a.x * DEGREE_TO_RADIAN, a.y * DEGREE_TO_RADIAN, earthRadius];
      const b_sphr = [b.x * DEGREE_TO_RADIAN, b.y * DEGREE_TO_RADIAN, earthRadius];
      const c_sphr = [c.x * DEGREE_TO_RADIAN, c.y * DEGREE_TO_RADIAN, earthRadius];
      const a_ecef = [0, 0, 0],
        b_ecef = [0, 0, 0],
        c_ecef = [0, 0, 0];
      const e1 = [0, 0, 0],
        e2 = [0, 0, 0];
      navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
      navi_utils.transformGeographicToECEF(b_ecef, b_sphr);
      navi_utils.transformGeographicToECEF(c_ecef, c_sphr);
      navi_utils.Vector3_sub(e1, b_ecef, a_ecef);
      navi_utils.Vector3_sub(e2, c_ecef, b_ecef);
      navi_utils.Vector3_normalize(e1, e1);
      navi_utils.Vector3_normalize(e2, e2);
      const angle = Math.acos(navi_utils.Vector3_dot(e1, e2)) * RADIAN_TO_DEGREE;
      const right = [0, 0, 0],
        upNormal = [0, 0, 0];
      navi_utils.Vector3_normalize(upNormal, b_ecef);
      navi_utils.Vector3_cross(right, e2, e1);
      return navi_utils.Vector3_dot(right, upNormal) < 0 ? -angle : angle;
    };

    /**
     * 计算从 b 点指向 c 点的航向角
     * @param {{x: number, y: number}} b - 起始点
     * @param {{x: number, y: number}} c - 结束点
     * @returns {number} 航向角（度），0-360
     */
    navi_utils.calcHeading = (b, c) => {
      const a_sphr = [b.x * DEGREE_TO_RADIAN, (b.y + 1) * DEGREE_TO_RADIAN, earthRadius];
      const b_sphr = [b.x * DEGREE_TO_RADIAN, b.y * DEGREE_TO_RADIAN, earthRadius];
      const c_sphr = [c.x * DEGREE_TO_RADIAN, c.y * DEGREE_TO_RADIAN, earthRadius];
      const a_ecef = [0, 0, 0],
        b_ecef = [0, 0, 0],
        c_ecef = [0, 0, 0];
      const e1 = [0, 0, 0],
        e2 = [0, 0, 0];
      navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
      navi_utils.transformGeographicToECEF(b_ecef, b_sphr);
      navi_utils.transformGeographicToECEF(c_ecef, c_sphr);
      navi_utils.Vector3_sub(e1, a_ecef, b_ecef);
      navi_utils.Vector3_sub(e2, c_ecef, b_ecef);
      navi_utils.Vector3_normalize(e1, e1);
      navi_utils.Vector3_normalize(e2, e2);
      const angle = Math.acos(navi_utils.Vector3_dot(e1, e2)) * RADIAN_TO_DEGREE;
      const right = [0, 0, 0],
        upNormal = [0, 0, 0];
      navi_utils.Vector3_normalize(upNormal, b_ecef);
      navi_utils.Vector3_cross(right, e2, e1);
      return navi_utils.Vector3_dot(right, upNormal) < 0 ? 360 - angle : angle;
    };

    /**
     * 计算两点之间的方位角
     * @param {number[]} p1 - 起始点 [lon, lat]
     * @param {number[]} p2 - 结束点 [lon, lat]
     * @returns {number} 方位角（弧度）
     */
    navi_utils.getAzimuth = (p1, p2) => {
      const angle = Math.asin(Math.abs(p2[1] - p1[1]) / navi_utils.getGeodeticCircleDistance(p1, p2));
      if (p2[1] >= p1[1] && p2[0] >= p1[0]) return angle + Math.PI;
      if (p2[1] >= p1[1] && p2[0] < p1[0]) return Math.PI * 2 - angle;
      if (p2[1] < p1[1] && p2[0] < p1[0]) return angle;
      return Math.PI - angle;
    };

    /**
     * 计算点到线段的最短距离
     * @param {number[]} point - 点坐标
     * @param {number[]} v1 - 线段起点
     * @param {number[]} v2 - 线段终点
     * @returns {number} 最短距离
     */
    navi_utils.minDistance = (point, v1, v2) => {
      const p_v1 = [0, 0, 0],
        p_v2 = [0, 0, 0],
        dir = [0, 0, 0];
      navi_utils.Vector3_sub(p_v1, point, v1);
      navi_utils.Vector3_sub(dir, v2, v1);
      const l_dir = navi_utils.Vector3_length(dir);
      if (l_dir === 0) return navi_utils.Vector3_length(p_v1);

      const t = (v1[1] - point[1]) * (v1[1] - v2[1]) - ((v1[0] - point[0]) * (v2[0] - v1[0])) / (l_dir * l_dir);
      if (t < 0 || t > 1) {
        navi_utils.Vector3_sub(p_v2, point, v2);
        return Math.min(navi_utils.Vector3_length(p_v2), navi_utils.Vector3_length(p_v1));
      }
      t = (v1[1] - point[1]) * (v2[0] - v1[0]) - ((v1[0] - point[0]) * (v2[1] - v1[1])) / l_dir;
      return Math.abs(t);
    };

    /**
     * 对几何路径进行重采样，按拐弯角度拆分为多个线段
     * @param {Array} geometry - 几何坐标数组
     * @returns {Array} 拆分后的线段数组
     */
    navi_utils.resamplerGeometry = (geometry) => {
      const geometry_new = [];
      const segmentArray = [];
      for (let kk = 0; kk < geometry.length; kk++) {
        geometry_new.push(navi_utils.getVector(geometry, kk));
      }
      if (geometry_new.length < 2) return segmentArray;

      const segment = [];
      segment.angel = 0;
      segment.segment_length = 0;
      segment.push(navi_utils.getVector(geometry_new, 0));
      segmentArray.push(segment);

      if (geometry_new.length === 2) {
        const A = geometry_new[0],
          B = geometry_new[1];
        geometry[1].segment_length = B.segment_length = navi_utils.getGeodeticCircleDistance(A, B);
        geometry.total_length = B.segment_length;
        segment.push(A);
        segment.push(B);
      } else {
        for (let i = 1; i < geometry_new.length - 1; i++) {
let A = geometry_new[i - 1],
            B = geometry_new[i],
            C = geometry_new[i + 1];
          const angel = navi_utils.calcAngel(A, B, C);
          geometry[i].segment_length = B.segment_length = navi_utils.getGeodeticCircleDistance(A, B);

          const isSplitSegment = !(i === 1 && B.segment_length < 0.1);
          if (i === geometry_new.length - 2) {
            C.segment_length = navi_utils.getGeodeticCircleDistance(B, C);
            if (C.segment_length < 0.1) isSplitSegment = false;
          }

          if (Math.abs(angel) > 30 && isSplitSegment) {
            segment.push(B);
            segment.angel = angel;
            segment.segment_length += B.segment_length;
            segment.next_pt = C;
            segment = [];
            segment.angel = 0;
            segment.segment_length = 0;
            segment.push(B);
            segmentArray.push(segment);
          } else {
            segment.push(B);
            segment.segment_length += B.segment_length;
          }
          geometry.total_length += B.segment_length;
        }
        const A = geometry_new[geometry_new.length - 2],
          B = geometry_new[geometry_new.length - 1];
        geometry[geometry.length - 1].segment_length = B.segment_length = navi_utils.getGeodeticCircleDistance(A, B);
        segment.push(B);
        segment.next_pt = B;
        segment.segment_length += B.segment_length;
        geometry.total_length += B.segment_length;
      }
      return segmentArray;
    };

    /**
     * 判断点是否在线段附近（通过 ECEF 坐标计算）
     * @param {number[]} checkPosition - 待检查点坐标 [lon, lat]
     * @param {number[]} segment0 - 线段起点 [lon, lat]
     * @param {number[]} segment1 - 线段终点 [lon, lat]
     * @param {number[]} intersctPosition - 输出最近点坐标
     * @param {number} [diffLen=0.1] - 容差距离
     * @returns {boolean} 点是否在线段附近
     */
    navi_utils.pointToLineInVector = (checkPosition, segment0, segment1, intersctPosition, diffLen) => {
      const pos_sphr = [checkPosition[0] * DEGREE_TO_RADIAN, checkPosition[1] * DEGREE_TO_RADIAN, earthRadius];
      const a_sphr = [segment0[0] * DEGREE_TO_RADIAN, segment0[1] * DEGREE_TO_RADIAN, earthRadius];
      const b_sphr = [segment1[0] * DEGREE_TO_RADIAN, segment1[1] * DEGREE_TO_RADIAN, earthRadius];
      const pos_ecef = [0, 0, 0],
        a_ecef = [0, 0, 0],
        b_ecef = [0, 0, 0];
      const root_ecef = [0, 0, 0],
        root_sphr = [0, 0, 0];
      navi_utils.transformGeographicToECEF(pos_ecef, pos_sphr);
      navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
      navi_utils.transformGeographicToECEF(b_ecef, b_sphr);

      const tempDistance = navi_utils.pointToLine(pos_ecef, a_ecef, b_ecef, root_ecef);
      if (tempDistance < (diffLen || 0.1)) {
        navi_utils.transformECEFToGeographic(root_sphr, root_ecef);
        intersctPosition[0] = root_sphr[0] * RADIAN_TO_DEGREE;
        intersctPosition[1] = root_sphr[1] * RADIAN_TO_DEGREE;
        intersctPosition[2] = 0;
        intersctPosition.dis = tempDistance;
        return true;
      }
      return false;
    };

    /**
     * 判断点是否在矩形区域内
     * @param {number} x - 矩形左上角 x
     * @param {number} y - 矩形左上角 y
     * @param {number} endx - 矩形右下角 x
     * @param {number} endy - 矩形右下角 y
     * @param {number} px - 点 x
     * @param {number} py - 点 y
     * @returns {boolean} 点是否在矩形内
     */
    navi_utils.isPointOnLine = (x, y, endx, endy, px, py) => {
      x = parseInt(x);
      y = parseInt(y);
      endx = parseInt(endx);
      endy = parseInt(endy);
      px = parseInt(px);
      py = parseInt(py);
      if ((x === endx && y === endy) || (x === px && y === py)) return true;
      return px >= x && px <= endx && py >= y && py <= endy;
    };

    /**
     * 计算点到线段的距离，并返回最近点
     * @param {number[]} point - 点坐标
     * @param {number[]} p1 - 线段起点
     * @param {number[]} p2 - 线段终点
     * @param {number[]} proot - 输出最近点
     * @returns {number} 点到线段的距离
     */
    navi_utils.pointToLine = (point, p1, p2, proot) => {
      const p_v1 = [0, 0, 0],
        p_v2 = [0, 0, 0],
        dir = [0, 0, 0];
      navi_utils.Vector3_sub(p_v1, point, p1);
      navi_utils.Vector3_sub(p_v2, point, p2);
      navi_utils.Vector3_sub(dir, p1, p2);

      const a = navi_utils.Vector3_length(dir);
      const b = navi_utils.Vector3_length(p_v1);
      const c = navi_utils.Vector3_length(p_v2);

      // 点在线段上
      if (c + b === a) {
        proot[0] = point[0];
        proot[1] = point[1];
        proot[2] = point[2];
        return 0;
      }
      // 线段退化为点
      if (a <= 0.00001) {
        proot[0] = p1[0];
        proot[1] = p1[1];
        proot[2] = p1[2];
        return b;
      }
      // 投影在 p1 外侧
      if (c * c >= a * a + b * b) {
        proot[0] = p1[0];
        proot[1] = p1[1];
        proot[2] = p1[2];
        return b;
      }
      // 投影在 p2 外侧
      if (b * b >= a * a + c * c) {
        proot[0] = p2[0];
        proot[1] = p2[1];
        proot[2] = p2[2];
        return c;
      }
      // 海伦公式求点到线距离
      const p0 = (a + b + c) / 2;
      const s = Math.sqrt(p0 * (p0 - a) * (p0 - b) * (p0 - c));
      const ans = (2 * s) / a;
      navi_utils.point2line(point, p1, p2, proot);
      return ans;
    };

    /**
     * 计算点在直线上的投影点
     * @param {number[]} p - 点坐标
     * @param {number[]} p1 - 直线上的点 1
     * @param {number[]} p2 - 直线上的点 2
     * @param {number[]} Q - 输出投影点
     * @returns {number} 1
     */
    navi_utils.point2line = (p, p1, p2, Q) => {
      const a = p2[0] - p1[0],
        b = p2[1] - p1[1],
        c = p2[2] - p1[2];
      const A = a * p[0] + b * p[1] + c * p[2];
      const B = b * p1[0] - a * p1[1];
      const C = c * p1[0] - a * p1[2];
      if (a !== 0) {
        Q[0] = (A * a + B * b + C * c) / (a * a + b * b + c * c);
        Q[1] = (b * Q[0] - B) / a;
        Q[2] = (c * Q[0] - C) / a;
      } else {
        const D = c * p1[1] - b * p1[2];
        const temp = b * b + c * c;
        Q[1] = (A * b + D * c) / temp;
        Q[2] = (A * c - D * b) / temp;
        Q[0] = (B + a * Q[1]) / b;
      }
      return 1;
    };

    /**
     * 时间格式化内部函数
     * @private
     */
    const _formatTime = (time, onsec, language) => {
      const unitSec = language === "En" ? " seconds " : "秒";
      const unitMinute = language === "En" ? " minutes " : "分钟";
      const unitHours = language === "En" ? " hours " : "小时";
      if (time == null || time === "") return time;

      if (time > 60 && time < 3600) {
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        if (onsec) {
          return (sec > 30 ? min + 1 : min) + unitMinute;
        }
        return min + unitMinute + sec + unitSec;
      }
      if (time >= 3600 && time < 86400) {
        const hour = Math.floor(time / 3600);
        const min = Math.floor((time % 3600) / 60);
        const sec = Math.floor(time % 60);
        if (onsec) {
          return hour + unitHours + (sec > 30 ? min + 1 : min) + unitMinute;
        }
        return `${hour}${unitHours}${min}${unitMinute}${sec}${unitSec}`;
      }
      return onsec ? `1${unitMinute}` : `${Math.floor(time)}${unitSec}`;
    }

    /**
     * 将毫秒转换为可读的时间格式
     * @param {number} msd - 毫秒数
     * @param {boolean} [onsec] - 是否省略秒数
     * @param {string} [language] - 语言 ('En' 或中文)
     * @returns {string} 格式化的时间字符串
     */
    navi_utils.MillisecondToDate = (msd, onsec, language) => {
      return _formatTime(parseFloat(msd) / 1000, onsec, language);
    };

    /**
     * 将秒数转换为可读的时间格式
     * @param {number} time - 秒数
     * @param {boolean} [onsec] - 是否省略秒数
     * @param {string} [language] - 语言 ('En' 或中文)
     * @returns {string} 格式化的时间字符串
     */
    navi_utils.secondToDate = (time, onsec, language) => {
      return _formatTime(time, onsec, language);
    };

    /**
     * 地理坐标球面插值
     * @param {number[]} retVal - 结果坐标
     * @param {number[]} a - 起始坐标 [lon, lat]
     * @param {number[]} b - 结束坐标 [lon, lat]
     * @param {number} t - 插值系数 [0, 1]
     */
    navi_utils.slerp = (retVal, a, b, t) => {
      const a_sphr = [a[0] * DEGREE_TO_RADIAN, a[1] * DEGREE_TO_RADIAN, earthRadius];
      const b_sphr = [b[0] * DEGREE_TO_RADIAN, b[1] * DEGREE_TO_RADIAN, earthRadius];
      const a_ecef = [0, 0, 0],
        b_ecef = [0, 0, 0];
      navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
      navi_utils.transformGeographicToECEF(b_ecef, b_sphr);
      navi_utils.Vector3_lerp(retVal, a_ecef, b_ecef, t);
      navi_utils.transformECEFToGeographic(retVal, retVal);
      retVal[0] = retVal[0] * RADIAN_TO_DEGREE;
      retVal[1] = retVal[1] * RADIAN_TO_DEGREE;
      retVal[2] = 0;
    };

    /**
     * 计算几何图形的中心点和视距
     * @param {Array} geometry - 几何坐标数组
     * @param {number} [tilt] - 倾斜角度（未使用）
     * @returns {{center_x: number, center_y: number, angel: number, distance: number}} 中心和视距信息
     */
    navi_utils.calcCenterAndDistance = (geometry) => {
      const minx = Infinity,
        miny = Infinity,
        maxx = -Infinity,
        maxy = -Infinity;
      for (let i = 0; i < geometry.length; i++) {
        minx = Math.min(minx, geometry[i].x);
        miny = Math.min(miny, geometry[i].y);
        maxx = Math.max(maxx, geometry[i].x);
        maxy = Math.max(maxy, geometry[i].y);
      }
      const center_x = (maxx + minx) * 0.5;
      const center_y = (maxy + miny) * 0.5;
      const camera_viewportHeight = 3;
      const camera_frustum_fovy = Math.PI * 0.25;
      const tempScale = Math.tan(camera_frustum_fovy * 0.5) / (camera_viewportHeight * 0.5);
      const maxTileWidth =
        navi_utils.getGeodeticCircleRadians(minx * DEGREE_TO_RADIAN, miny * DEGREE_TO_RADIAN, maxx * DEGREE_TO_RADIAN, maxy * DEGREE_TO_RADIAN) *
        earthRadius *
        0.5;
      const distance = Math.max(50, Math.min(maxTileWidth / tempScale, 190));
      return {
        center_x: center_x,
        center_y: center_y,
        angel: -(geometry.angel + geometry.angel2),
        distance: distance,
      };
    };

    /**
     * 判断点相对于线段的位置（左侧/右侧/线上）
     * @param {number[]} point_judge - 待判断点
     * @param {number[]} section_point1 - 线段起点
     * @param {number[]} section_point2 - 线段终点
     * @param {number} epsilon - 容差值
     * @returns {number} 0=在线上, -1=左侧, 1=右侧
     */
    navi_utils.judgeSide = (point_judge, section_point1, section_point2, epsilon) => {
      const line_vec = [section_point2[0] - section_point1[0], section_point2[1] - section_point1[1], 0];
      navi_utils.Vector3_normalize(line_vec, line_vec);
      const test_vec = [point_judge[0] - section_point1[0], point_judge[1] - section_point1[1], 0];
      const length = navi_utils.Vector3_length(test_vec);
      navi_utils.Vector3_normalize(test_vec, test_vec);

      const val = Math.acos(navi_utils.Vector3_dot(line_vec, test_vec));
      if (length * Math.sin(val) < epsilon) return 0;

      const cross = [0, 0, 0];
      navi_utils.Vector3_cross(cross, test_vec, line_vec);
      return navi_utils.Vector3_dot(cross, [0, 0, 1]) < 0 ? -1 : 1;
    };

    /**
     * 过滤几何坐标点，移除距离过近的点
     * @param {Array} geometry - 原始几何坐标数组
     * @param {Array} geometry_new - 输出过滤后的数组
     * @returns {number} 过滤后的点数
     */
    navi_utils.purifyGeometry = (geometry, geometry_new) => {
      if (geometry.length === 0) return 0;
      geometry_new.push(navi_utils.getVector(geometry, 0));
      for (let kk = 0; kk < geometry.length - 1; kk++) {
        const tempPt = navi_utils.getVector(geometry, kk);
        const tempPt2 = navi_utils.getVector(geometry, kk + 1);
        if (navi_utils.getGeodeticCircleDistance(tempPt, tempPt2) > 0.1) {
          geometry_new.push(tempPt2);
        }
      }
      return geometry_new.length;
    };

    /**
     * 计算几何路径每段的长度（数组格式坐标）
     * @param {Array} geometry_new - 几何坐标数组
     */
    navi_utils.calcGeometrySegmentLengthVector = (geometry_new) => {
      if (geometry_new.length === 0) return;
      geometry_new.total_length = 0;
      geometry_new[0].segment_length = 0;
      geometry_new[0].sequence_length = 0;
      for (let kk = 0; kk < geometry_new.length - 1; kk++) {
        const distance = navi_utils.getGeodeticCircleDistanceVector(geometry_new[kk], geometry_new[kk + 1]);
        geometry_new[kk + 1].segment_length = distance;
        geometry_new[kk + 1].sequence_length = geometry_new.total_length + distance;
        geometry_new.total_length += distance;
      }
    };

    /**
     * 计算几何路径的总长度（数组格式坐标）
     * @param {Array} geometry_new - 几何坐标数组
     * @returns {number} 总长度
     */
    navi_utils.calcGeometryLengthVector = (geometry_new) => {
      if (geometry_new.length === 0) return 0;
      const totalLength = 0;
      for (let kk = 0; kk < geometry_new.length - 1; kk++) {
        totalLength += navi_utils.getGeodeticCircleDistanceVector(geometry_new[kk], geometry_new[kk + 1]);
      }
      return totalLength;
    };

    /**
     * 计算两点间的角度（相对于正北方向）
     * @param {{x: number, y: number}} start - 起始点
     * @param {{x: number, y: number}} end - 结束点
     * @returns {number} 角度（0-360度）
     */
    navi_utils.getAngle = (start, end) => {
      const diff_x = (end.x - start.x) * 100000;
      const diff_y = (end.y - start.y) * 100000;
      const invLen = 1 / Math.sqrt(diff_x * diff_x + diff_y * diff_y);
      const dotValue = diff_y * invLen;
      const angle = (Math.acos(dotValue) / Math.PI) * 180;
      return diff_x < 0 ? 360 - angle : angle;
    };

    /**
     * 计算两点间的欧氏距离
     * @param {Array|Object} startPnt - 起始点
     * @param {Array|Object} endPnt - 结束点
     * @returns {number} 距离
     */
    navi_utils.calcMectroPointLen = (startPnt, endPnt) => {
      const x1 = startPnt[0] || startPnt.x;
      const y1 = startPnt[1] || startPnt.y;
      const x2 = endPnt[0] || endPnt.x;
      const y2 = endPnt[1] || endPnt.y;
      return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    };

    /**
     * 计算两点间的弧度角
     * @param {Array|Object} startPnt - 起始点
     * @param {Array|Object} endPnt - 结束点
     * @returns {number} 弧度角
     */
    navi_utils.getRadianAngle = (startPnt, endPnt) => {
      const x1 = startPnt[0] || startPnt.x;
      const y1 = startPnt[1] || startPnt.y;
      const x2 = endPnt[0] || endPnt.x;
      const y2 = endPnt[1] || endPnt.y;
      const dis = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
      const angle = Math.acos(Math.abs(y2 - y1) / dis);
      if (y2 >= y1 && x2 >= x1) return angle;
      if (y2 >= y1 && x2 < x1) return P.Constants.TWO_PI - angle;
      if (y2 < y1 && x2 < x1) return Math.PI + angle;
      return Math.PI - angle;
    };

    /**
     * 根据角度和距离计算新坐标
     * @param {number[]} point - 起始点 [x, y]
     * @param {number} angle - 角度（弧度）
     * @param {number} dis - 距离
     * @returns {number[]} 新坐标 [x, y]
     */
    navi_utils.getMectroPointInAngleWidthDis = (point, angle, dis) => {
      return [point[0] + dis * Math.sin(angle), point[1] + dis * Math.cos(angle)];
    };

    /**
     * 计算几何路径每段的长度（对象格式坐标）
     * @param {Array} geometry_new - 几何坐标数组
     */
    navi_utils.calcGeometrySegmentLength = (geometry_new) => {
      if (geometry_new.length === 0) return;
      geometry_new.total_length = 0;
      geometry_new[0].segment_length = 0;
      geometry_new[0].sequence_length = 0;
      for (let kk = 0; kk < geometry_new.length - 1; kk++) {
        const distance = navi_utils.getGeodeticCircleDistance(geometry_new[kk], geometry_new[kk + 1]);
        geometry_new[kk + 1].segment_length = distance;
        geometry_new[kk + 1].sequence_length = geometry_new.total_length + distance;
        geometry_new.total_length += distance;
      }
    };

    /**
     * 计算几何路径每个点的拐弯角度
     * @param {Array} geometryLine - 几何坐标数组
     * @returns {number} 点数
     */
    navi_utils.calcGeometryAngel = (geometryLine) => {
      if (geometryLine.length === 0) return 0;
      geometryLine[0].angel = 0;
      geometryLine[geometryLine.length - 1].angel = 0;
      for (let i = 1; i < geometryLine.length - 1; i++) {
        geometryLine[i].angel = navi_utils.calcAngel(geometryLine[i - 1], geometryLine[i], geometryLine[i + 1]);
      }
      return geometryLine.length;
    };

    // 线段相交检测常量
    const LLR_NOT_INTERSECT = 0,
      LLR_INTERSECT = 1;
    const LLR_INTERSECT_POINT_A = 2,
      LLR_INTERSECT_POINT_B = 3;
    const LLR_INTERSECT_POINT_C = 4,
      LLR_INTERSECT_POINT_D = 5;

    /**
     * 检测两条线段是否相交
     * @param {number[]} v1 - 线段 1 起点
     * @param {number[]} v2 - 线段 1 终点
     * @param {number[]} p1 - 线段 2 起点
     * @param {number[]} p2 - 线段 2 终点
     * @param {number[]} intersect_point - 输出交点坐标
     * @param {number} epsl - 容差值
     * @returns {number} 相交结果类型 (0=不相交, 1=相交, 2-5=端点相交)
     */
    navi_utils.lineLineIntersect = (v1, v2, p1, p2, intersect_point, epsl) => {
      const p1_v1v2 = navi_utils.judgeSide(p1, v1, v2, epsl);
      const p2_v1v2 = navi_utils.judgeSide(p2, v1, v2, epsl);

      // p1 在线段 v1-v2 上
      if (p1_v1v2 === 0) {
        if (v1[0] !== v2[0] && (p1[0] - v1[0]) * (p1[0] - v2[0]) > 0) return LLR_NOT_INTERSECT;
        if (v1[1] !== v2[1] && (p1[1] - v1[1]) * (p1[1] - v2[1]) > 0) return LLR_NOT_INTERSECT;
        intersect_point[0] = p1[0];
        intersect_point[1] = p1[1];
        return LLR_INTERSECT_POINT_C;
      }
      // p2 在线段 v1-v2 上
      if (p2_v1v2 === 0) {
        if (v1[0] !== v2[0] && (p2[0] - v1[0]) * (p2[0] - v2[0]) > 0) return LLR_NOT_INTERSECT;
        if (v1[1] !== v2[1] && (p2[1] - v1[1]) * (p2[1] - v2[1]) > 0) return LLR_NOT_INTERSECT;
        intersect_point[0] = p2[0];
        intersect_point[1] = p2[1];
        return LLR_INTERSECT_POINT_D;
      }
      // p1、p2 在同侧
      if (p1_v1v2 === p2_v1v2) return LLR_NOT_INTERSECT;

      const v1_p1p2 = navi_utils.judgeSide(v1, p1, p2, epsl);
      const v2_p1p2 = navi_utils.judgeSide(v2, p1, p2, epsl);

      // v1、v2 在同侧
      if (v1_p1p2 === v2_p1p2) return LLR_NOT_INTERSECT;

      // v1 在线段 p1-p2 上
      if (v1_p1p2 === 0) {
        intersect_point[0] = v1[0];
        intersect_point[1] = v1[1];
        return LLR_INTERSECT_POINT_A;
      }
      // v2 在线段 p1-p2 上
      if (v2_p1p2 === 0) {
        intersect_point[0] = v2[0];
        intersect_point[1] = v2[1];
        return LLR_INTERSECT_POINT_B;
      }

      // 计算交点
      const denom = (p2[1] - p1[1]) * (v2[0] - v1[0]) - (p2[0] - p1[0]) * (v2[1] - v1[1]);
      const v_ua = ((p2[0] - p1[0]) * (v1[1] - p1[1]) - (p2[1] - p1[1]) * (v1[0] - p1[0])) / denom;
      intersect_point[0] = v1[0] + v_ua * (v2[0] - v1[0]);
      intersect_point[1] = v1[1] + v_ua * (v2[1] - v1[1]);
      return LLR_INTERSECT;
    };

    /**
     * 检测线段与多边形的交点
     * @param {Array} inSegment - 线段 [起点, 终点]
     * @param {Array} polygon - 多边形顶点数组
     * @param {Object} ret - 输出结果对象
     * @returns {number} 最小距离或 -1
     */
    navi_utils.segmentInterectPolygon = (inSegment, polygon, ret) => {
      const totalDistance = navi_utils.getGeodeticCircleDistanceVector(inSegment[0], inSegment[1]);
      const point0 = { point: inSegment[0], type: 0, distance: 0 };
      const point1 = { point: inSegment[1], type: 0, distance: totalDistance };
      const segment = [point0, point1];
      const inCount = 0;

      for (let i = 0; i < segment.length; i++) {
        if (navi_utils.pointInPolygon(segment[i].point, polygon)) {
          inCount++;
          ret.pointInPolygon.push(segment[i]);
        }
      }
      if (inCount === segment.length) return 0;

      const isinstersect = false;
      for (let i = 1; i < segment.length; i++) {
        const vecLine1 = segment[i - 1];
        const vecLine2 = segment[i];
        for (let j = 0; j < polygon.length; j++) {
          const intersect_point = [0, 0, 0];
          const retVal = navi_utils.lineLineIntersect(vecLine1.point, vecLine2.point, polygon[j], polygon[(j + 1) % polygon.length], intersect_point, 1e-8);
          if (retVal !== 0) {
            const distance = navi_utils.getGeodeticCircleDistanceVector(intersect_point, vecLine1.point);
            let intersectPt;
            if (distance < 0.1) {
              intersectPt = point0;
            } else if (Math.abs(distance - totalDistance) < 0.1) {
              intersectPt = point1;
            } else {
              intersectPt = { point: intersect_point, type: 1, distance: distance };
              intersectPt.point.sequence_length = vecLine1.point.sequence_length + distance;
            }
            ret.pointInPolygon.push(intersectPt);

            if (distance < ret.minDistance) {
              ret.minDistance = distance;
              ret.intersectPt = intersectPt;
              isinstersect = true;
            }
          }
        }
      }

      if (isinstersect) {
        ret.pointInPolygon.sort((a, b) => {
          return a.distance - b.distance;
        });
        return ret.minDistance;
      }
      return -1;
    };

    /**
     * 判断点是否在多边形内（射线法）
     * @param {number[]} pos - 点坐标
     * @param {Array} polygon - 多边形顶点数组
     * @returns {boolean} 是否在多边形内
     */
    navi_utils.pointInPolygon = (pos, polygon) => {
      const inside = false;
      const n = polygon.length;
      for (let i = 0; i < n; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % n];
        if (pos[1] < p2[1]) {
          if (pos[1] >= p1[1]) {
            if ((pos[1] - p1[1]) * (p2[0] - p1[0]) > (pos[0] - p1[0]) * (p2[1] - p1[1])) {
              inside = !inside;
            }
          }
        } else if (pos[1] < p1[1]) {
          if ((pos[1] - p1[1]) * (p2[0] - p1[0]) < (pos[0] - p1[0]) * (p2[1] - p1[1])) {
            inside = !inside;
          }
        }
      }
      return inside;
    };

    /**
     * 将经纬度转换为 UTM 坐标（经纬度到横轴墨卡托投影）
     * @param {number} phi - 纬度（弧度）
     * @param {number} lambda - 经度（弧度）
     * @param {number} lambda0 - 中央经线（弧度）
     * @param {number[]} utmXY - 输出 UTM 坐标 [x, y]
     */
    const MapLatLonToXY = (phi, lambda, lambda0, utmXY) => {
      const cosPhi = Math.cos(phi);
      const cosPhi2 = cosPhi * cosPhi;
      const cosPhi3 = cosPhi2 * cosPhi;
      const cosPhi4 = cosPhi3 * cosPhi;
      const cosPhi5 = cosPhi4 * cosPhi;
      const cosPhi6 = cosPhi5 * cosPhi;
      const cosPhi7 = cosPhi6 * cosPhi;
      const cosPhi8 = cosPhi7 * cosPhi;

      const ep2 = (sm_a * sm_a - sm_b * sm_b) / (sm_b * sm_b);
      const nu2 = ep2 * cosPhi2;
      const N = (sm_a * sm_a) / (sm_b * Math.sqrt(1 + nu2));
      const t = Math.tan(phi);
      const t2 = t * t;
      const t4 = t2 * t2;
      const l = lambda - lambda0;
      const l2 = l * l,
        l3 = l2 * l,
        l4 = l3 * l,
        l5 = l4 * l,
        l6 = l5 * l,
        l7 = l6 * l,
        l8 = l7 * l;

      const l3coef = 1.0 - t2 + nu2;
      const l4coef = 5.0 - t2 + 9 * nu2 + 4.0 * nu2 * nu2;
      const l5coef = 5.0 - 18.0 * t2 + t4 + 14.0 * nu2 - 58.0 * t2 * nu2;
      const l6coef = 61.0 - 58.0 * t2 + t4 + 270.0 * nu2 - 330.0 * t2 * nu2;
      const l7coef = 61.0 - 479.0 * t2 + 179.0 * t4 - t4 * t2;
      const l8coef = 1385.0 - 3111.0 * t2 + 543.0 * t4 - t4 * t2;

      utmXY[0] = N * cosPhi * l + (N / 6.0) * cosPhi3 * l3coef * l3 + (N / 120.0) * cosPhi5 * l5coef * l5 + (N / 5040.0) * cosPhi7 * l7coef * l7;

      utmXY[1] =
        ArcLengthOfMeridian(phi) +
        (t / 2.0) * N * cosPhi2 * l2 +
        (t / 24.0) * N * cosPhi4 * l4coef * l4 +
        (t / 720.0) * N * cosPhi6 * l6coef * l6 +
        (t / 40320.0) * N * cosPhi8 * l8coef * l8;
    }

    /**
     * 深拷贝数据对象
     * @param {*} data - 要拷贝的数据
     * @returns {*} 拷贝后的数据
     */
    navi_utils.copyData = (data) => {
      return JSON.parse(JSON.stringify(data));
    };

    /**
     * 将标记对象转换为 JSON 格式
     * @param {Object} marker - 标记对象
     * @returns {Object} JSON 格式的标记信息
     */
    navi_utils.parseToJSON = (marker) => {
      return {
        id: marker.id,
        floorId: marker.floorId,
        floorName: marker.floorName,
        level: marker.level,
        offsetX: marker.offsetX,
        offsetY: marker.offsetY,
        width: marker.width,
        height: marker.height,
        alpha: marker.alpha,
        icon: marker.icon,
        fontStyle: marker.fontStyle,
        lon: marker.lon,
        lat: marker.lat,
        showType: marker.showType,
        index: marker.index,
        name: marker.name,
        text: marker.text,
        isEndMarker: marker.isEndMarker,
      };
    };

    /**
     * 根据楼层 ID 解析真实楼层号
     * @param {string} floorId - 楼层 ID
     * @returns {number} 楼层号（负数表示地下）
     */
    navi_utils.getRealFloorNumbyFloorId = (floorId) => {
      const len = floorId.length;
      const startIndex = len - 8;
      const str1 = floorId.slice(startIndex + 1, len - 5);
      const flabs = parseInt(str1);
      return floorId[startIndex] === "0" ? -flabs : flabs;
    };
    DaxiApp["naviMath"] = navi_utils;

    //////////////////////////////////////////////////////////////
    // P - 常量工具库
    //////////////////////////////////////////////////////////////
    const P = {};
    P.Constants = {
      TWO_PI: Math.PI * 2,
      HALF_PI: Math.PI / 2,
      FITTING_COUNT: 100,
      ZERO_TOLERANCE: 0.0001,
    };

    /**
     * PlotUtils - 绘图工具库
     */
    const PlotUtils = {};

    /**
     * 计算两点间的距离
     * @param {number[]} pnt1 - 点 1
     * @param {number[]} pnt2 - 点 2
     * @returns {number} 距离
     */
    PlotUtils.distance = (pnt1, pnt2) => {
      const dx = pnt1[0] - pnt2[0],
        dy = pnt1[1] - pnt2[1];
      return Math.sqrt(dx * dx + dy * dy);
    };

    /**
     * 计算点序列的总距离
     * @param {Array} points - 点数组
     * @returns {number} 总距离
     */
    PlotUtils.wholeDistance = (points) => {
      const distance = 0;
      for (let i = 0; i < points.length - 1; i++) {
        distance += PlotUtils.distance(points[i], points[i + 1]);
      }
      return distance;
    };

    /**
     * 获取基准长度
     * @param {Array} points - 点数组
     * @returns {number} 基准长度
     */
    PlotUtils.getBaseLength = (points) => {
      return Math.pow(PlotUtils.wholeDistance(points), 0.99);
    };

    /**
     * 计算两点的中点
     * @param {number[]} pnt1 - 点 1
     * @param {number[]} pnt2 - 点 2
     * @returns {number[]} 中点坐标
     */
    PlotUtils.mid = (pnt1, pnt2) => {
      return [(pnt1[0] + pnt2[0]) / 2, (pnt1[1] + pnt2[1]) / 2];
    };

    /**
     * 求三点经过的圆心
     * @param {number[]} pnt1 - 点 1
     * @param {number[]} pnt2 - 点 2
     * @param {number[]} pnt3 - 点 3
     * @returns {number[]} 圆心坐标
     */
    PlotUtils.getCircleCenterOfThreePoints = (pnt1, pnt2, pnt3) => {
      const pntA = PlotUtils.mid(pnt1, pnt2);
      const pntB = [pntA[0] - pnt1[1] + pnt2[1], pntA[1] + pnt1[0] - pnt2[0]];
      const pntC = PlotUtils.mid(pnt1, pnt3);
      const pntD = [pntC[0] - pnt1[1] + pnt3[1], pntC[1] + pnt1[0] - pnt3[0]];
      return PlotUtils.getIntersectPoint(pntA, pntB, pntC, pntD);
    };

    /**
     * 求两条直线的交点
     * @param {number[]} pntA - 线 1 点 A
     * @param {number[]} pntB - 线 1 点 B
     * @param {number[]} pntC - 线 2 点 C
     * @param {number[]} pntD - 线 2 点 D
     * @returns {number[]} 交点坐标
     */
    PlotUtils.getIntersectPoint = (pntA, pntB, pntC, pntD) => {
      let x, y;
      if (pntA[1] === pntB[1]) {
        const f = (pntD[0] - pntC[0]) / (pntD[1] - pntC[1]);
        return [f * (pntA[1] - pntC[1]) + pntC[0], pntA[1]];
      }
      if (pntC[1] === pntD[1]) {
        const e = (pntB[0] - pntA[0]) / (pntB[1] - pntA[1]);
        return [e * (pntC[1] - pntA[1]) + pntA[0], pntC[1]];
      }
      const e = (pntB[0] - pntA[0]) / (pntB[1] - pntA[1]);
      const f = (pntD[0] - pntC[0]) / (pntD[1] - pntC[1]);
      y = (e * pntA[1] - pntA[0] - f * pntC[1] + pntC[0]) / (e - f);
      x = e * y - e * pntA[1] + pntA[0];
      return [x, y];
    };

    /**
     * 计算两点方位角
     * @param {number[]} startPnt - 起始点
     * @param {number[]} endPnt - 结束点
     * @returns {number} 方位角（弧度）
     */
    PlotUtils.getAzimuth = (startPnt, endPnt) => {
      const angle = Math.asin(Math.abs(endPnt[1] - startPnt[1]) / PlotUtils.distance(startPnt, endPnt));
      if (endPnt[1] >= startPnt[1] && endPnt[0] >= startPnt[0]) return angle + Math.PI;
      if (endPnt[1] >= startPnt[1] && endPnt[0] < startPnt[0]) return P.Constants.TWO_PI - angle;
      if (endPnt[1] < startPnt[1] && endPnt[0] < startPnt[0]) return angle;
      return Math.PI - angle;
    };

    /**
     * 计算三点夹角
     * @param {number[]} pntA - 点 A
     * @param {number[]} pntB - 顶点 B
     * @param {number[]} pntC - 点 C
     * @returns {number} 夹角（弧度）
     */
    PlotUtils.getAngleOfThreePoints = (pntA, pntB, pntC) => {
      const angle = PlotUtils.getAzimuth(pntB, pntA) - PlotUtils.getAzimuth(pntB, pntC);
      return angle < 0 ? angle + P.Constants.TWO_PI : angle;
    };

    /**
     * 判断三点是否顺时针
     * @param {number[]} pnt1 - 点 1
     * @param {number[]} pnt2 - 点 2
     * @param {number[]} pnt3 - 点 3
     * @returns {boolean} 是否顺时针
     */
    PlotUtils.isClockWise = (pnt1, pnt2, pnt3) => {
      return (pnt3[1] - pnt1[1]) * (pnt2[0] - pnt1[0]) > (pnt2[1] - pnt1[1]) * (pnt3[0] - pnt1[0]);
    };

    /**
     * 获取线段上的点
     * @param {number} t - 插值系数 [0, 1]
     * @param {number[]} startPnt - 起点
     * @param {number[]} endPnt - 终点
     * @returns {number[]} 点坐标
     */
    PlotUtils.getPointOnLine = (t, startPnt, endPnt) => {
      return [startPnt[0] + t * (endPnt[0] - startPnt[0]), startPnt[1] + t * (endPnt[1] - startPnt[1])];
    };

    /**
     * 计算三次贝塞尔曲线上的点
     * @param {number} t - 插值系数 [0, 1]
     * @param {number[]} startPnt - 起点
     * @param {number[]} cPnt1 - 控制点 1
     * @param {number[]} cPnt2 - 控制点 2
     * @param {number[]} endPnt - 终点
     * @returns {number[]} 点坐标
     */
    PlotUtils.getCubicValue = (t, startPnt, cPnt1, cPnt2, endPnt) => {
      t = Math.max(Math.min(t, 1), 0);
      const tp = 1 - t,
        t2 = t * t,
        t3 = t2 * t,
        tp2 = tp * tp,
        tp3 = tp2 * tp;
      return [
        tp3 * startPnt[0] + 3 * tp2 * t * cPnt1[0] + 3 * tp * t2 * cPnt2[0] + t3 * endPnt[0],
        tp3 * startPnt[1] + 3 * tp2 * t * cPnt1[1] + 3 * tp * t2 * cPnt2[1] + t3 * endPnt[1],
      ];
    };

    /**
     * 获取第三点（根据角度和距离）
     * @param {number[]} startPnt - 起点
     * @param {number[]} endPnt - 终点
     * @param {number} angle - 角度
     * @param {number} distance - 距离
     * @param {boolean} clockWise - 是否顺时针
     * @returns {number[]} 第三点坐标
     */
    PlotUtils.getThirdPoint = (startPnt, endPnt, angle, distance, clockWise) => {
      const azimuth = PlotUtils.getAzimuth(startPnt, endPnt);
      const alpha = clockWise ? azimuth + angle : azimuth - angle;
      return [endPnt[0] + distance * Math.cos(alpha), endPnt[1] + distance * Math.sin(alpha)];
    };

    /**
     * 获取圆弧上的点
     * @param {number[]} center - 圆心
     * @param {number} radius - 半径
     * @param {number} startAngle - 起始角
     * @param {number} endAngle - 结束角
     * @returns {Array} 圆弧上的点数组
     */
    PlotUtils.getArcPoints = (center, radius, startAngle, endAngle) => {
      const pnts = [];
      const angleDiff = endAngle - startAngle;
      if (angleDiff < 0) angleDiff += P.Constants.TWO_PI;
      for (let i = 0; i <= P.Constants.FITTING_COUNT; i++) {
        const angle = startAngle + (angleDiff * i) / P.Constants.FITTING_COUNT;
        pnts.push([center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle)]);
      }
      return pnts;
    };

    /**
     * 获取角平分线法向量点
     * @param {number} t - 张力系数
     * @param {number[]} pnt1 - 前一个点
     * @param {number[]} pnt2 - 当前顶点
     * @param {number[]} pnt3 - 后一个点
     * @returns {Array} [右侧法向量点, 左侧法向量点]
     */
    PlotUtils.getBisectorNormals = (t, pnt1, pnt2, pnt3) => {
      const normal = PlotUtils.getNormal(pnt1, pnt2, pnt3);
      const dist = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1]);
      let bisectorNormalRight, bisectorNormalLeft;

      if (dist > P.Constants.ZERO_TOLERANCE) {
        const uX = normal[0] / dist,
          uY = normal[1] / dist;
        const d1 = PlotUtils.distance(pnt1, pnt2);
        const d2 = PlotUtils.distance(pnt2, pnt3);
        const isClockWise = PlotUtils.isClockWise(pnt1, pnt2, pnt3);
        const sign = isClockWise ? 1 : -1;
        const dt1 = t * d1,
          dt2 = t * d2;
        bisectorNormalRight = [pnt2[0] - sign * dt1 * uY, pnt2[1] + sign * dt1 * uX];
        bisectorNormalLeft = [pnt2[0] + sign * dt2 * uY, pnt2[1] - sign * dt2 * uX];
      } else {
        bisectorNormalRight = [pnt2[0] + t * (pnt1[0] - pnt2[0]), pnt2[1] + t * (pnt1[1] - pnt2[1])];
        bisectorNormalLeft = [pnt2[0] + t * (pnt3[0] - pnt2[0]), pnt2[1] + t * (pnt3[1] - pnt2[1])];
      }
      return [bisectorNormalRight, bisectorNormalLeft];
    };

    /**
     * 获取三点的法向量
     * @param {number[]} pnt1 - 点 1
     * @param {number[]} pnt2 - 顶点
     * @param {number[]} pnt3 - 点 3
     * @returns {number[]} 法向量
     */
    PlotUtils.getNormal = (pnt1, pnt2, pnt3) => {
      const dX1 = pnt1[0] - pnt2[0],
        dY1 = pnt1[1] - pnt2[1];
      const d1 = Math.sqrt(dX1 * dX1 + dY1 * dY1);
      dX1 /= d1;
      dY1 /= d1;
      const dX2 = pnt3[0] - pnt2[0],
        dY2 = pnt3[1] - pnt2[1];
      const d2 = Math.sqrt(dX2 * dX2 + dY2 * dY2);
      dX2 /= d2;
      dY2 /= d2;
      return [dX1 + dX2, dY1 + dY2];
    };

    /**
     * 获取平滑曲线点
     * @param {number} t - 张力系数
     * @param {Array} controlPoints - 控制点数组
     * @returns {Array} 曲线点数组
     */
    PlotUtils.getCurvePoints = (t, controlPoints) => {
      const leftControl = PlotUtils.getLeftMostControlPoint(controlPoints);
      const normals = [leftControl];
      for (let i = 0; i < controlPoints.length - 2; i++) {
        const normalPoints = PlotUtils.getBisectorNormals(t, controlPoints[i], controlPoints[i + 1], controlPoints[i + 2]);
        normals = normals.concat(normalPoints);
      }
      normals.push(PlotUtils.getRightMostControlPoint(controlPoints));

      const points = [];
      for (i = 0; i < controlPoints.length - 1; i++) {
        const pnt1 = controlPoints[i],
          pnt2 = controlPoints[i + 1];
        points.push(pnt1);

        for (let j = 0; j < P.Constants.FITTING_COUNT; j++) {
          points.push(PlotUtils.getCubicValue(j / P.Constants.FITTING_COUNT, pnt1, normals[i * 2], normals[i * 2 + 1], pnt2));
        }
        points.push(pnt2);
      }
      return points;
    };

    /**
     * 获取最左侧控制点
     * @param {Array} controlPoints - 控制点数组
     * @returns {number[]} 控制点坐标
     */
    PlotUtils.getLeftMostControlPoint = (controlPoints) => {
      const pnt1 = controlPoints[0],
        pnt2 = controlPoints[1],
        pnt3 = controlPoints[2];
      const normalRight = PlotUtils.getBisectorNormals(0, pnt1, pnt2, pnt3)[0];
      const normal = PlotUtils.getNormal(pnt1, pnt2, pnt3);
      const dist = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1]);
      let controlX, controlY;
      if (dist > P.Constants.ZERO_TOLERANCE) {
        const mid = PlotUtils.mid(pnt1, pnt2);
        const pX = pnt1[0] - mid[0],
          pY = pnt1[1] - mid[1];
        const n = 2.0 / PlotUtils.distance(pnt1, pnt2);
        const nX = -n * pY,
          nY = n * pX;
        const a11 = nX * nX - nY * nY,
          a12 = 2 * nX * nY,
          a22 = nY * nY - nX * nX;
        const dX = normalRight[0] - mid[0],
          dY = normalRight[1] - mid[1];
        controlX = mid[0] + a11 * dX + a12 * dY;
        controlY = mid[1] + a12 * dX + a22 * dY;
      } else {
        controlX = pnt1[0] + 0.4 * (pnt2[0] - pnt1[0]);
        controlY = pnt1[1] + 0.4 * (pnt2[1] - pnt1[1]);
      }
      return [controlX, controlY];
    };

    /**
     * 获取最右侧控制点
     * @param {Array} controlPoints - 控制点数组
     * @returns {number[]} 控制点坐标
     */
    PlotUtils.getRightMostControlPoint = (controlPoints) => {
      const count = controlPoints.length;
      const pnt1 = controlPoints[count - 3],
        pnt2 = controlPoints[count - 2],
        pnt3 = controlPoints[count - 1];
      const normalLeft = PlotUtils.getBisectorNormals(0, pnt1, pnt2, pnt3)[1];
      const normal = PlotUtils.getNormal(pnt1, pnt2, pnt3);
      const dist = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1]);
      let controlX, controlY;
      if (dist > P.Constants.ZERO_TOLERANCE) {
        const mid = PlotUtils.mid(pnt2, pnt3);
        const pX = pnt3[0] - mid[0],
          pY = pnt3[1] - mid[1];
        const n = 2.0 / PlotUtils.distance(pnt2, pnt3);
        const nX = -n * pY,
          nY = n * pX;
        const a11 = nX * nX - nY * nY,
          a12 = 2 * nX * nY,
          a22 = nY * nY - nX * nX;
        const dX = normalLeft[0] - mid[0],
          dY = normalLeft[1] - mid[1];
        controlX = mid[0] + a11 * dX + a12 * dY;
        controlY = mid[1] + a12 * dX + a22 * dY;
      } else {
        controlX = pnt3[0] + 0.4 * (pnt2[0] - pnt3[0]);
        controlY = pnt3[1] + 0.4 * (pnt2[1] - pnt3[1]);
      }
      return [controlX, controlY];
    };

    /**
     * 获取贝塞尔曲线点
     * @param {Array} points - 控制点数组
     * @returns {Array} 贝塞尔曲线点数组
     */
    PlotUtils.getBezierPoints = (points) => {
      if (points.length <= 2) return points;
      const bezierPoints = [];
      const n = points.length - 1;
      for (let t = 0; t <= 1; t += 0.01) {
        const x = 0,
          y = 0;
        for (let index = 0; index <= n; index++) {
          const factor = PlotUtils.getBinomialFactor(n, index);
          const a = Math.pow(t, index);
          const b = Math.pow(1 - t, n - index);
          x += factor * a * b * points[index][0];
          y += factor * a * b * points[index][1];
        }
        bezierPoints.push([x, y]);
      }
      bezierPoints.push(points[n]);
      return bezierPoints;
    };

    /**
     * 计算二项式系数
     * @param {number} n - 总数
     * @param {number} index - 索引
     * @returns {number} 二项式系数
     */
    PlotUtils.getBinomialFactor = (n, index) => {
      return PlotUtils.getFactorial(n) / (PlotUtils.getFactorial(index) * PlotUtils.getFactorial(n - index));
    };

    // 阶乘缓存
    const factorialCache = [1, 1, 2, 6, 24, 120];

    /**
     * 计算阶乘
     * @param {number} n - 数字
     * @returns {number} 阶乘结果
     */
    PlotUtils.getFactorial = (n) => {
      if (n < factorialCache.length) return factorialCache[n];
      const result = factorialCache[factorialCache.length - 1];
      for (let i = factorialCache.length; i <= n; i++) {
        result *= i;
        factorialCache[i] = result;
      }
      return result;
    };

    /**
     * 获取二次 B 样条曲线点
     * @param {Array} points - 控制点数组
     * @returns {Array} B 样条曲线点数组
     */
    PlotUtils.getQBSplinePoints = (points) => {
      if (points.length <= 2) return points;
      const bSplinePoints = [points[0]];
      const m = points.length - 3;
      for (let i = 0; i <= m; i++) {
        for (let t = 0; t <= 1; t += 0.05) {
          const x = 0,
            y = 0;
          for (let k = 0; k <= 2; k++) {
            const factor = PlotUtils.getQuadricBSplineFactor(k, t);
            x += factor * points[i + k][0];
            y += factor * points[i + k][1];
          }
          bSplinePoints.push([x, y]);
        }
      }
      bSplinePoints.push(points[points.length - 1]);
      return bSplinePoints;
    };

    /**
     * 获取二次 B 样条基函数值
     * @param {number} k - 索引
     * @param {number} t - 参数
     * @returns {number} 基函数值
     */
    PlotUtils.getQuadricBSplineFactor = (k, t) => {
      const t1 = 1 - t;
      if (k === 0) return (t1 * t1) / 2;
      if (k === 1) return (-2 * t * t + 2 * t + 1) / 2;
      if (k === 2) return (t * t) / 2;
      return 0;
    };
  })(DaxiApp);

  /**
   * 检查一个值是否已定义（非 undefined 且非 null）
   * @param {*} value - 要检查的值
   * @returns {boolean} 如果值已定义则返回 true，否则返回 false
   * @example
   * if (DaxiApp.defined(positions)) {
   *   doSomething();
   * } else {
   *   doSomethingElse();
   * }
   */
  DaxiApp["defined"] = (value) => {
    "use strict";
    return value !== undefined && value !== null;
  };

  /**
   * 返回第一个参数（如果已定义），否则返回第二个参数。用于设置参数的默认值。
   * @param {*} a - 首选值
   * @param {*} b - 默认值
   * @returns {*} 如果 a 已定义则返回 a，否则返回 b
   * @example
   * param = DaxiApp.defaultValue(param, 'default');
   */
  DaxiApp["defaultValue"] = (a, b) => {
    "use strict";
    return a !== undefined && a !== null ? a : b;
  };

  /**
   * 在对象上定义属性。如果 Object.defineProperties 可用则使用它，否则返回原对象不做修改。
   * 此函数用于在设置代码中防止错误完全中断旧版浏览器中的 JavaScript 执行。
   * @private
   * @param {Object} o - 目标对象
   * @param {Object} props - 属性描述符对象
   * @returns {Object} 已定义属性的对象
   */
  DaxiApp["defineProperties"] = ((defined) => {
    "use strict";
    const definePropertyWorks = (() => {
      try {
        return "x" in Object.defineProperty({}, "x", {});
      } catch (e) {
        console.log(e);
        return false;
      }
    })();
    const defineProperties = Object.defineProperties;
    if (!definePropertyWorks || !defined(defineProperties)) {
      defineProperties = (o) => {
        return o;
      };
    }
    return defineProperties;
  })(DaxiApp["defined"]);

  /**
   * 数据下载器类，封装了多种数据请求方法
   * @class DXDownloader
   * @param {Object} [map] - 地图对象（保留参数）
   */
  const DXDownloader = (map) => {
    const proto = DXDownloader.prototype;

    /**
     * 获取数据
     * @param {string} url - 请求 URL
     * @param {string} method - 请求方法（未使用）
     * @param {string} dataType - 数据类型
     * @param {Object} data - 请求数据
     * @param {Function} successFn - 成功回调
     * @param {Function} failedFn - 失败回调
     * @param {Function} [completeFn] - 完成回调
     * @returns {*} 请求结果
     */
    proto.getData = (url, method, dataType, data, successFn, failedFn, completeFn) => {
      return DXUtils.getData(url, data, dataType, successFn, failedFn, completeFn);
    };

    /**
     * 通过安全请求获取服务数据
     * @param {string} url - 请求 URL
     * @param {string} method - 请求方法
     * @param {string} dataType - 数据类型
     * @param {Object} data - 请求数据
     * @param {Function} successFn - 成功回调
     * @param {Function} failedFn - 失败回调
     * @param {Function} [completeFn] - 完成回调
     * @returns {*} 请求结果
     */
    proto.getServiceData = (url, method, dataType, data, successFn, failedFn, completeFn) => {
      return DXUtils.getDataBySecurityRequest(url, method, data, successFn, failedFn, dataType);
    };

    /**
     * 获取包数据（与 getData 功能相同）
     * @param {string} url - 请求 URL
     * @param {string} method - 请求方法（未使用）
     * @param {string} dataType - 数据类型
     * @param {Object} data - 请求数据
     * @param {Function} successFn - 成功回调
     * @param {Function} failedFn - 失败回调
     * @param {Function} [completeFn] - 完成回调
     * @returns {*} 请求结果
     */
    proto.getPackageData = (url, method, dataType, data, successFn, failedFn, completeFn) => {
      return DXUtils.getData(url, data, dataType, successFn, failedFn, completeFn);
    };

    /**
     * 发送安全数据请求
     * @param {string} url - 请求 URL
     * @param {string} method - 请求方法
     * @param {string} dataType - 数据类型
     * @param {Object} data - 请求数据
     * @param {Function} successFn - 成功回调
     * @param {Function} failedFn - 失败回调
     * @param {Function} [completeFn] - 完成回调
     * @returns {*} 请求结果
     */
    proto.requestData = (url, method, dataType, data, successFn, failedFn, completeFn) => {
      return DXUtils.getDataBySecurityRequest(url, method, data, successFn, failedFn, completeFn);
    };
    proto["requestData"] = proto.requestData;
  };
  DaxiApp["DXDownloader"] = DXDownloader;
  DaxiApp["utils"] = DXUtils;

  /**
   * 创建跨域通信桥接器
   * @param {Window} window - 全局 window 对象
   * @returns {Object} 跨域桥接器对象
   * @property {Object} signalHandler - 信号处理器映射
   * @property {Window} targetWindow - 目标窗口
   * @property {string} targetDomain - 目标域
   * @property {Function} init - 初始化方法
   * @property {Function} on - 注册信号处理器
   * @property {Function} off - 移除信号处理器
   * @property {Function} destory - 销毁桥接器
   * @property {Function} call - 发送跨域消息
   * @property {Function} callEx - 发送跨域消息到指定窗口
   * @property {Function} messageHandle - 消息处理函数
   */
  DaxiApp["createCrossDomainBridge"] = (window) => {
    const thisObject = {
      signalHandler: {},
      targetWindow: undefined,
      targetDomain: "",

      /**
       * 初始化跨域桥接器
       * @param {Window} twin - 目标窗口
       * @param {string} tdomain - 目标域
       */
      init: (twin, tdomain) => {
        this.targetWindow = twin;
        this.targetDomain = tdomain;
        window.addEventListener("message", this.messageHandle, false);
      },

      /**
       * 注册信号处理器
       * @param {string} signal - 信号名称
       * @param {Function} func - 处理函数
       */
      on: (signal, func) => {
        this.signalHandler[signal] = func;
      },

      /**
       * 移除信号处理器
       * @param {string} signal - 信号名称
       */
      off: (signal) => {
        if (this.signalHandler[signal]) {
          delete this.signalHandler[signal];
        }
      },

      /**
       * 销毁桥接器，移除消息监听
       */
      destory: () => {
        window.removeEventListener("message", this.messageHandle);
      },

      /**
       * 发送跨域消息到目标窗口
       * @param {string} signal - 信号名称
       * @param {*} data - 消息数据
       * @param {Function} [callbackFn] - 回调函数
       */
      call: (signal, data, callbackFn) => {
        const notice = { signal: signal, data: data };
        if (callbackFn) {
          notice["callback"] = `callback_${new Date().getTime()}${Math.random()}`;
          Cross["on"](notice["callback"], callbackFn);
        }
        const noticeStr = JSON.stringify(notice);
        thisObject.targetWindow["postMessage"](noticeStr, thisObject.targetDomain);
      },

      /**
       * 发送跨域消息到指定窗口
       * @param {Window} win - 目标窗口
       * @param {string} domain - 目标域
       * @param {string} signal - 信号名称
       * @param {*} data - 消息数据
       * @param {Function} [callbackFn] - 回调函数
       */
      callEx: (win, domain, signal, data, callbackFn) => {
        const notice = { signal: signal, data: data };
        if (callbackFn) {
          notice["callback"] = `callback_${new Date().getTime()}${Math.random()}`;
          Cross["on"](notice["callback"], callbackFn);
        }
        const noticeStr = JSON.stringify(notice);
        win["postMessage"](noticeStr, domain);
      },

      /**
       * 处理接收到的跨域消息
       * @param {MessageEvent} e - 消息事件
       */
      messageHandle: (e) => {
        const realEvent = e["originalEvent"] || e,
          data = realEvent["data"],
          swin = realEvent["source"],
          origin = realEvent["origin"];
        let protocol;
        try {
          protocol = typeof data === "string" ? JSON.parse(data) : data;

          if (thisObject.signalHandler[protocol["signal"]]) {
            const result = thisObject.signalHandler[protocol["signal"]]["call"](null, protocol["data"], {
              swin: swin,
              origin: origin,
              callback: protocol["callback"],
            });
            if (result !== undefined) {
              if (protocol["callback"]) {
                thisObject["call"](swin, origin, protocol["callback"], {
                  result: result,
                });
              }
              if (/^callback_/.test(protocol["signal"])) {
                delete thisObject.signalHandler[protocol["signal"]];
              }
            }
          } else {
            const params = protocol["data"]["data"];
            const method = protocol["data"]["method"];
            window[method] && window[method](params);
          }
        } catch (e) {
          console.log(e);
          throw new Error("cross error.");
        }
      },
    };
    return thisObject;
  };

  /**
   * 地图搜索类
   * @constructor
   * @param {Object} options - 配置选项
   * @param {string} options.token - 搜索令牌
   */
  const MapSearch = (options) => {
    const thisObject = this;
    thisObject._token = options ? options.token : "";
    thisObject._downloader = null;
    thisObject.count = 0;
    this.result = 0;
    const proto = MapSearch.prototype;
    thisObject.request = DXUtils.getHttpObject();

    /**
     * 执行地图搜索查询
     * @param {Object} options - 搜索选项
     * @param {string} [options.url] - 搜索服务地址
     * @param {string} [options.token] - 搜索令牌
     * @param {string} [options.bdid] - 建筑物ID
     * @param {string} [options.keyword] - 搜索关键字
     * @param {string} [options.featureIds] - 特征ID列表（逗号分隔）
     * @param {number} [options.lon] - 经度
     * @param {number} [options.lat] - 纬度
     * @param {number} [options.count=200] - 返回结果数量
     * @param {string} [options.floorId] - 楼层ID
     * @param {number} [options.type] - 搜索类型
     * @param {number} [options.circle] - 圆形范围（半径）
     * @param {number} [options.radius] - 搜索半径
     * @param {number} [options.textarraycount] - 文本数组数量
     * @param {Object} [options.geo] - 地理范围参数
     * @param {boolean} [options.floorlimit] - 是否限制楼层
     * @param {string} [options.ac] - 访问控制
     * @param {boolean} [options.hideDis] - 是否隐藏距离信息
     * @param {Function} successFn - 成功回调函数
     * @param {Function} failedFn - 失败回调函数
     */
    proto["query"] = (options, successFn, failedFn) => {
      const searchOptions = {
        token: options["token"] || thisObject._token,
        ct: options["count"] || 200,
        bdid: options["bdid"],
        dataType: options["type"],
      };

      if (options["floorId"]) searchOptions["flid"] = options["floorId"];
      if (options["keyword"]) searchOptions["text"] = options["keyword"];
      if (options["featureIds"]) searchOptions["ids"] = options["featureIds"].split(",");
      if (options["textarraycount"]) searchOptions["textarraycount"] = options["textarraycount"];
      if (options["lon"] && options["lat"]) searchOptions["location"] = `${options["lon"]},${options["lat"]}`;
      if (options["radius"] || options["circle"]) {
        searchOptions["geo"] = { type: "Circle", radius: options["radius"] || options["circle"] };
      }
      if (options["geo"]) searchOptions["geo"] = options["geo"];
      if (options["floorlimit"] !== undefined) searchOptions["floorlimit"] = options["floorlimit"];
      if (options["ac"]) searchOptions["ac"] = options["ac"];

      if (!searchOptions["dataType"]) {
        searchOptions["dataType"] = searchOptions["ids"] ? undefined : searchOptions["bdid"] ? 1 : 11;
      }

      this.count++;

      const url = options["url"] || "https://map1a.daxicn.com/search2/search-query-v6/user/s";
      this._sendQuery(
        url,
        searchOptions,
        true,
        (data) => {
          const result = typeof data === "string" ? (data ? JSON.parse(data) : []) : data;

          if (result && result.length && !options["hideDis"] && searchOptions["location"]) {
            result.forEach((item) => {
              const distance = item["distance"];
              if (!distance) return;

              const distanceValue = typeof distance === "object" ? distance["distance"] : distance;
              if (distanceValue !== undefined) {
                item["distanceDes"] = DXUtils.distanceToText(distanceValue);
              }
            });
          }
          successFn(result);
        },
        failedFn,
        () => {
          failedFn && failedFn({ error: "timeout" });
        },
      );
    };

    /**
     * 发送查询请求
     * @private
     * @param {string} url - 请求地址
     * @param {Object} queryData - 查询数据
     * @param {boolean} isAsync - 是否异步
     * @param {Function} onSuccess - 成功回调
     * @param {Function} onFailed - 失败回调
     * @param {Function} onTimeout - 超时回调
     */
    proto._sendQuery = (url, queryData, isAsync, onSuccess, onFailed, onTimeout) => {
      if (window["downloader"]) {
        window["downloader"]["getServiceData"](url, "post", "json", queryData, onSuccess, onFailed);
        return;
      }

      this.request.abort();
      this.request.responseType = "json";
      this.request.timeout = 150000;
      this.request.ontimeout = () => {
        (onTimeout || onFailed) && (onTimeout ? onTimeout() : onFailed({ ret: "ERROR", code: -1, errMsg: "timeout" }));
      };
      this.request.onreadystatechange = () => {
        if (this.readyState !== 4) return;

        if (this.status !== 0 && this.status !== 200 && this.status !== 304) {
          onFailed && onFailed(this.response);
        } else {
          const result = this.response ? (typeof this.response === "string" ? JSON.parse(this.response) : this.response) : [];
          onSuccess && onSuccess(result);
        }
      };
      this.request.open("POST", url, isAsync);
      this.request.setRequestHeader("Content-Type", "application/json");
      this.request.send(JSON.stringify(queryData));

      if (!isAsync) return this.request.response;
    };

    /**
     * 取消当前搜索请求
     */
    proto.cancel = () => {
      this.request.abort();
    };
    proto["cancel"] = proto.cancel;
  };

  DaxiApp["Search"] = MapSearch;
  DaxiApp["Cross"] = Cross;

  /**
   * 通用工具方法集合
   */
  DaxiApp["common"] = {
    /**
     * 获取用户详细信息
     * @param {Object} userInfo - 用户基本信息
     * @param {string} userInfo.userId - 用户ID
     * @param {Function} successFn - 成功回调函数
     * @param {Function} failedFn - 失败回调函数
     */
    getUserDetailInfo: (userInfo, successFn, failedFn) => {
      const appId = app._params["appId"] || app._config["appId"];
      const secret = app._params["secret"] || "";
      const userId = userInfo["userId"];

      if (!appId || !secret || !userId) return;

      const url = `${app._config["user"]["userServerUrl"]}/get?t=${Date.now()}`;
      DXMapUtils.getData(
        url,
        { appId: appId, userId: userId, secret: secret },
        (result) => {
          if (result.success && result.result) {
            Object.assign(userInfo, result.result, { userName: result.result["nickName"] });
            successFn && successFn(userInfo);
          } else {
            failedFn && failedFn(result);
          }
        },
        (error) => {
          failedFn && failedFn(error);
        },
      );
    },

    /**
     * 获取用户信息
     * @param {Object} params - 请求参数
     * @param {string} params.url - 请求地址
     * @param {string} params.userId - 用户ID
     * @param {Object} [params.data] - 额外数据
     * @param {string} [params.projScene=wechat] - 项目场景
     * @param {Object} [params.downloader] - 下载器实例
     * @param {Function} [params.successFn] - 成功回调
     * @param {Function} [params.failedFn] - 失败回调
     * @param {Function} successFn - 成功回调函数
     * @param {Function} failedFn - 失败回调函数
     */
    getUserInfo: (params, successFn, failedFn) => {
      const userId = (params["data"] && params["data"]["userId"]) || params["userId"];
      if (!userId) return;

      const url = `${params["url"]}?t=${Date.now()}`;
      const downloader = params["downloader"] || new DXDownloader();
      successFn = successFn || params["successFn"];
      failedFn = failedFn || params["failedFn"];

      downloader.getServiceData(
        url,
        "GET",
        "json",
        { openid: userId, client: params["projScene"] || "wechat", t: Date.now() },
        (result) => {
          if (result.code === 0 && result.data) {
            successFn && successFn(result.data);
          } else {
            failedFn && failedFn(result.data || result);
          }
        },
        (error) => {
          failedFn && failedFn(error);
        },
      );
    },

    /**
     * 添加用户信息
     * @param {Object} params - 请求参数
     * @param {Object} params.data - 用户数据
     * @param {string} params.data.userId - 用户ID
     * @param {string} params.data.userName - 用户名
     * @param {string} params.data.avatarUrl - 头像地址
     * @param {string} [params.url] - 请求地址
     * @param {Object} [params.downloader] - 下载器实例
     * @param {Function} [params.successFn] - 成功回调
     * @param {Function} [params.failedFn] - 失败回调
     */
    addUserInfo: (params) => {
      const data = params["data"];
      if (!data["userId"]) return;

      const url = `${params["url"] || `${app._config["user"]["userServerUrl"]}/add`}?t=${Date.now()}`;
      const downloader = params["downloader"] || new DXDownloader();

      downloader.getServiceData(
        url,
        "POST",
        "json",
        { openid: data["userId"], username: data["userName"], avatarUrl: data["avatarUrl"] },
        (result) => {
          if (result.statusCode === 200 && result.data) {
            params["successFn"] && params["successFn"](result.data);
          } else {
            params["failedFn"] && params["failedFn"](result.data || result);
          }
        },
        (error) => {
          params["failedFn"] && params["failedFn"](error);
        },
      );
    },
  };

  /**
   * 坐标系转换工具（WGS84/GCJ02/BD09）
   * @namespace GCJ2WGSUtils
   */
  DaxiApp["GCJ2WGSUtils"] = (() => {
    const PI = 3.1415926535897932384626;
    const SEMI_MAJOR = 6378245.0;
    const ECCENTRICITY_SQ = 0.00669342162296594323;

    /**
     * 纬度转换辅助函数
     * @private
     * @param {number} x - 经度偏移
     * @param {number} y - 纬度偏移
     * @returns {number} 转换后的纬度偏移
     */
    const transformLat = (x, y) => {
      const ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
      ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
      ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
      ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0;
      return ret;
    }

    /**
     * 经度转换辅助函数
     * @private
     * @param {number} x - 经度偏移
     * @param {number} y - 纬度偏移
     * @returns {number} 转换后的经度偏移
     */
    const transformLon = (x, y) => {
      const ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
      ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
      ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
      ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0;
      return ret;
    }

    /**
     * 判断坐标是否在中国境外
     * @private
     * @param {number} lat - 纬度
     * @param {number} lon - 经度
     * @returns {boolean} 是否在境外
     */
    const isOutOfChina = (lat, lon) => {
      return lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271;
    }

    /**
     * 坐标转换核心函数
     * @private
     * @param {number} lat - 纬度
     * @param {number} lon - 经度
     * @returns {Object} 转换后的坐标 {lon, lat, china}
     */
    const transform = (lat, lon) => {
      if (isOutOfChina(lat, lon)) {
        return { lon: lon, lat: lat, china: false };
      }

      const dLat = transformLat(lon - 105.0, lat - 35.0);
      const dLon = transformLon(lon - 105.0, lat - 35.0);
      const radLat = (lat / 180.0) * PI;
      const magic = 1 - ECCENTRICITY_SQ * Math.pow(Math.sin(radLat), 2);
      const sqrtMagic = Math.sqrt(magic);

      dLat = (dLat * 180.0) / (((SEMI_MAJOR * (1 - ECCENTRICITY_SQ)) / (magic * sqrtMagic)) * PI);
      dLon = (dLon * 180.0) / ((SEMI_MAJOR / sqrtMagic) * Math.cos(radLat) * PI);

      return { lon: lon + dLon, lat: lat + dLat, china: true };
    }

    /**
     * WGS84坐标转GCJ02坐标（GPS转高德/腾讯）
     * @param {number} lat - WGS84纬度
     * @param {number} lon - WGS84经度
     * @returns {Object} GCJ02坐标 {lon, lat, china}
     */
    const wgs84_To_Gcj02 = (lat, lon) => {
      return transform(lat, lon);
    }

    /**
     * GCJ02坐标转WGS84坐标（高德/腾讯转GPS）
     * @param {number} lat - GCJ02纬度
     * @param {number} lon - GCJ02经度
     * @returns {Object} WGS84坐标 {lon, lat, china}
     */
    const gcj02_To_Wgs84 = (lat, lon) => {
      const gcj = transform(lat, lon);
      return { lon: lon * 2 - gcj.lon, lat: lat * 2 - gcj.lat, china: gcj["china"] };
    }

    /**
     * BD09坐标转GCJ02坐标（百度转高德/腾讯）
     * @param {number} bdLat - BD09纬度
     * @param {number} bdLon - BD09经度
     * @returns {Object} GCJ02坐标 {lon, lat}
     */
    const bd09ToGcj02 = (bdLat, bdLon) => {
      const X_PI = (PI * 3000.0) / 180.0;
      const x = bdLon - 0.0065;
      const y = bdLat - 0.006;
      const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
      const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
      return { lon: z * Math.cos(theta), lat: z * Math.sin(theta) };
    }

    /**
     * GCJ02坐标转BD09坐标（高德/腾讯转百度）
     * @param {number} gcjLat - GCJ02纬度
     * @param {number} gcjLon - GCJ02经度
     * @returns {Object} BD09坐标 {lon, lat}
     */
    const gcj02ToBd09 = (gcjLat, gcjLon) => {
      const X_PI = (PI * 3000.0) / 180.0;
      const z = Math.sqrt(gcjLon * gcjLon + gcjLat * gcjLat) + 0.00002 * Math.sin(gcjLat * X_PI);
      const theta = Math.atan2(gcjLat, gcjLon) + 0.000003 * Math.cos(gcjLon * X_PI);
      return { lon: z * Math.cos(theta) + 0.0065, lat: z * Math.sin(theta) + 0.006 };
    }

    return {
      wgs84_To_Gcj02: wgs84_To_Gcj02,
      gcj02_To_Wgs84: gcj02_To_Wgs84,
      bd09_To_Gcj02: bd09ToGcj02,
      gcj02_To_Bd09: gcj02ToBd09,
    };
  })();

// Export default
export default DaxiApp;
