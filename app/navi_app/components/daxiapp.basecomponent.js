// ES6 Module - DaxiApp Base Components
  const daxiapp = (window.DaxiApp = window.DaxiApp || {});
  const domUtils = daxiapp["dom"];
  const dxUtils = daxiapp["utils"];

  /**
   * 将 style 参数转换为 HTML style 属性字符串
   * @param {string|object|undefined} style - 样式配置，支持字符串或对象
   * @returns {string} - 格式为 ` style="..."` 或空字符串
   */
  function buildStyleAttr(style) {
    if (!style) return "";
    if (typeof style === "string") {
      return ` style="${style}"`;
    }
    if (typeof style === "object") {
      const styleStr = Object.entries(style)
        .map(([key, value]) => `${key}:${value}`)
        .join(";");
      return ` style="${styleStr}"`;
    }
    return "";
  }
  /**
   * 大希组件基础类
   * 所有组件的基类，提供通用的初始化、事件绑定、样式设置、显示隐藏等功能
   */
  const DXBaseComponent = (function (Class) {
    "use strict";

    /**
     * @class DXBaseComponent
     * @desc 大希组件基类 - 提供组件的通用能力
     */
    const DXBaseComponent = Class.extend(
      /** @lends DXBaseComponent.prototype */
      {
        __init__: function () {
          this._rtti = "DXBaseComponent";
        },

        /**
         * 初始化组件
         * @param {HTMLElement|jQuery} parentDom - 父容器
         * @param {Object} params - 配置参数
         * @param {string} [params.class] - 自定义 CSS 类名
         * @param {string|Object} [params.style] - 内联样式
         * @param {Object} [params.listener] - 事件监听器
         * @param {boolean} [params.visible] - 是否可见
         * @param {*} [params.data] - 初始数据
         * @param {Array} [params.children] - 子组件配置
         */
        init: function (parentDom, params) {
          this._params = params || {};
          this.children = [];

          // 生成默认 DOM 结构
          if (!this._domStr) {
            const classStr = params?.class || "";
            const styleAttr = buildStyleAttr(params?.style);
            this._domStr = `<span class="dx_component ${classStr}"${styleAttr}></span>`;
          }

          this.parentObj = parentDom;
          this.listener = params?.listener || {};

          this.injectComponentUI();
          this.injectComponentEvents();

          if (params?.visible == false) {
            this.hide();
          }
          if (this.updateData && params?.data) {
            this.updateData(params.data);
          }
        },

        /** 注入组件 UI 结构 */
        injectComponentUI: function () {
          this._dom = domUtils.geneDom(this._domStr);
          const params = this._params;

          // 初始化子组件
          this._params?.children?.forEach((item) => {
            const componentName = item.key;
            if (daxiapp[componentName]) {
              const child = new daxiapp[componentName]();
              this.children.push(child);
              child.init(this._dom, item);
            }
          });

          if (this.parentObj) {
            domUtils.append(this.parentObj, this._dom);
          }
        },

        /** 注入组件事件监听 */
        injectComponentEvents: function () {
          const that = this;

          // 绑定各类事件
          if (that.listener?.onClicked) {
            domUtils.on(that._dom, "click", (e) => {
              if (domUtils.isFastClick()) return;
              that.listener?.onClicked?.(that, e.target.dataset);
            });
          }

          if (that.listener?.onTouchStart) {
            domUtils.on(that._dom, "touchstart", (e) => {
              if (domUtils.isFastClick()) return;
              that.listener?.onTouchStart?.(that, e.target.dataset);
            });
          }

          if (that.listener?.onTouchEnd) {
            domUtils.on(that._dom, "touchend", (e) => {
              if (domUtils.isFastClick()) return;
              that.listener?.onTouchEnd?.(that, e.target.dataset);
            });
          }

          if (that.listener?.onTap) {
            domUtils.on(that._dom, "tap", (e) => {
              if (domUtils.isFastClick()) return;
              that.listener?.onTap?.(that, e.target.dataset);
            });
          }

          // 绑定自定义事件映射
          const eventMap = that._params?.eventMap;
          if (eventMap) {
            for (const key in eventMap) {
              domUtils.on(that._dom, key, (e) => {
                eventMap[key](that, e);
              });
            }
          }
        },

        /** 设置样式 */
        setStyle: function (styleMap) {
          this._dom.css(styleMap);
        },

        /** 设置子元素样式 */
        setChildrenStyle: function (selector, styleMap) {
          domUtils.find(this._dom, selector).css(styleMap);
        },

        addClass: function (className) {
          this._dom.addClass(className);
        },

        addChildClass: function (selector, className) {
          domUtils.find(this._dom, selector).addClass(className);
        },

        removeClass: function (className) {
          this._dom.removeClass(className);
        },

        getChildren: function () {
          return this.children;
        },

        getDom: function () {
          return this._dom;
        },

        /** 获取 DOM 元素并附加组件实例引用 */
        getDomWithIns: function () {
          this._dom[0].pcompsInstance = this;
          return this._dom[0];
        },

        show: function () {
          this._dom.show();
        },

        setVisible: function (visible) {
          visible ? this._dom.show() : this._dom.hide();
        },

        hide: function () {
          this._dom.hide();
        },

        getHeight: function () {
          return this._dom.height();
        },

        /** 添加子元素 */
        appendChild: function (childDom) {
          if (typeof childDom == "string") {
            this._dom.appendChild(childDom);
          } else if (Array.isArray(childDom)) {
            childDom.forEach((item) => this._dom.appendChild(item));
          } else {
            this._dom.appendChild(childDom);
          }
        },

        removeChild: function (childDom) {
          this._dom.removeChild(childDom);
        },

        triggerEvent: function (eventName) {
          domUtils.triggerEvent(this._dom, eventName);
        },

        /** 销毁组件 */
        finalize: function () {
          this._super();
        },
      },
    );

    return DXBaseComponent;
  })(Class);
  daxiapp["DXBaseComponent"] = DXBaseComponent;

  /** 按钮组件 - 可设置文本和自定义数据 */
  const DXBtnComponent = (function (DXBaseComponent) {
    const DXBtnComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXBtnComponent";
      },

      init: function (parentDom, params) {
        this._params = params;

        const styleAttr = buildStyleAttr(params?.style);
        this._domStr = `<span class="dxbtn ${params?.class || ""}"${styleAttr}></span>`;
        this._super(parentDom, params);
      },

      updateText: function (text) {
        this._dom.text(text);
      },

      setData: function (key, value) {
        this[key] = value;
      },

      getData: function (key) {
        return this[key];
      },
    });
    return DXBtnComponent;
  })(DXBaseComponent);
  daxiapp["DXBtnComponent"] = DXBtnComponent;

  /** 图标组件 - 支持动态切换图标 */
  const DXBaseIconComponent = (function (DXBaseComponent) {
    const DXBaseIconComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXBaseIconComponent";
      },

      init: function (parentDom, params) {
        this._params = params;

        const styleAttr = buildStyleAttr(params?.style);
        this._domStr = `<span class="dxicon icon ${params?.class || ""}"${styleAttr}></span>`;
        this._super(parentDom, params);
      },

      /** 更新图标类名 */
      updateIcon: function (icon) {
        const className = this._dom.attr("class").replace(this._iconName || "", icon);
        this._dom.attr("class", className);
        this._iconName = icon;
      },
    });
    return DXBaseIconComponent;
  })(DXBaseComponent);
  daxiapp["DXBaseIconComponent"] = DXBaseIconComponent;

  /** 图片组件 - 支持动态更新图片地址 */
  const DXBaseImageComponent = (function (DXBaseComponent) {
    const DXBaseImageComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXBaseImageComponent";
      },

      init: function (parentDom, params) {
        this._params = params;

        const styleAttr = buildStyleAttr(params?.style);
        const imgSrc = params?.imgUrl || params?.src || "";
        this._domStr = `<img class="dximg ${params?.class || ""}"${styleAttr} src="${imgSrc}"/>`;
        this._super(parentDom, params);
      },

      /** 更新图标类名 */
      updateIcon: function (icon) {
        const className = this._dom.attr("class").replace(this._iconName || "", icon);
        this._dom.attr("class", className);
        this._iconName = icon;
      },

      /** 更新图片地址 */
      updateImgUrl: function (url) {
        this._dom.attr("src", url);
      },
    });
    return DXBaseImageComponent;
  })(DXBaseComponent);
  daxiapp["DXBaseImageComponent"] = DXBaseImageComponent;

  /** 组合按钮组件 - 包含图标和文本，支持状态切换 */
  const DXComboxBtnComponent = (function (DXBaseComponent) {
    const DXComboxBtnComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXComboxBtnComponent";
      },

      init: function (parentDom, params) {
        this._params = params;

        const styleAttr = buildStyleAttr(params?.style);

        // 构建组件 DOM 结构
        this._domStr = `
          <span class="dxcomboxbtn ${params?.class || ""}" ${styleAttr}>
            <span class="${params?.icon || ""} dxicon ${params?.iconClass || ""}"></span>
            <span class="dxtext ${params?.textClass || ""}">${params?.text || ""}</span>
          </span>`;

        this.state = 0;
        this._super(parentDom, params);
        this._iconDom = domUtils.find(this._dom, ".dxicon");
        this._txtDom = domUtils.find(this._dom, ".dxtext");
      },

      /** 更新图标类名 */
      updateIcon: function (icon) {
        const className = this._iconDom.attr("class").replace(this._iconName || "", icon);
        this._iconDom.attr("class", className);
        this._iconName = icon;
      },

      /** 更新文本内容 */
      updateText: function (text) {
        this._txtDom.text(text);
      },

      setStatus: function (state) {
        this.state = state;
      },

      getStatus: function () {
        return this.state;
      },
    });
    return DXComboxBtnComponent;
  })(DXBaseComponent);
  daxiapp["DXComboxBtnComponent"] = DXComboxBtnComponent;

  /** 输入框组件 - 支持输入事件和回车提交 */
  const DXInputComponent = (function (DXBaseComponent) {
    const DXInputComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXInputComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        const placeholder = params?.placeholder || "请输入查询内容";

        const styleAttr = buildStyleAttr(params?.style);
        this._domStr = `<input class="dxinput ${
          params?.class || ""
        }" oncopy="return false;" oncut="return false;" onfocus="if(this.value.length>0){this.placeholder=''}" onblur="this.value.length==0?this.placeholder='${placeholder}':'';\"${styleAttr}/>`;
        this._super(parentDom, params);
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;

        // 输入事件
        domUtils.on(this._dom, "input", (e) => {
          const val = e.target.value.replace(/ /g, "").trim();
          that.listener?.onInput?.(that, { val });
        });

        // 回车提交事件
        domUtils.on(this._dom, "keyup", function (event) {
          event.stopPropagation();
          const val = this.value.replace(/ /g, "").trim();
          if (event.keyCode == 13 && this.value) {
            that.listener?.onTapEntered?.(that, { val });
            this.blur();
          }
        });
      },

      /** 更新图标类名 */
      updateIcon: function (icon) {
        const className = this._dom.attr("class").replace(this._iconName || "", icon);
        this._dom.attr("class", className);
        this._iconName = icon;
      },
    });
    return DXInputComponent;
  })(DXBaseComponent);
  daxiapp["DXInputComponent"] = DXInputComponent;

  /** 搜索组件 - 带搜索图标的容器 */
  const DXBaseSearchComponent = (function (DXBaseComponent) {
    const DXBaseSearchComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXBaseSearchComponent";
      },

      init: function (parentDom, params) {
        this._params = params;

        const styleAttr = buildStyleAttr(params?.style);
        this._domStr = `<div class="dxsearch-component ${params?.class || ""}" ${styleAttr}><span class="icon-search"></span></div>`;
        this._super(parentDom, params);
      },

      /** 更新图标类名 */
      updateIcon: function (icon) {
        const className = this._dom.attr("class").replace(this._iconName || "", icon);
        this._dom.attr("class", className);
        this._iconName = icon;
      },
    });
    return DXBaseSearchComponent;
  })(DXBaseComponent);
  daxiapp["DXBaseSearchComponent"] = DXBaseSearchComponent;

  /** 信息卡片组件 - 用于展示 POI 详情 */
  const DXInfoCardComponent = (function (DXBaseComponent) {
    const DXInfoCardComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXInfoCardComponent";
        this._audioEndHandler = null; // 保存音频结束事件处理器引用，避免重复绑定
      },

      init: function (parentDom, params) {
        this._params = params;
        const styleAttr = buildStyleAttr(params?.style);
        this._domStr = `<div class="infocard-component ${params?.class || ""}"${styleAttr}><div>`;

        this._super(parentDom, params);
        if (params?.data) {
          this.updateData(params.data);
        }
      },

      injectComponentEvents: function () {
        this._super();
        let that = this;

        // 路线按钮点击
        domUtils.on(that._dom, "click", ".go-route", function () {
          that.listener?.onRouteBtnClicked?.(that, that._data);
        });

        // 音频点击
        domUtils.on(that._dom, "click", "audio", function () {
          that.listener?.onAudioClicked?.(that, that._data);
        });

        // 右上角按钮点击
        domUtils.on(that._dom, "click", ".float-right", function () {
          let isActive = !$(this).hasClass("disabled");
          that.listener?.rightTopBtnCLicked?.(that, { isActive: isActive });
        });

        // 关闭按钮点击
        domUtils.on(that._dom, "click", ".close", function () {
          that.listener?.onClose?.(that, that._data);
        });

        // 绑定初始音频结束事件
        this._bindAudioEndEvent();
      },

      /** 绑定音频结束事件（避免重复绑定） */
      _bindAudioEndEvent: function () {
        let that = this;
        let audioDom = domUtils.find(this._dom, "audio")[0];
        if (!audioDom) return;

        // 移除旧的监听器
        if (this._audioEndHandler) {
          audioDom.removeEventListener("ended", this._audioEndHandler);
        }

        // 创建新的监听器
        this._audioEndHandler = function () {
          that.listener?.onAudioEnded?.();
        };
        audioDom.addEventListener("ended", this._audioEndHandler);
      },

      updateData: function (data, detailData) {
        this._data = data;
        let imageUrl = data.thumbnail || data.imageUrl;
        let text = data.name || data.text || data.title || "";
        let langData = window.langData || {};

        // 构建 HTML
        let str = "";

        // 关闭按钮
        if (data.iconClose) {
          str += `<span class="close"><i class="icon_gb-close4"></i></span>`;
        }

        // 图片区域
        if (imageUrl) {
          str += `
            <div class="img_box">
              <p class="img_container">
                ${data.detailUrl ? `<span class="zp_detail">${langData["exhibtion:detail"] || "展览详情"}</span>` : ""}
                <img class="info-image" src="${imageUrl}"/>
              </p>
            </div>`;
        } else if (data.icon) {
          str += `<p class="${data.icon}" style="font-size:1.6rem"></p>`;
        }

        // 信息区域
        str += `<div class="info_container">`;

        if (text) {
          str += `<p><span class="name title">${text}</span>`;

          // 右上角按钮
          if (data.type == "poiInfo") {
            str += `<span class="icon-daohang go-route float-right text-btn"><i class="icon_gb-line"></i>${langData["go:here"] || "去这里"}</span>`;
          } else if (data.rightTopBtn) {
            str += `<span class="${data.rightTopBtn.icon || ""} ${data.rightTopBtn.class || ""} float-right">${data.rightTopBtn.text || ""}</span>`;
          }

          str += `<span class="address">${data.address || ""}</span></p>`;
        }

        // 描述区域
        if (data.address && data.description) {
          str += `<div class="description">`;
          if (data.descMaxlineNum) {
            str += `<div style="display:-webkit-box;overflow:hidden;white-space:pre-wrap;text-overflow:ellipsis;-webkit-box-orient:vertical;-webkit-line-clamp:2;">${data.description}</div>`;
          } else {
            str += `<div style="max-height:4.2em;overflow-y:scroll;">${data.description}</div>`;
          }
          str += `</div>`;
        } else {
          if (data.address) {
            str += `<p class="address">${data.address}</p>`;
          }
          if (data.description) {
            str += `<div class="description">`;
            if (data.descMaxlineNum) {
              str += `<div style="display:-webkit-box;overflow:hidden;white-space:pre-wrap;text-overflow:ellipsis;-webkit-box-orient:vertical;-webkit-line-clamp:2;">${data.description}</div>`;
            } else {
              str += `<div>${data.description}</div>`;
            }
            str += `</div>`;
          }
        }

        // 详情数据
        if (detailData) {
          str += `<div class="address" style="width:75%">${detailData.type == 1 ? detailData.detail : ""}</div>`;
        }

        // 音频播放器
        if (data.audioUrl) {
          str += `
            <p class="flex-wrapper">
              <audio controls="controls" ${data.autoplay ? "autoplay" : ""} class="audio" style="width:initial;flex:1">
                <source src="${data.audioUrl}" type="audio/mp3"></source>
              </audio>
            </p>`;
        } else if (data.detailUrl && data.hasRouteBtn) {
          str += `<div class="btn_route"><span class="go-route nobg-btn dxbtn"><i class="icon_gb-line"></i>${langData["route:btntext"] || "路线"}</span></div>`;
        }

        str += `</div>`;

        // 底部路线按钮
        if (data.hasRouteBtn && !data.detailUrl) {
          str += `<span class="go-route dxbtn btn-middle"><i class="icon_gb-line"></i>${langData["route:btntext"] || "路线"}</span>`;
        }

        this._dom.html(str);
        this._dom.show();

        // 重新绑定音频结束事件
        this._bindAudioEndEvent();

        // 图片加载完成回调
        if (imageUrl && this.listener?.onImgLoaded) {
          let img = domUtils.find(this._dom, ".info-image")[0];
          if (img) {
            img.onload = () => this.listener.onImgLoaded();
          }
        }
      },

      setRightTopBtnState: function (isActive) {
        let dom = domUtils.find(this._dom, ".float-right");
        dom?.[isActive ? "removeClass" : "addClass"]("disabled");
      },

      startPlay: function () {
        let dxaudio = domUtils.find(this._dom, ".audio");
        dxaudio?.[0]?.play?.();
      },

      pausePlay: function () {
        let dxaudio = domUtils.find(this._dom, ".audio");
        dxaudio?.[0]?.pause?.();
      },
    });
    return DXInfoCardComponent;
  })(DXBaseComponent);
  daxiapp["DXInfoCardComponent"] = DXInfoCardComponent;

  /** 瘦西湖路书组件 - 展示路线信息、支持拖拽展开/收起 */
  const DXInfoCardComponent2 = (function (DXBaseComponent) {
    const DXInfoCardComponent2 = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXInfoCardComponent2";
      },

      init: function (parentDom, params) {
        this._params = params;

        const styleAttr = buildStyleAttr(params?.style);
        this._domStr = `<div class="infocard-component2 ${params?.class || ""}" ${styleAttr}><div>`;
        this._super(parentDom, params);

        if (params?.data) {
          this.updateData(params.data);
        }
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;
        const listener = this.listener;

        // 关闭按钮点击
        if (listener?.onClose) {
          domUtils.on(that._dom, "click", ".close", () => {
            listener.onClose(that, that._data);
          });
        }

        // 详情按钮点击 - 展开面板
        domUtils.on(that._dom, "click", "#routeDetail", () => {
          that._dom.parents(".swiper").css("top", "12px").addClass("top");
        });

        // 拖拽开始
        domUtils.on(that._dom, "touchstart", ".routeHeader", (event) => {
          const startClientY = event.changedTouches[0].screenY;
          that.screenY = startClientY;
          that.screenY2 = startClientY;
        });

        // 拖拽移动
        domUtils.on(that._dom, "touchmove", ".routeHeader", (event) => {
          const currentScreenY = event.changedTouches[0].screenY;
          const diffScreenY = currentScreenY - that.screenY;
          const top = that._dom.parents(".swiper").offset().top;
          const max = document.body.clientHeight - 100;
          const min = document.body.clientHeight * 0.03;
          if (top + diffScreenY > min && top + diffScreenY < max) {
            that._dom.parents(".swiper").css("top", `${top + diffScreenY}px`);
            that.screenY = top + diffScreenY;
          }
        });

        // 拖拽结束 - 自动吸附
        domUtils.on(that._dom, "touchend", ".routeHeader", (event) => {
          const endScreenY = event.changedTouches[0].screenY;
          const diffScreenY = endScreenY - that.screenY2;
          const max = document.body.clientHeight - 100;
          const swiper = that._dom.parents(".swiper");

          if (Math.abs(diffScreenY) > 50) {
            if (swiper.hasClass("top")) {
              swiper.removeClass("top").addClass("down").css({
                top: "12px",
                "transition-duration": "0.3s",
              });
            } else {
              swiper.removeClass("down").addClass("top").css({
                top: "calc(100% - 100px)",
                "transition-duration": "0.3s",
              });
            }
          } else if (swiper.hasClass("top")) {
            swiper.css("top", `${max}px`);
          }
        });

        // 导航按钮点击
        domUtils.on(that._dom, "click", ".btn-blue", function () {
          const isActive = !$(this).hasClass("disabled");
          listener?.rightTopBtnCLicked?.(that, { isActive });
        });

        // 模拟导航按钮点击
        domUtils.on(that._dom, "click", ".btn-simulate", function () {
          const isActive = !$(this).hasClass("disabled");
          listener?.simulateBtnClicked?.(that, { isActive });
        });

        // 切换路线方向
        domUtils.on(that._dom, "click", ".change_itembtn", function () {
          if (that._data?.child) {
            for (let i = 0; i < 2; i++) {
              that._data.child[i].active = that._activeIndex != i;
            }
          }
          that.updateData(that._data);
          const isActive = !$(this).hasClass("disabled");
          listener?.switchSubItem?.(that, { isActive }, that._activeIndex);
        });
      },

      updateData: function (data) {
        this._data = data;
        this._activeData = null;

        const that = this;
        const params = that._params;
        const langData = window.langData || {};

        // 查找激活的子路线
        if (data?.child) {
          data.child.forEach((item, index) => {
            if (item.active) {
              that._activeData = item;
              that._activeIndex = index;
            }
          });
          if (!that._activeData) {
            that._activeData = data.child[0];
            that._activeIndex = 0;
          }
        } else {
          this._activeData = data;
        }

        const activeData = this._activeData;
        const imageUrl = activeData?.thumbnail || activeData?.imageUrl;

        // 构建路线切换按钮
        const routeSwitchHtml =
          data?.child?.length > 1
            ? `<span class="routeFirestName">
              <span>${activeData.routesInfo?.[0]?.name || ""}</span>
              <span class="icon-qiehuan change_itembtn" style="display:inline-block;transform:rotate(90deg);padding:4px;font-size:1.1rem;border-radius:50%;color:#13aec0;"></span>
              <span>${activeData.routesInfo?.[activeData.routesInfo.length - 1]?.name || ""}</span>
            </span>`
            : "";

        // 构建交通方式标签
        let trafficHtml = "";
        activeData?.traffic?.forEach((type) => {
          if (type == 1) {
            trafficHtml += `<span class="btn-small walk"><i class="icon-walk"></i>${langData["walk:bingxing"] || "步行"}</span>`;
          } else if (type == 2) {
            trafficHtml += `<span class="btn-small bus"><i class="icon-bus_sightseeing"></i>${langData["tour:bus"] || "观光车"}</span>`;
          } else if (type == 3) {
            trafficHtml += `<span class="btn-small ship"><i class="icon-ship"></i>${langData["bus:onwater"] || "游船"}</span>`;
          }
        });

        // 构建操作按钮
        const simulateBtnHtml =
          params?.test == "true" ? `<span class="btn-small2 btn-simulate"><i class="icon-navi"></i>${langData["simulateNavi:text"] || "模拟导航"}</span>` : "";
        const navBtnHtml =
          activeData?.traffic?.indexOf("3") == -1 && activeData?.traffic?.indexOf("2") == -1
            ? `<span class="btn-small2 btn-blue"><i class="icon-navi"></i>${langData["navigate:text"] || "导航"}</span>`
            : "";

        // 构建路线列表
        let routeListHtml = "";
        activeData?.routesInfo?.forEach((route) => {
          const exhibitId = route.exhibition?.id || "";
          if (route.traffic == "1") {
            const posClass = route.level == 1 ? "small" : "big";
            routeListHtml += `
              <li class="route_segment segment_walk line_start" data-traffic="1" data-id="${exhibitId}">
                <p class="start_pos ${posClass}">
                  <span class="station_name">${route.name}</span>
                </p>
                <div class="walk_container">
                  <p class="walk_info">
                    <span class="walk_dis">${route.detail}</span>
                  </p>
                </div>
              </li>`;
          } else if (route.traffic == "2") {
            routeListHtml += `
              <li class="route_segment segment_bus active" data-traffic="2" data-id="${exhibitId}">
                <div class="container">
                  <p class="start_pos small"><span class="station_name">${route.name}</span></p>
                  <div class="bus_stations_info">
                    <p class="stations_info">
                      <span class="stations_num">${route.detail}</span>
                    </p>
                  </div>
                </div>
              </li>`;
          } else if (route.traffic == "3") {
            routeListHtml += `
              <li class="route_segment segment_ship active" data-traffic="3" data-id="${exhibitId}">
                <div class="container">
                  <p class="start_pos small"><span class="station_name">${route.name}</span></p>
                  <div class="bus_stations_info">
                    <p class="stations_info">
                      <span class="stations_num">${route.detail}</span>
                    </p>
                  </div>
                </div>
              </li>`;
          }
        });

        // 组装完整 HTML
        const str = `
          <div class="routeHeader">
            <div class="routeImg">
              ${imageUrl ? `<img src="${imageUrl}" alt="">` : ""}
            </div>
            <div class="routeInfo">
              <div class="routeTitle">${activeData?.name || ""}${routeSwitchHtml}</div>
              <div class="routeMethod">${trafficHtml}</div>
              <div class="routeText">
                <div>${activeData?.distance || ""}${langData["kilometre"] || "公里"} ${activeData?.duration || ""}${langData["hour"] || "小时"}</div>
                <div class="routeBtns">
                  <span id="routeDetail" class="btn-small2 btn-white"><i class="icon-report"></i>${langData["detail:btntext"] || "详情"}</span>
                  ${simulateBtnHtml}
                  ${navBtnHtml}
                </div>
              </div>
            </div>
            <div class="close"><i class="icon-close"></i></div>
          </div>
          <div class="routeDetail">
            ${activeData?.description ? `<div class="tips">${activeData.description}</div>` : ""}
            <div class="routeList">${routeListHtml}</div>
          </div>`;

        this._dom.html(str);

        // 标记相同类型的相邻路段
        const routeSegments = this._dom.find(".route_segment");
        for (let i = 1; i < routeSegments.length; i++) {
          const traffic = $(routeSegments[i]).attr("data-traffic");
          const lastTraffic = $(routeSegments[i - 1]).attr("data-traffic");
          if (traffic == lastTraffic) {
            $(routeSegments[i]).addClass("sameType");
          }
        }

        this._dom.show();

        // 绑定音频结束事件
        const audioDom = domUtils.find(this._dom, "audio")[0];
        audioDom?.addEventListener("ended", () => {
          this.listener?.onAudioEnded?.();
        });

        // 图片加载回调
        if (imageUrl && this.listener?.onImgLoaded) {
          const img = domUtils.find(this._dom, ".info-image")[0];
          if (img) {
            img.onload = () => this.listener.onImgLoaded();
          }
        }

        // 设置初始位置
        const max = document.body.clientHeight - 100;
        this._dom.parents(".swiper").css("top", `${max}px`);
        this._dom.find(".routeDetail").css({
          height: `${document.body.clientHeight - 112}px`,
          "overflow-y": "scroll",
          width: "100%",
          left: 0,
          position: "absolute",
        });
      },

      setRightTopBtnState: function (isActive) {
        const dom = domUtils.find(this._dom, ".float-right");
        dom?.[isActive ? "removeClass" : "addClass"]("disabled");
      },

      startPlay: function () {
        const dxaudio = domUtils.find(this._dom, ".audio");
        dxaudio?.[0]?.play?.();
      },

      pausePlay: function () {
        const dxaudio = domUtils.find(this._dom, ".audio");
        dxaudio?.[0]?.pause?.();
      },

      setTop: function (top) {
        this._dom.parents(".swiper").css({ top });
      },
    });
    return DXInfoCardComponent2;
  })(DXBaseComponent);
  daxiapp["DXInfoCardComponent2"] = DXInfoCardComponent2;

  /** 樱花节活动卡片组件 - 支持打卡、分享、去那里功能 */
  const DXCherryCardComponent = (function (DXBaseComponent) {
    const DXCherryCardComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXCherryCardComponent";
      },

      init: function (parentDom, params) {
        this._params = params;

        const styleAttr = buildStyleAttr(params?.style);
        this._domStr = `<div class="infocard-component2 activity-card ${params?.class || ""}" ${styleAttr}><div>`;
        this._super(parentDom, params);

        if (params?.data) {
          this.updateData(params.data);
        }
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;
        const listener = this.listener;

        // 打卡按钮点击
        if (listener?.singin) {
          domUtils.on(that._dom, "click", ".singin", function () {
            const $this = $(this);
            const isSign = $this.attr("data-issign"); // 0:未打卡 1:已打卡 2:已核销
            const repeatpunchcard = $this.attr("data-repeatpunchcard"); // 0:不可重复 1:可重复

            if (isSign == 0 || (isSign == 2 && repeatpunchcard == 1)) {
              listener.singin(that, {
                coordinates: $this.attr("data-coordinates"),
                activeid: $this.attr("data-activeid"),
                floorid: $this.attr("data-floorid"),
                activepointid: $this.attr("data-activepointid"),
              });
            }
          });
        }

        // 分享按钮点击
        if (listener?.share) {
          domUtils.on(that._dom, "click", ".share", function () {
            const $this = $(this);
            const dataset = $this[0].dataset;
            listener.share(that, {
              activeId: $this.attr("data-activepointid"),
              name: $this.attr("data-name"),
              spaceCode: $this.attr("data-spacecode"),
              lon: dataset.lon,
              lat: dataset.lat,
              bdid: dataset.bdid,
              floorId: dataset.floorid,
              address: dataset.address || "",
            });
          });
        }

        // 去那里按钮点击
        if (listener?.gotoThere) {
          domUtils.on(that._dom, "click", ".gotoThere", function () {
            const $poiItem = $(this);
            listener.gotoThere(that, {
              bdid: ($poiItem.data("bdid") || "") + "",
              floorId: $poiItem.data("floorid") + "",
              lon: $poiItem.data("lon"),
              lat: $poiItem.data("lat"),
              name: ($poiItem.data("name") || "") + "",
              address: ($poiItem.data("address") || "") + "",
              spaceCode: $poiItem.data("spacecode") + "",
            });
          });
        }
      },

      updateData: function (data) {
        const imgSrc = data.cardInfoImg || data.thumbnails?.[0]?.original || "../common_imgs/icon_noPic.png";
        const lon = data.longitude || data.lon;
        const lat = data.latitude || data.lat;

        // 构建打卡按钮
        let signBtnHtml = "";
        if (data.allowSign == 1) {
          const baseAttrs = `data-issign="${data.isSign}" data-repeatpunchcard="${data.repeatPunchCard}" data-activepointid="${data.id}" data-floorid="${data.floorId}" data-activeid="${data.activeId}" data-coordinates="${data.extent}"`;

          if (data.isSign == 0 || (data.repeatPunchCard == 1 && data.isSign == 2)) {
            signBtnHtml = `<span class="singin" ${baseAttrs}><i class="icon-share"></i><span class="daka">打卡</span></span>`;
          } else if (data.isSign == 1) {
            signBtnHtml = `<span class="singin singed" ${baseAttrs}><i class="icon_gb-position"></i><span class="daka">已打卡</span></span>`;
          } else if (data.repeatPunchCard == 0 && data.isSign == 2) {
            signBtnHtml = `<span class="singin singed" ${baseAttrs}><i class="icon_gb-position"></i><span class="daka">已核销</span></span>`;
          }
        }

        const str = `
          <div class="activeBox allowSign${data.allowSign}">
            <div class="activeImg"><img src="${imgSrc}" alt=""></div>
            <div class="activeCon">
              <div class="activeTitle">${data.name}</div>
              <div class="activeDes">${data.content || data.description}</div>
              <div class="activeIndex yellow"><i class="iconfontwelink iconwelinka-${data.index}"></i></div>
            </div>
          </div>
          <div class="activeBottom allowSign${data.allowSign}">
            ${signBtnHtml}
            <span class="share" data-name="${data.name}" data-activepointid="${data.id}" data-spacecode="${data.spaceCode}" data-bdid="${
              data.bdid
            }" data-floorid="${data.floorId}" data-lon="${lon}" data-lat="${lat}">
              <i class="icon_gb-share2"></i>分享
            </span>
            <span class="gotoThere" data-name="${data.name}" data-address="${data.address || ""}" data-spacecode="${data.spaceCode}" data-bdid="${
              data.bdid
            }" data-floorid="${data.floorId}" data-lon="${lon}" data-lat="${lat}">
              <i class="icon_gb-coordinate"></i>去那里
            </span>
          </div>`;

        this._dom.html(str);
      },

      setTop: function (top) {
        this._dom.parents(".swiper").css({ top });
      },
    });
    return DXCherryCardComponent;
  })(DXBaseComponent);
  daxiapp["DXCherryCardComponent"] = DXCherryCardComponent;

  /** 卡片容器组件 - 支持音频播放控制 */
  const DXCardsComponent = (function (DXBaseComponent) {
    const DXCardsComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXCardsComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        const styleAttr = buildStyleAttr(params?.style);
        this._domStr = `<div class="wrapper ${params?.class || ""}"${styleAttr}></div>`;
        this._super(parentDom, params);

        if (params?.data) {
          this.updateData(params.data);
        }
      },

      injectComponentEvents: function () {
        this._super();
      },

      /** 更新图标类名 */
      updateIcon: function (icon) {
        const className = this._dom.attr("class").replace(this._iconName || "", icon);
        this._dom.attr("class", className);
        this._iconName = icon;
      },

      startPlay: function () {
        const dxaudio = domUtils.find(this._dom, ".audio");
        dxaudio?.[0]?.play?.();
      },

      pausePlay: function () {
        const dxaudio = domUtils.find(this._dom, ".audio");
        dxaudio?.[0]?.pause?.();
      },
    });
    return DXCardsComponent;
  })(DXBaseComponent);
  daxiapp["DXCardsComponent"] = DXCardsComponent;

  /** Swiper 轮播组件 - 封装 Swiper 库，支持滑动、自动播放等功能 */
  const DXSwiperComponent = (function (DXBaseComponent) {
    const DXSwiperComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXSwiperComponent";
      },

      init: function (parentDom, params) {
        this._params = params;

        const styleAttr = buildStyleAttr(params?.style);

        // 构建 DOM 结构
        this._domStr = `
          <div class="swiper ${params?.class || ""}" ${styleAttr}>
            <div class="swiper-wrapper"></div>
            <div class="swiper-pagination"></div>
            ${params?.showClose ? "<div class='close icon-guanbi'></div>" : ""}
          </div>`;

        this._super(parentDom, params);

        if (params?.data) {
          this.updateData(params.data);
        }

        // 初始化 Swiper 配置
        const that = this;
        const swiperOption = { el: this._dom };

        if (params?.swiperOptions) {
          Object.assign(swiperOption, params.swiperOptions);
        } else {
          swiperOption.pagination = {
            el: ".swiper-pagination",
            clickable: true,
          };
        }

        // 设置滑动结束事件
        if (!swiperOption.on) {
          swiperOption.on = {};
        }
        if (!swiperOption.on.slideChangeTransitionEnd) {
          swiperOption.on.slideChangeTransitionEnd = function () {
            if (that.listener?.slideChangeTransitionEnd) {
              const slide = that.getActiveSlide();
              that.listener.slideChangeTransitionEnd(that, slide, that.getDataBySlide(slide));
            }
          };
        }

        this.swiper = new Swiper(swiperOption);
      },

      injectComponentEvents: function () {
        const that = this;
        this._super();

        domUtils.on(that._dom, "click", ".close", () => {
          that.listener?.onClose?.();
        });
      },

      getSlideByIndex: function (index) {
        return this.swiper.slides[index];
      },

      getActiveSlide: function () {
        return this.swiper.slides[this.swiper.activeIndex];
      },

      getDataBySlide: function (slide) {
        return slide.pcompsInstance._params.data;
      },

      getAllSlides: function () {
        return this.swiper.slides;
      },

      addSlide: function (index, slides) {
        if (typeof slides == "object") {
          if ("length" in slides) {
            slides.forEach((slide) => {
              slide.addClass ? slide.addClass("swiper-slide") : slide.classList.add("swiper-slide");
            });
          } else {
            slides.addClass ? slides.addClass("swiper-slide") : slides.classList.add("swiper-slide");
          }
        }
        this.swiper.addSlide(index, slides);
      },

      prependSlide: function (slides) {
        this.swiper.prependSlide(slides);
      },

      appendSlide: function (slides) {
        this.swiper.appendSlide(slides);
      },

      removeAllSlides: function () {
        this.swiper.removeAllSlides();
      },

      removeSlide: function (slide) {
        this.swiper.removeSlide(slide);
      },

      addSwiperClasss: function (classes) {
        this.swiper.addClasses(classes);
      },

      removeSwiperClasses: function (classes) {
        this.swiper.removeClasses(classes);
      },

      activeIndex: function () {
        return this.swiper.activeIndex;
      },

      setActiveIndex: function (index, speed, callback) {
        this.swiper.activeIndex = index;
        this.swiper.slideTo(index, speed, callback);
      },

      /** 向前滑动 */
      slidePrev: function () {
        this.swiper.slidePrev();
      },

      /** 向后滑动 */
      slideNext: function () {
        this.swiper.slideNext();
      },

      /** 获取自动播放控制器 */
      swiperAutoPlayer: function () {
        return this.swiper.autoplay;
      },

      isEnd: function () {
        return this.swiper.isEnd;
      },

      top: function (top) {
        this._dom.css("top", `${top}px`);
      },
    });
    return DXSwiperComponent;
  })(DXBaseComponent);
  daxiapp["DXSwiperComponent"] = DXSwiperComponent;

  /** 确认弹窗组件 - 支持多按钮回调 */
  const DXShowConfirmComponent = (function (DXBaseComponent) {
    const DXShowConfirmComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXShowConfirmComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `<div class="confirmBox"><div class="confirmBoxContent"></div></div>`;
        this._super(parentDom, params);
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;

        domUtils.on(that._dom, "click", ".btn", function () {
          const index = $(this).index();
          if (index == 0) {
            that._params?.callback?.();
          } else {
            that._params?.[`callback${index}`]?.();
          }
          that.hide();
        });
      },

      updateData: function (params) {
        this._params = params;

        // 构建按钮列表
        const btnsHtml = params.btnArray?.map((btn, index) => `<span class="btn btn${index}">${btn}</span>`).join("") || "";

        const str = `
          <div class="confirmBoxTitle">${params.title}</div>
          <div class="confirmBoxBtns">${btnsHtml}</div>`;

        domUtils.find(this._dom, ".confirmBoxContent").html(str);

        // 单按钮时设置全宽
        const btn = domUtils.find(this._dom, ".btn");
        if (btn.length == 1) {
          btn.addClass("w100");
        }
      },

      hide: function () {
        this._dom.hide();
      },

      show: function (params) {
        if (params) {
          this.updateData(params);
        }
        this._dom.show();
      },

      remove: function () {
        this._dom.remove();
      },
    });
    return DXShowConfirmComponent;
  })(DXBaseComponent);
  daxiapp["DXShowConfirmComponent"] = DXShowConfirmComponent;

  /** 景区列表弹窗组件 - 支持多级景区展示和切换 */
  const DXShowSceneListComponent = (function (DXBaseComponent) {
    const DXShowSceneListComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXShowSceneListComponent";
      },

      init: function (parentDom, params) {
        this._listener = params;
        this._params = params;
        this._domStr = `<div class="sceneListBox"><div class="sceneListContent"></div></div>`;
        this._super(parentDom, params);

        if (!params.visible) {
          this._dom.hide();
        }
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;

        // 展开/收起箭头点击
        domUtils.on(that._dom, "click", ".arrow", function (event) {
          event.stopPropagation();
          const id = $(this).attr("data-id");
          that._listener?.onSceneClick?.(id);
        });

        // 景区名称点击
        domUtils.on(that._dom, "click", ".scenename", function (event) {
          event.stopPropagation();
          const id = $(this).attr("data-id");
          const type = $(this).attr("data-type");

          if (type == 1) {
            that._listener?.onSceneClick?.(id);
          } else if (type == 2) {
            that._listener?.tapScene?.(id);
            that.slideDown();
            daxiapp.dom.hideMask();
          }
        });

        // 更多按钮点击
        domUtils.on(that._dom, "click", ".more", function (event) {
          event.stopPropagation();
          that._listener?.more?.();
          that.slideDown();
        });

        // 子景区项点击
        domUtils.on(that._dom, "click", ".li", function (event) {
          event.stopPropagation();
          const id = $(this).attr("data-id");
          const token = $(this).attr("data-token");
          const bdid = $(this).attr("data-bdid");
          that._listener?.tapScene?.(id, token, bdid);
          that.slideDown();
          daxiapp.dom.hideMask();
        });

        // 背景点击关闭
        domUtils.on(that._dom, "click", ".sceneBg", function (event) {
          event.stopPropagation();
          that.slideDown();
        });

        // 点击遮罩关闭
        domUtils.on(that._dom, "click", function (event) {
          if (event.target.className == "sceneListBox") {
            event.stopPropagation();
            that.slideDown();
            daxiapp.dom.hideMask();
          }
        });
      },

      updateData: function (data) {
        const langData = window.langData || {};

        // 构建景区列表
        let listHtml = "";
        data.data?.forEach((item) => {
          // 子景区列表
          let scenicsHtml = "";
          if (item.show && item.list) {
            scenicsHtml = `<div class="scenics">
              ${item.list
                .map(
                  (scenic) => `
                <div  class="li ${scenic.visited ? "visited" : ""}" data-id="${scenic.id}" data-token="${scenic.token}" data-bdid="${scenic.bdid}">
                  <i class="jd shouxihu_smallScenic"/>${scenic.name}${scenic.hot ? '<i class="icon_hot"/>' : ""}
                </div>`,
                )
                .join("")}
            </div>`;
          }

          listHtml += `
            <div>
              <div class="bigScenic">
                <div class="scenename" data-id="${item.id}" data-type="${item.type}">
                  <i class="jd shouxihu_bigScenic"/>${item.name}
                </div>
                ${item.list?.length ? `<i class="arrow shouxihu_arrow-right-bold" data-id="${item.id}" data-type="${item.type}"/>` : ""}
              </div>
              ${scenicsHtml}
            </div>`;
        });

        const str = `
          <div class="sceniclist">
            <div class="scenicTitle clearFixed">
              <span class="title">${data.bdname}</span>
              ${data.hasMore == 1 ? `<span class="more">${langData["more"] || "更多"}</span>` : ""}
            </div>
            <div class="scenicCon">${listHtml}</div>
          </div>`;

        domUtils.find(this._dom, ".sceneListContent").html(str);
      },

      hide: function () {
        this._dom.hide();
      },

      show: function (params) {
        if (params) {
          this.updateData(params);
        }
        this._dom.show();
      },

      slideUp: function (params) {
        if (params) {
          this.updateData(params);
        }
        this._dom.show();
        this._dom.find(".sceneListContent").removeClass("hidden").addClass("show");
        daxiapp.dom.showMask();
      },

      slideDown: function () {
        const that = this;
        this._dom.find(".sceneListContent").removeClass("show").addClass("hidden");
        setTimeout(() => {
          daxiapp.dom.hideMask();
          that._dom.hide();
        }, 300);
      },

      remove: function () {
        this._dom.remove();
      },
    });
    return DXShowSceneListComponent;
  })(DXBaseComponent);
  daxiapp["DXShowSceneListComponent"] = DXShowSceneListComponent;

  /** 城市列表弹窗组件 - 左侧显示城市，右侧显示该城市下的景区 */
  const DXShowCityListComponent = (function (DXBaseComponent) {
    const DXShowCityListComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXShowCityListComponent";
      },

      init: function (parentDom, params) {
        this._listener = params;
        this._params = params;
        this._domStr = `<div class="cityListBox"><div class="cityListContent"></div></div>`;
        this._super(parentDom, params);

        if (!params.visible) {
          this._dom.hide();
        }
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;

        // 左侧城市点击
        domUtils.on(that._dom, "click", ".leftDept > span", function () {
          const citycode = $(this).attr("data-cityCode");
          that._listener?.LeftDeptTap?.(citycode);
        });

        // 右侧景区点击
        domUtils.on(that._dom, "click", ".rightCon", function () {
          const token = $(this).attr("data-token");
          const bdid = $(this).attr("data-bdid");
          const bdname = $(this).attr("data-scenicname");
          that._listener?.goto?.(token, bdid, bdname);
        });

        // 背景点击关闭
        domUtils.on(that._dom, "click", ".sceneBg", () => {
          that.slideDown();
        });

        // 点击遮罩关闭
        domUtils.on(that._dom, "click", (event) => {
          if (event.target.className == "cityListBox") {
            event.stopPropagation();
            that.slideDown();
            daxiapp.dom.hideMask();
          }
        });
      },

      updateData: function (citylist, activeCityCode) {
        // 构建左侧城市列表
        const leftHtml = citylist
          .map((item) => `<span ${item.cityCode == activeCityCode ? 'class="active"' : ""} data-cityCode="${item.cityCode}">${item.cityName}</span>`)
          .join("");

        // 构建右侧景区列表（只显示当前选中城市的景区）
        const activeCity = citylist.find((item) => item.cityCode == activeCityCode);
        const rightHtml =
          activeCity?.list
            ?.map(
              (city) => `
            <div class="rightCon" bindtap="goto" data-token="${city.token}" data-bdid="${city.bdid}" data-scenicName="${city.scenicName}">
              <i class="shouxihu_bigScenic"/>
              <div class="items">${city.scenicName}</div>
            </div>`,
            )
            .join("") || "";

        const str = `
          <div class="citylist clear">
            <div class="leftDept">${leftHtml}</div>
            <div class="rightDept">${rightHtml}</div>
          </div>`;

        domUtils.find(this._dom, ".cityListContent").html(str);
      },

      hide: function () {
        this._dom.hide();
      },

      show: function (params) {
        if (params) {
          this.updateData(params);
        }
        this._dom.show();
      },

      slideUp: function (params) {
        if (params) {
          this.updateData(params);
        }
        this._dom.show();
        this._dom.find(".cityListContent").removeClass("hidden").addClass("show");
      },

      slideDown: function () {
        const that = this;
        this._dom.find(".cityListContent").removeClass("show").addClass("hidden");
        setTimeout(() => {
          that._dom.hide();
        }, 300);
      },

      remove: function () {
        this._dom.remove();
      },
    });
    return DXShowCityListComponent;
  })(DXBaseComponent);
  daxiapp["DXShowCityListComponent"] = DXShowCityListComponent;

  /** 支付弹窗组件 - 支持多按钮回调 */
  const DXShowPayComponent = (function (DXBaseComponent) {
    const DXShowPayComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXShowPayComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `<div class="payBox"><div class="payBoxContent"></div></div>`;
        this._super(parentDom, params);
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;

        // 按钮点击
        domUtils.on(that._dom, "click", ".btn", function () {
          const index = $(this).index();
          if (index == 0) {
            that._params?.callback?.();
          } else {
            that._params?.[`callback${index}`]?.();
          }
          that.hide();
        });

        // 点击遮罩关闭
        domUtils.on(that._dom, "click", () => {
          that.hide();
        });
      },

      updateData: function (params) {
        this._params = params;

        const btnsHtml = params.btnArray?.map((btn, index) => `<span class="btn btn${index}"></span>`).join("") || "";

        const str = `<div class="payBoxBtns">${btnsHtml}</div>`;

        domUtils.find(this._dom, ".payBoxContent").html(str);

        // 单按钮时设置全宽
        const btn = domUtils.find(this._dom, ".btn");
        if (btn.length == 1) {
          btn.addClass("w100");
        }
      },

      hide: function () {
        this._dom.hide();
      },

      show: function (params) {
        if (params) {
          this.updateData(params);
        }
        this._dom.show();
      },

      remove: function () {
        this._dom.remove();
      },
    });
    return DXShowPayComponent;
  })(DXBaseComponent);
  daxiapp["DXShowPayComponent"] = DXShowPayComponent;

  /** 二维码弹窗组件 - 动态生成二维码 */
  const DXShowQRCodeComponent = (function (DXBaseComponent) {
    const DXShowQRCodeComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXShowQRCodeComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `
          <div class="qrcodeBox">
            <div class="qrcodeContent">
              <div class="content"></div>
              <i class="icon-close2"></i>
            </div>
            <div class="qrcodeBg"></div>
          </div>`;
        this._super(parentDom, params);
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;

        // 背景点击关闭
        domUtils.on(that._dom, "click", ".qrcodeBg", () => {
          that.hide();
        });

        // 关闭按钮点击
        domUtils.on(that._dom, "click", ".icon-close2", () => {
          that.hide();
        });
      },

      updateData: function (content, qrcode) {
        const contentDom = this._dom.find(".content");
        contentDom.html("").append($(content));

        // 生成二维码
        if (qrcode) {
          const qrcodeDom = document.getElementById("qrcode");
          this._qrcodeObj = new QRCode(qrcodeDom, {
            width: qrcodeDom?.width || 240,
            height: qrcodeDom?.height || 240,
          });
          this._qrcodeObj.makeCode(qrcode);
        }
        this.show();
      },

      hide: function () {
        this._dom.hide();
      },

      show: function (params) {
        if (params) {
          this.updateData(params);
        }
        this._dom.show();
      },

      remove: function () {
        this._dom.remove();
      },
    });
    return DXShowQRCodeComponent;
  })(DXBaseComponent);
  daxiapp["DXShowQRCodeComponent"] = DXShowQRCodeComponent;

  /** 底部确认弹窗组件 - 从底部滑出的确认框 */
  const DXShowConfirmBottomComponent = (function (DXBaseComponent) {
    const DXShowConfirmBottomComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXShowConfirmBottomComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `<div class="confirmBottomBox"><div class="confirmBottomBoxContent"></div></div>`;
        this._super(parentDom, params);
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;

        // 按钮点击
        domUtils.on(that._dom, "click", ".btn", function () {
          const index = $(this).index();
          if (index == 0) {
            that._params?.callback?.();
          } else {
            that._params?.[`callback${index}`]?.();
          }
          that.hide();
        });
      },

      updateData: function (params) {
        this._params = params;

        const btnsHtml = params.btnArray?.map((btn, index) => `<span class="btn btn${index}">${btn}</span>`).join("") || "";

        const str = `
          <div class="confirmBottomBoxTitle">${params.title}</div>
          <div class="confirmBottomBoxBtns">${btnsHtml}</div>`;

        domUtils.find(this._dom, ".confirmBottomBoxContent").html(str);
      },

      hide: function () {
        this._dom.hide();
      },

      show: function (params) {
        if (params) {
          this.updateData(params);
        }
        this._dom.show();
      },

      remove: function () {
        this._dom.remove();
      },
    });
    return DXShowConfirmBottomComponent;
  })(DXBaseComponent);
  daxiapp["DXShowConfirmBottomComponent"] = DXShowConfirmBottomComponent;

  /** 提示弹窗组件 - 带图片的提示框 */
  const DXShowTipsComponent = (function (DXBaseComponent) {
    const DXShowTipsComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXShowTipsComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `<div class="TipsBox"></div>`;
        this._super(parentDom, params);
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;

        // 关闭按钮点击
        domUtils.on(that._dom, "click", ".TipsBoxClose", () => {
          that.hide();
        });
      },

      updateData: function (params) {
        this._params = params;

        const str = `
          <div class="TipsBoxTitle">${params.title}</div>
          <div class="TipsBoxContent">${params.content}</div>
          <div class="TipsBoxBtns"><img src="${params.img}"></div>
          <div class="TipsBoxClose"><i class="icon_gb-delete2"></i></div>`;

        this._dom.html(str);
      },

      hide: function () {
        this._dom.hide();
        daxiapp.dom.hideMask();
      },

      show: function (params) {
        if (params) {
          this.updateData(params);
        }
        this._dom.show();
        daxiapp.dom.showMask();
      },

      remove: function () {
        this._dom.remove();
      },
    });
    return DXShowTipsComponent;
  })(DXBaseComponent);
  daxiapp["DXShowTipsComponent"] = DXShowTipsComponent;

  /** 全屏提示弹窗组件 - 带跳过按钮的全屏提示 */
  const DXShowFullViewTipsComponent = (function (DXBaseComponent) {
    const DXShowFullViewTipsComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXShowFullViewTipsComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `<div class="TipsFullViewBox"></div>`;
        this._super(parentDom, params);
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;

        // 返回按钮点击
        domUtils.on(that._dom, "click", ".hospital-back", () => {
          that.hide();
        });

        // 跳过按钮点击
        domUtils.on(that._dom, "click", ".skip", () => {
          that.hide();
        });
      },

      updateData: function (params) {
        this._params = params;
        const langData = window.langData || {};

        const str = `
          <div class="TipsBoxTitle">${params.title}</div>
          <div class="TipsBoxContent">${params.content}</div>
          ${!params.hideBackBtn ? '<div class="hospital-back"></div>' : ""}
          <div class="skip">
            <span>${langData["jump:over:btntext"] || "跳过"}</span>
            <span>${langData["open:ble:tip"] || "若不开启蓝牙和位置信息，无法使用实时导航"}</span>
          </div>`;

        this._dom.html(str);
      },

      hide: function () {
        this._dom.hide();
      },

      show: function (params) {
        if (params) {
          this.updateData(params);
        }
        this._dom.show();
      },

      remove: function () {
        this._dom.remove();
      },
    });
    return DXShowFullViewTipsComponent;
  })(DXBaseComponent);
  daxiapp["DXShowFullViewTipsComponent"] = DXShowFullViewTipsComponent;

  /** 蓝牙开启提示组件 - 引导用户开启蓝牙和位置权限 */
  const DXTipBLEOpenComponent = (function (DXBaseComponent) {
    const DXTipBLEOpenComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXTipBLEOpenComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `<div class="TipsFullViewBox"></div>`;
        this._super(parentDom, params);
        this.updateData(params);
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;

        // 返回按钮点击
        domUtils.on(that._dom, "click", ".hospital-back", () => {
          that.hide();
        });

        // 跳过按钮点击
        domUtils.on(that._dom, "click", ".skip", () => {
          that.hide();
        });
      },

      updateData: function (params) {
        this._params = params;
        const langData = window.langData || {};

        // 步骤1：开启蓝牙
        const step1Html = `
          <div>1、${langData["step2:1:open:ble:tip"] || "找到"}【<i class='icon_gb-lanya blue'></i>】图标并打开蓝牙</div>
          <div>${langData["step3:open:ble:tip"] || "或在【设置】蓝牙中打开蓝牙"}</div>
          <div>
            <p class="icon_gb-rectangle" style="width:40%;font-size:36px;color:var(--themeColor,#3973ee);margin:0 auto;padding-top:10px;"></p>
            <div class="lanyatipbar" style="background:#fff;width:68%;margin:0 auto;height:40px;border-radius:6px;padding:0px 4px 6px 5px;">
              <div style="background:#fff;border-radius:6px;width:100%;height:100%;box-shadow:1px 4px 4px #d9dee9,-1px 0px 2px #d7dce9;display:flex;justify-content:center;align-items:center;">
                <span class='icon_gb-lanya blue' style="background-color:var(--themeColor,#3973ee);padding:4px;border-radius:50%;color:#fff;"></span>
              </div>
            </div>
          </div>`;

        // 步骤2：开启位置权限
        const step2Html = `
          <div style="padding-top:20px">2、${langData["step2:1:open:ble:tip"] || "找到"}【<i class='icon-compass blue'></i>】${
            langData["step4:open:ble:tip"] || "图标并打开位置授权"
          }</div>
          <div>${langData["step5:open:ble:tip"] || "或在【设置】【隐私】【位置信息】中开启授权"}</div>
          <div>
            <p class="icon_gb-rectangle" style="width:40%;font-size:36px;color:var(--themeColor,#3973ee);margin:0 auto;padding-top:10px;"></p>
            <div class="lanyatipbar" style="background:#fff;width:68%;margin:0 auto;height:max-content;border-radius:6px;padding:0px 4px 6px 5px;">
              <div style="background:#fff;border-radius:6px;width:100%;height:100%;box-shadow:1px 4px 4px #d9dee9,-1px 0px 2px #d7dce9;padding:6px 10px;">
                <div style="display:flex;align-items:center;"><span class="icon-fanhui"></span><h4 style="flex:1;">${
                  langData["locaionInfo:text"] || "位置信息"
                }</h4></div>
                <div style="font-size:1rem;line-height:1.5;text-align:left;display:flex;align-items:center;">
                  <div style="flex:1;">
                    <h4 style="font-size:0.9rem">${langData["open:locService:title"] || "开启位置服务"}</h4>
                    <p style="font-size:0.8rem">${langData["open:locService:desc"] || "有权限的应用能得到您的位置信息"}</p>
                  </div>
                  <span class='icon_gb-select blue' style="color:var(--themeColor,#3973ee);font-size:1.3rem;"></span>
                </div>
              </div>
            </div>
          </div>`;

        // 步骤3：开启附近设备权限
        const step3Html = `
          <div style="padding-top:20px">3、在【设置】【应用和服务】【应用管理】中找到【微信】，开启其他权限中的【附近设备】</div>
          <p class="icon_gb-rectangle" style="width:40%;font-size:36px;color:var(--themeColor,#3973ee);margin:0 auto;padding-top:10px;"></p>
          <div class="lanyatipbar" style="background:#fff;width:68%;margin:0 auto;height:max-content;border-radius:6px;padding:0px 4px 6px 5px;">
            <div style="background:#fff;border-radius:6px;width:100%;height:100%;box-shadow:1px 4px 4px #d9dee9,-1px 0px 2px #d7dce9;padding:6px 10px;">
              <div style="text-align:left"><span style="color:#4a5276;font-size:15px;font-weight:bold;"></span></div>
              <div style="display:flex">
                <div style="border-radius:50%;width:30px;height:30px;margin-right:5px;line-height:30px;text-align:center;background:var(--themeColor,#3973ee);color:#fff;">
                  <img src="./images/bleSetting.svg" alt="" style="width:26px;padding:2px 0;">
                </div>
                <div>
                  <div style="font-size:1rem;color:#333;line-height:1.2rem;text-align:left;">附近设备</div>
                  <div style="font-size:0.8rem;color:#999;text-align:left;line-height:1.2rem;">允许</div>
                </div>
              </div>
            </div>
          </div>`;

        const str = `
          <div class="TipsBoxTitle">${langData["step1:open:ble:tip"] || "请打开蓝牙使用本系统"}</div>
          <div class="TipsBoxContent">${step1Html}${step2Html}${step3Html}</div>
          <div class="hospital-back" style="display:${!params?.hideBackBtn ? "" : "none"}"></div>
          <div class="skip">
            <span>${langData["jump:over:btntext"] || "跳过"}</span>
            <span>${langData["open:ble:tip"] || "若不开启蓝牙和位置信息，无法使用实时导航"}</span>
          </div>`;

        this._dom.html(str);
      },

      showBackBtn: function () {
        domUtils.find(this._dom, ".hospital-back").show();
      },

      hideBackBtn: function () {
        domUtils.find(this._dom, ".hospital-back").hide();
      },

      hide: function () {
        this._dom.hide();
      },

      show: function (params) {
        if (params) {
          this.updateData(params);
        }
        this._dom.show();
      },

      remove: function () {
        this._dom.remove();
      },
    });
    return DXTipBLEOpenComponent;
  })(DXBaseComponent);
  daxiapp["DXTipBLEOpenComponent"] = DXTipBLEOpenComponent;

  /** 蓝牙和GPS开启提示组件 - 简洁版引导 */
  const DXTipBLEGPSOpenComponent = (function (DXBaseComponent) {
    const DXTipBLEGPSOpenComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXTipBLEGPSOpenComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `<div class="TipsFullViewBox"></div>`;
        this._super(parentDom, params);
        this.updateData(params);
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;

        // 返回按钮点击
        domUtils.on(that._dom, "click", ".hospital-back", () => {
          that.hide();
        });

        // 跳过按钮点击
        domUtils.on(that._dom, "click", ".skip", () => {
          that.hide();
        });
      },

      updateData: function (params) {
        this._params = params;
        const langData = window.langData || {};

        const contentHtml = `
          <h3 class="title" style="margin-bottom:30px">${langData["open:gpsble:tip"] || "使用本系统需要打开定位和蓝牙"}</h3>
          <div style="margin-bottom:30px">
            <h4>1、${langData["open:gps:tip:title"] || "开启手机的定位权限"}</h4>
            <p>${langData["open:gps:tipdesc"] || "开启手机的定位权限用于提供导航定位、路线规划及与定位相关功能的使用"}</p>
          </div>
          <div style="margin-bottom:30px">
            <h4>2、${langData["open:ble:tip:title"] || "打开手机的蓝牙"}</h4>
            <p>${langData["open:ble:tipdesc"] || "打开手机的蓝牙用于获取蓝牙定位信号，提供室内定位及导航服务"}</p>
          </div>`;

        const str = `
          <div class="TipsBoxContent" style="margin:44px 36px 0px 36px;text-align:left;">${contentHtml}</div>
          <div class="hospital-back" style="display:${!params?.hideBackBtn ? "" : "none"}"></div>
          <div class="skip">
            <span>${langData["jump:over:btntext"] || "跳过"}</span>
            <span>${langData["open:ble:tip"] || "若不开启蓝牙和位置信息，无法使用实时导航"}</span>
          </div>`;

        this._dom.html(str);
      },

      showBackBtn: function () {
        domUtils.find(this._dom, ".hospital-back").show();
      },

      hideBackBtn: function () {
        domUtils.find(this._dom, ".hospital-back").hide();
      },

      hide: function () {
        this._dom.hide();
      },

      show: function (params) {
        if (params) {
          this.updateData(params);
        }
        this._dom.show();
      },

      remove: function () {
        this._dom.remove();
      },
    });
    return DXTipBLEGPSOpenComponent;
  })(DXBaseComponent);
  daxiapp["DXTipBLEGPSOpenComponent"] = DXTipBLEGPSOpenComponent;

  /** 详情信息组件2 - 带音频播放功能的POI详情卡片 */
  const DXDetailInfoComponent2 = (function (DXBaseComponent) {
    const DXDetailInfoComponent2 = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXDetailInfoComponent2";
        const that = this;

        // 音频事件处理器
        this.onAudioEnded = () => {
          domUtils.find(that._dom, ".playAndPause").removeClass("pause").addClass("play");
          that.listener?.onAudioEnded?.();
        };

        this.onDurationchange = () => {
          const audioDom = that.audioDom;
          const dom = that._dom;
          const audioProgress = domUtils.find(dom, ".audioProgress");
          const currentTime = audioDom.currentTime;
          const duration = audioDom.duration;
          const progressTime = domUtils.find(dom, ".progressTime");
          audioProgress.attr("value", currentTime);
          audioProgress.attr("max", duration);
          progressTime.html(`${dxUtils.conversion(currentTime)}/${dxUtils.conversion(duration)}`);
        };

        this.onCanplay = () => {
          const audioDom = that.audioDom;
          if (audioDom && that._data?.autoplay) {
            audioDom.play();
            domUtils.find(that._dom, ".playAndPause").removeClass("play").addClass("pause");
          }
        };

        this.onPlay = () => {
          domUtils.find(that._dom, ".playAndPause").removeClass("play").addClass("pause");
        };

        this.onPause = () => {
          domUtils.find(that._dom, ".playAndPause").addClass("play").removeClass("pause");
        };

        this.visibilitychangeListener = () => {
          if (document.hidden) {
            that.pausePlay();
          }
        };
      },

      init: function (parentDom, params) {
        this._params = params;
        const styleAttr = buildStyleAttr(params?.style);
        this._domStr = `<div class="detailInfo-component ${params?.class || ""}"${styleAttr}><div></div></div>`;
        this._super(parentDom, params);

        if (params?.data) {
          this.updateData(params.data);
        }
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;
        const listener = this.listener;

        // 路线按钮点击
        if (listener?.onRouteBtnClicked) {
          domUtils.on(that._dom, "click", ".go-route", () => {
            listener.onRouteBtnClicked(that, that._data);
          });
        }

        // 音频点击
        if (listener?.onAudioClicked) {
          domUtils.on(that._dom, "click", "audio", () => {
            listener.onAudioClicked(that, that._data);
          });
        }

        // 关闭按钮
        domUtils.on(that._dom, "click", ".close", () => {
          that.cancel();
          that.hide();
          listener?.onClose?.();
        });

        // 播放/暂停按钮
        domUtils.on(that._dom, "click", ".playAndPause", function () {
          if ($(this).hasClass("play")) {
            that.startPlay();
          } else {
            that.pausePlay();
          }
        });

        // 后退15秒
        domUtils.on(that._dom, "click", ".prev15", () => {
          that.back15();
        });

        // 前进15秒
        domUtils.on(that._dom, "click", ".next15", () => {
          that.forward15();
        });

        // 倍速切换
        domUtils.on(that._dom, "click", ".speedNow", function () {
          const speed = $(this).attr("data-speed");
          const speedArr = [0.75, 1.0, 1.5];
          let index = speedArr.findIndex((s) => s == speed);
          index = index + 1 >= speedArr.length ? 0 : index + 1;
          $(this).text(`x${speedArr[index]}`);
          $(this).attr("data-speed", speedArr[index]);
          that.setSpeed(speedArr[index]);
        });

        // 倍速选择框
        domUtils.on(that._dom, "click", ".speedbox2 span", function () {
          const speed = $(this).attr("data-speed");
          const text = $(this).text();
          $(this).addClass("on").siblings().removeClass("on");
          that._dom.find(".speedNow").text(text);
          that.setSpeed(speed);
          that._dom.find(".speedBox").removeClass("show");
        });

        // 进度条点击
        domUtils.on(that._dom, "click", ".progressBox", function (e) {
          const offsetX = e.offsetX;
          const width = $(this).width();
          const dxaudio = that.audioDom;
          if (dxaudio) {
            dxaudio.currentTime = (dxaudio.duration * offsetX) / width;
          }
        });

        // 进度条拖动
        domUtils.on(that._dom, "touchmove", ".progressTime", function (e) {
          const offsetLeft = domUtils.find(that._dom, ".progressBox").offset().left;
          const x = e.changedTouches[0].clientX;
          const width = domUtils.find(that._dom, ".progressBox").width();
          const dxaudio = that.audioDom;
          if (dxaudio && width) {
            dxaudio.currentTime = (dxaudio.duration * (x - offsetLeft)) / width;
          }
        });

        domUtils.on(that._dom, "touchend", ".progressTime", () => {
          const dxaudio = that.audioDom;
          if (dxaudio && dxaudio.duration > dxaudio.currentTime + 1) {
            dxaudio.play();
          }
        });

        // 讲解按钮
        domUtils.on(that._dom, "click", ".go-listen", () => {
          that.listener?.onListenBtnClicked?.(that, that._data);
        });

        // 音频结束事件
        const audioDom = that.audioDom;
        audioDom?.addEventListener("ended", () => {
          that.listener?.onAudioEnded?.();
        });

        // 更多按钮
        domUtils.on(that._dom, "click", ".more-btn", (e) => {
          if (domUtils.isFastClick()) return;
          that.listener?.moreClick?.(that, that._data);
        });

        // 地址点击
        domUtils.on(that._dom, "click", ".address", (e) => {
          if (domUtils.isFastClick()) return;
          that.listener?.moreClick?.(that, that._data);
        });
      },

      updateData: function (data) {
        const that = this;
        this._data = data;
        const langData = window.langData || {};
        const imageUrl = data.thumbnail || data.imageUrl;
        const text = data.name || data.text;
        let description = data.description;
        if (description) {
          description = description.replace(/\n/g, "");
        }

        const str = `
          ${data.iconClose ? "<span class='close'><i class='icon_gb-close4'></i></span>" : ""}
          <div class='flex-wrapper'>
            ${imageUrl ? `<div class="img_box"><p class="img_container"><img class="info-image" src="${imageUrl}"/></p></div>` : ""}
            <div class="info_container flex-column">
              ${data.name ? `<p><span class="name title">${text}</span></p>` : ""}
              ${data.detail ? `<p class="address">${data.detail}</p>` : ""}
              ${!description && data.address ? `<p class="address">${data.address}</p>` : ""}
              ${description ? `<div class="address">${description}</div><div class="more-btn"><i class="icon-right-arrow"></i></div>` : ""}
            </div>
            <div class='btns'>
              <div class="listenbtn"><span class="icon-headset2 go-listen text-btn">${langData["jiangjie:btntext"] || "讲解"}</span></div>
              ${
                data.showLineBtn ? `<div class="routebtn"><span class="icon_gb-line go-route text-btn">${langData["route:btntext"] || "路线"}</span></div>` : ""
              }
            </div>
          </div>`;

        this._dom.html(str);

        if (!this._params?.speakListener) {
          const audioDom = domUtils.find(this._dom, "audio")[0];
          this.audioDom = audioDom;
          this.loadAudio();
        } else {
          this.audioDom = null;
        }

        if (imageUrl && that.listener?.onImgLoaded) {
          const img = domUtils.find(this._dom, ".info-image")[0];
          img.onload = () => {
            that.listener.onImgLoaded();
          };
        }
      },

      loadAudio: function () {
        const audioDom = this.audioDom;
        if (audioDom) {
          audioDom.addEventListener("timeupdate", this.timeupdate);
          audioDom.addEventListener("durationchange", this.onDurationchange);
          audioDom.addEventListener("canplay", this.onCanplay);
          audioDom.addEventListener("play", this.onPlay);
          audioDom.addEventListener("pause", this.onPause);
          audioDom.addEventListener("ended", this.onAudioEnded);
          document.addEventListener("visibilitychange", this.visibilitychangeListener);
        }
      },

      updateIcon: function (icon) {
        const className = this._dom.attr("class").replace(this._iconName || "", icon);
        this._dom.attr("class", className);
        this._iconName = icon;
      },

      startPlay: function () {
        const data = this._data;
        let dxaudio = this.audioDom;

        if (this._params?.speakListener && data?.audioUrl && !dxaudio) {
          const audioDom = this._params.speakListener.speakNow({
            url: data.audioUrl,
            autoplay: data.autoplay,
            noReplaceByNavi: true,
          });
          this.audioDom = audioDom;
          audioDom._parentDom = this._dom;
          this.loadAudio();
        } else if (dxaudio) {
          dxaudio.play();
          domUtils.find(this._dom, ".playAndPause").removeClass("play").addClass("pause");
        }
      },

      pausePlay: function () {
        const dxaudio = this.audioDom;
        if (dxaudio) {
          dxaudio.pause();
          domUtils.find(this._dom, ".playAndPause").removeClass("pause").addClass("play");
        }
      },

      forward15: function () {
        const dxaudio = this.audioDom;
        if (dxaudio) {
          const currentTime = dxaudio.currentTime;
          const duration = dxaudio.duration;
          dxaudio.currentTime = currentTime + 15 > duration ? duration : currentTime + 15;
        }
      },

      back15: function () {
        const dxaudio = this.audioDom;
        if (dxaudio) {
          const currentTime = dxaudio.currentTime;
          dxaudio.currentTime = currentTime - 15 < 0 ? 0 : currentTime - 15;
        }
      },

      setSpeed: function (speed) {
        const dxaudio = this.audioDom;
        if (dxaudio) {
          dxaudio.playbackRate = speed;
        }
      },

      timeupdate: function (e) {
        const dxaudio = e.target;
        const audioProgressBar = $(dxaudio.nextSibling);
        const parentDom = dxaudio._parentDom;
        const audioProgress = parentDom ? parentDom.find(".audioProgress") : audioProgressBar.find(".audioProgress");
        const currentTime = dxaudio.currentTime;
        const duration = dxaudio.duration;
        const progressTime = parentDom ? domUtils.find(parentDom, ".progressTime") : audioProgressBar.find(".progressTime");

        if (!duration) return;

        audioProgress.attr("value", currentTime);
        audioProgress.attr("max", duration);
        progressTime.html(`${dxUtils.conversion(currentTime)}/${dxUtils.conversion(duration)}`);

        const width = progressTime.width();
        const parentWidth = progressTime.parent().width();
        const maxOffset = 1 - width / parentWidth;

        if (currentTime / duration > maxOffset) {
          progressTime.css("left", `${maxOffset * 100}%`);
        } else {
          progressTime.css("left", `${(currentTime / duration) * 100}%`);
        }
      },

      cancel: function () {
        this.pausePlay();

        if (this.audioDom && this._params?.speakListener) {
          this._params.speakListener.cancel();
        }

        if (this.audioDom) {
          const audioDom = this.audioDom;
          audioDom.removeEventListener("timeupdate", this.timeupdate);
          audioDom.removeEventListener("durationchange", this.onDurationchange);
          audioDom.removeEventListener("canplay", this.onCanplay);
          audioDom.removeEventListener("play", this.onPlay);
          audioDom.removeEventListener("ended", this.onAudioEnded);
        }
        document.removeEventListener("visibilitychange", this.visibilitychangeListener);
      },

      updateDetail: function (data) {
        const box = this._dom.find(".address");
        const detail = this._dom.find(".address p");
        const moreBtn = this._dom.find(".more-btn");
        if (detail.height() > box.height()) {
          moreBtn.show();
        } else {
          moreBtn.hide();
        }
      },
    });
    return DXDetailInfoComponent2;
  })(DXBaseComponent);
  daxiapp["DXDetailInfoComponent2"] = DXDetailInfoComponent2;

  /** DXSpotPopupComponent - 现代化景点详情弹窗组件 */
  const DXSpotPopupComponent = (function (DXBaseComponent) {
    const DXSpotPopupComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXSpotPopupComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._parentDom = parentDom;

        // 创建弹窗卡片
        this._domStr = `
          <div class="spot-popup-card ${params?.class || ""}">
            <div class="spot-popup-body">
              <button class="spot-popup-close">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div class="spot-popup-content"></div>
              <div class="spot-popup-buttons"></div>
            </div>
          </div>
        `;

        this._super(parentDom, params);

        if (params?.data) {
          this.updateData(params.data);
        }
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;
        const listener = this.listener;

        // 关闭按钮点击
        domUtils.on(that._dom, "click", ".spot-popup-close", () => {
          that.hide();
          listener?.onClose?.(that, that._data);
        });

        // 路线按钮点击
        domUtils.on(that._dom, "click", ".spot-popup-btn-primary", () => {
          if (domUtils.isFastClick?.()) return;
          listener?.onRouteBtnClicked?.(that, that._data);
        });

        // 讲解按钮点击
        domUtils.on(that._dom, "click", ".spot-popup-btn-secondary", () => {
          if (domUtils.isFastClick?.()) return;
          listener?.onListenBtnClicked?.(that, that._data);
        });

        // 景点介绍点击（查看详情）
        domUtils.on(that._dom, "click", ".spot-popup-desc", () => {
          if (domUtils.isFastClick?.()) return;
          listener?.moreClick?.(that, that._data);
        });
      },

      /** 更新弹窗数据 */
      updateData: function (data, detailData) {
        const that = this;
        this._data = data;

        const imageUrl = data.thumbnail || data.imageUrl;
        const name = data.name || data.text || "";
        const address = data.address || data.floorName || "";
        let desc = data.description || data.detail || "";
        if (desc) desc = desc.replace(/<[^>]+>/g, "").replace(/\n/g, "");

        // 判断是否有讲解（根据 audioUrl 或 type 判断）
        const hasAudio = data.audioUrl || data.type == "Exhibition" || data.type == "Exhibit";

        // 构建内容区域
        const contentStr = `
          <div class="spot-popup-thumbnail">
            ${
              imageUrl
                ? `<img class="info-image" src="${imageUrl}" alt="${name}" />`
                : data.icon
                  ? `<i class="${data.icon}" style="font-size:3rem;color:var(--dxmap-themeColor);"></i>`
                  : ""
            }
          </div>
          <div class="spot-popup-info">
            <h2 class="spot-popup-title">${name}</h2>
            <div class="spot-popup-meta">
              ${address ? `<span class="spot-popup-address">${address}</span>` : ""}
              ${
                data.rating
                  ? `
                <span class="spot-popup-divider">|</span>
                <span class="spot-popup-rating">
                  <svg viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                  ${data.rating}
                </span>
              `
                  : ""
              }
            </div>
            ${desc ? `<p class="spot-popup-desc">${desc}</p>` : ""}
            ${detailData?.type == 1 && detailData.detail ? `<div class="spot-popup-detail">${detailData.detail}</div>` : ""}
          </div>
        `;

        domUtils.find(this._dom, ".spot-popup-content").html(contentStr);

        // 构建按钮区域
        const langData = window.langData || {};
        const routeBtnText = langData["go:here"] || "去这里";
        const listenBtnText = langData["jiangjie:btntext"] || "听讲解";

        const btnStr = `
          ${
            data.showLineBtn != false
              ? `
            <button class="spot-popup-btn spot-popup-btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
              ${routeBtnText}
            </button>
          `
              : ""
          }
          ${
            hasAudio
              ? `
            <button class="spot-popup-btn spot-popup-btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              ${listenBtnText}
            </button>
          `
              : ""
          }
        `;

        domUtils.find(this._dom, ".spot-popup-buttons").html(btnStr);

        // 图片加载回调
        if (imageUrl && that.listener?.onImgLoaded) {
          const img = domUtils.find(this._dom, ".info-image")[0];
          if (img) {
            img.onload = () => {
              that.listener.onImgLoaded();
            };
          }
        }
      },

      /** 显示弹窗 */
      show: function () {
        this._dom.show();
      },

      /** 隐藏弹窗 */
      hide: function () {
        this._dom.hide();
      },

      /** 获取弹窗高度 */
      getHeight: function () {
        return domUtils.find(this._dom, ".spot-popup-body").height() || 0;
      },

      /** 取消/清理资源 */
      cancel: function () {
        this.hide();
      },

      /** 播放相关方法的兼容性存根 */
      startPlay: function () {},
      pausePlay: function () {},
    });
    return DXSpotPopupComponent;
  })(DXBaseComponent);
  daxiapp["DXSpotPopupComponent"] = DXSpotPopupComponent;

  /** 详情信息组件3 - 带缩略图播放按钮的POI详情卡片 */
  const DXDetailInfoComponent3 = (function (DXBaseComponent) {
    const DXDetailInfoComponent3 = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXDetailInfoComponent3";
        const that = this;

        // 音频事件处理器
        this.onAudioEnded = () => {
          domUtils.find(that._dom, ".playAndPause").removeClass("pause").addClass("play");
          that.listener?.onAudioEnded?.();
        };

        this.onCanplay = () => {
          const audioDom = that.audioDom;
          if (audioDom && that._data?.autoplay) {
            audioDom.play();
            domUtils.find(that._dom, ".playAndPause").removeClass("play").addClass("pause");
          }
        };

        this.onPlay = () => {
          domUtils.find(that._dom, ".playAndPause").removeClass("play").addClass("pause");
        };

        this.onPause = () => {
          domUtils.find(that._dom, ".playAndPause").addClass("play").removeClass("pause");
        };

        this.visibilitychangeListener = () => {
          if (document.hidden) {
            that.pausePlay();
          }
        };
      },

      init: function (parentDom, params) {
        this._params = params;
        const styleAttr = buildStyleAttr(params?.style);
        this._domStr = `<div class="detailInfo-component ${params?.class || ""}"${styleAttr}><div></div></div>`;
        this._super(parentDom, params);

        if (params?.data) {
          this.updateData(params.data);
        }
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;
        const listener = this.listener;

        // 路线按钮点击
        if (listener?.onRouteBtnClicked) {
          domUtils.on(that._dom, "click", ".go-route", () => {
            listener.onRouteBtnClicked(that, that._data);
          });
        }

        // 音频点击
        if (listener?.onAudioClicked) {
          domUtils.on(that._dom, "click", "audio", () => {
            listener.onAudioClicked(that, that._data);
          });
        }

        // 关闭按钮
        domUtils.on(that._dom, "click", ".close", () => {
          that.cancel();
          that.hide();
          listener?.onClose?.();
        });

        // 播放/暂停按钮
        domUtils.on(that._dom, "click", ".audioPlayAndPause", function () {
          if ($(this).hasClass("audioplay")) {
            that.startPlay();
          } else {
            that.pausePlay();
          }
        });

        // 讲解按钮
        domUtils.on(that._dom, "click", ".go-listen", () => {
          that.listener?.onListenBtnClicked?.(that, that._data);
        });

        // 音频结束事件
        const audioDom = that.audioDom;
        audioDom?.addEventListener("ended", () => {
          that.listener?.onAudioEnded?.();
        });

        // 更多按钮
        domUtils.on(that._dom, "click", ".more-btn", (e) => {
          if (domUtils.isFastClick()) return;
          that.listener?.moreClick?.(that, that._data);
        });

        // 地址点击
        domUtils.on(that._dom, "click", ".address", (e) => {
          if (domUtils.isFastClick()) return;
          that.listener?.moreClick?.(that, that._data);
        });
      },

      updateData: function (data) {
        const that = this;
        this._data = data;
        const langData = window.langData || {};
        const imageUrl = data.thumbnail || data.imageUrl;
        const text = data.name || data.text;
        let description = data.description;
        if (description) {
          description = description.replace(/\n/g, "");
        }

        const str = `
          ${data.iconClose ? "<span class='close'><i class='icon_gb-close4'></i></span>" : ""}
          <div class='flex-wrapper'>
            ${
              imageUrl
                ? `
              <div class="img_box">
                <p class="img_container">
                  <img class="info-image" src="${imageUrl}"/>
                  <span class="audioPlayAndPause audioplay" style="position:absolute;top:-16px;margin-top:50%;margin-left:50%;left:-16px;width:32px;border-radius:50%;padding:4px;display:inline-block;height:32px;background-size:contain;"></span>
                </p>
              </div>`
                : ""
            }
            ${
              data.audioUrl
                ? `<audio style="display:none" controls="controls" ${data.autoplay ? "autoplay" : ""} class="audio" style="width:initial;flex:1">
                <source src="${data.audioUrl}" type="audio/mp3"></source>
              </audio>`
                : ""
            }
            <div class="info_container flex-column">
              ${data.name ? `<p><span class="name title">${text}</span></p>` : ""}
              ${data.detail ? `<p class="address" style="width:100%">${data.detail}</p>` : ""}
              ${!description && data.address ? `<p class="address" style="width:100%">${data.address}</p>` : ""}
              ${description ? `<div class="address" style="width:100%">${description}</div><div class="more-btn"><i class="icon-right-arrow"></i></div>` : ""}
            </div>
          </div>
          <div class='btns' style='position:relative;margin-top:10px;'>
            ${
              data.showLineBtn
                ? `<div class="routebtn" style="float:left;"><span class="icon_gb-line go-route text-btn">${langData["route:btntext"] || "路线"}</span></div>`
                : ""
            }
            <div class="listenbtn"><span class="icon-headset2 go-listen text-btn">${langData["jiangjie:btntext"] || "讲解"}</span></div>
          </div>
        `;

        this._dom.html(str);

        if (!this._params?.speakListener) {
          const audioDom = domUtils.find(this._dom, "audio")[0];
          this.audioDom = audioDom;
          this.loadAudio();
        } else {
          this.audioDom = null;
        }

        if (imageUrl && that.listener?.onImgLoaded) {
          const img = domUtils.find(this._dom, ".info-image")[0];
          img.onload = () => {
            that.listener.onImgLoaded();
          };
        }
      },

      loadAudio: function () {
        const audioDom = this.audioDom;
        if (audioDom) {
          audioDom.addEventListener("canplay", this.onCanplay);
          audioDom.addEventListener("play", this.onPlay);
          audioDom.addEventListener("pause", this.onPause);
          audioDom.addEventListener("ended", this.onAudioEnded);
          document.addEventListener("visibilitychange", this.visibilitychangeListener);
        }
      },

      updateIcon: function (icon) {
        const className = this._dom.attr("class").replace(this._iconName || "", icon);
        this._dom.attr("class", className);
        this._iconName = icon;
      },

      startPlay: function () {
        const data = this._data;
        let dxaudio = this.audioDom;

        if (this._params?.speakListener && data?.audioUrl && !dxaudio) {
          const audioDom = this._params.speakListener.speakNow({
            url: data.audioUrl,
            autoplay: data.autoplay,
            noReplaceByNavi: true,
          });
          this.audioDom = audioDom;
          audioDom._parentDom = this._dom;
          this.loadAudio();
        } else if (dxaudio) {
          dxaudio.play();
          domUtils.find(this._dom, ".audioPlayAndPause").removeClass("audioplay").addClass("audiopause");
        }
      },

      pausePlay: function () {
        const dxaudio = this.audioDom;
        if (dxaudio) {
          dxaudio.pause();
          domUtils.find(this._dom, ".audioPlayAndPause").removeClass("audiopause").addClass("audioplay");
        }
      },

      cancel: function () {
        this.pausePlay();

        if (this.audioDom && this._params?.speakListener) {
          this._params.speakListener.cancel();
        }

        if (this.audioDom) {
          const audioDom = this.audioDom;
          audioDom.removeEventListener("timeupdate", this.timeupdate);
          audioDom.removeEventListener("durationchange", this.onDurationchange);
          audioDom.removeEventListener("canplay", this.onCanplay);
          audioDom.removeEventListener("play", this.onPlay);
          audioDom.removeEventListener("ended", this.onAudioEnded);
        }
        document.removeEventListener("visibilitychange", this.visibilitychangeListener);
      },

      updateDetail: function (data) {
        const box = this._dom.find(".address");
        const detail = this._dom.find(".address p");
        const moreBtn = this._dom.find(".more-btn");
        if (detail.height() > box.height()) {
          moreBtn.show();
        } else {
          moreBtn.hide();
        }
      },
    });
    return DXDetailInfoComponent3;
  })(DXBaseComponent);
  daxiapp["DXDetailInfoComponent3"] = DXDetailInfoComponent3;

  /** 支付组件 - 产品购买列表 */
  const DXPayComponent = (function (DXBaseComponent) {
    const DXPayComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXPayComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `<div class="pay_tip_container"></div>`;
        this._super(parentDom, params);
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;
        const listener = this.listener;

        // 关闭按钮
        if (listener?.onClose) {
          domUtils.on(that._dom, "click", ".close_pay", () => {
            listener.onClose(that, that._data);
          });
        }

        // 购买按钮
        if (listener?.toPay) {
          domUtils.on(that._dom, "click", ".toPayBtn", function (e) {
            const id = $(this).attr("data-id");
            listener.toPay(that, id);
          });
        }
      },

      updateData: function (data) {
        this._data = data;

        // 构建产品列表
        const productListHtml = data.productList
          .map((product) => {
            let priceInfoHtml = "";

            if (product.deductionVoucherAmount) {
              // 有代金券的情况
              priceInfoHtml = `
                <div class="proInfo">
                  ${product.originalPrice ? `<span class="originalPrice">原价 ¥${product.originalPrice}</span>` : ""}
                  ${product.amount ? `<span class="originalPrice">现价 ¥${product.amount}</span>` : ""}
                  ${product.deductionVoucherAmount ? `<span>代金券抵扣 ¥${product.deductionVoucherAmount}</span>` : ""}
                  <span class="price">
                    ${product.discountedPrice ? `<span>抵扣后</span>${product.discountedPrice}` : ""}
                  </span>
                  <span class="toPayBtn" data-id="${product.productNo}" data-deductionVoucherId="${product.deductionVoucherId}">购买</span>
                </div>`;
            } else {
              // 无代金券的情况
              priceInfoHtml = `
                <div class="proInfo">
                  ${product.priceTypeName ? `<span>${product.priceTypeName}</span>` : ""}
                  <span class="price">¥${product.amount}</span>
                  <span class="toPayBtn" data-id="${product.productNo}" data-deductionVoucherId="${product.deductionVoucherId}">购买智能导游</span>
                </div>`;
            }

            return `
              <div class="prolists">
                <div class="proName">
                  ${product.productName}
                  <span class="tag">${product.tag}</span>
                  <span class="content">有效期：${product.useMinute}</span>
                </div>
                <div>${product.productDescription}</div>
                ${priceInfoHtml}
              </div>`;
          })
          .join("");

        const str = `
          <div class="pay_content">
            <div class="icon_gb-close4 close_pay"></div>
            <div class="proTitle">${data.productTitle}</div>
            <div class="proDesc">${data.productDesc}</div>
            <div class="paytypeli">${productListHtml}</div>
          </div>`;

        this._dom.html($(str));
        this.show();
      },

      show: function () {
        this._dom.show();
      },

      hide: function () {
        this._dom.hide();
      },
    });
    return DXPayComponent;
  })(DXBaseComponent);
  daxiapp["DXPayComponent"] = DXPayComponent;

  /** 支付方式选择组件 */
  const DXPayTypeComponent = (function (DXBaseComponent) {
    const DXPayTypeComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXPayTypeComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `<div class="paybox"></div>`;
        this._super(parentDom, params);
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;
        const listener = this.listener;

        // 取消按钮
        if (listener?.onClose) {
          domUtils.on(that._dom, "click", ".cancel", () => {
            listener.onClose(that, that._data);
          });
        }

        // 支付方式选择
        if (listener?.chooseType) {
          domUtils.on(that._dom, "click", ".paytypes", function (e) {
            const id = $(this).attr("data-id");
            listener.chooseType(that, id);
          });
        }
      },

      updateData: function (data) {
        this._data = data;

        const payWayHtml = data.payWayData
          .map(
            (payway) => `
            <div class="paytypes" data-id="${payway.id}" data-payWayCode="${payway.payWayCode}" data-payDataType="${payway.payDataType}">
              <image src="https://map1a.daxicn.com/DXOneMap/wxminpro_images/icon_${payway.payDataType}.png" />
              ${payway.name}
            </div>`,
          )
          .join("");

        const str = `
          <div class="paytypetitle">支付方式选择</div>
          <div class="paytypeli">${payWayHtml}</div>
          <div class="cancel">取消</div>`;

        this._dom.html($(str));
        this.show();
      },

      show: function () {
        this._dom.show();
      },

      hide: function () {
        this._dom.hide();
      },
    });
    return DXPayTypeComponent;
  })(DXBaseComponent);
  daxiapp["DXPayTypeComponent"] = DXPayTypeComponent;

  /** 支付成功提示组件 */
  const DXPaysuccessComponent = (function (DXBaseComponent) {
    const DXPaysuccessComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXPaysuccessComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `<div class="pay_tip_container paysuccess"></div>`;
        this._super(parentDom, params);
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;
        const listener = this.listener;

        // 关闭按钮
        if (listener?.onClose) {
          domUtils.on(that._dom, "click", ".close_pay", () => {
            listener.onClose(that, that._data);
          });
        }
      },

      updateData: function (data) {
        this._data = data;

        const str = `
          <div class="pay_content">
            <div class="icon_gb-close4 close_pay"></div>
            <div class="proTitle">${data.productTitle}</div>
            <div class="paytypeli">
              <div class="proDesc">${data.productDesc}</div>
            </div>
          </div>`;

        this._dom.html($(str));
        this.show();
      },

      show: function () {
        this._dom.show();
      },

      hide: function () {
        this._dom.hide();
      },
    });
    return DXPaysuccessComponent;
  })(DXBaseComponent);
  daxiapp["DXPaysuccessComponent"] = DXPaysuccessComponent;

  /** 详情信息组件 - 带音频播放功能的POI详情卡片 */
  const DXDetailInfoComponent = (function (DXBaseComponent) {
    const DXDetailInfoComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXDetailInfoComponent";
        const that = this;

        // 音频事件处理器
        this.onAudioEnded = () => {
          domUtils.find(that._dom, ".playAndPause").removeClass("pause").addClass("play");
          that.listener?.onAudioEnded?.();
        };

        this.onDurationchange = () => {
          const audioDom = that.audioDom;
          const dom = that._dom;
          const audioProgress = domUtils.find(dom, ".audioProgress");
          const currentTime = audioDom.currentTime;
          const duration = audioDom.duration;
          const progressTime = domUtils.find(dom, ".progressTime");
          audioProgress.attr("value", currentTime);
          audioProgress.attr("max", duration);
          progressTime.html(`${dxUtils.conversion(currentTime)}/${dxUtils.conversion(duration)}`);
        };

        this.onCanplay = () => {
          const audioDom = that.audioDom;
          if (audioDom && that._data?.autoplay) {
            audioDom.play();
            domUtils.find(that._dom, ".playAndPause").removeClass("play").addClass("pause");
          }
        };

        this.onPlay = () => {
          domUtils.find(that._dom, ".playAndPause").removeClass("play").addClass("pause");
        };

        this.onPause = () => {
          domUtils.find(that._dom, ".playAndPause").addClass("play").removeClass("pause");
        };

        this.visibilitychangeListener = () => {
          if (document.hidden) {
            that.pausePlay();
          }
        };
      },

      init: function (parentDom, params) {
        this._params = params;
        const styleAttr = buildStyleAttr(params?.style);
        this._domStr = `<div class="detailInfo-component ${params?.class || ""}"${styleAttr}><div></div></div>`;
        this._super(parentDom, params);

        if (params?.data) {
          this.updateData(params.data);
        }
      },

      injectComponentEvents: function () {
        this._super();
        const that = this;
        const listener = this.listener;

        // 路线按钮点击
        if (listener?.onRouteBtnClicked) {
          domUtils.on(that._dom, "click", ".go-route", () => {
            listener.onRouteBtnClicked(that, that._data);
          });
        }

        // 详情按钮点击
        if (listener?.onDeatilBtnClicked) {
          domUtils.on(that._dom, "click", ".img_container", () => {});
        }

        // 音频点击
        if (listener?.onAudioClicked) {
          domUtils.on(that._dom, "click", "audio", () => {
            listener.onAudioClicked(that, that._data);
          });
        }

        // 关闭按钮
        domUtils.on(that._dom, "click", ".close", () => {
          that.cancel();
          that.hide();
          listener?.onClose?.();
        });

        // 播放/暂停按钮
        domUtils.on(that._dom, "click", ".playAndPause", function () {
          if ($(this).hasClass("play")) {
            that.startPlay();
          } else {
            that.pausePlay();
          }
        });

        // 后退15秒
        domUtils.on(that._dom, "click", ".prev15", () => {
          that.back15();
        });

        // 前进15秒
        domUtils.on(that._dom, "click", ".next15", () => {
          that.forward15();
        });

        // 倍速切换
        domUtils.on(that._dom, "click", ".speedNow", function () {
          const speed = $(this).attr("data-speed");
          const speedArr = [0.75, 1.0, 1.5];
          let index = speedArr.findIndex((s) => s == speed);
          index = index + 1 >= speedArr.length ? 0 : index + 1;
          $(this).text(`x${speedArr[index]}`);
          $(this).attr("data-speed", speedArr[index]);
          that.setSpeed(speedArr[index]);
        });

        // 倍速选择框
        domUtils.on(that._dom, "click", ".speedbox2 span", function () {
          const speed = $(this).attr("data-speed");
          const text = $(this).text();
          $(this).addClass("on").siblings().removeClass("on");
          that._dom.find(".speedNow").text(text);
          that.setSpeed(speed);
          that._dom.find(".speedBox").removeClass("show");
        });

        // 进度条点击
        domUtils.on(that._dom, "click", ".progressBox", function (e) {
          const offsetX = e.offsetX;
          const width = $(this).width();
          const dxaudio = that.audioDom;
          if (dxaudio) {
            dxaudio.currentTime = (dxaudio.duration * offsetX) / width;
          }
        });

        // 进度条拖动
        domUtils.on(that._dom, "touchmove", ".progressTime", function (e) {
          const offsetLeft = domUtils.find(that._dom, ".progressBox").offset().left;
          const x = e.changedTouches[0].clientX;
          const width = domUtils.find(that._dom, ".progressBox").width();
          const dxaudio = that.audioDom;
          if (dxaudio && width) {
            dxaudio.currentTime = (dxaudio.duration * (x - offsetLeft)) / width;
          }
        });

        domUtils.on(that._dom, "touchend", ".progressTime", () => {
          const dxaudio = that.audioDom;
          if (dxaudio && dxaudio.duration > dxaudio.currentTime + 1) {
            dxaudio.play();
          }
        });

        // 讲解按钮
        if (listener?.onListenBtnClicked) {
          domUtils.on(that._dom, "click", ".go-listen", () => {
            listener.onListenBtnClicked(that, that._data);
          });
        }

        // 音频结束事件
        const audioDom = that.audioDom;
        audioDom?.addEventListener("ended", () => {
          that.listener?.onAudioEnded?.();
        });
      },

      updateData: function (data) {
        const that = this;
        this._data = data;
        const langData = window.langData || {};
        const imageUrl = data.thumbnail || data.imageUrl;
        const text = data.name || data.text;

        const str = `
          ${data.iconClose ? "<span class='close'><i class='icon_gb-close4'></i></span>" : ""}
          <div class='flex-wrapper'>
            ${imageUrl ? `<div class="img_box"><p class="img_container"><img class="info-image" src="${imageUrl}"/></p></div>` : ""}
            <div class="info_container flex-column">
              ${data.name ? `<p><span class="name title">${text}</span></p>` : ""}
              ${data.address ? `<p class="address">${data.address}</p>` : ""}
            </div>
            <div class="listenbtn"><span class="icon-headset2 go-listen float-right text-btn">${langData["jiangjie:btntext"] || "讲解"}</span></div>
            <div class="routebtn"><span class="icon_gb-line2 go-route float-right text-btn">${langData["route:btntext"] || "路线"}</span></div>
          </div>
        `;

        this._dom.html(str);

        if (!this._params?.speakListener) {
          const audioDom = domUtils.find(this._dom, "audio")[0];
          this.audioDom = audioDom;
          this.loadAudio();
        } else {
          this.audioDom = null;
        }

        if (imageUrl && that.listener?.onImgLoaded) {
          const img = domUtils.find(this._dom, ".info-image")[0];
          img.onload = () => {
            that.listener.onImgLoaded();
          };
        }
      },

      loadAudio: function () {
        const audioDom = this.audioDom;
        if (audioDom) {
          audioDom.addEventListener("timeupdate", this.timeupdate);
          audioDom.addEventListener("durationchange", this.onDurationchange);
          audioDom.addEventListener("canplay", this.onCanplay);
          audioDom.addEventListener("play", this.onPlay);
          audioDom.addEventListener("pause", this.onPause);
          audioDom.addEventListener("ended", this.onAudioEnded);
          document.addEventListener("visibilitychange", this.visibilitychangeListener);
        }
      },

      updateIcon: function (icon) {
        const className = this._dom.attr("class").replace(this._iconName || "", icon);
        this._dom.attr("class", className);
        this._iconName = icon;
      },

      startPlay: function () {},

      pausePlay: function () {
        const dxaudio = this.audioDom;
        if (dxaudio) {
          dxaudio.pause();
          domUtils.find(this._dom, ".playAndPause").removeClass("pause").addClass("play");
        }
      },

      forward15: function () {
        const dxaudio = this.audioDom;
        if (dxaudio) {
          const currentTime = dxaudio.currentTime;
          const duration = dxaudio.duration;
          dxaudio.currentTime = currentTime + 15 > duration ? duration : currentTime + 15;
        }
      },

      back15: function () {
        const dxaudio = this.audioDom;
        if (dxaudio) {
          const currentTime = dxaudio.currentTime;
          dxaudio.currentTime = currentTime - 15 < 0 ? 0 : currentTime - 15;
        }
      },

      setSpeed: function (speed) {
        const dxaudio = this.audioDom;
        if (dxaudio) {
          dxaudio.playbackRate = speed;
        }
      },

      timeupdate: function (e) {
        const dxaudio = e.target;
        const audioProgressBar = $(dxaudio.nextSibling);
        const parentDom = dxaudio._parentDom;
        const audioProgress = parentDom ? parentDom.find(".audioProgress") : audioProgressBar.find(".audioProgress");
        const currentTime = dxaudio.currentTime;
        const duration = dxaudio.duration;
        const progressTime = parentDom ? domUtils.find(parentDom, ".progressTime") : audioProgressBar.find(".progressTime");

        if (!duration) return;

        audioProgress.attr("value", currentTime);
        audioProgress.attr("max", duration);
        progressTime.html(`${dxUtils.conversion(currentTime)}/${dxUtils.conversion(duration)}`);

        const width = progressTime.width();
        const parentWidth = progressTime.parent().width();
        const maxOffset = 1 - width / parentWidth;

        if (currentTime / duration > maxOffset) {
          progressTime.css("left", `${maxOffset * 100}%`);
        } else {
          progressTime.css("left", `${(currentTime / duration) * 100}%`);
        }
      },

      cancel: function () {
        this.pausePlay();

        if (this.audioDom && this._params?.speakListener) {
          this._params.speakListener.cancel();
        }

        if (this.audioDom) {
          const audioDom = this.audioDom;
          audioDom.removeEventListener("timeupdate", this.timeupdate);
          audioDom.removeEventListener("durationchange", this.onDurationchange);
          audioDom.removeEventListener("canplay", this.onCanplay);
          audioDom.removeEventListener("play", this.onPlay);
          audioDom.removeEventListener("ended", this.onAudioEnded);
        }
        document.removeEventListener("visibilitychange", this.visibilitychangeListener);
      },
    });
    return DXDetailInfoComponent;
  })(DXBaseComponent);
  daxiapp["DXDetailInfoComponent"] = DXDetailInfoComponent;

  window["DXInput_onInput"] = function (e) {
    console.log(this.value);
    if (this.value.length > 1) this.value = this.value.slice(0, 1);
  };

  /** 编码输入组件 - 4位数字验证码输入 */
  const DXInputCodeComponent = (function (DXBaseComponent) {
    const DXInputCodeComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXInputCodeComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        const langData = window.langData || {};

        this._domStr = `
          <div class="inputCodeBox">
            <span class="close icon-close"></span>
            <div class="inputCodeContent">
              <div class="inputCodeBoxTitle">${langData["exhibition:code:input:tip"] || "请输入展品编码"}</div>
              <div class="inputCodeBoxDes">${langData["exhibition:code:source:tip"] || "4位数编码位于展品简介右上方"}</div>
              <div class="inputCodeBoxInputs">
                <input type="number" min="0" max="9" />
                <input type="number" min="0" max="9" />
                <input type="number" min="0" max="9" />
                <input type="number" min="0" max="9" />
              </div>
              <div class="inputCodeBoxTips"></div>
            </div>
          </div>`;

        this.isShow = true;
        this._super(parentDom, params);
        this._inputs = this._dom.find(".inputCodeBoxInputs input");
      },

      injectComponentEvents: function (callback) {
        const that = this;

        // 关闭按钮
        domUtils.on(that._dom, "click", ".close", () => {
          that.listener?.onClose?.();
          that.hide();
        });

        // 输入事件
        domUtils.on(that._dom, "input", "input", function (event) {
          that.showMsg("");
          const input = that._inputs;
          const index = $(this).index();
          const val = event.target.value;

          if (val != "") {
            if (val.length > 1) {
              event.target.value = val.slice(0, 1);
            }
            if (index != input.length - 1) {
              input.eq(index + 1).focus();
            } else if (input[0].value != "" && input[1].value != "" && input[2].value != "") {
              const vals = input[0].value + input[1].value + input[2].value + input[3].value;
              if (that.listener?.onInputEnd) {
                event.target.blur();
                that.listener.onInputEnd(that, { val: vals });
              }
            }
          }
        });

        // 退格键处理
        domUtils.on(that._dom, "keydown", "input", function (event) {
          if (event.keyCode == 8) {
            if (!this.value) {
              const input = that._inputs;
              const index = $(this).index();
              if (index > 0) {
                input.eq(index - 1).focus();
              }
            }
          }
        });
      },

      hide: function () {
        this.isShow = false;
        this._dom.hide();
        this._inputs.val("");
      },

      show: function () {
        this.isShow = true;
        this._dom.show();
        this._inputs.eq(0).focus();
      },

      showMsg: function (msg) {
        this._dom.find(".inputCodeBoxTips").html(msg);
      },
    });
    return DXInputCodeComponent;
  })(DXBaseComponent);
  daxiapp["DXInputCodeComponent"] = DXInputCodeComponent;

  /** 教程引导组件 - 新手引导步骤页面 */
  const DXCourseComponent = (function (DXBaseComponent) {
    const DXCourseComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXCourseComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `<div id="course"></div>`;
        this.isShow = true;
        this._super(parentDom, params);
      },

      updateData: function () {
        const langData = window.langData || {};
        const skipText = langData["jump:over:btntext"] || "跳过";
        const knowText = langData["kown:text"] || "知道啦";

        this._domStr = `
          <div class="step step1 active" data-step="1">
            <div class="btns">
              <div class="btn_skip">${skipText}</div>
              <div class="btn_next">(1/3)下一步</div>
            </div>
            <div class="searchTip"><img src="./images/guobo/course/step1_search.png" width="100%" alt=""></div>
            <div class="pic_floorBtns"><img src="./images/guobo/course/step1_floorBtns.png" width="100%" alt=""></div>
            <div class="bottomSearchTip"><img src="./images/guobo/course/step1_bottomSearch.png" width="100%" alt=""></div>
          </div>
          <div class="step step2" data-step="2">
            <div class="btns">
              <div class="btn_skip">${skipText}</div>
              <div class="btn_next">(2/3)下一步</div>
            </div>
            <div class="pic_floorBtns"><img src="./images/guobo/course/step1_floorBtns.png" width="100%" alt=""></div>
            <div class="floorTip1"></div>
            <div class="floorTip2"></div>
            <div class="btn3D"><img src="./images/guobo/course/step2_3D.png" width="100%" alt=""></div>
            <div class="btn3DTip"><img src="./images/guobo/course/step2_3DTip.png" width="100%" alt=""></div>
          </div>
          <div class="step step3" data-step="3">
            <div class="btns">
              <div class="btn_finish">${knowText}</div>
            </div>
            <div class="rightComponent"><img src="./images/guobo/course/step3_rightComponent.png" width="100%" alt=""></div>
            <div class="rightComponentTip"></div>
          </div>`;

        this._dom.show();
        this._dom.html(this._domStr);
      },

      updateAutoDesc: function () {
        const langData = window.langData || {};
        const knowText = langData["kown:text"] || "知道啦";

        this._domStr = `
          <div class='autoDesc'></div>
          <div class='btns2'><div class='btn_finish'>${knowText}</div></div>`;

        this._dom.show();
        this._dom.html(this._domStr);
      },

      updateLuxian: function () {
        const langData = window.langData || {};
        const knowText = langData["kown:text"] || "知道啦";

        this._domStr = `
          <div class='luxianTip1'></div>
          <div class='luxianTip2'></div>
          <div class='luxianTip3'></div>
          <div class='btns2'><div class='btn_finish'>${knowText}</div></div>`;

        this._dom.show();
        this._dom.html(this._domStr);
      },

      updateZanpin: function () {
        this._domStr = `<div class='zanpin'></div><div class='close icon-close2'></div>`;
        this._dom.show();
        this._dom.html(this._domStr);
      },

      injectComponentEvents: function (callback) {
        const that = this;

        // 跳过按钮
        domUtils.on(that._dom, "click", ".btn_skip", () => {
          that.hide();
          that.listener?.onFinish?.();
        });

        // 下一步按钮
        domUtils.on(that._dom, "click", ".btn_next", function () {
          const stepDom = $(this).parents(".step");
          const step = stepDom.data("step");
          stepDom.removeClass("active");
          that._dom.find(`.step${step + 1}`).addClass("active");
        });

        // 完成按钮
        domUtils.on(that._dom, "click", ".btn_finish", () => {
          that.hide();
          that.listener?.onFinish?.();
        });

        // 关闭按钮
        domUtils.on(that._dom, "click", ".close", () => {
          that.hide();
        });
      },

      hide: function () {
        this.isShow = false;
        this._dom.hide();
      },

      show: function () {
        this.isShow = true;
        this._dom.show();
      },
    });
    return DXCourseComponent;
  })(DXBaseComponent);
  daxiapp["DXCourseComponent"] = DXCourseComponent;

  /** 教程引导组件2 - 带建筑ID的新手引导页面 */
  const DXCourseComponent2 = (function (DXBaseComponent) {
    const DXCourseComponent2 = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXCourseComponent2";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `<div id="course"></div>`;
        this.isShow = true;
        this._super(parentDom, params);
      },

      updateData: function (bdid) {
        const langData = window.langData || {};
        const knowText = langData["kown:text"] || "知道啦";

        this._domStr = `
          <div class="step step1 active" data-step="1">
            <div class="btns">
              <div class="btn_finish">${knowText}</div>
            </div>
            <div class="searchTip"><img src="./images/guobo/course/step1_search_S10000001.png" width="100%" alt=""></div>
            <div class="fastNavi"><img src="./images/guobo/course/setp1_fastNavi.png" width="100%" alt=""></div>
            <div class="bottomSearchTip"><img src="./images/guobo/course/step1_bottom.png" width="100%" alt=""></div>
            <div class="btn3D"><img src="./images/guobo/course/step1_3D.png" width="100%" alt=""></div>
            <div class="btn3DTip"><img src="./images/guobo/course/step1_3DTip.png" width="100%" alt=""></div>
            <div class="location"><img src="./images/guobo/course/step1_location.png" width="100%" alt=""></div>
            <div class="locationTip"><img src="./images/guobo/course/step1_locationTip.png" width="100%" alt=""></div>
          </div>`;

        this._dom.show();
        this._dom.html(this._domStr);
      },

      updateAutoDesc: function () {
        const langData = window.langData || {};
        const knowText = langData["kown:text"] || "知道啦";

        this._domStr = `
          <div class='autoDesc'></div>
          <div class='btns2'><div class='btn_finish'>${knowText}</div></div>`;

        this._dom.show();
        this._dom.html(this._domStr);
      },

      updateLuxian: function () {
        const langData = window.langData || {};
        const knowText = langData["kown:text"] || "知道啦";

        this._domStr = `
          <div class='luxianTip1'></div>
          <div class='luxianTip2'></div>
          <div class='luxianTip3'></div>
          <div class='btns2'><div class='btn_finish'>${knowText}</div></div>`;

        this._dom.show();
        this._dom.html(this._domStr);
      },

      updateZanpin: function (bdid) {
        this._domStr = `<div class='zanpin ${bdid}'></div><div class='close icon-close2'></div>`;
        this._dom.show();
        this._dom.html(this._domStr);
      },

      injectComponentEvents: function (callback) {
        const that = this;

        // 跳过按钮
        domUtils.on(that._dom, "click", ".btn_skip", () => {
          that.hide();
          that.listener?.onFinish?.();
        });

        // 下一步按钮
        domUtils.on(that._dom, "click", ".btn_next", function () {
          const stepDom = $(this).parents(".step");
          const step = stepDom.data("step");
          stepDom.removeClass("active");
          that._dom.find(`.step${step + 1}`).addClass("active");
        });

        // 完成按钮
        domUtils.on(that._dom, "click", ".btn_finish", () => {
          that.hide();
          that.listener?.onFinish?.();
        });

        // 关闭按钮
        domUtils.on(that._dom, "click", ".close", () => {
          that.hide();
        });
      },

      hide: function () {
        this.isShow = false;
        this._dom.hide();
      },

      show: function () {
        this.isShow = true;
        this._dom.show();
      },
    });
    return DXCourseComponent2;
  })(DXBaseComponent);
  daxiapp["DXCourseComponent2"] = DXCourseComponent2;

  /** 教程引导组件3 - 6步新手引导页面 */
  const DXCourseComponent3 = (function (DXBaseComponent) {
    const DXCourseComponent3 = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXCourseComponent3";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `<div id="course" class="course3"></div>`;
        this.isShow = true;
        this._super(parentDom, params);
      },

      updateData: function (bdid, bdname) {
        const langData = window.langData || {};
        const knowText = langData["kown:text"] || "知道啦";

        // 第一步根据建筑ID显示不同样式
        const step1Text =
          bdid == "B000A11DMZ"
            ? `<div class="step1Pic1"><span class="step1Text" style="font-size: 1.4rem;top:26px">搜索景点，发现最美${bdname}</span><img src="./images/jiaocheng/step1/text1_big.png" alt=""></div>`
            : `<div class="step1Pic1"><span class="step1Text">搜索景点，发现最美${bdname}</span><img src="./images/jiaocheng/step1/text1.png" alt=""></div>`;

        this._domStr = `
          <div class="step step1 active" data-step="1">
            <div class="btns">
              <div class="btn_skip">跳过</div>
              <div class="btn_next">下一步</div>
            </div>
            ${step1Text}
          </div>
          <div class="step step2" data-step="2">
            <div class="btns">
              <div class="btn_skip">跳过</div>
              <div class="btn_next">下一步</div>
            </div>
            <div class="step1Pic2"><img src="./images/jiaocheng/step2/text2.png" alt=""></div>
          </div>
          <div class="step step3" data-step="3">
            <div class="btns">
              <div class="btn_skip">跳过</div>
              <div class="btn_next">下一步</div>
            </div>
            <div class="step1Pic3"><img src="./images/jiaocheng/step3/text3.png" alt=""></div>
          </div>
          <div class="step step4" data-step="4">
            <div class="btns">
              <div class="btn_skip">跳过</div>
              <div class="btn_next">下一步</div>
            </div>
            <div class="step1Pic4"><img src="./images/jiaocheng/step4/text4.png" alt=""></div>
          </div>
          <div class="step step5" data-step="5">
            <div class="btns">
              <div class="btn_skip">跳过</div>
              <div class="btn_next">下一步</div>
            </div>
            <div class="step1Pic5"><img src="./images/jiaocheng/step5/text5.png" alt=""></div>
          </div>
          <div class="step step6" data-step="6">
            <div class="btns">
              <div class="btn_skip">跳过</div>
              <div class="btn_finish">${knowText}</div>
            </div>
            <div class="step1Pic6"><img src="./images/jiaocheng/step6/text6.png" alt=""></div>
          </div>`;

        this._dom.show();
        this._dom.html(this._domStr);
      },

      updateAutoDesc: function () {
        const langData = window.langData || {};
        const knowText = langData["kown:text"] || "知道啦";

        this._domStr = `
          <div class='autoDesc'></div>
          <div class='btns2'><div class='btn_finish'>${knowText}</div></div>`;

        this._dom.show();
        this._dom.html(this._domStr);
      },

      updateLuxian: function () {
        const langData = window.langData || {};
        const knowText = langData["kown:text"] || "知道啦";

        this._domStr = `
          <div class='luxianTip1'></div>
          <div class='luxianTip2'></div>
          <div class='luxianTip3'></div>
          <div class='btns2'><div class='btn_finish'>${knowText}</div></div>`;

        this._dom.show();
        this._dom.html(this._domStr);
      },

      updateZanpin: function (bdid) {
        this._domStr = `<div class='zanpin ${bdid}'></div><div class='close icon-close2'></div>`;
        this._dom.show();
        this._dom.html(this._domStr);
      },

      injectComponentEvents: function (callback) {
        const that = this;

        // 跳过按钮
        domUtils.on(that._dom, "click", ".btn_skip", () => {
          that.hide();
          that.listener?.onFinish?.();
        });

        // 下一步按钮
        domUtils.on(that._dom, "click", ".btn_next", function () {
          const stepDom = $(this).parents(".step");
          const step = stepDom.data("step");
          stepDom.removeClass("active");
          that._dom.find(`.step${step + 1}`).addClass("active");
        });

        // 完成按钮
        domUtils.on(that._dom, "click", ".btn_finish", () => {
          that.hide();
          that.listener?.onFinish?.();
        });

        // 关闭按钮
        domUtils.on(that._dom, "click", ".close", () => {
          that.hide();
        });
      },

      hide: function () {
        this.isShow = false;
        this._dom.hide();
      },

      show: function () {
        this.isShow = true;
        this._dom.show();
      },
    });
    return DXCourseComponent3;
  })(DXBaseComponent);
  daxiapp["DXCourseComponent3"] = DXCourseComponent3;

  /** 样式化教程引导组件 - 带提示气泡的6步引导 */
  const DXStyleCourseComponent = (function (DXBaseComponent) {
    const DXStyleCourseComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXStyleCourseComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `<div id="newstyle_course" class="newstyle_course" style="width: 100%;height: 100%;background-color: rgba(255,255,255,0.2);position: absolute;top: 0px;left: 0px;z-index: 100;color: #fff;"></div>`;
        this.isShow = true;
        this._super(parentDom, params);
      },

      updateData: function (bdid, bdname) {
        const langData = window.langData || {};
        const knowText = langData["kown:text"] || "知道啦";

        this._domStr = `
          <div class="step mapArea_tip active step1" data-step="1">
            <div class="content">
              <div class="tootltip_wrapper">
                <span class="dot"><span></span></span>
                <span class="line"></span>
                <p class="tooltip">${langData["help:mapTip"] || "地图区域：可进行室内外地图点选并查看相应区域服务信息或进行路径导航，可实现缩放"}</p>
              </div>
              <div class="btn_next">下一步</div>
              <div class="btn_skip">跳过</div>
            </div>
          </div>
          <div class="step floorsComs_tip step2" data-step="2">
            <div class="content">
              <div class="tootltip_wrapper">
                <span class="dot"><span></span></span>
                <span class="line"></span>
                <p class="tooltip">${langData["help:floorCtrlTip"] || "楼层和定位区域:显示地图南北朝向、楼层切换和查看当前位置"}</p>
              </div>
              <div class="btn_next">下一步</div>
              <div class="btn_skip">跳过</div>
            </div>
          </div>
          <div class="step mainSlideComps_tip step3" data-step="3">
            <div class="content">
              <div class="btn_skip">跳过</div>
              <div class="btn_next">下一步</div>
              <div class="tootltip_wrapper">
                <span class="dot"><span></span></span>
                <span class="line"></span>
                <p class="tooltip">${
                  langData["help:mainSlideTip"] || "搜索栏:通过文字搜索、语音搜索、快捷搜索等方式，搜索馆内展厅、阅览室及便民服务等设备设施"
                }</p>
              </div>
            </div>
          </div>
          <div class="step rightComps_tip step4" data-step="4">
            <div class="content">
              <div class="tootltip_wrapper">
                <span class="dot"><span></span></span>
                <span class="line"></span>
                <p class="tooltip">${langData["help:righToolTip"] || "工具栏: 显示用户头像、附近、活动、来馆、分享等更多功能"}</p>
              </div>
              <div class="btn_next">下一步</div>
              <div class="btn_skip">跳过</div>
            </div>
          </div>
          <div class="step modeZoomComps_tip step5" data-step="5">
            <div class="content">
              <div class="tootltip_wrapper">
                <span class="dot"><span></span></span>
                <span class="line"></span>
                <p class="tooltip">${langData["help:modeZoomTip"] || "地图操作: 3D/2D切换、放大缩小地图"}</p>
              </div>
              <div class="btn_next">下一步</div>
              <div class="btn_skip">跳过</div>
            </div>
          </div>
          <div class="step footerNaviComps_tip step6" data-step="6">
            <div class="content">
              <div class="btn_finish">${knowText}</div>
              <div class="tootltip_wrapper">
                <span class="dot"><span></span></span>
                <span class="line"></span>
                <p class="tooltip">${langData["help:footerTip"] || "菜单栏：可以进行导览功能的切换、馆内服务区域展示"}</p>
              </div>
            </div>
          </div>`;

        this._dom.show();
        this._dom.html(this._domStr);
      },

      updateAutoDesc: function () {
        const langData = window.langData || {};
        const knowText = langData["kown:text"] || "知道啦";

        this._domStr = `
          <div class='autoDesc'></div>
          <div class='btns2'><div class='btn_finish'>${knowText}</div></div>`;

        this._dom.show();
        this._dom.html(this._domStr);
      },

      updateLuxian: function () {
        const langData = window.langData || {};
        const knowText = langData["kown:text"] || "知道啦";

        this._domStr = `
          <div class='luxianTip1'></div>
          <div class='luxianTip2'></div>
          <div class='luxianTip3'></div>
          <div class='btns2'><div class='btn_finish'>${knowText}</div></div>`;

        this._dom.show();
        this._dom.html(this._domStr);
      },

      updateZanpin: function (bdid) {
        this._domStr = `<div class='zanpin ${bdid}'></div><div class='close icon-close2'></div>`;
        this._dom.show();
        this._dom.html(this._domStr);
      },

      injectComponentEvents: function (callback) {
        const that = this;

        // 跳过按钮
        domUtils.on(that._dom, "click", ".btn_skip", () => {
          that.hide();
          that.listener?.onFinish?.();
        });

        // 下一步按钮
        domUtils.on(that._dom, "click", ".btn_next", function () {
          const stepDom = $(this).parents(".step");
          const step = stepDom.data("step");
          stepDom.removeClass("active");
          that._dom.find(`.step${step + 1}`).addClass("active");
        });

        // 完成按钮
        domUtils.on(that._dom, "click", ".btn_finish", () => {
          that.hide();
          that.listener?.onFinish?.();
        });

        // 关闭按钮
        domUtils.on(that._dom, "click", ".close", () => {
          that.hide();
        });
      },

      hide: function () {
        this.isShow = false;
        this._dom.hide();
      },

      show: function () {
        this.isShow = true;
        this._dom.show();
      },

      /** 根据组件偏移量重置引导位置 */
      resetInit: function (compsOffset) {
        const padding = 2;

        for (const key in compsOffset) {
          const item = compsOffset[key];
          const clippath = `polygon(${item.left - padding}px ${item.top - padding}px,${item.left - padding}px ${item.top + item.height + padding}px,${
            item.left + item.width + padding
          }px ${item.top + item.height + padding}px,${item.left + item.width + padding}px ${item.top - padding}px,0px ${
            item.top - padding
          }px,0px 0px,100% 0px,100% 100%,0px 100%,0px ${item.top - padding}px)`;

          this._dom.find(`.step.${key}_tip`).css("clip-path", clippath);
          const anctor = item.anctor;
          const contentDom = this._dom.find(`.step.${key}_tip .content`);

          if (anctor == "top") {
            const top = item.top + item.height + 4;
            contentDom.css("top", `${top}px`);
            contentDom.css("bottom", "50px");
            contentDom.addClass("column").addClass("popup_top");
          }

          if (anctor == "left") {
            const top = item.top + item.height / 2 + 4;
            const width = window.innerWidth - (item.width + item.left) * 2 - 6;
            contentDom.css("top", `${top}px`);
            contentDom.find(".tootltip_wrapper").css({ width: `${width}px` });
            contentDom.css("bottom", "50px");
            contentDom.addClass("row").addClass("popup_left");
          }

          if (anctor == "right") {
            const top = item.top + item.height / 2 + 4;
            const width = window.innerWidth - (window.innerWidth - item.left) * 2 - 6;
            contentDom.css("top", `${top}px`);
            contentDom.find(".tootltip_wrapper").css({ width: `${width}px` });
            contentDom.css("bottom", "50px");
            contentDom.addClass("row").addClass("popup_right");
          }

          if (anctor == "bottom") {
            const bottom = window.innerHeight - item.top;
            contentDom.css("bottom", `${bottom}px`);
            contentDom.addClass("column").addClass("popup_bottom");
          }
        }

        const stepDom = this._dom.find(".step");
        stepDom.removeClass("active");
        this._dom.find(".step1").addClass("active");
        this.show();
      },
    });
    return DXStyleCourseComponent;
  })(DXBaseComponent);
  daxiapp["DXStyleCourseComponent"] = DXStyleCourseComponent;

  daxiapp["RoadCrossPlugin"] = function () {
    let thisObject = this;
    thisObject.timeoutId = null;
    let Matrix = dxUtils["Matrix"],
      Vector3 = dxUtils["Vector3"],
      Plane = dxUtils["Plane"];

    /** 3D 渲染器，用于将路口指示转换到屏幕坐标 */
    let CrossRender = function () {
      let thisObject = {};
      let canvasWidth, canvasHeight, offsetX, offsetY;
      let _context;
      let viewProjectMat = Matrix.create();
      let cameraMat = Matrix.create();
      let viewMat = Matrix.create();
      let projMat = Matrix.create();
      let cameraPosition = Vector3.make(0, -900, 270);
      let cameraTarget = Vector3.make(0, 0, 0);
      let cameraUp = [0, 0, 1];
      let right = Vector3.create();
      let up = Vector3.create();
      let dir = Vector3.create();
      let outputVec = [0, 0, 0];
      let fovy = Math.PI / 5;
      let aspect = 1;
      let near = 0.001;
      let far = 1000;
      let groundPlane = Plane.create();

      function screenPixel(pixel) {
        return pixel * window.devicePixelRatio;
      }

      thisObject.init = function () {
        Matrix.lookatRH(viewMat, cameraPosition, cameraTarget, cameraUp);
        Matrix.inverse(cameraMat, viewMat);
        Matrix.perspectiveRH(projMat, fovy, aspect, near, far);
        Matrix.multiply(viewProjectMat, viewMat, projMat);
        Matrix.inverse(viewProjectMatInv, viewProjectMat);
        Vector3.transformNormal(right, Vector3.UNIT_X, cameraMat);
        Vector3.transformNormal(dir, [0, 0, -1], cameraMat);
        Vector3.transformNormal(up, Vector3.UNIT_Y, cameraMat);
        return thisObject;
      };
      thisObject.setViewport = function (ox, oy, cw, ch) {
        offsetX = ox;
        offsetY = oy;
        canvasWidth = cw;
        canvasHeight = ch;
      };
      thisObject.begin = function (ctx) {
        _context = ctx;
      };
      thisObject.end = function () {};
      thisObject.clear = function () {
        _context.clearRect(0, 0, canvasWidth, canvasHeight);
      };
      thisObject.moveTo3D = function (x, y) {
        thisObject.worldToScreen(outputVec, [x, y, 0]);
        _context.moveTo(outputVec[0], outputVec[1]);
      };
      thisObject.lineTo3D = function (x, y) {
        thisObject.worldToScreen(outputVec, [x, y, 0]);
        _context.lineTo(outputVec[0], outputVec[1]);
      };
      thisObject.fillText3D = function (text, x, y) {
        thisObject.worldToScreen(outputVec, [x, y, 0]);
        _context.fillText(text, outputVec[0], outputVec[1]);
      };

      thisObject.worldToScreen = function (outVec, inVec) {
        Matrix.transformCoord(outVec, inVec, viewProjectMat);
        outVec[0] = (outVec[0] + 1) * 0.5 * canvasWidth - canvasWidth / 2 + offsetX; //中心点转为2D规则
        outVec[1] = (1 - outVec[1]) * 0.5 * canvasHeight - canvasHeight / 2 + offsetY;
        return outVec;
      };
      let pickRay = { _orig: [0, 0, 0], _dir: [0, 0, 1] };
      thisObject.unprojectScreenToWorldPlane = function (outVec, inVec) {
        thisObject.getPickRay([inVec.x, inVec.y, 0], pickRay);
        Plane.intersectRay(outVec, pickRay, groundPlane);
        return outVec;
      };

      thisObject.projectWorldToScreen = function (outVec, inVec) {
        Matrix.transformCoord(outVec, inVec, viewProjectMat);
        outVec[0] = (outVec[0] + 1) * 0.5 * canvasWidth - canvasWidth / 2 + offsetX; //中心点转为2D规则
        outVec[1] = (1 - outVec[1]) * 0.5 * canvasHeight - canvasHeight / 2 + offsetY;
        return outVec;
      };

      let nearCenter = Vector3.create();
      let xDir = Vector3.create();
      let yDir = Vector3.create();
      thisObject.getPickRay = function (windowPosition, result) {
        let width = canvasWidth;
        let height = canvasHeight;

        let tanPhi = Math.tan(fovy * 0.5);
        let tanTheta = aspect * tanPhi;

        let x = (2.0 / width) * windowPosition[0] - 1.0;
        let y = (2.0 / height) * (height - windowPosition[1]) - 1.0;

        Vector3.clone(result._orig, cameraPosition);
        Vector3.scale(nearCenter, dir, near);
        Vector3.add(nearCenter, cameraPosition, nearCenter);
        Vector3.scale(xDir, right, x * near * tanTheta);
        Vector3.scale(yDir, up, y * near * tanPhi);

        Vector3.add(result._dir, nearCenter, xDir);
        Vector3.add(result._dir, result._dir, yDir);
        Vector3.sub(result._dir, result._dir, cameraPosition);
        Vector3.normalize(result._dir, result._dir);

        return result;
      };

      thisObject.drawArrow = function (arrows, strokeStyle, fillStyle) {
        if (!arrows?.length) return;
        _context.save();
        _context.beginPath();
        _context.fillStyle = fillStyle;
        _context.strokeStyle = strokeStyle;
        _context.lineWidth = 5;

        let [startX, startY] = arrows[0];
        thisObject.moveTo3D(startX, startY);
        arrows.forEach(function (arrow) {
          thisObject.lineTo3D(arrow[0], arrow[1]);
        });
        thisObject.lineTo3D(startX, startY);
        _context.closePath();
        _context.fill();
        _context.stroke();
        _context.restore();
      };
      thisObject.drawText = function (offset, txt) {
        if (!txt) return;
        _context.save();
        _context.beginPath();
        _context.font = `bold ${screenPixel(16)}px sans-serif`;
        _context.textBaseline = "middle";
        _context.fillStyle = "#fff";
        txt.split(",").forEach(function (text, index) {
          thisObject.fillText3D(text, offset[0], offset[1] + 70 * index);
        });
        _context.restore();
      };
      return thisObject;
    };

    /** 路口视图管理器 */
    let RoadCrossView = function () {
      let _canvas = null;
      let _context;
      let origin = { x: 0, y: 0, w: 0, h: 0 };
      let stageW = 0;
      let stageH = 0;
      let sourceImg = { width: 0, height: 0 };
      let roadCrossData = {};
      let preLoadImages = {};

      /** 根据背景图计算显示区域尺寸 */
      function setImageStyle(bgImage) {
        let h = parseInt(stageH);
        let w = parseInt(bgImage.width * (h / bgImage.height));
        origin.x = parseInt(-(w - stageW) / 2);
        origin.w = w;
        origin.h = h;
      }
      /** 绘制路口图像及叠加层 */
      function drawCrossImage() {
        if (!_context) throw "没有设置canvas";
        let image = thisObject.image;
        let strokeStyle = thisObject.strokeStyle[thisObject.strokeStyleIndex++ % 2];

        _context.clearRect(0, 0, _canvas.width, _canvas.height);
        _context.fillStyle = "black";
        _context.fillRect(0, 0, stageW, stageH);
        _context.drawImage(image, 0, 0, image.width, image.height, origin.x, 0, origin.w, origin.h);

        let overlayFillStyle = "rgba(255,255,255,0.5)";
        drawDoorLine(roadCrossData, strokeStyle, overlayFillStyle);
        drawArrowLine(roadCrossData, strokeStyle, overlayFillStyle);
      }
      /** 将图像坐标转换为屏幕坐标 */
      function imageCoordsToScreenCoords(pos) {
        return {
          x: pos.x * (origin.w / sourceImg.width) + origin.x,
          y: pos.y * (origin.h / sourceImg.height),
        };
      }

      /** 绘制门路径区域 */
      function drawDoorLine(obj, strokeStyle, fillStyle) {
        if (!obj?.doorPath?.length) return;
        _context.save();
        _context.fillStyle = fillStyle;
        _context.strokeStyle = strokeStyle;
        _context.lineJoin = "round";
        _context.lineWidth = 3;
        _context.beginPath();

        let points = obj.doorPath;
        let startPt = imageCoordsToScreenCoords(points[0]);
        _context.moveTo(startPt.x, startPt.y);
        for (let i = 1; i < points.length; i++) {
          let pt = imageCoordsToScreenCoords(points[i]);
          _context.lineTo(pt.x, pt.y);
        }
        _context.fill();
        _context.stroke();
        _context.restore();
      }

      /** 将顶点添加到缓冲区 */
      function pushToBuffer(buffer, v, direction, lineWidth, scale) {
        let temp = [0, 0, 0];
        Vector3.mad(temp, v, direction, scale * lineWidth);
        buffer.push(temp);
      }

      let lineDirection = [0, 0, 0];
      let direction = [0, 0, 0];
      let direction1 = [0, 0, 0];
      let direction2 = [0, 0, 0];
      let v_temp_normal = [0, 0, 0];
      /** 构建箭头多边形缓冲区 */
      function createArrowBuffer(line) {
        let pointCount = line.length;
        if (pointCount < 2) return [];

        let outBufferLeft = [];
        let outBufferRight = [];
        let outBufferHead = [];
        let DEGREE_TO_RADIAN = Math.PI / 180;
        let lineWidth = 7.5;

        let A, B, C;
        if (pointCount == 2) {
          A = line[0];
          B = line[1];

          Vector3.sub(lineDirection, B, A);
          Vector3.normalize(lineDirection, lineDirection);
          Vector3.cross(direction, lineDirection, Vector3.UNIT_Z);
          Vector3.normalize(direction, direction);

          pushToBuffer(outBufferLeft, A, direction, lineWidth, -1);
          pushToBuffer(outBufferRight, A, direction, lineWidth, 1);
          pushToBuffer(outBufferLeft, B, direction, lineWidth, -1);
          pushToBuffer(outBufferRight, B, direction, lineWidth, 1);
        } else {
          // >=3
          {
            A = line[0];
            B = line[1];

            Vector3.sub(lineDirection, B, A);
            Vector3.normalize(lineDirection, lineDirection);
            Vector3.cross(direction, lineDirection, Vector3.UNIT_Z);
            Vector3.normalize(direction, direction);

            pushToBuffer(outBufferLeft, A, direction, lineWidth, -1);
            pushToBuffer(outBufferRight, A, direction, lineWidth, 1);
          }
          for (let j = 1; j < pointCount - 1; j++) {
            A = line[j - 1];
            B = line[j];
            C = line[j + 1];

            Vector3.sub(lineDirection, B, A);
            Vector3.normalize(lineDirection, lineDirection);
            Vector3.cross(direction1, lineDirection, Vector3.UNIT_Z);
            Vector3.normalize(direction1, direction1);

            Vector3.sub(lineDirection, C, B);
            Vector3.normalize(lineDirection, lineDirection);
            Vector3.cross(direction2, lineDirection, Vector3.UNIT_Z);
            Vector3.normalize(direction2, direction2);

            Vector3.add(direction, direction1, direction2);
            Vector3.scale(direction, direction, 0.5);
            Vector3.normalize(direction, direction);

            Vector3.sub(v_temp_normal, A, B);
            Vector3.normalize(v_temp_normal, v_temp_normal);
            let dot_val = Math.abs(Vector3.dot(v_temp_normal, direction));
            let angle = Math.acos(dot_val);
            let scale = angle < 25 * DEGREE_TO_RADIAN ? 1.0 : 1.0 / Math.sin(angle);

            pushToBuffer(outBufferLeft, B, direction, lineWidth, -scale);
            pushToBuffer(outBufferRight, B, direction, lineWidth, scale);
          }
          {
            A = line[pointCount - 2];
            B = line[pointCount - 1];
            Vector3.sub(lineDirection, B, A);
            Vector3.normalize(lineDirection, lineDirection);
            Vector3.cross(direction, lineDirection, Vector3.UNIT_Z);
            Vector3.normalize(direction, direction);

            pushToBuffer(outBufferLeft, B, direction, lineWidth, -1);
            pushToBuffer(outBufferRight, B, direction, lineWidth, 1);
          }
        }

        // Arrow Head
        let HeadPos = [0, 0, 0];
        Vector3.mad(HeadPos, B, lineDirection, lineWidth * 3);
        pushToBuffer(outBufferHead, B, direction, lineWidth * 2, -1);
        pushToBuffer(outBufferHead, HeadPos, direction, 0, 0);
        pushToBuffer(outBufferHead, B, direction, lineWidth * 2, 1);

        // 合并缓冲区：左边 -> 箭头头部 -> 右边(逆序)
        return outBufferLeft.concat(outBufferHead, outBufferRight.reverse());
      }
      /** 绘制箭头导航路径 */
      function drawArrowLine(obj, strokeStyle) {
        if (!obj?.arrowPath?.length) return;
        let crossRender = thisObject.crossRender;
        crossRender.setViewport(_canvas.width * 0.5, _canvas.height * 0.5, _canvas.width, _canvas.height);

        // 将图像坐标转换为3D世界坐标
        let worldCoords = obj.arrowPath.map(function (point) {
          let pt = [0, 0, 0];
          crossRender.unprojectScreenToWorldPlane(pt, imageCoordsToScreenCoords(point));
          return pt;
        });

        // 构建箭头缓冲区并转换为屏幕坐标
        let arrowBuffer = createArrowBuffer(worldCoords).map(function (pt) {
          let screenPt = [0, 0, 0];
          crossRender.projectWorldToScreen(screenPt, pt);
          return screenPt;
        });

        if (!arrowBuffer.length) return;

        // 绘制箭头路径
        _context.save();
        _context.fillStyle = "rgba(244,161,0,0.7)";
        _context.strokeStyle = strokeStyle;
        _context.lineJoin = "round";
        _context.lineWidth = 3;
        _context.beginPath();
        _context.moveTo(arrowBuffer[0][0], arrowBuffer[0][1]);
        arrowBuffer.forEach(function (pt) {
          _context.lineTo(pt[0], pt[1]);
        });
        _context.closePath();
        _context.fill();
        _context.stroke();
        _context.restore();
      }

      return {
        /** 初始化 Canvas 及视口 */
        init: function (canvas, width, height) {
          height = height || Math.min(window.innerHeight * 0.5, window.innerWidth * 0.7);
          width = width || window.innerWidth;
          _canvas = canvas;
          _context = canvas.getContext("2d");
          _canvas.style.width = `${width}px`;
          _canvas.style.height = `${height}px`;
          _canvas.width = width;
          _canvas.height = height;
          stageW = width;
          stageH = height;
        },
        /** 预加载路口图片 */
        preLoad: function (json, floorName) {
          if (!json) return;
          let obj = json["CrossImageResult"];
          for (let i = 0; i < obj.length; i++) {
            if (obj?.[i]?.["Result"]) {
              let ids = obj[i]["Result"];
              let floorid = obj[i]["floor"];
              for (let j = 0; j < ids.length; j++) {
                let id = ids[j]["Connectionid"];
                if (typeof preLoadImages[id] == "string") continue;
                let url = `${json["baseUrl"]}${floorid}/${ids[j]["imagePath"]}`;
                let img = new Image();
                img.src = url;
                img.onerror = function () {};
                preLoadImages[id] = url;
              }
            }
          }
        },
        /** 加载并渲染路口引导图 */
        loadImage: function (json, callbackFn) {
          roadCrossData = {};
          thisObject.show = true;
          window.clearTimeout(thisObject.timeoutId);
          if (!json?.["ArrowGroup"]?.length) return;
          let arrowGroup = json["ArrowGroup"][0];
          let doorGroups = json["DoorGroup"] || [];
          let doorGroup =
            doorGroups.find(function (g) {
              return g["doorID"] == arrowGroup["doorId"];
            }) || {};
          roadCrossData.doorPath = doorGroup["doorPath"];
          roadCrossData.arrowAngle = arrowGroup["arrowAngle"];
          roadCrossData.arrowPath = arrowGroup["arrowPath"];
          sourceImg.width = json["ImgWidth"];
          sourceImg.height = json["ImgHeight"];
          let url = json.url;
          let image = new Image();
          thisObject.image = image;
          thisObject.strokeStyle = ["rgba(255,255,255,0)", "rgba(244,161,0,0.7)"];
          thisObject.strokeStyleIndex = 0;

          image.src = url;
          image.onload = function () {
            setImageStyle(image);
            drawCrossImage();
            // 启动闪烁动画定时器
            let animateGlitter = function () {
              if (!thisObject.show) return;
              drawCrossImage();
              thisObject.timeoutId = setTimeout(animateGlitter, 500);
            };
            thisObject.timeoutId = setTimeout(animateGlitter, 500);
          };
        },
        hideCrossRoadTimer: function () {
          window.clearInterval(thisObject.interval);
        },
      };
    };

    this.crossRender = CrossRender().init();
    this.roadCrossView = new RoadCrossView();
    return this;
  };

  /** 初始化路口放大图视图 */
  daxiapp["initCrossRodeView"] = function (parentObj, naviManager) {
    let wrapperDom = `
      <div class="roadcross_container" id="roadcross_container">
        <div id="roadcross" class="roadcross">
          <div style="position:relative;" id="roadcross_content"></div>
        </div>
      </div>`;
    parentObj["append"](wrapperDom);
    let roadCrossContainer = parentObj["find"](".roadcross_container");

    // 创建 Canvas 元素
    let canvas = document.createElement("canvas");
    canvas.id = "roadcross_canvas";
    canvas.width = window.innerWidth;
    canvas.height = Math.min(window.innerWidth, window.innerHeight * 0.5);
    roadCrossContainer.find("#roadcross_content")["append"](canvas);

    // 初始化路口插件
    let roadCrossPlugin = new daxiapp["RoadCrossPlugin"]();
    roadCrossPlugin.roadCrossView.init(canvas);

    let indoorNaviEventAPI = naviManager?.naviCoreEvents;
    if (!indoorNaviEventAPI) return { roadCrossPlugin: roadCrossPlugin, destory: function () {} };

    let crossRoadEnabled = false;

    function preLoadRoadCross(sender, data) {
      roadCrossPlugin.roadCrossView.preLoad(data);
    }

    function navigationFinished() {
      showCrossRoad(false);
    }

    /** 控制路口放大图的显示/隐藏 */
    function showCrossRoad(shouldShow) {
      if (shouldShow && crossRoadEnabled) {
        roadCrossContainer["show"]();
      } else if (!shouldShow && !crossRoadEnabled) {
        roadCrossContainer["hide"]();
        roadCrossPlugin.roadCrossView.hideCrossRoadTimer();
      }
      crossRoadEnabled = !shouldShow;
    }

    function loadRoadCrossImage(data) {
      if (data && crossRoadEnabled) {
        showCrossRoad(true);
        roadCrossPlugin.roadCrossView.loadImage(data);
      } else if (!data) {
        showCrossRoad(false);
      }
    }

    function onRoadCrossStateChange(sender, data) {
      if (data == false) {
        showCrossRoad(false);
      } else {
        loadRoadCrossImage(data);
      }
    }

    // 注册事件监听
    indoorNaviEventAPI.EventShowPreRoadCross.addEventHandler(preLoadRoadCross);
    indoorNaviEventAPI.EventNavigationFinished.addEventHandler(navigationFinished);
    indoorNaviEventAPI.EventNavigationExited.addEventHandler(navigationFinished);
    indoorNaviEventAPI.EventShowRoadCross.addEventHandler(onRoadCrossStateChange);

    return {
      roadCrossPlugin: roadCrossPlugin,
      /** 销毁路口视图并移除事件监听 */
      destory: function () {
        indoorNaviEventAPI.EventShowPreRoadCross.removeEventHandler(preLoadRoadCross);
        indoorNaviEventAPI.EventShowRoadCross.removeEventHandler(onRoadCrossStateChange);
        indoorNaviEventAPI.EventNavigationFinished.removeEventHandler(navigationFinished);
        indoorNaviEventAPI.EventNavigationExited.removeEventHandler(navigationFinished);
        roadCrossContainer["hide"]();
        roadCrossContainer["remove"]();
      },
    };
  };

  /** 地图信息卡片组件 */
  const DXMapInfoComponent = (function (DXBaseComponent) {
    const DXMapInfoComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXMapInfoComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = '<div class="map-list-item-wrapper"></div>';
        this.isShow = true;
        this._super(parentDom, params);
      },

      updateData: function (data) {
        const iconHtml = data?.["icon_logo"] ? `<div class="map-list-item-icon"><img alt src="${data["icon_logo"]}"/></div>` : "";
        const levelHtml = data?.["hospital-level"] ? `<span class="hospital-level">${data["hospital-level"]}</span>` : "";
        const funcHtml = data?.["hospital-func"] ? `<span class="hospital-func">${data["hospital-func"]}</span>` : "";
        const distanceHtml = data?.["distance"] ? `<div class="distance">${data["distance"]}</div>` : "";

        this._domStr = `
          <div class="map-list-item" data-bdid="${data?.["bdid"] || ""}">
            ${iconHtml}
            <div class="map-list-item-info">
              <p>"${data?.["bdName"] || ""}"</p>
              <p>${levelHtml}${funcHtml}</p>
            </div>
            ${distanceHtml}
          </div>`;

        this._dom.show();
        this._dom.html(this._domStr);
      },

      injectComponentEvents: function (callbackFn) {
        domUtils.on(this._dom, "click", function () {});
      },

      hide: function () {
        this.isShow = false;
        this._dom.hide();
      },

      show: function () {
        this.isShow = true;
        this._dom.show();
      },
    });
    return DXMapInfoComponent;
  })(DXBaseComponent);
  daxiapp["DXMapInfoComponent"] = DXMapInfoComponent;

  /** 地图列表组件 */
  const DXMapListComponent = (function (DXBaseComponent) {
    // 下拉箭头图标 Base64
    const ARROW_ICON =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAgBAMAAAC1LabbAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAeUExURUxpcUpKSk5OTkpKSkpKSktLS0xMTEpKSkpKSkpKSjQLiWYAAAAJdFJOUwDcG6z2Qye/kMlUwisAAACUSURBVCjPjdOxEYAgDAXQnHcyAJ2dbsAa9izgCnZ2ruBZsa0gIhB+PH+RFP9ekSKkVpKzHCMuek20OY1L69XkMO1nt1M3YGrd6SemHhq/MI0Q0wdimiCiL0Q0w5YWsKUl5LSCnNawpgzWlMOSNrCkLcwUwEwRTBTCRDGMVICRSvCmErypCAMVYbjj/Hgcaz5KRf9zAXKtP94LFGN2AAAAAElFTkSuQmCC";

    const DXMapListComponent = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXMapListComponent";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = '<div class="map-list"></div>';
        this.isShow = true;
        this._super(parentDom, params);
      },

      updateData: function (data) {
        this.data = data;
        this.listMap = {};
        const that = this;
        const title = data?.title || data?.provice || "";

        // 构建列表项 HTML
        const itemsHtml =
          data?.list
            ?.map((item, index) => {
              that.listMap[item.bdid] = item;

              const iconHtml = item["icon-logo"] ? `<div class="map-list-item-icon"><img alt="" src="${item["icon-logo"]}"></div>` : "";

              const label1 = item.label1 || item.description || "";
              const label2 = item.label2 || item.department || "";
              const labelsHtml =
                label1 || label2
                  ? `<p><span class="hospital-level" aria-hidden="true">${label1}</span><span class="hospital-function">${label2}</span></p>`
                  : "";

              const nearestTag = index == 0 && data.list.length > 1 ? "</br><span>最近</span>" : "";
              const distanceHtml = item.distance ? `<div class="distance"><span>${item.distance}</span>${nearestTag}</div>` : "";

              return `
            <div class="map-list-item" role="button" aria-label="${item.cn_name}" data-bdid="${item.bdid}">
              ${iconHtml}
              <div class="map-list-item-name" aria-hidden="true">
                <p>${item.cn_name}</p>
                ${labelsHtml}
              </div>
              ${distanceHtml}
            </div>`;
            })
            .join("") || "";

        const html = `
          <div class="map-list-title" style="text-transform: capitalize;">
            <div role="button">
              <span>${title}</span>
              <span><img aria-hidden="true" src="${ARROW_ICON}" alt="向下" style="transform: translateY(-1px) rotate(0deg);"></span>
            </div>
          </div>
          <div style="max-height: initial; overflow: hidden;">${itemsHtml}</div>`;

        this._dom.show();
        this._dom.html(html);
      },

      injectComponentEvents: function (callbackFn) {
        const that = this;

        domUtils.on(that._dom, "click", ".map-list-title", function () {
          $(this).next().toggle();
        });

        domUtils.on(that._dom, "click", ".map-list-item", function () {
          const bdid = this.dataset.bdid || "";
          that.listener?.onItemClicked?.(that.listMap[bdid]);
        });
      },

      hide: function () {
        this.isShow = false;
        this._dom.hide();
      },

      show: function () {
        this.isShow = true;
        this._dom.show();
      },
    });
    return DXMapListComponent;
  })(DXBaseComponent);
  daxiapp.DXMapListComponent = DXMapListComponent;

  /**
   * 路线过渡列表视图2
   * 用于显示路线规划结果和导航操作
   */
  const DXRouteTransitListView2 = (function (DXBaseComponent) {
    // 场景类型配置映射
    const SCENE_TYPE_MAP = {
      library: "sceneType:library",
      meeting: "sceneType:meeting",
      station: "sceneType:station",
    };

    const DXRouteTransitListView2 = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXRouteTransitListView2";
      },

      init: function (parentDom, params) {
        const loadingText = window.langData?.["waiting:for:response"] || "正在规划路线";
        this._params = params;
        this._domStr = `
          <div class="routing-info animated fadeInUp">
            <div class="container"></div>
            <div class="loading-route" style="text-align:center;display: flex;align-items: center;justify-content: space-evenly;padding: 10px;">
              <p>
                <span class="loading" style="vertical-align: middle; display: inline-block;"></span>
                <span style="display: inline-block;vertical-align: middle;padding: 10px;font-size: var(--dxmap-fontSize-big,16px);color: var(--themeColor,#1a9dfb);">${loadingText}</span>
              </p>
            </div>
          </div>`;
        this.isShow = true;
        this._super(parentDom, params);
        this._routeContainer = this._dom.find(".container");
        this._loadingDom = this._dom.find(".loading-route");
      },

      /** 生成路线信息卡片 DOM */
      geneRouteInfoDom: function (routeInfo, segIndex, count) {
        if (routeInfo.routetype == 3) {
          return this._geneIndoorRouteCard(routeInfo, segIndex, count);
        }
        return this._geneOutdoorRouteCard(routeInfo);
      },

      /** 生成室内路线卡片 */
      _geneIndoorRouteCard: function (routeInfo, segIndex, count) {
        const langData = window.langData || {};
        const browseText = langData["browse:route:text"] || "路径全览";
        const startText = langData.startPoint || "起点";
        const endText = langData.endpoint || "终点";

        // 构建视角快捷栏项目
        const viewItems = [
          { id: "full", label: browseText, dataType: "browser_all_route" },
          { id: "start", label: startText, dataType: "start" },
        ];

        // 添加途经点
        let exchangeCount = 0;
        if (routeInfo.steps?.length > 1 || count > 1) {
          const bdid = routeInfo.startPoint?.bdid || "";
          routeInfo.steps.forEach((item, index) => {
            if (segIndex == 0) {
              if (count == 1 && index == 0) return;
              if (count > 1) index += 1;
            }
            exchangeCount++;
            const exchangeLabel = count > 1 || routeInfo.steps.length > 2 ? `途径点-${exchangeCount}` : "途径点";
            viewItems.push({
              id: `exchange-${index}`,
              label: exchangeLabel,
              dataType: "indoorPoint",
              segindex: segIndex,
              bdid: bdid,
              stepindex: index,
            });
          });
        }
        viewItems.push({ id: "end", label: endText, dataType: "end" });

        // 生成视角快捷栏 HTML
        const viewBarHtml = `<div class="route-view-bar">${viewItems
          .map((item, idx) => {
            const activeClass = idx == 0 ? " active" : "";
            let dataAttrs = `data-type="${item.dataType}"`;
            if (item.segindex != undefined) dataAttrs += ` data-segindex="${item.segindex}"`;
            if (item.bdid) dataAttrs += ` data-bdid="${item.bdid}"`;
            if (item.stepindex != undefined) dataAttrs += ` data-stepindex="${item.stepindex}"`;
            return `<button class="route-view-item${activeClass}" ${dataAttrs}>${item.label}</button>`;
          })
          .join("")}</div>`;

        // 导航按钮配置
        const isNearStart = routeInfo.startPoint?.posMode == "myPosition";
        const naviBtnText = isNearStart ? langData["start:navi:btntext"] || "开始导航" : langData["start:simulatenavi:btntext"] || "模拟导航";
        const naviBtnClass = isNearStart ? "routing-info-true" : "routing-info-simulate";
        const routeFeature = langData["route:feature:text"] || "内部路段";

        return `
          <div class="route-card-v2">
            ${viewBarHtml}
            <div class="route-card-detail">
              <div class="route-card-detail-header">
                <div class="route-card-detail-left">
                  <div class="route-card-icon indoor">
                    <i class="icon_gb-navi"></i>
                  </div>
                  <div class="route-card-detail-info">
                    <h3>开始步行导航</h3>
                    <p>${routeFeature}</p>
                  </div>
                </div>
                <div class="route-card-info-right">
                  <div class="route-card-info-time">${routeInfo.timeDesc || ""}</div>
                  <div class="route-card-info-dist">全程 ${routeInfo.disDesc || ""}</div>
                </div>
              </div>
              <div class="route-card-actions">
                <button class="route-card-btn primary ${naviBtnClass} active" data-segindex="${segIndex}" role="button">
                  <i class="icon_gb-navi"></i>
                  ${naviBtnText}
                </button>
              </div>
            </div>
          </div>`;
      },

      /** 生成室外路线卡片 */
      _geneOutdoorRouteCard: function (routeInfo) {
        const langData = window.langData || {};
        const buildingType = DxApp?._config?.buildingType;
        const sceneTypeKey = SCENE_TYPE_MAP[buildingType] || "sceneType:hospital";
        const bdtype = langData[sceneTypeKey] || "医院";
        const sceneName = DxApp?._config?.mainPoiPage?.title || bdtype;
        const thirdNaviTip = langData["open:thridnaviapp:tip"] || "当前为外部路段，请使用第三方地图导航至";

        return `
          <div class="route-card-v2">
            <div class="route-card-header">
              <div class="route-card-icon outdoor">
                <i class="icon_gb-around"></i>
              </div>
              <div class="route-card-content">
                <h3 class="route-card-title">前往${sceneName}</h3>
                <p class="route-card-desc">
                  ${thirdNaviTip} <span class="highlight">${sceneName}</span>，到达后再切换至内部导航。
                </p>
              </div>
            </div>
            <div class="route-card-stats">
              <div class="route-card-stat">
                <div class="route-card-stat-label">预计距离</div>
                <div class="route-card-stat-value">${routeInfo.disDesc || "--"}</div>
              </div>
              <div class="route-card-stat">
                <div class="route-card-stat-label">预计耗时</div>
                <div class="route-card-stat-value">${routeInfo.timeDesc || "--"}</div>
              </div>
              <div class="route-card-stat">
                <div class="route-card-stat-label">方式</div>
                <div class="route-card-stat-value">${routeInfo.transitType || "驾车"}</div>
              </div>
            </div>
          </div>`;
      },

      /** 生成错误信息提示 */
      geneErrorInfo: function (data) {
        const langData = window.langData || {};
        if (data.isSuccess == false) {
          return `<div class="error-route-container"><span class="error-route-tip">${data.errMsg || ""}</span></div>`;
        } else if (!data.startPoint) {
          const startTip = langData["select:startpos:text"] || "请选择起点位置";
          return `<div class="error-route-container2" data-emptypoint="startPoint"><span class="error-route-tip">${startTip}</span></div>`;
        } else if (!data.endPoint) {
          const endTip = langData["select:endpos:text"] || "请选择终点位置";
          return `<div class="error-route-container2" data-emptypoint="endPoint"><span class="error-route-tip">${endTip}</span></div>`;
        }
        return "";
      },

      updateData: function (data) {
        this.data = data;
        this.routeInfoSegments = [];
        let itemsStr = "";

        if (data.segments) {
          data.segments.forEach((item, index) => {
            item.segindex = index;
            this.routeInfoSegments.push(this.geneRouteInfoDom(item, index, data.segments.length));
          });
          this.activeRouteIndex = 0;
          itemsStr = this.routeInfoSegments[0];
        } else {
          itemsStr = this.geneErrorInfo(data);
        }
        this._routeContainer.html(itemsStr);
        this._loadingDom.hide();
        this._dom.show();
        this.listener?.onViewChanged?.({ top: this._dom.offset().top, segindex: 0 });
      },

      changeSegmentRouteInfo: function (index) {
        if (index != this.activeRouteIndex) {
          const itemsStr = this.routeInfoSegments[index];
          this._routeContainer.html(itemsStr);
          this._dom.show();
          this.activeRouteIndex = index;
          this.listener?.onViewChanged?.({ top: this._dom.offset().top, segindex: index });
        }
      },

      changeSimulateToReal: function (bdid) {
        const that = this;
        const langData = window.langData || {};
        const naviText = langData["start:navi:btntext"] || "开始导航";
        const simulateText = langData["start:simulatenavi:btntext"] || "模拟导航";

        this.data?.segments?.forEach((item, index) => {
          if (item.routetype == 3 && item.startPoint?.bdid == bdid) {
            domUtils.find(that._routeContainer, ".routing-info-simulate").removeClass("routing-info-simulate").addClass("routing-info-true").text(naviText);
            that.routeInfoSegments[index] = that.routeInfoSegments[index].replace("routing-info-simulate", "routing-info-true").replace(simulateText, naviText);
          }
        });
      },

      showLoading: function () {
        this._routeContainer.html("");
        this._loadingDom.show();
        this.listener?.onViewChanged?.({ top: this._dom.offset().top });
      },

      injectComponentEvents: function () {
        const that = this;

        // 选择起点/终点提示点击
        domUtils.on(that._dom, "click", ".error-route-container2", function () {
          const emptypoint = this.dataset.emptypoint;
          that.listener?.onSelectPointTipClicked?.({ pointType: emptypoint });
        });

        // 路线错误点击
        domUtils.on(that._dom, "click", ".error-route-container", function () {
          that.listener?.onRouteErrorClicked?.();
        });

        // 开始导航按钮
        domUtils.on(that._dom, "click", ".routing-info-true", function () {
          const data = that.data?.segments?.[this.dataset.segindex];
          that.listener?.triggerStartNavi?.(data);
        });

        // 模拟导航按钮
        domUtils.on(that._dom, "click", ".routing-info-simulate", function () {
          const data = that.data?.segments?.[this.dataset.segindex];
          that.listener?.triggerStartSimulateNavi?.(data);
        });

        // 视角快捷栏按钮点击
        domUtils.on(that._dom, "click", ".route-view-item", function () {
          const dataSet = this.dataset;
          if ($(this).hasClass("active")) return;
          domUtils.find(that._dom, ".route-view-item").removeClass("active");
          $(this).addClass("active");

          // 根据 data-type 处理不同的视角切换
          if (dataSet.type == "browser_all_route") {
            that.listener?.triggerRouteBrowse?.({ type: "browse" });
          } else if (dataSet.bdid && dataSet.segindex != undefined) {
            const segment = that.data?.segments?.[dataSet.segindex];
            const point = dataSet.stepindex == 0 ? segment?.startPoint : segment?.steps?.[dataSet.stepindex - 1]?.endPoint;
            that.listener?.triggerRouteBrowse?.({ type: dataSet.type, point: point });
          } else {
            that.listener?.triggerRouteBrowse?.(dataSet);
          }
        });

        // 第三方导航按钮
        domUtils.on(that._dom, "click", ".routing-info-come", function () {
          const segindex = this.dataset.segindex;
          const targetPoint = that.data?.segments?.[segindex]?.endPoint;
          that.listener?.triggerTirdNavi?.(targetPoint);
        });
      },

      hide: function () {
        this.isShow = false;
        this._dom.hide();
      },

      show: function () {
        this.isShow = true;
        this._dom.show();
      },

      setVisible: function (visible, routedata) {
        if (visible) {
          if (routedata) this.updateData(routedata);
          this.show();
        } else {
          this.hide();
        }
      },

      clearSelect: function () {
        domUtils.find(this._dom, ".route-detail-item").removeClass("active");
        domUtils.find(this._dom, ".route-detail-title").removeClass("active");
      },
    });
    return DXRouteTransitListView2;
  })(DXBaseComponent);
  daxiapp.DXRouteTransitListView2 = DXRouteTransitListView2;

  /** 路线过渡列表视图3 - 支持多方案切换 */
  const DXRouteTransitListView3 = (function (DXBaseComponent) {
    const DXRouteTransitListView3 = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXRouteTransitListView3";
      },

      init: function (parentDom, params) {
        const langData = window.langData || {};
        const loadingText = langData["waiting:for:response"] || "正在规划路线";
        this._params = params;
        this._domStr = `
          <div class="routing-info animated fadeInUp">
            <div class="container"></div>
            <div class="loading-route" style="text-align:center;display: flex;align-items: center;justify-content: space-evenly;padding: 10px;">
              <p>
                <span class="loading" style="vertical-align: middle;display: inline-block;"></span>
                <span style="display: inline-block;vertical-align: middle;padding: 10px;font-size: var(--dxmap-fontSize-big,16px);color: var(--themeColor,#1a9dfb);">${loadingText}</span>
              </p>
            </div>
          </div>`;
        this.isShow = true;
        this._super(parentDom, params);
        this._routeContainer = this._dom.find(".container");
        this._loadingDom = this._dom.find(".loading-route");
      },

      /** 生成室内路线卡片 */
      geneRouteInfoDom: function (routeInfo, segIndex, count) {
        if (routeInfo.routetype != 3) return "";

        const langData = window.langData || {};
        const browseText = langData["browse:route:text"] || "路径全览";
        const startText = langData.startpoint || "起点";
        const endText = langData.endpoint || "终点";
        const bdid = routeInfo.startpoint?.bdid || "";

        // 生成途经点
        let stepsHtml = "";
        if (routeInfo.detail?.steps?.length > 1 || count > 1) {
          routeInfo.detail.steps.forEach((item, index) => {
            if (segIndex == 0) {
              if (count == 1 && index == 0) return;
              if (count > 1) index += 1;
            }
            const displayIndex = segIndex > 0 ? index + 1 : index;
            stepsHtml += `<div class="route-detail-item" data-type="indoorPoint" data-segindex="${segIndex}" data-bdid="${bdid}" data-stepindex="${index}"><div>${displayIndex}</div></div>`;
          });
        }

        // 导航按钮
        const isNearStart = routeInfo.startpoint?.posMode == "myPosition";
        const naviBtnClass = isNearStart ? "routing-info-true" : "routing-info-simulate";
        const naviBtnText = isNearStart ? langData["start:navi:btntext"] || "开始导航" : langData["start:simulatenavi:btntext"] || "模拟导航";

        return `
          <div id="route-detail" class="route-detail" data-type="browser_all_route">
            <div id="route-detail-title" class="route-detail-title"><div>${browseText}</div></div>
            <div id="route-start" data-type="start" class="route-detail-item multi"><div>${startText}</div></div>
            <div class="route-detail-scroll" style="max-width: 217px;">
              <div class="route-detail-content">${stepsHtml}</div>
            </div>
            <div id="route-end" class="route-detail-item multi" data-type="end"><div>${endText}</div></div>
          </div>
          <div style="box-shadow: rgba(0, 0, 0, 0.24) 0px 1px 4px; background-color: rgb(255, 255, 255);">
            <div class="routing-info-navi" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;">
              <div style="width: 100%;display: flex;justify-content: space-around;">
                <div class="routing-info-dis">${routeInfo.detail?.disDesc || ""}<br>${routeInfo.detail?.timeDesc || ""}</div>
                <div class="${naviBtnClass} active" data-segindex="${segIndex}" role="button">${naviBtnText}</div>
              </div>
            </div>
          </div>`;
      },

      /** 生成错误信息提示 */
      geneErrorInfo: function (data) {
        const langData = window.langData || {};
        const startpoint = data.startPoint || data.startpoint;
        const endpoint = data.endPoint || data.endpoint;

        if (data.isSuccess == false) {
          return `<div class="error-route-container"><span class="error-route-tip">${data.errMsg || ""}</span></div>`;
        } else if (!startpoint) {
          const tip = langData["select:startpos:text"] || "请选择起点位置";
          return `<div class="error-route-container2" data-emptypoint="startpoint"><span class="error-route-tip">${tip}</span></div>`;
        } else if (!endpoint) {
          const tip = langData["select:endpos:text"] || "请选择终点位置";
          return `<div class="error-route-container2" data-emptypoint="endPoint"><span class="error-route-tip">${tip}</span></div>`;
        }
        return "";
      },

      updateData: function (data, routeIndex) {
        this.data = data[routeIndex];
        this.routeInfoSegments = [];
        const langData = window.langData || {};
        let itemsStr = "";
        let outDoorRoutes = "";
        let routeType = "";

        if (Array.isArray(data)) {
          outDoorRoutes = '<div class="routeIndex"><ul>';

          data.forEach((route, num) => {
            if (route.segments) {
              route.segments.forEach((item, index) => {
                item.segindex = index;
                if (item.routetype == 3) {
                  this.routeInfoSegments.push(this.geneRouteInfoDom(item, index, route.segments.length));
                } else {
                  const activeClass = num == routeIndex ? ' class="on"' : "";
                  const tacticsText = langData["tactics:text"] || "方案";
                  outDoorRoutes += `
                    <li${activeClass}>
                      <div>${tacticsText}${num + 1}</div>
                      <div>${route.timeDesc || ""}</div>
                      <div>${route.disDesc || ""}</div>
                    </li>`;
                  routeType = "outdoor";
                }
              });
              this.activeRouteIndex = 0;
              itemsStr = this.routeInfoSegments;
            } else {
              itemsStr = this.geneErrorInfo(route);
            }
          });

          const routeText = langData["route:btntext"] || "路线";
          const detailText = langData["detail:btntext"] || "详情";
          const naviText = langData["start:navi:btntext"] || "开始导航";
          outDoorRoutes += `
            </ul>
            </div>
            <div class="routeBottom">
              <div class="btn_detail"><span class="icon_gb-detail"></span>${routeText}${detailText}</div>
              <div class="btn_navi">${naviText}</div>
            </div>`;
        } else {
          itemsStr = this.geneErrorInfo(data);
        }

        // 根据路线类型渲染不同内容
        if (this.routeInfoSegments.length && !routeType) {
          this._routeContainer.html(itemsStr[0]);
        } else if (outDoorRoutes) {
          this._routeContainer.html(outDoorRoutes);
        } else {
          this._routeContainer.html(itemsStr);
        }

        this._loadingDom.hide();
        this._dom.show();
        this.listener?.onViewChanged?.({ top: this._dom.offset().top, segindex: 0 });
      },

      changeSegmentRouteInfo: function (index) {
        if (index != this.activeRouteIndex) {
          const itemsStr = this.routeInfoSegments[index];
          this._routeContainer.html(itemsStr);
          this._dom.show();
          this.activeRouteIndex = index;
          this.listener?.onViewChanged?.({ top: this._dom.offset().top, segindex: index });
        }
      },

      changeSimulateToReal: function (bdid) {
        const that = this;
        const langData = window.langData || {};
        const naviText = langData["start:navi:btntext"] || "开始导航";
        const simulateText = langData["start:simulatenavi:btntext"] || "模拟导航";

        this.data?.segments?.forEach((item, index) => {
          if (item.routetype == 3 && item.startpoint?.bdid == bdid) {
            domUtils.find(that._routeContainer, ".routing-info-simulate").removeClass("routing-info-simulate").addClass("routing-info-true").text(naviText);
            that.routeInfoSegments[index] = that.routeInfoSegments[index].replace("routing-info-simulate", "routing-info-true").replace(simulateText, naviText);
          }
        });
      },

      showLoading: function () {
        this._routeContainer.html("");
        this._loadingDom.show();
        this.listener?.onViewChanged?.({ top: this._dom.offset().top });
      },

      injectComponentEvents: function () {
        const that = this;

        domUtils.on(that._dom, "click", ".error-route-container2", function () {
          const emptypoint = this.dataset.emptypoint;
          that.listener?.onSelectPointTipClicked?.({ pointType: emptypoint });
        });

        domUtils.on(that._dom, "click", ".error-route-container", function () {
          that.listener?.onRouteErrorClicked?.();
        });

        domUtils.on(that._dom, "click", ".btn_navi", function () {
          const data = that.data?.segments?.[this.dataset.segindex];
          that.listener?.triggerStartNavi?.(data);
        });

        domUtils.on(that._dom, "click", ".routing-info-true", function () {
          const data = that.data?.segments?.[this.dataset.segindex];
          that.listener?.triggerStartNavi?.(data);
        });

        domUtils.on(that._dom, "click", ".routing-info-simulate", function () {
          const data = that.data?.segments?.[this.dataset.segindex];
          that.listener?.triggerStartSimulateNavi?.(data);
        });

        domUtils.on(that._dom, "click", ".route-detail-title", function () {
          if ($(this).hasClass("active")) return;
          $(this).addClass("active").siblings().removeClass("active");
          domUtils.find(that._dom, ".route-detail-item").removeClass("active");
          that.listener?.triggerRouteBrowse?.({ type: "browse" });
        });

        domUtils.on(that._dom, "click", ".route-detail-item", function () {
          const dataSet = this.dataset;
          if ($(this).hasClass("active")) return;
          domUtils.find(that._dom, ".route-detail-item").removeClass("active");
          $(this).addClass("active").siblings().removeClass("active");

          if (dataSet.bdid && dataSet.segindex != undefined) {
            const segment = that.data?.segments?.[dataSet.segindex];
            const point = dataSet.stepindex == 0 ? segment?.startPoint : segment?.detail?.steps?.[dataSet.stepindex - 1]?.endPoint;
            return that.listener?.triggerRouteBrowse?.({ type: dataSet.type, point: point });
          }
          that.listener?.triggerRouteBrowse?.(dataSet);
        });

        domUtils.on(that._dom, "click", ".routing-info-come", function () {
          const segindex = this.dataset.segindex;
          const targetPoint = that.data?.segments?.[segindex]?.endPoint;
          that.listener?.triggerTirdNavi?.(targetPoint);
        });

        domUtils.on(that._dom, "click", ".routeIndex li", function () {
          const index = $(this).index();
          $(this).addClass("on").siblings().removeClass("on");
          that.listener?.triggerRouteIndex?.(index);
        });

        domUtils.on(that._dom, "click", ".btn_detail", function () {
          that.listener?.triggerRouteDetail?.();
        });
      },

      hide: function () {
        this.isShow = false;
        this._dom.hide();
      },

      show: function () {
        this.isShow = true;
        this._dom.show();
      },

      setVisible: function (visible, routedata, routeIndex) {
        if (visible) {
          if (routedata) this.updateData(routedata, routeIndex);
          this.show();
        } else {
          this.hide();
        }
      },

      clearSelect: function () {
        domUtils.find(this._dom, ".route-detail-item").removeClass("active");
        domUtils.find(this._dom, ".route-detail-title").removeClass("active");
      },
    });
    return DXRouteTransitListView3;
  })(DXBaseComponent);
  daxiapp.DXRouteTransitListView3 = DXRouteTransitListView3;

  /** 驾车路线详情视图 */
  const DXDriverRouteDetailView = (function (DXBaseComponent) {
    const DXDriverRouteDetailView = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXDriverRouteDetailView";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = '<div style="background: #fff; height: 100%;position: relative; z-index: 2">';
        this.isShow = true;
        this._super(parentDom, params);
        this._routeContainer = this._dom.find(".driverRoute");
        this._loadingDom = this._dom.find(".loading-route");
      },

      updateData: function (data, routeIndex = 0) {
        const langData = window.langData || {};
        const winHeight = $("body").height();
        const routeHeight = winHeight - 150;
        const tacticsText = langData["tactics:text"] || "方案";
        const gotoMapText = langData["goto:map:text"] || "查看地图";

        // 生成方案列表
        const routeListHtml =
          data.transits
            ?.map((item, index) => {
              const activeClass = index == routeIndex ? ' class="on"' : "";
              return `
            <li${activeClass}>
              <div>${tacticsText} ${index + 1}</div>
              <div>${item.timeDesc || ""}</div>
              <div>${item.disDesc || ""}</div>
            </li>`;
            })
            .join("") || "";

        // 生成驾车步骤列表
        let stepsHtml = "";
        data.transits?.[routeIndex]?.segments?.forEach((segment) => {
          if (segment.routetype == 0) {
            segment.detail?.route?.paths?.steps?.forEach((step) => {
              const action = typeof step.action == "string" ? step.action : step.assistant_action;
              stepsHtml += `
                <li>
                  <div class="cricle"><i class="icon-myposition"></i></div>
                  <div class="driverInfoAction">${action || ""}</div>
                  <div class="driverInfoText">${step.instruction || ""}</div>
                </li>`;
            });
          }
        });

        const html = `
          <div class="routeIndex"><ul>${routeListHtml}</ul></div>
          <div class="driverInfo" style="height:${routeHeight}px"><ul>${stepsHtml}</ul></div>
          <div class="driverBottom">
            <div class="openMap"><i class="icon_map"></i>>${gotoMapText}</div>
          </div>`;

        this._dom.html(html);
        this._dom.show();
      },

      injectComponentEvents: function () {
        const that = this;

        domUtils.on(that._dom, "click", ".routeIndex li", function () {
          const index = $(this).index();
          that.listener?.onRouteIndexChanged?.(index);
        });

        domUtils.on(that._dom, "click", ".openMap", function () {
          that.hide();
        });
      },

      hide: function () {
        this.isShow = false;
        this._dom.hide();
      },

      show: function () {
        this.isShow = true;
        this._dom.show();
      },
    });
    return DXDriverRouteDetailView;
  })(DXBaseComponent);
  daxiapp.DXDriverRouteDetailView = DXDriverRouteDetailView;

  /** 公交路线详情视图 */
  const DXBusRouteDetailView = (function (DXBaseComponent) {
    /** 格式化时长为可读字符串 */
    function formatDuration(duration) {
      const langData = window.langData || {};
      const hour = parseInt(duration / 3600);
      const minute = parseInt((duration % 3600) / 60);
      const minuteDesc = minute < 10 ? `0${minute}` : minute;
      const hourText = hour > 0 ? `${hour}${langData.hour || "小时"}` : "";
      return `${hourText}${minuteDesc}${langData.minute || "分钟"}`;
    }

    const DXBusRouteDetailView = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXBusRouteDetailView";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = '<div style="background: #efefef; height: 100%;position: relative; z-index: 2">';
        this.isShow = true;
        this._super(parentDom, params);
        this._routeContainer = this._dom.find(".busRoute");
        this._loadingDom = this._dom.find(".loading-route");
      },

      updateData: function (data, routeIndex = 0) {
        const langData = window.langData || {};
        const gotoMapText = langData["goto:map:text"] || "查看地图";

        // 生成公交方案列表
        const routeListHtml =
          data
            ?.map((item) => {
              const time = formatDuration(item.duration || 0);
              const labelHtml = item.label ? `<span class="busTip">${item.label}</span>` : "";

              // 计算公交转乘次数
              const busLen = item.segments?.filter((line) => line.routetype == 5).length || 0;

              // 生成路线内容
              let startStation = "";
              const segmentsHtml =
                item.segments
                  ?.map((line, index) => {
                    if (line.startIcon == "start") {
                      startStation = line.detail?.arrival_point?.name || "";
                    }

                    if (line.routetype == 2) {
                      return `<span class='walk2'><i class='icon-buxing'></i></span>`;
                    } else if (line.routetype == 1) {
                      return `<span class='gongjiao'><i class='icon-icon_gongjiao'></i><span>${line.name}</span></span>`;
                    } else if (line.routetype == 5) {
                      if (!item.arrival_stop_name) {
                        item.arrival_stop_name = line.arrival_stop?.name || "";
                      }
                      const triangleHtml = index > 0 && index < busLen ? '<span class="triangle"></span>' : "";
                      return `<div class="buslist"><span class="bs train">${line.name}</span>${triangleHtml}</div>`;
                    }
                    return "";
                  })
                  .join("") || "";

              const firstStationHtml = startStation ? `<p class="firstStation"><span>${startStation}上车</span></p>` : "";

              return `
            <li>
              <div class="busTitle">
                ${labelHtml}
                <span class="busUseTime">${time}</span>
                <span class="busWalkTime">${item.disDesc || ""}</span>
              </div>
              <div class="busContent">
                ${segmentsHtml}
                ${firstStationHtml}
              </div>
            </li>`;
            })
            .join("") || "";

        const html = `
          <div class="routeBusContainer"><ul>${routeListHtml}</ul></div>
          <div class="driverBottom">
            <div class="openMap"><i class="icon_map"></i>${gotoMapText}</div>
          </div>`;

        this._dom.html(html);
        this._dom.show();
        this._loadingDom.hide();

        const height = $("body").height() - $(".routing-info-top").height();
        this._dom.css("height", `${height}px`);
      },

      injectComponentEvents: function () {
        const that = this;

        domUtils.on(that._dom, "click", ".routeIndex li", function () {
          const index = $(this).index();
          that.listener?.onRouteIndexChanged?.(index);
        });

        domUtils.on(that._dom, "click", ".openMap", function () {
          that.hide();
        });
      },

      hide: function () {
        this.isShow = false;
        this._dom.hide();
      },

      show: function () {
        this.isShow = true;
        this._dom.show();
      },
    });
    return DXBusRouteDetailView;
  })(DXBaseComponent);
  daxiapp.DXBusRouteDetailView = DXBusRouteDetailView;

  /** 步行路线详情视图 */
  const DXWalkRouteDetailView = (function (DXBaseComponent) {
    const DXWalkRouteDetailView = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXWalkRouteDetailView";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = '<div style="background: #fff; height: 100%;position: relative; z-index: 2">';
        this.isShow = true;
        this._super(parentDom, params);
        this._routeContainer = this._dom.find(".walkRoute");
        this._loadingDom = this._dom.find(".loading-route");
      },

      updateData: function (data, routeIndex = 0) {
        const langData = window.langData || {};
        const routeHeight = $("body").height() - 150;
        const gotoMapText = langData["goto:map:text"] || "查看地图";
        const tacticsText = langData["tactics:text"] || "方案";

        // 生成方案列表
        const routeListHtml =
          data.transits
            ?.map((item, index) => {
              const activeClass = index == routeIndex ? ' class="on"' : "";
              return `
            <li${activeClass}>
              <div>${tacticsText}${index + 1}</div>
              <div>${item.timeDesc || ""}</div>
              <div>${item.disDesc || ""}</div>
            </li>`;
            })
            .join("") || "";

        // 生成步行步骤列表
        let stepsHtml = "";
        data.transits?.[routeIndex]?.segments?.forEach((segment) => {
          if (segment.routetype == 2) {
            segment.detail?.route?.paths?.[0]?.steps?.forEach((step) => {
              const action = typeof step.action == "string" ? step.action : step.assistant_action;
              stepsHtml += `
                <li>
                  <div class="cricle"><i class="icon-myposition"></i></div>
                  <div class="driverInfoAction">${action || ""}</div>
                  <div class="driverInfoText">${step.instruction || ""}</div>
                </li>`;
            });
          }
        });

        const html = `
          <div class="routeIndex"><ul>${routeListHtml}</ul></div>
          <div class="driverInfo" style="height:${routeHeight}px"><ul>${stepsHtml}</ul></div>
          <div class="driverBottom">
            <div class="openMap"><i class="icon_map"></i>${gotoMapText}</div>
          </div>`;

        this._dom.html(html);
        this._dom.show();
      },

      injectComponentEvents: function () {
        const that = this;

        domUtils.on(that._dom, "click", ".routeIndex li", function () {
          const index = $(this).index();
          that.listener?.onRouteIndexChanged?.(index);
        });

        domUtils.on(that._dom, "click", ".openMap", function () {
          that.hide();
        });
      },

      hide: function () {
        this.isShow = false;
        this._dom.hide();
      },

      show: function () {
        this.isShow = true;
        this._dom.show();
      },
    });
    return DXWalkRouteDetailView;
  })(DXBaseComponent);
  daxiapp.DXWalkRouteDetailView = DXWalkRouteDetailView;

  /** 导航信息视图组件 */
  const DXNaviInfoView = (function (DXBaseComponent) {
    const DXNaviInfoView = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXNaviInfoView";
      },

      init: function (parentDom, params) {
        const langData = window.langData || {};
        const distanceText = langData.distance || "距离";
        const timeText = langData.time || "时间";
        const pauseNaviText = langData["pause:navi:text"] || "导航暂停";
        const exitText = langData.exit || "退出";

        this._params = params;

        // 目的地信息区域
        const destinationHtml = `
          <div class="navigating-bottom animated fadeInUp">
            <div class="navigating-bottom-destination" style="display: flex; flex-wrap: nowrap; justify-content: center; align-items: center;">
              <div class="navigating-bottom-destination-flag">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADkAAABLCAMAAAD9LN99AAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAABFUExURUxpcf+uL/WmI/6sKverJvWmI/anI/WmI/+9NvamI/anI/ipJPenJPamI/anI/WmI/anI/eoJPanI/amI/enI/WmI/WmI7C6FE8AAAAWdFJOUwAL8RUf6876BeRtLU2rm9uOQH64W8EEd8NrAAACBElEQVRYw51X22KsIAwE5e4NRfn/T23P2W27JkEC8+gyayYJkygEhSms16at1f5aw+4ED25edL5hWGYG2QVAe5MPWSGePhegw9N7d5MfsM1F4pEriPRr5ZKrSCNBVCYzsE2Y6DMLA6RKk5nYQMBLZuNyTVn9xPpZx9yE849p2pj+N96zlEdd+OH4aXKiIDaF6bvHnQrJEn/5zm/APy0fVVMr0YavV6KYBtDaOzph/9+5GdVa1TszUE2gFW7qEabi+vcUhrKTxmRxuBNMDn13Izg2o8xaRTPHAWUX5DyVDAOfu4ikUQAl2ITY7k9UiSmBKpTasjWig/d0+7Klgm4Yu5lSeBh+CeggCqI0cFBwqegU4MLczxlU4aXEjKgTAn3dUTk9MpTpwRMffHXHFbYTRVSg4a0jbrYn4kXDI5FuYhBVJtJNsGn6qWZDgywMFRs/XiuPoeCaYqS8eH0tMm6PhNH/GkdhknljvH2eZm5rm0h6LDlFwxRsGdmgtWVDvGAGTJbNhJtY4BIjak2mVOPq44peACg/3m2HSLbUWLCa1CGSJ3VQ5Z3asruuaateH78AUofImtQHkZW186x+6hw9Il+4SJGSwRw1Y+9nSz0FD0ePyJcXAqmb5DKF0vXpxlm4TtGCyJj/NakNIu9Sm0TepAbRjtgh8i3VdIj82Uc6RL6lPor8AgTFvp31H5LKAAAAAElFTkSuQmCC" alt="目的地"/>
                <span>目的地</span>
              </div>
              <div class="navigating-bottom-destination-name">
                <div class="lv-marquee-wrap" role="marquee" style="overflow: hidden">
                  <div class="lv-marquee" style="position: relative; right: 0px; white-space: nowrap; display: inline-block;">
                    <span><em class="target-name"></em></span>
                  </div>
                  <div class="lv-marquee-wrap" role="marquee" style="overflow: hidden">
                    <div class="lv-marquee" style="position: relative; right: 0px; white-space: nowrap; display: inline-block;">
                      <div><span class="buildingname"></span><span class="target-floor"></span><span class="address"></span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>`;

        // 导航控制区域
        const controlHtml = `
            <div class="navigating-bottom-main" alignitems="center" style="display: flex; flex-wrap: wrap; align-items: center">
              <div class="navigating-bottom-content">
                <div>
                  <span class="text-distance">${distanceText}</span></br>
                  <span><strong class="tipFloor"></strong><small class="rest-distance"></small></span>
                </div>
                <div style="width: 35%">
                  <div class="text-time">${timeText}</div>
                  <div><strong class="rest-time"></strong></div>
                </div>
                <div style="width: 40%" class="arrive-time"></div>
              </div>
              <div class="continueNavi" style="display: none">${pauseNaviText}</div>
              <div class="navigating-bottom-btn exit-btn" style="width: 16.6667%; flex-basis: 16.6667%">
                <div>
                  <i class="icon" type="close-white-2" width="26px">
                    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4BAMAAADLSivhAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAeUExURUxpcf///////////////////////////////////9noCcoAAAAJdFJOUwB8WgOf3aotkAoIG7EAAAHOSURBVFjD7di5TsNAEAZgk3C0qZDSuaFwR2GJFskVHaKghoI+r0FpiyL7thCfu+s5/pkWT7n+Zz9nfSlbFFtttRVbd1/vJ3eyCqHFmo8hdNl04a8OSO/VJZnSt5ehFoRD+EiGbgJI93B4JZpbEM6a+9MG6AEOz+sFA+gBzhZsGj1AcIsNFxiB0KyA0Dyg08L8Oi1Nr9Hi7BotTy4fVeaWD2u/SjqurqcU0K8knwDuIT6C3L1cBnpuuBD2xNIp7IFlYkfwLUXlQJgOojCVhGEqisPrrAFehy1wnjbBedwGp3kjnDZY4bjDDMctdnjpccAL7YFn2gPPtAtOaCuc0GY4ou1wRDvgmfbAxf5laP55dDTX02k3fthF18ulavywg67j27Pxw2Z6hLvKQU9wuXPQE9z/ZTLSM1wUdnqB7XQE2+kYttIJbKVT2EZnsI3OYQu9gi30GsZpAsZpCkZpEkZpGsZoBsZoDkZoFkZoHtZpAdZpCdZoEdZoGZZpBZZpDZZoFZZoHeZpAOZpBGbpbwCe6XM6+gTBM32iNtNKrXmkqT3ATn8zV+weYKk374jmaxAeaWIPsESad8Qe4EMIb9gXmEju7z/Bbz+e3Gqr/1m//Hy8PYBS0IgAAAAASUVORK5CYII=" style="width: 26px; height: auto; pointer-events: none"/>
                  </i>
                </div>
                <span class="text-exit">${exitText}</span>
              </div>
            </div>
          <div>`;

        this._domStr = destinationHtml + controlHtml;
        this.isShow = true;
        this._super(parentDom, params);
        this._routeContainer = this._dom.find(".container");
        this._loadingDom = this._dom.find(".loading-route");
        this._continueNaviBtn = this._dom.find(".continueNavi");
        this._navingBtn = this._dom.find(".navigating-bottom-content");
      },

      changeLanguage: function () {
        const langData = window.langData || {};
        this._dom.find(".text-distance").text(langData.distance || "距离");
        this._dom.find(".text-time").text(langData.time || "时间");
        this._dom.find(".continueNavi").text(langData["pause:navi:text"] || "导航暂停");
        this._dom.find(".text-exit").text(langData.exit || "退出");
      },

      setTargetInfo: function (targetInfo) {
        this._dom.find(".target-name").text(targetInfo?.name || "");
        this._dom.find(".target-floor").text(targetInfo?.flname || "");
        this._dom.find(".address").text(targetInfo?.address || "");
      },

      setArringTime: function (arriveTime) {
        const langData = window.langData || {};
        const template = langData["prediction:arrived:time:tip"] || "预计{{time}}到达";
        this._dom.find(".arrive-time").html(template.replace("{{time}}", arriveTime));
      },

      /** 更新导航数据（距离、时间） */
      updateData: function (data) {
        const langData = window.langData || {};
        const meterText = langData["meter:distance"] || "米";
        const minuteText = langData.minute || "分钟";
        const minuteShortText = langData["minute:lue"] || "分";

        if (data.remainDistance) {
          const distance = data.remainDistance;
          const distanceText = distance < 1000 ? `${distance}${meterText}` : `${~~(distance / 1000)}千${distance % 1000}${meterText}`;
          this._dom.find(".rest-distance").text(distanceText);
        }

        if (data.remainTime) {
          this._dom.find(".rest-time").text(data.remainTime.replace(minuteText, minuteShortText));
        }

        this._dom.show();
      },

      injectComponentEvents: function () {
        const that = this;
        domUtils.on(that._dom, "click", ".exit-btn", function () {
          that.listener?.onExitButtonClicked?.();
        });
      },

      triggerExitNaviBtnClick: function () {
        this._dom.find(".exit-btn").trigger("click");
      },

      hide: function () {
        this.isShow = false;
        this._dom.hide();
      },

      show: function () {
        this.isShow = true;
        this._dom.show();
      },
    });
    return DXNaviInfoView;
  })(DXBaseComponent);
  daxiapp.DXNaviInfoView = DXNaviInfoView;

  /** 导航信息视图组件2（简化版） */
  const DXNaviInfoView2 = (function (DXBaseComponent) {
    const DXNaviInfoView2 = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXNaviInfoView2";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `
          <div class="navigating-bottom2">
            <div class="exitNavi">退出</div>
            <div class="navigationContent">
              <div class="text-distance">剩余<span class="arrive-distance"></span></div>
              <div class="text-time"><span class="arrive-time"></span></div>
            </div>
            <div class="voice"><i class="icon-volume-medium1"></i></div>
          </div>`;

        this.isShow = true;
        this._super(parentDom, params);
        this._routeContainer = this._dom.find(".container");
        this._loadingDom = this._dom.find(".loading-route");
        this._continueNaviBtn = this._dom.find(".continueNavi");
        this._navingBtn = this._dom.find(".navigating-bottom-content");
      },

      changeLanguage: function () {},

      setTargetInfo: function () {},

      setArringTime: function (arriveTime) {
        this._dom.find(".arrive-time").text(arriveTime);
      },

      /** 更新导航数据（距离、时间） */
      updateData: function (data) {
        const langData = window.langData || {};
        const meterText = langData["meter:distance"] || "米";
        const minuteText = langData.minute || "分钟";
        const minuteShortText = langData["minute:lue"] || "分";

        if (data.remainDistance) {
          const distance = data.remainDistance;
          const distanceText = distance < 1000 ? `${distance}${meterText}` : `${~~(distance / 1000)}千${distance % 1000}${meterText}`;
          this._dom.find(".arrive-distance").text(distanceText);
        }

        if (data.remainTime) {
          this._dom.find(".arrive-time").text(data.remainTime.replace(minuteText, minuteShortText));
        }

        this._dom.show();
      },

      injectComponentEvents: function () {
        const that = this;

        domUtils.on(that._dom, "click", ".exitNavi", function () {
          that.listener?.onExitButtonClicked?.();
        });

        domUtils.on(that._dom, "click", ".voice", function () {
          that.listener?.onVoiceButtonClicked?.(that._dom);
        });
      },

      triggerExitNaviBtnClick: function () {
        this._dom.find(".exitNavi").trigger("click");
      },

      hide: function () {
        this.isShow = false;
        this._dom.hide();
      },

      show: function () {
        this.isShow = true;
        this._dom.show();
      },
    });
    return DXNaviInfoView2;
  })(DXBaseComponent);
  daxiapp.DXNaviInfoView2 = DXNaviInfoView2;

  /** 工具按钮组件 */
  const WidgetBtn = (function (DXBaseComponent) {
    const WidgetBtn = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "WidgetBtn";
      },

      init: function (parentDom, params) {
        this._params = params;
        const data = params.data || {};
        this._domStr = `
          <div role="button" class="button">
            <div class="img-icon ${data.class || ""}">
              <i class="icon ${data.icon || ""}" type="pos-gray" alt=""></i>
            </div>
            <span>${data.text || ""}</span>
          </div>`;
        this._super(parentDom, params);
      },

      injectComponentEvents: function () {
        const that = this;
        domUtils.on(that._dom, "click", ".button", function () {
          that.listener?.onItemClicked?.(this.dataset);
        });
      },

      hide: function () {
        this._dom.hide();
      },

      show: function () {
        this._dom.show();
      },
    });
    return WidgetBtn;
  })(DXBaseComponent);
  daxiapp.WidgetBtn = WidgetBtn;

  /** 工具列表组件 */
  const WidgetList = (function (DXBaseComponent) {
    /** 生成按钮项 HTML */
    function buildItemHtml(item, index) {
      return `
        <div role="button" class="button ${item.class || ""}" data-itemindex="${index}">
          <div class="img-icon">
            <i class="icon ${item.icon || ""}" type="pos-gray" alt=""></i>
          </div>
          <span style="display: inline-block; width: max-content; overflow: hidden">${item.text || ""}</span>
        </div>`;
    }

    const WidgetList = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "WidgetList";
      },

      init: function (parentDom, params) {
        this._params = params;
        const listHtml = params.list?.map((item, index) => buildItemHtml(item, index)).join("") || "";
        this._domStr = `<div class="widget-tools ui-panel">${listHtml}</div>`;
        this._super(parentDom, params);
      },

      updateData: function (list) {
        const listHtml = list?.map((item, index) => buildItemHtml(item, index)).join("") || "";
        this._params.list = list;
        this._dom[0].innerHTML = listHtml;
      },

      injectComponentEvents: function () {
        const that = this;

        domUtils.on(that._dom, "click", ".button", function () {
          const list = that._params.list || [];
          const index = this.dataset.itemindex;
          const item = list[index];

          if (item?.onClick) {
            item.onClick();
          } else {
            that.listener?.onItemClicked?.(this.dataset);
          }
        });

        domUtils.on(that._dom, "click", ".close", function () {
          that.hide();
        });
      },

      hide: function () {
        this._dom.hide();
      },

      show: function () {
        this._dom.show();
      },
    });
    return WidgetList;
  })(DXBaseComponent);
  daxiapp.WidgetList = WidgetList;

  /** 工具遮罩层组件 */
  const WidgetToolMask = (function (DXBaseComponent) {
    /** 生成按钮项 HTML */
    function buildItemHtml(item, index) {
      return `
        <div role="button" class="button ${item.class || ""}" data-itemindex="${index}">
          <div class="img-icon"><i class="icon ${item.icon || ""}" type="pos-gray" alt=""></i></div>
          <span style="display: inline-block; width: max-content; overflow: hidden">${item.text || ""}</span>
        </div>`;
    }

    const WidgetToolMask = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "WidgetToolMask";
      },

      init: function (parentDom, params) {
        this._params = params;
        const listHtml = params.list?.map((item, index) => buildItemHtml(item, index)).join("") || "";
        this._domStr = `
          <div class="widget-tools-mask animated fadeIn">
            <div class="widget-tools ui-panel expand">
              ${listHtml}
              <i class="close"></i><em></em>
            </div>
          </div>`;
        this._super(parentDom, params);
      },

      updateData: function (list) {
        const listHtml = list?.map((item, index) => buildItemHtml(item, index)).join("") || "";
        this._params.list = list;
        domUtils.find(this._dom, ".widget-tools").html(`${listHtml}<i class="close"></i><em></em>`);
      },

      injectComponentEvents: function () {
        const that = this;

        domUtils.on(that._dom, "click", ".button", function () {
          const list = that._params.list || [];
          const index = this.dataset.itemindex;
          const item = list[index];

          if (item?.onClick) {
            item.onClick();
          } else {
            that.listener?.onItemClicked?.(this.dataset);
          }
        });

        domUtils.on(that._dom, "click", ".close", function () {
          that.hide();
        });

        domUtils.on(that._dom, "click", function (e) {
          if (e.target.className == that._dom[0].className) {
            that.hide();
          }
        });
      },

      hide: function () {
        this._dom.hide();
      },

      show: function () {
        this._dom.show();
      },
    });
    return WidgetToolMask;
  })(DXBaseComponent);
  daxiapp.WidgetToolMask = WidgetToolMask;

  /** 景区卡片视图组件 */
  const DXScenicCardView = (function (DXBaseComponent) {
    const DXScenicCardView = DXBaseComponent.extend({
      __init__: function () {
        this._rtti = "DXScenicCardView";
      },

      init: function (parentDom, params) {
        this._params = params;
        this._domStr = `
          <div class="van-overlay overlayClass" style="z-index: 2007;"></div>
          <div class="van-popup van-popup--bottom scenic_wrapper" style="z-index: 2008;">
            <div data-jd_id="" class="scenic-box">
              <div class="scenic-top">
                <div class="scenic-img"><img src="" alt="" class="image"></div>
                <div class="scenic-name">
                  <div class="name"></div>
                  <div class="scenic-distance"></div>
                </div>
              </div>
              <div class="scenic-bottom">
                <div class="to-location">去这里</div>
                <div class="to-guide">进入导览</div>
              </div>
            </div>
          </div>`;
        this.isShow = true;
        this._super(parentDom, params);
        this._dom = parentDom.find(".scenic_wrapper");
      },

      updateData: function (data) {
        this.data = data;
        this._dom.find(".scenic-box").attr("data-jd_id", data.scenic_id);
        this._dom.find(".image").attr("src", data.thumb_url);
        this._dom.find(".name").text(data.name);
        this._dom.find(".scenic-distance").text(`距您直线${data.distance}`);
        this.show();
      },

      injectComponentEvents: function () {
        const that = this;
        this._overlay = this.parentObj.find(".overlayClass");

        // 阻止遮罩层滚动穿透
        this._overlay[0].addEventListener(
          "touchmove",
          function (event) {
            event.preventDefault();
          },
          { passive: false },
        );

        this._overlay[0].addEventListener("click", function () {
          that.hide();
        });

        this._overlay[0].addEventListener("tap", function () {
          that.hide();
        });

        domUtils.on(that._dom, "click", ".to-guide", function () {
          that.listener?.onGuideClick?.(that.data);
        });

        domUtils.on(that._dom, "click", ".to-location", function () {
          that.listener?.onTakeToThere?.(that.data);
        });
      },

      hide: function () {
        this.isShow = false;
        this._dom.hide();
        this._overlay.hide();
      },

      show: function () {
        this.isShow = true;
        this._dom.show();
        this._overlay.show();
      },
    });
    return DXScenicCardView;
  })(DXBaseComponent);
  daxiapp.DXScenicCardView = DXScenicCardView;

// ES6 Module Exports
export {
  DXBaseComponent,
  DXBtnComponent,
  DXBaseIconComponent,
  DXBaseImageComponent,
  DXComboxBtnComponent,
  DXInputComponent,
  DXBaseSearchComponent,
  DXInfoCardComponent,
  DXInfoCardComponent2,
  DXCherryCardComponent,
  DXCardsComponent,
  DXSwiperComponent,
  DXShowConfirmComponent,
  DXShowSceneListComponent,
  DXShowCityListComponent,
  DXShowPayComponent,
  DXShowQRCodeComponent,
  DXShowConfirmBottomComponent,
  DXShowTipsComponent,
  DXShowFullViewTipsComponent,
  DXTipBLEOpenComponent,
  DXTipBLEGPSOpenComponent,
  DXDetailInfoComponent2,
  DXSpotPopupComponent,
  DXDetailInfoComponent3,
  DXPayComponent,
  DXPayTypeComponent,
  DXPaysuccessComponent,
  DXDetailInfoComponent,
  DXInputCodeComponent,
  DXCourseComponent,
  DXCourseComponent2,
  DXCourseComponent3,
  DXStyleCourseComponent,
  DXMapInfoComponent,
  DXMapListComponent,
  DXRouteTransitListView2,
  DXRouteTransitListView3,
  DXDriverRouteDetailView,
  DXBusRouteDetailView,
  DXWalkRouteDetailView,
  DXNaviInfoView,
  DXNaviInfoView2,
  WidgetBtn,
  WidgetList,
  WidgetToolMask,
  DXScenicCardView,
};
