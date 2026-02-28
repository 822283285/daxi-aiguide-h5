/**
 * Daximap 访问者模式组件库
 * 本文件由 daximap.scene.js 迁移并优化而来，用于处理场景节点的遍历与操作
 */

"use strict";

const daximap = window.DaxiMap || {};
const DXMapUtils = daximap.DXMapUtils;
const EventHandlerManager = daximap.EventHandlerManager;
const EventHandler = daximap.EventHandler;
const navi_utils = DXMapUtils.naviMath;
const Class = window.Class;

/**
 * 通用场景节点遍历器 (内部使用)
 * @param {Object} node 节点对象
 * @param {Function} callback 回调函数，返回 false 时停止向下递归
 */
const _traverseScene = (node, callback) => {
  if (!node || !node.childNodes) return;
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    const result = callback(child);
    if (result != false) {
      _traverseScene(child, callback);
    }
  }
};

/**
 * DXChangeFloorVisitor - 用于切换楼层时的可见性处理
 * @param {Object} scene 场景对象
 * @param {String} floorId 目标楼层 ID
 */
const DXChangeFloorVisitor = (scene, floorId) => {
  const thisObject = {};
  const visitNode = (node, visible) => {
    if (node.rtti == "DXSceneFloorObject") {
      if (node.isOutdoor) {
        visible = true;
      } else {
        visible = node.floorId == floorId;
      }
      node.visible = visible;
      // 继续向下递归并传递新的 visible 状态
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          visitNode(node.childNodes[i], visible);
        }
      }
    } else {
      node.checkFloor?.();
    }
  };
  thisObject.visit = () => {
    visitNode(scene, true);
  };
  return thisObject;
};

/**
 * DXMapBoxPoiVisitor - 处理 MapBox Poi 图层的可见性
 * @param {Object} scene 场景对象
 */
const DXMapBoxPoiVisitor = (scene) => {
  const thisObject = {};
  const visitNode = (node, visible, bdid) => {
    const nodeType = node.rtti;
    if (bdid) {
      if (nodeType == "DXIndoorMapScene") {
        // 内部递归
      } else if (nodeType == "DXMapBoxPoiLayer") {
        node.visible = visible;
      }
    }
    if (nodeType == "DXMapBoxPoiLayer") {
      visible = node.floorId == scene.floorId;
      node.visible = visible;
    } else {
      node.checkFloor?.();
    }

    if (node.childNodes) {
      for (let i = 0; i < node.childNodes.length; i++) {
        visitNode(node.childNodes[i], visible, bdid);
      }
    }
  };

  thisObject.visit = (bdid) => {
    visitNode(scene, true, bdid);
  };
  thisObject.setPanoVisible = (panoVisible) => {
    _traverseScene(scene, (node) => {
      if (node.rtti == "DXMapBoxPoiLayer") {
        node.setPanoVisible?.(panoVisible);
        return false; // 不再向 PoiLayer 内部递归
      }
    });
  };
  return thisObject;
};

/**
 * DXUpdateHeightOffsetVisitor - 更新高度偏移
 * @param {Object} scene 场景对象
 */
const DXUpdateHeightOffsetVisitor = (scene) => {
  const thisObject = {};
  thisObject.visit = () => {
    _traverseScene(scene, (node) => {
      if (node.rtti == "DXSceneFloorObject") {
        return true; // 继续向下
      } else {
        node.checkFloor?.(true);
        return true;
      }
    });
  };
  return thisObject;
};

/**
 * DXChangeFloorWithExplodedViewVisitor - 在爆炸分层视图下切换楼层
 * @param {Object} scene 场景对象
 * @param {String} floorId 目标楼层 ID
 */
const DXChangeFloorWithExplodedViewVisitor = (scene, floorId) => {
  const thisObject = {};
  const visitNode = (node, visible) => {
    if (node.rtti == "DXSceneFloorObject") {
      if (node.isOutdoor) {
        visible = false;
      } else {
        if (node.floorId == floorId) {
          visible = true;
          scene.indicator?._eventMgr?.fire("changeFloor");
        } else {
          visible = false;
        }
      }
      node.visible = visible;
    } else {
      node.checkFloor?.(true);
    }
    if (node.childNodes) {
      for (let i = 0; i < node.childNodes.length; i++) {
        visitNode(node.childNodes[i], visible);
      }
    }
  };
  thisObject.visit = () => {
    visitNode(scene, true);
  };
  return thisObject;
};

/**
 * DXSetBuildingVisitor - 设置建筑物的显示隐藏
 * @param {Object} scene 场景对象
 * @param {Boolean} visible 是否显示
 */
const DXSetBuildingVisitor = (scene, visible) => {
  const thisObject = {};
  const visitNode = (node, visible) => {
    if (node.rtti == "DXSceneFloorObject") {
      if (node.isOutdoor) {
        node.setOutdoorVisible?.(visible);
      }
    } else {
      node.checkFloor?.();
    }
    if (node.childNodes) {
      for (let i = 0; i < node.childNodes.length; i++) {
        visitNode(node.childNodes[i], visible);
      }
    }
  };
  thisObject.visit = () => {
    visitNode(scene.rootNode, visible);
  };
  return thisObject;
};

/**
 * DXSetPanoVisitor - 设置全景按钮可见性
 * @param {Object} scene 场景对象
 */
const DXSetPanoVisitor = (scene) => {
  const thisObject = {};
  thisObject.visit = (visible, mapSDK) => {
    _traverseScene(scene.rootNode, (node) => {
      if (node.rtti == "DXPoiLayer") {
        node.setPanoVisible?.(visible);
      }
    });
    mapSDK?._coreMap?._indoorMapApi?.engineApi?.forceRedraw?.();
  };
  return thisObject;
};

/**
 * DXPoiLayerVisitor - 处理 Poi 图层的可见性
 * @param {Object} scene 场景对象
 * @param {Boolean} isExploadedView 是否处于爆炸视图
 */
const DXPoiLayerVisitor = (scene, isExploadedView) => {
  const thisObject = {};
  thisObject.visit = (visible, mapSDK) => {
    _traverseScene(scene.rootNode, (node) => {
      if (node.rtti == "DXMapBoxPoiLayer") {
        node.visible = !isExploadedView;
      }
    });
    mapSDK?._coreMap?._indoorMapApi?.engineApi?.forceRedraw?.();
  };
  return thisObject;
};

/**
 * _clearNodesByRtti - 通用清理工具 (内部使用)
 * @param {Object} scene 场景对象
 * @param {Array} rttiList 待删除的类型列表
 */
const _clearNodesByRtti = (scene, rttiList) => {
  const deleteQueue = [];
  _traverseScene(scene.rootNode, (node) => {
    if (rttiList.indexOf(node.rtti) != -1 || (node.type && rttiList.indexOf(node.type) != -1)) {
      deleteQueue.push(node);
      return false; // 不再向被删除节点内部递归
    }
  });
  for (let i = 0; i < deleteQueue.length; i++) {
    const node = deleteQueue[i];
    node.removeFromMap?.();
    scene.removeChild(node);
  }
};

/**
 * DXClearMarkerVisitor - 清除地图上的 Marker
 * @param {Object} scene 场景对象
 */
const DXClearMarkerVisitor = (scene) => {
  const thisObject = {};
  thisObject.visit = () => {
    _clearNodesByRtti(scene, ["DXSceneMarker", "DXSceneMarkerLayer", "DXMapMarker"]);
    const markers = scene.api?.dxSceneMarkerLayer?.markerMap;
    if (markers) {
      for (const key in markers) {
        scene.api.dxSceneMarkerLayer.removeFeatureFromLayer(key);
      }
    }
  };
  return thisObject;
};

/**
 * DXClearLineVisitor - 清除地图上的线条
 * @param {Object} scene 场景对象
 */
const DXClearLineVisitor = (scene) => {
  const thisObject = {};
  thisObject.visit = () => {
    _clearNodesByRtti(scene, ["DXScenePolyline", "DXSceneArrow", "DXRouteMarker", "DXIndoorRouteOverlay"]);
  };
  return thisObject;
};

/**
 * DXGrayPolyLineVisitor - 处理置灰折线
 * @param {Object} scene 场景对象
 */
const DXGrayPolyLineVisitor = (scene) => {
  const thisObject = {};
  thisObject.visit = (floorId, grayT, grayLines, restPoint, maxLen) => {
    _traverseScene(scene.rootNode, (node) => {
      if (node.rtti == "DXScenePolyline" && (!floorId || node._floorId == floorId)) {
        node.setGrayPoints?.(grayT, grayLines, restPoint, maxLen);
      }
    });
  };
  return thisObject;
};

/**
 * DXClearLineArrowVisitor - 清除线条箭头
 * @param {Object} scene 场景对象
 */
const DXClearLineArrowVisitor = (scene) => {
  const thisObject = {};
  thisObject.visit = () => {
    _clearNodesByRtti(scene, ["DXSceneArrow"]);
  };
  return thisObject;
};

/**
 * DXRemoveMarkerAndLineVisitor - 清除所有 Marker 和 Line
 * @param {Object} scene 场景对象
 */
const DXRemoveMarkerAndLineVisitor = (scene) => {
  const thisObject = {};
  thisObject.visit = () => {
    _clearNodesByRtti(scene, ["polyline", "DXSceneMarker", "DXScenePolyline", "DXSceneArrow", "DXRouteMarker"]);
  };
  return thisObject;
};

/**
 * DXHighlightMarkerVisitor - 高亮指定 ID 的 Marker
 * @param {Object} scene 场景对象
 * @param {String} featureId 要素 ID
 */
const DXHighlightMarkerVisitor = (scene, featureId) => {
  const thisObject = {};
  thisObject.highlightMarker = null;
  thisObject.visit = () => {
    _traverseScene(scene.rootNode, (node) => {
      if (node.rtti == "DXSceneMarker") {
        if (node._featureId == featureId) {
          node.highlightMarker?.(true);
          thisObject.highlightMarker = node;
        } else {
          node.highlightMarker?.(false);
        }
      } else if (node.rtti == "DXSceneMarkerLayer") {
        if (node.highlightMarker?.(featureId)) {
          thisObject.highlightMarker = node;
        }
      }
    });
    return thisObject;
  };
  return thisObject;
};

/**
 * DXHighlightMarkerByUUIDVisitor - 通过 UUID 高亮 Marker
 * @param {Object} scene 场景对象
 * @param {String} uuid 唯一标识
 */
const DXHighlightMarkerByUUIDVisitor = (scene, uuid) => {
  const thisObject = {};
  thisObject.highlightMarker = null;
  thisObject.visit = () => {
    _traverseScene(scene.rootNode, (node) => {
      if (node.rtti == "DXSceneMarker") {
        if (node.id == uuid) {
          node.highlightMarker?.(true);
          thisObject.highlightMarker = node;
        } else {
          node.highlightMarker?.(false);
        }
      }
    });
    return thisObject;
  };
  return thisObject;
};

/**
 * DXSetMarkerVisibleVisitor - 设置指定 Marker 的可见性
 * @param {Object} scene 场景对象
 * @param {String} uuid UUID
 * @param {String} floorId 楼层 ID
 * @param {Boolean} visible 是否可见
 */
const DXSetMarkerVisibleVisitor = (scene, uuid, floorId, visible) => {
  const thisObject = {};
  thisObject.visit = () => {
    _traverseScene(scene.rootNode, (node) => {
      if (node.rtti == "DXSceneMarker") {
        if (node.parentNode?._floorId == floorId && node.id == uuid) {
          node.visible = !!visible;
        }
      }
    });
  };
  return thisObject;
};

/**
 * DXGetPoiBoundaryRecursiveVisitor - 获取 Poi 边界
 * @param {Object} scene 场景对象
 * @param {String} bdid 建筑物 ID
 * @param {String} floorId 楼层 ID
 */
const DXGetPoiBoundaryRecursiveVisitor = (scene, bdid, floorId) => {
  const thisObject = {};
  thisObject.aabb = navi_utils.AABB_create();
  thisObject.isSuccess = false;
  thisObject.visit = () => {
    thisObject.isSuccess = false;
    navi_utils.AABB_makeInvalid(thisObject.aabb);
    const targetFloor = floorId || "rootNode";

    _traverseScene(scene.rootNode, (node) => {
      if (node.rtti == "DXSceneMarker") {
        if (node.parentNode?._floorId == targetFloor && node._visible) {
          const pos = [node._options?.lon, node._options?.lat, 0];
          navi_utils.AABB_mergePoint(thisObject.aabb, thisObject.aabb, pos);
        }
      }
    });

    const min = thisObject.aabb._min;
    const max = thisObject.aabb._max;
    if (navi_utils.AABB_isValid(thisObject.aabb)) {
      thisObject.isSuccess = true;
      const centerLon = (max[0] + min[0]) * 0.5;
      const centerLat = (max[1] + min[1]) * 0.5;
      if (bdid && targetFloor != "rootNode") {
        const floorInfo = scene.rootNode.getChildById?.(bdid)?.getFloorInfo?.(targetFloor);
        if (floorInfo) {
          const range = floorInfo.rect;
          const diffLon = Math.abs(range[0] - range[2]);
          const diffLat = Math.abs(range[1] - range[3]);
          if (max[0] - min[0] > diffLon * 1.4 || max[1] - min[1] > diffLat * 1.4) {
            min[0] = centerLon - diffLon * 0.7;
            max[0] = centerLon + diffLon * 0.7;
            min[1] = centerLat - diffLat * 0.7;
            max[1] = centerLat + diffLat * 0.7;
          } else if (max[0] - min[0] < diffLon * 0.25 && max[1] - min[1] < diffLat * 0.25) {
            min[0] = centerLon - diffLon * 0.125;
            max[0] = centerLon + diffLon * 0.125;
            min[1] = centerLat - diffLat * 0.125;
            max[1] = centerLat + diffLat * 0.125;
          }
        }
      } else if (max[0] - min[0] < 0.0001 || max[1] - min[1] < 0.0001) {
        min[0] = centerLon - 0.0001;
        max[0] = centerLon + 0.0001;
        min[1] = centerLat - 0.0001;
        max[1] = centerLat + 0.0001;
      }
    }
    return thisObject;
  };
  return thisObject;
};

/**
 * DXGetPolyLineBoundaryRecursiveVisitor - 获取多段线边界
 * @param {Object} scene 场景对象
 * @param {String} bdid 建筑物 ID
 * @param {String} floorId 楼层 ID
 */
const DXGetPolyLineBoundaryRecursiveVisitor = (scene, bdid, floorId) => {
  const thisObject = {};
  thisObject.aabb = navi_utils.AABB_create();
  thisObject.visit = () => {
    let isSuccess = false;
    navi_utils.AABB_makeInvalid(thisObject.aabb);
    const targetFloor = floorId || "rootNode";

    _traverseScene(scene.rootNode, (node) => {
      if (node.rtti == "DXScenePolyline") {
        if ((targetFloor == "rootNode" || node.parentNode?._floorId == targetFloor) && node._visible) {
          const lineData = node._options?.lineData;
          if (lineData) {
            for (let j = 0; j < lineData.length; j++) {
              navi_utils.AABB_mergePoint(thisObject.aabb, thisObject.aabb, [lineData[j][0], lineData[j][1], 0]);
            }
          }
        }
      }
    });

    const min = thisObject.aabb._min;
    const max = thisObject.aabb._max;
    if (navi_utils.AABB_isValid(thisObject.aabb)) {
      isSuccess = true;
      const centerLon = (max[0] + min[0]) * 0.5;
      const centerLat = (max[1] + min[1]) * 0.5;
      if (bdid && targetFloor != "rootNode") {
        const floorInfo = scene.rootNode.getChildById?.(bdid)?.getFloorInfo?.(targetFloor);
        if (floorInfo) {
          const range = floorInfo.rect;
          const diffLon = Math.abs(range[0] - range[2]);
          const diffLat = Math.abs(range[1] - range[3]);
          if (max[0] - min[0] > diffLon * 1.4 || max[1] - min[1] > diffLat * 1.4) {
            min[0] = centerLon - diffLon * 0.7;
            max[0] = centerLon + diffLon * 0.7;
            min[1] = centerLat - diffLat * 0.7;
            max[1] = centerLat + diffLat * 0.7;
          }
        }
      } else if (max[0] - min[0] < 0.0001 || max[1] - min[1] < 0.0001) {
        min[0] = centerLon - 0.0001;
        max[0] = centerLon + 0.0001;
        min[1] = centerLat - 0.0001;
        max[1] = centerLat + 0.0001;
      }
    }
    return { isSuccess, aabb: { _min: min, _max: max } };
  };
  return thisObject;
};

// 导出所有 Visitor 类
export {
  DXChangeFloorVisitor,
  DXMapBoxPoiVisitor,
  DXUpdateHeightOffsetVisitor,
  DXChangeFloorWithExplodedViewVisitor,
  DXSetBuildingVisitor,
  DXSetPanoVisitor,
  DXPoiLayerVisitor,
  DXClearMarkerVisitor,
  DXClearLineVisitor,
  DXGrayPolyLineVisitor,
  DXClearLineArrowVisitor,
  DXRemoveMarkerAndLineVisitor,
  DXHighlightMarkerVisitor,
  DXHighlightMarkerByUUIDVisitor,
  DXSetMarkerVisibleVisitor,
  DXGetPoiBoundaryRecursiveVisitor,
  DXGetPolyLineBoundaryRecursiveVisitor,
};

// 同时挂载到 window.DaxiMap 以保持向后兼容
if (typeof window !== "undefined") {
  window.DaxiMap = window.DaxiMap || {};
  window.DaxiMap.DXChangeFloorVisitor = DXChangeFloorVisitor;
  window.DaxiMap.DXMapBoxPoiVisitor = DXMapBoxPoiVisitor;
  window.DaxiMap.DXUpdateHeightOffsetVisitor = DXUpdateHeightOffsetVisitor;
  window.DaxiMap.DXChangeFloorWithExplodedViewVisitor = DXChangeFloorWithExplodedViewVisitor;
  window.DaxiMap.DXSetBuildingVisitor = DXSetBuildingVisitor;
  window.DaxiMap.DXSetPanoVisitor = DXSetPanoVisitor;
  window.DaxiMap.DXPoiLayerVisitor = DXPoiLayerVisitor;
  window.DaxiMap.DXClearMarkerVisitor = DXClearMarkerVisitor;
  window.DaxiMap.DXClearLineVisitor = DXClearLineVisitor;
  window.DaxiMap.DXGrayPolyLineVisitor = DXGrayPolyLineVisitor;
  window.DaxiMap.DXClearLineArrowVisitor = DXClearLineArrowVisitor;
  window.DaxiMap.DXRemoveMarkerAndLineVisitor = DXRemoveMarkerAndLineVisitor;
  window.DaxiMap.DXHighlightMarkerVisitor = DXHighlightMarkerVisitor;
  window.DaxiMap.DXHighlightMarkerByUUIDVisitor = DXHighlightMarkerByUUIDVisitor;
  window.DaxiMap.DXSetMarkerVisibleVisitor = DXSetMarkerVisibleVisitor;
  window.DaxiMap.DXGetPoiBoundaryRecursiveVisitor = DXGetPoiBoundaryRecursiveVisitor;
  window.DaxiMap.DXGetPolyLineBoundaryRecursiveVisitor = DXGetPolyLineBoundaryRecursiveVisitor;
}
