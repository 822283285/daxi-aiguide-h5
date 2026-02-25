(function (global) {
  "use strict";

  const daxiapp = global?.DaxiApp || {};

  const baseRequest = (options) => {
    let { url, method = "GET", params = {}, data = {}, headers = {}, successFn, failedFn } = options;

    let ajaxData = data;
    if (method.toUpperCase() === "GET") {
      ajaxData = Object.assign({}, params, data);
    } else if (method.toUpperCase() === "POST") {
      const queryString = $.param(params);
      if (queryString) {
        url += (url.indexOf("?") === -1 ? "?" : "&") + queryString;
      }
      if (typeof data === "object") {
        ajaxData = JSON.stringify(data);
      }
    }

    const signTarget = method.toUpperCase() === "POST" ? data : ajaxData;
    const signHeader = {
      "X-Sign": signMd5Utils.getSign(url, signTarget),
      "X-TIMESTAMP": signMd5Utils.getTimestamp(),
      "Content-Type": "application/json",
    };

    const requestHeaders = Object.assign({}, signHeader, headers);

    return new Promise((resolve, reject) => {
      $.ajax({
        url,
        type: method,
        data: ajaxData,
        headers: requestHeaders,
        contentType: "application/json",
        success: (res) => {
          console.log(`[ApiService] ${url} - 请求响应成功`, { url, method, params, data, headers, successFn, failedFn, res });
          successFn?.(res);
          resolve(res);
        },
        error: (err) => {
          console.error(`[ApiService] ${url} - 请求响应失败`, { url, method, params, data, headers, successFn, failedFn, err });
          failedFn?.(err);
          reject(err);
        },
      });
    });
  };

  const getAction = (options) => {
    const { url, params = {}, data = {}, headers = {}, successFn, failedFn } = options;
    return baseRequest({ url, method: "GET", params, data, headers, successFn, failedFn });
  };

  const postAction = (options) => {
    const { url, params = {}, data = {}, headers = {}, successFn, failedFn } = options;
    return baseRequest({ url, method: "POST", params, data, headers, successFn, failedFn });
  };

  /** 应用参数 */
  let appParams = {};
  /** 应用配置 */
  let appConfig = {};
  /** 应用静态资源URL */
  let appStaticUrl = "";
  /** 应用API URL */
  let appApiUrl = "";
  const api = {};

  /**
   * 获取 token 和 bdid
   * @param {Object} options - 可选参数，优先使用 options 中的值
   */
  const getTokenAndBdid = (options) => ({
    token: options?.token || appParams?.token,
    bdid: options?.bdid || appParams?.bdid,
  });

  /**
   * 构建静态资源URL
   * @param {string} token
   * @param {string} bdid
   * @param {string} path - 资源路径
   */
  const getStaticUrl = (token, bdid, path) => `${appStaticUrl}/${token}/${bdid}/${path}`;

  api.init = (app) => {
    if (!app) return;
    appParams = app._params || {};
    appConfig = app._config || {};
    appStaticUrl = appConfig?.scenic?.static_url || "";
    appApiUrl = appConfig?.scenic?.api_url || "";
    console.log(`[ApiService] 应用API服务初始化成功`, { appParams, appConfig });
  };

  /** 获取景区配置 */
  api.getScenicConfig = (options, successFn, failedFn) => {
    const { token, bdid } = getTokenAndBdid(options);
    return getAction({
      url: getStaticUrl(token, bdid, "pages/config.json"),
      params: options,
      successFn,
      failedFn,
    });
  };

  /**
   * 更新用户信息
   * @param {Object} options - 请求参数
   * @param {string} options.username - 用户名
   * @param {string} options.avatarUrl - 头像URL
   * @param {string} options.openid - OpenID
   */
  api.updateUserInfo = (options, successFn, failedFn) => {
    options.username = options.username || "匿名用户";
    options.avatarUrl = options.avatarUrl || "https://daoyou.daxicn.com/managerApi/api/anon/localOssFiles/avatar/fc2eeed6-85db-4681-822c-eb892e19f6b5.jpg";
    options.openid = options.openid || appParams?.userId;
    return postAction({
      url: appConfig?.userApi?.updateUserInfoUrl || "https://map1a.daxicn.com/payApi/merchantApi/api/wxuser/add",
      data: options,
      successFn,
      failedFn,
    });
  };

  /** 获取景区内景点列表 */
  api.getExhibitAll = (options, successFn, failedFn) => {
    const { token, bdid } = getTokenAndBdid(options);
    return getAction({
      url: getStaticUrl(token, bdid, "exhibit-all.json"),
      params: options,
      successFn,
      failedFn,
    });
  };

  /** 获取景区内景点详情列表 */
  api.getExplainAll = (options, successFn, failedFn) => {
    const { token, bdid } = getTokenAndBdid(options);
    return getAction({
      url: getStaticUrl(token, bdid, "explain-all.json"),
      params: options,
      successFn,
      failedFn,
    });
  };

  /** 获取景区搜索热门词 */
  api.getSearchHotWords = (options, successFn, failedFn) => {
    const { token, bdid } = getTokenAndBdid(options);
    const baseUrl = appConfig?.searchPageConfig?.hotWords?.url || "https://map1a.daxicn.com/daxi-manager/api/stat/hotWords/";
    return getAction({
      url: `${baseUrl}/${token}/${bdid}`,
      params: options,
      successFn,
      failedFn,
    });
  };

  /** 缓存当前景区 token 和 bdid（切换景点时调用） */
  api.cacheTokenAndBDID = (options, successFn, failedFn) => {
    const { token, bdid } = getTokenAndBdid(options);
    const openid = options?.openid || appParams?.userId;
    return postAction({
      url: appConfig?.payApi?.cacheTokenAndBDIDUrl || "https://map1a.daxicn.com/payApi/merchantApi/api/pay/cacheTokenAndBDID",
      data: { token, bdid, openid },
      successFn,
      failedFn,
    });
  };

  /** 获取用户足迹（已访问的景点） */
  api.getFootprints = (options, successFn, failedFn) => {
    const { token, bdid } = getTokenAndBdid(options);
    return getAction({
      url: appConfig?.footprintsUrl || "https://map1a.daxicn.com/server39/daxi-manager/api/museum/footprints",
      params: {
        appid: appParams?.appId || token,
        token,
        bdid,
        t: Date.now(),
        openid: options?.openid || appParams?.userId,
        secret: options?.secret || appConfig?.secret || "1CFE42085637416ADAF6AEF60A832342",
      },
      successFn,
      failedFn,
    });
  };

  /** 根据展品编号查询展品详情 */
  api.getExhibitByNum = (options, successFn, failedFn) => {
    const exhibitNum = options?.exhibitNum || options?.code;
    const baseUrl = appConfig?.searchExhibitByNum || "https://appapi.chnmuseum.cn/api/exhibit/detail_by_num";
    return getAction({
      url: `${baseUrl}?p=wxmini&exhibit_num=${exhibitNum}`,
      params: options?.params || {},
      successFn,
      failedFn,
    });
  };

  /** 获取首页配置 */
  api.getHomePageConfig = (options, successFn, failedFn) => {
    const { token, bdid } = getTokenAndBdid(options);
    return getAction({
      url: getStaticUrl(token, bdid, "pages/home.json"),
      params: options,
      successFn,
      failedFn,
    });
  };

  /** 获取服务页配置 */
  api.getServicePageConfig = (options, successFn, failedFn) => {
    const { token, bdid } = getTokenAndBdid(options);
    return getAction({
      url: getStaticUrl(token, bdid, "pages/service.json"),
      params: options,
      successFn,
      failedFn,
    });
  };

  /** 获取展览路线数据 */
  api.getRouteAll = (options, successFn, failedFn) => {
    const { token, bdid } = getTokenAndBdid(options);
    return getAction({
      url: getStaticUrl(token, bdid, "route-all.json"),
      params: { token, bdid, ...options },
      successFn,
      failedFn,
    });
  };

  /**
   * 获取用户信息
   * @param {Object} options - 请求参数
   * @param {string} options.openid - 用户 openid
   */
  api.getUserInfo = (options, successFn, failedFn) => {
    const openid = options?.openid || appParams?.userId;
    const userInfoUrl = appConfig?.userApi?.getUserInfoUrl || "https://map1a.daxicn.com/payApi/merchantApi/api/wxuser/info";
    return getAction({
      url: userInfoUrl,
      params: { t: Date.now(), openid, client: "wechat" },
      successFn,
      failedFn,
    });
  };

  daxiapp.api = api;
})(window);
