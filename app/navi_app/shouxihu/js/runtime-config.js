(function () {
  "use strict";

  window.indoorLocalAlgorithms = "fusion";
  window.mapSDKPath = "../../../map_sdk/";

  let dataPath;
  try {
    dataPath = window.parent?.commonUtils?.getBaseUrl?.();
    if (dataPath) {
      console.log("从父容器读取配置：dataPath =", dataPath);
    } else {
      console.warn("无法访问父容器配置，使用默认值");
    }
  } catch (error) {
    console.warn("读取父容器配置失败，使用默认值：", error);
  }

  const token = window.getParam ? getParam("token") : "";
  const buildingId = window.getParam ? getParam("buildingId") : "";

  window.dataPath = dataPath || "https://cloud.daxicn.com/publicData/";
  window.projectUrl = `${window.dataPath}/${token}/`;
  window.scenicUrl = `${window.dataPath}/${token}/${buildingId}/`;
  window.localFont = true;
})();
