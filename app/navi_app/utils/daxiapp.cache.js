/**
 * @file daxiapp.cache.js
 * @description 本地存储缓存模块，提供历史记录和通用存储功能
 * @author li shuang
 * @created 2018-12-12
 */
(function (global) {
  var daxiapp = (global["DaxiApp"] = global["DaxiApp"] || {});

  /** 默认最大记录数 */
  var DEFAULT_MAX_RECORD = 20;

  /**
   * 编码值（用于存储）
   * @param {string} value - 原始值
   * @returns {string}
   */
  var encodeValue = (value) => {
    if (!value) return value;
    return window.btoa(encodeURIComponent(value.replace(/\s+/g, "")));
  };

  /**
   * 解码值（从存储读取）
   * @param {string} value - 编码值
   * @returns {string}
   */
  var decodeValue = (value) => {
    if (!value) return value;
    return decodeURIComponent(window.atob(value));
  };

  /**
   * 本地存储控制类
   */
  var DXLocalstorage = function () {
    var isIOS = window["command"] && window["command"]["platform"].indexOf("ios") != -1;
    var storage = isIOS ? {} : window.localStorage || {};

    this.setValue = (key, value) => {
      storage[key] = value || "0";
    };

    this.increase = (key) => {
      if (storage[key] === undefined) {
        storage[key] = "0";
      } else {
        var val = this.getValue(key);
        if (!isNaN(val)) {
          val = parseInt(val) + 1;
          this.setValue(key, val);
        }
      }
    };

    this.getValue = (key) => storage[key];

    this.removeItem = (key) => storage.removeItem(key);
  };

  /**
   * 缓存管理对象
   */
  var DXCache = (function () {
    var _endPos = null;
    var _endfloor = null;
    var _endInfo = null;
    var _options = null;

    var thisObject = {
      status: { currPage: -1 },
    };

    /** 路线终点信息管理 */
    thisObject.routeEndInfo = {
      set: (args_endfloor, args_endPos, args_info, options) => {
        _endPos = args_endPos;
        _endfloor = args_endfloor;
        _endInfo = args_info;
        _options = options || {};
      },
      getFloor: () => _endfloor,
      getPos: () => _endPos,
      getInfo: () => _endInfo,
      getOptions: () => _options,
    };

    /** 历史记录管理 */
    thisObject.history = {
      maxRecord: DEFAULT_MAX_RECORD,
      data: {
        indoorSearch: DEFAULT_MAX_RECORD,
        outdoorSearch: DEFAULT_MAX_RECORD,
        indoorPoint: DEFAULT_MAX_RECORD,
        outdoorPoint: DEFAULT_MAX_RECORD,
        default: DEFAULT_MAX_RECORD,
      },
      loc: null,

      /** 确保 localStorage 实例已初始化 */
      ensureLoc: function () {
        if (!this.loc) {
          this.loc = new DXLocalstorage();
        }
        return this.loc;
      },

      /** 获取指定类型的最大记录数 */
      getMaxLength: function (dataKey) {
        if (!this.data[dataKey]) {
          this.data[dataKey] = DEFAULT_MAX_RECORD;
        }
        return this.data[dataKey];
      },

      /** 添加历史记录 */
      add: function (data, dataKey) {
        var loc = this.ensureLoc();
        if (!data) return;

        // 深拷贝并编码敏感字段
        data = JSON.parse(JSON.stringify(data));
        if (data["keyword"]) {
          data["keyword"] = encodeValue(data["keyword"]);
        }
        if (data["text"]) {
          data["text"] = encodeValue(data["text"]);
        }

        var length = this.getMaxLength(dataKey);
        var count = 0;
        var historyNewVal = "";
        var replaceIndex;
        var timestamp = Date.now();
        var historyValArr = [];

        // 查找已存在的记录
        for (var i = 0; i < length; i++) {
          var key = `${dataKey}_${i}`;
          var value = loc.getValue(key);

          if (!value) {
            var dataStr = typeof data === "object" ? JSON.stringify(data) : data;
            historyNewVal = `${timestamp}|${dataStr}`;
          } else {
            var isEqual = this._checkEqual(data, value);
            if (isEqual.equal) {
              replaceIndex = i;
              loc.removeItem(key);
              historyNewVal = `${timestamp}|${isEqual.dataStr}`;
            } else {
              historyValArr.push({ key: key, val: value });
              count++;
            }
          }
        }

        // 移动记录位置
        if (historyNewVal && replaceIndex !== undefined) {
          for (var j = replaceIndex; j < historyValArr.length; j++) {
            var item = historyValArr[j];
            loc.removeItem(item.key);
            loc.setValue(`${dataKey}_${j}`, item.val);
          }
        }

        // 保存新记录
        if (!historyNewVal) {
          var dataStr = typeof data === "object" ? JSON.stringify(data) : data;
          historyNewVal = `${timestamp}|${dataStr}`;
        }
        if (historyNewVal) {
          loc.setValue(`${dataKey}_${historyValArr.length}`, historyNewVal);
          count++;
        }

        // 超出最大记录数时移除最旧的
        if (count > length) {
          for (var i = 1; i < length; i++) {
            var prevKey = `${dataKey}_${i - 1}`;
            var currKey = `${dataKey}_${i}`;
            var value = loc.getValue(currKey);
            loc.setValue(prevKey, value);
          }
          var dataStr = typeof data === "object" ? JSON.stringify(data) : data;
          loc.setValue(`${dataKey}_${length - 1}`, `${timestamp}|${dataStr}`);
        }
      },

      /** 检查数据是否相等 */
      _checkEqual: function (data, storedValue) {
        var result = { equal: false, dataStr: "" };

        if (typeof data === "object" && (storedValue.indexOf("{") !== -1 || storedValue.indexOf("[") !== -1)) {
          try {
            var oriInfo = storedValue.split("|")[1];
            var cachedData = JSON.parse(oriInfo);
            result.equal = true;
            for (var key in data) {
              if (data[key] !== cachedData[key]) {
                result.equal = false;
                break;
              }
            }
            if (result.equal) {
              result.dataStr = JSON.stringify(data);
            }
          } catch (e) {
            result.equal = false;
          }
        } else if (storedValue && storedValue.indexOf(data) !== -1) {
          result.equal = true;
          result.dataStr = data;
        }

        return result;
      },

      /** 获取所有历史记录 */
      getAll: function (dataKey) {
        var loc = this.ensureLoc();
        var length = this.getMaxLength(dataKey);
        var histories = [];
        var results = [];

        for (var i = 0; i < length; i++) {
          var key = `${dataKey}_${i}`;
          var value = loc.getValue(key);
          if (value !== undefined) {
            histories.unshift({ key: key, value: value });
          }
        }

        histories.forEach((historyItem) => {
          try {
            var parts = historyItem.value.split("|");
            var item = JSON.parse(parts[1]);
            if (item["keyword"]) {
              item["keyword"] = decodeValue(item["keyword"]);
            }
            if (item["text"]) {
              item["text"] = decodeValue(item["text"]);
            }
            results.push(item);
          } catch (error) {
            console.warn("Failed to parse history item:", error);
          }
        });

        return results;
      },

      /** 清除指定类型的历史记录 */
      clear: function (dataKey) {
        var loc = this.ensureLoc();
        var length = this.data[dataKey] || DEFAULT_MAX_RECORD;
        for (var i = 0; i < length; i++) {
          var key = `${dataKey}_${i}`;
          loc.removeItem(key);
        }
      },
    };

    /** 通用存储管理 */
    thisObject.storage = {
      loc: null,

      ensureLoc: function () {
        if (!this.loc) {
          this.loc = new DXLocalstorage();
        }
        return this.loc;
      },

      setItem: function (key, val) {
        if (!val) return;
        this.ensureLoc().setValue(key, val);
      },

      getItem: function (key) {
        return this.ensureLoc().getValue(key);
      },

      clearItem: function (key) {
        this.ensureLoc().removeItem(key);
      },
    };

    return thisObject;
  })();

  daxiapp["cache"] = DXCache;
})(window);
