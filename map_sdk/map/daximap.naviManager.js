
var NAVIGATE_DOING = 0, //正在导航
NAVIGATE_MOVEMAP = 1, //导航状态下移动地图
NAVIGATE_VIEWSETP = 2, //导航状态查看路线步骤
NAVIGATE_FULLVIEW = 3, //导航状态下查看全览
NAVIGATE_RESET = 4,
NAVIGATE_CHANGE_FLOOR = 5;

var CAMERA_ATTACHE_UNKNOWN = -1,
CAMERA_ATTACHE_NONE = 0,
CAMERA_ATTACHE_POSITION = 1,
CAMERA_ATTACHE_ROTATION = 2;


var LOCATION_LOCATION = 1,
LOCATION_SUCCESS = 2,
LOCATION_NAVIGATING = 3,
LOCATION_CLOSE = 4,
LOCATION_LOADING = 5,
LOCATION_NONAVIGATE = 6,
LOCATION_FAILURE = 7;

var SIMULATE_TYPE_ROUTE = 0,
SIMULATE_TYPE_POINT = 1;

var ROUTE_HAS_NONE = 0,
    ROUTE_HAS_HEAD = 1,
    ROUTE_HAS_TAIL = 2,
    ROUTE_HAS_HEAD_TAIL = 3;

(function (global) {
    //////////////////////////////////////////////////////////////
    // DXNavigationCore
    //////////////////////////////////////////////////////////////
    var STATE_NAVIGATE = 0, //导航模式
        STATE_FULLVIEW = 1, //全览模式
        // STATE_SHOWPOI = 2, //看地图POI
        STATE_NAVIGATE_END = 3, //导航结束
        STATE_NAVIGATE_PAUSE = 4,
        STATE_SHOWROUTE = 5;
    // STATE_SHOWPOI_LIST = 6; //显示多poi
    // STATE_SELECT_POINT = 7; //地图选点
    //路线状态
    var daxiMap = global["DaxiMap"] = global["DaxiMap"] || {};
    var DXMapUtils = daxiMap["DXMapUtils"];
    var EventHandler = daxiMap["EventHandler"];
    var DXNavigationCore = function(mapAPI,language) {
        var thisObject = this;
        thisObject.mapAPI = mapAPI;

        thisObject.language = language;
        if(language == "En"){
            thisObject.reNavigateFailedText = "Re-plan the route";
            thisObject.startNaviText = "start Navigating for you,Please follow the directions";
            thisObject.naviEndSpeakText = "You have arrived near your destination, this navigation is over, you are welcome to use indoor navigation again!";
        }else{
            thisObject.reNavigateFailedText = window["langData"]["failed:re:getroute:navi"]||"重新规划路线失败";
            thisObject.startNaviText =  window["langData"]["startnavi:tip:speak:navi"]||"开始为您导航,请沿路线指示前行";
            thisObject.naviEndSpeakText = window["langData"]["end:tip3:navi"]||"已到达目的地附近, 本次导航结束，欢迎您再次使用室内导航!";
        }
        thisObject.data = null;
        thisObject.route = null;
        thisObject.floorObjectMap = {};
        thisObject.routeSegmets = [];
        thisObject.isOpenAudio = true;
        thisObject.progressPercent = 0;
        // thisObject.indicator = null;
        thisObject.isStairsShowState = false; //楼梯等是否显示标识0
        thisObject.center = [116.393954432706, 39.88556504491212];
        thisObject.isSwipe = false; //是否滑动导航步骤
        thisObject.lastRouteCursor = -1; //上一次的导航位置
        // thisObject.locationState = LOCATION_CLOSE;
        thisObject.controller = null;
        // thisObject.naviTipInfo = tipInfo;
        thisObject.isSimulation = false;
        thisObject.speakListener = null;
        thisObject.isShowStair = false;
        thisObject.crossRoad = null;
        // 正在进行 重新规划路线
        thisObject.reNavigating = false;
        thisObject.routeState = null;
        thisObject.indicator = null;

        thisObject.delay = [3000, 2000];
        thisObject.getDataBySecurityRequest = DXMapUtils.getDataBySecurityRequest;

        var proto = DXNavigationCore.prototype;
        proto._setNaviParams = function(naviConfig){
            thisObject.token = naviConfig["token"] || daxiMap["token"] || "";
            thisObject.simulateSpeedScale = naviConfig["simulateSpeed"] || 2.0;
            thisObject.correctDistance = naviConfig["correctDistance"] || 15;
            thisObject.restartRoute = naviConfig["restartRoute"] || 22;
            thisObject.AOArestartRoute = naviConfig["AOArestartRoute"] || 22;
            thisObject.changeFloorTipDis = naviConfig["changeFloorTipDis"]||10;
            thisObject.timesMaxReNavi = naviConfig["timesMaxReNavi"] || 15000;
            thisObject.AOAtimesMaxReNavi = naviConfig["AOAtimesMaxReNavi"] || 15000;
            thisObject.timesMaxWrongWay = naviConfig["timesMaxWrongWay"] || 15000;
            thisObject.indistinctDistance = naviConfig["indistinctDistance"];
            thisObject.endNaviDistance = naviConfig["endNaviDistance"] || 6;
            thisObject.naviEndType = naviConfig["naviEndType"] || 2;
            thisObject.usingLineHeading = naviConfig["usingLineHeading"] != undefined? naviConfig["usingLineHeading"]:false;
            thisObject.naviStrictByLineDir = naviConfig["naviStrictByLineDir"] != undefined? naviConfig["naviStrictByLineDir"]:false;
            thisObject.naviSpeakType = naviConfig["naviSpeakType"];
            thisObject.naviSpeakBeforDistance = naviConfig["naviSpeakBeforDistance"] || 5;
            thisObject.naviSpeakBeforMinDistance = naviConfig["naviSpeakBeforMinDistance"] || 5;
            // thisObject.naviEndSpeakText = naviConfig["naviEndSpeakText"] || thisObject.naviEndSpeakText;
            thisObject.speakDistanceParam = naviConfig["speakDistanceParam"];
            thisObject.naviTilt = naviConfig["naviTilt"] != undefined ? naviConfig["naviTilt"]:50;
            thisObject.naviZoomLevel = naviConfig["naviZoomLevel"] || 20;
            thisObject.maxNaviZoomLevel = naviConfig["maxNaviZoomLevel"] || 21;
            if(naviConfig["startNaviText"]!=undefined){
                thisObject.startNaviText = naviConfig["startNaviText"];
            }
            if(naviConfig["naviEndSpeakText"]!=undefined){
                thisObject.naviEndSpeakText = naviConfig["naviEndSpeakText"];
            }


            thisObject.isDebug = naviConfig["isDebug"] || 0;
            thisObject.crossRoadConfig = naviConfig["crossRoad"];
            thisObject.speakLevel = naviConfig["speakLevel"] || 1;
            thisObject.speakTest = naviConfig["speakTest"] || false;
            // thisObject.minSpeakDistance = naviConfig["minSpeakDistance"]||5;
            thisObject.machineHeading = naviConfig["machineHeading"] || 0;
            thisObject.minLenSegment = naviConfig["minLenSegment"] || 5; //最小有语音的长度
            thisObject.minSpeakDistance = naviConfig["minSpeakDistance"]||10;//最小播报米数的长度
            thisObject.maxSegmentCount = naviConfig["maxSegmentCount"] || 3;
            thisObject.simulate_mMargin = naviConfig["simulate_mMargin"] ||80;
            thisObject.simulate_hMargin = naviConfig["simulate_hMargin"] || 80;
            thisObject.realNaviCanSpeak = naviConfig["realNaviCanSpeak"]!=undefined?naviConfig["realNaviCanSpeak"]:true;
            thisObject.simulateNaviCanSpeak = naviConfig["simulateNaviCanSpeak"]!=undefined?naviConfig["simulateNaviCanSpeak"]:true;
            thisObject.routeUrl = naviConfig["routeUrl"]||"https://map1a.daxicn.com/RouteServiceForMetro39/route";
            if(naviConfig["route"] && naviConfig["route"]["url"]){
                thisObject.routeUrl = naviConfig["route"]["url"];
            }
            thisObject.crossRoadUrl = naviConfig["crossRoadUrl"] ||"";
            thisObject.mapType = naviConfig["mapType"] ||"";
            thisObject.bdNaviConfig = {};
            if(naviConfig["bdNaviConfig"] && typeof naviConfig["bdNaviConfig"] =="object"){
                thisObject.bdNaviConfig = naviConfig["bdNaviConfig"];
            }
            thisObject.strategys = naviConfig["strategys"] || [{
                    "name": "default",
                    "CNname": window["langData"]["text:default:route"]||"默认路线",
                    "value": 0
                }, {
                    "name": "elevator",
                    "CNname": (window["langData"]["elevactor"]|| "电梯"),
                    "value": 1
                },
                {
                    "name": "escalator",
                    "CNname": (window["langData"]["escalator"]|| "扶梯"),
                    "value": 2
                },
                {
                    "name": "stair",
                    "CNname": (window["langData"]["stair"]|| "楼梯"),
                    "value": 3
                }
            ];

        };
        proto["setNaviParams"] = proto._setNaviParams;
        proto.init = function(config, locationManager, speakListener) {
            // var thisObject = this;
            thisObject.locationManager = locationManager;
            var naviConfig = config["naviConfig"]||config||{};
            naviConfig["token"] = naviConfig["token"]||config["token"]||"";
            config["route"] && (naviConfig["route"] = config["route"])
            thisObject._setNaviParams(naviConfig);

            thisObject.hasCrossRoad = false;
            if (thisObject.crossRoadConfig && thisObject.crossRoadConfig["hasCross"]) {
                thisObject.hasCrossRoad = true;
                thisObject.crossRoadUrl = thisObject.crossRoadConfig["crossRoadUrl"];
            }
            var route = config["route"]||{};
            thisObject.strategy = (route["strategys"] && route["strategys"]["default"]) ||0;
            thisObject.speakListener = speakListener;
            thisObject.indicator = locationManager.indicator;
            thisObject.routeResampler = DXRouteCircelSampler();
            thisObject.initEvents();
            // Create CameraContorller;
            thisObject.controller = null;
            thisObject.simulateController = new RawRouteSimulator(language);
            thisObject.simulateController.init(thisObject);

            thisObject.simulateLocationController = new LocationSimulator(language);
            thisObject.simulateLocationController.init(thisObject);

            thisObject.navigationController = new RawRouteController(language);
            thisObject.navigationController.init(thisObject);

            // Create RouteParser
            thisObject.routeParser = RawRouteParser();


        };
        proto.initializeUserLocationMarker = function(){
            var userLocationMarker = thisObject.userLocationMarker = new DaxiMap.DXUserLocationMarker(map);//DXUserLocationMarker
            // 当定位更新的时候更新LocationMarker的位置
            locationManager._on("onLocationChanged", function(sender, e){
                var loc = {
                    "lng" : e.location["x"],
                    "lat" : e.location["y"],
                    "heading" : e.location["a"],
                    "floorId" : e.location["floorId"],
                    "bdid" : e.location["bdid"],
                    "duration" : 0,
                    "callback" : function(e){

                    }
                };
                userLocationMarker.setLocation(loc);
            });


        };
        proto["init"] = proto.init;
        proto.initEvents = function() {
            thisObject.events = {};
            thisObject["eventAPI"] = {};
            thisObject.events.EventNavigationFinished = new EventHandler("NavigationFinished");
            thisObject["eventAPI"]["EventNavigationFinished"] = thisObject.events.EventNavigationFinished;
            thisObject.events.EventNavigationExited = new EventHandler("NavigationExited");
            thisObject["eventAPI"]["EventNavigationExited"] = thisObject.events.EventNavigationExited;
            //偏离导航
            thisObject.events.EventNavigationReset = new EventHandler("NavigationRest");
            thisObject["eventAPI"]["EventNavigationReset"] = thisObject.events.EventNavigationReset;
            // thisObject.events.EventLocationStateChanged = thisObject.locationManager.events.EventLocationStateChanged;//new EventHandler("LocationStateChanged");
            thisObject["eventAPI"]["EventLocationStateChanged"] = thisObject.events.EventLocationStateChanged;
            thisObject.events.EventRouteCreated = new EventHandler("RouteCreated");
            thisObject["eventAPI"]["EventRouteCreated"] = thisObject.events.EventRouteCreated;
            thisObject.events.EventPoiCreated = new EventHandler("PoiCreated");
            // thisObject.events.EventMapStatusChanged = new EventHandler("MapStatusChanged");
            thisObject.events.EventShowFloorChanger = new EventHandler("ShowFloorChanger");
            thisObject["eventAPI"]["EventShowFloorChanger"] = thisObject.events.EventShowFloorChanger;
            thisObject.events.EventHideFloorChanger = new EventHandler("HideFloorChanger");
            thisObject["eventAPI"]["EventHideFloorChanger"] = thisObject.events.EventHideFloorChanger;
            // 导航切换楼层
            thisObject.events.EventFloorChangeData = new EventHandler("FloorChangeData");
            thisObject["eventAPI"]["EventFloorChangeData"] = thisObject.events.EventFloorChangeData;
            //路口放大图
            thisObject.events.EventShowPreRoadCross = new EventHandler("PreShowRoadCross");
            thisObject["eventAPI"]["EventShowPreRoadCross"] = thisObject.events.EventShowPreRoadCross;
            thisObject.events.EventShowRoadCross = new EventHandler("ShowRoadCross");
            thisObject["eventAPI"]["EventShowRoadCross"] = thisObject.events.EventShowRoadCross;

            thisObject.events.EventRenavigation = new EventHandler("Renavigation");
            thisObject["eventAPI"]["EventRenavigation"] = thisObject.events.EventRenavigation;
            // thisObject.events.EventFloorChanged = new EventHandler("FloorChanged");
            thisObject.events.EventPositionChanged = new EventHandler("PositionChanged");
            thisObject["eventAPI"]["EventPositionChanged"] = thisObject.events.EventPositionChanged;

            thisObject.events.EventRouteSuccess = new EventHandler("RouteSuccess");
            thisObject["eventAPI"]["EventRouteSuccess"] = thisObject.events.EventRouteSuccess;
            thisObject.events.EventRoutePlanningSuccess = new EventHandler("RoutePlanningSuccess");
            thisObject["eventAPI"]["EventRoutePlanningSuccess"] = thisObject.events.EventRoutePlanningSuccess;
            thisObject.events.EventRouteResting = new EventHandler("EventRouteResting");
            thisObject["eventAPI"]["EventRouteResting"] = thisObject.events.EventRouteResting;
            //navigation info events
            thisObject.events.EventNaviStatusChanged = new EventHandler("EventNaviStatusChanged");
            thisObject["eventAPI"]["EventNaviStatusChanged"] = thisObject.events.EventNaviStatusChanged;
            thisObject.events.EventNaviClearSegment = new EventHandler("EventNaviClearSegment");
            thisObject["eventAPI"]["EventNaviClearSegment"] = thisObject.events.EventNaviClearSegment;
            thisObject.events.EventNaviAddSegment = new EventHandler("EventNaviAddSegment");
            thisObject["eventAPI"]["EventNaviAddSegment"] = thisObject.events.EventNaviAddSegment;
            thisObject.events.EventNaviSetSegmentsData = new EventHandler("EventNaviSetSegmentsData");
            thisObject["eventAPI"]["EventNaviSetSegmentsData"] = thisObject.events.EventNaviSetSegmentsData;
            thisObject.events.EventNaviPositionInfoChanged = new EventHandler("EventNaviPositionInfoChanged");
            thisObject["eventAPI"]["EventNaviPositionInfoChanged"] = thisObject.events.EventNaviPositionInfoChanged;
            thisObject.events.EventNaviSegmentChanged = new EventHandler("EventNaviSegmentChanged");
            thisObject.events["EventNaviSegmentChanged"] = thisObject.events.EventNaviSegmentChanged;
        };
        proto.setGetDataBySecurityRequest = function(method) {
            thisObject.getDataBySecurityRequest = method;
        };
        proto["setGetDataBySecurityRequest"] = proto.setGetDataBySecurityRequest;
        proto.setStrategys = function(strategys) {
            thisObject.strategys = strategys;
        };
        proto["setStrategys"] = proto.setStrategys;
        proto.getStrategy = function() {
            return thisObject.strategys;
        };
        proto["getStrategys"] = proto.getStrategys;
        proto._setSimulatorNaviSpeed = function(speed){
            thisObject.simulateController.setSpeedScale(speed);
        };
        proto["setEndNaviDistance"] = function(distance){
            thisObject.endNaviDistance = distance;
        };

        proto.setContorller = function() {
            // var thisObject = this;
            if (!thisObject.getIsSimulate()) {
                thisObject.controller = thisObject.navigationController;
            } else {

                if (thisObject.getNaviStatus() == STATE_NAVIGATE || thisObject.getNaviStatus() == STATE_NAVIGATE_PAUSE) {
                    thisObject.controller = thisObject.simulateController;

                } else {
                    thisObject.controller = thisObject.simulateLocationController;
                }
            }
        };
        proto["setController"] = proto.setContorller;

        proto.setSpeakListener = function(listener) {
            this.speakListener = listener;
        };
        proto["setSpeakListener"] = proto.setSpeakListener;

        proto._getLocationManager = function() {
            return thisObject.locationManager;
        };

        proto.getRoute = function() {
            return this.route;
        };
        proto["getRoute"] = proto.getRoute;
        proto.getHasRouteFloors = function() {
            if (this.route && this.route.floorObjectMap) {
                var floors = Object.keys(this.route.floorObjectMap);
                return floors;
            } else {
                return null;
            }

        };
        proto["getHasRouteFloors"] = proto.getHasRouteFloors;

        proto.getCameraCtrl = function() {
            return this.mapAPI.cameraCtrl;
        };

        proto.setIsSimulate = function(pVal) {
            this.isSimulation = pVal;
        };
        proto["setIsSimulate"] = proto.setIsSimulate;

        proto.getIsSimulate = function() {
            return this.isSimulation;
        };
        proto["getIsSimulate"] = proto.getIsSimulate;


        proto.setNaviStatus = function(status,attachMode,tilt) {
            if (thisObject.naviStatus === status) return;
            thisObject.naviStatus = status;
            thisObject.events.EventNaviStatusChanged._notifyEvent(status);
            if(status!=0){
                thisObject.indicator && thisObject.indicator._hideRealPosInfo();
            }

        };

        proto.getNaviStatus = function() {
            return this.naviStatus;
        };
        proto["getNaviStatus"] = proto.getNaviStatus;

        proto.setSwiped = function(pVal) {
            this.isSwipe = pVal;
        };

        proto.pauseNavigation = function() {
            if (thisObject.controller && thisObject.getNaviStatus() == STATE_NAVIGATE) {
                thisObject.setNaviStatus(STATE_NAVIGATE_PAUSE);
                thisObject.controller.pause();
                // thisObject.events.EventNaviStatusChanged._notifyEvent(STATE_NAVIGATE_PAUSE);
            }
        };
        proto["pauseNavigation"] = proto.pauseNavigation;
        proto.resumeNavigation = function(attachMode,tilt) {
            if (thisObject.controller && (thisObject.getNaviStatus() == STATE_NAVIGATE_PAUSE)) {
                thisObject.setNaviStatus(STATE_NAVIGATE,attachMode,tilt);
                var zoomLevel = thisObject.mapAPI._getZoomLevel();
                if(zoomLevel > thisObject.naviZoomLevel){
                    thisObject.mapAPI._setZoomLevel(thisObject.naviZoomLevel);
                }
                if(tilt){
                    thisObject.mapAPI._setTilt(tilt);
                }else{
                    var currTilt = thisObject.mapAPI._getTilt();
                    if(currTilt > thisObject.naviTilt){
                        thisObject.mapAPI._setTilt(thisObject.naviTilt);
                    }
                }
                thisObject.controller.resume();

                // thisObject.events.EventNaviStatusChanged._notifyEvent(STATE_NAVIGATE);
            }
        };
        proto["resumeNavigation"] = proto.resumeNavigation;
        proto.restoreNavigationProgress = function() {
            // var thisObject = this;
            if (thisObject.lastRouteCursor !== -1 && thisObject.lastRouteCursor >= 2) {
                thisObject.route.currentCursor = thisObject.lastRouteCursor;
                thisObject.lastRouteCursor = -1;
                if (thisObject.route.currentCursor !== -1) {
                    thisObject.route.updateInfo(thisObject.route.currentCursor);
                }
            } else {
                var indicator = thisObject.locationManager.indicator;
                var pos = indicator.getPosition();
                var floorId = indicator.getFloorId();
                var position = { pos: pos, floorId: floorId };
                var result = { minDistance: 999999, targetDistance: 0, index: -1 };
                thisObject.route.getNearestStation(position, result);
                thisObject.route.currentCursor = result.index;
            }
        };
        proto["restoreNavigationProgress"] = proto.restoreNavigationProgress;

        proto.saveNavigationProgress = function() {
            // var thisObject = this;
            var naviRoute = thisObject.route;
            if (!thisObject.isSwipe) {
                thisObject.lastRouteCursor = naviRoute.currentCursor;
            }
        };
        proto["saveNavigationProgress"] = proto.saveNavigationProgress;

        proto.onNavigationFinished = function(sender, data) {
            if(thisObject.speakListener && (thisObject.routeState == 3 || thisObject.routeState == 2)){
                var len = thisObject.speakListener.textQueue.length;
                thisObject.speakListener.speakNext(len - 1);
            }

            thisObject.setNaviStatus(STATE_NAVIGATE_END);
            // thisObject.events.EventNaviStatusChanged._notifyEvent(STATE_NAVIGATE_END);
            thisObject.events.EventNavigationFinished._notifyEvent(data);
        };

        proto.isStairsShow = function() {
            return thisObject.isShowStair;
        };

        proto.floorChangerShow = function(showStair) {
            if (thisObject.isShowStair == showStair) {
                return;
            } else {
                thisObject.events.EventShowFloorChanger._notifyEvent( showStair);
                thisObject.isShowStair = showStair;
            }

        };
        proto.setFloorChangeData = function(data) {
            thisObject.events.EventFloorChangeData._notifyEvent( data);
        };
        proto.showCrossRoad = function(showCrossRoad) {
            if (thisObject.crossRoad == showCrossRoad) {
                return;
            } else {
                thisObject.events.EventShowRoadCross._notifyEvent( showCrossRoad);
                thisObject.crossRoad = showCrossRoad;
            }
        };
        //播报语音& segment变化
        proto.updateRouteInfo = function(index, isGray, targetDistance,station,speakType,callback) {
            // return;
            //导航 过程节点变化
            // var thisObject = this;
            var nextSpeakIndex = index; //+ 2;
            var speakText = "";
            if(thisObject.speakListener){
                if(!station || !station.speaked){
                    if (thisObject.getNaviStatus() === STATE_NAVIGATE && index >= 2) { //导航中状态语音
                        thisObject.speakListener.speakNext(index,targetDistance,speakType,callback);
                    }
                }
                var speakText = thisObject.speakListener.getSpeakText(nextSpeakIndex,speakType);
            }
            var retObj = {
                "index":nextSpeakIndex,
                "speakText":speakText
            }
            thisObject.events.EventNaviSegmentChanged._notifyEvent(retObj);
        };

        proto.updateNaviProgressInfo = function(data) {
            //导航过程 信息变化
            if (!thisObject.lastNaviProgress || (thisObject.lastNaviProgress["lastDistance"] != data["lastDistance"])) {
                thisObject.lastNaviProgress = data;
                thisObject.events.EventNaviPositionInfoChanged._notifyEvent(data);
            }
        };

        proto.addSegment = function(segmentInfo) {
            thisObject.routeSegmets.push(segmentInfo);
            thisObject.events.EventNaviAddSegment._notifyEvent( segmentInfo);

        };
        proto.clearRouteSegment = function() {
            thisObject.routeSegmets = [];
            thisObject.events.EventNaviClearSegment._notifyEvent( []);
        };
        proto.setSegments = function(segments) {
            thisObject.routeSegmets = segments;
            thisObject.events.EventNaviSetSegmentsData._notifyEvent( segments);
        };


        proto.getCacheRouteInfo = function() {
            return thisObject.routeCache.routeEndInfo();
        };
        // line path
        proto._routePath = function(params, scb, fcb, requestAPI) {
            var startPoint = params["startPoint"];
            var endPoint = params["endPoint"];
            if (!startPoint || !startPoint["lon"] || !startPoint["lat"] || (params["routeType"]!=9 && (!endPoint||!endPoint["lon"] || !endPoint["lat"]))
                ) {
                fcb && fcb({ "error": window["langData"]["imperfect:route:params:tip"]||"起点、终点相关信息不能为空！" });
                return false;
            }
            thisObject.calculateRoute(params, scb, fcb, requestAPI);
        };
        proto["routePath"] = proto._routePath;
        proto.createRoute = function(data, options) {
            thisObject.routeState = options["routeType"] != undefined?options["routeType"]:ROUTE_HAS_HEAD_TAIL;
            if (data["code"] == 0) {
                thisObject.route = thisObject.routeParser.createRoute(thisObject, data["data"],thisObject.routeState,{"language":thisObject.language,"speakLevel":options["speakLevel"]});
                routeList = data["data"]["route"][0]["path"]["naviInfoList"];
                if (routeList.length) {
                    var startFloorRoute = routeList[0];
                    var geometry = startFloorRoute["geometry"];
                    var floorId = startFloorRoute["floor"];
                    thisObject.mapAPI._gotoViewData(geometry, floorId);
                }
                thisObject.events.EventRoutePlanningSuccess._notifyEvent( { "route": thisObject.route, "type": "navigation" });
            } else {
                thisObject.route = undefined;
            }
            return thisObject.route;
        };
        proto["createRoute"] = proto.createRoute;
        proto.createLines = function(floorId, lines, routeState) {
            thisObject.route = thisObject.routeParser.createLines(thisObject, floorId, lines, routeState);
        };
        proto["createLines"] = proto.createLines;

        proto.calculateRoute = function(params, callbackRouteAndCrossFinished, fcb, requestAPI) {
            var token = params["token"]||thisObject.token||"";
            proto.routeInfo = thisObject.routeCache.routeEndInfo();
            var startPoint = params["startPoint"];
            var endPoint = params["endPoint"];
            var options = params["options"]||{};

            if(!options["token"]){
                options["token"] = token;
            }else {
                token = options["token"];
            }
            for(var key in params){
                if(key != "startPoint" && key != "endPoint"){
                    options[key] = params[key];
                }
            }
            endPoint && thisObject.routeInfo.set(endPoint["bdid"]||"",endPoint["floorId"]||"",[ endPoint['lon'], endPoint['lat'],],endPoint,options);
            if (options && options["routeState"]) {
                thisObject.routeState = options["routeState"];
            } else {
                thisObject.routeState = ROUTE_HAS_HEAD_TAIL;
            }
            var url =params["url"]|| params["routeUrl"]||thisObject.routeUrl;
            var beaconGroupId = options && options["beaconGroupId"];
            var strategy = (options && options["strategy"]) || thisObject.strategy || "0";
            if(startPoint["bdid"]){
                startPoint["idtype"] = 3;
            }
            if(endPoint && endPoint["bdid"]){
                endPoint["idtype"] = 3;
            }
            if(endPoint){
                var dis = DXMapUtils["naviMath"].getGeodeticCircleDistance({ x: startPoint["lon"], y: startPoint["lat"] }, {x:endPoint["lon"],y:endPoint["lat"]});
                var defaultType = 2;
                if(dis > 10000){
                    defaultType = 0;
                    if(startPoint["idtype"] == 2){
                        startPoint["idtype"] = 0;
                    }
                    if(endPoint && endPoint["idtype"] == 2){
                        endPoint["idtype"] = 0;
                    }
                }
            }

            var wayPoints = params["wayPoints"]||'';
            var data = {
                'token':token,
                'startfloor': startPoint["floorId"],
                'startx': startPoint["lon"],
                'starty': startPoint["lat"],
                'startbdid':startPoint["bdid"]||"",
                'startidtype':startPoint["idtype"]||defaultType,
                'stopx': endPoint && endPoint['lon'],
                'stopy': endPoint && endPoint['lat'],
                'stopbdid':endPoint && endPoint["bdid"]||"",
                'stopfloor':endPoint && endPoint["floorId"]||"",
                'stopidtype':endPoint && endPoint["idtype"]||defaultType,
                'stopid': endPoint && endPoint['poiId'],
                'charset': 'utf-8',
                'startTransitId': beaconGroupId,
                "includeStartEnd":params["includeStartEnd"]||options["includeStartEnd"],
                'routeType':params["routeType"]||options["routeType"]||0, //默认步行 可选车行等
                "strategy":params["strategy"]||options["strategy"]||0,
                "resType": params["routeType"] == 9?"combine":''
            };
            if(params["checkKeyPoints"]){
                data["checkKeyPoints"] = params["checkKeyPoints"];
            }
            if(params["transittype"] != undefined){
                data["transittype"] = params["transittype"]||options["transittype"];
            }
            if(wayPoints){
                data['wayPoints'] = JSON.stringify(wayPoints);//途经点
            }
            if(params["wayPointsSorted"]){
                data['wayPointsSorted']=params["wayPointsSorted"]||false;
            }
            if(params["lang"]){
                data['lang']=params["lang"];
            }
            if(params["strictMappingLine"]){
                data['strictMappingLine']=params["strictMappingLine"];
            }
            if(params["groundFloorId"]){
                data['groundFloorId']=params["groundFloorId"];
            }
            if(params["shopMappingToDoor"]){
                data['shopMappingToDoor']=params["shopMappingToDoor"];
            }
            if(thisObject.hasCrossRoad || params['hasCrossRoad']){
                data["checkKeyPoints"] = true;
            }
            var successCB = function(_data) {
                if(_data["code"] == -1){
                    errorCB(_data)
                    return;
                }
                thisObject.lastRouteData = DXMapUtils.copyData(_data);
                counter = 0;
                cbParm.startPoint = startPoint;
                cbParm.endPos = endPoint;
                if(_data["route"]){
                    var _startpos = _data["route"][0]["startpoint"];
                    var _endpos = _data["route"][_data["route"].length-1]["endpoint"];
                    for(var key in startPoint){
                        _startpos[key] = startPoint[key];
                    }
                    for(var key in endPoint){
                        _endpos[key] = endPoint[key];
                    }
                }

                if(callbackRouteAndCrossFinished){
                    callbackRouteAndCrossFinished(_data)
                }else{
                    _onRouteDataReceived(_data, cbParm, thisObject.createRoute);
                }

            };
            var errorCount = 0;
            var errorCB = function(e) {
                var errorMsg = { "code": -1, "msg": e["msg"] || e["errMsg"]|window["langData"]["timeout:request"]||"请求超时,请查看网络状况!" };
                fcb && fcb(errorMsg);

            };
            var _dataType = (options&&options["dataType"])?options["dataType"]:"jsonp";

            var requestMethod = function(url, method, dataType, data, successCB, failedCB, func) {
                if (requestAPI) {
                    requestAPI(url, method, dataType, data, successCB, failedCB, func);
                }else if(_dataType == "raw"){
                    DXMapUtils.getDataBySecurityRequest(url, method, dataType, data, successCB, failedCB, func);
                }else{
                    if(window["downloader"]){
//                        link,"get","json",{"token":thisObject._app.token,"t":Date.now()},function(data)
                        window["downloader"]["getServiceData"](url, "get","json", data, successCB, failedCB );
                    }else{
                        DXMapUtils.getData(url,data,"json",successCB, failedCB);
                    }
                }
            }
            var _onRouteDataReceived = function(rData, options) {
                //路口放大图查询
                rData["buildingId"] = thisObject.bdid;
                rData.parm = options;
                var callback = callbackRouteAndCrossFinished || thisObject.createRoute;
                callback({ "code": 0, "data": rData },thisObject.routeState,{"language":thisObject.language });
                thisObject.events.EventRouteSuccess._notifyEvent( { "code": 0, "data": rData });

            };
            var cbParm = DXMapUtils.copyData(data);

            if (thisObject.lastRouteData && thisObject.lastRouteParm && DXMapUtils.compareObj(cbParm, thisObject.lastRouteParm)) {
                successCB(thisObject.lastRouteData);
                return;
            } else {
                thisObject.lastRouteData = null;

            }
            thisObject.lastRouteParm = data;

            cbParm.startCnName = window["langData"]["currentpos:starttip:navi"]||"我的位置";
            if(endPoint){
                cbParm.endCnName = endPoint['title'] || endPoint["text"];
                cbParm.address = endPoint["address"];
            }
            requestMethod(url, "GET", "json", data, function(data) {
                if (typeof data == "string") {
                    var _mindex = data.indexOf("(");
                    if (_mindex != -1) {
                        data = data.slice(_mindex + 1, -1);
                    }
                    successCB(JSON.parse(data));
                } else {
                    successCB(data);

                }

            }, errorCB, _dataType);

        };


        proto.clearAllObject = function() {
            thisObject.mapAPI.scene.clearObjects();
            if (thisObject.route && thisObject.route.floorObjectMap) {
                delete thisObject.route.floorObjectMap;
                thisObject.route.floorObjectMap = null;
            }
            thisObject.mapAPI._coreMap["enginApi"]["forceRedraw"]();
        };
        proto["clearAllObject"] = proto.clearAllObject;
        proto.routeCache = {
            _endPos: null,
            _endfloor: null,
            _endbdid:"",
            _endInfo: null,
            _options: null,
            routeEndInfo: function() {
                var thisObject = {};
                thisObject.set = function(bdid,args_endfloor, args_endPos, args_info, options) {
                    _endbdid = bdid;
                    _endPos = args_endPos;
                    _endfloor = args_endfloor;
                    _endInfo = args_info;
                    _options = options || {};

                };
                thisObject.getBdid = function() {
                    return _endbdid;
                };
                thisObject.getFloor = function() {
                    return _endfloor;
                };
                thisObject.getPos = function() {
                    return _endPos;
                };
                thisObject.getInfo = function() {
                    return _endInfo;
                };
                thisObject.getOptions = function() {
                    return _options;
                };

                return thisObject;
            },
        };
        proto.onReSearchRoutes = function() {
            var thisObject = this;
            if(window.location.href.indexOf("mapType=unimap") != -1){
                thisObject.events.EventRenavigation._notifyEvent();
                return ;
            }
            var routeEndInfo = thisObject.routeInfo;
            var endInfo = routeEndInfo.getInfo();
            var options = routeEndInfo.getOptions();
            var myPosition = thisObject.locationManager["getMyPositionInfo"]();
            var pos = myPosition["position"];
            var real_pos = myPosition["real_pos"];
            if(real_pos && real_pos["x"] && real_pos["y"]){
                pos = [real_pos["x"],real_pos["y"]];
            }
            var params = {
                "startPoint":{"lon":pos[0],"lat":pos[1],"floorId":myPosition["floorId"],"bdid":myPosition["bdid"],"idtype":3},
                "endPoint":endInfo,
                "options":options
            };
            params["bdid"] = myPosition["bdid"]||endInfo["bdid"]||"";
            // thisObject.EventRenavigation
            // thisObject.calculateRoute(params, onSendRenavigationMessage,onError);
            thisObject.events.EventRenavigation._notifyEvent(params);

        }
        proto.Fire_onRenavigation = function() {
            // var thisObject = this;
            if (!thisObject.reNavigating) {
                thisObject.onReSearchRoutes();
            }

        };

        proto.firstStep = function() {
            // var thisObject = this;
            var naviRoute = thisObject.route;
            if (naviRoute.currentCursor < 2 && (thisObject.getNaviStatus() == STATE_NAVIGATE)) {
                naviRoute.currentCursor++;
                naviRoute.updateInfo();
            }
        };
        proto.reset = function() {
            clearTimeout(thisObject.navigationTimer);
            thisObject.route.reset();
            if (thisObject.controller && !thisObject.controller.isPause) {
                thisObject.controller.stop();
            }
            thisObject.speakListener && thisObject.speakListener.stop();
            thisObject.isSwipe = false;
            thisObject.setIsSimulate(false);
            thisObject.setNaviStatus(STATE_FULLVIEW);
            thisObject.lastRouteCursor = -1;
            thisObject.isStairsShowState = false;
            thisObject.locationManager._stopMatchRoute();
            if(thisObject.indicator){
                thisObject.indicator["clearNaviStatus"]();
            }
            thisObject.events.EventNavigationReset._notifyEvent( 0);
        };
        proto.exitNavigation = proto.reset;

        proto.getLocationPose = function() {
            // var thisObject = this;
            var indicator = thisObject.locationManager.indicator;
            var pos = indicator.getPosition();
            var heading = indicator.getHeading();
            var floorId = indicator.getFloorId();
            var pose = {
                pos: [pos[0], pos[1], pos[2]],
                floor: floorId,
                headingTilt: [heading, 0]
            }
            return pose;
        };
        proto["getLocationPose"] = function() {
            return thisObject.locationManager.indicator.getPoseInfo();
        };


        proto.startLocation = function(status) { //开始定位
            // var thisObject = this;
            if (thisObject.controller) { //&& !thisObject.controller.isPause
                thisObject.controller.stop();
            }
            thisObject.setNaviStatus(status);
            thisObject.setContorller();
            if (status === STATE_NAVIGATE) {
                thisObject.controller.setType(SIMULATE_TYPE_ROUTE);
            } else {
                thisObject.controller.setType(SIMULATE_TYPE_POINT);
            }
            thisObject.controller.start();

        };
        proto["startLocation"] = proto.startLocation;
        proto.startNavigation = function(isSimulate, options) {
            // thisObject.events.EventNaviStatusChanged._notifyEvent(STATE_NAVIGATE);
            thisObject.setNaviStatus(STATE_NAVIGATE);
            if (!thisObject.route || !thisObject.route.floorObjectMap) {
                console.log("route unexist!");
                return;
            }

            if (isSimulate != undefined) {
                thisObject.setIsSimulate(isSimulate);
            }
            if(thisObject.speakListener){
                thisObject.speakListener.setCanSpeak(isSimulate?thisObject.simulateNaviCanSpeak:thisObject.realNaviCanSpeak);
                thisObject.speakListener.addCallbackByIndex(0, function() {
                    thisObject.speakListener.addCallbackByIndex(1, function() {
                        thisObject.speakListener.addCallbackByIndex(2, function() {
                            thisObject.firstStep();
                            thisObject.speakListener.addCallbackByIndex(3, function() {

                            });
                            thisObject.speakListener.speakNext(3);
                        });
                        thisObject.speakListener.speakNext(2);

                    }, isSimulate);

                });
                if(!options || (options["routeStepType"] && options["routeStepType"] == ROUTE_HAS_HEAD||options["routeStepType"] == ROUTE_HAS_HEAD_TAIL)){
                    thisObject.speakListener.speakNext(0);
                }

            }
            if (thisObject.navigationTimer) {
                window["clearTimeout"](thisObject.navigationTimer);
            }

            function setNaviStart() {
                var station = thisObject.route.floorObjects[0].stations[0];
                var pos = station.position;
                var isSimulate = thisObject.getIsSimulate();
                if(!options["disableMatchRoute"]){
                    var zoomLevel = thisObject.mapAPI._getZoomLevel();
                    if(zoomLevel>thisObject.naviZoomLevel || zoomLevel < 19){
                        thisObject.mapAPI._setZoomLevel(thisObject.naviZoomLevel);
                    }
                    thisObject.mapAPI._setTilt(thisObject.naviTilt);
                }


                if(isSimulate){
                     var params = {
                        "floorId": station.floor,
                        "bdid":thisObject.route.bdid,
                        "lon": pos[0],
                        "lat": pos[1],
                        "heading":station.angel,

                    };
                }else{
                    var locationInfo = thisObject.locationManager._getMyPositionInfo();
                    var params = {
                        "floorId":locationInfo["floorId"],
                        "bdid":locationInfo["bdid"],
                        "lon":locationInfo["position"][0],
                        "lat":locationInfo["position"][1],
                        "heading":locationInfo["direction"],
                    };
                }
                if(thisObject.usingLineHeading === false){
                    params["heading"] = 0;
                }

                thisObject.mapAPI._moveTo(params);

                thisObject.indicator.positionSampler.setDirty(false);
                try{
                    thisObject.startLocation(STATE_NAVIGATE);
                    // startMatchRoute
                    if(thisObject.locationManager && !options["disableMatchRoute"]){
                        thisObject.locationManager._startMatchRoute(thisObject.route.rawRoute,thisObject.usingLineHeading,thisObject.naviStrictByLineDir);
                    }

                    // thisObject.speakListener && thisObject.speakListener.speakNext(0);

                }catch(e){
                    alert("catch exp"+e.toString());
                }

            }
            if ((thisObject.routeState == ROUTE_HAS_HEAD) || (thisObject.routeState == ROUTE_HAS_HEAD_TAIL)) {

                thisObject.navigationTimer = setTimeout(setNaviStart, 0);
            } else {
                setNaviStart();
            }

        };
        proto["startNavigation"] = proto.startNavigation;
        proto.gotoNextStation = function(route) {
            route.currentCursor++;
            route.update();
        };
    };

    var IndoorNavigationManager = function(map){
        var thisObject = this;
        thisObject._coreMap = map;
        thisObject._naviCore = null;
        thisObject._locationManger = null;
        thisObject._listener = null;
        thisObject._routes = [];
        thisObject.language = "chinese";

        var proto = IndoorNavigationManager.prototype;
        proto.init = function(options,locationManager,speakListener){
            thisObject._naviCore = new DXNavigationCore(map);
            thisObject._naviCore.init(options, locationManager, speakListener);
            thisObject._naviCore.events.EventNaviPositionInfoChanged._addEventHandler(function(sender, data) {
                if(thisObject._listener && thisObject._listener["onNaviInfoUpdated"]){
                    var minSpeakDistance = thisObject._naviCore.minSpeakDistance;
                    var naviInfo = {
                        'totalLength': data["total_length"],   //路线总长
                        "remainDistance":data["lastDistance"], //到终点的剩余距离
                        "remainTime" : data["extraTime"],      //到终点的剩余时间
                        "targetDistance" : data["targetDistance"], //到下一个转弯处的距离
                        "distanceToNext" : data["targetDistance"] < minSpeakDistance?"":data["targetDistance"], //到下一个转弯处的距离
                        "nextInstuction" : data["angelText"]||data["speakText"], //下一段的指令
                        "segmentIndex" : data["stationIndex"],  //当前路段的索引
                        "floorId":data["floorId"],
                        "grayT":data["grayT"],
                        "speakType":data["speakType"],
                        "isEnd":data["isEnd"]
                    }
                    // var aheadText = window["langData"]["ahead"] ||"前方";
                    // //data["targetDistance"] < minSpeakDistance &&
                    // if(data["speakType"] != 2 && (naviInfo["nextInstuction"] && naviInfo["nextInstuction"].toLowerCase().indexOf(aheadText.toLowerCase())==-1)){
                    //     naviInfo["nextInstuction"] = aheadText + naviInfo["nextInstuction"]
                    // }
                    if(data["changeFloorText"]){
                        naviInfo["changeFloorText"] = data["changeFloorText"];
                    }
                    thisObject._listener["onNaviInfoUpdated"](naviInfo);
                }
            });

            thisObject._naviCore.events.EventNaviSegmentChanged._addEventHandler(function(sender, data) {
                if(thisObject._listener && thisObject._listener["onGetNavigationText"]){
                    thisObject._listener["onGetNavigationText"](data['speakText'],data["index"]);
                }
            });

            thisObject._naviCore.events.EventShowRoadCross._addEventHandler(function(sender, data) {
                if (data == false) {
                    if(thisObject._listener && thisObject._listener["hideCross"]){
                        thisObject._listener["hideCross"]();
                    }
                } else {
                    if(thisObject._listener && thisObject._listener["showCross"]){
                        thisObject._listener["showCross"](data);
                    }
                }
            });

            thisObject._naviCore.events.EventRenavigation._addEventHandler(function(sender, data) {
                if(thisObject._listener && thisObject._listener["onReCalculateRouteForYaw"]){
                    thisObject._listener["onReCalculateRouteForYaw"](data);

                }
            });

            thisObject._naviCore.events.EventNavigationFinished._addEventHandler(function(sender, data) {
                var listener = thisObject._listener;
                if(thisObject._naviCore.getIsSimulate()){
                    if(listener && listener["onEndEmulatorNavi"]){
                        listener["onEndEmulatorNavi"](data);
                    }
                }else{
                    if(listener && listener["onArriveDestination"]){
                        listener["onArriveDestination"](data);
                    }
                }

                if(listener && listener["onNavigationFinished"]){
                    listener["onNavigationFinished"](data);
                }

            });
            thisObject._naviCore.events.EventNaviStatusChanged._addEventHandler(function(sender, state) {
                var listener = thisObject._listener;
                thisObject._naviStatus = state;
                if(listener && listener["onNaviStateChanged"]){
                    if(state === STATE_NAVIGATE_PAUSE){
                        listener["onNaviStateChanged"]("NAVIGATE_PAUSE");
                    }
                    if(state === STATE_NAVIGATE){
                        listener["onNaviStateChanged"]("NAVIGATING");
                    }
                    if(state === STATE_NAVIGATE_END){
                        listener["onNaviStateChanged"]("NAVIGATEEND");
                    }
                }

            });

            thisObject._naviCore.events.EventNavigationExited._addEventHandler(function(sender,data){
                var listener = thisObject._listener;
                if(listener && listener["onNavigationExited"]){
                    listener["onNavigationExited"]();
                }
            });
        }
        proto["init"] = proto.init;
        proto["setNaviParams"] = proto.setNaviParams = function(params){
            thisObject._naviCore._setNaviParams(params);
        }

        proto["registerCallback"]= proto.registerCallback = function(callback){
            thisObject._listener = callback;
        }
        proto["setIsSimulate"] =  proto.setIsSimulate =function(val){
            thisObject._naviCore.setIsSimulate(val);
        };
        proto["setRoute"] = proto.setRoute = function(routeData,routeType,options){
            var route = {
                "code" :0,
                "data" : DXMapUtils.copyData((routeData["detail"] && routeData["detail"]["rawRoute"])||routeData)
            }

            var end = route["data"]["route"][0]["path"]["end"]
            var endpoint = routeData["endpoint"];
            if(endpoint){
                for(var key in endpoint){
                    end[key] = endpoint[key];
                }
            }
            if(routeData["exhibition"]){
                end["name"] = (routeData["exhibition"]["name"] || "")+(window["langData"]["nearby"]||"附近");
            }
            route["data"]["parm"] = {
                "startPoint":routeData["startPoint"],
                "endPoint":end,
                "options":options,
            }

            var roadCrossData = route["data"]["route"][0]["roadCrossData"]
            if(roadCrossData && roadCrossData["CrossImageResult"] && roadCrossData["CrossImageResult"].length ){
                thisObject._naviCore.events.EventShowPreRoadCross._notifyEvent(roadCrossData);
            }
            thisObject._naviCore.createRoute(route, {"routeType":routeType},options);//routeData.routeState);
        }

        proto["startNavigation"] = proto.startNavigation = function(routeType,naviOption){
            var isSimulate = false;
            var options = {"routeStepType":routeType};
            for(var key in naviOption){
                options[key] = naviOption[key];
            }
            thisObject._naviCore.startNavigation(isSimulate,options);
        }

        proto["startSimulate"] = proto.startSimulate = function(routeType){
            var isSimulate = true;
            thisObject._naviCore.startNavigation(isSimulate,{"routeStepType":routeType});
        }

        proto["pauseNavi"] = proto.pauseNavi = function(){
            thisObject._naviCore.pauseNavigation();
            // resume 定时器

        }

        proto["resumeNavi"] =  proto.resumeNavi = function(){
            thisObject._naviCore.resumeNavigation();
        }

        proto["exitNavi"] =  proto.exitNavi = function(isFarAway){
            thisObject._naviCore.exitNavigation();
            thisObject._naviCore.events.EventNavigationExited._notifyEvent(null,"exit");
            if(!isFarAway){
                thisObject._naviCore.navigationController.cleanVirtualLine();
            }
        }

        proto["setLocationManager"] =  proto.setLocationManager = function(lm){
            var thisObject = this;
            thisObject._locationManger = lm;
        }

        proto["selectRouteId"] = proto.selectRouteId = function(routeId){
            var thisObject = this;
            if(routeId >= thisObject._routes.length){
                return;
            }
            thisObject._naviCore.route = thisObject._routes[routeId];
        }
        proto["setSimulatorNaviSpeed"] =  proto.setSimulatorNaviSpeed = function(speed){
            thisObject._naviCore._setSimulatorNaviSpeed(speed);
        };

        proto["queryRoutePath"] =  proto.queryRoutePath = function(options){
            var thisObject = this;
            var listener = thisObject._listener;
            thisObject._naviCore._routePath(options, function(data){
                if (data["code"] == 0) {
                    listener && listener["onCalculateRouteSuccess"] && listener["onCalculateRouteSuccess"](data);
                    listener && listener["onRouteParsed"] && listener["onRouteParsed"](thisObject._naviCore.routeSegmets);
                }else{
                    data["errMsg"] = data["errMsg"] || data["msg"]||"路线不连通";
                    listener && listener["onCalculateRouteFailure"] && listener["onCalculateRouteFailure"](data);
                }
            }, function(e) {
                if(typeof e =="object" && !e["errMsg"]){
                    e["errMsg"] = e["msg"] ||window["langData"]["failed:tip:latercontiue:route"]|| "路线规划失败,请稍后重试";
                }
                listener && listener["onCalculateRouteFailure"] && listener["onCalculateRouteFailure"](e);
            });
        }

    }

    var NavigationManager = function(map){
        var thisObject = this;
        thisObject._mapSDK = map;
        thisObject._coreMap = map;
        thisObject._naviCore = null;
        thisObject._locationManger = null;
        thisObject._indoorNaviManager = null;
        thisObject._listener = null;
        thisObject._routes = [];
        thisObject._routeId = -1;
        thisObject._curRouteData = null;
        thisObject._curMapRoute = null;
        thisObject._mapRoutesListener = null;
        thisObject.language = "chinese";
        thisObject._naviStatus = -1;

        var proto = NavigationManager.prototype;
        proto.init = function(params){
            var thisObject = this;
            thisObject._indoorNaviManager = new IndoorNavigationManager(map);

            var naviConfig = params["naviConfig"] || params["options"]||{};
            var locationManager =  params["locationManager"]||null;
            var speakListener =  params["speakListener"]||null;
            if(!locationManager && arguments.length > 0){
                if(arguments.length == 1 && arguments[0] instanceof daxiMap["LocationManager"] ){
                    locationManager = arguments[0];
                }else if(arguments.length >1 && (arguments[1] instanceof daxiMap["LocationManager"]) ){
                    locationManager = arguments[1];
                    naviConfig = arguments[0];
                    arguments[2] && (arguments[2] instanceof daxiMap["LocationManager"]) && (speakListener = arguments[2]);
                };
            }
            if(!locationManager){
                return {"error":"locationManager 不能为空"};
            }
            thisObject._locationManger = locationManager;
            thisObject._indoorNaviManager.init(naviConfig, locationManager, speakListener );

            thisObject._mapRoutesListener = {
                "onCalculateRouteSuccess": function(e) {
                    //路线计算成功
                    if (!e || e.reuslt.length == 0) return;
                    var route = e.results[0];
                },
                "onCalculateRouteFailure": function(code) {
                    //路线计算失败
                    console.log("onCalculateRouteFailure errorCode:" + code);
                },
                "onArriveDestination": function(data) {
                    //导航完成
                    // console.log("onArriveDestination");
                    thisObject._listener && thisObject._listener["onArriveDestination"] && thisObject._listener["onArriveDestination"](data);
                },
                "onNavigationExited":function(data){
                    thisObject._listener && thisObject._listener["onNavigationExited"] && thisObject._listener["onNavigationExited"](data);
                },
                "onEndEmulatorNavi": function(data) {
                    //模拟导航完成
                    // console.log("onEndEmulatorNavi");
                    thisObject._listener && thisObject._listener["onEndEmulatorNavi"] && thisObject._listener["onEndEmulatorNavi"](data);
                },
                "onNaviStateChanged":function(data){
                    thisObject._listener && thisObject._listener["onNaviStateChanged"] && thisObject._listener["onNaviStateChanged"](data);
                },
                "onNavigationFinished": function(data) {
                    //模拟导航完成
                    thisObject._listener && thisObject._listener["onNavigationFinished"] && thisObject._listener["onNavigationFinished"](data);
                },
                "showCross": function(data) {
                    //显示路口放大图
                    // console.log("showCross：" + JSON.stringify(naviCross));
                    thisObject._listener && thisObject._listener["showCross"] && thisObject._listener["showCross"](data);
                },
                "hideCross": function() {
                    //隐藏路口放大图
                    console.log("hideCross");
                    thisObject._listener && thisObject._listener["hideCross"] && thisObject._listener["hideCross"]();
                },
                "onArrivedWayPoint": function(wayPointInfo) {
                    thisObject._listener && thisObject._listener["onArrivedWayPoint"] && thisObject._listener["onArrivedWayPoint"](wayPointInfo);

                },
                "onGetNavigationText": function(args) {
                    // 导航语音变化
                    // console.log("onGetNavigationText:" + args);
                    thisObject._listener && thisObject._listener["onGetNavigationText"] && thisObject._listener["onGetNavigationText"](args);
                },
                "onNaviInfoUpdated": function(naviInfo) {
                    // 导航信息更新
                    // naviInfo属性定义
                    // totalLength     路线总长
                    // remainDistance  到终点的剩余距离
                    // remainTime      到终点的剩余时间
                    // distanceToNext  到下一个转弯处的距离
                    // nextInstuction  下一段的指令
                    // segmentIndex    当前路段的索引
                    if(params["routeIndex"] !=undefined){
                        naviInfo["routeIndex"] = params["routeIndex"];
                    }
                    thisObject._listener && thisObject._listener["onNaviInfoUpdated"] && thisObject._listener["onNaviInfoUpdated"](naviInfo);
                },
                "onReCalculateRouteForYaw": function(data) {
                    //开始偏航重算路径
                    // console.log("onReCalculateRouteForYaw");
                    thisObject._locationManger._stopMatchRoute();
                    thisObject._listener && thisObject._listener["onReCalculateRouteForYaw"] && thisObject._listener["onReCalculateRouteForYaw"](data);
                },
                // "onLocationChanged": function(naviLocation) {
                //     thisObject._listener && thisObject._listener["onLocationChanged"] && thisObject._listener["onLocationChanged"](naviLocation);
                // },
                // "updateCameraInfo": function(naviCameraInfo) {
                //     thisObject._listener && thisObject._listener["updateCameraInfo"] && thisObject._listener["updateCameraInfo"]();
                //
                // },
                "onRouteStepPause" : function(routeStep){
                    thisObject._listener && thisObject._listener["onRouteStepPause"] && thisObject._listener["onRouteStepPause"](routeStep);

                },
                "onRouteStepResume" : function(routeStep){
                    thisObject._listener && thisObject._listener["onRouteStepResume"] && thisObject._listener["onRouteStepResume"](routeStep);
                }
            }
            thisObject["naviCoreEvents"] = thisObject._indoorNaviManager._naviCore["eventAPI"];
            thisObject._mapSDK._on("onMapDragEnd", function (sender, e) {
                thisObject["pauseNavi"]();
            });
        }
        proto["resetIndoorNaviParams"] = function(params){
            thisObject._indoorNaviManager["setNaviParams"](params);
        }

        proto["setIndicator"] = function(indicator){
            thisObject._indoorNaviManager._naviCore.indicator = indicator;
        }
        proto["setIndicatorVisible"] = function(visible){
            thisObject._indoorNaviManager._naviCore.indicator.setVisible(visible);
        }

        proto["registerCallback"] = function(callback){
            thisObject._listener = callback;
        }

        proto["setRoute"] = function(routes){
            thisObject._routes = routes;
        }

        proto["getSelectedRoute"] = function(){
            return thisObject._curMapRoute;
        }

        proto["getSelectedRouteData"] = function(){
            var routeData = this._routes[this._routeId];
            return routeData;
        }

        proto["getNaviStatus"] = function(){
            return thisObject._indoorNaviManager._naviCore.getNaviStatus();
            // return thisObject._naviStatus;
        }

        proto["startNavigation"] = function(route,naviOptions){
            naviOptions = naviOptions || {};
            var isSimulate = false;
            var routeData = route || this._routes[this._routeId];
            var curMapRoute = createNavigationMapRoute(this, routeData,naviOptions);
            curMapRoute.addToMap();
            // 如果是室外取室内的前一段或者 终点段
            // var index = curMapRoute.getNextOutDoorIndoorChangeStepIndex();
            // curMapRoute.activeStep(index);
            curMapRoute["activeStep"](naviOptions["segmentIndex"]||0,naviOptions["routeSegType"],naviOptions);
            this._curMapRoute = curMapRoute;
            // thisObject._naviStatus = 0;

        }
        proto["setEndNaviDistance"] = function(distance){
            thisObject._indoorNaviManager._naviCore["setEndNaviDistance"](distance);
        };
        proto["getIsSimulate"] = function(){
            return this._indoorNaviManager._naviCore.isSimulation;
        }

        proto["startSimulate"] = function(route,options){
            options = options || {};
            var routeData = route||this._routes[this._routeId];
            var curMapRoute = createSimulateMapRoute(this, routeData,options);
            curMapRoute.addToMap();
            curMapRoute["activeStep"](options["segmentIndex"]||0,options["routeSegType"]);
            this._curMapRoute = curMapRoute;
            // thisObject._naviStatus = 0;
            // thisObject.events.EventNaviStatusChanged._notifyEvent(STATE_NAVIGATE);

        }

        proto["pauseNavi"] = function(){
            if(this["getNaviStatus"]() == STATE_NAVIGATE && this._curMapRoute){
                this._curMapRoute.pause();
            }
        }

        proto["resumeNavi"] = function(){
            if(this["getNaviStatus"]() == STATE_NAVIGATE_PAUSE && this._curMapRoute){
                this._curMapRoute.resume();
            }
        }

        proto["exitNavi"] = function(faraway){
            if(this._curMapRoute){
                this._curMapRoute.stop(faraway);
            }
            thisObject._naviStatus = -1;
        }

        proto["setLocationManager"] = function(lm){
            var thisObject = this;
            thisObject._locationManger = lm;
        }

        proto["selectRouteId"] = function(routeId){
            var thisObject = this;
            if(routeId >= thisObject._routes.length){
                return;
            }
            thisObject._routeId = routeId;
            // thisObject._curRouteData = thisObject._routes[routeId];
        }
        proto["setSimulatorNaviSpeed"] = function(speed){
            thisObject._indoorNaviManager.setSimulatorNaviSpeed(speed);
        };

        proto["queryRoutePath"] = function(options){
            var thisObject = this;
            var listener = thisObject._listener;
            thisObject._routes.length = 0;
            thisObject._indoorNaviManager._naviCore._routePath(options, function(data){
                if (data["code"] == 0) {
                    if(data["route"]){
                        thisObject._routes.push(data);
                    }else if(data["transits"]){
                        thisObject._routes = data["transits"];
                    }
                    listener && listener["onCalculateRouteSuccess"] && listener["onCalculateRouteSuccess"](data);
                    listener && listener["onRouteParsed"] && listener["onRouteParsed"](thisObject._indoorNaviManager._naviCore.routeSegmets);
                }else{
                    data["errMsg"] = window["langData"]["failed:tip:route"]||"路线不连通";
                    listener && listener["onCalculateRouteFailure"] && listener["onCalculateRouteFailure"](data);
                }
            }, function(e) {
                if(typeof e =="object" && !e["errMsg"]){
                    e["errMsg"] =  e["msg"] ||window["langData"]["failed:tip:latercontiue:route"]|| "路线规划失败,请稍后重试";
                }
                listener && listener["onCalculateRouteFailure"] && listener["onCalculateRouteFailure"](e);
            });
        };
        proto["addFloorChangeListener"] = function(callback){
            thisObject._indoorNaviManager && thisObject._indoorNaviManager._naviCore.events.EventFloorChangeData._addEventHandler(callback);
        };


        function createSimulateMapRoute(naviManager, path,options) {
            var mapRoute = new daximap["DXMapRoute"]();
            var stepList = path["route"] || path["segments"];
            for (var i=0; i<stepList.length; i++) {
                var step = stepList[i];
                var routeStep = null;
                var routeType = step["routetype"];
                if (routeType == 0) {
                    routeStep = new daximap["DXMapDriveRouteStep_Simulate"](options);
                } else if (routeType == 1) {
                    routeStep = new daximap["DXMapBusRouteStep_Simulate"](options);
                } else if (routeType == 2) {
                    routeStep = new daximap["DXMapWalkRouteStep_Simulate"](options);
                } else if (routeType == 3) {
                    routeStep = new daximap["DXMapIndoorRouteStep_Simulate"](options);
                } else if (routeType == 4) {
                    // route = new DXMapTaxiRouteStep.Simulate();
                } else if (routeType == 5) {
                    routeStep = new daximap["DXMapSubwayRouteStep_Simulate"](options);
                } else if (routeType == 6) {
                    // route = new DXMapABRouteStep.Simulate();
                } else {
                    continue;
                }
                routeStep._routeStepIndex = i;
                routeStep._routeData = step;
                routeStep._routeState = step["routeState"];
                routeStep.initialize(naviManager, naviManager._mapRoutesListener,i);
                mapRoute._routeStepArray.push(routeStep);
            }

            return mapRoute;
        }

        function createNavigationMapRoute(naviManager, path,options) {
            var mapRoute = new daximap["DXMapRoute"]();
            var stepList = path["route"] || path["segments"];
            for (var i=0; i<stepList.length; i++) {
                var step = stepList[i];
                var routeStep = null;
                var routeType = step["routetype"];
                if (routeType == 0) {
                    routeStep = new daximap["DXMapDriveRouteStep_Navigation"](options);
                } else if (routeType == 1) {
                    routeStep = new daximap["DXMapBusRouteStep_Navigation"](options);
                } else if (routeType == 2) {
                    routeStep = new daximap["DXMapWalkRouteStep_Navigation"](options);
                } else if (routeType == 3) {
                    routeStep = new daximap["DXMapIndoorRouteStep_Navigation"](options);
                } else if (routeType == 4) {
                    // route = new DXMapTaxiRouteStep.Simulate();
                } else if (routeType == 5) {
                    routeStep = new daximap["DXMapSubwayRouteStep_Navigation"](options);
                } else if (routeType == 6) {
                    // route = new DXMapABRouteStep.Simulate();
                } else {
                    continue;
                }
                routeStep._routeStepIndex = i;
                routeStep._routeData = step;
                routeStep._routeState = step["routeState"];
                routeStep.initialize(naviManager, naviManager._mapRoutesListener);
                mapRoute._routeStepArray.push(routeStep);
            }

            return mapRoute;
        }



        proto["init"] = proto.init;
        proto["getIndoorNaviEventAPI"] = function(){
            return (this._indoorNaviManager && this._indoorNaviManager._naviCore["eventAPI"]);
        };
    }

    var DXIndoorRouteOverlay = function(data){
        var proto = DXIndoorRouteOverlay.prototype;
        proto.setVisible = function(visible){

        }
        proto.addToMap = function(map){

        }

        proto.removeFromMap = function(){

        }
    }

    var DXDriveRouteOverlay = function(mapAPI){
        var proto = DXDriveRouteOverlay.prototype;
        proto.setVisible = function(visible){

        }
        proto.addToMap = function(map){

        }

        proto.removeFromMap = function(){

        }
    }

    daxiMap["NavigationManager"] = NavigationManager;
})(window);
