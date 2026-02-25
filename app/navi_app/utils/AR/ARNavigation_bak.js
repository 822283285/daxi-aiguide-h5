
 var ARNavigation = function(parentDom,params){
   
  var html = '<video id="cameraVideo" style="display: none" autoplay playsinline webkit-playsinline="true" x5-playsinline="true"></video>' +
      '<div style="position: absolute;top: 0px;bottom: 0px;left:0px;width:100%;height:60vh;margin-top:0px" id="ARModuleCameraVideo"></div>' +
      '<div id="compassLine" style="display: none;position:absolute;"></div>'+
      '<div id="ARMask" style="position: absolute;top: 0px;bottom: 0px;left:0px;width: 100%;height: 100vh;background: rgba(45, 45, 45, 0.73);z-index: 11;">' +
      '<img src="../utils/AR/img/close.png" id="ARCloseBtn" style="position: absolute;right: 14px;top: 20px;width: 26px;height: 26px;">'+
      '<div class="loading-tip" style="position:relative;text-align:center;top: 28%;color:#fff;"><img src="../utils/AR/img/artip.png" style="width:160px"><p>AR实景导航启动中</p></div></div>';
  $(parentDom).append(html);

  $(parentDom).on("click","#ARCloseBtn",function(event){
      $("#ARModuleCameraVideo").hide();
      $("#ARMask").hide();
  });

  var camera, scene, renderer, controls, videoTexture, arWidth, arHeight;
  var dhLine, navigationPathPointList, navigationPathGeometry, navigationPathGeometryMaterial;
  var isAndroid = /Android/i.test(navigator.userAgent);
  var isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  var clock = new THREE.Clock();
  var model3D = null;
  var model3DLastRotate;
  var model3DShowLength = 5;
  var model3DIsShow = false;
  var mixer;
  var turnReminderTexture;
  var turnReminder;
  var referencePoint = {};
  var showCompassLine = false;
  var directionValue = ["东", "东南", "南", "西南", "西", "西北", "北", "东北", "东", "东南", "南", "西南", "西"];
  var pathPointList = [];
  var isInited
  function isMobile() {
      return isAndroid || isiOS;
  }

  function createSprite() {
      openCamera(arWidth, arHeight).then(function(video) {
          videoTexture = new THREE.Texture(video);
          scene.background = videoTexture;
      });
  }

  function openCamera(width, height) {
      var self = this;
      video = document.getElementById("cameraVideo");
      var constrains = {
          // 关闭音频
          audio: false,
          video: {
              "sourceId": "default",
              // 在移动设备上面，表示优先使用前置摄像头
            //   facingMode: 'environment',
              facingMode: isMobile() ? {exact: "environment"} : {exact: 'user'},
              width: width,
              height: height,
              focusMode: {ideal: "continuous"},
          }
      };
      if (navigator.mediaDevices.getUserMedia === undefined) {
          navigator.mediaDevices.getUserMedia = function (constraints) {
              var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
              if (!getUserMedia) {
                  return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
              }
              return new Promise(function (resolve, reject) {
                  getUserMedia.call(navigator, constraints, resolve, reject);
              });
          }
      }

      navigator.mediaDevices.getUserMedia(constrains).then(function(stream) {
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
          window.userMedia = "opened";
          if(window["command"]["eventByWSS"]){
              var data = {
                  "type": "postEventToMiniProgram",
                  "id": window["command"]["userId"],
                  "methodToMiniProgram": "event=opened",
                  "roleType": "receiver"
              }
              window["locWebSocketPostMessage"] && window["locWebSocketPostMessage"](data);
          }

      }).catch(function(error){
          console.error(error);
      });

      return new Promise(function(resolve) {
          // 在视频的元数据加载后执行 JavaScript
          video.onloadedmetadata = function() {
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
          var angle = calculateAngle(points);
          var loader = new THREE.TextureLoader();
          turnReminderTexture = loader.load('img/left.png');
          turnReminderTexture.wrapS = THREE.RepeatWrapping;
          turnReminderTexture.wrapT = THREE.RepeatWrapping;
          turnReminderTexture.repeat.set(10, 1);
          var geometry = new THREE.PlaneGeometry(10, 1);
          var material = new THREE.MeshBasicMaterial({
              map: turnReminderTexture,
              side: THREE.DoubleSide,
              transparent: true, // 允许透明
          });
          turnReminder = new THREE.Mesh(geometry, material);
          var point = getMercator(points[0]);
          turnReminder.position.set(point[0], point[1], 1);
          turnReminder.rotateX(90 * Math.PI / 180)
          turnReminder.rotateY(angle)
          scene.add(turnReminder);
      }
  }

  this.setLocation = function(points,time){
      if(points){
        var location = getMercator(points);
          moveToByTween(location,time);
          //更新3D小人位置
          if(model3DIsShow && model3D){
              updateModel3DPostion(new THREE.Vector3(location[0], location[1], 0));
          }
      }
  }

  //平滑移动当前位置
  function moveToByTween(points,time) {
      var tween = new TWEEN.Tween(camera.position);
      tween.to({
          x: points[0],
          y: 3,
          z: 0-points[1]
      }, time?time:200);
      tween.start();
  }
  //计算2个点和X轴弧度
  function calculateAngle(points) {
      var points1 = getMercator(points[0]);
      var points2 = getMercator(points[1]);
      var x1 = points1[0];
      var y1 = points1[1];
      var x2 = points2[0];
      var y2 = points2[1];
      // 计算斜率
      var k = (y2 - y1) / (x2 - x1);
      // 使用Math.atan2得到弧度值
      var angleInRadians = Math.atan2(k, 1);
      // 如果x2 < x1，则需要调整角度，因为atan2返回的是-π to π范围的角度
      if (x2 < x1 && y2 >= y1 || x2 >= x1 && y2 < y1) {
          angleInRadians += Math.PI;
      }
      return (angleInRadians + 2 * Math.PI) % (2 * Math.PI);
  }


  this.createNavigationLine = function(points,showLength,width,imgUrl) {
      var route = [];
      var test = [];
      for(var i = 0; i < points.length; i++){
          var mktPoint =getMercator(points[i]);
          test.push({x:mktPoint[0],y:mktPoint[1]});
          route.push(new THREE.Vector3(mktPoint[0], mktPoint[1], 0));
      }
      if(showLength){
          var showPoints = clipSegmentByLength(test,showLength);
          if(showPoints.point){
              var clipRoute = removeElementsAfterIndex(route,showPoints.index);
              clipRoute.push(new THREE.Vector3(showPoints.point.x, showPoints.point.y, 0));
              route = clipRoute;
          }
      }
      navigationPathPointList = new THREE.PathPointList();
      navigationPathPointList.set(route, 5, 5,);
      navigationPathGeometry = new THREE.PathGeometry();
      width = width?width:1;
      navigationPathGeometry.update(navigationPathPointList, {
          width: width,
          arrow: false,
          progress: 10,
      });
      imgUrl = imgUrl?imgUrl:'img/go.png';
      var img = new THREE.TextureLoader().load(imgUrl);
      img.wrapS = img.wrapT = THREE.RepeatWrapping;
      img.anisotropy = renderer.capabilities.getMaxAnisotropy();
      navigationPathGeometryMaterial = new THREE.MeshBasicMaterial({
          color: 0x58DEDE,
          depthWrite: false,
          transparent: true,
          opacity: 1,
          side: THREE.DoubleSide,
          map: img
      });
      navigationPathGeometryMaterial.map.repeat.x = 0.4;
      navigationPathGeometryMaterial.opacity = 0.4;
      dhLine = new THREE.Mesh(navigationPathGeometry, navigationPathGeometryMaterial);
      dhLine.frustumCulled = false;
      for(var i = 1; i < route.length; i++){
          pathPointList = pathPointList.concat(getNavigationLinePoints(route[i-1],route[i]));
      }
      scene.add(dhLine);
  }


  //获取路线上的点1米间隔
  function getNavigationLinePoints(point1,point2){
      var totalLength = Math.sqrt(
          Math.pow(point2.x - point1.x, 2) +
          Math.pow(point2.y - point1.y, 2)
      );
      var points = [];
      for(var i = 0; i < totalLength; i++){
          var t = i / totalLength;
          points.push(point1.clone().lerp(point2, t));
      }
      return points;
  }

  //获取最近的坐标点
  function findNearestPoint(points) {
      var nearestPoint = null;
      var minDistance = Infinity;

      for (var i = 0; i < pathPointList.length; i++) {
          var currentPoint = pathPointList[i];
          var distance = currentPoint.distanceTo(points);
          if (distance < minDistance) {
              minDistance = distance;
              nearestPoint = i;
          }
      }
      return nearestPoint;
  }

  function clipSegmentByLength(points,lengthToClip) {
      var startIndex = 0;
      var totalLength = 0;
      var clippedPointIndex = startIndex;
      var clippedPoint;
      for (var i = startIndex + 1; i < points.length; i++) {
          clippedPointIndex = i-1;
          var currentPoint = points[i - 1];
          var nextPoint = points[i];
          // 计算两点之间的距离
          var segmentLength = Math.sqrt(
              Math.pow(nextPoint.x - currentPoint.x, 2) +
              Math.pow(nextPoint.y - currentPoint.y, 2)
          );
          // 检查是否超过目标长度
          totalLength += segmentLength;
          if (totalLength >= lengthToClip) {
              // 计算超出部分的比例
              var excessLength = totalLength - lengthToClip;
              var ratio = (segmentLength-excessLength) / segmentLength;
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
      console.log(this.isInited);
      if(!location){
          return;
      }
      window.userMedia = "beforeOpen";
      if(window["command"]["eventByWSS"]){
          var data = {
              "type": "postEventToMiniProgram",
              "id": window["command"]["userId"],
              "methodToMiniProgram": "event=beforeOpen",
              "roleType": "receiver"
          }
          window["locWebSocketPostMessage"] && window["locWebSocketPostMessage"](data);
      }
      var container = document.getElementById('ARModuleCameraVideo');
      arWidth = container.offsetWidth
      arHeight = container.offsetHeight

      camera = new THREE.PerspectiveCamera(45, arWidth / arHeight, 1, 2000);

      var mktLocation = getMercator(location);
      camera.position.set(mktLocation[0], 3, 0-mktLocation[1]);

      scene = new THREE.Scene();

      scene.rotateX(-Math.PI / 2);

      var light = new THREE.AmbientLight( 0xffffff ,1); // 柔和的白光
      scene.add( light );

      var light2 = new THREE.PointLight(0xffffff);
      light2.position.set( 0, 10, 0 );
      scene.add( light2 );

      var axesHelper = new THREE.AxesHelper(200);
      scene.add(axesHelper);



      renderer = new THREE.WebGLRenderer({antialias: true});
      renderer.setClearColor(0x4e4e4e, 0.5);
      renderer.setSize(arWidth, arHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      container.appendChild(renderer.domElement);

      controls = new THREE.DeviceOrientationControls(camera);
      //  controls = new THREE.OrbitControls(camera, renderer.domElement);

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
      var loader = new THREE.FBXLoader();
      loader.load(modelUrl, function (object) {
          object.rotateX(Math.PI / 2);
          object.scale.set(0.03, 0.03, 0.03);
          mixer = new THREE.AnimationMixer(object);
          var action = mixer.clipAction(object.animations[0]);
          action.play();
          model3D = object;
          model3DIsShow = true
          updateModel3DPostion();
          scene.add(model3D);
      });
  }


  function updateModel3DPostion(location){
      location = location?location:camera.position;
      var nowIndex = findNearestPoint(location);
      if(nowIndex < pathPointList.length-model3DShowLength){
          var x1 = pathPointList[nowIndex+model3DShowLength-1].x;
          var y1 = pathPointList[nowIndex+model3DShowLength-1].y;
          var x2 = pathPointList[nowIndex+model3DShowLength].x;
          var y2 = pathPointList[nowIndex+model3DShowLength].y;
          var k = (y2 - y1) / (x2 - x1);
          var angleInRadians = Math.atan2(k, 1);
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
          var x1 = pathPointList[nowIndex.length-1].x;
          var y1 = pathPointList[nowIndex.length-1].y;
          var x2 = pathPointList[nowIndex.length].x;
          var y2 = pathPointList[nowIndex.length].y;
          var k = (y2 - y1) / (x2 - x1);
          var angleInRadians = Math.atan2(k, 1);
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

      var delta = clock.getDelta();
      if (mixer) mixer.update(delta);

      /*导航线跑马灯*/
      if (dhLine) {
          navigationPathGeometryMaterial.map.offset.x -= 0.02;
      }
      /*拐弯提醒跑马灯*/
      if (turnReminderTexture) {
          turnReminderTexture.offset.x -= 0.02;
          if (turnReminderTexture.offset.x > 1) turnReminderTexture.offset.x -= 1;
      }
      //更新罗盘
      if(showCompassLine){
          var compass = document.getElementById("direction")
          var compassAngle = controls.deviceOrientation.alpha
          if(compassAngle){
              compassAngle = compassAngle * Math.PI / 180;
              if (compassAngle > Math.PI) {
                  compassAngle = compassAngle - Math.PI * 2;
              }
              var compassDis = compassAngle * (document.body.offsetWidth / 5) / (Math.PI / 4);
              compass.style.transform = `translateX(${compassDis}px)`;
          }
      }

      TWEEN.update();
  }


  this.getViodeNowImg = function() {
    var video = document.getElementById('cameraVideo');
      var canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png', 0.5);
  }

  function getMercator(poi) {
      var mercator = {};
      var earthRad = 6378137.0;
      mercator.x = poi[0] * Math.PI / 180 * earthRad;
      var a = poi[1] * Math.PI / 180;
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
      var compassDiv = document.getElementById("compassLine")
      compassDiv.innerHTML = ""
      compassDiv.appendChild(createIcon())
      compassDiv.appendChild(createDirection())
  }
  function createIcon() {
      var canvas = document.createElement("canvas")
      var ctx = canvas.getContext("2d")
      var width = document.body.offsetWidth
      var iconSizeX = 7
      var iconSizeY = 5
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
      var canvas = document.createElement("canvas")
      var ctx = canvas.getContext("2d")
      var width = document.body.offsetWidth * 13 / 5
      var height = 25
      var iconSize = 5
      var scale = document.body.offsetWidth / 5
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
      var offset = -scale * 4
      canvas.style.marginLeft = `${offset}px`
      canvas.id = "direction"
      return canvas
  }


}


