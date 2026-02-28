import { BasePageController } from "../../controllers/base-page-controller.js";

export class AboutPageController extends BasePageController {
  constructor(options) {
    super(options);
    this.pageName = "AboutPage";
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
    this.setHtml(container, "<div><h1>About</h1></div>");
  }

  bindEvents() {
    // Event bindings
  }
}

export function createAbout(options = {}) {
  return new AboutPageController(options);
}

export async function registerAbout(options) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("AboutPage", AboutPageController);
}
