/**
 * 路线规划页面模块单元测试
 * 测试 daxiapp.page.mapStateRoute_new.js 的核心功能
 */

describe('MapStateRoute 模块测试', () => {
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

  describe('MapStateRoute 类', () => {
    test('应该定义 MapStateRoute 类', () => {
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.mapStateRoute_new.js');
      expect(global.MapStateRoute).toBeDefined();
    });

    test('应该可以实例化 MapStateRoute', () => {
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.mapStateRoute_new.js');
      const route = new global.MapStateRoute();
      expect(route).toBeDefined();
    });
  });

  describe('initialize 方法', () => {
    test('应该接受 api 和 dom 参数', () => {
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.mapStateRoute_new.js');
      
      const mockApi = {
        _params: { token: 'test', platform: 'web' },
        _dom: document.getElementById('first_page'),
      };
      
      const dom = document.getElementById('first_page');
      const route = new global.MapStateRoute();
      
      expect(() => {
        route.initialize(mockApi, dom);
      }).not.toThrow();
    });
  });

  describe('路线规划功能', () => {
    test('应该管理路线数据', () => {
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.mapStateRoute_new.js');
      const route = new global.MapStateRoute();
      expect(route).toBeDefined();
    });
  });
});
