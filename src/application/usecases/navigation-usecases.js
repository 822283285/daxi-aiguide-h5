/**
 * 导航相关用例
 */

export class StartNavigationUseCase {
  constructor(navigationService, routeService, options = {}) {
    this.navigationService = navigationService;
    this.routeService = routeService;
    this.options = options;
  }

  async execute(params = {}) {
    const { routeId, route, mode = "walking" } = params;

    try {
      let targetRoute = route;

      if (!targetRoute && routeId) {
        const result = await this.routeService.getRouteDetail(routeId);
        if (!result) {
          return {
            success: false,
            error: {
              message: "路线不存在",
              code: "ROUTE_NOT_FOUND",
            },
          };
        }
        targetRoute = result;
      }

      if (!targetRoute) {
        return {
          success: false,
          error: {
            message: "路线不能为空",
            code: "INVALID_ROUTE",
          },
        };
      }

      const session = this.navigationService.createSession(targetRoute, { mode });
      const started = this.navigationService.startNavigation();

      if (!started) {
        return {
          success: false,
          error: {
            message: "启动导航失败",
            code: "START_NAVIGATION_FAILED",
          },
        };
      }

      return {
        success: true,
        data: {
          session,
          route: targetRoute,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || "启动导航失败",
          code: "START_NAVIGATION_FAILED",
        },
      };
    }
  }
}

export class UpdateNavigationPositionUseCase {
  constructor(navigationService, options = {}) {
    this.navigationService = navigationService;
    this.options = options;
  }

  async execute(params = {}) {
    const { position } = params; // {lng, lat, floor}

    if (!position || position.lng === undefined || position.lat === undefined) {
      return {
        success: false,
        error: {
          message: "位置信息不完整",
          code: "INVALID_POSITION",
        },
      };
    }

    try {
      this.navigationService.updatePosition(position);

      const session = this.navigationService.getCurrentSession();

      return {
        success: true,
        data: {
          session,
          currentPosition: position,
          currentInstruction: session?.currentInstruction || null,
          progress: session?.progress || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || "更新位置失败",
          code: "UPDATE_POSITION_FAILED",
        },
      };
    }
  }
}

export class StopNavigationUseCase {
  constructor(navigationService, options = {}) {
    this.navigationService = navigationService;
    this.options = options;
  }

  async execute(params = {}) {
    const { cancel = false } = params;

    try {
      const session = this.navigationService.getCurrentSession();

      if (!session) {
        return {
          success: false,
          error: {
            message: "没有活跃的导航会话",
            code: "NO_ACTIVE_SESSION",
          },
        };
      }

      let result;
      if (cancel) {
        result = this.navigationService.cancelNavigation();
      } else {
        result = this.navigationService.completeNavigation();
      }

      if (!result) {
        return {
          success: false,
          error: {
            message: "停止导航失败",
            code: "STOP_NAVIGATION_FAILED",
          },
        };
      }

      return {
        success: true,
        data: {
          session: null,
          cancelled: cancel,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || "停止导航失败",
          code: "STOP_NAVIGATION_FAILED",
        },
      };
    }
  }
}

export class PauseNavigationUseCase {
  constructor(navigationService, options = {}) {
    this.navigationService = navigationService;
    this.options = options;
  }

  async execute(params = {}) {
    const { pause = true } = params;

    try {
      const session = this.navigationService.getCurrentSession();

      if (!session) {
        return {
          success: false,
          error: {
            message: "没有活跃的导航会话",
            code: "NO_ACTIVE_SESSION",
          },
        };
      }

      let result;
      if (pause) {
        result = this.navigationService.pauseNavigation();
      } else {
        result = this.navigationService.resumeNavigation();
      }

      return {
        success: true,
        data: {
          session: this.navigationService.getCurrentSession(),
          paused: pause ? result : !result,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || "操作失败",
          code: "NAVIGATION_OPERATION_FAILED",
        },
      };
    }
  }
}
