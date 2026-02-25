(function () {
  "use strict";

  const daxiapp = window.DaxiApp;
  const firstPage = window.$("#first_page");
  const command = daxiapp.utils.getCommand();
  const bdid = command.buildingId;

  const loadingImage = bdid == "B000A11DEA" ? "images/shouxihu/loading3.gif" : "images/hygz/loading3.gif";
  firstPage.addClass(bdid).append(
    window.$(`
      <div class="loading">
        <span class="loadimg"><img src="${loadingImage}" alt=""></span>
        <span class="loadtext">服务加载中</span>
        <span class="tips">开启定位开关，体验智能导游</span>
      </div>
    `),
  );

  const pageState = (name) => ({ stateName: name, stateClassName: name });

  DxApp.init({
    container: "app",
    pages: [
      pageState("HomePage"),
      pageState("ServicePage"),
      pageState("ProfilePage"),
      pageState("MapStateBrowse"),
      pageState("MapStateMainPoiPage"),
      pageState("MapStatePoi"),
      pageState("MapStatePoiDetail"),
      pageState("MapStateRoute"),
      pageState("MapStateSimulateNavi"),
      pageState("MapStateNavi"),
      pageState("MapStateSelectPoint"),
      pageState("MapStateSearchPage"),
      pageState("MapStateBuildingList"),
      pageState("MapStateChangeStartEndPoint"),
      pageState("MapStateExhibitionRoute"),
      pageState("PoiDetailPage"),
      pageState("MapStateVisitNavi"),
      pageState("VoiceListenerPage"),
      pageState("MapStateSharePos"),
      pageState("MapStateCreateGroup"),
      pageState("MapStateShareGroup"),
    ],
    onCreate: function (api) {
      const params = api.getParams();
      const { method } = params;

      if (!["MapStateBrowse", "init", "initPage"].includes(method)) {
        const initPageParams = { ...params, method: "initPage" };
        api.processCommand(initPageParams);
      }
      api.processCommand(params);
    },
  });

  window.dispatchEvent(
    new CustomEvent("daxi:first-screen-ready", {
      detail: { timestamp: Date.now(), buildingId: bdid },
    })
  );
})();
