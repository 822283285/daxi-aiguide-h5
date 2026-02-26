function resolveDeps(options = {}) {
  const globalRef = options.globalRef || globalThis;
  const daxiapp = options.daxiapp || globalRef.DaxiApp || {};
  return {
    globalRef,
    daxiapp,
  };
}

export function createLegacyPageController(pageName, options = {}) {
  const deps = resolveDeps(options);
  if (!pageName) {
    return null;
  }

  if (options.controller) {
    return options.controller;
  }

  return deps.daxiapp[pageName] || null;
}

export function registerLegacyPageController(pageName, options = {}) {
  const deps = resolveDeps(options);
  const controller = createLegacyPageController(pageName, {
    ...options,
    daxiapp: deps.daxiapp,
  });

  if (!controller) {
    return null;
  }

  deps.daxiapp[pageName] = controller;
  return controller;
}

