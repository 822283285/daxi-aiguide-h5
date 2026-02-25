(function (global) {
  var daxiapp = (global.DaxiApp = global.DaxiApp || {});
  var modules = (daxiapp.ComponentModules = daxiapp.ComponentModules || {});
  modules.ui = modules.ui || {};

  modules.ui.createListItem = function (childDom, events, className, id) {
    var itemDom = document.createElement('li');
    itemDom.setAttribute('class', className ? 'item ' + className : 'item');
    id && itemDom.setAttribute('id', id);
    if (events) {
      for (var eName in events) {
        itemDom.addEventListener(eName, events[eName]);
      }
    }
    if (typeof childDom === 'string') {
      itemDom.innerHTML = childDom;
    } else if (Array.isArray(childDom)) {
      childDom.forEach(function (item) {
        itemDom.appendChild(item);
      });
    } else {
      itemDom.appendChild(childDom);
    }
    return itemDom;
  };

  modules.ui.getLang = function (key, defaultVal) {
    return window.langData && window.langData[key] ? window.langData[key] : defaultVal;
  };

  modules.ui.updateLastShowClass = function (childrens) {
    for (var i = childrens.length - 1; i >= 0; i--) {
      var display = childrens[i].style.display;
      if (display === '' || display === 'block') {
        $(childrens[i]).addClass('last_show').siblings().removeClass('last_show');
        return;
      }
    }
  };

  modules.ui.updateRoutePosUI = function (domUtils, $container, posType, info) {
    var selector = '.' + posType + '-info';
    var hasValidPos = info && (info.lon || info.lat);

    domUtils.find($container, selector + ' .empty_pos')[hasValidPos ? 'hide' : 'show']();
    domUtils.find($container, selector + ' .posInfo')[hasValidPos ? 'show' : 'hide']();

    if (hasValidPos) {
      domUtils.find($container, selector + ' .name').text(info.name || info.text || '');
      domUtils.find($container, selector + ' .address').text(info.address || '');
      if (posType === 'startpos') {
        domUtils.find($container, selector + ' .floor-name').text(info.floorName || '');
      }
    }
  };
})(window);
