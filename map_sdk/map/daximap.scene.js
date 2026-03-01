  const daximap = window.DaxiMap || {};
  let DXMapUtils = daximap["DXMapUtils"];
  let EventHandlerManager = daximap["EventHandlerManager"];
  let EventHandler = daximap["EventHandler"];
  let navi_utils = DXMapUtils["naviMath"];
  let Class = window["Class"];
  const DXSceneNode = daximap["DXSceneNode"];
  const DXSceneObject = daximap["DXSceneObject"];
  const DXIndoorMapScene = daximap["DXIndoorMapScene"];
  const DXOutdoorUtils = daximap["DXOutdoorUtils"];
  // 引用图层工具模块
  const DXLayerUtils = daximap["DXLayerUtils"];
  const DXLayerConstants = daximap["DXLayerConstants"];

  //////////////////////////////////////////////////////////////
  // DXSceneFloorObject
  //////////////////////////////////////////////////////////////
  let DXSceneFloorObject = (function (DXSceneNode) {
    "use strict";
    let DXSceneFloorObject = DXSceneNode.extend({
      __init__: function (mapSDK) {
        this["_super"]();
        let thisObject = this;
        this._mapSDK = mapSDK;
        thisObject._rtti = "DXSceneFloorObject";
        thisObject._heightOffset = 0;
        thisObject._opacity = 1.0;
        thisObject._visible = true;
        thisObject._bdid = "";
        thisObject._outdoorVisible = true;
      },
      removeFromMap: function () {
        let childNodeMap = this.childNodeMap;
        for (let key in childNodeMap) {
          let node = childNodeMap[key];
          this.removeChild(node);
        }
      },
      setOutdoorVisible: function (val) {
        this._outdoorVisible = val;
        this.visible = val;
      },
    });
    daximap.defineProperties(DXSceneFloorObject.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneFloorObject.prototype
       */
      heightOffset: {
        get: function () {
          return this._heightOffset;
        },
        set: function (val) {
          this._heightOffset = val;
        },
      },
      opacity: {
        get: function () {
          return this._opacity;
        },
        set: function (val) {
          this._opacity = val;
        },
      },
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          if (val && (!this.isOutdoor || this._outdoorVisible)) {
            this._visible = val;
          } else {
            this._visible = false;
          }
          if (this._visible == true && !this.isOutdoor) {
            this._mapSDK._fire("floorChanged", {
              floorId: this.floorId,
              bdid: this.bdid,
            });
          }
        },
      },
      floorId: {
        get: function () {
          return this._floorId;
        },
        set: function (flid) {
          this._floorId = flid;
        },
      },
      bdid: {
        get: function () {
          return this._bdid;
        },
        set: function (bdid) {
          this._bdid = bdid;
        },
      },
    });

    return DXSceneFloorObject;
  })(DXSceneNode);
  daximap["DXSceneFloorObject"] = DXSceneFloorObject;
  // 目前source支持vector，raster， geojson， image，video。geojson的支持比较巧妙，有了这个就可以处理各种矢量类型，包括集合。而前面的vector主要解决的是矢量瓦片，raster解决的是目前常用的栅格化的瓦片。video的加入使得功能更加的现代化。 mapbox在style里面，为source定义了一个type属性，来说明这些类型
  //Layer 我只能说mapbox开启了新的一种layer样式方式。目前分为：background,fill, line, symbol, raster, circle。除了background类型的layer不需要绑定source之外。其他的都需要有source。fill类型的layer只负责填充；line类型的layer只负责线条；symbol类型的layer会处理sprite，文字等；raster类型的layer就只负责图片， circle类型的layer是更高一层的业务处理需要。
  function getDefPaintByType(type) {
    let result = {};
    switch (type) {
      case "background":
        result = {
          "background-color": ["any", ["get", "background-color"], "#25adff"],
          "background-opacity": ["any", ["get", "background-opacity"], 1],
          visibility: ["!=", ["get", "visible"], false, "visible", "none"],
        };
        break;
      case "fill":
        result = {
          "fill-color": ["any", ["get", "fill-color"], "#25adff"],
          "fill-opacity": ["any", ["get", "opacity"], 1],
          "fill-outline-color": ["any", ["get", "outline-color"], "#909091"],
          visibility: ["!=", ["get", "visible"], false, "visible", "none"],
          // fill-sort-key  Sorts features in ascending order based on this value
        };
        break;
      case "line":
        reault = {
          "line-bur": ["any", ["get", "line-blur"], 0],
          "line-cap": ["any", ["get", "line-cap"], "round"],
          "line-color": ["any", ["get", "line-color"], "#25adff"],
          "line-opacity": ["any", ["get", "line-opacity"], 1],
          "line-dasharray": ["any", ["get", "line-dasharray"], [0, 0]],
          "line-gradient": ["get", "line-gradient"],
          "line-join": ["any", ["get", "line-join"], "round"],
          "line-sort-key": ["any", ["get", "line-key"], 1],
          "line-width": ["any", ["get", "line-width"], 6],
          visibility: ["!=", ["get", "visible"], false, "visible", "none"],
        };
        break;
      case "symbol":
        result = {
          "icon-allow-overlap": ["!=", ["get", "allow-overlap"], true, false, true],
          "icon-anchor": ["any", ["get", "line-anchor"], "center"],
          "icon-image": ["get", "line-image"], //Name of image in sprite to use for drawing an image background.
          // SDF icons.  Requires icon-image : icon-color  icon-halo-blur  icon-halo-color  icon-halo-width
          "icon-opacity": ["any", ["get", "line-opacity"], 1],
          "icon-padding": ["number", ["get", "icon-padding"], 0],
          "icon-rotation": ["get", "rotation"],
          "icon-size": ["any", ["get", "icon-size"], 1],
          "icon-text-fit-padding": ["any", ["get", "icon-text-fit-padding"], [0, 0, 0, 0]],
          //"icon-rotation-alignment": "auto", // 地图旋转时图标的对齐方式（可选，可选值为 map、viewport、auto，默认值为 auto）
          //"icon-pitch-alignment": "auto", // 地图倾斜时图标的对齐方式（可选，可选值为 map、viewport、auto，默认值为 auto）
          "text-rotation-alignment": "viewport", // 与 icon-rotation-alignment 类似
          //"text-pitch-alignment": "auto", // 与 icon-pitch-alignment 类似
          "text-field": ["string", ["get", "text"], ""],
          "text-size": ["number", ["get", "text-size"], 14],
          "text-padding": ["number", ["get", "text-padding"], 2],
          "text-halo-color": ["get", "bgcolor"], //"#fff",
          "text-halo-width": 10,
          // "text-allow-overlap": false, // 是否允许文本重叠
        };
    }
  }
  //////////////////////////////////////////////////////////////
  // DXModelLayer
  //////////////////////////////////////////////////////////////
  let DXModelLayer = (function (DXSceneObject) {
    "use strict";
    let DXModelLayer = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXModelLayer";
        thisObject._source = null;
        thisObject._cat = "indoor";
      },
      setSource: function (source) {
        this.source = source;
      },
      setFloorObject: function (floorObject) {
        this._floorObject = floorObject;
      },
      checkFloor: function (explodedView) {
        let visible = this._visible;
        if (this._floorObject) {
          visible = visible && this._floorObject.visible;
        }
        if (explodedView && this._floorObject.isOutdoor !== true) {
          visible = true;
        }

        if (explodedView && this._cat === "park") {
          visible = false;
        }

        let api = this._mapSDK._coreMap._indoorMapApi["engineApi"];
        api["setObjectAttribute"](this.source, "visible", visible);
        api["setObjectAttribute"](this.source, "heightOffset", this._floorObject._heightOffset);
        api["setObjectAttribute"](this.source, "opacity", this._floorObject._opacity);
      },
      removeFromMap: function () {
        let api = this._mapSDK._coreMap._indoorMapApi["engineApi"];
        api["removeLayer"](this.source);
      },
    });
    daximap.defineProperties(DXModelLayer.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneObject.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          this._visible = val;
          this.checkFloor();
        },
      },
      floorId: {
        get: function () {
          return this._floorId;
        },
        set: function (val) {
          this._floorId = val;
        },
      },
      cat: {
        get: function () {
          return this._cat;
        },
        set: function (val) {
          this._cat = val;
        },
      },
    });
    return DXModelLayer;
  })(DXSceneObject);
  daximap["DXModelLayer"] = DXModelLayer;
  //mapbox注记
  let DXMapBoxPoiLayer = (function (DXSceneObject) {
    "use strict";
    let DXMapBoxPoiLayer = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXMapBoxPoiLayer";
        thisObject._source = null;
        thisObject._layerId = "";
        thisObject._id = "";
        thisObject.markerPois = [];
      },
      initialize: function (mapSDK, options) {
        this._mapSDK = mapSDK;
        this._options = options;
        this._featureId = options["featureId"] || "";
        this._map = this._mapSDK._coreMap._mapboxMap;
        let uuid = DXMapUtils.createUUID();
        let layerId = "poi_" + uuid;
        this._layerId = layerId;
        this._id = this._layerId;
        this._sourceId = layerId;
        this.completed = false;
        this.floorId = options["floorId"] || "";
        this.bdid = options["bdid"] || "";
        this.panoVisible = options["panoVisible"] || false;
      },
      setPanoVisible: function (visible) {
        this.panoVisible = visible;
        if (!this._source) {
          return;
        }
        let sourceData = this._source["_data"];
        sourceData["features"].forEach(function (item) {
          if (item["properties"]["icon"] == 9) {
            item["properties"]["visible"] = visible;
          }
        });
        this._source["setData"](sourceData);
      },
      addToMap: function () {
        this["setSource"]();
      },
      setSource: function () {
        // this.source = source;
        let options = this._options;
        let thisObject = this;
        let floorId = options["floorId"] || thisObject.floorId;
        if (options["poiData"]) {
          thisObject.createPoiLayer(options["poiData"]);
        } else if (options["link"]) {
          if (options["dataType"] == "vector") {
            this.loadMVTData(this._options);
            return;
          }
          if (options["link"].indexOf("{z}/{x}/{y}") != -1) {
            this._options["link"] = this._options["link"].replace("../../../", "http://localhost:8081/");
            this.loadMVTData(this._options);
            // thisObject.addLayer();
            return;
          }
          let engineApi = this._mapSDK._coreMap._indoorMapApi["engineApi"];
          engineApi["createDataSourceManager"](options["link"], options["link"], function (poiData) {
            if (!poiData || !poiData["data"]) {
              return;
            }
            if (poiData["data"][floorId]) {
              let pois = JSON.parse(JSON.stringify(poiData["data"][floorId]["poi"]));
              thisObject._options["poiData"] = pois;
              thisObject.createPoiLayer(pois);
            }
          });
        } else if (options["data"]) {
          // geo
          thisObject._options["poiData"] = options["data"];
          thisObject.createPoiLayer(options["data"], true);
        } else if (options["tiles"]) {
          this.loadMVTData(this._options);
          // thisObject.createPoiLayer(options["data"], false,sourceData);
          // thisObject.addLayer();
        }
      },
      getFeature: function (key, value) {
        let poiData = this._options["poiData"];
        for (let k in poiData) {
          let poiInfo = poiData[k];
          if (poiInfo[key] == value) {
            return poiInfo[key];
          }
        }
      },
      createPoiLayer: function (poiData, rawSource, sourceData) {
        let thisObject = this;
        let floorId = thisObject.floorId;
        if (this.removed) {
          return;
        }
        if (sourceData) {
          // no todo
          // this.loadMVTData(this._options);
        } else if (!rawSource) {
          let geojson = {
            type: "FeatureCollection",
            features: [],
          };
          let images = [];
          let iconImgs = [];
          for (let poiId in poiData) {
            let poiInfo = poiData[poiId];
            if (poiInfo["icon"] != 9 || this.panoVisible) {
              poiInfo["visible"] = true;
            } else {
              poiInfo["visible"] = false;
            }

            if (poiInfo["icon"] == 99) {
              // new dxmarker
              thisObject.createPoiMarker(poiInfo, floorId, poiId);
            } else {
              let feature = {
                type: "Feature",
                properties: poiInfo,
                geometry: {
                  type: "Point",
                  coordinates: [poiInfo["lon"], poiInfo["lat"]],
                },
              };
              let iconImage = poiInfo["icon"];
              if (typeof iconImage == "string" && isNaN(Number(iconImage)) && iconImgs.indexOf(iconImage) == -1) {
                //非数字字符串
                iconImgs.push(iconImage);
                images.push(poiInfo);
              }
              geojson["features"].push(feature);
            }
          }

          let sourceData = {
            type: "geojson",
            data: geojson,
          };
        } else if (typeof poiData == "array") {
          let sourceData = {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: poiData,
            },
          };
        } else {
          let sourceData = {
            type: "geojson",
            data: poiData, //string or geojson 的object
          };
        }

        thisObject._map["addSource"](thisObject._sourceId, sourceData);
        thisObject._source = thisObject._map["getSource"](thisObject._sourceId);

        thisObject.completed = true;
        if (images.length > 0) {
          let loadedImages = 0;
          images.forEach(function (poiInfo, index) {
            thisObject._mapSDK._coreMap.loadImage(poiInfo["icon"], poiInfo["icon"], poiInfo, function (err) {
              if (!err) {
                poiInfo["icon"] = poiInfo["imgKey"];
                poiInfo["size"] = poiInfo["scale"];
              }
              loadedImages++;
              if (loadedImages == images.length) {
                thisObject.addLayer();
                thisObject.checkFloor();
              }
            });
          });
        } else {
          thisObject.addLayer();
          this.checkFloor();
        }
      },
      addLayer: function (options) {
        let thisObject = this;
        let poiFontColor = window["poiFontColor"] || "#202";
        let poiOptions = {
          type: "symbol",
          id: thisObject._layerId,
          paint: {
            "text-color": [
              "case",
              ["==", ["get", "active"], true],
              ["string", ["get", "highlight-color"], poiFontColor],
              ["string", ["get", "color"], poiFontColor],
            ],

            "text-halo-color": ["case", ["==", ["get", "noborder"], true], "rgba(100,0,0,0)", "#fff"],
            // "text-halo-color": "rgba(249,229,43,0.5)",
            // "text-halo-color":"rgba(100,0,0,0.5)",
            // "text-halo-width": 40,
            // "text-halo-blur": 10,
            "icon-opacity": 1, // 图标的不透明度（可选，取值范围为 0 ~ 1，默认值为 1）
            // "icon-color": "#000000", // 图标的颜色（可选，默认值为 #000000）
            // "icon-halo-color": "rgba(0,0,0,0)", // 图标的光晕颜色（可选，默认值为 rgba(0,0,0,0)）
            // "icon-halo-width": 60, // 图标的光晕宽度（可选，值 >= 0，默认值为 0，单位：像素
            "text-halo-width": 1,
            // "text-halo-blur": 1
          },
          // 图片的 0：男洗手间 1:女洗手间 2:无障碍洗手间 3:洗手间 4:电梯 5:楼层 6扶梯 7饮水
          //       8：全景 9:不可通行
          layout: {
            // 'icon-image': 'red_dot',
            "icon-image": [
              "case",
              ["==", ["get", "icon"], 1],
              "stair",
              ["==", ["get", "icon"], 2],
              "elevator",
              ["==", ["get", "icon"], 3],
              "esacator",
              ["==", ["get", "icon"], 4],
              "man-toilet",
              ["==", ["get", "icon"], 5],
              "woman-toilet",
              ["==", ["get", "icon"], 6],
              "toilet",
              ["==", ["get", "icon"], 7],
              "barrier-toilet",
              ["==", ["get", "icon"], 8],
              "water-room",
              ["==", ["get", "icon"], 9],
              "pano",
              ["==", ["get", "icon"], 10],
              "forbid",
              ["==", ["get", "icon"], 13],
              "entrance",
              ["==", ["get", "icon"], 14],
              "enterTingchechang",
              ["==", ["get", "icon"], 15],
              "leaveTingchechang",
              ["==", ["get", "icon"], 16],
              "xiyanqu",
              ["==", ["get", "icon"], 17],
              "jijiu",
              ["==", ["get", "icon"], 0],
              "",
              ["get", "icon"],
            ],
            "icon-size": this._options["icon-size"] || 0.4,
            // "icon-anchor": ["string", ["get", "icon-anchor"], "center"],
            //"icon-offset":["case",["!=",["get","icon-offset"],null],["literal",["get","icon-offset"]],["literal",[0,0]]],

            "text-field": [
              "case",
              ["any", ["==", ["get", "icon"], 0], ["all", ["!=", ["get", "type"], null], ["==", ["get", "type"], 3]]],
              ["string", ["get", "text"], ["get", "name"], ""],
              "",
            ],

            // "text-field": [
            //   'case',
            //   ['==', ['get', 'icon'], 0],
            //   ['string',['get', 'text'],['get','name'], ''],''
            // ],
            // "text-font": ['literal',["Open Sans Semibold", "Arial Unicode MS Regular"]], //偏黑体 Semibold
            // "text-font":['DIN Offc Pro', 'Arial Unicode MS Regular'], // 数字字母是斜体 不对齐

            "text-font": ["NotoSansSCRegular"], //['literal',['Open Sans Regular',"Arial Unicode MS Regular"]], //比较正常
            // "text-font": ['literal',['Open Sans Semibold','Arial Unicode MS Bold']],//['NotoCJK']], //本地
            // "text-font": ['Open Sans Regular',"Arial Unicode MS Regular"],
            // "text-offset": ['case',['!=',['get','icon'],0],['literal',[0, 1.6]],['literal',[0, 0]]],//设置图标与图标注相对之间的距离
            // "text-anchor": ["string", ["get", "text-anchor"], "center"],
            "text-anchor": ["case", ["all", ["!=", ["get", "type"], null], ["==", ["get", "type"], 3]], "top", "center"],
            "icon-anchor": ["case", ["all", ["!=", ["get", "type"], null], ["==", ["get", "type"], 3]], "bottom", "center"],
            "text-size": window["poiTextSize"] || 12,
            "text-justify": "center",
            "text-line-height": 1,
            "text-allow-overlap": false,
            "icon-allow-overlap": false,
            // "text-rotation-alignment": "viewport",
            // "symbol-placement":"line-center",
            "text-padding": 1,
            "icon-text-fit-padding": [1, 1, 1, 1],
            // "icon-ignore-placement": !0,
          },
          filter: ["all", ["!=", ["get", "visible"], false], [">=", ["zoom"], ["get", "minlevel"]], ["<=", ["zoom"], ["get", "maxlevel"]]], //, ["==", ["get", "visible"], true]
          source: thisObject._sourceId,
          // "source-layer":"poi"
        };
        if (options && typeof options == "object") {
          for (let key in options) {
            poiOptions[key] = options[key];
          }
        }
        if (window["hidePoiHaloColor"]) {
          delete poiOptions["paint"]["text-halo-color"];
        }
        // thisObject._mapSDK._coreMap.addToMapBox(poiOptions, "baseLayer");
        thisObject._mapSDK._coreMap.addToMapBox(poiOptions, "poiLayer");
        this._map["on"]("click", this._layerId, function (e) {
          let feature = e["features"][0];
          // if (feature["properties"]["text"] || feature["properties"]["name"]) {
          thisObject._mapSDK._eventMgr.fire("poiClick", feature);
          // }
        });
        thisObject._mapSDK._eventMgr.fire("poiLoaded", {
          bdid: this._options["bdid"],
          floorId: this._options["floorId"],
        });
      },

      loadMVTData: function (options) {
        let thisObject = this;
        let floorId = thisObject.floorId;
        if (this.removed) {
          return;
        }
        let sourceData = {
          type: "vector",
          // "tiles":options["tiles"]||[],
          tileSize: options["tileSize"] || 512, //矢量没有 tileSize属性 raster 有
          minzoom: options["minzoom"] || 14,
          maxzoom: options["maxzoom"] || 17,
        };
        if (options["SERVICE"] == "WMTS") {
          sourceData["scheme"] = options["scheme"] || "tms";
        }
        if (options["bounds"]) {
          //[sw.lng, sw.lat, ne.lng, ne.lat]
          sourceData["bounds"] = options["bounds"];
        } else if (options["rect"]) {
          let bounds = options["rect"].split(",").map(function (str) {
            return parseFloat(str);
          });
          sourceData["bounds"] = bounds;
        }

        options["scheme"] ? (sourceData["scheme"] = options["scheme"]) : "";
        let url = options["url"] || options["link"];
        if (url.indexOf("http") == -1) {
          if (window["dataPath"]) {
            url = window["dataPath"] + url;
          }
        }
        if (url.indexOf("../") == 0) {
          let pagePath = location.pathname.splice(0, pagePath["lastIndexOf"]("/"));
          while (url.indexOf("../") == 0) {
            pagePath = pagePath.splice(0, pagePath.lastIndexOf("/"));
            url = url.splice(url.indexOf("/") + 1);
          }
          url = location.origin + pagePath + url;
        }

        // if(url){
        //   sourceData["url"] =url;
        // }else{
        sourceData["tiles"] = options["tiles"] || [url];
        // }
        // sourceData["format"] = ""
        sourceData["volatile"] = options["volatile"] != undefined ? options["volatile"] : true;
        thisObject._map["addSource"](thisObject._sourceId, sourceData);
        thisObject.addLayer({ "source-layer": "poi" });
      },
      removeFromMap: function () {
        this.markerPois.forEach(function (marker) {
          marker["removeFromMap"]();
        });
        if (!this._layerId || !this._map["getLayer"](this._layerId)) {
          this.removed = true;
          return;
        }
        this._map["off"]("click", this._layerId);
        this._map["removeLayer"](this._layerId);
        this._map["removeSource"](this._sourceId);
        let scene = this._mapSDK._coreMap._scene;
        scene.removeChild(this);
      },
      createPoiMarker: function (poiInfo, floorId, poiId) {
        let thisObject = this;
        let marker = new DXMapMarker();
        poiInfo["floorId"] = floorId;
        poiInfo["id"] = poiId;
        poiInfo["bdid"] = poiInfo["bdid"] || this.bdid;
        let dom = document.createElement("div");
        dom.style.display = "inline-block";
        dom.style.padding = poiInfo["padding"] || "4px 6px";
        dom.style.borderRadius = "6px";
        dom.style.lineHeight = 1.2;
        dom.style.fontSize = "smaller";
        dom.style.border = "1px solid #fff";
        dom.style.backgroundColor = poiInfo["bgColor"] || "rgba(5, 161, 5,1)";

        dom.innerText = poiInfo["text"];
        poiInfo["onClick"] = function (data) {
          thisObject._mapSDK._eventMgr.fire("poiClick", { properties: data });
        };
        marker["initialize"](thisObject._mapSDK, poiInfo, { dom: dom, offset: [0, 8] }); //"anchor":"top" scale":0.8 用于default marker !element
        marker["addToMap"]();
        thisObject.markerPois.push(marker);
      },
      getPoiInfoById: function (poiId) {
        if (this._options["poiData"]) {
          return this._options["poiData"][poiId];
        } else {
          return null;
        }
      },
      setFloorObject: function (floorObject) {
        this._floorObject = floorObject;
      },

      checkFloor: function () {
        let visible = this._visible;
        if (this._floorObject) {
          visible = visible && this._floorObject.visible;
        }
        if (this._layerId && this.completed) {
          let value = visible == true ? "visible" : "none";
          if (this._map["getLayer"](this._layerId)) {
            this._map["setLayoutProperty"](this._layerId, "visibility", value);
          }
          this._mapSDK._forceRedraw();
        }
      },
    });

    daximap.defineProperties(DXMapBoxPoiLayer.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneObject.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          this._visible = val;
          this.checkFloor();
        },
      },
      floorId: {
        get: function () {
          return this._floorId;
        },
        set: function (val) {
          this._floorId = val;
        },
      },
    });
    return DXMapBoxPoiLayer;
  })(DXSceneObject);
  daximap["DXMapBoxPoiLayer"] = DXMapBoxPoiLayer;
  //layer type  sky, background, fill, line, symbol, raster, circle, fill-extrusion, heatmap, hillshade, 除background sky 都需要加source
  //mapbox WMS   scheme  One of "xyz", "tms". Defaults to "xyz".
  // addPolygone
  let DXScenePolygon = (function (DXSceneObject) {
    "use strict";
    let DXScenePolygon = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXScenePolygon";
        thisObject._source = null;
        thisObject._layerId = "";
        thisObject._id = "";
      },
      initialize: function (mapSDK, options) {
        this._mapSDK = mapSDK;
        this._options = options;
        this._featureId = options["featureId"] || "";
        this._map = this._mapSDK._coreMap._mapboxMap;
        let uuid = DXMapUtils.createUUID();
        let layerId = "polygon_" + uuid;
        this._layerId = layerId;
        this._id = this._layerId;
        this._sourceId = layerId;
        this.completed = false;
        this.floorId = options["floorId"] || "";
        this.bdid = options["bdid"] || "";
        if (this.floorId) {
          let scene = mapSDK._coreMap._scene;
          let floorObject = scene.getChildById(this.bdid + this.floorId);
          this._floorObject = floorObject;
          scene.addChild(floorObject, this);
        }
      },
      addToMap: function () {
        this["setSource"]();
      },
      removeFromMap: function () {
        let thisObject = this;
        if (!thisObject._map["getLayer"](this._layerId)) {
          return;
        }
        thisObject._map["off"]("click", this._layerId, thisObject._mapSDK._coreMap.activeFeature);
        thisObject._map["removeLayer"](this._layerId);
        thisObject._map["removeSource"](this._sourceId);
        let scene = thisObject._mapSDK._coreMap._scene;
        scene.removeChild(thisObject);
      },
      setSource: function () {
        let options = this._options;
        let thisObject = this;
        if (options["features"]) {
          thisObject["createPolygonLayer"](options["features"]);
        } else if (options["url"]) {
          // thisObject["createPolygonLayer"](options["features"]);
        }
      },
      createPolygonLayer: function (geodata) {
        let thisObject = this;
        let geojson = {
          type: "FeatureCollection",
          features: [],
        };
        if (this._options["crs"]) {
          geojson["crs"] = this._options["crs"];
        }

        if (DXMapUtils.isArray(geodata)) {
          geodata.forEach(function (item) {
            if (!item["geometry"] && !item["coordinates"]) {
              return;
            }
            geojson["features"].push({
              type: "Feature",
              properties: item["properties"] || {},
              geometry: item["geometry"] || {
                type: item["type"] || "Polygon",
                coordinates: item["coordinates"],
              },
            });
          });
        }

        let sourceData = {
          type: "geojson",
          data: geojson,
        };
        thisObject._map["addSource"](thisObject._sourceId, sourceData);
        thisObject._source = thisObject._map["getSource"](thisObject._sourceId);
        let polygonOptions = {
          type: "fill",
          id: thisObject._layerId,
          paint: {
            "fill-color": ["string", ["get", "fillColor"], this._options["fillColor"]],
            "fill-opacity": ["number", ["get", "opacity"], this._options["opacity"]],
            "fill-outline-color": ["string", ["get", "outlineColor"], this._options["outlineColor"]],
          },
          // 图片的 0：男洗手间 1:女洗手间 2:无障碍洗手间 3:洗手间 4:电梯 5:楼层 6扶梯 7饮水
          // 8：全景 9:不可通行
          layout: {},
          source: thisObject._sourceId,
        };
        thisObject.completed = true;
        this._mapSDK._coreMap.addToMapBox(polygonOptions, "baseLayer");
        this._map["on"]("click", this._layerId, function (e) {
          let feature = e["features"][0];
          if (thisObject._options["onClick"]) {
            thisObject._options["onClick"]({
              properties: feature["properties"],
              geometry: feature["geometry"],
              clickedPoint: { lon: e["lngLat"]["lng"], lat: e["lngLat"]["lat"] },
            });
          } else {
            thisObject._mapSDK._eventMgr.fire("polygonClick", feature);
          }
        });
        this.checkFloor();
      },

      setFloorObject: function (floorObject) {
        this._floorObject = floorObject;
      },
      checkFloor: function () {
        let visible = this._visible;
        if (this._floorObject) {
          visible = visible && this._floorObject.visible;
        }
        if (this._layerId && this.completed) {
          let value = visible == true ? "visible" : "none";
          if (this._map["getLayer"](this._layerId)) {
            this._map["setLayoutProperty"](this._layerId, "visibility", value);
          }
        }
      },
      setVisible: function (value) {
        this.visible = value;
      },
      setColor: function (fillColor, featureId) {
        this._options["fillColor"] = fillColor;
        let source = this._map["getSource"](this._sourceId);
        let _data = source["_data"];
        if (_data["type"] == "FeatureCollection") {
          let features = _data["features"];
          features.forEach(function (feature) {
            let id = feature["properties"] && (feature["properties"]["id"] || feature["properties"]["FT_ID"]);
            if (!featureId || id == featureId) {
              feature["properties"]["fillColor"] = fillColor;
            }
          });
        } else if (_data["type"] == "Feature") {
          let id = _data["properties"] && (_data["properties"]["id"] || _data["properties"]["FT_ID"]);
          if (!featureId || id == featureId) {
            _data["properties"]["fillColor"] = fillColor;
          }
        }
        source["setData"](_data);
      },
      setHighlightStyle: function (fillColor, opacity, outlineColor, featureId) {
        if (fillColor) {
          this._options["fillColor"] = fillColor;
          // this._map["getLayer"](this._layerId)["setPaintProperty"]('fill-color', fillColor);
        }
        if (opacity) {
          this._options["opacity"] = opacity;
          // this._map["getLayer"](this._layerId)["setPaintProperty"]('fill-opacity', opacity);
        }
        if (outlineColor) {
          this._options["outlineColor"] = outlineColor;
          // this._map["getLayer"](this._layerId)["setPaintProperty"]('fill-outline-color', outlineColor);
        }
        // if (featureId) {
        let source = this._map["getSource"](this._sourceId);
        let _data = source["_data"];
        if (_data["type"] == "FeatureCollection") {
          let features = _data["features"];
          features.forEach(function (feature) {
            let id = feature["properties"] && (feature["properties"]["id"] || feature["properties"]["FT_ID"]);
            if (!featureId || id == featureId) {
              fillColor && (feature["properties"]["fillColor"] = fillColor);
              opacity != undefined && (feature["properties"]["opacity"] = opacity);
              outlineColor && (feature["properties"]["outlineColor"] = outlineColor);
            }
          });
        } else if (_data["type"] == "Feature") {
          let id = _data["properties"] && (_data["properties"]["id"] || _data["properties"]["FT_ID"]);
          if (!featureId || id == featureId) {
            fillColor && (_data["properties"]["fillColor"] = fillColor);
            opacity != undefined && (_data["properties"]["opacity"] = opacity);
            outlineColor && (_data["properties"]["outlineColor"] = outlineColor);
          }
        }
        source["setData"](_data);
        // }
      },
    });

    daximap.defineProperties(DXScenePolygon.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneObject.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          this._visible = val;
          this.checkFloor();
        },
      },
      floorId: {
        get: function () {
          return this._floorId;
        },
        set: function (val) {
          this._floorId = val;
        },
      },
    });
    return DXScenePolygon;
  })(DXSceneObject);
  daximap["DXScenePolygon"] = DXScenePolygon;
  let DXMapBoxVectorLayer = (function (DXSceneObject) {
    "use strict";
    let DXMapBoxVectorLayer = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXMapBoxVectorLayer";
        thisObject._source = null;
        thisObject._layerId = "";
        thisObject._id = "";
        this.layerType = ""; //"raster"
        this.sourceType = "vector"; //默认
      },
      initialize: function (mapSDK, options, beforeLayerId) {
        this._mapSDK = mapSDK;
        this._options = options || {};
        this.layerType = options["layerType"] || this.layerType;
        this.sourceType = options["sourceype"] || this.sourceType;
        this._id = options["id"] || "";
        this._map = this._mapSDK._coreMap._mapboxMap;
        let uuid = DXMapUtils.createUUID();
        let layerId = this.layerType + uuid;
        this._layerId = layerId;
        this._beforeLayerId = beforeLayerId || options["beforeLayerId"];
        this._id = this._layerId;
        this._sourceId = layerId;
        this.completed = false;
        this.floorId = options["floorId"] || "";
        this.bdid = options["bdid"] || "";
        if (this.floorId) {
          let scene = mapSDK._coreMap._scene;
          let floorObject = scene.getChildById(this.bdid + this.floorId);
          this._floorObject = floorObject;
          scene.addChild(floorObject, this);
        } else if (options["bdid"]) {
          let scene = mapSDK._coreMap._scene;
          let buildingObject = scene.getChildById(options["bdid"]);
          scene.addChild(buildingObject, this);
        }
      },

      addToMap: function () {
        this["setSource"]();
        let events = this._options["events"];
        if (events) {
          for (let key in events) {
            if (events[key]) {
              thisObject._map["on"](key, this._layerId, events[key]);
            }
          }
        }
      },
      removeFromMap: function () {
        if (this._options["forbidden"]) {
          return;
        }
        let thisObject = this;
        if (!thisObject._map["getLayer"](this._layerId)) {
          return;
        }
        //thisObject._map["off"]("click", this._layerId, thisObject._mapSDK._coreMap.activeFeature);
        let events = this._options["events"];
        if (events) {
          for (let key in events) {
            thisObject._map["off"](key, this._layerId, events[key]);
          }
        }
        this._map["off"]("click", this._layerId);
        thisObject._map["removeLayer"](this._layerId);
        thisObject._map["removeSource"](this._sourceId);
        let scene = thisObject._mapSDK._coreMap._scene;
        scene.removeChild(thisObject);
      },
      setSource: function () {
        //attribution
        // bounds Defaults to [-180,-85.051129,180,85.051129] [sw.lng, sw.lat, ne.lng, ne.lat]
        // maxzoom  Defaults to 22; minzoom Defaults to 0
        // scheme  Optional enum. One of "xyz", "tms". Defaults to "xyz". "xyz": Slippy map tilenames scheme."tms":OSGeo spec scheme.
        // tiles Optional array of strings. An array of one or more tile source URLs, as in the TileJSON
        // url Optional A URL to a TileJSON resource. Supported protocols are http:, https:, and mapbox://<Tileset ID>
        // volatile to determine whether a source's tiles are cached locally

        this.createLayer(this._options);
      },
      setUrl: function (url) {
        //'mapbox://mapbox.mapbox-streets-v8'
        this._source && this._source["setUrl"](url);
      },
      setTiles: function (tilesUrl) {
        if (typeof tilesUrl == "string") {
          tilesUrl = [tilesUrl];
        }
        this._source && this._source["setTiles"](tilesUrl); //(['https://another_end_point.net/{z}/{x}/{y}.mvt'])
      },
      createLayer: function (options) {
        let type = this.layerType;
        let thisObject = this;
        let sourceData = {};

        !sourceData["type"] ? (sourceData["type"] = this.sourceType) : "";
        if (options["tiles"]) {
          sourceData["tiles"] = options["tiles"];
        }
        sourceData["tileSize"] = 256;
        if (options["tileSize"]) {
          sourceData["tileSize"] = options["tileSize"];
        }

        if (options["SERVICE"] == "WMTS") {
          sourceData["scheme"] = options["scheme"] || "tms";
        }
        if (options["bounds"]) {
          //[sw.lng, sw.lat, ne.lng, ne.lat]
          sourceData["bounds"] = options["bounds"];
        } else if (options["rect"]) {
          let bounds = options["rect"].split(",").map(function (str) {
            return parseFloat(str);
          });
          sourceData["bounds"] = bounds;
        }

        options["scheme"] ? (sourceData["scheme"] = options["scheme"]) : "";
        options["url"] ? (sourceData["url"] = options["url"]) : "";
        sourceData["volatile"] = options["volatile"] != undefined ? options["volatile"] : true;
        if (options["customsource"]) {
          sourceData = new CustomSource(sourceData, this._mapSDK);
        }

        // 使用 DXLayerUtils 创建图层配置
        let layerOptions = DXLayerUtils.createLayerOptions({
          layerId: this._layerId,
          layerType: type,
          sourceId: this._sourceId,
          options: options,
        });

        // 保留自定义 paint 配置
        if (options["paint"]) {
          for (let key in options["paint"]) {
            layerOptions.paint[key] = options["paint"][key];
          }
        }

        if (options["minzoom"]) {
          layerOptions["minzoom"] = options["minzoom"];
        }
        if (options["maxzoom"]) {
          layerOptions["maxzoom"] = options["maxzoom"];
        }

        if (type == "raster") {
          layerOptions.paint["raster-fade-duration"] = layerOptions.paint["raster-fade-duration"] || 2000;
          let opacity = options["raster-opacity"] || options["opacity"] || 1;
          // 仅在 minzoom 处淡入，其余层级保持完全可见
          layerOptions.paint["raster-opacity"] = [
            "interpolate",
            ["linear"],
            ["zoom"],
            layerOptions.minzoom || 0,
            0.1,
            Math.min((layerOptions.minzoom || 0) + 1, (layerOptions.minzoom || 0) + ((sourceData.maxzoom || 18) - (layerOptions.minzoom || 0)) * 0.3),
            opacity,
          ];
        }
        // else{
        thisObject._map["addSource"](this._sourceId, sourceData);
        // }
        thisObject._source = thisObject._map["getSource"](thisObject._sourceId);

        this._mapSDK._coreMap.addToMapBox(layerOptions, this._beforeLayerId || options["layerNmae"] || "baseLayer");
        this.completed = true;
        this.checkFloor();
      },
      updateSourceData: function (data) {
        // 使用 DXLayerUtils 转换数据为 GeoJSON 格式
        let geojson = DXLayerUtils.convertToGeoJSON(data, "Polygon", this.layerType);
        if (geojson) {
          this._source["setData"](geojson);
        } else {
          this._source["setData"](data);
        }
      },
      updateFeaturePros: function (id, properties) {
        // 使用 DXLayerUtils 更新要素属性
        DXLayerUtils.updateFeatureProperties(this._source, id, properties);
      },
      checkFloor: function () {
        let visible = this._visible;
        if (this._floorObject) {
          visible = visible && this._floorObject.visible;
        }
        if (this._layerId) {
          // 使用 DXLayerUtils 检查图层可见性
          DXLayerUtils.checkLayerVisibility(this._map, this._layerId, visible);
        }
      },
      setFloorObject: function (floorObject) {
        this._floorObject = floorObject;
      },
    });

    daximap.defineProperties(DXMapBoxVectorLayer.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneObject.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          this._visible = val;
          this.checkFloor();
        },
      },
      floorId: {
        get: function () {
          return this._floorId;
        },
        set: function (val) {
          this._floorId = val;
        },
      },
    });
    return DXMapBoxVectorLayer;
  })(DXSceneObject);
  daximap["DXMapBoxVectorLayer"] = DXMapBoxVectorLayer;
  let DXMapBoxPolygonLayer = (function (DXMapBoxVectorLayer) {
    "use strict";
    let DXMapBoxPolygonLayer = DXMapBoxVectorLayer.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXMapBoxPolygonLayer";
        thisObject._source = null;
        thisObject._layerId = "";
        thisObject._id = "";
        this.layerType = "fill"; //"raster"
        this.sourceType = "geojson"; //默认
        this.featureType = "MultiPolygon";
        //fill-antialias 反锯齿化
        //fill-sort-key Sorts features in ascending order based on this value. Features with a higher sort key will appear above features with a lower sort key.
        // Name of image in sprite to use for drawing image fills. For seamless patterns, image width and height must be a factor of two (2, 4, 8, ..., 512). Note that zoom-dependent expressions will be evaluated only at integer zoom
        // fill-translate-anchor Optional enum. One of "map", "viewport". Defaults to "map". Requires fill-translate.
        this.paintAttrs = [
          "fill-antialias",
          "fill-color",
          "fill-pattern",
          "fill-translate",
          "fill-translate-anchor",
          "fill-color",
          "fill-opacity",
          "fill-outline-color",
        ];
        this.layoutAttrs = ["fill-sort-key", "visibility"];
        this.featureStates = {
          paint: ["fill-color", "fill-opacity", "fill-outline-color" /*Disabled by fill-pattern require fill-antialias to be true*/],
          layout: [],
        };
        this.clickEventName = "polylineClick";
      },

      addToMap: function () {
        this["setSource"]();
      },
      setSource: function () {
        let thisObject = this;
        let options = thisObject._options;

        let sourceData = {
          type: thisObject.sourceType,
        };

        if (options["maxzoom"]) {
          sourceData["maxzoom"] = options["maxzoom"];
        }
        if (options["maxlevel"]) {
          sourceData["maxzoom"] = options["maxlevel"];
        }

        options["url"] ? (sourceData["data"] = options["url"]) : "";
        if (this.layerType == "fill") {
          options["fill-color"] = options["fill-color"] || options["fillColor"] || "#1192fb";
          if (options["outlineColor"]) {
            options["fill-outline-color"] = options["outlineColor"];
          }
        }
        if (options["data"]) {
          let data = options["data"];
          if (DXMapUtils.isArray(data)) {
            let geojson = { features: [], type: "FeatureCollection" };
            data.forEach(function (item) {
              if (!item["geometry"] && !item["coordinates"]) {
                return;
              }
              let featureType = thisObject.featureType;
              if (!item["type"] && item["coordinates"]) {
                let testDeep = 1;
                let arr = item["coordinates"];
                while (typeof arr[0] == "object") {
                  testDeep++;
                  arr = arr[0];
                }
                if (testDeep == 1) {
                  featureType = "Point";
                } else if (testDeep == 2) {
                  if (thisObject.layerType == "symbol" || thisObject.layerType == "circle") {
                    featureType = "MultiPoint";
                  } else {
                    featureType = "LineString";
                  }
                } else if (testDeep == 3) {
                  if (thisObject.layerType == "line") {
                    featureType = "MultiLineString";
                  } else {
                    featureType = "Polygon";
                  }
                } else {
                  featureType = "MultiPolygon";
                }
              }
              geojson["features"].push({
                type: "Feature",
                properties: item["properties"] || {},
                geometry: item["geometry"] || {
                  type: item["type"] || featureType,
                  coordinates: item["coordinates"],
                },
              });
            });
            sourceData["data"] = geojson;
          } else {
            sourceData["data"] = options["data"];
          }
        }
        //lineMetrics  Whether to calculate line distance metrics. This is required for line layers that specify line-gradient values.
        let sourceOptions = [
          "cluster",
          "clusterMaxZoom",
          "clusterMinPoints",
          "clusterProperties",
          "clusterRadius",
          "filter",
          "generateId",
          "lineMetrics",
          "tolerance",
        ];
        for (let key in sourceOptions) {
          let proName = sourceOptions[key];
          if (options[proName] != undefined) {
            sourceData[proName] = options[proName];
          }
        }
        thisObject._map["addSource"](thisObject._sourceId, sourceData);
        thisObject._source = thisObject._map["getSource"](thisObject._sourceId);
        thisObject.createLayer(options);
        if (options["bdid"] && options["floorId"]) {
          let scene = thisObject._mapSDK._coreMap._scene;
          let sceneFloorObject = scene.getChildById((options["bdid"] || "") + options["floorId"]);
          if (sceneFloorObject) {
            thisObject.setFloorObject(sceneFloorObject);
          }
        }
      },
      setUrl: function (url) {
        //'mapbox://mapbox.mapbox-streets-v8'
        this._source && this._source["setUrl"](url);
      },

      createLayer: function (options) {
        let thisObject = this;
        let layerOptions = {
          id: thisObject._layerId,
          type: thisObject.layerType,
          source: thisObject._sourceId,
          paint: {},
          layout: {},
        };

        let paintAttrs = this.paintAttrs;
        let layoutAttrs = this.layoutAttrs;
        let featureStates = this.featureStates;
        let featureStatesPaint = featureStates["paint"];
        let featureStatesLayout = featureStates["layout"];
        for (let i = 0, len = featureStatesPaint.length; i < len; i++) {
          let key = featureStatesPaint[i];
          if (options[key] != undefined) {
            if (key == "line-dasharray") {
              layerOptions["paint"][key] = ["case", ["!=", ["get", key], null], ["get", key], ["literal", options[key]]];
            } else {
              layerOptions["paint"][key] = ["case", ["!=", ["get", key], null], ["get", key], options[key]];
            }
            delete options[key];
          } else {
            layerOptions["paint"][key] = ["get", key];
          }
        }
        for (let i = 0, len = featureStatesLayout.length; i < len; i++) {
          let key = featureStatesLayout[i];
          if (options[key] != undefined) {
            layerOptions["layout"][key] = ["case", ["!=", ["get", key], null], ["get", key], options[key]];
            delete options[key];
          } else {
            layerOptions["layout"][key] = ["get", key];
          }
        }
        for (let key in options) {
          if (options[key] == undefined) {
            return;
          }
          if (paintAttrs.indexOf(key) != -1) {
            layerOptions["paint"][key] = options[key];
          }
          if (layoutAttrs.indexOf(key) != -1) {
            layerOptions["layout"][key] = options[key];
          }
        }

        if (options["minzoom"]) {
          layerOptions["minzoom"] = options["minzoom"];
        }
        if (options["maxzoom"]) {
          layerOptions["maxzoom"] = options["maxzoom"];
        }
        if (options["filter"]) {
          layerOptions["filter"] = options["filter"];
        }
        thisObject._mapSDK._coreMap.addToMapBox(layerOptions, options["layerNmae"] || "baseLayer");
        thisObject.completed = true;
        thisObject.checkFloor();
        thisObject._map["on"]("click", thisObject._layerId, function (e) {
          let feature = e["features"][0];
          if (typeof thisObject._options["onClick"] == "function") {
            // thisObject._options["onClick"](feature);
            thisObject._options["onClick"]({
              properties: feature["properties"],
              geometry: feature["geometry"],
              clickedPoint: { lon: e["lngLat"]["lng"], lat: e["lngLat"]["lat"] },
            });
            return;
          }
          if (thisObject._options["events"] && thisObject._options["events"]["click"]) {
            //initialize 处理 events
            return;
          }
          thisObject._mapSDK._eventMgr.fire(thisObject.clickEventName, feature);
        });
      },
    });

    daximap.defineProperties(DXMapBoxPolygonLayer.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneObject.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          this._visible = val;
          this.checkFloor();
        },
      },
      floorId: {
        get: function () {
          return this._floorId;
        },
        set: function (val) {
          this._floorId = val;
        },
      },
    });
    return DXMapBoxPolygonLayer;
  })(DXMapBoxVectorLayer);
  daximap["DXMapBoxPolygonLayer"] = DXMapBoxPolygonLayer;

  let DXMapBoxExtrusionLayer = (function (DXMapBoxPolygonLayer) {
    "use strict";
    let DXMapBoxExtrusionLayer = DXMapBoxPolygonLayer.extend({
      __init__: function () {
        this["_super"]();
        this.layerType = "fill-extrusion";
        this.sourceType = "geojson";
        this._rtti = "DXMapBoxExtrusionLayer";
        this.featureType = "Point";
        this.paintAttrs = [
          "circle-blur",
          "circle-color",
          "circle-radius",
          "circle-opacity",
          "circle-pitch-alignment",
          "circle-stroke-color",
          "circle-stroke-opacity",
          "circle-stroke-width",
          "circle-translate",
          "circle-translate-anchor",
        ];
        this.layoutAttrs = ["circle-sort-key", "visibility"];
        this.featureStates = {
          paint: ["circle-blur", "circle-color", "circle-radius", "circle-opacity", "circle-stroke-color", "circle-stroke-opacity", "circle-stroke-width"],
          layout: ["circle-sort-key"],
        };
        this.clickEventName = "extrusionMapBlockClick";
      },

      createLayer: function (options) {
        let thisObject = this;
        let polygonOptions = {
          type: "fill-extrusion",
          id: thisObject._layerId,
          paint: {
            // Get the `fill-extrusion-color` from the source `color` property.
            "fill-extrusion-color": ["string", ["!=", ["get", "color"], null], ["get", "color"], "#e40ec1"], //["!=",['get','COLOR'],null],['get','COLOR'],
            // Get `fill-extrusion-height` from the source `height` property.
            //'fill-extrusion-height': ['number', ["!=",['get', 'height'],null],['get','height'],['get','HEIGHT']],
            // Get `fill-extrusion-base` from the source `base_height` property.
            // 'fill-extrusion-base': ['number', ["!=",['get', 'base_height'],null],['get', 'base_height'],0.0],
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["number", ["!=", ["get", "height"], null], ["get", "height"], ["get", "HEIGHT"]], //['get', 'height']
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["number", ["!=", ["get", "base_height"], null], ["get", "base_height"], 0.0], //['get', 'min_height']
            ],
            "fill-extrusion-height-transition": {
              duration: 0,
              delay: 0,
            },
            // Make extrusions slightly opaque to see through indoor walls.
            "fill-extrusion-opacity": options["opacity"] || 0.9, //opacity
            // 'fill-extrusion-opacity':[
            //   'interpolate',
            //   ['linear'],
            //   ['zoom'],
            //   16,
            //   1,
            //   19,
            //   0.0
            //   //, ['number',['get','opacity'],1]
            // ]
          },

          layout: {},
          // "filter": ["all",["any",["!",options["minlevel"]],[">=", ['zoom'],options["minlevel"]]],["any",["!",options["maxlevel"]],["<=", ['zoom'],options["maxlevel"]]],['any',["!",["get", "minlevel"]],[">=", ['zoom'], ["get", "minlevel"]]],["any",["!",["get", "maxlevel"]],["<=", ['zoom'], ["get", "maxlevel"]]],["!=",["get","visible"],false]],
          source: thisObject._sourceId,
        };
        if (options["paint"]) {
          let paint = options["paint"];
          for (let key in paint) {
            polygonOptions["paint"][key] = paint[key];
          }
        }
        if (options["layout"]) {
          let layout = options["layout"];
          for (let key in layout) {
            polygonOptions["layout"][key] = layout[key];
          }
        }
        if (options["minzoom"]) {
          polygonOptions["minzoom"] = options["minzoom"];
        }
        thisObject.completed = true;
        thisObject._mapSDK._coreMap.addToMapBox(polygonOptions, "baseLayer");
        thisObject._map["on"]("click", thisObject._layerId, function (e) {
          let feature = e["features"][0];
          let properties = feature["properties"];
          let lngLat = e["lngLat"],
            point = e["point"];
          if (typeof thisObject._options["onClick"] == "function") {
            thisObject._options["onClick"]({ properties: properties, lngLat: lngLat, point: point });
            return;
          }
          thisObject._mapSDK._eventMgr.fire("extrusionMapBlockClick", { properties: properties, lngLat: lngLat, point: point });
          thisObject._mapSDK._eventMgr.fire("extrusionClick", feature);
        });
        thisObject.checkFloor();
      },

      setColor: function (fillColor) {
        this._options["fillColor"] = fillColor;
        this._map["getLayer"](this._layerId)["setPaintProperty"]("fill-extrusion-color", fillColor);
      },
      setStyle: function (fillColor, opacity) {
        if (fillColor) {
          this._options["fillColor"] = fillColor;
          this._map["getLayer"](this._layerId)["setPaintProperty"]("fill-extrusion-color", fillColor);
        }
        if (opacity) {
          this._options["opacity"] = opacity;
          this._map["getLayer"](this._layerId)["setPaintProperty"]("fill-extrusion-opacity", opacity);
        }
      },
      setVisible: function (visible) {
        this._visible = visible;
        this.checkFloor();
      },
    });
    return DXMapBoxExtrusionLayer;
  })(DXMapBoxPolygonLayer);
  daximap["DXMapBoxExtrusionLayer"] = DXMapBoxExtrusionLayer;
  // // 矢量 图层
  // let DXMapBoxRasterLayer = (function (DXSceneObject) {
  //     'use strict';
  //     let DXMapBoxRasterLayer = DXSceneObject.extend({
  //         __init__: function () {
  //             this["_super"]();
  //             let thisObject = this;
  //             thisObject._rtti = "DXMapBoxRasterLayer";
  //             this.layerType = "raster";
  //             this.sourceType = "raster";///{z}/{x}/{y}
  //         }
  //     });
  //     return DXMapBoxRasterLayer;
  // })(DXSceneObject);
  // daximap["DXMapBoxRasterLayer"] = DXMapBoxRasterLayer;

  // wmslayer
  let DXMapBoxWMSLayer = (function (DXSceneObject) {
    "use strict";
    let DXMapBoxWMSLayer = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXMapBoxWMSLayer";
        this.layerType = "raster";
        this.sourceType = "raster";
        //  "tiles": [
        //     "http://a.example.com/wms?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&width=256&height=256&layers=example"
        // ]
      },
      setSource: function () {
        let params = this._options["params"];
        if (params) {
          !params["SERVICE"] ? (params["SERVICE"] = "WMS") : "";
          !params["REQUEST"] ? (params["REQUEST"] = "GetMap") : "";
          params["TRANSPARENT"] == undefined ? (params["TRANSPARENT"] = "TRUE") : "";
          !params["SRS"] ? (params["SRS"] = "EPSG:3857") : "";
          !params["bbox"] ? (params["bbox"] = "{bbox-epsg-" + params["SRS"].split(":")[1] + "}") : "";
          //ELEVATION	高程，若支持高程   BGCOLOR	图片背景

          if (this._options["url"]) {
            let url = this._options["url"];
            let lowercase = url.toLowerCase();
            for (let key in params) {
              if (lowercase.indexOf(key.toLowerCase()) == -1) {
                url.indexOf("?") == -1 ? (url += "?") : url[url.length - 1] == "?" ? "" : (url += "&");
                url += key + "=" + params[key];
              }
            }
            this._options["url"] += url;
          }
          if (this._options["tiles"]) {
            this._options["tiles"] = this._options["tiles"].map(function (item) {
              let lowercase = item.toLowerCase();
              for (let key in params) {
                if (lowercase.indexOf(key.toLowerCase()) == -1) {
                  item.indexOf("?") == -1 ? (item += "?") : item[item.length - 1] == "?" ? "" : (item += "&");
                  item += key + "=" + params[key];
                }
              }
              return item;
            });
          }
        }
        this["_super"]();
      },
    });
    return DXMapBoxWMSLayer;
  })(DXMapBoxVectorLayer);
  daximap["DXMapBoxWMSLayer"] = DXMapBoxWMSLayer;

  /** WMTS 瓦片图层 - 用于加载 WMTS 服务的栅格瓦片 */
  const DXMapBoxWMTSLayer = (function (DXMapBoxVectorLayer) {
    "use strict";

    /**
     * 向 URL 追加查询参数（如果参数不存在）
     * @param {string} url - 原始 URL
     * @param {Object} params - 要追加的参数对象
     * @returns {string} 追加参数后的 URL
     */
    function appendParamsToUrl(url, params) {
      const lowercase = url.toLowerCase();
      for (const key in params) {
        if (lowercase.indexOf(key.toLowerCase()) == -1) {
          const separator = url.indexOf("?") == -1 ? "?" : url.endsWith("?") ? "" : "&";
          url += `${separator}${key}=${params[key]}`;
        }
      }
      return url;
    }

    const DXMapBoxWMTSLayer = DXMapBoxVectorLayer.extend({
      __init__: function () {
        this._super();
        this._rtti = "DXMapBoxWMTSLayer";
        this.layerType = "raster";
        this.sourceType = "raster";
      },

      setSource: function () {
        const params = this._options?.params;
        if (params) {
          // 设置 WMTS 默认参数
          params.SERVICE ??= "WMTS"; // WMTS 服务
          params.REQUEST ??= "GetTile"; // GetTile 请求
          params.TILEMATRIX ??= "EPSG:3857"; // 瓦片坐标系
          params.TILEMATRIXSET ??= `${params.TILEMATRIX}:{z}`; // 瓦片矩阵集
          params.TILECOL ??= "{x}"; // 瓦片列
          params.TILEROW ??= "{y}"; // 瓦片行

          // 处理单个 URL
          if (this._options.url && !this._options.customsource) {
            this._options.url = appendParamsToUrl(this._options.url, params);
          }

          // 处理多个瓦片 URL
          if (this._options.tiles) {
            this._options.tiles = this._options.tiles.map((tile) => appendParamsToUrl(tile, params));
          }
        }
        this._super();
      },
    });

    return DXMapBoxWMTSLayer;
  })(DXMapBoxVectorLayer);
  daximap["DXMapBoxWMTSLayer"] = DXMapBoxWMTSLayer;

  /**
   * 高德地图瓦片图层 - 用于加载高德地图服务
   * @class
   * @extends DXMapBoxVectorLayer
   */
  let DXMapBoxGaodeLayer = (function (DXMapBoxVectorLayer) {
    "use strict";

    /**
     * 高德图层类型配置
     * @type {Object}
     */
    const GAODE_LAYER_TYPES = {
      // 道路地图 (标准图)
      road: {
        name: "道路",
        urlTemplate: "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
        subdomains: ["1", "2", "3", "4"],
        tileSize: 256,
      },
      // 卫星地图
      satellite: {
        name: "卫星",
        urlTemplate: "https://webst0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}",
        subdomains: ["1", "2", "3", "4"],
        tileSize: 256,
      },
      // 电子地图 (标准图)
      hybrid: {
        name: "混合",
        urlTemplate: "https://webst0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
        subdomains: ["1", "2", "3", "4"],
        tileSize: 256,
        isHybrid: true, // 混合图层需要在上面叠加路网标注
      },
    };

    let DXMapBoxGaodeLayer = DXMapBoxVectorLayer.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXMapBoxGaodeLayer";
        thisObject._source = null;
        thisObject._layerId = "";
        thisObject._id = "";
        thisObject._layerType = "road"; // road/satellite/hybrid
        this.layerType = "raster";
        this.sourceType = "raster";
        this._hybridLabelLayer = null; // 混合图层需要叠加路网标注
      },

      /**
       * 初始化高德图层
       * @param {Object} mapSDK 地图SDK对象
       * @param {Object} options 配置项
       * @param {string} [options.layerType="road"] 图层类型: road/satellite/hybrid
       * @param {string} [options.layerName] 图层名称
       */
      initialize: function (mapSDK, options) {
        options = options || {};
        this._layerType = options.layerType || "road";

        // 获取对应图层类型的配置
        const layerConfig = GAODE_LAYER_TYPES[this._layerType] || GAODE_LAYER_TYPES.road;

        // 构建 tiles URL
        const tiles = this._generateTiles(layerConfig.urlTemplate, layerConfig.subdomains);

        // 获取地图缩放级别范围
        let mapMinZoom = 0;
        let mapMaxZoom = 22;
        try {
          mapMinZoom = mapSDK._coreMap.getMinZoom?.() || 0;
          mapMaxZoom = mapSDK._coreMap.getMaxZoom?.() || 22;
        } catch (e) {}

        // 构建完整配置 - source 最高18级，layer 跟随地图
        const gaodeOptions = Object.assign({}, options, {
          tiles: tiles,
          tileSize: layerConfig.tileSize,
          minzoom: mapMinZoom,
          maxzoom: mapMaxZoom,
          layerType: this.layerType,
          sourceype: this.sourceType,
          layerName: options.layerName || layerConfig.name,
        });

        // 保存配置用于判断是否为混合图层
        this._isHybrid = layerConfig.isHybrid || false;

        this["_super"](mapSDK, gaodeOptions);
      },

      /**
       * 生成瓦片URL数组
       * @private
       */
      _generateTiles: function (urlTemplate, subdomains) {
        if (!subdomains || subdomains.length === 0) {
          return [urlTemplate.replace("{s}", "")];
        }
        return subdomains.map((s) => urlTemplate.replace("{s}", s));
      },

      /**
       * 创建图层
       * @private
       */
      createLayer: function (options) {
        let thisObject = this;

        // 获取地图缩放级别范围
        let mapMinZoom = 0;
        let mapMaxZoom = 22;
        try {
          mapMinZoom = thisObject._mapSDK._coreMap.getMinZoom?.() || 0;
          mapMaxZoom = thisObject._mapSDK._coreMap.getMaxZoom?.() || 22;
        } catch (e) {}

        // 高德瓦片最高到18级，超过18级后拉伸显示
        let gaodeMaxZoom = 18;

        let sourceData = {
          type: "raster",
          tiles: options.tiles,
          tileSize: options.tileSize || 256,
          minzoom: mapMinZoom,
          maxzoom: gaodeMaxZoom, // source 最高18级
          volatile: true,
        };

        let layerOptions = {
          id: this._layerId,
          type: "raster",
          source: this._sourceId,
          paint: {
            "raster-fade-duration": 300,
            "raster-opacity": options["raster-opacity"] || 1,
          },
          minzoom: mapMinZoom,
          maxzoom: mapMaxZoom, // layer 跟随地图，允许超过18级后拉伸显示
        };

        // 添加瓦片源
        thisObject._map["addSource"](this._sourceId, sourceData);
        thisObject._source = thisObject._map["getSource"](this._sourceId);

        // 添加栅格图层
        this._mapSDK._coreMap.addToMapBox(layerOptions, this._beforeLayerId || options["layerNmae"] || "baseLayer");

        // 如果是混合图层，需要叠加路网标注
        if (this._isHybrid && this._layerType === "satellite") {
          this._addSatelliteLabelLayer();
        }

        this.completed = true;
        this.checkFloor();
      },

      /**
       * 为卫星图层添加路网标注
       * @private
       */
      _addSatelliteLabelLayer: function () {
        const labelSourceId = this._sourceId + "_label";
        const labelLayerId = this._layerId + "_label";

        // 添加标注源
        this._map.addSource(labelSourceId, {
          type: "raster",
          tiles: GAODE_LAYER_TYPES.hybrid.tiles.map((s) => s.replace("{s}", s.includes("is.autonavi") ? "1" : "")),
          tileSize: 256,
          minzoom: 3,
          maxzoom: 18,
        });

        // 添加标注图层（只显示道路和标注，不显示底色）
        this._map.addLayer({
          id: labelLayerId,
          type: "raster",
          source: labelSourceId,
          paint: {
            "raster-fade-duration": 300,
            "raster-opacity": 0.6, // 标注半透明
          },
          minzoom: 3,
          maxzoom: 18,
        });

        this._hybridLabelLayer = {
          sourceId: labelSourceId,
          layerId: labelLayerId,
        };
      },

      /**
       * 移除图层
       */
      removeFromMap: function () {
        // 如果有混合标注图层，先移除
        if (this._hybridLabelLayer) {
          if (this._map.getLayer(this._hybridLabelLayer.layerId)) {
            this._map.removeLayer(this._hybridLabelLayer.layerId);
          }
          if (this._map.getSource(this._hybridLabelLayer.sourceId)) {
            this._map.removeSource(this._hybridLabelLayer.sourceId);
          }
        }
        this["_super"]();
      },

      /**
       * 设置图层透明度
       * @param {number} opacity 透明度 0-1
       */
      setOpacity: function (opacity) {
        if (this._map.getLayer(this._layerId)) {
          this._map.setPaintProperty(this._layerId, "raster-opacity", opacity);
        }
        // 如果有标注图层，也设置透明度
        if (this._hybridLabelLayer && this._map.getLayer(this._hybridLabelLayer.layerId)) {
          this._map.setPaintProperty(this._hybridLabelLayer.layerId, "raster-opacity", opacity * 0.6);
        }
      },

      /**
       * 设置图层可见性
       * @param {boolean} visible 是否可见
       */
      setVisible: function (visible) {
        this._visible = visible;
        if (this._layerId && this.completed) {
          let value = visible == true ? "visible" : "none";
          if (this._map["getLayer"](this._layerId)) {
            this._map["setLayoutProperty"](this._layerId, "visibility", value);
          }
          // 如果有标注图层，也设置可见性
          if (this._hybridLabelLayer && this._map.getLayer(this._hybridLabelLayer.layerId)) {
            this._map["setLayoutProperty"](this._hybridLabelLayer.layerId, "visibility", value);
          }
        }
      },
    });

    return DXMapBoxGaodeLayer;
  })(DXMapBoxVectorLayer);
  daximap["DXMapBoxGaodeLayer"] = DXMapBoxGaodeLayer;

  let DXMapBoxImageLayer = (function (DXSceneObject) {
    "use strict";
    let DXMapBoxImageLayer = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXMapBoxImageLayer";
        thisObject._source = null;
        thisObject._layerId = "";
        thisObject._id = "";
      },
      createLayer: function (options) {
        let thisObject = this;
        let sourceData = {
          type: "image",
        };
        if (options["url"]) {
          //[sw.lng, sw.lat, ne.lng, ne.lat]
          sourceData["url"] = options["url"];
        }
        if (options["coordinates"]) {
          sourceData["coordinates"] = options["coordinates"];
        }

        thisObject._map["addSource"](this._sourceId, sourceData);
        thisObject._source = thisObject._map["getSource"](thisObject._sourceId);
        let layerOptions = {
          id: this._layerId,
          type: "image",
          source: this._sourceId,
          paint: {},
        };
        this._mapSDK._coreMap.addToMapBox(layerOptions, "baseLayer");
        this.checkFloor();
      },

      updateImage: function (options) {
        // imageSource.updateImage({
        //     url: 'https://www.mapbox.com/images/bar.png',
        //     coordinates: [
        //     [-76.5433, 39.1857],
        //     [-76.5280, 39.1838],
        //     [-76.5295, 39.1768],
        //     [-76.5452, 39.1787]
        //     ]
        //});
        // let data = {url,coordinates};
        this._source["updateImage"](options);
      },
      setCoordinates: function (coordinates) {
        this._source["setCoordinates"](coordinates);
      },
    });
    return DXMapBoxImageLayer;
  })(DXSceneObject);
  daximap["DXMapBoxImageLayer"] = DXMapBoxImageLayer;

  //////////////////////////////////////////////////////////////
  // DXHeatMapLayer
  //////////////////////////////////////////////////////////////
  let DXHeatMapLayer = (function (DXSceneObject) {
    "use strict";
    let DXHeatMapLayer = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXHeatMapLayer";
        thisObject._source = null;

        let uuid = DXMapUtils.createUUID();
        let layerId = "heatmap_" + uuid;
        thisObject._id = thisObject._layerId = layerId;
      },
      initialize: function (mapSDK, options) {
        this._mapSDK = mapSDK;
        this._options = options;
        let maxRadius = options["maxRadius"] || 40,
          minRadius = options["minRadius"] || 5;
        options["minzoom"] = options["minzoom"] || 10;
        options["maxzoom"] = options["maxzoom"] || 22;
        options["minweight"] = options["minweight"] || 0;
        options["maxweight"] = options["maxweight"] || 10;
        options["heatmapWeight"] = options["heatmapWeight"] || [options["minweight"], 0, options["maxweight"], 1];
        options["heatmapIntensity"] = options["heatmapIntensity"] || [0, 1, 22, 5];
        options["linearColor"] = options["linearColor"] || [
          0,
          "rgba(33,102,172,0)",
          0.2,
          "rgb(103,169,207)",
          0.4,
          "rgb(209,229,240)",
          0.6,
          "rgb(253,219,199)",
          0.8,
          "rgb(239,138,98)",
          1,
          "rgb(178,24,43)",
        ];
        options["linearRadius"] = options["linearRadius"] || [options["minzoom"], minRadius, options["maxzoom"], maxRadius];
        options["linearOpacity"] = options["linearOpacity"] || [options["minzoom"], 1, options["maxzoom"], 0.1];
        // opacity
        this._map = this._mapSDK._coreMap._mapboxMap;
        this["addToMap"]();
      },

      addToMap: function () {
        let thisObject = this;
        let options = thisObject._options;
        let sourceData = {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        };
        if (options["url"]) {
          sourceData["data"] = options["url"];
        }
        let sourceId, layerId;
        sourceId = layerId = thisObject._layerId;
        thisObject._sourceId = sourceId;
        thisObject._map["addSource"](sourceId, sourceData);
        thisObject._source = thisObject._map["getSource"](sourceId);
        let heatmapOptions = {
          type: "heatmap",
          id: layerId,
          source: thisObject._sourceId,
          maxzoom: options["maxzoom"],
          minzoom: options["minzoom"],
          paint: {},
          layout: {},
        };

        // let heatmapOptions = {
        //     "type": "heatmap",
        //     "id": layerId,
        //     "maxzoom": options["maxzoom"] || 21,
        //     "paint": {
        //         // Increase the heatmap weight based on frequency and property magnitude
        //         "heatmap-weight": [
        //             "interpolate", ["linear"],
        //             ["get", "mag"],
        //             options["minweight"], 0,
        //             options["maxweight"], 1,
        //         ],
        //         // Increase the heatmap color weight weight by zoom level
        //         // heatmap-intensity is a multiplier on top of heatmap-weight
        //         "heatmap-intensity": [
        //             "interpolate", ["linear"],
        //             ["zoom"],
        //             options["minzoom"], 0,
        //             options["maxzoom"], options["maxweight"]
        //         ],// Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
        //         // Begin color ramp at 0-stop with a 0-transparancy color
        //         // to create a blur-like effect.
        //         "heatmap-color": [
        //             "interpolate", ["linear"],
        //             ["heatmap-density"],
        //             0, "rgba(33,102,172,0)",
        //             0.2, "rgb(103,169,207)",
        //             0.4, "rgb(209,229,240)",
        //             0.6, "rgb(253,219,199)",
        //             0.8, "rgb(239,138,98)",
        //             1, "rgb(178,24,43)"
        //         ],
        //         // Adjust the heatmap radius by zoom level
        //         "heatmap-radius": [
        //             "interpolate", ["linear"],
        //             ["zoom"],
        //             options["minzoom"], 5,
        //             options["maxzoom"], 30,
        //         ],
        //         // Transition from heatmap to circle layer by zoom level
        //         "heatmap-opacity": [
        //             "interpolate", ["linear"],
        //             ["zoom"],
        //             options["minzoom"], 1,
        //             options["maxzoom"], 0.5,
        //         ],

        //     },

        //     "layout": {

        //     },
        //     // "filter":["all",[">=" , ['zoom'],["get","minlevel"]],["<=" , ['zoom'],["get","maxlevel"]]],
        //     "source": thisObject._sourceId

        // };
        let paint = heatmapOptions["paint"];
        paint["heatmap-weight"] = ["interpolate", ["linear"], ["get", "count"]].concat(options["heatmapWeight"]);
        // 根据地图的缩放级别类设置热力图的强度，当缩放级别在0~9之间进行线性变化的时候，热力图的强度从1~3进行线性变化，小于0是 强度为0，大于9时强度为3，heatmap-intensity is a multiplier on top of heatmap-weight
        paint["heatmap-intensity"] = ["interpolate", ["linear"], ["zoom"]].concat(options["heatmapIntensity"]);
        paint["heatmap-color"] = ["interpolate", ["linear"], ["heatmap-density"]].concat(options["linearColor"]);
        // 热力图的一个点计算权重的时候计算的点的半径
        paint["heatmap-radius"] = ["interpolate", ["linear"], ["zoom"]].concat(options["linearRadius"]);
        // 透明度与级别变化
        paint["heatmap-opacity"] = ["interpolate", ["linear"], ["zoom"]].concat(options["linearOpacity"]);
        this._mapSDK._coreMap.addToMapBox(heatmapOptions, "baseLayer");
      },
      removeFromMap: function () {
        let thisObject = this;
        if (!thisObject._map["getLayer"](this._layerId)) {
          return;
        }

        thisObject._map["removeLayer"](this._layerId);
        thisObject._map["removeSource"](this._sourceId);
        let scene = thisObject._mapSDK._coreMap._scene;
        scene.removeChild(thisObject);
      },
      setSource: function (data) {
        // let options = this._options;
        if (typeof data == "string") {
        } else if (data.constructor.toString().indexOf("Array") != -1) {
          let geojson = {
            type: "FeatureCollection",
            features: data,
          };
        } else if (typeof data == "object") {
          let geojson = data;
        }
        // data 数据渲染
        this._source["setData"](geojson);
        this._mapSDK._coreMap.redraw();
      },
      setData: function (data) {
        let features = [];
        if (data["features"]) {
          features = data["features"];
        } else {
          data.forEach(function (item) {
            let feature = {
              type: "Feature",
              properties: { count: item["count"] },
              geometry: {
                type: "Point",
                coordinates: [item["lon"], item["lat"]],
              },
            };
            features.push(feature);
          });
        }

        this["setSource"](features);
      },
      clearData: function () {
        let geojson = {
          type: "FeatureCollection",
          features: [],
        };
        thisObject._source["setData"](geojson);
        thisObject._mapSDK._coreMap.redraw();
      },

      setFloorObject: function (floorObject) {
        this._floorObject = floorObject;
      },
      checkFloor: function () {
        let visible = this._visible;
        if (this._floorObject) {
          visible = visible && this._floorObject.visible;
        }
        if (this._layerId) {
          let value = visible == true ? "visible" : "none";
          if (this._map["getLayer"](this._layerId)) {
            this._map["setLayoutProperty"](this._layerId, "visibility", value);
          }
        }
      },
    });

    daximap.defineProperties(DXHeatMapLayer.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneObject.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          this._visible = val;
          this.checkFloor();
        },
      },
      floorId: {
        get: function () {
          return this._floorId;
        },
        set: function (val) {
          this._floorId = val;
        },
      },
    });
    return DXHeatMapLayer;
  })(DXSceneObject);
  //////////////////////////////////////////////////////////////
  // DXVectorLayer indoormap vectorlayer
  //////////////////////////////////////////////////////////////
  let DXVectorLayer = (function (DXModelLayer) {
    "use strict";
    let DXVectorLayer = DXModelLayer.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXVectorLayer";
        thisObject._cat = "indoor";
      },
    });

    daximap.defineProperties(DXVectorLayer.prototype, {
      /**
       * 对象的类别
       * @type String
       * @memberof DXSceneObject.prototype
       */
      cat: {
        get: function () {
          return this._cat;
        },
        set: function (val) {
          this._cat = val;
        },
      },
    });

    return DXVectorLayer;
  })(DXModelLayer);
  daximap["DXVectorLayer"] = DXVectorLayer;

  //////////////////////////////////////////////////////////////
  // DXPolyline 普通线
  //////////////////////////////////////////////////////////////
  let DXMapPolylineLayer = (function (DXMapBoxPolygonLayer) {
    "use strict";
    let DXMapPolylineLayer = DXMapBoxPolygonLayer.extend({
      __init__: function () {
        this["_super"]();
        this.layerType = "line";
        this.sourceType = "geojson";
        this._rtti = "DXMapPolylineLayer";
        this.featureType = "LineString";
        this.paintAttrs = [
          "line-blur",
          "line-gap-width",
          "line-color",
          "line-gradient",
          "line-offset",
          "line-opacity",
          "line-pattern",
          "line-translate",
          "line-translate-anchor",
          "line-width",
        ];
        this.layoutAttrs = ["line-cap", "line-join", "line-miter-limit", "line-round-limit", "line-sort-key", "visibility"];
        this.featureStates = {
          paint: ["line-blur", "line-color", "line-gap-width", "line-offset", "line-opacity", "line-width", "line-dasharray"],
          layout: ["line-sort-key"],
        };
        // this.featureStates = {"paint":[],"layout":[]};
        this.clickEventName = "polylineClick";
      },
      createLayer: function (options) {
        !options["line-color"] ? (options["line-color"] = "#009EFF") : "";
        !options["line-opacity"] ? (options["line-opacity"] = 1) : "";
        !options["line-join"] ? (options["line-join"] = "round") : "";
        if (options["type"] == "dashline") {
          options["line-dasharray"] ? "" : (options["line-dasharray"] = [2, 2]);
        }
        this["_super"](options);
      },

      setColor: function (lineColor) {
        this._options["line-color"] = lineColor;
        this._map["getLayer"](this._layerId)["setPaintProperty"]("line-color", lineColor);
      },
      setStyle: function (params) {
        let paintAttrs = this.paintAttrs;
        let layoutAttrs = this.layoutAttrs;
        for (let key in params) {
          if (paintAttrs.indexOf(key) != -1) {
            this._map["getLayer"](this._layerId)["setPaintProperty"](key, params[key]);
          }
          if (layoutAttrs.indexOf(key) != -1) {
            this._map["getLayer"](this._layerId)["setLayoutProperty"](key, params[key]);
          }
        }
      },
    });
    return DXMapPolylineLayer;
  })(DXMapBoxPolygonLayer);
  daximap["DXMapPolylineLayer"] = DXMapPolylineLayer;
  let DXMapBoxSymbol = (function (DXMapBoxPolygonLayer) {
    "use strict";
    let DXMapBoxSymbol = DXMapBoxPolygonLayer.extend({
      __init__: function () {
        this["_super"]();
        this.layerType = "symbol";
        this.sourceType = "geojson";
        this._rtti = "DXMapSymbol";
        //  feature attr *-allow-overlap will be visible even if it collides with other previously drawn symbols
        //               *-anchor One of "center", "left", "right", "top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right". Defaults to "center".
        this.layoutAttrs = [
          "icon-allow-overlap",
          "icon-anchor",
          "icon-ignore-placement",
          "icon-image",
          "icon-keep-up" /*require symbol-placement to be line or line-center*/,
          "icon-offset",
          "icon-optional",
          "icon-padding",
          "icon-pitch-alignment",
          "icon-rotate",
          "icon-rotation-alignment",
          "icon-size",
          "icon-text-fit",
          "icon-text-fit-padding",
          "text-allow-overlap",
          "text-anchor",
          "text-field",
          "text-font",
          "text-justify",
          "text-keep-upright",
          "text-line-height",
          "text-max-angle",
          "text-max-width",
          "text-offset",
          "text-optional",
          "text-padding",
          "text-pitch-alignment",
          "text-rotate",
          "text-rotation-alignment",
          "text-size",
          "text-transform",
          "symbol-avoid-edges",
          "symbol-placement",
          "symbol-sort-key",
          "symbol-spacing",
          "symbol-z-order",
        ];
        this.paintAttrs = [
          "icon-color",
          "icon-opacity",
          "icon-halo-blur",
          "icon-halo-color",
          "icon-halo-width",
          "icon-translate",
          "icon-translate-anchor",
          "text-color",
          "text-opacity",
          "text-halo-blur",
          "text-halo-color",
          "text-halo-width",
          "text-translate",
          "text-translate-anchor",
          "text-variable-anchor",
          "text-writing-mode",
        ];
        this.featureStates = {
          paint: [
            "icon-color",
            "icon-opacity",
            "icon-halo-blur",
            "icon-halo-color",
            "icon-halo-width",
            "text-color",
            "symbol-sort-key",
            "text-color",
            "text-opacity",
            "text-halo-blur",
            "text-halo-color",
            "text-halo-width",
          ],
          layout: ["icon-image", "icon-size", "text-field", "text-size"],
        };
        this.clickEventName = "symbolClick";
      },

      createLayer: function (options) {
        !options["text-font"] ? (options["text-font"] = ["DIN Offc Pro Italic", "Arial Unicode MS Regular"]) : "";
        this["_super"](options);
      },

      setColor: function (color) {
        this._options["text-color"] = color;
        this._map["getLayer"](this._layerId)["setPaintProperty"]("text-color", color);
      },
    });
    return DXMapBoxSymbol;
  })(DXMapBoxPolygonLayer);
  daximap["DXMapBoxSymbol"] = DXMapBoxSymbol;
  let DXMapCricleLayer = (function (DXMapBoxPolygonLayer) {
    "use strict";
    let DXMapCricleLayer = DXMapBoxPolygonLayer.extend({
      __init__: function () {
        this["_super"]();
        this.layerType = "circle";
        this.sourceType = "geojson";
        this._rtti = "DXMapCricleLayer";
        this.featureType = "Point";
        this.paintAttrs = [
          "circle-blur",
          "circle-color",
          "circle-radius",
          "circle-opacity",
          "circle-pitch-alignment",
          "circle-stroke-color",
          "circle-stroke-opacity",
          "circle-stroke-width",
          "circle-translate",
          "circle-translate-anchor",
        ];
        this.layoutAttrs = ["circle-sort-key", "visibility"];
        this.featureStates = {
          paint: ["circle-blur", "circle-color", "circle-radius", "circle-opacity", "circle-stroke-color", "circle-stroke-opacity", "circle-stroke-width"],
          layout: ["circle-sort-key"],
        };
        this.clickEventName = "circleClick";
      },
      createLayer: function (options) {
        // !options["circle-color"] ? (options["circle-color"] = '#ff000') : '';
        !options["circle-opacity"] ? (options["circle-opacity"] = 1) : "";
        this["_super"](options);
      },

      setColor: function (circleColor, featureId) {
        !featureId && (this._options["circle-color"] = circleColor);
        let source = this._map["getSource"](this._sourceId);
        let _data = source["_data"];
        if (_data["type"] == "FeatureCollection") {
          let features = _data["features"];
          features.forEach(function (feature) {
            let id = feature["properties"] && (feature["properties"]["id"] || feature["properties"]["FT_ID"]);
            if (!featureId || id == featureId) {
              feature["properties"]["circle-color"] = circleColor;
            }
          });
        } else if (_data["type"] == "Feature") {
          let id = _data["properties"] && (_data["properties"]["id"] || _data["properties"]["FT_ID"]);
          if (!featureId || id == featureId) {
            _data["properties"]["circle-color"] = circleColor;
          }
        }
        source["setData"](_data);
      },
      updateFeature: function (featureId, properties) {
        let source = this._map["getSource"](this._sourceId);
        let _data = source["_data"];
        if (_data["type"] == "FeatureCollection") {
          let features = _data["features"];
          features.forEach(function (feature) {
            let id = feature["properties"] && (feature["properties"]["id"] || feature["properties"]["FT_ID"]);
            if (id == featureId) {
              for (let key in properties) {
                feature["properties"][key] = properties[key];
              }
            }
          });
        } else if (_data["type"] == "Feature") {
          let id = _data["properties"] && (_data["properties"]["id"] || _data["properties"]["FT_ID"]);
          if (id == featureId) {
            for (let key in properties) {
              _data["properties"][key] = properties[key];
            }
          }
        }
        source["setData"](_data);
      },
      updateFeatures: function (newfeatures) {
        let source = this._map["getSource"](this._sourceId);
        let _data = source["_data"];
        if (_data["type"] == "FeatureCollection") {
          let features = _data["features"];
          newfeatures["features"].forEach(function (item) {
            let inData = false;
            features.forEach(function (feature) {
              let id = feature["properties"] && (feature["properties"]["id"] || feature["properties"]["FT_ID"]);
              if (item["id"] == id) {
                feature = item;
                inData = true;
              }
            });
            if (!inData) {
              _data.push(item);
            }
          });
        } else if (_data["type"] == "Feature") {
          let features = _data["features"];
          newfeatures["features"].forEach(function (item) {
            let inData = false;
            features.forEach(function (feature) {
              let id = _data["properties"] && (_data["properties"]["id"] || _data["properties"]["FT_ID"]);
              if (item["id"] == id) {
                feature = item;
                inData = true;
              }
            });
            if (!inData) {
              _data.push(item);
            }
          });
        }
        source["setData"](_data);
      },
      setStyle: function (params) {
        let paintAttrs = this.paintAttrs;
        let layoutAttrs = this.layoutAttrs;
        for (let key in params) {
          if (paintAttrs.indexOf(key) != -1) {
            this._map["getLayer"](this._layerId)["setPaintProperty"](key, params[key]);
          }
          if (layoutAttrs.indexOf(key) != -1) {
            this._map["getLayer"](this._layerId)["setLayoutProperty"](key, params[key]);
          }
        }
      },
      setVisible: function (visible) {
        this._visible = visible;
      },
    });
    return DXMapCricleLayer;
  })(DXMapBoxPolygonLayer);
  daximap["DXMapCricleLayer"] = DXMapCricleLayer;
  //////////////////////////////////////////////////////////////
  // DXSceneMarker single
  //////////////////////////////////////////////////////////////
  let DXSceneMarker = (function (DXSceneObject) {
    "use strict";
    let DXSceneMarker = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXSceneMarker";
        thisObject._featureId = "";
        thisObject._sourceId = "";
        thisObject._source = null;
        thisObject._options = null;
        thisObject._position = [0, 0];
        thisObject._highlight = false;
      },
      initialize: function (mapSDK, options) {
        this._mapSDK = mapSDK;
        this._options = options;
        this._featureId = options["featureId"] || "";
        this._map = this._mapSDK._coreMap._mapboxMap;
      },
      setVisible: function (visible) {
        this._visible = visible;
      },
      setPosition: function (lon, lat, heading, featureId, bdid, floorId) {
        let sourceObj = this._source;
        let data = sourceObj["_data"];

        data["features"].forEach(function (feature) {
          if (!featureId || featureId == feature["id"]) {
            if (heading != undefined) {
              feature["properties"]["rotate"] = heading;
            }
            feature["geometry"]["coordinates"] = [lon, lat];
          }
        });
        let markInfo = this._options;
        bdid != undefined ? (markInfo["bdid"] = bdid) : "";
        floorId != undefined ? (markInfo["floorId"] = floorId) : "";
        sourceObj["setData"](data);
        this.checkFloor();
      },
      addToMap: function () {
        if (!this._options) return;
        let thisObject = this;
        if (!thisObject._id) {
          thisObject._id = DXMapUtils.createUUID();
        }
        let markerInfo = this._options;
        let markerIcon = markerInfo["markerIcon"] || markerInfo["imageUrl"] || ""; // "blue_dot";
        let activeMarkerIcon = markerInfo["activeMarkerIcon"] || markerInfo["highlightImageUrl"] || markerIcon; //"red_dot";
        thisObject._layerId = thisObject._id;
        thisObject._sourceId = thisObject._id;
        if (markerIcon && activeMarkerIcon && markerIcon != activeMarkerIcon) {
          let markerImgLoaded = false,
            activeMarkerImgLoaded = false;
          let highlightOptions = {
            width: markerInfo["highlightWidth"] || markerInfo["width"],
            height: markerInfo["highlightHeight"] || markerInfo["height"],
            scale: markerInfo["highlightScale"] || markerInfo["scale"],
          };
          thisObject._mapSDK._coreMap.loadImage(markerIcon, markerIcon, markerInfo, function () {
            markerImgLoaded = true;
            if (activeMarkerImgLoaded) {
              thisObject.addSourceToMap(markerInfo, markerInfo["imgKey"] || markerIcon, markerInfo["highlightImgKey"] || activeMarkerIcon);
            }
          });
          // thisObject._mapSDK._coreMap.loadImage(activeMarkerIcon, activeMarkerIcon,highlightOptions, function () {
          thisObject._mapSDK._coreMap.loadImage(activeMarkerIcon, activeMarkerIcon, highlightOptions, function () {
            activeMarkerImgLoaded = true;
            markerInfo["highlightScale"] = highlightOptions["scale"];
            markerInfo["highlightImgKey"] = highlightOptions["imgKey"];
            if (markerImgLoaded) {
              thisObject.addSourceToMap(markerInfo, markerInfo["imgKey"] || markerIcon, markerInfo["highlightImgKey"] || activeMarkerIcon);
            }
          });
        } else {
          thisObject._mapSDK._coreMap.loadImage(markerIcon, markerIcon, markerInfo, function () {
            if (markerInfo["highlightWidth"] && markerInfo["width"]) {
              markerInfo["highlightScale"] = (markerInfo["scale"] || 1) * (markerInfo["highlightWidth"] / markerInfo["width"]);
            }
            thisObject.addSourceToMap(markerInfo, markerInfo["imgKey"] || markerIcon, markerInfo["imgKey"] || activeMarkerIcon);
          });
          // thisObject.addSourceToMap(markerInfo, markerInfo["imgKey"]||markerIcon, markerInfo["imgKey"]||activeMarkerIcon);
        }
      },
      addSourceToMap: function (markerInfo, markerIcon, activeMarkerIcon) {
        if (this.removed) {
          return;
        }
        let thisObject = this;
        let floorId = markerInfo["floorId"];

        let sourceData = {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                id: thisObject._layerId,
                geometry: {
                  type: "Point",
                  coordinates: [markerInfo["lon"], markerInfo["lat"]],
                },
                properties: {
                  id: thisObject._id,
                  featureId: markerInfo["featureId"],
                  bdid: markerInfo["bdid"] || "",
                  floorId: markerInfo["floorId"] || "",
                  floorName: markerInfo["floorName"] || "",
                  text: markerInfo["text"] || markerInfo["name"] || "",
                  name: markerInfo["name"] || "",
                  address: markerInfo["address"] || "",
                  active: markerInfo["active"] || false,
                  markerIcon: markerIcon || "",
                  activeMarkerIcon: activeMarkerIcon || "",
                  scale: markerInfo["scale"],
                  highlightScale: markerInfo["highlightScale"],
                  color: markerInfo["text-color"],
                  anchor: markerInfo["anchor"],
                  "text-anchor": markerInfo["text-anchor"],
                },
              },
            ],
          },
        };
        thisObject._map["addSource"](thisObject._sourceId, sourceData);
        thisObject._source = thisObject._map["getSource"](thisObject._sourceId);
        let defaultMarkerIcon = "";
        if (!markerInfo["name"]) {
          defaultMarkerIcon = "dot";
        }
        let markerOptions = {
          type: "symbol",
          id: thisObject._layerId,
          paint: {
            "text-color": ["string", ["get", "color"], "#202"], //"#363535"
            "text-halo-color": "#fff",
            "text-halo-width": 1,
          },
          layout: {
            "icon-image": [
              "case",
              ["==", ["get", "active"], true],
              ["string", ["get", "highlightImgKey"], ["get", "activeMarkerIcon"], ["concat", "red_", ["string", ["get", "icon"], defaultMarkerIcon]]],
              ["string", ["get", "imgKey"], ["get", "markerIcon"], ["concat", "blue_", ["string", ["get", "icon"], defaultMarkerIcon]]],
            ],
            "icon-size": ["case", ["==", ["get", "active"], true], ["number", ["get", "highlightScale"], 1], ["number", ["get", "scale"], 1]],
            // "icon-anchor": markerInfo["anchor"] || "bottom",
            // "icon-rotation-alignment": markerInfo["iconRotationAlignment"] || "auto",
            // "text-field": ['get', 'name'],
            // "text-font": ['DIN Offc Pro Italic', 'Arial Unicode MS Regular'],//['sans-serif'],//['NotoSansSCRegular'],//['Arial Unicode MS Regular'],//["Arial Unicode MS Bold"],//["Open Sans Regular"],//["Open Sans Semibold", "Arial Unicode MS Bold"],
            // "icon-offset":markerInfo["icon-offset"]||[0,1],
            // "text-offset":markerInfo["text-offset"] || [0, 0],//设置图标与图标注相对之间的距离
            // "text-anchor": ['string', ['get', 'text-anchor'], "center"],
            // "text-size": markerInfo["fontSize"]||12,
            // "text-justify": "center",
            // "text-line-height": 1,
            "icon-anchor": ["string", ["get", "anchor"], "bottom"],
            "icon-allow-overlap": markerInfo["icon-allow-overlap"] || false,
            "text-allow-overlap": markerInfo["text-allow-overlap"] || false,
            "text-anchor": ["string", ["get", "text-anchor"], "center"],
            // "text-field": ["case", ['==', ["get", "showText"], true],
            //   ["string", ["get", "text"], ["get", "name"]], ""
            // ],
            "text-field": ["string", ["get", "text"], ["get", "name"]],
            "text-size": ["number", ["get", "text-size"], 12],
            "text-justify": ["string", ["get", "text-justify"], "center"],
            "text-line-height": ["number", ["get", "text-line-height"], 1.2],
            "text-rotation-alignment": markerInfo["textRotationAlignment"] || "viewport",
            "icon-ignore-placement": !0, //By default icon-ignore-placement and text-ignore-placement are set to false. If set to true, other symbols can be visible even if they collide with the text or icon.
            "symbol-avoid-edges": !0,
          },
          source: thisObject._sourceId,
        };
        this._markerOptions = markerOptions;
        this._mapSDK._coreMap.addToMapBox(markerOptions, this._options["highlight"] ? "highlightMarkerLayer" : "normalMarkerLayer");
        this._map["on"]("click", this._layerId, thisObject._mapSDK._coreMap.activeFeature);
        this._map["on"]("mouseover", this._layerId, function (e) {
          if (e["originalEvent"]["shiftKey"] || e["originalEvent"]["ctrlKey"] || e["originalEvent"]["altKey"]) {
            return;
          }
          thisObject._options["onMouseOver"] && thisObject._options["onMouseOver"](thisObject);
        });
        this._map["on"]("mouseleave", this._layerId, function (e) {
          thisObject._options["onMouseLeave"] && thisObject._options["onMouseLeave"](thisObject);
        });

        let scene = thisObject._mapSDK._coreMap._scene;
        let sceneFloorObject = scene.getChildById((markerInfo["bdid"] || "") + floorId);
        if (sceneFloorObject) {
          this._floorObject = sceneFloorObject;
          this.checkFloor();
          scene.addChild(sceneFloorObject, thisObject);
        } else {
          if (floorId) {
            thisObject._mapSDK._coreMap._on("onIndoorBuildingLoaded", function (sender, building) {
              if (building && building.bdid == markerInfo["bdid"]) {
                let sceneFloorObject = scene.getChildById((markerInfo["bdid"] || "") + floorId);
                thisObject._floorObject = sceneFloorObject;
                thisObject.checkFloor();
                scene.addChild(sceneFloorObject, thisObject);
              }
            });
          } else {
            scene.addChild(scene.rootNode, thisObject);
          }
        }
      },
      removeFromMap: function () {
        let thisObject = this;
        this.removed = true;
        if (!thisObject._map["getLayer"](this._layerId)) {
          return;
        }
        thisObject._map["off"]("click", this._layerId, thisObject._mapSDK._coreMap.activeFeature);
        thisObject._map["off"]("mouseover", this._layerId);
        thisObject._map["off"]("mouseleave", this._layerId);
        thisObject._map["removeLayer"](this._layerId);
        thisObject._map["removeSource"](this._sourceId);
        let scene = thisObject._mapSDK._coreMap._scene;
        scene.removeChild(thisObject);
      },
      setZIndexOffset: function (icon) {},
      highlightMarker: function (val) {
        let thisObject = this;
        if (thisObject._highlight === val) return;
        thisObject._highlight = val;
        let data = thisObject._source["_data"];
        let feature = data["features"][0];
        feature["properties"]["active"] = val;
        thisObject._source["setData"](data);

        thisObject._map["removeLayer"](thisObject._layerId);
        let layerData = thisObject._markerOptions;
        this._mapSDK._coreMap.addToMapBox(layerData, val ? "highlightMarkerLayer" : "normalMarkerLayer");
        this.checkFloor();
      },
      checkFloor: function () {
        let visible = this.checkVisible();
        let value = visible == true ? "visible" : "none";
        if (this._map["getLayer"](this._layerId)) {
          this._map["setLayoutProperty"](this._layerId, "visibility", value);
        }
      },
      checkVisible: function () {
        let visible = this._visible;
        if (this._floorObject) {
          visible = visible && this._floorObject.visible;
        } else {
          let scene = this._mapSDK._coreMap._scene;
          let bdid = this._options["bdid"];
          if (bdid) {
            let bdObject = scene.getChildById(bdid);
            visible = visible && bdObject.visible;
          }
          let floorId = this._options["floorId"];
          if (floorId && floorId != "outdoor") {
            let sceneFloorObject = scene.getChildById(bdid + floorId);
            visible = visible && sceneFloorObject && sceneFloorObject.visible;
          }
        }
        return visible;
      },
    });

    daximap.defineProperties(DXSceneMarker.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneMarker.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          if (val != this._visible) {
            this._visible = val;
            this.checkFloor();
          }
        },
      },
    });
    return DXSceneMarker;
  })(DXSceneObject);
  daximap["DXSceneMarker"] = DXSceneMarker;

  //////////////////////////////////////////////////////////////
  // DXSceneMarkerLayer
  //////////////////////////////////////////////////////////////
  let DXSceneMarkerLayer = (function (DXSceneObject) {
    "use strict";
    let DXSceneMarkerLayer = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXSceneMarkerLayer";
        thisObject._featureId = "";
        thisObject._sourceId = "";
        thisObject._source = null;
        thisObject._options = null;
        thisObject._position = [0, 0];
        thisObject._highlight = false;
        thisObject._sourceData = [];
        thisObject._onMarkerClicked = function (e) {
          thisObject.activeFeature(e);
        };
        thisObject._onMouseOverEvent = function (e) {
          thisObject.onMouseOverEvent(e);
        };
        thisObject._onMouseMoveEvent = function (e) {
          thisObject.onMouseMoveEvent(e);
        };
        thisObject._onMouseLeaveEvent = function (e) {
          thisObject.onMouseLeaveEvent(e);
        };
      },
      initialize: function (mapSDK, options) {
        this._mapSDK = mapSDK;
        this._options = options;
        this._bdid = options["bdid"] || "";
        this._floorId = options["floorId"] || "";
        this._featureId = options["featureId"] || "";
        this._id = options["id"] || this._featureId || DXMapUtils.createUUID();
        this._map = this._mapSDK._coreMap._mapboxMap;
        if (options["visible"] != undefined) {
          this._visible = options["visible"];
        }
        let thisObject = this;
        mapSDK._on("onIndoorBuildingActive", function (sender, building) {
          thisObject.checkFloor();
        });
        mapSDK._eventMgr.on("changeFloor", function (sender, floorId) {
          thisObject.checkFloor();
        });
      },
      setVisible: function (visible, checkVisible) {
        this._visible = visible;
        this.checkFloor();
      },
      getRangePoint: function (floorId) {
        let features = this._source["_data"]["features"];
        let minLon = 400,
          minLat = 200,
          maxLon = 0,
          maxLat = 0;
        features.forEach(function (feature) {
          if (floorId && feature["properties"]["floorId"] != floorId) {
            return;
          }
          let coordinates = feature["geometry"]["coordinates"];
          if (coordinates[0] < minLon) {
            minLon = coordinates[0];
          }
          if (coordinates[0] > maxLon) {
            maxLon = coordinates[0];
          }
          if (coordinates[1] < minLat) {
            minLat = coordinates[1];
          }
          if (coordinates[1] > maxLat) {
            maxLat = coordinates[1];
          }
        });
        return { minLon: minLon, minLat: minLat, maxLon: maxLon, maxLat: maxLat };
      },
      setFeatureVisible: function (featureId, visible) {
        this._sourceData.forEach(function (feature) {
          if (feature["properties"]["id"] == featureId) {
            feature["properties"]["visible"] = visible;
          }
        });
        // if (this._layerId) {
        //   let data = {
        //     "type": "FeatureCollection",
        //     "features": this._sourceData
        //   };
        //   let source = this._map["getSource"](this._layerId);
        //   source && source["setData"](data);
        // }
        this.updateSourceData();
      },
      getFeatureVisible: function (featureId) {
        let visible = false;
        this._sourceData.forEach(function (feature) {
          if (feature["properties"]["id"] == featureId) {
            visible = feature["properties"]["visible"] === false ? false : true;
          }
        });
        return visible;
      },
      dataToFeature: function (markerInfo) {
        markerInfo["id"] = markerInfo["id"] || markerInfo["featureId"] || DXMapUtils.createUUID();
        if (markerInfo["noIcon"]) {
          let markerIcon = "";
          let activeMarkerIcon = "";
        } else {
          let markerIcon = (markerInfo["markerIcon"] = markerInfo["markerIcon"] || markerInfo["imageUrl"] || "blue_dot");
          let activeMarkerIcon = markerInfo["activeMarkerIcon"] || markerInfo["highlightImageUrl"] || "";
          if (markerIcon == "blue_dot" && !activeMarkerIcon) {
            activeMarkerIcon = "red_dot";
          } else if (!activeMarkerIcon) {
            activeMarkerIcon = markerIcon;
          }
        }

        !markerInfo["bdid"] ? (markerInfo["bdid"] = "") : "";
        markerInfo["visible"] == undefined ? (markerInfo["visible"] = true) : "";
        markerInfo["active"] == undefined ? (markerInfo["active"] = false) : "";
        markerInfo["markerIcon"] = markerIcon;
        markerInfo["activeMarkerIcon"] = activeMarkerIcon;
        markerInfo["featureId"] = markerInfo["id"];
        let feature = {
          type: "Feature",
          id: markerInfo["id"],
          geometry: {
            type: "Point",
            coordinates: [markerInfo["lon"], markerInfo["lat"]],
          },
          properties: markerInfo,
        };
        return feature;
      },
      setData: function (markersInfo) {
        let thisObject = this;
        this._sourceData = [];
        let loadedCount = 0;
        if (markersInfo.length == 0) {
          thisObject.updateSourceData();
          return;
        }
        markersInfo.forEach(function (markerInfo, index, arr) {
          let feature = thisObject.dataToFeature(markerInfo);
          let markerIcon = feature["properties"]["markerIcon"];
          let activeMarkerIcon = feature["properties"]["activeMarkerIcon"];
          thisObject._sourceData.push(feature);
          thisObject.loadIconImage(markerIcon, activeMarkerIcon, markerInfo, function () {
            loadedCount++;
            if (loadedCount == arr.length) {
              thisObject.updateSourceData();
            }
          });
        });
      },
      loadIconImage: function (markerIcon, activeMarkerIcon, markerInfo, callback) {
        if (!markerIcon && !activeMarkerIcon) {
          callback && callback();
          return;
        }
        let thisObject = this;
        let markerImgLoaded = false,
          activeMarkerImgLoaded = false;

        let highlightOptions = {
          width: markerInfo["highlightWidth"] || markerInfo["width"],
          height: markerInfo["highlightHeight"] || markerInfo["height"],
          scale: markerInfo["highlightScale"] || markerInfo["scale"],
        };
        if (markerIcon && activeMarkerIcon && !markerInfo["highlightLater"]) {
          if (markerIcon == activeMarkerIcon) {
            markerImgLoaded = true;
          }
          thisObject._mapSDK._coreMap.loadImage(activeMarkerIcon, activeMarkerIcon, highlightOptions, function () {
            activeMarkerImgLoaded = true;
            markerInfo["highlightScale"] = highlightOptions["scale"];
            markerInfo["highlightImgKey"] = highlightOptions["imgKey"];
            if (markerIcon == activeMarkerIcon) {
              markerInfo["imgKey"] = markerInfo["highlightImgKey"];
              !markerInfo["scale"] && markerInfo["highlightScale"]
                ? (markerInfo["scale"] = markerInfo["highlightScale"] * (markerInfo["width"] ? markerInfo["width"] / highlightOptions["width"] : 1))
                : "";
            }
            if (markerImgLoaded) {
              callback && callback();
            }
          });

          if (markerIcon != activeMarkerIcon) {
            thisObject._mapSDK._coreMap.loadImage(markerIcon, markerIcon, markerInfo, function () {
              markerImgLoaded = true;
              if (activeMarkerImgLoaded) {
                callback && callback();
              }
            });
          }
        } else if (markerIcon) {
          thisObject._mapSDK._coreMap.loadImage(markerIcon, markerIcon, markerInfo, function () {
            if (activeMarkerIcon == markerIcon && !markerInfo["highlightScale"]) {
              if (markerInfo["width"] && markerInfo["highlightWidth"]) {
                markerInfo["highlightScale"] = (markerInfo["scale"] * markerInfo["highlightWidth"]) / markerInfo["width"];
              } else {
                markerInfo["highlightScale"] = markerInfo["scale"];
              }
            }
            callback && callback();
          });
        } else {
          callback && callback();
        }
      },

      addFeature: function (markerInfo) {
        this["addFeatures"]([markerInfo]);
      },

      addFeatures: function (markerInfos) {
        let thisObject = this;
        let imgLoadedCount = 0;
        markerInfos.forEach(function (markerInfo) {
          let feature = thisObject.dataToFeature(markerInfo);
          let markerIcon = feature["properties"]["markerIcon"];
          let activeMarkerIcon = feature["properties"]["activeMarkerIcon"];
          thisObject._sourceData.push(feature);
          thisObject.loadIconImage(markerIcon, activeMarkerIcon, markerInfo, function () {
            feature["properties"]["scale"] = markerInfo["scale"];
            feature["properties"]["imgKey"] = markerInfo["imgKey"];

            imgLoadedCount++;
            if (imgLoadedCount == markerInfos.length) {
              thisObject.updateSourceData();
            }
          });
        });
      },
      removeFeature: function (featureId) {
        this["removeFeatures"]([featureId]);
      },
      removeFeatures: function (featureIds) {
        if (featureIds.length == 0) {
          this._sourceData = [];
        } else {
          let sourceData = this._sourceData;
          for (let i = 0, len = sourceData.length; i < len; i++) {
            let feature = sourceData[i];

            let index = featureIds.indexOf(feature["properties"]["id"]);
            if (index != -1) {
              sourceData.splice(i, 1);
              featureIds.splice(index, 1);
              i--;
              len--;
            }
            if (featureIds.length == 0) {
              break;
            }
          }
        }
        this.updateSourceData();
      },
      updateFeature: function (featureId, markerInfo) {
        this["removeFeature"](featureId);
        this["addFeature"](markerInfo);
      },
      setPosition: function (lon, lat, heading, featureId, bdid, floorId) {
        let sourceData = this._sourceData;
        sourceData.forEach(function (feature) {
          if (heading != undefined) {
            feature["properties"]["rotate"] = heading;
          }
          if (feature["properties"]["id"] == featureId) {
            feature["geometry"]["coordinates"] = [lon, lat];
            if (floorId != undefined) {
              feature["properties"]["floorId"] = floorId;
            }
            if (bdid != undefined) {
              feature["properties"]["bdid"] = bdid;
            }
          }
        });
        this.updateSourceData();
      },
      addToMap: function () {
        if (!this._options) return;
        let thisObject = this;
        let markersInfo = this._options["markers"];
        thisObject._layerId = thisObject._id;
        thisObject._sourceId = thisObject._id;
        let loadedCount = 0;
        if (markersInfo.length == 0) {
          thisObject.addSourceToMap();
          return;
        }
        markersInfo.forEach(function (markerInfo, index, arr) {
          let feature = thisObject.dataToFeature(markerInfo);
          let markerIcon = feature["properties"]["markerIcon"];
          let activeMarkerIcon = feature["properties"]["activeMarkerIcon"];
          thisObject._sourceData.push(feature);
          thisObject.loadIconImage(markerIcon, activeMarkerIcon, markerInfo, function () {
            loadedCount++;
            if (loadedCount == arr.length) {
              thisObject.addSourceToMap(markersInfo, markerIcon, activeMarkerIcon);
            }
          });
        });
        let scene = thisObject._mapSDK._coreMap._scene;
        let bdid = thisObject._options["bdid"] || "";
        let floorId = thisObject._options["floorId"] || "";
        let sceneFloorObject = scene.getChildById(bdid + floorId);
        if (floorId) {
          if (sceneFloorObject) {
            this._floorObject = sceneFloorObject;
            this.checkFloor();
            scene.addChild(sceneFloorObject, thisObject);
          } else {
            thisObject._mapSDK._coreMap._on("onIndoorBuildingLoaded", function (sender, building) {
              if (building && building.bdid == bdid) {
                let sceneFloorObject = scene.getChildById(bdid + floorId);
                if (!sceneFloorObject) {
                  console.log("not found sceneFloorObject", bdid, floorId);
                  return;
                }
                thisObject._floorObject = sceneFloorObject;
                thisObject.checkFloor();
                scene.addChild(sceneFloorObject, thisObject);
              }
            });
          }
        } else {
          if (bdid && bdid != "outdoor") {
            let sceneBuildingObject = scene.getChildById(bdid);
            scene.addChild(sceneBuildingObject, thisObject);
          } else {
            scene.addChild(scene.rootNode, thisObject);
          }
        }
      },

      updateSourceData: function () {
        this._sourceData.sort(function (feature) {
          if (feature["properties"]["active"]) {
            return 1;
          } else {
            return -1;
          }
        });
        if (this._map["getSource"](this._sourceId)) {
          let sourceData = {
            type: "FeatureCollection",
            features: this._sourceData,
          };
          this._map["getSource"](this._sourceId)["setData"](sourceData);
        }
        this.checkFloor();
      },

      addSourceToMap: function () {
        let thisObject = this;
        let sourceData = {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: this._sourceData,
          },
        };
        thisObject._map["addSource"](thisObject._sourceId, sourceData);
        thisObject._source = thisObject._map["getSource"](thisObject._sourceId);
        let markerOptions = {
          type: "symbol",
          id: thisObject._layerId,
          paint: {
            "icon-translate": this._options["icon-translate"] || [0, 0],
            "icon-translate-anchor": this._options["icon-translate-anchor"] || "map",
            "icon-color": ["string", ["get", "iconColor"], "#f00"],
            "icon-opacity": ["number", ["get", "iconOpacity"], 1],
            "text-color": ["string", ["get", "color"], ["get", "textColor"], "#202"],
            "text-opacity": ["number", ["get", "textOpacity"], 1],
            "text-halo-color": ["string", ["get", "text-halo-color"], "#fff"],
            "text-halo-width": 1,
            "text-halo-blur": 1,
          },
          layout: {
            "icon-image": [
              "case",
              ["==", ["get", "active"], true],
              ["string", ["get", "highlightImgKey"], ["get", "activeMarkerIcon"], ["concat", "red_", ["string", ["get", "icon"], "dot"]]],
              [
                "string",
                ["get", "imgKey"],
                ["get", "markerIcon"],
                ["case", ["==", ["get", "cluster"], true], "blue_0", ["concat", "blue_", ["string", ["get", "icon"], "dot"]]],
              ],
              // // ["string",['!=',['get','activeMarkerIcon'],null],['get','activeMarkerIcon'],['concat',"red_",["string",['!=', ['get', 'icon'], null],['get', 'icon'],"dot"]]],
              // // ["string",['!=',['get','markerIcon'],null],['get','markerIcon'],['concat',"blue_",["string",['!=', ['get', 'icon'], null],['get', 'icon'],"dot"]]],
              // ["string",['!=',['get','activeMarkerIcon'],null],['get','activeMarkerIcon'],['concat',"red_",["string",['!=', ['get', 'icon'], null],['get', 'icon'],"dot"]]],
              // ["string",['!=',['get','markerIcon'],null],['get','markerIcon'],["string",['==', ['get', 'cluster'], true],"blue_0",['concat',"blue_",["string",['!=', ['get', 'icon'], null],['get', 'icon'],"dot"]]]],
            ],
            // "icon-size": ['get','active'] || 0.5,
            // "icon-anchor": ['get','active']||"bottom",
            "icon-size": ["case", ["==", ["get", "active"], true], ["number", ["get", "highlightScale"], 0.5], ["number", ["get", "scale"], 0.5]],

            "icon-offset": ["case", ["!=", ["get", "iconOffset"], null], ["get", "iconOffset"], ["literal", [0, 0]]], //Positive values indicate right and down, while negative values indicate left and up.Each component is multiplied by the value of icon-size to obtain the final  the final offset in pixels
            "icon-text-fit": this._options["icon-text-fit"] || "none",
            "icon-anchor": ["string", ["get", "anchor"], "bottom"], // "center", "left", "right", "top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"
            "icon-rotate": ["get", "icon-rotate"],
            "icon-rotation-alignment": this._options["icon-rotation-alignment"] || "auto",
            "icon-allow-overlap": this._options["icon-allow-overlap"] || false,
            "text-allow-overlap": this._options["text-allow-overlap"] || false,
            "text-anchor": ["string", ["get", "text-anchor"], "center"],
            "text-field": ["case", ["==", ["get", "showText"], true], ["string", ["get", "text"], ["get", "name"]], ""],
            "text-size": ["number", ["get", "text-size"], 12],
            "text-offset": ["case", ["!=", ["get", "textOffset"], null], ["get", "textOffset"], ["literal", [0, 0]]],
            "text-justify": ["string", ["get", "text-justify"], "center"],
            "text-line-height": ["number", ["get", "text-line-height"], 1.2],
            "text-padding": this._options["text-padding"] != undefined ? this._options["text-padding"] : 1,
            "symbol-placement": this._options["symbol-placement"] || "point",
            "symbol-avoid-edges": this._options["symbol-avoid-edges"] != undefined ? this._options["symbol-avoid-edges"] : false, //!0, //['case',['!=',["get","avoid-edges"],null],["get","avoid-edges"],false],
            "icon-ignore-placement": !0,
            "symbol-sort-key": 1,
            "symbol-z-order": "source",
            visibility: thisObject.checkVisible() ? "visible" : "none",
          },
          // "filter": ["all",[">=", ['zoom'],(this._options["minZoom"]||3)],["<=", ['zoom'],(this._options["maxZoom"]||24)]],
          filter: [
            "all",
            [">=", ["zoom"], ["number", ["get", "minLevel"], ["get", "minZoom"], 3]],
            ["<=", ["zoom"], ["number", ["get", "maxLevel"], ["get", "maxZoom"], 24]],
          ],
          source: thisObject._sourceId,
        };
        if (["both", "width", "height"].indexOf(this._options["icon-text-fit"]) != -1 && this._options["icon-text-fit-padding"]) {
          // Requires icon-text-fit to be "both", or "width", or "height".
          markerOptions["layout"]["icon-text-fit-padding"] = this._options["icon-text-fit-padding"];
        }

        if (this._options["filter"]) {
          markerOptions["filter"] = this._options["filter"];
        }

        this._markerOptions = markerOptions;
        if (markerOptions["zIndex"] != undefined) {
          let routeLayerIndex,
            normalMarkerLayerIndex,
            firstMarkerLayerId,
            topLayerId = "normalMarkerLayer"; //默认添加在marker的最上层
          let layers = this._mapSDK._coreMap._mapboxMap.getStyle()["layers"];
          for (let i = 1; i < layers.length; i++) {
            if (layer[i]["id"] == "routeLayer") {
              routeLayerIndex = i;
              firstMarkerLayerId = layer[i + 1]["id"];
              continue;
            }
            if (routeLayerIndex == undefined) {
              continue;
            }
            if (layer[i]["id"] == "normalMarkerLayer") {
              normalMarkerLayerIndex = i;
              if (!topLayerId) {
                topLayerId = "normalMarkerLayer";
              }
              break;
            }
            if (layer[i].zIndex > markerOptions["zIndex"]) {
              topLayerId = layer[i]["id"];
              break;
            }
          }
        } else {
          markerOptions.zIndex = 0;
          this._mapSDK._coreMap.addToMapBox(markerOptions, "normalMarkerLayer");
        }
        let thisObject = this;
        this._map["on"]("click", this._layerId, this._onMarkerClicked);
        this._map["on"]("mouseover", this._layerId, thisObject._onMouseOverEvent);
        this._map["on"]("mousemove", this._layerId, thisObject._onMouseMoveEvent);
        this._map["on"]("mouseleave", this._layerId, thisObject._onMouseLeaveEvent);
      },
      activeFeature: function (e) {
        let feature = e["features"][0];
        if (feature && feature["properties"]["cluster"]) {
          this._map["getSource"](this._sourceId).getClusterExpansionZoom(feature.id, function (err, zoom) {
            if (err) return;
            this._map["easeTo"]({
              center: feature.geometry.coordinates,
              zoom: zoom + 0.5,
            });
          });
        } else {
          // feature
          let properties = feature["properties"];
          if (this._options["onClick"]) {
            this._options["onClick"](properties);
          } else {
            this["highlightMarker"](properties["id"]);
          }
        }
      },
      lastMouseOverData: null,
      onMouseOverEvent: function (e) {
        if (e["originalEvent"]["shiftKey"] || e["originalEvent"]["ctrlKey"] || e["originalEvent"]["altKey"]) {
          return;
        }
        this.lastMouseOverData = e["features"];
        let feature = e["features"][0];
        if (feature && feature["properties"]["cluster"]) {
          // this._map["getSource"](this._sourceId).getClusterExpansionZoom(feature.id,function(err, zoom){
          //     if (err) return;
          //         this._map.easeTo({
          //             center: feature.geometry.coordinates,
          //             zoom: zoom+0.5
          //         });
          //     });
        } else {
          // feature
          let properties = feature["properties"];
          if (this._options["onMouseOver"]) {
            this._options["onMouseOver"](properties);
          }
        }
      },
      onMouseMoveEvent: function (e) {
        if (e["originalEvent"]["shiftKey"] || e["originalEvent"]["ctrlKey"] || e["originalEvent"]["altKey"]) {
          return;
        }
        if (e["features"] && (!this.lastMouseOverData || this.lastMouseOverData[0]["properties"]["id"] != e["features"][0]["properties"]["id"])) {
          this.lastMouseOverData && this.onMouseLeaveEvent();
          this.lastMouseOverData = e["features"];
        } else {
          return;
        }
        let feature = e["features"][0];
        if (feature && feature["properties"]["cluster"]) {
        } else {
          // feature
          let properties = feature["properties"];
          if (this._options["onMouseOver"]) {
            this._options["onMouseOver"](properties);
          }
        }
      },
      onMouseLeaveEvent: function () {
        let features = this.lastMouseOverData;
        let feature = features[0];
        if (feature && feature["properties"]["cluster"]) {
        } else {
          // feature
          let properties = feature["properties"];
          if (this._options["onMouseLeave"]) {
            this._options["onMouseLeave"](properties);
          }
        }
      },
      removeFromMap: function () {
        let thisObject = this;
        if (!thisObject._map["getLayer"](this._layerId)) {
          return;
        }

        this._map["off"]("click", this._layerId, this._onMarkerClicked);
        this._map["off"]("mouseover", this._layerId, thisObject._onMouseOverEvent);
        this._map["off"]("mousemove", this._layerId, thisObject._onMouseMoveEvent);
        this._map["off"]("mouseleave", this._layerId, thisObject._onMouseLeaveEvent);

        thisObject._map["removeLayer"](this._layerId);
        thisObject._map["removeSource"](this._sourceId);
        let scene = thisObject._mapSDK._coreMap._scene;
        scene.removeChild(thisObject);
        this._sourceData = [];
      },
      isEmpty: function () {
        if (this._sourceData.length == 0) {
          return true;
        } else {
          return false;
        }
      },
      setZIndexOffset: function (icon) {},
      highlightMarker: function (id) {
        let sourceData = this._sourceData;
        let existFeature = false;
        let activeFeature = null;
        sourceData.forEach(function (feature) {
          let properties = feature["properties"];
          if (properties["id"] == id) {
            properties["active"] = true;
            if (properties["highlightLater"] || !properties["loaded"]) {
              activeFeature = properties;
            }
            existFeature = true;
          } else {
            properties["active"] = false;
          }
        });
        if (activeFeature) {
          let thisObject = this;
          let markerIcon = activeFeature["activeMarkerIcon"] || activeFeature["highlightImageUrl"];
          let highlightOptions = {
            width: activeFeature["highlightWidth"] || activeFeature["width"],
            height: activeFeature["highlightHeight"] || activeFeature["height"],
            scale: activeFeature["highlightScale"] || activeFeature["scale"],
          };
          thisObject._mapSDK._coreMap.loadImage(markerIcon, markerIcon, highlightOptions, function () {
            activeFeature["highlightScale"] = highlightOptions["scale"];
            activeFeature["highlightImgKey"] = highlightOptions["imgKey"];
            activeFeature["loaded"] = true;
            thisObject.updateSourceData();
          });
        } else {
          this.updateSourceData();
        }
        return existFeature;
      },
      checkFloor: function () {
        if (!this._map["getLayer"](this._layerId)) {
          return;
        }
        let visible = this.checkVisible();

        let value = visible == true ? "visible" : "none";
        if (this._map["getLayer"](this._layerId)) {
          this._map["setLayoutProperty"](this._layerId, "visibility", value);
        }
      },
      checkVisible: function () {
        let visible = this._visible;
        if (this._floorObject) {
          visible = visible && this._floorObject.visible;
        }
        return visible;
      },
      getBoundsByVisibleData: function () {
        let sourceData = this._sourceData;
        let aabb = navi_utils.AABB_create();
        sourceData.forEach(function (feature) {
          let properties = feature["properties"];
          let pos = [properties["lon"], properties["lat"], 0];
          navi_utils.AABB_mergePoint(aabb, aabb, pos);
        });
        // let min = aabb._min,
        // max = aabb._max;
        if (navi_utils.AABB_isValid(aabb)) {
          // let centerLon = (max[0] + min[0]) * 0.5,
          // centerLat = (max[1] + min[1]) * 0.5;
          return { _max: aabb._max, _min: aabb._min };
        } else {
          return false;
        }
      },
    });

    daximap.defineProperties(DXSceneMarkerLayer.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneMarkerLayer.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          if (this._floorId) {
            if (val != this._visible) {
              this._visible = val;
              this.checkFloor();
            }
          } else {
            this._visible = val;
            this.checkFloor();
          }
        },
      },
    });
    return DXSceneMarkerLayer;
  })(DXSceneObject);
  daximap["DXSceneMarkerLayer"] = DXSceneMarkerLayer;

  //////////////////////////////////////////////////////////////
  // DXSceneMarkerManager
  //////////////////////////////////////////////////////////////
  let DXSceneMarkerManager = function (mapSDK) {
    let thisObject = this;
    let proto = DXSceneMarkerManager.prototype;
    this.mapSDK = mapSDK;
    this.markerLayers = {};
    this.markerMap = {};
    proto.initialize = function () {};
    proto.clearAll = function () {
      this.markerMap = {};
      for (let key in this.markerLayers) {
        this.markerLayers[key]["removeFromMap"]();
        delete this.markerLayers[key];
      }
      this.markerLayers = {};
    };
    function generateMarker(markerOption, markerLayer) {
      let markerObj = {};
      markerObj["_options"] = markerOption;
      markerObj["_parentLayer"] = markerLayer;
      markerObj["removeFromMap"] = function () {
        let id = markerObj["_options"]["featureId"];
        if (!thisObject.markerMap[id]) {
          return;
        }
        markerObj["_parentLayer"]["removeFeature"](id);
        delete thisObject.markerMap[id];
        if (markerObj["_parentLayer"].isEmpty()) {
          markerObj["_parentLayer"]["removeFromMap"]();
          delete thisObject.markerLayers[markerObj["_parentLayer"].id];
        }
      };
      markerObj["updateFeature"] = function (data) {
        let markerInfo = markerObj["_options"];
        for (let key in data) {
          if (key != "id") {
            markerInfo[key] = data[key];
          }
        }
        markerObj["_parentLayer"]["updateFeature"](markerInfo["featureId"], markerInfo);
      };
      markerObj["setPosition"] = function (floorId, lon, lat, heading, bdid) {
        let markerInfo = markerObj["_options"];
        floorId != null ? (markerInfo["floorId"] = floorId) : "";
        if (lon && lat) {
          ((lon = parseFloat(lon)), (lat = parseFloat(lat)));
          markerInfo["lon"] = lon;
          markerInfo["lat"] = lat;
          markerObj["_parentLayer"]["setPosition"](lon, lat, heading, markerInfo["featureId"], bdid, floorId);
        }
      };
      markerObj["setVisible"] = function (visible) {
        let markerInfo = markerObj._options;
        if (!markerInfo) {
          return;
        }
        markerObj["_parentLayer"]["setFeatureVisible"](markerInfo["featureId"], visible);
        markerInfo.visible = visible;
      };
      markerObj["getVisible"] = function () {
        let markerInfo = markerObj._options;
        return markerObj["_parentLayer"]["getFeatureVisible"](markerInfo["featureId"]);
      };
      markerObj["setHighlight"] = function (highlight) {
        let markerInfo = markerObj["_options"];
        if (highlight == undefined || highlight == true) {
          markerObj["_parentLayer"]["highlightMarker"](markerInfo["featureId"]);
        } else {
          markerObj["_parentLayer"]["highlightMarker"]("");
        }
      };

      return markerObj;
    }
    proto.onMarkerClick = function (properties, thisObject) {
      let id = properties["id"] || "";
      if (thisObject.markerMap[id]) {
        // this.markerMap[id]["_parentLayer"]["highlightMarker"](id);
        if (thisObject.markerMap[id]["_options"]["onClick"]) {
          thisObject.markerMap[id]["_options"]["onClick"](thisObject.markerMap[id]);
        } else {
          thisObject.markerMap[id]["_parentLayer"]["highlightMarker"](id);
        }
      }
    };
    proto.onMouseOver = function (properties, thisObject) {
      let id = properties["id"] || "";
      if (thisObject.markerMap[id]) {
        thisObject.markerMap[id]["_options"]["onMouseOver"] && thisObject.markerMap[id]["_options"]["onMouseOver"](thisObject.markerMap[id]);
      }
    };
    proto.onMouseLeave = function (properties, thisObject) {
      let id = properties["id"] || "";
      if (thisObject.markerMap[id]) {
        thisObject.markerMap[id]["_options"]["onMouseLeave"] && thisObject.markerMap[id]["_options"]["onMouseLeave"](thisObject.markerMap[id]);
      }
    };
    proto.addFeatureToLayer = function (featureInfo, layerType) {
      let thisObject = this;
      let bdid = featureInfo["bdid"] || "";
      let floorId = featureInfo["floorId"] || "";
      if (!featureInfo["bdid"]) {
        featureInfo["bdid"] = bdid;
      }
      if (!featureInfo["floorId"]) {
        featureInfo["floorId"] = floorId;
      }
      let id = featureInfo["id"] || featureInfo["poiId"] || DXMapUtils.createUUID();
      let layerId = (layerType || "customer_markerlayer") + "_" + bdid + floorId;
      let markerOption = { featureId: id, bdid: bdid, floorId: floorId, imageUrl: "blue_dot", highlightImageUrl: "red_dot", scale: 0.5 };
      for (let key in featureInfo) {
        markerOption[key] = featureInfo[key];
      }
      if (!this.markerLayers[layerId]) {
        let markers = [];
        markers.push(markerOption);
        let markerLayer = new DXSceneMarkerLayer();
        markerLayer["initialize"](mapSDK, {
          markers: markers,
          bdid: bdid,
          floorId: floorId,
          onClick: function (properties) {
            thisObject.onMarkerClick(properties, thisObject);
          },
          onMouseOver: function (properties) {
            thisObject.onMouseOver(properties, thisObject);
          },
          onMouseLeave: function (properties) {
            thisObject.onMouseLeave(properties, thisObject);
          },
        });
        markerLayer.id = layerId;
        markerLayer.__id = DXMapUtils.createUUID();
        markerLayer["addToMap"]();
        this.markerLayers[layerId] = markerLayer;
      } else {
        this.markerLayers[layerId]["addFeature"](markerOption);
      }
      this.markerMap[id] = generateMarker(markerOption, this.markerLayers[layerId], this);
      return this.markerMap[id];
    };
    proto.addFeaturesToLayer = function (features, layerType) {
      for (let i = 0; i < features.length; i++) {
        this.addFeatureToLayer(features[i], layerType);
      }
    };
    proto.removeFeatureFromLayer = function (id) {
      this.markerMap[id] && (this.markerMap[id]["removeFromMap"](), delete this.markerMap[id]);
    };
    proto.addFeatures = function (markerInfos, events, options) {
      let mapData = {};
      for (let i = 0; i < markerInfos.length; i++) {
        let bdid = markerInfos[i]["bdid"] || "outdoor";
        let floorId = markerInfos[i]["floorId"] || "";
        let key = bdid + floorId;
        if (!mapData[key]) {
          mapData[key] = { bdid: bdid, floorId: floorId, data: [] };
        }
        mapData[key]["data"].push(markerInfos[i]);
      }
      let layerType = (options && options["layerType"]) || "customer_markerlayer";
      let zIndex = (options && options["zIndex"]) || 0;
      for (let key in mapData) {
        let layerId = layerType + "_" + zIndex + "_" + key;
        if (!this.markerLayers[layerId]) {
          let bdid = mapData[key]["bdid"],
            floorId = mapData[key]["floorId"],
            data = mapData[key]["data"];
          if (events) {
            events = {
              onClick: events.onClick || this.onMarkerClick,
              onMouseOver: events.onMouseOver || this.onMouseOver,
              onMouseLeave: events.onMouseLeave || this.onMouseLeave,
            };
          } else {
            events = {
              onClick: this.onMarkerClick,
              onMouseOver: this.onMouseOver,
              onMouseLeave: this.onMouseLeave,
            };
          }
          let markerLayer = new DXSceneMarkerLayer();
          markerLayer["initialize"](mapSDK, {
            markers: data,
            bdid: bdid,
            floorId: floorId,
            onClick: events.onMarkerClick,
            onMouseOver: events.onMouseOver,
            onMouseLeave: events.onMouseLeave,
            zIndex: zIndex,
          });
          markerLayer.id = layerId;
          markerLayer.__id = DXMapUtils.createUUID();
          markerLayer["addToMap"]();
          this.markerLayers[layerId] = markerLayer;
        } else {
          this.markerLayers[layerId]["addFeatures"](markerInfos);
        }
      }
    };
    proto.removeFeatures = function (ids) {
      for (let layerId in this.markerLayers) {
        if (ids.length) {
          this.markerLayers[layerId]["removeFeatures"](ids);
        }
      }
    };
  };
  //////////////////////////////////////////////////////////////
  // DXSceneMarkerManager
  //////////////////////////////////////////////////////////////
  let DXComboxMarkerManager = function (mapSDK) {
    let proto = DXComboxMarkerManager.prototype;
    this.mapSDK = mapSDK;
    this.markerLayers = {};
    this.markerMap = {};
    proto.initialize = function () {};
    proto.clearAll = function () {
      this.markerMap = {};
      for (let key in this.markerLayers) {
        this.markerLayers[key]["removeFromMap"]();
        delete this.markerLayers[key];
      }
      this.markerLayers = {};
    };
    function generateMarker(markerOption, markerLayer, thisObject) {
      let markerObj = {};
      markerObj["_options"] = markerOption;
      markerObj["_parentLayer"] = markerLayer;
      markerObj["removeFromMap"] = function () {
        let id = markerObj["_options"]["featureId"];
        if (!thisObject.markerMap[id]) {
          return;
        }
        markerObj["_parentLayer"]["removeFeature"](id);
        delete thisObject.markerMap[id];
        if (markerObj["_parentLayer"].isEmpty()) {
          markerObj["_parentLayer"]["removeFromMap"]();
          delete thisObject.markerLayers[markerObj["_parentLayer"].id];
        }
      };
      markerObj["updateFeature"] = function (data) {
        let markerInfo = markerObj["_options"];
        for (let key in data) {
          if (key != "id") {
            markerInfo[key] = data[key];
          }
        }
        markerObj["_parentLayer"]["updateFeature"](markerInfo["featureId"], markerInfo);
      };
      markerObj["setPosition"] = function (floorId, lon, lat, heading, bdid) {
        let markerInfo = markerObj["_options"];
        floorId != null ? (markerInfo["floorId"] = floorId) : "";
        if (lon && lat) {
          ((lon = parseFloat(lon)), (lat = parseFloat(lat)));
          markerInfo["lon"] = lon;
          markerInfo["lat"] = lat;
          markerObj["_parentLayer"]["setPosition"](lon, lat, heading, markerInfo["featureId"], bdid, floorId);
        }
      };
      markerObj["setVisible"] = function (visible) {
        let markerInfo = markerObj._options;
        if (!markerInfo) {
          return;
        }
        markerObj["_parentLayer"]["setFeatureVisible"](markerInfo["featureId"], visible);
        markerInfo.visible = visible;
      };
      markerObj["getVisible"] = function () {
        let markerInfo = markerObj._options;
        return markerObj["_parentLayer"]["getFeatureVisible"](markerInfo["featureId"]);
      };

      return markerObj;
    }
    proto.onMarkerClick = function (properties, thisObject) {
      let id = properties["id"] || "";
      if (thisObject.markerMap[id]) {
        thisObject.markerMap[id]["_parentLayer"]["highlightMarker"](id);
        thisObject.markerMap[id]["_options"]["onClick"] && thisObject.markerMap[id]["_options"]["onClick"](thisObject.markerMap[id]);
      }
    };
    proto.onMouseOver = function (properties, thisObject) {
      let id = properties["id"] || "";
      if (thisObject.markerMap[id]) {
        thisObject.markerMap[id]["_options"]["onMouseOver"] && thisObject.markerMap[id]["_options"]["onMouseOver"](thisObject.markerMap[id]);
      }
    };
    proto.onMouseLeave = function (properties, thisObject) {
      let id = properties["id"] || "";
      if (thisObject.markerMap[id]) {
        thisObject.markerMap[id]["_options"]["onMouseLeave"] && thisObject.markerMap[id]["_options"]["onMouseLeave"](thisObject.markerMap[id]);
      }
    };
    proto.addFeatureToLayer = function (featureInfo, layerType) {
      let thisObject = this;
      let bdid = featureInfo["bdid"] || "";
      let floorId = featureInfo["floorId"] || "";
      if (!featureInfo["bdid"]) {
        featureInfo["bdid"] = bdid;
      }
      if (!featureInfo["floorId"]) {
        featureInfo["floorId"] = floorId;
      }
      let id = featureInfo["id"] || featureInfo["poiId"] || DXMapUtils.createUUID();
      let layerId = (layerType || "customer_markerlayer") + "_" + bdid + floorId;
      let markerOption = { featureId: id, bdid: bdid, floorId: floorId, imageUrl: "blue_dot", highlightImageUrl: "red_dot", scale: 0.5 };
      for (let key in featureInfo) {
        markerOption[key] = featureInfo[key];
      }
      if (!this.markerLayers[layerId]) {
        let markers = [];
        markers.push(markerOption);
        let markerLayer = new DXSceneMarkerLayer();
        markerLayer["initialize"](mapSDK, {
          markers: markers,
          bdid: bdid,
          floorId: floorId,
          onClick: function () {
            thisObject.onMarkerClick(properties, thisObject);
          },
          onMouseOver: function (properties) {
            thisObject.onMouseOver(properties, thisObject);
          },
          onMouseLeave: function (properties) {
            thisObject.onMouseLeave(properties, thisObject);
          },
        });
        markerLayer.id = layerId;
        markerLayer.__id = DXMapUtils.createUUID();
        markerLayer["addToMap"]();
        this.markerLayers[layerId] = markerLayer;
      } else {
        this.markerLayers[layerId]["addFeature"](markerOption);
      }
      this.markerMap[id] = generateMarker(markerOption, this.markerLayers[layerId]);
      return this.markerMap[id];
    };
    proto.addFeaturesToLayer = function (features, layerType) {
      for (let i = 0; i < features.length; i++) {
        this.addFeatureToLayer(features[i], layerType);
      }
    };
    proto.removeFeatureFromLayer = function (id) {
      this.markerMap[id] && (this.markerMap[id]["removeFromMap"](), delete this.markerMap[id]);
    };
    proto.addFeatures = function (markerInfos, events, options) {
      let mapData = {};
      for (let i = 0; i < markerInfos.length; i++) {
        let bdid = markerInfos[i]["bdid"] || "outdoor";
        let floorId = markerInfos[i]["floorId"] || "";
        let key = bdid + floorId;
        let zIndex = (options && options["zIndex"]) || 0;
        let styles = markerInfos[i]["styles"];
        if (styles) {
          styles.forEach(function (style) {
            style["lon"] = markerInfos[i]["lon"];
            style["lat"] = markerInfos[i]["lat"];
            style["id"] = markerInfos[i]["id"];
            style["featureId"] = markerInfos[i]["featureId"];
            let zIndex = style["zIndex"] != undefined ? style["zIndex"] : zIndex;
            let key = zIndex + "_" + bdid + floorId;
            if (!mapData[key]) {
              mapData[key] = { bdid: bdid, floorId: floorId, data: [], zIndex: zIndex };
            }
            mapData[key]["data"].push(style);
          });
        } else {
          key = zIndex + "_" + key;
          if (!mapData[key]) {
            mapData[key] = { bdid: bdid, floorId: floorId, data: [], zIndex: zIndex };
          }
          mapData[key]["data"].push(markerInfos[i]);
        }
      }
      let layerType = (options && options["layerType"]) || "customer_markerlayer";
      for (let key in mapData) {
        let zIndex = mapData[key]["zIndex"];
        let layerId = layerType + "_" + key;
        if (!this.markerLayers[layerId]) {
          let bdid = mapData[key]["bdid"],
            floorId = mapData[key]["floorId"],
            data = mapData[key]["data"];
          if (events) {
            events = {
              onClick: events.onClick || this.onMarkerClick,
              onMouseOver: events.onMouseOver || this.onMouseOver,
              onMouseLeave: events.onMouseLeave || this.onMouseLeave,
            };
          } else {
            events = {
              onClick: this.onMarkerClick,
              onMouseOver: this.onMouseOver,
              onMouseLeave: this.onMouseLeave,
            };
          }
          let markerLayer = new DXSceneMarkerLayer();
          markerLayer["initialize"](mapSDK, {
            markers: data,
            bdid: bdid,
            floorId: floorId,
            onClick: events.onMarkerClick,
            onMouseOver: events.onMouseOver,
            onMouseLeave: events.onMouseLeave,
            zIndex: zIndex,
          });
          markerLayer.id = layerId;
          markerLayer.__id = DXMapUtils.createUUID();
          markerLayer["addToMap"]();
          this.markerLayers[layerId] = markerLayer;
        } else {
          this.markerLayers[layerId]["addFeatures"](markerInfos);
        }
      }
    };
    proto.removeFeatures = function (ids) {
      for (let layerId in this.markerLayers) {
        if (ids.length) {
          this.markerLayers[layerId]["removeFeatures"](ids);
        }
      }
    };
    proto.addStyle = function () {};
  };

  //////////////////////////////////////////////////////////////
  // DXSceneTipInfo
  //////////////////////////////////////////////////////////////
  let DXSceneTipInfo = (function (DXSceneObject) {
    "use strict";
    let DXSceneTipInfo = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXSceneTipInfo";
        thisObject._featureId = "";
        thisObject._options = null;
        thisObject._position = [0, 0];
        thisObject._id = DXMapUtils.createUUID();
      },
      initialize: function (mapSDK, options) {
        this._mapSDK = mapSDK;
        this._options = options;
        this._featureId = options["featureId"] || "";
        this._map = this._mapSDK._coreMap._mapboxMap;
        this._bdid = options["bdid"] || "";
        let floorId = options["floorId"] || "";
        let scene = mapSDK._coreMap._scene;

        let markerHeight = options["height"] || 10,
          markerRadius = options["radius"] || 6,
          linearOffset = options["linearOffset"] || 0;
        let popupOffsets = {
          bottom: [0, -markerHeight],
          "bottom-left": [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
          // 'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
          // 'left': [markerRadius, (markerHeight - markerRadius) * -1],
          // 'right': [-markerRadius, (markerHeight - markerRadius) * -1]
        };
        let showCloseButton = options["showCLoseButton"] == undefined ? false : options["showCLoseButton"];
        let data = {
          offset: popupOffsets,
          closeButton: showCloseButton,
          anchor: options["anchor"] || "bottom",
          closeOnClick: options["closeOnClick"] || false,
        };
        if (options["className"]) {
          data["className"] = options["className"];
        }
        this.popup = new mapboxgl["Popup"](data);
        this.popup["on"]("close", function () {
          if (typeof options["onClose"] == "function") {
            options["onClose"]();
          }
        });
        this.popup["on"]("open", function () {
          if (typeof options["onOpen"] == "function") {
            options["onOpen"]();
          }
        });
        if (options["lnglat"]) {
          this.popup["setLngLat"](options["lnglat"]);
        }
        if (options["html"]) {
          this.popup["setHTML"](options["html"]);
        }
        if (options["text"]) {
          this.popup["setText"](options["text"]);
        }
        if (options["maxWidth"]) {
          this.popup["setMaxWidth"](options["maxWidth"]);
        }
        this._floorObject = scene.getChildById(this._bdid + floorId);
        if (this._floorObject) {
          scene.addChild(this._floorObject, this);
        }
        this.checkFloor();
      },
      setContentText: function (text) {
        this.popup["setText"](text);
      },
      setHtml: function (html) {
        this.popup["setHTML"](html);
      },
      setPosition: function (lnglat, lat) {
        if (Array.isArray(lnglat)) {
          this.popup["setLngLat"](lnglat);
        } else if (lnglat && lat) {
          this.popup["setLngLat"]([lnglat, lat]);
        }
      },
      addToMap: function () {
        this.popup["addTo"](this._map);
      },
      removeFromMap: function () {
        let thisObject = this;
        this.popup["remove"]();
      },
      checkFloor: function () {
        let visible = this.checkVisible();
        // let value = (visible == true ? "visible" : "none");
        if (visible) {
          this.popup["removeClassName"]("hide");
        } else {
          this.popup["addClassName"]("hide");
        }
      },
      checkVisible: function () {
        let visible = this._visible;
        if (this._floorObject) {
          visible = visible && this._floorObject.visible;
        }
        return visible;
      },
    });

    daximap.defineProperties(DXSceneTipInfo.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneTipInfo.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          if (val != this._visible) {
            this._visible = val;
            this.checkFloor();
          }
        },
      },
    });
    return DXSceneTipInfo;
  })(DXSceneObject);
  daximap["DXSceneTipInfo"] = DXSceneTipInfo;

  //////////////////////////////////////////////////////////////
  // DXScenePolyline 路线走过的变灰 导航路线封装
  //////////////////////////////////////////////////////////////
  let DXScenePolyline = (function (DXSceneObject) {
    "use strict";
    let DXScenePolyline = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXScenePolyline";
        thisObject._type = "polyline";
        thisObject._sourceId = "";
        thisObject._source = null;
        thisObject._options = null;
        thisObject._position = [0, 0];
        thisObject._grayT = 0;
      },
      initialize: function (mapSDK, options, floorId) {
        if (options && options["rtti"]) {
          this._rtti = options["rtti"];
        }
        if (options["lineColor"] && options["lineColor"][0] != "#" && options["lineColor"].indexOf("rgb") == -1) {
          options["lineColor"] = "#" + options["lineColor"];
        }
        if (options["outLineColor"] && options["outLineColor"][0] != "#" && options["outLineColor"].indexOf("rgb") == -1) {
          options["outLineColor"] = "#" + options["outLineColor"];
        }
        this._mapSDK = mapSDK;
        this._floorId = floorId || options["floorId"] || "";
        this._bdid = options["bdid"] || "";
        this._options = options;
        this._map = this._mapSDK._coreMap._mapboxMap;
        this.id = options.id || "";
        if (!this.id) {
          this.id = DXMapUtils.createUUID();
        }
        this._sourceId = this._layerId = this.id;
        let layerInfo = this._map["getLayer"](this.id);
        if (layerInfo) {
          return false;
        }
        return true;
      },
      computeTimeOfPoint: function (lineData, rawLineData) {
        if (lineData.length == 0) {
          return;
        }
        let totalLen = 0;
        for (let i = 0, len = lineData.length; i < len - 1; i++) {
          let p1 = lineData[i],
            p2 = lineData[i + 1];
          let segLen = navi_utils.getGeodeticCircleDistance({ x: p1[0], y: p1[1] }, { x: p2[0], y: p2[1] });
          totalLen += segLen;
          p2.segLen = segLen;
          p2.totalLen = totalLen;
          let angle = navi_utils.getAngle({ x: p1[0], y: p1[1] }, { x: p2[0], y: p2[1] });
          p2.angle = angle;
        }
        lineData[0].len = 0;
        lineData[0].t = 0;
        for (let i = 0, len = lineData.length; i < len - 1; i++) {
          let p1 = lineData[i],
            p2 = lineData[i + 1];
          p2.t = p2.totalLen / totalLen;
        }

        if (rawLineData) {
          let rawLineTotalLen = 0;
          for (let j = 0, len = rawLineData.length; j < len - 1; j++) {
            let p1 = rawLineData[j],
              p2 = rawLineData[j + 1];
            let segLen = navi_utils.getGeodeticCircleDistance({ x: p1[0], y: p1[1] }, { x: p2[0], y: p2[1] });
            rawLineTotalLen += segLen;
            p2.segLen = segLen;
            p2.totalLen = rawLineTotalLen;
            let angle = navi_utils.getAngle({ x: p1[0], y: p1[1] }, { x: p2[0], y: p2[1] });
            p2.angle = angle;
          }
        }
        rawLineData[0].len = 0;
        rawLineData[0].t = 0;
        for (let i = 0, len = rawLineData.length; i < len - 1; i++) {
          let p1 = rawLineData[i],
            p2 = rawLineData[i + 1];
          p2.t = p2.totalLen / rawLineTotalLen;
        }
      },
      addToMap: function () {
        if (!this._options) return;
        let thisObject = this;
        let options = this._options;
        if (options["smooth"] !== false) {
          options["smooth"] = true;
        }
        thisObject._layerId = thisObject._id;
        thisObject._sourceId = thisObject._id;

        let lineData = DXMapUtils.copyData(options["lineData"]);
        if (options["smooth"]) {
          let lineData = DaxiMap.DXRouteCircelSampler.resampler(lineData);
          if (lineData.length > 0) {
            lineData = lineData[0];
          } else {
            return;
          }
        }
        thisObject.computeTimeOfPoint(lineData, options["lineData"]);
        thisObject._drawLineData = lineData;
        let geojson = {
          type: "FeatureCollection",
          features: [],
        };
        if (options["outLine"]) {
          let outLine = options["outLine"];
          let feature = {
            type: "Feature",
            properties: {
              lineType: "normal",
              lineWidth: outLine["lineWidth"] || 10,
              lineColor: outLine["lineColor"] || "#009EFF",
              lineOpacity: options["alpha"] || 1.0,
            },
            geometry: {
              type: "LineString",
              coordinates: lineData,
            },
          };
          geojson["features"].push(feature);
        }
        let feature = {
          type: "Feature",
          properties: {
            lineType: "normal",
            lineWidth: options["lineWidth"] || 8,
            lineColor: options["lineColor"] || "#009EFF",
            lineOpacity: options["alpha"] || 1.0,
          },
          geometry: {
            type: "LineString",
            coordinates: lineData,
          },
        };
        geojson["features"].push(feature);
        //  走过路线
        if (options["outLine"]) {
          let outLine = options["outLine"];
          let feature = {
            type: "Feature",
            properties: {
              lineType: "gray",
              lineWidth: outLine["lineWidth"] || 10,
              lineColor: outLine["lineColor"] || "#797979",
              lineOpacity: options["alpha"] || 1.0,
            },
            geometry: {
              type: "LineString",
              coordinates: [],
            },
          };
          geojson["features"].push(feature);
        }
        let feature = {
          type: "Feature",
          properties: {
            lineType: "gray",
            lineWidth: options["lineWidth"] || 8,
            lineColor: "#b7b7b7",
            lineOpacity: options["alpha"] || 1.0,
          },
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        };
        geojson["features"].push(feature);
        let sourceData = {
          type: "geojson",
          data: geojson,
        };
        thisObject._map["addSource"](thisObject._sourceId, sourceData);
        thisObject._source = thisObject._map["getSource"](thisObject._sourceId);
        let lineOptions = {
          type: "line",
          id: thisObject._layerId,
          paint: {
            // 'line-pattern':['get', "arrowIcon"],
            "line-color": ["string", ["get", "lineColor"], "#009EFF"],
            "line-width": ["number", ["get", "lineWidth"], 8],
            "line-opacity": ["number", ["get", "lineOpacity"], 1.0],
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          source: thisObject._sourceId,
        };

        this._mapSDK._coreMap.addToMapBox(lineOptions, "routeLayer");
        if (options["hideArrow"] != true) {
          this.addLineArrow();
        }
        let events = options["events"];
        if (events) {
          for (let key in events) {
            thisObject._map["on"](key, this._layerId, function (e) {
              events[key](thisObject);
            });
          }
        }
        let scene = this._mapSDK._coreMap._scene;
        let floorId = this._floorId;
        let sceneFloorObject = scene.getChildById(this._bdid + floorId);
        if (sceneFloorObject) {
          this._floorObject = sceneFloorObject;
          scene.addChild(sceneFloorObject, this);
          this.checkFloor();
        } else {
          scene.addChild(scene.rootNode, this);
        }
      },
      generateRoute: function (grayT, opacity) {
        // 计算走过的路线和未走过路线数据
      },
      setOpacityByTime: function (currTime, opacity) {
        if (currTime > 0) {
          let _grayPoint = [];
          let resetPoints = [];
          let lineData = this._options["lineData"];
          for (let i = 0, len = lineData.length; i < len; i++) {
            let p = lineData[i];
            if (currTime <= p.t) {
              resetPoints.push(p);
            } else {
              _grayPoint.push(p); //走过路线
            }
          }
          if (opacity != 0) {
          }
        }
      },
      updateGrayPoints: function (grayPoins) {
        let data = this._source["_data"];
        let features = data["features"];
        let resamplerRoute = grayPoins;
        // if (grayPoins.length > 1 && this._options["smooth"]) {
        //   let resamplerRoute = DaxiMap.DXRouteCircelSampler.resampler(grayPoins);
        //   if (resamplerRoute.length > 0) {
        //     resamplerRoute = resamplerRoute[0];
        //   }
        // }
        features.forEach(function (feature) {
          if (feature["properties"]["lineType"] == "gray") {
            feature["geometry"]["coordinates"] = resamplerRoute;
          }
        });
        data["type"] = "FeatureCollection";
        this._source["setData"](data);
      },
      updateRestPoints: function (resetPoint) {
        let data = this._source["_data"];
        let features = data["features"];
        resamplerRoute = resetPoint;
        if (resetPoint.length > 1 && this._options["smooth"]) {
          let resamplerRoute = DaxiMap.DXRouteCircelSampler.resampler(resetPoint);
          if (resamplerRoute.length > 0) {
            resamplerRoute = resamplerRoute[0];
          }
        }

        features.forEach(function (feature) {
          if (feature["properties"]["lineType"] != "gray") {
            feature["geometry"]["coordinates"] = resamplerRoute;
          }
        });
        this._source["setData"](data);
        let arrowSourceId = this._sourceId + "_arrow";
        let sourceObj = this._map["getSource"](arrowSourceId);
        if (sourceObj) {
          let arrowData = sourceObj["_data"];
          arrowData["features"].forEach(function (item) {
            item["geometry"]["coordinates"] = resamplerRoute;
          });
          sourceObj["setData"](arrowData);
        }
      },
      setGrayPoints: function (grayT, overhide, _restPoint, maxLen) {
        //,grayPoins
        let thisObject = this;
        maxLen = maxLen || 20;
        let _grayPoint = [],
          restPoint = [];
        if (!this.visible) {
          return;
        }
        if (grayT != undefined && grayT >= 0) {
          let lineData = this._drawLineData; //this._options["lineData"];
          let rawLineData = this._options["lineData"];
          // if(!overhide){
          let currP;
          for (let i = 0, len = lineData.length; i < len; i++) {
            let p = lineData[i];
            if (grayT <= p.t) {
              // _grayPoint.push(p);
              if (i > 0) {
                let lastP = lineData[i - 1];
                let restT = grayT - lastP.t;
                let segmentT = p.t - lastP.t;
                if (segmentT > 0) {
                  currP = [lastP[0] + (p[0] - lastP[0]) * (restT / segmentT), lastP[1] + (p[1] - lastP[1]) * (restT / segmentT)];
                  // _grayPoint.push(currP);
                }
                break;
              }
            }
          }
          if (!currP) return;
          if (!overhide || !overhide.length) {
            for (let i = 0, len = lineData.length; i < len; i++) {
              let p = lineData[i];
              if (grayT > p.t) {
                _grayPoint.push(p);
              } else if (i > 0) {
                let mPoint = [];
                navi_utils.pointToLineInVector(currP, lineData[i - 1], p, mPoint, 30);
                _grayPoint.push(mPoint);
                break;
              }
            }
            thisObject.updateGrayPoints(DXMapUtils.copyData(_grayPoint));
            let points = lineData.slice(i);
            if (_grayPoint.length) {
              points.unshift(_grayPoint[_grayPoint.length - 1]);
            }
            restPoint = points;
          } else {
            for (let i = 0, len = lineData.length; i < len - 1; i++) {
              let p = lineData[i];
              let nextP = lineData[i + 1];
              if (grayT < p.t) {
                restPoint.push(p);
              } else if (grayT >= p.t && grayT < nextP.t) {
                if (currP) {
                  let mPoint = [];
                  navi_utils.pointToLineInVector(currP, p, nextP, mPoint, 30);
                  restPoint.push(mPoint);
                }
                // let restT = grayT - p.t;
                // let segmentT = nextP.t - p.t;
                // if (segmentT > 0) {
                //   let currP = [p[0] + (nextP[0] - p[0]) * (restT / segmentT), p[1] + (nextP[1] - p[1]) * (restT / segmentT)];
                //   restPoint.push(currP);
                // }
              }
            }
            thisObject.updateRestPoints(DXMapUtils.copyData(restPoint));
          }

          // if(!overhide){
          //   for (let i = 0, len = lineData.length; i < len; i++) {
          //     let p = lineData[i];
          //     if (grayT > p.t) {
          //       _grayPoint.push(p);
          //     } else if(i>0){
          //       let lastP = lineData[i - 1];
          //       let restT = grayT - lastP.t;
          //       let segmentT = p.t - lastP.t;
          //       if (segmentT > 0) {
          //         let currP = [lastP[0] + (p[0] - lastP[0]) * (restT / segmentT), lastP[1] + (p[1] - lastP[1]) * (restT / segmentT)];
          //         _grayPoint.push(currP);
          //       }
          //       break;
          //     }
          //   }
          //   this.updateGrayPoints(DXMapUtils.copyData(_grayPoint));
          //   let points = lineData.slice(i);
          //   if(_grayPoint.length){
          //     points.unshift(_grayPoint[_grayPoint.length-1]);
          //   }

          //   restPoint = points;

          // }else if(overhide){

          //   for (let i = 0, len = lineData.length; i < len-1; i++) {
          //     let p = lineData[i];
          //     let nextP = lineData[i+1];
          //     if (grayT < p.t){
          //       restPoint.push(p);
          //     }else if(grayT >= p.t && grayT < nextP.t){
          //       let restT = grayT - p.t;
          //       let segmentT = nextP.t - p.t;
          //       if (segmentT > 0) {
          //         let currP = [p[0] + (nextP[0] - p[0]) * (restT / segmentT), p[1] + (nextP[1] - p[1]) * (restT / segmentT)];
          //         restPoint.push(currP);
          //       }
          //     }
          //   }
          //   if(nextP && grayT < nextP.t){
          //     restPoint.push(nextP);
          //   }
          //   this.updateRestPoints(DXMapUtils.copyData(restPoint));
          // }

          if (_restPoint) {
            let restRawPoints = [],
              nearestSegIndex = 0,
              nearestPoint;
            for (let i = 1; i < rawLineData.length; i++) {
              let pPoint = rawLineData[i - 1],
                nPoint = rawLineData[i],
                mPoint = [];
              let spoint = _grayPoint.length ? _grayPoint[_grayPoint.length - 1] : rawLineData[0];
              let segLen = navi_utils.getGeodeticCircleDistance(
                {
                  x: pPoint[0],
                  y: pPoint[1],
                },
                {
                  x: nPoint[0],
                  y: nPoint[1],
                },
              );
              nPoint.segLen = segLen;
              nPoint.angle = navi_utils.getAngle({ x: pPoint[0], y: pPoint[1] }, { x: nPoint[0], y: nPoint[1] });
              navi_utils.pointToLineInVector(spoint, pPoint, nPoint, mPoint, 3);
              if (mPoint.dis != undefined && (!nearestPoint || mPoint.dis < nearestPoint.dis)) {
                nearestPoint = mPoint;
                nearestPoint.index = i;
              }
            }
            let restRawPoints = rawLineData.slice((nearestPoint && nearestPoint.index) || 0);
            let distance = 0,
              diffAngle = 0,
              firseAngle = 0;

            nearestPoint.length
              ? _restPoint.push({ x: navi_utils.transformLonToMectroX(nearestPoint[0]), y: navi_utils.transformLatToMectroY(nearestPoint[1]) })
              : "";
            for (let index in restRawPoints) {
              let p = restRawPoints[index];
              if (index == 0) {
                if (nearestPoint.length == 0 || nearestPoint[0] != p[0] || nearestPoint[1] != p[1]) {
                  _restPoint.push({ x: navi_utils.transformLonToMectroX(p[0]), y: navi_utils.transformLatToMectroY(p[1]) });
                }
              } else if (distance < maxLen) {
                if (index == 1) {
                  firseAngle = p.angle;
                  let p1 = restRawPoints[index - 1];
                  diffAngle = p.angle;
                  distance = navi_utils.getGeodeticCircleDistance({ x: p1[0], y: p1[1] }, { x: p[0], y: p[1] });
                  if (distance > maxLen) {
                    _restPoint.push({
                      x: navi_utils.transformLonToMectroX(p1[0] + ((p[0] - p1[0]) * maxLen) / distance),
                      y: navi_utils.transformLatToMectroY(p1[1] + ((p[1] - p1[1]) * maxLen) / distance),
                    });
                  } else {
                    _restPoint.push({ x: navi_utils.transformLonToMectroX(p[0]), y: navi_utils.transformLatToMectroY(p[1]) });
                  }
                } else {
                  let p1 = restRawPoints[index - 1];
                  let currDiffAngle = Math.abs(p.angle - p1.angle);
                  if (distance + p.segLen < maxLen) {
                    distance += p.segLen;
                    _restPoint.push({ x: navi_utils.transformLonToMectroX(p[0]), y: navi_utils.transformLatToMectroY(p[1]) });
                  } else {
                    _restPoint.push({
                      x: navi_utils.transformLonToMectroX(p1[0] + ((p[0] - p1[0]) * (maxLen - distance)) / p.segLen),
                      y: navi_utils.transformLatToMectroY(p1[1] + ((p[1] - p1[1]) * (maxLen - distance)) / p.segLen),
                    });
                  }
                  distance += p.segLen;

                  if ((currDiffAngle >= 15 && distance >= maxLen * 0.5) || distance >= maxLen) {
                    // return;
                    break;
                  }
                }
              }
            }
          }
          this._grayT = grayT;
        }
      },

      addLineArrow: function () {
        let thisObject = this;
        let lineData = thisObject._drawLineData; //DXMapUtils.copyData(this._options["lineData"]);
        let options = this._options;
        let layerId = thisObject._layerId + "_arrow";
        let sourceId = thisObject._sourceId + "_arrow";
        let sourceData = {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {
                  lineType: "arrow",
                  arrowIcon: options["arrowIcon"] || "arrowIcon",
                  // "lineWidth": options["lineWidth"] || 8,
                  // "lineColor": options["lineColor"] || "#009EFF",
                  lineOpacity: this._options["alpha"] || 1,
                },
                geometry: {
                  type: "LineString",
                  coordinates: lineData,
                },
              },
            ],
          },
        };

        thisObject._map["addSource"](sourceId, sourceData);

        let layerData = {
          type: "line",
          id: layerId,
          paint: {
            "line-pattern": ["get", "arrowIcon"],
            "line-color": this._options["lineColor"] || ["string", ["get", "lineColor"], "#009EFF"],
            "line-width": ["number", ["get", "lineWidth"], 8],
            "line-opacity": ["number", ["get", "lineOpacity"], 1.0],
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          source: sourceId,
        };
        this._mapSDK._coreMap.addToMapBox(layerData, "routeLayer");
      },
      updateSource: function (data) {
        if (data["features"]) {
          this._source["setData"](data);
        }
      },
      updateLineColor: function (lineColor, outLineColor) {
        if (this._options["lineColor"]) {
          lineColor && this._map["setPaintProperty"](this._sourceId, "line-color", lineColor);
        } else {
          let data = this._source["_data"];
          outLineColor && (data["features"][0]["properties"]["lineColor"] = outLineColor);
          lineColor && data["features"][1] && (data["features"][1]["properties"]["lineColor"] = lineColor);
          this._source["setData"](data);
        }
      },
      updateLineWidth: function (lineWidth, outLineWidth) {
        let data = this._source["_data"];
        outLineWidth && (data["features"][0]["properties"]["lineWidth"] = outLineWidth);
        lineWidth && data["features"][1] && (data["features"][1]["properties"]["lineWidth"] = lineWidth);
        this._source["setData"](data);
      },
      updateLineTransparency: function (opacity) {
        let data = this._source["_data"];
        opacity && (data["features"][0]["properties"]["lineOpacity"] = opacity);
        opacity && data["features"][1] && (data["features"][1]["properties"]["lineOpacity"] = opacity);
        this._source["setData"](data);
      },
      removeFromMap: function () {
        let thisObject = this;
        if (!thisObject._map["getLayer"](this._layerId)) {
          return;
        }
        thisObject._map["removeLayer"](this._layerId);
        thisObject._map["removeSource"](this._sourceId);
        if (thisObject._map["getLayer"](this._layerId + "_arrow")) {
          thisObject._map["removeLayer"](this._layerId + "_arrow");
          thisObject._map["removeSource"](this._sourceId + "_arrow");
        }

        let scene = thisObject._mapSDK._coreMap._scene;
        scene.removeChild(thisObject);
      },
      setZIndexOffset: function (icon) {},
      setVisible: function (visible) {
        let value = visible == true ? "visible" : "none";
        if (value == this._visible) {
          return;
        }
        if (this._map["getLayer"](this._layerId)) {
          this._map["setLayoutProperty"](this._layerId, "visibility", value);
          if (this._options["hideArrow"] != true) {
            this._map["setLayoutProperty"](this._layerId + "_arrow", "visibility", value);
          }
        }
      },
      checkFloor: function () {
        let visible = this._visible;
        if (this._floorObject) {
          visible = visible && this._floorObject.visible;
        }
        let value = visible == true ? "visible" : "none";
        if (this._map["getLayer"](this._layerId)) {
          this._map["setLayoutProperty"](this._layerId, "visibility", value);
          if (this._options["hideArrow"] != true) {
            // if(this._map["getLayer"](this._layerId + "_arrow")){
            this._map["setLayoutProperty"](this._layerId + "_arrow", "visibility", value);
          }
        }
      },
    });

    daximap.defineProperties(DXScenePolyline.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneObject.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          if (val != this._visible) {
            this._visible = val;
            this.checkFloor();
          }
        },
      },
      floorId: {
        get: function () {
          return this._floorId;
        },
      },
    });
    return DXScenePolyline;
  })(DXSceneObject);
  daximap["DXScenePolyline"] = DXScenePolyline;
  //////////////////////////////////////////////////////////////
  // DXPolyline 普通的画线
  //////////////////////////////////////////////////////////////
  let DXPolyline = (function (DXSceneObject) {
    "use strict";
    let DXPolyline = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXPolyline";
        thisObject._type = "polyline";
        thisObject._sourceId = "";
        thisObject._source = null;
        thisObject._options = null;
        thisObject._position = [0, 0];
        thisObject._grayT = 0;
      },
      initialize: function (mapSDK, options, floorId) {
        if (options && options["rtti"]) {
          this._rtti = options["rtti"];
        }
        this._mapSDK = mapSDK;
        this._floorId = floorId || options["floorId"] || "";
        this._bdid = options["bdid"] || "";
        this._options = options;
        this._map = this._mapSDK._coreMap._mapboxMap;
        this.id = options.id || "";
        if (!this.id) {
          this.id = DXMapUtils.createUUID();
        }
        this._sourceId = this._layerId = this.id;
        let layerInfo = this._map["getLayer"](this.id);
        if (layerInfo) {
          return false;
        }
        return true;
      },
      computeTimeOfPoint: function (lineData) {
        if (lineData.length == 0) {
          return;
        }
        let totalLen = 0;
        for (let i = 0, len = lineData.length; i < len - 1; i++) {
          let p1 = lineData[i],
            p2 = lineData[i + 1];
          let segLen = navi_utils.getGeodeticCircleDistance({ x: p1[0], y: p1[1] }, { x: p2[0], y: p2[1] });
          totalLen += segLen;
          p2.segLen = segLen;
          p2.totalLen = totalLen;
          let angle = navi_utils.getAngle({ x: p1[0], y: p1[1] }, { x: p2[0], y: p2[1] });
          p2.angle = angle;
        }
        lineData[0].len = 0;
        lineData[0].t = 0;
        for (let i = 0, len = lineData.length; i < len - 1; i++) {
          let p1 = lineData[i],
            p2 = lineData[i + 1];
          p2.t = p2.totalLen / totalLen;
        }
      },
      addToMap: function () {
        if (!this._options) return;
        let thisObject = this;
        let options = this._options;
        if (options["smooth"] !== false) {
          options["smooth"] = true;
        }
        thisObject._layerId = thisObject._id;
        thisObject._sourceId = thisObject._id;
        let sourceData = {
          type: "geojson",
        };
        let geojson = {
          type: "FeatureCollection",
          features: [],
        };
        if (options["lineData"] && options["lineData"].length) {
          let lineData = DXMapUtils.copyData(options["lineData"]);
          if (options["smooth"]) {
            let lineData = DaxiMap.DXRouteCircelSampler.resampler(lineData);
            if (lineData.length > 0) {
              lineData = lineData[0];
            } else {
              return;
            }
          }
          thisObject.computeTimeOfPoint(lineData, options["lineData"]);
          thisObject._drawLineData = lineData;

          if (options["outLine"]) {
            let outLine = options["outLine"];
            let feature = {
              type: "Feature",
              properties: {
                lineType: "normal",
                lineWidth: outLine["lineWidth"] || 10,
                lineColor: outLine["lineColor"] || "#009EFF",
                lineOpacity: options["alpha"] || 1.0,
              },
              geometry: {
                type: "LineString",
                coordinates: lineData,
              },
            };
            geojson["features"].push(feature);
          }
          let feature = {
            type: "Feature",
            properties: {
              lineType: "normal",
              lineWidth: options["lineWidth"] || 8,
              lineColor: options["lineColor"] || "#009EFF",
              lineOpacity: options["alpha"] || 1.0,
            },
            geometry: {
              type: "LineString",
              coordinates: lineData,
            },
          };
          geojson["features"].push(feature);
          //  走过路线
          if (options["outLine"]) {
            let outLine = options["outLine"];
            let feature = {
              type: "Feature",
              properties: {
                lineType: "gray",
                lineWidth: outLine["lineWidth"] || 10,
                lineColor: "#797979",
                lineOpacity: options["alpha"] || 1.0,
              },
              geometry: {
                type: "LineString",
                coordinates: [],
              },
            };
            geojson["features"].push(feature);
          }
          let feature = {
            type: "Feature",
            properties: {
              lineType: "gray",
              lineWidth: options["lineWidth"] || 8,
              lineColor: "#b7b7b7",
              lineOpacity: options["alpha"] || 1.0,
            },
            geometry: {
              type: "LineString",
              coordinates: [],
            },
          };
          geojson["features"].push(feature);
          sourceData = {
            type: "geojson",
            data: geojson,
          };
        } else if (options["features"]) {
          sourceData = {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: options["features"],
            },
          };
        } else if (options["data"]) {
          options["data"].forEach(function (item) {
            let feature = {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: [],
              },
            };
            for (let key in item) {
              if (key != "points") {
                feature["properties"][key] = item[key];
              } else {
                if (typeof item["points"] == "string") {
                  let arr = item["points"].split(";");
                  arr.forEach(function (point) {
                    let lonlat = point.split(",");
                    feature["geometry"]["coordinates"].push([parseFloat(lonlat[0]), parseFloat(lonlat[1])]);
                  });
                } else if (typeof item["points"] == "object") {
                  feature["geometry"]["coordinates"] = item["points"];
                }
              }
            }
            geojson["features"].push(feature);
          });
          sourceData = {
            type: "geojson",
            data: geojson,
          };
        }
        thisObject._map["addSource"](thisObject._sourceId, sourceData);
        thisObject._source = thisObject._map["getSource"](thisObject._sourceId);

        let markerOptions = {
          type: "line",
          id: thisObject._layerId,
          paint: {
            // 'line-pattern':['get', "arrowIcon"],
            "line-color": ["string", ["get", "lineColor"], "#009EFF"],
            "line-width": ["number", ["get", "lineWidth"], 8],
            "line-opacity": ["number", ["get", "lineOpacity"], 1.0],
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          source: thisObject._sourceId,
        };

        this._mapSDK._coreMap.addToMapBox(markerOptions, "routeLayer");
        if (options["showArrow"]) {
          this.addLineArrow();
        }
        let events = options["events"];
        if (events) {
          for (let key in events) {
            thisObject._map["on"](key, this._layerId, function (e) {
              events[key](thisObject);
            });
          }
        }
        let scene = this._mapSDK._coreMap._scene;
        let floorId = this._floorId;
        let sceneFloorObject = scene.getChildById(this._bdid + floorId);
        if (sceneFloorObject) {
          this._floorObject = sceneFloorObject;
          scene.addChild(sceneFloorObject, this);
          this.checkFloor();
        } else {
          scene.addChild(scene.rootNode, this);
        }
      },
      updateRestPoints: function (resetPoint) {
        let data = this._source["_data"];
        let features = data["features"];
        resamplerRoute = resetPoint;
        if (resetPoint.length > 1 && this._options["smooth"]) {
          let resamplerRoute = DaxiMap.DXRouteCircelSampler.resampler(resetPoint);
          if (resamplerRoute.length > 0) {
            resamplerRoute = resamplerRoute[0];
          }
        }

        features.forEach(function (feature) {
          if (feature["properties"]["lineType"] != "gray") {
            feature["geometry"]["coordinates"] = resamplerRoute;
          }
        });
        this._source["setData"](data);
        let arrowSourceId = this._sourceId + "_arrow";
        let sourceObj = this._map["getSource"](arrowSourceId);
        if (sourceObj) {
          let arrowData = sourceObj["_data"];
          arrowData["features"].forEach(function (item) {
            item["geometry"]["coordinates"] = resamplerRoute;
          });
          sourceObj["setData"](arrowData);
        }
      },
      addLineArrow: function (data) {
        let thisObject = this;
        let lineData = data || thisObject._drawLineData; //DXMapUtils.copyData(this._options["lineData"]);

        let layerId = thisObject._layerId + "_arrow";
        let sourceId = thisObject._sourceId + "_arrow";
        let sourceData = {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {
                  lineType: "arrow",
                  arrowIcon: "arrowIcon",
                  // "lineWidth": options["lineWidth"] || 8,
                  // "lineColor": options["lineColor"] || "#009EFF",
                  lineOpacity: this._options["alpha"] || 1,
                },
                geometry: {
                  type: "LineString",
                  coordinates: lineData,
                },
              },
            ],
          },
        };

        thisObject._map["addSource"](sourceId, sourceData);

        let layerData = {
          type: "line",
          id: layerId,
          paint: {
            "line-pattern": ["get", "arrowIcon"],
            "line-color": this._options["lineColor"] || ["string", ["get", "lineColor"], "#009EFF"],
            "line-width": ["number", ["get", "lineWidth"], 8],
            "line-opacity": ["number", ["get", "lineOpacity"], 1.0],
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          source: sourceId,
        };
        this._mapSDK._coreMap.addToMapBox(layerData, "routeLayer");
      },
      updateSource: function (data) {
        if (data["features"]) {
          this._source["setData"](data);
        }
      },
      updateData: function (data) {
        let options = this._options;
        this._sourceId = this._id;
        if (data["features"]) {
          this._source["setData"](data);
          return;
        }
        let geojson = {
          type: "FeatureCollection",
          features: [],
        };
        let geodata = {
          type: "FeatureCollection",
          features: [],
        };
        if (data["lineData"] || data["linePoints"]) {
          data["lineData"] = data["lineData"] || data["linePoints"];
          let lineData = DXMapUtils.copyData(data["lineData"]);
          if (data["smooth"]) {
            let lineData = DaxiMap.DXRouteCircelSampler.resampler(lineData);
            if (lineData.length > 0) {
              lineData = lineData[0];
            } else {
              return;
            }
          }
          this.computeTimeOfPoint(lineData, data["lineData"]);
          this._drawLineData = lineData;

          if (data["outLine"]) {
            let outLine = data["outLine"];
            let feature = {
              type: "Feature",
              properties: {
                lineType: "normal",
                lineWidth: outLine["lineWidth"] || 10,
                lineColor: outLine["lineColor"] || "#009EFF",
                lineOpacity: data["alpha"] || 1.0,
              },
              geometry: {
                type: "LineString",
                coordinates: lineData,
              },
            };
            geodata["features"].push(feature);
          }
          let feature = {
            type: "Feature",
            properties: {
              lineType: "gray",
              lineWidth: data["lineWidth"] || options["lineWidth"],
              lineColor: data["lineColor"] || options["lineColor"],
              lineOpacity: data["alpha"] || 1.0,
            },
            geometry: {
              type: "LineString",
              coordinates: lineData,
            },
          };
          geojson["features"].push(feature);
          let source = this._map["getSource"](this._sourceId);
          source["setData"](geojson);
          return;
        }
        if (!data.length) {
          console.log("数据非法");
          return;
        }
        data.forEach(function (item) {
          let feature = {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [],
            },
          };
          for (let key in item) {
            if (key != "points") {
              feature["properties"][key] = item[key];
            } else {
              if (typeof item["points"] == "string") {
                let arr = item["points"].split(";");
                arr.forEach(function (point) {
                  let lonlat = point.split(",");
                  feature["geometry"]["coordinates"].push([parseFloat(lonlat[0]), parseFloat(lonlat[1])]);
                });
              } else if (typeof item["points"] == "object") {
                feature["geometry"]["coordinates"] = item["points"];
              }
            }
          }
          geodata["features"].push(feature);
        });
        this._source["setData"](geodata);
      },
      updateLineColor: function (lineColor, outLineColor) {
        if (this._options["lineColor"]) {
          lineColor && this._map["setPaintProperty"](this._sourceId, "line-color", lineColor);
        } else {
          let data = this._source["_data"];
          outLineColor && (data["features"][0]["properties"]["lineColor"] = outLineColor);
          lineColor && data["features"][1] && (data["features"][1]["properties"]["lineColor"] = lineColor);
          this._source["setData"](data);
        }
      },
      updateLineWidth: function (lineWidth, outLineWidth) {
        let data = this._source["_data"];
        outLineWidth && (data["features"][0]["properties"]["lineWidth"] = outLineWidth);
        lineWidth && data["features"][1] && (data["features"][1]["properties"]["lineWidth"] = lineWidth);
        this._source["setData"](data);
      },
      updateLineTransparency: function (opacity) {
        let data = this._source["_data"];
        opacity && (data["features"][0]["properties"]["lineOpacity"] = opacity);
        opacity && data["features"][1] && (data["features"][1]["properties"]["lineOpacity"] = opacity);
        this._source["setData"](data);
      },
      removeFromMap: function () {
        let thisObject = this;
        if (!thisObject._map["getLayer"](this._layerId)) {
          return;
        }
        thisObject._map["removeLayer"](this._layerId);
        thisObject._map["removeSource"](this._sourceId);
        if (thisObject._map["getLayer"](this._layerId + "_arrow")) {
          thisObject._map["removeLayer"](this._layerId + "_arrow");
          thisObject._map["removeSource"](this._sourceId + "_arrow");
        }

        let scene = thisObject._mapSDK._coreMap._scene;
        scene.removeChild(thisObject);
      },

      checkFloor: function () {
        let visible = this._visible;
        if (this._floorObject) {
          visible = visible && this._floorObject.visible;
        }
        let value = visible == true ? "visible" : "none";
        if (this._map["getLayer"](this._layerId)) {
          this._map["setLayoutProperty"](this._layerId, "visibility", value);
          if (this._options["showArrow"]) {
            // if(this._map["getLayer"](this._layerId + "_arrow")){
            this._map["setLayoutProperty"](this._layerId + "_arrow", "visibility", value);
          }
        }
      },
    });

    daximap.defineProperties(DXPolyline.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneObject.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          if (val != this._visible) {
            this._visible = val;
            this.checkFloor();
          }
        },
      },
      floorId: {
        get: function () {
          return this._floorId;
        },
      },
    });
    return DXPolyline;
  })(DXSceneObject);
  daximap["DXPolyline"] = DXPolyline;

  //////////////////////////////////////////////////////////////
  // DXSceneArrow
  //////////////////////////////////////////////////////////////
  let DXSceneArrow = (function (DXSceneObject) {
    "use strict";
    let DXSceneArrow = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXSceneArrow";
        thisObject._sourceId = "";
        thisObject._source = null;
        thisObject._options = null;
        thisObject._position = [0, 0];
      },
      initialize: function (mapSDK, options, floorId) {
        this._mapSDK = mapSDK;
        this._floorId = floorId;
        this._options = options;
        this._bdid = options["bdid"] || "";
        this._map = this._mapSDK._coreMap._mapboxMap;
      },

      addToMap: function () {
        if (!this._options) return;
        let thisObject = this;
        let options = this._options;
        thisObject._layerId = thisObject._id;
        thisObject._sourceId = thisObject._id;
        let lineData = options["lineData"];
        let geojson = {
          type: "FeatureCollection",
          features: [],
        };
        if (options["outLine"]) {
          let outLine = options["outLine"];
          let feature = {
            type: "Feature",
            properties: {
              lineWidth: outLine["lineWidth"] || 16,
              lineColor: outLine["lineColor"] || "#016142", //"#009EFF"
            },
            geometry: {
              type: "LineString",
              coordinates: lineData,
            },
          };
          geojson["features"].push(feature);
        }
        let feature = {
          type: "Feature",
          properties: {
            lineWidth: options["lineWidth"] || 14,
            lineColor: options["lineColor"] || "#04a571", //"rgba(4,165,113,0.8)"//"#04a571"
          },
          geometry: {
            type: "LineString",
            coordinates: lineData,
          },
        };
        geojson["features"].push(feature);
        let sourceData = {
          type: "geojson",
          data: geojson,
        };
        thisObject._map["addSource"](thisObject._sourceId, sourceData);
        thisObject._source = thisObject._map["getSource"](thisObject._sourceId);

        let layerOptions = {
          type: "line",
          id: thisObject._layerId,
          paint: {
            "line-opacity": 1,
            "line-color": ["string", ["!=", ["get", "lineColor"], null], ["get", "lineColor"], "#009EFF"],
            "line-width": ["number", ["!=", ["get", "lineWidth"], null], ["get", "lineWidth"], 8],
          },
          layout: {},
          // "type" : "symbol",
          // "id" : thisObject._layerId,
          // "paint" : {
          //      'icon-color':'#009EFF',
          // },
          // "layout" : {
          //     'symbol-placement': 'line',
          //     // 'symbol-spacing': 30, // 图标间隔，默认为250 不能小于1
          //     'icon-image':'routeArrow', //箭头图标
          //     "icon-anchor":"center",
          //     'icon-size': 0.3
          // },
          source: thisObject._sourceId,
        };
        this._mapSDK._coreMap.addToMapBox(layerOptions, "routeLayer");
        let arrowId = thisObject._layerId + "_arrow";
        let headPoint = lineData[lineData.length - 1];
        let sourceData2 = {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                id: arrowId,
                geometry: {
                  type: "Point",
                  coordinates: [headPoint[0], headPoint[1]],
                },
                properties: {},
              },
            ],
          },
        };
        thisObject._map["addSource"](arrowId, sourceData2);
        let startPoint = lineData[lineData.length - 2];
        let angle = navi_utils.getAngle({ x: startPoint[0], y: startPoint[1] }, { x: headPoint[0], y: headPoint[1] });
        if (!angle) {
          console.log("angel compute error:", angle, startPoint, headPoint);
        }
        let imageInfo = this._mapSDK._coreMap.getImageInfo("routeArrow2");
        let layerOptionsArrow = {
          type: "symbol",
          id: arrowId,
          layout: {
            "icon-image": "routeArrow2", //箭头图标
            "icon-anchor": "bottom",
            "icon-rotation-alignment": "map",
            "icon-rotate": angle || 0,
            "icon-size": window["naviArrowHeadSize"] || (imageInfo ? 32 / (imageInfo["width"] || 32) : 1),
          },
          source: arrowId,
        };
        this._mapSDK._coreMap.addToMapBox(layerOptionsArrow, "routeLayer");
        let scene = this._mapSDK._coreMap._scene;
        let floorId = this._floorId;
        let sceneFloorObject = scene.getChildById(this._bdid + floorId);
        if (sceneFloorObject) {
          this._floorObject = sceneFloorObject;
          this.checkFloor();
          scene.addChild(sceneFloorObject, this);
        } else {
          scene.addChild(scene.rootNode, this);
        }
      },
      removeFromMap: function () {
        let thisObject = this;
        if (thisObject._map["getLayer"](this._layerId)) {
          thisObject._map["removeLayer"](this._layerId);
          thisObject._map["removeSource"](this._sourceId);
        }
        if (thisObject._map["getLayer"](this._layerId + "_arrow")) {
          thisObject._map["removeLayer"](this._layerId + "_arrow");
          thisObject._map["removeSource"](this._layerId + "_arrow");
        }

        let scene = thisObject._mapSDK._coreMap._scene;
        scene.removeChild(thisObject);
      },
      setZIndexOffset: function (icon) {},
      checkFloor: function () {
        let visible = this._visible;
        if (this._floorObject) {
          visible = visible && this._floorObject.visible;
        }
        let value = visible == true ? "visible" : "none";
        if (this._map["getLayer"](this._layerId)) {
          this._map["setLayoutProperty"](this._layerId, "visibility", value);
          this._map["setLayoutProperty"](this._layerId + "_arrow", "visibility", value);
        }
      },
    });

    daximap.defineProperties(DXSceneArrow.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneObject.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          if (val != this._visible) {
            this._visible = val;
            this.checkFloor();
          }
        },
      },
    });
    return DXSceneArrow;
  })(DXSceneObject);
  daximap["DXSceneArrow"] = DXSceneArrow;

  //////////////////////////////////////////////////////////////
  // DXSceneSymbolLine
  //////////////////////////////////////////////////////////////
  let DXSceneSymbolLine = (function (DXSceneObject) {
    "use strict";
    let DXSceneSymbolLine = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXSceneSymbolLine";
        thisObject._sourceId = "";
        thisObject._source = null;
        thisObject._options = null;
        thisObject._position = [0, 0];
      },
      initialize: function (mapSDK, options, floorId) {
        this._mapSDK = mapSDK;
        this._floorId = floorId;
        this._options = options;
        this._bdid = options["bdid"] || "";
        this._map = this._mapSDK._coreMap._mapboxMap;

        this._id = options["id"] || DXMapUtils.createUUID();
      },

      addToMap: function () {
        if (!this._options) return;
        let thisObject = this;
        let options = this._options;
        thisObject._layerId = thisObject._id;
        thisObject._sourceId = thisObject._id;
        let iconName = options["arrowIcon"] || "arrowIcon";
        this._mapSDK._coreMap.loadImage(iconName, iconName, { width: options["width"], height: options["height"] }, function (err) {
          if (err) {
            console.log(err);
            return;
          }
          let lineData = options["lineData"];
          let sourceData = {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {
                    lineType: "arrow",
                    arrowIcon: iconName,
                    lineOpacity: options["alpha"] || 1,
                  },
                  geometry: {
                    type: "LineString",
                    coordinates: lineData,
                  },
                },
              ],
            },
          };

          thisObject._map["addSource"](thisObject._sourceId, sourceData);

          let layerData = {
            type: "line",
            id: thisObject._layerId,
            paint: {
              "line-pattern": ["get", "arrowIcon"],
              "line-color": options["lineColor"] || ["string", ["get", "lineColor"], "#009EFF"],
              "line-width": ["number", ["get", "lineWidth"], 8],
              "line-opacity": ["number", ["get", "lineOpacity"], 1.0],
            },
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            source: thisObject._sourceId,
          };

          thisObject._mapSDK._coreMap.addToMapBox(layerData, "routeLayer");
          let scene = thisObject._mapSDK._coreMap._scene;
          let floorId = thisObject._floorId;
          let sceneFloorObject = scene.getChildById(thisObject._bdid + floorId);
          if (sceneFloorObject) {
            thisObject._floorObject = sceneFloorObject;
            thisObject.checkFloor();
            scene.addChild(sceneFloorObject, thisObject);
          } else {
            scene.addChild(scene.rootNode, thisObject);
          }
        });
      },
      removeFromMap: function () {
        let thisObject = this;
        if (thisObject._map["getLayer"](this._layerId)) {
          thisObject._map["removeLayer"](this._layerId);
          thisObject._map["removeSource"](this._sourceId);
        }

        let scene = thisObject._mapSDK._coreMap._scene;
        scene.removeChild(thisObject);
      },

      checkFloor: function () {
        let visible = this._visible;
        if (this._floorObject) {
          visible = visible && this._floorObject.visible;
        }
        let value = visible == true ? "visible" : "none";
        if (this._map["getLayer"](this._layerId)) {
          this._map["setLayoutProperty"](this._layerId, "visibility", value);
        }
      },
    });

    daximap.defineProperties(DXSceneSymbolLine.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneObject.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          if (val != this._visible) {
            this._visible = val;
            this.checkFloor();
          }
        },
      },
    });
    return DXSceneSymbolLine;
  })(DXSceneObject);
  daximap["DXSceneSymbolLine"] = DXSceneSymbolLine;
  //////////////////////////////////////////////////////////////
  // DXRouteOverlay 路线
  //////////////////////////////////////////////////////////////
  let DXRouteOverlay = (function (DXSceneObject) {
    "use strict";
    let DXRouteOverlay = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXRouteOverlay";
        thisObject._renderObjects = [];
        thisObject._routesLayer = [];
      },
      initialize: function (mapSDK, options, extendoptions) {
        this._mapSDK = mapSDK;
        this._options = options;
        this.extendoptions = extendoptions;
        this._map = this._mapSDK._coreMap._mapboxMap;
      },
      getIconName: function (type, action, pIndex, nextFlIndex) {
        let iconName = "";
        let conType = "";
        switch (action) {
          case "0x05":
            conType = "ft";
            break;
          case "0x04":
            conType = "lt";
            break;
          case "0x03":
            conType = "dt";
            break;
          case "0x08":
            conType = "ft";
          default:
        }
        if (type == "start") {
          iconName = "out_";
          if (pIndex < nextFlIndex) {
            iconName += "up_";
          } else {
            iconName += "down_";
          }
          iconName += conType;
        } else {
          if (pIndex < nextFlIndex) {
            iconName += "up_";
          } else {
            iconName += "down_";
          }
          iconName += conType;
        }
        return iconName;
      },
      addToMap: function () {
        if (!this._options) return;
        let thisObject = this;
        let mapSDK = thisObject._mapSDK;
        let route = thisObject._options["route"] || thisObject._options["segments"];

        function createMarker(pointType, bdid, floorId, point, routeIndex, routeCount, segIndex, segCount, naviInfoList, step) {
          let iconName;
          //segIndex == 0
          if (thisObject.extendoptions && thisObject.extendoptions["startPoint"] === false && pointType == "start") {
            return;
          }
          if (thisObject.extendoptions && thisObject.extendoptions["endPoint"] === false && pointType == "end") {
            return;
          }
          if (pointType == "start") {
            if (routeIndex == 0 && segIndex == 0) {
              iconName = "start";
            } else {
              if (floorId == "outdoor" || segIndex == 0) {
                //|| action == "0x06"
                iconName = "huan_start";
              } else {
                if (step && step["lineType"] && step["lineType"] != "buxing") {
                  iconName = "entrance";
                } else {
                  let naviInfo = naviInfoList[segIndex];
                  let action = naviInfo["action"];
                  let fn = naviInfo["fn"];
                  let preNaviInfo = naviInfoList[segIndex - 1];
                  iconName = thisObject.getIconName("start", preNaviInfo["action"], preNaviInfo["fn"], fn); //,nextNaviInfo["fn"]
                }
              }
            }
            // iconName = (routeIndex == 0 && segIndex == 0)?"start":"huan_start";
          } else {
            if (routeIndex == routeCount - 1 && segIndex == segCount - 1) {
              iconName = "end";
            } else {
              if (floorId == "outdoor") {
                iconName = "huan_end";
              } else {
                let naviInfo = naviInfoList[segIndex];
                let action = naviInfo["action"];
                if (action == "0x06") {
                  if (!step || !step["lineType"] || step["lineType"] == "buxing") {
                    iconName = "huan_end";
                  } else {
                    iconName = "entrance";
                  }
                } else {
                  if (!step || !step["lineType"] || step["lineType"] == "buxing") {
                    let fn = naviInfo["fn"];
                    let nextNaviInfo = naviInfoList[segIndex + 1];
                    iconName = thisObject.getIconName("end", action, fn, nextNaviInfo["fn"]);
                  } else {
                    iconName = "entrance";
                  }
                }
              }
            }

            // iconName = (routeIndex == (routeCount-1) && segIndex == (segCount-1))?"end":"huan_end";
          }
          let markerInfo = {
            featureId: "route_" + pointType + "_" + routeIndex + "_" + segIndex,
            lon: parseFloat(point["lon"]),
            lat: parseFloat(point["lat"]),
            bdid: bdid || "",
            floorId: floorId, //isOutDoorLine?"outdoor":point["floorId"]||"outdoor",
            markerIcon: iconName,
            activeMarkerIcon: iconName,
            scale: 0.6,
            highlightScale: 0.6,
          };
          let marker = new DXSceneMarker();
          marker["initialize"](mapSDK, markerInfo);
          marker.id = DXMapUtils.createUUID();
          thisObject._renderObjects.push(marker);
          return marker;
        }

        function addPolyline(
          bdid,
          floorId,
          lineData,
          lineColor,
          outLineColor,
          startPoint,
          endPoint,
          index,
          routeCount,
          segIndex,
          segCount,
          naviInfoList,
          step,
        ) {
          let polylineOptions = {
            bdid: bdid,
            floorId: floorId,
            lineData: lineData,
            lineColor: lineColor,
            lineWidth: 8,
            outLine: {
              lineColor: outLineColor,
              lineWidth: 12,
            },
          };

          let polyline = new DXScenePolyline();
          polylineOptions.id = DXMapUtils.createUUID();
          polyline["initialize"](mapSDK, polylineOptions, floorId);
          thisObject._routesLayer.push(polyline);
          thisObject._renderObjects.push(polyline);
          // routerInfo["polyline"] = polyline;

          let _spoint = {
            lon: startPoint["lon"],
            lat: startPoint["lat"],
          };
          createMarker("start", bdid, floorId, _spoint, index, routeCount, segIndex, segCount, naviInfoList, step);

          let _epoint = {
            lon: endPoint["lon"],
            lat: endPoint["lat"],
          };
          createMarker("end", bdid, floorId, _epoint, index, routeCount, segIndex, segCount, naviInfoList, step);

          return polyline;
        }
        if (route) {
          let routeCount = route.length;
          route.forEach(function (routeItem, index) {
            let detail = routeItem["detail"];
            let startPoint = routeItem["startpoint"];
            let endPoint = routeItem["endpoint"];
            let routetype = routeItem["routetype"];
            let bdid = routeItem["bdid"] || startPoint["bdid"] || "";
            let startFloorId = startPoint["floorId"] || "outdoor";
            let endFloorId = endPoint["floorId"] || "outdoor";
            let isOutDoorLine = true;
            routetype == 3 ? (isOutDoorLine = false) : "";
            let lineColor = window["routeLineColor"] || "#02c387",
              outLineColor = window["routeOutLineColor"] || "#fff"; //"#036144";
            let indoorLineColor = window["indoorLineColor"] || "#009EFF",
              indoorOutLineColor = window["indoorOutLineColor"] || "rgba(255,255,255,0.9)"; //"#037fca";
            if (detail["path"]) {
              let lineData = [];
              let path = detail["path"];
              let segmentArr = [];
              path.forEach(function (pathItem) {
                let segments = pathItem["segments"];
                let pointArr = [];
                segments.forEach(function (segment) {
                  let arr = JSON.parse(segment["coor"]);
                  for (let i = 0, len = arr.length; i < len; i += 2) {
                    pointArr.push([parseFloat(arr[i]), parseFloat(arr[i + 1])]);
                  }
                });
                segmentArr = segmentArr.concat(pointArr.slice(1));
              });
              lineData = lineData.concat(segmentArr);

              addPolyline(bdid, isOutDoorLine ? "outdoor" : startFloorId, lineData, lineColor, outLineColor, startPoint, endPoint, index, routeCount, 0, 1);
            } else if (detail["steps"]) {
              let steps = detail["steps"];
              let pathLine = [];

              if (routetype == 3) {
                let naviInfoList = detail["rawRoute"]["route"][0]["path"]["naviInfoList"];
                steps.forEach(function (pathItem, segIndex) {
                  let lineData = [];
                  let lineColor = pathItem["lineColor"];
                  let outLineColor = pathItem["outLineColor"];
                  let polyline = pathItem["polyline"].split(";");
                  polyline.forEach(function (pos) {
                    pos = pos.split(",");
                    lineData.push([parseFloat(pos[0]), parseFloat(pos[1])]);
                  });
                  let floorId = pathItem["floorId"] || "";

                  let startPos = pathItem["origin"].split(",").map(function (str) {
                    return parseFloat(str);
                  });
                  let endPos = pathItem["destination"].split(",").map(function (str) {
                    return parseFloat(str);
                  });
                  // let geometry = naviInfoList[0]["geometry"]

                  // let resamplerRoute = DaxiMap.DXRouteCircelSampler.resampler(lineData);
                  // if (resamplerRoute.length > 0) {
                  //     lineData = resamplerRoute[0];
                  // } else {
                  //     return;
                  // }
                  addPolyline(
                    bdid,
                    floorId,
                    lineData,
                    lineColor || indoorLineColor,
                    outLineColor || indoorOutLineColor,
                    {
                      lon: startPos[0],
                      lat: startPos[1],
                    },
                    {
                      lon: endPos[0],
                      lat: endPos[1],
                    },
                    index,
                    routeCount,
                    segIndex,
                    steps.length,
                    naviInfoList,
                    pathItem,
                  );
                });
              } else {
                steps.forEach(function (pathItem, index) {
                  let polyline = pathItem["polyline"];

                  if (index == 0) {
                    pathLine = polyline.split(";");
                  } else {
                    pathLine = pathLine.concat(polyline.split(";").slice(1));
                  }
                });

                let lineData = [];
                pathLine.forEach(function (pos) {
                  pos = pos.split(",");
                  lineData.push([parseFloat(pos[0]), parseFloat(pos[1])]);
                });
                if (lineData.length != 0) {
                  addPolyline(
                    bdid,
                    "outdoor",
                    lineData,
                    detail["lineColor"] || lineColor,
                    detail["outLineColor"] || outLineColor,
                    startPoint,
                    endPoint,
                    index,
                    routeCount,
                    0,
                    1,
                    naviInfoList,
                  );
                }
              }
            } else if (detail["route"]) {
              let route = detail["route"];
              let paths = route["paths"];
              if (paths instanceof Array) {
                let steps = route["paths"][0]["steps"];
              } else {
                let steps = route["paths"]["steps"];
              }

              steps.forEach(function (pathItem, index) {
                let polyline = pathItem["polyline"];
                if (index == 0) {
                  pathLine = polyline.split(";");
                } else {
                  pathLine = pathLine.concat(polyline.split(";").slice(1));
                }
              });
              let floorId = detail["route"]["floorId"] || "";

              let startPos = detail["route"]["origin"].split(",").map(function (str) {
                return parseFloat(str);
              });

              let endPos = detail["route"]["destination"].split(",").map(function (str) {
                return parseFloat(str);
              });
              let lineData = [];
              if (pathLine) {
                pathLine.forEach(function (pos) {
                  pos = pos.split(",");
                  lineData.push([parseFloat(pos[0]), parseFloat(pos[1])]);
                });
              }
              // if(lineData.length == 0){
              //     lineData.push(startPos);
              //     lineData.push(endPos);
              // }
              if (lineData.length) {
                addPolyline(
                  bdid,
                  "outdoor",
                  lineData,
                  detail["lineColor"] || lineColor,
                  detail["outLineColor"] || outLineColor,
                  {
                    lon: startPos[0],
                    lat: startPos[1],
                  },
                  {
                    lon: endPos[0],
                    lat: endPos[1],
                  },
                  index,
                  routeCount,
                  0,
                  1,
                );
              }
            } else if (detail["transits"]) {
              isOutDoorLine = false;
              // let pathLine = [];
              let path = detail["transits"];

              // let segmentArr = [];
              path.forEach(function (pathItem, pindex) {
                let naviInfoList = detail["rawRoute"]["route"][pindex]["path"]["naviInfoList"];
                let segments = pathItem["segments"];
                let segCount = segments.length;
                segments.forEach(function (segment, segIndex) {
                  //indoor_wolking
                  let steps = segment["indoor_wolking"]["steps"];
                  let pointArr = [];
                  let floorId = "";
                  steps.forEach(function (step, index) {
                    floorId = step["floor"];
                    let polyline = step["polyline"];
                    let arr = polyline.split(";");
                    let i = 0;
                    if (index != 0) {
                      i = 1;
                    }
                    let len = arr.length;
                    for (; i < len; i++) {
                      let _tempArr = arr[i].split(",");
                      pointArr.push([parseFloat(_tempArr[0]), parseFloat(_tempArr[1])]);
                    }
                  });

                  // let resamplerRoute = DaxiMap.DXRouteCircelSampler.resampler(pointArr);
                  // if (resamplerRoute.length > 0) {
                  //     resamplerRoute = resamplerRoute[0];
                  // } else {
                  //     return;
                  // }
                  let resamplerRoute = pointArr;
                  let lastPoint = pointArr[pointArr.length - 1];
                  let _spoint = {
                    lon: pointArr[0][0],
                    lat: pointArr[0][1],
                  };
                  let _epoint = {
                    lon: lastPoint[0],
                    lat: lastPoint[1],
                  };
                  if (routetype == 3) {
                    addPolyline(
                      bdid,
                      floorId,
                      resamplerRoute,
                      step["lineColor"] || indoorLineColor,
                      step["outLineColor"] || indoorOutLineColor,
                      _spoint,
                      _epoint,
                      index,
                      routeCount,
                      segIndex,
                      segCount,
                      naviInfoList,
                    );
                  } else {
                    addPolyline(
                      bdid,
                      floorId,
                      resamplerRoute,
                      step["lineColor"] || lineColor,
                      step["outLineColor"] || outLineColor,
                      _spoint,
                      _epoint,
                      index,
                      routeCount,
                      segIndex,
                      segCount,
                      naviInfoList,
                    );
                  }
                });
              });
            } else if (detail["polyline"]) {
              let lineData = [];
              let polyline = detail["polyline"].split(";");
              polyline.forEach(function (pos) {
                pos = pos.split(",");
                lineData.push([parseFloat(pos[0]), parseFloat(pos[1])]);
              });
              // let lineColor = "#02c387",outLineColor = "#036144";
              let floorId = "outdoor";
              if (routetype == 3) {
                // let resamplerRoute = DaxiMap.DXRouteCircelSampler.resampler(lineData);
                // if (resamplerRoute.length > 0) {
                //     lineData = resamplerRoute[0];
                // } else {
                //     return;
                // }
                let resamplerRoute = lineData;
                // lineColor = "#009EFF";
                // outLineColor = "#037fca";
                floorId = detail["floorId"] || floorId;
                addPolyline(
                  bdid,
                  floorId,
                  resamplerRoute,
                  detail["lineColor"] || indoorLineColor,
                  detail["outLineColor"] || indoorOutLineColor,
                  startPoint,
                  endPoint,
                  index,
                  routeCount,
                  0,
                  1,
                );
              } else {
                addPolyline(
                  bdid,
                  floorId,
                  lineData,
                  detail["lineColor"] || lineColor,
                  detail["outLineColor"] || outLineColor,
                  startPoint,
                  endPoint,
                  index,
                  routeCount,
                  0,
                  1,
                );
              }
            }
          });
        } else if (thisObject._options["lineData"] || thisObject._options["linePoints"]) {
          let lineData = thisObject._options["lineData"] || thisObject._options["linePoints"];
          let lineColor = thisObject._options["lineColor"] || "#02c387";
          // let lineWidth = thisObject._options["lineWidth"]||8;
          // let wrapperWidth = thisObject._options["wrapperWidth"]||12;
          let wrapperColor = thisObject._options["wrapperColor"] || "#036144";
          addPolyline(bdid, floorId, lineData, lineColor, wrapperColor, startPoint, endPoint, index, routeCount, 0, 1);
        }
        for (let objIndex in thisObject._renderObjects) {
          let renderObject = thisObject._renderObjects[objIndex];
          if (renderObject) {
            renderObject["addToMap"]();
          }
        }
      },
      removeFromMap: function () {
        let thisObject = this;
        for (let objIndex in thisObject._renderObjects) {
          let renderObject = thisObject._renderObjects[objIndex];
          if (renderObject) {
            renderObject["removeFromMap"]();
          }
        }
        thisObject._renderObjects.length = 0;
        thisObject._renderObjects = [];
        DXClearLineArrowVisitor(thisObject._mapSDK._coreMap._scene).visit();
      },
      setZIndexOffset: function (icon) {},
      setGrayT: function (segmentIndex, floorId, grayT, isHide) {
        !floorId ? (floorId = "outdoor") : "";
        let segmentRoutesLyer = this._routesLayer[segmentIndex];
        if (segmentRoutesLyer) {
          if (segmentRoutesLyer._floorId == floorId) {
            segmentRoutesLyer["setGrayPoints"](grayT, isHide);
          }
          // for(let i = 0,len = segmentRoutesLyer.length;i<len;i++){
          //   if(segmentRoutesLyer[i]["polyline"]._floorId == floorId){
          //     segmentRoutesLyer[i]["polyline"]["setGrayPoints"](grayT,isHide);
          //   }
          // }
        }
      },
    });

    daximap.defineProperties(DXRouteOverlay.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneObject.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          // if(this._visible === val) return;
          this._visible = val;
          for (let ro in this._renderObjects) {
            this._renderObjects[ro]["visible"] = val;
          }
        },
      },
    });
    return DXRouteOverlay;
  })(DXSceneObject);
  daximap["DXRouteOverlay"] = DXRouteOverlay;

  //////////////////////////////////////////////////////////////
  // DXRouteManager
  //////////////////////////////////////////////////////////////
  let DXRouteManager = (function (Class) {
    "use strict";
    let RouteManager = Class.extend({
      __init__: function () {
        // this["_super"]();
        let thisObject = this;
        thisObject._id = "";
        thisObject._name = "";
        thisObject._rtti = "DXRouteManager";
        thisObject._parentNode = null;
        thisObject._visible = true;
        thisObject._mapSDK = null;
        thisObject.routeOverlays = [];
        thisObject.routeOverlay = null;
      },

      initialize: function (mapSDK) {
        this._mapSDK = mapSDK;
        mapSDK._on("onIndoorBuildingActive", this.onIndoorBuildingActive);
      },
      onIndoorBuildingActive: function (sender, building) {
        console.log(building);
      },
      clearRoutes: function () {
        let thisObject = this;
        thisObject.routeOverlay && thisObject.routeOverlay["removeFromMap"]();
      },
      // setTransitsDatas
      setRouteDatas: function (routes, activeIndex, routeOptions) {
        this._routes = routes;
        this.routeOptions = routeOptions;
        this["activeRouteByIndex"](activeIndex);
      },
      activeRouteByIndex: function (index) {
        if (index == undefined) {
          index = 0;
        }
        if (index >= 0 && index < this._routes.length) {
          //&& this._activeIndex != index
          this._activeIndex = index;
          this["clearRoutes"]();
          this["drawRoute"]();
        }
      },
      getActiveData: function () {
        return this._routes[this._activeIndex];
      },
      checkVisible: function () {
        let val = this._visible;
        this.routeOverlay && (this.routeOverlay["visible"] = val);
      },
      drawRoute: function () {
        let thisObject = this;
        let route = this._routes[this._activeIndex];
        let routeOverlay = new DXRouteOverlay();
        routeOverlay["initialize"](thisObject._mapSDK, route, this.routeOptions);
        routeOverlay["addToMap"]();
        thisObject.routeOverlay = routeOverlay;
        this.checkVisible();
      },
      setGrayByTime: function (segmentIndex, floorId, grayT, overHide) {
        this.routeOverlay["setGrayT"](segmentIndex, floorId, grayT, overHide);
      },
      removeFromMap: function () {
        this._routes = [];
        this["clearRoutes"]();
        this._mapSDK._off("onIndoorBuildingActive", this.onIndoorBuildingActive);
      },
    });

    daximap.defineProperties(RouteManager.prototype, {
      /**
       * 对象的id,一般采用uuid
       * @type String
       * @memberof DXRouteManager.prototype
       */
      id: {
        get: function () {
          return this._id;
        },

        set: function (val) {
          this._id = val;
        },
      },

      /**
       * 对象的名字
       * @type String
       * @memberof RouteManager.prototype
       */
      name: {
        get: function () {
          return this._name;
        },

        set: function (val) {
          this._name = val;
        },
      },

      /**
       * 对象的rtti
       * @type String
       * @memberof RouteManager.prototype
       * @readonly
       */
      rtti: {
        get: function () {
          return this._rtti;
        },
      },

      /**
       * 对象的可见性
       * @type Boolean
       * @memberof RouteManager.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          if (this._visible != val) {
            this._visible = val;
            this.checkVisible();
          }
        },
      },

      /**
       * 对象的父亲对象
       * @type Boolean
       * @memberof RouteManager.prototype
       */
      parentNode: {
        get: function () {
          return this._parentNode;
        },
        set: function (val) {
          this._parentNode = val;
        },
      },
    });
    return RouteManager;
  })(Class);
  daximap["DXRouteManager"] = DXRouteManager;
  //////////////////////////////////////////////////////////////
  // DXSingleMarker
  //////////////////////////////////////////////////////////////
  let DXSingleMarker = function (coreMap) {
    this.coreMap = coreMap;
    this.map = coreMap._mapboxMap;
    this.type = "DXSingleMarker";
    this.visible = false;
    this.layerId = "";
    this.sourceId = "";
  };

  let DXSingleMarker_proto = DXSingleMarker.prototype;
  DXSingleMarker_proto.init = function (data) {
    let id = data.id;
    let guid = DXMapUtils.createUUID();
    let layerId = guid;
    let sourceId = guid;
    this.layerId = layerId;
    this.sourceId = sourceId;
    let icon = data.iconName;
    let lon = data.lon,
      lat = data.lat,
      rotate = data.rotate;
    let feature = {
      type: "Feature",
      id: id,
      properties: {
        featureId: id,
        iconName: icon,
        rotate: rotate,
      },
      geometry: {
        type: "Point",
        coordinates: [],
      },
    };
    let sourceData = {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [feature],
      },
    };
    let layerData = {
      id: layerId,
      source: sourceId,
      type: data["type"] || "symbol",
      minZoom: 1,
      maxZoom: 28,
    };
    let paint = {};
    let layout = {
      "icon-image": ["string", ["get", "iconName"], "blue_dot"],
      "icon-size": data["icon-size"] || 0.5,
      // "icon-rotate":45,//["number",['!=', ["get","rotate"],null],["get","rotate"],0],
      "icon-rotate": {
        type: "identity",
        property: "rotate",
        default: 0,
      },
      "icon-rotation-alignment": data["icon-rotation-alignment"] || "map",
      "icon-anchor": "center",
      "icon-allow-overlap": !0,
      "text-allow-overlap": !0,
      "symbol-avoid-edges": !0,
      "icon-ignore-placement": !0,
    };
    if (data["type"] == "circle") {
      layout = {};
      paint = {
        "circle-color": data["circle-color"] || "#4fabfb", //"#f98020",
        // "circle-blur":1,
        "circle-opacity": data["icon-opacity"] || 0.5,
        "circle-radius": data["icon-radius"] || 50,
        "circle-stroke-width": 2,
        "circle-stroke-opacity": 1,
        "circle-stroke-color": data["circle-stroke-color"] || "#72baf9",
      };
    }
    if (data["type"] == "symbol") {
      paint = {
        "text-color": ["string", ["get", "color"], "#202"], //"#363535"
        "text-halo-color": "#fff",
        "text-halo-width": 1,
      };
    }

    let style = getStyle(layerData["type"], {
      layout: layout,
      paint: paint,
    });
    layerData["layout"] = style["layout"];
    layerData["paint"] = style["paint"];
    this.map["addSource"](sourceId, sourceData);
    this.coreMap.addToMapBox(layerData, "topLayer");
    this.map["setLayoutProperty"](this.layerId, "visibility", this.visible == true ? "visible" : "none");
  };
  DXSingleMarker_proto["setVisible"] = function (visible) {
    let oldVisible = this.visible;
    if (oldVisible != visible) {
      this.visible = visible;
      this.map["setLayoutProperty"](this.layerId, "visibility", visible == true ? "visible" : "none");
    }
  };
  DXSingleMarker_proto["setPosition"] = function (lon, lat, heading) {
    let sourceObj = this.map["getSource"](this.sourceId);
    let data = sourceObj["_data"];
    let feature = data["features"][0];
    if (heading != undefined) {
      feature["properties"]["rotate"] = heading;
    }
    feature["geometry"]["coordinates"] = [lon, lat];
    sourceObj["setData"](data);
  };
  DXSingleMarker_proto["setOpacity"] = function (opacity) {
    this.map["setPaintProperty"](this.layerId, "icon-opacity", opacity);
  };
  DXSingleMarker_proto["updateStyle"] = function (params) {
    let paint = params["paint"];
    let layout = params["layout"];
    let layerId = this.layerId;
    if (this.map["getLayer"](layerId)) {
      if (paint) {
        for (let key in paint) {
          this.map["setPaintProperty"](layerId, key, paint[key]);
        }
      }
      if (layout) {
        for (let key in paint) {
          this.map["setLayoutProperty"](layerId, key, layout[key]);
        }
      }
    }
  };

  //////////////////////////////////////////////////////////////
  // DXIndoorRouteOverlay
  //////////////////////////////////////////////////////////////
  let DXIndoorRouteOverlay = (function (DXSceneObject) {
    "use strict";
    let DXIndoorRouteOverlay = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXIndoorRouteOverlay";
        thisObject._renderObjects = [];
      },
      initialize: function (mapSDK, options) {
        this._mapSDK = mapSDK;
        this._options = options;
        this._map = this._mapSDK._coreMap._mapboxMap;
      },

      getRange2: function (iconName) {
        let spriteData = this._mapSDK.spriteData;
        if (spriteData && spriteData[iconName]) {
          let params = spriteData[iconName];
          return [
            params["x"],
            params["y"],
            params["width"],
            params["height"],
            params["imgWidth"] || this._mapSDK._coreMap.spriteWidth,
            params["imgHeight"] || this._mapSDK._coreMap.spriteHeight,
          ];
          // return [0,0,64,64,params["imgWidth"]||1024,params["imgHeight"]||2048];
        }
      },

      parseVector3: function (str) {
        let ret = [0, 0, 0];
        let strArr = str.split(",");
        let count = strArr.length;
        if (count >= 2) {
          ret[0] = parseFloat(strArr[0]);
          ret[1] = parseFloat(strArr[1]);
        }
        if (count > 2) {
          ret[2] = parseFloat(strArr[2]);
        }
        return ret;
      },
      getIconName: function (type, action, pIndex, nextFlIndex) {
        let iconName = "";
        let conType = "";
        switch (action) {
          case "0x05":
            conType = "ft";
            break;
          case "0x04":
            conType = "lt";
            break;
          case "0x03":
            conType = "dt";
          case "0x08":
            conType = "ft";
          default:
        }
        if (type == "start") {
          iconName = "out_";
          if (pIndex < nextFlIndex) {
            iconName += "up_";
          } else {
            iconName += "down_";
          }
          iconName += conType;
        } else {
          if (pIndex < nextFlIndex) {
            iconName += "up_";
          } else {
            iconName += "down_";
          }
          iconName += conType;
        }
        return iconName;
      },
      addToMap: function () {
        if (!this._options) return;
        let thisObject = this;
        let mapSDK = thisObject._mapSDK;
        let assetsPath = mapSDK.config.absAssetsPath;

        let route = thisObject._options["route"];
        if (route) {
          let routeCount = route.length;
          function createMarker(pointType, bdid, floorId, point, routeIndex, routeCount, segIndex, segCount, naviInfoList) {
            let iconName;
            if (pointType == "start") {
              if (routeIndex == 0 && segIndex == 0) {
                iconName = "start";
              } else {
                if (floorId == "outdoor" || segIndex == 0) {
                  //|| action == "0x06"
                  iconName = "huan_start";
                } else {
                  let naviInfo = naviInfoList[segIndex];
                  let action = naviInfo["action"];
                  let fn = naviInfo["fn"];
                  let preNaviInfo = naviInfoList[segIndex - 1];
                  iconName = thisObject.getIconName("start", preNaviInfo["action"], preNaviInfo["fn"], fn); //,nextNaviInfo["fn"]
                }
              }
              // iconName = (routeIndex == 0 && segIndex == 0)?"start":"huan_start";
            } else {
              if (routeIndex == routeCount - 1 && segIndex == segCount - 1) {
                iconName = "end";
              } else {
                if (floorId == "outdoor") {
                  iconName = "huan_end";
                } else {
                  let naviInfo = naviInfoList[segIndex];
                  let action = naviInfo["action"];
                  if (action == "0x06") {
                    iconName = "huan_end";
                  } else {
                    let fn = naviInfo["fn"];
                    let nextNaviInfo = naviInfoList[segIndex + 1];
                    iconName = thisObject.getIconName("end", action, fn, nextNaviInfo["fn"]);
                  }
                }
              }
              // iconName = (routeIndex == (routeCount-1) && segIndex == (segCount-1))?"end":"huan_end";
            }
            let markerInfo = {
              featureId: "route_" + pointType + "_" + routeIndex + "_" + segIndex,
              pos: [parseFloat(point["lon"]), parseFloat(point["lat"]), 0.5],
              bdid: bdid,
              floorId: floorId,
              imageUrl: mapSDK._coreMap.spriteUrl,
              range1: thisObject.getRange2(iconName),
              scale: 0.6,
              highlightScale: 0.6,
            };
            let marker = new DXIndoorMarker();
            marker["initialize"](mapSDK, markerInfo);
            marker.id = DXMapUtils.createUUID();
            thisObject._renderObjects.push(marker);
          }
          route.forEach(function (routeItem, index) {
            if (routeItem["routetype"] != 3) {
              return;
            }
            let detail = routeItem["detail"];
            let startPoint = routeItem["startpoint"];
            let endPoint = routeItem["endpoint"];
            let isOutDoorLine = true;
            if (detail["path"]) {
              let pathLine = [];
              let path = detail["path"];
              let segmentArr = [];
              path.forEach(function (pathItem) {
                let segments = pathItem["segments"];
                let pointArr = [];
                segments.forEach(function (segment) {
                  let arr = JSON.parse(segment["coor"]);
                  for (let i = 0, len = arr.length; i < len; i += 2) {
                    pointArr.push([parseFloat(arr[i]), parseFloat(arr[i + 1])]);
                  }
                });
                segmentArr = segmentArr.concat(pointArr.slice(1));
              });
              pathLine = pathLine.concat(segmentArr);
              // let resamplerRoute = DaxiMap.DXRouteCircelSampler.resampler(pathLine);
              // if (resamplerRoute.length > 0) {
              //     resamplerRoute = resamplerRoute[0];
              // } else {
              //     return;
              // }
              let resamplerRoute = pathLine;
              let polylineOptions = {
                lineData: resamplerRoute, //pathLine,
                lineColor: "#02c387",
                lineWidth: 14,
                imageUrl: assetsPath + "images/line_blue.png",
                outLine: {
                  lineColor: "#036144",
                  lineWidth: 12,
                },
              };
              let polyline = new DXIndoorPolyline();
              polyline["initialize"](mapSDK, polylineOptions);
              polyline.id = DXMapUtils.createUUID();
              thisObject._renderObjects.push(polyline);

              // let _spoint = {"lon":pathLine[0][0],"lat":pathLine[0][1]};
              let _spoint = {
                lon: startPoint["lon"],
                lat: startPoint["lat"],
              };
              createMarker("start", "", "outdoor", _spoint, index, routeCount, 0, 1);
              // let lastPoint = pathLine[pathLine.length - 1];
              // let _epoint = {"lon":lastPoint[0],"lat":lastPoint[1]};
              let _epoint = {
                lon: endPoint["lon"],
                lat: endPoint["lat"],
              };
              createMarker("end", "", "outdoor", _epoint, index, routeCount, 0, 1);
            } else if (detail["steps"]) {
              let steps = detail["steps"];
              let pathLine = [];
              if (routeItem["routetype"] != 3) {
                steps.forEach(function (pathItem, index) {
                  let polyline = pathItem["polyline"];
                  if (index == 0) {
                    pathLine = polyline.split(";");
                  } else {
                    pathLine = pathLine.concat(polyline.split(";").slice(1));
                  }
                });
                let lineData = [];
                pathLine.forEach(function (pos) {
                  pos = pos.split(",");
                  lineData.push([parseFloat(pos[0]), parseFloat(pos[1])]);
                });
                // let resamplerRoute = DaxiMap.DXRouteCircelSampler.resampler(lineData);
                // if (resamplerRoute.length > 0) {
                //     resamplerRoute = resamplerRoute[0];
                // } else {
                //     return;
                // }
                let resamplerRoute = lineData;
                let polylineOptions = {
                  lineData: resamplerRoute, //lineData,
                  lineColor: "#02c387",
                  lineWidth: 14,
                  imageUrl: assetsPath + "images/line_blue.png",
                  outLine: {
                    lineColor: "#036144",
                    lineWidth: 12,
                  },
                };
                let polyline = new DXIndoorPolyline();
                polyline["initialize"](mapSDK, polylineOptions);
                polyline.id = DXMapUtils.createUUID();
                thisObject._renderObjects.push(polyline);

                // let _spoint = {"lon":pathLine[0][0],"lat":pathLine[0][1]};
                let _spoint = { lon: startPoint["lon"], lat: startPoint["lat"] };
                createMarker("start", "", "outdoor", _spoint, index, routeCount, 0, 1);
                // let lastPoint = pathLine[pathLine.length - 1];
                // let _epoint = {"lon":lastPoint[0],"lat":lastPoint[1]};
                let _epoint = { lon: endPoint["lon"], lat: endPoint["lat"] };
                createMarker("end", "", "outdoor", _epoint, index, routeCount, 0, 1);
              } else {
                // 室内路线
                let naviInfoList = detail["rawRoute"]["route"][0]["path"]["naviInfoList"];
                let bdid = routeItem["bdid"] || detail["rawRoute"]["route"][0]["buildingId"] | "";
                let rCount = naviInfoList.length;
                let pathArr = [];
                steps.forEach(function (pathItem, index) {
                  let polyline = pathItem["polyline"];

                  let pathLine = polyline.split(";");
                  let lineData = [];
                  pathLine.forEach(function (pos) {
                    pos = pos.split(",");
                    lineData.push([parseFloat(pos[0]), parseFloat(pos[1])]);
                  });
                  pathItem["lineData"] = lineData;
                });
                steps.forEach(function (pathItem, index) {
                  let lineData = pathItem["lineData"];
                  let floorId = pathItem["floorId"];

                  // let resamplerRoute = DaxiMap.DXRouteCircelSampler.resampler(lineData);
                  // if (resamplerRoute.length > 0) {
                  //     resamplerRoute = resamplerRoute[0];
                  // } else {
                  //     return;
                  // }
                  let resamplerRoute = lineData;
                  let polylineOptions = {
                    bdid: bdid,
                    floorId: floorId,
                    lineData: resamplerRoute, //lineData,
                    // "lineColor": "#009EFF",
                    lineWidth: 14,
                    imageUrl: assetsPath + "images/line_blue.png",
                    outLine: {
                      lineColor: "#037fca",
                      lineWidth: 12,
                    },
                  };
                  let polyline = new DXIndoorPolyline();
                  polyline["initialize"](mapSDK, polylineOptions, floorId);
                  polyline.id = DXMapUtils.createUUID();
                  thisObject._renderObjects.push(polyline);

                  let startPos = pathItem["origin"].split(",");
                  let endPos = pathItem["destination"].split(",");
                  let _spoint = {
                    lon: parseFloat(startPos[0]),
                    lat: parseFloat(startPos[1]),
                  };
                  createMarker("start", bdid, floorId, _spoint, index, rCount, 0, 1, naviInfoList);

                  let _epoint = {
                    lon: parseFloat(endPos[0]),
                    lat: parseFloat(endPos[1]),
                  };

                  createMarker("end", bdid, floorId, _epoint, index, rCount, 0, 1, naviInfoList);
                  if (index < rCount - 1) {
                    let curSeg = pathItem;
                    let nexSeg = steps[index + 1];
                    if (!nexSeg["floorId"]) {
                      nexSeg["floorId"] = naviInfoList[index + 1]["floor"];
                    }
                    let start = thisObject.parseVector3(curSeg["destination"]);
                    let end = thisObject.parseVector3(nexSeg["origin"]);
                    let polylineOptions = {
                      bdid: bdid,
                      lineData: [start, end],
                      lineColor: "#009EFF",
                      lineWidth: 32,
                      imageUrl: assetsPath + "images/line_blue.png",
                      startFloor: curSeg["floorId"],
                      endFloor: nexSeg["floorId"],
                      outLine: {
                        lineColor: "#037fca",
                        lineWidth: 10,
                      },
                    };
                    let polyline = new DXIndoorLinkPolyline();
                    polyline["initialize"](mapSDK, polylineOptions);
                    polyline.id = DXMapUtils.createUUID();
                    thisObject._renderObjects.push(polyline);
                  }
                });
              }
            } else if (detail["transits"]) {
              isOutDoorLine = false;
              let path = detail["transits"];

              let bdid = routeItem["bdid"] || routeItem["startpoint"]["bdid"] || "";
              path.forEach(function (pathItem, pindex) {
                let segments = pathItem["segments"];
                let segCount = segments.length;
                segments.forEach(function (segment, segIndex) {
                  //indoor_wolking

                  let steps = (segment["indoor_wolking"] && segment["indoor_wolking"]["steps"]) || segment["detail"] || segment["detail"]["steps"];
                  if (segment["indoor_wolking"]) {
                    let floorId;
                    let pointArr = [];
                    steps.forEach(function (step, index) {
                      floorId = step["floor"];
                      let polyline = step["polyline"];
                      let arr = polyline.split(";");
                      let i = 0;
                      if (index != 0) {
                        i = 1;
                      }
                      let len = arr.length;
                      for (; i < len; i++) {
                        let _tempArr = arr[i].split(",");
                        pointArr.push([parseFloat(_tempArr[0]), parseFloat(_tempArr[1])]);
                      }
                    });
                    segment["pointArr"] = pointArr;
                    segment["floorId"] = floorId;
                  } else {
                    steps.forEach(function (step, index) {
                      let pointArr = [];
                      let floorId = step["floor"];
                      let polyline = step["polyline"];
                      let arr = polyline.split(";");
                      let i = 0;
                      if (index != 0) {
                        i = 1;
                      }
                      let len = arr.length;
                      for (; i < len; i++) {
                        let _tempArr = arr[i].split(",");
                        pointArr.push([parseFloat(_tempArr[0]), parseFloat(_tempArr[1])]);
                      }
                      segment["pointArr"] = pointArr;
                      segment["floorId"] = floorId;
                    });
                  }
                });
                segments.forEach(function (segment, segIndex) {
                  let pointArr = segment["pointArr"];
                  let floorId = segment["floorId"];
                  // let resamplerRoute = DaxiMap.DXRouteCircelSampler.resampler(pointArr);
                  // if (resamplerRoute.length > 0) {
                  //     resamplerRoute = resamplerRoute[0];
                  // } else {
                  //     return;
                  // }
                  let resamplerRoute = pointArr;
                  let polyline = new DXIndoorPolyline();
                  let polylineOptions = {
                    bdid: bdid,
                    floorId: floorId,
                    lineData: resamplerRoute,
                    lineColor: "#009EFF",
                    lineWidth: 14,
                    imageUrl: assetsPath + "images/line_blue.png",
                    outLine: {
                      lineColor: "#037fca",
                      lineWidth: 10,
                    },
                  };
                  polyline["initialize"](mapSDK, polylineOptions, floorId);
                  polyline.id = DXMapUtils.createUUID();
                  thisObject._renderObjects.push(polyline);

                  let _spoint = {
                    lon: pointArr[0][0],
                    lat: pointArr[0][1],
                  };
                  createMarker("start", bdid, floorId, _spoint, index, routeCount, segIndex, segCount, naviInfoList);
                  let lastPoint = pointArr[pointArr.length - 1];
                  let _epoint = {
                    lon: lastPoint[0],
                    lat: lastPoint[1],
                  };
                  createMarker("end", bdid, floorId, _epoint, index, routeCount, segIndex, segCount, naviInfoList);
                  for (let i = 0; i < segments.length - 1; i++) {
                    let curSeg = segments[i];
                    let nexSeg = segments[i + 1];
                    // if(!nexSeg["floorId"]){
                    //     nexSeg["floorId"] = naviInfoList[i + 1]["floor"];
                    // }
                    if (segIndex < segments.length - 1) {
                      let curSeg = segment;
                      let nexSeg = segments[segIndex + 1];
                      let start = thisObject.parseVector3(curSeg["indoor_wolking"]["destination"]);
                      let end = thisObject.parseVector3(nexSeg["indoor_wolking"]["origin"]);
                      let polylineOptions = {
                        lineData: [start, end],
                        lineColor: "#009EFF",
                        lineWidth: 32,
                        imageUrl: assetsPath + "images/line_blue.png",
                        startFloor: curSeg["floorId"],
                        endFloor: nexSeg["floorId"],
                        outLine: {
                          lineColor: "#037fca",
                          lineWidth: 10,
                        },
                      };
                      let polyline = new DXIndoorLinkPolyline();
                      polyline["initialize"](mapSDK, polylineOptions);
                      polyline.id = DXMapUtils.createUUID();
                      thisObject._renderObjects.push(polyline);
                    }
                  }
                });
              });
            }
          });
        } else if (thisObject._options["lineData"]) {
          let lineData = thisObject._options["lineData"];
          let lineColor = thisObject._options["lineColor"] || "#02c387";
          let lineWidth = thisObject._options["lineWidth"] || 8;
          let wrapperWidth = thisObject._options["wrapperWidth"] || 12;
          let wrapperColor = thisObject._options["wrapperColor"] || "#036144";
          let polylineOptions = {
            lineData: lineData,
            lineColor: lineColor,
            lineWidth: lineWidth,
            outLine: {
              lineColor: wrapperColor,
              lineWidth: wrapperWidth,
            },
            id: DXMapUtils.createUUID(),
          };
          let polyline = new DXScenePolyline();
          polyline["initialize"](mapSDK, polylineOptions);

          thisObject._renderObjects.push(polyline);
        }
        for (let objIndex in thisObject._renderObjects) {
          let renderObject = thisObject._renderObjects[objIndex];
          if (renderObject) {
            renderObject["addToMap"]();
          }
        }
      },
      removeFromMap: function () {
        let thisObject = this;
        for (let objIndex in thisObject._renderObjects) {
          let renderObject = thisObject._renderObjects[objIndex];
          if (renderObject) {
            renderObject["removeFromMap"]();
          }
        }
        thisObject._renderObjects.length = 0;
        thisObject._renderObjects = [];
        DXClearLineArrowVisitor(thisObject._mapSDK._coreMap._scene).visit();
      },
      setZIndexOffset: function (icon) {},
    });

    daximap.defineProperties(DXIndoorRouteOverlay.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXIndoorRouteOverlay.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          if (this._visible === val) return;
          this._visible = val;
          for (let ro in this._renderObjects) {
            this._renderObjects[ro]["visible"] = val;
          }
        },
      },
    });
    return DXIndoorRouteOverlay;
  })(DXSceneObject);
  daximap["DXIndoorRouteOverlay"] = DXIndoorRouteOverlay;

  //////////////////////////////////////////////////////////////
  // DXIndoorPolyline
  //////////////////////////////////////////////////////////////

  let DXIndoorPolyline = (function (DXSceneObject) {
    "use strict";
    let DXIndoorPolyline = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXIndoorPolyline";
        thisObject._source = null;
        thisObject._options = null;
        thisObject._position = [0, 0];
        thisObject._grayT = 0;
        thisObject._renderObjects = [];
      },
      initialize: function (mapSDK, options, floorId) {
        this._mapSDK = mapSDK;
        this._floorId = floorId;
        this._options = options;
        this._bdid = options["bdid"] || "";
        this._map = this._mapSDK._coreMap._mapboxMap;
      },

      arrayToVector3sString: function (lineData, height) {
        let lineDataCount = lineData.length;
        let pointString = "";
        for (let i = 0; i < lineDataCount - 1; i++) {
          pointString += "" + lineData[i][0] + "," + lineData[i][1] + "," + height + ";";
        }
        pointString += "" + lineData[lineDataCount - 1][0] + "," + lineData[lineDataCount - 1][1] + "," + height;
        return pointString;
      },
      computeTimeOfPoint: function (lineData) {
        if (lineData.length == 0) {
          return;
        }
        let totalLen = 0;
        for (let i = 0, len = lineData.length; i < len - 1; i++) {
          let p1 = lineData[i],
            p2 = lineData[i + 1];
          let segLen = navi_utils.getGeodeticCircleDistance(
            {
              x: p1[0],
              y: p1[1],
            },
            {
              x: p2[0],
              y: p2[1],
            },
          );
          totalLen += segLen;
          p2.segLen = segLen;
          p2.totalLen = totalLen;
        }
        lineData[0].len = 0;
        lineData[0].t = 0;
        for (let i = 0, len = lineData.length; i < len - 1; i++) {
          let p1 = lineData[i],
            p2 = lineData[i + 1];
          p2.t = p2.totalLen / totalLen;
        }
      },
      addToMap: function () {
        if (!this._options) return;
        let thisObject = this;
        let api = this._mapSDK._coreMap._indoorMapApi;
        let options = this._options;
        thisObject.computeTimeOfPoint(options["lineData"], options["lineData"]);

        let width = daximap.defaultValue(options["lineWidth"], 1.0);
        let wrapScale = daximap.defaultValue(options["wrapScale"], 2);
        let imageUrl = daximap.defaultValue(options["imageUrl"], "");
        let repeat = daximap.defaultValue(options["repeat"], 2);
        let pointString = this.arrayToVector3sString(options["lineData"], 0.5);

        let textureLine = api["createPlaceLine"]();
        let lineInfo = textureLine["getLineInfo"]();
        lineInfo["setName"](this._id);
        lineInfo["setGuid"](this._id);
        lineInfo["setPositions"](pointString);
        let textureStyle = textureLine["getStyle"]();
        textureStyle["setName"]();
        textureStyle["setWidth"](width);
        textureStyle["setTextureWrapScale"](wrapScale);
        textureStyle["setFillType"](api["FillType"]["texture"]);
        textureStyle["setTextureUrl"](imageUrl);
        textureStyle["setRepeat"](repeat);
        api["addToMap"](textureLine);
        thisObject._renderObjects.push(textureLine);

        let scene = this._mapSDK._coreMap._scene;
        let floorId = this._floorId;
        let sceneFloorObject = scene.getChildById(this._bdid + floorId);
        if (sceneFloorObject) {
          this._floorObject = sceneFloorObject;
          this.checkFloor(this._mapSDK.config.explodedView);
          scene.addChild(sceneFloorObject, this);
        } else {
          scene.addChild(scene.rootNode, this);
        }
      },
      setGrayPoints: function (grayT) {
        //,grayPoins
        let _grayPoint = [];
        if (grayT > 0) {
          let lineData = this._options["lineData"];
          // if(this._grayT!=grayT){
          for (let i = 0, len = lineData.length; i < len; i++) {
            let p = lineData[i];
            if (grayT > p.t) {
              _grayPoint.push(p);
            } else {
              let lastP = lineData[i - 1];
              let restT = grayT - lastP.t;
              let segmentT = p.t - lastP.t;
              if (segmentT > 0) {
                let currP = [lastP[0] + (p[0] - lastP[0]) * (restT / segmentT), lastP[1] + (p[1] - lastP[1]) * (restT / segmentT)];
                _grayPoint.push(currP);
              }
              break;
            }
          }
        }
        this._grayT = grayT;
        this.updateGrayPoints(DXMapUtils.copyData(_grayPoint));
      },

      removeFromMap: function () {
        let coreMap = this._mapSDK._coreMap;
        coreMap._indoorMapApi["removePolyline"](this._id);
        let scene = coreMap._scene;
        scene.removeChild(this);
      },
      setZIndexOffset: function (icon) {},

      checkFloor: function (explodedView) {
        let visible = this._visible;
        if (this._floorObject) {
          visible = visible && this._floorObject.visible;
        }

        if (explodedView) {
          visible = true;
        }

        for (let i in this._renderObjects) {
          this._renderObjects[i]["setVisible"](visible);
          this._renderObjects[i]["setHeightOffset"](this._floorObject._heightOffset);
        }
        this._mapSDK._coreMap._indoorMapApi["engineApi"]["forceRedraw"]();
      },
    });

    daximap.defineProperties(DXIndoorPolyline.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneObject.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          if (val != this._visible) {
            this._visible = val;
            // this.checkFloor();
            this.checkFloor(this._mapSDK.config.explodedView);
          }
        },
      },
    });
    return DXIndoorPolyline;
  })(DXSceneObject);
  daximap["DXIndoorPolyline"] = DXIndoorPolyline;

  let DXIndoorLinkPolyline = (function (DXSceneObject) {
    "use strict";
    let DXIndoorLinkPolyline = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXIndoorLinkPolyline";
        thisObject._source = null;
        thisObject._options = null;
        thisObject._position = [0, 0];
        thisObject._grayT = 0;
        thisObject._renderObjects = [];
      },
      initialize: function (mapSDK, options) {
        this._mapSDK = mapSDK;
        this._map = this._mapSDK._coreMap._mapboxMap;
        let scene = this._mapSDK._coreMap._scene;
        this._startFloorObject = scene.getChildById(options["bdid"] + options["startFloor"]);
        this._endFloorObject = scene.getChildById(options["bdid"] + options["endFloor"]);
        this._options = options;
      },
      arrayToVector3sString: function (lineData) {
        let pointString = "";
        let startHeight = this._startFloorObject._heightOffset;
        let endHeight = this._endFloorObject._heightOffset;
        pointString += "" + lineData[0][0] + "," + lineData[0][1] + "," + "0.5;";
        pointString += "" + lineData[1][0] + "," + lineData[1][1] + "," + (endHeight - startHeight + 0.5);
        return pointString;
      },
      addToMap: function () {
        if (!this._options) return;
        let thisObject = this;
        let options = this._options;
        let api = this._mapSDK._coreMap._indoorMapApi;
        let scene = this._mapSDK._coreMap._scene;

        let width = daximap.defaultValue(options["lineWidth"], 1.0);
        let wrapScale = daximap.defaultValue(options["wrapScale"], 10);
        let imageUrl = daximap.defaultValue(options["imageUrl"], "");
        let repeat = daximap.defaultValue(options["repeat"], 10);
        let pointString = this.arrayToVector3sString(options["lineData"]);

        let textureLine = api["createPlaceLine"]();
        let lineInfo = textureLine["getLineInfo"]();
        lineInfo["setName"](this._id);
        lineInfo["setGuid"](this._id);
        lineInfo["setPositions"](pointString);

        let textureStyle = textureLine["getStyle"]();
        textureStyle["setName"]();
        textureStyle["setWidth"](width);
        textureStyle["setTextureWrapScale"](wrapScale);
        textureStyle["setFillType"](api["FillType"]["texture"]);
        textureStyle["setTextureUrl"](imageUrl);
        textureStyle["setRepeat"](repeat);

        api["addToMap"](textureLine);
        thisObject._renderObjects.push(textureLine);

        if (this._startFloorObject) {
          this._floorObject = this._startFloorObject;
          this.checkFloor(this._mapSDK.config.explodedView);
          scene.addChild(this._startFloorObject, this);
        } else {
          scene.addChild(scene.rootNode, this);
        }

        // this.checkFloor(this._mapSDK.config.explodedView);
      },
      removeFromMap: function () {
        let thisObject = this;
        let coreMap = this._mapSDK._coreMap;
        coreMap._indoorMapApi["removePolyline"](thisObject._id);
        let scene = coreMap._scene;
        scene.removeChild(this);
      },
      setZIndexOffset: function (icon) {},

      checkFloor: function (explodedView) {
        let visible = false;
        if (explodedView) {
          visible = true;
          for (let i in this._renderObjects) {
            this._renderObjects[i]["setHeightOffset"](this._startFloorObject._heightOffset);
          }
          // this._renderObjects[i].setHeightOffset(this._startFloorObject._heightOffset);
        }

        for (let i in this._renderObjects) {
          this._renderObjects[i]["setVisible"](visible);
        }
      },
    });

    daximap.defineProperties(DXIndoorLinkPolyline.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneObject.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          if (val != this._visible) {
            this._visible = val;
            this.checkFloor(this._mapSDK.config.explodedView);
          }
        },
      },
    });
    return DXIndoorLinkPolyline;
  })(DXSceneObject);
  daximap["DXIndoorLinkPolyline"] = DXIndoorLinkPolyline;

  let DXIndoorMarker = (function (DXSceneObject) {
    "use strict";
    let DXIndoorMarker = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXIndoorMarker";
        thisObject._source = null;
        thisObject._options = null;
        thisObject._position = [0, 0];
        thisObject._grayT = 0;
        thisObject._renderObjects = [];
      },
      initialize: function (mapSDK, options) {
        this._mapSDK = mapSDK;
        this._floorId = options["floorId"] || "";
        this._bdid = options["bdid"] || "";
        this._options = options;
        this._map = this._mapSDK._coreMap._mapboxMap;
      },

      // arrayToVector3sString: function (lineData, height) {
      //     let lineDataCount = lineData.length;
      //     let pointString = "";
      //     for (let i = 0; i < (lineDataCount - 1); i++) {
      //         pointString += "" + lineData[i][0] + "," + lineData[i][1] + "," + height + ";";
      //     }
      //     pointString += "" + lineData[lineDataCount - 1][0] + "," + lineData[lineDataCount - 1][1] + "," + height;
      //     return pointString;
      // },
      addToMap: function () {
        if (!this._options) return;
        let thisObject = this;
        let api = this._mapSDK._coreMap._indoorMapApi;
        let options = this._options;

        let scale = daximap.defaultValue(options["scale"], 1);
        let imageUrl = daximap.defaultValue(options["imageUrl"], "");
        let range1 = options["range1"];
        let highlightUrl = daximap.defaultValue(options["highlightUrl"], imageUrl);
        let range2 = options["range2"] || range1;
        // let pointString = this.arrayToVector3sString(options["lineData"], 0.5);
        let pos = daximap.defaultValue(options["pos"], [0, 0, 0]);

        let mark = api["createPlacemark"]();
        let markStyle = mark["getStyle"]();
        markStyle["setScale"](scale);

        // normalIcon
        let imageName = "";
        let iconStyle = markStyle["getIconStyle"]();
        let icon1 = api["createIcon"]();
        if (range1) {
          imageName = imageUrl + "_" + range1[0] + "_" + range1[1] + "_" + range1[2] + "_" + range1[3] + "_" + range1[4] + "_" + range1[5];
          icon1["setRange"](range1[0], range1[1], range1[2], range1[3], range1[4], range1[5]);
        }
        icon1["setHref"](imageUrl);
        iconStyle["setNormalStyle"](icon1);

        // hightlightIcon
        let icon2 = api["createIcon"]();
        if (range2) {
          icon2["setRange"](range2[0], range2[1], range2[2], range2[3], range2[4], range2[5]);
        }
        icon2["setHref"](highlightUrl);
        iconStyle["setHighlightStyle"](icon2);
        markStyle["setName"](imageName);

        let markInfo = mark["getMarkInfo"]();
        markInfo["setName"](this._id);
        markInfo["setGuid"](this._id);
        let p1 = api["createPoint3D"](pos[0], pos[1], pos[2]);
        markInfo["setPosition"](p1);

        api["addToMap"](mark);
        thisObject._renderObjects.push(mark);

        let scene = this._mapSDK._coreMap._scene;
        let floorId = this._floorId;
        let sceneFloorObject = scene.getChildById(this._bdid + floorId);
        if (sceneFloorObject) {
          this._floorObject = sceneFloorObject;
          this.checkFloor(this._mapSDK.config.explodedView);
          scene.addChild(sceneFloorObject, this);
        } else {
          scene.addChild(scene.rootNode, this);
        }
      },
      setGrayPoints: function (grayT) {
        //,grayPoins
        let _grayPoint = [];
        if (grayT > 0) {
          let lineData = this._options["lineData"];
          // if(this._grayT!=grayT){
          for (let i = 0, len = lineData.length; i < len; i++) {
            let p = lineData[i];
            if (grayT > p.t) {
              _grayPoint.push(p);
            } else {
              let lastP = lineData[i - 1];
              let restT = grayT - lastP.t;
              let segmentT = p.t - lastP.t;
              if (segmentT > 0) {
                let currP = [lastP[0] + (p[0] - lastP[0]) * (restT / segmentT), lastP[1] + (p[1] - lastP[1]) * (restT / segmentT)];
                _grayPoint.push(currP);
              }
              break;
            }
          }
        }
        this._grayT = grayT;
        this.updateGrayPoints(DXMapUtils.copyData(_grayPoint));
      },
      removeFromMap: function () {
        let thisObject = this;

        let coreMap = thisObject._mapSDK._coreMap;
        coreMap._indoorMapApi["removeMarker"](this._id);

        let scene = coreMap._scene;
        scene.removeChild(thisObject);
      },
      setZIndexOffset: function (icon) {},

      checkFloor: function (explodedView) {
        let visible = this._visible;
        if (this._floorObject) {
          visible = visible && this._floorObject.visible;
        }

        if (explodedView) {
          visible = true;
        }
        for (let i in this._renderObjects) {
          this._renderObjects[i]["setVisible"](visible);
          this._renderObjects[i]["setHeightOffset"](this._floorObject._heightOffset);
          // api["setObjectAttribute"](this._renderObjects[i], "visible", visible);
          // api["setObjectAttribute"](this._renderObjects[i], "heightOffset", this._floorObject._heightOffset);
        }
      },
    });

    daximap.defineProperties(DXIndoorMarker.prototype, {
      /**
       * 对象的可见性
       * @type Boolean
       * @memberof DXSceneObject.prototype
       */
      visible: {
        get: function () {
          return this._visible;
        },
        set: function (val) {
          if (val != this._visible) {
            this._visible = val;
            this.checkFloor(this._mapSDK.config.explodedView);
          }
        },
      },
    });
    return DXIndoorMarker;
  })(DXSceneObject);
  daximap["DXIndoorMarker"] = DXIndoorMarker;

  //////////////////////////////////////////////////////////////
  // DXSceneFloorObject
  //////////////////////////////////////////////////////////////

  let DXSceneManager = function () {
    DXUserScene.call(this);
  };
  DXSceneManager.prototype = Object.create(DXUserScene.prototype);
  DXSceneManager.prototype.constructor = DXSceneManager;
  // DXSceneManager_proto = DXSceneManager.prototype;

  //////////////////////////////////////////////////////////////
  // DXSceneFactory
  //////////////////////////////////////////////////////////////
  let DXSceneFactory = function (userScene) {
    this.userScene = userScene;
    let proto = DXSceneFactory.prototype;

    function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    proto.createUUID = function () {
      return S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4();
    };

    proto.createModelLayer = function (uuid, name) {
      let layer = new DXModelLayer();
      layer.id = uuid;
      layer.name = name;
      return layer;
    };
    proto.createVectorLayer = function (uuid, name) {
      let layer = new DXVectorLayer();
      layer.id = uuid;
      layer.name = name;
      return layer;
    };
    proto.createArrow = function (uuid, name, mapSDK, pointString, bdid, floorId, imageUrl, width, wrapScale, repeat) {
      let layer = new DXSceneArrow();
      layer.id = uuid;
      layer.name = "arrow_" + floorId;
      let options = {
        bdid: bdid,
        floorId: floorId,
        lineData: pointString,
        imageUrl: imageUrl,
        width: width,
        wrapScale: wrapScale,
      };
      layer["initialize"](mapSDK, options, floorId);
      layer["addToMap"]();
      return layer;
    };

    proto.parseFloorInfo = function (mapSDK) {
      let userScene = this.userScene;
      let floorInfos = userScene.api._getFloorInfos();
      let initFloorId = userScene.api.config.initFloorId;
      userScene.beginUpdate();
      for (let i = 0; i < floorInfos.length; i++) {
        let floorInfo = floorInfos[i];
        let floorName = floorInfo["floorName"];
        let floorId = floorInfo["floorId"];
        let floorObject = new DXSceneFloorObject(mapSDK);
        floorObject.bdid = bdid;
        floorObject.floorId = floorId;
        floorObject.id = bdid + floorId;
        floorObject.setName(floorName);
        floorObject.setVisible(floorId === initFloorId);
        this.userScene.addChild(userScene.rootNode, floorObject);
      }
      this.userScene.endUpdate();
    };
  };

  let SmoothPositionSampler2 = function (callback) {
    let thisObject = this;
    this.target = {
      pos: [0, 0, 0],
      heading: 0,
    };
    this.curState = {
      pos: [0, 0, 0],
      heading: 0,
    };

    this.options = null;

    this.curT = 0.0;
    this.curT1 = 0.0;
    this.isDirty = false;

    let prototype = SmoothPositionSampler2.prototype;
    prototype.init = function () {};

    prototype.setDirty = function (dirty) {
      thisObject.isDirty = dirty;
    };

    prototype.onRuning = function () {
      if (thisObject.isDirty === false) return;
      // let thisObject = this;
      thisObject.curT += 0.1;
      if (thisObject.curT >= 1) {
        thisObject.curT = 1.0;
        thisObject.isDirty = false;
      }

      let curState = thisObject.curState;
      let toPos = thisObject.targetState.pos;
      let fromPos = curState.pos;
      let dir = [0, 0, 0];
      let temp = [0, 0, 0];
      let outPos = [0, 0, 0];
      navi_utils.Vector3_lerp(curState.pos, fromPos, toPos, thisObject.curT);

      thisObject.curT1 += 0.2;
      if (thisObject.curT1 > 1) {
        thisObject.curT1 = 1.0;
      }
      let dif = thisObject.targetState.heading - curState.heading;
      // let caaa = thisObject.curT1;
      if (dif < -180) dif = 360 + dif;
      if (dif > 180) dif = dif - 360;
      curState.heading += thisObject.curT1 * dif;
      normalizeHeading(curState);

      callback && callback(thisObject.curState, thisObject.options, "immediately");
    };

    function normalizeHeading(state) {
      if (state.heading < -180) state.heading = 360 + state.heading;
      if (state.heading > 180) state.heading = state.heading - 360;
    }

    prototype.onTargetChanged = function (curState, targetState, options) {
      //target_pose, target_heading, floorId, bdid, target_headingRoute) {
      this.curState = curState;
      this.targetState = targetState;
      normalizeHeading(this.targetState);
      this.options = options;
      this.curT = 0;
      this.curT1 = 0;
      this.isDirty = true;
    };
  };

  let SmoothAnimationController = function () {
    this.isPause = true;
    this.stepLen = 0.83;
    this._counter = 0;
    this._animating = false;
    this.units = "kilometers";
    this.offsetRotate = 0;
    this.rotateWithMove = false;
    this.duration = 500;
    this.speed = 6;
    // this.animationController = new window["DaxiMap"]["AnimationController"]();
    let prototype = SmoothAnimationController.prototype;
    prototype["init"] = function (params) {
      this._counter = 0;
      if (params["target"]) {
        this.target = params["target"];
      }
      if (params["speed"]) {
        this.speed = params["speed"];
      }
      if (params["units"]) {
        this.units = params["units"];
      }
      if (params["duration"]) {
        this.duration = params["duration"];
        this.steps = params["duration"] / 16.6;
      }
      //TranceData
      if (params["tranceData"]) {
        this.tranceData = params["tranceData"];
      }
      if (params["targetPos"]) {
        this.targetPos = params["targetPos"];
      }
      if (params["offsetRotate"]) {
        this.offsetRotate = params["offsetRotate"];
      }
      if (params["rotateWithMove"]) {
        this.rotateWithMove = params["rotateWithMove"];
      }
      if (params["onAnimationFinisedCallback"]) {
        this._onAnimationFinisedCallback = params["onAnimationFinisedCallback"];
      }
    };
    prototype["setTargetOffsetRotate"] = function (rotate) {
      this.offsetRotate = rotate;
    };
    prototype["setTarget"] = function (target) {
      this.target = target;
      return this;
    };
    prototype["setSpeed"] = function (speed, units) {
      //每小时多少公里/ can be degrees, radians, miles, or kilometers ，默认kilometers
      this.speed = speed;
      this.units = units;

      this.stepLen = speed / 60 / 60 / 60; //speed * 1000 每request animation step
    };
    ((prototype["setSteps"] = function (steps) {
      this.steps = steps;
    }),
      (prototype["setDuration"] = function (duration) {
        //Milliseconds
        this.steps = duration / 16.6;
      }),
      (prototype["setTranceData"] = function (trancePos) {
        this.tranceData = trancePos;
        return this;
      }));
    prototype["setTargetPos"] = function (targetPos) {
      this.targetPos = targetPos;
      return this;
    };
    prototype["start"] = function () {
      if (this.tranceData) {
        this.generateTrance(this.tranceData);
        this.steps = this.tranceGeoPos.length; //动画点位
      } else if (this.targetPos) {
        if (!this.steps) {
          this.duration ? (this.steps = this.duration / 16.6) : (this.steps = 2); //steps 无值且duration为0，就没有动画
        }
        //线性插值
        if (this.steps) {
          let lngLat = this.target["getLngLat"]();
          this.tranceGeoPos = [];
          let targetLon = this.targetPos[0];
          let targetLat = this.targetPos[1];
          let startLon = lngLat["lng"],
            startLat = lngLat["lat"];
          let diffLon = targetLon - startLon,
            diffLat = targetLat - startLat;
          //起终点基本相同
          if (Math.abs(diffLon) <= 0.0000001 && Math.abs(diffLat) <= 0.0000001) {
            console.log("起点就在终点附近");
            this.steps = 2;
          }
          let perMoveLon = diffLon / this.steps,
            perMoveLat = diffLat / this.steps;
          for (let i = 0; i < this.steps; i++) {
            let pos = [startLon + perMoveLon * (i + 1), startLat + perMoveLat * (i + 1)];
            this.tranceGeoPos.push(pos);
          }
        }
      } else {
        console.log("请校验参数终点是否设置");
        return false;
      }
      if (this.steps == 0) {
        console.log("非法数据！！！");
      }
      this._animating = true;
      this._animate();
      return this;
    };
    prototype._animate = function () {
      if (!this._animating) {
        return;
      }
      if (this._counter >= this.steps) {
        this._onAnimationFinisedCallback && this._onAnimationFinisedCallback();
        return;
      }
      let startPnt, endPnt;
      if (this._counter == 0) {
        // 开始
        startPnt = this.tranceGeoPos[this._counter];
        endPnt = this.tranceGeoPos[this._counter + 1];
      } else if (this._counter !== 0) {
        startPnt = this.tranceGeoPos[this._counter - 1];
        endPnt = this.tranceGeoPos[this._counter];
      }
      let heading = navi_utils.calcHeading({ x: startPnt[0], y: startPnt[1] }, { x: endPnt[0], y: endPnt[1] });
      // 计算角度，用于小车的指向角度
      // this._animatePointGeoJson.features[0].properties.bearing = turf.bearing(
      //   turf.point(startPnt),
      //   turf.point(endPnt)
      // ) - 90;
      if (this.rotateWithMove) {
        this.target["setPosition"](endPnt[0], endPnt[1], heading - this.offsetRotate);
      } else {
        this.target["setPosition"](endPnt[0], endPnt[1]);
      }

      if (this._animating) {
        let thisObject = this;
        this._timer = requestAnimationFrame(function () {
          thisObject._animate();
        });
      }

      this._counter++;
    };
    prototype.generateTrance = function () {
      let units = this.units;
      this.tranceGeoPos = [];
      let posArr = this.tranceData;
      for (let i = 1, len = posArr; i < len - 1; ) {
        if (navi_utils.pointToLineInVector(posArr[i], posArr[i - 1], posArr[i + 1])) {
          posArr.splice(i, 1);
          len--;
        } else {
          i++;
        }
      }
      let nDistance = (this.speed * 1) / 216000; //每一帧间隔的距离/
      for (let i = 0; i < posArr.length - 1; i++) {
        let from = turf["point"](posArr[i]); // type 为 point的feature
        let to = turf["point"](posArr[i + 1]);
        let lDistance = turf["distance"](
          from,
          to,
          units, // 两个点之间的距离
        );
        if (i == 0) {
          // 起始点直接推入
          this.tranceGeoPos.push(posArr[0]);
        }
        if (lDistance > nDistance) {
          // 两点距离大于每段值，将这条线继续分隔
          let rings = this._splitLine(from, to, lDistance, nDistance, units);
          this.tranceGeoPos = this.tranceGeoPos.concat(rings);
        } else {
          // 两点距离小于每次移动的距离，直接推入
          this.tranceGeoPos.push(posArr[i + 1]);
        }
      }
      return this.tranceGeoPos;
    };
    prototype._splitLine = function (from, to, distance, splitLength, units) {
      let step = parseInt(distance / splitLength);
      let leftLength = distance - step * splitLength;
      let rings = [];
      let route = turf["lineString"]([from, to]);
      for (let i = 1; i <= step; i++) {
        let nlength = i * splitLength;
        let pnt = turf["along"](route, nlength, {
          units: units,
        });
        rings.push(pnt["geometry"]["coordinates"]);
      }
      if (leftLength > 0) {
        rings.push(to["geometry"]["coordinates"]);
      }
      return rings;
    };

    prototype["end"] = function () {
      this._animating = false;
      this._counter = 0;
      return this;
    };
    prototype["pause"] = function () {
      this._animating = false;
      return this;
    };
    prototype["resume"] = function () {
      this._animating = true;
      this._animate();
      return this;
    };
  };
  daximap["SmoothAnimationController"] = SmoothAnimationController;
  ////////////////////////////////////////////////////////
  ///// DXMapMarker 自定义marker
  ////////////////////////////////////////////////////////
  let DXMapMarker = (function (DXSceneObject) {
    let DXMapMarker = DXSceneObject.extend({
      __init__: function () {
        this["_super"]();
        let thisObject = this;
        thisObject._rtti = "DXMapMarker";
        thisObject._parentObj = null;
        thisObject._id = "";
      },
      initialize: function (mapSDK, data, options) {
        this.mapSDK = mapSDK;
        options = options || {};
        this._options = options;
        this.data = data;
        let guid = DXMapUtils.createUUID();
        this._id = data["id"] || guid;
        this._map = mapSDK._coreMap._mapboxMap;
        this._bdid = data["bdid"] || options["bdid"] || "";
        this.onClickCallback = function () {
          let onClick = data["onClick"] || options["onClick"];
          onClick && onClick(data);
        };
        this.onTapCallback = function () {
          let onTap = data["onTap"] || options["onTap"];
          onTap && onTap(data);
        };
      },
      addToMap: function () {
        let mapSDK = this.mapSDK;
        let data = this.data;
        let options = this._options;
        let lon = data["lon"] || 0,
          lat = data["lat"] || 0,
          rotate = data["rotate"] || 0;
        if (lon == undefined || lat == undefined) {
          return;
        }
        let imgUrl = data["imgUrl"] || data["imageUrl"] || "";
        let dom = data["dom"] || options["dom"];
        if (imgUrl) {
          let boxDom = document.createElement("div");
          boxDom.style.textAlign = "center";
          let image = new Image();
          let width = data["width"] || 64; //*window.devicePixelRatio;
          let height = data["height"] || 64; //*window.devicePixelRatio;
          let text = data.text || data.name || "";
          this.data["width"] = width;
          this.data["height"] = height;
          this.data["text"] = text;
          image.width = width;
          image.height = height;
          image.src = imgUrl;
          this._dom = image;
          if (this.data["text"]) {
            let textColor = data["textColor"] || "#000";
            let fontSize = data["fontSize"] || 12;
            let borderSize = data["borderSize"] || 1;
            let borderColor = data["borderColor"] || "#fff";
            let p = document.createElement("p");
            p.innerHTML = this.data["text"];
            p.style.fontSize = fontSize + "px";
            p.style.color = textColor;
            let textShadow = "";
            for (let i = 1; i <= borderSize; i++) {
              textShadow +=
                i +
                "px " +
                i +
                "px 0px " +
                borderColor +
                ", " +
                i +
                "px -" +
                i +
                "px 0px " +
                borderColor +
                ", -" +
                i +
                "px " +
                i +
                "px 0px " +
                borderColor +
                ", -" +
                i +
                "px -" +
                i +
                "px 0px " +
                borderColor;
              i < borderSize ? (textShadow += ",") : "";
            }
            p.style.textShadow = textShadow;
            boxDom.append(image);
            boxDom.append(p);
            this._dom = boxDom;
          }
        } else if (dom) {
          if (!dom.nodeName) {
            let boxDom = document.createElement("div");
            boxDom.style.textAlign = "center";
            boxDom.innerHTML = dom;
            this._dom = boxDom;
          } else {
            this._dom = dom;
          }
        }
        if (data["index"]) {
          this._dom.style.zIndex = data["index"];
        }

        this.visible = data["visible"] || this.visible;
        let markerOptions = {
          element: this._dom,
          pitchAlignment: data["pitchAlignment"] || "viewport",
          rotationAlignment: data["rotationAlignment"] || "auto", //"viewport"
        };
        if (options) {
          let keyOptions = ["anchor", "clickTolerance", "color", "draggable", "offset", "pitchAlignment", "rotation", "rotationAlignment", "scale"];
          for (let len = keyOptions.length, i = 0; i < len; i++) {
            let key = keyOptions[i];
            if (options[key] != undefined) {
              markerOptions[key] = options[key];
            }
          }
        }
        this._marker = new mapboxgl["Marker"](markerOptions)["setLngLat"]([lon, lat])["setRotation"](rotate)["addTo"](this._map);
        if (!this._dom) {
          this._dom = this._marker["_element"];
        }
        let onClick = data["onClick"] || options["onClick"];
        onClick && this._dom.addEventListener("click", this.onClickCallback, false);
        let onTap = data["onTap"] || options["onTap"];
        onTap && this._dom.addEventListener("tap", this.onTapCallback, false);
        this._dom.style.visibility = this.visible == true ? "visible" : "hidden";
        let floorId = data["floorId"];
        let bdid = data["bdid"] || "";
        if (floorId) {
          let scene = mapSDK._coreMap._scene;
          let floorObject = scene.getChildById(bdid + floorId);
          this._parentObj = floorObject;
          scene.addChild(floorObject, this);
          this.checkFloor();
        } else if (bdid) {
          let scene = mapSDK._coreMap._scene;
          let bdObject = scene.getChildById(bdid);
          this._parentObj = bdObject;
          scene.addChild(floorObject, this);
          this.checkFloor();
        }
      },
      moveTo: function (targetLon, targetLat, bdid, floorId, duration) {
        if (bdid && floorId) {
          this.mapSDK._coreMap.changeFloor(bdid, floorId);
        }
        let smoothCotl = new SmoothAnimationController();
        duration = duration || 300;
        if (targetLon && targetLat) {
          ((targetLon = parseFloat(targetLon)), (targetLat = parseFloat(targetLat)));
          // markerInfo["lon"] = lon;
          // markerInfo["lat"] = lat;
          //markerObj["_parentLayer"]["setPosition"](lon, lat, heading, markerInfo["featureId"], bdid, floorId);
          smoothCotl["init"]({ target: this, duration: duration, targetPos: [targetLon, targetLat] });
          smoothCotl["start"]();
        }
      },
      removeFromMap: function () {
        this._dom.removeEventListener("click", this.onClickCallback);
        this._dom.removeEventListener("tap", this.onTapCallback);
        this._marker["remove"]();
        this.mapSDK._coreMap._scene.removeChild(this);
      },
      setFloorObject: function (floorObject) {
        this._parentObj = floorObject;
      },
      checkFloor: function () {
        let visible = this._visible;
        if (this._parentObj !== null) {
          visible = visible && this._parentObj.visible;
        }
        let value = visible == true ? "block" : "none";
        this._dom && (this._dom.style.display = value);
      },
      setVisible: function (visible) {
        if (!this._dom) {
          console.log("not initial");
          return;
        }
        let value = visible == true ? "block" : "none";
        this._dom && (this._dom.style.display = value);
      },
      setPosition: function (lon, lat, heading) {
        if (!this._marker) {
          console.log("not initial");
          return;
        }
        if (heading != undefined) {
          this._marker["setRotation"](heading);
        }
        if (this._lng != lon || this._lat != lat) {
          this._marker["setLngLat"]([lon, lat]);
        }
      },
      getLngLat: function () {
        return this._marker["getLngLat"]();
      },
      getElement: function () {
        return this._marker["getElement"]();
      },
      setPopup: function (popup) {
        if (popup) {
          if (typeof popup == "string") {
            this._marker["setPopup"](new mapboxgl["Popup"]()["setHTML"](popup));
          } else {
            this._marker["setPopup"](popup);
          }
        }
      },
      getPopup: function () {
        return this._marker["getPopup"]();
      },
      togglePopup: function () {
        this._marker["togglePopup"]();
      },
      setOffset: function (Offset) {
        if (Offset) {
          this._marker["setOffset"](Offset);
        }
      },
      getOffset: function () {
        return this._marker["getOffset"]();
      },
      setRotation: function (rotation) {
        if (rotation != undefined) {
          this._marker["setRotation"](rotation);
        }
      },
      getRotation: function () {
        return this._marker["getRotation"]();
      },
      setDraggle: function (value) {
        this._marker["setDraggable"](value);
      },
      isDraggable: function () {
        return this._marker["isDraggable"]();
      },
      setScale: function (scale) {
        if (this._marker && this.data["width"]) {
          let width = this.data["width"] * scale,
            height = this.data["height"] * scale;
          this["setStyle"]({ width: width, height: height || width });
        }
      },
      setStyle: function (styleObj) {
        if (this._marker) {
          for (let key in styleObj) {
            this._marker["_element"].style[key] = styleObj[key];
          }
        }
      },
    });
    return DXMapMarker;
  })(DXSceneObject);
  daximap["DXMapMarker"] = DXMapMarker;
  //////////////////////////////////////////////////////////////
  // DXSingleIcon
  //////////////////////////////////////////////////////////////
  let DXSingleMarker2 = function (mapSDK) {
    this.mapSDK = mapSDK;
    this.coreMap = mapSDK._coreMap;
    this.map = mapSDK._mapboxMap();
    this.type = "DXSingleMarker2";
    this.visible = false;
    this.layerId = "";
    this.sourceId = "";
    this._image = null;
    this._marker = null;
    this._lng = 0;
    this._lat = 0;
    let thisObject = this;
    mapSDK["on"](
      "changeFloor",
      function (sender, floorId) {
        if (floorId == thisObject.floorId) {
          thisObject["setVisible"](true);
        } else {
          thisObject["setVisible"](false);
        }
      },
      this,
    );
  };

  let DXSingleMarker2_proto = DXSingleMarker2.prototype;
  DXSingleMarker2_proto["init"] = function (data, options) {
    let guid = data["id"] || DXMapUtils.createUUID();
    this.layerId = guid;
    this.sourceId = guid;
    let lon = data["lon"] || 0,
      lat = data["lat"] || 0,
      rotate = data["rotate"] || data["heading"] || 0;
    this.floorId = data["floorId"] || "";
    this.bdid = data["bdid"] || "";
    let imgUrl = data["imgUrl"] || "";
    if (imgUrl) {
      let image = new Image();
      let width = (data["width"] || 64) * 2; //*window.devicePixelRatio;
      let height = (data["height"] || 64) * 2; //*window.devicePixelRatio;
      image.width = width;
      image.height = height;
      image.src = imgUrl;
      this._dom = image;
    } else if (data["dom"]) {
      this._dom = data["dom"];
    }
    if (data["index"]) {
      this._dom.style.zIndex = data["index"];
    }
    let markerkeys = ["anchor", "clickTolerance", "draggable", "offset", "rotation", "scale"];
    this.visible = data["visible"] || this.visible;
    let markerOption = {
      element: this._dom,
      pitchAlignment: data["pitchAlignment"] || "map",
      rotationAlignment: data["rotationAlignment"] || "auto",
    };
    for (let i = 0, len = markerkeys.length; i < len; i++) {
      if (data[markerkeys[i] != undefined]) {
        markerOption[markerkeys[i]] = data[markerkeys[i]];
      }
    }
    this._marker = new mapboxgl["Marker"](markerOption)["setLngLat"]([lon, lat])["setRotation"](rotate)["addTo"](this.map);
    data["onClick"] &&
      this._dom.addEventListener(
        "click",
        function () {
          data["onClick"](data);
        },
        false,
      );
    data["tap"] &&
      this._dom.addEventListener(
        "tap",
        function () {
          data["tap"](data);
        },
        false,
      );
    data["contextmenu"] &&
      this._dom.addEventListener(
        "contextmenu",
        function () {
          data["contextmenu"](data);
        },
        false,
      );
    if (data["onDragStart"]) {
      this._marker["on"]("dragstart", data["onDragStart"]);
    }
    if (data["onDrag"]) {
      this._marker["on"]("drag", data["onDrag"]);
    }
    if (data["onDragEnd"]) {
      this._marker["on"]("dragend", data["onDragEnd"]);
    }
    this._dom.style.visibility = this.visible == true ? "visible" : "hidden";
  };
  DXSingleMarker2_proto["removeFromMap"] = function () {
    this._dom.removeEventListener("click");
    this._dom.removeEventListener("tap");
    this._marker["remove"]();
  };
  DXSingleMarker2_proto["setVisible"] = function (visible) {
    if (!this._dom) {
      console.log("not initial");
      return;
    }
    // let oldVisible = this._visible;
    let floorId = this.mapSDK["getCurrentFloorId"]();
    this._dom.style.visibility == "hidden" ? (oldVisible = false) : (oldVisible = true);
    if (oldVisible != visible) {
      this._visible = visible;
      this._dom.style.visibility = visible == true ? "visible" : "hidden";
    }
  };
  DXSingleMarker2_proto["setPosition"] = function (lon, lat, heading, floorId, bdid) {
    this.floorId = floorId || "";
    this.bdid = bdid || "";
    if (!this._marker) {
      console.log("not initial");
      return;
    }
    if (heading != undefined) {
      this._marker["setRotation"](heading);
    }
    if (this._lng != lon || this._lat != lat) {
      this._marker["setLngLat"]([lon, lat]);
    }
    if (!floorId || this.mapSDK["getCurrentFloorId"]() == floorId) {
      this["setVisible"](true);
    } else {
      this["setVisible"](false);
    }
  };
  DXSingleMarker2_proto["setOpacity"] = function (opacity) {
    if (this._dom) {
      this._dom.style.opacity = opacity;
    }
  };
  DXSingleMarker2_proto["updateStyle"] = function (params) {
    if (this._dom) {
      for (let key in params) {
        this._dom.style[key] = params[key];
      }
    }
  };
  DXSingleMarker2_proto["removeFromMap"] = function () {
    this._dom.removeEventListener("click");
    this._dom.removeEventListener("tap");
    this._marker["remove"]();
  };

  daximap["DXMarker"] = DXSingleMarker2;

  //////////////////////////////////////////////////////////////
  // DXUserLocationMarker
  //////////////////////////////////////////////////////////////
  let DXUserLocationMarker = function (mapSDK) {
    this._eventMgr = new EventHandlerManager();
    this.locationState = 0;
    this.isLocationSuccess = false;
    this.position = [0, 0, -9999];
    this.floorId = "";
    this.bdid = "";
    this.heading = 0;
    this.isDirty = true;
    this._indicator = null;
    // thisObject.backObject = null;
    this.backObjectCompass = null;
    this.compassObject = null;
    this.compassPoint = null;
    this.compassShadow = null;
    this.renderObjects = {};
    this.EventPositionChanged = null;
    this.isSimulating = false;
    this._mapSDK = mapSDK;
    this.isVisible = true;
    this._userTrackingMode = -1;
    this._showRealLoc = false;

    let proto = DXUserLocationMarker.prototype;
    (function (indicator) {
      let assetsImagesPath = indicator._mapSDK.config.absAssetsPath + "images/";
      let coreMap = indicator._mapSDK._coreMap;

      let locationFull = new DXSingleMarker2(mapSDK);
      let locationImgUrl = assetsImagesPath + "location_full.png";
      if (window["cosutomLocMarker"] && window["cosutomLocMarker"]["url"]) {
        locationImgUrl = window["cosutomLocMarker"]["url"];
      }
      let locationData = {
        id: "locationFull",
        lon: 0,
        lat: 0,
        visible: false,
        rotate: 0,
        imgUrl: locationImgUrl,
        // "rotationAlignment": "map",
        // "width": window["cosutomLocMarker"]["width"],
        // "height": window["cosutomLocMarker"]["height"],
        rotationAlignment: "map",
        index: 9,
        onClick: function () {
          return false;
        },
        contextmenu: function () {
          return false;
        },
      };
      if (window["cosutomLocMarker"]) {
        if (window["cosutomLocMarker"]["width"]) {
          locationData["width"] = window["cosutomLocMarker"]["width"];
        }
        if (window["cosutomLocMarker"]["height"]) {
          locationData["height"] = window["cosutomLocMarker"]["height"];
        }
        if (window["cosutomLocMarker"]["pitchAlignment"]) {
          locationData["pitchAlignment"] = window["cosutomLocMarker"]["pitchAlignment"];
        }
        if (window["cosutomLocMarker"]["rotationAlignment"]) {
          locationData["rotationAlignment"] = window["cosutomLocMarker"]["rotationAlignment"];
        }
        if (window["cosutomLocMarker"]["anchor"]) {
          locationData["anchor"] = window["cosutomLocMarker"]["anchor"];
        }
      }

      locationFull["init"](locationData);
      indicator.renderObjects["locationFull"] = locationFull;
      let directImgUrl = assetsImagesPath + "navigate_back.png";
      if (mapSDK.config.lang && mapSDK.config.lang != "zh") {
        directImgUrl = assetsImagesPath + "navigate_back_common.png";
      }
      let directIndictorMarker = new DXSingleMarker2(mapSDK);
      let directIndictorMarkerData = {
        id: "directIndictorMarker",
        "icon-size": 0.3,
        lon: 0,
        lat: 0,
        visible: false,
        rotate: 0,
        imgUrl: directImgUrl,
        rotationAlignment: "map",
        width: 48,
        height: 48,
        index: 8,
        draggable: false,
      };
      directIndictorMarker["init"](directIndictorMarkerData);
      indicator.renderObjects["directIndictorMarker"] = directIndictorMarker;

      // 真实位置的点位
      indicator.realLocationMarker = new DXSingleMarker2(mapSDK);
      let reallocationData = {
        id: "real_location",
        iconName: "real_location",
        lon: 0,
        lat: 0,
        visible: false,
        rotate: 0,
        width: 10,
        height: 10,
        index: 2,
        imgUrl: assetsImagesPath + "target.png",
        draggable: false,
      };
      indicator.realLocationMarker["init"](reallocationData);
      indicator.renderObjects["realLocationMarker"] = indicator.realLocationMarker;

      // 定位marker 到 真实位置到 虚线
      indicator.vritualLine = null;
      indicator.locRangeMarker = null;

      indicator.positionSampler = new SmoothPositionSampler2(function (state, options) {
        indicator._setPositionOnly(state.pos[0], state.pos[1], options.bdid, options.floorId, state.heading, options.routeHeading);
      });
      indicator.positionSampler.init(indicator);

      indicator.animationController = new window["DaxiMap"]["AnimationController"]();
      indicator.animationIntevalTime = 0.05;
      // indicator.animationIntevalTime = 0.1;
      indicator.animationController.init(indicator.animationIntevalTime);
      indicator.animationController.addListener(indicator.positionSampler.onRuning);
      indicator.animationController.start(0, true);

      this.showLevel = 2;
      // 定位点的 smooth AnimationCallback
      // indicator.animationController.addListener(thisObject.mapAPI.cameraCtrl.animationCallback);
    })(this);

    let thisObject = this;
    this._mapSDK._on("changeFloor", function (sender, floorId) {
      thisObject.onChangeFloor(floorId);
    });
    proto.finalize = function () {
      let thisObject = this;
      thisObject.EventPositionChanged = null;
    };
    proto.setLocationState = function (state) {};

    proto._animationCallback = function () {};

    proto.resetStatus = function () {};
    proto._clearNaviStatus = function () {
      let thisObject = this;
      thisObject.isNaviStatus = false;
      thisObject._showRealLoc = false;
      thisObject.locRangeMarker && thisObject.locRangeMarker["setVisible"](false);
      thisObject._hideRealPosInfo();
      thisObject.checkFloor();
    };
    proto["clearNaviStatus"] = proto._clearNaviStatus;
    //是否显示
    proto.setVisible = function (visible) {
      if (this.isVisible == visible) {
        return;
      }
      this.isVisible = visible;
      this.checkFloor();
    };
    proto["setVisible"] = proto.setVisible;
    // 是否可见
    proto._setVisible = function (bVisible, state) {
      let thisObject = this;
      let isVisible = thisObject.isVisible && bVisible;
      for (let objIndex in thisObject.renderObjects) {
        thisObject.renderObjects[objIndex]["setVisible"](isVisible);
      }
    };
    proto.immediateUpdate = function () {
      let _position = this.getPosition();
      let floorId = this.getFloorId();
      let heading = this.getHeading();
      this.setPositionSmooth(_position[0], _position[1], floorId, heading, heading, heading, undefined);
    };

    proto.setPositionDirect = function (lng, lat, floorId, heading, isNaviStatus, viewHeading) {
      this.setPositionSmooth(lng, lat, floorId, heading, viewHeading, undefined, undefined, isNaviStatus);
    };

    proto.setPositionSmooth = function (lng, lat, floorId, indicatorHeading, viewHeading, rootPt, duration, isNaviStatus, pose) {
      let thisObject = this;
      let pos = [lng, lat, 0];
      // routeHeading = (routeHeading === undefined) ? indicatorHeading : routeHeading;
      thisObject._setLocation({
        lng: lng,
        lat: lat,
        floorId: floorId,
        real_pos: rootPt,
        heading: indicatorHeading,
        viewHeading: viewHeading,
        duration: duration || 1000,
        isNaviStatus: isNaviStatus,
        timeStamp: pose && pose["timeStamp"],
        receiveTime: pose && pose["receiveTime"],
      });
    };
    proto["setPositionSmooth"] = proto.setPositionSmooth;

    proto._setLocation = function (options) {
      let thisObject = this;
      let lng = options["lng"];
      let lat = options["lat"];
      if (!lng || !lat) {
        return;
      }
      let alt = options["alt"];
      let floorId = options["floorId"] || thisObject.floorId;
      let bdid = options["bdid"] || thisObject.bdid;
      let heading = options["heading"] || thisObject.heading;
      let viewHeading = options["viewHeading"] != undefined ? options["viewHeading"] : heading;
      // let heading = options["headingRoute"]
      let duration = options["duration"] || 0;
      let real_pos = options["real_pos"] || null;
      thisObject.isNaviStatus = options["isNaviStatus"];

      thisObject._processIndicatorMovement(lng, lat, heading, viewHeading, bdid, floorId, duration);
      thisObject._processCameraMovement(lng, lat, viewHeading, bdid, floorId, duration);
      if (thisObject.showLevel == 0) {
        return;
      }
      if (thisObject.isNaviStatus && real_pos) {
        //计算真实点与定位点距离
        let distance = navi_utils.getGeodeticCircleDistance({ x: lng, y: lat }, { x: real_pos["x"], y: real_pos["y"] });
        if ((thisObject.showLevel == 1 && distance > thisObject.minDistance) || thisObject.showLevel == 2) {
          thisObject._showRealLoc = true;
          let realFloorId = real_pos["floorId"] || floorId;
          thisObject._setRealPosition(real_pos["x"], real_pos["y"], heading, realFloorId, distance); //real_pos floorId
          thisObject.real_pos = real_pos;
          let linePoints = [
            [lng, lat],
            [real_pos["x"], real_pos["y"]],
          ];
          thisObject._updateVirtualLine(floorId, linePoints, distance);
        } else if (thisObject.showLevel == 3 && distance > thisObject.minDistance) {
          thisObject._showRealLoc = true;
          thisObject._updateLocRange(floorId, lng, lat, distance);
        } else {
          thisObject._hideRealPosInfo();
        }
      } else {
        thisObject._hideRealPosInfo();
      }
    };

    proto["setLocation"] = proto._setLocation;

    function easing(t) {
      return t * (5 - t);
    }
    proto._setMapPositionOnly = function (bdid, floorId, lon, lat) {
      this._mapSDK._coreMap.jumpTo({ center: { lng: lon, lat: lat } });
      this._mapSDK._coreMap.changeFloor(bdid, floorId);
    };
    proto._processCameraMovement = function (lng, lat, viewHeading, bdid, floorId, duration) {
      let thisObject = this;
      let mapSDK = thisObject._mapSDK;
      if (thisObject._userTrackingMode === 1) {
        mapSDK._easeTo({
          lon: lng,
          lat: lat,
          heading: 0,
          bdid: bdid,
          floorId: floorId,
          duration: duration || 500,
          easing: easing,
        });
      } else if (thisObject._userTrackingMode === 2) {
        if (duration < 200) {
          mapSDK._jumpTo({
            lon: lng,
            lat: lat,
            heading: viewHeading,
            bdid: bdid,
            floorId: floorId,
          });
        } else {
          mapSDK._easeTo({
            lon: lng,
            lat: lat,
            heading: viewHeading,
            bdid: bdid,
            floorId: floorId,
            duration: duration || 300,
            easing: easing,
          });
        }
      }
    };

    proto._processIndicatorMovement = function (lng, lat, indicatorHeading, routeHeading, bdid, floorId, duration) {
      let thisObject = this;
      if (duration === 0 || duration < 200) {
        if (thisObject.usingLineHeading == true) {
          //改为和路线方向角一致
          thisObject._setPositionOnly(lng, lat, bdid, floorId, routeHeading, routeHeading, duration);
        } else {
          thisObject._setPositionOnly(lng, lat, bdid, floorId, indicatorHeading, routeHeading, duration);
        }
      } else {
        //改为和路线方向角一致
        if (thisObject.usingLineHeading == true) {
          //改为和路线方向角一致
          thisObject._setPositionOnly2(lng, lat, bdid, floorId, routeHeading, routeHeading, duration);
        } else {
          thisObject._setPositionOnly2(lng, lat, bdid, floorId, indicatorHeading, routeHeading, duration);
        }
      }
    };

    proto._setPositionOnly2 = function (lng, lat, bdid, floorId, indicatorHeading, routeHeading, duration) {
      let thisObject = this;
      if (thisObject.position[0] === 0 || thisObject.position[1] === 0) {
        thisObject._setPositionOnly(lng, lat, bdid, floorId, indicatorHeading, routeHeading);
        return;
      }
      let curState = {
        pos: [thisObject.position[0], thisObject.position[1], 0],
        heading: thisObject.heading,
      };

      let targetState = {
        pos: [lng, lat, 0],
        heading: indicatorHeading,
      };

      let options = {
        floorId: floorId,
        bdid: bdid,
        routeHeading: routeHeading,
      };

      thisObject.positionSampler.onTargetChanged(curState, targetState, options);
    };

    proto._setPositionOnly = function (lng, lat, bdid, floorId, headingIndicator, headingRoute) {
      let thisObject = this;
      if (isNaN(headingIndicator)) {
        headingIndicator = 0;
      }
      if (!lng && !lat) {
        return;
      }
      if (headingRoute === undefined) {
        headingRoute = headingIndicator;
      }
      let pos = thisObject.position;
      let isChanged = false;
      let thresholdVal = 0.000001;
      if (
        !pos ||
        Math.abs(pos[0] - lng) > thresholdVal ||
        Math.abs(pos[1] != lat) > thresholdVal ||
        floorId != thisObject.floorId ||
        headingIndicator - thisObject.heading > 5
      ) {
        isChanged = true;
        if (thisObject.real_pos) {
          // showLine
        }
      }
      thisObject.position = [lng, lat, 0];
      thisObject.floorId = floorId;
      thisObject.bdid = bdid;
      thisObject.heading = headingIndicator;
      let renderObjects = thisObject.renderObjects;

      for (let i in renderObjects) {
        if (i == "directIndictorMarker") {
          renderObjects[i]["setPosition"](lng, lat, 0);
        } else {
          renderObjects[i]["setPosition"](lng, lat, headingIndicator);
        }
      }
      thisObject.checkFloor(floorId);

      let args = {
        lastPosition: thisObject.position,
        lastFloorId: thisObject.floorId,
        lastHeading: thisObject.headingIndicator,
        position: [lng, lat, 0],
        floorId: floorId,
        bdid: bdid,
        headingRoute: headingRoute || headingIndicator,
      };
      thisObject._eventMgr.fire("PositionChanged", args);
    };
    proto["setPositionOnly"] = proto._setPositionOnly;
    proto.setRealLevel = function (showLevel, minDistance) {
      this.showLevel = showLevel;
      this.minDistance = minDistance;
      this._hideRealPosInfo();
    };
    proto["setRealLevel"] = proto.setRealLevel;

    proto._setRealPosition = function (lng, lat, heading, floorId, distance) {
      this.realLocationMarker["setPosition"](lng, lat, heading);
      let bVisible = true;
      if (floorId) {
        let scene = this._mapSDK._coreMap._scene;
        let bdid = this.bdid || "";
        let floorObject = scene.getChildById(bdid + floorId);
        bVisible = floorObject.visible;
      }
      if (distance < this.minDistance) {
        bVisible = false;
      }
      let isVisible = this.isVisible && bVisible;
      if (isVisible) {
        this.realLocationMarker["setOpacity"](distance >= 15 ? 0.8 : distance >= 10 ? 0.6 : 0.4);
      }
      this._showRealLoc = true;
      this.realLocationMarker["setVisible"](isVisible);
    };
    proto["setRealPosition"] = proto._setRealPosition;
    proto._hideRealPosInfo = function () {
      if (!this._showRealLoc) {
        return;
      }
      this._showRealLoc = false;
      this.realLocationMarker["setVisible"](false);
      let mapboxMap = this._mapSDK._coreMap._mapboxMap;
      // if(this.vritualLineId){
      //     mapboxMap["setLayoutProperty"](this.vritualLineId,"visibility","none");
      // }
      if (this.locRangeMarker) {
        this.locRangeMarker["setVisible"](false);
      }
    };
    proto["hideRealPosInfo"] = proto._hideRealPosInfo;
    proto._updateLocRange = function (floorId, lng, lat, distance) {
      if (!this.locRangeMarker) {
        this.locRangeMarker = new DXSingleMarker2(this._mapSDK._coreMap);
        let dom = document.createElement("div");
        dom.style.backgroundColor = "#4fabfb";
        dom.style.opacity = 0.2;
        dom.style.borderRadius = "50%";
        let locationRangeData = {
          id: "location_range",
          type: "circle",
          floorId: floorId,
          lon: lng,
          lat: lat,
          visible: true,
          rotate: 0,
          index: 1,
          dom: dom,
        };
        this.locRangeMarker.init(locationRangeData);
        return;
      }
      this.locRangeMarker["setPosition"](lng, lat, 0);
      distance = ~~distance * 3;
      let iconRadius = Math.min(100, Math.max(10, distance));
      this.locRangeMarker["updateStyle"]({ width: iconRadius, height: iconRadius });
      this.locRangeMarker["setVisible"](true);
    };
    proto["updateLocRange"] = proto._updateLocRange;
    proto._removeVirtualLine = function () {
      if (this.vritualLineId) {
        let id = this.vritualLineId;
        let mapboxMap = this._mapSDK._coreMap._mapboxMap;
        mapboxMap["removeLayer"](id);
        mapboxMap["removeSource"](id);
        this.vritualLineId = null;
      }
    };
    proto["removeVirtualLine"] = proto._removeVirtualLine;
    proto._updateVirtualLine = function (floorId, linePoins, distance) {
      // let mapboxMap = thisObject._mapSDK._coreMap._mapboxMap;
      // let layerId,sourceId;
      // if(thisObject.vritualLineId){
      //     sourceId = layerId = thisObject.vritualLineId;
      //     let lineSource = mapboxMap["getSource"](sourceId);
      //     let geojson = {
      //         'type': 'FeatureCollection',
      //         "features":[{
      //             'type': 'Feature',
      //             'properties': {
      //             },
      //             'geometry': {
      //                 'type': 'LineString',
      //                 'coordinates': linePoins
      //             }
      //         }]
      //     };
      //     lineSource["setData"](geojson);
      // }else{
      //     let id = DXMapUtils.createUUID();
      //     thisObject.vritualLineId = sourceId = layerId = id;
      //     let sourceData = {
      //         "type":"geojson",
      //         "data":{
      //             "type":"FeatureCollection",
      //             "features":[{
      //                 'type': 'Feature',
      //                 'properties': {
      //                 },
      //                 'geometry': {
      //                     'type': 'LineString',
      //                     'coordinates': linePoins
      //                 }
      //             }]
      //         }
      //     };
      //     mapboxMap["addSource"](sourceId, sourceData);
      //     let layerData = {
      //         "type" : "line",
      //         "id" : layerId,
      //         "source":sourceId,
      //         "layout" : {
      //             // 'symbol-placement': 'line',
      //             // 'symbol-spacing': 30, // 图标间隔，默认为250 不能小于1
      //             //'icon-image':'arrowIcon', //箭头图标
      //             // "icon-anchor":"center",
      //             // 'icon-size': 0.3,
      //             "line-join":"round"
      //         },
      //         "paint": {
      //             "line-color": "#f98020",//"#f00",
      //             "line-width": 2,
      //             "line-dasharray": [2, 2]
      //         }
      //     };
      //     thisObject._mapSDK._coreMap.addToMapBox(layerData,"highlightMarkerLayer");//"routeLayer");
      // }
      // if(floorId){
      //     let scene = thisObject._mapSDK._coreMap._scene;
      //     let floorObject = scene.getChildById(floorId);
      //     bVisible = floorObject.visible;
      //     bVisible = floorObject.visible && (distance>thisObject.minDistance);
      //     if(bVisible){
      //         mapboxMap["setPaintProperty"](layerId, 'line-opacity', distance>10?0.8:0.6);
      //     }
      //     mapboxMap["setLayoutProperty"](layerId,"visibility",(bVisible == true?"visible":"none"));
      // }
    };
    proto["updateVirtualLine"] = proto._updateVirtualLine;
    proto.checkFloor = function (flid) {
      let thisObject = this;
      let floorId = flid || thisObject.floorId;
      let scene = thisObject._mapSDK._coreMap._scene;
      let bVisible = true;
      if (floorId) {
        // 如果是室外根据楼层是否显示
        let bdid = this.bdid || "";
        let floorObject = scene.getChildById(bdid + floorId);
        if (floorObject) {
          bVisible = floorObject.visible;
        }
      }
      let isVisible = thisObject.isVisible && bVisible;
      for (let objIndex in thisObject.renderObjects) {
        if (objIndex == "directIndictorMarker") {
          if (!thisObject.isNaviStatus) {
            thisObject.renderObjects[objIndex]["setVisible"](false);
          } else {
            thisObject.renderObjects[objIndex]["setVisible"](isVisible);
          }
        } else if (objIndex != "realLocationMarker" || thisObject._showRealLoc) {
          thisObject.renderObjects[objIndex]["setVisible"](isVisible);
        }
      }
    };

    proto.setUserTrackingMode = function (mode) {
      this._userTrackingMode = mode;
    };
    proto["setUserTrackingMode"] = proto.setUserTrackingMode;

    proto.getPosition = function () {
      return this.position;
    };
    proto["getPosition"] = proto.getPosition;
    proto.setFloorId = function (floorId) {
      let thisObject = this;
      let args = {
        lastPosition: thisObject.position,
        lastFloorId: thisObject.floorId,
        position: thisObject.position,
        floorId: floorId,
      };
      thisObject.floorId = floorId;
      thisObject.checkFloor();
      thisObject._eventMgr.fire("PositionChanged", args);
    };
    proto["setFloorId"] = proto.setFloorId;

    proto.getFloorId = function () {
      return this.floorId;
    };
    proto["getFloorId"] = proto.getFloorId;
    proto["getBDID"] = function () {
      return this.bdid;
    };
    proto["getFloorId"] = proto.getFloorId;

    proto.setHeading = function (heading) {
      this.heading = heading;
    };
    proto["setHeading"] = proto.setHeading;
    proto.getHeading = function () {
      return this.heading;
    };
    proto["getHeading"] = proto.getHeading;

    proto.setScale = function (scale) {
      // let thisObject = this;
    };
    proto.addChildObject = function (ro) {
      let thisObject = this;
      // thisObject.renderObjects.push(ro);
    };
    proto.onChangeFloor = function (floorId) {
      let floorId = this.floorId;
      if (floorId.length == 0) {
        this.setVisible(true);
      } else {
        let floorObject = this._mapSDK._coreMap._scene.getChildById(this.bdid + floorId);
        if (floorObject) {
          this.checkFloor(floorId);
        }
      }
    };
  };

  let earthRadius = 6378137.0;
  /*
   * The average circumference of the world in meters.
   */
  let earthCircumfrence = 2 * Math.PI * earthRadius; // meters

  /*
   * The circumference at a line of latitude in meters.
   */
  function circumferenceAtLatitude(latitude) {
    return earthCircumfrence * Math.cos((latitude * Math.PI) / 180);
  }

  function mercatorXfromLng$1(lng) {
    return (180 + lng) / 360;
  }

  function mercatorYfromLat$1(lat) {
    return (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) / 360;
  }

  function mercatorZfromAltitude(altitude, lat) {
    return altitude / circumferenceAtLatitude(lat);
  }

  function lngFromMercatorX(x) {
    return x * 360 - 180;
  }

  function latFromMercatorY(y) {
    let y2 = 180 - y * 360;
    return (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90;
  }

  function altitudeFromMercatorZ(z, y) {
    return z * circumferenceAtLatitude(latFromMercatorY(y));
  }
  //layer style
  function n(e, t, n, r) {
    if (void 0 === e) throw new Error("geometry is required");
    if (t && t.constructor !== Object) throw new Error("properties must be an Object");
    if (n && 4 !== n.length) throw new Error("bbox must be an Array of 4 numbers");
    if (r && -1 === ["string", "number"].indexOf(typeof r)) throw new Error("id must be a number or a string");
    let i = {
      type: "Feature",
    };
    return (r && (i.id = r), n && (i.bbox = n), (i.properties = t || {}), (i.geometry = e), i);
  }
  let _default = {
    featureCollection: function (e, t, n) {
      if (!e) throw new Error("No features passed");
      if (!Array.isArray(e)) throw new Error("features must be an Array");
      if (t && 4 !== t.length) throw new Error("bbox must be an Array of 4 numbers");
      if (n && -1 === ["string", "number"].indexOf(typeof n)) throw new Error("id must be a number or a string");
      let r = {
        type: "FeatureCollection",
      };
      return (n && (r["id"] = n), t && (r["bbox"] = t), (r["features"] = e), r);
    },
    geometryCollection: function (e, t, r, i) {
      if (!e) throw new Error("geometries is required");
      if (!Array.isArray(e)) throw new Error("geometries must be an Array");
      return n(
        {
          type: "GeometryCollection",
          geometries: e,
        },
        t,
        r,
        i,
      );
    },
    point: function (e, t, r, i) {
      if (!e) throw new Error("No coordinates passed");
      if (void 0 === e.length) throw new Error("Coordinates must be an array");
      if (e.length < 2) throw new Error("Coordinates must be at least 2 numbers long");
      if (!p(e[0]) || !p(e[1])) throw new Error("Coordinates must contain numbers");
      return n(
        {
          type: "Point",
          coordinates: e,
        },
        t,
        r,
        i,
      );
    },
  };
  let defaultStyles = {
    symbol: {
      layout: {
        "text-font": ["sans-serif"], //["notosansscregular"],
        "text-size": 14,
      },
      paint: {
        // "text-color": "#00CAB1"
      },
    },
    circle: {
      layout: {},
      paint: {
        "circle-radius": {
          base: 2,
          property: "scalerank",
          stops: [
            [{ zoom: 0, value: 0 }, 1],
            [{ zoom: 0, value: 10 }, 5],
            [{ zoom: 17, value: 0 }, 20],
            [{ zoom: 17, value: 10 }, 50],
          ],
        },
        "circle-color": {
          base: 1.25,
          property: "localrank",
          stops: [
            [{ zoom: 0, value: 0 }, "#002222"],
            [{ zoom: 0, value: 10 }, "#220022"],
            [{ zoom: 17, value: 0 }, "#008888"],
            [{ zoom: 17, value: 10 }, "#880088"],
          ],
        },
      },
    },
    line: {
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "yellow",
        "line-opacity": 0.75,
        "line-width": 10,
      },
    },
    raster: {
      paint: {
        "raster-resampling": "nearest",
        "raster-fade-duration": 0,
      },
    },
    background: {
      paint: {
        "background-color": "black",
      },
    },
  };

  function getStyle(type, options) {
    let styleObj = defaultStyles[type] || {};
    if (options["layout"]) {
      if (!styleObj["layout"]) {
        styleObj["layout"] = {};
      }
      for (let key in options["layout"]) {
        styleObj["layout"][key] = options["layout"][key];
      }
    }
    if (options["paint"]) {
      if (!styleObj["paint"]) {
        styleObj["paint"] = {};
      }
      for (let key in options["paint"]) {
        styleObj["paint"][key] = options["paint"][key];
      }
    }
    return styleObj;
  }

  /**
   * Determine the Mercator scale factor for a given latitude, see
   * https://en.wikipedia.org/wiki/Mercator_projection#Scale_factor
   *
   * At the equator the scale factor will be 1, which increases at higher latitudes.
   *
   * @param {number} lat Latitude
   * @returns {number} scale factor
   * @private
   */
  function mercatorScale(lat) {
    return 1 / Math.cos((lat * Math.PI) / 180);
  }
  let currentColor = "red";
  function CustomSource(options, mapSDK) {
    this.type = "custom";
    this["cache"] = new Map();
    if (!window["imageBase64"]) {
      window["imageBase64"] = {};
    }
    if (options["url"]) {
      let that = this;
      if (!window["imageBase64"][options["url"]]) {
        mapSDK._getDownloader()["getServiceData"](options["url"], "get", "json", null, function (data) {
          // debugger
          that.jsondata = data;
          window["imageBase64"][options["url"]] = data;
          that.generate2DTile(data);
        });
      } else {
        this.generate2DTile(window["imageBase64"][options["url"]]);
      }
    }
    this.generate2DTile = function (data) {
      let arr = [];
      let that = this;
      for (let key in data) {
        let that = this;
        let tileSize = options["tileSize"] || 256;
        if (data[key]) {
          (function (key) {
            arr.push(
              new Promise(function (resolve, reject) {
                let img = new Image(tileSize, tileSize);
                img.onload = function () {
                  let canvas = document.createElement("canvas");
                  canvas.width = canvas.height = tileSize;
                  let context = canvas.getContext("2d", { willReadFrequently: true });
                  context.drawImage(img, 0, 0, tileSize, tileSize);
                  that["cache"].set(key, canvas);
                  // that.clearTiles();
                  // that.update();
                  resolve();
                };
                img.src = data[key];
              }),
            );
          })(key);
        }
      }
      Promise.all(arr)["then"](function () {
        that.sourceRead = true;
        that["clearTiles"]();
        that["update"]();
        // mapSDK.forceRedraw();
      });
    };
    // this["__tileSize"] = 256;
    this["loadTile"] = function (params) {
      let z = params["z"],
        x = params["x"],
        y = params["y"];
      if (!this.sourceRead) {
        return;
      }
      let key = "" + z + "-" + x + "-" + y;
      let tile = this["cache"].get(key);
      if (tile) return tile;
      // let that = this;
      // let tileSize = options["tileSize"]||256;
      // if(this.jsondata[key]){
      //   let img = new Image(tileSize,tileSize);
      //   img.onload = function(){
      //     const canvas = document.createElement('canvas');
      //     canvas.width = canvas.height = tileSize;
      //     const context = canvas.getContext('2d', {willReadFrequently: true});
      //     context.drawImage(img,0,0,tileSize,tileSize);
      //     that["cache"].set(key, canvas);
      //     that.clearTiles();
      //     that.update();
      //     // mapSDK.forceRedraw();

      //   }
      //   img.src = that.jsondata[key];
      //   //  await new Promise(function(resolve,reject){
      //   //   let img = new Image(tileSize,tileSize);
      //   //   img.onload = function(){
      //   //     resolve(img);
      //   //   }
      //   //   img.src = that.jsondata[key];
      //   //  }).then(function(img){
      //   //     const canvas = document.createElement('canvas');
      //   //     canvas.width = canvas.height = tileSize;
      //   //     const context = canvas.getContext('2d', {willReadFrequently: true});
      //   //     context.drawImage(img,0,0,tileSize,tileSize);
      //   //     that["cache"].set(key, canvas);
      //   //     that.update();
      //   //     return canvas;
      //   //  })

      // }

      // const canvas = document.createElement('canvas');
      // canvas.width = canvas.height = tileSize;
      // const context = canvas.getContext('2d', {willReadFrequently: true});

      // context.fillStyle = currentColor;
      // context.fillRect(0, 0, tileSize, tileSize);
      // context.font = '24px sans-serif';
      // context.fillStyle = 'white';

      // context.fillText(`${z}/${x}/${y}`, tileSize / 2, tileSize / 2);

      // this.cache.set(key, canvas);
      // return canvas;
    };
  }
  function IndoorRenderLayer(parent, listener) {
    this.id = "mycustomindoorlayer";
    this.type = "custom";
    this["renderingMode"] = "3d";
    this.listener = listener;
    this.parent = parent;
    this.updateIndoorTimer = null;
    this.projMat = DXMapUtils["naviMath"].makeMatrix();
  }
  let IndoorRenderLayerProp = IndoorRenderLayer.prototype;
  IndoorRenderLayerProp["onAdd"] = function (map, gl) {
    this.map = map;
    if (this.listener && this.listener.onAdd) {
      this.listener.onAdd(map, gl);
    }
  };
  IndoorRenderLayerProp["render"] = function (gl, matrix) {
    if (!this.parent._indoorMapApi) return;
    let transform = this.map["transform"];

    if (this.parent._mapSDK.config.explodedView) {
      transform["_farScale"] = 10.0;
      transform["_fov"] = (15 * Math.PI) / 180;
    } else {
      transform["_farScale"] = 1.0;
      transform["_fov"] = (15 * Math.PI) / 180;
    }

    let position = transform["_camera"]["position"];
    let lng = lngFromMercatorX(position[0]);
    let lat = latFromMercatorY(position[1]);
    let alt = altitudeFromMercatorZ(position[2], position[1]);
    let pitchBearing = this.map["transform"]["_camera"]["getPitchBearing"]();
    let bearing = (pitchBearing["bearing"] * 180) / Math.PI;
    let pitch = (pitchBearing["pitch"] * 180) / Math.PI;

    let pixelsPerMeter = mercatorZfromAltitude(1, transform["center"]["lat"]) * transform["worldSize"];
    let scale = pixelsPerMeter / transform["worldSize"];
    let zoomLevel = this.map["getZoom"]();

    let naviMath = DXMapUtils["naviMath"];
    naviMath.Matrix4_perspectiveRH(this.projMat, transform["_fov"], transform["width"] / transform["height"], transform["_nearZ"], transform["_farZ"]);
    naviMath.Matrix_inverse(this.projMat, this.projMat);

    let cameraParam = {
      cameraToWorld: transform["_camera"]["getCameraToWorld"](transform["worldSize"], pixelsPerMeter),
      matrix: matrix,
      pixelsPerMeter: pixelsPerMeter,
      worldSize: transform["worldSize"],
      scaleFactor: [scale, -scale, scale],
      cameraCenter: transform["_camera"]["position"],
      zoomLevel: zoomLevel,
      invProjectMatrix: this.projMat,
    };

    this.parent._indoorMapApi["setViewProjectMatrix"](cameraParam);
    this.parent._indoorMapApi["setCameraPosition"](lng, lat, alt, bearing, pitch);
    // this.indoormap.cameraCtrl.setCameraPosition(lng, lat, alt, bearing, pitch);
    this.parent._indoorMapApi["reRender"]();
  };
  IndoorRenderLayerProp.constructor = IndoorRenderLayer;

  function computeAbsPath(url) {
    if (!url || url.indexOf("/") == -1) {
      return url;
    }
    if (url.indexOf("://") == -1) {
      let str = window.location.href;
      if (str.indexOf(".html")) {
        str = str.slice(0, str.lastIndexOf("/") + 1);
      }
      while (url.indexOf("../") == 0) {
        url = url.slice(3);
        index = str.slice(0, -1).lastIndexOf("/");
        str = str.slice(0, index + 1);
      }
      url = str + url.replace("./", "");
    }
    return url;
  }
  let DXOutdoorMap = function (mapSDK) {
    this._mapSDK = mapSDK;
    this._mapboxMap = null;
    this._indoorMapApi = null;
    this._eventMgr = new EventHandlerManager();
    this._scene = null;

    let proto = DXOutdoorMap.prototype;
    proto.resize = function (params) {
      this._mapboxMap && this._mapboxMap["resize"](params);
    };
    proto.loadBDListData = function (finishedCB) {
      let thisObject = this;
      let mapSDK = thisObject._mapSDK;
      // let token = mapSDK.config.token;
      let config = mapSDK.config;
      let bdlist = config["bdlist"];
      let link = bdlist["link"];
      if (link.indexOf("./" == 0)) {
        //相对路径
        bdlist["link"] = mapSDK.config["baseMapDataPath"] = link.slice(2);
      }
      let bdListUrl = bdlist["link"]; //mapSDK.config.mapDataPath + mapSDK.config.token + "/appConfig/bdlist.json?version=" + window["version"];
      mapSDK._getDownloader()["getData"](bdListUrl, "GET", "json", { token: thisObject._mapSDK.config.token, bdid: thisObject.bdid }, onDataSuccess, undefined);
      // DXMapUtils.getData(bdListUrl, null, "json", function (bdListData) {
      //   mapSDK.bdlist = bdListData;
      //   finishedCB && finishedCB(mapSDK.config);
      // }, function (err) {
      //   console.log(err);
      // });
    };
    proto.setIndoorBuildingVisible = function (visible, bdid, singleVisible) {
      this._scene.setChildVisible(visible, bdid, singleVisible);
    };
    proto.createIndoorBuildings = function (bdListData, callback) {
      let mapSDK = this._mapSDK;
      let thisObject = this;
      let fileList = bdListData["list"];
      fileList.forEach(function (bdInfo) {
        // 创建室内地图
        let bdid = bdInfo["bdid"];
        let mapStyle = bdInfo["mapStyle"] || thisObject.mapStyle || "default"; //||mapSDK.config.mapStyle;
        // let startPosition = mapSDK.config["mapData"]["startPosition"];
        let config = mapSDK.config;

        let mapUrl = config.baseMapDataPath.replace("{{bdid}}", bdid);
        //+ "styles/";
        if (mapUrl.indexOf("/getFile") != -1) {
          mapUrl += encodeURIComponent("/styles/");
        } else {
          mapUrl += "styles/";
        }
        if (bdInfo["stylesUrl"]) {
          mapUrl = bdInfo["stylesUrl"];
        }

        let rect = bdInfo["rect"];
        let userScene = new DXIndoorMapScene(mapSDK);
        // userScene.bdInfo = bdInfo;
        // userScene._create(mapSDK, url, bdid, bdid, rect, floorInfos, userScene.currentFloorId||currentFloorId);
        userScene._create(mapSDK, mapUrl, bdid, bdid, rect, bdInfo, mapStyle);

        thisObject._scene.addChild(thisObject._scene.rootNode, userScene);
        if (config.bdid) {
          if (bdid == config.bdid) {
            let locationStr = bdInfo["location"] || bdInfo["data"]["location"];
            let location = locationStr.split(",").map(function (item) {
              return parseFloat(item);
            });
            // 确保在任意初始 zoom 下都加载 style.json
            thisObject.jumpTo({ center: { lng: location[0], lat: location[1] } });
            // 强制加载 scene config（包含 style.json），不依赖 zoom 级别
            // status: 0=UNLOAD, 1=LOADING, 2=LOADED
            if (userScene.status !== 2) {
              userScene._loadMap(function (bdInfo) {
                // 手动触发 onIndoorBuildingActive 事件，确保 getAllSceneList 被调用
                thisObject._onIndoorBuildingActive && thisObject._onIndoorBuildingActive(bdInfo);
              });
            } else {
              // 如果已经加载过，也手动触发事件
              thisObject._onIndoorBuildingActive && thisObject._onIndoorBuildingActive(userScene);
            }
            // thisObject.setIndoorBuildingVisible(true,);
          }
          // else{
          //   userScene.visible = false;
          // }
        }
      });
      this.bdListData = fileList;
      callback && callback(bdListData);
      // 初始化后触发检测室内是否显示
      this.redraw();
    };

    proto.initIndoorMap = function (bdlistData, callback) {
      let thisObject = this;
      let config = thisObject._mapSDK.config;
      let canvasDom = thisObject._mapboxMap["getCanvas"]();
      let newIndoorRenderLayer = new IndoorRenderLayer(thisObject, {
        onAdd: function (map, gl) {
          WebMap3D["init"](
            config.containerId,
            { baseMapPath: config.baseMapPath },
            function (e) {
              // 初始化map.config 相关坂数
              thisObject._indoorMapApi = e;
              thisObject.createIndoorBuildings(bdlistData, callback);
              thisObject._indoorMapApi["engineApi"]["registMapEvent"]({
                onForceRedraw: function (sender) {
                  thisObject.redraw();
                },
              });

              thisObject._indoorMapApi["engineApi"]["setOnIndoorBuildingActive"](function (bdid) {
                let ret = null;
                if (bdid.length > 0) {
                  ret = thisObject._scene.getChildById(bdid);
                  if (ret != null) {
                    if (ret.isLoaded()) {
                      if (!DXOutdoorUtils.isOutdoorBuilding(ret.bdInfo) && thisObject._onIndoorBuildingActive) {
                        thisObject.building = ret;
                        thisObject._onIndoorBuildingActive(ret);
                      }
                    }
                    ret._loadMap(function (e) {
                      if (!DXOutdoorUtils.isOutdoorBuilding(ret.bdInfo)) {
                        thisObject.building = ret;
                        if (thisObject._onIndoorBuildingLoaded) {
                          thisObject._onIndoorBuildingLoaded(e);
                          setTimeout(
                            function (time) {
                              thisObject.redraw();
                              time -= 1000;
                              if (time >= 0) {
                                setTimeout(arguments.callee, 1000, time);
                              }
                            },
                            1000,
                            6000,
                          );
                          thisObject._fire("onIndoorBuildingLoaded", e);
                        }
                        if (thisObject._onIndoorBuildingActive) {
                          thisObject._onIndoorBuildingActive(ret);
                        }
                      }

                      thisObject.redraw();
                    });
                  }
                } else if (thisObject._onIndoorBuildingActive) {
                  if (!thisObject._mapSDK.config.showOutDoorMap && !ret) {
                    return;
                  }
                  thisObject.building = ret;
                  thisObject._onIndoorBuildingActive(ret);
                }
              });
            },
            function (e) {
              console.log("Failed");
            },
            canvasDom,
          );
        },
      });
      thisObject.addToMapBox(newIndoorRenderLayer, "baseLayer");
    };
    proto.getCurrentBDID = function () {
      let bdid = "";
      if (this.building) {
        bdid = this.building.bdid;
      }
      return bdid;
    };
    proto.getCurrentBuilding = function () {
      return this.building;
    };
    proto.getCurrentBuildingInfo = function () {
      if (this.building) {
        return this.building["bdInfo"];
      } else {
        return null;
      }
    };
    proto.getCurrentFloorsInfo = function () {
      if (this.building) {
        return this.building["bdInfo"]["data"]["floors"];
      } else {
        return null;
      }
    };
    proto.getCurrentFloorId = function () {
      let floorId = "";
      if (this.building) {
        floorId = this.building.currentFloorId;
      }
      return floorId;
    };
    proto.getBuildingInfo = function (bdid) {
      let bdlist = this.bdListData;
      if (bdlist) {
        for (let i = 0, len = bdlist.length; i < len; i++) {
          if (bdlist[i]["bdid"] == bdid) {
            return bdlist[i];
          }
        }
      }
    };
    proto.getBuildingByPos = function (pos) {
      let bdlist = this.bdListData;
      if (bdlist) {
        for (let i = 0, len = bdlist.length; i < len; i++) {
          let rectArr = bdlist[i]["data"]["rect"].split(",").map(function (str) {
            return parseFloat(str);
          });
          if (
            DXMapUtils["naviMath"].pointInPolygon(pos, [
              [rectArr[0], rectArr[1]],
              [rectArr[2], rectArr[1]],
              [rectArr[2], rectArr[3]],
              [rectArr[0], rectArr[3]],
              [rectArr[0], rectArr[1]],
            ])
          ) {
            return bdlist[i];
          }
        }
      }
    };
    proto.loadOutdoorMap = function (config, completeCB) {
      let thisObject = this;
      let absAssetsPath = config.assetsPath;
      if (absAssetsPath.indexOf("://") == -1 && absAssetsPath[0] != "/") {
        let str = location.href;
        if (str.indexOf(".html") != -1 || str.indexOf(".htm") != -1) {
          str = str.slice(0, str.lastIndexOf("/") + 1);
        }
        while (absAssetsPath.indexOf("../") == 0) {
          absAssetsPath = absAssetsPath.slice(3);
          // index = str.slice(0,-1).lastIndexOf("/");
          if (str.lastIndexOf("/") == str.length - 1) {
            //str.indexOf(".html")!=-1 ||
            index = str.slice(0, -1).lastIndexOf("/");
          } else if (str.lastIndexOf("/") > 8) {
            index = str.lastIndexOf("/");
          }
          str = str.slice(0, index + 1);
        }
        absAssetsPath = str + absAssetsPath.replace("./", "");
      }
      config.absAssetsPath = absAssetsPath;
      window["mapsdkPath"] = absAssetsPath.replace("assets/", "");
      mapboxgl["accessToken"] = window.mapboxToken;

      let spriteUrl = config["spriteUrl"];
      if (!config["spriteUrl"] && (location.protocol == "https:" || location.protocol == "http:")) {
        spriteUrl = absAssetsPath + "images/" + (config.lang ? config.lang + "/" : "") + "default_markers"; //location.href.slice(0,location.href.slice("/app/")) + "/map_sdk/map/assets/images/default_markers";
      } else {
        spriteUrl = config["spriteUrl"] || "https://map1a.daxicn.com/DXOneMap/map_sdk/map/assets/images/default_markers"; //absAssetsPath + "images/default_markers"; //image 图标集合
      }
      if (spriteUrl.indexOf("http") == -1) {
        //mapbox 不支持相对路径
        spriteUrl = window["mapsdkPath"] + spriteUrl;
      }
      // let spriteUrl = config["spriteUrl"] || (absAssetsPath + "images/default_markers"); //image 图标集合

      let style = {
        version: 8,
        sprite: spriteUrl + "?t=" + Date.now(),
        glyphs: "https://map2a.daxicn.com/mapboxgl_fonts/{fontstack}/{range}.pbf", //"mapbox://fonts/mapbox/{fontstack}/{range}.pbf", //字体
        // "glyphs": config.glyphs || (window["mapsdkPath"]+"fonts/glyphs/{fontstack}/{range}.pbf"),
        // "glyphs":"./map/fonts/{fontstack}/{range}.pbf",
        sources: {},
        layers: [],
      };

      // 使用室外地图模块创建背景地图样式
      const outdoorStyle = DXOutdoorUtils.createOutdoorBackgroundMapStyle(config);
      style.sources = outdoorStyle.sources;
      style.layers = outdoorStyle.layers;

      thisObject.imageSizeBase;
      function getMapboxImageScale() {
        let pixelRatio = window.devicePixelRatio || 1;
        if (pixelRatio < 1.5) {
          return "";
        } else if (pixelRatio < 2.5) {
          return "@2x";
        } else {
          return "@3x";
        }
      }
      thisObject.imageSizeBase = getMapboxImageScale();

      if (spriteUrl) {
        thisObject.spriteUrl = spriteUrl + thisObject.imageSizeBase + ".png";
        let spriteimg = new Image();
        spriteimg.onload = function (data) {
          thisObject.spriteWidth = data.target.width;
          thisObject.spriteHeight = data.target.height;
        };
        spriteimg.src = thisObject.spriteUrl;
        this._mapSDK._getDownloader()["getServiceData"](
          spriteUrl + thisObject.imageSizeBase + ".json",
          "get",
          "json",
          null,
          function (data) {
            //alert("spriteUrl加载成功")
            thisObject._mapSDK.spriteData = data;
          },
          function () {
            //alert("spriteUrl加载失败")
          },
        );
      }

      // let outdoorMapConfig = bdlistData["outdoorMapConfig"];

      // if(outdoorMapConfig){
      //     zoom = outdoorMapConfig["zoom"]||zoom;

      //     minZoom = outdoorMapConfig["minZoom"]||minZoom;
      //     maxZoom = outdoorMapConfig["maxZoom"]||maxZoom;
      //     center = config.center?config.center:(outdoorMapConfig["center"]?outdoorMapConfig["center"]:config.defaultCenter);
      //     pitch = outdoorMapConfig["pitch"]||pitch;
      //     bearing = outdoorMapConfig["bearing"]||bearing;
      //     style = outdoorMapConfig["backgroudStyle"]||style; //如果配置了室外地图 用配置的
      //     minPitch = outdoorMapConfig["minPitch"]||minPitch;
      //     maxPitch = outdoorMapConfig["maxPitch"]||maxPitch;
      // }
      let center = [config.center["lon"], config.center["lat"]] || [116.4, 39.91];
      if (!style["sprite"]) {
        style.sprite = spriteUrl;
      }

      if (config.viewMode && !config.tilt) {
        config.tilt = config.viewMode == "2d" ? minPitch : maxPitch;
      }
      config["mapBgColorRGB"] = config.mapBgColorRGB || [245, 233, 206, 1];

      let mapboxConfig = {
        //accessToken也可以配置在此处
        container: config.containerId,
        antialias: true, //如果为 true ，gl 渲染环境在创建时将开启多重采样抗锯齿模式（ MSAA ）, 这对自定义图层的抗锯齿十分有效。出于性能优化考虑，该值默认为 false
        zoom: config.zoom,
        center: center, //[117.3829176531,39.026394650423],
        bearing: config.heading,
        pitch: config.tilt,
        style: DXOutdoorUtils.getOutdoorMapStyle(config, style), //'mapbox://styles/mapbox/light-v9', 地图的 Mapbox 配置样式。它必须是一个符合 Mapbox 样式规范 的 JSON 对象，或者是一个指向该 JSON 的 URL 地址

        // glyphs：mapbox地图使用的标注字体
        minZoom: config.minZoom,
        maxZoom: config.maxZoom,
        minPitch: config.minTilt,
        maxPitch: config.maxTilt,
        bearingSnap: 0,
        // "" 不使用本地字体，只使用自定义字体
        // "localIdeographFontFamily":"",
        localIdeographFontFamily: "'Noto Sans', 'Noto Sans CJK SC','sans-serif'", //"sans-serif",//"'NotoSansSCRegular'", //注记字体

        hash: false,
      };
      if (config.mapStyle) {
        thisObject.mapStyle = config.mapStyle;
      }
      if (config.maxBounds) {
        mapboxConfig["maxBounds"] = config.maxBounds;
      }
      // let extenalParams = ["bounds","boxZoom","clickTolerance","dragPan","dragRotate","fadeDuration","maxBounds"];
      let mapExtenal = config["extenal"];
      if (mapExtenal) {
        for (let key in mapExtenal) {
          ////默认必须设置之外的其他配置 比如 bounds
          mapboxConfig[key] = mapExtenal[key];
        }
      }

      thisObject._mapboxMap = new mapboxgl["Map"](mapboxConfig);
      thisObject._mapboxMap["on"]("load", function () {
        thisObject.loaded = true;
      });
      thisObject._mapboxMap["on"]("style.load", function () {
        let bottomStyle = {};
        let mapBgColorRGB = config["mapBgColorRGB"];
        if (mapBgColorRGB) {
          if (mapBgColorRGB.length == 3) {
            mapBgColorRGB.push(1);
          }
          let bgColor = "rgba(" + mapBgColorRGB.join(",") + ")";
          bottomStyle["fill-color"] = bgColor; //地图底色
          bottomStyle["visibility"] = config.showOutDoorMap === false ? "visible" : "none";
        }
        thisObject.addEmptyTypeLayer("bottomLayer", bottomStyle);
        thisObject.addEmptyTypeLayer("baseLayer");
        thisObject.addEmptyTypeLayer("poiLayer");
        thisObject.addEmptyTypeLayer("routeLayer");
        thisObject.addEmptyTypeLayer("normalMarkerLayer");
        thisObject.addEmptyTypeLayer("highlightMarkerLayer");
        thisObject.addEmptyTypeLayer("topLayer");

        // if (config.showOutDoorMap === false) {
        //   thisObject.setOutdoorMapVisible(false);
        // } else {
        //   // thisObject._mapboxMap["setPaintProperty"]("bottomLayer","fill-opacity",0);
        //   thisObject.setOutdoorMapVisible(true);
        // }

        thisObject.dxSceneMarkerLayer = new DXSceneMarkerManager(thisObject._mapSDK);

        let map = thisObject._mapboxMap;
        // let svgXML = '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">'
        //     + '<path d="M529.6128 512L239.9232 222.4128 384.7168 77.5168 819.2 512 384.7168 946.4832 239.9232 801.5872z" p-id="9085" fill="#ffffff"></path>'
        //     + '</svg>';
        // let svgXML = `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        //     <path d="M529.6128 512L239.9232 222.4128 384.7168 77.5168 819.2 512 384.7168 946.4832 239.9232 801.5872z" p-id="9085" fill="#ffffff"></path>
        // </svg>`;
        // let svgBase64 = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgXML)));
        // let arrowIcon = new Image(32, 32);
        // arrowIcon.src = svgBase64;
        // arrowIcon.onload = function () {
        //     map["addImage"]('arrowIcon', arrowIcon);
        // };
        // let arrowImgUrl = config.absAssetsPath + "images/arrowIcon_128.png";
        // thisObject.loadImage("arrowIcon",arrowImgUrl,{"width":64,"height":32});
        let arrowIcon = new Image(64, 32);
        arrowIcon.src =
          window["arrowBase64"] ||
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAgCAYAAACinX6EAAAA2klEQVRoge2YwQrDIBQEtf//zVoWIhTbEEJwZ8HOJZBDcAejjy1/NqeujN97n1+14/m6+61a1yz19kIe0A7h9UMEjktAm3ZbjASHgDn8IELCagFn4Qe4BOcZcAYqYbUAff/rKvgBJsGxA6IluH6BWAnOMyBSgvsQjJNA3AJREqhrMEYCOQdESEgYhFBIAVdj8qCvXCclICK8IATEhBduAVHhBdEIXWELL6hG6AxreEE2QjP28IJuhAZIeJEwCGHhBd0IoeEF2Qjh4QXVCEWEF0QjFBN+e7anlFLebJw2ONCdThQAAAAASUVORK5CYII="; //"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAgAgMAAADf85YXAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAMUExURUdwTP///////////waf0AoAAAADdFJOUwAq1BSjHjsAAABMSURBVCjPY2AgEjA6oAmwTUATkH6CJpD/E82I/f8c0AT+oxmS/x/NEOn/aIaw/aeLIRgCGFowDEW3lhZGYAQhRiBjRgNGRGFEJR4AABzXMvOMCUMBAAAAAElFTkSuQmCC";
        arrowIcon.onload = function () {
          map["addImage"]("arrowIcon", arrowIcon);
        };

        let routeArrowSVg =
          '<svg t="1623312022899" class="icon" viewBox="0 0 1025 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4700" data-spm-anchor-id="a313x.7781069.0.i6" xmlns:xlink="http://www.w3.org/1999/xlink" width="200.1953125" height="200"><defs><style type="text/css"></style></defs><path d="M516.22268 160.461856l418.045361 347.315464-418.045361 348.371134zM89.731959 376.874227h426.490721V633.402062H89.731959z" fill="#039447" p-id="4701" data-spm-anchor-id="a313x.7781069.0.i5" class=""></path></svg>';
        // map.addImage('routeArrow',routeArrowSVg);

        let svgBase642 = "data:image/svg+xml;base64," + window.btoa(unescape(encodeURIComponent(routeArrowSVg)));
        let routeArrow = new Image(32, 32); //32, 32
        routeArrow.src = svgBase642;
        routeArrow.onload = function () {
          map["addImage"]("routeArrow", routeArrow);
        };

        // thisObject.loadImage("routeArrow2",config.absAssetsPath +"images/arrowHead.png",{"width":32,"height":32});
        let routeArrow2Img = new Image(32, 32); //32, 32
        routeArrow2Img.onload = function () {
          map["addImage"]("routeArrow2", routeArrow2Img);
          // thisObject.loadImage("routeArrow2",config.absAssetsPath +"images/arrowHead.png",{"width":32,"height":32});
        };
        routeArrow2Img.src =
          window["naviArrorHead"] ||
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAgMAAADQNkYNAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAMUExURUdwTASlcQSlcQWlcmWNsBEAAAADdFJOUwCnUp5V3igAAALWSURBVGjevdc9ctswEEBhwSwwGRc8AsqUPgJxk+Qm0C1yHOkIqFz7CCpQpBCEmGEYkiJ+9rHw9m80xrfasU6nwvx6P8H5ltJPmLylFGDiUoqseEmfc0ZJNyZXlOgx+UBJPyY3lJgxYU82jMmdvjF95fR3SKGmxFIWBqOnxFMWBmOmhMBcpuRBWRDMS/o3Z8pCYF7n5IOyEJi3OflNWQjMZU4elAXA/GeRw6glsZRFDqOXxFMWOYxZkkBZ5DBuSSJmkcKodWIpixRGrxNPWaQwZp0EyiKFceskYhYZjNomlrLIYPQ28ZRFBmO2SaAsMhi3TSJmkcB0z4mlLBKY/jnxlEUCMzwnd8oigUm7wSxtmG6fXClLG6bfJze2+hKYYZ/c2epLYFKiMCqXWMrSgtG5xFOWFozJJYGytGBcLolw9VswKp9YtvotGJ1PPLlIbRiTTwK5SG0Yl08iZqndJVVKLGWp3SVdSjxlqd0lU0oCZandJVdKImYpw6hyYilLGUaXE09ZyjCmnATKUoZx5SRilhKMqiWWspRgdC3xlKUEY2pJoCwlGFdLImbJw6h6YilLHkbXE09Z8jBDPQmUJQ9TL3IwDZYcTNdKLGXJwfStxFOWHMzQSu5s9fMwqTlw9XMwXTu5stXPwfTt5EYuUh5maCd3yrKHSYnCKElypizPMFqSeLb6exgjSQK5SDkYJ0kiukh7GCVLLLlIexgtSzxl2cIYWRIoy3b9nSyJmGW9/kqaWMqyvktamnjKsr5LRpoEyrKGcdIkYpYFRskTS1kWGC1PPGVZYIw8CZRlgXHyJGKWGUaRxFKWGUaTxFOWGcaQJFCWGYYUEwximWA6lljKMsH0LPGUZYIZWBIoywTDihEGsowwHU0sW/0JpqeJpywjjKFJoJLjf2UXmjyOJO4LknjkU77mzz/gckD/wI5pvsmvNLke+SLTVx5/XnznB/blByneT6c/mxP8wYku/EMAAAAASUVORK5CYII=";

        // indoorMap 创建
        if (config.bdlist["data"]) {
          if (config.showOutDoorMap === false) {
            config.bdlist["data"]["showOutDoorMap"] = false;
          } else {
            config.bdlist["data"]["showOutDoorMap"] = true;
          }
          if (config.maxBounds) {
            config.bdlist["data"]["maxBounds"] = config.maxBounds;
          }
          thisObject.initIndoorMap(config.bdlist["data"], completeCB);
        } else if (config.bdlist["link"]) {
          thisObject.loadBDListData(function (bdidList) {
            config.bdlist["data"] = bdidList;
            if (config.showOutDoorMap === false) {
              bdidList["showOutDoorMap"] = false;
            } else {
              bdidList["showOutDoorMap"] = true;
            }
            if (config.maxBounds) {
              bdidList["maxBounds"] = config.maxBounds;
            }
            thisObject.initIndoorMap(bdidList, completeCB);
          });
        }

        thisObject.registerSelectRect();
      });

      thisObject._mapboxMap["on"]("zoomend", function (event) {
        thisObject._mapSDK._fire("mapZoomEnd", event["target"]["getZoom"]());
      });

      thisObject._mapboxMap["on"]("dragend", function (event) {
        let originalEvent = event["originalEvent"];
        thisObject._mapSDK._fire("mapDragEnd", event);
        thisObject._mapSDK._fire("onMapDragEnd", event);
      });
      thisObject._mapboxMap["on"]("click", function (e) {
        let data = { point: e["point"], lnglat: e["lngLat"], type: e["type"] };
        let point = e["point"];
        let layers = thisObject._mapboxMap["queryRenderedFeatures"]([
          [point["x"] - 0.5, point["y"] - 0.5],
          [point["x"] + 0.5, point["y"] + 0.5],
        ]).filter(function (item) {
          if (["bottomLayer", "baseLayer", "poiLayer", "routeLayer", "normalMarkerLayer", "highlightMarkerLayer", "topLayer"].indexOf(item["source"]) == -1) {
            return true;
          }
        });
        if (layers.length > 0) {
          //console.log("clickmap",layers);
          data["layers"] = layers;
          // thisObject._mapSDK._fire("mapClicked", data);
          // return;
        }
        thisObject._mapSDK._fire("mapClicked", data);
      });
      let touchStartTime = 0;
      let isLongPress = false;
      let touchPostion = {};
      let touchEndThreshold = 1000; //长按时间阀值
      let touchChange = 5; //抖动阀值

      thisObject._mapboxMap["on"]("touchstart", function (e) {
        touchPostion["point"] = e["point"];
        touchStartTime = Date.now();
        isLongPress = false;
      });
      thisObject._mapboxMap["on"]("touchend", function (e) {
        let changePositionX = Math.abs(e["point"]["x"] - touchPostion["point"]["x"]);
        let changePositionY = Math.abs(e["point"]["y"] - touchPostion["point"]["y"]);
        let touchEndTime = Date.now();
        if (touchEndTime - touchStartTime >= touchEndThreshold && changePositionX < touchChange && changePositionY < touchChange) {
          isLongPress = true;
          let data = { point: e["point"], lnglat: e["lngLat"], type: "mapLongPress" };
          thisObject._mapSDK._fire("mapLongPress", data);
        } else {
          isLongPress = false; // 如果是快速点击，则不视为长按
        }
      });
    };
    // 框选选择框
    proto.registerSelectRect = function () {
      let map = this._mapboxMap;
      let canvas = map["getCanvasContainer"]();
      let start, current, box;
      function mousePos(e) {
        let rect = canvas.getBoundingClientRect();
        return new mapboxgl["Point"](e["clientX"] - rect["left"] - canvas["clientLeft"], e["clientY"] - rect["top"] - canvas["clientTop"]);
      }
      function mouseDown(e) {
        // Continue the rest of the function if the shiftkey is pressed.
        if (!(e["shiftKey"] && e["button"] === 0)) return;
        // Disable default drag zooming when the shift key is held down.
        map["dragPan"]["disable"]();
        // Call functions for the following events
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        document.addEventListener("keydown", onKeyDown);
        // Capture the first xy coordinates
        start = mousePos(e);
      }
      function onMouseMove(e) {
        // Capture the ongoing xy coordinates
        current = mousePos(e);
        // Append the box element if it doesnt exist
        if (!box) {
          box = document.createElement("div");
          box.classList.add("mapboxgl-boxzoom");
          canvas.appendChild(box);
        }

        let minX = Math.min(start["x"], current["x"]),
          maxX = Math.max(start["x"], current["x"]),
          minY = Math.min(start["y"], current["y"]),
          maxY = Math.max(start["y"], current["y"]);

        // Adjust width and xy position of the box element ongoing
        let pos = "translate(" + minX + "px," + minY + "px)";
        box.style.transform = pos;
        box.style.WebkitTransform = pos;
        box.style.width = maxX - minX + "px";
        box.style.height = maxY - minY + "px";
      }

      function onMouseUp(e) {
        // Capture xy coordinates
        finish([start, mousePos(e)]);
      }

      function onKeyDown(e) {
        // If the ESC key is pressed
        if (e.keyCode === 27) finish();
      }

      function finish(bbox) {
        // Remove these events now that finish has been called.
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("keydown", onKeyDown);
        document.removeEventListener("mouseup", onMouseUp);
        if (box) {
          box.parentNode.removeChild(box);
          box = null;
        }

        // If bbox exists. use this value as the argument for `queryRenderedFeatures`
        if (bbox) {
          let diffX = Math.abs(bbox[0]["x"] - bbox[1]["x"]);
          let diffY = Math.abs(bbox[0]["y"] - bbox[1]["y"]);
          if (diffX < 4 || diffY < 4) {
            return;
          }
          let p1 = map["unproject"](bbox[0]);
          let p2 = map["unproject"](bbox[1]);
          thisObject._mapSDK._fire("selectBoxEnd", bbox, [p1, p2]);
          // let features = map.queryRenderedFeatures(bbox, { layers: ['counties'] });
          // if (features.length >= 1000) {
          // return window.alert('Select a smaller number of features');
        }

        // Run through the selected features and set a filter
        // to match features with unique FIPS codes to activate
        // the `counties-highlighted` layer.
        // let filter = features.reduce(function(memo, feature) {
        //         memo.push(feature["properties"].FIPS);
        //         return memo;
        // }, ['in', 'FIPS']);

        //     map.setFilter("counties-highlighted", filter);
        // }

        map["dragPan"]["enable"]();
      }

      // map.on('mousemove', function(e) {
      //     let features = map.queryRenderedFeatures(e.point, { layers: ['counties-highlighted'] });
      //     // Change the cursor style as a UI indicator.
      //     map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
      //     if (!features.length) {
      //     popup.remove();
      //     return;
      //     }
      //     let feature = features[0];

      //     popup.setLngLat(e.lngLat)
      //     .setText(feature["properties"].COUNTY)
      //     .addTo(map);
      // });

      canvas.addEventListener("mousedown", mouseDown, true);
    };
    proto.addTopLayer = function () {
      let layerData = {
        id: "topLayer",
        type: "fill",
        source: {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-180, -85],
                  [-180, 90],
                  [180, 90],
                  [180, -90],
                  [-180, -90],
                ],
              ],
            },
          },
        },
        layout: {
          visibility: "none",
        },
        paint: {
          "fill-color": "#fff",
          "fill-opacity": 0,
        },
      };
      return this._mapboxMap["addLayer"](layerData);
    };
    proto.addEmptyTypeLayer = function (typeId, options) {
      options = options || {};
      let layerData = {
        id: typeId,
        type: "fill",
        source: {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                options["coordinates"] || [
                  [-180, -85],
                  [-180, 90],
                  [180, 90],
                  [180, -90],
                  [-180, -90],
                ],
              ],
            },
          },
        },
        layout: {
          visibility: "visible", //options["visibility"] || "none"
        },
        paint: {
          "fill-color": options["fill-color"] || "#fff",
          "fill-opacity": options["fill-opacity"] || 0,
        },
      };
      return this._mapboxMap["addLayer"](layerData);
    };
    proto.setOutdoorMapVisible = function (isVisible) {
      let visible = isVisible == true ? "visible" : "none";
      this._mapboxMap["setLayoutProperty"]("bottomLayer", "visibility", "visible"); //visible);
      //outdoorBackgroundMap 室外地图layerId
      DXOutdoorUtils.setOutdoorBackgroundMapVisible(this._mapboxMap, isVisible);
      this.redraw();
    };
    proto.addToMapBox = function (layerData, layerType, isTop) {
      if (layerData.zIndex == undefined) {
        layerData.zIndex = 0;
      }
      this._mapboxMap["addLayer"](layerData, layerType); //
    };
    proto.init = function (completeCB) {
      let thisObject = this;

      thisObject._scene = new DXUserScene(thisObject);

      thisObject.factory = new DXSceneFactory(thisObject._scene);
      thisObject._scene.init();
      let config = thisObject._mapSDK.config;

      let baseMapPath = config.baseMapPath;

      let resourceList = [
        // baseMapPath + "../css/map.css",
        baseMapPath + "mapbox/mapbox-gl.css",
        // // baseMapPath + "mapbox/mapbox-gl-dev.js",
        baseMapPath + "mapbox/mapbox-gl.js",
        // baseMapPath + "mapbox/mapbox-v2.3/mapbox-gl.css",
        // baseMapPath + "mapbox/mapbox-v2.3/mapbox-gl.js",
        baseMapPath + config.indoorMapUrl, //室内地图api code
      ];

      DXMapUtils.loadResources(resourceList, function () {
        // thisObject.loadBDListData(function(mapConfig){
        thisObject.loadOutdoorMap(config, completeCB);
        // });

        return;
      });
    };
    proto.mapEventObj = {};

    proto.setIndoorMapStyle = function (style) {
      let thisObject = this;
      let currIndoorMap = this.getCurrentBuilding();
      if (currIndoorMap) {
        currIndoorMap.setMapStyle(style, function (data) {
          let curbdInfo = thisObject.getCurrentBuilding();
          if (thisObject._onIndoorBuildingActive && curbdInfo == currIndoorMap) {
            // thisObject.building = ret;
            thisObject._onIndoorBuildingActive(curbdInfo);
          }
        });
      }
    };
    proto.getStyle = function () {
      //返回地图的Mapbox样式对象，它能被用于重建地图样式
      return this._mapboxMap["getStyle"]();
    };
    proto.setStyle = function (style, option) {
      //用一个新值更新地图的Mapbox样式对象。如果样式已经设置并且 options.diff 是 true，则会将样式与地图的当前状态进行比较，并仅执行使地图样式与所需状态匹配所需的更改
      return this._mapboxMap["setStyle"](style, option);
    };
    proto.getLayer = function (layerId) {
      return this._mapboxMap["getLayer"](layerId);
    };
    proto.addLayer = function (layer, beforeId) {
      return this._mapboxMap["addLayer"](layer, beforeId);
    };
    proto.removeLayer = function (layerId) {
      return this._mapboxMap["removeLayer"](layerId);
    };
    proto.moveLayer = function (layerId, beforeId) {
      //将图层移动到另一个 z 轴位置（z-position）
      return this._mapboxMap["removeLayer"](layerId, beforeId);
    };
    proto.setFilter = function (layerId, filter, option) {
      // filter ((Array | null | undefined))筛选器，需符合 Mapbox 样式规范的 筛选器定义 。如果提供了 null 或 undefined ，函数会从图层中移除所有存在的筛选器。
      // option validate 是否检查筛选器符合 Mapbox GL 的样式定义。取消验证可以带来性能优化，但是应该只在之前已经检查过传入此函数的值时使用。
      return this._mapboxMap["setFilter"](layerId, filter, option);
    };
    proto.getFilter = function (layerId) {
      return this._mapboxMap["getFilter"](layerId);
    };
    proto.setPaintProperty = function (layerId, name, value, option) {
      return this._mapboxMap["setPaintProperty"](layerId, name, value, option);
    };
    proto.getPaintProperty = function (layerId, name) {
      return this._mapboxMap["getPaintProperty"](layerId, name);
    };
    proto["setLayoutProperty"] = function (layerId, name, value, option) {
      return this._mapboxMap["setLayoutProperty"](layerId, name, value, option);
    };
    proto.getLayoutProperty = function (layerId, name) {
      return this._mapboxMap["getLayoutProperty"](layerId, name);
    };
    proto.setFeatureState = function (feature, state) {
      // feature { id//唯一ID ,source :string //用于要素的矢量数据源或者 GeoJSON 数据源的 ID,sourceLayer可选 对于矢量切片数据源，sourceLayer 是必需的 }
      // state(Object)一个键值对集合。其中值应该是有效的 JSON 类型
      return this._mapboxMap["setFeatureState"](feature, state);
    };
    proto.removeFeatureState = function (target, state) {
      // 移除要素状态，将其设置回默认行为。如果只有数据被指定，移除该数据源的所有状态。如果 target.id 也被指定，移除该要素状态的所有键。 如果键也被指定，从该要素状态中移除指定的键。
      return this._mapboxMap["removeFeatureState"](target, state);
    };
    proto.getFeatureState = function (feature) {
      // 移除要素状态，将其设置回默认行为。如果只有数据被指定，移除该数据源的所有状态。如果 feature.id 也被指定，移除该要素状态的所有键。 如果键也被指定，从该要素状态中移除指定的键。
      return this._mapboxMap["getFeatureState"](feature);
    };

    // triggerRepaint  //触发一个显示框的渲染。使用自定义图层时，当图层发生改变，使用此方法去重渲染。 在下一个显示框渲染前多次调用此方法也只会渲染一次。
    // repaint 获得并设置一个布尔值，用于指示地图是否将继续再渲染。该信息有助于分析效果
    // showCollisionBoxes 获取并设置一个布尔值，指示地图是否会渲染数据源中所有符号周围的框，以及哪些符号已经被渲染，哪些因为冲突而被隐藏。这些信息有助于查错
    // showTileBoundaries 获取并设置一个布尔值，用以表示地图是否会渲染切片边界。这些切片边界有助于查错。        第一个矢量数据源的未压缩文件大小会被渲染到每一个切片的左上角，且在切片 ID 旁边。

    proto.setLayerZoomRange = function (layerId, minzoom, maxzoom) {
      return this._mapboxMap["setLayerZoomRange"](layerId, minzoom, maxzoom);
    };

    proto.setSourceData = function (layerId, data) {
      this._mapboxMap["getSource"](layerId)["setData"](data);
    };
    proto.getSource = function (sourceId) {
      return this._mapboxMap["getSource"](sourceId);
    };
    proto.removeSource = function (sourceId) {
      this._mapboxMap["removeSource"](sourceId);
    };
    proto.images = {};

    proto.loadImage = function (imgName, imgUrl, options, callback) {
      let thisObject = this;
      if (!imgName || !imgUrl) {
        callback && callback();
        return;
      }
      if (thisObject.images[imgName]) {
        //后加载单个图片
        if (thisObject.images[imgName]["loaded"]) {
          if (options["width"]) {
            options["scale"] = options["width"] / thisObject.images[imgName]["width"];
          }
          options["imgKey"] = imgName;
          callback && callback();
          return;
        }
      }
      if (thisObject._mapboxMap["hasImage"](imgName)) {
        //map上已有 sprite Url内部
        options["imgKey"] = imgName;
        if (options["width"]) {
          options["scale"] = options["width"] / 64;
        }
        callback && callback();
        return;
      }
      let key;
      imgUrl = computeAbsPath(imgUrl);
      if (thisObject._mapboxMap["hasImage"](imgUrl)) {
        //map上已有 sprite Url内部
        options["imgKey"] = imgUrl;
        callback && callback();
        return;
      }

      if (!options["width"] || !options["height"]) {
        if (thisObject._mapboxMap["hasImage"](imgName)) {
          //map上已有 sprite Url内部
          options["imgKey"] = imgName;
          callback && callback();
          return;
        } else {
          key = imgName; //imgUrl;
        }
      } else {
        let visibleWidth = options["width"] * (options["scale"] || 1);
        let visibleHeight = options["height"] * (options["scale"] || 1);
        key = imgName; //imgUrl;
      }
      if (key && thisObject.images[key]) {
        //后加载的图片
        // if(visibleWidth && saveWidth){
        //   options["scale"] = visibleWidth / saveWidth;  //options["width"]/thisObject.images[key]["width"];
        // }
        options["imgKey"] = key;
        if (thisObject.images[key]["loaded"]) {
          if (visibleWidth) {
            options["scale"] = visibleWidth / thisObject.images[key]["width"];
          }
          callback && callback();
          return;
        } else {
          thisObject.images[key]["imageLoadEvent"]._addEventHandlerOnce(function () {
            options["scale"] = options["width"] / thisObject.images[imgName]["width"];
            callback && callback();
          });
          thisObject.images[key]["imageLoadErrEvent"]._addEventHandlerOnce(function (sender, err) {
            options["scale"] = options["width"] / thisObject.images[imgName]["width"];
            callback && callback(err);
          });
          return;
        }
      } else {
        thisObject.images[key] = {
          loaded: false,
          url: imgUrl,
          imageLoadEvent: new EventHandler("imageLoadEvent"),
          imageLoadErrEvent: new EventHandler("imageLoadErrEvent"),
        };
      }
      let rawImg = new Image();
      rawImg.onload = function (e) {
        let image = this;
        let imgWidth = image.width,
          imgHeight = image.height;
        let log2Width = Math["log2"](imgWidth),
          log2Height = Math["log2"](imgHeight);
        let saveWidth = Math.pow(2, Math.round(log2Width)) * (options["scale"] || 1);
        let saveHeight = Math.pow(2, Math.round(log2Height)) * (options["scale"] || 1); //~
        if (!visibleWidth) {
          //没有制定宽高的情况以图片为准
          visibleWidth = (saveWidth = Math.pow(2, Math.round(log2Width))) * (options["scale"] || 1);
          visibleHeight = (saveHeight = Math.pow(2, Math.round(log2Height))) * (options["scale"] || 1); //~~ (width * (imgHeight/imgWidth));
          // key = imgUrl;//imgUrl+"_"+saveWidth+"_"+saveHeight; //image key
        }

        if (saveWidth != imgWidth || saveHeight != imgHeight) {
          if (!thisObject._mapboxMap["hasImage"](key)) {
            let canvas = document.createElement("canvas");
            ((canvas.width = saveWidth), (canvas.height = saveHeight));
            let context = canvas.getContext("2d");
            let dx = ~~(imgWidth < saveWidth ? (saveWidth - imgWidth) * 0.5 : 0); //居中左右留白
            let dy = ~~(imgHeight < saveHeight ? saveHeight - imgHeight : 0); //上留白
            context.drawImage(image, dx, dy, ~~(canvas.width - 2 * dx), ~~(canvas.height - dy));
            let img = new Image(canvas.width, canvas.height);
            img.onload = function () {
              if (!thisObject._mapboxMap["hasImage"](key)) {
                thisObject._mapboxMap["addImage"](key, this);
              }
              thisObject.images[key]["loaded"] = true;
              thisObject.images[key]["width"] = saveWidth;
              thisObject.images[key]["height"] = saveWidth;
              options["scale"] = visibleWidth / saveWidth;
              options["imgKey"] = key;
              callback && callback();
              thisObject.images[key]["imageLoadEvent"]._notifyEvent("loaded");
            };
            img.crossOrigin = "anonymous";
            img.src = canvas.toDataURL();
            // image = img;
          } else {
            options["scale"] = visibleWidth / saveWidth;
            options["imgKey"] = key;
            callback && callback();
            thisObject.images[key]["imageLoadEvent"]._notifyEvent("loaded");
          }
        } else {
          if (!thisObject._mapboxMap["hasImage"](key)) {
            thisObject._mapboxMap["addImage"](key, image);
            thisObject.images[key]["loaded"] = true;
            thisObject.images[key]["width"] = imgWidth;
            thisObject.images[key]["height"] = imgHeight;
          }
          options["scale"] = visibleWidth / imgWidth;
          options["imgKey"] = key;
          callback && callback();
          thisObject.images[key]["imageLoadEvent"]._notifyEvent("loaded");
        }
      };
      rawImg.onerror = function () {
        let err = { errMsg: imgUrl };
        thisObject.images[key]["err"] = err;
        thisObject.images[key]["loaded"] = true;
        callback && callback(err);
        thisObject.images[key]["imageLoadErrEvent"]._notifyEvent(err);
        return;
      };
      rawImg.crossOrigin = "anonymous";
      rawImg.src = imgUrl;

      // thisObject._mapboxMap["loadImage"](imgUrl, function (error, image) {
      //   if (error) {
      //     console.log("image load error",imgUrl);
      //     callback && callback({"errMsg":imgUrl});
      //     return;
      //     // throw error
      //   }
      //   let imgWidth = image.width, imgHeight = image.height;
      //   let log2Width = Math["log2"](imgWidth), log2Height = Math["log2"](imgHeight);
      //   let saveWidth = Math.pow(2, Math.round(log2Width)) * (options["scale"] || 1);
      //   let saveHeight = Math.pow(2, Math.round(log2Height)) * (options["scale"] || 1); //~
      //   if (!visibleWidth) {//没有制定宽高的情况以图片为准
      //     visibleWidth = (saveWidth = Math.pow(2, Math.round(log2Width))) * (options["scale"] || 1);
      //     visibleHeight = (saveHeight = Math.pow(2, Math.round(log2Height))) * (options["scale"] || 1); //~~ (width * (imgHeight/imgWidth));
      //     // key = imgUrl;//imgUrl+"_"+saveWidth+"_"+saveHeight; //image key
      //   }

      //   if (saveWidth != imgWidth || saveHeight != imgHeight) {

      //     if (!thisObject._mapboxMap["hasImage"](key)) {

      //       let canvas = document.createElement("canvas");
      //       canvas.width = saveWidth, canvas.height = saveHeight;
      //       let context = canvas.getContext("2d");
      //       let dx = ~~((imgWidth<saveWidth)?(saveWidth-imgWidth)*0.5:0); //居中左右留白
      //       let dy = ~~((imgHeight<saveHeight)?(saveHeight-imgHeight):0); //上留白
      //       context.drawImage(image, dx, dy, ~~(canvas.width-2*dx), ~~(canvas.height-dy));
      //       let img = new Image(canvas.width, canvas.height);
      //       img.onload = function () {
      //         if (!thisObject._mapboxMap["hasImage"](key)) {
      //           thisObject._mapboxMap["addImage"](key, this);
      //         }
      //         thisObject.images[key]["loaded"] = true;
      //         thisObject.images[key]["width"] = saveWidth;
      //         thisObject.images[key]["height"] = saveWidth;
      //         options["scale"] = visibleWidth / saveWidth;
      //         options["imgKey"] = key;
      //         callback && callback();
      //         thisObject.images[key]["imageLoadEvent"]._notifyEvent("loaded");

      //       }
      //       img.src = canvas.toDataURL();
      //       // image = img;
      //     } else {
      //       options["scale"] = visibleWidth / saveWidth;
      //       options["imgKey"] = key;
      //       callback && callback();
      //       thisObject.images[key]["imageLoadEvent"]._notifyEvent("loaded");
      //     }
      //   } else {
      //     if (!thisObject._mapboxMap["hasImage"](key)) {
      //       thisObject._mapboxMap["addImage"](key, image);
      //       thisObject.images[key]["loaded"] = true;
      //       thisObject.images[key]["width"] = imgWidth;
      //       thisObject.images[key]["height"] = imgHeight;
      //     }
      //     options["scale"] = visibleWidth / imgWidth;
      //     options["imgKey"] = key;
      //     callback && callback();
      //     thisObject.images[key]["imageLoadEvent"]._notifyEvent("loaded");
      //   }

      // });
    };
    proto.addImage = function (id, image, options) {
      //图像可用于 icon-image， background-pattern， fill-pattern，和 line-pattern。 一个 Map#error 事件会被触发如果sprite中没有足够的空间用于添加此图像。
      //image((HTMLImageElement | ImageData | {width: number, height: number, data: (Uint8Array | Uint8ClampedArray)} | StyleImageInterface))格式为 HTMLImageElement ， ImageData 的图像，或具有 width ， height ，和 data 的属性的对象，其格式都是 ImageData 。
      if (this._mapboxMap["hasImage"](id)) {
        this._mapboxMap["removeImage"](id);
      }
      this._mapboxMap["addImage"](id, image, options); //options.pixelRatio 图像像素与屏幕真实像素的比例  options.sdf 图像是否应该被解析为SDF图像
    };
    proto.getImage = function (imgName) {
      if (this._mapboxMap["hasImage"](imgName)) {
        return true;
      }
      if (!this.images[imgName]) {
        return false;
      }
      return this.images[imgName];
    };
    proto.getImageInfo = function (imgName) {
      return this.images[imgName];
    };
    proto.hasImage = function (id) {
      return this._mapboxMap["hasImage"](id); //boolean
    };
    proto.listImages = function () {
      return this._mapboxMap["listImages"]();
    };
    proto.removeImage = function (id) {
      delete proto.images[id];
      return this._mapboxMap["removeImage"](id);
    };
    proto.preLoadImages = function (imageMap, callback) {
      if (this._mapboxMap["hasImage"](imgName)) {
        return true;
      }
      for (let key in imageMap) {
        let image = imageMap[key];
        this.loadImage(image["name"], image["url"], image, callback);
      }
    };
    proto.clearRouteArrow = function () {
      DXClearMarkerVisitor();
    };
    proto.dataToMarkerFeature = function (markerInfo) {
      let id = markerInfo["featureId"] || markerInfo["id"];
      let feature = {
        type: "Feature",
        id: id,
        properties: {
          id: id,
          floorName: markerInfo["floorName"] || "",
          text: markerInfo["text"] || "",
          address: markerInfo["address"] || "",
          active: markerInfo["active"] || false,
        },
        geometry: {
          type: "Point",
          coordinates: [markerInfo["lon"], markerInfo["lat"]],
        },
      };
      let imageUrl = markerInfo["imageUrl"],
        highlightImageUrl = markerInfo["highlightImageUrl"];
      let markerIcon = markerInfo["markerIcon"] || imageUrl;
      let activeMarkerIcon = markerInfo["activeMarkerIcon"] || highlightImageUrl || markerIcon;
      if (imageUrl) {
        this.loadImage(markerIcon, imageUrl, markerInfo, function (err) {
          if (!err) {
            feature["properties"]["scale"] = markerInfo["scale"];
            feature["properties"]["imgKey"] = markerInfo["imgKey"];
          }
        });
      }
      if (highlightImageUrl) {
        let hightlightOpts = {
          width: markerInfo["highlightWidth"] || markerInfo["width"],
          height: markerInfo["highlightHeight"] || markerInfo["height"],
          scale: markerInfo["highlightScale"] || markerInfo["scale"],
        };
        this.loadImage(activeMarkerIcon, highlightImageUrl, hightlightOpts, function (err) {
          if (!err) {
            feature["properties"]["highlightScale"] = hightlightOpts["scale"];
            feature["properties"]["highlightImgKey"] = hightlightOpts["imgKey"];
          }
        });
      }
      if (markerIcon) {
        feature["properties"]["markerIcon"] = markerIcon;
      }
      if (activeMarkerIcon) {
        feature["properties"]["activeMarkerIcon"] = activeMarkerIcon;
      }
      if (markerInfo["icon"]) {
        feature["properties"]["icon"] = icon;
      }
      return feature;
    };
    proto.addDXSceneMarker = function (markerInfo, events) {
      let guid = this.factory.createUUID();

      if (markerInfo["onClick"]) {
        if (!events) {
          events = {};
        }
        events["click"] = markerInfo["onClick"];
      }

      if (!markerInfo["markerIcon"]) {
        markerInfo["markerIcon"] = markerInfo["imageUrl"];
      }
      if (markerInfo["markerIcon"] && !markerInfo["activeMarkerIcon"]) {
        markerInfo["activeMarkerIcon"] = markerInfo["highlightImageUrl"] || markerInfo["markerIcon"];
      }
      let marker = new DXSceneMarker();
      marker["initialize"](mapSDK, markerInfo);
      marker.id = guid;
      marker["addToMap"]();
      return marker;
    };
    proto.addMarker = function (markerInfo) {
      return this.dxSceneMarkerLayer.addFeatureToLayer(markerInfo);
    };

    proto.addMarkers = function (markerInfos, events, options) {
      this.dxSceneMarkerLayer.addFeatures(markerInfos, events, options);
    };
    // DXRemoveMarkerAndLineVisitor
    proto.removeMarker = function (markerId) {
      this.dxSceneMarkerLayer.removeFeatures([markerId]);
    };
    proto.removeMarkers = function (ids) {
      // removeFeatures
      this.dxSceneMarkerLayer.removeFeatures(ids);
    };
    proto.addToolTip = function (toolTipInfo, events) {
      // let floorId = toolTipInfo["floorId"]||"";
      // let bdid = toolTipInfo["bdid"]||"";
      let guid = this.factory.createUUID();
      let sourceObj = this._mapboxMap["getSource"](guid);
      if (sourceObj) {
        data = sourceObj._data["features"];
      }

      let toolTip = new DXSceneTipInfo();
      toolTip["initialize"](mapSDK, toolTipInfo);
      toolTip.id = guid;
      toolTip["addToMap"]();
      return toolTip;
    };
    proto.removeAllMarker = function () {
      this._scene.removeAllMarker();
    };
    proto.removeRoute = function () {
      this._scene.removeRoute();
    };
    proto.removeAllMarkerAndRoutes = function () {
      this._scene.removeAllMarkerAndRoutes();
    };
    proto.removeRouteAndRouteMarker = function () {
      this._scene.removeAllMarker();
      this._scene.removeRoute();
    };
    // DXRemoveMarkerAndLineVisitor
    proto.removeMarker = function (markerId) {
      let styles = this._mapboxMap["getStyle"]();
      let sources = styles["sources"];
      for (let sourceId in sources) {
        if (sourceId.indexOf("customer_") === 0) {
          let data = sources[sourceId]["data"]["features"];
          for (let len = data.length, i = 0; i < len; i++) {
            if (data[i]["properties"]["id"] == markerId) {
              data.splice(i, 1);
              this._mapboxMap["getSource"](sourceId)["setData"]({
                type: "FeatureCollection",
                features: data,
              });
              return;
            }
          }
        }
      }
    };

    proto.createPolyline = function (params) {
      let linePoints = params["linePoints"];
      if (typeof linePoints[0] == "string") {
        params["linePoints"] = linePoints.map(function (item) {
          if (typeof item == "string") {
            let p = item.split(",").map(function (str) {
              return parseFloat(str);
            });
            return p;
          } else {
            return item;
          }
        });
      }
      params["lineColor"] = params["lineColor"] || "#02c387";
      // params["wrapperColor"] = params["wrapperColor"]||"#036144";
      params["lineWidth"] = params["lineWidth"] || 8;
      // params["wrapperWidth"] == undefined ? (params["wrapperWidth"] = 12):'';
      params["lineData"] = params["lineData"] || params["linePoints"];

      if (params["wrapperWidth"]) {
        params["outLine"] = {
          lineColor: params["wrapperColor"] || "#036144",
          lineWidth: params["wrapperWidth"] || params["lineWidth"] + 2,
        };
      }
      let polyline = new DXScenePolyline();
      params.id = params.id || DXMapUtils.createUUID();
      let flag = polyline["initialize"](mapSDK, params);
      if (flag) {
        polyline["addToMap"]();
        return polyline;
      } else {
        return false;
      }
    };
    proto.createCircle = function (params) {
      if (params["lon"] && params["lat"]) {
        params["data"] = [{ coordinates: [params["lon"], params["lat"]] }];
      }
      if (!params["data"] && params["features"]) {
        params["data"] = params["features"];
      }
      // ['circle-blur', 'circle-color', 'circle-radius', 'circle-opacity', 'circle-stroke-color', 'circle-stroke-opacity', 'circle-stroke-width']
      let circleLayer = new DXMapCricleLayer();
      params.id = params.id || DXMapUtils.createUUID();
      circleLayer["initialize"](mapSDK, params);
      circleLayer["addToMap"]();
      return circleLayer;
    };
    proto.createPolyline2 = function (params) {
      let linePoints = params["linePoints"];
      if (linePoints && typeof linePoints[0] == "string") {
        params["linePoints"] = linePoints.map(function (item) {
          if (typeof item == "string") {
            let p = item.split(",").map(function (str) {
              return parseFloat(str);
            });
            return p;
          } else {
            return item;
          }
        });
      }
      params["lineColor"] = params["lineColor"] || "#02c387";
      // params["wrapperColor"] = params["wrapperColor"]||"#036144";
      params["lineWidth"] = params["lineWidth"] || 8;
      // params["wrapperWidth"] == undefined ? (params["wrapperWidth"] = 12):'';
      params["lineData"] = params["lineData"] || params["linePoints"];

      params["outLine"] = {
        lineColor: params["wrapperColor"] || "#036144",
        lineWidth: params["wrapperWidth"] || params["lineWidth"] + 2,
      };
      let polyline = new DXPolyline();
      params.id = params.id || DXMapUtils.createUUID();
      let flag = polyline["initialize"](mapSDK, params);
      if (flag) {
        polyline["addToMap"]();
        return polyline;
      } else {
        return false;
      }
    };
    proto.removePolylines = function (ids) {
      let thisObject = this;
      if (typeof ids == "string") {
        let line = thisObject._scene.getChildById(ids);
        if (line) {
          line["removeFromMap"]();
        }
      } else {
        ids.forEach(function (id) {
          let line = thisObject._scene.getChildById(id);
          if (line) {
            line["removeFromMap"]();
          }
        });
      }
    };

    proto.setFeatureTransparency = function (ids, transparency) {
      let line = this._scene.getChildById(ids);
      if (line) {
        line["updateLineTransparency"](transparency);
      }
    };
    proto.createPolygon = function (params) {
      //(floorId,polygonData,fillColor,opacity,outlineColor){
      let dxScenePolygon = new DXScenePolygon();
      params["fillColor"] = params["fillColor"] || "#4fa7f5";
      params["opacity"] = params["opacity"] || 1;
      params["outlineColor"] = params["outlineColor"] || "#FFF";
      dxScenePolygon["initialize"](this._mapSDK, params);
      dxScenePolygon["addToMap"]();
      return dxScenePolygon;
    };
    proto.createWMSLayer = function (options) {
      let wmsLayer = new DXMapBoxWMSLayer();
      wmsLayer["initialize"](this._mapSDK, options);
      wmsLayer["addToMap"]();
      return wmsLayer;
    };
    proto.createExtrusion = function (floorId, options, bdid, opacity) {
      // let dxSceneExtrude = new DXSceneExtrudeLayer();
      // let options = {
      //     "floorId":floorId,
      //     "features": polygonData,
      // };
      // dxSceneExtrude["initialize"](this._mapSDK, options);
      // dxSceneExtrude["addToMap"]();
      // return dxSceneExtrude;
      let dxSceneExtrude = new DXMapBoxExtrusionLayer();
      options["floorId"] = floorId;
      options["bdid"] = bdid;
      options["opacity"] = opacity || 0.9;
      dxSceneExtrude["initialize"](this._mapSDK, options);
      dxSceneExtrude["addToMap"]();
      return dxSceneExtrude;
    };
    proto.createArrow = function (guid, pointArr, floorId, imageUrl, width, wrapScale, options, callback) {
      if (width === undefined) {
        width = 1.0;
      }
      if (wrapScale === undefined) {
        wrapScale = 1.0;
      }
      let feature = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: pointArr,
        },
      };
      let thisObject = this;
      thisObject.loadImage(imageUrl, imageUrl, options, function (err) {
        if (!err) {
          feature["properties"]["scale"] = options["scale"];
          feature["properties"]["imgKey"] = options["imgKey"];
        }
        let polyline = thisObject.addArrowSymbolLayer(floorId, guid, guid, guid, [feature], options, imageUrl);
        callback && callback(polyline);
      });
    };
    proto.setPolylineGrayData = function (floorId, grayT, grayData) {
      DXGrayPolyLineVisitor(this._scene).visit(floorId, grayT, grayData);
    };
    proto.clearPolylineGrayData = function () {
      DXGrayPolyLineVisitor(this._scene).visit("", 0, []);
    };

    proto.redraw = function () {
      this._mapboxMap["triggerRepaint"]();
    };

    proto.indoorMapVisibleChanged = function (sender, visible) {
      this.setOutdoorMapVisible(visible);
    };
    proto.getZoom = function () {
      return this._mapboxMap["getZoom"]();
    };
    proto.setZoom = function (level) {
      return this._mapboxMap["setZoom"](level);
    };
    proto.zoomIn = function (options, eventData) {
      /*
      将地图的缩放级别增加 1 级。
          Parameters
          options(AnimationOptions)
          eventData(Object)该方法触发的事件对象需要添加的其它属性。*/
      this._mapboxMap["zoomIn"](options, eventData);
    };
    proto.zoomOut = function (options, eventData) {
      this._mapboxMap["zoomOut"](options, eventData);
    };
    proto.zoomTo = function (zoom, options, eventData) {
      this._mapboxMap["zoomTo"](zoom, options, eventData);
    };
    proto.onceMapEvent = function (eventName, layerIds, callback) {
      this._mapboxMap["once"](eventName, layerIds, callback);
    };
    proto.addMapEvent = function (eventName, layerIds, callback) {
      this._mapboxMap["on"](eventName, layerIds, callback);
    };
    proto.removeMapEvent = function (eventName, layerIds, callback) {
      this._mapboxMap["off"](eventName, layerIds, callback);
    };
    proto.getZoomLevelRange = function () {
      return [this._mapboxMap["getMinZoom"](), this._mapboxMap["getMaxZoom"]()];
    };

    proto.setZoomLevelRange = function (minLevel, maxLevel) {
      this._mapboxMap["setMinZoom"](minLevel);
      this._mapboxMap["setMaxZoom"](maxLevel);
    };
    proto.setMinZoom = function (level) {
      this._mapboxMap["setMinZoom"](level);
    };
    proto.getMinZoom = function (level) {
      this._mapboxMap["getMinZoom"](level);
    };
    proto.setMaxZoom = function (level) {
      this._mapboxMap["setMaxZoom"](level);
    };
    proto.getMaxZoom = function (level) {
      return this._mapboxMap["getMaxZoom"](level);
    };

    proto.setPadding = function (padding) {
      this._mapboxMap["setPadding"](padding);
    };
    proto.getPadding = function (padding) {
      return this._mapboxMap["getPadding"](padding);
    };
    proto.getBearing = function () {
      return this._mapboxMap["getBearing"]();
    };
    proto.setBearing = function (heading) {
      this._mapboxMap["setBearing"](heading);
    };
    proto.rotateTo = function (bearing, options, eventData) {
      this._mapboxMap["rotateTo"](bearing, options, eventData);
    };
    proto.getPitch = function () {
      return this._mapboxMap["getPitch"]();
    };

    proto.setPitch = function (tilt) {
      return this._mapboxMap["setPitch"](tilt);
    };

    proto.setRotatedCallBack = function (callback) {
      this._mapboxMap["on"]("rotateend", function (data) {
        let bearing = data["target"]["getBearing"]();
        callback && callback(bearing);
      });
    };
    proto.setPitchChangedCallback = function (callback) {
      this._mapboxMap["on"]("pitchend", function (data) {
        let pitch = data["target"]["getPitch"]();
        callback && callback(pitch);
      });
    };
    proto.resetNorth = function (options, eventData) {
      this._mapboxMap["resetNorth"](options, eventData);
    };
    proto.resetNorthPitch = function (options, eventData) {
      this._mapboxMap["resetNorthPitch"](options, eventData);
    };
    proto.fitBounds = function (bounds, options, eventData) {
      // bounds [[southeastern],[northwestern]]  可以根据 new mapboxgl.LngLatBounds([arr[0],arr[1]],[arr[2],arr[3]...]);获取
      // options   {easing :Function /*动画*/,linear:Boolean,/*default false*/ maxZoom,
      //offest,/*The center of the given bounds relative to the map's center, measured in pixels*/
      // padding number|paddingOptions {top,left,bottom,right}}
      this._mapboxMap["fitBounds"](bounds, options, eventData);
    };
    proto.getBounds = function (bounds) {
      return this._mapboxMap["getBounds"]();
    };
    proto.fitScreenCoordinates = function (p0, p1, bearing, options, eventData) {
      this._mapboxMap["fitScreenCoordinates"](p0, p1, bearing, options, eventData);
    };
    // map.panTo
    proto.jumpTo = function (options, eventData) {
      //Changes any combination of center, zoom, bearing, and pitch, without an animated transition
      //options(CameraOptions)
      //  {
      //     center: [0, 0],
      //     zoom: 8,
      //     pitch: 45,
      //     bearing: 90
      //     }
      this._mapboxMap["jumpTo"](options, eventData);
    };
    proto.flyTo = function (options, eventData) {
      // Changes any combination of center, zoom, bearing, and pitch, animating the transition along a curve that evokes flight   曲线动画
      // center: [0, 0],
      // zoom: 9,
      // minZoom ,
      // maxDuration,
      // speed: 0.2,
      // curve: 1,//The zooming "curve" that will occur along the flight path.
      // easing(t) {
      //    return t;
      //    }
      this._mapboxMap["flyTo"](options, eventData);
    };

    proto.easeTo = function (options, eventData) {
      //Changes any combination of center, zoom, bearing, pitch, and padding with an animated transition between old and new values.
      // {
      //     center: [0, 0],
      //     zoom: 9,
      //     speed: 0.2,
      //     curve: 1,
      //     duration: 5000,
      //     easing(t) {
      //     return t;
      //     }
      if (options["duration"] == undefined) {
        options["duration"] = 300;
      }
      this._mapboxMap["easeTo"](options, eventData);
    };

    proto.getPosition = function () {
      let center = this._mapboxMap["getCenter"]();
      return { lon: center["lng"], lat: center["lat"] };
    };
    proto.getCenter = function () {
      return this._mapboxMap["getCenter"]();
    };
    proto.setCenter = function (center, eventData) {
      // center : [lng,lat]  eventData(Object)该方法触发的事件对象需要添加的其它属性。
      //设置地图的地理中心点。等同于 jumpTo({center: center})
      return this._mapboxMap["setCenter"](center, eventData);
    };
    proto.cameraPose = function () {
      let center = this._mapboxMap["getCenter"]();
      let pitch = this.getPitch();
      let heading = this.getBearing();
      let floorId = "";
      let bdid = "";
      if (this.building) {
        floorId = this.building.currentFloorId;
        bdid = this.building.bdid;
      }
      let ret = {
        lon: center["lng"],
        lat: center["lat"],
        heading: heading,
        tilt: pitch,
        floorId: floorId,
        bdid: bdid,
      };
      return ret;
    };
    this._onIndoorBuildingActive = null;
    proto.setOnIndoorBuildingActive = function (callback) {
      this._onIndoorBuildingActive = callback;
    };

    this._onIndoorBuildingLoaded = null;
    proto.setOnIndoorBuildingLoaded = function (callback) {
      this._onIndoorBuildingLoaded = callback;
    };

    proto.activeFeature = function (e) {
      let feature = e["features"][0];
      let uuid = feature["properties"]["id"];
      let marker = DXHighlightMarkerByUUIDVisitor(mapSDK._coreMap._scene, uuid).visit()["highlightMarker"];
      if (marker !== null) {
        marker._options && marker._options["onClick"] && marker._options["onClick"](feature, marker);
      }
    };

    proto.changeFloor = function (bdid, floorId, explodedView, checkRange) {
      let indoorMapScene = this._scene.getChildById(bdid);
      if (checkRange) {
        let extent = indoorMapScene.extent;
        let pos = this.getPosition();
        let center = indoorMapScene.center;
        let inBuilding = DXMapUtils["naviMath"].pointInPolygon(
          [pos.lon, pos.lat],
          [
            [extent[0], extent[1]],
            [extent[2], extent[1]],
            [extent[2], extent[3]],
            [extent[0], extent[3]],
            [extent[0], extent[1]],
          ],
        );
        if (!inBuilding) {
          this.jumpTo({
            center: {
              lng: center[0],
              lat: center[1],
            },
          });
        }
      }
      if (indoorMapScene) {
        indoorMapScene._changeFloor(floorId, explodedView);
      }
    };
    proto.addControl = function (params, positon) {
      return this._mapboxMap["addControl"](params, positon);
    };
    proto.toUpperFloor = function (floorOffset) {
      if (this.building) {
        this.building._toUpperFloor(floorOffset);
      }
    };

    proto.toLowerFloor = function (floorOffset) {
      if (this.building) {
        this.building._toLowerFloor(floorOffset);
      }
    };

    proto.resumeFloor = function (explodedView) {
      if (this.building) {
        this.building._resumeFloor(explodedView);
      }
    };

    proto.setCurrentOffset = function (offest) {
      if (this.building) {
        this.building._setCurrentOffset(offest);
      }
    };
    proto.queryRendererdFeatures = function (bbox, layerNames, filter) {
      let options = { layers: layerNames };
      if (filter) {
        options["filter"] = filter;
      }
      return this._mapboxMap.queryRenderedFeatures(bbox, options);
    };
    proto.querySourceFeatures = function (sourceId, options) {
      //options parameters.sourceLayerstring? 查询矢量切片的图层的名称。 对于矢量切片数据源来说，该参数是必须的。 对于GeoJSON数据源则无需设置。
      //parameters.filter Array? filter 限制查询结果
      return this._mapboxMap.querySourceFeatures(sourceId, options);
    };
    proto._setFloorInterval = function (interval) {
      if (this.building) {
        this.building._setFloorInterval(interval);
      }
    };

    proto.updateFloors = function (explodedView) {
      if (this.building) {
        this.building._updateFloors(explodedView);
      }
    };
    proto.queryFeaturesByBbox = function (bbox, layerNames) {
      return this._mapboxMap.queryRenderedFeatures(bbox, {
        layers: layerNames,
      });
    };
    proto.setPoiLayerVisible = function (visible) {
      // let layers = this._mapboxMap["getStyle"]()["layers"];
      // DXGrayPolyLineVisitor
    };
    /////////////////////////////////////////////////////////////////////
    // Map Event
    /////////////////////////////////////////////////////////////////////
    proto._on = function (type, fn, context) {
      this._eventMgr.on(type, fn);
    };

    proto._once = function (type, fn, context) {
      this._eventMgr.once(type, fn);
    };

    proto._off = function (type, fn, context) {
      this._eventMgr.off(type, fn);
    };

    proto._fire = function (type, data) {
      this._eventMgr.fire(type, data);
    };
    proto.createHeatMap = function (options, data) {
      let heatmapLayer = new DXHeatMapLayer();
      let userScene = this._mapSDK._coreMap._scene;
      let bdid = options["bdid"] || "";
      let floorId = options["floorId"] || "";
      let floorObject = userScene.getChildById(bdid + floorId);
      heatmapLayer.floorId = floorId || "";
      if (floorObject) {
        heatmapLayer.setFloorObject(floorObject);
      }

      heatmapLayer["initialize"](this._mapSDK, options);
      heatmapLayer.visible = true;
      userScene.addChild(floorObject || userScene.rootNode, heatmapLayer);
      heatmapLayer["setData"](data);
      return heatmapLayer;
    };
    proto.getPoiInfoById = function (poiId, bdid, floorId) {
      let userScene = this._mapSDK._coreMap._scene;
      let floorObject;
      if (floorId && (floorObject = userScene.getChildById(bdid + floorId))) {
        let childNodes = floorObject.childNodes;
        for (let key in childNodes) {
          if (childNodes[key]._rtti == "DXMapBoxPoiLayer") {
            let poiInfo = childNodes[key].getPoiInfoById(poiId);
            return poiInfo;
          }
        }
      } else {
        let buildingObj = userScene.getChildById(bdid);
        for (let i = 0, len = buildingObj.childNodes.length; i < len; i++) {
          let floorObject = buildingObj.childNodes[i];
          let childNodes = floorObject.childNodes;
          for (let key in childNodes) {
            if (childNodes[key]._rtti == "DXMapBoxPoiLayer") {
              let poiInfo = childNodes[key].getPoiInfoById(poiId);
              if (poiInfo) {
                return poiInfo;
              }
            }
          }
        }
      }
      return;
    };
  };
  // daximap.DXSceneTexturePolygon = DXSceneTexturePolygon;
  daximap.DXOutdoorMap = DXOutdoorMap;
  daximap.DXIndoorMapScene = DXIndoorMapScene;
  daximap.DXSceneManager = DXSceneManager;
  daximap.DXSceneFactory = DXSceneFactory;
  daximap.DXUserLocationMarker = DXUserLocationMarker;

// ES6 模块导出
