/**
 * 大希地图应用主入口模块
 * 负责初始化地图应用、处理命令、管理状态
 */
function createDxApp(factoryOptions = {}) {
  const globalRef = factoryOptions.globalRef || globalThis;
  const window = globalRef;
  const thisObject = {};
  const daxiapp = factoryOptions.daxiapp || window.DaxiApp || {};
  const daximap = factoryOptions.daximap || window.DaxiMap || {};
  const dxUtils = factoryOptions.dxUtils || daxiapp.utils;

  // 数据路径配置
  let dataPath = window.dataPath || "../../../data/";
  if (window.dxDataPath) dataPath = window.dxDataPath;
  window.rootPath = dataPath;
  const web_resPath = `${rootPath}{{token}}/{{bdid}}/{{filename}}`;

  // 不同平台的资源路径配置
  const resPathArray = {
    android: "DXAppDocument://map_data/{{token}}/{{bdid}}/{{filename}}",
    android_web: "https://lxdwyq.chnmuseum.cn/map/data_engine/data_onemap/app_data/{{token}}/{{bdid}}/{{filename}}",
    ios: "./dxappdocument/map_data/{{token}}/{{bdid}}/{{filename}}",
    ios_web: "https://lxdwyq.chnmuseum.cn/map/data_engine/data_onemap/app_data/{{token}}/{{bdid}}/{{filename}}",
    web: "https://lxdwyq.chnmuseum.cn/map/data_engine/data_onemap/app_data/{{token}}/{{bdid}}/{{filename}}",
  };

  thisObject.config = {};

  /** 判断是否为原生App平台 */
  const isNativePlatform = (platform) => ["ios_web", "android_web", "android", "ios"].includes(platform);

  /** 创建下载器实例 */
  const createDownloaderFactory = (options = {}) => {
    const appRef = options.daxiapp || daxiapp;
    const nativeDownloaderCtor = options.nativeDownloaderCtor || DXNativeDownloader;

    return {
      create(platform, jsBridge) {
        if (isNativePlatform(platform)) {
          return new nativeDownloaderCtor(jsBridge);
        }
        return new appRef.DXDownloader();
      },
    };
  };

  const mountLegacyDownloaderCompat = (globalRef, getter) => {
    if (!globalRef || typeof getter !== "function") {
      return;
    }

    try {
      Object.defineProperty(globalRef, "downloader", {
        configurable: true,
        enumerable: false,
        get() {
          return getter();
        },
        set(value) {
          thisObject._legacyDownloaderOverride = value;
        },
      });
    } catch (_error) {
      // ignore compatibility fallback errors
    }
  };

  thisObject.downloaderFactory = factoryOptions.downloaderFactory || createDownloaderFactory(factoryOptions);
  thisObject._legacyDownloaderOverride = null;
  mountLegacyDownloaderCompat(window, function getLegacyDownloader() {
    return thisObject._legacyDownloaderOverride || thisObject.downloader;
  });

  /** 创建命令总线 */
  const createCommandBus = (options = {}) => {
    const handlers = new Set();
    const middlewares = [];
    const logger = options.logger || console;

    const removeHandler = (setRef, target) => {
      if (!setRef.has(target)) {
        return false;
      }
      setRef.delete(target);
      return true;
    };

    return {
      subscribe(handler) {
        if (typeof handler !== "function") {
          return function noop() {
            return false;
          };
        }
        handlers.add(handler);
        return function unsubscribe() {
          return removeHandler(handlers, handler);
        };
      },
      use(middleware) {
        if (typeof middleware !== "function") {
          return function noop() {
            return false;
          };
        }
        middlewares.push(middleware);
        return function removeMiddleware() {
          const index = middlewares.indexOf(middleware);
          if (index < 0) {
            return false;
          }
          middlewares.splice(index, 1);
          return true;
        };
      },
      dispatch(command, context = {}) {
        let index = -1;
        const invoke = (nextCommand) => {
          index += 1;
          if (index < middlewares.length) {
            return middlewares[index](nextCommand, context, invoke);
          }

          let lastResult;
          handlers.forEach((handler) => {
            try {
              lastResult = handler(nextCommand, context);
            } catch (error) {
              logger.error?.("[DxApp command bus] handler error", error);
            }
          });
          return lastResult;
        };
        return invoke(command);
      },
      getSubscriberCount() {
        return handlers.size;
      },
    };
  };

  thisObject.commandBus = factoryOptions.commandBus || createCommandBus({ logger: factoryOptions.logger });
  thisObject.unsubscribeCommandHandler = thisObject.commandBus.subscribe(function defaultCommandHandler(command) {
    return thisObject.pageCommand?.runCommand(command);
  });

  /** 地图创建事件桥（event hook + legacy API） */
  const createMapCreatedBridge = () => {
    const listeners = new Set();

    const removeListener = (target) => {
      if (!listeners.has(target)) {
        return false;
      }
      listeners.delete(target);
      return true;
    };

    const notifyListeners = (app, mapSDK, detail) => {
      listeners.forEach((handler) => {
        try {
          handler(app, mapSDK, detail);
        } catch (error) {
          console.error?.("[DxApp map-created] listener error", error);
        }
      });
    };

    const dispatchDomEvent = (detail) => {
      if (typeof globalRef.dispatchEvent !== "function") {
        return;
      }

      try {
        if (typeof globalRef.CustomEvent === "function") {
          globalRef.dispatchEvent(new globalRef.CustomEvent("daxi:map-created", { detail }));
          return;
        }
      } catch (_error) {
        // ignore and fallback
      }

      if (globalRef.document && typeof globalRef.document.createEvent === "function") {
        const event = globalRef.document.createEvent("CustomEvent");
        event.initCustomEvent("daxi:map-created", false, false, detail);
        globalRef.dispatchEvent(event);
      }
    };

    return {
      on(handler) {
        if (typeof handler !== "function") {
          return function noop() {
            return false;
          };
        }

        listeners.add(handler);
        return function off() {
          return removeListener(handler);
        };
      },
      off(handler) {
        return removeListener(handler);
      },
      emit(app, mapSDK, detail = {}) {
        notifyListeners(app, mapSDK, detail);
        dispatchDomEvent({
          app,
          mapSDK,
          ...detail,
        });

        if (typeof globalRef.OnDXMapCreated === "function") {
          globalRef.OnDXMapCreated(app, mapSDK);
        }
      },
    };
  };

  thisObject.mapCreatedBridge = factoryOptions.mapCreatedBridge || createMapCreatedBridge();

  /** 发送WebSocket消息 */
  const postWebSocketMessage = (type, userId, extra = {}) => {
    const data = { type, id: userId, roleType: "receiver", ...extra };
    window.locWebSocketPostMessage?.(data);
  };

  /**
   * 解析URL查询参数并初始化应用参数
   * @returns {Object} 包含所有初始化参数的对象
   */
  thisObject.parseInitParamByQuery = function () {
    const param = {};
    const command = dxUtils.getCommand();
    window.command = command;

    const { platform, token, resVersion, wbrs, t, configMD5 } = command;
    param.resVersion = resVersion;
    param.wbrs = wbrs;
    const timeTick = t || resVersion || Date.now();

    // 解码所有非空参数
    Object.keys(command).forEach((key) => {
      if (command[key] != "" && command[key] != undefined) {
        param[key] = decodeURIComponent(command[key]);
      }
    });

    // 计算数据根路径
    let dataRootPath = web_resPath;
    if (wbrs == "true") {
      const resPath = resPathArray[platform] || "";
      dataRootPath = resPath.replace("{{projTypeData}}", "proj_data");
    }
    param.resMD5 = configMD5;
    dataRootPath = token ? dataRootPath.replace("{{token}}", token).replace("{{timeTick}}", timeTick) : dataRootPath.replace("{{token}}/", "");
    param.dataRootPath = dataRootPath;
    window.projDataPath = dataRootPath;

    // 设置用户信息
    param.userInfo = param.userId
      ? {
          userId: param.userId,
          userName: param.userName || "",
          avatarUrl: decodeURIComponent(param.avatarUrl || ""),
        }
      : {};

    return param;
  };

  /**
   * 处理来自JSBridge的命令
   * @param {Object} command - 命令对象
   */
  thisObject.processCommand = function (command) {
    return thisObject.commandBus.dispatch(command, { source: "processCommand", app: thisObject });
  };

  thisObject.subscribeCommand = function (handler) {
    return thisObject.commandBus.subscribe(handler);
  };

  thisObject.useCommandMiddleware = function (middleware) {
    return thisObject.commandBus.use(middleware);
  };

  thisObject.onMapCreated = function (handler) {
    return thisObject.mapCreatedBridge.on(handler);
  };

  thisObject.offMapCreated = function (handler) {
    return thisObject.mapCreatedBridge.off(handler);
  };

  const mountLegacyMapCreatedCompat = () => {
    const compat = globalRef.DxAppCompat || {};
    compat.onMapCreated = function onMapCreated(handler) {
      return thisObject.onMapCreated(handler);
    };
    compat.offMapCreated = function offMapCreated(handler) {
      return thisObject.offMapCreated(handler);
    };
    compat.getApp = function getApp() {
      return thisObject;
    };
    globalRef.DxAppCompat = compat;
  };

  mountLegacyMapCreatedCompat();

  /**
   * 初始化应用
   * @param {Object} options - 初始化选项
   */
  thisObject.init = function (options) {
    const initParam = thisObject.parseInitParamByQuery();

    // 设置页面标题
    if (initParam.title) {
      document.title = decodeURIComponent(initParam.title);
    }

    // 兼容buildingId参数
    if (initParam.buildingId) initParam.bdid = initParam.buildingId;

    // 创建JSBridge连接
    daxiapp.createJSBrigde({ platform: initParam.platform, cordovaPath: window.cordovaPath }, function (jsBridge) {
      thisObject._params = initParam;
      thisObject.jsBridge = jsBridge;

      // 判断是否为原生App环境
      if (initParam.platform == "ios_web" || initParam.platform == "android_web") {
        initParam.isNativeApp = true;
      }

      // 创建下载器
      thisObject.downloader = thisObject.downloaderFactory.create(initParam.platform, jsBridge);

      // 加载配置文件
      loadConfigs(initParam, options);
    });
  };

  /** 加载配置文件 */
  function loadConfigs(initParam, options) {
    const { dataRootPath, token, buildingId } = initParam;
    const appConfigUrl = dataRootPath.replace("{{bdid}}", "appConfig").replace("{{filename}}", "app.json");
    const pageConfigUrl = dataRootPath.replace("{{bdid}}", buildingId).replace("{{filename}}", "pages/config.json");
    const requestParams = { token, t: Date.now() };

    thisObject.downloader.getServiceData(appConfigUrl, "GET", "json", requestParams, function (appData) {
      thisObject.downloader.getServiceData(pageConfigUrl, "GET", "json", requestParams, function (pageConfigData) {
        // 合并配置数据
        Object.assign(appData, pageConfigData);
        thisObject._config = appData;
        thisObject._appConfig = pageConfigData.config;

        // 初始化 API 服务层
        daxiapp.api?.init(thisObject);

        // 注册消息监听器
        thisObject.jsBridge.addMessageListener(thisObject.processCommand);

        // 设置路径匹配配置
        if (thisObject._config.roadMatch != undefined) {
          window.roadMatch = thisObject._config.roadMatch;
        }

        // 初始化地图状态管理器
        initMapStateManager(initParam, options);
      });
    });
  }

  /**
   * 初始化地图状态管理器
   * @param {Object} params - 初始化参数
   * @param {Object} pageOptions - 页面配置选项
   */
  function initMapStateManager(params, pageOptions) {
    const container = pageOptions.container;
    thisObject._dom = $(`#${container}`);

    thisObject._mapView = MapView(thisObject, thisObject._dom, {
      callback: function (mapSDK) {
        onMapViewCreated(mapSDK, params, pageOptions);
      },
    });

    // 显示POI列表
    thisObject.showPois = function (args) {
      const params = this.getParams();
      const hasBdid = !!params.bdid;
      args.arealType = hasBdid ? "indoor" : "outdoor";
      if (args.type == undefined) args.type = hasBdid ? 1 : 11;

      // 合并参数
      Object.keys(params).forEach((key) => {
        if (!args[key]) args[key] = params[key];
      });

      if (args.keyword) args.keyword = decodeURIComponent(args.keyword);
      thisObject.pageCommand.openPoiState(args);
    };
  }

  /** 地图视图创建完成回调 */
  function onMapViewCreated(mapSDK, initParam, pageOptions) {
    // 隐藏加载页
    $("#first_page").animate?.({ left: "-100vw" }, 600, "linear");
    thisObject._dom.css({ opacity: 1 });

    // 初始化状态管理器和命令处理器
    thisObject._stateManager = new daxiapp.DXMapStateManager(thisObject, pageOptions.container);
    thisObject.pageCommand = initDaxiCommand(thisObject, pageOptions);
    pageOptions.onCreate?.(thisObject);
    thisObject.mapCreatedBridge.emit(thisObject, mapSDK, {
      source: "dxapi.onMapViewCreated",
    });
    thisObject.mapInitFinished = true;

    // 处理JSBridge命令队列
    processCommandQueue(initParam);

    // 初始化提示组件
    initTipComponent();

    // 注册GPS状态监听
    registerGPSStateListener();

    // 处理首页跳转
    handleIndexPageJump();

    // 发送地图加载完成消息
    sendMapLoadFinishedMessage();

    // 注册调试监听器
    registerDebugListener(mapSDK);
  }

  /** 处理JSBridge命令队列 */
  function processCommandQueue(initParam) {
    if (thisObject.jsBridge) {
      thisObject.jsBridge.getCommandQueue((commandList) => {
        commandList.forEach((cmd) => {
          if (!cmd.commandList) thisObject.processCommand(cmd);
        });
      });
      thisObject.jsBridge.mapInitFinished();
    } else {
      thisObject.processCommand(initParam);
    }
  }

  /** 初始化提示组件 */
  function initTipComponent() {
    thisObject._tipComponent = new daxiapp.DXShowTipsComponent();
    thisObject._tipComponent.init(thisObject._dom, { visible: false });
  }

  /** 注册GPS状态监听 */
  function registerGPSStateListener() {
    thisObject._mapView._locationManager.registGPSStateListener((bleData) => {
      if (!bleData.state) {
        daxiapp.dom.showTips("请开启定位开关", "如何开启", () => {
          thisObject._tipComponent.show({
            title: "<i class='icon_gb-lanya blue'></i>如何开启定位开关",
            content: "上/下滑找到<span class='red'>定位图标</span>打开或<span class='red'>在设置</span>中打开",
            img: "./images/GPS.png",
          });
        });
      } else {
        daxiapp.dom.hideTops();
      }
    });
  }

  /** 处理首页跳转 */
  function handleIndexPageJump() {
    if (thisObject._params.method != "indexPage") return;

    const params = thisObject.getParams();
    const command = { data: params, method: "openIndexPage" };
    if (thisObject.buildingInfo) {
      command.data.cnname = thisObject.buildingInfo.cn_name;
    }
    const page = thisObject._stateManager.pushState("IndexPage", command);
    page._once("selectPoiCallback", (sender, selectPoiResult) => {
      if (selectPoiResult.retVal == "OK") {
        thisObject.showPois(selectPoiResult.data);
      }
    });
  }

  /** 发送地图加载完成消息 */
  function sendMapLoadFinishedMessage() {
    const userId = thisObject._params.userId;
    postWebSocketMessage("mapLoadFinished", userId);
    postWebSocketMessage("postEventToMiniProgram", userId, { methodToMiniProgram: "mapLoadFinished=true" });
  }

  /** 注册调试监听器 */
  function registerDebugListener(mapSDK) {
    const locationManager = thisObject._mapView._locationManager;
    if (!locationManager.registDebugListener) return;

    // 调试绘制状态
    let circleLayers = null;
    let circleFeatures = [];
    let linePointsLayer = null;
    let linePointsFeatures = [];
    let polyline = null;
    let sls = [];

    /** 创建圆形特征点 */
    const createCircleFeature = (lon, lat, id, color = "#3c88ee") => ({
      type: "Feature",
      id: `circle${id}`,
      geometry: { type: "Point", coordinates: [lon, lat] },
      geometry_name: "the_geom",
      properties: {
        FT_ID: `circle${id}`,
        FL_ID: "",
        "circle-color": color,
        "circle-radius": 4,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
        "circle-opacity": 1,
      },
    });

    /** 更新圆形图层 */
    const updateCircle = () => {
      const buildingID = mapSDK.getCurrentBDID();
      const floorId = mapSDK.getCurrentFloorId();
      circleLayers?.removeFromMap();
      circleLayers = mapSDK.createCircle({
        bdid: buildingID,
        floorId,
        features: circleFeatures,
        "circle-opacity": 0.5,
      });
    };

    /** 更新线路点图层 */
    const updateLinePoints = () => {
      const buildingID = mapSDK.getCurrentBDID();
      const floorId = mapSDK.getCurrentFloorId();
      linePointsLayer?.removeFromMap();
      linePointsLayer = mapSDK.createCircle({
        bdid: buildingID,
        floorId,
        features: linePointsFeatures,
        "circle-opacity": 0.5,
      });
    };

    /** 绘制路径线 */
    const drawLine = (pos) => {
      const buildingID = mapSDK.getCurrentBDID();
      const floorId = mapSDK.getCurrentFloorId();
      polyline?.removeFromMap();
      polyline = mapSDK.createPolyline2({
        bdid: buildingID,
        floorId,
        lineColor: "#a2c492",
        lineWidth: 2,
        wrapperColor: "#ffffff",
        wrapperWidth: 4,
        linePoints: pos,
      });
    };

    const showLocMsg = window.location.search.includes("showLocMsg=true");
    const showHistoryPoint = thisObject._config.showHistoryPoint === true || window.location.search.includes("showHistoryPoint=true");

    locationManager.registDebugListener((e) => {
      if (showLocMsg) {
        if (e.type == "fp") {
          // 绘制指纹点
          circleFeatures = e.data.map((item, i) => createCircleFeature(item.lon, item.lat, i, i === 0 ? "#ff0000" : "#3c88ee"));
          updateCircle();

          // 绘制路径线
          linePointsFeatures = sls.map((item, i) => createCircleFeature(item.lon, item.lat, i, "#65da79"));
          updateLinePoints();
          const arr = sls.map((item) => [item.lon, item.lat]);
          if (arr.length > 0) drawLine(arr);
        } else if (e.type == "sls") {
          sls = e.data;
        } else if (e.type == "minProgLocRes") {
          // 显示小程序定位结果
          if (!thisObject.minPlocMarker) {
            thisObject.minPlocMarker = new daximap.DXMarker(thisObject._mapView._mapSDK);
            thisObject.minPlocMarker.init({
              imgUrl: "../../../map_sdk/map/assets/images/location.png",
              width: 36,
              height: 36,
              heading: e.data.heading,
              lon: e.data.longitude,
              lat: e.data.latitude,
            });
          }
          thisObject.minPlocMarker.setPosition(e.data.longitude, e.data.latitude, e.data.heading, e.data.floorId, e.data.bdid);
          thisObject.minPlocMarker.setVisible(true);
        }
      }

      if (showHistoryPoint && e.type == "fp") {
        circleFeatures = e.data.map((item, i) => createCircleFeature(item.lon, item.lat, i, i === 0 ? "#ff0000" : "#3c88ee"));
        updateCircle();
      }
    });
  }

  /** 获取应用初始化参数 */
  thisObject.getParams = function () {
    return thisObject._params;
  };

  return thisObject;
}

const DxApp = createDxApp();

window.DxApp = DxApp;
