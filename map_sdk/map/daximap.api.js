const earthRadius = 6378137.0;
const DEGREE_TO_RADIAN = 0.0174532925199433;
const SECOND_TO_RADIAN = DEGREE_TO_RADIAN / 3600;
const RADIAN_TO_DEGREE = 180 / Math.PI;

const scriptPath = document.currentScript.src;
window.daxiMapSDKProjPath = scriptPath.slice(0, scriptPath.lastIndexOf("/") + 1);
window.langData = {};

  const daximap = (window.DaxiMap = window.DaxiMap || {});

  function getScriptPath() {
    const scripts = document.getElementsByTagName("script");
    const scriptSrc = scripts[scripts.length - 1].src;
    const jsName = scriptSrc.split("/").pop();
    return scriptSrc.replace(jsName, "");
  }

  daximap.scriptURL = getScriptPath();
  daximap.version = "2.5.0";

  const { DXMapUtils, DXPathUtils, DXOutdoorMap, EventHandlerManager } = daximap;

  const DXUserTrackingModeUnknown = -1;
  const DXUserTrackingModeNone = 0;
  const DXUserTrackingModeFollow = 1;
  const DXUserTrackingModeFollowWithHeading = 2;

  const DXConfig = function () {};

  const isServicUrl = (url) => url.indexOf("?") > 0;

  /**
   * 解析数据路径
   * @param {Object} options 配置项
   * @returns {string} 完整的配置文件路径
   */
  function parseDataPath(options) {
    let dataPathUrl = options.dataPath || options.mapDataPath || `/data/${options.token}/appConfig/`;
    if (isServicUrl(dataPathUrl)) {
      return dataPathUrl;
    }

    const buildingId = options.buildingId || options.bdid;
    const { token, version } = options;

    // 处理 token：确保路径中包含 token 或替换占位符
    if (token && dataPathUrl.indexOf(token) == -1) {
      dataPathUrl = dataPathUrl.endsWith("/") ? `${dataPathUrl}${token}` : `${dataPathUrl}/${token}`;
    } else if (dataPathUrl.indexOf("{{token}}") != -1) {
      dataPathUrl = dataPathUrl.replace("{{token}}", token);
    } else if (token && dataPathUrl.indexOf(token) == -1) {
      dataPathUrl = DXMapUtils.joinPath(dataPathUrl, token);
    }

    // 处理 bdid：支持占位符替换或拼接默认 appConfig 子路径
    dataPathUrl = dataPathUrl.indexOf("{{bdid}}") != -1 ? dataPathUrl.replace("{{bdid}}", "appConfig") : DXMapUtils.joinPath(dataPathUrl, "appConfig");

    // 处理文件名：根据版本选择默认文件名
    const filename = version == "v2" ? "bdlist.json" : "map.json";
    dataPathUrl = dataPathUrl.indexOf("{{filename}}") != -1 ? dataPathUrl.replace("{{filename}}", filename) : DXMapUtils.joinPath(dataPathUrl, filename);

    if (dataPathUrl.indexOf("?") == -1) {
      dataPathUrl += `?t=${window.version || Date.now()}`;
    }

    // 特殊场景处理：如果指定了 scenic 模式，则将 appConfig 替换为具体的 buildingId
    if (buildingId && (options.scenic == "2" || (window.command && (command.scenic == "0" || command.scenic == "2")))) {
      dataPathUrl = dataPathUrl.replace("/appConfig/", `/${buildingId}/`);
    }
    return dataPathUrl;
  }

  const DXMap3D = function (containerId, options) {
    this._eventMgr = new EventHandlerManager();
    this._coreMap = null;
    const proto = DXMap3D.prototype;
    /**
     * 初始化地图加载
     * @private
     */
    proto._initMap = function () {
      this._downloader = options.downloader || new daximap.DXDownloader();

      // 处理token
      if (!options.token) {
        if (!daximap.token) {
          console.error("Please assign DaxiMap.token");
          return;
        }
        options.token = daximap.token;
      }

      // 处理version
      options.version = options.version || "v3";

      // 处理dataPathUrl
      const normalizedUrl = DXPathUtils.normalizeDataPath(options);
      const baseUrl = DXPathUtils.assignUrlParams(normalizedUrl, { token: options.token });
      options.dataPath = baseUrl;
      const appConfigUrl = DXPathUtils.getMapDataUrl(baseUrl, options);

      this._downloader.getServiceData(
        appConfigUrl,
        "get",
        "json",
        {},
        (data) => {
          this.mapConfigData = data;
          this.container = document.getElementById(containerId);
          this.container?.classList.add("dxmap-container");

          const mapContainer = document.createElement("div");
          const mapId = `${containerId}_map`;
          mapContainer.setAttribute("id", mapId);
          Object.assign(mapContainer.style, {
            width: "100%",
            height: "100%",
            position: "relative",
          });
          this.container?.appendChild(mapContainer);
          parseInitOptions(this, mapId, options, data);

          // 封装的mapbox 实例
          this._coreMap = new DXOutdoorMap(this, this.config);
          this._coreMap.init(
            (data) => {
              this.userEventManager = initEventManager(this.container?.getElementsByClassName("mapboxgl-canvas")[0], this._coreMap);
              this._coreMap.setOnIndoorBuildingActive((building) => {
                this._fire("onIndoorBuildingActive", building);
              });

              this._coreMap.setOnIndoorBuildingLoaded((building) => {
                if (this.config.explodedView) {
                  this._setExplodedView(true, this.config.explodedViewData);
                }
                const token = options.token || "";
                const postLogUrl = this.config.postLogUrl;
                if (postLogUrl) {
                  const logData = [
                    {
                      token,
                      bdid: building.bdid,
                      createtime: Date.now(),
                      description: "地图加载",
                      dr: 2,
                      id: 0,
                      isflag: 1,
                      parametersMap: JSON.stringify({ token, bdid: building.bdid }),
                      type: "1",
                    },
                  ];
                  this._downloader.getServiceData(
                    postLogUrl,
                    "POST",
                    "text",
                    logData,
                    (res) => console.log(res),
                    (err) => console.log(err),
                  );
                }
                this._fire("onIndoorBuildingLoaded", building);
              });

              data.list?.forEach((item) => {
                if (!item.center) {
                  const location = item.data?.location || item.location;
                  item.center = location.split(",").map((str) => parseFloat(str));
                  item.center[2] = item.center[2] || 1000;
                }
              });
              this._fire("loadComplete", data);
            },
            () => this._fire("mapInited"),
          );
        },
        () => alert("没有读到相关数据"),
        true,
      );
    };

    function parseInitOptions(map, containerId, options, data) {
      const mapData = data.map || data;
      const navi = data.navi || {};
      const startPos = mapData.startPosition || {};

      const config = new DXConfig();
      config.containerId = containerId;
      config.appName = options.appName;
      config.projectPath = options.projectPath;
      config.token = options.token;
      config.bdid = options.buildingId || options.bdid;
      config.startPosition = mapData.startPosition;
      config.baseMapPath = window.daxiMapSDKProjPath;
      config.assetsPath = `${config.baseMapPath}assets/`;

      const dataPath = options.dataPath || options.mapDataPath || "../../data/map_data/";
      config.floorInterval = options.floorInterval || mapData.floorInterval || 150;
      config.baseMapDataPath = dataPath;
      config.mapStyle = options.mapStyle || mapData.mapStyle;
      config.explodedView = options.explodedView || mapData.explodedView || false;
      config.explodedViewData = options.explodedViewData;
      config.spriteUrl = options.spriteUrl || mapData.spriteUrl;
      config.heading = options.heading || options.defaultHeading || startPos.heading || 0;
      config.tilt = options.pitch || options.tilt || options.defaultTilt || startPos.tilt || 20;
      config.zoom = options.zoom || options.defaultZoomLevel || startPos.zoom || 15;
      config.zoomRange = options.zoomRange || options.zoomLevelRange || mapData.zoomRange || [0, 24];
      config.viewMode = options.viewMode || "2D";
      config.lang = options.lang || "";

      config.minZoom = options.minZoom || options.minLevel || mapData.minZoom || config.zoomRange[0];
      config.maxZoom = options.maxZoom || options.maxLevel || mapData.maxZoom || config.zoomRange[1];

      const lon = options.lon || startPos.lon;
      const lat = options.lat || startPos.lat;

      if (options.center) {
        config.center = options.center;
      } else if (options.defaultCenter) {
        config.center = options.defaultCenter;
      } else if (lon && lat) {
        config.center = { lon, lat };
      } else {
        config.center = { lon: 116.4, lat: 39.91 };
      }

      config.indoorNaviZoom = options.indoorNaviZoom || navi.naviZoomLevel || 19;
      config.outdoorNaviZoom = options.outdoorNaviZoom || navi.outdoorNaviZoom || 18;
      config.maxCameraTilt = options.maxPitch || options.maxTilt || mapData.maxTilt;
      config.postLogUrl = options.postLogUrl;

      if (config.maxCameraTilt === undefined) {
        config.maxCameraTilt = 60;
      }
      config.maxTilt = config.maxCameraTilt;
      config.minCameraTilt = options.minPitch || options.minTilt || mapData.minTilt || 0;
      config.minTilt = config.minCameraTilt;

      if (options.outdoorTiles) {
        config.outdoorTiles = options.outdoorTiles;
      }

      config.isDebugEngine = options.debugEngine || false;
      if (options.showOutDoorMap !== undefined) {
        config.showOutDoorMap = !(options.showOutDoorMap === "false" || options.showOutDoorMap === false || options.showOutDoorMap === 0);
      } else {
        config.showOutDoorMap = mapData.showOutDoorMap !== undefined ? mapData.showOutDoorMap : true;
      }

      config.maxBounds = options.maxBounds || mapData.maxBounds;
      config.showOutDoorMap = !config.explodedView && config.showOutDoorMap;
      config.indoorMapUrl = config.isDebugEngine ? "sdk/engine.api.debug.js" : "sdk/engine.api.js";

      if (options.viewMode) {
        if (options.viewMode == "3d") {
          config.defaultTilt = config.maxCameraTilt;
        } else if (options.viewMode == "2d") {
          config.defaultTilt = 0;
        }
      }

      let currentDataPath = dataPath;
      if (!currentDataPath.startsWith("http") && !currentDataPath.startsWith("/")) {
        let baseHref = location.href;
        if (baseHref.endsWith(".html")) {
          baseHref = baseHref.slice(0, baseHref.lastIndexOf("/") + 1);
        }
        while (currentDataPath.startsWith("../")) {
          currentDataPath = currentDataPath.slice(3);
          const index = baseHref.lastIndexOf("/", baseHref.length - 2);
          baseHref = baseHref.slice(0, index + 1);
        }
        currentDataPath = baseHref + currentDataPath.replace("./", "");
      }

      config.mapBgColorRGB = options.mapBgColorRGB || mapData.mapBgColorRGB || [245, 245, 245, 1];
      config.device_clear_color = DXMapUtils.rgbToFloatRGBA(config.mapBgColorRGB);
      config.srcVersion = mapData.srcVersion;
      config.mapState = {};
      config.extenal = options.extenal || mapData.extenal;
      if (data.map) {
        config.bdlist = mapData.bdlist;
        config.location = mapData.location;
        config.scene = mapData.scene;
      } else {
        config.bdlist = { data: { list: data.filelist } };
      }

      map.config = config;
    }

    //爆炸图手势操作事件处理
    function initEventManager(dom, map) {
      const that = {};
      let startPoint = null;
      let lastPoint = null;
      let isMove = false;
      let isRotate = false;

      const mouseDown = (e) => {
        if (e.target != dom) return;
        let event = null;

        if (e.type == "touchstart") {
          if (e.touches.length == 1) {
            event = e.touches[0];
            startPoint = { x: event.pageX, y: event.pageY };
          } else {
            return;
          }
        } else if (e.type == "mousedown" && e.button == 0) {
          event = e;
          startPoint = { x: event.pageX, y: event.pageY };
        }

        if (startPoint) {
          lastPoint = startPoint;
          that.mouseDownCall?.({ type: "mouseDown", data: startPoint });
        }
      };

      const mouseMove = (e) => {
        if (!startPoint) return;
        let event = null;
        if (e.type == "touchmove") {
          if (e.touches.length == 1) {
            event = e.touches[0];
          } else {
            return;
          }
        } else if (e.type == "mousemove") {
          event = e;
        }

        const currentPoint = { x: ~~event.pageX, y: ~~event.pageY };
        that.mouseMoveCall?.({ type: "mouseDown", diff: { x: currentPoint.x - lastPoint.x, y: currentPoint.y - lastPoint.y } });

        const offsetX = lastPoint.x - currentPoint.x;
        lastPoint = currentPoint;
        const diffY = Math.abs(startPoint.y - currentPoint.y);

        if (diffY >= 3) {
          isMove = true;
        } else {
          const diffX = Math.abs(startPoint.x - currentPoint.x);
          if (diffX >= 5) {
            isRotate = true;
          }
        }

        if (isRotate) {
          map.setBearing(map.getBearing() - (3.0 * offsetX) / 3.0);
        }

        const pixelsPerMeter = map._indoorMapApi.engineApi.getPixelsPerMeter();
        map.setCurrentOffset?.((startPoint.y - currentPoint.y) / pixelsPerMeter);
      };

      const mouseUp = (e) => {
        if (startPoint && isMove) {
          let event = null;
          if (e.type == "touchend") {
            if (e.changedTouches.length == 1) {
              event = e.changedTouches[0];
            } else {
              return;
            }
          } else if (e.type == "mouseup") {
            event = e;
          }
          const currentPoint = { x: ~~event.pageX, y: ~~event.pageY };
          const pixelsPerMeter = map._indoorMapApi.engineApi.getPixelsPerMeter();
          const offsetY = (currentPoint.y - startPoint.y) / pixelsPerMeter;

          const floorInterval = map._mapSDK.config.floorInterval;
          const offset = offsetY / floorInterval;
          let floorOffset = parseInt(offset);

          if (offset < 0) {
            if (floorOffset - offset > 0.618) floorOffset -= 1;
          } else if (offset > 0) {
            if (offset - floorOffset > 0.618) floorOffset += 1;
          }

          if (floorOffset < 0) {
            map.toLowerFloor(floorOffset);
          } else if (floorOffset > 0) {
            map.toUpperFloor(floorOffset);
          } else {
            map.resumeFloor(map._mapSDK.config.explodedView);
          }
        }

        if (startPoint && !isMove) {
          const expoldClickedEvent = new CustomEvent("expoldClick", { detail: { pageX: e.pageX, pageY: e.pageY } });
          e.target.dispatchEvent(expoldClickedEvent);
        }

        startPoint = null;
        lastPoint = null;
        isMove = false;
        isRotate = false;
      };

      const mapClick = (e) => {
        if (e.target != dom) return;
        const { detail } = e;
        const { pageX: x, pageY: y } = detail;
        const pixelRatio = 1 / window.devicePixelRatio;
        const width = dom.width * pixelRatio;
        const height = dom.height * pixelRatio;
        if (y > height * 0.3 && y < height * 0.8 && x > width * 0.04 && x < width * 0.96) {
          map._mapSDK._setExplodedView(false);
        }
      };

      const listeners = [
        { name: "touchstart", target: dom, fn: mouseDown, group: "mouseDown" },
        { name: "mousedown", target: dom, fn: mouseDown, group: "mouseDown" },
        { name: "touchend", target: document, fn: mouseUp, group: "mouseUp" },
        { name: "mouseup", target: document, fn: mouseUp, group: "mouseUp" },
        { name: "touchmove", target: document, fn: mouseMove, group: "mouseMove" },
        { name: "mousemove", target: document, fn: mouseMove, group: "mouseMove" },
        { name: "expoldClick", target: dom, fn: mapClick, group: "click" },
      ];

      const toggleListeners = (group, add) => {
        listeners
          .filter((l) => l.group === group)
          .forEach((l) => {
            l.target[add ? "addEventListener" : "removeEventListener"](l.name, l.fn);
          });
      };

      that.addListenClick = () => toggleListeners("click", true);
      that.removeListenClick = () => toggleListeners("click", false);
      that.addListenMouseDown = () => toggleListeners("mouseDown", true);
      that.removeListenMouseDown = () => toggleListeners("mouseDown", false);
      that.addListenMouseUp = () => toggleListeners("mouseUp", true);
      that.removeListenMouseUp = () => toggleListeners("mouseUp", false);
      that.addListenMouseMove = () => toggleListeners("mouseMove", true);
      that.removeListenMouseMove = () => toggleListeners("mouseMove", false);

      that.pitchEvent = ((dom) => {
        let evCache = [];
        let prevDiff = -1;

        const pointerdown_handler = (ev) => evCache.push(ev);
        const pointermove_handler = (ev) => {
          for (let i = 0; i < evCache.length; i++) {
            if (ev.pointerId == evCache[i].pointerId) {
              evCache[i] = ev;
              break;
            }
          }

          if (evCache.length == 2) {
            const curDiff = Math.sqrt(Math.pow(evCache[1].clientX - evCache[0].clientX, 2) + Math.pow(evCache[1].clientY - evCache[0].clientY, 2));
            if (prevDiff > 0) {
              if (curDiff > prevDiff) console.log("Pinch moving OUT -> Zoom in", ev);
              if (curDiff < prevDiff) console.log("Pinch moving IN -> Zoom out", ev);
            }
            prevDiff = curDiff;
          }
        };

        const remove_event = (ev) => {
          for (let i = 0; i < evCache.length; i++) {
            if (evCache[i].pointerId == ev.pointerId) {
              evCache.splice(i, 1);
              break;
            }
          }
        };

        const pointerup_handler = (ev) => {
          remove_event(ev);
          if (evCache.length < 2) prevDiff = -1;
        };

        return {
          addEvent: () => {
            dom.onpointerdown = pointerdown_handler;
            dom.onpointermove = pointermove_handler;
            dom.onpointerup = pointerup_handler;
            dom.onpointercancel = pointerup_handler;
            dom.onpointerout = pointerup_handler;
            dom.onpointerleave = pointerup_handler;
          },
          removeEvent: () => {
            dom.onpointerdown = null;
            dom.onpointermove = null;
            dom.onpointerup = null;
            dom.onpointercancel = null;
            dom.onpointerout = null;
            dom.onpointerleave = null;
          },
        };
      })(dom);

      that.addMouseAndGestureListener = function (mouseDownCall, mouseMoveCall, mouseUpCall) {
        that.mouseDownCall = mouseDownCall;
        that.mouseMoveCall = mouseMoveCall;
        that.mouseUpCall = mouseUpCall;
        that.addListenMouseDown();
        that.addListenMouseUp();
        that.addListenMouseMove();
        that.addListenClick();
      };
      that.removeMouseAndGestureListener = function () {
        that.removeListenMouseDown();
        that.removeListenMouseUp();
        that.removeListenMouseMove();
        that.removeListenClick();
      };
      return that;
    }

    /////////////////////////////////////////////////////////////////////
    // Map Event
    /////////////////////////////////////////////////////////////////////
    /** 事件绑定 */
    proto._on = function (type, fn, context) {
      this._eventMgr.on(type, fn, context);
    };

    /** 单次事件绑定 */
    proto._once = function (type, fn, context) {
      this._eventMgr.once(type, fn, context);
    };

    /** 取消事件绑定 */
    proto._off = function (type, fn, context) {
      this._eventMgr.off(type, fn);
    };

    /** 触发事件 */
    proto._fire = function (type, data, extentParams) {
      this._eventMgr.fire(type, data, extentParams);
    };

    /** 绑定底层地图事件 */
    proto._onMapEvents = function (type, fn, context) {
      this._coreMap._mapboxMap.on(type, fn);
    };

    /** 内部使用的楼层切换通用逻辑 */
    proto._handleFloorChange = function (options) {
      if (options.bdid && options.floorId) {
        this._coreMap.changeFloor(options.bdid, options.floorId);
      }
    };

    /////////////////////////////////////////////////////////////////////
    // Map Size
    /////////////////////////////////////////////////////////////////////
    proto._resize = function (params) {
      this._coreMap.resize(params);
    };

    proto._checkCanvasSize = function () {};

    proto._resetCanvasSize = function (width, height) {};

    proto._resizeMap = function () {};

    /////////////////////////////////////////////////////////////////////
    // Camera
    /////////////////////////////////////////////////////////////////////
    // 设置地图视图的边框范围
    proto._setPadding = function (padding) {
      this._coreMap.setPadding(padding);
    };
    proto["getPadding"] = function () {
      return this._coreMap.getPadding();
    };
    proto._setViewMode = function (viewMode) {
      let tilt = 0;
      if (viewMode == "2d") {
        tilt = 10;
      }
      if (viewMode == "3d") {
        tilt = this.config.maxCameraTilt;
      }
      this._setTilt(tilt);
    };

    proto._zoomIn = function (delta) {
      this._coreMap.zoomIn(delta);
    };

    proto._zoomOut = function (delta) {
      this._coreMap.zoomOut(delta);
    };

    proto._getZoomLevel = function () {
      return this._coreMap.getZoom();
    };

    proto._setZoomLevel = function (level) {
      return this._coreMap.setZoom(level);
    };

    proto._getZoomLevelRange = function () {
      return [this._coreMap.getMinZoom(), this._coreMap.getMaxZoom()];
    };

    proto._setZoomLevelRange = function (minLevel, maxLevel) {
      this._coreMap.setMinZoom(minLevel);
      this._coreMap.setMaxZoom(maxLevel);
    };

    /** 获取角度 */
    proto._getHeading = function () {
      return this._coreMap.getBearing();
    };

    /** 设置角度 */
    proto._setHeading = function (heading) {
      this._coreMap.setBearing(heading);
    };

    /** 获取倾角 */
    proto._getTilt = function () {
      return this._coreMap.getPitch();
    };

    /** 设置倾角 */
    proto._setTilt = function (tilt) {
      return this._coreMap.setPitch(tilt);
    };

    proto._setView = function (center, zoom) {
      Cross.call("setView", { lng: center.lng, lat: center.lat, zoom });
    };

    proto._gotoViewData = function () {};
    proto._changeFloor = function (bdid, floorId) {
      this._coreMap.changeFloor(bdid, floorId, this.config.explodedView);
    };

    proto._toUpperFloor = function (floorOffset) {
      this._coreMap.toUpperFloor(floorOffset);
    };

    proto._toLowerFloor = function (floorOffset) {
      this._coreMap.toLowerFloor(floorOffset);
    };
    proto._addControl = function (params, positon) {
      return this._coreMap.addControl(params, positon);
    };
    proto._mapboxMap = function () {
      return this._coreMap._mapboxMap;
    };

    proto._normalMapParams = {};
    proto._setExplodedView = function (val, exploadViewParams) {
      this.config.explodedView = val;
      this._showOutDoorMap(this.config.showOutDoorMap && !val);

      const coreMap = this._coreMap;
      const mapboxIns = coreMap._mapboxMap;
      DXPoiLayerVisitor(coreMap._scene, val).visit(!val, this);

      if (val) {
        this._normalMapParams.heading = this._getHeading();
        this._normalMapParams.zoom = this._getZoomLevel();
        this._normalMapParams.tilt = this._getTilt();
        this._normalMapParams.floorId = this._getCurrentFloorId();
        const pos = this._getPosition();
        this._normalMapParams.lon = pos.lon;
        this._normalMapParams.lat = pos.lat;

        mapboxIns.dragPan.disable();
        mapboxIns.scrollZoom.disable();
        mapboxIns.doubleClickZoom.disable();
        mapboxIns.touchPitch.disable();
        mapboxIns.touchZoomRotate.enable({ around: "center" });

        const options = exploadViewParams ||
          this._normalMapParams || {
            lon: 116.40121145329937,
            lat: 39.904782149326394,
            heading: 45,
            tilt: 65,
            zoom: 16.105842994545533,
          };

        const interval = options.floorInterval || 150;
        coreMap._setFloorInterval(interval);
        this.config.floorInterval = interval;
        coreMap.updateFloors(this.config.explodedView);
        this._fire("explodedViewChanged", val);

        if (options.minZoom) {
          coreMap.setMinZoom(options.minZoom);
        }

        if (options.lon && options.lat) {
          this._easeTo(options);
        } else {
          if (options.tilt) coreMap.setPitch(options.tilt);
          if (options.zoom) coreMap.setZoom(options.zoom);
        }
        this._forceRedraw();
      } else {
        mapboxIns.dragPan.enable();
        mapboxIns.scrollZoom.enable();
        mapboxIns.doubleClickZoom.enable();
        mapboxIns.touchPitch.enable();
        mapboxIns.touchZoomRotate.enable();

        coreMap._setFloorInterval(0);
        coreMap.updateFloors(this.config.explodedView);
        this._fire("explodedViewChanged", val);

        if (this._normalMapParams.zoom) {
          if (this._normalMapParams.floorId != this._getCurrentFloorId()) {
            this._normalMapParams.floorId = this._getCurrentFloorId();
            const pos = this._getPosition();
            this._normalMapParams.lon = pos.lon;
            this._normalMapParams.lat = pos.lat;
            if (this._normalMapParams.zoom < 17) this._normalMapParams.zoom = 17;
          }
          this._easeTo(this._normalMapParams);
        }
        coreMap.setMinZoom(this.config.minZoom);
      }
      val ? this.userEventManager.addMouseAndGestureListener() : this.userEventManager.removeMouseAndGestureListener();
    };

    proto._setCurrentOffset = function (offset) {
      this._coreMap.setCurrentOffset?.(offset);
    };

    proto._getExplodedView = function () {
      return this.config.explodedView;
    };

    /** 缩放至指定范围 */
    proto._fitBounds = function (options) {
      if (!daximap.defined(options.bounds)) return;

      const fitOptions = {};
      if (!daximap.defined(options.heading)) {
        fitOptions.bearing = this._coreMap.getBearing();
        delete options.heading;
      }

      for (const key in options) {
        if (daximap.defined(options[key])) {
          fitOptions[key] = options[key];
        }
      }

      this._coreMap.fitBounds(options.bounds, fitOptions);
      this._handleFloorChange(options);
    };

    proto._getBounds = function () {
      return this._coreMap.getBounds();
    };

    proto.getBoundByPoints = function (points) {
      if (points && points instanceof Array) {
        const bounds = new mapboxgl.LngLatBounds(points[0], points[0]);
        for (let i = 1; i < points.length; i++) {
          bounds.extend(points[i]);
        }
        return [
          [bounds._sw.lng, bounds._sw.lat],
          [bounds._ne.lng, bounds._ne.lat],
        ];
      }
    };

    // 移动到设定的位置 角度 高度
    /** 飞向设定位置 */
    proto._moveTo = function (options) {
      const moveOptions = {
        center: [options.lon, options.lat],
        essential: true,
      };
      if (daximap.defined(options.heading)) moveOptions.bearing = options.heading;
      if (daximap.defined(options.tilt)) moveOptions.pitch = options.tilt;
      if (daximap.defined(options.zoomLevel)) moveOptions.zoom = options.zoomLevel;

      this._coreMap.flyTo(moveOptions);
      this._handleFloorChange(options);
    };

    // 移动到设定的位置 角度 高度
    /** 平滑移动到设定位置 */
    proto._easeTo = function (options) {
      const moveOptions = {
        center: [options.lon, options.lat],
        essential: true,
      };
      if (daximap.defined(options.heading)) moveOptions.bearing = options.heading;
      if (daximap.defined(options.tilt)) moveOptions.pitch = options.tilt;
      if (daximap.defined(options.zoom)) moveOptions.zoom = options.zoom;
      if (daximap.defined(options.duration)) moveOptions.duration = options.duration;

      this._coreMap.easeTo(moveOptions);
      this._handleFloorChange(options);
    };

    /** 跳转到设定位置 */
    proto._jumpTo = function (options) {
      const moveOptions = {
        center: { lng: options.lon, lat: options.lat },
      };
      if (daximap.defined(options.heading)) moveOptions.bearing = options.heading;
      if (daximap.defined(options.tilt)) moveOptions.pitch = options.tilt;
      if (daximap.defined(options.zoom)) moveOptions.zoom = options.zoom;

      moveOptions.zoom = moveOptions.zoom || this._coreMap.getZoom();
      this._coreMap.jumpTo(moveOptions);
      this._handleFloorChange(options);
    };

    proto._rotateTo = function (options) {
      const { heading, tilt, duration, callback } = options;
      this.cameraCtrl.flyToTarget(undefined, undefined, undefined, heading, tilt, undefined, duration, callback);
    };

    proto._getCurrentBDID = function () {
      return this._coreMap.getCurrentBDID();
    };

    proto._getCurrentBuilding = function () {
      return this._coreMap.getCurrentBuilding();
    };

    proto._getCurrentBuildingInfo = function () {
      return this._coreMap.getCurrentBuildingInfo();
    };

    proto._getCurrentFloorsInfo = function () {
      return this._coreMap.getCurrentFloorsInfo();
    };
    proto.getBuildingInfo = function (bdid) {
      return this._coreMap.getBuildingInfo(bdid);
    };
    proto.getBuildingByPos = function (pos) {
      return this._coreMap.getBuildingByPos(pos);
    };

    proto.getFloorInfo = proto._getFloorInfo = function (bdid, floorId) {
      if (!bdid || !floorId) return;
      const building = this._coreMap._scene.getChildById(bdid);
      if (!building) return;

      const floors = building.bdInfo.data.floors;
      for (const i in floors) {
        const floor = floors[i];
        if (floor.flid == floorId) return floor;
      }
    };

    proto.getFloorIdByFLIndex = function (bdid, floorIndex) {
      const floors = this._coreMap._scene.getChildById(bdid).bdInfo.data.floors;
      for (const i in floors) {
        const floor = floors[i];
        if (floor.flindex == floorIndex) return floor.flid;
      }
    };

    proto.setIndoorSceneVisible = function (visible, bdid, singleVisible) {
      this._coreMap.setIndoorBuildingVisible(visible, bdid, singleVisible);
    };

    proto._getCurrentFloorId = function () {
      return this._coreMap.getCurrentFloorId();
    };

    proto._cameraPose = function () {
      return this._coreMap.cameraPose();
    };

    proto._getPosition = function () {
      return this._coreMap.getPosition();
    };

    /////////////////////////////////////////////////////////////////////
    // Features
    /////////////////////////////////////////////////////////////////////
    proto._setVectorColor = function (id, color, outLineColor, opacity) {
      const res = this._coreMap._indoorMapApi.engineApi.setVectorColor(id, color, outLineColor, opacity);
      this._coreMap._indoorMapApi.engineApi.forceRedraw();
      return res;
    };

    proto._setHighlightVectorById = function (vectorId, callback) {
      const engineApi = this._coreMap._indoorMapApi.engineApi;
      engineApi.highlightVectorById(vectorId, callback);
      engineApi.forceRedraw();
    };

    proto._setFeatureTransparency = function (lineIds, alpha) {
      this._coreMap.setFeatureTransparency(lineIds, alpha);
    };

    // Marker Api
    proto._addMarker = function (markerInfo) {
      return this._coreMap.addMarker(markerInfo);
    };

    proto._addMarkers = function (markerInfos) {
      return this._coreMap.addMarkers(markerInfos);
    };
    proto.createImage = function (data) {
      const styles = data.styles || [data];
    };

    proto._addToolTip = function (toolTipInfo) {
      return this._coreMap.addToolTip(toolTipInfo);
    };

    proto._removeAllMarker = function () {
      this._coreMap.removeAllMarker();
      this._coreMap.redraw();
    };

    proto._removeMarker = function (markerId) {
      this._coreMap.removeMarker(markerId);
    };

    proto._removeMarkers = function (ids) {
      this._coreMap.removeMarkers(ids);
    };
    proto._setMarkerVisible = function (uuid, visible) {
      DXSetMarkerVisibleVisitor(this._coreMap._scene, uuid, this.cameraCtrl.currentFloorId, visible).visit();
    };

    proto._setHighlightMarkerById = function (poiId) {
      DXHighlightMarkerVisitor(this._coreMap._scene, poiId).visit();
    };

    proto._setHighlightMarkerByUUID = function (uuid) {
      DXHighlightMarkerUUIDVisitor(this._coreMap._scene, uuid).visit();
    };

    // Polyline Api
    /** 创建折线 */
    proto._createPolyline = function () {
      const args = arguments;
      if (args.length == 0) return;

      let options;
      // 兼容两种参数模式：(floorId, points, ...) 或 (options)
      if (args.length > 1 && typeof args[0] == "string") {
        const [floorId, linePoints, lineWidth, lineColor, wrapperWidth, wrapperColor, smooth] = args;
        options = { floorId, linePoints, lineWidth, lineColor, wrapperWidth, wrapperColor, smooth };
      } else {
        options = args[0];
      }

      return this._coreMap.createPolyline(options);
    };

    proto.createPolyline2 = function (params) {
      return this._coreMap.createPolyline2(params);
    };
    proto.createHeatMap = function (options, data) {
      return this._coreMap.createHeatMap(options, data);
    };
    proto.createCircle = function (params) {
      return this._coreMap.createCircle(params);
    };
    proto._removePolylines = function (lineIds) {
      this._coreMap.removePolylines(lineIds);
    };

    proto._removeAllLine = function () {
      this._coreMap.removeRoute();
    };

    // 清除所有Line 和 Marker
    proto._removeAllMarkerAndRoutes = function () {
      this._coreMap.removeAllMarkerAndRoutes();
    };

    // Polygon Api
    /** 创建多边形 */
    proto._createPolygon = function () {
      const args = arguments;
      if (args.length == 0) return;

      let options;
      // 兼容两种参数模式：(bdid, floorId, polygonData, ...) 或 (options)
      if (args.length > 1 && typeof args[0] == "string") {
        const [bdid, floorId, features, fillColor, opacity, outlineColor] = args;
        options = { bdid, floorId, features, fillColor, opacity, outlineColor };
      } else {
        options = args[0];
      }
      return this._coreMap.createPolygon(options);
    };

    proto._createExtrusion = function (floorId, polygonData, bdid, opacity) {
      return this._coreMap.createExtrusion(floorId, polygonData, bdid, opacity);
    };

    proto._createWMSLayer = function (options) {
      return this._coreMap.createWMSLayer(options);
    };

    proto._createArrow = function (floorId, points, options, callback) {
      const guid = this._coreMap.factory.createUUID();
      this._coreMap.createArrow(guid, points, floorId, "./map/assets/images/line_arrow.png", 8, 0.6, options, callback);
    };

    proto._createRouteOverlay = function (data) {
      return this._coreMap.createRouteOverlay(data);
    };

    proto._createPoiLayer = function (params) {
      const bdid = params.bdid || "";
      const floorId = params.floorId || "";
      const data = params.data;
      const userScene = this._coreMap._scene;
      const floorObject = userScene.getChildById(bdid + floorId);
      const poiLayer = new daximap.DXMapBoxPoiLayer();

      poiLayer.floorId = floorId;
      poiLayer.setFloorObject(floorObject);
      poiLayer.initialize(this, { poiData: data, floorId, bdid });
      poiLayer.addToMap();
      poiLayer.name = `poiLayer_${floorId}_${this._coreMap.factory.createUUID()}`;
      poiLayer.visible = true;
      userScene.addChild(floorObject, poiLayer);
      return poiLayer;
    };

    proto._createVectorLayer = function (uuid, name) {
      const layer = new DXVectorLayer();
      layer.id = uuid;
      layer.name = name;
      return layer;
    };

    /////////////////////////////////////////////////////////////////////
    // Aux
    /////////////////////////////////////////////////////////////////////
    proto._getDownloader = function () {
      return this._downloader;
    };

    proto._isInner = function (point, vmagin = 0, hmargin = 0) {
      const screenPoint = this._coreMap._indoorMapApi.geoToScreen(point);
      const [width, height] = this._coreMap._indoorMapApi.engineApi.getCanvasSize();
      const leftDis = screenPoint.x;
      const topDis = screenPoint.y;
      const rigitDis = width - leftDis;
      const bottomDis = height - topDis;

      return leftDis > vmagin && topDis > hmargin && rigitDis > vmagin && bottomDis > hmargin;
    };

    proto._coordScreenToMap = function (x, y) {
      return this._coreMap._indoorMapApi.screenToGeo({ x, y });
    };
    proto._coordMapToScreen = function (x, y) {
      return this._coreMap._indoorMapApi.geoToScreen({ longitude: x, latitude: y, altitude: 0 });
    };

    proto._screenXYToLonLat = function (x, y) {
      return this._coreMap._mapboxMap.unproject([x, y]);
    };

    proto._lonLatToScreenXY = function (x, y) {
      const pos = this._coreMap._mapboxMap.project([x, y]);
      pos.x = ~~pos.x;
      pos.y = ~~pos.y;
      return pos;
    };

    proto._forceRedraw = function () {
      this._coreMap.redraw();
    };

    proto._showOutDoorMap = function (isVisible) {
      this._coreMap.setOutdoorMapVisible(isVisible);
    };

    proto._queryFeaturesByBbox = function (bbox, layerNames) {
      return this._coreMap.queryFeaturesByBbox(bbox, layerNames);
    };

    proto._setUserTrackingMode = function (mode) {
      this._coreMap.setUserTrackingMode(mode);
    };

    proto.loadImage = function (imageName, imageUrl, callback) {
      this._coreMap.loadImage(imageName, imageUrl, callback);
    };

    proto.setIndoorMapStyle = function (style) {
      this._coreMap.setIndoorMapStyle(style);
    };

    proto.getPoiInfoById = function (poiId, bdid, floorId) {
      return this._coreMap.getPoiInfoById(poiId, bdid, floorId);
    };

    proto.clearPolylineGrayData = function () {
      return this._coreMap.clearPolylineGrayData();
    };

    proto.getRootScene = function () {
      return this._coreMap._scene;
    };

    proto.getMapConfigData = function () {
      return this.mapConfigData;
    };

    proto.setFloorInterval = function (floorInterval) {
      this._coreMap._setFloorInterval(floorInterval);
    };

    proto.getMaxZoom = function () {
      return this._coreMap._mapboxMap.getMaxZoom();
    };

    proto.getMinZoom = function () {
      return this._coreMap._mapboxMap.getMinZoom();
    };

    proto.setMaxZoom = function (maxZoom) {
      return this._coreMap._mapboxMap.setMaxZoom(maxZoom);
    };

    proto.setMinZoom = function (minZoom) {
      return this._coreMap._mapboxMap.setMinZoom(minZoom);
    };

    proto.getMapBoxMap = function () {
      return this._coreMap._mapboxMap;
    };

    proto.computeDistance = function (p1, p2) {
      return DXMapUtils.naviMath.getGeodeticCircleDistance(p1, p2);
    };

    proto.setRotatedCallBack = function (callback) {
      return this._coreMap.setRotatedCallBack(callback);
    };

    proto.setPitchChangedCallback = function (callback) {
      return this._coreMap.setPitchChangedCallback(callback);
    };

    /////////////////////////////////////////////////////////////////////
    // Export Method
    /////////////////////////////////////////////////////////////////////

    proto.showOutDoorMap = proto._showOutDoorMap;
    proto.hideOurDoorMap = proto._hideOurDoorMap;
    proto.forceRedraw = proto._forceRedraw;

    proto.on = proto._on;
    proto.once = proto._once;
    proto.off = proto._off;
    proto.fire = proto._fire;
    proto.onMapEvents = proto._onMapEvents;

    proto.resize = proto._resize;
    proto.resizeMap = proto._resizeMap;
    proto.checkCanvasSize = proto._checkCanvasSize;
    proto.resetCanvasSize = proto._resetCanvasSize;
    proto.getCanvasSize = proto._getCanvasSize;

    proto.setPadding = proto._setPadding;
    proto.setViewMode = proto._setViewMode;
    proto.zoomIn = proto._zoomIn;
    proto.zoomOut = proto._zoomOut;
    proto.getZoom = proto.getZoomLevel = proto._getZoomLevel;
    proto.setZoom = proto.setZoomLevel = proto._setZoomLevel;
    proto.getZoomLevelRange = proto._getZoomLevelRange;
    proto.setZoomLevelRange = proto._setZoomLevelRange;
    proto.getHeading = proto._getHeading;
    proto.setHeading = proto._setHeading;
    proto.getPosition = proto._getPosition;
    proto.cameraPose = proto._cameraPose;
    proto.getTilt = proto._getTilt;
    proto.setTilt = proto._setTilt;
    proto.setView = proto._setView;
    proto.fitBounds = proto._fitBounds;
    proto.getBounds = proto._getBounds;
    proto.moveTo = proto._moveTo;
    proto.easeTo = proto._easeTo;
    proto.jumpTo = proto._jumpTo;
    proto.rotateTo = proto._rotateTo;
    proto.getCurrentBDID = proto._getCurrentBDID;
    proto.getCurrentBuilding = proto._getCurrentBuilding;
    proto.getCurrentBuildingInfo = proto._getCurrentBuildingInfo;
    proto.getCurrentFloorsInfo = proto._getCurrentFloorsInfo;
    proto.getCurrentFloorId = proto._getCurrentFloorId;
    proto.changeFloor = proto._changeFloor;
    proto.setExplodedView = proto._setExplodedView;
    proto.getExplodedView = proto._getExplodedView;
    proto.addControl = proto._addControl;
    proto.mapboxMap = proto._mapboxMap;

    proto.createUUID = proto._createUUID;
    proto.setVectorColor = proto._setVectorColor;
    proto.setHighlightVectorById = proto._setHighlightVectorById;

    proto.addMarker = proto._addMarker;
    proto.addMarkers = proto._addMarkers;
    proto.addToolTip = proto._addToolTip;
    proto.removeMarker = proto._removeMarker;
    proto.removeMarkers = proto._removeMarkers;

    proto.setMarkerVisible = proto._setMarkerVisible;
    proto.setHighlightMarkerById = proto._setHighlightMarkerById;
    proto.setHighlightMarkerByUUID = proto._setHighlightMarkerByUUID;

    proto.createPolyline = proto._createPolyline;
    proto.removePolylines = proto._removePolylines;
    proto.setFeatureTransparency = proto._setFeatureTransparency;

    proto.createPolygon = proto._createPolygon;
    proto.createExtrusion = proto._createExtrusion;
    proto.createWMSLayer = proto._createWMSLayer;
    proto.createArrow = proto._createArrow;

    proto.removeAllLine = proto._removeAllLine;
    proto.removeAllMarker = proto._removeAllMarker;
    proto.removeAllMarkerAndRoutes = proto._removeAllMarkerAndRoutes;

    proto.createPoiLayer = proto._createPoiLayer;
    proto.createVectorLayer = proto._createVectorLayer;
    proto.createRouteOverlay = proto._createRouteOverlay;

    proto.isInner = proto._isInner;
    proto.coordScreenToMap = proto._coordScreenToMap;
    proto.coordMapToScreen = proto._coordMapToScreen;

    proto.controllers = {};
    proto.queryFeaturesByBbox = proto._queryFeaturesByBbox;
    proto.setUserTrackingMode = proto._setUserTrackingMode;
    proto.screenXYToLonLat = proto._screenXYToLonLat;
    proto.lonLatToScreenXY = proto._lonLatToScreenXY;

    proto.onceMapEvent = function (eventName, layerIds, callback) {
      this._coreMap._mapboxMap.onceMapEvent(eventName, layerIds, callback);
    };
    proto.addMapEvent = function (eventName, layerIds, callback) {
      this._coreMap._mapboxMap.addMapEvent(eventName, layerIds, callback);
    };
    proto.removeMapEvent = function (eventName, layerIds, callback) {
      this._coreMap._mapboxMap.removeMapEvent(eventName, layerIds, callback);
    };

    proto.addTerrainSource = proto._addTerrainSource;
    proto.setTerrain = proto._setTerrain;
    proto.removeTerrain = proto._removeTerrain;
    proto.enableTerrain = proto._enableTerrain;

    /** 添加/更新 hillshade 山体阴影图层 */
    proto._addHillshade = function (sourceId, options = {}) {
      const mapboxMap = this._coreMap._mapboxMap;

      // 检查是否已存在 hillshade 图层，存在则移除
      if (mapboxMap.getLayer("hillshade")) {
        mapboxMap.removeLayer("hillshade");
      }

      // 检查是否已存在数据源
      if (!mapboxMap.getSource(sourceId)) {
        if (options.tiles) {
          // tilejson 格式
          this._downloader.getServiceData(options.url, "GET", "json", {}, (config) => {
            const tiles = config.tiles || [];
            if (tiles.length > 0) {
              mapboxMap.addSource(sourceId, {
                type: "raster-dem",
                tiles: tiles,
                tileSize: config.tileSize || 256,
              });
              this._doAddHillshade(mapboxMap, sourceId, options);
            }
          });
          return;
        } else {
          // 直接使用 terrain 的数据源
          mapboxMap.addSource(sourceId, {
            type: "raster-dem",
            url: options.url,
            tileSize: options.tileSize || 256,
          });
        }
      }

      this._doAddHillshade(mapboxMap, sourceId, options);
    };

    /** 实际添加 hillshade 图层（内部方法） */
    proto._doAddHillshade = function (mapboxMap, sourceId, options) {
      const exaggeration = options.exaggeration || 0.5;

      mapboxMap.addLayer({
        id: "hillshade",
        type: "hillshade",
        source: sourceId,
        minzoom: options.minzoom || 6,
        maxzoom: options.maxzoom || 14.49,
        paint: {
          "hillshade-exaggeration": exaggeration,
          "hillshade-illumination-anchor": "map",
          "hillshade-shadow-color": "hsla(0, 0%, 0%, 0.3)",
          "hillshade-highlight-color": "hsla(0, 100%, 100%, 0.3)",
          "hillshade-accent-color": "hsla(0, 0%, 50%, 0.5)",
        },
      });
    };

    /** 移除 hillshade 图层 */
    proto._removeHillshade = function () {
      const mapboxMap = this._coreMap._mapboxMap;
      if (mapboxMap.getLayer("hillshade")) {
        mapboxMap.removeLayer("hillshade");
      }
    };

    /** 启用完整地形效果（terrain + hillshade） */
    proto._enableTerrainWithHillshade = function (options = {}) {
      const sourceId = options.sourceId || "mapbox-terrain";

      // 先启用 terrain（异步完成后添加 hillshade）
      this._enableTerrain(options);

      // 延迟添加 hillshade
      setTimeout(() => {
        this._addHillshade(sourceId, {
          url: options.terrainJsonUrl,
          tiles: options.tiles,
          exaggeration: options.hillshadeExaggeration || 0.5,
          minzoom: options.minzoom,
          maxzoom: options.maxzoom,
        });
      }, 1500);
    };

    proto.addHillshade = proto._addHillshade;
    proto.removeHillshade = proto._removeHillshade;
    proto.enableTerrainWithHillshade = proto._enableTerrainWithHillshade;

    /////////////////////////////////////////////////////////////////////
    // Terrain
    /////////////////////////////////////////////////////////////////////

    /** 添加 terrain 数据源 */
    proto._addTerrainSource = function (sourceId, options, callback) {
      const mapboxMap = this._coreMap._mapboxMap;
      if (mapboxMap.getSource(sourceId)) {
        if (callback) callback();
        return;
      }

      // 支持两种格式：
      // 1. Mapbox terrain-RGB 格式：直接指定 url
      // 2. tilejson 3.0 格式：需要先加载 terrain.json 获取 tiles
      if (options.tiles) {
        // tilejson 格式：使用 downloader 获取 terrain.json 内容
        const url = options.url;
        this._downloader.getServiceData(url, "GET", "json", {}, (terrainConfig) => {
          const tiles = terrainConfig.tiles || [];
          if (tiles.length > 0) {
            mapboxMap.addSource(sourceId, {
              type: "raster-dem",
              tiles: tiles,
              tileSize: terrainConfig.tileSize || 256,
            });
          } else {
            console.warn("[Terrain] terrain.json 中没有找到 tiles 配置");
          }
          if (callback) callback();
        });
      } else {
        // 直接 URL 格式
        mapboxMap.addSource(sourceId, {
          type: "raster-dem",
          url: options.url,
          tileSize: options.tileSize || 256,
        });
        if (callback) callback();
      }
    };

    /** 设置 terrain（地形起伏） */
    proto._setTerrain = function (sourceId, options = {}) {
      const mapboxMap = this._coreMap._mapboxMap;
      // 检查数据源是否存在
      if (!mapboxMap.getSource(sourceId)) {
        console.warn("[Terrain] 数据源不存在:", sourceId);
        return;
      }
      mapboxMap.setTerrain({
        source: sourceId,
        exaggeration: options.exaggeration || 1,
      });
    };

    /** 移除 terrain */
    proto._removeTerrain = function () {
      const mapboxMap = this._coreMap._mapboxMap;
      mapboxMap.setTerrain(null);
    };

    /** 启用 3D 地形（简化方法：添加数据源并启用 terrain） */
    proto._enableTerrain = function (options = {}) {
      const sourceId = options.sourceId || "mapbox-terrain";
      const dataPath = options.dataPath || this.config.baseMapDataPath || "";

      // 优先使用 tilejson 格式的 terrain.json
      let sourceOptions;
      if (options.terrainJsonUrl) {
        // 自定义 terrain.json 地址
        sourceOptions = {
          url: options.terrainJsonUrl,
          tiles: true, // 标记为 tilejson 格式
        };
      } else if (dataPath) {
        // 默认使用 baseMapDataPath 下的 terrain.json
        const terrainUrl = `${dataPath}terrain.json`;
        sourceOptions = {
          url: terrainUrl,
          tiles: true,
        };
      } else {
        // 直接 tiles URL
        sourceOptions = {
          url: options.url || "http://localhost:9091/data/terrain.json",
        };
      }

      // 添加数据源（异步完成后启用 terrain）
      this._addTerrainSource(sourceId, sourceOptions, () => {
        this._setTerrain(sourceId, { exaggeration: options.exaggeration || 1 });
      });
    };

    this._initMap();
  };

  /**
   * 动画控制器
   * @param {number} animationFrameTime 帧间隔
   * @returns {Object} 动画控制接口
   */
  const AnimationController = function (animationFrameTime) {
    const info = {
      interval: animationFrameTime || 0.1,
      isPause: false,
      id: DXMapUtils.createUUID(),
      rafTimer: rafTimerController,
    };

    info.init = (interval) => {
      info.interval = interval;
      info.updateCallbckInterval(interval);
    };

    info.fini = () => info.stop();

    info.start = (animationTime, forever) => {
      info.isPause = false;
      info.setPause(false);
      info.animationTime = animationTime;
      info.forever = forever;
      info.rafTimer.startRafInterval(info.id, animationTime, forever);
    };

    info.stop = () => {
      info.isPause = true;
      info.rafTimer.clearAllRafInterval(info.id);
    };

    info.setPause = (pval, animationTime, forever) => {
      info.isPause = pval;
      info.rafTimer.setPause(info.id, pval, animationTime || info.animationTime, forever || info.forever);
    };

    info.addListener = (callback, interval) => {
      interval = interval || info.interval || 0.017;
      if (callback) {
        info.rafTimer.addRafInterval(info.id, callback, interval);
      }
    };

    info.clearListeners = () => info.rafTimer.clearAllRafInterval(info.id);

    info.updateCallbckInterval = (interval) => info.rafTimer.updateInterval(info.id, interval);

    return info;
  };
  const rafTimerController = (() => {
    const that = {
      isPause: true,
      allPuase: false,
    };

    if (!Date.now) {
      Date.now = () => new Date().getTime();
    }

    let queue = [];
    let ticking = false;
    let tickId = null;
    const now = Date.now;
    let lastTime = 0;
    let animationId = null;

    window.DXrequestAnimationFrame = (callback) => {
      const currTime = now();
      clearTimeout(animationId);
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      const id = (animationId = window.setTimeout(() => {
        callback(currTime + timeToCall);
      }, timeToCall));
      lastTime = currTime + timeToCall;
      return id;
    };

    window.DXcancelAnimationFrame = (id) => clearTimeout(id);

    that.startRafInterval = (rafId, animationTime, forever) => {
      const nowTime = Date.now();
      const animateStopTime = animationTime ? nowTime + animationTime : null;

      queue.forEach((item) => {
        if (item.rafId == rafId) {
          if (animateStopTime) item.animateStopTime = animateStopTime;
          item.forever = forever;
          item.pause = false;
        }
      });

      if (!ticking) {
        if (tickId) window.DXcancelAnimationFrame(tickId);

        const tick = () => {
          const currentTime = Date.now();
          queue.forEach((item) => {
            if (!item.pause && currentTime - item.lastTime >= item.interval) {
              item.lastTime = currentTime;
              item.fn();
            }
          });
          tickId = window.DXrequestAnimationFrame(tick);
        };

        ticking = true;
        tick();
      }
    };

    that.addRafInterval = (rafId, fn, interval, isPause = true, animateTime, forever) => {
      let isExist = false;
      let _id;
      const _interval = interval ? interval * 1000 : undefined;

      queue.forEach((item) => {
        if (item.fn == fn && rafId == item.rafId) {
          isExist = true;
          if (interval && item.interval != _interval) {
            item.interval = _interval;
            _id = item.id;
          }
          if (animateTime) item.animateStopTime = Date.now() + animateTime;
          item.forever = forever;
        }
      });

      if (!isExist) {
        const newId = queue.length > 0 ? queue[queue.length - 1].id + 1 : 0;
        queue.push({
          id: newId,
          fn,
          interval: _interval,
          rafId,
          pause: isPause,
          lastTime: Date.now(),
        });
        return newId;
      }
      return _id;
    };

    that.clearRafInterval = (rafId) => {
      queue = queue.filter((item) => item.rafId != rafId);

      if (queue.length === 0) {
        window.DXcancelAnimationFrame(tickId);
        ticking = false;
      }
    };

    that.setPause = (rafId, isPause) => {
      let allPaused = true;
      queue.forEach((item) => {
        if (item.rafId == rafId) item.pause = isPause;
        if (!item.pause) allPaused = false;
      });
      that.allPuase = allPaused;
    };

    that.updateInterval = (rafId, interval) => {
      queue.forEach((item) => {
        if (item.rafId == rafId) item.interval = interval * 1000;
      });
    };

    that.clearQueueInterval = () => {
      queue = [];
      window.DXcancelAnimationFrame(tickId);
      ticking = false;
      that.allPuase = true;
    };

    that.clearAllRafInterval = (rafId) => {
      queue = queue.filter((item) => item.rafId != rafId);

      if (queue.length === 0 || queue.every((item) => item.pause)) {
        window.DXcancelAnimationFrame(tickId);
        ticking = false;
        that.allPuase = true;
      }
    };

    return that;
  })();

  daximap.Map = DXMap3D;
  daximap.UserLocationMarker = daximap.DXUserLocationMarker;
  daximap.AnimationController = AnimationController;

  daximap.LocationState = {
    UNLOCATE: 0,
    LOCATEFAILED: 0,
    LOCATING: 1,
    LOCATED: 2,
    LOCATEDFLLOW: 3,
  };

  daximap.UserTrackingMode = {
    Unknown: DXUserTrackingModeUnknown,
    None: DXUserTrackingModeNone,
    Follow: DXUserTrackingModeFollow,
    FollowWithHeading: DXUserTrackingModeFollowWithHeading,
  };

// ES6 模块导出
