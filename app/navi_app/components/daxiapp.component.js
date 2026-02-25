(function (global) {
  var daxiapp = (global["DaxiApp"] = global["DaxiApp"] || {});
  var domUtils = daxiapp["dom"];
  var dxUtils = daxiapp["utils"];

  /**
   * 从DOM元素获取POI基础数据（公共方法）
   * @param {HTMLElement} ele - DOM元素
   * @returns {Object} POI基础数据对象
   */
  const _getPoiData = (ele) => {
    const $ele = $(ele);
    const getBdid = global.DxApp._mapView._mapSDK._getCurrentBuilding;
    const poiId = String($ele.data("poiid") || $ele.data("poi") || $ele.attr("data-id") || "");
    const id = String($ele.attr("data-id") || poiId || "");
    return {
      id: id,
      poiId: poiId,
      name: String($ele.data("name") || $ele.attr("data-name") || ""),
      address: String($ele.data("address") || $ele.attr("data-address") || ""),
      floorId: String($ele.data("floorid") || $ele.attr("data-floorid") || ""),
      lon: parseFloat($ele.data("lon") || $ele.attr("data-lon") || 0),
      lat: parseFloat($ele.data("lat") || $ele.attr("data-lat") || 0),
      bdid: String($ele.data("bdid") || getBdid() || ""),
      code: String($ele.data("code") || ""),
      barcode: String($ele.data("barcode") || ""),
      category: $ele.data("category"),
      detailed: $ele.data("detailed") || 0,
    };
  };

  /**
   * 创建列表项 DOM（公共方法）
   * @param {string|HTMLElement|HTMLElement[]} childDom - 子元素（HTML字符串、DOM元素或元素数组）
   * @param {Object} [events] - 事件监听器对象 { eventName: handler }
   * @param {string} [className] - 额外的 CSS 类名
   * @param {string} [id] - 元素 ID
   * @returns {HTMLLIElement} 创建的 li 元素
   */
  const _createListItem = function (childDom, events, className, id) {
    const itemDom = document.createElement("li");
    itemDom.setAttribute("class", className ? `item ${className}` : "item");
    id && itemDom.setAttribute("id", id);
    if (events) {
      for (const eName in events) {
        itemDom.addEventListener(eName, events[eName]);
      }
    }
    if (typeof childDom == "string") {
      itemDom.innerHTML = childDom;
    } else if (Array.isArray(childDom)) {
      childDom.forEach((item) => itemDom.appendChild(item));
    } else {
      itemDom.appendChild(childDom);
    }
    return itemDom;
  };

  /**
   * 获取多语言文本（公共方法）
   * @param {string} key - 语言键
   * @param {string} defaultVal - 默认值
   * @returns {string} 多语言文本
   */
  const _getLang = (key, defaultVal) => window.langData?.[key] || defaultVal;

  /**
   * 更新最后一个可见项的样式标记（公共方法）
   * @param {HTMLCollection|NodeList} childrens - 子元素集合
   */
  const _updateLastShowClass = function (childrens) {
    for (let i = childrens.length - 1; i >= 0; i--) {
      const display = childrens[i].style.display;
      if (display == "" || display == "block") {
        $(childrens[i]).addClass("last_show").siblings().removeClass("last_show");
        return;
      }
    }
  };

  /**
   * 获取搜索输入框的关键字（公共方法）
   * @param {jQuery|HTMLElement} container - 包含输入框的容器元素
   * @param {string} [selector] - 输入框选择器，默认尝试 .input_text 和 .dx_input
   * @returns {string} 输入的关键字
   */
  const _getKeyword = (container, selector) => {
    let input_text;
    if (selector) {
      input_text = domUtils.find(container, selector);
    } else {
      // 兼容多种常见的输入框选择器
      input_text = domUtils.find(container, ".input_text");
      if (!input_text || !input_text.length) {
        input_text = domUtils.find(container, ".dx_input");
      }
      if (!input_text || !input_text.length) {
        input_text = domUtils.find(container, "input");
      }
    }
    const val = domUtils.val(input_text, "");
    return typeof val === "string" ? val.trim() : "";
  };

  /**
   * 更新路线起终点UI（公共方法）
   * @param {jQuery|HTMLElement} $container - 路线选择器容器
   * @param {string} posType - 位置类型 "startpos" | "endpos"
   * @param {Object} info - 位置信息对象 { lon, lat, name, text, address, floorName }
   */
  const _updateRoutePosUI = ($container, posType, info) => {
    const selector = `.${posType}-info`;
    const hasValidPos = info && (info.lon || info.lat);

    domUtils.find($container, `${selector} .empty_pos`)[hasValidPos ? "hide" : "show"]();
    domUtils.find($container, `${selector} .posInfo`)[hasValidPos ? "show" : "hide"]();

    if (hasValidPos) {
      domUtils.find($container, `${selector} .name`).text(info.name || info.text || "");
      domUtils.find($container, `${selector} .address`).text(info.address || "");
      if (posType == "startpos") {
        domUtils.find($container, `${selector} .floor-name`).text(info.floorName || "");
      }
    }
  };

  /**
   * 通用按钮组件
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXButton = function (app, parentObject) {
    const that = this;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom = `<span class="dx_button" style="padding: 6px;background: #fff;border-radius: 6px;display: inline-block;color: #797979;"></span>`;
      if (that.parentObj) {
        domUtils.append(that.parentObj, dom);
        that._dom = domUtils.find(that.parentObj, ".dx_button");
      } else {
        that._dom = domUtils.geneDom(dom);
      }
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onClicked?.(that, that.data);
      });
    };

    that.updateData = function (content) {
      that._dom.html(content);
    };

    that.setData = function (data) {
      that.data = data;
      for (const key in data) {
        that._dom.data(key, data[key]);
        if (key == "name") {
          that._dom.text(data[key]);
        }
      }
    };

    that.getParent = function () {
      that.parentObj ??= that._dom.parent();
      return that.parentObj;
    };

    that.getData = function () {
      return that.data;
    };

    that.setStyle = function (styleObj) {
      that._dom.css(styleObj);
    };

    that.addClassName = function (className) {
      that._dom.addClass(className);
    };

    that.show = function () {
      that._dom.show();
    };

    that.hide = function () {
      that._dom.hide();
    };

    return that;
  };
  daxiapp["DXButton"] = daxiapp["DXButtonComponent"] = DXButton; // ‘DXButtonComponent’为向后兼容别名

  /**
   * 图片按钮组件
   * @param {HTMLElement} parentObject - 父容器元素
   * @param {Object} options - 配置项 (imageUrl, text, text-style)
   */
  const DXImageButton = function (parentObject, options) {
    const that = this;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const imageUrl = options?.imageUrl || "";
      const textHtml = options?.text ? `<span class="text ${options["text-style"] || ""}">${options.text}</span>` : "";
      const dom = `<span class="dx_image_btn" style="line-height: 1.5;background: #fff;border-radius: 6px;display: inline-flex;color: #797979;align-items:center;justify-content:center;"><img src="${imageUrl}" class="dx_image_img" style="width:100%;">${textHtml}</span>`;
      if (that.parentObj) {
        domUtils.append(that.parentObj, dom);
        that._dom = domUtils.find(that.parentObj, ".dx_image_btn");
      } else {
        that._dom = domUtils.geneDom(dom);
      }
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onClicked?.(that);
      });
    };

    that.addClassName = function (className) {
      that._dom.addClass(className);
    };

    that.triggerEvent = function (eventName) {
      domUtils.triggerEvent(that._dom, eventName);
    };

    that.getParent = function () {
      that.parentObj ??= that._dom.parent();
      return that.parentObj;
    };

    that.updateData = function (url) {
      if (that.url != url) {
        const dxImageImg = domUtils.find(that._dom, ".dx_image_img");
        dxImageImg.attr("src", url);
        that.url = url;
      }
    };

    that.setImageStyle = function (styleObj) {
      styleObj && that._dom.find("img").css(styleObj);
    };

    that.setStyle = function (styleObj, childStyle, textStyle) {
      styleObj && that._dom.css(styleObj);
      childStyle && that._dom.find("img").css(childStyle);
      textStyle && that._dom.find(".text").css(textStyle);
    };

    that.show = function () {
      that._dom.show();
    };

    that.hide = function () {
      that._dom.hide();
    };

    return that;
  };
  daxiapp["DXImageButton"] = daxiapp["DXImageBtnComponent"] = DXImageButton; // 'DXImageBtnComponent'为向后兼容别名

  /**
   * 图标按钮组件
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXIconButton = function (parentObject) {
    const that = this;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom = `<span class="icon_button_control" style="background-color: rgb(255, 255, 255); border-radius: 4px; padding: 4px; display:inline-block"></span>`;
      if (that.parentObj) {
        domUtils.append(that.parentObj, dom);
        that._dom = domUtils.find(that.parentObj, ".icon_button_control");
      } else {
        that._dom = domUtils.geneDom(dom);
      }
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onClicked?.(that);
      });
    };

    that.getParent = function () {
      that.parentObj ??= that._dom.parent();
      return that.parentObj;
    };

    that.updateIcon = function (iconName) {
      iconName && that._dom.attr("class", `icon_button_control ${iconName}`);
    };

    that.setStyle = function (styleObj) {
      that._dom.css(styleObj);
    };

    that.addClassName = that.addClass = function (className) {
      that._dom.addClass(className);
    };

    that.removeClass = function (className) {
      that._dom.removeClass(className);
    };

    that.show = function () {
      that._dom.show();
    };

    that.hide = function () {
      that._dom.hide();
    };

    return that;
  };
  daxiapp["DXIconButton"] = daxiapp["DXIconBtnComponent"] = DXIconButton; // 'DXIconBtnComponent'为向后兼容别名

  /**
   * 图标文字按钮组件
   * @param {HTMLElement} parentObject - 父容器元素
   * @param {Object} options - 配置项 (style, iconName, text)
   */
  const DXIconTextButton = function (parentObject, options) {
    const that = this;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom = `<span class="dx_iconText_btn" style="${options?.style || ""}"><i class="${options?.iconName || ""}"></i><span class="text">${
        options?.text || ""
      }</span></span>`;
      if (that.parentObj) {
        domUtils.append(that.parentObj, dom);
        that._dom = domUtils.find(that.parentObj, ".dx_iconText_btn");
      } else {
        that._dom = domUtils.geneDom(dom);
      }
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onClicked?.(that);
      });
    };

    that.getParent = function () {
      that.parentObj ??= that._dom.parent();
      return that.parentObj;
    };

    that.updateIcon = function (iconName) {
      iconName && domUtils.find(that._dom, "i").attr("class", iconName);
    };

    that.updateText = function (text) {
      text && domUtils.find(that._dom, ".text").text(text);
    };

    that.setStyle = function (styleObj) {
      that._dom.css(styleObj);
    };

    that.addClass = function (className) {
      that._dom.addClass(className);
    };

    that.removeClass = function (className) {
      that._dom.removeClass(className);
    };

    that.show = function () {
      that._dom.show();
    };

    that.hide = function () {
      that._dom.hide();
    };

    return that;
  };
  daxiapp["DXIconTextButton"] = daxiapp["DXIconTextBtnComponent"] = DXIconTextButton; // 'DXIconTextBtnComponent'为向后兼容别名

  /**
   * 列表容器组件
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXList = function (parentObject) {
    const that = this;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener || {};
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom = `<div class="list_component_container" style="display:none;padding:2px;background-color:#fff;border-radius:var(--rounded-base);"><ul class="list" style=""></ul></div>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".list_component_container");
      that._listDom = domUtils.find(that.parentObj, ".list");
    };

    that.injectComponentEvents = function () {};

    that.setStyle = function (styleObj) {
      that._dom.css(styleObj);
    };

    that.addClassName = function (className) {
      that._dom.addClass(className);
    };

    that.show = function () {
      that._dom.show();
    };

    that.hide = function () {
      that._dom.hide();
    };

    that.appendItem = function (childDom, events, className, id) {
      const itemDom = _createListItem(childDom, events, className, id);
      that._listDom.append(itemDom);
    };

    that.itemInsertBefore = function (dom, childDom, events, className, id) {
      const itemDom = _createListItem(childDom, events, className, id);
      const beforeDom = typeof dom == "number" ? that._listDom.children()[dom] : dom;
      that._listDom[0].insertBefore(beforeDom, itemDom);
    };

    that.removeChildById = function (id) {
      that._listDom.find(`#${id}`).remove();
    };

    that.removeChildByIndex = function (index) {
      that._listDom.children()[index].remove();
    };

    that.hideItem = function (item) {
      const childrens = that._listDom.children();
      if (item.hasClass && !item.hasClass(".item")) {
        const parent = item.parent();
        if (childrens.indexOf(parent[0]) != -1) item = parent;
      }
      item.hide ? item.hide() : (item.display = "none");
      _updateLastShowClass(childrens);
    };

    that.showItem = function (item) {
      const childrens = that._listDom.children();
      if (item.hasClass && !item.hasClass(".item")) {
        const parent = item.parent();
        if (childrens.indexOf(parent[0]) != -1) item = parent;
      }
      item.show ? item.show() : (item.display = "");
      _updateLastShowClass(childrens);
    };

    that.setItemStyle = function (styleMap) {
      domUtils.find(this._dom, ".item").css(styleMap);
    };

    return that;
  };
  daxiapp["DXList"] = daxiapp["DXListComponent"] = DXList; // 'DXListComponent'为向后兼容别名

  /**
   * 带遮罩的模态列表组件
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXModalList = function (parentObject) {
    const that = this;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener || {};
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom = `<div class="mask_modal" style="display: block;"><div class="layerhide"></div><div class="modal-content"><h3 class="title" style="text-align: center;margin-bottom: 20px;"></h3><ul class="list"></ul></div></div>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".mask_modal");
      that._listDom = domUtils.find(that.parentObj, ".list");
    };

    that.injectComponentEvents = function () {
      that._listDom.on("click", ".item", function (el) {
        that.listener?.onItemClick?.(el.target.dataset);
      });
    };

    that.setStyle = function (styleObj) {
      that._dom.css(styleObj);
    };

    that.addClassName = function (className) {
      that._dom.addClass(className);
    };

    that.show = function () {
      that._dom.show();
    };

    that.hide = function () {
      that._dom.hide();
    };

    that.appendItem = function (childDom, events, className, id) {
      const itemDom = _createListItem(childDom, events, className, id);
      that._listDom.append(itemDom);
    };

    that.itemInsertBefore = function (dom, childDom, events, className, id) {
      const itemDom = _createListItem(childDom, events, className, id);
      const beforeDom = typeof dom == "number" ? that._listDom.children()[dom] : dom;
      that._listDom[0].insertBefore(beforeDom, itemDom);
    };

    that.removeChildById = function (id) {
      that._listDom.find(`#${id}`).remove();
    };

    that.removeChildByIndex = function (index) {
      that._listDom.children()[index].remove();
    };

    that.hideItem = function (item) {
      const childrens = that._listDom.children();
      if (item.hasClass && !item.hasClass(".item")) {
        const parent = item.parent();
        if (childrens.indexOf(parent[0]) != -1) item = parent;
      }
      item.hide ? item.hide() : (item.display = "none");
      _updateLastShowClass(childrens);
    };

    that.showItem = function (item) {
      const childrens = that._listDom.children();
      if (item.hasClass && !item.hasClass(".item")) {
        const parent = item.parent();
        if (childrens.indexOf(parent[0]) != -1) item = parent;
      }
      item.show ? item.show() : (item.display = "");
      _updateLastShowClass(childrens);
    };

    that.setTitle = function (text) {
      that._dom.find(".title").text(text);
    };

    that.updateData = function (list, activeKey) {
      const domStr = list.map((item) => `<li class="item ${item.key == activeKey ? "active" : ""}" data-key="${item.key}">${item.value}</li>`).join("");
      that._listDom.html(domStr);
    };

    that.setItemStyle = function (styleMap) {
      domUtils.find(this._dom, ".item").css(styleMap);
    };

    return that;
  };
  daxiapp["DXModalList"] = daxiapp["DXListWithShadowComponent"] = DXModalList; // 'DXListWithShadowComponent'为向后兼容别名

  /**
   * 按钮列表组合视图组件（服务端渲染）
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   * @param {Object} style - 样式配置
   */
  const DXButtonListCombox = function (app, parentObject, style) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.updateData = function (data) {
      const nav_bar_hbs = Array.isArray(data)
        ? `{{#each renderData}}<div class="navlist">{{#if title}}<span class="title">{{title}}</span>{{/if}}<ul class="nav_bar btn_list">{{#each data}}<li class="nav_bar_btn" {{#if command}} data-method={{command.funcName}} {{/if}} data-name="{{name}}"><p class="btn_item vertical"><span class="nav_item {{icon}}"></span><span class="item_name">{{name}}</span></p>{{#if content}}<span class="content">{{content}}</span>{{/if}}</li>{{/each}}</ul></div>{{/each}}`
        : `<ul class="nav_bar btn_list">{{#each renderData}}<li class="nav_bar_btn" {{#if command}} data-method={{command.funcName}} {{/if}} data-name="{{name}}"><p class="btn_item"><span class="nav_item {{icon}}"></span><span class="item_name">{{name}}</span></p></li>{{/each}}</ul>`;
      domUtils.templateText(nav_bar_hbs, { renderData: data }, that.$navBarWrapper);
      that.listener?.onDataUpdated?.(that, that.$navBarWrapper.height());
    };

    that.getHeight = function () {
      return that.$navBarWrapper.height();
    };

    that.injectComponentUI = function () {
      const dom = `<div class="nav_bar_wapper list_container" style="height:auto;"></div>`;
      domUtils.append(that.parentObj, dom);
      that.$navBarWrapper = domUtils.find(that.parentObj, ".nav_bar_wapper");
      style && that.$navBarWrapper.css(style);
    };

    that.injectComponentEvents = function () {
      domUtils.on(that.$navBarWrapper, "click", ".nav_bar_btn", function (e) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        that.listener?.onSelectItemAtIndexPath?.(that, $this[0].dataset);
      });
    };

    return that;
  };
  daxiapp["DXButtonListCombox"] = daxiapp["DXButtonListComboxView"] = DXButtonListCombox; // 'DXButtonListComboxView'为向后兼容别名

  /**
   * 按钮列表面板组件（高铁 footer）
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXButtonListPanel = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.updateData = function (bdid, footerData) {
      that.bdid = bdid;
      if (!footerData) return;
      const nav_bar_hbs = `<ul class="nav_bar btn_list">{{#each bottom_Nav_bar_Data}}<li class="nav_bar_btn common_btn" {{#if command}} data-method={{command.funcName}} {{#if command.keyword}} data-keyword="{{command.keyword}}" {{/if}} {{#if command.perItemCount}} data-itemcount={{command.perItemCount}} {{/if}} {{#if command.poiIds}}data-poiids={{command.poiIds}}{{/if}} data-arealtype={{command.arealType}} data-save={{command.saveStack}} {{else}} data-method="showPois" data-keyword={{command.keyword}} data-type="{{type}}" data-save=true{{/if}} data-name="{{name}}" data-radius="{{radius}}"><p class="btn_item"><span class="nav_item {{icon}}"></span><span class="item_name">{{name}}</span></p></li>{{/each}}</ul>`;
      domUtils.templateText(nav_bar_hbs, { bottom_Nav_bar_Data: footerData }, that._dom);
      that.listener?.onDataUpdated?.(that, that._dom.height());
    };

    that.getHeight = function () {
      return that._dom.height();
    };

    that.injectComponentUI = function () {
      const dom = `<div class="nav_bar_wapper btn_list_panel" style="height:auto;"></div>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".nav_bar_wapper");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".nav_bar_btn", function (e) {
        if (domUtils.isFastClick()) return;
        const dataSet = this.dataset;
        const { method, name, itemcount: perItemCount, radius } = dataSet;
        const keyword = dataSet.keyword || name || "";
        const poiIds = (dataSet.poiids || "") + "";
        const arealType = dataSet.arealtype || "indoor";
        const type = dataSet.type || "";

        if (that.listener?.onSelectItemAtIndexPath) {
          const data = {
            bdid: that.bdid,
            arealType,
            method,
            keyword,
            perItemCount,
            poiIds,
            name,
            type: type || (arealType == "indoor" ? 1 : arealType == "blending" ? 41 : 11),
          };
          if (radius || arealType == "oudoor") {
            data.radius = radius || 2000;
          }
          that.listener.onSelectItemAtIndexPath(that, data);
        }
      });
    };

    that.show = function () {
      that._dom.show();
    };

    that.hide = function () {
      that._dom.hide();
    };

    return that;
  };
  daxiapp["DXButtonListPanel"] = daxiapp["DXButtonListPanelView"] = DXButtonListPanel; // 'DXButtonListPanelView'为向后兼容别名

  /**
   * 按钮列表面板组件 V2
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXButtonListPanel2 = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.updateData = function (bdid, footerData) {
      that.bdid = bdid;
      if (!footerData) return;
      const nav_bar_hbs = `<ul class="nav_bar btn_list">{{#each bottom_Nav_bar_Data}}<li class="nav_bar_btn common_btn" {{#if command}} data-method={{command.funcName}} {{#if command.keyword}} data-keyword="{{command.keyword}}" {{/if}} {{#if command.perItemCount}} data-itemcount={{command.perItemCount}} {{/if}} {{#if command.poiIds}}data-poiids={{command.poiIds}}{{/if}} data-arealtype={{command.arealType}} data-save={{command.saveStack}} {{else}} data-method="showPois" data-keyword={{command.keyword}} data-type="{{type}}" data-save=true{{/if}} data-name="{{name}}" data-radius="{{radius}}"><p class="btn_item"><span class="nav_item {{icon}}"></span><span class="item_name">{{name}}</span></p></li>{{/each}}</ul>`;
      domUtils.templateText(nav_bar_hbs, { bottom_Nav_bar_Data: footerData }, that._dom);
      that.listener?.onDataUpdated?.(that, that._dom.height());
    };

    that.getHeight = function () {
      return that._dom.height();
    };

    that.injectComponentUI = function () {
      const dom = `<div class="nav_bar_wapper btn_list_panel" style="height:auto;"></div>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".nav_bar_wapper");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".nav_bar_btn", function (e) {
        if (domUtils.isFastClick()) return;
        const dataSet = this.dataset;
        const { method, name, itemcount: perItemCount, radius } = dataSet;
        const keyword = dataSet.keyword || name || "";
        const poiIds = (dataSet.poiids || "") + "";
        const arealType = dataSet.arealtype || "indoor";
        const type = dataSet.type || "";

        if (that.listener?.onSelectItemAtIndexPath) {
          const data = {
            bdid: that.bdid,
            arealType,
            method,
            keyword,
            perItemCount,
            poiIds,
            name,
            type: type || (arealType == "indoor" ? 1 : arealType == "blending" ? 41 : 11),
          };
          if (radius || arealType == "oudoor") {
            data.radius = radius || 2000;
          }
          that.listener.onSelectItemAtIndexPath(that, data);
        }
      });
    };

    that.show = function () {
      that._dom.show();
    };

    that.hide = function () {
      that._dom.hide();
    };

    return that;
  };
  daxiapp["DXButtonListPanel2"] = daxiapp["DXButtonListPanelView2"] = DXButtonListPanel2; // 'DXButtonListPanelView2'为向后兼容别名

  /**
   * 按钮列表面板组件 V3（瘦西湖小程序 Footer）
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXButtonListPanel3 = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    /**
     * 更新底部导航栏数据
     * @param {string} bdid - 建筑ID
     * @param {Array} footerData - 导航栏数据数组
     * @param {string} currentPageName - 当前页面的name（可选），用于动态设置高亮
     */
    that.updateData = function (bdid, footerData, currentPageName) {
      that.bdid = bdid;
      if (!footerData) return;

      // 如果提供了当前页面的name，则更新footerData中的menuClass
      if (currentPageName) {
        footerData.forEach(tab => {
          if (tab.name == currentPageName) {
            tab.menuClass = "on";
          } else {
            tab.menuClass = "";
          }
        });
      }

      const navBarHbs = `
        <ul>
          {{#each footerData}}
          <li class="menuTap {{menuClass}}" data-id="{{id}}" data-navitype="{{naviType}}" data-url="{{pageUrl}}">
            <div><i class="{{icon}} {{menuClass}}"></i></div>
            <span>{{name}}</span>
          </li>
          {{/each}}
        </ul>`;

      domUtils.templateText(navBarHbs, { footerData }, that._dom);
      that.listener?.onDataUpdated?.(that, that._dom.height());
    };

    that.getHeight = function () {
      return that._dom.height();
    };

    that.injectComponentUI = function () {
      const dom = `<div class="footerbar" style="height:auto;"></div>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".footerbar");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".menuTap", function (e) {
        if (domUtils.isFastClick()) return;

        const index = $(this).index();
        const { dataset } = this;

        if (that.listener?.onFooterClick) {
          const data = { index, ...dataset };
          that.listener.onFooterClick(that, data);
        }
      });
    };

    that.show = function () {
      that._dom.show();
    };

    that.hide = function () {
      that._dom.hide();
    };

    return that;
  };
  daxiapp["DXButtonListPanel3"] = daxiapp["DXButtonListPanelView3"] = DXButtonListPanel3; // 'DXButtonListPanelView3'为向后兼容别名

  /**
   * 搜索头部组件
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXSearchView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    /** 获取搜索头部 DOM 模板 */
    const _getHeaderDom = function () {
      const placeholder = window.langData?.["holder:tip:search"] || "输入要查询位置";
      return `<ul class="dx_header"><li class="goback icon-fanhui common_btn"></li><li class="input_btn default"><input type="text" class="input_text" placeholder="${placeholder}" onfocus="this.blur();" readonly></li><li class="search_icon audio_btn icon-search1"></li></ul>`;
    };

    that.injectComponentUI = function () {
      const dom = `<div class="map_header_wrapper">${_getHeaderDom()}</div>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".map_header_wrapper");
    };

    that.changeLanguage = function () {
      that._dom.html(_getHeaderDom());
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".goback", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewBackBtnClicked?.(that);
      });

      domUtils.on(that._dom, "click", ".input_btn", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewSearchBtnClicked?.(that, { keyword: _getKeyword(that.parentObj), arealType: "indoor" });
        if (e.cancelable) e.preventDefault();
      });

      domUtils.on(that._dom, "click", ".search_icon", function (e) {
        if (domUtils.isFastClick()) return;
        const searchData = { keyword: _getKeyword(that.parentObj), arealType: "indoor" };
        if (that.listener?.onSearchViewSearchIconClicked) {
          that.listener.onSearchViewSearchIconClicked(that, searchData);
        } else {
          that.listener?.onSearchViewSearchBtnClicked?.(that, searchData);
        }
        if (e.cancelable) e.preventDefault();
      });
    };

    that.getHeight = function () {
      return that._dom?.height();
    };

    that.updateInputText = function (text) {
      if (text) {
        text = decodeURIComponent(text);
        domUtils.find(that._dom, ".input_text").val(text);
      }
    };

    that.setSearchIconClass = function (iconName) {
      domUtils.find(that._dom, ".icon-search1").removeClass("icon-search1").addClass(iconName);
    };

    that.hide = function () {
      that._dom?.hide();
    };

    that.show = function () {
      that._dom?.show();
    };

    return that;
  };
  daxiapp["DXSearchView"] = daxiapp["DXSearchViewComponent"] = DXSearchView; // 'DXSearchViewComponent'为向后兼容别名

  /**
   * 搜索头部组件 V2
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXSearchView2 = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    /** 获取搜索头部 DOM 模板 */
    const _getHeaderDom = function () {
      const placeholder = window.langData?.["holder:tip:search"] || "输入要查询位置";
      return `<ul class="dx_header"><li class="goback icon-fanhui"></li><li class="input_btn default"><input type="search" class="input-text" readonly placeholder="${placeholder}"></li></ul>`;
    };

    that.injectComponentUI = function () {
      const dom = `<header class="search-header-wrapper">${_getHeaderDom()}</header>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".search-header-wrapper");
    };

    that.changeLanguage = function () {
      that._dom.html(_getHeaderDom());
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".goback", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewBackBtnClicked?.(that);
      });

      domUtils.on(that._dom, "click", ".input_btn", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewSearchBtnClicked?.(that, { keyword: _getKeyword(that.parentObj) });
        if (e.cancelable) e.preventDefault();
      });

      domUtils.on(that._dom, "click", ".search_icon", function (e) {
        if (domUtils.isFastClick()) return;
        const searchData = { keyword: _getKeyword(that.parentObj), arealType: "indoor" };
        if (that.listener?.onSearchViewSearchIconClicked) {
          that.listener.onSearchViewSearchIconClicked(that, searchData);
        } else {
          that.listener?.onSearchViewSearchBtnClicked?.(that, searchData);
        }
        if (e.cancelable) e.preventDefault();
      });
    };

    that.setSearchIconClass = function (iconName) {
      domUtils.find(that._dom, ".icon-search1").removeClass("icon-search1").addClass(iconName);
    };

    that.hide = function () {
      that._dom?.hide();
    };

    that.show = function () {
      that._dom?.show();
    };

    return that;
  };
  daxiapp["DXSearchView2"] = daxiapp["DXSearchViewComponent2"] = DXSearchView2; // 'DXSearchViewComponent2'为向后兼容别名

  /**
   * 搜索头部组件 V3
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXSearchView3 = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    /** 获取搜索头部 DOM 模板 */
    const _getHeaderDom = function () {
      const placeholder = window.langData?.["holder:tip:search"] || "输入要查询位置";
      return `<ul class="dx_header"><li class="goback icon-fanhui"></li><li class="input-btn"><span class="input_search_btn icon-search1"></span><input type="search" class="input-text" readonly placeholder="${placeholder}"></li></ul>`;
    };

    that.injectComponentUI = function () {
      const dom = `<header class="search-header-wrapper">${_getHeaderDom()}</header>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".search-header-wrapper");
    };

    that.changeLanguage = function () {
      that._dom.html(_getHeaderDom());
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".goback", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewBackBtnClicked?.(that);
      });

      domUtils.on(that._dom, "click", ".input-btn", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewSearchBtnClicked?.(that, { keyword: _getKeyword(that.parentObj) });
        if (e.cancelable) e.preventDefault();
      });

      domUtils.on(that._dom, "click", ".search_icon", function (e) {
        if (domUtils.isFastClick()) return;
        const searchData = { keyword: _getKeyword(that.parentObj), arealType: "indoor" };
        if (that.listener?.onSearchViewSearchIconClicked) {
          that.listener.onSearchViewSearchIconClicked(that, searchData);
        } else {
          that.listener?.onSearchViewSearchBtnClicked?.(that, searchData);
        }
        if (e.cancelable) e.preventDefault();
      });
    };

    that.setSearchIconClass = function (iconName) {
      domUtils.find(that._dom, ".icon-search1").removeClass("icon-search1").addClass(iconName);
    };

    that.show = function () {
      that._dom.show();
    };

    that.hide = function () {
      that._dom.hide();
    };

    return that;
  };
  daxiapp["DXSearchView3"] = daxiapp["DXSearchViewComponent3"] = DXSearchView3; // 'DXSearchViewComponent3'为向后兼容别名

  /**
   * 搜索视图组件 V4 - 带分类标签的搜索栏
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父容器
   * @param {Object} options - 配置项
   */
  const DXSearchView4 = function (app, parentObject, options) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const hideAudioBtn = options?.hideAudioBtn ?? true;
      const noAround = options?.noAround ?? false;
      const extend = options?.extend;
      let dom;

      if (extend) {
        dom = `
          <div class="map_header_wrapper4">
            <div class="headerInput">
              <i class="icon-search2"></i>
              <input type="text" class="input_text" placeholder="" onfocus="this.blur();" readonly>
              <i class="extendBtn ${extend.icon}" style="font-size:1.4rem;height: 26px;padding: 5px 8px;"></i>
              <i class="search_icon audio_btn icon-search1"></i>
            </div>
            <div class="headerAround"></div>
          </div>`;
      } else {
        dom = `
          <div class="map_header_wrapper4">
            <div class="headerInput">
              <i class="icon-search2"></i>
              <input type="text" class="input_text" placeholder="" onfocus="this.blur();" readonly>
              ${hideAudioBtn ? "" : '<i class="search_icon audio_btn icon-search1"></i>'}
            </div>
            ${noAround ? "" : '<div class="headerAround"></div>'}
          </div>`;
      }

      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".map_header_wrapper4");
      that._headerAround = noAround ? null : domUtils.find(that.parentObj, ".headerAround");
    };

    that.setStyle = function (style) {
      that._dom?.css(style);
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".goback", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewBackBtnClicked?.(that);
      });

      domUtils.on(that._dom, "click", ".input_text", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewSearchBtnClicked?.(that, { keyword: _getKeyword(that.parentObj), arealType: "indoor" });
        if (e.cancelable) e.preventDefault();
      });

      if (options?.extend) {
        domUtils.on(that._dom, "click", ".extendBtn", function (e) {
          options.extend.onClick?.();
        });
      }

      domUtils.on(that._dom, "click", ".search_icon", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewMicBtnClicked?.(that, _getKeyword(that.parentObj));
        if (e.cancelable) e.preventDefault();
      });

      domUtils.on(that._dom, "click", ".nav_bar_btn", function (e) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        const method = $this.data("method");
        const keyword = ($this.data("keyword") || "") + "";
        const perItemCount = $this.data("itemcount");
        const poiIds = ($this.data("poiids") || "") + "";
        const name = $this.data("name");
        const arealType = $this.data("arealtype") || "indoor";
        const searchtype = $this.data("searchtype");

        that.listener?.onSelectItemAtIndexPath?.(that, {
          arealType,
          method,
          keyword,
          perItemCount,
          poiIds,
          name,
          type: arealType == "indoor" ? 1 : 11,
          searchType: searchtype,
        });
      });

      domUtils.on(that._dom, "click", ".scrollLeft", function (e) {
        if (domUtils.isFastClick()) return;
        const aroundContent = that._dom.find(".aroundContent");
        const scrollLeft = aroundContent.scrollLeft();
        const left = scrollLeft - 50 > 0 ? scrollLeft - 50 : 0;
        aroundContent.scrollLeft(left);
      });

      domUtils.on(that._dom, "click", ".scrollRight", function (e) {
        if (domUtils.isFastClick()) return;
        const aroundContent = that._dom.find(".aroundContent");
        const ulWidth = aroundContent.find("ul").width();
        const maxWidth = ulWidth - aroundContent.width();
        const scrollLeft = aroundContent.scrollLeft();
        const left = scrollLeft + 50 > maxWidth ? maxWidth : scrollLeft + 50;
        aroundContent.scrollLeft(left);
      });

      that._dom.find(".aroundContent").on("scroll", function (e) {
        const scrollLeftDom = that._dom.find(".scrollLeft");
        const scrollRightDom = that._dom.find(".scrollRight");
        const aroundContent = that._dom.find(".aroundContent");
        const ulWidth = aroundContent.find("ul").width();
        const maxWidth = ulWidth - aroundContent.width();
        const scrollLeft = aroundContent.scrollLeft();
        if (scrollLeft == 0) {
          scrollLeftDom.removeClass("on");
        } else if (scrollLeft == maxWidth) {
          scrollLeftDom.addClass("on");
          scrollRightDom.removeClass("on");
        } else {
          scrollLeftDom.addClass("on");
          scrollRightDom.addClass("on");
        }
      });
    };

    that.updateData = function () {
      if (!that._headerAround || that._headerAround.length == 0) return;

      const footerData = app._config.searchBar;
      let width = 0;
      const str = `
        <i class="scrollLeft icon-left-arrow"></i>
        <div class="aroundContent">
          <ul class="clearFixed">
            {{#each footerData}}<li class="nav_bar_btn" {{#if command}} data-method={{command.funcName}} {{#if command.keyword}} data-keyword="{{command.keyword}}" {{/if}} {{#if command.perItemCount}} data-itemcount={{command.perItemCount}} {{/if}}  {{#if command.poiIds}}data-poiids={{command.poiIds}}{{/if}} data-arealtype={{command.arealType}} data-save={{command.saveStack}} {{else}} data-method="showPois" data-keyword={{command.keyword}} data-areatype="indoor" data-save=true{{/if}} data-name="{{name}}" data-type="{{type}}" {{#if command.searchType}}data-searchType="{{command.searchType}}"{{/if}}><i class="{{icon}}"></i>{{name}}</li>{{/each}}
          </ul>
        </div>
        <i class="scrollRight icon-right-arrow"></i>`;

      domUtils.templateText(str, { footerData }, that._headerAround);

      setTimeout(function () {
        const li = that._dom.find(".aroundContent ul li");
        const aroundContentWidth = that._dom.find(".aroundContent").width();
        li.forEach(function (item) {
          const wd = $(item).width() + 2;
          width += wd;
          $(item).css("width", `${wd}px`);
        });
        that._dom.find(".aroundContent ul").css("width", `${width}px`);
        const ulWidth = that._dom.find(".aroundContent ul").width();
        if (ulWidth > aroundContentWidth) {
          that._dom.find(".scrollRight").addClass("on");
        }
        app._mapView._mapSDK.on("loadComplete");
        const bdname = app._mapView.currBuildingInfo.bdInfo.cn_name;
        domUtils.find(that.parentObj, ".input_text").attr("placeholder", `搜索景点，发现最美${bdname}`);
      }, 0);
    };

    that.getHeight = function () {
      return that._dom?.height();
    };

    that.updateInputText = function (text) {
      if (text) {
        text = decodeURIComponent(text);
        domUtils.find(that.parentObj, ".input_text").val(text);
      }
    };

    that.setSearchIconClass = function (iconName) {
      domUtils.find(that._dom, ".icon-search1").removeClass("icon-search1").addClass(iconName);
    };

    that.hide = function () {
      that._dom?.hide();
    };

    that.show = function () {
      that._dom?.show();
    };

    return that;
  };
  daxiapp["DXSearchView4"] = daxiapp["DXSearchViewComponent4"] = DXSearchView4; // 'DXSearchViewComponent4'为向后兼容别名

  /**
   * 顶部搜索组件 - 现代化 UI 布局
   * 包含圆角搜索框和可左右滚动的快捷操作标签栏
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父容器
   * @param {Object} options - 配置项
   */
  const DXTopSearchComponent = function (app, parentObject, options) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.options = options || {};
    that._canScrollLeft = false;
    that._canScrollRight = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const placeholder = that.options?.placeholder || "";

      const dom = `
        <div class="dx-top-search-component">
          <div class="dx-search-box-wrapper">
            <div class="dx-search-box">
              <i class="dx-search-icon icon-search2"></i>
              <div class="dx-search-placeholder">${placeholder}</div>
            </div>
          </div>
          <div class="dx-quick-actions-wrapper">
            <i class="dx-scroll-btn dx-scroll-left icon-left-arrow"></i>
            <div class="dx-quick-actions-container">
              <div class="dx-quick-actions-list"></div>
            </div>
            <i class="dx-scroll-btn dx-scroll-right icon-right-arrow"></i>
          </div>
        </div>`;

      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".dx-top-search-component");
      that._searchBox = domUtils.find(that._dom, ".dx-search-box");
      that._quickActionsContainer = domUtils.find(that._dom, ".dx-quick-actions-container");
      that._quickActionsList = domUtils.find(that._dom, ".dx-quick-actions-list");
      that._scrollLeftBtn = domUtils.find(that._dom, ".dx-scroll-left");
      that._scrollRightBtn = domUtils.find(that._dom, ".dx-scroll-right");
    };

    that.injectComponentEvents = function () {
      // 搜索框点击事件
      domUtils.on(that._searchBox, "click", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewSearchBtnClicked?.(that, { keyword: "", arealType: "indoor" });
      });

      // 语音按钮点击事件
      domUtils.on(that._dom, "click", ".dx-voice-btn", function (e) {
        e.stopPropagation();
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewMicBtnClicked?.(that, "");
      });

      // 快捷操作按钮点击事件
      domUtils.on(that._quickActionsList, "click", ".dx-quick-action-btn", function (e) {
        if (domUtils.isFastClick()) return;
        const { dataset } = this;
        that.listener?.onSelectItemAtIndexPath?.(that, {
          method: dataset.method,
          keyword: dataset.keyword,
          name: dataset.name,
          arealType: dataset.arealtype,
          poiIds: dataset.poiids,
          searchType: dataset.searchtype,
          perItemCount: dataset.itemcount,
          type: dataset.arealtype == "indoor" ? 1 : 11,
        });
      });

      // 左滚动按钮
      domUtils.on(that._scrollLeftBtn, "click", function (e) {
        if (domUtils.isFastClick()) return;
        that._scrollActions("left");
      });

      // 右滚动按钮
      domUtils.on(that._scrollRightBtn, "click", function (e) {
        if (domUtils.isFastClick()) return;
        that._scrollActions("right");
      });

      // 滚动事件
      that._quickActionsContainer[0]?.addEventListener("scroll", function () {
        that._updateScrollButtonsState();
      });
    };

    that._scrollActions = function (direction) {
      const container = that._quickActionsContainer[0];
      if (!container) return;

      const scrollAmount = 100;
      const currentScroll = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const targetScroll = direction === "left" ? Math.max(0, currentScroll - scrollAmount) : Math.min(maxScroll, currentScroll + scrollAmount);

      container.scrollTo({ left: targetScroll, behavior: "smooth" });
    };

    that._updateScrollButtonsState = function () {
      const container = that._quickActionsContainer[0];
      if (!container) return;

      const scrollLeft = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;

      that._canScrollLeft = scrollLeft > 0;
      that._canScrollRight = scrollLeft < maxScroll - 1;

      that._scrollLeftBtn.toggleClass("active", that._canScrollLeft);
      that._scrollRightBtn.toggleClass("active", that._canScrollRight);
    };

    /** 更新快捷操作按钮（兼容 searchBar 配置格式） */
    that.updateData = function () {
      const footerData = app._config.searchBar;
      if (!footerData || !Array.isArray(footerData)) return;

      const html = footerData
        .map(function (item) {
          const icon = item.icon ? `<i class="${item.icon}"></i>` : "";
          const command = item.command || {};
          return `
          <button class="dx-quick-action-btn"
            data-method="${command.funcName || "showPois"}"
            data-keyword="${command.keyword || ""}"
            data-name="${item.name || ""}"
            data-arealtype="${command.arealType || "indoor"}"
            data-poiids="${command.poiIds || ""}"
            data-searchtype="${command.searchType || ""}"
            data-itemcount="${command.perItemCount || ""}"
          >
            ${icon}
            <span>${item.name}</span>
          </button>`;
        })
        .join("");

      that._quickActionsList.html(html);
      setTimeout(function () {
        that._updateScrollButtonsState();
        const bdname = app._mapView?.currBuildingInfo?.bdInfo?.cn_name || "";
        if (bdname) {
          that.updatePlaceholder(`搜索景点，发现最美${bdname}`);
        }
      }, 0);
    };

    that.updatePlaceholder = function (text) {
      domUtils.find(that._dom, ".dx-search-placeholder").text(text);
    };

    that.updateInputText = function (text) {
      if (text) {
        that.updatePlaceholder(decodeURIComponent(text));
      }
    };

    that.getHeight = function () {
      return that._dom?.height() || 0;
    };

    that.hide = function () {
      that._dom?.hide();
    };

    that.show = function () {
      that._dom?.show();
    };

    that.setStyle = function (style) {
      that._dom?.css(style);
    };

    /** 兼容原组件的 setSearchIconClass 方法（本组件可忽略） */
    that.setSearchIconClass = function (iconName) {};

    return that;
  };
  daxiapp["DXTopSearchComponent"] = DXTopSearchComponent;

  /**
   * 搜索视图组件 V5
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父容器
   * @param {Object} options - 配置项
   */
  const DXSearchView5 = function (app, parentObject, options) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const hideAudioBtn = /iPhone/i.test(navigator.appVersion) && (app._params.testLocWS || app._params.postMessageWSS);
      const noAround = options?.noAround;
      const extend = options?.extend;
      let dom;

      if (extend) {
        dom = `
          <div class="map_header_wrapper5">
            <div class="headerInput">
              <i class="icon-search2"></i>
              <input type="text" class="input_text" placeholder="" onfocus="this.blur();" readonly>
              <i class="extendBtn ${extend.icon}" style="font-size:1.4rem;height: 26px;padding: 5px 8px;"></i>
              <i class="search_icon audio_btn icon-search1"></i>
            </div>
            <div class="headerAround"></div>
          </div>`;
      } else {
        dom = `
          <div class="map_header_wrapper5">
            <div class="headerInput">
              <i class="icon-search2"></i>
              <input type="text" class="input_text" placeholder="" onfocus="this.blur();" readonly>
              ${hideAudioBtn ? "" : '<i class="search_icon audio_btn icon-search1"></i>'}
            </div>
            ${noAround ? "" : '<div class="headerAround"></div>'}
          </div>`;
      }

      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".map_header_wrapper5");
      that._headerAround = noAround ? null : domUtils.find(that.parentObj, ".headerAround");
    };

    that.setStyle = function (style) {
      that._dom?.css(style);
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".goback", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewBackBtnClicked?.(that);
      });

      domUtils.on(that._dom, "click", ".input_text", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewSearchBtnClicked?.(that, { keyword: _getKeyword(that.parentObj), arealType: "indoor" });
        if (e.cancelable) e.preventDefault();
      });

      if (options?.extend) {
        domUtils.on(that._dom, "click", ".extendBtn", function (e) {
          options.extend.onClick?.();
        });
      }

      domUtils.on(that._dom, "click", ".search_icon", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewMicBtnClicked?.(that, _getKeyword(that.parentObj));
        if (e.cancelable) e.preventDefault();
      });

      domUtils.on(that._dom, "click", ".nav_bar_btn", function (e) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        const method = $this.data("method");
        const keyword = ($this.data("keyword") || "") + "";
        const perItemCount = $this.data("itemcount");
        const poiIds = ($this.data("poiids") || "") + "";
        const name = $this.data("name");
        const arealType = $this.data("arealtype") || "indoor";
        const searchtype = $this.data("searchtype");

        that.listener?.onSelectItemAtIndexPath?.(that, {
          arealType,
          method,
          keyword,
          perItemCount,
          poiIds,
          name,
          type: arealType == "indoor" ? 1 : 11,
          searchType: searchtype,
        });
      });

      domUtils.on(that._dom, "click", ".scrollLeft", function (e) {
        if (domUtils.isFastClick()) return;
        const aroundContent = that._dom.find(".aroundContent");
        const scrollLeft = aroundContent.scrollLeft();
        const left = scrollLeft - 50 > 0 ? scrollLeft - 50 : 0;
        aroundContent.scrollLeft(left);
      });

      domUtils.on(that._dom, "click", ".scrollRight", function (e) {
        if (domUtils.isFastClick()) return;
        const aroundContent = that._dom.find(".aroundContent");
        const ulWidth = aroundContent.find("ul").width();
        const maxWidth = ulWidth - aroundContent.width();
        const scrollLeft = aroundContent.scrollLeft();
        const left = scrollLeft + 50 > maxWidth ? maxWidth : scrollLeft + 50;
        aroundContent.scrollLeft(left);
      });

      that._dom.find(".aroundContent").on("scroll", function (e) {
        const scrollLeftDom = that._dom.find(".scrollLeft");
        const scrollRightDom = that._dom.find(".scrollRight");
        const aroundContent = that._dom.find(".aroundContent");
        const ulWidth = aroundContent.find("ul").width();
        const maxWidth = ulWidth - aroundContent.width();
        const scrollLeft = aroundContent.scrollLeft();
        if (scrollLeft == 0) {
          scrollLeftDom.removeClass("on");
        } else if (scrollLeft == maxWidth) {
          scrollLeftDom.addClass("on");
          scrollRightDom.removeClass("on");
        } else {
          scrollLeftDom.addClass("on");
          scrollRightDom.addClass("on");
        }
      });
    };

    that.updateData = function () {
      if (!that._headerAround || that._headerAround.length == 0) return;

      const footerData = app._config.searchBar;
      let width = 0;
      const str = `<i class="scrollLeft icon-left-arrow"></i><div class="aroundContent"><ul class="clearFixed">{{#each footerData}}<li class="nav_bar_btn" {{#if command}} data-method={{command.funcName}} {{#if command.keyword}} data-keyword="{{command.keyword}}" {{/if}} {{#if command.perItemCount}} data-itemcount={{command.perItemCount}} {{/if}} {{#if command.poiIds}}data-poiids={{command.poiIds}}{{/if}} data-arealtype={{command.arealType}} data-save={{command.saveStack}} {{else}} data-method="showPois" data-keyword={{command.keyword}} data-areatype="indoor" data-save=true{{/if}} data-name="{{name}}" data-type="{{type}}" {{#if command.searchType}}data-searchType="{{command.searchType}}"{{/if}}><i class="{{icon}}"></i>{{name}}</li>{{/each}}</ul></div><i class="scrollRight icon-right-arrow"></i>`;

      domUtils.templateText(str, { footerData }, that._headerAround);

      setTimeout(function () {
        const li = that._dom.find(".aroundContent ul li");
        const aroundContentWidth = that._dom.find(".aroundContent").width();
        li.forEach(function (item) {
          const wd = $(item).width() + 2;
          width += wd;
          $(item).css("width", `${wd}px`);
        });
        that._dom.find(".aroundContent ul").css("width", `${width}px`);
        const ulWidth = that._dom.find(".aroundContent ul").width();
        if (ulWidth > aroundContentWidth) {
          that._dom.find(".scrollRight").addClass("on");
        }
        const bdname = app._mapView.currBuildingInfo.bdInfo.cn_name;
        domUtils.find(that.parentObj, ".input_text").attr("placeholder", `搜索景点，发现最美${bdname}`);
      }, 0);
    };

    that.getHeight = function () {
      return that._dom?.height();
    };

    that.updateInputText = function (text) {
      if (text) {
        text = decodeURIComponent(text);
        domUtils.find(that.parentObj, ".input_text").val(text);
      }
    };

    that.setSearchIconClass = function (iconName) {
      domUtils.find(that._dom, ".icon-search1").removeClass("icon-search1").addClass(iconName);
    };

    that.hide = function () {
      that._dom?.hide();
    };

    that.show = function () {
      that._dom?.show();
    };

    return that;
  };
  daxiapp["DXSearchView5"] = daxiapp["DXSearchViewComponent5"] = DXSearchView5; // 'DXSearchViewComponent5'为向后兼容别名

  /**
   * 带建筑选择的搜索视图组件
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXSearchViewWithBuilding = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;
    that.curBuildingData = {};

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    /** 获取搜索头部 DOM 模板 */
    const _getHeaderDom = function () {
      const selectBuilding = window.langData?.["select:building"] || "选择站点";
      const placeholder = window.langData?.["holder:tip:search"] || "输入要查询位置";
      return `<ul class="dx_header"><li class="goback icon-fanhui common_btn"></li><li class="curr_station icon-"><span class="building_content">${selectBuilding}</span></li><li class="input_btn default"><input type="text" class="input_text" placeholder="${placeholder}" onfocus="this.blur();" readonly></li><li class="search_icon audio_btn icon-search1"></li></ul>`;
    };

    /** 触发搜索事件 */
    const _triggerSearch = function (e) {
      that.listener?.onSearchViewSearchBtnClicked?.(that, { keyword: _getKeyword(that.parentObj), arealType: "indoor" });
      if (e.cancelable) e.preventDefault();
    };

    that.injectComponentUI = function () {
      const dom = `<div class="map_header_wrapper">${_getHeaderDom()}</div>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".map_header_wrapper");
    };

    that.changeLanguage = function () {
      that._dom.html(_getHeaderDom());
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".goback", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewBackBtnClicked?.(that);
      });

      domUtils.on(that._dom, "click", ".input_btn", function (e) {
        if (domUtils.isFastClick()) return;
        _triggerSearch(e);
      });

      domUtils.on(that._dom, "click", ".search_icon", function (e) {
        if (domUtils.isFastClick()) return;
        _triggerSearch(e);
      });

      domUtils.on(that._dom, "click", ".curr_station", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onBuildingBtnClicked?.(that, that.curBuildingData);
      });
    };

    that.setBuildingData = function (data) {
      if (data != that.curBuildingData) {
        that.curBuildingData = data;
        domUtils.find(that.parentObj, ".building_content").text(data?.name || "");
      }
    };

    that.updateInputText = function (text) {
      if (text) {
        text = decodeURIComponent(text);
        domUtils.find(that._dom, ".input_text").val(text);
      }
    };

    that.hide = function () {
      that._dom?.hide();
    };

    that.show = function () {
      that._dom?.show();
    };

    return that;
  };
  daxiapp["DXSearchViewWithBuilding"] = daxiapp["DXSearchViewComponentWithBuilding"] = DXSearchViewWithBuilding; // 'DXSearchViewComponentWithBuilding'为向后兼容别名

  /**
   * 语音搜索组件
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXVoiceSearchView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    /** 获取语音搜索内容 DOM 模板 */
    const _getContentDom = function () {
      const tip1 = window.langData?.["speech:recognition:tip1"] || "你可以对我说:";
      const toilet = window.langData?.["toilet"] || "卫生间";
      const longtapTip = window.langData?.["longtap:tip:text"] || "长按录音";
      return `<div class="closeVoice"></div><div class="text">${tip1}<p>"${toilet}"</p></div><div class="voiceline"></div><div class="btn_finger"><span class="icon_finger"></span><span class="des_text">${longtapTip}</span></div>`;
    };

    that.injectComponentUI = function () {
      const dom = `<div class="voiceBox" oncontextmenu="self.event.returnValue=false">${_getContentDom()}</div>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".voiceBox");
      that._fingerDom = domUtils.find(that._dom, ".icon_finger");
    };

    that.changeLanguage = function () {
      that._dom.html(_getContentDom());
    };

    that.injectComponentEvents = function () {
      let isFirst = true;

      domUtils.on(that._dom, "touchstart", ".btn_finger", function (e) {
        if (domUtils.isFastClick()) return;
        that._fingerDom.addClass("active");
        domUtils.showMask();

        window.wx?.startRecord({
          success: function () {},
          cancel: function () {
            alert(window.langData?.["reject:record:tip"] || "您已拒绝授权录音,无法语音识别,如需使用需移除本小程序后重新访问");
          },
          fail: function (e) {
            if (e.errMsg == "startRecord:recording") {
              wx?.stopRecord({});
            } else if (e.errMsg == "startRecord:fail auth deny" || e.errMsg == "startRecord:android permission denied") {
              alert(window.langData?.["reject:record:tip"] || "您已拒绝授权录音,无法语音识别,如需使用需移除本小程序后重新访问");
            } else {
              if (isFirst) {
                domUtils.showInfo(window.langData?.["unidentified:record"] || "未识别请重试");
                isFirst = false;
                return;
              } else if (e.errMsg == "startRecord:fail") {
                domUtils.showInfo(window.langData?.["record:handle:tip"] || "请按住说话");
              }
            }
          },
        });

        e.preventDefault();
        e.stopPropagation();
      });

      domUtils.on(that._dom, "touchend", ".btn_finger", function (e) {
        that._fingerDom.removeClass("active");
        if (domUtils.isFastClick()) return;

        domUtils.hideMask();
        window.wx?.stopRecord({
          success: function (res) {
            const localId = res.localId;
            wx.translateVoice({
              localId,
              isShowProgressTips: 1,
              success: function (res) {
                if (res.errMsg == "translateVoice:ok") {
                  const text = domUtils.find(that.parentObj, ".voiceBox .text");
                  text.text(res.translateResult);
                  const keyword = res.translateResult.replace(/(，)|(。)|( )/g, "");
                  setTimeout(function () {
                    that.listener?.onSearchSuccess?.(that, { keyword });
                  }, 10);
                }
              },
            });
          },
        });
      });

      domUtils.on(that._dom, "click", ".closeVoice", function (e) {
        if (domUtils.isFastClick()) return;
        const voice_search = domUtils.find(that.parentObj, ".voice_search");
        const voiceBox = domUtils.find(that.parentObj, ".voiceBox");
        const text = domUtils.find(that.parentObj, ".voiceBox .text");
        const tip1 = window.langData?.["speech:recognition:tip1"] || "你可以对我说:";
        const toilet = window.langData?.["toilet"] || "卫生间";
        text.html(`${tip1}<p>"${toilet}"</p>`);
        voiceBox.hide();
        voice_search.css("opacity", 0.8);
        domUtils.hideMask();
        if (e.cancelable) e.preventDefault();
        wx?.stopRecord({
          success: function (res) {
            console.log(res);
          },
        });
        that.listener?.onClose?.();
      });
    };

    that.hide = function () {
      that._dom.hide();
    };

    that.show = function () {
      that._dom.show();
    };

    return that;
  };
  daxiapp["DXVoiceSearchView"] = daxiapp["DXVoiceSearchViewComponent"] = DXVoiceSearchView; // 'DXVoiceSearchViewComponent'为向后兼容别名

  /**
   * 搜索面板组件
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXSearchPanel = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.placeholder = "输入要查询位置";
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    /** 获取搜索头部 DOM 模板 */
    const _getHeaderDom = function () {
      const placeholder = window.langData?.["holder:tip:search"] || "输入要查询位置";
      const searchBtnText = window.langData?.["search:btntext"] || "搜索";
      return `<ul class="dx_header"><li class="goback icon-back icon-fanhui"></li><li class="search_input"><div class="search_input_wrapper"><form action="javascript:;" class="search_form"><input type="search" maxlength="30" placeholder="${placeholder}" class="dx_input" oncopy="return false;" oncut="return false;" onfocus="if(this.value.length>0){this.placeholder=''}"/></form><span class="deleteText icon_gb-delete2 hide"></span></div></li><li class="go_search"><span class="search_btn">${searchBtnText}</span></li></ul>`;
    };

    that.injectComponentUI = function () {
      const dom = `<header class="search-header-wrapper">${_getHeaderDom()}</header>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".search-header-wrapper");
    };

    that.changeLanguage = function () {
      that._dom.html(_getHeaderDom());
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".goback", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewBackBtnClicked?.(that);
      });

      domUtils.on(that._dom, "click", ".go_search", function (e) {
        if (domUtils.isFastClick()) return;
        const input_text = domUtils.find(that.parentObj, ".dx_input");
        const keyword = _getKeyword(that.parentObj);
        if (keyword) {
          that.listener?.onSearchViewMicBtnClicked?.(that, keyword);
          if (e.cancelable) e.preventDefault();
        } else {
          input_text.value = "";
        }
      });

      domUtils.on(that._dom, "input", ".dx_input", function (e) {
        const keyword = e.target.value.replace(/ /g, "").trim();
        that._dom.find(".deleteText").toggleClass("hide", keyword.length == 0);
        that.listener?.onSearchInputed?.(that, keyword);
      });

      domUtils.on(that._dom, "blur", ".dx_input", function (e) {
        const keyword = this.value.trim();
        if (!keyword) {
          this.value = "";
        }
      });

      domUtils.on(that._dom, "click", ".deleteText", function (e) {
        that._dom.find(".dx_input").val("");
        that.listener?.onSearchInputed?.(that, "");
      });

      domUtils.on(that._dom, "keyup", ".dx_input", function (event) {
        event.stopPropagation();
        const keyword = this.value.replace(/ /g, "").trim();
        if (event.keyCode == 13 && keyword) {
          that.listener?.onSearchViewMicBtnClicked?.(that, keyword);
          this.blur();
        }
      });
    };

    that.setPlaceholder = function (text) {
      that.placeholder = text;
      domUtils.find(that._dom, "input").attr("placeholder", text);
    };

    that.updateData = function (text) {
      const searchInput = domUtils.find(that._dom, ".dx_input");
      searchInput.val(text);
    };

    that.hide = function () {
      that._dom?.hide();
    };

    that.show = function () {
      that._dom?.show();
    };
  };
  daxiapp["DXSearchPanel"] = daxiapp["DXSearchComponent"] = DXSearchPanel; // 'DXSearchComponent'为向后兼容别名

  /**
   * 搜索面板组件 V2
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXSearchPanel2 = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;
    that.keyword = "";

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    /** 获取搜索头部 DOM 模板 */
    const _getHeaderDom = function () {
      const placeholder = window.langData?.["holder:tip2:search"] || "请输入目的地或服务设施";
      const searchBtnText = window.langData?.["search:btntext"] || "搜索";
      return `<ul class="dx_header"><li class="goback icon-back icon-fanhui"></li><li class="search_input"><div class="search_input_wrapper"><span class="icon-search1 search-icon"></span><form action="javascript:;" class="search_form"><input type="search" maxlength="30" placeholder="${placeholder}" class="dx_input" oncopy="return false;" oncut="return false;" onfocus="if(this.value.length>0){this.placeholder=''}" onblur="this.value.length==0?this.placeholder='${placeholder}':''"/></form></div></li><li class="go_search"><span class="search_btn">${searchBtnText}</span></li></ul>`;
    };

    that.injectComponentUI = function () {
      const dom = `<header class="search-header-wrapper">${_getHeaderDom()}</header>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".search-header-wrapper");
    };

    that.changeLanguage = function () {
      that._dom.html(_getHeaderDom());
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".goback", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewBackBtnClicked?.(that);
      });

      domUtils.on(that._dom, "click", ".go_search", function (e) {
        if (domUtils.isFastClick()) return;
        const input_text = domUtils.find(that.parentObj, ".dx_input");
        const keyword = domUtils.val(input_text)?.trim() || "";
        if (keyword) {
          that.listener?.onSearchViewMicBtnClicked?.(that, keyword);
          if (e.cancelable) e.preventDefault();
        }
      });

      domUtils.on(that._dom, "input", ".dx_input", function (e) {
        const keyword = e.target.value.replace(/ /g, "").trim();
        that.keyword = keyword;
        that.listener?.onSearchInputed?.(that, keyword);
      });

      domUtils.on(that._dom, "click", ".dx_input", function (e) {
        that.keyword = "";
        that.listener?.onSearchInputed?.(that, "");
      });

      domUtils.on(that._dom, "keyup", ".dx_input", function (event) {
        event.stopPropagation();
        const keyword = this.value.replace(/ /g, "").trim();
        if (event.keyCode == 13 && this.value) {
          that.keyword = keyword;
          that.listener?.onSearchViewMicBtnClicked?.(that, keyword);
          this.blur();
        }
      });
    };

    that.updateData = function (text) {
      const searchInput = domUtils.find(that._dom, ".dx_input");
      searchInput.val(text);
    };

    that.getKeyword = function () {
      return that.keyword;
    };
  };
  daxiapp["DXSearchPanel2"] = daxiapp["DXSearchComponent2"] = DXSearchPanel2; // 'DXSearchComponent2'为向后兼容别名

  /**
   * 搜索面板组件 V3 - 带滑动抽屉效果
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   * @param {Object} options - 配置项
   */
  const DXSearchPanel3 = function (app, parentObject, options) {
    options = options || {};
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    /** 获取搜索头部 DOM 模板 */
    const _getContentDom = function () {
      const placeholder = options.searchPlaceholder || window.langData?.["holder:tip2:search"] || "请输入目的地或服务设施";
      const voiceBtn = options.noVoice ? "" : '<li class="search_icon audio_btn voice_search icon-mic"></li>';
      return `<div class="genres-toggle top"><i class="icon_arrow"></i></div><div class="search-header-wrapper2"><ul class="dx_header"><li class="search_input search_input3"><div class="search_input_wrapper"><span class="icon-search1 search-icon"></span><form action="javascript:;" class="search_form"><input type="search" maxlength="30" placeholder="${placeholder}" class="dx_input" oncopy="return false;" oncut="return false;" onfocus="if(this.value.length>0){this.placeholder=''}" onblur="this.value.length==0?this.placeholder='${placeholder}':''"/></form></div></li>${voiceBtn}</ul></div>`;
    };

    that.injectComponentUI = function () {
      const dom = `<div class="searchComponent3">${_getContentDom()}</div>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".searchComponent3");
    };

    that.changeLanguage = function () {
      that._dom.html(_getContentDom());
    };

    that.injectComponentEvents = function () {
      const _domParens = that._dom.parents(".mainPoiSlide");

      domUtils.on(that._dom, "click", ".search_input3", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewSearchBtnClicked?.(that, { keyword: _getKeyword(that.parentObj), arealType: "indoor" });
        if (e.cancelable) e.preventDefault();
      });

      domUtils.on(that._dom, "click", ".search_icon", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewMicBtnClicked?.(that, _getKeyword(that.parentObj));
        if (e.cancelable) e.preventDefault();
      });

      domUtils.on(that._dom, "input", ".dx_input", function (e) {
        const keyword = e.target.value.replace(/ /g, "").trim();
        that.listener?.onSearchInputed?.(that, keyword);
      });

      domUtils.on(that._dom, "keyup", ".dx_input", function (event) {
        event.stopPropagation();
        const keyword = this.value.replace(/ /g, "").trim();
        if (event.keyCode == 13 && this.value) {
          that.listener?.onSearchViewMicBtnClicked?.(that, keyword);
          this.blur();
        }
      });

      domUtils.on(that._dom, "click", ".genres-toggle", function (event) {
        let offsetTop = that._app._config.footerNavi == false ? 195 : 220;

        if ($(this).hasClass("top")) {
          if ($(this).hasClass("bottom")) {
            $(this).removeClass("bottom");
            $(this)
              .parents(".mainPoiSlide")
              .css({ top: `calc(100% - ${offsetTop}px)`, "transition-duration": "0.3s" });
            that.listener?.onSlideStatusChanged?.({ status: "toMiddle", offsetTop });
            return;
          }
          $(this).removeClass("top").addClass("down");
          let top = 20;
          if (options.autoHeight) {
            const clientHeight = document.body.clientHeight;
            const h1 = _domParens.find(".icon-container").height();
            const h2 = _domParens.find(".searchComponent3").height();
            top = clientHeight - h1 - h2 - 50;
          }
          $(this)
            .parents(".mainPoiSlide")
            .css({ top: `${top}px`, "transition-duration": "0.3s" });
        } else {
          $(this).removeClass("down").addClass("top");
          $(this)
            .parents(".mainPoiSlide")
            .css({ top: `calc(100% - ${offsetTop}px)`, "transition-duration": "0.3s" });
          that.listener?.onSlideStatusChanged?.({ status: "toMiddle", offsetTop });
        }
      });

      domUtils.on(_domParens, "touchstart", function (event) {
        const startClientY = event.changedTouches[0].clientY;
        that.clientY = startClientY;
        that.clientY2 = startClientY;
      });

      domUtils.on(_domParens, "touchmove", function (event) {
        const currentclientY = event.changedTouches[0].clientY;
        const diffclientY = currentclientY - that.clientY;
        const top = $(this).offset().top;
        const offsetTop = that._app._config.footerNavi == false ? 106 : 141;
        const max = document.body.clientHeight - offsetTop;
        const min = document.body.clientHeight * 0.03;
        if (top + diffclientY > min && top + diffclientY < max) {
          $(this).css("top", `${top + diffclientY}px`);
          that.clientY = top + diffclientY;
        }
      });

      domUtils.on(_domParens, "touchend", function (event) {
        const endclientY = event.changedTouches[0].clientY;
        const diffclientY = endclientY - that.clientY2;
        const offsetTop1 = that._app._config.footerNavi == false ? 195 : 220;
        const offsetTop = that._app._config.footerNavi == false ? 106 : 141;
        const middleTop = document.body.clientHeight - offsetTop1;
        const max = document.body.clientHeight - offsetTop;
        const min = document.body.clientHeight * 0.03;
        const genresToggle = that._dom.find(".genres-toggle");

        if (Math.abs(diffclientY) > 50) {
          if (diffclientY > 0) {
            // 下滑
            if (endclientY < middleTop) {
              $(this).css("top", `${middleTop}px`);
              that.listener?.onSlideStatusChanged?.({ status: "toMiddle", offsetTop: offsetTop1 });
            }
            if (endclientY > max || endclientY > middleTop + 30) {
              $(this).css("top", `${max}px`);
              genresToggle.addClass("bottom");
              that.listener?.onSlideStatusChanged?.({ status: "toMiddle", offsetTop });
            }
            if (!genresToggle.hasClass("top")) {
              genresToggle.addClass("top").removeClass("down");
            }
          } else {
            // 上滑
            if (endclientY > middleTop - 30) {
              $(this).css("top", `${middleTop}px`);
              that.listener?.onSlideStatusChanged?.({ status: "toMiddle", offsetTop: offsetTop1 });
            } else {
              genresToggle.removeClass("top").addClass("down");
              let top = 40;
              if (options.autoHeight) {
                const clientHeight = document.body.clientHeight;
                const h1 = _domParens.find(".icon-container").height();
                const h2 = _domParens.find(".searchComponent3").height();
                top = clientHeight - h1 - h2 - 50;
              }
              $(this).css({ top: `${top}px`, "transition-duration": "0.3s" });
            }
            genresToggle.removeClass("bottom");
          }
        } else {
          // 滑动幅度小 回弹
          if (genresToggle.hasClass("bottom")) {
            $(this).css("top", `${max}px`);
          } else if (genresToggle.hasClass("down")) {
            $(this).css("top", `${min}px`);
          } else {
            $(this).css("top", `${middleTop}px`);
          }
        }
      });
    };

    that.updateData = function (text) {
      const genres = this._dom.find(".genres-toggle");
      if (genres.hasClass("down")) {
        genres.trigger("click");
      }
    };
  };
  daxiapp["DXSearchPanel3"] = daxiapp["DXSearchComponent3"] = DXSearchPanel3; // 'DXSearchComponent3'为向后兼容别名

  /**
   * 搜索面板组件 V4 - 带语音图标按钮
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   * @param {Object} options - 配置项
   */
  const DXSearchPanel4 = function (app, parentObject, options) {
    options = options || {};
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    /** 获取搜索头部 DOM 模板 */
    const _getHeaderDom = function () {
      const placeholder = options.searchPlaceholder || window.langData?.["holder:tip2:search"] || "请输入目的地或服务设施";
      const searchBtnText = window.langData?.["search:btntext"] || "搜索";
      const voiceBtn = options.noVoice ? "" : '<i class="search_icon audio_btn voice_search icon-mic"></i>';
      return `<ul class="dx_header"><li class="goback icon-back icon-fanhui"></li><li class="search_input"><div class="search_input_wrapper"><span class="icon-search1 search-icon"></span><form action="javascript:;" class="search_form"><input type="search" maxlength="30" placeholder="${placeholder}" class="dx_input" oncopy="return false;" oncut="return false;" onfocus="if(this.value.length>0){this.placeholder=''}"/></form></div>${voiceBtn}</li><li class="go_search">${searchBtnText}</li></ul>`;
    };

    that.injectComponentUI = function () {
      const dom = `<header class="search-header-wrapper">${_getHeaderDom()}</header>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".search-header-wrapper");
    };

    that.changeLanguage = function () {
      that._dom.html(_getHeaderDom());
    };

    that.injectComponentEvents = function () {
      that._dom.find("input")[0].onblur = function (event) {
        const inputValue = event.target.value.trim();
        if (!inputValue) {
          event.target.placeholder = window.langData?.["holder:tip2:search"] || "请输入目的地或服务设施";
        }
      };

      domUtils.on(that._dom, "click", ".goback", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewBackBtnClicked?.(that);
      });

      domUtils.on(that._dom, "click", ".voice_search", function () {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewMicBtnClicked?.(that);
      });

      domUtils.on(that._dom, "click", ".go_search", function (e) {
        if (domUtils.isFastClick()) return;
        const keyword = _getKeyword(that.parentObj);
        if (keyword) {
          that.listener?.onSearchBtnClicked?.(that, keyword);
        }
        if (e.cancelable) e.preventDefault();
      });

      domUtils.on(that._dom, "input", ".dx_input", function (e) {
        const keyword = e.target.value.replace(/ /g, "").trim();
        that.listener?.onSearchInputed?.(that, keyword);
      });

      domUtils.on(that._dom, "click", ".dx_input", function (e) {
        that.listener?.onSearchInputed?.(that, "");
      });

      domUtils.on(that._dom, "keyup", ".dx_input", function (event) {
        event.stopPropagation();
        const keyword = this.value.replace(/ /g, "").trim();
        if (event.keyCode == 13 && this.value) {
          that.listener?.onSearchBtnClicked?.(that, keyword);
          this.blur();
        }
      });
    };

    that.updateData = function (text) {
      const searchInput = domUtils.find(that._dom, ".dx_input");
      searchInput.val(text);
    };
  };
  daxiapp["DXSearchPanel4"] = daxiapp["DXSearchComponent4"] = DXSearchPanel4; // 'DXSearchComponent4'为向后兼容别名

  /**
   * 搜索面板组件 V5 - 简洁样式带滑动抽屉
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   * @param {Object} options - 配置项
   */
  const DXSearchPanel5 = function (app, parentObject, options) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom =
        '<div class="searchComponent5"><i class="tkyIcon-search4"></i><input type="text" class="inputSearch" placeholder="请输入要查询的位置"><i class="tkyIcon-mike"></i></div>';
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".searchComponent5");
    };

    that.injectComponentEvents = function () {
      const _domParens = that._dom.parents().find(".mainPoiSlide");

      domUtils.on(that._dom, "click", ".inputSearch", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewSearchBtnClicked?.(that, { keyword: _getKeyword(that.parentObj), arealType: "indoor" });
        if (e.cancelable) e.preventDefault();
      });

      domUtils.on(that._dom, "click", ".tkyIcon-mike", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewMicBtnClicked?.(that, _getKeyword(".dx_input"));
        if (e.cancelable) e.preventDefault();
      });

      domUtils.on(that._dom, "input", ".inputSearch", function (e) {
        const keyword = e.target.value.replace(/ /g, "").trim();
        that.listener?.onSearchInputed?.(that, keyword);
      });

      domUtils.on(that._dom, "keyup", ".inputSearch", function (event) {
        event.stopPropagation();
        const keyword = this.value.replace(/ /g, "").trim();
        if (event.keyCode == 13 && this.value) {
          that.listener?.onSearchViewMicBtnClicked?.(that, keyword);
          this.blur();
        }
      });

      domUtils.on(that._dom, "click", ".genres-toggle", function (event) {
        const offsetTop = that._app._config.footerNavi == false ? 195 : 220;

        if ($(this).hasClass("top")) {
          if ($(this).hasClass("bottom")) {
            $(this).removeClass("bottom");
            $(this)
              .parents(".mainPoiSlide")
              .css({ top: `calc(100% - ${offsetTop}px)`, "transition-duration": "0.3s" });
            that.listener?.onSlideStatusChanged?.({ status: "toMiddle", offsetTop });
            return;
          }
          $(this).removeClass("top").addClass("down");
          $(this).parents(".mainPoiSlide").css({ top: "20px", "transition-duration": "0.3s" });
        } else {
          $(this).removeClass("down").addClass("top");
          $(this)
            .parents(".mainPoiSlide")
            .css({ top: `calc(100% - ${offsetTop}px)`, "transition-duration": "0.3s" });
          that.listener?.onSlideStatusChanged?.({ status: "toMiddle", offsetTop });
        }
      });

      domUtils.on(_domParens, "touchstart", function (event) {
        const startClientY = event.changedTouches[0].clientY;
        that.clientY = startClientY;
        that.clientY2 = startClientY;
      });

      domUtils.on(_domParens, "touchmove", function (event) {
        const currentclientY = event.changedTouches[0].clientY;
        const diffclientY = currentclientY - that.clientY;
        const top = $(this).offset().top;
        const offsetTop = 66;
        const max = document.body.clientHeight - offsetTop;
        const min = document.body.clientHeight * 0.03;
        if (top + diffclientY > min && top + diffclientY < max) {
          $(this).css("top", `${top + diffclientY}px`);
          that.clientY = top + diffclientY;
        }
      });

      domUtils.on(_domParens, "touchend", function (event) {
        const endclientY = event.changedTouches[0].clientY;
        const diffclientY = endclientY - that.clientY2;
        const offsetTop1 = 66;
        const offsetTop = 66;
        const middleTop = document.body.clientHeight - offsetTop1;
        const max = document.body.clientHeight - offsetTop;
        const min = document.body.clientHeight * 0.03;
        const genresToggle = that._dom.find(".genres-toggle");

        if (Math.abs(diffclientY) > 50) {
          if (diffclientY > 0) {
            // 下滑
            if (endclientY < middleTop) {
              $(this).css("top", `${middleTop}px`);
              that.listener?.onSlideStatusChanged?.({ status: "toMiddle", offsetTop: offsetTop1 });
            }
            if (endclientY > max || endclientY > middleTop + 30) {
              $(this).css("top", `${max}px`);
              genresToggle.addClass("bottom");
              that.listener?.onSlideStatusChanged?.({ status: "toMiddle", offsetTop });
            }
            if (!genresToggle.hasClass("top")) {
              genresToggle.addClass("top").removeClass("down");
            }
          } else {
            // 上滑
            if (endclientY > middleTop - 30) {
              $(this).css("top", `${middleTop}px`);
              that.listener?.onSlideStatusChanged?.({ status: "toMiddle", offsetTop: offsetTop1 });
            } else {
              genresToggle.removeClass("top").addClass("down");
              $(this).css({ top: "20px", "transition-duration": "0.3s" });
            }
            genresToggle.removeClass("bottom");
          }
        } else {
          // 滑动幅度小 回弹
          if (genresToggle.hasClass("bottom")) {
            $(this).css("top", `${max}px`);
          } else if (genresToggle.hasClass("down")) {
            $(this).css("top", `${min}px`);
          } else {
            $(this).css("top", `${middleTop}px`);
          }
        }
      });
    };
  };
  daxiapp["DXSearchPanel5"] = daxiapp["DXSearchComponent5"] = DXSearchPanel5; // 'DXSearchComponent5'为向后兼容别名

  /**
   * 搜索面板组件 V6
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   * @param {Object} options - 配置项
   */
  const DXSearchPanel6 = function (app, parentObject, options) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const placeholder = "请输入需要查找的地点";
      const dom = `<header class="search-header-wrapper6"><div class="goback" style="line-height: 44px;width: 35px;display: inline-block;font-size: 22px;"><i class="icon-fanhui" style="line-height: 44px;color: #999;"></i></div><ul class="dx_header"><li class="search_input"><div class="search_input_wrapper"><form action="javascript:;" class="search_form"><input type="search" maxlength="30" placeholder="${placeholder}" class="dx_input" oncopy="return false;" oncut="return false;" onfocus="if(this.value.length>0){this.placeholder='${placeholder}'}" onblur="this.value.length==0?this.placeholder='${placeholder}':''"/></form></div><li class="go_search">搜索</li></ul>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".search-header-wrapper6");
      if (options?.disableBackBtn) {
        domUtils.find(that._dom, ".goback")?.hide();
      }
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".goback", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewBackBtnClicked?.(that);
      });

      domUtils.on(that._dom, "click", ".voice_search", function () {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewMicBtnClicked?.(that);
      });

      domUtils.on(that._dom, "click", ".go_search", function (e) {
        if (domUtils.isFastClick()) return;
        const keyword = _getKeyword(that.parentObj);
        if (keyword) {
          that.listener?.onSearchBtnClicked?.(that, keyword);
        }
        if (e.cancelable) e.preventDefault();
      });

      domUtils.on(that._dom, "input", ".dx_input", function (e) {
        const keyword = e.target.value.replace(/ /g, "").trim();
        that.listener?.onSearchInputed?.(that, keyword);
      });

      domUtils.on(that._dom, "click", ".dx_input", function (e) {
        that.listener?.onSearchInputed?.(that, "");
      });

      domUtils.on(that._dom, "keyup", ".dx_input", function (event) {
        event.stopPropagation();
        const keyword = this.value.replace(/ /g, "").trim();
        if (event.keyCode == 13 && this.value) {
          that.listener?.onSearchBtnClicked?.(that, keyword);
          this.blur();
        }
      });
    };

    that.updateData = function (text) {
      const searchInput = domUtils.find(that._dom, ".dx_input");
      searchInput.val(text);
    };
  };
  daxiapp["DXSearchPanel6"] = daxiapp["DXSearchComponent6"] = DXSearchPanel6; // 'DXSearchComponent6'为向后兼容别名

  /**
   * 搜索面板组件 V7
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   * @param {Object} options - 配置项
   */
  const DXSearchPanel7 = function (app, parentObject, options) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const placeholder = "请输入需要查找的地点";
      const dom = `<div class="searchComponent5"><div class="search-header-wrapper2"><ul class="dx_header"><li class="search_input search_input3"><div class="search_input_wrapper"><span class="icon-search1 search-icon"></span><form action="javascript:;" class="search_form"><input type="search" maxlength="30" placeholder="${placeholder}" class="dx_input" oncopy="return false;" oncut="return false;" onfocus="if(this.value.length>0){this.placeholder=''}" onblur="this.value.length==0?this.placeholder='${placeholder}':''"/></form></div></li>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".searchComponent5");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".search_input3", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewSearchBtnClicked?.(that, { keyword: _getKeyword(that.parentObj), arealType: "indoor" });
        if (e.cancelable) e.preventDefault();
      });

      domUtils.on(that._dom, "click", ".search_icon", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onSearchViewMicBtnClicked?.(that, _getKeyword(that.parentObj));
        if (e.cancelable) e.preventDefault();
      });

      domUtils.on(that._dom, "input", ".dx_input", function (e) {
        const keyword = e.target.value.replace(/ /g, "").trim();
        that.listener?.onSearchInputed?.(that, keyword);
      });

      domUtils.on(that._dom, "keyup", ".dx_input", function (event) {
        event.stopPropagation();
        const keyword = this.value.replace(/ /g, "").trim();
        if (event.keyCode == 13 && this.value) {
          that.listener?.onSearchViewMicBtnClicked?.(that, keyword);
          this.blur();
        }
      });
    };

    that.updateData = function (text) {
      const genres = this._dom.find(".genres-toggle");
      if (genres.hasClass("down")) {
        genres.trigger("click");
      }
    };
  };
  daxiapp["DXSearchPanel7"] = daxiapp["DXSearchComponent7"] = DXSearchPanel7; // 'DXSearchComponent7'为向后兼容别名

  /**
   * 底部导航组件
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   * @param {boolean} disableStatus - 是否禁用状态切换
   * @param {string} activekey - 当前激活的页面标识
   */
  const DXFooterNavi = function (app, parentObject, disableStatus, activekey) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener, data) {
      that.data = data;
      that.listener = listener;
      that.injectComponentUI(data);
      that.injectComponentEvents();
    };

    /** 根据建筑类型获取场景类型文本 */
    const _getSceneTypeText = function () {
      const typeMap = {
        library: window.langData?.["sceneType:library"] || "图书馆",
        meeting: window.langData?.["sceneType:meeting"] || "场馆",
        station: window.langData?.["sceneType:station"] || "场馆",
      };
      return typeMap[DxApp._config.buildingType] || window.langData?.["sceneType:hospital"] || "医院";
    };

    that.injectComponentUI = function (data) {
      const wrapperStart = '<ul class="footerul">';
      const wrapperEnd = "</ul>";
      let dom = "";

      if (data) {
        data.forEach(function (item) {
          dom += `<li class="${item.key}" data-key="${item.key}">${item.name}</li>`;
        });
      } else if (that._app._config.footerNavi != false) {
        dom = `<li class="indexPage">${window.langData?.["homepage:btntext"] || "首页"}</li>`;

        if (!that._app._config.hideDepartmentPage) {
          const menuTab2 = window.langData?.["departmentInfo:btntext"] || "科室楼栋";
          let btnText = that._app._config.departmentPageTitle;
          if (that._app._config.departmentPageTitleKey) {
            btnText = window.langData?.[that._app._config.departmentPageTitleKey] || that._app._config.departmentPageTitle;
          }
          dom += `<li class="departmentPage">${btnText || menuTab2}</li>`;
        }

        if (!that._app._config.hideAboutPage) {
          const sceneType = _getSceneTypeText();
          let menuTab3 = window.langData?.["building:info:btntext"] || "{{sceneType}}信息";
          menuTab3 = menuTab3.replace("{{sceneType}}", sceneType);
          let btnText = that._app._config.aboutPageTitle;
          if (that._app._config.aboutPageTitleKey) {
            btnText = window.langData?.[that._app._config.aboutPageTitleKey] || that._app._config.aboutPageTitle;
          }
          dom += `<li class="hospitalInfoPage">${btnText || menuTab3}</li>`;
        }
      }

      if (that._dom) {
        that._dom.html(dom);
        return;
      }
      dom = wrapperStart + dom + wrapperEnd;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".footerul");
    };

    that.changeLanguage = function (lang) {
      that.injectComponentUI(that.data);
    };

    that.injectComponentEvents = function () {
      const _dom = that.parentObj;

      domUtils.on(_dom, "click", "li", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onItemClicked?.(e.target.dataset);
        if (disableStatus) return;
        $(this).addClass("on").siblings().removeClass("on");
      });

      domUtils.on(_dom, "click", ".indexPage", function (e) {
        that.listener?.onIndexPageClicked?.();
      });

      domUtils.on(_dom, "click", ".departmentPage", function (e) {
        that.listener?.onDepartmentPageClicked?.();
      });

      domUtils.on(_dom, "click", ".hospitalInfoPage", function (e) {
        that.listener?.onHospitalInfoPageClicked?.();
      });
    };

    that.updateData = function (data) {
      if (data) {
        let dom = '<ul class="footerul">';
        data.forEach(function (item) {
          dom += `<li class="${item.key}" data-key="${item.key}">${item.name}</li>`;
        });
        dom += "</ul>";
        domUtils.html(that.parentObj, dom);
        that._dom = domUtils.find(that.parentObj, ".footerul");
      }
      const currPage = data?.activeKey || activekey || that._app._stateManager._curPage._rtti;
      if (currPage == "MapStateBrowse") {
        that._dom.find("li").removeClass("on").eq(0).addClass("on");
      } else if (currPage == "DepartmentPage") {
        that._dom.find("li").removeClass("on").eq(1).addClass("on");
      } else {
        that._dom.find("li").removeClass("on").eq(2).addClass("on");
      }
    };
  };
  daxiapp["DXFooterNavi"] = daxiapp["DXFooterNaviComponent"] = DXFooterNavi; // 'DXFooterNaviComponent'为向后兼容别名

  /**
   * 底部导航组件 V2 - 带折叠按钮
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   * @param {boolean} disableStatus - 是否禁用状态切换
   * @param {string} activekey - 当前激活的页面标识
   */
  const DXFooterNavi2 = function (app, parentObject, disableStatus, activekey) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener, data) {
      that.data = data;
      that.listener = listener;
      that.injectComponentUI(data);
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (data) {
      const wrapperStart = '<ul class="footerul"><div class="btn_upDown"><i class="icon-triangle-up"></i></div>';
      const wrapperEnd = "</ul>";
      let dom = "";

      if (data) {
        data.forEach(function (item) {
          dom += `<li class="${item.key}" data-key="${item.key}">${item.name}</li>`;
        });
      } else if (that._app._config.footerNavi != false) {
        dom = `<li class="ridingPage"><i class="tkyIcon-chengche"></i>${window.langData?.["ridingpage:btntext"] || "乘车"}</li>`;
        dom += `<li class="transferPage"><i class="tkyIcon-huancheng"></i>${window.langData?.["transferpage:btntext"] || "换乘"}</li>`;
        dom += `<li class="outsationPage"><i class="tkyIcon-chuzhan"></i>${window.langData?.["outsationPage:btntext"] || "出站"}</li>`;
        dom += `<li class="stationServicePage"><i class="tkyIcon-czfw"></i>${window.langData?.["stationServicePage:btntext"] || "车站服务"}</li>`;
      }

      if (that._dom) {
        that._dom.html(dom);
        return;
      }
      dom = wrapperStart + dom + wrapperEnd;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".footerul");
    };

    that.changeLanguage = function (lang) {
      that.injectComponentUI(that.data);
    };

    that.injectComponentEvents = function () {
      const _dom = that.parentObj;

      domUtils.on(_dom, "click", "li", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onItemClicked?.(e.target.dataset);
        if (disableStatus) return;
      });

      domUtils.on(_dom, "click", ".ridingPage", function (e) {
        that.listener?.onRidingPageClicked?.();
      });

      domUtils.on(_dom, "click", ".transferPage", function (e) {
        that.listener?.onTransferPageClicked?.();
      });

      domUtils.on(_dom, "click", ".outsationPage", function (e) {
        that.listener?.onOutsationPageClicked?.();
      });

      domUtils.on(_dom, "click", ".stationServicePage", function (e) {
        that.listener?.onStationServicePageClicked?.();
      });

      domUtils.on(_dom, "click", ".btn_upDown", function (e) {
        const mainPoiSlide = $(this).parents(".mainPoiSlide");
        const icon = $(this).find("i");
        if (icon.hasClass("icon-triangle-up")) {
          icon.removeClass("icon-triangle-up").addClass("icon-triangle-down");
          mainPoiSlide.css({ top: "40px", "transition-duration": "0.3s" });
        } else {
          icon.removeClass("icon-triangle-down").addClass("icon-triangle-up");
          const clientHeight = document.body.clientHeight;
          const h1 = mainPoiSlide.find(".icon-container").height();
          const h2 = mainPoiSlide.find(".searchComponent3").height();
          const top = clientHeight - h1 - h2 - 60;
          mainPoiSlide.css({ top: `${top}px`, "transition-duration": "0.3s" });
        }
      });
    };

    that.updateData = function (data) {
      if (data) {
        let dom = '<ul class="footerul">';
        data.forEach(function (item) {
          dom += `<li class="${item.key}" data-key="${item.key}">${item.name}</li>`;
        });
        dom += "</ul>";
        domUtils.html(that.parentObj, dom);
        that._dom = domUtils.find(that.parentObj, ".footerul");
      }
    };
  };
  daxiapp["DXFooterNavi2"] = daxiapp["DXFooterNaviComponent2"] = DXFooterNavi2; // 'DXFooterNaviComponent2'为向后兼容别名

  /**
   * 医院/场馆信息视图组件
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXHospitalView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    /** 建筑类型对应的文本映射 */
    const _buildingTextMap = {
      library: { map: "图书馆地图", navi: "来馆导航" },
      station: { map: "车站地图", navi: "来站导航" },
      meeting: { map: "场馆地图", navi: "来馆导航" },
      factory: { map: "工厂地图", navi: "来厂导航" },
      general: { map: "地图", navi: "导航" },
      hospital: { map: "医院地图", navi: "来院导航" },
    };

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom = '<div class="hospitalContent"></div>';
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".hospitalContent");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".hospital-back", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onHospitalViewBackBtnClicked?.(that);
      });

      domUtils.on(that._dom, "click", ".hospital-jump", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onMapBtnClicked?.(that, this);
      });

      domUtils.on(that._dom, "click", ".goToHospital", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onGoToHospitalClicked?.(that, this);
      });
    };

    that.changeLanguage = function () {
      that.updateData(that.hospitalData);
    };

    that.updateData = function (hospitalData) {
      that.hospitalData = hospitalData;
      if (!hospitalData) return;

      const buildingType = that._app._config.buildingType || "hospital";
      let text = _buildingTextMap[buildingType]?.map || _buildingTextMap.hospital.map;
      let text2 = _buildingTextMap[buildingType]?.navi || _buildingTextMap.hospital.navi;

      // 多语言处理
      if (window.langData?.language && window.langData.language != "zh") {
        text = window.langData["map:text"] || "Map";
        const sceneTypeKey = `sceneType:${buildingType}`;
        if (window.langData[sceneTypeKey]) {
          text2 = window.langData["toBuilding:navi:text"]?.replace("{{sceneType}}", window.langData[sceneTypeKey]) || text2;
        }
      }

      const hos_hbs = `<div class="hospital-back"></div><div class="hospital-posters"><div class="carousel"><img src="{{hospitalData.img}}"></div></div><div class="hoslist"><div class="hoslistscroll">{{#each hospitalData.list}}<div class="hospital-address"><div class="hosbox"><div class="hosboxCon"><div>{{name}}</div><div class="hospital-jump" data-location="{{location}}"><i class="icon-map"></i>${text}</div></div><div><span><strong><i class="icon-ditu"></i>{{address}}</strong></span></div></div><button class="button primary circle goToHospital" data-location="{{location}}" data-name="{{name}}">${text2}</button></div>{{/each}}<div class="hospital-introduction">{{hospitalData.description}}</div></div></div>`;

      domUtils.templateText(hos_hbs, { hospitalData }, that._dom);
      that._dom.find(".hospital-introduction").html(hospitalData.description);
    };
  };
  daxiapp["DXHospitalView"] = daxiapp["DXHospitalViewComponent"] = DXHospitalView; // 'DXHospitalViewComponent'为向后兼容别名

  /**
   * 周边信息视图组件
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXAroundView = function (app, parentObject) {
    const that = this;
    that.markerArr = [];
    that.infoWindow = [];
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      domUtils.append(that.parentObj, '<div class="aroundContent"></div>');
      that._dom = domUtils.find(that.parentObj, ".aroundContent");
    };

    that.initMap = function (AroundData) {
      that.Amap = new AMap.Map("aroundAmap", {
        viewMode: "2D",
        zoom: AroundData.zoom,
        center: [AroundData.centerlon, AroundData.centerlat],
      });
    };

    that.openInfo = function (id, text, position) {
      const content = `<div class='input-card content-window-card'><div><h4>${text}</h4></div></div>`;
      const infoWindow = new AMap.InfoWindow({
        content,
        offset: new AMap.Pixel(0, -20),
      });
      infoWindow.open(that.Amap, position);
      that.infoWindow.push(infoWindow);
      that._dom.find(`.aroundPoiInfo.on li[data-id='${id}']`).addClass("on").siblings().removeClass("on");
    };

    that.addMarkers = function (data) {
      const markers = data.result.pois;
      const type = data.type;

      // 移除旧标记
      that.markerArr.forEach((marker) => that.Amap.remove(marker));
      that.markerArr = [];

      markers.forEach(function (item) {
        const location = item.location.split(",");
        const marker = new AMap.Marker({
          extData: item.id,
          icon: `../common_imgs/icon_around${type}.png`,
          position: location,
          text: item.name,
          offset: new AMap.Pixel(-10, -20),
        });
        that.Amap.add(marker);
        that.markerArr.push(marker);
        marker.on("click", function (e) {
          const { extData: id, text, position } = e.target._originOpts;
          that.openInfo(id, text, position);
        });
      });
      that.Amap.setFitView();
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".hospital-back", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onHospitalViewBackBtnClicked?.(that);
      });

      domUtils.on(that._dom, "click", ".aroundPoiInfo li", function (e) {
        if (domUtils.isFastClick()) return;
        const id = $(this).attr("data-id");
        const text = $(this).attr("data-name");
        const location = $(this).attr("data-location").split(",");
        that.openInfo(id, text, location);
      });

      domUtils.on(that._dom, "click", ".aroundPoi .tabs li", function (e) {
        if (domUtils.isFastClick()) return;
        const type = $(this).attr("data-type");
        const index = $(this).index();
        $(this).addClass("on").siblings().removeClass("on");
        that._dom.find(".aroundPoiInfo").removeClass("on").eq(index).addClass("on");

        const targetData = that.pageData.data.find((item) => item.type == type);
        if (targetData) that.addMarkers(targetData);

        // 关闭所有信息窗体
        that.infoWindow.forEach((item) => item.close());
        that.infoWindow = [];
      });
    };

    that.changeLanguage = function () {
      that.updateData(that.AroundData);
    };

    that.updateData = function (AroundData) {
      that.AroundData = AroundData;
      if (!AroundData) return;

      const distanceLabel = window.langData?.distance || "距离";
      const distanceTip = window.langData?.["reset:distance:tip"] || "约{{distance}}米";
      const hos_hbs = `<div class="hospital-back"></div><div id="aroundAmap"></div><div class="aroundPoi"><div class="tabs"><ul>{{#each AroundData}}<li data-type="{{type}}" {{#if on}} class="on"{{/if}}><i class="{{icon}}"></i>{{name}}</li>{{/each}}</ul></div>{{#each AroundData}}<div class="aroundPoiInfo {{#if on}} on{{/if}}"><ul>{{#each result.pois}}<li data-id="{{id}}" data-name="{{name}}" data-location="{{location}}"><div class="name">{{name}}</div><div class="distance">${distanceLabel}: ${distanceTip}</div><div class="detail">{{address}}</div></li>{{/each}}</ul></div>{{/each}}</div>`;

      AroundData.data[0].on = true;
      domUtils.templateText(hos_hbs, { AroundData: AroundData.data }, that._dom);
      that.initMap(AroundData);
      that.pageData = AroundData;
      that.addMarkers(that.pageData.data[0]);
    };
  };
  daxiapp["DXAroundView"] = daxiapp["DXAroundViewComponent"] = DXAroundView; // 'DXAroundViewComponent'为向后兼容别名

  /**
   * 反馈弹窗组件
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXFeedbackView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      domUtils.append(that.parentObj, '<div id="am-modal-feedback"></div>');
      that._dom = domUtils.find(that.parentObj, "#am-modal-feedback");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".am-modal-mask", () => that.hide());
      domUtils.on(that._dom, "click", ".close", () => that.hide());

      domUtils.on(that._dom, "click", ".errortype", function (e) {
        if (domUtils.isFastClick()) return;
        $(this).toggleClass("on");
      });

      domUtils.on(that._dom, "click", ".btn_submit", function (e) {
        if (domUtils.isFastClick()) return;
        const $poiItem = $(this).parents(".am-modal-wrap");

        // 收集错误类型
        const errorTypes = [];
        that._dom.find(".errortype.on").each(function () {
          errorTypes.push($(this).data("type"));
        });

        const poiInfo = {
          poiId: String($poiItem.data("poi") || ""),
          bdid: String($poiItem.data("bdid") || ""),
          floorId: String($poiItem.data("floorid") || ""),
          lon: $poiItem.data("lon"),
          lat: $poiItem.data("lat"),
          name: String($poiItem.data("name") || ""),
          address: String($poiItem.data("address") || ""),
          type: errorTypes.join(","),
          feedback: that._dom.find(".feedback").val(),
        };

        that.listener?.onSubmitBtnClicked?.(that, poiInfo);
        that.hide();
      });
    };

    that.changeLanguage = function () {
      that.updateData(that.data);
    };

    that.updateData = function (data) {
      that.data = data;
      if (!data) return;

      const langTexts = {
        title: _getLang("fankui:btntext", "报错反馈"),
        selectTip: _getLang("select:errortype:tip", "请选择报错类型（可多选）"),
        position: _getLang("error:postion:report:btntext", "位置报错"),
        route: _getLang("error:route:report:btntext", "路线报错"),
        address: _getLang("error:address:report:btntext", "地址报错"),
        other: _getLang("error:other:report:btntext", "其他报错"),
        placeholder: _getLang("holder:tip:report:desc", "请在这里输入反馈内容"),
        submit: _getLang("fankui:submit:btntext", "提交反馈"),
      };

      const hos_hbs = `<div><div class="am-modal-mask"></div><div class="am-modal-wrap" data-poi="{{data.poiId}}" data-bdid="{{data.bdid}}" data-floorid="{{data.floorId}}" data-lon="{{data.lon}}" data-lat="{{data.lat}}" data-name="{{data.name}}" data-address="{{data.address}}"><div class="am-modal am-modal-transparent"><div class="am-modal-content"><div class="am-modal-body"><div class="wrap"><div class="title"><span>${langTexts.title}</span><span class="close"><i class="icon-close"></i></span></div><img class="icon_feedback" src="../common_imgs/position.png"><span class="poiName">{{data.name}}</span><span class="poiAddress">{{data.address}}</span><p class="tip">${langTexts.selectTip}</p><div class="error-wrap"><div class="errortype" data-type="0">${langTexts.position}</div><div class="errortype" data-type="1">${langTexts.route}</div><div class="errortype" data-type="2">${langTexts.address}</div><div class="errortype" data-type="3">${langTexts.other}</div></div><p class="tip">${langTexts.title}</p><textarea class="feedback" maxlength="100" placeholder="${langTexts.placeholder}"></textarea><div class="btn_submit">${langTexts.submit}</div></div></div></div></div></div></div>`;

      domUtils.templateText(hos_hbs, { data }, that._dom);
    };

    that.hide = function () {
      that._dom?.hide();
    };

    that.show = function () {
      that._dom?.show();
    };
  };
  daxiapp["DXFeedbackView"] = daxiapp["DXFeedbackComponent"] = DXFeedbackView; // 'DXFeedbackComponent'为向后兼容别名

  /**
   * 评分弹窗组件
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXRatingView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    /** 评分等级对应的文本映射 */
    const _ratingTexts = [
      { key: "rather:disappointed:text:comment", default: "很失望～～" },
      { key: "feel:bad:text:comment", default: "不舒服～～" },
      { key: "ordinary:text:comment", default: "一般吧～～" },
      { key: "well:text:comment", default: "还不错～～" },
      { key: "great:text:comment", default: "非常棒～～" },
    ];

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      domUtils.append(that.parentObj, '<div id="am-modal-rote"></div>');
      that._dom = domUtils.find(that.parentObj, "#am-modal-rote");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".am-modal-mask", () => that.hide());

      domUtils.on(that._dom, "click", ".rote > span", function (e) {
        if (domUtils.isFastClick()) return;
        const index = $(this).index();
        that._dom.find(".rote > span").each(function (i) {
          $(this).toggleClass("on", i <= index);
        });
        const ratingItem = _ratingTexts[index];
        that._dom.find(".roteText").text(_getLang(ratingItem.key, ratingItem.default));
      });

      domUtils.on(that._dom, "click", ".btn_submit", function (e) {
        if (domUtils.isFastClick()) return;
        const selectedCount = that._dom.find(".rote > span.on").length;
        if (selectedCount == 0) {
          domUtils.showInfo(_getLang("comment:tilte", "请选择评价星级!"));
          return;
        }
        that.listener?.onSubmitBtnClicked?.(selectedCount);
        that.hide();
      });
    };

    that.changeLanguage = function () {
      that.updateData(that.data);
    };

    that.updateData = function (data) {
      that.data = data;
      if (!data) return;

      const title = _getLang("comment:tilte", "欢迎对本次导航评价");
      const submitText = _getLang("comment:tilte", "提交评价");
      const starsHtml = '<span><i class="icon-star"></i></span>'.repeat(5);
      const hos_hbs = `<div><div class="am-modal-mask"></div><div class="am-modal-wrap" data-poi="{{data.poiId}}" data-bdid="{{data.bdid}}" data-floorid="{{data.floorId}}" data-lon="{{data.lon}}" data-lat="{{data.lat}}" data-name="{{data.name}}" data-address="{{data.address}}"><div class="am-modal am-modal-transparent"><div class="am-modal-content"><div class="am-modal-body"><div class="wrap"><img class="icon_rote" src="../common_imgs/littlePro.png"><span class="rote_title">${title}</span><div class="rote">${starsHtml}</div><div class="roteText"></div></div></div><div class="am-modal-footer"><div class="btn_submit">${submitText}</div></div></div></div></div></div>`;

      domUtils.templateText(hos_hbs, { data }, that._dom);
    };

    that.hide = function () {
      that._dom?.hide();
    };

    that.show = function () {
      that._dom?.show();
    };
  };
  daxiapp["DXRatingView"] = daxiapp["DXRoteComponent"] = DXRatingView; // 'DXRoteComponent'为向后兼容别名

  /**
   * 头部导航组件
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXHeader = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom =
        '<header class="header-wrapper"><ul class="dx_header"><li class="goback icon-back icon-fanhui"></li><li class="header"><span class="header title"></span></li></ul>';
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".header-wrapper");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".goback", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onBackBtnClicked?.(that);
      });
    };

    that.updateData = function (text) {
      that._dom.find(".title").text(text);
    };

    that.updateTitle = function (text) {
      that._dom.find(".title").text(text);
    };
  };
  daxiapp["DXHeader"] = daxiapp["DXHeaderComponent"] = DXHeader; // 'DXHeaderComponent'为向后兼容别名

  /**
   * POI快捷入口导航栏组件
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXShortcutBar = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.updateData = function (bdid, footerData) {
      that.bdid = bdid;
      if (!footerData) return;

      const nav_bar_hbs =
        '<ul class="nav_bar">{{#each bottom_Nav_bar_Data}}<li class="nav_bar_btn common_btn" {{#if command}} data-method={{command.funcName}} {{#if command.keyword}} data-keyword="{{command.keyword}}" {{/if}} {{#if command.perItemCount}} data-itemcount={{command.perItemCount}} {{/if}} {{#if command.poiIds}}data-poiids={{command.poiIds}}{{/if}} data-arealtype={{command.arealType}} data-save={{command.saveStack}} {{else}} data-method="showPois" data-keyword={{command.keyword}} data-areatype="indoor" data-save=true{{/if}} data-name="{{name}}" data-type="{{type}}"><span class="nav_item {{icon}}">{{name}}</span></li>{{/each}}';
      domUtils.templateText(nav_bar_hbs, { bottom_Nav_bar_Data: footerData }, that.$navBarWrapper);
    };

    that.injectComponentUI = function () {
      domUtils.append(that.parentObj, '<div class="nav_bar_wapper"></div>');
      that.$navBarWrapper = domUtils.find(that.parentObj, ".nav_bar_wapper");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that.$navBarWrapper, "click", ".nav_bar_btn", function (e) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);

        const data = {
          bdid: that.bdid,
          arealType: $this.data("arealtype") || "indoor",
          method: $this.data("method"),
          keyword: String($this.data("keyword") || ""),
          perItemCount: $this.data("itemcount"),
          poiIds: String($this.data("poiids") || ""),
          name: $this.data("name"),
          type: ($this.data("arealtype") || "indoor") == "indoor" ? 1 : 11,
        };

        that.listener?.onSelectItemAtIndexPath?.(that, data);
      });
    };

    return that;
  };
  daxiapp["DXShortcutBar"] = daxiapp["DXPoiShortcutView"] = DXShortcutBar; // 'DXPoiShortcutView'为向后兼容别名

  /**
   * 列表基类组件
   * 提供通用的列表渲染、事件绑定、状态管理功能
   */
  const DXListBase = (function () {
    const DXListBaseImpl = function (parentDom) {
      const thisObject = this;
      this.parentDom = parentDom;
      thisObject._type = "DXListBase";
      thisObject._isVisible = true;
      thisObject._dom = null;
    };

    const DXListBase_proto = DXListBaseImpl.prototype;

    DXListBase_proto.init = function (listener, wrapperdom, renderTml, listSelector, dataKey, itemSelector) {
      this.renderTml = renderTml || this.initTmp();
      this.listener = listener;
      this.dataViewSelector = listSelector;
      this.dataKey = dataKey || "resultList";
      this.itemSelector = itemSelector || "list-item";
      this.injectComponentUI(wrapperdom);
      this.injectComponentEvents();
    };

    DXListBase_proto.initTmp = function () {
      const emptyTip = _getLang("empty:tip2:search", "没有查到相关结果");
      this.renderTml = `{{#eq resultList.length 0}}<div class="empty-state">{{#if tipMessage}}{{tipMessage}}{{else}}${emptyTip}{{/if}}</div>{{/eq}}{{#gt resultList.length 0}}<div class="list-view"><div class="list-items">{{#each resultList}}<div class="list-item" data-id="{{id}}" {{#if name}} data-name="{{name}}" data-extendinfo="{{extendInfo}}"><p class="item-info"><p class="info-main">{{#if name}}{{name}}{{else}}{{text}}{{/if}}</p><p class="extend">{{address}}}</p></p><p class="state"></p></div></div>{{/each}}</div>{{/gt}}`;
      return this.renderTml;
    };

    DXListBase_proto.changeLanguage = function () {
      this.initTmp();
      this.rerender(this.data);
    };

    DXListBase_proto.injectComponentUI = function (wrapperdom) {
      if (!wrapperdom) {
        wrapperdom =
          '<div class="list-widget ui-panel" style="display:block;"><div class="slide-widget-scroller ui-panel" style="overflow-y: scroll;"><div class="genre-list"></div></div></div>';
        this.dataViewSelector = ".genre-list";
      }
      this._dom = domUtils.geneDom(wrapperdom);
      if (this.parentDom) {
        domUtils.append(this.parentDom, this._dom);
      }
    };

    DXListBase_proto.injectComponentEvents = function () {
      const thisObject = this;
      this._dom.on("click", ".list-item", function (event) {
        const curItem = event.currentTarget;
        thisObject.parentDom.scrollTo({ toT: curItem.offsetTop - curItem.parentNode.offsetTop });
        if (thisObject.listener?.onItemClicked) {
          thisObject.setActiveByItem(curItem);
          thisObject.listener.onItemClicked(thisObject, thisObject.getData(curItem));
        }
      });
    };

    DXListBase_proto.getData = function (dom) {
      return dom.dataset;
    };

    DXListBase_proto.getParent = function () {
      return this.parentDom;
    };

    DXListBase_proto.show = function () {
      this._dom.show();
    };

    DXListBase_proto.hide = function () {
      this._dom.hide();
    };

    DXListBase_proto.rerender = function (data) {
      this.data = data;
      const renderData = Array.isArray(data) ? { [this.dataKey]: data } : data;
      domUtils.templateText(this.renderTml, renderData, this._dom.find(this.dataViewSelector));
      this.hideLoading();
    };

    DXListBase_proto.showLoading = function () {
      const imageUrl = window.loadingImgGif || "./../common_imgs/loading.gif";
      this._dom.find(this.dataViewSelector).html(`<p class="loading" style="margin:0 auto"><img src="${imageUrl}" style="height: 90%;max-height:66px;"></p>`);
      this._dom.show();
      this.listener?.viewStateChanged?.(this, { state: "hideList", viewHeight: 44 });
    };

    DXListBase_proto.hideLoading = function () {
      domUtils.show(this._dom, ".loading", false);
    };

    DXListBase_proto.showErrorText = function (data) {
      const textDom = domUtils.find(this._dom, this.dataViewSelector);
      textDom.html(`<div class="empty-state" style="color:#027fe7;font-size:1.4rem;">${data.tip}</div>`);
      this.listener?.viewStateChanged?.(this, { state: "hideList", viewHeight: 44 });
    };

    DXListBase_proto.clearData = function () {
      domUtils.find(this._dom, this.dataViewSelector).html("");
    };

    DXListBase_proto.setActiveByIndex = function (index) {
      const listItems = domUtils.find(this._dom, this.itemSelector);
      if (listItems.length > index) {
        listItems.eq(index).addClass("active").siblings().removeClass("active");
      }
    };

    DXListBase_proto.triggerActiveByKey = function (key, value) {
      const item = domUtils.find(this._dom, `${this.itemSelector}[data-${key}="${value}"]`);
      item.trigger("click");
    };

    DXListBase_proto.triggerActiveBySelector = function (selector) {
      const item = domUtils.find(this._dom, this.itemSelector + selector);
      item.trigger("click");
    };

    DXListBase_proto.setActiveByItem = function (item) {
      $(item).addClass("active").siblings().removeClass("active");
    };

    DXListBase_proto.triggerSelectedItemByIndex = function (index) {
      const listItems = domUtils.find(this._dom, this.itemSelector);
      if (listItems.length > index) {
        listItems.eq(index).trigger("click");
      }
    };

    return DXListBaseImpl;
  })();
  daxiapp["DXListBase"] = DXListBase;

  /**
   * 带详情的POI列表组件
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   * @param {Object} options - 配置项
   */
  const DXPoiResultView = function (app, parentObject, options) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.statesArr = ["showList", "showHide", "showNone"];
    that.reslist = null;
    that.state = "";
    that.status = false;
    that.isActivePage = false;
    that.viewDataPose = null;
    that.UITemplate = "";
    that.itemHeight = 54;
    that.singleMargin = 5;

    let genreListShowHtml;
    that.list_message_tip = _getLang("no:success:located", "未获取到当前位置");

    that.initTmp = function () {
      that.list_message_tip = _getLang("no:success:located", "未获取到当前位置");

      const detailBtnStr = options?.noDetail
        ? ""
        : `<span data-detail="{{detailed}}" class="genre-item-godetail detail"><i class="icon_gb-detail"></i><span>${_getLang(
            "detail:btntext",
            "详情",
          )}</span></span>`;

      const arBtnStr = options?.showAR
        ? `<span class="genre-item-goar detail"><i class="icon-compass"></i><span>AR${_getLang("route:btntext", "导航")}</span></span>`
        : "";
      const routeBtnName = options?.routeBtnName || _getLang("route:btntext", "路线");
      const routeBtn = options?.noRoute ? "" : `<div class="genre-item-gohere"><i class="icon_gb-line"></i><span>${routeBtnName}</span></div>`;
      const routeBtnStr = arBtnStr + routeBtn;

      const emptyTip = _getLang("empty:tip2:search", "没有查到相关结果");
      const locationTip = _getLang("no:success:located", "未获取到当前位置");
      const distanceHtml = options?.hideDistance ? "" : '{{#if ../hideDis}} {{else}}<span class="genre-distance">{{distanceDes}}</span>{{/if}}';
      const actionBtns = options?.firstRoute ? routeBtnStr + detailBtnStr : detailBtnStr + routeBtnStr;

      genreListShowHtml = `{{#eq resultList.length 0}}<div class="empty-state">{{#if tipMessage}}{{tipMessage}}{{else}}${emptyTip}{{/if}}</div>{{/eq}}{{#gt resultList.length 0}}<div class="genre-list-show">{{#gt resultList.length 1}}<div class="genre-list-top"><div class="genre-list-message"><div class="info">${locationTip}</div></div></div>{{/gt}}<div class="genre-list-items">{{#each resultList}}<div class="genre-list-item poi-list-item" data-poi="{{poiId}}" data-bdid="{{#if bdid}}{{bdid}}{{/if}}" data-floorid="{{floorId}}" {{#if viewType}}data-viewtype="{{viewType}}"{{/if}} {{#if code}}data-code="{{code}}"{{/if}} {{#if type}}data-type="{{type}}"{{/if}} data-lon={{lon}} data-lat={{lat}} {{#if text}}data-name="{{text}}" {{else}}data-name="{{title}}" {{/if}} data-address="{{address}}" data-extendinfo="{{extendInfo}}" data-label="{{label}}" data-detailed="{{detailed}}" data-detailtype="{{poiDetailType}}" {{#if extenddata}}data-extenddata="{{extenddata}}"{{/if}}{{#if category}}data-category="{{category}}"{{/if}}><div class="genre-item"><div class="icon-mypos"></div><div class="genre-info"><div class="genre-name">{{text}}{{#if label}}<span class="genre-wuzhangai">{{label}}</span>{{/if}}</div><div class="external_info">${distanceHtml}<span class="genre-address">{{address}}</span></div></div>${actionBtns}</div></div>{{/each}}</div>{{/gt}}`;
    };

    that.changeLanguage = function () {
      this.initTmp();
    };

    that.init = function (listener) {
      that.listener = listener;
      that.initTmp();
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      wrapperdom =
        wrapperdom ||
        '<div class="search-list-widget ui-panel" id="slide-poi-list2" style="display:block;box-shadow: -1px -1px 2px #e7e7e7;"><div class="slide-widget-scroller ui-panel" style="overflow-y: scroll;"><div id="genre-list" class="genre-list"></div></div></div></div>';
      domUtils.append(that.parentObj, wrapperdom);
      that._dom = that.parentObj.find(".search-list-widget");
    };

    that.injectComponentEvents = function () {
      // 点击列表项
      that._dom.on("click", ".genre-list-item", function (event) {
        const targetClassName = event.target.className;
        if (targetClassName.indexOf("genre-item-gohere") != -1 || targetClassName.indexOf("genre-item-godetail") != -1) return;
        that.setActiveItem($(this));
      });

      // AR按钮点击
      that._dom.on("click", ".genre-item-goar", function (event) {
        if (domUtils.isFastClick()) return;
        const $poiItem = $(this).parents(".genre-list-item");
        const poiInfo = _getPoiData($poiItem);
        that.listener?.showAR?.(that, poiInfo);
        event.stopPropagation();
      });

      // 路线按钮点击
      that._dom.on("click", ".genre-list-item .genre-item-gohere", function (event) {
        if (domUtils.isFastClick()) return;
        const $poiItem = $(this).parents(".genre-list-item");
        const poiInfo = _getPoiData($poiItem);
        that.listener?.onTakeToThere?.(that, poiInfo);
        event.stopPropagation();
      });

      // 详情按钮点击
      that._dom.on("click", ".genre-list-item .genre-item-godetail", function (event) {
        if (domUtils.isFastClick()) return;
        const $poiItem = $(this).parents(".genre-list-item");
        const baseData = _getPoiData($poiItem);
        const poiInfo = {
          funcName: "showPoiDetail",
          ...baseData,
          id: baseData.poiId,
          text: baseData.name,
          poiType: "indoor",
          label: $poiItem.data("label") || "",
          detailtype: $poiItem.data("detailtype") || "0",
          detailed: $poiItem.data("detailed") || "0",
          extendInfo: $poiItem.data("extendinfo") || "",
          viewType: $poiItem.data("viewtype") || "",
          type: $poiItem.data("type") || "",
        };
        if ($poiItem.data("extenddata")) {
          poiInfo.data = $poiItem.data("extenddata");
        }
        that.listener?.onSelectItemDetail?.(that, poiInfo);
        event.stopPropagation();
      });

      // 展开收缩
      that._dom.on("click", ".genre-list-top", function (e) {
        const $parent = $(this).parents(".genre-list-show");
        if ($parent.hasClass("genre-list-hide")) {
          that.showList();
          $parent.removeClass("genre-list-hide");
          that.scrollToItem($parent.find(".genre-list-items .active"));
          that._dom.find(".genre-list-message .info").text(that.list_message_tip);
        } else {
          that.hideList();
          $parent.addClass("genre-list-hide");
          that._dom.find(".genre-list-message .info").text(_getLang("open:result:tip:search", "点击查看搜索结果"));
        }
      });

      // 触摸滚动控制
      let lastMoveY;
      that._dom.on("touchstart", ".genre-list-items", function (e) {
        lastMoveY = e.touches[0].clientY;
        e.canScroll = true;
      });
      that._dom.on("touchmove", ".genre-list-items", function (e) {
        const currentY = e.touches[0].clientY;
        window.event.canScroll = currentY - lastMoveY <= 0 || $(this).scrollTop() > 1;
        lastMoveY = currentY;
      });
    };

    that.scrollToItem = function ($poiItem) {
      const $genre_list_items = domUtils.find(that._dom, ".genre-list-show").find(".genre-list-items");
      const top = $poiItem.index() * (that.itemHeight + that.singleMargin);
      $genre_list_items.scrollTo({ toT: top });
    };

    that.setActiveItem = function ($poiItem) {
      that._scroller?.stopScroll?.();
      that.listener?.onSelectItemAtIndexPath?.(that, that.getPoiData($poiItem));
      $poiItem.addClass("active").siblings().removeClass("active");
      that.scrollToItem($poiItem);
    };

    that.onlySetItemActiveByIndex = function (index) {
      const doms = domUtils.find(that._dom, ".poi-list-item");
      if (doms.length == 0) return;
      const $poiItem = doms.eq(index);
      $poiItem.addClass("active").siblings().removeClass("active");
      const top = $poiItem.index() * (that.itemHeight + that.singleMargin);
      that._dom.find(".genre-list-items").scrollTop(top);
      return that.getPoiData($poiItem);
    };

    that.onlySetItemActiveById = function (id) {
      const doms = domUtils.find(that._dom, ".poi-list-item");
      if (doms.length == 0) return;
      const $poiItem = domUtils.find(that._dom, `.poi-list-item[data-poi='${id}']`);
      $poiItem.addClass("active").siblings().removeClass("active");
      const top = $poiItem.index() * (that.itemHeight + that.singleMargin);
      that._dom.find(".genre-list-items").scrollTop(top);
      return that.getPoiData($poiItem);
    };

    that.getPoiData = function ($poiItem) {
      return _getPoiData($poiItem);
    };

    that.setActiveById = function (id) {
      that.setActiveItem(domUtils.find(that._dom, `.poi-list-item[data-poi='${id}']`));
    };

    that.setActiveByIndex = function (index) {
      const doms = domUtils.find(that._dom, ".poi-list-item");
      if (doms.length > 0) that.setActiveItem(doms.eq(index));
    };

    that.updateData = function (data, opts) {
      that.data = data;
      const renderData = { resultList: data };
      data?.forEach(function (item) {
        if (typeof item.data == "object") {
          item.extenddata = JSON.stringify(item.data);
        }
      });
      for (const key in opts) {
        renderData[key] = opts[key];
      }
      domUtils.templateText(genreListShowHtml, renderData, that._dom.find(".genre-list"));
      that._dom.find(".genre-list-message .info").text(that.list_message_tip);
      if (data?.length) that.showList();
    };

    that.updateTitle = function (text) {
      domUtils.find(that._dom, ".info").text(text);
      that.list_message_tip = text;
    };

    that.showLoading = function () {
      that._dom.find(".genre-list").html('<p class="loading"></p>');
      that._dom.show();
      that.listener?.viewStateChanged?.(that, { state: "hideList", viewHeight: 44 });
    };

    that.hideLoading = function () {
      domUtils.show(that._dom, ".loading", false);
    };

    that.showErrorText = function (data) {
      domUtils.find(that._dom, ".genre-list").html(`<div class="empty-state" style="color:#027fe7;font-size:1.4rem;">${data.tip}</div>`);
      that.listener?.viewStateChanged?.(that, { state: "hideList", viewHeight: 44 });
    };

    that.hide = function () {
      that._dom.hide();
    };

    that.hideList = function () {
      domUtils.show(domUtils.find(that._dom, ".genre-list-items"), false);
      that.listener?.viewStateChanged?.(that, { state: "hideList", viewHeight: 30 });
    };

    that.showList = function () {
      const num = options?.lineNum || 4;
      that._dom.show();
      domUtils.show(that._dom.find(".genre-list-items"), true);
      if (that.listener?.viewStateChanged) {
        const dataCount = that.data.length;
        const viewHeight = dataCount > num - 1 ? (that.itemHeight + that.singleMargin) * num + 36 : (that.itemHeight + that.singleMargin) * dataCount + 36;
        that.listener.viewStateChanged(that, { state: "showList", viewHeight });
      }
    };

    that.getHeight = function () {
      return that._dom.height();
    };
  };
  daxiapp["DXPoiResultView"] = DXPoiResultView;

  /**
   * POI详情视图组件
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   * @param {boolean} showShare - 是否显示分享按钮
   */
  const DXPoiDetailView = function (app, parentObject, showShare) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.state = "";
    that.status = false;
    that.isActivePage = false;
    that.viewDataPose = null;
    that.UITemplate = "";

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      wrapperdom = wrapperdom || '<div class="selected-poi-widget ui-panel" class="detail-poiinfo"></div></div>';
      domUtils.append(that.parentObj, wrapperdom);
      that._dom = domUtils.find(that.parentObj, ".selected-poi-widget");
    };

    that.injectComponentEvents = function () {
      that._dom.on("click", ".go-selected-pos", function (event) {
        if (domUtils.isFastClick()) return;
        const poiInfo = _getPoiData($(this).parents(".genre-poi-detail"));
        that.listener?.onTakeToThere?.(that, poiInfo);
      });

      that._dom.on("click", ".share", function (event) {
        if (domUtils.isFastClick()) return;
        const $poiItem = $(this).parents(".genre-poi-detail");
        const poiInfo = _getPoiData($poiItem);
        that.listener?.onShareBtnClicked?.(that, poiInfo);
      });

      that._dom.on("click", ".favorite", function () {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        const favoriteId = $this.attr("data-favoriteid");
        const poiInfo = _getPoiData($this.parents(".genre-poi-detail"));

        if (that.listener?.onShareBtnClicked) {
          if ($this.hasClass("active")) {
            poiInfo.favoriteId = favoriteId;
            that.listener.onRemoveFavoriteBtnClicked?.(that, poiInfo);
          } else {
            that.listener.onFavoriteBtnClicked?.(that, poiInfo);
          }
        }
      });

      that._dom.on("click", ".poiImg", function () {
        if (domUtils.isFastClick()) return;
        that.listener?.onPoiImgBtnClicked?.(that, $(this).attr("data-poiimg"));
      });
    };

    that.updateData = function (data) {
      const poiInfo = data.poiInfo;
      const showFavorite = data.showFavorite || "";
      const poiImg = data.poiImg || "";
      const favoriteId = data.favoriteId || "";
      const isFavorited = data.isFavorited || false;
      const poiId = poiInfo.poiId || poiInfo.id || poiInfo.featureId || "";
      const label = poiInfo.label;
      const floorId = poiInfo.floorId || "";
      const address = poiInfo.address || "";
      const floorName = poiInfo.floorName || "";
      const bdid = poiInfo.bdid || "";
      const extendInfo = poiInfo.extendInfo || "";
      const extendInfoArr = extendInfo ? extendInfo.split(",") : null;

      const routeText = _getLang("route:btntext", "路线");
      const collectText = _getLang("collect:text", "收藏");
      const labelHtml = label ? `<span class="genre-wuzhangai">${label}</span>` : "";
      const floorHtml = address.indexOf(floorName) == -1 ? `<span class="genre-floor">${floorName}</span>` : "";

      let detailPosInfo = `<div class="genre-item-info"><div class="genre-poi-detail" data-poi="${poiId}" data-bdid="${bdid}" data-floorid="${floorId}" data-lon=${
        poiInfo.lon
      } data-lat=${poiInfo.lat} data-name="${
        poiInfo.text || ""
      }" data-address="${address}"><div class="genre-item"><div class="icon-mypos"></div><div class="genre-info"><div class="genre-name">${
        poiInfo.text
      }${labelHtml}</div><div class="external_info" style="color: var(--themeLightBtnFontColor,#666);">${floorHtml}<span class="genre-address">${address}</span></div></div>`;

      if (!showFavorite) {
        if (poiImg) detailPosInfo += `<div class="icon-image1 poiImg" data-poiimg="${poiImg}" style="margin-right:16px;line-height:1.5;color:#fff"></div>`;
        if (showShare) detailPosInfo += '<div class="icon-share icon-button go-share share" style="margin-right:16px;line-height:1.5;color:#fff"></div>';
        detailPosInfo += `<div class="go-selected-pos icon-zhixing-right"><span class="gohere">${routeText}</span></div>`;
      } else {
        const favoriteActive = isFavorited ? "active" : "";
        detailPosInfo += `</div><div class="genre-item2"><div class="favorite ${favoriteActive}" data-favoriteid="${favoriteId}"><i class="icon-shoucang"></i><span>${collectText}</span></div>`;
        if (showShare) detailPosInfo += '<div class="go-share2 share"><i class="icon-share"></i><span class="text">分享</span></div>';
        detailPosInfo += `<div class="go-selected-pos icon-zhixing-right"><span class="gohere">${routeText}</span></div></div>`;
      }
      detailPosInfo += "</div></div>";

      // 详情扩展内容
      const detailed = data.detailed;
      if (detailed) {
        if (extendInfoArr) {
          detailPosInfo += '<div class="poiDetailExtend" class="detail_extend">';
          extendInfoArr.forEach((text) => {
            detailPosInfo += `<span class='poi_desc_desc'>${text}</span>`;
          });
          detailPosInfo += "</div>";
        } else if (detailed.indexOf("http") != -1) {
          detailPosInfo += '<div class="poiDetailExtend" class="detail_extend"><p class="loading"></p></div>';
          that.loadingExtend(detailed);
        } else {
          let detailContent = detailed;
          if (detailed.indexOf("script") == -1) {
            detailContent = window.atob(detailed);
          }
          if (detailContent.indexOf("%3C") != -1) {
            detailContent = decodeURIComponent(detailContent);
          }
          detailPosInfo += `<div class="poiDetailExtend" class="detail_extend">${detailContent}</div>`;
        }
      }
      detailPosInfo += "</div>";

      that._dom.html(detailPosInfo);
      that.listener?.viewStateChanged?.(that, { viewHeight: that._dom.height() + 20 });
    };

    that.hide = function () {
      domUtils.show(that._dom, false);
    };

    that.show = function () {
      domUtils.show(that._dom, true);
    };

    that.updateFavoriteStatus = function (status) {
      domUtils.find(that._dom, ".favorite").toggleClass("active", status);
    };
  };
  daxiapp["DXPoiDetailView"] = daxiapp["DXPoiDetialView"] = DXPoiDetailView; // 'DXPoiDetialView'为向后兼容别名（修正拼写错误）

  /**
   * POI详情视图组件 V2 - 带评价和反馈功能
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   * @param {Object} options - 配置项
   */
  const DXPoiDetailView2 = function (app, parentObject, options) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.state = "";
    that.status = false;
    that.isActivePage = false;
    that.viewDataPose = null;
    that.UITemplate = "";
    that.detailParams = null;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      wrapperdom = wrapperdom || '<div class="poiDetaiComment"></div>';
      domUtils.append(that.parentObj, wrapperdom);
      that._dom = domUtils.find(that.parentObj, ".poiDetaiComment");
    };

    that.injectComponentEvents = function () {
      that._dom.on("click", ".gotoThere", function (event) {
        if (domUtils.isFastClick()) return;
        const poiInfo = _getPoiData($(this));
        that.listener?.onTakeToThere?.(that, poiInfo);
      });

      that._dom.on("click", ".gotoThere_ar", function (event) {
        if (domUtils.isFastClick()) return;
        const $poiItem = $(this);
        const poiInfo = _getPoiData($poiItem);
        that.listener?.showAR?.(that, poiInfo);
      });

      that._dom.on("click", ".sharePoi", function (event) {
        if (domUtils.isFastClick()) return;
        const $poiItem = $(this).parents(".poiDetaiComment").find(".gotoThere");
        const poiInfo = getPoiBaseData($poiItem);
        that.listener?.onShareBtnClicked?.(that, poiInfo);
      });

      that._dom.on("click", ".favoritePoi", function () {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        const $poiItem = $this.parents(".poiDetaiComment").find(".gotoThere");
        const poiInfo = _getPoiData($poiItem);

        if (that.listener?.onShareBtnClicked) {
          if ($this.hasClass("active")) {
            poiInfo.favoriteId = $poiItem.attr("data-favoriteid");
            that.listener.onRemoveFavoriteBtnClicked?.(that, poiInfo);
          } else {
            that.listener.onFavoriteBtnClicked?.(that, poiInfo);
          }
        }
      });

      that._dom.on("click", ".poiImg", function () {
        if (domUtils.isFastClick()) return;
        that.listener?.onPoiImgBtnClicked?.(that, $(this).attr("data-poiimg"));
      });

      that._dom.on("click", ".feedbackPoi", function () {
        const $poiItem = $(this).parents(".poiDetaiComment").find(".gotoThere");
        that.listener?.onFeedbackPoiBtnClicked?.(that, _getPoiData($poiItem));
      });

      that._dom.on("click", ".ratePoi", function () {
        that.listener?.onRatePoiBtnClicked?.(that, {});
      });

      that._dom.on("click", ".more-btn", function () {
        if (domUtils.isFastClick()) return;
        that.listener?.moreClick?.(that, that.detailParams);
      });
    };

    that.updateData = function (data) {
      that.detailParams = null;
      const poiInfo = data.poiInfo;
      const isFavorited = data.isFavorited || false;
      const favoriteId = data.favoriteId || "";
      const poiId = poiInfo.poiId || poiInfo.id || poiInfo.featureId || "";
      const floorId = poiInfo.floorId || "";
      const address = poiInfo.address || "";
      const floorName = poiInfo.floorName || "";
      const bdid = poiInfo.bdid || "";
      const code = poiInfo.code || "";
      const detailed = poiInfo.detailed;
      const hasAr = options?.showAR ? "hasAr" : "";
      const poiText = poiInfo.text || "";

      const commonDataAttrs = `data-code="${code}" data-poi="${poiId}" data-bdid="${bdid}" data-floorid="${floorId}" data-lon=${poiInfo.lon} data-lat=${poiInfo.lat} data-name="${poiText}" data-address="${address}"`;

      let detailPosInfo = `<div class="gotoThere ${hasAr}" ${commonDataAttrs} data-favoriteid="${favoriteId}" data-detailed="${detailed}"></div>`;

      if (options?.showAR) {
        detailPosInfo += `<div class="gotoThere_ar" ${commonDataAttrs} data-favoriteid="${favoriteId}" style=""><img class="ar-navi-icon" src="../common_imgs/AR.svg" style="width: 50%;height: 50%;"><span class="ar-navi-tip" style="font-size:0.7rem">AR${_getLang(
          "route:btntext",
          "导航",
        )}</span></div>`;
      }

      const floorHtml = address.indexOf(floorName) == -1 ? `<span class="genre-floor">${floorName}</span>` : "";
      detailPosInfo += `<div class="poiDetailContent"><div class="poiInfos"><div class="poiname">${poiText}</div><div class="poiaddress"><span class="genre-address">${address}</span>${floorHtml}</div><div class="poiDetailBox"><div class="poiDetail"></div><div class="more-btn">更多</div></div></div><div class="editPoi"><div class="sharePoi"><span><i class="icon-fenxiang"></i></span><span>${_getLang(
        "sharepos:text",
        "位置分享",
      )}</span></div>`;

      detailPosInfo += `<div class="favoritePoi ${isFavorited ? "active" : ""}"><span><i class="icon-shoucang"></i></span><span>${_getLang(
        "collect:text",
        "收藏",
      )}</span></div>`;

      if (that._app._config.feedbackPoi != false) {
        detailPosInfo += `<div class="feedbackPoi"><span><i class="icon-yijianfankui"></i></span><span>${_getLang("fankui:btntext", "报错反馈")}</span></div>`;
      }

      if (that._app._config.ratePoi != false) {
        detailPosInfo += `<div class="ratePoi"><span><i class="icon-fankui"></i></span><span>${_getLang("satisfaction:evaluation", "满意度评价")}</span></div>`;
      }

      detailPosInfo += "</div></div>";
      that._dom.html(detailPosInfo);
      that.listener?.viewStateChanged?.(that, { viewHeight: that._dom.height() + 14 });
    };

    that.hide = function () {
      domUtils.show(that._dom, false);
    };

    that.show = function () {
      domUtils.show(that._dom, true);
    };

    that.updateFavoriteStatus = function (status) {
      domUtils.find(that._dom, ".favoritePoi").toggleClass("active", status);
    };

    that.updateDetail = function (data, detailType) {
      const poiDetailBox = that._dom.find(".poiInfos .poiDetailBox");
      const poiDetail = that._dom.find(".poiInfos .poiDetail");
      const moreBtn = that._dom.find(".poiInfos .more-btn");
      moreBtn.text(data.btnText || "更多");

      const dtType = detailType || data.detailType;
      if (dtType == 1 && data.detail) {
        poiDetail.html(data.detail);
      }
      if (dtType == 3) {
        data.detail = JSON.parse(data.detail);
        moreBtn.addClass("float_rightbtn");
      } else {
        moreBtn.removeClass("float_rightbtn");
      }

      that.detailParams = data;
      if (!data.detailType) data.detailType = dtType;

      if (poiDetail.height() > poiDetailBox.height() || dtType == 3) {
        moreBtn.show();
      } else {
        moreBtn.hide();
      }
    };
  };
  daxiapp["DXPoiDetailView2"] = daxiapp["DXPoiDetialView2"] = DXPoiDetailView2; // 'DXPoiDetialView2'为向后兼容别名（修正拼写错误）

  /**
   * POI详情视图组件 V3 - 华为场景定制版
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   * @param {Object} options - 配置项
   */
  const DXPoiDetailView3 = function (app, parentObject, options) {
    const that = this;
    let sherePoiInfobyHW = null;
    that._app = app;
    const imgURL = "./images/share.svg";
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.state = "";
    that.status = false;
    that.isActivePage = false;
    that.viewDataPose = null;
    that.UITemplate = "";

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      wrapperdom = wrapperdom || '<div class="poiDetaiComment"></div>';
      domUtils.append(that.parentObj, wrapperdom);
      that._dom = domUtils.find(that.parentObj, ".poiDetaiComment");
    };

    that.injectComponentEvents = function () {
      that._dom.on("click", ".bnt_blue", function (event) {
        if (domUtils.isFastClick()) return;
        const poiInfo = _getPoiData($(this));
        that.listener?.onTakeToThere?.(that, poiInfo);
      });

      that._dom.on("click", ".sharePoi", function (event) {
        if (domUtils.isFastClick()) return;
        const $poiItem = $(this).parent().find(".bnt_blue");
        const poiInfo = _getPoiData($poiItem);
        that.listener?.onShareBtnClicked?.(that, poiInfo);
      });

      that._dom.on("click", ".all_app_List", function (event) {
        if (domUtils.isFastClick()) return;
        const $clickedElement = $(this);
        const action = $clickedElement.data("action");
        const spaceCode = $clickedElement.data("spacecode");

        try {
          if (window.HWH5) {
            window.HWH5.getStorage("app-list-all")
              .then(function (list) {
                if (!list) return;
                const arr = Array.isArray(list) ? list : JSON.parse(list || "[]");
                const obj = arr.find((item) => action == item.identifier);

                if (obj) {
                  if (!obj.link) {
                    alert("缺少link配置");
                    return;
                  }
                  obj.link = obj.link.replace("${}", spaceCode);
                  if (obj.link.indexOf("h5") == 0) {
                    window.HWH5.navigateToPage({ uri: obj.link });
                  } else {
                    window.HWH5.openWebview({ uri: obj.link });
                  }
                  dxUtils.addRecord("card", {
                    tenantId: daxiapp.App._params.tenantId,
                    spaceFunctionId: obj.url,
                  });
                }
              })
              .catch(function (error) {
                console.log("分享发生异常", error);
              });
          }
        } catch (e) {
          alert("shareToFriend:" + e.toString());
        }
      });
    };

    that.updateData = function (data) {
      sherePoiInfobyHW = data.poiInfo || data;
      const pi = data.poiInfo;
      const poiName = pi.cnname || pi.name || pi.text;

      let detailPosInfo = `<div id="modelAlert"><div class="modelTitle"><span class="modelName">${poiName}</span></div><div class="model_body">`;

      // 人员状态
      if (pi.has_body) {
        const statusClass = pi.has_body_num == 1 ? "active" : pi.has_body_num == -1 ? "disable" : "";
        detailPosInfo += `<div><span class="${statusClass}"><i class="icon-user"></i>${pi.has_body}</span></div>`;
      }

      // 会议信息
      if (pi.message) {
        detailPosInfo += `<div><span>${pi.roomScheduleBeginTimeStr} - ${pi.roomScheduleEndTimeStr}</span><span>${pi.message}</span></div>`;
      }

      // 空间描述
      if (pi.spacedescription) {
        detailPosInfo += `<div><span>${pi.spacedescription}</span></div>`;
      }

      // 电气信息
      if (pi.electricity) {
        detailPosInfo += `<div><span>总计焊接位：${pi.electricity.total}</span><span>可用焊接位：<span class="green">${pi.electricity.freeSum}</span></span></div>`;
      }

      // 卫生间信息
      if (pi.toilet) {
        detailPosInfo += `<div><span>总计厕位：${pi.toilet.total}</span><span>可用厕位：<span class="green">${pi.toilet.noUseSum}</span></span></div>`;
      }

      // 班车站点信息
      if (pi.shuttlestation) {
        let defaultUrl = window.HWH5
          ? `https://apigw${window.currentEnv == "uat" ? "-beta" : ""}.huawei.com/api/map-static-v2/app/wechat_newstyle/images/telephone.svg`
          : "../images/telephone.svg";

        if (window.HWH5 && window.additionalQuery) {
          for (const k in window.additionalQuery) {
            defaultUrl += (defaultUrl.indexOf("?") == -1 ? "?" : "&") + `${k}=${window.additionalQuery[k]}`;
          }
        }

        const ss = pi.shuttlestation;
        detailPosInfo += `<div class="shuttleline"><div class="lineinfo"><span class="linePeriod">${ss.linePeriod}</span><span class="beginTimeTile">首班</span><span class="beginTime">${ss.beginTime}</span><span class="endTimeTile">末班</span><span class="endTime">${ss.endTime}</span><a class="hotLine" href="tel:${ss.hotLine}"><img src="${defaultUrl}" style="width: 18px;height: 18px;margin: 4px 0px;vertical-align: bottom;">客服热线</a></div>`;

        if (ss.lines) {
          detailPosInfo += '<div class="lineinfoBtn">';
          ss.lines.forEach((item) => {
            detailPosInfo += `<span class="lineName" style="background-color: ${item.lineColor}">${item.lineName}</span>`;
          });
          detailPosInfo += "</div>";
        }
        detailPosInfo += "</div>";
      }

      // 按钮列表
      if (pi.btns) {
        detailPosInfo += '<div class="mode_bnts">';
        pi.btns.forEach((item) => {
          detailPosInfo += `<span class="all_app_List" data-action="${item.action}" class="openPage" data-spacecode="${pi.spaceCode}">${item.text}</span>`;
        });
        detailPosInfo += "</div>";
      }

      detailPosInfo += "</div>";

      // 底部按钮
      const props = data.properties || data;
      const fallbackPi = data.poiInfo || {};
      const footerData = {
        address: props.address || fallbackPi.address || "",
        name: props.name || fallbackPi.name || "",
        floorId: props.floorId || fallbackPi.floorId || "",
        lon: props.lon || fallbackPi.lon || "",
        lat: props.lat || fallbackPi.lat || "",
        poiId: props.poiId || fallbackPi.poiId || "",
        bdid: props.bdid || fallbackPi.bdid || "",
      };

      detailPosInfo += `<div class="model_footer" style="display:flex;"><img class="sharePoi" src="${imgURL}"><div class="bnt_blue" data-address="${footerData.address}" data-name="${footerData.name}" data-floorId="${footerData.floorId}" data-lon="${footerData.lon}" data-lat="${footerData.lat}" data-poi="${footerData.poiId}" data-bdid="${footerData.bdid}" style="flex:1">去那里</div></div></div>`;

      that._dom.html(detailPosInfo);
      that.listener?.viewStateChanged?.(that, { viewHeight: that._dom.find("#modelAlert").height() + 14 });
    };

    that.hide = function () {
      domUtils.show(that._dom, false);
    };

    that.show = function () {
      domUtils.show(that._dom, true);
    };

    that.updateFavoriteStatus = function (status) {
      domUtils.find(that._dom, ".favorite").toggleClass("active", status);
    };
  };
  daxiapp["DXPoiDetailView3"] = daxiapp["DXPoiDetialView3"] = DXPoiDetailView3; // 'DXPoiDetialView3'为向后兼容别名（修正拼写错误）

  /**
   * 路线选择头部组件
   * @param {Object} app - 应用实例
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXRouteHeader = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.status = false;

    const componentData = { startPoint: {}, endPoint: {}, strategy: 0, isShow: false };

    const wrapperDom = `<div class="routing-selector"><div class="route-info"><div class="goback"><span class="icon-back icon-fanhui"></span></div><div class="icon"><span class="start-icon"></span><span class="icon-vdots"></span><span class="zhong-icon"></span></div><div class="route-pos-wrapper"><div class="routing-info-detail startpos-info" data-selector="startPos"><p class="empty_pos">${_getLang(
      "select:startpos:text",
      "请选择起点",
    )}</p><p class="posInfo"><span class="name"></span><span class="address"></span></p></div><div class="routing-info-detail endpos-info" data-selector="endPos"><p class="empty_pos">${_getLang(
      "select:targetpos:text",
      "请选择终点...",
    )}</p><p class="posInfo"><span class="name"></span><span class="address"></span></p></div></div><div class="point-switch"></div></div>`;

    that.init = function (options, listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      domUtils.append(that.parentObj, wrapperDom);
      that.$routingSelector = domUtils.find(that.parentObj, ".routing-selector");
    };

    that.injectComponentEvents = function () {
      that.$routingSelector.on("click", ".goback", function () {
        that.listener?.OnClickExitRoutePage?.(that);
      });

      that.$routingSelector.on("click", ".startpos-info", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.OnStartTextViewClicked?.(that, { pointType: "startPoint", pointInfo: componentData.startPoint });
      });

      that.$routingSelector.on("click", ".endpos-info", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.OnStartTextViewClicked?.(that, { pointType: "endPoint", pointInfo: componentData.endPoint });
      });

      that.$routingSelector.on("click", ".point-switch", function (e) {
        if (domUtils.isFastClick()) return;
        const { startPoint, endPoint } = componentData;
        that.setEndPoint(startPoint);
        that.setStartPoint(endPoint);
        that.listener?.OnChangeStartEndPos?.(that, { startPoint: endPoint, endPoint: startPoint });
      });
    };

    that.commandChanged = function (sender, cmd) {
      that.clearStartText();
      cmd.endPoint && that.setEndPoint(cmd.endPoint);
      cmd.startPoint && that.setStartPoint(cmd.startPoint);
    };

    that.clearStartText = function () {
      domUtils.find(that.$routingSelector, ".startpos-info .name").text("");
      domUtils.find(that.$routingSelector, ".startpos-info .address").text("");
    };

    that.clearEndText = function () {
      domUtils.find(that.$routingSelector, ".endpos-info .name").text("");
      domUtils.find(that.$routingSelector, ".endpos-info .address").text("");
    };

    that.setEndPoint = function (info) {
      _updateRoutePosUI(that.$routingSelector, "endpos", info);
      if (info && (info.lon || info.lat)) componentData.endPoint = info;
    };

    that.setStartPoint = function (info) {
      _updateRoutePosUI(that.$routingSelector, "startpos", info);
      if (info && (info.lon || info.lat)) componentData.startPoint = info;
    };

    that.getStartPoint = () => ({ pointType: "startPoint", pointInfo: componentData.startPoint });
    that.getEndPoint = () => ({ pointType: "endPoint", pointInfo: componentData.endPoint });

    return that;
  };
  daxiapp["DXRouteHeader"] = daxiapp["DXRouteSelectorHeaderView"] = DXRouteHeader;

  /**
   * 路线选择头部组件 V2 - 支持室内外策略切换
   * @param {Object} options - 配置项
   * @param {HTMLElement} parentObject - 父容器元素
   */
  const DXRouteHeader2 = function (options, parentObject) {
    const that = this;
    that.parentObj = parentObject;
    that.status = false;

    const strategys = options.strategys || {};
    strategys.defaultStrategy = strategys.defaultStrategy || 0;
    strategys.defaultTripMode = strategys.defaultTripMode || 0;

    const componentData = {
      startPoint: {},
      endPoint: {},
      transittype: strategys.defaultTripMode,
      strategy: strategys.defaultStrategy,
      isShow: false,
    };

    // 构建主体DOM
    let wrapperDom = `<div class="routing-selector"><div class="point-selector"><div class="goback"><span class="icon-back icon-fanhui"></span></div><div class="route-info"><div class="icon"><span class="start-icon">${
      options.startDot ? "" : _getLang("start:pos:tip", "起")
    }</span><span class="icon-vdots"></span><span class="zhong-icon">${
      options.endDot ? "" : _getLang("end:pos:tip", "终")
    }</span></div><div class="route-pos-wrapper"><div class="routing-info-detail startpos-info" data-selector="startPos"><p class="empty_pos">${
      options.startTip || _getLang("select:startpos:text", "请选择起点...")
    }</p><p class="posInfo"><span class="name"></span><span class="address"></span></p>${
      options.scancode ? '<p class="scan-btn"><span class="icon-scan" style="padding:10px;"></span></p>' : ""
    }</div><div class="routing-info-detail endpos-info" data-selector="endPos"><p class="empty_pos">${_getLang(
      "select:targetpos:text",
      "请选择终点...",
    )}</p><p class="posInfo"><span class="name"></span><span class="address"></span></p></div></div><div class="point-switch"></div></div></div>`;

    // 构建策略选择DOM
    if (strategys) {
      let strategyHtml = `<div class="strategy-wrapper ${!strategys.outdoor ? "onlyIndoor" : ""}">`;

      if (strategys.outdoor) {
        strategyHtml += '<ul class="outdoor-wrapper flex-wrapper">';
        strategys.outdoor.forEach((item, index) => {
          strategyHtml += `<li class="strategy ${item.icon || ""}${index == 0 ? " active" : ""}" data-transittype=${item.strategyCode || ""}>${
            item.name || ""
          }</li>`;
        });
        strategyHtml += "</ul>";
      }

      if (strategys.indoor) {
        let activeStrategy = null;
        let indoorHtml = "";
        strategys.indoor.forEach((item, index) => {
          if (item.strategyCode == undefined) item.strategyCode = item.strategy;
          if (item.strategyCode == strategys.defaultStrategy) activeStrategy = item;
          indoorHtml += `<li class="strategy indoor ${item.icon || ""}${index == 0 ? " active" : ""}" data-strategy=${item.strategyCode || ""}>${
            item.name || ""
          }</li>`;
        });

        if (strategys.outdoor) {
          strategyHtml += `<div class="indoor-wrapper dropdownMenu"><span class="indoor-strategy-dropdownMenu icon-triangle-down">${
            activeStrategy?.name || ""
          }</span><ul class="menupanel list-wrapper">${indoorHtml}</ul></div>`;
        } else {
          strategyHtml += `<div class="indoor-wrapper" style="flex:1"><ul class="list-wrapper" style="display: flex;">${indoorHtml}</ul></div>`;
        }
      }
      strategyHtml += "</div>";
      wrapperDom += strategyHtml;
    }
    wrapperDom += "</div>";

    /** 更新起终点UI并检查策略显示 */
    const _updatePointAndCheckStrategy = (posType, info, otherPoint) => {
      const selector = `.${posType}-info`;
      const hasValidPos = info && (info.lon || info.lat);

      domUtils.find(that.$routingSelector, `${selector} .empty_pos`)[hasValidPos ? "hide" : "show"]();
      domUtils.find(that.$routingSelector, `${selector} .posInfo`)[hasValidPos ? "show" : "hide"]();

      if (!hasValidPos) return;

      domUtils.find(that.$routingSelector, `${selector} .name`).text(info.name || info.text || "");
      domUtils.find(that.$routingSelector, `${selector} .address`).text(info.address || "");
      if (posType == "startpos") {
        domUtils.find(that.$routingSelector, `${selector} .floor-name`).text(info.floorName || "");
      }

      // 检查是否显示策略切换
      if (!otherPoint?.lon) {
        domUtils.find(that.$routingSelector, ".strategy-wrapper").hide();
        return;
      }

      if (info.bdid && info.floorId && info.bdid == otherPoint.bdid) {
        if (info.floorId == otherPoint.floorId) {
          domUtils.find(that.$routingSelector, ".strategy-wrapper").hide();
        } else {
          that.setOnlyIndoor(true);
          domUtils.find(that.$routingSelector, ".strategy-wrapper").show();
        }
      } else {
        that.setOnlyIndoor(false);
        domUtils.find(that.$routingSelector, ".strategy-wrapper").show();
      }
    };

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      domUtils.append(that.parentObj, wrapperDom);
      that.$routingSelector = domUtils.find(that.parentObj, ".routing-selector");
    };

    that.injectComponentEvents = function () {
      that.$routingSelector.on("click", ".goback", function () {
        that.listener?.OnClickExitRoutePage?.(that);
      });

      that.$routingSelector.on("click", ".scan-btn", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onScanBtnClicked?.();
        e.stopPropagation();
      });

      that.$routingSelector.on("click", ".startpos-info", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.OnStartTextViewClicked?.(that, { pointType: "startPoint", pointInfo: componentData.startPoint });
      });

      that.$routingSelector.on("click", ".endpos-info", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.OnStartTextViewClicked?.(that, { pointType: "endPoint", pointInfo: componentData.endPoint });
      });

      that.$routingSelector.on("click", ".point-switch", function (e) {
        if (domUtils.isFastClick()) return;
        const { startPoint, endPoint } = componentData;
        that.setEndPoint(startPoint);
        that.setStartPoint(endPoint);
        that.listener?.OnChangeStartEndPos?.(that, { startPoint: endPoint, endPoint: startPoint });
      });

      that.$routingSelector.on("click", ".outdoor-wrapper .strategy", function (e) {
        if (e.target.classList.contains("active")) return;
        $(this).addClass("active").siblings().removeClass("active");
        that.listener?.onRouteStrategySelectChanged?.(that, e.target.dataset);
      });

      that.$routingSelector.on("click", ".indoor-strategy-dropdownMenu", function (e) {
        e.target.nextSibling.classList.toggle("active");
      });

      that.$routingSelector.on("click", ".indoor-wrapper .strategy", function (e) {
        const $this = $(this);
        $this.parent().removeClass("active");
        if (e.target.classList.contains("active")) return;
        domUtils.find(that.$routingSelector, ".indoor-strategy-dropdownMenu").text($this.text());
        $this.addClass("active").siblings().removeClass("active");
        that.listener?.onRouteStrategySelectChanged?.(that, e.target.dataset);
      });
    };

    that.commandChanged = function (sender, cmd) {
      that.clearStartText();
      cmd.endPoint && that.setEndPoint(cmd.endPoint);
      cmd.startPoint && that.setStartPoint(cmd.startPoint);
    };

    that.clearStartText = function () {
      domUtils.find(that.$routingSelector, ".startpos-info .name").text("");
      domUtils.find(that.$routingSelector, ".startpos-info .address").text("");
    };

    that.clearEndText = function () {
      domUtils.find(that.$routingSelector, ".endpos-info .name").text("");
      domUtils.find(that.$routingSelector, ".endpos-info .address").text("");
    };

    that.setEndPoint = function (info) {
      if (info && (info.lon || info.lat)) componentData.endPoint = info;
      _updatePointAndCheckStrategy("endpos", info, componentData.startPoint);
    };

    that.setStartPoint = function (info) {
      if (info && (info.lon || info.lat)) componentData.startPoint = info;
      _updatePointAndCheckStrategy("startpos", info, componentData.endPoint);
    };

    that.setRouteDatas = function (route) {
      const arr = route.route || route.segments || [];
      let indoorCount = 0;
      let hasOutDoor = false;

      arr.forEach((item) => {
        if (item.routeType == 3 || item.routetype == 3) {
          indoorCount++;
        } else {
          hasOutDoor = true;
        }
      });

      const $wrapper = domUtils.find(that.$routingSelector, ".strategy-wrapper");
      if (!hasOutDoor && indoorCount == 1) {
        $wrapper.show();
        domUtils.find(that.$routingSelector, ".strategy-wrapper .outdoor-wrapper").hide();
        domUtils.find(that.$routingSelector, ".strategy-wrapper .indoor-wrapper").show();
        domUtils.find(that.$routingSelector, ".strategy-wrapper .indoor-wrapper .indoor-strategy-dropdownMenu").hide();
        domUtils.find(that.$routingSelector, ".strategy-wrapper .indoor-wrapper .list-wrapper").css("display", "flex");
      }
      if (hasOutDoor) {
        that.setOnlyIndoor(false);
        $wrapper.show();
        domUtils.find(that.$routingSelector, ".strategy-wrapper .outdoor-wrapper").show();
        domUtils.find(that.$routingSelector, ".strategy-wrapper .indoor-wrapper").hide();
      }
    };

    that.setOnlyIndoor = function (onlyIndoor) {
      domUtils.find(that.$routingSelector, ".strategy-wrapper").toggleClass("onlyIndoor", onlyIndoor);
    };

    that.hide = function () {
      that.$routingSelector.hide();
    };

    that.show = function () {
      that.$routingSelector.show();
    };

    return that;
  };
  daxiapp["DXRouteHeader2"] = daxiapp["DXRouteSelectorHeaderView2"] = DXRouteHeader2;

  /**
   * 路线选择器头部视图3 (内外内切换 header)
   * @param {Object} options - 配置选项
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXRouteHeader3 = function (options, parentObject) {
    const that = this;
    that.options = options;
    that.parentObj = parentObject;
    that.status = false;
    that.routeData = null;
    that.segsRouteInfo = [];

    const wrapperDom = `<div class="route-header-v2 animated fadeInDown"><div class="route-header-row"><button class="route-header-back goback"><i class="icon icon-fanhui"></i></button><div class="route-header-content content-wrapper"></div></div><div class="route-tabs-container"></div></div>`;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      domUtils.append(that.parentObj, wrapperDom);
      that._dom = domUtils.find(that.parentObj, ".route-header-v2");
      that.$routingSelector = domUtils.find(that.parentObj, ".content-wrapper");
      that.$tabsContainer = domUtils.find(that.parentObj, ".route-tabs-container");
    };

    that.injectComponentEvents = function () {
      that._dom.on("click", ".goback", function () {
        that.listener?.OnClickExitRoutePage?.();
      });

      that.$routingSelector.on("click", ".scan-btn", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onScanBtnClicked?.();
        e.stopPropagation();
      });

      that.$routingSelector.on("click", ".routing-info-from", function (e) {
        if (domUtils.isFastClick()) return;
        const { segindex, enablechange } = this.dataset;
        if (!enablechange) return;
        that.listener?.OnStartTextViewClicked?.({
          pointType: "startPoint",
          pointInfo: that.routeData?.segments?.[segindex]?.startPoint || that.routeData?.startPoint,
        });
      });

      that.$routingSelector.on("click", ".routing-info-to", function (e) {
        if (domUtils.isFastClick()) return;
        const { segindex, enablechange } = this.dataset;
        if (!enablechange) return;
        that.listener?.OnEndTextViewClicked?.({
          pointType: "endPoint",
          pointInfo: that.routeData?.segments?.[segindex]?.endPoint || that.routeData?.endPoint,
        });
      });

      that.$routingSelector.on("click", ".point-switch", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.OnChangeStartEndPos?.({ startPoint: that.routeData?.endPoint, endPoint: that.routeData?.startPoint });
      });

      that._dom.on("click", ".full-route-select-item", function (e) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        if ($this.hasClass("active")) return;
        $this.addClass("active").siblings().removeClass("active");
        const segindex = this.dataset.segindex;
        that.listener?.onSegmentRouteActive?.(segindex, that.routeData?.segments?.[segindex]);
        that.listener?.onViewChanged?.({ height: that._dom.height() });
      });

      that.$tabsContainer.on("click", ".transfer-item", function (e) {
        if ($(this).hasClass("active")) return;
        that.$tabsContainer.find(".transfer-item").removeClass("active");
        $(this).addClass("active");
        that.listener?.onRouteStrategySelectChanged?.(this.dataset);
      });

      that.$tabsContainer.on("click", ".outdoor-wrapper .strategy", function (e) {
        if ($(this).hasClass("active")) return;
        that.$tabsContainer.find(".outdoor-wrapper .strategy").removeClass("active");
        $(this).addClass("active");
        that.listener?.onRouteStrategySelectChanged?.(this.dataset);
      });
    };

    that.geneRouteInfo = function (data, index, totalCount, strategy, transittype) {
      const startPoint = data.startPoint;
      const endPoint = data.endPoint;
      const segIndex = index || 0;
      const enableStartChange = index == 0 ? " data-enablechange=true" : "";
      const enableEndChange = index == totalCount - 1 ? " data-enablechange=true" : "";

      const startPointName = startPoint?.name || startPoint?.text || _getLang("my:currentpos", "我的位置");
      const startFloorHtml = startPoint?.flname ? `<span class="floor-tag">${startPoint.flname}</span>` : "";
      const endPointName = endPoint?.name || endPoint?.text || _getLang("select:targetpos:text", "请选择终点");
      const endFloorHtml = endPoint?.flname ? `<span class="floor-tag">${endPoint.flname}</span>` : "";
      const switchHtml =
        totalCount == 1 && startPoint && endPoint ? '<button class="route-header-swap point-switch"><i class="icon icon-qiehuan"></i></button>' : "";

      const headerHtml = `<div class="route-header-points"><div class="route-point-row routing-info-from" data-segindex=${segIndex}${enableStartChange}><div class="route-point-dot start"></div><div class="route-point-input">${startPointName}${startFloorHtml}</div></div><div class="route-point-row routing-info-to" data-segindex=${segIndex}${enableEndChange}><div class="route-point-dot end"></div><div class="route-point-input end-point">${endPointName}${endFloorHtml}</div></div></div>${switchHtml}</div>`;

      let segmentHtml = `<div class="route-segment-content" data-segindex=${segIndex}>`;
      const opts = this.options;

      if (startPoint && endPoint) {
        if (startPoint.bdid && startPoint.bdid == endPoint.bdid) {
          // 同建筑物，楼层不同或多步骤时显示室内策略
          if (startPoint.floorId != endPoint.floorId || data.steps?.length > 1) {
            const defaultStrategys = [
              { default: true, strategy: 0, type: "fast", name: "智能", icon: "icon-box" },
              { strategy: 2, name: "扶梯", icon: "icon-futi" },
              { strategy: 1, name: "电梯", icon: "icon-shengjiangdianti" },
              { strategy: 3, name: "楼梯", icon: "icon-buti" },
            ];
            const strategys = opts?.strategys?.indoor || defaultStrategys;
            if (strategys?.length) {
              segmentHtml += '<div class="widget-transfer-horizontal">';
              strategys.forEach((item) => {
                const isActive = strategy != undefined ? item.strategy == strategy : item.default;
                segmentHtml += `<div class="transfer-item ${isActive ? "active" : ""}" data-strategy=${item.strategy}><i class="ico ${
                  item.icon || ""
                }" width="26px" height="auto" type="fast"></i><span>${item.name}</span></div>`;
              });
              segmentHtml += "</div>";
            }
          }
        } else {
          // 不同建筑物，显示室外策略
          const outdoorClass = !opts?.strategys?.outdoor ? "onlyIndoor" : "";
          let outdoorSwitchStr = `<div class="strategy-wrapper ${outdoorClass}" style="margin-top:4px;">`;
          if (opts?.strategys?.outdoor) {
            outdoorSwitchStr += '<ul class="outdoor-wrapper flex-wrapper">';
            opts.strategys.outdoor.forEach((item) => {
              const isActive = transittype != undefined ? item.strategyCode == transittype : item.default;
              outdoorSwitchStr += `<li class="strategy ${item.icon || ""}${isActive ? " active" : ""}" data-transittype=${item.strategyCode || "0"}>${
                item.name || ""
              }</li>`;
            });
            outdoorSwitchStr += "</ul>";
          }
          outdoorSwitchStr += "</div>";
          segmentHtml += outdoorSwitchStr;
        }
      }
      segmentHtml += "</div>";
      return { headerHtml, segmentHtml };
    };

    that.updateData = function (routeData, strategy, transittype) {
      let headerStr = "";
      let segmentStr = "";
      let tabsHtml = "";
      const segments = routeData.segments;
      this.routeData = routeData;
      this.segsRouteInfo = [];

      if (!segments) {
        const result = this.geneRouteInfo(routeData, 0, 1, strategy);
        headerStr += result.headerHtml;
        segmentStr += result.segmentHtml;
      } else if (segments.length > 1) {
        // 多段路线
        const result = this.geneRouteInfo(routeData, 0, segments.length, strategy, transittype);
        headerStr += result.headerHtml;
        segmentStr += result.segmentHtml;

        tabsHtml = '<div class="route-segment-tabs">';
        segments.forEach((segment, index) => {
          const isActive = index == 0 ? " active" : "";
          const segType = segment.routetype == 3 ? "indoor" : "outdoor";
          const segName = segment.name || (segment.routetype == 3 ? "内部路段" : "外部路段");
          const segDist = segment.disDesc || "";
          tabsHtml += `<button class="route-segment-tab full-route-select-item ${segType}${isActive}" data-segindex=${index} data-bdid="${
            segment.startPoint?.bdid || ""
          }">${segName}<span class="tab-distance">(${segDist})</span><div class="tab-indicator"></div></button>`;
          this.segsRouteInfo.push(this.geneRouteInfo(segment, index, segments.length, strategy, transittype));
        });
        tabsHtml += "</div>";
      } else {
        const result = this.geneRouteInfo(segments[0], 0, 1, strategy, transittype);
        headerStr += result.headerHtml;
        segmentStr += result.segmentHtml;
      }

      that.$routingSelector.html(headerStr);
      that.$tabsContainer.html(tabsHtml + segmentStr);
      that.listener?.onViewChanged?.({ height: that._dom.height() });
    };

    that.activeByBDID = function (bdid) {
      that._dom.find(".route-segment-tabs").find(`[data-bdid="${bdid}"]`).trigger("click");
    };

    that.getHeight = () => that._dom.height();

    that.setVisible = function (visible, data, strategy, transittype) {
      if (visible) {
        if (data) this.updateData(data, strategy, transittype);
        this.show();
      } else {
        this.hide();
      }
    };

    that.commandChanged = function (sender, cmd) {
      that.clearStartText();
      if (cmd.endPoint) that.setEndPoint(cmd.endPoint);
      if (cmd.startPoint) that.setStartPoint(cmd.startPoint);
    };

    that.clearStartText = function () {
      domUtils.find(that.$routingSelector, ".startpos-info .name").text("");
      domUtils.find(that.$routingSelector, ".startpos-info .address").text("");
    };

    that.clearEndText = function () {
      domUtils.find(that.$routingSelector, ".endpos-info .name").text("");
      domUtils.find(that.$routingSelector, ".endpos-info .address").text("");
    };

    that.setEndPoint = (info) => _updateRoutePosUI(that.$routingSelector, "endpos", info);
    that.setStartPoint = (info) => _updateRoutePosUI(that.$routingSelector, "startpos", info);

    that.setOnlyIndoor = function (onlyIndoor) {
      domUtils.find(that.$routingSelector, ".strategy-wrapper").toggleClass("onlyIndoor", onlyIndoor);
    };

    that.show = () => that._dom.show();
    that.hide = () => that._dom.hide();

    return that;
  };
  daxiapp["DXRouteHeader3"] = daxiapp["DXRouteSelectorHeaderView3"] = DXRouteHeader3;

  /**
   * 路线选择器头部视图4
   * @param {Object} options - 配置选项
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXRouteHeader4 = function (options, parentObject) {
    const that = this;
    that.options = options;
    that.parentObj = parentObject;
    that.status = false;
    that.routeData = null;
    that.segsRouteInfo = [];
    that.transittype = null;

    const wrapperDom =
      '<div class="routing-info-top animated fadeInDown" style="width: 100%;"><div class="routing-info-top-content"><div style="flex: 1 1 0%;" class="content-wrapper"></div></div><i class="icon goback icon-fanhui" type="back" width="11px"></i></div>';

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      domUtils.append(that.parentObj, wrapperDom);
      that._dom = domUtils.find(that.parentObj, ".routing-info-top");
      that.$routingSelector = domUtils.find(that.parentObj, ".content-wrapper");
    };

    that.injectComponentEvents = function () {
      that._dom.on("click", ".goback", function () {
        that.listener?.OnClickExitRoutePage?.();
      });

      that.$routingSelector.on("click", ".scan-btn", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onScanBtnClicked?.();
        e.stopPropagation();
      });

      that.$routingSelector.on("click", ".routing-info-from", function (e) {
        if (domUtils.isFastClick()) return;
        const { segindex, enablechange } = this.dataset;
        if (!enablechange) return;
        that.listener?.OnStartTextViewClicked?.({
          pointType: "startPoint",
          pointInfo: that.routeData?.segments?.[segindex]?.startPoint || that.routeData?.startPoint,
        });
      });

      that.$routingSelector.on("click", ".routing-info-to", function (e) {
        if (domUtils.isFastClick()) return;
        const { segindex, enablechange } = this.dataset;
        if (!enablechange) return;
        that.listener?.OnEndTextViewClicked?.({
          pointType: "endPoint",
          pointInfo: that.routeData?.segments?.[segindex]?.endPoint || that.routeData?.endPoint,
        });
      });

      that.$routingSelector.on("click", ".point-switch", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.OnChangeStartEndPos?.({ startPoint: that.routeData?.endPoint, endPoint: that.routeData?.startPoint });
      });

      that.$routingSelector.on("click", ".full-route-select-item", function (e) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        if ($this.hasClass("active")) return;
        const segindex = this.dataset.segindex;
        this.parentNode.nextSibling.outerHTML = that.segsRouteInfo[segindex];
        $this.addClass("active").siblings().removeClass("active");
        that.listener?.onSegmentRouteActive?.(segindex, that.routeData?.segments?.[segindex]);
        that.listener?.onViewChanged?.({ height: that._dom.height() });
      });

      that.$routingSelector.on("click", ".transfer-item", function (e) {
        if ($(this).hasClass("active")) return;
        $(this).addClass("active").siblings().removeClass("active");
        that.listener?.onRouteStrategySelectChanged?.(this.dataset);
      });

      that.$routingSelector.on("click", ".outdoorType li", function (e) {
        if (domUtils.isFastClick()) return;
        const transittype = $(this).attr("data-transittype");
        if (transittype == that.transittype) return;
        $(this).addClass("on").siblings().removeClass("on");
        that.listener?.onOutdoorTypeClicked?.(transittype);
        that.transittype = transittype;
      });
    };

    that.geneRouteInfo = function (data, index, totalCount, strategy, transittype) {
      const startPoint = data.startPoint;
      const endPoint = data.endPoint;
      const segIndex = index || 0;
      const enableStartChange = index == 0 ? " data-enablechange=true" : "";
      const enableEndChange = index == totalCount - 1 ? " data-enablechange=true" : "";

      const startName = startPoint?.name || "我的位置";
      const startFloorHtml = startPoint?.flname ? `<span class="routing-info-message-floor">${startPoint.flname}</span>` : "";
      const endName = endPoint?.name || "";
      const endFloorHtml = endPoint?.flname ? `<span class="routing-info-message-floor">${endPoint.flname}</span>` : "";

      let str = `<div style="position: relative"><div class="routing-info-location" style="margin-left: 41px;" data-segindex=${segIndex}><div class="routing-info-detail route-start" style="display: flex; flex-wrap: wrap; align-items: center"><div class="routing-info-detail-underline" size="10" style="width: 83.3333%; flex-basis: 83.3333%"><div class="routing-info-message routing-info-from" data-segindex=${segIndex}${enableStartChange}>`;

      if (startPoint) {
        str += `<div><div class="lv-marquee-wrap" role="marquee" style="overflow: hidden"><div class="lv-marquee" style="position: relative;right: 0px;white-space: nowrap;display: inline-block;"><div><span class="routing-info-message-name">${startName}</span>${startFloorHtml}</div></div></div><div></div></div>`;
      } else {
        str += `<span class="routing-info-message-floor empty">${_getLang("select:startpos:text", "请选择起点")}</span>`;
      }

      str += `</div></div></div><div class="routing-info-detail route-info-to" style="display: flex; flex-wrap: wrap; align-items: center"><div size="10" style="width: 83.3333%; flex-basis: 83.3333%"><div class="routing-info-message routing-info-to" data-segindex=${segIndex}${enableEndChange}>`;

      if (endPoint) {
        str += `<div><div class="lv-marquee-wrap" role="marquee" style="overflow: hidden"><div class="lv-marquee" style="position: relative;right: 0px;white-space: nowrap;display: inline-block;"><div><span class="routing-info-message-name">${endName}</span>${endFloorHtml}</div></div></div></div></div></div>`;
      } else {
        str += `<span class="routing-info-message-floor empty">${_getLang("select:targetpos:text", "请选择终点")}</span>`;
      }
      str += "</div>";

      if (totalCount == 1 && startPoint && endPoint) {
        str += '<div class="point-switch routing-info-top-reverse"></div>';
      }
      str += "</div>";

      // 同建筑物，显示室内策略
      if (startPoint && endPoint && startPoint.bdid && startPoint.bdid == endPoint.bdid) {
        if (startPoint.floorId != endPoint.floorId || data.steps?.length > 1) {
          const defaultStrategys = [
            { default: true, strategy: 0, type: "fast", name: "智能", icon: "icon-box" },
            { strategy: 2, name: "扶梯", icon: "icon-futi" },
            { strategy: 1, name: "电梯", icon: "icon-shengjiangdianti" },
            { strategy: 3, name: "楼梯", icon: "icon-buti" },
          ];
          const strategys = this.options?.strategys?.indoor || defaultStrategys;
          if (strategys?.length) {
            str += '<div class="widget-transfer-horizontal">';
            strategys.forEach((item) => {
              const isActive = strategy != undefined ? item.strategy == strategy : item.default;
              str += `<div class="transfer-item ${isActive ? "active" : ""}" data-strategy=${item.strategy}><i class="ico ${
                item.icon || ""
              }" width="26px" height="auto" type="fast"></i><span>${item.name}</span></div>`;
            });
            str += "</div>";
          }
        }
      }

      // 不同建筑物（无bdid），显示室外出行方式
      if (startPoint && endPoint && !startPoint.bdid) {
        const transData = [
          { transittype: 0, icon: "icon-icon_chuzu", name: "驾车" },
          { transittype: 1, icon: "icon-icon_gongjiao", name: "公交" },
          { transittype: 2, icon: "icon-buxing", name: "步行" },
        ];
        str += '<div class="outdoorType"><ul>';
        transData.forEach((item) => {
          const isActive = transittype == item.transittype ? " class=on" : "";
          str += `<li${isActive} data-transittype=${item.transittype}><i class="${item.icon}"></i>${item.name}</li>`;
        });
        str += "</ul></div>";
      }
      str += "</div></div></div>";
      return str;
    };

    that.updateData = function (routeData, strategy, transittype) {
      let str = "";
      const segments = routeData.segments;
      this.routeData = routeData;
      this.segsRouteInfo = [];

      if (!segments) {
        str += this.geneRouteInfo(routeData, 0, 1, strategy, transittype);
      } else if (segments.length > 1) {
        str += '<div class="full-route-select">';
        segments.forEach((segment, index) => {
          segment.name = segment.name || (segment.routetype == 3 ? "室内" : "");
          str += `<div class="full-route-select-item ${index == 0 ? "active" : ""}" data-segindex=${index} data-bdid=${segment.startPoint?.bdid || ""}>${
            segment.name || ""
          }</div>`;
          this.segsRouteInfo.push(this.geneRouteInfo(segment, index, segments.length, strategy, transittype));
        });
        str += "</div>";
        str += this.segsRouteInfo[0];
      } else {
        str += this.geneRouteInfo(segments[0], 0, 1, strategy, transittype);
      }
      str += "</div>";

      that.$routingSelector.html(str);
      that.listener?.onViewChanged?.({ height: that._dom.height() });
    };

    that.activeByBDID = function (bdid) {
      that._dom.find(".full-route-select").find(`[data-bdid="${bdid}"]`).trigger("click");
    };

    that.getHeight = () => that._dom.height();

    that.setVisible = function (visible, data, strategy, transittype) {
      if (visible) {
        if (data) this.updateData(data, strategy, transittype);
        this.show();
      } else {
        this.hide();
      }
    };

    that.commandChanged = function (sender, cmd) {
      that.clearStartText();
      if (cmd.endPoint) that.setEndPoint(cmd.endPoint);
      if (cmd.startPoint) that.setStartPoint(cmd.startPoint);
    };

    that.clearStartText = function () {
      domUtils.find(that.$routingSelector, ".startpos-info .name").text("");
      domUtils.find(that.$routingSelector, ".startpos-info .address").text("");
    };

    that.clearEndText = function () {
      domUtils.find(that.$routingSelector, ".endpos-info .name").text("");
      domUtils.find(that.$routingSelector, ".endpos-info .address").text("");
    };

    that.setEndPoint = (info) => _updateRoutePosUI(that.$routingSelector, "endpos", info);
    that.setStartPoint = (info) => _updateRoutePosUI(that.$routingSelector, "startpos", info);

    that.setOnlyIndoor = function (onlyIndoor) {
      domUtils.find(that.$routingSelector, ".strategy-wrapper").toggleClass("onlyIndoor", onlyIndoor);
    };

    that.show = () => that._dom.show();
    that.hide = () => that._dom.hide();

    return that;
  };
  daxiapp["DXRouteHeader4"] = daxiapp["DXRouteSelectorHeaderView4"] = DXRouteHeader4;

  /**
   * 路线选择器头部视图5 (站内外切换)
   * @param {Object} options - 配置选项
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXRouteHeader5 = function (options, parentObject) {
    const that = this;
    that.options = options;
    that.parentObj = parentObject;
    that.status = false;
    that.routeData = null;
    that.segsRouteInfo = [];
    that.transittype = null;

    const wrapperDom =
      '<div class="routing-info-top animated fadeInDown" style="width: 100%;"><div class="routing-info-top-content"><div style="flex: 1 1 0%;" class="content-wrapper"></div></div><i class="icon goback icon-fanhui" type="back" width="11px"></i></div>';

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      domUtils.append(that.parentObj, wrapperDom);
      that._dom = domUtils.find(that.parentObj, ".routing-info-top");
      that.$routingSelector = domUtils.find(that.parentObj, ".content-wrapper");
    };

    that.injectComponentEvents = function () {
      that._dom.on("click", ".goback", function () {
        that.listener?.OnClickExitRoutePage?.();
      });

      that.$routingSelector.on("click", ".scan-btn", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onScanBtnClicked?.();
        e.stopPropagation();
      });

      that.$routingSelector.on("click", ".routing-info-from", function (e) {
        if (domUtils.isFastClick()) return;
        const { segindex, enablechange } = this.dataset;
        if (!enablechange) return;
        that.listener?.OnStartTextViewClicked?.({
          pointType: "startPoint",
          pointInfo: that.routeData?.segments?.[segindex]?.startPoint || that.routeData?.startPoint,
        });
      });

      that.$routingSelector.on("click", ".routing-info-to", function (e) {
        if (domUtils.isFastClick()) return;
        const { segindex, enablechange } = this.dataset;
        if (!enablechange) return;
        that.listener?.OnEndTextViewClicked?.({
          pointType: "endPoint",
          pointInfo: that.routeData?.segments?.[segindex]?.endPoint || that.routeData?.endPoint,
        });
      });

      that.$routingSelector.on("click", ".point-switch", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.OnChangeStartEndPos?.({ startPoint: that.routeData?.endPoint, endPoint: that.routeData?.startPoint });
      });

      that.$routingSelector.on("click", ".full-route-select-item", function (e) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        if ($this.hasClass("active")) return;
        const segindex = this.dataset.segindex;
        this.parentNode.nextSibling.outerHTML = that.segsRouteInfo[segindex];
        $this.addClass("active").siblings().removeClass("active");
        that.listener?.onSegmentRouteActive?.(segindex, that.routeData?.segments?.[segindex]);
        that.listener?.onViewChanged?.({ height: that._dom.height() });
      });

      that.$routingSelector.on("click", ".transfer-item", function (e) {
        if ($(this).hasClass("active")) return;
        $(this).addClass("active").siblings().removeClass("active");
        that.listener?.onRouteStrategySelectChanged?.(this.dataset);
      });

      that.$routingSelector.on("click", ".outdoorType li", function (e) {
        if (domUtils.isFastClick()) return;
        const transittype = $(this).attr("data-transittype");
        if (transittype == that.transittype) return;
        $(this).addClass("on").siblings().removeClass("on");
        that.listener?.onOutdoorTypeClicked?.(transittype);
        that.transittype = transittype;
        that.updateWidth();
      });
    };

    that.geneRouteInfo = function (data, index, totalCount, strategy, transittype) {
      const startPoint = data.startPoint;
      const endPoint = data.endPoint;
      const segIndex = index || 0;
      const enableStartChange = index == 0 ? " data-enablechange=true" : "";
      const enableEndChange = index == totalCount - 1 ? " data-enablechange=true" : "";

      const startName = startPoint?.name || "我的位置";
      const startFloorHtml = startPoint?.flname ? `<span class="routing-info-message-floor">${startPoint.flname}</span>` : "";
      const endName = endPoint?.name || "";
      const endFloorHtml = endPoint?.flname ? `<span class="routing-info-message-floor">${endPoint.flname}</span>` : "";

      let str = `<div style="position: relative"><div class="routing-info-location" style="margin-left: 41px;" data-segindex=${segIndex}><div class="routing-info-detail route-start" style="display: flex; flex-wrap: wrap; align-items: center"><div class="routing-info-detail-underline" size="10" style="width: 83.3333%; flex-basis: 83.3333%"><div class="routing-info-message routing-info-from" data-segindex=${segIndex}${enableStartChange}>`;

      if (startPoint) {
        str += `<div><div class="lv-marquee-wrap" role="marquee" style="overflow: hidden"><div class="lv-marquee" style="position: relative;right: 0px;white-space: nowrap;display: inline-block;"><div><span class="routing-info-message-name">${startName}</span>${startFloorHtml}</div></div></div><div></div></div>`;
      } else {
        str += `<span class="routing-info-message-floor empty">${_getLang("select:startpos:text", "请选择起点")}</span>`;
      }

      str += `</div></div></div><div class="routing-info-detail route-info-to" style="display: flex; flex-wrap: wrap; align-items: center"><div size="10" style="width: 83.3333%; flex-basis: 83.3333%"><div class="routing-info-message routing-info-to" data-segindex=${segIndex}${enableEndChange}>`;

      if (endPoint) {
        str += `<div><div class="lv-marquee-wrap" role="marquee" style="overflow: hidden"><div class="lv-marquee" style="position: relative;right: 0px;white-space: nowrap;display: inline-block;"><div><span class="routing-info-message-name">${endName}</span>${endFloorHtml}</div></div></div></div>`;
      } else {
        str += `<span class="routing-info-message-floor empty">${_getLang("select:targetpos:text", "请选择终点")}</span>`;
      }
      str += "</div>";

      if (totalCount == 1 && startPoint && endPoint) {
        str += '<div class="point-switch routing-info-top-reverse"></div>';
      }
      str += "</div></div></div>";

      // 站外出行方式（无bdid时显示）
      if (startPoint && endPoint && !startPoint.bdid) {
        const transData = [
          { transittype: 0, icon: "icon-icon_chuzu", name: "驾车" },
          { transittype: 1, icon: "icon-icon_gongjiao", name: "公交" },
          { transittype: 5, icon: "icon-icon_ditie", name: "地铁" },
          { transittype: 2, icon: "icon-buxing", name: "步行" },
        ];
        str += '<div class="outdoorType outdoorType2"><div class="outStation"><span>站外</span></div><ul style="width:100%">';
        transData.forEach((item) => {
          const isActive = transittype == item.transittype ? " class=on" : "";
          str += `<li${isActive} data-transittype=${item.transittype}><i class="${item.icon}"></i>${item.name}</li>`;
        });
        str += "</ul></div>";
      }

      // 站内策略选择
      const defaultStrategys = [
        { default: true, strategy: 0, type: "fast", name: "智能", icon: "icon-box" },
        { strategy: 2, name: "扶梯", icon: "icon-futi" },
        { strategy: 1, name: "电梯", icon: "icon-shengjiangdianti" },
        { strategy: 3, name: "楼梯", icon: "icon-buti" },
      ];
      const strategys = this.options?.strategys?.indoor || defaultStrategys;
      if (strategys?.length) {
        str += '<div class="widget-transfer-horizontal tky"><span class="inStation">站内</span>';
        strategys.forEach((item) => {
          const isActive = strategy != undefined ? item.strategy == strategy : item.default;
          str += `<div class="transfer-item ${isActive ? "active" : ""}" data-strategy=${item.strategy}><i class="ico ${
            item.icon || ""
          }" width="26px" height="auto" type="fast"></i><span>${item.name}</span></div>`;
        });
        str += "</div>";
      }

      str += "</div></div></div>";
      return str;
    };

    that.updateData = function (routeData, strategy, transittype) {
      transittype = transittype == undefined ? "0" : transittype;
      let str = "";
      const segments = routeData.segments;
      this.routeData = routeData;
      this.segsRouteInfo = [];

      if (!segments) {
        str += this.geneRouteInfo(routeData, 0, 1, strategy, transittype);
      } else if (segments.length > 1) {
        str += '<div class="full-route-select">';
        segments.forEach((segment, index) => {
          segment.name = segment.name || (segment.routetype == 3 ? "室内" : "");
          str += `<div class="full-route-select-item ${index == 0 ? "active" : ""}" data-segindex=${index} data-bdid=${segment.startPoint?.bdid || ""}>${
            segment.name || ""
          }</div>`;
          this.segsRouteInfo.push(this.geneRouteInfo(segment, index, segments.length, strategy, transittype));
        });
        str += "</div>";
        str += this.segsRouteInfo[0];
      } else {
        str += this.geneRouteInfo(segments[0], 0, 1, strategy, transittype);
      }
      str += "</div>";

      that.$routingSelector.html(str);
      that.listener?.onViewChanged?.({ height: that._dom.height() });
      that.updateWidth();
    };

    that.activeByBDID = function (bdid) {
      that._dom.find(".full-route-select").find(`[data-bdid="${bdid}"]`).trigger("click");
    };

    that.getHeight = () => that._dom.height();

    that.setVisible = function (visible, data, strategy, transittype) {
      if (visible) {
        if (data) this.updateData(data, strategy, transittype);
        this.show();
      } else {
        this.hide();
      }
    };

    that.commandChanged = function (sender, cmd) {
      that.clearStartText();
      if (cmd.endPoint) that.setEndPoint(cmd.endPoint);
      if (cmd.startPoint) that.setStartPoint(cmd.startPoint);
    };

    that.clearStartText = function () {
      domUtils.find(that.$routingSelector, ".startpos-info .name").text("");
      domUtils.find(that.$routingSelector, ".startpos-info .address").text("");
    };

    that.clearEndText = function () {
      domUtils.find(that.$routingSelector, ".endpos-info .name").text("");
      domUtils.find(that.$routingSelector, ".endpos-info .address").text("");
    };

    that.setEndPoint = (info) => _updateRoutePosUI(that.$routingSelector, "endpos", info);
    that.setStartPoint = (info) => _updateRoutePosUI(that.$routingSelector, "startpos", info);

    that.setOnlyIndoor = function (onlyIndoor) {
      domUtils.find(that.$routingSelector, ".strategy-wrapper").toggleClass("onlyIndoor", onlyIndoor);
    };

    that.show = () => that._dom.show();
    that.hide = () => that._dom.hide();

    that.updateWidth = function () {
      setTimeout(() => {
        const outdoorType = that._dom.find(".outdoorType2 ul");
        if (outdoorType.length) {
          outdoorType.css({ width: "100%" });
        }
      }, 10);
    };

    that.resetoutDoor = function () {
      const li = domUtils.find(that.$routingSelector, ".outdoorType li");
      $(li).eq(0).addClass("on").siblings().removeClass("on");
      that.transittype = 0;
    };

    that.resetIndoor = function () {
      const li = domUtils.find(that.$routingSelector, ".widget-transfer-horizontal .transfer-item");
      $(li).eq(0).addClass("active").siblings().removeClass("active");
      that.transittype = 0;
    };

    return that;
  };
  daxiapp["DXRouteHeader5"] = daxiapp["DXRouteSelectorHeaderView5"] = DXRouteHeader5;

  /**
   * 路线底部卡片视图（导航按钮、加载状态、错误提示）
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   * @param {Object} options - 配置选项
   */
  const DXRouteBottomCard = function (app, parentObject, options) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.state = "";
    that.status = false;
    that.isActivePage = false;
    that.viewDataPose = null;
    that.UITemplate = "";

    const basePath = window.projectPath || "./";
    const imgUrl = `${basePath}../common_imgs/loading.gif`;

    let wrapperStr = `<div class="routing-bottom"><div class="route-container"><div class="route-segments"></div>`;

    if (app?._config?.showPanoBtn) {
      wrapperStr += '<div class="routing-info-navi hasPano"><div class="pano">全景漫游</div>';
    } else {
      wrapperStr += '<div class="routing-info-navi">';
    }

    wrapperStr += `<div class="routing-info-simulate" style="">${_getLang("start:simulatenavi:btntext", "模拟导航")}</div>`;

    if (!options?.noRealNavi) {
      wrapperStr += `<div class="routing-info-true"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAAXNSR0IArs4c6QAABWlJREFUaAXVm0uIHEUYx3fzWOMDNfF1MKugxoCHrIoieBBFUSToRcFoggENqySH+EDBk0hAQZR4E4IGvImIiKgoBMFolKCCiBdRkpusEtEgcYUkO/l9w1RNdb27pnumt+BLV32P///79/T01nZPpqZKRq/X+xOTce+0CSAecz3NWIHvfgnIMINqHkSQaklaoTLlqJymz5mHqJzELEelQVWhKHRzON4Rp4xB0sK0sVCF/aOo0LB2khnrZ0uCjAqEuTCDuiEjYdaY15uCfJegy9AN+yCIr8G/6ItV1EqCoPkSbZ86E1oTdU/ZSYH1yoC/6pZOrPFSNSOyovBVo3gpkuoPqWJ/tNAL6K7oR+XDpegUfjlp5/rijo+CK7HKcJJsB9mHKxXDxT7J9bYtOTaQufZdJC8oYDMxNg/+pIaKFKvEddupVhWYWayvbXHKIOltleg53mj6NLPplLmvkwG4TtXM2jOcXDOc9mc/W+uhZjsga5PdZpV4jFnix+Sf4mGy2yApZjt/MmsUzGAHRQnjx9a6AHxfn8L9p/7dLNQl2M+4+H5PCCPpB24zdtoPG/ea4KvMhT0HZgO+w9haO1awvtys0cSQyC34EDZnJjQ0n+cH8ncHC1K54g5hbYxPHUIcsZvXFcS/xy7xFWb6FlF6TmZuOI3TcQ+WfWGFkSKKY0WQLxC/LJbju8ma+cFTbSb55nIx+PwD33kQn4jEk3f6YG1E0X0p0iBobgDRG0W5Mfbn1o6cB+neAfEfI4PVBYD477o1xRdXXSKVT5PnM9+t1q0fIdwy+EhiPw3N9AGR7EY/UISDY+2PJbsbCG7ATliEanl1NlBuIsgvK/TQMRcrmQfBOuy3EJHlfzoJmEoAcLsFmlymMINxkOUByydJBn/CwSBwKADOLdj/frxs7+oQvuMH8vVs2HjiSRtc77lUgPpLmX+HyQ6kqXFHEAjC+XjT5VEf6SrgDhC40xdsyLc3iAP5I+V64pVBUjMAxIXYL3GoWtEjJn7WHPjk7S+jhXVZZL4kwOWG/18GiZPiw6vtA1V+xX3koIcdD9cmiRXA83mYaxiJYRTFgF49hA/O3kuBF+25oFsCOFgb2XPrfkofoGzRCO7kuOtq0BM8yb3etQ3SuFAQf+EjdzMb9kB6lof4uVya4AWSAyDEZl7ORaXySy8uVb9NTTh+a8zbnxqne6Z9NoMB4q8wZ2tjpLQzhfRs7PZ20JcpKidkE/Ym9i8m49ZlKsVtGzGz2B5sAfONx92qZeJBjewMd2O5u8PXlom0/vsY+YWwFSt9wvtxZ8UiSjaT8pBWNpTZD2rJDQ15WDDSL8FGTxbN3ITtx4q27NTFhmA28TajTDPkV2HyHv0YNo5xfVmnBVWouRh7HjsyDmUejocK2s4rgUw2AI9hP3iIJ+F6Ma/zjCy6X4nJF5fkD8UlrGvj3ZSM6B0MNbIz2YU9iI1305rq3I3/xJ8Rc6676tGCEbeR0E5sO3ZBNa3zq3/ocH3OSy55mree5CexHVj0HSHxLg75Y/HmHLHB5jkJc5h8kSH0DoNQZ8bmoJDSANJkB3Q39iF2CuvKeLZUU+06FM9g27BvJqT+rdpNN12A8LWYfN3m15ZPwtelveu7dClAqg7hm8iRb001xSUv4me5SY3/MUtKrIoj+oGGPvGT4FS+mqQ4Onek0VcaEH1b54TFGkLwgRFEPxHD7mQMsXJnV//loI72NzopKKcpVG6oo5Tcz3JwO52DCP09m4T4o8RHfV3QjXOBkNQXHBbJuagb3TbUBYK+xEKj8iX3hignC4PSNdhfHsVbJ9tZi+yIvc4SvKdFum5AI/jRgej3u9HRGLpA8PwYaKbOACLNDXbfKQYaAAAAAElFTkSuQmCC"><span>${_getLang(
        "start:navi:btntext",
        "开始导航",
      )}</span></div>`;
    }

    wrapperStr += `</div></div><div class="loading-route" style="text-align:center;"><img class="loading-tip" src="${imgUrl}" width="40px;" style="margin:10px auto;"/></div><div class="error-route-container"><span class="error-route-tip">(点击刷新重试)</span></div><div class="error-route-container2"><span class="error-route-tip">请选择起终点</span></div></div>`;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      domUtils.append(that.parentObj, wrapperdom || wrapperStr);
      that.$routingBottom = domUtils.find(that.parentObj, ".routing-bottom");
      that.$btnStartNavi = domUtils.find(that.$routingBottom, ".routing-info-true");
      domUtils.show(that.$routingBottom, false);
    };

    that.injectComponentEvents = function () {
      that.$routingBottom.on("tap", ".route-preference", function (e) {
        if (domUtils.isFastClick()) return;
      });

      that.$routingBottom.on("click", ".routing-info-simulate", function (e) {
        that.listener?.OnStartSimulateClicked?.(that);
      });

      that.$routingBottom.on("click", ".routing-info-true", function (e) {
        if ($(this).hasClass("disabled")) return;
        that.listener?.OnStartNavigationClicked?.(that);
      });

      that.$routingBottom.on("click", ".error-route-container", function () {
        if (domUtils.isFastClick()) return;
        that.listener?.onRouteErrorClicked?.(that);
      });

      that.$routingBottom.on("click", ".error-route-container2", function () {
        if (domUtils.isFastClick()) return;
        that.listener?.onRouteErrorClicked?.(that, that.state);
      });

      that.$routingBottom.on("click", ".pano", function (e) {
        that.listener?.onOpenPano?.(that);
      });
    };

    that.setRealNaviBtn = (text) => that.$routingBottom.find(".routing-info-true span").text(text);
    that.setSimulateNaviBtn = (text) => that.$routingBottom.find(".routing-info-simulate").text(text);

    that.setBottomVisible = function (visible, state, errorTip) {
      that.state = state;
      domUtils.show(that.$routingBottom, visible);

      const $container = that.$routingBottom.find(".route-container");
      const $loading = that.$routingBottom.find(".loading-route");
      const $error = that.$routingBottom.find(".error-route-container");
      const $error2 = that.$routingBottom.find(".error-route-container2");

      if (state == "succeed") {
        $container.show().siblings().hide();
      } else if (state == "loading") {
        $loading.show().siblings().hide();
      } else if (state == "failed") {
        $error.show().siblings().hide();
        $error.find(".error-route-tip").text(errorTip || `(${_getLang("click:retry:tip", "点击刷新重试")})`);
      } else if (state == "noStartPoint") {
        $error2.show().siblings().hide();
        domUtils.find($error2, ".error-route-tip").text(_getLang("select:startpos:text", "请选择起点位置"));
      } else if (state == "noEndPoint") {
        $error2.show().siblings().hide();
        domUtils.find($error2, ".error-route-tip").text(_getLang("select:targetpos:text", "请选择终点位置"));
      }
    };

    that.showLoading = () => that.setBottomVisible(true, "loading");

    that.activeNaviBtn = function (active) {
      domUtils[active ? "removeClass" : "addClass"](that.$btnStartNavi, "disabled");
    };

    that.hideSimulateBtn = () => domUtils.find(that.$routingBottom, ".routing-info-simulate").hide();
    that.showSimulateBtn = () => domUtils.find(that.$routingBottom, ".routing-info-simulate").show();
  };
  daxiapp["DXRouteBottomCard"] = daxiapp["DXRouteTransitListView"] = DXRouteBottomCard;

  /**
   * 通用POI图标列表视图
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXPoiIconList = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.UITemplate = "";

    const wrapperStr = '<section class="icon-container"></section>';

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      domUtils.append(that.parentObj, wrapperdom || wrapperStr);
    };

    that.injectComponentEvents = function () {
      that.parentObj.on("tap", ".icon-container li", that.selectItem);
    };

    that.updateData = function (poiList) {
      const htmlTemp = "{{#icon_list1 commonPois}}{{name}}{{/icon_list1}}";
      const $wrapper = domUtils.find(that.parentObj, ".icon-container");
      domUtils.templateText(htmlTemp, { commonPois: poiList }, $wrapper);
    };

    that.selectItem = function (e) {
      const data = domUtils.getData("icon_list", this);
      that.listener?.onItemBtnClicked?.(that, data);
    };
  };
  daxiapp["DXPoiIconList"] = daxiapp["DXCommonPOIViewComponent"] = DXPoiIconList;

  /**
   * 通用POI图标列表视图2（支持自适应布局）
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXPoiIconList2 = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.UITemplate = "";

    const wrapperStr = '<section class="icon-container"></section>';

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      domUtils.append(that.parentObj, wrapperdom || wrapperStr);
    };

    that.injectComponentEvents = function () {
      that.parentObj.on("tap", ".icon-container li", that.selectItem);
    };

    that.updateData = function (poiList) {
      const htmlTemp = "{{#icon_list3 commonPois}}{{name}}{{/icon_list3}}";
      const $wrapper = domUtils.find(that.parentObj, ".icon-container");
      domUtils.templateText(htmlTemp, { commonPois: poiList }, $wrapper);

      // 少于等于5个时使用flex自适应布局
      if (poiList.length <= 5) {
        const $mainlist = domUtils.find(that.parentObj, ".main-icon-list");
        $mainlist.css({ display: "flex", "justify-content": "space-around" });
      }
    };

    that.selectItem = function (e) {
      const data = domUtils.getData("icon_list", this);
      that.listener?.onItemBtnClicked?.(that, data);
    };
  };
  daxiapp["DXPoiIconList2"] = daxiapp["DXCommonPOIViewComponent2"] = DXPoiIconList2;

  /**
   * 科室/分类列表视图（左右分栏布局）
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXDepartmentView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.UITemplate = "";

    const wrapperStr = '<div class="search-page-content"></div>';

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      domUtils.append(that.parentObj, wrapperdom || wrapperStr);
    };

    that.injectComponentEvents = function () {
      // 左侧分类切换
      that.parentObj.on("tap", ".left > div > div", function () {
        if (domUtils.isFastClick()) return;
        const index = $(this).index();
        $(this).addClass("active").siblings().removeClass("active");
        that.parentObj.find(".sub-genres-collection").removeClass("on").eq(index).addClass("on");
        that.parentObj.find(".sub-genres-collection.on .sub-collection-content").forEach((item) => {
          $(item).css("max-height", $(item).height());
        });
      });

      // 右侧标签点击
      that.parentObj.on("tap", ".right .sub-tag", that.selectItem);

      // 右侧分类折叠
      that.parentObj.on("tap", ".right .sub-collection-title", function () {
        const $this = $(this);
        const isCollapse = $this.hasClass("collapse");
        let maxHeight = $this.attr("maxHeight") || $this.siblings().height();
        $this.attr("maxHeight", maxHeight);

        if (!isCollapse) {
          $this.addClass("collapse");
          $this.siblings().css("max-height", 0).addClass("hidden");
        } else {
          $this.removeClass("collapse");
          $this.siblings().css("max-height", `${maxHeight}px`).removeClass("hidden");
        }
      });
    };

    that.updateData = function (poiList) {
      const htmlTemp = "{{#department_list commonPois}}{{name}}{{/department_list}}";
      const $wrapper = domUtils.find(that.parentObj, ".search-page-content");
      domUtils.templateText(htmlTemp, { commonPois: poiList }, $wrapper);

      that.parentObj.find(".sub-genres-collection.on .sub-collection-content").forEach((item) => {
        $(item).css("max-height", $(item).height());
      });
    };

    that.selectItem = function (e) {
      const data = domUtils.getData("icon_list", this);
      that.listener?.onRightBtnClicked?.(that, data);
    };
  };
  daxiapp["DXDepartmentView"] = daxiapp["DXDepartmentViewComponent"] = DXDepartmentView;

  /**
   * 收藏列表视图
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXFavoriteView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.UITemplate = "";

    const wrapperStr = '<section class="favorite-container"></section>';

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      domUtils.append(that.parentObj, wrapperdom || wrapperStr);
      that._dom = that.parentObj.find(".favorite-container");
    };

    that.injectComponentEvents = function () {
      that.parentObj.on("tap", ".go-selected-pos", function (event) {
        if (domUtils.isFastClick()) return;
        const poiInfo = _getPoiData($(this).parent(".genre-item"));
        that.listener?.onTakeToThere?.(that, poiInfo);
      });

      that.parentObj.on("tap", ".favoIcon", function () {
        if (domUtils.isFastClick()) return;
        const poiInfo = _getPoiData($(this).parent(".genre-item"));
        that.listener?.onRemoveFavoriteBtnClicked?.(that, poiInfo);
      });

      that.parentObj.on("tap", ".favoShare", function () {
        if (domUtils.isFastClick()) return;
        const poiInfo = _getPoiData($(this).parent(".genre-item"));
        delete poiInfo.poiId;
        that.listener?.onShareBtnClicked?.(that, poiInfo);
      });

      that.parentObj.parents("#favorite_page").on("tap", ".goback", function () {
        if (domUtils.isFastClick()) return;
        that.listener?.onGoback?.(that);
      });
    };

    that.updateData = function (data, showShare) {
      const shareHtml = showShare ? '<div class="go-share2 share favoShare"><i class="icon-fenxiang"></i></div>' : "";
      const htmlTemp = `{{#each poiTypeList}}<li class="genre-item" data-id="{{id}}" data-poiId="{{ftId}}" data-bdid="{{bdid}}" data-name="{{name}}" data-address="{{address}}" data-floorId="{{floorId}}" data-lon="{{longitude}}" data-lat="{{latitude}}"><div class="favoIcon icon-favorite"></div><div class="favoText"><span class="name">{{name}}</span><span class="address">{{floorCnName}} {{address}}</span></div>${shareHtml}<div class="go-selected-pos icon-zhixing-right"><span class="gohere">${_getLang(
        "route:btntext",
        "路线",
      )}</span></div></li>{{/each}}`;
      domUtils.templateText(htmlTemp, { poiTypeList: data }, that._dom);
    };

    that.getAttr = _getPoiData;
  };
  daxiapp["DXFavoriteView"] = daxiapp["DXFavoriteViewComponent"] = DXFavoriteView;

  /**
   * 反馈列表视图
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXFeedbackListView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.UITemplate = "";

    const wrapperStr = '<section class="fankui-container"></section>';

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      domUtils.append(that.parentObj, wrapperdom || wrapperStr);
      that._dom = that.parentObj.find(".fankui-container");
    };

    that.injectComponentEvents = function () {
      that.parentObj.on("tap", ".go-selected-pos", function (event) {
        if (domUtils.isFastClick()) return;
        const poiInfo = _getPoiData($(this).parent(".genre-item"));
        that.listener?.onTakeToThere?.(that, poiInfo);
      });
    };

    that.updateData = function (data, showShare) {
      const htmlTemp = `{{#each poiTypeList}}<li class="genre-item" data-id="{{id}}" data-poiId="{{ftId}}" data-name="{{name}}" data-address="{{address}}" data-floorId="{{floorId}}" data-lon="{{longitude}}" data-lat="{{latitude}}"><div class="favoIcon icon-clock"></div><div style="flex: 1;"><div class="text"><span class="fankui_info">{{feedback}}</span></div><div class="type"><span>{{#eq type 0}}位置报错{{/eq}}{{#eq type 1}}路线报错{{/eq}}{{#eq type 2}}地址报错{{/eq}}{{#eq type 3}}其他报错{{/eq}}</span></div></div><div class="operation"><span class="time">{{createTime}}</span></div></li>{{/each}}`;
      domUtils.templateText(htmlTemp, { poiTypeList: data }, that._dom);
    };

    that.getAttr = _getPoiData;
  };
  daxiapp["DXFeedbackListView"] = daxiapp["DXFankuiViewComponent"] = DXFeedbackListView;

  /**
   * POI详情视图（带音频播放功能）
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXPoiAudioDetailView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.UITemplate = "";
    that.audioDom = null;
    that._data = null;
    that._params = null;

    const wrapperStr = '<section class="poiDetail-container"></section>';

    that.init = function (listener, params) {
      that._params = params || {};
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      domUtils.append(that.parentObj, wrapperdom || wrapperStr);
      that._dom = that.parentObj.find("#poiDetail_page");
    };

    that.updateData = function (data) {
      const bdinfo = that._app._mapView._mapSDK.getCurrentBuildingInfo();
      const imgArr = [];

      if (data.infoUrl.indexOf(",") !== -1) {
        data.infoUrl.split(",").forEach((img) => imgArr.push({ imgUrl: img }));
      } else {
        imgArr.push({ imgUrl: data.imageUrl });
      }

      data.bdname = bdinfo.cn_name;
      data.imgArr = imgArr;
      that._data = data;

      const htmlTemp = `<div class="swiper"><div class="swiper-wrapper">{{#each list.imgArr}}<div class="swiper-slide"><img src="{{imgUrl}}" alt=""></div>{{/each}}</div><div class="swiper-pagination"></div></div>{{#if list.audioUrl}}<div class="detailInfo-component-audioBox"><div class="audioContainer"><audio class="audio" style="width: initial;flex:1"><source src="{{list.audioUrl}}" type="audio/mp3"></audio><div class="audioProgressBar"><div class="progressBox"><progress class="audioProgress" value="0" max="100"></progress><div class="progressTime" style="left:0">00:00/00:00</div></div><div class="audioSpeed"><span class="speed speedNow" data-speed="1.0">x1.0</span><div class="speedBox"><div class="speedbox2"><span class="speed speed1 on" data-speed="1.0">x1.0</span><span class="speed speed2" data-speed="1.5">x1.5</span><span class="speed speed3" data-speed="2.0">x2.0</span></div></div></div></div></div><div class="audioControl clearFixed"><div class="prev15"><i class="icon_gb-prev15_3"></i></div><div class="playAndPause play"></div><div class="next15"><i class="icon_gb-next15_3"></i></div></div></div>{{/if}}<div class="poiContent"><div class="title">{{list.name}}</div><div class="bdname">{{list.bdname}}</div><div class="content"></div></div>`;

      const $wrapper = domUtils.find(that._dom, ".wrapper");
      domUtils.templateText(htmlTemp, { list: data }, $wrapper);
      domUtils.find(that._dom, ".content").html(decodeURIComponent(data.description));

      new Swiper(".swiper", {
        autoplay: true,
        pagination: { el: ".swiper-pagination" },
      });

      that.audioDom = domUtils.find(that._dom, "audio")[0];
      that.audioDom?.addEventListener("ended", () => that.listener?.onAudioEnded?.());
      that.loadAudio();
    };

    that.loadAudio = function () {
      const audioDom = that.audioDom;
      if (!audioDom) return;

      audioDom.addEventListener("timeupdate", that.timeupdate);
      audioDom.addEventListener("durationchange", that.onDurationchange);
      audioDom.addEventListener("canplay", that.onCanplay);
      audioDom.addEventListener("play", that.onPlay);
      audioDom.addEventListener("pause", that.onPause);
      audioDom.addEventListener("ended", that.onAudioEnded);
      document.addEventListener("visibilitychange", that.visibilitychangeListener);
    };

    that.startPlay = function () {
      const data = that._data;
      let dxaudio = that.audioDom;

      if (that._params?.speakListener && data?.audioUrl && !dxaudio) {
        const audioDom = that._params.speakListener.speakNow({
          url: data.audioUrl,
          autoplay: data.autoplay,
          noReplaceByNavi: true,
        });
        that.audioDom = audioDom;
        audioDom._parentDom = that._dom;
        that.loadAudio();
      } else if (dxaudio) {
        dxaudio.play();
        domUtils.find(that._dom, ".playAndPause").removeClass("play").addClass("pause");
      }
    };

    that.pausePlay = function () {
      const dxaudio = that.audioDom;
      if (dxaudio) {
        dxaudio.pause();
        domUtils.find(that._dom, ".playAndPause").removeClass("pause").addClass("play");
      }
    };

    that.forward15 = function () {
      const dxaudio = that.audioDom;
      if (dxaudio) {
        const { currentTime, duration } = dxaudio;
        dxaudio.currentTime = currentTime + 15 > duration ? duration : currentTime + 15;
      }
    };

    that.back15 = function () {
      const dxaudio = that.audioDom;
      if (dxaudio) {
        dxaudio.currentTime = dxaudio.currentTime - 15 < 0 ? 0 : dxaudio.currentTime - 15;
      }
    };

    that.setSpeed = function (speed) {
      if (that.audioDom) {
        that.audioDom.playbackRate = speed;
      }
    };

    that.timeupdate = function (e) {
      const dxaudio = e.target;
      const parentDom = dxaudio._parentDom;
      const audioProgressBar = domUtils.find(that._dom, ".audioProgressBar");
      const audioProgress = parentDom ? parentDom.find(".audioProgress") : audioProgressBar.find(".audioProgress");
      const progressTime = parentDom ? domUtils.find(parentDom, ".progressTime") : audioProgressBar.find(".progressTime");
      const { currentTime, duration } = dxaudio;

      if (!duration) return;

      audioProgress.attr("value", currentTime);
      audioProgress.attr("max", duration);
      progressTime.html(`${dxUtils.conversion(currentTime)}/${dxUtils.conversion(duration)}`);

      const width = progressTime.width();
      const parentWidth = progressTime.parent().width();
      const maxOffset = 1 - width / parentWidth;
      const leftPercent = currentTime / duration > maxOffset ? maxOffset : currentTime / duration;
      progressTime.css("left", `${leftPercent * 100}%`);
    };

    that.cancel = function () {
      that.pausePlay();
      that._params?.speakListener?.cancel?.();

      if (that.audioDom) {
        that.audioDom.removeEventListener("timeupdate", that.timeupdate);
        that.audioDom.removeEventListener("durationchange", that.onDurationchange);
        that.audioDom.removeEventListener("canplay", that.onCanplay);
        that.audioDom.removeEventListener("play", that.onPlay);
        that.audioDom.removeEventListener("ended", that.onAudioEnded);
      }
      document.removeEventListener("visibilitychange", that.visibilitychangeListener);
    };

    that.injectComponentEvents = function () {
      that.parentObj.on("tap", ".back", function (event) {
        if (domUtils.isFastClick()) return;
        that.listener?.onGoback?.();
        that.cancel();
      });

      domUtils.on(that._dom, "click", ".playAndPause", function () {
        $(this).hasClass("play") ? that.startPlay() : that.pausePlay();
      });

      domUtils.on(that._dom, "click", ".prev15", () => that.back15());
      domUtils.on(that._dom, "click", ".next15", () => that.forward15());

      domUtils.on(that._dom, "click", ".speedNow", function () {
        const speedArr = [0.75, 1.0, 1.5];
        let speed = parseFloat($(this).attr("data-speed"));
        let index = speedArr.indexOf(speed);
        index = index + 1 >= speedArr.length ? 0 : index + 1;
        $(this).text(`x${speedArr[index]}`).attr("data-speed", speedArr[index]);
        that.setSpeed(speedArr[index]);
      });

      domUtils.on(that._dom, "click", ".speedbox2 span", function () {
        const speed = $(this).attr("data-speed");
        $(this).addClass("on").siblings().removeClass("on");
        that._dom.find(".speedNow").text($(this).text());
        that.setSpeed(parseFloat(speed));
        that._dom.find(".speedBox").removeClass("show");
      });

      domUtils.on(that._dom, "click", ".progressBox", function (e) {
        const dxaudio = that.audioDom;
        if (dxaudio) {
          dxaudio.currentTime = (dxaudio.duration * e.offsetX) / $(this).width();
        }
      });

      domUtils.on(that._dom, "touchmove", ".progressTime", function (e) {
        const $progressBox = domUtils.find(that._dom, ".progressBox");
        const dxaudio = that.audioDom;
        if (dxaudio && $progressBox.width()) {
          dxaudio.currentTime = (dxaudio.duration * (e.changedTouches[0].clientX - $progressBox.offset().left)) / $progressBox.width();
        }
      });

      domUtils.on(that._dom, "touchend", ".progressTime", function (e) {
        const dxaudio = that.audioDom;
        if (dxaudio && dxaudio.duration > dxaudio.currentTime + 1) {
          dxaudio.play();
        }
      });
    };

    that.show = () => domUtils.show(that._dom, true);
    that.hide = () => domUtils.show(that._dom, false);

    that.onAudioEnded = function (e) {
      domUtils.find(that._dom, ".playAndPause").removeClass("pause").addClass("play");
      that.listener?.onAudioEnded?.();
    };

    that.onDurationchange = function () {
      const audioDom = that.audioDom;
      if (!audioDom) return;
      const { currentTime, duration } = audioDom;
      const audioProgress = domUtils.find(that._dom, ".audioProgress");
      const progressTime = domUtils.find(that._dom, ".progressTime");
      audioProgress.attr("value", currentTime).attr("max", duration);
      progressTime.html(`${dxUtils.conversion(currentTime)}/${dxUtils.conversion(duration)}`);
    };

    that.onCanplay = function () {
      if (that.audioDom && that._data?.autoplay) {
        that.audioDom.play();
        domUtils.find(that._dom, ".playAndPause").removeClass("play").addClass("pause");
      }
    };

    that.onPlay = function () {
      domUtils.find(that._dom, ".playAndPause").removeClass("play").addClass("pause");
    };

    that.onPause = function () {
      domUtils.find(that._dom, ".playAndPause").addClass("play").removeClass("pause");
    };

    that.visibilitychangeListener = function () {
      if (document.hidden) that.pausePlay();
    };
  };
  daxiapp["DXPoiAudioDetailView"] = daxiapp["DXPoiDetailViewComponent"] = DXPoiAudioDetailView;

  /**
   * 首页图标列表视图
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXIndexIconView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.UITemplate = "";
    that._params = null;

    const wrapperStr = '<ul class="indexIcon-container"></ul>';

    that.init = function (listener, params) {
      that._params = params || {};
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      domUtils.append(that.parentObj, wrapperdom || wrapperStr);
      that._dom = that.parentObj;
    };

    that.updateData = function (data) {
      const htmlTemp =
        '{{#each poiTypeList}}<li data-keyword="{{keyword}}" data-sort="1" data-poi="" data-type="1" data-value="{{name}}" class="item"><span class="icons {{icon}}"></span><span class="name">{{name}}</span></li>{{/each}}';
      const $wrapper = domUtils.find(that.parentObj, ".indexIcon-container");
      domUtils.templateText(htmlTemp, { poiTypeList: data }, $wrapper);
    };

    that.injectComponentEvents = function () {
      that.parentObj.on("tap", ".indexIcon-container li", that.selectItem);
    };

    that.show = () => domUtils.show(that._dom, true);
    that.hide = () => domUtils.show(that._dom, false);

    that.selectItem = function (e) {
      const data = domUtils.getData("icon_list", this);
      that.listener?.onItemBtnClicked?.(that, data);
    };
  };
  daxiapp["DXIndexIconView"] = daxiapp["DXIndexIconComponent"] = DXIndexIconView;

  /**
   * 支付视图
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXPayView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.UITemplate = "";
    that._params = null;

    const wrapperStr = '<section class="pay-container"></section>';

    that.init = function (listener, params) {
      that._params = params || {};
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      that._dom = that.parentObj.find("#pay_page");
      domUtils.append(that._dom, wrapperdom || wrapperStr);
    };

    that.updateData = function (data) {
      const htmlTemp = `<div class="payBefore"><div class="payTitles">瘦西湖官方智能导游</div><div class="payTitles2">看地图，听导游，送耳机</div><ul class="payulli clearFixed"><li><span>基于AI语言大模型<br>深度人文讲解</span></li><li><span>覆盖全景区<br>60个景点</span></li><li><span>游戏级导览图<br>美轮美奂</span></li><li><span>送无线蓝牙耳机</span></li></ul><div class="payTips">即刻开通，低至{{list.price}}元，有效期：3天</div><div class="pay_btn" data-appid="{{list.payData.appId}}" data-timestamp="{{list.payData.timeStamp}}" data-noncestr="{{list.payData.nonceStr}}" data-package="{{list.payData.package}}" data-signtype="{{list.payData.signType}}" data-paysign="{{list.payData.paySign}}" data-payorderid="{{list.payOrderId}}" data-mchorderno="{{list.mchOrderNo}}">购买智能导游</div></div><div class="paySuccess"><div class="titles"><i class="icon-duihao3"></i>支付成功</div><div class="tips">恭喜您成功购买智能导游(有效期三天)</div><div class="orderno">智能导游-订单编号 {{list.orderno}}</div><div class="price">¥{{list.price}}</div><div class="headset"><img src="../shouxihu/images/shouxihu/headset.png" alt=""><div>*别忘记联系工作人员免费获取送的一个蓝牙耳机呦。</div></div><div class="tips2">*点击"送耳机地点"可查看地服务点位置。<br>*请向服务点工作人员出示"游客二维码"，可获得赠送的一个蓝牙耳机。</div><div class="clearFixed"><div class="btn btn_blue">送耳机地点</div><div class="btn btn_white">游客二维码</div></div></div>`;
      const $wrapper = domUtils.find(that._dom, ".wrapper");
      domUtils.templateText(htmlTemp, { list: data }, $wrapper);

      const $payBefore = domUtils.find(that._dom, ".payBefore");
      const $paySuccess = domUtils.find(that._dom, ".paySuccess");

      if (data.type == "paySuccess") {
        $payBefore.hide();
        $paySuccess.show();
      } else if (data.type == "payed") {
        $payBefore.hide();
        $paySuccess.show();
        $paySuccess.find(".titles, .tips, .orderno, .price").hide();
      }
    };

    that.injectComponentEvents = function () {
      that.parentObj.on("tap", ".back", function (event) {
        if (domUtils.isFastClick()) return;
        that.listener?.onGoback?.();
      });

      that.parentObj.on("tap", ".pay_btn", function (event) {
        if (domUtils.isFastClick()) return;
        if (that.listener?.gopay) {
          const $this = $(this);
          that.listener.gopay({
            appid: $this.attr("data-appid"),
            timestamp: $this.attr("data-timestamp"),
            noncestr: $this.attr("data-noncestr"),
            package: $this.attr("data-package"),
            signtype: $this.attr("data-signtype"),
            paysign: $this.attr("data-paysign"),
            payOrderId: $this.attr("data-payorderid"),
            mchOrderNo: $this.attr("data-mchorderno"),
          });
        }
      });

      that.parentObj.on("tap", ".btn_blue", function (event) {
        if (domUtils.isFastClick()) return;
        that.listener?.showHeadsetLocation?.();
      });

      that.parentObj.on("tap", ".btn_white", function (event) {
        if (domUtils.isFastClick()) return;
        that.listener?.showQRCode?.();
      });
    };

    that.show = () => domUtils.show(that._dom, true);
    that.hide = () => domUtils.show(that._dom, false);
  };
  daxiapp["DXPayView"] = daxiapp["DXPayViewComponent"] = DXPayView;

  /**
   * 支付结果视图
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXPayResultView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.UITemplate = "";
    that._params = null;

    const wrapperStr = '<section class="payResult-container"></section>';

    that.init = function (listener, params) {
      that._params = params || {};
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      that._dom = that.parentObj.find("#payResult_page");
      domUtils.append(that._dom, wrapperdom || wrapperStr);
    };

    that.updateData = function (data) {
      const htmlTemp = `<div class="content"><div class="wechatIcon"><span></span></div><div class="payResultBox">支付成功</div><div class="payTitle">智能导游-订单编号{{list.orderno}}</div><div class="payPrcice">¥{{list.price}}</div><div class="btn_pay_finish">完成</div></div>`;
      const $wrapper = domUtils.find(that._dom, ".wrapper");
      domUtils.templateText(htmlTemp, { list: data }, $wrapper);
    };

    that.injectComponentEvents = function () {
      that.parentObj.on("tap", ".back", function (event) {
        if (domUtils.isFastClick()) return;
        that.listener?.onGoback?.();
      });

      that.parentObj.on("tap", ".btn_pay_finish", function (event) {
        if (domUtils.isFastClick()) return;
        that.listener?.finish?.();
      });
    };

    that.show = () => domUtils.show(that._dom, true);
    that.hide = () => domUtils.show(that._dom, false);
  };
  daxiapp["DXPayResultView"] = daxiapp["DXPayResultViewComponent"] = DXPayResultView;

  /**
   * 关于页视图
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXAboutView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.UITemplate = "";
    that._params = null;
    that._data = null;

    const wrapperStr = '<section class="aboutDetail-container"></section>';

    that.init = function (listener, params) {
      that._params = params || {};
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      that._dom = that.parentObj.find("#about_page");
      domUtils.append(that._dom, wrapperdom || wrapperStr);
    };

    that.updateData = function (data) {
      const bdinfo = that._app._mapView._mapSDK.getCurrentBuildingInfo();
      const imgArr = [];

      if (data.infoUrl.indexOf(",") !== -1) {
        data.infoUrl.split(",").forEach((img) => imgArr.push({ imgUrl: img }));
      } else {
        imgArr.push({ imgUrl: data.imageUrl });
      }

      data.bdname = bdinfo.cn_name;
      data.imgArr = imgArr;
      that._data = data;

      const htmlTemp = `<div class="swiper"><div class="swiper-wrapper">{{#each list.imgArr}}<div class="swiper-slide"><img src="{{imgUrl}}" alt=""></div>{{/each}}</div><div class="swiper-pagination"></div></div>`;
      const $wrapper = domUtils.find(that._dom, ".wrapper");
      domUtils.templateText(htmlTemp, { list: data }, $wrapper);
      domUtils.find(that._dom, ".aboutDetail-container").html(data.description);

      new Swiper(".swiper", {
        autoplay: true,
        pagination: { el: ".swiper-pagination" },
      });
    };

    that.injectComponentEvents = function () {
      that.parentObj.on("tap", ".back", function (event) {
        if (domUtils.isFastClick()) return;
        that.listener?.onGoback?.();
      });
    };

    that.show = () => domUtils.show(that._dom, true);
    that.hide = () => domUtils.show(that._dom, false);
  };
  daxiapp["DXAboutView"] = daxiapp["DXAboutViewComponent"] = DXAboutView;

  /**
   * 通用折叠切换逻辑
   * @param {jQuery} $expandBtn - 展开按钮元素
   */
  const _toggleExpandCollapse = ($expandBtn) => {
    const EXPAND = "icon-expand";
    const COLLAPSE = "icon-collapse";
    const $pdom = $expandBtn.parents("aside");

    if (domUtils.hasClass($expandBtn, EXPAND)) {
      domUtils.removeClass($expandBtn, EXPAND);
      domUtils.addClass($expandBtn, COLLAPSE);
      domUtils.removeClass($pdom, "expand-content");
      domUtils.addClass($pdom, "collapse-content");
    } else {
      domUtils.removeClass($expandBtn, COLLAPSE);
      domUtils.addClass($expandBtn, EXPAND);
      domUtils.removeClass($pdom, "collapse-content");
      domUtils.addClass($pdom, "expand-content");
    }
  };

  /**
   * POI类型分类列表视图
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXPoiTypeListView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.UITemplate = "";

    const wrapperStr = '<section class="text-container"></section>';

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      domUtils.append(that.parentObj, wrapperdom || wrapperStr);
    };

    that.injectComponentEvents = function () {
      that.parentObj.on("tap", ".text-container li", that.selectItem);
      that.parentObj.on("tap", ".flexible h3", function (e) {
        const $expandBtn = domUtils.find($(this), ".expand");
        _toggleExpandCollapse($expandBtn);
      });
    };

    that.updateData = function (data) {
      const htmlTemp =
        '{{#each poiTypeList}}<aside class="expand-content flexible"><h3>{{title}}<span class="icon-expand expand"></span></h3>{{#text_list1 list}}{{name}}{{/text_list1}}</aside>{{/each}}';
      const $wrapper = domUtils.find(that.parentObj, ".text-container");
      domUtils.templateText(htmlTemp, { poiTypeList: data }, $wrapper);
    };

    that.selectItem = function (e) {
      const data = domUtils.getData("text_list", this);
      that.listener?.onItemBtnClicked?.(that, data);
    };
  };
  daxiapp["DXPoiTypeListView"] = daxiapp["DXPoiTypeListViewComponent"] = DXPoiTypeListView;

  /**
   * POI类型分类列表视图2（带地址显示）
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXPoiTypeListView2 = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.UITemplate = "";

    const wrapperStr = '<section class="text-container"></section>';

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      domUtils.append(that.parentObj, wrapperdom || wrapperStr);
    };

    that.injectComponentEvents = function () {
      that.parentObj.on("tap", ".text-container li", that.selectItem);
      that.parentObj.on("tap", ".flexible h3", function (e) {
        const $expandBtn = domUtils.find($(this), ".expand");
        _toggleExpandCollapse($expandBtn);
      });
    };

    that.updateData = function (data) {
      const htmlTemp =
        '{{#each poiTypeList}}<aside class="expand-content flexible"><h3>{{title}}</h3>{{#text_list4 list}}{{name}}<span>{{address}}</span>{{/text_list4}}</aside>{{/each}}';
      const $wrapper = domUtils.find(that.parentObj, ".text-container");
      domUtils.templateText(htmlTemp, { poiTypeList: data }, $wrapper);
    };

    that.selectItem = function (e) {
      const data = domUtils.getData("text_list", this);
      that.listener?.onItemBtnClicked?.(that, data);
    };
  };
  daxiapp["DXPoiTypeListView2"] = daxiapp["DXPoiTypeListViewComponent2"] = DXPoiTypeListView2;

  /**
   * 会展日程视图
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXExhibitionScheduleView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.UITemplate = "";

    const wrapperStr = '<section class="text-container"></section>';

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      domUtils.append(that.parentObj, wrapperdom || wrapperStr);
    };

    that.injectComponentEvents = function () {
      that.parentObj.on("tap", ".boxs", function () {
        const poiid = $(this).attr("data-poi");
        that.listener?.onItemBtnClicked?.(that, { poiIds: poiid, dataType: 11, type: 1, sort: 1 });
      });

      that.parentObj.on("tap", ".flexible h3", function (e) {
        const $expandBtn = domUtils.find($(this), ".expand");
        _toggleExpandCollapse($expandBtn);
      });
    };

    that.updateData = function (data) {
      const htmlTemp =
        '{{#each poiTypeList}}<aside class="expand-content flexible"><h3 class="clearfix">{{title}}<span class="icon-expand expand fr"></span></h3>{{#text_list5 list}}{{name}}{{/text_list5}}</aside>{{/each}}';
      const $wrapper = domUtils.find(that.parentObj, ".text-container");
      domUtils.templateText(htmlTemp, { poiTypeList: data }, $wrapper);
    };
  };
  daxiapp["DXExhibitionScheduleView"] = daxiapp["DXEXSHViewComponent"] = DXExhibitionScheduleView;

  /**
   * 地图选点选项组件
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXSelectPointOption = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;
    that.$dom = null;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom = `<div class="selcon on"><ul class="select_options"><li class="icon_gb-positon located-pos"><span>${_getLang(
        "my:currentpos",
        "我的位置",
      )}</span></li><li class="icon_gb-map2 select-pos"><span>${_getLang("select:mappoint:text", "地图选点")}</span></li></ul></div>`;
      domUtils.append(that.parentObj, dom);
      that.$dom = domUtils.find(that.parentObj, ".selcon");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that.$dom, "click", ".located-pos", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onMyPostionBtnClicked?.(that);
      });

      domUtils.on(that.$dom, "click", ".select-pos", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onMapSelectPointBtnClicked?.(that);
      });
    };

    return that;
  };
  daxiapp["DXSelectPointOption"] = daxiapp["DXSelectPointOptionComponent"] = DXSelectPointOption;

  /**
   * 地图选点选项组件2（支持多语言切换）
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXSelectPointOption2 = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;
    that.$dom = null;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom = `<div class="selcon on"><ul class="select_options"><li class="icon-wodeweizhi located-pos"><span>${_getLang(
        "my:currentpos",
        "我的位置",
      )}</span></li><li class="icon-dituxuandian select-pos"><span>${_getLang("select:mappoint:text", "地图选点")}</span></li></ul></div>`;
      domUtils.append(that.parentObj, dom);
      that.$dom = domUtils.find(that.parentObj, ".selcon");
    };

    that.changeLanguage = function () {
      that.$dom.find(".located-pos span").text(_getLang("my:currentpos", "我的位置"));
      that.$dom.find(".select-pos span").text(_getLang("select:mappoint:text", "地图选点"));
    };

    that.injectComponentEvents = function () {
      domUtils.on(that.$dom, "click", ".located-pos", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onMyPostionBtnClicked?.(that);
      });

      domUtils.on(that.$dom, "click", ".select-pos", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onMapSelectPointBtnClicked?.(that);
      });
    };

    return that;
  };
  daxiapp["DXSelectPointOption2"] = daxiapp["DXSelectPointOptionComponent2"] = DXSelectPointOption2;

  /**
   * 历史记录列表组件
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXHistoryList = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;
    that._dom = null;

    /** 处理列表折叠逻辑 */
    const _setupListCollapse = (maxLen = 3) => {
      const listDom = that._dom.find(".history_list .item");
      if (!listDom.length) return;

      const offsetLeft = listDom[0].offsetLeft;
      let len = 0;

      for (let i = 0; i < listDom.length; i++) {
        if (listDom[i].offsetLeft == offsetLeft) len++;
        $(listDom[i]).addClass(len > maxLen ? "hidden" : "show");
      }

      if (len > maxLen) {
        that._dom.find(".history_list").append("<li class='openMore' data-show='1'><span class='icon_gb-down'></span></li>");
        const openMore = that._dom.find(".openMore");
        if (openMore.offset().left == offsetLeft) {
          that._dom.find(".history_list .show").eq(-1).addClass("hidden");
        }
      }
    };

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      domUtils.append(that.parentObj, '<div class="history_container"></div>');
      that._dom = domUtils.find(that.parentObj, ".history_container");
    };

    that.injectComponentEvents = function () {
      const dom = that._dom;

      domUtils.on(dom, "tap", ".item", function (e) {
        if (domUtils.isFastClick()) return;
        const data = domUtils.getData("history_list", this);
        that.listener?.onListItemClicked?.(that, data);
      });

      domUtils.on(dom, "tap", ".btn_delete", function (e) {
        if (domUtils.isFastClick()) return;
        $(this).hide();
        that._dom.find(".deleteConfirm").show();
      });

      domUtils.on(dom, "tap", ".delAll", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onClearBtnClicked?.(that);
        that._dom.find(".deleteConfirm").hide();
      });

      domUtils.on(dom, "tap", ".finish", function (e) {
        if (domUtils.isFastClick()) return;
        that._dom.find(".btn_delete").show();
        that._dom.find(".deleteConfirm").hide();
      });

      domUtils.on(dom, "tap", ".clear_history", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onClearBtnClicked?.(that);
      });

      domUtils.on(dom, "tap", ".openMore", function (e) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        const show = $this.attr("data-show");
        if (show == 1) {
          that._dom.find(".hidden").css("display", "inline-block");
          $this.attr("data-show", 2).find("span").css("transform", "rotate(180deg)");
        } else {
          that._dom.find(".hidden").css("display", "none");
          $this.attr("data-show", 1).find("span").css("transform", "rotate(0deg)");
        }
      });
    };

    that.updateData = function (list) {
      list.forEach((item) => {
        if (item.data && typeof item.data == "object") {
          item.extenddata = JSON.stringify(item.data);
        }
      });

      const listhbs = `<div class="searchTitle clearfix"><span class="titleText">${_getLang(
        "recently:search:text",
        "最近搜索",
      )}</span>{{#if list.length}}<div class="btns"><span class="btn_delete"><i class="icon_gb-delete"></i></span><span class="deleteConfirm"><span class="delAll">${_getLang(
        "delete:all:btntext",
        "全部删除",
      )}</span><span class="finish">${_getLang(
        "complete:text",
        "完成",
      )}</span></span></div>{{/if}}</div>{{#if list.length}}<ul class="history_list">{{#each list}}<li class="item {{#if lon}}icon-mypos{{else}}icon-search1{{/if}}" data-keyword="{{name}}" data-bdid="{{bdid}}" data-lon="{{lon}}" data-lat="{{lat}}" data-id="{{poiId}}" data-address="{{address}}" data-text="{{text}}" data-floorId="{{floorId}}" data-floorname="{{floorName}}" data-datatype="{{dataType}}" data-viewtype="{{viewType}}" data-type="{{type}}" data-floorCnName="{{floorCnName}}" {{#if extenddata}}data-extenddata="{{extenddata}}"{{/if}}{{#if category}}data-category="{{category}}"{{/if}}><span class="poscon">{{name}}</span></li>{{/each}}</ul>{{else}}<div class="nodata">${_getLang(
        "no:history:tip",
        "暂无记录",
      )}</div>{{/if}}`;

      domUtils.templateText(listhbs, { list }, that._dom);
      setTimeout(() => _setupListCollapse(3), 0);
    };

    that.show = () => domUtils.show(that._dom, true);
    that.hide = () => domUtils.show(that._dom, false);

    return that;
  };
  daxiapp["DXHistoryList"] = daxiapp["DXHistoryListComponent"] = DXHistoryList;

  /**
   * 历史记录列表组件2（支持删除单条、资源推荐）
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXHistoryList2 = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;
    that._dom = null;

    let newList = [];
    let newSearchList = [];

    /** 处理列表折叠逻辑 */
    const _setupListCollapse = (maxLen = 3) => {
      const listDom = that._dom.find(".history_list .item");
      if (!listDom.length) return;

      const offsetLeft = listDom[0].offsetLeft;
      let len = 0;

      for (let i = 0; i < listDom.length; i++) {
        if (listDom[i].offsetLeft == offsetLeft) len++;
        $(listDom[i]).addClass(len > maxLen ? "hidden" : "show");
      }

      if (len > maxLen) {
        that._dom.find(".history_list").append("<li class='openMore' data-show='1'><span class='icon_gb-down'></span></li>");
        const openMore = that._dom.find(".openMore");
        if (openMore.offset().left == offsetLeft) {
          that._dom.find(".history_list .show").eq(-1).addClass("hidden");
        }
      }
    };

    /** 从列表中移除指定项 */
    const _removeFromList = (poiId) => {
      for (let i = 0; i < newList.length; i++) {
        if (newList[i].text == poiId || newList[i].poiId == poiId) {
          newList.splice(i, 1);
          break;
        }
      }
    };

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      domUtils.append(that.parentObj, '<div class="history_container"></div>');
      that._dom = domUtils.find(that.parentObj, ".history_container");
    };

    that.injectComponentEvents = function () {
      const dom = that._dom;

      domUtils.on(dom, "tap", ".poscon", function (e) {
        if (domUtils.isFastClick()) return;
        const data = domUtils.getData("history_list", this.closest("li"));
        that.listener?.onListItemClicked?.(that, data);
      });

      domUtils.on(dom, "tap", ".resource_content_item", function (e) {
        if (domUtils.isFastClick()) return;
        if (that.listener?.onListItemClicked) {
          const text = $(this).text();
          that.listener.onListItemClicked(that, {
            bdid: that._app._mapView._mapSDK.getCurrentBDID() || "B000A11DN6",
            dataType: 1,
            keyword: text,
            text,
            type: 1,
            viewType: "",
          });
          $(".openMore").show();
        }
      });

      domUtils.on(dom, "tap", ".btn_delete", function (e) {
        if (domUtils.isFastClick()) return;
        $(this).hide();
        $(".HistoryIcon").css("display", "inline-block");
        that._dom.find(".hidden").removeClass("hidden").addClass("show");
        $(".openMore").attr("data-show", "2").find("span").css("transform", "rotate(180deg)");
        $(".openMore").hide();
        that._dom.find(".deleteConfirm").show();

        // 限制最多显示6行
        const listDom = that._dom.find(".history_list .item");
        const offsetLeft = listDom[0].offsetLeft;
        let len = 0;
        for (let i = 0; i < listDom.length; i++) {
          if (listDom[i].offsetLeft == offsetLeft) len++;
          $(listDom[i])
            .toggleClass("show", len <= 6)
            .toggleClass("hidden", len > 6);
        }
      });

      domUtils.on(dom, "tap", ".delAll", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onClearBtnClicked?.(that);
        that._dom.find(".deleteConfirm").hide();
      });

      domUtils.on(dom, "tap", ".finish", function (e) {
        if (domUtils.isFastClick()) return;
        that._dom.find(".btn_delete").show();
        that._dom.find(".deleteConfirm").hide();
        that._dom.find(".HistoryIcon").hide();
        $(".openMore").show();
        that.updateData(newList, newSearchList);
      });

      domUtils.on(dom, "tap", ".HistoryIcon", function (e) {
        if (domUtils.isFastClick()) return;
        const $li = $(this).closest("li");
        const poiId = $li.data("id") || $li.data("text");
        if (that.listener?.onDelItemBtnClicked) {
          _removeFromList(poiId);
          $li.remove();
          that.listener.onDelItemBtnClicked(that, poiId);
          that._dom.find(".history_list .hidden").eq(0).removeClass("hidden").addClass("show");
        }
      });

      domUtils.on(dom, "tap", ".clear_history", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onClearBtnClicked?.(that);
      });

      domUtils.on(dom, "tap", ".openMore", function (e) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        const show = $this.attr("data-show");

        if (show == 1) {
          that._dom.find(".hidden").removeClass("hidden").addClass("show");
          $this.attr("data-show", 2).find("span").css("transform", "rotate(180deg)");

          // 超过6行时删除多余项
          const listDom = that._dom.find(".history_list .item");
          const offsetLeft = listDom[0].offsetLeft;
          let len = 0;
          for (let i = 0; i < listDom.length; i++) {
            if (listDom[i].offsetLeft == offsetLeft) len++;
            if (len > 6) {
              const poiText = $(listDom[i]).attr("data-id") || $(listDom[i]).attr("data-text");
              $(listDom[i]).remove();
              that.listener?.onDelItemBtnClicked?.(that, poiText);
            } else {
              $(listDom[i]).removeClass("hidden").addClass("show");
            }
          }

          if (len >= 6) {
            const openMore = that._dom.find(".openMore");
            if (openMore.offset().left == offsetLeft) {
              const lastShow = that._dom.find(".history_list .show");
              const $last = lastShow.eq(-1);
              const poiText = $last.attr("data-id") || $last.attr("data-text");
              $last.remove();
              that.listener?.onDelItemBtnClicked?.(that, poiText);
              _removeFromList(poiText);
            }
          }
        } else {
          that.updateData(newList, newSearchList);
        }
      });
    };

    that.updateData = function (list, searchList) {
      list.forEach((item) => {
        if (item.data && typeof item.data == "object") {
          item.extenddata = JSON.stringify(item.data);
        }
      });

      newList = list;
      newSearchList = searchList;

      const listhbs = `<div class="searchTitle clearfix"><span class="titleText">搜索记录</span>{{#if list.length}}<div class="btns"><span class="btn_delete"><i class="icon_gb-delete"></i></span><span class="deleteConfirm"><span class="delAll">全部删除 |</span><span class="finish">完成</span></span></div>{{/if}}</div>{{#if list.length}}<ul class="history_list">{{#each list}}<li class="item {{#if lon}}icon-mypos{{else}}icon-search1{{/if}}" data-keyword="{{name}}" data-bdid="{{bdid}}" data-lon="{{lon}}" data-lat="{{lat}}" data-id="{{poiId}}" data-address="{{address}}" data-text="{{text}}" data-floorId="{{floorId}}" data-floorname="{{floorName}}" data-datatype="{{dataType}}" data-viewtype="{{viewType}}" data-type="{{type}}" data-floorCnName="{{floorCnName}}" {{#if extenddata}}data-extenddata="{{extenddata}}"{{/if}}><span class="poscon">{{name}}</span><i class="icon_gb-close4 HistoryIcon"></i></li>{{/each}}</ul>{{else}}<div class="nodata">暂无记录</div>{{/if}}{{#each searchList}}<div class="resource"><div class="resource_title">{{title}}</div><div class="resource_content">{{#each list}}<span class="resource_content_item">{{name}}</span>{{/each}}</div></div>{{/each}}`;

      domUtils.templateText(listhbs, { list, searchList }, that._dom);
      setTimeout(() => _setupListCollapse(3), 0);
    };

    that.bindEvents = function () {
      domUtils.on(that._dom, "tap", ".HistoryIcon", function (e) {
        that.listener?.deleteHistory?.($(this).parent());
      });
      domUtils.on(that._dom, "tap", ".resource_content_item", function (e) {
        that.listener?.searchResource?.($(this));
      });
    };

    that.show = () => domUtils.show(that._dom, true);
    that.hide = () => domUtils.show(that._dom, false);

    return that;
  };
  daxiapp["DXHistoryList2"] = daxiapp["DXHistoryListComponent2"] = DXHistoryList2;

  /**
   * 热搜关键词组件
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXHotSearch = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;
    that._dom = null;

    /** 处理列表折叠逻辑 */
    const _setupListCollapse = (maxLen = 3) => {
      const listDom = that._dom.find(".hotSearch_list .item");
      if (!listDom.length) return;

      const offsetLeft = listDom[0].offsetLeft;
      let len = 0;

      for (let i = 0; i < listDom.length; i++) {
        if (listDom[i].offsetLeft == offsetLeft) len++;
        $(listDom[i]).addClass(len > maxLen ? "hidden" : "show");
      }

      if (len > maxLen) {
        that._dom.find(".hotSearch_list").append("<li class='openMore' data-show='1'><span class='icon_gb-down'></span></li>");
        const openMore = that._dom.find(".openMore");
        if (openMore.offset().left == offsetLeft) {
          that._dom.find(".hotSearch_list .show").eq(-1).addClass("hidden");
        }
      }
    };

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      domUtils.append(that.parentObj, '<div class="hotSearch_container"></div>');
      that._dom = domUtils.find(that.parentObj, ".hotSearch_container");
    };

    that.injectComponentEvents = function () {
      const dom = that._dom;

      domUtils.on(dom, "tap", ".item", function (e) {
        if (domUtils.isFastClick()) return;
        const data = domUtils.getData("hosSearch_list", this);
        that.listener?.onListItemClicked?.(that, data);
      });

      domUtils.on(dom, "tap", ".openMore", function (e) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        const show = $this.attr("data-show");
        if (show == 1) {
          that._dom.find(".hidden").css("display", "inline-block");
          $this.attr("data-show", 2).find("span").css("transform", "rotate(180deg)");
        } else {
          that._dom.find(".hidden").css("display", "none");
          $this.attr("data-show", 1).find("span").css("transform", "rotate(0deg)");
        }
      });
    };

    that.updateData = function (list) {
      const listhbs = `<div class="searchTitle clearfix"><span class="titleText">${_getLang(
        "hotword:title",
        "热搜",
      )}</span></div>{{#if list.length}}<ul class="hotSearch_list">{{#each list}}<li class="item" data-keyword="{{keyword}}" data-bdid="{{bdid}}"><span class="poscon">{{keyword}}</span></li>{{/each}}</ul>{{else}}<div class="nodata">${_getLang(
        "no:history:tip",
        "暂无记录",
      )}</div>{{/if}}`;

      domUtils.templateText(listhbs, { list }, that._dom);
      setTimeout(() => _setupListCollapse(3), 0);
    };

    that.show = () => domUtils.show(that._dom, true);
    that.hide = () => domUtils.show(that._dom, false);

    return that;
  };
  daxiapp["DXHotSearch"] = daxiapp["DXHotSearchComponent"] = DXHotSearch;

  /**
   * POI选择列表组件
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   * @param {Object} options - 配置选项
   */
  const DXSelectPoiList = function (app, parentObject, options) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;
    that._dom = null;

    /** 从DOM元素获取POI信息 */
    const _getPoiInfoFromElement = ($poiItem) => {
      const name = ($poiItem.data("text") || "") + "";
      const address = ($poiItem.data("address") || "") + "";
      return {
        poiId: ($poiItem.data("id") || "") + "",
        bdid: ($poiItem.data("bdid") || "") + "",
        floorId: ($poiItem.data("floorid") || "") + "",
        lon: $poiItem.data("lon"),
        lat: $poiItem.data("lat"),
        name,
        address,
        code: $poiItem.data("code"),
        category: $poiItem.data("category") || "",
        detailed: $poiItem.data("detailed"),
      };
    };

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      domUtils.append(that.parentObj, '<div class="autocomplete_contariner"></div>');
      that._dom = domUtils.find(that.parentObj, ".autocomplete_contariner");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".genre-item-detail", function (e) {
        if (domUtils.isFastClick()) return;
        const $poiItem = $(this).parents("li");
        const poiInfo = _getPoiInfoFromElement($poiItem);
        that.listener?.showDetail?.(that, poiInfo, options?.extendInfo);
        e.stopPropagation();
        e.preventDefault();
      });

      domUtils.on(that._dom, "click", ".genre-item-gohere", function (e) {
        if (domUtils.isFastClick()) return;
        const $poiItem = $(this).parents("li");
        const poiInfo = _getPoiInfoFromElement($poiItem);
        that.listener?.onTakeToThere?.(that, poiInfo);
        e.stopPropagation();
        e.preventDefault();
      });

      domUtils.on(that._dom, "click", ".item", function (e) {
        if (domUtils.isFastClick()) return;
        const data = domUtils.getData("autocomplete_list", this);
        const index = $(this).index();
        that.listener?.onListItemClicked?.(that, data, index);
        e.stopPropagation();
        e.preventDefault();
      });
    };

    that.updateData = function (list) {
      if (list?.length) {
        list.forEach((item) => {
          if (typeof item.data == "object") {
            if (item.data.description) {
              item.data.description = encodeURIComponent(item.data.description).replace(/'/g, "");
            }
            item.extentdata = JSON.stringify(item.data);
          }
        });

        if (options?.hideDistance) list.hideDistance = true;
        if (options?.extendInfo) list.extendInfo = options.extendInfo;

        const listhbs = "{{#autocomplete_list list}}{{name}}{{/autocomplete_list}}";
        domUtils.templateText(listhbs, { list }, that._dom);
      } else {
        that.showErrorTip();
      }
    };

    that.showErrorTip = function (errorTip) {
      const text = errorTip || _getLang("empty:tip3:search", "暂未找到相关搜索");
      that._dom.html(`<div class="noResult"><div class="info"><span class="icon-help1"></span></div><span class="info_text">${text}</span></div>`);
    };

    that.show = () => domUtils.show(that._dom, true);
    that.hide = () => domUtils.show(that._dom, false);

    return that;
  };
  daxiapp["DXSelectPoiList"] = daxiapp["DXSelectPoiListComponent"] = DXSelectPoiList;

  /**
   * 空数据提示组件
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXNoResultTip = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;
    that._dom = null;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
    };

    that.injectComponentUI = function () {
      const text = _getLang("empty:tip4:search", "很抱歉，未找到结果，您可以换个词试试！");
      domUtils.append(
        that.parentObj,
        `<div class="noResult"><div class="info"><span class="icon-help1"></span></div><span class="info_text">${text}</span></div>`,
      );
      that._dom = domUtils.find(that.parentObj, ".noResult");
    };

    that.updateData = function (text) {
      domUtils.find(that._dom, ".info_text").text(text);
    };

    that.show = () => that._dom.show();
    that.hide = () => that._dom.hide();

    return that;
  };
  daxiapp["DXNoResultTip"] = daxiapp["NoResultTipComponent"] = DXNoResultTip;

  /**
   * 加载中提示组件
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXLoading = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;
    that._dom = null;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
    };

    that.injectComponentUI = function () {
      const content =
        '<div class="loading_tip" style="width: 100%;height: 100%;text-align: center;position: absolute;top: 0px;bottom: 0px;background: rgb(255,255,255,0.8); z-index: 2;"><span class="loading" style="display:inline-block;margin-top: 16%;width: 128px;height:128px"></span></div>';
      domUtils.append(that.parentObj, content);
      that._dom = domUtils.find(that.parentObj, ".loading_tip");
    };

    that.updateData = function (imgUrl) {
      domUtils.find(that._dom, ".loading").text(imgUrl);
    };

    that.show = () => that._dom.show();
    that.hide = () => that._dom.hide();

    return that;
  };
  daxiapp["DXLoading"] = daxiapp["LoadingComponent"] = DXLoading;

  /**
   * 带标题的头部组件
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXHeaderWithTip = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;
    that._dom = null;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom = '<div class="dx_header_wrapper_with_text"><ul class="dx_header"><li class="goback icon-fanhui"></li><li class="title"></li></ul></div>';
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".dx_header_wrapper_with_text");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".goback", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onBackBtnClicked?.(that);
      });
    };

    that.updateData = function (title) {
      domUtils.find(that._dom, ".title").text(title);
    };

    that.show = () => that._dom.show();
    that.hide = () => that._dom.hide();

    return that;
  };
  daxiapp["DXHeaderWithTip"] = daxiapp["DXHeaderWithTipComponent"] = DXHeaderWithTip;

  /**
   * 图片展示组件
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXImage = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;
    that._dom = null;
    that._imageDom = null;
    that.animateTimer = null;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      domUtils.append(that.parentObj, '<div class="imageWrapper"><img class="dx_image" src="" /></div>');
      that._dom = domUtils.find(that.parentObj, ".imageWrapper");
      that._imageDom = domUtils.find(that.parentObj, ".dx_image");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".dx_image", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onImageClicked?.(that);
      });
    };

    that.updateData = function (url) {
      that._imageDom.attr("src", url);
    };

    that.setWrapperStyle = function (cssObj, childStyle) {
      that._dom.css(cssObj);
      if (childStyle) that._imageDom.css(childStyle);
    };

    that.show = () => that._dom.show();
    that.hide = () => that._dom.hide();

    that.animate = function (animateClass, time) {
      domUtils.removeClass(that._imageDom, animateClass);
      clearTimeout(that.animateTimer);
      setTimeout(() => domUtils.addClass(that._imageDom, animateClass), 0);
      if (time) {
        that.animateTimer = setTimeout(() => domUtils.removeClass(that._imageDom, animateClass), time);
      }
    };

    return that;
  };
  daxiapp["DXImage"] = daxiapp["DXImageComponent"] = DXImage;

  /**
   * POI搜索结果列表视图2
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXPoiResultView2 = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.reslist = null;
    that.state = "";
    that.title = "";
    that.status = false;
    that.isActivePage = false;
    that.viewDataPose = null;
    that.UITemplate = "";
    that.itemHeight = 54;
    that.singleMargin = 5;
    that.data = null;
    that._dom = null;
    that._scroller = null;
    that._height = null;
    that.list_message_tip = "";
    that.hasMapPoint = false;

    const genreListShowHtml = `{{#eq resultList.length 0}}<div class="empty-state">没有查到相关结果</div>{{/eq}}{{#gt resultList.length 0}}<div class="genre-list-show"><div class="genre-list-items">{{#each resultList}}<div class="genre-list-item poi-list-item" data-poi="{{poiId}}" data-bdid="{{#if bdid}}{{bdid}}{{/if}}" data-floorid="{{floorId}}" data-lon={{lon}} data-lat={{lat}} {{#if text}}data-name="{{text}}" {{else}}data-name="{{title}}" {{/if}} data-address="{{address}}" data-label={{label}}><div class="genre-item"><div class="icon-mypos"></div><div class="genre-info"><div class="genre-name">{{text}}{{#if label}}<span class="genre-wuzhangai">{{label}}</span>{{/if}}</div><div class="external_info"><span class="genre-distance">{{distanceDes}}</span><span class="genre-address">{{address}}</span></div></div>{{#if noRoute}}{{else}}<div class="genre-item-gohere"><i class="icon_gb-line"></i><span>路线</span></div>{{/if}}</div></div>{{/each}}</div>{{/gt}}`;

    /** 从DOM元素获取POI信息 */
    const _getPoiData = ($poiItem) => {
      const name = ($poiItem.data("name") || "") + "";
      const address = ($poiItem.data("address") || "") + "";
      return {
        poiId: ($poiItem.data("poi") || "") + "",
        bdid: $poiItem.data("bdid"),
        floorId: ($poiItem.data("floorid") || "") + "",
        lon: $poiItem.data("lon"),
        lat: $poiItem.data("lat"),
        id: ($poiItem.data("poi") || "") + "",
        name,
        address,
      };
    };

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      const defaultWrapper =
        '<div class="search-list-widget ui-panel" id="slide-poi-list2" style="display:block;height:260px;"><div class="slide-widget-scroller ui-panel" style="overflow-y: scroll;height:100%;box-sizing:border-box"><div id="genre-list" class="genre-list" style="height:100%;box-sizing:border-box"></div></div></div>';
      domUtils.append(that.parentObj, wrapperdom || defaultWrapper);
      that._dom = that.parentObj.find(".search-list-widget");
    };

    that.injectComponentEvents = function () {
      // 点击路线按钮
      that._dom.on("click", ".genre-list-item .genre-item-gohere", function (event) {
        if (domUtils.isFastClick()) return;
        const $poiItem = $(this).parents(".genre-list-item");
        const pintInfo = _getPoiData($poiItem);
        that.listener?.onTakeToThere?.(that, pintInfo);
        event.stopPropagation();
      });

      that._dom.on("click", ".genre-list-item", function (event) {
        if (event.target.className.indexOf("genre-item-gohere") != -1) return;
        that.setActiveItem($(this));
      });

      let lastMoveY;
      that._dom.on("touchstart", "#list-items", function (e) {
        lastMoveY = e.touches[0].clientY;
        e.canScroll = true;
      });

      that._dom.on("touchmove", "#list-items", function (e) {
        const currentY = e.touches[0].clientY;
        window.event.canScroll = currentY - lastMoveY <= 0 || $(this).scrollTop() > 1;
        lastMoveY = currentY;
      });
    };

    that.setActiveItem = function ($poiItem) {
      that._scroller?.stopScroll?.();
      const poiInfo = _getPoiData($poiItem);
      that.listener?.onSelectItemAtIndexPath?.(that, poiInfo);
      $poiItem.addClass("active").siblings().removeClass("active");
      that.scrollToItem($poiItem);
    };

    that.onlySetItemActiveByIndex = function (index) {
      const doms = domUtils.find(that._dom, ".poi-list-item");
      if (!doms.length) return;
      const $poiItem = doms.eq(index);
      $poiItem.addClass("active").siblings().removeClass("active");
      const top = $poiItem.index() * (that.itemHeight + that.singleMargin);
      that._dom.find(".genre-list-items").scrollTop(top);
      return _getPoiData($poiItem);
    };

    that.onlySetItemActiveById = function (id) {
      const doms = domUtils.find(that._dom, ".poi-list-item");
      if (!doms.length) return;
      const $poiItem = domUtils.find(that._dom, `.poi-list-item[data-poi='${id}']`);
      $poiItem.addClass("active").siblings().removeClass("active");
      const top = $poiItem.index() * (that.itemHeight + that.singleMargin);
      that._dom.find(".genre-list-items").scrollTop(top);
      return _getPoiData($poiItem);
    };

    that.getPoiData = _getPoiData;

    that.setActiveById = function (id) {
      const dom = domUtils.find(that._dom, `.poi-list-item[data-poi='${id}']`);
      that.setActiveItem(dom);
    };

    that.setActiveByIndex = function (index) {
      const doms = domUtils.find(that._dom, ".poi-list-item");
      if (doms.length) that.setActiveItem(doms.eq(index));
    };

    that.scrollToItem = function ($poiItem) {
      const $genre_list_items = that._dom.find(".genre-list-show .genre-list-items");
      const top = $poiItem.index() * (that.itemHeight + that.singleMargin);
      $genre_list_items.scrollTo({ toT: top });
    };

    that.updateTitle = function (text) {
      domUtils.find(that._dom, ".info").text(text);
      that.list_message_tip = text;
    };

    that.updateData = function (data) {
      that.data = data;
      domUtils.templateText(genreListShowHtml, { resultList: data }, that._dom.find(".genre-list"));
      that._dom.find(".genre-list-message .info").text(that.list_message_tip);
      if (data?.length) that.showList();
    };

    that.removeMapPoint = function () {
      if (that.hasMapPoint) {
        that._dom.find(".genre-list-item").eq(0).remove();
        that.hasMapPoint = false;
      }
    };

    that.showLoading = function () {
      that._dom
        .find(".genre-list")
        .html('<p class="loading" style="display:flex;flex-direction: column;align-items: center;text-align: center;justify-content: center;"></p>');
      that._dom.show();
    };

    that.hideLoading = function () {
      domUtils.show(that._dom, ".loading", false);
    };

    that.showErrorText = function (data) {
      domUtils.find(that._dom, ".genre-list").text(data?.errorTip);
    };

    that.show = function () {
      that._dom.show();
      if (that.listener?.viewStateChanged) {
        that.listener.viewStateChanged(that, { state: "hideList", viewHeight: that._height || 260 });
      }
    };

    that.hide = () => that._dom.hide();

    that.setWidgetHeight = function (height) {
      that._height = height;
      that._dom.css("height", `${height}px`);
    };

    that.hideList = function () {
      domUtils.show(domUtils.find(that._dom, ".genre-list-items"), false);
    };

    that.showList = function () {
      that._dom.show();
      domUtils.show(that._dom.find(".genre-list-items"), true);
    };
  };
  daxiapp["DXPoiResultView2"] = DXPoiResultView2;

  /**
   * 周边搜索POI列表视图 - 用于展示周边搜索结果，支持停车场、检票口等多种类型
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父级DOM对象
   */
  const DXNearbyPoiListView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.reslist = null;
    that.state = "";
    that.title = "";
    that.status = false;
    that.isActivePage = false;
    that.viewDataPose = null;
    that.UITemplate = "";
    that.itemHeight = 54;
    that.singleMargin = 5;
    that.data = null;
    that._dom = null;
    that._scroller = null;
    that._height = null;
    that.list_message_tip = "";

    /** 从DOM元素中提取POI数据 */
    const _getPoiData = ($poiItem) => {
      const name = ($poiItem.data("name") || "") + "";
      const address = ($poiItem.data("address") || "") + "";
      return {
        poiId: ($poiItem.data("poi") || "") + "",
        bdid: $poiItem.data("bdid"),
        floorId: ($poiItem.data("floorid") || "") + "",
        lon: $poiItem.data("lon"),
        lat: $poiItem.data("lat"),
        id: ($poiItem.data("poi") || "") + "",
        name,
        address,
      };
    };

    /** 构建列表项基础属性 */
    const _buildItemAttrs = (item) =>
      `data-poi="${item.poiId}" data-bdid="${item.bdid}" data-floorid="${item.floorId}" data-address="${item.address}" data-lon="${item.lon}" data-lat="${item.lat}" data-name="${item.text}"`;

    /** 构建出发类型(type 3/4)的列车行HTML */
    const _buildDepartureTrainRow = (item, isHidden) => `
      ${isHidden ? '<div class="moreLi hide">' : ""}<ul>
        <li class="t1">${item.trainNum || ""}</li>
        <li class="t2">${item.endStation || ""}</li>
        <li class="t3">${item.startTime || ""}</li>
        <li class="t4">${item.railway || ""}</li>
        <li class="t5 status${item.status}">${item.statusText || ""}</li>
      </ul>${isHidden ? "</div>" : ""}`;

    /** 构建到达类型(type 8)的列车行HTML */
    const _buildArrivalTrainRow = (item, isHidden) => `
      ${isHidden ? '<div class="moreLi hide">' : ""}<ul>
        <li class="t1">${item.trainNum || ""}</li>
        <li class="t2">${item.startStation || ""}</li>
        <li class="t3">${item.arriveTime || ""}</li>
        <li class="t4">${item.exit || ""}</li>
        <li class="t5 status${item.status}">${item.statusText || ""}</li>
      </ul>${isHidden ? "</div>" : ""}`;

    /** 构建列车表格HTML */
    const _buildTrainTable = (ticketCheck, isDeparture) => {
      if (!ticketCheck.trainNumberList?.length) return "";

      const headers = isDeparture ? ["车次", "终到", "发时", "车厢", "状态"] : ["车次", "始发站", "到达", "出站口", "状态"];

      const buildRow = isDeparture ? _buildDepartureTrainRow : _buildArrivalTrainRow;

      let html = `<div class="tableHeader">
        ${headers.map((h, i) => `<span class="t${i + 1}">${h}</span>`).join("")}
      </div><div class="tableBody">`;

      ticketCheck.trainNumberList.forEach((item, index) => {
        const isHidden = ticketCheck.showMore && index >= 2;
        html += buildRow(item, isHidden);
      });

      if (ticketCheck.showMore) {
        html += '<div class="more"><img src="../common_imgs/more.png" alt=""></div>';
      }
      return html + "</div>";
    };

    /** 构建周边信息HTML */
    const _buildAroundHtml = (around) => {
      if (!around?.length) return "";
      return `<div class="poiAround">${around
        .map(
          (item) => `
        <div class="poiTitle">
          <i class="${item.icon}"></i>${item.name}
          ${item.desc_text ? `<span class="desc_text">${item.desc_text}</span>` : ""}
        </div>
        <div class="poiDes">${item.list.map((info) => info.num).join(" / ")}</div>`,
        )
        .join("")}</div>`;
    };

    /** 构建停车场类型(type 1)的列表项HTML */
    const _buildParkingItem = (item) => {
      const tc = item.ticketCheck;
      const pm = tc.parkingMap;
      return `<li ${_buildItemAttrs(item)}>
        <div class="poiHeader">
          <span class="poiName">${item.text}（${item.floorCnName}）</span>
          <span class="cardTip2" data-lon="${pm.lon}" data-lat="${pm.lat}" data-floorid="${pm.floorId}" data-zoom="${pm.zoom}">
            车位图 <i class="icon-right-arrow"></i>
          </span>
        </div>
        <div class="poiBody">
          <span class="poiDesc" style="padding-right: 10px">剩余车位：<span style="color:${tc.color}">${tc.freeParkingNum}</span></span>
          <span class="poiDesc" style="padding-right: 10px">总车位：<span>${tc.totalParkingNum}</span></span>
          <div><span class="poiDesc" style="padding-right: 10px">收费标准：<span>${tc.charges}</span></span></div>
          <div class="parkingBtns">
            <span class="findCar"><i class="tkyIcon-xunche"></i>寻车</span>
            <span class="route"><i class="tkyIcon-line2"></i>路线</span>
          </div>
        </div>
      </li>`;
    };

    /** 构建通用类型的列表项HTML */
    const _buildGeneralItem = (item) => {
      const tc = item.ticketCheck;
      let html = `<li ${_buildItemAttrs(item)}>
        <div class="poiHeader">
          <span class="poiName">${item.text}（${item.floorCnName}）</span>
          ${item.myTicket ? '<span class="cardTip">我的车票</span>' : ""}
          ${tc ? '<span class="collapse"><i class="icon-collapse"></i></span>' : ""}
          <span class="route"><i class="tkyIcon-line2"></i>路线</span>
        </div>`;

      if (tc) {
        html += `<div class="poiBody">
          ${tc.description ? `<span class="poiDesc">${tc.description}</span>` : ""}
          ${
            tc.waitPersonNum
              ? `<span class="poiDesc" style="padding-right: 10px">排队人数：<span style="color: ${tc.color};font-weight: bold;padding-left: 3px">${tc.waitPersonNum}</span></span>`
              : ""
          }
          ${
            tc.waitCarNum
              ? `<span class="poiDesc" style="padding-right: 10px">排队车辆：<span style="color: ${tc.color};font-weight: bold;padding-left: 3px">${tc.waitCarNum}</span></span>`
              : ""
          }
          ${
            tc.waitTime
              ? `<div><span class="poiDesc">预计等待时间：<span style="color: ${tc.color};font-weight:bold;padding-left: 3px">${tc.waitTime}分钟</span></span></div>`
              : ""
          }
        </div>`;

        html += '<div class="poiDetailInfo">';
        if (tc.type == 3 || tc.type == 4) {
          html += _buildTrainTable(tc, true);
        } else if (tc.type == 8) {
          html += _buildTrainTable(tc, false);
        }
        html += _buildAroundHtml(tc.around) + "</div>";
      }
      return html + "</li>";
    };

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.changeLanguage = function () {};

    that.injectComponentUI = function (wrapperdom) {
      const defaultWrapper = `<div class="search-list-widget ui-panel" id="slide-poi-list1" style="display:block;max-height:260px;overflow-y: scroll">
        <div class="slide-widget-scroller ui-panel" style="box-sizing:border-box">
          <div id="genre-list" class="genre-list" style="box-sizing:border-box"></div>
        </div>
      </div>`;
      domUtils.append(that.parentObj, wrapperdom || defaultWrapper);
      that._dom = that.parentObj.find(".search-list-widget");
    };

    that.injectComponentEvents = function () {
      // 路线按钮点击
      that._dom.on("click", ".route", function (event) {
        if (domUtils.isFastClick()) return;
        const $poiItem = $(this).parents("li");
        const pintInfo = _getPoiData($poiItem);
        that.listener?.onTakeToThere?.(that, pintInfo);
        event.stopPropagation();
      });

      // 列表项点击
      that._dom.on("click", "li", function () {
        that.setActiveItem($(this));
      });

      // 折叠/展开切换
      that._dom.on("click", ".collapse", function (event) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        $this.removeClass("collapse").addClass("expand");
        $this.find(".icon-collapse").removeClass("icon-collapse").addClass("icon-expand");
        $this.parents("li").find(".poiDetailInfo").show();
        $this.parents("li").find(".poiBody").hide();
        that.listener?.collapse?.(that);
      });

      that._dom.on("click", ".expand", function (event) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        $this.removeClass("expand").addClass("collapse");
        $this.find(".icon-expand").removeClass("icon-expand").addClass("icon-collapse");
        $this.parents("li").find(".poiDetailInfo").hide();
        $this.parents("li").find(".poiBody").show();
        that.listener?.collapse?.(that);
      });

      // 车位图点击
      that._dom.on("click", ".cardTip2", function (event) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        that.listener?.showParkingMap?.(that, {
          lon: $this.attr("data-lon"),
          lat: $this.attr("data-lat"),
          floorId: $this.attr("data-floorid"),
          zoom: $this.attr("data-zoom"),
        });
      });

      // 寻车按钮点击
      that._dom.on("click", ".findCar", function (event) {
        if (domUtils.isFastClick()) return;
        that.listener?.findCar?.();
      });

      // 更多按钮点击
      that._dom.on("click", ".more img", function () {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        const moreLi = $this.parents(".tableBody").find(".moreLi");
        const isHidden = moreLi.hasClass("hide");
        moreLi.toggleClass("hide", !isHidden).toggleClass("show", isHidden);
        $this.css("transform", isHidden ? "rotateZ(180deg)" : "rotateZ(0deg)");
      });
    };

    that.setActiveItem = function ($poiItem) {
      that._scroller?.stopScroll?.();
      const poiInfo = _getPoiData($poiItem);
      that.listener?.onSelectItemAtIndexPath?.(that, poiInfo);
      $poiItem.addClass("on").siblings().removeClass("on");
      that.scrollToItem($poiItem);
    };

    that.onlySetItemActiveByIndex = function (index) {
      const doms = domUtils.find(that._dom, ".poi-list-item");
      if (!doms.length) return;
      const $poiItem = doms.eq(index);
      $poiItem.addClass("active").siblings().removeClass("active");
      const top = $poiItem.index() * (that.itemHeight + that.singleMargin);
      that._dom.find(".genre-list-items").scrollTop(top);
      return _getPoiData($poiItem);
    };

    that.onlySetItemActiveById = function (id) {
      const doms = domUtils.find(that._dom, ".poi-list-item");
      if (!doms.length) return;
      const $poiItem = domUtils.find(that._dom, `.poi-list-item[data-poi='${id}']`);
      $poiItem.addClass("active").siblings().removeClass("active");
      const top = $poiItem.index() * (that.itemHeight + that.singleMargin);
      that._dom.find(".genre-list-items").scrollTop(top);
      return _getPoiData($poiItem);
    };

    that.getPoiData = _getPoiData;

    that.setActiveById = function (id) {
      const dom = domUtils.find(that._dom, `.resultLists li[data-poi='${id}']`);
      that.setActiveItem(dom);
    };

    that.setActiveByIndex = function (index) {
      const doms = domUtils.find(that._dom, "li");
      if (doms.length) that.setActiveItem(doms.eq(index));
    };

    that.scrollToItem = function ($poiItem) {
      $poiItem.addClass("on").siblings().removeClass("on");
      const parentOffsetTop = that._dom.offset().top;
      const parentScrollTop = that._dom.scrollTop();
      const poiItemOffsetTop = $poiItem.offset().top;
      const diff = parentScrollTop - parentOffsetTop + poiItemOffsetTop;
      if (diff != 0) {
        that._dom.scrollTo({ toT: diff });
      }
    };

    that.updateTitle = function (text) {
      domUtils.find(that._dom, ".info").text(text);
      that.list_message_tip = text;
    };

    that.updateData = function (data) {
      that.data = data;
      let html = "";

      if (!data?.length) {
        html = `<div class="empty-state">${_getLang("empty:tip2:search", "没有查到相关结果")}</div>`;
      } else {
        html = '<div class="resultLists"><ul>';
        data.forEach((item) => {
          html += item.ticketCheck?.type == 1 ? _buildParkingItem(item) : _buildGeneralItem(item);
        });
        html += "</ul></div>";
      }

      that._dom.find(".genre-list").html(html);
      that._dom.find(".genre-list-message .info").text(that.list_message_tip);
      if (data?.length) that.showList();
    };

    that.showLoading = function () {
      that._dom
        .find(".genre-list")
        .html(
          '<div class="loading_wraper" style="width:100%;height:100%;display:flex;align-items: center;justify-content: center;"><p class="loading" style="width:60px;height:60px;"></p></div>',
        );
      that._dom.show();
    };

    that.hideLoading = () => domUtils.show(that._dom, ".loading", false);

    that.showErrorText = (data) => domUtils.find(that._dom, ".genre-list").text(data?.errorTip);

    that.show = function () {
      that._dom.show();
      that.listener?.viewStateChanged?.(that, { state: "hideList", viewHeight: that._height || 260 });
    };

    that.hide = () => that._dom.hide();

    that.setWidgetHeight = function (height) {
      that._height = height;
      that._dom.css("height", `${height}px`);
    };

    that.hideList = () => domUtils.show(domUtils.find(that._dom, ".genre-list-items"), false);

    that.showList = function () {
      that._dom.show();
      domUtils.show(that._dom.find(".genre-list-items"), true);
    };
  };
  daxiapp["DXNearbyPoiListView"] = daxiapp["DXPoiResultView3"] = DXNearbyPoiListView;

  /**
   * POI 搜索结果列表组件
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父容器 DOM 对象
   */
  const DXPoiSearchResultListView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.reslist = null;
    that.state = "";
    that.title = "";
    that.status = false;
    that.isActivePage = false;
    that.viewDataPose = null;
    that.UITemplate = "";
    that.itemHeight = 54;
    that.singleMargin = 5;

    let genreListShowHtml;
    /** 初始化 Handlebars 模板 */
    that.initTmp = function () {
      genreListShowHtml = `
        {{#eq resultList.length 0}}
          <div class="empty-state">${window.langData?.["empty:tip2:search"] || "没有查到相关结果"}</div>
        {{/eq}}
        {{#gt resultList.length 0}}
          <div class="resultLists">
            <ul>
        {{#each resultList}}
          {{#eq ticketCheck.type 1}}
            <li data-poi="{{poiId}}" data-bdid="{{bdid}}" data-floorid="{{floorId}}" data-address="{{address}}" data-lon="{{lon}}" data-lat="{{lat}}" data-name="{{text}}">
              <div class="poiHeader">
                <span class="poiName">{{text}}（{{floorCnName}}）</span>
                <span class="cardTip2" data-lon="{{ticketCheck.parkingMap.lon}}" data-lat="{{ticketCheck.parkingMap.lat}}" data-floorid="{{ticketCheck.parkingMap.floorId}}" data-zoom="{{ticketCheck.parkingMap.zoom}}">
                  车位图 {{#if ticketCheck}}<i class="icon-right-arrow"></i>{{/if}}
                </span>
              </div>
              <div class="poiBody">
                <span class="poiDesc" style="padding-right: 10px">
                  剩余车位：<span style="color:{{ticketCheck.color}}">{{ticketCheck.freeParkingNum}}</span>
                </span>
                <span class="poiDesc" style="padding-right: 10px">
                  总车位：<span>{{ticketCheck.totalParkingNum}}</span>
                </span>
                <div>
                  <span class="poiDesc" style="padding-right: 10px">
                    收费标准：<span>{{ticketCheck.charges}}</span>
                  </span>
                </div>
                <div class="parkingBtns">
                  <span class="findCar"><i class="tkyIcon-xunche"></i>寻车</span>
                  <span class="route"><i class="tkyIcon-line2"></i>路线</span>
                </div>
              </div>
            </li>
          {{/eq}}
          {{#nq ticketCheck.type 1}}
            <li data-poi="{{poiId}}" data-bdid="{{bdid}}" data-floorid="{{floorId}}" data-address="{{address}}" data-lon="{{lon}}" data-lat="{{lat}}" data-name="{{text}}">
              <div class="poiHeader">
                <span class="poiName">{{text}}（{{floorCnName}}）</span>
                {{#if myTicket}}<span class="cardTip">我的车票</span>{{/if}}
                {{#if ticketCheck}}<span class="collapse"><i class="icon-collapse"></i></span>{{/if}}
                <span class="route"><i class="tkyIcon-line2"></i>路线</span>
              </div>
              {{#if ticketCheck}}
                <div class="poiBody">
                  {{#if ticketCheck.description}}<span class="poiDesc">{{ticketCheck.description}}</span>{{/if}}
                  {{#if ticketCheck.waitPersonNum}}
                    <span class="poiDesc" style="padding-right: 10px">
                      排队人数 :<span style="color: {{ticketCheck.color}};font-weight: bold;padding-left: 3px">{{ticketCheck.waitPersonNum}}</span>
                    </span>
                  {{/if}}
                  {{#if ticketCheck.waitCarNum}}
                    <span class="poiDesc" style="padding-right: 10px">
                      排队车辆 :<span style="color: {{ticketCheck.color}};font-weight: bold;padding-left: 3px">{{ticketCheck.waitCarNum}}</span>
                    </span>
                  {{/if}}
                  {{#if ticketCheck.waitTime}}
                    <div>
                      <span class="poiDesc">
                        预计等待时间 :<span style="color: {{ticketCheck.color}};font-weight:bold;padding-left: 3px">{{ticketCheck.waitTime}}分钟</span>
                      </span>
                    </div>
                  {{/if}}
                </div>
              {{/if}}
              {{#if ticketCheck}}
                <div class="poiDetailInfo">
                  <div class="tableHeader">
                    <span class="t1">车次</span><span class="t2">终到</span><span class="t3">发时</span><span class="t4">车厢</span><span class="t5">状态</span>
                  </div>
                  <div class="tableBody">
                    <ul>
                      {{#each ticketCheck.trainNumberList}}
                        <li class="t1">{{trainNum}}</li>
                        <li class="t2">{{endStation}}</li>
                        <li class="t3">{{startTime}}</li>
                        <li class="t4">{{railway}}</li>
                        <li class="t5 status{{status}}">{{statusText}}</li>
                      {{/each}}
                    </ul>
                  </div>
                  {{#if ticketCheck.around}}
                    <div class="poiAround">
                      {{#each ticketCheck.around}}
                        <div class="poiTitle"><i class="{{icon}}"></i> {{name}}</div>
                        <div class="poiDes">
                          {{#each list}}{{num}} / {{/each}}
                        </div>
                      {{/each}}
                    </div>
                  {{/if}}
                </div>
              {{/if}}
            </li>
          {{/nq}}
        {{/each}}
            </ul>
          </div>
        {{/gt}}`;
    };
    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.initTmp();
      that.injectComponentEvents();
    };

    that.changeLanguage = function () {
      that.initTmp();
    };

    that.injectComponentUI = function (wrapperdom) {
      const defaultWrapper = `
        <div class="search-list-widget ui-panel" id="slide-poi-list1" style="display:block;max-height:260px;overflow-y: scroll">
          <div class="slide-widget-scroller ui-panel" style="box-sizing:border-box">
            <div id="genre-list" class="genre-list" style="box-sizing:border-box"></div>
          </div>
        </div>`;
      domUtils.append(that.parentObj, wrapperdom || defaultWrapper);
      that._dom = that.parentObj.find(".search-list-widget");
    };
    that.injectComponentEvents = function () {
      // 公交线路/车站详情事件
      const showBusDetail = function (event, $target) {
        const $parent = $target.parents("li.bus");
        const bdid = $target.attr("data-bdid") || $parent.attr("data-bdid");
        const id = $target.attr("data-id") || $parent.attr("data-id");
        const info = {
          bdid: bdid,
          id: id,
          lon: $parent.attr("data-lon"),
          lat: $parent.attr("data-lat"),
          floorId: $parent.attr("data-floorId"),
        };
        that.listener?.showDetail2?.(that, info);
      };

      that._dom.on("click", "li.bus .lineNum", function (e) {
        showBusDetail(e, $(this));
      });
      that._dom.on("click", "li.bus .busInfo", function (e) {
        showBusDetail(e, $(this));
      });
      that._dom.on("click", "li.bus .busName", function (e) {
        showBusDetail(e, $(this));
      });

      // 地铁详情
      that._dom.on("click", ".metroName", function () {
        const $li = $(this).parents("li");
        const info = {
          bdid: $li.attr("data-bdid"),
          id: $li.attr("data-id"),
          lon: $li.attr("data-lon"),
          lat: $li.attr("data-lat"),
          floorId: $li.attr("data-floorId"),
        };
        that.listener?.showDetail?.(that, info);
      });

      // POI 内容区域详情
      that._dom.on("click", ".poiBody", function () {
        const $li = $(this).parents("li");
        if ($li.hasClass("bus")) return;
        const info = {
          bdid: $li.attr("data-bdid"),
          id: $li.attr("data-id"),
          lon: $li.attr("data-lon"),
          lat: $li.attr("data-lat"),
          floorId: $li.attr("data-floorId"),
        };
        that.listener?.showDetail?.(that, info);
      });

      // 路线规划
      that._dom.on("click", ".route", function (event) {
        let $poiItem = $(this).parents("li");
        let lon = $poiItem.data("lon");
        let lat = $poiItem.data("lat");
        const bdid = $poiItem.data("bdid") || "";
        const floorId = $poiItem.data("floorid") || "";

        if ($(this).hasClass("bus_Route")) {
          $poiItem = $(this).parents(".busBox");
          const location = $poiItem.data("location") || "";
          [lon, lat] = location.split(",");
        }

        const name = ($poiItem.data("name") || "") + "";
        const pintInfo = { lon, lat, name, bdid, floorId };
        that.listener?.onTakeToThere?.(that, pintInfo);
        event.stopPropagation();
      });

      // POI 点击选中
      that._dom.on("click", "li.poi", function () {
        that.setActiveItem($(this));
      });

      // 折叠/展开详情
      const toggleCollapse = function ($btn, isExpand) {
        if (domUtils.isFastClick()) return;
        const $li = $btn.parents("li");
        if (isExpand) {
          $btn.removeClass("expand").addClass("collapse");
          $btn.find(".icon-expand").removeClass("icon-expand").addClass("icon-collapse");
          $li.find(".poiDetailInfo").hide();
          $li.find(".poiBody").show();
        } else {
          $btn.removeClass("collapse").addClass("expand");
          $btn.find(".icon-collapse").removeClass("icon-collapse").addClass("icon-expand");
          $li.find(".poiDetailInfo").show();
          $li.find(".poiBody").hide();
        }
        that.listener?.collapse?.(that);
      };

      that._dom.on("click", ".collapse", function () {
        toggleCollapse($(this), false);
      });
      that._dom.on("click", ".expand", function () {
        toggleCollapse($(this), true);
      });

      // 车位图
      that._dom.on("click", ".cardTip2", function () {
        if (domUtils.isFastClick()) return;
        const info = {
          lon: $(this).attr("data-lon"),
          lat: $(this).attr("data-lat"),
          floorId: $(this).attr("data-floorid"),
          zoom: $(this).attr("data-zoom"),
        };
        that.listener?.showParkingMap?.(that, info);
      });

      // 寻车
      that._dom.on("click", ".findCar", function () {
        if (domUtils.isFastClick()) return;
        that.listener?.findCar?.();
      });

      // 公交列表更多展开
      that._dom.on("click", ".more img", function () {
        if (domUtils.isFastClick()) return;
        const $moreLi = $(this).parents(".poiBody").find(".busLi");
        const isHidden = $moreLi.hasClass("hide");
        $moreLi.toggleClass("hide", !isHidden).toggleClass("show", isHidden);
        $(this).css({ transform: isHidden ? "rotateZ(180deg)" : "rotateZ(0deg)" });
      });
    };
    that.setActiveItem = function ($poiItem) {
      that._scroller?.stopScroll?.();

      const poiInfo = that.getPoiData($poiItem);
      that.listener?.onSelectItemAtIndexPath?.(that, poiInfo);

      $poiItem.addClass("on").siblings().removeClass("on");
      that.scrollToItem($poiItem);
    };

    that.onlySetItemActiveByIndex = function (index) {
      const doms = domUtils.find(that._dom, ".poi-list-item");
      if (doms.length > 0) {
        const $poiItem = doms.eq(index);
        $poiItem.addClass("active").siblings().removeClass("active");
        const _index = $poiItem.index();
        const top = _index * (that.itemHeight + that.singleMargin);
        that._dom.find(".genre-list-items").scrollTop(top);
        return that.getPoiData($poiItem);
      }
    };

    that.onlySetItemActiveById = function (id) {
      const doms = domUtils.find(that._dom, ".poi-list-item");
      if (doms.length > 0) {
        const $poiItem = domUtils.find(that._dom, `.poi-list-item[data-poi='${id}']`);
        $poiItem.addClass("active").siblings().removeClass("active");
        const _index = $poiItem.index();
        const top = _index * (that.itemHeight + that.singleMargin);
        that._dom.find(".genre-list-items").scrollTop(top);
        return that.getPoiData($poiItem);
      }
    };

    that.getPoiData = function ($poiItem) {
      const poiId = ($poiItem.data("poi") || "") + "";
      const name = ($poiItem.data("name") || "") + "";
      const address = ($poiItem.data("address") || "") + "";
      return {
        poiId: poiId,
        bdid: $poiItem.data("bdid"),
        floorId: ($poiItem.data("floorid") || "") + "",
        lon: $poiItem.data("lon"),
        lat: $poiItem.data("lat"),
        id: poiId,
        name: name,
        address: address,
      };
    };

    that.setActiveById = function (id) {
      const findAndActive = (selector) => {
        const dom = domUtils.find(that._dom, selector);
        if (dom.length) {
          that._scroller?.stopScroll?.();
          dom.addClass("on").siblings().removeClass("on");
          that.scrollToItem(dom);
          return true;
        }
        return false;
      };
      findAndActive(`.resultLists li[data-poi='${id}']`) || findAndActive(`.resultLists li[data-id='${id}']`);
    };

    that.setActiveByIndex = function (index) {
      const doms = domUtils.find(that._dom, "li");
      if (doms.length > index) {
        that.setActiveItem(doms.eq(index));
      }
    };

    that.scrollToItem = function ($poiItem) {
      $poiItem.addClass("on").siblings().removeClass("on");
      const parentOffsetTop = that._dom.offset().top;
      const parentSrollTop = that._dom.scrollTop();
      const poiItemOffsetTop = $poiItem.offset().top;
      const diff = parentSrollTop - parentOffsetTop + poiItemOffsetTop;
      if (diff != 0) {
        that._dom.scrollTo({ toT: diff });
      }
    };

    that.updateTitle = function (text) {
      domUtils.find(that._dom, ".info").text(text);
      that.list_message_tip = text;
    };
    that.updateData = function (data) {
      that.data = data;
      let str = "";
      if (data.length == 0) {
        str = `<div class="empty-state">${window.langData?.["empty:tip2:search"] || "没有查到相关结果"}</div>`;
      } else {
        str = '<div class="resultLists"><ul>';
        data.forEach((item) => {
          const { ticketCheck, types, busline_list, name, id, lon, lat, floorId, bdid, text, floorCnName, myTicket, address, poiId, buslines } = item;

          if (ticketCheck && ticketCheck.type == 1) {
            str += `
              <li class="poi" data-poi="${poiId}" data-bdid="${bdid}" data-floorid="${floorId}" data-address="${address}" data-lon="${lon}" data-lat="${lat}" data-name="${text}">
                <div class="poiHeader">
                  <span class="poiName">${text}（${floorCnName}）</span>
                  <span class="cardTip2" data-lon="${ticketCheck.parkingMap.lon}" data-lat="${ticketCheck.parkingMap.lat}" data-floorid="${ticketCheck.parkingMap.floorId}" data-zoom="${ticketCheck.parkingMap.zoom}">
                    车位图 ${ticketCheck ? '<i class="icon-right-arrow"></i>' : ""}
                  </span>
                </div>
                <div class="poiBody">
                  <span class="poiDesc" style="padding-right: 10px">剩余车位：<span style="color:${ticketCheck.color}">${ticketCheck.freeParkingNum}</span></span>
                  <span class="poiDesc" style="padding-right: 10px">总车位：<span>${ticketCheck.totalParkingNum}</span></span>
                  <div><span class="poiDesc" style="padding-right: 10px">收费标准：<span>${ticketCheck.charges}</span></span></div>
                  <div class="parkingBtns">
                    <span class="findCar"><i class="tkyIcon-xunche"></i>寻车</span>
                    <span class="route"><i class="tkyIcon-line2"></i>路线</span>
                  </div>
                </div>
              </li>`;
          } else if (types == "metro") {
            let metroInfoStr = "";
            busline_list?.forEach((line) => {
              metroInfoStr += `
                <div class="metorInfo">
                  <div class="metorInfoLeft">
                    <div class="station">开往<span class="stationName">${line.front_name}</span></div>
                    <div class="description">首${line.firstTime} 末${line.endTime}</div>
                  </div>
                  <div class="metorInfoRight"><i class="icon-clock2"></i>约${line.interval}分钟一班车</div>
                </div>`;
            });
            str += `
              <li class="metro" data-name="${name}" data-id="${id}" data-lon="${lon}" data-lat="${lat}" data-floorid="${floorId}" data-bdid="${bdid}">
                <div class="poiHeader">
                  <span class="metroName" style="color:#fff;background:#${item.color}">${name}</span>
                  <span class="route"><i class="tkyIcon-line2"></i>路线</span>
                </div>
                <div class="poiBody">${metroInfoStr}</div>
              </li>`;
          } else if (types == "bus") {
            let buslinesStr = "";
            buslines?.forEach((bus, index) => {
              const busInfoHtml = `
                <div class="busBox" data-id="${bus.id}" data-location="${bus.location}" data-name="${bus.name}">
                  <div class="pd10" data-id="${bus.id}">
                    <span class="lineNum">${bus.name}</span>
                    <span class="route bus_Route"><i class="tkyIcon-line2"></i>路线</span>
                  </div>
                  <div class="busInfo" data-id="${bus.id}">
                    <div class="metorInfoLeft">
                      <div class="station">开往<span class="stationName">${bus.end_stop}</span><i class="icon-right-arrow"></i></div>
                      <div class="description">首05:42 末00:00</div>
                    </div>
                    <div class="metorInfoRight"><i class="icon-clock2"></i>预计09:50 - 10:01发车</div>
                  </div>
                  <div class="busInfo" data-id="${bus.id}">
                    <div class="busInfoLeft"><div class="station">开往<span class="stationName">${bus.start_stop}</span><i class="icon-right-arrow"></i></div></div>
                    <div class="busInfoRight">
                      <div class="color_blue tr">2分钟·1站</div>
                      <div class="f12">下一辆超过半小时 超过13站</div>
                    </div>
                  </div>
                </div>`;
              buslinesStr += index >= 2 ? `<div class='busLi hide'>${busInfoHtml}</div>` : busInfoHtml;
            });
            str += `
              <li class="bus" data-name="${name}" data-id="${id}" data-lon="${lon}" data-lat="${lat}" data-floorid="${floorId}" data-bdid="${bdid}">
                <div class="poiHeader">
                  <span class="busName">${name}</span>
                  <span class="collapse"><i class="icon-collapse"></i></span>
                </div>
                <div class="poiBody">
                  ${buslinesStr}
                  ${buslines.length > 2 ? '<div class="more"><img src="../common_imgs/more.png" alt=""></div>' : ""}
                </div>
              </li>`;
          } else {
            let ticketInfoStr = "";
            if (ticketCheck) {
              let trainLines = "";
              ticketCheck.trainNumberList?.forEach((train) => {
                trainLines += `
                  <li class="t1">${train.trainNum || ""}</li><li class="t2">${train.endStation || ""}</li>
                  <li class="t3">${train.startTime || ""}</li><li class="t4">${train.railway || ""}</li>
                  <li class="t5 status${train.statusText}">${train.statusText || ""}</li>`;
              });

              let aroundInfo = "";
              ticketCheck.around?.forEach((around) => {
                const listStr = around.list?.map((info) => info.num).join(" / ") || "";
                aroundInfo += `<div class="poiTitle"><i class="${around.icon}"></i>${around.name}</div><div class="poiDes">${listStr}</div>`;
              });

              ticketInfoStr = `
                <div class="poiBody">
                  ${ticketCheck.description ? `<span class="poiDesc">${ticketCheck.description}</span>` : ""}
                  ${ticketCheck.waitPersonNum ? `<span class="poiDesc" style="padding-right: 10px">排队人数 :<span style="color: ${ticketCheck.color};font-weight: bold;padding-left: 3px">${ticketCheck.waitPersonNum}</span></span>` : ""}
                  ${ticketCheck.waitCarNum ? `<span class="poiDesc" style="padding-right: 10px">排队车辆 :<span style="color: ${ticketCheck.color};font-weight: bold;padding-left: 3px">${ticketCheck.waitCarNum}</span></span>` : ""}
                  ${ticketCheck.waitTime ? `<div><span class="poiDesc">预计等待时间 :<span style="color: ${ticketCheck.color};font-weight:bold;padding-left: 3px">${ticketCheck.waitTime}分钟</span></span></div>` : ""}
                </div>
                <div class="poiDetailInfo">
                  ${ticketCheck.trainNumberList ? `<div class="tableHeader"><span class="t1">车次</span><span class="t2">终到</span><span class="t3">发时</span><span class="t4">车厢</span><span class="t5">状态</span></div><div class="tableBody"><ul>${trainLines}</ul></div>` : ""}
                  ${ticketCheck.around ? `<div class="poiAround">${aroundInfo}</div>` : ""}
                </div>`;
            }

            str += `
              <li class="poi" data-poi="${poiId}" data-bdid="${bdid}" data-floorid="${floorId}" data-address="${address}" data-lon="${lon}" data-lat="${lat}" data-name="${text}">
                <div class="poiHeader">
                  <span class="poiName">${text}（${floorCnName}）</span>
                  ${myTicket ? '<span class="cardTip">我的车票</span>' : ""}
                  ${ticketCheck ? '<span class="collapse"><i class="icon-collapse"></i></span>' : ""}
                  <span class="route"><i class="tkyIcon-line2"></i>路线</span>
                </div>
                ${ticketInfoStr}
              </li>`;
          }
        });
        str += "</ul></div>";
      }
      that._dom.find(".genre-list").html(str);
      that._dom.find(".genre-list-message .info").text(that.list_message_tip);
      if (data?.length) that.showList();
    };

    that.showLoading = function () {
      that._dom.find(".genre-list").html(`
        <div class="loading_wraper" style="width:100%;height:100%;display:flex;align-items: center;justify-content: center;">
          <p class="loading" style="width:60px;height:60px;"></p>
        </div>`);
      that._dom.show();
    };

    that.hideLoading = function () {
      domUtils.show(that._dom, ".loading", false);
    };

    that.showErrorText = function (data) {
      domUtils.find(that._dom, ".genre-list").text(data.errorTip);
    };

    that.show = function () {
      that._dom.show();
      that.listener?.viewStateChanged?.(that, {
        state: "hideList",
        viewHeight: that._height || 260,
      });
    };

    that.hide = function () {
      that._dom.hide();
    };

    that.setWidgetHeight = function (height) {
      that._height = height;
      that._dom.css("height", `${height}px`);
    };

    that.hideList = function () {
      const listDom = domUtils.find(that._dom, ".genre-list-items");
      domUtils.show(listDom, false);
    };

    that.showList = function () {
      that._dom.show();
      const listDom = that._dom.find(".genre-list-items");
      domUtils.show(listDom, true);
    };
  };
  daxiapp["DXPoiSearchResultListView"] = daxiapp["DXPoiResultView4"] = DXPoiSearchResultListView; // "DXPoiResultView4"为向后兼容

  /**
   * 地铁搜索结果列表组件
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父容器 DOM 对象
   */
  const DXMetroSearchResultListView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.reslist = null;
    that.state = "";
    that.title = "";
    that.status = false;
    that.isActivePage = false;
    that.viewDataPose = null;
    that.UITemplate = "";
    that.itemHeight = 54;
    that.singleMargin = 5;

    let genreListShowHtml;

    /** 初始化 Handlebars 模板 */
    that.initTmp = function () {
      genreListShowHtml = `
        {{#eq resultList.length 0}}
          <div class="empty-state">${window.langData?.["empty:tip2:search"] || "没有查到相关结果"}</div>
        {{/eq}}
        {{#gt resultList.length 0}}
          <div class="resultLists">
            {{#each resultList}}
              <ul>
                <li class="metro" data-name="{{name}}" data-id="{{id}}" data-lon="{{lon}}" data-lat="{{lat}}" data-floorid="{{floorId}}" data-bdid="{{bdid}}">
                  <div class="poiHeader">
                    <span class="metroName">{{name}}</span>
                    <span class="price">票价：{{price}}元</span>
                  </div>
                  <div class="poiBody">
                    {{#each busline_list}}
                      <div class="metorInfo">
                        <div class="metorInfoLeft">
                          <div class="station">开往<span class="stationName">{{front_name}}</span></div>
                          <div class="description">首{{firstTime}} 末{{endTime}}</div>
                        </div>
                        <div class="metorInfoRight"><i class="icon-clock2"></i>约{{interval}}分钟一班车</div>
                      </div>
                    {{/each}}
                  </div>
                </li>
              </ul>
            {{/each}}
            <div class="btn-line" data-poi="">路线</div>
          </div>
        {{/gt}}`;
    };

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.initTmp();
      that.injectComponentEvents();
    };

    that.changeLanguage = function () {
      that.initTmp();
    };

    that.injectComponentUI = function (wrapperdom) {
      const defaultWrapper = `
        <div class="search-list-widget ui-panel" id="slide-poi-list2" style="display:block;height:260px;overflow-y: scroll">
          <div class="slide-widget-scroller ui-panel" style="height:100%;box-sizing:border-box">
            <div id="genre-list" class="genre-list" style="height:100%;box-sizing:border-box"></div>
          </div>
        </div>`;
      domUtils.append(that.parentObj, wrapperdom || defaultWrapper);
      that._dom = that.parentObj.find(".search-list-widget");
    };

    that.injectComponentEvents = function () {
      // 地铁名称/内容区域点击
      const showDetailById = function ($elem) {
        const id = $elem.parents("li").attr("data-id");
        that.listener?.showDetail?.(that, id);
      };

      that._dom.on("click", ".metroName", function () {
        showDetailById($(this));
      });
      that._dom.on("click", ".metro .poiBody", function () {
        showDetailById($(this));
      });

      // 路线规划
      that._dom.on("click", ".metro .route", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (domUtils.isFastClick()) return;

        const $poiItem = $(this).parents("li.metro");
        const pintInfo = {
          poiId: ($poiItem.data("poi") || "") + "",
          bdid: $poiItem.data("bdid"),
          floorId: ($poiItem.data("floorid") || "") + "",
          lon: $poiItem.data("lon"),
          lat: $poiItem.data("lat"),
          name: ($poiItem.data("name") || "") + "",
          address: ($poiItem.data("address") || "") + "",
        };
        that.listener?.onTakeToThere?.(that, pintInfo);
      });
    };

    that.getPoiData = function ($poiItem) {
      const poiId = ($poiItem.data("poi") || "") + "";
      const name = ($poiItem.data("name") || "") + "";
      const address = ($poiItem.data("address") || "") + "";
      return {
        poiId: poiId,
        id: poiId,
        bdid: $poiItem.data("bdid"),
        floorId: ($poiItem.data("floorid") || "") + "",
        lon: $poiItem.data("lon"),
        lat: $poiItem.data("lat"),
        name: name,
        address: address,
      };
    };

    that.updateData = function (data) {
      that.data = data;
      let str = '<div class="resultLists">';
      data.forEach((list) => {
        let busLineInfoStr = "";
        list.busline_list?.forEach((item) => {
          busLineInfoStr += `
            <div class="metorInfo">
              <div class="metorInfoLeft">
                <div class="station">开往<span class="stationName">${item.front_name}</span></div>
                <div class="description">首${item.firstTime} 末${item.endTime}</div>
              </div>
              <div class="metorInfoRight"><i class="icon-clock2"></i>约${item.interval}分钟一班车</div>
            </div>`;
        });
        str += `
          <ul>
            <li class="metro" data-name="${list.name}" data-id="${list.id}" data-lon="${list.lon}" data-lat="${list.lat}" data-floorid="${list.floorId}" data-bdid="${list.bdid}">
              <div class="poiHeader">
                <span class="metroName" style="background:#${list.color}">${list.name}</span>
                <span class="route"><i class="tkyIcon-line2"></i>路线</span>
              </div>
              <div class="poiBody">${busLineInfoStr}</div>
            </li>
          </ul>`;
      });
      str += "</div>";
      that._dom.find(".genre-list").html(str);
      that._dom.find(".genre-list-message .info").text(that.list_message_tip);
      if (data?.length) that.showList();
    };

    that.showLoading = function () {
      that._dom.find(".genre-list").html(`
        <div class="loading_wraper" style="width:100%;height:100%;display:flex;align-items: center;justify-content: center;">
          <p class="loading" style="width:60px;height:60px;"></p>
        </div>`);
      that._dom.show();
    };

    that.hideLoading = function () {
      domUtils.show(that._dom, ".loading", false);
    };

    that.showErrorText = function (data) {
      domUtils.find(that._dom, ".genre-list").text(data.errorTip);
    };

    that.show = function () {
      that._dom.show();
      that.listener?.viewStateChanged?.(that, {
        state: "hideList",
        viewHeight: that._height || 260,
      });
    };

    that.hide = function () {
      that._dom.hide();
    };

    that.setWidgetHeight = function (height) {
      that._height = height;
      that._dom.css("height", `${height}px`);
    };

    that.hideList = function () {
      const listDom = domUtils.find(that._dom, ".genre-list-items");
      domUtils.show(listDom, false);
    };

    that.showList = function () {
      that._dom.show();
      const listDom = that._dom.find(".genre-list-items");
      domUtils.show(listDom, true);
    };
  };
  daxiapp["DXMetroSearchResultListView"] = daxiapp["DXMetroResultView"] = DXMetroSearchResultListView;

  /**
   * 地铁线路详情组件
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父容器 DOM 对象
   */
  const DXMetroLineDetailView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.reslist = null;
    that.state = "";
    that.title = "";
    that.status = false;
    that.isActivePage = false;
    that.viewDataPose = null;
    that.UITemplate = "";
    that.itemHeight = 54;
    that.singleMargin = 5;

    let genreListShowHtml;

    /** 初始化 Handlebars 模板 */
    that.initTmp = function () {
      genreListShowHtml = `
        <div class="metroDetail">
          <div class="metroHeader">
            <div class="metroText">{{result.key_name}}</div>
            <div class="direction">
              <span>{{result.front_name}}</span><i class="icon-qiehuan"></i><span>{{result.terminal_name}}</span>
            </div>
            <div class="description">
              <span class="borderRight">全程: {{result.length}}公里</span><span>票价: {{result.basic_price}}-{{result.total_price}}元</span>
            </div>
            <div class="close"><i class="icon-close"></i></div>
            <div class="change"><i class="icon-qiehuan"></i>换向</div>
          </div>
          <div class="metroBody">
            <div><span class="stationName">石家庄站</span><span class="color3">运营情况：</span></div>
            <ul>
              <li>
                <div>
                  <i class="icon-connection blue"></i>
                  <span class="pr5">开往</span>
                  <span class="stationName">{{result.front_name}}</span>
                </div>
                <div>
                  <div class="blue f13">预计17:56进站</div>
                  <div class="color6 f13">首{{result.firstTime}}   末{{result.endTime}}</div>
                </div>
              </li>
              <li>
                <div>
                  <i class="icon-connection blue"></i>
                  <span class="pr5">开往</span>
                  <span class="stationName">{{result.terminal_name}}</span>
                </div>
                <div>
                  <div class="blue f13">预计17:56进站</div>
                  <div class="color6 f13">首05:42   末00:00</div>
                </div>
              </li>
            </ul>
          </div>
          <div class="stationList">
            <ul class="stationListUl" style="width: {{result.width}}px">
              {{#each result.stations}}
                <li class="">
                  <div class="stationItem">
                    <i class="icon-right-arrow"></i>
                    <span class="stname">{{name}}</span>
                  </div>
                </li>
              {{/each}}
            </ul>
          </div>
        </div>`;
    };

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.initTmp();
      that.injectComponentEvents();
    };

    that.changeLanguage = function () {
      that.initTmp();
    };

    that.injectComponentUI = function (wrapperdom) {
      const defaultWrapper = `
        <div class="search-list-widget ui-panel" id="slide-poi-list2" style="display:block;height:480px;">
          <div class="slide-widget-scroller ui-panel" style="overflow-y: scroll;height:100%;box-sizing:border-box">
            <div id="genre-list" class="genre-list" style="height:100%;box-sizing:border-box"></div>
          </div>
        </div>`;
      domUtils.append(that.parentObj, wrapperdom || defaultWrapper);
      that._dom = that.parentObj.find(".search-list-widget");
    };

    that.injectComponentEvents = function () {
      that._dom.on("click", ".close", function () {
        if (domUtils.isFastClick()) return;
        that.listener?.onClose?.();
      });
    };

    that.getPoiData = function ($poiItem) {
      const poiId = ($poiItem.data("poi") || "") + "";
      const name = ($poiItem.data("name") || "") + "";
      const address = ($poiItem.data("address") || "") + "";
      return {
        poiId: poiId,
        id: poiId,
        bdid: $poiItem.data("bdid"),
        floorId: ($poiItem.data("floorid") || "") + "",
        lon: $poiItem.data("lon"),
        lat: $poiItem.data("lat"),
        name: name,
        address: address,
      };
    };

    that.updateData = function (data) {
      const result = data.busline_list?.[0];
      if (result) {
        result.width = (result.stations?.length || 0) * 40 + 12;
      }
      that.data = data;
      domUtils.templateText(genreListShowHtml, { result }, that._dom.find(".genre-list"));
      that._dom.find(".genre-list-message .info").text(that.list_message_tip);
      if (data?.length) that.showList();
    };

    that.showLoading = function () {
      that._dom.find(".genre-list").html(`
        <div class="loading_wraper" style="width:100%;display:flex;align-items: center;justify-content: center;">
          <p class="loading" style="width:60px;height:60px;"></p>
        </div>`);
      that._dom.show();
    };

    that.hideLoading = function () {
      domUtils.show(that._dom, ".loading", false);
    };

    that.show = function () {
      that._dom.show();
      that.listener?.viewStateChanged?.(that, {
        state: "hideList",
        viewHeight: that._height || 260,
      });
    };

    that.hide = function () {
      that._dom.hide();
    };

    that.setWidgetHeight = function (height) {
      that._height = height;
      that._dom.css("height", `${height}px`);
    };

    that.hideList = function () {
      const listDom = domUtils.find(that._dom, ".genre-list-items");
      domUtils.show(listDom, false);
    };

    that.showList = function () {
      that._dom.show();
      const listDom = that._dom.find(".genre-list-items");
      domUtils.show(listDom, true);
    };
  };
  daxiapp["DXMetroLineDetailView"] = daxiapp["DXMetroDetailView"] = DXMetroLineDetailView;

  /**
   * 公交站点搜索结果列表组件
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父容器 DOM 对象
   */
  const DXBusSearchResultListView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.reslist = null;
    that.state = "";
    that.title = "";
    that.status = false;
    that.isActivePage = false;
    that.viewDataPose = null;
    that.UITemplate = "";
    that.itemHeight = 54;
    that.singleMargin = 5;

    let genreListShowHtml;

    /** 初始化 Handlebars 模板 */
    that.initTmp = function () {
      genreListShowHtml = `
        {{#eq resultList.length 0}}
          <div class="empty-state">${window.langData?.["empty:tip2:search"] || "没有查到相关结果"}</div>
        {{/eq}}
        {{#gt resultList.length 0}}{{/gt}}`;
    };

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.initTmp();
      that.injectComponentEvents();
    };

    that.changeLanguage = function () {
      that.initTmp();
    };

    that.injectComponentUI = function (wrapperdom) {
      const defaultWrapper = `
        <div class="search-list-widget ui-panel" id="slide-poi-list4" style="display:block;height:260px;">
          <div class="slide-widget-scroller ui-panel" style="overflow-y: scroll;height:100%;box-sizing:border-box">
            <div id="genre-list" class="genre-list" style="height:100%;box-sizing:border-box"></div>
          </div>
        </div>`;
      domUtils.append(that.parentObj, wrapperdom || defaultWrapper);
      that._dom = that.parentObj.find(".search-list-widget");
    };

    that.injectComponentEvents = function () {
      // 折叠/展开切换
      that._dom.on("click", ".collapse", function () {
        if (domUtils.isFastClick()) return;
        $(this).removeClass("collapse").addClass("expand");
        $(this).find(".icon-collapse").removeClass("icon-collapse").addClass("icon-expand");
        $(this).parents("li").find(".poiBody").hide();
      });

      that._dom.on("click", ".expand", function () {
        if (domUtils.isFastClick()) return;
        $(this).removeClass("expand").addClass("collapse");
        $(this).find(".icon-expand").removeClass("icon-expand").addClass("icon-collapse");
        $(this).parents("li").find(".poiBody").show();
      });

      // 线路详情点击
      that._dom.on("click", ".bus .lineNum", function () {
        const id = $(this).parent().attr("data-id");
        that.listener?.showDetail?.(that, id);
      });

      that._dom.on("click", ".busInfo", function () {
        const id = $(this).attr("data-id");
        that.listener?.showDetail?.(that, id);
      });

      // 路线规划
      that._dom.on("click", ".route", function (event) {
        event.stopPropagation();
        if (domUtils.isFastClick()) return;

        const $poiItem = $(this).parents(".busBox");
        const location = $poiItem.data("location");
        let lon = $poiItem.data("lon");
        let lat = $poiItem.data("lat");

        if (location) {
          const coords = location.split(",");
          lon = coords[0];
          lat = coords[1];
        }

        const pintInfo = {
          lon,
          lat,
          name: ($poiItem.data("name") || "") + "",
        };
        that.listener?.onTakeToThere?.(that, pintInfo);
      });

      // 更多线路展开/收起
      that._dom.on("click", ".more img", function () {
        if (domUtils.isFastClick()) return;

        const moreLi = $(this).parents(".poiBody").find(".busLi");
        const isHidden = moreLi.hasClass("hide");
        moreLi.toggleClass("hide", !isHidden).toggleClass("show", isHidden);
        $(this).css("transform", isHidden ? "rotateZ(180deg)" : "rotateZ(0deg)");
      });
    };

    that.getPoiData = function ($poiItem) {
      const poiId = ($poiItem.data("poi") || "") + "";
      const name = ($poiItem.data("name") || "") + "";
      const address = ($poiItem.data("address") || "") + "";
      return {
        poiId,
        id: poiId,
        bdid: $poiItem.data("bdid"),
        floorId: ($poiItem.data("floorid") || "") + "",
        lon: $poiItem.data("lon"),
        lat: $poiItem.data("lat"),
        name,
        address,
      };
    };

    /** 构建单条公交线路信息 HTML */
    const buildBusLineHtml = (item) => `
      <div class="busBox" data-id="${item.id}" data-location="${item.location}" data-name="${item.name}">
        <div class="pd10" data-id="${item.id}">
          <span class="lineNum">${item.name}</span>
          <span class="route"><i class="tkyIcon-line2"></i>路线</span>
        </div>
        <div class="busInfo" data-id="${item.id}">
          <div class="metorInfoLeft">
            <div class="station">开往<span class="stationName">${item.end_stop}</span><i class="icon-right-arrow"></i></div>
            <div class="description">首05:42 末00:00</div>
          </div>
          <div class="metorInfoRight"><i class="icon-clock2"></i>预计09:50 - 10:01发车</div>
        </div>
        <div class="busInfo" data-id="${item.id}">
          <div class="busInfoLeft">
            <div class="station">开往<span class="stationName">${item.start_stop}</span><i class="icon-right-arrow"></i></div>
          </div>
          <div class="busInfoRight">
            <div class="color_blue tr">2分钟·1站</div>
            <div class="f12">下一辆超过半小时 超过13站</div>
          </div>
        </div>
      </div>`;

    that.updateData = function (data) {
      that.data = data;
      let str = '<div class="resultLists bus">';

      data.busstops?.forEach((list) => {
        str += `
          <li class="bus bus1">
            <div class="poiHeader">
              <span class="busName">${list.name}</span>
              <span class="collapse"><i class="icon-collapse"></i></span>
            </div>
            <div class="poiBody">`;

        list.buslines?.forEach((item, index) => {
          const lineHtml = buildBusLineHtml(item);
          str += index >= 2 ? `<div class="busLi hide">${lineHtml}</div>` : lineHtml;
        });

        if (list.buslines?.length > 2) {
          str += '<div class="more"><img src="../common_imgs/more.png" alt=""></div>';
        }
        str += "</div></li>";
      });

      str += "</div>";
      that._dom.find(".genre-list").html(str);
      that._dom.find(".genre-list-message .info").text(that.list_message_tip);
      if (data?.length) that.showList();
    };

    that.showLoading = function () {
      that._dom.find(".genre-list").html(`
        <div class="loading_wraper" style="width:100%;height:100%;display:flex;align-items: center;justify-content: center;">
          <p class="loading" style="width:60px;height:60px;"></p>
        </div>`);
      that._dom.show();
    };

    that.hideLoading = function () {
      domUtils.show(that._dom, ".loading", false);
    };

    that.showErrorText = function (data) {
      domUtils.find(that._dom, ".genre-list").text(data.errorTip);
    };

    that.show = function () {
      that._dom.show();
      that.listener?.viewStateChanged?.(that, {
        state: "hideList",
        viewHeight: that._height || 260,
      });
    };

    that.hide = function () {
      that._dom.hide();
    };

    that.setWidgetHeight = function (height) {
      that._height = height;
      that._dom.css("height", `${height}px`);
    };

    that.hideList = function () {
      const listDom = domUtils.find(that._dom, ".genre-list-items");
      domUtils.show(listDom, false);
    };

    that.showList = function () {
      that._dom.show();
      const listDom = that._dom.find(".genre-list-items");
      domUtils.show(listDom, true);
    };
  };
  daxiapp["DXBusSearchResultListView"] = daxiapp["DXBusResultView"] = DXBusSearchResultListView;

  /**
   * 公交线路详情组件
   * @param {Object} app - 应用实例
   * @param {Object} parentObject - 父容器 DOM 对象
   */
  const DXBusLineDetailView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.reslist = null;
    that.state = "";
    that.title = "";
    that.status = false;
    that.isActivePage = false;
    that.viewDataPose = null;
    that.UITemplate = "";
    that.itemHeight = 54;
    that.singleMargin = 5;

    let genreListShowHtml;

    /** 初始化 Handlebars 模板 */
    that.initTmp = function () {
      genreListShowHtml = `
        <div class="metroDetail">
          <div class="metroHeader">
            <div class="metroText">{{result.name}}</div>
            <div class="direction">
              <span>{{result.start_stop}}</span><i class="icon-qiehuan"></i><span>{{result.end_stop}}</span>
            </div>
            <div class="description">
              <span class="borderRight">全程: {{result.distance}}公里</span><span>票价: {{result.basic_price}}-{{result.total_price}}元</span>
            </div>
            <div class="close"><i class="icon-close"></i></div>
            <div class="change"><i class="icon-qiehuan"></i>换向</div>
          </div>
          <div class="metroBody">
            <ul>
              <li>
                <div>
                  <span class="pr5">开往</span>
                  <span class="stationName">{{result.start_stop}}</span>
                </div>
                <div>
                  <div class="blue f13">2分钟·1站</div>
                  <div class="color6 f13">下一辆超过半小时 超过13站</div>
                </div>
              </li>
            </ul>
          </div>
          <div class="stationList">
            <div class="busInfoTip"><span class="color_blue">等待首站发车，约12分钟/趟</span><p>上一班15分钟前过站</p></div>
            <ul class="stationListUl" style="width: {{result.width}}px">
              {{#each result.busstops}}
                <li>
                  <div class="stationItem">
                    <i class="icon-right-arrow"></i>
                    <span class="stname">{{name}}</span>
                  </div>
                </li>
              {{/each}}
            </ul>
          </div>
          <div class="btn-line" data-poi="">开始步行导航</div>
        </div>`;
    };

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.initTmp();
      that.injectComponentEvents();
    };

    that.changeLanguage = function () {
      that.initTmp();
    };

    that.injectComponentUI = function (wrapperdom) {
      const defaultWrapper = `
        <div class="search-list-widget ui-panel" id="slide-poi-list2" style="display:block;height:500px;">
          <div class="slide-widget-scroller ui-panel" style="overflow-y: scroll;height:100%;box-sizing:border-box">
            <div id="genre-list" class="genre-list" style="height:100%;box-sizing:border-box"></div>
          </div>
        </div>`;
      domUtils.append(that.parentObj, wrapperdom || defaultWrapper);
      that._dom = that.parentObj.find(".search-list-widget");
    };

    that.injectComponentEvents = function () {
      that._dom.on("click", ".close", function () {
        if (domUtils.isFastClick()) return;
        that.listener?.onClose?.();
      });

      that._dom.on("click", ".btn-line", function () {
        if (domUtils.isFastClick()) return;
        that.listener?.startNavi?.();
      });
    };

    that.getPoiData = function ($poiItem) {
      const poiId = ($poiItem.data("poi") || "") + "";
      const name = ($poiItem.data("name") || "") + "";
      const address = ($poiItem.data("address") || "") + "";
      return {
        poiId,
        id: poiId,
        bdid: $poiItem.data("bdid"),
        floorId: ($poiItem.data("floorid") || "") + "",
        lon: $poiItem.data("lon"),
        lat: $poiItem.data("lat"),
        name,
        address,
      };
    };

    that.updateData = function (data) {
      const result = data[0];
      if (result) {
        result.distance = parseFloat(result.distance);
        result.width = (result.busstops?.length || 0) * 40 + 12;
      }
      that.data = data;
      domUtils.templateText(genreListShowHtml, { result }, that._dom.find(".genre-list"));
      that._dom.find(".genre-list-message .info").text(that.list_message_tip);
      if (data?.length) that.showList();
    };

    that.showLoading = function () {
      that._dom.find(".genre-list").html(`
        <div class="loading_wraper" style="width:100%;display:flex;align-items: center;justify-content: center;">
          <p class="loading" style="width:60px;height:60px;"></p>
        </div>`);
      that._dom.show();
    };

    that.hideLoading = function () {
      domUtils.show(that._dom, ".loading", false);
    };

    that.show = function () {
      that._dom.show();
      that.listener?.viewStateChanged?.(that, {
        state: "hideList",
        viewHeight: that._height || 260,
      });
    };

    that.hide = function () {
      that._dom.hide();
    };

    that.setWidgetHeight = function (height) {
      that._height = height;
      that._dom.css("height", `${height}px`);
    };

    that.hideList = function () {
      const listDom = domUtils.find(that._dom, ".genre-list-items");
      domUtils.show(listDom, false);
    };

    that.showList = function () {
      that._dom.show();
      const listDom = that._dom.find(".genre-list-items");
      domUtils.show(listDom, true);
    };
  };
  daxiapp["DXBusLineDetailView"] = daxiapp["DXBusDetailView"] = DXBusLineDetailView;

  /** 导航提示视图 */
  const DXNaviTipView = function (options, parentObject) {
    const that = this;
    that._params = options;
    that.parentObj = parentObject;
    that.isShow = false;
    that.speed = 1;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const langData = window.langData || {};
      const playIconBase64 =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAABXUExURUxpcf///////////////////////////////////////////////////////////////////////////5ubm8rKyubm5qenp/X19dfX16CgoLS0tMDAwLgcJyIAAAATdFJOUwBaDt3SA8X77ktjqY40OhQgnYJQd9sjAAACF0lEQVRo3r2a23LDIAxEscGAb01ikfT6/9/ZTJtO0tgGCbPe5wxnokUCSyjFUj1WU2+N9s55bWw/VWOtSqluB0MLMkNbAFJ31tGqnO22Mdo+svqN0be5qzeVIZZM1eQs32liS3dixIshkcyLaPnDicQ6HQTeesqQ57rdDJSpgeXE0VK27DG9/uhpg/yICT/fiMrRRrkquj4VUITQuhIA12L8TTt9LLT+lbC4WxtLxWSXMm6gghoWDKaimhl9WDXg8pZlw3NtXa/P59dLDuH0dL6s//IcwjknP/6dQI2JAsJnRpjM407qKA4IH+9yQvfwB3QKEMKXOEy64dW4GyDIvb5XPcMBhCANk+Hl2B0g9vov23ouQBqm/na/dWyAMCVcndyjM4AsTL871YoAopSwjAjNAJKU+IlRqk7PAQKvW8ZBswDgp8SQyrI1ANfra67VlAXghqlWYybgmhIcwJi+zK0CWGGq1JQP4KTElChEcQAjJXplNwGSXtvkLk0AUmEySm8EJLzWym8GRMPkldsOiKWEwwPgIYKbDN+m8ESDlwp4sYOXa/iBAz8y4Yc+/toCv3jBr47wyy/++g7/AIF/QuE/AuGfsfgPcXgrAd4Mwbdz4A0pfEsN3xSEtzXxjVl8axneHMe39/EDCvyIBT8kwo+58IM6/KgRPyzFj3t3GFjjR+47PBrAP3vY4eHGHk9Pdng8s/n5zzd/dxrnZezVFgAAAABJRU5ErkJggg==";

      const dom = `
        <div class="navi-top-wrapper"> 
          <div class="navi-segment-container">
            <div class="navi-segment-info">
              <div class="panel-text">
                <span class="target_dist">10米</span>
                <span class="target_angle">直行</span>
              </div>
              <span id="navi-angle" class="cur_icon undefined"></span>
            </div>
          </div>
          <div class="navigating-top-tip">
            <div class="navigating-pause" style="display: flex; flex-wrap: wrap">
              <div class="navigating-pause-title">${langData["pause:navi:text"] || "导航暂停"}</div>
              <div class="navigating-bottom-pause-tip">
                <span class="timer">5</span>${langData["countdown:pause:navi"] || "秒后继续"}
              </div>
              <div class="navigating-resume">
                <i class="icon" type="play" width="20px">
                  <img src="${playIconBase64}" alt="" style="width: 20px; height: auto; pointer-events: none"/>
                </i>
              </div>
            </div>
            ${
              that.listener?.simulate
                ? `
              <div class="navigating-simulate" style="display: flex; flex-wrap: wrap">
                <div class="navigating-title">
                  ${langData["start:simulatenavi:btntext"] || "模拟导航"}|<span class="speed">${langData.speed || "速度"}</span>
                </div>
                <div class="navigating-speed" style="color: #f5a623;" data-speed="1">${langData["speed:nomral:text"] || "正常"}</div>
              </div>
            `
                : ""
            }
          </div>
        </div>`;

      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".navi-top-wrapper");

      if (options?.hideNaviDis) {
        domUtils.find(that._dom, ".target_dist").css({ display: "none" });
      }

      that._pauseTip = domUtils.find(that._dom, ".navigating-pause");
      that._pauseTipTimer = domUtils.find(that._pauseTip, ".timer");
      that._simulatingTip = domUtils.find(that._dom, ".navigating-simulate");
      that._simulateSpeed = domUtils.find(that._simulatingTip, ".navigating-speed");
    };

    that.changeLanguage = function () {
      const langData = window.langData || {};
      that._dom.find(".navigating-pause-title").text(langData["pause:navi:text"] || "导航暂停");
      that._dom.find(".navigating-bottom-pause-tip").text(langData["countdown:pause:navi"] || "秒后继续");
      that._dom.find(".navigating-title").text(langData["start:simulatenavi:btntext"] || "模拟导航");
      that._dom.find(".navigating-title .speed").text(langData.speed || "速度");
      that._dom.find(".navigating-speed").text(langData["speed:nomral:text"] || "正常");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".navigating-resume", () => {
        that.listener.triggerResume();
      });

      domUtils.on(that._dom, "click", ".navigating-speed", function () {
        let speed = Number(this.dataset.speed);
        speed > 2 ? (speed = 1) : speed++;
        that.speed = speed;

        const langData = window.langData || {};
        const speedText =
          speed == 1 ? langData["speed:nomral:text"] || "正常" : speed == 2 ? langData["speed:middle:text"] || "中速" : langData["speed:high:text"] || "高速";

        that._simulateSpeed.text(speedText).attr("data-speed", speed);
        that.listener.triggerChangeSpeed?.(speed);
      });
    };

    that.updateData = function (options) {
      const langData = window.langData || {};

      if (that._params?.naviTip == "v3") {
        if (options?.currFloorTargetName != that._nextInstuction) {
          domUtils.find(that._dom, ".target_angle").text((langData.destnation || "") + (options.currFloorTargetName || ""));
          that._nextInstuction = options.currFloorTargetName;
        }
        return;
      }

      if (options?.changeFloorText) {
        domUtils.find(that._dom, ".target_dist").text("");
        const nextInstuction = options.changeFloorText;
        domUtils.find(that._dom, ".target_angle").text(nextInstuction);
        that._nextInstuction = nextInstuction;
      } else {
        const aheadText = langData.ahead || "前方";
        const distanceToNext = dxUtils.distanceToText(options?.distanceToNext);

        if (options?.distanceToNext == "" || options?.distanceToNext < 1) {
          domUtils.find(that._dom, ".target_dist").text(distanceToNext);
          let nextInstuction = options?.nextInstuction;

          if (options?.targetDistance > 4 && !options?.isEnd) {
            nextInstuction = aheadText + nextInstuction;
          } else if (options?.isEnd) {
            nextInstuction = aheadText + (langData["arriving:tip:navi"] || "即将") + nextInstuction;
          }

          if (that._nextInstuction != nextInstuction) {
            domUtils.find(that._dom, ".target_angle").text(nextInstuction);
            that._nextInstuction = nextInstuction;
          }
        } else {
          if (distanceToNext && that._distanceToNext != distanceToNext) {
            if (options?.speakType != 2 && options?.nextInstuction && !options?.nextInstuction.toLowerCase().includes(aheadText.toLowerCase())) {
              domUtils.find(that._dom, ".target_dist").text(aheadText + distanceToNext + (langData.rearward || "后"));
            } else if (distanceToNext) {
              domUtils.find(that._dom, ".target_dist").text(distanceToNext + (langData.rearward || "后"));
            } else {
              domUtils.find(that._dom, ".target_dist").text("");
            }
          }
          const nextInstuction = options?.nextInstuction;
          if (that._nextInstuction != nextInstuction) {
            domUtils.find(that._dom, ".target_angle").text(nextInstuction);
            that._nextInstuction = nextInstuction;
          }
        }
        that._distanceToNext = distanceToNext;
      }
    };

    that.reset = function () {
      const langData = window.langData || {};
      that._nextInstuction = "";

      if (that.listener?.simulate) {
        domUtils
          .find(that._simulatingTip, ".navigating-speed")
          .text(langData["speed:nomral:text"] || "正常")
          .attr("data-speed", 1);
        that._simulatingTip.show();
      } else {
        that._simulatingTip.hide();
      }
      that._pauseTip.hide();
    };

    that.setSpeed = function (speed) {
      that.speed = speed;
      const langData = window.langData || {};
      const speedText =
        speed == 1 ? langData["speed:nomral:text"] || "正常" : speed == 2 ? langData["speed:middle:text"] || "中速" : langData["speed:high:text"] || "高速";
      that._simulateSpeed.text(speedText).attr("data-speed", speed);
    };

    that.setNaviState = function (naviState, pauseNaviRestartTime) {
      if (naviState == "navigating") {
        if (that.listener?.simulate) {
          that._simulatingTip.show();
        } else {
          that._simulatingTip.hide();
        }
        that._pauseTip.hide();
        clearTimeout(that.timeouter);
      } else if (naviState == "pause") {
        that._simulatingTip.hide();
        that._pauseTipTimer.text(pauseNaviRestartTime || 5);
        clearTimeout(that.timeouter);

        let counter = pauseNaviRestartTime || 5;
        that.timeouter = setTimeout(function countdown() {
          counter--;
          if (counter > 0) {
            that._pauseTipTimer.text(counter);
            that.timeouter = setTimeout(countdown, 1000);
          } else {
            that.listener.triggerResume();
          }
        }, 1000);

        that._pauseTip.show();
      } else {
        clearTimeout(that.timeouter);
      }
    };

    that.show = function () {
      domUtils.show(that._dom, true);
    };

    that.hide = function () {
      domUtils.show(that._dom, false);
    };

    return that;
  };
  daxiapp["DXNaviTipView"] = DXNaviTipView;

  /** 导览导航信息视图 */
  const DXTouristNaviInfoView = function (app, parentObject, params) {
    const that = this;
    that._app = app;
    that._params = params || {};
    that.parentObj = parentObject;
    that.isShow = false;
    that.speed = 1;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const langData = window.langData || {};
      const exitIconBase64 =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4BAMAAADLSivhAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAeUExURUxpcf///////////////////////////////////9noCcoAAAAJdFJOUwB8WgOf3aotkAoIG7EAAAHOSURBVFjD7di5TsNAEAZgk3C0qZDSuaFwR2GJFskVHaKghoI+r0FpiyL7thCfu+s5/pkWT7n+Zz9nfSlbFFtttRVbd1/vJ3eyCqHFmo8hdNl04a8OSO/VJZnSt5ehFoRD+EiGbgJI93B4JZpbEM6a+9MG6AEOz+sFA+gBzhZsGj1AcIsNFxiB0KyA0Dyg08L8Oi1Nr9Hi7BotTy4fVeaWD2u/SjqurqcU0K8knwDuIT6C3L1cBnpuuBD2xNIp7IFlYkfwLUXlQJgOojCVhGEqisPrrAFehy1wnjbBedwGp3kjnDZY4bjDDMctdnjpccAL7YFn2gPPtAtOaCuc0GY4ou1wRDvgmfbAxf5laP55dDTX02k3fthF18ulavywg67j27Pxw2Z6hLvKQU9wuXPQE9z/ZTLSM1wUdnqB7XQE2+kYttIJbKVT2EZnsI3OYQu9gi30GsZpAsZpCkZpEkZpGsZoBsZoDkZoFkZoHtZpAdZpCdZoEdZoGZZpBZZpDZZoFZZoHeZpAOZpBGbpbwCe6XM6+gTBM32iNtNKrXmkqT3ATn8zV+weYKk374jmaxAeaWIPsESad8Qe4EMIb9gXmEju7z/Bbz+e3Gqr/1m//Hy8PYBS0IgAAAAASUVORK5CYII=";
      const playIconBase64 =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAABXUExURUxpcf///////////////////////////////////////////////////////////////////////////5ubm8rKyubm5qenp/X19dfX16CgoLS0tMDAwLgcJyIAAAATdFJOUwBaDt3SA8X77ktjqY40OhQgnYJQd9sjAAACF0lEQVRo3r2a23LDIAxEscGAb01ikfT6/9/ZTJtO0tgGCbPe5wxnokUCSyjFUj1WU2+N9s55bWw/VWOtSqluB0MLMkNbAFJ31tGqnO22Mdo+svqN0be5qzeVIZZM1eQs32liS3dixIshkcyLaPnDicQ6HQTeesqQ57rdDJSpgeXE0VK27DG9/uhpg/yICT/fiMrRRrkquj4VUITQuhIA12L8TTt9LLT+lbC4WxtLxWSXMm6gghoWDKaimhl9WDXg8pZlw3NtXa/P59dLDuH0dL6s//IcwjknP/6dQI2JAsJnRpjM407qKA4IH+9yQvfwB3QKEMKXOEy64dW4GyDIvb5XPcMBhCANk+Hl2B0g9vov23ouQBqm/na/dWyAMCVcndyjM4AsTL871YoAopSwjAjNAJKU+IlRqk7PAQKvW8ZBswDgp8SQyrI1ANfra67VlAXghqlWYybgmhIcwJi+zK0CWGGq1JQP4KTElChEcQAjJXplNwGSXtvkLk0AUmEySm8EJLzWym8GRMPkldsOiKWEwwPgIYKbDN+m8ESDlwp4sYOXa/iBAz8y4Yc+/toCv3jBr47wyy/++g7/AIF/QuE/AuGfsfgPcXgrAd4Mwbdz4A0pfEsN3xSEtzXxjVl8axneHMe39/EDCvyIBT8kwo+58IM6/KgRPyzFj3t3GFjjR+47PBrAP3vY4eHGHk9Pdng8s/n5zzd/dxrnZezVFgAAAABJRU5ErkJggg==";

      const dom = `
        <div class="tournavi-top-wrapper"> 
          <div class="navi-segment-container">
            <div class="navi-info" style="box-shadow: 1px 2px 4px #696969;border-radius: 4px;">
              <div class="navi-segment-info">
                <div class="panel-text">
                  <span class="target_dist">10米</span>
                  <span class="target_angle">直行</span>
                </div>
                <span id="navi-angle" class="cur_icon undefined"></span>
              </div>
              <div class="next-station"></div>
            </div>
          </div>
          <div class="navigating-bottom-main" alignitems="center" style="display: flex; flex-wrap: wrap; align-items: center;background-color: #598bfd;padding-left: 10px;padding: 6px 0px 6px 10px;">
            <div class="navigating-bottom-content">
              <div>
                <span>${langData.distance || "距离"}</span></br>
                <span><strong class="tipFloor"></strong><small class="rest-distance"></small></span>
              </div>
              <div style="width: 25%">
                <div>${langData.time || "时间"}</div>
                <div><strong class="rest-time"></strong></div>
              </div>
              <div style="width: 40%" class="arrive-time"></div>
            </div>
            <div class="continueNavi" style="display: none;flex: 1 1;text-align: center;color: #fff;">
              ${langData.continue || "继续导航"}
            </div>
            <div class="toNextScenic" style="display: none;flex: 1 1;text-align: center;color: #fff;">
              ${langData.toNextScenic || "点此继续前往下一个景点"}
            </div>
            <div class="navigating-bottom-btn exit-btn" style="width: 16.6667%; flex-basis: 16.6667%">
              <div>
                <i class="icon" type="close-white-2" width="26px">
                  <img src="${exitIconBase64}" style="width: 18px; height: auto; pointer-events: none"/>
                </i>
              </div>
              <span>${langData.exit || "退出"}</span>
            </div>
          </div>
          <div class="navigating-top-tip">
            <div class="navigating-pause" style="display: flex; flex-wrap: wrap">
              <div class="navigating-pause-title">${langData["pause:navi:text"] || "导航暂停"}</div>
              <div class="navigating-bottom-pause-tip">
                <span class="timer">5</span>${langData["countdown:pause:navi"] || "秒后继续"}
              </div>
              <div class="navigating-resume">
                <i class="icon" type="play" width="20px">
                  <img src="${playIconBase64}" alt="" style="width: 20px; height: auto; pointer-events: none"/>
                </i>
              </div>
            </div>
            ${
              that.listener?.simulate
                ? `
              <div class="navigating-simulate" style="display: flex; flex-wrap: wrap">
                <div class="navigating-title">
                  ${langData["start:simulatenavi:btntext"] || "模拟导航"}| <span class="speed">${langData.speed || "速度"}</span>
                </div>
                <div class="navigating-speed" style="color: #f5a623;" data-speed="1">${langData["speed:nomral:text"] || "正常"}</div>
              </div>
            `
                : ""
            }
          </div>
        </div>`;

      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".tournavi-top-wrapper");
      that._pauseTip = domUtils.find(that._dom, ".navigating-pause");
      that._pauseTipTimer = domUtils.find(that._pauseTip, ".timer");
      that._simulatingTip = domUtils.find(that._dom, ".navigating-simulate");
      that._simulateSpeed = domUtils.find(that._simulatingTip, ".navigating-speed");
      that._continueNaviBtn = domUtils.find(that._dom, ".continueNavi");
      that._navingBtn = domUtils.find(that._dom, ".navigating-bottom-content");
      that._toNextScenicBtn = domUtils.find(that._dom, ".toNextScenic");
    };
    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".navigating-resume", () => {
        that.listener.triggerResume();
      });

      domUtils.on(that._dom, "click", ".navigating-speed", function () {
        let speed = Number(this.dataset.speed);
        speed > 2 ? (speed = 1) : speed++;
        that.speed = speed;

        const langData = window.langData || {};
        const speedText =
          speed == 1 ? langData["speed:nomral:text"] || "正常" : speed == 2 ? langData["speed:middle:text"] || "中速" : langData["speed:high:text"] || "高速";

        that._simulateSpeed.text(speedText).attr("data-speed", speed);
        that.listener.triggerChangeSpeed?.(speed);
      });

      domUtils.on(that._dom, "click", ".exit-btn", () => {
        that.listener.onExitButtonClicked();
      });

      domUtils.on(that._dom, "click", ".toNextScenic", () => {
        that.listener.onNaviToNextScnic();
      });
    };

    that.updateData = function (options) {
      const langData = window.langData || {};

      if (options?.remainDistance) {
        const distance =
          options.remainDistance < 1000
            ? options.remainDistance + (langData["meter:distance"] || "米")
            : Math.floor(options.remainDistance / 1000) + "千" + ((options.remainDistance % 1000) + (langData["meter:distance"] || "米"));
        that._dom.find(".rest-distance").text(distance);
      }

      if (options?.remainTime) {
        that._dom.find(".rest-time").text(options.remainTime.replace(langData.minute || "分钟", langData["minute:lue"] || "分"));
      }

      if (that._params?.naviTip == "v3") {
        if (options?.currFloorTargetName != that._nextInstuction) {
          domUtils.find(that._dom, ".target_angle").text((langData.destnation || "") + (options.currFloorTargetName || ""));
          that._nextInstuction = options.currFloorTargetName;
        }
        return;
      }

      if (options?.changeFloorText) {
        domUtils.find(that._dom, ".target_dist").text("");
        const nextInstuction = options.changeFloorText;
        domUtils.find(that._dom, ".target_angle").text(nextInstuction);
        that._nextInstuction = nextInstuction;
      } else {
        const aheadText = langData.ahead || "前方";
        const distanceToNext = dxUtils.distanceToText(options?.distanceToNext);

        if (options?.distanceToNext == "" || options?.distanceToNext < 1) {
          domUtils.find(that._dom, ".target_dist").text(distanceToNext);
          let nextInstuction = options?.nextInstuction;

          if (options?.targetDistance > 4 && !options?.isEnd) {
            nextInstuction = aheadText + nextInstuction;
          } else if (options?.isEnd) {
            nextInstuction = aheadText + (langData["arriving:tip:navi"] || "即将到达") + nextInstuction;
          }

          if (that._nextInstuction != nextInstuction) {
            domUtils.find(that._dom, ".target_angle").text(nextInstuction);
            that._nextInstuction = nextInstuction;
          }
        } else {
          if (distanceToNext && that._distanceToNext != distanceToNext) {
            if (options?.speakType != 2 && options?.nextInstuction && !options?.nextInstuction.toLowerCase().includes(aheadText.toLowerCase())) {
              domUtils.find(that._dom, ".target_dist").text(aheadText + distanceToNext + (langData.rearward || "后"));
            } else if (distanceToNext) {
              domUtils.find(that._dom, ".target_dist").text(distanceToNext + (langData.rearward || "后"));
            } else {
              domUtils.find(that._dom, ".target_dist").text("");
            }
          }
          const nextInstuction = options?.nextInstuction;
          if (that._nextInstuction != nextInstuction) {
            domUtils.find(that._dom, ".target_angle").text(nextInstuction);
            that._nextInstuction = nextInstuction;
          }
        }
        that._distanceToNext = distanceToNext;
      }
      that._dom.show();
    };
    that.setArringTime = function (arriveTime) {
      const langData = window.langData || {};
      const text = langData["prediction:arrived:time:tip"] || "预计{{time}}到达";
      that._dom.find(".arrive-time").text(text.replace("{{time}}", arriveTime));
    };

    that.setTargetInfo = function (station) {
      that._dom.find(".next-station").text("下一个景点" + station.name);
    };

    that.triggerExitNaviBtnClick = function () {
      that._dom.find(".exit-btn").trigger("click");
    };

    that.reset = function () {
      const langData = window.langData || {};
      that._dom.find(".next-station").text("");

      if (that.listener?.simulate) {
        domUtils
          .find(that._simulatingTip, ".navigating-speed")
          .text(langData["speed:nomral:text"] || "正常")
          .attr("data-speed", 1);
        that._simulatingTip.show();
      } else {
        that._simulatingTip.hide();
      }
      that._pauseTip.hide();
    };

    that.setSpeed = function (speed) {
      that.speed = speed;
      const langData = window.langData || {};
      const speedText =
        speed == 1 ? langData["speed:nomral:text"] || "正常" : speed == 2 ? langData["speed:middle:text"] || "中速" : langData["speed:high:text"] || "高速";
      that._simulateSpeed.text(speedText).attr("data-speed", speed);
    };

    that.setNaviState = function (naviState) {
      if (naviState == "navigating") {
        if (that.listener?.simulate) {
          that._simulatingTip.show();
        } else {
          that._simulatingTip.hide();
        }
        that._pauseTip.hide();
        clearTimeout(that.timeouter);
        that._continueNaviBtn.hide();
        that._toNextScenicBtn.hide();
        that._navingBtn.show();
      } else if (naviState == "pause") {
        that._continueNaviBtn.show();
        that._navingBtn.hide();
        that._toNextScenicBtn.hide();
        that._simulatingTip.hide();
        that._pauseTipTimer.text(5);
        clearTimeout(that.timeouter);

        let counter = 5;
        that.timeouter = setTimeout(function countdown() {
          counter--;
          if (counter > 0) {
            that._pauseTipTimer.text(counter);
            that.timeouter = setTimeout(countdown, 1000);
          } else {
            that.listener.triggerResume();
          }
        }, 1000);

        that._pauseTip.show();
      } else if (naviState == "finishedNotLast") {
        that._pauseTip.hide();
        that._simulatingTip.hide();
        that._continueNaviBtn.hide();
        that._toNextScenicBtn.show();
        that._navingBtn.hide();
        clearTimeout(that.timeouter);
        domUtils.find(that._dom, ".target_dist").text("");
        domUtils.find(that._dom, ".target_angle").text("到达景点请自行浏览");
      } else {
        clearTimeout(that.timeouter);
      }
    };

    that.show = function () {
      domUtils.show(that._dom, true);
    };

    that.hide = function () {
      domUtils.show(that._dom, false);
    };

    return that;
  };
  daxiapp["DXTouristNaviInfoView"] = daxiapp["DXTouristNaviInfo"] = DXTouristNaviInfoView; // "DXTouristNaviInfo"为向后兼容

  /** 导航底部视图 */
  const DXNaviBottomView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;
    that.lastSegmentInfo = {};

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const langData = window.langData || {};

      const dom = `
        <div class="navi_bottom_container">
          <ul class="nav-list">
            <li class="continue_navi_container navi-status-tip">
              <p class="navigating-info">
                ${langData["takettime:tip:navi"] || "耗时约"}
                <span class="spend-time"></span>
                ${langData.distance || "距离"}
                <span class="rest-distance"></span>
              </p>
              <p class="pause-tip">
                ${langData.continue || "继续导航"}
              </p>
            </li>
            <li class="map_view_exit_btn">
              <i class="icon_gb-close4"></i>
              <span>${langData.exit || "退出"}</span>
            </li>
          </ul>
        </div>`;

      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".navi_bottom_container");
    };

    that.injectComponentEvents = function () {
      const dom = that._dom;
      that.setNaviState("navigating");

      domUtils.on(dom, "click", ".map_view_exit_btn", () => {
        that.listener?.onExitButtonClicked?.();
      });

      domUtils.on(dom, "click", ".pause-tip", () => {
        that.listener?.onNaviButtonClicked?.();
      });
    };

    that.updateData = function (naviInfo) {
      const segmentIndex = naviInfo.segmentIndex;
      const remainDistance = dxUtils.distanceToText(naviInfo.remainDistance);
      const remainTime = naviInfo.remainTime;
      const distanceToNext = dxUtils.distanceToText(naviInfo.distanceToNext);

      if (that.lastSegmentInfo.remainDistance != remainDistance || that.lastSegmentInfo.remainTime != remainTime) {
        domUtils.find(that._dom, ".spend-time").text(remainTime);
        domUtils.find(that._dom, ".rest-distance").text(remainDistance);
      }

      that.lastSegmentInfo = {
        distanceToNext,
        remainDistance,
        remainTime,
        segmentIndex,
      };
    };

    that.show = function () {
      domUtils.show(that._dom, true);
    };

    that.hide = function () {
      domUtils.show(that._dom, false);
    };

    that.setNaviState = function (state) {
      if (state == "navigating") {
        domUtils.find(that._dom, ".continue_navi_container .navigating-info").show();
        domUtils.find(that._dom, ".continue_navi_container .pause-tip").hide();
      } else {
        domUtils.find(that._dom, ".continue_navi_container .navigating-info").hide();
        domUtils.find(that._dom, ".continue_navi_container .pause-tip").show();
      }
    };

    return that;
  };
  daxiapp["DXNaviBottomView"] = DXNaviBottomView;

  /** 导航结束信息视图 */
  const DXNaviEndResultView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const langData = window.langData || {};
      const dom = `
        <div class="reach-wrapper reach_wrapper">
          <div class="reach-wrapper-alert">
            <span class="close-navi-end icon-guanbi"></span>
            <p class="title">${langData["end:tip2:navi"] || "您已到达目的地，导航结束"}</p>
            <p class="navi-total-info"><span class="total-msg"></span></p>
            <div class="reach-wrapper-detail">
              <div class="navi-end-icon">
                <span class="start-icon"></span>
                <span class="icon-vdots"></span>
                <span class="zhong-icon"></span>
              </div>
              <div class="route-pos-wrapper">
                <div class="routing-info-detail startpos-info" data-selector="startPos">
                  <span class="name"></span>
                  <span class="floor-name"></span>
                  <span class="address"></span>
                </div>
                <div class="routing-info-detail endpos-info" data-selector="endPos">
                  <span class="name"></span>
                  <span class="floor-name"></span>
                  <span class="address"></span>
                </div>
              </div>
            </div>
          </div>
        </div>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".reach-wrapper");
    };

    that.injectComponentEvents = function () {
      const dom = that._dom;
      domUtils.on(dom, "click", ".close-navi-end", () => {
        that.listener?.onCloseButtonClicked?.();
      });
      domUtils.on(dom, "click", ".endpano", function (e) {
        that.listener?.showPano?.(e.target?.dataset);
      });
    };

    /** 更新导航结束展示信息 */
    that.updateData = function (startPos, endPos, distance, time, msg) {
      const dom = that._dom;
      const langData = window.langData || {};
      const safeStartPos = startPos || {};
      const safeEndPos = endPos || {};

      domUtils.find(dom, ".startpos-info .name").text(safeStartPos.name || langData.startpoint || "起点");
      domUtils.find(dom, ".startpos-info .floor-name").text(safeStartPos.floorName || "");
      domUtils.find(dom, ".startpos-info .address").text(safeStartPos.address || "");

      domUtils.find(dom, ".endpos-info .name").text(safeEndPos.name || langData.endpoint || "终点");
      domUtils.find(dom, ".endpos-info .floor-name").text(safeEndPos.floorName || "");
      domUtils.find(dom, ".endpos-info .address").text(safeEndPos.address || "");

      const distanceText = dxUtils.distanceToText(distance);
      const timeText = time || "";

      if (msg) {
        domUtils.find(dom, ".total-msg").text(msg);
        return;
      }

      const totalTime = langData["totaltime:tip:navi"] || "总耗时{{time}}";
      const totalDis = langData.routedistance || "路线长{{distance}}";
      domUtils.find(dom, ".total-msg").text(totalTime.replace("{{time}}", timeText) + totalDis.replace("{{distance}}", distanceText));
    };

    that.show = function () {
      domUtils.show(that._dom, true);
    };
    that.hide = function () {
      domUtils.show(that._dom, false);
    };
    return that;
  };
  daxiapp["DXNaviEndResultView"] = daxiapp["DXNaviEndInfoView"] = DXNaviEndResultView; // "DXNaviEndInfoView"为向后兼容

  /** 建筑站点选择器视图 - 支持按字母排序和按地铁线路两种方式显示站点列表 */
  const DXBuildingStationSelectorView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;
    that.focusItem = null;

    let $station_list_container;
    that.$station_list_container = null;
    const stationsHbs = `
      <section class="stations_container scroller" id="station_list_container">
        {{#if hotStations}} <div class="hot_container station_list" data-capital="hot" data-capitalname="{{hotStations.title}}">{{#hot_station_list2 hotStations}}{{/hot_station_list2}} </div>{{/if}}
        {{#each stationList}}<div class="station_list" data-capital="{{first_capital}}" data-capitalname="{{first_capital}}"><p class="capital">{{first_capital}}</p><ul class="inner_list">
        {{#each list}}<li class="station {{#eq enable 0}}disable{{/eq}}" data-bdid="{{bdid}}" data-citycode="{{citycode}}" data-range={{range}} data-location={{location}} data-zoom={{mapZoom}}>{{cn_name}}</li>{{/each}}</ul></div>{{/each}}
      </section>
      {{#if stationList}}<div class="capital_container" ><ul class="capital_list">{{#if hotStations}}<li class="capital_item" data-id="hot">热门</li>{{/if}}{{#each stationList}}<li class="capital_item" data-id="{{first_capital}}">{{first_capital}}</li>{{/each}}</ul></div>{{/if}}
      <p class="curr_focus fix_title"></p>`;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom = '<div class="building_display_wrapper" style="height: 100%;"></div>';
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".building_display_wrapper");
      domUtils.on(that._dom, "click", ".item", function (e) {
        if (domUtils.isFastClick()) {
          return;
        }
        const data = domUtils.getData("autocomplete_list", this);
        that.listener?.onListItemClicked?.(that, data);
      });
    };

    that.injectComponentEvents = function () {
      const dom = that._dom;
      let boxRect,
        boxHeight,
        boxClientTop,
        itemCount = 0,
        itemList;
      let touching = false;

      function start(clientX, clientY) {
        touching = true;
        move(clientX, clientY);
      }

      function move(clientX, clientY) {
        const offset = calcRelativePosition(clientY);
        const percent = offset / boxHeight;
        const item = getPositionItem(percent);
        if (!item) {
          return;
        }
        if (that.focusItem != item) {
          that.focusItem = item;
          updateTip(item);
        }
      }

      function end() {
        touching = false;
        that.focusItem = null;
      }

      function updateTip(e) {
        const capital = $(e).data("id");
        that.hoverCapital = capital;
        that.hoverCount = 0;
        const targetStationList = that._dom.find(`.station_list[data-capital=${capital}]`);
        const parentOffsetTop = parseInt($station_list_container.offset().top);
        const targetOffsetTop = parseInt(targetStationList.offset().top);
        const scrollTop = $station_list_container.scrollTop();
        $station_list_container.scrollTop(scrollTop + targetOffsetTop - parentOffsetTop);
        let styleStr = "";
        if (capital.length > 2) {
          styleStr = `font-size:${((2.4 * 2) / capital.length).toFixed(1)}rem`;
        }
        const tipString = `<span class="capital_selected_tip" id="capitalTip" style="${styleStr}">${capital}</span>`;
        that.notifyMsg(that.parentObj, "#capitalTip", tipString, 2000);
      }

      function calcRelativePosition(clientY) {
        let y = clientY - boxClientTop;
        if (y < 0) {
          y = 0;
        } else if (y > boxHeight) {
          y = boxHeight;
        }
        return y;
      }

      function getPositionItem(yPercent) {
        const min = 1;
        const max = itemCount;
        let index = Math.round(yPercent * max);
        if (index < min) {
          index = min;
        } else if (index > max) {
          index = max;
        }
        return itemList[index - 1];
      }

      dom.on("tap", ".capital_item", function (e) {
        that.focusItem = e.target;
        updateTip(e.target);
      });

      dom.on(
        "touchstart",
        ".capital_list",
        function (e) {
          if (!boxRect) {
            const capitalList = domUtils.find(dom, ".capital_list");
            boxRect = e.currentTarget.getBoundingClientRect();
            boxHeight = boxRect.height;
            boxClientTop = boxRect.top;
            itemList = domUtils.find(capitalList, ".capital_item");
            itemCount = itemList.length;
          }
          if (!touching) {
            e.preventDefault();
            const t = e.touches[0];
            start(t.clientX, t.clientY);
          }
        },
        false,
      );

      document.addEventListener(
        "touchmove",
        function handler(e) {
          if (touching) {
            e.preventDefault();
            const t = e.touches[0];
            move(t.clientX, t.clientY);
          }
        },
        false,
      );

      document.addEventListener(
        "touchend",
        function (e) {
          if (touching) {
            e.preventDefault();
            end();
          }
        },
        false,
      );

      dom.on("tap", ".station", function () {
        if (domUtils.isFastClick()) {
          return;
        }
        if ($(this).hasClass("disable")) {
          return;
        }
        const bdid = $(this).data("bdid") + "";
        const bdlist = that.buildingList || [];
        let bdInfo = null;
        bdlist.forEach(function (item) {
          const list = item.list || [];
          list.forEach(function (bdinfo) {
            if (bdinfo.bdid == bdid) {
              bdInfo = bdinfo;
            }
          });
        });
        that.listener?.onStationClicked?.(that, bdInfo);
      });

      dom.on("tap", ".line_wrapper .line_name", function () {
        if ($(this).hasClass("disable")) {
          return;
        }
        const $parent = $(this).parent();
        if ($parent.hasClass("expanded")) {
          $parent.removeClass("expanded");
          $parent.find(".line_station").animate({ opacity: 0, display: "none" }, 800);
        } else {
          const $expandDom = $parent.siblings(".expanded");
          if ($expandDom.length > 0) {
            $expandDom.find(".line_station").animate({ opacity: 0, display: "none" }, 800);
          }
          $parent.addClass("expanded");
          $parent.siblings().removeClass("expanded");
          $parent.find(".line_station").animate({ opacity: 1, display: "block" }, 800);
          const firstTop = $(".lines_wrapper_container .line_wrapper").eq(0).offset().top;
          dom.find(".lines_wrapper_container").scrollTop($parent.offset().top - firstTop + 6);
        }
      });

      dom.on("tap", ".hotLines .line", function () {
        const lineid = $(this).data("lineid");
        $(`#line_${lineid} .line_name`).trigger("tap");
      });
    };

    that.notifyMsg = function (container, selector, tipString, delay, callback) {
      clearTimeout(that.notifyTimer);
      that.notifyTimer = null;
      container.find(selector).remove();
      container.append(tipString);
      if (!delay) {
        delay = 2000;
      }
      that.notifyTimer = setTimeout(function () {
        container.find(selector).remove();
      }, delay);
    };

    /**  按首字母排序渲染站点列表 */
    function renderStopListByCapitalSort(data, container, currBdid, token) {
      that.stations = data;
      const dataObj = {};
      const dataArr = [];
      let _index = -1;
      const buildingList = data.filelist || data.list;
      const hotStations = data.hotStations || [];
      const stationsData = { hotStations: [] };

      for (const key in buildingList) {
        const item = buildingList[key];
        const firstCapital = item.first_capital;
        const enable = item.enable;
        if (enable == false) {
          continue;
        }
        if (dataObj[firstCapital] == undefined) {
          _index++;
          dataObj[firstCapital] = _index;
          dataArr.push({ first_capital: firstCapital, list: [] });
        }
        dataArr[dataObj[firstCapital]].list.push(item);
        const bdid = item.bdid;
        if (hotStations.indexOf(bdid) != -1) {
          stationsData.hotStations.push(item);
        }
      }

      that.buildingList = dataArr;
      if (dataArr.length == 0) {
        domUtils.showInfo("没有有效站数据!");
        return;
      }

      dataArr.sort(function (item1, item2) {
        if (item1.first_capital > item2.first_capital) {
          return 1;
        } else if (item1.first_capital < item2.first_capital) {
          return -1;
        } else {
          return 0;
        }
      });

      if (stationsData) {
        const hot_desc = data.hotNameDesc || "热门";
        stationsData.hotStations.title = hot_desc;
      }
      stationsData.stationList = dataArr;

      if (that.capitalItemListDom) {
        if (!("ontouchstart" in window)) {
          that.capitalItemListDom.removeEventLisener("mousemove", that.moveCapitalList);
          that.capitalItemListDom.removeEventLisener("mousedown", that.startHandleCapitalList);
          that.capitalItemListDom.removeEventLisener("mouseup", that.endHandleCapitalList);
        }
      }

      domUtils.templateText(stationsHbs, stationsData, container);
      registEvent();
    }

    /** 按地铁线路渲染站点列表 */
    function renderStopListByLine(linesData, stationsData, container, currBdid) {
      const lineListHbs = `
        <section class="lines_container scroller" id="line_list_container" style="overflow:scroll">
          {{#if hotData}} <div class="hot_container line_list" data-capital="hot" data-capitalname="{{hotNameDesc}}"> <p class="hot_title">{{hotNameDesc}}<p><ul class="hotLines">{{#each hotData}}<li class="line {{#eq enable 0}}disable{{/eq}}" style="{{#if line_color}}background-color:{{line_color}}{{/if}}" data-lineid="{{line_id}}">{{line_name}}</li>{{/each}}</ul></div>{{/if}}
          <div class="lines_wrapper_container">
            {{#if listArr}}{{#each listArr}}<div class="line_wrapper" id="line_{{line_id}}" data-lineid="{{line_id}}"><p class="line_name {{#eq enable 0}}disable{{/eq}} icon-" style="{{#if line_color}}background-color:{{line_color}}{{/if}}">{{line_name}}</p><ul class="line_station">
            {{#each stationsData}}<li class="station {{#eq enable 0}}disable{{/eq}}" data-bdid="{{bdid}}" data-citycode="{{citycode}}" data-range={{range}} data-location={{location}} data-floorid="{{floorid}}">{{cn_name}}</li>{{/each}}</ul></div>{{/each}}
            {{else}}{{#each list}}<div class="line_wrapper" id="line_{{line_id}}" data-lineid="{{line_id}}"><p class="line_name icon-" style="{{#if line_color}}background-color:{{line_color}}{{/if}}">{{line_name}}</p><ul class="line_station">
            {{#each stationsData}}<li class="station" data-bdid="{{bdid}}" data-citycode="{{citycode}}" data-range={{range}} data-location={{location}}>{{cn_name}}</li>{{/each}}</ul></div>{{/each}}
            {{/if}}
          </div>
        </section>`;

      const stationList = stationsData.list;
      const lineList = linesData.list;
      that.lineList = lineList;
      that.stationList = stationList;

      for (const lineId in lineList) {
        const lineData = lineList[lineId];
        lineData.stationsData = [];
        lineData.stations.forEach(function (stationId) {
          let _station = stationList[stationId];
          if (_station.stops) {
            const _stationnew = JSON.parse(JSON.stringify(_station));
            const stop = _station.stops[lineId];
            if (!stop) {
              console.log("error stops for line not found", stationId, lineId);
            } else {
              for (const key in stop) {
                _stationnew[key] = stop[key];
              }
              _station = _stationnew;
            }
          }
          lineData.stationsData.push(_station);
        });
      }

      linesData.listArr = [];
      const listSorted = linesData.listSorted;
      if (listSorted) {
        for (let i = 0, len = listSorted.length; i < len; i++) {
          linesData.listArr.push(lineList[listSorted[i]]);
        }
      }

      const hotLines = linesData.hotLines;
      if (hotLines) {
        linesData.hotData = [];
        if (hotLines instanceof Array) {
          for (const key in hotLines) {
            if (typeof hotLines[key] == "object") {
              linesData.hotData.push(hotLines[key]);
            } else {
              linesData.hotData.push(lineList[hotLines[key]]);
            }
          }
        } else if (hotLines instanceof Object) {
          linesData.hotData = hotLines;
        }
      }

      domUtils.templateText(lineListHbs, linesData, container);
      const $lines_container = container.find(".lines_container");

      let height = parseInt(that.parentObj.height() - $lines_container.offset().top + that.parentObj.offset().top);
      if (height) {
        height += "px";
      } else {
        if (dxUtils.Platform.iphone) {
          height = $("body").height() - 50 + "px";
        } else {
          height += "98%";
        }
      }
      $lines_container.css({ height: height });
    }

    function registEvent() {
      that.capitalItemListDom = that.parentObj.find(".capital_list")[0];
      if (!("ontouchstart" in window)) {
        that.capitalItemListDom.addEventListener("mousemove", that.moveCapitalList, false);
        that.capitalItemListDom.addEventListener("mousedown", that.startHandleCapitalList, false);
        that.capitalItemListDom.addEventListener("mouseup", that.endHandleCapitalList, false);
      }

      $station_list_container = that._dom.find("#station_list_container");
      that.inited = true;
      const capitalHeight = that._dom.find(".hot_title.capital").height() || 36;
      const stationOffset = $station_list_container.offset();
      let height = parseInt(that.parentObj.height() - stationOffset.top);
      let height2;
      if (height) {
        height2 = height - capitalHeight + "px";
        height += "px";
      } else {
        height2 = "82vh";
        height = "98%";
      }

      $station_list_container.css({ height: height });
      that._dom.find(".capital_container").css({ height: height2 });
      that.computeListRange();
      const stationsContainerDom = that.parentObj.find(".stations_container")[0];
      stationsContainerDom.removeEventListener("scroll", that.scrollEvent, false);
      stationsContainerDom.addEventListener("scroll", that.scrollEvent, false);
      that._dom.find(".curr_focus.fix_title").hide();
    }

    function setActiveStation(bdid) {
      that.parentObj.find(".station.active").removeClass("active");
      that.parentObj.find(`.station[data-bdid='${bdid}']`).addClass("active");
    }

    that.updateData = function (data, currBdid, token) {
      that.token = token || that.token;

      const buildingsData = data?.buildingsData;
      if (!buildingsData) {
        renderStopListByCapitalSort(data, that._dom, currBdid, token);
        $station_list_container = that.$station_list_container = that._dom.find(".stations_container");
        return;
      }

      const stationList = buildingsData.buildList;
      const lineList = buildingsData.lineList;
      const strHtml = `
        <ul id="containerTaps">
          <li id="stationsByLinesTap">${lineList.descTapName || "按地铁线路"}</li>
          <li id="stationsByCapitalTap">${stationList.descTapName || "按车站字母"}</li>
        </ul>
        <div id="stationListContainer"></div>
        <div id="lineListContainer"></div>`;

      that._dom.html(strHtml);
      renderStopListByCapitalSort(stationList, that._dom.find("#stationListContainer"));
      renderStopListByLine(lineList, stationList, that._dom.find("#lineListContainer"));
      that.parentObj.find(".station").removeClass("active");
      that.parentObj.find(`.station[data-bdid='${that.currBdid}']`).addClass("active");

      that._dom.find("#containerTaps").off();
      that._dom.find("#containerTaps").on("tap", "li", function (e) {
        const id = $(this).attr("id");
        $(this).addClass("active").siblings().removeClass("active");
        if (id == "stationsByCapitalTap") {
          $("#stationListContainer").show();
          $("#lineListContainer").hide();
        } else {
          $("#stationListContainer").hide();
          const $lineListContainer = $("#lineListContainer");
          $lineListContainer.show();

          const $lineWrapper = $(".lines_wrapper_container");
          const lineWrapperOffset = $lineWrapper.offset();
          let wrapperHeight = parseInt(that.parentObj.height() - lineWrapperOffset.top + that.parentObj.offset().top);
          if (lineWrapperOffset.height > wrapperHeight) {
            if (wrapperHeight) {
              wrapperHeight += "px";
            } else {
              wrapperHeight = "70vh";
            }
            $lineWrapper.css({ height: wrapperHeight });
          }
        }
      });

      $("#stationsByCapitalTap").trigger("tap");

      $station_list_container = that.$station_list_container = that._dom.find("#stationListContainer");
      that.$line_list_container = that._dom.find("#lineListContainer");
    };

    that.scrollEvent = function (e) {
      const target = e.target;
      const offsetTop = target.offsetTop;
      const scrollTop = target.scrollTop;
      const domFixTitle = $(".curr_focus.fix_title");
      const domFixTitleHeight = domFixTitle.height() || $(".capital").height();

      const stationsContainerRange = that.stationsContainerRange;
      if (scrollTop <= 0) {
        domFixTitle.hide();
        return;
      }

      for (let len = stationsContainerRange.length, i = 0; i < len; i++) {
        const itemRange = stationsContainerRange[i];
        const top = itemRange.offsetTop - offsetTop;
        const bottom = itemRange.offsetTop - offsetTop + itemRange.offsetHeight;
        if (scrollTop >= top && scrollTop <= bottom) {
          if (domFixTitle.data("index") != i) {
            domFixTitle.data("index", i);
            domFixTitle.data("capital", itemRange.capital);
            domFixTitle.text(itemRange.capitalName);
          }
          const leftHeight = bottom - scrollTop - domFixTitleHeight;
          const positionTop = leftHeight > 0 ? 0 : leftHeight;
          domFixTitle.css("top", positionTop + "px");
          domFixTitle.show();
          break;
        }
      }
    };

    that.computeListRange = function () {
      that.stationsContainerRange = [];
      that.stationsContainer = that._dom.find(".station_list");
      for (let i = 0, len = that.stationsContainer.length; i < len; i++) {
        const stationList = that.stationsContainer[i];
        const capital = stationList.getAttribute("data-capital");
        const capitalName = stationList.getAttribute("data-capitalname");
        that.stationsContainerRange.push({
          capital: capital,
          offsetTop: stationList.offsetTop,
          offsetHeight: stationList.offsetHeight,
          _index: i,
          capitalName: capitalName,
        });
      }
    };

    that.moveCapitalList = function (e) {
      const capital = that.getEnteredCapitalItem(e);
      if (!capital || that.hoverCapital == capital) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();

      that.hoverCapital = capital;
      const targetStationList = $(`.station_list[data-capital=${capital}]`);
      const parentOffsetTop = parseInt($station_list_container.offset().top);
      const targetOffsetTop = parseInt(targetStationList.offset().top);
      const scrollTop = $station_list_container.scrollTop();
      $station_list_container.scrollTop(scrollTop + targetOffsetTop - parentOffsetTop);

      const tipString = `<span class="capital_selected_tip" id="capitalTip">${capital}</span>`;
      domUtils.notifyMsg(that.parentObj, "#capitalTip", tipString, 2000);
    };

    that.getEnteredCapitalItem = function (e) {
      return e.target.getAttribute("data-id");
    };

    that.startHandleCapitalList = function (e) {
      that.activeCapital = true;
      $station_list_container.addClass("overflow_hide");
    };

    that.endHandleCapitalList = function (e) {
      $station_list_container.removeClass("overflow_hide");
    };

    that.show = function () {
      domUtils.show(that._dom, true);
    };

    that.hide = function () {
      domUtils.show(that._dom, false);
    };

    return that;
  };
  daxiapp["DXBuildingStationSelectorView"] = daxiapp["DXBuildingListComponent"] = DXBuildingStationSelectorView;

  /**  */
  var DXFullIframeComponent = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom = `<div class="dx_full_frame_container iframe_page" style="">
        <header class="header-wrapper">
          <ul class="dx_header">
            <li class="goback icon-back icon-fanhui"></li>
            <li class="header"><span class="title"></span></li>
          </ul>
        </header>
        <div class="main_content" style="position: relative;flex-grow: 1;">
          <iframe src="" allow="camera; microphone" class="iframe_dom" style="width:100%;height:100%;border: 0px;margin: 0px;padding: 0px;"></iframe>
        </div>
      </div>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(parentObject, ".iframe_page");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".goback", function (e) {
        if (domUtils.isFastClick()) {
          return;
        }
        that.listener?.onClose?.();
      });
    };

    that.updateTitle = function (title) {
      domUtils.find(that._dom, ".dx_header .title").text(title);
    };

    that.updateIframe = function (url) {
      domUtils.find(that._dom, ".iframe_dom").attr("src", url);
    };

    that.startHandleCapitalList = function (e) {
      that.activeCapital = true;
      $station_list_container.addClass("overflow_hide");
    };

    that.endHandleCapitalList = function (e) {
      $station_list_container.removeClass("overflow_hide");
    };

    that.show = function () {
      domUtils.show(that._dom, true);
    };

    that.hide = function () {
      domUtils.show(that._dom, false);
    };

    return that;
  };
  daxiapp.DXFullIframeComponent = DXFullIframeComponent;

  var DXFullIframeWithCloseComponent = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom = `<div class="dx_full_frame_container iframe_page" style="">
        <span class="close_btn icon-guanbi" style="position:absolute;top: 2px;right: 6px;width: auto;height: auto;z-index: 2;font-size: 1.6rem;padding:10px" src=""></span>
        <div class="main_content" style="position: relative;flex-grow: 1;">
          <iframe allow="camera; microphone" src="" class="iframe_dom" style="width:100%;height:100%;border: 0px;margin: 0px;padding: 0px;"></iframe>
        </div>
      </div>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(parentObject, ".iframe_page");
    };

    that.setStyle = function (styleObj) {
      that._dom.css(styleObj);
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".close_btn", function (e) {
        if (domUtils.isFastClick()) {
          return;
        }
        that.listener?.onClose?.();
      });
    };

    that.updateTitle = function (title) {
      domUtils.find(that._dom, ".dx_header .title").text(title);
    };

    that.updateIframe = function (url) {
      domUtils.find(that._dom, ".iframe_dom").attr("src", url);
    };

    that.startHandleCapitalList = function (e) {
      that.activeCapital = true;
      $station_list_container.addClass("overflow_hide");
    };

    that.endHandleCapitalList = function (e) {
      $station_list_container.removeClass("overflow_hide");
    };

    that.setCloseBtnClass = function (iconName) {
      if (!iconName) {
        return;
      }
      domUtils.find(that._dom, ".close_btn").attr("class", `close_btn ${iconName}`);
    };

    that.show = function () {
      domUtils.show(that._dom, true);
    };

    that.hide = function () {
      domUtils.show(that._dom, false);
    };

    that.contentStyle = function (styleObj) {
      domUtils.find(that._dom, ".main_content").css(styleObj);
    };

    return that;
  };
  daxiapp.DXFullIframeWithCloseComponent = daxiapp.DXFullIframeComponent2 = DXFullIframeWithCloseComponent;

  var DXImageGalleryComponent = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom = `<div class="dximage_list_container" style="width:100%;height:100%;">
        <ul class="picList" id="picList" style="width:100%;height:100%;overflow-y:scroll"></ul>
        <div class="errorTip" style="text-align: center;margin-top: 31vh;color: #3b99fc;"></div>
        <div class="bigPic" style="display: none;position: absolute;top: 0px;bottom: 0px;height: 100%;width: auto;background: rgb(47,47,51);margin: 0px;width: 100%;">
          <p class="pic_container" style="position: relative;display: flex;flex-direction: column;justify-content: center;width: 100%;height: 100%;margin: 0px;overflow:hidden;">
            <img src="" alt="" srcset="" id="bigImg" style="width: 100%;">
          </p>
        </div>
      </div>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(that.parentObj, ".dximage_list_container");
    };

    that.injectComponentEvents = function () {
      const dom = that._dom;
      const bigImg = domUtils.find(that.parentObj, "#bigImg")[0];

      let originLast, maxSwipeLeft, maxSwipeRight, maxSwipeTop, maxSwipeBottom;
      let preTouchPosition = {};
      let translateY = 0;
      let translateX = 0;
      let scaleRatio = 1;
      let preTouchesClientx1y1x2y2 = [];
      let originHaveSet = true;
      let scaleOrigin = {};
      let imgWidth = 0;
      let imgHeight = 0;

      function getStyle(target, style) {
        const styles = window.getComputedStyle(target, null);
        return styles.getPropertyValue(style);
      }

      function getTranslate(target) {
        const matrix = getStyle(target, "transform");
        const nums = matrix.substring(7, matrix.length - 1).split(", ");
        return {
          left: parseInt(nums[4]) || 0,
          top: parseInt(nums[5]) || 0,
        };
      }

      function resetTransform() {
        preTouchPosition = {};
        scaleRatio = 1;
        scaleOrigin = {};
        translateY = 0;
        translateX = 0;
        preTouchesClientx1y1x2y2 = [];
        bigImg.style.transform = "matrix(1,0,0,1,0,0)";
      }

      function recordPreTouchPosition(touch) {
        preTouchPosition = {
          x: touch.clientX,
          y: touch.clientY,
        };
      }

      function setStyle(key, value) {
        bigImg.style[key] = value;
      }

      function distance(x1, y1, x2, y2) {
        const a = x1 - x2;
        const b = y1 - y2;
        return Math.sqrt(a * a + b * b);
      }

      function relativeCoordinate(x, y, rect) {
        return {
          x: (x - rect.left) / scaleRatio,
          y: (y - rect.top) / scaleRatio,
        };
      }

      function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
      }

      dom.on("tap", ".shedule_pic img", function (e) {
        const url = $(this).attr("src");
        domUtils.find(that.parentObj, ".bigPic img").attr("src", url);
        domUtils.find(that.parentObj, ".bigPic").show();
        imgWidth = parseInt(window.getComputedStyle(this).width);
        imgHeight = parseInt(window.getComputedStyle(this).height);
        resetTransform();
      });

      dom.on("tap", ".bigPic", function (e) {
        $(this).hide();
      });

      bigImg.addEventListener("touchmove", function (e) {
        const touches = e.touches;

        if (touches.length > 1) {
          const one = touches[0];
          const two = touches[1];

          const newScale =
            distance(one.clientX, one.clientY, two.clientX, two.clientY) /
            distance(preTouchesClientx1y1x2y2[0], preTouchesClientx1y1x2y2[1], preTouchesClientx1y1x2y2[2], preTouchesClientx1y1x2y2[3]);
          const tc = clamp(scaleRatio * newScale, 0.5, 3);
          scaleRatio = tc;

          if (!originHaveSet) {
            originHaveSet = true;
            const origin = relativeCoordinate((one.clientX + two.clientX) / 2, (one.clientY + two.clientY) / 2, bigImg.getBoundingClientRect());
            if (scaleOrigin.x == undefined) {
              scaleOrigin = origin;
            }
            translateX = (scaleRatio - 1) * (origin.x - scaleOrigin.x) + translateX;
            translateY = (scaleRatio - 1) * (origin.y - scaleOrigin.y) + translateY;
            bigImg.style.transformOrigin = `${origin.x}px ${origin.y}px`;
            scaleOrigin = origin;
          }

          const matrix = `matrix(${scaleRatio}, 0, 0, ${scaleRatio}, ${translateX}, ${translateY})`;
          setStyle("transform", matrix);
          preTouchesClientx1y1x2y2 = [one.clientX, one.clientY, two.clientX, two.clientY];
        } else {
          const touch = e.touches[0];
          const translated = getTranslate(touch.target);
          const moveX = ~~(touch.clientX - preTouchPosition.x);
          const moveY = ~~(touch.clientY - preTouchPosition.y);

          if (!maxSwipeLeft || !maxSwipeRight || !maxSwipeTop || !maxSwipeBottom) return;

          if (moveX > 0 && maxSwipeLeft < translateX) return;
          if (moveX < 0 && maxSwipeRight < -translateX) return;
          if (moveY > 0 && maxSwipeTop < translateY) return;
          if (moveY < 0 && maxSwipeBottom < -translateY) return;

          const tempTransX = translated.left + moveX;
          const tempTransY = translated.top + moveY;

          if (moveX >= 0) {
            translateX = maxSwipeLeft < tempTransX ? maxSwipeLeft : tempTransX;
          } else {
            translateX = maxSwipeRight < -tempTransX ? -maxSwipeRight : tempTransX;
          }

          if (moveY >= 0) {
            translateY = maxSwipeTop < tempTransY ? maxSwipeTop : tempTransY;
          } else {
            translateY = maxSwipeBottom < -tempTransY ? -maxSwipeBottom : tempTransY;
          }

          recordPreTouchPosition(touch);
          const matrix = `matrix(${scaleRatio}, 0, 0, ${scaleRatio}, ${translateX}, ${translateY})`;
          setStyle("transform", matrix);
        }
      });

      bigImg.addEventListener("touchstart", function (e) {
        const touches = e.touches;
        if (touches.length > 1) {
          const one = touches[0];
          const two = touches[1];
          originLast = [(one.clientX + two.clientX) * 0.5, (one.clientY + two.clientY) * 0.5];
          originHaveSet = false;
          preTouchesClientx1y1x2y2 = [one.clientX, one.clientY, two.clientX, two.clientY];
        }
        recordPreTouchPosition(touches[0]);
      });

      bigImg.addEventListener("touchend", function (e) {
        const touches = e.touches;
        if (touches.length == 0) {
          return;
        }
        if (touches.length == 1 || !originLast) {
          recordPreTouchPosition(touches[0]);
        } else {
          const verticalMargin = (window.innerHeight - imgHeight) * 0.5;
          maxSwipeLeft = Math.abs(scaleRatio - 1) * originLast[0];
          maxSwipeRight = Math.abs(scaleRatio - 1) * (imgWidth - originLast[0]);
          maxSwipeTop = Math.abs(scaleRatio - 1) * (originLast[1] - verticalMargin);
          maxSwipeBottom = Math.abs(scaleRatio - 1) * (imgHeight - (originLast[1] - verticalMargin));
        }
      });
    };

    that.setBrowseState = function () {
      domUtils.find(that.parentObj, ".bigPic").hide();
      const imgContainer = domUtils.find(that.parentObj, ".picList");
      imgContainer.scrollTop(0);
    };

    that.setImgList = function (picUrls, errorTip) {
      const imgContainer = domUtils.find(that.parentObj, ".picList");
      if (picUrls.length > 0) {
        const html = picUrls
          .map((picurl) => `<li class='shedule_pic' style='margin:12px'><img src='${picurl}' style='width:100%;height:auto;'/></li>`)
          .join("");
        imgContainer.html(html);
        imgContainer.show().siblings(".errorTip").hide();
      } else {
        imgContainer
          .hide()
          .siblings(".errorTip")
          .show()
          .text(errorTip || "资源请求失败");
      }
      that.show();
    };

    that.show = function () {
      domUtils.show(that._dom, true);
    };

    that.hide = function () {
      domUtils.show(that._dom, false);
    };

    return that;
  };
  daxiapp.DXImageGalleryComponent = daxiapp.DXImageListComponent = DXImageGalleryComponent;

  var DXIframeComponent = function (app, parentObject, options) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.isShow = false;
    that._id = options.id || `ifr_${new Date().getTime()}`;
    that._link = options.link || "";
    that._msgList = options.msgList || {};
    that.commandList = [];

    if (!that._msgList.show) {
      that._msgList.show = function (data) {
        that.isShow = data.isShow;
        domUtils.show(that._dom, data.isShow);
      };
    }

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function () {
      const dom = `<div class="dx_frame_container iframe_page" id="${that._id}" style="">
        <div class="main_content" style="position: relative;flex-grow: 1;">
          <iframe src="${that._link}" allow="camera; microphone" class="iframe_dom" style="width:100%;height:100%;border: 0px;margin: 0px;padding: 0px;"></iframe>
        </div>
        ${!options.noCloseIcon ? '<span class="close_btn icon-guanbi" style="position: absolute;right: 10px;top: 10px;" ></span>' : ""}
        ${options.showBack ? '<span class="close_btn circle-backbtn" style="position: absolute;left: 10px;top: 10px;" ></span>' : ""}
      </div>`;
      domUtils.append(that.parentObj, dom);
      that._dom = domUtils.find(parentObject, `#${that._id}`);

      const styleObj = {
        position: "absolute",
        top: "0px",
        right: "0px",
        width: "100%",
        height: "auto",
        "z-index": 10,
        "font-size": "1.6rem",
        color: "#fff",
        "box-sizing": "border-box",
      };

      if (options.style) {
        Object.assign(styleObj, options.style);
      }

      domUtils.css(that._dom, styleObj);
      that._iframe = domUtils.find(that._dom, ".iframe_dom")[0];

      if (that._link) {
        that.initCrossDomainBridge();
      }
    };

    that.injectComponentEvents = function () {
      domUtils.on(this._dom, "click", ".close_btn", function () {
        that.hide();
      });
    };

    that.setStyle = function (styleObj) {
      domUtils.css(that._dom, styleObj);
    };

    that.initCrossDomainBridge = function () {
      const ifw = that._iframe.contentWindow;
      that.cross = daxiapp.createCrossDomainBridge(window);
      that.cross.init(ifw, that._link);
      this.cross.on("pageLoaded", that.onPageLoaded);

      if (that._msgList) {
        for (const key in that._msgList) {
          if (typeof that._msgList[key] == "function") {
            that.cross.on(key, that._msgList[key]);
          }
        }
      }
    };

    that.onPageLoaded = function (data) {
      that.framePageLoaded = true;
      if (that.commandList) {
        that.commandList.forEach(function (command) {
          that.cross.call(command.method, command.data);
        });
      }
    };

    that.setFrameUrl = function (url) {
      if (that._link == url) {
        return;
      }
      that._link = url;
      that._iframe.setAttribute("src", url);
      that.initCrossDomainBridge();
    };

    that.postMessage = function (method, data) {
      if (!that.framePageLoaded) {
        that.commandList.push({ method, data });
      } else {
        that.cross.call(method, data);
      }
    };

    that.destoryEvent = function () {
      that.cross.destory();
    };

    that.show = function () {
      domUtils.show(that._dom, true);
      that.postMessage("show", { isShow: true });
    };

    that.hide = function () {
      domUtils.show(that._dom, false);
      that.postMessage("show", { isShow: false });
    };

    return that;
  };
  daxiapp.DXIframeComponent = DXIframeComponent;

  /** 热词/下拉列表面板视图 */
  const DXHotWordListPanelView = function (app, parentObject) {
    const that = this;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.updateData = function (list) {
      if (!list) return;

      const listHbs = `
        <div class="list_wrapper">
          {{#each list}}
          <div class="item" data-name="{{name}}" data-bdid="{{bdid}}" data-floorid="{{floorId}}" data-lon={{lon}} data-lat={{lat}}>
            <p class="btn_item icon-mypos">
              <span class="item_name" style="padding-left: 4px;display: inline-block;line-height: 2;">{{name}}</span>
              {{#if children}}
              <ul class="">
                {{#each children}}
                <li class="sub_item" data-name="{{name}}" data-bdid="{{bdid}}" data-floorid="{{floorId}}" data-lon={{lon}} data-lat={{lat}}>{{name}}</li>
                {{/each}}
              </ul>
              {{/if}}
            </p>
          </div>
          {{/each}}
        </div>`;
      domUtils.templateText(listHbs, { list }, that._dom);
    };

    that.injectComponentUI = function (wrapperdom) {
      wrapperdom = wrapperdom || '<div class="poi-item-widget ui-panel"></div>';
      domUtils.append(that.parentObj, wrapperdom);
      that._dom = domUtils.find(that.parentObj, ".poi-item-widget");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".sub_item", function (e) {
        if (domUtils.isFastClick()) return;

        const $poiItem = $(this);
        const poiInfo = {
          poiId: $poiItem.data("poi") + "",
          bdid: $poiItem.data("bdid") || "",
          floorId: $poiItem.data("floorid") + "",
          lon: $poiItem.data("lon"),
          lat: $poiItem.data("lat"),
          name: $poiItem.data("name"),
          address: $poiItem.data("address"),
        };
        that.listener?.onListItemClicked?.(that, poiInfo);
      });
    };

    return that;
  };
  daxiapp.DXHotWordListPanelView = daxiapp.DXComboxListPanelView = DXHotWordListPanelView;

  /** 换乘路线规划视图 */
  const DXTransferRoutePlannerView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;

    const wrapperStr = '<div class="TransferRoute-container"></div>';

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      wrapperdom = wrapperdom || wrapperStr;
      domUtils.append(that.parentObj, wrapperdom);
      that._dom = that.parentObj.find(".TransferRoute-container");
    };

    that.injectComponentEvents = function () {
      // 路线规划按钮
      domUtils.on(that._dom, "click", ".btn-primary", function (e) {
        if (domUtils.isFastClick()) return;

        const firstStationInfo = {
          station: that.station,
          trainNum: that.trainNum,
          carriage: that.carriage,
        };
        const changeStationInfo = {
          station: that.station2,
          trainNum: that.trainNum2,
          carriage: that.carriage2,
        };
        that.listener?.routePlan?.({ firstStationInfo, changeStationInfo });
      });

      // 导航按钮
      domUtils.on(that._dom, "click", ".nav-btn", function (e) {
        if (domUtils.isFastClick()) return;
        const index = $(this).index();
        that.listener?.onGoToNavi?.(index);
      });

      // 遮罩层点击关闭
      domUtils.on(that._dom, "click", ".nav-mask", function (e) {
        if (domUtils.isFastClick()) return;
        const $mask = $(".nav-mask");
        const $dialog = $(".nav-dialog");
        if (e.target == $mask[0]) {
          $mask.removeClass("active");
          $dialog.removeClass("active");
        }
      });

      // 关闭按钮
      domUtils.on(that._dom, "click", ".dialog-close", function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(".nav-mask").removeClass("active");
        $(".nav-dialog").removeClass("active");
      });

      // 站点选择
      domUtils.on(that._dom, "change", "#selectStation", function (e) {
        if (domUtils.isFastClick()) return;
        const value = $(this).val();
        that.station = value;
        that.listener?.onchangeStation?.(that, value);
      });

      // 车次输入
      domUtils.on(that._dom, "input", "#inputTrainNumber", function (e) {
        const value = $(this).val();
        that.trainNum = value;
        that.listener?.onchangeTrainNum?.(that.station, value);
      });

      domUtils.on(that._dom, "input", "#inputTrainNumber2", function (e) {
        const value = $(this).val();
        that.trainNum2 = value;
        that.listener?.onchangeTrainNum2?.(that.station, value);
      });

      // 车厢选择
      domUtils.on(that._dom, "change", "#selectCarriage", function (e) {
        if (domUtils.isFastClick()) return;
        const value = $(this).val();
        that.carriage = value;
        that.listener?.onchangeCarriage?.(that, value);
      });

      domUtils.on(that._dom, "change", "#selectCarriage2", function (e) {
        if (domUtils.isFastClick()) return;
        const value = $(this).val();
        that.carriage2 = value;
        that.listener?.onchangeCarriage2?.(that, value);
      });

      // 重置按钮
      domUtils.on(that._dom, "click", ".btn-reset", function (e) {
        if (domUtils.isFastClick()) return;
        that.carriage = "";
        that.trainNum = "";
        that.station = "";
        that.listener?.onReset?.(that);
      });
    };

    that.showNotice = function (text) {
      const noticeDom = that._dom.find(".header-banner");
      noticeDom.show();
      noticeDom.find(".notice-text").text(text);
    };

    that.hideNotice = function () {
      that._dom.find(".header-banner").hide();
    };

    that.updateData = function (data) {
      const htmlTemp = `
        <div class="planning-container">
          <div class="planning-header">第一程</div>
          <div class="planning-form">
            <div class="form-item">
              <label class="form-iab">到达车次</label>
              <div class="form-inp-box">
                <input class="form-inp form-inp2" id="inputTrainNumber">
              </div>
            </div>
            <div class="form-item">
              <label class="form-iab">车厢</label>
              <div class="form-inp-box">
                <select id="selectCarriage"></select>
              </div>
            </div>
            <div class="form-item">
              <label class="form-iab">到达车站</label>
              <div class="form-inp-box">
                <select id="selectStation">
                  {{#each data}}
                  <option value="{{stationName}}">{{stationName}}</option>
                  {{/each}}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="planning-container">
          <div class="planning-header">第二程</div>
          <div class="planning-form">
            <div class="form-item">
              <label class="form-iab">换乘车次</label>
              <input class="form-inp" value="D1603" id="inputTrainNumber2">
            </div>
            <div class="form-item">
              <label class="form-iab">车厢</label>
              <div class="form-inp-box">
                <select id="selectCarriage2"></select>
              </div>
            </div>
            <div class="form-item">
              <label class="form-iab">换乘车站</label>
              <div class="form-inp-box">
                <select id="selectStation2">
                  {{#each data}}
                  <option value="{{stationName}}">{{stationName}}</option>
                  {{/each}}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="header-banner" style="display: none">
          <div class="header-icon">!</div>
          <div class="notice-text">输入的车次信息不在换乘路线内</div>
        </div>
        <div class="action-buttons clearFixed">
          <div class="btn-reset action-buttons-btn">重置</div>
          <div class="btn-primary action-buttons-btn" data-departure="{{data.departureStation}}" data-arrival="{{data.arrivalStation}}" data-train="{{data.trainNumber}}">路线规划</div>
        </div>
        <div class="nav-mask">
          <div class="nav-dialog">
            <div class="dialog-close">
              <img class="dialog-close-img" src="../common_imgs/shijiazhuang/close.png" alt="" />
            </div>
            <div class="dialog-header">您希望导航去</div>
            <div class="nav-buttons">
              <div class="nav-btn">检票口</div>
              <div class="nav-btn">车厢</div>
            </div>
          </div>
        </div>`;

      domUtils.templateText(htmlTemp, { data }, that._dom);
    };

    that.setTrain = function (station, data) {
      const dom = that._dom.find("#selectTrainNumber");
      const html = data.map((item) => `<option value="${item.trainNum}">${item.trainNum}</option>`).join("");
      dom.empty().append($(html));
      that.listener?.onchangeTrainNum?.(station, data[0].trainNum);
      that.trainNum = data[0].trainNum;
    };

    that.setCarriage = function (carriageArr) {
      const dom = that._dom.find("#selectCarriage");
      const html = carriageArr.map((item) => `<option value="${item}">${item}</option>`).join("");
      dom.empty().append($(html));
      that.carriage = carriageArr[0];
    };

    that.setCarriage2 = function (carriageArr2) {
      const dom = that._dom.find("#selectCarriage2");
      const html = carriageArr2.map((item) => `<option value="${item}">${item}</option>`).join("");
      dom.empty().append($(html));
      that.carriage2 = carriageArr2[0];
    };

    that.setTrainInfo = function (obj) {
      that.station = obj.station;
      that.trainNum = obj.trainNum;
      that.carriage = obj.carriage;
      document.querySelector(`#selectStation option[value='${obj.station}']`).selected = true;
      that._dom.find("#inputTrainNumber").val(obj.trainNum);
      that.listener?.onchangeTrainNum?.(obj.station, obj.trainNum);
      document.querySelector(`#selectCarriage option[value='${obj.carriage}']`).selected = true;
    };

    that.setTrainInfo2 = function (obj) {
      that.station2 = obj.station;
      that.trainNum2 = obj.trainNum;
      that.carriage2 = obj.carriage;
      document.querySelector(`#selectStation2 option[value='${obj.station}']`).selected = true;
      that._dom.find("#inputTrainNumber2").val(obj.trainNum);
      that.listener?.onchangeTrainNum2?.(obj.station, obj.trainNum);
      document.querySelector(`#selectCarriage2 option[value='${obj.carriage}']`).selected = true;
    };

    return that;
  };
  daxiapp.DXTransferRoutePlannerView = daxiapp.DXTransferRouteComponent = DXTransferRoutePlannerView;

  /** 车站服务搜索视图 */
  const DXStationServiceSearchView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;

    const wrapperStr = '<div class="service-container"></div>';

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      wrapperdom = wrapperdom || wrapperStr;
      domUtils.append(that.parentObj, wrapperdom);
      that._dom = that.parentObj.find(".service-container");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".service-item", function (e) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        that.listener?.onClickItem?.({
          name: $this.attr("data-name"),
          keyword: $this.attr("data-keyword"),
          result: $this.attr("data-result"),
        });
      });

      domUtils.on(that._dom, "click", ".service-back", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onClose?.();
      });

      domUtils.on(that._dom, "click", ".service-search-input", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onClickInput?.();
      });
    };

    /** 生成单个服务项 HTML */
    function buildServiceItemHtml(item) {
      const name = item.name || "";
      const keyword = item.keyword || "";
      const result = item.result || "";
      return `
        <div class="service-item" data-name="${name}" data-keyword="${keyword}" data-result="${result}">
          <img src="${item.src}" class="service-icon" />
          <span class="service-name">${name}</span>
        </div>`;
    }

    /** 生成服务分组 HTML */
    function buildServiceGroupHtml(group) {
      const itemsHtml = group.items.map(buildServiceItemHtml).join("");
      return `
        <div class="service-items">
          <div class="service-item-title">${group.title}</div>
          <div class="service-item-content">${itemsHtml}</div>
        </div>`;
    }

    that.updateData = function (data) {
      const serviceListHtml = data.map(buildServiceGroupHtml).join("");
      const htmlTemp = `
        <div class="service-search">
          <div class="service-back"><i class="icon-fanhui"></i></div>
          <div class="service-con">
            <i class="search_icon audio_btn icon-search2"></i>
            <input type="text" placeholder="请输入服务名称" class="service-search-input" />
          </div>
        </div>
        <div class="service-list">${serviceListHtml}</div>`;
      domUtils.templateText(htmlTemp, { data }, that._dom);
    };

    return that;
  };
  daxiapp.DXStationServiceSearchView = daxiapp.DXStationServicesComponent = DXStationServiceSearchView;

  /** 路线详情步骤视图 */
  const DXRouteStepsDetailView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;

    const wrapperStr = '<div class="routeDetail-container"></div>';

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      wrapperdom = wrapperdom || wrapperStr;
      domUtils.append(that.parentObj, wrapperdom);
      that._dom = that.parentObj.find(".routeDetail-container");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", ".step", function (e) {
        if (domUtils.isFastClick()) return;
        const name = $(this).attr("data-name");
        that.listener?.onStepClicked?.(name);
      });
    };

    /** 生成单个步骤 HTML */
    function buildStepHtml(step, isPast) {
      let iconContent = "";
      let iconClass = "step-icon";
      let stepClass = isPast ? "step past-step" : "step";

      if (step.iconType == "current") {
        iconClass += " current-icon";
        iconContent = '<i class="icomoon icon-walk"></i>';
      } else if (step.iconType == "start") {
        iconContent = "起";
      } else if (step.iconType == "end") {
        iconContent = "终";
      }

      return `
        <div class="${stepClass}">
          <div class="step-icons">
            <div class="${iconClass}">${iconContent}</div>
          </div>
          <div class="step-content">
            <div class="step-distance">${step.distance}</div>
            <div class="step-action">${step.action}</div>
          </div>
        </div>`;
    }

    that.updateData = function (data) {
      let hasMetCurrent = false;
      const stepsHtml = data
        .map((step) => {
          const isPast = !hasMetCurrent && step.iconType != "current";
          if (step.iconType == "current") hasMetCurrent = true;
          return buildStepHtml(step, isPast);
        })
        .join("");

      const htmlTemp = `<div class="route-steps">${stepsHtml}</div>`;
      domUtils.templateText(htmlTemp, { data }, that._dom);
    };

    return that;
  };
  daxiapp.DXRouteStepsDetailView = daxiapp.DXRouteDetailsComponent = DXRouteStepsDetailView;

  /** 车票信息与路线规划视图 */
  const DXTicketRoutePlannerView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;

    const wrapperStr = '<div class="ticketInfo-container"></div>';

    /** 显示/隐藏导航对话框 */
    function setNavDialogVisible(visible) {
      const $mask = $(".nav-mask");
      const $dialog = $(".nav-dialog");
      if (visible) {
        $mask.addClass("active");
        $dialog.addClass("active");
      } else {
        $mask.removeClass("active");
        $dialog.removeClass("active");
      }
    }

    /** 获取当前表单信息 */
    function getFormInfo(naviType) {
      const info = {
        station: that.station,
        trainNum: that.trainNum,
        carriage: that.carriage,
      };
      if (naviType !== undefined) info.naviType = naviType;
      return info;
    }

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      wrapperdom = wrapperdom || wrapperStr;
      domUtils.append(that.parentObj, wrapperdom);
      that._dom = that.parentObj.find(".ticketInfo-container");
    };

    that.injectComponentEvents = function () {
      // 路线规划按钮
      domUtils.on(that._dom, "click", ".btn-primary", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.routePlan?.(getFormInfo(), () => setNavDialogVisible(true));
      });

      // 导航按钮
      domUtils.on(that._dom, "click", ".nav-btn", function (e) {
        if (domUtils.isFastClick()) return;
        const index = $(this).index();
        that.listener?.onGoToNavi?.(getFormInfo(index));
      });

      // 遮罩层点击关闭
      domUtils.on(that._dom, "click", ".nav-mask", function (e) {
        if (domUtils.isFastClick()) return;
        if (e.target == $(".nav-mask")[0]) {
          setNavDialogVisible(false);
        }
      });

      // 关闭按钮
      domUtils.on(that._dom, "click", ".dialog-close", function (e) {
        e.preventDefault();
        e.stopPropagation();
        setNavDialogVisible(false);
      });

      // 站点选择
      domUtils.on(that._dom, "change", "#selectStation", function (e) {
        if (domUtils.isFastClick()) return;
        const value = $(this).val();
        that.station = value;
        that.listener?.onchangeStation?.(that, value);
      });

      // 车次选择
      domUtils.on(that._dom, "change", "#selectTrainNumber", function (e) {
        if (domUtils.isFastClick()) return;
        const value = $(this).val();
        that.trainNum = value;
        that.listener?.onchangeTrainNum?.(that.station, value);
      });

      // 车次输入
      domUtils.on(that._dom, "input", "#inputTrainNumber", function (e) {
        const value = $(this).val();
        that.trainNum = value;
        that.listener?.onchangeTrainNum?.(that.station, value, "inputEvent");
      });

      // 车厢选择
      domUtils.on(that._dom, "change", "#selectCarriage", function (e) {
        if (domUtils.isFastClick()) return;
        const value = $(this).val();
        that.carriage = value;
        that.listener?.onchangeCarriage?.(that, value);
      });

      // 重置按钮
      domUtils.on(that._dom, "click", ".btn-reset", function (e) {
        if (domUtils.isFastClick()) return;
        that.carriage = "";
        that.trainNum = "";
        that.station = "";
        that.listener?.onReset?.(that);
      });
    };

    that.updateData = function (data) {
      const htmlTemp = `
        <div class="header-banner">
          <div class="header-icon">!</div>
          <div class="notice-text">请凭本人车票或相关证件进入车站</div>
        </div>
        <div class="ticket-img-container">
          <div class="ticket-img"></div>
          <div class="ticket-info"></div>
        </div>
        <div class="ticket-card-container">
          <div class="card-img"></div>
          <div class="card-title">近期出行车票</div>
          <div class="swiper">
            <div class="swiper-wrapper">
              <div class="swiper-slide">
                <div class="ticket-card" data-station="石家庄" data-trainnum="G91" data-carriage="1">
                  <div class="time-row">
                    <span class="station">石家庄</span>
                    <span class="time">08:58出发</span>
                  </div>
                  <div class="station-row">
                    <span class="train-no">G91</span>
                    <img class="train-img" src="../common_imgs/shijiazhuang/Vector_63.png">
                    <span class="seat">1车10D</span>
                  </div>
                  <div class="time-row">
                    <span class="station">兰州西</span>
                    <span class="time">15:51到达</span>
                  </div>
                </div>
                <div class="ticket-card-time"><span>开车时间:2025-10-08</span></div>
              </div>
              <div class="swiper-slide">
                <div class="ticket-card" data-station="石家庄" data-trainnum="G93" data-carriage="1">
                  <div class="time-row">
                    <span class="station">石家庄</span>
                    <span class="time">10:01出发</span>
                  </div>
                  <div class="station-row">
                    <span class="train-no">G93</span>
                    <img class="train-img" src="../common_imgs/shijiazhuang/Vector_63.png">
                    <span class="seat">1车13A</span>
                  </div>
                  <div class="time-row">
                    <span class="station">南宁东</span>
                    <span class="time">17:10到达</span>
                  </div>
                </div>
                <div class="ticket-card-time"><span>开车时间:2025-10-09</span></div>
              </div>
            </div>
            <div class="swiper-pagination swiper-pag"></div>
          </div>
        </div>
        <div class="planning-form">
          <div class="form-item">
            <label class="form-iab">车站</label>
            <select id="selectStation">
              {{#each data}}
              <option value="{{stationName}}">{{stationName}}</option>
              {{/each}}
            </select>
          </div>
          <div class="form-item">
            <label class="form-iab">车次</label>
            <input class="form-inp" id="inputTrainNumber">
            <div class="inputResult"></div>
          </div>
          <div class="form-item">
            <label class="form-iab">车厢</label>
            <select id="selectCarriage"></select>
          </div>
          <div class="action-buttons clearFixed">
            <div class="btn-reset action-buttons-btn">重置</div>
            <div class="btn-primary action-buttons-btn" data-departure="{{data.departureStation}}" data-arrival="{{data.arrivalStation}}" data-train="{{data.trainNumber}}">路线规划</div>
          </div>
          <div class="nav-mask">
            <div class="nav-dialog">
              <div class="dialog-close">
                <img class="dialog-close-img" src="../common_imgs/shijiazhuang/close.png" alt="" />
              </div>
              <div class="dialog-header">您希望导航去</div>
              <div class="nav-buttons">
                <div class="nav-btn">检票口</div>
                <div class="nav-btn">车厢</div>
              </div>
            </div>
          </div>
        </div>`;

      domUtils.templateText(htmlTemp, { data }, that._dom);

      const mySwiper = new Swiper({
        el: this._dom.find(".swiper"),
        pagination: { el: ".swiper-pagination" },
        on: {
          slideChangeTransitionEnd: function () {
            const index = mySwiper.slides[mySwiper.activeIndex];
            that.listener?.slideChangeTransitionEnd?.(index);
          },
        },
      });
    };

    that.setTrain = function (station, data) {
      const dom = that._dom.find("#selectTrainNumber");
      const html = data.map((item) => `<option value="${item.trainNum}">${item.trainNum}</option>`).join("");
      dom.empty().append($(html));
      that.listener?.onchangeTrainNum?.(station, data[0].trainNum);
    };

    that.setCarriage = function (carriageArr) {
      const dom = that._dom.find("#selectCarriage");
      const html = carriageArr.map((item) => `<option value="${item}">${item}</option>`).join("");
      dom.empty().append($(html));
      that.carriage = carriageArr[0];
    };

    that.setTrainInfo = function (obj) {
      that.station = obj.station;
      that.trainNum = obj.trainNum;
      that.carriage = obj.carriage;
      document.querySelector(`#selectStation option[value='${obj.station}']`).selected = true;
      that._dom.find("#inputTrainNumber").val(obj.trainNum);
      that.listener?.onchangeTrainNum?.(obj.station, obj.trainNum);
      document.querySelector(`#selectCarriage option[value='${obj.carriage}']`).selected = true;
    };

    that.triggerSlideChangeTransitionEnd = function (dom) {
      that.listener?.slideChangeTransitionEnd?.(dom);
    };

    that.setResult = function (arr) {
      const html = arr.map((trainNum) => `<div>${trainNum}</div>`).join("");
      const inputResultDom = that._dom.find(".inputResult");
      inputResultDom.show().append($(html));
    };

    return that;
  };
  daxiapp.DXTicketRoutePlannerView = daxiapp.DXTicketInfoComponent = DXTicketRoutePlannerView;

  /** 滑块开关组件 */
  const DXToggleSwitchView = function (options, parentObject) {
    const that = this;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.options = options;

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.updateData = function (list) {};

    that.injectComponentUI = function () {
      that.actived = !!options.active;
      const activeClass = options.active ? "active" : "";
      const wrapperDom = domUtils.geneDom(
        `<div class="dxcomponent slider_wrapper"><span class="slider ${activeClass}"><span class="dxcircle inside"></span></div>`,
      );

      if (options.desc) {
        wrapperDom.append(`<span class="text">${options.desc}</span>`);
      }

      that._dom = wrapperDom;
      if (that.parentObj) {
        domUtils.append(that.parentObj, wrapperDom);
      }
      that.slider = domUtils.find(that._dom, ".slider");
    };

    that.injectComponentEvents = function () {
      domUtils.on(that._dom, "click", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onClicked?.(that, { active: that.actived });
      });
    };

    that.switchStatus = function () {
      that.actived = !that.actived;

      if (options.disabledStateChange) {
        that.listener?.onStatusSwitched?.(that, { active: that.actived });
        return;
      }

      if (that.actived) {
        that.slider.addClass("active");
      } else {
        that.slider.removeClass("active");
      }
      that.listener?.onStatusSwitched?.(that, { active: that.actived });
    };

    that.updateDesc = function (txt) {
      domUtils.text(this._dom, ".slider", txt);
    };

    that.setStyle = function (styleObj) {
      that._dom.css(styleObj);
    };

    that.addClassName = function (className) {
      that._dom.addClass(className);
    };

    that.show = function () {
      that._dom.show();
    };

    that.hide = function () {
      that._dom.hide();
    };

    return that;
  };
  daxiapp.DXToggleSwitchView = daxiapp.DXSliderTapPanelView = DXToggleSwitchView;

  /** 语音识别搜索组件 - V2 */
  const DXVoiceSearchView2 = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;
    that.isFirst = true;

    const wrapperStr = '<section class="voice-container"></section>';
    const langData = window.langData || {};

    /** 处理语音识别结果 */
    function handleTranslateResult(res, textDom) {
      if (res.errMsg == "translateVoice:ok") {
        textDom.text(res.translateResult);
        const keyword = res.translateResult.replace(/(，)|(。)|( )/g, "");
        setTimeout(() => {
          that.listener?.onSearchSuccess?.(that, { keyword });
        }, 30);
      }
    }

    /** 处理语音识别失败 */
    function handleTranslateFail(e, res, textDom) {
      console.log(e.errMsg + JSON.stringify(res));
      textDom.text("我没有理解您说的话,请再说一遍");
    }

    /** 执行语音翻译 */
    function translateVoice(localId, textDom) {
      if (!localId) {
        textDom.text(langData.stopError || "结束失败...");
        return;
      }
      textDom.text(langData.identifying || "识别中...");

      window.wx?.translateVoice?.({
        localId,
        isShowProgressTips: 1,
        success: (res) => handleTranslateResult(res, textDom),
        fail: (e) => handleTranslateFail(e, { localId }, textDom),
      });
    }

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      wrapperdom = wrapperdom || wrapperStr;
      domUtils.append(that.parentObj, wrapperdom);
      that._dom = that.parentObj.find(".voice-container");
    };

    that.injectComponentEvents = function () {
      // 开始录音
      that.parentObj.on("touchstart", ".btn_voice", function (e) {
        if (domUtils.isFastClick()) return;

        window.navigator?.vibrate?.(500);
        $(".btn_tip").css("visibility", "hidden");
        $("#play_actions").show();
        $(".talkend").hide();
        $(".talking").show();

        if (!voice.inited) {
          voice.init({
            bgcolor: "#32b2fd",
            boxShadow: "0 10px 15px #e9f6fc",
            width: "100",
            height: "100",
            bottom: "20",
            vioceWidth: "95%",
          });
          voice.setSpeak(60);
        }
        voice.startSpeakAnimation();

        let isFirst = true;
        window.wx?.startRecord?.({
          success: () => {},
          cancel: () => {
            domUtils.showInfo(langData["reject:record:tip"] || "您已拒绝授权录音,无法语音识别,如需使用需移除本小程序后重新访问");
          },
          fail: (e) => {
            if (e.errMsg == "startRecord:recording") {
              window.wx?.stopRecord?.({});
            } else if (e.errMsg == "startRecord:fail auth deny" || e.errMsg == "startRecord:android permission denied") {
              alert(langData["reject:record:tip"] || "您已拒绝授权录音,无法语音识别,如需使用需移除本小程序后重新访问");
            } else {
              if (isFirst) {
                domUtils.showInfo(langData["unidentified:record"] || "未识别请重试");
                isFirst = false;
              } else if (e.errMsg == "startRecord:fail") {
                domUtils.showInfo(langData["record:handle:tip"] || "请按住说话");
              }
            }
          },
        });

        e.preventDefault();
        e.stopPropagation();
      });

      // 结束录音
      that.parentObj.on("touchend", ".btn_voice", function () {
        if (domUtils.isFastClick()) return;

        $(".talkend").show();
        $(".talking").hide();
        $(".btn_tip").css("visibility", "visible");
        $("#play_actions").hide();
        voice.stopSpeakAnimation();

        const textDom = domUtils.find(that.parentObj, ".text");
        window.wx?.stopRecord?.({
          success: (res) => translateVoice(res.localId, textDom),
          fail: (error) => {
            console.log(error);
            textDom.text("不好意思系统开小差了,请再说一遍");
          },
        });
      });

      // 录音超时处理
      window.wx?.onVoiceRecordEnd?.({
        complete: (res) => {
          const textDom = domUtils.find(that.parentObj, ".text");
          translateVoice(res.localId, textDom);
        },
      });
    };

    that.updateData = function (data, showShare) {
      const waterroom = langData.waterroom || "开水间";
      const toilet = langData.toilet || "卫生间";
      const selfService = langData["self-service:area"] || "自助服务区";
      const recordTip = langData["record:handle:tip"] || "请按住说话";
      const speechTip = langData["speech:recognition:tip1"] || "您可以这样对我说";

      const htmlTemp = `
        <div class="status talkend">
          <div class="tips">
            <span>${speechTip}</span>
            <span>${waterroom}</span>
            <span>${toilet}</span>
            <span>${selfService}</span>
          </div>
        </div>
        <div class="status talking">
          <div class="tips">
            <span>录音中，松开结束</span>
            <span>${waterroom}</span>
            <span>${toilet}</span>
            <span>${selfService}</span>
          </div>
        </div>
        <div class="text"></div>
        <div class="voice play_actions"></div>
        <div class="btnbox">
          <div class="btn_voice"></div>
          <div class="btn_tip">${recordTip}</div>
        </div>`;

      domUtils.templateText(htmlTemp, { poiTypeList: data }, that._dom);
    };

    return that;
  };
  daxiapp.DXVoiceSearchView2 = daxiapp.DXVoiceViewComponent = DXVoiceSearchView2;

  /** 就诊流程列表视图 */
  const DXClinicProcessListView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;

    const wrapperStr = '<div class="clinicProcess-container"></div>';
    const navigateText = window.langData?.["navigate:text"] || "导航";

    /** 从元素获取位置数据 */
    function getLocationData($el) {
      return {
        lon: $el.attr("data-lon"),
        lat: $el.attr("data-lat"),
        name: $el.attr("data-name"),
      };
    }

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      wrapperdom = wrapperdom || wrapperStr;
      domUtils.append(that.parentObj, wrapperdom);
      that._dom = that.parentObj.find(".clinicProcess-container");
    };

    that.injectComponentEvents = function () {
      // 导航去医院
      domUtils.on(that._dom, "click", ".btn_navi", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onGoToHospitalClicked?.(that, getLocationData($(this)));
      });

      // 停车位查看
      domUtils.on(that._dom, "click", ".btn_parking", function (e) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        that.listener?.onGoToParkingClicked?.(that, {
          lon: $this.attr("data-lon"),
          lat: $this.attr("data-lat"),
        });
      });

      // 科室列表
      domUtils.on(that._dom, "click", ".btn_dept", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onOpenDeptClicked?.(that, {});
      });

      // 反向寻车
      domUtils.on(that._dom, "click", ".btn_findcar", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onFindCar?.(that, {});
      });

      // 全流程导诊
      domUtils.on(that._dom, "click", ".btn_white", function (e) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        that.listener?.openDetail?.(that, {
          patientId: $this.attr("data-patientId"),
          clinicDatetime: $this.attr("data-clinicDatetime"),
          clinicLabel: $this.attr("data-clinicLabel"),
          timeDesc: $this.attr("data-timeDesc"),
          serialNo: $this.attr("data-serialNo"),
          deptName: $this.attr("data-deptName"),
        });
      });
    };

    that.updateData = function (data) {
      const htmlTemp = `
        <div class="card userinfoBox">
          <div class="status">已就诊</div>
          <div class="userInfo">
            <span class="name">{{data.patientName}}</span>
            <span class="info">{{data.sex}}</span>
            <span class="info">{{data.age}}岁</span>
          </div>
          <div class="hosname clearFixed">
            <div><i class="icon-positon"></i>{{data.bdname}}</div>
            <div><i class="icon-ID"></i>{{data.patientId}}</div>
          </div>
          <div class="btnlist clearFixed">
            <div class="btn btn_navi" data-lon="{{data.loncenter}}" data-lat="{{data.latcenter}}" data-name="{{data.bdname}}"><i class="icon-navi"></i>${navigateText} 去医院</div>
            <div class="btn btn_parking" data-lon="{{data.loncenter}}" data-lat="{{data.latcenter}}"><i class="icon-parking"></i>停车位查看</div>
            <div class="btn btn_dept"><i class="icon-dept"></i>科室列表</div>
            <div class="btn btn_findcar"><i class="icon-findcar"></i>反向寻车</div>
          </div>
        </div>
        {{#each data.result}}
        <div class="card">
          <div class="cardTitle">就诊提醒</div>
          <div class="cardInfo">
            <div>医院名称：<span>{{../data.bdname}}</span></div>
            <div>科室名称：<span>{{deptName}}</span></div>
            <div>就诊时间：<span>{{clinicDatetime}} {{timeDesc}}</span></div>
          </div>
          <div class="cardBottom">
            <div class="btn_white" data-patientId="{{patientId}}" data-clinicDatetime="{{clinicDatetime}}" data-clinicLabel="{{clinicLabel}}" data-timeDesc="{{timeDesc}}" data-serialNo="{{serialNo}}" data-deptName="{{deptName}}"><i class="icon-edit"></i>全流程导诊</div>
          </div>
        </div>
        {{/each}}`;
      domUtils.templateText(htmlTemp, { data }, that._dom);
    };

    return that;
  };
  daxiapp.DXClinicProcessListView = daxiapp.DXClinicProcessListComponent = DXClinicProcessListView;

  /** 就诊流程详情视图 */
  const DXClinicProcessDetailView = function (app, parentObject) {
    const that = this;
    that._app = app;
    that.parentObj = parentObject;
    that.bdid = "";
    that.isShow = false;

    const wrapperStr = '<div class="clinicProcess-container"></div>';
    const navigateText = window.langData?.["navigate:text"] || "导航";

    /** 从元素获取位置数据 */
    function getLocationData($el) {
      return {
        lon: $el.attr("data-lon"),
        lat: $el.attr("data-lat"),
        name: $el.attr("data-name"),
      };
    }

    that.init = function (listener) {
      that.listener = listener;
      that.injectComponentUI();
      that.injectComponentEvents();
    };

    that.injectComponentUI = function (wrapperdom) {
      wrapperdom = wrapperdom || wrapperStr;
      domUtils.append(that.parentObj, wrapperdom);
      that._dom = that.parentObj.find(".clinicProcess-container");
    };

    that.injectComponentEvents = function () {
      // 关闭按钮
      domUtils.on(that._dom, "click", ".close", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onHospitalViewBackBtnClicked?.(that);
      });

      // 导航去医院
      domUtils.on(that._dom, "click", ".btn_navi", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onGoToHospitalClicked?.(that, getLocationData($(this)));
      });

      // 停车位查看
      domUtils.on(that._dom, "click", ".btn_parking", function (e) {
        if (domUtils.isFastClick()) return;
        const $this = $(this);
        that.listener?.onGoToParkingClicked?.(that, {
          lon: $this.attr("data-lon"),
          lat: $this.attr("data-lat"),
        });
      });

      // 科室列表
      domUtils.on(that._dom, "click", ".btn_dept", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onOpenDeptClicked?.(that, {});
      });

      // 反向寻车
      domUtils.on(that._dom, "click", ".btn_findcar", function (e) {
        if (domUtils.isFastClick()) return;
        that.listener?.onFindCar?.(that, {});
      });

      // 导航去科室
      domUtils.on(that._dom, "click", ".btn_goto", function (e) {
        if (domUtils.isFastClick()) return;
        const deptcode = $(this).attr("data-deptcode");
        that.listener?.openMapByDeptcode?.(that, deptcode);
      });

      // 报到按钮 (预留)
      domUtils.on(that._dom, "click", ".btn_baodao", function (e) {
        if (domUtils.isFastClick()) return;
      });
    };

    that.updateData = function (data) {
      const htmlTemp = `
        <div class="close"><i class="icon-close2"></i></div>
        <div class="card userinfoBox">
          <div class="status">已就诊</div>
          <div class="userInfo">
            <span class="name">{{data.patientName}}</span>
            <span class="info">{{data.sex}}</span>
            <span class="info">{{data.age}}岁</span>
          </div>
          <div class="hosname clearFixed">
            <div><i class="icon-date"></i>{{data.clinicDatetime}}</div>
            <div><i class="icon-department"></i>{{data.deptName}}</div>
            <div><i class="icon-positon"></i>{{data.bdname}}</div>
            <div><i class="icon-ID"></i>{{data.patientId}}</div>
          </div>
          <div class="btnlist clearFixed">
            <div class="btn btn_navi" data-lon="{{data.loncenter}}" data-lat="{{data.latcenter}}" data-name="{{data.bdname}}"><i class="icon-navi"></i>${navigateText} 去医院</div>
            <div class="btn btn_parking" data-lon="{{data.loncenter}}" data-lat="{{data.latcenter}}"><i class="icon-parking"></i>停车位查看</div>
            <div class="btn btn_dept"><i class="icon-dept"></i>科室列表</div>
            <div class="btn btn_findcar"><i class="icon-findcar"></i>反向寻车</div>
          </div>
        </div>
        <ul class="route_items">
          {{#each data.result}}
          <li class="route_segment segment_indoor_walk line_start">
            <div class="start_pos" style="border-color:#2cdc21">
              <span class="station_name">{{step}}</span>
            </div>
            <div class="walk_container" style="border-color:#2cdc21;">
              {{#each child}}
              <div class="walk_info">
                <div class="walk_bg" style="background-color:{{#if flag}}#ebebeb{{else}}#fae0e1{{/if}};">
                  <span class="deptName">{{deptName}}</span>
                  <span>
                    {{#if report}}<span class="btn_baodao" data-deptcode="{{deptCode}}"><i class="icon-report"></i>报到</span>{{/if}}
                    <span class="btn_goto" data-deptcode="{{deptCode}}"><i class="icon-walk"></i>${navigateText}</span>
                  </span>
                </div>
              </div>
              {{/each}}
            </div>
          </li>
          {{/each}}
        </ul>`;
      domUtils.templateText(htmlTemp, { data }, that._dom);
    };

    return that;
  };
  daxiapp.DXClinicProcessDetailView = daxiapp.DXClinicProcessDetailComponent = DXClinicProcessDetailView;
})(window);
