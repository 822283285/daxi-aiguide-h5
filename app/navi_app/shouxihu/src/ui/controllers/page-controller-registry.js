import { registerAboutPageController } from "./about-page-controller.js";
import { registerPoiDetailPageController } from "./poi-detail-page-controller.js";
import { registerPayResultPageController } from "./pay-result-page-controller.js";
import { registerMapStateMainPoiPageController } from "./map-state-main-poi-page-controller.js";
import { registerMapStateSearchPageController } from "./map-state-search-page-controller.js";
import { registerMapStatePoiPageController } from "./map-state-poi-page-controller.js";
import { registerMapStateRoutePageController } from "./map-state-route-page-controller.js";
import { registerMapStateSelectPointPageController } from "./map-state-select-point-page-controller.js";
import { registerMapStateChangeStartEndPointPageController } from "./map-state-change-start-end-point-page-controller.js";
import { registerHomePageController } from "./home-page-controller.js";
import { registerMapStateBrowsePageController } from "./map-state-browse-page-controller.js";
import { registerServicePageController } from "./service-page-controller.js";
import { registerProfilePageController } from "./profile-page-controller.js";
import { registerMapStatePoiDetailPageController } from "./map-state-poi-detail-page-controller.js";
import { registerMapStateSimulateNaviPageController } from "./map-state-simulate-navi-page-controller.js";
import { registerMapStateExhibitionRoutePageController } from "./map-state-exhibition-route-page-controller.js";
import { registerMapStateSharePosPageController } from "./map-state-share-pos-page-controller.js";
import { registerMapStateNaviPageController } from "./map-state-navi-page-controller.js";
import { registerMapStateVisitNaviPageController } from "./map-state-visit-navi-page-controller.js";
import { registerMapStateCreateGroupPageController } from "./map-state-create-group-page-controller.js";
import { registerMapStateShareGroupPageController } from "./map-state-share-group-page-controller.js";
import { registerLegacyPageController } from "./legacy-page-controller-adapter.js";

export const ACTIVE_PAGE_CONTROLLER_NAMES = [
  "HomePage",
  "MapStateBrowse",
  "ServicePage",
  "ProfilePage",
  "MapStatePoiDetail",
  "MapStateRoute",
  "MapStateChangeStartEndPoint",
  "MapStateSelectPoint",
  "MapStateSimulateNavi",
  "MapStateExhibitionRoute",
  "MapStateSharePos",
  "MapStateMainPoiPage",
  "MapStateSearchPage",
  "MapStatePoi",
  "MapStateNavi",
  "MapStateCreateGroup",
  "MapStateShareGroup",
  "MapStateVisitNavi",
];

export const ALL_PAGE_CONTROLLER_NAMES = [
  ...ACTIVE_PAGE_CONTROLLER_NAMES,
  "MapStateBuildingList",
  "PoiDetailPage",
  "VoiceListenerPage",
  "AboutPage",
  "PayPage",
  "PayResultPage",
  "IndexPage",
  "MapStateAutoPlayExhibit",
  "MapStateFavoritePage",
];

const CUSTOM_REGISTER_MAP = {
  HomePage: registerHomePageController,
  MapStateBrowse: registerMapStateBrowsePageController,
  ServicePage: registerServicePageController,
  ProfilePage: registerProfilePageController,
  MapStatePoiDetail: registerMapStatePoiDetailPageController,
  AboutPage: registerAboutPageController,
  PoiDetailPage: registerPoiDetailPageController,
  PayResultPage: registerPayResultPageController,
  MapStateMainPoiPage: registerMapStateMainPoiPageController,
  MapStateSearchPage: registerMapStateSearchPageController,
  MapStatePoi: registerMapStatePoiPageController,
  MapStateRoute: registerMapStateRoutePageController,
  MapStateSelectPoint: registerMapStateSelectPointPageController,
  MapStateChangeStartEndPoint: registerMapStateChangeStartEndPointPageController,
  MapStateSimulateNavi: registerMapStateSimulateNaviPageController,
  MapStateExhibitionRoute: registerMapStateExhibitionRoutePageController,
  MapStateSharePos: registerMapStateSharePosPageController,
  MapStateNavi: registerMapStateNaviPageController,
  MapStateCreateGroup: registerMapStateCreateGroupPageController,
  MapStateShareGroup: registerMapStateShareGroupPageController,
  MapStateVisitNavi: registerMapStateVisitNaviPageController,
};

export function registerPageController(pageName, options = {}) {
  if (!pageName) {
    return null;
  }

  const customRegister = CUSTOM_REGISTER_MAP[pageName];
  if (typeof customRegister === "function") {
    return customRegister(options);
  }

  return registerLegacyPageController(pageName, options);
}

export function registerAllPageControllers(options = {}) {
  const pageNames = options.pageNames || ACTIVE_PAGE_CONTROLLER_NAMES;
  const result = {};

  pageNames.forEach((pageName) => {
    const controller = registerPageController(pageName, options);
    result[pageName] = controller || null;
  });

  return result;
}
