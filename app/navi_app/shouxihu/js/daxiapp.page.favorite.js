(function (global) {
    'use strict';
    var daxiapp = global["DaxiApp"] || {};
    var domUtils = daxiapp["dom"];
    var dxUtil = daxiapp["utils"];
    var MapStateClass = daxiapp["MapStateClass"];
    var MapStateFavoritePage = MapStateClass.extend({
        __init__ : function () {
            this._super();
            this._rtti = "MapStateFavoritePage";
        },

        initialize: function(app, container) {
            this._super(app, container);
            var thisObject = this;
            thisObject.bdid = "unknown";
            thisObject._app = app;
            var mapView = app._mapView;
            var basicMap_html = '<div id="favorite_page" class="dx_full_frame_container">'
                + '<div class="favorite_page_header"><i class="goback icon-fanhui"></i><span class="pageTitle">我的收藏</span></div>'
                +'<div class="wrapper" style="width: 100%;height: 100%;display: flex;flex-direction: column;">'
                +'</div></div>';
            domUtils.append(thisObject._container, basicMap_html);
            thisObject._dom = domUtils.find(thisObject._container, "#favorite_page");
            thisObject._bdid = "";
            thisObject._wrapper = domUtils.find(thisObject._dom, ".wrapper");
            thisObject._loadingDom =  domUtils.find(thisObject._dom, "#loading");

            var mainContainerHtml = '<div class="favorite-main"></div>';
            domUtils.append(thisObject._wrapper, mainContainerHtml);
            thisObject._mainContainerDom = domUtils.find(thisObject._wrapper, ".favorite-main");
            thisObject._favoriteView = new daxiapp["DXFavoriteViewComponent"](app, thisObject._mainContainerDom);
            thisObject._favoriteView.init({
                onShareBtnClicked:function(sender,poiInfo){
                    poiInfo["method"]="showPoiDetail";
                    poiInfo["shareType"] = "poi";
                    var locationManager = mapView._locationManager;
                    poiInfo["buildingId"] = poiInfo["bdid"]||'';
                    var mapConfig = thisObject._app._config;
                    poiInfo["token"] = mapConfig["token"];
                    delete poiInfo["bdid"];
                    if(mapConfig["platform"] && mapConfig["wbrs"]){
                        poiInfo["platform"] = mapConfig["platform"];
                        poiInfo["wbrs"] = mapConfig["wbrs"];
                    }
                    locationManager.shareToFriend(poiInfo);
                },
                onTakeToThere: function(sender, e){
                    var locationManager = mapView._locationManager;
                    var startPoint = {};
                    var defStartPoint = thisObject.params.defStartPoint;
                    if(locationManager){
                        var myPositionInfo = locationManager.getMyPositionInfo();
                        if(defStartPoint && (myPositionInfo["bdid"] != defStartPoint.bdid || !myPositionInfo["floorId"])){
                            startPoint = defStartPoint;
                            startPoint["name"] = defStartPoint["name"]||"站内起点";
                        }else{
                            startPoint["lon"] = myPositionInfo["position"][0];
                            startPoint["lat"] = myPositionInfo["position"][1];
                            startPoint["bdid"] = myPositionInfo["bdid"]||"";
                            startPoint["floorId"] = myPositionInfo["floorId"]||"";
                            startPoint["name"] = "我的位置";
                            startPoint["posMode"] = "myPosition";
                        }
                    }
                    var args = {
                        method:"takeToThere",
                        endPoint:e,
                        startPoint:startPoint//定位起点信息
                    };
                    var params =  thisObject.params;
                    if(params["defStartPoint"]){
                        args["defStartPoint"] = params["defStartPoint"];
                    }
                    if(app._config["openThirdApp_amap"]){

                        var urlParams = 'sid=&did=&dlat='+e["lat"]+"&dlon="+e["lon"]+'&dname='+encodeURIComponent(e["name"])+'&t=0';
                        if(startPoint["lon"] && startPoint["lat"]){
                            urlParams +='&slat='+startPoint["lat"]+"&slon="+startPoint["lon"]+'&sname='+encodeURIComponent(startPoint["name"]);
                        }
                        console.log(urlParams);
                        if(window.AlipayJSBridge){
                            window.AlipayJSBridge.call('amapOpenPage', {
                                pageName: 'route_plan',
                                urlParams: urlParams,
                                isDialog: false,
                                complete: function(res){
                                    alert(JSON.stringify(res));
                                },
                            });
                        }
                        return;
                    }else{

                        app._mapStateManager.pushMapState("MapStateRoute",args);

                    }
                    // app._mapStateManager.pushMapState("MapStateRoute",args);
                },
                onRemoveFavoriteBtnClicked:function (sender,poiInfo){
                    thisObject.removeFavorite(poiInfo);
                },
                onGoback:function (e){
                   /* var command = {
                        "ret" : "Cancel"
                    };
                    thisObject.goBack("favoritePageback", command);*/

                    app._stateManager.goBack();
                }
            });
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
            var bdid = thisObject._app._mapView._mapSDK.getCurrentBDID();
            var command = thisObject._app._params;
            var userId = command.userId;
            var time = new Date().getTime();
            var favoriteUrl = thisObject._app._config["favoriteUrl"] + "/favorites?appid="+ command["token"]+"&secret=" + thisObject._app._params["appKey"] + "&bdid=" + bdid + "&t=" + time;
            var url = favoriteUrl + "&userId=" + userId;
            dxUtil.getData(url,{},"json",function(data){
                if(data.success){
                    var res = data.result;
                    res.forEach(function (list){
                        if(list["floorId"]){
                            var floorInfo = thisObject._app._mapView.currBuilding.getFloorInfo(list["floorId"]);
                            list["flname"] = floorInfo["flname"];
                            list["floorCnName"] = floorInfo["cname"];
                        }
                    })
                    thisObject._favoriteView.updateData(data.result,thisObject._app._config["showShare"]);
                }else{
                    domUtils.showInfo(data.message);
                }
            })
        },
        addFavorite:function (poiInfo){
            var thisObject = this;
            var bdid = thisObject._app._mapView._mapSDK.getCurrentBDID();
            var command = thisObject._app._params;
            var userId = command.userId;
            var time = new Date().getTime();
            var data = {
                "userId": userId,
                "ftId": poiInfo["poiId"],
                "name": poiInfo["name"],
                "address": poiInfo["address"],
                "floorId": poiInfo["floorId"],
                "longitude":parseFloat(poiInfo["lon"]),
                "latitude": parseFloat(poiInfo["lat"])
            }
            var favoriteUrl = thisObject._app._config["favoriteUrl"] + "/favorites?appid="+ command["token"] +"&secret=" + thisObject._app._params["appKey"] + "&bdid=" + bdid + "&t=" + time;
            dxUtil.getDataByPostRaw(favoriteUrl,data,function(data){
                if(data.success){
                    domUtils.showInfo(data.message);
                    thisObject._poiDetailView.updateFavoriteStatus(true);
                    thisObject.getFavorite();
                }else{
                    domUtils.showInfo(data.message);
                }
            },function (e){
                domUtils.showInfo("网络连接失败！");
            })
        },
        removeFavorite:function (poiInfo){
            var thisObject = this;
            var bdid = thisObject._app._mapView._mapSDK.getCurrentBDID();
            var command = thisObject._app._params;
            var userId = command.userId;
            var time = new Date().getTime();
            var favoriteUrl = thisObject._app._config["favoriteUrl"] + "/removeFavorites?appid="+ command["token"]+"&secret=" + thisObject._app._params["appKey"] + "&bdid=" + bdid + "&userId=" + userId + "&id=" + poiInfo["id"] + "&t=" + time;
            dxUtil.getDataByPostRaw(favoriteUrl,{},function(data){
                if(data.success){
                    domUtils.showInfo(data.message);
                    //thisObject._poiDetailView.updateFavoriteStatus(false);
                    thisObject.updateData();
                }else{
                    domUtils.showInfo(data.message);
                }
            })
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

    });

    daxiapp["MapStateFavoritePage"] = MapStateFavoritePage;
})(window);
