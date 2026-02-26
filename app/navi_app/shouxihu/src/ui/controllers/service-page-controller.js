import { createNamedPageController, registerNamedPageController } from "./named-page-controller-factory.js";

const PAGE_NAME = "ServicePage";

export function createServicePageController(options = {}) {
  return createNamedPageController(PAGE_NAME, options);
}

export function registerServicePageController(options = {}) {
  return registerNamedPageController(PAGE_NAME, options);
}
