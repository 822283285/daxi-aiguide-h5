(function (global) {
  "use strict";
  const daxiapp = global.DaxiApp || {};
  const daximap = window.DaxiMap || {};
  const DXMapUtils = daximap.DXMapUtils;
  const dxUtil = daxiapp.utils;
  const DxDomUtil = daxiapp.domUtil;
  const domUtils = daxiapp.dom;
  const MapStateClass = daxiapp.MapStateClass;

  /** 通用按钮样式配置 */
  const BTN_STYLE_CONFIG = {
    height: "auto",
    "text-align": "center",
    "font-size": "18px",
    "line-height": "26px",
  };

  /** 底部按钮配置映射 */
  const BOTTOM_BTN_CONFIG = {
    AI: { icon: "icon-xnr", text: "AI数字人" },
    share: { icon: "icon-button_fenxiang", text: "分享" },
    sharePosServer: { icon: "icon-zhudui", text: "共享" },
    help: { icon: "icon_gb-help", text: "教程" },
    guideLine: { icon: "icon-line", text: "旅游路线" },
  };

  const MapStateBrowse = MapStateClass.extend({
    /** 初始化运行时类型标识 */
    __init__: function () {
      this._super();
      this._rtti = "MapStateBrowse";
    },

    /**
     * 初始化地图浏览状态
     * @param {Object} app - 应用实例
     * @param {HTMLElement} container - 容器元素
     */
    initialize: function (app, container) {
      this._super(app, container);
      this._app = app;
      app.exhibitsLayer = {};
      this.panoPoiVisible = false;
      const thisObject = this;
      this.lastOpenVoiceTime = 0;

      const basicMap_html = '<div id="browse_map_page" class="browse_map_page"></div>';
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#browse_map_page");
      thisObject._bdid = null;

      // 非单景区模式下初始化返回按钮
      if (!thisObject._app._config.singleScenic) {
        let backBtn = thisObject._dom.find(".hospital-back");
        if (backBtn.length == 0) {
          backBtn = "<div class='hospital-back' style='top:88px; left:10px'></div>";
          thisObject._dom.append(backBtn);
        }
        thisObject._backBtn = domUtils.find(thisObject._dom, ".hospital-back");
        thisObject._backBtn.on("click", () => {
          thisObject._showExitConfirm(() => {
            window.parent.navigateToUni("changeTab", "/pages/home/home");
          });
        });
      }

      thisObject._dom.append(
        '<div class="station" id="stationbtn_container" style="width:100%;position:absolute;top:66px;text-align: center;left:20vw;width: 60vw;"></div>',
      );

      thisObject._confirmComponent = new daxiapp.DXShowConfirmComponent();
      thisObject._confirmComponent.init(thisObject._dom, { visible: false });

      thisObject._sceneListComponent = new daxiapp.DXShowSceneListComponent();
      thisObject._sceneListComponent.init(thisObject._dom, {
        visible: false,
        onSceneClick: (id) => {
          let flag = false;
          thisObject.scenelist.forEach((list) => {
            if (list.id == id && list.list?.length) {
              list.show = !list.show;
              flag = true;
            }
          });
          if (flag) {
            thisObject._sceneListComponent.updateData({
              bdname: thisObject._app._mapView.currBuildingInfo.bdInfo.cn_name,
              data: thisObject.scenelist,
            });
          }
        },
        more: () => {
          if (thisObject.citylist) {
            thisObject._cityListComponent.slideUp();
          } else {
            thisObject.getCityList((res) => {
              thisObject._cityListComponent.updateData(res, thisObject.activeCityCode);
              thisObject._cityListComponent.slideUp();
            });
          }
        },
        tapScene: (id, token, bdid) => {
          thisObject.setCurrentBuilding(token, bdid, () => {
            const params = { bdid };
            app._stateManager.pushState("MapStateBrowse", params);
            setTimeout(() => {
              thisObject._app.pageCommand.openExhibit({ id, token, bdid, type: "Exhibit" });
            }, 0);
          });
        },
      });

      thisObject._cityListComponent = new daxiapp.DXShowCityListComponent();
      thisObject._cityListComponent.init(thisObject._dom, {
        visible: false,
        LeftDeptTap: (citycode) => {
          thisObject.activeCityCode = citycode;
          thisObject._cityListComponent.updateData(thisObject.citylist, thisObject.activeCityCode);
        },
        goto: (token, bdid, bdname) => {
          thisObject._cityListComponent.slideDown();
          thisObject.getSceneList(token, bdid, (data) => {
            thisObject._sceneListComponent.slideUp();
            thisObject._sceneListComponent.updateData({ bdname, data });
          });
        },
      });

      thisObject._tipComponent = new daxiapp.DXShowTipsComponent();
      thisObject._tipComponent.init(thisObject._dom, { visible: false });

      if (!app._config.hideFooter) {
        thisObject._poiShortcutView = new daxiapp.DXButtonListPanelView3(app, thisObject._dom);
        thisObject._poiShortcutView.init({
          onFooterClick: (sender, args) => {
            const id = parseInt(args.id) || args.index;
            const url = args.url;
            const naviType = args.navitype;

            if (url) {
              const fullUrl = `${url}?token=${thisObject._app._params.token}&bdid=${sender.bdid}`;
              thisObject._navigateToMiniProgram(naviType == 1 ? "switchTab" : "navigateTo", fullUrl);
              return;
            }

            const pageActions = {
              0: () => this._app._stateManager.pushState("HomePage", {}),
              // 1: () => this._app._stateManager.pushState("MapStateBrowse", {}),
              2: () => window.parent.navigateToUni("navigateTo", "/pages/media/player-2"),
              3: () => this._app._stateManager.pushState("ServicePage", {}),
              4: () => this._app._stateManager.pushState("ProfilePage", {}),
            };
            pageActions[id]?.();
          },
          onDataUpdated: (sender, height) => {
            thisObject.naviHeight = height;
            if (height) {
              app._mapView.setBottomViewHeight(thisObject._app._config.bottomMargin || 60);
            }
          },
        });
      }
    },

    /**
     * 显示退出确认弹窗
     * @param {Function} confirmCallback - 确认回调函数
     */
    _showExitConfirm: function (confirmCallback) {
      this._confirmComponent.show({
        title: "确定要退出地图",
        btnArray: ["取消", "确定"],
        callback: () => {},
        callback1: confirmCallback,
      });
    },

    /**
     * 微信小程序导航封装
     * @param {string} method - 导航方法名
     * @param {string} url - 目标URL
     */
    _navigateToMiniProgram: function (method, url) {
      wx?.miniProgram?.[method]?.({ url });
    },

    /**
     * 设置当前建筑
     * @param {string} token - 令牌
     * @param {string} bdid - 建筑ID
     * @param {Function} callbackFn - 回调函数
     */
    setCurrentBuilding: function (token, bdid, callbackFn) {
      const params = this._app._params;
      daxiapp.api.cacheTokenAndBDID(
        {
          token: token || params.token,
          bdid: bdid || params.bdid,
          openid: params.userId,
        },
        (res) => {
          if (res.code != 0) {
            domUtils.showInfo("切景点接口失败");
          }
          callbackFn?.();
        },
        (err) => {
          domUtils.showInfo("切景点接口失败");
          console.log(err);
        },
      );
    },

    /** 共享位置到服务器 */
    sharePosServer: function () {
      const thisObject = this;
      const mapView = thisObject._app._mapView;
      const locationManager = mapView._locationManager;
      const positionInfo = locationManager.getMyPositionInfo();

      if (!positionInfo.position[0]) {
        DxDomUtil.tipNotice("暂时无法共享位置,请等待定位成功后再试", 3000, null, { subStyle: { color: "#1f97ef" } });
        return;
      }

      const userInfo = thisObject._app._params.userInfo;
      if (!userInfo?.userId) return;

      const pushStateParams = { method: "shareRealTimePosition", locPosition: positionInfo };

      if (userInfo.avatarUrl) {
        thisObject._app._stateManager.pushState("MapStateCreateGroup", pushStateParams);
        return;
      }

      // 获取用户信息
      daxiapp.common.getUserInfo({
        url: thisObject._app._config.user.userServerUrl,
        data: {
          userId: userInfo.userId,
          projScene: thisObject._app._params.projScene,
        },
        successFn: (data) => {
          userInfo.avatarUrl = data.avatarUrl;
          userInfo.userName = data.username;
          thisObject._app._stateManager.pushState("MapStateCreateGroup", pushStateParams);
        },
        failedFn: () => {
          const defaultAvatarUrl = "https://daoyou.daxicn.com/managerApi/api/anon/localOssFiles/avatar/fc2eeed6-85db-4681-822c-eb892e19f6b5.jpg";
          const defaultUserName = "匿名用户";
          const info = thisObject._app._params.userInfo || (thisObject._app._params.userInfo = {});
          info.avatarUrl = info.avatarUrl || defaultAvatarUrl;
          info.userName = info.userName || defaultUserName;

          daxiapp.api.updateUserInfo(
            { username: info.userName, avatarUrl: info.avatarUrl, openid: thisObject._app._params.userId },
            () => thisObject._app._stateManager.pushState("MapStateCreateGroup", pushStateParams),
            () => thisObject._app._stateManager.pushState("MapStateCreateGroup", pushStateParams),
          );
        },
      });
    },

    /** 显示全景组件 */
    showPanoComponent: function () {
      const thisObject = this;
      if (!thisObject._panoCtrl) {
        const baseUrl = window.location.href.substr(0, window.location.href.lastIndexOf("/") + 1);
        const panoBaseUrl = window.panoPath || "../pano/index.html";
        const targetDomain = baseUrl + panoBaseUrl;

        thisObject._app.panoInstance = new daxiapp.DXIframeComponent(thisObject._app, thisObject._dom, {
          link: targetDomain,
          id: "panoIfr",
          style: { height: "100vh" },
        });
        thisObject._app.panoInstance.init();

        thisObject._panoCtrl = new daxiapp.DXIconBtnComponent();
        thisObject._panoCtrl.init({
          onClicked: () => thisObject.togglePanoPois(),
        });
        thisObject._panoCtrl.updateIcon("icon-pano");
        thisObject._panoCtrl.setStyle({
          "box-sizing": "border-box",
          width: "28px",
          height: "28px",
          "text-align": "center",
          "font-size": "18px",
          "line-height": "26px",
          padding: "2px",
        });
        thisObject._listComponent.appendItem(thisObject._panoCtrl._dom);
      } else {
        thisObject._listComponent.showItem(thisObject._panoCtrl._dom);
      }
      thisObject._listComponent.show();
    },

    /** 隐藏全景组件 */
    hidePanoComponent: function () {
      if (this._panoCtrl) {
        this._listComponent.hideItem(this._panoCtrl._dom);
      }
    },

    /**
     * 切换日夜模式
     * @param {boolean} noChange - 是否不切换状态
     */
    changeDayNight: function (noChange) {
      const thisObject = this;
      if (!thisObject._app._config.hasNightScene?.[thisObject._bdid]) return;

      this.isDay = noChange ? this.isDay : !this.isDay;
      thisObject._timeModeCtrl?.updateIcon(this.isDay ? "icon-sun" : "icon-night");
      thisObject._timeModeCtrl?.updateText(this.isDay ? "白天" : "夜景");

      const exhibitsLayer = this._app.exhibitsLayer;
      if (!exhibitsLayer) return;

      for (const key in exhibitsLayer) {
        const exhibitLayer = exhibitsLayer[key];
        const visible = (this.isDay && exhibitLayer.period != 2) || (!this.isDay && exhibitLayer.period != 1);
        exhibitLayer.setVisible(visible);
      }
    },

    /** 定时检查日夜切换 */
    checkDayNight: function () {
      const thisObject = this;
      if (thisObject.checkDayNightTimer) {
        clearInterval(thisObject.checkDayNightTimer);
      }

      thisObject.checkDayNightTimer = setInterval(() => {
        const currTime = new Date();
        const hours = currTime.getHours() + currTime.getMinutes() / 60;
        const dayTime = thisObject._app._config.dayTime;

        if (hours == dayTime[0] && thisObject.isDay == false) {
          thisObject._showDayNightConfirm("天亮了，是否改为白天模式");
        }
        if (hours == dayTime[1] && thisObject.isDay == true) {
          thisObject._showDayNightConfirm("天黑了，是否改为夜间模式");
        }
      }, 60000);
    },

    /**
     * 显示日夜切换确认弹窗
     * @param {string} title - 弹窗标题
     */
    _showDayNightConfirm: function (title) {
      const thisObject = this;
      thisObject._confirmComponent.show({
        title,
        btnArray: ["取消", "确定"],
        callback: () => {},
        callback1: () => thisObject.changeDayNight(),
      });
    },

    /** 切换全景POI可见性 */
    togglePanoPois: function () {
      this.panoPoiVisible = !this.panoPoiVisible;
      this._panoCtrl[this.panoPoiVisible ? "addClass" : "removeClass"]("hightlight");
      const scene = this._app._mapView._mapSDK.getRootScene();
      DXMapBoxPoiVisitor(scene.rootNode).setPanoVisible(this.panoPoiVisible);
    },

    /**
     * 状态开始时带参数初始化
     * @param {Object} args - 参数对象
     */
    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) return;

      const mapView = this._app._mapView;
      mapView.setTopViewHeight(90);
      const bottomMargin = this._app._params.bottomMargin || this._app._config.bottomMargin;
      mapView.setBottomViewHeight(bottomMargin || 60);
      mapView._eventMgr.on("onIndoorBuildingActive", this.onIndoorBuildingActive, this);
      mapView._mapSDK.on("poiClick", this.onPoiClick, this);

      const thisObject = this;
      mapView._mapSDK.on("explodedViewChanged", (sender, explodedView) => {
        if (thisObject._app._stateManager.getCurrentState() != thisObject) return;

        thisObject._searchView[explodedView ? "hide" : "show"]();
        thisObject._poiShortcutView?.[explodedView ? "hide" : "show"]();
        thisObject._listComponent[explodedView ? "hide" : "show"]();

        setTimeout(() => mapView._locationBtnCtrl.setVisible(!explodedView), 0);
      });

      if (this._app._config.recoverMap) {
        mapView._mapSDK.onMapEvents("dragend", () => {
          thisObject.checkAreaByMapCenter();
          if (thisObject.visible) {
            clearTimeout(thisObject.recoverMapTimer);
            thisObject.recoverMapTimer = setTimeout(() => thisObject.recoverState(), thisObject._app._config.recoverMap.time || 30000);
          }
        });
      }

      if (args.method == "openAutoDesc") {
        thisObject.openAutoDesc();
      }
    },

    /** 根据地图中心点检查区域 */
    checkAreaByMapCenter: function () {
      const mapView = this._app._mapView;
      const mapSDK = mapView._mapSDK;
      const currAreaInfo = this._currAreaInfo;
      const bdid = mapSDK.getCurrentBDID();

      if (bdid) {
        if (currAreaInfo && currAreaInfo.bdid != bdid) {
          this._currAreaInfo = { bdid };
          this._eventMgr.fire("MapAreaChanged", this._currAreaInfo);
        }
        return;
      }

      const thisObject = this;
      const pos = mapSDK.getPosition();

      const updateAreaIfChanged = (areaInfo) => {
        if (areaInfo && (!thisObject._currAreaInfo || areaInfo.adcode != thisObject._currAreaInfo.adcode)) {
          thisObject._currAreaInfo = areaInfo;
          thisObject._eventMgr.fire("MapAreaChanged", thisObject._currAreaInfo);
        }
      };

      if (this.regionFeatures) {
        updateAreaIfChanged(thisObject.getAreaByPos(pos));
      } else {
        const url = thisObject._app._config.areaUrl;
        thisObject._app.downloader.getServiceData(url, "get", "json", {}, (data) => {
          thisObject.regionFeatures = data.features;
          updateAreaIfChanged(thisObject.getAreaByPos(pos));
        });
      }
    },

    /**
     * 根据位置获取区域信息
     * @param {Object} pos - 位置对象
     * @returns {Object|null} 区域属性
     */
    getAreaByPos: function (pos) {
      let currArea = null;
      this.regionFeatures.forEach((feature) => {
        const properties = feature.properties;
        let coordinates = feature.geometry.coordinates[0];
        if (feature.geometry.type == "MultiPolygon") {
          coordinates = coordinates[0];
        }
        if (daxiapp.naviMath.pointInPolygon([pos.lon, pos.lat], coordinates)) {
          if (!currArea || (currArea.adcode && properties.adcode > currArea.adcode)) {
            currArea = properties;
          }
        }
      });
      return currArea;
    },

    /** 恢复地图状态 */
    recoverState: function () {
      const thisObject = this;
      const mapView = thisObject._app._mapView;
      const recoverState = thisObject._app._config.recoverMap.state;

      if (daximap.UserTrackingMode.None >= mapView._locationManager.getLocationState()) return;

      if (recoverState == 1) {
        if (mapView._locationBtnCtrl.getUserTrackingMode() < daximap.UserTrackingMode.Follow) {
          mapView._locationBtnCtrl.setUserTrackingMode(daximap.UserTrackingMode.Follow);
        } else {
          const building = mapView.getCurrIndoorBuilding();
          const bdInfo = building?.bdInfo;
          if (bdInfo?.mapZoom) {
            mapView._mapSDK.jumpTo({
              lon: bdInfo.center[0],
              lat: bdInfo.center[1],
              zoom: bdInfo.mapZoom,
            });
          }
        }
      } else if (recoverState == 2) {
        const myPositionInfo = mapView._locationManager.getMyPositionInfo();
        if (myPositionInfo.position[0]) {
          const bdInfo = mapView._mapSDK.getBuildingByPos(myPositionInfo.position);
          if (bdInfo) {
            mapView._locationBtnCtrl.setUserTrackingMode(daximap.UserTrackingMode.FollowWithHeading);
          }
        }
      }
    },

    /**
     * 状态被压栈时隐藏
     * @param {Object} args - 参数对象
     */
    onHideByPushStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView.pushState();
      mapView._mapSDK.off("poiClick", this.onPoiClick, this);
      if (mapView._mulityFloorCtrl) {
        mapView._mulityFloorCtrl.setVisible(false);
        if (mapView._mapSDK.getExplodedView()) {
          mapView._mapSDK.setExplodedView(false);
        }
      }
      this.closeExhibitCtrl();
    },

    /**
     * 状态出栈时显示
     * @param {Object} args - 参数对象
     */
    onShowByPopStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView.popState();
      mapView._mapSDK.on("poiClick", this.onPoiClick, this);

      if (!this.naviHeight) {
        const building = mapView._mapSDK.getCurrentBuilding();
        this.onIndoorBuildingActive(this, { building });
        this.naviHeight = this._poiShortcutView?.getHeight();
      }

      const initBottomHeight = this.naviHeight || this._app._params.bottomMargin || this._app._config.bottomMargin || 60;
      mapView.setBottomViewHeight(initBottomHeight);
      mapView._mulityFloorCtrl?.setVisible(true);
      this.changeDayNight(true);
      this._searchView.updateData();

      if (this._app.exhibitsLayer) {
        for (const key in this._app.exhibitsLayer) {
          this._app.exhibitsLayer[key].setVisible(true);
        }
      }
    },

    /**
     * 状态结束
     * @param {Object} args - 参数对象
     */
    onStateEnd: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
      mapView._eventMgr.off("onIndoorBuildingActive", this.onIndoorBuildingActive, this);
      mapView._mapSDK.off("poiClick", this.onPoiClick, this);
      if (mapView._mulityFloorCtrl) {
        mapView._mulityFloorCtrl.setVisible(false);
        if (mapView._mapSDK.getExplodedView()) {
          mapView._mapSDK.setExplodedView("onClick");
        }
      }
    },

    /**
     * POI点击事件处理
     * @param {Object} sender - 发送者
     * @param {Object} feature - 要素对象
     */
    onPoiClick: function (sender, feature) {
      setTimeout(() => {
        const props = feature.properties;
        if (props.icon != 9) {
          sender.openPoiDetailPage(props);
        } else {
          sender.openPanoPage(props);
        }
      }, 0);
    },

    /**
     * 室内建筑激活事件处理
     * @param {Object} sender - 发送者
     * @param {Object} ret - 返回对象
     */
    onIndoorBuildingActive: function (sender, ret) {
      const thisObject = sender;
      let bdid = "";

      if (ret?.building) {
        bdid = ret.building.bdid;
        thisObject.buildingInfo = ret.building.bdInfo;
        const top = thisObject._app._config.bigFont ? 112 : 90;

        if (!thisObject._app._config.singleScenic) {
          const bdname = thisObject._app._mapView.currBuildingInfo.bdInfo.cn_name;
          thisObject._dom.find(".cityBtn").remove();
          const cityBtn = `<div class='cityBtn' data-citycode='0514' style='top:${top}px; left:52px'><span class='cityeName'><i class='btn_detail'></i><span class='cityText'>${bdname}</span></span></div>`;
          thisObject._dom.append(cityBtn);
          thisObject._cityBtn = domUtils.find(thisObject._dom, ".cityBtn");
          thisObject.clickTime = 0;

          thisObject._cityBtn.on("click", function () {
            const time = new Date().getTime();
            if (time - thisObject.clickTime < 500) return;
            thisObject.clickTime = time;

            const citycode = $(this).attr("data-citycode");
            thisObject.activeCityCode = citycode;
            const hasMore = thisObject._app._appConfig?.more == undefined ? 0 : thisObject._app._config.more;

            if (thisObject.scenelist) {
              thisObject._sceneListComponent.slideUp();
              thisObject._sceneListComponent.updateData({ bdname, data: thisObject.scenelist, hasMore });
            } else {
              domUtils.showInfo("数据加载中...");
            }
          });
        }
      } else {
        thisObject.buildingInfo = null;
      }

      thisObject.updateShortCutBar(bdid);

      if (!thisObject._listComponent) {
        thisObject.getConfig(bdid);
        thisObject.updateBottomBtn("guideLine");
      }

      if (bdid) {
        if (thisObject.bdid != bdid) {
          const mapView = thisObject._app._mapView;
          mapView._mulityFloorCtrl?.setVisible(true);
          thisObject.showExhibitInfo(bdid, () => {});
          thisObject.getSceneList(command.token, bdid || command.buildingId);
        }
        thisObject.bdid = bdid;

        const _bdInfo = ret.building.bdInfo;
        const bdInfo = {
          bdid,
          name: _bdInfo.cn_name,
          cat: _bdInfo.cat,
          first_capital: _bdInfo.first_capital,
          location: _bdInfo.location,
          address: _bdInfo.address,
        };

        const showPano = _bdInfo.showPano != false && (thisObject._app._params.showPano || thisObject._app._config.showPano);
        if (showPano) {
          thisObject.showPanoComponent();
        } else if (_bdInfo.showPano == false) {
          thisObject.hidePanoComponent();
        }

        thisObject._dxButtonComp?.setData(bdInfo);
      } else {
        const bdInfo = { bdid: "", name: "选择室内地图", cat: "", address: "" };
        thisObject._dxButtonComp?.setData(bdInfo);
      }
    },

    /**
     * 更新快捷栏
     * @param {string} bdid - 建筑ID
     */
    updateShortCutBar: function (bdid) {
      const thisObject = this;
      const config = this._app._config;

      if (config.specialFooterBtns || thisObject._bdid == bdid) return;

      thisObject._bdid = bdid;
      thisObject.browseData = thisObject.browseData || {};
      const key = "bdid_";

      if (thisObject.browseData[key]) {
        thisObject._poiShortcutView?.updateData(bdid, thisObject.browseData[key]);
        return;
      }

      if (bdid.length > 0) {
        const url = thisObject._buildConfigUrl(bdid);
        thisObject._app.downloader.getServiceData(
          url,
          "get",
          "json",
          {},
          (data) => {
            const dataKey = `bdid_${bdid || ""}`;
            thisObject.browseData[dataKey] = data.browsePage.naviData;
            if (bdid == thisObject._bdid) {
              // 更新底部导航栏，高亮"地图"
              thisObject._poiShortcutView?.updateData(bdid, thisObject.browseData[dataKey], "地图");
            }
          },
          () => console.log("footer navi data load failed"),
        );
      } else {
        thisObject._poiShortcutView?.updateData(bdid, config.browsePage.naviData);
      }
    },

    /**
     * 构建配置URL
     * @param {string} bdid - 建筑ID
     * @returns {string} 配置URL
     */
    _buildConfigUrl: function (bdid) {
      let url = this._app._params.dataRootPath;
      url = url.replace("{{bdid}}", bdid);
      return `${url.replace("{{filename}}", "pages/config.json")}?t=${window.version || new Date().getTime()}`;
    },

    /**
     * 创建图标文本按钮并添加到列表
     * @param {string} iconName - 图标名称
     * @param {string} text - 按钮文本
     * @param {Function} onClick - 点击回调
     * @param {Object} customStyle - 自定义样式
     * @returns {Object} 按钮实例
     */
    _createIconTextBtn: function (iconName, text, onClick, customStyle) {
      const btn = new daxiapp.DXIconTextBtnComponent(null, { iconName, text });
      btn.init({ onClicked: onClick });
      btn.setStyle(customStyle || BTN_STYLE_CONFIG);
      this._listComponent.appendItem(btn._dom);
      this._listComponent.showItem(btn);
      return btn;
    },

    /**
     * 获取配置信息
     * @param {string} bdid - 建筑ID
     */
    getConfig: function (bdid) {
      const thisObject = this;
      const url = thisObject._buildConfigUrl(bdid);
      thisObject.widgetToolMask = new daxiapp.WidgetToolMask();
      const list = [];
      const building = thisObject._app._mapView._mapSDK.getCurrentBuilding();

      thisObject.getAppConfig((appConfig) => {
        thisObject.appConfig = appConfig;
        thisObject._app.downloader.getServiceData(
          url,
          "get",
          "json",
          {},
          (data) => {
            for (const key in data) {
              thisObject._app._config[key] = data[key];
            }

            thisObject._listComponent = new daxiapp.DXListComponent(thisObject._dom);
            thisObject._listComponent.init({});

            let listConponentTop = 86;
            if (!thisObject._app._config.hideLocState) listConponentTop += 36;
            if (thisObject._app._config.bigFont) listConponentTop = 112;

            thisObject._listComponent.setStyle({
              position: "absolute",
              top: `${listConponentTop}px`,
              right: "12px",
              "background-color": "rgb(255,255,255)",
              border: "1px solid #e3e3e3 !important",
              margin: "2px 0px",
            });

            // 路线按钮
            thisObject._guideLineBtnCtrl = thisObject._createIconTextBtn("icon-line", "路线", () => {
              thisObject.updateBottomBtn("guideLine");
              thisObject._app._stateManager.pushState("MapStateExhibitionRoute", {});
            });

            list.push({
              icon: "icon-line",
              text: "路线",
              onClick: () => {
                thisObject.updateBottomBtn("guideLine");
                thisObject._app._stateManager.pushState("MapStateExhibitionRoute", {});
                thisObject.widgetToolMask.hide();
              },
            });

            // 分享按钮
            const userConfig = thisObject._app._config.user;
            if (userConfig?.showShare || thisObject._app._params.showShare) {
              thisObject._fenxiangCtrl = thisObject._createIconTextBtn("icon-button_fenxiang", "分享", () => {
                thisObject.updateBottomBtn("share");
                thisObject._app._stateManager.pushState("MapStateSharePos", {});
              });
              list.push({
                icon: "icon-button_fenxiang",
                text: "分享",
                onClick: () => {
                  thisObject.updateBottomBtn("share");
                  thisObject._app._stateManager.pushState("MapStateSharePos", {});
                  thisObject.widgetToolMask.hide();
                },
              });
            }

            // 共享按钮
            if (userConfig?.sharePosServer) {
              thisObject._sharePosCtrl = new daxiapp.DXIconTextBtnComponent(null, { iconName: "icon-zhudui", text: "共享" });
              thisObject._sharePosCtrl.init({
                onClicked: () => {
                  thisObject.updateBottomBtn("sharePosServer");
                  thisObject.sharePosServer();
                },
              });
              thisObject._sharePosCtrl.setStyle(
                { ...BTN_STYLE_CONFIG, dispaly: "flex", "flex-direction": "column" },
                { padding: "3px" },
                { "font-size": "1rem", "line-height": 1.2, transform: "scale(0.8)" },
              );
              thisObject._listComponent.appendItem(thisObject._sharePosCtrl._dom);
              thisObject._listComponent.showItem(thisObject._sharePosCtrl);
              list.push({
                icon: "icon-zhudui",
                text: "共享",
                onClick: () => {
                  thisObject.updateBottomBtn("sharePosServer");
                  thisObject.sharePosServer();
                  thisObject.widgetToolMask.hide();
                },
              });
            }

            thisObject._exhibitionAutoPlay = false;
            thisObject._pauseExhibitionAutoPlay = false;
            thisObject._payComponent = new daxiapp.DXShowPayComponent();
            thisObject._payComponent.init(thisObject._dom, { visible: false });

            // 自动讲解控件
            thisObject._autoDescCtrl = new daxiapp.DXSliderTapPanelView({ desc: "自动讲解", active: false });
            thisObject._autoDescCtrl.init({
              onClicked: (args) => thisObject.onAutoDescClicked(args),
            });

            // 课程控件
            const courseVersion = thisObject._app._config.courseVersion;
            const CourseComponent = courseVersion == 3 ? daxiapp.DXCourseComponent3 : daxiapp.DXCourseComponent2;
            thisObject._courseCtrl = new CourseComponent();
            thisObject._courseCtrl.init(thisObject._dom, {
              listener: {
                onFinish: () => {
                  const isFirst = daxiapp.cache.storage.getItem("isFirst");
                  if (!isFirst) {
                    if (courseVersion != 3) {
                      thisObject._courseCtrl.updateZanpin(thisObject._bdid);
                    }
                    daxiapp.cache.storage.setItem("isFirst", true);
                  }
                },
              },
            });
            thisObject._courseCtrl.hide();

            // 日夜切换控件
            if (thisObject._app._config.hasNightScene?.[thisObject._bdid]) {
              thisObject.isDay = thisObject._isDayTime();
              thisObject._timeModeCtrl = thisObject._createIconTextBtn(thisObject.isDay ? "icon-sun" : "icon-night", thisObject.isDay ? "白天" : "夜景", () =>
                thisObject.changeDayNight(),
              );
            } else {
              thisObject.isDay = true;
            }

            thisObject._listComponent.show();

            if (thisObject._app._config.showPano && thisObject._app._params.showPano) {
              thisObject.showPanoComponent();
            }

            thisObject.browseData = { bdid_: thisObject._app._config.browsePage.naviData };

            // 轮播组件
            thisObject.dxSwiperComponent = new daxiapp.DXSwiperComponent();
            thisObject.dxSwiperComponent.init(thisObject._dom, {
              style: {
                position: "absolute",
                width: "100%",
                left: 0,
                bottom: 0,
                "border-radius": "6px 6px 0px 0px",
                height: "auto",
                background: "#fff",
                "z-index": 4,
              },
              listener: {
                slideChangeTransitionEnd: (sender, activeSlide) => {
                  sender.getAllSlides().forEach((slide) => {
                    if (slide != activeSlide) {
                      slide.pcompsInstance?.pausePlay();
                    } else {
                      if (thisObject._exhibitAutoPlay) {
                        slide.pcompsInstance?.startPlay();
                      }
                      const data = slide.pcompsInstance._data;
                      data.width = 64;
                      data.height = 64;
                      thisObject.showMarker(data);
                    }
                  });
                },
              },
            });

            thisObject.onAutoDescClicked();

            if (thisObject._app._config.hasNightScene?.[thisObject._bdid]) {
              thisObject.checkDayNight();
            }

            // AI按钮
            const rightBar = thisObject._app._config.rightBar;
            if (rightBar?.ai) {
              thisObject._iframeContainer = new daxiapp.DXFullIframeComponent2(thisObject._app, thisObject._container);
              thisObject._iframeContainer.init({
                onClose: () => {
                  thisObject._iframeContainer.updateIframe("");
                  thisObject._iframeContainer.hide();
                },
              });
              thisObject._iframeContainer.setStyle({
                "background-image":
                  "linear-gradient(45deg, rgb(135, 206, 235), rgb(255, 255, 255), rgb(135, 206, 235), rgb(255, 255, 255), rgb(135, 206, 235))",
              });
              thisObject._iframeContainer.hide();
              thisObject._iframeContainer.updateIframe("https://aibot.daxicn.com/duix");

              thisObject._ARServiceBtnCtrl = thisObject._createIconTextBtn("icon-xnr", "AI", () => {
                thisObject.updateBottomBtn("AI");
                thisObject._iframeContainer.updateIframe("https://aibot.daxicn.com/duix");
                thisObject._iframeContainer.show();
              });

              list.push({
                icon: "icon-xnr",
                text: "AI",
                onClick: () => {
                  thisObject.updateBottomBtn("AI");
                  const url = encodeURIComponent("https://aibot.daxicn.com/duix/");
                  wx.miniProgram.navigateTo({ url: `/subpage/webview/webview?url=${url}&title=希希数字人智能导游` });
                  thisObject.widgetToolMask.hide();
                },
              });
            }

            if (rightBar?.initBtn) {
              thisObject.updateBottomBtn(rightBar.initBtn);
            }

            // 教程按钮
            thisObject._courseBtnCtrl = thisObject._createIconTextBtn("icon_gb-help", "教程", () => {
              thisObject.updateBottomBtn("help");
              thisObject.closeExhibitCtrl();
              thisObject._courseCtrl.updateData(thisObject._bdid, thisObject._app._mapView.currBuildingInfo.bdInfo.cn_name);
            });

            list.push({
              icon: "icon_gb-help",
              text: "教程",
              onClick: () => {
                thisObject.updateBottomBtn("help");
                thisObject.closeExhibitCtrl();
                thisObject.widgetToolMask.hide();
              },
            });

            if (appConfig.offline == 1) {
              list.push({
                icon: "icon-xiazai",
                text: "离线地图",
                textStyle: "font-size:10px;",
                onClick: () => {
                  thisObject.downloadMap(data.sourceConfig, bdid);
                  thisObject.widgetToolMask.hide();
                },
              });
            }

            thisObject.widgetToolMask.init(thisObject._dom, { list });

            // 更多按钮
            if (thisObject._app._config.hideMore != true) {
              thisObject._moreBtnCtrl = new daxiapp.DXIconTextBtnComponent(null, { iconName: "icon-ellipsis", text: "" });
              thisObject._moreBtnCtrl.init({ onClicked: () => thisObject.widgetToolMask.show() });
              thisObject._listComponent.appendItem(thisObject._moreBtnCtrl._dom);
              thisObject._listComponent.showItem(thisObject._moreBtnCtrl);
            }

            const isFirst = daxiapp.cache.storage.getItem("isFirst");
            if (!isFirst) {
              thisObject._courseCtrl?.updateData(bdid, building?.bdInfo?.cn_name);
            }

            let extendOpt;
            if (thisObject._app._config.showRobotMen) {
              extendOpt = {
                extend: {
                  icon: "icon-camera",
                  onClick: () => wx?.miniProgram?.navigateTo?.({ url: "/subpage/arRecPic/xr-osd/index" }),
                },
              };
            }

            const SearchViewComponent = thisObject._app._config.bigFont ? daxiapp.DXSearchViewComponent5 : daxiapp.DXTopSearchComponent;
            thisObject._searchView = new SearchViewComponent(thisObject._app, thisObject._dom, extendOpt);
            thisObject._searchView.init({
              onSelectItemAtIndexPath: (sender, args) => {
                const methodMap = {
                  openMainPoiPage: () => thisObject.openMainPoiPage(args),
                  showPois: () => thisObject.showPois(args),
                  showSubWay: () => thisObject.showSubWay(args),
                  showErrorMessage: () => thisObject.showPois(args),
                };
                methodMap[args.method]?.();
              },
              onSearchViewBackBtnClicked: () => {
                if (thisObject._app._params.method == "indexPage") {
                  thisObject.openIndexPage();
                  return;
                }
                thisObject._showExitConfirm(() => {
                  thisObject._app.jsBridge.realGoBack?.(null, null, {
                    pageCount: 1,
                    switchTap: true,
                    bdid: thisObject._app._params.bdid,
                    token: thisObject._app._params.token,
                  });
                });
              },
              onSearchViewSearchBtnClicked: (sender, e) => thisObject.openSearchPage(e),
              onSearchViewMicBtnClicked: (sender, e) => {
                const curT = new Date().getTime();
                if (curT - thisObject.lastOpenVoiceTime < 900) return;
                thisObject.lastOpenVoiceTime = curT;

                if (window.cordova) {
                  const bdid = thisObject._app._mapView._mapSDK.getCurrentBDID();
                  if (thisObject._app.nativeSDKAPI?.openVoicePage) {
                    thisObject._app.nativeSDKAPI.openVoicePage(
                      { token: thisObject._app._params.token, bdid },
                      (data) => {
                        const keyword = decodeURIComponent(data.keyword);
                        if (keyword) {
                          thisObject.showPois({ method: "showPois", keyword, bdid });
                        } else {
                          console.log(data);
                        }
                      },
                      (data) => console.log("voice error", data),
                    );
                  } else {
                    thisObject.openSearchPage(e);
                  }
                  return;
                }
                thisObject._app._stateManager.pushState("VoiceListenerPage", {});
              },
            });

            thisObject._searchView.setSearchIconClass("voice_search");
            thisObject._searchView.updateData();
          },
          () => console.log("footer navi data load failed"),
        );
      });
    },

    /**
     * 判断当前是否为白天
     * @returns {boolean} 是否白天
     */
    _isDayTime: function () {
      const currTime = new Date();
      const hours = currTime.getHours() + currTime.getMinutes() / 60;
      const dayTime = this._app._config.dayTime;
      return hours > dayTime[0] && hours < dayTime[1];
    },

    /**
     * 下载离线地图
     * @param {Array} sourceConfig - 资源配置
     * @param {string} bdid - 建筑ID
     */
    downloadMap: function (sourceConfig, bdid) {
      const thisObject = this;
      const app = thisObject._app;
      let baseURL = thisObject._app._config.baseURL;
      const currentBdid = app._mapView._mapSDK.getCurrentBDID() || app._params.bdid;
      const token = app._params.token;

      baseURL = baseURL.replace(/\$token/g, token).replace(/\$bdid/g, currentBdid);

      const imgs = thisObject.exhibitions.map((exhibit) => `${baseURL}${exhibit.thumbnail}`);

      domUtils.showInfo("下载中...");
      daxiapp.utils.preloadImages(imgs).then(() => {
        domUtils.hideInfo();
        domUtils.showInfo("图片下载完成", 2000);
      });

      let link = app._config.exhibitRouteServerUrl;
      link = link.replace(/\$token/g, token).replace(/\$bdid/g, currentBdid);
      thisObject._exhibitInfoCtrls = [];

      app.downloader.getServiceData(link, "get", "json", { token, bdid: currentBdid }, (data) => {
        daxiapp.cache.storage.setItem("exhibitRoute", JSON.stringify(data));
      });

      sourceConfig.forEach((item) => {
        const dataType = item.dataType || item.url;
        const url = item.url.replace("{{bdid}}", currentBdid).replace("{{token}}", token);
        const key = item.key || url;
        if (!window[dataType][key]) {
          thisObject._app.downloader.getServiceData(url, "get", "json", {}, (data) => {
            window[dataType][key] = data;
          });
        }
      });
    },

    /**
     * 获取应用配置
     * @param {Function} callback - 回调函数
     */
    getAppConfig: function (callback) {
      const thisObject = this;
      const url = daxiapp.utils.addScenicUrl("/pages/config.json");
      thisObject._app.downloader.getServiceData(url, "get", "json", {}, (data) => {
        callback?.(data.config || thisObject._app._config);
      });
    },

    /**
     * 更新底部按钮
     * @param {string} type - 按钮类型
     */
    updateBottomBtn: function (type) {
      const thisObject = this;
      const config = BOTTOM_BTN_CONFIG[type];

      if (type == "guideLine" && thisObject._app._config.singleScenic) return;

      thisObject._dom.find("#luxianBtn").remove();

      if (!config) return;

      const html = `<div id="luxianBtn"><i class="${config.icon}"></i><div>${config.text}</div></div>`;
      thisObject._dom.append($(html));

      const btn = domUtils.find(thisObject._dom, "#luxianBtn");
      const clickHandlers = {
        AI: () => {
          thisObject._iframeContainer.updateIframe("https://aibot.daxicn.com/duix");
          thisObject._iframeContainer.show();
        },
        share: () => thisObject._app._stateManager.pushState("MapStateSharePos", {}),
        sharePosServer: () => thisObject.sharePosServer(),
        help: () => {
          thisObject.closeExhibitCtrl();
          thisObject._courseCtrl.updateData(thisObject._bdid);
        },
        guideLine: () => thisObject._app._stateManager.pushState("MapStateExhibitionRoute", {}),
      };

      btn.on("click", clickHandlers[type]);
    },

    /** 暂停展品播放 */
    pauseExhibitPlay: function () {
      const slide = this.dxSwiperComponent.getActiveSlide();
      slide?.pcompsInstance?.pausePlay();
    },

    /** 关闭展品控件 */
    closeExhibitCtrl: function () {
      return;
    },

    /**
     * 根据位置检查展品
     * @param {Object} exhibitsAreaData - 展品区域数据
     * @param {Object} loc - 位置信息
     */
    startCheckExhibitsByLoc: function (exhibitsAreaData, loc) {
      const thisObject = this;
      if (!exhibitsAreaData || !loc) return;

      const { floorId, position } = loc;
      const [lon, lat] = position;
      const curFLExhibitsAreaData = exhibitsAreaData.result;

      for (let i = 0, len = curFLExhibitsAreaData.length; i < len; i++) {
        const areaData = curFLExhibitsAreaData[i];
        if (floorId != areaData.floorId) continue;

        const flag = daxiapp.naviMath.pointInPolygon([lon, lat], areaData.polygon);
        if (!flag || (thisObject.lastMatch && thisObject.lastMatch == areaData)) continue;

        thisObject.dxSwiperComponent.show();
        thisObject.lastMatch = areaData;

        const exhibits = areaData.exhibits;
        const slide = thisObject.dxSwiperComponent.getActiveSlide();
        slide?.pcompsInstance?.cancel();
        thisObject.dxSwiperComponent.removeAllSlides();

        const slides = exhibits.map((data, index) => {
          Object.assign(data, {
            enableClose: true,
            autoplay: true,
            detailUrl: true,
            iconClose: true,
            showLineBtn: true,
          });

          const exhibitInfoCtrl = new daxiapp.DXDetailInfoComponent();
          exhibitInfoCtrl.init(null, {
            class: "swiper-slide",
            style: {},
            data,
            listener: {
              onRouteBtnClicked: (sender, d) => thisObject.openRoute(d),
              onAudioEnded: () => {
                if (thisObject.dxSwiperComponent.isEnd()) {
                  exhibitInfoCtrl.cancel();
                  thisObject.closeExhibitCtrl(true);
                  return;
                }
                thisObject.dxSwiperComponent.slideNext();
              },
              onClose: () => thisObject.closeExhibitCtrl(true),
              onListenBtnClicked: (sender, d) => {
                thisObject.getPayStatus((res) => {
                  thisObject._app._stateManager.goBack();
                  if (res.code != 0) {
                    wx.miniProgram.navigateTo({
                      url: `/pages/pay/pay?token=${thisObject._app._params.token}&bdid=${d.bdid}&fromPage=mapView`,
                    });
                  } else {
                    const postData = {
                      type: "postEventToMiniProgram",
                      id: thisObject._app._params.userId,
                      methodToMiniProgram: `exhibitId=${d.id2 || d.id}&bdid=${d.bdid}&token=${thisObject._app._params.token}`,
                      roleType: "receiver",
                    };
                    window.locWebSocketPostMessage?.(postData);
                    wx.miniProgram.switchTab({ url: `/pages/index/index?exhibitId=${d.id2}` });
                  }
                });
              },
              onImgLoaded: () => {
                const height = thisObject._dom.find(".detailInfo-component").height();
                if (height) {
                  mapView.setBottomViewHeight(height + 16);
                }
              },
            },
            speakListener: thisObject._app._mapView._speakListener,
          });

          data.width = data.height = 64;

          if (index == 0) {
            for (const key in thisObject._app.exhibitsLayer) {
              thisObject._app.exhibitsLayer[key].highlightMarker(data.exhibitId);
            }
            thisObject._app._mapView._locationBtnCtrl.setUserTrackingMode(daximap.UserTrackingMode.None);
            exhibitInfoCtrl.startPlay();
          }

          return exhibitInfoCtrl.getDomWithIns();
        });

        thisObject.dxSwiperComponent.appendSlide(slides);
        const height = thisObject.dxSwiperComponent.getHeight();
        thisObject._app._mapView.setBottomViewHeight(height + 10);
        break;
      }
    },

    /**
     * 执行命令
     * @param {Object} command - 命令对象
     */
    runCommond: function (command) {
      const thisObject = this;
      if ((args.method = "openMainPoiPage")) {
        thisObject.openMainPoiPage(command);
      } else if (args.method == "showPois") {
        thisObject.showPois(command);
      } else if (args.method == "openSearchPage") {
        thisObject.openSearchPage(command);
      }
    },

    /** 打开主POI页面 */
    openMainPoiPage: function () {
      const thisObject = this;
      const params = thisObject.getParams();
      const command = { data: params, method: "openMainPoiPage" };

      if (thisObject.buildingInfo) {
        command.data.cnname = thisObject.buildingInfo.cn_name;
      }

      const page = thisObject._app._stateManager.pushState("MapStateMainPoiPage", command);
      page._once("selectPoiCallback", (sender, selectPoiResult) => {
        if (selectPoiResult.retVal == "OK") {
          thisObject.showPois(selectPoiResult.data);
        }
      });
    },

    /** 打开首页 */
    openIndexPage: function () {
      const thisObject = this;
      const params = thisObject.getParams();
      const command = { data: params, method: "openIndexPage" };

      if (thisObject.buildingInfo) {
        command.data.cnname = thisObject.buildingInfo.cn_name;
      }

      const page = thisObject._app._stateManager.pushState("IndexPage", command);
      page._once("selectPoiCallback", (sender, selectPoiResult) => {
        if (selectPoiResult.retVal == "OK") {
          thisObject.showPois(selectPoiResult.data);
        }
      });
    },

    /**
     * 获取参数
     * @returns {Object} 参数对象
     */
    getParams: function () {
      const thisObject = this;
      const token = this._app._params.token;
      const mapView = this._app._mapView;
      const mapSDK = mapView._mapSDK;
      const bdInfo = mapView.getCurrIndoorBuilding().bdInfo;
      const bdid = bdInfo.bdid;

      let floorId = mapSDK.getCurrentFloorId() || bdInfo.groundFloorId;
      const pos = mapSDK.getPosition();
      let { lon, lat } = pos;

      if (mapSDK.getCurrentBDID() != bdid) {
        lon = bdInfo.center[0];
        lat = bdInfo.center[1];
      }

      const locationManager = mapView._locationManager;
      const myPositionInfo = locationManager.getMyPositionInfo();
      let defStartPoint;

      if (bdid && thisObject.buildingInfo?.defStartPoint) {
        thisObject.buildingInfo.defStartPoint.bdid = thisObject.buildingInfo.bdid;
        defStartPoint = thisObject.buildingInfo.defStartPoint;

        if (defStartPoint && (!myPositionInfo.floorId || myPositionInfo.bdid != thisObject.buildingInfo.bdid)) {
          lon = defStartPoint.lon;
          lat = defStartPoint.lat;
          floorId = defStartPoint.floorId;
        } else if (myPositionInfo.position[0] && myPositionInfo.bdid == bdid) {
          lon = myPositionInfo.position[0];
          lat = myPositionInfo.position[1];
          floorId = myPositionInfo.floorId || "";
        }
      }

      const data = { bdid, token, floorId, position: [lon, lat], locInfo: myPositionInfo };
      if (defStartPoint) {
        data.defStartPoint = defStartPoint;
      }
      return data;
    },

    /**
     * 打开搜索页面
     * @param {Object} e - 事件对象
     */
    openSearchPage: function (e) {
      const thisObject = this;
      const params = { keyword: e.keyword };
      const bdid = this._app._mapView._mapSDK.getCurrentBDID();

      if (bdid) {
        params.bdid = bdid;
        params.floorId = this._app._mapView._mapSDK.getCurrentFloorId();
      }
      params.token = this._app._params.token;

      const command = { method: "openSearchPage", data: params };
      const page = thisObject._app._stateManager.pushState("MapStateSearchPage", command);

      page._once("searchPageCallback", (sender, searchResult) => {
        if (searchResult.retVal == "OK") {
          thisObject.showPois(searchResult.data);
        }
      });
    },

    /**
     * 打开POI详情页
     * @param {Object} poiInfo - POI信息
     * @param {Object} markerLayer - 标记图层
     */
    openPoiDetailPage: function (poiInfo, markerLayer) {
      const thisObject = this;
      const bdid = thisObject._app._mapView._mapSDK.getCurrentBDID();
      const token = thisObject._app._params.token;
      const arealType = bdid ? "indoor" : "outdoor";

      const poiData = daxiapp.utils.copyData(poiInfo);
      poiData.featureId = poiData.featureId || poiData.id;
      poiData.bdid = poiData.bdid || bdid;
      poiData.floorName = poiData.floorName || "";
      poiData.address = poiData.address || poiData.floorName || "";
      poiData.exhibitId = poiData.exhibitId || "";

      const args = {
        method: "openPoiDetailPage",
        data: { bdid, token, arealType, poiInfo: poiData },
      };

      if (thisObject.buildingInfo?.defStartPoint) {
        thisObject.buildingInfo.defStartPoint.bdid = thisObject.buildingInfo.bdid;
        const locationManager = thisObject._app._mapView._locationManager;
        const myPositionInfo = locationManager.getMyPositionInfo();

        if (!myPositionInfo.floorId || myPositionInfo.bdid != thisObject.buildingInfo.bdid) {
          args.data.defStartPoint = thisObject.buildingInfo.defStartPoint;
        }
      }

      const stateManager = thisObject._app._stateManager;
      const currentState = stateManager.getCurrentState();
      const mapStatePoiDetail = stateManager.getMapState("MapStatePoiDetail");

      if (thisObject == currentState) {
        stateManager.pushState("MapStatePoiDetail", args);
      } else if (mapStatePoiDetail == currentState) {
        mapStatePoiDetail.openPoiDetailPage(args.data.poiInfo, markerLayer);
      }
    },

    /**
     * 打开全景页面
     * @param {Object} poiInfo - POI信息
     */
    openPanoPage: function (poiInfo) {
      let panoUrl = this._app._config.panoUrl;
      panoUrl = panoUrl.replace("{{bdid}}", this.buildingInfo.bdid);
      this._app.panoInstance.show();
      this._app.panoInstance.postMessage("loadPano", {
        server: panoUrl,
        currFloor: poiInfo.floorId,
        id: poiInfo.id,
        poiInfo,
      });
    },

    /**
     * 显示POI列表
     * @param {Object} args - 参数对象
     */
    showPois: function (args) {
      const params = this.getParams();
      const hasBdid = !!params.bdid;

      args.arealType = hasBdid ? "indoor" : "outdoor";
      if (args.type == undefined) {
        args.type = hasBdid ? 1 : 11;
      }

      for (const key in params) {
        if (!args[key]) {
          args[key] = params[key];
        }
      }

      if (args.keyword) {
        args.keyword = decodeURIComponent(args.keyword);
      }

      this._app.pageCommand.openPoiState(args);
    },

    /**
     * 显示地铁
     * @param {Object} args - 参数对象
     */
    showSubWay: function (args) {
      if (this.buildingInfo?.defStartPoint) {
        this.buildingInfo.defStartPoint.bdid = this.buildingInfo.bdid;
        args.defStartPoint = this.buildingInfo.defStartPoint;
      }
    },

    /**
     * 显示展品信息
     * @param {string} bdid - 建筑ID
     * @param {Function} callback - 回调函数
     */
    showExhibitInfo: function (bdid, callback) {
      const thisObject = this;
      const app = this._app;
      const mapSDK = app._mapView._mapSDK;

      mapSDK.on("onIndoorBuildingActive", (sender, building) => {
        if (!building) return;

        const buildingBdid = building.bdid || "";
        if (!thisObject._app.exhibitsLayer) return;

        if (thisObject._args?.method == "showExhibit") {
          const exhibit_id = thisObject._args.exhibit_id;
          const data = thisObject.exhibitions || [];

          for (let i = 0; i < data.length; i++) {
            data.type = "Exhibit";
            if (data[i].bdid == buildingBdid && data[i].exhibitId == exhibit_id) {
              const key = buildingBdid + data[i].floorId;
              thisObject.openPoiDetailPage(data[i], thisObject._app.exhibitsLayer[key]);
              delete thisObject._args.method;
              return;
            }
          }
        }
      });

      daxiapp.api.getExhibitAll(
        {},
        (data) => {
          const markerMap = {};
          if (data.result) data = data.result;

          data.forEach((item) => {
            const floorId = item.floorId;
            if (!floorId || !(item.highlightImageUrl || item.markerIcon)) return;

            item.id2 = item.id;
            if (item.sprite != 1) item.id = item.exhibitId || "";
            item.description = item.description || "";

            if (item.sprite == 0) {
              item.markerIcon = daxiapp.utils.addScenicUrl(item.markerIcon);
              item.activeMarkerIcon = item.markerIcon;
            }

            item.lon = parseFloat(item.lon);
            item.lat = parseFloat(item.lat);

            if (item.sprite == 1) {
              item.audioUrl = daxiapp.utils.addScenicUrl(item.audioUrl);
              if (item.markerIcon?.indexOf("/") != -1) {
                const spriteKey = `museum_${item.exhibitId}`;
                item.markerIcon = spriteKey;
                item.activeMarkerIcon = spriteKey;
                item.imgKey = spriteKey;
                item.highlightImgKey = spriteKey;
              }
            }

            item.width = item.width || 48;
            item.height = item.height || 48;
            item.highlightWidth = item.highlightWidth || 64;
            item.highlightHeight = item.highlightHeight || 64;
            item.highlightLater = true;
            if (item.showText != 0) item.showText = true;
            item["text-anchor"] = "top";
            item.bdid = item.bdid || bdid;

            const key = `${item.bdid}${item.floorId}_${item.period}`;
            if (!markerMap[key]) {
              markerMap[key] = { bdid: item.bdid, floorId, data: [], period: item.period };
            }
            markerMap[key].data.push(item);
          });

          thisObject.exhibitions = data;

          for (const key in markerMap) {
            const item = markerMap[key];
            const markerBdid = item.bdid || "outdoor";
            const markerFloorId = item.floorId || "";
            const markersData = item.data;
            const visible = (thisObject.isDay && item.period != 2) || (!thisObject.isDay && item.period != 1);

            const markerLayer = new daximap.DXSceneMarkerLayer();
            markerLayer.initialize(app._mapView._mapSDK, {
              markers: markersData,
              bdid: markerBdid,
              floorId: markerFloorId,
              minZoom: 15,
              iconOffset: [0, -10],
              "icon-allow-overlap": true,
              priority: 2,
              visible,
              onClick: (data) => thisObject.openPoiDetailPage(data, markerLayer),
            });

            markerLayer.id = `marker${daxiapp.utils.createUUID()}`;
            markerLayer.addToMap();
            markerLayer.period = item.period;
            thisObject._app.exhibitsLayer[key] = markerLayer;

            const state = thisObject._app._stateManager.getCurrentState();
            if (!thisObject.visible && state.hideExhibitsLayer) {
              markerLayer.setVisible(false);
            }
          }

          thisObject.listenFootPrints(markerMap, thisObject._app.exhibitsLayer, bdid, callback);

          mapSDK.on("explodedViewChanged", (sender, explodedView) => {
            const exhibitsLayer = thisObject._app.exhibitsLayer;
            for (const key in exhibitsLayer) {
              exhibitsLayer[key].visible = !explodedView;
            }
            thisObject.closeExhibitCtrl();
          });
        },
        (err) => console.error("加载展品涂层数据失败", err),
      );
    },

    /**
     * 监听足迹
     * @param {Object} markerMap - 标记映射
     * @param {Object} exhibitsLayer - 展品图层
     * @param {string} bdid - 建筑ID
     * @param {Function} callbackFn - 回调函数
     */
    listenFootPrints: function (markerMap, exhibitsLayer, bdid, callbackFn) {
      const thisObject = this;

      const fetchData = () => {
        daxiapp.api.getFootprints({ bdid }, (data) => {
          if (data?.code != 200) return;

          const ids = data.result.split(",");
          ids.forEach((id) => {
            Object.keys(markerMap).forEach((key) => {
              markerMap[key].data.forEach((item) => {
                if (item.id2 == id && item.state != 2) {
                  item.state = 2;
                  item.markerIcon = `museum_${item.id}_1`;
                  item.activeMarkerIcon = item.markerIcon;
                  exhibitsLayer[key].updateFeature(item.id, item);
                }
              });
            });
          });

          thisObject.visitedScene = ids;
          thisObject.setVisitedScene();
          callbackFn?.();
        });
      };

      clearInterval(thisObject.listenFootPrintsTimer);
      thisObject.listenFootPrintsTimer = setInterval(fetchData, 60000);
      fetchData();
    },

    /** 设置已访问场景 */
    setVisitedScene: function () {
      const app = this._app;
      const thisObject = this;
      const ids = this.visitedScene;
      const bdid = thisObject.scenelist?.bdid || bdid;

      if (ids) {
        app._mapView.setVisitedScene?.(bdid, ids.length);
      }

      thisObject.scenelist?.forEach((city) => {
        city.show = true;
        if (city.list) {
          city.list.forEach((item) => {
            item.show = true;
            item.token = app._params.token;
            item.bdid = bdid;
            if (thisObject.visitedScene && thisObject.visitedScene?.indexOf(item.id) != -1) {
              item.visited = true;
            }
          });
        } else if (thisObject.visitedScene && thisObject.visitedScene?.indexOf(city.id) != -1) {
          city.visited = true;
        }
      });
    },

    /** 显示展厅 */
    showExhibitionHall: function () {
      const thisObject = this;
      const app = this._app;
      const url = app._config.exhibitionHallDataUrl;

      if (!url) return;

      const mapSDK = app._mapView._mapSDK;
      let isInited;

      mapSDK.on("onIndoorBuildingActive", (sender, building) => {
        if (!building || isInited) return;

        const bdid = building.bdid;
        app.downloader.getServiceData(
          url,
          "GET",
          "json",
          { token: app._params.token, bdid, t: Date.now() },
          (data) => {
            if (!data.result) return;

            const result = data.result;
            const objData = {};

            result.forEach((item) => {
              item.icon = item.icon || 0;
              item.text = item.text || item.name || "";
              item.minlevel = 16;
              item.maxlevel = 24;
              item.detailUrl = "/pages/guide/index";
              item.type = "Exhibition";

              const floorId = item.floorId || "";
              const itemBdid = item.bdid || "outdoor";

              if (!objData[itemBdid]) {
                objData[itemBdid] = itemBdid == "outdoor" ? [] : {};
              }
              if (itemBdid != "outdoor" && !objData[itemBdid][floorId]) {
                objData[itemBdid][floorId] = [];
              }

              if (floorId) {
                objData[itemBdid][floorId].push(item);
              } else if (itemBdid == "outdoor") {
                objData.outdoor.push(item);
              }
            });

            for (const dataBdid in objData) {
              if (dataBdid == "outdoor") {
                thisObject.exhibitionHallPoiLayer = mapSDK.createPoiLayer({ bdid: dataBdid, floorId: "", data: objData.outdoor });
              } else {
                const bdData = objData[dataBdid];
                for (const floorId in bdData) {
                  thisObject.exhibitionHallPoiLayer = mapSDK.createPoiLayer({ bdid: dataBdid, floorId, data: bdData[floorId] });
                }
              }

              if (thisObject._args?.method == "showExhibition") {
                const id = thisObject._args.exhibition_id;
                for (let i = 0, len = result.length; i < len; i++) {
                  if (result[i].id == id) {
                    thisObject.openPoiDetailPage(result[i]);
                    return;
                  }
                }
              }
            }
          },
          () => {},
        );
        isInited = true;
      });
    },

    /**
     * 通过编码搜索展品
     * @param {string} code - 展品编码
     */
    searchExhibitsByCode: function (code) {
      const thisObject = this;
      const app = thisObject._app;

      daxiapp.api.getExhibitByNum(
        { exhibitNum: code },
        (data) => {
          if (data.status == 1) {
            app.jsBridge.openExtraPoiDetail({ id: data.data.exhibit_id, type: "Exhibit" });
            thisObject._inputCode.hide();
            thisObject._pauseExhibitionAutoPlay = false;
          } else {
            thisObject._inputCode.showMsg(data.msg || "暂无相关展品");
          }
        },
        () => thisObject._inputCode.showMsg("展品数据请求失败"),
      );
    },

    /** 打开自动讲解 */
    openAutoDesc: function () {
      this.onAutoDescClicked();
    },

    /**
     * 打开路线导航
     * @param {Object} poinInfo - POI信息
     */
    openRoute: function (poinInfo) {
      const locationManager = this._app._mapView._locationManager;
      const startPoint = {};

      if (locationManager) {
        const myPositionInfo = locationManager.getMyPositionInfo();
        startPoint.lon = myPositionInfo.position[0];
        startPoint.lat = myPositionInfo.position[1];
        startPoint.bdid = myPositionInfo.bdid || "";
        startPoint.floorId = myPositionInfo.floorId || "";
        startPoint.name = "我的位置";
        startPoint.posMode = "myPosition";
      }

      this._app._stateManager.pushState("MapStateRoute", {
        method: "takeToThere",
        endPoint: poinInfo,
        startPoint,
      });
    },

    /** 自动讲解点击事件处理 */
    onAutoDescClicked: function () {
      const thisObject = this;
      const mapView = thisObject._app._mapView;

      if (thisObject._exhibitionAutoPlay == true) {
        thisObject._autoDescCtrl.switchStatus();
        thisObject._exhibitionAutoPlay = false;
        thisObject.lastMatch = null;
        return;
      }

      if (!thisObject._app._params.isNativeApp && !mapView._locationManager.getGPSState()) {
        daxiapp.dom.showTips("请开启定位开关", "如何开启", () => {
          thisObject._tipComponent.show({
            title: "<i class='icon_gb-lanya blue'></i>如何开启定位开关",
            content: "上/下滑找到<span class='red'>定位图标</span>打开或<span class='red'>在设置</span>中打开",
            img: "./images/GPS.png",
          });
        });
        return;
      }

      thisObject._exhibitionAutoPlay = true;
      thisObject._autoDescCtrl.switchStatus();
    },

    /**
     * 获取支付状态
     * @param {Function} successFn - 成功回调
     * @param {Function} failedFn - 失败回调
     */
    getPayStatus: function (successFn, failedFn) {
      const command = this._app._params;
      daxiapp.utils.getPayStatus(
        {
          getPayStatusUrl: this._app._config.getPayStatusUrl,
          token: command.token,
          bdid: command.bdid,
          userId: command.userId,
        },
        successFn,
        failedFn,
      );
    },

    /**
     * 获取场景列表
     * @param {string} token - 令牌
     * @param {string} bdid - 建筑ID
     * @param {Function} successFn - 成功回调
     * @param {Function} failedFn - 失败回调
     */
    getSceneList: function (token, bdid, successFn, failedFn) {
      const thisObject = this;
      const command = thisObject._app._params;
      const url = `${window.dataPath}/${token || command.token}/${bdid || command.bdid}/pages/spot_list.json`;

      dxUtil.getDataJsonViaBlob(
        url,
        (result) => {
          if (result.list) result = result.list;
          if (result.length) {
            thisObject.scenelist = result;
            result.bdid = bdid;
            thisObject.setVisitedScene();
          }
          successFn?.(result);
        },
        (error) => {
          domUtils.showInfo(error?.msg);
          failedFn?.(error);
        },
      );
    },

    /**
     * 获取城市列表
     * @param {Function} successFn - 成功回调
     * @param {Function} failedFn - 失败回调
     */
    getCityList: function (successFn, failedFn) {
      const thisObject = this;
      const command = thisObject._app._params;
      const url = `https://map1a.daxicn.com/scenic/${command.token}/city.json?&t=${new Date().getTime()}`;

      dxUtil.getDataJsonViaBlob(
        url,
        (result) => {
          if (result.result?.length) {
            thisObject.citylist = result.result;
            successFn?.(result.result);
          }
        },
        (error) => {
          domUtils.showInfo(error.msg);
          failedFn?.(error);
        },
      );
    },
  });

  daxiapp.MapStateBrowse = MapStateBrowse;
})(window);
