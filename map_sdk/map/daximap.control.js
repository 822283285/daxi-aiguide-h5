(function (global) {
  const daximap = (window.DaxiMap = window.DaxiMap || {});
  const DXMapUtils = daximap.DXMapUtils;
  const EventHandlerManager = daximap.EventHandlerManager;

  /**
   * 获取当前环境的最佳点击事件名称
   * @returns {string} 'touchend' 或 'click'
   */
  const getBestEventName = () => ("ontouchstart" in window ? "touchend" : "click");

  /**
   * 根据配置项生成样式字符串
   * @param {Object} options 配置项
   * @param {string} [baseStyle=''] 基础样式
   * @returns {string} 拼接后的样式字符串
   */
  const generateStyleStr = (options, baseStyle = "") => {
    let styleStr = baseStyle;
    const { width, height, styleObj, style } = options;

    if (style) styleStr += (styleStr && !styleStr.endsWith(";") ? ";" : "") + style;

    let w = width;
    let h = height;
    if (typeof w === "number") w = `${w}px`;
    if (typeof h === "number") h = `${h}px`;

    if (w) styleStr += (styleStr && !styleStr.endsWith(";") ? ";" : "") + `width:${w}`;
    if (h) styleStr += (styleStr && !styleStr.endsWith(";") ? ";" : "") + `height:${h}`;

    if (styleObj) {
      for (const key in styleObj) {
        styleStr += (styleStr && !styleStr.endsWith(";") ? ";" : "") + `${key}:${styleObj[key]}`;
      }
    }
    return styleStr;
  };

  const inputStyle =
    "-webkit-border-radius: 0px;-moz-border-radius: 0px;-ms-border-radius: 0px;-o-border-radius: 0px;border-radius: 0px;background: none;outline: none;border: 0px;outline-style: none;outline-width: 0px;border: none;border-style: none;text-shadow: none;-webkit-appearance: none;-webkit-user-select: text;outline-color: transparent;box-shadow: none;";

  /**
   * 搜索视图组件
   * @constructor
   * @param {Object} options 配置项
   */
  function SearchView(options) {
    this.token = options.token || "";
    this.url = options.url || "https://map1a.daxicn.com/search2/search-query-v6/user/s";
    this.request = DXMapUtils.getHttpObject();
    if (options.map) this.map = options.map;
    this.markerLayers = [];
    this.onMarkerClick = (e) => {
      console.log(e);
    };
    /** 将标记按建筑和楼层分组 */
    this._groupMarkers = (markers) => {
      const mapData = {};
      for (const markerInfo of markers) {
        const bdid = markerInfo.bdid || "outdoor";
        const floorId = markerInfo.floorId || "";
        const key = `${bdid}${floorId}`;
        if (!mapData[key]) {
          mapData[key] = { bdid, floorId, data: [] };
        }
        mapData[key].data.push(markerInfo);
      }
      return mapData;
    };

    /**
     * 添加标记图层
     * @param {string} bdid 建筑ID
     * @param {Array} markers 标记数据
     */
    this.addMarkerLayer = function (bdid, markers) {
      const mapData = this._groupMarkers(markers);
      for (const key in mapData) {
        const item = mapData[key];
        const { bdid: itemBdid, floorId, data } = item;
        const markerLayer = new daximap.DXSceneMarkerLayer();
        markerLayer.initialize(this.map, {
          markers: data,
          bdid: itemBdid,
          floorId: floorId,
          onClick: this.onMarkerClick,
        });
        markerLayer.id = `marker${DXMapUtils.createUUID()}`;
        markerLayer.addToMap();
        this.markerLayers.push(markerLayer);
      }
    };
    /** 移除标记图层 */
    this.removeMarkerLayer = function () {
      this.markerLayers?.forEach((markerLayer) => {
        markerLayer.removeFromMap();
      });
      this.markerLayers = [];
    };

    /** 格式化距离显示 */
    this._formatDistance = (distance) => {
      if (!distance) return "";
      let disValue = typeof distance === "object" ? distance.distance : distance;
      disValue = parseInt(disValue);
      if (isNaN(disValue)) return "";

      const lang = window.langData || {};
      return disValue > 1000 ? `${(disValue / 1000).toFixed(1)}${lang.kilometre || "公里"}` : `${disValue}${lang["meter:distance"] || "米"}`;
    };

    /**
     * 渲染搜索结果列表与标记
     * @param {string} bdid 建筑ID
     * @param {Array} dataArr 搜索结果数据
     * @returns {HTMLElement} 生成的 DOM 元素
     */
    this.renderResult = function (bdid, dataArr) {
      const domBody = document.body;
      const existingWrapper = document.getElementById("searchWrapper");
      if (existingWrapper) {
        domBody.removeChild(existingWrapper);
      }

      const contentObj = [
        {
          tagName: "p",
          text: "结果列表",
          attrs: {
            class: "searchTilte",
            style: "line-height:2;text-align:center",
          },
          events: [
            {
              eventName: "click",
              callback: (event) => {
                // 处理列表收起展开逻辑
                const parentClassList = event.target.parentElement.classList;
                const searchResultList = event.target.parentElement.getElementsByClassName("searchResultList")[0];
                parentClassList.toggle("hideList");
                if (parentClassList.value.indexOf("hideList") != -1) {
                  searchResultList.style.display = "none";
                } else {
                  searchResultList.style.display = "";
                }
              },
            },
          ],
          children: [
            {
              tagName: "span",
              attrs: {
                style:
                  "content: '';width: 16px;height: 12px;background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAqCAMAAAD/A0kuAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAABFUExURUxpcZycnJubm5ycnJubm5ubm5ycnK2trZubm56enp2dnZubm6CgoJ2dnZycnJycnJycnJycnJycnJ2dnZycnJubm5ubm01lFsUAAAAWdFJOUwCziEvC8+oJ+ic+4BltYnlYl6cxnsznLS44AAAAzElEQVQ4y+2TWxKDIAxFQUFA8Ane/S+1QltbldcCzA+QOcNAkkNILASpDuGkdJW8YNiDVdGCQiulQWtoik4RojrQMruis361HdYSu4Db985yLHm2Ae+/+56jybOy/Z1amaOnExvoKcUOwHzOzMAQZ0dgrMmFW2TslgFyvmdT77v+I9Qp+fO9Qv2FzXRg+av9p1suXVF3dNWHKszBGmbrYPPzKOhBG12c9N0HbVKsSNEMmyg7KDYwbwYzNQ4aRh8HHwcfB0kdfXcwSnsHX1BLEYFdfN5KAAAAAElFTkSuQmCC);background-repeat: no-repeat;display: inline-block;background-size: contain;vertical-align: baseline;margin-left: 14px;transform: rotateX(180deg);",
              },
            },
          ],
        },
        {
          tagName: "ul",
          attrs: {
            class: "searchResultList",
            style: "max-height: 40vh;padding: 0px 10px;overflow: scroll;",
          },
          children: [],
        },
      ];

      const wrapper = {
        tagName: "div",
        attrs: {
          class: "searchWrapper",
          id: "searchWrapper",
          style: "position:absolute;left:0px;right:0px;bottom:0px;background:rgb(255,255,255);z-index: 999;",
        },
        children: [
          {
            tagName: "div",
            attrs: {
              class: "searchContainer",
              style: "padding:10px",
            },
            children: contentObj,
          },
        ],
      };

      this.map?.removeAllMarker();

      const markers = [];

      dataArr.forEach((item) => {
        if (this.map) {
          // 构造地图标记点数据
          markers.push({
            featureId: item.poiId,
            id: item.poiId,
            bdid: item.bdid,
            lon: item.lon,
            lat: item.lat,
            floorId: item.floorId,
            imageUrl: "blue_dot",
            highlightImageUrl: "red_dot",
            scale: 0.5,
            onClick: this.onMarkerClick,
          });
        }

        const dis = this._formatDistance(item.distance);
        contentObj[1].children.push({
          tagName: "li",
          attrs: {
            class: "item icon-mypos",
            "data-bdid": item.bdid,
            "data-poiid": item.poiId,
            "data-floorid": item.floorId,
            "data-lon": item.lon,
            "data-lat": item.lat,
            style: "color:#0771ce;font-size: 14px;border: 1px solid #198fec;border-radius: 8px;padding: 2px 8px;margin: 2px 0px;",
          },
          children: [
            {
              tagName: "p",
              attrs: {
                class: "",
                style: "color:#4c4b4b;display: inline-block;vertical-align: middle;padding-left: 6px",
              },
              children: [
                {
                  tagName: "span",
                  text: item.text,
                  attrs: {
                    class: "item_name",
                    style: "line-height:1.5;display:block",
                  },
                },
                {
                  tagName: "span",
                  text: item.address,
                  attrs: {
                    class: "item_desc",
                    style: "font-size:0.8em;line-height:1.5;display:block",
                  },
                  children: [
                    {
                      tagName: "span",
                      text: dis,
                      attrs: {
                        style: "padding-left:6px;",
                      },
                    },
                  ],
                },
              ],
            },
          ],
          events: [
            {
              eventName: "click",
              callback: (event) => {
                const domTarget = event.currentTarget;
                const data = {
                  bdid: domTarget.getAttribute("data-bdid") || "",
                  floorId: domTarget.getAttribute("data-floorid") || "",
                  lon: domTarget.getAttribute("data-lon") || "",
                  lat: domTarget.getAttribute("data-lat") || "",
                  text: domTarget.getAttribute("data-text") || "",
                  id: domTarget.getAttribute("data-poiid") || "",
                };

                if (this.map) {
                  // 点击列表项，地图跳转并高亮标记
                  this.map.easeTo(data);
                  DXHighlightMarkerVisitor(this.map._coreMap._scene, data.id).visit().highlightMarker;
                }
              },
            },
          ],
        });
      });

      if (dataArr.length == 0) {
        contentObj[1] = {
          tagName: "p",
          text: "没有查到搜索结果",
          attrs: {
            class: "search_empty",
          },
        };
        this.removeMarkerLayer();
      } else {
        this.removeMarkerLayer();
        this.addMarkerLayer(bdid, markers);
      }

      return DXMapUtils.domUtil.createDom(wrapper, domBody);
    };
    /** 显示搜索结果 */
    this.showSearchResult = function (params) {
      params.onSuccess = params.onSuccess || this.renderResult;
      params.onFailed =
        params.onFailed ||
        (() => {
          this.renderResult(params.buildingId || "", []);
        });

      if (params.keyword) {
        this._query(params);
      } else {
        this._queryAround(params);
      }
    };

    /** 关键字搜索 */
    this._query = function (params) {
      const {
        token = this.token,
        keyword,
        poiIds,
        featureIds,
        buildingId,
        floorId,
        x,
        y,
        dataType,
        count = 50,
        isAsync = true,
        onSuccess,
        onFailed,
        onTimeOut,
      } = params;

      if (!params || (!keyword && !poiIds)) {
        return { code: -1, errMsg: "搜索参数不能为空", ret: false };
      }

      const queryData = { token };
      if (featureIds) queryData.ids = featureIds;
      if (keyword) queryData.text = keyword;
      if (buildingId) queryData.bdid = buildingId;
      if (floorId) queryData.flid = floorId;
      if (x && y) queryData.location = `${x},${y}`;
      if (dataType) queryData.dataType = dataType;
      queryData.ct = count;

      return this._sendQuery(queryData, isAsync, onSuccess, onFailed, onTimeOut);
    };
    /** 周边搜索 */
    this._queryAround = function (params) {
      const { token = this.token, x, y, radius, buildingId, floorId, dataType, count = 50, isAsync = true, onSuccess, onFailed, onTimeOut } = params;

      if (!params || !x || !y) {
        return { code: -1, errMsg: "搜索x,y不能为空", ret: false };
      }

      const queryData = {
        token,
        location: `${x},${y}`,
        ct: count,
      };

      if (buildingId) queryData.bdid = buildingId;
      if (floorId) queryData.flid = floorId;
      if (dataType) queryData.dataType = dataType;

      const finalRadius = radius || (buildingId ? 50 : 10000);
      queryData.geo = { type: "Circle", radius: finalRadius };

      return this._sendQuery(queryData, isAsync, onSuccess, onFailed, onTimeOut);
    };

    /** 发送搜索请求 */
    this._sendQuery = function (queryData, isAsync, successFn, failedFn, timeoutFn) {
      const { request } = this;
      request.abort();
      request.responseType = "json";
      request.timeout = 150000;
      request.ontimeout = () => {
        if (timeoutFn) {
          timeoutFn();
        } else if (failedFn) {
          failedFn({ ret: "ERROR", code: -1, errMsg: "timeout" });
        }
      };
      request.onreadystatechange = () => {
        if (request.readyState === 4) {
          if (request.status === 0) {
            failedFn && failedFn("请求异常");
            return;
          }
          if (request.status !== 0 && request.status !== 200 && request.status !== 304) {
            failedFn && failedFn(request.response || request.responseText);
          } else {
            successFn && successFn(request.response || request.responseText);
          }
        }
      };
      request.open("POST", this.url, isAsync);
      request.setRequestHeader("Content-Type", "application/json");
      request.send(JSON.stringify(queryData));
      if (isAsync === false) {
        return request.response || request.responseText;
      }
    };

    this.cancel = () => {
      this.request.abort();
    };

    this.query = function (options) {
      if (options.keyword || options.featureIds) {
        this._query(options);
      } else {
        this._queryAround(options);
      }
    };
  }

  /** 创建搜索视图组件 */
  function createSearchView(options) {
    const { parentNode = document.body, map, outType: outerSearchType = 11, token = "" } = options;
    const searchInstance = new SearchView(options);

    const headerParams = {
      tagName: "div",
      attrs: {
        class: "search_header_component",
        id: "searchHeaderComponent",
        style: "position:absolute;top:10px;left:10px;right:10px; z-index: 10;",
      },
      children: [
        {
          tagName: "p",
          attrs: {
            class: "search_header",
            style: "height:36px;background:#fff;border-radius: 4px;display: flex;padding: 6px;align-items: center;",
          },
          children: [
            {
              tagName: "input",
              attrs: {
                class: "search_input",
                id: "searchInput",
                placeholder: "请输入要查询的内容",
                style: `${inputStyle}border-right: 1px solid rgb(181, 181, 181);flex-grow:1;padding-left: 10px;font-size: 16px;text-align:center;`,
              },
            },
            {
              tagName: "span",
              attrs: {
                class: "search-icon icon-search1",
                style: "width: 12%;height: 100%;text-align: center;font-size: 22px;width: 12%;display: flex;justify-content: center;align-items: center;",
              },
              events: [
                {
                  eventName: "click",
                  callback: () => {
                    const val = document.getElementById("searchInput")?.value.trim();
                    if (!val) {
                      DaxiMapControl.domUtil.dialogWithModal("搜索内容不能为空");
                      return;
                    }

                    const buildingInfo = map.getCurrentBuilding();
                    const bdid = buildingInfo?.bdid || "";
                    const floorId = buildingInfo?.currentFloorId || "";
                    const pos = map._coreMap._indoorMapApi.getCameraPose();
                    const loadingObj = DaxiMapControl.domUtil.createLoading();
                    const dataType = bdid ? 1 : outerSearchType;

                    searchInstance.showSearchResult({
                      token,
                      keyword: val,
                      dataType,
                      buildingId: bdid,
                      x: pos.lng,
                      y: pos.lat,
                      floorId,
                      onSuccess: (dataArr) => {
                        loadingObj.remove();
                        searchInstance.renderResult(bdid, dataArr);
                      },
                      onFailed: () => {
                        loadingObj.remove();
                        searchInstance.renderResult(bdid, []);
                      },
                    });
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    DXMapUtils.domUtil.createDom(headerParams, parentNode);
    return searchInstance;
  }

  /** 创建全景视图组件 */
  function createPano(options) {
    const that = {};
    const panoBaseUrl = options?.panoPath || "../../../pano/index.html";
    const targetDomain = panoBaseUrl;
    that.targetDomain = targetDomain;

    createCrossDomainBridge(window);
    const cross = window.Cross;
    cross.init(ifw, targetDomain);
    const panoServer = options?.panoUrl;

    if (!document.getElementById("iframepano")) {
      const params = {
        tagName: "iframe",
        attrs: {
          class: "mappano",
          style: "position:absolute;top:0px;left:0px;width:100vw;height:100vh;",
          id: "iframepano",
        },
      };
      DXMapUtils.domUtil.createDom(params, document.body);
    }

    /** 显示全景图 */
    that.showPano = (floorId, poiId, data) => {
      if (!floorId || !poiId || !data) {
        return { message: "请传入正确参数" };
      }
      const panoDom = document.getElementById("iframepano");
      if (panoDom) {
        panoDom.style.visibility = "visible";
        panoDom.style.display = "block";
      }
      cross.call("loadPano", { server: panoServer, currFloor: floorId, id: poiId, poiInfo: data });
    };
    return that;
  }

  const dxMapControl = (window.DaxiMapControl = window.DaxiMapControl || {});
  dxMapControl.createSearchView = createSearchView;
  dxMapControl.createPano = createPano;
  dxMapControl.domUtil = DXMapUtils.domUtil;

  /** 创建室内路径规划图层 */
  dxMapControl.createIndoorRoute = (map, routeData) => {
    const routeOverlay = new daximap.DXIndoorRouteOverlay();
    routeOverlay.initialize(map, routeData);
    routeOverlay.addToMap();
    return routeOverlay;
  };

  /**
   * 控件基类
   * @class
   */
  class DXControlBase {
    /**
     * @constructor
     * @param {Object} [map={}] 地图对象
     */
    constructor(map = {}) {
      this.map = map;
      this._coreMap = map._coreMap;
      this._type = "DXControlBase";
      this._isVisible = true;
      this._dom = null;
      this._position = [16, 16];
      this._anchor = "TopLeft";
      this.data = {};
      this._eventMgr = new EventHandlerManager();
    }

    setPrimaryX(x) {
      this.primaryX = x;
    }
    setPrimaryY(y) {
      this.primaryY = y;
    }
    getPrimaryX() {
      return this.primaryX || 0;
    }
    getPrimaryY() {
      return this.primaryY || 0;
    }
    getHeight() {
      return this._dom?.offsetHeight || 0;
    }
    getTop() {
      return this._dom?.offsetTop || 0;
    }

    /**
     * 设置控件参数
     * @param {Object} options 参数项
     */
    setParams(options) {
      if (options.anchor) {
        this._anchor = options.anchor;
      }
      if (options.pos) {
        const { x, y } = options.pos;
        if (x !== undefined) this._position[0] = x;
        if (y !== undefined) this._position[1] = y;
      }

      const style = this._dom?.style;
      if (style) {
        if (!style.position) style.position = "absolute";
        if (options.visible === false || this._isVisible === false) {
          style.display = "none";
        }
        this._updateDomParams();
      }
    }

    /**
     * 更新 DOM 位置和锚点样式
     * @private
     */
    _updateDomParams() {
      const dom = this._dom;
      if (!dom) return;

      const style = dom.style;
      style.left = style.right = style.top = style.bottom = "";

      const [x, y] = this._position;
      const xPx = `${x}px`;
      const yPx = `${y}px`;

      switch (this._anchor) {
        case "TopLeft":
          style.left = xPx;
          style.top = yPx;
          break;
        case "TopRight":
          style.right = xPx;
          style.top = yPx;
          break;
        case "BottomLeft":
          style.left = xPx;
          style.bottom = yPx;
          break;
        case "BottomRight":
          style.right = xPx;
          style.bottom = yPx;
          break;
      }
    }

    getPosition() {
      return this._position;
    }

    /**
     * 设置控件位置
     * @param {number} x X坐标(px)
     * @param {number} y Y坐标(px)
     */
    setPosition(x, y) {
      this._position = [x, y];
      this._updateDomParams();
    }

    getAnchor() {
      return this._anchor;
    }

    /**
     * 设置控件锚点
     * @param {string} anchor 锚点位置 (TopLeft/TopRight/BottomLeft/BottomRight)
     */
    setAnchor(anchor) {
      this._anchor = anchor;
      this._updateDomParams();
    }

    getVisible() {
      return this._isVisible;
    }

    /** @private */
    _setVisible(visible) {
      if (visible == this._isVisible) return;
      if (this._dom) {
        this._dom.style.display = visible ? "" : "none";
      }
      this._isVisible = visible;
    }

    /**
     * 设置显示状态
     * @param {boolean} visible
     */
    setVisible(visible) {
      this._setVisible(visible);
    }

    addClass(className) {
      this._dom?.classList.add(className);
    }

    removeClass(className) {
      this._dom?.classList.remove(className);
    }

    /**
     * 绑定事件监听器
     * @param {string} type 事件类型
     * @param {function} fn 回调函数
     */
    on(type, fn) {
      this._eventMgr.on(type, fn);
    }

    /**
     * 绑定一次性事件监听器
     * @param {string} type 事件类型
     * @param {function} fn 回调函数
     */
    once(type, fn) {
      this._eventMgr.once(type, fn);
    }

    /**
     * 移除事件监听器
     * @param {string} type 事件类型
     * @param {function} fn 回调函数
     */
    off(type, fn) {
      this._eventMgr.off(type, fn);
    }

    /**
     * 触发事件
     * @param {string} type 事件类型
     * @param {*} data 传递数据
     */
    fire(type, data) {
      this._eventMgr.fire(type, data);
    }

    /**
     * 触发事件(无数据)
     * @param {string} type 事件类型
     */
    trigger(type) {
      this._eventMgr.fire(type);
    }

    /**
     * 存储自定义数据
     * @param {string} key
     * @param {*} value
     */
    setData(key, value) {
      this.data[key] = value;
    }

    /**
     * 获取自定义数据
     * @param {string} key
     */
    getData(key) {
      return key ? this.data[key] : this.data;
    }
  }

  /**
   * 罗盘控件
   * @class
   * @extends DXControlBase
   */
  class CompassControl extends DXControlBase {
    /**
     * @constructor
     * @param {Object} map 地图对象
     * @param {Object} [options={}] 配置项
     */
    constructor(map, options = {}) {
      super(map);
      this.type = "CompassControl";
      this._heading = 0;
      this._init(options);
    }

    /** @private */
    _init(options) {
      if (this._dom) return;

      const eventName = getBestEventName();
      const assetsPath = options.assetsPath || this.map.config.absAssetsPath;
      let imageUrl = assetsPath ? `${assetsPath}images/compass.png` : "images/compass.png";
      if (options.imageUrl) {
        imageUrl = options.imageUrl;
      }

      const styleStr = generateStyleStr(options);

      const compassParams = {
        tagName: "span",
        attrs: { class: "compass_container", id: "compass_container", style: styleStr },
        children: [
          {
            tagName: "img",
            attrs: { class: "compass", src: imageUrl, style: "width:100%;height:100%" },
          },
        ],
        events: [
          {
            eventName,
            callback: (e) => {
              options.onClick?.();
              e.stopPropagation();
              e.preventDefault();
              return false;
            },
          },
        ],
      };

      this._dom = DXMapUtils.createDom(compassParams, options.parentNode || this.map.container);
      this._coreMap.setRotatedCallBack((heading) => {
        this.setHeading(heading);
        this.fire("headingChanged", heading);
      });

      const heading = this._coreMap.getBearing();
      this._setHeading(heading);

      if (options.anchor !== "auto") {
        const pose = { anchor: "TopLeft", pos: { x: 40, y: 16 } };
        if (options.pos) {
          pose.pos.x = options.pos.x || pose.pos.x;
          pose.pos.y = options.pos.y || pose.pos.y;
        }
        this.setParams(pose);
      }

      if (options.visible !== undefined) {
        this.setVisible(options.visible === true || options.visible === "true");
      }
    }

    /** @private */
    _setHeading(heading) {
      this._heading = heading;
      const domStyle = this._dom.style;
      domStyle.transform = `rotateZ(${Math.round(-heading)}deg)`;
    }

    /** 设置罗盘朝向 */
    setHeading(heading) {
      this._setHeading(heading);
    }
  }

  /**
   * 视图模式控件 (2D/3D 切换)
   * @class
   * @extends DXControlBase
   */
  class ViewModeControl extends DXControlBase {
    /**
     * @constructor
     * @param {Object} map 地图对象
     * @param {Object} [options={}] 配置项
     */
    constructor(map, options = {}) {
      super(map);
      this.type = "ViewModeControl";
      this._heading = 0;
      this._init(options);
      const tilt = this._coreMap.getPitch();
      this._setTilt(tilt);
    }

    /** @private */
    _init(options) {
      if (this._dom) return;

      const eventName = getBestEventName();
      const styleStr = generateStyleStr(options);

      const modesParams = {
        tagName: "div",
        attrs: { id: "mapMode_container", class: "map_mode_container main_btn", style: styleStr },
        children: [
          {
            tagName: "div",
            attrs: { class: "btn_wrapper" },
            children: [
              {
                tagName: "span",
                attrs: { class: "mode_item mode_2d" },
                text: "2D",
                events: [
                  {
                    eventName,
                    callback: (e) => {
                      const tilt = this.map.config.maxCameraTilt;
                      const parentDom = e.target.parentElement.parentElement;
                      const className = parentDom.getAttribute("class");
                      parentDom.setAttribute("class", `${className} active_mode3d`);
                      this._coreMap.setPitch(tilt);
                      options.onClick?.();
                      e.stopPropagation();
                      e.preventDefault();
                      return false;
                    },
                  },
                ],
              },
              {
                tagName: "span",
                attrs: { class: "mode_item mode_3d" },
                text: "3D",
                events: [
                  {
                    eventName,
                    callback: (e) => {
                      if (this._coreMap._mapSDK.getExplodedView()) return;
                      const parentDom = e.target.parentElement.parentElement;
                      const className = parentDom.getAttribute("class").replace(" active_mode3d", "");
                      parentDom.setAttribute("class", className);
                      options.onClick?.();
                      this._coreMap.setPitch(this.map.config.minCameraTilt);
                      e.stopPropagation();
                      e.preventDefault();
                      return false;
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      this._dom = DXMapUtils.createDom(modesParams, options.parentNode || this.map.container);
      this.innertilt = 0;
      this._coreMap.setPitchChangedCallback((tilt) => {
        if (Math.abs(this.innertilt - tilt) < 0.5) return;
        clearTimeout(this.onTiltChangeTimer);
        this.onTiltChangeTimer = setTimeout(
          (t) => {
            this._setTilt(t);
            this.fire("onMapTiltChange", t);
          },
          100,
          tilt,
        );
        this.innertilt = tilt;
      });

      if (options.anchor !== "auto") {
        const pose = { anchor: "BottomRight", pos: { x: 16, y: 100 } };
        if (options.pos) {
          pose.pos.x = options.pos.x || pose.pos.x;
          pose.pos.y = options.pos.y || pose.pos.y;
        }
        this.setParams(pose);
      }

      if (options.visible !== undefined) {
        this.setVisible(options.visible === true || options.visible === "true");
      }
    }

    /** @private */
    _setTilt(tilt) {
      this._tilt = tilt;
      const className = this._dom.getAttribute("class");
      const hasActiveMode3D = className.indexOf("active_mode3d") !== -1;
      if (tilt < 18 && hasActiveMode3D) {
        this._dom.setAttribute("class", className.replace(" active_mode3d", ""));
      } else if (tilt > 18 && !hasActiveMode3D) {
        this._dom.setAttribute("class", `${className} active_mode3d`);
      }
    }
  }

  /**
   * 缩放控件
   * @class
   * @extends DXControlBase
   */
  class ZoomControl extends DXControlBase {
    /**
     * @constructor
     * @param {Object} map 地图对象
     * @param {Object} [options={}] 配置项
     */
    constructor(map, options = {}) {
      super(map);
      this.type = "ZoomControl";
      this._heading = 0;
      this._init(options);
    }

    /** @private */
    _init(options) {
      if (this._dom) return;

      const eventName = getBestEventName();
      const styleStr = generateStyleStr(options);

      const zoomParams = {
        tagName: "div",
        attrs: { class: "main_zoom zoom_wrapper", style: styleStr },
        children: [
          {
            tagName: "div",
            attrs: { class: "main_zoomin zoom_btn", id: "main_zoomin" },
            children: [{ tagName: "span", attrs: { class: "icon-jia" } }],
            events: [
              {
                eventName,
                callback: (e) => {
                  this._coreMap.zoomIn();
                  options.onClick?.();
                  e.stopPropagation();
                  e.preventDefault();
                  return false;
                },
              },
            ],
          },
          {
            tagName: "div",
            attrs: { class: "main_zoomout zoom_btn", id: "main_zoomout" },
            children: [{ tagName: "span", attrs: { class: "icon-jian" } }],
            events: [
              {
                eventName,
                callback: (e) => {
                  this._coreMap.zoomOut();
                  options.onClick?.();
                  e.stopPropagation();
                  e.preventDefault();
                  return false;
                },
              },
            ],
          },
        ],
      };

      this._dom = DXMapUtils.createDom(zoomParams, options.parentNode || this.map.container);
      if (options.anchor !== "auto") {
        const pose = { anchor: options.anchor || "BottomRight", pos: { x: 16, y: 16 } };
        if (options.pos) {
          pose.pos.x = options.pos.x || pose.pos.x;
          pose.pos.y = options.pos.y || pose.pos.y;
        }
        this.setParams(pose);
      }

      if (options.visible !== undefined) {
        this.setVisible(options.visible === true || options.visible === "true");
      }
    }
  }

  /**
   * 楼层切换控件
   * @class
   * @extends DXControlBase
   */
  class FloorControl extends DXControlBase {
    /**
     * @constructor
     * @param {Object} map 地图对象
     * @param {Object} [options={}] 配置项
     */
    constructor(map, options = {}) {
      super(map);
      this.type = "FloorControl";
      this.activeFloorId = null;
      this.clickTimer = null;
      this.dblclicked = false;
      this.clickedCount = 1;
      this.assetsPath = options.assetsPath || "../../map/";
      this._init(options);
    }

    /** @private */
    _init(options) {
      if (this._dom) return;

      const eventName = "click";
      const floorsData = {
        tagName: "ul",
        attrs: { class: "floor_btns_container", id: "floor_btns_container" },
        children: [],
      };
      this.scrollTimer = null;

      const floorsObj = {
        tagName: "div",
        attrs: { class: "main_floor_btnsbar", id: "main_floor_btnsbar", style: "max-height:84px;overflow-y:scroll;" },
        events: [
          {
            eventName: "scroll",
            callback: (e) => {
              if (this.scrollTimer) clearTimeout(this.scrollTimer);
              this.scrollTimer = setTimeout(
                (dom) => {
                  const { scrollTop: top, scrollHeight, clientHeight } = dom;
                  const updateBtnState = (btn, isUp) => {
                    const classNames = btn.className.split(" ");
                    const isDisabled = isUp ? top < 6 : top >= scrollHeight - clientHeight - 6;
                    const index = classNames.indexOf("disabled");
                    if (isDisabled && index === -1) {
                      btn.className += " disabled";
                    } else if (!isDisabled && index !== -1) {
                      classNames.splice(index, 1);
                      btn.className = classNames.join(" ");
                    }
                  };
                  updateBtnState(dom.previousSibling, true);
                  updateBtnState(dom.nextSibling, false);
                },
                10,
                e.target,
              );
              e.stopPropagation();
              e.preventDefault();
              return false;
            },
          },
        ],
        children: [floorsData],
      };

      const styleStr = generateStyleStr(options);

      const floorsParams = {
        tagName: "div",
        attrs: { class: "main_floor_scroll", id: "main_floor_scroll", style: styleStr },
        children: [
          {
            tagName: "span",
            attrs: {
              class: "btn icon-expand",
              id: "scroll_up",
              style: "height:20px;display:block;text-align: center;line-height: 20px;font-size: 16px;background: #f7fcff;padding: 0px;margin: 0px;",
            },
            events: [
              {
                eventName,
                callback: (e) => {
                  if (!e.target.className.includes("disabled")) {
                    const bar = e.target.nextSibling;
                    bar.scrollTo({ top: bar.scrollTop - 32, behavior: "smooth" });
                  }
                },
              },
            ],
          },
          floorsObj,
          {
            tagName: "span",
            attrs: {
              class: "btn icon-collapse",
              id: "scroll_down",
              style: "height:20px;display:block;text-align: center;line-height: 20px;font-size: 16px;background: #f7fcff;padding: 0px;margin: 0px;",
            },
            events: [
              {
                eventName,
                callback: (e) => {
                  if (!e.target.className.includes("disabled")) {
                    const bar = e.target.previousSibling;
                    bar.scrollTo({ top: bar.scrollTop + 32, behavior: "smooth" });
                  }
                  e.stopPropagation();
                  e.preventDefault();
                  return false;
                },
              },
            ],
          },
        ],
      };

      this._dom = DXMapUtils.createDom(floorsParams, options.parentNode || this.map.container);
      if (options.anchor !== "auto") {
        const params = { anchor: options.anchor || "BottomLeft", pos: options.pos || { x: 16, y: 16 } };
        this.setParams(params);
      }

      if (options.visible !== undefined) {
        this.setVisible(options.visible === true || options.visible === "true");
      }

      this.map.on("floorChanged", (sender, data) => {
        if (this.indoormap && data.bdid === this.indoormap.bdid) {
          this.activeFloorById(data.floorId);
        }
      });

      this.map._mapboxMap().on("moveend", () => {
        if (this.indoormap?.bdInfo.showFloorByGeofence) {
          this.checkFloorByGeoFence(this.map.getPosition());
        }
      });
    }

    /**
     * 根据地理围栏检查并显示相应楼层
     * @param {Object} pos 当前位置 {lon, lat}
     */
    checkFloorByGeoFence(pos) {
      const bdInfo = this.indoormap?.bdInfo;
      if (bdInfo?.showFloorByGeofence && bdInfo.floorRegionConfig) {
        for (const data of bdInfo.floorRegionConfig) {
          if (DXMapUtils.naviMath.pointInPolygon([pos.lon, pos.lat], data.polygon)) {
            if (this.currentFloorRegion === data) {
              this._setVisible(true);
              return;
            }
            this.currentFloorRegion = data;
            this.setFloors(data.floors);
            this._setVisible(true);
            return;
          }
        }
        this._setVisible(false);
      }
    }

    /**
     * 设置控件可视化状态
     * @param {boolean} visible
     */
    setVisible(visible) {
      if (visible && this.indoormap?.bdInfo.showFloorByGeofence) {
        this.checkFloorByGeoFence(this.map.getPosition());
      } else {
        this._setVisible(visible);
      }
    }

    /**
     * 更新当前室内图对象
     * @param {Object} indoormap 室内图对象
     */
    updateMap(indoormap) {
      this.activeFloorId = "";
      this.indoormap = indoormap;
      if (indoormap.bdInfo.showFloorByGeofence) {
        this.checkFloorByGeoFence(this.map.getPosition());
      } else {
        this.setFloors(indoormap._getFloorInfos());
      }
    }

    /**
     * 设置楼层列表数据
     * @param {Array} floorsInfo 楼层信息
     */
    setFloors(floorsInfo) {
      const children =
        floorsInfo?.map((data) => ({
          tagName: "li",
          attrs: {
            class: "floor_btn",
            "data-floorid": data.flid,
            "data-floorname": data.flname || "",
            "data-floorcnname": data.cnname || data.floorCnName || "",
            "data-lon": data.lon || "",
            "data-lat": data.lat || "",
            "data-range": data.rect,
          },
          text: data.flname,
          events: [
            {
              eventName: "click",
              callback: (e) => {
                if (this.clickedCount === 1) {
                  this.clickedCount++;
                  clearTimeout(this.clickTimer);
                  this.clickTimer = setTimeout(() => {
                    const target = e.target;
                    const floorId = target.getAttribute("data-floorid");
                    this.activeFloorById(floorId);
                    this.clickTimer = null;
                    this.clickedCount = 1;
                  }, 300);
                } else {
                  clearTimeout(this.clickTimer);
                  this.clickedCount = 1;
                  const floorId = e.target.getAttribute("data-floorid");
                  this.activeFloorById(floorId, true);
                }
                e.stopPropagation();
                e.preventDefault();
                return false;
              },
            },
          ],
        })) || [];

      const floorContainer = this._dom.childNodes[1];
      floorContainer.innerHTML = "";
      DXMapUtils.createDom({ tagName: "ul", attrs: { class: "floor_btns_container" }, children }, floorContainer);

      setTimeout(() => this.activeFloorById(this.indoormap.currentFloorId), 0);
    }

    /**
     * 根据楼层名称激活楼层
     * @param {string} floorName 楼层名称
     */
    activeFloorByName(floorName) {
      const floorId = this._dom.querySelector(`.floor_btn[data-floorname=${floorName}]`)?.dataset.floorid;
      if (floorId) this.activeFloorById(floorId);
    }

    /**
     * 根据楼层ID激活楼层
     * @param {string} floorId 楼层ID
     * @param {boolean} [movePosByRange=false] 是否根据楼层范围移动地图
     */
    activeFloorById(floorId, movePosByRange) {
      if (!this.indoormap || this.activeFloorId === floorId) return;
      this.activeFloorId = floorId;
      this.indoormap._changeFloor(floorId, this.map.config.explodedView);

      this._dom.querySelectorAll(".floor_btn").forEach((item) => {
        const isTarget = item.getAttribute("data-floorid") === floorId;
        item.classList.toggle("active", isTarget);
        if (isTarget) {
          this._dom.childNodes[1].scrollTo({ top: item.offsetTop - item.offsetHeight, behavior: "smooth" });
          if (movePosByRange) {
            const range = item.getAttribute("data-range");
            if (range && range !== "undefined") {
              const arr = range.split(",").map(parseFloat);
              if (arr.length === 4) {
                const bounds = new mapboxgl.LngLatBounds([arr[0], arr[1]], [arr[2], arr[3]]);
                this.map.fitBounds({ bounds, padding: 30 });
              }
            }
          }
        }
      });
    }
  }

  /**
   * 定位按钮控件
   * @class
   * @extends DXControlBase
   */
  class LocationButtonControl extends DXControlBase {
    /**
     * @constructor
     * @param {Object} map 地图对象
     * @param {Object} [options={}] 配置项
     */
    constructor(map, options = {}) {
      super(map);
      this.type = "LocationButtonControl";
      this._userTrackingMode = daximap.UserTrackingMode.Unknown;
      this._isLocationSuccess = false;

      const { LOCATEFAILED } = daximap.LocationState;
      this._init(options);

      if (daximap.defined(options.state)) {
        if (options.state > LOCATEFAILED) {
          this._userTrackingMode = daximap.UserTrackingMode.None;
          this._updateIcon(2); // LOCATION_ICON_LOCATED
        }
      } else {
        this._updateIcon(0); // LOCATION_ICON_UNLOCATE
      }
    }

    /** @private */
    _init(options) {
      if (this._dom) return;

      if (options.onClick) this.on("onClick", options.onClick);

      const eventName = getBestEventName();
      const styleStr = generateStyleStr(options);

      const locateBtnsParams = {
        tagName: "div",
        attrs: { id: "m_location_btn", class: "main_location_btn main_btn", style: styleStr },
        children: [
          {
            tagName: "span",
            attrs: { class: "location-btn icon-locate", id: "locateIcon" },
            events: [
              {
                eventName,
                callback: (e) => {
                  this.fire("onClick", this._state);
                  e.stopPropagation();
                  e.preventDefault();
                  return false;
                },
              },
            ],
          },
        ],
      };

      this._dom = DXMapUtils.createDom(locateBtnsParams, options.parentNode || this.map.container);
      this.btnIcon = document.getElementById("locateIcon");

      if (options.anchor !== "auto") {
        const pose = { anchor: options.anchor || "BottomRight", pos: options.pos || { x: 16, y: 100 } };
        this.setParams(pose);
      }

      if (options.visible !== undefined) {
        this.setVisible(options.visible === true || options.visible === "true");
      }
    }

    /** @private */
    _updateIcon(iconState) {
      const iconMap = {
        [-1]: "icon-failure", // FAILED
        0: "icon-failure", // UNLOCATE
        1: "icon-loading", // LOCATING
        2: "icon-failure", // LOCATED
        3: "icon-located", // FOLLOW
        4: "loc-follow", // FOLLOW_WITH_HEADING
      };
      this.btnIcon?.setAttribute("class", iconMap[iconState] || "");
    }

    /** 定位状态变更处理 */
    onLocationStateChanged(state) {
      const isSuccess = state > 1;
      if (this._isLocationSuccess === isSuccess) return;
      this._isLocationSuccess = isSuccess;
      this.setUserTrackingMode(isSuccess ? daximap.UserTrackingMode.FollowWithHeading : daximap.UserTrackingMode.None);
    }

    getUserTrackingMode() {
      return this._userTrackingMode;
    }

    /** 切换用户追踪模式 */
    changeUserTrackingMode() {
      const { None, Follow, FollowWithHeading } = daximap.UserTrackingMode;
      const nextMode = this._userTrackingMode === None ? Follow : this._userTrackingMode === Follow ? FollowWithHeading : Follow;
      this.setUserTrackingMode(nextMode);
    }

    /** 设置用户追踪模式 */
    setUserTrackingMode(mode) {
      this._userTrackingMode = mode;
      this._updateUI();
      this.fire("onUserTrackingModeChanged", this._userTrackingMode);
    }

    /** @private */
    _updateUI() {
      const { Unknown, None, Follow, FollowWithHeading } = daximap.UserTrackingMode;
      const stateMap = { [Unknown]: -1, [None]: 2, [Follow]: 3, [FollowWithHeading]: 4 };
      this._updateIcon(stateMap[this._userTrackingMode]);
    }

    /** 更新图标显示 */
    updateIcon(iconState) {
      this._updateIcon(iconState);
    }
  }

  /**
   * 图片按钮控件
   * @class
   * @extends DXControlBase
   */
  class ImageButtonControl extends DXControlBase {
    /**
     * @constructor
     * @param {HTMLElement|Object} container 容器元素或地图对象
     * @param {Object} [options={}] 配置项
     */
    constructor(container, options = {}) {
      super(container);
      this.type = "ImageButtonControl";
      this._id = options.id || `ibc_${DXMapUtils.createUUID()}`;
      this._imageUrl = options.imageUrl || "";
      this._init(container, options);
    }

    /** @private */
    _init(container, options) {
      if (this._dom) return;

      const eventName = getBestEventName();
      const anchor = options.anchor || "TopLeft";
      const styleStr = generateStyleStr(options);

      const childStyle = options.childStyle || "";
      const compassParams = {
        tagName: "span",
        attrs: { class: "image_button_control", id: this._id, style: styleStr },
        children: [
          {
            tagName: "img",
            attrs: { id: `${this._id}_image`, src: this._imageUrl, style: `width:100%;height:100%;${childStyle}` },
          },
        ],
        events: [
          {
            eventName,
            callback: (e) => {
              options.onClick?.();
              e.stopPropagation();
              e.preventDefault();
              return false;
            },
          },
        ],
      };

      this._dom = DXMapUtils.createDom(compassParams, options.parentNode || container);
      if (anchor !== "auto") {
        const pose = { anchor, pos: options.pos || { x: 40, y: 16 } };
        this.setParams(pose);
      }

      if (options.visible !== undefined) {
        this.setVisible(options.visible === true || options.visible === "true");
      }
    }

    /** 设置图片URL */
    setImageUrl(url) {
      if (this._imageUrl !== url) {
        const dxImageImg = document.getElementById(`${this._id}_image`);
        if (dxImageImg) dxImageImg.src = url;
        this._imageUrl = url;
      }
    }

    /** 设置背景色 */
    setBackground(color = "#fff") {
      if (this._dom) this._dom.style.backgroundColor = color;
    }
  }

  /**
   * 图标按钮控件
   * @class
   * @extends DXControlBase
   */
  class IconButtonControl extends DXControlBase {
    /**
     * @constructor
     * @param {HTMLElement|Object} container 容器元素或地图对象
     * @param {Object} [options={}] 配置项
     */
    constructor(container, options = {}) {
      super(container);
      this.type = "IconButtonControl";
      this._icon = options.iconName || "";
      this._id = options.id || `ibc_${DXMapUtils.createUUID()}`;
      this._init(container, options);
    }

    /** @private */
    _init(container, options) {
      if (this._dom) return;

      const eventName = getBestEventName();
      const anchor = options.anchor || "TopLeft";
      const styleStr = generateStyleStr(options);

      const params = {
        tagName: "span",
        attrs: { class: `icon_button_control ${this._icon}`, id: this._id, style: styleStr },
        events: [
          {
            eventName,
            callback: (e) => {
              options.onClick?.();
              e.stopPropagation();
              e.preventDefault();
              return false;
            },
          },
        ],
      };

      this._dom = DXMapUtils.createDom(params, options.parentNode || container);

      const pose = { anchor, pos: options.pos || { x: 40, y: 16 } };
      this.setParams(pose);

      if (options.visible !== undefined) {
        this.setVisible(options.visible === true || options.visible === "true");
      }
    }

    /** 设置图标URL (兼容旧接口) */
    setImageUrl(url) {
      const dxImageImg = document.getElementById(`${this._id}_image`);
      if (dxImageImg) dxImageImg.src = url;
    }

    /** 设置背景颜色 */
    setBackground(color = "#fff") {
      if (this._dom) this._dom.style.backgroundColor = color;
    }

    /** 更新图标样式名 */
    updateIcon(icon) {
      this._dom?.setAttribute("class", `icon_button_control ${icon}`);
      this._icon = icon;
    }
  }

  /**
   * 按钮控件
   * @class
   * @extends DXControlBase
   */
  class ButtonControl extends DXControlBase {
    /**
     * @constructor
     * @param {HTMLElement|Object} container 容器元素或地图对象
     * @param {Object} [options={}] 配置项
     * @param {*} content 内容(暂未直接使用)
     */
    constructor(container, options = {}, content) {
      super(container);
      this.type = "ButtonControl";
      this._init(container, options);
    }

    /** @private */
    _init(container, options) {
      if (this._dom) return;

      if (options.onClick) this.on("onClick", options.onClick);

      const eventName = getBestEventName();
      const styleStr = generateStyleStr(options);
      const btnSpanStyle = options.contentStyle || "";

      const btnsParams = {
        tagName: "div",
        attrs: { class: "main_btn", style: styleStr },
        children: [
          {
            tagName: "span",
            attrs: { class: "btn_content", style: btnSpanStyle },
            events: [
              {
                eventName,
                callback: (e) => {
                  this.fire("onClick", this._state);
                  e.stopPropagation();
                  e.preventDefault();
                  return false;
                },
              },
            ],
          },
        ],
      };

      this._dom = DXMapUtils.createDom(btnsParams, options.parentNode || container);

      if (options.anchor !== "auto") {
        const pose = { anchor: options.anchor || "TopRight", pos: options.pos || { x: 16, y: 100 } };
        this.setParams(pose);
      }

      if (options.visible !== undefined) {
        this.setVisible(options.visible === true || options.visible === "true");
      }
    }

    /** 设置按钮尺寸 */
    setBtnBox(width, height) {
      const btncontent = this._dom.querySelector(".btn_content");
      if (btncontent) {
        btncontent.style.width = width;
        btncontent.style.height = height;
      }
    }

    /** 设置图标样式名 */
    setIconName(icon) {
      const btncontent = this._dom.querySelector(".btn_content");
      if (!btncontent) return;
      const classNames = btncontent.className.split(" ");
      if (!classNames.includes(icon)) {
        btncontent.className += ` ${icon}`;
      }
      btncontent.style.boxSizing = "border-box";
      if (!btncontent.style.width || btncontent.style.width === "auto") btncontent.style.width = "34px";
      if (!btncontent.style.height || btncontent.style.height === "auto") btncontent.style.height = "34px";
    }

    /** 设置按钮背景图 */
    setImageUrl(url, width = "24px", height = "24px") {
      const btncontent = this._dom.querySelector(".btn_content");
      if (!btncontent) return;
      Object.assign(btncontent.style, {
        backgroundImage: `url("${url}")`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        boxSizing: "border-box",
        width: btncontent.style.width && btncontent.style.width !== "auto" ? btncontent.style.width : width,
        height: btncontent.style.height && btncontent.style.height !== "auto" ? btncontent.style.height : height,
      });
    }

    /** 更新按钮文字内容 */
    updateText(text) {
      const btncontent = this._dom.querySelector(".btn_content");
      if (btncontent) {
        btncontent.textContent = text;
        btncontent.style.lineHeight = 1.5;
      }
    }

    /** 设置子元素HTML */
    setChild(str) {
      const btncontent = this._dom.querySelector(".btn_content");
      if (btncontent) btncontent.innerHTML = str;
    }
  }

  /**
   * 组件包装器
   * @class
   * @extends DXControlBase
   */
  class ComponentsWrapper extends DXControlBase {
    /**
     * @constructor
     * @param {HTMLElement} parentDom 父容器
     * @param {Object} [options={}] 配置项
     */
    constructor(parentDom, options = {}) {
      super(parentDom);
      this.type = "ComponentsWrapper";

      const styleStr = generateStyleStr(options);

      this._dom = DXMapUtils.createDom(
        {
          tagName: "div",
          attrs: { class: "dx_component_wrapper", style: styleStr },
          children: [],
        },
        parentDom,
      );

      if (options.anchor !== "auto") {
        const params = { anchor: options.anchor || "BottomLeft", pos: options.pos || { x: 16, y: 16 } };
        this.setParams(params);
      }

      if (options.visible !== undefined) {
        this.setVisible(options.visible === true || options.visible === "true");
      }
    }

    getDom() {
      return this._dom;
    }

    appendChild(childNode) {
      this._dom?.appendChild(childNode);
    }

    removeChild(childNode) {
      this._dom?.removeChild(childNode);
    }

    appendChilds(childNodes) {
      childNodes.forEach((childNode) => this._dom?.appendChild(childNode));
    }

    /** 设置 DOM 样式 */
    setStyle(styleMap) {
      if (!this._dom) return;
      for (const key in styleMap) {
        if (styleMap[key]) this._dom.style[key] = styleMap[key];
      }
    }
  }

  /**
   * 图层切换控件
   * @class
   * @extends DXControlBase
   */
  class LayerSwitchControl extends DXControlBase {
    /**
     * @constructor
     * @param {Object} map 地图对象
     * @param {Object} [options={}] 配置项
     */
    constructor(map, options = {}) {
      super(map);
      this.type = "LayerSwitchControl";
      this._currentLayer = options.defaultLayer || "hand"; // hand/skylight/road/satellite
      this._layers = {};
      this._init(options);
    }

    /** @private */
    _init(options) {
      if (this._dom) return;

      const eventName = getBestEventName();
      const styleStr = generateStyleStr(options);

      // 图层配置
      this._layerConfig = {
        hand: {
          name: "手绘",
          icon: "icon-huabi",
          activeIcon: "icon-huabi",
        },
        road: {
          name: "道路",
          icon: "icon-road",
          activeIcon: "icon-road",
        },
        satellite: {
          name: "卫星",
          icon: "icon-weixing",
          activeIcon: "icon-weixing",
        },
        hybrid: {
          name: "混合",
          icon: "icon-hunhe",
          activeIcon: "icon-hunhe",
        },
      };

      // 生成图层按钮
      const layerButtons = Object.keys(this._layerConfig).map((key) => {
        const config = this._layerConfig[key];
        return {
          tagName: "div",
          attrs: {
            class: `layer_item ${key === this._currentLayer ? "active" : ""}`,
            "data-layer": key,
            title: config.name,
          },
          children: [
            {
              tagName: "span",
              attrs: { class: `layer_icon ${config.icon}` },
            },
          ],
        };
      });

      const layerControlParams = {
        tagName: "div",
        attrs: { id: "layer_switch_control", class: "layer_switch_control", style: styleStr },
        children: [
          {
            tagName: "div",
            attrs: { class: "layer_items" },
            children: layerButtons,
          },
        ],
        events: [
          {
            eventName,
            callback: (e) => {
              const target = e.target.closest(".layer_item");
              if (target) {
                const layer = target.getAttribute("data-layer");
                if (layer) {
                  this.switchLayer(layer);
                }
              }
              options.onClick?.(e);
              e.stopPropagation();
              e.preventDefault();
              return false;
            },
          },
        ],
      };

      this._dom = DXMapUtils.createDom(layerControlParams, options.parentNode || this.map.container);

      if (options.anchor !== "auto") {
        const pose = {
          anchor: options.anchor || "TopRight",
          pos: options.pos || { x: 16, y: 100 },
        };
        this.setParams(pose);
      }

      if (options.visible !== undefined) {
        this.setVisible(options.visible === true || options.visible === "true");
      }
    }

    /**
     * 切换图层
     * @param {string} layerType 图层类型: hand/road/satellite/hybrid
     */
    switchLayer(layerType) {
      if (!this._layerConfig[layerType]) return;

      // 移除所有按钮的高亮状态
      const allItems = this._dom?.querySelectorAll(".layer_item");
      if (allItems) {
        allItems.forEach((item) => {
          item.classList.remove("active");
        });
      }

      // 更新当前图层
      this._currentLayer = layerType;

      // 添加新的高亮状态
      const newItem = this._dom?.querySelector(`.layer_item[data-layer="${layerType}"]`);
      if (newItem) {
        newItem.classList.add("active");
      }

      // 触发图层切换事件
      this.fire("layerChanged", {
        layerType,
        layerName: this._layerConfig[layerType].name,
      });
    }

    /**
     * 注册图层对象，用于切换时操作
     * @param {string} layerType 图层类型
     * @param {Object} layerObj 图层对象
     */
    registerLayer(layerType, layerObj) {
      this._layers[layerType] = layerObj;
    }

    /**
     * 获取当前图层类型
     * @returns {string}
     */
    getCurrentLayer() {
      return this._currentLayer;
    }

    /**
     * 显示控件
     */
    show() {
      this.setVisible(true);
    }

    /**
     * 隐藏控件
     */
    hide() {
      this.setVisible(false);
    }
  }

  daximap["ComponentsWrapper"] = ComponentsWrapper; // 组件包装器
  daximap["ButtonControl"] = ButtonControl; // 按钮控件
  daximap["CompassControl"] = CompassControl; // 罗盘控件
  daximap["ZoomControl"] = ZoomControl; // 缩放控件
  daximap["ViewModeControl"] = ViewModeControl; // 视图模式控件
  daximap["ImageButtonControl"] = ImageButtonControl; // 图片按钮控件
  daximap["IconButtonControl"] = IconButtonControl; // 图标按钮控件
  daximap["FloorControl"] = FloorControl; // 楼层切换控件
  daximap["LocationButtonControl"] = LocationButtonControl; // 定位按钮控件
  daximap["LayerSwitchControl"] = LayerSwitchControl; // 图层切换控件
})(window);
