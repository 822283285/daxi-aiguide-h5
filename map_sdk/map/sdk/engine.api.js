(function(global) {
    var WebMap3D = {};
    WebMap3D.version = 3.00;
    var dom = document;
    global["WebMap3D"] = WebMap3D;

    var api_utils = {
        path: 'map_js/src/', //配置文件目录
        containerId: '',
        canvasId: '',
        options: null,
        isExsitError: { stastu: false, error: { code: 0, message: "" } },
        _loadScript: [],
        loadJS: function(filename) {
            if (filename && filename.indexOf('.js') === -1) {
                filename += '.js';
            }
            var script = dom.createElement('script');
            script.setAttribute("type", "text/javascript");
            script.setAttribute("src", filename);
            dom.head.appendChild(script);
        },
        loadAll: function() {
            var that = this;
            var scripts = dom.getElementsByTagName('script');
            var basepath = "";
            for (var i = scripts.length; i--;) {
                if (scripts[i].src && scripts[i].src.indexOf('api.js') !== -1) {
                    basepath = scripts[i].getAttribute('basepath');
                    if (!!basepath) {
                        api_utils.path = basepath;
                    };
                    break;
                }
            }
            for (var i = this._loadScript.length; i--;) {
                that.loadJS(that.path + that._loadScript[i]);
            }
        },
        loadCss: function (url) {
            var _mlink = document.createElement("link");
            _mlink.setAttribute("type", "text/css");
            _mlink.setAttribute("rel", "stylesheet");
            _mlink.setAttribute("href", url);
            document.getElementsByTagName("head")[0].appendChild(_mlink);
        },

        loadScript: function(url, callback) {
            var script = document.createElement("script");
            script.type = "text/javascript";
            if (script.readyState) { //IE
                script.onreadystatechange = function() {
                    if (script.readyState == "loaded" ||
                        script.readyState == "complete") {
                        script.onreadystatechange = null;
                        callback();
                    }
                };
            } else { //Others: Firefox, Safari, Chrome, and Opera
                script.onload = function() {
                    callback();
                };
                script.onerror = function(e) {
                    console.log(e);
                };
            }
            script.src = url;
            document.body.appendChild(script);
        },
        loadScriptRecursive: function (fileList, i, cb) {
            if (i >= fileList.length) {
                cb && cb();
                return;
            }
            var cssRegExp = new RegExp("\\.css");
            if (cssRegExp.test(fileList[i])) {
                api_utils.loadCss(fileList[i]);
                api_utils.loadScriptRecursive(fileList, i + 1, cb);

            } else {
                api_utils.loadScript(fileList[i], function () {
                    api_utils.loadScriptRecursive(fileList, i + 1, cb);
                })
            }
        },
        loadResources : function (fileList, cb) {
            api_utils.loadScriptRecursive(fileList, 0, cb);
        },
        checkWebGL: function() {
            var canvas = null;
            try {
                canvas = dom.createElement("canvas");
            } catch (e) {
                console.log(e);
                return false;
            }
            var gl = null;
            var contextNames = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"];
            for (var i = 0; i < contextNames.length; i++) {
                try {
                    gl = canvas.getContext(contextNames[i]);
                    if (gl) {
                        break;
                    }
                } catch (e) {
                    console.log(e);
                    return false;
                }
            }
            if (gl === null) {
                return false;
            }
            return true;
        },
        createCanvas: function(containerId, canvasId, options) {
            var scale = (options && options.devicePixelRatio) || window.devicePixelRatio || 1;
            var _htmlStyle = dom.body.parentNode.style;
            var _bodyStyle = dom.body.style;
            var computedStyle = getComputedStyle(dom.body);
            _bodyStyle.overflow = computedStyle["overflow"];
            _htmlStyle.width = _bodyStyle.width = "100%";
            _htmlStyle.height = _bodyStyle.height = "100%";
            _htmlStyle.overflow = _bodyStyle.overflow; //= 'hidden';
            _htmlStyle.padding = _bodyStyle.padding = 0;
            _htmlStyle.margin = _bodyStyle.margin = 0;


            var _container = dom.getElementById(containerId);
            if (!_container) {
                api_utils.isExsitError.status = true;
                api_utils.isExsitError.error.code = 601;
                api_utils.isExsitError.error.message = '\u6ca1\u6709\u627e\u5230\u7236\u5bf9\u8c61\uff0c\u8bf7\u6b63\u786e\u8f93\u5165\u7236\u5bf9\u8c61\u0049\u0044'; //没有找到父对象，请正确输入父对象ID
                return;
            }

            var _containerStyle = _container.style;
            _containerStyle.width = _containerStyle.width || "100%";
            _containerStyle.height = _containerStyle.height || "100%";
            if (options.mapBgColorRGB) {
                if (options.mapBgColorRGB instanceof Array) {
                    _containerStyle.background = "rgba(" + options.mapBgColorRGB.join(",") + ")";
                } else {
                    _containerStyle.background = options.mapBgColorRGB;
                }
            }
            _containerStyle.background = _containerStyle.background || "#fff";
            // _containerStyle.background = _containerStyle.background || "#c6efad"; //"#fff";
            _containerStyle.overflow = "hidden";

            var _canvas = dom.createElement('canvas');
            _container.appendChild(_canvas);
            _canvas.id = (options && options.id) || canvasId;
            var _canvasStyle = _canvas.style;
            _canvasStyle.width = (options && options.width) ? options.width + "px" : "100%";
            _canvasStyle.height = (options && options.height) ? options.height + "px" : "100%";
            _canvas.width = (options && options.width * scale) || _container.clientWidth * scale;
            _canvas.height = (options && options.height * scale) || _container.clientHeight * scale;

            _canvas.addEventListener(
                "webglcontextlost",
                function() {
                    console.log("webgl context lost!");
                }, false);
            return _canvas;
        },
        initCB: null,
        engineApi: null,
        getCanvas: function() {
            return dom.getElementById(this.canvasId);
        },
        successCallback: null,
        attatchUtils: function(obj) {
            var toF = function(n) {
                return parseFloat(n, 10);
            };
            var toI = function(n) {
                return parseInt(n, 10);
            };

            obj.createScreenPosition = function(left, top) {
                var point2D = {};
                var point2D = {
                    'top': toF(top) || 0,
                    'left': toF(left) || 0,
                    'x': toF(left) || 0,
                    'y': toF(top) || 0
                };
                point2D.setTop = point2D.setY = function(top) {
                    this.top = toF(top);
                    this.y = toF(top);
                };
                point2D.setLeft = point2D.setX = function(left) {
                    this.left = toF(left);
                    this.x = toF(left);
                };
                point2D.toString = function() {
                    return [this.left, this.top].join(',');
                };
                return point2D;
            };
            obj.createPoint2D = function(longitude, latitude) {
                var point2D = {};
                var point2D = {
                    'longitude': toF(longitude) || 0,
                    'latitude': toF(latitude) || 0
                };
                point2D.setLongitude = function(longitude) {
                    this.longitude = toF(longitude);
                };
                point2D.setLatitude = function(latitude) {
                    this.latitude = toF(latitude);
                };
                point2D.toString = function(split) {
                    split = split || ',';
                    return [this.longitude, this.latitude].join(split);
                };
                return point2D;
            };
            obj.createPoint3D = function(longitude, latitude, altitude) {
                var point3D = {};
                var point3D = {
                    'longitude': toF(longitude) || 0,
                    'latitude': toF(latitude) || 0,
                    'altitude': toF(altitude) || 0
                };
                point3D.setLongitude = function(longitude) {
                    this.longitude = toF(longitude);
                };
                point3D.setLatitude = function(latitude) {
                    this.latitude = toF(latitude);
                };
                point3D.setAltitude = function(altitude) {
                    this.altitude = toF(altitude);
                };
                point3D.toString = function() {
                    return [this.longitude, this.latitude, this.altitude].join(',');
                };
                return point3D;
            };
            obj.createLngLatLevel = function(longitude, latitude, level) {
                var point3D = {};
                var point3D = {
                    'longitude': toF(longitude) || 0,
                    'latitude': toF(latitude) || 0,
                    'level': toF(level) || 0
                };
                point3D.setLongitude = function(longitude) {
                    this.longitude = toF(longitude);
                };
                point3D.setLatitude = function(latitude) {
                    this.latitude = toF(latitude);
                };
                point3D.setLevel = function(level) {
                    this.level = toF(level);
                };
                point3D.toString = function() {
                    return [this.longitude, this.latitude, this.level].join(',');
                };
                return point3D;
            };

            obj.createPosition3D = function(longitude, latitude, altitude, heading, tilt, range) {
                var position3d = {
                    'longitude': toF(longitude) || 0,
                    'latitude': toF(latitude) || 0,
                    'altitude': toF(altitude) || 0,
                    'heading': toF(heading) || 0,
                    'tilt': toF(tilt) || 0,
                    'range': toF(range) || 0
                };

                position3d.setLongitude = function(longitude) {
                    this.longitude = toF(longitude);
                };
                position3d.setLatitude = function(latitude) {
                    this.latitude = toF(latitude);
                };
                position3d.setAltitude = function(altitude) {
                    this.altitude = toF(altitude);
                };
                position3d.setHeading = function(heading) {
                    this.heading = toF(heading);
                };
                position3d.setTilt = function(tilt) {
                    this.tilt = toF(tilt);
                };
                position3d.setRange = function(range) {
                    this.range = toF(range);
                };
                position3d.toString = function() {
                    return [this.longitude, this.latitude, this.altitude, this.heading, this.tilt, this.range].join(',');
                };
                return position3d;
            };


            //mark
            obj.createPlacemark = function(markStyle, markInfo) {
                var markObj = {
                    'objectStyle': markStyle || obj.createLabelStyle(),
                    'objectInfo': markInfo || obj.createLabelInfo()
                };
                markObj.setStyle = function(markStyle) {
                    this.objectStyle = markStyle;
                };
                markObj.getStyle = function() {
                    return this.objectStyle;
                };
                markObj.setMarkInfo = function(markInfo) {
                    this.objectInfo = markInfo;
                };
                markObj.getMarkInfo = function() {
                    return this.objectInfo;
                };
                markObj.objectType = "Label";
                return markObj;

            };

            obj.createLabelInfo = function(type, name, guid, point3D, event, text, fillType) {
                var label = {
                    'type': type || 'Label',
                    'name': name || '',
                    'guid': guid || '',
                    "text": text || "",
                    "fillType": fillType || "",
                    'priority': 1, //显示的优先级，数字越大优先级越高
                    'position': (point3D && point3D.toString()) || '',
                    'event': event || [{ 'click': function() {} }, { 'mouseover': function() {} }, { 'mouseout': function() {} }, { 'camerachange': function() {} }]
                };
                label.setType = function(type) {
                    this.type = type;
                };
                label.setName = function(name) {
                    this.name = name;
                };
                label.setGuid = function(guid) {
                    this.guid = guid;
                };
                label.setPosition = function(point3D) {
                    this.position = point3D.toString();
                };
                label.setText = function(str) {
                    this.text = str;
                };
                label.setFillType = function(fillType) {
                    this.fillType = fillType;
                };
                label.setPriority = function(priority) {
                    this.priority = priority;
                };
                label.setEvent = function(events) {
                    this.event = events;
                };
                var events = [];
                //type:  click|mouseover|mouseout|camerachange
                label.addEventListener = function(type, callback, context) {

                    for (var i = 0, len = label.event.length; i < len; i++) {
                        var eventObj = label.event[i];
                        for (var key in eventObj) {
                            if (eventObj.hasOwnProperty(key) && key === type) {
                                events.push({ eventName: type, cb: callback, ctx: context });
                                label.event[i][key] = (function() {
                                    var resultFun = function() {
                                        for (var i = 0, len = events.length; i < len; i++) {
                                            var e = events[i];
                                            if (e.eventName === type) {
                                                e.cb.apply(e.ctx, arguments);
                                            }

                                        }

                                    };
                                    return resultFun;
                                }).apply(context, arguments);

                            }
                        }
                    }

                };

                label.removeEventListener = function(type, callback) {
                    for (var i = 0; i < events.length; i++) {
                        if (events[i].eventName === type && events[i].cb === callback) {
                            events.splice(i, 1);
                            i--;
                        } else if (events[i].eventName === type) {
                            events.splice(i, 1);
                            i--;
                        }
                    }
                }
                return label;

            };

            obj.createLabelStyle = function(name, type, iconStyle, backgroundStyle, scale, lineWdith) {

                var style = {
                    'name': name || '',
                    'type': type || "LabelStyle",
                    'icon': iconStyle || obj.createIconStyle(),
                    'background': backgroundStyle || obj.createBackgroundStyle(),
                    'scale': scale || 1.0,
                    'lineWdith': lineWdith || 2.0
                };
                style.getIconStyle = function() {
                    return this.icon;
                };
                style.getBackground = function() {
                    return this.background;
                };
                style.setIconStyle = function(iconStyle) {
                    this.icon = iconStyle;
                };
                style.setBackgroundStyle = function(backgroundStyle) {
                    this.background = backgroundStyle;
                };
                style.setType = function(type) {
                    this.type = type;
                };
                style.setName = function(name) {
                    this.name = name;
                };
                style.setLineWidth = function(lineWdith) {
                    this.lineWdith = lineWdith;
                };
                style.setScale = function(scale) {
                    this.scale = scale;
                };

                return style;
            };
            obj.createBackgroundStyle = function() {
                var backgroundStyle = [];
                backgroundStyle.setIcon = function(icon) {
                    this[0] = icon;
                };
                return backgroundStyle;
            };


            obj.createIconStyle = function() {
                var iconStyle = new Array(2);
                iconStyle.setIcon = function(icon) {
                    this[0] = this[1] = icon;
                };
                iconStyle.setNormalStyle = function(icon) {
                    this[0] = icon;
                };
                iconStyle.setHighlightStyle = function(icon) {
                    this[1] = icon;
                };
                return iconStyle;
            };

            obj.createIcon = function(url, range) {
                var icon = {
                    'url': url,
                    'image': undefined,
                    'range': range
                };
                icon.setHref = function(url) {
                    this.url = url;
                };

                icon.setImage = function(image) {
                    this.image = image;
                };


                icon.setRange = function(x, y, iconWidth, iconHeight, imageWidth, imageHeight) {
                    this.range = [x / imageWidth, y / imageHeight, (iconWidth / imageWidth), (iconHeight / imageHeight)].join(',');
                };

                return icon;
            };
            obj.createPlaceLine = function(lineStyle, lineInfo) {
                var lineObj = {
                    'objectStyle': lineStyle || obj.createLineStyle(),
                    'objectInfo': lineInfo || obj.createLineInfo()
                };
                lineObj.setStyle = function(markStyle) {
                    this.objectStyle = markStyle;
                };
                lineObj.getStyle = function() {
                    return this.objectStyle;
                };
                lineObj.setLineInfo = function(markInfo) {
                    this.objectInfo = markInfo;
                };
                lineObj.getLineInfo = function() {
                    return this.objectInfo;
                };
                lineObj.setHeightOffset = function(heightOffset){
                    this.heightOffset = heightOffset;
                }
                lineObj.objectType = "Polyline";
                return lineObj;

            };
            obj.FillType = {
                "color": 'color',
                "texture": 'texture'
            };
            obj.createLineStyle = function(lineType, name, color, width, fillType, textureUrl, repeat, textureWrapScale) {
                var style = {
                    'type': lineType || 'PolylineStyle',
                    'name': name || '',
                    'color': color || [191, 25, 216, 0.5],
                    'width': width || 16.0,
                    'repeat': repeat || false,
                    'textureWrapScale': textureWrapScale || 8,
                    'fillType': fillType || 'color', //texture
                    'imageUrl': textureUrl || ""
                };

                style.setType = function(type) {
                    this.type = type;
                };

                style.setName = function(name) {
                    this.name = name;
                };
                style.setColor = function(color) {
                    this.color = color;
                };
                style.setWidth = function(width) {
                    this.width = width;
                };
                style.setFillType = function(fillType) {
                    this.fillType = fillType
                };
                style.setTextureUrl = function(textureUrl) {
                    this.imageUrl = textureUrl;
                };
                style.setRepeat = function(num) {
                    this.repeat = num;
                }
                style.setTextureWrapScale = function(num) {
                    this.textureWrapScale = num;
                }
                return style;
            };


            // obj.createBrushStyle = function(lineType, name, color, width, fillType, textureUrl, repeat, textureWrapScale) {
            //     var style = {
            //         'type': lineType || 'PolylineStyle',
            //         'name': name || '',
            //         'color': color || [191, 25, 216, 0.5],
            //         'outlineColor' : 
            //         'fillType': fillType || 'color', //texture
            //     };

            //     style.setType = function(type) {
            //         this.type = type;
            //     };

            //     style.setName = function(name) {
            //         this.name = name;
            //     };
            //     style.setColor = function(color) {
            //         this.color = color;
            //     };
            //     style.setWidth = function(width) {
            //         this.width = width;
            //     };
            //     style.setFillType = function(fillType) {
            //         this.fillType = fillType
            //     };
            //     style.setTextureUrl = function(textureUrl) {
            //         this.imageUrl = textureUrl;
            //     };
            //     style.setRepeat = function(num) {
            //         this.repeat = num;
            //     }
            //     style.setTextureWrapScale = function(num) {
            //         this.textureWrapScale = num;
            //     }
            //     return style;
            // };

            obj.createLineInfo = function(type, name, guid, position3DString, color) {
                var line = {
                    'type': type || 'Polyline',
                    'name': name || '',
                    'guid': guid || '',
                    'position': position3DString || '',
                    'heightOffset' : 0

                };
                line.setType = function(type) {
                    this.type = type;
                };
                line.setName = function(name) {
                    this.name = name;
                };
                line.setGuid = function(guid) {
                    this.guid = guid;
                };
                line.setPositions = function(position3DString) {
                    this.position = position3DString;
                };
                line.setHeightOffset = function(heightOffset){
                    this.heightOffset = heightOffset;
                }
                return line;
            };

            obj.createPolygonInfo = function(type, name, guid, point3D, rotate, scale, transparency, color) {
                var polygon = {
                    'type': type || 'Polygon',
                    'name': name || '',
                    'guid': guid || '',
                    'position': (point3D && point3D.toString()) || '',
                    'scale': scale || '1,1,1',
                    'rotate': rotate || '0,0,0',
                    'transparency': transparency || 'false'
                };
                polygon.setType = function(type) {
                    this.type = type;
                };
                polygon.setName = function(name) {
                    this.name = name;
                };
                polygon.setGuid = function(guid) {
                    this.guid = guid;
                };
                polygon.setPosition = function(point3D) {
                    this.position = point3D.toString();
                };
                polygon.setRotate = function(rotate) {
                    this.rotate = rotate;
                };

                polygon.setScale = function(scale) {
                    this.scale = scale;
                };
                polygon.setTransparency = function(isTransparency) {
                    this.transparency = isTransparency;
                }
                return polygon;
            };

            obj.createTexturePolygon = function(polgyonStyle, polygonInfo) {
                var polygonObj = {
                    'objectStyle': polgyonStyle || obj.createLineStyle(),
                    'objectInfo': polygonInfo || obj.createPolygonInfo()
                };
                polygonObj.setStyle = function(polgyonStyle) {
                    this.objectStyle = polgyonStyle;
                };
                polygonObj.getStyle = function() {
                    return this.objectStyle;
                };
                polygonObj.seInfo = function(polygonInfo) {
                    this.objectInfo = polygonInfo;
                };
                polygonObj.getInfo = function() {
                    return this.objectInfo;
                };

                return polygonObj;

            };

            obj.createBlock = function(lineStyle, lineInfo) {
                var polygonObj = {
                    'objectStyle': lineStyle || obj.createLineStyle(),
                    'objectInfo': lineInfo || obj.createPolygonInfo()
                };
                polygonObj.setStyle = function(polgyonStyle) {
                    this.objectStyle = polgyonStyle;
                };
                polygonObj.getStyle = function() {
                    return this.objectStyle;
                };
                polygonObj.seInfo = function(polygonInfo) {
                    this.objectInfo = polygonInfo;
                };
                polygonObj.getInfo = function() {
                    return this.objectInfo;
                };
                return polygonObj;
            };

        }
    };


    // var createInitObject=function(createFunction){

    // };
    var currMapScale = 0,
        minMapScale = 0.91674010714431,
        maxMapScale = 0.9979971601182568,
        stepScale = 9,
        incrementScale = (maxMapScale - minMapScale) / stepScale;


    var createUserSDK = function(engineApi, containerId, options,canvasDom) {
        var api = {};
        //设置配置参数
        
        api.engineApi = engineApi;
        
        if(canvasDom){
            api.canvasDom = canvasDom;
            var canvasId = canvasDom.getAttribute("id");
            if(!canvasId){
                canvasId = "map3d" + (new Date).getTime();
                canvasDom.setAttribute("id",canvasId);
            }
            api.canvasId = canvasId;
        }else{
            var canvasId = "map3d" + (new Date).getTime();
            api.canvasId = canvasId;
            api.canvasDom = api_utils.createCanvas(containerId, canvasId, options);
        }
        
        api.checkCanvasSize = function() {
            var canvas = api.canvasDom;
            var styleObj = getComputedStyle(canvas.parentNode);
            L = canvas.parentNode.clientWidth || parseInt(styleObj["width"]);
            K = canvas.parentNode.clientHeight || parseInt(styleObj["height"]);
            if (canvas.width == 0 || Math.abs(~~(devicePixelRatio * L )- canvas.width) > 1 || Math.abs(~~(devicePixelRatio * K) - canvas.height) > 1) {
                engineApi["onResize"]();
            }
        };
        api.resetCanvasSize = function(width, height) {
            var canvas = api.canvasDom;
            var styleObj = getComputedStyle(canvas.parentNode);
            L = width || canvas.parentNode.clientWidth || parseInt(styleObj["width"]);
            K = height || canvas.parentNode.clientHeight || parseInt(styleObj["height"]);
            if (canvas.width == 0 || Math.abs(~~(devicePixelRatio * L )- canvas.width) > 1 || Math.abs(~~(devicePixelRatio * K) - canvas.height) > 1) {
                engineApi["onResize"](L, K);
            }
        };

        api.setConfigOptions = function(key, value) { //"availble_buffer_count_per_frame",240
            engineApi["setConfigOptions"](key, value);
        };
        //获取配置参数
        api.getConfigOptions = function(key) {
            return engineApi["setConfigOptions"](key);
        };
        api.onResize = function() {
            engineApi["onResize"]();
        };
        //开启3D眼镜效果
        //api.enable3DGlass=function(isTrue){
        //    engineApi["enableStereo"](isTrue);
        //}

        //地球飞到初始状态
        api.backToGlobe = function() {
            engineApi["backToGlobe"]();
        };
        //飞行到指定的位置
        api.flyTo = function(position3D) {
            engineApi["flyTo"](position3D.longitude, position3D.latitude, position3D.altitude, position3D.heading, position3D.tilt, position3D.range)
        };
        //沿着给定的路线飞行
        api.flyAlongPath = function(point3DArray, loop) {
            var arr = [];
            if (loop === undefined) loop = false;
            if (point3DArray.length <= 0) {
                throw { 'code': 700, 'message': 'array parm length is zero' };
                return;
            }
            for (var p in point3DArray) {
                arr.push(point3DArray[p].toString())
            }
            engineApi["flyAlongPath"](arr.join(";"), loop);
        };

        //以动画方式放大或缩小地球,scale:取值范围为[0,1]之间
        api.flyToScale = function(scale) {
            engineApi["flyToScale"](scale);
        };
        //沿着某个角度平移
        api.pan = function(degree) {
            engineApi["pan"](degree);
        };
        //以输入的经纬度为中心点调整地球位置
        api.rotateTo = function(point3D) {
            return engineApi["rotateTo"](point3D.longitude, point3D.latitude, point3D.altitude);
        };
        //设置地球的旋转角度
        api.setHeading = function(degree) {
            engineApi["setHeading"](degree);
        };
        //当地球head发生更改时回调,仅用做漫游控制，其他地方禁止使用
        api.getHeading = function(cb) {
            engineApi["getHeading"](cb);
        };

        api.setHeadingCallBack = function(cb) {
            engineApi["setHeadingCallBack"](cb);
        }
        api.setTiltCallBack = function(cb) {
            engineApi["setTiltCallBack"](cb);
        }

        api.getTilt = function(cb) {
            engineApi["getTilt"](cb);
        };
        //设置地球的放大缩小 ,scale:取值范围为[0,1]之间
        api.setZoomScale = function(scale) {
            engineApi["setZoomScale"](scale);
        };
        api.zoomLevelFromZ = function(distance){
            engineApi["zoomLevelFromZ"](distance);
        };
        api.zoomLevelToZ = function(zoomLevel){
            engineApi["zoomLevelToZ"](zoomLevel);
        };
        api.getZoomLevelRange = function(){
            return engineApi["getZoomLevelRange"]();
        };
        api.setZoomLevel = function(level){
            engineApi["setZoomLevel"](level);
        }
        api.setZoomLevelRange = function(minLevel,maxLevel){
            engineApi["setZoomLevelRange"](minLevel,maxLevel);
        }

        api.zoomIn = function() {
            var currMapScale = engineApi["getZoomScale"]() + incrementScale;
            if (currMapScale > maxMapScale) currMapScale = maxMapScale;
            engineApi["setZoomScale"](0.667);
        }

        api.zoomOut = function() {
            var currMapScale = engineApi["getZoomScale"]() - incrementScale;
            if (currMapScale < minMapScale) currMapScale = minMapScale;
            engineApi["setZoomScale"](1.5);
        }

        //根据目标点放大或缩小
        //type 1：放大，0：缩小
        //step: 变化幅度【0-1】
        api.zoomToPlace = function(position3D, type, step) {
            return engineApi["zoomToPlace"](position3D.longitude, position3D.latitude, position3D.altitude, type, step);
        };
        //当地球放大或缩小时执行回调函数,仅用做漫游控制，其他地方禁止使用
        api.getZoomScale = function(callback) {
            var currScale = 0;
            var cb = !!callback ? callback : null;
            currScale = engineApi["getZoomScale"](cb);
            return currScale;
        };
        //倾斜一定角度
        api.tiltDown = function() {
            engineApi["tiltDown"]();
        };
        //恢复倾斜一定角度
        api.tiltUp = function() {
            engineApi["tiltUp"]();
        };
        //获取当前地图的中心点经度与维度以及地球放大的级别[0-18]
        api.getViewRange = function() {
            var parm = engineApi["getViewRange"]();
            var p = api.createLngLatLevel(parm['lon'], parm['lat'], parm['level']);
            return p;
        };
        //设置地球的中心点及放大级别
        api.setViewRange = function(lnglatLevel) {
            var parm = {};
            parm['lon'] = lnglatLevel.longitude;
            parm['lat'] = lnglatLevel.latitude;
            parm['level'] = lnglatLevel.level;
            engineApi["setViewRange"](parm);
        };
        //设置地球显示的范围
        api.setBounds = function(point2D1, point2D2, scale) {
            var p1, p2, minLon, minLat, maxLon, maxLat;
            if (!scale) scale = 0.4;
            if (point2D1 && point2D2) {

                minLon = point2D1.longitude;
                minLat = point2D1.latitude;
                maxLon = point2D2.longitude;
                maxLat = point2D2.latitude;

                minLon -= (maxLon - minLon) * scale;
                minLat -= (maxLat - minLat) * scale;
                maxLon += (maxLon - minLon) * scale;
                maxLat += (maxLat - minLat) * scale;
                p1 = api.createPoint2D(minLon, minLat);
                p2 = api.createPoint2D(maxLon, maxLat);
            }
            var bound = p1.toString(";") + ";" + p2.toString(";");

            // engineApi["setBounds"]( "116.287169;39.791031;116.507166;39.975638");
            engineApi["setBounds"](bound);
        };

        //设置相机运动范围
        api.setCameraBounds = function(point2D1, point2D2, scale, maxCameraHeight) {
            var p1, p2, minLon, minLat, maxLon, maxLat;
            if (!scale) scale = 0.4;
            if (point2D1 && point2D2) {

                minLon = point2D1.longitude;
                minLat = point2D1.latitude;
                maxLon = point2D2.longitude;
                maxLat = point2D2.latitude;

                minLon -= (maxLon - minLon) * scale;
                minLat -= (maxLat - minLat) * scale;
                maxLon += (maxLon - minLon) * scale;
                maxLat += (maxLat - minLat) * scale;
                p1 = api.createPoint2D(minLon, minLat);
                p2 = api.createPoint2D(maxLon, maxLat);
            }
            var bound = p1.toString(";") + ";" + p2.toString(";");

            // engineApi["setBounds"]( "116.287169;39.791031;116.507166;39.975638");
            engineApi["setCameraBounds"](bound, maxCameraHeight);
        };

        api.setMapRect = function(left, top, right, bottom) {
            engineApi["setMapRect"](left, top, right, bottom);
        }

        api.screenToGeographics = function(windowPos, geographicsPos) {
            return engineApi["screenToGeographics"](windowPos, geographicsPos);
        }


        //直接定位到输入的位置
        api.setLookAt = function(position3D) {
            engineApi["setLookAt"](position3D.longitude, position3D.latitude, position3D.altitude, position3D.heading, position3D.tilt, position3D.range);
        };
        //判断某个点是否在屏幕的可见范围内
        api.isVisible = function(point3D) {
            return engineApi["isVisible"](point3D.longitude, point3D.latitude, point3D.altitude);
        };

        //输入经纬高值返回相对网页的位ge置left,top
        api.geoToScreen = function(point3D) {
            var arr = engineApi["geoToScreen"](point3D.longitude, point3D.latitude, point3D.altitude);
            var scrm = api.createScreenPosition(arr[0], arr[1]);
            return scrm;
        };

        //输入网页相对位置返回在地球上的经纬高度
        api.screenToGeo = function(screenPosition) {
            var x = ~~(screenPosition.left||screenPosition.x);//*window.devicePixelRatio;
            var y = ~~(screenPosition.top||screenPosition.y);//*window.devicePixelRatio;
            var arr = engineApi["screenToGeo"](x,y);
            if (null === arr) return null;
            var geo = api.createPoint3D(arr[0], arr[1], arr[2]);
            return geo;
        };
        //为地球绑定事件，目前可用的事件是，“viewChange”当地球状态发生更改时触发绑定的回调函数
        api.on = function(eventName, cb) {
            if (!engineApi) return false;
            engineApi["registerEvent"](eventName, cb);
            return true;
        };

        //移除绑定的事件
        api.off = function(eventName) {
            if (!engineApi) return false;
            engineApi["removeEvent"](eventName);
        };

        //添加对象到地球上
        api.addToMap = function(wrapperObj) {
            if (!wrapperObj) return;
            var innerObj = engineApi['createObject'](wrapperObj);
            var objectInfo = wrapperObj["objectInfo"];
            // Label
            if (objectInfo["type"] === "Label") {
                objectInfo["setPosition"] = (function(inner, wrapper) {
                    return function(point3D) {
                        var pos = point3D.toString();
                        wrapper["objectInfo"]['position'] = pos;
                        inner.setPosition(point3D.longitude, point3D.latitude, point3D.altitude);
                    }
                })(innerObj, wrapperObj);
            }

            // Polygon
            if (objectInfo["type"] === "Polygon") {
                objectInfo["setPosition"] = (function(inner, wrapper) {
                    return function(point3D) {
                        var pos = point3D.toString();
                        wrapper['objectInfo']['position'] = pos;
                        inner.setPosition(point3D.longitude, point3D.latitude, point3D.altitude);
                    }
                })(innerObj, wrapperObj);

                objectInfo["setScale"] = (function(inner, wrapper) {
                    return function(point3D) {
                        var pos = point3D.toString();
                        wrapper['objectInfo']['scale'] == pos;
                        inner.setScale(point3D.longitude, point3D.latitude, point3D.altitude);
                    }
                })(innerObj, wrapperObj);

                objectInfo["setRotate"] = (function(inner, wrapper) {
                    return function(point3D) {
                        var pos = point3D.toString();
                        wrapper['objectInfo']['rotate'] = pos;
                        inner.setRotate(point3D.longitude, point3D.latitude, point3D.altitude);
                    }
                })(innerObj, wrapperObj);
            }

            objectInfo["set"] = (function(inner, wapper) {
                return function(keyValue) {
                    inner.set(keyValue);
                }
            })(innerObj, wrapperObj);

            objectInfo["get"] = (function(inner, wapper) {
                return function(key) {
                    return inner.get(key);
                }
            })(innerObj, wrapperObj);

            wrapperObj["setVisible"] = (function(inner, wapper) {
                return function(keyValue) {
                    inner.setVisible(keyValue);
                }
            })(innerObj, wrapperObj);
            wrapperObj["setHeightOffset"] = (function(inner, wapper) {
                return function(keyValue) {
                    inner.setHeightOffset(keyValue);
                }
            })(innerObj, wrapperObj);
        };

        //移除地球上的某个marker
        api.setObjectVisible = function(param) {
            return engineApi["setObjectVisible"](param);
        };

        api.setUserObjectAttribute = function(param) {
            return engineApi["setUserObjectAttribute"](param);
        };

        //移除地球上的某个marker
        api.removeMarker = function(id, label) {
            label = label || "Label";
            return engineApi["deleteObject"](label, id);
        };

        //删除指定的线条
        api.removePolyline = function(id, type) {
            type = type || "Polyline";
            engineApi["deleteObject"](type, id);
        };
        api.removePolygon = function(id, type) {
            type = type || "Polygon";
            engineApi["deleteObject"](type, id);
        };

        api.removeObject = function(obj) {
            if (obj.objectInfo.type === "Label") {
                api.removeMarker(obj.objectInfo.guid, obj.objectInfo.type);
            } else if (obj.objectInfo.type === "Polyline") {
                api.removePolyline(obj.objectInfo.guid, obj.objectInfo.type)
            } else if (obj.objectInfo.type === "Polygon") {
                api.removePolygon(obj.objectInfo.guid, obj.objectInfo.type)
            }
        }

        //更改显示高度
        api.changeHeight = function(delay, callback) {
            engineApi["changeHeight"](delay, callback);
        };

        api.changeViewMode = function() {
            return engineApi["changeTexture"]();
        };

        api.computeHeadingTilt = function(positionECEF, directionECEF, headingTilt) {
            return engineApi["computeHeadingTilt"](positionECEF, directionECEF, headingTilt);
        };
        api.showFPS = function(isShow) {

            var stats = new Stats();
            if (isShow === undefined || isShow === true) {
                stats.domElement.style.display = 'block';
                stats.domElement.style.position = 'absolute';
                stats.domElement.style.right = '0px';
                stats.domElement.style.top = '0px';
                document.body.appendChild(stats.domElement);
                engineApi.FPS(stats.begin, stats.end, stats);
            } else {
                stats.domElement.style.display = 'hidden';
            }
        }

        api.setCameraSpinEvent = function(callback) {
            engineApi["setCameraSpinEvent"](callback);
        }
        api.setCameraScaleEvent = function(callback) {
            engineApi["setCameraScaleEvent"](callback);
        }
        api.setCameraRotateEvent = function(callback) {
            engineApi["setCameraRotateEvent"](callback);
        }
        api.setCameraPinchEvent = function(callback) {
            engineApi["setCameraPinchEvent"](callback);
        }

        api.setMarkerEventEnable = function(d) {
            engineApi["setMarkerEventEnable"](d);
        }

        api.highlightMarkerById = function(id) {
            engineApi["highlightMarkerById"](id);
        }


        api.getCameraPose = function() {
            return engineApi["getCameraPose"]();
        }

        api.setRenderEnable = function(d) {
            engineApi["setRenderEnable"](d);
        }

        api.reRender = function(){
            engineApi["render"]();
        };

        api.setViewProjectMatrix = function(mat){
            engineApi["setViewProjectMatrix"](mat);
        };

        api.setCameraPosition = function(lng, lat, alt, heading, tilt){
            engineApi["setPosition"](lng, lat, alt, heading, tilt);
        };
        api.setMapBGColor = function(bgColor){
            if (bgColor instanceof Array) {
                var rp = 1/255;
                var normalColor = [bgColor[0]*rp,bgColor[1]*rp,bgColor[2]*rp];
                if(bgColor[3]){
                    normalColor.push(bgColor[3]); 
                }else{
                    normalColor.push(1); 
                }
                engineApi["setMapBgColor"](normalColor);
            } 
        };
        api.setExplodedView = function(data){
            engineApi["setExplodedView"](data);
        }

        api_utils.attatchUtils(api);
        engineApi.Create(canvasId, options);
        return api;
    };

    var addDomClass = function(containerId, newClassName){
        var containerdDom = document.getElementById(containerId);
        var className = containerdDom.className;
        var classNameArr = className.split(" ");
        if(classNameArr.indexOf(newClassName) ==-1){
            className && (className += " ");
            className += newClassName;//main_map_container
        }
        containerdDom.setAttribute("class",className);
    }
    WebMap3D.init = function(mapId, options, successCallback, failusCallback,canvasDom) {
        if (!api_utils.checkWebGL()) {
            api_utils.isExsitError.status = true;
            api_utils.isExsitError.error.code = 600;
            api_utils.isExsitError.error.message = '\u60a8\u7684\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u0077\u0065\u0062\u0047\u004c\u529f\u80fd'; //您的浏览器不支持webGL功能
            return false;
        }

        if (api_utils.isExsitError.status) {
            failusCallback(api_utils.isExsitError.error);
            return;
        };

        addDomClass(mapId, "main_map_container");

        var baseMapPath = options["baseMapPath"];

        var resourceList = [
            baseMapPath + "sdk/engine.min.js?version="+(window["version"]||""),
            baseMapPath + "css/map.css?version="+(window["version"]||"")
            ,baseMapPath + "css/control.css?version="+(window["version"]||"")
        ];
        window["onMapCreateReady"] = function(api){
            var engineApi = api;
            var sdk = createUserSDK(engineApi, mapId, options,canvasDom);
            successCallback && successCallback(sdk);
            // delete window["onMapCreateReady"];
        }
        api_utils.loadResources(resourceList);

        return true;
    };
    
}(window));