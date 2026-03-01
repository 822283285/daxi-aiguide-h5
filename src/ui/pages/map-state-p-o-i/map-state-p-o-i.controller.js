import { BasePageController } from "@ui/controllers/base-page-controller.js";

export class MapStatePOIController extends BasePageController {
  constructor(options) {
    super(options);
    this.pageName = "MapStatePOI";
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
    this.setHtml(container, "<div><h1>POI Map</h1></div>");
  }

  bindEvents() {
    // Event bindings
  }
}

export function createMapStatePOI(_options = {}) {
  return new MapStatePOIController(_options);
}

export async function registerMapStatePOI(_options) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("MapStatePOI", MapStatePOIController);
}
