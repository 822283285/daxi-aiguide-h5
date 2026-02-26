import { createNamedPageController, registerNamedPageController } from "./named-page-controller-factory.js";

const PAGE_NAME = "MapStateVisitNavi";

export function createMapStateVisitNaviPageController(options = {}) {
  return createNamedPageController(PAGE_NAME, options);
}

export function registerMapStateVisitNaviPageController(options = {}) {
  return registerNamedPageController(PAGE_NAME, options);
}
