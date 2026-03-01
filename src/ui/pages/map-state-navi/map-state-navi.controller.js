/**
 * 地图导航状态控制器
 * 处理 AR 导航、语音播报、实时定位等功能
 */
import { BasePageController } from "@ui/controllers/base-page-controller.js";
import {
  getCurrentPosition,
  watchPosition,
  calculateDistance,
  calculateBearing,
  formatBearing,
} from "@utils/location-utils.js";
import {
  getNextPoint,
  getPreviousPoint,
  isArrivedAtPoint,
  getRouteProgress,
  generateRouteGuidance,
  findNearestPoint,
} from "@utils/route-utils.js";

/**
 * @class MapStateNaviController
 * @extends BasePageController
 */
export class MapStateNaviController extends BasePageController {
  /**
   * 创建地图导航状态控制器实例
   * @param {Object} options - 配置选项
   */
  constructor(options) {
    super(options);
    this.pageName = "MapStateNavi";

    /** @type {Object} 导航路线 */
    this.route = null;

    /** @type {Object} 起点 */
    this.startPoint = null;

    /** @type {Object} 终点 */
    this.endPoint = null;

    /** @type {Object} 用户当前位置 */
    this.userLocation = null;

    /** @type {number} 当前路径点索引 */
    this.currentPointIndex = 0;

    /** @type {Object} 导航状态 */
    this.navigationState = {
      isNavigating: false,
      isPaused: false,
      progress: 0,
      distanceRemaining: 0,
      durationRemaining: 0,
    };

    /** @type {Function} 定位监听取消函数 */
    this.locationWatchUnsubscribe = null;

    /** @type {Object} 语音合成实例 */
    this.speechSynthesis = null;

    /** @type {boolean} 是否启用语音播报 */
    this.isVoiceEnabled = true;

    /** @type {number} 上次播报时间 */
    this.lastVoiceTime = 0;

    /** @type {Object} AR 相机 */
    this.arCamera = null;

    /** @type {boolean} 是否启用 AR 模式 */
    this.isARMode = false;
  }

  /**
   * 页面创建时调用
   * @param {Object} params - 页面参数
   */
  async onCreate(params) {
    await super.onCreate(params);
    console.log("[MapStateNavi] Creating with params:", params);

    // 获取导航参数
    this.route = params.route || null;
    this.startPoint = params.startPoint || null;
    this.endPoint = params.endPoint || null;

    if (!this.route) {
      console.error("[MapStateNavi] 缺少导航路线");
    }

    // 渲染页面
    this.render();
  }

  /**
   * 页面显示时调用
   */
  async onShow() {
    await super.onShow();
    console.log("[MapStateNavi] Showing");

    // 初始化语音合成
    this.initSpeechSynthesis();

    // 初始化 AR
    this.initAR();

    // 绑定事件
    this.bindEvents();

    // 开始导航
    this.startNavigation();
  }

  /**
   * 页面隐藏时调用
   */
  async onHide() {
    await super.onHide();
    console.log("[MapStateNavi] Hiding");

    // 暂停导航
    this.pauseNavigation();

    // 解绑事件
    this.unbindEvents();
  }

  /**
   * 页面销毁时调用
   */
  async onDestroy() {
    await super.onDestroy();
    console.log("[MapStateNavi] Destroying");

    // 停止导航
    this.stopNavigation();

    // 清理 AR
    this.destroyAR();

    // 清理数据
    this.route = null;
    this.userLocation = null;
  }

  /**
   * 渲染页面
   */
  render() {
    const container = this.getContainer();
    if (!container) return;

    const html = `
      <div class="map-state-navi ${this.isARMode ? "ar-mode" : ""}">
        <div class="navi-ar-container" id="arContainer">
          <video class="ar-video" id="arVideo" autoplay playsinline muted></video>
          <div class="ar-overlay" id="arOverlay"></div>
        </div>
        
        <div class="navi-map-container" id="naviMapContainer"></div>
        
        <div class="navi-header">
          <div class="navi-back" id="naviBackBtn">
            <span class="back-icon">←</span>
            <span class="back-text">退出导航</span>
          </div>
          <div class="navi-status">
            <span class="status-icon">🧭</span>
            <span class="status-text">导航中</span>
          </div>
          <button class="navi-mode-btn" id="toggleARBtn">
            ${this.isARMode ? "📍 地图" : "📷 AR"}
          </button>
        </div>
        
        <div class="navi-guidance-panel" id="guidancePanel">
          <div class="guidance-icon" id="guidanceIcon">⬆️</div>
          <div class="guidance-text" id="guidanceText">前方 100 米</div>
          <div class="guidance-distance" id="guidanceDistance">100m</div>
        </div>
        
        <div class="navi-info-panel">
          <div class="navi-info-item">
            <span class="info-label">剩余距离</span>
            <span class="info-value" id="remainingDistance">0m</span>
          </div>
          <div class="navi-info-item">
            <span class="info-label">预计时间</span>
            <span class="info-value" id="remainingTime">0 分钟</span>
          </div>
        </div>
        
        <div class="navi-controls">
          <button class="navi-control-btn" id="voiceToggleBtn" title="语音开关">
            🔊
          </button>
          <button class="navi-control-btn" id="pauseNavBtn" title="暂停/继续">
            ⏸️
          </button>
          <button class="navi-control-btn" id="recenterBtn" title="重新定位">
            📍
          </button>
        </div>
        
        <div class="navi-progress-bar">
          <div class="progress-fill" id="progressFill" style="width: 0%"></div>
        </div>
      </div>
    `;

    this.setHtml(container, html);
  }

  /**
   * 初始化语音合成
   */
  initSpeechSynthesis() {
    if ("speechSynthesis" in window) {
      this.speechSynthesis = window.speechSynthesis;
      console.log("[MapStateNavi] 语音合成已初始化");
    } else {
      console.warn("[MapStateNavi] 浏览器不支持语音合成");
      this.isVoiceEnabled = false;
    }
  }

  /**
   * 初始化 AR
   */
  initAR() {
    console.log("[MapStateNavi] 初始化 AR...");

    // TODO: 初始化 AR 相机
    // 这里需要访问设备摄像头并处理视频流
  }

  /**
   * 启动 AR 相机
   */
  async startARCamera() {
    try {
      const video = this.$("#arVideo");
      if (!video) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // 使用后置摄像头
        },
      });

      video.srcObject = stream;
      this.arCamera = stream;

      console.log("[MapStateNavi] AR 相机已启动");
    } catch (error) {
      console.error("[MapStateNavi] 启动 AR 相机失败:", error);
    }
  }

  /**
   * 停止 AR 相机
   */
  stopARCamera() {
    if (this.arCamera) {
      const tracks = this.arCamera.getTracks();
      tracks.forEach((track) => track.stop());
      this.arCamera = null;

      console.log("[MapStateNavi] AR 相机已停止");
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 返回按钮
    const backBtn = this.$("#naviBackBtn");
    if (backBtn) {
      this.addEventListener(backBtn, "click", () => {
        this.stopNavigation();
        this.back();
      });
    }

    // 切换 AR 模式
    const toggleARBtn = this.$("#toggleARBtn");
    if (toggleARBtn) {
      this.addEventListener(toggleARBtn, "click", () => {
        this.toggleARMode();
      });
    }

    // 语音开关
    const voiceBtn = this.$("#voiceToggleBtn");
    if (voiceBtn) {
      this.addEventListener(voiceBtn, "click", () => {
        this.toggleVoice();
      });
    }

    // 暂停/继续导航
    const pauseBtn = this.$("#pauseNavBtn");
    if (pauseBtn) {
      this.addEventListener(pauseBtn, "click", () => {
        this.togglePause();
      });
    }

    // 重新定位
    const recenterBtn = this.$("#recenterBtn");
    if (recenterBtn) {
      this.addEventListener(recenterBtn, "click", () => {
        this.updateUserLocation();
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
   * 开始导航
   */
  async startNavigation() {
    console.log("[MapStateNavi] 开始导航");

    this.navigationState.isNavigating = true;
    this.navigationState.isPaused = false;

    // 获取初始位置
    await this.updateUserLocation();

    // 开始监听位置变化
    this.startLocationWatch();

    // 启动 AR 相机 (如果是 AR 模式)
    if (this.isARMode) {
      this.startARCamera();
    }

    // 播报导航开始
    this.announce("导航已开始");

    // 更新导航信息
    this.updateNavigationInfo();
  }

  /**
   * 暂停导航
   */
  pauseNavigation() {
    console.log("[MapStateNavi] 暂停导航");

    this.navigationState.isPaused = true;
    this.stopLocationWatch();
    this.stopARCamera();
  }

  /**
   * 继续导航
   */
  resumeNavigation() {
    console.log("[MapStateNavi] 继续导航");

    this.navigationState.isPaused = false;
    this.startLocationWatch();

    if (this.isARMode) {
      this.startARCamera();
    }
  }

  /**
   * 停止导航
   */
  stopNavigation() {
    console.log("[MapStateNavi] 停止导航");

    this.navigationState.isNavigating = false;
    this.navigationState.isPaused = false;

    this.stopLocationWatch();
    this.stopARCamera();

    // 播报导航结束
    this.announce("导航已结束");
  }

  /**
   * 开始监听位置变化
   */
  startLocationWatch() {
    this.locationWatchUnsubscribe = watchPosition((location, error) => {
      if (error) {
        console.error("[MapStateNavi] 定位失败:", error);
        return;
      }

      this.userLocation = location;
      console.log("[MapStateNavi] 位置更新:", location);

      // 更新导航状态
      this.updateNavigationState();
    });
  }

  /**
   * 停止监听位置变化
   */
  stopLocationWatch() {
    if (this.locationWatchUnsubscribe) {
      this.locationWatchUnsubscribe();
      this.locationWatchUnsubscribe = null;
    }
  }

  /**
   * 更新用户位置
   */
  async updateUserLocation() {
    try {
      this.userLocation = await getCurrentPosition();
      console.log("[MapStateNavi] 位置更新成功:", this.userLocation);
      this.updateNavigationState();
    } catch (error) {
      console.error("[MapStateNavi] 获取位置失败:", error);
    }
  }

  /**
   * 更新导航状态
   */
  updateNavigationState() {
    if (!this.userLocation || !this.route || !this.route.path) {
      return;
    }

    const currentLocation = this.userLocation.coordinate;

    // 找到最近的路径点
    const nearest = findNearestPoint(this.route.path, currentLocation);
    if (nearest) {
      this.currentPointIndex = nearest.index;
    }

    // 计算进度
    const progress = getRouteProgress(this.route.path, this.currentPointIndex);
    this.navigationState.progress = progress.percentage;

    // 计算剩余距离
    const remainingDistance = this.calculateRemainingDistance();
    this.navigationState.distanceRemaining = remainingDistance;

    // 计算剩余时间
    const remainingDuration = Math.round(remainingDistance / 1.2 / 60); // 假设 1.2m/s
    this.navigationState.durationRemaining = remainingDuration;

    // 更新 UI
    this.updateNavigationUI();

    // 检查是否到达目标点
    this.checkArrival();

    // 提供导航指引
    this.provideGuidance();
  }

  /**
   * 计算剩余距离
   * @returns {number} 剩余距离 (米)
   */
  calculateRemainingDistance() {
    if (!this.route.path || this.currentPointIndex >= this.route.path.length - 1) {
      return 0;
    }

    let distance = 0;
    for (let i = this.currentPointIndex; i < this.route.path.length - 1; i++) {
      distance += calculateDistance(this.route.path[i], this.route.path[i + 1]);
    }

    return Math.round(distance);
  }

  /**
   * 更新导航 UI
   */
  updateNavigationUI() {
    // 更新进度条
    const progressFill = this.$("#progressFill");
    if (progressFill) {
      progressFill.style.width = `${this.navigationState.progress}%`;
    }

    // 更新剩余距离
    const remainingDistance = this.$("#remainingDistance");
    if (remainingDistance) {
      remainingDistance.textContent = this.formatDistance(this.navigationState.distanceRemaining);
    }

    // 更新剩余时间
    const remainingTime = this.$("#remainingTime");
    if (remainingTime) {
      remainingTime.textContent = `${this.navigationState.durationRemaining}分钟`;
    }
  }

  /**
   * 格式化距离
   * @param {number} distance - 距离 (米)
   * @returns {string} 格式化后的距离
   */
  formatDistance(distance) {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  }

  /**
   * 检查是否到达
   */
  checkArrival() {
    if (!this.userLocation || !this.endPoint) {
      return;
    }

    const currentLocation = this.userLocation.coordinate;
    const endPointLocation = this.endPoint.coordinate || [this.endPoint.lng, this.endPoint.lat];

    const distance = calculateDistance(currentLocation, endPointLocation);

    if (distance < 20) {
      // 到达终点 (20 米内)
      this.announce("已到达目的地");
      this.navigationState.isNavigating = false;
    }
  }

  /**
   * 提供导航指引
   */
  provideGuidance() {
    if (!this.route.path) {
      return;
    }

    const guidance = generateRouteGuidance(this.route.path, this.currentPointIndex);

    // 更新指引 UI
    const guidanceText = this.$("#guidanceText");
    const guidanceDistance = this.$("#guidanceDistance");
    const guidanceIcon = this.$("#guidanceIcon");

    if (guidanceText) {
      guidanceText.textContent = guidance;
    }

    if (guidanceDistance && this.route.path[this.currentPointIndex + 1]) {
      const nextPoint = this.route.path[this.currentPointIndex + 1];
      const currentPoint = this.route.path[this.currentPointIndex];
      const distance = calculateDistance(currentPoint, nextPoint);
      guidanceDistance.textContent = this.formatDistance(distance);
    }

    // 计算方向
    if (guidanceIcon && this.route.path.length > this.currentPointIndex + 1) {
      const current = this.route.path[this.currentPointIndex];
      const next = this.route.path[this.currentPointIndex + 1];
      const bearing = calculateBearing(current, next);
      const direction = formatBearing(bearing);
      guidanceIcon.textContent = this.getDirectionIcon(bearing);
    }

    // 语音播报
    this.voiceGuidance(guidance);
  }

  /**
   * 获取方向图标
   * @param {number} bearing - 方向角度
   * @returns {string} 方向图标
   */
  getDirectionIcon(bearing) {
    const icons = ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"];
    const index = Math.round(bearing / 45) % 8;
    return icons[index];
  }

  /**
   * 语音指引
   * @param {string} text - 指引文本
   */
  voiceGuidance(text) {
    if (!this.isVoiceEnabled) {
      return;
    }

    const now = Date.now();
    // 限制播报频率 (至少间隔 10 秒)
    if (now - this.lastVoiceTime < 10000) {
      return;
    }

    this.announce(text);
    this.lastVoiceTime = now;
  }

  /**
   * 语音播报
   * @param {string} text - 播报文本
   */
  announce(text) {
    if (!this.isVoiceEnabled || !this.speechSynthesis) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    this.speechSynthesis.speak(utterance);
    console.log("[MapStateNavi] 语音播报:", text);
  }

  /**
   * 切换 AR 模式
   */
  toggleARMode() {
    this.isARMode = !this.isARMode;
    console.log("[MapStateNavi] 切换 AR 模式:", this.isARMode);

    // 重新渲染
    this.render();
    this.bindEvents();

    // 如果是 AR 模式且正在导航，启动相机
    if (this.isARMode && this.navigationState.isNavigating && !this.navigationState.isPaused) {
      this.startARCamera();
    } else {
      this.stopARCamera();
    }
  }

  /**
   * 切换语音
   */
  toggleVoice() {
    this.isVoiceEnabled = !this.isVoiceEnabled;
    console.log("[MapStateNavi] 语音开关:", this.isVoiceEnabled);

    const voiceBtn = this.$("#voiceToggleBtn");
    if (voiceBtn) {
      voiceBtn.textContent = this.isVoiceEnabled ? "🔊" : "🔇";
    }
  }

  /**
   * 切换暂停状态
   */
  togglePause() {
    if (this.navigationState.isPaused) {
      this.resumeNavigation();
    } else {
      this.pauseNavigation();
    }

    const pauseBtn = this.$("#pauseNavBtn");
    if (pauseBtn) {
      pauseBtn.textContent = this.navigationState.isPaused ? "▶️" : "⏸️";
    }
  }

  /**
   * 销毁 AR
   */
  destroyAR() {
    this.stopARCamera();
  }

  /**
   * 导出页面状态
   */
  toJSON() {
    return {
      ...super.toJSON(),
      isNavigating: this.navigationState.isNavigating,
      isPaused: this.navigationState.isPaused,
      progress: this.navigationState.progress,
      distanceRemaining: this.navigationState.distanceRemaining,
      isARMode: this.isARMode,
      isVoiceEnabled: this.isVoiceEnabled,
    };
  }
}

/**
 * 创建并注册地图导航状态控制器
 * @param {Object} options - 配置选项
 * @returns {MapStateNaviController}
 */
export function createMapStateNavi(options = {}) {
  return new MapStateNaviController(options);
}

/**
 * 注册地图导航状态控制器到全局
 * @param {Object} options - 配置选项
 */
export async function registerMapStateNavi(_options = {}) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("MapStateNavi", MapStateNaviController);
}
