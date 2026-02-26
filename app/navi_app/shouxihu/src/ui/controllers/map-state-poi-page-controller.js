import { createNamedPageController, registerNamedPageController } from "./named-page-controller-factory.js";

const PAGE_NAME = "MapStatePoi";

export function createMapStatePoiPageController(options = {}) {
  return createNamedPageController(PAGE_NAME, options);
}

export function registerMapStatePoiPageController(options = {}) {
  return registerNamedPageController(PAGE_NAME, options);
}

