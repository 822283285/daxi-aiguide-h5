(function(global){
    const daxiapp = global["DaxiApp"] = global["DaxiApp"] || {};
    let directionValue = ["东", "东南", "南", "西南", "西", "西北", "北", "东北", "东", "东南", "南", "西南", "西"]

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
    let landmarkCoo1 = [
        {
          name: "厕所",
          pic: "厕所.png",
          x: 13439318.841327073,
          y: 3667214.8216214017,
          height:90
        },
        {
          name: "楼梯",
          pic: "楼梯.png",
          x: 13439360.812949382,
          y: 3667235.617727969,
          height:90
        },
        {
          name: "软件部",
          pic: "办公区.png",
          x: 13439329.7495706,
          y: 3667224.43096216,
          height:45
        },
        {
          name: "硬件部",
          pic: "办公区.png",
          x: 13439344.050809639,
          y:  3667229.27533807,
          height:45
        }
    ];
    let landmarkCoo2 = [
        {
          name: "厕所",
          pic: "厕所.png",
          x: 13237066.920947641,
          y: 3778702.8825714635,
          height:90
        },
        {
          name: "厕所",
          pic: "厕所.png",
          x: 13237151.780315474,
          y: 3778674.672081741,
          height:45
        },
        {
          name: "楼梯",
          pic: "楼梯.png",
          x: 13237107.908749536,
          y: 3778690.452003495,
          height:90
        },
        {
          name: "楼梯",
          pic: "楼梯.png",
          x: 13237109.975803955,
          y: 3778662.6941257464,
          height:45
        }
    ];
    function generateCanvas(name, distance, imgName) {
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext("2d")
        // let width = window.innerWidth*0.5;//120
        // let height = window.innerHeight*.3;// 45
        let width = 120
        let height = 45
        ctx.canvas.width = width
        ctx.canvas.height = height
        /*4.画一个十字架在画布的中心*/
        ctx.beginPath()
        ctx.moveTo(0, height / 2 - 0.5)
        ctx.lineTo(width, height / 2 - 0.5)
        ctx.strokeStyle = '#eee'
        ctx.stroke()
        //绘制图片
        let img = new Image()
        img.onload = function () {
          ctx.drawImage(img, 0, 0, height, height)
        }
        img.src = "../assets/images/landmark/" + imgName;
        //绘制名称
        ctx.beginPath()
        ctx.fillStyle = '#ffffff'
        ctx.font = '16px Microsoft YaHei'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(name, (width - height) / 2 + height, height / 4 + 2)
        //绘制距离
        ctx.beginPath()
        ctx.fillStyle = '#ffffff'
        ctx.font = '12px Microsoft YaHei'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`距离${distance}m`, (width - height) / 2 + height, height * 3 / 4)
        return canvas
    };
    /**
     * 打开摄像头
     */
    let video;
    // async function openCamera(width, height,callback) {
      function openCamera(width, height,callback) {
        // video = document.createElement('video');

        video = document.getElementById("ARModuleCameraVideo");
        const constrains = {;
          // 关闭音频
            audio: false,
            video: {
              // deviceId:{exact:"default"},
              // 在移动设备上面，表示优先使用前置摄像头
              // facingMode: 'user',
              facingMode: isMobile() ? { exact: "environment" } : { exact:'user'},
              width: width,
              height: height,
              // focusMode: {ideal: "continuous"},
              // width:{min:1024,ideal:1280,"max":1920},
              // height:{min:776,ideal:720,"max":1080}
            }
          };
        //部分手机如鸿蒙系统 原因是浏览器history问题
        // navigator.mediaDevices.getUserMedia 提示用户给予使用媒体输入的许可，媒体输入会产生一个MediaStream，里面包含了请求的媒体类型的轨道。
        // const stream = await navigator.mediaDevices.getUserMedia({
         const getUserMedia = null;
        //  if (navigator.mediaDevices.getUserMedia) { //标准
        //       getUserMedia = navigator.mediaDevices.getUserMedia;

        //   }else if (navigator.webkitGetUserMedia){ ////webkit内核浏览器
        //     getUserMedia = navigator.webkitGetUserMedia;
        //   }else if(navigator.mozGetUserMedia){ //firefox
        //     getUserMedia = navigator.mozGetUserMedia;
        //   }else if(navigator.getUserMedia){ //旧版API
        //     getUserMedia = navigator.getUserMedia;
        //   }else{
        //     alert("您的设别不支持 getUserMedia");
        //     return null;
        //   }
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
        navigator.mediaDevices.enumerateDevices().then(function(devices){
          // debugger
          devices.forEach(function(device){
            if(device.kind == "videoinput"){
              if(constrains["video"]["facingMode"]["exact"] == "environment"){
                if(device.label.indexOf("back")!=-1){
                  constrains["video"]["deviceId"] = {exact:device["deviceId"]};
                }
              }
            }
          });
          return new Promise((resolve)=>{
            resolve();
          });
       }).then(function(){
        navigator.mediaDevices.getUserMedia(constrains).then((stream)=>{
          video.srcObject = stream;
          video.play();
          video.width = width;
          video.height = height;
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

        }).catch((error)=>{
          console.log(error);

        });

       });
        return new Promise((resolve) => {
        // 在视频的元数据加载后执行 JavaScript
          video.onloadedmetadata = () => {
              resolve(video);
              document.getElementById("ARMask").style.display ="none";
          };
        });
    }
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    function isMobile() {

        return isAndroid || isiOS;
    }

    //节流throttle代码：
    function throttle(fn, delay) {
        let canRun = true // 通过闭包保存一个标记
        return function () {
          // 在函数开头判断标记是否为true，不为true则return
          if (!canRun) return
          // 立即设置为false
          canRun = false
          // 将外部传入的函数的执行放在setTimeout中
          setTimeout(() => {
            // 最后在setTimeout执行完毕后再把标记设置为true(关键)表示可以执行下一次循环了。
            // 当定时器没有执行的时候标记永远是false，在开头被return掉
            fn.apply(this, arguments)
            canRun = true
          }, delay)
        }
    }
    function ARNavigation(parentDom) {
        parentDom.append(`<div id="webARModule" style="display:none">
        
        <video id="ARModuleCameraVideo" autoplay playsinline webkit-playsinline="true" x5-playsinline="true"></video>
        <canvas id="webGL3d" style="position: absolute;"></canvas>
        <div id="landmark"></div>
        <div id="compassLine"></div>
        <div id="ar_log" style="color: red;z-index: 100;position: absolute;top: 166px;font-size: 2rem;"></div>
       
        </div>`);
        parentDom.after('<div id="ARMask" style="position: absolute;top: 0px;bottom: 0px;width: 100vw;display: none;height: 100vh;background: rgba(45, 45, 45, 0.73);z-index: 11;"><span class="icon-close"  id="ARCloseBtn" style="position: absolute;right: 14px;top: 20px;font-size: 26px;color: aliceblue;"></span><div class="loading-tip" style="position:relative;text-align:center;top: 28%;color:#fff;"><img src="../common_imgs/artip.png" style="width:160px"><p>AR实景导航启动中</p></div></div>');
        let that = this;
        parentDom.parent().on("click","#ARCloseBtn",function(){
          if(that.eventManager){
            that.eventManager.fire("closed")
          }else{
            that.hide();
          }

        },false);
        //路线坐标
        let coordinates = null;
        //拿到两个容器
        let canvas = null
        //相机、场景、渲染器、轨道控制
        let camera = null
        let scene = null
        let renderer = null
        let orbitControls = null
        //当前点
        let nowPosPic = null
        //容器宽高
        let arWidth = null
        let arHeight = null
        //线图标集合
        let group = null
        //路线沿Y轴偏移量
        let offsetY = -3
        // 相机与原点距离
        let dis = 8
        //地标与Y轴的夹角
        let landmarkAngle = []
        //陀螺仪的角度
        let alpha = 0
        let beta = 0
        //ar中的路径mesh坐标集合
        let lingMeshArray = []
        let videoTexture;

        function createArMap() {
          //初始参数
          canvas = document.getElementById('webGL3d')
          arWidth = canvas.offsetWidth
          arHeight = canvas.offsetHeight
          scene = new THREE.Scene()
          camera = new THREE.PerspectiveCamera(60, arWidth / arHeight, 0.0001, 7000)
          camera.position.set(0, -7, 5)

          // //renderer参数
          let renderParam = {
            antialias: true, // true/false表示是否开启反锯齿
            // alpha: true, // true/false 表示是否可以设置背景色透明
            precision: 'lowp', // highp/mediump/lowp 表示着色精度选择
            premultipliedAlpha: false, // true/false 表示是否可以设置像素深度（用来度量图像的分辨率）
            maxLights: 3, // 最大灯光数
            canvas: canvas /// set canvas target
          }
          renderer = new THREE.WebGLRenderer(renderParam);

          renderer.setSize(arWidth, arHeight)
          renderer.setClearColor(0x4e4e4e, 0.5);
          orbitControls = new OrbitControls(camera, renderer.domElement)
        }

        //绘制视频
        // async function createSprite() {
          // let video = await openCamera(arWidth, arHeight);
        function createSprite() {
          openCamera(arWidth, arHeight).then((video)=>{
            videoTexture = new THREE.Texture(video);
            // videoTexture.minFilter = THREE.LinearFilter;
            scene.background = videoTexture;
          });
        }

        //绘制起点标志
        function createNowPos() {
          let plane = new THREE.PlaneGeometry(1, 1)
          let map = new THREE.TextureLoader().load('../assets/images/WechatIMG1129.png')
          let material = new THREE.MeshBasicMaterial({
            map: map,
            alphaTest: 0.1,
            color: 0xffffff,
            side: THREE.DoubleSide,
          })
          nowPosPic = new THREE.Mesh(plane, material)
          nowPosPic.position.set(0, offsetY, 0)
          scene.add(nowPosPic)
          //添加坐标轴
          // let axes = new THREE.AxesHelper(500)
          // scene.add(axes)
        }

        //绘制所有导航线
        function drawNavLine(coordinates,myPosition) {

          if(!scene){
            return;
          }
          if (coordinates.length !== 0) {
            group = new THREE.Group()
            let starPoint = {
              x: 0,
              y: 0
            }

              for (let i = 1; i < coordinates.length; i++) {
              let x = coordinates[i].x - coordinates[0].x
              let y = coordinates[i].y - coordinates[0].y
              let distance = Math.sqrt(Math.pow(x - starPoint.x, 2) + Math.pow(y - starPoint.y, 2))
              if (distance >= 1) {
                // let angle = calAngleX(x - starPoint.x, y - starPoint.y,heading)
                let angle = calAngleX(x - starPoint.x, y - starPoint.y);
                  createLine(starPoint, distance>5?5:distance, angle);
                  if(distance>5){
                      break;
                  }
                //createLine(starPoint, distance, angle)
                starPoint.x = x
                starPoint.y = y
              }
            }
            scene.add(group)
            group.position.y = offsetY
            group.rotation.z = -alpha * Math.PI / 180;

          }
        }

        //创建一条线
        function createLine(starPoint, length, angle) {
          let plane = new THREE.PlaneGeometry(1, 1)
          let map = new THREE.TextureLoader().load('../assets/images/WechatIMG1123.png')
          let material = new THREE.MeshBasicMaterial({
            map: map,
            alphaTest: 0.1,
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent:true
          })
          for (let i = 0.1; i <= length; i+=2) {
            let mesh = new THREE.Mesh(plane, material)
            let x = starPoint.x + i * Math.cos(angle)
            let y = starPoint.y + i * Math.sin(angle)
            mesh.position.set(x, y, 0)
            let obj = {
              x: x + coordinates[0].x,
              y: y + coordinates[0].y
            }
            lingMeshArray.push(obj)
            mesh.rotation.z = angle - Math.PI / 2
            group.add(mesh)
          }
        }

        //创建地标
        function createLandmark(coordinates) {
          if (coordinates.length !== 0) {
            let landmarkDiv = document.getElementById("landmark")
            landmarkDiv.innerHTML = ""
            for (let i = 0; i < landmarkCoo2.length; i++) {
              landmarkAngle[i] = calAngleY(landmarkCoo2[i].x - coordinates[0].x, landmarkCoo2[i].y - coordinates[0].y)
              let distance = Math.sqrt(Math.pow(landmarkCoo2[i].x - coordinates[0].x, 2) + Math.pow(landmarkCoo2[i].y - coordinates[0].y, 2))
              let canvas = generateCanvas(landmarkCoo2[i].name, distance.toFixed(0), landmarkCoo2[i].pic)
              canvas.style.marginTop = `${-landmarkCoo2[i].height}px`
              //设置初始位置
              let driftAngle = landmarkAngle[i] - alpha
              if (driftAngle > Math.PI) {
                driftAngle = driftAngle - Math.PI * 2
              }
              let horDis = -driftAngle * 100 / (Math.PI / 3)
              let verDis = -(Math.PI / 2 - beta) * 25 / (Math.PI / 2)
              canvas.style.transform = `translate(${horDis}vw,${verDis}vh)`

              canvas.classList.add("landmark")
              landmarkDiv.appendChild(canvas)
            }
          }
        }

        //创建罗盘线
        function createCompassLine() {
          let compassDiv = document.getElementById("compassLine")
          compassDiv.innerHTML = ""
          compassDiv.appendChild(createIcon())
          compassDiv.appendChild(createDirection())
        }

        //计算偏转角度(Y轴逆时针)
        function calAngleY(x, y) {
          let angle = Math.atan(Math.abs(y) / Math.abs(x))
          if (x >= 0 && y >= 0) {
            angle = Math.PI / 2 - angle
          } else if (x >= 0 && y <= 0) {
            angle = Math.PI / 2 + angle
          } else if (x <= 0 && y <= 0) {
            angle = Math.PI * 3 / 2 - angle
          } else {
            angle = Math.PI * 3 / 2 + angle
          }
          return Math.PI * 2 - angle
        }

        //计算偏转角度(X逆时针)
        function calAngleX(x, y,mapAngle) {
          let angle = Math.atan(Math.abs(y) / Math.abs(x))
          if (x >= 0 && y >= 0) {

          } else if (x <= 0 && y >= 0) {
            angle = Math.PI - angle
          } else if (x <= 0 && y <= 0) {
            angle = Math.PI + angle
          } else {
            angle = Math.PI * 2 - angle
          }
          if(mapAngle !=undefined){
            angle = angle-mapAngle;
          }
          if(angle < 0){
            angle += Math.PI * 2;
          }else if(angle >  Math.PI * 2){
            angle -= Math.PI * 2;
          }
          return angle
        }

        //渲染模型
        let requestAnimationId = null;
        function animate() {
          if (videoTexture) {
            videoTexture.needsUpdate = true;
          }
          orbitControls.update()
          requestAnimationId = requestAnimationFrame(animate);
          renderer.render(scene, camera)
        }
        let orientation = 0;

        //监听陀螺仪
        function getGyro() {
          if (window.DeviceOrientationEvent) {
            // window.addEventListener('deviceorientation', throttle(setMeshCamera, 100), false);
            window.addEventListener("deviceorientation",(function t(i){
              window.removeEventListener("deviceorientation", t)
              if(void 0 !== i.webkitCompassHeading){//ios
                window.addEventListener("deviceorientation", throttle(setMeshCamera, 100),false);
              }else{
                window.addEventListener("deviceorientationabsolute", throttle(setMeshCamera, 100),false);
              }
            }),false);
          } else {
            console.log('你的浏览器不支持陀螺仪')
          }
          window.addEventListener("orientationchange", function () {
            orientation = window.orientation
          }, true)
        }

        //改变图形和相机姿态
        let lastAlpha = 0,initalpha,deviceHeading,devDiffHeading=0,orientationEvent,state = "closed";
        function a(t, e, i) {
          if (Math.abs(e) < 70)
              return t;
            const o = t * (Math.PI / 180);
              , a = e * (Math.PI / 180)
              , n = i * (Math.PI / 180)
              , r = Math.cos(o)
              , s = Math.sin(o)
              , l = Math.sin(a)
              , u = Math.cos(n)
              , h = Math.sin(n)
              , d = -r * h - s * l * u
              , c = -s * h + r * l * u
              , f = Math.atan2(d, c);
            return -(f *= 180 / Math.PI)
        }
        function a(t, e, i) {
          if (Math.abs(e) < 70)
              return t;
            const o = t * (Math.PI / 180);
              , a = e * (Math.PI / 180)
              , n = i * (Math.PI / 180)
              , r = Math.cos(o)
              , s = Math.sin(o)
              , l = Math.sin(a)
              , u = Math.cos(n)
              , h = Math.sin(n)
              , d = -r * h - s * l * u
              , c = -s * h + r * l * u
              , f = Math.atan2(d, c);
            return -(f *= 180 / Math.PI)
        }

        function setMeshCamera(event) {
           if(state == "closed"){
              return;
           }
          if(event.alpha!=null && initalpha == undefined){
            initalpha = ~~event.alpha;
          }
          if (group && event.alpha != null) {
            // let realAlpha = initHeading - (initalpha - event.alpha);
            let realAlpha;
            if(isAndroid){
              if (event.alpha) {
                o = !0;
                event = {
                    alpha: a(event.alpha, event.beta, event.gamma),
                    beta: event.beta,
                    gamma: event.gamma
                };
                realAlpha = event.alpha - 360;

              }
            }else{
              // realAlpha = event.alpha;
              //ios 角度取值
              const heading = Math.round(event["webkitCompassHeading"] ? 0 - event["webkitCompassHeading"] : event.alpha);
              heading -= orientation||0;
              realAlpha = heading-360;
            }

            if(realAlpha <0){
                realAlpha += 360;
            }else if(realAlpha > 360){
              realAlpha -= 360;
            }

            if (Math.abs(lastAlpha - event.alpha) > 1 || Math.abs(beta - event.beta) > 1) {
              //路线和相机
              let alpha = realAlpha * Math.PI / 180,
                beta = event.beta * Math.PI / 180,
                gamma = event.gamma * Math.PI / 180
              group.rotation.z = -alpha
              let angleBeta = beta
              camera.position.set(0, -Math.sin(angleBeta) * dis + event.beta / 50, Math.cos(angleBeta) * dis)

              //地标
              let canvasArray = document.getElementsByClassName("landmark")
              // canvasArray.forEach(function (item, index) {
                for(let i = 0,len=canvasArray.length;i<len;i++){
                  let item = canvasArray[i];
                  let driftAngle = landmarkAngle[i] - alpha
                  if (driftAngle > Math.PI) {
                    driftAngle = driftAngle - Math.PI * 2
                  }
                  let horDis = -driftAngle * 100 / (Math.PI / 3)
                  let verDis = -(Math.PI / 2 - beta) * 25 / (Math.PI / 2)
                  item.style.transform = `translate(${horDis}vw,${verDis}vh)`

                }


              //罗盘
              let compass = document.getElementById("direction")
              let compassAngle = alpha
              if (compassAngle > Math.PI) {
                compassAngle = compassAngle - Math.PI * 2
              }
              let compassDis = compassAngle * (document.body.offsetWidth / 5) / (Math.PI / 4)
              compass.style.transform = `translateX(${compassDis}px)`
              lastAlpha = event.alpha
            }
            // alpha = event.alpha

            alpha = realAlpha
            beta = event.beta
            document.getElementById("ar_log").innerHTML = realAlpha.toFixed(2);
          }
          orientationEvent = event;
        }

        //删除场景中的所有模型
        this.deleteAllMesh = function () {
          scene && scene.remove(group)
        }

        //返回ar导航线的坐标数据
        this.arCoordinates = function () {
          return lingMeshArray
        }
        let ARInited = false;
        let initHeading;
        //第一次加载ar导航地图
        this.startArNavigation = function (coor,heading,myPosition) {
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
          this.isInited = true;
          state = "playing";
          if(!this.webARModule){
            initHeading = heading;
            this.webARModule = document.getElementById("webARModule");
          }
          deviceHeading = 360-heading;
          this.startPlay();

          coordinates = coor;
          drawNavLine(coordinates,myPosition)
          if(!ARInited){
            createArMap()
            createSprite()
            getGyro()
            createCompassLine()

          }

          // coordinates && createLandmark(coordinates)
          animate()

        }

        //模拟导航重新绘制路线(three.js会先平移再旋转模型)
        this.redrawAr = function (coo,myPosition) {
          coordinates = coo;
          if(!scene){
            return;
          }
          this.deleteAllMesh()
          drawNavLine(coordinates,myPosition);
          // createLandmark(coordinates);
        }
        this.hide = function(){
          if(this.webARModule){
            this.webARModule.style.display = "none";
          }
          state = "closed";
          this.deleteAllMesh();
          window.cancelAnimationFrame(requestAnimationId);
          video && video.srcObject && video.srcObject.getVideoTracks().forEach(function(item){
            item.stop();
          });
          document.getElementById("ARMask").style.display ="none";

        };

        this.startPlay = function(callback){
          if(this.webARModule){
            this.webARModule.style.display = "block";
          }
           document.getElementById("ARMask").style.display ="block";
           document.getElementById("ARModuleCameraVideo").play().then((e)=>{
            // 隐藏loading
            //document.getElementById("ARMask").style.display ="none";
            callback && callback(e);
          }).catch((error)=>{
            console.log(error);
           });
        };
        this.setEventManager = function(eventManager){
          this.eventManager = eventManager;
        }
        this.on = function(event,callback){
          this.eventManager && this.eventManager.on(event,callback);
        };
        this.off = function(event,callback){
          this.eventManager && this.eventManager.off(event,callback);
        };

         // 监听heading变化
         let isDirt = false;
         window["DXWXLocEvent"] && window["DXWXLocEvent"].on("heading",function(heading){
            if(isAndroid ){
              deviceHeading = 360-heading;
              devDiffHeading = orientationEvent ? (orientationEvent.alpha - deviceHeading):0;
              isDirt = true;
              if(orientationEvent){
                initalpha = orientationEvent.alpha;
              }
            }
         });


    }
    daxiapp["ARNavigation"] = ARNavigation;

})(window);
