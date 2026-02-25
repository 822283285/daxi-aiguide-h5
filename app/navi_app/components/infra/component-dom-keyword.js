(function (global) {
  var daxiapp = (global.DaxiApp = global.DaxiApp || {});
  var modules = (daxiapp.ComponentModules = daxiapp.ComponentModules || {});
  modules.infra = modules.infra || {};

  modules.infra.getKeyword = function (domUtils, container, selector) {
    var input_text;
    if (selector) {
      input_text = domUtils.find(container, selector);
    } else {
      input_text = domUtils.find(container, '.input_text');
      if (!input_text || !input_text.length) {
        input_text = domUtils.find(container, '.dx_input');
      }
      if (!input_text || !input_text.length) {
        input_text = domUtils.find(container, 'input');
      }
    }
    var val = domUtils.val(input_text, '');
    return typeof val === 'string' ? val.trim() : '';
  };
})(window);
