const MAP_CREATED_EVENT = "daxi:map-created";

export function installLegacyBridgeCompat(options = {}) {
  const globalRef = options.globalRef || globalThis;
  const eventName = options.eventName || MAP_CREATED_EVENT;
  const listeners = new Set();

  const eventHandler = (event) => {
    const detail = event?.detail || {};
    listeners.forEach((handler) => {
      try {
        handler(detail.app, detail.mapSDK, detail);
      } catch (_error) {
        // no-op: compat listeners should not break startup
      }
    });
  };

  if (typeof globalRef.addEventListener === "function") {
    globalRef.addEventListener(eventName, eventHandler);
  }

  const compat = globalRef.DxAppCompat || {};
  compat.onMapCreated = function onMapCreated(handler) {
    if (typeof handler !== "function") {
      return () => false;
    }
    listeners.add(handler);
    return () => listeners.delete(handler);
  };
  compat.offMapCreated = function offMapCreated(handler) {
    return listeners.delete(handler);
  };
  compat.getApp = function getApp() {
    return globalRef.DxApp || null;
  };

  globalRef.DxAppCompat = compat;

  return {
    api: compat,
    dispose() {
      listeners.clear();
      if (typeof globalRef.removeEventListener === "function") {
        globalRef.removeEventListener(eventName, eventHandler);
      }
    },
  };
}

