import { createNamedPageController, registerNamedPageController } from "./named-page-controller-factory.js";

const PAGE_NAME = "MapStatePoiDetail";

export function createMapStatePoiDetailPageController(options = {}) {
  return createNamedPageController(PAGE_NAME, options);
}

export function registerMapStatePoiDetailPageController(options = {}) {
  return registerNamedPageController(PAGE_NAME, options);
}
