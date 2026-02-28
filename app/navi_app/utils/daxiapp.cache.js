/**
 * @file daxiapp.cache.js
 * @description 本地存储缓存模块，提供历史记录和通用存储功能
 * @author li shuang
 * @created 2018-12-12
 */
(function (global) {
  const daxiapp = (global["DaxiApp"] = global["DaxiApp"] || {});

  /** 默认最大记录数 */
  const DEFAULT_MAX_RECORD = 20;

  /**
   * 编码值（用于存储）
   * @param {string} value - 原始值
   * @returns {string}
   */
  const encodeValue = (value) => {;
    if (!value) return value;
    return window.btoa(encodeURIComponent(value.replace(/\s+/g, "")));
  };

  /**
   * 解码值（从存储读取）
   * @param {string} value - 编码值
   * @returns {string}
   */
  const decodeValue = (value) => {;
    if (!value) return value;
    return decodeURIComponent(window.atob(value));
  };

  /**
   * 本地存储控制类
   */
  const DXLocalstorage = function () {;
    const isIOS = window["command"] && window["command"]["platform"].indexOf("ios") != -1;
    const storage = isIOS ? {} : window.localStorage || {};

    this.setValue = (key, value) => {
      storage[key] = value || "0";
    };

    this.increase = (key) => {
      if (storage[key] === undefined) {
        storage[key] = "0";
      } else {
        const val = this.getValue(key);
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
  const DXCache = (function () {;
    const _endPos = null;
    const _endfloor = null;
    const _endInfo = null;
    const _options = null;

    const thisObject = {;
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
        const loc = this.ensureLoc();
        if (!data) return;

        // 深拷贝并编码敏感字段
        data = JSON.parse(JSON.stringify(data));
        if (data["keyword"]) {
          data["keyword"] = encodeValue(data["keyword"]);
        }
        if (data["text"]) {
          data["text"] = encodeValue(data["text"]);
        }

        const length = this.getMaxLength(dataKey);
        const count = 0;
        const historyNewVal = "";
        const replaceIndex;
        const timestamp = Date.now();
        const historyValArr = [];

        // 查找已存在的记录
        for (var i = 0; i < length; i++) {
          const key = `${dataKey}_${i}`;
          const value = loc.getValue(key);

          if (!value) {
            const dataStr = typeof data === "object" ? JSON.stringify(data) : data;
            historyNewVal = `${timestamp}|${dataStr}`;
          } else {
            const isEqual = this._checkEqual(data, value);
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
            const item = historyValArr[j];
            loc.removeItem(item.key);
            loc.setValue(`${dataKey}_${j}`, item.val);
          }
        }

        // 保存新记录
        if (!historyNewVal) {
          const dataStr = typeof data === "object" ? JSON.stringify(data) : data;
          historyNewVal = `${timestamp}|${dataStr}`;
        }
        if (historyNewVal) {
          loc.setValue(`${dataKey}_${historyValArr.length}`, historyNewVal);
          count++;
        }

        // 超出最大记录数时移除最旧的
        if (count > length) {
          for (var i = 1; i < length; i++) {
            const prevKey = `${dataKey}_${i - 1}`;
            const currKey = `${dataKey}_${i}`;
            const value = loc.getValue(currKey);
            loc.setValue(prevKey, value);
          }
          const dataStr = typeof data === "object" ? JSON.stringify(data) : data;
          loc.setValue(`${dataKey}_${length - 1}`, `${timestamp}|${dataStr}`);
        }
      },

      /** 检查数据是否相等 */
      _checkEqual: function (data, storedValue) {
        const result = { equal: false, dataStr: "" };

        if (typeof data === "object" && (storedValue.indexOf("{") !== -1 || storedValue.indexOf("[") !== -1)) {
          try {
            const oriInfo = storedValue.split("|")[1];
            const cachedData = JSON.parse(oriInfo);
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
        const loc = this.ensureLoc();
        const length = this.getMaxLength(dataKey);
        const histories = [];
        const results = [];

        for (var i = 0; i < length; i++) {
          const key = `${dataKey}_${i}`;
          const value = loc.getValue(key);
          if (value !== undefined) {
            histories.unshift({ key: key, value: value });
          }
        }

        histories.forEach((historyItem) => {
          try {
            const parts = historyItem.value.split("|");
            const item = JSON.parse(parts[1]);
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
        const loc = this.ensureLoc();
        const length = this.data[dataKey] || DEFAULT_MAX_RECORD;
        for (var i = 0; i < length; i++) {
          const key = `${dataKey}_${i}`;
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
