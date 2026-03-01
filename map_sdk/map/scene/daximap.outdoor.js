/**
 * Daximap 室外地图模块
 * 包含室外地图配置、图层管理和相关工具函数
 */

"use strict";

const daximap = window.DaxiMap || {};
const DXMapUtils = daximap.DXMapUtils;

/**
 * 室外楼层标识常量
 */
const OUTDOOR_FLOOR_ID = "outdoor";

/**
 * 创建室外背景地图图层配置
 * @param {Object} config 地图配置对象
 * @returns {Object} Mapbox 样式配置对象
 */
function createOutdoorBackgroundMapStyle(config) {
  const outdoorTiles = config.outdoorTiles || [
    // 高德道路瓦片
    // scl=1&style=7 为矢量图（含路网和注记）
    // scl=2&style=7 为矢量图（含路网但不含注记）
    // scl=1&style=6 为影像底图（不含路网，不含注记）
    // scl=2&style=6 为影像底图（不含路网、不含注记）
    // scl=1&style=8 为影像路图（含路网，含注记）
    // scl=2&style=8 为影像路网（含路网，不含注记）
    "https://wprd01.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7",
    "https://wprd02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7",
    "https://wprd03.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7",
    "https://wprd04.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7",
  ];

  const style = {
    version: 8,
    sources: {
      "raster-tiles": {
        type: "raster",
        tiles: outdoorTiles,
        tileSize: 128,
        minzoom: 0,
        maxzoom: 18,
      },
    },
    layers: [
      {
        id: "outdoorBackgroundMap",
        type: "raster",
        source: "raster-tiles",
        minzoom: 1,
        maxzoom: 23,
        visibility: config["showOutDoorMap"] === false ? "none" : "visible",
      },
    ],
  };

  // 如果禁用室外地图，使用纯色背景
  if (config.showOutDoorMap == false) {
    style["sources"] = {};
    style["layers"][0] = {
      id: "outdoorBackgroundMap",
      type: "background",
      paint: {
        "background-color": "rgba(" + (config.mapBgColorRGB || [245, 233, 206]).join(",") + ")",
      },
    };
  }

  return style;
}

/**
 * 检查建筑是否为室外建筑
 * @param {Object} bdInfo 建筑信息对象
 * @returns {Boolean} 是否为室外建筑
 */
function isOutdoorBuilding(bdInfo) {
  return bdInfo && bdInfo["dataType"] === "outdoor";
}

/**
 * 检查楼层 ID 是否为室外楼层
 * @param {String} floorId 楼层 ID
 * @returns {Boolean} 是否为室外楼层
 */
function isOutdoorFloor(floorId) {
  return floorId === OUTDOOR_FLOOR_ID;
}

/**
 * 获取室外地图样式
 * @param {Object} config 地图配置对象
 * @param {Object} baseStyle 基础样式对象
 * @returns {Object|String} 室外地图样式
 */
function getOutdoorMapStyle(config, baseStyle) {
  return config.outdoorMapStyle || baseStyle;
}

/**
 * 设置室外背景地图可见性
 * @param {Object} mapboxMap Mapbox 地图实例
 * @param {Boolean} visible 是否可见
 */
function setOutdoorBackgroundMapVisible(mapboxMap, visible) {
  const layer = mapboxMap.getLayer("outdoorBackgroundMap");
  if (layer) {
    mapboxMap.getLayer("outdoorBackgroundMap").setLayoutProperty("visibility", visible ? "visible" : "none");
  }
}

// 导出常量和工具函数
const DXOutdoorConstants = {
  OUTDOOR_FLOOR_ID,
  OUTDOOR_LAYER_ID: "outdoorBackgroundMap",
};

const DXOutdoorUtils = {
  createOutdoorBackgroundMapStyle,
  isOutdoorBuilding,
  isOutdoorFloor,
  getOutdoorMapStyle,
  setOutdoorBackgroundMapVisible,
};


// 同时挂载到 window.DaxiMap 以保持向后兼容
if (typeof window !== "undefined") {
  window.DaxiMap = window.DaxiMap || {};
  window.DaxiMap.DXOutdoorConstants = DXOutdoorConstants;
  window.DaxiMap.DXOutdoorUtils = DXOutdoorUtils;
}
