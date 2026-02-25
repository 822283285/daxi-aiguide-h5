(function (global) {
  var daxiapp = (global.DaxiApp = global.DaxiApp || {});
  var modules = (daxiapp.ComponentModules = daxiapp.ComponentModules || {});
  modules.domain = modules.domain || {};

  modules.domain.getPoiData = function (ele) {
    var $ele = $(ele);
    var getBdid = global.DxApp._mapView._mapSDK._getCurrentBuilding;
    var poiId = String($ele.data('poiid') || $ele.data('poi') || $ele.attr('data-id') || '');
    var id = String($ele.attr('data-id') || poiId || '');
    return {
      id: id,
      poiId: poiId,
      name: String($ele.data('name') || $ele.attr('data-name') || ''),
      address: String($ele.data('address') || $ele.attr('data-address') || ''),
      floorId: String($ele.data('floorid') || $ele.attr('data-floorid') || ''),
      lon: parseFloat($ele.data('lon') || $ele.attr('data-lon') || 0),
      lat: parseFloat($ele.data('lat') || $ele.attr('data-lat') || 0),
      bdid: String($ele.data('bdid') || getBdid() || ''),
      code: String($ele.data('code') || ''),
      barcode: String($ele.data('barcode') || ''),
      category: $ele.data('category'),
      detailed: $ele.data('detailed') || 0,
    };
  };
})(window);
