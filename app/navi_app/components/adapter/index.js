(function (global) {
  var daxiapp = (global.DaxiApp = global.DaxiApp || {});
  var modules = (daxiapp.ComponentModules = daxiapp.ComponentModules || {});
  modules.adapter = modules.adapter || {};

  modules.adapter.getPoiData = function (ele) {
    var fn = modules.domain && modules.domain.getPoiData;
    return fn ? fn(ele) : {};
  };

  modules.adapter.createListItem = function (childDom, events, className, id) {
    var fn = modules.ui && modules.ui.createListItem;
    return fn ? fn(childDom, events, className, id) : null;
  };

  modules.adapter.getLang = function (key, defaultVal) {
    var fn = modules.ui && modules.ui.getLang;
    return fn ? fn(key, defaultVal) : defaultVal;
  };

  modules.adapter.updateLastShowClass = function (childrens) {
    var fn = modules.ui && modules.ui.updateLastShowClass;
    if (fn) {
      fn(childrens);
    }
  };

  modules.adapter.getKeyword = function (domUtils, container, selector) {
    var fn = modules.infra && modules.infra.getKeyword;
    return fn ? fn(domUtils, container, selector) : '';
  };

  modules.adapter.updateRoutePosUI = function (domUtils, $container, posType, info) {
    var fn = modules.ui && modules.ui.updateRoutePosUI;
    if (fn) {
      fn(domUtils, $container, posType, info);
    }
  };
})(window);
