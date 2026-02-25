/** 签名密钥串（前后端需保持一致） */
const signatureSecret = "dd05f1c54d63749eda95f9fa6d49v442a";

class signMd5Utils {
  /** 判断是否为有效数值 */
  static isNumeric(value) {
    return typeof value === "number" && !isNaN(value);
  }

  /** 将数值转为字符串（保持前后端加密规则一致） */
  static normalizeValue(value) {
    return this.isNumeric(value) ? value.toString() : value;
  }

  /** JSON 参数按 key 升序排列 */
  static sortAsc(jsonObj) {
    const sortedKeys = Object.keys(jsonObj).sort();
    const sortObj = {};
    sortedKeys.forEach((key) => {
      sortObj[key] = jsonObj[key];
    });
    return sortObj;
  }

  /**
   * 获取签名
   * @param {string} url - 请求的 URL（可包含查询参数）
   * @param {object} requestParams - 请求参数（POST 的 JSON 参数）
   */
  static getSign(url, requestParams) {
    const urlParams = this.parseQueryString(url);
    const jsonObj = this.mergeObject(urlParams, requestParams);
    const requestBody = this.sortAsc(jsonObj);
    return MD5(JSON.stringify(requestBody) + signatureSecret).toUpperCase();
  }

  /** 解析 URL 中的查询参数为对象 */
  static parseQueryString(url) {
    const urlReg = /^[^?]+\?([\w\W]+)$/;
    const paramReg = /([^&=]+)=([\w\W]*?)(&|$|#)/g;
    const urlArray = urlReg.exec(url);
    const result = {};

    // 处理 URL 末段包含逗号的路径变量
    let lastPathVar = url.substring(url.lastIndexOf("/") + 1);
    if (lastPathVar.includes(",")) {
      if (lastPathVar.includes("?")) {
        lastPathVar = lastPathVar.substring(0, lastPathVar.indexOf("?"));
      }
      result["x-path-variable"] = decodeURIComponent(lastPathVar);
    }

    if (urlArray?.[1]) {
      const paramString = urlArray[1];
      let paramResult;
      while ((paramResult = paramReg.exec(paramString)) != null) {
        result[paramResult[1]] = this.normalizeValue(paramResult[2]);
      }
    }
    return result;
  }

  /** 合并两个对象 */
  static mergeObject(objectOne, objectTwo) {
    if (objectTwo && Object.keys(objectTwo).length > 0) {
      Object.keys(objectTwo).forEach((key) => {
        objectOne[key] = this.normalizeValue(objectTwo[key]);
      });
    }
    return objectOne;
  }

  /** URL 编码 */
  static urlEncode(param, key, encode) {
    if (param == null) return "";
    let paramStr = "";
    const t = typeof param;

    if (t == "string" || t == "number" || t == "boolean") {
      const encodedValue = encode == null || encode ? encodeURIComponent(param) : param;
      paramStr += `&${key}=${encodedValue}`;
    } else {
      for (const i in param) {
        const k = key == null ? i : key + (Array.isArray(param) ? `[${i}]` : `.${i}`);
        paramStr += this.urlEncode(param[i], k, encode);
      }
    }
    return paramStr;
  }

  /** 获取当前时间戳（用于签名 header） */
  static getTimestamp() {
    return Date.now();
  }
}
