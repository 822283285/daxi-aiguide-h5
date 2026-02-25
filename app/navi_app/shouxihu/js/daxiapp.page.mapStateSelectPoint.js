(function (global) {
    'use strict';
    var daxiapp = global["DaxiApp"] || {};
    var daximap = window["DaxiMap"] || {};

    var domUtils = daxiapp["dom"];
    var MapStateClass = daxiapp["MapStateClass"];
    var MapStateSelectPoint = MapStateClass.extend({
        __init__ : function () {
            this._super();
            this._rtti = "MapStateSelectPoint";
        },

        initialize: function(app, container) {
            this._super(app, container);
            var thisObject = this;
            thisObject._bdid = "unkown";
           
            thisObject.pageName = "select_point_page";
            var basicMap_html = '<div id="' + thisObject.pageName + '" class="dx_widget_base_container"></div>';
            domUtils.append(thisObject._container, basicMap_html);
            thisObject._dom = domUtils.find(thisObject._container, "#" + thisObject.pageName);
            
            thisObject._headerView = new daxiapp["DXHeaderWithTipComponent"](app,thisObject._dom);
            thisObject._headerView.init({
                onBackBtnClicked:function(sender, e){
                    var command = {
                        "ret" : "Cancel",
                    };
                    app._stateManager.invokeCallback("selectMapPointCallback", command);
                }
            });
            
            thisObject._markerComponent = new daxiapp["DXImageComponent"](app,thisObject._dom);
            thisObject._markerComponent.init({

            });
            thisObject._markerComponent.setWrapperStyle({
                "position": "absolute",
                "top": "44px",
                "bottom": "254px",
                "width": "100vw",
                "pointer-events": "none"
            });
           
            //bottom View searchResult
            thisObject._poiResultView = new daxiapp["DXPoiResultView2"](app, thisObject._dom);
            thisObject._poiResultView.init({
                onSelectItemAtIndexPath: function(sender, e){
                    var mapSDK = app._mapView._mapSDK;
                    mapSDK["easeTo"](e);
                },
                onTakeToThere: function(sender, e){
                    var command = {
                        retVal:"OK",
                        method:"selectPointCallback",
                        data:{
                            pointType:thisObject.pointType
                        }
                    };
                    command.data[thisObject.pointType] = e;
                    app._stateManager.invokeCallback("selectMapPointCallback", command);
                }
            });
            thisObject._poiResultView.setWidgetHeight(254);
            
            this.show(false);
        },

        searchPoi : function(sender){
            var thisObject = sender;
            var params = thisObject.params;
            var searchConf = thisObject._app._config["search"];
            var token = thisObject._app._params["token"];
           
            var params = {"token":token};
            var mapView = thisObject._app._mapView;
            var cameraPose = mapView._mapSDK["cameraPose"]();
            params["lon"] = cameraPose["lon"];
            params["lat"] = cameraPose["lat"];
           
            if(mapView.currBuilding){
                var currFloorInfo = mapView.currBuilding.getCurrentFloorInfo();
                var flid = currFloorInfo["flid"];
                var range = currFloorInfo["rect"];
                var inPolygon = daxiapp["naviMath"].pointInPolygon([params["lon"],params["lat"]],[[range[0],range[1]],[range[2],range[1]],[range[2],range[3]],[range[0],range[3]]])
                if(inPolygon){
                    params["floorId"] = flid;
                    params["bdid"] = cameraPose["bdid"];
                }
            }
            if(params["bdid"]){
                params["circle"] = 200;
                params["floorlimit"] = 1;
                params["type"] = 1;
            }else{
                params["circle"] = 3000;
                params["type"] = 11;
            }
            if(thisObject._app._config["searchType"]){
                params["type"] = thisObject._app._config["searchType"];
            }
            var search = thisObject._app._mapView._search;
            search["cancel"]();
            thisObject._poiResultView.showLoading();
            params["url"] = searchConf["url"];

            thisObject._markerComponent.animate("markertip_animation");
            var myPosInfo = {
                "poiId":daxiapp["utils"].createUUID(),
                "bdid": params["bdid"],
                "floorId":params["floorId"],
                "lat": params["lat"],
                "lon": params["lon"],
                "text": "地图选点位置",
                "address":""//地图中心点
            };
            var count = searchConf["ount"];
            count && (params["count"] = count);
            params["myPositionInfo"] = thisObject._app._mapView._locationManager.getMyPositionInfo();
            search["query"](params,function(data){
                var _data = [myPosInfo].concat(data);
                thisObject._poiResultView.updateData(_data);
                thisObject._poiResultView.setActiveByIndex(0,true);
            },function(data){
                thisObject._poiResultView.updateData([myPosInfo]);
                thisObject._poiResultView.setActiveByIndex(0,true);
            });
        },
        showMarkers : function(data){
            var thisObject = this;
            var mapSDK = thisObject._app._mapView._mapSDK;
            var onMarkerClick = function(marker){
                // var featureId = e["features"][0]["properties"]["id"];
                thisObject._poiResultView.setActiveById(marker._options["featureId"]);
            };
            for(var poiIndex in data){ //.forEach(function(poiInfo){
                var poiInfo = data[poiIndex];
                var markerOption = {
                    "featureId":poiInfo["poiId"],
                    "bdid":poiInfo["bdid"],
                    "lon":poiInfo["lon"],
                    "lat":poiInfo["lat"],
                    "floorId":poiInfo["floorId"],
                    "imageUrl":"blue_dot",
                    "highlightImageUrl":"red_dot",
                    "scale":0.5,
                    "onClick":onMarkerClick
                };
                var marker = new daximap["DXSceneMarker"]();
                marker["initialize"](mapSDK, markerOption);
                marker.id = daxiapp["utils"].createUUID();
                marker["addToMap"]();
                thisObject._renderObjects.push(marker);
            };
            // thisObject._poiResultView.setActiveByIndex(0);
            
        },
        
        onStateBeginWithParam : function(args){
            this._super(args);
            if(!args) return;
            this.params = args["data"];
            var mapView = this._app._mapView;
            mapView.setTopViewHeight(66);
            mapView.setBottomViewHeight(254);
            mapView._mapSDK.setPadding({
                "bottom":240,
                "top":44
            });
            var thisObject = this;
            thisObject.pointType = args["data"]["pointType"];
            if(thisObject.pointType == "startPoint"){
                thisObject._headerView.updateData("选择起点");
                var url = "./images/start_point.png";
                thisObject._markerComponent.updateData(url);
            }else{
                thisObject._headerView.updateData("选择终点");
                var url = "./images/end_point.png";
                thisObject._markerComponent.updateData(url);
            }
            this._poiResultView.show();

            this.searchPoi(thisObject);
            this._app._mapView._mapSDK["on"]("onMapDragEnd",this.searchPoi,thisObject);
        },
       
        onHideByPushStack : function(args){
            this._super(args);
            var search = this._app._mapView._search;
            search["cancel"]();
            this._app._mapView._mapSDK["off"]("onMapDragEnd",this.searchPoi);
        },
    
        onShowByPopStack : function(args){
            this._super(args);
            var mapView = this._app._mapView;
            mapView.setTopViewHeight(66);
            mapView.setBottomViewHeight(254);
            mapView._mapSDK.setPadding({
                "bottom":240,
                "top":44
            });
            this._app._mapView._mapSDK["on"]("onMapDragEnd",this.searchPoi,this);
        },
    
        onStateEnd : function(args){
            this._poiResultView.show();
            var search = this._app._mapView._search;
            search["cancel"]();
            this._super(args);
            this._app._mapView._mapSDK["off"]("onMapDragEnd",this.searchPoi);
            // mapView._mapSDK.setPadding({
            //     "bottom":254,
            //     "top":44
            // });
        },

        // Run Command
        runCommond : function(command){
          
        },
    });
  
    daxiapp["MapStateSelectPoint"] = MapStateSelectPoint;
})(window)
