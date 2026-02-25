/**
 * 公共工具函数库
 * 提供事件监听、DOM操作、数据处理、URL参数解析等可复用功能
 */

/**
 * 获取当前 URL 的全部查询参数
 * @param {string} [search=window.location.search] - 查询串（可选）
 * @returns {Object<string,string>} 参数对象
 */
function getAllQueryParams(search = window.location.search) {
  const params = {};
  const searchParams = new URLSearchParams(search || "");
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  return params;
}

/**
 * 获取URL参数
 * @param {string} name - 参数名称
 * @returns {string|null} 参数值或null
 */
function getQueryParam(name) {
  if (!name) return null;
  const params = getAllQueryParams();
  return params[name] ?? null;
}

/**
 * 从运行时配置读取白名单参数
 * @param {string} name - 参数名称
 * @returns {string|null} 参数值
 */
function getRuntimeParam(name) {
  if (window.runtimeConfig?.getParam) {
    return window.runtimeConfig.getParam(name);
  }
  return getQueryParam(name);
}

/**
 * 获取查询参数（优先当前窗口，其次父窗口）
 * @param {string} name - 参数名称
 * @returns {string|null} 参数值
 */
function getQueryParamFromSelfOrParent(name) {
  return getRuntimeParam(name);
}

/**
 * 根据白名单提取查询参数
 * @param {string[]} allowKeys - 允许透传的参数列表
 * @param {Object<string,string>} [sourceParams] - 参数源，默认使用当前URL参数
 * @returns {Object<string,string>} 过滤后的参数
 */
function pickQueryParams(allowKeys, sourceParams = getAllQueryParams()) {
  if (!Array.isArray(allowKeys) || allowKeys.length === 0) {
    return {};
  }

  const next = {};
  allowKeys.forEach((key) => {
    if (sourceParams[key] !== undefined) {
      next[key] = sourceParams[key];
    }
  });
  return next;
}

/**
 * 判断是否为有效数组
 * @param {*} data - 待检查的数据
 * @returns {boolean} 是否为非空数组
 */
function isValidArray(data) {
  return Array.isArray(data) && data.length > 0;
}

/**
 * 安全获取对象嵌套属性
 * @param {Object} obj - 目标对象
 * @param {string} path - 属性路径，用点号分隔(如 'user.profile.name')
 * @param {*} defaultValue - 默认值
 * @returns {*} 属性值或默认值
 */
function getNestedValue(obj, path, defaultValue = null) {
  if (!obj || typeof path != "string") return defaultValue;
  const keys = path.split(".");
  let result = obj;
  for (const key of keys) {
    result = result?.[key];
    if (result == undefined) return defaultValue;
  }
  return result;
}

/**
 * 创建带属性的DOM元素
 * @param {string} tag - HTML标签名
 * @param {Object} options - 配置对象
 * @param {Object} options.attrs - 属性对象(id, class, data-*)
 * @param {string} options.html - HTML内容
 * @param {Function} options.onClick - 点击事件处理器
 * @returns {HTMLElement} 创建的元素
 */
function createElement(tag, options = {}) {
  const element = document.createElement(tag);

  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      if (key == "class") {
        if (Array.isArray(value)) {
          element.classList.add(...value);
        } else {
          element.classList.add(value);
        }
      } else if (key.startsWith("data-")) {
        element.setAttribute(key, value);
      } else {
        element[key] = value;
      }
    });
  }

  if (options.html) {
    element.innerHTML = options.html;
  }

  if (options.onClick && typeof options.onClick == "function") {
    element.addEventListener("click", options.onClick);
  }

  return element;
}

/**
 * 将容器元素挂载到主容器中
 * @param {HTMLElement} element - 待挂载的元素
 * @param {HTMLElement} container - 父容器，默认为window.container
 * @returns {boolean} 挂载是否成功
 */
function mountToContainer(element, container = window.container) {
  if (!container || !element) {
    console.warn("mountToContainer: container 或 element 不存在");
    return false;
  }

  if (!element.isConnected) {
    container.appendChild(element);
    return true;
  }
  return false;
}

/**
 * 清空元素内容
 * @param {HTMLElement} element - 待清空的元素
 */
function clearElement(element) {
  if (element) {
    element.innerHTML = "";
  }
}

/**
 * 构建图标URL
 * @param {string} iconName - 图标名称
 * @param {string} iconPath - 图标路径，默认为 './assets/images'
 * @returns {string} 完整的图标URL
 */
function buildIconUrl(iconName, iconPath = "./assets/images") {
  if (!iconName) return "";
  return `${iconPath}/${iconName}.png`;
}

/**
 * 验证对象项目是否有效
 * @param {Object} item - 项目对象
 * @returns {boolean} 项目是否有效
 */
function isValidItem(item) {
  return item && typeof item == "object" && item.name;
}

/**
 * AES 加密工具对象
 * 使用 ECB 模式 + PKCS7 填充
 */
const AES = {
  /** 默认密钥（16字节） */
  DEFAULT_KEY: "Y5jtoFVaMismiJ2y",

  /**
   * AES 加密
   * @param {string} word - 待加密的字符串
   * @param {string} [keyStr] - 密钥（可选，默认使用 DEFAULT_KEY）
   * @returns {string} Base64 编码的密文
   */
  encrypt(word, keyStr) {
    if (typeof CryptoJS == "undefined") {
      console.error("CryptoJS 未加载，请确保已引入 crypto-js 库");
      return "";
    }
    keyStr = keyStr || this.DEFAULT_KEY;
    const key = CryptoJS.enc.Utf8.parse(keyStr);
    const srcs = CryptoJS.enc.Utf8.parse(word);
    const encrypted = CryptoJS.AES.encrypt(srcs, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  },

  /**
   * AES 解密
   * @param {string} word - Base64 编码的密文
   * @param {string} [keyStr] - 密钥（可选，默认使用 DEFAULT_KEY）
   * @returns {string} 解密后的明文
   */
  decrypt(word, keyStr) {
    if (typeof CryptoJS == "undefined") {
      console.error("CryptoJS 未加载，请确保已引入 crypto-js 库");
      return "";
    }
    keyStr = keyStr || this.DEFAULT_KEY;
    const key = CryptoJS.enc.Utf8.parse(keyStr);
    const decrypted = CryptoJS.AES.decrypt(word, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return CryptoJS.enc.Utf8.stringify(decrypted);
  },
};

/**
 * 生成 AES 加密数据
 * 根据用户信息（openid, nickname）生成加密字符串
 * @param {string} openid - 用户 openid
 * @param {string} nickname - 用户昵称
 * @returns {string} AES 加密后的 Base64 字符串
 */
function generateAESData(openid, nickname) {
  const data = {
    openid,
    nickname,
  };
  return AES.encrypt(JSON.stringify(data));
}


/**
 * 获取景区云服务基础URL
 * @returns {string} 基础URL
 */
function getBaseUrl() {
  return window.runtimeConfig?.getScenicUrls?.().baseUrl || "";
}

/**
 * 获取项目URL（包含token）
 * @returns {string} 项目URL
 */
function getProjectUrl() {
  return window.runtimeConfig?.getScenicUrls?.().projectUrl || "";
}

/**
 * 获取景区完整URL（包含token和buildingId）
 * @returns {string} 景区完整URL
 */
function getScenicUrl() {
  return window.runtimeConfig?.getScenicUrls?.().scenicUrl || "";
}

/**
 * 构建景区图片完整URL
 * @param {string} imagePath - 图片相对路径（如 banner/xxx.png 或直接 xxx.png）
 * @param {string} [folder='pages/images'] - 图片文件夹路径
 * @returns {string} 完整图片URL
 */
function buildScenicImageUrl(imagePath, folder = "pages/images") {
  if (!imagePath) return "";
  const scenicUrl = getScenicUrl();
  return `${scenicUrl}/${folder}/${imagePath}`;
}

/**
 * 获取用户信息API URL
 * @returns {string} 用户信息API URL
 */
function getUserInfoUrl() {
  const apiBaseUrl = window.runtimeConfig?.getEnvConfig?.().apiBaseUrl || "";
  return `${apiBaseUrl}/payApi/merchantApi/api/wxuser/info`;
}

// 导出到全局，供其他脚本使用
window.commonUtils = {
  getAllQueryParams,
  getQueryParam,
  getRuntimeParam,
  getQueryParamFromSelfOrParent,
  pickQueryParams,
  isValidArray,
  getNestedValue,
  createElement,
  mountToContainer,
  clearElement,
  buildIconUrl,
  isValidItem,
  AES,
  generateAESData,
  getBaseUrl,
  getProjectUrl,
  getScenicUrl,
  buildScenicImageUrl,
  getUserInfoUrl,
};
