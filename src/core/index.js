// Core 层入口文件
// 导出所有核心模块

export { ConfigService } from "./config/config-service.js";
export { StateManager } from "./state/state-manager.js";
export { StateRouter } from "./router/state-router.js";

// 工具函数
export * from "./utils/param-parser.js";
export * from "./utils/env-detector.js";
export * from "./utils/dom-utils.js";

// 常量
export * from "./constants/app-constants.js";
