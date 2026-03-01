/**
 * XIComponent 组件系统
 * 命名空间: daxiapp.xiui
 */
(function (global) {
  "use strict";

  const daxiapp = global.DaxiApp || {};
  const domUtils = daxiapp.dom;

  let _componentId = 0;
  /** 生成唯一组件ID */
  const generateId = () => `xi_${++_componentId}`;

  /** 构建样式属性字符串 */
  const buildStyleAttr = (style) => {
    if (!style) return "";
    if (typeof style === "string") return ` style="${style}"`;
    if (typeof style === "object") {
      const str = Object.entries(style)
        .map(([k, v]) => `${k}:${v}`)
        .join(";");
      return ` style="${str}"`;
    }
    return "";
  };

  /** 防抖函数 */
  const debounce = (fn, delay = 300) => {
    let timer = null;
    return function (...args) {
      timer && clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  /** 组件基类 */
  class XIComponent {
    /**
     * @param {Object} options - 配置项
     * @param {HTMLElement|jQuery|string} [options.parent] - 父容器
     * @param {Object} [options.state] - 初始状态
     * @param {Object} [options.listener] - 事件监听器
     * @param {boolean} [options.visible=true] - 是否可见
     * @param {*} [options.data] - 初始数据
     * @param {string} [options.className] - 额外的 CSS 类名
     * @param {Object|string} [options.style] - 内联样式
     */
    constructor(options = {}) {
      this._id = generateId();
      this._options = options;
      this._state = options.state || {};
      this._data = options.data || null;
      this._listener = options.listener || {};
      this._parent = null;
      this._dom = null;
      this._isMounted = false;
      this._eventHandlers = [];
      this._pendingParent = options.parent || null;
    }

    /** 子类构造函数末尾调用此方法完成自动挂载 */
    _autoMount() {
      if (this._pendingParent) {
        this.mount(this._pendingParent);
        this._pendingParent = null;
      }
    }

    // -------------------- 生命周期钩子（子类可重写）--------------------

    /** 挂载前 */
    beforeMount() {}

    /** 挂载后 */
    mounted() {}

    /** 卸载前 */
    beforeUnmount() {}

    /** 卸载后 */
    unmounted() {}

    // -------------------- 核心方法 --------------------

    /**
     * 挂载组件到父容器
     * @param {HTMLElement|jQuery|string} parent - 父容器
     */
    mount(parent) {
      if (this._isMounted) return this;

      // 解析父容器
      if (typeof parent === "string") {
        this._parent = document.querySelector(parent);
      } else if (parent?.jquery) {
        this._parent = parent[0];
      } else {
        this._parent = parent;
      }

      if (!this._parent) {
        console.warn(`[XIComponent] Parent not found for ${this._id}`);
        return this;
      }

      // 生命周期: beforeMount
      this.beforeMount();

      // 渲染 DOM
      this._dom = this.render();
      if (this._dom) {
        // 处理 jQuery 对象
        const domEl = this._dom.jquery ? this._dom[0] : this._dom;
        this._parent.appendChild(domEl);
      }

      // 绑定事件
      this._bindEvents();

      this._isMounted = true;

      // 应用自定义样式
      if (this._options.style) {
        const domEl = this._dom.jquery ? this._dom[0] : this._dom;
        if (typeof this._options.style === "string") {
          domEl.style.cssText += this._options.style;
        } else if (typeof this._options.style === "object") {
          Object.assign(domEl.style, this._options.style);
        }
      }

      // 处理初始可见性
      if (this._options.visible === false) {
        this.hide();
      }

      // 生命周期: mounted
      this.mounted();

      return this;
    }

    /** 卸载组件 */
    unmount() {
      if (!this._isMounted) return;

      // 生命周期: beforeUnmount
      this.beforeUnmount();

      // 解绑事件
      this._unbindEvents();

      // 从 DOM 移除
      if (this._dom) {
        const domEl = this._dom.jquery ? this._dom[0] : this._dom;
        domEl.parentNode?.removeChild(domEl);
      }

      this._isMounted = false;
      this._dom = null;
      this._parent = null;

      // 生命周期: unmounted
      this.unmounted();
    }

    /**
     * 更新状态并触发重绘
     * @param {Object} newState - 新状态（会合并）
     */
    setState(newState) {
      const prevState = { ...this._state };
      this._state = { ...this._state, ...newState };

      if (this._isMounted && this.shouldUpdate(prevState, this._state)) {
        this._performUpdate();
      }
    }

    /**
     * 判断是否需要更新（子类可重写）
     * @param {Object} prevState - 旧状态
     * @param {Object} nextState - 新状态
     * @returns {boolean}
     */
    shouldUpdate(prevState, nextState) {
      return true;
    }

    /**
     * 渲染组件 DOM（子类必须实现）
     * @returns {HTMLElement}
     */
    render() {
      throw new Error("[XIComponent] render() must be implemented by subclass");
    }

    /** 执行更新 */
    _performUpdate() {
      if (!this._dom || !this._parent) return;

      const oldDom = this._dom.jquery ? this._dom[0] : this._dom;
      const newDom = this.render();
      const newDomEl = newDom.jquery ? newDom[0] : newDom;

      if (oldDom.parentNode) {
        oldDom.parentNode.replaceChild(newDomEl, oldDom);
      }

      this._dom = newDom;
      this._bindEvents();
    }

    /** 绑定事件（子类可重写 events() 方法） */
    _bindEvents() {
      if (typeof this.events !== "function") return;

      const eventConfigs = this.events();
      if (!eventConfigs) return;

      const rootEl = this._dom?.jquery ? this._dom[0] : this._dom;
      if (!rootEl) return;

      Object.entries(eventConfigs).forEach(([key, handler]) => {
        // 支持 "click .selector" 格式
        const [eventName, selector] = key.split(/\s+(.+)/);
        const boundHandler = handler.bind(this);

        if (selector) {
          // 事件委托
          const delegateHandler = (e) => {
            const target = e.target.closest(selector);
            if (target && rootEl.contains(target)) {
              boundHandler(e, target);
            }
          };
          rootEl.addEventListener(eventName, delegateHandler);
          this._eventHandlers.push({ el: rootEl, event: eventName, handler: delegateHandler });
        } else {
          rootEl.addEventListener(eventName, boundHandler);
          this._eventHandlers.push({ el: rootEl, event: eventName, handler: boundHandler });
        }
      });
    }

    /** 解绑事件 */
    _unbindEvents() {
      this._eventHandlers.forEach(({ el, event, handler }) => {
        el.removeEventListener(event, handler);
      });
      this._eventHandlers = [];
    }

    // -------------------- 通用方法 --------------------

    /** 获取根 DOM 元素 */
    getDom() {
      return this._dom;
    }

    /** 获取组件 ID */
    getId() {
      return this._id;
    }

    /** 显示组件 */
    show() {
      if (this._dom) {
        const el = this._dom.jquery ? this._dom[0] : this._dom;
        el.style.display = "";
      }
    }

    /** 隐藏组件 */
    hide() {
      if (this._dom) {
        const el = this._dom.jquery ? this._dom[0] : this._dom;
        el.style.display = "none";
      }
    }

    /** 设置样式 */
    setStyle(styleMap) {
      if (this._dom) {
        const el = this._dom.jquery ? this._dom[0] : this._dom;
        Object.assign(el.style, styleMap);
      }
    }

    /** 添加 CSS 类 */
    addClass(className) {
      if (this._dom) {
        const el = this._dom.jquery ? this._dom[0] : this._dom;
        el.classList.add(className);
      }
    }

    /** 移除 CSS 类 */
    removeClass(className) {
      if (this._dom) {
        const el = this._dom.jquery ? this._dom[0] : this._dom;
        el.classList.remove(className);
      }
    }

    /** 更新数据并重绘 */
    updateData(data) {
      this._data = data;
      if (this._isMounted) {
        this._performUpdate();
      }
    }

    /** 触发监听器回调 */
    _emit(eventName, ...args) {
      const handler = this._listener[eventName];
      if (typeof handler === "function") {
        handler(this, ...args);
      }
    }

    /** 创建 DOM 元素的辅助方法 */
    _createElement(html) {
      const template = document.createElement("template");
      template.innerHTML = html.trim();
      return template.content.firstChild;
    }
  }

  /** 轮播图组件 */
  class XICarousel extends XIComponent {
    constructor(options) {
      super(options);
      this._currentIndex = 0;
      this._autoPlayTimer = null;
      const config = options.config || {};
      this._autoPlayInterval = config.interval || options.interval || 4000;
      this._autoPlay = (config.autoPlay ?? options.autoPlay) !== false;
      this._autoMount();
    }

    render() {
      const data = this._data || [];
      const slidesHtml = data
        .map(
          (item, idx) => `
        <div class="xi-carousel-slide ${idx === this._currentIndex ? "active" : ""}" data-index="${idx}">
          <img data-src="${item.imgurl || item.imageUrl || ""}" alt="${item.title || ""}" data-id="${item.id || ""}" class="lazy">
        </div>
      `,
        )
        .join("");

      const dotsHtml = data
        .map(
          (_, idx) => `
        <div class="xi-carousel-dot ${idx === this._currentIndex ? "active" : ""}" 
             style="width: ${idx === this._currentIndex ? "16px" : "6px"}" 
             data-index="${idx}"></div>
      `,
        )
        .join("");

      const html = `
        <div class="xi-carousel ${this._options.className || ""}">
          <style>
            .xi-carousel { position: relative; height: 220px; width: 100%; overflow: hidden; }
            .xi-carousel-slide { position: absolute; inset: 0; opacity: 0; transition: opacity 0.7s ease-in-out; }
            .xi-carousel-slide.active { opacity: 1; }
            .xi-carousel-slide img { width: 100%; height: 100%; object-fit: cover; }
            .xi-carousel-dots { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; }
            .xi-carousel-dot { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.5); transition: all 0.3s ease; cursor: pointer; }
            .xi-carousel-dot.active { background: #fff; }
          </style>
          <div class="xi-carousel-slides">${slidesHtml}</div>
          <div class="xi-carousel-dots">${dotsHtml}</div>
        </div>
      `;

      return this._createElement(html);
    }

    events() {
      return {
        "click .xi-carousel-dot": this._onDotClick,
        "click .xi-carousel-slide": this._onSlideClick,
      };
    }

    _onDotClick(e, target) {
      const index = parseInt(target.dataset.index);
      this.goToSlide(index);
    }

    _onSlideClick(e, target) {
      const slide = target.closest(".xi-carousel-slide");
      const index = parseInt(slide?.dataset.index);
      const item = this._data?.[index];
      if (item) {
        this._emit("onSlideClick", item, index);
      }
    }

    goToSlide(index) {
      if (!this._data?.length) return;

      this._currentIndex = index;

      const slides = this._dom.querySelectorAll(".xi-carousel-slide");
      const dots = this._dom.querySelectorAll(".xi-carousel-dot");

      slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === index);
      });

      dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
        dot.style.width = i === index ? "16px" : "6px";
      });
    }

    _startAutoPlay() {
      if (!this._autoPlay || !this._data?.length) return;

      this._stopAutoPlay();
      this._autoPlayTimer = setInterval(() => {
        const nextIndex = (this._currentIndex + 1) % this._data.length;
        this.goToSlide(nextIndex);
      }, this._autoPlayInterval);
    }

    _stopAutoPlay() {
      if (this._autoPlayTimer) {
        clearInterval(this._autoPlayTimer);
        this._autoPlayTimer = null;
      }
    }

    mounted() {
      this._startAutoPlay();
    }

    beforeUnmount() {
      this._stopAutoPlay();
    }

    /** 暂停自动播放 */
    pause() {
      this._stopAutoPlay();
    }

    /** 恢复自动播放 */
    resume() {
      this._startAutoPlay();
    }
  }

  /** 金刚区组件 */
  class XIKingkong extends XIComponent {
    constructor(options) {
      super(options);
      const config = options.config || {};
      this._columns = config.columns || options.columns || 5;
      this._buildImageUrl = typeof options.buildImageUrl === "function" ? options.buildImageUrl : (path) => path;
      this._autoMount();
    }

    render() {
      const data = this._data || [];
      const themeColor = { bg: "rgba(var(--dxmap-themeColor-rgb), 0.1)", color: "var(--themeColor)" };

      const itemsHtml = data
        .map((item) => {
          const imgIcon = item.imageIcon || item.imageicon;
          const iconUrl = this._buildImageUrl(imgIcon ? `/pages/images/${imgIcon}` : item.icon || "");
          return `
          <div class="xi-kingkong-item" data-name="${item.name || ""}" data-command='${JSON.stringify(item)}'>
            <div class="xi-kingkong-icon" style="background: ${themeColor.bg}; color: ${themeColor.color};">
              ${iconUrl ? `<img data-src="${iconUrl}" alt="${item.name || ""}" class="lazy">` : `<i class="iconfont ${item.iconClass || ""}"></i>`}
            </div>
            <span class="xi-kingkong-text">${item.name || ""}</span>
          </div>
        `;
        })
        .join("");

      const html = `
        <div class="xi-kingkong ${this._options.className || ""}">
          <style>
            .xi-kingkong { background: #fff; position: relative; z-index: 10; padding: 20px 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .xi-kingkong-grid { display: grid; grid-template-columns: repeat(${this._columns}, 1fr); gap: 12px 8px; }
            .xi-kingkong-item { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
            .xi-kingkong-icon { width: 44px; height: 44px; border-radius: var(--rounded-base, 8px); display: flex; align-items: center; justify-content: center; font-size: 20px; transition: transform 0.2s; }
            .xi-kingkong-icon img { width: 24px; height: 24px; }
            .xi-kingkong-item:active .xi-kingkong-icon { transform: scale(0.95); }
            .xi-kingkong-text { font-size: 12px; color: #666; font-weight: 500; text-align: center; }
          </style>
          <div class="xi-kingkong-grid">${itemsHtml}</div>
        </div>
      `;

      return this._createElement(html);
    }

    events() {
      return {
        "click .xi-kingkong-item": this._onItemClick,
      };
    }

    _onItemClick(e, target) {
      const name = target.dataset.name;
      let command = null;
      try {
        command = JSON.parse(target.dataset.command || "{}");
      } catch (err) {
        command = {};
      }
      this._emit("onItemClick", { name, ...command });
    }

    /** 设置图片URL构建函数 */
    setImageUrlBuilder(fn) {
      this._buildImageUrl = fn;
    }
  }

  /** 热门景点列表组件 */
  class XISpotList extends XIComponent {
    constructor(options) {
      super(options);
      const config = options.config || {};
      this._title = config.title || options.title || "";
      this._maxCount = config.maxCount || options.maxCount || 10;
      this._buildImageUrl = typeof options.buildImageUrl === "function" ? options.buildImageUrl : (path) => path;
      this._autoMount();
    }

    render() {
      let data = this._data || [];

      // 兼容多种数据格式
      if (data.list) {
        // 旧格式：data.list[].list[]
        const allSpots = [];
        data.list.forEach((section) => {
          if (section?.list?.length) {
            allSpots.push(...section.list);
          }
        });
        data = allSpots;
      } else if (Array.isArray(data) && data[0]?.spots) {
        // 新格式：data[].spots[]
        const allSpots = [];
        data.forEach((section) => {
          if (section?.spots?.length) {
            section.spots.forEach((spot) => {
              spot.category = section.category;
            });
            allSpots.push(...section.spots);
          }
        });
        data = allSpots;
      }

      // 限制数量
      const displayData = data.slice(0, this._maxCount);

      const itemsHtml = displayData
        .map((spot) => {
          const imgUrl = this._buildImageUrl(spot.imgurl || spot.imageUrl || "");
          return `
          <div class="xi-spot-item" data-id="${spot.id || ""}" data-exhibitid="${spot.exhibitId || ""}">
            <img data-src="${imgUrl}" alt="${spot.name || ""}" class="lazy">
            <div class="xi-spot-overlay"></div>
            <div class="xi-spot-content">
              <div>
                <h4>${spot.name || ""}</h4>
                <h3>${spot.category || ""}</h3>
              </div>
            </div>
            <div class="xi-spot-arrow"><i class="iconfont icon-navi"></i></div>
          </div>
        `;
        })
        .join("");

      const html = `
        <div class="xi-spot-list ${this._options.className || ""}">
          <style>
            .xi-spot-list { padding: 0 16px 20px; }
            .xi-spot-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 16px; padding-left: 4px; }
            .xi-spot-items { display: flex; flex-direction: column; gap: 12px; }
            .xi-spot-item { position: relative; height: 100px; border-radius: var(--rounded-base, 8px); overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; }
            .xi-spot-item img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
            .xi-spot-item:active img { transform: scale(1.05); }
            .xi-spot-overlay { position: absolute; inset: 0; background: linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3), transparent); }
            .xi-spot-content { position: absolute; inset: 0; padding: 16px; display: flex; align-items: center; }
            .xi-spot-content h4 { color: #fff; font-size: 16px; font-weight: bold; }
            .xi-spot-content h3 { color: #d8d8d8ff; font-size: 12px; font-weight: bold; }
            .xi-spot-arrow { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; }
          </style>
          ${this._title || this._options.title ? `<h3 class="xi-spot-title">${this._title || this._options.title}</h3>` : ""}
          <div class="xi-spot-items">${itemsHtml}</div>
        </div>
      `;

      return this._createElement(html);
    }

    events() {
      return {
        "click .xi-spot-item": this._onSpotClick,
      };
    }

    _onSpotClick(e, target) {
      const id = target.dataset.id;
      const exhibitId = target.dataset.exhibitid;
      this._emit("onSpotClick", { id, exhibitId });
    }

    /** 设置图片URL构建函数 */
    setImageUrlBuilder(fn) {
      this._buildImageUrl = fn;
    }
  }

  /** 底部导航栏组件 */
  class XITabBar extends XIComponent {
    constructor(options) {
      super(options);
      this._activeId = options.activeId ?? 0;
      this._activeName = options.activeName || null;
      this._autoMount();
    }

    render() {
      const data = this._data || [];

      const tabsHtml = data
        .map((tab, index) => {
          const id = tab.id ?? index;
          const isActive = this._activeName ? tab.name === this._activeName : id === this._activeId;
          const activeClass = isActive ? "on" : "";
          return `
          <li class="menuTap ${activeClass}" data-id="${id}" data-index="${index}" data-name="${tab.name || ""}">
            <div><i class="${tab.icon || ""} ${activeClass}"></i></div>
            <span>${tab.name || ""}</span>
          </li>
        `;
        })
        .join("");

      const html = `
        <div class="footerbar ${this._options.className || ""}">
          <ul>${tabsHtml}</ul>
        </div>
      `;

      return this._createElement(html);
    }

    events() {
      return {
        "click .menuTap": this._onTabClick,
      };
    }

    _onTabClick(e, target) {
      const li = target.closest(".menuTap");
      if (!li) return;

      const id = parseInt(li.dataset.id);
      const index = parseInt(li.dataset.index);
      const name = li.dataset.name;

      // 更新激活状态
      this.setActiveById(id);

      this._emit("onTabClick", { id, index, name });
    }

    /** 根据 ID 设置选中状态 */
    setActiveById(id) {
      this._activeId = id;
      this._activeName = null;

      const items = this._dom?.querySelectorAll(".menuTap");
      items?.forEach((item) => {
        const itemId = parseInt(item.dataset.id);
        const isActive = itemId === id;
        item.classList.toggle("on", isActive);
        // 同时更新图标的 on 类
        const icon = item.querySelector("i");
        icon?.classList.toggle("on", isActive);
      });
    }

    /** 根据索引设置选中状态 */
    setActiveByIndex(index) {
      const items = this._dom?.querySelectorAll(".menuTap");
      items?.forEach((item, i) => {
        const isActive = i === index;
        item.classList.toggle("on", isActive);
        const icon = item.querySelector("i");
        icon?.classList.toggle("on", isActive);
      });

      this._activeId = index;
    }

    /** 根据名称设置选中状态 */
    setActiveByName(name) {
      this._activeName = name;

      const items = this._dom?.querySelectorAll(".menuTap");
      items?.forEach((item) => {
        const isActive = item.dataset.name === name;
        item.classList.toggle("on", isActive);
        const icon = item.querySelector("i");
        icon?.classList.toggle("on", isActive);
      });
    }
  }

  /** 功能块网格组件 */
  class XIFeatureGrid extends XIComponent {
    constructor(options) {
      super(options);
      this._autoMount();
    }

    render() {
      const data = this._data || {};
      const { main = {}, subs = [] } = data;

      const subsHtml = subs
        .map(
          (sub, index) => `
        <div class="xi-feature-sub ${sub.className || ""}" data-action="${typeof sub.action === "string" ? sub.action : ""}" data-index="${index}">
          <div>
            <h4>${sub.title || ""}</h4>
            <p>${sub.description || sub.desc || ""}</p>
          </div>
          <div class="xi-feature-sub-icon"><i class="iconfont ${sub.icon || ""}"></i></div>
        </div>
      `,
        )
        .join("");

      const html = `
        <div class="xi-feature-grid ${this._options.className || ""}">
          <style>
            .xi-feature-grid { padding: 20px 16px; }
            .xi-feature-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 16px; padding-left: 4px; }
            .xi-feature-container { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; height: 180px; }
            .xi-feature-main { background: linear-gradient(135deg, var(--themeColor), var(--dxmap-themeColor)); padding: 16px; border-radius: var(--rounded-base, 8px); position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 12px rgba(var(--dxmap-themeColor-rgb), 0.3); cursor: pointer; }
            .xi-feature-main-icon { width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; backdrop-filter: blur(4px); margin-bottom: 8px; }
            .xi-feature-main h4 { color: #fff; font-size: 18px; font-weight: bold; }
            .xi-feature-main p { color: rgba(255,255,255,0.8); font-size: 12px; margin-top: 4px; }
            .xi-feature-main .bg-icon { position: absolute; right: -16px; bottom: -16px; font-size: 96px; color: rgba(255,255,255,0.15); transform: rotate(12deg); }
            .xi-feature-sub-grid { display: grid; grid-template-rows: 1fr 1fr; gap: 12px; }
            .xi-feature-sub { background: #fff; padding: 12px; border-radius: var(--rounded-base, 8px); display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor: pointer; transition: box-shadow 0.2s; border: 1px solid rgba(var(--dxmap-themeColor-rgb), 0.3); }
            .xi-feature-sub:active { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .xi-feature-sub h4 { font-size: 14px; font-weight: bold; color: #333; }
            .xi-feature-sub p { font-size: 11px; margin-top: 2px; color: var(--themeColor); }
            .xi-feature-sub-icon { padding: 8px; border-radius: var(--rounded-base, 8px); font-size: 18px; background: rgba(var(--dxmap-themeColor-rgb), 0.1); color: var(--themeColor); }
          </style>
          ${this._options.title ? `<h3 class="xi-feature-title">${this._options.title}</h3>` : ""}
          <div class="xi-feature-container">
            <div class="xi-feature-main" data-action="${main?.action || ""}">
              <div>
                <div class="xi-feature-main-icon"><i class="iconfont ${main?.icon || ""}"></i></div>
                <h4>${main?.title || ""}</h4>
                <p>${main?.description || main?.desc || ""}</p>
              </div>
              <span class="bg-icon iconfont ${main?.icon || ""}"></span>
            </div>
            <div class="xi-feature-sub-grid">${subsHtml}</div>
          </div>
        </div>
      `;

      return this._createElement(html);
    }

    events() {
      return {
        "click .xi-feature-main": this._onMainClick,
        "click .xi-feature-sub": this._onSubClick,
      };
    }

    _onMainClick(e, target) {
      const action = target.dataset.action;
      this._emit("onMainClick", { action });
    }

    _onSubClick(e, target) {
      const action = target.dataset.action;
      const index = parseInt(target.dataset.index, 10);
      const sub = (this._data?.subs || [])[index];
      this._emit("onSubClick", { action, sub, index });
    }
  }

  /** 底部弹窗组件 */
  class XIPopup extends XIComponent {
    constructor(options) {
      super(options);
      this._title = options.title || "";
      this._isVisible = false;
      this._autoMount();
    }

    render() {
      const html = `
        <div class="xi-popup-overlay ${this._options.className || ""}">
          <style>
            .xi-popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0); z-index: 1000; visibility: hidden; transition: background 0.3s ease, visibility 0.3s ease; }
            .xi-popup-overlay.active { background: rgba(0,0,0,0.5); visibility: visible; }
            .xi-popup-container { position: fixed; left: 0; right: 0; bottom: 0; background: #fff; border-radius: 16px 16px 0 0; padding: 20px 20px calc(20px + env(safe-area-inset-bottom)); z-index: 1001; transform: translateY(100%); transition: transform 0.3s ease; max-height: 80vh; overflow-y: auto; }
            .xi-popup-overlay.active .xi-popup-container { transform: translateY(0); }
            .xi-popup-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
            .xi-popup-title { font-size: 18px; font-weight: 600; color: #333; }
            .xi-popup-close { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: none; background: #f3f4f6; border-radius: 50%; cursor: pointer; }
            .xi-popup-close svg { width: 14px; height: 14px; color: #666; }
            .xi-popup-content { }
          </style>
          <div class="xi-popup-container">
            <div class="xi-popup-header">
              <span class="xi-popup-title">${this._title}</span>
              <button class="xi-popup-close">
                <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                  <path d="M563.8 512l262.5-312.9c4.4-5.2 0.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L512 442.2 295.9 191.7c-3-3.6-7.5-5.7-12.3-5.7H203.8c-6.8 0-10.5 7.9-6.1 13.1L460.2 512 197.7 824.9c-4.4 5.2-0.7 13.1 6.1 13.1h79.8c4.7 0 9.2-2.1 12.3-5.7L512 581.8l216.1 250.5c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z" fill="currentColor"></path>
                </svg>
              </button>
            </div>
            <div class="xi-popup-content"></div>
          </div>
        </div>
      `;

      return this._createElement(html);
    }

    events() {
      return {
        "click .xi-popup-close": this._onClose,
        click: this._onOverlayClick,
      };
    }

    _onClose() {
      this.close();
    }

    _onOverlayClick(e) {
      if (e.target.classList.contains("xi-popup-overlay")) {
        this.close();
      }
    }

    /** 打开弹窗 */
    open() {
      this._isVisible = true;
      this._dom?.classList.add("active");
      document.body.style.overflow = "hidden";
      this._emit("onOpen");
    }

    /** 关闭弹窗 */
    close() {
      this._isVisible = false;
      this._dom?.classList.remove("active");
      document.body.style.overflow = "";
      this._emit("onClose");
    }

    /** 设置内容 */
    setContent(htmlOrElement) {
      const contentEl = this._dom?.querySelector(".xi-popup-content");
      if (!contentEl) return;

      if (typeof htmlOrElement === "string") {
        contentEl.innerHTML = htmlOrElement;
      } else if (htmlOrElement instanceof Element) {
        contentEl.innerHTML = "";
        contentEl.appendChild(htmlOrElement);
      }
    }

    /** 设置标题 */
    setTitle(title) {
      this._title = title;
      const titleEl = this._dom?.querySelector(".xi-popup-title");
      if (titleEl) titleEl.textContent = title;
    }

    /** 获取内容容器 */
    getContentElement() {
      return this._dom?.querySelector(".xi-popup-content");
    }
  }

  /** 单元格组件 */
  class XICell extends XIComponent {
    constructor(options) {
      super(options);
      this._title = options.title || "";
      this._value = options.value || "";
      this._icon = options.icon || "";
      this._arrow = options.arrow !== false;
      this._action = options.action || "";
      this._autoMount();
    }

    render() {
      const arrowSvg = this._arrow
        ? `<svg class="xi-cell-arrow" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path d="M338.752 104.704a64 64 0 0 0 0 90.496L655.552 512l-316.8 316.8a64 64 0 0 0 90.496 90.496l362.048-362.048a64 64 0 0 0 0-90.496L429.248 104.704a64 64 0 0 0-90.496 0z" fill="#999"></path>
          </svg>`
        : "";

      const iconHtml = this._icon ? `<div class="xi-cell-icon">${this._icon}</div>` : "";

      const html = `
        <div class="xi-cell ${this._options.className || ""}" data-action="${this._action}">
          <style>
            .xi-cell { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: background-color 0.2s; background: #fff; }
            .xi-cell:last-child { border-bottom: none; }
            .xi-cell:active { background-color: #f5f5f5; }
            .xi-cell-left { display: flex; align-items: center; gap: 12px; flex: 1; }
            .xi-cell-icon { width: 20px; height: 20px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
            .xi-cell-icon svg { width: 100%; height: 100%; }
            .xi-cell-title { font-size: 15px; color: #333; }
            .xi-cell-right { display: flex; align-items: center; gap: 8px; }
            .xi-cell-value { font-size: 14px; color: #999; }
            .xi-cell-arrow { width: 16px; height: 16px; color: #999; }
          </style>
          <div class="xi-cell-left">
            ${iconHtml}
            <span class="xi-cell-title">${this._title}</span>
          </div>
          <div class="xi-cell-right">
            <span class="xi-cell-value">${this._value}</span>
            ${arrowSvg}
          </div>
        </div>
      `;

      return this._createElement(html);
    }

    events() {
      return {
        click: this._onClick,
      };
    }

    _onClick() {
      this._emit("onClick", { action: this._action, title: this._title, value: this._value });
    }

    setValue(value) {
      this._value = value;
      const valueEl = this._dom?.querySelector(".xi-cell-value");
      if (valueEl) valueEl.textContent = value;
    }
  }

  /** 单元格组组件 */
  class XICellGroup extends XIComponent {
    constructor(options) {
      super(options);
      this._title = options.title || "";
      this._cells = [];
      this._autoMount();
    }

    render() {
      const titleHtml = this._title ? `<div class="xi-cell-group-title">${this._title}</div>` : "";

      const html = `
        <div class="xi-cell-group ${this._options.className || ""}">
          <style>
            .xi-cell-group { background: #fff; margin: 12px; border-radius: var(--rounded-base, 8px); overflow: hidden; }
            .xi-cell-group-title { font-size: 14px; color: #666; padding: 12px 16px 8px; background: #f9fafb; }
            .xi-cell-group-content { }
          </style>
          ${titleHtml}
          <div class="xi-cell-group-content"></div>
        </div>
      `;

      return this._createElement(html);
    }

    mounted() {
      // 如果 data 有数据，自动创建子 Cell
      const data = this._data || [];
      data.forEach((item) => this.addCell(item));
    }

    /** 添加单元格 */
    addCell(options) {
      const contentEl = this._dom?.querySelector(".xi-cell-group-content");
      if (!contentEl) return null;

      const cell = new XICell({
        ...options,
        parent: contentEl,
        listener: {
          onClick: (sender, data) => this._emit("onCellClick", data),
        },
      });

      this._cells.push(cell);
      return cell;
    }

    /** 获取所有单元格 */
    getCells() {
      return this._cells;
    }

    beforeUnmount() {
      this._cells.forEach((cell) => cell.unmount());
      this._cells = [];
    }
  }

  /** POI 分类列表组件 */
  class XIPoiCategoryList extends XIComponent {
    constructor(options) {
      super(options);
      const config = options.config || {};
      this._title = config.title || options.title || "";
      this._autoMount();
    }

    render() {
      const data = this._data || [];

      const categoriesHtml = data
        .map((category) => {
          // 兼容新格式 items[] 和旧格式 list[]
          const items = category.items || category.list || [];
          if (!category.title || !items.length) return "";

          const itemsHtml = items
            .map(
              (item) => `
              <div class="xi-poi-item" data-keyword="${item.keyword || item.name || ""}">
                <span class="xi-poi-item-name">${item.name || ""}</span>
              </div>
            `,
            )
            .join("");

          return `
            <div class="xi-poi-category">
              <div class="xi-poi-category-title">${category.title}</div>
              <div class="xi-poi-category-content">${itemsHtml}</div>
            </div>
          `;
        })
        .join("");

      const html = `
        <div class="xi-poi-category-list ${this._options.className || ""}">
          <style>
            .xi-poi-category-list { background: #fff; padding: 0 16px; }
            .xi-poi-category { border-bottom: 1px solid #f0f0f0; padding: 16px 0; }
            .xi-poi-category:last-child { border-bottom: none; }
            .xi-poi-category-title { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 12px; }
            .xi-poi-category-content { display: flex; flex-wrap: wrap; gap: 8px; }
            .xi-poi-item { display: inline-block; padding: 8px 12px; background: #f9f9f9; border-radius: var(--rounded-base, 8px); transition: all 0.2s; cursor: pointer; white-space: nowrap; }
            .xi-poi-item:active { background-color: rgba(var(--dxmap-themeColor-rgb), 0.1); }
            .xi-poi-item-name { font-size: 14px; color: #333; }
          </style>
          ${categoriesHtml}
        </div>
      `;

      return this._createElement(html);
    }

    events() {
      return {
        "click .xi-poi-item": this._onItemClick,
      };
    }

    _onItemClick(e, target) {
      const keyword = target.dataset.keyword;
      if (keyword) {
        this._emit("onItemClick", { keyword });
      }
    }
  }

  // ============================================================
  // 导出到全局命名空间
  // ============================================================

  const xiui = {
    XIComponent: XIComponent,
    XICarousel: XICarousel,
    XIKingkong: XIKingkong,
    XISpotList: XISpotList,
    XITabBar: XITabBar,
    XIFeatureGrid: XIFeatureGrid,
    XIPopup: XIPopup,
    XICell: XICell,
    XICellGroup: XICellGroup,
    XIPoiCategoryList: XIPoiCategoryList,
    utils: {
      generateId: generateId,
      buildStyleAttr: buildStyleAttr,
      debounce: debounce,
    },
  };

  // 挂载到 daxiapp 命名空间
  daxiapp.xiui = xiui;

  // 同时挂载到 global 方便直接访问
  global.XIComponent = XIComponent;
  global.xiui = xiui;
})(window);
