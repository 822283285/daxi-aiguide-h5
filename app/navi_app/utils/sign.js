/***微信端：安贞医院-朝阳院区/通州院区签到功能
 * http://localhost:8082/map/index.html?token=1d7ff36ea19a939bc9d59e70579e7228&bdid=B000A11DDU&userid=123&method=showPois&deptids=DX0001400210300022
 * https://map1a.daxicn.com/weixintest/daxiOneMap/map/index.html?token=1d7ff36ea19a939bc9d59e70579e7228&buildingId=B000A11DDU&userid=123&method=showPois&deptids=39&platform=web&wbrs=true
 * */
// window["OnDXMapCreated"]=function(app,mapsdk,locationManage){
window["OnDXMapCreated"]=function(app,mapsdk){
    //由于初始化不能正确进入地图，在切换建筑列表时执行
    mapsdk.on("onIndoorBuildingActive",function(sender,bdInfo){
        const command = widget.utils.getParam();
        const main = {;
            loadTrigger:function (){
                const thisObject = this;
                const t = new Date().getTime();
                const url = ('../../../data/{{token}}/{{bdid}}/{{filename}}').replace("{{token}}",command["token"]).replace("{{bdid}}",bdInfo.bdid).replace("{{filename}}","trigger.json");
                //'../example/data/1d7ff36ea19a939bc9d59e70579e7228/'+ bdInfo.bdid +'/trigger1.json?t=' + t;
                widget.service.getDataJsonViaBlob(url,function (geo){
                    const obj = {};
                    for(var fl in geo){
                        if(fl.indexOf("F") != -1){
                            const flname = "F" + fl.replace("F","");
                        }
                        if(fl.indexOf("B") != -1){
                            const flname = "B" + fl.replace("B","");
                        }
                        obj[flname] = geo[fl];
                    }
                    console.log(obj);
                    thisObject.drawArea(obj);
                },function (err){

                })
            },
            getGeo(location){
                const thisObject = this;
                const currFloorId = location.floorId;

                const pos = {"lon":location.position[0],"lat":location.position[1]};
                if(thisObject.featuresArr && thisObject.featuresFloorId == currFloorId){
                    //var found = this.checkArea(thisObject.featuresArr,pos);
                    const found = this.checkArea(thisObject.featuresArr,pos,command.deptids);
                    if(found){
                        thisObject.isIn = true;
                        widget.dom.showMask();
                        if(command.deptids == "1428" || command.deptids == "1133" || command.deptids == "1134"  || command.deptids == "1135"  || command.deptids == "1136"  || command.deptids == "1137"  || command.deptids == "1138"  || command.deptids == "1139"  || command.deptids == "1140"  || command.deptids == "1332"  || command.deptids == "1427"){//采血室弹出一维码
                            const str =  `<canvas id="barcode"></canvas><div>请使用此条码在自助机扫码报到</div>`;

                            widget.dom.showmsgbox3("",str,"取消","确认",function (){
                                wx.miniProgram.navigateBack()

                            });
                            JsBarcode("#barcode", command.userid, {
                                format: "CODE128", // 指定条形码的格式，例如："CODE128"
                                lineColor: "#000", // 条形码颜色
                                width: 2, // 条的宽度
                                height: 100, // 条形码的高度
                                displayValue: true // 是否在条形码下方显示文本
                            });
                            return
                        }

                        widget.dom.showmsgbox3("提示","您已进入报到区域，是否去报到","取消","去报到",function (){
                            const params = {;
                                isArrived:true,
                                userid:command.userid,
                                deptids:command.deptids,
                                queueId:command.queueId,
                                aztype:command.aztype,
                                hospitalId:command.hospitalId
                            };
                            // if(bdInfo.bdid == "B000A11DN8"){
                            //     alert("返回签到参数：" + JSON.stringify(params))
                            // }
                            wx.miniProgram.navigateTo({
                                url:"/pages/redirect/redirect?type=navigateBack&params="+ encodeURIComponent(JSON.stringify(params))
                            });

                        });
                    }
                }
            },
            /*checkArea:function(geo2,lonLat){
                const found;
                for (var i = geo2.length-1; i >= 0;i--) {
                    const mid = geo2[i]["properties"]["ID"];
                    const description = geo2[i]["properties"]["DESCRIPTIO"];
                    const rfds = geo2[i];
                    if (rfds["geometry"]) {
                        const newArr = [];
                        rfds.geometry.coordinates[0].forEach(function (item) {
                            newArr.push([item[0], item[1]])
                        })
                        const inside = this.pointInPolygon([lonLat['lon'],lonLat['lat']],newArr);
                        if(inside){
                            found = rfds;
                            break
                        }else{
                            found = null;
                        }
                    }
                }
                return found
            },*/
            checkArea:function(geo2,lonLat,id){
                const found;
                for (var i = geo2.length-1; i >= 0;i--) {
                    const mid = geo2[i]["properties"]["ID"];
                    const name = geo2[i]["properties"]["NAME"];
                    const description = geo2[i]["properties"]["DESCRIPTIO"];
                    const rfds = geo2[i];
                    if (rfds["geometry"]) {
                        const newArr = [];
                        rfds.geometry.coordinates[0].forEach(function (item) {
                            newArr.push([item[0], item[1]])
                        })
                        const inside = this.pointInPolygon([lonLat['lon'],lonLat['lat']],newArr);
                        if(inside && id == name){
                            found = rfds;
                            break
                        }else{
                            found = null;
                        }
                    }
                }
                return found
            },
            pointInPolygon(pos, polygon){
                const inside = false;
                const polygonSize = polygon.length;
                var val1, val2
                for(var i = 0; i < polygonSize; i++){
                    const p1 = polygon[(i +  polygonSize)%polygonSize];
                    const p2 = polygon[(i + 1 + polygonSize)%polygonSize];
                    if(pos[1] < p2[1]){
                        if(pos[1] >= p1[1]){
                            val1 = (pos[1] - p1[1]) * (p2[0] - p1[0]);
                            val2 = (pos[0] - p1[0]) * (p2[1] - p1[1]);
                            if(val1 > val2){
                                inside = ! inside;
                            }
                        }
                    }else if( pos[1] < p1[1]){
                        val1 = (pos[1] - p1[1]) * (p2[0] - p1[0]);
                        val2 = (pos[0] - p1[0]) * (p2[1] - p1[1]);
                        if(val1 < val2){
                            inside = ! inside;
                        }
                    }
                }
                return inside;
            },
            drawArea:function (geofences){
                const thisObject = this;
                for(var floor in geofences){
                    const features = geofences[floor].geofences.features;
                    features.forEach(function (item){
                        if(item.properties.NAME == command.deptids || item.properties.ID == command.deptids){
                            item.geometry.coordinates.forEach(function (areaPos) {
                                const newArr = [];
                                areaPos.forEach(function (item) {
                                    //newArr.push([item[0]/3600, item[1]/3600])
                                    newArr.push([item[0], item[1]])
                                });
                                item.geometry.coordinates[0] = newArr;
                            })
                            const featuresArr = [];
                            featuresArr.push(item);
                            thisObject.featuresArr = featuresArr;
                            thisObject.featuresFloorId = item.properties.FL_ID;
                            /*if(!window.extrusion){
                                window.extrusion = mapsdk.createPolygon(item.properties.FL_ID,featuresArr);
                            }else{
                                window.extrusion.setSource(featuresArr);
                            }*/
                            const polygon = mapsdk.createPolygon(bdInfo.bdid,item.properties.FL_ID,featuresArr,"#00ff33","#00F",0.5,"#00F");
                        }
                    })
                }
            },
            translatePoi:function (deptid,callback){
                const url = `https://map1a.daxicn.com/wx3dmap/getPoiInfo?type=1&deptids=${deptid}&token=1d7ff36ea19a939bc9d59e70579e7228&bdid=` + bdInfo.bdid;
                widget.service.getDataJsonViaBlob(url,function (res){
                    if(res.code == 1){
                        const poi = res.result[0].poiId;
                        callback && callback(poi);
                    }
                })
            },
            init:function (){
                const thisObject = this;
                //     if(command.buildingId == "B000A11DDU"){
                //         var lunyiPois = ["DX0001400610100149"]; //轮椅POI导航结束打开扫码
                //         mapsdk.on("navigationFinished",function (sender,data){
                // widget.dom.showInfo('导航结束!' + JSON.stringify(sender));
                //             var poiId = data.poiId;
                //             if(lunyiPois.indexOf(poiId) != -1){
                //                 wx.scanQRCode({
                //                     needResult: 0,// 默认为0，扫描结果由微信处理，1则直接返回扫描结果，
                //                     scanType: ["qrCode","barCode"],// 可以指定扫二维码还是一维码，默认二者都有
                //                     success: function (res) {
                //                         // 当needResult 为 1 时，扫码返回的结果
                //                         let result = res.resultStr;
                //                     },
                //                     fail : function(res) {
                //                         widget.dom.showInfo('扫描失败!'+res.errMsg);
                //                     }
                //                 });
                //             }
                //         })
                //     }
                if(!bdInfo){return;}
                if(!command.buildingId == bdInfo.bdid || !command.userid || !command.deptids){
                    return
                }
                //thisObject.translatePoi(command.deptids,function (poi){
                //command.deptids = poi;
                thisObject.loadTrigger();
                app._mapView._locationManager.onLocationChanged(function (sender,loc){
                    if(thisObject.isIn){//已经签到弹框
                        // if(loc.bdid == "B000A11DN8"){
                        //     widget.dom.showInfo("已经弹出过签到，不再弹出")
                        // }
                        return
                    }
                    if(loc.bdid){
                        thisObject.getGeo(loc);
                    }
                });
                // mapsdk._eventMgr.eventMap.onLocationChanged.addEventHandler(function (loc,loc2){
                //     if(thisObject.isIn){//已经签到弹框
                //         return
                //     }
                //     if(loc2.code == "220" && loc2.location.bdid){
                //         thisObject.getGeo(loc2.location);
                //     }
                // });
                //});
                // 测试
                if(command.deptids == "654321"){
                    widget.dom.showInfo("15s后返回医院小程序");
                    /* var path = decodeURIComponent(command.userid).returnUrl;
                     const appid = "wx8cba48afd6f286c5";
                     wx.miniProgram.navigateTo({
                         url:`/pages/redirect/redirect?type=navigateTo&appid=${appid}&path=` + encodeURIComponent(path)
                     })
                     */
                    setTimeout(function (){
                        widget.dom.showMask();
                        widget.dom.showmsgbox3("提示","您已进入报到区域，是否去报到","取消","去报到",function (){
                            const params = {;
                                isArrived:true,
                                userid:command.userid,
                                deptids:command.deptids,
                                queueId:command.queueId,
                                aztype:command.aztype,
                                hospitalId:command.hospitalId
                            };
                            wx.miniProgram.navigateTo({
                                url:"/pages/redirect/redirect?type=navigateBack&params="+ encodeURIComponent(JSON.stringify(params))
                            });

                        });
                    },15000);
                }
            }
        }
        main.init();
        window.main = main;
    })
};

