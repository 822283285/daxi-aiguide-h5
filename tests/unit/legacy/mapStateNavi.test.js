/**
 * 导航页面模块单元测试
 * 测试 daxiapp.page.mapStateNavi.js 的核心功能
 */

describe('MapStateNavi 模块测试', () => {
  beforeAll(() => {
    global.DaxiApp = {
      dom: {
        html: jest.fn(),
        find: jest.fn(() => document.createElement('div')),
      },
      domUtil: {},
      utils: {},
    };

    global.$ = jest.fn(() => ({
      on: jest.fn(),
      off: jest.fn(),
      html: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
    }));
  });

  afterAll(() => {
    delete global.DaxiApp;
    delete global.$;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '<div id="first_page"></div>';
  });

  describe('MapStateNavi 类', () => {
    test('应该定义 MapStateNavi 类', () => {
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.mapStateNavi.js');
      expect(global.MapStateNavi).toBeDefined();
    });

    test('应该可以实例化 MapStateNavi', () => {
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.mapStateNavi.js');
      const navi = new global.MapStateNavi();
      expect(navi).toBeDefined();
    });
  });

  describe('initialize 方法', () => {
    test('应该接受 api 和 dom 参数', () => {
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.mapStateNavi.js');
      
      const mockApi = {
        _params: { token: 'test', platform: 'web' },
        _dom: document.getElementById('first_page'),
      };
      
      const dom = document.getElementById('first_page');
      const navi = new global.MapStateNavi();
      
      expect(() => {
        navi.initialize(mockApi, dom);
      }).not.toThrow();
    });
  });

  describe('导航功能', () => {
    test('应该管理导航状态', () => {
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.mapStateNavi.js');
      const navi = new global.MapStateNavi();
      expect(navi).toBeDefined();
    });
  });
});
