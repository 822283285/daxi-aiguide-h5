/**
 * 页面切换控制模块
 * 功能：管理三个页面的切换、URL参数传递、hash同步
 */

window.pageSwitcher = (function () {
  "use strict";

  // 从统一配置获取页面配置
  let PAGE_CONFIG = {};

  // 初始化PAGE_CONFIG（等待app-config加载）
  function initPageConfig() {
    if (window.appConfig) {
      PAGE_CONFIG = window.appConfig.getPageConfig();
    }
  }

  // 当前页面标识
  let currentPage = "map"; // 默认显示地图页

  /**
   * 获取URL参数
   * @returns {Object} URL参数对象
   */
  function getUrlParams() {
    const params = {};
    const searchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    return params;
  }

  /**
   * 将参数对象转换为URL查询字符串
   * @param {Object} params - 参数对象
   * @returns {string} 查询字符串
   */
  function paramsToQueryString(params) {
    const searchParams = new URLSearchParams();
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        searchParams.append(key, params[key]);
      }
    }
    return searchParams.toString();
  }

  /**
   * 更新iframe的src，添加参数
   * @param {string} iframeId - iframe的ID
   * @param {string} baseUrl - 基础URL
   * @param {Object} params - 参数对象
   * @param {string} hash - hash值
   */
  function updateIframeSrc(iframeId, baseUrl, params, hash = "") {
    const iframe = document.getElementById(iframeId);
    if (!iframe) {
      console.warn(`updateIframeSrc: iframe ${iframeId} 不存在`);
      return;
    }

    const queryString = paramsToQueryString(params);
    let url = baseUrl;

    if (queryString) {
      url += (url.indexOf("?") == -1 ? "?" : "&") + queryString;
    }

    if (hash) {
      url += hash;
    }

    // 构建完整URL
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1);
    const fullUrl = url.startsWith("http") ? url : basePath + url;

    // 只有当URL变化时才更新，避免不必要的重载
    const currentSrc = iframe.src;
    const currentFullUrl = new URL(currentSrc, window.location.origin).href;
    const newFullUrl = new URL(fullUrl, window.location.origin).href;

    if (currentFullUrl != newFullUrl) {
      iframe.src = fullUrl;
    }
  }

  /**
   * 初始化所有iframe的URL参数
   */
  function initIframeUrls() {
    const params = getUrlParams();
    const hash = window.location.hash;

    // 更新所有iframe的URL
    Object.keys(PAGE_CONFIG).forEach((pageKey) => {
      const config = PAGE_CONFIG[pageKey];
      updateIframeSrc(config.iframeId, config.src, params, hash);
    });
  }

  /**
   * 切换页面
   * @param {string} targetPage - 目标页面标识 ('home', 'map', 'service')
   * @param {boolean} updateHash - 是否更新URL hash，默认false
   */
  function switchPage(targetPage, updateHash = false) {
    if (!PAGE_CONFIG[targetPage]) {
      console.warn(`switchPage: 未知页面 ${targetPage}`);
      return;
    }

    if (currentPage == targetPage) {
      return; // 已经是目标页面，无需切换
    }

    const currentConfig = PAGE_CONFIG[currentPage];
    const targetConfig = PAGE_CONFIG[targetPage];

    // 获取当前和目标的iframe元素
    const currentIframe = document.getElementById(currentConfig.iframeId);
    const targetIframe = document.getElementById(targetConfig.iframeId);

    if (!currentIframe || !targetIframe) {
      console.warn("switchPage: iframe元素不存在");
      return;
    }

    // 更新当前页面标识
    currentPage = targetPage;

    // 移除当前页面的激活类
    currentIframe.classList.remove("page-iframe-active");
    // 添加目标页面的激活类
    targetIframe.classList.add("page-iframe-active");

    // 使用setTimeout确保样式类已更新，然后切换透明度
    setTimeout(() => {
      // 当前页面淡出
      currentIframe.style.opacity = "0";
      currentIframe.style.pointerEvents = "none";

      // 目标页面淡入
      targetIframe.style.opacity = "1";
      targetIframe.style.pointerEvents = "auto";
    }, 0);

    // tabbar状态已在初始化时设置好，无需更新

    // // 更新URL hash（如果需要）
    // if (updateHash) {
    //   window.location.hash = targetPage;
    // }

    // 触发页面切换事件
    window.dispatchEvent(
      new CustomEvent("pageSwitched", {
        detail: {
          from: currentConfig.name,
          to: targetConfig.name,
          page: targetPage,
        },
      })
    );
  }

  /**
   * 同步hash到所有iframe
   * @param {string} hash - hash值
   */
  function syncHashToIframes(hash) {
    const params = getUrlParams();

    Object.keys(PAGE_CONFIG).forEach((pageKey) => {
      const config = PAGE_CONFIG[pageKey];
      const iframe = document.getElementById(config.iframeId);
      if (iframe) {
        try {
          // 更新iframe的src，添加hash
          updateIframeSrc(config.iframeId, config.src, params, hash);
        } catch (e) {
          console.warn(`syncHashToIframes: 无法同步hash到 ${config.iframeId}`, e);
        }
      }
    });
  }

  /**
   * 监听hash变化
   */
  function setupHashListener() {
    window.addEventListener("hashchange", function () {
      const hash = window.location.hash.replace("#", "");

      // 如果hash是页面标识，则切换页面
      if (hash && PAGE_CONFIG[hash]) {
        // hash是页面标识，切换到对应页面（不更新hash，避免循环）
        if (currentPage != hash) {
          switchPage(hash, false);
        }
      } else {
        console.log("检测到hash变化", hash);
        // hash不是页面标识，同步到所有iframe
        syncHashToIframes(window.location.hash);
      }
    });
  }

  /**
   * 初始化
   */
  function init() {
    // 初始化页面配置
    initPageConfig();

    // 设置hash监听（需要在初始化URL之前设置）
    setupHashListener();

    // 初始化iframe URL（包含当前hash）
    initIframeUrls();

    // 检查URL hash，如果存在且是页面标识，则切换到对应页面
    const hash = window.location.hash.replace("#", "");
    if (hash && PAGE_CONFIG[hash]) {
      // hash是页面标识，切换到对应页面（不更新hash）
      switchPage(hash, false);
    } else {
      // 默认显示地图页
      switchPage("map", false);
    }

    // 暴露全局API
    window.switchToPage = function (page) {
      if (PAGE_CONFIG[page]) {
        switchPage(page, true);
      } else {
        console.warn(`switchToPage: 未知页面 ${page}`);
      }
    };

    window.getCurrentPage = function () {
      return currentPage;
    };

    console.log("页面切换器初始化完成，当前页面:", currentPage);
  }

  return {
    init: init,
    switchPage: switchPage,
    getCurrentPage: function () {
      return currentPage;
    },
    syncHash: syncHashToIframes,
  };
})();
