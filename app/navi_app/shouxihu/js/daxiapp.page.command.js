(function (global) {
  function initDaxiCommand(api, options) {
    const daxiapp = global["DaxiApp"] || {};
    const domUtils = daxiapp["domUtil"];
    const dxUtils = daxiapp["utils"];
    const dxDom = daxiapp["dom"];
    const getFloatVal = dxUtils["getFloatVal"];
    const downloader = api.downloader;
    const stateManager = api._stateManager;
    const thisObject = {};
    const mapSDK = api._mapView._mapSDK;
    const token = api._params["token"];
    const command = api._params;
    thisObject._dom = $("#app");
    if (options["pages"]) {
      options["pages"].forEach(function (pageOptions) {
        const stateName = pageOptions["stateName"];
        const stateClassName = pageOptions["stateClassName"];
        const stateIns = new daxiapp[stateClassName]();
        stateIns.initialize(api, api._dom);
        stateManager.registState(stateName, stateIns);
      });
    }
    window.locWebSocketOnGetEvent = function (obj) {
      if (!obj["id"]) {
        command["id"] == "";
      }
      for (var key in obj) {
        command[key] = obj[key];
      }
      const stateName = api._stateManager.getCurrentStateName();
      if (command["method"] == "showExhibit") {
        if (stateName == "MapStatePoiDetail" || stateName == "MapStateBrowse") {
          if (command.id) {
            command.comefrom = "webSocket";
          }
          command.viewState = "showExhibit";
          thisObject.runCommand(command);
        } else if (stateName == "MapStateVisitNavi") {
          command.viewState = "MapStateVisitNavi";
          api._stateManager.getCurrentState().runCommand(command);
        } else if (stateName == "MapStateExhibitionRoute") {
          command.viewState = "MapStateExhibitionRoute";
          api._stateManager.getCurrentState().runCommand(command, obj["id"]);
        }
      } else if (command["method"] == "showAreaInTip") {
        const bdid = mapSDK.getCurrentBDID();
        const areaIn = api._dom.find(".areaIn");
        function hideAreaInTip() {
          thisObject.areaInBtn.removeClass("slideUpTip").addClass("slideUpTipOut");
          setTimeout(function () {
            thisObject.areaInBtn.remove();
          }, 1000);
        }
        if (areaIn.length == 0) {
          const text = `欢迎进入${command["scenicName"]}景点，畅享智慧语音讲解。点击“购买”，解锁景区全域畅听。`;
          areaIn = `<div class='areaIn'> <div class='areaInText'>${text}</div><div class='button_tipBuy'>购买</div></div>`;
          api._dom.append(areaIn);
          thisObject.areaInBtn = dxDom.find(api._dom, ".areaIn");
          thisObject.areaInBtn.addClass("slideUpTip");
        } else {
          thisObject.areaInBtn = dxDom.find(api._dom, ".areaIn");
          thisObject.areaInText = dxDom.find(api._dom, ".areaInText");
          thisObject.areaInBtn.removeClass("slideUpTip").addClass("slideUpTipOut");
          setTimeout(function () {
            const text = `欢迎进入${command["scenicName"]}景点，畅享智慧语音讲解。点击“购买”，解锁景区全域畅听。`;
            thisObject.areaInText.text(text);
            thisObject.areaInBtn.addClass("slideUpTip");
          }, 1000);
        }
        if (thisObject.areaTimer) {
          clearTimeout(thisObject.areaTimer);
        }
        thisObject.areaTimer = setTimeout(hideAreaInTip, 10000);
        thisObject.btn_tipBuy = dxDom.find(api._dom, ".button_tipBuy");
        thisObject.btn_tipBuy.on("click", function () {
          hideAreaInTip();
          if (thisObject.areaTimer) {
            clearTimeout(thisObject.areaTimer);
          }
          thisObject.getProduct(function () {
            thisObject._payAlertComponent.updateData(thisObject.productList);
          });
        });
      } else if (stateName == "MapStateExhibitionRoute") {
        api._stateManager.getCurrentState().runCommand(command);
      } else if (command["method"] == "audioStatus") {
        if (command["status"] == "onStop") {
          const audioPlayBtn = api._dom.find(".audioPlay");
          if (audioPlayBtn.length == 0) {
            audioPlayBtn = `<div class='audioPlay'><i class='btn_playAudio shouxihu_playbtn'></i><i class='btn_closeAudio icon-guanbi'></i></div>`;
            api._dom.append(audioPlayBtn);
          }
          thisObject.audioPlayBtn = dxDom.find(api._dom, ".audioPlay");
          thisObject.btn_playAudio = dxDom.find(api._dom, ".btn_playAudio");
          thisObject.btn_closeAudio = dxDom.find(api._dom, ".btn_closeAudio");
          thisObject.btn_playAudio.on("click", function () {
            const data = {
              type: "postEventToMiniProgram",
              id: api._params["userId"],
              methodToMiniProgram: `method=resumePlay&bdid=${api._params.bdid}&token=${api._params.token}`,
              roleType: "receiver",
            };
            window["locWebSocketPostMessage"] && window["locWebSocketPostMessage"](data);
            thisObject.audioPlayBtn.hide();
          });
          thisObject.btn_closeAudio.on("click", function () {
            thisObject.audioPlayBtn.hide();
          });
          thisObject.audioPlayBtn.show();
        } else {
          thisObject.audioPlayBtn = dxDom.find(api._dom, ".audioPlay");
          thisObject.audioPlayBtn.hide();
        }
      } else if (command["method"] == "paySuccessEvent") {
        if (thisObject.productList) {
          thisObject.productList.productTitle = "支付成功";
          thisObject._paysuccessComponent.updateData(thisObject.productList);
        } else {
          thisObject.getProduct(function () {
            thisObject.productList.productTitle = "支付成功";
            thisObject._paysuccessComponent.updateData(thisObject.productList);
          });
        }
        if (command["viewState"] == "MapStateExhibitionRoute") {
          stateManager.pushState("MapStateExhibitionRoute", command);
        }
      } else {
        thisObject.runCommand(command);
      }
    };
    thisObject.openBrowseMapSate = function (command) {
      stateManager.pushState("MapStateBrowse", command);
    };
    thisObject.openPoiState = function (command) {
      const currbdid = mapSDK["getCurrentBDID"]();
      const currflid = mapSDK["getCurrentFloorId"]();
      const position = mapSDK["getPosition"]();
      const keyword = command["keyword"];
      const bdid = command["bdid"] || command["buildingId"] || currbdid || "";
      const floorId = command["floorId"] || currflid || "";
      const lon = getFloatVal(command["lon"]);
      const lat = getFloatVal(command["lat"]);
      const bdInfo = null;
      if (!bdid) {
        const bdInfoData = api._mapView.getCurrIndoorBuilding();
        if (bdInfoData && bdInfoData["bdInfo"]) {
          bdInfo = bdInfoData["bdInfo"];
          bdid = bdInfo["bdid"];
        }
      }

      floorId = floorId || (bdInfo && bdInfo["groundFloorId"]);
      const poiId = command["poiId"];
      const poiIds = command["poiIds"];
      const deptids = command["deptids"] || command["targetID"];
      const text = command["text"] || command["name"] || "";
      const data;
      const arealType = "indoor";
      if (poiIds && poiIds.indexOf(",") == -1) {
        poiId = poiIds;
      }
      const thisObject = this;
      if (deptids) {
        // 搜索诊间数据
        const url = api._config["clinicServer"] || "https://map1a.daxicn.com/wx3dmap/getPoiInfo";
        const data = { type: 1, deptids: deptids, token: token, bdid: bdid };
        downloader.getServiceData(
          url,
          "get",
          "json",
          data,
          function (data) {
            if (data["code"] == 1 && data["result"].length) {
              const param = {
                method: "showPois",
                arealType: "indoor",
                results: data["result"],
              };
              thisObject.setIndoorVisible(data["result"]);
              stateManager.pushState("MapStatePoi", param);
            } else {
              domUtils.tipNotice(data["errMsg"] || "没有查到配置数据", 3000, null, { subStyle: { color: "#1f97ef" } });
            }
          },
          function () {
            domUtils.tipNotice("诊间数据匹配失败", 3000, null, { subStyle: { color: "#1f97ef" } });
          },
          true
        );
      } else if (keyword || poiIds) {
        if (bdid) {
          arealType = "indoor";
          data = {
            bdid: bdid,
            floorId: floorId,
            arealType: arealType,
            method: "showPois",
            keyword: keyword,
            type: arealType == "indoor" ? 1 : 11,
            token: token,
          };
        } else {
          arealType = "outdoor";
          data = {
            bdid: "",
            arealType: arealType,
            method: "showPois",
            keyword: keyword,
            type: arealType == "indoor" ? 1 : 11,
            token: token,
          };
        }
        if (lon && lat) {
          data["location"] = `${lon},${lat}`;
        }
        if (poiIds) {
          data["poiIds"] = poiIds;
        }
        if (command["location"]) {
          data["location"] = command["location"];
        }
        if (command["text"]) {
          data["text"] = command["text"];
        }
        if (command["searchType"]) {
          data["searchType"] = command["searchType"];
        }
        thisObject.setIndoorVisible(data);
        stateManager.pushState("MapStatePoi", data);
      } else if ((text && lon && lat) || poiId) {
        command["id"] = poiId;
        data = daxiapp.utils.copyData(command);
        thisObject.setIndoorVisible(command);
        thisObject.openPoiDetailState(data);
      } else {
        // tip 参数不合法
        domUtils.tipNotice("参数不完整", 3000, null, { subStyle: { color: "#1f97ef" } });
        return;
      }
    };
    thisObject.openPoiDetailState = function (command) {
      const currbdid = mapSDK["getCurrentBDID"]();
      var poiInfo = command; //daxiapp.utils.copyData(command);
      poiInfo["arealType"] = command["arealType"] || "indoor";
      poiInfo["text"] = command["text"] || command["name"] || "";
      poiInfo["bdid"] = command["bdid"] || command["buildingId"] || currbdid || "";
      poiInfo["id"] = command["poiId"] = command["poiId"] || command["id"] || "";
      poiInfo["floorId"] = command["floorId"] || "";
      poiInfo["floorName"] = command["floorName"] || "";
      const lon = command["lon"],;
        lat = command["lat"];
      poiInfo["lon"] = lon && getFloatVal(lon);
      poiInfo["lat"] = lat && getFloatVal(lat);
      poiInfo["address"] = command["address"] || "";
      poiInfo["distance"] = command["distance"] || "";
      if (!lon && command["position"]) {
        lon = command["position"][0];
        lat = command["position"][1];
      }
      if (lon && lat) {
        const data = {
          method: "openPoiDetailPage",
          data: {
            bdid: poiInfo["bdid"],
            arealType: poiInfo["arealType"],
            poiInfo: poiInfo,
          },
        };
        this.setIndoorVisible(poiInfo);
        stateManager.pushState("MapStatePoiDetail", data);
      } else if (poiInfo["id"]) {
        const searchUrl = api._config["search"]["url"];
        api.downloader.getServiceData(
          searchUrl,
          "post",
          "json",
          { token: api._params["token"], bdid: poiInfo["bdid"], ids: [poiInfo["id"]], type: poiInfo["type"] },
          function (data) {
            const params = data.length > 0 ? data[0] : null;
            if (params) {
              stateManager.pushState("MapStatePoiDetail", { data: { poiInfo: params } });
            } else {
              //提示没有查到相关数据
              // tip 参数不合法
              domUtils.tipNotice("没有查到相关数据", 3000, null, { subStyle: { color: "#1f97ef" } });
              return;
            }
          }
        );
      } else {
        // tip 参数不合法
        domUtils.tipNotice("参数不完整", 3000, null, { subStyle: { color: "#1f97ef" } });
        return;
      }
    };
    thisObject.openExhibitionHall = function (command) {
      const exhibitionId = command["id"] || command["poiId"];
      const exhibitionUrl = api._config["exhibitionDetailUrl"];
      if (exhibitionUrl) {
        api.downloader.getServiceData(exhibitionUrl + "/" + exhibitionId, "get", "json", { token: api._params["token"] }, function (data) {
          const params = data["result"];
          if (params) {
            stateManager.pushState("MapStatePoiDetail", { data: { poiInfo: params } });
          } else {
            //提示没有查到相关数据
          }
        });
      }
    };
    thisObject.openExhibit = function (command) {
      const exhibitId = command?.id || command?.poiId || command?.poiIds;
      this.setIndoorVisible(command);

      const exhibitions = (stateManager.getMapState("MapStateBrowse") || {}).exhibitions || [];
      const exhibition = exhibitions.find(function (item) {;
        return item.id2 == exhibitId;
      });

      if (exhibition) {
        stateManager.pushState("MapStatePoiDetail", { data: { poiInfo: exhibition } });
      }
    };
    thisObject.openRouteState = function (command) {
      const startbdid = command["startbdid"] || command["bdid"];
      const startFloorId = command["startFloorId"] || "";
      const startLon = getFloatVal(command["startLon"]);
      const startLat = getFloatVal(command["startLat"]);
      const startName = command["startName"] || "起点";
      const startAddress = command["startAddress"] || "";
      const startPoseMode = command["startPosMode"] || "";
      const startPoint = {
        bdid: startbdid,
        floorId: startFloorId,
        lon: startLon,
        lat: startLat,
        name: startName,
        address: startAddress,
        posMode: startPoseMode,
      };

      const targetbdid = command["targetbdid"] || command["bdid"];
      const targetFloorId = command["targetFloorId"] || "";
      const targetLon = getFloatVal(command["targetLon"]);
      const targetLat = getFloatVal(command["targetLat"]);
      const targetName = command["targetName"] || "终点";
      const targetFloorName = command["targetFloorName"] || "";
      const targetAddress = command["targetAddress"] || "";
      const targetPoseMode = command["targetPosMode"] || "";
      const deptids = command["deptids"] || command["targetID"];
      const targetPoint = {
        bdid: targetbdid,
        floorId: targetFloorId,
        lon: targetLon,
        lat: targetLat,
        name: targetName,
        address: targetAddress,
        posMode: targetPoseMode,
        floorName: targetFloorName,
      };
      const param = {
        method: "takeToThere",
        endPoint: targetPoint,
        startPoint: startPoint, //定位起点信息
      };
      const loadingMask = domUtils.createLoading();
      const startPosReady = startLon && startLat ? true : false;
      const targetPosReady = false;
      if (targetLon && targetLat) {
        targetPosReady = true;
        if (startPoint["posMode"] == "myPosition" && !startPosReady) {
          thisObject.getMyPosition(startbdid, waitPosShowRoute);
        } else {
          stateManager.pushState("MapStateRoute", param);
          loadingMask.remove();
        }
      } else if (targetbdid && deptids) {
        if (startPoint["posMode"] == "myPosition" && !startPosReady) {
          thisObject.getMyPosition(startbdid, waitPosShowRoute);
        }
        // 搜索诊间数据
        const url = api._config["clinicServer"] || "https://map1a.daxicn.com/wx3dmap/getPoiInfo";
        const data = { type: 1, deptids: deptids, token: token, bdid: targetPoint["bdid"] };
        DXMapUtils.getData(
          url,
          data,
          "json",
          function (data) {
            if (data["code"] == 1 && data["result"].length) {
              targetPosReady = true;
              const poiInfo = data["result"][0];
              targetPoint["lon"] = poiInfo["lon"];
              targetPoint["lat"] = poiInfo["lat"];
              targetPoint["floorId"] = poiInfo["floorId"];
              targetPoint["name"] = poiInfo["name"] || poiInfo["text"];
              targetPoint["address"] = poiInfo["address"];
              if (startPosReady && targetPosReady) {
                stateManager.pushState("MapStateRoute", param);
                loadingMask && (loadingMask.remove(), (loadingMask = null));
              }
            } else {
              domUtils.tipNotice(data["errMsg"] || "没有查到配置数据", 3000, null, { subStyle: { color: "#1f97ef" }, bottom: "30%" });
              loadingMask && (loadingMask.remove(), (loadingMask = null));
            }
          },
          function () {
            domUtils.tipNotice("诊间数据匹配失败", 3000, null, { subStyle: { color: "#1f97ef" }, bottom: "30%" });
            loadingMask && (loadingMask.remove(), (loadingMask = null));
          },
          true
        );
      } else {
        // tip 参数不合法
        domUtils.tipNotice("参数不完整", 3000, null, { subStyle: { color: "#1f97ef" }, bottom: "30%" });
        loadingMask.remove();
        return;
      }
      function waitPosShowRoute(posInfo, locSuccess) {
        startPosReady = true;
        const pos = posInfo["position"];
        if (locSuccess) {
          startPoint["lon"] = pos[0];
          startPoint["lat"] = pos[1];
          startPoint["bdid"] = posInfo["bdid"];
          startPoint["floorId"] = posInfo["floorId"];
          startPoint["name"] = "我的位置";
        } else {
          loadingMask && (loadingMask.remove(), (loadingMask = null));
          if (pos[0]) {
            const text = "未定位到建筑位置,请自行选择起点";
          } else {
            const text = "定位信号弱,请自行选择起点";
          }
          domUtils.tipNotice(text, 3000, null, { subStyle: { color: "#1f97ef" }, bottom: "30%" });
        }
        if (startPosReady && targetPosReady) {
          stateManager.pushState("MapStateRoute", param);
          loadingMask && (loadingMask.remove(), (loadingMask = null));
        }
      }
    };
    thisObject.openPoiExtendState = function (command) {
      stateManager.pushState("MapStatePoiExtend", command);
    };
    thisObject.openPoiPageState = function (command) {
      const bdid = command["buildingId"] || "";
      this.setIndoorVisible(command);
      stateManager.pushState("MapStateMainPoiPage", { data: { bdid: bdid } });
    };
    thisObject.openSharePosState = function (command) {
      // MapStateSharePos
      stateManager.pushState("MapStateSharePos", {});
    };
    thisObject.openTeamSharePosState = function (command) {
      if (api._config["user"]["sharePosServer"]) {
        const MapStateBrowse = stateManager.getMapState("MapStateBrowse");
        MapStateBrowse._sharePosCtrl.triggerEvent("click");
      } else {
        domUtils.tipMessage("没有配置共享", 3000);
      }
    };
    thisObject.openPayPage = function (command) {
      stateManager.pushState("PayPage", command);
    };
    thisObject.openExhibitionRoutePage = function (command) {
      stateManager.pushState("MapStateExhibitionRoute", command);
    };
    thisObject.getMyPosition = function (bdid, callback) {};
    thisObject.addPosShareGroup = function (command) {
      const params = api._params;
      const userInfo = params["userInfo"];
      if (!userInfo["userId"]) {
        domUtils.showInfo("缺少用户参数");
        return;
      }

      if (!userInfo["userName"] || !userInfo["avatarUrl"]) {
        daxiapp["common"]["getUserInfo"]({
          url: api._config["user"]["userServerUrl"],
          data: {
            userId: userInfo["userId"],
            projScene: params["projScene"] || "wechat",
          },
          successCB: function (data) {
            userInfo["avatarUrl"] = data["avatarUrl"];
            userInfo["userName"] = data["username"];
            thisObject.openPosShareState(userInfo, command["groupId"], params["token"]);
          },
          failedCB: function () {
            api.jsBridge.toUserPage(command);
          },
        });
      }
    };
    thisObject.openPosShareState = function (userInfo, groupId, token) {
      const sharePosServer = api._config["user"]["sharePosServer"];
      const url = sharePosServer[sharePosServer.length - 1] == "/" ? sharePosServer + "postPosition" : sharePosServer + "/postPosition";

      const locPosition = api._mapView._locationManager.getMyPositionInfo();
      const data = {
        userId: userInfo["userId"] || "",
        userName: userInfo["userName"] || "",
        avatarUrl: userInfo["avatarUrl"] || "",
        token: token || "",
        bdid: locPosition["bdid"] || "",
        floorId: locPosition["floorId"] || "",
        lng: locPosition["position"][0] || "",
        lat: locPosition["position"][1] || "",
        groupId: groupId,
      };
      dxUtils.getDataBySecurityRequest(
        url,
        "post",
        data,
        function (result) {
          if (result["ret"] == "OK") {
            result["userId"] = data["userId"];
            api._stateManager.pushState("MapStateShareGroup", { data: userInfo, members: result["members"], groupId: groupId });
            // page._once("shareGroupCallback", function(sender, searchResult){
            //     app._stateManager.goBack();
            // });
          } else {
            domUtils.dialog({
              text: result["msg"] || result["errMsg"] || "加入队伍异常,请稍后再试",
            });
          }
        },
        function (err) {
          domUtils.dialog({
            text: err.toString(),
          });
        }
      );
    };
    thisObject.exitMapModal = null;
    thisObject.runCommand = function (command) {
      const viewState = command["method"] || command["viewState"] || "init";
      switch (viewState) {
        case "init":
        case "initPage":
        case "MapStateBrowse":
          thisObject.openBrowseMapSate(command);
          break;
        case "showExhibition":
          thisObject.openExhibitionHall(command);
          break;
        case "showExhibit":
          thisObject.openExhibit(command);
          break;
        case "showPois":
          thisObject.openPoiState(command);
          break;
        case "showPoiDetail":
          thisObject.openPoiDetailState(command);
          break;
        case "showExtraPoi":
          thisObject.openPoiDetailState(command);
          break;
        case "showRoute":
        case "takeToThere":
          thisObject.openRouteState(command);
          break;
        case "showPoiExtend":
          thisObject.openPoiExtendState(command);
          break;
        case "mainPoiPage":
          thisObject.openPoiPageState(command);
          break;
        case "sharePos":
          thisObject.openSharePosState(command);
          break;
        case "realSharePos":
          thisObject.openTeamSharePosState(command);
          break;
        case "goBack":
          if (stateManager.getPageCount() == 1) {
            if (api.jsBridge && api.jsBridge["realGoBack"]) {
              if (!thisObject.exitMapModal) {
                const params = {
                  text: "您确定退出地图",
                  btn1: "取消",
                  confirmCB: function () {
                    api.jsBridge["realGoBack"](null, null, { pageCount: 1 });
                  },
                  cancelCB: function () {
                    thisObject.exitMapModal = null;
                  },
                };
                thisObject.exitMapModal = daxiapp["domUtil"].dialogWithModal(params);
              } else {
                thisObject.exitMapModal.close();
              }
            }
            return { pageCount: 1 };
          }
          const currentState = stateManager.getCurrentState();
          if (currentState.runCommand) {
            const result = currentState.runCommand(command);
          } else {
            stateManager.goBack();
          }
          return result;
          break;
        case "setSensorStatus":
          const data = command["data"];
          if (typeof data == "string") {
            data = JSON.parse(data);
          }
          api._mapView._locationManager["setSensorStatus"](data);
          break;
        case "sensorDataUpdate":
          if (typeof command["data"] == "string") {
            const data = JSON.parse(command["data"]);
          } else {
            const data = command["data"];
          }

          data.forEach(function (item) {
            if (item["type"] == "beacon") {
              api._mapView._locationManager["sendBeaconsData"](item["data"]["beacons"]);
              if (item["data"]["heading"] != undefined) {
                api._mapView._locationManager["sendHeadingData"](item["data"]["heading"]);
              }
            } else if (item["type"] == "gps") {
              api._mapView._locationManager["sendGPSData"](item["data"]);
            } else if (item["type"] == "heading") {
              const heading = item["data"]["heading"] != undefined ? item["data"]["heading"] : item["data"];
              api._mapView._locationManager["sendHeadingData"](heading);
            } else if (item["type"] == "ped") {
              const step = item["data"]["step"];
              if (step) {
                if (thisObject.stepCount == undefined) {
                  api._mapView._locationManager["sendStep"](item["data"]);
                } else {
                  for (var i = thisObject.stepCount; i < step; i++) {
                    api._mapView._locationManager["sendStep"](item["data"]);
                  }
                }
                thisObject.stepCount = step;
              } else if (item["data"]["heading"] != undefined) {
                api._mapView._locationManager["sendHeadingData"](item["data"]["heading"]);
              }
            } else if (item["type"] == "aoa") {
              api._mapView._locationManager["sendAOAResult"](item);
            }
          });

          break;
        case "openPayPage":
          thisObject.openPayPage(command);
          break;
        case "exhibitionRoute":
          thisObject.openExhibitionRoutePage(command);
          break;
        case "addPosShareGroup":
          thisObject.addPosShareGroup(command);
        default:
          break;
      }
      thisObject.setIndoorVisible(command);
    };
    thisObject.setIndoorVisible = function (command) {
      const bdid = command["buildingId"] || command["bdid"];
      if (bdid && api._params["buildingId"] && api._params["token"] == "806bc162812065750b3d3958f9056008") {
        api._mapView._mapSDK.setIndoorSceneVisible(true, bdid, true);
      }
    };

    thisObject._payAlertComponent = new daxiapp["DXPayComponent"]();
    thisObject._payAlertComponent.init(thisObject._dom, {
      listener: {
        onClose: function () {
          thisObject._payAlertComponent.hide();
        },
        toPay: function (e, id) {
          thisObject.selectProjectId = id;
          thisObject._payAlertComponent.hide();
          wx.miniProgram.navigateTo({
            url: "/pages/pay/pay?token=" + api._params.token + "&bdid=" + api._params.bdid + `&projectId=${id}&fromPage=mapView`,
          });
        },
      },
    });
    thisObject._payAlertComponent.hide();

    thisObject._paysuccessComponent = new daxiapp["DXPaysuccessComponent"]();
    thisObject._paysuccessComponent.init(thisObject._dom, {
      listener: {
        onClose: function () {
          thisObject._paysuccessComponent.hide();
        },
      },
    });
    thisObject._paysuccessComponent.hide();

    thisObject._DXPayTypeComponent = new daxiapp["DXPayTypeComponent"]();
    thisObject._DXPayTypeComponent.init(thisObject._dom, {
      listener: {
        onClose: function () {
          thisObject._DXPayTypeComponent.hide();
        },
        chooseType: function (e, id) {},
      },
    });
    thisObject._DXPayTypeComponent.hide();
    thisObject.getProduct = function (callback) {
      const thisObject = this;
      const app = thisObject._app;
      const url = "https://map1a.daxicn.com/payApi/merchantApi/api/projectProduct/list";
      const link = api._config["projectProductList"] || url;
      api.downloader.getServiceData(
        link,
        "GET",
        "json",
        {
          token: api._params["token"],
          bdid: api._params["bdid"],
          t: Date.now(),
        },
        function (data) {
          thisObject.productList = { productTitle: data.data[0].title, productDesc: data.data[0].content, productList: data.data };
          callback && callback();
        }
      );
    };
    thisObject.wxAppPay = function () {
      const thisObject = this;
      const url = "https://map1a.daxicn.com/payApi/merchantApi/api/pay/wxAppPay";
      const link = api._config["wxAppPay"] || url;
      api.downloader.getServiceData(
        link,
        "GET",
        "json",
        {
          token: api._params["token"],
          bdid: api._params["bdid"],
          t: Date.now(),
        },
        function (data) {
          thisObject._DXPayTypeComponent.updateData({ payWayData: data.data });
        }
      );
    };
    thisObject.payOrders = function (data, success, error) {
      const thisObject = this;
      const token = api._params["token"];
      const bdid = api._params["bdid"];
      const command = api._params;
      const userId = command.userId;
      const url = `https://map1a.daxicn.com/payApi/merchantApi/api/pay/payOrders?token=${token}&bdid=` + bdid;
      const link = api._config["payOrdersURL"] || url;
      const sign = signMd5Utils.getSign(link, data);
      $.ajax({
        url: url,
        type: "POST",
        headers: {
          "X-Sign": sign,
          "X-TIMESTAMP": signMd5Utils.getTimestamp(),
          "content-type": "application/json",
        },
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function (res) {
          if (res.code != 0) {
            console.log(res);
          }
          success && success();
        },
        error: function (err) {
          error && error();
        },
      });
    };
    thisObject.getPayInfo = function (id, successCB, failedCB) {
      const thisObject = this;
      const openid = api._params.userId || api._params.userid;
      const merchantCode = api._params.merchantCode || "";
      const nickname = "微信用户";
      const data = {
        openid: AES.encrypt(openid),
        nickname: AES.encrypt(nickname),
        mchNo: merchantCode,
        payCode: api._params.payCode || "",
        extParam: AES.encrypt(
          JSON.stringify({
            orderType: 0,
            useOpenid: openid,
          })
        ),
        t: new Date().getTime() + "",
      };

      if (id == 1) {
        data.wayCode = AES.encrypt("WX_LITE");
        data.payDataType = AES.encrypt("wxapp");
      } else if (id == 2) {
        data.wayCode = AES.encrypt("WX_NATIVE");
        data.payDataType = AES.encrypt("codeImgUrl");
        data.extParam = AES.encrypt(
          JSON.stringify({
            useOpenid: openid,
            orderType: 1,
          })
        );
      } else if (id == 3) {
        data.wayCode = AES.encrypt("ALI_WAP");
        data.payDataType = AES.encrypt("payurl");
        data.extParam = AES.encrypt(
          JSON.stringify({
            useOpenid: openid,
            orderType: 0,
          })
        );
      }
      if (thisObject.selectProjectId) {
        data.productNo = thisObject.selectProjectId;
      }
      if (thisObject.selectDeductionVoucherId) {
        data.deductionVoucherId = thisObject.selectDeductionVoucherId;
      }
      thisObject.payOrders(
        data,
        function (result) {
          if (result.code == 0) {
            successCB && successCB(result);
          } else {
            console.log(result.msg);
          }
        },
        function (err) {
          console.log(err.msg);
          failedCB && failedCB(err);
        }
      );
    };
    const getParam = function (url) {;
      const theRequest = {};
      if (url.indexOf("#") != -1 || url.indexOf("?") != -1) {
        url = url.substr(1);
      }
      const strs = url.split("&");
      for (var i = 0; i < strs.length; i++) {
        theRequest[strs[i].split("=")[0]] = strs[i].split("=")[1];
      }
      return theRequest;
    };
    window.addEventListener("hashchange", function (e) {
      if (e["newURL"].indexOf("#") != -1) {
        const params = getParam(e["newURL"].split("#")[1]);
        if (params["method"] == "showExhibit" && params["id"]) {
          thisObject.openExhibit(params);
        }
      }
    });
    return thisObject;
  }
  global["initDaxiCommand"] = initDaxiCommand;
})(window);
