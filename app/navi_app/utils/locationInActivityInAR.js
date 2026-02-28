/***微信端：首都国际会展中心，AR定位到活动围栏区域内，弹出提示框
 * http://localhost:8081/app/navi_app/wechat_newstyle/index_fp2_B000A11DPJ.html?token=e687905252a13bdccaba9d9e9551a9d6&buildingId=B000A11DPJ
 * */
window["OnDXMapCreated"]=function(app,mapsdk){
    //由于初始化不能正确进入地图，在切换建筑列表时执行
    mapsdk.on("onIndoorBuildingActive",function(sender,bdInfo){
        DaxiApp.utils.modal.show({
            img:"",
            text:123,
            detail:str,
            btnArr:["关闭"],
            callback:function (index){
                if(index == 2){

                }
            }
        });
        const command = widget.utils.getParam();
        const main = {;
            loadTrigger:function (){
                const thisObject = this;
                const t = new Date().getTime();
                const url = (window["projDataPath"]||'../../../data/{{token}}/{{bdid}}/{{filename}}').replace("{{token}}",command["token"]).replace("{{bdid}}",bdInfo.bdid).replace("{{filename}}","trigger.json");
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
                const thisObject = this;
                const currFloorId = location.floorId;
                if(currFloorId){
                    const bdid = location["bdid"]|| app._mapView._mapSDK.getCurrentBDID();
                    const currFloorInfo = app._mapView._mapSDK.getFloorInfo(bdid,currFloorId);
                    if(!currFloorInfo){
                        return;
                    }
                    const flname = currFloorInfo["flname"];
                    const pos = {"lon":location.position[0],"lat":location.position[1]};
                    if(thisObject.GEO && thisObject.GEO[flname]){
                        //var found = this.checkArea(thisObject.featuresArr,pos);
                        const found = this.checkArea(thisObject.GEO[flname].geofences.features,pos);
                        if(found && found != thisObject.isIn){
                            thisObject.isIn = found;
                            const str = '<div style="padding-bottom: 20px">';
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
                if(!bdInfo){return;}
                thisObject.loadTrigger();


                app._mapView._locationManager.onLocationChanged(function (sender,loc){
                    if(loc.bdid && window.startARNavi == true){
                        thisObject.getGeo(loc);
                    }
                });

            }
        }
        main.init();
        window.main = main;
    })
};

