/** 语音波形动画插件 */
var voice = {
  styleElement: null,
  container: null,
  inited: false,
  items: "",

  /** @param {Object} options - 配置选项 */
  init: function (options) {
    var _default = { vioceWidth: "95%" };
    for (var key in options) {
      if (options.hasOwnProperty(key)) {
        _default[key] = options[key];
      }
    }
    $(".voice .active").css({ width: _default.vioceWidth });
  },

  round: function (min, max) {
    return min + Math.floor(Math.random() * (max - min));
  },

  /**
   * @param {number} [num=40] - 波形条数量
   * @param {string} [bgcolor='#28a6fb'] - 波形条颜色
   */
  setSpeak: function (num, bgcolor) {
    var that = this;
    num = num || 40;
    bgcolor = bgcolor || "#28a6fb";
    $(".voice").show();

    var parentHeight = $(".voice").height();

    function createWaveElements() {
      var tempDiv = $("<div class='active'></div>");
      for (var i = 0; i < num; i++) {
        var $creatEle = $("<span></span>");
        var rnn = i <= Math.floor(num / 3) || i >= num - Math.floor(num / 3) ? that.round(10, 20) : that.round(30, 50);
        $creatEle.css({
          height: rnn,
          marginTop: (parentHeight - rnn) / 2 + "px",
        });
        tempDiv.append($creatEle);
      }
      that.items = tempDiv;
      that.container.html(tempDiv);
    }

    that.container = $(".voice");
    createWaveElements();
    that.container.find(".active span").css({
      width: "calc(" + 100 / num + "% - 2px)",
      background: bgcolor,
      margin: "0 1px",
    });
    voice.inited = true;
  },

  generateKeyframe: function (index, scaleValue) {
    var inverseScale = 2 - scaleValue;
    return `
      @keyframes mymove${index} {
        0% { transform: scaleY(${scaleValue}); }
        25% { transform: scaleY(1); }
        50% { transform: scaleY(${inverseScale}); }
        75% { transform: scaleY(1); }
        100% { transform: scaleY(${scaleValue}); }
      }
      @-webkit-keyframes mymove${index} {
        0% { transform: scaleY(${scaleValue}); }
        25% { transform: scaleY(1); }
        50% { transform: scaleY(${inverseScale}); }
        75% { transform: scaleY(1); }
        100% { transform: scaleY(${scaleValue}); }
      }
    `;
  },

  startSpeakAnimation: function () {
    var that = this;
    that.container = $(".voice");
    that.container.show();
    that.container.html(that.items);

    var _spanDoms = that.container.find(".active span");
    var _keyframes = "";

    for (var j = 0; j < _spanDoms.length; j++) {
      _keyframes += that.generateKeyframe(j, that.round(0.5, 2));
    }

    if (!that.styleElement) {
      that.styleElement = document.createElement("style");
      that.styleElement.type = "text/css";
      that.container[0].appendChild(that.styleElement);
    }

    try {
      that.styleElement.textContent = _keyframes;
    } catch (e) {
      that.styleElement.styleSheet.cssText = _keyframes;
    }

    for (var j = 0; j < _spanDoms.length; j++) {
      var delay = Math.ceil(Math.random() * 5) / 10;
      _spanDoms.eq(j).css({
        animation: `mymove${j} 1s ${delay}s linear infinite`,
      });
    }
  },

  stopSpeakAnimation: function () {
    this.container.find(".active").remove();
    this.inited = false;
  },

  over: function () {
    $("#button_voice i").show();
    $("#button_voice #listening").hide();
  },

  /**
   * @param {string} text - 提示内容
   * @param {number} [time] - 自动隐藏时间（毫秒）
   */
  showTips: function (text, time) {
    var self = this;
    $(".tips span").text(text);
    if (time) {
      setTimeout(self.hideTips, time);
    }
  },

  hideTips: function () {
    $(".tips").remove();
  },
};

window["voice"] = voice;
