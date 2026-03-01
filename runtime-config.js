/**
 * 运行时配置文件
 * 
 * 用途：
 * 1. 在 HTML 中通过 <script> 标签引入，在应用加载前执行
 * 2. 提供不同环境的配置（dev/uat/prod）
 * 3. 配置 API 地址、地图数据地址等
 * 4. 支持 URL 参数覆盖配置
 * 
 * 使用方式：
 * 在 index.html 的 <head> 中引入：
 * <script src="./runtime-config.js"></script>
 * 
 * 访问配置：
 * window.runtimeConfig.getConfig()
 * window.runtimeConfig.getParam('token')
 */

(function (global) {
  'use strict';

  // 环境配置矩阵
  const ENV_MATRIX = {
    dev: {
      // 开发环境
      apiBaseUrl: 'https://cloud.daxicn.com/publicData',
      staticBaseUrl: 'https://cloud.daxicn.com/publicData',
      wsBaseUrl: 'wss://map.daxicn.com/ws/loc',
      mapDataBaseUrl: 'https://cloud.daxicn.com/publicData',
      showLog: true,
      debug: true,
    },
    uat: {
      // 用户验收测试环境
      apiBaseUrl: 'https://cloud.daxicn.com/publicData',
      staticBaseUrl: 'https://cloud.daxicn.com/publicData',
      wsBaseUrl: 'wss://map.daxicn.com/ws/loc',
      mapDataBaseUrl: 'https://cloud.daxicn.com/publicData',
      showLog: true,
      debug: false,
    },
    prod: {
      // 生产环境
      apiBaseUrl: 'https://cloud.daxicn.com/scenic',
      staticBaseUrl: 'https://cloud.daxicn.com/scenic',
      wsBaseUrl: 'wss://map.daxicn.com/ws/loc',
      mapDataBaseUrl: 'https://cloud.daxicn.com/scenic',
      showLog: false,
      debug: false,
    },
  };

  // 默认环境
  const DEFAULT_ENV = 'dev';

  // 允许的查询参数白名单
  const ALLOWED_QUERY_PARAMS = [
    'env',
    'token',
    'buildingId',
    'userId',
    'appId',
    'device',
    'testLocWs',
    'disabledH5Location',
    'wsIndex',
    'sendLocType',
    'method',
    'platform',
    'lang',
    'scenic',
    'poiid',
  ];

  // 存储配置
  let currentConfig = null;
  let queryParams = null;

  /**
   * 解析 URL 查询参数
   */
  function parseQueryParams() {
    if (queryParams !== null) {
      return queryParams;
    }

    const params = {};
    const search = global.location?.search || '';
    
    if (search) {
      const searchParams = new URLSearchParams(search.substring(1));
      for (const [key, value] of searchParams.entries()) {
        try {
          params[key] = decodeURIComponent(value);
        } catch (e) {
          params[key] = value;
        }
      }
    }

    queryParams = params;
    return params;
  }

  /**
   * 获取 URL 参数
   */
  function getParam(name) {
    const params = parseQueryParams();
    return params[name] || null;
  }

  /**
   * 获取当前环境
   */
  function getCurrentEnv() {
    return getParam('env') || DEFAULT_ENV;
  }

  /**
   * 获取环境配置
   */
  function getEnvConfig() {
    const env = getCurrentEnv();
    const selected = ENV_MATRIX[env] || ENV_MATRIX[DEFAULT_ENV] || {};
    
    return {
      env,
      ...selected,
    };
  }

  /**
   * 获取完整配置
   */
  function getConfig() {
    if (currentConfig) {
      return currentConfig;
    }

    const envConfig = getEnvConfig();
    const params = parseQueryParams();

    // 构建配置对象
    currentConfig = {
      // 环境配置
      env: envConfig.env,
      apiBaseUrl: envConfig.apiBaseUrl,
      staticBaseUrl: envConfig.staticBaseUrl,
      wsBaseUrl: envConfig.wsBaseUrl,
      mapDataBaseUrl: envConfig.mapDataBaseUrl,
      
      // 功能开关
      showLog: envConfig.showLog,
      debug: envConfig.debug,
      
      // URL 参数
      token: params.token || '',
      buildingId: params.buildingId || params.poiid || '',
      userId: params.userId || '',
      appId: params.appId || '',
      
      // 原始参数
      rawParams: params,
    };

    return currentConfig;
  }

  /**
   * 获取地图数据 URL
   */
  function getMapDataUrl() {
    const config = getConfig();
    const base = config.mapDataBaseUrl.replace(/\/+$/, '');
    const token = config.token;
    const buildingId = config.buildingId;

    if (token && buildingId) {
      return `${base}/${token}/${buildingId}/`;
    } else if (token) {
      return `${base}/${token}/`;
    } else {
      return `${base}/`;
    }
  }

  /**
   * 获取 API 基础 URL
   */
  function getApiBaseUrl() {
    return getConfig().apiBaseUrl;
  }

  /**
   * 获取 WebSocket URL
   */
  function getWsBaseUrl() {
    return getConfig().wsBaseUrl;
  }

  /**
   * 检查是否为调试模式
   */
  function isDebug() {
    return getConfig().debug;
  }

  /**
   * 检查是否显示日志
   */
  function shouldShowLog() {
    return getConfig().showLog;
  }

  /**
   * 打印配置信息（仅在允许时）
   */
  function logConfig() {
    if (shouldShowLog()) {
      const config = getConfig();
      console.log('[Runtime Config] 环境:', config.env);
      console.log('[Runtime Config] API 地址:', config.apiBaseUrl);
      console.log('[Runtime Config] 地图数据地址:', config.mapDataBaseUrl);
      console.log('[Runtime Config] WebSocket 地址:', config.wsBaseUrl);
      console.log('[Runtime Config] 配置:', config);
    }
  }

  // 初始化：自动解析并打印配置
  (function init() {
    getConfig();
    logConfig();
  })();

  // 暴露到全局
  global.runtimeConfig = {
    getConfig,
    getParam,
    getCurrentEnv,
    getEnvConfig,
    getMapDataUrl,
    getApiBaseUrl,
    getWsBaseUrl,
    isDebug,
    shouldShowLog,
    ENV_MATRIX,
    ALLOWED_QUERY_PARAMS,
  };

})(typeof window !== 'undefined' ? window : globalThis);
