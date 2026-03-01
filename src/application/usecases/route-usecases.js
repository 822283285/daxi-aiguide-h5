/**
 * 路线规划相关用例
 */

export class LoadRoutesUseCase {
  constructor(routeService, options = {}) {
    this.routeService = routeService;
    this.options = options;
  }

  async execute(params = {}) {
    const { type } = params;

    try {
      let routes;
      if (type) {
        routes = type === "recommended"
          ? await this.routeService.getRecommendedRoutes()
          : await this.routeService.getPOIsByType(type);
      } else {
        routes = await this.routeService.loadAllRoutes();
      }

      return {
        success: true,
        data: {
          routes,
          count: routes.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || "加载路线失败",
          code: "LOAD_ROUTES_FAILED",
        },
      };
    }
  }
}

export class PlanRouteUseCase {
  constructor(routeService, options = {}) {
    this.routeService = routeService;
    this.options = options;
  }

  async execute(params = {}) {
    const { origin, destination, waypoints, mode = "walking" } = params;

    if (!origin || !destination) {
      return {
        success: false,
        error: {
          message: "起点和终点不能为空",
          code: "INVALID_ROUTE_PARAMS",
        },
      };
    }

    try {
      let routePlan;

      if (waypoints && waypoints.length > 0) {
        routePlan = await this.routeService.planMultiPointRoute(
          origin,
          destination,
          waypoints,
          { mode }
        );
      } else {
        routePlan = await this.routeService.planRoute(origin, destination, { mode });
      }

      return {
        success: true,
        data: {
          routePlan,
          origin,
          destination,
          waypoints: waypoints || [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || "路线规划失败",
          code: "PLAN_ROUTE_FAILED",
        },
      };
    }
  }
}

export class GetRouteDetailUseCase {
  constructor(routeService, options = {}) {
    this.routeService = routeService;
    this.options = options;
  }

  async execute(params = {}) {
    const { id, code } = params;

    if (!id && !code) {
      return {
        success: false,
        error: {
          message: "路线 ID 或编码不能为空",
          code: "INVALID_ROUTE_IDENTIFIER",
        },
      };
    }

    try {
      const route = code
        ? await this.routeService.getRouteByCode(code)
        : await this.routeService.getRouteDetail(id);

      if (!route) {
        return {
          success: false,
          error: {
            message: "路线不存在",
            code: "ROUTE_NOT_FOUND",
          },
        };
      }

      return {
        success: true,
        data: { route },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || "获取路线详情失败",
          code: "GET_ROUTE_DETAIL_FAILED",
        },
      };
    }
  }
}
