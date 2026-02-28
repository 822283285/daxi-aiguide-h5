let ARNavigation = function(parentDom,params){
    let that = this;
    const clientHeight = document.documentElement.clientHeight;
    const cameraHeight = clientHeight - 250;
    const html = '<video id="cameraVideo" style="display: none" autoplay playsinline webkit-playsinline="true" x5-playsinline="true"></video>' +;
        `<div style="position: absolute;top: 0px;bottom: 0px;left:0px;width:100%;height:${cameraHeight}px;margin-top:0px" id="ARModuleCameraVideo"></div>` +
        '<div id="compassLine" style="display: none;position:absolute;"></div>'+
        '<div id="ARMask" style="position: absolute;top: 0px;bottom: 0px;left:0px;width: 100%;height: 100vh;background: rgba(45, 45, 45, 0.73);z-index: 8;">' +
      /*  '<img src="../utils/AR/img/close.png" id="ARCloseBtn" style="position: absolute;right: 14px;top: 20px;width: 26px;height: 26px;">'+*/
        '<div class="loading-tip" style="position:relative;text-align:center;top: 28%;color:#fff;"><img src="../utils/AR/img/artip.png" style="width:160px"><p>AR实景导航启动中</p></div></div>';
    $(parentDom).append(html);
  window.userMedia = "beforeOpen";
  if(window["command"]["eventByWSS"]){
      const data = {;
          "type": "postEventToMiniProgram",
          "id": window["command"]["userId"],
          "methodToMiniProgram": "event=beforeOpen",
          "roleType": "receiver"
      }
      window["locWebSocketPostMessage"] && window["locWebSocketPostMessage"](data);
  }
//   const start = new Date().getTime();
//   let now = start;
//   while (now - start < 1000) {
//       now = new Date().getTime();
//   }
  $(parentDom).on("click","#ARCloseBtn",function(event){
      $("#ARModuleCameraVideo").hide();
      $("#ARMask").hide();
      if(that.eventManager){
          that.eventManager.fire("closed")
      }
  });

    let camera, scene, renderer, controls, videoTexture, arWidth, arHeight;
    let dhLine, navigationPathPointList, navigationPathGeometry, navigationPathGeometryMaterial;
    let isAndroid = /Android/i.test(navigator.userAgent);
    let isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    let clock = new THREE.Clock();
    let model3D = null;
    let model3DLastRotate;
    let model3DShowLength = 5;
    let model3DIsShow = false;
    let mixer;
    let turnReminderTexture;
    let turnReminder;
    let referencePoint = {};
    let showCompassLine = false;
    let directionValue = ["东", "东南", "南", "西南", "西", "西北", "北", "东北", "东", "东南", "南", "西南", "西"];
    let pathPointList = [];
  let isInited
    function isMobile() {
        return isAndroid || isiOS;
    }

    function createSprite() {
        openCamera(arWidth, arHeight).then((video) => {
            videoTexture = new THREE.Texture(video);
            scene.background = videoTexture;
          window.userMedia = "opened";
          if(window["command"]["eventByWSS"]){
              const data = {;
                  "type": "postEventToMiniProgram",
                  "id": window["command"]["userId"],
                  "methodToMiniProgram": "event=opened",
                  "roleType": "receiver"
              }
              window["locWebSocketPostMessage"] && window["locWebSocketPostMessage"](data);
          }
      });
  }

    function openCamera(width, height) {
        const self = this;
        video = document.getElementById("cameraVideo");
        const constrains = {;
            // 关闭音频
            audio: false,
            video: {
                "sourceId": "default",
                // 在移动设备上面，表示优先使用前置摄像头
                // facingMode: 'user',
                facingMode: isMobile() ? {exact: "environment"} : {exact: 'user'},
                width: width,
                height: height,
                focusMode: {ideal: "continuous"},
            }
        };
        if (navigator.mediaDevices.getUserMedia === undefined) {
            navigator.mediaDevices.getUserMedia = function (constraints) {
                const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
                if (!getUserMedia) {
                    return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
                }
                return new Promise(function (resolve, reject) {
                    getUserMedia.call(navigator, constraints, resolve, reject);
                });
            }
        }

        navigator.mediaDevices.getUserMedia(constrains).then((stream) => {
            try {
                video.srcObject = stream;
            } catch (error) {
                console.error(error);
                video.src = window.URL.createObjectURL(stream);
            }
            self.localMediaStream = stream;
            video.play();
            video.width = width;
            video.height = height;

        }).catch((error) => {
            console.error(error);
        });

        return new Promise((resolve) => {
            // 在视频的元数据加载后执行 JavaScript
            video.onloadedmetadata = () => {
                resolve(video);
                $("#ARMask").hide();
            };
        });
    }
    this.hideTurnReminder = function(){
        if(turnReminder){
            scene.remove(turnReminder);
            if (turnReminder.material.map) {
                turnReminder.material.map.dispose();
            }
            turnReminder.geometry.dispose();
            turnReminder.material.dispose();
        }
    }

    this.showTurnReminder = function (points) {
        if(points && points.length === 2){
            const angle = calculateAngle(points);
            const loader = new THREE.TextureLoader();
            turnReminderTexture = loader.load('../utils/AR/img/left.png');
            turnReminderTexture.wrapS = THREE.RepeatWrapping;
            turnReminderTexture.wrapT = THREE.RepeatWrapping;
            turnReminderTexture.repeat.set(10, 1);
            const geometry = new THREE.PlaneGeometry(10, 1);
            const material = new THREE.MeshBasicMaterial({;
                map: turnReminderTexture,
                side: THREE.DoubleSide,
                transparent: true, // 允许透明
            });
            turnReminder = new THREE.Mesh(geometry, material);
            const point = getMercator(points[0]);
            turnReminder.position.set(point[0], point[1], 1);
            turnReminder.rotateX(90 * Math.PI / 180)
            turnReminder.rotateY(angle)
            scene.add(turnReminder);
        }
    }

    this.setLocation = function(points,time){
        if(points){
            const location = getMercator(points);
            moveToByTween(location,time);
            //更新3D小人位置
            if(model3DIsShow && model3D){
                updateModel3DPostion(new THREE.Vector3(location[0], location[1], 0));
            }
        }
    }

    //平滑移动当前位置
    function moveToByTween(points,time) {
        let tween = new TWEEN.Tween(camera.position);
        tween.to({
            x: points[0],
            y: 3,
            z: 0-points[1]
        }, time?time:200);
        tween.start();
    }
    //计算2个点和X轴弧度
    function calculateAngle(points) {
        const points1 = getMercator(points[0]);
        const points2 = getMercator(points[1]);
        const x1 = points1[0];
        const y1 = points1[1];
        const x2 = points2[0];
        const y2 = points2[1];
        // 计算斜率
        const k = (y2 - y1) / (x2 - x1);
        // 使用Math.atan2得到弧度值
        let angleInRadians = Math.atan2(k, 1);
        // 如果x2 < x1，则需要调整角度，因为atan2返回的是-π to π范围的角度
        if (x2 < x1 && y2 >= y1 || x2 >= x1 && y2 < y1) {
            angleInRadians += Math.PI;
        }
        return (angleInRadians + 2 * Math.PI) % (2 * Math.PI);
    }


    this.createNavigationLine = function(points,showLength,width,imgUrl) {
        const route = [];
        const test = [];
        for(var i = 0; i < points.length; i++){
            const mktPoint =getMercator(points[i]);
            test.push({x:mktPoint[0],y:mktPoint[1]});
            route.push(new THREE.Vector3(mktPoint[0], mktPoint[1], 0));
        }
        if(showLength){
            // var showPoints = clipSegmentByLength(test,showLength);
            // if(showPoints.point){
            //     var clipRoute = removeElementsAfterIndex(route,showPoints.index);
            //     clipRoute.push(new THREE.Vector3(showPoints.point.x, showPoints.point.y, 0));
            //     route = clipRoute;
            // }

            camera.far = showLength;  // 设置新的远裁剪面值
            camera.updateProjectionMatrix();
        }
        navigationPathPointList = new THREE.PathPointList();
        navigationPathPointList.set(route, 0.1, 5);
        navigationPathGeometry = new THREE.PathGeometry();
        width = width?width:1;
        navigationPathGeometry.update(navigationPathPointList, {
            width: width,
            arrow: false,
            progress: 1,
        });
        imgUrl = imgUrl?imgUrl:'../utils/AR/img/go.png';
        let img = new THREE.TextureLoader().load(imgUrl);
        img.wrapS = img.wrapT = THREE.RepeatWrapping;
        img.anisotropy = renderer.capabilities.getMaxAnisotropy();
        navigationPathGeometryMaterial = new THREE.MeshBasicMaterial({

            depthWrite: false,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            map: img
        });
        navigationPathGeometryMaterial.map.repeat.x = 1;
        navigationPathGeometryMaterial.opacity = 1;
        dhLine = new THREE.Mesh(navigationPathGeometry, navigationPathGeometryMaterial);
        dhLine.frustumCulled = false;
        for(let i = 1; i < route.length; i++){
            pathPointList = pathPointList.concat(getNavigationLinePoints(route[i-1],route[i]));
        }
        scene.add(dhLine);
    }


    //获取路线上的点1米间隔
    function getNavigationLinePoints(point1,point2){
        let totalLength = Math.sqrt(
            Math.pow(point2.x - point1.x, 2) +
            Math.pow(point2.y - point1.y, 2)
        );
        let points = [];
        for(let i = 0; i < totalLength; i++){
            let t = i / totalLength;
            points.push(point1.clone().lerp(point2, t));
        }
        return points;
    }

    //获取最近的坐标点
    function findNearestPoint(points) {
        let nearestPoint = null;
        let minDistance = Infinity;

        for (let i = 0; i < pathPointList.length; i++) {
            const currentPoint = pathPointList[i];
            const distance = currentPoint.distanceTo(points);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPoint = i;
            }
        }
        return nearestPoint;
    }

    function clipSegmentByLength(points,lengthToClip) {
        let startIndex = 0;
        let totalLength = 0;
        let clippedPointIndex = startIndex;
        let clippedPoint;
        for (let i = startIndex + 1; i < points.length; i++) {
            clippedPointIndex = i-1;
            const currentPoint = points[i - 1];
            const nextPoint = points[i];
            // 计算两点之间的距离
            const segmentLength = Math.sqrt(
                Math.pow(nextPoint.x - currentPoint.x, 2) +
                Math.pow(nextPoint.y - currentPoint.y, 2)
            );
            // 检查是否超过目标长度
            totalLength += segmentLength;
            if (totalLength >= lengthToClip) {
                // 计算超出部分的比例
                const excessLength = totalLength - lengthToClip;
                const ratio = (segmentLength-excessLength) / segmentLength;
                // 插值找到截取点的坐标
                clippedPoint = {
                    x: currentPoint.x + (nextPoint.x - currentPoint.x) * ratio,
                    y: currentPoint.y + (nextPoint.y - currentPoint.y) * ratio
                };
                break;
            }
        }
        return {
            index: clippedPointIndex,
            point: clippedPoint
        };
    }

    function removeElementsAfterIndex(array, index) {
        array.splice(index + 1);
        return array;
    }



    this.initScene = function(location) {
      this.isInited = true;
        if(!location){
            return;
        }
        const container = document.getElementById('ARModuleCameraVideo');
        arWidth = container.offsetWidth
        arHeight = container.offsetHeight

        camera = new THREE.PerspectiveCamera(45, arWidth / arHeight, 1, 2000);

        const mktLocation = getMercator(location);
        camera.position.set(mktLocation[0], 3, 0-mktLocation[1]);

        scene = new THREE.Scene();

        scene.rotateX(-Math.PI / 2);

        const light = new THREE.AmbientLight( 0xffffff ,1); // 柔和的白光
        scene.add( light );

        const light2 = new THREE.PointLight(0xffffff);
        light2.position.set( 0, 10, 0 );
        scene.add( light2 );

        const axesHelper = new THREE.AxesHelper(200);
        scene.add(axesHelper);



        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setClearColor(0x4e4e4e, 0.5);
        renderer.setSize(arWidth, arHeight);

        container.appendChild(renderer.domElement);

        controls = new THREE.DeviceOrientationControls(camera);
        // controls = new THREE.OrbitControls(camera, renderer.domElement);

        createSprite();
        createCompassLine();
        animate();
    }


    this.set3Dmodel = function (modelUrl,length){
        model3DIsShow = true;
        modelUrl = modelUrl?modelUrl:'models/yunbao_02.fbx';
        if(length){
            model3DShowLength = length;
        }
        const loader = new THREE.FBXLoader();
        loader.load(modelUrl, function (object) {
            object.rotateX(Math.PI / 2);
            object.scale.set(0.03, 0.03, 0.03);
            mixer = new THREE.AnimationMixer(object);
            const action = mixer.clipAction(object.animations[0]);
            action.play();
            model3D = object;
            model3DIsShow = true
            updateModel3DPostion();
            scene.add(model3D);
        });
    }


    function updateModel3DPostion(location){
        location = location?location:camera.position;
        let nowIndex = findNearestPoint(location);
        if(nowIndex < pathPointList.length-model3DShowLength){
            let x1 = pathPointList[nowIndex+model3DShowLength-1].x;
            let y1 = pathPointList[nowIndex+model3DShowLength-1].y;
            let x2 = pathPointList[nowIndex+model3DShowLength].x;
            let y2 = pathPointList[nowIndex+model3DShowLength].y;
            const k = (y2 - y1) / (x2 - x1);
            let angleInRadians = Math.atan2(k, 1);
            if (x2 < x1 && y2 >= y1 || x2 >= x1 && y2 < y1) {
                angleInRadians += Math.PI;
            }
            if(model3DLastRotate){
                model3D.rotateY(-model3DLastRotate);
            }
            model3DLastRotate = (angleInRadians + 2 * Math.PI) % (2 * Math.PI) + Math.PI / 2;
            model3D.rotateY((angleInRadians + 2 * Math.PI) % (2 * Math.PI) + Math.PI / 2);
            model3D.position.copy(pathPointList[nowIndex+model3DShowLength]);
        }else {
            let x1 = pathPointList[nowIndex.length-1].x;
            let y1 = pathPointList[nowIndex.length-1].y;
            let x2 = pathPointList[nowIndex.length].x;
            let y2 = pathPointList[nowIndex.length].y;
            const k = (y2 - y1) / (x2 - x1);
            let angleInRadians = Math.atan2(k, 1);
            if (x2 < x1 && y2 >= y1 || x2 >= x1 && y2 < y1) {
                angleInRadians += Math.PI;
            }
            if(model3DLastRotate){
                model3D.rotateY(-model3DLastRotate);
            }
            model3DLastRotate = (angleInRadians + 2 * Math.PI) % (2 * Math.PI) + Math.PI / 2;
            model3D.rotateY((angleInRadians + 2 * Math.PI) % (2 * Math.PI) + Math.PI / 2);
            model3D.position.copy(pathPointList[pathPointList.length]);
        }
    }

    function animate() {
        controls.update();
        if (videoTexture) {
            videoTexture.needsUpdate = true;
        }
        requestAnimationFrame(animate);
        renderer.render(scene, camera);

        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);

        /*导航线跑马灯*/
        if (dhLine) {
            navigationPathGeometryMaterial.map.offset.x -= 0.03;
        }
        /*拐弯提醒跑马灯*/
        if (turnReminderTexture) {
            turnReminderTexture.offset.x -= 0.03;
            if (turnReminderTexture.offset.x > 1) turnReminderTexture.offset.x -= 1;
        }
        //更新罗盘
        if(showCompassLine){
            let compass = document.getElementById("direction")
            let compassAngle = controls.deviceOrientation.alpha
            if(compassAngle){
                compassAngle = compassAngle * Math.PI / 180;
                if (compassAngle > Math.PI) {
                    compassAngle = compassAngle - Math.PI * 2;
                }
                let compassDis = compassAngle * (document.body.offsetWidth / 5) / (Math.PI / 4);
                compass.style.transform = `translateX(${compassDis}px)`;
            }
        }

        TWEEN.update();
    }


    this.getViodeNowImg = function() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png', 0.5);
    }

    function getMercator(poi) {
        const mercator = {};
        const earthRad = 6378137.0;
        mercator.x = poi[0] * Math.PI / 180 * earthRad;
        const a = poi[1] * Math.PI / 180;
        mercator.y = earthRad / 2 * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
        //将第一个坐标设为中心点缩小其他坐标
        if(!referencePoint || !referencePoint.x || !referencePoint.y){
            referencePoint.x = mercator.x;
            referencePoint.y = mercator.y;
        }
        return [mercator.x-referencePoint.x, mercator.y-referencePoint.y];
    }



    //显示罗盘线
    this.showCompassLine = function(){
        showCompassLine = true;
        document.getElementById("compassLine").style.display = "block"
    }

    //隐藏罗盘线
    this.hideCompassLine = function(){
        showCompassLine = false;
        document.getElementById("compassLine").style.display = "none"
    }

    //创建罗盘线
    function createCompassLine(){
        let compassDiv = document.getElementById("compassLine")
        compassDiv.innerHTML = ""
        compassDiv.appendChild(createIcon())
        compassDiv.appendChild(createDirection())
    }
    function createIcon() {
        let canvas = document.createElement("canvas")
        let ctx = canvas.getContext("2d")
        let width = document.body.offsetWidth
        let iconSizeX = 7
        let iconSizeY = 5
        ctx.canvas.width = width
        ctx.canvas.height = iconSizeY * 2
        //绘制图标
        ctx.beginPath()
        ctx.moveTo(width / 2 - iconSizeX, 0)
        ctx.lineTo(width / 2 - iconSizeX, iconSizeY)
        ctx.lineTo(width / 2, iconSizeY * 2)
        ctx.lineTo(width / 2 + iconSizeX, iconSizeY)
        ctx.lineTo(width / 2 + iconSizeX, 0)
        ctx.closePath()
        ctx.fillStyle = "#ffffff"
        ctx.fill()
        canvas.style.display = "block"
        return canvas
    }
    function createDirection() {
        let canvas = document.createElement("canvas")
        let ctx = canvas.getContext("2d")
        let width = document.body.offsetWidth * 13 / 5
        let height = 25
        let iconSize = 5
        let scale = document.body.offsetWidth / 5
        ctx.canvas.width = width
        ctx.canvas.height = height

        //绘制刻度线和文字
        ctx.beginPath()
        ctx.moveTo(0, height)
        ctx.lineTo(width, height)
        ctx.strokeStyle = "#ffffff"
        ctx.stroke()
        directionValue.forEach(function (item, index) {
            ctx.beginPath()
            ctx.moveTo(scale / 2 + index * scale, height)
            ctx.lineTo(scale / 2 + index * scale, height - iconSize)
            ctx.strokeStyle = "#ffffff"
            ctx.stroke()
            ctx.beginPath()
            ctx.fillStyle = '#ffffff'
            ctx.font = '14px Microsoft YaHei'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(item, scale / 2 + index * scale, (height - iconSize) / 2 )
        })
        canvas.style.display = "block"
        let offset = -scale * 4
        canvas.style.marginLeft = `${offset}px`
        canvas.id = "direction"
        return canvas
    }

    this.setEventManager = function(eventManager){
        this.eventManager = eventManager;
    }
    this.on = function(event,callback){
        this.eventManager && this.eventManager.on(event,callback);
    };
    this.off = function(event,callback){
        this.eventManager && this.eventManager.off(event,callback);
    };
}


