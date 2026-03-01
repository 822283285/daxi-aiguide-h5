/**
 * 应用服务组合器
 * @description 负责创建和组合所有领域服务和应用服务
 */

import { POIService } from "@/domain/poi/poi-service.js";
import { RouteService } from "@/domain/route/route-service.js";
import { NavigationService } from "@/domain/navigation/navigation-service.js";
import { BuildingService } from "@/domain/building/building-entity.js";

import { POIRepositoryImpl, RouteRepositoryImpl } from "@/platform/api/repository-impl.js";
import { MapService } from "@/platform/map/map-service.js";
import { LocationService } from "@/platform/location/location-service.js";

import { AppState } from "@/application/state/app-state.js";
import { CommandBus } from "@/application/commands/command-bus.js";

import {
  LoadPOIsUseCase,
  SearchPOIsUseCase,
  GetPOIDetailUseCase,
  GetNearbyPOIsUseCase,
} from "@/application/usecases/poi-usecases.js";

import {
  LoadRoutesUseCase,
  PlanRouteUseCase,
  GetRouteDetailUseCase,
} from "@/application/usecases/route-usecases.js";

import {
  StartNavigationUseCase,
  UpdateNavigationPositionUseCase,
  StopNavigationUseCase,
  PauseNavigationUseCase,
} from "@/application/usecases/navigation-usecases.js";

/**
 * 应用服务容器
 */
export class AppServices {
  constructor(options = {}) {
    this.options = options;
    this.apiService = options.apiService;

    if (!this.apiService) {
      throw new Error("apiService is required");
    }

    this._initPlatform();
    this._initDomain();
    this._initApplication();
    this._initUseCases();
    this._registerCommands();
  }

  /**
   * 初始化 Platform 层服务
   * @private
   */
  _initPlatform() {
    // Repository 实现
    this.poiRepository = new POIRepositoryImpl(this.apiService);
    this.routeRepository = new RouteRepositoryImpl(this.apiService);

    // 平台服务
    this.mapService = new MapService();
    this.locationService = new LocationService();
  }

  /**
   * 初始化 Domain 层服务
   * @private
   */
  _initDomain() {
    // 领域服务
    this.poiService = new POIService(this.poiRepository);
    this.routeService = new RouteService(this.routeRepository);
    this.navigationService = new NavigationService();
    this.buildingService = new BuildingService();
  }

  /**
   * 初始化 Application 层
   * @private
   */
  _initApplication() {
    // 应用状态
    this.appState = new AppState();

    // 命令总线
    this.commandBus = new CommandBus();
  }

  /**
   * 初始化用例
   * @private
   */
  _initUseCases() {
    // POI 用例
    this.loadPOIsUseCase = new LoadPOIsUseCase(this.poiService);
    this.searchPOIsUseCase = new SearchPOIsUseCase(this.poiService);
    this.getPOIDetailUseCase = new GetPOIDetailUseCase(this.poiService);
    this.getNearbyPOIsUseCase = new GetNearbyPOIsUseCase(this.poiService);

    // Route 用例
    this.loadRoutesUseCase = new LoadRoutesUseCase(this.routeService);
    this.planRouteUseCase = new PlanRouteUseCase(this.routeService);
    this.getRouteDetailUseCase = new GetRouteDetailUseCase(this.routeService);

    // Navigation 用例
    this.startNavigationUseCase = new StartNavigationUseCase(
      this.navigationService,
      this.routeService
    );
    this.updateNavigationPositionUseCase = new UpdateNavigationPositionUseCase(
      this.navigationService
    );
    this.stopNavigationUseCase = new StopNavigationUseCase(this.navigationService);
    this.pauseNavigationUseCase = new PauseNavigationUseCase(this.navigationService);
  }

  /**
   * 注册命令处理器
   * @private
   */
  _registerCommands() {
    // POI 相关命令
    this.commandBus.register("LOAD_POIS", async (payload) => {
      return this.loadPOIsUseCase.execute(payload);
    });

    this.commandBus.register("SEARCH_POIS", async (payload) => {
      return this.searchPOIsUseCase.execute(payload);
    });

    this.commandBus.register("GET_POI_DETAIL", async (payload) => {
      return this.getPOIDetailUseCase.execute(payload);
    });

    this.commandBus.register("GET_NEARBY_POIS", async (payload) => {
      return this.getNearbyPOIsUseCase.execute(payload);
    });

    // Route 相关命令
    this.commandBus.register("LOAD_ROUTES", async (payload) => {
      return this.loadRoutesUseCase.execute(payload);
    });

    this.commandBus.register("PLAN_ROUTE", async (payload) => {
      return this.planRouteUseCase.execute(payload);
    });

    this.commandBus.register("GET_ROUTE_DETAIL", async (payload) => {
      return this.getRouteDetailUseCase.execute(payload);
    });

    // Navigation 相关命令
    this.commandBus.register("START_NAVIGATION", async (payload) => {
      return this.startNavigationUseCase.execute(payload);
    });

    this.commandBus.register("UPDATE_NAVIGATION_POSITION", async (payload) => {
      return this.updateNavigationPositionUseCase.execute(payload);
    });

    this.commandBus.register("STOP_NAVIGATION", async (payload) => {
      return this.stopNavigationUseCase.execute(payload);
    });

    this.commandBus.register("PAUSE_NAVIGATION", async (payload) => {
      return this.pauseNavigationUseCase.execute(payload);
    });
  }

  /**
   * 获取所有服务
   * @returns {Object}
   */
  getServices() {
    return {
      // Platform
      poiRepository: this.poiRepository,
      routeRepository: this.routeRepository,
      mapService: this.mapService,
      locationService: this.locationService,

      // Domain
      poiService: this.poiService,
      routeService: this.routeService,
      navigationService: this.navigationService,
      buildingService: this.buildingService,

      // Application
      appState: this.appState,
      commandBus: this.commandBus,

      // UseCases
      useCases: {
        loadPOIs: this.loadPOIsUseCase,
        searchPOIs: this.searchPOIsUseCase,
        getPOIDetail: this.getPOIDetailUseCase,
        getNearbyPOIs: this.getNearbyPOIsUseCase,
        loadRoutes: this.loadRoutesUseCase,
        planRoute: this.planRouteUseCase,
        getRouteDetail: this.getRouteDetailUseCase,
        startNavigation: this.startNavigationUseCase,
        updateNavigationPosition: this.updateNavigationPositionUseCase,
        stopNavigation: this.stopNavigationUseCase,
        pauseNavigation: this.pauseNavigationUseCase,
      },
    };
  }

  /**
   * 执行命令
   * @param {string} type - 命令类型
   * @param {Object} payload - 命令参数
   * @returns {Promise<Object>}
   */
  async executeCommand(type, payload = {}) {
    return this.commandBus.execute({ type, payload });
  }

  /**
   * 清理资源
   */
  destroy() {
    this.mapService?.destroy();
    this.locationService?.clearWatch();
    this.commandBus?.clear();
    this.navigationService?.clearListeners();
  }
}

/**
 * 创建全局应用服务实例（需要传入 apiService）
 * @param {Object} apiService - API 服务实例
 * @returns {AppServices}
 */
export function createAppServices(apiService) {
  return new AppServices({ apiService });
}
