(function (global) {
  var modules = (global.DaxiLocationModules = global.DaxiLocationModules || {});
  modules.adapter = modules.adapter || {};

  modules.adapter.createLastOrientation = function () {
    var factory = modules.domain && modules.domain.createLastOrientation;
    return factory ? factory() : [0, 0, 0, false];
  };

  modules.adapter.createGlobalValues = function () {
    var factory = modules.domain && modules.domain.createGlobalValues;
    return factory
      ? factory()
      : {
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

  modules.adapter.addLocationLog = function (locationLogManager, payload) {
    var handler = modules.ui && modules.ui.addLocationLog;
    if (handler) {
      handler(locationLogManager, payload);
      return;
    }
    if (locationLogManager && typeof locationLogManager.addData === 'function') {
      locationLogManager.addData(payload);
    }
  };
})(window);
