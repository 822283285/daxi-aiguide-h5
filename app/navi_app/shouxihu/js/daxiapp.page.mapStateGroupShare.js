(function (global) {
  "use strict";
  const daxiapp = global["DaxiApp"] || {};
  const daximap = window["DaxiMap"] || {};
  const domUtils = daxiapp["dom"];
  const DXUtils = daxiapp["utils"];
  const MapStateClass = daxiapp["MapStateClass"];
  const MapStateShareGroup = MapStateClass.extend({;
    __init__: function () {
      this._super();
      this._rtti = "MapStateShareGroup";
      this._markers = {};
    },

    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      thisObject.pageName = "share_group_page";
      //<li class="copy_btn" style="margin-right: 10px;line-height: 30px;padding: 0px 10px;border: 1px solid #787879;border-radius: 4px;font-size: 1.1rem;color: #787879;">复制口令</li>
      const basicMap_html = `<div id="share_group_page" class="dx_widget_base_container">;
        <input id="groupid" value="" readonly style="position: absolute; z-index: -1" />
            <div class="dx_header_wrapper_with_text" style="height: auto">
                <ul class="dx_header">
                <li class="goback icon-fanhui"></li>
                <li class="title" style="display: block; padding: 5px; text-align: center">
                    <p class="group_name" style="padding: 3px; line-height: 1.2"><span class="members_count"></span>人在位置共享</p>
                    <p class="group_id" style="font-size: 1rem; line-height: 1.2">群组口令</p>
                </li>
                <li style="height: 32px; width: 52px;">&nbsp</li>
                <!-- <li
                    class="invite_btn"
                    style="margin-right: 10px; line-height: 30px; padding: 0px 10px; border: 1px solid #787879; border-radius: 4px; font-size: 1.1rem; color: #787879"
                >
                    邀请好友
                </li> -->
                </ul>
            </div>
        </div>`;

      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#" + thisObject.pageName);
      thisObject._bdid = "";
      const sharePosServer = thisObject._app._config["user"] && thisObject._app._config["user"]["sharePosServer"];

      thisObject._dom.on("click", ".goback", function () {
        daxiapp["domUtil"].dialogWithModal({
          text: "确定退出组队?",
          btn1: "取消",
          confirmCB: function () {
            thisObject.clearAllRenderObject();
            clearInterval(thisObject.timer);
            app._stateManager.goBack();
            app._stateManager.invokeCallback("shareGroupCallback");
            const url = sharePosServer[sharePosServer.length - 1] == "/" ? sharePosServer + "quitFromGroup" : sharePosServer + "/quitFromGroup";
            const userInfo = thisObject.params["data"];
            DXUtils.getDataBySecurityRequest(
              url,
              "post",
              { groupId: thisObject.params["groupId"], token: thisObject._app._params["token"], userId: userInfo["userId"] },
              function (result) {
                console.log(result);
              },
              function () {},
            );
          },
        });
      });
      // thisObject._dom.on("click",".copy_btn",function(){
      //     var inputElement = document.querySelector('#groupId');
      //     inputElement.select();
      //     document.execCommand('copy');
      //     inputElement.blur();
      //     daxiapp["domUtil"].tipMessage("复制成功",3000);

      // });
      thisObject._dom.on("click", ".invite_btn", function () {
        const params = thisObject.params;
        const token = thisObject._app._params["token"];
        const groupId = params["groupId"];
        const title = "";
        const userInfo = thisObject._app._params["userInfo"];
        if (userInfo["userName"]) {
          title = userInfo["userName"] + "共享的位置";
        }
        app.jsBridge.inviteFriendToGroup({ token: token, groupId: groupId, method: "addPosShareGroup", title: title });
      });

      thisObject._poiResultView = new daxiapp["DXPoiResultView2"](app, thisObject._dom);
      thisObject._poiResultView.init({
        onSelectItemAtIndexPath: function (sender, e) {
          const mapSDK = app._mapView._mapSDK;
          mapSDK["easeTo"](e);
          thisObject.activeMemberId = e["poiId"];
          thisObject._app._mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap.UserTrackingMode.None);
        },
        onTakeToThere: function (sender, e) {
          const args = {
            method: "takeToThere",
            endPoint: e,
          };
          app._stateManager.pushState("MapStateRoute", args);
        },
      });
      thisObject._poiResultView.setWidgetHeight(254);
      this.show(false);
    },

    setUserTrackingModeToNone: function () {
      // this._app._mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap["UserTrackingMode"]["None"])
      const mapView = this._app._mapView;
      const locationManager = mapView._locationManager;
      const locState = locationManager["getLocationState"]();
      if (locState == DaxiMap["LocationState"]["LOCATED"]) {
        mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap["UserTrackingMode"]["None"]);
      } else {
        mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap["UserTrackingMode"]["Unknown"]);
      }
    },
    onStateBeginWithParam: function (args) {
      this._super(args);
      this.activeMemberId = "";
      const mapView = this._app._mapView;
      this.isNotActive = false;
      mapView.setTopViewHeight(60);
      mapView.setBottomViewHeight(284);
      this.params = args;
      const token = this._app._params["token"];
      const groupId = args["groupId"];
      const userInfo = args["data"],;
        members = args["members"];
      const count = members.length + 1;
      const dom = this._dom;
      dom.find(".members_count")["text"](count);
      dom.find(".group_id")["text"]("群组口令 " + groupId);
      dom.find("#groupId").val(groupId);
      try {
        if (!userInfo["userName"]) {
          daxiapp["domUtil"].tipMessage("点击右下角我的菜单可以设置头像用户名", 4000);
        }
        const isFirst = true;
        this.refreshMembers(userInfo, token, groupId, this, isFirst);
        clearInterval(this.timer);
        this.timer = setInterval(this.refreshMembers, 2000, userInfo, token, groupId, this);
      } catch (e) {
        console.log(e.toString());
      }
    },

    onHideByPushStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView.pushState(true);
      this.isNotActive = true;
      this.clearMapAllObject();
    },

    onShowByPopStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView.popState();
      this.isNotActive = false;
    },

    onStateEnd: function (args) {
      this.isNotActive = true;
      this._super(args);

      this.clearMapAllObject();
    },

    clearMapAllObject: function () {
      this.clearAllRenderObject();
      this.markerLayer = null;
    },

    showMarkers: function (data, isFirst) {
      const thisObject = this;
      const mapSDK = thisObject._app._mapView._mapSDK;
      const onMarkerClick = function (marker) {;
        thisObject._app._mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap.UserTrackingMode.None);
        thisObject._poiResultView.setActiveById(marker.id || marker._options["featureId"]);
      };
      const markers = [];
      const bdid = thisObject._app._mapView._mapSDK["getCurrentBDID"]();
      for (var poiIndex in data) {
        const poiInfo = data[poiIndex];
        bdid = poiInfo["bdid"] || "";
        poiInfo["width"] = 48;
        poiInfo["height"] = 48;
        poiInfo["scale"] = 0.5;
        poiInfo["onClick"] = onMarkerClick;
        markers.push(poiInfo);
      }
      if (thisObject.markerLayer) {
        thisObject.markerLayer.setData(markers);
        if (isFirst && thisObject.activeMemberId != "") {
          const poiData = thisObject._poiResultView.onlySetItemActiveById(thisObject.activeMemberId);
          if (poiData) {
            mapSDK["easeTo"](poiData);
          }
        }
        return;
      }
      const markerLayer = new daximap["DXSceneMarkerLayer"]();
      markerLayer.initialize(mapSDK, { markers: markers, bdid: bdid, "icon-allow-overlap": true, onClick: onMarkerClick });
      markerLayer.id = "marker" + daxiapp["utils"].createUUID();
      markerLayer.addToMap();
      thisObject._renderObjects.push(markerLayer);
      thisObject.markerLayer = markerLayer;
      if (isFirst) {
        thisObject._poiResultView.setActiveByIndex(0);
      }
    },

    // 显示Pois
    refreshMembers: function (params, token, groupId, thisObject, isFirst) {
      const sharePosServer = thisObject._app._config["user"] && thisObject._app._config["user"]["sharePosServer"];
      const url = sharePosServer[sharePosServer.length - 1] == "/" ? sharePosServer + "postPosition" : sharePosServer + "/postPosition";
      const userId = params["userId"];
      const location = thisObject._app._mapView._locationManager["getMyPositionInfo"]();
      const data = {
        userId: userId,
        groupId: groupId,
        token: token,
        lng: location.position[0],
        lat: location.position[1],
        bdid: location.bdid,
        floorId: location.floorId,
        userName: params["userName"],
        avatarUrl: params["avatarUrl"],
      };

      DXUtils.getDataBySecurityRequest(
        url,
        "post",
        data,
        function (result) {
          if (thisObject.isNotActive) {
            return;
          }
          if (result["ret"] == "OK") {
            const members = result["members"];
            const count = members.length + 1;
            const dom = thisObject._dom;
            dom.find(".members_count")["text"](count);
            const selfInfo = {
              noRoute: true,
              id: userId,
              poiId: userId,
              text: "我的位置",
              lon: data["lng"],
              lat: data["lat"],
              floorId: data["floorId"],
              bdid: data["bdid"],
              imageUrl: params["avatarUrl"] || "blue_dot",
            };
            if (selfInfo["imageUrl"]) {
              selfInfo["scale"] = 0.5;
              selfInfo["iconOffset"] = [0, -25];
            }
            const list = [];
            members.forEach(function (member) {
              const avatarUrl = member["avatarUrl"];
              const item = {
                id: member["userId"],
                poiId: member["userId"],
                text: member["userName"],
                lon: member["lng"],
                lat: member["lat"],
                floorId: member["floorId"],
                bdid: member["bdid"],
                imageUrl: avatarUrl || "blue_dot",
                highlightImageUrl: avatarUrl || "red_dot",
                showText: true,
              };
              if (avatarUrl) {
                item["scale"] = 0.5;
                item["iconOffset"] = [0, -25];
              }
              list.push(item);
            });

            thisObject.showMarkers(list, isFirst);
            // selfInfo
            thisObject._poiResultView.updateData([selfInfo].concat(list));
          } else {
            daxiapp["domUtil"].tipMessage(result["msg"] || result["errMsg"] || "请求失败", 2000);
          }
        },
        function (result) {
          // 提示报错
          daxiapp["domUtil"].tipMessage(result["msg"] || result["errMsg"] || "请求列表失败", 2000);
        },
      );
    },
  });

  daxiapp["MapStateShareGroup"] = MapStateShareGroup;
})(window);
