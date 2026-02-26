import { createNamedPageController, registerNamedPageController } from "./named-page-controller-factory.js";

const PAGE_NAME = "HomePage";

export function createHomePageController(options = {}) {
  return createNamedPageController(PAGE_NAME, options);
}

export function registerHomePageController(options = {}) {
  return registerNamedPageController(PAGE_NAME, options);
}
