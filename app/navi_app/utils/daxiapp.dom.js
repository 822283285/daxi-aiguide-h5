(function (global, $) {
  var daxiapp = (global["DaxiApp"] = global["DaxiApp"] || {});
  var strLength = function (str) {
    var totalCount = 0;
    for (var i = 0; i < str.length; i++) {
      if (!str.charAt(i).match(/[u0391-uFFE5]/)) {
        if (str.charAt(i) === "(" || str.charAt(i) === ")") {
          totalCount++;
        } else {
          totalCount += 2;
        }
      } else {
        totalCount++;
      }
    }
    return totalCount;
  };
  (function () {
    if (!window["Handlebars"]) {
      return;
    }
    Handlebars["registerHelper"]("text_list", function (items, options) {
      var start = "<ul class='text-items'>";
      var end = "</ul>";
      var str = "",
        poi = "",
        keyword = "",
        style = "",
        type = "",
        name = "",
        sort = "";
      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        if (i % 4 === 0) {
          if (i !== 0) {
            str += end;
          }
          str += start;
        }
        poi = item["poiId"] || item["result"] || "";
        keyword = item["keyword"] || item["info"] || "";
        name = item["name"] || "";
        type = item["type"] || "";
        sort = item["sort"] || "1";
        filter = item["filter"] || "";
        style = "";
        var length = strLength(name);
        if (name && length > 12) {
          style = "style='font-size:10px '";
        }
        str +=
          "<li data-keyword='" +
          keyword +
          "' data-sort='" +
          sort +
          "' data-poi='" +
          poi +
          "' data-type='" +
          type +
          "' data-filter='" +
          filter +
          "'  data-value='" +
          name +
          "' " +
          style +
          ">" +
          name +
          "</li>";
      }
      return str + end;
    });
    Handlebars["registerHelper"]("text_list1", function (items, options) {
      var start = "<div class='text-items-wrapper'><ul class='text-items'>";
      var end = "</ul></div>";
      var str = "",
        poi = "",
        keyword = "",
        style = "",
        type = "",
        name = "",
        sort = "";
      str += start;
      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];

        poi = item["poiId"] || item["result"] || "";
        keyword = item["keyword"] || item["info"] || "";
        name = item["name"] || "";
        type = item["type"] || "";
        sort = item["sort"] || "1";
        filter = item["filter"] || "";
        style = "";
        // var length=strLength(name);
        // if(name&&length>12) {
        //     style = "style='font-size:10px '";
        // }
        str +=
          "<li data-keyword='" +
          keyword +
          "' data-sort='" +
          sort +
          "' data-poi='" +
          poi +
          "' data-type='" +
          type +
          "' data-filter='" +
          filter +
          "'  data-value='" +
          name +
          "' " +
          style +
          ">" +
          name +
          "</li>";
      }

      return str + end;
    });

    Handlebars["registerHelper"]("icon_list", function (items, options) {
      if (!items) {
        return "";
      }
      var start = "<ul class='main-icon-list'>";
      var end = "</ul>";
      var str = "",
        poi = "",
        keyword = "",
        name = "",
        icon = "",
        type = "",
        sort = "";

      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        if (i % 5 === 0) {
          if (i !== 0) {
            str += end;
          }
          str += start;
        }
        poi = item["result"] || "";
        keyword = item["keyword"] || "";
        name = item["name"] || "";
        type = item["type"] || "";
        icon = item["icon"] || "";
        sort = item["sort"] || "1";

        str +=
          "<li data-keyword='" +
          keyword +
          "' data-sort='" +
          sort +
          "' data-poi='" +
          poi +
          "' data-type='" +
          type +
          "' data-value='" +
          name +
          "' class='" +
          icon +
          "'>" +
          name +
          "</li>";
      }
      return str + end;
    });
    Handlebars["registerHelper"]("icon_list1", function (items, options) {
      if (!items) {
        return "";
      }
      var str = "",
        poi = "",
        keyword = "",
        name = "",
        icon_font = "",
        icon_image = "",
        type = "",
        sort = "";

      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];

        poi = item["result"] || "";
        keyword = item["keyword"] || "";
        name = item["name"] || "";
        type = item["type"] || "";
        icon_font = item["icon"] || item["icon-font"] || "";
        icon_image = item["image-icon"] || "";
        online_source = item["online"] || "";

        sort = item["sort"] || "1";

        str +=
          "<li data-keyword='" + keyword + "' data-sort='" + sort + "' data-poi='" + poi + "' data-type='" + type + "' data-value='" + name + "' class='item'>";
        if (icon_font) {
          str += "<span class='icons " + icon_font + "'></span><span class='name'>" + name + "</span>";
        } else if (icon_image) {
          if (window["dxMapPath"]) {
            icon_image = window["dxMapPath"] + "/" + icon_image;
          }
          if (online_source) {
            var rootPath = dataRootPath.replace("{{filename}}", icon_image);
            str += "<span class='image-icon' style='background-image:url(" + rootPath + ")' > </span><span class='name'>" + name + "</span>";
          } else {
            str += "<span class='image-icon' style='background-image:url(" + icon_image + ")' > </span><span class='name'>" + name + "</span>";
          }
        }
        str += "</li>";
      }
      // var main_icon_hbs = "<ul class='main-icon-list'>{{#each items}}<li data-keyword='{{keyword}}' data-sort='{{sort}}' data-poi='{{#poi}}' data-type='{{type}}' data-value='{{name}}' ><span {{#if icon}}class='icon-font {{icon}}'{{else}} class='image-icon' style='background-image:url('{{image-icon}}')'{{/if}}  style='background'></span><span class='name'>{{name}}</span></li>{{/each}}</ul>";
      var start = "<ul class='main-icon-list'>";
      var end = "</ul>";

      return start + str + end;
    });
    Handlebars["registerHelper"]("icon_list3", function (items, options) {
      if (!items) {
        return "";
      }
      var str = "",
        poi = "",
        keyword = "",
        name = "",
        icon_font = "",
        icon_image = "",
        type = "",
        types = "",
        sort = "",
        category = "";

      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];

        poi = item["result"] || "";
        keyword = item["keyword"] || "";
        name = item["name"] || "";
        type = item["type"] || "";
        types = item["types"] || "";
        icon_font = item["icon"] || item["icon-font"] || "";
        icon_image = item["image-icon"] || "";
        online_source = item["online"] || "";
        bdid = item["bdid"] || "";

        sort = item["sort"] || "1";
        category = item["category"] || "";

        str +=
          "<li data-types='" +
          types +
          "' data-keyword='" +
          keyword +
          "' data-sort='" +
          sort +
          "' data-poi='" +
          poi +
          "'data-bdid='" +
          bdid +
          "' data-type='" +
          type +
          "' data-value='" +
          name +
          "' data-category='" +
          category +
          "' class='item'>";
        if (icon_font) {
          str += "<span class='icons " + icon_font + "'></span>";
        } else if (icon_image) {
          if (window["dxMapPath"]) {
            icon_image = window["dxMapPath"] + "/" + icon_image;
          }
          if (online_source) {
            var rootPath = dataRootPath.replace("{{filename}}", icon_image);
            str += "<span class='image-icon' style='background-image:url(" + rootPath + ")' > </span>";
          } else {
            str += "<span class='image-icon' style='background-image:url(" + icon_image + ")' > </span>";
          }
        }
        str += "<span class='name'>" + (name || types) + "</span></li>";
      }
      var start = "<ul class='main-icon-list'>";
      var end = "</ul>";

      return start + str + end;
    });
    Handlebars["registerHelper"]("text_list2", function (items, scenetype, options) {
      var start = "<ul>";
      var end = "</ul>";
      var str = "",
        poi = "",
        keyword = "",
        style = "",
        type = "",
        name = "",
        sort = "";
      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        if (i % 4 === 0) {
          if (i !== 0) {
            str += end;
          }
          str += start;
        }
        poi = item["poiId"] || item["result"] || "";
        keyword = item["keyword"] || item["info"] || "";
        name = item["name"] || "";
        type = item["type"] || "";
        sort = item["sort"] || "1";
        filter = item["filter"] || "";
        style = "";
        var length = strLength(name);
        if (name && length > 12) {
          style = "style='font-size:10px '";
        }
        str +=
          "<li data-keyword='" +
          keyword +
          "' data-sort='" +
          sort +
          "' data-poi='" +
          poi +
          "' data-type='" +
          type +
          "' data-filter='" +
          filter +
          "' data-scene='" +
          scenetype +
          "'  data-value='" +
          name +
          "' " +
          style +
          ">" +
          name +
          "</li>";
      }
      return str + end;
    });
    Handlebars["registerHelper"]("text_list3", function (items, scenetype, options) {
      var start = "<ul class='detail_textListContainer'>";
      var end = "</ul>";
      var str = "",
        poi = "",
        keyword = "",
        style = "",
        type = "",
        name = "",
        sort = "",
        serial = "",
        species = "",
        address = "",
        time = "",
        emcees = "",
        speeches = "";
      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        if (i % 4 === 0) {
          if (i !== 0) {
            str += end;
          }
          str += start;
        }
        poi = item["poiId"] || item["result"] || "";
        keyword = item["keyword"] || item["info"] || "";
        name = item["name"] || "";
        type = item["type"] || "";
        sort = item["sort"] || "1";
        filter = item["filter"] || "";
        serial = item["serial"] || "";
        species = item["species"] || "";
        address = item["address"] || "";
        time = item["time"] || "";
        emcees = item["detailInfo"] ? item["detailInfo"]["emcees"] : "";
        speeches = item["detailInfo"] ? item["detailInfo"]["speeches"] : "";

        style = "";
        var length = strLength(name);
        if (name && length > 12) {
          style = "style='font-size:10px '";
        }
        str +=
          "<li class='sublist_container' data-keyword='" +
          keyword +
          "' data-sort='" +
          sort +
          "' data-poi='" +
          poi +
          "' data-type='" +
          type +
          "' data-filter='" +
          filter +
          "' data-scene='" +
          scenetype +
          "'  data-value='" +
          name +
          "' " +
          style +
          ">" +
          "<p class='subline'> <span class=''>" +
          serial +
          (serial ? ": " : "") +
          "</span> <span>" +
          species +
          (species ? ": " : "") +
          "</span> <span>" +
          name +
          "</span></p>" +
          "<p class='subline columns2'> <span>会议室: " +
          address +
          "</span> <span>时间: " +
          time +
          "</span></p>";
        if (emcees) {
          str += "<p class='emcees'>主持人: " + emcees.join("  ") + "</p>";
        }
        if (speeches) {
          str += "<p class='speeches'>演讲人: " + speeches.join("  ") + "</p>";
        }

        str += "</li>";
      }
      return str + end;
    });
    Handlebars["registerHelper"]("text_list4", function (items, options) {
      var start = "<div class='text-items-wrapper'><ul class='text-items'>";
      var end = "</ul></div>";
      var str = "",
        poi = "",
        keyword = "",
        style = "",
        type = "",
        name = "",
        sort = "",
        address = "",
        types = "",
        result = "";
      str += start;
      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];

        poi = item["poiId"] || item["result"] || "";
        keyword = item["keyword"] || item["info"] || "";
        name = item["name"] || "";
        type = item["type"] || "";
        types = item["types"] || "";
        sort = item["sort"] || "1";
        filter = item["filter"] || "";
        address = item["address"] || "";
        result = item["result"] || "";
        style = "";
        str +=
          "<li data-result='" +
          result +
          "' data-keyword='" +
          keyword +
          "' data-sort='" +
          sort +
          "' data-poi='" +
          poi +
          "' data-type='" +
          type +
          "' data-types='" +
          types +
          "' data-filter='" +
          filter +
          "'  data-value='" +
          name +
          "' " +
          style +
          ">" +
          name +
          "<span>" +
          address +
          "</span></li>";
      }

      return str + end;
    });
    Handlebars["registerHelper"]("text_list5", function (items, scenetype, options) {
      var str = "<ul class='detail_textListContainer'>";
      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        str +=
          "<li class='sublist_container'>" +
          "<p class='subline clearfix'> <span class='fl'>" +
          item.address +
          "</span><span class='fr'>" +
          item.type +
          "</span></p>";
        for (var j = 0; j < item.list.length; j++) {
          var con = item.list[j];
          str += "<div class='boxs' data-poi='" + con.poiId + "'>";
          str += "<div class='name'>《" + con.name + "》</div>";
          str += "<div class='company clearfix'><span class='time'>" + con.time + "</span><span class='comname'>" + con.company + "</span></div>";
          str += "</div>";
        }

        str += "</li>";
      }
      str += "</ul>";
      return str;
    });
    Handlebars["registerHelper"]("department_list", function (items, options) {
      var str = '<div class="left"><div>';
      items.forEach(function (item, index) {
        if (index == 0) {
          str += '<div class="active">' + item.title + "</div>";
        } else {
          str += "<div>" + item.title + "</div>";
        }
      });
      str += '</div></div><div class="right">';
      items.forEach(function (item, index) {
        if (index == 0) {
          str += '<div class="sub-genres-collection on">';
        } else {
          str += '<div class="sub-genres-collection">';
        }
        item.list.forEach(function (i) {
          str += "<div>";
          str += '<div class="sub-collection-title">' + i.floor + "</div>";
          str += '<div class="sub-collection-content">';
          i.pois.forEach(function (j) {
            str +=
              '<div class="sub-tag" data-keyword="' +
              (j.keyword || "") +
              '" data-poi="' +
              ((j.result && j.result.join(",")) || "") +
              '" data-type="' +
              j.type +
              '" data-address="' +
              j.address +
              '">' +
              j.name +
              "</div>";
          });
          str += "</div></div>";
        });
        str += "</div>";
      });
      str += "</div>";
      return str;
    });
    Handlebars["registerHelper"]("icon_list2", function (items, scenetype, options) {
      if (!items) {
        return "";
      }
      var start = "<ul class='main-icon-list'>";
      var end = "</ul>";
      var str = "",
        poi = "",
        keyword = "",
        name = "",
        icon = "",
        type = "",
        sort = "";

      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        if (i % 4 === 0) {
          if (i !== 0) {
            str += end;
          }
          str += start;
        }
        poi = item["result"] || "";
        keyword = item["keyword"] || "";
        name = item["name"] || "";
        type = item["type"] || "";
        icon = item["icon"] || "";
        sort = item["sort"] || "1";

        str +=
          "<li data-keyword='" +
          keyword +
          "' data-sort='" +
          sort +
          "' data-poi='" +
          poi +
          "' data-type='" +
          type +
          "' data-scene='" +
          scenetype +
          "' data-value='" +
          name +
          "' class='" +
          icon +
          "'>" +
          name +
          "</li>";
      }
      return str + end;
    });
    Handlebars["registerHelper"]("hot_station_list", function (items, options) {
      if (!items) {
        return "";
      }
      var start = '<ul class="hot_station_list" data-capital="hotStations">';
      var end = "</ul>";
      var str = '<p class="hot_title" >' + items["title"] + "</p>",
        bdid = "",
        cn_name = "",
        cat = "",
        citycode = "",
        address = "";

      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        if (i % 3 === 0) {
          if (i !== 0) {
            str += end;
          }
          str += start;
        }
        bdid = item["bdid"] || "";
        cn_name = item["cn_name"] || "";
        name = item["name"] || "";
        cat = item["cat"] || "";
        citycode = item["citycode"] || "";
        address = item["address"] || "1";

        str +=
          "<li class='station' data-bdid='" +
          bdid +
          "' data-cn_name='" +
          cn_name +
          "' data-citycode='" +
          citycode +
          "' data-address='" +
          address +
          "'>" +
          cn_name +
          "</li>";
      }
      return str + end;
    });
    Handlebars["registerHelper"]("hot_station_list2", function (items, options) {
      if (!items) {
        return "";
      }
      var start = '<ul class="hot_station_list" >';
      var end = "</ul>";
      var str = '<p class="hot_title capital" >' + items["title"] + "</p>",
        bdid = "",
        cn_name = "",
        cat = "",
        citycode = "",
        address = "";
      str += start;
      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        bdid = item["bdid"] || "";
        cn_name = item["cn_name"] || "";
        name = item["name"] || "";
        cat = item["cat"] || "";
        citycode = item["citycode"] || "";
        address = item["address"] || "1";
        str +=
          "<li class='station'" +
          (item["enable"] != true ? " disable" : "") +
          " data-bdid='" +
          bdid +
          "' data-cn_name='" +
          cn_name +
          "' data-citycode='" +
          citycode +
          "' data-address='" +
          address +
          "'>" +
          cn_name +
          "</li>";
      }
      return str + end;
    });
    Handlebars["registerHelper"]("tabView_icon_list", function (icons_list_datas, options) {
      if (!icons_list_datas) {
        return "";
      }
      var resultstr = "<div class='tabView-container'>";
      var end = "</div>";
      var tabsStr = "<ul class='tabView-tabs'>";
      var tabViewsStr = "<div class='tabView-content'>";
      for (var j = 0, len = icons_list_datas.length; j < len; j++) {
        var icon_list_data = icons_list_datas[j];
        var commonPoisItems = icon_list_data["commonPois"];
        var poiTypeListItems = icon_list_data["poiTypeList"];
        var title = icon_list_data["title"];
        var poi_type = icon_list_data["type"];
        tabsStr += "<li class='tab" + (j == 0 ? " active" : "") + "' data-target='icon_tabView" + j + "'>" + title + "</li>";

        var str = "<div class='icon-tabView" + (j == 0 ? " active" : "") + "' id='icon_tabView" + j + "'>";
        var poi = "",
          keyword = "",
          name = "",
          icon = "",
          type = "",
          sort = "";

        var _start = "<ul class='tabView-icon-list'>";
        var _end = "</ul>";

        for (var i = 0, l = commonPoisItems.length; i < l; i++) {
          var item = commonPoisItems[i];
          if (i % 4 === 0) {
            if (i !== 0) {
              str += _end;
            }
            str += _start;
          }
          poi = item["result"] || "";
          keyword = item["keyword"] || "";
          name = item["name"] || "";
          type = item["type"] || "";
          icon = item["icon"] || "";
          sort = item["sort"] || "1";

          str +=
            "<li data-keyword='" +
            keyword +
            "' data-sort='" +
            sort +
            "' data-poi='" +
            poi +
            "' data-type='" +
            type +
            "' data-value='" +
            name +
            "' data-poi-type='" +
            poi_type +
            "' class='" +
            icon +
            " " +
            poi_type +
            "'>" +
            name +
            "</li>";
        }
        str += "</div>";
        tabViewsStr += str + _end;
      }
      tabsStr += "</ul>";
      tabViewsStr += "</div>";
      resultstr += tabsStr + tabViewsStr + end;
      return resultstr;

      // return str+end;
    });

    Handlebars["registerHelper"]("autocomplete_list", function (items, options) {
      var start = "<ul class='autocomplete_list'>";
      var end = "</ul>";

      var str = "",
        poi = "",
        keyword = "",
        name = "";
      str += start;
      var extendInfo = items["extendInfo"];
      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        poi = item["id"] || item["poiId"] || "";
        keyword = item["keyword"] || item["focus"] || "";
        var lon = item["lon"] || item["x"] || "",
          lat = item["lat"] || item["y"] || "",
          text = item["text"] || "",
          floorId = item["floorId"] || "",
          distance = item["distance"] || "";
        var floorName = item["floorName"] || "";
        var address = item["address"] || "";
        var type = item["type"] || "2";
        var dataType = item["dataType"] || 1;
        var bdid = item["bdid"] || "";
        var distanceDes = item["distanceDes"] || "";
        var viewType = item["viewType"] || "";
        var extenddata = item["data"];
        var itemType = item["itemType"] || "";
        extenddata ? (extenddata = JSON.stringify(extenddata)) : "";
        if (distance && distance["localDescription"]) {
          distance = distance["localDescription"];
        }
        var reg = new RegExp(keyword, "gi");
        name = (text && text.trim()) || keyword; //.replace(reg, "<mark>" + keyword + "</mark>");
        reg = null;
        str +=
          "<li class='" +
          (lon && lat ? "icon-mypos" : "icon-search1") +
          " item' data-id='" +
          poi +
          "' data-keyword='" +
          (text || keyword) +
          "' data-bdid='" +
          bdid +
          "' data-lon='" +
          lon +
          "' data-lat='" +
          lat +
          "' data-address='" +
          address +
          "' data-text='" +
          text +
          "' data-floorId='" +
          floorId +
          "' data-floorName='" +
          floorName +
          "' data-type='" +
          type +
          "' data-viewtype='" +
          viewType +
          "' data-datatype='" +
          dataType +
          "' data-distance='" +
          distance +
          (extenddata ? "' data-extenddata='" + extenddata + "'" : "") +
          (item["detailed"] ? "' data-detailed='" + item["detailed"] + "'" : "") +
          (item["category"] ? "' data-category='" + item["category"] + "'" : "") +
          "'>" +
          "<div class='wrapper'>" +
          "<p class='text title'>" +
          name +
          "</p>" +
          (itemType != "keyword"
            ? "<p class='detail_info'>" +
              (!items["hideDistance"]
                ? distanceDes != undefined
                  ? "<span class='distance'>" + distanceDes + "</span>"
                  : distance
                    ? "<span class='distance'>" + distance + "</span>"
                    : ""
                : "") +
              " <span class='address'>" +
              address +
              "</span></p>"
            : "") +
          "</div>" +
          (itemType != "keyword" && bdid && extendInfo && item["detailed"] == "2"
            ? '<div class="genre-item-detail"><i class="' +
              extendInfo["icon"] +
              '"></i><span>' +
              (extendInfo["name"] || (window["langData"] && window["langData"]["route:btntext"]) || "详情") +
              "</span></div>"
            : "") +
          (itemType != "keyword"
            ? '<div class="genre-item-gohere"><i class="icon_gb-line"></i><span>' +
              ((window["langData"] && window["langData"]["route:btntext"]) || "路线") +
              "</span></div>"
            : "") +
          "</li>";
      }
      return str + end;
    });
    Handlebars["registerHelper"]("eq", function (val1, val2, options) {
      // return (val1 == val2);
      if (val1 == val2) {
        return options["fn"](this);
      } else {
        // 不满足条件执行{{else}}部分
        return options.inverse(this);
      }
    });
    Handlebars["registerHelper"]("nq", function (val1, val2, options) {
      // return !(val1 == val2);
      if (val1 != val2) {
        return options["fn"](this);
      } else {
        // 不满足条件执行{{else}}部分
        return options.inverse(this);
      }
    });

    // 比较第一个变量是否大于第二个
    Handlebars["registerHelper"]("gt", function (left, right, options) {
      if (arguments.length !== 3) {
        throw new Error('helper "gt" needs 2 arguments');
      }
      if (left > right) {
        return options["fn"](this);
      } else {
        return options.inverse(this);
      }
    });
    Handlebars["registerHelper"]("slice", function (text, left, right, options) {
      if (arguments.length !== 4) {
        throw new Error('helper "gt" needs 2 arguments');
      }
      if (text.length > right) {
        text = text.slice(0, 70) + "...";
      }
      return text;
      // return options["fn"](this);
    });

    // 比较第一个变量是否大于等于第二个
    Handlebars["registerHelper"]("gte", function (left, right, options) {
      if (arguments.length !== 3) {
        throw new Error('helper "gte" needs 2 arguments');
      }
      if (left >= right) {
        return options["fn"](this);
      } else {
        return options.inverse(this);
      }
    });

    // 比较第一个变量是否小于第二个
    Handlebars["registerHelper"]("lt", function (left, right, options) {
      if (arguments.length !== 3) {
        throw new Error('helper "lt" needs 2 arguments');
      }
      if (left < right) {
        return options["fn"](this);
      } else {
        return options.inverse(this);
      }
    });

    // 比较第一个变量是否小于等于第二个
    Handlebars["registerHelper"]("lte", function (left, right, options) {
      if (arguments.length !== 3) {
        throw new Error('helper "lte" needs 2 arguments');
      }
      if (left <= right) {
        return options["fn"](this);
      } else {
        return options.inverse(this);
      }
    });
    Handlebars["registerHelper"]("inc", function (value, options) {
      return parseInt(value) + 1;
    });
  })();
  var DXDom = (function ($) {
    var thisObject = {};
    thisObject.lastClickTime = new Date().getTime();
    thisObject.isFastClick = function (event) {
      var currentClickTime = new Date().getTime();
      var isFastClick = false;
      if (currentClickTime - thisObject.lastClickTime < 500) {
        isFastClick = true;
      }
      thisObject.lastClickTime = currentClickTime;
      return isFastClick;
    };
    thisObject.isSingleClick = function (event) {
      if (event["touches"] && event["touches"].length < 2) {
        return true;
      } else {
        return false;
      }
    };
    thisObject.geneDom = function (str) {
      return $(str);
    };
    thisObject.html = function (dom, val) {
      if (val === undefined) {
        return dom["html"]();
      }
      dom["html"](val);
    };
    thisObject.downHighLight = function (dom, val) {
      dom["downHighLight"](val);
    };
    thisObject.find = function ($dom, selector) {
      if ($dom && selector) {
        return $dom["find"](selector);
      }
    };
    thisObject.findSiblings = function ($dom, siblingSelector) {
      if ($dom && siblingSelector) {
        return $dom["siblings"](siblingSelector);
      }
    };
    thisObject.append = function (dom, htmlStr) {
      return dom["append"](htmlStr);
    };
    thisObject.children = function (dom, nodeName) {
      return dom["children"](nodeName);
    };
    thisObject.template = function (templateDom, json, dom) {
      var text = templateDom["html"]();
      var template = Handlebars.compile(text);
      var html = template(json);
      if (dom === undefined) {
        return html;
      }
      dom["html"](html);
      //thisObject.html(dom, html);
    };

    thisObject.templateText = function (text, json, dom) {
      var template = Handlebars.compile(text);
      var html = template(json);
      if (dom === undefined) {
        return html;
      }
      dom["html"](html);
      //thisObject.html(dom, html);
    };
    thisObject.changeActiveTap = function (dom) {
      dom["addClass"]("active")["siblings"]()["removeClass"]("active");
    };

    thisObject.css = function (dom, key, val) {
      if (val === undefined) {
        return dom["css"](key);
      }
      dom["css"](key, val);
    };

    thisObject.cssString = function (dom, val) {
      if (val === undefined) {
        return dom["css"]();
      }
      dom["css"](val);
    };

    thisObject.attr = function (dom, key, val) {
      if (val === undefined) {
        return dom["attr"](key);
      }
      dom["attr"](key, val);
    };

    thisObject.addClass = function (dom, val) {
      dom["addClass"](val);
    };

    thisObject.removeClass = function (dom, val) {
      dom["removeClass"](val);
    };

    thisObject.text = function (dom, val) {
      dom["text"](val);
    };

    thisObject.val = function (dom, defaultVal) {
      return dom ? dom["val"]() : defaultVal;
    };

    thisObject.data = function (dom, key, val) {
      if (val === undefined) {
        return dom["data"](key);
      }
      dom["data"](key, val);
    };

    thisObject.on = function (dom, eventType, selector, cb) {
      if (selector) {
        dom["on"](eventType, selector, cb);
      } else {
        dom["on"](eventType, cb);
      }
    };
    thisObject.off = function (dom, eventType, selector, cb) {
      if (selector) {
        dom["off"](eventType, selector, cb);
      } else {
        dom["off"](eventType, cb);
      }
    };

    thisObject.hasClass = function (dom, key) {
      return dom["hasClass"](key);
    };

    thisObject.getData = function (type, dom) {
      var _data = null;
      var dataSet = dom.dataset;
      var _type = parseInt(dataSet["type"] || 0) || dataSet["type"] || 0,
        // DXKJ-706 点击东南西北四个出站口西显示“null” dom.getAttribute("data-keyword") || dom.getAttribute("data-text") 没有该属性时返回null ||“” 处理避免null值
        // DXKJ-700 搜索框搜30个1，然后点击历史记录，搜索文本发生变化 zepto $(dom).data("keyword") 获取纯数字的过长返回的是科学计数法并且字符串会转数字类型
        keyword = dom.getAttribute("data-keyword") || dom.getAttribute("data-text") || dom.getAttribute("data-value") || "", //$(dom).data('keyword')||$(dom).data('text'),
        bdid = dataSet["bdid"] || "";
      ((poiIds = dataSet["poi"]),
        (address = dataSet["address"]),
        (lon = parseFloat(dataSet["lon"] || 0)),
        (lat = parseFloat(dataSet["lat"] || 0)),
        (distance = dataSet["distance"]),
        (floorId = (dataSet["floorid"] || "") + ""),
        (floorName = dataSet["floorname"] || ""),
        (floorCnName = dataSet["floorcnname"] || ""),
        (dataType = parseInt($(dom).data("datatype") || 0)), // || dataSet['datatype'] || 11,
        (source = dataSet["scene"] || dataSet["source"]),
        (value = (dom.getAttribute("data-value") || "") + ""),
        (sort = dataSet["sort"]),
        (poi_type = dataSet["poi-type"]),
        (types = dataSet["types"]),
        (_id = (dataSet["id"] || dataSet["poi"] || "") + ""),
        (filter = dataSet["filter"]),
        (viewType = dataSet["viewtype"] || ""),
        (text = dom.getAttribute("data-text") || keyword),
        (category = dataSet["category"] || ""),
        (result = dataSet["result"] || ""),
        (extenddata = dataSet["extenddata"]));
      if (extenddata) {
        extenddata = JSON.parse(extenddata);
      }
      keyword ? (keyword += "") : "";
      address ? (address += "") : "";
      poiIds ? (poiIds += "") : "";
      filter ? (filter += "") : "";
      if (!dataType) {
        bdid ? (dataType = 1) : (dataType = 11);
      }

      switch (type) {
        case "hosSearch_list":
        case "icon_list":
        case "text_list":
          _data = {};
          _data["type"] = _type;
          _data["dataType"] = dataType;
          _data["keyword"] = keyword;
          _data["poiIds"] = poiIds;
          _data["value"] = value;
          _data["sort"] = sort;
          _data["filter"] = filter;
          _data["source"] = source;
          _data["viewType"] = viewType;
          _data["types"] = types;
          _data["id"] = _id;
          _data["category"] = category;
          _data["result"] = result;

          break;
        case "tabView_icon_list":
          _data = {};
          _data["type"] = _type;
          _data["dataType"] = dataType;
          _data["keyword"] = keyword;
          _data["poiIds"] = poiIds;
          _data["value"] = value;
          _data["sort"] = sort;
          _data["filter"] = filter;
          _data["poi_type"] = poi_type;
          _data["viewType"] = viewType;
          _data["result"] = result;
          break;
        case "result_list":
          _data = {};
          _data["type"] = _type;
          _data["dataType"] = dataType;
          _data["poi"] = poiIds;
          _data["address"] = address;
          _data["viewType"] = viewType;
          _data["result"] = result;
          break;
        case "history_list":
          _data = {};

          _data["type"] = _type;
          _data["dataType"] = dataType;

          _id && (_data["poiId"] = _id);
          lon && (_data["lon"] = lon);
          lat && (_data["lat"] = lat);
          floorId && (_data["floorId"] = floorId);
          floorName && (_data["floorName"] = floorName);
          floorCnName && (_data["floorCnName"] = floorCnName);

          keyword && (_data["keyword"] = keyword);
          address && (_data["address"] = address);
          sort && (_data["sort"] = sort);
          distance && (_data["distance"] = distance);
          text && (_data["name"] = _data["text"] = text);
          _data["viewType"] = viewType;
          _data["category"] = category;
          _data["result"] = result;

          break;
        case "autocomplete_list":
          _data = {};
          _data["type"] = _type;
          _data["dataType"] = dataType;
          _id && (_data["poiId"] = _id);
          lon && (_data["lon"] = lon);
          lat && (_data["lat"] = lat);
          floorId && (_data["floorId"] = floorId);
          floorName && (_data["floorName"] = floorName);
          floorCnName && (_data["floorCnName"] = floorCnName);

          keyword && (_data["keyword"] = keyword);
          address && (_data["address"] = address);
          sort && (_data["sort"] = sort);
          distance && (_data["distance"] = distance);
          text && (_data["name"] = _data["text"] = text);
          _data["viewType"] = viewType;
          _data["category"] = category;
          _data["result"] = result;

          break;
        case "takeme":
          _data = {};
          _data["type"] = _type;
          _data["dataType"] = parseInt($(dom).data("type") || 1);
          _data["name"] = _data["text"] = keyword;
          _data["poiId"] = _id;
          _data["poi"] = poiIds;
          _data["address"] = address;
          lon && (_data["lon"] = lon);
          lat && (_data["lat"] = lat);
          _data["floorId"] = floorId;
          _data["result"] = result;
      }
      _data["bdid"] = bdid;
      if (dataSet["detailed"] != undefined && dataSet["detailed"] != null && dataSet["detailed"] != "undefined") {
        _data["detailed"] = dataSet["detailed"];
      }
      extenddata && (_data["data"] = extenddata);
      return _data;
    };
    thisObject.outTimer = null;
    thisObject.showInfo = function (msg, delay, callback, styleObj) {
      if (!delay) {
        delay = 2000;
      }
      var $info = $("#__msg_info");
      if ($info.length == 0) {
        $info = $('<div id="__msg_info"><div></div></div>');
        $info["css"]({
          width: "64%",
          position: "absolute",
          left: "18%",
          bottom: "120px",
          //"left":'60px',
          "text-align": "center",
          "z-index": 100,
          "font-size": "15.5px",
        });
        $info
          .find("div")
          ["css"]({
            "background-color": "#333",
            color: "#fff",
            "max-width": "190px",
            display: "inline-block",
            "border-radius": "2.8px",
            padding: "11px",
            opacity: 0.7,
            "text-align": "center",
          })
          ["addClass"]("blur");
        $("body").append($info);
      }
      if (styleObj) {
        $info["css"](styleObj);
      }
      if (msg && msg.indexOf("...") != -1) msg = "<span class='icon-rotatez'><span></span></span>&nbsp;&nbsp;" + msg;
      $info.find("div")["html"](msg);

      clearTimeout(thisObject.outTimer);

      if (delay !== 0) {
        thisObject.outTimer = setTimeout(function () {
          $info["hide"]();
          callback && callback();
        }, delay);
      }
      $info.show();
      return $info;
    };

    thisObject.getTemp = (function () {
      var tempList = {};
      var getTemplate = function (url, callback) {
        if (tempList[url] === undefined) {
          var page_templates = config.get("user_define_templates");
          if (page_templates) {
            text = page_templates[url];
            if (text) {
              tempList[url] = text;
              callback(text);
              return;
            }
          }

          $.ajax({
            url: url,
            timeout: 10000,
            success: callback || function () {},
            error: function (error) {
              debugger;
            },
          });
        } else {
          callback(tempList[url]);
        }
      };
      return getTemplate;
    })();

    thisObject.getTempToRender = function (url, data, renderFunction) {
      var rendObj = (function (url, data, renderFunction) {
        var isFirst = true,
          temp = "",
          _url = url,
          _data = data,
          _renderFunction = renderFunction;

        var render = function () {
          var renderTemplate = function (text, data) {
            var template = Handlebars.compile(text);
            var tempData = null;
            if ($["isFunction"](data)) {
              tempData = _data.apply(null);
            } else {
              tempData = _data;
            }
            var html = template(tempData);
            _renderFunction(html);
          };
          if (isFirst) {
            $.get(_url, function (text) {
              renderTemplate(text, _data);
              temp = text;
              isFirst = false;
            });
          } else {
            return renderTemplate(temp, _data);
          }
        };
        return render;
      })(url, data, renderFunction);
      return rendObj;
    };

    thisObject.hideInfo = function () {
      var $info = $("#__msg_info");
      $info["hide"]();
    };

    thisObject.showMask = function (opaque, isClear) {
      var $info = $("#__mask_info_1");
      if ($info.length == 0) {
        $info = $('<div id="__mask_info_1"></div>');
        $info["css"]({
          width: "100%",
          height: "100%",
          position: "absolute",
          "z-index": 99,
          opacity: opaque || 0.5,
          backgroundColor: "#000",
          left: 0,
          top: 0,
        });
        $("body").append($info);
        if (isClear) {
          $info["on"]("click", function () {
            $(this)["hide"]();
          });
        }
      }
      $info.show();
    };

    thisObject.hideMask = function () {
      var $info = $("#__mask_info_1");
      if ($info.length !== 0) {
        $info["hide"]();
        return true;
      }
      return false;
    };

    thisObject.showMask2 = function (opaque, isClear) {
      var $info = $("#__mask_info_2");
      if ($info.length == 0) {
        $info = $('<div id="__mask_info_2"></div>');
        $info["css"]({
          width: "100%",
          height: "100%",
          position: "absolute",
          "z-index": 99,
          opacity: opaque || 0.5,
          backgroundColor: "#000",
          left: 0,
          top: 0,
        });
        $("body").append($info);
        if (isClear) {
          $info["on"]("click", function () {
            $(this)["hide"]();
          });
        }
      }
      $info.show();
    };

    thisObject.hideMask2 = function () {
      var $info = $("#__mask_info_2");
      if ($info.length !== 0) {
        $info["hide"]();
        return true;
      }
      return false;
    };

    thisObject.show = function (dom, visible) {
      if (visible) {
        dom["show"]();
      } else {
        dom["hide"]();
      }
    };
    thisObject.scroller = function (id, _content) {
      myScroll = id.split("#")[1] || "myScroll";
      if (!!thisObject[myScroll]) {
        thisObject[myScroll]["destroy"]();
        thisObject[myScroll] = null;
      }
      thisObject[myScroll] = new IScroll(id, {
        probeType: 3,
        mouseWheel: true,
        scrollY: true,
      }); //bounce:false  反弹效果
      setTimeout(function () {
        if (_content && _content.scroll) {
          _content.scroll = thisObject[myScroll];
        }
        thisObject.goTop.bind(thisObject[myScroll]); //置顶功能 cheng.li 20150603
      }, 200);
    };
    thisObject.goTop = (function ($) {
      var thisObj = {};
      var ontap = false;
      var ishide = null;
      thisObj.bind = function (myScroll) {
        thisObj.hide();
        myScroll["on"](
          "scroll",
          function () {
            //自动显示隐藏	置顶控件
            if (myScroll.y < -myScroll.wrapperHeight + 50) {
              if (!ishide) {
                $("#top_btn")["removeClass"]("hide");
              }
              ishide = false;
            } else {
              if (!!ishide) {
                $("#top_btn")["addClass"]("hide");
              }
              ishide = true;
            }
          },
          false,
        );
        myScroll["on"](
          "scrollEnd",
          function () {
            if (ontap) {
              setTimeout(function () {
                myScroll.scrollerStyle.transform = "translate(0px, 0px) translateZ(0px)";
              }, 200);
              ontap = false;
            }
          },
          false,
        );
        $("body")["on"]("tap", "#top_btn", function () {
          ontap = true;
          myScroll.scrollBy(0, -myScroll.y, 1000, IScroll.utils.ease.elastic);
        });
        if ($("body").find("#top_btn").length != 0) return;
        thisObject.getTempToRender("views/gotop.hbs", null, function (html) {
          $("body").append(html);
        })();
      };
      thisObj.hide = function () {
        $("#top_btn")["addClass"]("hide");
      };
      return thisObj;
    })($);

    thisObject.enableDivAnimation = function (enable) {
      if (enable) {
        thisObject.animateTime = 300;
      } else {
        thisObject.animateTime = 10;
      }
    };
    thisObject.divAnimation = function (obj, mainObj, mainId, animation, offset, animateTime, callback) {
      //切换特效cheng.li 20150616
      function innerAnimation() {
        obj.find("header")["animate"](
          {
            left: -offset + "px",
          },
          animateTime,
          "ease-in-out",
        );
        mainObj.length &&
          mainObj["animate"](
            {
              left: -offset + "px",
            },
            animateTime,
            "ease-in-out",
            function () {
              if (offset != 0) obj["hide"]();
              // mainObj["css"]("overflow-y", "auto");
              if (typeof callback == "function") callback();
              if (offset == 0) {
                if (!!thisObject[mainId]) thisObject[mainId].refresh();
              }
            },
          );
      }

      // mainObj["css"]("overflow-y", "hidden");
      if (offset == 0) {
        if (animation) {
          obj.find("header")["css"]({
            left: -global.innerWidth + "px",
          });
          mainObj.length &&
            mainObj["css"]({
              left: -global.innerWidth + "px",
            });
        }
        // else {
        // obj.find("header")["css"]({"left": global.innerWidth + 'px'});
        // mainObj.length && mainObj["css"]({"left": global.innerWidth + 'px'});
        // }
        obj.show();
      }
      innerAnimation();
    };
    thisObject.hideAnimat = function (obj, animation, callback) {
      //向右侧隐藏传递animation 为 true
      var mainId = obj["attr"]("id"); //.split("_")[0] + "_main";

      animateTime = thisObject.animateTime;
      if (animation) {
        thisObject.divAnimation(obj, obj, mainId, animation, global.innerWidth, animateTime, callback);
      } else {
        thisObject.divAnimation(obj, obj, mainId, animation, -global.innerWidth, animateTime, callback);
      }
      thisObject.goTop.hide();
    };
    thisObject.showAnimate = function (obj, animation, callback) {
      //向左侧显示传递animation 为 true
      var mainId = obj["attr"]("id"); //.split("_")[0] + "_main";
      var animateTime = thisObject.animateTime;
      if (animation) {
        thisObject.divAnimation(obj, obj, mainId, animation, 0, animateTime, callback);
      } else {
        thisObject.divAnimation(obj, obj, mainId, animation, 0, animateTime, callback);
      }
    };
    thisObject.getStyle = function (element, styleName) {
      return element.style[styleName]
        ? element.style[styleName]
        : element.currentStyle
          ? element.currentStyle[styleName]
          : window.getComputedStyle(element, null)[styleName];
    };

    thisObject.showWifiMsgbox = function (callback, msg) {
      thisObject.showmsgbox(callback, msg, "取消", "去设置");
    };

    thisObject.hideWifiMsgbox = function () {
      thisObject.hidemsgbox();
    };

    thisObject.showmsgbox = function (callback, msg, btnName1, btnName2, callback1) {
      var $info = $("#__wifiMsgbox_info");
      if (msg === undefined) {
        msg = "需要开启蓝牙和Wifi";
      }
      btnName1 = btnName1 || "取消";
      btnName2 = btnName2 || "确定";
      if ($info.length > 0 && $info["css"]("display") !== "none") return;
      $info = "";
      thisObject.showMask();
      if ($info.length == 0) {
        $info = $(
          ' <div id="__wifiMsgbox_info"><ul><li>' +
            msg +
            '</li><li class="showMessageBox_normal_button">' +
            btnName1 +
            '</li><li class="clearfix showMessageBox_highlight_button">' +
            btnName2 +
            "</li></ul></div>",
        );
        $info["css"]({
          position: "absolute",
          width: "70%",
          height: "80px",
          "max-width": "300px",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          margin: "auto",
          "z-index": 100,
          background: "#fff",
          "border-radius": "5px",
          "box-shadow": "0 0 1px #ccc",
          padding: "20px",
        });
        $info.find("li")["css"]({
          float: "left",
        });
        $info.find("li")["eq"](0)["css"]({
          width: "100%",
          height: "50px",
          "vertical-align": "middle",
          "font-size": "2.56em", //20150529 cheng.li
        });

        $("body").append($info);
      }
      var text = $info.find("li")["eq"](0)["html"]();
      if (text !== msg) {
        $info.find("li")["eq"](0)["html"](msg);
      }
      $info["show"]();
      $info.find("li")["eq"](1)["off"]("click");
      $info.find("li")["eq"](2)["off"]("click");
      var hide = function () {
        $info["hide"]();
        thisObject.hideMask();
      };
      $info
        .find("li")
        ["eq"](1)
        ["on"]("click", function (e) {
          hide();
          callback1 && callback1();
        });
      $info
        .find("li")
        ["eq"](2)
        ["on"]("click", function (e) {
          hide();
          callback && callback();
        });
    };

    thisObject.showNotifyMsgBox = function (callback, msg, btnName1) {
      var $info = $("#__wifiMsgbox_info");
      if (msg === undefined) {
        msg = "";
      }
      btnName1 = btnName1 || "确定";
      if ($info.length > 0 && $info["css"]("display") !== "none") return;
      $info = "";
      thisObject.showMask();
      if ($info.length == 0) {
        $info = $(' <div id="__wifiMsgbox_info"><ul><li>' + msg + '</li><li class="clearfix showNotifyBox_highlight_button">' + btnName1 + "</li></ul></div>");
        $info["css"]({
          position: "absolute",
          width: "70%",
          height: "80px",
          "max-width": "300px",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          margin: "auto",
          "z-index": 100,
          background: "#fff",
          "border-radius": "5px",
          "box-shadow": "0 0 1px #ccc",
          padding: "20px",
        });
        $info.find("li")["css"]({
          float: "left",
        });
        $info.find("li")["eq"](0)["css"]({
          width: "100%",
          height: "50px",
          "vertical-align": "middle",
          "font-size": "2.56em", //20150529 cheng.li
        });

        $("body").append($info);
      }
      var text = $info.find("li")["eq"](0)["html"]();
      if (text !== msg) {
        $info.find("li")["eq"](0)["html"](msg);
      }
      $info["show"]();
      $info.find("li")["eq"](1)["off"]("click");
      var hide = function () {
        $info["hide"]();
        thisObject.hideMask();
      };
      $info
        .find("li")
        ["eq"](1)
        ["on"]("click", function (e) {
          hide();
          callback && callback();
        });
    };
    thisObject.showmsgbox2 = function (callback, msg, btnName1, btnName2, routeOptions, callback1) {
      var defaultStrategy = command["strategy"] || config.get("defaultStrategy") || "0";
      var $info = $("#__wifiMsgbox_info");
      if (msg === undefined) {
        msg = "需要开启蓝牙和Wifi";
      }
      btnName1 = btnName1 || "取消";
      btnName2 = btnName2 || "确定";
      if ($info.length > 0 && $info["css"]("display") !== "none") return;
      thisObject.showMask();
      if ($info.length == 0) {
        var str = ' <div id="__wifiMsgbox_info"><ul><li>' + msg + "</li>";
        str += '<li class="radios"><form class="routeOptions">';
        for (var key in routeOptions) {
          var text = routeOptions[key];
          str +=
            '<div class="form-group radios_list_c1"><input type="radio" name="routeType" class="radioclass" value="' +
            key +
            '" /><label for="' +
            text +
            '">' +
            text +
            "</label></div>";
        }

        str += "</form>";

        str +=
          '<li class="showMessageBox_normal_button btn1">' +
          btnName1 +
          '</li><li class="clearfix showMessageBox_highlight_button btn2">' +
          btnName2 +
          "</li></ul></div>";
        $info = $(str);
        $info["css"]({
          position: "absolute",
          width: "58%",
          height: "max-content",
          "max-width": "300px",
          "text-align": "center",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          margin: "auto",
          "z-index": 100,
          background: "#fff",
          "border-radius": "5px",
          "box-shadow": "0 0 1px #ccc",
          padding: "20px 20px 2px 20px",
        });
        $info.find("li")["css"]({
          float: "left",
        });
        $info.find("li.radios form")["css"]({
          margin: "0 auto",
          width: "50%",
        });

        $info.find("li")["eq"](0)["css"]({
          width: "100%",
          height: "30px",
          "vertical-align": "middle",
          "font-size": "2.56em", //20150529 cheng.li
        });
        $info
          .find("input[value='" + defaultStrategy + "']")
          ["attr"]("checked", true)
          ["parent"]()
          ["addClass"]("selected");
        $("body").append($info);
      }
      var text = $info.find("li")["eq"](0)["html"]();
      if (text !== msg) {
        $info.find("li")["eq"](0)["html"](msg);
      }
      $info["show"]();
      $info.find("li")["off"]("click");
      $info.find("li")["off"]("tap");
      var hide = function () {
        $info["hide"]();
        thisObject.hideMask();
      };
      $info.find("li.btn1")["on"]("click", function (e) {
        hide();
        var strategy = $(".radios_list_c1 input[checked]")["val"]();
        callback1 && callback1(strategy);
      });
      $info.find("li.btn2")["on"]("click", function (e) {
        hide();
        var strategy = $(".radios_list_c1 input[checked]")["val"]();
        callback && callback(strategy);
      });
      $info["on"]("click", ".radios_list_c1", function (event) {
        $(this)["addClass"]("selected")["siblings"]()["removeClass"]("selected");
        $(this)["children"]("input")["trigger"]("click");
        event["stopPropagation"]();
        event["preventDefault"]();
        return false;
      });
      $info.find(".radios_list_c1")["on"]("click", "input", function (event) {
        $(this)["parent"]()["addClass"]("selected")["siblings"]()["removeClass"]("selected");
        $(".radios_list_c1 input[checked]")["removeAttr"]("checked");
        $(this)["attr"]("checked", true);
        event["stopPropagation"]();
        event["preventDefault"]();
        return false;
      });
    };
    thisObject.notifyMsg = function (container, selector, tipString, delay, callback) {
      clearTimeout(thisObject.notifyTimer);
      thisObject.notifyTimer = null;
      if (container.find(selector)["length"] != 0) {
        container.find(selector)["remove"]();
      }
      container["append"](tipString);
      if (!delay) {
        delay = 2000;
      }
      thisObject.notifyTimer = setTimeout(function () {
        container.find(selector)["remove"]();
      }, delay);
    };

    thisObject.hidemsgbox = function () {
      thisObject.hideMask();
      $("#__wifiMsgbox_info")["hide"]();
    };
    thisObject.confirmDialog = (function () {
      var tishiPngPath = (window["dxMapPath"] ? window["dxMapPath"] + "/" : "./") + "images/tishi.png";
      var templateHbs =
        '<div class="dialog-container confirm" id="confirm-container">' +
        '<div class="mask"><div class="dialog-wrapper"><img class="tip-image" src="' +
        tishiPngPath +
        '" style="width:48%;"><p class="title">{{title}}</p><p class="operation">{{#if hasCancel}}<span class="cancel">{{cancelText}}</span> {{/if}}<span class="commit">{{#if confirmText}}{{confirmText}}{{else}}确定{{/if}}</span> </p></div>' +
        "</div></div>";
      var _that = {};
      _that.show = function (data, $dom) {
        $("#confirm-container")["remove"]();
        if (typeof $dom == "string") {
          $dom = $($dom);
        } else if (!$dom) {
          $dom = $("body");
        }
        var $parent = $("<div></div>");
        thisObject.templateText(templateHbs, data, $parent);
        $dom["append"]($parent);
        $dom["find"](".tip-image")["css"]({
          width: "48%",
        });
        $dom["off"]("tap");
        $dom["one"]("tap", ".cancel", function () {
          $("#confirm-container")["hide"]();
          data["cancelCB"] && data["cancelCB"]();
        });
        $dom["one"]("tap", ".commit", function () {
          $("#confirm-container")["hide"]();
          data["commitCB"] && data["commitCB"]();
        });
      };
      _that.hide = function () {
        $("#confirm-container")["remove"]();
      };
      return _that;
    })();
    thisObject.loadingMask = (function () {
      var loadingHtml =
        '<div class="tip_mask" id="tip_mask"><span class="navi_loading" style="background-image: url(\'./../common_imgs/loading.gif\');"></span></div>';
      return {
        add: function () {
          $tip_mask = $("body")["find"]("#tip_mask");
          if ($tip_mask.length == 0) {
            $("body")["append"](loadingHtml);
          }
        },
        show: function (callback) {
          $tip_mask = $("body")["find"]("#tip_mask");
          if ($tip_mask.length == 0) {
            $("body")["append"](loadingHtml);
          }
          $("body")["find"]("#tip_mask")["show"]();
          // if(cancelTime){}
          callback && callback();
        },
        hide: function () {
          $("body")["find"]("#tip_mask")["hide"]();
        },
      };
    })();
    thisObject.notifyComponent = (function () {
      var __contentHtml = ""; //'<div class="tip_mask" id="tip_mask"><span class="navi_loading"></span></div>';
      var __notifyId = "";
      var __component;
      return {
        add: function (contentHtml, selector, hideTimeLater) {
          __notifyId = selector;
          __contentHtml = contentHtml;
          $tip_mask = $("body")["find"](selector);
          if ($tip_mask.length == 0) {
            $("body")["append"](contentHtml);
          }
          __component = $(__notifyId);
          __component["show"]();
          if (hideTimeLater) {
            setTimeout(function () {
              __component["hide"]();
            }, hideTimeLater);
          }
        },
        show: function (callback, contentHtml, selector, hideTimeLater) {
          if (contentHtml) {
            __contentHtml = contentHtml;
          }
          if (selector) {
            __notifyId = selector;
          }
          $tip_mask = $("body")["find"](__notifyId);
          if ($tip_mask.length == 0) {
            $("body")["append"](contentHtml);
          } else if (contentHtml) {
            $(__notifyId)["remove"]();
            $("body")["append"](contentHtml);
          }
          __component = $(__notifyId);
          __component["show"]();
          if (hideTimeLater) {
            setTimeout(function () {
              __component["hide"]();
            }, hideTimeLater);
          }

          callback && callback();
        },
        modify: function (childHtml) {},
        hide: function () {
          __component && __component["hide"]();
        },
      };
    })();
    thisObject.showTips = function (msg, msg2, callback) {
      var $info = $("#tipsMsgbox");
      if (!msg) {
        msg = "请开启蓝牙开关";
      }
      if (!msg2) {
        msg2 = "如何开启";
      }
      if ($info.length > 0 && $info["css"]("display") !== "none") return;
      if ($info.length == 0) {
        $info = $(
          ' <div id="tipsMsgbox"><span class="tipsMsg1">' +
            msg +
            '</span><span class="tipsMsg2">' +
            msg2 +
            '</span><span class="close"><i class="icon_gb-delete2"></i></span></div>',
        );
        $info["css"]({
          position: "absolute",
          top: "60px",
          left: "50%",
          transform: "translateX(-50%)",
          "z-index": 100,
          background: "rgba(0,0,0,0.5)",
          "border-radius": "5px",
          padding: "10px",
          color: "#fff",
          "font-size": "14px",
          "white-space": "nowrap",
        });
        $("body").append($info);
      } else {
        $info.find(".tipsMsg1").text(msg);
        $info.find(".tipsMsg2").text(msg2);
      }
      $info["show"]();
      $info.find(".close")["off"]("click");
      var hide = function () {
        $info["hide"]();
      };
      $info.find(".close")["on"]("click", function (e) {
        hide();
      });
      $info.find(".tipsMsg2")["on"]("click", function (e) {
        hide();
        callback && callback();
      });
    };
    thisObject.hideTops = function () {
      var $info = $("#tipsMsgbox");
      $info.hide();
    };
    thisObject.showInputConfirm = function (callback, cancle, btnName1) {
      var $info = $("#_inputConfirm_info");
      btnName1 = btnName1 || "确定";
      if ($info.length > 0 && $info["css"]("display") !== "none") return;
      thisObject.showMask2();
      if ($info.length == 0) {
        $info = $(
          ' <div id="_inputConfirm_info"><input type="tel" placeholder="请输入手机号">\n' +
            '        <div class="inputConfirmBtns">\n' +
            //'            <div class="btn_cancel">取消</div>\n' +
            '            <div class="btn_confirm">' +
            btnName1 +
            "</div>\n" +
            "        </div></div>",
        );

        $("body").append($info);
      }

      $info["show"]();
      $info.find(".btn_confirm")["off"]("click");
      var hide = function () {
        $info["hide"]();
        thisObject.hideMask2();
      };
      $info.find(".btn_confirm")["on"]("click", function (e) {
        var val = $info.find("input").val();
        callback && callback(val);
      });
      $info.find(".btn_cancel")["on"]("click", function (e) {
        cancle && cancle();
      });
    };
    thisObject.hideInputConfirm = function () {
      var $info = $("#_inputConfirm_info");
      $info["hide"]();
      thisObject.hideMask2();
    };
    return thisObject;
  })($);
  daxiapp["domUtil"] = (function () {
    var thisObject = {};
    thisObject.notices = [];
    thisObject.dialogInstances = [];
    thisObject.dialogWithModalInstances = [];
    /**
     * 创建一个Dom对象
     * @param {*} params
     * @param {*} parentNode
     * @returns
     */
    thisObject.createDom = function (params, parentNode) {
      var tagName = params["tagName"];
      var attrs = params["attrs"];
      var children = params["children"];
      var text = params["text"];
      var dom = document.createElement(tagName);
      var events = params["events"];
      for (var key in attrs) {
        dom.setAttribute(key, attrs[key]);
      }
      if (text) {
        var textNode = document.createTextNode(text);
        dom.appendChild(textNode);
      }
      if (children) {
        children.forEach(function (childParams) {
          thisObject.createDom(childParams, dom);
        });
      }
      if (parentNode) {
        parentNode.appendChild(dom);
      }
      if (events) {
        events.forEach(function (item) {
          // if (item["eventName"] == "touchend") {
          dom.addEventListener(item["eventName"], item["callback"]);
          // } else {
          //     dom.addEventListener("click", item["callback"], false);
          // }
        });
      }
      return dom;
    };
    thisObject.createLoading = function () {
      var that = {};
      var domBody = document.body;
      var parentStyle =
        "background: rgb(0,0,0,0.8);position: absolute;top: 0px;bottom: 0px;left: 0px;right: 0px;z-index: 999;padding: 0px;margin: 0px;text-align: center;";
      that.dom = thisObject.createDom(
        {
          tagName: "div",
          attrs: {
            class: "loading",
            style: parentStyle,
          },
          children: [
            {
              tagName: "span",
              attrs: {
                class: "loading_content icon-loading",
                style: "display: inline-block;font-size: 58px;margin-top: 50%;color: #036bc5;",
              },
            },
            {
              tagName: "style",
              text: ".loading_content {animation: loadingKF 2.5s linear infinite;animation-play-state: running;}@keyframes loadingKF {0% {transform: rotate(0deg);} 50% {transform: rotate(180deg);} 100% {transform: rotate(360deg);}}",
              attrs: {
                type: "text/css",
              },
            },
          ],
        },
        domBody,
      );

      that.show = function () {
        that.dom.style.display = "block";
      };
      that.hide = function () {
        if (that && that.dom) {
          that.dom.style.display = "none";
        }
      };
      that.remove = function () {
        domBody.removeChild(that.dom);
      };
      return that;
    };

    thisObject.tipNotice = function (text, showTime, closeCallback, styleOptions) {
      // var domId = "notice"+(new Date().getTime()%10000);
      var that = {};
      //var domStr = '<p class="toice"><span class="content">'+text+'</span></p>';
      var domBody = document.body;
      var style =
        "position:absolute;z-index:20;bottom:60%;text-align: center;font-size:18x;left:50%;border-radius:6px;transform: translateX(-50%);background: rgba(255,255,255,0.5);padding: 10px;display: inline-block;box-sizing: border-box;width: 60%;";
      if (styleOptions) {
        for (var key in styleOptions) {
          if (key != "subStyle") {
            style += key + ":" + styleOptions[key] + ";";
          }
        }
      }
      var subSytle = {};
      var subStyleStr = "";
      if (styleOptions && styleOptions["subStyle"]) {
        var _subStyle = styleOptions["subStyle"];
        for (var key2 in _subStyle) {
          subSytle[key2] = _subStyle[key2];
        }
      }
      for (var key in subSytle) {
        subStyleStr += key + ":" + subSytle[key] + ";";
      }

      that.dom = thisObject.createDom(
        {
          tagName: "p",
          attrs: {
            class: "notice dxnotice",
            style: style,
          },
          children: [
            {
              tagName: "span",
              text: text,
              attrs: {
                style: subStyleStr,
              },
            },
          ],
        },
        domBody,
      );
      that.show = true;
      that.domDisplay = getComputedStyle(that.dom)["display"];
      that.show = function () {
        if (that.domDisplay == "none") {
          that.dom.style.display = "block";
        } else {
          that.dom.style.display = that.domDisplay;
        }
        that.show = true;
      };
      that.hide = function () {
        if (that && that.dom) {
          that.dom.style.display = "none";
          that.show = false;
        }
      };
      that.isShow = function () {
        return that.show;
      };
      that.removed = function () {
        if (!that) {
          return true;
        }
        return that.hasRemoved ? that.hasRemoved : false;
      };
      if (showTime) {
        setTimeout(function () {
          closeCallback && closeCallback();
          document.body.removeChild(that.dom);
          that.show = false;
          that.hasRemoved = true;
          that = null;
        }, showTime);
      }
      return that;
    };

    thisObject.createMessageDom = function (text, styleOptions, closeCB, extendChildren, parentDom) {
      parentDom = parentDom || document.body;
      //padding: 15px 10px;
      var style = "position:absolute;z-index:100;margin:0 auto;bottom:40%;width:100%;text-align: center;z-index: 100; font-size: 1.2rem;";
      if (styleOptions) {
        for (var key in styleOptions) {
          style += key + ":" + styleOptions[key] + ";";
        }
      }
      var domArr = [
        {
          tagName: "span",
          attrs: {
            class: "close icon-error",
            style: "position: absolute;right: 2px;top: 2px;font-size: 1.4rem;padding:4px;color: #525354;font-weight: 600;",
          },
          events: [
            {
              eventName: "click",
              callback: function () {
                closeCB && closeCB();
                if (parentDom && parentDom != document.body) {
                  document.body.removeChild(parentDom);
                } else {
                  document.body.removeChild(dom);
                }
              },
            },
          ],
        },
        {
          tagName: "p",
          attrs: {
            class: "messageBody",
            style:
              "text-align: center;line-height: 1.5;margin-top: 0 auto;min-height:3em;display:flex;align-items: center;justify-content:center;white-space: break-spaces;" +
              (extendChildren ? "padding:10px;margin-top: 12px;" : "padding: 6px"),
          },
          children: [{ tagName: "span", text: text }],
        },
      ];
      if (daxiapp["utils"].isArray(extendChildren)) {
        extendChildren.forEach(function (item) {
          domArr.push(item);
        });
      } else if (extendChildren) {
        domArr.push(extendChildren);
      }
      var dom = thisObject.createDom(
        {
          tagName: "div",
          attrs: {
            class: "tipMessage dxtipMessage",
            style: style,
          },
          children: [
            {
              tagName: "div",
              attrs: {
                class: "message_container",
                style:
                  "background:rgba(255,255,255,1);border-radius:8px;display: inline-block;color:rgb(78,78,78);position: relative;min-width: 260px;max-width: 76%;box-shadow: -1px -1px 2px #ccc, 1px 1px 2px #ccc;",
              },
              children: domArr,
            },
          ],
        },
        parentDom,
      );
      return dom;
    };

    thisObject.tipMessage = function (text, showTime, closeCallback, styleOptions) {
      var that = {};
      // var domBody = document.body;
      that.dom = thisObject.createMessageDom(text, styleOptions, function () {
        closeCallback && closeCallback();
        clearTimeout(that.timer);
        that = null;
      });
      that.domDisplay = getComputedStyle(that.dom)["display"];
      that.show = function () {
        if (that.domDisplay == "none") {
          that.dom.style.display = "block";
        } else {
          that.dom.style.display = that.domDisplay;
        }
      };
      that.hide = function () {
        if (that && that.dom) {
          that.dom.style.display = "none";
        }
      };

      if (showTime) {
        that.timer = setTimeout(function () {
          if (that && that.dom) {
            closeCallback && closeCallback();
            document.body.removeChild(that.dom);
            that = null;
          }
        }, showTime);
      }
    };
    thisObject.geneDialogdom = function (params, domBody, that, parentDom) {
      var text = params["text"],
        confirmCB = params["confirmCB"],
        cancelCB = params["cancelCB"],
        cancelBtnText = params["btn1"] || "",
        comfirmBtnText = params["btn2"] || "确定",
        styleOptions = params["style"];
      var contentInfo = {
        tagName: "p",
        attrs: {
          class: "dialogWrapper",
          style: "display: flex;justify-content: space-around;border-top: 1px solid #ccc;line-height: 2;font-size: 1.4rem;",
        },
        children: [],
      };

      if (cancelBtnText) {
        var cancelContent = {
          tagName: "span",
          text: cancelBtnText,
          attrs: {
            class: "cancel",
            style: "display: inline-block;flex: 1 1 auto;text-align: center;padding: 8px 0px 5px 0px;border-right: 1px solid #ccc;",
          },
          events: [
            {
              eventName: "click",
              callback: function () {
                cancelCB && cancelCB();
                parentDom.removeChild(that.dom);
              },
            },
          ],
        };
        contentInfo["children"].push(cancelContent);
      }
      if (confirmCB || params["btn2"]) {
        var comfirmContent = {
          tagName: "span",
          text: comfirmBtnText,
          attrs: {
            class: "commit",
            style: "display: inline-block;flex: 1 1 auto;text-align: center;padding: 8px 0px 5px 0px;color: rgb(1,123,214);",
          },
          events: [
            {
              eventName: "click",
              callback: function () {
                confirmCB && confirmCB();
                that.dom.remove();
              },
            },
          ],
        };
        contentInfo["children"].push(comfirmContent);
      }
      if (contentInfo["children"].length == 2) {
        contentInfo["children"].forEach(function (item) {
          item["attrs"]["style"] += ";width:50%;";
        });
      }
      if (!styleOptions) {
        styleOptions = {};
      }
      styleOptions["margin-top"] = "10px";
      return thisObject.createMessageDom(text, styleOptions, cancelCB, contentInfo, domBody);
    };
    thisObject.dialog = function (params) {
      var that = {};
      var domBody = document.body;

      that.dom = thisObject.geneDialogdom(params, domBody, that, domBody);
      if (params["content"]) {
        if (typeof params["content"] == "string") {
          that.dom.find(".dialogWrapper")["insertBefore"](params["content"]);
        }
      }
      that.domDisplay = getComputedStyle(that.dom)["display"];
      that.show = function () {
        if (that.domDisplay == "none") {
          that.dom.style.display = "block";
        } else {
          that.dom.style.display = that.domDisplay;
        }
      };
      that.hide = function () {
        if (that && that.dom) {
          that.dom.style.display = "none";
        }
      };
      that.close = function () {
        domBody.removeChild(that.dom);
        if (params["cancelCB"]) {
          params["cancelCB"]();
        }
      };
      return that;
    };
    thisObject.dialogWithModal = function (params) {
      var that = {};
      var domBody = document.body;
      var wrapper = {
        tagName: "div",
        attrs: {
          class: "wrapper",
          style: "position:absolute;top:0px;left:0px;right:0px;bottom:0px;background:rgba(0,0,0,0.5);z-index: 9999;",
        },
      };
      that.dom = thisObject.createDom(wrapper, domBody);

      thisObject.geneDialogdom(params, that.dom, that, domBody);
      that.domDisplay = getComputedStyle(that.dom)["display"];
      that.show = function () {
        if (that.domDisplay == "none") {
          that.dom.style.display = "block";
        } else {
          that.dom.style.display = that.domDisplay;
        }
      };
      that.hide = function () {
        if (that && that.dom) {
          that.dom.style.display = "none";
        }
      };
      that.close = function () {
        that.dom.remove();
      };
      return that;
    };
    thisObject.createListView = function (params, parentDom, update) {
      var confirmCB = params["confirmCB"],
        cancelCB = params["cancelCB"],
        onItemSelected = params["onItemSelected"];
      var list = params["list"];
      styleOptions = params["style"];
      var contentInfo = {
        tagName: "ul",
        attrs: {
          class: "component_list",
          style:
            "display: flex;justify-content: space-around;font-size: 1.4rem;flex-direction: column;background: #fff;border-radius: 6px;max-height: 80%;overflow: scroll;",
        },
        children: [],
      };
      list.forEach(function (item) {
        var itemDom = {
          tagName: "li",
          attrs: {
            class: "component_item",
            // "style":"display: flex;justify-content: space-around;border-top: 1px solid #ccc;line-height: 2;font-size: 1.4rem;"
          },
          text: item["text"],
          events: [
            {
              eventName: "click",
              callback: function (e) {
                onItemSelected && onItemSelected(e);
              },
            },
          ],
        };
        for (var key in item) {
          if (item[key] != undefined && key != "text") {
            itemDom["attrs"]["data" + "-" + key] = item[key];
          }
        }
        contentInfo["children"].push(itemDom);
      });
      var wrapperInfo = {
        tagName: "div",
        attrs: {
          class: "content",
          style: "text-align: center;vertical-align: middle;display: flex;flex-direction: column;height: 100%;justify-content: center;align-items: center;",
        },
        children: [contentInfo],
      };
      if (update) {
        parentDom.html(wrapperInfo);
      } else {
        return thisObject.createDom(wrapperInfo, parentDom, update);
      }
    };
    thisObject.listViewWithModal = function (params) {
      var that = {};
      var domBody = document.body;
      var wrapper = {
        tagName: "div",
        attrs: {
          class: "wrapper",
          style: "position:absolute;top:0px;left:0px;right:0px;bottom:0px;background:rgba(0,0,0,0.5);z-index: 9999;",
        },
      };
      that.dom = thisObject.createDom(wrapper, domBody);

      thisObject.createListView(params, that.dom);
      that.domDisplay = getComputedStyle(that.dom)["display"];
      that.updateData = function (params) {
        that.dom.children[0].remove();
        thisObject.createListView(params, that.dom);
        // thisObject.createListView({"list":datas},that.dom,true);
      };
      that.show = function () {
        if (that.domDisplay == "none") {
          that.dom.style.display = "block";
        } else {
          that.dom.style.display = that.domDisplay;
        }
      };
      that.hide = function () {
        that.dom.style.display = "none";
      };

      return that;
    };
    return thisObject;
  })();
  daxiapp["dom"] = DXDom;
})(window, $);
