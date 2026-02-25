(function(){return {
    checkEnv:function(callback){
        var sendHttpRequest = function (url, scb, fcb) {
            var s = {
                "url": url,
                "async": !0,
                "method": "get",
                "beforeSend": function (t, e) {
                    // e.url.indexOf("?") > -1 ? e.url += "&sign=" + Math.random() : e.url += "?sign=" + Math.random();
                    // e.url += "&" + location.search.slice(1).split("#")[0]+"&bdid="+window["launcher"]["init"]()["bdid"];
                    // // e.url += "&bdid=" + bdid;
                },
                "success":function(t){
                    if ("string" == typeof t) {
                        t = JSON.parse(t);
                    }
                    scb&&scb(t);
                },
                "error":function(t){
                    fcb&&fcb(t);
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

        function loadScriptRecursive(fileList, i, cb){
            if(i >= fileList.length){
                cb&&cb();
                return;
            }
            loadScript(fileList[i], function(){
                loadScriptRecursive(fileList, i+1, cb);
            })
        }
        function getUrlParams(queryStr){
            var result = {};
            var _queryStr = queryStr || location.search;
            if(_queryStr.indexOf("?")!=-1){
                _queryStr = _queryStr.slice(_queryStr.indexOf("?")+1);
            }
            var arr = _queryStr.split("&");
            for(var i = 0,len=arr.length;i<len;i++){
                var keyVal = arr[i].split("=");
                if(keyVal[0]){
                    result[keyVal[0]] = keyVal[1];
                }
            }
            return result;
        }

        function onSignatureFailed(t){
            console.log("error");
        };

        function onSignatureSuccess(t) {
            window["audioToken"]=t["audioToken"];
            window["version"] = t["version"]|| (~~Math.random(100));
            window["wx"]["config"]({"debug": false,"appId": t["appid"],"timestamp": parseInt(t["timestamp"]),"nonceStr": t["noncestr"],"signature": t["signature"],"jsApiList": t["checkList"],"openTagList": ['wx-open-launch-weapp',]});
            window["wx"]["ready"](function () {
                window["wx"]["error"](function (res) {console.log("授权失败，错误代码:" + JSON.stringify(res));});
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

        }
        var url = "https://map1a.daxicn.com/wx3dmap/signature";//
        sendHttpRequest(url, onSignatureSuccess, onSignatureFailed);
    },
}
})().checkEnv(function(t){

});
