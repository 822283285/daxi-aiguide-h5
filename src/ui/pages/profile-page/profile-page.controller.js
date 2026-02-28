import { BasePageController } from "../../controllers/base-page-controller.js";

export class ProfilePageController extends BasePageController {
  constructor(options) {
    super(options);
    this.pageName = "ProfilePage";
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
    this.setHtml(container, "<div><h1>Profile</h1></div>");
  }

  bindEvents() {
    // Event bindings
  }
}

export function createProfile(options = {}) {
  return new ProfilePageController(options);
}

export async function registerProfile(options) {
  const { registerPage } = await import("../../controllers/page-controller-registry.js");
  registerPage("ProfilePage", ProfilePageController);
}
