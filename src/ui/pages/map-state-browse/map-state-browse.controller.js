import { BasePageController } from "../../controllers/base-page-controller.js";

export class MapStateBrowseController extends BasePageController {
  constructor(options) {
    super(options);
    this.pageName = "MapStateBrowse";
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
    this.setHtml(container, "<div><h1>Browse Map</h1></div>");
  }

  bindEvents() {
    // Event bindings
  }
}

export function createMapStateBrowse(options = {}) {
  return new MapStateBrowseController(options);
}

export async function registerMapStateBrowse(options) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("MapStateBrowse", MapStateBrowseController);
}
