import { ConfigService } from "./core/config/config-service.js";
import { BridgeService } from "./platform/bridge/bridge-service.js";
import { createDownloaderFactory } from "./platform/bridge/downloader-factory.js";
import { createAppInitUsecase } from "./application/usecases/app-init-usecase.js";
import { CommandBus } from "./application/commands/command-bus.js";
import { installLegacyBridgeCompat } from "./legacy/bridge-compat.js";
import { registerAllPageControllers } from "./ui/controllers/page-controller-registry.js";

/**
 * Modular entry for the refactor track.
 * This file is intentionally not wired into index_src.html yet.
 */
export function createModularApp(options = {}) {
  const globalRef = options.globalRef || globalThis;
  const configService = options.configService || ConfigService.fromWindow(globalRef);
  const bridgeService =
    options.bridgeService ||
    BridgeService.fromWindow({
      globalRef,
      configService,
      logger: options.logger,
    });
  const appInitUsecase = options.appInitUsecase || createAppInitUsecase({ globalRef });
  const commandBus = options.commandBus || new CommandBus({ logger: options.logger });
  const downloaderFactory = options.downloaderFactory || createDownloaderFactory({ daxiapp: globalRef.DaxiApp });
  const legacyBridgeCompat = options.legacyBridgeCompat || installLegacyBridgeCompat({ globalRef });
  const registerControllers = options.registerPageControllers || registerAllPageControllers;

  return {
    services: {
      configService,
      bridgeService,
      appInitUsecase,
      commandBus,
      downloaderFactory,
      legacyBridgeCompat,
      registerControllers,
    },
    start(startOptions = {}) {
      const shouldBootstrap = startOptions.bootstrapLegacy !== false;
      const registeredControllers =
        startOptions.registerPageControllers === false ? {} : registerControllers({ globalRef });
      const appInitResult = shouldBootstrap ? appInitUsecase.start() : { initialized: false, reason: "skipped" };
      return {
        status: "ready",
        env: configService.getCurrentEnv(),
        hasBridge: bridgeService.isAvailable(),
        appInit: appInitResult,
        commandSubscribers: commandBus.getSubscriberCount(),
        pageControllers: Object.keys(registeredControllers).length,
      };
    },
  };
}
