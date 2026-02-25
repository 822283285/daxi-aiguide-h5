(function (global) {
  "use strict";
  const daxiapp = global.DaxiApp || {};
  const domUtils = daxiapp.dom;
  const dxUtil = daxiapp.utils;
  const MapStateClass = daxiapp.MapStateClass;

  const IndexPage = MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "IndexPage";
    },

    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      thisObject.bdid = "unknown";
      thisObject._app = app;

      domUtils.append(thisObject._container, `<div id="index_page" class="dx_full_frame_container"><div class="wrapper"></div></div>`);
      thisObject._dom = domUtils.find(thisObject._container, "#index_page");
      thisObject._bdid = "";
      thisObject._wrapper = domUtils.find(thisObject._dom, ".wrapper");
      thisObject._loadingDom = domUtils.find(thisObject._dom, "#loading");

      // 初始化轮播组件
      thisObject._swiperView = new daxiapp.DXSwiperComponent(app, container);
      thisObject._swiperView.init(thisObject._wrapper, {
        style: { width: "100%", background: "#fff" },
        listener: {
          slideChangeTransitionEnd: (sender) => {
            sender.getAllSlides().forEach((slide) => console.log(slide));
          },
        },
      });

      // 初始化图标主视图
      domUtils.append(thisObject._wrapper, `<div class="icon-main clearfix"></div>`);
      thisObject._iconMainDom = domUtils.find(thisObject._wrapper, ".icon-main");
      thisObject._iconMainView = new daxiapp.DXCommonPOIViewComponent(app, thisObject._iconMainDom);
      thisObject._iconMainView.init({
        onItemBtnClicked: (sender, data) => {
          const args = { method: "openSearchPage", retVal: "OK", data };
          if (thisObject.params?.defStartPoint) {
            args.data.defStartPoint = thisObject.params.defStartPoint;
          }
          app._stateManager.invokeCallback("selectPoiCallback", args);
        },
      });

      domUtils.append(thisObject._wrapper, `<div class="index-lineBox"></div>`);
      thisObject._indexLineDom = domUtils.find(thisObject._wrapper, ".index-lineBox");

      domUtils.append(thisObject._wrapper, `<div class="introduce"></div>`);
      thisObject._introduceDom = domUtils.find(thisObject._wrapper, ".introduce");

      thisObject._payComponent = new daxiapp.DXShowPayComponent();
      thisObject._payComponent.init(thisObject._dom, { visible: false });

      this.show(false);
    },

    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) return;
      this.configData = {};
      this.params = args.data;
      this.updateData();
      this.injectComponentEvents();
    },

    runCommand: function (cmd) {
      this.params = cmd;
      const bdid = this.params?.bdid;
      if (this.bdid != bdid) {
        this.bdid = bdid;
        this.updateData(bdid);
      }
    },

    /** 根据支付状态决定跳转页面 */
    _handlePayNavigation: function () {
      const thisObject = this;
      const command = thisObject._app._params;
      thisObject.getPayStatus((res) => {
        if (res.code != 0) {
          thisObject._app._stateManager.pushState("PayPage", {
            openid: command?.userId,
            price: "",
            nickname: "",
            mchNo: command?.merchantCode,
          });
        } else {
          thisObject._app._stateManager.pushState("MapStateBrowse", { method: "openAutoDesc" });
        }
      });
    },

    injectComponentEvents: function () {
      this._super();
      const thisObject = this;

      domUtils.on(thisObject._dom, "click", ".scenic", function () {
        console.log($(this).attr("data-id"));
      });

      domUtils.on(thisObject._dom, "click", ".zndy", () => thisObject._handlePayNavigation());

      domUtils.on(thisObject._dom, "click", ".yllx", () => {
        thisObject._app._stateManager.pushState("MapStateExhibitionRoute", {});
      });

      domUtils.on(thisObject._dom, "click", ".yqdt", () => {
        thisObject._app._stateManager.pushState("MapStateBrowse", {});
      });

      domUtils.on(thisObject._dom, "click", ".swiper-slide img", function () {
        const $el = $(this);
        const type = $el.attr("data-type");
        if (type == "about") {
          thisObject._app._stateManager.pushState("AboutPage", {
            infoUrl: $el.attr("src"),
            description: $el.attr("data-content"),
          });
        } else {
          thisObject._dom.find(".zndy").trigger("click");
        }
      });

      domUtils.on(thisObject._dom, "click", ".scenic", function () {
        const exhibitid = $(this).attr("data-exhibitid");
        if (exhibitid == "more") {
          domUtils.showInfo("功能开发中，敬请期待！");
          return;
        }
        thisObject._app?.pageCommand?.openExhibit({ id: exhibitid, type: "Exhibit" });
      });
    },

    /** 构建景点介绍HTML */
    _buildIntroduceHtml: function (introduce) {
      if (!introduce) return "";
      let html = `<div class="titleBig">${introduce.title || ""}</div>`;
      introduce.list?.forEach((scenic) => {
        let scenicHtml = `<div class="scenicBox">`;
        scenic.list?.forEach((item) => {
          scenicHtml += `<div class="scenic" style="width:${item.width}" data-exhibitid="${item.exhibitId}">`;
          scenicHtml += `<div class="scenicImg"><img src="${item.imgurl}"></div></div>`;
        });
        html += scenicHtml + `</div>`;
      });
      return html;
    },

    updateData: function () {
      const thisObject = this;
      const command = thisObject._app?._params;
      const indexConfigUrl = thisObject._app?._config?.indexConfigUrl || "./extend_guobo/mock/index.json";

      dxUtil.getData(indexConfigUrl, {}, "json", (data) => {
        console.log("执行了这个方法", data);
        if (!data.success) {
          domUtils.showInfo(data.message);
          return;
        }

        const res = data.result;

        // 更新轮播图
        thisObject._swiperView.removeAllSlides();
        res.banner?.forEach((banner) => {
          thisObject._swiperView.appendSlide(
            `<div class="swiper-slide"><img data-id="${banner.id}" src="${banner.imgurl}" data-content="${banner.content}" data-type="${banner.type}" alt="" width="100%"></div>`,
          );
        });

        // 更新图标区
        thisObject._iconMainView.updateData(res.indexIcon);

        // 更新路线区
        thisObject._indexLineDom.html("");
        res.line?.forEach((line) => {
          thisObject._indexLineDom.append(
            $(
              `<div class='indexLine ${line.class}'><span class='lineTitle'>${line.title}</span><span class='lineDes'>${line.discript}</span><img src='${line.imgurl}' alt=''></div>`,
            ),
          );
        });

        // 更新介绍区
        thisObject._introduceDom.html($(thisObject._buildIntroduceHtml(res.introduce)));
      });

      // 处理showPay行为
      if (command?.action == "showPay") {
        thisObject._handlePayNavigation();
      }
    },

    onHideByPushStack: function (args) {
      this._super(args);
    },

    onShowByPopStack: function (args) {
      this._super(args);
    },

    onStateEnd: function (args) {
      this._super(args);
    },

    runCommond: function () {},

    getExhibit: function () {},

    openPoiDetailPage: function (poiInfo, markerLayer) {
      const thisObject = this;
      const { _app } = thisObject;
      const bdid = _app?._mapView?._mapSDK?.getCurrentBDID?.();
      const token = _app?._params?.token;
      const floorId = poiInfo?.floorId;

      const poiData = daxiapp.utils.copyData(poiInfo);
      Object.assign(poiData, {
        featureId: poiData.featureId || poiData.id,
        bdid: poiData.bdid || bdid,
        floorName: poiData.floorName || "",
        address: poiData.address || "",
        exhibitId: poiData.exhibitId || "",
      });

      const args = {
        method: "openPoiDetailPage",
        data: { bdid, token, arealType: bdid ? "indoor" : "outdoor", poiInfo: poiData },
      };

      // 设置默认起点
      if (thisObject.buildingInfo?.defStartPoint) {
        thisObject.buildingInfo.defStartPoint.bdid = thisObject.buildingInfo.bdid;
        const myPositionInfo = _app?._mapView?._locationManager?.getMyPositionInfo?.();
        if (!myPositionInfo?.floorId || myPositionInfo.bdid != thisObject.buildingInfo.bdid) {
          args.data.defStartPoint = thisObject.buildingInfo.defStartPoint;
        }
      }

      const { _stateManager } = _app;
      const mapStatePoiDetail = _stateManager.getMapState("MapStatePoiDetail");
      if (thisObject == _stateManager.getCurrentState()) {
        _stateManager.pushState("MapStatePoiDetail", args);
      } else if (mapStatePoiDetail == _stateManager.getCurrentState()) {
        mapStatePoiDetail.openPoiDetailPage(args.data.poiInfo, markerLayer);
      }
    },

    /**
     * 获取支付状态
     * @param {Function} successFn 成功回调
     * @param {Function} failedFn 失败回调
     */
    getPayStatus: function (successFn, failedFn) {
      const command = this._app?._params;
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
  });

  daxiapp.IndexPage = IndexPage;
})(window);
