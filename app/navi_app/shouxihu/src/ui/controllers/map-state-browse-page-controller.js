import { createNamedPageController, registerNamedPageController } from "./named-page-controller-factory.js";

const PAGE_NAME = "MapStateBrowse";

export function createMapStateBrowsePageController(options = {}) {
  return createNamedPageController(PAGE_NAME, options);
}

export function registerMapStateBrowsePageController(options = {}) {
  return registerNamedPageController(PAGE_NAME, options);
}
