/**
 * Created by ge.jiang on 2015/1/5.
 */

var RESOURCE_ERROR_MISS = -2,
    RESOURCE_ERROR = -1,
    RESOURCE_WAITING = 0,
    RESOURCE_PENDING_DISPATCH = 1,
    RESOURCE_LOADING = 2,
    RESOURCE_ABORTING = 3,
    RESOURCE_LOADED = 4,
    RESOURCE_COMPILED = 5,
    RESOURCE_TEXTURES_READY = 6,
    RESOURCE_READY = 7;


    Matrix_create = function () {
        return [1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1];
    }
    
    var Matrix_rotateAxisX = function (retVal, angel) {
        var cos_angel = Math.cos(angel);
        var sin_angel = Math.sin(angel);
        retVal[0] = 1;
        retVal[1] = 0;
        retVal[2] = 0;
        retVal[3] = 0;
        retVal[4] = 0;
        retVal[5] = cos_angel;
        retVal[6] = sin_angel;
        retVal[7] = 0;
        retVal[8] = 0;
        retVal[9] = -sin_angel;
        retVal[10] = cos_angel;
        retVal[11] = 0;
        retVal[12] = 0;
        retVal[13] = 0;
        retVal[14] = 0;
        retVal[15] = 1;
    };
    
    Matrix_scale = function (retVal, x, y, z) {
        retVal[0] = x;
        retVal[1] = 0;
        retVal[2] = 0;
        retVal[3] = 0;
        retVal[4] = 0;
        retVal[5] = y;
        retVal[6] = 0;
        retVal[7] = 0;
        retVal[8] = 0;
        retVal[9] = 0;
        retVal[10] = z;
        retVal[11] = 0;
        retVal[12] = 0;
        retVal[13] = 0;
        retVal[14] = 0;
        retVal[15] = 1;
    };
    
    // var Matrix_rotateAxisY = function (retVal, angel) {
    //     var cos_angel = Math.cos(angel);
    //     var sin_angel = Math.sin(angel);
    //     retVal[0] = cos_angel;
    //     retVal[1] = 0;
    //     retVal[2] = -sin_angel;
    //     retVal[3] = 0;
    //     retVal[4] = 0;
    //     retVal[5] = 0;
    //     retVal[6] = 0;
    //     retVal[7] = 0;
    //     retVal[8] = sin_angel;
    //     retVal[9] = 0;
    //     retVal[10] = cos_angel;
    //     retVal[11] = 0;
    //     retVal[12] = 0;
    //     retVal[13] = 0;
    //     retVal[14] = 0;
    //     retVal[15] = 1;
    // };
      var Vector3_length = function (vec) {
        return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
      };

    var Vector3_normalize = function (retVal, vec) {
        var length = Vector3_length(vec);
        //if ( length > 0.000001 )
        if (length > 0.0) {
          var r = 1 / length;
          retVal[0] = (vec[0] * r);
          retVal[1] = (vec[1] * r);
          retVal[2] = (vec[2] * r);
        }
        return retVal;
      };
    
    var Matrix_rotateAxisZ = function (retVal, angel) {
        var cos_angel = Math.cos(angel);
        var sin_angel = Math.sin(angel);
        retVal[0] = cos_angel;
        retVal[1] = sin_angel;
        retVal[2] = 0;
        retVal[3] = 0;
        retVal[4] = -sin_angel;
        retVal[5] = cos_angel;
        retVal[6] = 0;
        retVal[7] = 0;
        retVal[8] = 0;
        retVal[9] = 0;
        retVal[10] = 1;
        retVal[11] = 0;
        retVal[12] = 0;
        retVal[13] = 0;
        retVal[14] = 0;
        retVal[15] = 1;
    };
    var Quaternion_fromEuler = function (retVal, x, y, z) {
        var c1 = Math.cos(y * 0.5);
        var c2 = Math.cos(z * 0.5);
        var c3 = Math.cos(x * 0.5);
        var s1 = Math.sin(y * 0.5);
        var s2 = Math.sin(z * 0.5);
        var s3 = Math.sin(x * 0.5);
        retVal[3] = c1 * c2 * c3 - s1 * s2 * s3;
        retVal[0] = s1 * s2 * c3 + c1 * c2 * s3;
        retVal[1] = s1 * c2 * c3 + c1 * s2 * s3;
        retVal[2] = c1 * s2 * c3 - s1 * c2 * s3;
    };

    var Matrix_fromQuaternion = function (retVal, q) {
        var x = q[0], y = q[1], z = q[2], w = q[3];
        var xx = x * x;
        var xy = x * y;
        var xz = x * z;
        var xw = x * w;
    
        var yy = y * y;
        var yz = y * z;
        var yw = y * w;
    
        var zz = z * z;
        var zw = z * w;
    
        retVal[0] = 1 - 2 * ( yy + zz );
        retVal[1] = 2 * ( xy + zw );
        retVal[2] = 2 * ( xz - yw );
    
        retVal[4] = 2 * ( xy - zw );
        retVal[5] = 1 - 2 * ( xx + zz );
        retVal[6] = 2 * ( yz + xw );
    
        retVal[8] = 2 * ( xz + yw );
        retVal[9] = 2 * ( yz - xw );
        retVal[10] = 1 - 2 * ( xx + yy );
    
        retVal[3] = retVal[7] = retVal[11] = retVal[12] = retVal[13] = retVal[14] = 0;
        retVal[15] = 1;
    };
    
    var Matrix_multiply = function (retVal, m1, m2) {
        var M00 = m1[0], M01 = m1[1], M02 = m1[2], M03 = m1[3],
            M10 = m1[4], M11 = m1[5], M12 = m1[6], M13 = m1[7],
            M20 = m1[8], M21 = m1[9], M22 = m1[10], M23 = m1[11],
            M30 = m1[12], M31 = m1[13], M32 = m1[14], M33 = m1[15],
    
            n00 = m2[0], n01 = m2[1], n02 = m2[2], n03 = m2[3],
            n10 = m2[4], n11 = m2[5], n12 = m2[6], n13 = m2[7],
            n20 = m2[8], n21 = m2[9], n22 = m2[10], n23 = m2[11],
            n30 = m2[12], n31 = m2[13], n32 = m2[14], n33 = m2[15];
    
        retVal[0] = M00 * n00 + M01 * n10 + M02 * n20 + M03 * n30;
        retVal[1] = M00 * n01 + M01 * n11 + M02 * n21 + M03 * n31;
        retVal[2] = M00 * n02 + M01 * n12 + M02 * n22 + M03 * n32;
        retVal[3] = M00 * n03 + M01 * n13 + M02 * n23 + M03 * n33;
    
        retVal[4] = M10 * n00 + M11 * n10 + M12 * n20 + M13 * n30;
        retVal[5] = M10 * n01 + M11 * n11 + M12 * n21 + M13 * n31;
        retVal[6] = M10 * n02 + M11 * n12 + M12 * n22 + M13 * n32;
        retVal[7] = M10 * n03 + M11 * n13 + M12 * n23 + M13 * n33;
    
        retVal[8] = M20 * n00 + M21 * n10 + M22 * n20 + M23 * n30;
        retVal[9] = M20 * n01 + M21 * n11 + M22 * n21 + M23 * n31;
        retVal[10] = M20 * n02 + M21 * n12 + M22 * n22 + M23 * n32;
        retVal[11] = M20 * n03 + M21 * n13 + M22 * n23 + M23 * n33;
    
        retVal[12] = M30 * n00 + M31 * n10 + M32 * n20 + M33 * n30;
        retVal[13] = M30 * n01 + M31 * n11 + M32 * n21 + M33 * n31;
        retVal[14] = M30 * n02 + M31 * n12 + M32 * n22 + M33 * n32;
        retVal[15] = M30 * n03 + M31 * n13 + M32 * n23 + M33 * n33;
    };

    Vector3_dot = function( vec1, vec2 ) {
        return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];
    };

    Vector3_transformCoords = function (retVal, vec, mat) {
        var vX = vec[0];
        var vY = vec[1];
        var vZ = vec[2];
        var vW = 1.0;
    
        var x = mat[0] * vX + mat[4] * vY + mat[8] * vZ + mat[12] * vW;
        var y = mat[1] * vX + mat[5] * vY + mat[9] * vZ + mat[13] * vW;
        var z = mat[2] * vX + mat[6] * vY + mat[10] * vZ + mat[14] * vW;
        // var w = matrix[3] * vX + matrix[7] * vY + matrix[11] * vZ + matrix[15] * vW;
    
        retVal[0] = x;
        retVal[1] = y;
        retVal[2] = z;
        // result.w = w;
        return retVal;
    };
    
    Vector3_transformNormal = function (retVal, vec, mat) {
        var x = vec[0], y = vec[1], z = vec[2];
        retVal[0] = x * mat[0] + y * mat[4] + z * mat[8];
        retVal[1] = x * mat[1] + y * mat[5] + z * mat[9];
        retVal[2] = x * mat[2] + y * mat[6] + z * mat[10];
    };

onmessage = function (event) {
    var data = IndoorRSMeshParser.parse(event.data);
    var patchData = createPatch(data);
    postMessage(patchData);
};



var createPatch = function (data) {
    var _patchs = [];
    var jpeg = null;

    var i, j;
    if (data.qcmsEntry === undefined) {
        return {state: RESOURCE_ERROR};
    }

    if (data.jpegEntry !== undefined) {

        jpeg = {buffer: data.jpegEntry.jpegBuffer};
    }
    
    var sizeOfQCMS = data.qcmsEntry.length;
    for (j = 0; j < sizeOfQCMS; j++) {
        var curQCMSEntry = data.qcmsEntry[j];
        if (curQCMSEntry !== undefined && curQCMSEntry !== null) {
            for (i = 0; i < curQCMSEntry.materialCount; i++) {
                var building = curQCMSEntry.buildings[i];
                if(!building) continue;
                var materialName = building.materialName;
                if (materialName === "shadows") {
                    // var patch = new ReccePatch();
                    var patch = {};
                    patch._patchType = 2;
                    patch.building = building;
                    _patchs.push(patch);
                    // patch.initialize(thisObject.framework, building);
                    // thisObject.patchs.push(patch);

                }
                else if (materialName === "terrain_253" || materialName === "terrain_254" || materialName === "terrain_255" || materialName === "texture/sxh_018.jpg") {
                    // var patch = new ReccePatch();
                    var patch = {};
                    patch._patchType = 1;
                    patch.building = building;
                    _patchs.push(patch);
                    // patch.initialize(thisObject.framework, building);
                    //  thisObject.patchs.push(patch);
                }
                else {
                    var patch = {};
                    patch._patchType = 0;
                    patch.building = building;
                    _patchs.push(patch);

                    // var patch = new ReccePatch();
                    //patch._patchType = 0;
                    // patch.initialize(thisObject.framework, building);
                    //  thisObject.patchs.push(patch);
                }
            }
        }
    }

    return {state: RESOURCE_COMPILED, data: _patchs, jpeg: jpeg};

};


var IndoorRSMeshParser = {};

IndoorRSMeshParser.TAG_HCFF = 0x48434646;
IndoorRSMeshParser.TAG_GLOW = 0x474C4F57;
IndoorRSMeshParser.TAG_JPEG = 0x4A504547;
IndoorRSMeshParser.TAG_LCMT = 0x4C434D54;
IndoorRSMeshParser.TAG_CMDL = 0x434D444C;
IndoorRSMeshParser.TAG_QCMS = 0x51434D53;
IndoorRSMeshParser.TAG_TREE = 0x54524545;
IndoorRSMeshParser.TAG_ROAD = 0x524F4144;
IndoorRSMeshParser.TAG_RAIL = 0x5241494C;

IndoorRSMeshParser.parse = function (byteStream, recceLayer) {
    if (byteStream.byteLength === 0)
        return null;
    recceLayer = recceLayer || {};
    recceLayer.chunkData = recceLayer.chunkData || {};
    var uint8Stream = new Uint8Array(byteStream);
    /*copy the raw data into b4*/

    var parseContext = {};
    parseContext.byteStream = byteStream;
    parseContext.dataView = new DataView(byteStream);


    parseContext.uint8Stream = uint8Stream;
    parseContext.uint8Cursor = 0;

    var isContinue = true;
    while (isContinue && (parseContext.uint8Cursor <= byteStream.byteLength - 4)) {
        var tag = parseContext.dataView.getUint32(parseContext.uint8Cursor);
        parseContext.uint8Cursor += 4;

        switch (tag) {
            case  IndoorRSMeshParser.TAG_HCFF:
                recceLayer.chunkData.hcffEntry = IndoorRSMeshParser.parseHCFF(parseContext);
                break;
            case  IndoorRSMeshParser.TAG_GLOW:
                recceLayer.chunkData.glowEntry = IndoorRSMeshParser.parseGlOW(parseContext);
                break;
            case  IndoorRSMeshParser.TAG_JPEG:
                recceLayer.chunkData.jpegEntry = IndoorRSMeshParser.parseJPEG(parseContext);
                break;
            case  IndoorRSMeshParser.TAG_LCMT:
                recceLayer.chunkData.lcmtEntry = IndoorRSMeshParser.parseLCMT(parseContext);
                break;
            case  IndoorRSMeshParser.TAG_CMDL:
                recceLayer.chunkData.cmdlEntry = IndoorRSMeshParser.parseCMDL(parseContext);
                break;
            case  IndoorRSMeshParser.TAG_QCMS:
                if (recceLayer.chunkData.qcmsEntry === undefined) {
                    recceLayer.chunkData.qcmsEntry = new Array();
                } else {
                    var xxxx = 0;
                }
                var heightOffset = 0.0;
                if (recceLayer.chunkData.roadEntry !== undefined) {
                    heightOffset = 1.0;
                }
                recceLayer.chunkData.qcmsEntry[recceLayer.chunkData.qcmsEntry.length] = IndoorRSMeshParser.parseQCMS(parseContext, heightOffset, recceLayer.chunkData.cmdlEntry);
                break;
            case  IndoorRSMeshParser.TAG_TREE:
                recceLayer.chunkData.treeEntry = IndoorRSMeshParser.parseTREE(parseContext);
                break;
            case  IndoorRSMeshParser.TAG_ROAD:
                recceLayer.chunkData.roadEntry = IndoorRSMeshParser.parseROAD(parseContext);
                break;
            case IndoorRSMeshParser.TAG_RAIL:
                recceLayer.chunkData.railEntry = IndoorRSMeshParser.parseRAIL(parseContext);
                break;
            default:
            {
                isContinue = false;
            }
                break;
        }
    }

//            if(recceLayer.chunkData.qcmsEntry.length > 1){
//                var xxx =0;
//            }
    parseContext.dataView = null;
    uint8Stream = null;

    return recceLayer.chunkData;
};

var stringLength = 0;
IndoorRSMeshParser.parseFixedString = function (parseContext) {
    stringLength = parseContext.uint8Stream[parseContext.uint8Cursor++];
    var str = String.fromCharCode.apply(null, [].slice.call(parseContext.uint8Stream, parseContext.uint8Cursor, parseContext.uint8Cursor + stringLength));
    parseContext.uint8Cursor += stringLength;
    return str;
};

IndoorRSMeshParser.skipAlignmentBytes = function (parseContext) {
    var modeCursor = parseContext.uint8Cursor % 4;
    if (modeCursor != 0) {
        parseContext.uint8Cursor += (4 - modeCursor);
    }
};

IndoorRSMeshParser.parseHCFF = function (parseContext) {
    var hcffEntry = {};
    //couser = 5;
    var dataView = parseContext.dataView;
    //hcffEntry.tag = dataView.getUint32(parseContext.uint8Cursor);    parseContext.uint8Cursor += 4;
    hcffEntry.tag = IndoorRSMeshParser.TAG_HCFF;
    hcffEntry.headVersion = dataView.getInt8(parseContext.uint8Cursor++);
    hcffEntry.bodyVersion = dataView.getInt8(parseContext.uint8Cursor++);
    hcffEntry.bodyAlignment = dataView.getInt8(parseContext.uint8Cursor++);
    hcffEntry.numOfChildren = dataView.getInt8(parseContext.uint8Cursor++);
    hcffEntry.bodyLength = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    return hcffEntry
};

IndoorRSMeshParser.parseTREE = function (parseContext) {
    var treeEntry = {};
    //couser = 5;
    var dataView = parseContext.dataView;
    //hcffEntry.tag = dataView.getUint32(parseContext.uint8Cursor);    parseContext.uint8Cursor += 4;
    treeEntry.tag = IndoorRSMeshParser.TAG_HCFF;
    treeEntry.headVersion = dataView.getInt8(parseContext.uint8Cursor++);
    treeEntry.bodyVersion = dataView.getInt8(parseContext.uint8Cursor++);
    treeEntry.bodyAlignment = dataView.getInt8(parseContext.uint8Cursor++);
    treeEntry.numOfChildren = dataView.getInt8(parseContext.uint8Cursor++);
    treeEntry.bodyLength = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    IndoorRSMeshParser.skipAlignmentBytes(parseContext);
    return treeEntry
};

IndoorRSMeshParser.parseROAD = function (parseContext) {
    var roadEntry = {};
    //couser = 5;
    var dataView = parseContext.dataView;
    //hcffEntry.tag = dataView.getUint32(parseContext.uint8Cursor);    parseContext.uint8Cursor += 4;
    roadEntry.tag = IndoorRSMeshParser.TAG_ROAD;
    roadEntry.headVersion = dataView.getInt8(parseContext.uint8Cursor++);
    roadEntry.bodyVersion = dataView.getInt8(parseContext.uint8Cursor++);
    roadEntry.bodyAlignment = dataView.getInt8(parseContext.uint8Cursor++);
    roadEntry.numOfChildren = dataView.getInt8(parseContext.uint8Cursor++);
    roadEntry.bodyLength = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    IndoorRSMeshParser.skipAlignmentBytes(parseContext);
    return roadEntry
};

IndoorRSMeshParser.parseRAIL = function (parseContext) {
    var railEntry = {};
    //couser = 5;
    var dataView = parseContext.dataView;
    //hcffEntry.tag = dataView.getUint32(parseContext.uint8Cursor);    parseContext.uint8Cursor += 4;
    railEntry.tag = IndoorRSMeshParser.TAG_RAIL;
    railEntry.headVersion = dataView.getInt8(parseContext.uint8Cursor++);
    railEntry.bodyVersion = dataView.getInt8(parseContext.uint8Cursor++);
    railEntry.bodyAlignment = dataView.getInt8(parseContext.uint8Cursor++);
    railEntry.numOfChildren = dataView.getInt8(parseContext.uint8Cursor++);
    railEntry.bodyLength = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    IndoorRSMeshParser.skipAlignmentBytes(parseContext);
    return railEntry
};


IndoorRSMeshParser.parseGlOW = function (parseContext) {
    var glowEntry = {};
    //couser = 5;
    var dataView = parseContext.dataView;
    //glowEntry.tag = dataView.getUint32(parseContext.uint8Cursor);    parseContext.uint8Cursor += 4;
    glowEntry.tag = IndoorRSMeshParser.TAG_GLOW;
    glowEntry.headVersion = dataView.getInt8(parseContext.uint8Cursor++);
    glowEntry.bodyVersion = dataView.getInt8(parseContext.uint8Cursor++);
    glowEntry.bodyAlignment = dataView.getInt8(parseContext.uint8Cursor++);
    glowEntry.numOfChildren = dataView.getInt8(parseContext.uint8Cursor++);
    glowEntry.bodyLength = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    return glowEntry
};

IndoorRSMeshParser.parseJPEG = function (parseContext) {
    var jpegEntry = {};
    //couser = 5;
    var dataView = parseContext.dataView;
    //jpegEntry.tag = dataView.getUint32(parseContext.uint8Cursor);    parseContext.uint8Cursor += 4;
    jpegEntry.tag = IndoorRSMeshParser.TAG_JPEG;
    jpegEntry.headVersion = dataView.getInt8(parseContext.uint8Cursor++);
    jpegEntry.bodyVersion = dataView.getInt8(parseContext.uint8Cursor++);
    jpegEntry.bodyAlignment = dataView.getInt8(parseContext.uint8Cursor++);
    jpegEntry.numOfChildren = dataView.getInt8(parseContext.uint8Cursor++);
    jpegEntry.bodyLength = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    jpegEntry.jpegBuffer = new Uint8Array(parseContext.byteStream, parseContext.uint8Cursor, jpegEntry.bodyLength);

//            var uint8Stream = new Uint8Array(parseContext.byteStream);
//            var txt= String.fromCharCode.apply(null,[].slice.call(uint8Stream,parseContext.uint8Cursor,jpegEntry.bodyLength));

    parseContext.uint8Cursor += jpegEntry.bodyLength;


    return jpegEntry
};

IndoorRSMeshParser.parseLCMT = function (parseContext) {
    var lcmtEntry = {};
    //couser = 5;
    var dataView = parseContext.dataView;
//            lcmtEntry.tag = dataView.getUint32(parseContext.uint8Cursor);    parseContext.uint8Cursor += 4;
    lcmtEntry.tag = IndoorRSMeshParser.TAG_LCMT;
    lcmtEntry.headVersion = dataView.getInt8(parseContext.uint8Cursor++);
    lcmtEntry.bodyVersion = dataView.getInt8(parseContext.uint8Cursor++);
    lcmtEntry.bodyAlignment = dataView.getInt8(parseContext.uint8Cursor++);
    lcmtEntry.numOfChildren = dataView.getInt8(parseContext.uint8Cursor++);
    lcmtEntry.bodyLength = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;

    IndoorRSMeshParser.skipAlignmentBytes(parseContext);
    return lcmtEntry
};


IndoorRSMeshParser.parseCMDL = function (parseContext) {
    var cmdlEntry = {};
    var dataView = parseContext.dataView;
    //cmdlEntry.tag = dataView.getUint32(parseContext.uint8Cursor);    parseContext.uint8Cursor += 4;
    cmdlEntry.tag = IndoorRSMeshParser.TAG_CMDL;
    cmdlEntry.headVersion = dataView.getInt8(parseContext.uint8Cursor++);
    cmdlEntry.bodyVersion = dataView.getInt8(parseContext.uint8Cursor++);
    cmdlEntry.bodyAlignment = dataView.getInt8(parseContext.uint8Cursor++);
    cmdlEntry.numOfChildren = dataView.getInt8(parseContext.uint8Cursor++);
    cmdlEntry.bodyLength = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    cmdlEntry.name = IndoorRSMeshParser.parseFixedString(parseContext);
    cmdlEntry.min_x = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    cmdlEntry.min_y = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    cmdlEntry.min_z = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    cmdlEntry.max_x = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    cmdlEntry.max_y = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    cmdlEntry.max_z = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    return cmdlEntry;
};

IndoorRSMeshParser.parseShadowData = function (shadow, parseContext, positionArray) {
    var dataView = parseContext.dataView;
    //////////////////////////////////////////////////////////////////////////
    var verticesCount = shadow.verticesCount;
    var facesIndexCount = shadow.facesIndexCount;
    shadow.verticesArray = new Uint16Array(verticesCount * 4);
    shadow.noramlArray = new Uint16Array(verticesCount);
    shadow.faceIndices = new Uint16Array(facesIndexCount);

    //////////////////////////////////////////////////////////////////////////
    // 读取Shadow位置索引
    //entry.shadowVerticesCount = 36;
    //entry.shadowFaceIndexCount = 84;
    var verticesArray = shadow.verticesArray;
    //noramlArray =  qcmsEntry.shadows.noramlArray;
    var faceIndices = shadow.faceIndices;

    var index = 0;
    var ni = 0;
    for (ni = 0; ni < verticesCount; ni++) {
        index += dataView.getInt16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
        verticesArray[ni * 4] = positionArray[index * 3];
        verticesArray[ni * 4 + 1] = positionArray[index * 3 + 1];
        verticesArray[ni * 4 + 2] = positionArray[index * 3 + 2];
    }

    //////////////////////////////////////////////////////////////////////////
    // 读取Shadow的法线
    for (ni = 0; ni < verticesCount; ni++) {
        index = dataView.getUint16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
        verticesArray[4 * ni + 3] = index;
    }

    //////////////////////////////////////////////////////////////////////////
    // 读取Shadow面索引
    index = 0;
    for (ni = 0; ni < facesIndexCount; ni++) {
        index += dataView.getInt16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
        faceIndices[ni] = index;
    }
}

IndoorRSMeshParser.parseBuildingData = function (building, parseContext, positionArray) {
    //var positionArray = new Uint16Array(parseContext.byteStream, parseContext.uint8Cursor, positionArrayCount * 3);    parseContext.uint8Cursor += (positionArrayCount * 3 * 2) ;
    var dataView = parseContext.dataView;
    //////////////////////////////////////////////////////////////////////////
    var verticesCount = building.verticesCount;
    var facesIndexCount = building.facesIndexCount;
    building.verticesArray = new Uint16Array(verticesCount * 4);
    //  qcmsEntry.buildings.noramlArray = new Uint16Array(verticesCount);
    building.textureCoordArray = new Uint16Array(verticesCount * 2);
    building.faceIndices = new Uint16Array(facesIndexCount);
    //////////////////////////////////////////////////////////////////////
    // 读取Building的Vertices
    var verticesArray = building.verticesArray;
    var textureCoordArray = building.textureCoordArray;
    var faceIndices = building.faceIndices;

    var index = 0;
    var ni = 0;
    for (ni = 0; ni < verticesCount; ni++) {
        index += dataView.getInt16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
        verticesArray[ni * 4] = positionArray[index * 3];
        verticesArray[ni * 4 + 1] = positionArray[index * 3 + 1];
        verticesArray[ni * 4 + 2] = positionArray[index * 3 + 2];
    }


    //////////////////////////////////////////////////////////////////////////
    // 读取法线
    for (ni = 0; ni < verticesCount; ni++) {
        srcNor = dataView.getUint16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
        var nx = (srcNor >> 10 & 0x001F) * bt5_zip * 2.0 - 1.0;
        var ny = (srcNor >> 5 & 0x001F) * bt5_zip * 2.0 - 1.0;
        var nz = (srcNor & 0x001F) * bt5_zip * 2.0 - 1.0;
        if(nz >0){
            srcNor = 16896;
        }
        verticesArray[ni * 4 + 3] = srcNor;// 16895;// 16912;//16896;//srcNor;

    }

    //////////////////////////////////////////////////////////////////////////
    // 读取纹理坐标
    for (ni = 0; ni < verticesCount; ni++) {
        index = dataView.getUint16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
        textureCoordArray[ni * 2] = index;
        index = dataView.getUint16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
        textureCoordArray[ni * 2 + 1] = index;
    }


    //////////////////////////////////////////////////////////////////////////
    // 读取building面索引
    index = 0;
    for (ni = 0; ni < facesIndexCount; ni++) {
        index += dataView.getInt16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
        faceIndices[ni] = index;
    }
}

IndoorRSMeshParser.parseBuildingDataUnpack = function (building, parseContext, positionArray, cmdl) {
    //var positionArray = new Uint16Array(parseContext.byteStream, parseContext.uint8Cursor, positionArrayCount * 3);    parseContext.uint8Cursor += (positionArrayCount * 3 * 2) ;
    var dataView = parseContext.dataView;
    //////////////////////////////////////////////////////////////////////////
    var verticesCount = building.verticesCount;
    var facesIndexCount = building.facesIndexCount;
    var verticesStride = 6;
    building.verticesArray = new Float32Array(verticesCount * verticesStride);
    //  qcmsEntry.buildings.noramlArray = new Uint16Array(verticesCount);
    building.textureCoordArray = new Uint16Array(verticesCount * 2);
    building.faceIndices = new Uint32Array(facesIndexCount);
    //////////////////////////////////////////////////////////////////////
    // 读取Building的Vertices
    var verticesArray = building.verticesArray;
    var textureCoordArray = building.textureCoordArray;
    var faceIndices = building.faceIndices;

    var widthX = (cmdl.max_x - cmdl.min_x) * ust_zip;
    var widthY = (cmdl.max_y - cmdl.min_y) * ust_zip;
    var widthZ = (cmdl.max_z - cmdl.min_z) * ust_zip;

    var uvWX = (building.max_u - building.min_u) * ust_zip;
	var uvWY = (building.max_v - building.min_v) * ust_zip;

    var index = 0;
    var ni = 0;
    for (ni = 0; ni < verticesCount; ni++) {
        index += dataView.getInt16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
        verticesArray[ni * verticesStride]     = cmdl.min_x + positionArray[index * 3]     * widthX;
        verticesArray[ni * verticesStride + 1] = cmdl.min_y + positionArray[index * 3 + 1] * widthY;
        verticesArray[ni * verticesStride + 2] = cmdl.min_z + positionArray[index * 3 + 2] * widthZ;
    }


    //////////////////////////////////////////////////////////////////////////
    // 读取法线
    if(building.count2 === 0){
        for (ni = 0; ni < verticesCount; ni++) {
            srcNor = dataView.getUint16(parseContext.uint8Cursor, true);
            parseContext.uint8Cursor += 2;
            //0.5, -0.5, 0.70710677
            //verticesArray[ni * verticesStride + 3] = -0.5; //(srcNor >> 10 & 0x001F) * bt5_zip * 2.0 - 1.0;
            //verticesArray[ni * verticesStride + 4] = 0.5; //(srcNor >> 5 & 0x001F) * bt5_zip * 2.0 - 1.0;
            //verticesArray[ni * verticesStride + 5] = -0.70710677; //(srcNor & 0x001F) * bt5_zip * 2.0 - 1.0;

            verticesArray[ni * verticesStride + 3] = (srcNor >> 10 & 0x001F) * bt5_zip * 2.0 - 1.0;
            verticesArray[ni * verticesStride + 4] = (srcNor >> 5 & 0x001F) * bt5_zip * 2.0 - 1.0;
            verticesArray[ni * verticesStride + 5] = (srcNor & 0x001F) * bt5_zip * 2.0 - 1.0;
        }
    } else if (building.count2 === 1){
        // 读取法线2
        for (ni = 0; ni < verticesCount; ni++) {
            srcNor = dataView.getUint16(parseContext.uint8Cursor, true);
            parseContext.uint8Cursor += 2;
            verticesArray[ni * verticesStride + 3] = (srcNor) * ust_zip * 2.0 - 1.0;
            srcNor = dataView.getUint16(parseContext.uint8Cursor, true);
            parseContext.uint8Cursor += 2;
            verticesArray[ni * verticesStride + 4] = (srcNor) * ust_zip * 2.0 - 1.0;
            srcNor = dataView.getUint16(parseContext.uint8Cursor, true);
            parseContext.uint8Cursor += 2;
            verticesArray[ni * verticesStride + 5] = (srcNor) * ust_zip * 2.0 - 1.0;

        }
    }

    //////////////////////////////////////////////////////////////////////////
    // 读取纹理坐标
    for (ni = 0; ni < verticesCount; ni++) {
        index = dataView.getUint16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
        textureCoordArray[ni * 2] = index; //building.min_u + index * uvWX ;
        index = dataView.getUint16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
        textureCoordArray[ni * 2 + 1] = index; //building.min_v + index * uvWY;
    }


    //////////////////////////////////////////////////////////////////////////
    // 读取building面索引
    index = 0;
    for (ni = 0; ni < facesIndexCount; ni++) {
        index += dataView.getInt16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
        faceIndices[ni] = index;
    }
}


IndoorRSMeshParser.parseQCMS = function (parseContext, heightOffset, cmdl) {
    var qcmsEntry = {};
    var dataView = parseContext.dataView;
    var uint8Stream = parseContext.uint8Stream;
    //qcmsEntry.tag = dataView.getUint32(parseContext.uint8Cursor);    parseContext.uint8Cursor += 4;
    qcmsEntry.tag = IndoorRSMeshParser.TAG_QCMS;
    qcmsEntry.headVersion = dataView.getInt8(parseContext.uint8Cursor++);
    qcmsEntry.bodyVersion = dataView.getInt8(parseContext.uint8Cursor++);
    qcmsEntry.bodyAlignment = dataView.getInt8(parseContext.uint8Cursor++);
    qcmsEntry.numOfChildren = dataView.getInt8(parseContext.uint8Cursor++);
    qcmsEntry.bodyLength = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    IndoorRSMeshParser.skipAlignmentBytes(parseContext);
    
    // parseContext.uint8Cursor = startCursor + qcmsEntry.bodyLength;
    if(qcmsEntry.headVersion === 3 || qcmsEntry.headVersion === 4){
        IndoorRSMeshParser.parseQCMSInstance(parseContext, qcmsEntry, heightOffset, cmdl);
    }else{
        IndoorRSMeshParser.parseQCMSNormal(parseContext, qcmsEntry, heightOffset, cmdl);
    }

    return qcmsEntry
};


IndoorRSMeshParser.parseQCMSNormal = function(parseContext, qcmsEntry, heightOffset, cmdl){
    var dataView = parseContext.dataView;
    var startCursor = parseContext.uint8Cursor;
    qcmsEntry.materialCount = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    var allbuildings = new Array(qcmsEntry.materialCount);

    for (var materialIndex = 0; materialIndex < qcmsEntry.materialCount; materialIndex++) {
        var materialName = IndoorRSMeshParser.parseFixedString(parseContext);
        if (materialName === "shadows") {
            var shadows = IndoorRSMeshParser.parseShadows(parseContext);
            shadows.materialName = materialName;
            allbuildings[materialIndex] = shadows;
        }
        else {
            var building = IndoorRSMeshParser.parseBuildingHead(parseContext);
            building.materialName = materialName;
            allbuildings[materialIndex] = building;
            building.min_y += heightOffset;
            building.max_y += heightOffset;
        }
    }

    // 读取buildingEntry
    for (var materialIndex = 0; materialIndex < qcmsEntry.materialCount; materialIndex++) {
        var building = allbuildings[materialIndex];
        var childCount = dataView.getUint32(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 4;
        building.entryArray = new Array(childCount);

        for (var ni = 0; ni < childCount; ni++) {
            building.entryArray[ni] = IndoorRSMeshParser.parseBuildingEntry(parseContext);
        }
    }

    // Read Position Array
    var positionArrayCount = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    qcmsEntry.positionArrayCount = positionArrayCount;
    var positionArray = new Uint16Array(positionArrayCount * 3);
    positionArrayCount *= 3;
    for (ni = 0; ni < positionArrayCount; ni++) {
        positionArray[ni] = dataView.getUint16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
    }

    for (var materialIndex = 0; materialIndex < qcmsEntry.materialCount; materialIndex++) {
        var building = allbuildings[materialIndex];
        if (building.materialName === "shadows") {
            IndoorRSMeshParser.parseShadowData(building, parseContext, positionArray);
        } else {
            IndoorRSMeshParser.parseBuildingData(building, parseContext, positionArray);
            // IndoorRSMeshParser.parseBuildingDataUnpack(building, parseContext, positionArray, cmdl);
        }
    }
    qcmsEntry.buildings = allbuildings;

    positionArray = null;
    IndoorRSMeshParser.skipAlignmentBytes(parseContext);
}
IndoorRSMeshParser.parseQCMSInstance = function(parseContext, qcmsEntry, heightOffset, cmdl){
    var dataView = parseContext.dataView;
    qcmsEntry.materialCount = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    // allbuildings = new Array(qcmsEntry.materialCount);

    var geometryArray = [];
    var shadowArray = [];
    for (var materialIndex = 0; materialIndex < qcmsEntry.materialCount; materialIndex++) {
        var materialName = IndoorRSMeshParser.parseFixedString(parseContext);
        if (materialName === "shadows") {
            var shadows = IndoorRSMeshParser.parseShadows(parseContext);
            shadows.materialName = materialName;
            shadowArray.push( shadows);
        }
        else {
            var geometry = IndoorRSMeshParser.parseBuildingHead(parseContext);
            geometry.materialName = materialName;
            geometryArray.push(geometry);
            // qcmsEntry.buildings[materialIndex] = building;
            geometry.min_y += heightOffset;
            geometry.max_y += heightOffset;
        }
    }

    // 读取buildingEntry
    for (var i = 0; i < geometryArray.length; i++) {
        var geometry = geometryArray[i];
        var childCount = dataView.getUint32(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 4;
        geometry.entryArray = new Array(childCount);

        for (var ni = 0; ni < childCount; ni++) {
            geometry.entryArray[ni] = IndoorRSMeshParser.parseBuildingEntry(parseContext);
        }
    }

    // Read Position Array
    var positionArrayCount = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    qcmsEntry.positionArrayCount = positionArrayCount;
    var positionArray = new Uint16Array(positionArrayCount * 3);
    positionArrayCount *= 3;
    for (ni = 0; ni < positionArrayCount; ni++) {
        positionArray[ni] = dataView.getUint16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
    }

    
    for (var i = 0; i < geometryArray.length; i++) {
        var geometry = geometryArray[i];
        if (geometry.materialName === "shadows") {
            IndoorRSMeshParser.parseShadowData(geometry, parseContext, positionArray);
        } else {
            IndoorRSMeshParser.parseBuildingDataUnpack(geometry, parseContext, positionArray, cmdl);
        }
    }

    var instancedGeometryArray = [];
    IndoorRSMeshParser.parseISTCData(parseContext, heightOffset, geometryArray, instancedGeometryArray, cmdl, qcmsEntry.headVersion)
    qcmsEntry.buildings = instancedGeometryArray;

    positionArray = null;
    IndoorRSMeshParser.skipAlignmentBytes(parseContext);
}

IndoorRSMeshParser.parseISTCData = function (parseContext, heightOffset, geometryArray, instancedGeometryArray, cmdl, version) {
    var dataView = parseContext.dataView;
    var modelCount = dataView.getInt32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    var elementCount = modelCount * 3;

    var positionArray = new Array(elementCount);
    var rotationArray = new Array(elementCount);
    var scaleArray = new Array(elementCount);

    IndoorRSMeshParser.parseISTCPose(parseContext, heightOffset, positionArray, rotationArray, scaleArray, cmdl, version);

    for(var i = 0; i < geometryArray.length; i++){
        var geometry = geometryArray[i];
        IndoorRSMeshParser.parseISTCGeometry(instancedGeometryArray, geometry, positionArray, rotationArray, scaleArray, cmdl);
    }
    
    // debugger;
}



var tempPosArray = [];
var tempRotationArray = [];
var tempScaleArray = [];
IndoorRSMeshParser.parseISTCGeometrys = function (instancedGeometryArray, geometry, positionArray, rotationArray, scaleArray, cmdl){
    var posCount = positionArray.length / 3;
    var vtxCount = geometry.verticesCount;
    var faceIndexCount = geometry.facesIndexCount;
    // if(geometry.materialName == "texture/xp_027.jpg"){
    //     var xxxxx = 0;
    // }

    if(vtxCount > 65535){
        console.log("[" + geometry.materialName + "] : more than 65535 vertices!")
        return;
    }

    if(vtxCount * posCount > 200000){
        console.log("[" + geometry.materialName + "] : has " + vtxCount * posCount + " vertices!")
    }

    var objectCountPerPatch = parseInt(65535 / vtxCount);
    var currIndex = 0;
    while(currIndex < posCount){
        tempPosArray.length = 0;
        tempRotationArray.length = 0;
        tempScaleArray.length = 0;
        for(var i = 0; i < objectCountPerPatch; i++){
            var index = currIndex * 3
            tempPosArray.push(positionArray[index]);
            tempPosArray.push(positionArray[index + 1]);
            tempPosArray.push(positionArray[index + 2]);

            tempRotationArray.push(rotationArray[index]);
            tempRotationArray.push(rotationArray[index + 1]);
            tempRotationArray.push(rotationArray[index + 2]);

            tempScaleArray.push(scaleArray[index]);
            tempScaleArray.push(scaleArray[index + 1]);
            tempScaleArray.push(scaleArray[index + 2]);
            currIndex ++;
            if(currIndex >= posCount){
                break;
            }
        }

        IndoorRSMeshParser.parseISTCGeometry(instancedGeometryArray, geometry, tempPosArray, tempRotationArray, tempScaleArray, cmdl);
    }
}



// var minVec = [0,0,0];
// var maxVec = [0,0,0];
// var transMat = Matrix.create();

var transMat = Matrix_create();
var tempTranslate = [0,0,0];
var tempScale = [1,1,1];
var tempRotate = [0,0,0];
var vertexPosition = [0,0,0];
var vertexNormal = [0,0,0];
var minBoundary = [9999999, 9999999, 9999999];
var maxBoundary = [-9999999, -9999999, -9999999];

var uKeyLightDir = [0.5, -0.5, 0.70710677];
var uBackLightDir = [-0.5, 0.5, -0.70710677];
var uFillLightDir = [0.0, 0.0, -1.0];
IndoorRSMeshParser.parseISTCGeometry = function (instancedGeometryArray, geometry, positionArray, rotationArray, scaleArray, cmdl) {
    var posCount = positionArray.length / 3;
    var vtxCount = geometry.verticesCount;
    var faceIndexCount = geometry.facesIndexCount;

    if(vtxCount > 65535){
        console.log("[" + geometry.materialName + "] : is too much vertices!")
    }

    var instancedGeometry = {};
    if(posCount * vtxCount >65535){
        console.log("[" + geometry.materialName + "] : is too much vertices!")
        // return;
        instancedGeometry.is32BitIndex = true;
    } else{
        instancedGeometry.is32BitIndex = false;
    }
    var vtxSize = posCount * vtxCount * 3;
    var normalSize = posCount * vtxCount * 3;
    var texSize = posCount * vtxCount * 2;
    var newSize = vtxSize + normalSize;
    var dstVtxData = new Float32Array(newSize);
    var dstTexData = new Uint16Array(texSize);
    var dstFaceData = null;
    if(  instancedGeometry.is32BitIndex){
        dstFaceData = new Uint32Array(faceIndexCount*posCount);
    }else{
        dstFaceData = new Uint16Array(faceIndexCount*posCount);
    }

    // Vector3f*     vtxPos = (Vector3f*)(geometry->m_vtxdata + geometry->m_vtxOffset);
	// Vector3f*     vtxNor = (Vector3f*)(geometry->m_vtxdata + geometry->m_normalOffset);
    // Vector2f*     vtxTex = (Vector2f*)(geometry->m_vtxdata + geometry->m_texOffset);
    var dstIndex = 0;
    var dstTexIndex = 0;
    var dstFaceIndex = 0;

    instancedGeometry.min_x = 9999999;
    instancedGeometry.min_y = 9999999;
    instancedGeometry.min_z = 9999999;
    instancedGeometry.max_x = -9999999;
    instancedGeometry.max_y = -9999999;
    instancedGeometry.max_z = -9999999;
    

    var currentFaceIndex = 0;
    for(var i = 0; i < posCount; i++){
        var index = i * 3;
        tempTranslate[0] = positionArray[index + 0];
        tempTranslate[1] = positionArray[index + 1];
        tempTranslate[2] = positionArray[index + 2];
        tempRotate [0] = rotationArray[index + 0];
        tempRotate [1] = rotationArray[index + 1];
        tempRotate [2] = rotationArray[index + 2];
        tempScale [0] = scaleArray[index + 0];
        tempScale [1] = scaleArray[index + 1];
        tempScale [2] = scaleArray[index + 2]
        IndoorRSMeshParser.generateMatrix(transMat, tempTranslate, tempRotate, tempScale);
        var srcIndex = 0;
        var srcTexIndex = 0;
        for(var j = 0; j < vtxCount; j++){
            
            vertexPosition[0] = geometry.verticesArray[srcIndex++];
            vertexPosition[1] = geometry.verticesArray[srcIndex++];
            vertexPosition[2] = geometry.verticesArray[srcIndex++];
            vertexNormal[0] = geometry.verticesArray[srcIndex++];
            vertexNormal[1] = geometry.verticesArray[srcIndex++];
            vertexNormal[2] = geometry.verticesArray[srcIndex++];

            Vector3_transformCoords(vertexPosition, vertexPosition, transMat);
            Vector3_transformNormal(vertexNormal, vertexNormal, transMat);
            Vector3_normalize(vertexNormal, vertexNormal);
            // Position Normal
            dstVtxData[dstIndex++] = vertexPosition[0];
            dstVtxData[dstIndex++] = vertexPosition[1];
            dstVtxData[dstIndex++] = vertexPosition[2];
            if(geometry.count2 === 0){
                dstVtxData[dstIndex++] = vertexNormal[0];
                dstVtxData[dstIndex++] = vertexNormal[1];
                dstVtxData[dstIndex++] = vertexNormal[2];
            }else if(geometry.count2 === 1){
                var lc = Math.max(Vector3_dot(vertexNormal, uKeyLightDir), 0.0);
                var bc = Math.max(Vector3_dot(vertexNormal, uBackLightDir), 0.0);
                var fc = Math.max(Vector3_dot(vertexNormal, uFillLightDir), 0.0);
                dstVtxData[dstIndex++] = lc;
                dstVtxData[dstIndex++] = bc;
                dstVtxData[dstIndex++] = fc;
            }
            

            instancedGeometry.min_x = Math.min(vertexPosition[0], instancedGeometry.min_x);
            instancedGeometry.min_y = Math.min(vertexPosition[1], instancedGeometry.min_y);
            instancedGeometry.min_z = Math.min(vertexPosition[2], instancedGeometry.min_z);
            instancedGeometry.max_x = Math.max(vertexPosition[0], instancedGeometry.max_x);
            instancedGeometry.max_y = Math.max(vertexPosition[1], instancedGeometry.max_y);
            instancedGeometry.max_z = Math.max(vertexPosition[2], instancedGeometry.max_z);

            // Texture
            dstTexData[dstTexIndex++] = geometry.textureCoordArray[srcTexIndex++];
            dstTexData[dstTexIndex++] = geometry.textureCoordArray[srcTexIndex++];
            // building.textureCoordArray = new Uint16Array(verticesCount * 2);
            // building.faceIndices = new Uint16Array(facesIndexCount);
        }
        var srcFaceIndex = 0;
        for(var j = 0; j < faceIndexCount; j++){
            dstFaceData[dstFaceIndex++] = geometry.faceIndices[srcFaceIndex++] + currentFaceIndex;
        }
        currentFaceIndex +=  vtxCount;
    }


    // Pack Position Normal
    instancedGeometryVertexCount = vtxCount * posCount;
    var dstPackedVtxData = new Uint16Array(instancedGeometryVertexCount * 4);
    var widthX = instancedGeometry.max_x - instancedGeometry.min_x;
    var widthY = instancedGeometry.max_y - instancedGeometry.min_y;
    var widthZ = instancedGeometry.max_z - instancedGeometry.min_z;
    var scaleX = 65535.0 / widthX ;
    var scaleY = 65535.0 / widthY;
    var scaleZ = 65535.0 / widthZ;
    var dstIndex = 0;
    var srcIndex = 0;
    var normal = 0;
    
    for(var  i = 0; i < instancedGeometryVertexCount; i++){
        dstIndex = i *4;
        srcIndex = i *6;
        dstPackedVtxData[dstIndex    ] = Math.max(parseInt((dstVtxData[srcIndex    ] - instancedGeometry.min_x)* scaleX), 0 );
        dstPackedVtxData[dstIndex + 1] = Math.max(parseInt((dstVtxData[srcIndex + 1] - instancedGeometry.min_y)* scaleY), 0 );
        dstPackedVtxData[dstIndex + 2] = Math.max(parseInt((dstVtxData[srcIndex + 2] - instancedGeometry.min_z)* scaleZ), 0 );
        // var zzzz = parseInt((dstVtxData[srcIndex + 2] - instancedGeometry.min_z)* scaleZ);
        // if(zzzz>3200 || zzzz < 0) {
        //     ddddd.push({
        //         index : dstIndex + 2, 
        //         val : zzzz
        //     });
        // }
        //  dstPackedVtxData[dstIndex + 2] = zzzz;
        if(geometry.count2 === 0){
            normal = ((parseInt((dstVtxData[srcIndex + 3] + 1.0 ) * 0.5 * 31.0 ) & 0x001F) << 10) |
                    ((parseInt((dstVtxData[srcIndex + 4] + 1.0 ) * 0.5 * 31.0 ) & 0x001F) << 5) | 
                    ( parseInt((dstVtxData[srcIndex + 5] + 1.0 ) * 0.5 * 31.0 ) & 0x001F);
            dstPackedVtxData[dstIndex + 3] = normal;
        }else if(geometry.count2 === 1){
            normal = ((parseInt(dstVtxData[srcIndex + 3] * 31.0 ) & 0x001F) << 11) |
                    ((parseInt(dstVtxData[srcIndex + 4] * 31.0 ) & 0x001F) << 6) | 
                    ((parseInt(dstVtxData[srcIndex + 5] * 31.0 ) & 0x001F) << 1);
            dstPackedVtxData[dstIndex + 3] = normal;
        }
    }

    // instancedGeometry.is32BitIndex = true;
    instancedGeometry.min_u = geometry.min_u;
    instancedGeometry.min_v = geometry.min_v;
    instancedGeometry.max_u = geometry.max_u;
    instancedGeometry.max_v = geometry.max_v;


    instancedGeometry.materialName = geometry.materialName;
    instancedGeometry.verticesArray = dstPackedVtxData;
    instancedGeometry.textureCoordArray = dstTexData;
    instancedGeometry.faceIndices = dstFaceData;

    instancedGeometry.vtxCount = vtxCount * posCount;
    instancedGeometry.vtxOffset = 0;
    instancedGeometry.normalOffset = 0;
    instancedGeometry.texOffset = 0;
    instancedGeometry.facesIndexCount = faceIndexCount * posCount;

    instancedGeometryArray.push(instancedGeometry);
}

// var buildings = {};
// var dataView = parseContext.dataView;
// //buildings.name = IndoorRSMeshParser.parseFixedString(parseContext);
// buildings.count1 = dataView.getUint32(parseContext.uint8Cursor, true);
// parseContext.uint8Cursor += 4;
// buildings.count2 = dataView.getUint32(parseContext.uint8Cursor, true);
// parseContext.uint8Cursor += 4;
// buildings.verticesCount = dataView.getUint32(parseContext.uint8Cursor, true);
// parseContext.uint8Cursor += 4;
// buildings.facesIndexCount = dataView.getUint32(parseContext.uint8Cursor, true);
// parseContext.uint8Cursor += 4;
// buildings.min_x = dataView.getFloat32(parseContext.uint8Cursor, true);
// parseContext.uint8Cursor += 4;
// buildings.min_y = dataView.getFloat32(parseContext.uint8Cursor, true);
// parseContext.uint8Cursor += 4;
// buildings.min_z = dataView.getFloat32(parseContext.uint8Cursor, true);
// parseContext.uint8Cursor += 4;
// buildings.max_x = dataView.getFloat32(parseContext.uint8Cursor, true);
// parseContext.uint8Cursor += 4;
// buildings.max_y = dataView.getFloat32(parseContext.uint8Cursor, true);
// parseContext.uint8Cursor += 4;
// buildings.max_z = dataView.getFloat32(parseContext.uint8Cursor, true);
// parseContext.uint8Cursor += 4;
// //parseContext.uint8Cursor += 16;
// buildings.min_u = dataView.getFloat32(parseContext.uint8Cursor, true);
// parseContext.uint8Cursor += 4;
// buildings.min_v = dataView.getFloat32(parseContext.uint8Cursor, true);
// parseContext.uint8Cursor += 4;
// buildings.max_u = dataView.getFloat32(parseContext.uint8Cursor, true);
// parseContext.uint8Cursor += 4;
// buildings.max_v = dataView.getFloat32(parseContext.uint8Cursor, true);
// parseContext.uint8Cursor += 4;
// return buildings;

var ust_zip = 1.0/65535.0;
var bt5_zip = 1.0/31.0;
var degreeToRadian = Math.PI / 180;

IndoorRSMeshParser.parseISTCPose = function (parseContext, heightOffset, positionArray, rotationArray, scaleArray, cmdl, version) {
    var dataView = parseContext.dataView;
    var elementCount = positionArray.length;
    
    // positionArray = new Array(elementCount);
    // rotationArray = new Array(elementCount);
    // scaleArray = new Array(elementCount);
    var widthX = cmdl.max_x - cmdl.min_x;
    var widthY = cmdl.max_y - cmdl.min_y;
    var widthZ = cmdl.max_z - cmdl.min_z;
    for(var i = 0; i < elementCount; i+=3){
        var data = dataView.getUint16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
        positionArray[i] = data * ust_zip * widthX + cmdl.min_x;;

        var data = dataView.getUint16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
        positionArray[i + 1] = data * ust_zip * widthY + cmdl.min_y;;

        var data = dataView.getUint16(parseContext.uint8Cursor, true);
        parseContext.uint8Cursor += 2;
        positionArray[i + 2] = data * ust_zip * widthZ + cmdl.min_z;
    }

    if(version === 4){
        for(var i = 0; i < elementCount; i++){
            var data = dataView.getUint16(parseContext.uint8Cursor, true);
            parseContext.uint8Cursor += 2;
            rotationArray[i] = (data * ust_zip  * 2 - 1) * 180 * degreeToRadian;
        }

    
        for(var i = 0; i < elementCount; i++){
            var data = dataView.getUint16(parseContext.uint8Cursor, true);
            parseContext.uint8Cursor += 2;
            //scaleArray[i] = data * 100 * ust_zip;
            scaleArray[i] = (data * ust_zip * 2 - 1) * 100;
        }
    }else{

        for(var i = 0; i < elementCount; i++){
            var data = dataView.getUint16(parseContext.uint8Cursor, true);
            parseContext.uint8Cursor += 2;
            rotationArray[i] = data * degreeToRadian;
        }

        for(var i = 0; i < elementCount; i++){
            var data = dataView.getUint16(parseContext.uint8Cursor, true);
            parseContext.uint8Cursor += 2;
            scaleArray[i] = data * 100 * ust_zip;
        }
    }


}

// var matScale  = Matrix.create();
var tempMatScale = Matrix_create();
var tempMatRotationZ = Matrix_create();
var tempMatRotationX = Matrix_create();
var tempQuaternion = [0,0,0,1];
IndoorRSMeshParser.generateMatrix = function (outMat, translate, ratate, scale) {
    Matrix_scale(tempMatScale, scale[0], scale[1], scale[2]);
    // Matrix_rotateAxisZ(tempMatRotationZ, ratate[2]);
    // Matrix_rotateAxisX(tempMatRotationX, ratate[0]);
    // Matrix_multiply(tempMatRotationZ, tempMatRotationX, tempMatRotationZ);
    Quaternion_fromEuler(tempQuaternion, ratate[0], ratate[1], ratate[2]);
    Matrix_fromQuaternion(tempMatRotationZ, tempQuaternion);
    Matrix_multiply(outMat, tempMatScale, tempMatRotationZ);
    outMat[12] = translate[0];
    outMat[13] = translate[1];
    outMat[14] = translate[2];
}

IndoorRSMeshParser.parseBuildingHead = function (parseContext) {
    var buildings = {};
    var dataView = parseContext.dataView;
    //buildings.name = IndoorRSMeshParser.parseFixedString(parseContext);
    buildings.count1 = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildings.count2 = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildings.verticesCount = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildings.facesIndexCount = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildings.min_x = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildings.min_y = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildings.min_z = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildings.max_x = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildings.max_y = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildings.max_z = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    //parseContext.uint8Cursor += 16;
    buildings.min_u = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildings.min_v = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildings.max_u = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildings.max_v = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    return buildings;
};

IndoorRSMeshParser.parseBuildingEntry = function (parseContext) {
    var buildingEntry = {};
    var dataView = parseContext.dataView;
    buildingEntry.left = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildingEntry.right = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildingEntry.top = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildingEntry.bottom = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildingEntry.startFace = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildingEntry.endFace = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildingEntry.childCount = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    buildingEntry.nextLevel = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    return buildingEntry;
};

IndoorRSMeshParser.parseShadows = function (parseContext) {
    var shadows = {};
    var dataView = parseContext.dataView;
    // shadows.name = IndoorRSMeshParser.parseFixedString(parseContext);
    shadows.count1 = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    shadows.count2 = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    shadows.verticesCount = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    shadows.facesIndexCount = dataView.getUint32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    shadows.min_x = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    shadows.min_y = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    shadows.min_z = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    shadows.max_x = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    shadows.max_y = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    shadows.max_z = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    shadows.extrusion = dataView.getFloat32(parseContext.uint8Cursor, true);
    parseContext.uint8Cursor += 4;
    return shadows;
};


