/**
 * 微信端：上海市浦东新区浦南医院签到功能
 * 业务流程：传deptids、userid，进到签到区域后，调用签到接口，然后跳转签到完成页
 * http://localhost:8081/app/navi_app/wechat_newstyle/index_fp2.html?token=282c08d46261ef02ee203f7cb1323c23&buildingId=B000A11DQE&deptids=1035&method=showPois&userid=1235
 */
window["OnDXMapCreated"] = function (app, mapsdk) {
  //由于初始化不能正确进入地图，在切换建筑列表时执行
  mapsdk.on("onIndoorBuildingActive", function (sender, bdInfo) {
    var command = widget.utils.getParam();
    var main = {
      loadTrigger: function () {
        var thisObject = this;
        var t = new Date().getTime();
        var url = "../../../data/{{token}}/{{bdid}}/{{filename}}"
          .replace("{{token}}", command["token"])
          .replace("{{bdid}}", bdInfo.bdid)
          .replace("{{filename}}", "trigger.json");
        widget.service.getDataJsonViaBlob(
          url,
          function (geo) {
            var obj = {};
            for (var fl in geo) {
              if (fl.indexOf("F") != -1) {
                var flname = "F" + fl.replace("F", "");
              }
              if (fl.indexOf("B") != -1) {
                var flname = "B" + fl.replace("B", "");
              }
              obj[flname] = geo[fl];
            }
            console.log(obj);
            thisObject.drawArea(obj);
          },
          function (err) {},
        );
      },
      getGeo(location) {
        var thisObject = this;
        var currFloorId = location.floorId;

        var pos = { lon: location.position[0], lat: location.position[1] };
        if (thisObject.featuresArr && thisObject.featuresFloorId == currFloorId) {
          //var found = this.checkArea(thisObject.featuresArr,pos);
          var found = this.checkArea(thisObject.featuresArr, pos, command.deptids);
          if (found) {
            thisObject.isIn = true;
            widget.dom.showMask();
            widget.dom.showmsgbox3("提示", "您已进入报到区域，是否去报到", "取消", "去报到", function () {
              //TODO 调用签到接口
              var url = "https://map1a.daxicn.com/shpnyy/CheckIn";
              widget.service.getDataByFormData(
                url,
                {
                  keyValue: { queue_id: command.userid },
                },
                function (res) {
                  widget.dom.showInfo(res.msg, 2000);
                  setTimeout(function () {
                    window.location.href =
                      "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx784ac2305735e6b7&redirect_uri=https://weixin.ngarihealth.com/weixin/wx/mp/wx784ac2305735e6b7/index.html?module=queueNumber&source=wx_menu&response_type=code&scope=snsapi_base&state=STATE&connect_redirect=1#wechat_redirect";
                  }, 2000);
                },
              );
            });
          }
        }
      },
      checkArea: function (geo2, lonLat, id) {
        var found;
        for (var i = geo2.length - 1; i >= 0; i--) {
          var mid = geo2[i]["properties"]["ID"];
          var name = geo2[i]["properties"]["NAME"];
          var description = geo2[i]["properties"]["DESCRIPTIO"];
          var rfds = geo2[i];
          if (rfds["geometry"]) {
            var newArr = [];
            rfds.geometry.coordinates[0].forEach(function (item) {
              newArr.push([item[0], item[1]]);
            });
            var inside = this.pointInPolygon([lonLat["lon"], lonLat["lat"]], newArr);
            if (inside && id == name) {
              found = rfds;
              break;
            } else {
              found = null;
            }
          }
        }
        return found;
      },
      pointInPolygon(pos, polygon) {
        var inside = false;
        var polygonSize = polygon.length;
        var val1, val2;
        for (var i = 0; i < polygonSize; i++) {
          var p1 = polygon[(i + polygonSize) % polygonSize];
          var p2 = polygon[(i + 1 + polygonSize) % polygonSize];
          if (pos[1] < p2[1]) {
            if (pos[1] >= p1[1]) {
              val1 = (pos[1] - p1[1]) * (p2[0] - p1[0]);
              val2 = (pos[0] - p1[0]) * (p2[1] - p1[1]);
              if (val1 > val2) {
                inside = !inside;
              }
            }
          } else if (pos[1] < p1[1]) {
            val1 = (pos[1] - p1[1]) * (p2[0] - p1[0]);
            val2 = (pos[0] - p1[0]) * (p2[1] - p1[1]);
            if (val1 < val2) {
              inside = !inside;
            }
          }
        }
        return inside;
      },
      drawArea: function (geofences) {
        var thisObject = this;
        for (var floor in geofences) {
          var features = geofences[floor].geofences.features;
          features.forEach(function (item) {
            if (item.properties.NAME == command.deptids || item.properties.ID == command.deptids) {
              item.geometry.coordinates.forEach(function (areaPos) {
                var newArr = [];
                areaPos.forEach(function (item) {
                  //newArr.push([item[0]/3600, item[1]/3600])
                  newArr.push([item[0], item[1]]);
                });
                item.geometry.coordinates[0] = newArr;
              });
              var featuresArr = [];
              featuresArr.push(item);
              thisObject.featuresArr = featuresArr;
              thisObject.featuresFloorId = item.properties.FL_ID;
              var polygon = mapsdk.createPolygon(bdInfo.bdid, item.properties.FL_ID, featuresArr, "#00ff33", "#00F", 0.5, "#00F");
            }
          });
        }
      },
      init: function () {
        var thisObject = this;
        if (!bdInfo) {
          return;
        }
        if (!command.buildingId == bdInfo.bdid || !command.userid || !command.deptids) {
          return;
        }
        thisObject.loadTrigger();
        app._mapView._locationManager.onLocationChanged(function (sender, loc) {
          if (thisObject.isIn) {
            //已经签到弹框
            return;
          }
          if (loc.bdid) {
            thisObject.getGeo(loc);
          }
        });
        if (command.deptids == "654321") {
          widget.dom.showInfo("15s后进入签到页");
          setTimeout(function () {
            widget.dom.showMask();
            widget.dom.showmsgbox3("提示", "您已进入报到区域，是否去报到", "取消", "去报到", function () {
              //TODO 调用签到接口
              var url = "https://map1a.daxicn.com/shpnyy/CheckIn";
              widget.service.getDataByFormData(
                url,
                {
                  keyValue: JSON.stringify({ queue_id: command.userid }),
                },
                function (res) {
                  widget.dom.showInfo(res.msg, 2000);
                  setTimeout(function () {
                    window.location.href =
                      "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx784ac2305735e6b7&redirect_uri=https://weixin.ngarihealth.com/weixin/wx/mp/wx784ac2305735e6b7/index.html?module=queueNumber&source=wx_menu&response_type=code&scope=snsapi_base&state=STATE&connect_redirect=1#wechat_redirect";
                  }, 2000);
                },
              );
            });
          }, 15000);
        }
      },
    };
    main.init();
    window.main = main;
  });
};
