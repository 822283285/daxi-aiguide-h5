import { createNamedPageController, registerNamedPageController } from "./named-page-controller-factory.js";

const PAGE_NAME = "MapStateNavi";

export function createMapStateNaviPageController(options = {}) {
  return createNamedPageController(PAGE_NAME, options);
}

export function registerMapStateNaviPageController(options = {}) {
  return registerNamedPageController(PAGE_NAME, options);
}
