/**
 * Daximap 场景核心组件
 * 包含场景节点基类、场景管理主类等核心定义
 */

const daximap = window.DaxiMap || {};
const DXMapUtils = daximap.DXMapUtils;
const Class = window.Class;

/**
 * DXUserScene - 场景管理主类
 * 负责维护整个场景树（rootNode）和对象映射表（objectMap）
 * @param {Object} api 接口对象
 */
const DXUserScene = function (api) {
  this.api = api;
  this.objectMap = {};
  this.rootNode = null;
  this.factory = null;
  this.isBenchUpdate = false;

  const proto = DXUserScene.prototype;

  /**
   * 初始化根节点
   */
  proto.init = function () {
    const node = new daximap.DXSceneNode();
    node.id = "rootNode";
    node.name = "rootNode";
    node.visible = false;
    this.rootNode = node;
  };

  /**
   * 添加子节点
   * @param {Object} parentNode 父节点
   * @param {Object} childNode 子节点
   */
  proto.addChild = function (parentNode, childNode) {
    parentNode.addChild(childNode);
    this.objectMap[childNode.id] = childNode;
    if (!this.isBenchUpdate) {
      this.commitChanged();
    }
  };

  /**
   * 根据 ID 获取子节点
   * @param {String} id 节点 ID
   * @returns {Object} 场景节点
   */
  proto.getChildById = function (id) {
    return this.objectMap[id];
  };

  /**
   * 设置子节点可见性
   * @param {Boolean} visible
   * @param {String} childId
   * @param {Boolean} [singleVisible] 是否只显示该节点并隐藏同类节点
   */
  proto.setChildVisible = function (visible, childId, singleVisible) {
    if (singleVisible) {
      for (const id in this.objectMap) {
        const node = this.objectMap[id];
        if (node._rtti == "DXIndoorMapScene") {
          node.visible = id == childId ? visible : !visible;
        }
      }
    } else {
      const node = this.objectMap[childId];
      if (node) {
        node.visible = visible;
      }
    }
  };

  /**
   * 根据 ID 移除子节点
   * @param {String} childId
   */
  proto.removeChildById = function (childId) {
    const node = this.objectMap[childId];
    if (node) {
      this.removeChild(node);
    }
    return node;
  };

  /**
   * 移除子节点对象
   * @param {Object} childNode
   */
  proto.removeChild = function (childNode) {
    if (childNode?.parentNode) {
      childNode.parentNode.removeChild(childNode);
    }
    delete this.objectMap[childNode.id];
    if (childNode) {
      childNode.parentNode = null;
    }
    if (!this.isBenchUpdate) {
      this.commitChanged();
    }
  };

  /**
   * 移除所有导航路径
   */
  proto.removeRoute = function () {
    window.DXClearLineVisitor?.(this).visit();
  };

  /**
   * 移除所有标记点
   */
  proto.removeAllMarker = function () {
    window.DXClearMarkerVisitor?.(this).visit();
    this.api.dxSceneMarkerLayer?.clearAll();
  };

  /**
   * 兼容性方法：移除所有标记点
   */
  proto.removeAllMarkers = function () {
    this.api.dxSceneMarkerLayer?.clearAll();
  };

  /**
   * 清除所有附加对象（Marker 和 Line）
   */
  proto.clearObjects = function () {
    window.DXRemoveMarkerAndLineVisitor?.(this).visit();
  };

  /**
   * 移除所有标记点和路径
   */
  proto.removeAllMarkerAndRoutes = function () {
    window.DXRemoveMarkerAndLineVisitor?.(this).visit();
    this.api.dxSceneMarkerLayer?.clearAll();
  };

  /**
   * 开始批量更新
   */
  proto.beginUpdate = function () {
    this.isBenchUpdate = true;
  };

  /**
   * 结束批量更新并提交变更
   */
  proto.endUpdate = function () {
    if (this.isBenchUpdate) {
      this.commitChanged();
      this.isBenchUpdate = false;
    }
  };

  /**
   * 提交场景变更，触发渲染队列更新
   */
  proto.commitChanged = function () {
    const updateArgs = {
      markerRenderQueue: [],
      vectorRenderQueue: [],
      poiRenderQueue: {},
      tileRenderQueue: [],
    };
    this.rootNode?.update(updateArgs);
  };
};

/**
 * DXSceneObject - 场景对象基类
 */
class DXSceneObject {
  /**
   * 初始化属性
   */
  __init__() {
    this._id = this.id || "";
    this._name = this.name || "";
    this._rtti = this._rtti || "DXSceneObject";
    this._parentNode = null;
    this._visible = true;
    this._mapSDK = null;
    this._floorObject = null;
  }

  /**
   * 初始化关联 MapSDK
   * @param {Object} mapSDK
   */
  initialize(mapSDK) {
    this._mapSDK = mapSDK;
  }

  /** @type {String} 对象的 ID */
  get id() {
    return this._id;
  }
  set id(val) {
    this._id = val;
  }

  /** @type {String} 对象的名字 */
  get name() {
    return this._name;
  }
  set name(val) {
    this._name = val;
  }

  /** @type {String} 对象的类型标识 (RTTI) */
  get rtti() {
    return this._rtti;
  }

  /** @type {Boolean} 对象的可见性 */
  get visible() {
    return this._visible;
  }
  set visible(val) {
    this._visible = val;
  }

  /** @type {Object} 对象的父节点 */
  get parentNode() {
    return this._parentNode;
  }
  set parentNode(val) {
    this._parentNode = val;
  }
}

// 应用属性描述符（保持向后兼容）
daximap.defineProperties(DXSceneObject.prototype, {
  id: {
    get: function () {
      return this._id;
    },
    set: function (val) {
      this._id = val;
    },
  },
  name: {
    get: function () {
      return this._name;
    },
    set: function (val) {
      this._name = val;
    },
  },
  rtti: {
    get: function () {
      return this._rtti;
    },
  },
  visible: {
    get: function () {
      return this._visible;
    },
    set: function (val) {
      this._visible = val;
    },
  },
  parentNode: {
    get: function () {
      return this._parentNode;
    },
    set: function (val) {
      this._parentNode = val;
    },
  },
});

/**
 * DXSceneNode - 场景节点类 (支持子节点管理)
 */
class DXSceneNode extends DXSceneObject {
  /**
   * 初始化子节点容器
   */
  __init__() {
    super.__init__?.();
    this._rtti = "DXSceneNode";
    this.childNodes = [];
    this.childNodeMap = {};
  }

  /**
   * 根据 ID 获取子节点
   * @param {String} childId
   */
  getChildById(childId) {
    return this.childNodeMap[childId] || null;
  }

  /**
   * 根据索引获取子节点
   * @param {Number} index
   */
  getChildByIndex(index) {
    return this.childNodes[index];
  }

  /**
   * 添加子节点
   * @param {Object} childNode
   */
  addChild(childNode) {
    if (this.childNodeMap.hasOwnProperty(childNode.id)) {
      return false;
    }
    childNode.parentNode = this;
    this.childNodes.push(childNode);
    this.childNodeMap[childNode.id] = childNode;
    return true;
  }

  /**
   * 根据 ID 移除子节点
   * @param {String} childId
   */
  removeChildById(childId) {
    if (!this.childNodeMap.hasOwnProperty(childId)) {
      return false;
    }
    const childNode = this.childNodeMap[childId];
    childNode.parentNode = null;

    delete this.childNodeMap[childId];
    for (let i = 0; i < this.childNodes.length; i++) {
      if (this.childNodes[i].id == childId) {
        this.childNodes.splice(i, 1);
        break;
      }
    }
    return true;
  }

  /**
   * 移除子节点对象
   * @param {Object} childNode
   */
  removeChild(childNode) {
    return this.removeChildById(childNode.id);
  }

  /**
   * 根据索引移除子节点
   * @param {Number} index
   */
  removeChildByIndex(index) {
    const node = this.childNodes[index];
    return node ? this.removeChild(node) : false;
  }

  /**
   * 从地图中移除的具体实现 (子类覆盖)
   */
  removeFromMap() {}

  /**
   * 更新节点及子节点
   * @param {Object} updateArgs 更新参数
   */
  update(updateArgs) {
    if (!this.visible) return;
    for (let i = 0; i < this.childNodes.length; i++) {
      this.childNodes[i].update(updateArgs);
    }
  }
}

// 导出核心类

// 同时挂载到 window.DaxiMap 以保持向后兼容
if (typeof window !== "undefined") {
  window.DaxiMap = window.DaxiMap || {};
  window.DaxiMap.DXUserScene = DXUserScene;
  window.DaxiMap.DXSceneObject = DXSceneObject;
  window.DaxiMap.DXSceneNode = DXSceneNode;
}
