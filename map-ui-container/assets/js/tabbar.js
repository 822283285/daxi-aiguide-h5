/**
 * 底部导航栏模块
 * 功能：从接口获取配置并渲染底部标签栏
 * 接口：https://ar-video.daxicn.com/scenic/${token}/${bdid}/config.json
 * 数据路径：res.browsePage.naviData
 */

/**
 * 页面名称映射到页面key
 * 根据接口返回的name字段映射到对应的页面key
 */
const PAGE_NAME_MAP = {
  首页: "home",
  地图: "map",
  听导游: "lecture",
  服务: "service",
  我的: "more",
};

/**
 * 获取tabbar配置数据
 * @param {string} token - token参数
 * @param {string} bdid - buildingId参数
 * @returns {Promise<Array>} tabbar配置数组
 */
async function fetchTabbarConfig(token, bdid) {
  try {
    if (!token || !bdid) {
      console.warn("fetchTabbarConfig: token或bdid为空", { token, bdid });
      return [];
    }
    // 使用 commonUtils 工具函数获取 URL
    let tabbarDataUrl = `${window.commonUtils.getScenicUrl()}/pages/config.json`;
    const response = await fetch(tabbarDataUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 获取 naviData
    const naviData = data?.browsePage?.naviData || [];
    console.log("获取到的tabbar配置：", naviData);
    return naviData;
  } catch (error) {
    console.error("获取tabbar配置失败：", error);
    return [];
  }
}

/**
 * 创建单个标签栏项元素
 * @param {Object} tabItem - 标签项数据
 * @param {number} index - 索引
 * @param {string} currentPageKey - 当前页面标识 ('home', 'service', 'more', 'map')
 * @returns {HTMLElement} 标签项元素
 */
function createTabbarItem(tabItem, index, currentPageKey) {
  if (!tabItem || typeof tabItem != "object") {
    console.warn("createTabbarItem: 标签项数据无效");
    return null;
  }

  // 根据页面名称映射到页面key，然后与当前页面标识比较
  const tabItemPageKey = PAGE_NAME_MAP[tabItem.name];
  const isActive = tabItemPageKey == currentPageKey;

  const li = document.createElement("li");
  li.className = `menuTap ${isActive ? "on" : ""}`;
  li.setAttribute("data-id", tabItem.id || "");
  li.setAttribute("data-navitype", tabItem.navitype || "");
  li.setAttribute("data-url", tabItem.url || "");
  li.setAttribute("data-index", index);

  const iconClass = tabItem.icon || "";
  const iconClassWithActive = isActive ? `${iconClass} on` : iconClass;

  li.innerHTML = `
    <div>
      <i class="${iconClassWithActive}"></i>
    </div>
    <span>${tabItem.name || ""}</span>
  `;

  // 添加点击事件
  li.addEventListener("click", () => {
    handleTabbarItemClick(tabItem, index);
  });

  return li;
}

/**
 * 处理标签栏项目点击事件
 * @param {Object} tabItem - 标签项数据
 * @param {number} index - 索引
 */
function handleTabbarItemClick(tabItem, index) {
  console.log("handleTabbarItemClick: 点击了标签栏项", tabItem.name, index);

  const pageName = tabItem.name;
  const targetPage = PAGE_NAME_MAP[pageName];

  if (pageName == "听导游") {
    // 听导游页面特殊处理
    const getUserId = () => {
      if (window.commonUtils && window.commonUtils.getQueryParam) {
        return window.commonUtils.getQueryParam("userId");
      }
      if (window.parent && window.parent.commonUtils && window.parent.commonUtils.getQueryParam) {
        return window.parent.commonUtils.getQueryParam("userId");
      }
      return "";
    };

    const message = {
      type: "postEventToMiniProgram",
      id: getUserId(),
      methodToMiniProgram: "changeTab=/pages/media/player-2",
      roleType: "receiver",
    };
    if (window.parent && window.parent.ws) {
      window.parent.ws.send(JSON.stringify(message));
    }
  } else if (targetPage) {
    // 如果是容器模式页面，使用页面切换API
    // 优先使用父窗口的switchToPage（iframe环境），否则使用当前窗口的
    const switchToPageFn = window.parent && window.parent != window && window.parent.switchToPage ? window.parent.switchToPage : window.switchToPage || null;

    if (switchToPageFn) {
      switchToPageFn(targetPage);
    } else {
      console.warn("switchToPage 函数不存在");
    }
  } else {
    console.warn(`未知的页面名称: ${pageName}`);
  }
}

/**
 * 创建标签栏容器
 * @param {Array} naviData - 导航数据数组
 * @param {string} currentPageKey - 当前页面标识 ('home', 'service', 'more', 'map')
 * @returns {HTMLElement} 标签栏容器元素
 */
function createTabbar(naviData, currentPageKey) {
  if (!Array.isArray(naviData) || naviData.length == 0) {
    console.warn("createTabbar: naviData 无效");
    return null;
  }

  const footerbar = document.createElement("div");
  footerbar.className = "footerbar";
  footerbar.style.height = "auto";

  const ul = document.createElement("ul");

  naviData.forEach((tabItem, index) => {
    const itemElement = createTabbarItem(tabItem, index, currentPageKey);
    if (itemElement) {
      ul.appendChild(itemElement);
    }
  });

  footerbar.appendChild(ul);
  return footerbar;
}

/**
 * 挂载标签栏到页面
 * @param {HTMLElement} targetContainer - 目标容器
 * @param {string} token - token参数
 * @param {string} bdid - buildingId参数
 * @param {string} currentPageKey - 当前页面标识 ('home', 'service', 'more', 'map')，用于高亮对应tab项
 */
async function mountTabbar(targetContainer, token, bdid, currentPageKey) {
  if (!targetContainer) {
    console.warn("mountTabbar: 目标容器不存在");
    return;
  }

  if (!currentPageKey) {
    console.warn("mountTabbar: currentPageKey 未提供，将无法正确高亮tab项");
  }

  // 获取tabbar配置
  const naviData = await fetchTabbarConfig(token, bdid);

  if (naviData.length == 0) {
    console.warn("mountTabbar: 未获取到tabbar配置数据");
    return;
  }

  // 创建并挂载tabbar
  const tabbarElement = createTabbar(naviData, currentPageKey);
  if (tabbarElement) {
    targetContainer.appendChild(tabbarElement);

    // 等待tabbar渲染完成后设置底部内边距，避免内容被遮挡
    requestAnimationFrame(() => {
      const tabbarHeight = tabbarElement.offsetHeight;

      if (!targetContainer.dataset.originalPaddingBottom) {
        targetContainer.dataset.originalPaddingBottom = window.getComputedStyle(targetContainer).paddingBottom;
      }

      targetContainer.style.paddingBottom = `${tabbarHeight}px`;

      console.log("tabbar挂载成功，当前页面:", currentPageKey, "高度:", tabbarHeight);
    });
  }
}

// 导出到全局，供其他脚本使用
window.tabbarUtils = {
  createTabbar,
  mountTabbar,
  createTabbarItem,
};
