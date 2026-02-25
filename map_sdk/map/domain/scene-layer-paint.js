(function (global) {
  var daximap = (global.DaxiMap = global.DaxiMap || {});
  var modules = (daximap.SceneModules = daximap.SceneModules || {});
  modules.domain = modules.domain || {};

  modules.domain.getDefPaintByType = function (type) {
    var result = {};
    switch (type) {
      case 'background':
        result = {
          'background-color': ['any', ['get', 'background-color'], '#25adff'],
          'background-opacity': ['any', ['get', 'background-opacity'], 1],
          visibility: ['!=', ['get', 'visible'], false, 'visible', 'none'],
        };
        break;
      case 'fill':
        result = {
          'fill-color': ['any', ['get', 'fill-color'], '#25adff'],
          'fill-opacity': ['any', ['get', 'opacity'], 1],
          'fill-outline-color': ['any', ['get', 'outline-color'], '#909091'],
          visibility: ['!=', ['get', 'visible'], false, 'visible', 'none'],
        };
        break;
      case 'line':
        result = {
          'line-bur': ['any', ['get', 'line-blur'], 0],
          'line-cap': ['any', ['get', 'line-cap'], 'round'],
          'line-color': ['any', ['get', 'line-color'], '#25adff'],
          'line-opacity': ['any', ['get', 'line-opacity'], 1],
          'line-dasharray': ['any', ['get', 'line-dasharray'], [0, 0]],
          'line-gradient': ['get', 'line-gradient'],
          'line-join': ['any', ['get', 'line-join'], 'round'],
          'line-sort-key': ['any', ['get', 'line-key'], 1],
          'line-width': ['any', ['get', 'line-width'], 6],
          visibility: ['!=', ['get', 'visible'], false, 'visible', 'none'],
        };
        break;
      case 'symbol':
        result = {
          'icon-allow-overlap': ['!=', ['get', 'allow-overlap'], true, false, true],
          'icon-anchor': ['any', ['get', 'line-anchor'], 'center'],
          'icon-image': ['get', 'line-image'],
          'icon-opacity': ['any', ['get', 'line-opacity'], 1],
          'icon-padding': ['number', ['get', 'icon-padding'], 0],
          'icon-rotation': ['get', 'rotation'],
          'icon-size': ['any', ['get', 'icon-size'], 1],
          'icon-text-fit-padding': ['any', ['get', 'icon-text-fit-padding'], [0, 0, 0, 0]],
          'text-rotation-alignment': 'viewport',
          'text-field': ['string', ['get', 'text'], ''],
          'text-size': ['number', ['get', 'text-size'], 14],
          'text-padding': ['number', ['get', 'text-padding'], 2],
          'text-halo-color': ['get', 'bgcolor'],
          'text-halo-width': 10,
        };
        break;
      default:
        break;
    }
    return result;
  };
})(window);
