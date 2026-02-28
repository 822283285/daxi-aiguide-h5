/**
 * @file daximap.navi.js
 * @description 大希导航核心模块，包含路线解析、实时导航、语音引导、楼层切换等功能
 * @author jiang ge
 * @created 2016-07-07
 */

/** 导航状态常量 */
let STATE_NAVIGATE = 0; // 导航模式
let STATE_FULLVIEW = 1; // 全览模式
let STATE_SHOWPOI = 2; //看地图POI
let STATE_NAVIGATE_END = 3; // 导航结束
let STATE_NAVIGATE_PAUSE = 4; // 导航暂停
let STATE_SHOWROUTE = 5; // 显示路线模式

/** 语音播报阶段常量 */
let BEFORE_STAGECHANGE_SPEAK = 1; // 阶段切换前播报
let STAGECHANGING_SPEAK = 2; // 阶段切换中播报

let daximap = window["DaxiMap"] || {};
let DXRouteCircelSampler = function () {
  let SamplerUtils = {};
  SamplerUtils.resamplerJSON = function (t, e) {
    if (!t || !t.features) return t;
    if (d && e && t.features.length === d.features.length) {
      for (let n = o.default.point(e), a = d.features, i = [], r = 0, s = a.length; r < s; r++) {
        let u = a[r],
          l = u.geometry.coordinates.slice(-1)[0];
        l = o.default.point(l);
        let f = (0, c.default)(n, l, u);
        (f.properties = u.properties), f.geometry.coordinates.splice(-1), i.push(f);
      }
      return o.default.featureCollection(i);
    }

    let h = [],
      p = [],
      A = t.features.length;
    for (let m = 0; m < A; m++) {
      let y = t.features[m],
        b = y.geometry.coordinates,
        T = (b = g(b))[0],
        w = [T],
        S = b[1],
        O = b.length;
      for (let k = 1; k < O - 1; k++) {
        k > 1 && (T = w.slice(-1)[0]), (S = b[k]);
        let M = b[k + 1];
        let C = SamplerUtils.resamplerCorner(T, S, M);
        w = w.concat(C.geometry.coordinates);
      }
      w.push(b.slice(-1)[0]);
      h[m] = w;
      p[m] = y.properties;
    }

    let R = [],
      L = h.length;
    for (let I = 0; I < L; I++) {
      let _ = SamplerUtils.createLineString(h[I]);
      (_.properties = p[I]), (R[I] = _);
    }
    let x = SamplerUtils.createfeatureCollection(R);
    d = x;
    return x;
  };

  SamplerUtils.resampler = function (t, e) {
    if (!t) return t;
    let h = [],
      A = 1;
    for (let m = 0; m < A; m++) {
      let b = t,
        T = (b = g(b))[0],
        w = [T],
        S = b[1],
        O = b.length;
      for (let k = 1; k < O - 1; k++) {
        k > 1 && (T = w.slice(-1)[0]), (S = b[k]);
        let M = b[k + 1];
        let C = SamplerUtils.resamplerCorner(T, S, M);
        w = w.concat(C.geometry.coordinates);
      }
      w.push(b.slice(-1)[0]);
      h[m] = w;
    }
    return h;
  };

  function g(t) {
    let e,
      n,
      a,
      o = [],
      i = t[0];
    o.push(i);
    let p = 7;
    for (let r = 1, u = t.length; r < u - 1; r++) {
      i = o[o.length - 1];
      let l = t[r],
        c = t[r + 1];
      ((e = i), (n = l), (a = c), SamplerUtils.diffAngel(SamplerUtils.calcAngel(e, n), SamplerUtils.calcAngel(n, a))) > p && o.push(l);
    }
    return o.push(t[t.length - 1]), o;
  }

  SamplerUtils.getCoord = function (e) {
    if (!e) throw new Error("coord is required");
    if (!Array.isArray(e)) {
      if ("Feature" === e.type && null !== e.geometry && "Point" === e.geometry.type) return e.geometry.coordinates;
      if ("Point" === e.type) return e.coordinates;
    }
    if (Array.isArray(e) && e.length >= 2 && !Array.isArray(e[0]) && !Array.isArray(e[1])) return e;
    throw new Error("coord must be GeoJSON Point or an Array of numbers");
  };

  SamplerUtils.getCoord2 = function (e) {
    if (!e) throw new Error("obj is required");
    let t = r(e);
    if (t.length > 1 && "number" == typeof t[0] && "number" == typeof t[1]) return t;
    throw new Error("Coordinate is not a valid Point");
  };

  SamplerUtils.radiansToDegrees = function (e) {
    return (180 * (e % (2 * Math.PI))) / Math.PI;
  };
  SamplerUtils.degreesToRadians = function (e) {
    return ((e % 360) * Math.PI) / 180;
  };

  SamplerUtils.params = {
    miles: 3960,
    nauticalmiles: 3441.145,
    degrees: 57.2957795,
    radians: 1,
    inches: 250905600,
    yards: 6969600,
    meters: 6373000,
    metres: 6373000,
    centimeters: 637300000,
    centimetres: 637300000,
    kilometers: 6373,
    kilometres: 6373,
    feet: 20908792.65,
  };
  SamplerUtils.radiansToDistance = function (e, t) {
    if (void 0 === e || null === e) throw new Error("radians is required");
    let r = SamplerUtils.params[t || "kilometers"];
    if (!r) throw new Error("units is invalid");
    return e * r;
  };

  SamplerUtils.distanceToRadians = function (e, t) {
    if (void 0 === e || null === e) throw new Error("distance is required");
    let r = SamplerUtils.params[t || "kilometers"];
    if (!r) throw new Error("units is invalid");
    return e / r;
  };

  SamplerUtils.isValid = function (e) {
    return !isNaN(e) && null !== e && !Array.isArray(e);
  };

  SamplerUtils.toPoint = function (e, t, n, o) {
    if (!e) throw new Error("No coordinates passed");
    if (void 0 === e.length) throw new Error("Coordinates must be an array");
    if (e.length < 2) throw new Error("Coordinates must be at least 2 numbers long");
    if (!SamplerUtils.isValid(e[0]) || !SamplerUtils.isValid(e[1])) throw new Error("Coordinates must contain numbers");
    return SamplerUtils.toFeature(
      {
        type: "Point",
        coordinates: e,
      },
      t,
      n,
      o
    );
  };

  SamplerUtils.createLineString = function (e, t, n, o) {
    if (!e) throw new Error("No coordinates passed");
    if (e.length < 2) throw new Error("Coordinates must be an array of two or more positions");
    if (!SamplerUtils.isValid(e[0][1]) || !SamplerUtils.isValid(e[0][1])) throw new Error("Coordinates must contain numbers");
    return SamplerUtils.toFeature(
      {
        type: "LineString",
        coordinates: e,
      },
      t,
      n,
      o
    );
  };

  SamplerUtils.toFeature = function (e, t, r, n) {
    if (void 0 === e) throw new Error("geometry is required");
    if (t && t.constructor !== Object) throw new Error("properties must be an Object");
    if (r && 4 !== r.length) throw new Error("bbox must be an Array of 4 numbers");
    if (n && -1 === ["string", "number"].indexOf(typeof n)) throw new Error("id must be a number or a string");
    let o = {
      type: "Feature",
    };
    return n && (o.id = n), r && (o.bbox = r), (o.properties = t || {}), (o.geometry = e), o;
  };

  SamplerUtils.getFirstCoordReverse = function (e) {
    if (e.length > 1 && "number" == typeof e[0] && "number" == typeof e[1]) return !0;
    if (Array.isArray(e[0]) && e[0].length) return SamplerUtils.getFirstCoordReverse(e[0]);
    throw new Error("coordinates must only contain numbers");
  };
  SamplerUtils.getCoordFromFeature = function (e) {
    if (!e) throw new Error("obj is required");
    let t;
    if ((e.length ? (t = e) : e.coordinates ? (t = e.coordinates) : e.geometry && e.geometry.coordinates && (t = e.geometry.coordinates), t))
      return SamplerUtils.getFirstCoordReverse(t), t;
    throw new Error("No valid coordinates");
  };
  // let d, h = .002,p = 7;
  SamplerUtils.calcAngel = function (e, t, r) {
    if ((void 0 === r && (r = {}), !0 === r.final))
      return (function (e, t) {
        let r = i(t, e);
        return (r = (r + 180) % 360);
      })(e, t);

    let a = SamplerUtils.getCoord(e),
      s = SamplerUtils.getCoord(t),
      u = SamplerUtils.degreesToRadians(a[0]),
      c = SamplerUtils.degreesToRadians(s[0]),
      f = SamplerUtils.degreesToRadians(a[1]),
      l = SamplerUtils.degreesToRadians(s[1]),
      d = Math.sin(c - u) * Math.cos(l),
      h = Math.cos(f) * Math.sin(l) - Math.sin(f) * Math.cos(l) * Math.cos(c - u);
    return SamplerUtils.radiansToDegrees(Math.atan2(d, h));
  };

  SamplerUtils.diffAngel = function (t, e) {
    let n = Math.abs(t - e);
    return n > 180 ? 360 - n : n;
  };

  SamplerUtils.addAngel = function (t, e) {
    let n = t + e;
    return n > 180 ? (n -= 360) : n < -180 && (n += 360), n;
  };

  // let n = r(20).getCoord,
  //          o = r(7).radiansToDistance;
  SamplerUtils.geographicsToLocal = function (e, t, r) {
    let i = Math.PI / 180,
      a = SamplerUtils.getCoord(e),
      s = SamplerUtils.getCoord(t),
      u = i * (s[1] - a[1]),
      c = i * (s[0] - a[0]),
      f = i * a[1],
      l = i * s[1],
      d = Math.pow(Math.sin(u / 2), 2) + Math.pow(Math.sin(c / 2), 2) * Math.cos(f) * Math.cos(l);
    return SamplerUtils.radiansToDistance(2 * Math.atan2(Math.sqrt(d), Math.sqrt(1 - d)), r);
  };

  // let n = r(20).getCoord,
  //          o = r(7),
  //          i = o.point,
  //          a = o.distanceToRadians;
  SamplerUtils.localToGeographics = function (e, t, r, o) {
    let s = Math.PI / 180,
      u = 180 / Math.PI,
      c = SamplerUtils.getCoord(e),
      f = s * c[0],
      l = s * c[1],
      d = s * r,
      h = SamplerUtils.distanceToRadians(t, o),
      p = Math.asin(Math.sin(l) * Math.cos(h) + Math.cos(l) * Math.sin(h) * Math.cos(d)),
      v = f + Math.atan2(Math.sin(d) * Math.sin(h) * Math.cos(l), Math.cos(h) - Math.sin(l) * Math.sin(p));
    return SamplerUtils.toPoint([u * v, u * p]);
  };

  SamplerUtils.createfeatureCollection = function (e, t, r) {
    if (!e) throw new Error("No features passed");
    if (!Array.isArray(e)) throw new Error("features must be an Array");
    if (t && 4 !== t.length) throw new Error("bbox must be an Array of 4 numbers");
    if (r && -1 === ["string", "number"].indexOf(typeof r)) throw new Error("id must be a number or a string");
    let n = {
      type: "FeatureCollection",
    };
    return r && (n.id = r), t && (n.bbox = t), (n.features = e), n;
  };

  SamplerUtils.l = function (e, t) {
    let r = SamplerUtils.getCoordFromFeature(e),
      n = SamplerUtils.getCoordFromFeature(t);
    if (2 !== r.length) throw new Error("<intersects> line1 must only contain 2 coordinates");
    if (2 !== n.length) throw new Error("<intersects> line2 must only contain 2 coordinates");
    let o = r[0][0],
      i = r[0][1],
      s = r[1][0],
      c = r[1][1],
      f = n[0][0],
      l = n[0][1],
      d = n[1][0],
      h = n[1][1],
      p = (h - l) * (s - o) - (d - f) * (c - i),
      v = (d - f) * (i - l) - (h - l) * (o - f),
      y = (s - o) * (i - l) - (c - i) * (o - f);
    if (0 === p) return null;
    let m = v / p,
      g = y / p;
    return m >= 0 && m <= 1 && g >= 0 && g <= 1 ? SamplerUtils.toPoint([o + m * (s - o), i + m * (c - i)]) : null;
  };

  SamplerUtils.e = function (e, t) {
    let r = {},
      n = [];
    if (
      ("LineString" === e.type && (e = SamplerUtils.toFeature(e)),
      "LineString" === t.type && (t = SamplerUtils.toFeature(t)),
      "Feature" === e.type &&
        "Feature" === t.type &&
        "LineString" === e.geometry.type &&
        "LineString" === t.geometry.type &&
        2 === e.geometry.coordinates.length &&
        2 === t.geometry.coordinates.length)
    ) {
      let u = SamplerUtils.l(e, t);
      return u && n.push(u), SamplerUtils.createfeatureCollection(n);
    }
    // let d = o();
    // return d.load(s(t)), c(s(e), function(e) {
    //  c(d.search(e), function(t) {
    //      let o = l(e, t);
    //      if (o) {
    //          let i = a(o).join(",");
    //          r[i] || (r[i] = !0, n.push(o))
    //      }
    //  })
    // }), f(n)
  };

  SamplerUtils.normalizeAngel = function (t) {
    return t < 0 && (t += 360), t;
  };
  SamplerUtils.normalizeAngel2 = function (e) {
    let t = e % 360;
    return t < 0 && (t += 360), t;
  };

  // let n = r(50),
  //  o = r(7).polygon;
  let xxx = function (e, t, r, i, a) {
    if (!e) throw new Error("center is required");
    if (!t) throw new Error("radius is required");
    (r = r || 64), (a = a || e.properties || {});
    for (let s = [], u = 0; u < r; u++) s.push(SamplerUtils.localToGeographics(e, t, (360 * u) / r, i).geometry.coordinates);
    return s.push(s[0]), o([s], a);
  };

  SamplerUtils.Interpolation = function (e, t, r, s, u, c) {
    if (!e) throw new Error("center is required");
    if (void 0 === r || null === r) throw new Error("bearing1 is required");
    if (void 0 === s || null === s) throw new Error("bearing2 is required");
    if (!t) throw new Error("radius is required");
    u = u || 64;
    let f = SamplerUtils.normalizeAngel2(r),
      l = SamplerUtils.normalizeAngel2(s),
      d = e.properties;
    if (f === l) return SamplerUtils.createLineString(xxx(e, t, u, c).geometry.coordinates[0], d);
    for (let h = f, p = f < l ? l : l + 360, v = h, y = [], m = 0; v < p; )
      y.push(SamplerUtils.localToGeographics(e, t, v, c).geometry.coordinates), (v = h + (360 * ++m) / u);
    return v > p && y.push(SamplerUtils.localToGeographics(e, t, p, c).geometry.coordinates), SamplerUtils.createLineString(y, d);
  };

  SamplerUtils.resamplerCorner = function (t, e, n) {
    let h = 0.002;
    let a = (function (t, e, n) {
        let a = SamplerUtils.diffAngel(SamplerUtils.calcAngel(e, t), SamplerUtils.calcAngel(e, n)); //y((0, s.default)(e, t), (0, s.default)(e, n)),
        (o = SamplerUtils.geographicsToLocal(t, e, "kilometres")), (i = SamplerUtils.geographicsToLocal(e, n, "kilometres") / 2), (r = h), (l = o);
        i < l && (l = i);
        let c = l * Math.tan((a / 360) * 3.14);
        c < r && (r = c);
        return r;
      })(t, e, n),
      c = (function (t, e, n, a) {
        let i = SamplerUtils.calcAngel(t, e),
          u = SamplerUtils.calcAngel(e, n),
          c = SamplerUtils.addAngel(i, 90);
        SamplerUtils.diffAngel(c, u) > 90 && (c = SamplerUtils.addAngel(c, 180));
        let f = SamplerUtils.addAngel(u, 90);
        SamplerUtils.diffAngel(f, SamplerUtils.addAngel(i, 180)) > 90 && (f = SamplerUtils.addAngel(f, 180));
        let d = SamplerUtils.localToGeographics(t, a, c, "kilometres"),
          h = SamplerUtils.localToGeographics(e, a, c, "kilometres"),
          p = SamplerUtils.localToGeographics(e, a, f, "kilometres"),
          g = SamplerUtils.localToGeographics(n, a, f, "kilometres"),
          v = SamplerUtils.createLineString([d.geometry.coordinates, h.geometry.coordinates]),
          m = SamplerUtils.createLineString([p.geometry.coordinates, g.geometry.coordinates]),
          b = SamplerUtils.e(v, m);
        if (0 === b.features.length) return;
        return {
          point: SamplerUtils.toPoint(b.features[0].geometry.coordinates),
          b1: SamplerUtils.addAngel(c, 180),
          b2: SamplerUtils.addAngel(f, 180),
        };
      })(t, e, n, a);

    if (!c) return SamplerUtils.createLineString([t, e]);
    let f = (function (t, e) {
        let n = SamplerUtils.normalizeAngel(t),
          a = SamplerUtils.normalizeAngel(e),
          o = !1;
        if ((n > a && n - a < 180) || a - n > 180) {
          let i = t;
          (t = e), (e = i), (o = !0);
        }
        return {
          b1: t,
          b2: e,
          changed: o,
        };
      })(c.b1, c.b2),
      d = f.b1,
      p = f.b2,
      g = f.changed,
      v = SamplerUtils.Interpolation(c.point, a, d, p, 20, "kilometres");
    return g && v.geometry.coordinates.reverse(), v;
  };

  return SamplerUtils;
};

/////////////////////////////////////////////////////////
// ResamplerArray
/////////////////////////////////////////////////////////
let ResamplerArray = function () {
  let navi_utils = daximap["DXMapUtils"]["naviMath"];
  let prototype = ResamplerArray.prototype;
  let info = this;
  info.array = [];
  info.maxCount = 30;
  prototype.push = function (vec) {
    if (info.array.length === 0) {
      for (let i = 0; i < info.maxCount; i++) {
        info.array.push([vec[0], vec[1], 0]);
      }
    } else {
      info.array.shift();
      info.array.push([vec[0], vec[1], 0]);
    }
  };
  prototype.getAverageValue = function () {
    let newRet = [0, 0, 0];
    for (let i = 0; i < info.array.length; i++) {
      newRet[0] += info.array[i][0];
      newRet[1] += info.array[i][1];
    }
    newRet[0] /= info.maxCount;
    newRet[1] /= info.maxCount;
    navi_utils.Vector3_normalize(newRet, newRet);
    return newRet;
  };
};

/////////////////////////////////////////////////////////
// SmoothPositionSampler
/////////////////////////////////////////////////////////
let SmoothPositionSampler = function (callback) {
  let navi_utils = daximap["DXMapUtils"]["naviMath"];
  let targetPose = [0, 0, 0];
  let targetHeading = 0;

  let targetObj = null;
  let info = this;
  info.headingRoute = 0.0;
  info.curPose = [0, 0, 0];
  info.curHeading = 0.0;
  info.floorId = "";
  info.resamplerArray = new ResamplerArray();
  let curT = 0.0;
  this.curT1 = 0.0;

  let isDirty = false;

  let prototype = SmoothPositionSampler.prototype;
  prototype.init = function (obj) {
    targetObj = obj;
  };

  prototype.setDirty = function (dirty) {
    isDirty = dirty;
  };
  let quatFrom = [0, 0, 0, 1];
  let quatTo = [0, 0, 0, 1];
  let quatCur = [0, 0, 0, 1];
  let vecEuler = [0, 0, 0];

  prototype.onRuning = function () {
    if (isDirty === false) return;
    curT += 0.1;
    if (curT > 1) {
      curT = 1.0;
    }
    let toPos = targetPose;
    let fromPos = info.curPose;
    let dir = [0, 0, 0];
    let temp = [0, 0, 0];
    let outPos = [0, 0, 0];
    navi_utils.Vector3_lerp(info.curPose, fromPos, toPos, curT);

    this.curT1 += 0.2;
    if (this.curT1 > 1) {
      this.curT1 = 1.0;
    }
    let dif = targetHeading - info.curHeading;

    if (dif < -180) dif = 360 + dif;
    if (dif > 180) dif = dif - 360;

    info.curHeading += this.curT1 * dif;
    if (info.curHeading < 0) info.curHeading = 360 + info.curHeading;
    if (info.curHeading > 360) info.curHeading = info.curHeading - 360;

    callback && callback();
    targetObj._setPositionOnly(info.curPose[0], info.curPose[1], info.bdid, info.floorId, info.curHeading, info.headingRoute);
    // console.log("SmoothPositionSampler setPositionOnly   ",new Date().getTime());
  };

  prototype.onTargetChanged = function (target_pose, target_heading, bdid, floorId, target_headingRoute) {
    targetPose = target_pose;
    targetHeading = target_heading;
    if (targetHeading < -180) targetHeading = 360 + targetHeading;
    if (targetHeading > 180) targetHeading = targetHeading - 360;
    info.curPose[0] = targetObj.position[0];
    info.curPose[1] = targetObj.position[1];
    info.curPose[2] = targetObj.position[2];
    info.curHeading = targetObj.heading;
    info.floorId = floorId;
    info.bdid = bdid;
    info.headingRoute = target_headingRoute;
    curT = 0;
    this.curT1 = 0;
    isDirty = true;
  };
};

/////////////////////////////////////////////////////////
// SmoothViewPositionSampler
/////////////////////////////////////////////////////////
let SmoothViewPositionSampler = function () {
  let navi_utils = daximap["DXMapUtils"]["naviMath"];
  let targetPose = [0, 0, 0];
  let targetHeading = 0;

  let targetObj = null;
  let info = this;

  info.curPose = [0, 0, 0];
  info.curHeading = 0.0;
  info.curTilt = 0.0;
  info.floorId = "";
  info.resamplerArray = new ResamplerArray();
  let curT = 0.0;
  this.curT1 = 0.0;

  let isDirty = false;

  let prototype = SmoothViewPositionSampler.prototype;
  prototype.init = function (obj) {
    targetObj = obj;
  };

  prototype.setDirty = function (dirty) {
    isDirty = dirty;
  };
  let quatFrom = [0, 0, 0, 1];
  let quatTo = [0, 0, 0, 1];
  let quatCur = [0, 0, 0, 1];
  let vecEuler = [0, 0, 0];

  prototype.onRuning = function () {
    if (isDirty === false) return;
    curT += 0.1;
    if (curT > 1) {
      curT = 1.0;
    }
    let toPos = targetPose;
    let fromPos = info.curPose;
    let dir = [0, 0, 0];
    let temp = [0, 0, 0];
    let outPos = [0, 0, 0];
    navi_utils.Vector3_lerp(info.curPose, fromPos, toPos, curT);

    this.curT1 += 0.2;
    if (this.curT1 > 1) {
      this.curT1 = 1.0;
    }
    let dif = targetHeading - info.curHeading;
    let caaa = this.curT1;

    if (dif < -180) dif = 360 + dif;
    if (dif > 180) dif = dif - 360;

    info.curHeading += this.curT1 * dif;
    if (info.curHeading < 0) info.curHeading = 360 + info.curHeading;
    if (info.curHeading > 360) info.curHeading = info.curHeading - 360;

    /////////////////////////////////////////////////
    let newVector = [Math.sin(info.curHeading * DEGREE_TO_RADIAN), Math.cos(info.curHeading * DEGREE_TO_RADIAN), 0];
    info.resamplerArray.push(newVector);
    let retVector = info.resamplerArray.getAverageValue();
    //navi_utils.Vector3_dot(cross, test_vec, line_vec );
    let headingView = Math.acos(navi_utils.Vector3_dot(retVector, [0, 1, 0])) * RADIAN_TO_DEGREE;
    if (retVector[0] < 0) {
      headingView = 360 - headingView;
    }
    targetObj._setPositionOnly(info.curPose[0], info.curPose[1], 0, 360 - headingView, info.curTilt);
    if (curT == 1.0 && this.curT1 == 1.0) {
      isDirty = false;
    }
  };

  prototype.onTargetChanged = function (target_pose, target_heading, target_tilt, floorId) {
    targetPose = target_pose;
    let tempTargetHeading = target_heading;
    if (tempTargetHeading < -180) tempTargetHeading = 360 + tempTargetHeading;
    if (tempTargetHeading > 180) tempTargetHeading = tempTargetHeading - 360;

    if (Math.abs(targetHeading - tempTargetHeading) > 0.001) {
      targetHeading = tempTargetHeading;
      this.curT1 = 0;
    }

    let cameraPose = targetObj.getCameraPose();
    info.curPose[0] = cameraPose["target_lng"];
    info.curPose[1] = cameraPose["target_lat"];
    info.curPose[2] = cameraPose["target_alt"];
    info.curHeading = 360 - cameraPose["heading"];
    info.curTilt = target_tilt;
    if (floorId) {
      info.floorId = floorId;
      targetObj.changeFloor(info.floorId);
    }

    curT = 0;
    isDirty = true;
  };
};

// SmoothPositionRootSampler
/////////////////////////////////////////////////////////
let SmoothPositionRootSampler = function () {
  let navi_utils = daximap["DXMapUtils"]["naviMath"];
  let targetPose = [0, 0, 0];
  let targetHeading = 0;
  let targetPathT = -1;
  let startPathT = -1;
  let targetObj = null;
  let info = this;

  info.curPose = [0, 0, 0];
  info.curHeading = 0.0;
  info.floorId = "";
  info.bdid = "";
  info.PathT = -1;
  let curT = 0.0;
  this.curT1 = 0.0;

  let isDirty = false;

  let prototype = SmoothPositionRootSampler.prototype;
  prototype.init = function (obj) {
    targetObj = obj;
  };

  prototype.setDirty = function (dirty) {
    isDirty = dirty;
  };
  let quatFrom = [0, 0, 0, 1];
  let quatTo = [0, 0, 0, 1];
  let quatCur = [0, 0, 0, 1];
  let vecEuler = [0, 0, 0];

  prototype.onRuning = function () {
    if (isDirty === false) return;
    curT += 0.1;
    if (curT > 1) {
      curT = 1.0;
    }
    if (startPathT >= 0 && targetPathT >= startPathT) {
      //targetObj.naviCore.
    }

    let toPos = targetPose;
    let fromPos = info.curPose;
    let dir = [0, 0, 0];
    let temp = [0, 0, 0];
    let outPos = [0, 0, 0];
    navi_utils.Vector3_lerp(info.curPose, fromPos, toPos, curT);

    //onChangePosition(curPose, info.currentStatus);

    this.curT1 += 0.2;
    if (this.curT1 > 1) {
      this.curT1 = 1.0;
    }
    let dif = targetHeading - info.curHeading;

    let caaa = this.curT1;

    if (dif < -180) dif = 360 + dif;
    if (dif > 180) dif = dif - 360;

    info.curHeading += this.curT1 * dif;
    if (info.curHeading < 0) info.curHeading = 360 + info.curHeading;
    if (info.curHeading > 360) info.curHeading = info.curHeading - 360;
    targetObj.setPosition(info.curPose[0], info.curPose[1], info.bdid, info.floorId, info.curHeading);
  };

  prototype.onTargetChanged = function (target_pose, target_heading, bdid, floorId, sPathT, tPathT) {
    targetPose = target_pose;
    targetHeading = target_heading;
    targetPathT = tPathT;
    startPathT = sPathT;
    info.curPose[0] = targetObj.position[0];
    info.curPose[1] = targetObj.position[1];
    info.curPose[2] = targetObj.position[2];
    info.curHeading = targetObj.heading;
    info.floorId = floorId;
    info.bdid = bdid;
    info.pathT = startPathT;
    curT = 0;
    this.curT1 = 0;
    isDirty = true;
  };
};

/////////////////////////////////////////////////////////
// TimeConditionTrigger
/////////////////////////////////////////////////////////
let TimeConditionTrigger = function (triggerTime) {
  let obj = {};
  obj.maxTime = triggerTime;
  obj.timer = null;
  obj.EventTimeTrigger = new EventHandler("timeTrigger");
  obj.start = function () {
    clearTimeout(obj.timer);
    obj.timer = setTimeout(function () {
      obj.EventTimeTrigger._notifyEvent(obj, 0);
    }, obj.maxTime);
  };
  obj.stop = function () {
    clearTimeout(obj.timer);
  };
  return obj;
};

/** 路线站点类型常量 */
let STATION_TYPE_HEAD = "0"; // 头部站点
let STATION_TYPE_START = "1"; // 起点站点
let STATION_TYPE_SEGMENT = "2"; // 路段中间站点
let STATION_TYPE_SEGMENT_END = "3"; // 路段结束站点
let STATION_TYPE_CHANGE_FLOOR = "4"; // 楼层切换起始站点
let STATION_TYPE_CHANGE_FLOOR_END = "5"; // 楼层切换结束站点
let STATION_TYPE_END = "8"; // 终点站点
let STATION_TYPE_ACTION_TO_TARGET = "9"; // 到达目标动作站点
let STATION_TYPE_ACTION = "10"; // 动作站点

/**
 * 导航距离阈值常量（单位：米）
 * 用于判断到达各类站点的距离触发条件
 */
let endDistance = 0; // 终点触发距离
let startStationDistance = 0.0; // 起点站点触发距离
let changeFloorStationDistance = 4; // 楼层切换站点触发距离
let changeFloorEndStationDistance = 1; // 楼层切换结束站点触发距离
let segmentEndStationDistance = 0.5; // 路段结束站点触发距离
let endStationDistance = 6; // 终点站点触发距离

/**
 * 原始路线数据类
 * 存储和管理导航路线的核心数据结构
 * @param {Object} naviCore - 导航核心实例
 */
let RawRoute = function (naviCore) {
  let navi_utils = daximap["DXMapUtils"]["naviMath"];
  let RouteFloorObject = function (route) {
    let thisObject = this;
    thisObject.route = route;
    thisObject.extent = [];
    thisObject.renderObjects = [];
    thisObject.backgroundRenderObjects = [];
    thisObject.arrowRenderObjects = [];
    thisObject.stations = [];

    let proto = RouteFloorObject.prototype;
    proto.setGeometry = function (geometry) {
      this.geometry = geometry;
      let routeResampler = thisObject.route.naviCore.routeResampler;
      let points = [];
      geometry.forEach(function (point) {
        points.push([point["x"], point["y"]]);
      });
      let smoothRoute = routeResampler.resampler(points)[0];
      // let smoothRoute = this.smoothRoute;
      smoothRoute[0].segment_length = 0;
      let total_length = 0;
      this.smoothRoute = [];
      this.smoothRoute.push({ x: smoothRoute[0][0], y: smoothRoute[0][1], segment_length: 0 });
      for (let i = 1, len = smoothRoute.length; i < len; i++) {
        let p1 = smoothRoute[i - 1],
          p2 = smoothRoute[i];
        p2.segment_length = navi_utils.getGeodeticCircleDistance({ x: p1[0], y: p1[1] }, { x: p2[0], y: p2[1] });
        this.smoothRoute.push({ x: p2[0], y: p2[1], segment_length: p2.segment_length });
        total_length += p2.segment_length;
      }
      this.smoothRoute.total_length = total_length;
    };
    proto.setVisible = function (bVisible) {
      let thisObject = this;
    };

    proto.getCurrentPose = function (t) {
      let thisObject = this;
      let curPose = {};
      curPose.headingTilt = [0, 0];
      curPose.floorId = thisObject.floor;
      // thisObject.route.getCurrentPoseInFloor(curPose, thisObject.geometry, t);
      thisObject.route.getCurrentPoseInFloor(curPose, thisObject.smoothRoute, t);
      return curPose;
    };

    proto.clear = function (clearBackground) {
      let thisObject = this;
      for (let objIndex in thisObject.renderObjects) {
        let obj = thisObject.renderObjects[objIndex];
        navi_map.deleteObject(obj);
      }

      for (let objIndex in thisObject.arrowRenderObjects) {
        let obj = thisObject.arrowRenderObjects[objIndex];
        navi_map.deleteObject(obj);
      }

      thisObject.renderObjects = [];
      thisObject.arrowRenderObjects = [];
      thisObject.stations = [];
      if (clearBackground) {
        for (let objIndex in thisObject.backgroundRenderObjects) {
          let obj = thisObject.backgroundRenderObjects[objIndex];
          navi_map.deleteObject(obj);
        }
      }
    };

    proto.addChildObject = function (ro, isBackground) {
      let thisObject = this;
      if (isBackground) {
        thisObject.backgroundRenderObjects.push(ro);
      } else {
        thisObject.renderObjects.push(ro);
      }
    };
    proto.getChildObject = function (key) {};
  };

  let naviRoute = {};
  naviRoute.lastStation = null;
  naviRoute.naviCore = naviCore;
  naviRoute.stations = [];
  naviRoute.arriveMethods = {};
  naviRoute.floorObjects = [];
  naviRoute.floorObjectMap = {};
  naviRoute.sections = [];
  naviRoute.currentCursor = 0;
  naviRoute.status = NAVIGATE_FULLVIEW;
  naviRoute.total_length = 0;
  naviRoute.display = function () {
    naviRoute.showArrow(naviRoute.currentCursor);
  };

  naviRoute.reset = function () {
    if (naviRoute.floorObjects) {
      naviRoute.floorObjects.forEach(function (floorObject) {
        floorObject.arrowRenderObjects.forEach(function (arrow) {
          arrow["removeFromMap"]();
        });
        floorObject.arrowRenderObjects = [];
      });
    }

    naviRoute.stations = [];
    naviRoute.arriveMethods = {};
    naviRoute.floorObjects = [];
    naviRoute.floorObjectMap = {};
    naviRoute.sections = [];
    naviRoute.currentCursor = 0;
  };

  naviRoute.getFloorObject = function (floorId) {
    return naviRoute.floorObjectMap[floorId];
  };
  naviRoute.getFloorObjectGeometry = function (floorId) {
    let geometrys = [];
    let floorObjects = naviRoute.floorObjectMap[floorId];
    floorObjects.forEach(function (floorObject) {
      geometrys = geometrys.concat(floorObject.geometry);
    });
    return geometrys;
  };

  naviRoute.createFloorObject = function (floorId, index) {
    if (naviRoute.floorObjectMap[floorId] === undefined) {
      naviRoute.floorObjectMap[floorId] = [];
    }
    let floorObjects = naviRoute.floorObjectMap[floorId];
    let floorObject = new RouteFloorObject(this);
    //floorObject.extent = oldFloorObject.extent;//floorExtent[floorID];
    floorObject.floor = floorId;
    floorObjects.push(floorObject);
    floorObject.routeIndex = index;
    // naviRoute.floorObjectMap[floorId] = floorObject;
    return floorObject;
  };

  function getAngle2(start, end) {
    let diff_x = (end.x - start.x) * 100000,
      diff_y = (end.y - start.y) * 100000;
    let InvLength = 1 / Math.sqrt(diff_x * diff_x + diff_y * diff_y);
    let vec2 = [diff_x * InvLength, -diff_y * InvLength];
    let vec1 = [0, 1];

    //navi_utils.Vector3_dot = function( vec1, vec2 ) {
    let dotValue = vec1[0] * vec2[0] + vec1[1] * vec2[1];
    let angle = (Math.acos(dotValue) / Math.PI) * 180;

    if (diff_x < 0) {
      angle = 360 - angle;
    }
    return angle;
  }

  naviRoute.getCurrentPoseInFloor = function (curPose, geometry, t) {
    let pos = [geometry[0].x, geometry[0].y, 0];
    if (t > 1) {
      t = 1;
    }
    curPose.pos = pos;
    let distance = 0;
    let geolen = geometry.length;
    let maxIndex = geolen - 1;
    for (let i = 1; i < geolen; i++) {
      let cur_segment_length = geometry[i].segment_length;
      let start_t = distance / geometry.total_length;
      distance += cur_segment_length;
      let end_t = distance / geometry.total_length;
      // if ((end_t < t) && (t != 1 || i < maxIndex)) {
      if (end_t < t) {
        continue;
      }
      //t < end_t;
      let cur_t = (t - start_t) / (end_t - start_t);
      if (isNaN(cur_t)) {
        cur_t = 0;
      }
      let temp = [0, 0, 0];
      let dir_ecef = [0, 0, 0];
      let a_sphr = [geometry[i - 1].x * DEGREE_TO_RADIAN, geometry[i - 1].y * DEGREE_TO_RADIAN, earthRadius];
      let b_sphr = [geometry[i].x * DEGREE_TO_RADIAN, geometry[i].y * DEGREE_TO_RADIAN, earthRadius];
      let a_ecef = [0, 0, 0];
      let b_ecef = [0, 0, 0];

      let up_ecef = [0, 0, 0];
      let right_ecef = [0, 0, 0];
      let north_ecef = [0, 0, 0];
      let test_ecef = [0, 0, 0];

      navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
      navi_utils.transformGeographicToECEF(b_ecef, b_sphr);
      navi_utils.Vector3_sub(temp, b_ecef, a_ecef);
      navi_utils.Vector3_normalize(dir_ecef, temp);
      /////////////////////////////////////////////
      navi_utils.Vector3_normalize(up_ecef, a_ecef);
      navi_utils.Vector3_cross(right_ecef, [0, 0, 1], up_ecef);
      navi_utils.Vector3_cross(north_ecef, up_ecef, right_ecef);
      navi_utils.Vector3_normalize(north_ecef, north_ecef);

      let heading = (Math.acos(navi_utils.Vector3_dot(north_ecef, dir_ecef)) / Math.PI) * 180;
      navi_utils.Vector3_cross(test_ecef, north_ecef, dir_ecef);
      if (navi_utils.Vector3_dot(up_ecef, test_ecef) > 0) {
        heading = 360 - heading;
      }

      /////////////////////////////////////////////
      navi_utils.Vector3_scale(temp, dir_ecef, cur_t * cur_segment_length);
      navi_utils.Vector3_add(pos, a_ecef, temp);
      navi_utils.transformECEFToGeographic(pos, pos);
      pos[0] = pos[0] * RADIAN_TO_DEGREE;
      pos[1] = pos[1] * RADIAN_TO_DEGREE;
      pos[2] = pos[2] - earthRadius;
      curPose.headingTilt = [heading, 0];
      break;
    }
  };

  naviRoute.getCurrentPose = function (t) {
    let curPose = {};
    curPose.headingTilt = [0, 0];
    let geo_t = 0;
    for (let geoIndex = 0; geoIndex < naviRoute.floorObjects.length; geoIndex++) {
      let floorObject = naviRoute.floorObjects[geoIndex];
      let geometry = floorObject.smoothRoute; //floorObject.geometry;
      let start_geo_t = geo_t;
      let temp_t = geometry.total_length / naviRoute.total_length;
      geo_t += temp_t;
      if (t > geo_t) {
        continue;
      }
      let new_t = (t - start_geo_t) / temp_t;
      curPose.floor = floorObject.floor;
      naviRoute.getCurrentPoseInFloor(curPose, geometry, new_t);
      break;
    }
    return curPose;
  };

  naviRoute.snapToNearestPathLine = function (x, y, floorId, result) {
    let curr = naviCore.route.currentCursor;
    if (naviCore.isNavigationPause || curr < 0) {
      curr = 0;
    }
    let pos_ecef = [0, 0, 0];
    let pos_sphr = [indicator.pos[0] * DEGREE_TO_RADIAN, indicator.pos[1] * DEGREE_TO_RADIAN, earthRadius];
    navi_utils.transformGeographicToECEF(pos_ecef, pos_sphr);

    for (let i = curr; i < naviRoute.stations.length; i++) {
      let station = naviRoute.stations[i];
      if (station.floor !== floorId) continue;
      if (
        station.type === STATION_TYPE_SEGMENT ||
        station.type === STATION_TYPE_SEGMENT_END ||
        station.type === STATION_TYPE_END ||
        station.type === STATION_TYPE_ACTION ||
        station.type === STATION_TYPE_ACTION_TO_TARGET
      ) {
        let segment = station.segment;
        for (let j = 0; j < segment.length - 1; j++) {
          let a_sphr = [segment[j].x * DEGREE_TO_RADIAN, segment[j].y * DEGREE_TO_RADIAN, earthRadius];
          let b_sphr = [segment[j + 1].x * DEGREE_TO_RADIAN, segment[j + 1].y * DEGREE_TO_RADIAN, earthRadius];
          let a_ecef = [0, 0, 0];
          let b_ecef = [0, 0, 0];
          let root_ecef = [0, 0, 0];
          navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
          navi_utils.transformGeographicToECEF(b_ecef, b_sphr);
          let tempDistance = navi_utils.pointToLine(pos_ecef, a_ecef, b_ecef, root_ecef);
          //todo:需要精细计算具体的距离
          if (result.minDistance > tempDistance) {
            let B = segment[segment.length - 1];
            result.minDistance = tempDistance;
            result.targetDistance = navi_utils.getGeodeticCircleDistance({ x: x, y: y }, B);
            result.index = i;
            result.floor = station.floor;
            result.station = station;
            navi_utils.transformECEFToGeographic(root_ecef, root_ecef);
            root_ecef[0] *= RADIAN_TO_DEGREE;
            root_ecef[1] *= RADIAN_TO_DEGREE;
            result.nearestPt = { x: root_ecef[0], y: root_ecef[1] };
          }
        }
      }
    }
    if (result.index != -1) {
      lastIndex = result.index;
      return true;
    }
    return false;
  };

  naviRoute.getNearestStation = function (indicator, result) {
    let curr = naviCore.route.currentCursor; //0;
    // let curr = 0;
    if (naviCore.isNavigationPause || curr < 0) {
      curr = 0;
    }
    let indicatorFloorHasRoute = false;
    for (let i = curr; i < naviRoute.stations.length; i++) {
      let station = naviRoute.stations[i];
      if (station.floor !== indicator.floorId || station.type === STATION_TYPE_HEAD) {
        continue;
      }
      let floorObjectIndex = station.floorObjectIndex;
      indicatorFloorHasRoute = true;
      if (station.type === STATION_TYPE_START) {
        let position = station.position;
        let tempDistance = navi_utils.getGeodeticCircleDistance(
          {
            x: indicator.pos[0],
            y: indicator.pos[1],
          },
          { x: position[0], y: position[1] }
        );
        if (tempDistance < startStationDistance) {
          result.minDistance = tempDistance;
          result.targetDistance = tempDistance;
          result.index = 0;
          result.floor = station.floor;
          result.nearestPt = { x: position[0], y: position[1] };
          result.station = station;
          result.heading = station.heading;
          result.floorObjectIndex = floorObjectIndex;
          break;
        }
      } else {
        let endDistance = 0;
        if (
          station.type === STATION_TYPE_ACTION_TO_TARGET ||
          station.type === STATION_TYPE_END ||
          station.type === STATION_TYPE_CHANGE_FLOOR_END ||
          station.type == STATION_TYPE_SEGMENT_END
        ) {
          //station.type === STATION_TYPE_SEGMENT_END ||
          if (naviCore.getIsSimulate()) {
            endDistance = 1;
          } else {
            if (station.type === STATION_TYPE_SEGMENT_END || station.type === STATION_TYPE_ACTION_TO_TARGET) {
              endDistance = segmentEndStationDistance;
            } else {
              endDistance = naviCore.endStationDistance || endStationDistance;
            }
          }
        }
        naviRoute.computeSegmentDis(station, result, endDistance, indicator, i);
        if (i < naviRoute.stations.length - 2 && result.station == station && station.extendType && (result.targetDistance < 1 || station.arrivedTime)) {
          let nextFloorPos = naviRoute.stations[i + 2].segment[1];
          if (!station.arrivedTime && station.useTime) {
            station.arrivedTime = Date.now() + station.useTime;
          } else {
            let pos = station.segment[1];
            let pt = (Date.now() - station.arrivedTime) / 1000 / station.useTime;
            if (pt > 1) {
              pt = 1;
            } else if (pt < 1) {
              result.minDistance = 0;
            }

            indicator.pos[0] = result.nearestPt.x = pos.x + (nextFloorPos.x - pos.x) * pt;
            indicator.pos[1] = result.nearestPt.y = pos.y + (nextFloorPos.y - pos.y) * pt;
          }
        }
        //  非最近station.  result.minDistance < endDistance ||
        if (result.station != station || !result.station.roadInfo) {
          continue;
        }
        if (
          station.type === STATION_TYPE_SEGMENT ||
          station.type === STATION_TYPE_SEGMENT_END ||
          station.type === STATION_TYPE_END ||
          station.type === STATION_TYPE_ACTION_TO_TARGET ||
          station.type === STATION_TYPE_ACTION ||
          station.type === STATION_TYPE_CHANGE_FLOOR ||
          station.type === STATION_TYPE_CHANGE_FLOOR_END
        ) {
          let isInStation = result.isInStation;
          let testStation = result.station;
          let testStation = result.station;
          let segment = station.segment;

          if (isInStation && testStation !== undefined && result.station.roadInfo !== undefined) {
            let position = testStation.roadInfo.nearestPt;
            let B = segment[segment.length - 1];
            let _tempDistance = navi_utils.getGeodeticCircleDistance(position, B);
            let _startToBeginPointDistance = testStation.distance - _tempDistance; //
            let _showDistace = testStation.roadInfo.result.Result["distance"];
            let _endToBeginPointDistance = _startToBeginPointDistance + _showDistace;
            let _start = _startToBeginPointDistance / testStation.distance;
            let _end = _endToBeginPointDistance / testStation.distance;
            _start = Math.min(1, Math.max(_start, 0));
            _end = Math.min(1, Math.max(_end, 0));
            let _curr = 1 - result.targetDistance / testStation.distance;
            if (_curr > _start && _curr < _end && !station.roadCrossFinished) {
              //&& tempDistance <= endDistance) {
              // khronus modify
              result.floor = station.floor;
              result.roadResult = testStation.roadInfo.result.Result;
              station.roadCrossShow = true;
              //break;
            } else {
              if (station.roadCrossShow) {
                station.roadCrossFinished = true;
                station.roadCrossShow = false;
              }
              result.roadResult = undefined;
            }
          }
        }
      }
    }

    if (result.index != -1) {
      naviRoute.computeTime(naviCore.route, result, indicator);
      result.minDistance = result.minDistance.toFixed(1) * 1;
      lastIndex = result.index;
      return true;
    }
    if (indicatorFloorHasRoute === false) {
      result.minDistance = 500;
    }
    return false;
  };
  naviRoute.computeSegmentDis = function (station, result, endDistance, indicator, stationIndex) {
    let pos_ecef = [0, 0, 0];
    let pos_sphr = [indicator.pos[0] * DEGREE_TO_RADIAN, indicator.pos[1] * DEGREE_TO_RADIAN, earthRadius];
    navi_utils.transformGeographicToECEF(pos_ecef, pos_sphr);
    let segment = station.segment;
    let isInStation = false;
    if (!segment || segment.length <= 1) {
      let position = station.position;
      let tempDistance = navi_utils.getGeodeticCircleDistance({ x: indicator.pos[0], y: indicator.pos[1] }, { x: position[0], y: position[1] });
      if (tempDistance < endDistance && result.minDistance - tempDistance > 0.001) {
        result.minDistance = tempDistance;
        result.targetDistance = tempDistance;
        result.index = stationIndex;
        result.nearestPt = { x: position[0], y: position[1] };
        result.floor = station.floor;
        result.byway = station.angelIcon;
        result.nextFloor = station.nextFloor;
        result.station = station;
        result.pathArrIndex = station.floorObjectIndex;
        result.isInStation = true;
        result.pointIndex = station.pointIndex;
      }
    } else {
      let outDis = 0; //走过的
      for (let j = 0; j < segment.length - 1; j++) {
        let a_sphr = [segment[j].x * DEGREE_TO_RADIAN, segment[j].y * DEGREE_TO_RADIAN, earthRadius];
        let b_sphr = [segment[j + 1].x * DEGREE_TO_RADIAN, segment[j + 1].y * DEGREE_TO_RADIAN, earthRadius];
        let a_ecef = [0, 0, 0];
        let b_ecef = [0, 0, 0];
        let root_ecef = [0, 0, 0];
        navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
        navi_utils.transformGeographicToECEF(b_ecef, b_sphr);
        let tempDistance = navi_utils.pointToLine(pos_ecef, a_ecef, b_ecef, root_ecef);
        // TODO: 需要精细计算具体的距离
        outDis += segment[j].segment_length;
        let lastDis = 0;
        for (let m = j + 2; m < segment.length; m++) {
          lastDis += segment[m].segment_length || 0;
        }
        if (result.minDistance == 999999 || result.minDistance - tempDistance >= 0) {
          if (b_ecef.toString() == root_ecef.toString()) {
            result.targetDistance = lastDis - tempDistance;
          } else if (a_ecef.toString() == root_ecef.toString()) {
            result.targetDistance = tempDistance + (segment[j + 1].segment_length || 0) + lastDis;
          } else {
            result.targetDistance = navi_utils.getGeodeticCircleDistance({ x: indicator.pos[0], y: indicator.pos[1] }, segment[j + 1]) + lastDis; //(segment[j+1].segment_length||0)+ lastDis - outDis - navi_utils.getGeodeticCircleDistance({ x: indicator.pos[0], y: indicator.pos[1] }, segment[j]);
          }

          result.minDistance = tempDistance;
          result.index = stationIndex;
          result.floor = station.floor;
          result.station = station;
          navi_utils.transformECEFToGeographic(root_ecef, root_ecef);
          root_ecef[0] *= RADIAN_TO_DEGREE;
          root_ecef[1] *= RADIAN_TO_DEGREE;
          result.nearestPt = { x: root_ecef[0], y: root_ecef[1] };
          result.heading = navi_utils.calcHeading(segment[j], segment[j + 1]);
          result.isInStation = true;
          result.floorObjectIndex = station.floorObjectIndex;
        }
      }
    }

    return false;
  };
  naviRoute.computeTime = function (route, matchResult, indicator) {
    let stations = route.stations;
    let floorId = matchResult.floor;
    let routeIndex = matchResult.station.floorObjectIndex;
    let _index = matchResult.index;
    let floorRouteDis = route.floorObjects[routeIndex].geometry.total_length;
    let t = 0;
    let walkedRouteDis = 0;
    for (let i = 0, len = stations.length; i < len; i++) {
      let station = stations[i];
      if (station.floorObjectIndex == routeIndex && station.distance) {
        if (i < _index) {
          walkedRouteDis += station.distance;
        } else if (i == _index) {
          walkedRouteDis += station.distance;
          walkedRouteDis -= matchResult.targetDistance;
        }
      }
    }
    t = walkedRouteDis / floorRouteDis;

    matchResult.walkedRouteRatio = t;
    return 0;
  };

  naviRoute.updateInfo = function (targetDistance, stationsInfo, speakType, callback) {
    let currentCursor = naviRoute.currentCursor;
    if (naviCore.naviSpeakType == 2) {
      currentCursor = currentCursor--;
    }
    let station = naviRoute.stations[currentCursor];
    let isGray = false;
    if (naviCore.isSwipe === true) {
      isGray = true;
    }
    naviCore.updateRouteInfo(currentCursor, isGray, targetDistance, station, speakType, callback);
    if (station.type === "0" || station.type === "1") {
      let data = naviRoute.getLastDistance(0);
      data["speakType"] = speakType;
      naviCore.updateNaviProgressInfo(data);
    }
    naviRoute.display();
  };

  naviRoute.getLastDistance = function (targetDistance, result) {
    if (naviRoute.currentCursor < 0) {
      //result.index
      naviRoute.currentCursor = result.index;
    }
    // let station = naviRoute.stations[naviRoute.currentCursor];
    let station = naviRoute.stations[result.index];
    let speedDis = 0;
    let _distance = 0,
      _time = 0,
      _data,
      _progress;
    if (station.type === "0" || station.type === "1") {
      _distance = Math.ceil(naviRoute.total_length);
    } else if (station.type === "2" || station.type === "3" || station.type === "8" || station.type === "4" || station.type === "5") {
      let last = 0;
      let _station;
      for (let i = 2; i <= result.index; i++) {
        _station = naviRoute.stations[i];
        if (_station.type === "2" || _station.type === "3" || _station.type === "8" || _station.type === "4" || _station.type === "5") {
          let segment = _station.segment;
          if (segment.segment_length == undefined && segment) {
            segment.segment_length = 0;
            segment.forEach(function (item) {
              segment.segment_length += item.segment_length || 0;
            });
          }
          // last += segment.segment_length;
          speedDis += segment.segment_length;
        }
      }
      speedDis -= targetDistance;
      // _distance = Math.ceil(last + targetDistance); // 计算有误
      _distance = Math.ceil(naviRoute.total_length - speedDis);
      let speedRate = 1 * 0.83 * 1000;
      for (let i = result.index, len = naviRoute.stations.length; i < len; i++) {
        let _station = naviRoute.stations[i];
        let _segment = _station.segment;
        if (i == result.index) {
          let compDis = 0;
          for (let j = _segment.length - 1; j > 0; j--) {
            if (compDis + _segment[j].segment_length >= targetDistance) {
              _time += ((compDis + _segment[j].segment_length - targetDistance) * speedRate) / _segment[j].speed;
              break;
            } else {
              _time += (_segment[j].segment_length * speedRate) / _segment[j].speed;
            }
            compDis += _segment[j].segment_length;
          }
        } else {
          for (let j = 1; j < _segment.length; j++) {
            _time += (_segment[j].segment_length * speedRate) / _segment[j].speed;
          }
        }
      }
    }

    if (_distance < 0) {
      _progress = 0;
    } else {
      _progress = (speedDis / naviRoute.total_length) * 100;
    }
    if (naviRoute.currentCursor == 0 && naviRoute.stations.length) {
      let _index = naviRoute.stations.length >= 3 ? result.index : naviRoute.stations.length - 1;
      targetDistance = Math.ceil(naviRoute.stations[_index].distance);
    }
    targetDistance = Math.ceil(targetDistance);
    let disUnit = window["langData"]["meter:distance"] || "米";
    if (this.language == "En") {
      disUnit = " meters ";
    }
    _data = {
      extraDistance: _distance + disUnit,
      extraTime: navi_utils.MillisecondToDate(_time, this.language),
      extraProgress: _progress,
      total_length: naviRoute.total_length,
      targetDistance: targetDistance,
      lastDistance: _distance,
      angelText: station.angelText,
      angelIcon: station.angelIcon,
      stationIndex: naviRoute.currentCursor,
      floorId: station.floor,
      isEnd: station.type == 8,
    };
    if (!station.angelText && station.targetName) {
      _data["angelText"] = (window["langData"]["navi:daoda"] || "到达") + station.targetName;
    }
    if (station.speakText && station.speakText != "none") {
      _data["speakText"] = station.speakText;
    }
    return _data;
  };

  naviRoute.getLastDistance2 = function (targetDistance) {
    let station = naviRoute.stations[naviRoute.currentCursor];
    let _distance = 0,
      _time = 0,
      _data,
      _progress;
    if (station.type === "0" || station.type === "1") {
      _distance = Math.ceil(naviRoute.total_length);
    } else if (station.type === "2" || station.type === "3" || station.type === "9" || station.type === "7" || station.type === "4" || station.type === "5") {
      let last = 0;
      for (let i = naviRoute.currentCursor + 1; i < naviRoute.stations.length; i++) {
        station = naviRoute.stations[i];
        if (station.type === "2" || station.type === "3" || station.type === "9" || station.type === "7" || station.type === "4" || station.type === "5") {
          let segment = station.segment;
          if (segment.segment_length == undefined) {
            segment.segment_length = 0;
            for (let i = 0, len = segment.length; i < len; i++) {
              segment.segment_length += segment[i].segment_length || 0;
            }
          }
          last += segment.segment_length;
        }
      }
      _distance = Math.ceil(last + targetDistance);
      let speedRate = 1 * 0.83 * 1000;
      for (let i = result.index, len = naviRoute.stations.length; i < len; i++) {
        let station = naviRoute.stations[i];
        let segment = station.segment;
        if (i == result.index) {
          let compDis = 0;
          for (let j = segment.length - 1; j > 0; j--) {
            // compDis+=segment[j].segment_length;
            if (compDis + segment[j].segment_length >= targetDistance) {
              _time += ((compDis + segment[j].segment_length - targetDistance) * speedRate) / segment[j].speed;
              break;
            } else {
              _time += (segment[j].segment_length * speedRate) / segment[j].speed;
            }
            compDis += segment[j].segment_length;
          }
        } else {
          for (let j = 1; j < segment.length; j++) {
            _time += (segment[j].segment_length * speedRate) / segment[j].speed;
          }
        }
      }
    }

    _progress = ((naviRoute.total_length - _distance) / naviRoute.total_length) * 100;
    // _data = { "extraDistance": _distance + (window["langData"]["meter:distance"]||"米"), "extraTime": navi_utils.MillisecondToDate(_time), "extraProgress": _progress, "lastDistance": _distance };
    let disUnit = window["langData"]["meter:distance"] || "米";
    if (this.language == "En") {
      disUnit = " meters ";
    }
    _data = {
      extraDistance: _distance + disUnit,
      extraTime: navi_utils.MillisecondToDate(_time, this.language),
      extraProgress: _progress,
      total_length: naviRoute.total_length,
      targetDistance: targetDistance,
      lastDistance: _distance,
      angelText: station["angelText"],
      angelIcon: station["angelIcon"],
      stationIndex: naviRoute.currentCursor,
      floorId: station.floor,
    };

    return _data;
  };

  naviRoute.getFloorShowData = function (floorNum, result) {
    let info = {};
    let floorArr = [];
    let dir = "up";
    let byway = "";
    for (let i = 0; i < naviRoute.stations.length; i++) {
      let station = naviRoute.stations[i];
      if (station.type !== "4" && station.type !== "5") continue;
      if (station.type === "4") {
        let byway = RouteParseHelper.getTypeByIconName(station.angelIcon);
        let typename = station.angelIcon.split("_");

        if (typename.length == 2) {
          dir = typename[0].split("-")[1];
        } else {
          dir = typename[0].split("-")[1] + typename[1];
        }
      }
      if (station.type === "5") {
        dir = floorArr[floorArr.length - 1].dir;
        byway = floorArr[floorArr.length - 1].byWay + "_out";
      }
      info.floor = station.floor;
      info.type = station.type;
      info.byWay = byway;
      info.dir = dir;
      floorArr.push(info);
      info = {};
    }

    for (let i = 0; i < floorArr.length - 1; i += 2) {
      let A = floorArr[i];
      let B = floorArr[i + 1];
      if (A.floor < floorNum && floorNum < B.floor) {
        result.byWay = A.byWay;
        result.dir = A.dir;
        result.floor = floorNum;
      }
    }
  };

  naviRoute.showArrow = function (index) {
    for (let i = 2, stationCount = naviRoute.stations.length; i < stationCount; i++) {
      let station = naviRoute.stations[i];
      if (station.arrowObject) {
        // station.arrowObject.setVisible(i===index);
        // station.arrowObject.setIsActive(i === index);
        station.arrowObject.visible = i === index; //setIsActive(i === index);
      }
    }
  };
  return naviRoute;
};
///////////////////////////////////////////////////////////////////////////////
// RawRouteParser
///////////////////////////////////////////////////////////////////////////////
let RawRouteParser = function () {
  /**
   * Generate Navi Data （Text and Speak）
   * @param naviRoute
   */
  let thisObject = {};
  let station_start_func = RouteParseHelper.station_start_func;
  /**
   * Create Route
   * @returns {{}}
   */
  let endText = "本次导航结束，欢迎您再次使用室内导航!";
  // if(thisObject.language == "En"){
  //     endText = "You have arrived near your destination. This navigation is over"
  // }
  let DXMapUtils = daximap["DXMapUtils"];
  let navi_utils = DXMapUtils["naviMath"];
  let mapPoiStyle = window["DaxiMap"]["mapPoiStyle"];
  thisObject.createRoute = function (naviCore, data, routeState, options) {
    // naviCore.mapAPI._coreMap.clearRouteArrow();

    thisObject.language = (options && options["language"]) || "Zh";
    endText = window["langData"]["end:tip:navi"] || "本次导航结束，欢迎您再次使用室内导航!";
    if (thisObject.language == "En") {
      endText = "You have arrived near your destination. This navigation is over";
    }
    let naviRoute = RouteParseHelper.createRouteImpl(naviCore);
    let route = data["route"][0];
    let path = route["path"];
    let keyPoints = path["keyPoints"];
    if (data["parm"] && data["parm"]["endPoint"]) {
      let endPoint = data["parm"]["endPoint"];
      naviRoute.targetId = endPoint["stopid"];
      naviRoute.targetName = endPoint["dsp"] || endPoint["endCnName"] || endPoint["name"] || window["langData"]["destnation"] || "目的地";
      naviRoute.targetLocal = endPoint["address"] || "";
      naviRoute.distance = route["distance"];
    }

    naviRoute.currentCursor = 0;
    naviRoute.bdid = route["buildingId"];
    RouteParseHelper.matchInnerIndex(naviCore, path);
    naviRoute.rawRoute = JSON.stringify(data);

    // 2016-01-28 lishuang filter middle path
    RouteParseHelper.fileterSameLayerData(path);
    RouteParseHelper.parseIconType(path);
    RouteParseHelper.parseArriveMethods(naviRoute.arriveMethods, path, thisObject.language);
    RouteParseHelper.convertPathCoords(naviCore, path);

    // RouteParseHelper.proloadRoadCross(data);
    parseStations(naviRoute, path, route["roadCrossData"], thisObject.language);
    if (keyPoints && keyPoints.length) {
      keyPoints.forEach(function (keyPoint) {
        let floorId = keyPoint["floorId"];
        let pos = keyPoint["pos"];
        let iconType = keyPoint["icon"];
        let floorObject = naviRoute.getFloorObject(floorId);
        let renderObjects = floorObject[0].renderObjects;
        let mapAPI = naviCore.mapAPI;

        createIconMarker(mapAPI, renderObjects, floorId, iconType, pos);
      });
    }
    generateNaviData(naviRoute, naviCore.minLenSegment, naviCore.maxSegmentCount, routeState, thisObject.language);
    naviCore.route = naviRoute;
    naviCore.updateRouteInfo(2);
    return naviRoute;
  };
  // drawLine
  thisObject.createLines = function (naviCore, floorId, lineString, routeState, index) {
    // let naviRoute = thisObject.route;

    let tempArr = lineString.split(";");
    let pointString = tempArr.join(",0.5;");
    pointString += ",0.5";
    let naviRoute = RouteParseHelper.createRouteImpl(naviCore);
    naviRoute.createFloorObject(floorId, index);
    let floorObjects = naviRoute.getFloorObject(floorId);
    floorObjects.forEach(function (floorObject) {
      let renderObjects = floorObject.renderObjects;
      let factory = naviCore.mapAPI.scene.factory;
      let isVisible = floorId === naviCore.mapAPI.cameraCtrl.getCurrentFloorId();
      let assetsPath = naviCore.mapAPI.config.assetsPath;
      let guid = factory.createUUID();
      let devicePixel = window["devicePixelRatio"];
      let _width1 = Math.round(6 * devicePixel);
      let _wrapScale1 = Math.round(4 * devicePixel);
      let bacl_polyline = factory.createPolyline(guid, guid, pointString, floorId, joinPath(assetsPath, getIconLink("line2")), _width1, _wrapScale1, true);
      bacl_polyline.setVisible(isVisible);
      renderObjects.push(bacl_polyline);
      let guid = factory.createUUID();
      let _width2 = Math.round(5 * devicePixel);
      let _wrapScale2 = Math.round(4 * devicePixel);
      let polyline = factory.createPolyline(guid, guid, pointString, floorId, joinPath(assetsPath, "images/line_blue.png"), _width2, _wrapScale2, true);
      polyline.setVisible(isVisible);
      renderObjects.push(polyline);
      floorObject.setVisible(isVisible);
    });
    naviCore.mapAPI._coreMap["enginApi"]["forceRedraw"]();

    return naviRoute;
  };

  let generateNaviData = function (naviRoute, minLenSegment, maxSegmentCount, routeState) {
    // return;
    naviRoute.naviCore.speakListener && naviRoute.naviCore.speakListener.stop();
    let _distance = Math.ceil(naviRoute.total_length);
    let time = navi_utils.MillisecondToDate(_distance * 0.83 * 1000, "nosec", thisObject.language);
    if (time == "2分钟") {
      time = "两分钟";
    }
    // get Next Icon
    let data = { title: "", address: "", angelText: "", distance: 0, currIcon: "", nextIcon: "", type: 0 },
      tempData = null;
    let stations = naviRoute.stations;
    for (let i = 1; i < stations.length - 1; i++) {
      let station = stations[i];
      let nextStation = stations[i + 1];
      if (
        nextStation.type === "2" ||
        nextStation.type === "3" ||
        station.type === "9" ||
        nextStation.type === "8" ||
        nextStation.type === "4" ||
        nextStation.type === "5"
      ) {
        station.nextIcon = nextStation.angelIcon;
      }
    }
    // 遍历 Stations 生成语音和文字
    let speakText = "";

    let segmentsData = [];
    let bdNaviConfig = naviRoute.naviCore.bdNaviConfig;
    let speakLevel = naviRoute.naviCore.speakLevel;
    let speakTest = naviRoute.naviCore.speakTest;
    let bdid = naviRoute.bdid;
    let minSpeakDistance = naviRoute.naviCore.minSpeakDistance;
    if (bdNaviConfig[bdid]) {
      let naviConfig = bdNaviConfig[bdid];
      naviConfig["speakLevel"] != undefined ? (speakLevel = naviConfig["speakLevel"]) : "";
      naviConfig["minLenSegment"] != undefined ? (minLenSegment = naviConfig["minLenSegment"]) : "";
      naviConfig["maxSegmentCount"] != undefined ? (maxSegmentCount = naviConfig["maxSegmentCount"]) : "";
      naviConfig["minSpeakDistance"] != undefined ? (minSpeakDistance = naviConfig["minSpeakDistance"]) : "";
    }
    switch (speakLevel) {
      case 1:
        geneCombineSpeakText(minLenSegment, maxSegmentCount, minSpeakDistance);
        break;
      case 2:
        if (naviRoute.naviCore.speakListener) {
          geneCombineStationText(minLenSegment, maxSegmentCount, minSpeakDistance);
        }
        break;
      default:
        if (naviRoute.naviCore.speakListener) {
          geneNormalSpeaks(minLenSegment, maxSegmentCount, minSpeakDistance);
        }
    }

    function geneCombineSpeakText(minLenSegment, maxSegmentCount, minSpeakDistance) {
      for (let i = 0, len = stations.length; i < len; i += 1) {
        let distance = 0;
        let station = stations[i];
        tempData = navi_utils.copyData(data);
        if (thisObject.language == "En") {
          speakText = geneNaviTextEn(naviRoute, station, tempData, minSpeakDistance);
        } else {
          speakText = geneNaviText(naviRoute, station, tempData, minSpeakDistance);
        }
        station.speakText = speakText;
        segmentsData.push(tempData);
        // if(i<2){
        //     continue;
        // }
        let distance = station.distance;
        if (naviRoute.naviCore.speakListener) {
          if (station.type == 0 || station.type == 1) {
            if (naviRoute.naviCore.getIsSimulate()) {
              naviRoute.naviCore.speakListener.speaking("none");
            } else {
              naviRoute.naviCore.speakListener.speaking(speakText);
            }
            continue;
          } else if (station.type == 8) {
            let endSpeakText = "";
            if (routeState == undefined || routeState === ROUTE_HAS_TAIL || routeState === ROUTE_HAS_HEAD_TAIL) {
              endSpeakText = naviRoute.naviCore.naviEndSpeakText;
            } else {
              endSpeakText = ""; //本段室内导航结束
            }
            let dis = Math.ceil(station.distance);
            // let speakText = "";
            let speakText = (window["langData"]["zhixing:speak:navi"] || "前方{{distance}}后到达{{targetName}}").replace(
              "{{targetName}}",
              naviRoute.targetName
            );

            if (dis > minSpeakDistance) {
              speakText = speakText.replace("{{distance}}", dis + (window["langData"]["meter:distance"] || "米"));
            } else {
              speakText = speakText.replace("{{distance}}", "");
            }
            naviRoute.naviCore.speakListener.speaking(speakText);
            naviRoute.naviCore.speakListener.speaking(endSpeakText);
            continue;
          } else if (station.type == 4) {
            naviRoute.naviCore.speakListener.speaking(speakText);
            continue;
          } else if (distance > minLenSegment) {
            naviRoute.naviCore.speakListener.speaking(speakText);
            continue;
          }
        }

        let curFirst = i;
        let j = i + 1,
          count = 0;

        while (count < maxSegmentCount && j < len - 1) {
          j = i + 1;
          let nextStation = stations[j];
          if (nextStation.type == 8 || nextStation.type == 5) {
            //|| station.type == 5  nextStation.type == 4 ||
            break;
          }
          let tempData2 = navi_utils.copyData(data);

          if (thisObject.language == "En") {
            let speakTextTmp = geneNaviTextEn(naviRoute, nextStation, tempData2, minSpeakDistance);
          } else {
            let speakTextTmp = geneNaviText(naviRoute, nextStation, tempData2, minSpeakDistance);
          }
          stations[i].speakText = speakTextTmp;
          let dis = Math.round(tempData2["distance"] || 0);
          distance += dis;
          count++;
          i++;
          if (count < maxSegmentCount && dis < minLenSegment) {
            segmentsData.push(tempData2);
            if (speakTextTmp && speakTextTmp != "none") {
              let concatText = "," + (window["langData"]["after"] || "然后");
              if (thisObject.language == "En") {
                concatText = " and ";
              }
              if (!speakText || speakText == "none") {
                speakText = (station["angelText"] || "") + concatText + speakTextTmp;
              } else {
                speakText += concatText + speakTextTmp;
              }
            }

            if (distance > minLenSegment * 1.2) {
              station.speakText = speakText;
              break;
            }
          } else {
            station.speakText = speakText;
            break;
          }
        }

        let num = count;
        num > 0 ? (station.speakText = speakText) : "";
        if (naviRoute.naviCore.speakListener) {
          naviRoute.naviCore.speakListener.speaking(speakText);
          while (num > 0) {
            naviRoute.naviCore.speakListener.speaking("none");
            num--;
          }
        }
      }
    }

    function geneCombineStationText(minLenSegment, maxSegmentCount, minSpeakDistance) {
      let _importPoints = cutUpstations(stations, naviRoute);
      let flag = false;
      for (let i = 0, j = 0, len = stations.length; i < len; i += 1) {
        speakText = "none";
        if (stations[i] == _importPoints[j] && j < _importPoints.length - 1) {
          if (true == flag) {
            naviRoute.naviCore.speakListener.speaking(speakText);
            stations[i].speakText = speakText;
            flag = false;
            j++;
            continue;
          }
          if (thisObject.language == "En") {
            speakText = geneLevel0NaviTextEn(naviRoute, _importPoints[j], _importPoints[j + 1], data);
          } else {
            speakText = geneLevel0NaviText(naviRoute, _importPoints[j], _importPoints[j + 1], data);
          }
          stations[i].speakText = speakText;
          naviRoute.naviCore.speakListener.speaking(speakText);
          if (stations[i].type == "4" && stations[i].segment.length == 0) {
            naviRoute.naviCore.speakListener.speaking("none");
          }
          j++;
          if (speakTest && "4" == _importPoints[j].type) {
            flag = true;
          }
        } else {
          speakText = "none";
          if (i == len - 1) {
            if (routeState == undefined || routeState === ROUTE_HAS_TAIL || routeState === ROUTE_HAS_HEAD_TAIL) {
              naviRoute.naviCore.speakListener.speaking(speakText);
              speakText = endText;
            }
          }
          if (stations[i].type == "3" && i < len - 1 && stations[i + 1].segment.length == 0) {
            continue;
          }
          stations[i].speakText = speakText;
          naviRoute.naviCore.speakListener.speaking(speakText);
        }
      }
    }

    function geneNormalSpeaks(minLenSegment, maxSegmentCount, minSpeakDistance) {
      for (let i = 0, len = stations.length; i < len; i += 1) {
        let distance = 0;
        let station = stations[i];
        tempData = navi_utils.copyData(data);
        tempData.type = station.type;

        if (thisObject.language == "En") {
          speakText = geneNaviTextEn(naviRoute, station, tempData, minSpeakDistance);
        } else {
          speakText = geneNaviText(naviRoute, station, tempData, minSpeakDistance);
        }
        station.speakText = speakText;
        segmentsData.push(tempData);
        if (station.type == 0 || station.type == 1) {
          if (naviRoute.naviCore.getIsSimulate()) {
            naviRoute.naviCore.speakListener.speaking("none");
            station.speakText = "";
          } else {
            naviRoute.naviCore.speakListener.speaking(speakText);
          }
          continue;
        }
        if (station.type == 5 && i < len - 1 && station.distance < naviRoute.naviCore.minLenSegment) {
          let nextStation = stations[i + 1];
          if (thisObject.language == "En") {
            let speakText2 = geneNaviTextEn(naviRoute, nextStation, tempData, minSpeakDistance);
          } else {
            let speakText2 = geneNaviText(naviRoute, nextStation, tempData, minSpeakDistance);
          }
          if (speakText2) {
            speakText = speakText.replace(".", "");
            let concatText = "," + (window["langData"]["after"] || "然后");
            speakText += concatText + speakText2;
            naviRoute.naviCore.speakListener.speaking(speakText);
            naviRoute.naviCore.speakListener.speaking("none");
            i++;
            continue;
          }
        }
        station.speakText = speakText;
        naviRoute.naviCore.speakListener.speaking(speakText);
        if (station.type == 8) {
          let endSpeakText = "";
          if (routeState == undefined || routeState === ROUTE_HAS_TAIL || routeState === ROUTE_HAS_HEAD_TAIL) {
            endSpeakText = naviRoute.naviCore.naviEndSpeakText;
          } else {
            endSpeakText = ""; //本段室内导航结束
          }
          naviRoute.naviCore.speakListener.speaking(endSpeakText);
        }
      }
    }

    naviRoute.naviCore.setSegments(segmentsData);
  };

  function cutUpstations(stations, naviRoute) {
    let importPoints = [],
      tempDis = 0,
      preConName,
      preGroupId;
    let floorObjects = naviRoute.floorObjects;

    for (let i = 0, len = stations.length; i < len; i++) {
      let currStation = stations[i];
      let currType = currStation.type;
      switch (currType) {
        case "2":
          if (i == 2) {
            importPoints.push(currStation);
          }
          break;

        // case "3":
        //     importPoints.push(currStation);
        //     break;
        case "4":
          importPoints.push(currStation);
          break;
        case "5":
          importPoints.push(currStation);
          tempDis = currStation.segment.segment_length;
          break;
        case "8":
          importPoints.push(currStation);
          break;
        case "2":
          tempDis += currStation.segment.segment_length;
      }
    }
    return importPoints;
  }

  /*generate single Navi data*/
  // let minSpeakDistance = 20;

  /** 语言配置对象 */
  let NAVI_TEXT_LANG_CONFIG = {
    zh: {
      please: "请",
      and: "和",
      goAhead: "",
      currentPos: () => window["langData"]["currentpos:starttip:navi"] || "我的位置",
      startOff: () => window["langData"]["startnavi:tip:navi"] || "开始出发",
      from: "从",
      meter: () => window["langData"]["meter:distance"] || "米",
      arrived: () => window["langData"]["arrived:tip:navi"] || "您已到达",
      reach: () => window["langData"]["navi:daoda"] || "到达",
      nextText: () => window["langData"]["next:navi:speak:text"] || "前方{{distance}}后{{action}}",
      concatText: () => window["langData"]["next:navi:speak:concatText"] || "后",
      langSuffix: "",
    },
    en: {
      please: "Please",
      and: " and ",
      goAhead: " go ahead ",
      currentPos: () => " current position ",
      startOff: () => " start off ",
      from: "从",
      meter: () => " meters",
      arrived: () => " You have reached ",
      reach: () => " to ",
      nextText: () => "{{action}} after {{distance}}",
      concatText: () => "",
      langSuffix: "En",
    },
  };

  /**
   * 获取楼层名称
   * @param {Object} floorInfo - 楼层信息对象
   * @returns {string}
   */
  let getFloorName = (floorInfo) => floorInfo["floorCnName"] || floorInfo["flcnname"] || floorInfo["flname"] || floorInfo["floorName"];

  /**
   * 生成导航文本（统一入口）
   * @param {Object} naviRoute - 导航路线对象
   * @param {Object} station - 站点信息
   * @param {Object} tempData - 临时数据对象
   * @param {number} minSpeakDistance - 最小播报距离
   * @param {string} lang - 语言类型 "zh" | "en"
   * @returns {string} 播报文本
   */
  let geneNaviTextByLang = (naviRoute, station, tempData, minSpeakDistance, lang) => {
    let config = NAVI_TEXT_LANG_CONFIG[lang] || NAVI_TEXT_LANG_CONFIG.zh;
    let angelText = "";
    let speakText = "";
    let dis;
    let floorInfo = naviRoute.naviCore.mapAPI._getFloorInfo(naviRoute.bdid, station.floor);

    switch (station.type) {
      case "0": // 头部站点
        let index = 0;
        angelText = config.please;
        speakText = lang === "zh" ? naviRoute.naviCore.startNaviText : config.please;
        for (let method in naviRoute.arriveMethods) {
          let iconClass = method;
          let methodText = naviRoute.arriveMethods[method];
          if (lang === "zh") {
            if (index > 0 && speakText.indexOf(methodText) == -1) {
              angelText += config.and;
            }
            if (speakText.indexOf(methodText) == -1) {
              angelText += `${methodText}<span class="${iconClass}"></span>`;
            }
          } else {
            if (index > 0) {
              angelText += config.and;
              speakText += config.and;
            }
            speakText += methodText;
            angelText += `${methodText}<span class="${iconClass}"></span>`;
          }
          index++;
        }
        if (lang === "en") {
          angelText += config.goAhead;
          speakText += config.goAhead;
        }
        tempData["title"] = naviRoute.targetName;
        tempData["address"] = naviRoute.targetLocal;
        tempData["angelText"] = angelText;
        break;

      case "1": // 起点站点
        tempData["currIcon"] = "icon-uniE65F";
        tempData["distance"] = config.currentPos();
        tempData["angelText"] = config.startOff();
        tempData["nextIcon"] = station.nextIcon;
        speakText = `${config.from}${tempData["distance"]}${tempData["angelText"]}`;
        break;

      case "2": // 路段中间站点
        tempData["currIcon"] = station.angelIcon;
        tempData["distance"] = Math.ceil(station.distance);
        tempData["angelText"] = station.angelText;
        tempData["nextIcon"] = station.nextIcon;
        dis = tempData["distance"];

        if (lang === "zh") {
          let nextText = config.nextText();
          if (dis < 5) {
            speakText = "none";
          } else if (dis < minSpeakDistance) {
            speakText = nextText.replace("{{distance}}", "").replace(config.concatText(), "").replace("{{action}}", tempData["angelText"]);
          } else {
            speakText = nextText.replace("{{distance}}", `${dis}${config.meter()}`).replace("{{action}}", tempData["angelText"]);
          }
        } else {
          if (tempData["angelText"] == "go straight") {
            speakText = `${tempData["angelText"]} ahead for ${dis}${config.meter()}`;
          } else if (tempData["angelText"] == "straight ahead on the left" || tempData["angelText"] == "straight ahead on the right") {
            speakText = tempData["angelText"];
          } else {
            speakText = `${tempData["angelText"]} after ${dis}${config.meter()}`;
          }
          if (dis < 5) {
            speakText = "none";
          } else if (dis < minSpeakDistance) {
            speakText = `${tempData["angelText"]} ahead `;
          }
        }
        break;

      case "3": // 路段结束站点
        tempData["currIcon"] = station.angelIcon;
        tempData["distance"] = Math.ceil(station.distance);
        tempData["angelText"] = station.targetName || "";
        tempData["nextIcon"] = station.nextIcon;
        tempData["floor"] = station.floor;
        dis = tempData["distance"];

        if (lang === "zh") {
          let nextText = config.nextText();
          if (dis < minSpeakDistance) {
            speakText += nextText.replace("{{distance}}", config.reach()).replace(config.concatText(), "").replace("{{action}}", tempData["angelText"]);
          } else {
            speakText += nextText.replace("{{distance}}", `${dis}${config.meter()}`).replace("{{action}}", tempData["angelText"]);
          }
        } else {
          if (dis < minSpeakDistance) {
            speakText += `ahead to the${tempData["angelText"]}`;
          } else {
            speakText += ` ${dis} meters ahead to the ${tempData["angelText"]}`;
          }
        }
        break;

      case "4": // 楼层切换起始站点
        let nextFloor = naviRoute.naviCore.mapAPI._getFloorInfo(naviRoute.bdid, station.nextFloor);
        tempData["currIcon"] = station.angelIcon;
        tempData["angelText"] = station.targetName || "";
        tempData["endType"] = RouteParseHelper.directionUpOrDown(station.angelIcon, config.langSuffix || undefined);
        tempData["nextIcon"] = station.nextIcon;
        tempData["floorName"] = getFloorName(floorInfo);
        tempData["nextFloorName"] = getFloorName(nextFloor);
        tempData["byWay"] = RouteParseHelper.getTargetbyWay(station.angelIcon, config.langSuffix || undefined);

        if (lang === "zh") {
          speakText = `${tempData["byWay"]}${tempData["angelText"]}${tempData["endType"]}${config.reach()}${tempData["nextFloorName"]}`;
        } else {
          speakText = `${tempData["byWay"]}the${tempData["angelText"]}${tempData["endType"]}the ${tempData["nextFloorName"]}`;
        }
        break;

      case "5": // 楼层切换结束站点
        tempData["currIcon"] = station.angelIcon;
        tempData["distance"] = Math.ceil(station.distance);
        tempData["angelText"] = station.angelText;
        tempData["nextIcon"] = station.nextIcon;
        tempData["floorName"] = getFloorName(floorInfo);
        dis = tempData["distance"];

        speakText = `${config.arrived()}${tempData["floorName"]}`;

        if (lang === "zh") {
          let nextText = config.nextText();
          if (dis < minSpeakDistance) {
            speakText += ` ${nextText.replace("{{distance}}", "").replace(config.concatText(), "").replace("{{action}}", tempData["angelText"])}`;
          } else {
            speakText += ` ${nextText.replace("{{distance}}", `${dis}${config.meter()}`).replace("{{action}}", tempData["angelText"])}`;
          }
        } else {
          if (dis < minSpeakDistance) {
            speakText += ` ${tempData["angelText"]} ahead`;
          } else {
            if (tempData["angelText"] == "go straight") {
              speakText += ` ${tempData["angelText"]} ahead for ${dis}${config.meter()}`;
            } else if (tempData["angelText"] == "straight ahead on the left" || tempData["angelText"] == "straight ahead on the right") {
              speakText += ` ${tempData["angelText"]}`;
            } else {
              speakText += ` ${tempData["angelText"]} after ${dis}${config.meter()}`;
            }
          }
        }
        break;

      case "8": // 终点站点
        tempData["currIcon"] = station.angelIcon;
        tempData["distance"] = Math.ceil(station.distance);
        tempData["angelText"] = station.targetName || "";
        break;
    }

    return speakText;
  };

  /** 生成中文导航文本 */
  let geneNaviText = (naviRoute, station, tempData, minSpeakDistance) => geneNaviTextByLang(naviRoute, station, tempData, minSpeakDistance, "zh");

  /** 生成英文导航文本 */
  let geneNaviTextEn = (naviRoute, station, tempData, minSpeakDistance) => geneNaviTextByLang(naviRoute, station, tempData, minSpeakDistance, "en");

  /** Level0 导航文本语言配置 */
  let LEVEL0_NAVI_TEXT_CONFIG = {
    zh: {
      startTip: () => window["langData"]["currentpos:starttip2:navi"] || "请您从现在位置前往",
      startTip2: () => window["langData"]["currentpos:starttip2:navi"] || "请您从当前位置前往",
      endTip: () => window["langData"]["end:tip2:navi"] || "您已到达目的地附近本次导航结束",
      destination: () => window["langData"]["destnation"] || "目的地",
      reach: () => window["langData"]["navi:daoda"] || "到达",
      meter: () => window["langData"]["meter:distance"] || "米",
      nextText: () => window["langData"]["next:navi:speak:text"] || "前方{{distance}}后{{action}}",
      concatText: () => window["langData"]["next:navi:speak:concatText"] || "后",
      langSuffix: "",
    },
    en: {
      startTip: () => "Please start off from current position ",
      startTip2: () => "Please start off from current position ",
      endTip: () => endText,
      destination: () => "destination",
      reach: () => " to ",
      meter: () => " meters",
      nextText: () => "{{action}} after {{distance}}",
      concatText: () => "",
      langSuffix: "En",
    },
  };

  /**
   * 生成 Level0 导航文本（统一入口）
   * @param {Object} naviRoute - 导航路线对象
   * @param {Object} station1 - 站点1信息
   * @param {Object} station2 - 站点2信息
   * @param {Object} defaultData - 默认数据
   * @param {string} lang - 语言类型 "zh" | "en"
   * @returns {string} 播报文本
   */
  let geneLevel0NaviTextByLang = (naviRoute, station1, station2, defaultData, lang) => {
    let config = LEVEL0_NAVI_TEXT_CONFIG[lang] || LEVEL0_NAVI_TEXT_CONFIG.zh;
    let tempData1 = navi_utils.copyData(defaultData);
    let tempData2 = navi_utils.copyData(defaultData);
    let speakText = "";
    let machineHeading = naviRoute.naviCore.machineHeading;
    let position1 = station1.position;
    let position2 = station2.position;
    let angel = RouteParseHelper.getAngel(machineHeading, position1[0], position1[1], position2[0], position2[1]);
    let angelText = RouteParseHelper.getAngelText2(angel, config.langSuffix || undefined);
    let currentFloorInfo = naviRoute.naviCore.mapAPI._getFloorInfo(naviRoute.bdid, station1.floor);
    let nextFloorInfo = naviRoute.naviCore.mapAPI._getFloorInfo(naviRoute.bdid, station2.floor);
    let dis;

    switch (station1.type) {
      case "2":
        speakText = config.startTip();
        if (station2.type == 4) {
          speakText += lang === "en" ? `${angelText} ${station2.targetName}` : `${angelText}${station2.targetName}`;
        } else if (station2.type == 8) {
          speakText += `${currentFloorInfo["floorCnName"] || currentFloorInfo["floorName"]}${naviRoute.targetName || station2.targetName}`;
        }
        break;

      case "3":
        tempData1["currIcon"] = station1.angelIcon;
        tempData1["distance"] = Math.ceil(station1.distance);
        tempData1["angelText"] = station1.targetName;
        tempData1["nextIcon"] = station1.nextIcon;
        tempData1["floor"] = station1.floor;
        dis = tempData1["distance"];

        if (lang === "zh") {
          let nextText = config.nextText();
          if (dis < minSpeakDistance) {
            speakText += nextText.replace("{{distance}}", config.reach()).replace(config.concatText(), "").replace("{{action}}", tempData1["angelText"]);
          } else {
            speakText += nextText.replace("{{distance}}", `${dis}${config.meter()}`).replace("{{action}}", tempData1["angelText"]);
          }
        } else {
          if (dis < minSpeakDistance) {
            speakText += ` ahead to the ${tempData1["angelText"]}`;
          } else {
            speakText += ` ${dis}meters ahead to the ${tempData1["angelText"]}`;
          }
        }

        let station2FloorInfo = naviRoute.naviCore.mapAPI._getFloorInfo(naviRoute.bdid, station2.nextFloor);
        tempData2["currIcon"] = station2.angelIcon;
        tempData2["angelText"] = station2.targetName;
        tempData2["endType"] = RouteParseHelper.directionUpOrDown(station2.angelIcon, config.langSuffix || undefined);
        tempData2["nextIcon"] = station2.nextIcon;
        tempData2["floorName"] = getFloorName(station2FloorInfo);
        tempData2["byWay"] = RouteParseHelper.getTargetbyWay(station2.angelIcon, config.langSuffix || undefined);

        if (lang === "zh") {
          speakText += `${tempData2["byWay"]}${tempData2["angelText"]}${tempData2["endType"]}${config.reach()}${tempData2["floorName"]}`;
        } else {
          speakText += `${tempData2["byWay"]}the${tempData2["angelText"]}${tempData2["endType"]}the ${
            station2FloorInfo["floorCnName"] || station2FloorInfo["floorName"]
          }`;
        }
        break;

      case "4":
        tempData1["currIcon"] = station1.angelIcon;
        tempData1["angelText"] = station1.targetName;
        tempData1["endType"] = RouteParseHelper.directionUpOrDown(station1.angelIcon, config.langSuffix || undefined);
        tempData1["nextIcon"] = station1.nextIcon;
        tempData1["floorName"] = getFloorName(nextFloorInfo);
        tempData1["byWay"] = RouteParseHelper.getTargetbyWay(station1.angelIcon, config.langSuffix || undefined);

        if (lang === "zh") {
          speakText = `${tempData1["byWay"]}${tempData1["angelText"]}${tempData1["endType"]}${config.reach()}${tempData1["floorName"]}`;
        } else {
          speakText = `${tempData1["byWay"]}the${tempData1["angelText"]}${tempData1["endType"]}the ${
            nextFloorInfo["floorCnName"] || nextFloorInfo["floorName"]
          }`;
        }
        break;

      case "5":
        speakText = config.startTip2();
        if (station2.type == 4) {
          speakText += lang === "en" ? `${angelText} ${station2.targetName}` : `${angelText}${station2.targetName}`;
        } else if (station2.type == 8) {
          let floorName = getFloorName(nextFloorInfo);
          if (lang === "zh") {
            speakText += `${floorName}${naviRoute.targetName || station2.targetName || config.destination()}`;
          } else {
            speakText += ` ${nextFloorInfo["floorCnName"]} ${naviRoute.targetName || station2.targetName || config.destination()}`;
          }
        }
        break;

      case "8":
        if (naviRoute.naviCore.routeState == ROUTE_HAS_HEAD_TAIL || naviRoute.naviCore.routeState == ROUTE_HAS_TAIL) {
          speakText = config.endTip();
        }
        break;

      default:
        break;
    }

    return speakText;
  };

  /** 生成 Level0 中文导航文本 */
  let geneLevel0NaviText = (naviRoute, station1, station2, defaultData) => geneLevel0NaviTextByLang(naviRoute, station1, station2, defaultData, "zh");

  /** 生成 Level0 英文导航文本 */
  let geneLevel0NaviTextEn = (naviRoute, station1, station2, defaultData) => geneLevel0NaviTextByLang(naviRoute, station1, station2, defaultData, "en");

  /** 路线分段角度阈值常量 */
  let SEGMENT_SPLIT_ANGLE = 32; // 主分段角度阈值（度）
  let SEGMENT_SPLIT_ANGLE_MIN = 15; // 累计角度时的最小分段角度（度）
  let MIN_SEGMENT_LENGTH = 1.0; // 最小路段长度（米），小于此值不分段

  /**
   * 解析路线几何数据，生成导航站点
   * @param {Object} naviRoute - 导航路线对象
   * @param {Object} info - 楼层路线信息
   * @param {number} index - 当前楼层索引
   * @param {number} floorCount - 总楼层数
   * @param {string} language - 语言类型
   */
  let parseGeometry = function (naviRoute, info, index, floorCount, language) {
    let curfloor = info["floor"];
    let geometry = info["geometry"];
    let floorObject = naviRoute.createFloorObject(curfloor, index);

    floorObject.setGeometry(geometry);
    floorObject.setVisible(false);
    naviRoute.floorObjects.push(floorObject);

    info.stationArray = [];
    if (geometry.length < 1) {
      return;
    }
    if (geometry.length == 1) {
      geometry.push(geometry[0]);
    }

    // 计算起点站点的朝向
    if (index === 0) {
      let Ax = navi_utils.getVector(geometry, 0);
      DXMapUtils.extendObj(Ax, geometry);
      let Bx = navi_utils.getVector(geometry, 1);
      DXMapUtils.extendObj(Bx, geometry);
      naviRoute.stations[1].heading = navi_utils.calcHeading(Ax, Bx);
    }

    geometry[0].segment_length = 0;
    geometry.total_length = 0;

    // 处理只有两个点的简单路线
    if (geometry.length === 2) {
      let station = {};
      let A = navi_utils.getVector(geometry, 0);
      let B = navi_utils.getVector(geometry, 1);
      let B_src = geometry[1];
      let segment = [];

      station.type = "3";
      station.action = station_start_func;
      station.angelIcon = "icon-uniE660";
      station.position = [A.x, A.y];
      station.autoPass = false;
      station.segment = segment = [A, B];
      station.targetName = RouteParseHelper.getTargetName(info, language, naviRoute);
      station.floorObjectIndex = index;
      station.floor = curfloor;

      if (index == floorCount - 1) {
        station.type = "8";
      } else {
        if (geometry[1]["extendType"]) {
          station.extendType = geometry[1]["extendType"];
          station.useTime = geometry[1]["useTime"];
        }
      }

      B_src.segment_length = B.segment_length = navi_utils.getGeodeticCircleDistance(A, B);

      let C = { x: (A.x + B.x) * 0.5, y: (A.y + B.y) * 0.5 };
      station.arrowSegment = [C, B];
      geometry.total_length = B.segment_length;
      station.distance = geometry.total_length;
      naviRoute.stations.push(station);
      info.stationArray.push(station);
      floorObject.stations.push(station);
    } else {
      // 处理多点路线（3个及以上）
      let geometry_new = [];
      for (let kk = 0; kk < geometry.length; kk++) {
        let tempPt = navi_utils.getVector(geometry, kk);
        DXMapUtils.extendObj(tempPt, geometry[kk]);
        geometry_new.push(tempPt);
      }

      let segmentArray = [];
      let segment = [];
      segment.angel = 0;
      segment.segment_length = 0;
      segment.push(navi_utils.getVector(geometry_new, 0));
      segmentArray.push(segment);
      let sumDir = 0;

      // 遍历路径点，根据角度变化分割路段
      for (let i = 1; i < geometry_new.length - 1; i++) {
        let A = geometry_new[i - 1];
        DXMapUtils.extendObj(A, geometry_new[i - 1]);
        let B = geometry_new[i];
        DXMapUtils.extendObj(B, geometry_new[i]);
        let C = geometry_new[i + 1];
        DXMapUtils.extendObj(C, geometry_new[i + 1]);
        let B_src = geometry[i];
        let angel = navi_utils.calcAngel(A, B, C);
        B_src.segment_length = B.segment_length = navi_utils.getGeodeticCircleDistance(A, B);

        let isSplitSegment = true;

        // 起点附近短路段不分割
        if (i === 1 && B.segment_length < MIN_SEGMENT_LENGTH) {
          isSplitSegment = false;
        }
        // 终点附近短路段不分割
        if (i === geometry_new.length - 2) {
          C.segment_length = navi_utils.getGeodeticCircleDistance(B, C);
          if (C.segment_length < MIN_SEGMENT_LENGTH) {
            isSplitSegment = false;
          }
        }

        let diffAngle = Math.abs(angel);
        let shouldSplit = diffAngle > SEGMENT_SPLIT_ANGLE || (Math.abs(sumDir + angel) >= SEGMENT_SPLIT_ANGLE && diffAngle >= SEGMENT_SPLIT_ANGLE_MIN);

        if (shouldSplit && isSplitSegment) {
          segment.push(B);
          segment.angel = diffAngle > SEGMENT_SPLIT_ANGLE ? angel : sumDir + angel;
          segment.segment_length += B.segment_length;
          segment.next_pt = C;
          segment = [];
          segment.angel = 0;
          segment.segment_length = 0;
          segment.push({ x: B.x, y: B.y, segment_length: 0 });
          segmentArray.push(segment);
          sumDir = 0;
        } else {
          sumDir += angel;
          segment.push(B);
          segment.segment_length += B.segment_length;
        }
        geometry.total_length += B.segment_length;
      }

      // 处理最后一个点
      let A = geometry_new[geometry_new.length - 2];
      DXMapUtils.extendObj(A, geometry_new[geometry_new.length - 2]);
      let B = geometry_new[geometry_new.length - 1];
      DXMapUtils.extendObj(B, geometry_new[geometry_new.length - 1]);
      let B_src = geometry[geometry.length - 1];
      B_src.segment_length = B.segment_length = navi_utils.getGeodeticCircleDistance(A, B);
      segment.push(B);
      segment.next_pt = B;
      segment.segment_length += B.segment_length;
      geometry.total_length += B.segment_length;

      // 根据分段数量创建站点
      if (segmentArray.length === 1) {
        // 单段路线：直接创建终点站点
        let segment = segmentArray[0];
        let angelDisp = RouteParseHelper.getAngelText(segment.angel, language);
        let newStation = {
          type: "8",
          floorObjectIndex: index,
          floor: curfloor,
          angelIcon: "icon-uniE660",
          angel: 0,
          autoPass: false,
          action: station_start_func,
          position: [segment[0].x, segment[0].y],
          segment: segment,
          endIconType: info.endIconType,
          angelText: "",
        };

        if (index !== floorCount - 1) {
          newStation.type = "3";
          newStation.angel = segment.angel;
          newStation.angelIcon = angelDisp.angelIcon;
          newStation.angelText = angelDisp.angelText;
          let _data = segment[segment.length - 1];
          if (_data["extendType"]) {
            newStation.extendType = _data["extendType"];
            newStation.useTime = _data["useTime"];
          }
        }

        newStation.targetName = RouteParseHelper.getTargetName(info, language, naviRoute);
        newStation.distance = segment.segment_length;

        let tempA = segment[segment.length - 2];
        let curB = segment[segment.length - 1];
        let tempC = segment.next_pt;
        newStation.arrowSegment = [tempA, curB, tempC];

        naviRoute.stations.push(newStation);
        info.stationArray.push(newStation);
        floorObject.stations.push(newStation);
      } else {
        // 多段路线：依次创建中间站点和终点站点
        for (let i = 0; i < segmentArray.length - 1; i++) {
          let segment = segmentArray[i];
          if (!segment.segment_length) {
            segment.segment_length = 0;
            segment.forEach((item) => {
              segment.segment_length += item.segment_length;
            });
          }
          if (segment.segment_length === 0) {
            continue;
          }

          let newStation = {
            type: "2",
            floorObjectIndex: index,
            floor: curfloor,
            angel: 0,
            autoPass: false,
            action: station_start_func,
            position: [segment[0].x, segment[0].y],
            segment: segment,
          };
          newStation.arrowSegment = [];

          // 非首层的第一个站点标记为到达楼层
          if (index !== 0 && i === 0) {
            newStation.type = "5";
          }
          calcArrowSegment(newStation, newStation.segment);

          let angelDisp = RouteParseHelper.getAngelText(segment.angel, language);
          newStation.angel = segment.angel;
          newStation.angelIcon = angelDisp.angelIcon;
          newStation.angelText = angelDisp.angelText;
          newStation.distance = segment.segment_length;

          naviRoute.stations.push(newStation);
          info.stationArray.push(newStation);
          floorObject.stations.push(newStation);
        }

        // 创建最后一个站点（终点或路段结束）
        let segment = segmentArray[segmentArray.length - 1];
        let angelDisp = RouteParseHelper.getAngelText(segment.angel, language);
        let newStation = {
          type: "8",
          floorObjectIndex: index,
          floor: curfloor,
          angelIcon: "icon-uniE660",
          angel: 0,
          autoPass: false,
          action: station_start_func,
          position: [segment[0].x, segment[0].y],
          segment: segment,
          endIconType: info.endIconType,
          angelText: "",
        };
        newStation.targetName = RouteParseHelper.getTargetName(info, language, naviRoute);

        if (index !== floorCount - 1) {
          newStation.type = "3";
          newStation.angelIcon = `icon-${info.endIconType}`;
          newStation.angel = 0;
          newStation.angelText = `${window["langData"]["navi:daoda"] || "到达"}${newStation.targetName}`;
          let _data = segment[segment.length - 1];
          if (_data["extendType"]) {
            newStation.extendType = _data["extendType"];
            newStation.useTime = _data["useTime"];
          }
        }

        newStation.distance = segment.segment_length;
        newStation.arrowSegment = [];
        calcArrowTail(newStation, newStation.segment);
        naviRoute.stations.push(newStation);
        info.stationArray.push(newStation);
        floorObject.stations.push(newStation);
      }
    }

    // 非最后一层时添加楼层切换站点
    if (index !== floorCount - 1) {
      let newStation = {
        type: "4",
        floorObjectIndex: index,
        floor: curfloor,
        nextFloor: info.nextFloor,
        angel: 0,
        angelIcon: `icon-${info.endIconType}`,
        autoPass: false,
        action: station_start_func,
        position: [segment[segment.length - 1].x, segment[segment.length - 1].y],
        segment: [],
      };
      newStation.targetName = RouteParseHelper.getTargetNameByIconName(info.endIconType, language);
      naviRoute.stations.push(newStation);
      floorObject.stations.push(newStation);
    }

    naviRoute.total_length += floorObject.geometry.total_length;
  };

  /**
   * calc Arrow Tail
   * @param newStation
   * @param segment
   */
  let calcArrowTail = function (newStation, segment) {
    let maxTailLength = 10;
    if (segment.segment_length < maxTailLength) {
      //newStation.arrowSegment = segment;
      for (let i = 0; i < segment.length; i++) {
        newStation.arrowSegment.push(segment[i]);
      }
    } else {
      let curPointArray = [];
      let curLength = 0;
      curPointArray.push(segment[segment.length - 1]);
      for (let i = segment.length - 1; i > 0; i--) {
        let curB = segment[i];
        if (curB.segment_length + curLength >= maxTailLength) {
          let tempA = segment[i - 1];
          let tempA_v = [tempA.x, tempA.y, 0];
          let curB_v = [curB.x, curB.y, 0];
          let tempResult = [0, 0, 0];
          navi_utils.slerp(tempResult, curB_v, tempA_v, (maxTailLength - curLength) / curB.segment_length);
          let tempAA = { x: tempResult[0], y: tempResult[1] };
          curPointArray.push(tempAA);
          break;
        } else {
          let tempA = segment[i - 1];
          curPointArray.push(tempA);
        }
        curLength += curB.segment_length;
      }
      for (let i = curPointArray.length - 1; i >= 0; i--) {
        newStation.arrowSegment.push(curPointArray[i]);
      }
    }
  };

  /**
   * Calc Arrow Head
   * @param newStation
   * @param segment
   */
  let calcArrowHead = function (newStation, segment) {
    let minHeaderLength = 1;
    let maxHeaderLength = 10;
    let next_pt = segment.next_pt;
    let headerLength = next_pt.segment_length;
    if (next_pt.segment_length <= minHeaderLength) {
      headerLength = minHeaderLength;
    } else if (next_pt.segment_length <= maxHeaderLength && next_pt.segment_length > minHeaderLength) {
      headerLength = next_pt.segment_length;
    } else {
      headerLength = maxHeaderLength;
    }
    let curB = segment[segment.length - 1];
    let tempA_v = [next_pt.x, next_pt.y, 0];
    let curB_v = [curB.x, curB.y, 0];
    let tempResult = [0, 0, 0];
    if (next_pt.segment_length === 0) {
      navi_utils.slerp(tempResult, curB_v, tempA_v, headerLength);
    } else {
      navi_utils.slerp(tempResult, curB_v, tempA_v, headerLength / next_pt.segment_length);
    }

    let tempAA = { x: tempResult[0], y: tempResult[1] };
    newStation.arrowSegment.push(tempAA);
  };

  /**
   * Calculate Arrow Segment
   * @param newStation
   * @param segment
   */
  let calcArrowSegment = function (newStation, segment) {
    calcArrowTail(newStation, segment);
    calcArrowHead(newStation, segment);
  };

  /**
   * Get Icon Link
   * @param iconType
   * @returns {string}
   */
  let getIconLink = function (iconType) {
    return "images/" + iconType + ".png";
  };
  let joinPath = function (path1, path2) {
    let args = arguments;
    let url = "";
    args.length > 0 ? (url = args[0] || "") : "";
    for (let i = 1; i < args.length; i++) {
      let _path = args[i];
      if (url.slice(-1) != "/") {
        url += "/";
      }
      _path = _path.replace("./", "");
      if (_path[0] == "/") {
        _path = _path.slice(1);
      }
      url += _path;
    }
    return url;
  };

  let createArrow = function (naviRoute, info, routeIndex) {
    let floorId = info["floor"];
    let floorObjects = naviRoute.getFloorObject(floorId);
    let floorObject = null;
    floorObjects.forEach(function (item) {
      if (routeIndex == item.routeIndex) {
        floorObject = item;
      }
    });
    if (!floorObject) {
      return;
    }
    let factory = naviRoute.naviCore.mapAPI._coreMap.factory;
    let mapSDK = naviRoute.naviCore.mapAPI._coreMap._mapSDK;
    let routeResampler = naviRoute.naviCore.routeResampler;
    for (let ii = 0; ii < info.stationArray.length; ii++) {
      let station = info.stationArray[ii];
      let geometry = station.segment;
      geometry = station.arrowSegment;
      let arrowLines = [];
      for (let i = 0; i < geometry.length; i++) {
        arrowLines.push([geometry[i].x, geometry[i].y]);
      }
      let arrow_geometry2 = routeResampler.resampler(arrowLines);
      if (arrow_geometry2.length > 0) {
        arrow_geometry2 = arrow_geometry2[0];
      } else {
        return;
      }

      let guid = factory.createUUID();
      let assetsPath = naviRoute.naviCore.mapAPI.config.assetsPath;
      let arrow = factory.createArrow(
        guid,
        guid,
        mapSDK,
        arrow_geometry2,
        naviRoute.bdid,
        floorId,
        joinPath(assetsPath, "images/arrow_lower.png"),
        14,
        8,
        true
      );
      arrow.visible = false;
      station.arrowObject = arrow;
      floorObject.arrowRenderObjects.push(arrow);
    }
  };
  let createIconMarker = function (mapAPI, renderObjects, floorId, iconType, position) {
    let assetsPath = mapAPI.config.assetsPath;
    let imageUrl = joinPath(assetsPath, mapPoiStyle.image);
    let factory = mapAPI.scene.factory;
    let guid = factory.createUUID();
    let range = mapPoiStyle.poiRangeList[iconType];
    let marker = factory.createRouteMarker(guid, guid, position.x, position.y, 1, floorId, imageUrl, imageUrl, range, range);
    let isVisible = mapAPI.cameraCtrl.getCurrentFloorId() == floorId;
    marker.setVisible(isVisible);
    renderObjects.push(marker);
    return marker;
  };
  /**
   * Parse Stations
   * @param naviRoute
   * @param path
   * @param roadCorssData
   */
  let parseStations = function (naviRoute, path, roadCorssData, language) {
    if (path["naviInfoList"].length == 0) return;
    let curFloor = path["naviInfoList"][0]["floor"];

    // xxxx在四楼北侧，请步行和乘坐电梯前往
    {
      let station = {};
      station.type = "0";
      station.action = station_start_func;
      station.position = [path["start"]["x"], path["start"]["y"]];
      station.autoPass = true;
      station.floorObjectIndex = 0;
      station.floor = curFloor;
      station.distance = 0;
      naviRoute.stations.push(station);
    }
    {
      let station = {};
      station.type = "1";
      station.action = station_start_func;
      station.position = [path["start"]["x"], path["start"]["y"]];
      station.autoPass = true;
      station.floorObjectIndex = 0;
      station.floor = curFloor;
      naviRoute.stations.push(station);
    }
    //////////////////////////////////////////////
    // Path数据
    let naviInfoList = path["naviInfoList"].slice();
    if (naviInfoList.length === 0) return;
    naviRoute.total_length = 0;

    let length = naviInfoList.length;
    // 为友谊医院做楼梯或扶梯中间路线忽略
    let _startFloor = naviInfoList[0]["floor"];
    let _endFloor = naviInfoList[length - 1]["floor"];
    for (let i = 0; i < naviInfoList.length; i++) {
      let info = naviInfoList[i];
      if (i + 1 < length) {
        info.nextFloor = naviInfoList[i + 1]["floor"];
      }
      parseGeometry(naviRoute, info, i, length, language);
      attachRoadCrossStations(naviRoute, roadCorssData);
    }
    naviRoute.targetFloorCnName = "" + info.floor || "";
    naviRoute.naviInfoList = naviInfoList;
    for (let i = 0; i < naviInfoList.length; i++) {
      let info = naviInfoList[i];
      createArrow(naviRoute, info, i);
    }
  };

  /**
   * Merge Route
   * @param mergeRouteList
   * @returns {*}
   */
  let mergeRoute = function (mergeRouteList) {
    let length = mergeRouteList.length;
    if (length < 3) return length;
    let type = mergeRouteList[0]["action"];
    for (let i = 1; i < mergeRouteList.length - 1; i++) {
      if (mergeRouteList[i]["action"] === type) {
        mergeRouteList.splice(i, 1);
        i--;
      }
    }
    return mergeRouteList.length;
  };

  /**
   * Merge Station
   * @param naviRoute
   * @param _startFloor
   * @param _endFloor
   */
  let mergeStation = function (naviRoute, _startFloor, _endFloor) {
    _startFloor = parseInt(_startFloor);
    _endFloor = parseInt(_endFloor);
    for (let i = 0; i < naviRoute.stations.length; i++) {
      let station = naviRoute.stations[i];
      let _num = station.floor + 1;
      if (_num !== _startFloor && _num !== _endFloor) {
        if (station.type !== "4" && station.type !== "5") {
          naviRoute.stations.splice(i, 1);
          i--;
        }
      }
    }
  };

  /**
   * 路口放大图的点是在路线左右各扩展1.5米的区域内
   * @param naviRoute
   * @param roadResult
   */
  let attachRoadCrossStations = function (naviRoute, roadResult) {
    if (!roadResult) return;
    let result = roadResult["CrossImageResult"];
    if (!result) return;
    let roadCrossArray = [];

    let returnValue = null;
    let length = result.length;
    for (let i = 0; i < length; i++) {
      let fl = result[i];
      if (fl === null) continue;
      let len = fl["Result"].length;
      for (let j = 0; j < len; j++) {
        floorObj = {};
        floorObj.Result = null;
        floorObj.floor = fl["floor"];
        floorObj.floorNum = navi_utils.getRealFloorNumbyFloorId(floorObj.floor);

        fl["Result"][j]["floorName"] = floorObj.floor;
        floorObj.Result = fl["Result"][j];
        floorObj.Result.url = roadResult["baseUrl"] + floorObj.floor + "/" + floorObj.Result["imagePath"];
        floorObj.position = [fl["Result"][j]["Lon"], fl["Result"][j]["Lat"]];
        roadCrossArray.push(floorObj);
      }
    }

    function pointToSegment(point, segment, intersectResult) {
      let pos_ecef = [0, 0, 0];
      let pos_sphr = [point.x * DEGREE_TO_RADIAN, point.y * DEGREE_TO_RADIAN, earthRadius];
      navi_utils.transformGeographicToECEF(pos_ecef, pos_sphr);
      let tempResult = { minDistance: Infinity, nearestPt: undefined };
      let retVal = false;
      for (let j = 0; j < segment.length - 1; j++) {
        let a_sphr = [segment[j].x * DEGREE_TO_RADIAN, segment[j].y * DEGREE_TO_RADIAN, earthRadius];
        let b_sphr = [segment[j + 1].x * DEGREE_TO_RADIAN, segment[j + 1].y * DEGREE_TO_RADIAN, earthRadius];
        let a_ecef = [0, 0, 0];
        let b_ecef = [0, 0, 0];
        let root_ecef = [0, 0, 0];
        navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
        navi_utils.transformGeographicToECEF(b_ecef, b_sphr);
        let tempDistance = navi_utils.pointToLine(pos_ecef, a_ecef, b_ecef, root_ecef);
        if (tempDistance < tempResult.minDistance) {
          navi_utils.transformECEFToGeographic(root_ecef, root_ecef);
          root_ecef[0] *= RADIAN_TO_DEGREE;
          root_ecef[1] *= RADIAN_TO_DEGREE;
          tempResult.nearestPt = { x: root_ecef[0], y: root_ecef[1] };
          tempResult.minDistance = tempDistance;
          retVal = true;
        }
      }

      if (retVal && tempResult.minDistance <= 1.5) {
        intersectResult.minDistance = tempResult.minDistance;
        intersectResult.nearestPt = tempResult.nearestPt;
        return true;
      }
      return false;
    }

    function pointToRoute(roadCrossObject, route, intersectResult) {
      let length = route.stations.length;
      let pt = { x: roadCrossObject.position[0], y: roadCrossObject.position[1] };

      let retVal = false;
      for (let i = 0; i < length; i++) {
        let station = naviRoute.stations[i];
        if (!station.segment || station.segment.length == 0 || (station.type !== "2" && station.type !== "3" && station.type !== "8" && station.type !== "5"))
          continue;
        if (station.floor !== roadCrossObject.floor) continue;
        let tempResult = { minDistance: Infinity, nearestPt: undefined };
        if (pointToSegment(pt, station.segment, tempResult)) {
          if (tempResult.minDistance < intersectResult.minDistance) {
            intersectResult.minDistance = tempResult.minDistance;
            intersectResult.nearestPt = tempResult.nearestPt;
            intersectResult.station = station;
            retVal = true;
          }
        }
      }
      return retVal;
    }

    for (let x = 0; x < roadCrossArray.length; x++) {
      let roadCrossObject = roadCrossArray[x];
      let retResult = { minDistance: Infinity, nearestPt: undefined, station: undefined };
      if (pointToRoute(roadCrossObject, naviRoute, retResult)) {
        let roadInfo = {};
        roadInfo.nearestPt = retResult.nearestPt;
        roadInfo.result = roadCrossObject;
        retResult.station.roadInfo = roadInfo;
      }
    }
  };

  return thisObject;
};

//////////////////////////////////////////////////////////
// RouteParseHelper
//////////////////////////////////////////////////////////
let RouteParseHelper = (function () {
  let thisObject = {};
  let navi_utils = daximap["DXMapUtils"]["naviMath"];

  thisObject.setlocationToSystem = function (e) {};

  thisObject.station_start_func = function () {};
  /**
   * Parse Arrive Methods
   * @param arriveMethods
   * @param path
   */
  thisObject.parseArriveMethods = function (arriveMethods, path, language) {
    if (language == "En") {
      return thisObject.parseArriveMethodsByEn(arriveMethods, path);
    }
    let naviInfoList = path["naviInfoList"];
    for (let i = 0; i < naviInfoList.length; i++) {
      let info = naviInfoList[i];
      if (info["action"] === "0x03") {
        arriveMethods["out_down_dt"] =
          arriveMethods["out_up_dt"] =
          arriveMethods["down_dt"] =
          arriveMethods["up_dt"] =
          arriveMethods["icon-zhiti"] =
            window["langData"]["take:elevactor"] || "乘坐电梯";
      } else if (info["action"] === "0x04") {
        arriveMethods["out_down_lt"] =
          arriveMethods["out_up_lt"] =
          arriveMethods["down_lt"] =
          arriveMethods["up_lt"] =
          arriveMethods["icon-buti"] =
            window["langData"]["take:stair"] || "走楼梯";
      } else if (info["action"] === "0x05") {
        arriveMethods["out_down_ft"] =
          arriveMethods["out_up_ft"] =
          arriveMethods["down_ft"] =
          arriveMethods["up_ft"] =
          arriveMethods["icon-futi"] =
            window["langData"]["take:escalator"] || "乘坐扶梯";
      } else if (info["action"] === "0x07") {
        //出入口
        arriveMethods["out_down_entrance"] =
          arriveMethods["out_up_entrance"] =
          arriveMethods["down_entrance"] =
          arriveMethods["up_entrance"] =
          arriveMethods["icon-entrance"] =
            window["langData"]["forward:along:the:entrance"] || "沿出入口前行";
      } else if (info["action"] === "0x08") {
        //闸机
        arriveMethods["out_down_gate"] = arriveMethods["out_up_gate"] = arriveMethods["down_gate"] = arriveMethods["up_gate"] = arriveMethods["icon-gate"] = ""; //"过闸机";
      } else if (info["action"] === "0x00") {
      }
    }
    arriveMethods["icon_bx"] = window["langData"]["walk:bingxing"] || "步行";
  };
  thisObject.parseArriveMethodsByEn = function (arriveMethods, path) {
    let naviInfoList = path["naviInfoList"];
    for (let i = 0; i < naviInfoList.length; i++) {
      let info = naviInfoList[i];
      if (info["action"] === "0x03") {
        arriveMethods["icon-zhiti"] = " Take the elevator ";
      } else if (info["action"] === "0x04") {
        arriveMethods["icon-buti"] = " Take the stairs ";
      } else if (info["action"] === "0x05") {
        arriveMethods["icon-futi"] = " Take the escalator ";
      } else if (info["action"] === "0x07") {
        //出入口
      } else if (info["action"] === "0x08") {
        //闸机
      } else if (info["action"] === "0x00") {
      }
    }
    arriveMethods["icon_bx"] = " walk ";
  };

  /**
   * parse Icon Type
   * @param path
   */
  thisObject.parseIconType = function (path) {
    let naviInfoList = path["naviInfoList"];
    if (naviInfoList.length > 0);
    let currinfo = naviInfoList[0];
    let lastInfo = currinfo;
    currinfo.startIconType = "start";
    for (let i = 1; i < naviInfoList.length; i++) {
      lastInfo = currinfo;
      currinfo = naviInfoList[i];
      let prevFloorNum = navi_utils.getRealFloorNumbyFloorId(lastInfo["floor"]);
      let currFloorNum = navi_utils.getRealFloorNumbyFloorId(currinfo["floor"]);
      if (prevFloorNum < currFloorNum) {
        let iconType = thisObject.getIconTypeInfo(lastInfo["action"]);
        lastInfo.endIconType = "up_" + iconType;
        currinfo.startIconType = "out_up_" + iconType;
      } else if (prevFloorNum > currFloorNum) {
        let iconType = thisObject.getIconTypeInfo(lastInfo["action"]);
        lastInfo.endIconType = "down_" + iconType;
        currinfo.startIconType = "out_down_" + iconType;
      } else if (prevFloorNum == currFloorNum) {
        let iconType = thisObject.getIconTypeInfo(lastInfo["action"]);
        lastInfo.endIconType = "down_" + iconType;
        currinfo.startIconType = "out_down_" + iconType;
      }
    }
    currinfo = naviInfoList[naviInfoList.length - 1];
    currinfo.endIconType = "end";
  };

  /**
   * get Icon Type Info
   * @param action
   * @returns {string}
   */
  thisObject.getIconTypeInfo = function (action) {
    if (action === "0x03") {
      // "乘坐电梯"
      return "dt";
    } else if (action === "0x04") {
      //"走楼梯";
      return "lt";
    } else if (action === "0x05") {
      //"乘坐扶梯";
      return "ft";
    } else if (action === "0x07") {
      //(window["langData"]["entrace"]|| "出入口");
      return "entrance";
    } else if (action === "0x08") {
      //(window["langData"]["gate:machine"]|| "闸机");
      return "gate";
    } else if (action === "0x00") {
    }
  };

  /**
   * Get Target Name
   * @param info
   * @returns {string}
   */
  thisObject.getTargetName = function (info, language, naviRoute) {
    if (info["targetName"]) {
      return info["targetName"];
    }
    if (language == "En") {
      return thisObject.getTargetNameEn(info);
    }
    if (info["action"] === "0x03") {
      return window["langData"]["elevactor"] || "电梯";
    } else if (info["action"] === "0x04") {
      return window["langData"]["stair"] || "楼梯";
    } else if (info["action"] === "0x05") {
      return window["langData"]["escalator"] || "扶梯";
    } else if (info["action"] === "0x07") {
      return window["langData"]["entrace"] || "出入口";
    } else if (info["action"] === "0x08") {
      return window["langData"]["gate:machine"] || "闸机";
    } else if (info["action"] === "0x00") {
      return "";
    } else if (info["action"] === "0x06") {
      return naviRoute.targetName || window["langData"]["destnation"] || "目的地";
    }
  };
  thisObject.getTargetNameEn = function (info) {
    if (info["action"] === "0x03") {
      return " elevator ";
    } else if (info["action"] === "0x04") {
      return " stair ";
    } else if (info["action"] === "0x05") {
      return " escalator ";
    } else if (info["action"] === "0x00") {
      return "";
    } else if (info["action"] === "0x07") {
      return " entrance ";
    } else if (info["action"] === "0x08") {
      return " gate ";
    } else if (info["action"] === "0x06") {
      return " destination ";
    }
  };
  /**
   * Get Target Name by Icon Name
   * @param iName
   * @returns {string}
   */
  thisObject.getTargetNameByIconName = function (iName, language) {
    if (iName.indexOf("dt") !== -1) {
      if (language == "En") {
        return " elevator ";
      }
      return window["langData"]["elevactor"] || "电梯";
    } else if (iName.indexOf("lt") !== -1) {
      if (language == "En") {
        return " stair ";
      }
      return window["langData"]["stair"] || "楼梯";
    } else if (iName.indexOf("ft") !== -1) {
      if (language == "En") {
        return " escalator ";
      }
      return window["langData"]["escalator"] || "扶梯";
    }
  };

  /**
   * Get Type by Icon Name
   * @param iName
   * @returns {string}
   */
  thisObject.getTypeByIconName = function (iName) {
    if (iName.indexOf("dt") !== -1) {
      return "zhiti";
    } else if (iName.indexOf("lt") !== -1) {
      return "louti";
    } else if (iName.indexOf("ft") !== -1) {
      return "futi";
    }
  };

  thisObject.getDirByIconName = function (type) {
    let dir = "up";
    let typename = type.split("_");
    if (typename.length == 2) {
      dir = typename[0].split("-")[1];
    } else {
      dir = typename[0].split("-")[1] + typename[1];
    }
    return dir;
  };

  /**
   * get Target By Way
   * @param iName
   * @returns {string}
   */
  thisObject.getTargetbyWay = function (iName, language) {
    if (iName.indexOf("dt") !== -1 || iName.indexOf("ft") !== -1) {
      if (language == "En") {
        return " take ";
      }
      return window["langData"]["ride"] || "乘"; //ride
    } else if (iName.indexOf("lt") !== -1) {
      if (language == "En") {
        return " walk ";
      }
      return window["langData"]["walk"] || "走";
    } else {
      return "";
    }
  };

  /**
   * Get Up or Down
   * @param iName
   * @returns {string}
   */
  thisObject.directionUpOrDown = function (iName, language) {
    if (iName.indexOf("up") !== -1) {
      if (language == "En") {
        return " up to ";
      }
      return window["langData"]["up:walk:navi"] || "上行";
    } else if (iName.indexOf("down") !== -1) {
      if (language == "En") {
        return " down to ";
      }
      return window["langData"]["down:walk:navi"] || "下行";
    } else {
      return "";
    }
  };

  thisObject.createEndStation = function (segment, curFloor, index, endIconType) {
    let newStation = {
      type: "8",
      floorObjectIndex: index,
      floor: curfloor,
      angelIcon: "icon-uniE660",
      angel: 0,
      autoPass: false,
      action: station_start_func,
      position: [segment[0].x, segment[0].y],
      segment: segment,
      endIconType: "", //info.endIconType
    };
    return newStation;
  };

  /**
   * Get Angel Text
   * @param angel
   * @returns {{}}
   */
  thisObject.getAngelText = function (angel, language) {
    if (language == "En") {
      return thisObject.getAngelTextEn(angel);
    }
    let outData = {};
    if (angel === -99999) {
      outData.angelText = window["langData"]["walk:along:route:navi"] || "延路线步行";
      outData.angelIcon = "icon-zhixing";
    } else if (angel <= -120) {
      outData.angelText = window["langData"]["turn:leftback:navi"] || "向左后方转弯";
      outData.angelIcon = "icon-zouhouzhuan";
    } else if (angel <= -60 && angel > -120) {
      outData.angelText = window["langData"]["turn:left:navi"] || "左转";
      outData.angelIcon = "icon-zuozhuan";
    } else if (angel <= -32 && angel > -60) {
      outData.angelText = window["langData"]["turn:leftfront:navi"] || "向左前方转弯";
      outData.angelIcon = "icon-zuoqianzhuan";
    } else if (angel <= 32 && angel > -32) {
      outData.angelText = window["langData"]["rectigrade:navi"] || "直行";
      outData.angelIcon = "icon-zhixing";
    } else if (angel > 32 && angel <= 60) {
      outData.angelText = window["langData"]["turn:rightfront:navi"] || "向右前方转弯";
      outData.angelIcon = "icon-youqianzhuan";
    } else if (angel > 60 && angel <= 120) {
      outData.angelText = window["langData"]["turn:right:navi"] || "右转";
      outData.angelIcon = "icon-youzhuan";
    } else if (angel > 120) {
      outData.angelText = window["langData"]["turn:rightback:navi"] || "向右后方转弯";
      outData.angelIcon = "icon-youhouzhuan";
    }
    return outData;
  };
  thisObject.getAngelTextEn = function (angel) {
    let outData = {};
    if (angel === -99999) {
      outData.angelText = "Walk along the route";
      outData.angelIcon = "icon-zhixing";
    } else if (angel <= -120) {
      outData.angelText = "Turn left and back";
      outData.angelIcon = "icon-zouhouzhuan";
    } else if (angel <= -60 && angel > -120) {
      outData.angelText = "Turn left";
      outData.angelIcon = "icon-zuozhuan";
    } else if (angel <= -32 && angel > -60) {
      outData.angelText = "Turn left and forward";
      outData.angelIcon = "icon-zuoqianzhuan";
    } else if (angel <= 32 && angel > -32) {
      outData.angelText = "go straight";
      outData.angelIcon = "icon-zhixing";
    } else if (angel > 32 && angel <= 60) {
      outData.angelText = "Turn right and forward";
      outData.angelIcon = "icon-youqianzhuan";
    } else if (angel > 60 && angel <= 120) {
      outData.angelText = "turn right";
      outData.angelIcon = "icon-youzhuan";
    } else if (angel > 120) {
      outData.angelText = "Turn right and back";
      outData.angelIcon = "icon-youhouzhuan";
    }
    return outData;
  };
  thisObject.getAngelText2 = function (angel, language) {
    // let outData = {};
    if (language == "En") {
      return thisObject.getAngelText2En(angel);
    }
    angel > 180 ? (angel -= 360) : angel < -180 ? (angel += 360) : "";
    let angelText = "";
    if (angel <= -120) {
      angelText = window["langData"]["leftback:navi"] || "左后方";
    } else if (angel <= -60 && angel > -120) {
      angelText = window["langData"]["lefthand:navi"] || "左手边";
    } else if (angel <= -30 && angel > -60) {
      angelText = window["langData"]["leftfront:navi"] || "左前方";
    } else if (angel <= 30 && angel > -30) {
      angelText = window["langData"]["front:navi"] || "前方";
    } else if (angel > 30 && angel <= 60) {
      angelText = window["langData"]["rightfront:navi"] || "右前方";
    } else if (angel > 60 && angel <= 120) {
      angelText = window["langData"]["right:back:navi"] || "右手边";
    } else if (angel > 120) {
      angelText = window["langData"]["right:back:navi"] || "右后方";
    } else {
    }
    return angelText;
  };
  thisObject.getAngelText2En = function (angel) {
    // let outData = {};
    angel > 180 ? (angel -= 360) : angel < -180 ? (angel += 360) : "";
    let angelText = "";
    if (angel <= -120) {
      angelText = "left rear";
    } else if (angel <= -60 && angel > -120) {
      angelText = "left";
    } else if (angel <= -30 && angel > -60) {
      angelText = "front left";
    } else if (angel <= 30 && angel > -30) {
      angelText = "ahead";
    } else if (angel > 30 && angel <= 60) {
      angelText = "Forward right";
    } else if (angel > 60 && angel <= 120) {
      angelText = "right";
    } else if (angel > 120) {
      angelText = "Right rear";
    } else {
    }
    return angelText;
  };
  /**
   * Get Angel
   * @param angel
   * @returns {*}
   */
  thisObject.getAngel = function (angel) {
    if (angel <= -120) {
    } else if (angel <= -60 && angel > -120) {
    } else if (angel <= -30 && angel > -60) {
    } else if (angel <= 30 && angel > -30) {
    } else if (angel > 30 && angel <= 60) {
    } else if (angel > 60 && angel <= 120) {
    } else if (angel > 120) {
    } else {
    }
    return angel;
  };

  /**
   * Convert Path Coords
   * @param path
   */
  thisObject.convertPathCoords = function (naviCore, path) {
    return;
    naviCore.convertCoords(path.start);
    for (let i = 0; i < path.naviInfoList.length; i++) {
      let info = path.naviInfoList[i];
      let geometry = info["geometry"];
      for (let j = 0; j < geometry.length; j++) {
        naviCore.convertCoords(geometry[j]);
      }
    }
    naviCore.convertCoords(path.end);
  };

  thisObject.matchInnerIndex = function (naviCore, path) {
    let naviInfoList = path["naviInfoList"];
    let naviListlen = naviInfoList.length;
    let locationMap = naviCore.locatingMap;
    if (locationMap === undefined) return;

    for (let i = 0; i < naviListlen; i++) {
      let info = naviInfoList[i];
      let innerIndex = -1;
      for (let key in locationMap) {
        let item = locationMap[key];
        if (item["floorId"] == info.floor) {
          innerIndex = parseInt(item["locationIndex"]);
          return 1;
        } else {
          return 0;
        }
      }
      info["innerFloorIndex"] = "" + innerIndex;
    }
  };

  //lishuang 2016-1-08
  thisObject.fileterSameLayerData = function (path) {
    let naviInfoList = path["naviInfoList"];
    let naviListlen = naviInfoList.length;
    for (let i = 0; i < naviListlen; i++) {
      let info = naviInfoList[i];
      let geometry = info["geometry"];
      //  lishuang 2016 -1-27 filter one set cons same layer path
      let len = geometry.length;
      let filter = false;
      let startCONID = geometry[0]["con_id"];
      let endCONID = geometry[len - 1]["con_id"];
      if (startCONID && startCONID == endCONID) {
        let tmpPath = naviInfoList.splice(i, 1);
        i--;
        naviListlen--;
        //filter = true;
        //if(startCONID != 0){
        //    geometry.splice(0,1);
        //    len--;
        //}
        for (let j = 0; j < len; j++) {
          let conId = geometry[j]["con_id"];
          if (startCONID != conId) {
            geometry.splice(j, 1);
            len--;
            j--;
            //navi_map.convertCoords(geometry[j]);
          }
        }
        naviInfoList[i]["geometry"].concat(geometry.slice(1));
      }
    }
  };
  thisObject.createRouteImpl = function (naviCore) {
    if (thisObject.naviRoute) {
      thisObject.naviRoute.reset();
    }
    thisObject.naviRoute = RawRoute(naviCore);
    return thisObject.naviRoute;
  };
  return thisObject;
})();

//////////////////////////////////////////////////////////
// NavigationOperatorExcutant
//////////////////////////////////////////////////////////
let NavigationOperatorExcutant = function () {
  let info = {};
  info.operatorQueue = [];
  info.cursor = -1;
  info.isPause = false;
  info.lastTime = 0;

  info.start = function (curTime) {
    if (info.operatorQueue.length > 0) {
      info.isPause = false;
      info.cursor = 0;
      info.lastTime = 0;
      let operator = info.operatorQueue[info.cursor];
      operator.onStart(curTime);
    }
  };
  info.stop = function () {};
  info.run = function (curTime) {
    if (info.isPause === true) return 0;
    if (info.cursor === -1) return 0;
    if (info.cursor >= info.operatorQueue.length) return -1;
    let operator = info.operatorQueue[info.cursor];
    operator.onRuning(curTime);
    if (operator.isFinished()) {
      info.cursor++;
      if (info.cursor < info.operatorQueue.length) {
        operator = info.operatorQueue[info.cursor];
        operator.onStart(curTime);
      }
    }

    info.lastTime = curTime;
    if (info.cursor === info.operatorQueue.length - 1) {
      return -1;
    }
    return info.operatorQueue.length - info.cursor;
  };
  info.pause = function () {
    info.isPause = true;
  };
  info.resume = function () {
    info.isPause = false;
  };
  info.add = function (operator) {
    info.operatorQueue.push(operator);
  };
  info.setSpeedScale = function (speed) {
    info.operatorQueue.forEach(function (operator) {
      operator.setSpeedScale && operator.setSpeedScale(speed);
    });
  };
  info.clear = function () {
    info.operatorQueue.forEach(function (operator) {
      if (operator.playStairsAnimation && operator.clearFloorAm) {
        operator.clearFloorAm();
      }
    });
    info.operatorQueue = [];
  };

  return info;
};

let NavigationOperator = function () {
  let thisObject = this;
  thisObject.naviCore = null;
  thisObject.isEnd = false;
  let prototype = NavigationOperator.prototype;
  prototype.init = function (naviCore) {
    this.naviCore = naviCore;
    this.isEnd = false;
  };
  prototype.finishOperator = function () {
    this.isEnd = true;
  };
  prototype.onFinish = function (tick) {};
  prototype.onStart = function (tick) {};
  prototype.onRuning = function (tick) {};
  prototype.isFinished = function () {
    return this.isEnd;
  };
};

let FloorSegmentOperator = function (naviCore, fl, language) {
  NavigationOperator.call(this);
  let thisObject = this;
  thisObject.naviCore = naviCore;
  thisObject.locationCore = naviCore.locationCore;
  thisObject.indicator = naviCore.indicator;
  thisObject.floorObject = fl;
  // thisObject.route_length = fl.geometry.total_length;
  thisObject.route_length = fl.smoothRoute.total_length;
  thisObject.curTime = 0;
  thisObject.speed = 1.5;
  thisObject.speedScale = naviCore.simulateSpeedScale || 2.0;
  thisObject.totalTime = thisObject.route_length / thisObject.speed;
  thisObject.interval = 0.2 * thisObject.speedScale;

  let prototype = FloorSegmentOperator.prototype;
  prototype.setSpeedScale = function (speedScale) {
    this.interval = 0.2 * speedScale;
  };
  prototype.onFinish = function (tick) {
    let thisObject = this;
    let pose = thisObject.floorObject.getCurrentPose(1);
    if (thisObject.naviCore.usingLineHeading === false) {
      let headingView = 0;
    }
    thisObject.indicator.setPositionDirect(pose.pos[0], pose.pos[1], pose.floorId, pose.heading, true, headingView);
    thisObject.finishOperator();
  };
  prototype.onStart = function (tick) {
    let thisObject = this;
    let pose = thisObject.floorObject.getCurrentPose(0);
    if (thisObject.naviCore.usingLineHeading === false) {
      let headingView = 0;
    }
    thisObject.indicator.setPositionDirect(pose.pos[0], pose.pos[1], pose.floorId, pose.heading, true, headingView);
  };
  prototype.onRuning = function (tick) {
    try {
      let thisObject = this;
      thisObject.curTime += thisObject.interval;
      let t = thisObject.curTime / thisObject.totalTime;
      if (thisObject.curTime >= thisObject.totalTime) {
        thisObject.onFinish();
      }
      let pose = thisObject.floorObject.getCurrentPose(t);
      let random_pos = false;
      if (random_pos === true && t < 0.95) {
        xOffset += Math.random() * 5 - 2.5;
        yOffset += Math.random() * 5 - 2.5;
        if (xOffset > 5 || xOffset < -5) xOffset = -xOffset;
        if (yOffset > 5 || yOffset < -5) yOffset = -yOffset;
        pose.pos[0] += 0.000001 * xOffset;
        pose.pos[1] += 0.000001 * yOffset;
      }

      let angelOffset = pose.headingTilt[0];
      e = { code: 220 };
      e.heading = angelOffset;
      e.pathDir = pose.headingTilt[0];
      e.location = { x: pose.pos[0], y: pose.pos[1], z: pose.floorId, a: e.heading };
      if (parseInt(e.code) !== 220) return;
      onChangePositionInNavi(e);
    } catch (err) {
      alert("onRuning:" + err.toString());
    }
  };

  function onChangePositionInNavi(e) {
    let pose = { pos: [e.location.x, e.location.y, 0], pathDir: e.pathDir, heading: e.location.a, floorId: e.location.z };

    let indicator = thisObject.naviCore.indicator;
    if (indicator === null) return;
    let isNavigating = true;
    // Set Indicator Position
    let lng = pose.pos[0];
    let lat = pose.pos[1];
    let curfloorId = pose.floorId;
    let headingView = pose.heading;
    let usingLineHeading = thisObject.naviCore.usingLineHeading;
    //if(usingLineHeading === false){
    //    headingView = thisObject.naviCore.naviHeading || 0;
    //}
    // 如果在导航状态
    if (thisObject.isNavigatePause !== true) {
      tempDistanceI = 0;

      let args = { route: thisObject.naviCore.route, result: null, indicator: indicator };
      args.result = { minDistance: 999999, targetDistance: 0, index: -1 };
      if (args.route.getNearestStation(pose, args.result)) {
        // 距终点信息
        let data = args.route.getLastDistance(args.result.targetDistance, args.result);
        let nearPt = [args.result.nearestPt.x, args.result.nearestPt.y];

        if (args.result.minDistance < 1) {
          //thisObject.naviCore.correctDistance) {
          indicator.setPositionSmooth(
            args.result.nearestPt.x,
            args.result.nearestPt.y,
            args.result.floor,
            pose.heading,
            headingView,
            undefined,
            0,
            isNavigating
          );
        } else {
          indicator.setPositionSmooth(lng, lat, curfloorId, pose.heading, headingView, nearPt, 0, isNavigating);
        }
        Fire_onIndicator_ShowCrossImage(args);
        Fire_onIndicator_UpdateInfo(args, data, language);
      } else {
        indicator.setPositionSmooth(lng, lat, curfloorId, pose.heading, headingView, undefined, 0, isNavigating);
      }
    } else {
      if (tempDistanceI == 0) {
        naviRoute.naviCore.speakListener && naviRoute.naviCore.speakListener.updateMsg(tempDistance, naviRoute.naviCore.minSpeakDistance);
        tempDistanceI += 1;
      }
    }
  }

  let tempDistance = 0,
    tempDistanceI = 0,
    stageTotalDis = 0;
  let isReachEndPoint = false;

  function Fire_onIndicator_ShowCrossImage(args) {
    let result = args.result;

    if (result.roadResult !== undefined) {
      result.roadResult["bdid"] = args.route.bdid;
      thisObject.naviCore.showCrossRoad(result.roadResult);
    } else {
      thisObject.naviCore.showCrossRoad(false);
    }
  }
  function getMsg(tempDistance, curStation) {
    let str = (window["langData"]["navi:speak:auto:regx"] || "方{{(S*)}}米").replace("{{(S*)}}", "(S*)");
    let updateReg = new RegExp(str); ///方(\S*)米/;
    if (curStation.speakText) {
      let substr = curStation.speakText.match(updateReg);
      if (substr != null) {
        substr = curStation.speakText.replace(substr[1], tempDistance);
      }

      if (substr && substr.indexOf(". ") != -1) {
        substr = substr.slice(substr.indexOf(". ") + 2);
      }
      return substr || "";
    }

    return "";
  }
  // function speakChangeFloor(route,speakListener,tempDistance,curStation,nextStation){
  //     let msg = getMsg(tempDistance,curStation);
  //     msg = msg ? msg +(window["langData"]["after"]|| "然后 "):'';
  //     msg += speakListener.getSpeakText(route.currentCursor+1);
  //     speakListener.speakNow(msg,null,null);
  //     nextStation.speaked = true;

  // }
  function Fire_onIndicator_UpdateInfo(args, data, language) {
    let result = args.result;
    let route = args.route;
    let naviCore = thisObject.naviCore;
    let speakListener = naviCore.speakListener;
    if (result.index == -1) {
      return;
    }
    // let grayRoutePoints = args.result.grayRoutePoints;
    //grayRoutePoints
    // if(grayRoutePoints.length){
    let grayT = args.result.walkedRouteRatio;
    data["grayT"] = grayT;
    data["floorId"] = result.floor;
    // naviCore.mapAPI._coreMap.setPolylineGrayData(args.result.floor,grayT,grayRoutePoints);
    // }
    let nextStation;
    let stations = route.stations;
    let curStation = stations[route.currentCursor];

    if (stations.length > route.currentCursor + 1 && stations[route.currentCursor + 1].type == 3) {
      nextStation = stations[route.currentCursor + 1];
    }
    if (naviCore.naviSpeakType == 2) {
      //导航到路线拐角前播报
      if (route.currentCursor < result.index) {
        return; //由于在拐点容易出现走过了再说，引起误解
        //if (route.currentCursor != result.index) {
        route.currentCursor = result.index;
        stageTotalDis = Math.ceil(result.targetDistance);
        route.updateInfo(Math.floor(result.targetDistance), result.station, data.stationIndex > 2 ? STAGECHANGING_SPEAK : BEFORE_STAGECHANGE_SPEAK);
        data["speakType"] = data.stationIndex >= 2 ? STAGECHANGING_SPEAK : BEFORE_STAGECHANGE_SPEAK;
        naviCore.updateNaviProgressInfo(data);
        //} else {
      } else if (route.currentCursor == result.index) {
        tempDistance = Math.ceil(result.targetDistance);
        //naviCore.naviTipInfo.updateDistance(result.targetDistance);
        // naviPositionChanged
        //距离较长时语音重复播报

        let speakText = curStation.speakText;
        if (curStation.type == 3 && tempDistance < 11 && stations.length > route.currentCursor + 1) {
          let nextStation = stations[route.currentCursor + 1];
          data["angelText"] = nextStation.speakText;
          if (curStation.speaked) {
            return;
          }
          if (speakListener) {
            speakListener.speakNext(route.currentCursor + 1);
          } else {
            data["stationSpeakText"] = speakText;
          }
        } else {
          let speakDistanceParam = naviCore.speakDistanceParam;
          if (speakDistanceParam) {
            let totalDisArray = speakDistanceParam["totalDisArray"];
            let speakDisArray = speakDistanceParam["speakDisArray"];

            for (let i = 0; i < totalDisArray.length; i++) {
              if (stageTotalDis >= totalDisArray[i] && tempDistance <= speakDisArray[i]) {
                let msg = "";
                if (stageTotalDis >= 50 && tempDistance > 30) {
                  if (language == "En") {
                    msg = "Go Straight ahead";
                  } else {
                    msg = window["langData"]["nodis:zhixing:speak:navi"] || "请沿路线指示前行";
                  }
                } else {
                  if (speakListener) {
                    msg = speakListener.updateMsg(tempDistance, naviCore.minSpeakDistance);
                  } else {
                    msg = getMsg(tempDistance, curStation);
                  }
                }
                if (i === totalDisArray.length - 1) {
                  if (stageTotalDis > 0 && tempDistance <= speakDisArray[i]) {
                    if (speakListener) {
                      msg = speakListener.updateMsgFinal();
                    } else {
                      let substr = thisObject.textQueue[thisObject.cursor].match(thisObject.updateReg);
                      if (substr != null) {
                        substr = thisObject.textQueue[thisObject.cursor].replace(substr[1], "");
                        msg = substr;
                      }
                    }
                  }
                  stageTotalDis = 0;
                } else {
                  stageTotalDis = speakDisArray[i];
                }
                speakListener && speakListener.speakNow(msg, null, null);
                break;
              }
            }
            if (nextStation && tempDistance + nextStation.distance < naviCore.changeFloorTipDis && !nextStation.speaked) {
              speakChangeFloor(route, speakListener, tempDistance, curStation, nextStation);
            }
          } else {
            /*if (stageTotalDis >= 32 && tempDistance <= 16) {
                            if(speakListener){
                                let msg = speakListener.updateMsg(tempDistance,naviCore.minSpeakDistance);
                                speakListener.speakNow(msg,null,null);

                            }else{
                                msg = getMsg(tempDistance,curStation);
                            }
                            stageTotalDis = 0;
                        }*/
            /*if(stageTotalDis >= 10 && tempDistance <= 5){
                            stageTotalDis = Math.ceil(result.targetDistance);
                            route.updateInfo(Math.floor(result.targetDistance),result.station,BEFORE_STAGECHANGE_SPEAK);
                            data["speakType"] = BEFORE_STAGECHANGE_SPEAK
                            naviCore.updateNaviProgressInfo(data);
                            speakListener.speakNow(result.station.speakText,null,null);
                        }*/
            if (nextStation && tempDistance + nextStation.distance < naviCore.changeFloorTipDis && !nextStation.speaked) {
              speakChangeFloor(route, speakListener, tempDistance, curStation, nextStation);
              // let msg = getMsg(tempDistance,curStation);
              // msg = msg ? msg +(window["langData"]["after"]|| "然后 "):'';
              // msg += speakListener.getSpeakText(route.currentCursor+1);
              // if(curStation.speaked){
              //     return;
              // }
              // speakListener.speakNow(msg,null,null);
              // nextStation.speaked = true;
            }
            if (curStation.type != 8 && stageTotalDis > naviCore.naviSpeakBeforDistance && tempDistance <= naviCore.naviSpeakBeforDistance) {
              //最后一条路不提示,小于5米时
              stageTotalDis = 0;
              if (naviCore.naviOnCrossingSpeak && stageTotalDis <= naviCore.naviSpeakBeforDistance) {
                //在拐点时提示需要大于10米的路才提示
                return;
              }
              stageTotalDis = Math.ceil(result.targetDistance);
              route.updateInfo(Math.floor(result.targetDistance || 0), result.station, BEFORE_STAGECHANGE_SPEAK);
              data["speakType"] = BEFORE_STAGECHANGE_SPEAK;
              naviCore.updateNaviProgressInfo(data);
              if (curStation.speaked) {
                return;
              }
              speakListener.speakNow(result.station.speakText, null, null);
            }
          }
          data["stationSpeakText"] = msg;
        }
        data["speakType"] = BEFORE_STAGECHANGE_SPEAK;
        naviCore.updateNaviProgressInfo(data);
      }
    } else {
      if (route.currentCursor != result.index) {
        route.currentCursor = result.index;
        stageTotalDis = Math.ceil(result.targetDistance);
        route.updateInfo(Math.floor(result.targetDistance || 0), result.station);
        naviCore.updateNaviProgressInfo(data);
      } else {
        tempDistance = Math.ceil(result.targetDistance);
        //naviCore.naviTipInfo.updateDistance(result.targetDistance);
        // naviPositionChanged
        //距离较长时语音重复播报
        let stations = route.stations;
        let curStation = stations[route.currentCursor];
        let speakText = curStation.speakText;

        if (curStation.type == 3 && tempDistance < 7 && stations.length > route.currentCursor + 1) {
          let nextStation = stations[route.currentCursor + 1];
          data["angelText"] = nextStation.speakText;
          // if(curStation.speaked){
          //     return;
          // }
          if (speakListener) {
            speakListener.speakNext(route.currentCursor + 1);
          } else {
            data["stationSpeakText"] = speakText;
          }
        } else {
          let speakDistanceParam = naviCore.speakDistanceParam || {
            totalDisArray: [200, 150, 100, 60, 40, 15],
            speakDisArray: [180, 140, 90, 50, 30, 10],
          };
          if (speakDistanceParam) {
            let totalDisArray = speakDistanceParam["totalDisArray"];
            let speakDisArray = speakDistanceParam["speakDisArray"];

            for (let i = 0; i < totalDisArray.length; i++) {
              if (stageTotalDis >= totalDisArray[i] && tempDistance <= speakDisArray[i]) {
                let msg = "";
                if (stageTotalDis >= 50 && tempDistance > 30) {
                  if (language == "En") {
                    msg = "Go Straight ahead";
                  } else {
                    msg = window["langData"]["nodis:zhixing:speak:navi"] || "请沿路线指示前行";
                  }
                } else {
                  if (speakListener) {
                    msg = speakListener.updateMsg(tempDistance, naviCore.minSpeakDistance);
                  } else {
                    msg = getMsg(tempDistance, curStation);
                  }
                }
                if (i === totalDisArray.length - 1) {
                  if (stageTotalDis > 0 && tempDistance <= speakDisArray[i]) {
                    if (speakListener) {
                      msg = speakListener.updateMsgFinal();
                    } else {
                      let substr = thisObject.textQueue[thisObject.cursor].match(thisObject.updateReg);
                      if (substr != null) {
                        substr = thisObject.textQueue[thisObject.cursor].replace(substr[1], "");
                        msg = substr;
                      }
                    }
                  }
                  stageTotalDis = 0;
                } else {
                  stageTotalDis = speakDisArray[i];
                }
                speakListener && speakListener.speakNow(msg, null, null);
                break;
              }
            }
          } else {
            if (stageTotalDis >= 32 && tempDistance <= 16) {
              if (speakListener) {
                let msg = speakListener.updateMsg(tempDistance, naviCore.minSpeakDistance);
                speakListener.speakNow(msg, null, null);
              } else {
                msg = getMsg(tempDistance, curStation);
              }
              stageTotalDis = 0;
            } else if (nextStation && tempDistance + nextStation.distance < naviCore.changeFloorTipDis && !nextStation.speaked) {
              let msg = getMsg(tempDistance, curStation);
              msg = msg ? msg + (window["langData"]["after"] || "然后 ") : "";
              msg += speakListener.getSpeakText(route.currentCursor + 1);
              if (curStation.speaked) {
                return;
              }
              speakListener.speakNow(msg, null, null);
              nextStation.speaked = true;
            }
          }
          data["stationSpeakText"] = msg;
        }
        naviCore.updateNaviProgressInfo(data);
      }
    }
  }
};
FloorSegmentOperator.prototype = Object.create(NavigationOperator.prototype);
FloorSegmentOperator.prototype.constructor = FloorSegmentOperator;

let FloorChangeOperator = function (naviCore, station, language) {
  NavigationOperator.call(this);
  let thisObject = this;
  thisObject.naviCore = naviCore;
  thisObject.station = station;
  thisObject.callBack = null;
  let navi_utils = daximap["DXMapUtils"]["naviMath"];
  let prototype = FloorChangeOperator.prototype;
  prototype.onStart = function (tick) {
    let thisObject = this;
    if (thisObject.naviCore.isStairsShow() === false) {
      thisObject.playStairsAnimation(
        thisObject.station.floor,
        thisObject.station.nextFloor,
        thisObject.station.angelIcon,
        1000,
        thisObject.onPlayStairFinished,
        language
      );
      // console.log('开始动画楼层数据传递' + thisObject.station.nextFloor);
    }
  };

  prototype.onPlayStairFinished = function () {
    let thisObject = this;
    thisObject.finishOperator();
  };
  prototype.showFloorAmTimer = null;
  prototype.playStairsAnimation = function (startFloorId, endFloorId, iconName, interval, callback) {
    let thisObject = this;
    let start = navi_utils.getRealFloorNumbyFloorId(startFloorId);
    let end = navi_utils.getRealFloorNumbyFloorId(endFloorId);
    let span = end - start;
    let curr = start;

    let way = RouteParseHelper.getTargetNameByIconName(iconName, language);
    let type = RouteParseHelper.getTypeByIconName(iconName, language);
    let dir = RouteParseHelper.getDirByIconName(iconName, language);
    thisObject.callBack = callback;

    let temp = null;
    // let _timer = null;
    thisObject.naviCore.floorChangerShow(true);
    let showFloorAm = function (num) {
      if (curr == end) {
        temp = dir + "_out";
      } else {
        temp = dir;
      }
      if (dir.indexOf("undefined") == -1) {
        thisObject.naviCore.setFloorChangeData({ currFloor: num, type: type, direction: temp });
      }
      // console.log("工具：" + way + ",到达：" + (num + 1) + "层");
      if (dir === "up") {
        if (curr >= end) {
          window.clearTimeout(thisObject.showFloorAmTimer);
          thisObject.showFloorAmTimer = window.setTimeout(function () {
            window.clearTimeout(thisObject.showFloorAmTimer);
            thisObject.naviCore.floorChangerShow(false);
            // console.log('关闭楼层切换动画');
            thisObject.callBack();
          }, interval);
          return;
        }
        curr++;
      } else if (dir === "down") {
        if (curr <= end) {
          window.clearTimeout(thisObject.showFloorAmTimer);

          timer = window.setTimeout(function () {
            window.clearTimeout(thisObject.showFloorAmTimer);
            console.log("关闭楼层切换动画");
            thisObject.naviCore.floorChangerShow(false);
            thisObject.callBack();
          }, interval);

          return;
        }
        curr--;
      } else {
        console.log("调试数据：" + dir);
      }
      thisObject.showFloorAmTimer = window.setTimeout(function () {
        showFloorAm(curr);
      }, interval);
    };
    showFloorAm(curr);
  };
  prototype.clearFloorAm = function () {
    window.clearTimeout(thisObject.showFloorAmTimer);
    thisObject.naviCore.floorChangerShow(false);
  };
};
FloorChangeOperator.prototype = Object.create(NavigationOperator.prototype);
FloorChangeOperator.prototype.constructor = FloorChangeOperator;

let FloorChangeEndOperator = function (naviCore, station) {
  NavigationOperator.call(this);
  let thisObject = this;
  thisObject.naviCore = naviCore;
  thisObject.station = station;

  let prototype = FloorChangeEndOperator.prototype;
  prototype.onStart = function (tick) {
    let thisObject = this;
    let _timer = null;
    _timer = window.setTimeout(function () {
      window.clearTimeout(_timer);
      thisObject.isEnd = true;
    }, 2000);
  };
};
FloorChangeEndOperator.prototype = Object.create(NavigationOperator.prototype);
FloorChangeEndOperator.prototype.constructor = FloorChangeEndOperator;

let FloorEndOperator = function (naviCore, station) {
  NavigationOperator.call(this);
  let thisObject = this;
  thisObject.naviCore = naviCore;
  thisObject.station = station;

  let prototype = FloorEndOperator.prototype;
  prototype.onStart = function (tick) {};
  prototype.isFinished = function () {
    return thisObject.isEnd;
  };
};
FloorEndOperator.prototype = Object.create(NavigationOperator.prototype);
FloorEndOperator.prototype.constructor = FloorEndOperator;

//////////////////////////////////////////////////////////
// LocationSimulator
//////////////////////////////////////////////////////////
let LocationSimulator = function (language) {
  let thisObject = this;
  thisObject.naviCore = null;
  thisObject.isPause = false;
  thisObject.animationController = null;
  let prototype = LocationSimulator.prototype;
  prototype.init = function (core) {
    thisObject.naviCore = core;
    thisObject.animationController = window["DaxiMap"]["AnimationController"]();
    thisObject.animationController.init(1);
  };

  prototype.setPause = function (pVal) {
    let thisObject = this;
    thisObject.isPause = pVal;
    if (!pVal) {
      thisObject.animationController.start(null, true);
    }
  };

  prototype.setType = function (pVal) {
    let thisObject = this;
    thisObject.simulateType = pVal;
  };

  prototype.pause = function () {
    let thisObject = this;
    thisObject.isPause = true;
  };

  prototype.resume = function () {
    // thisObject.isPause = false;
    thisObject.setPause(false);
  };

  prototype.stop = function () {
    let thisObject = this;
    thisObject.isPause = true;

    thisObject.animationController.clearListeners();
    thisObject.animationController.stop();
  };

  let xOffset = 0; //Math.random() * 7 - 3.5;
  let yOffset = 0; // Math.random() * 7 - 3.5;
  let angelOffset = 0;
  let e = { code: 220 };

  prototype.start = function (callback) {
    if (callback === undefined) callback = locationCB;
    // thisObject.naviCore.indicator.setSimulate(true);
    thisObject.naviCore.indicator.setVisible(true);
    let locationDispacherFunc = function () {
      let pose = thisObject.naviCore.getLocationPose();
      let random_pos = false;
      if (random_pos === true) {
        xOffset += Math.random() * 0.5 - 0.25;
        yOffset += Math.random() * 0.5 - 0.25;
        if (xOffset > 5 || xOffset < -5) xOffset = -xOffset;
        if (yOffset > 5 || yOffset < -5) yOffset = -yOffset;
        pose.pos[0] += 0.00001 * xOffset;
        pose.pos[1] += 0.00001 * yOffset;
      }

      angelOffset = pose.headingTilt[0];
      // angelOffset += Math.random() * 20 - 10;
      e.heading = angelOffset;
      e.pathDir = pose.headingTilt[0];
      e.location = { x: pose.pos[0], y: pose.pos[1], z: pose.floor, a: e.heading };
      callback(e);
    };
    thisObject.isPause = true;
    thisObject.animationController.addListener(locationDispacherFunc);
    thisObject.animationController.start(null, true);
  };

  let locationCB = function (e) {
    if (parseInt(e.code) !== 220) return;
    // RouteParseHelper.setlocationToSystem(e);
    let pose = { pos: [e.location.x, e.location.y, 0], pathDir: e.pathDir, heading: e.location.a, floorId: e.location.z };

    let indicator = thisObject.naviCore.indicator;
    if (indicator === null) return;
    // Set Indicator Position
    let lng = pose.pos[0];
    let lat = pose.pos[1];
    let curfloorId = pose.floorId;
    indicator.setPositionDirect(lng, lat, curfloorId, pose.heading, true);
  };
};

//////////////////////////////////////////////////////////
// RawRouteSimulator
//////////////////////////////////////////////////////////
let RawRouteSimulator = function (language) {
  LocationSimulator.call(this);

  let thisObject = this;
  thisObject.startTime = null;
  thisObject.routeDistance = 0;
  thisObject.operatorController = NavigationOperatorExcutant();

  let prototype = RawRouteSimulator.prototype;
  prototype.start = function () {
    let thisObject = this;
    thisObject.startTime = new Date().getTime();
    thisObject.routeDistance = 0;
    thisObject.isPause = false;
    let naviDispacherFunc = function () {
      if (thisObject.isPause === false) {
        try {
          if (thisObject.operatorController.run(0) === -1) {
            onNavigationFinished();
            thisObject.animationController.stop();
            thisObject.animationController.clearListeners();
          }
        } catch (e) {
          console.log("naviDispacherFunc:" + e.toString());
        }
      }
    };

    let route = thisObject.naviCore.route;
    let pose = route.getCurrentPose(0);
    thisObject.naviCore.indicator._setMapPositionOnly(route.bdid, pose.floor, pose.pos[0], pose.pos[1]);
    thisObject.naviCore.indicator._setPositionOnly(pose.pos[0], pose.pos[1], route.bdid, pose.floor, pose.headingTilt[0], 0);

    thisObject.parseRoute(route, language);
    setTimeout(function () {
      thisObject.operatorController.start();
      thisObject.animationController.addListener(naviDispacherFunc);
      thisObject.animationController.init(0.2);
      thisObject.animationController.start(null, true, language);
      thisObject.naviCore.indicator.setVisible(true);
    }, 10);
  };

  prototype.pause = function () {
    let thisObject = this;
    thisObject.isPause = true;
    thisObject.operatorController.pause();
    thisObject.animationController.setPause(true);
  };
  prototype.resume = function () {
    let thisObject = this;
    thisObject.isPause = false;
    thisObject.operatorController.resume();
    thisObject.animationController.setPause(false);
  };
  prototype.stop = function () {
    let thisObject = this;
    thisObject.operatorController.clear();
    thisObject.animationController.clearListeners();
    thisObject.animationController.stop();
    // thisObject.naviCore.indicator.setSimulate(false);

    let locationManager = thisObject.naviCore.locationManager;
    locationManager._stopMatchRoute();
    let locState = locationManager._getLocationState();
    if (locState == DaxiMap["LocationState"]["LOCATED"]) {
      let myPos = locationManager._getMyPositionInfo();
      thisObject.naviCore.indicator._setPositionOnly(myPos["position"][0], myPos["position"][1], myPos["bdid"], myPos["floorId"], myPos["direction"]);
    } else {
      thisObject.naviCore.indicator.setVisible(false);
    }
  };
  prototype.setSpeedScale = function (speed) {
    thisObject.operatorController.setSpeedScale(speed);
  };

  function onNavigationFinished() {
    //todo:通过事件方式发布，方便调用
    let spendsTime = ~~(thisObject.naviCore.route.total_length * 0.83); //Math.floor((new Date().getTime() - thisObject.startTime) / 1000);
    let minutes = Math.floor(spendsTime / 60);
    let seconds = spendsTime % 60;
    let msg = window["langData"]["taketime:navi"] || "用时",
      minutesUnit = window["langData"]["minute"] || "分钟",
      secUnit = window["langData"]["second"] || "秒 ",
      disUnit = window["langData"]["meter:distance"] || "米",
      disDesc = window["langData"]["distance"] || "距离 ";

    if (minutes > 0) {
      msg += minutes + minutesUnit;
    }
    msg += seconds + secUnit + disDesc + thisObject.routeDistance + disUnit;
    thisObject.stop();
    thisObject.naviCore.route.reset();
    thisObject.naviCore.onNavigationFinished(thisObject, { msg: msg });
  }

  prototype.parseRoute = function (route, language) {
    thisObject.operatorController.clear();
    let floorCount = route.floorObjects.length;
    floorCount > 0 ? (thisObject.routeDistance = Math.round(route.floorObjects[0].route.total_length)) : 0;
    for (let floorIndex = 0; floorIndex < floorCount; floorIndex++) {
      let floorObject = route.floorObjects[floorIndex];
      let operator = new FloorSegmentOperator(thisObject.naviCore, floorObject, language);
      thisObject.operatorController.add(operator);

      if (floorIndex !== floorCount - 1) {
        let operator = new FloorChangeOperator(thisObject.naviCore, floorObject.stations[floorObject.stations.length - 1], language);
        thisObject.operatorController.add(operator);
      } else {
        let operator = new FloorEndOperator(thisObject.naviCore, floorObject.stations[floorObject.stations.length - 1], language);
        thisObject.operatorController.add(operator);
      }
    }
  };
};
RawRouteSimulator.prototype = Object.create(LocationSimulator.prototype);
RawRouteSimulator.prototype.constructor = RawRouteSimulator;

//////////////////////////////////////////////////////////
// RawRouteController
//////////////////////////////////////////////////////////
let RawRouteController = function (language) {
  let disMaxReNavi = 20;
  let AOAdisMaxReNavi = 20;
  let timesMaxReNavi = 15000;
  let AOAtimesMaxReNavi = 15000;
  let timesMaxWrongWay = 14000;
  let thisObject = this;
  thisObject.language = language;
  thisObject.naviCore = null;
  thisObject.isPause = false;
  thisObject.startTime = null;
  thisObject.routeDistance = 0;
  thisObject.commandQueue = [];
  thisObject.RenavigationTrigger = null;
  // jing
  thisObject.invalidAccuracy = 100;
  // 用于保存初始化值
  thisObject.disMaxReNaviDef = 20;
  thisObject.AOAdisMaxReNaviDef = 20;
  thisObject.timesMaxReNaviDef = timesMaxReNavi;
  thisObject.AOAtimesMaxReNaviDef = AOAtimesMaxReNavi;
  thisObject.timesMaxWrongWayDef = timesMaxWrongWay;

  let navi_utils = daximap["DXMapUtils"]["naviMath"];
  let prototype = RawRouteController.prototype;
  prototype.init = function (core) {
    disMaxReNavi = core.restartRoute;
    AOAdisMaxReNavi = core.AOArestartRoute || disMaxReNavi;
    timesMaxReNavi = core.timesMaxReNavi;
    AOAtimesMaxReNavi = core.AOAtimesMaxReNavi || timesMaxReNavi;
    timesMaxWrongWay = core.timesMaxWrongWay;
    // 用于保存初始化值
    thisObject.disMaxReNaviDef = disMaxReNavi;
    thisObject.AOAdisMaxReNaviDef = AOAdisMaxReNavi;
    thisObject.timesMaxReNaviDef = timesMaxReNavi;
    thisObject.AOAtimesMaxReNaviDef = AOAtimesMaxReNavi;
    thisObject.timesMaxWrongWayDef = timesMaxWrongWay;

    thisObject.naviCore = core;
    thisObject.RenavigationTrigger = RenavigationConditionTrigger();
    thisObject.WrongwayTrigger = WrongWayConditionTrigger();
  };

  prototype.setPause = function (pVal) {
    let thisObject = this;
    thisObject.isPause = pVal;
  };
  prototype.getPause = function () {
    return thisObject.isPause;
  };

  prototype.pause = function () {
    let thisObject = this;
    thisObject.isPause = true;
  };

  prototype.resume = function () {
    let thisObject = this;
    thisObject.isPause = false;
  };

  prototype.parseRoute = function () {};

  prototype.start = function (callback) {
    let thisObject = this;
    thisObject.startTime = new Date().getTime();
    thisObject.RenavigationTrigger.reset();
    if (callback === undefined) callback = watchCB;
    let route = thisObject.naviCore.route;
    if (route) {
      thisObject.routeDistance = parseInt(route.total_length);
    } else {
      thisObject.routeDistance = 0;
    }

    thisObject.naviCore.locationManager._on("onLocationChanged", callback);
    // let loc = thisObject.naviCore.locationManager._getMyPositionInfo();
    // callback(null,loc);
  };

  prototype.setType = function (pVal) {
    let thisObject = this;
    thisObject.simulateType = pVal;
  };

  /**
   * Stop Navigate
   */
  prototype.stop = function () {
    let thisObject = this;
    clearFloorAmTimer();
    thisObject.naviCore.locationManager._off("onLocationChanged", watchCB);
    let locationManager = thisObject.naviCore.locationManager;
    locationManager._stopMatchRoute();
    // thisObject.naviCore.locationManager.locationManager.removeWatchLocationEvent(watchCB);
  };

  //定位监视
  let watchCB = function (sender, e) {
    //isIndoorAreaGPS
    if (e["bdid"] && e["floorId"]) {
      thisObject.navigateCB(e);
    } else {
      //室外处理
    }
  };

  let lastBleUpdateTimeStamp = 0;
  prototype.navigateCB = function (e) {
    let thisObject = this;
    let offsetPos = [0, 0];
    let pose = { pos: [], headingTilt: [], floor: 0, real_pos: [], target_pos: [] };
    pose.pos[0] = e["position"][0] + offsetPos[0];
    pose.pos[1] = e["position"][1] + offsetPos[1];
    pose.pos[2] = e["floorNum"];
    pose.floorId = e["floorId"];
    pose.pathDir = e["pathDir"];
    pose.heading = e["direction"];
    pose.accuracy = e["r"];
    pose.receiveTime = e["receiveTime"];
    pose.timeStamp = e["timeStamp"];
    pose.real_pos = e["real_pos"];
    pose.locType = e["locType"];
    pose.bdid = e["bdid"];

    if (thisObject.naviCore.isDebug === 1 && e["target_pos"]) {
      pose.target_pos[0] = e["target_pos"]["x"];
      pose.target_pos[1] = e["target_pos"]["y"];
      pose.target_pos[2] = 0;
    }
    let floorInfo = thisObject.naviCore.mapAPI._getFloorInfo(e["bdid"], pose.floorId);

    if (thisObject.naviCore.getIsSimulate()) {
      let loc = {
        floorCnName: floorInfo ? floorInfo["floorCnName"] : "",
        floorName: floorInfo ? floorInfo["floorName"] : "",
        floorNum: e["floorNum"],
        floorId: pose.floorId,
        position: e["position"],
        direction: e["direction"],
      };
      thisObject.naviCore.locationManager.locationManager.set(loc);
    }

    let mapStatus = thisObject.naviCore.getNaviStatus();

    if (mapStatus === STATE_NAVIGATE || mapStatus === STATE_NAVIGATE_PAUSE) {
      // || mapStatus === STATE_NAVIGATE_END
      thisObject.onChangePositionInNavi(pose, thisObject.naviCore.getNaviStatus(), thisObject.language, e["duration"]);
    } else {
      thisObject.onChangePositionInFree(pose, thisObject.naviCore.getNaviStatus(), thisObject.language, e["duration"]);
    }
  };

  let tempDistance = 0,
    tempDistanceI = 0,
    stageTotalDis = 0;

  function onNavigationFinished() {
    //todo:通过事件方式发布，方便调用
    let spendsTime = Math.floor((new Date().getTime() - thisObject.startTime) / 1000);
    let minutes = Math.floor(spendsTime / 60);
    let seconds = spendsTime % 60;
    let msg = window["langData"]["taketime:navi"] || "用时",
      minutesUnit = window["langData"]["minute"] || "分钟",
      secUnit = window["langData"]["second"] || "秒 ",
      disUnit = window["langData"]["meter:distance"] || "米",
      disDesc = window["langData"]["distance"] || "距离 ";
    if (minutes > 0) {
      msg += minutes + minutesUnit;
    }
    msg += seconds + secUnit + disDesc + thisObject.routeDistance + disUnit;
    thisObject.stop();
    thisObject.naviCore.onNavigationFinished(thisObject, { msg: msg });
    thisObject.cleanVirtualLine();
  }

  let RenavigationConditionTrigger = function () {
    let obj = {};
    obj.lastTimeInMilli = new Date().getTime();
    obj.outLineCount = 0;
    obj.CheckIsNeedReNavigation = function (args, distance) {
      if (args.pose["locType"] == "AOA") {
        timesMaxReNavi = AOAtimesMaxReNavi;
      }
      //if(distance <= 10 ) return false;
      let timestamp = new Date().getTime();
      let diff = timestamp - obj.lastTimeInMilli;
      //lastTimeInMilli = timestamp;
      if (diff > timesMaxReNavi && obj.outLineCount > timesMaxReNavi / 1000) {
        //10   && obj.outLineCount > timesMaxReNavi/1000
        obj.outLineCount = 0;
        obj.lastTimeInMilli = timestamp;
        return true;
      }
      obj.outLineCount += 1;
      //obj.console.log(obj.outLineCount + "," + diff);
      return false;
    };
    obj.reset = function () {
      obj.lastTimeInMilli = new Date().getTime();
      obj.outLineCount = 0;
    };
    return obj;
  };

  let WrongWayConditionTrigger = function () {
    let obj = {};
    obj.lastTimeInMilli = new Date().getTime();
    obj.outLineCount = 0;
    obj.CheckIsNeed = function (args, distance) {
      //if(distance <= 10 ) return false;
      let timestamp = new Date().getTime();
      let diff = timestamp - obj.lastTimeInMilli;
      //lastTimeInMilli = timestamp;
      if (diff > timesMaxWrongWay && obj.outLineCount > 5) {
        obj.outLineCount = 0;
        obj.lastTimeInMilli = timestamp;
        return true;
      }
      obj.outLineCount += 1;
      return false;
    };
    obj.reset = function () {
      obj.lastTimeInMilli = new Date().getTime();
      obj.outLineCount = 0;
    };
    return obj;
  };

  function Fire_onIndicator_OutOfTheRoute(args) {
    let result = args.result;
    let reNavigationText = window["langData"]["torequest:route:deviate:tip"] || "您已偏离导航,正在为您重新规划路线";
    if (language == "En") {
      reNavigationText = "navigating for you!";
    }
    try {
      thisObject.stop();
      thisObject.naviCore.Fire_onRenavigation();
      thisObject.RenavigationTrigger.reset();
      thisObject.naviCore.locationManager._stopMatchRoute(args.pose);
    } catch (e) {
      alert("Fire_onIndicator_OutOfTheRoute: exp" + e.toString());
    }
  }

  function Fire_onIndicator_ChangeFloors(args, interval, language) {
    let result = args.result;
    interval = interval || 1000;

    //    真实导航过程显示换层动画
    if (result.floor && result.nextFloor) {
      let startFloorId = result.floor;
      let endFloorId = result.nextFloor;
      if (startFloorId != endFloorId) {
        //let thisObject = this;
        let start = navi_utils.getRealFloorNumbyFloorId(startFloorId);
        let end = navi_utils.getRealFloorNumbyFloorId(endFloorId);

        let curr = start;
        let way = RouteParseHelper.getTargetNameByIconName(iconName, language);
        let type = RouteParseHelper.getTypeByIconName(iconName, language);
        let dir = RouteParseHelper.getDirByIconName(iconName, language);
        let changeFloorData = thisObject.changeFloorData;
        if (changeFloorData["startFloor"] == startFloorId && changeFloorData["endFloor"] == endFloorId && dir == changeFloorData["direction"]) {
          return;
        } else {
          // thisObject.naviCore.events.EventShowFloorChanger
          changeFloorData = thisObject.changeFloorData = {
            startFloor: startFloorId,
            endFloor: endFloorId,
            type: type,
            direction: dir,
            startFloorNum: start,
            endFloorNum: end,
            currFloor: startFloor,
          };
          thisObject.naviCore.floorChangerShow(true);
          thisObject.naviCore.setFloorChangeData(changeFloorData);
          let temp = null;
          let showFloorAm = function (num) {
            if (curr == end) {
              temp = dir + "_out";
            } else {
              temp = dir;
            }
            if (dir.indexOf("undefined") == -1) {
              thisObject.naviCore.setFloorChangeData({ currFloor: num, type: type, direction: temp });
            }
            if (dir === "up") {
              if (curr >= end) {
                window.clearTimeout(thisObject.showFloorAmTimer);
                thisObject.showFloorAmTimer = window.setTimeout(function () {
                  window.clearTimeout(thisObject.showFloorAmTimer);
                  thisObject.naviCore.floorChangerShow(false);
                }, interval);
                return;
              }
              curr++;
            } else if (dir === "down") {
              if (curr <= end) {
                window.clearTimeout(thisObject.showFloorAmTimer);
                timer = window.setTimeout(function () {
                  window.clearTimeout(thisObject.showFloorAmTimer);
                  thisObject.naviCore.floorChangerShow(false);
                }, interval);

                return;
              }
              curr--;
            } else {
              console.log("调试数据：" + dir);
            }
            thisObject.showFloorAmTimer = window.setTimeout(function () {
              showFloorAm(curr);
            }, interval);
          };
          showFloorAm(curr);
        }
      }
    } else if (thisObject.naviCore.isStairsShow()) {
      thisObject.naviCore.floorChangerShow(false);
      window["clearTimeout"](thisObject.showFloorAmTimer);
      thisObject.changeFloorData = null;
    }
  }

  function clearFloorAmTimer() {
    thisObject.naviCore.floorChangerShow(false);
    window["clearTimeout"](thisObject.showFloorAmTimer);
    thisObject.changeFloorData = null;
  }

  function Fire_onIndicator_ShowCrossImage(args) {
    let result = args.result;

    if (result.roadResult !== undefined) {
      result.roadResult["bdid"] = args.route.bdid;
      thisObject.naviCore.showCrossRoad(result.roadResult);
      //console.log("显示路口放大图"+JSON.stringify(result.roadResult));
    } else {
      thisObject.naviCore.showCrossRoad(false);
      //console.log("不显示路口放大图");
    }
  }
  function getMsg(tempDistance, curStation) {
    let updateReg = /方(\S*)米/;
    if (curStation.speakText) {
      let substr = curStation.speakText.match(updateReg);
      if (substr != null) {
        substr = curStation.speakText.replace(substr[1], tempDistance);
      }

      if (substr && substr.indexOf(". ") != -1) {
        substr = substr.slice(substr.indexOf(". ") + 2);
      }
      return substr || "";
    }
    return "";
  }
  function speakChangeFloor(route, speakListener, tempDistance, curStation, nextStation) {
    let msg = getMsg(tempDistance, curStation);
    msg = msg ? msg + (window["langData"]["after"] || "然后 ") : "";
    msg += speakListener.getSpeakText(route.currentCursor + 1);
    if (nextStation.speaked) {
      return;
    }
    speakListener.speakNow(msg, null, null);
    nextStation.speaked = true;
  }
  function Fire_onIndicator_UpdateInfo(args, data, language) {
    let result = args.result;
    let route = args.route;
    let naviCore = thisObject.naviCore;
    let speakListener = naviCore.speakListener;
    if (result.index == -1) {
      return;
    }
    // let grayRoutePoints = args.result.grayRoutePoints;
    //grayRoutePoints
    // if(grayRoutePoints.length){
    let grayT = args.result.walkedRouteRatio;
    data["grayT"] = grayT;
    data["floorId"] = result.floor;
    let stations = route.stations;
    let curStation = stations[route.currentCursor];
    let nextStation;
    // if(curStation.speaked){
    //     return;
    // }
    if (stations.length > route.currentCursor + 1 && stations[route.currentCursor + 1].type == 3) {
      nextStation = stations[route.currentCursor + 1];
    }
    if (naviCore.naviSpeakType && naviCore.naviSpeakType == 2) {
      //导航到路线拐角前播报
      if (route.currentCursor < result.index) {
        route.currentCursor = result.index;
        stageTotalDis = Math.ceil(result.targetDistance);
        if (naviCore.naviOnCrossingSpeak) {
          //在拐点时语音提示
          route.updateInfo(Math.floor(result.targetDistance || 0), result.station, data.stationIndex > 2 ? STAGECHANGING_SPEAK : BEFORE_STAGECHANGE_SPEAK);
        }
        data["speakType"] = data.stationIndex >= 2 ? STAGECHANGING_SPEAK : BEFORE_STAGECHANGE_SPEAK;
        naviCore.updateNaviProgressInfo(data);
      } else if (route.currentCursor == result.index) {
        tempDistance = Math.ceil(result.targetDistance);
        //naviCore.naviTipInfo.updateDistance(result.targetDistance);
        // naviPositionChanged
        //距离较长时语音重复播报
        let stations = route.stations;
        let curStation = stations[route.currentCursor];
        let speakText = curStation.speakText;
        if (curStation.type == 3 && tempDistance < 8 && stations.length > route.currentCursor + 1) {
          let nextStation = stations[route.currentCursor + 1];
          data["angelText"] = nextStation.speakText;
          if (speakListener) {
            speakListener.speakNext(route.currentCursor + 1);
          } else {
            data["stationSpeakText"] = speakText;
          }
        } else {
          let speakDistanceParam = naviCore.speakDistanceParam;
          if (speakDistanceParam) {
            let totalDisArray = speakDistanceParam["totalDisArray"];
            let speakDisArray = speakDistanceParam["speakDisArray"];

            for (let i = 0; i < totalDisArray.length; i++) {
              if (stageTotalDis >= totalDisArray[i] && tempDistance <= speakDisArray[i]) {
                let msg = "";
                if (stageTotalDis >= 50 && tempDistance > 30) {
                  if (language == "En") {
                    msg = "Go Straight ahead";
                  } else {
                    msg = window["langData"]["nodis:zhixing:speak:navi"] || "请沿路线指示前行";
                  }
                } else {
                  if (speakListener) {
                    msg = speakListener.updateMsg(tempDistance, naviCore.minSpeakDistance);
                  } else {
                    msg = getMsg(tempDistance, curStation);
                  }
                }
                if (i === totalDisArray.length - 1) {
                  if (stageTotalDis > 0 && tempDistance <= speakDisArray[i]) {
                    if (speakListener) {
                      msg = speakListener.updateMsgFinal();
                    } else {
                      let substr = thisObject.textQueue[thisObject.cursor].match(thisObject.updateReg);
                      if (substr != null) {
                        substr = thisObject.textQueue[thisObject.cursor].replace(substr[1], "");
                        msg = substr;
                      }
                    }
                  }
                  stageTotalDis = 0;
                } else {
                  stageTotalDis = speakDisArray[i];
                }
                speakListener && speakListener.speakNow(msg, null, null);
                break;
              }
            }
            if (nextStation && tempDistance + nextStation.distance < naviCore.changeFloorTipDis && !nextStation.speaked) {
              speakChangeFloor(route, speakListener, tempDistance, curStation, nextStation);
            }
          } else {
            if (stageTotalDis >= 32 && tempDistance <= 16) {
              if (speakListener) {
                let msg = speakListener.updateMsg(tempDistance, naviCore.minSpeakDistance);
                speakListener.speakNow(msg, null, null);
              } else {
                msg = getMsg(tempDistance, curStation);
              }
              stageTotalDis = 0;
            } else if (nextStation && tempDistance + nextStation.distance < naviCore.changeFloorTipDis && !nextStation.speaked) {
              speakChangeFloor(route, speakListener, tempDistance, curStation, nextStation);
              // let msg = getMsg(tempDistance,curStation);
              // msg = msg ? msg +(window["langData"]["after"]|| "然后 "):'';
              // msg += speakListener.getSpeakText(route.currentCursor+1);
              // speakListener.speakNow(msg,null,null);
              // nextStation.speaked = true;
            }
            if (curStation.type != 8 && stageTotalDis > naviCore.naviSpeakBeforDistance && tempDistance <= naviCore.naviSpeakBeforDistance) {
              //最后一条路不提示,小于5米时
              stageTotalDis = 0;
              if (naviCore.naviOnCrossingSpeak && stageTotalDis <= naviCore.naviSpeakBeforDistance) {
                //在拐点时提示需要大于10米的路才提示
                return;
              }
              stageTotalDis = Math.ceil(result.targetDistance);
              route.updateInfo(Math.floor(result.targetDistance || 0), result.station, BEFORE_STAGECHANGE_SPEAK);
              data["speakType"] = BEFORE_STAGECHANGE_SPEAK;
              naviCore.updateNaviProgressInfo(data);
              if (curStation.speaked) {
                return;
              }
              speakListener.speakNow(result.station.speakText, null, null);
            }
          }
          data["stationSpeakText"] = msg;
        }
        data["speakType"] = BEFORE_STAGECHANGE_SPEAK;
        naviCore.updateNaviProgressInfo(data);
      }
    } else {
      if (route.currentCursor != result.index) {
        if (curStation.floor != result.floor && result.index > route.currentCursor && result.station.type != 5 && stations[result.index - 1].type == 5) {
          // speakText
          if (speakListener && !stations[result.index - 1].speaked) {
            speakListener.speakNow(
              stations[result.index - 1].speakText.split(".")[0],
              function () {
                route.currentCursor = result.index;
                stageTotalDis = Math.ceil(result.targetDistance);
                route.updateInfo(Math.floor(result.targetDistance || 0), result.station);
                naviCore.updateNaviProgressInfo(data);
              },
              undefined,
              undefined,
              true
            );
          }
          stations[result.index - 1].speaked = true;
        } else {
          route.currentCursor = result.index;
          stageTotalDis = Math.ceil(result.targetDistance);
          route.updateInfo(Math.floor(result.targetDistance || 0), result.station);
          naviCore.updateNaviProgressInfo(data);
        }
      } else {
        tempDistance = Math.ceil(result.targetDistance);
        //naviCore.naviTipInfo.updateDistance(result.targetDistance);
        // naviPositionChanged
        //距离较长时语音重复播报
        let stations = route.stations;
        let curStation = stations[route.currentCursor];
        let speakText = curStation.speakText;
        if (curStation.type == 3 && tempDistance < 8 && stations.length > route.currentCursor + 1) {
          let nextStation = stations[route.currentCursor + 1];
          data["angelText"] = nextStation.speakText;
          if (speakListener && !nextStation.speaked) {
            speakListener.speakNext(route.currentCursor + 1);
            nextStation.speaked = true;
          } else {
            data["stationSpeakText"] = speakText;
          }
        } else {
          let speakDistanceParam = naviCore.speakDistanceParam;
          if (speakDistanceParam) {
            let totalDisArray = speakDistanceParam["totalDisArray"];
            let speakDisArray = speakDistanceParam["speakDisArray"];

            for (let i = 0; i < totalDisArray.length; i++) {
              if (stageTotalDis >= totalDisArray[i] && tempDistance <= speakDisArray[i]) {
                let msg = "";
                if (stageTotalDis >= 50 && tempDistance > 30) {
                  if (language == "En") {
                    msg = "Go Straight ahead";
                  } else {
                    msg = window["langData"]["nodis:zhixing:speak:navi"] || "请沿路线指示前行";
                  }
                } else {
                  if (speakListener) {
                    msg = speakListener.updateMsg(tempDistance, naviCore.minSpeakDistance);
                  } else {
                    msg = getMsg(tempDistance, curStation);
                  }
                }
                if (i === totalDisArray.length - 1) {
                  if (stageTotalDis > 0 && tempDistance <= speakDisArray[i]) {
                    if (speakListener) {
                      msg = speakListener.updateMsgFinal();
                    } else {
                      let substr = thisObject.textQueue[thisObject.cursor].match(thisObject.updateReg);
                      if (substr != null) {
                        substr = thisObject.textQueue[thisObject.cursor].replace(substr[1], "");
                        msg = substr;
                      }
                    }
                  }
                  stageTotalDis = 0;
                } else {
                  stageTotalDis = speakDisArray[i];
                }
                speakListener && speakListener.speakNow(msg, null, null);
                break;
              }
            }
            if (nextStation && tempDistance + nextStation.distance < naviCore.changeFloorTipDis && !nextStation.speaked) {
              speakChangeFloor(route, speakListener, tempDistance, curStation, nextStation);
            }
          } else {
            if (stageTotalDis >= 32 && tempDistance <= 16) {
              if (speakListener) {
                let msg = speakListener.updateMsg(tempDistance, naviCore.minSpeakDistance);
                speakListener.speakNow(msg, null, null);
              } else {
                msg = getMsg(tempDistance, curStation);
              }
              stageTotalDis = 0;
            } else if (nextStation && tempDistance + nextStation.distance < naviCore.changeFloorTipDis && !nextStation.speaked) {
              speakChangeFloor(route, speakListener, tempDistance, curStation, nextStation);
              // let msg = getMsg(tempDistance,curStation);
              // msg = msg ? msg +(window["langData"]["after"]|| "然后 "):'';
              // msg += speakListener.getSpeakText(route.currentCursor+1);
              // speakListener.speakNow(msg,null,null);
              // nextStation.speaked = true;
            }
          }
          data["stationSpeakText"] = msg;
        }
        naviCore.updateNaviProgressInfo(data);
      }
    }
  }

  function Fire_OnIndicator_NaviEnd(args, lastDisData) {
    let result = args.result;
    let naviCore = thisObject.naviCore;
    let endDist = naviCore.endNaviDistance || endNaviDistance;
    let lastDistance = lastDisData["lastDistance"];
    if (lastDistance < 0) {
      return;
    }

    let restDistance = result.targetDistance;
    let naviEndType = naviCore.naviEndType;
    let lastStation = args.route.stations[args.route.stations.length - 1];
    if (lastStation.floor != result.floor) {
      return;
    }
    if (naviEndType == 1 && result.index === args.route.stations.length - 1) {
      if (thisObject.naviCore.getIsSimulate()) {
        if (restDistance <= 1) {
          onNavigationFinished();
        }
      } else if (restDistance < endDist) {
        onNavigationFinished();
      }
    } else if (naviEndType == 2) {
      //按照剩余距离判定是否播报导航结束
      if (thisObject.naviCore.getIsSimulate()) {
        if (lastDistance <= 1) {
          onNavigationFinished();
        }
      } else if (lastDistance <= endDist) {
        onNavigationFinished();
      }
    }
  }

  function getHeadingDiff(heading1, heading2) {
    let diff = heading1 - heading2;
    if (diff > 180) {
      // 355,1
      diff = heading2 + 360 - heading1;
    } else if (diff < -180) {
      //1,355
      diff == heading1 + 360 - heading2;
    } else {
      diff = Math.abs(diff);
    }
    return diff;
  }
  prototype.getCurrentFloorTarget = function () {
    let route = this.naviCore.route;
    let currentCursor = route.currentCursor;
    let stations = route.stations;
    for (let i = currentCursor, len = stations.length; i < len; i++) {
      if (stations[i]["type"] == 4) {
        let pos = stations[i].position;
        return { x: pos[0], y: pos[1] };
      }
      if (stations[i]["type"] == 8) {
        return stations[i].segment[stations[i].segment.length - 1];
      }
    }
  };
  prototype.updateVirtualLine = function (bdid, flid, startPos, currentTarget) {
    if (this.virtualLine) {
      if (this.virtualLine._floorId != flid) {
        this.virtualLine["removeFromMap"]();
        this.virtualLine = null;
      } else {
        this.virtualLine["updateData"]({
          linePoints: [
            [startPos["x"], startPos["y"]],
            [currentTarget.x, currentTarget.y],
          ],
        });
      }
    } else {
      this.virtualLine = this.naviCore.mapAPI["createPolyline"]({
        linePoints: [
          [startPos["x"], startPos["y"]],
          [currentTarget.x, currentTarget.y],
        ],
        lineColor: "#2F3130",
        lineWidth: 1,
        bdid: bdid,
        floorId: flid,
        dasharray: [3, 10],
      });
    }
  };
  prototype.cleanVirtualLine = function () {
    this.virtualLine && this.virtualLine["removeFromMap"]();
    this.virtualLine = null;
  };
  prototype.onChangePositionInNavi = function (pose, status, language, duration) {
    let thisObject = this;
    let curfloorId = pose.floorId;
    let indicator = thisObject.naviCore.indicator;
    let usingLineHeading = thisObject.naviCore.usingLineHeading;
    let duration = thisObject.naviCore.getIsSimulate() ? 0 : duration || 500;
    let headingView = pose.heading;
    if (usingLineHeading === false) {
      headingView = thisObject.naviCore.naviHeading || 0;
    }
    if (thisObject.indicator !== null) {
      // Set Indicator Position
      let lng = pose.pos[0];
      let lat = pose.pos[1];
      let realPt = pose.real_pos;
      let distanceMin = 0;
      // if(pose.pos[2]!=pose.real_pos["z"]){
      //    distanceMin = disMaxReNavi+1;
      // }
      distanceMin = Math.max(navi_utils.getGeodeticCircleDistanceVector(pose.pos, [realPt["x"], realPt["y"]]), distanceMin);
      // let distanceMin = navi_utils.getGeodeticCircleDistanceVector(pose.pos, realPt);
      let args = { route: thisObject.naviCore.route, result: null, indicator: thisObject.indicator, pose: pose };
      args.result = { minDistance: 999999, targetDistance: 0, index: -1 };
      let heading = pose.heading;
      if (args.route.getNearestStation(pose, args.result)) {
        //如果定位中抓取点成功
        //let nearPt = [args.result.nearestPt.x, args.result.nearestPt.y];
        // 距终点信息
        if (args.result.station.extendType == 1 && args.result.minDistance == 0) {
          distanceMin = 0;
        }
        let lng = pose.pos[0],
          lat = pose.pos[1];
        let data = args.route.getLastDistance(args.result.targetDistance, args.result);

        let headingView = pose.heading;
        let headingDiff = getHeadingDiff(headingView, args.result.heading);
        if (headingDiff < 45) {
          headingView = args.result.heading;
        }

        let headingRoute = args.result.heading;
        if (usingLineHeading) {
          headingView = headingRoute;
          pose.heading = headingRoute;
        }
        /* if (usingLineHeading === false) {
                    // headingView = headingRoute;
                    headingView = 0;

                }*/
        // 大于无效值后
        if (pose.accuracy > thisObject.invalidAccuracy) {
          disMaxReNavi = pose.accuracy;
          thisObject.RenavigationTrigger.reset();
        } else {
          disMaxReNavi = thisObject.disMaxReNaviDef;
          if (pose["locType"] == "AOA") {
            disMaxReNavi = thisObject.AOAdisMaxReNaviDef;
          }
        }
        let toLineMinDis = args.result.minDistance;
        args.result.currentTarget = thisObject.getCurrentFloorTarget();
        let flid = args.result.floor;
        if (distanceMin <= disMaxReNavi && toLineMinDis <= disMaxReNavi) {
          if (args.result.nearestPt) {
            lng = args.result.nearestPt.x;
            lat = args.result.nearestPt.y;
          }
          indicator.setPositionSmooth(lng, lat, flid, pose.heading, headingView, realPt, duration, true, pose);
          //thisObject.updateVirtualLine(pose.bdid,flid,{"x":lng,"y":lat},args.result.currentTarget);
          thisObject.RenavigationTrigger.reset();
          // thisObject.WrongwayTrigger.reset();
          // } else if (distanceMin > disMaxReNavi) {
        } else if (distanceMin > disMaxReNavi || toLineMinDis >= disMaxReNavi) {
          if (pose["locType"] == "AOA") {
            disMaxReNavi = thisObject.AOAdisMaxReNaviDef;
          }
          if (thisObject.RenavigationTrigger.CheckIsNeedReNavigation(args)) {
            // indicator.setPositionSmooth(realPt["x"], realPt["y"], curfloorId, pose.heading, pose.pos);
            indicator._setPositionOnly(realPt["x"], realPt["y"], pose.bdid, curfloorId, pose.heading);
            //thisObject.updateVirtualLine(pose.bdid,curfloorId,realPt,args.result.currentTarget);
            return Fire_onIndicator_OutOfTheRoute(args);
          }
          //thisObject.updateVirtualLine(pose.bdid,flid,{"x":lng,"y":lat},args.result.currentTarget);
          indicator.setPositionSmooth(lng, lat, flid, pose.heading, headingView, realPt, duration, true, pose);
          // 偏离重新规划路线之前的点位切换忽略
          // else {
          //     //indicator.setPositionSmooth(realPt[0], realPt[1], curfloorId, pose.heading, pose.pos);
          //     indicator.setPositionSmooth(lng, lat, curfloorId, pose.heading, headingView,  realPt, duration,true);
          // }
        } else {
          //正常范围内点位重置重新规划条件
          //thisObject.updateVirtualLine(pose.bdid,curfloorId,realPt,args.result.currentTarget);
          indicator.setPositionSmooth(realPt["x"], realPt["y"], curfloorId, pose.heading, headingView, pose.pos, duration, true);
          thisObject.RenavigationTrigger.reset();
        }
        if (
          pose.beaconGroupId &&
          pose.beaconGroupId !== 0 &&
          pose.beaconGroupId !== thisObject.naviCore.locationManager.locationManager._getCurrentBeaconGroupId()
        ) {
          indicator._setPositionOnly(realPt["x"], realPt["y"], pose.bdid, curfloorId, pose.heading);
          Fire_onIndicator_OutOfTheRoute(args);
        }

        Fire_onIndicator_ChangeFloors(args, 1000, language);
        Fire_onIndicator_ShowCrossImage(args);
        Fire_onIndicator_UpdateInfo(args, data);
        Fire_OnIndicator_NaviEnd(args, data);
      } else {
        if (usingLineHeading === false) {
          // headingView = headingRoute;
          headingView = 0;
        }
        // 没有匹配到station 偏离路线
        if (thisObject.RenavigationTrigger.CheckIsNeedReNavigation(args)) {
          // indicator.setPositionSmooth(realPt["x"], realPt["y"], curfloorId, pose.heading, pose.pos);
          indicator._setPositionOnly(realPt["x"], realPt["y"], pose.bdid, curfloorId, pose.heading);
          thisObject.cleanVirtualLine();
          return Fire_onIndicator_OutOfTheRoute(args);
        }
      }
    }
  };

  prototype.onChangePositionInFree = function (pose, status) {
    let thisObject = this;
    let indicator = thisObject.naviCore.indicator;
    if (indicator === null) return;
    // Set Indicator Position
    let lng = pose.pos[0];
    let lat = pose.pos[1];
    let curfloorId = pose.floorId;
    indicator.setPositionSmooth(lng, lat, curfloorId, pose.heading, undefined, pose.real_pos, 0);
  };
};

// ES6 模块导出
export {
  STATE_NAVIGATE,
  STATE_FULLVIEW,
  STATE_SHOWPOI,
  STATE_NAVIGATE_END,
  STATE_NAVIGATE_PAUSE,
  STATE_SHOWROUTE,
  BEFORE_STAGECHANGE_SPEAK,
  STAGECHANGING_SPEAK,
  DXRouteCircelSampler,
  ResamplerArray,
  SmoothPositionSampler,
  SmoothViewPositionSampler,
  SmoothPositionRootSampler,
  TimeConditionTrigger,
  STATION_TYPE_HEAD,
  STATION_TYPE_START,
  STATION_TYPE_SEGMENT,
  STATION_TYPE_SEGMENT_END,
  STATION_TYPE_CHANGE_FLOOR,
  STATION_TYPE_CHANGE_FLOOR_END,
  STATION_TYPE_END,
  STATION_TYPE_ACTION_TO_TARGET,
  STATION_TYPE_ACTION,
  RawRoute,
  RawRouteParser,
  RouteParseHelper,
  NavigationOperatorExcutant,
  NavigationOperator,
  FloorSegmentOperator,
  FloorChangeOperator,
  FloorChangeEndOperator,
  FloorEndOperator,
  LocationSimulator,
  RawRouteSimulator,
  RawRouteController
};
