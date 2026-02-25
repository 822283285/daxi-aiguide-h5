(function (global) {
  var daximap = (global.DaxiMap = global.DaxiMap || {});
  var modules = (daximap.SceneModules = daximap.SceneModules || {});
  modules.adapter = modules.adapter || {};

  modules.adapter.getDefPaintByType = function (type) {
    var getter = modules.domain && modules.domain.getDefPaintByType;
    return getter ? getter(type) : {};
  };
})(window);
