import { BasePageController } from "../../controllers/base-page-controller.js";

export class PayResultPageController extends BasePageController {
  constructor(options) {
    super(options);
    this.pageName = "PayResultPage";
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
    this.setHtml(container, "<div><h1>Payment Result</h1></div>");
  }

  bindEvents() {
    // Event bindings
  }
}

export function createPayResult(options = {}) {
  return new PayResultPageController(options);
}

export async function registerPayResult(options) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("PayResultPage", PayResultPageController);
}
