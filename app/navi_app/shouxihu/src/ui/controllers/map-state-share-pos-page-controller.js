import { createNamedPageController, registerNamedPageController } from "./named-page-controller-factory.js";

const PAGE_NAME = "MapStateSharePos";

export function createMapStateSharePosPageController(options = {}) {
  return createNamedPageController(PAGE_NAME, options);
}

export function registerMapStateSharePosPageController(options = {}) {
  return registerNamedPageController(PAGE_NAME, options);
}
