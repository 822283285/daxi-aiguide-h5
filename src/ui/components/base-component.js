/**
 * 基础组件类
 * 所有 UI 组件都应继承此类
 *
 * @class BaseComponent
 */
export class BaseComponent {
  /**
   * 创建组件实例
   * @param {Object} options - 配置选项
   * @param {HTMLElement} [options.container] - 容器元素
   * @param {Object} [options.props] - 组件属性
   * @param {Object} [options.state] - 组件状态
   */
  constructor(options = {}) {
    /** @type {HTMLElement} */
    this.container = options.container || null;

    /** @type {Object} */
    this.props = options.props || {};

    /** @type {Object} */
    this.state = options.state || {};

    /** @type {boolean} */
    this.isMounted = false;

    /** @type {Array} */
    this.eventListeners = [];

    /** @type {string} 组件标识符 */
    this.componentName = "BaseComponent";
  }

  /**
   * 渲染组件
   * @returns {string} HTML 字符串
   */
  render() {
    return "<div></div>";
  }

  /**
   * 挂载组件
   * @param {HTMLElement} container - 容器元素
   */
  mount(container) {
    if (!container) {
      console.error("[Component] Container is required");
      return;
    }

    this.container = container;
    const html = this.render();
    this.container.innerHTML = html;
    this.isMounted = true;

    this.onMount();
    console.log(`[Component] Mounted: ${this.componentName}`);
  }

  /**
   * 组件挂载后调用
   */
  onMount() {
    // 子类可重写
  }

  /**
   * 卸载组件
   */
  unmount() {
    this.onUnmount();

    if (this.container) {
      this.container.innerHTML = "";
    }

    this.removeAllEventListeners();
    this.isMounted = false;

    console.log(`[Component] Unmounted: ${this.componentName}`);
  }

  /**
   * 组件卸载前调用
   */
  onUnmount() {
    // 子类可重写
  }

  /**
   * 更新组件
   * @param {Object} newProps - 新属性
   * @param {Object} newState - 新状态
   */
  update(newProps = {}, newState = {}) {
    this.props = { ...this.props, ...newProps };
    this.state = { ...this.state, ...newState };

    this.onUpdate(newProps, newState);

    if (this.isMounted) {
      this.rerender();
    }
  }

  /**
   * 组件更新时调用
   * @param {Object} newProps - 新属性
   * @param {Object} newState - 新状态
   */
  onUpdate(newProps, newState) {
    // 子类可重写
  }

  /**
   * 重新渲染
   */
  rerender() {
    if (!this.container) return;

    const html = this.render();
    this.container.innerHTML = html;

    this.onRerender();
  }

  /**
   * 重新渲染后调用
   */
  onRerender() {
    // 子类可重写
  }

  /**
   * 查找元素
   * @param {string} selector - 选择器
   * @returns {HTMLElement|null}
   */
  $(selector) {
    if (!this.container) return null;
    return this.container.querySelector(selector);
  }

  /**
   * 查找所有匹配元素
   * @param {string} selector - 选择器
   * @returns {NodeList}
   */
  $$(selector) {
    if (!this.container) return new NodeList();
    return this.container.querySelectorAll(selector);
  }

  /**
   * 添加事件监听器
   * @param {EventTarget} target - 目标元素
   * @param {string} event - 事件类型
   * @param {Function} handler - 处理函数
   */
  addEventListener(target, event, handler) {
    if (!target || !event || !handler) return;

    target.addEventListener(event, handler);
    this.eventListeners.push({ target, event, handler });
  }

  /**
   * 移除所有事件监听器
   */
  removeAllEventListeners() {
    this.eventListeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }

  /**
   * 设置元素 HTML
   * @param {HTMLElement} element - 元素
   * @param {string} html - HTML 字符串
   */
  setHtml(element, html) {
    if (element) {
      element.innerHTML = html;
    }
  }

  /**
   * 显示元素
   * @param {HTMLElement} element - 元素
   */
  show(element) {
    if (element) {
      element.style.display = "";
    }
  }

  /**
   * 隐藏元素
   * @param {HTMLElement} element - 元素
   */
  hide(element) {
    if (element) {
      element.style.display = "none";
    }
  }

  /**
   * 添加 CSS 类
   * @param {HTMLElement} element - 元素
   * @param {string} className - 类名
   */
  addClass(element, className) {
    if (element) {
      element.classList.add(className);
    }
  }

  /**
   * 移除 CSS 类
   * @param {HTMLElement} element - 元素
   * @param {string} className - 类名
   */
  removeClass(element, className) {
    if (element) {
      element.classList.remove(className);
    }
  }

  /**
   * 导出组件状态
   * @returns {Object}
   */
  toJSON() {
    return {
      componentName: this.componentName,
      isMounted: this.isMounted,
      props: this.props,
      state: this.state,
    };
  }
}

/**
 * 创建组件的快捷工厂
 * @param {string} componentName - 组件名称
 * @param {Object} methods - 组件方法
 * @returns {Class} 组件类
 */
export function createComponent(componentName, methods = {}) {
  return class extends BaseComponent {
    constructor(options) {
      super(options);
      this.componentName = componentName;

      if (typeof methods.initialize === "function") {
        methods.initialize.call(this, options);
      }
    }

    render() {
      if (typeof methods.render === "function") {
        return methods.render.call(this);
      }
      return super.render();
    }

    onMount() {
      if (typeof methods.onMount === "function") {
        methods.onMount.call(this);
      }
    }

    onUnmount() {
      if (typeof methods.onUnmount === "function") {
        methods.onUnmount.call(this);
      }
    }

    onUpdate(newProps, newState) {
      if (typeof methods.onUpdate === "function") {
        methods.onUpdate.call(this, newProps, newState);
      }
    }

    onRerender() {
      if (typeof methods.onRerender === "function") {
        methods.onRerender.call(this);
      }
    }
  };
}
