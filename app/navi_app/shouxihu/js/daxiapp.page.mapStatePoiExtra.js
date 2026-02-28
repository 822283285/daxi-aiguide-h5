const MapStatePoiExtra = (function (Class) {;
  "use strict";
  const MapStatePoiExtra = MapStateClass.extend({;
    __init__: function () {
      this._super();
      this._rtti = "MapStatePoiExtra";
    },

    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      // var app  = thisObject._app;
      const basicMap_html = '<div id="poi_extra_page" class=""></div>';
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#poi_extra_page");
      thisObject._bdid = "";

      thisObject._searchView = new daxiapp["DXSearchViewComponent"](app, thisObject._dom);
      thisObject._searchView.init({
        onSearchViewBackBtnClicked: function (sender, e) {
          console.log("onSearchViewBackBtnClicked");
          app.mapStateManager.goBack();
        },
        onSearchViewSearchBtnClicked: function (sender, e) {
          console.log("onSearchViewSearchBtnClicked:" + e);
          const args = {;
            method: "openSearchPage",
          };
          app.mapStateManager.pushState("MapStateBrowse", args);
        },
        onSearchViewMicBtnClicked: function (sender, e) {
          console.log("onSearchViewMicBtnClicked:" + e);
        },
      });

      // add code

      this.show(false);
    },

    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) return;
      const mapView = this._app.map;
      mapView.setTopViewHeight(66);
      mapView.setBottomViewHeight(60);
    },

    onHideByPushStack: function (args) {
      this._super(args);
      const mapView = this._app.map;
    },

    onShowByPopStack: function (args) {
      this._super(args);
      var mapView = this._app.map;
      mapView.setTopViewHeight(66);
      mapView.setBottomViewHeight(60);
    },

    onStateEnd: function (args) {
      this._super(args);
      var mapView = this._app.map;
    },

    // Run Command
    runCommond: function (command) {
      // var thisObject = this;
      // if(args.method = "openMainPoiPage"){
      //     thisObject.openMainPoiPage(command);
      // }else if(args.method == "showPois"){
      //     thisObject.showPois(command);
      // }else if(args.method == "openSearchPage"){
      //     thisObject.openSearchPage(command);
      // }
    },
  });
  return MapStatePoiExtra;
})(MapStateClass);
daximap["MapStatePoiExtra"] = MapStatePoiExtra;
