import { createNamedPageController, registerNamedPageController } from "./named-page-controller-factory.js";

const PAGE_NAME = "MapStateRoute";

export function createMapStateRoutePageController(options = {}) {
  return createNamedPageController(PAGE_NAME, options);
}

export function registerMapStateRoutePageController(options = {}) {
  return registerNamedPageController(PAGE_NAME, options);
}

