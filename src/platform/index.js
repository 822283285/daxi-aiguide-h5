// Platform 层入口文件
// 导出所有平台相关服务

// JSBridge
export { BridgeService } from "./bridge/bridge-service.js";
export { DownloaderFactory } from "./bridge/downloader-factory.js";
export * from "./bridge/index.js";

// Location
export { LocationService, locationService } from "./location/location-service.js";
export * from "./location/index.js";

// Audio
export * from "./audio/index.js";

// Storage
export * from "./storage/index.js";

// Map
export { MapService, mapService } from "./map/map-service.js";
export * from "./map/index.js";

// API Repository 实现
export { POIRepositoryImpl, RouteRepositoryImpl } from "./api/repository-impl.js";
export * from "./api/index.js";
