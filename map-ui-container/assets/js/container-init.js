(function () {
  "use strict";

  function initPageSwitcher() {
    if (window.pageSwitcher && typeof window.pageSwitcher.init === "function") {
      window.pageSwitcher.init();
      return;
    }
    console.error("[container-init] pageSwitcher 未就绪，无法初始化");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPageSwitcher, { once: true });
  } else {
    initPageSwitcher();
  }
})();
