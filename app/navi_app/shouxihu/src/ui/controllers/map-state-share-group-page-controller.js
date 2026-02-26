function resolveDeps(options = {}) {
  const globalRef = options.globalRef || globalThis;
  const daxiapp = options.daxiapp || globalRef.DaxiApp || {};
  const daximap = options.daximap || globalRef.DaxiMap || {};

  return {
    globalRef,
    daxiapp,
    DaxiMap: options.DaxiMap || daximap,
    domUtils: options.domUtils || daxiapp.dom,
    domUtil: options.domUtil || daxiapp.domUtil,
    DXUtils: options.DXUtils || daxiapp.utils,
    MapStateClass: options.MapStateClass || daxiapp.MapStateClass,
    PoiResultViewCtor: options.PoiResultViewCtor || daxiapp.DXPoiResultView2,
    SceneMarkerLayerCtor: options.SceneMarkerLayerCtor || daximap.DXSceneMarkerLayer,
  };
}

function buildServiceUrl(baseUrl, path) {
  if (!baseUrl) {
    return "";
  }
  return baseUrl[baseUrl.length - 1] == "/" ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
}

export function createMapStateShareGroupPageController(options = {}) {
  const deps = resolveDeps(options);
  const { globalRef, DaxiMap, domUtils, domUtil, DXUtils, MapStateClass, PoiResultViewCtor, SceneMarkerLayerCtor } = deps;
  if (!MapStateClass || typeof MapStateClass.extend !== "function") {
    return null;
  }

  return MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "MapStateShareGroup";
      this._markers = {};
    },

    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      thisObject.pageName = "share_group_page";
      const basicMapHtml = `<div id="share_group_page" class="dx_widget_base_container">
        <input id="groupid" value="" readonly style="position: absolute; z-index: -1" />
            <div class="dx_header_wrapper_with_text" style="height: auto">
                <ul class="dx_header">
                <li class="goback icon-fanhui"></li>
                <li class="title" style="display: block; padding: 5px; text-align: center">
                    <p class="group_name" style="padding: 3px; line-height: 1.2"><span class="members_count"></span>\u4eba\u5728\u4f4d\u7f6e\u5171\u4eab</p>
                    <p class="group_id" style="font-size: 1rem; line-height: 1.2">\u7fa4\u7ec4\u53e3\u4ee4</p>
                </li>
                <li style="height: 32px; width: 52px;">&nbsp</li>
                </ul>
            </div>
        </div>`;

      domUtils.append(thisObject._container, basicMapHtml);
      thisObject._dom = domUtils.find(thisObject._container, `#${thisObject.pageName}`);
      thisObject._bdid = "";
      const sharePosServer = thisObject._app._config.user && thisObject._app._config.user.sharePosServer;

      thisObject._dom.on("click", ".goback", function () {
        domUtil.dialogWithModal({
          text: "\u786e\u5b9a\u9000\u51fa\u7ec4\u961f?",
          btn1: "\u53d6\u6d88",
          confirmCB: function () {
            thisObject.clearAllRenderObject();
            clearInterval(thisObject.timer);
            app._stateManager.goBack();
            app._stateManager.invokeCallback("shareGroupCallback");
            const url = buildServiceUrl(sharePosServer, "quitFromGroup");
            const userInfo = thisObject.params.data || {};
            DXUtils.getDataBySecurityRequest(
              url,
              "post",
              { groupId: thisObject.params.groupId, token: thisObject._app._params.token, userId: userInfo.userId },
              function (result) {
                if (globalRef.console && typeof globalRef.console.log === "function") {
                  globalRef.console.log(result);
                }
              },
              function () {},
            );
          },
        });
      });

      thisObject._dom.on("click", ".invite_btn", function () {
        const params = thisObject.params;
        const token = thisObject._app._params.token;
        const groupId = params.groupId;
        let title = "";
        const userInfo = thisObject._app._params.userInfo;
        if (userInfo.userName) {
          title = `${userInfo.userName}\u5171\u4eab\u7684\u4f4d\u7f6e`;
        }
        app.jsBridge.inviteFriendToGroup({ token, groupId, method: "addPosShareGroup", title });
      });

      thisObject._poiResultView = new PoiResultViewCtor(app, thisObject._dom);
      thisObject._poiResultView.init({
        onSelectItemAtIndexPath: function (_sender, e) {
          const mapSDK = app._mapView._mapSDK;
          mapSDK.easeTo(e);
          thisObject.activeMemberId = e.poiId;
          thisObject._app._mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap.UserTrackingMode.None);
        },
        onTakeToThere: function (_sender, e) {
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
      const mapView = this._app._mapView;
      const locationManager = mapView._locationManager;
      const locState = locationManager.getLocationState();
      if (locState == DaxiMap.LocationState.LOCATED) {
        mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap.UserTrackingMode.None);
      } else {
        mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap.UserTrackingMode.Unknown);
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
      const token = this._app._params.token;
      const groupId = args.groupId;
      const userInfo = args.data;
      const members = args.members;
      const count = members.length + 1;
      const dom = this._dom;
      dom.find(".members_count").text(count);
      dom.find(".group_id").text(`\u7fa4\u7ec4\u53e3\u4ee4 ${groupId}`);
      dom.find("#groupId").val(groupId);
      try {
        if (!userInfo.userName) {
          domUtil.tipMessage("\u70b9\u51fb\u53f3\u4e0b\u89d2\u6211\u7684\u83dc\u5355\u53ef\u4ee5\u8bbe\u7f6e\u5934\u50cf\u7528\u6237\u540d", 4000);
        }
        const isFirst = true;
        this.refreshMembers(userInfo, token, groupId, this, isFirst);
        clearInterval(this.timer);
        this.timer = setInterval(this.refreshMembers, 2000, userInfo, token, groupId, this);
      } catch (e) {
        if (globalRef.console && typeof globalRef.console.log === "function") {
          globalRef.console.log(e.toString());
        }
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
      const onMarkerClick = function (marker) {
        thisObject._app._mapView._locationBtnCtrl.setUserTrackingMode(DaxiMap.UserTrackingMode.None);
        thisObject._poiResultView.setActiveById(marker.id || marker._options.featureId);
      };
      const markers = [];
      let bdid = thisObject._app._mapView._mapSDK.getCurrentBDID();
      for (const poiIndex in data) {
        const poiInfo = data[poiIndex];
        bdid = poiInfo.bdid || "";
        poiInfo.width = 48;
        poiInfo.height = 48;
        poiInfo.scale = 0.5;
        poiInfo.onClick = onMarkerClick;
        markers.push(poiInfo);
      }
      if (thisObject.markerLayer) {
        thisObject.markerLayer.setData(markers);
        if (isFirst && thisObject.activeMemberId != "") {
          const poiData = thisObject._poiResultView.onlySetItemActiveById(thisObject.activeMemberId);
          if (poiData) {
            mapSDK.easeTo(poiData);
          }
        }
        return;
      }
      const markerLayer = new SceneMarkerLayerCtor();
      markerLayer.initialize(mapSDK, { markers, bdid, "icon-allow-overlap": true, onClick: onMarkerClick });
      markerLayer.id = `marker${DXUtils.createUUID()}`;
      markerLayer.addToMap();
      thisObject._renderObjects.push(markerLayer);
      thisObject.markerLayer = markerLayer;
      if (isFirst) {
        thisObject._poiResultView.setActiveByIndex(0);
      }
    },

    refreshMembers: function (params, token, groupId, thisObject, isFirst) {
      const sharePosServer = thisObject._app._config.user && thisObject._app._config.user.sharePosServer;
      const url = buildServiceUrl(sharePosServer, "postPosition");
      const userId = params.userId;
      const location = thisObject._app._mapView._locationManager.getMyPositionInfo();
      const position = location.position || [];
      const data = {
        userId,
        groupId,
        token,
        lng: position[0],
        lat: position[1],
        bdid: location.bdid,
        floorId: location.floorId,
        userName: params.userName,
        avatarUrl: params.avatarUrl,
      };

      DXUtils.getDataBySecurityRequest(
        url,
        "post",
        data,
        function (result) {
          if (thisObject.isNotActive) {
            return;
          }
          if (result.ret == "OK") {
            const members = result.members;
            const count = members.length + 1;
            const dom = thisObject._dom;
            dom.find(".members_count").text(count);
            const selfInfo = {
              noRoute: true,
              id: userId,
              poiId: userId,
              text: "\u6211\u7684\u4f4d\u7f6e",
              lon: data.lng,
              lat: data.lat,
              floorId: data.floorId,
              bdid: data.bdid,
              imageUrl: params.avatarUrl || "blue_dot",
            };
            if (selfInfo.imageUrl) {
              selfInfo.scale = 0.5;
              selfInfo.iconOffset = [0, -25];
            }
            const list = [];
            members.forEach(function (member) {
              const avatarUrl = member.avatarUrl;
              const item = {
                id: member.userId,
                poiId: member.userId,
                text: member.userName,
                lon: member.lng,
                lat: member.lat,
                floorId: member.floorId,
                bdid: member.bdid,
                imageUrl: avatarUrl || "blue_dot",
                highlightImageUrl: avatarUrl || "red_dot",
                showText: true,
              };
              if (avatarUrl) {
                item.scale = 0.5;
                item.iconOffset = [0, -25];
              }
              list.push(item);
            });

            thisObject.showMarkers(list, isFirst);
            thisObject._poiResultView.updateData([selfInfo].concat(list));
          } else {
            domUtil.tipMessage(result.msg || result.errMsg || "\u8bf7\u6c42\u5931\u8d25", 2000);
          }
        },
        function (result) {
          domUtil.tipMessage(result.msg || result.errMsg || "\u8bf7\u6c42\u5217\u8868\u5931\u8d25", 2000);
        },
      );
    },
  });
}

export function registerMapStateShareGroupPageController(options = {}) {
  const deps = resolveDeps(options);
  const controller =
    options.controller ||
    createMapStateShareGroupPageController({
      ...options,
      globalRef: deps.globalRef,
      daxiapp: deps.daxiapp,
      DaxiMap: deps.DaxiMap,
      domUtils: deps.domUtils,
      domUtil: deps.domUtil,
      DXUtils: deps.DXUtils,
      MapStateClass: deps.MapStateClass,
      PoiResultViewCtor: deps.PoiResultViewCtor,
      SceneMarkerLayerCtor: deps.SceneMarkerLayerCtor,
    });

  if (!controller) {
    return null;
  }

  deps.daxiapp.MapStateShareGroup = controller;
  return controller;
}
