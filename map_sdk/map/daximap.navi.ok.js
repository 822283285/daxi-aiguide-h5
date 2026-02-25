/**
 * Created by jiangge on 16/7/7.
 */
 var STATE_NAVIGATE = 0, //导航模式
 STATE_FULLVIEW = 1, //全览模式
 // STATE_SHOWPOI = 2, //看地图POI
 STATE_NAVIGATE_END = 3, //导航结束
 STATE_NAVIGATE_PAUSE = 4,
 STATE_SHOWROUTE = 5;
////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////

var daximap = window["DaxiMap"] || {};
var DXRouteCircelSampler = function() {
    var SamplerUtils = {};
    SamplerUtils.resamplerJSON = function(t, e) {
        if (!t || !t.features) return t;
        if (d && e && t.features.length === d.features.length) {
            for (var n = o.default.point(e), a = d.features, i = [], r = 0, s = a.length; r < s; r++) {
                var u = a[r],
                    l = u.geometry.coordinates.slice(-1)[0];
                l = o.
                default.point(l);
                var f = (0, c.default)(n, l, u);
                f.properties = u.properties, f.geometry.coordinates.splice(-1), i.push(f)
            }
            return o.
            default.featureCollection(i)
        }

        var h = [],
            p = [],
            A = t.features.length
        for (var m = 0; m < A; m++) {
            var y = t.features[m],
                b = y.geometry.coordinates,
                T = (b = g(b))[0],
                w = [T],
                S = b[1],
                O = b.length;
            for (var k = 1; k < O - 1; k++) {
                k > 1 && (T = w.slice(-1)[0]), S = b[k];
                var M = b[k + 1];
                var C = SamplerUtils.resamplerCorner(T, S, M);
                w = w.concat(C.geometry.coordinates)
            }
            w.push(b.slice(-1)[0]);
            h[m] = w;
            p[m] = y.properties;
        }

        var R = [],
            L = h.length
        for (var I = 0; I < L; I++) {
            var _ = SamplerUtils.createLineString(h[I]);
            _.properties = p[I],
                R[I] = _
        }
        var x = SamplerUtils.createfeatureCollection(R);
        d = x;
        return x;
    };

    SamplerUtils.resampler = function(t, e) {
        if (!t) return t;
        var h = [],
            A = 1;
        for (var m = 0; m < A; m++) {
            var b = t,
                T = (b = g(b))[0],
                w = [T],
                S = b[1],
                O = b.length;
            for (var k = 1; k < O - 1; k++) {
                k > 1 && (T = w.slice(-1)[0]), S = b[k];
                var M = b[k + 1];
                var C = SamplerUtils.resamplerCorner(T, S, M);
                w = w.concat(C.geometry.coordinates)
            }
            w.push(b.slice(-1)[0]);
            h[m] = w;
        }
        return h;
    };

    function g(t) {
        var e, n, a, o = [],
            i = t[0];
        o.push(i);
        var p = 7;
        for (var r = 1, u = t.length; r < u - 1; r++) {
            i = o[o.length - 1];
            var l = t[r],
                c = t[r + 1];
            (e = i, n = l, a = c, SamplerUtils.diffAngel(SamplerUtils.calcAngel(e, n), SamplerUtils.calcAngel(n, a))) > p && o.push(l)
        }
        return o.push(t[t.length - 1]), o
    }

    SamplerUtils.getCoord = function(e) {
        if (!e) throw new Error("coord is required");
        if (!Array.isArray(e)) {
            if ("Feature" === e.type && null !== e.geometry && "Point" === e.geometry.type) return e.geometry.coordinates;
            if ("Point" === e.type) return e.coordinates
        }
        if (Array.isArray(e) && e.length >= 2 && !Array.isArray(e[0]) && !Array.isArray(e[1])) return e;
        throw new Error("coord must be GeoJSON Point or an Array of numbers")
    };

    SamplerUtils.getCoord2 = function(e) {
        if (!e) throw new Error("obj is required");
        var t = r(e);
        if (t.length > 1 && "number" == typeof t[0] && "number" == typeof t[1]) return t;
        throw new Error("Coordinate is not a valid Point")
    }

    SamplerUtils.radiansToDegrees = function(e) {
        return 180 * (e % (2 * Math.PI)) / Math.PI
    }
    SamplerUtils.degreesToRadians = function(e) {
        return e % 360 * Math.PI / 180
    }

    SamplerUtils.params = { "miles": 3960, "nauticalmiles": 3441.145, "degrees": 57.2957795, "radians": 1, "inches": 250905600, "yards": 6969600, "meters": 6373000, "metres": 6373000, "centimeters": 637300000, "centimetres": 637300000, "kilometers": 6373, "kilometres": 6373, "feet": 20908792.65 }
    SamplerUtils.radiansToDistance = function(e, t) {
        if (void 0 === e || null === e) throw new Error("radians is required");
        var r = SamplerUtils.params[t || "kilometers"];
        if (!r) throw new Error("units is invalid");
        return e * r
    }

    SamplerUtils.distanceToRadians = function(e, t) {
        if (void 0 === e || null === e) throw new Error("distance is required");
        var r = SamplerUtils.params[t || "kilometers"];
        if (!r) throw new Error("units is invalid");
        return e / r
    }



    SamplerUtils.isValid = function(e) {
        return !isNaN(e) && null !== e && !Array.isArray(e)
    }


    SamplerUtils.toPoint = function(e, t, n, o) {
        if (!e) throw new Error("No coordinates passed");
        if (void 0 === e.length) throw new Error("Coordinates must be an array");
        if (e.length < 2) throw new Error("Coordinates must be at least 2 numbers long");
        if (!SamplerUtils.isValid(e[0]) || !SamplerUtils.isValid(e[1])) throw new Error("Coordinates must contain numbers");
        return SamplerUtils.toFeature({
            type: "Point",
            coordinates: e
        }, t, n, o)
    }

    SamplerUtils.createLineString = function(e, t, n, o) {
        if (!e) throw new Error("No coordinates passed");
        if (e.length < 2) throw new Error("Coordinates must be an array of two or more positions");
        if (!SamplerUtils.isValid(e[0][1]) || !SamplerUtils.isValid(e[0][1])) throw new Error("Coordinates must contain numbers");
        return SamplerUtils.toFeature({
            type: "LineString",
            coordinates: e
        }, t, n, o)
    }

    SamplerUtils.toFeature = function(e, t, r, n) {
        if (void 0 === e) throw new Error("geometry is required");
        if (t && t.constructor !== Object) throw new Error("properties must be an Object");
        if (r && 4 !== r.length) throw new Error("bbox must be an Array of 4 numbers");
        if (n && -1 === ["string", "number"].indexOf(typeof n)) throw new Error("id must be a number or a string");
        var o = {
            type: "Feature"
        };
        return n && (o.id = n), r && (o.bbox = r), o.properties = t || {}, o.geometry = e, o
    }

    SamplerUtils.getFirstCoordReverse = function(e) {
        if (e.length > 1 && "number" == typeof e[0] && "number" == typeof e[1]) return !0;
        if (Array.isArray(e[0]) && e[0].length) return SamplerUtils.getFirstCoordReverse(e[0]);
        throw new Error("coordinates must only contain numbers")
    }
    SamplerUtils.getCoordFromFeature = function(e) {
            if (!e) throw new Error("obj is required");
            var t;
            if (e.length ? t = e : e.coordinates ? t = e.coordinates : e.geometry && e.geometry.coordinates && (t = e.geometry.coordinates), t) return SamplerUtils.getFirstCoordReverse(t), t;
            throw new Error("No valid coordinates")
        }
        // var d, h = .002,p = 7;
    SamplerUtils.calcAngel = function(e, t, r) {
        if (void 0 === r && (r = {}), !0 === r.final) return function(e, t) {
            var r = i(t, e);
            return r = (r + 180) % 360
        }(e, t);


        var a = SamplerUtils.getCoord(e),
            s = SamplerUtils.getCoord(t),
            u = SamplerUtils.degreesToRadians(a[0]),
            c = SamplerUtils.degreesToRadians(s[0]),
            f = SamplerUtils.degreesToRadians(a[1]),
            l = SamplerUtils.degreesToRadians(s[1]),
            d = Math.sin(c - u) * Math.cos(l),
            h = Math.cos(f) * Math.sin(l) - Math.sin(f) * Math.cos(l) * Math.cos(c - u);
        return SamplerUtils.radiansToDegrees(Math.atan2(d, h))
    }

    SamplerUtils.diffAngel = function(t, e) {
        var n = Math.abs(t - e);
        return n > 180 ? 360 - n : n
    }

    SamplerUtils.addAngel = function(t, e) {
        var n = t + e;
        return n > 180 ? n -= 360 : n < -180 && (n += 360), n
    }




    // var n = r(20).getCoord,
    //          o = r(7).radiansToDistance;
    SamplerUtils.geographicsToLocal = function(e, t, r) {
        var i = Math.PI / 180,
            a = SamplerUtils.getCoord(e),
            s = SamplerUtils.getCoord(t),
            u = i * (s[1] - a[1]),
            c = i * (s[0] - a[0]),
            f = i * a[1],
            l = i * s[1],
            d = Math.pow(Math.sin(u / 2), 2) + Math.pow(Math.sin(c / 2), 2) * Math.cos(f) * Math.cos(l);
        return SamplerUtils.radiansToDistance(2 * Math.atan2(Math.sqrt(d), Math.sqrt(1 - d)), r)
    }

    // var n = r(20).getCoord,
    //          o = r(7),
    //          i = o.point,
    //          a = o.distanceToRadians;
    SamplerUtils.localToGeographics = function(e, t, r, o) {
        var s = Math.PI / 180,
            u = 180 / Math.PI,
            c = SamplerUtils.getCoord(e),
            f = s * c[0],
            l = s * c[1],
            d = s * r,
            h = SamplerUtils.distanceToRadians(t, o),
            p = Math.asin(Math.sin(l) * Math.cos(h) + Math.cos(l) * Math.sin(h) * Math.cos(d)),
            v = f + Math.atan2(Math.sin(d) * Math.sin(h) * Math.cos(l), Math.cos(h) - Math.sin(l) * Math.sin(p));
        return SamplerUtils.toPoint([u * v, u * p])
    }


    SamplerUtils.createfeatureCollection = function(e, t, r) {
        if (!e) throw new Error("No features passed");
        if (!Array.isArray(e)) throw new Error("features must be an Array");
        if (t && 4 !== t.length) throw new Error("bbox must be an Array of 4 numbers");
        if (r && -1 === ["string", "number"].indexOf(typeof r)) throw new Error("id must be a number or a string");
        var n = {
            type: "FeatureCollection"
        };
        return r && (n.id = r), t && (n.bbox = t), n.features = e, n
    }

    SamplerUtils.l = function(e, t) {
        var r = SamplerUtils.getCoordFromFeature(e),
            n = SamplerUtils.getCoordFromFeature(t);
        if (2 !== r.length) throw new Error("<intersects> line1 must only contain 2 coordinates");
        if (2 !== n.length) throw new Error("<intersects> line2 must only contain 2 coordinates");
        var o = r[0][0],
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
        var m = v / p,
            g = y / p;
        return m >= 0 && m <= 1 && g >= 0 && g <= 1 ? SamplerUtils.toPoint([o + m * (s - o), i + m * (c - i)]) : null
    }

    SamplerUtils.e = function(e, t) {
        var r = {},
            n = [];
        if ("LineString" === e.type && (e = SamplerUtils.toFeature(e)), "LineString" === t.type && (t = SamplerUtils.toFeature(t)), "Feature" === e.type && "Feature" === t.type && "LineString" === e.geometry.type && "LineString" === t.geometry.type && 2 === e.geometry.coordinates.length && 2 === t.geometry.coordinates.length) {
            var u = SamplerUtils.l(e, t);
            return u && n.push(u), SamplerUtils.createfeatureCollection(n)
        }
        // var d = o();
        // return d.load(s(t)), c(s(e), function(e) {
        //  c(d.search(e), function(t) {
        //      var o = l(e, t);
        //      if (o) {
        //          var i = a(o).join(",");
        //          r[i] || (r[i] = !0, n.push(o))
        //      }
        //  })
        // }), f(n)
    }

    SamplerUtils.normalizeAngel = function(t) {
        return t < 0 && (t += 360), t
    }
    SamplerUtils.normalizeAngel2 = function(e) {
        var t = e % 360;
        return t < 0 && (t += 360), t
    }


    // var n = r(50),
    //  o = r(7).polygon;
    var xxx = function(e, t, r, i, a) {
        if (!e) throw new Error("center is required");
        if (!t) throw new Error("radius is required");
        r = r || 64, a = a || e.properties || {};
        for (var s = [], u = 0; u < r; u++) s.push(SamplerUtils.localToGeographics(e, t, 360 * u / r, i).geometry.coordinates);
        return s.push(s[0]), o([s], a)
    }




    SamplerUtils.Interpolation = function(e, t, r, s, u, c) {
        if (!e) throw new Error("center is required");
        if (void 0 === r || null === r) throw new Error("bearing1 is required");
        if (void 0 === s || null === s) throw new Error("bearing2 is required");
        if (!t) throw new Error("radius is required");
        u = u || 64;
        var f = SamplerUtils.normalizeAngel2(r),
            l = SamplerUtils.normalizeAngel2(s),
            d = e.properties;
        if (f === l) return SamplerUtils.createLineString(xxx(e, t, u, c).geometry.coordinates[0], d);
        for (var h = f, p = f < l ? l : l + 360, v = h, y = [], m = 0; v < p;) y.push(SamplerUtils.localToGeographics(e, t, v, c).geometry.coordinates), v = h + 360 * ++m / u;
        return v > p && y.push(SamplerUtils.localToGeographics(e, t, p, c).geometry.coordinates), SamplerUtils.createLineString(y, d)
    }


    SamplerUtils.resamplerCorner = function(t, e, n) {
        var h = .002;
        var a = function(t, e, n) {
                var a = SamplerUtils.diffAngel(SamplerUtils.calcAngel(e, t), SamplerUtils.calcAngel(e, n)); //y((0, s.default)(e, t), (0, s.default)(e, n)),
                o = SamplerUtils.geographicsToLocal(t, e, "kilometres"),
                    i = SamplerUtils.geographicsToLocal(e, n, "kilometres") / 2,
                    r = h,
                    l = o;
                i < l && (l = i);
                var c = l * Math.tan(a / 360 * 3.14);
                c < r && (r = c);
                return r
            }(t, e, n),

            c = function(t, e, n, a) {
                var i = SamplerUtils.calcAngel(t, e),
                    u = SamplerUtils.calcAngel(e, n),
                    c = SamplerUtils.addAngel(i, 90);
                SamplerUtils.diffAngel(c, u) > 90 && (c = SamplerUtils.addAngel(c, 180));
                var f = SamplerUtils.addAngel(u, 90);
                SamplerUtils.diffAngel(f, SamplerUtils.addAngel(i, 180)) > 90 && (f = SamplerUtils.addAngel(f, 180));
                var d = SamplerUtils.localToGeographics(t, a, c, "kilometres"),
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
                    b2: SamplerUtils.addAngel(f, 180)
                }
            }(t, e, n, a);

        if (!c) return SamplerUtils.createLineString([t, e]);
        var f = function(t, e) {
                var n = SamplerUtils.normalizeAngel(t),
                    a = SamplerUtils.normalizeAngel(e),
                    o = !1;
                if (n > a && n - a < 180 || a - n > 180) {
                    var i = t;
                    t = e, e = i, o = !0
                }
                return {
                    b1: t,
                    b2: e,
                    changed: o
                }
            }(c.b1, c.b2),

            d = f.b1,
            p = f.b2,
            g = f.changed,
            v = SamplerUtils.Interpolation(c.point, a, d, p, 20, "kilometres");
        return g && v.geometry.coordinates.reverse(), v
    }

    return SamplerUtils;
};

/////////////////////////////////////////////////////////
// ResamplerArray
/////////////////////////////////////////////////////////
var ResamplerArray = function() {
    var navi_utils = daximap["DXMapUtils"]["naviMath"];
    var prototype = ResamplerArray.prototype;
    var info = this;
    info.array = [];
    info.maxCount = 30;
    prototype.push = function(vec) {
        if (info.array.length === 0) {
            for (var i = 0; i < info.maxCount; i++) {
                info.array.push([vec[0], vec[1], 0]);
            }
        } else {
            info.array.shift();
            info.array.push([vec[0], vec[1], 0]);
        }
    }
    prototype.getAverageValue = function() {
        var newRet = [0, 0, 0];
        for (var i = 0; i < info.array.length; i++) {
            newRet[0] += info.array[i][0];
            newRet[1] += info.array[i][1];
        }
        newRet[0] /= info.maxCount;
        newRet[1] /= info.maxCount;
        navi_utils.Vector3_normalize(newRet, newRet);
        return newRet;
    }
}

/////////////////////////////////////////////////////////
// SmoothPositionSampler
/////////////////////////////////////////////////////////
var SmoothPositionSampler = function(callback) {
    var navi_utils = daximap["DXMapUtils"]["naviMath"];
    var targetPose = [0, 0, 0];
    var targetHeading = 0;

    var targetObj = null;
    var info = this;
    info.headingRoute = 0.0;
    info.curPose = [0, 0, 0];
    info.curHeading = 0.0;
    info.floorId = "";
    info.resamplerArray = new ResamplerArray();
    var curT = 0.0;
    this.curT1 = 0.0;

    var isDirty = false;

    var prototype = SmoothPositionSampler.prototype;
    prototype.init = function(obj) {
        targetObj = obj;
    }

    prototype.setDirty = function(dirty) {
        isDirty = dirty;
    }
    var quatFrom = [0, 0, 0, 1];
    var quatTo = [0, 0, 0, 1];
    var quatCur = [0, 0, 0, 1];
    var vecEuler = [0, 0, 0];

    prototype.onRuning = function() {
        if (isDirty === false) return;
        curT += 0.1;
        if (curT > 1) {
            curT = 1.0;
        }
        var toPos = targetPose;
        var fromPos = info.curPose;
        var dir = [0, 0, 0];
        var temp = [0, 0, 0];
        var outPos = [0, 0, 0];
        navi_utils.Vector3_lerp(info.curPose, fromPos, toPos, curT);

        this.curT1 += 0.2;
        if (this.curT1 > 1) {
            this.curT1 = 1.0;
        }
        var dif = targetHeading - info.curHeading;

        if (dif < -180) dif = 360 + dif;
        if (dif > 180) dif = dif - 360;

        info.curHeading += this.curT1 * dif;
        if (info.curHeading < 0) info.curHeading = 360 + info.curHeading;
        if (info.curHeading > 360) info.curHeading = info.curHeading - 360;

        callback && callback()
        targetObj._setPositionOnly(info.curPose[0], info.curPose[1], info.bdid, info.floorId, info.curHeading, info.headingRoute);
        // console.log("SmoothPositionSampler setPositionOnly   ",new Date().getTime());

    }

    prototype.onTargetChanged = function(target_pose, target_heading, bdid, floorId, target_headingRoute) {
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
    }
}




/////////////////////////////////////////////////////////
// SmoothViewPositionSampler
/////////////////////////////////////////////////////////
var SmoothViewPositionSampler = function() {
    var navi_utils = daximap["DXMapUtils"]["naviMath"];
    var targetPose = [0, 0, 0];
    var targetHeading = 0;

    var targetObj = null;
    var info = this;

    info.curPose = [0, 0, 0];
    info.curHeading = 0.0;
    info.curTilt = 0.0;
    info.floorId = "";
    info.resamplerArray = new ResamplerArray();
    var curT = 0.0;
    this.curT1 = 0.0;

    var isDirty = false;

    var prototype = SmoothViewPositionSampler.prototype;
    prototype.init = function(obj) {
        targetObj = obj;
    }

    prototype.setDirty = function(dirty) {
        isDirty = dirty;
    }
    var quatFrom = [0, 0, 0, 1];
    var quatTo = [0, 0, 0, 1];
    var quatCur = [0, 0, 0, 1];
    var vecEuler = [0, 0, 0];



    prototype.onRuning = function() {
        if (isDirty === false) return;
        curT += 0.1;
        if (curT > 1) {
            curT = 1.0;
        }
        var toPos = targetPose;
        var fromPos = info.curPose;
        var dir = [0, 0, 0];
        var temp = [0, 0, 0];
        var outPos = [0, 0, 0];
        navi_utils.Vector3_lerp(info.curPose, fromPos, toPos, curT);

        this.curT1 += 0.2;
        if (this.curT1 > 1) {
            this.curT1 = 1.0;
        }
        var dif = targetHeading - info.curHeading;
        var caaa = this.curT1;

        if (dif < -180) dif = 360 + dif;
        if (dif > 180) dif = dif - 360;

        info.curHeading += this.curT1 * dif;
        if (info.curHeading < 0) info.curHeading = 360 + info.curHeading;
        if (info.curHeading > 360) info.curHeading = info.curHeading - 360;

        /////////////////////////////////////////////////
        var newVector = [Math.sin(info.curHeading * DEGREE_TO_RADIAN), Math.cos(info.curHeading * DEGREE_TO_RADIAN), 0];
        info.resamplerArray.push(newVector);
        var retVector = info.resamplerArray.getAverageValue();
        //navi_utils.Vector3_dot(cross, test_vec, line_vec );
        var headingView = Math.acos(navi_utils.Vector3_dot(retVector, [0, 1, 0])) * RADIAN_TO_DEGREE;
        if (retVector[0] < 0) {
            headingView = 360 - headingView;
        }
        targetObj._setPositionOnly(info.curPose[0], info.curPose[1], 0, 360 - headingView, info.curTilt);
        if (curT == 1.0 && this.curT1 == 1.0) {
            isDirty = false;
        }

    }

    prototype.onTargetChanged = function(target_pose, target_heading, target_tilt, floorId) {
        targetPose = target_pose;
        var tempTargetHeading = target_heading;
        if (tempTargetHeading < -180) tempTargetHeading = 360 + tempTargetHeading;
        if (tempTargetHeading > 180) tempTargetHeading = tempTargetHeading - 360;

        if (Math.abs(targetHeading - tempTargetHeading) > 0.001) {
            targetHeading = tempTargetHeading;
            this.curT1 = 0;
        }

        var cameraPose = targetObj.getCameraPose();
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
    }
}



// SmoothPositionRootSampler
/////////////////////////////////////////////////////////
var SmoothPositionRootSampler = function() {
    var navi_utils = daximap["DXMapUtils"]["naviMath"];
    var targetPose = [0, 0, 0];
    var targetHeading = 0;
    var targetPathT = -1;
    var startPathT = -1;
    var targetObj = null;
    var info = this;

    info.curPose = [0, 0, 0];
    info.curHeading = 0.0;
    info.floorId = "";
    info.bdid = "";
    info.PathT = -1;
    var curT = 0.0;
    this.curT1 = 0.0;

    var isDirty = false;

    var prototype = SmoothPositionRootSampler.prototype;
    prototype.init = function(obj) {
        targetObj = obj;
    }

    prototype.setDirty = function(dirty) {
        isDirty = dirty;
    }
    var quatFrom = [0, 0, 0, 1];
    var quatTo = [0, 0, 0, 1];
    var quatCur = [0, 0, 0, 1];
    var vecEuler = [0, 0, 0];

    prototype.onRuning = function() {
        if (isDirty === false) return;
        curT += 0.1;
        if (curT > 1) {
            curT = 1.0;
        }
        if (startPathT >= 0 && targetPathT >= startPathT) {
            //targetObj.naviCore.
        }

        var toPos = targetPose;
        var fromPos = info.curPose;
        var dir = [0, 0, 0];
        var temp = [0, 0, 0];
        var outPos = [0, 0, 0];
        navi_utils.Vector3_lerp(info.curPose, fromPos, toPos, curT);


        //onChangePosition(curPose, info.currentStatus);

        this.curT1 += 0.2;
        if (this.curT1 > 1) {
            this.curT1 = 1.0;
        }
        var dif = targetHeading - info.curHeading;

        var caaa = this.curT1;

        if (dif < -180) dif = 360 + dif;
        if (dif > 180) dif = dif - 360;

        info.curHeading += this.curT1 * dif;
        if (info.curHeading < 0) info.curHeading = 360 + info.curHeading;
        if (info.curHeading > 360) info.curHeading = info.curHeading - 360;
        targetObj.setPosition(info.curPose[0], info.curPose[1], info.bdid, info.floorId, info.curHeading);

    }

    prototype.onTargetChanged = function(target_pose, target_heading, bdid, floorId, sPathT, tPathT) {
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
    }
};

/////////////////////////////////////////////////////////
// TimeConditionTrigger
/////////////////////////////////////////////////////////
var TimeConditionTrigger = function(triggerTime) {
    var obj = {};
    obj.maxTime = triggerTime;
    obj.timer = null;
    obj.EventTimeTrigger = new EventHandler("timeTrigger");
    obj.start = function() {
        clearTimeout(obj.timer);
        obj.timer = setTimeout(function() {
            obj.EventTimeTrigger._notifyEvent(obj, 0);
        }, obj.maxTime);
    }
    obj.stop = function() {
        clearTimeout(obj.timer);
    };
    return obj;
};

var STATION_TYPE_HEAD = "0",
    STATION_TYPE_START = "1",
    STATION_TYPE_SEGMENT = "2",
    STATION_TYPE_SEGMENT_END = "3",
    STATION_TYPE_CHANGE_FLOOR = "4",
    STATION_TYPE_CHANGE_FLOOR_END = "5",
    STATION_TYPE_END = "8",
    STATION_TYPE_ACTION_TO_TARGET = "9",
    STATION_TYPE_ACTION = "10";

var endDistance = 0;
var startStationDistance = 0.0;
var changeFloorStationDistance = 4;
var changeFloorEndStationDistance = 1;
var segmentEndStationDistance = 0.5;
var endStationDistance = 6; //wenzhongxin:4   wenfuer:6 xiehe:6
//////////////////////////////////////////////////////////
// RawRoute
//////////////////////////////////////////////////////////
var RawRoute = function(naviCore) {
        var navi_utils = daximap["DXMapUtils"]["naviMath"];
        var RouteFloorObject = function(route) {
            var thisObject = this;
            thisObject.route = route;
            thisObject.extent = [];
            thisObject.renderObjects = [];
            thisObject.backgroundRenderObjects = [];
            thisObject.arrowRenderObjects = [];
            thisObject.stations = [];

            var proto = RouteFloorObject.prototype;
            proto.setGeometry = function(geometry){
                this.geometry = geometry;
                var routeResampler = thisObject.route.naviCore.routeResampler;
                var points = [];
                geometry.forEach(function(point){
                    points.push([point["x"],point["y"]]);
                });
                var smoothRoute = routeResampler.resampler(points)[0];
                // var smoothRoute = this.smoothRoute;
                smoothRoute[0].segment_length = 0;
                var total_length = 0;
                this.smoothRoute = [];
                this.smoothRoute.push({ x: smoothRoute[0][0], y: smoothRoute[0][1],segment_length:0});
                for(var i = 1,len=smoothRoute.length;i<len;i++){
                    var p1 = smoothRoute[i-1],p2 = smoothRoute[i];
                    p2.segment_length = navi_utils.getGeodeticCircleDistance({ x: p1[0], y: p1[1] }, {x:p2[0],y:p2[1]});
                    this.smoothRoute.push({ x: p2[0], y: p2[1],segment_length:p2.segment_length});
                    total_length+= p2.segment_length;

                };
                this.smoothRoute.total_length = total_length;

            }
            proto.setVisible = function(bVisible) {
                var thisObject = this;
            }

            proto.getCurrentPose = function(t) {
                var thisObject = this;
                var curPose = {};
                curPose.headingTilt = [0, 0];
                curPose.floorId = thisObject.floor;
                // thisObject.route.getCurrentPoseInFloor(curPose, thisObject.geometry, t);
                thisObject.route.getCurrentPoseInFloor(curPose, thisObject.smoothRoute, t);
                return curPose;
            }

            proto.clear = function(clearBackground) {
                var thisObject = this;
                for (var objIndex in thisObject.renderObjects) {
                    var obj = thisObject.renderObjects[objIndex];
                    navi_map.deleteObject(obj);
                }

                for (var objIndex in thisObject.arrowRenderObjects) {
                    var obj = thisObject.arrowRenderObjects[objIndex];
                    navi_map.deleteObject(obj);
                }

                thisObject.renderObjects = []
                thisObject.arrowRenderObjects = [];
                thisObject.stations = [];
                if (clearBackground) {
                    for (var objIndex in thisObject.backgroundRenderObjects) {
                        var obj = thisObject.backgroundRenderObjects[objIndex];
                        navi_map.deleteObject(obj);
                    }
                }
            }

            proto.addChildObject = function(ro, isBackground) {
                var thisObject = this;
                if (isBackground) {
                    thisObject.backgroundRenderObjects.push(ro);
                } else {
                    thisObject.renderObjects.push(ro);
                }
            }
            proto.getChildObject = function(key) {

            }
        };

        var naviRoute = {};
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
        naviRoute.display = function() {
            naviRoute.showArrow(naviRoute.currentCursor);
        };

        naviRoute.reset = function() {
            if(naviRoute.floorObjects){
                naviRoute.floorObjects.forEach(function(floorObject){
                    floorObject.arrowRenderObjects.forEach(function(arrow){
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

        naviRoute.getFloorObject = function(floorId) {
            return naviRoute.floorObjectMap[floorId];
        };
        naviRoute.getFloorObjectGeometry = function(floorId) {
            var geometrys = [];
            var floorObjects = naviRoute.floorObjectMap[floorId];
            floorObjects.forEach(function(floorObject) {
                geometrys = geometrys.concat(floorObject.geometry);
            });
            return geometrys;
        };

        naviRoute.createFloorObject = function(floorId, index) {
            if (naviRoute.floorObjectMap[floorId] === undefined) {
                naviRoute.floorObjectMap[floorId] = [];
            }
            var floorObjects = naviRoute.floorObjectMap[floorId];
            var floorObject = new RouteFloorObject(this);
            //floorObject.extent = oldFloorObject.extent;//floorExtent[floorID];
            floorObject.floor = floorId;
            floorObjects.push(floorObject);
            floorObject.routeIndex = index;
            // naviRoute.floorObjectMap[floorId] = floorObject;
            return floorObject;
        }

        function getAngle2(start, end) {
            var diff_x = (end.x - start.x) * 100000,
                diff_y = (end.y - start.y) * 100000;
            var InvLength = 1 / Math.sqrt(diff_x * diff_x + diff_y * diff_y);
            var vec2 = [diff_x * InvLength, -diff_y * InvLength];
            var vec1 = [0, 1];

            //navi_utils.Vector3_dot = function( vec1, vec2 ) {
            var dotValue = vec1[0] * vec2[0] + vec1[1] * vec2[1];
            var angle = Math.acos(dotValue) / Math.PI * 180;

            if (diff_x < 0) {
                angle = 360 - angle;
            }
            return angle;
        }

        naviRoute.getCurrentPoseInFloor = function(curPose, geometry, t) {
            var pos = [geometry[0].x, geometry[0].y, 0];
            if (t > 1) {
                t = 1;
            }
            curPose.pos = pos;
            var distance = 0;
            var geolen = geometry.length;
            var maxIndex = geolen - 1;
            for (var i = 1; i < geolen; i++) {
                var cur_segment_length = geometry[i].segment_length;
                var start_t = distance / geometry.total_length;
                distance += cur_segment_length;
                var end_t = distance / geometry.total_length;
                // if ((end_t < t) && (t != 1 || i < maxIndex)) {
                if (end_t < t) {
                    continue;
                }
                //t < end_t;
                var cur_t = (t - start_t) / (end_t - start_t);
                if (isNaN(cur_t)) {
                    cur_t = 0;
                }
                var temp = [0, 0, 0];
                var dir_ecef = [0, 0, 0];
                var a_sphr = [geometry[i - 1].x * DEGREE_TO_RADIAN, geometry[i - 1].y * DEGREE_TO_RADIAN, earthRadius];
                var b_sphr = [geometry[i].x * DEGREE_TO_RADIAN, geometry[i].y * DEGREE_TO_RADIAN, earthRadius];
                var a_ecef = [0, 0, 0];
                var b_ecef = [0, 0, 0];

                var up_ecef = [0, 0, 0];
                var right_ecef = [0, 0, 0];
                var north_ecef = [0, 0, 0];
                var test_ecef = [0, 0, 0];


                navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
                navi_utils.transformGeographicToECEF(b_ecef, b_sphr);
                navi_utils.Vector3_sub(temp, b_ecef, a_ecef);
                navi_utils.Vector3_normalize(dir_ecef, temp);
                /////////////////////////////////////////////
                navi_utils.Vector3_normalize(up_ecef, a_ecef);
                navi_utils.Vector3_cross(right_ecef, [0, 0, 1], up_ecef);
                navi_utils.Vector3_cross(north_ecef, up_ecef, right_ecef);
                navi_utils.Vector3_normalize(north_ecef, north_ecef);

                var heading = Math.acos(navi_utils.Vector3_dot(north_ecef, dir_ecef)) / Math.PI * 180;
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
        }

        naviRoute.getCurrentPose = function(t) {
            var curPose = {};
            curPose.headingTilt = [0, 0];
            var geo_t = 0;
            for (var geoIndex = 0; geoIndex < naviRoute.floorObjects.length; geoIndex++) {
                var floorObject = naviRoute.floorObjects[geoIndex];
                var geometry = floorObject.smoothRoute;//floorObject.geometry;
                var start_geo_t = geo_t;
                var temp_t = geometry.total_length / naviRoute.total_length;
                geo_t += temp_t;
                if (t > geo_t) {
                    continue;
                }
                var new_t = (t - start_geo_t) / temp_t;
                curPose.floor = floorObject.floor;
                naviRoute.getCurrentPoseInFloor(curPose, geometry, new_t);
                break;
            }
            return curPose;
        }

        naviRoute.snapToNearestPathLine = function(x, y, floorId, result) {
            var curr = naviCore.route.currentCursor;
            if (naviCore.isNavigationPause || curr < 0) {
                curr = 0;
            }
            var pos_ecef = [0, 0, 0];
            var pos_sphr = [indicator.pos[0] * DEGREE_TO_RADIAN, indicator.pos[1] * DEGREE_TO_RADIAN, earthRadius];
            navi_utils.transformGeographicToECEF(pos_ecef, pos_sphr);

            for (var i = curr; i < naviRoute.stations.length; i++) {
                var station = naviRoute.stations[i];
                if (station.floor !== floorId) continue;
                if (station.type === STATION_TYPE_SEGMENT ||
                    station.type === STATION_TYPE_SEGMENT_END ||
                    station.type === STATION_TYPE_END ||
                    station.type === STATION_TYPE_ACTION ||
                    station.type === STATION_TYPE_ACTION_TO_TARGET) {
                    var segment = station.segment;
                    for (var j = 0; j < segment.length - 1; j++) {
                        var a_sphr = [segment[j].x * DEGREE_TO_RADIAN, segment[j].y * DEGREE_TO_RADIAN, earthRadius];
                        var b_sphr = [segment[j + 1].x * DEGREE_TO_RADIAN, segment[j + 1].y * DEGREE_TO_RADIAN, earthRadius];
                        var a_ecef = [0, 0, 0];
                        var b_ecef = [0, 0, 0];
                        var root_ecef = [0, 0, 0];
                        navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
                        navi_utils.transformGeographicToECEF(b_ecef, b_sphr);
                        var tempDistance = navi_utils.pointToLine(pos_ecef, a_ecef, b_ecef, root_ecef);
                        //todo:需要精细计算具体的距离
                        if (result.minDistance > tempDistance) {
                            var B = segment[segment.length - 1];
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
        }

        naviRoute.getNearestStation = function(indicator, result) {
            var curr = naviCore.route.currentCursor;//0;
            // var curr = 0;
            if (naviCore.isNavigationPause || curr < 0) {
                curr = 0;
            }
            var indicatorFloorHasRoute = false;
            for (var i = curr; i < naviRoute.stations.length; i++) {
                var station = naviRoute.stations[i];
                if (station.floor !== indicator.floorId || station.type === STATION_TYPE_HEAD) {
                    continue;
                }
                var floorObjectIndex = station.floorObjectIndex;
                indicatorFloorHasRoute = true;
                if (station.type === STATION_TYPE_START) {
                    var position = station.position;
                    var tempDistance = navi_utils.getGeodeticCircleDistance({
                        x: indicator.pos[0],
                        y: indicator.pos[1]
                    }, { x: position[0], y: position[1] });
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
                    var endDistance = 0;
                    if (station.type === STATION_TYPE_ACTION_TO_TARGET || station.type === STATION_TYPE_END || station.type === STATION_TYPE_CHANGE_FLOOR_END || station.type == STATION_TYPE_SEGMENT_END) { //station.type === STATION_TYPE_SEGMENT_END ||
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
                    if(i< naviRoute.stations.length-2 && result.station == station && station.extendType && (result.targetDistance < 1 || station.arrivedTime)){
                        var nextFloorPos = naviRoute.stations[i+2].segment[1][0];
                        if(!station.arrivedTime){
                            station.arrivedTime = Date.now();
                        }else{
                            var pos = station.segment[1];
                            var pt = (Date.now() - station.arrivedTime)/1000/station.useTime;
                            if(pt > 1){
                                pt = 1;
                            }

                            indicator.pos[0] = result.nearestPt.x = pos.x + (nextFloorPos.x - pos.x) * pt;
                            indicator.pos[1] = result.nearestPt.y = pos.y + (nextFloorPos.y - pos.y) * pt;
                        }
                    }
                    //  非最近station.  result.minDistance < endDistance ||
                    if (result.station != station || !result.station.roadInfo) {
                        continue;
                    }
                    if (station.type === STATION_TYPE_SEGMENT ||
                        station.type === STATION_TYPE_SEGMENT_END ||
                        station.type === STATION_TYPE_END ||
                        station.type === STATION_TYPE_ACTION_TO_TARGET ||
                        station.type === STATION_TYPE_ACTION ||
                        station.type === STATION_TYPE_CHANGE_FLOOR || station.type === STATION_TYPE_CHANGE_FLOOR_END) {
                        var isInStation = result.isInStation;
                        var testStation = result.station;
                        var testStation = result.station;
                        var segment = station.segment;

                        if (isInStation && testStation !== undefined && result.station.roadInfo !== undefined) {
                            var position = testStation.roadInfo.nearestPt;
                            var B = segment[segment.length - 1];
                            var _tempDistance = navi_utils.getGeodeticCircleDistance(position, B);
                            var _startToBeginPointDistance = testStation.distance - _tempDistance; //
                            var _showDistace = testStation.roadInfo.result.Result["distance"];
                            var _endToBeginPointDistance = _startToBeginPointDistance + _showDistace
                            var _start = _startToBeginPointDistance / testStation.distance;
                            var _end = _endToBeginPointDistance / testStation.distance;
                            _start = Math.min(1, Math.max(_start, 0));
                            _end = Math.min(1, Math.max(_end, 0));
                            var _curr = 1 - result.targetDistance / testStation.distance;
                            if (_curr > _start && _curr < _end && !station.roadCrossFinished) //&& tempDistance <= endDistance) {
                            { // khronus modify
                                result.floor = station.floor;
                                result.roadResult = testStation.roadInfo.result.Result;
                                station.roadCrossShow = true;
                                //break;
                            } else {
                                if(station.roadCrossShow){
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
                naviRoute.computeTime(naviCore.route, result,indicator);
                lastIndex = result.index;
                return true;
            }
            if (indicatorFloorHasRoute === false) {
                result.minDistance = 500;
            }
            return false;
        }
        naviRoute.computeSegmentDis = function(station, result, endDistance, indicator, stationIndex) {
            var pos_ecef = [0, 0, 0];
            var pos_sphr = [indicator.pos[0] * DEGREE_TO_RADIAN, indicator.pos[1] * DEGREE_TO_RADIAN, earthRadius];
            navi_utils.transformGeographicToECEF(pos_ecef, pos_sphr);
            var segment = station.segment;
            var isInStation = false;
            if (!segment || segment.length <= 1) {
                var position = station.position;
                var tempDistance = navi_utils.getGeodeticCircleDistance({ x: indicator.pos[0], y: indicator.pos[1] }, { x: position[0], y: position[1] });
                if ((tempDistance < endDistance) && (result.minDistance - tempDistance) > 0.001) {
                    result.minDistance = tempDistance;
                    result.targetDistance = tempDistance;
                    result.index = stationIndex;
                    result.nearestPt = { x: position[0], y: position[1] }; //position;
                    result.floor = station.floor;
                    result.byway = station.angelIcon;
                    result.nextFloor = station.nextFloor; //naviRoute.stations[stationIndex + 1].floor;
                    result.station = station;
                    result.pathArrIndex = station.floorObjectIndex;
                    // point index in this floor
                    result.isInStation = true;
                    result.pointIndex = station.pointIndex;
                    //break;
                }

            } else {
                for (var j = 0; j < segment.length - 1; j++) {
                    var a_sphr = [segment[j].x * DEGREE_TO_RADIAN, segment[j].y * DEGREE_TO_RADIAN, earthRadius];
                    var b_sphr = [segment[j + 1].x * DEGREE_TO_RADIAN, segment[j + 1].y * DEGREE_TO_RADIAN, earthRadius];
                    var a_ecef = [0, 0, 0];
                    var b_ecef = [0, 0, 0];
                    var root_ecef = [0, 0, 0];
                    navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
                    navi_utils.transformGeographicToECEF(b_ecef, b_sphr);
                    var tempDistance = navi_utils.pointToLine(pos_ecef, a_ecef, b_ecef, root_ecef);
                    //todo:需要精细计算具体的距离

                    if ((result.minDistance - tempDistance) > 0.001) {
                        var B = segment[segment.length - 1];
                        result.minDistance = tempDistance;
                        result.targetDistance = navi_utils.getGeodeticCircleDistance({ x: indicator.pos[0], y: indicator.pos[1] }, B);
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
        naviRoute.computeTime = function(route, matchResult,indicator) {
            var stations = route.stations;
            var floorId = matchResult.floor;
            var routeIndex = matchResult.station.floorObjectIndex;
            var _index = matchResult.index;
            var floorRouteDis = route.floorObjects[routeIndex].geometry.total_length;
            var t = 0;
            var walkedRouteDis = 0;
            // var grayRoutePoints = [];
            for (var i = 0, len = stations.length; i < len; i++) {
                var station = stations[i];
                if (station.floorObjectIndex == routeIndex && station.distance) {
                    if (i < _index) {
                        // var segment = station.segment;
                        // segment.forEach(function(point,_index){
                        //     if(_index < segment.length-1){
                        //         grayRoutePoints.push([point.x,point.y]);
                        //     }
                        // });

                        walkedRouteDis += station.distance;

                    } else if (i == _index) {
                        // var segment = station.segment;
                        // for(var j =0,seglen=segment.length;j<seglen-1;j++){
                        //     var p1 = segment[j],p2=segment[j+1];
                        //     var nearestPt = matchResult.nearestPt;
                        //     if(navi_utils.isPointOnLine(p1.x,p1.y,p2.x,p2.y,nearestPt.x,nearestPt.y)){
                        //         grayRoutePoints.push([p1.x,p1.y]);
                        //         grayRoutePoints.push([nearestPt.x,nearestPt.y]);
                        //         break;
                        //     }else{
                        //         grayRoutePoints.push([p1.x,p1.y]);
                        //     }
                        // }
                        walkedRouteDis += station.distance;
                        walkedRouteDis -= matchResult.targetDistance;
                    }

                }
            }
            t = walkedRouteDis / floorRouteDis;

            matchResult.walkedRouteRatio = t;
            // matchResult.grayRoutePoints = grayRoutePoints;
            // jiangge modify
            // route.floorObjects[routeIndex].bacl_polyline.setGrayT(t);
            return 0;

        };

        naviRoute.updateInfo = function(targetDistance) {
            var station = naviRoute.stations[naviRoute.currentCursor];
            var isGray = false;
            if (naviCore.isSwipe === true) {
                isGray = true;
            }
            naviCore.updateRouteInfo(naviRoute.currentCursor, isGray, targetDistance,station);
            if (station.type === "0" || station.type === "1") {
                var data = naviRoute.getLastDistance(0);
                naviCore.updateNaviProgressInfo(data);
            }
            naviRoute.display();
        };

        naviRoute.getLastDistance = function(targetDistance, result) {
            if (naviRoute.currentCursor < 0) { //result.index
                naviRoute.currentCursor = result.index;
            }
            // var station = naviRoute.stations[naviRoute.currentCursor];
            var station = naviRoute.stations[result.index];
            var speedDis = 0;
            var _distance = 0,
                _time, _data, _progress;
            if (station.type === "0" || station.type === "1") {
                _distance = Math.ceil(naviRoute.total_length);

            } else if (station.type === "2" || station.type === "3" || station.type === "8" || station.type === "4" || station.type === "5") {
                var last = 0;

                // for (var i = naviRoute.currentCursor + 1; i < naviRoute.stations.length; i++) {
                // for (var i = 2; i <= naviRoute.currentCursor; i++) {
                for (var i = 2; i <= result.index; i++) {
                    station = naviRoute.stations[i];
                    if (station.type === "2" || station.type === "3" || station.type === "8" || station.type === "4" || station.type === "5") {
                        var segment = station.segment;
                        if (segment.segment_length == undefined && segment) {
                            segment.segment_length = 0;
                            segment.forEach(function(item){
                                segment.segment_length += (item.segment_length || 0);
                            });
                        }
                        // last += segment.segment_length;
                        speedDis += segment.segment_length;
                    }
                }
                speedDis -= targetDistance;
                // _distance = Math.ceil(last + targetDistance);
                _distance = Math.ceil(naviRoute.total_length - speedDis);

            }

            _time = (_distance / 0.83) * 1000; //每小时3公里
            if (_distance < 0) {
                _progress = 0;
            } else {
                _progress = speedDis / naviRoute.total_length * 100;

            }
            if (naviRoute.currentCursor == 0 && naviRoute.stations.length) {
                var _index = naviRoute.stations.length >= 3 ? result.index : naviRoute.stations.length - 1;
                targetDistance = Math.ceil(naviRoute.stations[_index].distance);
            }
            targetDistance = Math.ceil(targetDistance);
            var disUnit = "米";
            if(this.language == "En"){
                disUnit = " meters ";
            }
            _data = { "extraDistance": _distance + disUnit, "extraTime": navi_utils.MillisecondToDate(_time,this.language), "extraProgress": _progress, "total_length": naviRoute.total_length, "targetDistance": targetDistance, "lastDistance": _distance, "angelText": station.angelText, "angelIcon": station.angelIcon, "stationIndex": naviRoute.currentCursor,"floorId":station.floor};

            return _data;
        };

        naviRoute.getLastDistance2 = function(targetDistance) {
            var station = naviRoute.stations[naviRoute.currentCursor];
            var _distance = 0,
                _time, _data, _progress;
            if (station.type === "0" || station.type === "1") {
                _distance = Math.ceil(naviRoute.total_length);

            } else if (station.type === "2" || station.type === "3" || station.type === "9" || station.type === "7" || station.type === "4" || station.type === "5") {
                var last = 0;
                for (var i = naviRoute.currentCursor + 1; i < naviRoute.stations.length; i++) {
                    station = naviRoute.stations[i];
                    if (station.type === "2" || station.type === "3" || station.type === "9" || station.type === "7" || station.type === "4" || station.type === "5") {
                        var segment = station.segment;
                        if (segment.segment_length == undefined) {
                            segment.segment_length = 0;
                            for (var i = 0, len = segment.length; i < len; i++) {
                                segment.segment_length += (segment[i].segment_length || 0);
                            }
                        }
                        last += segment.segment_length;
                    }
                }
                _distance = Math.ceil(last + targetDistance);

            }
            _time = (_distance / 0.83) * 1000; //每小时3公里
            _progress = (naviRoute.total_length - _distance) / (naviRoute.total_length) * 100;
            // _data = { "extraDistance": _distance + "米", "extraTime": navi_utils.MillisecondToDate(_time), "extraProgress": _progress, "lastDistance": _distance };
            var disUnit = "米";
            if(this.language == "En"){
                disUnit = " meters ";
            }
            _data = { "extraDistance": _distance + disUnit, "extraTime": navi_utils.MillisecondToDate(_time,this.language), "extraProgress": _progress, "total_length": naviRoute.total_length, "targetDistance": targetDistance, "lastDistance": _distance, "angelText": station["angelText"], "angelIcon": station["angelIcon"], "stationIndex": naviRoute.currentCursor ,"floorId":station.floor};

            return _data;
        };

        naviRoute.getFloorShowData = function(floorNum, result) {
            var info = {};
            var floorArr = [];
            var dir = "up";
            var byway = "";
            for (var i = 0; i < naviRoute.stations.length; i++) {
                var station = naviRoute.stations[i];
                if (station.type !== "4" && station.type !== "5") continue;
                if (station.type === "4") {
                    var byway = RouteParseHelper.getTypeByIconName(station.angelIcon);
                    var typename = station.angelIcon.split("_");

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

            for (var i = 0; i < floorArr.length - 1; i += 2) {
                var A = floorArr[i];
                var B = floorArr[i + 1];
                if (A.floor < floorNum && floorNum < B.floor) {
                    result.byWay = A.byWay;
                    result.dir = A.dir;
                    result.floor = floorNum;
                }

            }
        };

        naviRoute.showArrow = function(index) {
            for (var i = 2, stationCount = naviRoute.stations.length; i < stationCount; i++) {
                var station = naviRoute.stations[i];
                if (station.arrowObject) {
                    // station.arrowObject.setVisible(i===index);
                    // station.arrowObject.setIsActive(i === index);
                    station.arrowObject.visible = (i === index);//setIsActive(i === index);
                }
            }
        }
        return naviRoute;
    }
    ///////////////////////////////////////////////////////////////////////////////
    // RawRouteParser
    ///////////////////////////////////////////////////////////////////////////////
var RawRouteParser = function() {
    /**
     * Generate Navi Data （Text and Speak）
     * @param naviRoute
     */
    var thisObject = {};
    var station_start_func = RouteParseHelper.station_start_func;
    /**
     * Create Route
     * @returns {{}}
     */
    var endText = "本次导航结束，欢迎您再次使用室内导航!";
    // if(thisObject.language == "En"){
    //     endText = "You have arrived near your destination. This navigation is over"
    // }
    var DXMapUtils = daximap["DXMapUtils"];
    var navi_utils = DXMapUtils["naviMath"];
    var mapPoiStyle = window["DaxiMap"]["mapPoiStyle"];
    thisObject.createRoute = function(naviCore, data, routeState,options) {
        // naviCore.mapAPI._coreMap.clearRouteArrow();

        thisObject.language = (options && options["language"])||"Zh";
        endText = "本次导航结束，欢迎您再次使用室内导航!";
        if(thisObject.language == "En"){
            endText = "You have arrived near your destination. This navigation is over"
        }
        var naviRoute = RouteParseHelper.createRouteImpl(naviCore);
        var route = data['route'][0];
        var path = route['path'];
        var keyPoints = path["keyPoints"];
        if (data["parm"]) {
            naviRoute.targetId = data["parm"]['stopid'];
            naviRoute.targetName = path["end"]["dsp"] || data["parm"]["endCnName"] || "目的地";
            naviRoute.targetLocal = data["parm"]["address"] || "";
            naviRoute.distance = route["distance"];
        }

        naviRoute.currentCursor = 0;
        naviRoute.bdid = route["buildingId"];
        RouteParseHelper.matchInnerIndex(naviCore, path);
        naviRoute.rawRoute = JSON.stringify(data);

        // 2016-01-28 lishuang filter middle path
        RouteParseHelper.fileterSameLayerData(path);
        RouteParseHelper.parseIconType(path);
        RouteParseHelper.parseArriveMethods(naviRoute.arriveMethods, path,thisObject.language);
        RouteParseHelper.convertPathCoords(naviCore, path);

        // RouteParseHelper.proloadRoadCross(data);
        parseStations(naviRoute, path, route["roadCrossData"],thisObject.language);
        if(keyPoints && keyPoints.length){
            keyPoints.forEach(function(keyPoint){
                var floorId = keyPoint["floorId"];
                var pos = keyPoint["pos"];
                var iconType = keyPoint["icon"];
                var floorObject = naviRoute.getFloorObject(floorId);
                var renderObjects = floorObject[0].renderObjects;
                var mapAPI = naviCore.mapAPI;

                createIconMarker(mapAPI,renderObjects,floorId,iconType,pos);
            });
        }
        generateNaviData(naviRoute, naviCore.minLenSegment, naviCore.maxSegmentCount, routeState,thisObject.language);
        naviCore.route = naviRoute;
        naviCore.updateRouteInfo(2);
        return naviRoute;
    };
        // drawLine
    thisObject.createLines = function(naviCore, floorId, lineString, routeState, index) {
        // var naviRoute = thisObject.route;

        var tempArr = lineString.split(";");
        var pointString = tempArr.join(",0.5;");
        pointString += ",0.5";
        var naviRoute = RouteParseHelper.createRouteImpl(naviCore);
        naviRoute.createFloorObject(floorId, index);
        var floorObjects = naviRoute.getFloorObject(floorId);
        floorObjects.forEach(function(floorObject) {
            var renderObjects = floorObject.renderObjects;
            var factory = naviCore.mapAPI.scene.factory;
            var isVisible = (floorId === naviCore.mapAPI.cameraCtrl.getCurrentFloorId());
            var assetsPath = naviCore.mapAPI.config.assetsPath;
            var guid = factory.createUUID();
            var devicePixel = window["devicePixelRatio"];
            var _width1 = Math.round(6 * devicePixel);
            var _wrapScale1 = Math.round(4 * devicePixel);
            var bacl_polyline = factory.createPolyline(guid, guid, pointString, floorId, joinPath(assetsPath, getIconLink('line2')), _width1, _wrapScale1, true);
            bacl_polyline.setVisible(isVisible);
            renderObjects.push(bacl_polyline);
            var guid = factory.createUUID();
            var _width2 = Math.round(5 * devicePixel);
            var _wrapScale2 = Math.round(4 * devicePixel);
            var polyline = factory.createPolyline(guid, guid, pointString, floorId, joinPath(assetsPath, 'images/line_blue.png'), _width2, _wrapScale2, true);
            polyline.setVisible(isVisible);
            renderObjects.push(polyline);
            floorObject.setVisible(isVisible);

        });
        naviCore.mapAPI._coreMap["enginApi"]["forceRedraw"]();

        return naviRoute;


    };

    var generateNaviData = function(naviRoute, minLenSegment, maxSegmentCount, routeState) {
        // return;
        naviRoute.naviCore.speakListener && naviRoute.naviCore.speakListener.stop();
        var _distance = Math.ceil(naviRoute.total_length);
        var time = navi_utils.MillisecondToDate((_distance / 0.83) * 1000, "nosec",thisObject.language);
        if (time == "2分钟") {
            time = "两分钟"
        }
        // get Next Icon
        var data = { title: '', address: '', angelText: '', distance: 0, currIcon: '', nextIcon: '', type: 0 },
            tempData = null;
        var stations = naviRoute.stations;
        for (var i = 1; i < stations.length - 1; i++) {
            var station = stations[i];
            var nextStation = stations[i + 1];
            if (nextStation.type === "2" || nextStation.type === "3" || station.type === "9" || nextStation.type === "8" || nextStation.type === "4" || nextStation.type === "5") {
                station.nextIcon = nextStation.angelIcon;
            }
        }
        // 遍历 Stations 生成语音和文字
        var speakText = "";

        var segmentsData = [];
        var bdNaviConfig = naviRoute.naviCore.bdNaviConfig;
        var speakLevel = naviRoute.naviCore.speakLevel;
        var speakTest = naviRoute.naviCore.speakTest;
        var bdid = naviRoute.bdid;
        var minSpeakDistance = naviRoute.naviCore.minSpeakDistance;
        if(bdNaviConfig[bdid] ){
            var naviConfig = bdNaviConfig[bdid];
            naviConfig["speakLevel"] != undefined?(speakLevel=naviConfig["speakLevel"]):'';
            naviConfig["minLenSegment"] != undefined?(minLenSegment=naviConfig["minLenSegment"]):'';
            naviConfig["maxSegmentCount"] != undefined?(maxSegmentCount=naviConfig["maxSegmentCount"]):'';
            naviConfig["minSpeakDistance"] != undefined?(minSpeakDistance = naviConfig["minSpeakDistance"]):'';
        }
        switch (speakLevel) {
            case 1:
                geneCombineSpeakText(minLenSegment, maxSegmentCount,minSpeakDistance);
                break;
            case 2:
                if(naviRoute.naviCore.speakListener){
                    geneCombineStationText(minLenSegment, maxSegmentCount,minSpeakDistance);
                }
                break;
            default:
                if(naviRoute.naviCore.speakListener){
                    geneNormalSpeaks(minLenSegment, maxSegmentCount,minSpeakDistance);
                }
        }

        function geneCombineSpeakText(minLenSegment, maxSegmentCount,minSpeakDistance) {
            for (var i = 0, len = stations.length; i < len; i += 1) {
                var distance = 0;
                var station = stations[i];
                tempData = navi_utils.copyData(data);
                if(thisObject.language == "En"){
                    speakText = geneNaviTextEn(naviRoute, station, tempData,minSpeakDistance);
                }else{
                    speakText = geneNaviText(naviRoute, station, tempData,minSpeakDistance);
                }
                station.speakText = speakText;
                segmentsData.push(tempData);
                // if(i<2){
                //     continue;
                // }
                var distance = station.distance;
                if(naviRoute.naviCore.speakListener){
                    if (station.type == 0 || station.type == 1) {
                        if (naviRoute.naviCore.getIsSimulate()) {
                            naviRoute.naviCore.speakListener.speaking("none");
                        } else {
                            naviRoute.naviCore.speakListener.speaking(speakText);
                        }
                        continue;
                    }else
                    if(station.type == 8){
                        var endSpeakText = "";
                        if (routeState == undefined || routeState === ROUTE_HAS_TAIL || routeState === ROUTE_HAS_HEAD_TAIL) {
                            endSpeakText = naviRoute.naviCore.naviEndSpeakText;
                        }else{
                            endSpeakText = "";//本段室内导航结束
                        }
                        var dis = Math.ceil(station.distance);
                        var speakText = "";
                        if(dis > minSpeakDistance){
                            speakText = "前方"+dis+"米直行";
                        }else{
                            speakText = "前方直行";
                        }
                        naviRoute.naviCore.speakListener.speaking(speakText);
                        naviRoute.naviCore.speakListener.speaking(endSpeakText);
                        continue;
                    }else
                    if(station.type == 4){
                        naviRoute.naviCore.speakListener.speaking(speakText);
                        continue;
                    }else
                    if(distance > minLenSegment ){
                        naviRoute.naviCore.speakListener.speaking(speakText);
                        continue;
                    }

                }

                var curFirst = i;
                var j = i + 1,
                    count = 0;

                while (count < maxSegmentCount && j < len-1) {
                    j = i + 1;
                    var nextStation = stations[j];
                    if (nextStation.type == 4 || nextStation.type == 8 || nextStation.type == 5 ) {//|| station.type == 5
                        break;
                    }
                    var tempData2 = navi_utils.copyData(data);

                    if(thisObject.language == "En"){
                        var speakTextTmp = geneNaviTextEn(naviRoute, nextStation, tempData2,minSpeakDistance);
                    }else{
                        var speakTextTmp = geneNaviText(naviRoute, nextStation, tempData2,minSpeakDistance);
                    }
                    stations[i].speakText = speakTextTmp;
                    var dis = Math.round(tempData2['distance']||0);
                    distance += dis;
                    if (count < maxSegmentCount && dis < minLenSegment) {
                        segmentsData.push(tempData2);
                        if(speakTextTmp && speakTextTmp != "none" ){
                            var concatText = ",然后";
                            if(thisObject.language == "En"){
                                concatText = " and "
                            }
                            if(!speakText || speakText == "none"){
                                speakText = speakTextTmp;
                            }else{
                                speakText += concatText + speakTextTmp;
                            }

                        }

                        count++;
                        i++;
                        if(distance > minLenSegment * 1.2){
                            station.speakText = speakText;
                            break;
                        }
                    } else {
                        station.speakText = speakText;
                        break;
                    }

                }

                var num = count;
                num > 0 ? (station.speakText = speakText):"";
                if(naviRoute.naviCore.speakListener){
                    naviRoute.naviCore.speakListener.speaking(speakText);
                    while (num > 0) {
                        naviRoute.naviCore.speakListener.speaking("none");
                        num--;
                    }
                }


            }
        };

        function geneCombineStationText(minLenSegment, maxSegmentCount,minSpeakDistance) {
            var _importPoints = cutUpstations(stations, naviRoute);
            var flag = false;
            for (var i = 0, j = 0, len = stations.length; i < len; i += 1) {
                speakText = "none";
                if (stations[i] == _importPoints[j] && j < _importPoints.length - 1) {
                    if (true == flag) {
                        naviRoute.naviCore.speakListener.speaking(speakText);
                        stations[i].speakText = speakText;
                        flag = false;
                        j++;
                        continue;
                    }
                    if(thisObject.language == "En"){
                        speakText = geneLevel0NaviTextEn(naviRoute, _importPoints[j], _importPoints[j + 1], data);
                    }else{
                        speakText = geneLevel0NaviText(naviRoute, _importPoints[j], _importPoints[j + 1], data);
                    }
                    stations[i].speakText = speakText;
                    naviRoute.naviCore.speakListener.speaking(speakText);
                    if (stations[i].type == "4" && stations[i].segment.length == 0) {
                        naviRoute.naviCore.speakListener.speaking("none");
                    }
                    j++;
                    if (speakTest && ("4" == _importPoints[j].type)) {
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
                    if (stations[i].type == "3" && (i < len - 1) && (stations[i + 1].segment.length == 0)) {
                        continue;
                    }
                    stations[i].speakText = speakText;
                    naviRoute.naviCore.speakListener.speaking(speakText);
                }
            }
        };

        function geneNormalSpeaks(minLenSegment, maxSegmentCount,minSpeakDistance) {
            for (var i = 0, len = stations.length; i < len; i += 1) {
                var distance = 0;
                var station = stations[i];
                tempData = navi_utils.copyData(data);
                tempData.type = station.type;

                if(thisObject.language == "En"){
                    speakText = geneNaviTextEn(naviRoute, station, tempData,minSpeakDistance);
                }else{
                    speakText = geneNaviText(naviRoute, station, tempData,minSpeakDistance);
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
                if(station.type == 5 && i <len-1 && station.distance < naviRoute.naviCore.minLenSegment){
                    var nextStation = stations[i+1];
                    if(thisObject.language == "En"){
                        var speakText2 = geneNaviTextEn(naviRoute, nextStation, tempData,minSpeakDistance);
                    }else{
                        var speakText2 = geneNaviText(naviRoute, nextStation, tempData,minSpeakDistance);
                    }
                    if(speakText2){
                        speakText = speakText.replace(".",'');
                        speakText += " 然后"+speakText2;
                        naviRoute.naviCore.speakListener.speaking(speakText);
                        naviRoute.naviCore.speakListener.speaking("none");
                        i++;
                        continue;
                    }
                }
                station.speakText = speakText;
                naviRoute.naviCore.speakListener.speaking(speakText);
                if (station.type == 8) {
                    var endSpeakText = "";
                    if (routeState == undefined || routeState === ROUTE_HAS_TAIL || routeState === ROUTE_HAS_HEAD_TAIL) {
                        endSpeakText = naviRoute.naviCore.naviEndSpeakText;
                    }else{
                        endSpeakText = "";//本段室内导航结束
                    }
                    naviRoute.naviCore.speakListener.speaking(endSpeakText);
                }
            }
        }

        naviRoute.naviCore.setSegments(segmentsData);

    };

    function cutUpstations(stations, naviRoute) {
        var importPoints = [],
            tempDis = 0,
            preConName,
            preGroupId;
        var floorObjects = naviRoute.floorObjects;

        for (var i = 0, len = stations.length; i < len; i++) {
            var currStation = stations[i];
            var currType = currStation.type;
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
    };

    /*generate single Navi data*/
    // var minSpeakDistance = 20;
    var geneNaviText = function(naviRoute, station, tempData,minSpeakDistance) {
        var angelText = "",
            speakText = "",
            dis;
        var floorInfo = naviRoute.naviCore.mapAPI._getFloorInfo(naviRoute.bdid,station.floor);
        if (station.type === "0") {
            var index = 0;
            angelText = "请";
            speakText = naviRoute.naviCore.startNaviText;//"开始为您导航,请沿路线指示前行";

            for (var method in naviRoute.arriveMethods) {
                var iconClass = method;
                var methodText = naviRoute.arriveMethods[method];
                if (index > 0 && speakText.indexOf(methodText)==-1) {
                    angelText += "和";
                    // speakText += "和";
                }
                if(speakText.indexOf(methodText)==-1){
                    // speakText += methodText;
                    angelText += methodText + '<span class="' + iconClass + '"></span>';
                }

                index++;
            }
            // angelText += '前往';
            // speakText += "前往";
            tempData['title'] = naviRoute.targetName;
            tempData['address'] = naviRoute.targetLocal;
            tempData['angelText'] = angelText;
        } else if (station.type === "1") {
            tempData['currIcon'] = 'icon-uniE65F';
            tempData['distance'] = "我的位置";
            tempData['angelText'] = "开始出发";
            tempData['nextIcon'] = station.nextIcon;
            speakText = "从" + tempData['distance'] + tempData['angelText'];
        } else if (station.type === "2") {
            tempData['currIcon'] = station.angelIcon;
            tempData['distance'] = Math.ceil(station.distance); //Math.ceil(station.distance);
            tempData['angelText'] = station.angelText;
            tempData['nextIcon'] = station.nextIcon;
            //naviTipInfo.addSegment(tempData, 2);
            dis = tempData['distance'];
            if (dis == "2") {
                time = "两"
            }

            speakText = "前方" + dis + "米," + tempData['angelText'];
            if (dis < 5) {
                speakText = "none";
            } else if (dis < minSpeakDistance) {
                speakText = "前方" + tempData['angelText'];
            }
        } else if (station.type === "3") {
            tempData['currIcon'] = station.angelIcon;
            tempData['distance'] = Math.ceil(station.distance); //Math.ceil(station.distance);
            tempData['angelText'] = station.targetName;
            tempData['nextIcon'] = station.nextIcon;
            tempData['floor'] = station.floor;
            //naviTipInfo.addSegment(tempData, 3);
            dis = tempData['distance'];
            if (dis == "2") {
                time = "两"
            }
            if (dis < minSpeakDistance) {
                speakText += "前方到" + tempData['angelText'];
            } else {
                speakText += "前方" + dis + "米,到达" + tempData['angelText'];
            }

        } else if (station.type === "4") {
            var nextFloor = naviRoute.naviCore.mapAPI._getFloorInfo(naviRoute.bdid,station.nextFloor);
            tempData['currIcon'] = station.angelIcon;
            tempData['angelText'] = station.targetName;
            tempData['endType'] = RouteParseHelper.directionUpOrDown(station.angelIcon);
            tempData['nextIcon'] = station.nextIcon;
            tempData['floorName'] = floorInfo["floorCnName"] || floorInfo["flcnname"]|| floorInfo["flname"]||floorInfo["floorName"] ;
            tempData['nextFloorName'] = nextFloor["floorCnName"] || nextFloor["flcnname"] ||nextFloor["flname"]|| nextFloor["floorName"];
            tempData['byWay'] = RouteParseHelper.getTargetbyWay(station.angelIcon);
            speakText = tempData['byWay'] + tempData['angelText'] + tempData['endType'] + "到达" + tempData['nextFloorName'];
        } else if (station.type === "5") {

            tempData['currIcon'] = station.angelIcon;
            tempData['distance'] = Math.ceil(station.distance);
            tempData['angelText'] = station.angelText;
            tempData['nextIcon'] = station.nextIcon;
            tempData['floorName'] = floorInfo["floorCnName"] || floorInfo["flcnname"]|| floorInfo["flname"]||floorInfo["floorName"];

            var dis = tempData['distance'];
            if (dis == "2") {
                time = "两"
            }
            speakText = "您已到达" + tempData['floorName'];

            if (dis < minSpeakDistance) {
                speakText += ". 前方" + tempData['angelText'];
            } else {
                speakText += ". 前方" + dis + "米" + tempData['angelText'];
            }


        } else if (station.type === "8") {
            tempData['currIcon'] = station.angelIcon;
            tempData['distance'] = Math.ceil(station.distance); //Math.ceil(station.distance);
            tempData['angelText'] = station.targetName;
            var dis = tempData['distance'];
            if (dis == "2") {
                time = "两"
            }
            // speakText = "前方" + dis + "米,到达" + tempData['angelText'];
        }
        return speakText;
    };
    var geneNaviTextEn = function(naviRoute, station, tempData,minSpeakDistance) {
        var angelText = "",
            speakText = "",
            dis;
        var floorInfo = naviRoute.naviCore.mapAPI._getFloorInfo(naviRoute.bdid,station.floor);
        if (station.type === "0") {
            var index = 0;
            angelText = "Please";
            speakText = "Please";
            for (var method in naviRoute.arriveMethods) {
                var iconClass = method;
                var methodText = naviRoute.arriveMethods[method];
                if (index > 0) {
                    angelText += " and ";
                    speakText += " and ";
                }
                speakText += methodText;
                angelText += methodText + '<span class="' + iconClass + '"></span>';
                index++;
            }
            angelText += ' go ahead ';
            speakText += " go ahead ";
            tempData['title'] = naviRoute.targetName;
            tempData['address'] = naviRoute.targetLocal;
            tempData['angelText'] = angelText;
        } else if (station.type === "1") {
            tempData['currIcon'] = 'icon-uniE65F';
            tempData['distance'] = " current position ";
            tempData['angelText'] = " start off ";
            tempData['nextIcon'] = station.nextIcon;
            speakText = "从" + tempData['distance'] + tempData['angelText'];
        } else if (station.type === "2") {
            tempData['currIcon'] = station.angelIcon;
            tempData['distance'] = Math.ceil(station.distance); //Math.ceil(station.distance);
            tempData['angelText'] = station.angelText;
            tempData['nextIcon'] = station.nextIcon;
            //naviTipInfo.addSegment(tempData, 2);
            dis = tempData['distance'];

            if(tempData['angelText'] == "go straight"){
                speakText = tempData['angelText'] + " ahead for "+dis+" meters";
            }if(tempData['angelText']=="straight ahead on the left" || tempData['angelText'] == "straight ahead on the right"){
                speakText = tempData['angelText'];
            }
            else{
                speakText = tempData['angelText'] +" after "+ dis + "meters";
            }

            if (dis < 5) {
                speakText = "none";
            } else if (dis < minSpeakDistance) {
                speakText = tempData['angelText']+" ahead ";
            }
        } else if (station.type === "3") {
            tempData['currIcon'] = station.angelIcon;
            tempData['distance'] = Math.ceil(station.distance); //Math.ceil(station.distance);
            tempData['angelText'] = station.targetName;
            tempData['nextIcon'] = station.nextIcon;
            tempData['floor'] = station.floor;
            //naviTipInfo.addSegment(tempData, 3);
            dis = tempData['distance'];

            if (dis < minSpeakDistance) {
                speakText += "ahead to the" + tempData['angelText'];
            } else {
                speakText += " " +dis + " meters ahead to the " + tempData['angelText'];
            }

        } else if (station.type === "4") {

            tempData['currIcon'] = station.angelIcon;
            tempData['angelText'] = station.targetName;
            tempData['endType'] = RouteParseHelper.directionUpOrDown(station.angelIcon,"En");
            tempData['nextIcon'] = station.nextIcon;
            tempData['floorName'] = floorInfo["floorCnName"] ||floorInfo["flcnname"] ||floorInfo["flname"] || floorInfo["floorName"];
            var nextFloor = naviRoute.naviCore.mapAPI._getFloorInfo(naviRoute.bdid,station.nextFloor);
            tempData['nextFloorName'] = nextFloor["floorCnName"] || nextFloor["flcnname"]||nextFloor['flname']||nextFloor["floorName"];
            tempData['byWay'] = RouteParseHelper.getTargetbyWay(station.angelIcon,"En");
            speakText = tempData['byWay'] +"the"+ tempData['angelText'] + tempData['endType'] + "the " + tempData['nextFloorName'];
        } else if (station.type === "5") {

            tempData['currIcon'] = station.angelIcon;
            tempData['distance'] = Math.ceil(station.distance);
            tempData['angelText'] = station.angelText;
            tempData['nextIcon'] = station.nextIcon;
            tempData['floorName'] = floorInfo["floorCnName"] ||floorInfo["flcnname"] ||floorInfo["flname"]|| floorInfo["floorName"];
            var dis = tempData['distance'];

            speakText = " You have reached " + tempData['floorName'];

            if (dis < minSpeakDistance) {
                speakText += " "+tempData['angelText'] + " ahead";
            } else {
                // speakText += ",前方" + dis + "米" + tempData['angelText'];
                if(tempData['angelText'] == "go straight"){
                    speakText += " "+tempData['angelText'] + " ahead for "+dis+" meters";
                }if(tempData['angelText']=="straight ahead on the left" || tempData['angelText'] == "straight ahead on the right"){
                    speakText += " "+tempData['angelText'];
                }
                else{
                    speakText += " "+ tempData['angelText'] +" after "+ dis + " meters";
                }
            }


        } else if (station.type === "8") {
            tempData['currIcon'] = station.angelIcon;
            tempData['distance'] = Math.ceil(station.distance); //Math.ceil(station.distance);
            tempData['angelText'] = station.targetName;
            var dis = tempData['distance'];


        }
        return speakText;
    };
    var geneLevel0NaviText = function(naviRoute, station1, station2, defaultData) {
        var tempData1 = navi_utils.copyData(defaultData),
            tempData2 = navi_utils.copyData(defaultData);
        var speakText = "";
        var machineHeading = naviRoute.naviCore.machineHeading,
            position1 = station1.position,
            position2 = station2.position;
        var angel = RouteParseHelper.getAngel(machineHeading, position1[0], position1[1], position2[0], position2[1]);
        var angelText = RouteParseHelper.getAngelText2(angel);
        var currentFloorInfo = naviRoute.naviCore.mapAPI._getFloorInfo(naviRoute.bdid,station1.floor);
        var nextFloorInfo = naviRoute.naviCore.mapAPI._getFloorInfo(naviRoute.bdid,station2.floor);
        switch (station1.type) {
            case "2":
                speakText = "请您从现在位置前往";
                if (station2.type == 4) {
                    speakText += angelText;
                    speakText += station2.targetName;
                } else if (station2.type == 8) {
                    speakText += (currentFloorInfo["floorCnName"] || currentFloorInfo["floorName"]) + (naviRoute.targetName || station2.targetName);
                }
                break;
            case "3":
                tempData1['currIcon'] = station1.angelIcon;
                tempData1['distance'] = Math.ceil(station1.distance); //Math.ceil(station.distance);
                tempData1['angelText'] = station1.targetName;
                tempData1['nextIcon'] = station1.nextIcon;
                tempData1['floor'] = station1.floor;
                //naviTipInfo.addSegment(tempData, 3);
                dis = tempData1['distance'];
                if (dis == "2") {
                    time = "两"
                }
                if (dis < minSpeakDistance) {
                    speakText += "前方到" + tempData1['angelText'];
                } else {
                    speakText += "前方" + dis + "米,到" + tempData1['angelText'];
                }
                var nextFloorInfo = naviRoute.naviCore.mapAPI._getFloorInfo(naviRoute.bdid,station2.nextFloor);
                tempData2['currIcon'] = station2.angelIcon;
                tempData2['angelText'] = station2.targetName;
                tempData2['endType'] = RouteParseHelper.directionUpOrDown(station2.angelIcon);
                tempData2['nextIcon'] = station2.nextIcon;
                tempData2['floorName'] = nextFloorInfo["floorCnName"]|| nextFloorInfo["flcnname"]||nextFloorInfo["flname"]||nextFloorInfo["floorName"];
                tempData2['byWay'] = RouteParseHelper.getTargetbyWay(station2.angelIcon);
                speakText += tempData2['byWay'] + tempData2['angelText'] + tempData2['endType'] + "到达" + tempData2['floorName'];
                break;
            case "4":
                tempData1['currIcon'] = station1.angelIcon;
                tempData1['angelText'] = station1.targetName;
                tempData1['endType'] = RouteParseHelper.directionUpOrDown(station1.angelIcon);
                tempData1['nextIcon'] = station1.nextIcon;
                tempData1['floorName'] = nextFloorInfo["floorCnName"]|| nextFloorInfo["flcnname"]||nextFloorInfo["flname"]||nextFloorInfo["floorName"];
                tempData1['byWay'] = RouteParseHelper.getTargetbyWay(station1.angelIcon);
                speakText = tempData1['byWay'] + tempData1['angelText'] + tempData1['endType'] + "到达" + tempData1['floorName'];
                break;
            case "5":
                speakText = "请您从当前位置前往";
                if (station2.type == 4) {
                    speakText += angelText;
                    speakText += station2.targetName;
                } else if (station2.type == 8) {
                    var nextFloorName = nextFloorInfo["floorCnName"]|| nextFloorInfo["flcnname"]||nextFloorInfo["flname"]||nextFloorInfo["floorName"];;
                    speakText += nextFloorName + (naviRoute.targetName || station2.targetName || "目的地");
                }
                break;
            case "8":
                if ((naviRoute.naviCore.routeState == ROUTE_HAS_HEAD_TAIL) || (naviRoute.naviCore.routeState == ROUTE_HAS_TAIL)) {
                    speakText = "您已到达目的地附近本次导航结束";
                }
            default:
                break;
        }
        return speakText;
    };
    var geneLevel0NaviTextEn = function(naviRoute, station1, station2, defaultData) {
        var tempData1 = navi_utils.copyData(defaultData),
            tempData2 = navi_utils.copyData(defaultData);
        var speakText = "";
        var machineHeading = naviRoute.naviCore.machineHeading,
            position1 = station1.position,
            position2 = station2.position;
        var angel = RouteParseHelper.getAngel(machineHeading, position1[0], position1[1], position2[0], position2[1]);
        var angelText = RouteParseHelper.getAngelText2(angel,"En");
        var currentFloorInfo = naviRoute.naviCore.mapAPI._getFloorInfo(naviRoute.bdid,station1.floor);
        var nextFloorInfo = naviRoute.naviCore.mapAPI._getFloorInfo(naviRoute.bdid,station2.floor);
        switch (station1.type) {
            case "2":
                speakText = "Please start off from current position ";
                if (station2.type == 4) {
                    speakText += angelText;
                    speakText += " " + station2.targetName;
                } else if (station2.type == 8) {
                    speakText += (currentFloorInfo["floorCnName"] || currentFloorInfo["floorName"]) + (naviRoute.targetName || station2.targetName);
                }
                break;
            case "3":
                tempData1['currIcon'] = station1.angelIcon;
                tempData1['distance'] = Math.ceil(station1.distance); //Math.ceil(station.distance);
                tempData1['angelText'] = station1.targetName;
                tempData1['nextIcon'] = station1.nextIcon;
                tempData1['floor'] = station1.floor;
                //naviTipInfo.addSegment(tempData, 3);
                dis = tempData1['distance'];

                if (dis < minSpeakDistance) {
                    speakText += " ahead to the " + tempData1['angelText'];
                } else {
                    speakText += " " + dis + "meters ahead to the " + tempData1['angelText'];
                }
                var nextFloorInfo = naviRoute.naviCore.mapAPI._getFloorInfo(naviRoute.bdid,station2.nextFloor);
                tempData2['currIcon'] = station2.angelIcon;
                tempData2['angelText'] = station2.targetName;
                tempData2['endType'] = RouteParseHelper.directionUpOrDown(station2.angelIcon,"En");
                tempData2['nextIcon'] = station2.nextIcon;
                tempData2['floorName'] = nextFloorInfo["floorCnName"];
                tempData2['byWay'] = RouteParseHelper.getTargetbyWay(station2.angelIcon,"En");
                speakText += tempData2['byWay'] +"the"+ tempData2['angelText'] + tempData2['endType'] + "the " + (nextFloorInfo["floorCnName"] || nextFloorInfo["floorName"]);
                break;
            case "4":
                tempData1['currIcon'] = station1.angelIcon;
                tempData1['angelText'] = station1.targetName;
                tempData1['endType'] = RouteParseHelper.directionUpOrDown(station1.angelIcon,"En");
                tempData1['nextIcon'] = station1.nextIcon;
                tempData1['floorName'] = nextFloorInfo["floorCnName"];
                tempData1['byWay'] = RouteParseHelper.getTargetbyWay(station1.angelIcon,"En");
                speakText = tempData1['byWay'] +"the"+ tempData1['angelText'] + tempData1['endType'] + "the " + (nextFloorInfo["floorCnName"] || nextFloorInfo["floorName"]);
                break;
            case "5":
                speakText = "Please start off from current position ";
                if (station2.type == 4) {
                    speakText += angelText;
                    speakText += " "+ station2.targetName;
                } else if (station2.type == 8) {
                    speakText += " "+ nextFloorInfo["floorCnName"] + " " +(naviRoute.targetName || station2.targetName || "destination");
                }
                break;
            case "8":
                if ((naviRoute.naviCore.routeState == ROUTE_HAS_HEAD_TAIL) || (naviRoute.naviCore.routeState == ROUTE_HAS_TAIL)) {
                    speakText = endText;
                }
            default:
                break;
        }
        return speakText;
    };
    /**
     * Parse Geometry
     * @param naviRoute
     * @param info
     * @param index
     * @param floorCount
     */
    var parseGeometry = function(naviRoute, info, index, floorCount,language) {
        var curfloor = info['floor'];
        var geometry = info['geometry'];

        var floorObject = naviRoute.createFloorObject(curfloor, index);

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

        if (index === 0) {
            var Ax = navi_utils.getVector(geometry, 0); //geometry[0];
            DXMapUtils.extendObj(Ax,geometry);
            var Bx = navi_utils.getVector(geometry, 1); //geometry[1];
            DXMapUtils.extendObj(Bx,geometry);

            // naviRoute.stations[1].heading = navi_utils.getAngle(Ax, Bx);
            //calcHeading
            naviRoute.stations[1].heading = navi_utils.calcHeading(Ax, Bx);

        }
        geometry[0].segment_length = 0;
        geometry.total_length = 0;
        if (geometry.length === 2) {
            var station = {};
            var A = navi_utils.getVector(geometry, 0); //geometry[0];
            // DXMapUtils.extendObj(A,geometry[0]);
            var B = navi_utils.getVector(geometry, 1); //geometry[1];
            // DXMapUtils.extendObj(B,geometry[1]);
            var B_src = geometry[1];
            var segment = [];

            station.type = "3";
            station.action = station_start_func;
            station.angelIcon = "icon-uniE660";
            station.position = [A.x, A.y];
            station.autoPass = false;
            station.segment = segment = [A, B];

            // station.distance = info['segDistance'];
            station.targetName = RouteParseHelper.getTargetName(info,language);
            station.floorObjectIndex = index;
            station.floor = curfloor;
            if (index == floorCount - 1) {
                station.type = "8";
            }else{

                if( geometry["extendType"]){
                    station.extendType = geometry["extendType"];
                    station.useTime = geometry["useTime"];
                }
            }

            B_src.segment_length = B.segment_length = navi_utils.getGeodeticCircleDistance(A, B);

            var C = { x: (A.x + B.x) * 0.5, y: (A.y + B.y) * 0.5 };
            station.arrowSegment = [C, B];
            geometry.total_length = B.segment_length;
            station.distance = geometry.total_length;
            naviRoute.stations.push(station);
            info.stationArray.push(station);
            floorObject.stations.push(station);
        } else {
            ////////////////////////////////////////////
            // > 3
            var geometry_new = [];
            for (var kk = 0; kk < geometry.length; kk++) {
                var tempPt = navi_utils.getVector(geometry, kk); //geometry[i - 1];
                // DXMapUtils.extendObj(tempPt,geometry[kk]);
                geometry_new.push(tempPt);
            }
            var segmentArray = [];
            var segment = [];
            segment.angel = 0;
            segment.segment_length = 0;
            segment.push(navi_utils.getVector(geometry_new, 0));
            segmentArray.push(segment);
            var lastC = null;
            for (var i = 1; i < geometry_new.length - 1; i++) {
                var A = geometry_new[i - 1];
                DXMapUtils.extendObj(A,geometry_new[i-1]);
                var B = geometry_new[i];
                DXMapUtils.extendObj(B,geometry_new[i]);
                var C = geometry_new[i + 1];
                DXMapUtils.extendObj(C,geometry_new[i+1]);
                var A_src = geometry[i - 1];
                var B_src = geometry[i];
                var angel = navi_utils.calcAngel(A, B, C);
                B_src.segment_length = B.segment_length = navi_utils.getGeodeticCircleDistance(A, B);

                var isSplitSegment = true;

                if (i === 1 && B.segment_length < 1.0) {
                    isSplitSegment = false;
                }
                if (i === geometry_new.length - 2) {
                    C.segment_length = navi_utils.getGeodeticCircleDistance(B, C);
                    if (C.segment_length < 1.0) {
                        isSplitSegment = false;
                    }
                }

                if (Math.abs(angel) > 32 && isSplitSegment) {
                    segment.push(B);
                    segment.angel = angel;
                    segment.segment_length += B.segment_length;
                    segment.next_pt = C;
                    //lastC = C;
                    segment = [];
                    segment.angel = 0;
                    segment.segment_length = 0;
                    // segment.push(B);
                    segment.push({ x: B.x, y: B.y, segment_length: 0 });
                    // segment.segment_length += B.segment_length;
                    segmentArray.push(segment);
                } else {
                    segment.push(B);
                    segment.segment_length += B.segment_length;
                }
                geometry.total_length += B.segment_length;
            }
            var A = geometry_new[geometry_new.length - 2];
            DXMapUtils.extendObj(A,geometry_new[geometry_new.length - 2]);
            var B = geometry_new[geometry_new.length - 1];
            DXMapUtils.extendObj(B,geometry_new[geometry_new.length - 1]);
            var B_src = geometry[geometry.length - 1];
            B_src.segment_length = B.segment_length = navi_utils.getGeodeticCircleDistance(A, B);
            segment.push(B);
            segment.next_pt = B;
            segment.segment_length += B.segment_length;
            geometry.total_length += B.segment_length;

            ////////////////////////////////////////////////////////////
            if (segmentArray.length === 1) {
                var segment = segmentArray[0];
                var angelDisp = RouteParseHelper.getAngelText(segment.angel,language);
                var newStation = {
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
                    angelText:angelDisp.angelText
                };
                if (index !== floorCount - 1) {
                    newStation.type = "3";
                    newStation.angel = segment.angel;
                    newStation.angelIcon = angelDisp.angelIcon;
                    newStation.angelText = angelDisp.angelText;
                    /*var _data = segment[segment.length - 1][2]?segment[segment.length - 1][2]:segment[segment.length - 1][1];
                    if( _data["extendType"]){
                        newStation.extendType = _data["extendType"];
                        newStation.useTime = _data["useTime"];
                    }*/
                    var _data = segment;
                    if( _data["extendType"]){
                        newStation.extendType = _data["extendType"];
                        newStation.useTime = _data["useTime"];
                    }
                    //  newStation.angelIcon="icon-"+info.endIconType;
                }
                newStation.targetName = RouteParseHelper.getTargetName(info,language);
                newStation.distance = segment.segment_length;

                var tempA = segment[segment.length - 2];
                var curB = segment[segment.length - 1];
                var tempC = segment.next_pt;
                newStation.arrowSegment = [tempA, curB, tempC];

                naviRoute.stations.push(newStation);
                info.stationArray.push(newStation);
                floorObject.stations.push(newStation);
            } else {

                for (var i = 0; i < segmentArray.length - 1; i++) {
                    var segment = segmentArray[i];
                    if (!segment.segment_length) {
                        segment.segment_length = 0;
                        segment.forEach(function(item) {
                            segment.segment_length += item.segment_length;
                        });
                    }
                    if (segment.segment_length === 0) {
                        continue;
                    }
                    var newStation = {
                        type: "2",
                        floorObjectIndex: index,
                        floor: curfloor,
                        angel: 0,
                        autoPass: false,
                        action: station_start_func,
                        position: [segment[0].x, segment[0].y],
                        segment: segment
                    };
                    newStation.arrowSegment = [];
                    if (index !== 0 && i === 0) {
                        newStation.type = "5";
                        // newStation.arrowSegment = segment;
                    }
                    // else {
                    calcArrowSegment(newStation, newStation.segment);
                    // }

                    var angelDisp = RouteParseHelper.getAngelText(segment.angel,language);
                    newStation.angel = segment.angel;
                    newStation.angelIcon = angelDisp.angelIcon;
                    newStation.angelText = angelDisp.angelText;
                    newStation.distance = segment.segment_length;

                    naviRoute.stations.push(newStation);
                    info.stationArray.push(newStation);
                    floorObject.stations.push(newStation);
                }

                //////////////////////////////////////////////
                var segment = segmentArray[segmentArray.length - 1];
                var angelDisp = RouteParseHelper.getAngelText(segment.angel,language);
                var newStation = {
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
                    angelText:angelDisp.angelText
                };
                newStation.targetName = RouteParseHelper.getTargetName(info,language);
                if (index !== floorCount - 1) {
                    newStation.type = "3";
                    // newStation.angel = segment.angel;
                    // newStation.angelIcon = angelDisp.angelIcon;
                    newStation.angelIcon = "icon-"+info.endIconType;
                    newStation.angel = 0;
                    newStation.angelText = "到达"+newStation.targetName;
                    // newStation.angelText = angelDisp.angelText;
                    var _data = segment[segment.length - 1];
                    if( _data["extendType"]){
                        newStation.extendType = _data["extendType"];
                        newStation.useTime = _data["useTime"];
                    }
                    //  newStation.angelIcon="icon-"+info.endIconType;
                }

                newStation.distance = segment.segment_length;
                newStation.arrowSegment = [];
                calcArrowTail(newStation, newStation.segment);
                naviRoute.stations.push(newStation);
                info.stationArray.push(newStation);
                floorObject.stations.push(newStation);
            }

        }
        if (index !== floorCount - 1) {
            var newStation = {
                type: "4",
                floorObjectIndex: index,
                floor: curfloor,
                nextFloor: info.nextFloor,
                angel: 0,
                angelIcon: "icon-" + info.endIconType,
                autoPass: false,
                action: station_start_func,
                // extendType:segment[segment.length - 1]["extendType"],
                // useTime:segment[segment.length - 1]["useTime"],
                position: [segment[segment.length - 1].x, segment[segment.length - 1].y],
                segment: [],
            };
            newStation.targetName = RouteParseHelper.getTargetNameByIconName(info.endIconType,language);
            naviRoute.stations.push(newStation);
            floorObject.stations.push(newStation);
        }

        naviRoute.total_length += floorObject.geometry.total_length;
        // naviRoute.total_length += floorObject.smoothRoute.total_length;
    };

    /**
     * calc Arrow Tail
     * @param newStation
     * @param segment
     */
    var calcArrowTail = function(newStation, segment) {
        var maxTailLength = 10;
        if (segment.segment_length < maxTailLength) {
            //newStation.arrowSegment = segment;
            for (var i = 0; i < segment.length; i++) {
                newStation.arrowSegment.push(segment[i]);
            }
        } else {
            var curPointArray = [];
            var curLength = 0;
            curPointArray.push(segment[segment.length - 1]);
            for (var i = segment.length - 1; i > 0; i--) {
                var curB = segment[i];
                if (curB.segment_length + curLength >= maxTailLength) {
                    var tempA = segment[i - 1];
                    var tempA_v = [tempA.x, tempA.y, 0];
                    var curB_v = [curB.x, curB.y, 0];
                    var tempResult = [0, 0, 0];
                    navi_utils.slerp(tempResult, curB_v, tempA_v, (maxTailLength - curLength) / curB.segment_length);
                    var tempAA = { x: tempResult[0], y: tempResult[1] };
                    curPointArray.push(tempAA);
                    break;
                } else {
                    var tempA = segment[i - 1];
                    curPointArray.push(tempA);
                }
                curLength += curB.segment_length;
            }
            for (var i = curPointArray.length - 1; i >= 0; i--) {
                newStation.arrowSegment.push(curPointArray[i]);
            }
        };
    }

    /**
     * Calc Arrow Head
     * @param newStation
     * @param segment
     */
    var calcArrowHead = function(newStation, segment) {
        var minHeaderLength = 1;
        var maxHeaderLength = 10;
        var next_pt = segment.next_pt;
        var headerLength = next_pt.segment_length;
        if (next_pt.segment_length <= minHeaderLength) {
            headerLength = minHeaderLength;
        } else if (next_pt.segment_length <= maxHeaderLength && next_pt.segment_length > minHeaderLength) {
            headerLength = next_pt.segment_length;
        } else {
            headerLength = maxHeaderLength;
        }
        var curB = segment[segment.length - 1];
        var tempA_v = [next_pt.x, next_pt.y, 0];
        var curB_v = [curB.x, curB.y, 0];
        var tempResult = [0, 0, 0];
        if (next_pt.segment_length === 0) {
            navi_utils.slerp(tempResult, curB_v, tempA_v, (headerLength));
        } else {
            navi_utils.slerp(tempResult, curB_v, tempA_v, (headerLength) / next_pt.segment_length);
        }

        var tempAA = { x: tempResult[0], y: tempResult[1] };
        newStation.arrowSegment.push(tempAA);
    }

    /**
     * Calculate Arrow Segment
     * @param newStation
     * @param segment
     */
    var calcArrowSegment = function(newStation, segment) {
        calcArrowTail(newStation, segment);
        calcArrowHead(newStation, segment);
    }


    /**
     * Get Icon Link
     * @param iconType
     * @returns {string}
     */
    var getIconLink = function(iconType) {
        return "images/" + iconType + ".png";
    }
    var joinPath = function(path1, path2) {
        var args = arguments;
        var url = "";
        args.length > 0 ? (url = args[0] || "") : "";
        for (var i = 1; i < args.length; i++) {
            var _path = args[i];
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

    var createArrow = function(naviRoute, info, routeIndex){
        var floorId = info["floor"];
        var floorObjects = naviRoute.getFloorObject(floorId);
        var floorObject = null;
        floorObjects.forEach(function(item) {
            if (routeIndex == item.routeIndex) {
                floorObject = item;
            }
        });
        if (!floorObject) { return; }
        var factory = naviRoute.naviCore.mapAPI._coreMap.factory;
        var mapSDK = naviRoute.naviCore.mapAPI._coreMap._mapSDK;
        var routeResampler = naviRoute.naviCore.routeResampler;
        for (var ii = 0; ii < info.stationArray.length; ii++) {
            var station = info.stationArray[ii];
            var geometry = station.segment;
            geometry = station.arrowSegment;
            var arrowLines = [];
            for (var i = 0; i < geometry.length; i++) {
                arrowLines.push([geometry[i].x, geometry[i].y]);
            }
            var arrow_geometry2 = routeResampler.resampler(arrowLines);
            if (arrow_geometry2.length > 0) {
                arrow_geometry2 = arrow_geometry2[0];
            } else {
                return;
            }

            var guid = factory.createUUID();
            var assetsPath = naviRoute.naviCore.mapAPI.config.assetsPath;
            var arrow = factory.createArrow(guid, guid,mapSDK, arrow_geometry2, naviRoute.bdid,floorId, joinPath(assetsPath, 'images/arrow_lower.png'), 14, 8, true);
            arrow.visible = false;
            station.arrowObject = arrow;
            floorObject.arrowRenderObjects.push(arrow);
        }
    };
    /**
     * Create Floor Object
     * @param info
     * @returns {*}
     */
    // var createRenderObjects = function(naviRoute, info, routeIndex) {
    //     var floorId = info["floor"];
    //     var currentFloorId = naviRoute.naviCore.mapAPI.cameraCtrl.getCurrentFloorId();
    //     var floorObjects = naviRoute.getFloorObject(floorId);
    //     var floorObject = null;
    //     floorObjects.forEach(function(item) {
    //         if (routeIndex == item.routeIndex) {
    //             floorObject = item;
    //         }
    //     });
    //     if (!floorObject) { return; }
    //     var renderObjects = floorObject.renderObjects;
    //     /////////////////////////////////////////
    //     // Create RenderObject
    //     /////////////////////////////////////////
    //     var factory = naviRoute.naviCore.mapAPI.scene.factory;
    //     var routeResampler = naviRoute.naviCore.routeResampler;

    //     var isVisible = (floorId === currentFloorId);

    //     var back_geometry = info["geometry"];
    //     var lines = [];
    //     for (var i = 0; i < back_geometry.length; i++) {
    //         lines.push([back_geometry[i].x, back_geometry[i].y]);
    //     }

    //     var back_geometry2 = routeResampler.resampler(lines);

    //     if (back_geometry2.length > 0) {
    //         back_geometry2 = back_geometry2[0];
    //     } else {
    //         return;
    //     }


    //     var back_pointString = "";
    //     for (var i = 0; i < back_geometry2.length; i++) {
    //         back_pointString += back_geometry2[i][0] + "," + back_geometry2[i][1] + ",0.49;";
    //     }

    //     var devicePixel = window["devicePixelRatio"];
    //     var _width1 = Math.round(6 * devicePixel);
    //     var _wrapScale = Math.round(4 * devicePixel);
    //     var _width2 = Math.round(5 * devicePixel);

    //     var assetsPath = naviRoute.naviCore.mapAPI.config.assetsPath;
    //     var guid = factory.createUUID();
    //     var bacl_polyline = factory.createPolyline(guid, guid, back_pointString, floorId, joinPath(assetsPath, getIconLink('line_blue')), _width1, _wrapScale, true);
    //     bacl_polyline.setVisible(isVisible);
    //     renderObjects.push(bacl_polyline);
    //     floorObject.bacl_polyline = bacl_polyline;
    //     // 获取图标 poi.png
    //     var guid2 = factory.createUUID();
    //     var polyline = factory.createPolyline(guid2, guid2, back_pointString, floorId, joinPath(assetsPath, 'images/line_arrow.png'), _width1, _wrapScale, true);
    //     polyline.setVisible(isVisible);
    //     renderObjects.push(bacl_polyline);

    //     for (var ii = 0; ii < info.stationArray.length; ii++) {
    //         var station = info.stationArray[ii];
    //         var geometry = station.segment;
    //         geometry = station.arrowSegment;
    //         var arrowLines = [];
    //         for (var i = 0; i < geometry.length; i++) {
    //             arrowLines.push([geometry[i].x, geometry[i].y]);
    //         }

    //         var arrow_geometry2 = routeResampler.resampler(arrowLines);

    //         if (arrow_geometry2.length > 0) {
    //             arrow_geometry2 = arrow_geometry2[0];
    //         } else {
    //             return;
    //         }
    //         pointString = "";
    //         for (var i = 0; i < arrow_geometry2.length; i++) {
    //             pointString += arrow_geometry2[i][0] + "," + arrow_geometry2[i][1] + ",0.5;";
    //         }
    //         var guid = factory.createUUID();
    //         var arrow = factory.createArrow(guid, guid, pointString, floorId, joinPath(assetsPath, 'images/arrow_lower.png'), 14, 8, true);
    //         arrow.setVisible(true);
    //         station.arrowObject = arrow;
    //         floorObject.arrowRenderObjects.push(arrow);
    //     }
    //     /////////////////////////////////////////
    //     // Create Start Icon
    //     ////////////////////////////////////////
    //     ;
    //     var geometry = info["geometry"];

    //     var iconLink = joinPath(assetsPath, getIconLink(info.startIconType)); //'map_js/images/start.png'
    //     // var startMarker = factory.createRouteMarker(guid, guid, position.x, position.y, 1, floorId, iconLink );
    //     // info.startIconType
    //     var imageUrl = joinPath(assetsPath, mapPoiStyle.image);
    //     // 路线状态
    //     var routeState = naviRoute.naviCore.routeState;
    //     var iconType = info.startIconType;
    //     if (iconType == "start" && ((routeState == ROUTE_HAS_NONE) || (routeState == ROUTE_HAS_TAIL))) {
    //         iconType = "huan_start";
    //     }
    //     var position = geometry[0];
    //     var guid = factory.createUUID();
    //     var range1 = mapPoiStyle.poiRangeList[iconType];
    //     // var startMarker = factory.createRouteMarker(guid, guid, position.x, position.y, 1, floorId, imageUrl, imageUrl, range1, range1);
    //     // startMarker.setVisible(isVisible);
    //     var scale = window["routeMarkerScale"] || 1.0;
    //     var startMarker = factory.createRouteMarker(guid, guid, position.x, position.y, 1, floorId, imageUrl, imageUrl, range1, range1,scale);

    //     // var startMarker = factory.createRouteMarker(guid, guid, position.x, position.y, 1, floorId, imageUrl, imageUrl, range1, range1);

    //     // createMarker(naviRoute, isVisible, renderObjects, factory, info, routeIndex, routeState, iconType, floorId, position, imageUrl, naviRoute.naviCore.mapAPI);


    //     /////////////////////////////////////////
    //     // Create End Icon
    //     ////////////////////////////////////////
    //     var iconType = info.endIconType;
    //     if (iconType == "end" && ((routeState == ROUTE_HAS_NONE) || (routeState == ROUTE_HAS_HEAD))) {
    //         iconType = "huan_end";
    //     }
    //     position = geometry[geometry.length - 1];
    //     var range2 = mapPoiStyle.poiRangeList[iconType];
    //     var guid = factory.createUUID();
    //     scale = window["routeEndMarker"] || scale;
    //     // iconLink = assetsPath + getIconLink(info.endIconType);//'map_js/images/end.png'
    //     // var endMarker = factory.createMarker(guid, guid, position.x, position.y, 1, floorId, iconLink );
    //     var endMarker = factory.createRouteMarker(guid, guid, position.x, position.y, 1, floorId, imageUrl, imageUrl, range2, range2,scale);

    //     // var range2 = mapPoiStyle.poiRangeList[iconType];
    //     // // iconLink = assetsPath + getIconLink(info.endIconType);//'map_js/images/end.png'
    //     // // var endMarker = factory.createMarker(guid, guid, position.x, position.y, 1, floorId, iconLink );
    //     // var endMarker = factory.createRouteMarker(guid, guid, position.x, position.y, 1, floorId, imageUrl, imageUrl, range2, range2);


    //     // var range2 = mapPoiStyle.poiRangeList[iconType];
    //     // var guid = factory.createUUID();
    //     // var endMarker = factory.createRouteMarker(guid, guid, position.x, position.y, 1, floorId, imageUrl, imageUrl, range2, range2);
    //     // endMarker.setVisible(isVisible);
    //     // renderObjects.push(startMarker);
    //     // renderObjects.push(endMarker);
    //     // createMarker(naviRoute, isVisible, renderObjects, factory, info, routeIndex, routeState, iconType, floorId, position, imageUrl, naviRoute.naviCore.mapAPI);


    //     floorObject.geometry = geometry;
    //     floorObject.setVisible(isVisible);

    //     naviRoute.naviCore.mapAPI._coreMap["enginApi"]["forceRedraw"]();

    //     return floorObject;
    // };
    var createIconMarker = function(mapAPI,renderObjects,floorId,iconType,position){
        var assetsPath = mapAPI.config.assetsPath;
        var imageUrl = joinPath(assetsPath, mapPoiStyle.image);
        var factory = mapAPI.scene.factory;
        var guid = factory.createUUID();
        var range = mapPoiStyle.poiRangeList[iconType];
        var marker = factory.createRouteMarker(guid, guid, position.x, position.y, 1, floorId, imageUrl, imageUrl, range, range);
        var isVisible = (mapAPI.cameraCtrl.getCurrentFloorId() == floorId);
        marker.setVisible(isVisible);
        renderObjects.push(marker);
        return marker;
    };
    // var createMarker = function(naviRoute, isVisible, renderObjects, factory, info, routeIndex, routeState, iconType, floorId, position, imageUrl, mapAPI) {
    //     var guid = factory.createUUID();
    //     var range = mapPoiStyle.poiRangeList[iconType];
    //     if (iconType.indexOf("start") != -1 || iconType.indexOf("end") != -1 || iconType.indexOf("out") != -1) {
    //         var marker = factory.createRouteMarker(guid, guid, position.x, position.y, 1, floorId, imageUrl, imageUrl, range, range);
    //         marker.setVisible(isVisible);
    //         renderObjects.push(marker);
    //         return marker;
    //     }
    //     var text = "";

    //     text += "请由此前往" + naviRoute.targetFloorCnName + (naviRoute.targetName || "目的地");
    //     var canvas = document.createElement("canvas");
    //     canvas.width = 256; //window.devicePixelRatio * 128;
    //     canvas.height = 128; //window.devicePixelRatio * 60;
    //     var context = canvas.getContext("2d");
    //     // 文字描述
    //     var iconFont = config.get("changeIconFont") || {};
    //     var _devicePixelRatio = window["devicePixelRatio"];
    //     context.font = ((iconFont["size"] || 8) * _devicePixelRatio + "px ") + (iconFont["name"] || 'Arial');
    //     context.fillStyle = iconFont["style"] || "#333";
    //     var oneTextSize = context.measureText("一")["width"];
    //     var halfSize = Math.ceil(text.length * 0.5);
    //     textSize = oneTextSize * halfSize;
    //     var iconHeight = oneTextSize * 3;
    //     var iconWidth = oneTextSize * 2.8;
    //     var contentHeight = oneTextSize * 3.4;
    //     var contentWidth = oneTextSize * 1 + textSize;
    //     var radius = 10;
    //     canvas.width = Math.pow(2, Math.ceil(Math["log2"](contentWidth + iconWidth)));
    //     canvas.height = Math.pow(2, Math.ceil(Math["log2"](contentHeight)));
    //     var startY = canvas.height - contentHeight;
    //     var contentBottomY = startY + iconHeight;
    //     // 背景色
    //     context.fillStyle = "rgba(255,0,0,0)";
    //     context.fillRect(0, 0, canvas.width, canvas.height);
    //     // 左侧图标背景色
    //     drawRoundRect2(context, 0, startY, iconWidth, iconHeight, radius, 0, 0, radius);
    //     context.fillStyle = "#00f"; //"#a6cff3";
    //     context.fill();
    //     // 右侧背景色
    //     drawRoundRect2(context, iconWidth, startY, contentWidth, iconHeight, 0, radius, radius, 0);
    //     context.fillStyle = "#fff";
    //     context.fill();
    //     // 圆角border
    //     drawRoundRect2(context, 0, startY, iconWidth + contentWidth, iconHeight, radius, radius, radius, radius);
    //     // context.strokeStyle = "#0078AA";
    //     context.strokeStyle = "#00a";
    //     context.stroke();

    //     // drawTrangle(context, [iconWidth * 0.33, iconHeight], [iconWidth * 0.67, iconHeight], [iconWidth * 0.5, contentHeight]);
    //     drawTrangle(context, [iconWidth * 0.33, contentBottomY], [iconWidth * 0.67, contentBottomY], [iconWidth * 0.5, canvas.height]);
    //     context.fillStyle = "#333";
    //     context.font = ((iconFont["size"] || 8) * _devicePixelRatio + "px ") + (iconFont["name"] || 'Arial');
    //     text && context.fillText(text.slice(0, halfSize), iconWidth + oneTextSize * 0.5, startY + oneTextSize * 1.2);
    //     text && context.fillText(text.slice(halfSize), iconWidth + oneTextSize * 0.5, startY + oneTextSize * 2.5);
    //     var offsetX = Math.floor((iconWidth - canvas.width)); //*0.5*_devicePixelRatio
    //     var offsetY = 0; //Math.floor(contentHeight - canvas.height);
    //     var iconOffset = [
    //         [offsetX, offsetY],
    //         [offsetX, offsetY]
    //     ];
    //     var image = new Image();
    //     image.onload = function() {
    //         context.drawImage(this, 0, 0, this.width, this.height, oneTextSize * 0.4, startY + oneTextSize * 0.5, oneTextSize * 2, oneTextSize * 2);
    //         var marker = factory.createMarkerByCanvas(guid, guid, position.x, position.y, 1, floorId, canvas, canvas, iconOffset);
    //         // marker.setVisible(isVisible);
    //         renderObjects.push(marker);
    //         mapAPI._coreMap["enginApi"]["forceRedraw"]();
    //     };
    //     var url = mapAPI.config.assetsPath + "/images/" + iconType + ".png";
    //     image.src = url;

    //     function drawTrangle(context, point1, point2, point3) {
    //         var region = new Path2D();
    //         region.moveTo(point1[0], point1[1]);
    //         region.lineTo(point2[0], point2[1]);
    //         region.lineTo(point3[0], point3[1]);
    //         region.closePath();
    //         context.fillStyle = "#00e";
    //         context.fill(region);
    //     }

    //     function drawRoundRect2(cxt, x, y, width, height, leftTopRadius, rightTopRadius, rightBottomRadius, leftBottomRadius) {
    //         leftTopRadius = leftTopRadius || 0;
    //         rightTopRadius = rightTopRadius || 0;
    //         rightBottomRadius = rightBottomRadius || 0;
    //         leftBottomRadius = leftBottomRadius || 0;
    //         cxt.beginPath();
    //         cxt.arc(x + leftTopRadius, y + leftTopRadius, leftTopRadius, Math.PI, Math.PI * 3 / 2);
    //         cxt.lineTo(width - rightTopRadius + x, y);
    //         cxt.arc(width - rightTopRadius + x, rightTopRadius + y, rightTopRadius, Math.PI * 3 / 2, Math.PI * 2);
    //         cxt.lineTo(width + x, height + y - rightBottomRadius);
    //         cxt.arc(width - rightBottomRadius + x, height - rightBottomRadius + y, rightBottomRadius, 0, Math.PI * 1 / 2);
    //         cxt.lineTo(leftBottomRadius + x, height + y);
    //         cxt.arc(leftBottomRadius + x, height - leftBottomRadius + y, leftBottomRadius, Math.PI * 1 / 2, Math.PI);
    //         cxt.closePath();
    //     }
    //     return marker;
    // }

    /**
     * Parse Stations
     * @param naviRoute
     * @param path
     * @param roadCorssData
     */
    var parseStations = function(naviRoute, path, roadCorssData,language) {
        if (path['naviInfoList'].length == 0) return;
        var curFloor = path['naviInfoList'][0]["floor"];

        //////////////////////////////////////////////
        // xxxx在四楼北侧，请步行和乘坐电梯前往
        {
            var station = {};
            station.type = "0";
            station.action = station_start_func;
            station.position = [path['start']['x'], path['start']['y']];
            station.autoPass = true;
            station.floorObjectIndex = 0;
            station.floor = curFloor;
            station.distance = 0;
            naviRoute.stations.push(station);
            //naviRoute.floorObjects[station.floorObjectIndex].stations.push(station);
        }
        //////////////////////////////////////////////
        //
        {
            var station = {};
            station.type = "1";
            station.action = station_start_func;
            station.position = [path['start']['x'], path['start']['y']];
            station.autoPass = true;
            station.floorObjectIndex = 0;
            station.floor = curFloor;
            naviRoute.stations.push(station);
            //naviRoute.floorObjects[station.floorObjectIndex].stations.push(station);
        }
        //////////////////////////////////////////////
        // Path数据
        var naviInfoList = path['naviInfoList'].slice();
        if (naviInfoList.length === 0) return;
        naviRoute.total_length = 0;

        var length = naviInfoList.length;
        //为友谊医院做楼梯或扶梯中间路线忽略
        // length=navi_route_parser.mergeRoute(naviInfoList);
        var _startFloor = naviInfoList[0]['floor'];
        var _endFloor = naviInfoList[length - 1]['floor'];
        // var toTargetDesc = "请";
        for (var i = 0; i < naviInfoList.length; i++) {
            var info = naviInfoList[i];
            if (i + 1 < length) {
                info.nextFloor = naviInfoList[i + 1]['floor'];
            }
            parseGeometry(naviRoute, info, i, length,language);
            attachRoadCrossStations(naviRoute, roadCorssData);

        }
        // naviRoute.targetFloorCnName = hospital3D.utils.getCnNameByFloorId(info.floor) || "";
        naviRoute.targetFloorCnName = ""+ info.floor || "";
        naviRoute.naviInfoList = naviInfoList;
        for (var i = 0; i < naviInfoList.length; i++) {
            var info = naviInfoList[i];
            // createRenderObjects(naviRoute, info, i);
            createArrow(naviRoute, info, i);
        }
    }

    /**
     * Merge Route
     * @param mergeRouteList
     * @returns {*}
     */
    var mergeRoute = function(mergeRouteList) {
        var length = mergeRouteList.length;
        if (length < 3) return length;
        var type = mergeRouteList[0]['action'];
        for (var i = 1; i < mergeRouteList.length - 1; i++) {
            if (mergeRouteList[i]['action'] === type) {
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
    var mergeStation = function(naviRoute, _startFloor, _endFloor) {
        _startFloor = parseInt(_startFloor);
        _endFloor = parseInt(_endFloor);
        for (var i = 0; i < naviRoute.stations.length; i++) {
            var station = naviRoute.stations[i];
            var _num = station.floor + 1;
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
    var attachRoadCrossStations = function(naviRoute, roadResult) {
        if (!roadResult) return;
        var result = roadResult["CrossImageResult"];
        //if(!result||result[0]===null) return;
        if (!result) return;
        var roadCrossArray = [];

        var returnValue = null;
        var length = result.length;
        for (var i = 0; i < length; i++) {
            var fl = result[i];
            if (fl === null) continue;
            var len = fl['Result'].length;
            for (var j = 0; j < len; j++) {
                floorObj = {};
                floorObj.Result = null;
                floorObj.floor = fl['floor'];
                floorObj.floorNum = navi_utils.getRealFloorNumbyFloorId(floorObj.floor);

                fl['Result'][j]['floorName'] = floorObj.floor;
                floorObj.Result = fl['Result'][j];
                floorObj.Result.url = roadResult['baseUrl'] + floorObj.floor + "/" + floorObj.Result['imagePath'];
                floorObj.position = [fl['Result'][j]['Lon'], fl['Result'][j]['Lat']];
                roadCrossArray.push(floorObj);
            }
        }

        function pointToSegment(point, segment, intersectResult) {
            var pos_ecef = [0, 0, 0];
            var pos_sphr = [point.x * DEGREE_TO_RADIAN, point.y * DEGREE_TO_RADIAN, earthRadius];
            navi_utils.transformGeographicToECEF(pos_ecef, pos_sphr);
            var tempResult = { minDistance: Infinity, nearestPt: undefined };
            var retVal = false;
            for (var j = 0; j < segment.length - 1; j++) {
                var a_sphr = [segment[j].x * DEGREE_TO_RADIAN, segment[j].y * DEGREE_TO_RADIAN, earthRadius];
                var b_sphr = [segment[j + 1].x * DEGREE_TO_RADIAN, segment[j + 1].y * DEGREE_TO_RADIAN, earthRadius];
                var a_ecef = [0, 0, 0];
                var b_ecef = [0, 0, 0];
                var root_ecef = [0, 0, 0];
                navi_utils.transformGeographicToECEF(a_ecef, a_sphr);
                navi_utils.transformGeographicToECEF(b_ecef, b_sphr);
                var tempDistance = navi_utils.pointToLine(pos_ecef, a_ecef, b_ecef, root_ecef);
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
            var length = route.stations.length;
            var pt = { x: roadCrossObject.position[0], y: roadCrossObject.position[1] };

            var retVal = false;
            for (var i = 0; i < length; i++) {
                var station = naviRoute.stations[i];
                if (!station.segment || station.segment.length == 0 || (station.type !== '2' && station.type !== '3' && station.type !== '8' && station.type !== '5')) continue;
                if (station.floor !== roadCrossObject.floor) continue;
                var tempResult = { minDistance: Infinity, nearestPt: undefined };
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

        for (var x = 0; x < roadCrossArray.length; x++) {
            var roadCrossObject = roadCrossArray[x];
            var retResult = { minDistance: Infinity, nearestPt: undefined, station: undefined };
            if (pointToRoute(roadCrossObject, naviRoute, retResult)) {
                var roadInfo = {};
                roadInfo.nearestPt = retResult.nearestPt;
                roadInfo.result = roadCrossObject;
                retResult.station.roadInfo = roadInfo;
            }

        }
    };

    return thisObject;
}

//////////////////////////////////////////////////////////
// RouteParseHelper
//////////////////////////////////////////////////////////
var RouteParseHelper = (function() {
    var thisObject = {};
    var navi_utils = daximap["DXMapUtils"]["naviMath"];

    thisObject.setlocationToSystem = function(e) {
        return;

        var offsetPos = [0, 0];
        var loc = {
            floorCnName: navi_utils.getCnNameByFloorId(e.location.z),
            floorName: navi_utils.getFloorNameByFloorId(e.location.z),
            floorNum: e.location.z,
            floorId: e.location.z,
            position: [e.location.x, e.location.y],
            direction: e.location.a
        };
        thisObject.naviCore.locationManager.locationManager._set(loc);
    }

    thisObject.station_start_func = function() {}
        /**
         * Parse Arrive Methods
         * @param arriveMethods
         * @param path
         */
    thisObject.parseArriveMethods = function(arriveMethods, path,language) {
        if(language == "En"){
            return thisObject.parseArriveMethodsByEn(arriveMethods, path);
        }
        var naviInfoList = path["naviInfoList"];
        for (var i = 0; i < naviInfoList.length; i++) {
            var info = naviInfoList[i];
            if (info["action"] === "0x03") {
                arriveMethods["out_down_dt"] = arriveMethods["out_up_dt"] = arriveMethods["down_dt"] = arriveMethods["up_dt"] = arriveMethods["icon-zhiti"] = "乘坐电梯";
            } else if (info["action"] === "0x04") {
                arriveMethods["out_down_lt"] = arriveMethods["out_up_lt"] = arriveMethods["down_lt"] = arriveMethods["up_lt"] = arriveMethods["icon-buti"] = "走楼梯";
            } else if (info["action"] === "0x05") {
                arriveMethods["out_down_ft"] = arriveMethods["out_up_ft"] = arriveMethods["down_ft"] = arriveMethods["up_ft"] = arriveMethods["icon-futi"] = "乘坐扶梯";
            } else if (info["action"] === "0x00") {}
        }
        arriveMethods["icon_bx"] = "步行";
    }
    thisObject.parseArriveMethodsByEn =  function(arriveMethods, path) {
        var naviInfoList = path["naviInfoList"];
        for (var i = 0; i < naviInfoList.length; i++) {
            var info = naviInfoList[i];
            if (info["action"] === "0x03") {
                arriveMethods["icon-zhiti"] = " Take the elevator ";
            } else if (info["action"] === "0x04") {
                arriveMethods["icon-buti"] = " Take the stairs ";
            } else if (info["action"] === "0x05") {
                arriveMethods["icon-futi"] = " Take the escalator ";
            } else if (info["action"] === "0x00") {}
        }
        arriveMethods["icon_bx"] = " walk ";
    }


    /**
     * parse Icon Type
     * @param path
     */
    thisObject.parseIconType = function(path) {
        var naviInfoList = path["naviInfoList"];
        if (naviInfoList.length > 0);
        var currinfo = naviInfoList[0];
        var lastInfo = currinfo;
        currinfo.startIconType = "start";
        for (var i = 1; i < naviInfoList.length; i++) {
            lastInfo = currinfo;
            currinfo = naviInfoList[i];
            var prevFloorNum = navi_utils.getRealFloorNumbyFloorId(lastInfo["floor"]);
            var currFloorNum = navi_utils.getRealFloorNumbyFloorId(currinfo["floor"]);
            if (prevFloorNum < currFloorNum) {
                var iconType = thisObject.getIconTypeInfo(lastInfo["action"]);
                lastInfo.endIconType = "up_" + iconType;
                currinfo.startIconType = "out_up_" + iconType;
            } else if (prevFloorNum > currFloorNum) {
                var iconType = thisObject.getIconTypeInfo(lastInfo["action"]);
                lastInfo.endIconType = "down_" + iconType;
                currinfo.startIconType = "out_down_" + iconType;
            } else if (prevFloorNum == currFloorNum) {
                var iconType = thisObject.getIconTypeInfo(lastInfo["action"]);
                lastInfo.endIconType = "down_" + iconType;
                currinfo.startIconType = "out_down_" + iconType;
            }

        }
        currinfo = naviInfoList[naviInfoList.length - 1];
        currinfo.endIconType = "end";
    }

    /**
     * get Icon Type Info
     * @param action
     * @returns {string}
     */
    thisObject.getIconTypeInfo = function(action) {
        if (action === "0x03") { // "乘坐电梯"
            return "dt";
        } else if (action === "0x04") { //"走楼梯";
            return "lt";
        } else if (action === "0x05") { //"乘坐扶梯";
            return "ft";
        } else if (action === "0x00") {}
    }

    /**
     * Get Target Name
     * @param info
     * @returns {string}
     */
    thisObject.getTargetName = function(info,language) {
        if(language == "En"){
            return thisObject.getTargetNameEn(info);
        }
        if (info["action"] === "0x03") {
            return "电梯";
        } else if (info["action"] === "0x04") {
            return "楼梯";
        } else if (info["action"] === "0x05") {
            return "扶梯";
        } else if (info["action"] === "0x00") {
            return "";
        } else if (info["action"] === "0x06") {
            return "目的地";
        }
    };
    thisObject.getTargetNameEn = function(info) {

        if (info["action"] === "0x03") {
            return " elevator ";
        } else if (info["action"] === "0x04") {
            return " stair ";
        } else if (info["action"] === "0x05") {
            return " escalator ";
        } else if (info["action"] === "0x00") {
            return "";
        } else if (info["action"] === "0x06") {
            return " destination ";
        }
    };
    /**
     * Get Target Name by Icon Name
     * @param iName
     * @returns {string}
     */
    thisObject.getTargetNameByIconName = function(iName,language) {
        if (iName.indexOf('dt') !== -1) {
            if(language == "En"){
                return " elevator ";
            }
            return '电梯';
        } else if (iName.indexOf('lt') !== -1) {
            if(language == "En"){
                return " stair ";
            }
            return '楼梯'
        } else if (iName.indexOf('ft') !== -1) {
            if(language == "En"){
                return " escalator ";
            }
            return '扶梯'
        }
    };

    /**
     * Get Type by Icon Name
     * @param iName
     * @returns {string}
     */
    thisObject.getTypeByIconName = function(iName) {
        if (iName.indexOf('dt') !== -1) {
            return 'zhiti';
        } else if (iName.indexOf('lt') !== -1) {
            return 'louti'
        } else if (iName.indexOf('ft') !== -1) {
            return 'futi'
        }
    };

    thisObject.getDirByIconName = function(type) {
        var dir = "up";
        var typename = type.split("_");
        if (typename.length == 2) {
            dir = typename[0].split("-")[1];
        } else {
            dir = typename[0].split("-")[1] + typename[1];
        }
        return dir;
    }

    /**
     * get Target By Way
     * @param iName
     * @returns {string}
     */
    thisObject.getTargetbyWay = function(iName,language) {
        if (iName.indexOf('dt') !== -1 || iName.indexOf('ft') !== -1) {
            if(language == "En"){
                return " take ";
            }
            return '乘';
        } else if (iName.indexOf('lt') !== -1) {
            if(language == "En"){
                return " walk ";
            }
            return '走';
        } else {
            return '';
        }
    };

    /**
     * Get Up or Down
     * @param iName
     * @returns {string}
     */
    thisObject.directionUpOrDown = function(iName,language) {
        if (iName.indexOf('up') !== -1) {
            if(language == "En"){
                return " up to ";
            }
            return '上行';
        } else if (iName.indexOf('down') !== -1) {
            if(language == "En"){
                return " down to ";
            }
            return '下行';
        } else {
            return '';
        }
    };

    thisObject.createEndStation = function(segment, curFloor, index, endIconType) {
        var newStation = {
            type: "8",
            floorObjectIndex: index,
            floor: curfloor,
            angelIcon: "icon-uniE660",
            angel: 0,
            autoPass: false,
            action: station_start_func,
            position: [segment[0].x, segment[0].y],
            segment: segment,
            endIconType: "" //info.endIconType
        };
        return newStation;
    };

    /**
     * Get Angel Text
     * @param angel
     * @returns {{}}
     */
    thisObject.getAngelText = function(angel,language) {
        if(language == "En"){
            return thisObject.getAngelTextEn(angel);
        }
        var outData = {};
        if (angel === -99999) {
            outData.angelText = "延路线步行";
            outData.angelIcon = "icon-zhixing"
        } else if (angel <= -120) {
            outData.angelText = "向左后方转弯";
            outData.angelIcon = "icon-zouhouzhuan"
        } else if (angel <= -60 && angel > -120) {
            outData.angelText = "左转";
            outData.angelIcon = "icon-zuozhuan"
        } else if (angel <= -32 && angel > -60) {
            outData.angelText = "向左前方转弯";
            outData.angelIcon = "icon-zuoqianzhuan"
        } else if (angel <= 32 && angel > -32) {
            outData.angelText = "直行";
            outData.angelIcon = "icon-zhixing"
        } else if (angel > 32 && angel <= 60) {
            outData.angelText = "向右前方转弯";
            outData.angelIcon = "icon-youqianzhuan"
        } else if (angel > 60 && angel <= 120) {
            outData.angelText = "右转";
            outData.angelIcon = "icon-youzhuan"
        } else if (angel > 120) {
            outData.angelText = "向右后方转弯";
            outData.angelIcon = "icon-youhouzhuan"
        }
        return outData;
    };
    thisObject.getAngelTextEn = function(angel){
        var outData = {};
        if (angel === -99999) {
            outData.angelText = "Walk along the route";
            outData.angelIcon = "icon-zhixing"
        } else if (angel <= -120) {
            outData.angelText = "Turn left and back";
            outData.angelIcon = "icon-zouhouzhuan"
        } else if (angel <= -60 && angel > -120) {
            outData.angelText = "Turn left";
            outData.angelIcon = "icon-zuozhuan"
        } else if (angel <= -32 && angel > -60) {
            outData.angelText = "Turn left and forward";
            outData.angelIcon = "icon-zuoqianzhuan"
        } else if (angel <= 32 && angel > -32) {
            outData.angelText = "go straight";
            outData.angelIcon = "icon-zhixing"
        } else if (angel > 32 && angel <= 60) {
            outData.angelText = "Turn right and forward";
            outData.angelIcon = "icon-youqianzhuan"
        } else if (angel > 60 && angel <= 120) {
            outData.angelText = "turn right";
            outData.angelIcon = "icon-youzhuan"
        } else if (angel > 120) {
            outData.angelText = "Turn right and back";
            outData.angelIcon = "icon-youhouzhuan"
        }
        return outData;

    }
    thisObject.getAngelText2 = function(angel,language) {
        // var outData = {};
        if(language == "En"){
            return thisObject.getAngelText2En(angel);
        }
        angel > 180 ? angel -= 360 : (angel < -180 ? angel += 360 : "");
        var angelText = "";
        if (angel <= -120) {
            angelText = "左后方";
        } else if (angel <= -60 && angel > -120) {
            angelText = "左手边";
        } else if (angel <= -30 && angel > -60) {
            angelText = "左前方";
        } else if (angel <= 30 && angel > -30) {
            angelText = "前方";
        } else if (angel > 30 && angel <= 60) {
            angelText = "右前方";
        } else if (angel > 60 && angel <= 120) {
            angelText = "右手边";
        } else if (angel > 120) {
            angelText = "右后方";
        } else {}
        return angelText;
    };
    thisObject.getAngelText2En = function(angel) {
        // var outData = {};
        angel > 180 ? angel -= 360 : (angel < -180 ? angel += 360 : "");
        var angelText = "";
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
        } else {}
        return angelText;
    };
    /**
     * Get Angel
     * @param angel
     * @returns {*}
     */
    thisObject.getAngel = function(angel) {
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
    thisObject.convertPathCoords = function(naviCore, path) {
        return;
        naviCore.convertCoords(path.start);
        for (var i = 0; i < path.naviInfoList.length; i++) {
            var info = path.naviInfoList[i];
            var geometry = info["geometry"];
            for (var j = 0; j < geometry.length; j++) {
                naviCore.convertCoords(geometry[j]);
            }
        }
        naviCore.convertCoords(path.end);
    }

    thisObject.matchInnerIndex = function(naviCore, path) {
        var naviInfoList = path["naviInfoList"];
        var naviListlen = naviInfoList.length;
        var locationMap = naviCore.locatingMap;
        if (locationMap === undefined) return;

        for (var i = 0; i < naviListlen; i++) {
            var info = naviInfoList[i];
            var innerIndex = -1;
            for (var key in locationMap) {
                var item = locationMap[key];
                if (item["floorId"] == info.floor) {
                    innerIndex = parseInt(item["locationIndex"]);
                    return 1;
                } else {
                    return 0;
                }
            }
            info["innerFloorIndex"] = "" + innerIndex;
        }
    }

    //lishuang 2016-1-08
    thisObject.fileterSameLayerData = function(path) {
        var naviInfoList = path["naviInfoList"];
        var naviListlen = naviInfoList.length;
        for (var i = 0; i < naviListlen; i++) {
            var info = naviInfoList[i];
            var geometry = info["geometry"];
            //  lishuang 2016 -1-27 filter one set cons same layer path
            var len = geometry.length;
            var filter = false;
            var startCONID = geometry[0]["con_id"];
            var endCONID = geometry[len - 1]["con_id"];
            if (startCONID && startCONID == endCONID) {
                var tmpPath = naviInfoList.splice(i, 1);
                i--;
                naviListlen--;
                //filter = true;
                //if(startCONID != 0){
                //    geometry.splice(0,1);
                //    len--;
                //}
                for (var j = 0; j < len; j++) {
                    var conId = geometry[j]["con_id"];
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
    thisObject.createRouteImpl = function(naviCore) {
        if(thisObject.naviRoute){
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
var NavigationOperatorExcutant = function() {
    var info = {};
    info.operatorQueue = [];
    info.cursor = -1;
    info.isPause = false;
    info.lastTime = 0;

    info.start = function(curTime) {
        if (info.operatorQueue.length > 0) {
            info.isPause = false;
            info.cursor = 0;
            info.lastTime = 0;
            var operator = info.operatorQueue[info.cursor];
            operator.onStart(curTime);
        }
    }
    info.stop = function() {}
    info.run = function(curTime) {
        if (info.isPause === true) return 0;
        if (info.cursor === -1) return 0;
        if (info.cursor >= info.operatorQueue.length) return -1;
        var operator = info.operatorQueue[info.cursor];
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
    }
    info.pause = function() {
        info.isPause = true;
    }
    info.resume = function() {
        info.isPause = false;
    }
    info.add = function(operator) {
        info.operatorQueue.push(operator);
    }
    info.setSpeedScale = function(speed){
        info.operatorQueue.forEach(function(operator){
            operator.setSpeedScale && operator.setSpeedScale(speed);
        });
    };
    info.clear = function() {
        info.operatorQueue.forEach(function(operator) {
            if (operator.playStairsAnimation && operator.clearFloorAm) {
                operator.clearFloorAm();
            }
        });
        info.operatorQueue = [];
    }

    return info;
};

var NavigationOperator = function() {
    var thisObject = this;
    thisObject.naviCore = null;
    thisObject.isEnd = false;
    var prototype = NavigationOperator.prototype;
    prototype.init = function(naviCore) {
        this.naviCore = naviCore;
        this.isEnd = false;
    }
    prototype.finishOperator = function() {
        this.isEnd = true;
    }
    prototype.onFinish = function(tick) {}
    prototype.onStart = function(tick) {}
    prototype.onRuning = function(tick) {}
    prototype.isFinished = function() {
        return this.isEnd;
    }
}

var FloorSegmentOperator = function(naviCore, fl,language) {
    NavigationOperator.call(this);
    var thisObject = this;
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

    var prototype = FloorSegmentOperator.prototype;
    prototype.setSpeedScale = function(speedScale){
        this.interval =  0.2 * speedScale;
    };
    prototype.onFinish = function(tick) {
        var thisObject = this;
        var pose = thisObject.floorObject.getCurrentPose(1);
        if(thisObject.naviCore.usingLineHeading === false){
            var headingView = 0;
        }
        thisObject.indicator.setPositionDirect(pose.pos[0], pose.pos[1], pose.floorId, pose.heading,true,headingView);
        thisObject.finishOperator();
    }
    prototype.onStart = function(tick) {
        var thisObject = this;
        var pose = thisObject.floorObject.getCurrentPose(0);
        if(thisObject.naviCore.usingLineHeading === false){
            var headingView = 0;
        }
        thisObject.indicator.setPositionDirect(pose.pos[0], pose.pos[1], pose.floorId, pose.heading,true,headingView);
    }
    prototype.onRuning = function(tick) {
        try{
            var thisObject = this;
            thisObject.curTime += thisObject.interval;
            var t = thisObject.curTime / thisObject.totalTime;
            if (thisObject.curTime >= thisObject.totalTime) {
                thisObject.onFinish();
            }
            var pose = thisObject.floorObject.getCurrentPose(t);
            var random_pos = false;
            if (random_pos === true && t < 0.95) {
                xOffset += Math.random() * 5 - 2.5;
                yOffset += Math.random() * 5 - 2.5;
                if (xOffset > 5 || xOffset < -5) xOffset = -xOffset;
                if (yOffset > 5 || yOffset < -5) yOffset = -yOffset;
                pose.pos[0] += 0.000001 * xOffset;
                pose.pos[1] += 0.000001 * yOffset;
            }

            var angelOffset = pose.headingTilt[0];
            e = { code: 220 };
            e.heading = angelOffset;
            e.pathDir = pose.headingTilt[0];
            e.location = { x: pose.pos[0], y: pose.pos[1], z: pose.floorId, a: e.heading };
            if (parseInt(e.code) !== 220) return;
            onChangePositionInNavi(e);
        }catch(err){
            alert("onRuning:"+err.toString());
        }
    }

    function onChangePositionInNavi(e) {
        var pose = { pos: [e.location.x, e.location.y, 0], pathDir: e.pathDir, heading: e.location.a, floorId: e.location.z };

        var indicator = thisObject.naviCore.indicator;
        if (indicator === null) return;
        var isNavigating = true;
        // Set Indicator Position
        var lng = pose.pos[0];
        var lat = pose.pos[1];
        var curfloorId = pose.floorId;
        var headingView = pose.heading;
        var usingLineHeading = thisObject.naviCore.usingLineHeading;
        if(usingLineHeading === false){
            headingView = thisObject.naviCore.naviHeading || 0;
        }
        // 如果在导航状态
        if (thisObject.isNavigatePause !== true) {
            tempDistanceI = 0;

            var args = { route: thisObject.naviCore.route, result: null, indicator: indicator };
            args.result = { minDistance: 999999, targetDistance: 0, index: -1 };
            if (args.route.getNearestStation(pose, args.result)) {
                // 距终点信息
                var data = args.route.getLastDistance(args.result.targetDistance, args.result);
                var nearPt = [args.result.nearestPt.x, args.result.nearestPt.y];

                if (args.result.minDistance < 1) { //thisObject.naviCore.correctDistance) {
                    indicator.setPositionSmooth(args.result.nearestPt.x, args.result.nearestPt.y, args.result.floor, pose.heading, headingView, undefined, 0,isNavigating);
                } else {
                    indicator.setPositionSmooth(lng, lat, curfloorId, pose.heading, headingView, nearPt, 0,isNavigating);
                }
                Fire_onIndicator_ShowCrossImage(args);
                Fire_onIndicator_UpdateInfo(args, data,language);

            } else {

                indicator.setPositionSmooth(lng, lat, curfloorId, pose.heading, headingView, undefined, 0,isNavigating);
            }
        } else {
            if (tempDistanceI == 0) {
                naviRoute.naviCore.speakListener && naviRoute.naviCore.speakListener.updateMsg(tempDistance,naviRoute.naviCore.minSpeakDistance);
                tempDistanceI += 1;
            }
        }
    };

    var tempDistance = 0,
        tempDistanceI = 0,
        stageTotalDis = 0;
    var isReachEndPoint = false;

    function Fire_onIndicator_ShowCrossImage(args) {
        var result = args.result;

        if (result.roadResult !== undefined) {
            result.roadResult.bdid = args.route.bdid;
            thisObject.naviCore.showCrossRoad(result.roadResult);
        } else {
            thisObject.naviCore.showCrossRoad(false);
        }
    }
    function getMsg(tempDistance,curStation){
        var updateReg = /方(\S*)米/;
        if(curStation.speakText){
            var substr = curStation.speakText.match(updateReg);
            if (substr != null) {
                substr = curStation.speakText.replace(substr[1], tempDistance);
            }

            if(substr && substr.indexOf(". ") !=-1){
                substr = substr.slice(substr.indexOf(". ")+2);
            }
            return substr;
        }

        return "";
    }
    function Fire_onIndicator_UpdateInfo(args, data,language) {
        var result = args.result;
        var route = args.route;
        var naviCore = thisObject.naviCore;
        var speakListener = naviCore.speakListener;
        if (result.index == -1) {
            return;
        }
        // var grayRoutePoints = args.result.grayRoutePoints;
        //grayRoutePoints
        // if(grayRoutePoints.length){
            var grayT = args.result.walkedRouteRatio;
            data["grayT"] = grayT;
            data["floorId"] = result.floor;
            // naviCore.mapAPI._coreMap.setPolylineGrayData(args.result.floor,grayT,grayRoutePoints);
        // }
        //if (route.currentCursor < result.index) {
        if (route.currentCursor != result.index) {
            route.currentCursor = result.index;
            stageTotalDis = Math.ceil(result.targetDistance);
            route.updateInfo(Math.floor(result.targetDistance),result.station);
            naviCore.updateNaviProgressInfo(data);
        } else {
        //} else if(route.currentCursor == result.index) {
            tempDistance = Math.ceil(result.targetDistance);
            //naviCore.naviTipInfo.updateDistance(result.targetDistance);
            // naviPositionChanged
            //距离较长时语音重复播报
            var stations = route.stations;
            var curStation = stations[route.currentCursor];
            var speakText = curStation.speakText;
            if(curStation.type == 3 && tempDistance < 7 && stations.length >route.currentCursor+1 ){
                var nextStation = stations[route.currentCursor+1];
                data["angelText"] = nextStation.speakText;
                if(speakListener){
                    speakListener.speakNext(route.currentCursor+1);
                }else{
                    data["stationSpeakText"] = speakText;
                }

            }else{
                var speakDistanceParam = naviCore.speakDistanceParam;
                if (speakDistanceParam) {
                    var totalDisArray = speakDistanceParam["totalDisArray"];
                    var speakDisArray = speakDistanceParam["speakDisArray"];

                    for (var i = 0; i < totalDisArray.length; i++) {
                        if (stageTotalDis >= totalDisArray[i] && tempDistance <= speakDisArray[i]) {
                            var msg = "";
                            if (stageTotalDis >= 50 && tempDistance > 30) {
                                if(language == "En"){
                                    msg = "Go Straight ahead";
                                }else{
                                    msg = "前方直行";
                                }

                            } else {
                                if(speakListener){
                                    msg = speakListener.updateMsg(tempDistance,naviCore.minSpeakDistance)
                                }else{
                                    msg = getMsg(tempDistance,curStation);
                                }

                            }
                            if (i === totalDisArray.length - 1) {
                                if (stageTotalDis > 0 && tempDistance <= speakDisArray[i]) {
                                    if(speakListener){
                                        msg = speakListener.updateMsgFinal();
                                    }else{
                                        var substr = thisObject.textQueue[thisObject.cursor].match(thisObject.updateReg);
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
                            speakListener && speakListener.speakNow(msg,null,null);
                            break;
                        }
                    }
                } else {

                    if (stageTotalDis >= 32 && tempDistance <= 16) {
                        if(speakListener){
                            var msg = speakListener.updateMsg(tempDistance,naviCore.minSpeakDistance);
                            speakListener.speakNow(msg,null,null);

                        }else{
                            msg = getMsg(tempDistance,curStation);
                        }
                        stageTotalDis = 0;
                    }
                }
                data["stationSpeakText"] = msg;
            }
            naviCore.updateNaviProgressInfo(data);

        }
    }
};
FloorSegmentOperator.prototype = Object.create(NavigationOperator.prototype);
FloorSegmentOperator.prototype.constructor = FloorSegmentOperator;

var FloorChangeOperator = function(naviCore, station,language) {
    NavigationOperator.call(this);
    var thisObject = this;
    thisObject.naviCore = naviCore;
    thisObject.station = station;
    thisObject.callBack = null;
    var navi_utils = daximap["DXMapUtils"]["naviMath"];
    var prototype = FloorChangeOperator.prototype;
    prototype.onStart = function(tick) {
        var thisObject = this;
        if (thisObject.naviCore.isStairsShow() === false) {
            thisObject.playStairsAnimation(thisObject.station.floor, thisObject.station.nextFloor, thisObject.station.angelIcon, 1000, thisObject.onPlayStairFinished,language);
            // console.log('开始动画楼层数据传递' + thisObject.station.nextFloor);
        }
    }

    prototype.onPlayStairFinished = function() {
        var thisObject = this;
        thisObject.finishOperator();
    }
    prototype.showFloorAmTimer = null;
    prototype.playStairsAnimation = function(startFloorId, endFloorId, iconName, interval, callback) {
        var thisObject = this;
        var start = navi_utils.getRealFloorNumbyFloorId(startFloorId);
        var end = navi_utils.getRealFloorNumbyFloorId(endFloorId);
        var span = end - start;
        var curr = start;

        var way = RouteParseHelper.getTargetNameByIconName(iconName,language);
        var type = RouteParseHelper.getTypeByIconName(iconName,language);
        var dir = RouteParseHelper.getDirByIconName(iconName,language);
        thisObject.callBack = callback;

        var temp = null;
        // var _timer = null;
        thisObject.naviCore.floorChangerShow(true);
        var showFloorAm = function(num) {
            if (curr == end) {
                temp = dir + "_out";
            } else {
                temp = dir;
            }
            if (dir.indexOf("undefined") == -1) {
                thisObject.naviCore.setFloorChangeData({ "currFloor": num, "type": type, "direction": temp });
            }
            // console.log("工具：" + way + ",到达：" + (num + 1) + "层");
            if (dir === 'up') {

                if (curr >= end) {
                    window.clearTimeout(thisObject.showFloorAmTimer);
                    thisObject.showFloorAmTimer = window.setTimeout(function() {
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

                    timer = window.setTimeout(function() {
                        window.clearTimeout(thisObject.showFloorAmTimer);
                        console.log('关闭楼层切换动画');
                        thisObject.naviCore.floorChangerShow(false);
                        thisObject.callBack()
                    }, interval);

                    return;
                }
                curr--;
            } else {
                console.log("调试数据：" + dir);
            }
            thisObject.showFloorAmTimer = window.setTimeout(function() {
                showFloorAm(curr);
            }, interval);
        }
        showFloorAm(curr);
    };
    prototype.clearFloorAm = function() {
        window.clearTimeout(thisObject.showFloorAmTimer);
        thisObject.naviCore.floorChangerShow(false);
    }
};
FloorChangeOperator.prototype = Object.create(NavigationOperator.prototype);
FloorChangeOperator.prototype.constructor = FloorChangeOperator;

var FloorChangeEndOperator = function(naviCore, station) {
    NavigationOperator.call(this);
    var thisObject = this;
    thisObject.naviCore = naviCore;
    thisObject.station = station;

    var prototype = FloorChangeEndOperator.prototype;
    prototype.onStart = function(tick) {
        var thisObject = this;
        var _timer = null;
        _timer = window.setTimeout(function() {
            window.clearTimeout(_timer);
            thisObject.isEnd = true;
        }, 2000);
    }
};
FloorChangeEndOperator.prototype = Object.create(NavigationOperator.prototype);
FloorChangeEndOperator.prototype.constructor = FloorChangeEndOperator;

var FloorEndOperator = function(naviCore, station) {
    NavigationOperator.call(this);
    var thisObject = this;
    thisObject.naviCore = naviCore;
    thisObject.station = station;

    var prototype = FloorEndOperator.prototype;
    prototype.onStart = function(tick) {

    };
    prototype.isFinished = function() {
        return thisObject.isEnd;
    }
};
FloorEndOperator.prototype = Object.create(NavigationOperator.prototype);
FloorEndOperator.prototype.constructor = FloorEndOperator;

//////////////////////////////////////////////////////////
// LocationSimulator
//////////////////////////////////////////////////////////
var LocationSimulator = function(language) {
    var thisObject = this;
    thisObject.naviCore = null;
    thisObject.isPause = false;
    thisObject.animationController = null;
    var prototype = LocationSimulator.prototype;
    prototype.init = function(core) {
        thisObject.naviCore = core;
        thisObject.animationController = window["DaxiMap"]["AnimationController"]();
        thisObject.animationController.init(1);
    };

    prototype.setPause = function(pVal) {
        var thisObject = this;
        thisObject.isPause = pVal;
        if (!pVal) {
            thisObject.animationController.start(null, true);
        }
    };

    prototype.setType = function(pVal) {
        var thisObject = this
        thisObject.simulateType = pVal;
    }

    prototype.pause = function() {
        var thisObject = this
        thisObject.isPause = true;
    }

    prototype.resume = function() {
        // thisObject.isPause = false;
        thisObject.setPause(false);
    }

    prototype.stop = function() {
        var thisObject = this;
        thisObject.isPause = true;

        thisObject.animationController.clearListeners();
        thisObject.animationController.stop();

    };

    var xOffset = 0; //Math.random() * 7 - 3.5;
    var yOffset = 0; // Math.random() * 7 - 3.5;
    var angelOffset = 0;
    var e = { code: 220 };

    prototype.start = function(callback) {
        if (callback === undefined) callback = locationCB;
        // thisObject.naviCore.indicator.setSimulate(true);
        thisObject.naviCore.indicator.setVisible(true);
        var locationDispacherFunc = function() {
            var pose = thisObject.naviCore.getLocationPose();
            var random_pos = false;
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
        }
        thisObject.isPause = true;
        thisObject.animationController.addListener(locationDispacherFunc);
        thisObject.animationController.start(null, true);
    };

    var locationCB = function(e) {
        if (parseInt(e.code) !== 220) return;
        // RouteParseHelper.setlocationToSystem(e);
        var pose = { pos: [e.location.x, e.location.y, 0], pathDir: e.pathDir, heading: e.location.a, floorId: e.location.z };

        var indicator = thisObject.naviCore.indicator;
        if (indicator === null) return;
        // Set Indicator Position
        var lng = pose.pos[0];
        var lat = pose.pos[1];
        var curfloorId = pose.floorId;
        indicator.setPositionDirect(lng, lat, curfloorId, pose.heading,true);
    };
}

//////////////////////////////////////////////////////////
// RawRouteSimulator
//////////////////////////////////////////////////////////
var RawRouteSimulator = function(language) {
    LocationSimulator.call(this);

    var thisObject = this;
    thisObject.startTime = null;
    thisObject.routeDistance = 0;
    thisObject.operatorController = NavigationOperatorExcutant();

    var prototype = RawRouteSimulator.prototype;
    prototype.start = function() {
        var thisObject = this;
        thisObject.startTime = new Date().getTime();
        thisObject.routeDistance = 0;
        thisObject.isPause = false;
        var naviDispacherFunc = function() {
            if (thisObject.isPause === false) {
                try{
                    if (thisObject.operatorController.run(0) === -1) {
                       onNavigationFinished();
                       thisObject.animationController.stop();
                       thisObject.animationController.clearListeners();
                   }

               }catch(e){
                   console.log("naviDispacherFunc:"+e.toString());
               }
            }
        };

        var route = thisObject.naviCore.route;
        var pose = route.getCurrentPose(0);
        thisObject.naviCore.indicator._setMapPositionOnly(route.bdid,pose.floor,pose.pos[0],pose.pos[1]);
        thisObject.naviCore.indicator._setPositionOnly(pose.pos[0],pose.pos[1],route.bdid,pose.floor,pose.headingTilt[0],0);

        thisObject.parseRoute(route,language);
        setTimeout(function(){
            thisObject.operatorController.start();
            thisObject.animationController.addListener(naviDispacherFunc);
            thisObject.animationController.init(0.2);
            thisObject.animationController.start(null, true,language);
            thisObject.naviCore.indicator.setVisible(true);
        },10);


    };

    prototype.pause = function() {
        var thisObject = this;
        thisObject.isPause = true;
        thisObject.operatorController.pause();
        thisObject.animationController.setPause(true);

    };
    prototype.resume = function() {
        var thisObject = this;
        thisObject.isPause = false;
        thisObject.operatorController.resume();
        thisObject.animationController.setPause(false);

    };
    prototype.stop = function() {
        var thisObject = this;
        thisObject.operatorController.clear();
        thisObject.animationController.clearListeners();
        thisObject.animationController.stop();
        // thisObject.naviCore.indicator.setSimulate(false);

        var locationManager = thisObject.naviCore.locationManager;
        locationManager._stopMatchRoute();
        var locState = locationManager._getLocationState();
        if(locState == DaxiMap["LocationState"]["LOCATED"]){
            var myPos = locationManager._getMyPositionInfo();
            thisObject.naviCore.indicator._setPositionOnly(myPos["position"][0],myPos["position"][1],myPos["bdid"],myPos["floorId"],myPos["direction"]);
        }else{
             thisObject.naviCore.indicator.setVisible(false);
        }

    };
    prototype.setSpeedScale = function(speed){
        thisObject.operatorController.setSpeedScale(speed);
    };

    function onNavigationFinished() {
        //todo:通过事件方式发布，方便调用
        var spendsTime = ~~(thisObject.naviCore.route.total_length/0.83);//Math.floor((new Date().getTime() - thisObject.startTime) / 1000);
        var minutes = Math.floor(spendsTime / 60);
        var seconds = spendsTime % 60;
        var msg = "用时",
            minutesUnit = "分钟",
            secUnit = "秒 ",
            disUnit = "米",
            disDesc = "距离";

        if (minutes > 0) {
            msg += minutes + minutesUnit;

        }
        msg += seconds + secUnit + disDesc + thisObject.routeDistance + disUnit;
        thisObject.stop();
        thisObject.naviCore.route.reset();
        thisObject.naviCore.onNavigationFinished(thisObject, { "msg": msg });
    }

    prototype.parseRoute = function(route,language) {
        thisObject.operatorController.clear();
        var floorCount = route.floorObjects.length;
        floorCount > 0 ? thisObject.routeDistance = Math.round(route.floorObjects[0].route.total_length) : 0;
        for (var floorIndex = 0; floorIndex < floorCount; floorIndex++) {
            var floorObject = route.floorObjects[floorIndex];
            var operator = new FloorSegmentOperator(thisObject.naviCore, floorObject,language);
            thisObject.operatorController.add(operator);

            if (floorIndex !== floorCount - 1) {
                var operator = new FloorChangeOperator(thisObject.naviCore, floorObject.stations[floorObject.stations.length - 1],language);
                thisObject.operatorController.add(operator);
            } else {
                var operator = new FloorEndOperator(thisObject.naviCore, floorObject.stations[floorObject.stations.length - 1],language);
                thisObject.operatorController.add(operator);
            }
        }
    }
}
RawRouteSimulator.prototype = Object.create(LocationSimulator.prototype);
RawRouteSimulator.prototype.constructor = RawRouteSimulator;

//////////////////////////////////////////////////////////
// RawRouteController
//////////////////////////////////////////////////////////
var RawRouteController = function(language) {
    var disMaxReNavi = 20;
    var timesMaxReNavi = 15000;
    var timesMaxWrongWay = 14000;
    var thisObject = this;
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
    thisObject.timesMaxReNaviDef = timesMaxReNavi;
    thisObject.timesMaxWrongWayDef = timesMaxWrongWay;

    var navi_utils = daximap["DXMapUtils"]["naviMath"];
    var prototype = RawRouteController.prototype;
    prototype.init = function(core) {
        disMaxReNavi = core.restartRoute;
        timesMaxReNavi = core.timesMaxReNavi;
        timesMaxWrongWay = core.timesMaxWrongWay;
        // 用于保存初始化值
        thisObject.disMaxReNaviDef = disMaxReNavi;
        thisObject.timesMaxReNaviDef = timesMaxReNavi;
        thisObject.timesMaxWrongWayDef = timesMaxWrongWay;

        thisObject.naviCore = core;
        thisObject.RenavigationTrigger = RenavigationConditionTrigger();
        thisObject.WrongwayTrigger = WrongWayConditionTrigger();
    };

    prototype.setPause = function(pVal) {
        var thisObject = this;
        thisObject.isPause = pVal;
    };
    prototype.getPause = function() {
        return thisObject.isPause;
    };

    prototype.pause = function() {
        var thisObject = this;
        thisObject.isPause = true;
    }

    prototype.resume = function() {
        var thisObject = this;
        thisObject.isPause = false;
    }

    prototype.parseRoute = function() {

    };

    prototype.start = function(callback) {
        var thisObject = this;
        thisObject.startTime = new Date().getTime();

        if (callback === undefined) callback = watchCB;
        var route = thisObject.naviCore.route;
        if (route) {
            thisObject.routeDistance = parseInt(route.total_length);
        } else {
            thisObject.routeDistance = 0;
        }

        thisObject.naviCore.locationManager._on("onLocationChanged",callback);
        var loc = thisObject.naviCore.locationManager._getMyPositionInfo();
        callback(null,loc);


    };

    prototype.setType = function(pVal) {
        var thisObject = this;
        thisObject.simulateType = pVal;
    }

    /**
     * Stop Navigate
     */
    prototype.stop = function() {
        var thisObject = this;
        clearFloorAmTimer();
        thisObject.naviCore.locationManager._off("onLocationChanged", watchCB);
        var locationManager = thisObject.naviCore.locationManager;
        locationManager._stopMatchRoute();
        // thisObject.naviCore.locationManager.locationManager.removeWatchLocationEvent(watchCB);
    };

    //定位监视
    var watchCB = function(sender,e) {
        //isIndoorAreaGPS
        if(e["bdid"] && e["floorId"]){
            thisObject.navigateCB(e);
        }else {
            //室外处理
        }
    };

    var lastBleUpdateTimeStamp = 0;
    prototype.navigateCB = function(e) {
        var thisObject = this;
        var offsetPos = [0, 0];
        var pose = { pos: [], headingTilt: [], floor: 0, real_pos: [], target_pos: [] };
        pose.pos[0] = e["position"][0] + offsetPos[0];
        pose.pos[1] = e["position"][1] + offsetPos[1];
        pose.pos[2] = e["floorNum"];
        pose.floorId = e["floorId"];
        pose.pathDir = e["pathDir"];
        pose.heading = e["direction"];
        pose.accuracy = e["r"];

        pose.real_pos = e["real_pos"];


        if (thisObject.naviCore.isDebug === 1 && e["target_pos"]) {
            pose.target_pos[0] = e["target_pos"]["x"];
            pose.target_pos[1] = e["target_pos"]["y"];
            pose.target_pos[2] = 0;
        }
        var floorInfo = thisObject.naviCore.mapAPI._getFloorInfo( e["bdid"],pose.floorId);

        if (thisObject.naviCore.getIsSimulate()) {

            var loc = {
                floorCnName: floorInfo ? floorInfo["floorCnName"] : "",
                floorName: floorInfo ? floorInfo["floorName"] : "",
                floorNum:e["floorNum"],
                floorId: pose.floorId,
                position: e["position"],
                direction: e["direction"]
            };
            thisObject.naviCore.locationManager.locationManager.set(loc);
        }

        var mapStatus = thisObject.naviCore.getNaviStatus();

        if (mapStatus === STATE_NAVIGATE || mapStatus === STATE_NAVIGATE_PAUSE) { // || mapStatus === STATE_NAVIGATE_END
            thisObject.onChangePositionInNavi(pose, thisObject.naviCore.getNaviStatus(),thisObject.language,e["duration"]);
        } else {
            thisObject.onChangePositionInFree(pose, thisObject.naviCore.getNaviStatus(),thisObject.language,e["duration"]);
        }

    };

    var tempDistance = 0,
        tempDistanceI = 0,
        stageTotalDis = 0;

    function onNavigationFinished() {
        //todo:通过事件方式发布，方便调用
        var spendsTime = Math.floor((new Date().getTime() - thisObject.startTime) / 1000);
        var minutes = Math.floor(spendsTime / 60);
        var seconds = spendsTime % 60;
        var msg = "用时",
            minutesUnit = "分钟",
            secUnit = "秒 ",
            disUnit = "米",
            disDesc = "距离";
        if (minutes > 0) {
            msg += minutes + minutesUnit;
        }
        msg += seconds + secUnit + disDesc + thisObject.routeDistance + disUnit;
        thisObject.stop();
        thisObject.naviCore.onNavigationFinished(thisObject, { "msg": msg });

    }


    var RenavigationConditionTrigger = function() {
        var obj = {};
        obj.lastTimeInMilli = new Date().getTime();
        obj.outLineCount = 0;
        obj.CheckIsNeedReNavigation = function(args, distance) {
            //if(distance <= 10 ) return false;
            var timestamp = new Date().getTime();
            var diff = (timestamp - obj.lastTimeInMilli);
            //lastTimeInMilli = timestamp;
            if (diff > timesMaxReNavi && obj.outLineCount > 10) {
                obj.outLineCount = 0;
                obj.lastTimeInMilli = timestamp;
                return true;
            }
            obj.outLineCount += 1;
            //obj.console.log(obj.outLineCount + "," + diff);
            return false;
        };
        obj.reset = function() {
            obj.lastTimeInMilli = new Date().getTime();
            obj.outLineCount = 0;
        };
        return obj;
    }

    var WrongWayConditionTrigger = function() {
        var obj = {};
        obj.lastTimeInMilli = new Date().getTime();
        obj.outLineCount = 0;
        obj.CheckIsNeed = function(args, distance) {
            //if(distance <= 10 ) return false;
            var timestamp = new Date().getTime();
            var diff = (timestamp - obj.lastTimeInMilli);
            //lastTimeInMilli = timestamp;
            if (diff > timesMaxWrongWay && obj.outLineCount > 5) {
                obj.outLineCount = 0;
                obj.lastTimeInMilli = timestamp;
                return true;
            }
            obj.outLineCount += 1;
            return false;
        };
        obj.reset = function() {
            obj.lastTimeInMilli = new Date().getTime();
            obj.outLineCount = 0;
        };
        return obj;
    }

    function Fire_onIndicator_OutOfTheRoute(args) {
        var result = args.result;
        var reNavigationText = "正在为您重新规划路线";
        if(language == "En"){
            reNavigationText = "navigating for you!";
        }
        thisObject.naviCore.locationManager._stopMatchRoute();
        thisObject.naviCore.Fire_onRenavigation();
        thisObject.RenavigationTrigger.reset();
    }

    function Fire_onIndicator_ChangeFloors(args, interval,language) {
        var result = args.result;
        interval = interval || 1000;

        //    真实导航过程显示换层动画
        if (result.floor && result.nextFloor) {
            var startFloorId = result.floor;
            var endFloorId = result.nextFloor;
            if (startFloorId != endFloorId) {

                //var thisObject = this;
                var start = navi_utils.getRealFloorNumbyFloorId(startFloorId);
                var end = navi_utils.getRealFloorNumbyFloorId(endFloorId);
                var span = end - start;
                var curr = start;
                var way = RouteParseHelper.getTargetNameByIconName(iconName,language);
                var type = RouteParseHelper.getTypeByIconName(iconName,language);
                var dir = RouteParseHelper.getDirByIconName(iconName,language);
                var changeFloorData = thisObject.changeFloorData;
                if (changeFloorData["startFloor"] == startFloorId && changeFloorData["endFloor"] == endFloorId && dir == changeFloorData["direction"]) {
                    return;
                } else {
                    // thisObject.naviCore.events.EventShowFloorChanger
                    changeFloorData = thisObject.changeFloorData = { "startFloor": startFloorId, "endFloor": endFloorId, "type": type, "direction": dir, "startFloorNum": start, "endFloorNum": end, "currFloor": startFloor };
                    thisObject.naviCore.floorChangerShow(true);
                    thisObject.naviCore.setFloorChangeData(changeFloorData);
                    var temp = null;
                    var showFloorAm = function(num) {
                        if (curr == end) {
                            temp = dir + "_out";
                        } else {
                            temp = dir;
                        }
                        if (dir.indexOf("undefined") == -1) {
                            thisObject.naviCore.setFloorChangeData({ "currFloor": num, "type": type, "direction": temp });
                        }
                        if (dir === 'up') {
                            if (curr >= end) {
                                window.clearTimeout(thisObject.showFloorAmTimer);
                                thisObject.showFloorAmTimer = window.setTimeout(function() {
                                    window.clearTimeout(thisObject.showFloorAmTimer);
                                    thisObject.naviCore.floorChangerShow(false);
                                }, interval);
                                return;
                            }
                            curr++;
                        } else if (dir === "down") {
                            if (curr <= end) {
                                window.clearTimeout(thisObject.showFloorAmTimer);
                                timer = window.setTimeout(function() {
                                    window.clearTimeout(thisObject.showFloorAmTimer);
                                    thisObject.naviCore.floorChangerShow(false);
                                }, interval);

                                return;
                            }
                            curr--;
                        } else {
                            console.log("调试数据：" + dir);
                        }
                        thisObject.showFloorAmTimer = window.setTimeout(function() {
                            showFloorAm(curr);
                        }, interval);
                    }
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
        var result = args.result;

        if (result.roadResult !== undefined) {
            result.roadResult.bdid = args.route.bdid;
            thisObject.naviCore.showCrossRoad(result.roadResult);
            //console.log("显示路口放大图"+JSON.stringify(result.roadResult));
        } else {
            thisObject.naviCore.showCrossRoad(false);
            //console.log("不显示路口放大图");
        }
    }
    function getMsg(tempDistance,curStation){
        var updateReg = /方(\S*)米/;
        if(curStation.speakText){
            var substr = curStation.speakText.match(updateReg);
            if (substr != null) {
                substr = curStation.speakText.replace(substr[1], tempDistance);
            }

            if(substr && substr.indexOf(". ") !=-1){
                substr = substr.slice(substr.indexOf(". ")+2);
            }
            return substr;
        }
        return "";
    }
    function Fire_onIndicator_UpdateInfo(args, data) {
        var result = args.result;
        var route = args.route;
        var naviCore = thisObject.naviCore;

        var speakListener = naviCore.speakListener;
        var grayRoutePoints = args.result.grayRoutePoints;
        //grayRoutePoints
        // if(grayRoutePoints.length){
        var grayT = args.result.walkedRouteRatio;
        data["grayT"] = grayT;
        var naviRoute = naviCore.route;
        // naviCore.mapAPI._coreMap.setPolylineGrayData(args.result.floor,grayT,grayRoutePoints);
        var station = naviRoute.stations[naviRoute.currentCursor];
        // if (route.currentCursor < result.index) {
        if (route.currentCursor != result.index) {
            route.currentCursor = result.index;
            route.updateInfo(data.targetDistance);
            thisObject.naviCore.updateNaviProgressInfo(data);
            stageTotalDis = Math.ceil(result.targetDistance);
        } else {

            tempDistance = Math.ceil(result.targetDistance);
            var changeFloorTipDis = naviCore.changeFloorTipDis || 7;
            //naviCore.naviTipInfo.updateDistance(result.targetDistance);
            // naviPositionChanged
            //距离较长时语音重复播报
            var stations = route.stations;
            var curStation = stations[route.currentCursor];
            var speakText = curStation.speakText;
            if(curStation.type == 3 && tempDistance < changeFloorTipDis && stations.length >route.currentCursor+1 ){
                // var nextStation = stations[route.currentCursor+1];
                // if(speakListener){
                //     speakListener.speakNext(route.currentCursor+1);
                // }else{
                //     data["stationSpeakText"] = speakText;
                // }
                var nextStation = stations[route.currentCursor+1];
                // data["angelText"] = nextStation["speakText"];
                data["changeFloorText"] =  nextStation["speakText"];
                if(speakListener){
                    speakListener.speakNext(route.currentCursor+1);
                }else{
                    data["stationSpeakText"] = speakText;
                }
            }else{
                var speakDistanceParam = naviCore.speakDistanceParam;
                if (speakDistanceParam) {
                    var totalDisArray = speakDistanceParam["totalDisArray"];
                    var speakDisArray = speakDistanceParam["speakDisArray"];

                    for (var i = 0; i < totalDisArray.length; i++) {
                        if (stageTotalDis >= totalDisArray[i] && tempDistance <= speakDisArray[i]) {
                            var msg = "";
                            if (stageTotalDis >= 50 && tempDistance > 30) {
                                if(language == "En"){
                                    msg = "Go Straight ahead";
                                }else{
                                    msg = "前方直行";
                                }

                            } else {
                                if(speakListener){
                                    msg = speakListener.updateMsg(tempDistance,naviCore.minSpeakDistance)
                                }else{
                                    msg = getMsg(tempDistance,curStation);
                                }

                            }
                            if (i === totalDisArray.length - 1) {
                                if (stageTotalDis > 0 && tempDistance <= speakDisArray[i]) {
                                    if(speakListener){
                                        msg = speakListener.updateMsgFinal();
                                    }else{
                                        var substr = thisObject.textQueue[thisObject.cursor].match(thisObject.updateReg);
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
                            speakListener && speakListener.speakNow(msg,null,null);
                            break;
                        }
                    }
                } else {

                    if (stageTotalDis >= 32 && tempDistance <= 16) {
                        if(speakListener){
                            var msg = speakListener.updateMsg(tempDistance,naviCore.minSpeakDistance);
                            speakListener.speakNow(msg,null,null);
                        }else{
                            msg = getMsg(tempDistance,curStation);
                        }
                        stageTotalDis = 0;
                    }
                }
                data["stationSpeakText"] = msg;
            }
            naviCore.updateNaviProgressInfo(data);
        }
    }

    function Fire_OnIndicator_NaviEnd(args, lastDisData) {
        var result = args.result;
        var naviCore = thisObject.naviCore;
        var endDist = naviCore.endNaviDistance || endNaviDistance;
        var lastDistance = lastDisData["lastDistance"];
        if (lastDistance < 0) {
            return;
        }
        var restDistance = result.targetDistance;
        var naviEndType = naviCore.naviEndType;
        if (naviEndType == 1 && result.index === (args.route.stations.length - 1)) {
            if (thisObject.naviCore.getIsSimulate()) {
                if (restDistance <= 1) {
                    onNavigationFinished();
                }
            } else if (restDistance < endDist) {
                onNavigationFinished();
            }
        } else if (naviEndType == 2) { //按照剩余距离判定是否播报导航结束
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
        var diff = heading1 - heading2;
        if (diff > 180) { // 355,1
            diff = heading2 + 360 - heading1;
        } else if (diff < -180) { //1,355
            diff == heading1 + 360 - heading2;
        } else {
            diff = Math.abs(diff);
        }
        return diff;
    }

    prototype.onChangePositionInNavi = function(pose, status,language,duration) {
        var thisObject = this;
        var curfloorId = pose.floorId;
        var indicator = thisObject.naviCore.indicator;
        var usingLineHeading = thisObject.naviCore.usingLineHeading;
        var duration = thisObject.naviCore.getIsSimulate() ? 0 : (duration||1000);
        var headingView = pose.heading;
        if(usingLineHeading === false){
            headingView = thisObject.naviCore.naviHeading || 0;
        }
        if (thisObject.indicator !== null) {
            // Set Indicator Position
            var lng = pose.pos[0];
            var lat = pose.pos[1];
            var realPt = pose.real_pos;
            var distanceMin = 0;
            // if(pose.pos[2]!=pose.real_pos["z"]){
            //    distanceMin = disMaxReNavi+1;
            // }
            distanceMin = Math.max(navi_utils.getGeodeticCircleDistanceVector(pose.pos, [realPt["x"],realPt["y"]]),distanceMin);
            // var distanceMin = navi_utils.getGeodeticCircleDistanceVector(pose.pos, realPt);
            var args = { route: thisObject.naviCore.route, result: null, indicator: thisObject.indicator };
            args.result = { minDistance: 999999, targetDistance: 0, index: -1 };
            var heading = pose.heading;
            if (args.route.getNearestStation(pose, args.result)) { //如果定位中抓取点成功
                //var nearPt = [args.result.nearestPt.x, args.result.nearestPt.y];
                // 距终点信息
                var lng = pose.pos[0],lat = pose.pos[1];
                var data = args.route.getLastDistance(args.result.targetDistance, args.result);

                var headingView = pose.heading
                var headingDiff = getHeadingDiff(headingView, args.result.heading);
                if (headingDiff < 45) {
                    headingView = args.result.heading;
                }

                var headingRoute = args.result.heading;
                if (usingLineHeading) {
                    headingView = headingRoute;
                    pose.heading = headingRoute
                }
                if (usingLineHeading === false) {
                    // headingView = headingRoute;
                    headingView = 0;

                }
                // 大于无效值后
                if (pose.accuracy > thisObject.invalidAccuracy) {
                    disMaxReNavi = pose.accuracy;
                    thisObject.RenavigationTrigger.reset();
                } else {
                    disMaxReNavi = thisObject.disMaxReNaviDef;
                }
                var toLineMinDis = args.result.minDistance;
                // if (distanceMin <= disMaxReNavi) { // 5
                if (distanceMin <= disMaxReNavi && toLineMinDis <= disMaxReNavi) {
                     if(args.result.nearestPt){
                        lng = args.result.nearestPt.x;
                        lat = args.result.nearestPt.y;
                     }
                    indicator.setPositionSmooth(lng, lat, args.result.floor, pose.heading, headingView, realPt,  duration,true);
                    thisObject.RenavigationTrigger.reset();
                    thisObject.WrongwayTrigger.reset();
                // } else if (distanceMin > disMaxReNavi) {
                } else if (distanceMin > disMaxReNavi || toLineMinDis>=disMaxReNavi) {
                    if (thisObject.RenavigationTrigger.CheckIsNeedReNavigation(args)) {
                        return Fire_onIndicator_OutOfTheRoute(args);
                    }
                    // 偏离重新规划路线之前的点位切换忽略
                    // else {
                    //     //indicator.setPositionSmooth(realPt[0], realPt[1], curfloorId, pose.heading, pose.pos);
                    //     indicator.setPositionSmooth(lng, lat, curfloorId, pose.heading, headingView,  realPt, duration,true);
                    // }
                } else {
                     //正常范围内点位重置重新规划条件
                    indicator.setPositionSmooth(realPt[0], realPt[1], curfloorId, pose.heading, headingView, pose.pos, duration,true);
                    thisObject.RenavigationTrigger.reset();
                }
                if (pose.beaconGroupId && pose.beaconGroupId !== 0 && pose.beaconGroupId !== thisObject.naviCore.locationManager.locationManager._getCurrentBeaconGroupId()) {
                    Fire_onIndicator_OutOfTheRoute(args);
                }

                Fire_onIndicator_ChangeFloors(args,1000,language);
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
                    return Fire_onIndicator_OutOfTheRoute(args);
                }
                // 偏离重新规划路线之前的点位切换忽略
                // else {
                //     //indicator.setPositionSmooth(realPt[0], realPt[1], curfloorId, pose.heading, pose.pos);
                //     indicator.setPositionSmooth(lng, lat, curfloorId, pose.heading,headingView, realPt,true);
                // }
                // if (distanceMin > disMaxReNavi || args.result.minDistance >= disMaxReNavi) {
                //     // 大于无效值后
                //     if (pose.accuracy > thisObject.invalidAccuracy) {
                //         disMaxReNavi = pose.accuracy;
                //         thisObject.RenavigationTrigger.reset();
                //     } else {
                //         disMaxReNavi = thisObject.disMaxReNaviDef;
                //     }
                //     if (thisObject.RenavigationTrigger.CheckIsNeedReNavigation(args)) {
                //         return Fire_onIndicator_OutOfTheRoute(args);
                //     }
                //     // 偏离重新规划路线之前的点位切换忽略
                //     // else {
                //     //     //indicator.setPositionSmooth(realPt[0], realPt[1], curfloorId, pose.heading, pose.pos);
                //     //     indicator.setPositionSmooth(lng, lat, curfloorId, pose.heading,headingView, realPt,true);
                //     // }
                // }
                // //没有匹配到station
                // // else {
                // //     //正常范围内点位重置重新规划条件
                // //     //indicator.setPositionSmooth(realPt[0], realPt[1], curfloorId, pose.heading, pose.pos);
                // //     indicator.setPositionSmooth(lng, lat, curfloorId, pose.heading,headingView, realPt,true);
                // //     thisObject.RenavigationTrigger.reset();
                // // }
            }
        }
    }

    prototype.onChangePositionInFree = function(pose, status) {
        var thisObject = this;
        var indicator = thisObject.naviCore.indicator;
        if (indicator === null) return;
        // Set Indicator Position
        var lng = pose.pos[0];
        var lat = pose.pos[1];
        var curfloorId = pose.floorId;
        indicator.setPositionSmooth(lng, lat, curfloorId, pose.heading, undefined,pose.real_pos, 0);
    };
}
