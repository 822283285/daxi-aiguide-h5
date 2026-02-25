/**
 * Daximap 图层管理模块
 * 包含图层创建、特征管理、样式配置等工具函数
 */
((global) => {
  "use strict";

  const daximap = (global.DaxiMap = global.DaxiMap || {});
  const DXMapUtils = daximap.DXMapUtils;

  /**
   * 默认图层类型常量
   */
  const LAYER_TYPES = {
    FILL: "fill",
    LINE: "line",
    SYMBOL: "symbol",
    CIRCLE: "circle",
    HEATMAP: "heatmap",
    RASTER: "raster",
    FILL_EXTRUSION: "fill-extrusion",
  };

  /**
   * 默认数据源类型常量
   */
  const SOURCE_TYPES = {
    GEOJSON: "geojson",
    VECTOR: "vector",
    RASTER: "raster",
    IMAGE: "image",
  };

  /**
   * 填充图层的绑定属性配置
   */
  const FILL_LAYER_ATTRS = {
    paint: ["fill-antialias", "fill-color", "fill-pattern", "fill-translate", "fill-translate-anchor", "fill-opacity", "fill-outline-color"],
    layout: ["fill-sort-key", "visibility"],
    featureStates: {
      paint: ["fill-color", "fill-opacity", "fill-outline-color"],
      layout: [],
    },
  };

  /**
   * 线图层的绑定属性配置
   */
  const LINE_LAYER_ATTRS = {
    paint: [
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
    ],
    layout: ["line-cap", "line-join", "line-miter-limit", "line-round-limit", "line-sort-key", "visibility"],
    featureStates: {
      paint: ["line-blur", "line-color", "line-gap-width", "line-offset", "line-opacity", "line-width", "line-dasharray"],
      layout: ["line-sort-key"],
    },
  };

  /**
   * 圆形图层的绑定属性配置
   */
  const CIRCLE_LAYER_ATTRS = {
    paint: [
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
    ],
    layout: ["circle-sort-key", "visibility"],
    featureStates: {
      paint: ["circle-blur", "circle-color", "circle-radius", "circle-opacity", "circle-stroke-color", "circle-stroke-opacity", "circle-stroke-width"],
      layout: ["circle-sort-key"],
    },
  };

  /**
   * 根据图层类型获取属性配置
   * @param {String} layerType 图层类型
   * @returns {Object} 属性配置对象
   */
  function getLayerAttrsConfig(layerType) {
    switch (layerType) {
      case LAYER_TYPES.FILL:
        return FILL_LAYER_ATTRS;
      case LAYER_TYPES.LINE:
        return LINE_LAYER_ATTRS;
      case LAYER_TYPES.CIRCLE:
        return CIRCLE_LAYER_ATTRS;
      default:
        return { paint: [], layout: [], featureStates: { paint: [], layout: [] } };
    }
  }

  /**
   * 创建图层配置选项
   * @param {Object} params 参数对象
   * @param {String} params.layerId 图层ID
   * @param {String} params.layerType 图层类型
   * @param {String} params.sourceId 数据源ID
   * @param {Object} params.options 用户配置选项
   * @returns {Object} Mapbox 图层配置对象
   */
  function createLayerOptions(params) {
    const { layerId, layerType, sourceId, options } = params;
    const layerOptions = {
      id: layerId,
      type: layerType,
      source: sourceId,
      paint: {},
      layout: {},
    };

    const attrsConfig = getLayerAttrsConfig(layerType);
    const paintAttrs = attrsConfig.paint;
    const layoutAttrs = attrsConfig.layout;
    const featureStates = attrsConfig.featureStates;
    const featureStatesPaint = featureStates.paint;
    const featureStatesLayout = featureStates.layout;

    // 处理 feature state 绑定的 paint 属性
    for (let i = 0; i < featureStatesPaint.length; i++) {
      const key = featureStatesPaint[i];
      if (options[key] !== undefined) {
        if (key === "line-dasharray") {
          layerOptions.paint[key] = ["case", ["!=", ["get", key], null], ["get", key], ["literal", options[key]]];
        } else {
          layerOptions.paint[key] = ["case", ["!=", ["get", key], null], ["get", key], options[key]];
        }
        delete options[key];
      } else {
        layerOptions.paint[key] = ["get", key];
      }
    }

    // 处理 feature state 绑定的 layout 属性
    for (let i = 0; i < featureStatesLayout.length; i++) {
      const key = featureStatesLayout[i];
      if (options[key] !== undefined) {
        layerOptions.layout[key] = ["case", ["!=", ["get", key], null], ["get", key], options[key]];
        delete options[key];
      } else {
        layerOptions.layout[key] = ["get", key];
      }
    }

    // 处理其他 paint 和 layout 属性
    for (const key in options) {
      if (options[key] === undefined) {
        continue;
      }
      if (paintAttrs.indexOf(key) !== -1) {
        layerOptions.paint[key] = options[key];
      }
      if (layoutAttrs.indexOf(key) !== -1) {
        layerOptions.layout[key] = options[key];
      }
    }

    // 处理缩放级别限制
    if (options.minzoom) {
      layerOptions.minzoom = options.minzoom;
    }
    if (options.maxzoom) {
      layerOptions.maxzoom = options.maxzoom;
    }
    if (options.filter) {
      layerOptions.filter = options.filter;
    }

    return layerOptions;
  }

  /**
   * 创建 GeoJSON 数据源配置
   * @param {Object} options 配置选项
   * @returns {Object} 数据源配置对象
   */
  function createGeoJSONSourceData(options) {
    const sourceData = {
      type: SOURCE_TYPES.GEOJSON,
    };

    if (options.maxzoom) {
      sourceData.maxzoom = options.maxzoom;
    }
    if (options.maxlevel) {
      sourceData.maxzoom = options.maxlevel;
    }
    if (options.url) {
      sourceData.data = options.url;
    }

    // GeoJSON 数据源特有选项
    const sourceOptions = [
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

    for (const proName of sourceOptions) {
      if (options[proName] !== undefined) {
        sourceData[proName] = options[proName];
      }
    }

    return sourceData;
  }

  /**
   * 将数据数组转换为 GeoJSON FeatureCollection
   * @param {Array} data 数据数组
   * @param {String} defaultFeatureType 默认要素类型
   * @param {String} layerType 图层类型（用于推断要素类型）
   * @returns {Object} GeoJSON FeatureCollection
   */
  function convertToGeoJSON(data, defaultFeatureType, layerType) {
    if (!Array.isArray(data)) {
      return data;
    }

    const geojson = {
      type: "FeatureCollection",
      features: [],
    };

    data.forEach((item) => {
      if (!item.geometry && !item.coordinates) {
        return;
      }

      let featureType = defaultFeatureType;

      // 根据坐标深度推断要素类型
      if (!item.type && item.coordinates) {
        let testDeep = 1;
        let arr = item.coordinates;
        while (typeof arr[0] === "object") {
          testDeep++;
          arr = arr[0];
        }

        if (testDeep === 1) {
          featureType = "Point";
        } else if (testDeep === 2) {
          if (layerType === "symbol" || layerType === "circle") {
            featureType = "MultiPoint";
          } else {
            featureType = "LineString";
          }
        } else if (testDeep === 3) {
          if (layerType === "line") {
            featureType = "MultiLineString";
          } else {
            featureType = "Polygon";
          }
        } else {
          featureType = "MultiPolygon";
        }
      }

      geojson.features.push({
        type: "Feature",
        properties: item.properties || {},
        geometry: item.geometry || {
          type: item.type || featureType,
          coordinates: item.coordinates,
        },
      });
    });

    return geojson;
  }

  /**
   * 更新要素属性
   * @param {Object} source Mapbox 数据源对象
   * @param {String} id 要素ID
   * @param {Object} properties 要更新的属性
   */
  function updateFeatureProperties(source, id, properties) {
    const sourceData = source._data;
    const features = sourceData.features;

    for (let i = 0; i < features.length; i++) {
      const featureProps = features[i].properties;
      if (featureProps.id === id || featureProps.FT_ID === id) {
        for (const key in properties) {
          featureProps[key] = properties[key];
        }
      }
    }

    source.setData(sourceData);
  }

  /**
   * 检查图层可见性并更新
   * @param {Object} map Mapbox 地图实例
   * @param {String} layerId 图层ID
   * @param {Boolean} visible 是否可见
   * @param {Object} floorObject 楼层对象（可选）
   */
  function checkLayerVisibility(map, layerId, visible, floorObject) {
    let finalVisible = visible;

    if (floorObject) {
      finalVisible = visible && floorObject.visible;
    }

    if (layerId && map.getLayer(layerId)) {
      const value = finalVisible ? "visible" : "none";
      map.setLayoutProperty(layerId, "visibility", value);
    }
  }

  /**
   * 生成唯一的图层ID
   * @param {String} prefix 前缀
   * @returns {String} 唯一ID
   */
  function generateLayerId(prefix) {
    return (prefix || "layer") + "_" + DXMapUtils.createUUID();
  }

  /**
   * 创建标记图层的唯一键
   * @param {String} layerType 图层类型
   * @param {String} bdid 建筑ID
   * @param {String} floorId 楼层ID
   * @param {Number} zIndex 层级索引
   * @returns {String} 唯一键
   */
  function createMarkerLayerKey(layerType, bdid, floorId, zIndex) {
    return (layerType || "customer_markerlayer") + "_" + (zIndex || 0) + "_" + (bdid || "outdoor") + (floorId || "");
  }

  /**
   * 按建筑和楼层分组标记数据
   * @param {Array} markerInfos 标记信息数组
   * @param {Object} options 配置选项
   * @returns {Object} 分组后的数据映射
   */
  function groupMarkersByFloor(markerInfos, options) {
    const mapData = {};
    const defaultZIndex = (options && options.zIndex) || 0;

    for (let i = 0; i < markerInfos.length; i++) {
      const markerInfo = markerInfos[i];
      const bdid = markerInfo.bdid || "outdoor";
      const floorId = markerInfo.floorId || "";
      const styles = markerInfo.styles;

      if (styles) {
        // 处理多样式标记
        styles.forEach((style) => {
          style.lon = markerInfo.lon;
          style.lat = markerInfo.lat;
          style.id = markerInfo.id;
          style.featureId = markerInfo.featureId;

          const zIndex = style.zIndex !== undefined ? style.zIndex : defaultZIndex;
          const key = zIndex + "_" + bdid + floorId;

          if (!mapData[key]) {
            mapData[key] = { bdid, floorId, data: [], zIndex };
          }
          mapData[key].data.push(style);
        });
      } else {
        // 处理单样式标记
        const zIndex = defaultZIndex;
        const key = zIndex + "_" + bdid + floorId;

        if (!mapData[key]) {
          mapData[key] = { bdid, floorId, data: [], zIndex };
        }
        mapData[key].data.push(markerInfo);
      }
    }

    return mapData;
  }

  /**
   * 创建默认标记选项
   * @param {Object} featureInfo 要素信息
   * @returns {Object} 标记选项
   */
  function createDefaultMarkerOptions(featureInfo) {
    const bdid = featureInfo.bdid || "";
    const floorId = featureInfo.floorId || "";
    const id = featureInfo.id || featureInfo.poiId || DXMapUtils.createUUID();

    const markerOption = {
      featureId: id,
      bdid,
      floorId,
      imageUrl: "blue_dot",
      highlightImageUrl: "red_dot",
      scale: 0.5,
    };

    // 复制所有属性
    for (const key in featureInfo) {
      markerOption[key] = featureInfo[key];
    }

    return markerOption;
  }

  // 导出常量
  daximap.DXLayerConstants = {
    LAYER_TYPES,
    SOURCE_TYPES,
    FILL_LAYER_ATTRS,
    LINE_LAYER_ATTRS,
    CIRCLE_LAYER_ATTRS,
  };

  // 导出工具函数
  daximap.DXLayerUtils = {
    getLayerAttrsConfig,
    createLayerOptions,
    createGeoJSONSourceData,
    convertToGeoJSON,
    updateFeatureProperties,
    checkLayerVisibility,
    generateLayerId,
    createMarkerLayerKey,
    groupMarkersByFloor,
    createDefaultMarkerOptions,
  };
})(window);
