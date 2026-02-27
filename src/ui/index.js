// UI 层入口文件
// 导出所有页面、组件、控制器

// 页面
export * from "./pages/index.js";

// 组件
export { BaseComponent } from "./components/base-component.js";
export * from "./components/index.js";

// 控制器
export { BasePageController } from "./controllers/base-page-controller.js";
export { pageControllerRegistry } from "./controllers/page-controller-registry.js";
export * from "./controllers/index.js";

// 样式 (通过 import 引入)
// import './styles/index.css';
