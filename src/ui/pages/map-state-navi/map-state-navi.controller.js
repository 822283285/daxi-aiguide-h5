import { BasePageController } from "../../controllers/base-page-controller.js";

export class MapStateNaviController extends BasePageController {
  constructor(options) {
    super(options);
    this.pageName = "MapStateNavi";
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
    this.setHtml(container, "<div><h1>Navigation</h1></div>");
  }

  bindEvents() {
    // Event bindings
  }
}

export function createMapStateNavi(options = {}) {
  return new MapStateNaviController(options);
}

export async function registerMapStateNavi(options) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("MapStateNavi", MapStateNaviController);
}
