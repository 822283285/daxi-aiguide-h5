(function (global) {
    var daxiapp = global["DaxiApp"] = global["DaxiApp"] || {};
    var daxiapp = global["DaxiApp"] = global["DaxiApp"] || {};
    var ua = navigator.userAgent
    var isWX = ua.toLowerCase().indexOf('micromessenger') !== -1;
    var isAli = /AliApp/.test(ua);
    var isMiniProgram = /MiniProgram/.test(ua);
    daxiapp["deviceType"] = {
        "isMobile": /Android|Harmony|webOS|iPhone|iPod|BlackBerry/i.test(ua),
        "isIos": /iPhone|iPad|iPod/i.test(ua),
        "isAndroid": (ua && ua.toLowerCase().indexOf('android') > 0),
        "isWeiXin": ua.toLowerCase().indexOf('micromessenger') !== -1, //微信公众号
        "isWX": isWX,
        "isWXMiniProgram": isWX && isMiniProgram,
        "isAli": isAli,
        "isAliMiniProgram": isAli && isMiniProgram
        // 高德小程序多一个 AMapClient 支付宝 多一个 AlipayClient
    };
    daxiapp["checkEnv"] = function (callback,loadFileList) {
        var sendHttpRequest = function (url, scb, fcb) {
            var s = {
                "url": url,
                "data":{"targetURL":location.href.split("#")[0]},
                "async": !0,
                "method": "get",
                "beforeSend": function (t, e) {
                    // e.url.indexOf("?") > -1 ? e.url += "&targetURL=" + e.url:'';
                    // e.url += "&" + location.search.slice(1).split("#")[0]+"&bdid="+window["launcher"]["init"]()["bdid"];
                    // // e.url += "&bdid=" + bdid;
                },
                "success": function (t) {
                    if ("string" == typeof t) {
                        t = JSON.parse(t);
                    }
                    scb && scb(t);
                },
                "error": function (t) {
                    fcb && fcb(t);
                }
            };
            $["ajax"](s);
        };

        var loadScript = function (url, callback) {
            var script = document.createElement("script");
            script.type = "text/javascript";
            if (script.readyState) { //IE
                script.onreadystatechange = function () {
                    if (script.readyState == "loaded" ||
                        script.readyState == "complete") {
                        script.onreadystatechange = null;
                        callback();
                    }
                };
            } else { //Others: Firefox, Safari, Chrome, and Opera
                script.onload = function () {
                    callback();
                };
                script.onerror = function (e) {
                    console.log(e);
                };
            }
            script.src = url;
            document.body.appendChild(script);
        };
        var cssRegExp = new RegExp("\\.css");

        function loadCss(url) {
            var _mlink = document.createElement("link");
            _mlink.setAttribute("type", "text/css");
            _mlink.setAttribute("rel", "stylesheet");
            _mlink.setAttribute("href", url);
            document.getElementsByTagName("head")[0].appendChild(_mlink);
        };

        function loadScriptRecursive(fileList, i, cb) {
            if (i >= fileList.length) {
                cb && cb();
                return;
            }
            if (cssRegExp.test(fileList[i])) {
                loadCss(fileList[i]);
                loadScriptRecursive(fileList, i + 1, cb);
            } else {
                loadScript(fileList[i], function () {
                    loadScriptRecursive(fileList, i + 1, cb);
                })

            }

        }

        function getUrlParams(queryStr) {
            var result = {};
            var _queryStr = queryStr || location.search;
            if (_queryStr.indexOf("?") != -1) {
                _queryStr = _queryStr.slice(_queryStr.indexOf("?") + 1);
            }
            var arr = _queryStr.split("&");
            for (var i = 0, len = arr.length; i < len; i++) {
                var keyVal = arr[i].split("=");
                if (keyVal[0]) {
                    result[keyVal[0]] = keyVal[1];
                }
            }
            return result;
        }

        function onSignatureFailed(t) {
            console.log("error");
        };

        function onSignatureSuccess(t) {
            window["audioToken"] = t["audioToken"];
            window["version"] = t["version"] || (~~Math.random(100));
            window["wx"]["config"]({
                "debug": false, //开启调试模式,调用的所有 api 的返回值会在客户端 alert 出来，若要查看传入的参数，可以在 pc 端打开，参数信息会通过 log 打出，仅在 pc 端时才会打印。
                "appId": t["appid"],// 必填，公众号的唯一标识
                "timestamp": parseInt(t["timestamp"]),// 必填，生成签名的时间戳
                "nonceStr": t["noncestr"],// 必填，生成签名的随机串
                "signature": t["signature"],// 必填，签名
                "jsApiList": t["checkList"], //必填，需要使用的 JS 接口列表
                "openTagList": ['wx-open-launch-weapp']
            });
            // 保持屏幕常亮
            // window["wx"]["setKeepScreenOn"]({"keepScreenOn": true});
            window["wx"]["ready"](function () {
                // config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
                window["wx"]["error"](function (res) {
                    console.log("授权失败，错误代码:" + JSON.stringify(res));
                });
                // 需要检测的JS接口列表，所有JS接口列表见附录2,
                window["wx"]["hideMenuItems"]({
                    "menuList": ["menuItem:exposeArticle",
                        "menuItem:setFont",
                        "menuItem:refresh",
                        "menuItem:copyUrl",
                        "menuItem:favorite",
                        "menuItem:openWithBrowser",
                        "menuItem:originPage",
                        "menuItem:readMode",
                        "menuItem:openWithSafari",
                        "menuItem:share:appMessage",
                        "menuItem:share:timeline",
                        "menuItem:share:QZone",
                        "menuItem:share:qq",
                        "menuItem:share:brand"
                    ]
                });

            });
            if(loadFileList){
                loadScriptRecursive(t["fl"], 0, callback);
            }else{
                callback && callback(t);
            }

        }
        var urlParams = getUrlParams();
        var token = urlParams["token"] || "";
        var origin = window.location.origin;
        var defaultUrl = "https://map1a.daxicn.com/wxtest/signature"
        // if(origin.indexOf("https") != -1){
        //     defaultUrl = origin + "/wxtest/signature"
        // }
        var url = (window["signatureUrl"] || defaultUrl) + "?token="+token;
        if(urlParams && (urlParams["GZHAppId"] || urlParams["appId"])){
            url+="&appId="+(urlParams["GZHAppId"] || urlParams["appId"]);
        }
        // url += "&targetURL=" + encodeURIComponent(window.location.href.split("#")[0]);
        sendHttpRequest(url, onSignatureSuccess, onSignatureFailed);

    };
    daxiapp["checkWeixinEnv"] = function(callback){
        if (daxiapp["deviceType"]["isWeiXin"]) {
            daxiapp["checkEnv"](function (data) {
                callback && callback();
            }, false);
        } else {
            callback && callback();
        }
    }

})(window);
