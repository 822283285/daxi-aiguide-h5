# 壳层下线说明

- 已完成 `map-ui-container` 壳层目录下线，项目入口改为直连 `app/navi_app/shouxihu/index_src.html`。
- 运行时参数与环境配置能力已迁移到 `app/navi_app/shouxihu/js/runtime-config.js`。
- `commonUtils` 中壳层提供的 URL 与 AES 能力已在导航页运行时注入，避免再依赖 `window.parent.commonUtils`。
- 最小 CI 已切换为只校验导航主入口 HTML，不再检查壳层页面。
