import { BasePageController } from "../../controllers/base-page-controller.js";

export class MapStateRouteController extends BasePageController {
  constructor(options) {
    super(options);
    this.pageName = "MapStateRoute";
  }

  async onCreate(params) {
    await super.onCreate(params);
    this.render();
  }

  async onShow() {
    await super.onShow();
    this.bindEvents();
  }

  render() {
    const container = this.getContainer();
    if (!container) return;
    this.setHtml(container, "<div><h1>Route Map</h1></div>");
  }

  bindEvents() {
    // Event bindings
  }
}

export function createMapStateRoute(options = {}) {
  return new MapStateRouteController(options);
}

export async function registerMapStateRoute(options) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("MapStateRoute", MapStateRouteController);
}
