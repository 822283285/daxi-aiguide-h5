(function () {
  "use strict";

  const RETRY_LIMIT = 2;
  const SCRIPT_TIMEOUT = 8000;
  const BOOTSTRAP_TIMEOUT = 20000;

  const scripts = [
    "./lib/crypto-js.min.js",
    "./lib/uni.webview.1.5.6.js",
    "./config/runtime-config.js",
    "./assets/js/utils.js",
    "./assets/js/app-config.js",
    "./assets/js/message-factory.js",
    "./assets/js/socketUtils.js",
    "./assets/js/tabbar.js",
    "./assets/js/page-switcher.js",
    "./assets/js/container-init.js",
  ];

  function createFallback(message) {
    const fallback = document.createElement("div");
    fallback.id = "container-bootstrap-fallback";
    fallback.style.cssText =
      "position:fixed;inset:0;background:#fff;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;color:#333;font-size:14px;";
    fallback.innerHTML = `<div><h3 style=\"margin:0 0 12px;\">页面加载失败</h3><p style=\"margin:0;\">${message}</p></div>`;
    document.body.appendChild(fallback);
  }

  function loadScript(src, attempt = 1) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      let done = false;
      const timer = window.setTimeout(() => {
        if (done) return;
        done = true;
        script.remove();
        reject(new Error(`${src} 加载超时(${SCRIPT_TIMEOUT}ms)`));
      }, SCRIPT_TIMEOUT);

      script.src = src;
      script.async = false;
      script.onload = () => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        resolve();
      };

      script.onerror = () => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        script.remove();

        if (attempt <= RETRY_LIMIT) {
          resolve(loadScript(src, attempt + 1));
          return;
        }
        reject(new Error(`${src} 加载失败，已重试 ${RETRY_LIMIT} 次`));
      };

      document.head.appendChild(script);
    });
  }

  async function start() {
    const timeoutId = window.setTimeout(() => {
      createFallback("容器脚本初始化超时，请检查网络后重试。");
    }, BOOTSTRAP_TIMEOUT);

    try {
      for (const src of scripts) {
        await loadScript(src);
      }
      window.clearTimeout(timeoutId);
    } catch (error) {
      window.clearTimeout(timeoutId);
      console.error("[container-bootstrap]", error);
      createFallback(error.message || "容器脚本加载失败，请刷新重试。");
    }
  }

  start();
})();
