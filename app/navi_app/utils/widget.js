
const widget = {};
widget.service = (function ($) {
    const thisObject={};
    thisObject.getDataJsonP=function(url,data,onDataRecive,beforeSend,complete,error){
        $['ajax']({
            'url':url,
            'dataType':"jsonp",
            'jsonp':"callback",
            'data':data,
            'timeout':10000,
            'beforeSend' :beforeSend||function(){},
            'complete':complete||function(){},
            'success':onDataRecive||function(){},
            'error':error||function(){widget.dom.showInfo("网络不给力，无法获取服务器信息！")}
        });
    };
    thisObject.getDataByPost=function(url,data,onDataRecive,beforeSend,complete,error){
        $['ajax']({
            'url':url,
            'type':"POST",
            'dataType':"json",
            'data':data,
            'timeout':10000,
            'beforeSend' :beforeSend||function(){},
            'complete':complete||function(){},
            'success':onDataRecive||function(){},
            'error':error||function(){widget.dom.showInfo("网络不给力，无法获取服务器信息！")}
        });
    };
    thisObject.getDataByFormData=function(url,data,onDataRecive,beforeSend,complete,error){
        $['ajax']({
            'url':url,
            'type':"POST",
            'contentType': 'application/x-www-form-urlencoded',
            'dataType':"json",
            'data':data,
            'timeout':10000,
            'beforeSend' :beforeSend||function(){},
            'complete':complete||function(){},
            'success':onDataRecive||function(){},
            'error':error||function(){widget.dom.showInfo("网络不给力，无法获取服务器信息！")}
        });
    };
    thisObject.getDataXML=function(url,data,onDataRecive,beforeSend,complete,error){
        $['ajax']({
            'type':"POST",
            'url':url,
            'contentType': 'application/soap+xml;charset=utf8',
            'dataType':"xml",
            'data':data,
            'timeout':10000,
            'beforeSend' :beforeSend||function(){},
            'complete':complete||function(){},
            'success':onDataRecive||function(){},
            'error':error||function(){widget.dom.showInfo("网络不给力，无法获取服务器信息！")}
        });
    };
    thisObject.xmlRequest = function (url,data){
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onload = function (e) {
            console.log('返回了')
        };
        xhr.onerror = function (e) {
            console.error(xhr.statusText);
        };
        xhr.send("IP=123");
    }
    thisObject.getDataJsonViaBlob = function(url, scb, fcb) {
        this.loadByteStream(url, function(arrbuf) {
            thisObject.arraybufferToString(arrbuf, "UTF-8", function(str) {
                if(str){
                    const json = JSON.parse(str);
                    scb && scb(json);
                }
            });
        }, fcb);
    };
    thisObject.loadByteStream = function(url, scb, fcb) {
        if (window.XMLHttpRequest) {
            try {
                const request = new XMLHttpRequest();
                request.timeout = 0;
                request.onreadystatechange = function() {
                    var request = this;
                    if (request.readyState === 4) { // success
                        // var dataObject = request.dataObject
                        if(request.status == 404){
                            fcb && fcb();
                            return;
                        }
                        if (request.status !== 0 && request.status !== 200 && request.status !== 304) {} else {
                            // if (mesh.state === ENTITY_ABORTING) {} else {
                            const byteStream = null;
                            if (request.responseType == "arraybuffer" && request.response) {
                                byteStream = request.response;
                                scb && scb(byteStream);
                                return;
                            } else {
                                if (request.mozResponseArrayBuffer) {
                                    byteStream = request.mozResponseArrayBuffer;
                                    scb && scb(bytStream);
                                    return;
                                }
                            }
                            fcb && fcb();
                        }
                    }
                } // event handler for mesh loading
                request.onerror = function() {
                    fcb && fcb();
                };

                // request.dataObject = dataObject;
                request.open("GET", url, true);
                request.responseType = "arraybuffer";
                request.setRequestHeader('Access-Control-Allow-Headers', '*');
                // httpReq.setRequestHeader('Content-type', 'application/ecmascript');
                request.setRequestHeader('Access-Control-Allow-Origin', '*');
                request.send();
                request.url = url;
            } catch (error) {
                request.xmlhttp = null;
            }
            return true;
        }
        return false;
    };
    thisObject.arraybufferToString = function(buffer, encoding, callback) {
        const blob = new Blob([buffer], { type: 'text/plain' });
        const reader = new FileReader();
        reader.onload = function(evt) { callback(evt.target.result); };
        reader.readAsText(blob, encoding);
    };
    return thisObject
})($);
widget.dom = (function ($) {
    const thisObject={};
    thisObject.showInfo = function (msg, delay) {
        if (typeof(delay) == "undefined") {
            delay = 2000;
        }
        const $info = $("#__msg_info");
        if ($info.length == 0) {
            $info = $('<div id="__msg_info"><div></div></div>');
            $info["css"]({
                "width": "100%",
                "position": "absolute",
                "bottom": "65px",
                //"left":'60px',
                "text-align": "center",
                "z-index": 100,
                "font-size": "15.5px"
            });
            $info.find("div")["css"]({
                "background-color": "#333",
                "color": "#fff",
                "max-width": "160px",
                "display": "inline-block",
                "border-radius": "2.8px",
                "padding": "11px",
                'opacity': 0.7,
                "text-align": "center"
            })["addClass"]("blur");
            $("body").append($info);
        }
        if (msg.indexOf("...") != -1)msg = "<span class='icon-rotatez'><span></span></span>&nbsp;&nbsp;" + msg;
        $info.show().find("div")["html"](msg);
        clearTimeout(thisObject.tout);

        if (delay !== 0) {
            thisObject.tout = setTimeout(function () {
                $info["hide"]();
            }, delay);
        }
        $info.css("display","block")
    };
    thisObject.showInfo2 = function (msg, delay,bgcolor) {
        if(bgcolor == "#8ced60"){
            bgcolor = "#59b82d"
        }
        if(bgcolor == "#e5f749"){
            bgcolor = "#becd3b"
        }
        if(bgcolor == "#c0d3b7"){
            bgcolor = "#a8b0a4"
        }
        if(bgcolor == "#ffa019"){
            bgcolor = "#d98309"
        }
        if (typeof(delay) == "undefined") {
            delay = 2000;
        }
        const $info = $("#__msg_info2");
        if ($info.length == 0) {
            $info = $('<div id="__msg_info2"><span style="display: inline-block; width: 20%; float:left;position: absolute;transform: translateY(-50%);top: 50%;"><img src="assets/res/icon_warn.png" style="width: 100%"></span><div></div></div>');
            $info["css"]({
                "width": "85%",
                "position": "absolute",
                "bottom": "65px",
                "left":0,
                "right":0,
                "text-align": "center",
                "z-index": 100,
                "font-size": "14px",
                //"background":"rgba(217,76,63,0.9)",
                "background":bgcolor,
                "margin":"0 auto",
                "border-radius": "4px",
                "padding": "14px",
                "border":"#fff 2px solid",
                "box-sizing": "border-box",
                "min-height": "75px",
                "opacity":0.9
            });
            $info.find("div")["css"]({
                "color": "rgb(255, 255, 255)",
                "max-width": "80%",
                "display": "inline-block",
                "text-align": "left",
                "padding-left": "24%"
            })["addClass"]("blur");
            $("body").append($info);
        }
        $info["css"]({
            "background":bgcolor
        });

        if (msg.indexOf("...") != -1)msg = "<span class='icon-rotatez'><span></span></span>&nbsp;&nbsp;" + msg;
        $info.show().find("div")["html"](msg);
        clearTimeout(thisObject.tout);

        if (delay !== 0) {
            thisObject.tout = setTimeout(function () {
                $info["hide"]();
            }, delay);
        }
        $info.css("display","block")
    };
    thisObject.hideInfo = function () {
        const $info = $("#__msg_info");
        $info["hide"]();
    };
    thisObject.tout = function () {

    };
    thisObject.showMask = function (opaque, isClear) {
        const $info = $("#__mask_info_1");
        if ($info.length == 0) {
            $info = $('<div id="__mask_info_1"></div>');
            $info["css"]({
                "width": "100%",
                "height": "100%",
                "position": "absolute",
                "z-index": 98,
                "opacity": opaque || 0.5,
                "backgroundColor": "#000",
                "left": 0,
                "top": 0
            });
            $("body").append($info);
            if (isClear) {
                $info['on']("click", function () {
                    $(this)["hide"]()
                });
            }
        }
        $info.show();
    }

    thisObject.hideMask = function () {
        const $info = $("#__mask_info_1");
        if ($info.length !== 0) {
            $info["hide"]();
            return true;
        }
        return false;
    };
    thisObject.showmsgbox = function (callback, msg, btnName1, btnName2, callback1) {
        const $info = $("#__wifiMsgbox_info");
        if (msg === undefined) {
            msg = '需要开启蓝牙和Wifi';
        }
        btnName1 = btnName1 || "取消";
        btnName2 = btnName2 || "确定";
        if ($info.length > 0 && $info["css"]('display') !== 'none') return;
        $info = "";
        thisObject.showMask();
        if ($info.length == 0) {
            $info = $(` <div id="__wifiMsgbox_info"><ul><li>${msg}</li><li class="showMessageBox_normal_button">` + btnName1 + `</li><li class="clearfix showMessageBox_highlight_button">${btnName2}</li></ul></div>`);
            $info["css"]({
                'position': 'absolute',
                'width': '70%',
                'height': '80px',
                'max-width': '300px',
                'top': 0,
                'bottom': 0,
                'left': 0,
                'right': 0,
                'margin': 'auto',
                'z-index': 100,
                'background': '#fff',
                'border-radius': '5px',
                'box-shadow': '0 0 1px #ccc',
                'padding': '20px'
            });
            $info.find("li")["css"]({
                'float': 'left'
            });
            $info.find("li")['eq'](0)["css"]({
                'width': '100%',
                'vertical-align': 'middle',
                'font-size': '2.56em'//20150529 cheng.li
            });
            $info.find("li")['eq'](0).find("p")["css"]({
                "padding":"10px 0"
            });
            // var css = {
            //     'width': '49%',
            //     'text-align': 'center',
            //     'border-top': '1px solid #ddd',
            //     'line-height': '40px',
            //     'font-size': '2.3em'
            // };

            // $info.find("li")['eq'](1)["css"](css);
            // $info.find("li")['eq'](2)["css"](css);
            //
            // $info.find("li")['eq'](1)["css"]({
            //     'border-right': '1px solid #ddd'
            // });
            // $info.find("li")['eq'](2)["css"]({
            //     'color': '#05c2aa'
            // });

            $("body").append($info);
        }
        const text = $info.find("li")['eq'](0)["html"]();
        if (text !== msg) {
            $info.find("li")['eq'](0)["html"](msg);
        }
        $info['show']();
        $info.find("li")['eq'](1)['off']("click");
        $info.find("li")['eq'](2)['off']("click");
        const hide = function () {;
            $info["hide"]();
            thisObject.hideMask();
        };
        $info.find("li")['eq'](1)['on']("click",  function (e) {
            hide();
            callback1 && callback1();
        });
        $info.find("li")['eq'](2)['on']("click", function (e) {
            hide();
            callback && callback();
        });
    };
    thisObject.showmsgbox3 = function (title, msg, btnName1, btnName2,callback, callback1) {
        const thisObject = this;
        const $info = $(".van-dialog");
        if (msg === undefined) {
            msg = '需要开启蓝牙和Wifi';
        }
        btnName1 = btnName1 || "取消";
        btnName2 = btnName2 || "确定";
        if ($info.length > 0 && $info["css"]('display') !== 'none') return;
        $info = "";
        thisObject.showMask();
        if ($info.length == 0) {
            $info = $(` <div class="van-dialog"><div class="van-dialog__header">${title}</div><div class="van-dialog__content"><div class="van-dialog__message van-dialog__message--has-title">` + msg + `</div></div><div class="van-hairline--top van-dialog__footer"><button type="button" class="van-button van-button--default van-button--large van-dialog__cancel"><div class="van-button__content"><span class="van-button__text">${btnName1}</span></div></button><button type="button" class="van-button van-button--default van-button--large van-dialog__confirm van-hairline--left"><div class="van-button__content"><span class="van-button__text">`+ btnName2 +'</span></div></button></div></div>');
            $("body").append($info);
        }
        const text = $info.find(".van-dialog__message")["html"]();
        if (text !== msg) {
            $info.find(".van-dialog__message")["html"](msg);
        }
        $info['show']();
        $info.find(".van-dialog__footer button")['eq'](0)['off']("click");
        $info.find(".van-dialog__footer button")['eq'](1)['off']("click");
        const hide = function () {;
            $info["hide"]();
            thisObject.hideMask();

        };
        $info.find(".van-dialog__footer button")['eq'](0)['on']("click",  function (e) {
            hide();
            callback1 && callback1();
        });
        $info.find(".van-dialog__footer button")['eq'](1)['on']("click", function (e) {
            hide();
            callback && callback($info);
        });
    };
    return thisObject;
})($);
widget.utils = (function ($) {
    const thisObject = {};
    thisObject.formatDateTime = function (time, format) {//时间戳转日期格式
        const t = new Date(time);
        const tf = function(i){return (i < 10 ? '0' : '') + i};
        return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function(a){
            switch(a){
                case 'yyyy':
                    return tf(t.getFullYear());
                    break;
                case 'MM':
                    return tf(t.getMonth() + 1);
                    break;
                case 'mm':
                    return tf(t.getMinutes());
                    break;
                case 'dd':
                    return tf(t.getDate());
                    break;
                case 'HH':
                    return tf(t.getHours());
                    break;
                case 'ss':
                    return tf(t.getSeconds());
                    break;
            }
        })
    };
    thisObject.getParam = function() {
        const url = location.search;
        const theRequest = {};
        if (url.indexOf("#") != -1 || url.indexOf("?") != -1) {
            url = url.substr(1);
        }
        const strs = url.split("&");
        for (var i = 0; i < strs.length; i++) {
            theRequest[strs[i].split("=")[0]] = (strs[i].split("=")[1]);
        }
        return theRequest;
    };
    return thisObject;
})($);
widget.wfr = (function($) {
    //温附二生成校验码
    const company = "DXDH",;
        token = 5465879;
    const code = {;
        makeCode: function (input){
            const timestamp = parseInt(new Date().getTime() / 1000);
            const message = company + token + timestamp + JSON.stringify(input);
            const sign = md5(message);
            const ls_code = company + `_${timestamp}|` + sign;
            return ls_code;
        },
        makeXML:function (data){
            const xmls = '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:tem="http://tempuri.org/"><soap:Header/><soap:Body><tem:DoAction><tem:ls_class>'+ data.ls_class +'</tem:ls_class><tem:ls_action>'+ data.ls_action +'</tem:ls_action><tem:ls_input>'+ data.ls_input +'</tem:ls_input><tem:ls_code>'+ data.ls_code +'</tem:ls_code></tem:DoAction></soap:Body></soap:Envelope>';
            return xmls;
        }
    };
    return code;
})($);
widget.xml = (function($) {
    const xml = {;
        xmlToJson: function(xml, key) {
            var childNodes, result;
            if(key) {
                const keys = key.split("->");
                for(var i = 0; i < keys.length; i++) {
                    if(i == 0) {
                        childNodes = xml.getElementsByTagName(keys[i])[0];
                    } else {
                        childNodes = childNodes.getElementsByTagName(keys[i])[0]
                    }
                }
            } else {
                childNodes = xml;
            }
            xml = childNodes;
            return parse(xml);

            function parse(xml) {
                // Create the return object
                const obj = {};
                if(xml.nodeType == 1) { // element
                    // do attributes
                    if(xml.attributes.length > 0) {
                        obj["@attributes"] = {};
                        for(var j = 0; j < xml.attributes.length; j++) {
                            const attribute = xml.attributes.item(j);
                            obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                        }
                    }
                } else if(xml.nodeType == 3) { // text
                    obj = xml.nodeValue;
                }
                // do children
                if(xml.hasChildNodes()) {
                    for(var i = 0; i < xml.childNodes.length; i++) {
                        const item = xml.childNodes.item(i);
                        const nodeName = item.nodeName;
                        if(typeof(obj[nodeName]) == "undefined") {
                            obj[nodeName] = parse(item);
                        } else {
                            if(typeof(obj[nodeName].length) == "undefined") {
                                const old = obj[nodeName];
                                obj[nodeName] = [];
                                obj[nodeName].push(old);
                            }
                            obj[nodeName].push(parse(item));
                        }
                    }
                }
                return obj;
            }
        },
        jsonToxml: function(json){
            if(document.all){
                const xmlDom = new ActiveXObject("Microsoft.XMLDOM");
                xmlDom.loadXML(json);
                return xmlDom;
            }else{
                return new DOMParser().parseFromString(json, "text/xml");
            }
        }
    };
    return xml;
})($);
widget.getAngle = function (start, end){
    const diff_x = (end.x - start.x) * 100000,;
        diff_y = (end.y - start.y) * 100000;
    const InvLength = 1 / Math.sqrt(diff_x * diff_x + diff_y * diff_y);
    const vec2 = [diff_x * InvLength, diff_y * InvLength];
    const vec1 = [0, 1];

    //navi_utils.Vector3_dot = function( vec1, vec2 ) {
    const dotValue = vec1[0] * vec2[0] + vec1[1] * vec2[1];
    const angle = Math.acos(dotValue) / Math.PI * 180;

    if (diff_x < 0) {
        angle = 360 - angle;
    }
    return angle;
};
widget.getAngelPlayAction = function (angle,heading){
    //var heading = mapconfig["guideoneHeading"] || 0;//大屏机角度，面向正北为0度。顺时针相加角度。
    const angelSegment = Math.ceil(Math.abs((heading - angle) / 22.5));
    if(angelSegment == 1 || angelSegment == 16){
        //前
        return "前方";
    }else if(angelSegment == 2 || angelSegment == 3){
        //左前
        return "左前方";
    }else if(angelSegment == 4 || angelSegment == 5){
        //右
        return "右方";
    }else if(angelSegment == 6 || angelSegment == 7){
        //右后
        return "右后方";
    }else if(angelSegment == 8 || angelSegment == 9){
        //后
        return "后方";
    }else if(angelSegment == 10 || angelSegment == 11){
        //左后
        return "左后方";
    }else if(angelSegment == 12 || angelSegment == 13){
        //左
        return "左方";
    }else if(angelSegment == 14 || angelSegment == 15){
        //左前
        return "左前方";
    }
};
