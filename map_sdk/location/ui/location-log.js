(function (global) {
  var modules = (global.DaxiLocationModules = global.DaxiLocationModules || {});
  modules.ui = modules.ui || {};

  modules.ui.addLocationLog = function (locationLogManager, payload) {
    if (locationLogManager && typeof locationLogManager.addData === 'function') {
      locationLogManager.addData(payload);
    }
  };
})(window);
