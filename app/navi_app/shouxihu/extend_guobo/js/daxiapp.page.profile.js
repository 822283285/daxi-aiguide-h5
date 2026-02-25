(function (global) {
  "use strict";
  const daxiapp = global.DaxiApp || {};
  const domUtils = daxiapp.dom;
  const MapStateClass = daxiapp.MapStateClass;
  const xiui = daxiapp.xiui;

  /** 默认头像 */
  const DEFAULT_AVATAR = "https://daoyou.daxicn.com/managerApi/api/anon/localOssFiles/avatar/fc2eeed6-85db-4681-822c-eb892e19f6b5.jpg";

  /** SVG 图标 */
  const ICONS = {
    qrcode: `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M64 448h384V64H64v384zM192 192h128v128H192V192z m384-128v384h384V64H576z m256 256h-128V192h128v128zM64 960h384V576H64v384z m128-256h128v128H192v-128z m704-128h64v256h-192v-64h-64v192h-128V576h192v64h128v-64z m0 320h64v64h-64v-64z m-128 0h64v64h-64v-64z" fill="#2c2c2c"></path></svg>`,
    feedback: `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M975.2576 43.008l-8.6016-12.288-8.6016-12.288c-4.9152-7.168-14.7456-8.8064-21.9136-3.8912L539.8528 292.2496c-2.2528 1.4336-3.8912 3.4816-5.12 5.9392l-13.5168 27.8528c-5.3248 11.0592 3.4816 23.7568 15.7696 22.528l30.9248-3.2768c2.6624-0.2048 5.12-1.2288 7.3728-2.6624L971.5712 64.9216c6.9632-4.9152 8.8064-14.7456 3.6864-21.9136z" fill="#2c2c2c"></path><path d="M568.9344 377.856l-30.9248 3.2768c-1.6384 0.2048-3.2768 0.2048-4.9152 0.2048-14.9504 0-29.2864-7.3728-37.888-19.8656-9.6256-13.7216-11.0592-31.744-3.6864-46.8992l13.5168-27.8528c3.4816-6.9632 8.6016-13.1072 15.1552-17.6128L851.1488 37.2736C837.632 14.9504 813.2608 0 785.408 0h-708.608C34.6112 0 0 34.6112 0 76.8v870.4C0 989.3888 34.6112 1024 76.8 1024h708.608c42.1888 0 76.8-34.6112 76.8-76.8V179.6096l-271.5648 190.2592c-6.3488 4.5056-13.9264 7.168-21.7088 7.9872zM782.336 713.9328v17.8176c0 16.7936-13.9264 30.72-30.72 30.72H159.744c-16.9984 0-30.72-13.9264-30.72-30.72v-17.8176c0-16.9984 13.9264-30.72 30.72-30.72h591.872c16.9984 0 30.72 13.9264 30.72 30.72zM634.88 442.368c0 16.9984-13.9264 30.72-30.72 30.72H159.744c-16.9984 0-30.72-13.9264-30.72-30.72s13.9264-30.72 30.72-30.72h444.416c16.9984 0 30.72 13.9264 30.72 30.72z" fill="#2c2c2c"></path></svg>`,
    orders: `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M686.5 220c30 0 54.4-23.2 54.4-51.9v-51.9c0-28.7-24.4-51.9-54.4-51.9-30.1 0-54.4 23.2-54.4 51.9v51.9c0 28.7 24.4 51.9 54.4 51.9zM336.6 220c30 0 54.4-23.2 54.4-51.9v-51.9c0-28.7-24.4-51.9-54.4-51.9-30.1 0-54.4 23.2-54.4 51.9v51.9c0 28.7 24.3 51.9 54.4 51.9z" fill="#2c2c2c"></path><path d="M776.6 146.5v31.9c0 40.2-40.6 72.9-90.6 72.9-50.1 0-90.7-32.6-90.7-72.9V142H426.5v36.4c0 40.2-40.6 72.9-90.6 72.9-50.1 0-90.7-32.6-90.7-72.9v-31.3c-47.5 14.7-82 59.1-82 111.7v584.1c0 64.5 52 116.8 116.2 116.8h465c64.2 0 116.2-52.3 116.2-116.8V258.8c0.1-53.3-35.4-98.3-84-112.3z m-43.1 668.8h-443c-18.4 0-33.2-15.4-33.2-34.5 0-19 14.9-34.5 33.2-34.5h443.1c18.4 0 33.2 15.4 33.2 34.5s-14.9 34.5-33.3 34.5z m0-183h-443c-18.4 0-33.2-15.4-33.2-34.5 0-19 14.9-34.5 33.2-34.5h443.1c18.4 0 33.2 15.4 33.2 34.5s-14.9 34.5-33.3 34.5z m0-183h-443c-18.4 0-33.2-15.4-33.2-34.5 0-19 14.9-34.5 33.2-34.5h443.1c18.4 0 33.2 15.4 33.2 34.5s-14.9 34.5-33.3 34.5z" fill="#2c2c2c"></path></svg>`,
  };

  /**
   * 个人中心页组件
   * 包含用户信息、我的二维码、投诉建议、我的订单等功能
   */
  const ProfilePage = MapStateClass.extend({
    __init__: function () {
      this._super();
      this._rtti = "ProfilePage";
    },

    initialize: function (app, container) {
      this._super(app, container);
      this._app = app;
      this._cachedUserInfo = null;
      this._componentsInitialized = false;

      // 创建页面结构
      const pageHtml = `
        <div id="profile_page" class="profile-page dx_full_frame_container">
          <style>
            .profile-page { display: flex; flex-direction: column; height: 100vh; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow: hidden; position: relative; z-index: 100; }
            .profile-page .hide-scrollbar::-webkit-scrollbar { display: none; }
            .profile-page .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .profile-page .main-content { flex: 1; overflow-y: auto; padding-bottom: 60px; }
            
            /* 用户信息卡片样式 */
            .profile-page .user-info-section { background: #fff; margin: 12px; border-radius: var(--rounded-base, 8px); overflow: hidden; padding: 16px; }
            .profile-page .user-info-content { display: flex; align-items: center; gap: 16px; }
            .profile-page .user-avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; background: #e5e7eb; flex-shrink: 0; }
            .profile-page .user-details { flex: 1; }
            .profile-page .user-name { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 4px; }
            .profile-page .user-id { font-size: 12px; color: #999; }

            /* 二维码弹窗内容样式 */
            .profile-page .qrcode-content { display: flex; flex-direction: column; align-items: center; padding: 10px 0; }
            .profile-page .qrcode-canvas-container { margin-bottom: 16px; }
            .profile-page .qrcode-desc { font-size: 14px; color: #666; text-align: center; }
          </style>

          <!-- 主内容区域 -->
          <div class="main-content hide-scrollbar">
            <!-- 用户信息区域 -->
            <div class="user-info-section">
              <div class="user-info-content">
                <img class="user-avatar" src="${DEFAULT_AVATAR}" alt="头像">
                <div class="user-details">
                  <div class="user-name">昵称初始化中...</div>
                  <div class="user-id">ID: ID初始化中...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      domUtils.append(this._container, pageHtml);
      this._dom = domUtils.find(this._container, "#profile_page");
      this._mainContent = domUtils.find(this._dom, ".main-content")[0];

      // 缓存 DOM 元素
      this._userAvatarEl = domUtils.find(this._dom, ".user-avatar");
      this._userNameEl = domUtils.find(this._dom, ".user-name");
      this._userIdEl = domUtils.find(this._dom, ".user-id");

      this.show(false);
    },

    onStateBeginWithParam: function (args) {
      this._super(args);
      if (!args) return;

      this.params = args.data || {};

      if (this._componentsInitialized) {
        this._showComponents();
        return;
      }

      this._initComponents();
      this._loadUserInfo();
      this._componentsInitialized = true;
    },

    /** 初始化组件 */
    _initComponents: function () {
      const thisObject = this;

      // 1. 第一组：我的二维码
      thisObject._cellGroup1 = new xiui.XICellGroup({
        parent: thisObject._mainContent,
        data: [{ title: "我的二维码", icon: ICONS.qrcode, action: "qrcode" }],
        listener: {
          onCellClick: (sender, { action }) => thisObject._handleCellClick(action),
        },
      });

      // 2. 第二组：投诉建议、我的订单
      thisObject._cellGroup2 = new xiui.XICellGroup({
        parent: thisObject._mainContent,
        data: [
          { title: "投诉建议", icon: ICONS.feedback, action: "feedback" },
          { title: "我的订单", icon: ICONS.orders, action: "orders" },
        ],
        listener: {
          onCellClick: (sender, { action }) => thisObject._handleCellClick(action),
        },
      });

      // 3. 二维码弹窗
      thisObject._qrcodePopup = new xiui.XIPopup({
        parent: thisObject._dom[0],
        title: "我的二维码",
      });
      thisObject._qrcodePopup.setContent(`
        <div class="qrcode-content">
          <div class="qrcode-canvas-container"></div>
          <div class="qrcode-desc">扫一扫，领取耳机听讲解</div>
        </div>
      `);

      // 4. 底部导航栏
      const footerData = thisObject._app?._config?.browsePage?.naviData || [];
      thisObject._tabbar = new xiui.XITabBar({
        parent: thisObject._dom[0],
        data: footerData.map((item, index) => ({
          id: index,
          name: item.name,
          icon: item.icon,
        })),
        activeName: "我的",
        listener: {
          onTabClick: (sender, { id }) => thisObject._handleFooterClick(id),
        },
      });
    },

    _showComponents: function () {
      this._cellGroup1?.show();
      this._cellGroup2?.show();
      this._tabbar?.show();
      this._tabbar?.setActiveByName("我的");
    },

    _hideComponents: function () {
      this._cellGroup1?.hide();
      this._cellGroup2?.hide();
      this._tabbar?.hide();
      this._qrcodePopup?.close();
    },

    _handleFooterClick: function (id) {
      const pageActions = {
        0: () => this._app._stateManager.pushState("HomePage", {}),
        1: () => this._app._stateManager.pushState("MapStateBrowse", {}),
        2: () => window.parent.navigateToUni("navigateTo", "/pages/media/player-2"),
        3: () => this._app._stateManager.pushState("ServicePage", {}),
      };
      pageActions[id]?.();
    },

    _handleCellClick: async function (action) {
      const command = this._app?._params;

      switch (action) {
        case "qrcode":
          await this._showQRCode();
          break;
        case "feedback":
          window.parent?.navigateToUni?.("navigateTo", "/pages/map/more/feedback", { scenicId: command?.bdid });
          break;
        case "orders":
          window.parent?.navigateToUni?.("navigateTo", "/pages/map/more/orders", { scenicId: command?.bdid });
          break;
      }
    },

    _loadUserInfo: async function () {
      const command = this._app?._params;
      const openid = command?.userId || "";

      if (!openid) {
        console.warn("用户 openid 为空，无法加载用户信息");
        return;
      }

      try {
        const userInfo = await this._getUserInfo(openid);
        if (userInfo?.data?.username) {
          this._updateUserInfoUI(userInfo.data);
        } else {
          this._registerUser(openid);
        }
      } catch (error) {
        console.error("加载用户信息失败", error);
      }
    },

    _updateUserInfoUI: function (userData) {
      if (userData.avatarUrl) {
        this._userAvatarEl.attr("src", userData.avatarUrl);
      }
      if (userData.username) {
        this._userNameEl.text(userData.username);
      }
      if (userData.openid) {
        const shortId = userData.openid.length > 10 ? `${userData.openid.slice(0, 6)}...${userData.openid.slice(-4)}` : userData.openid;
        this._userIdEl.text(`ID: ${shortId}`);
      }
    },

    _registerUser: function (openid) {
      const thisObject = this;

      daxiapp.api.updateUserInfo(
        { username: "匿名用户", avatarUrl: DEFAULT_AVATAR, openid: openid },
        () => {
          thisObject._cachedUserInfo = null;
          thisObject._loadUserInfo();
        },
        (err) => console.error("用户注册失败", err),
      );
    },

    _showQRCode: async function () {
      const command = this._app?._params;
      const openid = command?.userId || "";

      try {
        const userInfo = await this._getUserInfo(openid);
        const username = userInfo?.data?.username || "访客";
        const aesData = this._generateAESData(openid, username);

        const canvasContainer = this._qrcodePopup.getContentElement()?.querySelector(".qrcode-canvas-container");
        if (canvasContainer) {
          canvasContainer.innerHTML = "";
          if (typeof QRCode !== "undefined") {
            new QRCode(canvasContainer, {
              text: aesData,
              width: 200,
              height: 200,
              colorDark: "#000",
              colorLight: "#fff",
              correctLevel: QRCode.CorrectLevel.H,
            });
          }
        }

        this._qrcodePopup.open();
      } catch (error) {
        console.error("生成二维码失败", error);
        domUtils.showInfo("生成二维码失败，请重试");
      }
    },

    _getUserInfo: async function (openid) {
      if (this._cachedUserInfo?.data?.username) {
        return this._cachedUserInfo;
      }

      try {
        const result = await daxiapp.api.getUserInfo({ openid });
        if (result?.data?.username) {
          this._cachedUserInfo = result;
        }
        return result;
      } catch (error) {
        console.error("获取用户信息失败", error);
        return null;
      }
    },

    _generateAESData: function (openid, username) {
      if (window.commonUtils?.generateAESData) {
        return window.commonUtils.generateAESData(openid, username);
      }

      try {
        const key = CryptoJS.enc.Utf8.parse("1234567890123456");
        const iv = CryptoJS.enc.Utf8.parse("1234567890123456");
        const data = JSON.stringify({ openid, username, timestamp: Date.now() });

        const encrypted = CryptoJS.AES.encrypt(data, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });

        return encrypted.toString();
      } catch (error) {
        console.error("AES 加密失败", error);
      }

      return JSON.stringify({ openid, username });
    },

    onHideByPushStack: function (args) {
      this._super(args);
      this._hideComponents();
    },

    onShowByPopStack: function (args) {
      this._super(args);
      this._showComponents();
    },

    onStateEnd: function (args) {
      this._super(args);
      this._hideComponents();
    },
  });

  daxiapp.ProfilePage = ProfilePage;
})(window);
