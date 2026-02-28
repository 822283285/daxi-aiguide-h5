import { BasePageController } from "../../controllers/base-page-controller.js";

export class POIDetailPageController extends BasePageController {
  constructor(options) {
    super(options);
    this.pageName = "POIDetailPage";
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
    this.setHtml(container, "<div><h1>POI Detail</h1></div>");
  }

  bindEvents() {
    // Event bindings
  }
}

export function createPOIDetail(options = {}) {
  return new POIDetailPageController(options);
}

export async function registerPOIDetail(options) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("POIDetailPage", POIDetailPageController);
}
