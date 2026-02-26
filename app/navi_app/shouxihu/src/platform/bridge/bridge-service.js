import { ConfigService } from "../../core/config/config-service.js";

export class BridgeService {
  constructor(options = {}) {
    this.globalRef = options.globalRef || globalThis;
    this.configService = options.configService || new ConfigService({ globalRef: this.globalRef });
    this.logger = options.logger || console;
    this.bridge = options.bridge || this.detectBridge();
  }

  static fromWindow(options = {}) {
    return new BridgeService(options);
  }

  detectBridge() {
    const daxiApp = this.globalRef?.DaxiApp;
    return daxiApp?.jsBridge || this.globalRef?.jsBridge || null;
  }

  setBridge(bridge) {
    this.bridge = bridge || null;
  }

  isAvailable() {
    return Boolean(this.bridge);
  }

  invoke(methodName, ...args) {
    if (!this.bridge || typeof this.bridge[methodName] !== "function") {
      this.logger.warn?.(`[BridgeService] bridge method unavailable: ${methodName}`);
      return undefined;
    }
    return this.bridge[methodName](...args);
  }

  on(eventName, handler) {
    if (!eventName || typeof handler !== "function") {
      return false;
    }

    if (typeof this.bridge?.addEventHandler === "function") {
      this.bridge.addEventHandler(eventName, handler);
      return true;
    }

    if (typeof this.globalRef?.addEventListener === "function") {
      this.globalRef.addEventListener(eventName, handler);
      return true;
    }

    return false;
  }

  off(eventName, handler) {
    if (!eventName || typeof handler !== "function") {
      return false;
    }

    if (typeof this.bridge?.removeEventHandler === "function") {
      this.bridge.removeEventHandler(eventName, handler);
      return true;
    }

    if (typeof this.globalRef?.removeEventListener === "function") {
      this.globalRef.removeEventListener(eventName, handler);
      return true;
    }

    return false;
  }

  postLocationMessage(type, extra = {}) {
    const sender = this.globalRef?.locWebSocketPostMessage;
    if (typeof sender !== "function") {
      return false;
    }

    const userId = extra.userId || this.configService.getParam("userId") || "";
    const payload = {
      type,
      id: userId,
      roleType: "receiver",
      ...extra,
    };

    sender(payload);
    return true;
  }
}

