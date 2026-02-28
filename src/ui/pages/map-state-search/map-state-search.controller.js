import { BasePageController } from "../../controllers/base-page-controller.js";

export class MapStateSearchController extends BasePageController {
  constructor(options) {
    super(options);
    this.pageName = "MapStateSearch";
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
    this.setHtml(container, "<div><h1>Search Map</h1></div>");
  }

  bindEvents() {
    // Event bindings
  }
}

export function createMapStateSearch(options = {}) {
  return new MapStateSearchController(options);
}

export async function registerMapStateSearch(options) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("MapStateSearch", MapStateSearchController);
}
