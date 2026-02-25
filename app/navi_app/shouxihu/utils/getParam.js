/**
 * 获取URL参数
 * @param {string} name - 参数名称
 * @returns {string|null} 参数值或null
 */
function getQueryParam(name) {
  const url = window.location.href.split("#")[0];
  const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
  const query = url.split("?")[1] || "";
  const result = query.match(reg);
  if (result != null) {
    return decodeURIComponent(result[2]);
  }
  return null;
}

window.getParam = getQueryParam;
