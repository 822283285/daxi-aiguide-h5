import { createNamedPageController, registerNamedPageController } from "./named-page-controller-factory.js";

const PAGE_NAME = "MapStateExhibitionRoute";

export function createMapStateExhibitionRoutePageController(options = {}) {
  return createNamedPageController(PAGE_NAME, options);
}

export function registerMapStateExhibitionRoutePageController(options = {}) {
  return registerNamedPageController(PAGE_NAME, options);
}
