/***微信端：国家图书馆，定位到活动围栏区域内，弹出提示框
 * http://localhost:8081/app/navi_app/wechat_newstyle/index_fp2_B000A11DPJ.html?token=e687905252a13bdccaba9d9e9551a9d6&buildingId=B000A11DPJ
 * */
window["OnDXMapCreated"]=function(app,mapsdk){
    //由于初始化不能正确进入地图，在切换建筑列表时执行
    mapsdk.on("onIndoorBuildingActive",function(sender,bdInfo){
        var command = widget.utils.getParam();
        var main = {
            loadTrigger:function (){
                var thisObject = this;
                var t = new Date().getTime();
                var url = (window["projDataPath"]||'../../../data/{{token}}/{{bdid}}/{{filename}}').replace("{{token}}",command["token"]).replace("{{bdid}}",bdInfo.bdid).replace("{{filename}}","trigger.json")
                //'../example/data/1d7ff36ea19a939bc9d59e70579e7228/'+ bdInfo.bdid +'/trigger1.json?t=' + t;
                widget.service.getDataJsonViaBlob(url,function (geo){
                    var obj = {};
                    for(var fl in geo){
                        if(fl.indexOf("F") != -1){
                            var flname = "F" + fl.replace("F","");
                        }
                        if(fl.indexOf("B") != -1){
                            var flname = "B" + fl.replace("B","");
                        }
                        obj[flname] = geo[fl];
                    }
                    console.log(obj);
                    thisObject.GEO = obj;
                    thisObject.drawArea(obj)//显示围栏
                    // //TODO 模拟定位
                    // setTimeout(function (){
                    //     thisObject.getGeo({
                    //         position:[116.3238965,39.9429516],
                    //         floorId:"DX0004350110400001"
                    //     });
                    // },5000)
                    /*setTimeout(function (){
                        thisObject.getGeo({
                            position:[116.32386328314017,39.945140754399745],
                            floorId:"DX0004350110100001"
                        });
                    },8000)*/

                },function (err){

                })
            },
            getGeo(location){
                var thisObject = this;
                var currFloorId = location.floorId;
                if(currFloorId){
                    var bdid = location["bdid"]|| app._mapView._mapSDK.getCurrentBDID();
                    var currFloorInfo = app._mapView._mapSDK.getFloorInfo(bdid,currFloorId);
                    if(!currFloorInfo){
                        return;
                    }
                    var flname = currFloorInfo["flname"];
                    var pos = {"lon":location.position[0],"lat":location.position[1]};
                    if(thisObject.GEO && thisObject.GEO[flname]){
                        //var found = this.checkArea(thisObject.featuresArr,pos);
                        var found = this.checkArea(thisObject.GEO[flname].geofences.features,pos);
                        if(found && found != thisObject.isIn){
                            thisObject.isIn = found;
                            var str = '<div style="padding-bottom: 20px">';
                            if(found.properties.text){
                                str += `<div style="text-align: left"><div>${found.properties.text}</div>`
                            }
                            if(found.properties.time){
                                str += `<div style="margin-top: 5px">时间：${found.properties.time}</div>`;
                            }
                            if(found.properties.address){
                                str +=  `<div style="margin-top: 5px">地址：${found.properties.address}</div>`;
                            }
                            if(found.properties.tel){
                                str += `<div style="margin-top: 5px">电话：${found.properties.tel}</div></div>`;
                            }
                            str += "</div>"
                            DaxiApp.utils.modal.show({
                                img:"",
                                text:found.properties.NAME,
                                detail:str,
                                btnArr:["关闭"],
                                callback:function (index){
                                    if(index == 2){

                                    }
                                }
                            });

                        }
                    }
                }

            },
            checkArea:function(geo2,lonLat){
                var found;
                for (var i = geo2.length-1; i >= 0;i--) {
                    var mid = geo2[i]["properties"]["ID"];
                    var name = geo2[i]["properties"]["NAME"];
                    var description = geo2[i]["properties"]["DESCRIPTIO"];
                    var rfds = geo2[i];
                    if (rfds["geometry"]) {
                        var newArr = [];
                        rfds.geometry.coordinates[0].forEach(function (item) {
                            newArr.push([item[0], item[1]])
                        })
                        var inside = this.pointInPolygon([lonLat['lon'],lonLat['lat']],newArr);
                        if(inside){
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
                var inside = false;
                var polygonSize = polygon.length;
                var val1, val2
                for(var i = 0; i < polygonSize; i++){
                    var p1 = polygon[(i +  polygonSize)%polygonSize];
                    var p2 = polygon[(i + 1 + polygonSize)%polygonSize];
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
                var thisObject = this;
                for(var floor in geofences){
                    var features = geofences[floor].geofences.features;
                    features.forEach(function (item){
                        item.geometry.coordinates.forEach(function (areaPos) {
                            var newArr = [];
                            areaPos.forEach(function (item) {
                                //newArr.push([item[0]/3600, item[1]/3600])
                                newArr.push([item[0], item[1]])
                            });
                            item.geometry.coordinates[0] = newArr;
                        })
                        var featuresArr = [];
                        featuresArr.push(item);
                        thisObject.featuresArr = featuresArr;
                        thisObject.featuresFloorId = item.properties.FL_ID;
                        /*if(!window.extrusion){
                            window.extrusion = mapsdk.createPolygon(item.properties.FL_ID,featuresArr);
                        }else{
                            window.extrusion.setSource(featuresArr);
                        }*/
                        var polygon = mapsdk.createPolygon(bdInfo.bdid,item.properties.FL_ID,featuresArr,"#00ff33","#00F",0.5,"#00F");
                    })
                }
            },
            translatePoi:function (deptid,callback){
                var url = "https://map1a.daxicn.com/wx3dmap/getPoiInfo?type=1&deptids="+ deptid +"&token=1d7ff36ea19a939bc9d59e70579e7228&bdid=" + bdInfo.bdid;
                widget.service.getDataJsonViaBlob(url,function (res){
                    if(res.code == 1){
                        var poi = res.result[0].poiId;
                        callback && callback(poi);
                    }
                })
            },
            init:function (){
                var thisObject = this;
                if(!bdInfo){return;}
                thisObject.loadTrigger();


                app._mapView._locationManager.onLocationChanged(function (sender,loc){
                    if(loc.bdid){
                        thisObject.getGeo(loc);
                    }
                });

            }
        }
        main.init();
        window.main = main;
    })
};

