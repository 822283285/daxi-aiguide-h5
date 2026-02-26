import { createNamedPageController, registerNamedPageController } from "./named-page-controller-factory.js";

const PAGE_NAME = "ProfilePage";

export function createProfilePageController(options = {}) {
  return createNamedPageController(PAGE_NAME, options);
}

export function registerProfilePageController(options = {}) {
  return registerNamedPageController(PAGE_NAME, options);
}
