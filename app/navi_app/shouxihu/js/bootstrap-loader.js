(function () {
  "use strict";

  const RETRY_LIMIT = 2;
  const SCRIPT_TIMEOUT = 10000;
  const BOOTSTRAP_TIMEOUT = 45000;

  const scriptGroups = [
    {
      name: "preload",
      files: ["./utils/getParam.js", "./js/runtime-config.js"],
    },
    {
      name: "vendor",
      files: [
        "../libs/swiper/swiper-bundle.min.js",
        "../libs/jweixin-1.6.js",
        "../libs/zepto.min.js",
        "../libs/zepto.ext.js",
        "../libs/handlebars-v3.0.3.min.js",
        "../libs/crypto-js.js",
        "../libs/AES.js",
        "../libs/three.min.js",
        "../libs/voicePlugin.js",
        "../libs/md5.js",
        "../libs/signMd5Utils.js",
        "../libs/qrcode.min.js",
      ],
    },
    {
      name: "map_sdk",
      files: [
        "../../../map_sdk/map/daximap.utils.js",
        "../../../map_sdk/map/scene/daximap.visitor.js",
        "../../../map_sdk/map/scene/daximap.core.js",
        "../../../map_sdk/map/scene/daximap.indoor.js",
        "../../../map_sdk/map/scene/daximap.outdoor.js",
        "../../../map_sdk/map/scene/daximap.layers.js",
        "../../../map_sdk/map/daximap.scene.js",
        "../../../map_sdk/map/daximap.api.js",
        "../../../map_sdk/map/daximap.control.js",
        "../../../map_sdk/map/daximap.location.js",
        "../../../map_sdk/map/daximap.speak.js",
        "../../../map_sdk/map/daximap.navi.js",
        "../../../map_sdk/map/daximap.routes.js",
        "../../../map_sdk/map/daximap.naviManager.js",
      ],
    },
    {
      name: "daxi_runtime",
      files: [
        "./utils/environment.js",
        "../utils/ARNavigation.js",
        "../../../jsbridge/daxiapp.jsbridge.js",
        "../utils/daxiapp.cache.js",
        "../utils/daxiapp.dom.js",
        "../utils/daxiapp.utils.js",
        "./js/daxiapp.api.js",
        "../utils/daxiapp.stateMgr.js",
        "../components/daxiapp.component.js",
        "../components/daxiapp.basecomponent.js",
        "./js/daxiapp.mapView.js",
        "./extend_guobo/js/daxiapp.page.mapStateBrowse.js",
        "./extend_guobo/js/daxiapp.page.mapStatePoiDetail.js",
        "./extend_guobo/js/daxiapp.page.exhibitionRoute.js",
        "./extend_guobo/js/daxiapp.page.mapStateAutoPlayExhibit.js",
        "./extend_guobo/js/daxiapp.page.poiDetail.js",
        "./extend_guobo/js/daxiapp.page.index.js",
        "../../../app/components/daxi-guide-ui.component.js",
        "./extend_guobo/js/daxiapp.page.home.js",
        "./extend_guobo/js/daxiapp.page.service.js",
        "./extend_guobo/js/daxiapp.page.profile.js",
        "./extend_guobo/js/daxiapp.page.aboutPage.js",
        "./extend_guobo/js/daxiapp.page.payPage.js",
        "./extend_guobo/js/daxiapp.page.payResultPage.js",
        "./extend_guobo/js/daxiapp.page.visitNavi.js",
        "./js/daxiapp.page.mapStatePoi.js",
        "./js/daxiapp.page.mapStateRoute_new.js",
        "./js/daxiapp.page.mapStateMainPoiPage.js",
        "./js/daxiapp.page.mapStateSearchPage.js",
        "./js/daxiapp.page.mapStateChangeStartEndPoint.js",
        "./js/daxiapp.page.mapStateSelectPoint.js",
        "./js/daxiapp.page.mapStateSimulateNavi.js",
        "./js/daxiapp.page.mapStateNavi.js",
        "./js/daxiapp.page.mapStateBulldingList.js",
        "./js/daxiapp.page.mapStateCreateShareGroup.js",
        "./js/daxiapp.page.mapStateGroupShare.js",
        "./js/daxiapp.page.mapStateSharePos.js",
        "./js/daxiapp.page.voiceListener.js",
        "./js/daxiapp.page.command.js",
        "./js/dxapi.app.js",
        "./js/app-init.js",
        "../libs/uni.webview.1.5.6.js",
      ],
    },
  ];

  const status = [];
  window.__daxiBootstrapStatus = status;

  function getTrackType(src) {
    if (src.includes("/map_sdk/")) return "map_sdk";
    if (src.includes("/jsbridge/")) return "jsbridge";
    if (/daxiapp\./.test(src)) return "daxiapp";
    return "other";
  }

  function record(src, state, reason = "") {
    const entry = {
      src,
      state,
      reason,
      type: getTrackType(src),
      timestamp: Date.now(),
    };
    status.push(entry);
    window.dispatchEvent(new CustomEvent("daxi:dependency-status", { detail: entry }));
  }

  function renderFallback(message) {
    const node = document.createElement("div");
    node.id = "bootstrap-fallback";
    node.style.cssText =
      "position:fixed;inset:0;background:#fff;display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;";
    node.innerHTML = `<div style=\"max-width:320px;text-align:center;color:#333;\"><h3 style=\"margin:0 0 12px;\">地图加载失败</h3><p style=\"margin:0 0 8px;\">${message}</p><p style=\"margin:0;color:#999;font-size:12px;\">请刷新页面后重试</p></div>`;
    document.body.appendChild(node);
  }

  function loadScript(src, attempt = 1) {
    record(src, "loading", `attempt:${attempt}`);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      let settled = false;
      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        script.remove();
        record(src, "failed", "timeout");
        reject(new Error(`${src} 加载超时(${SCRIPT_TIMEOUT}ms)`));
      }, SCRIPT_TIMEOUT);

      script.src = src;
      script.async = false;

      script.onload = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        record(src, "loaded");
        resolve();
      };

      script.onerror = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        script.remove();

        if (attempt <= RETRY_LIMIT) {
          record(src, "retry", `retry-attempt:${attempt}`);
          resolve(loadScript(src, attempt + 1));
          return;
        }

        record(src, "failed", "network-error");
        reject(new Error(`${src} 加载失败，已重试 ${RETRY_LIMIT} 次`));
      };

      document.head.appendChild(script);
    });
  }

  async function loadGroup(group) {
    for (const file of group.files) {
      await loadScript(file);
    }
  }

  async function bootstrap() {
    const deadline = window.setTimeout(() => {
      record("bootstrap", "failed", "global-timeout");
      renderFallback("资源加载超时");
    }, BOOTSTRAP_TIMEOUT);

    try {
      for (const group of scriptGroups) {
        await loadGroup(group);
      }
      window.clearTimeout(deadline);
      record("bootstrap", "loaded", "completed");
    } catch (error) {
      window.clearTimeout(deadline);
      console.error("[bootstrap-loader]", error);
      renderFallback(error.message || "资源加载失败");
    }
  }

  bootstrap();
})();
