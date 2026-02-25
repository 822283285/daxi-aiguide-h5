# Repository Health Check Report

- Generated at: 2026-02-25T08:46:11.825Z
- Scope: `*.js` files under repository root

## 1) JS 文件统计

- JS 文件总数: **155**
- JS 总行数: **158763**

### TOP 10 大文件（按行数）

| 排名 | 文件 | 行数 |
| --- | --- | ---: |
| 1 | map_sdk/location/wx.loc.js | 26252 |
| 2 | app/navi_app/components/daxiapp.component.js | 12056 |
| 3 | map_sdk/map/daximap.scene.js | 10912 |
| 4 | app/navi_app/components/daxiapp.basecomponent.js | 6191 |
| 5 | app/navi_app/libs/crypto-js.js | 6191 |
| 6 | map_sdk/map/daximap.utils.js | 5336 |
| 7 | map_sdk/map/daximap.navi.js | 5177 |
| 8 | map_sdk/map/daximap.navi.ok.js | 4957 |
| 9 | app/navi_app/utils/daxiapp.utils.js | 4871 |
| 10 | app/navi_app/libs/FBXLoader.js | 4114 |

## 2) 重复文件名扫描

发现 **16** 组重复文件名：

### ARNavigation.js (2 个)
- app/navi_app/utils/AR/ARNavigation.js
- app/navi_app/utils/ARNavigation.js

### cordova_plugins.js (2 个)
- jsbridge/android.back/cordova_plugins.js
- jsbridge/ios.back/cordova_plugins.js

### cordova.js (2 个)
- jsbridge/android.back/cordova.js
- jsbridge/ios.back/cordova.js

### daxiapp.page.mapStatePoiDetail.js (2 个)
- app/navi_app/shouxihu/extend_guobo/js/daxiapp.page.mapStatePoiDetail.js
- app/navi_app/shouxihu/js/daxiapp.page.mapStatePoiDetail.js

### DeviceOrientationControls.js (2 个)
- app/navi_app/libs/DeviceOrientationControls.js
- app/navi_app/utils/AR/DeviceOrientationControls.js

### dxDomUtill.js (2 个)
- app/navi_app/libs/dxDomUtill.js
- app/navi_app/utils/dxDomUtill.js

### FBXLoader.js (2 个)
- app/navi_app/libs/FBXLoader.js
- app/navi_app/utils/AR/FBXLoader.js

### fflate.min.js (2 个)
- app/navi_app/libs/fflate.min.js
- app/navi_app/utils/AR/fflate.min.js

### jweixin-1.6.js (2 个)
- app/navi_app/libs/jweixin-1.6.js
- app/navi_app/shouxihu/voucher/libs/jweixin-1.6.js

### OrbitControls.js (2 个)
- app/navi_app/libs/OrbitControls.js
- app/navi_app/utils/AR/OrbitControls.js

### runtime-config.js (2 个)
- app/navi_app/shouxihu/js/runtime-config.js
- map-ui-container/config/runtime-config.js

### three.min.js (2 个)
- app/navi_app/libs/three.min.js
- app/navi_app/utils/AR/three.min.js

### three.path.js (2 个)
- app/navi_app/libs/three.path.js
- app/navi_app/utils/AR/three.path.js

### Tween.js (2 个)
- app/navi_app/libs/Tween.js
- app/navi_app/utils/AR/Tween.js

### uni.webview.1.5.6.js (2 个)
- app/navi_app/libs/uni.webview.1.5.6.js
- map-ui-container/lib/uni.webview.1.5.6.js

### zepto.min.js (2 个)
- app/navi_app/libs/zepto.min.js
- app/navi_app/shouxihu/voucher/libs/zepto.min.js

## 3) `window.* =` 全局写入点扫描

共发现 **153** 个全局写入点：

| 文件 | 行号 | 命中片段 |
| --- | ---: | --- |
| app/navi_app/components/daxiapp.basecomponent.js | 3438 | `window["DXInput_onInput"] =` |
| app/navi_app/components/daxiapp.component.js | 4213 | `window.currentEnv =` |
| app/navi_app/libs/amap.js | 1 | `window._cssload_=` |
| app/navi_app/libs/amap.js | 1 | `window._jsload_=` |
| app/navi_app/libs/amap.js | 1 | `window.cZ=` |
| app/navi_app/libs/amap.js | 1 | `window.Float32Array=` |
| app/navi_app/libs/amap.js | 1 | `window.Float32Array=` |
| app/navi_app/libs/amap.js | 1 | `window.onbeforeload=` |
| app/navi_app/libs/amap.js | 1 | `window.onbeforeunload=` |
| app/navi_app/libs/amap.js | 1 | `window.onscroll=` |
| app/navi_app/libs/amap.js | 1 | `window.onscroll=` |
| app/navi_app/libs/amap.js | 1 | `window.onscroll=` |
| app/navi_app/libs/amap.js | 1 | `window.onscroll=` |
| app/navi_app/libs/amap.js | 1 | `window.onunload=` |
| app/navi_app/libs/amap.js | 1 | `window.xZ=` |
| app/navi_app/libs/amap.js | 1 | `window.xZ=` |
| app/navi_app/libs/dxDomUtill.js | 495 | `window.DXDomUtil =` |
| app/navi_app/libs/dxDomUtill.js | 495 | `window.Zepto =` |
| app/navi_app/libs/huaweiLocation.js | 1 | `window["indoorLocalAlgorithms"] =` |
| app/navi_app/libs/three.min_v1.js | 7 | `window.__THREE__=` |
| app/navi_app/libs/three.min.js | 6 | `window.__THREE__=` |
| app/navi_app/libs/uni.webview.1.5.6.js | 1 | `window.UniAppJSBridge=` |
| app/navi_app/libs/voicePlugin.js | 140 | `window["voice"] =` |
| app/navi_app/libs/zepto.ext.js | 208 | `window._event =` |
| app/navi_app/libs/zepto.min.js | 2 | `window.$=` |
| app/navi_app/libs/zepto.min.js | 2 | `window.getComputedStyle=` |
| app/navi_app/libs/zepto.min.js | 2 | `window.Zepto=` |
| app/navi_app/shouxihu/js/bootstrap-loader.js | 99 | `window.__daxiBootstrapStatus =` |
| app/navi_app/shouxihu/js/daxiapp.mapView.js | 95 | `window.lastHashCount =` |
| app/navi_app/shouxihu/js/daxiapp.mapView.js | 490 | `window["dx_createMapFinished"] =` |
| app/navi_app/shouxihu/js/daxiapp.page.command.js | 24 | `window.locWebSocketOnGetEvent =` |
| app/navi_app/shouxihu/js/dxapi.app.js | 14 | `window.rootPath =` |
| app/navi_app/shouxihu/js/dxapi.app.js | 52 | `window.command =` |
| app/navi_app/shouxihu/js/dxapi.app.js | 75 | `window.projDataPath =` |
| app/navi_app/shouxihu/js/dxapi.app.js | 124 | `window.downloader =` |
| app/navi_app/shouxihu/js/dxapi.app.js | 153 | `window.roadMatch =` |
| app/navi_app/shouxihu/js/dxapi.app.js | 409 | `window.DxApp =` |
| app/navi_app/shouxihu/js/runtime-config.js | 4 | `window.indoorLocalAlgorithms =` |
| app/navi_app/shouxihu/js/runtime-config.js | 5 | `window.mapSDKPath =` |
| app/navi_app/shouxihu/js/runtime-config.js | 22 | `window.dataPath =` |
| app/navi_app/shouxihu/js/runtime-config.js | 23 | `window.projectUrl =` |
| app/navi_app/shouxihu/js/runtime-config.js | 24 | `window.scenicUrl =` |
| app/navi_app/shouxihu/js/runtime-config.js | 25 | `window.localFont =` |
| app/navi_app/shouxihu/utils/environment.js | 87 | `window.DaxiApp =` |
| app/navi_app/shouxihu/utils/getParam.js | 17 | `window.getParam =` |
| app/navi_app/shouxihu/voucher/libs/signature.js | 79 | `window["audioToken"]=` |
| app/navi_app/shouxihu/voucher/libs/signature.js | 80 | `window["version"] =` |
| app/navi_app/shouxihu/voucher/libs/zepto.min.js | 2 | `window.$=` |
| app/navi_app/shouxihu/voucher/libs/zepto.min.js | 2 | `window.getComputedStyle=` |
| app/navi_app/shouxihu/voucher/libs/zepto.min.js | 2 | `window.Zepto=` |
| app/navi_app/utils/AR/ARNavigation_bak.js | 84 | `window.userMedia =` |
| app/navi_app/utils/AR/ARNavigation_bak.js | 307 | `window.userMedia =` |
| app/navi_app/utils/AR/ARNavigation-newAR.js | 11 | `window.userMedia =` |
| app/navi_app/utils/AR/ARNavigation-newAR.js | 58 | `window.userMedia =` |
| app/navi_app/utils/AR/ARNavigation.js | 84 | `window.userMedia =` |
| app/navi_app/utils/AR/ARNavigation.js | 307 | `window.userMedia =` |
| app/navi_app/utils/AR/ARNavigationAPI_12306.js | 9 | `window.userMedia =` |
| app/navi_app/utils/AR/ARNavigationAPI_12306.js | 59 | `window.userMedia =` |
| app/navi_app/utils/AR/ARNavigationAPI.js | 12 | `window.userMedia =` |
| app/navi_app/utils/AR/ARNavigationAPI.js | 60 | `window.userMedia =` |
| app/navi_app/utils/AR/three.min.js | 6 | `window.__THREE__=` |
| app/navi_app/utils/ARNavigation_gzn.js | 188 | `window.userMedia =` |
| app/navi_app/utils/ARNavigation_gzn.js | 268 | `window.userMedia =` |
| app/navi_app/utils/ARNavigation_hg.js | 245 | `window.userMedia =` |
| app/navi_app/utils/ARNavigation_hg.js | 706 | `window.userMedia =` |
| app/navi_app/utils/ARNavigation-new.js | 84 | `window.userMedia =` |
| app/navi_app/utils/ARNavigation-new.js | 307 | `window.userMedia =` |
| app/navi_app/utils/ARNavigation.js | 231 | `window.userMedia =` |
| app/navi_app/utils/ARNavigation.js | 676 | `window.userMedia =` |
| app/navi_app/utils/checkEnv.js | 114 | `window["audioToken"] =` |
| app/navi_app/utils/checkEnv.js | 115 | `window["version"] =` |
| app/navi_app/utils/daxiapp.utils.js | 150 | `window.rawParams =` |
| app/navi_app/utils/daxiapp.utils.js | 1040 | `window.currentEnv =` |
| app/navi_app/utils/daxiapp.utils.js | 1052 | `window.currentEnv =` |
| app/navi_app/utils/dxDomUtill.js | 495 | `window.DXDomUtil =` |
| app/navi_app/utils/dxDomUtill.js | 495 | `window.Zepto =` |
| app/navi_app/utils/JsBarcode.all.min.js | 2 | `window.JsBarcode=` |
| app/navi_app/utils/locationInActivity.js | 4 | `window["OnDXMapCreated"]=` |
| app/navi_app/utils/locationInActivity.js | 159 | `window.extrusion =` |
| app/navi_app/utils/locationInActivity.js | 191 | `window.main =` |
| app/navi_app/utils/locationInActivityInAR.js | 4 | `window["OnDXMapCreated"]=` |
| app/navi_app/utils/locationInActivityInAR.js | 170 | `window.extrusion =` |
| app/navi_app/utils/locationInActivityInAR.js | 194 | `window.startARNavi =` |
| app/navi_app/utils/locationInActivityInAR.js | 202 | `window.main =` |
| app/navi_app/utils/sign_B000A11DQE.js | 6 | `window["OnDXMapCreated"] =` |
| app/navi_app/utils/sign_B000A11DQE.js | 183 | `window.main =` |
| app/navi_app/utils/sign.js | 5 | `window["OnDXMapCreated"]=` |
| app/navi_app/utils/sign.js | 6 | `window["OnDXMapCreated"]=` |
| app/navi_app/utils/sign.js | 170 | `window.extrusion =` |
| app/navi_app/utils/sign.js | 267 | `window.main =` |
| jsbridge/android.back/cordova.js | 131 | `window.addEventListener =` |
| jsbridge/android.back/cordova.js | 150 | `window.removeEventListener =` |
| jsbridge/android.back/cordova.js | 1238 | `window.navigator =` |
| jsbridge/android.back/cordova.js | 1242 | `window.console =` |
| jsbridge/android.back/cordova.js | 1365 | `window.navigator =` |
| jsbridge/android.back/cordova.js | 1369 | `window.console =` |
| jsbridge/android.back/cordova.js | 1989 | `window.cordova =` |
| jsbridge/ios.back/cordova.js | 135 | `window.addEventListener =` |
| jsbridge/ios.back/cordova.js | 154 | `window.removeEventListener =` |
| jsbridge/ios.back/cordova.js | 1157 | `window.navigator =` |
| jsbridge/ios.back/cordova.js | 1161 | `window.console =` |
| jsbridge/ios.back/cordova.js | 1286 | `window.navigator =` |
| jsbridge/ios.back/cordova.js | 1290 | `window.console =` |
| jsbridge/ios.back/cordova.js | 2427 | `window.cordova =` |
| map_sdk/location/wx.loc.js | 16878 | `window["DXWXLocEvent"] =` |
| map_sdk/location/wx.loc.js | 17006 | `window.onunload =` |
| map_sdk/location/wx.loc.js | 21068 | `window["stepCount"] =` |
| map_sdk/location/wx.loc.js | 21069 | `window["stepLength"] =` |
| map_sdk/location/wx.loc.js | 22765 | `window.onunload =` |
| map_sdk/location/wx.loc.js | 22999 | `window.onunload =` |
| map_sdk/location/wx.loc.js | 23321 | `window.lastHashCount =` |
| map_sdk/location/wx.loc.js | 23327 | `window["indoorLocalAlgorithms"] =` |
| map_sdk/location/wx.loc.js | 23531 | `window["hashchange"] =` |
| map_sdk/location/wx.loc.js | 23612 | `window["locWebSocketPostMessage"] =` |
| map_sdk/location/wx.loc.js | 23616 | `window["locWebSocketPostMessage"] =` |
| map_sdk/location/wx.loc.js | 25938 | `window["indoorLocalAlgorithms"] =` |
| map_sdk/location/wx.loc.js | 25955 | `window["indoorLocalAlgorithms"] =` |
| map_sdk/location/wx.loc.js | 26227 | `window["wxclean"] =` |
| map_sdk/location/wx.loc.js | 26230 | `window["onBleUpdate"] =` |
| map_sdk/location/wx.loc.js | 26233 | `window["onStepUpdate"] =` |
| map_sdk/location/wx.loc.js | 26236 | `window["onGPSUpdate"] =` |
| map_sdk/location/wx.loc.js | 26239 | `window["onAOAUpdate"] =` |
| map_sdk/location/wx.loc.js | 26242 | `window["onOrientationUpdate"] =` |
| map_sdk/location/wx.loc.js | 26245 | `window["changeBuilding"] =` |
| map_sdk/location/wx.loc.js | 26251 | `window["WXLocationEntity"] =` |
| map_sdk/map/daximap.api.js | 7 | `window.daxiMapSDKProjPath =` |
| map_sdk/map/daximap.api.js | 8 | `window.langData =` |
| map_sdk/map/daximap.api.js | 1519 | `window.DXrequestAnimationFrame =` |
| map_sdk/map/daximap.api.js | 1530 | `window.DXcancelAnimationFrame =` |
| map_sdk/map/daximap.downloader.js | 389 | `window["currentEnv"] =` |
| map_sdk/map/daximap.location.js | 735 | `window["postLocationResult"] =` |
| map_sdk/map/daximap.scene.js | 8949 | `window["imageBase64"] =` |
| map_sdk/map/daximap.scene.js | 9391 | `window["mapsdkPath"] =` |
| map_sdk/map/daximap.speak.js | 414 | `window['cordova'] =` |
| map_sdk/map/daximap.utils.js | 3923 | `window.DXDomUtil =` |
| map_sdk/map/scene/daximap.indoor.js | 301 | `window.disableLegacyPoiJsonRequest =` |
| map_sdk/map/sdk/engine.api.debug.js | 1200 | `window["requireJsFunc"]  =` |
| map_sdk/map/sdk/engine.api.debug.js | 1217 | `window.onload =` |
| map_sdk/map/sdk/engine.api.js | 1196 | `window["onMapCreateReady"] =` |
| map_sdk/map/sdk/engine.min.js | 378 | `window.URL=` |
| map_sdk/map/sdk/engine.min.js | 1247 | `window.renderFrame=` |
| map_sdk/map/sdk/engine.min.js | 1247 | `window.stopRenderFrame=` |
| map-ui-container/assets/js/app-config.js | 95 | `window.appConfig =` |
| map-ui-container/assets/js/page-switcher.js | 6 | `window.pageSwitcher =` |
| map-ui-container/assets/js/page-switcher.js | 253 | `window.switchToPage =` |
| map-ui-container/assets/js/page-switcher.js | 261 | `window.getCurrentPage =` |
| map-ui-container/assets/js/socketUtils.js | 188 | `window.openPoiToH5 =` |
| map-ui-container/assets/js/socketUtils.js | 189 | `window.openExhibitToH5 =` |
| map-ui-container/assets/js/socketUtils.js | 190 | `window.openRouteToH5 =` |
| map-ui-container/assets/js/socketUtils.js | 191 | `window.navigateToUni =` |
| map-ui-container/assets/js/tabbar.js | 224 | `window.tabbarUtils =` |
| map-ui-container/assets/js/utils.js | 319 | `window.commonUtils =` |
| map-ui-container/lib/uni.webview.1.5.6.js | 1 | `window.UniAppJSBridge=` |
