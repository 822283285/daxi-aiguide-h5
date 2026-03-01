/**
 * 加载 POI 数据用例
 * @description 负责加载和管理 POI 数据
 */

export class LoadPOIsUseCase {
  /**
   * @param {POIService} poiService - POI 领域服务
   * @param {Object} options - 用例选项
   */
  constructor(poiService, options = {}) {
    this.poiService = poiService;
    this.options = options;
  }

  /**
   * 执行用例：加载所有 POI
   * @param {Object} params - 执行参数
   * @param {boolean} [params.forceRefresh] - 是否强制刷新
   * @param {string} [params.type] - POI 类型过滤
   * @returns {Promise<Object>} 执行结果
   */
  async execute(params = {}) {
    const { forceRefresh = false, type } = params;

    try {
      let pois;

      if (type) {
        pois = await this.poiService.getPOIsByType(type);
      } else {
        pois = await this.poiService.loadAllPOIs({
          activeOnly: !forceRefresh,
        });
      }

      return {
        success: true,
        data: {
          pois,
          count: pois.length,
          loadedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || "加载 POI 失败",
          code: "LOAD_POIS_FAILED",
        },
      };
    }
  }
}

/**
 * 搜索 POI 用例
 */
export class SearchPOIsUseCase {
  constructor(poiService, options = {}) {
    this.poiService = poiService;
    this.options = options;
  }

  async execute(params = {}) {
    const { keyword, options = {} } = params;

    if (!keyword || keyword.trim() === "") {
      return {
        success: false,
        error: {
          message: "搜索关键词不能为空",
          code: "INVALID_KEYWORD",
        },
      };
    }

    try {
      const pois = await this.poiService.searchPOIs(keyword.trim(), options);

      return {
        success: true,
        data: {
          pois,
          count: pois.length,
          keyword: keyword.trim(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || "搜索失败",
          code: "SEARCH_FAILED",
        },
      };
    }
  }
}

/**
 * 获取 POI 详情用例
 */
export class GetPOIDetailUseCase {
  constructor(poiService, options = {}) {
    this.poiService = poiService;
    this.options = options;
  }

  async execute(params = {}) {
    const { id, code } = params;

    if (!id && !code) {
      return {
        success: false,
        error: {
          message: "POI ID 或编码不能为空",
          code: "INVALID_POI_IDENTIFIER",
        },
      };
    }

    try {
      const poi = code
        ? await this.poiService.getPOIByCode(code)
        : await this.poiService.getPOIDetail(id);

      if (!poi) {
        return {
          success: false,
          error: {
            message: "POI 不存在",
            code: "POI_NOT_FOUND",
          },
        };
      }

      return {
        success: true,
        data: { poi },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || "获取 POI 详情失败",
          code: "GET_POI_DETAIL_FAILED",
        },
      };
    }
  }
}

/**
 * 获取附近 POI 用例
 */
export class GetNearbyPOIsUseCase {
  constructor(poiService, options = {}) {
    this.poiService = poiService;
    this.options = options;
  }

  async execute(params = {}) {
    const { longitude, latitude, radius = 100, options = {} } = params;

    if (longitude === undefined || latitude === undefined) {
      return {
        success: false,
        error: {
          message: "经纬度不能为空",
          code: "INVALID_LOCATION",
        },
      };
    }

    try {
      const pois = await this.poiService.getNearbyPOIs(
        longitude,
        latitude,
        radius,
        options
      );

      return {
        success: true,
        data: {
          pois,
          count: pois.length,
          location: { longitude, latitude },
          radius,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || "获取附近 POI 失败",
          code: "GET_NEARBY_POIS_FAILED",
        },
      };
    }
  }
}
