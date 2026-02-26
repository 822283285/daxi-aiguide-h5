(function () {
  "use strict";

  const DEFAULT_PAGES = [
    "HomePage",
    "ServicePage",
    "ProfilePage",
    "MapStateBrowse",
    "MapStateMainPoiPage",
    "MapStatePoi",
    "MapStatePoiDetail",
    "MapStateRoute",
    "MapStateSimulateNavi",
    "MapStateNavi",
    "MapStateSelectPoint",
    "MapStateSearchPage",
    "MapStateBuildingList",
    "MapStateChangeStartEndPoint",
    "MapStateExhibitionRoute",
    "PoiDetailPage",
    "MapStateVisitNavi",
    "VoiceListenerPage",
    "MapStateSharePos",
    "MapStateCreateGroup",
    "MapStateShareGroup",
  ];

  function createPageState(name) {
    return { stateName: name, stateClassName: name };
  }

  function createLegacyAppInitializer(options = {}) {
    const globalRef = options.globalRef || window;
    const appApi = options.appApi || globalRef.DxApp;
    const daxiapp = options.daxiapp || globalRef.DaxiApp || {};
    const domFactory = options.domFactory || globalRef.$;
    const getCommand = options.getCommand || daxiapp.utils?.getCommand;
    const customEventCtor = options.customEventCtor || globalRef.CustomEvent;

    function onCreate(api) {
      const params = api.getParams();
      const { method } = params;

      if (!["MapStateBrowse", "init", "initPage"].includes(method)) {
        const initPageParams = { ...params, method: "initPage" };
        api.processCommand(initPageParams);
      }

      api.processCommand(params);
    }

    function renderLoading(bdid) {
      if (typeof domFactory !== "function") {
        return;
      }

      const firstPage = domFactory("#first_page");
      const loadingImage = bdid == "B000A11DEA" ? "images/shouxihu/loading3.gif" : "images/hygz/loading3.gif";
      firstPage.addClass(bdid).append(
        domFactory(`
      <div class="loading">
        <span class="loadimg"><img src="${loadingImage}" alt=""></span>
        <span class="loadtext">服务加载中</span>
        <span class="tips">开启定位开关，体验智能导游</span>
      </div>
    `),
      );
    }

    function dispatchFirstScreenReady(buildingId) {
      if (!customEventCtor || typeof globalRef.dispatchEvent !== "function") {
        return;
      }

      globalRef.dispatchEvent(
        new customEventCtor("daxi:first-screen-ready", {
          detail: { timestamp: Date.now(), buildingId },
        }),
      );
    }

    return {
      start() {
        const command = typeof getCommand === "function" ? getCommand() : {};
        const bdid = command?.buildingId;

        renderLoading(bdid);

        appApi?.init({
          container: "app",
          pages: DEFAULT_PAGES.map(createPageState),
          onCreate,
        });

        dispatchFirstScreenReady(bdid);

        return { buildingId: bdid };
      },
    };
  }

  const initializer = createLegacyAppInitializer();
  initializer.start();
})();
