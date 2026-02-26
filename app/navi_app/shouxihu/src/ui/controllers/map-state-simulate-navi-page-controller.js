import { createNamedPageController, registerNamedPageController } from "./named-page-controller-factory.js";

const PAGE_NAME = "MapStateSimulateNavi";

export function createMapStateSimulateNaviPageController(options = {}) {
  return createNamedPageController(PAGE_NAME, options);
}

export function registerMapStateSimulateNaviPageController(options = {}) {
  return registerNamedPageController(PAGE_NAME, options);
}
