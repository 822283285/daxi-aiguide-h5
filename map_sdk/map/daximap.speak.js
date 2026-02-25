(function(global){
    var daximap = global["DaxiMap"] = global["DaxiMap"] || {};
    var browser = daximap.browser;
    var NativeSpeakSynthesizer = function() {
        this.params = {};
    };
    NativeSpeakSynthesizer.prototype.setCanSpeak = function(canSpeak){
        this.isCanSpeak = canSpeak;
    };
    NativeSpeakSynthesizer.prototype.init = function(params, success, error) {
        if (!params) params = {};
        cordova["exec"](success, error, "SpeakNative", "init", [params]);
    };
    NativeSpeakSynthesizer.prototype.speak = function(utterance) {
        var successCallback = function(event) {
            if (event["type"] === "end" && typeof utterance["onend"] === "function") {
                utterance["onend"](event);
            }
        };
        var errorCallback = function() {
            if (typeof utterance["onerror"] === "function") {
                utterance["onerror"]();
            }
        };
        cordova["exec"](successCallback, errorCallback, "SpeakNative", "speak", [utterance]);
    };
    NativeSpeakSynthesizer.prototype.cancel = function(success, error) {
        cordova["exec"](null, null, "SpeakNative", "cancel", []);
    };

    NativeSpeakSynthesizer.prototype.silence = function(b) {
        var thisObject = this;
        if (b == null) {
            thisObject.params.silence = true;
        } else {
            thisObject.params.silence = b;
        }
        var success = function(systemVolume) {
            if (systemVolume == 0) {
                params.systemVolume = params.systemVolume;
            } else {
                params.systemVolume = systemVolume
            }
            cordova["exec"](null, null, "SpeakNative", "silence", [thisObject.params]);
        };
        cordova["exec"](success, null, "SpeakNative", "getSystemVolume", [thisObject.params]);
    };
    NativeSpeakSynthesizer.prototype.setSystemVolume = function(volume) {
        cordova["exec"](null, null, "SpeakNative", "setSystemVolume", [volume]);
    };
    NativeSpeakSynthesizer.prototype.getSystemVolume = function(success) {
        cordova["exec"](success, null, "SpeakNative", "getSystemVolume", []);
    };
    NativeSpeakSynthesizer.prototype.preLoadStreamByText = function(text,success){
        cordova["exec"](success,function(err){console.log(err);},"SpeakNative","preLoadStreamByText",[text]);
    };

    //window speaker
    function WindowSpeakSynthesizer() {
        this.msg = null;
    };
    WindowSpeakSynthesizer.prototype.init = function(params, success, error) {
        if ('speechSynthesis' in window) {
            this.speakNative = speechSynthesis;
            this.msg = new SpeechSynthesisUtterance();
            this.msg.lang = "zh-CN";
            this.msg.volume = 1;
            this.msg.rate = 1;
            this.msg.pitch = 1;
            success && success({ "msg": "create success" });
        } else {
            error && error({ "msg": "create failed" });
        }

    };
    WindowSpeakSynthesizer.prototype.speak = function(utterance) {
        this.msg.onend = function() {
            if (typeof utterance["onend"] === "function") {
                utterance["onend"]();
            }
        };
        this.msg.text = utterance["text"];
        this.speakNative.speak(this.msg);

    };
    WindowSpeakSynthesizer.prototype.cancel = function(success, error) {
        this.speakNative.cancel();
    };

    WindowSpeakSynthesizer.prototype.silence = function(b) {
        //var thisObject = this;

    };
    WindowSpeakSynthesizer.prototype.setSystemVolume = function(volume) {

    };
    WindowSpeakSynthesizer.prototype.getSystemVolume = function(success) {

    };
    WindowSpeakSynthesizer.prototype.preLoadStreamByText = function(text,success){

    };

    function BaiduSpeakSynthesizer(Container, audioId, baiduAudioToken,speakServerUrl,canSpeak) {
        var thisObject = this;
        thisObject.name = "media";
        if(typeof Container == "string"){
            thisObject.parentDom = document.getElementById(Container[0]=="#"?Container.slice(1):Container);
        }else{
            thisObject.parentDom = Container;
        }
        

        thisObject.id = audioId || "speakSynthesizer";
        baiduAudioToken = window["audioToken"] || "24.7d02d3ead78832396e4bb3597150aa73.2592000.1628583954.282335-18320169";

        thisObject.baiduSpeakUrl = speakServerUrl||"https://map1a.daxicn.com/dxtts2?appid=5808a3ed&appkey=4b5e5314b43be366b7bb5600e27085ae&apiSecret=&src=msc&v=2&text=";//"https://tsn.baidu.com/text2audio?tok=" + baiduAudioToken + "&cuid=00:00:00:00:00:00&lan=zh&ctp=1&tex=";
        thisObject.audioDom = null;
        thisObject.streamMap = new Object();
        thisObject.nextReqAudioTime = new Date().getTime();
        var endedCallback = null;
        var durationchangeCallback = null;
        var timeupdateCallback = null;

        var prototype = BaiduSpeakSynthesizer.prototype;
        prototype.generateAudioDom = function(){
            thisObject.audioDom = document.createElement("audio");
            thisObject.audioDom["id"] = thisObject.id;
            thisObject.audioDom["type"] = "audio/mp3";
            thisObject.audioDom["name"] = thisObject.name;
            thisObject.audioDom["autoplay"] = true;
            thisObject.audioDom["controls"] = "controls";
            thisObject.audioDom["style"]["dispaly"] = "none";
            var sourceDom = document.createElement("source");
            sourceDom["src"] = "data:audio/x-mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQxLjEwMAAAAAAAAAAAAAAA//tUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAAGwABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWOjo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ox8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx/////////////////////////////////8AAAAATGF2YzU4Ljc1AAAAAAAAAAAAAAAAJASAAAAAAAAABsDsy3Va//uUZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uUZFGP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uUZFGP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uUZFGP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
            thisObject.audioDom["appendChild"](sourceDom);
            thisObject.parentDom.append(thisObject.audioDom);
        }
        prototype.init = function(param) {
            var thisObject = this;
            
            thisObject.audioDom = document.getElementById(thisObject.id) || document.getElementById("navi_audio");
            if (!thisObject.audioDom) {
                // thisObject.parentDom.append(thisObject.DomStr);
                thisObject.generateAudioDom();
                thisObject.audioDom = document.getElementById(thisObject.id);
            }
            thisObject.audioDom.style["display"] = "none";
            document.addEventListener("WeixinJSBridgeReady", function() {
                if (thisObject.audioDom) {
                    thisObject.audioDom.load();
                }
            }, false);
            thisObject.audioDom.addEventListener("ended", thisObject.onSpeakEnd);
            thisObject.audioDom.addEventListener("durationchange", thisObject.onDurationchange);
            thisObject.audioDom.addEventListener("timeupdate",thisObject.onTimeUpdate);
            return thisObject;
        };
        prototype.setCanSpeak = function(canSpeak){
            thisObject.isCanSpeak = canSpeak;
        };
        prototype.remove = function() {
            this.parentDom.remove(this.audioDom);
        };

        prototype.onSpeakEnd = function(callback) {
            endedCallback && endedCallback();
        };
        prototype.onDurationchange = function(e){
            durationchangeCallback && durationchangeCallback(e);
        };
        prototype.onTimeUpdate = function(e){
            timeupdateCallback && timeupdateCallback(e);
        };

        prototype.speak = function(utterance) {

            if (typeof utterance["onend"] === "function") {
                endedCallback = utterance["onend"];
            }
            var textKey = decodeURI(utterance["text"]||"");
            // 没有语音不调请求
            if(!thisObject.isCanSpeak){
                endedCallback && endedCallback(this.streamMap[textKey] && this.streamMap[textKey]);
                return;
            }
            if(utterance["url"]){
                var url = utterance["url"];
            }
            // else
            // if (this.streamMap[textKey] && this.streamMap[textKey]["stream"]) {
            //     var url = this.streamMap[textKey]["stream"];
            // }
            else {
                this.preLoadStreamByText(utterance["text"]);
                var url = this.baiduSpeakUrl + utterance["text"];
            }
            var that = this;
            this.audioDom.src = url;
            for(var key in utterance){
                if(key == "ondurationchange"){
                    durationchangeCallback = utterance[key]||function(){};
                }else if(key == "ontimeupdate"){
                    timeupdateCallback = utterance[key]||function(){};
                }else
                if(key != "url" && key != "onend"){
                    this.audioDom[key] = utterance[key];
                }
            }
            var isFirstPlay = true;
            this.audioDom["oncanplay"] = function(e) {
                if((!utterance["url"] ||utterance["autoplay"])&&isFirstPlay){
                    isFirstPlay = false
                    var promise = e.target.play();
                    if (promise) {
                        promise["catch"](function(err) {
                            console.log("play error");
                        })["then"](function(resolve) {
                            // if(typeof utterance["onplay"] == "function"){
                            //     utterance["onplay"]();
                            // }
                        });
                    }
                }
            };
            this.audioDom.load();
            return this.audioDom;
        };
        prototype.preLoadStreamByText = function(text, callback) {
            // body...
            var thisObject = this;
            var streamMap = thisObject.streamMap;
            if(text == "" || text == "none"){
                return;
            }
            var key = decodeURI(text);
            // 没有语音不调请求
            if(!thisObject.isCanSpeak){
                callback && callback(streamMap[key]);
                return;
            }
            if (streamMap[key] && streamMap[key]["status"] == "loaded") {
                callback && callback(streamMap[key]);
                return streamMap[key]["stream"];
            } else if (!streamMap[key]) {
                streamMap[key] = {};
                thisObject.loadStream(key, text, streamMap, callback);
            }

        };
        prototype.loadStream = function(key, text, streamMap, callback) {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function(e) {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200 || xhr.status == 304) {
                        var blob = xhr.response;
                        if (xhr.response.type == "application/json") {
                            callback && callback({ "status": "error", "msg": xhr.response });
                        } else {
                            var audioUrl = URL.createObjectURL(blob);
                            streamMap[key] = { "status": "loaded", "stream": audioUrl };
                            callback && callback(streamMap[key]);
                        }

                    } else {
                        callback && callback({ "status": "error", "msg": xhr.response });
                    }
                }
            }
            xhr.responseType = "blob";
            var url = thisObject.baiduSpeakUrl + text;
            //创建一个 post 请求，采用异步
            var _time = new Date().getTime();
            if ((_time - this.nextReqAudioTime) > 10) {
                // xhr.open('POST', url, true);
                xhr.open('GET', url, true);
                xhr.send(null);
                this.nextReqAudioTime = _time + 20;

            } else {
                var laterSec = _time - this.nextReqAudioTime + 20;
                this.nextReqAudioTime = _time + laterSec;
                setTimeout(function(laterSec, url) {
                    // xhr.open('POST', url, true);
                    xhr.open('GET', url, true);
                    xhr.send(null);
                    this.nextReqAudioTime = laterSec + 20;
                }, laterSec, laterSec, url);

            }
        };
        prototype.cancel = function() {
            this.audioDom.pause();
            endedCallback = null;
        };

        prototype.silence = function(b) {

        };
        prototype.triggerPlay = function(){
            this.audioDom && this.audioDom.play();
        };
        prototype.setSystemVolume = function(volume) {};
        prototype.getSystemVolume = function(success) {};
    };

    var DXSpeakListener = function(params) {//Container, id, baiduAudioToken,language,speakServerUrl,canSpeak
        var thisObject = this;
        thisObject.initialized = false;
        var Container = params["containerDom"], id = params["id"], baiduAudioToken=params["baiduAudioToken"],language=params["language"],speakServerUrl = params["speakServerUrl"],
           canSpeak = params["canSpeak"],
           platform = params["platform"]||"";
        thisObject.isMute = false;
        thisObject.textQueue = new Array();
        thisObject.callbackQueue = new Array();
        thisObject.speakAudios = new Object();
        thisObject.cursor = 0;
        thisObject.isCanSpeak = canSpeak || false;
        thisObject.speakingEnd = true;
        thisObject.visibility = true;
        if(window["cordova"] && window["cordova"]["exec"] && platform.indexOf("web")==-1){
            thisObject.speakNative = new NativeSpeakSynthesizer();
        }
        else{
            thisObject.speakNative = new BaiduSpeakSynthesizer(Container, id, baiduAudioToken,speakServerUrl,canSpeak);
        }
        // 状态变化回调函数
        function handleVisibilityChange() {
            if (document.hidden || document.visibilityState === 'hidden') {
                // console.log('页面进入后台（隐藏状态）');
                thisObject.visibility = false;
                thisObject["cancelSpeak"]();
                // 这里可以添加页面隐藏时的逻辑，如暂停视频、停止轮询等
            } else {
                thisObject.visibility = true;
                // console.log('页面进入前台（可见状态）');
                // 这里可以添加页面可见时的逻辑，如恢复视频、重新启动轮询等
            }
        }

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('webkitvisibilitychange', handleVisibilityChange); // Safari 兼容性
        // thisObject.language = language || "Zh";

        thisObject.updateReg = /方(\S*)米/;
        thisObject.disUnit = (window["langData"]["meter:distance"]||"米");
        thisObject.joinTip = (window["langData"]["navi:join:tip"]||"后");
        if(language == "En"){
            thisObject.updateReg = /(\S*) meters/;
            thisObject.disUnit = "meters";
        }
        //thisObject.j = 0;
        thisObject["speakText"] = function(text, callBack) {
            var msg = {};
            msg["text"] = text;
            msg["onend"] = function(e) {
                if (typeof callBack == "function") {
                    callBack();
                }
            };
            if (thisObject.speakNative) {
                thisObject.speakNative.cancel();
                thisObject.speakNative.speak(msg);
            }
        };
        thisObject["cancelSpeak"] = function(text, callBack) {
            if (thisObject.speakNative) {
                thisObject.speakNative.cancel();

            }
        };


    };
    DXSpeakListener.prototype.setCanSpeak = function(canSpeak){
        var thisObject = this;
        thisObject.isCanSpeak = canSpeak;
        thisObject.speakNative.setCanSpeak(canSpeak);
    };
    DXSpeakListener.prototype["setCanSpeak"] =  DXSpeakListener.prototype.setCanSpeak;
    DXSpeakListener.prototype.addCallback = function(callback) {
        var thisObject = this;
        thisObject.callbackQueue[thisObject.cursor] = callback;
    };
    DXSpeakListener.prototype["addCallback"] =  DXSpeakListener.prototype.addCallback;
    DXSpeakListener.prototype.addCallbackByIndex = function(index, callback) {
        var thisObject = this;
        thisObject.callbackQueue[index] = callback;
    };

    DXSpeakListener.prototype.init = function(errorCB) {
        var thisObject = this;
        // if (true) {
        thisObject.cursor = 0;
        if (!thisObject.initialized) {
            thisObject.speakNative.init({ "VOICE_NAME": "vixq", "SPEED": 70 ,"language":thisObject.language}, function(v) {
                if (v < 50) {
                    thisObject.speakNative.setSystemVolume(80); //设置手机音量
                }
            });
            thisObject.isCanSpeak = true;
            thisObject.speakNative.setCanSpeak(true);
            thisObject.initialized = true;
        } else {
            thisObject.stop();

        }

        thisObject.deviceMuteController = (function() {
            var systemVolume = 80;
            var that = {};
            that.setMute = function(ismute, callback) {
                if (window['cordova'] === undefined) return;
                if (ismute === true) {
                    thisObject.speakNative.getSystemVolume(function(v) {
                        if (v != 0) {
                            systemVolume = v;
                            thisObject.speakNative.silence(true);
                            callback && callback();
                        }
                    });
                } else {
                    thisObject.speakNative.getSystemVolume(function(v) {
                        if (v == 0) {
                            thisObject.speakNative.silence(false);
                            callback && callback();
                        }
                    });
                }
            };
            return that;
        })();
    };
    DXSpeakListener.prototype["init"] =  DXSpeakListener.prototype.init;

    DXSpeakListener.prototype.getCanSpeak = function() {
        return this.isCanSpeak;
    };
    DXSpeakListener.prototype["getCanSpeak"] =  DXSpeakListener.prototype.getCanSpeak;
    DXSpeakListener.prototype.speaking = function(text, speakIndex) {
        var thisObject = this;
        thisObject.textQueue.push(text);
        if (text && text !== "none" && text !== "null") {
            if (thisObject.speakNative["preLoadStreamByText"]) {
                thisObject.speakNative["preLoadStreamByText"](text);
            }

            var matchRes = text.match(thisObject.updateReg);
            if (matchRes) {
                var distance = Number(matchRes[1]);
                var indistinctDistance = thisObject.indistinctDistance;
                var substr = text.match(thisObject.updateReg);
                if (distance && indistinctDistance) {
                    if (distance < indistinctDistance[0] && distance >= indistinctDistance[1]) {
                        text = text.replace(substr[1], "");
                    } else if (distance <= indistinctDistance[1]) {
                        if (speakIndex == undefined) {
                            var index = text.indexOf(",");
                            if (index == -1) {
                                index = text.indexOf(thisObject.disUnit);
                            }
                            if(thisObject.language == "En"){
                                text = text.slice(index + 6);
                            }else{
                                text = text.slice(index + 1);
                            }

                        } else {
                            text = text.replace(substr[1], "");
                        }

                    }
                    if (thisObject.speakNative["preLoadStreamByText"]) {
                        thisObject.speakNative["preLoadStreamByText"](text);
                    }

                }
            }
        }
        return thisObject.textQueue.length - 1;
    };
    DXSpeakListener.prototype["speaking"] =  DXSpeakListener.prototype.speaking;
    DXSpeakListener.prototype["triggerPlay"] = function(){
        this.speakNative.triggerPlay && this.speakNative.triggerPlay();
    };
    // 20191210 新版语音预加载
    DXSpeakListener.prototype.preloadSpeakNavi = function(text, callback) {
        var thisObject = this;
        if (text && text !== "none" && text !== "null") {
            if (thisObject.speakNative.preLoadStreamByText) {
                thisObject.speakNative.preLoadStreamByText(text, callback);
            }
        }
    };

    DXSpeakListener.prototype["getSpeakText"] = DXSpeakListener.prototype.getSpeakText = function(index,speakType) { //cheng.li 20150616
        var thisObject = this;
        var text = thisObject.textQueue[index];
        if(speakType == 2){
            var aheadText = window["langData"]["ahead"] ||"前方";
            text = text.replace(aheadText,"");
        }
        if (text == undefined) {
            thisObject.cursor--;
            text = "";
        }
        return text;
    };


    DXSpeakListener.prototype.speakNext = function(index,distance,speakType,callback) { //头部更新时从4开始计数 cheng.li 20150623
        var thisObject = this;
        if(index == thisObject.cursor){
            return;
        }
        if (index !== undefined) { //指定位置读取
            thisObject.cursor = index;
        } else {
            index = thisObject.cursor;
        }
        var text = thisObject.getSpeakText(index,speakType);
        thisObject.speakNow(text, callback||thisObject.callbackQueue[index], index,distance);
    };
    DXSpeakListener.prototype["speakNext"] =  DXSpeakListener.prototype.speakNext;
    DXSpeakListener.prototype.speakNow = function(text, callBack, speakIndex,curDis,unableRep) {
        var thisObject = this;
        if(!thisObject.visibility){
            callBack && callBack();
            return;
        }
        if (!text || text == "none" || text == null) {
            if (typeof callBack == "function") {
                callBack();
            }
            return;
        }else if(text && text["url"]){
            var msg = {
                "url":text["url"],
                "onend":text["onend"]||function(e){
                    console.log("play onend",text["url"]);
                },
                "ondurationchange":text["ondurationchange"],
                "oncanplay":text["oncanplay"],
                "onplay":text["onplay"],
                "onpause":text["onpause"],
                "autoplay":text["autoplay"],
                "oncancel":text["oncancel"],
                "noReplaceByNavi":text["noReplaceByNavi"]!=undefined?true:text["noReplaceByNavi"]
            };

        }else{
            var matchRes = text.match(thisObject.updateReg);
            var substr = text.match(thisObject.updateReg);
            if (matchRes) {
                if(curDis){
                    text = text.replace(substr[1], curDis);
                }else{
                    var distance = Number(matchRes[1]);
                    var indistinctDistance = thisObject.indistinctDistance;

                    if (distance && indistinctDistance) {

                        if (distance < indistinctDistance[0] && distance >= indistinctDistance[1]) {
                            text = text.replace(substr[1], "");
                        } else if (distance <= indistinctDistance[1]) {
                            if (speakIndex == undefined) {
                                var index = text.indexOf(",");
                                if (index == -1) {
                                    index = text.indexOf(thisObject.disUnit);
                                }
                                if(thisObject.language == "En"){
                                    text = text.slice(index + 6);
                                }else{
                                    text = text.slice(index + 1);
                                }
                                // text = text.slice(index + 1);
                            } else {
                                text = text.replace(substr[1], "");
                            }

                        }
                    }
                }

            }

            var msg = {};
            msg["text"] = text;
            msg["onend"] = function(e) {
                thisObject.speakingEnd = true;
                thisObject.msgObj = null;
                if (typeof callBack == "function") {
                    callBack();
                }
            };
            // if(!thisObject.speakingEnd && thisObject.msgObj && thisObject.msgObj["unableRep"]){
            //     var currSpeakCallback = thisObject.msgObj["onend"];
            //     thisObject.msgObj = function(){currSpeakCallback();if(typeof callBack == "function"){callBack()})}
            // }
            if(thisObject.msgObj && (thisObject.msgObj["noReplaceByNavi"] ||(!thisObject.speakingEnd && thisObject.msgObj["unableRep"]))){// && !thisObject.speakingEnd 特殊播报 高于导航播报
                if (typeof callBack == "function") {
                    callBack();
                }
                return;
            }
        }


        if (thisObject.speakNative && msg) {
            thisObject.speakNative["cancel"]();
            thisObject.msgObj = msg;
            if(unableRep){
                thisObject.msgObj["unableRep"] = unableRep;
            }
            thisObject.speakingEnd = false;
            if(daximap["device"] && daximap["device"].vibrate){
                daximap["device"].vibrate([500]);
            }
            return thisObject.speakNative["speak"](msg,unableRep);
        }
    };
    DXSpeakListener.prototype["speakNow"] =  DXSpeakListener.prototype.speakNow;
    DXSpeakListener.prototype["cancel"] = function(){
        if(this.msgObj){
            this.msgObj["oncancel"] && this.msgObj["oncancel"]();
             this.msgObj = null;
        }
        this.speakingEnd = true;

    };

    DXSpeakListener.prototype.mute = function(ismute) {
        var thisObject = this;
        if (ismute != undefined) {
            thisObject.isMute = ismute;
            thisObject.deviceMuteController.setMute(ismute);
        } else {
            return thisObject.isMute;
        }
    };
    /////////////////////////////////////////////
    DXSpeakListener.prototype.stop = function() {
        var thisObject = this;
        if (thisObject.speakNative !== null) {
            thisObject.speakNative["cancel"](); //会清除text队列内容
            thisObject.speakNow();
        }
        thisObject.textQueue = [];
        thisObject.cursor = -1;
        thisObject.callbackQueue = [];
    };
    DXSpeakListener.prototype["stop"] =  DXSpeakListener.prototype.stop;

    ////////////////////////////////////////////////////
    DXSpeakListener.prototype.getTextQueueLength = function() {
        var thisObject = this;
        return thisObject.textQueue.length;
    };
    ////////////////////////////////////////////////
    DXSpeakListener.prototype.updateMsg = function(distance,minSpeakDistance) {
        var thisObject = this;
        if(!thisObject.textQueue[thisObject.cursor]){
            return;
        }
        var substr = thisObject.textQueue[thisObject.cursor].match(thisObject.updateReg);
        if (substr != null) {
            if(distance>=minSpeakDistance){
                substr = thisObject.textQueue[thisObject.cursor].replace(substr[1], distance);
            }else{
                substr = thisObject.textQueue[thisObject.cursor].replace(substr[1],'').replace((window["langData"]["meter:distance"]||"米"),'');
            }
        }
        if(!substr){
            console.log("eror --------",substr,thisObject.cursor);
            return;
        }
        if(substr.indexOf(". ") !=-1){
            substr = substr.slice(substr.indexOf(". ")+2);
        }
        return substr;
    };
    DXSpeakListener.prototype["updateMsg"] =  DXSpeakListener.prototype.updateMsg;

    DXSpeakListener.prototype.updateMsgFinal = function() {
        var thisObject = this;
        if(!thisObject.textQueue[thisObject.cursor]){
            return;
        }
        var substr = thisObject.textQueue[thisObject.cursor].match(thisObject.updateReg);
        if (substr != null) {
            substr = thisObject.textQueue[thisObject.cursor].replace(substr[1], "").replace(thisObject.disUnit,"").replace(thisObject.joinTip,"");
        }
        return substr;
    };
    DXSpeakListener.prototype["updateMsgFinal"] =  DXSpeakListener.prototype.updateMsgFinal;
    daximap["SpeakListener"] = DXSpeakListener;
})(window);
