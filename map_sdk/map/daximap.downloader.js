(function(global){
    var daximap = global["DaxiMap"] = global["DaxiMap"] || {};
    var DXMapUtils = daximap["DXMapUtils"];
    var DXUri = daximap["DXUri"];
    var HWDownloader = (function(){
        var HWDownloader = function(options){
            options = options || {};
            this._suffix = options["suffix"] || "";
            this._timeout = options["timeout"] || 6000;
        };

        var proto = HWDownloader.prototype;
        proto["getData"] = function(url, method, dataType, data, successCB, errorCB, func){

        };
        proto["getPackageData"] = function(url, dataType, data, successCB, errorCB, func) {
            return DXMapUtils.getData(url, data, dataType, successCB, errorCB, func);
        };
        // proto["getServiceData"] = function (url, method, dataType, data, successCB, errorCB, func) {
        //     if(!window["HWH5"]) return;
        //     var _headers = {
        //         'Content-Type': 'application/json',
        //         'X-MAG-ID':'com.huawei.livespace'
        //     };
        //     if(url.indexOf("X-MAG-ID") == -1){
        //         if(url.indexOf("?") == -1){
        //             url += "?X-MAG-ID=com.huawei.livespace"
        //         }else{
        //             url += "&X-MAG-ID=com.huawei.livespace"
        //         }
        //     }
        //     if(data && Object.keys(data).length){
        //         for(var key in data){
        //             if(url.indexOf(key) == -1){
        //                 if(url.indexOf("?") == -1){
        //                     url += "?" + key + "=" + data[key]
        //                 }else{
        //                     url += "&" + key + "=" + data[key]
        //                 }
        //             }
        //         }
        //     }

        //     window["HWH5"]["fetch"](url, { "method": method, "headers": _headers, "timeout": this._timeout})["then"](function(res) {
        //         res["json"]()["then"](function (reply) {
        //             successCB && successCB(reply)
        //             console.log("getServiceData "+ url + " response:" + JSON.stringify(reply));
        //         });
        //     })["catch"](function (error) {
        //         errorCB && errorCB(error)
        //     });
        // };
        proto["getServiceData"] = function (url, method, dataType, data, successCB, errorCB, func) {
            if(window["HWH5"]){
                return this.getDataByHWH5(url, method, dataType, data, successCB, errorCB, func)
            }else{
                DXMapUtils.getDataBySecurityRequest(url, method, data, successCB, errorCB, func);
            }
        }
        proto.getDataByHWH5 = function(url, method, dataType, data, successCB, errorCB, func){
            console.log("daximaputils-getDataByHWH5:" + url);
            var _headers = {
                'Content-Type': 'application/json'
            };
            var requestData = { "method": method || "get", "headers": _headers, "timeout": 6000};
            if(method.toLocaleLowerCase() == "post"){
                _headers["X-MAG-ID"] = 'com.huawei.livespace';
                _headers["call-type"] = 'Sync'
                requestData["body"] = JSON.stringify(data)

                // window["HWH5"]["fetch"](url, { "method": 'post', "headers": _headers, "timeout": 6000, "body":JSON.stringify((data)) })["then"](function(res) {
                //     res["json"]()["then"](function (reply) {
                //         console.log("地图HWH5 "+ url + " response:" + JSON.stringify(reply));
                //         onSuccess && onSuccess(reply)
                //     });
                // })["catch"](function (error) {

                //     onFailed && onFailed(error)
                // });
                // return;
            }else{
                if(url.indexOf("X-MAG-ID") == -1){
                    if(url.indexOf("?") == -1){
                        url += "?X-MAG-ID=com.huawei.livespace"
                    }else{
                        url += "&X-MAG-ID=com.huawei.livespace"
                    }
                }
                if(data && Object.keys(data).length){
                    for(var key in data){
                        if(url.indexOf(key) == -1){
                            url += "&" + key + "=" + data[key]
                        }
                    }
                }
            }
            console.log("地图HWH5 url:" + url);
            var newUrl = url.replace(/%2F/g, '/');
            window["HWH5"] && window["HWH5"]["fetch"](newUrl,requestData)
                .then(function(res) {return res.json()})
                .then(function (reply) {
                    if(reply && reply.code == 200 && reply.result){
                        successCB && successCB(reply.result)
                    }else if(reply.code == 200 && reply.resultData){
                        successCB && successCB(reply.resultData)
                    }else if(reply){
                        successCB && successCB(reply)
                    }
                    console.log("地图HWH5 "+ newUrl + " response:" + JSON.stringify(reply));
                })
                .catch(function (error) {
                    errorCB && errorCB(error)
                });
          }
        proto.requestData = function(url, method, dataType, data, successCB, errorCB, func){
            return DXMapUtils.getDataBySecurityRequest(url, method, data, successCB, errorCB, func);
        };
        proto["requestData"] = proto.requestData;
        return HWDownloader;
    })();

    var DXPackageDownloader = (function(){
        var DXPackageDownloader = function(options){
            options = options || {};
            this._baseUrl = options["baseUrl"] || "";
            this._baseAuthUrl = options["baseAuthUrl"] || "";
            this._additionalQuery = options["additionalQuery"] || {};
            this._timeout = options["timeout"] || 6000;
            this._authToken = ""
        };


        function GetUrlParam(paraName) {
            var url = document.location.toString();
            var arrObj = url.split("?");

            if (arrObj.length > 1) {
                var arrPara = arrObj[1].split("&");
                var arr;

                for (var i = 0; i < arrPara.length; i++) {
                    arr = arrPara[i].split("=");

                    if (arr != null && arr[0] == paraName) {
                        return arr[1];
                    }
                }
                return "";
            }
            else {
                return "";
            }
        }

        function getMD5(str){
            var hash = md5(str);
            return hash;
        }

        function toPackagePath(str){
            var md5Str = getMD5(str);
            var md5StrPart1 = md5Str.substring(0, 8);
            var packagePath = md5StrPart1 + "/" + md5Str;
            return packagePath;
        }


        function getRelativePath(url, baseUrl){
            var uri = new DXUri(url);
            var relativePath = DXUri.relativeTo(uri.getLink(), baseUrl);

            // var relativePath = url;
            // var pos = relativePath.indexOf("?");
            // if(pos > -1){
            //     relativePath = relativePath.substring(0, pos);
            // }
            // pos = relativePath.indexOf(baseUrl);
            // if(pos > -1){
            //     relativePath = relativePath.substring(pos + baseUrl.length);
            // }
            return relativePath;
        }

        var proto = DXPackageDownloader.prototype;
        proto["reset"] = function(options){
            options = options || {};
            this._baseUrl = options["baseUrl"] || "";
            this._baseAuthUrl = options["baseAuthUrl"] || "";
            this._additionalQuery = options["additionalQuery"] || {};
            this._timeout = options["timeout"] || 6000;
            this._authToken = ""
        };
    
        proto["getData"] = function(url, method, dataType, data, successCB, errorCB){

        };
        proto["getPackageData"] = function(url, dataType, data, successCB, errorCB) {
            this["requestPackageData"](url, "GET", dataType, data, successCB, errorCB)
        };
        proto["getAuthPackageData"] = function(url, dataType, data, successCB, errorCB) {
            this["requestAuthPackageData"](url, "GET", dataType, data, successCB, errorCB)
        };
        proto["requestAuthPackageData"] = function(url, method, dataType, data, successCB, errorCB) {
            var headers = {
                "Content-Type":"application/json",
                "miniapprole":"admin",
                "miniapprouter":"linkspace",
                "roma-app-token":"123",
                "X-HW-TOKEN":this._authToken
            };
            var realUrl = this["encodeAuthPackageUrl"](url, data);
            /*if(!this._authToken){
                var thisObject = this;
                this.getToken(function (token){
                    headers["X-HW-TOKEN"] = token;
                    thisObject._authToken = token;
                    DXMapUtils.requestAuthData(realUrl, method,  dataType,headers, data, successCB, errorCB );
                })
            }else{
                DXMapUtils.requestAuthData(realUrl, method,  dataType,headers, data, successCB, errorCB );
            }*/
            //if(window["HWH5"] && window["HWH5"]["fetchFull"]){

            //if(window["HWH5"] && window["HWH5"]["fetchFull"]){
            if(false){
                DXMapUtils.fetchFull(realUrl, this._additionalQuery, method,  dataType, data, successCB, errorCB );
            }else{
                DXMapUtils.requestData(realUrl, method,  dataType, data, successCB, errorCB );
            }


        };
        proto["requestPackageData"] = function(url, method, dataType, data, successCB, errorCB) {
            var realUrl = this["encodePackageUrl"](url, data);
            //DXMapUtils.requestData(realUrl, method,  dataType, data, successCB, errorCB );
            if(window["HWH5"] && window["HWH5"]["fetchFull"]){
                DXMapUtils.fetchFull(realUrl, this._additionalQuery, method,  dataType, data, successCB, errorCB );
            }else{
                DXMapUtils.requestData(realUrl, method,  dataType, data, successCB, errorCB );
            }

        };

        proto["requestServiceData"] = function(url, method, dataType, data, successCB, errorCB) {
            // if(data && Object.keys(data).length){
            //     for(var key in data){
            //         if(url.indexOf(key) == -1){
            //             if(url.indexOf("?") == -1){
            //                 url += "?" + key + "=" + data[key]
            //             }else{
            //                 url += "&" + key + "=" + data[key]
            //             }
            //
            //         }
            //     }
            // }
            DXMapUtils.getData(url, data, dataType, successCB, errorCB);
        };

        proto["encodePackageUrl"] = function(url, data){
            console.log("encodePackageUrl:" + url);
            var uri = new DXUri(url);
            var relativePath = DXUri.relativeTo(uri.getLink(), this._baseUrl);
            uri.setLink(this._baseUrl + toPackagePath(relativePath));
            if(data){
                uri.mergeQuery(data);
            }
            uri.mergeQuery(this._additionalQuery);
            var url = uri.toString();
            console.log("encodePackageUrl2:" + url);
            return url;
        }
        proto["encodeAuthPackageUrl"] = function(url, data){
            console.log("encodePackageUrl:" + url);
            var uri = new DXUri(url);
            var relativePath = DXUri.relativeTo(uri.getLink(), this._baseAuthUrl);
            uri.setLink(this._baseAuthUrl + toPackagePath(relativePath));
            if(data){
                uri.mergeQuery(data);
            }
            uri.mergeQuery(this._additionalQuery);
            var url = uri.toString();"]"
            console.log("encodePackageUrl2:" + url);
            return url;
        }
        proto["getServiceData"] = function (url, method, dataType, data, successCB, errorCB, func) {
            if(window["HWH5"]){
                return this.getDataByHWH5(url, method, dataType, data, successCB, errorCB, func)
            }else{
                DXMapUtils.getDataBySecurityRequest(url, method, data, successCB, errorCB, func);
            }
        }
        proto.getDataByHWH5 = function(url, method, dataType, data, successCB, errorCB, func){
            console.log("daximaputils-getDataByHWH5:" + url);
            var _headers = {
                'Content-Type': 'application/json'
            };
            var requestData = { "method": method || "get", "headers": _headers, "timeout": 6000};
            if(method.toLocaleLowerCase() == "post"){
                _headers["X-MAG-ID"] = 'com.huawei.livespace';
                _headers["call-type"] = 'Sync'
                requestData["body"] = JSON.stringify(data)

                // window["HWH5"]["fetch"](url, { "method": 'post', "headers": _headers, "timeout": 6000, "body":JSON.stringify((data)) })["then"](function(res) {
                //     res["json"]()["then"](function (reply) {
                //         console.log("地图HWH5 "+ url + " response:" + JSON.stringify(reply));
                //         onSuccess && onSuccess(reply)
                //     });
                // })["catch"](function (error) {

                //     onFailed && onFailed(error)
                // });
                // return;
            }else{
                if(url.indexOf("X-MAG-ID") == -1){
                    if(url.indexOf("?") == -1){
                        url += "?X-MAG-ID=com.huawei.livespace"
                    }else{
                        url += "&X-MAG-ID=com.huawei.livespace"
                    }
                }
                if(data && Object.keys(data).length){
                    for(var key in data){
                        if(url.indexOf(key) == -1){
                            url += "&" + key + "=" + data[key]
                        }
                    }
                }
            }
            console.log("地图HWH5 url:" + url);
            var newUrl = url.replace(/%2F/g, '/');
            window["HWH5"] && window["HWH5"]["fetch"](newUrl,requestData)
                .then(function(res) {return res.json()})
                .then(function (reply) {
                    if(reply && reply.code == 200 && reply.result){
                        successCB && successCB(reply.result)
                    }else if(reply.code == 200 && reply.resultData){
                        successCB && successCB(reply.resultData)
                    }else if(reply){
                        successCB && successCB(reply)
                    }
                    console.log("地图HWH5 "+ newUrl + " response:" + JSON.stringify(reply));
                })
                .catch(function (error) {
                    errorCB && errorCB(error)
                });
          }
        proto["postServiceData"] = function (url, method, dataType, data, successCB, errorCB, func) {
            if(window["HWH5"]){
                var _headers = {
                    'Content-Type': 'application/json',
                    'X-MAG-ID':'com.huawei.livespace'
                };

                // console.log("地图HWH5 url:" + url);
                window["HWH5"]["fetch"](url, { "method": method, "headers": _headers, "body":JSON.stringify(data), "timeout": this._timeout})["then"](function(res) {
                    res["json"]()["then"](function (reply) {
                        successCB && successCB(reply)
                        console.log("地图HWH5 "+ url + " response:" + JSON.stringify(reply));
                    });
                })["catch"](function (error) {
                    errorCB && errorCB(error)
                });
            }else{
                DXMapUtils.getData(url, data, dataType, successCB, errorCB);
            }
        };
        proto.requestData = function(url, method, dataType, data, successCB, errorCB, func){
            var uri = new DXUri(url);
            uri.mergeQuery(this._additionalQuery);
            var newUrl = uri.toString();
            return DXMapUtils.getDataBySecurityRequest(newUrl, method, data, successCB, errorCB, func);

        };
        proto.getToken = function (callback){
            var thisObject = this;
            var headers = {
                "Content-Type":"application/json",
                "miniapprole":"admin",
                "miniapprouter":"linkspace",
                "roma-app-token":"123"
            };
            var reqConfig = {
                method:"POST",
                headers:headers,
                timeout:thisObject._timeout,
            }
            if(window["HWH5"]){
                window["HWH5"].fetch("https://apigm" + (window["currentEnv"] == "uat" ? '-beta' : '') + ".huawei.com/api/linkspace/api/token/Oauth2?X-MAG-ID=com.huawei.livespace",reqConfig).then(function (res){
                    return res.json()
                }).then(function (response){
                    console.log("response:",response);
                    if(response.status == "0000"){
                        var data = JSON.parse(response.data);
                        var token = data.token_type + " " + data.access_token;
                        setTimeout(function (){
                            thisObject._authToken = ""
                        },data.expire_in * 100)
                        thisObject._authToken = token;
                        callback && callback(token)
                    }
                })
            }else{
                callback && callback("123456")
            }

        }
        proto["requestData"] = proto.requestData;
        return DXPackageDownloader;
    })();


    daximap["HWDownloader"] = HWDownloader;
    daximap["DXPackageDownloader"] = DXPackageDownloader;

})(window)

