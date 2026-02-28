/**
 * Daximap 室内场景管理
 * 处理室内建筑加载、楼层切换及其状态管理
 */

const daximap = window.DaxiMap || {};
const DXMapUtils = daximap.DXMapUtils;
const DXSceneNode = daximap.DXSceneNode;

const UNLOAD = 0;
const LOADING = 1;
const LOADED = 2;

/**
 * DXIndoorMapScene - 室内场景类
 * 管理特定建筑的室内地图资源、楼层信息和状态
 */
class DXIndoorMapScene extends DXSceneNode {
  /**
   * 初始化室内场景
   */
  __init__() {
    super.__init__?.();
    this._rtti = "DXIndoorMapScene";
    this.status = UNLOAD;
    this.children = [];
    this.currentOffset = 0;
    this._explodedOpacity = 0.8;
  }

  /**
   * 创建场景内容
   * @param {Object} mapSDK
   * @param {String} mapUrl
   * @param {String} id
   * @param {String} bdid
   * @param {String} extent
   * @param {Object} bdInfo
   * @param {String} mapStyle
   */
  _create(mapSDK, mapUrl, id, bdid, extent, bdInfo, mapStyle) {
    this.bdInfo = bdInfo;
    this.mapStyle = mapStyle || "default";
    this.styleVersion = bdInfo.styleVersion || window.version || Date.now();
    this.baseUrl = mapUrl;
    this.id = id;
    this.bdid = bdid;
    this.center = [];
    this.floorInfoMap = {};
    this.floorInfos = [];
    this._mapSDK = mapSDK;
    this.floorInterval = mapSDK.config.floorInterval;
    this._scene = mapSDK._coreMap._scene;
    const indoorMapApi = this._mapSDK._coreMap._indoorMapApi;

    if (!extent && bdInfo.data) {
      extent = bdInfo.data.rect;
    }

    if (extent) {
      const arr = extent.split(",").map((str) => parseFloat(str));
      this.extent = arr;
      this.center[0] = (arr[0] + arr[2]) * 0.5;
      this.center[1] = (arr[1] + arr[3]) * 0.5;
    } else {
      alert("请配置建筑范围");
      return;
    }
    this.indoorScene = indoorMapApi.engineApi.createIndoorScene(bdid, "", extent);
  }

  /**
   * 检查是否已加载
   * @returns {Boolean}
   */
  isLoaded() {
    return this.status == LOADED;
  }

  /**
   * 加载地图资源
   * @param {Function} callback
   */
  _loadMap(callback) {
    if (this.status == UNLOAD) {
      this.status = LOADING;
      let sceneUrl = "";
      const subPath = this.mapStyle + "/style.json";
      if (this.baseUrl.indexOf("/getFile?") != -1) {
        sceneUrl = this.baseUrl + encodeURIComponent(subPath) + "&version=" + this.styleVersion;
      } else {
        sceneUrl += this.baseUrl + subPath + "?version=" + this.styleVersion;
      }
      this._loadSceneConfigData(sceneUrl, (bdInfo) => {
        if (this.status == LOADED) return;
        this.status = LOADED;
        callback?.(bdInfo);
      });
    }
  }

  /**
   * 解析楼层信息
   * @param {Object} context 上下文数据
   * @param {Object} floorObject 楼层节点列表
   */
  _parseFloorInfo(context, floorObject) {
    const indoorMapApi = this._mapSDK._coreMap._indoorMapApi;
    const userScene = this._mapSDK._coreMap._scene;
    const { item, baseUrl, floorId } = context;

    // 解析并创建多种类型的图层
    const rsLayersJson = item.rslayer;
    if (rsLayersJson) {
      rsLayersJson.forEach((rsLayerJson, j) => {
        if (baseUrl.indexOf("/getFile") == -1) {
          rsLayerJson.link = baseUrl + rsLayerJson.link;
        } else {
          rsLayerJson.link = baseUrl + encodeURIComponent(rsLayerJson.link);
        }

        const dataSource = indoorMapApi.engineApi.createModelLayer(DXMapUtils.createUUID(), floorId + "_" + j, rsLayerJson);
        const modelLayer = new daximap.DXModelLayer();
        modelLayer.initialize(this._mapSDK);
        modelLayer.setSource(dataSource);
        modelLayer.setFloorObject(floorObject);
        modelLayer.id = DXMapUtils.createUUID();
        modelLayer.floorId = floorId;
        modelLayer.name = "modelLayer_" + floorId + "_" + j;
        modelLayer.type = "inner";
        modelLayer.visible = true;
        modelLayer.cat = daximap.defaultValue(rsLayerJson.cat, "indoor");
        userScene.addChild(floorObject, modelLayer);
      });
    }

    // WMS 图层
    const wmsLayers = item.wmsLayer;
    if (wmsLayers) {
      wmsLayers.forEach((layerJson, j) => {
        let url = "";
        layerJson.link && (url = layerJson.link);
        if (layerJson.link && layerJson.link.indexOf("http") == -1) {
          url = baseUrl + layerJson.link;
        }
        if (url) {
          layerJson.url = url;
        }
        if (layerJson.rect) {
          const bounds = layerJson.rect.split(",").map((item) => parseFloat(item));
          layerJson.bounds = bounds;
        }

        const wmsLayer = new daximap.DXMapBoxWMSLayer();
        wmsLayer.initialize(this._mapSDK, layerJson, "mycustomindoorlayer");
        wmsLayer.addToMap();
        wmsLayer.setFloorObject(floorObject);
        wmsLayer.id = DXMapUtils.createUUID();
        wmsLayer.floorId = floorId;
        wmsLayer.name = "wmsLayer_" + floorId + "_" + j;
        wmsLayer.type = "inner";
        wmsLayer.visible = true;
        userScene.addChild(floorObject, wmsLayer);
      });
    }

    // WMTS 图层
    const wmtslayers = item.wmtsLayer;
    if (wmtslayers) {
      wmtslayers.forEach((layerJson, j) => {
        const app = window.DaxiApp || window.daxiapp;
        if (app?.utils?.addScenicUrl) {
          layerJson.tiles[0] = app.utils.addScenicUrl(layerJson.tiles[0]);
        }

        if (!item.rslayer?.length && !item.pmlayer?.length && !layerJson.sourceMaxlevel) {
          layerJson.sourceMaxlevel = layerJson.maxlevel;
          layerJson.maxlevel = this._mapSDK._coreMap.getMaxZoom();
        }

        let url = "";
        layerJson.link && (url = layerJson.link);
        if (layerJson.link && layerJson.link.indexOf("http") == -1) {
          url = baseUrl + layerJson.link;
        }
        if (url) {
          layerJson.url = url;
        }
        if (layerJson.rect) {
          const bounds = layerJson.rect.split(",").map((item) => parseFloat(item));
          layerJson.bounds = bounds;
        }

        const wmtsLayer = new daximap.DXMapBoxWMTSLayer();
        wmtsLayer.initialize(this._mapSDK, layerJson, "mycustomindoorlayer");
        wmtsLayer.addToMap();
        wmtsLayer.setFloorObject(floorObject);
        wmtsLayer.id = DXMapUtils.createUUID();
        wmtsLayer.floorId = floorId;
        wmtsLayer.name = "wmtsLayer_" + floorId + "_" + j;
        wmtsLayer.type = "inner";
        wmtsLayer.visible = true;
        userScene.addChild(floorObject, wmtsLayer);
      });
    }

    // 拉伸图层 (Extrusion)
    const extrueLayerJSON = item.extrueLayer;
    if (extrueLayerJSON) {
      extrueLayerJSON.forEach((layerJson, j) => {
        let url = "";
        layerJson.link && (url = layerJson.link);
        if (layerJson.link && layerJson.link.indexOf("http") == -1) {
          url = baseUrl + layerJson.link;
        }
        if (url) {
          layerJson.url = url;
        }
        if (layerJson.rect) {
          const bounds = layerJson.rect.split(",").map((item) => parseFloat(item));
          layerJson.bounds = bounds;
        }

        const extrueLayer = new daximap.DXMapBoxExtrusionLayer();
        extrueLayer.initialize(this._mapSDK, layerJson);
        extrueLayer.addToMap();
        extrueLayer.setFloorObject(floorObject);
        extrueLayer.id = DXMapUtils.createUUID();
        extrueLayer.floorId = floorId;
        extrueLayer.name = "extrueLayer_" + floorId + "_" + j;
        extrueLayer.type = "inner";
        extrueLayer.visible = true;
        userScene.addChild(floorObject, extrueLayer);
      });
    }

    // 矢量图层 (Vector)
    const vectorLayersJson = item.vectorlayer;
    if (vectorLayersJson) {
      vectorLayersJson.forEach((vectorLayerJson, j) => {
        let vectorDataUrl = baseUrl + vectorLayerJson.link;
        if (window.version) {
          vectorDataUrl += (vectorDataUrl.indexOf("?") != -1 ? "&t=" : "?t=") + window.version;
        }
        const dataSource = indoorMapApi.engineApi.createVectorLayer(DXMapUtils.createUUID(), floorId + "_" + j, {
          url: vectorDataUrl,
        });
        const vectorLayer = new daximap.DXVectorLayer();
        vectorLayer.initialize(this._mapSDK);
        vectorLayer.setSource(dataSource);
        vectorLayer.setFloorObject(floorObject);
        vectorLayer.id = DXMapUtils.createUUID();
        vectorLayer.floorId = floorId;
        vectorLayer.name = "vectorLayer_" + floorId + "_" + j;
        vectorLayer.visible = true;
        userScene.addChild(floorObject, vectorLayer);
      });
    }

    // PM 图层 (PMLayer)
    const pmLayersJson = item.pmlayer;
    if (pmLayersJson) {
      pmLayersJson.forEach((pmLayerJson, j) => {
        let vectorDataUrl = baseUrl + pmLayerJson.link;
        if (window.version) {
          vectorDataUrl += (vectorDataUrl.indexOf("?") != -1 ? "&t=" : "?t=") + window.version;
        }

        const options = {
          url: vectorDataUrl,
          shadowMap: pmLayerJson.shadowMap,
          minlevel: pmLayerJson.minlevel,
          maxlevel: pmLayerJson.maxlevel,
        };
        const dataSource = indoorMapApi.engineApi.createPMLayer(DXMapUtils.createUUID(), floorId + "_" + j, options);
        const vectorLayer = new daximap.DXVectorLayer();
        vectorLayer.initialize(this._mapSDK);
        vectorLayer.setSource(dataSource);
        vectorLayer.setFloorObject(floorObject);
        vectorLayer.id = DXMapUtils.createUUID();
        vectorLayer.floorId = floorId;
        vectorLayer.name = "vectorLayer_" + floorId + "_" + j;
        vectorLayer.visible = true;
        vectorLayer._cat = daximap.defaultValue(pmLayerJson.cat, "indoor");
        userScene.addChild(floorObject, vectorLayer);
      });
    }

    // POI 图层
    const poiLayersJson = item.poilayer;
    if (poiLayersJson) {
      poiLayersJson.forEach((poiLayerJson, j) => {
        const poiLink = poiLayerJson.link || "";
        const disableLegacyPoiJsonRequest = window.disableLegacyPoiJsonRequest !== false;
        const isLegacyPoiJson = /^poi\.json(\?.*)?$/i.test(poiLink);

        // 历史兼容：poi.json 常常不存在且会在初始化阶段触发多次 404
        // 默认跳过该类请求；如确需启用，可设置 window.disableLegacyPoiJsonRequest = false
        if (isLegacyPoiJson && disableLegacyPoiJsonRequest) {
          console.warn("[DXIndoorMap] 已跳过 legacy POI 请求:", poiLink, "floor:", floorId);
          return;
        }

        let poiDataUrl = "";
        if (baseUrl.indexOf("/getFile") != -1) {
          poiDataUrl = baseUrl + encodeURIComponent(poiLink);
        } else if (poiLink.indexOf("http") == 0) {
          poiDataUrl = poiLink;
        } else {
          poiDataUrl = baseUrl + poiLink;
        }

        const version = this.bdInfo.poiVersion || window.version;
        const poiLayer = new daximap.DXMapBoxPoiLayer();
        poiLayer.floorId = floorId;
        poiLayer.setFloorObject(floorObject);
        const poiOptions = {
          link: poiDataUrl,
          floorId: floorId,
          bdid: this.bdid,
          version: version,
          ...poiLayerJson,
        };
        poiLayer.initialize(this._mapSDK, poiOptions);
        poiLayer.addToMap();
        poiLayer.name = "poiLayer_" + floorId + "_" + j;
        poiLayer.visible = true;
        userScene.addChild(floorObject, poiLayer);
      });
    }
  }

  /**
   * 加载场景配置数据
   * @param {String} link
   * @param {Function} callback
   */
  _loadSceneConfigData(link, callback) {
    const onDataSuccess = (data) => {
      const maxLevel = data?.building?.[0]?.wmtsLayer?.[0]?.maxlevel || 20;
      this._mapSDK?._setZoomLevelRange?.(2, maxLevel);
      this._removeChildren();
      const initFloorId = this.currentFloorId || data.initfloor;
      const totalRect = data.rect;
      const bdid = data.buildingID || "";
      let baseUrl = this.baseUrl;
      if (link.indexOf("/getFile") == -1) {
        baseUrl += this.mapStyle + "/";
      } else {
        baseUrl += encodeURIComponent(this.mapStyle + "/");
      }
      if (!this.currentFloorId) {
        this.currentFloorId = initFloorId;
      }

      this._beginUpdateFloorInfos();
      const buildingData = data.building;
      if (buildingData) {
        buildingData.forEach((item) => {
          const floorId = item.flid;
          const context = {
            baseUrl,
            bdid,
            floorId,
            initFloorId,
            item,
          };

          const rect = DXMapUtils.parseLonLatRect(item.rect);
          const floorInfo = {
            bdid,
            flid: item.flid,
            flname: item.flname,
            cname: item.cname,
            flindex: daximap.defaultValue(item.flindex, 0),
            lon: (rect[0] + rect[2]) * 0.5,
            lat: (rect[1] + rect[3]) * 0.5,
            rect,
            rang: rect,
          };

          this._addFloorInfo(floorInfo);
          const floorObject = new daximap.DXSceneFloorObject(this._mapSDK);
          floorObject.id = bdid + floorId;
          floorObject.floorId = floorId;
          floorObject.bdid = bdid;
          floorObject.visible = floorId == initFloorId;
          this._scene.addChild(this, floorObject);
          this.children.push(floorObject);

          this._parseFloorInfo(context, floorObject);
        });
      }
      this._endUpdateFloorInfos();

      // 解析室外辅助层
      const outdoorData = data.outdoor;
      if (outdoorData && outdoorData.length > 0) {
        const item = outdoorData[0];
        const floorId = item.flid;
        const context = {
          baseUrl,
          bdid,
          floorId,
          initFloorId: this.currentFloorId,
          item,
        };

        const floorObject = new daximap.DXSceneFloorObject(this._mapSDK);
        floorObject.id = bdid + "_outdoor";
        floorObject.floorId = floorId;
        floorObject.bdid = bdid;
        floorObject.visible = true;
        floorObject.isOutdoor = true;
        this._scene.addChild(this, floorObject);
        this.children.push(floorObject);

        this._parseFloorInfo(context, floorObject);
        this.outdoor = floorObject;
      }
      this.bdInfo.data = { rect: totalRect, floors: this.floorInfos, initfloor: initFloorId };

      callback?.(this);
    };

    this._mapSDK._getDownloader().getPackageData(link, "GET", "json", { token: this._mapSDK.config.token, bdid: this.bdid }, onDataSuccess, undefined);
  }

  /**
   * 移除所有子节点（楼层）
   */
  _removeChildren() {
    if (this.children.length == 0) return;
    const userScene = this._mapSDK._coreMap._scene;
    this.children.forEach((child) => {
      userScene.removeChild(child);
    });
    this.children = [];
  }

  /**
   * 设置地图样式
   * @param {String} styleName
   * @param {Function} callback
   */
  _setMapStyle(styleName, callback) {
    if (styleName != this.mapStyle) {
      this.status = UNLOAD;
      this.mapStyle = styleName;
      this._removeChildren();
      this._loadMap((data) => {
        callback?.(data);
      });
    }
  }

  /**
   * 切换楼层
   * @param {String} floorId
   * @param {Boolean} explodedView
   * @param {Boolean} force
   */
  _changeFloor(floorId, explodedView, force) {
    if (!force && this.currentFloorId == floorId) return;
    if (explodedView) {
      this._updateFloorViewAnimated(floorId);
    } else {
      this.currentFloorId = floorId;
      if (this.status == LOADED) {
        const visitor = explodedView ? window.DXChangeFloorWithExplodedViewVisitor?.(this, floorId) : window.DXChangeFloorVisitor?.(this, floorId);
        visitor?.visit();
      }
    }
    this._mapSDK._eventMgr.fire("changeFloor", floorId);
    this._mapSDK._coreMap.redraw();
  }

  /**
   * 更新楼层视图
   * @param {String} floorId
   */
  _updateFloorView(floorId) {
    const targetFloorInterval = this.floorInterval || this._mapSDK.config.floorInterval;
    this.currentFloorId = floorId;
    const currentFloorIndex = this._getFloorIndex(this.currentFloorId);
    this._setFloorsOpacity(floorId, 1.0, this._explodedOpacity);
    this._setFloorsOffset(this.currentOffset, currentFloorIndex, targetFloorInterval);

    this.floorInfos.forEach((floorInfo, i) => {
      const floorObject = this.getChildById(this.bdid + floorInfo.flid);
      if (floorObject) {
        floorObject.heightOffset = (i - currentFloorIndex) * -targetFloorInterval;
      }
    });
  }

  /**
   * 重置楼层视图为普通视图
   * @param {String} floorId
   */
  _resetFloorView(floorId) {
    const targetFloorInterval = 0.0;
    this.currentFloorId = floorId;
    const currentFloorIndex = this._getFloorIndex(this.currentFloorId);
    this._setFloorsOpacity(floorId, 1.0, 1.0);
    this._setFloorsOffset(this.currentOffset, currentFloorIndex, targetFloorInterval);

    this.floorInfos.forEach((floorInfo, i) => {
      const floorObject = this.getChildById(this.bdid + floorInfo.flid);
      if (floorObject) {
        floorObject.heightOffset = 0;
      }
    });
  }

  /**
   * 获取楼层索引
   * @param {String} floorId
   * @returns {Number}
   */
  _getFloorIndex(floorId) {
    for (let i = 0; i < this.floorInfos.length; i++) {
      if (floorId == this.floorInfos[i].flid) {
        return i;
      }
    }
    return 0;
  }

  /**
   * 切换到上一层
   * @param {Number} floorOffset
   */
  _toUpperFloor(floorOffset) {
    const currentFloorInfo = this._getFloorInfo(this.currentFloorId);
    const currentFloorIndex = currentFloorInfo.flindex;
    const maxIndex = this.floorInfos.length - 1;
    const realFloorOffset = currentFloorIndex + floorOffset <= maxIndex ? floorOffset : maxIndex - currentFloorIndex;

    if (realFloorOffset == 0) {
      this._updateFloorViewAnimated(this.currentFloorId);
    } else {
      const floorInfo = this._getFloorInfoByIndexNum(currentFloorIndex + realFloorOffset);
      floorInfo && this._changeFloor(floorInfo.flid, true);
    }
  }

  /**
   * 切换到下一层
   * @param {Number} floorOffset
   */
  _toLowerFloor(floorOffset) {
    const currentFloorInfo = this._getFloorInfo(this.currentFloorId);
    const currentFloorIndex = currentFloorInfo.flindex;
    const realFloorOffset = currentFloorIndex + floorOffset >= 0 ? floorOffset : -currentFloorIndex;

    if (realFloorOffset == 0) {
      this._updateFloorViewAnimated(this.currentFloorId);
    } else {
      const floorInfo = this._getFloorInfoByIndexNum(currentFloorIndex + realFloorOffset);
      floorInfo && this._changeFloor(floorInfo.flid, true);
    }
  }

  /**
   * 恢复楼层显隐状态
   * @param {Boolean} explodedView
   */
  _resumeFloor(explodedView) {
    if (explodedView) {
      this._updateFloorViewAnimated(this.currentFloorId);
    } else {
      this._updateFloorView(this.currentFloorId);
      if (this.status == LOADED) {
        const visitor = explodedView
          ? window.DXChangeFloorWithExplodedViewVisitor?.(this, this.currentFloorId)
          : window.DXChangeFloorVisitor?.(this, this.currentFloorId);
        visitor?.visit();
      }
    }
    this._mapSDK._coreMap.redraw();
  }

  /**
   * 设置楼层间距
   * @param {Number} interval
   */
  _setFloorInterval(interval) {
    this.floorInterval = interval;
  }

  /**
   * 设置当前垂直偏移量
   * @param {Number} offset
   */
  _setCurrentOffset(offset) {
    this.currentOffset = offset;
    const currentFloorIndex = this._getFloorIndex(this.currentFloorId);
    this.floorInterval = this.floorInterval || 150;
    this._setFloorsOffset(this.currentOffset, currentFloorIndex, this.floorInterval);
    this._mapSDK._coreMap.redraw();
  }

  /**
   * 设置所有楼层的不透明度
   * @param {String} floorId
   * @param {Number} activeOpacity
   * @param {Number} inactiveOpacity
   */
  _setFloorsOpacity(floorId, activeOpacity, inactiveOpacity) {
    this.floorInfos.forEach((floorInfo) => {
      const floorObject = this.getChildById(this.bdid + floorInfo.flid);
      if (floorObject) {
        floorObject.opacity = floorId == floorInfo.flid ? activeOpacity : inactiveOpacity;
      }
    });
  }

  /**
   * 设置所有楼层的偏移量
   * @param {Number} offset
   * @param {Number} currentFloorIndex
   * @param {Number} floorInterval
   */
  _setFloorsOffset(offset, currentFloorIndex, floorInterval) {
    this.floorInfos.forEach((floorInfo, i) => {
      const floorObject = this.getChildById(this.bdid + floorInfo.flid);
      if (floorObject) {
        floorObject.heightOffset = (currentFloorIndex - i) * floorInterval + offset;
      }
    });
    window.DXUpdateHeightOffsetVisitor?.(this).visit();
  }

  /**
   * 带有动画效果的楼层切换/视图更新
   * @param {String} floorId
   */
  _updateFloorViewAnimated(floorId) {
    const targetFloorInterval = this.floorInterval || this._mapSDK.config.floorInterval;
    const currentFloorIndex = this._getFloorIndex(this.currentFloorId);
    const newFloorIndex = this._getFloorIndex(floorId);

    this.targetOffset = (newFloorIndex - currentFloorIndex) * targetFloorInterval;
    const offsetStep = (this.targetOffset - this.currentOffset) * 0.1;
    this.floorInterval = targetFloorInterval;

    this.currentFloorId = floorId;
    this._setFloorsOpacity(floorId, 1.0, this._explodedOpacity);

    clearInterval(this._timer);
    this._timer = setInterval(() => {
      if (offsetStep == 0 || (offsetStep > 0 && this.currentOffset > this.targetOffset) || (offsetStep < 0 && this.currentOffset < this.targetOffset)) {
        this.currentFloorId = floorId;
        this.currentOffset = 0;
        clearInterval(this._timer);
        this._timer = null;

        if (this.status == LOADED) {
          window.DXChangeFloorWithExplodedViewVisitor?.(this, floorId).visit();
        }
        return;
      }
      this._setFloorsOffset(this.currentOffset, currentFloorIndex, this.floorInterval);
      this.currentOffset += offsetStep;
      this._mapSDK._coreMap.redraw();
    }, 10);
  }

  /**
   * 全局更新楼层显隐及视图模式
   * @param {Boolean} explodedView
   */
  _updateFloors(explodedView) {
    this._mapSDK._coreMap._indoorMapApi.engineApi.setExplodedView(explodedView);
    if (explodedView) {
      this._updateFloorView(this.currentFloorId);
    } else {
      this._resetFloorView(this.currentFloorId);
    }

    if (this.status == LOADED) {
      const visitor = explodedView
        ? window.DXChangeFloorWithExplodedViewVisitor?.(this, this.currentFloorId)
        : window.DXChangeFloorVisitor?.(this, this.currentFloorId);
      visitor?.visit();
    }
    this._mapSDK._coreMap.redraw();
    this._mapSDK._coreMap._indoorMapApi.engineApi.forceRedraw();
  }

  _beginUpdateFloorInfos() {}

  /**
   * 完成楼层信息更新并排序
   */
  _endUpdateFloorInfos() {
    this.floorInfos.sort((f1, f2) => (f1.flindex > f2.flindex ? -1 : 1));
  }

  /**
   * 添加楼层元信息
   * @param {Object} floorInfo
   */
  _addFloorInfo(floorInfo) {
    this.floorInfos.push(floorInfo);
    this.floorInfoMap[floorInfo.flid] = floorInfo;
  }

  _getFloorInfos() {
    return this.floorInfos;
  }

  _getFloorInfo(floorId) {
    return this.floorInfoMap[floorId];
  }

  _getFloorInfoByLocationNum(locationNum) {
    return this.floorInfos.find((f) => f.locationNum == locationNum);
  }

  _getFloorInfoByIndexNum(flindex) {
    return this.floorInfos.find((f) => f.flindex == flindex);
  }

  _getFloorInfoByFloorName(floorName) {
    return this.floorInfos.find((f) => f.floorName == floorName);
  }

  _getCurrentFloorInfo() {
    return this.floorInfoMap[this.currentFloorId];
  }

  _getCurrentFloorId() {
    return this.currentFloorId;
  }

  showPoiLayer(floorId) {
    this._visitor("DXMapBoxPoiLayer", floorId, true);
  }

  hidePoiLayer(floorId) {
    this._visitor("DXMapBoxPoiLayer", floorId, false);
  }

  /**
   * 节点遍历器，控制显隐
   * @param {String} type
   * @param {String} floorId
   * @param {Boolean} visible
   */
  _visitor(type, floorId, visible) {
    const visit = (nodes, type, floorId, visible) => {
      nodes.forEach((node) => {
        const nodeType = node.rtti;
        if (nodeType == "DXSceneFloorObject") {
          const matchesFloor = floorId ? node.floorId == floorId : true;
          visit(node.childNodes, type, floorId, visible && matchesFloor);
        } else if ((nodeType == type || !type) && node.type == "inner") {
          node.visible = visible;
          node.checkFloor?.();
        }
      });
    };
    visit(this.childNodes, type, floorId, visible);
  }
}

// 扩展原型属性和方法
const proto = DXIndoorMapScene.prototype;
daximap.defineProperties(proto, {
  /** @type {Boolean} 室内场景可见性 */
  visible: {
    get: function () {
      return this._visible;
    },
    set: function (val) {
      this._visible = val;
      this._mapSDK._coreMap._indoorMapApi.engineApi.setIndoorSceneVisible(this.id, val);
      this.children.forEach((node) => {
        node.visible = this.currentFloorId == node._floorId && val;
      });
    },
  },
});

// 暴露公共接口
Object.assign(proto, {
  setMapStyle: proto._setMapStyle,
  changeFloor: proto._changeFloor,
  updateFloors: proto._updateFloors,
  getFloorInfos: proto._getFloorInfos,
  getFloorInfo: proto._getFloorInfo,
  getFloorInfoByLocationNum: proto._getFloorInfoByLocationNum,
  getFloorInfoByIndexNum: proto._getFloorInfoByIndexNum,
  getFloorInfoByFloorName: proto._getFloorInfoByFloorName,
  getCurrentFloorInfo: proto._getCurrentFloorInfo,
  getCurrentFloorId: proto._getCurrentFloorId,
});

// 导出室内场景类
export { DXIndoorMapScene };

// 同时挂载到 window.DaxiMap 以保持向后兼容
if (typeof window !== "undefined") {
  window.DaxiMap = window.DaxiMap || {};
  window.DaxiMap.DXIndoorMapScene = DXIndoorMapScene;
}
