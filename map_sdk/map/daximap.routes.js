var daximap = window["DaxiMap"] || {};
var DXMapRouteStep = (function (Class) {
  "use strict";
  var DXMapRouteStep = Class.extend({
    __init__: function (options) {
      this._rtti = "DXMapRouteStep";
      this._routeState = 3;
      this._routeStepIndex = -1;
      this._routeData = null;
      this._tripMode = 0;
      this._isFinished = false;
      this._naviManager = null;
      this._listener = null;
      this._options = options;
    },

    initialize: function (naviManager, listener, index) {
      this._naviManager = naviManager;
      this._listener = listener;
      this.index = index;
    },

    start: function () {},

    stop: function () {},

    pause: function () {},

    resume: function () {},

    show: function () {},

    addToMap: function () {},

    removeFromMap: function () {},

    zoomToSpan: function () {},

    getLatLonBoundary: function () {
      return null;
    },
    getTripMode: function () {
      return this._tripMode;
    },
    getStartInfo: function () {
      return this._routeData["startpoint"];
    },
    getEndInfo: function () {
      return this._routeData["endpoint"];
    },
    processLocationChanged: function (locationResult) {
      if (this._curRouteStep !== null) {
        this._curRouteStep.processLocationChanged(locationResult);
      }
    },
  });
  return DXMapRouteStep;
})(Class);
daximap["DXMapRouteStep"] = DXMapRouteStep;

var DXMapRoute = (function (Class) {
  "use strict";
  var DXMapRoute = Class.extend({
    __init__: function (options) {
      this._rtti = "DXMapRoute";
      this._routeStepArray = [];
      this._curRouteStep = null;
      this._tipMessage = "";
      this._stopId = "";
      this._caution = "";
      this._jsonStirng = "{}";
      this._curRouteStepIndex = -1;
      this._isFinished = false;
      this._options = options;
    },

    initialize: function () {},
    getNextOutDoorIndoorChangeStep: function () {
      var routeStepArray = this._routeStepArray;
      var nextStepIndex = this._curRouteStepIndex + 1;
      var nextStep = routeStepArray[nextStepIndex];
      if (nextStep._tripMode == 3) {
        return nextStep;
      } else {
        for (
          var i = nextStepIndex + 1, len = routeStepArray.length;
          i < len;
          i++
        ) {
          var _step = routeStepArray[i];
          if (_step._tripMode == 3) {
            return routeStepArray[i]; //routeStepArray[i-1];
          }
        }
      }
    },
    getNextOutDoorIndoorChangeStepIndex: function () {
      var routeStepArray = this._routeStepArray;
      var nextStepIndex = this._curRouteStepIndex + 1;
      var nextStep = routeStepArray[nextStepIndex];
      if (nextStep._tripMode == 3) {
        return nextStepIndex;
      } else {
        for (
          var i = nextStepIndex + 1, len = routeStepArray.length;
          i < len;
          i++
        ) {
          var _step = routeStepArray[i];
          if (_step._tripMode == 3) {
            return i;
          }
        }
        return routeStepArray.length - 1;
      }
    },
    resetStep: function () {
      this._curRouteStep = null;
      this._curRouteStepIndex = -1;
    },

    activeStep: function (stepIndex, segRouteType, naviOption) {
      var ROUTE_HAS_NONE = 0,
        ROUTE_HAS_HEAD = 1,
        ROUTE_HAS_TAIL = 2,
        ROUTE_HAS_HEAD_TAIL = 3;
      if (this._curRouteStep != null) {
        this._curRouteStep.stop();
      }
      if (this._routeStepArray.length > stepIndex) {
        this._curRouteStep = this._routeStepArray[stepIndex];
        this._curRouteStepIndex = stepIndex;
        var segmentRouteType =
          segRouteType ||
          (this._curRouteStep._options &&
          this._curRouteStep._options["naviRouteType"] != undefined
            ? this._curRouteStep._options["naviRouteType"]
            : stepIndex == 0
            ? this._routeStepArray.length == 1
              ? ROUTE_HAS_HEAD_TAIL
              : ROUTE_HAS_HEAD
            : this._routeStepArray.length == stepIndex + 1
            ? ROUTE_HAS_TAIL
            : ROUTE_HAS_NONE);
        this._curRouteStep.start(segmentRouteType, naviOption);
      } else {
        this.onMapRouteFinished();
      }
    },
    getCurrentMapStep: function () {
      return this._curRouteStep;
    },
    getNextMapStep: function () {
      if (this._routeStepArray.length > this._curRouteStepIndex + 1) {
        return this._routeStepArray[this._curRouteStepIndex + 1];
      }
    },
    getCurrentIndex: function () {
      return this._curRouteStepIndex;
    },
    getSegmentCount: function () {
      return this._routeStepArray.length;
    },
    isFinished: function () {
      return this._isFinished;
    },
    isLastSegment: function () {
      return this._curRouteStepIndex + 1 == this._routeStepArray.length;
    },
    start: function () {},

    stop: function (isFarAway) {
      if (this._curRouteStep != null) {
        this._curRouteStep.stop(isFarAway);
      }
    },

    pause: function () {
      if (this._isFinished) return;
      if (this._curRouteStep != null) {
        this._curRouteStep.pause();
      }
    },

    resume: function () {
      if (this._isFinished) return;
      if (this._curRouteStep != null) {
        this._curRouteStep.resume();
      }
    },

    addToMap: function () {
      for (var stepIndx in this._routeStepArray) {
        this._routeStepArray[stepIndx].addToMap();
      }
    },

    removeFromMap: function (args) {
      for (var stepIndx in this._routeStepArray) {
        this._routeStepArray[stepIndx].removeFromMap();
      }
    },

    zoomToSpan: function (command) {},

    processLocationChanged: function (locationResult) {
      if (this._curRouteStep !== null) {
        this._curRouteStep.processLocationChanged(locationResult);
      }
    },

    onMapRouteFinished: function () {
      this._isFinished = true;
    },
  });

  daximap.defineProperties(DXMapRoute.prototype, {
    /**
     * 当前Step的数量
     * @type String
     * @memberof DXMapRoute.prototype
     */
    stepCount: {
      get: function () {
        return this._routeStepArray.length;
      },
    },

    /**
     * 当前的RouteStep的索引
     * @type String
     * @memberof DXMapRoute.prototype
     */
    curStepIndex: {
      get: function () {
        return this._curRouteStepIndex;
      },
    },
  });
  return DXMapRoute;
})(Class);
daximap["DXMapRoute"] = DXMapRoute;

var DXMapIndoorRouteStep_Simulate = (function (DXMapRouteStep) {
  "use strict";
  var DXMapIndoorRouteStep_Simulate = DXMapRouteStep.extend({
    __init__: function (options) {
      this["_super"](options);
      this._rtti = "DXMapIndoorRouteStep_Simulate";
      this._tripMode = 3;
    },

    start: function (routeType) {
      this["_super"]();
      this._isFinished = false;
      if (this._routeData != null) {
        var indoorNavi = this._naviManager._indoorNaviManager;

        indoorNavi.setIsSimulate(true);
        indoorNavi.setRoute(this._routeData, routeType, this._options);
        indoorNavi.registerCallback(this._naviManager._mapRoutesListener);
        indoorNavi.startSimulate(routeType);
      }
    },

    stop: function () {
      this["_super"]();
      var indoorNavi = this._naviManager._indoorNaviManager;
      indoorNavi.exitNavi();
      if (this._listener && this._listener["onRouteStepStop"]) {
        this._listener["onRouteStepStop"]();
      }
    },

    pause: function () {
      this["_super"]();
      var indoorNavi = this._naviManager._indoorNaviManager;
      indoorNavi.pauseNavi();
      if (this._listener && this._listener["onRouteStepPause"]) {
        this._listener["onRouteStepPause"]();
      }
    },

    resume: function () {
      this["_super"]();
      var indoorNavi = this._naviManager._indoorNaviManager;
      indoorNavi.resumeNavi();
      if (this._listener && this._listener["onRouteStepResume"]) {
        this._listener["onRouteStepResume"]();
      }
    },
  });
  return DXMapIndoorRouteStep_Simulate;
})(DXMapRouteStep);
daximap["DXMapIndoorRouteStep_Simulate"] = DXMapIndoorRouteStep_Simulate;

var DXMapIndoorRouteStep_Navigation = (function (DXMapRouteStep) {
  "use strict";
  var DXMapIndoorRouteStep_Navigation = DXMapRouteStep.extend({
    __init__: function (options) {
      this["_super"](options);
      this._rtti = "DXMapIndoorRouteStep_Navigation";
      this._tripMode = 3;
    },

    start: function (routeType, naviOption) {
      this["_super"]();
      this._isFinished = false;
      if (this._routeData != null) {
        var indoorNavi = this._naviManager._indoorNaviManager;
        indoorNavi.setIsSimulate(false);
        indoorNavi.setRoute(this._routeData, routeType, this._options);
        indoorNavi.registerCallback(this._naviManager._mapRoutesListener);
        indoorNavi.startNavigation(routeType, naviOption);
      }
    },

    stop: function (isFarAway) {
      this["_super"]();
      var indoorNavi = this._naviManager._indoorNaviManager;
      indoorNavi.exitNavi(isFarAway);
      if (this._listener && this._listener["onRouteStepStop"]) {
        this._listener["onRouteStepStop"]();
      }
    },

    pause: function () {
      this["_super"]();
      var indoorNavi = this._naviManager._indoorNaviManager;
      indoorNavi.pauseNavi();
      if (this._listener && this._listener["onRouteStepPause"]) {
        this._listener["onRouteStepPause"]();
      }
    },

    resume: function () {
      this["_super"]();
      var indoorNavi = this._naviManager._indoorNaviManager;
      indoorNavi.resumeNavi();
      if (this._listener && this._listener["onRouteStepResume"]) {
        this._listener["onRouteStepResume"]();
      }
    },

    processLocationChanged: function (locationResult) {
      if (this._isFinished) return;
      this["_super"](result);
      if (locationResult.bdid != this._bdid) {
        if (this._listener && this._listener["onRouteStepStopFinished"]) {
          this._listener["onRouteStepStopFinished"]();
        }
      }
    },
  });
  return DXMapIndoorRouteStep_Navigation;
})(DXMapRouteStep);
daximap["DXMapIndoorRouteStep_Navigation"] = DXMapIndoorRouteStep_Navigation;

var DXMapDriveRouteStep_Simulate = (function (DXMapRouteStep) {
  "use strict";
  var DXMapDriveRouteStep_Simulate = DXMapRouteStep.extend({
    __init__: function (options) {
      this["_super"](options);
      this._rtti = "DXMapDriveRouteStep_Simulate";
      this._tripMode = 0;
    },

    start: function () {
      this["_super"]();
    },

    stop: function () {
      this["_super"]();
    },
  });
  return DXMapDriveRouteStep_Simulate;
})(DXMapRouteStep);
daximap["DXMapDriveRouteStep_Simulate"] = DXMapDriveRouteStep_Simulate;

var DXMapDriveRouteStep_Navigation = (function (DXMapRouteStep) {
  "use strict";
  var DXMapDriveRouteStep_Navigation = DXMapRouteStep.extend({
    __init__: function (options) {
      this["_super"](options);
      this._rtti = "DXMapDriveRouteStep_Navigation";
      this._tripMode = 0;
    },

    start: function (routeType) {
      this["_super"]();
      this._isFinished = false;
      var thisObject = this;
      if (window["wx"]) {
        var endpoint = this._routeData["endpoint"];
        var detailEndPos = this._routeData["detail"]["arrival_point"] || {};
        window["wx"]["openLocation"]({
          latitude: parseFloat(endpoint["lat"]),
          longitude: parseFloat(endpoint["lon"]),
          scale: 14,
          name:
            endpoint["name"] ||
            detailEndPos["name"] ||
            window["langData"]["destnation"] ||
            "目的地",
          address: endpoint["address"] || "",
          success: function (res) {
            // trigger next
            thisObject._listener["onOpenTriNaviApp"] &&
              thisObject._listener["onOpenTriNaviApp"]();
          },
          fail: function (res) {
            console.log(res);
          },
        });
      }
      if (window["my"]) {
        var endpoint = this._routeData["endpoint"];
        var detailEndPos = this._routeData["detail"]["arrival_point"] || {};
        window["my"]["openLocation"]({
          latitude: parseFloat(endpoint["lat"]),
          longitude: parseFloat(endpoint["lon"]),
          scale: 14,
          name:
            endpoint["name"] ||
            detailEndPos["name"] ||
            window["langData"]["destnation"] ||
            "目的地",
          address: endpoint["address"] || "",
          success: function (res) {
            thisObject._listener["onOpenTriNaviApp"] &&
              thisObject._listener["onOpenTriNaviApp"]();
          },
          fail: function (res) {
            console.log(res);
          },
        });
      }
    },

    stop: function () {
      this["_super"]();
      if (this._listener && this._listener["onRouteStepStop"]) {
        this._listener["onRouteStepStop"]();
      }
    },
  });
  return DXMapDriveRouteStep_Navigation;
})(DXMapRouteStep);
daximap["DXMapDriveRouteStep_Navigation"] = DXMapDriveRouteStep_Navigation;
var DXMapWalkRouteStep_Simulate = (function (DXMapRouteStep) {
  "use strict";
  var DXMapWalkRouteStep_Simulate = DXMapRouteStep.extend({
    __init__: function (options) {
      this["_super"](options);
      this._rtti = "DXMapWalkRouteStep_Simulate";
      this._tripMode = 2;
    },

    start: function () {
      this["_super"]();
    },

    stop: function () {
      this["_super"]();
    },
  });
  return DXMapWalkRouteStep_Simulate;
})(DXMapRouteStep);
daximap["DXMapWalkRouteStep_Simulate"] = DXMapWalkRouteStep_Simulate;
var DXMapWalkRouteStep_Navigation = (function (DXMapRouteStep) {
  "use strict";
  var DXMapWalkRouteStep_Navigation = DXMapRouteStep.extend({
    __init__: function () {
      this["_super"]();
      this._rtti = "DXMapWalkRouteStep_Navigation";
      this._tripMode = 2;
    },

    start: function () {
      this["_super"]();
      this._isFinished = false;
      var thisObject = this;
      if (window["wx"]) {
        var endpoint = this._routeData["endpoint"];
        var detailEndPos = this._routeData["detail"]["arrival_point"] || {};
        window["wx"]["openLocation"]({
          latitude: parseFloat(endpoint["lat"]),
          longitude: parseFloat(endpoint["lon"]),
          scale: 14,
          name: endpoint["name"] || detailEndPos["name"] || "",
          address: endpoint["address"] || "",
          success: function (res) {
            // trigger next
            thisObject._listener["onOpenTriNaviApp"] &&
              thisObject._listener["onOpenTriNaviApp"]();
            console.log(res);
          },
          fail: function (res) {
            console.log(res);
          },
        });
      }
      if (window["my"]) {
        var endpoint = this._routeData["endpoint"];
        var detailEndPos = this._routeData["detail"]["arrival_point"] || {};
        window["my"]["openLocation"]({
          latitude: parseFloat(endpoint["lat"]),
          longitude: parseFloat(endpoint["lon"]),
          scale: 14,
          name:
            endpoint["name"] ||
            detailEndPos["name"] ||
            window["langData"]["destnation"] ||
            "目的地",
          address: endpoint["address"] || "",
          success: function (res) {
            thisObject._listener["onOpenTriNaviApp"] &&
              thisObject._listener["onOpenTriNaviApp"]();
          },
          fail: function (res) {
            console.log(res);
          },
        });
      }
    },

    stop: function () {
      this["_super"]();
      if (this._listener && this._listener["onRouteStepStop"]) {
        this._listener["onRouteStepStop"]();
      }
    },
  });
  return DXMapWalkRouteStep_Navigation;
})(DXMapRouteStep);
daximap["DXMapWalkRouteStep_Navigation"] = DXMapWalkRouteStep_Navigation;

var DXMapBusRouteStep_Simulate = (function (DXMapRouteStep) {
  "use strict";
  var DXMapBusRouteStep_Simulate = DXMapRouteStep.extend({
    __init__: function (options) {
      this["_super"](options);
      this._rtti = "DXMapBusRouteStep_Simulate";
      this._tripMode = 1;
    },

    start: function () {
      this["_super"]();
    },

    stop: function () {
      this["_super"]();
    },
  });
  return DXMapBusRouteStep_Simulate;
})(DXMapRouteStep);
daximap["DXMapBusRouteStep_Simulate"] = DXMapBusRouteStep_Simulate;
var DXMapBusRouteStep_Navigation = (function (DXMapRouteStep) {
  "use strict";
  var DXMapBusRouteStep_Navigation = DXMapRouteStep.extend({
    __init__: function (options) {
      this["_super"](options);
      this._rtti = "DXMapBusRouteStep_Navigation";
      this._tripMode = 1;
    },

    start: function () {
      this["_super"]();
      this._isFinished = false;
      var thisObject = this;
      if (window["wx"]) {
        var endpoint = this._routeData["endpoint"];
        var detailEndPos = this._routeData["detail"]["arrival_stop"] || {};
        window["wx"]["openLocation"]({
          latitude: parseFloat(endpoint["lat"]),
          longitude: parseFloat(endpoint["lon"]),
          scale: 14,
          name: endpoint["name"] || detailEndPos["name"] || "",
          address: endpoint["address"] || "",
          success: function (res) {
            // trigger next
            thisObject._listener["onOpenTriNaviApp"] &&
              thisObject._listener["onOpenTriNaviApp"]();
            console.log(res);
          },
          fail: function (res) {
            console.log(res);
          },
        });
      }
      if (window["my"]) {
        var endpoint = this._routeData["endpoint"];
        var detailEndPos = this._routeData["detail"]["arrival_point"] || {};
        window["my"]["openLocation"]({
          latitude: parseFloat(endpoint["lat"]),
          longitude: parseFloat(endpoint["lon"]),
          scale: 14,
          name:
            endpoint["name"] ||
            detailEndPos["name"] ||
            window["langData"]["destnation"] ||
            "目的地",
          address: endpoint["address"] || "",
          success: function (res) {
            thisObject._listener["onOpenTriNaviApp"] &&
              thisObject._listener["onOpenTriNaviApp"]();
          },
          fail: function (res) {
            console.log(res);
          },
        });
      }
    },

    stop: function () {
      this["_super"]();
      if (this._listener && this._listener["onRouteStepStop"]) {
        this._listener["onRouteStepStop"]();
      }
    },
  });
  return DXMapBusRouteStep_Navigation;
})(DXMapRouteStep);
daximap["DXMapBusRouteStep_Navigation"] = DXMapBusRouteStep_Navigation;

//DXMapSubwayRouteStep_Simulate

var DXMapSubwayRouteStep_Simulate = (function (DXMapRouteStep) {
  "use strict";
  var DXMapSubwayRouteStep_Simulate = DXMapRouteStep.extend({
    __init__: function (options) {
      this["_super"](options);
      this._rtti = "DXMapSubwayRouteStep_Simulate";
      this._tripMode = 5;
    },

    start: function () {
      this["_super"]();
    },

    stop: function () {
      this["_super"]();
    },
  });
  return DXMapSubwayRouteStep_Simulate;
})(DXMapRouteStep);
daximap["DXMapSubwayRouteStep_Simulate"] = DXMapSubwayRouteStep_Simulate;
var DXMapSubwayRouteStep_Navigation = (function (DXMapRouteStep) {
  "use strict";
  var DXMapSubwayRouteStep_Navigation = DXMapRouteStep.extend({
    __init__: function (options) {
      this["_super"](options);
      this._rtti = "DXMapSubwayRouteStep_Navigation";
      this._tripMode = 5;
    },

    start: function () {
      this["_super"]();
      this._isFinished = false;
      var thisObject = this;
      if (window["wx"]) {
        var endpoint = this._routeData["endpoint"];
        var detailEndPos = this._routeData["detail"]["arrival_stop"] || {}; //地铁
        window["wx"]["openLocation"]({
          latitude: parseFloat(endpoint["lat"]),
          longitude: parseFloat(endpoint["lon"]),
          scale: 14,
          name: endpoint["name"] || detailEndPos["name"] || "",
          address: endpoint["address"] || "",
          success: function (res) {
            // trigger next
            thisObject._listener["onOpenTriNaviApp"] &&
              thisObject._listener["onOpenTriNaviApp"]();
            console.log(res);
          },
          fail: function (res) {
            console.log(res);
          },
        });
      }
      if (window["my"]) {
        var endpoint = this._routeData["endpoint"];
        var detailEndPos = this._routeData["detail"]["arrival_point"] || {};
        window["my"]["openLocation"]({
          latitude: parseFloat(endpoint["lat"]),
          longitude: parseFloat(endpoint["lon"]),
          scale: 14,
          name:
            endpoint["name"] ||
            detailEndPos["name"] ||
            window["langData"]["destnation"] ||
            "目的地",
          address: endpoint["address"] || "",
          success: function (res) {
            thisObject._listener["onOpenTriNaviApp"] &&
              thisObject._listener["onOpenTriNaviApp"]();
          },
          fail: function (res) {
            console.log(res);
          },
        });
      }
    },

    stop: function () {
      this["_super"]();
      if (this._listener && this._listener["onRouteStepStop"]) {
        this._listener["onRouteStepStop"]();
      }
    },
  });
  return DXMapSubwayRouteStep_Navigation;
})(DXMapRouteStep);
daximap["DXMapSubwayRouteStep_Navigation"] = DXMapSubwayRouteStep_Navigation;
