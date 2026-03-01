/**
 * 服务页面控制器
 * 客服、帮助、反馈等服务功能
 */
import { BasePageController } from "@ui/controllers/base-page-controller.js";

/**
 * @class ServicePageController
 * @extends BasePageController
 */
export class ServicePageController extends BasePageController {
  /**
   * 创建服务页面控制器实例
   * @param {Object} options - 配置选项
   */
  constructor(options) {
    super(options);
    this.pageName = "ServicePage";

    /** @type {Array} 服务项目列表 */
    this.serviceItems = [
      { id: 1, name: "在线客服", icon: "💬", action: "chat", desc: "实时在线咨询服务" },
      { id: 2, name: "电话咨询", icon: "📞", action: "call", desc: "拨打客服热线" },
      { id: 3, name: "常见问题", icon: "❓", action: "faq", desc: "查看常见问题解答" },
      { id: 4, name: "意见反馈", icon: "📝", action: "feedback", desc: "提交您的宝贵意见" },
      { id: 5, name: "投诉建议", icon: "⚠️", action: "complaint", desc: "投诉与建议" },
      { id: 6, name: "关于我们", icon: "ℹ️", action: "about", desc: "了解我们" },
    ];

    /** @type {Object} 客服热线信息 */
    this.hotlineInfo = {
      number: "400-888-8888",
      time: "9:00-21:00",
      description: "全天候为您服务",
    };
  }

  /**
   * 页面创建时调用
   * @param {Object} params - 页面参数
   */
  async onCreate(params) {
    await super.onCreate(params);
    console.log("[ServicePage] Creating with params:", params);

    // 加载服务数据
    await this.loadServiceData();

    // 渲染页面
    this.render();
  }

  /**
   * 页面显示时调用
   */
  async onShow() {
    await super.onShow();
    console.log("[ServicePage] Showing");

    // 绑定事件
    this.bindEvents();
  }

  /**
   * 页面隐藏时调用
   */
  async onHide() {
    await super.onHide();
    console.log("[ServicePage] Hiding");

    // 解绑事件
    this.unbindEvents();
  }

  /**
   * 页面销毁时调用
   */
  async onDestroy() {
    await super.onDestroy();
    console.log("[ServicePage] Destroying");

    // 清理数据
    this.serviceItems = [];
  }

  /**
   * 加载服务数据
   */
  async loadServiceData() {
    try {
      // TODO: 调用 API 加载服务数据
      console.log("[ServicePage] Data loaded");
    } catch (error) {
      console.error("[ServicePage] Load data error:", error);
    }
  }

  /**
   * 渲染页面
   */
  render() {
    const container = this.getContainer();
    if (!container) return;

    const html = `
      <div class="service-page">
        <header class="service-header">
          <div class="header-back" id="serviceBackBtn">
            <span class="back-icon">←</span>
            <span class="back-text">返回</span>
          </div>
          <h1 class="header-title">客户服务</h1>
          <div class="header-spacer"></div>
        </header>
        
        <div class="service-content">
          <div class="service-banner">
            <div class="service-icon">🎧</div>
            <h2>7×24 小时服务</h2>
            <p>${this.hotlineInfo.description}</p>
          </div>
          
          <div class="service-list">
            ${this.serviceItems
              .map(
                (item) => `
              <div class="service-item" data-action="${item.action}" data-id="${item.id}">
                <div class="service-icon">${item.icon}</div>
                <div class="service-info">
                  <div class="service-name">${item.name}</div>
                  <div class="service-desc">${item.desc}</div>
                </div>
                <div class="service-arrow">›</div>
              </div>
            `
              )
              .join("")}
          </div>
          
          <div class="service-hotlines">
            <h3>客服热线</h3>
            <div class="hotline-number" id="hotlineNumber">${this.hotlineInfo.number}</div>
            <p class="hotline-time">服务时间：${this.hotlineInfo.time}</p>
            <button class="hotline-call-btn" id="hotlineCallBtn">立即拨打</button>
          </div>
        </div>
      </div>
    `;

    this.setHtml(container, html);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 服务项目点击事件
    const serviceItems = this.$$(".service-item");
    serviceItems.forEach((item) => {
      this.addEventListener(item, "click", (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleServiceAction(action);
      });
    });

    // 返回按钮
    const backBtn = this.$("#serviceBackBtn");
    if (backBtn) {
      this.addEventListener(backBtn, "click", () => {
        this.back();
      });
    }

    // 拨打热线按钮
    const callBtn = this.$("#hotlineCallBtn");
    if (callBtn) {
      this.addEventListener(callBtn, "click", () => {
        this.makeCall();
      });
    }

    // 热线号码点击
    const hotlineNumber = this.$("#hotlineNumber");
    if (hotlineNumber) {
      this.addEventListener(hotlineNumber, "click", () => {
        this.makeCall();
      });
    }
  }

  /**
   * 解绑事件
   */
  unbindEvents() {
    // 事件会自动清理
  }

  /**
   * 处理服务操作
   * @param {string} action - 操作类型
   */
  handleServiceAction(action) {
    switch (action) {
    case "chat":
      this.openChat();
      break;
    case "call":
      this.makeCall();
      break;
    case "faq":
      this.navigateTo("FAQPage");
      break;
    case "feedback":
      this.navigateTo("FeedbackPage");
      break;
    case "complaint":
      this.navigateTo("ComplaintPage");
      break;
    case "about":
      this.navigateTo("AboutPage");
      break;
    }
  }

  /**
   * 打开在线客服
   */
  openChat() {
    console.log("[ServicePage] Opening chat...");
    // TODO: 实现客服聊天功能
    alert("在线客服功能开发中...");
  }

  /**
   * 拨打电话
   */
  makeCall() {
    console.log("[ServicePage] Making call to:", this.hotlineInfo.number);
    // 使用 tel 协议拨打电话
    window.location.href = `tel:${this.hotlineInfo.number}`;
  }

  /**
   * 导出页面状态
   */
  toJSON() {
    return {
      ...super.toJSON(),
      serviceCount: this.serviceItems.length,
    };
  }
}

/**
 * 创建并注册服务页面控制器
 * @param {Object} options - 配置选项
 * @returns {ServicePageController}
 */
export function createServicePage(_options = {}) {
  return new ServicePageController(_options);
}

/**
 * 注册服务页面控制器到全局
 * @param {Object} options - 配置选项
 */
export async function registerServicePage(_options = {}) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("ServicePage", ServicePageController);
}
