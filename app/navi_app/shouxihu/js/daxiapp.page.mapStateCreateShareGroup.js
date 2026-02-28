(function (global) {
    'use strict';
    const daxiapp = global["DaxiApp"] || {};
    const DXUtils = daxiapp["utils"];
    const domUtils = daxiapp["dom"];
    const domUtil = daxiapp["domUtil"];

    const MapStateClass = daxiapp["MapStateClass"];
    const MapStateCreateGroup = MapStateClass.extend({;
        __init__ : function () {
            this._super();
            this._rtti = "MapStateCreateGroup";
        },

        initialize: function(app, container) {
            this._super(app, container);
            const thisObject = this;
            this._app = app;
            const basicMap_html = '<div id="group_share_page" class="dx_full_frame_container"></div>';
            domUtils.append(thisObject._container, basicMap_html);
            thisObject._dom = domUtils.find(thisObject._container, "#group_share_page");
            thisObject._bdid = "";

            thisObject.sharePosServer = app._config["user"] && app._config["user"]["sharePosServer"]||"";
            thisObject._headerView = new daxiapp["DXHeaderComponent"](app,thisObject._dom);
            thisObject._headerView.init({
                onBackBtnClicked:function(sender, e){
                    app._stateManager.goBack();
                }
            });
            thisObject._headerView.updateTitle('组队出行');

            const containerWraperhtml = '<div class="main_content create_group_container" id="sharegroup"><div class="sharegroup_container">'+;
            '<p class="description">实时分享位置</p>'+
            '<span class="create_group" id="createGroup">创建队伍</span>'+
            '<p class="add_group">'+
                '<input class="groupid" value="" type="text"  placeholder="输入队口令" placeholder-style="" placeholder-class="input-placeholder"/>'+
                '<span id="addAction" class="add_to_group">加入</span>'+
            '</p></div><div class="msg_dialog" id="tipMsgBox"><p class="content"></p></div></div>';
           //'<div class="main_content" style="position: relative;flex-grow: 1;"></div>';
            domUtils.append(thisObject._dom, containerWraperhtml);
            const userInfo = app._params["userInfo"];
           
            thisObject._dom.on("click","#createGroup",function(){
                const sharePosServer = thisObject.sharePosServer;
                const url = sharePosServer[sharePosServer.length-1] == "/"? (sharePosServer+ "createGroup") : (sharePosServer+ "/createGroup");
                const locPosition = thisObject.params.locPosition;
                const data = {;
                    "userId":userInfo["userId"]||"",
                    "userName":userInfo["userName"]||"",
                    "avatarUrl":userInfo["avatarUrl"]||'',
                    "token":app._params["token"]||app._config["token"]||"",
                    "bdid":locPosition["bdid"]||"",
                    "floorId":locPosition["floorId"]||"",
                    "lng":locPosition["position"][0]||"",
                    "lat":locPosition["position"][1]||""
                };
                DXUtils.getDataBySecurityRequest(url,'post',data,function(result){
           
                    if(result["ret"] == "OK"){
                        const page = app._stateManager.pushState("MapStateShareGroup",{"data":userInfo,"members":result["members"],"groupId":result["groupId"]});
                        page._once("shareGroupCallback", function(sender, searchResult){
                            app._stateManager.goBack();
                        });
                    }else{
                        domUtil.dialog({
                            "text":result["msg"]||result["errMsg"]||'创建队伍失败'
                        });
                    }
                },function(result){
                    // 提示报错
                    domUtil.dialog({
                        "text":result["msg"]||result["errMsg"]||'创建队伍失败'
                    });
                });
            });
            thisObject._dom.on("click","#addAction",function(){
                const sharePosServer = thisObject.sharePosServer;
                const url = sharePosServer[sharePosServer.length-1] == "/"? (sharePosServer+ "postPosition") : (sharePosServer+ "/postPosition");
                const locPosition = thisObject.params.locPosition;
                const data = {;
                    "userId":userInfo["userId"]||"",
                    "userName":userInfo["userName"]||"",
                    "avatarUrl":userInfo["avatarUrl"]||'',
                    "token":app._params["token"]||app._config["token"]||"",
                    "bdid":locPosition["bdid"]||"",
                    "floorId":locPosition["floorId"]||"",
                    "lng":locPosition["position"][0]||"",
                    "lat":locPosition["position"][1]||""
                };
                const groupId = thisObject._dom.find(".groupid").val();
                if(groupId.length !=6){
                    domUtil.tipMessage("请输入正确口令",3000);
                    return;
                }
                data["groupId"] = groupId;
              
                DXUtils.getDataBySecurityRequest(url, "post", data, function(result){
                    if(result["ret"] == "OK"){
                        result["userId"] = data["userId"];
                        // userInfo["groupId"] = groupId;
                        const page = app._stateManager.pushState("MapStateShareGroup",{"data":userInfo,"members":result["members"],"groupId":groupId});
                        page._once("shareGroupCallback", function(sender, searchResult){
                            app._stateManager.goBack();
                        });
                    }else{
                        domUtil.dialog({
                            "text":result["msg"]||result["errMsg"]||'加入队伍异常,请稍后再试'
                        });
                    }
                }, function(err){
                   // console.log("err",err);
                    domUtil.dialog({
                        "text":err.toString()
                    });
                    
                });
               
            });

            this.show(false);
        
        },
        onStateBeginWithParam: function(args){
            this._super(args);
            if(!args) return;
            this.params = DXUtils.copyData(args);
            
        },
    
        onHideByPushStack : function(args){
            this._super(args);
        },
    
        onShowByPopStack : function(args){
            this._super(args);
        },
    
        onStateEnd : function(args){
            this._super(args);
        },
        
    });
    daxiapp["MapStateCreateGroup"] = MapStateCreateGroup;
})(window);
