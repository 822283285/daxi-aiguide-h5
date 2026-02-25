(function (global) {
    'use strict';
    var daxiapp = global["DaxiApp"] || {};
    var domUtils = daxiapp["dom"];
    var dxUtil = daxiapp["utils"];
    var MapStateClass = daxiapp["MapStateClass"];
    var VoiceListenerPage = MapStateClass.extend({
        __init__ : function () {
            this._super();
            this._rtti = "voiceListenerPage";
        },

        initialize: function(app, container) {
            this._super(app, container);
            var thisObject = this;
            thisObject.bdid = "unknown";
            thisObject._app = app;
            var mapView = app._mapView;
            var basicMap_html = '<div id="voice_page" class="dx_full_frame_container">'
                +'<div class="wrapper" style="width: 100%;height: 100%;display: flex;flex-direction: column;">'
                +'</div></div>';
            domUtils.append(thisObject._container, basicMap_html);
            thisObject._dom = domUtils.find(thisObject._container, "#voice_page");
            thisObject._bdid = "";
            thisObject._wrapper = domUtils.find(thisObject._dom, ".wrapper");
            thisObject._loadingDom =  domUtils.find(thisObject._dom, "#loading");
            var backBtn = thisObject._dom.find(".hospital-back");
            if(backBtn.length == 0){
                backBtn = "<div class='hospital-back'></div>";
                thisObject._dom.append(backBtn)
            }
            thisObject._backBtn = domUtils.find(thisObject._dom, ".hospital-back");
            thisObject._backBtn.on("click",function (){
                thisObject._app._stateManager.goBack();
            })
            var mainContainerHtml = '<div class="voice-main '+ app._params.bdid +'"></div>';
            domUtils.append(thisObject._wrapper, mainContainerHtml);
            thisObject._mainContainerDom = domUtils.find(thisObject._wrapper, ".voice-main");
            thisObject._voiceView = new daxiapp["DXVoiceViewComponent"](app, thisObject._mainContainerDom);
            thisObject._voiceView.init({
                onSearchSuccess:function (sender, args){
                    if(app._stateManager._curPage != thisObject){
                        return;
                    }
                    var keyword = args["keyword"];
                    var data = {
                        "method" :"showPois",
                        "keyword":keyword
                    };

                    thisObject.showPois(data);
                },
                onGoback:function (e){
                    app._stateManager.goBack();
                }
            });
            /*if(app._config["showRobotMen"]){
                domUtils.append(thisObject._wrapper,'<img id="robotBtn" style="width: 76px;height: 76px;position: absolute;bottom: 30px;right: 14px;" src="./images/robot.jpg">');
                thisObject._wrapper.on("click","#robotBtn",function(){
                    thisObject._iframeContainer.updateIframe("https://aibot.daxicn.com/duix");
                    thisObject._iframeContainer.show();
                });
                thisObject._iframeContainer = new daxiapp["DXFullIframeComponent2"](app,thisObject._container);

                thisObject._iframeContainer.init({
                    onClose:function(sender,e){
                        thisObject._iframeContainer.hide();
                    }
                });
                thisObject._iframeContainer.setStyle({
                    "background-image":'linear-gradient(45deg, rgb(135, 206, 235), rgb(255, 255, 255), rgb(135, 206, 235), rgb(255, 255, 255), rgb(135, 206, 235))'
                });
                // thisObject._iframeContainer.setCloseBtnClass('icon-collapse');
                thisObject._iframeContainer.hide();
                thisObject._iframeContainer.updateIframe("https://aibot.daxicn.com/duix");

            }*/
            this.show(false);
        },
        onStateBeginWithParam : function(args){
            this._super(args);
            if(!args) return;
            var thisObject = this;
            this.configData = {};
            this.params = args["data"];
            thisObject.updateData();
            //}
        },
        runCommand:function(cmd){
            this.params = cmd;
            var bdid = this.params["bdid"];
            if(this.bdid != bdid){
                this.bdid = bdid;
                this.updateData(bdid);
            }
        },
        updateData: function(bdid){
            var thisObject = this;
            thisObject._voiceView.updateData("",thisObject._app._config["showShare"]);
        },

        onHideByPushStack : function(args){
            this._super(args);
        },

        onShowByPopStack : function(args){
            this._super(args);
            var mapView = this._app._mapView;
        },

        onStateEnd : function(args){
            this._super(args);
            // var mapView = this._app._mapView;
        },

        // Run Command
        runCommond : function(command){

        },
        // 显示Pois
        showPois : function(args){
            var params = this.getParams();
            if(params["bdid"]){
                var arealType = "indoor";
                args["arealType"] = arealType;
                args["type"] == undefined? (args["type"] = 1):'' ;

            }else{
                var arealType = "outdoor";
                args["arealType"] = arealType;
                args["type"] == undefined? (args["type"] = 11):'' ;
            }
            for(var key in params){
                if(!args[key]){
                    args[key] = params[key];
                }
            }
            args["keyword"]?(args["keyword"] = decodeURIComponent(args["keyword"])):'';
            // this._app._stateManager.pushState("MapStatePoi", args);

            this._app.pageCommand.openPoiState(args);
        },
        getParams:function(){
            var thisObject = this;
            var token = this._app._params["token"];
            var mapView = this._app._mapView;
            var mapSDK = mapView._mapSDK;
            var bdid = mapSDK["getCurrentBDID"]()||'';
            var floorId = mapSDK["getCurrentFloorId"]()||'';
            var bdInfo = mapView.getCurrIndoorBuilding()["bdInfo"];
            bdid = bdInfo["bdid"];
            floorId = floorId||bdInfo["groundFloorId"];
            if(mapSDK["getCurrentBDID"]() != bdid){
                lon = bdInfo["center"][0];
                lat = bdInfo["center"][1];
            }
            var pos = mapSDK["getPosition"]();
            var lon = pos["lon"],lat=pos["lat"];
            // 定位点
            var locationManager = mapView._locationManager;
            var myPositionInfo = locationManager["getMyPositionInfo"]();

            var defStartPoint;
            if(bdid){
                if(thisObject.buildingInfo  && thisObject.buildingInfo["defStartPoint"]){
                    thisObject.buildingInfo["defStartPoint"]["bdid"] = thisObject.buildingInfo["bdid"];
                    defStartPoint = thisObject.buildingInfo["defStartPoint"];
                }
                // 在室内并且室内配置了默认点，定位不在当前室内里用默认点搜索排序
                if(defStartPoint && (!myPositionInfo.floorId || myPositionInfo.bdid != thisObject.buildingInfo.bdid) ){
                    lon = defStartPoint["lon"],lat = defStartPoint["lat"],bdid = defStartPoint["bdid"],floorId = defStartPoint["floorId"];
                }else if(myPositionInfo.floorId){ //定位在当前室内 根据当前定位点搜索排序
                    lon = myPositionInfo["position"][0];
                    lat = myPositionInfo["position"][1];
                    floorId = myPositionInfo["floorId"];
                }
            }
            // 室外的搜索都已当前地图位置搜索，如果想按照的
            var data = {
                "bdid":bdid,
                "token":token,
                "floorId":floorId,
                "position":[lon,lat],
                "locInfo":myPositionInfo
            };

            if(defStartPoint){
                data["defStartPoint"] = defStartPoint;
            }
            return data;
        },
    });

    daxiapp["VoiceListenerPage"] = VoiceListenerPage;
})(window);
