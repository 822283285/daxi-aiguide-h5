(function (global) {
  var modules = (global.DaxiLocationModules = global.DaxiLocationModules || {});
  modules.domain = modules.domain || {};

  modules.domain.createLastOrientation = function () {
    return [0, 0, 0, false];
  };

  modules.domain.createGlobalValues = function () {
    return {
      orientationHistory: [],
      gameOrientation: [],
      debugInfo: {},
      headingDelta: 0.0,
      headingWX: 0.0,
      headingH5: 0.0,
      stepCount: 0,
      stepOrient: 0.0,
    };
  };
})(window);
