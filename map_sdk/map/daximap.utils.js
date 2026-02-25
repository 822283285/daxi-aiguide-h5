/**
 * 轻量级 OOP 类继承系统
 * 基于 John Resig 的 Simple JavaScript Inheritance
 * @see https://johnresig.com/blog/simple-javascript-inheritance/
 */
(function (global) {
  "use strict";

  var initializing = false;

  // 检测浏览器是否支持函数反编译（用于检测 _super 调用）
  var fnTest = /\b_super\b/;

  /** 基础类构造函数 */
  function Class() {}

  /** 创建子类 */
  Class.extend = function (props) {
    var _super = this.prototype;

    // 创建原型实例（跳过构造函数）
    initializing = true;
    var prototype = new this();
    initializing = false;

    // 复制属性到原型
    for (var name in props) {
      if (typeof props[name] == "function" && typeof _super[name] == "function" && fnTest.test(props[name])) {
        // 包装函数以支持 _super 调用
        prototype[name] = (function (name, fn) {
          return function () {
            var tmp = this._super;
            this._super = _super[name];
            var ret = fn.apply(this, arguments);
            this._super = tmp;
            return ret;
          };
        })(name, props[name]);
      } else {
        prototype[name] = props[name];
      }
    }

    // 创建新类构造函数
    function SubClass() {
      if (!initializing && this.__init__) {
        this.__init__.apply(this, arguments);
      }
    }

    SubClass.prototype = prototype;
    SubClass.prototype.constructor = SubClass;
    SubClass.extend = Class.extend;

    return SubClass;
  };

  global.Class = Class;
})(window);

(function (global) {
  var daximap = (global["DaxiMap"] = global["DaxiMap"] || {});

  /**
   * 设备类型检测与系统信息解析
   * 提供完整的设备、操作系统、浏览器环境检测
   */
  daximap["deviceType"] = (function () {
    var ua = navigator.userAgent;
    var uaLower = ua.toLowerCase();
    var vendor = navigator.vendor || "";

    // 环境检测
    var isWX = uaLower.indexOf("micromessenger") !== -1;
    var isAli = /AliApp/i.test(ua);
    var isMiniProgram = /MiniProgram/i.test(ua);

    var deviceType = {
      // 基础设备检测
      isMobile: /Android|Harmony|webOS|iPhone|iPod|BlackBerry/i.test(ua),
      isIos: /iPhone|iPad|iPod/i.test(ua),
      isAndroid: uaLower.indexOf("android") > -1,
      isWeiXin: isWX, //微信公众号
      isWX: isWX,
      isWXMiniProgram: isWX && isMiniProgram,
      isAli: isAli,
      isAliMiniProgram: isAli && isMiniProgram,

      // 操作系统信息
      osName: "",
      osVersion: "",
      deviceName: "",

      // 兼容 Platform 属性
      ios: /iPad|iPod|iPhone/i.test(ua),
      iphone: /iPhone\sOS\s(\d[_\d]*)/i.test(ua),
      ipad: /iPad.*OS\s(\d[_\d]*)/i.test(ua) ? +parseFloat(RegExp.$1.replace(/_/g, ".")) : 0,
      ipod: /iPod\sOS\s(\d[_\d]*)/i.test(ua) ? +parseFloat(RegExp.$1.replace(/_/g, ".")) : 0,
      uc: /UC/i.test(ua) || /UCWEB/i.test(vendor),
      micromessenger: isWX,
      google: /google/i.test(vendor),
    };

    // 版本解析配置
    var versionParsers = {
      iPhone: { pattern: /iPhone OS ([\d_]+)/, replace: true },
      iPad: { pattern: /iPad; CPU OS ([\d_]+)/, replace: true },
      Android: { pattern: /Android ([\d.]+)/, devicePattern: /\(Linux; Android [^;]+; ([^)]+) Build/ },
      Windows: { pattern: /Windows NT ([\d.]+)/ },
      Mac: { pattern: /Mac OS X ([\d_]+)/, replace: true },
    };

    // 解析设备信息
    for (var os in versionParsers) {
      var config = versionParsers[os];
      var match = ua.match(config.pattern);
      if (match) {
        deviceType.osName = os;
        deviceType.osVersion = config.replace ? match[1].replace(/_/g, ".") : match[1];

        // Android 设备名称
        if (config.devicePattern) {
          var deviceMatch = ua.match(config.devicePattern);
          deviceType.deviceName = deviceMatch ? deviceMatch[1] : "Android";
        }
        break;
      }
    }

    return deviceType;
  })();

  daximap["device"] = (function () {
    // Vibration接口用于在浏览器中发出命令，使得设备振动。
    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;

    return {
      vibrate: function (timerList) {
        if (navigator.vibrate) {
          navigator.vibrate(timerList);
        }
      },
    };
    // navigator.vibrate([500]);
  })();

  daximap["browser"] = (function () {
    if (/MicroMessenger/.test(window.navigator.userAgent)) {
      return "WEIXIN";
    } else if (/AlipayClient/.test(window.navigator.userAgent)) {
      return "ALIPAY";
    } else {
      return "other";
    }
  })();

  //////////////////////////////////////////////////////////////
  // EventHandler - 单事件类型的监听器管理
  //////////////////////////////////////////////////////////////

  /**
   * 事件处理器构造函数
   * @param {string} eventId 事件标识
   */
  function EventHandler(eventId) {
    this._eventId = eventId;
    this._handlers = [];
  }

  EventHandler.prototype = {
    constructor: EventHandler,

    /**
     * 添加事件监听器
     * @param {Function} callback 回调函数
     * @param {Object} context 上下文对象
     */
    addEventHandler: function (callback, context) {
      if (typeof callback !== "function") return;
      // 避免重复添加
      for (var i = 0; i < this._handlers.length; i++) {
        if (this._handlers[i].fn == callback) return;
      }
      this._handlers.push({ fn: callback, ctx: context, once: false });
    },

    /**
     * 添加一次性事件监听器
     * @param {Function} callback 回调函数
     * @param {Object} context 上下文对象
     */
    addEventHandlerOnce: function (callback, context) {
      if (typeof callback !== "function") return;
      for (var i = 0; i < this._handlers.length; i++) {
        if (this._handlers[i].fn == callback) return;
      }
      this._handlers.push({ fn: callback, ctx: context, once: true });
    },

    /**
     * 移除事件监听器
     * @param {Function} callback 回调函数
     */
    removeEventHandler: function (callback) {
      for (var i = this._handlers.length - 1; i >= 0; i--) {
        if (this._handlers[i].fn == callback) {
          this._handlers.splice(i, 1);
        }
      }
    },

    /**
     * 清空所有事件监听器
     */
    clearEventHandler: function () {
      this._handlers = [];
    },

    /**
     * 触发事件
     * @param {*} data 事件数据
     * @param {*} extra 额外参数
     */
    notifyEvent: function (data, extra) {
      // 复制数组避免遍历时修改
      var handlers = this._handlers.slice();
      for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i];
        handler.fn.call(handler.ctx, handler.ctx, data, extra);
        // 移除一次性监听器
        if (handler.once) {
          this.removeEventHandler(handler.fn);
        }
      }
    },
  };

  // 兼容旧 API（使用下划线前缀）
  EventHandler.prototype._addEventHandler = EventHandler.prototype.addEventHandler;
  EventHandler.prototype._addEventHandlerOnce = EventHandler.prototype.addEventHandlerOnce;
  EventHandler.prototype._removeEventHandler = EventHandler.prototype.removeEventHandler;
  EventHandler.prototype._clearEventHandler = EventHandler.prototype.clearEventHandler;
  EventHandler.prototype._notifyEvent = EventHandler.prototype.notifyEvent;

  //////////////////////////////////////////////////////////////
  // EventHandlerManager - 多事件类型的统一管理器
  //////////////////////////////////////////////////////////////

  /**
   * 事件管理器构造函数
   */
  function EventHandlerManager() {
    this.eventMap = {};
  }

  EventHandlerManager.prototype = {
    constructor: EventHandlerManager,

    /**
     * 监听事件
     * @param {string} type 事件类型
     * @param {Function} fn 回调函数
     * @param {Object} context 上下文
     */
    on: function (type, fn, context) {
      if (!this.eventMap[type]) {
        this.eventMap[type] = new EventHandler(type);
      }
      this.eventMap[type].addEventHandler(fn, context);
    },

    /**
     * 取消监听
     * @param {string} type 事件类型
     * @param {Function} fn 回调函数
     */
    off: function (type, fn) {
      if (this.eventMap[type]) {
        this.eventMap[type].removeEventHandler(fn);
      }
    },

    /**
     * 一次性监听
     * @param {string} type 事件类型
     * @param {Function} fn 回调函数
     * @param {Object} context 上下文
     */
    once: function (type, fn, context) {
      if (!this.eventMap[type]) {
        this.eventMap[type] = new EventHandler(type);
      }
      this.eventMap[type].addEventHandlerOnce(fn, context);
    },

    /**
     * 触发事件
     * @param {string} type 事件类型
     * @param {*} data 事件数据
     * @param {*} extra 额外参数
     */
    fire: function (type, data, extra) {
      if (this.eventMap[type]) {
        this.eventMap[type].notifyEvent(data, extra);
      }
    },
  };

  // 暴露到全局作用域和 daximap 命名空间
  global["EventHandler"] = EventHandler;
  global["EventHandlerManager"] = EventHandlerManager;
  daximap["EventHandler"] = EventHandler;
  daximap["EventHandlerManager"] = EventHandlerManager;

  //////////////////////////////////////////////////////////////
  // Cross - 跨域 iframe 通信桥接器
  //////////////////////////////////////////////////////////////

  var Cross = (function () {
    /**
     * 跨域通信构造函数
     * @param {Window} _global 当前窗口
     * @param {Window} targetWin 目标窗口
     * @param {string} targetDomain 目标域名
     */
    function Cross(_global, targetWin, targetDomain) {
      if (!(this instanceof Cross)) {
        return new Cross(_global, targetWin, targetDomain);
      }

      var self = this;
      this.signalHandler = {};
      this.targetWindow = targetWin;
      this.targetDomain = targetDomain;
      this.global = _global;

      // 使用原生事件监听，绑定 this
      this._messageHandler = function (e) {
        self._handleMessage(e);
      };
      _global.addEventListener("message", this._messageHandler, false);
    }

    Cross.prototype = {
      constructor: Cross,

      /** 处理消息 */
      _handleMessage: function (e) {
        var data = e.data;
        var source = e.source;
        var origin = e.origin;

        try {
          var protocol = typeof data == "string" ? JSON.parse(data) : data;
          var handler = this.signalHandler[protocol.signal];

          if (handler) {
            var result = handler.call(null, protocol.data, {
              source: source,
              origin: origin,
              callback: protocol.callback,
            });

            // 如果有回调且有返回值，发送回调
            if (result !== undefined && protocol.callback) {
              this.callEx(source, origin, protocol.callback, { result: result });
            }

            // 清理一次性回调
            if (/^callback_/.test(protocol.signal)) {
              delete this.signalHandler[protocol.signal];
            }
          }
        } catch (err) {
          console.error("Cross message error:", err);
        }
      },

      /**
       * 注册消息处理函数
       * @param {string} signal 信号名称
       * @param {Function} func 处理函数
       */
      on: function (signal, func) {
        this.signalHandler[signal] = func;
      },

      /**
       * 取消注册
       * @param {string} signal 信号名称
       */
      off: function (signal) {
        delete this.signalHandler[signal];
      },

      /**
       * 发送消息到目标窗口
       * @param {string} signal 信号名称
       * @param {*} data 数据
       * @param {Function} callback 回调函数
       */
      call: function (signal, data, callback) {
        this.callEx(this.targetWindow, this.targetDomain, signal, data, callback);
      },

      /**
       * 发送消息到指定窗口
       * @param {Window} win 目标窗口
       * @param {string} domain 目标域名
       * @param {string} signal 信号名称
       * @param {*} data 数据
       * @param {Function} callback 回调函数
       */
      callEx: function (win, domain, signal, data, callback) {
        var message = {
          signal: signal,
          data: data,
        };

        if (callback) {
          message.callback = "callback_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
          this.on(message.callback, callback);
        }

        win.postMessage(JSON.stringify(message), domain);
      },

      /** 销毁实例，移除事件监听 */
      destroy: function () {
        this.global.removeEventListener("message", this._messageHandler, false);
        this.signalHandler = {};
      },
    };

    return Cross;
  })();

  // 暴露到全局作用域和 daximap 命名空间
  global["Cross"] = Cross;
  daximap["Cross"] = Cross;

  //////////////////////////////////////////////////////////////
  // DXMapUtils
  //////////////////////////////////////////////////////////////
  var DXMapUtils = (function () {
    var thisObject = {};
    (function (a) {
      var b = window.navigator.userAgent;
      a.Platform = {
        ios: /iPad|iPod|iPhone/i.test(b),
        iphone: /iPhone\sOS\s(\d[_\d]*)/i.test(b),
        ipad: /iPad.*OS\s(\d[_\d]*)/i.test(b) ? +parseFloat(RegExp.$1.replace(/_/g, ".")) : 0,
        ipod: /iPod\sOS\s(\d[_\d]*)/i.test(b) ? +parseFloat(RegExp.$1.replace(/_/g, ".")) : 0,
        uc: /UC/i.test(b) || /UCWEB/i.test(window.navigator.vendor),
        micromessenger: /MicroMessenger/i.test(b),
        i9300: /i9300/i.test(b),
        sonyEricssonLT26i: /sonyEricssonLT26i/i.test(b),
        google: /google/i.test(window.navigator.vendor),
      };
    })(thisObject);

    var cssRegExp = new RegExp("\\.css");

    thisObject.defineGetterSetter = function (obj, key, getFunc, opt_setFunc) {
      if (Object.defineProperty) {
        var desc = {
          get: getFunc,
          configurable: true,
        };
        if (opt_setFunc) {
          desc.set = opt_setFunc;
        }
        Object.defineProperty(obj, key, desc);
      } else {
        obj.__defineGetter__(key, getFunc);
        if (opt_setFunc) {
          obj.__defineSetter__(key, opt_setFunc);
        }
      }
    };

    /**
     * Defines a property getter for obj[key].
     */
    thisObject.defineGetter = thisObject.defineGetterSetter;

    thisObject.arrayIndexOf = function (a, item) {
      if (a.indexOf) {
        return a.indexOf(item);
      }
      var len = a.length;
      for (var i = 0; i < len; ++i) {
        if (a[i] == item) {
          return i;
        }
      }
      return -1;
    };

    /**
     * Returns whether the item was found in the array.
     */
    thisObject.arrayRemove = function (a, item) {
      var index = thisObject.arrayIndexOf(a, item);
      if (index !== -1) {
        a.splice(index, 1);
      }
      return index !== -1;
    };

    thisObject.typeName = function (val) {
      return Object.prototype.toString.call(val).slice(8, -1);
    };

    /**
     * Returns an indication of whether the argument is an array or not
     */
    thisObject.isArray =
      Array.isArray ||
      function (a) {
        return thisObject.typeName(a) == "Array";
      };

    /**
     * Returns an indication of whether the argument is a Date or not
     */
    thisObject.isDate = function (d) {
      return d instanceof Date;
    };

    /**
     * Does a deep clone of the object.
     */
    thisObject.clone = function (obj) {
      if (!obj || typeof obj == "function" || thisObject.isDate(obj) || typeof obj !== "object") {
        return obj;
      }

      var retVal, i;

      if (thisObject.isArray(obj)) {
        retVal = [];
        for (i = 0; i < obj.length; ++i) {
          retVal.push(thisObject.clone(obj[i]));
        }
        return retVal;
      }

      retVal = {};
      for (i in obj) {
        // https://issues.apache.org/jira/browse/CB-11522 'unknown' type may be returned in
        // custom protocol activation case on Windows Phone 8.1 causing "No such interface supported" exception
        // on cloning.
        if ((!(i in retVal) || retVal[i] !== obj[i]) && typeof obj[i] !== "undefined" && typeof obj[i] !== "unknown") {
          // eslint-disable-line valid-typeof
          retVal[i] = thisObject.clone(obj[i]);
        }
      }
      return retVal;
    };

    /**
     * 将ArrayBuffer转变为16进制的String
     * @param {ArrayBuffer} array
     * @returns
     */
    thisObject.bin2String = function (array) {
      var result = "";
      for (var i = 0; i < array.length; i++) {
        result += String.fromCharCode(array[i]);
      }
      return result;
    };

    /**
     * 合并对象
     */
    (thisObject.merge = function (target) {
      var args = arguments;
      var result = {};
      if (args.length > 1) {
        for (var i = 0; i < args.length; i++) {
          var obj = args[i];
          if (typeof obj == "object") {
            for (var key in obj) {
              result[key] = obj[key];
            }
          }
        }
        return result;
      } else {
        return target;
      }
    }),
      /**
       * Returns a wrapped version of the function
       */
      (thisObject.close = function (context, func, params) {
        return function () {
          var args = params || arguments;
          return func.apply(context, args);
        };
      });

    // ------------------------------------------------------------------------------
    function UUIDcreatePart(length) {
      var uuidpart = "";
      for (var i = 0; i < length; i++) {
        var uuidchar = parseInt(Math.random() * 256, 10).toString(16);
        if (uuidchar.length == 1) {
          uuidchar = "0" + uuidchar;
        }
        uuidpart += uuidchar;
      }
      return uuidpart;
    }

    /**
     * Create a UUID
     */
    thisObject.createUUID = function () {
      return UUIDcreatePart(4) + "-" + UUIDcreatePart(2) + "-" + UUIDcreatePart(2) + "-" + UUIDcreatePart(2) + "-" + UUIDcreatePart(6);
    };

    thisObject.decodePoiData = function (poiData) {
      if (poiData) {
        var centerLon = poiData["centerlon"];
        var centerLat = poiData["centerlat"];
        var poiDatas = poiData["data"];
        for (var floorId in poiDatas) {
          poiDatas[floorId]["floorId"] = floorId;
          var pois = poiDatas[floorId]["poi"];
          for (var poiId in pois) {
            var poiObj = pois[poiId];
            poiObj["lon"] = poiObj["lon"] / 1000000 + centerLon;
            poiObj["lat"] = poiObj["lat"] / 1000000 + centerLat;
            poiObj["floorId"] = floorId;
            poiObj["id"] = poiId;
          }
        }
      }
      return poiData;
    };
    thisObject.distanceToText = function (distance) {
      var text = "";
      distance = Math.round(distance);
      if (distance == 0 || distance == "0") {
        return "";
      }
      if (distance > 1000) {
        distance *= 0.01;
        // text = (distance>10?distance.toFixed(1): ~~distance)+ (window["langData"]["kilometre"]||"公里");
        text = (~~distance * 0.1).toFixed(1) + (window["langData"]["kilometre"] || "公里");
      } else {
        text = distance + (window["langData"]["meter:distance"] || "米");
      }
      return text;
    };

    /**
     * Extends a child object from a parent object using classical inheritance
     * pattern.
     */
    thisObject.extend = (function () {
      // proxy used to establish prototype chain
      var F = function () {};
      // extend Child from Parent
      return function (Child, Parent) {
        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.__super__ = Parent.prototype;
        Child.prototype.constructor = Child;
      };
    })();
    thisObject.shallowCopyData = function (dstData, srcData) {
      for (var key in srcData) {
        dstData[key] = srcData[key];
      }
    };
    thisObject.deepCopyData = function (dstData, srcData) {
      for (var key in srcData) {
        var value = srcData[key];
        if (thisObject.isArray(value)) {
          dstData[key] = [];
          thisObject.deepCopyData(dstData[key], value);
        } else if (thisObject.isObject(value)) {
          dstData[key] = {};
          thisObject.deepCopyData(dstData[key], value);
        } else {
          dstData[key] = value;
        }
      }
    };
    thisObject.extendObj = function (target, params, forceOver) {
      for (var key in params) {
        if (!forceOver) {
          if (params[key] != undefined && target[key] == undefined) {
            target[key] = params[key];
          }
        } else {
          if (params[key] != undefined) {
            target[key] = params[key];
          }
        }
      }
    };

    thisObject.getMapConfig = function (configdata) {
      if (!configdata) {
        return;
      }

      return {
        getConfig: function () {
          return configdata;
        },
        get: function (key) {
          return configdata[key];
        },
      };
    };

    thisObject.parseLancherParam = function (url) {
      var theRequest = {};
      if (url.indexOf("?") != -1) {
        url = url.substr(1);
        url = url.split("#")[0];
      } else {
        url = url.substr(1);
      }
      var strs = url.split("&");
      for (var i = 0; i < strs.length; i++) {
        theRequest[strs[i].split("=")[0]] = strs[i].split("=")[1];
      }
      if (window["launcher"] && !thisObject.laucherParams) {
        thisObject.laucherParams = window["launcher"]["init"]() || {};
        for (var key in theRequest) {
          thisObject.laucherParams[key] = theRequest[key];
        }
        return thisObject.laucherParams;
      }
      return thisObject.laucherParams || theRequest;
    };

    thisObject.rgbToFloatRGBA = function (_rgb) {
      var ret = [0, 0, 0, 1];
      if (_rgb && _rgb instanceof Array) {
        var colorRadio = 1.0 / 255;
        for (var i = 0; i < _rgb.length; i++) {
          ret[i] = _rgb[i] * colorRadio;
        }
      }
      return ret;
    };

    thisObject.parseLonLatRect = function (str) {
      return str["split"](",").map(function (item) {
        return parseFloat(item);
      });
    };

    thisObject.jsonToUrl = function (url, data) {
      try {
        if (!data) {
          return url;
        }
        var tempArr = [];
        for (var i in data) {
          if (
            encodeURIComponent(data[i]) != "undefined" &&
            encodeURIComponent(data[i]) != null &&
            encodeURIComponent(data[i]) != "" &&
            encodeURIComponent(data[i])
          ) {
            var key = encodeURIComponent(i);
            var value = encodeURIComponent(data[i]);
            tempArr.push(key + "=" + value);
          }
        }
        var urlParamsStr = tempArr.join("&");
        if (url.indexOf("?") == -1) {
          url += "?";
        } else if (url.indexOf("?") != url.length - 1) {
          url += "&";
        }
        url += urlParamsStr;
        return url;
      } catch (err) {
        return "";
      }
    };

    thisObject.getGeodeticCircleRadians = function (lon1, lat1, lon2, lat2) {
      var a = Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2) + Math.sin(lat1) * Math.sin(lat2);
      return Math.abs(Math.acos(a));
    };

    var isType = function (type) {
      return function (obj) {
        return {}.toString.call(obj) == "[object " + type + "]";
      };
    };
    var isObject = isType("Object");
    var isString = isType("String");
    var isArray = Array.isArray || isType("Array");
    var isFunction = isType("Function");
    var isUndefined = isType("Undefined");

    thisObject.isObject = isObject;
    thisObject.isString = isString;
    thisObject.isArray = isArray;
    thisObject.isFunction = isFunction;
    thisObject.isUndefined = isUndefined;

    /**
     * 下载脚本
     * @param {String} url 路径
     * @param {Function} callback
     */
    thisObject.loadScript = function (url, callback, failedCB) {
      var script = document.createElement("script");
      script.type = "text/javascript";
      if (script.readyState) {
        //IE
        script.onreadystatechange = function () {
          if (script.readyState == "loaded" || script.readyState == "complete") {
            script.onreadystatechange = null;
            callback();
          }
        };
      } else {
        //Others: Firefox, Safari, Chrome, and Opera
        script.onload = function () {
          callback();
        };
        script.onerror = function (e) {
          // alert("source path failed: "+url);
          console.log("source failed: " + url, e.toString());
        };
      }
      script.src = url;
      document.body.appendChild(script);
    };

    /**
     * 下载css
     * @param {String} url 路径
     */
    thisObject.loadCss = function (url) {
      var _mlink = document.createElement("link");
      _mlink.setAttribute("type", "text/css");
      _mlink.setAttribute("rel", "stylesheet");
      _mlink.setAttribute("href", url);
      document.getElementsByTagName("head")[0].appendChild(_mlink);
    };

    /**
     * 递归下载js和css
     * @param {String} url 路径
     */
    thisObject.loadScriptRecursive = function (fileList, i, cb, failedCB) {
      if (i >= fileList.length) {
        cb && cb();
        return;
      }
      if (cssRegExp.test(fileList[i])) {
        thisObject.loadCss(fileList[i]);
        thisObject.loadScriptRecursive(fileList, i + 1, cb, failedCB);
      } else {
        thisObject.loadScript(
          fileList[i],
          function () {
            thisObject.loadScriptRecursive(fileList, i + 1, cb, failedCB);
          },
          failedCB
        );
      }
    };

    /**
     * 递归下载资源(Js和css)
     * @param {String} url 路径
     */
    (thisObject.loadResources = function (fileList, cb, failedCB) {
      thisObject.loadScriptRecursive(fileList, 0, cb, failedCB);
    }),
      /**
       * 通过POST下载数据
       * @param {*} url 路径
       * @param {*} data
       * @param {*} onDataRecive
       * @param {*} error
       * @param {*} beforeSend
       * @param {*} complete
       * @returns
       */
      (thisObject.getDataByPostRaw = function (url, data, onDataRecive, error, beforeSend, complete) {
        var request = thisObject.getHttpObject();
        if (request) {
          try {
            request.onreadystatechange = function () {
              var request = this;
              if (request.readyState == 4) {
                // success
                if (request.status == 200 || request.status == 304) {
                  onDataRecive && onDataRecive(request.response);
                }
              }
            }; // event handler for mesh loading
            request.onerror = function (e) {
              error && error(e);
            };
            // request.dataObject = dataObject;
            request.open("POST", url, true);
            request.setRequestHeader("Content-Type", "application/json");
            // request.responseType = "arraybuffer";
            request.responseType = "json";
            request.timeout = 15000;
            request.ontimeout = function (e) {
              console.log("timeout ", e);
              error && error(e);
            };
            request.send(JSON.stringify(data));
            // request.url = url;
          } catch (error) {
            console.log(error);
            request.xmlhttp = null;
          }
          return request;
        }
      });

    /**
     * 通过POST上传数据
     * @param {*} url
     * @param {*} data
     * @param {*} onDataRecive
     * @param {*} error
     * @param {*} beforeSend
     * @param {*} complete
     * @returns
     */
    thisObject.postDataXHR = function (url, data, onDataRecive, error, beforeSend, complete) {
      var request = thisObject.getHttpObject();
      if (request) {
        try {
          request.onreadystatechange = function () {
            var request = this;
            if (request.readyState == 4) {
              // success
              if (request.status == 200 || request.status == 304) {
                onDataRecive && onDataRecive(request.response);
              }
            }
          }; // event handler for mesh loading
          request.onerror = function (e) {
            error && error(e);
          };
          // request.dataObject = dataObject;
          request.open("POST", url, true);
          request.timeout = 15000;
          request.ontimeout = function (e) {
            console.log("timeout ", e);
            error && error(e);
          };
          var formData = new FormData();
          for (var key in data) {
            if (data.hasOwnProperty(key)) {
              formData.append(key, data[key]);
            }
          }
          request.send(formData);
        } catch (error) {
          console.log(error);
          request.xmlhttp = null;
        }
        return request;
      }
    };

    /**
     * 安全下载
     * @param {*} url
     * @param {*} method
     * @param {*} data
     * @param {*} successCB
     * @param {*} errorCB
     * @param {*} func
     */
    thisObject.getDataBySecurityRequest = function (url, method, data, successCB, errorCB, func) {
      if (func == "rawPost") {
        return thisObject.getDataByPostRaw(url, data, successCB, null, null, errorCB, func);
      } else if (func == "jsonp") {
        return thisObject.getDataJsonP(url, data, successCB, null, null, errorCB, func);
      } else if (func == "json") {
        return thisObject.getData(url, data, "json", successCB, errorCB);
      } else {
        if (!method || method.toLowerCase() == "get") {
          if (url.indexOf("?") == -1) {
            url += "?";
          }
          var fullUrl = thisObject.jsonToUrl(url, data);
          return thisObject.getDataTextViaBlob(fullUrl, successCB, errorCB);
        } else {
          return thisObject.getDataByPostRaw(url, data, successCB, null, null, errorCB, func);
        }
      }
    };

    /**
     * ArrayBuffer转变为String
     * @param {*} buffer
     * @param {*} encoding
     * @param {*} callback
     */
    thisObject.arraybufferToString = function (buffer, encoding, callback) {
      var blob = new Blob([buffer], { type: "text/plain" });
      var reader = new FileReader();
      reader.onload = function (evt) {
        callback(evt.target.result);
      };
      reader.readAsText(blob, encoding);
    };

    /**
     * 通过Blob方式下载文本
     * @param {String} url 数据的路径
     * @param {Function} scb 调用成功后的回调
     * @param {Function} fcb 调用失败后的回调
     */
    thisObject.getDataTextViaBlob = function (url, scb, fcb) {
      thisObject.loadByteStream(
        url,
        function (arrbuf) {
          thisObject.arraybufferToString(arrbuf, "UTF-8", function (str) {
            scb && scb(str);
          });
        },
        fcb
      );
    };

    /**
     * 通过Blob方式下载JSON
     * @param {String} url 数据的路径
     * @param {Function} scb 调用成功后的回调
     * @param {Function} fcb 调用失败后的回调
     */
    thisObject.getDataJsonViaBlob = function (url, scb, fcb) {
      thisObject.loadByteStream(
        url,
        function (arrbuf) {
          thisObject.arraybufferToString(arrbuf, "UTF-8", function (str) {
            var json = JSON.parse(str);
            scb && scb(json);
          });
        },
        fcb
      );
    };

    /**
     * 下载一个ArrayBuffer
     * @param {String} url 数据的路径
     * @param {Function} scb 调用成功后的回调
     * @param {Function} fcb 调用失败后的回调
     */
    thisObject.loadByteStream = function (url, scb, fcb) {
      if (window.XMLHttpRequest) {
        try {
          var request = new XMLHttpRequest();
          request.timeout = 15000;
          request.onreadystatechange = function () {
            var request = this;
            if (request.readyState == 4) {
              // success
              if (request.status !== 0 && request.status !== 200 && request.status !== 304) {
              } else {
                var byteStream = null;
                if (request.responseType == "arraybuffer" && request.response) {
                  byteStream = request.response;
                  scb && scb(byteStream);
                  return;
                } else {
                  if (request.mozResponseArrayBuffer) {
                    byteStream = request.mozResponseArrayBuffer;
                    scb && scb(bytStream);
                    return;
                  }
                }
                fcb && fcb();
              }
            }
          }; // event handler for mesh loading
          request.onerror = function (err) {
            console.log("error", err);
          };
          request.open("GET", url, true);
          request.responseType = "arraybuffer";
          // request.setRequestHeader('Access-Control-Allow-Headers', '*');
          // httpReq.setRequestHeader('Content-type', 'application/ecmascript');
          // request.setRequestHeader('Access-Control-Allow-Origin', '*');
          request.url = url;
          request.send();
        } catch (error) {
          console.log(error);
          request.xmlhttp = null;
        }
        return true;
      }
      return false;
    };

    /**
     * 创建一个HttpObject
     * @returns HttpObject
     */
    thisObject.getHttpObject = function () {
      var xhr = false;
      if (window.XMLHttpRequest) xhr = new XMLHttpRequest();
      if ("withCredentials" in xhr) {
        return xhr;
      } else if (typeof XDomainRequest != "undefined") {
        xhr = new XDomainRequest();
        return xhr;
      } else if (window.ActiveXObject) {
        xhr = new ActiveXObject("Microsoft.XMLHttp");
      }
      return xhr;
    };

    /**
     * 通过Get方法下载数据（通过XmlHttpRequest）
     * @param {String} url 数据路径
     * @param {Object} data 请求的数据
     * @param {String} dataType 数据类型（xml, json, arraybuffer)
     * @param {Function} scb 调用成功后的回调
     * @param {Function} fcb 调用失败后的回调
     * @param {Boolean} isAsync 是否异步
     * @returns
     */
    thisObject.getData = function (url, data, dataType, successCB, failedCB, isAsync) {
      var xhr = thisObject.getHttpObject();
      xhr.ontimeout = function () {
        failedCB && failedCB({ errMsg: "TimeOut" });
      };
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          if (xhr.status == 200 || xhr.status == 304) {
            var type = xhr.getResponseHeader("Content-Type");
            if (type.indexOf("xml") != -1 && xhr.responseXML) {
              successCB && successCB(xhr.responseXML);
            } else if (type.indexOf("application/json") != -1) {
              try {
                successCB && successCB(JSON.parse(xhr.responseText));
              } catch (e) {
                console.log(e);
                failedCB && failedCB(e.toString());
              }
            } else {
              var resultData = xhr.responseText;
              if (dataType == "json") {
                resultData = JSON.parse(resultData);
              }
              successCB && successCB(resultData);
            }
          } else {
            failedCB && failedCB(xhr.responseText);
          }
        }
      };
      url = thisObject.jsonToUrl(url, data);
      isAsync == undefined || isAsync == true ? (isAsync = true) : (isAsync = false);
      xhr.open("GET", url, isAsync);
      xhr.send(null);
      return xhr;
    };

    // /**
    //  * 下载离线数据包
    //  * @param {String} token 用户的token
    //  * @param {String} bdid 用户的bdid
    //  * @param {Function} scb 调用成功后的回调
    //  * @param {Function} fcb 调用失败后的回调
    //  */
    // thisObject.downloadPackage = function(token,bdid,successCB,failedCB){
    //     var jsonStr = JSON.stringify({"token":token||'',"bdid":bdid||''});
    //     if(window["exec"]){
    //         window["exec"](successCB, failedCB, "DXJSBre", "downloadPackage", [jsonStr]);
    //     }
    // };

    /**
     * 深拷贝数据
     * @param {Object} data
     * @returns
     */
    thisObject["copyData"] = thisObject.copyData = function (data) {
      var str = JSON.stringify(data);
      return JSON.parse(str);
    };

    /**
     * 比较两个对象是否相同
     * @param {Object} objA
     * @param {Object} objB
     * @returns
     */
    thisObject.compareObj = function (objA, objB) {
      var strA = JSON.stringify(objA);
      var strB = JSON.stringify(objB);
      if (strA == strB) {
        return true;
      } else {
        return false;
      }
    };

    /**
     * 返回当前容器的类型
     * @returns 返回容器类型（android:安卓，ios:苹果，wechat:微信，alipay:支付宝，web:浏览器）
     */
    thisObject.getContainerType = function () {
      if (window["cordova"] && window["cordova"]["exec"]) {
        return native;
      } else if (/MicroMessenger/.test(window.navigator.userAgent)) {
        return "wechat";
      } else if (/AlipayClient/.test(window.navigator.userAgent)) {
        return "alipay";
      } else {
        return "web";
      }
    };

    /**
     * 添加一个Dom对象
     * @param {*} containerId
     * @param {*} newClassName
     */
    thisObject.addDomClass = function (containerId, newClassName) {
      var containerdDom = document.getElementById(containerId);
      var className = containerdDom.className;
      var classNameArr = className.split(" ");
      if (classNameArr.indexOf(newClassName) == -1) {
        className && (className += " ");
        className += newClassName; //main_map_container
      }
      containerdDom.setAttribute("class", className);
    };

    /**
     * 创建一个Dom对象
     * @param {*} params
     * @param {*} parentNode
     * @returns
     */
    thisObject.createDom = function (params, parentNode) {
      var tagName = params["tagName"];
      var attrs = params["attrs"];
      var children = params["children"];
      var text = params["text"];
      var dom = document.createElement(tagName);
      var events = params["events"];
      for (var key in attrs) {
        dom.setAttribute(key, attrs[key]);
      }
      if (text) {
        var textNode = document.createTextNode(text);
        dom.appendChild(textNode);
      }
      if (children) {
        children.forEach(function (childParams) {
          thisObject.createDom(childParams, dom);
        });
      }
      if (parentNode) {
        parentNode.appendChild(dom);
      }
      if (events) {
        events.forEach(function (item) {
          // if (item["eventName"] == "touchend") {
          dom.addEventListener(item["eventName"], item["callback"]);
          // } else {
          //     dom.addEventListener("click", item["callback"], false);
          // }
        });
      }
      return dom;
    };

    /**
     * 连接两个路径
     * @param {String} path1 路径1
     * @param {String} path2 路径2
     * @returns 返回连接后的路径
     */
    thisObject.joinPath = function (path1, path2) {
      var args = arguments;
      var url = "";
      args.length > 0 ? (url = args[0] || "") : "";
      for (var i = 1; i < args.length; i++) {
        var _path = args[i];
        if (url.slice(-1) != "/") {
          url += "/";
        }
        _path = _path.replace("./", "");
        if (_path[0] == "/") {
          _path = _path.slice(1);
        }
        url += _path;
      }
      return url;
    };

    function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    /**
     * 返回一个32个字符传长度的uuid
     * @returns uuid
     */
    thisObject.createUUID = function () {
      return S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4();
    };

    // navi_utils
    var navi_utils = {};
    var navi_map = navi_map || {};
    var earthRadius = 6378137.0;
    navi_utils.earth_radius = earthRadius;
    var DEGREE_TO_RADIAN = 0.0174532925199433;
    var SECOND_TO_RADIAN = DEGREE_TO_RADIAN / 3600;
    var RADIAN_TO_DEGREE = 180 / Math.PI;
    // module.exports = navi_utils;

    navi_utils.DEGREE_TO_RADIAN = DEGREE_TO_RADIAN;
    navi_utils.RADIAN_TO_DEGREE = RADIAN_TO_DEGREE;
    navi_utils.SECOND_TO_RADIANS = SECOND_TO_RADIAN;
    navi_utils.getVector = function (geometry, index) {
      var result = [];
      result.x = geometry[index]["x"];
      result.y = geometry[index]["y"];
      result.speed = geometry[index]["speed"] || 1;
      result.segment_length = geometry[index].segment_length;
      return result;
      // return { x: geometry[index]['x'], y: geometry[index]['y'], segment_length: geometry[index].segment_length };
    };
    navi_utils.getVectorMectro = function (geometry, index) {
      return { x: geometry[index]["x"], y: geometry[index]["y"], segment_length: geometry[index].segment_length };
    };

    navi_utils.getVector2 = function (geometry, index) {
      return { x: geometry[index][0], y: geometry[index][1], segment_length: geometry[index].segment_length };
    };

    navi_utils.getVector3 = function (geometry, index) {
      var aa = [geometry[index][0], geometry[index][1], 0];
      return aa;
    };
    var halfcircumference = 20037508.34;
    navi_utils.transformLonToMectroX = function (longtitude) {
      return (longtitude / 180) * halfcircumference;
    };
    navi_utils.transformLatToMectroY = function (latitude) {
      return (Math.log(Math.tan(Math.PI * 0.25 + latitude * 0.5 * DEGREE_TO_RADIAN)) * halfcircumference) / Math.PI;
    };
    navi_utils.transformMectroXToLon = function (x) {
      return (x / halfcircumference) * 180;
    };
    navi_utils.transformMectroYToLat = function (y) {
      y = (y / halfcircumference) * Math.PI;
      return RADIAN_TO_DEGREE * (2 * Math.atan(Math.exp(y)) - Math.PI / 2);
    };

    navi_utils.transformGeographicToECEF = function (vecOut, vecIn) {
      var longitude = vecIn[0],
        latitude = vecIn[1],
        radius = vecIn[2];
      var cos_lat = radius * Math.cos(latitude);
      vecOut[0] = cos_lat * Math.cos(longitude);
      vecOut[1] = cos_lat * Math.sin(longitude);
      vecOut[2] = radius * Math.sin(latitude);
    };

    navi_utils.transformECEFToGeographic = function (vecOut, vecIn) {
      var x = vecIn[0],
        y = vecIn[1],
        z = vecIn[2];
      var ret_z = Math.sqrt(x * x + y * y + z * z);
      vecOut[0] = Math.atan2(y, x);
      vecOut[1] = Math.asin(z / ret_z);
      vecOut[2] = ret_z;
    };
    navi_utils.lonLatToMectro = function (lonlat) {
      var lon = lonlat.lon || lonlat.x || lonlat[0];
      var lat = lonlat.lat || lonlat.y || lonlat[1];
      var x = navi_utils.transformLonToMectroX(lon);
      var y = navi_utils.transformLatToMectroY(lat);
      return { x: x, y: y };
    };
    navi_utils.mectroTolLonLat = function (mectroXY) {
      var lon = navi_utils.transformMectroXToLon(mectroXY["x"]);
      var lat = navi_utils.transformMectroYToLat(mectroXY["y"]);
      return { lon: lon, lat: lat };
    };

    navi_utils.getArrowBodyPoints = function (points, neckLeft, neckRight, tailWidthFactor) {
      var allLen = PlotUtils.wholeDistance(points);
      var len = PlotUtils.getBaseLength(points);
      var tailWidth = len * tailWidthFactor;
      var neckWidth = PlotUtils.distance(neckLeft, neckRight);
      var widthDif = (tailWidth - neckWidth) / 2;
      var tempLen = 0,
        leftBodyPnts = [],
        rightBodyPnts = [];
      for (var i = 1; i < points.length - 1; i++) {
        var angle = PlotUtils.getAngleOfThreePoints(points[i - 1], points[i], points[i + 1]) / 2;
        tempLen += PlotUtils.distance(points[i - 1], points[i]);
        var w = (tailWidth / 2 - (tempLen / allLen) * widthDif) / Math.sin(angle);
        var left = PlotUtils.getThirdPoint(points[i - 1], points[i], Math.PI - angle, w, true);
        var right = PlotUtils.getThirdPoint(points[i - 1], points[i], angle, w, false);
        leftBodyPnts.push(left);
        rightBodyPnts.push(right);
      }
      return leftBodyPnts.concat(rightBodyPnts);
    };
    navi_utils.getArrowHeadPoints = function (
      points,
      tailLeft,
      tailRight,
      headWidthFactor,
      headHeightFactor,
      headTailFactor,
      neckWidthFactor,
      neckHeightFactor
    ) {
      headWidthFactor = headWidthFactor || 0.25;
      headHeightFactor = headHeightFactor || 0.18;
      headTailFactor = headTailFactor || 0.15;
      neckWidthFactor = neckWidthFactor || 0.2;
      neckHeightFactor = neckHeightFactor || 0.85;

      var len = PlotUtils.getBaseLength(points);
      var headHeight = len * headHeightFactor;
      var headPnt = points[points.length - 1];
      len = PlotUtils.distance(headPnt, points[points.length - 2]);
      var tailWidth = PlotUtils.distance(tailLeft, tailRight);
      if (headHeight > tailWidth * headTailFactor) {
        headHeight = tailWidth * headTailFactor;
      }
      var headWidth = 1; //headHeight * headWidthFactor;
      var neckWidth = 0.5; //headHeight * neckWidthFactor;
      headHeight = 1; //headHeight > len ? len : headHeight;
      var neckHeight = headHeight * neckHeightFactor;
      var headEndPnt = PlotUtils.getThirdPoint(points[points.length - 2], headPnt, 0.317, headHeight, true);
      var neckEndPnt = PlotUtils.getThirdPoint(points[points.length - 2], headPnt, 0.317, neckHeight, true);
      var headLeft = PlotUtils.getThirdPoint(headPnt, headEndPnt, P.Constants.HALF_PI, headWidth, false);
      var headRight = PlotUtils.getThirdPoint(headPnt, headEndPnt, P.Constants.HALF_PI, headWidth, true);
      var neckLeft = PlotUtils.getThirdPoint(headPnt, neckEndPnt, P.Constants.HALF_PI, neckWidth, false);
      var neckRight = PlotUtils.getThirdPoint(headPnt, neckEndPnt, P.Constants.HALF_PI, neckWidth, true);
      return [neckLeft, headLeft, headPnt, headRight, neckRight];
    };
    navi_utils.generate = function (points) {
      var poinstLen = points.length;
      if (poinstLen < 2) {
        return;
      }
      if (poinstLen == 2) {
        return points;
      }
      var pnts = points;
      // 计算箭尾
      var tailLeft = pnts[0];
      var tailRight = pnts[1];
      if (PlotUtils.isClockWise(pnts[0], pnts[1], pnts[2])) {
        tailLeft = pnts[1];
        tailRight = pnts[0];
      }
      var midTail = PlotUtils.mid(tailLeft, tailRight);
      var bonePnts = [midTail].concat(pnts.slice(2));
      // 计算箭头
      var headPnts = navi_utils.getArrowHeadPoints(bonePnts, tailLeft, tailRight);
      var neckLeft = headPnts[0];
      var neckRight = headPnts[4];
      var tailWidthFactor = PlotUtils.distance(tailLeft, tailRight) / PlotUtils.getBaseLength(bonePnts);
      // 计算箭身
      var bodyPnts = navi_utils.getArrowBodyPoints(bonePnts, neckLeft, neckRight, tailWidthFactor);
      // 整合
      var count = bodyPnts.length;
      var leftPnts = [tailLeft].concat(bodyPnts.slice(0, count / 2));
      leftPnts.push(neckLeft);
      var rightPnts = [tailRight].concat(bodyPnts.slice(count / 2, count));
      rightPnts.push(neckRight);

      // leftPnts = PlotUtils.getQBSplinePoints(leftPnts);
      // rightPnts = PlotUtils.getQBSplinePoints(rightPnts);

      return [leftPnts.concat(headPnts, rightPnts.reverse())];
    };

    navi_utils.makeMatrix = function () {
      return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    };

    navi_utils.matrixECEFToENU = function (matOut, vecIn) {
      var vec_x = [0, 0, 0],
        vec_y = [0, 0, 0],
        vec_z = navi_utils.Vector3_copy(vecIn);
      var s_unit_z = [0, 0, 1];
      navi_utils.Vector3_normalize(vec_z, vec_z);

      navi_utils.Vector3_cross(vec_x, s_unit_z, vec_z);
      navi_utils.Vector3_normalize(vec_x, vec_x);

      navi_utils.Vector3_cross(vec_y, vec_z, vec_x);
      navi_utils.Vector3_normalize(vec_y, vec_y);

      navi_utils.Matrix_fromTNBP(matOut, vec_x, vec_y, vec_z, vecIn);
      navi_utils.Matrix_inverse(matOut, matOut);
    };

    navi_utils.matrixENUToECEF = function (matOut, vecIn) {
      var vec_x = [0, 0, 0],
        vec_y = [0, 0, 0],
        vec_z = navi_utils.Vector3_copy(vecIn);
      var s_unit_z = [0, 0, 1];
      navi_utils.Vector3_normalize(vec_z, vec_z);

      navi_utils.Vector3_cross(vec_x, s_unit_z, vec_z);
      navi_utils.Vector3_normalize(vec_x, vec_x);

      navi_utils.Vector3_cross(vec_y, vec_z, vec_x);
      navi_utils.Vector3_normalize(vec_y, vec_y);

      navi_utils.Matrix_fromTNBP(matOut, vec_x, vec_y, vec_z, vecIn);
    };

    navi_utils.Matrix_fromTNBP = function (retVal, xAxis, yAxis, zAxis, vecP) {
      (retVal[0] = xAxis[0]), (retVal[1] = xAxis[1]), (retVal[2] = xAxis[2]), (retVal[3] = 0);
      (retVal[4] = yAxis[0]), (retVal[5] = yAxis[1]), (retVal[6] = yAxis[2]), (retVal[7] = 0);
      (retVal[8] = zAxis[0]), (retVal[9] = zAxis[1]), (retVal[10] = zAxis[2]), (retVal[11] = 0);
      (retVal[12] = vecP[0]), (retVal[13] = vecP[1]), (retVal[14] = vecP[2]), (retVal[15] = 1);

      return retVal;
    };

    navi_utils.Matrix_inverse = function (result, matrix) {
      var matrix0 = matrix[0];
      var matrix1 = matrix[1];
      var matrix2 = matrix[2];
      var matrix4 = matrix[4];
      var matrix5 = matrix[5];
      var matrix6 = matrix[6];
      var matrix8 = matrix[8];
      var matrix9 = matrix[9];
      var matrix10 = matrix[10];

      var vX = matrix[12];
      var vY = matrix[13];
      var vZ = matrix[14];

      var x = -matrix0 * vX - matrix1 * vY - matrix2 * vZ;
      var y = -matrix4 * vX - matrix5 * vY - matrix6 * vZ;
      var z = -matrix8 * vX - matrix9 * vY - matrix10 * vZ;

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

    navi_utils.Matrix4_perspectiveRH = function (retVal, fovy, aspect, zn, zf) {
      var tan_fovy = 1 / Math.tan(fovy * 0.5);
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

    navi_utils.getGeodeticCircleRadians = function (lon1, lat1, lon2, lat2) {
      var a = Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2) + Math.sin(lat1) * Math.sin(lat2);
      return Math.abs(Math.acos(a));
    };

    navi_utils.getSegmentDistance = function (geometry) {
      for (var i = 0; i < geometry.length - 1; i++) {
        var A = geometry[i];
        var B = geometry[i + 1];
        //navi_utils.getGeodeticCircleDistance()
      }
    };

    navi_utils.AABB_create = function () {
      var newObject = {
        _min: [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE],
        _max: [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE],
      };
      return newObject;
    };

    navi_utils.AABB_makeInvalid = function (extOut) {
      extOut._min[0] = Number.MAX_VALUE;
      extOut._min[1] = Number.MAX_VALUE;
      extOut._min[2] = Number.MAX_VALUE;

      extOut._max[0] = -Number.MAX_VALUE;
      extOut._max[1] = -Number.MAX_VALUE;
      extOut._max[2] = -Number.MAX_VALUE;
      return extOut;
    };

    navi_utils.AABB_mergePoint = function (extOut, ext1, vec) {
      extOut._max[0] = Math.max(ext1._max[0], vec[0]);
      extOut._min[0] = Math.min(ext1._min[0], vec[0]);
      extOut._max[1] = Math.max(ext1._max[1], vec[1]);
      extOut._min[1] = Math.min(ext1._min[1], vec[1]);
      extOut._max[2] = Math.max(ext1._max[2], vec[2]);
      extOut._min[2] = Math.min(ext1._min[2], vec[2]);
    };
    navi_utils.AABB_isValid = function (aabb) {
      return aabb._max[0] >= aabb._min[0] && aabb._max[1] >= aabb._min[1] && aabb._max[2] >= aabb._min[2] && aabb._max[0] >= 0;
    };

    navi_utils.Vector3_copy = function (vec) {
      var newObject = [0, 0, 0];
      newObject[0] = vec[0];
      newObject[1] = vec[1];
      newObject[2] = vec[2];
      return newObject;
    };

    navi_utils.Vector3_add = function (retVal, vec1, vec2) {
      retVal[0] = vec1[0] + vec2[0];
      retVal[1] = vec1[1] + vec2[1];
      retVal[2] = vec1[2] + vec2[2];
      return retVal;
    };
    navi_utils.Vector3_sub = function (retVal, vec1, vec2) {
      retVal[0] = vec1[0] - vec2[0];
      retVal[1] = vec1[1] - vec2[1];
      retVal[2] = vec1[2] - vec2[2];
      return retVal;
    };

    navi_utils.Vector3_scale = function (retVal, vec1, scale) {
      retVal[0] = vec1[0] * scale;
      retVal[1] = vec1[1] * scale;
      retVal[2] = vec1[2] * scale;

      return retVal;
    };

    navi_utils.Vector3_normalize = function (retVal, vec) {
      var length = navi_utils.Vector3_length(vec);
      //if ( length > 0.000001 )
      if (length > 0.0) {
        var r = 1 / length;
        retVal[0] = vec[0] * r;
        retVal[1] = vec[1] * r;
        retVal[2] = vec[2] * r;
      }
      return retVal;
    };

    navi_utils.Vector3_length = function (vec) {
      return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
    };

    var vector_sub_temp = [0, 0, 0];
    navi_utils.Vector3_distance = function (vec1, vec2) {
      navi_utils.Vector3_sub(vector_sub_temp, vec1, vec2);
      return Math.sqrt(vector_sub_temp[0] * vector_sub_temp[0] + vector_sub_temp[1] * vector_sub_temp[1] + vector_sub_temp[2] * vector_sub_temp[2]);
    };

    navi_utils.Vector3_dot = function (vec1, vec2) {
      return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];
    };

    navi_utils.Vector3_cross = function (retVal, left, right) {
      /* retVal[0] = vec1[1] * vec2[2] - vec1[2] * vec2[1];
            retVal[1] = vec1[2] * vec2[0] - vec1[0] * vec2[2];
            retVal[2] = vec1[0] * vec2[1] - vec1[1] * vec2[0];  */
      var leftX = left[0];
      var leftY = left[1];
      var leftZ = left[2];
      var rightX = right[0];
      var rightY = right[1];
      var rightZ = right[2];

      var x = leftY * rightZ - leftZ * rightY;
      var y = leftZ * rightX - leftX * rightZ;
      var z = leftX * rightY - leftY * rightX;

      retVal[0] = x;
      retVal[1] = y;
      retVal[2] = z;

      return retVal;
    };

    navi_utils.Vector3_transformCoord = function (retVal, vec, mat) {
      var vX = vec[0];
      var vY = vec[1];
      var vZ = vec[2];
      var vW = 1.0;

      var x = mat[0] * vX + mat[4] * vY + mat[8] * vZ + mat[12] * vW;
      var y = mat[1] * vX + mat[5] * vY + mat[9] * vZ + mat[13] * vW;
      var z = mat[2] * vX + mat[6] * vY + mat[10] * vZ + mat[14] * vW;
      // var w = matrix[3] * vX + matrix[7] * vY + matrix[11] * vZ + matrix[15] * vW;

      retVal[0] = x;
      retVal[1] = y;
      retVal[2] = z;
      // result.w = w;
      return retVal;
    };

    navi_utils.Vector3_transformNormal = function (retVal, vec, mat) {
      var x = vec[0],
        y = vec[1],
        z = vec[2];
      retVal[0] = x * mat[0] + y * mat[4] + z * mat[8];
      retVal[1] = x * mat[1] + y * mat[5] + z * mat[9];
      retVal[2] = x * mat[2] + y * mat[6] + z * mat[10];
    };

    var temp_lerp_dir = [0, 0, 0];
    navi_utils.Vector3_lerp = function (retVal, vec1, vec2, t) {
      navi_utils.Vector3_sub(temp_lerp_dir, vec2, vec1);
      //var length = navi_utils.Vector3_length(temp_lerp_dir);
      navi_utils.Vector3_mad(retVal, vec1, temp_lerp_dir, t);
    };

    navi_utils.Vector3_mad = function (retVal, vec1, vec2, t) {
      retVal[0] = vec1[0] + vec2[0] * t;
      retVal[1] = vec1[1] + vec2[1] * t;
      retVal[2] = vec1[2] + vec2[2] * t;
    };

    navi_utils.Quaternion_length = function (q1) {
      return Math.sqrt(q1[0] * q1[0] + q1[1] * q1[1] + q1[2] * q1[2] + q1[3] * q1[3]);
    };

    navi_utils.Quaternion_normalize = function (retVal, q1) {
      var length = navi_utils.Quaternion_length(q1);
      if (length > 0.000000000001) {
        var t = 1.0 / length;
        retVal[0] *= t;
        retVal[1] *= t;
        retVal[2] *= t;
        retVal[3] *= t;
      } else {
        retVal[0] = 0.0;
        retVal[1] = 0.0;
        retVal[2] = 0.0;
        retVal[3] = 0.0;
      }
    };

    //  var rkT = Quaternion.create();
    navi_utils.Quaternion_slerp = function (retVal, q1, q2, t) {
      /* var x1 = q1[0], y1 = q1[1], z1 = q1[2], w1 = q1[3];
            var x2 = q2[0], y2 = q2[1], z2 = q2[2], w2 = q2[3];

            var cos_omega = x1 * x2 + y1 * y2 + z1 * z2 + w1 * w2;
            var angle = Math.acos( cos_omega );

            if( Math.abs( angle ) >= 0.000000000001 )
            {
            var sin_angle = Math.sin(angle);
            var sin_angle_inv = 1.0 / sin_angle;
            var coeff0 = Math.sin( (1.0 - t ) * angle ) * sin_angle_inv;
            var coeff1 = Math.sin( t * angle ) * sin_angle_inv;

            retVal[3] = w1 * coeff0 + w2 * coeff1;
            retVal[0] = x1 * coeff0 + x2 * coeff1;
            retVal[1] = y1 * coeff0 + y2 * coeff1;
            retVal[2] = z1 * coeff0 + z2 * coeff1;
            }
            else
            {
            retVal = q1;
            } */

      var x1 = q1[0],
        y1 = q1[1],
        z1 = q1[2],
        w1 = q1[3];
      var x2 = q2[0],
        y2 = q2[1],
        z2 = q2[2],
        w2 = q2[3];

      var fCos = x1 * x2 + y1 * y2 + z1 * z2 + w1 * w2;

      var x3, y3, z3, w3;
      // Do we need to invert rotation?
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

      if (Math.abs(fCos) < 1 - 1e-3) {
        // Standard case (slerp)
        var fSin = Math.sqrt(1 - fCos * fCos);
        var fAngle = Math.atan2(fSin, fCos);
        var fInvSin = 1.0 / fSin;
        var fCoeff0 = Math.sin((1.0 - t) * fAngle) * fInvSin;
        var fCoeff1 = Math.sin(t * fAngle) * fInvSin;
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

    //navi_utils.Quaternion_slerp()
    navi_utils.Quaternion_fromEuler = function (retVal, x, y, z) {
      var c1 = Math.cos(y * 0.5);
      var c2 = Math.cos(z * 0.5);
      var c3 = Math.cos(x * 0.5);
      var s1 = Math.sin(y * 0.5);
      var s2 = Math.sin(z * 0.5);
      var s3 = Math.sin(x * 0.5);
      retVal[3] = c1 * c2 * c3 - s1 * s2 * s3;
      retVal[0] = s1 * s2 * c3 + c1 * c2 * s3;
      retVal[1] = s1 * c2 * c3 + c1 * s2 * s3;
      retVal[2] = c1 * s2 * c3 - s1 * c2 * s3;
    };

    navi_utils.Quaternion_toEuler = function (retVal, q1) {
      var qx = q1[0],
        qy = q1[1],
        qz = q1[2],
        qw = q1[3];
      var qw2 = qw * qw;
      var qx2 = qx * qx;
      var qy2 = qy * qy;
      var qz2 = qz * qz;
      var test = qx * qy + qz * qw;
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
      retVal[2] = Math.asin(2.0 * qx * qy + 2.0 * qz * qw);
    };
    navi_utils.getGeodeticCircleDistance = function (vec1, vec2) {
      var dis =
        navi_utils.getGeodeticCircleRadians(vec1.x * DEGREE_TO_RADIAN, vec1.y * DEGREE_TO_RADIAN, vec2.x * DEGREE_TO_RADIAN, vec2.y * DEGREE_TO_RADIAN) *
        earthRadius;
      if (isNaN(dis)) {
        dis = 0;
      }
      return dis;
    };

    navi_utils.getGeodeticCircleDistanceSecond = function (vec1, vec2) {
      var dis =
        navi_utils.getGeodeticCircleRadians(vec1.x * SECOND_TO_RADIAN, vec1.y * SECOND_TO_RADIAN, vec2.x * SECOND_TO_RADIAN, vec2.y * SECOND_TO_RADIAN) *
        earthRadius;
      if (isNaN(dis)) {
        dis = 0;
      }
      return dis;
    };

    navi_utils.getGeodeticCircleDistanceVector = function (vec1, vec2) {
      var dis =
        navi_utils.getGeodeticCircleRadians(vec1[0] * DEGREE_TO_RADIAN, vec1[1] * DEGREE_TO_RADIAN, vec2[0] * DEGREE_TO_RADIAN, vec2[1] * DEGREE_TO_RADIAN) *
        earthRadius;
      if (isNaN(dis)) {
        dis = 0;
      }
      return dis;
    };

    navi_utils.getGeodeticCircleDistanceVectorSecond = function (vec1, vec2) {
      var dis =
        navi_utils.getGeodeticCircleRadians(vec1[0] * SECOND_TO_RADIAN, vec1[1] * SECOND_TO_RADIAN, vec2[0] * SECOND_TO_RADIAN, vec2[1] * SECOND_TO_RADIAN) *
        earthRadius;
      if (isNaN(dis)) {
        dis = 0;
      }
      return dis;
    };

    navi_utils.forEach = function (obj, callBack) {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          //filter,只输出私有属性
          callBack(key, obj[key]);
        }
      }
    };

    navi_utils.foreach = function (obj, callBack) {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          //filter,只输出私有属性
          if (callBack(key, obj[key]) == 1) break;
        }
      }
    };

    navi_utils.calcAngel = function (a, b, c) {
      var a_sphr = [a.x * DEGREE_TO_RADIAN, a.y * DEGREE_TO_RADIAN, earthRadius];
      var b_sphr = [b.x * DEGREE_TO_RADIAN, b.y * DEGREE_TO_RADIAN, earthRadius];
      var c_sphr = [c.x * DEGREE_TO_RADIAN, c.y * DEGREE_TO_RADIAN, earthRadius];
      var a_ecef = [0, 0, 0];
      var b_ecef = [0, 0, 0];
      var c_ecef = [0, 0, 0];
      var e1 = [0, 0, 0];
      var e2 = [0, 0, 0];
      navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
      navi_utils.transformGeographicToECEF(b_ecef, b_sphr);
      navi_utils.transformGeographicToECEF(c_ecef, c_sphr);
      navi_utils.Vector3_sub(e1, b_ecef, a_ecef);
      navi_utils.Vector3_sub(e2, c_ecef, b_ecef);
      navi_utils.Vector3_normalize(e1, e1);
      navi_utils.Vector3_normalize(e2, e2);
      var angel = Math.acos(navi_utils.Vector3_dot(e1, e2)) * RADIAN_TO_DEGREE;
      var right = [0, 0, 0];
      var upNormal = [0, 0, 0];
      navi_utils.Vector3_normalize(upNormal, b_ecef);
      navi_utils.Vector3_cross(right, e2, e1);

      if (navi_utils.Vector3_dot(right, upNormal) < 0) {
        angel = -angel;
      }
      return angel;
    };

    navi_utils.calcHeading = function (b, c) {
      var a_sphr = [b.x * DEGREE_TO_RADIAN, (b.y + 1) * DEGREE_TO_RADIAN, earthRadius];
      var b_sphr = [b.x * DEGREE_TO_RADIAN, b.y * DEGREE_TO_RADIAN, earthRadius];
      var c_sphr = [c.x * DEGREE_TO_RADIAN, c.y * DEGREE_TO_RADIAN, earthRadius];
      var a_ecef = [0, 0, 0];
      var b_ecef = [0, 0, 0];
      var c_ecef = [0, 0, 0];
      var e1 = [0, 0, 0];
      var e2 = [0, 0, 0];
      navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
      navi_utils.transformGeographicToECEF(b_ecef, b_sphr);
      navi_utils.transformGeographicToECEF(c_ecef, c_sphr);
      navi_utils.Vector3_sub(e1, a_ecef, b_ecef);
      navi_utils.Vector3_sub(e2, c_ecef, b_ecef);
      navi_utils.Vector3_normalize(e1, e1);
      navi_utils.Vector3_normalize(e2, e2);
      var angel = Math.acos(navi_utils.Vector3_dot(e1, e2)) * RADIAN_TO_DEGREE;
      var right = [0, 0, 0];
      var upNormal = [0, 0, 0];
      navi_utils.Vector3_normalize(upNormal, b_ecef);
      navi_utils.Vector3_cross(right, e2, e1);

      if (navi_utils.Vector3_dot(right, upNormal) < 0) {
        angel = 360 - angel;
      }
      return angel;
    };
    // mectro
    navi_utils.getAzimuth = function (p1, p2) {
      var azimuth;
      var angle = Math.asin(Math.abs(p2[1] - p1[1]) / navi_utils.getGeodeticCircleDistance(p1, p2));
      if (p2[1] >= p1[1] && p2[0] >= p1[0]) {
        azimuth = angle + Math.PI;
      } else if (p2[1] >= p1[1] && p2[0] < p1[0]) {
        azimuth = Math.PI * 2 - angle;
      } else if (p2[1] < p1[1] && p2[0] < p1[0]) {
        azimuth = angle;
      } else if (p2[1] < p1[1] && p2[0] >= p1[0]) {
        azimuth = Math.PI - angle;
      }
      return azimuth;
    };

    navi_utils.minDistance = function (point, v1, v2) {
      var p_v1 = [0, 0, 0];
      var p_v2 = [0, 0, 0];
      var dir = [0, 0, 0];
      navi_utils.Vector3_sub(p_v1, point, v1);
      navi_utils.Vector3_sub(dir, v2, v1);
      var l_dir = navi_utils.Vector3_length(dir);
      if (l_dir == 0) {
        return navi_utils.Vector3_length(p_v1);
      }

      var t = (v1[1] - point[1]) * (v1[1] - v2[1]) - ((v1[0] - point[0]) * (v2[0] - v1[0])) / (l_dir * l_dir);
      if (t < 0 || t > 1) {
        navi_utils.Vector3_sub(p_v2, point, v2);
        return Math.min(navi_utils.Vector3_length(p_v2), navi_utils.Vector3_length(p_v1));
      }
      t = (v1[1] - point[1]) * (v2[0] - v1[0]) - ((v1[0] - point[0]) * (v2[1] - v1[1])) / l_dir;
      //navi_utils.Vector3_normalize(dir, dir);

      return Math.abs(t);
    };

    navi_utils.resamplerGeometry = function (geometry) {
      var geometry_new = [];
      var segmentArray = [];
      for (var kk = 0; kk < geometry.length; kk++) {
        var tempPt = navi_utils.getVector(geometry, kk); //geometry[i - 1];
        geometry_new.push(tempPt);
      }

      if (geometry_new.length < 2) return segmentArray;

      var segment = [];
      segment.angel = 0;
      segment.segment_length = 0;
      segment.push(navi_utils.getVector(geometry_new, 0));
      segmentArray.push(segment);
      var lastC = null;
      if (geometry_new.length == 2) {
        var A = geometry_new[0];
        var B = geometry_new[1];
        var B_src = geometry[1];
        B_src.segment_length = navi_utils.getGeodeticCircleDistance(A, B);
        B.segment_length = B_src.segment_length;
        geometry.total_length = B_src.segment_length;
        segment.push(A);
        segment.push(B);
      } else {
        for (var i = 1; i < geometry_new.length - 1; i++) {
          var A = geometry_new[i - 1];
          var B = geometry_new[i];
          var C = geometry_new[i + 1];
          var A_src = geometry[i - 1];
          var B_src = geometry[i];
          var angel = navi_utils.calcAngel(A, B, C);
          B_src.segment_length = B.segment_length = navi_utils.getGeodeticCircleDistance(A, B);

          var isSplitSegment = true;
          //if(index == 0 && i == 1 &&  B.segment_length < 1.0){
          //    isSplitSegment = false;
          //}

          if (i == 1 && B.segment_length < 0.1) {
            isSplitSegment = false;
          }
          if (i == geometry_new.length - 2) {
            C.segment_length = navi_utils.getGeodeticCircleDistance(B, C);
            if (C.segment_length < 0.1) {
              isSplitSegment = false;
            }
          }

          if (Math.abs(angel) > 30 && isSplitSegment) {
            segment.push(B);
            segment.angel = angel;
            segment.segment_length += B.segment_length;
            segment.next_pt = C;
            //lastC = C;
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
        var A = geometry_new[geometry_new.length - 2];
        var B = geometry_new[geometry_new.length - 1];
        var B_src = geometry[geometry.length - 1];
        B_src.segment_length = B.segment_length = navi_utils.getGeodeticCircleDistance(A, B);
        segment.push(B);
        segment.next_pt = B;
        segment.segment_length += B.segment_length;
        geometry.total_length += B.segment_length;
      }
      return segmentArray;
    };

    navi_utils.pointToLineInVector = function (checkPosition, segment0, segment1, intersctPosition, diffLen) {
      var j = 0;

      var pos_sphr = [checkPosition[0] * DEGREE_TO_RADIAN, checkPosition[1] * DEGREE_TO_RADIAN, earthRadius];
      var a_sphr = [segment0[0] * DEGREE_TO_RADIAN, segment0[1] * DEGREE_TO_RADIAN, earthRadius];
      var b_sphr = [segment1[0] * DEGREE_TO_RADIAN, segment1[1] * DEGREE_TO_RADIAN, earthRadius];
      var pos_ecef = [0, 0, 0];
      var a_ecef = [0, 0, 0];
      var b_ecef = [0, 0, 0];
      var root_ecef = [0, 0, 0];
      var root_sphr = [0, 0, 0];
      navi_utils.transformGeographicToECEF(pos_ecef, pos_sphr);
      navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
      navi_utils.transformGeographicToECEF(b_ecef, b_sphr);

      var tempDistance = navi_utils.pointToLine(pos_ecef, a_ecef, b_ecef, root_ecef);
      if (tempDistance < (diffLen || 0.1)) {
        if (intersctPosition) {
          navi_utils.transformECEFToGeographic(root_sphr, root_ecef);
          intersctPosition[0] = root_sphr[0] * RADIAN_TO_DEGREE;
          intersctPosition[1] = root_sphr[1] * RADIAN_TO_DEGREE;
          intersctPosition[2] = 0;
          intersctPosition.dis = tempDistance;
        }

        return true;
      }
      return false;
      //todo:需要精细计算具体的距离
    };
    navi_utils.isPointOnLine = function (x, y, endx, endy, px, py) {
      // var f = function(somex) {
      //     return (endy - y) / (endx - x) * (somex - x) + y;
      // };
      // return Math.abs(f(px) - py) < 0 // tolerance, rounding errors
      // && ((px > x && px < endx)||(py > y && py < endy)); // are they also on this segment?
      x = parseInt(x);
      y = parseInt(y);
      endx = parseInt(endx);
      endy = parseInt(endy);
      px = parseInt(px);
      py = parseInt(py);
      if (x == endx && y == endy) {
        return true;
      }
      if (x == px && y == py) {
        return true;
      }
      // if(Math.abs(x-endx) <= 7 && Math.abs(y-endy) <= 7){
      //     return true;
      // }
      // if(Math.abs(x-px) <= 7 && Math.abs(y-py) <= 7){
      //     return true;
      // }

      return px >= x && px <= endx && py >= y && py <= endy;
    };

    navi_utils.pointToLine = function (point, p1, p2, proot) {
      var ans = 0;
      var a, b, c;
      var p_v1 = [0, 0, 0];
      var p_v2 = [0, 0, 0];
      var dir = [0, 0, 0];

      navi_utils.Vector3_sub(p_v1, point, p1);
      navi_utils.Vector3_sub(p_v2, point, p2);
      navi_utils.Vector3_sub(dir, p1, p2);

      a = navi_utils.Vector3_length(dir);
      b = navi_utils.Vector3_length(p_v1);
      c = navi_utils.Vector3_length(p_v2);
      if (c + b == a) {
        //点在线段上
        ans = 0;
        proot[0] = point[0];
        proot[1] = point[1];
        proot[2] = point[2];
        return ans;
      }
      if (a <= 0.00001) {
        //不是线段，是一个点
        ans = b;
        proot[0] = p1[0];
        proot[1] = p1[1];
        proot[2] = p1[2];
        return ans;
      }
      if (c * c >= a * a + b * b) {
        //组成直角三角形或钝角三角形，p1为直角或钝角
        ans = b;
        proot[0] = p1[0];
        proot[1] = p1[1];
        proot[2] = p1[2];
        return ans;
      }
      if (b * b >= a * a + c * c) {
        // 组成直角三角形或钝角三角形，p2为直角或钝角
        ans = c;
        proot[0] = p2[0];
        proot[1] = p2[1];
        proot[2] = p2[2];
        return ans;
      }
      // 组成锐角三角形，则求三角形的高
      var p0 = (a + b + c) / 2; // 半周长
      var s = Math.sqrt(p0 * (p0 - a) * (p0 - b) * (p0 - c)); // 海伦公式求面积
      ans = (2 * s) / a; // 返回点到线的距离（利用三角形面积公式求高）

      ///////////////////////////////////////////////////
      //var A = (p1[1]-p2[1])/(p1[0]- p2[0]);
      //var B = p1[1]-A*p1[1];
      ///// > 0 = ax +b -y;  对应垂线方程为 -x -ay + m = 0;(mm为系数)
      ///// > A = a; B = b;
      //var m = point[0] + A*point[1];
      //
      ///// 求两直线交点坐标
      //proot[0]=(m-A*B)/(A*A + 1);
      //proot[1]=A* proot[0]+B;

      navi_utils.point2line(point, p1, p2, proot);
      return ans;
    };

    navi_utils.point2line = function (p, p1, p2, Q) {
      var a, b, c;
      var A, B, C;

      a = p2[0] - p1[0];
      b = p2[1] - p1[1];
      c = p2[2] - p1[2];

      A = a * p[0] + b * p[1] + c * p[2];
      B = b * p1[0] - a * p1[1];
      C = c * p1[0] - a * p1[2];

      if (a != 0) {
        Q[0] = (A * a + B * b + C * c) / (a * a + b * b + c * c);
        Q[1] = (b * Q[0] - B) / a;
        Q[2] = (c * Q[0] - C) / a;
      } else {
        var D, temp;
        D = c * p1[1] - b * p1[2];
        temp = b * b + c * c;
        Q[1] = (A * b + D * c) / temp;
        Q[2] = (A * c - D * b) / temp;
        Q[0] = (B + a * Q[1]) / b;
      }

      return 1;
    };
    navi_utils.MillisecondToDate = function (msd, onsec, language) {
      var time = parseFloat(msd) / 1000;
      var sec = "",
        addmin = 0;
      var unitSec = window["langData"]["second"] || "秒",
        unitMinute = window["langData"]["minute"] || "分钟",
        unitHours = window["langData"]["hour"] || "小时";
      if (language == "En") {
        unitSec = " seconds ";
        unitMinute = " minutes ";
        unitHours = " hours ";
      }
      if (null != time && "" != time) {
        if (time > 60 && time < 60 * 60) {
          sec = parseInt((parseFloat(time / 60.0) - parseInt(time / 60.0)) * 60);
          if (!!onsec) {
            if (sec > 30) {
              addmin = 1;
            }
            sec = "";
          } else {
            sec += unitSec;
          }
          time = parseInt(time / 60.0) + addmin + unitMinute + sec;
        } else if (time >= 60 * 60 && time < 60 * 60 * 24) {
          sec = parseInt(
            (parseFloat((parseFloat(time / 3600.0) - parseInt(time / 3600.0)) * 60) - parseInt((parseFloat(time / 3600.0) - parseInt(time / 3600.0)) * 60)) * 60
          );
          if (!!onsec) {
            if (sec > 30) {
              addmin = 1;
            }
            sec = "";
          } else {
            sec += unitSec;
          }
          time = parseInt(time / 3600.0) + unitHours + (parseInt((parseFloat(time / 3600.0) - parseInt(time / 3600.0)) * 60) + addmin) + unitMinute + sec;
        } else {
          if (!!onsec) {
            time = "1" + unitMinute;
          } else {
            time = parseInt(time) + unitSec;
          }
        }
      }
      return time;
    };

    navi_utils.slerp = function (retVal, a, b, t) {
      var a_sphr = [a[0] * DEGREE_TO_RADIAN, a[1] * DEGREE_TO_RADIAN, earthRadius];
      var b_sphr = [b[0] * DEGREE_TO_RADIAN, b[1] * DEGREE_TO_RADIAN, earthRadius];
      var a_ecef = [0, 0, 0];
      var b_ecef = [0, 0, 0];
      navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
      navi_utils.transformGeographicToECEF(b_ecef, b_sphr);

      navi_utils.Vector3_lerp(retVal, a_ecef, b_ecef, t);
      navi_utils.transformECEFToGeographic(retVal, retVal);
      retVal[0] = retVal[0] * RADIAN_TO_DEGREE;
      retVal[1] = retVal[1] * RADIAN_TO_DEGREE;
      retVal[2] = 0;
    };

    navi_utils.calcCenterAndDistance = function (geometry, tilt) {
      var minx = 99999999999;
      var miny = 99999999999;
      var maxx = -99999999999;
      var maxy = -99999999999;
      for (var i = 0; i < geometry.length; i++) {
        minx = Math.min(minx, geometry[i].x);
        miny = Math.min(miny, geometry[i].y);
        maxx = Math.max(maxx, geometry[i].x);
        maxy = Math.max(maxy, geometry[i].y);
      }
      var center_x = (maxx + minx) * 0.5;
      var center_y = (maxy + miny) * 0.5;
      var camera_viewportHeight = 2 * 1.5;
      var camera_frustum_fovy = Math.PI * 0.25;
      // var distance = Vector3.length(camera._position) - Ellipsoid.Radius;
      var tempScale = Math.tan(camera_frustum_fovy * 0.5) / (camera_viewportHeight * 0.5);
      //maxTileWidth = 512 * tempScale * distance * scale * 0.8;
      var maxTileWidth =
        navi_utils.getGeodeticCircleRadians(minx * DEGREE_TO_RADIAN, miny * DEGREE_TO_RADIAN, maxx * DEGREE_TO_RADIAN, maxy * DEGREE_TO_RADIAN) *
        earthRadius *
        0.5;
      var distance = maxTileWidth / tempScale;
      distance = Math.max(50, Math.min(distance, 190));
      var angel = -(geometry.angel + geometry.angel2);

      var ret = { center_x: center_x, center_y: center_y, angel: angel, distance: distance };

      return ret;

      //todo:经验值可能有问题
      //center_y = center_y - 0.0001;
      //center_x = center_x - 0.0001;
    };

    var LLR_NOT_INTERSECT = 0,
      LLR_INTERSECT = 1,
      LLR_INTERSECT_POINT_A = 2,
      LLR_INTERSECT_POINT_B = 3,
      LLR_INTERSECT_POINT_C = 4,
      LLR_INTERSECT_POINT_D = 5;

    navi_utils.judgeSide = function (point_judge, section_point1, section_point2, epsilon) {
      var line_vec = [section_point2[0] - section_point1[0], section_point2[1] - section_point1[1], 0];
      navi_utils.Vector3_normalize(line_vec, line_vec);

      var test_vec = [point_judge[0] - section_point1[0], point_judge[1] - section_point1[1], 0];
      var length = navi_utils.Vector3_length(test_vec);
      navi_utils.Vector3_normalize(test_vec, test_vec);

      var val = Math.acos(navi_utils.Vector3_dot(line_vec, test_vec));
      var dist = length * Math.sin(val);
      if (dist < epsilon) {
        return 0;
      }

      var cross = [0, 0, 0];
      navi_utils.Vector3_cross(cross, test_vec, line_vec);
      var test_dot = navi_utils.Vector3_dot(cross, [0, 0, 1]);
      if (test_dot < 0) {
        return -1;
      }

      return 1;
    };

    navi_utils.purifyGeometry = function (geometry, geometry_new) {
      if (geometry.length == 0) return 0;
      geometry_new.push(navi_utils.getVector(geometry, 0));
      for (var kk = 0; kk < geometry.length - 1; kk++) {
        var tempPt = navi_utils.getVector(geometry, kk); //geometry[i - 1];
        var tempPt2 = navi_utils.getVector(geometry, kk + 1);
        var distance = navi_utils.getGeodeticCircleDistance(tempPt, tempPt2);
        if (distance > 0.1) {
          geometry_new.push(tempPt2);
        }
      }
      return geometry_new.length;
    };

    navi_utils.calcGeometrySegmentLengthVector = function (geometry_new) {
      if (geometry_new.length == 0) return 0;
      geometry_new.total_length = 0;
      geometry_new[0].segment_length = 0;
      geometry_new[0].sequence_length = 0;
      for (var kk = 0; kk < geometry_new.length - 1; kk++) {
        var tempPt = geometry_new[kk]; //geometry[i - 1];
        var tempPt2 = geometry_new[kk + 1];
        var distance = navi_utils.getGeodeticCircleDistanceVector(tempPt, tempPt2);
        geometry_new[kk + 1].segment_length = distance;
        geometry_new[kk + 1].sequence_length = geometry_new.total_length + distance;
        geometry_new.total_length += distance;
      }
    };

    navi_utils.calcGeometryLengthVector = function (geometry_new) {
      if (geometry_new.length == 0) return 0;
      var totalLength = 0;
      for (var kk = 0; kk < geometry_new.length - 1; kk++) {
        var tempPt = geometry_new[kk]; //geometry[i - 1];
        var tempPt2 = geometry_new[kk + 1];
        totalLength += navi_utils.getGeodeticCircleDistanceVector(tempPt, tempPt2);
      }
      return totalLength;
    };

    navi_utils.getAngle = function (start, end) {
      var diff_x = (end.x - start.x) * 100000,
        diff_y = (end.y - start.y) * 100000;
      var InvLength = 1 / Math.sqrt(diff_x * diff_x + diff_y * diff_y);
      var vec2 = [diff_x * InvLength, diff_y * InvLength];
      var vec1 = [0, 1];

      //navi_utils.Vector3_dot = function( vec1, vec2 ) {
      var dotValue = vec1[0] * vec2[0] + vec1[1] * vec2[1];
      var angle = (Math.acos(dotValue) / Math.PI) * 180;

      if (diff_x < 0) {
        angle = 360 - angle;
      }
      return angle;
    };
    navi_utils.calcMectroPointLen = function (startPnt, endPnt) {
      var x1 = startPnt[0] || startPnt.x;
      var y1 = startPnt[1] || startPnt.y;
      var x2 = endPnt[0] || endPnt.x;
      var y2 = endPnt[1] || endPnt.y;
      return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    };
    navi_utils.getRadianAngle = function (startPnt, endPnt) {
      var radianAngle;
      var x1 = startPnt[0] || startPnt.x;
      var y1 = startPnt[1] || startPnt.y;
      var x2 = endPnt[0] || endPnt.x;
      var y2 = endPnt[1] || endPnt.y;
      var dis = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
      var angle = Math.acos(Math.abs(y2 - y1) / dis);
      if (y2 >= y1 && x2 >= x1) radianAngle = angle;
      else if (y2 >= y1 && x2 < x1) radianAngle = P.Constants.TWO_PI - angle;
      else if (y2 < y1 && x2 < x1) radianAngle = Math.PI + angle;
      else if (endPnt[1] < startPnt[1] && endPnt[0] >= startPnt[0]) radianAngle = Math.PI - angle;
      return radianAngle;
    };
    navi_utils.getMectroPointInAngleWidthDis = function (point, angle, dis) {
      var dx = dis * Math.sin(angle);
      var dy = dis * Math.cos(angle);
      return [point[0] + dx, point[1] + dy];
    };
    navi_utils.computeArrowPolygon = function (linePoints, lineWidth, arrowWidth, arrowHeight) {
      var resultPoints = [linePoints[0]];
      var rightPoints = [],
        leftPoints = [];
      if (linePoints.length < 2) {
        return null;
      }
      var halfLineWidth = lineWidth * 0.5;
      var mectroPoints = [];
      linePoints.forEach(function (point) {
        var p = avi_utils.lonLatToMectro(point);
        mectroPoints.push([p.x, p.y]);
      });
      if (mectroPoints.length == 2) {
        var angle = navi_utils.getRadianAngle(mectroPoints[0], mectroPoints[1]);
        var dis = navi_utils.calcMectroPointLen(mectroPoints[0], mectroPoints[1]);
        var bodyLen = dis;

        var angleRight = angle + HALF_PI;
        var angleLeft = angle - HALF_PI;
        rightPoints.push(navi_utils.getMectroPointInAngleWidthDis(mectroPoints[0], angleRight, halfLineWidth));
        leftPoints.unshift(navi_utils.getMectroPointInAngleWidthDis(mectroPoints[0], angleLeft, halfLineWidth));
        if (dis > arrowHeight) {
          bodyLen -= arrowHeight;
          var arrowHeadStart = navi_utils.getMectroPointInAngleWidthDis(mectroPoints[0], angle, bodyLen);
        }
      }
      for (var i = 1; i < mectroPoints.length - 1; i++) {}
    };
    navi_utils.calcGeometrySegmentLength = function (geometry_new) {
      if (geometry_new.length == 0) return 0;
      geometry_new.total_length = 0;
      geometry_new[0].segment_length = 0;
      geometry_new[0].sequence_length = 0;
      for (var kk = 0; kk < geometry_new.length - 1; kk++) {
        var tempPt = geometry_new[kk]; //geometry[i - 1];
        var tempPt2 = geometry_new[kk + 1];
        var distance = navi_utils.getGeodeticCircleDistance(tempPt, tempPt2);
        geometry_new[kk + 1].segment_length = distance;
        geometry_new[kk + 1].sequence_length = geometry_new.total_length + distance;
        geometry_new.total_length += distance;
      }
    };

    navi_utils.calcGeometryAngel = function (geometryLine) {
      if (geometryLine.length == 0) return 0;
      geometryLine[0].angel = 0;
      geometryLine[geometryLine.length - 1].angel = 0;
      for (var i = 1; i < geometryLine.length - 1; i++) {
        var A = geometryLine[i - 1];
        var B = geometryLine[i];
        var C = geometryLine[i + 1];
        var angel = navi_utils.calcAngel(A, B, C);
        geometryLine[i].angel = angel;
      }
      return geometryLine.length;
    };

    //// relationship ////////////////////////////////////////////////////////
    navi_utils.lineLineIntersect = function (v1, v2, p1, p2, intersect_point, epsl) {
      var p1_v1v2 = navi_utils.judgeSide(p1, v1, v2, epsl);
      var p2_v1v2 = navi_utils.judgeSide(p2, v1, v2, epsl);

      if (p1_v1v2 == 0) {
        if (v1[0] != v2[0] && (p1[0] - v1[0]) * (p1[0] - v2[0]) > 0) {
          return LLR_NOT_INTERSECT;
        }
        if (v1[1] != v2[1] && (p1[1] - v1[1]) * (p1[1] - v2[1]) > 0) {
          return LLR_NOT_INTERSECT;
        }
        intersect_point[0] = p1[0];
        intersect_point[1] = p1[1];
        return LLR_INTERSECT_POINT_C;
      }
      if (p2_v1v2 == 0) {
        if (v1[0] != v2[0] && (p2[0] - v1[0]) * (p2[0] - v2[0]) > 0) {
          return LLR_NOT_INTERSECT;
        }
        if (v1[1] != v2[1] && (p2[1] - v1[1]) * (p2[1] - v2[1]) > 0) {
          return LLR_NOT_INTERSECT;
        }
        intersect_point[0] = p2[0];
        intersect_point[1] = p2[1];
        return LLR_INTERSECT_POINT_D;
      }

      if (p1_v1v2 == p2_v1v2) {
        return LLR_NOT_INTERSECT;
      }

      var v1_p1p2 = navi_utils.judgeSide(v1, p1, p2, epsl);
      var v2_p1p2 = navi_utils.judgeSide(v2, p1, p2, epsl);

      if (v1_p1p2 == v2_p1p2) {
        return LLR_NOT_INTERSECT;
      }

      var denom = (p2[1] - p1[1]) * (v2[0] - v1[0]) - (p2[0] - p1[0]) * (v2[1] - v1[1]);
      var nume_a = (p2[0] - p1[0]) * (v1[1] - p1[1]) - (p2[1] - p1[1]) * (v1[0] - p1[0]);
      var nume_b = (v2[0] - v1[0]) * (v1[1] - p1[1]) - (v2[1] - v1[1]) * (v1[0] - p1[0]);

      var v_ua = nume_a / denom;
      var v_ub = nume_b / denom;

      if (v1_p1p2 == 0) {
        intersect_point[0] = v1[0];
        intersect_point[1] = v1[1];

        return LLR_INTERSECT_POINT_A;
      }
      if (v2_p1p2 == 0) {
        intersect_point[0] = v2[0];
        intersect_point[1] = v2[1];
        return LLR_INTERSECT_POINT_B;
      }

      intersect_point[0] = v1[0] + v_ua * (v2[0] - v1[0]);
      intersect_point[1] = v1[1] + v_ua * (v2[1] - v1[1]);

      return LLR_INTERSECT;
    };

    navi_utils.segmentInterectPolygon = function (inSegment, polygon, ret) {
      // segment Is in polygon
      var totalDistance = navi_utils.getGeodeticCircleDistanceVector(inSegment[0], inSegment[1]);
      var point0 = { point: inSegment[0], type: 0, distance: 0 };
      var point1 = { point: inSegment[1], type: 0, distance: totalDistance };

      var segment = [point0, point1];
      var inCount = 0;
      var ptNumSegment = segment.length;
      var ptNumPolygon = polygon.length;
      for (var i = 0; i < ptNumSegment; i++) {
        if (navi_utils.pointInPolygon(segment[i].point, polygon)) {
          inCount++;
          ret.pointInPolygon.push(segment[i]);
        }
      }
      // segment In polygon
      if (inCount == ptNumSegment) {
        return 0;
      }

      // if segment is intersect polygon, add segment[0] and intersect point;
      var isinstersect = false;
      for (var i = 1; i < ptNumSegment; i++) {
        var vecLine1 = segment[i - 1];
        var vecLine2 = segment[i];
        for (var j = 0; j < ptNumPolygon; j++) {
          var vecPoly1 = polygon[j];
          var vecPoly2 = polygon[(j + 1) % ptNumPolygon];
          var intersect_point = [0, 0, 0];

          var retVal = navi_utils.lineLineIntersect(vecLine1.point, vecLine2.point, vecPoly1, vecPoly2, intersect_point, 0.00000001);
          if (retVal !== 0) {
            var distance = navi_utils.getGeodeticCircleDistanceVector(intersect_point, vecLine1.point);
            var intersectPt = null;
            if (distance < 0.1) {
              intersectPt = point0;
            } else if (Math.abs(distance - totalDistance) < 0.1) {
              intersectPt = point1;
            } else {
              intersectPt = { point: intersect_point, type: 1, distance: distance };
              intersectPt.point.sequence_length = vecLine1.point.sequence_length + distance;
            }
            //intersect_point.distance = distance;
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
        ret.pointInPolygon.sort(function (a, b) {
          return a.distance < b.distance ? -1 : 1;
        });
        return ret.minDistance;
      }
      return -1;
    };

    navi_utils.pointInPolygon = function (pos, polygon) {
      var inside = false;
      var polygonSize = polygon.length;
      var val1, val2;
      for (var i = 0; i < polygonSize; i++) {
        var p1 = polygon[(i + polygonSize) % polygonSize];
        var p2 = polygon[(i + 1 + polygonSize) % polygonSize];
        if (pos[1] < p2[1]) {
          if (pos[1] >= p1[1]) {
            val1 = (pos[1] - p1[1]) * (p2[0] - p1[0]);
            val2 = (pos[0] - p1[0]) * (p2[1] - p1[1]);
            if (val1 > val2) {
              inside = !inside;
            }
          }
        } else if (pos[1] < p1[1]) {
          val1 = (pos[1] - p1[1]) * (p2[0] - p1[0]);
          val2 = (pos[0] - p1[0]) * (p2[1] - p1[1]);
          if (val1 < val2) {
            inside = !inside;
          }
        }
      }
      return inside;
    };

    function MapLatLonToXY(phi, lambda, lambda0, utmXY) {
      var N, nu2, ep2, t, t2, l;
      var l3coef, l4coef, l5coef, l6coef, l7coef, l8coef;
      var tmp;

      /* Precalculate ep2 */
      ep2 = (Math.pow(sm_a, 2.0) - Math.pow(sm_b, 2.0)) / Math.pow(sm_b, 2.0);
      /* Precalculate nu2 */
      nu2 = ep2 * Math.pow(Math.cos(phi), 2.0);
      /* Precalculate N */
      N = Math.pow(sm_a, 2.0) / (sm_b * Math.sqrt(1 + nu2));
      /* Precalculate t */
      t = Math.tan(phi);
      t2 = t * t;
      tmp = t2 * t2 * t2 - Math.pow(t, 6.0);

      /* Precalculate l */
      l = lambda - lambda0;

      /* Precalculate coefficients for l**n in the equations below
            so a normal human being can read the expressions for easting
            and northing
            -- l**1 and l**2 have coefficients of 1.0 */
      l3coef = 1.0 - t2 + nu2;
      l4coef = 5.0 - t2 + 9 * nu2 + 4.0 * (nu2 * nu2);
      l5coef = 5.0 - 18.0 * t2 + t2 * t2 + 14.0 * nu2 - 58.0 * t2 * nu2;
      l6coef = 61.0 - 58.0 * t2 + t2 * t2 + 270.0 * nu2 - 330.0 * t2 * nu2;
      l7coef = 61.0 - 479.0 * t2 + 179.0 * (t2 * t2) - t2 * t2 * t2;
      l8coef = 1385.0 - 3111.0 * t2 + 543.0 * (t2 * t2) - t2 * t2 * t2;

      /* Calculate easting (x) */
      utmXY[0] =
        N * Math.cos(phi) * l +
        (N / 6.0) * Math.pow(Math.cos(phi), 3.0) * l3coef * Math.pow(l, 3.0) +
        (N / 120.0) * Math.pow(Math.cos(phi), 5.0) * l5coef * Math.pow(l, 5.0) +
        (N / 5040.0) * Math.pow(Math.cos(phi), 7.0) * l7coef * Math.pow(l, 7.0);

      /* Calculate northing (y) */
      utmXY[1] =
        ArcLengthOfMeridian(phi) +
        (t / 2.0) * N * Math.pow(Math.cos(phi), 2.0) * Math.pow(l, 2.0) +
        (t / 24.0) * N * Math.pow(Math.cos(phi), 4.0) * l4coef * Math.pow(l, 4.0) +
        (t / 720.0) * N * Math.pow(Math.cos(phi), 6.0) * l6coef * Math.pow(l, 6.0) +
        (t / 40320.0) * N * Math.pow(Math.cos(phi), 8.0) * l8coef * Math.pow(l, 8.0);
    }

    navi_utils.lonlatToUtmXY = function (lonLat, utmXY) {
      var zone = parseInt(Math.floor((lonLat[0] + 180.0) / 6)) + 1;
      //MapLatLonToXY (DegToRad(lat), DegToRad(lon), UTMCentralMeridian(zone), xy);
      MapLatLonToXY(DegToRad(lonLat[1]), DegToRad(lonLat[0]), UTMCentralMeridian(zone), utmXY);

      /* Adjust easting and northing for UTM system. */
      utmXY[0] = utmXY[0] * UTMScaleFactor + 500000.0;
      utmXY[1] = utmXY[1] * UTMScaleFactor;
      if (utmXY[1] < 0.0) utmXY[1] += 10000000.0;
    };
    navi_utils.copyData = function (data) {
      var str = JSON.stringify(data);
      return JSON.parse(str);
    };
    navi_utils.parseToJSON = function (marker) {
      var markerInfo = {};
      markerInfo["id"] = marker.id;
      markerInfo["floorId"] = marker.floorId;
      markerInfo["floorName"] = marker.floorName;
      markerInfo["level"] = marker.level;
      markerInfo["offsetX"] = marker.offsetX;
      markerInfo["offsetY"] = marker.offsetY;
      markerInfo["width"] = marker.width;
      markerInfo["height"] = marker.height;
      markerInfo["alpha"] = marker.alpha;
      markerInfo["icon"] = marker.icon;
      markerInfo["fontStyle"] = marker.fontStyle;
      markerInfo["lon"] = marker.lon;
      markerInfo["lat"] = marker.lat;
      markerInfo["showType"] = marker.showType;
      markerInfo["index"] = marker.index;
      markerInfo["name"] = marker.name;
      markerInfo["text"] = marker.text;
      markerInfo["isEndMarker"] = marker.isEndMarker;
      return markerInfo;
    };
    navi_utils.getRealFloorNumbyFloorId = function (floorId) {
      var len = floorId.length;
      var startIndex = len - 8;
      var endIndex = len - 5;
      var str1 = floorId.slice(startIndex + 1, endIndex);
      var flabs = parseInt(str1),
        floorNum;
      if (floorId[startIndex] == "0") {
        floorNum = -flabs;
      } else {
        floorNum = flabs;
      }
      return floorNum;
    };
    var P = {};
    P.Constants = {
      TWO_PI: Math.PI * 2,
      HALF_PI: Math.PI / 2,
      FITTING_COUNT: 100,
      ZERO_TOLERANCE: 0.0001,
    };
    var PlotUtils = {};

    PlotUtils.distance = function (pnt1, pnt2) {
      return Math.sqrt(Math.pow(pnt1[0] - pnt2[0], 2) + Math.pow(pnt1[1] - pnt2[1], 2));
    };

    PlotUtils.wholeDistance = function (points) {
      var distance = 0;
      for (var i = 0; i < points.length - 1; i++) distance += PlotUtils.distance(points[i], points[i + 1]);
      return distance;
    };

    PlotUtils.getBaseLength = function (points) {
      return Math.pow(PlotUtils.wholeDistance(points), 0.99);
      //return PlotUtils.wholeDistance(points);
    };

    PlotUtils.mid = function (pnt1, pnt2) {
      return [(pnt1[0] + pnt2[0]) / 2, (pnt1[1] + pnt2[1]) / 2];
    };

    PlotUtils.getCircleCenterOfThreePoints = function (pnt1, pnt2, pnt3) {
      var pntA = [(pnt1[0] + pnt2[0]) / 2, (pnt1[1] + pnt2[1]) / 2];
      var pntB = [pntA[0] - pnt1[1] + pnt2[1], pntA[1] + pnt1[0] - pnt2[0]];
      var pntC = [(pnt1[0] + pnt3[0]) / 2, (pnt1[1] + pnt3[1]) / 2];
      var pntD = [pntC[0] - pnt1[1] + pnt3[1], pntC[1] + pnt1[0] - pnt3[0]];
      return PlotUtils.getIntersectPoint(pntA, pntB, pntC, pntD);
    };

    PlotUtils.getIntersectPoint = function (pntA, pntB, pntC, pntD) {
      if (pntA[1] == pntB[1]) {
        var f = (pntD[0] - pntC[0]) / (pntD[1] - pntC[1]);
        var x = f * (pntA[1] - pntC[1]) + pntC[0];
        var y = pntA[1];
        return [x, y];
      }
      if (pntC[1] == pntD[1]) {
        var e = (pntB[0] - pntA[0]) / (pntB[1] - pntA[1]);
        x = e * (pntC[1] - pntA[1]) + pntA[0];
        y = pntC[1];
        return [x, y];
      }
      e = (pntB[0] - pntA[0]) / (pntB[1] - pntA[1]);
      f = (pntD[0] - pntC[0]) / (pntD[1] - pntC[1]);
      y = (e * pntA[1] - pntA[0] - f * pntC[1] + pntC[0]) / (e - f);
      x = e * y - e * pntA[1] + pntA[0];
      return [x, y];
    };

    PlotUtils.getAzimuth = function (startPnt, endPnt) {
      var azimuth;
      var angle = Math.asin(Math.abs(endPnt[1] - startPnt[1]) / PlotUtils.distance(startPnt, endPnt));
      if (endPnt[1] >= startPnt[1] && endPnt[0] >= startPnt[0]) azimuth = angle + Math.PI;
      else if (endPnt[1] >= startPnt[1] && endPnt[0] < startPnt[0]) azimuth = P.Constants.TWO_PI - angle;
      else if (endPnt[1] < startPnt[1] && endPnt[0] < startPnt[0]) azimuth = angle;
      else if (endPnt[1] < startPnt[1] && endPnt[0] >= startPnt[0]) azimuth = Math.PI - angle;
      return azimuth;
    };

    PlotUtils.getAngleOfThreePoints = function (pntA, pntB, pntC) {
      var angle = PlotUtils.getAzimuth(pntB, pntA) - PlotUtils.getAzimuth(pntB, pntC);
      return angle < 0 ? angle + P.Constants.TWO_PI : angle;
    };

    PlotUtils.isClockWise = function (pnt1, pnt2, pnt3) {
      return (pnt3[1] - pnt1[1]) * (pnt2[0] - pnt1[0]) > (pnt2[1] - pnt1[1]) * (pnt3[0] - pnt1[0]);
    };

    PlotUtils.getPointOnLine = function (t, startPnt, endPnt) {
      var x = startPnt[0] + t * (endPnt[0] - startPnt[0]);
      var y = startPnt[1] + t * (endPnt[1] - startPnt[1]);
      return [x, y];
    };

    PlotUtils.getCubicValue = function (t, startPnt, cPnt1, cPnt2, endPnt) {
      t = Math.max(Math.min(t, 1), 0);
      var tp = 1 - t;
      var t2 = t * t;
      var t3 = t2 * t;
      var tp2 = tp * tp;
      var tp3 = tp2 * tp;
      var x = tp3 * startPnt[0] + 3 * tp2 * t * cPnt1[0] + 3 * tp * t2 * cPnt2[0] + t3 * endPnt[0];
      var y = tp3 * startPnt[1] + 3 * tp2 * t * cPnt1[1] + 3 * tp * t2 * cPnt2[1] + t3 * endPnt[1];
      return [x, y];
    };

    PlotUtils.getThirdPoint = function (startPnt, endPnt, angle, distance, clockWise) {
      var azimuth = PlotUtils.getAzimuth(startPnt, endPnt);
      var alpha = clockWise ? azimuth + angle : azimuth - angle;
      var dx = distance * Math.cos(alpha);
      var dy = distance * Math.sin(alpha);
      return [endPnt[0] + dx, endPnt[1] + dy];
    };

    PlotUtils.getArcPoints = function (center, radius, startAngle, endAngle) {
      var x,
        y,
        pnts = [];
      var angleDiff = endAngle - startAngle;
      angleDiff = angleDiff < 0 ? angleDiff + P.Constants.TWO_PI : angleDiff;
      for (var i = 0; i <= P.Constants.FITTING_COUNT; i++) {
        var angle = startAngle + (angleDiff * i) / P.Constants.FITTING_COUNT;
        x = center[0] + radius * Math.cos(angle);
        y = center[1] + radius * Math.sin(angle);
        pnts.push([x, y]);
      }
      return pnts;
    };

    PlotUtils.getBisectorNormals = function (t, pnt1, pnt2, pnt3) {
      var normal = PlotUtils.getNormal(pnt1, pnt2, pnt3);
      var dist = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1]);
      var uX = normal[0] / dist;
      var uY = normal[1] / dist;
      var d1 = PlotUtils.distance(pnt1, pnt2);
      var d2 = PlotUtils.distance(pnt2, pnt3);
      if (dist > P.Constants.ZERO_TOLERANCE) {
        if (PlotUtils.isClockWise(pnt1, pnt2, pnt3)) {
          var dt = t * d1;
          var x = pnt2[0] - dt * uY;
          var y = pnt2[1] + dt * uX;
          var bisectorNormalRight = [x, y];
          dt = t * d2;
          x = pnt2[0] + dt * uY;
          y = pnt2[1] - dt * uX;
          var bisectorNormalLeft = [x, y];
        } else {
          dt = t * d1;
          x = pnt2[0] + dt * uY;
          y = pnt2[1] - dt * uX;
          bisectorNormalRight = [x, y];
          dt = t * d2;
          x = pnt2[0] - dt * uY;
          y = pnt2[1] + dt * uX;
          bisectorNormalLeft = [x, y];
        }
      } else {
        x = pnt2[0] + t * (pnt1[0] - pnt2[0]);
        y = pnt2[1] + t * (pnt1[1] - pnt2[1]);
        bisectorNormalRight = [x, y];
        x = pnt2[0] + t * (pnt3[0] - pnt2[0]);
        y = pnt2[1] + t * (pnt3[1] - pnt2[1]);
        bisectorNormalLeft = [x, y];
      }
      return [bisectorNormalRight, bisectorNormalLeft];
    };

    PlotUtils.getNormal = function (pnt1, pnt2, pnt3) {
      var dX1 = pnt1[0] - pnt2[0];
      var dY1 = pnt1[1] - pnt2[1];
      var d1 = Math.sqrt(dX1 * dX1 + dY1 * dY1);
      dX1 /= d1;
      dY1 /= d1;

      var dX2 = pnt3[0] - pnt2[0];
      var dY2 = pnt3[1] - pnt2[1];
      var d2 = Math.sqrt(dX2 * dX2 + dY2 * dY2);
      dX2 /= d2;
      dY2 /= d2;

      var uX = dX1 + dX2;
      var uY = dY1 + dY2;
      return [uX, uY];
    };

    PlotUtils.getCurvePoints = function (t, controlPoints) {
      var leftControl = PlotUtils.getLeftMostControlPoint(controlPoints);
      var normals = [leftControl];
      for (var i = 0; i < controlPoints.length - 2; i++) {
        var pnt1 = controlPoints[i];
        var pnt2 = controlPoints[i + 1];
        var pnt3 = controlPoints[i + 2];
        var normalPoints = PlotUtils.getBisectorNormals(t, pnt1, pnt2, pnt3);
        normals = normals.concat(normalPoints);
      }
      var rightControl = PlotUtils.getRightMostControlPoint(controlPoints);
      normals.push(rightControl);
      var points = [];
      for (i = 0; i < controlPoints.length - 1; i++) {
        pnt1 = controlPoints[i];
        pnt2 = controlPoints[i + 1];
        points.push(pnt1);
        for (var t = 0; t < P.Constants.FITTING_COUNT; t++) {
          var pnt = PlotUtils.getCubicValue(t / P.Constants.FITTING_COUNT, pnt1, normals[i * 2], normals[i * 2 + 1], pnt2);
          points.push(pnt);
        }
        points.push(pnt2);
      }
      return points;
    };

    PlotUtils.getLeftMostControlPoint = function (controlPoints) {
      var pnt1 = controlPoints[0];
      var pnt2 = controlPoints[1];
      var pnt3 = controlPoints[2];
      var pnts = PlotUtils.getBisectorNormals(0, pnt1, pnt2, pnt3);
      var normalRight = pnts[0];
      var normal = PlotUtils.getNormal(pnt1, pnt2, pnt3);
      var dist = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1]);
      if (dist > P.Constants.ZERO_TOLERANCE) {
        var mid = PlotUtils.mid(pnt1, pnt2);
        var pX = pnt1[0] - mid[0];
        var pY = pnt1[1] - mid[1];

        var d1 = PlotUtils.distance(pnt1, pnt2);
        // normal at midpoint
        var n = 2.0 / d1;
        var nX = -n * pY;
        var nY = n * pX;

        // upper triangle of symmetric transform matrix
        var a11 = nX * nX - nY * nY;
        var a12 = 2 * nX * nY;
        var a22 = nY * nY - nX * nX;

        var dX = normalRight[0] - mid[0];
        var dY = normalRight[1] - mid[1];

        // coordinates of reflected vector
        var controlX = mid[0] + a11 * dX + a12 * dY;
        var controlY = mid[1] + a12 * dX + a22 * dY;
      } else {
        controlX = pnt1[0] + t * (pnt2[0] - pnt1[0]);
        controlY = pnt1[1] + t * (pnt2[1] - pnt1[1]);
      }
      return [controlX, controlY];
    };

    PlotUtils.getRightMostControlPoint = function (controlPoints) {
      var count = controlPoints.length;
      var pnt1 = controlPoints[count - 3];
      var pnt2 = controlPoints[count - 2];
      var pnt3 = controlPoints[count - 1];
      var pnts = PlotUtils.getBisectorNormals(0, pnt1, pnt2, pnt3);
      var normalLeft = pnts[1];
      var normal = PlotUtils.getNormal(pnt1, pnt2, pnt3);
      var dist = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1]);
      if (dist > P.Constants.ZERO_TOLERANCE) {
        var mid = PlotUtils.mid(pnt2, pnt3);
        var pX = pnt3[0] - mid[0];
        var pY = pnt3[1] - mid[1];

        var d1 = PlotUtils.distance(pnt2, pnt3);
        // normal at midpoint
        var n = 2.0 / d1;
        var nX = -n * pY;
        var nY = n * pX;

        // upper triangle of symmetric transform matrix
        var a11 = nX * nX - nY * nY;
        var a12 = 2 * nX * nY;
        var a22 = nY * nY - nX * nX;

        var dX = normalLeft[0] - mid[0];
        var dY = normalLeft[1] - mid[1];

        // coordinates of reflected vector
        var controlX = mid[0] + a11 * dX + a12 * dY;
        var controlY = mid[1] + a12 * dX + a22 * dY;
      } else {
        controlX = pnt3[0] + t * (pnt2[0] - pnt3[0]);
        controlY = pnt3[1] + t * (pnt2[1] - pnt3[1]);
      }
      return [controlX, controlY];
    };

    PlotUtils.getBezierPoints = function (points) {
      if (points.length <= 2) return points;

      var bezierPoints = [];
      var n = points.length - 1;
      for (var t = 0; t <= 1; t += 0.01) {
        var x = (y = 0);
        for (var index = 0; index <= n; index++) {
          var factor = PlotUtils.getBinomialFactor(n, index);
          var a = Math.pow(t, index);
          var b = Math.pow(1 - t, n - index);
          x += factor * a * b * points[index][0];
          y += factor * a * b * points[index][1];
        }
        bezierPoints.push([x, y]);
      }
      bezierPoints.push(points[n]);
      return bezierPoints;
    };

    PlotUtils.getBinomialFactor = function (n, index) {
      return PlotUtils.getFactorial(n) / (PlotUtils.getFactorial(index) * PlotUtils.getFactorial(n - index));
    };

    PlotUtils.getFactorial = function (n) {
      if (n <= 1) return 1;
      if (n == 2) return 2;
      if (n == 3) return 6;
      if (n == 4) return 24;
      if (n == 5) return 120;
      var result = 1;
      for (var i = 1; i <= n; i++) result *= i;
      return result;
    };

    PlotUtils.getQBSplinePoints = function (points) {
      if (points.length <= 2) return points;

      var n = 2;

      var bSplinePoints = [];
      var m = points.length - n - 1;
      bSplinePoints.push(points[0]);
      for (var i = 0; i <= m; i++) {
        for (var t = 0; t <= 1; t += 0.05) {
          var x = (y = 0);
          for (var k = 0; k <= n; k++) {
            var factor = PlotUtils.getQuadricBSplineFactor(k, t);
            x += factor * points[i + k][0];
            y += factor * points[i + k][1];
          }
          bSplinePoints.push([x, y]);
        }
      }
      bSplinePoints.push(points[points.length - 1]);
      return bSplinePoints;
    };

    PlotUtils.getQuadricBSplineFactor = function (k, t) {
      if (k == 0) return Math.pow(t - 1, 2) / 2;
      if (k == 1) return (-2 * Math.pow(t, 2) + 2 * t + 1) / 2;
      if (k == 2) return Math.pow(t, 2) / 2;
      return 0;
    };
    thisObject["naviMath"] = navi_utils;

    return thisObject;
  })();

  var DXPathUtils = (function () {
    var DXPathUtils = {};
    /**
     * 智能拼接URL，支持参数编码控制，不修改baseURL
     * @param {string} baseURL - 基础URL
     * @param {object|array} options - 参数对象或有序参数数组
     * @param {boolean} [encode=false] - 是否对参数值进行encodeURIComponent编码
     * @returns {string} 拼接后的URL
     */
    // function buildUrl(baseURL, options, encode) {
    //     if (!options || (Array.isArray(options) && options.length == 0) ||
    //         (!Array.isArray(options) && Object.keys(options).length == 0)) {
    //         return baseURL;
    //     }

    //     // 处理参数为数组或对象的情况
    //     let orderedParams = [];
    //     if (Array.isArray(options)) {
    //         orderedParams = options.map(item => {
    //             const key = Object.keys(item)[0];
    //             return { key, value: item[key] };
    //         });
    //     } else {
    //         orderedParams = Object.entries(options).map(([key, value]) => ({ key, value }));
    //     }

    //     // 解析基础URL，但不修改它
    //     const urlObj = new URL(baseURL);
    //     const pathSegments = urlObj.pathname.split('/').filter(segment => segment !== '');
    //     const isStaticPath = baseURL.endsWith('/');

    //     // 过滤已存在的参数值并应用编码
    //     const filteredParams = orderedParams.filter(param => {
    //         if (param.value == undefined) return false;
    //         const valueStr = String(param.value);
    //         return !pathSegments.includes(valueStr);
    //     }).map(param => {
    //         const value = String(param.value);
    //         return {
    //             key: param.key,
    //             value: encode ? encodeURIComponent(value) : value
    //         };
    //     });

    //     if (isStaticPath) {
    //         // 静态路径模式：/param1/param2/...
    //         let staticPath = baseURL;
    //         // 确保路径不以双斜杠结尾（除非baseURL本身就是这样）
    //         if (!staticPath.endsWith('/')) staticPath += '/';

    //         // 按顺序添加参数值
    //         for (const { value } of filteredParams) {
    //             staticPath += `${value}/`;
    //         }

    //         return staticPath;
    //     } else {
    //         // 查询参数模式：?param1=value1&param2=value2
    //         if (encode) {
    //             // 手动构建查询字符串，避免双重编码
    //             const queryString = filteredParams
    //                 .map(({ key, value }) => `${key}=${value}`)
    //                 .join('&');

    //             // 如果baseURL已有查询参数，合并它们
    //             const baseQuery = baseURL.split('?')[1] || '';
    //             const fullQuery = [baseQuery, queryString]
    //                 .filter(Boolean)
    //                 .join('&');

    //             return fullQuery ? `${baseURL.split('?')[0]}?${fullQuery}` : baseURL;
    //         } else {
    //             // 使用URLSearchParams自动编码
    //             const queryParams = new URLSearchParams();

    //             // 按顺序添加参数
    //             for (const { key, value } of filteredParams) {
    //                 queryParams.append(key, value);
    //             }

    //             // 合并原有查询参数
    //             const existingParams = new URLSearchParams(urlObj.search);
    //             existingParams.forEach((value, key) => {
    //                 if (!queryParams.has(key)) {
    //                     queryParams.append(key, value);
    //                 }
    //             });

    //             return `${urlObj.origin}${urlObj.pathname}?${queryParams.toString()}`;
    //         }
    //     }
    // }

    function buildUrl(baseURL, options, encode) {
      if (!options || (Array.isArray(options) && options.length == 0) || (!Array.isArray(options) && Object.keys(options).length == 0)) {
        return baseURL;
      }

      // 处理参数为数组或对象的情况
      var orderedParams = [];
      if (Array.isArray(options)) {
        orderedParams = options.map(function (item) {
          var key = Object.keys(item)[0];
          return { key: key, value: item[key] };
        });
      } else {
        orderedParams = Object["entries"](options).map(function (entry) {
          return { key: entry[0], value: entry[1] };
        });
      }

      // 解析基础URL，但不修改它

      if (baseURL.indexOf("://") != -1) {
        var urlObj = new URL(baseURL);
        var pathSegments = urlObj.pathname.split("/")["filter"](function (segment) {
          return segment !== "";
        });
        var isStaticPath = baseURL["endsWith"]("/");
      } else {
        return baseURL;
      }

      // 过滤已存在的参数值并应用编码
      var filteredParams = orderedParams
        .filter(function (param) {
          if (param.value == undefined) return false;
          var valueStr = String(param.value);
          return !(pathSegments["includes"](encodeURIComponent(valueStr)) || pathSegments["includes"](valueStr));
        })
        .map(function (param) {
          var value = String(param.value);
          return {
            key: param.key,
            value: encode ? encodeURIComponent(value) : value,
          };
        });

      if (isStaticPath) {
        // 静态路径模式：/param1/param2/...
        var staticPath = baseURL;
        // 确保路径不以双斜杠结尾（除非baseURL本身就是这样）
        if (!staticPath["endsWith"]("/")) staticPath += "/";

        // 按顺序添加参数值

        for (var i = 0; i < filteredParams.length; i++) {
          staticPath += filteredParams[i].value + "/";
        }

        return staticPath;
      } else {
        // 查询参数模式：?param1=value1&param2=value2
        if (encode) {
          // 手动构建查询字符串，避免双重编码
          var queryString = filteredParams.map(function (param) {
            return param.key + "=" + param.value;
          });

          // 如果baseURL已有查询参数，合并它们
          var baseQuery = baseURL.split("?")[1] || "";
          var fullQuery = [baseQuery, queryString].filter(Boolean).join("&");

          return fullQuery ? baseURL.split("?")[0] + "?" + fullQuery : baseURL;
        } else {
          // 使用URLSearchParams自动编码
          var queryParams = new URLSearchParams();

          // 按顺序添加参数
          for (var j = 0; j < filteredParams.length; j++) {
            queryParams.append(filteredParams[j].key, filteredParams[j].value);
          }

          // 合并原有查询参数
          var existingParams = new URLSearchParams(urlObj.search);
          existingParams.forEach(function (value, key) {
            if (!queryParams.has(key)) {
              queryParams.append(key, value);
            }
          });

          return urlObj.origin + urlObj.pathname + "?" + queryParams.toString();
        }
      }
    }

    function replaceUrlValues(baseUrl, options) {
      var result = baseUrl;
      Object.keys(options).forEach(function (key) {
        var value = options[key];
        // 使用正则表达式全局替换，但确保只替换完整路径段
        var regex = new RegExp("(^|/|\\?)" + escapeRegExp(key) + "($|/|&)");
        result = result.replace(regex, "$1" + value + "$2");
      });
      return result;
    }

    // function replaceUrlValues(baseUrl, options) {
    //     let result = baseUrl;
    //     for (const [value, placeholder] of Object.entries(options)) {
    //         // 使用正则表达式全局替换，但确保只替换完整路径段
    //         const regex = new RegExp(`(^|/|\\?)${escapeRegExp(value)}($|/|&)`);
    //         result = result.replace(regex, `$1${placeholder}$2`);
    //     }
    //     return result;
    // }

    // 辅助函数：转义正则表达式特殊字符
    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function normalizeDataPath(options) {
      var dataPathUrl = options["dataPath"] || options["mapDataPath"] || "/data/{{token}}/{{bdid}}/";
      var replaceOptions = {};
      replaceOptions[options["token"]] = "{{token}}";
      if (options["bdid"]) {
        replaceOptions[options["bdid"]] = "{{bdid}}";
      }
      //  replaceOptions["{{token}}"] = options["token"];
      // if (options["bdid"]) {
      //     replaceOptions["{{bdid}}"] = options["bdid"];
      // }else{
      //     replaceOptions["{{bdid}}"] = "appConfig";
      // }
      var replacedUrl = replaceUrlValues(dataPathUrl, replaceOptions);
      var ret = buildUrl(replacedUrl, [{ token: "{{token}}" }, { bdid: "{{bdid}}" }]);
      ret = decodeURIComponent(ret);
      return ret;
    }

    // function assignUrlParams(baseUrl, options) {
    //     return baseUrl.replace(/\{\{([^}]+)\}\}/g, (match, placeholder) => {
    //         return options[placeholder] !== undefined ? options[placeholder] : match;
    //     });
    // }
    function assignUrlParams(baseUrl, options) {
      return baseUrl.replace(/\{\{([^}]+)\}\}/g, function (match, placeholder) {
        return options[placeholder] !== undefined ? options[placeholder] : match;
      });
    }

    function getAppDataUrl(baseUrl, options) {
      console.log(options);
      var dataPathUrl = "";
      var fileName = options["version"] == "v2" ? "bdlist.json" : "map.json";
      if (dataPathUrl.indexOf("{{filename}}") != -1) {
        ("");
        dataPathUrl = baseUrl.replace("{{filename}}", fileName);
      } else {
        var isStaticPath = baseUrl["endsWith"]("/");
        dataPathUrl = baseUrl;
        if (isStaticPath) {
          dataPathUrl = assignUrlParams(baseUrl, { bdid: "appConfig" });
          dataPathUrl = DXMapUtils.joinPath(dataPathUrl, fileName);
        } else {
          dataPathUrl = assignUrlParams(baseUrl, { bdid: "" });
        }
      }
      return dataPathUrl;
    }

    function getMapDataUrl(baseUrl, options) {
      console.log(options);
      var dataPathUrl = "";
      var fileName = options["version"] == "v2" ? "bdlist.json" : "map.json";
      if (dataPathUrl.indexOf("{{filename}}") != -1) {
        ("");
        dataPathUrl = baseUrl.replace("{{filename}}", fileName);
      } else {
        var isStaticPath = baseUrl["endsWith"]("/");
        dataPathUrl = baseUrl;
        if (isStaticPath) {
          dataPathUrl = assignUrlParams(baseUrl, { bdid: options.buildingId });
          dataPathUrl = DXMapUtils.joinPath(dataPathUrl, fileName);
        } else {
          dataPathUrl = assignUrlParams(baseUrl, { bdid: "" });
        }
      }
      return dataPathUrl;
    }

    DXPathUtils.normalizeDataPath = normalizeDataPath;
    DXPathUtils.assignUrlParams = assignUrlParams;
    DXPathUtils.getAppDataUrl = getAppDataUrl;
    DXPathUtils.getMapDataUrl = getMapDataUrl;
    daximap["DXPathUtils"] = DXPathUtils;
  })();
  /**
   * 兼容ES5的简化版Zepto
   * 包含核心DOM操作、事件绑定、样式处理、AJAX和动画功能
   */
  (function (window) {
    // 工具函数
    var util = {
      // 类型检测
      isFunction: function (obj) {
        return typeof obj == "function";
      },
      isObject: function (obj) {
        return typeof obj == "object" && obj !== null;
      },
      isString: function (obj) {
        return typeof obj == "string";
      },
      isArray: function (obj) {
        return Object.prototype.toString.call(obj) == "[object Array]";
      },
      isNumeric: function (value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
      },

      // 合并对象
      extend: function (target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i];
          for (var key in source) {
            if (source.hasOwnProperty(key)) {
              target[key] = source[key];
            }
          }
        }
        return target;
      },

      // 数组化
      toArray: function (likeArray) {
        return Array.prototype.slice.call(likeArray);
      },

      // 转换为驼峰命名
      camelCase: function (str) {
        return str.replace(/-([a-z])/g, function (match, letter) {
          return letter.toUpperCase();
        });
      },
    };

    // 核心构造函数
    function Z(dom) {
      var len = dom ? dom.length : 0;
      for (var i = 0; i < len; i++) {
        this[i] = dom[i];
      }
      this.length = len;
    }

    // 选择器函数
    function DXDomUtil(selector) {
      if (!selector) return new Z();

      // 如果是Z实例，直接返回
      if (selector instanceof Z) return selector;

      // 如果是DOM元素，包装后返回
      if (selector.nodeType) {
        return new Z([selector]);
      }

      // 如果是函数，视为DOM就绪回调
      if (util.isFunction(selector)) {
        return DXDomUtil(document).ready(selector);
      }

      // 选择DOM元素
      var elements;
      if (util.isString(selector)) {
        elements = document.querySelectorAll(selector);
      }

      return new Z(util.toArray(elements));
    }

    // 动画相关工具函数
    var animationUtil = {
      // 生成动画样式
      generateAnimationStyles: function (params) {
        var duration = params.duration || 300; // 默认300ms
        var easing = params.easing || "ease"; // 默认缓动函数
        var delay = params.delay || 0; // 默认无延迟

        return {
          transition: "all " + duration + "ms " + easing + " " + delay + "ms",
          "-webkit-transition": "all " + duration + "ms " + easing + " " + delay + "ms",
        };
      },

      // 绑定过渡结束事件
      bindTransitionEnd: function (element, callback) {
        var endEvents = ["transitionend", "webkitTransitionEnd", "oTransitionEnd", "MSTransitionEnd"];

        var handler = function (e) {
          for (var i = 0; i < endEvents.length; i++) {
            element.removeEventListener(endEvents[i], handler);
          }
          if (util.isFunction(callback)) {
            callback.call(element, e);
          }
        };

        for (var i = 0; i < endEvents.length; i++) {
          element.addEventListener(endEvents[i], handler, false);
        }
      },
    };

    // 原型方法
    Z.prototype = {
      // DOM就绪
      ready: function (callback) {
        if (document.readyState == "complete") {
          callback(DXDomUtil);
        } else {
          var self = this;
          document.addEventListener(
            "DOMContentLoaded",
            function () {
              callback(DXDomUtil);
            },
            false
          );
        }
        return this;
      },

      // 事件绑定
      on: function (event, handler) {
        this.each(function (element) {
          element.addEventListener(event, handler, false);
        });
        return this;
      },

      // 事件解绑
      off: function (event, handler) {
        this.each(function (element) {
          element.removeEventListener(event, handler, false);
        });
        return this;
      },

      // 触发事件
      trigger: function (event) {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(event, true, true);
        this.each(function (element) {
          element.dispatchEvent(evt);
        });
        return this;
      },

      // 遍历元素
      each: function (callback) {
        for (var i = 0; i < this.length; i++) {
          callback.call(this[i], this[i], i);
        }
        return this;
      },

      // 获取/设置HTML内容
      html: function (html) {
        if (html == undefined) {
          return this[0] ? this[0].innerHTML : null;
        }
        return this.each(function (element) {
          element.innerHTML = html;
        });
      },

      // 获取/设置文本内容
      text: function (text) {
        if (text == undefined) {
          return this[0] ? this[0].textContent : null;
        }
        return this.each(function (element) {
          element.textContent = text;
        });
      },

      // 获取/设置属性
      attr: function (name, value) {
        if (value == undefined) {
          return this[0] ? this[0].getAttribute(name) : null;
        }
        return this.each(function (element) {
          element.setAttribute(name, value);
        });
      },

      // 移除属性
      removeAttr: function (name) {
        return this.each(function (element) {
          element.removeAttribute(name);
        });
      },

      // 添加类名
      addClass: function (className) {
        return this.each(function (element) {
          element.classList.add(className);
        });
      },

      // 移除类名
      removeClass: function (className) {
        return this.each(function (element) {
          element.classList.remove(className);
        });
      },

      // 切换类名
      toggleClass: function (className) {
        return this.each(function (element) {
          element.classList.toggle(className);
        });
      },

      // 获取/设置样式
      css: function (prop, value) {
        if (util.isObject(prop)) {
          return this.each(function (element) {
            util.extend(element.style, prop);
          });
        }
        if (value == undefined) {
          return this[0] ? getComputedStyle(this[0])[util.camelCase(prop)] : null;
        }
        var camelProp = util.camelCase(prop);
        var unitValue = value;
        if (util.isNumeric(value) && ["opacity", "zIndex", "fontWeight"].indexOf(camelProp) == -1) {
          unitValue = value + "px";
        }
        return this.each(function (element) {
          element.style[camelProp] = unitValue;
        });
      },

      // 获取/设置值
      val: function (value) {
        if (value == undefined) {
          return this[0] ? this[0].value : null;
        }
        return this.each(function (element) {
          element.value = value;
        });
      },

      // 查找子元素
      find: function (selector) {
        var elements = [];
        this.each(function (element) {
          var found = element.querySelectorAll(selector);
          elements = elements.concat(util.toArray(found));
        });
        return new Z(elements);
      },

      // 获取父元素
      parent: function () {
        var parents = [];
        this.each(function (element) {
          if (element.parentNode && parents.indexOf(element.parentNode) == -1) {
            parents.push(element.parentNode);
          }
        });
        return new Z(parents);
      },

      // 移除元素
      remove: function () {
        return this.each(function (element) {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
      },

      // 动画方法 - 使用CSS过渡实现
      animate: function (properties, options, callback) {
        // 处理参数
        if (util.isFunction(options)) {
          callback = options;
          options = {};
        }
        options = options || {};
        var self = this;

        // 为每个元素应用动画
        this.each(function (element, index) {
          // 保存原始过渡样式
          var originalTransition = element.style.transition || "";
          var originalWebkitTransition = element.style.webkitTransition || "";

          // 应用动画样式
          var animationStyles = animationUtil.generateAnimationStyles(options);
          for (var prop in animationStyles) {
            if (animationStyles.hasOwnProperty(prop)) {
              element.style[prop] = animationStyles[prop];
            }
          }

          // 绑定过渡结束事件
          animationUtil.bindTransitionEnd(element, function () {
            // 恢复原始过渡样式
            element.style.transition = originalTransition;
            element.style.webkitTransition = originalWebkitTransition;

            // 如果是最后一个元素且有回调函数，执行回调
            if (util.isFunction(callback) && index == self.length - 1) {
              callback.call(self);
            }
          });

          // 应用目标样式（触发过渡）
          setTimeout(function () {
            for (var prop in properties) {
              if (properties.hasOwnProperty(prop)) {
                var camelProp = util.camelCase(prop);
                var value = properties[prop];
                if (util.isNumeric(value) && ["opacity", "zIndex", "fontWeight"].indexOf(camelProp) == -1) {
                  element.style[camelProp] = value + "px";
                } else {
                  element.style[camelProp] = value;
                }
              }
            }
          }, 10); // 短暂的延迟确保过渡样式已应用
        });

        return this;
      },

      // 显示元素（带动画）
      show: function (duration, callback) {
        var self = this;
        return this.each(function (element) {
          // 保存原始display值
          var originalDisplay = element.getAttribute("data-original-display") || "block";

          // 如果有持续时间，使用动画
          if (duration) {
            element.style.opacity = "0";
            element.style.display = originalDisplay;

            self.animate({ opacity: "1" }, { duration: duration }, callback);
          } else {
            element.style.display = originalDisplay;
            if (util.isFunction(callback)) callback();
          }
        });
      },

      // 隐藏元素（带动画）
      hide: function (duration, callback) {
        var self = this;
        return this.each(function (element) {
          // 保存当前display值
          if (!element.getAttribute("data-original-display")) {
            var currentDisplay = getComputedStyle(element).display;
            if (currentDisplay !== "none") {
              element.setAttribute("data-original-display", currentDisplay);
            }
          }

          // 如果有持续时间，使用动画
          if (duration) {
            self.animate({ opacity: "0" }, { duration: duration }, function () {
              element.style.display = "none";
              if (util.isFunction(callback)) callback();
            });
          } else {
            element.style.display = "none";
            if (util.isFunction(callback)) callback();
          }
        });
      },

      // 淡入效果
      fadeIn: function (duration, callback) {
        if (util.isFunction(duration)) {
          callback = duration;
          duration = 300;
        } else if (duration == undefined) {
          duration = 300;
        }
        return this.show(duration, callback);
      },

      // 淡出效果
      fadeOut: function (duration, callback) {
        if (util.isFunction(duration)) {
          callback = duration;
          duration = 300;
        } else if (duration == undefined) {
          duration = 300;
        }
        return this.hide(duration, callback);
      },
    };

    // AJAX功能
    DXDomUtil.ajax = function (options) {
      var settings = util.extend(
        {
          url: "",
          method: "GET",
          data: null,
          dataType: "json",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          success: function () {},
          error: function () {},
        },
        options
      );

      var xhr = new XMLHttpRequest();
      xhr.open(settings.method, settings.url, true);

      // 设置请求头
      for (var key in settings.headers) {
        if (settings.headers.hasOwnProperty(key)) {
          xhr.setRequestHeader(key, settings.headers[key]);
        }
      }

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          var response = xhr.responseText;
          if (settings.dataType == "json") {
            try {
              response = JSON.parse(response);
            } catch (e) {
              return settings.error(xhr, "parsererror", e);
            }
          }
          settings.success(response, xhr.statusText, xhr);
        } else {
          settings.error(xhr, xhr.statusText, new Error("Request failed"));
        }
      };

      xhr.onerror = function () {
        settings.error(xhr, "error", new Error("Network error"));
      };

      // 处理数据
      var data = settings.data;
      if (data && typeof data == "object") {
        var dataArr = [];
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            dataArr.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]));
          }
        }
        data = dataArr.join("&");
      }

      xhr.send(data);
      return xhr;
    };

    // 快捷方法
    ["get", "post"].forEach(function (method) {
      DXDomUtil[method] = function (url, data, success, dataType) {
        if (util.isFunction(data)) {
          dataType = success;
          success = data;
          data = null;
        }
        return DXDomUtil.ajax({
          url: url,
          method: method,
          data: data,
          success: success,
          dataType: dataType,
        });
      };
    });

    // 暴露到window
    window.DXDomUtil = DXDomUtil;
  })(window);

  //////////////////////////////////////////////////////////////
  // DXMapUtils.domUtil
  //////////////////////////////////////////////////////////////
  DXMapUtils.domUtil = (function () {
    var thisObject = {};
    thisObject.notices = [];
    thisObject.dialogInstances = [];
    thisObject.dialogWithModalInstances = [];
    /**
     * 创建一个Dom对象
     * @param {*} params
     * @param {*} parentNode
     * @returns
     */
    thisObject.createDom = function (params, parentNode) {
      var tagName = params["tagName"];
      var attrs = params["attrs"];
      var children = params["children"];
      var text = params["text"];
      var dom = document.createElement(tagName);
      var events = params["events"];
      for (var key in attrs) {
        dom.setAttribute(key, attrs[key]);
      }
      if (text) {
        var textNode = document.createTextNode(text);
        dom.appendChild(textNode);
      }
      if (children) {
        children.forEach(function (childParams) {
          thisObject.createDom(childParams, dom);
        });
      }
      if (parentNode) {
        parentNode.appendChild(dom);
      }
      if (events) {
        events.forEach(function (item) {
          // if (item["eventName"] == "touchend") {
          dom.addEventListener(item["eventName"], item["callback"]);
          // } else {
          //     dom.addEventListener("click", item["callback"], false);
          // }
        });
      }
      return dom;
    };
    thisObject.createLoading = function () {
      var that = {};
      var domBody = document.body;
      var parentStyle =
        "background: rgb(0,0,0,0.8);position: absolute;top: 0px;bottom: 0px;left: 0px;right: 0px;z-index: 999;padding: 0px;margin: 0px;text-align: center;";
      that.dom = thisObject.createDom(
        {
          tagName: "div",
          attrs: {
            class: "loading",
            style: parentStyle,
          },
          children: [
            {
              tagName: "span",
              attrs: {
                class: "loading_content icon-loading",
                style: "display: inline-block;font-size: 58px;margin-top: 50%;color: #036bc5;",
              },
            },
            {
              tagName: "style",
              text: ".loading_content {animation: loadingKF 2.5s linear infinite;animation-play-state: running;}@keyframes loadingKF {0% {transform: rotate(0deg);} 50% {transform: rotate(180deg);} 100% {transform: rotate(360deg);}}",
              attrs: {
                type: "text/css",
              },
            },
          ],
        },
        domBody
      );

      that.show = function () {
        that.dom.style.display = "block";
      };
      that.hide = function () {
        that.dom.style.display = "none";
      };
      that.remove = function () {
        domBody.removeChild(that.dom);
      };
      return that;
    };

    thisObject.tipNotice = function (text, showTime, closeCallback, styleOptions) {
      // var domId = "notice"+(new Date().getTime()%10000);
      var that = {};
      //var domStr = '<p class="toice"><span class="content">'+text+'</span></p>';
      var domBody = document.body;
      var style = "position:absolute;z-index:20;margin:0 auto;bottom:50%;width:100%;text-align: center;";
      if (styleOptions) {
        for (var key in styleOptions) {
          if (key != "subStyle") {
            style += key + ":" + styleOptions[key] + ";";
          }
        }
      }
      var subSytle = { color: "rgb(110,110,110)", "background-color": "rgba(255,255,255,0.8)" };
      var subStyleStr = "";
      if (styleOptions && styleOptions["subStyle"]) {
        var _subStyle = styleOptions["subStyle"];
        for (var key2 in _subStyle) {
          subSytle[key2] = _subStyle[key2];
        }
      }
      for (var key in subSytle) {
        subStyleStr += key + ":" + subSytle[key] + ";";
      }

      that.dom = thisObject.createDom(
        {
          tagName: "p",
          attrs: {
            class: "notice dxnotice",
            style: style,
          },
          children: [
            {
              tagName: "span",
              text: text,
              attrs: {
                style: "line-height:2;padding:10px 20px;" + subStyleStr,
              },
            },
          ],
        },
        domBody
      );
      that.show = true;
      that.domDisplay = getComputedStyle(that.dom)["display"];
      that.show = function () {
        if (that.domDisplay == "none") {
          that.dom.style.display = "block";
        } else {
          that.dom.style.display = that.domDisplay;
        }
        that.show = true;
      };
      that.hide = function () {
        that && (that.dom.style.display = "none");
        that.show = false;
      };
      that.isShow = function () {
        return that.show;
      };
      that.removed = function () {
        if (!that) {
          return true;
        }
        return that.hasRemoved ? that.hasRemoved : false;
      };
      if (showTime) {
        setTimeout(function () {
          closeCallback && closeCallback();
          document.body.removeChild(that.dom);
          that.show = false;
          that.hasRemoved = true;
          that = null;
        }, showTime);
      }
      return that;
    };

    thisObject.createMessageDom = function (text, styleOptions, closeCB, extendChildren, parentDom) {
      parentDom = parentDom || document.body;
      //padding: 15px 10px;
      var style = "position:absolute;z-index:100;margin:0 auto;bottom:40%;width:100%;text-align: center;z-index: 100; font-size: 1.5rem;";
      if (styleOptions) {
        for (var key in styleOptions) {
          style += key + ":" + styleOptions[key] + ";";
        }
      }
      var domArr = [
        {
          tagName: "span",
          attrs: {
            class: "close icon-error",
            style: "position: absolute;right: 2px;top: 2px;font-size: 1.4rem;padding:4px;color: #525354;font-weight: 600;",
          },
          events: [
            {
              eventName: "click",
              callback: function () {
                closeCB && closeCB();
                if (parentDom && parentDom != document.body) {
                  document.body.removeChild(parentDom);
                } else {
                  document.body.removeChild(dom);
                }
              },
            },
          ],
        },
        {
          tagName: "p",
          attrs: {
            class: "messageBody", //margin: 12px auto 0px;margin-top: 12px;  max-width: 80%;
            style:
              "text-align: center;line-height: 1.5;margin-top: 0 auto;min-height:54px;display:flex;align-items: center;justify-content:center;white-space: break-spaces;" +
              (extendChildren ? "padding:10px;margin-top: 12px;" : "padding: 6px"),
          },
          children: [{ tagName: "span", text: text }],
        },
      ];
      if (DXMapUtils.isArray(extendChildren)) {
        extendChildren.forEach(function (item) {
          domArr.push(item);
        });
      } else if (extendChildren) {
        domArr.push(extendChildren);
      }
      var dom = thisObject.createDom(
        {
          tagName: "div",
          attrs: {
            class: "tipMessage dxtipMessage",
            style: style,
          },
          children: [
            {
              tagName: "div",
              attrs: {
                class: "message_container",
                style:
                  "background:rgba(255,255,255,1);border-radius:8px;display: inline-block;color:rgb(78,78,78);position: relative;min-width: 260px;max-width: 76%;box-shadow: -1px -1px 2px #ccc, 1px 1px 2px #ccc;",
              },
              children: domArr,
            },
          ],
        },
        parentDom
      );
      return dom;
    };

    thisObject.tipMessage = function (text, showTime, closeCallback, styleOptions) {
      var that = {};
      // var domBody = document.body;
      that.dom = thisObject.createMessageDom(text, styleOptions, function () {
        closeCallback && closeCallback();
        clearTimeout(that.timer);
        that = null;
      });
      that.domDisplay = getComputedStyle(that.dom)["display"];
      that.show = function () {
        if (that.domDisplay == "none") {
          that.dom.style.display = "block";
        } else {
          that.dom.style.display = that.domDisplay;
        }
      };
      that.hide = function () {
        that.dom.style.display = "none";
      };

      if (showTime) {
        that.timer = setTimeout(function () {
          if (that && that.dom) {
            closeCallback && closeCallback();
            document.body.removeChild(that.dom);
            that = null;
          }
        }, showTime);
      }
    };
    thisObject.geneDialogdom = function (params, domBody, that, parentDom) {
      var text = params["text"],
        confirmCB = params["confirmCB"],
        cancelCB = params["cancelCB"],
        cancelBtnText = params["btn1"] || "",
        comfirmBtnText = params["btn2"] || "确定",
        styleOptions = params["style"];
      var contentInfo = {
        tagName: "p",
        attrs: {
          class: "",
          style: "display: flex;justify-content: space-around;border-top: 1px solid #ccc;line-height: 2;font-size: 1.4rem;",
        },
        children: [],
      };
      if (cancelBtnText) {
        var cancelContent = {
          tagName: "span",
          text: cancelBtnText,
          attrs: {
            class: "cancel",
            style: "display: inline-block;flex: 1 1 auto;text-align: center;padding: 8px 0px 5px 0px;border-right: 1px solid #ccc;",
          },
          events: [
            {
              eventName: "click",
              callback: function () {
                cancelCB && cancelCB();
                parentDom.removeChild(that.dom);
              },
            },
          ],
        };
        contentInfo["children"].push(cancelContent);
      }
      if (confirmCB || params["btn2"]) {
        var comfirmContent = {
          tagName: "span",
          text: comfirmBtnText,
          attrs: {
            class: "commit",
            style: "display: inline-block;flex: 1 1 auto;text-align: center;padding: 8px 0px 5px 0px;color: rgb(1,123,214);",
          },
          events: [
            {
              eventName: "click",
              callback: function () {
                confirmCB && confirmCB();
                parentDom.removeChild(that.dom);
              },
            },
          ],
        };
        contentInfo["children"].push(comfirmContent);
      }
      if (contentInfo["children"].length == 2) {
        contentInfo["children"].forEach(function (item) {
          item["attrs"]["style"] += ";width:50%;";
        });
      }
      if (!styleOptions) {
        styleOptions = {};
      }
      styleOptions["margin-top"] = "10px";
      return thisObject.createMessageDom(text, styleOptions, cancelCB, contentInfo, domBody);
    };
    thisObject.dialog = function (params) {
      var that = {};
      var domBody = document.body;

      that.dom = thisObject.geneDialogdom(params, domBody, that, domBody);

      that.domDisplay = getComputedStyle(that.dom)["display"];
      that.show = function () {
        if (that.domDisplay == "none") {
          that.dom.style.display = "block";
        } else {
          that.dom.style.display = that.domDisplay;
        }
      };
      that.hide = function () {
        that.dom.style.display = "none";
      };
    };
    thisObject.creatDom = function (domString) {
      var domTips = document.getElementById("domTips");
      if (!domTips) {
        var dom = document.createElement("div");
        dom.id = "domTips";
        dom.style = "width:100%;height:100%;position:absolute;top:0px;left:0px;right:0px;bottom:0px;background:rgba(0,0,0,0.5);z-index: 100;";
        dom.innerHTML = domString;
        document.body.append(dom);
        domTips = document.getElementById("domTips");
      }
      return domTips;
    };
    thisObject.tipDomMessage = function (domString) {
      var that = {};
      that.dom = thisObject.creatDom(domString);
      that.domDisplay = getComputedStyle(that.dom)["display"];
      that.show = function () {
        if (that.domDisplay == "none") {
          that.dom.style.display = "block";
        } else {
          that.dom.style.display = that.domDisplay;
        }
      };
      that.hide = function () {
        that.dom.style.display = "none";
      };
      that["show"] = that.show;
      that["hide"] = that.hide;
      that.show();
      return that;
    };
    thisObject.dialogWithModal = function (params) {
      var that = {};
      var domBody = document.body;
      var wrapper = {
        tagName: "div",
        attrs: {
          class: "wrapper",
          style: "position:absolute;top:0px;left:0px;right:0px;bottom:0px;background:rgba(0,0,0,0.5);z-index: 9999;",
        },
      };
      that.dom = thisObject.createDom(wrapper, domBody);

      thisObject.geneDialogdom(params, that.dom, that, domBody);
      that.domDisplay = getComputedStyle(that.dom)["display"];
      that.show = function () {
        if (that.domDisplay == "none") {
          that.dom.style.display = "block";
        } else {
          that.dom.style.display = that.domDisplay;
        }
      };
      that.hide = function () {
        that.dom.style.display = "none";
      };
    };
    thisObject.createListView = function (params, parentDom, update) {
      var confirmCB = params["confirmCB"],
        cancelCB = params["cancelCB"],
        onItemSelected = params["onItemSelected"];
      var list = params["list"];
      styleOptions = params["style"];
      var contentInfo = {
        tagName: "ul",
        attrs: {
          class: "component_list",
          style:
            "display: flex;justify-content: space-around;font-size: 1.4rem;flex-direction: column;background: #fff;border-radius: 6px;max-height: 80%;overflow: scroll;",
        },
        children: [],
      };
      list.forEach(function (item) {
        var itemDom = {
          tagName: "li",
          attrs: {
            class: "component_item",
            // "style":"display: flex;justify-content: space-around;border-top: 1px solid #ccc;line-height: 2;font-size: 1.4rem;"
          },
          text: item["text"],
          events: [
            {
              eventName: "click",
              callback: function (e) {
                onItemSelected && onItemSelected(e);
              },
            },
          ],
        };
        for (var key in item) {
          if (item[key] != undefined && key != "text") {
            itemDom["attrs"]["data" + "-" + key] = item[key];
          }
        }
        contentInfo["children"].push(itemDom);
      });
      var wrapperInfo = {
        tagName: "div",
        attrs: {
          class: "content",
          style: "text-align: center;vertical-align: middle;display: flex;flex-direction: column;height: 100%;justify-content: center;align-items: center;",
        },
        children: [contentInfo],
      };
      if (update) {
        parentDom.html(wrapperInfo);
      } else {
        return thisObject.createDom(wrapperInfo, parentDom, update);
      }
    };
    thisObject.listViewWithModal = function (params) {
      var that = {};
      var domBody = document.body;
      var wrapper = {
        tagName: "div",
        attrs: {
          class: "wrapper",
          style: "position:absolute;top:0px;left:0px;right:0px;bottom:0px;background:rgba(0,0,0,0.5);z-index: 9999;",
        },
      };
      that.dom = thisObject.createDom(wrapper, domBody);

      thisObject.createListView(params, that.dom);
      that.domDisplay = getComputedStyle(that.dom)["display"];
      that.updateData = function (params) {
        that.dom.children[0].remove();
        thisObject.createListView(params, that.dom);
        // thisObject.createListView({"list":datas},that.dom,true);
      };
      that.show = function () {
        if (that.domDisplay == "none") {
          that.dom.style.display = "block";
        } else {
          that.dom.style.display = that.domDisplay;
        }
      };
      that.hide = function () {
        that.dom.style.display = "none";
      };

      return that;
    };

    thisObject["createDom"] = thisObject.createDom;
    thisObject["tipNotice"] = thisObject.tipNotice;
    thisObject["tipMessage"] = thisObject.tipMessage;
    thisObject["tipDomMessage"] = thisObject.tipDomMessage;
    thisObject["dialog"] = thisObject.dialog;
    thisObject["dialogWithModal"] = thisObject.dialogWithModal;
    thisObject["createLoading"] = thisObject.createLoading;
    thisObject["createListView"] = thisObject.createListView;
    thisObject["listViewWithModal"] = thisObject.listViewWithModal;
    return thisObject;
  })();
  DXMapUtils["domUtil"] = DXMapUtils.domUtil;

  function getBrowser() {
    if (/MicroMessenger/.test(window.navigator.userAgent)) {
      return "WEIXIN";
    } else if (/AlipayClient/.test(window.navigator.userAgent)) {
      return "ALIPAY";
    } else {
      return "other";
    }
  }

  //////////////////////////////////////////////////////////////
  // DXDownloader
  //////////////////////////////////////////////////////////////
  var DXDownloader = function (map) {
    var proto = DXDownloader.prototype;
    proto["getData"] = function (url, method, dataType, data, successCB, errorCB, func) {
      return DXMapUtils.getData(url, data, dataType, successCB, errorCB, func); //
      // DXMapUtils.getDataBySecurityRequest(url, method, data, successCB, errorCB, func);
    };
    proto["getPackageData"] = function (url, method, dataType, data, successCB, errorCB, func) {
      return DXMapUtils.getData(url, data, dataType, successCB, errorCB, func);
    };
    proto["getServiceData"] = function (url, method, dataType, data, successCB, errorCB, func) {
      return DXMapUtils.getData(url, data, dataType, successCB, errorCB, func);
    };
    proto["requestData"] = function (url, method, dataType, data, successCB, errorCB, func) {
      return DXMapUtils.getDataBySecurityRequest(url, method, data, successCB, errorCB, func);
    };
    proto.requestData = function (url, method, dataType, data, successCB, errorCB, func) {
      return DXMapUtils.getDataBySecurityRequest(url, method, data, successCB, errorCB, func);
    };
    proto["requestData"] = proto.requestData;
  };

  //////////////////////////////////////////////////////////////
  // MapSearch
  //////////////////////////////////////////////////////////////
  var MapSearch = function (options) {
    var thisObject = this;
    options = options || {};

    thisObject._token = options.token || daximap["token"] || "";
    thisObject._defaultUrl = options["url"] || "https://map1a.daxicn.com/search2/search-query-v6/user/s";
    thisObject._downloader = options["downloader"] || null;
    thisObject.count = 0;
    thisObject.result = 0;

    var proto = MapSearch.prototype;
    thisObject.request = DXMapUtils.getHttpObject();
    proto["query"] = function (options, successCB, failedCB) {
      // var url = options["url"] || "http://123.206.49.147/query/search-query-v4/user/s";//"https://map1a.daxicn.com/daxi/query/search-query-v4/user/s";;
      var url = options["url"] || thisObject._defaultUrl;
      var token = options["token"] || thisObject._token;
      var bdid = options["bdid"];
      // var arealType = options["arealType"] || "indoor";
      var keyword = options["keyword"];
      var featureIds = options["featureIds"];
      var lon = options["lon"];
      var lat = options["lat"];
      var ct = options["count"] || 200;
      var floorId = options["floorId"] || "";
      var type = options["type"];
      var circle = options["circle"];
      var radius = options["radius"];
      var textarraycount = options["textarraycount"];
      // 搜索参数

      var searchOptions = { token: token, ct: ct };
      searchOptions["bdid"] = bdid;
      if (floorId) {
        searchOptions["flid"] = floorId;
      }
      if (keyword) {
        // searchOptions["keyword"] = keyword;
        searchOptions["text"] = keyword;
      }
      if (featureIds) {
        searchOptions["ids"] = featureIds.split(",");
      }
      if (!type) {
        searchOptions["ids"] ? "" : bdid ? (type = 1) : (type = 11);
      }
      searchOptions["dataType"] = type;
      if (textarraycount) {
        searchOptions["textarraycount"] = textarraycount;
      }

      if (lon && lat) {
        searchOptions["location"] = lon + "," + lat;
      }
      if (radius || circle) {
        searchOptions["geo"] = { type: "Circle", radius: radius || circle };
      }
      if (options["geo"]) {
        searchOptions["geo"] = options["geo"];
      }
      if (options["floorlimit"] != undefined) {
        searchOptions["floorlimit"] = options["floorlimit"];
      }
      if (options["ac"] != undefined) {
        searchOptions["ac"] = options["ac"];
      }
      if (options["sortpoint"] != undefined) {
        searchOptions["sortpoint"] = options["sortpoint"];
      }
      if (options["key"]) {
        searchOptions["key"] = options["key"];
      }
      if (options["types"]) {
        searchOptions["types"] = options["types"];
      }
      this.count++;
      // var myPositionInfo = options["myPositionInfo"];

      this._sendQuery(
        url,
        searchOptions,
        true,
        function (data) {
          var result;
          if (typeof data == "string") {
            if (data == "") {
              result = [];
            } else {
              result = JSON.parse(data);
            }
          } else {
            result = data;
          }
          if (result && result.length && !options["hideDis"]) {
            result.forEach(function (item) {
              var distance = item["distance"];
              if (!options["showRawDis"] && options["myPositionInfo"] && options["myPositionInfo"]["position"][0]) {
                var distance = ~~DXMapUtils["naviMath"].getGeodeticCircleDistance(
                  { x: item["lon"], y: item["lat"] },
                  { x: options["myPositionInfo"]["position"][0], y: options["myPositionInfo"]["position"][1] }
                );
                distanceDes = DXMapUtils.distanceToText(distance);
                item["distanceDes"] = distanceDes;
              } else {
                if (distance && searchOptions["location"]) {
                  var distanceDes = "";
                  if (typeof distance == "number" || typeof distance == "string") {
                    distanceDes = DXMapUtils.distanceToText(distance);
                  } else if (typeof distance == "object" && distance["distance"] != undefined) {
                    distanceDes = DXMapUtils.distanceToText(distance["distance"]);
                  }
                  item["distanceDes"] = distanceDes;
                }
              }
            });
          }
          successCB(result);
        },
        failedCB,
        function () {
          failedCB && failedCB({ error: "timeout" });
        }
      );
    };
    proto._sendQuery = function (url, queryData, isAsync, onSuccess, onFailed, onTimeout) {
      if (window["downloader"]) {
        if (this.request) {
          try {
            this.request.responseType = "";
          } catch (e) {}
          this.request.abort();
        }
        this.request = window["downloader"]["getServiceData"](url, "post", "json", queryData, onSuccess, onFailed);
      } else {
        try {
          this.request.responseType = "";
        } catch (e) {}
        this.request.abort();
        this.request.responseType = "json";
        this.request.timeout = 150000;
        this.request.ontimeout = function (e) {
          if (onTimeout) {
            onTimeout();
          } else if (onFailed) {
            onFailed({ ret: "ERROR", code: -1, errMsg: "timeout" });
          }
        };
        this.request.onreadystatechange = function () {
          var request = this;
          if (request.readyState == 4) {
            // success
            if (request.status !== 0 && request.status !== 200 && request.status !== 304) {
              onFailed && onFailed(request.response);
            } else {
              var result = [];
              if (request.response) {
                if (typeof request.response == "string") {
                  result = JSON.parse(request.response);
                } else {
                  result = request.response;
                }
              }
              onSuccess && onSuccess(result);
            }
          }
        };
        this.request.open("POST", url, isAsync);
        this.request.setRequestHeader("Content-Type", "application/json");
        this.request.send(JSON.stringify(queryData));
        if (isAsync == false) {
          return this.request.response;
        }
      }
    };
    proto.cancel = function () {
      if (this.request) {
        try {
          this.request.responseType = "";
        } catch (e) {}
        this.request.abort();
      }
    };
    proto["cancel"] = proto.cancel;
  };

  //////////////////////////////////////////////////////////////
  // MapRouteSearch
  //////////////////////////////////////////////////////////////
  var MapRouteSearch = function (options) {
    var thisObject = this;
    options = options || {};
    thisObject._token = options.token || daximap["token"] || "";
    thisObject._defaultUrl = options["url"] || "https://map1a.daxicn.com/RouteServiceForMetro39/route";
    thisObject._downloader = options["downloader"] || null;

    var proto = MapRouteSearch.prototype;
    proto["query"] = function (options, successCB, failedCB) {
      var url = options["routeUrl"] || thisObject._defaultUrl;
      var token = options["token"] || thisObject._token;
      var startPos = options["startPos"];
      var stopPos = options["stopPos"];
      var stategy = options["stategy"] || 1;
      var transittype = options["transittype"] || 5;
      if (!startPos["lon"] || !startPos["lat"] || stopPos["lon"] || stopPos["lat"]) {
        failedCB && failedCB({ code: -1, errMsg: "起终点坐标不能为空!" });
        return;
      }
      var params = {
        token: options["token"] || token || "",
        startbdid: startPos["bdid"] || "",
        startfloor: startPos["floorId"] || "",
        startx: startPos["lon"],
        starty: startPos["lat"],
        stopbdid: stopPos["bdid"] || "",
        stopfloor: stopPos["floorId"] || "",
        stopx: stopPos["lon"],
        stopy: stopPos["lat"],
        strategy: stategy,
        transittype: transittype,
        includeStartEnd: options["includeStartEnd"],
      };
      if (!thisObject._downloader) {
        thisObject._downloader = new DXDownloader();
      }
      thisObject._downloader["getData"](
        url,
        "GET",
        "json",
        params,
        function (data) {
          var result;
          if (typeof data == "string") {
            if (data == "") {
              result = { code: -1 };
            } else {
              result = JSON.parse(data);
            }
          } else {
            result = data;
          }
          successCB(result);
        },
        failedCB
      );
    };
  };
  function parseDom(htmlString, contentType) {
    // 创建解析器
    var parser = new DOMParser();
    if (!contentType) {
      contentType = "text/html";
    }
    // 根据内容类型解析
    if (contentType == "text/html") {
      var doc = parser.parseFromString(htmlString, contentType);
      // 返回body的子节点集合
      var fragment = document.createDocumentFragment();
      var childNodes = doc.body.childNodes;
      for (var i = 0; i < childNodes.length; i++) {
        fragment.appendChild(childNodes[i]);
      }
      return fragment;
    } else {
      // 解析XML/SVG等
      return parser.parseFromString(htmlString, contentType);
    }
  }
  daximap["parseDom"] = parseDom;
  daximap["Cross"] = Cross;
  daximap["EventHandler"] = EventHandler;
  daximap["EventHandlerManager"] = EventHandlerManager;
  daximap["DXMapUtils"] = DXMapUtils;
  daximap["Search"] = MapSearch;
  daximap["MapRouteSearch"] = MapRouteSearch;
  daximap["DXDownloader"] = DXDownloader;
  daximap["browser"] = getBrowser();
  daximap["createCrossDomainBridge"] = function (global) {
    var thisObject = {
      signalHandler: {},
      targetWindow: undefined,
      targetDomain: "",
      init: function (twin, tdomain) {
        this.targetWindow = twin;
        this.targetDomain = tdomain;
        // $(window)["on"]("message",thisObject.messageHandle);
        global.addEventHandler("message", this.messageHandle);
      },
      on: function (signal, func) {
        this.signalHandler[signal] = func;
      },
      off: function (signal) {
        if (this.signalHandler[signal]) {
          delete this.signalHandler[signal];
        }
      },
      destory: function () {
        global.removeEventListener("message", this.messageHandle);
        // $(window)["off"]("message",thisObject.messageHandle);
      },

      call: function (signal, data, callbackfunc) {
        var notice = { signal: signal, data: data };
        if (!!callbackfunc) {
          notice["callback"] = "callback_" + new Date().getTime() + Math.random();
          Cross["on"](notice["callback"], callbackfunc);
        }
        var noticeStr = JSON.stringify(notice);
        thisObject.targetWindow["postMessage"](noticeStr, thisObject.targetDomain);
      },
      callEx: function (win, domain, signal, data, callbackfunc) {
        var notice = { signal: signal, data: data };
        if (!!callbackfunc) {
          notice["callback"] = "callback_" + new Date().getTime() + Math.random();
          Cross["on"](notice["callback"], callbackfunc);
        }
        var noticeStr = JSON.stringify(notice);
        win["postMessage"](noticeStr, domain);
      },
      messageHandle: function (e) {
        //var realEvent = e.originalEvent,

        var realEvent = e["originalEvent"] || e,
          data = realEvent["data"],
          swin = realEvent["source"],
          origin = realEvent["origin"],
          protocol;
        try {
          if (typeof data == "string") {
            protocol = JSON.parse(data);
          } else {
            protocol = data;
          }
          if (thisObject.signalHandler[protocol["signal"]]) {
            var result = thisObject.signalHandler[protocol["signal"]]["call"](null, protocol["data"], {
              swin: swin,
              origin: origin,
              callback: protocol["callback"],
            });
            if (result !== undefined) {
              if (!!protocol["callback"]) {
                thisObject["call"](swin, origin, protocol["callback"], { result: result });
              }
              if (/^callback_/.test(protocol["signal"])) {
                delete thisObject.signalHandler[protocol["signal"]];
              }
            }
          } else {
            var params = protocol["data"]["data"];
            var method = protocol["data"]["method"];
            global[method] && global[method](params);
          }
        } catch (e) {
          console.log(e);
          throw new Error("cross error.");
        }
      },
    };
    return thisObject;
  };

  daximap.DXRouteCircelSampler = (function () {
    var SamplerUtils = {};
    SamplerUtils.resamplerJSON = function (t, e) {
      if (!t || !t.features) return t;
      if (d && e && t.features.length == d.features.length) {
        for (var n = o.default.point(e), a = d.features, i = [], r = 0, s = a.length; r < s; r++) {
          var u = a[r],
            l = u.geometry.coordinates.slice(-1)[0];
          l = o.default.point(l);
          var f = (0, c.default)(n, l, u);
          (f.properties = u.properties), f.geometry.coordinates.splice(-1), i.push(f);
        }
        return o.default.featureCollection(i);
      }

      var h = [],
        p = [],
        A = t.features.length;
      for (var m = 0; m < A; m++) {
        var y = t.features[m],
          b = y.geometry.coordinates,
          T = (b = g(b))[0],
          w = [T],
          S = b[1],
          O = b.length;
        for (var k = 1; k < O - 1; k++) {
          k > 1 && (T = w.slice(-1)[0]), (S = b[k]);
          var M = b[k + 1];
          var C = SamplerUtils.resamplerCorner(T, S, M);
          if (C) {
            w = w.concat(C.geometry.coordinates);
          }
        }
        w.push(b.slice(-1)[0]);
        h[m] = w;
        p[m] = y.properties;
      }

      var R = [],
        L = h.length;
      for (var I = 0; I < L; I++) {
        var _ = SamplerUtils.createLineString(h[I]);
        (_.properties = p[I]), (R[I] = _);
      }
      var x = SamplerUtils.createfeatureCollection(R);
      d = x;
      return x;
    };

    SamplerUtils["resampler"] = SamplerUtils.resampler = function (t, e) {
      if (!t) return t;
      var h = [],
        A = 1;
      for (var m = 0; m < A; m++) {
        var b = t,
          T = (b = g(b))[0],
          w = [T],
          S = b[1],
          O = b.length;
        for (var k = 1; k < O - 1; k++) {
          k > 1 && (T = w.slice(-1)[0]), (S = b[k]);
          var M = b[k + 1];
          var C = SamplerUtils.resamplerCorner(T, S, M);
          if (C) {
            w = w.concat(C.geometry.coordinates);
          }
        }
        w.push(b.slice(-1)[0]);
        h[m] = w;
      }
      return h;
    };

    function g(t) {
      var e,
        n,
        a,
        o = [],
        i = t[0];
      o.push(i);
      var p = 7;
      for (var r = 1, u = t.length; r < u - 1; r++) {
        i = o[o.length - 1];
        var l = t[r],
          c = t[r + 1];
        ((e = i), (n = l), (a = c), SamplerUtils.diffAngel(SamplerUtils.calcAngel(e, n), SamplerUtils.calcAngel(n, a))) > p && o.push(l);
      }
      return o.push(t[t.length - 1]), o;
    }

    SamplerUtils.getCoord = function (e) {
      if (!e) throw new Error("coord is required");
      if (!Array.isArray(e)) {
        if ("Feature" == e.type && null !== e.geometry && "Point" == e.geometry.type) return e.geometry.coordinates;
        if ("Point" == e.type) return e.coordinates;
      }
      if (Array.isArray(e) && e.length >= 2 && !Array.isArray(e[0]) && !Array.isArray(e[1])) return e;
      throw new Error("coord must be GeoJSON Point or an Array of numbers");
    };

    SamplerUtils.getCoord2 = function (e) {
      if (!e) throw new Error("obj is required");
      var t = r(e);
      if (t.length > 1 && "number" == typeof t[0] && "number" == typeof t[1]) return t;
      throw new Error("Coordinate is not a valid Point");
    };

    SamplerUtils.radiansToDegrees = function (e) {
      return (180 * (e % (2 * Math.PI))) / Math.PI;
    };
    SamplerUtils.degreesToRadians = function (e) {
      return ((e % 360) * Math.PI) / 180;
    };

    SamplerUtils.params = {
      miles: 3960,
      nauticalmiles: 3441.145,
      degrees: 57.2957795,
      radians: 1,
      inches: 250905600,
      yards: 6969600,
      meters: 6373000,
      metres: 6373000,
      centimeters: 637300000,
      centimetres: 637300000,
      kilometers: 6373,
      kilometres: 6373,
      feet: 20908792.65,
    };
    SamplerUtils.radiansToDistance = function (e, t) {
      if (void 0 == e || null == e) throw new Error("radians is required");
      var r = SamplerUtils.params[t || "kilometers"];
      if (!r) throw new Error("units is invalid");
      return e * r;
    };

    SamplerUtils.distanceToRadians = function (e, t) {
      if (void 0 == e || null == e) throw new Error("distance is required");
      var r = SamplerUtils.params[t || "kilometers"];
      if (!r) throw new Error("units is invalid");
      return e / r;
    };

    SamplerUtils.isValid = function (e) {
      return !isNaN(e) && null !== e && !Array.isArray(e);
    };

    SamplerUtils.toPoint = function (e, t, n, o) {
      if (!e) throw new Error("No coordinates passed");
      if (void 0 == e.length) throw new Error("Coordinates must be an array");
      if (e.length < 2) throw new Error("Coordinates must be at least 2 numbers long");
      if (!SamplerUtils.isValid(e[0]) || !SamplerUtils.isValid(e[1])) throw new Error("Coordinates must contain numbers");
      return SamplerUtils.toFeature(
        {
          type: "Point",
          coordinates: e,
        },
        t,
        n,
        o
      );
    };

    SamplerUtils.createLineString = function (e, t, n, o) {
      if (!e) throw new Error("No coordinates passed");
      if (e.length < 2) throw new Error("Coordinates must be an array of two or more positions");
      if (!SamplerUtils.isValid(e[0][1]) || !SamplerUtils.isValid(e[0][1])) throw new Error("Coordinates must contain numbers");
      return SamplerUtils.toFeature(
        {
          type: "LineString",
          coordinates: e,
        },
        t,
        n,
        o
      );
    };

    SamplerUtils.toFeature = function (e, t, r, n) {
      if (void 0 == e) throw new Error("geometry is required");
      if (t && t.constructor !== Object) throw new Error("properties must be an Object");
      if (r && 4 !== r.length) throw new Error("bbox must be an Array of 4 numbers");
      if (n && -1 == ["string", "number"].indexOf(typeof n)) throw new Error("id must be a number or a string");
      var o = {
        type: "Feature",
      };
      return n && (o.id = n), r && (o.bbox = r), (o.properties = t || {}), (o.geometry = e), o;
    };

    SamplerUtils.getFirstCoordReverse = function (e) {
      if (e.length > 1 && "number" == typeof e[0] && "number" == typeof e[1]) return !0;
      if (Array.isArray(e[0]) && e[0].length) return SamplerUtils.getFirstCoordReverse(e[0]);
      throw new Error("coordinates must only contain numbers");
    };
    SamplerUtils.getCoordFromFeature = function (e) {
      if (!e) throw new Error("obj is required");
      var t;
      if ((e.length ? (t = e) : e.coordinates ? (t = e.coordinates) : e.geometry && e.geometry.coordinates && (t = e.geometry.coordinates), t))
        return SamplerUtils.getFirstCoordReverse(t), t;
      throw new Error("No valid coordinates");
    };
    // var d, h = .002,p = 7;
    SamplerUtils.calcAngel = function (e, t, r) {
      if ((void 0 == r && (r = {}), !0 == r.final))
        return (function (e, t) {
          var r = i(t, e);
          return (r = (r + 180) % 360);
        })(e, t);

      var a = SamplerUtils.getCoord(e),
        s = SamplerUtils.getCoord(t),
        u = SamplerUtils.degreesToRadians(a[0]),
        c = SamplerUtils.degreesToRadians(s[0]),
        f = SamplerUtils.degreesToRadians(a[1]),
        l = SamplerUtils.degreesToRadians(s[1]),
        d = Math.sin(c - u) * Math.cos(l),
        h = Math.cos(f) * Math.sin(l) - Math.sin(f) * Math.cos(l) * Math.cos(c - u);
      return SamplerUtils.radiansToDegrees(Math.atan2(d, h));
    };

    SamplerUtils.diffAngel = function (t, e) {
      var n = Math.abs(t - e);
      return n > 180 ? 360 - n : n;
    };

    SamplerUtils.addAngel = function (t, e) {
      var n = t + e;
      return n > 180 ? (n -= 360) : n < -180 && (n += 360), n;
    };

    // var n = r(20).getCoord,
    //          o = r(7).radiansToDistance;
    SamplerUtils.geographicsToLocal = function (e, t, r) {
      var i = Math.PI / 180,
        a = SamplerUtils.getCoord(e),
        s = SamplerUtils.getCoord(t),
        u = i * (s[1] - a[1]),
        c = i * (s[0] - a[0]),
        f = i * a[1],
        l = i * s[1],
        d = Math.pow(Math.sin(u / 2), 2) + Math.pow(Math.sin(c / 2), 2) * Math.cos(f) * Math.cos(l);
      return SamplerUtils.radiansToDistance(2 * Math.atan2(Math.sqrt(d), Math.sqrt(1 - d)), r);
    };

    // var n = r(20).getCoord,
    //          o = r(7),
    //          i = o.point,
    //          a = o.distanceToRadians;
    SamplerUtils.localToGeographics = function (e, t, r, o) {
      var s = Math.PI / 180,
        u = 180 / Math.PI,
        c = SamplerUtils.getCoord(e),
        f = s * c[0],
        l = s * c[1],
        d = s * r,
        h = SamplerUtils.distanceToRadians(t, o),
        p = Math.asin(Math.sin(l) * Math.cos(h) + Math.cos(l) * Math.sin(h) * Math.cos(d)),
        v = f + Math.atan2(Math.sin(d) * Math.sin(h) * Math.cos(l), Math.cos(h) - Math.sin(l) * Math.sin(p));
      return SamplerUtils.toPoint([u * v, u * p]);
    };

    SamplerUtils.createfeatureCollection = function (e, t, r) {
      if (!e) throw new Error("No features passed");
      if (!Array.isArray(e)) throw new Error("features must be an Array");
      if (t && 4 !== t.length) throw new Error("bbox must be an Array of 4 numbers");
      if (r && -1 == ["string", "number"].indexOf(typeof r)) throw new Error("id must be a number or a string");
      var n = {
        type: "FeatureCollection",
      };
      return r && (n.id = r), t && (n.bbox = t), (n.features = e), n;
    };

    SamplerUtils.l = function (e, t) {
      var r = SamplerUtils.getCoordFromFeature(e),
        n = SamplerUtils.getCoordFromFeature(t);
      if (2 !== r.length) throw new Error("<intersects> line1 must only contain 2 coordinates");
      if (2 !== n.length) throw new Error("<intersects> line2 must only contain 2 coordinates");
      var o = r[0][0],
        i = r[0][1],
        s = r[1][0],
        c = r[1][1],
        f = n[0][0],
        l = n[0][1],
        d = n[1][0],
        h = n[1][1],
        p = (h - l) * (s - o) - (d - f) * (c - i),
        v = (d - f) * (i - l) - (h - l) * (o - f),
        y = (s - o) * (i - l) - (c - i) * (o - f);
      if (0 == p) return null;
      var m = v / p,
        g = y / p;
      return m >= 0 && m <= 1 && g >= 0 && g <= 1 ? SamplerUtils.toPoint([o + m * (s - o), i + m * (c - i)]) : null;
    };

    SamplerUtils.e = function (e, t) {
      var r = {},
        n = [];
      if (
        ("LineString" == e.type && (e = SamplerUtils.toFeature(e)),
        "LineString" == t.type && (t = SamplerUtils.toFeature(t)),
        "Feature" == e.type &&
          "Feature" == t.type &&
          "LineString" == e.geometry.type &&
          "LineString" == t.geometry.type &&
          2 == e.geometry.coordinates.length &&
          2 == t.geometry.coordinates.length)
      ) {
        var u = SamplerUtils.l(e, t);
        return u && n.push(u), SamplerUtils.createfeatureCollection(n);
      }
      // var d = o();
      // return d.load(s(t)), c(s(e), function(e) {
      //  c(d.search(e), function(t) {
      //      var o = l(e, t);
      //      if (o) {
      //          var i = a(o).join(",");
      //          r[i] || (r[i] = !0, n.push(o))
      //      }
      //  })
      // }), f(n)
    };

    SamplerUtils.normalizeAngel = function (t) {
      return t < 0 && (t += 360), t;
    };
    SamplerUtils.normalizeAngel2 = function (e) {
      var t = e % 360;
      return t < 0 && (t += 360), t;
    };

    // var n = r(50),
    //  o = r(7).polygon;
    var xxx = function (e, t, r, i, a) {
      if (!e) throw new Error("center is required");
      if (!t) throw new Error("radius is required");
      (r = r || 64), (a = a || e.properties || {});
      for (var s = [], u = 0; u < r; u++) s.push(SamplerUtils.localToGeographics(e, t, (360 * u) / r, i).geometry.coordinates);
      return s.push(s[0]), o([s], a);
    };

    SamplerUtils.Interpolation = function (e, t, r, s, u, c) {
      if (!e) throw new Error("center is required");
      if (void 0 == r || null == r) throw new Error("bearing1 is required");
      if (void 0 == s || null == s) throw new Error("bearing2 is required");
      if (!t) throw new Error("radius is required");
      u = u || 64;
      var f = SamplerUtils.normalizeAngel2(r),
        l = SamplerUtils.normalizeAngel2(s),
        d = e.properties;
      if (f == l) return SamplerUtils.createLineString(xxx(e, t, u, c).geometry.coordinates[0], d);
      for (var h = f, p = f < l ? l : l + 360, v = h, y = [], m = 0; v < p; )
        y.push(SamplerUtils.localToGeographics(e, t, v, c).geometry.coordinates), (v = h + (360 * ++m) / u);
      return v > p && y.push(SamplerUtils.localToGeographics(e, t, p, c).geometry.coordinates), SamplerUtils.createLineString(y, d);
    };

    SamplerUtils.resamplerCorner = function (t, e, n) {
      var h = 0.002;
      var a = (function (t, e, n) {
          var a = SamplerUtils.diffAngel(SamplerUtils.calcAngel(e, t), SamplerUtils.calcAngel(e, n)); //y((0, s.default)(e, t), (0, s.default)(e, n)),
          (o = SamplerUtils.geographicsToLocal(t, e, "kilometres")), (i = SamplerUtils.geographicsToLocal(e, n, "kilometres") / 2), (r = h), (l = o);
          i < l && (l = i);
          var c = l * Math.tan((a / 360) * 3.14);
          c < r && (r = c);
          return r;
        })(t, e, n),
        c = (function (t, e, n, a) {
          var i = SamplerUtils.calcAngel(t, e),
            u = SamplerUtils.calcAngel(e, n),
            c = SamplerUtils.addAngel(i, 90);
          SamplerUtils.diffAngel(c, u) > 90 && (c = SamplerUtils.addAngel(c, 180));
          var f = SamplerUtils.addAngel(u, 90);
          SamplerUtils.diffAngel(f, SamplerUtils.addAngel(i, 180)) > 90 && (f = SamplerUtils.addAngel(f, 180));
          var d = SamplerUtils.localToGeographics(t, a, c, "kilometres"),
            h = SamplerUtils.localToGeographics(e, a, c, "kilometres"),
            p = SamplerUtils.localToGeographics(e, a, f, "kilometres"),
            g = SamplerUtils.localToGeographics(n, a, f, "kilometres"),
            v = SamplerUtils.createLineString([d.geometry.coordinates, h.geometry.coordinates]),
            m = SamplerUtils.createLineString([p.geometry.coordinates, g.geometry.coordinates]),
            b = SamplerUtils.e(v, m);
          if (0 == b.features.length) return;
          return {
            point: SamplerUtils.toPoint(b.features[0].geometry.coordinates),
            b1: SamplerUtils.addAngel(c, 180),
            b2: SamplerUtils.addAngel(f, 180),
          };
        })(t, e, n, a);

      if (!c) {
        var tpstr = t.join(","),
          epstr = e.join(","),
          npstr = n.join(",");
        if (tpstr == epstr && epstr != npstr) {
          return SamplerUtils.createLineString([e, n]);
        } else if (tpstr != epstr && epstr == npstr) {
          return SamplerUtils.createLineString([t, e]);
        }
        return;
      }
      var f = (function (t, e) {
          var n = SamplerUtils.normalizeAngel(t),
            a = SamplerUtils.normalizeAngel(e),
            o = !1;
          if ((n > a && n - a < 180) || a - n > 180) {
            var i = t;
            (t = e), (e = i), (o = !0);
          }
          return {
            b1: t,
            b2: e,
            changed: o,
          };
        })(c.b1, c.b2),
        d = f.b1,
        p = f.b2,
        g = f.changed,
        v = SamplerUtils.Interpolation(c.point, a, d, p, 20, "kilometres");
      return g && v.geometry.coordinates.reverse(), v;
    };

    return SamplerUtils;
  })();

  daximap.defined = (function () {
    "use strict";

    /**
     * @exports defined
     *
     * @param {*} value The object.
     * @returns {Boolean} Returns true if the object is defined, returns false otherwise.
     *
     * @example
     * if (SceneBuilder.defined(positions)) {
     *      doSomething();
     * } else {
     *      doSomethingElse();
     * }
     */
    function defined(value) {
      return value !== undefined && value !== null;
    }

    return defined;
  })();

  daximap.defaultValue = (function () {
    "use strict";

    /**
     * Returns the first parameter if not undefined, otherwise the second parameter.
     * Useful for setting a default value for a parameter.
     *
     * @exports defaultValue
     *
     * @param {*} a
     * @param {*} b
     * @returns {*} Returns the first parameter if not undefined, otherwise the second parameter.
     *
     * @example
     * param = SceneBuilder.defaultValue(param, 'default');
     */
    function defaultValue(a, b) {
      if (a !== undefined && a !== null) {
        return a;
      }
      return b;
    }

    return defaultValue;
  })();

  daximap.defineProperties = (function (defined) {
    "use strict";

    var definePropertyWorks = (function () {
      try {
        return "x" in Object.defineProperty({}, "x", {});
      } catch (e) {
        console.log(e);
        return false;
      }
    })();

    /**
     * Defines properties on an object, using Object.defineProperties if available,
     * otherwise returns the object unchanged.  This function should be used in
     * setup code to prevent errors from completely halting JavaScript execution
     * in legacy browsers.
     *
     * @private
     *
     * @exports defineProperties
     */
    var defineProperties = Object.defineProperties;
    if (!definePropertyWorks || !defined(defineProperties)) {
      defineProperties = function (o) {
        return o;
      };
    }

    return defineProperties;
  })(daximap.defined);
})(window);
