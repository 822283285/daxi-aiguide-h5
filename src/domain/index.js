// Domain 层入口文件
// 导出所有领域模型和服务

// POI 领域
export { POI } from "./poi/poi-entity.js";
export { POIRepository } from "./poi/poi-repository.js";
export { POIService } from "./poi/poi-service.js";

// Route 领域
export { Route, RoutePlan } from "./route/route-entity.js";
export { RouteRepository } from "./route/route-repository.js";
export { RouteService } from "./route/route-service.js";

// Navigation 领域
export {
  NavigationSession,
  NavigationInstruction,
  NavigationStatus,
  NavigationMode,
  NavigationService,
} from "./navigation/navigation-service.js";

// Building 领域
export { Building, Floor, BuildingService } from "./building/building-entity.js";

// User 领域
export { User } from "./user/user-entity.js";
