/**
 * 兼容ES5的简化版Zepto
 * 包含核心DOM操作、事件绑定、样式处理、AJAX和动画功能
 */
(function(window) {
  // 工具函数
  var util = {
    // 类型检测
    isFunction: function(obj) {
      return typeof obj === 'function';
    },
    isObject: function(obj) {
      return typeof obj === 'object' && obj !== null;
    },
    isString: function(obj) {
      return typeof obj === 'string';
    },
    isArray: function(obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    },
    isNumeric: function(value) {
      return !isNaN(parseFloat(value)) && isFinite(value);
    },
    
    // 合并对象
    extend: function(target) {
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
    toArray: function(likeArray) {
      return Array.prototype.slice.call(likeArray);
    },
    
    // 转换为驼峰命名
    camelCase: function(str) {
      return str.replace(/-([a-z])/g, function(match, letter) {
        return letter.toUpperCase();
      });
    }
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
    generateAnimationStyles: function(params) {
      var duration = params.duration || 300; // 默认300ms
      var easing = params.easing || 'ease'; // 默认缓动函数
      var delay = params.delay || 0; // 默认无延迟
      
      return {
        'transition': 'all ' + duration + 'ms ' + easing + ' ' + delay + 'ms',
        '-webkit-transition': 'all ' + duration + 'ms ' + easing + ' ' + delay + 'ms'
      };
    },
    
    // 绑定过渡结束事件
    bindTransitionEnd: function(element, callback) {
      var endEvents = [
        'transitionend', 
        'webkitTransitionEnd',
        'oTransitionEnd',
        'MSTransitionEnd'
      ];
      
      var handler = function(e) {
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
    }
  };

  // 原型方法
  Z.prototype = {
    // DOM就绪
    ready: function(callback) {
      if (document.readyState === 'complete') {
        callback(DXDomUtil);
      } else {
        var self = this;
        document.addEventListener('DOMContentLoaded', function() {
          callback(DXDomUtil);
        }, false);
      }
      return this;
    },
    
    // 事件绑定
    on: function(event, handler) {
      this.each(function(element) {
        element.addEventListener(event, handler, false);
      });
      return this;
    },
    
    // 事件解绑
    off: function(event, handler) {
      this.each(function(element) {
        element.removeEventListener(event, handler, false);
      });
      return this;
    },
    
    // 触发事件
    trigger: function(event) {
      var evt = document.createEvent('HTMLEvents');
      evt.initEvent(event, true, true);
      this.each(function(element) {
        element.dispatchEvent(evt);
      });
      return this;
    },
    
    // 遍历元素
    each: function(callback) {
      for (var i = 0; i < this.length; i++) {
        callback.call(this[i], this[i], i);
      }
      return this;
    },
    
    // 获取/设置HTML内容
    html: function(html) {
      if (html === undefined) {
        return this[0] ? this[0].innerHTML : null;
      }
      return this.each(function(element) {
        element.innerHTML = html;
      });
    },
    
    // 获取/设置文本内容
    text: function(text) {
      if (text === undefined) {
        return this[0] ? this[0].textContent : null;
      }
      return this.each(function(element) {
        element.textContent = text;
      });
    },
    
    // 获取/设置属性
    attr: function(name, value) {
      if (value === undefined) {
        return this[0] ? this[0].getAttribute(name) : null;
      }
      return this.each(function(element) {
        element.setAttribute(name, value);
      });
    },
    
    // 移除属性
    removeAttr: function(name) {
      return this.each(function(element) {
        element.removeAttribute(name);
      });
    },
    
    // 添加类名
    addClass: function(className) {
      return this.each(function(element) {
        element.classList.add(className);
      });
    },
    
    // 移除类名
    removeClass: function(className) {
      return this.each(function(element) {
        element.classList.remove(className);
      });
    },
    
    // 切换类名
    toggleClass: function(className) {
      return this.each(function(element) {
        element.classList.toggle(className);
      });
    },
    
    // 获取/设置样式
    css: function(prop, value) {
      if (util.isObject(prop)) {
        return this.each(function(element) {
          util.extend(element.style, prop);
        });
      }
      if (value === undefined) {
        return this[0] ? getComputedStyle(this[0])[util.camelCase(prop)] : null;
      }
      var camelProp = util.camelCase(prop);
      var unitValue = value;
      if (util.isNumeric(value) && 
          ['opacity', 'zIndex', 'fontWeight'].indexOf(camelProp) === -1) {
        unitValue = value + 'px';
      }
      return this.each(function(element) {
        element.style[camelProp] = unitValue;
      });
    },
    
    // 获取/设置值
    val: function(value) {
      if (value === undefined) {
        return this[0] ? this[0].value : null;
      }
      return this.each(function(element) {
        element.value = value;
      });
    },
    
    // 查找子元素
    find: function(selector) {
      var elements = [];
      this.each(function(element) {
        var found = element.querySelectorAll(selector);
        elements = elements.concat(util.toArray(found));
      });
      return new Z(elements);
    },
    
    // 获取父元素
    parent: function() {
      var parents = [];
      this.each(function(element) {
        if (element.parentNode && parents.indexOf(element.parentNode) === -1) {
          parents.push(element.parentNode);
        }
      });
      return new Z(parents);
    },
    
    // 移除元素
    remove: function() {
      return this.each(function(element) {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    },
    
    // 动画方法 - 使用CSS过渡实现
    animate: function(properties, options, callback) {
      // 处理参数
      if (util.isFunction(options)) {
        callback = options;
        options = {};
      }
      options = options || {};
      var self = this;
      
      // 为每个元素应用动画
      this.each(function(element, index) {
        // 保存原始过渡样式
        var originalTransition = element.style.transition || '';
        var originalWebkitTransition = element.style.webkitTransition || '';
        
        // 应用动画样式
        var animationStyles = animationUtil.generateAnimationStyles(options);
        for (var prop in animationStyles) {
          if (animationStyles.hasOwnProperty(prop)) {
            element.style[prop] = animationStyles[prop];
          }
        }
        
        // 绑定过渡结束事件
        animationUtil.bindTransitionEnd(element, function() {
          // 恢复原始过渡样式
          element.style.transition = originalTransition;
          element.style.webkitTransition = originalWebkitTransition;
          
          // 如果是最后一个元素且有回调函数，执行回调
          if (util.isFunction(callback) && index === self.length - 1) {
            callback.call(self);
          }
        });
        
        // 应用目标样式（触发过渡）
        setTimeout(function() {
          for (var prop in properties) {
            if (properties.hasOwnProperty(prop)) {
              var camelProp = util.camelCase(prop);
              var value = properties[prop];
              if (util.isNumeric(value) && 
                  ['opacity', 'zIndex', 'fontWeight'].indexOf(camelProp) === -1) {
                element.style[camelProp] = value + 'px';
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
    show: function(duration, callback) {
      var self = this;
      return this.each(function(element) {
        // 保存原始display值
        var originalDisplay = element.getAttribute('data-original-display') || 'block';
        
        // 如果有持续时间，使用动画
        if (duration) {
          element.style.opacity = '0';
          element.style.display = originalDisplay;
          
          self.animate({ opacity: '1' }, { duration: duration }, callback);
        } else {
          element.style.display = originalDisplay;
          if (util.isFunction(callback)) callback();
        }
      });
    },
    
    // 隐藏元素（带动画）
    hide: function(duration, callback) {
      var self = this;
      return this.each(function(element) {
        // 保存当前display值
        if (!element.getAttribute('data-original-display')) {
          var currentDisplay = getComputedStyle(element).display;
          if (currentDisplay !== 'none') {
            element.setAttribute('data-original-display', currentDisplay);
          }
        }
        
        // 如果有持续时间，使用动画
        if (duration) {
          self.animate({ opacity: '0' }, { duration: duration }, function() {
            element.style.display = 'none';
            if (util.isFunction(callback)) callback();
          });
        } else {
          element.style.display = 'none';
          if (util.isFunction(callback)) callback();
        }
      });
    },
    
    // 淡入效果
    fadeIn: function(duration, callback) {
      if (util.isFunction(duration)) {
        callback = duration;
        duration = 300;
      } else if (duration === undefined) {
        duration = 300;
      }
      return this.show(duration, callback);
    },
    
    // 淡出效果
    fadeOut: function(duration, callback) {
      if (util.isFunction(duration)) {
        callback = duration;
        duration = 300;
      } else if (duration === undefined) {
        duration = 300;
      }
      return this.hide(duration, callback);
    }
  };

  // AJAX功能
  DXDomUtil.ajax = function(options) {
    var settings = util.extend({
      url: '',
      method: 'GET',
      data: null,
      dataType: 'json',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      success: function() {},
      error: function() {}
    }, options);

    var xhr = new XMLHttpRequest();
    xhr.open(settings.method, settings.url, true);

    // 设置请求头
    for (var key in settings.headers) {
      if (settings.headers.hasOwnProperty(key)) {
        xhr.setRequestHeader(key, settings.headers[key]);
      }
    }

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        var response = xhr.responseText;
        if (settings.dataType === 'json') {
          try {
            response = JSON.parse(response);
          } catch (e) {
            return settings.error(xhr, 'parsererror', e);
          }
        }
        settings.success(response, xhr.statusText, xhr);
      } else {
        settings.error(xhr, xhr.statusText, new Error('Request failed'));
      }
    };

    xhr.onerror = function() {
      settings.error(xhr, 'error', new Error('Network error'));
    };

    // 处理数据
    var data = settings.data;
    if (data && typeof data === 'object') {
      var dataArr = [];
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          dataArr.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
        }
      }
      data = dataArr.join('&');
    }

    xhr.send(data);
    return xhr;
  };

  // 快捷方法
  ['get', 'post'].forEach(function(method) {
    DXDomUtil[method] = function(url, data, success, dataType) {
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
        dataType: dataType
      });
    };
  });

  // 暴露到window
  window.DXDomUtil = window.Zepto = DXDomUtil;
})(window);
