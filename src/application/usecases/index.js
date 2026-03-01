// UseCases 模块入口
// 导出所有用例

// 应用初始化
export { AppInitUsecase } from "./app-init-usecase.js";

// POI 相关用例
export {
  LoadPOIsUseCase,
  SearchPOIsUseCase,
  GetPOIDetailUseCase,
  GetNearbyPOIsUseCase,
} from "./poi-usecases.js";

// 路线相关用例
export {
  LoadRoutesUseCase,
  PlanRouteUseCase,
  GetRouteDetailUseCase,
} from "./route-usecases.js";

// 导航相关用例
export {
  StartNavigationUseCase,
  UpdateNavigationPositionUseCase,
  StopNavigationUseCase,
  PauseNavigationUseCase,
} from "./navigation-usecases.js";
