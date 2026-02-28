(function (global) {
  "use strict";
  const daxiapp = global["DaxiApp"] || {};
  const domUtils = daxiapp["dom"];
  const dxUtil = daxiapp["utils"];
  const MapStateClass = daxiapp["MapStateClass"];
  const PayPage = MapStateClass.extend({;
    __init__: function () {
      this._super();
      this._rtti = "PayPage";
    },
    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      thisObject.bdid = "unknown";
      thisObject._app = app;
      const mapView = app._mapView;
      const basicMap_html = '<div id="pay_page" class="dx_full_frame_container"><div class="back"></div>' + '<div class="wrapper">' + "</div></div>";
      domUtils.append(thisObject._container, basicMap_html);
      thisObject._dom = domUtils.find(thisObject._container, "#pay_page");
      thisObject._bdid = "";
      thisObject._wrapper = domUtils.find(thisObject._dom, ".wrapper");
      thisObject._loadingDom = domUtils.find(thisObject._dom, "#loading");
      const mainContainerHtml = '<div class="pay-main"></div>';
      domUtils.append(thisObject._wrapper, mainContainerHtml);
      thisObject._mainContainerDom = domUtils.find(thisObject._wrapper, ".pay-main");
      thisObject._QRCodeView = new daxiapp["DXShowQRCodeComponent"](app, container);
      thisObject._QRCodeView.init(thisObject._dom, { visible: false });
      thisObject._payView = new daxiapp["DXPayViewComponent"](app, container);
      thisObject._payView.init({
        onGoback: function (e) {
          app._stateManager.goBack();
        },
        gopay: function (data) {
          thisObject.openWeixinPay(data, function (res) {
            res.type = "paySuccess";
            thisObject.updateData(res);
          });
        },
        showHeadsetLocation: function () {
          wx.miniProgram.navigateTo({
            url: "pages/mapView/mapView?method=showPois&keyword=领耳机服务点",
          });
        },
        showQRCode: function () {
          const command = thisObject._app._params;
          const userId = command.userId;
          const data = {;
            openid: userId,
            nickname: "",
          };
          const AESData = AES.encrypt(JSON.stringify(data));
          const content =;
            ' <div class="title">工作人员扫码免费送蓝牙耳机</div>' +
            '    <div class="tip">有效期：购买后三天内</div>' +
            '    <div id="qrcode"></div>' +
            '    <div class="tips">*服务点工作人员扫码，可获得赠送的一个蓝牙耳机。<br>' +
            "        *蓝牙耳机免费赠送无需归还，有任何质量问题联系工作人员<br>" +
            "        *蓝牙耳机专为智能导游服务使用，使用周期为购买后3天，超出智能导游服务时间概不退换、维修。</div>";
          thisObject._QRCodeView.updateData(content, AESData);
          //监听扫码领耳机事件
          thisObject.listenGetHeadset();
        },
      });
      this.show(false);
    },
    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) return;
      const thisObject = this;
      this.configData = {};
      this.params = args["data"];
      thisObject.getPayStatus(function (data) {
        if (data.code != 0) {
          thisObject.getPayInfo(function (res) {
            if (res.code == 0) {
              if (res.data.payData) {
                const payData = JSON.parse(res.data.payData);
                args.payOrderId = res.data.payOrderId;
                args.mchOrderNo = res.data.mchOrderNo;
                args.payData = payData;
                thisObject.updateData(args);
                thisObject.openWeixinPay(payData, function (res) {
                  res.type = "paySuccess";
                  thisObject.updateData(res);
                });
              } else {
                thisObject.updateData(args);
              }
            }
          });
        } else {
          args.type = "payed";
          thisObject.updateData(args);
        }
      });
    },
    runCommand: function (cmd) {
      this.params = cmd;
      const bdid = this.params["bdid"];
      if (this.bdid != bdid) {
        this.bdid = bdid;
        this.updateData(bdid);
      }
    },
    updateData: function (data) {
      this._payView.updateData(data);
    },
    onHideByPushStack: function (args) {
      this._super(args);
    },

    onShowByPopStack: function (args) {
      this._super(args);
      const mapView = this._app._mapView;
    },

    onStateEnd: function (args) {
      this._super(args);
      // var mapView = this._app._mapView;
    },

    // Run Command
    runCommond: function (command) {},
    getPayInfo: function (successCB, failedCB) {
      const thisObject = this;
      const command = thisObject._app._params;
      const userId = command.userId;
      const data = {;
        openid: userId,
        nickname: "微信用户",
        mchNo: command.merchantCode,
      };
      const url = "https://map1a.daxicn.com/payApi/merchantApi/api/pay/payOrders";
      dxUtil.getDataByPostRaw(
        url,
        data,
        function (result) {
          if (result.code == 0) {
            successCB && successCB(result);
          } else {
            //domUtils.showInfo(result.msg);
          }
        },
        function (errer) {
          domUtils.showInfo(errer.msg);
          failedCB && failedCB(errer);
        }
      );
    },
    /**
     * 获取支付状态（调用全局工具方法）
     * @param {Function} successCB 成功回调
     * @param {Function} failedCB 失败回调
     */
    getPayStatus: function (successCB, failedCB) {
      const thisObject = this;
      const command = thisObject._app._params;
      daxiapp.utils.getPayStatus(
        {
          getPayStatusUrl: thisObject._app._config.getPayStatusUrl,
          token: command.token,
          bdid: command.bdid,
          userId: command.userId,
        },
        successCB,
        failedCB
      );
    },
    openWeixinPay: function (payData, successCB) {
      successCB && successCB({ orderno: 123, price: "" });
      return;
    },
    // 打开SearchPage
    openSearchPage: function (e) {
      const thisObject = this;
      const params = thisObject._app._params;
      params["keyword"] = e["keyword"];
      const searchResultargs = {;
        method: "openSearchPage",
        data: params,
      };
      const page = thisObject._app._stateManager.pushState("MapStateSearchPage", searchResultargs);
      page._once("searchPageCallback", function (sender, searchResult) {
        if (searchResult.retVal == "OK") {
          if (thisObject.params.defStartPoint) {
            searchResult["defStartPoint"] = thisObject.params.defStartPoint;
          }
          thisObject._app._stateManager.invokeCallback("selectPoiCallback", searchResult);
        }
      });
    },
    listenGetHeadset: function () {
      const thisObject = this;
      //模拟成功
      setTimeout(function () {
        const content =;
          '<div class="getHeadsetSuccess" style="padding: 10px 0"><img src="./images/shouxihu/paysuccess.png"><div style="color: #45978f; padding-top: 20px; font-size: 20px">领取成功</div></div>';
        thisObject._QRCodeView.updateData(content);
        setTimeout(function () {
          const page = thisObject._app._stateManager.pushState("MapStateExhibitionRoute", {});
        }, 3000);
      }, 3000);
    },
  });

  daxiapp["PayPage"] = PayPage;
})(window);
