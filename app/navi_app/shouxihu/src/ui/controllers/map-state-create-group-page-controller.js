function resolveDeps(options = {}) {
  const globalRef = options.globalRef || globalThis;
  const daxiapp = options.daxiapp || globalRef.DaxiApp || {};

  return {
    daxiapp,
    DXUtils: options.DXUtils || daxiapp.utils,
    domUtils: options.domUtils || daxiapp.dom,
    domUtil: options.domUtil || daxiapp.domUtil,
    MapStateClass: options.MapStateClass || daxiapp.MapStateClass,
    HeaderComponentCtor: options.HeaderComponentCtor || daxiapp.DXHeaderComponent,
  };
}

function buildServiceUrl(baseUrl, path) {
  if (!baseUrl) {
    return "";
  }
  return baseUrl[baseUrl.length - 1] == "/" ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
}

export function createMapStateCreateGroupPageController(options = {}) {
  const deps = resolveDeps(options);
  const { DXUtils, domUtils, domUtil, MapStateClass, HeaderComponentCtor } = deps;
  if (!MapStateClass || typeof MapStateClass.extend !== "function") {
    return null;
  }

  return MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "MapStateCreateGroup";
    },

    initialize: function (app, container) {
      this._super(app, container);
      const thisObject = this;
      this._app = app;
      const basicMapHtml = '<div id="group_share_page" class="dx_full_frame_container"></div>';
      domUtils.append(thisObject._container, basicMapHtml);
      thisObject._dom = domUtils.find(thisObject._container, "#group_share_page");
      thisObject._bdid = "";

      thisObject.sharePosServer = (app._config.user && app._config.user.sharePosServer) || "";
      thisObject._headerView = new HeaderComponentCtor(app, thisObject._dom);
      thisObject._headerView.init({
        onBackBtnClicked: function () {
          app._stateManager.goBack();
        },
      });
      thisObject._headerView.updateTitle("\u7ec4\u961f\u51fa\u884c");

      const containerWrapperHtml =
        '<div class="main_content create_group_container" id="sharegroup"><div class="sharegroup_container">' +
        '<p class="description">\u5b9e\u65f6\u5206\u4eab\u4f4d\u7f6e</p>' +
        '<span class="create_group" id="createGroup">\u521b\u5efa\u961f\u4f0d</span>' +
        '<p class="add_group">' +
        '<input class="groupid" value="" type="text" placeholder="\u8f93\u5165\u961f\u53e3\u4ee4" placeholder-style="" placeholder-class="input-placeholder"/>' +
        '<span id="addAction" class="add_to_group">\u52a0\u5165</span>' +
        '</p></div><div class="msg_dialog" id="tipMsgBox"><p class="content"></p></div></div>';
      domUtils.append(thisObject._dom, containerWrapperHtml);
      const userInfo = app._params.userInfo || {};

      thisObject._dom.on("click", "#createGroup", function () {
        const url = buildServiceUrl(thisObject.sharePosServer, "createGroup");
        const locPosition = thisObject.params.locPosition || {};
        const position = locPosition.position || [];
        const data = {
          userId: userInfo.userId || "",
          userName: userInfo.userName || "",
          avatarUrl: userInfo.avatarUrl || "",
          token: app._params.token || app._config.token || "",
          bdid: locPosition.bdid || "",
          floorId: locPosition.floorId || "",
          lng: position[0] || "",
          lat: position[1] || "",
        };
        DXUtils.getDataBySecurityRequest(
          url,
          "post",
          data,
          function (result) {
            if (result.ret == "OK") {
              const page = app._stateManager.pushState("MapStateShareGroup", {
                data: userInfo,
                members: result.members,
                groupId: result.groupId,
              });
              page._once("shareGroupCallback", function () {
                app._stateManager.goBack();
              });
            } else {
              domUtil.dialog({
                text: result.msg || result.errMsg || "\u521b\u5efa\u961f\u4f0d\u5931\u8d25",
              });
            }
          },
          function (result) {
            domUtil.dialog({
              text: result.msg || result.errMsg || "\u521b\u5efa\u961f\u4f0d\u5931\u8d25",
            });
          },
        );
      });

      thisObject._dom.on("click", "#addAction", function () {
        const url = buildServiceUrl(thisObject.sharePosServer, "postPosition");
        const locPosition = thisObject.params.locPosition || {};
        const position = locPosition.position || [];
        const data = {
          userId: userInfo.userId || "",
          userName: userInfo.userName || "",
          avatarUrl: userInfo.avatarUrl || "",
          token: app._params.token || app._config.token || "",
          bdid: locPosition.bdid || "",
          floorId: locPosition.floorId || "",
          lng: position[0] || "",
          lat: position[1] || "",
        };
        const groupId = thisObject._dom.find(".groupid").val();
        if (groupId.length != 6) {
          domUtil.tipMessage("\u8bf7\u8f93\u5165\u6b63\u786e\u53e3\u4ee4", 3000);
          return;
        }
        data.groupId = groupId;

        DXUtils.getDataBySecurityRequest(
          url,
          "post",
          data,
          function (result) {
            if (result.ret == "OK") {
              result.userId = data.userId;
              const page = app._stateManager.pushState("MapStateShareGroup", {
                data: userInfo,
                members: result.members,
                groupId,
              });
              page._once("shareGroupCallback", function () {
                app._stateManager.goBack();
              });
            } else {
              domUtil.dialog({
                text: result.msg || result.errMsg || "\u52a0\u5165\u961f\u4f0d\u5f02\u5e38,\u8bf7\u7a0d\u540e\u518d\u8bd5",
              });
            }
          },
          function (err) {
            domUtil.dialog({
              text: err.toString(),
            });
          },
        );
      });

      this.show(false);
    },
    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) {
        return;
      }
      this.params = DXUtils.copyData ? DXUtils.copyData(args) : { ...args };
    },

    onHideByPushStack: function (args) {
      this._super(args);
    },

    onShowByPopStack: function (args) {
      this._super(args);
    },

    onStateEnd: function (args) {
      this._super(args);
    },
  });
}

export function registerMapStateCreateGroupPageController(options = {}) {
  const deps = resolveDeps(options);
  const controller =
    options.controller ||
    createMapStateCreateGroupPageController({
      ...options,
      daxiapp: deps.daxiapp,
      DXUtils: deps.DXUtils,
      domUtils: deps.domUtils,
      domUtil: deps.domUtil,
      MapStateClass: deps.MapStateClass,
      HeaderComponentCtor: deps.HeaderComponentCtor,
    });

  if (!controller) {
    return null;
  }

  deps.daxiapp.MapStateCreateGroup = controller;
  return controller;
}
